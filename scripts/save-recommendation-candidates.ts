import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = process.env.RECORA_DEFAULT_PROJECT_SLUG ?? "recora-kenzai-q2";
const DEFAULT_INPUT_PATH = path.join(process.cwd(), "output", "recommendation-candidates", "recommendation-candidates.json");
const SCRIPT_SOURCE = "recommendation_candidate_generator";
const SAVE_POLICY_VERSION = "recora-display-v01";
const REQUIRED_PROFILE_ID = "standard-v01";
const SEED_MEASUREMENT_RUN_ID = "70000000-0000-4000-8000-000000000001";
const TABLES = [
  "measurement_runs",
  "run_items",
  "ai_conversations",
  "brand_mentions",
  "citations",
  "source_domains",
  "metric_snapshots",
  "recommendations",
  "topics",
  "prompts",
  "personas"
] as const;
const DB_WRITE_POLICY: DbWritePolicy = {
  dry_run_default: true,
  requires_apply: true,
  display_decision_show_only: true,
  standard_v01_only: true,
  openai_measurement_only: true,
  save_policy_version: SAVE_POLICY_VERSION
};

type Row = Record<string, string | null>;
type DbRecommendationType = "content" | "source" | "technical" | "prompt" | "risk" | "competitive";
type DbPriority = "high" | "medium" | "low";
type DbStatus = "open" | "planned" | "done" | "dismissed";
type CandidatePriority = "P0" | "P1" | "P2";
type CountSnapshot = Record<string, number>;
type Candidate = {
  id: string;
  title: string;
  priority: CandidatePriority;
  type: string;
  summary: string;
  rationale: string;
  evidence: unknown;
  expected_impact: string;
  effort: string;
  related_observation_ids: string[];
  related_urls: string[];
  related_brands: string[];
  related_topics: string[];
  confidence: string;
  confidence_label?: string;
  quality_score?: number;
  quality_score_label?: string;
  quality_score_max?: number;
  quality_score_breakdown?: unknown[];
  display_category?: string;
  display_decision?: string;
  customer_facing_caution?: string;
  score_explanation?: string;
  recora_metric_notice?: string;
  should_save_to_recommendations?: string;
  save_reason: string;
  caution: string;
  suggested_next_action: string;
};
type CandidatesPayload = {
  generated_at: string;
  project_slug: string;
  project_name: string;
  measurement_run_id?: string;
  aggregate_run_id?: string | null;
  measurement_profile_id?: string;
  candidates: Candidate[];
};
type Options = { inputPath: string; apply: boolean; dryRun: boolean };
type ProjectRow = { id: string; slug: string; name: string };
type ExistingRecommendationRow = { id: string; title: string; candidate_id: string | null; measurement_run_id: string | null; source: string | null };
type DbWritePolicy = {
  dry_run_default: boolean;
  requires_apply: boolean;
  display_decision_show_only: boolean;
  standard_v01_only: boolean;
  openai_measurement_only: boolean;
  save_policy_version: string;
};
type RecommendationPlan = {
  candidate_id: string;
  title: string;
  candidate_type: string;
  display_decision: string | null;
  display_category: string | null;
  quality_score: number | null;
  confidence: string | null;
  measurement_run_id: string | null;
  aggregate_run_id: string | null;
  measurement_profile_id: string | null;
  action: "skipped" | "would_insert" | "inserted";
  reason: string;
  skip_reasons: string[];
  duplicate: boolean;
  existing_recommendation_id: string | null;
  mapped_type: DbRecommendationType;
  mapped_priority: DbPriority;
  mapped_status: DbStatus;
  impact_score: number;
  db_write_policy: DbWritePolicy;
  payload_summary: {
    candidate_id: string;
    title: string;
    display_decision: string | null;
    display_category: string | null;
    quality_score: number | null;
    confidence: string | null;
    mapped_priority: DbPriority;
    mapped_status: DbStatus;
    db_write_policy: DbWritePolicy;
  };
};
type InsertMapping = {
  runId: string;
  type: DbRecommendationType;
  priority: DbPriority;
  status: DbStatus;
  impactScore: number;
  effortScore: number | null;
  targetUrl: string | null;
  reason: string;
  metadata: Record<string, unknown>;
};
type PgMessage = { type: string; payload: Buffer };

async function main() {
  await loadEnvLocal();
  const options = parseArgs(process.argv.slice(2));
  const payload = await readPayload(options.inputPath);
  const projectSlug = payload.project_slug || DEFAULT_PROJECT_SLUG;
  const db = new LocalPostgresClient(process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL);
  await db.connect();
  try {
    const project = await getProject(db, projectSlug);
    const before = await getCounts(db);
    const existing = await getExistingRecommendations(db, project.id, payload.candidates);
    const databaseWriteAllowed = options.apply && !options.dryRun;
    const plans = buildPlans(payload, existing);
    const insertablePlans = plans.filter((plan) => plan.action === "would_insert");
    const insertedCandidateIds: string[] = [];

    if (databaseWriteAllowed && insertablePlans.length > 0) {
      await db.query("begin");
      try {
        for (const plan of insertablePlans) {
          const candidate = getCandidateById(payload.candidates, plan.candidate_id);
          const inserted = await insertRecommendation(db, project, candidate, payload);
          plan.action = "inserted";
          plan.reason = "inserted";
          plan.existing_recommendation_id = inserted.id;
          insertedCandidateIds.push(candidate.id);
        }
        await db.query("commit");
      } catch (error) {
        await db.query("rollback");
        throw error;
      }
    }

    const after = await getCounts(db);
    const skippedPlans = plans.filter((plan) => plan.action === "skipped");
    const duplicatePlans = plans.filter((plan) => plan.duplicate);
    console.log(JSON.stringify({
      mode: databaseWriteAllowed ? "apply" : "dry-run",
      input: options.inputPath,
      projectSlug: project.slug,
      apply: options.apply,
      applyRequiredForWrite: true,
      databaseWriteAllowed,
      displayDecisionShowOnly: true,
      candidateCount: payload.candidates.length,
      saveTargetCount: insertablePlans.length + insertedCandidateIds.length,
      skippedCount: skippedPlans.length,
      duplicateCount: duplicatePlans.length,
      duplicateCandidateIds: duplicatePlans.map((plan) => plan.candidate_id),
      recommendationsBefore: before.recommendations ?? 0,
      recommendationsAfter: after.recommendations ?? 0,
      dbCountsBefore: before,
      dbCountsAfter: after,
      dbCountsUnchanged: sameCounts(before, after),
      databaseWritePerformed: insertedCandidateIds.length > 0,
      savedCandidateIds: insertedCandidateIds,
      plans
    }, null, 2));
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = { inputPath: DEFAULT_INPUT_PATH, apply: false, dryRun: true };
  let applyRequested = false;
  let dryRunRequested = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--input") {
      options.inputPath = path.resolve(readNext(args, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--input=")) {
      options.inputPath = path.resolve(arg.slice("--input=".length));
      continue;
    }
    if (arg === "--dry-run") {
      dryRunRequested = true;
      options.dryRun = true;
      options.apply = false;
      continue;
    }
    if (arg === "--apply") {
      applyRequested = true;
      options.apply = true;
      options.dryRun = false;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (applyRequested && dryRunRequested) throw new Error("--apply and --dry-run cannot be used together.");
  return options;
}

function readNext(args: string[], index: number, arg: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
  return value;
}

async function readPayload(inputPath: string): Promise<CandidatesPayload> {
  const raw = JSON.parse(await fs.readFile(inputPath, "utf8")) as CandidatesPayload;
  if (!Array.isArray(raw.candidates)) throw new Error("recommendation-candidates.json does not contain candidates.");
  return raw;
}

async function getProject(db: LocalPostgresClient, slug: string): Promise<ProjectRow> {
  const rows = await db.query<ProjectRow>(`select id::text as id, slug, name from public.projects where slug = ${lit(slug)} limit 1`);
  if (!rows[0]) throw new Error(`Project not found: ${slug}`);
  return rows[0];
}

async function getCounts(db: LocalPostgresClient) {
  const result: CountSnapshot = {};
  for (const table of TABLES) {
    const rows = await db.query<{ count: string }>(`select count(*)::text as count from public.${table}`);
    result[table] = Number(rows[0]?.count ?? 0);
  }
  return result;
}

async function getExistingRecommendations(db: LocalPostgresClient, projectId: string, candidates: Candidate[]): Promise<ExistingRecommendationRow[]> {
  if (candidates.length === 0) return [];
  const ids = candidates.map((candidate) => candidate.id);
  const measurementRunIds = unique(candidates.map((candidate) => readEvidenceString(candidate, "measurement_run_id")).filter((value): value is string => Boolean(value)));
  if (measurementRunIds.length === 0) return [];
  return db.query<ExistingRecommendationRow>(`
    select id::text as id, title,
      metadata->>'candidate_id' as candidate_id,
      metadata->>'measurement_run_id' as measurement_run_id,
      metadata->>'source' as source
    from public.recommendations
    where project_id = ${uuid(projectId)}
      and metadata->>'candidate_id' in (${litList(ids)})
      and metadata->>'measurement_run_id' in (${litList(measurementRunIds)})
  `);
}

function buildPlans(payload: CandidatesPayload, existing: ExistingRecommendationRow[]): RecommendationPlan[] {
  return payload.candidates.map((candidate) => {
    const mapping = mapCandidate(candidate, payload);
    const skipReasons = getSkipReasons(candidate);
    const duplicate = findDuplicate(candidate, existing);
    const base = {
      candidate_id: candidate.id,
      title: candidate.title,
      candidate_type: candidate.type,
      display_decision: candidate.display_decision ?? null,
      display_category: candidate.display_category ?? null,
      quality_score: typeof candidate.quality_score === "number" ? candidate.quality_score : null,
      confidence: candidate.confidence ?? null,
      measurement_run_id: mapping.runId,
      aggregate_run_id: readEvidenceString(candidate, "aggregate_run_id"),
      measurement_profile_id: readEvidenceString(candidate, "measurement_profile_id"),
      duplicate: Boolean(duplicate),
      existing_recommendation_id: duplicate?.id ?? null,
      mapped_type: mapping.type,
      mapped_priority: mapping.priority,
      mapped_status: mapping.status,
      impact_score: mapping.impactScore,
      db_write_policy: DB_WRITE_POLICY,
      payload_summary: {
        candidate_id: candidate.id,
        title: candidate.title,
        display_decision: candidate.display_decision ?? null,
        display_category: candidate.display_category ?? null,
        quality_score: typeof candidate.quality_score === "number" ? candidate.quality_score : null,
        confidence: candidate.confidence ?? null,
        mapped_priority: mapping.priority,
        mapped_status: mapping.status,
        db_write_policy: DB_WRITE_POLICY
      }
    };
    if (skipReasons.length > 0) {
      return { ...base, action: "skipped", reason: skipReasons[0], skip_reasons: skipReasons } satisfies RecommendationPlan;
    }
    if (duplicate) {
      return { ...base, action: "skipped", reason: "duplicate_existing_recommendation", skip_reasons: ["duplicate_existing_recommendation"] } satisfies RecommendationPlan;
    }
    return { ...base, action: "would_insert", reason: "display_decision_show", skip_reasons: [] } satisfies RecommendationPlan;
  });
}

function getSkipReasons(candidate: Candidate) {
  const reasons: string[] = [];
  const measurementRunId = readEvidenceString(candidate, "measurement_run_id");
  const aggregateRunId = readEvidenceString(candidate, "aggregate_run_id");
  const measurementProfileId = readEvidenceString(candidate, "measurement_profile_id");
  const dataSource = readEvidenceString(candidate, "data_source");
  if (candidate.display_decision !== "show") reasons.push("display_decision_not_show");
  if (!measurementRunId) reasons.push("missing_measurement_run_id");
  if (!aggregateRunId) reasons.push("missing_aggregate_run_id");
  if (!measurementProfileId) reasons.push("missing_measurement_profile_id");
  if (measurementProfileId && measurementProfileId !== REQUIRED_PROFILE_ID) reasons.push("measurement_profile_not_standard_v01");
  if (dataSource !== "openai_measurement") reasons.push("data_source_not_openai_measurement");
  if (hasSeedSampleOrExampleEvidence(candidate.evidence)) reasons.push("seed_sample_or_example_evidence_detected");
  return reasons;
}

function findDuplicate(candidate: Candidate, existing: ExistingRecommendationRow[]) {
  const measurementRunId = readEvidenceString(candidate, "measurement_run_id");
  return existing.find((row) => row.candidate_id === candidate.id && row.measurement_run_id === measurementRunId) ?? null;
}

function getCandidateById(candidates: Candidate[], id: string) {
  const candidate = candidates.find((item) => item.id === id);
  if (!candidate) throw new Error(`Candidate not found: ${id}`);
  return candidate;
}

async function insertRecommendation(db: LocalPostgresClient, project: ProjectRow, candidate: Candidate, payload: CandidatesPayload) {
  const mapping = mapCandidate(candidate, payload);
  const rows = await db.query<{ id: string }>(`
    insert into public.recommendations (project_id, run_id, type, priority, impact_score, effort_score, title, reason, target_url, status, metadata)
    values (${uuid(project.id)}, ${uuid(mapping.runId)}, ${lit(mapping.type)}::public.recora_recommendation_type, ${lit(mapping.priority)}::public.recora_priority, ${num(mapping.impactScore)}, ${nullableNum(mapping.effortScore)}, ${lit(candidate.title)}, ${nullable(mapping.reason)}, ${nullable(mapping.targetUrl)}, ${lit(mapping.status)}::public.recora_recommendation_state, ${jsonb(mapping.metadata)})
    returning id::text as id
  `);
  if (!rows[0]) throw new Error(`Insert failed for candidate: ${candidate.id}`);
  return rows[0];
}

function mapCandidate(candidate: Candidate, payload: CandidatesPayload): InsertMapping {
  const type = mapRecommendationType(candidate.type);
  const priority = mapPriority(candidate.priority);
  const status: DbStatus = "open";
  const effortScore = mapEffortScore(candidate.effort);
  const targetUrl = null;
  const reason = [candidate.summary, candidate.rationale].filter(Boolean).join("\n\n");
  const evidence = asRecord(candidate.evidence);
  const measurementRunId = readEvidenceString(candidate, "measurement_run_id");
  if (!measurementRunId) throw new Error(`Candidate is missing evidence.measurement_run_id: ${candidate.id}`);
  const aggregateRunId = readEvidenceString(candidate, "aggregate_run_id");
  const measurementProfileId = readEvidenceString(candidate, "measurement_profile_id");
  const measurementProfileLabel = readEvidenceString(candidate, "measurement_profile_label");
  const dataSource = readEvidenceString(candidate, "data_source");
  const impactScore = mapImpactScore(candidate);
  const evidenceSummary = buildEvidenceSummary(evidence);
  const metadata = {
    source: SCRIPT_SOURCE,
    data_source: dataSource,
    measurement_run_id: measurementRunId,
    aggregate_run_id: aggregateRunId,
    measurement_profile_id: measurementProfileId,
    measurement_profile_label: measurementProfileLabel,
    candidate_id: candidate.id,
    candidate_type: candidate.type,
    display_decision: candidate.display_decision ?? null,
    display_category: candidate.display_category ?? null,
    quality_score: candidate.quality_score ?? null,
    quality_score_label: candidate.quality_score_label ?? null,
    quality_score_max: candidate.quality_score_max ?? null,
    quality_score_breakdown: candidate.quality_score_breakdown ?? [],
    confidence: candidate.confidence,
    confidence_label: candidate.confidence_label ?? null,
    priority: candidate.priority,
    customer_facing_caution: candidate.customer_facing_caution ?? null,
    score_explanation: candidate.score_explanation ?? null,
    recora_metric_notice: candidate.recora_metric_notice ?? candidate.caution ?? null,
    evidence_summary: evidenceSummary,
    evidence: candidate.evidence,
    generated_at: payload.generated_at || null,
    project_slug: payload.project_slug || null,
    project_name: payload.project_name || null,
    caution: candidate.caution,
    suggested_next_action: candidate.suggested_next_action,
    expected_impact: candidate.expected_impact,
    effort: candidate.effort,
    related_urls: candidate.related_urls,
    related_observation_ids: candidate.related_observation_ids,
    related_brands: candidate.related_brands,
    related_topics: candidate.related_topics,
    save_policy_version: SAVE_POLICY_VERSION,
    mapping: {
      type,
      priority,
      status,
      impact_score: impactScore,
      impact_score_source: "quality_score",
      effort_score: effortScore,
      target_url: targetUrl,
      note: "Saved as machine-generated display insight history. Related URLs stay in metadata."
    },
    db_write_policy: DB_WRITE_POLICY
  };
  return { runId: measurementRunId, type, priority, status, impactScore, effortScore, targetUrl, reason, metadata };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readEvidenceString(candidate: Candidate, key: string) {
  return readMetadataString(asRecord(candidate.evidence), key);
}

function readMetadataString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readMetadataArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function buildEvidenceSummary(evidence: Record<string, unknown>) {
  return {
    primary_evidence_scope: readMetadataString(evidence, "primary_evidence_scope"),
    observation_count: readMetadataNumber(evidence, "observation_count"),
    prompt_count: readMetadataNumber(evidence, "prompt_count"),
    focused_observation_count: readMetadataNumber(evidence, "focused_observation_count"),
    observation_rows_count: readMetadataArray(evidence, "observation_rows").length,
    citation_rows_count: readMetadataArray(evidence, "citation_rows").length,
    matched_clue_count: readMetadataNumber(evidence, "matched_clue_count"),
    citation_count: readMetadataNumber(evidence, "citation_count"),
    unique_url_count: readMetadataNumber(evidence, "unique_url_count"),
    unique_domain_count: readMetadataNumber(evidence, "unique_domain_count"),
    supports_claim_unknown_count: readMetadataNumber(evidence, "supports_claim_unknown_count"),
    search_modes: readMetadataArray(evidence, "search_modes"),
    prompt_texts: readMetadataArray(evidence, "prompt_texts")
  };
}

function readMetadataNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapRecommendationType(type: string): DbRecommendationType {
  if (type === "citation_evidence_review") return "source";
  if (type === "brand_visibility_gap" || type === "case_study_evidence_gap") return "content";
  if (type === "competitor_category_drift") return "competitive";
  if (type === "citation_mismatch" || type === "owned_site_not_cited") return "source";
  if (type === "source_friendly_page_gap") return "technical";
  if (type === "misinformation_or_category_risk") return "risk";
  if (type === "brand_absent" || type === "comparison_content_gap" || type === "case_study_gap" || type === "faq_structure_gap") return "content";
  return "content";
}

function mapPriority(priority: CandidatePriority): DbPriority {
  if (priority === "P0" || priority === "P1") return "high";
  return "medium";
}

function mapImpactScore(candidate: Candidate) {
  if (typeof candidate.quality_score === "number" && Number.isFinite(candidate.quality_score)) {
    return Math.max(0, Math.min(100, candidate.quality_score));
  }
  if (candidate.priority === "P0") return 90;
  if (candidate.priority === "P1") return 70;
  return 45;
}

function mapEffortScore(effort: string) {
  if (!effort) return null;
  if (effort.includes("低") && effort.includes("中")) return 35;
  if (effort.includes("低")) return 25;
  if (effort.includes("高") && effort.includes("中")) return 65;
  if (effort.includes("高")) return 80;
  if (effort.includes("中")) return 50;
  return null;
}

function hasSeedSampleOrExampleEvidence(value: unknown) {
  return collectStringValues(value).some((item) => {
    const normalized = item.trim().toLowerCase();
    return normalized === SEED_MEASUREMENT_RUN_ID
      || normalized === "seed"
      || normalized === "sample"
      || normalized.includes("sample@recora.ai")
      || normalized.includes("sample-data")
      || normalized.includes(".example");
  });
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(collectStringValues);
  return [];
}

function sameCounts(a: CountSnapshot, b: CountSnapshot) {
  return TABLES.every((table) => a[table] === b[table]);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

async function loadEnvLocal() {
  try {
    const envText = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^[ '"]|[ '"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function lit(value: string) { return `'${value.replace(/'/g, "''")}'`; }
function litList(values: string[]) { return values.length > 0 ? values.map(lit).join(", ") : "null"; }
function nullable(value: string | null | undefined) { return value ? lit(value) : "null"; }
function nullableNum(value: number | null | undefined) { return typeof value === "number" && Number.isFinite(value) ? String(value) : "null"; }
function num(value: number) { return Number.isFinite(value) ? String(value) : "0"; }
function uuid(value: string) { return `${lit(value)}::uuid`; }
function jsonb(value: unknown) { return `${lit(JSON.stringify(value))}::jsonb`; }

class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) { this.url = new URL(databaseUrl); }

  async connect() {
    const socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port || 5432) });
    this.socket = socket;
    socket.on("data", (chunk) => { this.buffer = Buffer.concat([this.buffer, chunk]); for (const waiter of this.waiters.splice(0)) waiter(); });
    await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("error", reject); });
    this.sendStartup();
    await this.authenticate();
  }

  end() { if (!this.socket || this.socket.destroyed) return; this.sendMessage("X", Buffer.alloc(0)); this.socket.end(); }

  async query<T extends Row = Row>(queryText: string): Promise<T[]> {
    this.sendMessage("Q", Buffer.from(queryText + "\0", "utf8"));
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
    const params = Buffer.from("user\0" + this.user + "\0database\0" + this.database + "\0client_encoding\0UTF8\0\0", "utf8");
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
        if (code === 3) { this.sendPassword(this.password); continue; }
        if (code === 5) { this.sendPassword(buildMd5Password(this.user, this.password, message.payload.subarray(4, 8))); continue; }
        if (code === 10) { await this.handleScram(message.payload.subarray(4)); continue; }
        throw new Error("Unsupported PostgreSQL authentication request: " + code);
      }
      if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      if (message.type === "Z") return;
    }
  }

  private async handleScram(payload: Buffer) {
    const mechanisms = payload.toString("utf8").split("\0").filter(Boolean);
    if (!mechanisms.includes("SCRAM-SHA-256")) throw new Error("Unsupported SASL mechanisms: " + mechanisms.join(", "));
    const clientNonce = randomBytes(18).toString("base64url");
    const clientFirstBare = "n=*,r=" + clientNonce;
    this.sendSaslInitial("SCRAM-SHA-256", "n,," + clientFirstBare);
    const serverFirstMessage = await this.readMessage();
    if (serverFirstMessage.type === "E") throw new Error(parseErrorResponse(serverFirstMessage.payload));
    if (serverFirstMessage.type !== "R" || serverFirstMessage.payload.readInt32BE(0) !== 11) throw new Error("Unexpected PostgreSQL SASL first response.");
    const serverFirst = serverFirstMessage.payload.subarray(4).toString("utf8");
    const attributes = parseScramAttributes(serverFirst);
    const serverNonce = attributes.r;
    const salt = attributes.s ? Buffer.from(attributes.s, "base64") : null;
    const iterations = Number(attributes.i);
    if (!serverNonce || !serverNonce.startsWith(clientNonce) || !salt || !Number.isFinite(iterations)) throw new Error("Invalid PostgreSQL SCRAM challenge.");
    const clientFinalWithoutProof = "c=biws,r=" + serverNonce;
    const authMessage = clientFirstBare + "," + serverFirst + "," + clientFinalWithoutProof;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(clientFinalWithoutProof + ",p=" + xorBuffers(clientKey, signature).toString("base64"));
  }

  private sendPassword(password: string) { this.sendMessage("p", Buffer.from(password + "\0", "utf8")); }
  private sendSaslInitial(mechanism: string, response: string) {
    const mechanismBuffer = Buffer.from(mechanism + "\0", "utf8");
    const responseBuffer = Buffer.from(response, "utf8");
    this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer]));
  }
  private sendSaslResponse(response: string) { this.sendMessage("p", Buffer.from(response, "utf8")); }
  private sendMessage(type: string, payload: Buffer) { this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload])); }
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
        if (!socket) { reject(new Error("PostgreSQL socket is not connected.")); return; }
        const cleanup = () => {
          socket.off("error", onError);
          socket.off("close", onClose);
          const index = this.waiters.indexOf(onData);
          if (index >= 0) this.waiters.splice(index, 1);
        };
        const onError = (error: Error) => { cleanup(); reject(error); };
        const onClose = () => { cleanup(); reject(new Error("PostgreSQL socket closed before response was complete.")); };
        const onData = () => { cleanup(); resolve(); };
        this.waiters.push(onData);
        socket.once("error", onError);
        socket.once("close", onClose);
      });
    }
  }

  private get user() { return decodeURIComponent(this.url.username || "postgres"); }
  private get password() { return decodeURIComponent(this.url.password || ""); }
  private get database() { return decodeURIComponent(this.url.pathname.replace(/^\//, "") || "postgres"); }
}

function int32(value: number) { const buffer = Buffer.alloc(4); buffer.writeInt32BE(value, 0); return buffer; }

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
      row[fields[index] ?? "column_" + index] = null;
      continue;
    }
    row[fields[index] ?? "column_" + index] = payload.subarray(offset, offset + length).toString("utf8");
    offset += length;
  }
  return row as T;
}

function parseErrorResponse(payload: Buffer) {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length && payload[offset] !== 0) {
    const code = String.fromCharCode(payload[offset]);
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
  const inner = createHash("md5").update(password + user).digest("hex");
  return "md5" + createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex");
}

function xorBuffers(left: Buffer, right: Buffer) {
  const result = Buffer.alloc(Math.min(left.length, right.length));
  for (let index = 0; index < result.length; index += 1) result[index] = left[index] ^ right[index];
  return result;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
