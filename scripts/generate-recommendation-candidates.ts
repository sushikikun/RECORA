import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = process.env.RECORA_DEFAULT_PROJECT_SLUG ?? "recora-kenzai-q2";
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), "output", "recommendation-candidates");
const SEED_MEASUREMENT_RUN_ID = "70000000-0000-4000-8000-000000000001";
const CUSTOM_OPENAI_MEASUREMENT_PROFILE_ID = "custom-openai-run";
const MAX_CANDIDATES = 3;
const TABLES = [
  "measurement_runs",
  "run_items",
  "ai_conversations",
  "brand_mentions",
  "citations",
  "source_domains",
  "recommendations"
] as const;
const RECORA_METRIC_NOTICE =
  "Recora独自の観測であり、AIプラットフォーム公式評価ではありません。20観測の結果を強い結論として扱わず、確認材料としてご利用ください。";
const SOURCE_CLASSIFICATION_NOTE =
  "URL分類はRecora内の簡易分類です。source_domain_types は確定分類ではないため、実URLの内容確認が必要です。";
const SUPPORTS_CLAIM_NOTE =
  "supports_claim がnullまたは未設定の引用はunknownに正規化し、URLの存在だけを主張支持の根拠として扱いません。";
const BRAND_VISIBILITY_CITATION_NOTE = "この候補では引用URLを主証拠にしていません。";
const CASE_STUDY_EVIDENCE_STRENGTH_NOTE =
  "事例・実績確認promptの回答内に確認不足を示す表現があるかだけを根拠にした低確度候補です。ページ不足や改善効果は断定しません。";
const CASE_STUDY_CLUE_PHRASES = [
  "見つかりませんでした",
  "確認できませんでした",
  "情報が限られています",
  "公式情報が見当たりません",
  "明確な情報はありません",
  "不明です"
] as const;
const QUALITY_SCORE_LABEL = "根拠スコア";
const QUALITY_SCORE_MAX = 100;
const DISPLAY_DECISION_SHOW = "show";
const FORBIDDEN_CUSTOMER_PHRASES = [
  "AIに評価されていない",
  "競合に負けています",
  "公式に低評価",
  "必ず改善します",
  "この施策で引用されます",
  "AIプラットフォーム公式評価"
] as const;

type Row = Record<string, string | null>;
type Priority = "P1" | "P2";
type Confidence = "high" | "medium" | "low";
type SaveDecision = "review_required";
type DisplayDecision = "show";
type DisplayCategory = "改善候補" | "引用確認事項" | "サンプル不足" | "確認事項";
type QualityScoreBreakdownItem = {
  key: string;
  label: string;
  points: number;
  max_points: number;
  note: string;
};
type CandidateType =
  | "brand_visibility_gap"
  | "citation_evidence_review"
  | "comparison_content_gap"
  | "case_study_evidence_gap"
  | "implementation_information_gap"
  | "source_seeking_gap";
type SourceDomainType = "owned" | "competitor" | "media" | "review" | "technical" | "ec" | "manufacturer" | "foreign_brand" | "unknown";
type NormalizedSupportsClaim = "true" | "false" | "unknown";
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
type CountSnapshot = Record<string, number>;
type PgMessage = { type: string; payload: Buffer };

type Options = {
  projectSlug: string;
  measurementRunId: string | null;
  aggregateRunId: string | null;
  latestProfile: string | null;
  outputDir: string;
};

type ProjectRow = { id: string; slug: string; name: string };
type BrandRow = {
  id: string;
  name: string;
  brand_type: "primary" | "competitor";
  domain: string | null;
};
type MeasurementRunRow = {
  id: string;
  project_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  metadata: string | null;
  created_at: string;
};
type RunItemRow = {
  id: string;
  prompt_id: string;
  persona_id: string;
  status: string;
  error_message: string | null;
  prompt_text: string | null;
  prompt_intent: string | null;
  buyer_stage: string | null;
  topic_id: string | null;
  topic_name: string | null;
  persona_name: string | null;
};
type ConversationRow = {
  id: string;
  run_item_id: string;
  raw_answer: string;
  prompt_text_snapshot: string;
  provider: string | null;
  response_id: string | null;
  web_search_enabled: string | null;
  citation_status: string | null;
  measured_at: string | null;
  model_returned: string | null;
};
type MentionRow = {
  conversation_id: string;
  brand_id: string;
  brand_name: string;
  brand_type: "primary" | "competitor";
  mentioned: string;
  mention_count: string | null;
  recommendation_status: string | null;
  evidence_snippet: string | null;
};
type CitationRow = {
  id: string;
  conversation_id: string;
  url: string | null;
  domain: string;
  title: string | null;
  source_type: string | null;
  source_domain_type: string | null;
  supports_claim: string | null;
  brand_related: string | null;
  cited_text: string | null;
};
type CitationEvidence = {
  id: string;
  conversation_id: string;
  url: string | null;
  domain: string;
  title: string | null;
  source_domain_type: SourceDomainType;
  brand_related: string;
  supports_claim: NormalizedSupportsClaim;
  cited_text: string | null;
};
type BrandMentionEvidence = {
  conversation_id: string;
  brand: string;
  brand_type: "primary" | "competitor";
  mentioned: boolean;
  mention_count: number;
  recommendation_status: string | null;
  evidence_snippet: string | null;
};
type PromptObservation = {
  conversation_id: string;
  run_item_id: string;
  prompt_id: string;
  prompt_text: string;
  topic: string;
  persona: string;
  search_mode: "no-search" | "web-search";
  response_excerpt: string;
  target_brand_mentioned: boolean;
  target_brand_mention_count: number;
  citation_status: string;
  measured_at: string | null;
};
type ObservationEvidenceRow = {
  conversation_id: string;
  run_item_id: string;
  prompt_id: string;
  prompt_text: string;
  topic: string;
  persona: string;
  search_mode: "no-search" | "web-search";
  target_brand_present: boolean;
  target_brand_mention_count: number;
  response_excerpt: string;
  measured_at: string | null;
};
type CitationEvidenceRow = {
  conversation_id: string;
  run_item_id: string;
  prompt_id: string;
  prompt_text: string;
  url: string | null;
  domain: string;
  title: string | null;
  supports_claim: NormalizedSupportsClaim;
  brand_related: string;
  cited_text: string | null;
  measured_at: string | null;
};
type MatchedClue = {
  conversation_id: string;
  run_item_id: string;
  matched_text: string;
  response_excerpt: string;
  search_mode: "no-search" | "web-search";
};
type EvidenceBuildOptions = {
  primaryEvidenceScope: string;
  citationsUsedAsPrimaryEvidence: boolean;
  citationNote?: string;
  citationRows?: CitationEvidenceRow[];
  matchedClues?: MatchedClue[];
  evidenceStrengthNote?: string;
  searchModes?: string[];
  sourceClassificationNote?: string;
};
type CandidateEvidence = {
  measurement_run_id: string;
  aggregate_run_id: string | null;
  measurement_profile_id: string;
  measurement_profile_label: string;
  selected_prompt_ids: string[];
  observation_count: number;
  prompt_count: number;
  search_modes: string[];
  conversation_ids: string[];
  run_item_ids: string[];
  prompt_texts: string[];
  topics: string[];
  personas: string[];
  response_excerpts: string[];
  target_brand_present: boolean;
  competitor_presence: Array<{ brand: string; mentioned: boolean; mention_count: number }>;
  brand_mentions: BrandMentionEvidence[];
  citation_urls: string[];
  citation_domains: string[];
  citation_statuses: string[];
  supports_claim_values: NormalizedSupportsClaim[];
  brand_related_values: string[];
  measured_at_values: string[];
  data_source: "openai_measurement";
  evidence_label: "CONFIRMED_FACT";
  sample_size_note: string;
  recora_metric_notice: string;
  focused_observation_count: number;
  all_conversation_ids: string[];
  citation_details: CitationEvidence[];
  source_domain_types: SourceDomainType[];
  source_classification_note: string;
  supports_claim_note: string;
  primary_evidence_scope: string;
  citations_used_as_primary_evidence: boolean;
  citation_note: string | null;
  observation_rows: ObservationEvidenceRow[];
  citation_rows: CitationEvidenceRow[];
  citation_count: number;
  unique_url_count: number;
  unique_domain_count: number;
  supports_claim_unknown_count: number;
  matched_clues: MatchedClue[];
  matched_clue_count: number;
  case_study_observation_count: number;
  evidence_strength_note: string | null;
  db_write_status: "not_written";
};
type Candidate = {
  id: string;
  title: string;
  priority: Priority;
  type: CandidateType;
  summary: string;
  rationale: string;
  evidence: CandidateEvidence;
  expected_impact: string;
  effort: string;
  related_observation_ids: string[];
  related_urls: string[];
  related_brands: string[];
  related_topics: string[];
  confidence: Confidence;
  confidence_label: string;
  quality_score: number;
  quality_score_label: typeof QUALITY_SCORE_LABEL;
  quality_score_max: typeof QUALITY_SCORE_MAX;
  quality_score_breakdown: QualityScoreBreakdownItem[];
  display_category: DisplayCategory;
  display_decision: DisplayDecision;
  customer_facing_caution: string;
  score_explanation: string;
  recora_metric_notice: string;
  should_save_to_recommendations: SaveDecision;
  save_reason: string;
  caution: string;
  suggested_next_action: string;
};
type Context = {
  options: Options;
  project: ProjectRow;
  measurementRun: MeasurementRunRow;
  aggregateRun: MeasurementRunRow | null;
  measurementMetadata: Record<string, JsonValue | undefined>;
  brands: BrandRow[];
  primaryBrand: BrandRow;
  competitorBrands: BrandRow[];
  runItems: RunItemRow[];
  conversations: ConversationRow[];
  openaiConversations: ConversationRow[];
  mentions: MentionRow[];
  citations: CitationRow[];
  filteredCitations: CitationRow[];
  excludedExampleCitationCount: number;
  observations: PromptObservation[];
  selectedPromptIds: string[];
  measurementProfileId: string;
  measurementProfileLabel: string;
};
type CandidatesPayload = {
  generated_at: string;
  project_slug: string;
  project_name: string;
  measurement_run_id: string;
  aggregate_run_id: string | null;
  measurement_profile_id: string;
  source_run_status: string;
  observation_count: number;
  prompt_count: number;
  candidate_count: number;
  candidates: Candidate[];
  db_write_status: "not_written";
  recora_metric_notice: string;
  db_write_check: {
    before: CountSnapshot;
    after: CountSnapshot;
    unchanged: boolean;
    recommendations_before: number;
    recommendations_after: number;
  };
  data_scope: {
    run_items: number;
    openai_conversations: number;
    brand_mentions: number;
    citations: number;
    excluded_example_citations: number;
    failed_run_items: number;
  };
  output: {
    json: string;
    markdown: string;
    run_json: string;
    run_markdown: string;
  };
};

async function main() {
  await loadEnvLocal();
  const options = parseArgs(process.argv.slice(2));
  validateOptions(options);

  debug("connecting to database");
  const db = new LocalPostgresClient(process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL);
  await db.connect();
  try {
    debug("loading before counts");
    const before = await getCounts(db);
    debug("loading run context");
    const context = await loadContext(db, options);
    debug("building candidates");
    const candidates = buildCandidates(context).slice(0, MAX_CANDIDATES);
    debug("loading after counts");
    const after = await getCounts(db);
    debug("writing outputs");
    const payload = await writeOutputs(context, candidates, before, after);

    console.log(JSON.stringify({
      projectSlug: payload.project_slug,
      measurementRunId: payload.measurement_run_id,
      aggregateRunId: payload.aggregate_run_id,
      measurementProfileId: payload.measurement_profile_id,
      observationCount: payload.observation_count,
      promptCount: payload.prompt_count,
      candidateCount: payload.candidate_count,
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        type: candidate.type,
        priority: candidate.priority,
        qualityScore: candidate.quality_score,
        displayCategory: candidate.display_category,
        displayDecision: candidate.display_decision,
        confidence: candidate.confidence,
        confidenceLabel: candidate.confidence_label
      })),
      output: payload.output,
      dbWriteStatus: payload.db_write_status,
      dbCountsUnchanged: payload.db_write_check.unchanged,
      recommendationsBefore: payload.db_write_check.recommendations_before,
      recommendationsAfter: payload.db_write_check.recommendations_after
    }, null, 2));
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    projectSlug: DEFAULT_PROJECT_SLUG,
    measurementRunId: null,
    aggregateRunId: null,
    latestProfile: null,
    outputDir: DEFAULT_OUTPUT_DIR
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--project-slug") {
      options.projectSlug = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--project-slug=")) {
      options.projectSlug = arg.slice("--project-slug=".length);
      continue;
    }
    if (arg === "--measurement-run-id") {
      options.measurementRunId = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--measurement-run-id=")) {
      options.measurementRunId = arg.slice("--measurement-run-id=".length);
      continue;
    }
    if (arg === "--aggregate-run-id") {
      options.aggregateRunId = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--aggregate-run-id=")) {
      options.aggregateRunId = arg.slice("--aggregate-run-id=".length);
      continue;
    }
    if (arg === "--latest-profile") {
      options.latestProfile = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--latest-profile=")) {
      options.latestProfile = arg.slice("--latest-profile=".length);
      continue;
    }
    if (arg === "--output-dir") {
      options.outputDir = path.resolve(readNext(args, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--output-dir=")) {
      options.outputDir = path.resolve(arg.slice("--output-dir=".length));
    }
  }

  return options;
}

function readNext(args: string[], index: number, arg: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
  return value;
}

function debug(message: string) {
  if (process.env.RECORA_RECOMMENDATION_DEBUG === "1") {
    console.error(`[generate-recommendation-candidates] ${message}`);
  }
}

function validateOptions(options: Options) {
  if (!options.measurementRunId && !options.latestProfile) {
    throw new Error("--measurement-run-id or --latest-profile is required. Refusing to aggregate every run.");
  }
  if (options.measurementRunId && options.latestProfile) {
    throw new Error("--measurement-run-id and --latest-profile cannot be used together.");
  }
  if (options.latestProfile && options.latestProfile !== "standard-v01") {
    throw new Error("--latest-profile currently supports standard-v01 only.");
  }
}

async function loadContext(db: LocalPostgresClient, options: Options): Promise<Context> {
  debug("loading project");
  const project = await getProject(db, options.projectSlug);
  debug("loading measurement run");
  const measurementRun = options.measurementRunId
    ? await getMeasurementRunById(db, project.id, options.measurementRunId)
    : await getLatestMeasurementRunByProfile(db, project.id, options.latestProfile ?? "standard-v01");
  const measurementMetadata = parseMetadata(measurementRun.metadata);

  assertMeasurementRun(measurementRun, measurementMetadata, options);

  const aggregateRun = options.aggregateRunId
    ? await getAggregateRunById(db, project.id, options.aggregateRunId, measurementRun.id)
    : await getLatestAggregateRunForMeasurement(db, project.id, measurementRun.id);

  debug("loading brands and run items");
  const brands = await getBrands(db, project.id);
  const runItems = await getRunItems(db, measurementRun.id);

  const primaryBrand = brands.find((brand) => brand.brand_type === "primary");
  if (!primaryBrand) throw new Error("Primary brand was not found.");
  const competitorBrands = brands.filter((brand) => brand.brand_type === "competitor");

  debug("loading conversations");
  const conversations = await getConversations(db, measurementRun.id);
  const openaiConversations = conversations.filter(isOpenAiObservation);
  const conversationIds = openaiConversations.map((conversation) => conversation.id);
  debug(`loading mentions and citations for ${conversationIds.length} conversations`);
  const mentions = await getMentions(db, conversationIds);
  const citations = await getCitations(db, conversationIds);
  const filteredCitations = citations.filter(isDisplayableCitation);
  const excludedExampleCitationCount = citations.length - filteredCitations.length;
  const selectedPromptIds = readMetadataStringArray(measurementMetadata, "selected_prompt_ids", unique(runItems.map((item) => item.prompt_id)));
  const measurementProfileId = resolveMeasurementProfileId(measurementMetadata);
  const measurementProfileLabel = getMeasurementProfileLabel(measurementProfileId, readMetadataString(measurementMetadata, "measurement_profile_label"));
  const observations = buildObservations(openaiConversations, runItems, mentions, primaryBrand);

  if (openaiConversations.length === 0) {
    throw new Error("No OpenAI measurement conversations were found for the selected measurement run.");
  }

  return {
    options,
    project,
    measurementRun,
    aggregateRun,
    measurementMetadata,
    brands,
    primaryBrand,
    competitorBrands,
    runItems,
    conversations,
    openaiConversations,
    mentions,
    citations,
    filteredCitations,
    excludedExampleCitationCount,
    observations,
    selectedPromptIds,
    measurementProfileId,
    measurementProfileLabel
  };
}

function assertMeasurementRun(run: MeasurementRunRow, metadata: Record<string, JsonValue | undefined>, options: Options) {
  if (run.id === SEED_MEASUREMENT_RUN_ID) {
    throw new Error("Seed measurement run cannot be used for recommendation candidates.");
  }
  if (run.status !== "completed") {
    throw new Error(`Selected measurement run is not completed: ${run.status}`);
  }
  if (readMetadataString(metadata, "run_kind") === "aggregate") {
    throw new Error("Selected run is an aggregate run. Use a measurement run as the source.");
  }
  if (readMetadataString(metadata, "data_source") !== "openai_measurement") {
    throw new Error("Selected measurement run is not openai_measurement.");
  }
  const profileId = readMetadataString(metadata, "measurement_profile_id");
  if (profileId && profileId !== "standard-v01") {
    throw new Error(`Selected measurement run must be standard-v01 or an explicit unprofiled OpenAI run. Actual profile: ${profileId}`);
  }
  if (!profileId) {
    if (!options.measurementRunId) {
      throw new Error("Unprofiled OpenAI measurement runs must be selected by explicit --measurement-run-id.");
    }
    const selectedPromptIds = readMetadataStringArray(metadata, "selected_prompt_ids", []);
    const promptCount = readMetadataNumber(metadata, "prompt_count");
    const expectedRunItems = readMetadataNumber(metadata, "expected_run_items");
    if (selectedPromptIds.length === 0 && (!promptCount || promptCount < 1)) {
      throw new Error("Unprofiled OpenAI measurement run is missing selected_prompt_ids or prompt_count metadata.");
    }
    if (expectedRunItems !== null && expectedRunItems < 1) {
      throw new Error("Unprofiled OpenAI measurement run has invalid expected_run_items metadata.");
    }
  }
}

function buildCandidates(context: Context): Candidate[] {
  const candidates: Candidate[] = [];
  const absentObservations = context.observations.filter((observation) => !observation.target_brand_mentioned);
  const webSearchConversationIds = new Set(
    context.observations
      .filter((observation) => observation.search_mode === "web-search")
      .map((observation) => observation.conversation_id)
  );
  const webSearchCitationDetails = buildCitationDetails(
    context.filteredCitations.filter((citation) => webSearchConversationIds.has(citation.conversation_id)),
    context.primaryBrand,
    context.competitorBrands
  );
  const unknownCitationDetails = webSearchCitationDetails.filter((citation) => citation.supports_claim === "unknown");

  if (absentObservations.length > 0) {
    candidates.push(buildBrandVisibilityGapCandidate(context, absentObservations));
  }

  if (webSearchCitationDetails.length > 0 && unknownCitationDetails.length > 0) {
    candidates.push(buildCitationEvidenceReviewCandidate(context, webSearchCitationDetails, unknownCitationDetails));
  }

  const specificGap = buildSpecificGapCandidate(context);
  if (specificGap) candidates.push(specificGap);

  return candidates.slice(0, MAX_CANDIDATES);
}

function buildBrandVisibilityGapCandidate(context: Context, absentObservations: PromptObservation[]): Candidate {
  const evidence = buildEvidence(context, absentObservations, context.mentions.filter((mention) => {
    return absentObservations.some((observation) => observation.conversation_id === mention.conversation_id);
  }), [], {
    primaryEvidenceScope: "target_brand_absent_observations",
    citationsUsedAsPrimaryEvidence: false,
    citationNote: BRAND_VISIBILITY_CITATION_NOTE,
    searchModes: unique(absentObservations.map((observation) => observation.search_mode))
  });

  return candidate({
    context,
    type: "brand_visibility_gap",
    title: "一部の質問で自社ブランドが表示されない傾向があります",
    priority: "P1",
    confidence: absentObservations.length >= 2 ? "medium" : "low",
    summary: `今回の観測範囲では、一部の質問で表示されない傾向がありました。${context.openaiConversations.length}件中${absentObservations.length}件で${context.primaryBrand.name}の明示的な言及を確認できませんでした。`,
    rationale: "AI表示率は50%であり、全体として非表示とは断定しません。一方で、一部の重要プロンプトでは表示されない傾向があるため、質問別に根拠ページや説明内容を確認する余地があります。",
    evidence,
    expectedImpact: "一部プロンプトでのブランド発見率改善につながる可能性",
    effort: "中",
    brands: [context.primaryBrand.name],
    topics: evidence.topics,
    saveReason: "画面表示対象です。20観測のみのため、表示不足の傾向として扱います。",
    nextAction: "未表示になったprompt、search mode、回答本文を確認し、対応する比較・選定基準・FAQ・事例ページの不足を棚卸ししてください。"
  });
}

function buildCitationEvidenceReviewCandidate(
  context: Context,
  citationDetails: CitationEvidence[],
  unknownCitationDetails: CitationEvidence[]
): Candidate {
  const evidenceConversations = context.observations.filter((observation) => {
    return citationDetails.some((citation) => citation.conversation_id === observation.conversation_id);
  });
  const evidenceConversationIds = new Set(evidenceConversations.map((observation) => observation.conversation_id));
  const evidence = buildEvidence(
    context,
    evidenceConversations,
    context.mentions.filter((mention) => evidenceConversationIds.has(mention.conversation_id)),
    citationDetails,
    {
      primaryEvidenceScope: "web_search_citations",
      citationsUsedAsPrimaryEvidence: true,
      citationRows: buildCitationRows(context, citationDetails),
      searchModes: ["web-search"],
      sourceClassificationNote: SOURCE_CLASSIFICATION_NOTE
    }
  );
  const priority: Priority = unknownCitationDetails.length >= 5 ? "P1" : "P2";
  const confidence: Confidence = citationDetails.length >= 5 ? "medium" : "low";

  return candidate({
    context,
    type: "citation_evidence_review",
    title: "引用URLの主張支持を確認する必要があります",
    priority,
    confidence,
    summary: `web-search由来の引用URLは${citationDetails.length}件確認されていますが、supports_claim が未検証の引用が${unknownCitationDetails.length}件あります。`,
    rationale: "引用URLがあること自体は確認できますが、回答内容を支持しているかは別途確認が必要です。URLの存在だけを改善根拠として扱わないため、引用元・ドメイン・brand_related・supports_claimをレビュー対象にします。",
    evidence,
    expectedImpact: "引用元の信頼性確認と根拠ページ整備の優先順位づけに役立つ可能性",
    effort: "中",
    brands: [context.primaryBrand.name, ...context.competitorBrands.map((brand) => brand.name)],
    topics: evidence.topics,
    saveReason: "supports_claim未検証のため、引用確認事項として表示します。",
    nextAction: "引用URLを開いて、回答内の主張を実際に支えているか、公式・業界メディア・競合・一般情報のどれに偏っているかを確認してください。"
  });
}

function buildSpecificGapCandidate(context: Context): Candidate | null {
  const evidenceCandidates = [
    findSpecificGap(context, "case_study_evidence_gap", ["導入事例", "採用実績", "実績", "事例"], [...CASE_STUDY_CLUE_PHRASES])
  ];
  const match = evidenceCandidates.find((item): item is { type: CandidateType; observations: PromptObservation[]; matchedClues: MatchedClue[] } => Boolean(item));
  if (!match) return null;

  const evidence = buildEvidence(context, match.observations, context.mentions.filter((mention) => {
    return match.observations.some((observation) => observation.conversation_id === mention.conversation_id);
  }), [], {
    primaryEvidenceScope: "case_study_prompt_responses",
    citationsUsedAsPrimaryEvidence: false,
    matchedClues: match.matchedClues,
    evidenceStrengthNote: CASE_STUDY_EVIDENCE_STRENGTH_NOTE,
    searchModes: unique(match.observations.map((observation) => observation.search_mode))
  });

  const labels: Record<CandidateType, { title: string; summary: string; nextAction: string }> = {
    brand_visibility_gap: {
      title: "",
      summary: "",
      nextAction: ""
    },
    citation_evidence_review: {
      title: "",
      summary: "",
      nextAction: ""
    },
    comparison_content_gap: {
      title: "比較・選定基準コンテンツを確認する余地があります",
      summary: "比較系の回答で、自社の具体的根拠や選定基準が弱い可能性があります。",
      nextAction: "競合比較、選定基準、向いている案件・不向きな条件を整理したページやFAQを確認してください。"
    },
    case_study_evidence_gap: {
      title: "事例・実績情報の提示状況を確認する余地があります",
      summary: "今回の観測では、実績情報の確認に追加調査が必要な回答がありました。",
      nextAction: "導入事例、採用実績、ホテル・商業施設での利用例を確認し、引用しやすい形で整理されているか見直してください。"
    },
    implementation_information_gap: {
      title: "施工条件・導入前確認情報を確認する余地があります",
      summary: "施工条件や互換性に関する回答で、公式根拠や確認情報が弱い可能性があります。",
      nextAction: "施工条件、下地、接着剤、既存改修での注意点をまとめた技術情報の有無を確認してください。"
    },
    source_seeking_gap: {
      title: "根拠確認向け情報源を確認する余地があります",
      summary: "情報源確認系の回答で、参照しやすい根拠ページや信頼できる情報源が十分に出ていない可能性があります。",
      nextAction: "公式情報、FAQ、事例、施工条件資料がAI回答から参照しやすい形になっているか確認してください。"
    }
  };
  const label = labels[match.type];

  return candidate({
    context,
    type: match.type,
    title: label.title,
    priority: "P2",
    confidence: "low",
    summary: label.summary,
    rationale: "事例・実績確認promptの回答excerptに、情報確認が必要であることを示す表現が含まれていました。事例ページ不足とは断定せず、実回答とサイト上の根拠を照合する確認材料として扱います。",
    evidence,
    expectedImpact: "比較・事例・施工条件の説明改善により、今後の観測で根拠付き表示を増やせる可能性",
    effort: "中",
    brands: [context.primaryBrand.name],
    topics: evidence.topics,
    saveReason: "回答excerptの兆候に基づく低確度候補のため、サンプル不足として表示します。",
    nextAction: label.nextAction
  });
}

function findSpecificGap(context: Context, type: CandidateType, promptHints: string[], answerHints: string[]) {
  const observations = context.observations.filter((observation) => {
    const prompt = [observation.prompt_text, observation.topic].join(" ");
    const promptMatched = promptHints.some((hint) => prompt.includes(hint));
    const answerMatched = answerHints.some((hint) => observation.response_excerpt.includes(hint));
    return promptMatched && answerMatched;
  });
  const matchedClues = observations.flatMap((observation) => {
    return answerHints
      .filter((hint) => observation.response_excerpt.includes(hint))
      .map((hint) => ({
        conversation_id: observation.conversation_id,
        run_item_id: observation.run_item_id,
        matched_text: hint,
        response_excerpt: observation.response_excerpt,
        search_mode: observation.search_mode
      }));
  });
  return observations.length > 0 ? { type, observations, matchedClues } : null;
}

function candidate(input: {
  context: Context;
  type: CandidateType;
  title: string;
  priority: Priority;
  confidence: Confidence;
  summary: string;
  rationale: string;
  evidence: CandidateEvidence;
  expectedImpact: string;
  effort: string;
  brands: string[];
  topics: string[];
  saveReason: string;
  nextAction: string;
}): Candidate {
  const scoring = buildQualityScore({
    context: input.context,
    type: input.type,
    confidence: input.confidence,
    title: input.title,
    summary: input.summary,
    rationale: input.rationale,
    expectedImpact: input.expectedImpact,
    nextAction: input.nextAction,
    evidence: input.evidence
  });

  return {
    id: buildCandidateId(input.context.measurementRun.id, input.type),
    title: input.title,
    priority: input.priority,
    type: input.type,
    summary: input.summary,
    rationale: input.rationale,
    evidence: input.evidence,
    expected_impact: input.expectedImpact,
    effort: input.effort,
    related_observation_ids: input.evidence.conversation_ids,
    related_urls: input.evidence.citation_urls,
    related_brands: unique(input.brands),
    related_topics: unique(input.topics),
    confidence: input.confidence,
    confidence_label: scoring.confidenceLabel,
    quality_score: scoring.score,
    quality_score_label: QUALITY_SCORE_LABEL,
    quality_score_max: QUALITY_SCORE_MAX,
    quality_score_breakdown: scoring.breakdown,
    display_category: scoring.displayCategory,
    display_decision: DISPLAY_DECISION_SHOW,
    customer_facing_caution: scoring.customerFacingCaution,
    score_explanation: scoring.explanation,
    recora_metric_notice: RECORA_METRIC_NOTICE,
    should_save_to_recommendations: "review_required",
    save_reason: input.saveReason,
    caution: RECORA_METRIC_NOTICE,
    suggested_next_action: input.nextAction
  };
}

function buildQualityScore(input: {
  context: Context;
  type: CandidateType;
  confidence: Confidence;
  title: string;
  summary: string;
  rationale: string;
  expectedImpact: string;
  nextAction: string;
  evidence: CandidateEvidence;
}) {
  const breakdown: QualityScoreBreakdownItem[] = [];
  const failedRunItems = input.context.runItems.filter((item) => item.status === "failed").length;
  const latestStandardV01 = input.context.measurementProfileId === "standard-v01"
    && input.evidence.prompt_count === 10
    && input.evidence.observation_count === 20;
  const openaiAggregate = input.evidence.data_source === "openai_measurement" && Boolean(input.evidence.aggregate_run_id);
  const cleanSourceScope = input.context.measurementRun.id !== SEED_MEASUREMENT_RUN_ID && input.context.excludedExampleCitationCount === 0;
  const displayCategory = getDisplayCategory(input.type);
  const customerFacingCaution = buildCustomerFacingCaution(input.type);
  const unsafeCustomerText = hasUnsafeCustomerText([
    input.title,
    input.summary,
    input.rationale,
    input.expectedImpact,
    input.nextAction,
    customerFacingCaution
  ]);

  addBreakdown(breakdown, "profile_reproducibility", "standard-v01の再現性", latestStandardV01 ? 8 : 0, 8, latestStandardV01
    ? "standard-v01 / 10 prompts / 20 observations"
    : "standard-v01の期待条件ではありません");
  addBreakdown(breakdown, "openai_measurement_scope", "OpenAI実測aggregate", openaiAggregate ? 6 : 0, 6, openaiAggregate
    ? "openai_measurementかつaggregateRunIdあり"
    : "openai_measurementまたはaggregateRunIdを確認できません");
  addBreakdown(breakdown, "failed_run_items", "failed run itemなし", failedRunItems === 0 ? 6 : 0, 6, failedRunItems === 0
    ? "failed run itemなし"
    : `${failedRunItems} failed run items`);
  addBreakdown(breakdown, "clean_source_scope", "seed/sample/.example混入なし", cleanSourceScope ? 5 : 0, 5, cleanSourceScope
    ? "seed/sample/.example混入なし"
    : "seed/sample/.example混入の可能性あり");
  addBreakdown(breakdown, "safe_customer_language", "顧客向け文言の安全性", unsafeCustomerText ? 0 : 5, 5, unsafeCustomerText
    ? "禁止表現を含む可能性あり"
    : "断定を避け、Recora独自観測の注意書きあり");

  if (input.type === "brand_visibility_gap") {
    addBrandVisibilityScore(input.evidence, breakdown);
  } else if (input.type === "citation_evidence_review") {
    addCitationEvidenceScore(input.evidence, breakdown);
  } else if (input.type === "case_study_evidence_gap") {
    addCaseStudyScore(input.evidence, breakdown);
  }

  const rawScore = sumBreakdown(breakdown);
  const caps: Array<{ value: number; note: string }> = [];
  let adjustedScore = rawScore;
  if (!latestStandardV01) {
    adjustedScore -= 30;
    caps.push({ value: 40, note: "latest standard-v01以外のため最大40" });
  }
  if (!cleanSourceScope) {
    adjustedScore -= 20;
    caps.push({ value: 60, note: "seed/sample/.example混入の可能性があるため最大60" });
  }
  if (failedRunItems > 0) {
    adjustedScore -= Math.min(10, failedRunItems * 2);
  }
  if (unsafeCustomerText) {
    caps.push({ value: 70, note: "禁止表現を含む可能性があるため最大70" });
  }
  if ((input.type === "brand_visibility_gap" || input.type === "case_study_evidence_gap") && input.evidence.citations_used_as_primary_evidence) {
    caps.push({ value: 60, note: "brand/case候補でcitationsを主証拠にしているため最大60" });
  }
  if (treatsUnknownSupportsClaimAsVerified(input)) {
    caps.push({ value: 50, note: "supports_claim unknownを支持確認済みとして扱っている可能性があるため最大50" });
  }
  const typeCap = getTypeCap(input.type, input.evidence);
  if (typeCap) caps.push(typeCap);
  const cap = caps.length > 0 ? Math.min(...caps.map((item) => item.value)) : QUALITY_SCORE_MAX;
  const score = clampScore(Math.min(adjustedScore, cap));

  return {
    score,
    breakdown: caps.length > 0
      ? [...breakdown, ...caps.map((item) => ({
          key: "score_cap",
          label: "上限制御",
          points: 0,
          max_points: item.value,
          note: item.note
        } satisfies QualityScoreBreakdownItem))]
      : breakdown,
    confidenceLabel: getConfidenceLabel(input.confidence),
    displayCategory,
    customerFacingCaution,
    explanation: buildScoreExplanation(score, input.type, displayCategory)
  };
}

function addBrandVisibilityScore(evidence: CandidateEvidence, breakdown: QualityScoreBreakdownItem[]) {
  const absentRows = evidence.observation_rows.length;
  const absentRate = evidence.observation_count > 0 ? absentRows / evidence.observation_count : 0;
  const uniquePromptCount = evidence.prompt_texts.length;
  const hasBothSearchModes = evidence.search_modes.includes("no-search") && evidence.search_modes.includes("web-search");
  const hasResponseExcerpt = evidence.observation_rows.some((row) => Boolean(row.response_excerpt));

  addBreakdown(breakdown, "absent_observation_rows", "対象ブランド未表示の観測行数", scoreByRanges(absentRows, [
    [1, 1, 3],
    [2, 4, 8],
    [5, 9, 14],
    [10, Infinity, 20]
  ]), 20, `${absentRows} absent observation rows`);
  addBreakdown(breakdown, "absent_rate", "未表示率", scoreByRate(absentRate, [
    [0, 0.199999, 8],
    [0.2, 0.499999, 16],
    [0.5, 0.8, 20],
    [0.800001, Infinity, 10]
  ]), 20, `${Math.round(absentRate * 100)}%`);
  addBreakdown(breakdown, "unique_prompt_count", "対象promptの広がり", scoreByRanges(uniquePromptCount, [
    [2, 2, 3],
    [3, 4, 6],
    [5, Infinity, 10]
  ]), 10, `${uniquePromptCount} unique prompts`);
  addBreakdown(breakdown, "search_mode_reproducibility", "search modeでの再現", hasBothSearchModes ? 10 : 4, 10, hasBothSearchModes
    ? "no-search / web-searchの両方で発生"
    : "片方のsearch modeで発生");
  addBreakdown(breakdown, "response_excerpt", "response excerptあり", hasResponseExcerpt ? 5 : 0, 5, hasResponseExcerpt
    ? "回答excerptあり"
    : "回答excerptなし");
  addBreakdown(breakdown, "citation_not_primary", "citationを主証拠にしていない", evidence.citations_used_as_primary_evidence ? 0 : 5, 5, evidence.citations_used_as_primary_evidence
    ? "引用URLを主証拠にしています"
    : "引用URLを主証拠にしていません");
}

function addCitationEvidenceScore(evidence: CandidateEvidence, breakdown: QualityScoreBreakdownItem[]) {
  const webSearchOnly = evidence.primary_evidence_scope === "web_search_citations"
    && evidence.search_modes.length === 1
    && evidence.search_modes[0] === "web-search";
  const citationRows = evidence.citation_rows.length;
  const webSearchObservationCount = evidence.observation_rows.filter((row) => row.search_mode === "web-search").length;
  const supportsClaimVerifiedCount = evidence.citation_rows.filter((row) => row.supports_claim !== "unknown").length;
  const supportsClaimVerifiedRate = citationRows > 0 ? supportsClaimVerifiedCount / citationRows : 0;
  const brandSpecificCount = evidence.citation_rows.filter((row) => row.brand_related !== "general" && row.brand_related !== "unknown").length;
  const brandSpecificRate = citationRows > 0 ? brandSpecificCount / citationRows : 0;

  addBreakdown(breakdown, "web_search_citation_scope", "web-search citation限定", webSearchOnly ? 12 : 0, 12, webSearchOnly
    ? "web-search citationsのみ対象"
    : "web-search citations以外を含む可能性あり");
  addBreakdown(breakdown, "citation_rows", "citation rows", scoreByRanges(citationRows, [
    [1, 9, 6],
    [10, 19, 12],
    [20, Infinity, 16]
  ]), 16, `${citationRows} citation rows`);
  addBreakdown(breakdown, "unique_domain_count", "unique domain数", scoreByRanges(evidence.unique_domain_count, [
    [1, 4, 3],
    [5, 9, 6],
    [10, Infinity, 10]
  ]), 10, `${evidence.unique_domain_count} unique domains`);
  addBreakdown(breakdown, "web_search_observations", "web-search observation数", scoreByRanges(webSearchObservationCount, [
    [1, 1, 1],
    [2, 3, 3],
    [4, Infinity, 5]
  ]), 5, `${webSearchObservationCount} web-search observations`);
  addBreakdown(breakdown, "supports_claim_verified_rate", "supports_claim確認率", scoreByRate(supportsClaimVerifiedRate, [
    [0, 0, 0],
    [0.000001, 0.299999, 3],
    [0.3, 0.799999, 6],
    [0.8, Infinity, 12]
  ]), 12, `${Math.round(supportsClaimVerifiedRate * 100)}% verified`);
  addBreakdown(breakdown, "brand_related_clarity", "brand_relatedの明確さ", brandSpecificRate >= 0.5 ? 5 : 3, 5, brandSpecificRate >= 0.5
    ? "brand-specificが50%以上"
    : "general/unknown中心");
}

function addCaseStudyScore(evidence: CandidateEvidence, breakdown: QualityScoreBreakdownItem[]) {
  const observationRows = evidence.observation_rows.length;
  const matchedClues = evidence.matched_clues.length;
  const uniquePromptCount = evidence.prompt_texts.length;
  const hasBothSearchModes = evidence.search_modes.includes("no-search") && evidence.search_modes.includes("web-search");
  const hasResponseExcerpt = evidence.observation_rows.some((row) => Boolean(row.response_excerpt));
  const hasLowConfidenceNote = Boolean(evidence.evidence_strength_note);

  addBreakdown(breakdown, "case_study_prompt_scope", "事例確認prompt scope", evidence.primary_evidence_scope === "case_study_prompt_responses" ? 10 : 0, 10, evidence.primary_evidence_scope);
  addBreakdown(breakdown, "case_observation_rows", "事例確認の観測行数", scoreByRanges(observationRows, [
    [1, 1, 5],
    [2, 3, 12],
    [4, Infinity, 18]
  ]), 18, `${observationRows} observation rows`);
  addBreakdown(breakdown, "matched_clues", "不足兆候のmatched clues", scoreByRanges(matchedClues, [
    [1, 1, 8],
    [2, 3, 12],
    [4, Infinity, 15]
  ]), 15, `${matchedClues} matched clues`);
  addBreakdown(breakdown, "case_unique_prompt_count", "対象prompt数", uniquePromptCount >= 2 ? 5 : 2, 5, `${uniquePromptCount} unique prompts`);
  addBreakdown(breakdown, "case_search_mode", "search mode", hasBothSearchModes ? 8 : 3, 8, hasBothSearchModes
    ? "no-search / web-searchの両方"
    : "片方のsearch mode");
  addBreakdown(breakdown, "case_response_excerpt", "response excerptあり", hasResponseExcerpt ? 4 : 0, 4, hasResponseExcerpt
    ? "回答excerptあり"
    : "回答excerptなし");
  addBreakdown(breakdown, "low_confidence_note", "断定回避・低確度note", hasLowConfidenceNote ? 5 : 0, 5, hasLowConfidenceNote
    ? "低確度noteあり"
    : "低確度noteなし");
}

function getTypeCap(type: CandidateType, evidence: CandidateEvidence) {
  if (type === "brand_visibility_gap") return { value: 85, note: "単一standard-v01 runのためbrand候補は最大85" };
  if (type === "case_study_evidence_gap") {
    const caps = [];
    if (evidence.observation_rows.length === 1) caps.push({ value: 45, note: "1 observationのためcase study候補は最大45" });
    if (evidence.prompt_texts.length === 1) caps.push({ value: 55, note: "1 promptのためcase study候補は最大55" });
    if (caps.length > 0) return caps.reduce((min, item) => item.value < min.value ? item : min, caps[0]);
  }
  return null;
}

function getDisplayCategory(type: CandidateType): DisplayCategory {
  if (type === "brand_visibility_gap") return "改善候補";
  if (type === "citation_evidence_review") return "引用確認事項";
  if (type === "case_study_evidence_gap") return "サンプル不足";
  return "確認事項";
}

function getConfidenceLabel(confidence: Confidence) {
  if (confidence === "high") return "根拠強め";
  if (confidence === "medium") return "傾向あり";
  return "要確認";
}

function buildCustomerFacingCaution(type: CandidateType) {
  const prefix = "Recora独自の観測であり、AIプラットフォーム公式評価ではありません。少数観測のため、強い結論として扱わず確認材料としてご利用ください。";
  if (type === "citation_evidence_review") {
    return `${prefix} 引用URLは取得されていますが、回答内容を支持しているかは別途確認が必要です。`;
  }
  if (type === "case_study_evidence_gap") {
    return `${prefix} 1観測・1 clueのみのため、実績情報の不足を断定せず追加確認してください。`;
  }
  return `${prefix} 今回の観測範囲では一部質問で表示されない傾向として扱います。`;
}

function buildScoreExplanation(score: number, type: CandidateType, displayCategory: DisplayCategory) {
  if (type === "brand_visibility_gap") {
    return `${displayCategory}として表示します。根拠スコア${score}/100は、対象ブランド未表示の観測数、promptの広がり、search mode再現性をもとにした根拠の整い度です。非表示判定には使いません。`;
  }
  if (type === "citation_evidence_review") {
    return `${displayCategory}として表示します。根拠スコア${score}/100は、web-search引用URL、unique domain、supports_claim確認状態をもとにした確認事項としての整い度です。改善提案としては扱いません。`;
  }
  if (type === "case_study_evidence_gap") {
    return `${displayCategory}として表示します。根拠スコア${score}/100は、事例確認promptの観測とmatched clueに基づく低確度の確認材料です。`;
  }
  return `${displayCategory}として表示します。根拠スコア${score}/100は、今回の観測データに基づく根拠の整い度です。`;
}

function hasUnsafeCustomerText(values: string[]) {
  const safeNegatedOfficialNotice = /AIプラットフォーム公式評価ではありません|AIプラットフォーム公式評価ではない/g;
  const text = values.join("\n").replace(safeNegatedOfficialNotice, "");
  return FORBIDDEN_CUSTOMER_PHRASES.some((phrase) => text.includes(phrase));
}

function treatsUnknownSupportsClaimAsVerified(input: {
  summary: string;
  rationale: string;
  expectedImpact: string;
  nextAction: string;
  evidence: CandidateEvidence;
}) {
  if (input.evidence.supports_claim_unknown_count === 0) return false;
  const text = [input.summary, input.rationale, input.expectedImpact, input.nextAction].join("\n");
  return text.includes("支持確認済み") || text.includes("主張支持を確認済み");
}

function addBreakdown(
  breakdown: QualityScoreBreakdownItem[],
  key: string,
  label: string,
  points: number,
  maxPoints: number,
  note: string
) {
  breakdown.push({ key, label, points, max_points: maxPoints, note });
}

function sumBreakdown(breakdown: QualityScoreBreakdownItem[]) {
  return breakdown.reduce((sum, item) => sum + item.points, 0);
}

function scoreByRanges(value: number, ranges: Array<[number, number, number]>) {
  const matched = ranges.find(([min, max]) => value >= min && value <= max);
  return matched ? matched[2] : 0;
}

function scoreByRate(value: number, ranges: Array<[number, number, number]>) {
  const matched = ranges.find(([min, max]) => value >= min && value <= max);
  return matched ? matched[2] : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(QUALITY_SCORE_MAX, Math.round(value)));
}

function buildCandidateId(measurementRunId: string, type: CandidateType) {
  return `rec-${measurementRunId.slice(0, 8)}-${type.replace(/_/g, "-")}`;
}

function buildEvidence(
  context: Context,
  focusedObservations: PromptObservation[],
  focusedMentions: MentionRow[],
  focusedCitations: CitationEvidence[],
  options: EvidenceBuildOptions
): CandidateEvidence {
  const citationDetails = focusedCitations;
  const citationRows = options.citationRows ?? buildCitationRows(context, citationDetails);
  const observationRows = buildObservationRows(focusedObservations);
  const citationStatuses = options.citationsUsedAsPrimaryEvidence
    ? unique(focusedObservations.map((observation) => observation.citation_status))
    : [];
  const citationUrls = unique(citationDetails.map((citation) => citation.url).filter((url): url is string => Boolean(url)));
  const citationDomains = unique(citationDetails.map((citation) => citation.domain));
  const matchedClues = options.matchedClues ?? [];

  return {
    measurement_run_id: context.measurementRun.id,
    aggregate_run_id: context.aggregateRun?.id ?? null,
    measurement_profile_id: context.measurementProfileId,
    measurement_profile_label: context.measurementProfileLabel,
    selected_prompt_ids: context.selectedPromptIds,
    observation_count: context.openaiConversations.length,
    prompt_count: context.selectedPromptIds.length,
    search_modes: options.searchModes ?? unique(focusedObservations.map((observation) => observation.search_mode)),
    conversation_ids: focusedObservations.map((observation) => observation.conversation_id),
    run_item_ids: unique(focusedObservations.map((observation) => observation.run_item_id)),
    prompt_texts: unique(focusedObservations.map((observation) => observation.prompt_text)),
    topics: unique(focusedObservations.map((observation) => observation.topic)),
    personas: unique(focusedObservations.map((observation) => observation.persona)),
    response_excerpts: focusedObservations.map((observation) => observation.response_excerpt),
    target_brand_present: context.observations.some((observation) => observation.target_brand_mentioned),
    competitor_presence: buildCompetitorPresence(context.mentions, context.competitorBrands),
    brand_mentions: buildBrandMentionEvidence(focusedMentions),
    citation_urls: citationUrls,
    citation_domains: citationDomains,
    citation_statuses: citationStatuses,
    supports_claim_values: uniqueSupportsClaims(citationDetails.map((citation) => citation.supports_claim)),
    brand_related_values: unique(citationDetails.map((citation) => citation.brand_related)),
    measured_at_values: unique(focusedObservations.map((observation) => observation.measured_at ?? "unknown")),
    data_source: "openai_measurement",
    evidence_label: "CONFIRMED_FACT",
    sample_size_note: `${context.selectedPromptIds.length} prompts / ${context.openaiConversations.length} observations. 少数観測のため断定しすぎない。`,
    recora_metric_notice: RECORA_METRIC_NOTICE,
    focused_observation_count: focusedObservations.length,
    all_conversation_ids: context.openaiConversations.map((conversation) => conversation.id),
    citation_details: citationDetails,
    source_domain_types: uniqueSourceTypes(citationDetails.map((citation) => citation.source_domain_type)),
    source_classification_note: options.sourceClassificationNote ?? SOURCE_CLASSIFICATION_NOTE,
    supports_claim_note: SUPPORTS_CLAIM_NOTE,
    primary_evidence_scope: options.primaryEvidenceScope,
    citations_used_as_primary_evidence: options.citationsUsedAsPrimaryEvidence,
    citation_note: options.citationNote ?? null,
    observation_rows: observationRows,
    citation_rows: citationRows,
    citation_count: citationDetails.length,
    unique_url_count: citationUrls.length,
    unique_domain_count: citationDomains.length,
    supports_claim_unknown_count: citationDetails.filter((citation) => citation.supports_claim === "unknown").length,
    matched_clues: matchedClues,
    matched_clue_count: matchedClues.length,
    case_study_observation_count: options.primaryEvidenceScope === "case_study_prompt_responses" ? focusedObservations.length : 0,
    evidence_strength_note: options.evidenceStrengthNote ?? null,
    db_write_status: "not_written"
  };
}

function buildObservationRows(observations: PromptObservation[]): ObservationEvidenceRow[] {
  return observations.map((observation) => ({
    conversation_id: observation.conversation_id,
    run_item_id: observation.run_item_id,
    prompt_id: observation.prompt_id,
    prompt_text: observation.prompt_text,
    topic: observation.topic,
    persona: observation.persona,
    search_mode: observation.search_mode,
    target_brand_present: observation.target_brand_mentioned,
    target_brand_mention_count: observation.target_brand_mention_count,
    response_excerpt: observation.response_excerpt,
    measured_at: observation.measured_at
  }));
}

function buildCitationRows(context: Context, citations: CitationEvidence[]): CitationEvidenceRow[] {
  const observationByConversationId = new Map(context.observations.map((observation) => [observation.conversation_id, observation]));
  return citations.map((citation) => {
    const observation = observationByConversationId.get(citation.conversation_id);
    return {
      conversation_id: citation.conversation_id,
      run_item_id: observation?.run_item_id ?? "",
      prompt_id: observation?.prompt_id ?? "",
      prompt_text: observation?.prompt_text ?? "",
      url: citation.url,
      domain: citation.domain,
      title: citation.title,
      supports_claim: citation.supports_claim,
      brand_related: citation.brand_related,
      cited_text: citation.cited_text,
      measured_at: observation?.measured_at ?? null
    };
  });
}

function buildObservations(
  conversations: ConversationRow[],
  runItems: RunItemRow[],
  mentions: MentionRow[],
  primaryBrand: BrandRow
): PromptObservation[] {
  const runItemById = new Map(runItems.map((item) => [item.id, item]));
  return conversations.map((conversation) => {
    const runItem = runItemById.get(conversation.run_item_id);
    const targetMention = mentions.find((mention) => {
      return mention.conversation_id === conversation.id && (mention.brand_id === primaryBrand.id || mention.brand_name === primaryBrand.name);
    });
    const targetMentionCount = toNum(targetMention?.mention_count);
    const targetMentioned = Boolean(targetMention && (parseBool(targetMention.mentioned) || targetMentionCount > 0));
    return {
      conversation_id: conversation.id,
      run_item_id: conversation.run_item_id,
      prompt_id: runItem?.prompt_id ?? "",
      prompt_text: runItem?.prompt_text ?? conversation.prompt_text_snapshot,
      topic: runItem?.topic_name ?? "未設定",
      persona: runItem?.persona_name ?? "未設定",
      search_mode: parseBool(conversation.web_search_enabled) ? "web-search" : "no-search",
      response_excerpt: excerpt(conversation.raw_answer, 360),
      target_brand_mentioned: targetMentioned || conversation.raw_answer.includes(primaryBrand.name),
      target_brand_mention_count: targetMentionCount,
      citation_status: conversation.citation_status ?? "unknown",
      measured_at: conversation.measured_at
    };
  });
}

function buildCitationDetails(citations: CitationRow[], primary: BrandRow, competitors: BrandRow[]): CitationEvidence[] {
  return citations.map((citation) => toCitationEvidence(citation, primary, competitors));
}

function toCitationEvidence(citation: CitationRow, primary: BrandRow, competitors: BrandRow[]): CitationEvidence {
  return {
    id: citation.id,
    conversation_id: citation.conversation_id,
    url: citation.url,
    domain: citation.domain,
    title: citation.title,
    source_domain_type: classifySourceDomain(citation, primary, competitors),
    brand_related: citation.brand_related ?? "unknown",
    supports_claim: normalizeSupportsClaim(citation.supports_claim),
    cited_text: citation.cited_text
  };
}

function buildBrandMentionEvidence(mentions: MentionRow[]): BrandMentionEvidence[] {
  return mentions.map((mention) => ({
    conversation_id: mention.conversation_id,
    brand: mention.brand_name,
    brand_type: mention.brand_type,
    mentioned: parseBool(mention.mentioned),
    mention_count: toNum(mention.mention_count),
    recommendation_status: mention.recommendation_status,
    evidence_snippet: mention.evidence_snippet
  }));
}

function buildCompetitorPresence(mentions: MentionRow[], competitors: BrandRow[]) {
  return competitors.map((brand) => {
    const rows = mentions.filter((mention) => mention.brand_id === brand.id || mention.brand_name === brand.name);
    const mentionCount = rows.reduce((sum, mention) => sum + toNum(mention.mention_count), 0);
    return {
      brand: brand.name,
      mentioned: rows.some((mention) => parseBool(mention.mentioned) || toNum(mention.mention_count) > 0),
      mention_count: mentionCount
    };
  });
}

async function writeOutputs(context: Context, candidates: Candidate[], before: CountSnapshot, after: CountSnapshot): Promise<CandidatesPayload> {
  const outputJson = path.join(context.options.outputDir, "recommendation-candidates.json");
  const outputMd = path.join(context.options.outputDir, "recommendation-candidates.md");
  const runOutputDir = path.join(context.options.outputDir, context.measurementRun.id);
  const runOutputJson = path.join(runOutputDir, "recommendation-candidates.json");
  const runOutputMd = path.join(runOutputDir, "recommendation-candidates.md");
  const failedRunItems = context.runItems.filter((item) => item.status === "failed").length;
  const payload: CandidatesPayload = {
    generated_at: new Date().toISOString(),
    project_slug: context.project.slug,
    project_name: context.project.name,
    measurement_run_id: context.measurementRun.id,
    aggregate_run_id: context.aggregateRun?.id ?? null,
    measurement_profile_id: context.measurementProfileId,
    source_run_status: context.measurementRun.status,
    observation_count: context.openaiConversations.length,
    prompt_count: context.selectedPromptIds.length,
    candidate_count: candidates.length,
    candidates,
    db_write_status: "not_written",
    recora_metric_notice: RECORA_METRIC_NOTICE,
    db_write_check: {
      before,
      after,
      unchanged: sameCounts(before, after),
      recommendations_before: before.recommendations ?? 0,
      recommendations_after: after.recommendations ?? 0
    },
    data_scope: {
      run_items: context.runItems.length,
      openai_conversations: context.openaiConversations.length,
      brand_mentions: context.mentions.length,
      citations: context.filteredCitations.length,
      excluded_example_citations: context.excludedExampleCitationCount,
      failed_run_items: failedRunItems
    },
    output: {
      json: outputJson,
      markdown: outputMd,
      run_json: runOutputJson,
      run_markdown: runOutputMd
    }
  };

  await fs.mkdir(context.options.outputDir, { recursive: true });
  await fs.mkdir(runOutputDir, { recursive: true });
  const jsonText = JSON.stringify(payload, null, 2) + "\n";
  const markdownText = renderMarkdown(payload);
  await Promise.all([
    fs.writeFile(outputJson, jsonText, "utf8"),
    fs.writeFile(outputMd, markdownText, "utf8"),
    fs.writeFile(runOutputJson, jsonText, "utf8"),
    fs.writeFile(runOutputMd, markdownText, "utf8")
  ]);
  return payload;
}

function getDisplayPolicyNote(profileId: string) {
  if (profileId === "standard-v01") return "latest standard-v01 run candidates are shown for review.";
  return "explicit OpenAI measurement run candidates are shown as review_required drafts; quality score caps remain active.";
}

function renderMarkdown(payload: CandidatesPayload) {
  const lines = [
    "# Recora 改善候補",
    "",
    `- 生成日時: ${payload.generated_at}`,
    `- プロジェクト: ${payload.project_name} (${payload.project_slug})`,
    `- 対象measurement run: \`${payload.measurement_run_id}\``,
    `- 対象aggregate run: ${payload.aggregate_run_id ? "`" + payload.aggregate_run_id + "`" : "-"}`,
    `- profile: \`${payload.measurement_profile_id}\``,
    `- 観測範囲: ${payload.prompt_count} prompts / ${payload.observation_count} observations`,
    `- 候補数: ${payload.candidate_count}`,
    `- 表示方針: ${getDisplayPolicyNote(payload.measurement_profile_id)}`,
    `- DB書き込み: ${payload.db_write_status}`,
    `- recommendations件数: ${payload.db_write_check.recommendations_before} -> ${payload.db_write_check.recommendations_after}`,
    `- 注意: ${payload.recora_metric_notice}`,
    "",
    "## 対象データ",
    "",
    `- run_items: ${payload.data_scope.run_items}`,
    `- OpenAI実測回答: ${payload.data_scope.openai_conversations}`,
    `- brand_mentions: ${payload.data_scope.brand_mentions}`,
    `- citations: ${payload.data_scope.citations}`,
    `- .example除外citations: ${payload.data_scope.excluded_example_citations}`,
    `- failed_run_items: ${payload.data_scope.failed_run_items}`,
    "",
    "## 候補一覧",
    ""
  ];

  if (payload.candidates.length === 0) {
    lines.push("今回の観測範囲では、表示対象の機械生成インサイトは生成しませんでした。", "");
  }

  for (const candidateItem of payload.candidates) {
    lines.push(
      `### ${candidateItem.title}`,
      "",
      `- ID: \`${candidateItem.id}\``,
      `- type: \`${candidateItem.type}\``,
      `- 表示区分: ${candidateItem.display_category}`,
      `- 表示判定: ${candidateItem.display_decision}`,
      `- ${candidateItem.quality_score_label}: ${candidateItem.quality_score} / ${candidateItem.quality_score_max}`,
      `- priority: ${candidateItem.priority}`,
      `- confidence: ${candidateItem.confidence}`,
      `- 確からしさ: ${candidateItem.confidence_label}`,
      `- 要約: ${candidateItem.summary}`,
      `- 根拠: ${candidateItem.rationale}`,
      `- score explanation: ${candidateItem.score_explanation}`,
      `- customer-facing caution: ${candidateItem.customer_facing_caution}`,
      `- Recora注意書き: ${candidateItem.recora_metric_notice}`,
      `- 少数観測の注意: ${candidateItem.evidence.sample_size_note}`,
      `- 主証拠の範囲: \`${candidateItem.evidence.primary_evidence_scope}\``,
      `- evidence要約: ${candidateItem.evidence.focused_observation_count} observations / ${candidateItem.evidence.citation_rows.length} citation_rows / ${candidateItem.evidence.matched_clues.length} matched_clues`,
      `- 引用URLを主証拠に使用: ${candidateItem.evidence.citations_used_as_primary_evidence}`,
      `- citation note: ${candidateItem.evidence.citation_note ?? "-"}`,
      `- 対象prompt: ${candidateItem.evidence.prompt_texts.length ? candidateItem.evidence.prompt_texts.join(" / ") : "-"}`,
      `- search modes: ${candidateItem.evidence.search_modes.length ? candidateItem.evidence.search_modes.join(", ") : "-"}`,
      `- observation_rows: ${candidateItem.evidence.observation_rows.length}`,
      `- citation_rows: ${candidateItem.evidence.citation_rows.length}`,
      `- matched_clues: ${candidateItem.evidence.matched_clue_count}`,
      `- citation集計: ${candidateItem.evidence.citation_count} citations / ${candidateItem.evidence.unique_url_count} unique URLs / ${candidateItem.evidence.unique_domain_count} domains / ${candidateItem.evidence.supports_claim_unknown_count} supports_claim unknown`,
      `- supports_claim: ${candidateItem.evidence.supports_claim_values.length ? candidateItem.evidence.supports_claim_values.join(", ") : "-"}`,
      `- evidence strength note: ${candidateItem.evidence.evidence_strength_note ?? "-"}`,
      `- 注意書き: ${candidateItem.caution}`,
      `- 推奨する確認項目: ${candidateItem.suggested_next_action}`,
      ""
    );
    appendScoreBreakdown(lines, candidateItem.quality_score_breakdown);
    appendObservationRowSummary(lines, candidateItem.evidence.observation_rows);
    appendCitationRowSummary(lines, candidateItem.evidence.citation_rows);
    appendMatchedClueSummary(lines, candidateItem.evidence.matched_clues);
  }

  return lines.join("\n") + "\n";
}

function appendScoreBreakdown(lines: string[], rows: QualityScoreBreakdownItem[]) {
  if (rows.length === 0) return;
  lines.push("  - score breakdown:");
  for (const row of rows) {
    lines.push(`    - ${row.label}: +${row.points}/${row.max_points} (${row.note})`);
  }
  lines.push("");
}

function appendObservationRowSummary(lines: string[], rows: ObservationEvidenceRow[]) {
  if (rows.length === 0) return;
  lines.push("  - observation_rows summary:");
  for (const row of rows.slice(0, 5)) {
    lines.push(
      `    - ${row.search_mode} / ${row.topic} / ${row.persona} / target_brand_present=${row.target_brand_present} / conversation=${row.conversation_id}`
    );
  }
  if (rows.length > 5) lines.push(`    - ...他${rows.length - 5}件`);
  lines.push("");
}

function appendCitationRowSummary(lines: string[], rows: CitationEvidenceRow[]) {
  if (rows.length === 0) return;
  lines.push("  - citation_rows summary:");
  for (const row of rows.slice(0, 8)) {
    lines.push(
      `    - ${row.domain} / supports_claim=${row.supports_claim} / brand_related=${row.brand_related} / conversation=${row.conversation_id}`
    );
  }
  if (rows.length > 8) lines.push(`    - ...他${rows.length - 8}件`);
  lines.push("");
}

function appendMatchedClueSummary(lines: string[], rows: MatchedClue[]) {
  if (rows.length === 0) return;
  lines.push("  - matched_clues summary:");
  for (const row of rows) {
    lines.push(`    - ${row.search_mode} / ${row.matched_text} / conversation=${row.conversation_id}`);
  }
  lines.push("");
}

async function getProject(db: LocalPostgresClient, slug: string): Promise<ProjectRow> {
  const rows = await db.query<ProjectRow>(`
    select id::text as id, slug, name
    from public.projects
    where slug = ${lit(slug)}
    limit 1
  `);
  if (!rows[0]) throw new Error(`Project not found: ${slug}`);
  return rows[0];
}

async function getMeasurementRunById(db: LocalPostgresClient, projectId: string, runId: string): Promise<MeasurementRunRow> {
  const rows = await db.query<MeasurementRunRow>(`
    select id::text as id, project_id::text as project_id, status::text as status,
      started_at::text as started_at, completed_at::text as completed_at,
      metadata::text as metadata, created_at::text as created_at
    from public.measurement_runs
    where project_id = ${uuid(projectId)}
      and id = ${uuid(runId)}
    limit 1
  `);
  if (!rows[0]) throw new Error(`Measurement run not found: ${runId}`);
  return rows[0];
}

async function getLatestMeasurementRunByProfile(db: LocalPostgresClient, projectId: string, profileId: string): Promise<MeasurementRunRow> {
  const rows = await db.query<MeasurementRunRow>(`
    select id::text as id, project_id::text as project_id, status::text as status,
      started_at::text as started_at, completed_at::text as completed_at,
      metadata::text as metadata, created_at::text as created_at
    from public.measurement_runs
    where project_id = ${uuid(projectId)}
      and status = 'completed'
      and id <> ${uuid(SEED_MEASUREMENT_RUN_ID)}
      and metadata->>'measurement_profile_id' = ${lit(profileId)}
      and metadata->>'data_source' = 'openai_measurement'
      and coalesce(metadata->>'run_kind', 'measurement') <> 'aggregate'
    order by completed_at desc nulls last, created_at desc
    limit 1
  `);
  if (!rows[0]) throw new Error(`Completed measurement run was not found for profile: ${profileId}`);
  return rows[0];
}

async function getAggregateRunById(
  db: LocalPostgresClient,
  projectId: string,
  aggregateRunId: string,
  sourceRunId: string
): Promise<MeasurementRunRow> {
  const run = await getMeasurementRunById(db, projectId, aggregateRunId);
  const metadata = parseMetadata(run.metadata);
  if (run.status !== "completed") throw new Error(`Aggregate run is not completed: ${run.status}`);
  if (readMetadataString(metadata, "run_kind") !== "aggregate") throw new Error("Provided aggregate run is not an aggregate run.");
  if (readMetadataString(metadata, "data_source") !== "openai_measurement") throw new Error("Provided aggregate run is not openai_measurement.");
  if (readMetadataString(metadata, "source_run_id") !== sourceRunId) {
    throw new Error("Provided aggregate run source_run_id does not match the selected measurement run.");
  }
  return run;
}

async function getLatestAggregateRunForMeasurement(
  db: LocalPostgresClient,
  projectId: string,
  sourceRunId: string
): Promise<MeasurementRunRow | null> {
  const rows = await db.query<MeasurementRunRow>(`
    select id::text as id, project_id::text as project_id, status::text as status,
      started_at::text as started_at, completed_at::text as completed_at,
      metadata::text as metadata, created_at::text as created_at
    from public.measurement_runs
    where project_id = ${uuid(projectId)}
      and status = 'completed'
      and metadata->>'run_kind' = 'aggregate'
      and metadata->>'data_source' = 'openai_measurement'
      and metadata->>'source_run_id' = ${lit(sourceRunId)}
    order by completed_at desc nulls last, created_at desc
    limit 1
  `);
  return rows[0] ?? null;
}

async function getBrands(db: LocalPostgresClient, projectId: string) {
  return db.query<BrandRow>(`
    select id::text as id, name, brand_type::text as brand_type, domain
    from public.brands
    where project_id = ${uuid(projectId)}
      and is_active = true
    order by brand_type asc, name asc
  `);
}

async function getRunItems(db: LocalPostgresClient, runId: string) {
  return db.query<RunItemRow>(`
    select ri.id::text as id, ri.prompt_id::text as prompt_id, ri.persona_id::text as persona_id,
      ri.status::text as status, ri.error_message,
      p.text as prompt_text, p.intent as prompt_intent, p.buyer_stage,
      t.id::text as topic_id, t.name as topic_name,
      ps.name as persona_name
    from public.run_items ri
    left join public.prompts p on p.id = ri.prompt_id
    left join public.topics t on t.id = p.topic_id
    left join public.personas ps on ps.id = ri.persona_id
    where ri.run_id = ${uuid(runId)}
    order by ri.created_at asc
  `);
}

async function getConversations(db: LocalPostgresClient, runId: string) {
  return db.query<ConversationRow>(`
    select c.id::text as id, c.run_item_id::text as run_item_id, c.raw_answer,
      c.prompt_text_snapshot, c.provider, c.response_id,
      c.web_search_enabled::text as web_search_enabled,
      c.citation_status::text as citation_status,
      c.measured_at::text as measured_at,
      c.model_returned
    from public.ai_conversations c
    join public.run_items ri on ri.id = c.run_item_id
    where ri.run_id = ${uuid(runId)}
    order by c.created_at asc
  `);
}

async function getMentions(db: LocalPostgresClient, conversationIds: string[]) {
  if (conversationIds.length === 0) return [];
  return db.query<MentionRow>(`
    select bm.conversation_id::text as conversation_id,
      bm.brand_id::text as brand_id,
      b.name as brand_name,
      b.brand_type::text as brand_type,
      bm.mentioned::text as mentioned,
      bm.mention_count::text as mention_count,
      bm.recommendation_status::text as recommendation_status,
      coalesce(bm.evidence_snippet, bm.mention_text) as evidence_snippet
    from public.brand_mentions bm
    join public.brands b on b.id = bm.brand_id
    where bm.conversation_id in (${uuidList(conversationIds)})
    order by bm.conversation_id asc, b.brand_type asc, b.name asc
  `);
}

async function getCitations(db: LocalPostgresClient, conversationIds: string[]) {
  if (conversationIds.length === 0) return [];
  return db.query<CitationRow>(`
    select c.id::text as id,
      c.conversation_id::text as conversation_id,
      c.url,
      c.domain,
      c.title,
      c.source_type::text as source_type,
      sd.source_type::text as source_domain_type,
      c.supports_claim::text as supports_claim,
      c.brand_related::text as brand_related,
      c.cited_text
    from public.citations c
    left join public.source_domains sd on sd.id = c.source_domain_id
    where c.conversation_id in (${uuidList(conversationIds)})
    order by c.created_at asc
  `);
}

async function getCounts(db: LocalPostgresClient) {
  const result: CountSnapshot = {};
  for (const table of TABLES) {
    const rows = await db.query<{ count: string }>(`select count(*)::text as count from public.${table}`);
    result[table] = Number(rows[0]?.count ?? 0);
  }
  return result;
}

function isOpenAiObservation(conversation: ConversationRow) {
  return conversation.provider === "openai" || Boolean(conversation.response_id);
}

function isDisplayableCitation(citation: CitationRow) {
  return !isExampleDomain(citation.domain) && !isExampleDomain(citation.url);
}

function isExampleDomain(value: string | null | undefined) {
  const hostname = getHostname(value);
  return Boolean(hostname && (hostname === "example" || hostname.endsWith(".example")));
}

function getHostname(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  try {
    return new URL(normalized.includes("://") ? normalized : `https://${normalized}`).hostname;
  } catch {
    return normalized.split("/")[0]?.split(":")[0] ?? null;
  }
}

function parseMetadata(value: string | null): Record<string, JsonValue | undefined> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as JsonValue;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, JsonValue | undefined>
      : {};
  } catch {
    return {};
  }
}

function readMetadataString(metadata: Record<string, JsonValue | undefined>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readMetadataNumber(metadata: Record<string, JsonValue | undefined>, key: string) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readMetadataStringArray(metadata: Record<string, JsonValue | undefined>, key: string, fallback: string[]) {
  const value = metadata[key];
  if (!Array.isArray(value)) return fallback;
  const values = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  return values.length > 0 ? values : fallback;
}

function resolveMeasurementProfileId(metadata: Record<string, JsonValue | undefined>) {
  return readMetadataString(metadata, "measurement_profile_id") ?? CUSTOM_OPENAI_MEASUREMENT_PROFILE_ID;
}

function getMeasurementProfileLabel(profileId: string, metadataLabel: string | null) {
  if (profileId === "standard-v01") return "標準測定";
  if (profileId === "small-v01") return "小規模測定";
  if (profileId === CUSTOM_OPENAI_MEASUREMENT_PROFILE_ID) return "Custom OpenAI measurement run";
  return metadataLabel ?? profileId;
}

function classifySourceDomain(citation: CitationRow, primary: BrandRow, competitors: BrandRow[]): SourceDomainType {
  const existing = parseSourceDomainType(citation.source_domain_type ?? citation.source_type);
  if (existing && existing !== "unknown") return existing;
  const domain = normalizeDomain(citation.domain || citation.url || "");
  const primaryDomain = primary.domain ? normalizeDomain(primary.domain) : "";
  if (primaryDomain && !isExampleDomain(primaryDomain) && domainMatches(domain, primaryDomain)) return "owned";
  const competitorDomains = competitors
    .map((brand) => brand.domain)
    .filter((value): value is string => Boolean(value))
    .map(normalizeDomain)
    .filter((value) => !isExampleDomain(value));
  if (competitorDomains.some((competitorDomain) => domainMatches(domain, competitorDomain))) return "competitor";
  const ecHints = ["amazon.", "rakuten.co.jp", "shopping.yahoo.co.jp", "monotaro.com", "askul.co.jp"];
  if (ecHints.some((hint) => domain.includes(hint))) return "ec";
  const mediaHints = ["dezeen", "archdaily", "magazine", "journal", "news", "blog", "media"];
  if (mediaHints.some((hint) => domain.includes(hint))) return "media";
  const foreignBrandHints = ["bisazza", "porcelanosa", "mutina", "marazzi", "florim", "fiandre"];
  if (foreignBrandHints.some((hint) => domain.includes(hint))) return "foreign_brand";
  const manufacturerHints = ["lixil", "sangetsu", "aica", "tile", "tiles", "ceramic", "porcelain", "stone", "kenzai"];
  if (manufacturerHints.some((hint) => domain.includes(hint))) return "manufacturer";
  return "unknown";
}

function parseSourceDomainType(value: string | null | undefined): SourceDomainType | null {
  if (
    value === "owned" ||
    value === "competitor" ||
    value === "media" ||
    value === "review" ||
    value === "technical" ||
    value === "unknown"
  ) {
    return value;
  }
  return null;
}

function normalizeSupportsClaim(value: string | null | undefined): NormalizedSupportsClaim {
  if (value === "true") return "true";
  if (value === "false") return "false";
  return "unknown";
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

function uniqueSourceTypes(values: SourceDomainType[]) {
  return Array.from(new Set(values));
}

function uniqueSupportsClaims(values: NormalizedSupportsClaim[]) {
  return Array.from(new Set(values));
}

function sameCounts(a: CountSnapshot, b: CountSnapshot) {
  return TABLES.every((table) => a[table] === b[table]);
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function excerpt(value: string, length: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, length);
}

function parseBool(value: string | null | undefined) {
  return value === "true";
}

function toNum(value: string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
}

function domainMatches(domain: string, target: string) {
  return domain === target || domain.endsWith("." + target);
}

function lit(value: string) {
  return "'" + value.replace(/'/g, "''") + "'";
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

function uuidList(values: string[]) {
  return values.map(uuid).join(", ");
}

class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) {
    this.url = new URL(databaseUrl);
  }

  async connect() {
    const socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port || 5432) });
    this.socket = socket;
    socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      for (const waiter of this.waiters.splice(0)) waiter();
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
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
    const params = Buffer.from(
      "user\0" + this.user + "\0database\0" + this.database + "\0client_encoding\0UTF8\0\0",
      "utf8"
    );
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
    const clientFinalWithoutProof = "c=biws,r=" + serverNonce;
    const authMessage = clientFirstBare + "," + serverFirst + "," + clientFinalWithoutProof;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(clientFinalWithoutProof + ",p=" + xorBuffers(clientKey, signature).toString("base64"));
  }

  private sendPassword(password: string) {
    this.sendMessage("p", Buffer.from(password + "\0", "utf8"));
  }

  private sendSaslInitial(mechanism: string, response: string) {
    const mechanismBuffer = Buffer.from(mechanism + "\0", "utf8");
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
