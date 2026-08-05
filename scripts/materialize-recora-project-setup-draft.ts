import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as net from "node:net";
import * as path from "node:path";
import * as process from "node:process";
import { pathToFileURL } from "node:url";

import { assertRecoraDbWriteAllowed } from "./recora-db-write-guard";
import {
  RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
  canonicalizeJson,
  materializeFixedPromptConfiguration,
  normalizeFixedPromptMetricEligibility,
  sha256Lowercase,
  tryMaterializeFixedPromptConfiguration,
  validateFixedPromptCanonicalPrompts,
  type FixedPromptCanonicalPrompt,
  type FixedPromptMaterializationPlan
} from "../lib/recora/fixed-prompt-materialization";
import type {
  PersonaDraft,
  ProjectSetupDraft,
  PromptDraft,
  TopicDraft
} from "../lib/recora/project-setup-draft";
import type { RecoraFixedPromptMetricEligibility } from "../lib/recora/db/types";

export const RECORA_FIXED_PROMPT_B2_PROJECT_ID = "recora-fixed-prompt-unit-b2";
export const RECORA_FIXED_PROMPT_B2_DB_CONTAINER = "supabase_db_recora-fixed-prompt-unit-b2";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

type Row = Record<string, string | null>;
type PgMessage = { type: string; payload: Buffer };
type MaterializerMode = "dry-run" | "execute";

type CliOptions = {
  inputPath: string | null;
  projectSlug: string | null;
  execute: boolean;
  dryRunSeen: boolean;
  executeSeen: boolean;
  databaseUrl: string;
};

type ProjectRow = Row & {
  id: string;
  organization_id: string;
  slug: string;
  prompt_configuration_finalized_at: string | null;
  prompt_configuration_hash: string | null;
  prompt_configuration_contract_version: string | null;
  prompt_configuration_count: string | null;
};

type TargetCountRow = Row & {
  persona_count: string;
  topic_count: string;
  prompt_count: string;
  primary_brand_count: string;
  ownership_count: string;
};

type FinalizedProjectRow = Row & {
  id: string;
  prompt_configuration_finalized_at: string | null;
  prompt_configuration_hash: string | null;
  prompt_configuration_contract_version: string | null;
  prompt_configuration_count: string | null;
};

type PersistedPromptRow = Row & {
  id: string;
  project_id: string;
  topic_id: string;
  persona_id: string | null;
  text: string;
  intent: string | null;
  buyer_stage: string | null;
  priority: string;
  is_active: string;
  prompt_type: string | null;
  measurement_purpose: string | null;
  intent_key: string | null;
  panel_role: string | null;
  response_shape: string | null;
  candidate_mention_opportunity: string | null;
  ranking_opportunity: string | null;
  metric_eligibility: string | null;
};

type DatabaseTargetSummary = {
  host: string;
  port: string | null;
  isLocal: boolean;
  projectId: typeof RECORA_FIXED_PROMPT_B2_PROJECT_ID;
  dbContainer: typeof RECORA_FIXED_PROMPT_B2_DB_CONTAINER;
  connectionStringHidden: true;
};

export type ProjectSetupDraftMaterializationOptions = {
  inputPath: string;
  projectSlug: string;
  execute?: boolean;
  databaseUrl?: string;
  cwd?: string;
};

export type ProjectSetupDraftMaterializationObjectOptions = Omit<
  ProjectSetupDraftMaterializationOptions,
  "inputPath"
>;

export type ProjectSetupDraftMaterializationSummary = {
  status: "ok";
  mode: MaterializerMode;
  projectSlug: string;
  projectId: string;
  databaseTarget: DatabaseTargetSummary;
  contractVersion: typeof RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION;
  promptConfigurationHash: string;
  promptConfigurationCount: number;
  plannedRecords: {
    personas: number;
    topics: number;
    prompts: number;
  };
  writes: {
    personasInserted: number;
    topicsInserted: number;
    promptsInserted: number;
    projectFinalized: 0 | 1;
  };
  sourceMappings: FixedPromptMaterializationPlan["sourceMappings"];
  finalizedProject: null | {
    promptConfigurationFinalizedAt: string;
    promptConfigurationHash: string;
    promptConfigurationContractVersion: string;
    promptConfigurationCount: number;
  };
};

export async function materializeProjectSetupDraft(
  options: ProjectSetupDraftMaterializationOptions
): Promise<ProjectSetupDraftMaterializationSummary> {
  const draft = JSON.parse(stripJsonBom(await fs.readFile(options.inputPath, "utf8"))) as ProjectSetupDraft;
  return materializeProjectSetupDraftObject(draft, options);
}

export async function materializeProjectSetupDraftObject(
  draft: ProjectSetupDraft,
  options: ProjectSetupDraftMaterializationObjectOptions
): Promise<ProjectSetupDraftMaterializationSummary> {
  const execute = options.execute === true;
  const mode: MaterializerMode = execute ? "execute" : "dry-run";
  const projectSlug = normalizeProjectSlugOption(options.projectSlug);
  const databaseUrl = options.databaseUrl?.trim() || readRequiredEnvironmentValue("RECORA_DATABASE_URL");
  const cwd = options.cwd ?? process.cwd();

  assertNoLinkedSupabaseMarker(cwd);
  assertDraftCanMaterializeBeforeDbWrite(draft, projectSlug);
  const target = assertB2LocalDatabaseTarget(databaseUrl, cwd);

  const db = new LocalPostgresClient(databaseUrl);
  await db.connect();
  try {
    return execute
      ? await executeMaterializationTransaction(db, draft, projectSlug, target)
      : await renderDryRun(db, draft, projectSlug, target);
  } finally {
    db.end();
  }
}

async function renderDryRun(
  db: LocalPostgresClient,
  draft: ProjectSetupDraft,
  projectSlug: string,
  target: DatabaseTargetSummary
): Promise<ProjectSetupDraftMaterializationSummary> {
  const project = await readProjectBySlug(db, projectSlug, false);
  assertTargetProjectIsWritableAndEmpty(db, project);
  const counts = await readTargetCounts(db, project);
  assertExistingProjectPrerequisites(counts);
  const plan = buildPlanForLockedProject(draft, project);

  return buildSummary("dry-run", target, plan, {
    personasInserted: 0,
    topicsInserted: 0,
    promptsInserted: 0,
    projectFinalized: 0
  }, null);
}

async function executeMaterializationTransaction(
  db: LocalPostgresClient,
  draft: ProjectSetupDraft,
  projectSlug: string,
  target: DatabaseTargetSummary
): Promise<ProjectSetupDraftMaterializationSummary> {
  await db.query("begin");
  try {
    const project = await readProjectBySlug(db, projectSlug, true);
    assertTargetProjectIsWritableAndEmpty(db, project);
    const counts = await readTargetCounts(db, project);
    assertExistingProjectPrerequisites(counts);

    const plan = buildPlanForLockedProject(draft, project);
    await insertPersonas(db, draft, plan);
    await insertTopics(db, draft, plan);
    await insertPrompts(db, plan);

    const persistedPrompts = await readPersistedCanonicalPrompts(db, project.id);
    const persistedCanonical = buildCanonicalConfigurationFromPrompts(project.id, persistedPrompts);

    if (persistedCanonical.promptConfigurationCount !== plan.promptConfigurationCount) {
      throw new Error("persisted_prompt_configuration_count_mismatch");
    }
    if (persistedCanonical.promptConfigurationHash !== plan.promptConfigurationHash) {
      throw new Error("persisted_prompt_configuration_hash_mismatch");
    }
    if (canonicalizeJson(persistedPrompts) !== canonicalizeJson(plan.prompts)) {
      throw new Error("persisted_prompt_fields_mismatch");
    }

    const finalizedProject = await finalizeProject(db, project.id, plan);
    await assertFinalizedProjectAndPrompts(db, finalizedProject, plan);
    await db.query("commit");

    return buildSummary("execute", target, plan, {
      personasInserted: plan.sourceMappings.personas.length,
      topicsInserted: plan.sourceMappings.topics.length,
      promptsInserted: plan.sourceMappings.prompts.length,
      projectFinalized: 1
    }, finalizedProject);
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  }
}

function buildPlanForLockedProject(
  draft: ProjectSetupDraft,
  project: ProjectRow
): FixedPromptMaterializationPlan {
  const result = tryMaterializeFixedPromptConfiguration(draft, {
    projectId: project.id,
    projectSlug: project.slug
  });

  if (!result.ok) {
    throw new Error(`draft_not_materialization_ready:${result.blockers.join(",")}`);
  }

  return result.plan;
}

async function readProjectBySlug(
  db: LocalPostgresClient,
  projectSlug: string,
  lockForUpdate: boolean
): Promise<ProjectRow> {
  const rows = await db.query<ProjectRow>(`
    select
      id::text as id,
      organization_id::text as organization_id,
      slug,
      prompt_configuration_finalized_at::text as prompt_configuration_finalized_at,
      prompt_configuration_hash,
      prompt_configuration_contract_version,
      prompt_configuration_count::text as prompt_configuration_count
    from public.projects
    where slug = ${lit(projectSlug)}
    ${lockForUpdate ? "for update" : ""}
  `);

  if (rows.length === 0) throw new Error("project_not_found");
  if (rows.length !== 1) throw new Error("project_slug_not_unique");
  if (rows[0]!.slug !== projectSlug) throw new Error("project_slug_mismatch");
  return rows[0]!;
}

async function readTargetCounts(db: LocalPostgresClient, project: ProjectRow): Promise<TargetCountRow> {
  const rows = await db.query<TargetCountRow>(`
    select
      (select count(*)::text from public.personas where project_id = ${uuid(project.id)}) as persona_count,
      (select count(*)::text from public.topics where project_id = ${uuid(project.id)}) as topic_count,
      (select count(*)::text from public.prompts where project_id = ${uuid(project.id)}) as prompt_count,
      (
        select count(*)::text
        from public.brands
        where project_id = ${uuid(project.id)}
          and brand_type = 'primary'
          and is_active is true
      ) as primary_brand_count,
      (
        select count(*)::text
        from public.organization_members
        where organization_id = ${uuid(project.organization_id)}
      ) as ownership_count
  `);
  return single(rows, "target project count check");
}

function assertTargetProjectIsWritableAndEmpty(db: LocalPostgresClient, project: ProjectRow): void {
  const finalizationValues = [
    project.prompt_configuration_finalized_at,
    project.prompt_configuration_hash,
    project.prompt_configuration_contract_version,
    project.prompt_configuration_count
  ];
  const nonNullCount = finalizationValues.filter((value) => value != null).length;

  if (nonNullCount === finalizationValues.length) throw new Error("project_already_finalized");
  if (nonNullCount !== 0) throw new Error("project_prompt_configuration_partial_state");

  void db;
}

function assertExistingProjectPrerequisites(counts: TargetCountRow): void {
  if (toCount(counts.primary_brand_count, "primary_brand_count") < 1) {
    throw new Error("project_primary_brand_missing");
  }
  if (toCount(counts.ownership_count, "ownership_count") < 1) {
    throw new Error("project_ownership_missing");
  }
  if (toCount(counts.persona_count, "persona_count") !== 0) {
    throw new Error("target_project_not_empty:personas");
  }
  if (toCount(counts.prompt_count, "prompt_count") !== 0) {
    throw new Error("target_project_not_empty:prompts");
  }
  if (toCount(counts.topic_count, "topic_count") !== 0) {
    throw new Error("target_project_not_empty:topics");
  }
}

async function insertPersonas(
  db: LocalPostgresClient,
  draft: ProjectSetupDraft,
  plan: FixedPromptMaterializationPlan
): Promise<void> {
  const bySourceId = new Map(draft.personas.map((persona) => [persona.personaId, persona]));
  for (const mapping of plan.sourceMappings.personas) {
    const persona = bySourceId.get(mapping.sourceId);
    if (!persona) throw new Error(`persona_source_mapping_missing:${mapping.sourceId}`);
    try {
      await insertPersona(db, plan.projectId, mapping.id, persona);
    } catch (error) {
      throw annotateInsertError("persona", mapping.id, error);
    }
  }
}

async function insertPersona(
  db: LocalPostgresClient,
  projectId: string,
  id: string,
  persona: PersonaDraft
): Promise<void> {
  await db.query(`
    insert into public.personas (
      id,
      project_id,
      name,
      segment,
      jobs,
      pain_points,
      is_active
    ) values (
      ${uuid(id)},
      ${uuid(projectId)},
      ${lit(persona.displayName)},
      ${nullable(persona.segment)},
      ${jsonb(persona.jobs)},
      ${jsonb(persona.painPoints)},
      true
    )
  `);
}

async function insertTopics(
  db: LocalPostgresClient,
  draft: ProjectSetupDraft,
  plan: FixedPromptMaterializationPlan
): Promise<void> {
  const bySourceId = new Map(draft.topics.map((topic) => [topic.topicId, topic]));
  for (const mapping of plan.sourceMappings.topics) {
    const topic = bySourceId.get(mapping.sourceId);
    if (!topic) throw new Error(`topic_source_mapping_missing:${mapping.sourceId}`);
    try {
      await insertTopic(db, plan.projectId, mapping.id, topic);
    } catch (error) {
      throw annotateInsertError("topic", mapping.id, error);
    }
  }
}

async function insertTopic(db: LocalPostgresClient, projectId: string, id: string, topic: TopicDraft): Promise<void> {
  await db.query(`
    insert into public.topics (
      id,
      project_id,
      name,
      intent,
      is_active
    ) values (
      ${uuid(id)},
      ${uuid(projectId)},
      ${lit(topic.topicName)},
      ${nullable(topic.diagnosisGoal)},
      true
    )
  `);
}

async function insertPrompts(db: LocalPostgresClient, plan: FixedPromptMaterializationPlan): Promise<void> {
  for (const prompt of plan.prompts) {
    try {
      await db.query(`
        insert into public.prompts (
          id,
          project_id,
          topic_id,
          persona_id,
          text,
          intent,
          buyer_stage,
          priority,
          is_active,
          prompt_type,
          measurement_purpose,
          intent_key,
          panel_role,
          response_shape,
          candidate_mention_opportunity,
          ranking_opportunity,
          metric_eligibility
        ) values (
          ${uuid(prompt.id)},
          ${uuid(prompt.project_id)},
          ${uuid(prompt.topic_id)},
          ${nullableUuid(prompt.persona_id)},
          ${lit(prompt.text)},
          ${lit(prompt.intent)},
          ${lit(prompt.buyer_stage)},
          ${lit(prompt.priority)},
          ${bool(prompt.is_active)},
          ${lit(prompt.prompt_type)},
          ${nullable(prompt.measurement_purpose)},
          ${lit(prompt.intent_key)},
          ${lit(prompt.panel_role)},
          ${lit(prompt.response_shape)},
          ${lit(prompt.candidate_mention_opportunity)},
          ${lit(prompt.ranking_opportunity)},
          ${jsonb(prompt.metric_eligibility)}
        )
      `);
    } catch (error) {
      throw annotateInsertError("prompt", prompt.id, error);
    }
  }
}

async function readPersistedCanonicalPrompts(
  db: LocalPostgresClient,
  projectId: string
): Promise<FixedPromptCanonicalPrompt[]> {
  const rows = await db.query<PersistedPromptRow>(`
    select
      id::text as id,
      project_id::text as project_id,
      topic_id::text as topic_id,
      persona_id::text as persona_id,
      text,
      intent,
      buyer_stage,
      priority::text as priority,
      is_active::text as is_active,
      prompt_type,
      measurement_purpose,
      intent_key,
      panel_role,
      response_shape,
      candidate_mention_opportunity,
      ranking_opportunity,
      metric_eligibility::text as metric_eligibility
    from public.prompts
    where project_id = ${uuid(projectId)}
    order by id
  `);

  const prompts = rows.map((row) => persistedPromptRowToCanonicalPrompt(row));
  const validation = validateFixedPromptCanonicalPrompts(prompts);
  if (!validation.materializationReady) {
    throw new Error(`persisted_prompt_canonical_validation_failed:${validation.blockers.join(",")}`);
  }
  return prompts;
}

function persistedPromptRowToCanonicalPrompt(row: PersistedPromptRow): FixedPromptCanonicalPrompt {
  return {
    id: row.id,
    project_id: row.project_id,
    topic_id: row.topic_id,
    persona_id: row.persona_id,
    text: row.text,
    intent: requirePersistedValue(row.intent, row.id, "intent") as PromptDraft["intent"],
    buyer_stage: requirePersistedValue(row.buyer_stage, row.id, "buyer_stage") as PromptDraft["buyerStage"],
    priority: requirePersistedValue(row.priority, row.id, "priority") as FixedPromptCanonicalPrompt["priority"],
    is_active: parseBoolean(row.is_active, row.id),
    prompt_type: requirePersistedValue(row.prompt_type, row.id, "prompt_type") as FixedPromptCanonicalPrompt["prompt_type"],
    measurement_purpose: row.measurement_purpose as FixedPromptCanonicalPrompt["measurement_purpose"],
    intent_key: requirePersistedValue(row.intent_key, row.id, "intent_key"),
    panel_role: requirePersistedValue(row.panel_role, row.id, "panel_role") as FixedPromptCanonicalPrompt["panel_role"],
    response_shape: requirePersistedValue(row.response_shape, row.id, "response_shape") as FixedPromptCanonicalPrompt["response_shape"],
    candidate_mention_opportunity: requirePersistedValue(
      row.candidate_mention_opportunity,
      row.id,
      "candidate_mention_opportunity"
    ) as FixedPromptCanonicalPrompt["candidate_mention_opportunity"],
    ranking_opportunity: requirePersistedValue(
      row.ranking_opportunity,
      row.id,
      "ranking_opportunity"
    ) as FixedPromptCanonicalPrompt["ranking_opportunity"],
    metric_eligibility: normalizeFixedPromptMetricEligibility(
      JSON.parse(requirePersistedValue(row.metric_eligibility, row.id, "metric_eligibility")) as RecoraFixedPromptMetricEligibility
    ),
    contract_version: RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION
  };
}

function buildCanonicalConfigurationFromPrompts(
  projectId: string,
  prompts: readonly FixedPromptCanonicalPrompt[]
) {
  const sortedPrompts = [...prompts].sort((left, right) => left.id.localeCompare(right.id));
  const canonicalJson = canonicalizeJson({
    contract_version: RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
    project_id: projectId,
    prompts: sortedPrompts
  });
  return {
    prompts: sortedPrompts,
    promptConfigurationCount: sortedPrompts.length,
    promptConfigurationHash: sha256Lowercase(canonicalJson),
    canonicalJson
  };
}

async function finalizeProject(
  db: LocalPostgresClient,
  projectId: string,
  plan: FixedPromptMaterializationPlan
): Promise<FinalizedProjectRow> {
  const rows = await db.query<FinalizedProjectRow>(`
    update public.projects
    set
      prompt_configuration_finalized_at = now(),
      prompt_configuration_hash = ${lit(plan.promptConfigurationHash)},
      prompt_configuration_contract_version = ${lit(plan.contractVersion)},
      prompt_configuration_count = ${num(plan.promptConfigurationCount)}
    where id = ${uuid(projectId)}
      and prompt_configuration_finalized_at is null
      and prompt_configuration_hash is null
      and prompt_configuration_contract_version is null
      and prompt_configuration_count is null
    returning
      id::text as id,
      prompt_configuration_finalized_at::text as prompt_configuration_finalized_at,
      prompt_configuration_hash,
      prompt_configuration_contract_version,
      prompt_configuration_count::text as prompt_configuration_count
  `);

  if (rows.length !== 1) throw new Error("project_finalization_update_count_mismatch");
  return rows[0]!;
}

async function assertFinalizedProjectAndPrompts(
  db: LocalPostgresClient,
  project: FinalizedProjectRow,
  plan: FixedPromptMaterializationPlan
): Promise<void> {
  if (!project.prompt_configuration_finalized_at) throw new Error("project_finalized_at_missing_after_update");
  if (project.prompt_configuration_hash !== plan.promptConfigurationHash) throw new Error("project_finalization_hash_mismatch");
  if (project.prompt_configuration_contract_version !== plan.contractVersion) {
    throw new Error("project_finalization_contract_version_mismatch");
  }
  if (toCount(project.prompt_configuration_count, "prompt_configuration_count") !== plan.promptConfigurationCount) {
    throw new Error("project_finalization_count_mismatch");
  }

  const persistedPrompts = await readPersistedCanonicalPrompts(db, plan.projectId);
  const persistedCanonical = buildCanonicalConfigurationFromPrompts(plan.projectId, persistedPrompts);
  if (persistedCanonical.promptConfigurationHash !== plan.promptConfigurationHash) {
    throw new Error("post_finalization_prompt_hash_mismatch");
  }
}

function buildSummary(
  mode: MaterializerMode,
  target: DatabaseTargetSummary,
  plan: FixedPromptMaterializationPlan,
  writes: ProjectSetupDraftMaterializationSummary["writes"],
  finalizedProject: FinalizedProjectRow | null
): ProjectSetupDraftMaterializationSummary {
  return {
    status: "ok",
    mode,
    projectSlug: plan.projectSlug,
    projectId: plan.projectId,
    databaseTarget: target,
    contractVersion: plan.contractVersion,
    promptConfigurationHash: plan.promptConfigurationHash,
    promptConfigurationCount: plan.promptConfigurationCount,
    plannedRecords: {
      personas: plan.sourceMappings.personas.length,
      topics: plan.sourceMappings.topics.length,
      prompts: plan.sourceMappings.prompts.length
    },
    writes,
    sourceMappings: plan.sourceMappings,
    finalizedProject: finalizedProject
      ? {
          promptConfigurationFinalizedAt: requirePersistedValue(
            finalizedProject.prompt_configuration_finalized_at,
            finalizedProject.id,
            "prompt_configuration_finalized_at"
          ),
          promptConfigurationHash: requirePersistedValue(
            finalizedProject.prompt_configuration_hash,
            finalizedProject.id,
            "prompt_configuration_hash"
          ),
          promptConfigurationContractVersion: requirePersistedValue(
            finalizedProject.prompt_configuration_contract_version,
            finalizedProject.id,
            "prompt_configuration_contract_version"
          ),
          promptConfigurationCount: toCount(finalizedProject.prompt_configuration_count, "prompt_configuration_count")
        }
      : null
  };
}

function assertDraftCanMaterializeBeforeDbWrite(draft: ProjectSetupDraft, projectSlug: string): void {
  const result = tryMaterializeFixedPromptConfiguration(draft, { projectSlug });
  if (!result.ok) {
    throw new Error(`draft_not_materialization_ready:${result.blockers.join(",")}`);
  }
}

function assertB2LocalDatabaseTarget(databaseUrl: string, cwd: string): DatabaseTargetSummary {
  const target = assertRecoraDbWriteAllowed({
    databaseUrl,
    operation: "materialize-recora-project-setup-draft",
    projectSlug: null,
    isWrite: false,
    allowNonLocalDb: false,
    confirmNonLocalDbWrite: null
  });

  if (!target.isLocal) {
    throw new Error(`remote_database_rejected:targetHost=${target.host}${target.port ? `:${target.port}` : ""}`);
  }

  const projectId = readRequiredEnvironmentValue("RECORA_LOCAL_SUPABASE_PROJECT_ID");
  if (projectId !== RECORA_FIXED_PROMPT_B2_PROJECT_ID) {
    throw new Error("local_supabase_project_id_mismatch");
  }

  const dbContainer = readRequiredEnvironmentValue("RECORA_LOCAL_SUPABASE_DB_CONTAINER");
  if (dbContainer !== RECORA_FIXED_PROMPT_B2_DB_CONTAINER) {
    throw new Error("local_supabase_db_container_mismatch");
  }

  assertExpectedDockerContainer(cwd);

  return {
    host: target.host,
    port: target.port || null,
    isLocal: target.isLocal,
    projectId: RECORA_FIXED_PROMPT_B2_PROJECT_ID,
    dbContainer: RECORA_FIXED_PROMPT_B2_DB_CONTAINER,
    connectionStringHidden: true
  };
}

function assertExpectedDockerContainer(cwd: string): void {
  const result = spawnSync("docker", ["inspect", "--format", "{{.Name}}", RECORA_FIXED_PROMPT_B2_DB_CONTAINER], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    timeout: 30_000
  });
  if (result.status !== 0) {
    throw new Error(`expected_local_db_container_missing:${RECORA_FIXED_PROMPT_B2_DB_CONTAINER}`);
  }
  if (result.stdout.trim() !== `/${RECORA_FIXED_PROMPT_B2_DB_CONTAINER}`) {
    throw new Error("local_db_container_identity_mismatch");
  }
}

function assertNoLinkedSupabaseMarker(cwd: string): void {
  const markerPath = path.join(cwd, "supabase", ".temp", "project-ref");
  if (existsSync(markerPath)) {
    throw new Error("linked_supabase_project_marker_present");
  }
}

function readRequiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_required`);
  return value;
}

function normalizeProjectSlugOption(value: string): string {
  const normalized = value.trim();
  if (!SLUG_PATTERN.test(normalized)) {
    throw new Error("project_slug_must_be_lowercase_kebab_case");
  }
  return normalized;
}

function parseArgs(args: readonly string[]): CliOptions {
  const options: CliOptions = {
    inputPath: null,
    projectSlug: null,
    execute: false,
    dryRunSeen: false,
    executeSeen: false,
    databaseUrl: readRequiredEnvironmentValue("RECORA_DATABASE_URL")
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "--dry-run") {
      options.execute = false;
      options.dryRunSeen = true;
      continue;
    }
    if (arg === "--execute") {
      options.execute = true;
      options.executeSeen = true;
      continue;
    }
    if (arg === "--input") {
      options.inputPath = readNextArg(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.slice("--input=".length);
      continue;
    }
    if (arg === "--project-slug") {
      options.projectSlug = readNextArg(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--project-slug=")) {
      options.projectSlug = arg.slice("--project-slug=".length);
      continue;
    }
    throw new Error(`unknown_argument:${arg}`);
  }

  if (options.dryRunSeen && options.executeSeen) {
    throw new Error("dry_run_and_execute_are_mutually_exclusive");
  }
  if (!options.inputPath) throw new Error("input_required");
  if (!options.projectSlug) throw new Error("project_slug_required");
  return options;
}

function readNextArg(args: readonly string[], index: number, arg: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${arg}_requires_value`);
  return value;
}

function stripJsonBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function annotateInsertError(scope: "persona" | "topic" | "prompt", id: string, error: unknown): Error {
  const message = sanitizeErrorMessage(error);
  const code = /duplicate key value violates unique constraint/i.test(message)
    ? `${scope}_uuid_conflict`
    : `${scope}_insert_failed`;
  return new Error(`${code}:${id}:${message}`);
}

function requirePersistedValue(value: string | null, rowId: string, field: string): string {
  if (value == null || value.trim().length === 0) {
    throw new Error(`persisted_prompt_field_missing:${rowId}:${field}`);
  }
  return value;
}

function parseBoolean(value: string, rowId: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`persisted_prompt_boolean_invalid:${rowId}:is_active`);
}

function toCount(value: string | null, label: string): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) throw new Error(`${label}_invalid`);
  return count;
}

function lit(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function nullable(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? lit(value) : "null";
}

function num(value: number): string {
  if (!Number.isFinite(value)) throw new Error("non_finite_number_forbidden");
  return String(value);
}

function uuid(value: string): string {
  return `${lit(value)}::uuid`;
}

function nullableUuid(value: string | null | undefined): string {
  return value ? uuid(value) : "null";
}

function bool(value: boolean): string {
  return value ? "true" : "false";
}

function jsonb(value: unknown): string {
  return `${lit(JSON.stringify(value))}::jsonb`;
}

function single<T>(rows: readonly T[], label: string): T {
  if (rows.length !== 1) throw new Error(`${label}_returned_${rows.length}_rows`);
  return rows[0]!;
}

export function sanitizeErrorMessage(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error);
  return value.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[redacted-local-db-url]");
}

export class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) {
    this.url = new URL(databaseUrl);
  }

  async connect(timeoutMs = 3_000): Promise<void> {
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

  end(): void {
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

  private sendStartup(): void {
    const params = Buffer.from(`user\0${this.user}\0database\0${this.database}\0client_encoding\0UTF8\0\0`, "utf8");
    const protocol = Buffer.alloc(4);
    protocol.writeInt32BE(196608, 0);
    this.sendRaw(Buffer.concat([int32(8 + params.length), protocol, params]));
  }

  private async authenticate(): Promise<void> {
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

  private async handleScram(payload: Buffer): Promise<void> {
    const mechanisms = payload.toString("utf8").split("\0").filter(Boolean);
    if (!mechanisms.includes("SCRAM-SHA-256")) {
      throw new Error(`Unsupported SASL mechanisms: ${mechanisms.join(", ")}`);
    }

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

  private sendPassword(password: string): void {
    this.sendMessage("p", Buffer.from(`${password}\0`, "utf8"));
  }

  private sendSaslInitial(mechanism: string, response: string): void {
    const mechanismBuffer = Buffer.from(`${mechanism}\0`, "utf8");
    const responseBuffer = Buffer.from(response, "utf8");
    this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer]));
  }

  private sendSaslResponse(response: string): void {
    this.sendMessage("p", Buffer.from(response, "utf8"));
  }

  private sendMessage(type: string, payload: Buffer): void {
    this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload]));
  }

  private sendRaw(payload: Buffer): void {
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

  private async waitForBytes(size: number): Promise<void> {
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

  private get user(): string {
    return decodeURIComponent(this.url.username || "postgres");
  }

  private get password(): string {
    return decodeURIComponent(this.url.password || "");
  }

  private get database(): string {
    return decodeURIComponent(this.url.pathname.replace(/^\//, "") || "postgres");
  }
}

function int32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function parseRowDescription(payload: Buffer): string[] {
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

function parseDataRow<T extends Row>(payload: Buffer, fields: readonly string[]): T {
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

function parseErrorResponse(payload: Buffer): string {
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

function parseScramAttributes(value: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const part of value.split(",")) attributes[part.slice(0, 1)] = part.slice(2);
  return attributes;
}

function buildMd5Password(user: string, password: string, salt: Buffer): string {
  const inner = createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function xorBuffers(left: Buffer, right: Buffer): Buffer {
  const result = Buffer.alloc(Math.min(left.length, right.length));
  for (let index = 0; index < result.length; index += 1) result[index] = left[index]! ^ right[index]!;
  return result;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const summary = await materializeProjectSetupDraft({
    inputPath: options.inputPath!,
    projectSlug: options.projectSlug!,
    execute: options.execute,
    databaseUrl: options.databaseUrl
  });
  console.log(JSON.stringify(summary, null, 2));
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && pathToFileURL(path.resolve(entry)).href === import.meta.url);
}

if (isMainModule()) {
  main().catch((error: unknown) => {
    console.error(sanitizeErrorMessage(error));
    process.exit(1);
  });
}
