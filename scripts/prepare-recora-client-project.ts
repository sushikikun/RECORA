import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import * as fs from "node:fs/promises";
import * as net from "node:net";
import * as path from "node:path";
import * as process from "node:process";

import { assertRecoraDbWriteAllowed } from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const PRIORITIES = new Set(["high", "medium", "low"]);

type Row = Record<string, string | null>;
type Priority = "high" | "medium" | "low";
type BrandType = "primary" | "competitor";
type PgMessage = { type: string; payload: Buffer };

type CliOptions = {
  execute: boolean;
  inputPath: string | null;
  printSample: boolean;
  databaseUrl: string;
};

type BrandInput = {
  name: string;
  reading: string | null;
  domain: string | null;
  aliases: string[];
  category: string | null;
  description: string | null;
};

type PersonaInput = {
  key: string;
  name: string;
  segment: string | null;
  weight: number;
  jobs: string[];
  painPoints: string[];
};

type TopicInput = {
  key: string;
  name: string;
  intent: string | null;
  priority: Priority;
  weight: number;
};

type PromptInput = {
  text: string;
  topic: string;
  persona: string | null;
  intent: string | null;
  buyerStage: string | null;
  priority: Priority;
};

type ClientProjectConfig = {
  organization: {
    slug: string;
    name: string;
  };
  project: {
    slug: string;
    name: string;
    workspaceName: string | null;
    language: string;
    region: string;
    defaultPeriod: string | null;
  };
  primaryBrand: BrandInput;
  competitors: BrandInput[];
  personas: PersonaInput[];
  topics: TopicInput[];
  prompts: PromptInput[];
};

type PlannedBrand = BrandInput & {
  id: string;
  brandType: BrandType;
};

type PlannedPersona = PersonaInput & {
  id: string;
};

type PlannedTopic = TopicInput & {
  id: string;
};

type PlannedPrompt = PromptInput & {
  id: string;
  topicId: string;
  personaId: string | null;
};

type BootstrapPlan = {
  organization: {
    slug: string;
    name: string;
    organizationType: "client";
    dataEnvironment: "production";
    isInternal: false;
    isDemo: false;
  };
  project: ClientProjectConfig["project"];
  brands: PlannedBrand[];
  personas: PlannedPersona[];
  topics: PlannedTopic[];
  prompts: PlannedPrompt[];
};

type ExistingSlugCheck = {
  status: "checked" | "unavailable";
  organizationSlugExists: boolean | null;
  projectSlugExists: boolean | null;
  note: string | null;
};

type ExistingSlugRow = Row & {
  slug: string;
};

const SAMPLE_CONFIG = {
  organization: {
    slug: "example-client",
    name: "Example Client"
  },
  project: {
    slug: "example-client-ai-search",
    name: "Example Client AI Search Report",
    workspaceName: "Example Client Workspace",
    language: "ja",
    region: "JP",
    defaultPeriod: "2026-Q3"
  },
  primaryBrand: {
    name: "Example Brand",
    reading: "エグザンプルブランド",
    domain: "example-brand.jp",
    aliases: ["Example", "Example Brand"],
    category: "B2B SaaS",
    description: "Primary brand for Phase 1 customer report bootstrap."
  },
  competitors: [
    {
      name: "Competitor A",
      reading: null,
      domain: null,
      aliases: ["Competitor A"],
      category: "B2B SaaS",
      description: "Competitor to compare in non-branded AI search prompts."
    }
  ],
  personas: [
    {
      key: "marketing-lead",
      name: "マーケティング責任者",
      segment: "B2B marketing",
      weight: 1,
      jobs: ["AI検索でのブランド表示を確認する", "競合との見え方を比較する"],
      painPoints: ["AI回答上の存在感が見えにくい"]
    }
  ],
  topics: [
    {
      key: "ai-search-visibility",
      name: "AI検索での表示状況",
      intent: "non-branded discovery and comparison",
      priority: "high",
      weight: 1
    }
  ],
  prompts: [
    {
      text: "AI検索でブランドの表示状況を確認できるツールを比較してください。",
      topic: "ai-search-visibility",
      persona: "marketing-lead",
      intent: "non_branded_comparison",
      buyerStage: "comparison",
      priority: "high"
    }
  ]
} satisfies ClientProjectConfig;

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.printSample) {
    console.log(JSON.stringify(SAMPLE_CONFIG, null, 2));
    return;
  }

  if (!options.inputPath) {
    throw new Error("Missing --input. Use --print-sample to see the required JSON format.");
  }

  const config = normalizeConfig(JSON.parse(stripJsonBom(await fs.readFile(options.inputPath, "utf8"))));
  const plan = buildBootstrapPlan(config);
  const target = assertRecoraDbWriteAllowed({
    databaseUrl: options.databaseUrl,
    operation: "prepare-recora-client-project --execute",
    projectSlug: plan.project.slug,
    isWrite: false,
    allowNonLocalDb: false,
    confirmNonLocalDbWrite: null
  });

  if (options.execute && !target.isLocal) {
    throw new Error(
      [
        "Refusing prepare-recora-client-project --execute against a non-local database.",
        `targetHost=${target.host}${target.port ? `:${target.port}` : ""}`,
        "This Phase 1 bootstrap script is local-only for writes. Review the dry-run output before any separately approved production operation."
      ].join(" ")
    );
  }

  const existingSlugCheck = await tryCheckExistingSlugs(options.databaseUrl, plan);
  const preview = renderPreview(options, plan, target, existingSlugCheck);
  console.log(JSON.stringify(preview, null, 2));

  if (!options.execute) {
    console.log("Dry-run complete. DB writes: 0");
    return;
  }

  if (existingSlugCheck.status !== "checked") {
    throw new Error("Cannot execute because existing slug check did not complete.");
  }
  if (existingSlugCheck.organizationSlugExists || existingSlugCheck.projectSlugExists) {
    throw new Error("Cannot execute because organization or project slug already exists. This script never overwrites existing slugs.");
  }

  const db = new LocalPostgresClient(options.databaseUrl);
  await db.connect();
  try {
    const applySummary = await insertPlan(db, plan);
    console.log(JSON.stringify({ mode: "execute-local", applySummary }, null, 2));
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    execute: false,
    inputPath: null,
    printSample: false,
    databaseUrl: process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.execute = false;
      continue;
    }
    if (arg === "--input") {
      options.inputPath = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.slice("--input=".length);
      continue;
    }
    if (arg === "--print-sample") {
      options.printSample = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function stripJsonBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function normalizeConfig(raw: unknown): ClientProjectConfig {
  const root = asRecord(raw, "root");
  const organization = asRecord(root.organization, "organization");
  const project = asRecord(root.project, "project");
  const primaryBrand = normalizeBrand(asRecord(root.primaryBrand, "primaryBrand"), "primaryBrand");
  const competitors = asArray(root.competitors, "competitors").map((item, index) =>
    normalizeBrand(asRecord(item, `competitors[${index}]`), `competitors[${index}]`)
  );
  const personas = asArray(root.personas, "personas").map((item, index) =>
    normalizePersona(asRecord(item, `personas[${index}]`), `personas[${index}]`)
  );
  const topics = asArray(root.topics, "topics").map((item, index) =>
    normalizeTopic(asRecord(item, `topics[${index}]`), `topics[${index}]`)
  );
  const prompts = asArray(root.prompts, "prompts").map((item, index) =>
    normalizePrompt(asRecord(item, `prompts[${index}]`), `prompts[${index}]`)
  );

  const normalized: ClientProjectConfig = {
    organization: {
      slug: readSlug(organization, "slug", "organization.slug"),
      name: readRequiredString(organization, "name", "organization.name")
    },
    project: {
      slug: readSlug(project, "slug", "project.slug"),
      name: readRequiredString(project, "name", "project.name"),
      workspaceName: readOptionalString(project, "workspaceName"),
      language: readOptionalString(project, "language") ?? "ja",
      region: readOptionalString(project, "region") ?? "JP",
      defaultPeriod: readOptionalString(project, "defaultPeriod")
    },
    primaryBrand,
    competitors,
    personas,
    topics,
    prompts
  };

  validateConfig(normalized);
  return normalized;
}

function normalizeBrand(record: Record<string, unknown>, label: string): BrandInput {
  return {
    name: readRequiredString(record, "name", `${label}.name`),
    reading: readOptionalString(record, "reading"),
    domain: readOptionalString(record, "domain"),
    aliases: readStringArray(record, "aliases"),
    category: readOptionalString(record, "category"),
    description: readOptionalString(record, "description")
  };
}

function normalizePersona(record: Record<string, unknown>, label: string): PersonaInput {
  const name = readRequiredString(record, "name", `${label}.name`);
  return {
    key: readOptionalString(record, "key") ?? name,
    name,
    segment: readOptionalString(record, "segment"),
    weight: readPositiveNumber(record, "weight", 1),
    jobs: readStringArray(record, "jobs"),
    painPoints: readStringArray(record, "painPoints")
  };
}

function normalizeTopic(record: Record<string, unknown>, label: string): TopicInput {
  const name = readRequiredString(record, "name", `${label}.name`);
  return {
    key: readOptionalString(record, "key") ?? name,
    name,
    intent: readOptionalString(record, "intent"),
    priority: readPriority(record, "priority"),
    weight: readPositiveNumber(record, "weight", 1)
  };
}

function normalizePrompt(record: Record<string, unknown>, label: string): PromptInput {
  return {
    text: readRequiredString(record, "text", `${label}.text`),
    topic: readRequiredString(record, "topic", `${label}.topic`),
    persona: readOptionalString(record, "persona"),
    intent: readOptionalString(record, "intent"),
    buyerStage: readOptionalString(record, "buyerStage"),
    priority: readPriority(record, "priority")
  };
}

function validateConfig(config: ClientProjectConfig) {
  if (config.competitors.length === 0) throw new Error("At least one competitor brand is required.");
  if (config.personas.length === 0) throw new Error("At least one persona is required.");
  if (config.topics.length === 0) throw new Error("At least one topic is required.");
  if (config.prompts.length === 0) throw new Error("At least one prompt is required.");

  assertUnique([config.primaryBrand.name, ...config.competitors.map((item) => item.name)], "brand names");
  assertUnique(config.personas.map((item) => item.key), "persona keys");
  assertUnique(config.personas.map((item) => item.name), "persona names");
  assertUnique(config.topics.map((item) => item.key), "topic keys");
  assertUnique(config.topics.map((item) => item.name), "topic names");

  const topicRefs = new Set(config.topics.flatMap((topic) => [topic.key, topic.name]));
  const personaRefs = new Set(config.personas.flatMap((persona) => [persona.key, persona.name]));
  for (const prompt of config.prompts) {
    if (!topicRefs.has(prompt.topic)) throw new Error(`Prompt topic reference was not found: ${prompt.topic}`);
    if (prompt.persona && !personaRefs.has(prompt.persona)) {
      throw new Error(`Prompt persona reference was not found: ${prompt.persona}`);
    }
  }
}

function buildBootstrapPlan(config: ClientProjectConfig): BootstrapPlan {
  const namespace = config.project.slug;
  const topics = config.topics.map((topic) => ({
    ...topic,
    id: stableUuid(namespace, `topic:${topic.key}`)
  }));
  const personas = config.personas.map((persona) => ({
    ...persona,
    id: stableUuid(namespace, `persona:${persona.key}`)
  }));
  const topicIdByRef = new Map(topics.flatMap((topic) => [[topic.key, topic.id], [topic.name, topic.id]]));
  const personaIdByRef = new Map(personas.flatMap((persona) => [[persona.key, persona.id], [persona.name, persona.id]]));

  return {
    organization: {
      slug: config.organization.slug,
      name: config.organization.name,
      organizationType: "client",
      dataEnvironment: "production",
      isInternal: false,
      isDemo: false
    },
    project: config.project,
    brands: [
      {
        ...config.primaryBrand,
        id: stableUuid(namespace, `brand:primary:${config.primaryBrand.name}`),
        brandType: "primary"
      },
      ...config.competitors.map((competitor) => ({
        ...competitor,
        id: stableUuid(namespace, `brand:competitor:${competitor.name}`),
        brandType: "competitor" as const
      }))
    ],
    personas,
    topics,
    prompts: config.prompts.map((prompt) => ({
      ...prompt,
      id: stableUuid(namespace, `prompt:${prompt.text}`),
      topicId: requiredMapValue(topicIdByRef, prompt.topic, "topic"),
      personaId: prompt.persona ? requiredMapValue(personaIdByRef, prompt.persona, "persona") : null
    }))
  };
}

async function tryCheckExistingSlugs(databaseUrl: string, plan: BootstrapPlan): Promise<ExistingSlugCheck> {
  const db = new LocalPostgresClient(databaseUrl);
  try {
    await db.connect();
    const organizations = await db.query<ExistingSlugRow>(`
        select slug
        from public.organizations
        where slug = ${lit(plan.organization.slug)}
        limit 1
      `);
    const projects = await db.query<ExistingSlugRow>(`
        select slug
        from public.projects
        where slug = ${lit(plan.project.slug)}
        limit 1
      `);
    return {
      status: "checked",
      organizationSlugExists: organizations.length > 0,
      projectSlugExists: projects.length > 0,
      note: null
    };
  } catch (error) {
    return {
      status: "unavailable",
      organizationSlugExists: null,
      projectSlugExists: null,
      note: sanitizeErrorMessage(error)
    };
  } finally {
    db.end();
  }
}

function renderPreview(
  options: CliOptions,
  plan: BootstrapPlan,
  target: { host: string; port: string; isLocal: boolean },
  existingSlugCheck: ExistingSlugCheck
) {
  return {
    mode: options.execute ? "execute-local-requested" : "dry-run",
    inputFile: options.inputPath ? path.relative(process.cwd(), path.resolve(options.inputPath)) : null,
    databaseTarget: {
      host: target.host,
      port: target.port || null,
      isLocal: target.isLocal,
      connectionStringHidden: true
    },
    writePolicy: {
      dryRunDefault: true,
      writesOnDryRun: 0,
      executeFlagRequired: "--execute",
      executeAllowedOnlyWhenDatabaseIsLocal: true,
      nonLocalDatabaseWritesAllowed: false,
      openAiMeasurementRunsTriggered: false,
      schemaOrMigrationChanges: false
    },
    customerDataBoundary: {
      organization_type: plan.organization.organizationType,
      data_environment: plan.organization.dataEnvironment,
      is_internal: plan.organization.isInternal,
      is_demo: plan.organization.isDemo,
      reportReadyGateMeaning: "customer_data only when organization_type=client, data_environment=production, and is_demo=false",
      demoLocalSamplePolicy: "demo/local/sample projects remain fail-closed and must not be reused for real customer data"
    },
    existingSlugCheck,
    plannedRecords: {
      organizations: [plan.organization],
      projects: [plan.project],
      brands: plan.brands.map(({ id, brandType, name, reading, domain, aliases, category, description }) => ({
        id,
        brand_type: brandType,
        name,
        reading,
        domain,
        aliases,
        category,
        description
      })),
      personas: plan.personas.map(({ id, key, name, segment, weight, jobs, painPoints }) => ({
        id,
        key,
        name,
        segment,
        weight,
        jobs,
        pain_points: painPoints
      })),
      topics: plan.topics.map(({ id, key, name, intent, priority, weight }) => ({
        id,
        key,
        name,
        intent,
        priority,
        weight
      })),
      prompts: plan.prompts.map(({ id, text, topic, persona, intent, buyerStage, priority, topicId, personaId }) => ({
        id,
        text,
        topic,
        persona,
        intent,
        buyer_stage: buyerStage,
        priority,
        topic_id: topicId,
        persona_id: personaId
      }))
    }
  };
}

async function insertPlan(db: LocalPostgresClient, plan: BootstrapPlan) {
  await db.query("begin");
  try {
    const organizationId = await insertOrganization(db, plan);
    const projectId = await insertProject(db, organizationId, plan);
    for (const brand of plan.brands) await insertBrand(db, projectId, brand);
    for (const persona of plan.personas) await insertPersona(db, projectId, persona);
    for (const topic of plan.topics) await insertTopic(db, projectId, topic);
    for (const prompt of plan.prompts) await insertPrompt(db, projectId, prompt);
    await db.query("commit");
    return {
      organizationsInserted: 1,
      projectsInserted: 1,
      brandsInserted: plan.brands.length,
      personasInserted: plan.personas.length,
      topicsInserted: plan.topics.length,
      promptsInserted: plan.prompts.length
    };
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function insertOrganization(db: LocalPostgresClient, plan: BootstrapPlan) {
  const rows = await db.query<{ id: string }>(`
    insert into public.organizations (
      slug, name, organization_type, data_environment, is_internal, is_demo
    )
    values (
      ${lit(plan.organization.slug)},
      ${lit(plan.organization.name)},
      'client',
      'production',
      false,
      false
    )
    returning id::text as id
  `);
  return single(rows, `insert organization ${plan.organization.slug}`).id;
}

async function insertProject(db: LocalPostgresClient, organizationId: string, plan: BootstrapPlan) {
  const rows = await db.query<{ id: string }>(`
    insert into public.projects (organization_id, slug, name, workspace_name, language, region, default_period)
    values (
      ${uuid(organizationId)},
      ${lit(plan.project.slug)},
      ${lit(plan.project.name)},
      ${nullable(plan.project.workspaceName)},
      ${lit(plan.project.language)},
      ${lit(plan.project.region)},
      ${nullable(plan.project.defaultPeriod)}
    )
    returning id::text as id
  `);
  return single(rows, `insert project ${plan.project.slug}`).id;
}

async function insertBrand(db: LocalPostgresClient, projectId: string, brand: PlannedBrand) {
  await db.query(`
    insert into public.brands (
      id, project_id, brand_type, name, reading, domain, aliases, category, description, is_active
    )
    values (
      ${uuid(brand.id)},
      ${uuid(projectId)},
      ${lit(brand.brandType)},
      ${lit(brand.name)},
      ${nullable(brand.reading)},
      ${nullable(brand.domain)},
      ${jsonb(uniqueStrings([brand.name, ...brand.aliases]))},
      ${nullable(brand.category)},
      ${nullable(brand.description)},
      true
    )
  `);
}

async function insertPersona(db: LocalPostgresClient, projectId: string, persona: PlannedPersona) {
  await db.query(`
    insert into public.personas (
      id, project_id, name, segment, weight, jobs, pain_points, is_active
    )
    values (
      ${uuid(persona.id)},
      ${uuid(projectId)},
      ${lit(persona.name)},
      ${nullable(persona.segment)},
      ${num(persona.weight)},
      ${jsonb(persona.jobs)},
      ${jsonb(persona.painPoints)},
      true
    )
  `);
}

async function insertTopic(db: LocalPostgresClient, projectId: string, topic: PlannedTopic) {
  await db.query(`
    insert into public.topics (id, project_id, name, intent, priority, weight, is_active)
    values (
      ${uuid(topic.id)},
      ${uuid(projectId)},
      ${lit(topic.name)},
      ${nullable(topic.intent)},
      ${lit(topic.priority)},
      ${num(topic.weight)},
      true
    )
  `);
}

async function insertPrompt(db: LocalPostgresClient, projectId: string, prompt: PlannedPrompt) {
  await db.query(`
    insert into public.prompts (
      id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active
    )
    values (
      ${uuid(prompt.id)},
      ${uuid(projectId)},
      ${uuid(prompt.topicId)},
      ${nullableUuid(prompt.personaId)},
      ${lit(prompt.text)},
      ${nullable(prompt.intent)},
      ${nullable(prompt.buyerStage)},
      ${lit(prompt.priority)},
      true
    )
  `);
}

function readNext(args: string[], index: number, arg: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
  return value;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  throw new Error(`${label} must be an object.`);
}

function asArray(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) return value;
  throw new Error(`${label} must be an array.`);
}

function readRequiredString(record: Record<string, unknown>, key: string, label: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required.`);
  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`${key} must be a string when provided.`);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readSlug(record: Record<string, unknown>, key: string, label: string) {
  const value = readRequiredString(record, key, label);
  if (!SLUG_PATTERN.test(value)) {
    throw new Error(`${label} must be lowercase kebab-case and match ${SLUG_PATTERN.source}.`);
  }
  return value;
}

function readStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${key} must be an array of strings.`);
  return uniqueStrings(value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) throw new Error(`${key}[${index}] must be a non-empty string.`);
    return item.trim();
  }));
}

function readPositiveNumber(record: Record<string, unknown>, key: string, fallback: number) {
  const value = record[key];
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be a positive number when provided.`);
  }
  return value;
}

function readPriority(record: Record<string, unknown>, key: string): Priority {
  const value = readOptionalString(record, key) ?? "medium";
  if (!PRIORITIES.has(value)) throw new Error(`${key} must be high, medium, or low.`);
  return value as Priority;
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (seen.has(normalized)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(normalized);
  }
}

function requiredMapValue(map: Map<string, string>, key: string, label: string) {
  const value = map.get(key);
  if (!value) throw new Error(`Missing ${label} reference: ${key}`);
  return value;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stableUuid(namespace: string, name: string) {
  const hex = createHash("sha256").update(`recora-client:${namespace}:${name}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32)
  ].join("-");
}

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function nullable(value: string | null | undefined) {
  return value ? lit(value) : "null";
}

function num(value: number) {
  return Number.isFinite(value) ? String(value) : "null";
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

function nullableUuid(value: string | null | undefined) {
  return value ? uuid(value) : "null";
}

function jsonb(value: unknown) {
  return `${lit(JSON.stringify(value))}::jsonb`;
}

function single<T>(rows: T[], label: string): T {
  if (rows.length !== 1) throw new Error(`${label} returned ${rows.length} rows.`);
  return rows[0]!;
}

function sanitizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.replace(/postgres:\/\/[^@\s]+@/gi, "postgres://***@");
  return String(error).replace(/postgres:\/\/[^@\s]+@/gi, "postgres://***@");
}

class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) {
    this.url = new URL(databaseUrl);
  }

  async connect(timeoutMs = 3_000) {
    const socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port || 5432) });
    this.socket = socket;
    socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      for (const waiter of this.waiters.splice(0)) waiter();
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error(`PostgreSQL connection timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      const cleanup = () => {
        clearTimeout(timeout);
        socket.off("connect", onConnect);
        socket.off("error", onError);
      };
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      socket.once("connect", onConnect);
      socket.once("error", onError);
    });
    this.sendStartup();
    await this.authenticate();
  }

  end() {
    if (!this.socket || this.socket.destroyed) return;
    this.sendMessage("X", Buffer.alloc(0));
    this.socket.end();
  }

  async query<T extends Row = Row>(queryText: string): Promise<T[]> {
    this.sendMessage("Q", Buffer.from(`${queryText}\0`, "utf8"));
    const fields: string[] = [];
    const rows: T[] = [];
    while (true) {
      const message = await this.readMessage();
      if (message.type === "T") fields.splice(0, fields.length, ...parseRowDescription(message.payload));
      else if (message.type === "D") rows.push(parseDataRow<T>(message.payload, fields));
      else if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      else if (message.type === "Z") return rows;
    }
  }

  private sendStartup() {
    const params = Buffer.from(`user\0${this.user}\0database\0${this.database}\0client_encoding\0UTF8\0\0`, "utf8");
    const protocol = Buffer.alloc(4);
    protocol.writeInt32BE(196608, 0);
    this.sendRaw(Buffer.concat([int32(8 + params.length), protocol, params]));
  }

  private async authenticate() {
    while (true) {
      const message = await this.readMessage();
      if (message.type === "R") {
        const code = message.payload.readInt32BE(0);
        if (code === 0 || code === 11 || code === 12) continue;
        if (code === 3) {
          this.sendPassword(this.password);
          continue;
        }
        if (code === 5) {
          this.sendPassword(buildMd5Password(this.user, this.password, message.payload.subarray(4, 8)));
          continue;
        }
        if (code === 10) {
          await this.handleScram(message.payload.subarray(4));
          continue;
        }
        throw new Error(`Unsupported PostgreSQL authentication request: ${code}`);
      }
      if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      if (message.type === "Z") return;
    }
  }

  private async handleScram(payload: Buffer) {
    const mechanisms = payload.toString("utf8").split("\0").filter(Boolean);
    if (!mechanisms.includes("SCRAM-SHA-256")) throw new Error(`Unsupported SASL mechanisms: ${mechanisms.join(", ")}`);

    const clientNonce = randomBytes(18).toString("base64url");
    const clientFirstBare = `n=*,r=${clientNonce}`;
    this.sendSaslInitial("SCRAM-SHA-256", `n,,${clientFirstBare}`);

    const serverFirstMessage = await this.readMessage();
    if (serverFirstMessage.type === "E") throw new Error(parseErrorResponse(serverFirstMessage.payload));
    if (serverFirstMessage.type !== "R" || serverFirstMessage.payload.readInt32BE(0) !== 11) {
      throw new Error("Unexpected PostgreSQL SASL first response.");
    }

    const serverFirst = serverFirstMessage.payload.subarray(4).toString("utf8");
    const attributes = parseScramAttributes(serverFirst);
    const serverNonce = attributes.r;
    const salt = attributes.s ? Buffer.from(attributes.s, "base64") : null;
    const iterations = Number(attributes.i);
    if (!serverNonce || !serverNonce.startsWith(clientNonce) || !salt || !Number.isFinite(iterations)) {
      throw new Error("Invalid PostgreSQL SCRAM challenge.");
    }

    const clientFinalWithoutProof = `c=biws,r=${serverNonce}`;
    const authMessage = `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(`${clientFinalWithoutProof},p=${xorBuffers(clientKey, signature).toString("base64")}`);
  }

  private sendPassword(password: string) {
    this.sendMessage("p", Buffer.from(`${password}\0`, "utf8"));
  }

  private sendSaslInitial(mechanism: string, response: string) {
    const mechanismBuffer = Buffer.from(`${mechanism}\0`, "utf8");
    const responseBuffer = Buffer.from(response, "utf8");
    this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer]));
  }

  private sendSaslResponse(response: string) {
    this.sendMessage("p", Buffer.from(response, "utf8"));
  }

  private sendMessage(type: string, payload: Buffer) {
    this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload]));
  }

  private sendRaw(payload: Buffer) {
    if (!this.socket || this.socket.destroyed) throw new Error("PostgreSQL socket is not connected.");
    this.socket.write(payload);
  }

  private async readMessage(): Promise<PgMessage> {
    await this.waitForBytes(5);
    const type = this.buffer.subarray(0, 1).toString("utf8");
    const length = this.buffer.readInt32BE(1);
    const totalLength = length + 1;
    await this.waitForBytes(totalLength);
    const payload = this.buffer.subarray(5, totalLength);
    this.buffer = this.buffer.subarray(totalLength);
    return { type, payload };
  }

  private async waitForBytes(size: number) {
    while (this.buffer.length < size) {
      await new Promise<void>((resolve, reject) => {
        const socket = this.socket;
        if (!socket) {
          reject(new Error("PostgreSQL socket is not connected."));
          return;
        }
        const cleanup = () => {
          socket.off("error", onError);
          socket.off("close", onClose);
          const index = this.waiters.indexOf(onData);
          if (index >= 0) this.waiters.splice(index, 1);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onClose = () => {
          cleanup();
          reject(new Error("PostgreSQL socket closed before response was complete."));
        };
        const onData = () => {
          cleanup();
          resolve();
        };
        this.waiters.push(onData);
        socket.once("error", onError);
        socket.once("close", onClose);
      });
    }
  }

  private get user() {
    return decodeURIComponent(this.url.username || "postgres");
  }

  private get password() {
    return decodeURIComponent(this.url.password || "");
  }

  private get database() {
    return decodeURIComponent(this.url.pathname.replace(/^\//, "") || "postgres");
  }
}

function int32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function parseRowDescription(payload: Buffer) {
  const fieldCount = payload.readInt16BE(0);
  const names: string[] = [];
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const end = payload.indexOf(0, offset);
    names.push(payload.subarray(offset, end).toString("utf8"));
    offset = end + 19;
  }
  return names;
}

function parseDataRow<T extends Row>(payload: Buffer, fields: string[]) {
  const row: Row = {};
  const fieldCount = payload.readInt16BE(0);
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const length = payload.readInt32BE(offset);
    offset += 4;
    if (length === -1) {
      row[fields[index] ?? `column_${index}`] = null;
      continue;
    }
    row[fields[index] ?? `column_${index}`] = payload.subarray(offset, offset + length).toString("utf8");
    offset += length;
  }
  return row as T;
}

function parseErrorResponse(payload: Buffer) {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length && payload[offset] !== 0) {
    const code = String.fromCharCode(payload[offset]!);
    offset += 1;
    const end = payload.indexOf(0, offset);
    fields[code] = payload.subarray(offset, end).toString("utf8");
    offset = end + 1;
  }
  return fields.M || "PostgreSQL returned an error.";
}

function parseScramAttributes(value: string) {
  const attributes: Record<string, string> = {};
  for (const part of value.split(",")) attributes[part.slice(0, 1)] = part.slice(2);
  return attributes;
}

function buildMd5Password(user: string, password: string, salt: Buffer) {
  const inner = createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function xorBuffers(left: Buffer, right: Buffer) {
  const result = Buffer.alloc(Math.min(left.length, right.length));
  for (let index = 0; index < result.length; index += 1) result[index] = left[index]! ^ right[index]!;
  return result;
}

main().catch((error: unknown) => {
  console.error(sanitizeErrorMessage(error));
  process.exit(1);
});
