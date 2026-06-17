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
const SOURCE_CLASSIFICATION_NOTE = "URL分類はRecora内の簡易分類です。source_domain_types は確定分類ではないため、実URLの内容確認が必要です。";
const SOURCE_CLASSIFICATION_UNKNOWN_NOTE = "URL分類はRecora内の簡易分類です。source_domain_types は確定分類ではありません。引用元のカテゴリ分類が未確定のURLがあるため、実URLの内容確認が必要です。";
const URLLESS_SUPPORTS_CLAIM_NOTE = "この候補では引用URLを主証拠にしていません。supports_claim は引用URLがある候補で確認対象になります。";

type Row = Record<string, string | null>;
type Priority = "P0" | "P1" | "P2";
type Confidence = "high" | "medium" | "low";
type SaveDecision = "save" | "review_required" | "candidate_only";
type CandidateType = "brand_absent" | "competitor_category_drift" | "citation_mismatch" | "owned_site_not_cited" | "comparison_content_gap" | "case_study_gap" | "faq_structure_gap" | "misinformation_or_category_risk" | "source_friendly_page_gap";
type SourceDomainType = "owned" | "competitor" | "ec" | "manufacturer" | "media" | "foreign_brand" | "unknown";
type DataSource = "openai_inspection_only" | "seed_only" | "mixed";
type NormalizedSupportsClaim = "true" | "false" | "unknown";
type ProjectRow = { id: string; slug: string; name: string };
type BrandRow = { id: string; name: string; brand_type: "primary" | "competitor"; domain: string | null };
type TopicRow = { id: string; name: string; intent: string | null };
type ConversationRow = { id: string; run_item_id: string; run_id: string; prompt_id: string | null; topic_id: string | null; topic_name: string | null; prompt_text: string | null; prompt_text_snapshot: string; raw_answer: string; provider: string | null; response_id: string | null; web_search_enabled: string | null; citation_status: string | null; measured_at: string | null; model_returned: string | null };
type MentionRow = { conversation_id: string; brand_id: string; brand_name: string; brand_type: "primary" | "competitor"; mentioned: string; mention_count: string | null; evidence_snippet: string | null };
type CitationRow = { id: string; conversation_id: string; url: string; domain: string; source_type: string | null; source_domain_type: string | null; supports_claim: string | null; brand_related: string | null; cited_text: string | null };
type CitationEvidence = { url: string; domain: string; source_domain_type: SourceDomainType; brand_related: string; supports_claim: NormalizedSupportsClaim; cited_text: string | null };
type Evidence = { observation_count: number; conversation_ids: string[]; run_item_ids: string[]; prompt_texts: string[]; response_excerpts: string[]; target_brand_present: boolean; competitor_presence: Array<{ brand: string; mentioned: boolean; mention_count: number }>; citation_statuses: string[]; web_search_enabled_values: boolean[]; cited_urls: string[]; cited_domains: string[]; citation_details: CitationEvidence[]; source_domain_types: SourceDomainType[]; brand_related_values: string[]; supports_claim_values: NormalizedSupportsClaim[]; measured_at_values: string[]; data_source: DataSource; observation_scope: string; owned_domain_match_count: number; target_domain_known: boolean; source_classification_note: string; supports_claim_note: string; existing_recommendations_count: number; db_write_status: "not_written"; evidence_label: string };
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
    const candidates = buildCandidates(context, before.recommendations ?? 0);
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

function buildCandidates(context: Context, existingRecommendationsCount: number): Candidate[] {
  const e = { ...context.evidence, existing_recommendations_count: existingRecommendationsCount };
  const relatedTopics = getRelatedTopics(context);
  const allBrands = [context.primaryBrand.name, ...context.competitorBrands.map((b) => b.name)];
  const ownedCited = e.owned_domain_match_count > 0;
  const configuredCompetitorPresent = e.competitor_presence.some((item) => item.mentioned);
  const generalCitationDetails = e.citation_details.filter((c) => ["general", "unknown", "unrelated"].includes(c.brand_related));
  const reviewCitationDetails = e.citation_details.filter((c) => c.source_domain_type !== "owned" && c.source_domain_type !== "competitor").slice(0, 6);
  const representativeCitationDetails = reviewCitationDetails.slice(0, 3);
  const hasClassifiedSource = reviewCitationDetails.some((c) => c.source_domain_type !== "unknown");
  const citationConfidence: Confidence = hasClassifiedSource ? "medium" : "low";
  const ownedSiteConfidence: Confidence = e.target_domain_known ? "medium" : "low";
  const brandAbsentEvidence = scopeEvidence(e, [], {
    source_classification_note: "ブランド非表示候補では、URLではなく回答本文とブランド言及の不在を主証拠にしています。",
    supports_claim_note: URLLESS_SUPPORTS_CLAIM_NOTE
  });
  const competitorDriftEvidence = scopeEvidence(e, generalCitationDetails.slice(0, 3), {
    source_classification_note: hasClassifiedSource ? e.source_classification_note : SOURCE_CLASSIFICATION_UNKNOWN_NOTE + " 設定競合から別カテゴリへ流れているかは追加確認が必要です。"
  });
  const citationMismatchEvidence = scopeEvidence(e, reviewCitationDetails, {
    source_classification_note: hasClassifiedSource ? e.source_classification_note : SOURCE_CLASSIFICATION_UNKNOWN_NOTE + " EC・海外・別カテゴリへの偏りは断定せず追加確認が必要です。"
  });
  const ownedSiteEvidence = scopeEvidence(e, representativeCitationDetails, {
    source_classification_note: e.target_domain_known ? e.source_classification_note : SOURCE_CLASSIFICATION_UNKNOWN_NOTE + " 自社公式ドメイン定義と照合したうえで、公式サイト未引用かどうかを確認する必要があります。"
  });
  const sourceFriendlyEvidence = scopeEvidence(e, [], {
    source_classification_note: "ページ構造不足は今回の観測だけでは推定止まりです。引用URLではなく追加観測とサイト棚卸しで確認します。",
    supports_claim_note: URLLESS_SUPPORTS_CLAIM_NOTE
  });
  const candidates: Candidate[] = [];
  if (context.openaiConversations.length > 0 && !e.target_brand_present) candidates.push(candidate("openai-brand-absent", "brand_absent", "自社ブランドがAI回答候補に出ていない可能性", "P1", context.openaiConversations.length >= 2 ? "medium" : "low", "review_required", "今回のOpenAI実測では、対象ブランドの言及を確認できませんでした。", "no-searchとweb-searchの両方で自社名が出ていないため、発見クエリに対する説明と実体情報の整備を確認する価値があります。", "追加観測で同傾向が出る場合、ブランド発見率の改善候補になります。", "中", allBrands, relatedTopics, brandAbsentEvidence, "最も保存に近い候補ですが、OpenAI実測2件のみのためreview_requiredに留めます。", "同じプロンプトを複数モデル・複数回で再測定し、製品・選び方・FAQページの記述と照合してください。"));
  if (context.openaiConversations.length > 0 && !configuredCompetitorPresent && generalCitationDetails.length > 0) candidates.push(candidate("openai-competitor-category-drift", "competitor_category_drift", "設定競合ではなく別カテゴリ候補に流れている可能性", "P2", "low", "candidate_only", "今回の観測では設定済み競合の言及が確認できず、想定カテゴリからずれている可能性があります。", "ただし、引用元の分類やカテゴリ適合性は未確定です。1〜2件の観測だけで競合流出とは断定しません。", "カテゴリ定義と競合比較軸を点検するための候補です。", "中", allBrands, relatedTopics, competitorDriftEvidence, "競合・カテゴリのずれはまだ弱い兆候のため、現時点では候補出力のみに留めます。", "引用ドメインが建材・タイル選定の文脈に適しているかを確認し、競合プロンプトを追加して再測定してください。"));
  if (context.webSearchCitations.length > 0 && reviewCitationDetails.length > 0) candidates.push(candidate("openai-citation-mismatch", "citation_mismatch", hasClassifiedSource ? "Web検索時の引用元にカテゴリ確認が必要なURLがあります" : "Web検索時の引用元分類が未確定です", "P1", citationConfidence, "review_required", hasClassifiedSource ? "web-searchありの観測では引用URLが返っており、一部URLは商材・カテゴリとの関連性を確認する必要があります。" : "web-searchありの観測では引用URLが返っていますが、引用元のカテゴリ分類が未確定のため追加確認が必要です。", "supports_claimはunknownとして扱います。URLの存在だけを根拠にせず、ドメインの性質・引用位置・主張支持の有無を確認します。", "参照元のずれを直すための優先確認項目です。", "中", allBrands, relatedTopics, citationMismatchEvidence, "web-searchありでURLは確認できましたが、主張支持とカテゴリ分類は保存前レビューが必要です。", "引用URLをドメイン種別に分け、自社公式・業界メディア・レビュー・ECのどれに寄っているか確認してください。"));
  if (context.webSearchCitations.length > 0 && (!ownedCited || !e.target_domain_known)) candidates.push(candidate("openai-owned-site-not-cited", "owned_site_not_cited", e.target_domain_known ? "自社公式サイトや根拠ページが引用されていない可能性" : "自社公式ドメイン定義と引用照合が必要です", "P1", ownedSiteConfidence, "review_required", e.target_domain_known ? "web-searchありの観測で、定義済み自社公式ドメインの引用は確認できませんでした。" : "DB上の自社公式ドメイン定義が明確でないため、公式サイト未引用とは断定せず、ドメイン定義との照合が必要です。", "一回のweb-search観測のため断定はできませんが、AIが参照しやすい公式根拠ページが足りないか、見つけにくい可能性があります。", "公式ページを引用されやすい状態に整えるための確認候補です。", "中", [context.primaryBrand.name], relatedTopics, ownedSiteEvidence, "公式ドメイン定義と対象ページの確認が必要なため、review_requiredに留めます。", "公式サイトに、選び方、比較表、FAQ、施工事例をまとめた参照しやすいページがあるか確認してください。"));
  candidates.push(candidate("openai-source-friendly-page-gap", "source_friendly_page_gap", "AIが参照しやすいページ構造や説明文が不足している可能性", "P2", "low", "candidate_only", "今回の観測だけでは断定できませんが、引用されやすい状態を整えるための候補です。", "自社不在や公式未引用が追加観測でも続く場合に備え、用語定義、FAQ、選定基準、事例のまとめ方を見直す価値があります。", "中長期で引用候補を増やすための基盤整備候補です。", "低〜中", [context.primaryBrand.name], relatedTopics, sourceFriendlyEvidence, "根拠はまだ推定止まりのため、保存せず候補出力のみに留めます。", "FAQ、用語定義、比較軸、施工事例の各ページを棚卸しし、プロンプトと対応する根拠を表で整理してください。"));
  return candidates;
}

function candidate(id: string, type: CandidateType, title: string, priority: Priority, confidence: Confidence, decision: SaveDecision, summary: string, rationale: string, expectedImpact: string, effort: string, brands: string[], topics: string[], evidence: Evidence, saveReason: string, nextAction: string): Candidate {
  const safeDecision = decision === "save" ? "review_required" : decision;
  return { id, title, priority, type, summary, rationale, evidence, expected_impact: expectedImpact, effort, related_observation_ids: evidence.conversation_ids, related_urls: evidence.cited_urls, related_brands: unique(brands), related_topics: unique(topics), confidence, should_save_to_recommendations: safeDecision, save_reason: saveReason, caution: "今回の候補はRecora独自の観測であり、AIプラットフォーム公式評価ではありません。観測数が少ないため、追加観測で確認する必要があります。", suggested_next_action: nextAction };
}

function buildEvidence(conversations: ConversationRow[], mentions: MentionRow[], citations: CitationRow[], primary: BrandRow, competitors: BrandRow[]): Evidence {
  const primaryMentions = mentions.filter((m) => m.brand_id === primary.id || m.brand_name === primary.name);
  const targetBrandPresent = primaryMentions.some((m) => parseBool(m.mentioned) || toNum(m.mention_count) > 0) || conversations.some((c) => c.raw_answer.includes(primary.name));
  const citationDetails = buildCitationDetails(citations, primary, competitors);
  const webSearchConversationCount = conversations.filter((c) => parseBool(c.web_search_enabled)).length;
  const hasUnknownSource = citationDetails.some((c) => c.source_domain_type === "unknown");
  const hasUnknownSupportsClaim = citationDetails.some((c) => c.supports_claim === "unknown");
  const targetDomainKnown = Boolean(primary.domain?.trim());
  const ownedDomainMatchCount = citationDetails.filter((c) => c.source_domain_type === "owned").length;
  return { observation_count: conversations.length, conversation_ids: conversations.map((c) => c.id), run_item_ids: unique(conversations.map((c) => c.run_item_id)), prompt_texts: unique(conversations.map((c) => c.prompt_text ?? c.prompt_text_snapshot)), response_excerpts: conversations.map((c) => excerpt(c.raw_answer, 280)), target_brand_present: targetBrandPresent, competitor_presence: competitors.map((brand) => { const rows = mentions.filter((m) => m.brand_id === brand.id || m.brand_name === brand.name); return { brand: brand.name, mentioned: rows.some((m) => parseBool(m.mentioned) || toNum(m.mention_count) > 0), mention_count: rows.reduce((sum, m) => sum + toNum(m.mention_count), 0) }; }), citation_statuses: unique(conversations.map((c) => c.citation_status ?? "unknown")), web_search_enabled_values: Array.from(new Set(conversations.map((c) => parseBool(c.web_search_enabled)))), cited_urls: unique(citationDetails.map((c) => c.url)), cited_domains: unique(citationDetails.map((c) => c.domain)), citation_details: citationDetails, source_domain_types: uniqueSourceTypes(citationDetails.map((c) => c.source_domain_type)), brand_related_values: unique(citationDetails.map((c) => c.brand_related)), supports_claim_values: uniqueSupportsClaims(citationDetails.map((c) => c.supports_claim)), measured_at_values: unique(conversations.map((c) => c.measured_at ?? "unknown")), data_source: "openai_inspection_only", observation_scope: `OpenAI実測${conversations.length}件、うちWeb検索あり${webSearchConversationCount}件`, owned_domain_match_count: ownedDomainMatchCount, target_domain_known: targetDomainKnown, source_classification_note: hasUnknownSource ? SOURCE_CLASSIFICATION_UNKNOWN_NOTE : SOURCE_CLASSIFICATION_NOTE, supports_claim_note: hasUnknownSupportsClaim ? "supports_claim がnullまたは未設定の引用はunknownに正規化し、主張支持は未検証として扱っています。" : "supports_claim は取得値に基づいて正規化しています。", existing_recommendations_count: 0, db_write_status: "not_written", evidence_label: `OpenAI実測${conversations.length}件（no-search/web-searchを含む）。Recora独自の観測であり、AIプラットフォーム公式評価ではありません。` };
}

function scopeEvidence(base: Evidence, citationDetails: CitationEvidence[], notes: Partial<Pick<Evidence, "source_classification_note" | "supports_claim_note">> = {}): Evidence {
  return { ...base, citation_details: citationDetails, cited_urls: unique(citationDetails.map((c) => c.url)), cited_domains: unique(citationDetails.map((c) => c.domain)), source_domain_types: uniqueSourceTypes(citationDetails.map((c) => c.source_domain_type)), brand_related_values: unique(citationDetails.map((c) => c.brand_related)), supports_claim_values: uniqueSupportsClaims(citationDetails.map((c) => c.supports_claim)), source_classification_note: notes.source_classification_note ?? base.source_classification_note, supports_claim_note: notes.supports_claim_note ?? base.supports_claim_note };
}

function buildCitationDetails(citations: CitationRow[], primary: BrandRow, competitors: BrandRow[]): CitationEvidence[] {
  return citations.map((citation) => ({ url: citation.url, domain: normalizeDomain(citation.domain || citation.url), source_domain_type: classifySourceDomain(citation, primary, competitors), brand_related: citation.brand_related ?? "unknown", supports_claim: normalizeSupportsClaim(citation.supports_claim), cited_text: citation.cited_text }));
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
      openai_web_search_conversation_count: context.openaiConversations.filter((c) => parseBool(c.web_search_enabled)).length,
      openai_citation_count: context.openaiCitations.length,
      web_search_citation_count: context.webSearchCitations.length
    },
    db_write_check: { before, after, unchanged: sameCounts(before, after) },
    candidates
  };
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
  await fs.writeFile(OUTPUT_MD, renderMarkdown(payload), "utf8");
}

function renderMarkdown(payload: { generated_at: string; project_slug: string; project_name: string; note: string; data_scope: Record<string, number>; db_write_check: { before: CountSnapshot; after: CountSnapshot; unchanged: boolean }; candidates: Candidate[] }) {
  const existingRecommendationsCount = payload.db_write_check.before.recommendations ?? 0;
  const lines = ["# Recora 改善提案候補", "", `- 生成日時: ${payload.generated_at}`, `- プロジェクト: ${payload.project_name} (${payload.project_slug})`, `- メモ: ${payload.note}`, `- 観測範囲: OpenAI実測${payload.data_scope.openai_conversation_count ?? 0}件、うちweb-searchあり${payload.data_scope.openai_web_search_conversation_count ?? 0}件`, `- 既存recommendations件数: ${existingRecommendationsCount}件（seed/既存データ。今回の生成では保存していません）`, "- 現時点で recommendations テーブルへ保存してよい候補: 0件", "- 今回生成した候補: すべて保存前レビュー対象", "- 実保存には追加観測または人間確認が必要", `- DB書き込み: ${payload.db_write_check.unchanged ? "なし（件数変化なし）" : "要確認（件数に変化あり）"}`, `- 注意: AIプラットフォーム公式評価ではなくRecora独自観測です`, "", "## 対象データ", ""];
  for (const [key, value] of Object.entries(payload.data_scope)) lines.push(`- ${key}: ${value}`);
  lines.push("", "## 候補一覧", "");
  for (const c of payload.candidates) {
    lines.push(`### ${c.title}`, "", `- ID: ${c.id}`, `- 優先度: ${c.priority}`, `- confidence: ${c.confidence}`, `- 保存判定: ${c.should_save_to_recommendations}`, `- 要約: ${c.summary}`, `- 根拠: ${c.rationale}`, `- 観測範囲: ${c.evidence.observation_scope}`, `- データソース: ${c.evidence.data_source}`, `- DB書き込み状態: ${c.evidence.db_write_status}`, `- 既存recommendations件数: ${c.evidence.existing_recommendations_count}`, `- 自社公式ドメイン定義あり: ${c.evidence.target_domain_known}`, `- 自社ドメイン引用一致数: ${c.evidence.owned_domain_match_count}`, `- source_domain_types: ${c.evidence.source_domain_types.length ? c.evidence.source_domain_types.join(", ") : "なし"}`, `- source_classification_note: ${c.evidence.source_classification_note}`, `- supports_claim_values: ${c.evidence.supports_claim_values.length ? c.evidence.supports_claim_values.join(", ") : "なし"}`, `- supports_claim_note: ${c.evidence.supports_claim_note}`, `- 引用ドメイン: ${c.evidence.cited_domains.length ? c.evidence.cited_domains.join(", ") : "なし"}`, `- 引用URL: ${c.related_urls.length ? c.related_urls.join(", ") : "なし"}`, `- 保存理由: ${c.save_reason}`, `- 注意書き: ${c.caution}`, `- 次の推奨アクション: ${c.suggested_next_action}`, "");
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
function classifySourceDomain(citation: CitationRow, primary: BrandRow, competitors: BrandRow[]): SourceDomainType {
  const existing = parseSourceDomainType(citation.source_domain_type ?? citation.source_type);
  if (existing && existing !== "unknown") return existing;
  const domain = normalizeDomain(citation.domain || citation.url);
  const primaryDomain = primary.domain ? normalizeDomain(primary.domain) : "";
  if (primaryDomain && domainMatches(domain, primaryDomain)) return "owned";
  const competitorDomains = competitors.map((brand) => brand.domain).filter((value): value is string => Boolean(value)).map(normalizeDomain);
  if (competitorDomains.some((competitorDomain) => domainMatches(domain, competitorDomain))) return "competitor";
  const ecHints = ["amazon.", "rakuten.co.jp", "shopping.yahoo.co.jp", "store.shopping.yahoo.co.jp", "lohaco.jp", "monotaro.com", "askul.co.jp"];
  if (ecHints.some((hint) => domain.includes(hint))) return "ec";
  const mediaHints = ["floorinsite", "dezeen", "archdaily", "magazine", "journal", "news", "blog"];
  if (mediaHints.some((hint) => domain.includes(hint))) return "media";
  const foreignBrandHints = ["lithosdesign", "taipingcarpets", "cole-and-son", "rafaelinteriors", "idoitalia", "bisazza", "porcelanosa", "mutina", "marazzi", "florim", "fiandre"];
  if (foreignBrandHints.some((hint) => domain.includes(hint))) return "foreign_brand";
  const manufacturerHints = ["lixil", "sangetsu", "aica", "tile", "tiles", "ceramic", "porcelain", "stone", "kenzai"];
  if (manufacturerHints.some((hint) => domain.includes(hint))) return "manufacturer";
  return "unknown";
}
function parseSourceDomainType(value: string | null | undefined): SourceDomainType | null {
  if (value === "owned" || value === "competitor" || value === "ec" || value === "manufacturer" || value === "media" || value === "foreign_brand" || value === "unknown") return value;
  return null;
}
function normalizeSupportsClaim(value: string | null | undefined): NormalizedSupportsClaim {
  if (value === "true") return "true";
  if (value === "false") return "false";
  return "unknown";
}
function uniqueSourceTypes(values: SourceDomainType[]) { return Array.from(new Set(values)); }
function uniqueSupportsClaims(values: NormalizedSupportsClaim[]) { return Array.from(new Set(values)); }
function sameCounts(a: CountSnapshot, b: CountSnapshot) { return TABLES.every((table) => a[table] === b[table]); }
function unique(values: Array<string | null | undefined>) { return Array.from(new Set(values.filter((v): v is string => Boolean(v)))); }
function excerpt(value: string, length: number) { return value.replace(/\s+/g, " ").trim().slice(0, length); }
function parseBool(value: string | null | undefined) { return value === "true"; }
function toNum(value: string | null | undefined) { const n = Number(value ?? 0); return Number.isFinite(n) ? n : 0; }
function normalizeDomain(value: string) { return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase(); }
function domainMatches(domain: string, target: string) { return domain === target || domain.endsWith("." + target); }
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



