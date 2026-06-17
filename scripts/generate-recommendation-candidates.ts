import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PROJECT_SLUG = process.env.RECORA_DEFAULT_PROJECT_SLUG ?? "recora-kenzai-q2";
const OUTPUT_DIR = path.join(process.cwd(), "output", "recommendation-candidates");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "recommendation-candidates.json");
const OUTPUT_MD = path.join(OUTPUT_DIR, "recommendation-candidates.md");
const TABLES = ["measurement_runs", "run_items", "ai_conversations", "brand_mentions", "citations", "source_domains", "recommendations"] as const;

type Row = Record<string, string | null>;
type Priority = "P0" | "P1" | "P2";
type Confidence = "high" | "medium" | "low";
type SaveDecision = "save" | "review_required" | "candidate_only";
type CandidateType = "brand_absent" | "competitor_category_drift" | "citation_mismatch" | "owned_site_not_cited" | "comparison_content_gap" | "case_study_gap" | "faq_structure_gap" | "misinformation_or_category_risk" | "source_friendly_page_gap";
type ProjectRow = { id: string; slug: string; name: string };
type BrandRow = { id: string; name: string; brand_type: "primary" | "competitor"; domain: string | null };
type TopicRow = { id: string; name: string; intent: string | null };
type ConversationRow = { id: string; run_item_id: string; run_id: string; prompt_id: string | null; topic_id: string | null; topic_name: string | null; prompt_text: string | null; prompt_text_snapshot: string; raw_answer: string; provider: string | null; response_id: string | null; web_search_enabled: string | null; citation_status: string | null; measured_at: string | null; model_returned: string | null };
type MentionRow = { conversation_id: string; brand_id: string; brand_name: string; brand_type: "primary" | "competitor"; mentioned: string; mention_count: string | null; evidence_snippet: string | null };
type CitationRow = { id: string; conversation_id: string; url: string; domain: string; source_type: string | null; source_domain_type: string | null; supports_claim: string | null; brand_related: string | null; cited_text: string | null };
type Evidence = { observation_count: number; conversation_ids: string[]; run_item_ids: string[]; prompt_texts: string[]; response_excerpts: string[]; target_brand_present: boolean; competitor_presence: Array<{ brand: string; mentioned: boolean; mention_count: number }>; citation_statuses: string[]; web_search_enabled_values: boolean[]; cited_urls: string[]; cited_domains: string[]; source_domain_types: string[]; brand_related_values: string[]; supports_claim_values: string[]; measured_at_values: string[]; evidence_label: string };
type Candidate = { id: string; title: string; priority: Priority; type: CandidateType; summary: string; rationale: string; evidence: Evidence; expected_impact: string; effort: string; related_observation_ids: string[]; related_urls: string[]; related_brands: string[]; related_topics: string[]; confidence: Confidence; should_save_to_recommendations: SaveDecision; save_reason: string; caution: string; suggested_next_action: string };
type Context = { project: ProjectRow; brands: BrandRow[]; topics: TopicRow[]; conversations: ConversationRow[]; seedConversations: ConversationRow[]; openaiConversations: ConversationRow[]; mentions: MentionRow[]; citations: CitationRow[]; openaiMentions: MentionRow[]; openaiCitations: CitationRow[]; webSearchCitations: CitationRow[]; primaryBrand: BrandRow; competitorBrands: BrandRow[]; evidence: Evidence };
type CountSnapshot = Record<string, number>;
type PgMessage = { type: string; payload: Buffer };

async function main() {
  await loadEnvLocal();
  const db = new LocalPostgresClient(process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL);
  await db.connect();
  try {
    const before = await getCounts(db);
    const context = await loadContext(db);
    const candidates = buildCandidates(context);
    const after = await getCounts(db);
    await writeOutputs(context, candidates, before, after);
    console.log(JSON.stringify({ projectSlug: context.project.slug, openaiConversations: context.openaiConversations.length, seedConversations: context.seedConversations.length, openaiCitations: context.openaiCitations.length, candidates: candidates.length, priorityBreakdown: countBy(candidates, (c) => c.priority), confidenceBreakdown: countBy(candidates, (c) => c.confidence), saveDecisionBreakdown: countBy(candidates, (c) => c.should_save_to_recommendations), output: { json: OUTPUT_JSON, markdown: OUTPUT_MD }, dbCountsUnchanged: sameCounts(before, after), dbCountsBefore: before, dbCountsAfter: after }, null, 2));
  } finally {
    db.end();
  }
}

async function loadContext(db: LocalPostgresClient): Promise<Context> {
  const project = await getProject(db);
  const brands = await getBrands(db, project.id);
  const topics = await getTopics(db, project.id);
  const conversations = await getConversations(db, project.id);
  const ids = conversations.map((c) => c.id);
  const mentions = await getMentions(db, ids);
  const citations = await getCitations(db, ids);
  const primaryBrand = brands.find((b) => b.brand_type === "primary");
  if (!primaryBrand) throw new Error("Primary brand was not found.");
  const competitorBrands = brands.filter((b) => b.brand_type === "competitor");
  const openaiConversations = conversations.filter(isOpenAiObservation);
  const seedConversations = conversations.filter((c) => !isOpenAiObservation(c));
  const openaiIds = new Set(openaiConversations.map((c) => c.id));
  const openaiMentions = mentions.filter((m) => openaiIds.has(m.conversation_id));
  const openaiCitations = citations.filter((c) => openaiIds.has(c.conversation_id));
  const webIds = new Set(openaiConversations.filter((c) => parseBool(c.web_search_enabled)).map((c) => c.id));
  const webSearchCitations = openaiCitations.filter((c) => webIds.has(c.conversation_id));
  const evidence = buildEvidence(openaiConversations, openaiMentions, openaiCitations, primaryBrand, competitorBrands);
  return { project, brands, topics, conversations, seedConversations, openaiConversations, mentions, citations, openaiMentions, openaiCitations, webSearchCitations, primaryBrand, competitorBrands, evidence };
}

function buildCandidates(context: Context): Candidate[] {
  const e = context.evidence;
  const relatedTopics = getRelatedTopics(context);
  const allBrands = [context.primaryBrand.name, ...context.competitorBrands.map((b) => b.name)];
  const citedDomains = new Set(e.cited_domains.map(normalizeDomain));
  const ownedHints = [context.primaryBrand.domain, "recora-kenzai.example"].filter((v): v is string => Boolean(v)).map(normalizeDomain);
  const ownedCited = ownedHints.some((d) => citedDomains.has(d));
  const configuredCompetitorPresent = e.competitor_presence.some((item) => item.mentioned);
  const generalCitations = context.openaiCitations.filter((c) => ["general", "unknown", "unrelated", null].includes(c.brand_related ?? null));
  const candidates: Candidate[] = [];
  if (context.openaiConversations.length > 0 && !e.target_brand_present) candidates.push(candidate("openai-brand-absent", "brand_absent", "自社ブランドがAI回答候補に出ていない可能性", "P1", context.openaiConversations.length >= 2 ? "medium" : "low", "review_required", "今回のOpenAI実測では、対象ブランドの言及を確認できませんでした。", "no-searchとweb-searchの両方で自社名が出ていないため、発見クエリに対する説明と実体情報の整備を確認する価値があります。", "追加観測で同傾向が出る場合、ブランド発見率の改善候補になります。", "中", allBrands, relatedTopics, e, "OpenAI実測はありますが、1〜2件の観測のため人間確認が必要です。", "同じプロンプトを複数モデルで再測定し、製品・選び方・FAQページの記述と照合してください。"));
  if (context.openaiConversations.length > 0 && !configuredCompetitorPresent && generalCitations.length > 0) candidates.push(candidate("openai-competitor-category-drift", "competitor_category_drift", "設定競合ではなく別カテゴリ候補に流れている可能性", "P1", "medium", "review_required", "設定済み競合の言及が確認できず、別ドメインや別カテゴリに寄った可能性があります。", "web-searchの引用URLは取得できていますが、自社・設定競合との結びつきが弱いものが含まれます。", "カテゴリ定義と競合比較軸を明確にする候補です。", "中", allBrands, relatedTopics, e, "引用URLの分類に人間確認が必要です。", "引用ドメインが建材・タイル選定の文脈に適しているかを確認してください。"));
  if (context.webSearchCitations.length > 0 && generalCitations.length > 0) candidates.push(candidate("openai-citation-mismatch", "citation_mismatch", "Web検索時の引用元がEC・海外・別カテゴリに偏っている可能性", "P1", "medium", "review_required", "web-searchありの観測では引用URLが返っていますが、自社や設定競合に直接結びつく参照元は限られています。", "supports_claimは未検証です。URLの存在だけを根拠にせず、ドメインの性質と引用位置を確認します。", "参照元のずれを直すための優先確認項目です。", "中", allBrands, relatedTopics, e, "web-searchありでURLは確認できましたが、カテゴリ分類は人間確認が必要です。", "引用URLをドメイン種別に分け、自社公式・業界メディア・レビュー・ECのどれに寄っているか確認してください。"));
  if (context.webSearchCitations.length > 0 && !ownedCited) candidates.push(candidate("openai-owned-site-not-cited", "owned_site_not_cited", "自社公式サイト・比較記事・FAQ・事例が引用されていない可能性", "P1", "medium", "review_required", "web-searchありの観測で、自社公式ドメインの引用は確認できませんでした。", "一回のweb-search観測のため断定はできませんが、AIが参照しやすい公式根拠ページが足りないか、見つけにくい可能性があります。", "公式ページを引用されやすい状態に整えるための候補です。", "中", [context.primaryBrand.name], relatedTopics, e, "公式ドメイン定義と対象ページの確認が必要です。", "公式サイトに、選び方、比較表、FAQ、施工事例をまとめた参照しやすいページがあるか確認してください。"));
  candidates.push(candidate("openai-source-friendly-page-gap", "source_friendly_page_gap", "AIが参照しやすいページ構造や説明文が不足している可能性", "P2", "low", "candidate_only", "今回の観測だけでは断定できませんが、引用されやすい状態を整えるための候補です。", "自社不在や公式未引用が続く場合に備え、用語定義、FAQ、選定基準、事例のまとめ方を見直す価値があります。", "中長期で引用候補を増やすための基盤整備候補です。", "低〜中", [context.primaryBrand.name], relatedTopics, e, "根拠はまだ推定止まりのため、保存前に追加観測が必要です。", "FAQ、用語定義、比較軸、施工事例の各ページを棚卸しし、プロンプトと対応する根拠を表で整理してください。"));
  return candidates;
}

function candidate(id: string, type: CandidateType, title: string, priority: Priority, confidence: Confidence, decision: SaveDecision, summary: string, rationale: string, expectedImpact: string, effort: string, brands: string[], topics: string[], evidence: Evidence, saveReason: string, nextAction: string): Candidate {
  return { id, title, priority, type, summary, rationale, evidence, expected_impact: expectedImpact, effort, related_observation_ids: evidence.conversation_ids, related_urls: evidence.cited_urls, related_brands: unique(brands), related_topics: unique(topics), confidence, should_save_to_recommendations: decision, save_reason: saveReason, caution: "今回の候補はRecora独自の観測であり、AIプラットフォーム公式評価ではありません。観測数が少ないため、追加観測で確認する必要があります。", suggested_next_action: nextAction };
}

function buildEvidence(conversations: ConversationRow[], mentions: MentionRow[], citations: CitationRow[], primary: BrandRow, competitors: BrandRow[]): Evidence {
  const primaryMentions = mentions.filter((m) => m.brand_id === primary.id || m.brand_name === primary.name);
  const targetBrandPresent = primaryMentions.some((m) => parseBool(m.mentioned) || toNum(m.mention_count) > 0) || conversations.some((c) => c.raw_answer.includes(primary.name));
  return { observation_count: conversations.length, conversation_ids: conversations.map((c) => c.id), run_item_ids: unique(conversations.map((c) => c.run_item_id)), prompt_texts: unique(conversations.map((c) => c.prompt_text ?? c.prompt_text_snapshot)), response_excerpts: conversations.map((c) => excerpt(c.raw_answer, 280)), target_brand_present: targetBrandPresent, competitor_presence: competitors.map((brand) => { const rows = mentions.filter((m) => m.brand_id === brand.id || m.brand_name === brand.name); return { brand: brand.name, mentioned: rows.some((m) => parseBool(m.mentioned) || toNum(m.mention_count) > 0), mention_count: rows.reduce((sum, m) => sum + toNum(m.mention_count), 0) }; }), citation_statuses: unique(conversations.map((c) => c.citation_status ?? "unknown")), web_search_enabled_values: Array.from(new Set(conversations.map((c) => parseBool(c.web_search_enabled)))), cited_urls: unique(citations.map((c) => c.url)), cited_domains: unique(citations.map((c) => c.domain)), source_domain_types: unique(citations.map((c) => c.source_domain_type ?? c.source_type ?? "unknown")), brand_related_values: unique(citations.map((c) => c.brand_related ?? "unknown")), supports_claim_values: unique(citations.map((c) => c.supports_claim ?? "null")), measured_at_values: unique(conversations.map((c) => c.measured_at ?? "unknown")), evidence_label: `OpenAI実測${conversations.length}件（no-search/web-searchを含む）。Recora独自の観測であり、AIプラットフォーム公式評価ではありません。` };
}

function getRelatedTopics(context: Context) {
  const ids = new Set(context.openaiConversations.map((c) => c.topic_id).filter(Boolean));
  const names = context.topics.filter((t) => ids.has(t.id)).map((t) => t.name);
  return names.length > 0 ? unique(names) : ["AI検索上の発見性"];
}

async function writeOutputs(context: Context, candidates: Candidate[], before: CountSnapshot, after: CountSnapshot) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const payload = {
    generated_at: new Date().toISOString(),
    project_slug: context.project.slug,
    project_name: context.project.name,
    note: "今回の出力はRecora独自の観測にもとづく改善提案候補です。AIプラットフォーム公式評価ではありません。",
    data_scope: {
      seed_conversation_count: context.seedConversations.length,
      openai_conversation_count: context.openaiConversations.length,
      openai_citation_count: context.openaiCitations.length,
      web_search_citation_count: context.webSearchCitations.length
    },
    db_write_check: { before, after, unchanged: sameCounts(before, after) },
    candidates
  };
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
  await fs.writeFile(OUTPUT_MD, renderMarkdown(payload), "utf8");
}

function renderMarkdown(payload: { generated_at: string; project_slug: string; project_name: string; note: string; data_scope: Record<string, number>; db_write_check: { unchanged: boolean }; candidates: Candidate[] }) {
  const lines = ["# Recora 改善提案候補", "", `- 生成日時: ${payload.generated_at}`, `- プロジェクト: ${payload.project_name} (${payload.project_slug})`, `- メモ: ${payload.note}`, `- DB書き込み: ${payload.db_write_check.unchanged ? "なし（件数変化なし）" : "要確認（件数に変化あり）"}`, "", "## 対象データ", ""];
  for (const [key, value] of Object.entries(payload.data_scope)) lines.push(`- ${key}: ${value}`);
  lines.push("", "## 候補一覧", "");
  for (const c of payload.candidates) {
    lines.push(`### ${c.title}`, "", `- 優先度: ${c.priority}`, `- confidence: ${c.confidence}`, `- 保存判定: ${c.should_save_to_recommendations}`, `- 根拠: ${c.rationale}`, `- 観測件数: ${c.evidence.observation_count}`, `- 引用ドメイン: ${c.evidence.cited_domains.length ? c.evidence.cited_domains.join(", ") : "なし"}`, `- 注意書き: ${c.caution}`, `- 次の推奨アクション: ${c.suggested_next_action}`, "");
  }
  return lines.join("\n") + "\n";
}
async function getProject(db: LocalPostgresClient) {
  const rows = await db.query<ProjectRow>("select id::text as id, slug, name from public.projects where slug = " + lit(PROJECT_SLUG) + " limit 1");
  if (!rows[0]) throw new Error("Project not found: " + PROJECT_SLUG);
  return rows[0];
}
async function getBrands(db: LocalPostgresClient, projectId: string) {
  return db.query<BrandRow>("select id::text as id, name, brand_type, domain from public.brands where project_id = " + uuid(projectId) + " order by brand_type asc, name asc");
}
async function getTopics(db: LocalPostgresClient, projectId: string) {
  return db.query<TopicRow>("select id::text as id, name, intent from public.topics where project_id = " + uuid(projectId) + " order by created_at asc");
}
async function getConversations(db: LocalPostgresClient, projectId: string) {
  return db.query<ConversationRow>("select c.id::text as id, c.run_item_id::text as run_item_id, ri.run_id::text as run_id, ri.prompt_id::text as prompt_id, p.topic_id::text as topic_id, t.name as topic_name, p.text as prompt_text, c.prompt_text_snapshot, c.raw_answer, c.provider, c.response_id, c.web_search_enabled::text as web_search_enabled, c.citation_status::text as citation_status, c.measured_at::text as measured_at, c.model_returned from public.ai_conversations c join public.run_items ri on ri.id = c.run_item_id join public.measurement_runs mr on mr.id = ri.run_id left join public.prompts p on p.id = ri.prompt_id left join public.topics t on t.id = p.topic_id where mr.project_id = " + uuid(projectId) + " order by c.created_at asc");
}
async function getMentions(db: LocalPostgresClient, conversationIds: string[]) {
  if (conversationIds.length === 0) return [];
  return db.query<MentionRow>("select bm.conversation_id::text as conversation_id, bm.brand_id::text as brand_id, b.name as brand_name, b.brand_type, bm.mentioned::text as mentioned, bm.mention_count::text as mention_count, coalesce(bm.evidence_snippet, bm.mention_text) as evidence_snippet from public.brand_mentions bm join public.brands b on b.id = bm.brand_id where bm.conversation_id in (" + uuidList(conversationIds) + ") order by b.brand_type asc, b.name asc");
}
async function getCitations(db: LocalPostgresClient, conversationIds: string[]) {
  if (conversationIds.length === 0) return [];
  return db.query<CitationRow>("select c.id::text as id, c.conversation_id::text as conversation_id, c.url, c.domain, c.source_type::text as source_type, sd.source_type::text as source_domain_type, c.supports_claim::text as supports_claim, c.brand_related::text as brand_related, c.cited_text from public.citations c left join public.source_domains sd on sd.id = c.source_domain_id where c.conversation_id in (" + uuidList(conversationIds) + ") order by c.created_at asc");
}
async function getCounts(db: LocalPostgresClient) {
  const result: CountSnapshot = {};
  for (const table of TABLES) {
    const rows = await db.query<{ count: string }>("select count(*)::text as count from public." + table);
    result[table] = Number(rows[0]?.count ?? 0);
  }
  return result;
}
function isOpenAiObservation(c: ConversationRow) {
  if (c.provider === "openai") return true;
  if (c.response_id) return true;
  const hasMetadata = Boolean(c.measured_at || c.model_returned || (c.citation_status && c.citation_status !== "unknown"));
  return hasMetadata && (c.web_search_enabled === "true" || c.web_search_enabled === "false");
}
async function loadEnvLocal() {
  try {
    const envText = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i <= 0) continue;
      const key = trimmed.slice(0, i).trim();
      const value = trimmed.slice(i + 1).trim().replace(/^[ '\"]|[ '\"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
function sameCounts(a: CountSnapshot, b: CountSnapshot) { return TABLES.every((table) => a[table] === b[table]); }
function unique(values: Array<string | null | undefined>) { return Array.from(new Set(values.filter((v): v is string => Boolean(v)))); }
function excerpt(value: string, length: number) { return value.replace(/\s+/g, " ").trim().slice(0, length); }
function parseBool(value: string | null | undefined) { return value === "true"; }
function toNum(value: string | null | undefined) { const n = Number(value ?? 0); return Number.isFinite(n) ? n : 0; }
function normalizeDomain(value: string) { return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase(); }
function lit(value: string) { return "'" + value.replace(/'/g, "''") + "'"; }
function uuid(value: string) { return lit(value) + "::uuid"; }
function uuidList(values: string[]) { return values.map(uuid).join(", "); }
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



