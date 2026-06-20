import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import {
  assertRecoraDbWriteAllowed,
  createRecoraDbWriteGuardCliOptions,
  parseRecoraDbWriteGuardArg
} from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PROJECT_SLUG = process.env.RECORA_DEFAULT_PROJECT_SLUG ?? "recora-kenzai-q2";
const OUTPUT_DIR = path.join(process.cwd(), "output", "openai-inspection");
const PROVIDER = "openai";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
type NullableNumber = number | null;
type CitationStatus = "unknown" | "not_requested" | "unavailable" | "available" | "partial" | "error";
type RecommendationStatus = "strongly_recommended" | "recommended" | "listed" | "neutral" | "absent" | "discouraged";
type Sentiment = "positive" | "neutral" | "negative" | "unclear";
type SourceType = "owned" | "competitor" | "media" | "review" | "technical" | "unknown";
type BrandRelatedness = "unknown" | "target_brand" | "competitor" | "unknown_competitor" | "category" | "general" | "unrelated";
type Row = Record<string, string | null>;

type RawInspectionPayload = { request: { model: string; prompt: string; targetBrand: string; competitors: string[]; webSearchEnabled: boolean; requestedAt?: string }; responseTimeMs: number; response: Record<string, JsonValue | undefined> };
type BrandInspection = { brandName: string; mentioned: boolean; mentionCount: number; firstMentionIndex: NullableNumber; estimatedAnswerRank: NullableNumber; recommendationStatus: string; sentiment: string; evidenceSnippet: string | null };
type CitationInspection = { url: string; domain: string; title: string | null; startIndex: NullableNumber; endIndex: NullableNumber; sourceType: string };
type AnalysisInspectionPayload = { inspectedAt: string; modelRequested: string; modelReturned: string; responseId: string; status: string; responseTimeMs: number; prompt: string; targetBrand: string; targetBrandMentioned: boolean; competitorMentions: BrandInspection[]; mentionCount: number; firstMentionIndex: NullableNumber; estimatedAnswerRank: NullableNumber; recommendationStatus: string; sentiment: string; evidenceSnippet: string | null; citations: CitationInspection[]; citationStatus: string; missingCitationSignal: boolean; usage: JsonValue | null };
type InspectionVariant = { label: "openai-no-search" | "openai-web-search"; rawFile: string; textFile: string; analysisFile: string };
type ProjectRow = { id: string; slug: string; name: string; language: string; region: string };
type PromptRow = { id: string; text: string; persona_id: string | null; topic_id: string };
type PersonaRow = { id: string; name: string };
type AiModelRow = { id: string; provider: string; model_name: string; display_name: string };
type BrandRow = { id: string; name: string; brand_type: "primary" | "competitor"; domain: string | null };
type SourceDomainRow = { id: string; domain: string };
type VariantImportResult = { label: string; responseId: string; skipped: boolean; measurementRuns: number; runItems: number; aiConversations: number; brandMentions: number; sourceDomains: number; citations: number };
type ImportTotals = Omit<VariantImportResult, "label" | "responseId" | "skipped">;
type Options = {
  allowNonLocalDb: boolean;
  confirmNonLocalDbWrite: string | null;
};

const variants: InspectionVariant[] = [
  { label: "openai-no-search", rawFile: "openai-no-search-raw.json", textFile: "openai-no-search-text.txt", analysisFile: "openai-no-search-analysis.json" },
  { label: "openai-web-search", rawFile: "openai-web-search-raw.json", textFile: "openai-web-search-text.txt", analysisFile: "openai-web-search-analysis.json" }
];

async function main() {
  await loadEnvLocal();
  const options = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  assertRecoraDbWriteAllowed({
    databaseUrl,
    operation: "import-openai-inspection",
    projectSlug: PROJECT_SLUG,
    isWrite: true,
    allowNonLocalDb: options.allowNonLocalDb,
    confirmNonLocalDbWrite: options.confirmNonLocalDbWrite
  });

  const db = new LocalPostgresClient(databaseUrl);
  await db.connect();
  try {
    const project = await getProject(db, PROJECT_SLUG);
    const brands = await getBrands(db, project.id);
    const prompt = await getPromptForInspection(db, project.id, variants[0]);
    const persona = await getPersonaForPrompt(db, project.id, prompt);
    const model = await getOpenAiModel(db);
    const results: VariantImportResult[] = [];
    for (const variant of variants) results.push(await importVariant({ db, project, prompt, persona, model, brands, variant }));
    printSummary(PROJECT_SLUG, results);
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const options = createRecoraDbWriteGuardCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    const guardConsumed = parseRecoraDbWriteGuardArg(args, index, options);
    if (guardConsumed > 0) {
      index += guardConsumed - 1;
      continue;
    }

    throw new Error(`Unknown argument: ${args[index]}`);
  }

  return options;
}

async function importVariant(input: { db: LocalPostgresClient; project: ProjectRow; prompt: PromptRow; persona: PersonaRow; model: AiModelRow; brands: BrandRow[]; variant: InspectionVariant }): Promise<VariantImportResult> {
  const { db, project, prompt, persona, model, brands, variant } = input;
  const raw = await readJson<RawInspectionPayload>(variant.rawFile);
  const analysis = await readJson<AnalysisInspectionPayload>(variant.analysisFile);
  const outputText = await readText(variant.textFile);
  const responseId = analysis.responseId || readString(raw.response.id) || `${variant.label}-${createHashValue(outputText)}`;
  if (await findExistingConversation(db, responseId)) return emptyVariantResult(variant.label, responseId, true);

  await db.query("begin");
  try {
    const measuredAt = analysis.inspectedAt || raw.request.requestedAt || new Date().toISOString();
    const run = await insertMeasurementRun(db, project, measuredAt, raw.request.requestedAt);
    const runItem = await insertRunItem(db, run.id, prompt.id, persona.id, model.id, measuredAt, analysis.responseTimeMs ?? raw.responseTimeMs);
    const conversation = await insertConversation({ db, runItemId: runItem.id, rawAnswer: outputText, analysis, raw, responseId, measuredAt });
    const brandMentions = await insertBrandMentions(db, conversation.id, brands, analysis);
    const citationResult = await insertCitations(db, conversation.id, project.id, brands, analysis, outputText);
    await db.query("commit");
    return { label: variant.label, responseId, skipped: false, measurementRuns: 1, runItems: 1, aiConversations: 1, brandMentions, sourceDomains: citationResult.sourceDomainsCreated, citations: citationResult.citationsCreated };
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

async function getProject(db: LocalPostgresClient, slug: string): Promise<ProjectRow> {
  const rows = await db.query<ProjectRow>(`select id::text as id, slug, name, language, region from public.projects where slug = ${lit(slug)} limit 1`);
  if (!rows[0]) throw new Error(`Project not found: ${slug}`);
  return rows[0];
}

async function getPromptForInspection(db: LocalPostgresClient, projectId: string, variant: InspectionVariant): Promise<PromptRow> {
  const analysis = await readJson<AnalysisInspectionPayload>(variant.analysisFile);
  const prompts = await db.query<PromptRow>(`select id::text as id, text, persona_id::text as persona_id, topic_id::text as topic_id from public.prompts where project_id = ${uuid(projectId)} order by created_at asc`);
  const exact = prompts.find((item) => item.text === analysis.prompt);
  if (exact) return exact;
  const startsWith = prompts.find((item) => item.text.startsWith(analysis.prompt.slice(0, 32)));
  if (startsWith) return startsWith;
  if (prompts[0]) return prompts[0];
  throw new Error("No prompt found for the target project. Seed prompts are required before importing observations.");
}

async function getPersonaForPrompt(db: LocalPostgresClient, projectId: string, prompt: PromptRow): Promise<PersonaRow> {
  if (prompt.persona_id) {
    const rows = await db.query<PersonaRow>(`select id::text as id, name from public.personas where id = ${uuid(prompt.persona_id)} limit 1`);
    if (rows[0]) return rows[0];
  }
  const rows = await db.query<PersonaRow>(`select id::text as id, name from public.personas where project_id = ${uuid(projectId)} order by created_at asc limit 1`);
  if (!rows[0]) throw new Error("No persona found for the target project. Seed personas are required before importing observations.");
  return rows[0];
}

async function getOpenAiModel(db: LocalPostgresClient): Promise<AiModelRow> {
  const rows = await db.query<AiModelRow>("select id::text as id, provider, model_name, display_name from public.ai_models where lower(provider) like '%openai%' order by created_at asc limit 1");
  if (!rows[0]) throw new Error("No OpenAI model row found. Seed ai_models before importing observations.");
  return rows[0];
}

async function getBrands(db: LocalPostgresClient, projectId: string): Promise<BrandRow[]> {
  const rows = await db.query<BrandRow>(`select id::text as id, name, brand_type, domain from public.brands where project_id = ${uuid(projectId)} order by brand_type asc, name asc`);
  if (rows.length === 0) throw new Error("No brands found for the target project.");
  return rows;
}

async function findExistingConversation(db: LocalPostgresClient, responseId: string) {
  const rows = await db.query(`select id::text as id from public.ai_conversations where provider = ${lit(PROVIDER)} and response_id = ${lit(responseId)} limit 1`);
  return rows[0] ?? null;
}
async function insertMeasurementRun(db: LocalPostgresClient, project: ProjectRow, measuredAt: string, requestedAt?: string) {
  const date = toDateOnly(measuredAt);
  const rows = await db.query<{ id: string }>(`insert into public.measurement_runs (project_id, status, period_start, period_end, region, language, started_at, completed_at) values (${uuid(project.id)}, 'completed', ${lit(date)}::date, ${lit(date)}::date, ${lit(project.region || "JP")}, ${lit(project.language || "ja")}, ${ts(requestedAt ?? measuredAt)}, ${ts(measuredAt)}) returning id::text as id`);
  return single(rows, "insert measurement run");
}

async function insertRunItem(db: LocalPostgresClient, runId: string, promptId: string, personaId: string, modelId: string, measuredAt: string, latencyMs: number) {
  const rows = await db.query<{ id: string }>(`insert into public.run_items (run_id, prompt_id, persona_id, model_id, status, latency_ms, captured_at) values (${uuid(runId)}, ${uuid(promptId)}, ${uuid(personaId)}, ${uuid(modelId)}, 'completed', ${num(Math.max(0, Math.round(latencyMs || 0)))}, ${ts(measuredAt)}) returning id::text as id`);
  return single(rows, "insert run item");
}

async function insertConversation(input: { db: LocalPostgresClient; runItemId: string; rawAnswer: string; analysis: AnalysisInspectionPayload; raw: RawInspectionPayload; responseId: string; measuredAt: string }) {
  const { db, runItemId, rawAnswer, analysis, raw, responseId, measuredAt } = input;
  const rows = await db.query<{ id: string; response_id: string | null }>(`
    insert into public.ai_conversations (run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, provider, model_requested, model_returned, response_id, raw_response, usage, web_search_enabled, citation_status, measured_at, response_time_ms)
    values (${uuid(runItemId)}, ${lit(rawAnswer)}, ${nullable(buildAnswerSummary(rawAnswer))}, ${lit(createHashValue(rawAnswer))}, ${lit(analysis.prompt)}, ${lit(analysis.modelReturned || raw.request.model)}, ${ts(measuredAt)}, ${lit(PROVIDER)}, ${lit(analysis.modelRequested || raw.request.model)}, ${nullable(analysis.modelReturned || readString(raw.response.model))}, ${lit(responseId)}, ${jsonb(raw.response)}, ${jsonb(analysis.usage ?? (raw.response.usage as JsonValue | undefined) ?? null)}, ${bool(raw.request.webSearchEnabled)}, ${lit(normalizeCitationStatus(analysis.citationStatus))}, ${ts(measuredAt)}, ${num(Math.max(0, Math.round(analysis.responseTimeMs || raw.responseTimeMs || 0)))})
    returning id::text as id, response_id
  `);
  return single(rows, "insert AI conversation");
}

async function insertBrandMentions(db: LocalPostgresClient, conversationId: string, brands: BrandRow[], analysis: AnalysisInspectionPayload) {
  const mentionRows = [{ brandName: analysis.targetBrand, mentioned: analysis.targetBrandMentioned, mentionCount: analysis.mentionCount, firstMentionIndex: analysis.firstMentionIndex, estimatedAnswerRank: analysis.estimatedAnswerRank, recommendationStatus: analysis.recommendationStatus, sentiment: analysis.sentiment, evidenceSnippet: analysis.evidenceSnippet }, ...analysis.competitorMentions];
  for (const mention of mentionRows) {
    const brand = brands.find((item) => item.name === mention.brandName);
    if (!brand) throw new Error(`Brand from analysis not found in DB: ${mention.brandName}`);
    const recommendationStatus = normalizeRecommendationStatus(mention.recommendationStatus);
    await db.query(`
      insert into public.brand_mentions (conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, mention_count, first_mention_index, evidence_snippet, confidence, matched_alias)
      values (${uuid(conversationId)}, ${uuid(brand.id)}, ${bool(mention.mentioned)}, ${nullableNum(mention.estimatedAnswerRank)}, ${lit(recommendationStatus)}, ${lit(normalizeSentiment(mention.sentiment))}, ${num(scoreRecommendation(recommendationStatus, mention.mentioned))}, ${nullable(mention.evidenceSnippet)}, ${num(Math.max(0, Math.round(mention.mentionCount ?? 0)))}, ${nullableNum(mention.firstMentionIndex)}, ${nullable(mention.evidenceSnippet)}, 'high', ${nullable(mention.mentioned ? mention.brandName : null)})
    `);
  }
  return mentionRows.length;
}

async function insertCitations(db: LocalPostgresClient, conversationId: string, projectId: string, brands: BrandRow[], analysis: AnalysisInspectionPayload, outputText: string) {
  let sourceDomainsCreated = 0;
  let citationsCreated = 0;
  for (const citation of analysis.citations) {
    const domain = citation.domain || safeHostname(citation.url);
    if (!domain) continue;
    const sourceDomain = await getOrCreateSourceDomain(db, projectId, domain);
    if (sourceDomain.created) sourceDomainsCreated += 1;
    const relatedBrand = findBrandByDomain(brands, domain);
    await db.query(`
      insert into public.citations (conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, canonical_url, start_index, end_index, cited_text, raw_citation, brand_related)
      values (${uuid(conversationId)}, ${nullableUuid(relatedBrand?.id ?? null)}, ${uuid(sourceDomain.row.id)}, ${lit(citation.url)}, ${lit(domain)}, ${nullable(citation.title)}, ${lit(mapCitationSourceType(citation.sourceType))}, null, 1, ${lit(canonicalizeUrl(citation.url))}, ${nullableNum(citation.startIndex)}, ${nullableNum(citation.endIndex)}, ${nullable(getCitedText(outputText, citation.startIndex, citation.endIndex))}, ${jsonb(citation as unknown as JsonValue)}, ${lit(classifyBrandRelatedness(relatedBrand))})
    `);
    citationsCreated += 1;
  }
  return { sourceDomainsCreated, citationsCreated };
}

async function getOrCreateSourceDomain(db: LocalPostgresClient, projectId: string, domain: string): Promise<{ row: SourceDomainRow; created: boolean }> {
  const existing = await findSourceDomain(db, projectId, domain);
  if (existing) return { row: existing, created: false };
  const rows = await db.query<SourceDomainRow>(`insert into public.source_domains (project_id, domain, source_type, trust_label) values (${uuid(projectId)}, ${lit(domain)}, 'unknown', 'OpenAI web_search observation') on conflict (project_id, domain) do update set domain = excluded.domain returning id::text as id, domain`);
  return { row: single(rows, `insert source domain ${domain}`), created: true };
}

async function findSourceDomain(db: LocalPostgresClient, projectId: string, domain: string) {
  const rows = await db.query<SourceDomainRow>(`select id::text as id, domain from public.source_domains where project_id = ${uuid(projectId)} and domain = ${lit(domain)} limit 1`);
  return rows[0] ?? null;
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

function printSummary(projectSlug: string, variantsResult: VariantImportResult[]) {
  const totals = variantsResult.reduce<ImportTotals>((acc, item) => ({ measurementRuns: acc.measurementRuns + item.measurementRuns, runItems: acc.runItems + item.runItems, aiConversations: acc.aiConversations + item.aiConversations, brandMentions: acc.brandMentions + item.brandMentions, sourceDomains: acc.sourceDomains + item.sourceDomains, citations: acc.citations + item.citations }), { measurementRuns: 0, runItems: 0, aiConversations: 0, brandMentions: 0, sourceDomains: 0, citations: 0 });
  console.log(JSON.stringify({ projectSlug, variants: variantsResult, totals, note: "metric_snapshots and recommendations were not created. Existing response_id values are skipped." }, null, 2));
}

function emptyVariantResult(label: string, responseId: string, skipped: boolean): VariantImportResult { return { label, responseId, skipped, measurementRuns: 0, runItems: 0, aiConversations: 0, brandMentions: 0, sourceDomains: 0, citations: 0 }; }
async function readJson<T>(filename: string): Promise<T> { return JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, filename), "utf8")) as T; }
async function readText(filename: string) { return fs.readFile(path.join(OUTPUT_DIR, filename), "utf8"); }
function single<T>(rows: T[], context: string) { if (!rows[0]) throw new Error(`${context}: no row returned`); return rows[0]; }
function lit(value: string) { return `'${value.replace(/'/g, "''")}'`; }
function nullable(value: string | null | undefined) { return value ? lit(value) : "null"; }
function num(value: number) { return Number.isFinite(value) ? String(value) : "null"; }
function nullableNum(value: number | null | undefined) { return typeof value === "number" && Number.isFinite(value) ? String(value) : "null"; }
function bool(value: boolean) { return value ? "true" : "false"; }
function uuid(value: string) { return `${lit(value)}::uuid`; }
function nullableUuid(value: string | null | undefined) { return value ? uuid(value) : "null"; }
function ts(value: string | null | undefined) { return value ? `${lit(value)}::timestamptz` : "null"; }
function jsonb(value: JsonValue | undefined) { return value === undefined || value === null ? "null" : `${lit(JSON.stringify(value))}::jsonb`; }
function createHashValue(value: string) { return createHash("sha256").update(value).digest("hex"); }
function buildAnswerSummary(value: string) { const normalized = value.replace(/\s+/g, " ").trim(); return normalized.slice(0, 240) || null; }function normalizeCitationStatus(value: string): CitationStatus { if (value === "not_requested") return "not_requested"; if (value === "available") return "available"; if (value === "partial") return "partial"; if (value === "error") return "error"; if (value === "none_returned" || value === "unavailable") return "unavailable"; return "unknown"; }
function normalizeRecommendationStatus(value: string): RecommendationStatus { if (value === "strongly_recommended") return "strongly_recommended"; if (value === "recommended") return "recommended"; if (value === "listed" || value === "compared") return "listed"; if (value === "discouraged") return "discouraged"; if (value === "neutral" || value === "neutral_mention") return "neutral"; return "absent"; }
function normalizeSentiment(value: string): Sentiment { if (value === "positive" || value === "neutral" || value === "negative" || value === "unclear") return value; return "unclear"; }
function scoreRecommendation(status: RecommendationStatus, mentioned: boolean) { if (status === "strongly_recommended") return 5; if (status === "recommended") return 4; if (status === "listed") return 2; if (status === "neutral") return mentioned ? 1 : 0; return 0; }
function mapCitationSourceType(value: string): SourceType { if (value === "owned" || value === "competitor" || value === "media" || value === "review" || value === "technical") return value; return "unknown"; }
function classifyBrandRelatedness(brand: BrandRow | null | undefined): BrandRelatedness { if (!brand) return "general"; return brand.brand_type === "primary" ? "target_brand" : "competitor"; }
function findBrandByDomain(brands: BrandRow[], domain: string) { const normalizedDomain = normalizeDomain(domain); return brands.find((brand) => brand.domain && normalizeDomain(brand.domain) === normalizedDomain) ?? null; }
function normalizeDomain(value: string) { return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase(); }
function safeHostname(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } }
function canonicalizeUrl(url: string) { try { const parsed = new URL(url); for (const key of Array.from(parsed.searchParams.keys())) if (key.toLowerCase().startsWith("utm_")) parsed.searchParams.delete(key); parsed.hash = ""; return parsed.toString(); } catch { return url; } }
function getCitedText(text: string, startIndex: NullableNumber, endIndex: NullableNumber) { if (typeof startIndex !== "number" || typeof endIndex !== "number") return null; if (startIndex < 0 || endIndex < startIndex || startIndex >= text.length) return null; return text.slice(startIndex, Math.min(endIndex, text.length)); }
function toDateOnly(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10); return date.toISOString().slice(0, 10); }
function readString(value: JsonValue | undefined) { return typeof value === "string" ? value : ""; }

type PgMessage = { type: string; payload: Buffer };

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
        if (code === 3) { this.sendPassword(this.password); continue; }
        if (code === 5) { this.sendPassword(buildMd5Password(this.user, this.password, message.payload.subarray(4, 8))); continue; }
        if (code === 10) { await this.handleScram(message.payload.subarray(4)); continue; }
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
    if (serverFirstMessage.type !== "R" || serverFirstMessage.payload.readInt32BE(0) !== 11) throw new Error("Unexpected PostgreSQL SASL first response.");
    const serverFirst = serverFirstMessage.payload.subarray(4).toString("utf8");
    const attributes = parseScramAttributes(serverFirst);
    const serverNonce = attributes.r;
    const salt = attributes.s ? Buffer.from(attributes.s, "base64") : null;
    const iterations = Number(attributes.i);
    if (!serverNonce || !serverNonce.startsWith(clientNonce) || !salt || !Number.isFinite(iterations)) throw new Error("Invalid PostgreSQL SCRAM challenge.");
    const clientFinalWithoutProof = `c=biws,r=${serverNonce}`;
    const authMessage = `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(`${clientFinalWithoutProof},p=${xorBuffers(clientKey, signature).toString("base64")}`);
  }
  private sendPassword(password: string) { this.sendMessage("p", Buffer.from(`${password}\0`, "utf8")); }
  private sendSaslInitial(mechanism: string, response: string) { const mechanismBuffer = Buffer.from(`${mechanism}\0`, "utf8"); const responseBuffer = Buffer.from(response, "utf8"); this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer])); }
  private sendSaslResponse(response: string) { this.sendMessage("p", Buffer.from(response, "utf8")); }
  private sendMessage(type: string, payload: Buffer) { this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload])); }
  private sendRaw(payload: Buffer) { if (!this.socket || this.socket.destroyed) throw new Error("PostgreSQL socket is not connected."); this.socket.write(payload); }

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
        const cleanup = () => { socket.off("error", onError); socket.off("close", onClose); const index = this.waiters.indexOf(onData); if (index >= 0) this.waiters.splice(index, 1); };
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
    if (length === -1) { row[fields[index] ?? `column_${index}`] = null; continue; }
    row[fields[index] ?? `column_${index}`] = payload.subarray(offset, offset + length).toString("utf8");
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
  const inner = createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
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
