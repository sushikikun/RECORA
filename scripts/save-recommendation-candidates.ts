import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = process.env.RECORA_DEFAULT_PROJECT_SLUG ?? "recora-kenzai-q2";
const INPUT_PATH = path.join(process.cwd(), "output", "recommendation-candidates", "recommendation-candidates.json");
const SCRIPT_SOURCE = "candidate_generator";

type Row = Record<string, string | null>;
type DbRecommendationType = "content" | "source" | "technical" | "prompt" | "risk" | "competitive";
type DbPriority = "high" | "medium" | "low";
type DbStatus = "open" | "planned" | "done" | "dismissed";
type SaveDecision = "save" | "review_required" | "candidate_only";
type CandidatePriority = "P0" | "P1" | "P2";
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
  should_save_to_recommendations: SaveDecision;
  save_reason: string;
  caution: string;
  suggested_next_action: string;
};
type CandidatesPayload = { generated_at: string; project_slug: string; project_name: string; candidates: Candidate[] };
type Options = { apply: boolean; candidateIds: string[] };
type ProjectRow = { id: string; slug: string; name: string };
type ExistingRecommendationRow = { id: string; title: string; candidate_id: string | null; source: string | null };
type RecommendationPlan = {
  candidate_id: string;
  title: string;
  requested: boolean;
  decision: SaveDecision;
  action: "skipped" | "would_insert" | "inserted";
  reason: string;
  existing_recommendation_id: string | null;
  mapped_type: DbRecommendationType;
  mapped_priority: DbPriority;
  mapped_status: DbStatus;
};
type InsertMapping = {
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
  const payload = await readPayload();
  const projectSlug = payload.project_slug || DEFAULT_PROJECT_SLUG;
  const db = new LocalPostgresClient(process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL);
  await db.connect();
  try {
    const project = await getProject(db, projectSlug);
    const before = await getRecommendationsCount(db);
    const existing = await getExistingRecommendations(db, project.id, payload.candidates);
    const plans = buildPlans(payload.candidates, options, existing);
    const writeEnabled = options.apply && options.candidateIds.length > 0;
    const insertablePlans = plans.filter((plan) => plan.action === "would_insert");
    const insertedCandidateIds: string[] = [];

    if (writeEnabled && insertablePlans.length > 0) {
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

    const after = await getRecommendationsCount(db);
    const candidateOnlyExcludedIds = payload.candidates.filter((candidate) => candidate.should_save_to_recommendations === "candidate_only").map((candidate) => candidate.id);
    const unknownRequestedIds = options.candidateIds.filter((id) => !payload.candidates.some((candidate) => candidate.id === id));
    console.log(JSON.stringify({
      mode: writeEnabled ? "apply" : "dry-run",
      input: INPUT_PATH,
      projectSlug: project.slug,
      applyRequested: options.apply,
      candidateIdsProvided: options.candidateIds,
      candidateIdsRequiredForWrite: true,
      applyRequiredForWrite: true,
      reviewRequiredOnly: true,
      saveDecisionAutoSaveDisabled: true,
      recommendationsBefore: before,
      recommendationsAfter: after,
      dbCountsUnchanged: before === after,
      databaseWritePerformed: insertedCandidateIds.length > 0,
      savedCandidateIds: insertedCandidateIds,
      unknownRequestedIds,
      candidateOnlyExcludedIds,
      plans
    }, null, 2));
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = { apply: false, candidateIds: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--candidate-ids") {
      options.candidateIds = parseCandidateIds(args[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg.startsWith("--candidate-ids=")) {
      options.candidateIds = parseCandidateIds(arg.slice("--candidate-ids=".length));
    }
  }
  return options;
}

function parseCandidateIds(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

async function readPayload(): Promise<CandidatesPayload> {
  const raw = JSON.parse(await fs.readFile(INPUT_PATH, "utf8")) as CandidatesPayload;
  if (!Array.isArray(raw.candidates)) throw new Error("recommendation-candidates.json does not contain candidates.");
  return raw;
}

async function getProject(db: LocalPostgresClient, slug: string): Promise<ProjectRow> {
  const rows = await db.query<ProjectRow>(`select id::text as id, slug, name from public.projects where slug = ${lit(slug)} limit 1`);
  if (!rows[0]) throw new Error(`Project not found: ${slug}`);
  return rows[0];
}

async function getRecommendationsCount(db: LocalPostgresClient) {
  const rows = await db.query<{ count: string }>("select count(*)::text as count from public.recommendations");
  return Number(rows[0]?.count ?? 0);
}

async function getExistingRecommendations(db: LocalPostgresClient, projectId: string, candidates: Candidate[]): Promise<ExistingRecommendationRow[]> {
  if (candidates.length === 0) return [];
  const ids = candidates.map((candidate) => candidate.id);
  const titles = candidates.map((candidate) => candidate.title);
  return db.query<ExistingRecommendationRow>(`
    select id::text as id, title, metadata->>'candidate_id' as candidate_id, metadata->>'source' as source
    from public.recommendations
    where project_id = ${uuid(projectId)}
      and (
        metadata->>'candidate_id' in (${litList(ids)})
        or (metadata->>'source' = ${lit(SCRIPT_SOURCE)} and title in (${litList(titles)}))
      )
  `);
}

function buildPlans(candidates: Candidate[], options: Options, existing: ExistingRecommendationRow[]): RecommendationPlan[] {
  const requestedIds = new Set(options.candidateIds);
  return candidates.map((candidate) => {
    const mapping = mapCandidate(candidate, { generated_at: "", project_slug: "", project_name: "", candidates: [] });
    const requested = requestedIds.has(candidate.id);
    const duplicate = findDuplicate(candidate, existing);
    const base = { candidate_id: candidate.id, title: candidate.title, requested, decision: candidate.should_save_to_recommendations, existing_recommendation_id: duplicate?.id ?? null, mapped_type: mapping.type, mapped_priority: mapping.priority, mapped_status: mapping.status };
    if (!requested) return { ...base, action: "skipped", reason: "not_requested" } satisfies RecommendationPlan;
    if (candidate.should_save_to_recommendations === "candidate_only") return { ...base, action: "skipped", reason: "candidate_only_excluded" } satisfies RecommendationPlan;
    if (candidate.should_save_to_recommendations === "save") return { ...base, action: "skipped", reason: "save_decision_auto_save_disabled" } satisfies RecommendationPlan;
    if (candidate.should_save_to_recommendations !== "review_required") return { ...base, action: "skipped", reason: "not_review_required" } satisfies RecommendationPlan;
    if (duplicate) return { ...base, action: "skipped", reason: "duplicate_existing_recommendation" } satisfies RecommendationPlan;
    return { ...base, action: "would_insert", reason: options.apply && options.candidateIds.length > 0 ? "ready_to_insert" : "dry_run_only" } satisfies RecommendationPlan;
  });
}

function findDuplicate(candidate: Candidate, existing: ExistingRecommendationRow[]) {
  return existing.find((row) => row.candidate_id === candidate.id) ?? existing.find((row) => row.source === SCRIPT_SOURCE && row.title === candidate.title) ?? null;
}

function getCandidateById(candidates: Candidate[], id: string) {
  const candidate = candidates.find((item) => item.id === id);
  if (!candidate) throw new Error(`Candidate not found: ${id}`);
  return candidate;
}

async function insertRecommendation(db: LocalPostgresClient, project: ProjectRow, candidate: Candidate, payload: CandidatesPayload) {
  const mapping = mapCandidate(candidate, payload);
  const rows = await db.query<{ id: string }>(`
    insert into public.recommendations (project_id, type, priority, impact_score, effort_score, title, reason, target_url, status, metadata)
    values (${uuid(project.id)}, ${lit(mapping.type)}::public.recora_recommendation_type, ${lit(mapping.priority)}::public.recora_priority, ${num(mapping.impactScore)}, ${nullableNum(mapping.effortScore)}, ${lit(candidate.title)}, ${nullable(mapping.reason)}, ${nullable(mapping.targetUrl)}, ${lit(mapping.status)}::public.recora_recommendation_state, ${jsonb(mapping.metadata)})
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
  const impactScore = mapImpactScore(candidate.priority);
  const metadata = {
    source: SCRIPT_SOURCE,
    candidate_id: candidate.id,
    generated_at: payload.generated_at || null,
    project_slug: payload.project_slug || null,
    confidence: candidate.confidence,
    should_save_to_recommendations: candidate.should_save_to_recommendations,
    review_status: candidate.should_save_to_recommendations,
    caution: candidate.caution,
    suggested_next_action: candidate.suggested_next_action,
    expected_impact: candidate.expected_impact,
    effort: candidate.effort,
    related_urls: candidate.related_urls,
    related_observation_ids: candidate.related_observation_ids,
    related_brands: candidate.related_brands,
    related_topics: candidate.related_topics,
    evidence: candidate.evidence,
    original_candidate_type: candidate.type,
    candidate,
    mapping: {
      type,
      priority,
      status,
      impact_score: impactScore,
      impact_score_source: "priority_default_for_manual_review",
      effort_score: effortScore,
      target_url: targetUrl,
      note: "Saved rows remain open for human review. Related URLs stay in metadata."
    },
    db_write_policy: {
      dry_run_default: true,
      requires_apply: true,
      requires_candidate_ids: true,
      review_required_only: true,
      candidate_only_excluded: true,
      save_decision_auto_save_disabled: true
    }
  };
  return { type, priority, status, impactScore, effortScore, targetUrl, reason, metadata };
}

function mapRecommendationType(type: string): DbRecommendationType {
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

function mapImpactScore(priority: CandidatePriority) {
  if (priority === "P0") return 90;
  if (priority === "P1") return 70;
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
