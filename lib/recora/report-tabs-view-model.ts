import {
  createRecoraMeasurementAnalysisReadModel,
  type RecoraMeasurementAnalysisReadModel,
  type RecoraRecommendationGateRow,
  type RecoraSourceFreshnessReadModel,
  type RecoraSourceToClaimReadModel
} from "./measurement-analysis-read-model";
import type { RecoraReportReadyGateResult } from "./report-eligibility";
import type {
  Json,
  RecoraAiConversationRow,
  RecoraAiModelRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraPersonaRow,
  RecoraProjectRow,
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRunItemRow,
  RecoraSourceDomainRow,
  RecoraTopicRow
} from "./db/types";

export type ReportDataStatus =
  | "available"
  | "partial"
  | "unavailable"
  | "future"
  | "needs_metadata"
  | "needs_extraction";

export type ReportUnavailableReason =
  | "missing_input"
  | "empty_result"
  | "missing_metadata"
  | "partial_metadata"
  | "scope_unverified"
  | "new_extraction_required"
  | "future_integration"
  | "not_customer_visible"
  | "not_applicable";

export type ReportDataAvailability = {
  status: ReportDataStatus;
  reason?: ReportUnavailableReason;
  message: string;
  availableCount?: number;
  totalCount?: number;
};

export type ReportUnavailableOr<T> = {
  availability: ReportDataAvailability;
  value: T | null;
};

export type ReportMetricUnit = "percent" | "count" | "rank" | "score" | "days" | "text";

export type ReportMetricValue = {
  key: string;
  label: string;
  value: number | string | null;
  unit: ReportMetricUnit;
  basis: string;
  availability: ReportDataAvailability;
  caution?: string;
};

export type ReportAvailabilityKey =
  | "report_scope"
  | "prompt_type"
  | "measurement_purpose"
  | "persona_metadata"
  | "use_case_metadata"
  | "funnel_stage_metadata"
  | "topic_metadata"
  | "category_metadata"
  | "sentiment_labels"
  | "narrative_labels"
  | "caveat_labels"
  | "position_labels"
  | "source_owner_type"
  | "source_freshness"
  | "ai_readiness"
  | "blocked_ai_crawlers"
  | "review_workflow"
  | "page_briefs"
  | "action_plan";

export type ReportAvailabilityMap = Record<ReportAvailabilityKey, ReportDataAvailability>;

export type ReportTabId =
  | "overview"
  | "brand_competitors"
  | "persona_topics"
  | "prompts"
  | "answers"
  | "citations"
  | "recommendations";

export type ReportTabSummary = {
  id: ReportTabId;
  label: string;
  availability: ReportDataAvailability;
  primaryQuestion: string;
};

export type ReportBrandSummary = {
  brandId: string;
  name: string;
  brandType: RecoraBrandRow["brand_type"];
  domain: string | null;
  category: string | null;
  aliases: string[];
  isPrimary: boolean;
};

export type ReportCompetitorSummary = ReportBrandSummary & {
  isPrimary: false;
};

export type ReportRunSummary = {
  projectId: string | null;
  projectSlug: string | null;
  projectName: string | null;
  currentRunId: string | null;
  aggregateRunId: string | null;
  previousRunId: string | null;
  status: RecoraMeasurementRunRow["status"] | "unknown";
  periodStart: string | null;
  periodEnd: string | null;
  comparisonStart: string | null;
  comparisonEnd: string | null;
  region: string | null;
  language: string | null;
  completedAt: string | null;
  measurementRunCount: number;
  validObservationCount: number;
  conversationCount: number;
  citationOccurrenceCount: number;
  recommendationCandidateCount: number;
  reportReadyStatus: RecoraReportReadyGateResult["status"] | null;
};

export type ReportInsight = {
  id: string;
  kind: "win" | "loss" | "gap" | "risk" | "opportunity" | "note";
  title: string;
  summary: string;
  evidence: string[];
  availability: ReportDataAvailability;
};

export type ReportActionSummary = {
  id: string;
  title: string;
  priority: RecoraRecommendationRow["priority"] | "unknown";
  targetUrl: string | null;
  relatedPromptId: string | null;
  relatedTopicId: string | null;
  evidence: string[];
  availability: ReportDataAvailability;
};

export type ReportWarningSummary = {
  code: string;
  severity: "info" | "warning" | "blocking";
  message: string;
  availability: ReportDataAvailability;
};

export type ReportBrandRankingBasis = "metric_snapshot_sov" | "metric_snapshot_visibility" | "eligible_prompt_mentions";

export type ReportBrandRankingRow = {
  rank: number;
  brand: ReportBrandSummary;
  aiPresenceRate: ReportMetricValue;
  shareOfVoice: ReportMetricValue;
  averagePosition: ReportMetricValue;
  mentionCount: number;
  citationOccurrenceCount: number;
  basis: ReportBrandRankingBasis;
  availability: ReportDataAvailability;
};

export type ReportComparisonRow = {
  brand: ReportBrandSummary;
  primaryBrandName: string | null;
  aiPresenceGap: ReportMetricValue;
  sovGap: ReportMetricValue;
  averagePositionGap: ReportMetricValue;
  coMentionedCompetitors: Array<{ brandId: string; name: string; count: number }>;
  availability: ReportDataAvailability;
};

export type ReportSegmentPerformanceRow = {
  id: string;
  label: string;
  kind: "persona" | "use_case" | "funnel_stage" | "topic" | "category";
  promptCount: number;
  observationCount: number;
  aiPresenceRate: ReportMetricValue;
  shareOfVoice: ReportMetricValue;
  topCompetitorName: string | null;
  competitiveGap: ReportMetricValue;
  availability: ReportDataAvailability;
};

export type ReportPersonaTopicHeatmapRow = {
  personaId: string;
  personaName: string;
  topicId: string;
  topicName: string;
  promptCount: number;
  observationCount: number;
  aiPresenceRate: ReportMetricValue;
  availability: ReportDataAvailability;
};

export type ReportPromptType =
  | "non_branded"
  | "branded"
  | "comparison_generic"
  | "comparison_named"
  | "competitor_named"
  | "citation_check"
  | "unknown";

export type ReportMeasurementPurpose =
  | "visibility"
  | "ranking"
  | "sov"
  | "sentiment"
  | "brand_perception"
  | "citation_validation"
  | "recommendation_input"
  | "unknown";

export type ReportPromptMetricEligibility = {
  visibility: boolean;
  ranking: boolean;
  shareOfVoice: boolean;
  sentiment: boolean;
  citation: boolean;
  availability: ReportDataAvailability;
};

export type ReportPromptRow = {
  promptId: string;
  promptText: string;
  topicId: string | null;
  topicName: string | null;
  personaId: string | null;
  personaName: string | null;
  useCase: ReportUnavailableOr<string>;
  funnelStage: ReportUnavailableOr<string>;
  category: ReportUnavailableOr<string>;
  promptType: ReportUnavailableOr<ReportPromptType>;
  measurementPurpose: ReportUnavailableOr<ReportMeasurementPurpose>;
  metricEligibility: ReportPromptMetricEligibility;
  answerCount: number;
  targetBrandMentionedCount: number;
  competitorMentionedCount: number;
  citationOccurrenceCount: number;
  aiPresenceRate: ReportMetricValue;
  shareOfVoice: ReportMetricValue;
  averagePosition: ReportMetricValue;
  status: "ready_for_metrics" | "needs_metadata" | "needs_extraction";
  availability: ReportDataAvailability;
};

export type ReportAnswerPosition = "top" | "middle" | "bottom" | "missing" | "unknown";
export type ReportSentimentLabel = "positive" | "neutral" | "negative" | "mixed" | "unknown";

export type ReportAnswerRow = {
  conversationId: string;
  runItemId: string | null;
  promptId: string | null;
  promptText: string | null;
  modelLabel: string | null;
  answerExcerpt: string | null;
  targetBrandMentioned: boolean;
  targetBrandPosition: ReportUnavailableOr<ReportAnswerPosition>;
  targetBrandSentiment: ReportUnavailableOr<ReportSentimentLabel>;
  targetEvidenceSnippet: string | null;
  mentionedCompetitors: Array<{ brandId: string; name: string; position: number | null }>;
  citationOccurrenceCount: number;
  citationDomains: string[];
  narrative: ReportUnavailableOr<string>;
  caveat: ReportUnavailableOr<string>;
  availability: ReportDataAvailability;
};

export type ReportCitationOwnerType = "owned" | "competitor" | "third_party" | "unknown";

export type ReportCitationDomainRow = {
  domain: string;
  ownerType: ReportUnavailableOr<ReportCitationOwnerType>;
  sourceType: RecoraCitationRow["source_type"];
  occurrenceCount: number;
  citationCount: number;
  urlCount: number;
  citationShare: ReportMetricValue;
  sourceFreshness: ReportUnavailableOr<RecoraSourceFreshnessReadModel["status"]>;
  sourceToClaimStatusCounts: Record<string, number>;
  availability: ReportDataAvailability;
};

export type ReportCitationUrlRow = {
  citationId: string;
  conversationId: string;
  url: string | null;
  canonicalUrl: string | null;
  domain: string;
  title: string | null;
  ownerType: ReportUnavailableOr<ReportCitationOwnerType>;
  sourceType: RecoraCitationRow["source_type"];
  occurrenceCount: number;
  brandRelated: RecoraCitationRow["brand_related"];
  sourceFreshness: ReportUnavailableOr<RecoraSourceFreshnessReadModel>;
  sourceToClaim: ReportUnavailableOr<RecoraSourceToClaimReadModel>;
  promptId: string | null;
  promptText: string | null;
  availability: ReportDataAvailability;
};

export type ReportRecommendationRow = {
  recommendationId: string;
  candidateId: string;
  title: string;
  type: RecoraRecommendationRow["type"];
  priority: RecoraRecommendationRow["priority"];
  impactScore: number | null;
  effortScore: number | null;
  targetUrl: string | null;
  relatedPromptId: string | null;
  relatedTopicId: string | null;
  publicationState: RecoraRecommendationGateRow["publicationState"] | null;
  qualityGateStage: RecoraRecommendationGateRow["stage"] | null;
  qualityGateDecision: RecoraRecommendationGateRow["decision"] | null;
  reviewStatus: ReportUnavailableOr<string>;
  evidence: string[];
  availability: ReportDataAvailability;
};

export type ReportPageBrief = {
  targetUrl: string | null;
  targetPromptIds: string[];
  targetTopicIds: string[];
  summary: string;
  availability: ReportDataAvailability;
};

export type ReportActionPlanItem = {
  task: string;
  expectedImpact: number | null;
  effort: number | null;
  targetUrl: string | null;
  availability: ReportDataAvailability;
};

export type ReportOverviewTabViewModel = {
  availability: ReportDataAvailability;
  runSummary: ReportRunSummary;
  metrics: {
    aiPresenceRate: ReportMetricValue;
    shareOfVoice: ReportMetricValue;
    brandRanking: ReportMetricValue;
    citationOccurrenceCount: ReportMetricValue;
    validObservationCount: ReportMetricValue;
  };
  insights: ReportInsight[];
  nextActions: ReportActionSummary[];
  warnings: ReportWarningSummary[];
};

export type ReportBrandCompetitorsTabViewModel = {
  availability: ReportDataAvailability;
  rankingRows: ReportBrandRankingRow[];
  comparisonRows: ReportComparisonRow[];
  narrativeComparison: ReportUnavailableOr<ReportInsight[]>;
  sentimentComparison: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
  citationGapRows: ReportComparisonRow[];
};

export type ReportPersonaTopicsTabViewModel = {
  availability: ReportDataAvailability;
  personaRows: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
  useCaseRows: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
  funnelStageRows: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
  topicRows: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
  categoryRows: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
  personaTopicHeatmap: ReportUnavailableOr<ReportPersonaTopicHeatmapRow[]>;
};

export type ReportPromptsTabViewModel = {
  availability: ReportDataAvailability;
  promptRows: ReportPromptRow[];
  promptTypeAvailability: ReportDataAvailability;
  measurementPurposeAvailability: ReportDataAvailability;
  competitorOnlyPrompts: ReportUnavailableOr<ReportPromptRow[]>;
  weakOwnBrandPrompts: ReportUnavailableOr<ReportPromptRow[]>;
};

export type ReportAnswersTabViewModel = {
  availability: ReportDataAvailability;
  answerRows: ReportAnswerRow[];
  sentimentSummary: ReportUnavailableOr<Array<{ label: ReportSentimentLabel; count: number }>>;
  narrativeSummary: ReportUnavailableOr<ReportInsight[]>;
  caveatSummary: ReportUnavailableOr<ReportInsight[]>;
  positionSummary: ReportUnavailableOr<Array<{ position: ReportAnswerPosition; count: number }>>;
};

export type ReportCitationsTabViewModel = {
  availability: ReportDataAvailability;
  domainRows: ReportCitationDomainRow[];
  urlRows: ReportCitationUrlRow[];
  ownedDomainCitationRate: ReportMetricValue;
  ownerTypeAvailability: ReportDataAvailability;
  sourceFreshnessAvailability: ReportDataAvailability;
  crawlerAccessibility: ReportUnavailableOr<null>;
};

export type ReportRecommendationsTabViewModel = {
  availability: ReportDataAvailability;
  recommendationRows: ReportRecommendationRow[];
  reviewQueue: ReportUnavailableOr<ReportRecommendationRow[]>;
  pageBriefs: ReportUnavailableOr<ReportPageBrief[]>;
  actionPlan: ReportUnavailableOr<ReportActionPlanItem[]>;
};

export type RecoraReportViewModel = {
  schemaVersion: "report-tabs-read-model-v1";
  generatedAt: string | null;
  project: {
    id: string | null;
    slug: string | null;
    name: string | null;
  };
  primaryBrand: ReportBrandSummary | null;
  competitors: ReportCompetitorSummary[];
  runSummary: ReportRunSummary;
  availability: ReportAvailabilityMap;
  tabs: {
    order: ReportTabSummary[];
    overview: ReportOverviewTabViewModel;
    brandCompetitors: ReportBrandCompetitorsTabViewModel;
    personaTopics: ReportPersonaTopicsTabViewModel;
    prompts: ReportPromptsTabViewModel;
    answers: ReportAnswersTabViewModel;
    citations: ReportCitationsTabViewModel;
    recommendations: ReportRecommendationsTabViewModel;
  };
};

export type BuildRecoraReportViewModelInput = {
  project: RecoraProjectRow | null;
  currentRun?: RecoraMeasurementRunRow | null;
  aggregateRun?: RecoraMeasurementRunRow | null;
  previousRun?: RecoraMeasurementRunRow | null;
  brands?: RecoraBrandRow[];
  personas?: RecoraPersonaRow[];
  topics?: RecoraTopicRow[];
  prompts?: RecoraPromptRow[];
  aiModels?: RecoraAiModelRow[];
  runItems?: RecoraRunItemRow[];
  conversations?: RecoraAiConversationRow[];
  brandMentions?: RecoraBrandMentionRow[];
  citations?: RecoraCitationRow[];
  sourceDomains?: RecoraSourceDomainRow[];
  metricSnapshots?: RecoraMetricSnapshotRow[];
  recommendations?: RecoraRecommendationRow[];
  previousBrandMentions?: RecoraBrandMentionRow[] | null;
  reportReadyGate?: RecoraReportReadyGateResult | null;
  preQualityGateCandidateCount?: number | null;
  generatedAt?: string | null;
};

type NormalizedInput = {
  project: RecoraProjectRow | null;
  currentRun: RecoraMeasurementRunRow | null;
  aggregateRun: RecoraMeasurementRunRow | null;
  previousRun: RecoraMeasurementRunRow | null;
  brands: RecoraBrandRow[];
  personas: RecoraPersonaRow[];
  topics: RecoraTopicRow[];
  prompts: RecoraPromptRow[];
  aiModels: RecoraAiModelRow[];
  runItems: RecoraRunItemRow[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
  sourceDomains: RecoraSourceDomainRow[];
  metricSnapshots: RecoraMetricSnapshotRow[];
  recommendations: RecoraRecommendationRow[];
  previousBrandMentions: RecoraBrandMentionRow[] | null;
  reportReadyGate: RecoraReportReadyGateResult | null;
  preQualityGateCandidateCount: number | null;
};

type BuildContext = {
  input: NormalizedInput;
  analysis: RecoraMeasurementAnalysisReadModel;
  availability: ReportAvailabilityMap;
  primaryBrand: RecoraBrandRow | null;
  brandSummariesById: Map<string, ReportBrandSummary>;
  runItemById: Map<string, RecoraRunItemRow>;
  promptById: Map<string, RecoraPromptRow>;
  personaById: Map<string, RecoraPersonaRow>;
  topicById: Map<string, RecoraTopicRow>;
  modelById: Map<string, RecoraAiModelRow>;
  conversationById: Map<string, RecoraAiConversationRow>;
  mentionsByConversationId: Map<string, RecoraBrandMentionRow[]>;
  citationsByConversationId: Map<string, RecoraCitationRow[]>;
  metricSnapshotsByBrandId: Map<string, RecoraMetricSnapshotRow>;
  sourceDomainById: Map<string, RecoraSourceDomainRow>;
  eligibleConversationIdsByPurpose: Map<ReportMeasurementPurpose, Set<string>>;
};

const KNOWN_PROMPT_TYPES: ReportPromptType[] = [
  "non_branded",
  "branded",
  "comparison_generic",
  "comparison_named",
  "competitor_named",
  "citation_check",
  "unknown"
];

const KNOWN_MEASUREMENT_PURPOSES: ReportMeasurementPurpose[] = [
  "visibility",
  "ranking",
  "sov",
  "sentiment",
  "brand_perception",
  "citation_validation",
  "recommendation_input",
  "unknown"
];

export function buildRecoraReportViewModel(input: BuildRecoraReportViewModelInput): RecoraReportViewModel {
  const normalized = normalizeInput(input);
  const analysis = createRecoraMeasurementAnalysisReadModel({
    brands: normalized.brands,
    runItems: normalized.runItems,
    conversations: normalized.conversations,
    brandMentions: normalized.brandMentions,
    citations: normalized.citations,
    metricSnapshots: normalized.metricSnapshots,
    recommendations: normalized.recommendations,
    previousBrandMentions: normalized.previousBrandMentions,
    prompts: normalized.prompts,
    topics: normalized.topics,
    sourceDomains: normalized.sourceDomains
  });
  const primaryBrand = normalized.brands.find((brand) => brand.brand_type === "primary") ?? null;
  const brandSummaries = normalized.brands.map((brand) => createBrandSummary(brand));
  const brandSummariesById = new Map(brandSummaries.map((brand) => [brand.brandId, brand]));
  const context: BuildContext = {
    input: normalized,
    analysis,
    availability: buildAvailabilityMap(normalized),
    primaryBrand,
    brandSummariesById,
    runItemById: new Map(normalized.runItems.map((item) => [item.id, item])),
    promptById: new Map(normalized.prompts.map((prompt) => [prompt.id, prompt])),
    personaById: new Map(normalized.personas.map((persona) => [persona.id, persona])),
    topicById: new Map(normalized.topics.map((topic) => [topic.id, topic])),
    modelById: new Map(normalized.aiModels.map((model) => [model.id, model])),
    conversationById: new Map(normalized.conversations.map((conversation) => [conversation.id, conversation])),
    mentionsByConversationId: groupBy(normalized.brandMentions, (mention) => mention.conversation_id),
    citationsByConversationId: groupBy(normalized.citations, (citation) => citation.conversation_id),
    metricSnapshotsByBrandId: buildMetricSnapshotsByBrandId(normalized.metricSnapshots),
    sourceDomainById: new Map(normalized.sourceDomains.map((sourceDomain) => [sourceDomain.id, sourceDomain])),
    eligibleConversationIdsByPurpose: buildEligibleConversationIdsByPurpose(normalized)
  };
  const runSummary = buildRunSummary(context);
  const competitors = brandSummaries.filter((brand): brand is ReportCompetitorSummary => brand.brandType === "competitor");
  const overview = buildOverviewTab(context, runSummary);
  const brandCompetitors = buildBrandCompetitorsTab(context);
  const personaTopics = buildPersonaTopicsTab(context);
  const prompts = buildPromptsTab(context);
  const answers = buildAnswersTab(context);
  const citations = buildCitationsTab(context);
  const recommendations = buildRecommendationsTab(context);

  return {
    schemaVersion: "report-tabs-read-model-v1",
    generatedAt: input.generatedAt ?? null,
    project: {
      id: normalized.project?.id ?? null,
      slug: normalized.project?.slug ?? null,
      name: normalized.project?.name ?? null
    },
    primaryBrand: primaryBrand ? createBrandSummary(primaryBrand) : null,
    competitors,
    runSummary,
    availability: context.availability,
    tabs: {
      order: buildTabOrder({
        overview,
        brandCompetitors,
        personaTopics,
        prompts,
        answers,
        citations,
        recommendations
      }),
      overview,
      brandCompetitors,
      personaTopics,
      prompts,
      answers,
      citations,
      recommendations
    }
  };
}

function normalizeInput(input: BuildRecoraReportViewModelInput): NormalizedInput {
  const runItems = input.runItems ?? [];
  const completedRunItemIds = new Set(runItems.filter((item) => item.status === "completed").map((item) => item.id));
  const conversations = (input.conversations ?? []).filter((conversation) =>
    completedRunItemIds.size === 0 || completedRunItemIds.has(conversation.run_item_id)
  );
  const conversationIds = new Set(conversations.map((conversation) => conversation.id));

  return {
    project: input.project ?? null,
    currentRun: input.currentRun ?? null,
    aggregateRun: input.aggregateRun ?? null,
    previousRun: input.previousRun ?? null,
    brands: input.brands ?? [],
    personas: input.personas ?? [],
    topics: input.topics ?? [],
    prompts: input.prompts ?? [],
    aiModels: input.aiModels ?? [],
    runItems,
    conversations,
    brandMentions: (input.brandMentions ?? []).filter((mention) => conversationIds.has(mention.conversation_id)),
    citations: (input.citations ?? [])
      .filter((citation) => conversationIds.has(citation.conversation_id))
      .filter((citation) => !isExampleDomain(citation.domain) && !isExampleDomain(citation.url)),
    sourceDomains: input.sourceDomains ?? [],
    metricSnapshots: input.metricSnapshots ?? [],
    recommendations: input.recommendations ?? [],
    previousBrandMentions: input.previousBrandMentions ?? null,
    reportReadyGate: input.reportReadyGate ?? null,
    preQualityGateCandidateCount: input.preQualityGateCandidateCount ?? null
  };
}

function buildAvailabilityMap(input: NormalizedInput): ReportAvailabilityMap {
  return {
    report_scope: availability(
      input.project && input.currentRun ? "available" : "unavailable",
      input.project && input.currentRun ? "Report project and run are available." : "Report project or run is missing.",
      input.project && input.currentRun ? undefined : "missing_input"
    ),
    prompt_type: promptMetadataAvailability(input.prompts, "prompt_type", "Prompt type metadata is available."),
    measurement_purpose: promptMetadataAvailability(
      input.prompts,
      "measurement_purpose",
      "Measurement purpose metadata is available."
    ),
    persona_metadata: relationAvailability(
      input.prompts,
      input.personas,
      (prompt) => prompt.persona_id,
      "Persona metadata is available for prompts.",
      "Prompt persona metadata is missing or not loaded."
    ),
    use_case_metadata: promptMetadataAvailability(input.prompts, "use_case", "Use-case metadata is available."),
    funnel_stage_metadata: funnelStageAvailability(input.prompts),
    topic_metadata: relationAvailability(
      input.prompts,
      input.topics,
      (prompt) => prompt.topic_id,
      "Topic metadata is available for prompts.",
      "Prompt topic metadata is missing or not loaded."
    ),
    category_metadata: promptMetadataAvailability(input.prompts, "category", "Category metadata is available."),
    sentiment_labels: sentimentAvailability(input.brandMentions),
    narrative_labels: extractionAvailability(input.brandMentions, "narrative_label", "Narrative labels need extraction."),
    caveat_labels: extractionAvailability(input.brandMentions, "caveat_label", "Caveat labels need extraction."),
    position_labels: positionAvailability(input.brandMentions),
    source_owner_type: sourceOwnerTypeAvailability(input.citations, input.sourceDomains),
    source_freshness: sourceFreshnessAvailability(input.citations),
    ai_readiness: futureAvailability("AI readiness requires a separate site/page audit integration."),
    blocked_ai_crawlers: futureAvailability("Blocked AI crawler checks require a crawler/accessibility integration."),
    review_workflow: futureAvailability("Recommendation review workflow persistence is not implemented in this read model."),
    page_briefs: futureAvailability("Page briefs require a separate reviewed grouping workflow."),
    action_plan: futureAvailability("Action plan workflow fields require a separate implementation.")
  };
}

function buildRunSummary(context: BuildContext): ReportRunSummary {
  const input = context.input;

  return {
    projectId: input.project?.id ?? null,
    projectSlug: input.project?.slug ?? null,
    projectName: input.project?.name ?? null,
    currentRunId: input.currentRun?.id ?? null,
    aggregateRunId: input.aggregateRun?.id ?? null,
    previousRunId: input.previousRun?.id ?? null,
    status: input.currentRun?.status ?? "unknown",
    periodStart: input.currentRun?.period_start ?? input.aggregateRun?.period_start ?? null,
    periodEnd: input.currentRun?.period_end ?? input.aggregateRun?.period_end ?? null,
    comparisonStart: input.currentRun?.comparison_start ?? input.aggregateRun?.comparison_start ?? null,
    comparisonEnd: input.currentRun?.comparison_end ?? input.aggregateRun?.comparison_end ?? null,
    region: input.currentRun?.region ?? input.aggregateRun?.region ?? input.project?.region ?? null,
    language: input.currentRun?.language ?? input.aggregateRun?.language ?? input.project?.language ?? null,
    completedAt: input.currentRun?.completed_at ?? input.aggregateRun?.completed_at ?? null,
    measurementRunCount: input.currentRun ? 1 : 0,
    validObservationCount: input.conversations.length,
    conversationCount: input.conversations.length,
    citationOccurrenceCount: sum(input.citations.map(getCitationOccurrenceCount)),
    recommendationCandidateCount: input.recommendations.length,
    reportReadyStatus: input.reportReadyGate?.status ?? null
  };
}

function buildOverviewTab(context: BuildContext, runSummary: ReportRunSummary): ReportOverviewTabViewModel {
  const aiPresenceRate = buildAiPresenceRateMetric(context);
  const shareOfVoice = buildShareOfVoiceMetric(context);
  const rankingRows = buildBrandRankingRows(context);
  const primaryRanking = rankingRows.find((row) => row.brand.isPrimary) ?? null;
  const brandRanking = metricValue({
    key: "brand_ranking",
    label: "Brand ranking",
    value: primaryRanking?.rank ?? null,
    unit: "rank",
    basis: primaryRanking?.basis ?? "brand_ranking_unavailable",
    availability: primaryRanking?.availability ?? context.availability.prompt_type,
    caution: "Ranking basis must not mix branded prompts into visibility, ranking, or SOV."
  });
  const citationOccurrenceCount = metricValue({
    key: "citation_occurrence_count",
    label: "Citation occurrences",
    value: runSummary.citationOccurrenceCount,
    unit: "count",
    basis: "citations.occurrence_count",
    availability: countAvailability(runSummary.citationOccurrenceCount, "Citation rows are available.")
  });
  const validObservationCount = metricValue({
    key: "valid_observation_count",
    label: "Valid observations",
    value: runSummary.validObservationCount,
    unit: "count",
    basis: "completed run_items with ai_conversations",
    availability: countAvailability(runSummary.validObservationCount, "Completed conversations are available.")
  });
  const insights = buildOverviewInsights(context);
  const nextActions = buildNextActions(context);
  const warnings = buildWarnings(context.availability);

  return {
    availability: context.availability.report_scope,
    runSummary,
    metrics: {
      aiPresenceRate,
      shareOfVoice,
      brandRanking,
      citationOccurrenceCount,
      validObservationCount
    },
    insights,
    nextActions,
    warnings
  };
}

function buildBrandCompetitorsTab(context: BuildContext): ReportBrandCompetitorsTabViewModel {
  const rankingRows = buildBrandRankingRows(context);
  const primary = rankingRows.find((row) => row.brand.isPrimary) ?? null;
  const comparisonRows = rankingRows
    .filter((row) => !row.brand.isPrimary)
    .map((row) => createComparisonRow(row, primary));
  const availabilityValue = rankingRows.length > 0
    ? mergeAvailability(rankingRows.map((row) => row.availability), "Brand comparison rows are available.")
    : context.availability.prompt_type;

  return {
    availability: availabilityValue,
    rankingRows,
    comparisonRows,
    narrativeComparison: unavailableOr([], context.availability.narrative_labels),
    sentimentComparison: unavailableOr([], context.availability.sentiment_labels),
    citationGapRows: comparisonRows
  };
}

function buildPersonaTopicsTab(context: BuildContext): ReportPersonaTopicsTabViewModel {
  const personaRows = buildSegmentRows(context, "persona", context.availability.persona_metadata, getPromptPersonaKey);
  const useCaseRows = buildSegmentRows(context, "use_case", context.availability.use_case_metadata, getPromptUseCaseKey);
  const funnelStageRows = buildSegmentRows(
    context,
    "funnel_stage",
    context.availability.funnel_stage_metadata,
    getPromptFunnelStageKey
  );
  const topicRows = buildSegmentRows(context, "topic", context.availability.topic_metadata, getPromptTopicKey);
  const categoryRows = buildSegmentRows(context, "category", context.availability.category_metadata, getPromptCategoryKey);
  const heatmapRows = buildPersonaTopicHeatmap(context);
  const availabilityValue = mergeAvailability(
    [
      personaRows.availability,
      useCaseRows.availability,
      funnelStageRows.availability,
      topicRows.availability
    ],
    "Persona, use-case, funnel-stage, and topic rows are available."
  );

  return {
    availability: availabilityValue,
    personaRows,
    useCaseRows,
    funnelStageRows,
    topicRows,
    categoryRows,
    personaTopicHeatmap: unavailableOr(heatmapRows, heatmapRows.length > 0 ? context.availability.persona_metadata : context.availability.persona_metadata)
  };
}

function buildPromptsTab(context: BuildContext): ReportPromptsTabViewModel {
  const promptRows = context.input.prompts.map((prompt) => buildPromptRow(context, prompt));
  const competitorOnlyPrompts = filterUnavailableRows(
    promptRows.filter((row) => row.targetBrandMentionedCount === 0 && row.competitorMentionedCount > 0),
    context.availability.prompt_type
  );
  const weakOwnBrandPrompts = filterUnavailableRows(
    promptRows.filter((row) => row.targetBrandMentionedCount > 0 && row.averagePosition.value !== null),
    context.availability.position_labels
  );
  const availabilityValue = mergeAvailability(
    [context.availability.prompt_type, context.availability.measurement_purpose],
    "Prompt rows are available."
  );

  return {
    availability: availabilityValue,
    promptRows,
    promptTypeAvailability: context.availability.prompt_type,
    measurementPurposeAvailability: context.availability.measurement_purpose,
    competitorOnlyPrompts,
    weakOwnBrandPrompts
  };
}

function buildAnswersTab(context: BuildContext): ReportAnswersTabViewModel {
  const answerRows = context.input.conversations.map((conversation) => buildAnswerRow(context, conversation));
  const sentimentCounts = countBy(
    answerRows.map((row) => row.targetBrandSentiment.value ?? "unknown"),
    (value) => value
  );
  const positionCounts = countBy(
    answerRows.map((row) => row.targetBrandPosition.value ?? "unknown"),
    (value) => value
  );

  return {
    availability: countAvailability(answerRows.length, "AI answer rows are available."),
    answerRows,
    sentimentSummary: unavailableOr(
      Array.from(sentimentCounts.entries()).map(([label, count]) => ({ label: label as ReportSentimentLabel, count })),
      context.availability.sentiment_labels
    ),
    narrativeSummary: unavailableOr([], context.availability.narrative_labels),
    caveatSummary: unavailableOr([], context.availability.caveat_labels),
    positionSummary: unavailableOr(
      Array.from(positionCounts.entries()).map(([position, count]) => ({ position: position as ReportAnswerPosition, count })),
      context.availability.position_labels
    )
  };
}

function buildCitationsTab(context: BuildContext): ReportCitationsTabViewModel {
  const totalOccurrences = sum(context.input.citations.map(getCitationOccurrenceCount));
  const domainRows = context.analysis.sources.sourceDomains.map((domain) => {
    const citations = context.input.citations.filter((citation) => citation.domain === domain.domain);
    const ownerType = getDomainOwnerType(context, citations);
    const freshness = getDomainFreshness(citations);

    return {
      domain: domain.domain,
      ownerType,
      sourceType: domain.sourceType,
      occurrenceCount: domain.occurrenceCount,
      citationCount: domain.citationCount,
      urlCount: domain.urls.length,
      citationShare: metricValue({
        key: `citation_share:${domain.domain}`,
        label: "Citation share",
        value: percent(domain.occurrenceCount, totalOccurrences),
        unit: "percent",
        basis: "citations.occurrence_count by domain",
        availability: countAvailability(totalOccurrences, "Citation share is derived from citation occurrences.")
      }),
      sourceFreshness: freshness,
      sourceToClaimStatusCounts: domain.sourceToClaimStatusCounts,
      availability: countAvailability(domain.occurrenceCount, "Citation domain row is available.")
    };
  });
  const urlRows = context.analysis.sources.citationSources.map((source) => buildCitationUrlRow(context, source.citationId));
  const ownedOccurrences = domainRows
    .filter((row) => row.ownerType.value === "owned")
    .reduce((total, row) => total + row.occurrenceCount, 0);

  return {
    availability: countAvailability(urlRows.length, "Citation URL rows are available."),
    domainRows,
    urlRows,
    ownedDomainCitationRate: metricValue({
      key: "owned_domain_citation_rate",
      label: "Owned domain citation rate",
      value: totalOccurrences > 0 ? percent(ownedOccurrences, totalOccurrences) : null,
      unit: "percent",
      basis: "citation owner type",
      availability: context.availability.source_owner_type,
      caution: "Citation count is observed occurrence data, not source-to-claim validation."
    }),
    ownerTypeAvailability: context.availability.source_owner_type,
    sourceFreshnessAvailability: context.availability.source_freshness,
    crawlerAccessibility: unavailableOr<null>(null, context.availability.blocked_ai_crawlers)
  };
}

function buildRecommendationsTab(context: BuildContext): ReportRecommendationsTabViewModel {
  const gateByRecommendationId = new Map(
    context.analysis.recommendationQualityGate.candidates.map((candidate) => [candidate.recommendationId, candidate])
  );
  const recommendationRows = context.input.recommendations
    .map((recommendation) => buildRecommendationRow(recommendation, gateByRecommendationId.get(recommendation.id) ?? null))
    .sort((left, right) =>
      priorityWeight(left.priority) - priorityWeight(right.priority) ||
      (right.impactScore ?? 0) - (left.impactScore ?? 0) ||
      left.title.localeCompare(right.title)
    );
  const reviewQueueRows = recommendationRows.filter((row) =>
    row.qualityGateStage === "pre_quality_gate" || row.qualityGateDecision === "hold"
  );

  return {
    availability: countAvailability(recommendationRows.length, "Recommendation candidate rows are available."),
    recommendationRows,
    reviewQueue: unavailableOr(reviewQueueRows, context.availability.review_workflow),
    pageBriefs: unavailableOr<ReportPageBrief[]>(null, context.availability.page_briefs),
    actionPlan: unavailableOr<ReportActionPlanItem[]>(null, context.availability.action_plan)
  };
}

function buildTabOrder(tabs: {
  overview: ReportOverviewTabViewModel;
  brandCompetitors: ReportBrandCompetitorsTabViewModel;
  personaTopics: ReportPersonaTopicsTabViewModel;
  prompts: ReportPromptsTabViewModel;
  answers: ReportAnswersTabViewModel;
  citations: ReportCitationsTabViewModel;
  recommendations: ReportRecommendationsTabViewModel;
}): ReportTabSummary[] {
  return [
    {
      id: "overview",
      label: "Report overview",
      availability: tabs.overview.availability,
      primaryQuestion: "What is the current state and what should be judged next?"
    },
    {
      id: "brand_competitors",
      label: "Brand and competitors",
      availability: tabs.brandCompetitors.availability,
      primaryQuestion: "Where does the target brand win or lose against competitors?"
    },
    {
      id: "persona_topics",
      label: "Personas, use cases, and topics",
      availability: tabs.personaTopics.availability,
      primaryQuestion: "Which personas, use cases, funnel stages, and topics are weak?"
    },
    {
      id: "prompts",
      label: "Prompts",
      availability: tabs.prompts.availability,
      primaryQuestion: "Which prompts create the visibility or ranking gaps?"
    },
    {
      id: "answers",
      label: "AI answers and ranking",
      availability: tabs.answers.availability,
      primaryQuestion: "What did AI actually answer and how was the brand treated?"
    },
    {
      id: "citations",
      label: "Sources and citations",
      availability: tabs.citations.availability,
      primaryQuestion: "Which URLs and domains are used as evidence?"
    },
    {
      id: "recommendations",
      label: "Recommendations and actions",
      availability: tabs.recommendations.availability,
      primaryQuestion: "What should be improved, created, or reviewed next?"
    }
  ];
}

function buildBrandRankingRows(context: BuildContext): ReportBrandRankingRow[] {
  const snapshotRows = context.input.brands
    .map((brand) => {
      const snapshot = context.metricSnapshotsByBrandId.get(brand.id);
      const summary = context.brandSummariesById.get(brand.id);
      if (!snapshot || !summary) return null;

      const availabilityValue = context.availability.prompt_type.status === "available" &&
        context.availability.measurement_purpose.status === "available"
        ? availability("available", "Brand metric snapshot is available.")
        : availability(
          "partial",
          "Brand metric snapshot is available, but prompt_type or measurement_purpose cannot be verified here.",
          "scope_unverified"
        );

      return {
        brand: summary,
        aiPresenceRate: metricValue({
          key: `ai_presence_rate:${brand.id}`,
          label: "AI presence rate",
          value: round2(snapshot.ai_visibility),
          unit: "percent",
          basis: "metric_snapshots.ai_visibility",
          availability: availabilityValue
        }),
        shareOfVoice: metricValue({
          key: `share_of_voice:${brand.id}`,
          label: "Share of Voice",
          value: round2(snapshot.share_of_voice),
          unit: "percent",
          basis: "metric_snapshots.share_of_voice",
          availability: availabilityValue
        }),
        averagePosition: metricValue({
          key: `average_position:${brand.id}`,
          label: "Average position",
          value: snapshot.average_position === null ? null : round2(snapshot.average_position),
          unit: "rank",
          basis: "metric_snapshots.average_position",
          availability: snapshot.average_position === null
            ? context.availability.position_labels
            : availabilityValue
        }),
        mentionCount: snapshot.ai_mention_count,
        citationOccurrenceCount: snapshot.citation_count,
        basis: "metric_snapshot_sov" as const,
        availability: availabilityValue
      };
    })
    .filter(isNonNullable)
    .sort((left, right) =>
      toNumeric(right.shareOfVoice.value) - toNumeric(left.shareOfVoice.value) ||
      toNumeric(right.aiPresenceRate.value) - toNumeric(left.aiPresenceRate.value) ||
      left.brand.name.localeCompare(right.brand.name)
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));

  if (snapshotRows.length > 0) return snapshotRows;

  const eligibleConversationIds = context.eligibleConversationIdsByPurpose.get("visibility") ?? new Set<string>();
  if (eligibleConversationIds.size === 0) return [];

  const rows = context.input.brands.map((brand) => {
    const summary = context.brandSummariesById.get(brand.id);
    if (!summary) return null;
    const mentions = context.input.brandMentions.filter((mention) =>
      mention.brand_id === brand.id &&
      mention.mentioned &&
      eligibleConversationIds.has(mention.conversation_id)
    );
    const displayCount = unique(mentions.map((mention) => mention.conversation_id)).length;
    const positions = mentions.map((mention) => mention.position).filter(isFiniteNumber);
    const mentionCount = sum(mentions.map(getMentionCount));
    const citationOccurrenceCount = context.input.citations
      .filter((citation) => citation.brand_id === brand.id)
      .reduce((total, citation) => total + getCitationOccurrenceCount(citation), 0);
    const availabilityValue = availability("available", "Derived from explicitly eligible non-branded prompt observations.");

    return {
      rank: 0,
      brand: summary,
      aiPresenceRate: metricValue({
        key: `ai_presence_rate:${brand.id}`,
        label: "AI presence rate",
        value: percent(displayCount, eligibleConversationIds.size),
        unit: "percent",
        basis: "eligible non-branded prompt mentions",
        availability: availabilityValue
      }),
      shareOfVoice: metricValue({
        key: `share_of_voice:${brand.id}`,
        label: "Share of Voice",
        value: null,
        unit: "percent",
        basis: "share of voice requires brand-set denominator",
        availability: context.availability.measurement_purpose
      }),
      averagePosition: metricValue({
        key: `average_position:${brand.id}`,
        label: "Average position",
        value: positions.length > 0 ? round2(average(positions)) : null,
        unit: "rank",
        basis: "brand_mentions.position",
        availability: positions.length > 0 ? availabilityValue : context.availability.position_labels
      }),
      mentionCount,
      citationOccurrenceCount,
      basis: "eligible_prompt_mentions" as const,
      availability: availabilityValue
    };
  })
    .filter(isNonNullable)
    .sort((left, right) =>
      toNumeric(right.aiPresenceRate.value) - toNumeric(left.aiPresenceRate.value) ||
      left.brand.name.localeCompare(right.brand.name)
    );

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildAiPresenceRateMetric(context: BuildContext): ReportMetricValue {
  const snapshot = getPrimaryOrProjectSnapshot(context);
  if (snapshot) {
    return metricValue({
      key: "ai_presence_rate",
      label: "AI presence rate",
      value: round2(snapshot.ai_visibility),
      unit: "percent",
      basis: "metric_snapshots.ai_visibility",
      availability: snapshotScopeAvailability(context),
      caution: "Use only with matching prompt scope; branded prompts must not be mixed into visibility."
    });
  }

  const eligibleConversationIds = context.eligibleConversationIdsByPurpose.get("visibility") ?? new Set<string>();
  if (!context.primaryBrand || eligibleConversationIds.size === 0) {
    return metricValue({
      key: "ai_presence_rate",
      label: "AI presence rate",
      value: null,
      unit: "percent",
      basis: "non_branded visibility prompts",
      availability: context.availability.prompt_type
    });
  }

  const displayedConversationCount = unique(context.input.brandMentions
    .filter((mention) =>
      mention.brand_id === context.primaryBrand?.id &&
      mention.mentioned &&
      eligibleConversationIds.has(mention.conversation_id)
    )
    .map((mention) => mention.conversation_id)).length;

  return metricValue({
    key: "ai_presence_rate",
    label: "AI presence rate",
    value: percent(displayedConversationCount, eligibleConversationIds.size),
    unit: "percent",
    basis: "eligible non-branded prompt mentions",
    availability: availability("available", "Derived from explicitly eligible non-branded prompt observations.")
  });
}

function buildShareOfVoiceMetric(context: BuildContext): ReportMetricValue {
  const snapshot = getPrimaryOrProjectSnapshot(context);
  if (snapshot) {
    return metricValue({
      key: "share_of_voice",
      label: "Share of Voice",
      value: round2(snapshot.share_of_voice),
      unit: "percent",
      basis: "metric_snapshots.share_of_voice",
      availability: snapshotScopeAvailability(context),
      caution: "Share of Voice is an observed answer-share metric, not market share."
    });
  }

  return metricValue({
    key: "share_of_voice",
    label: "Share of Voice",
    value: null,
    unit: "percent",
    basis: "non_branded sov prompts",
    availability: context.availability.measurement_purpose
  });
}

function buildOverviewInsights(context: BuildContext): ReportInsight[] {
  const topicGapInsights = context.analysis.reportOverview.largeTopicGaps.slice(0, 3).map((gap) => ({
    id: `topic_gap:${gap.topicId ?? gap.topicName}`,
    kind: gap.competitiveGap < 0 ? "gap" as const : "win" as const,
    title: gap.competitiveGap < 0 ? `Topic gap: ${gap.topicName}` : `Topic advantage: ${gap.topicName}`,
    summary: `Primary brand ${gap.primaryBrandDisplayRate}% vs competitor ${gap.topCompetitorDisplayRate}%.`,
    evidence: [gap.source, gap.evidenceLabel],
    availability: availability("available", "Topic gap insight is derived from report observations.")
  }));
  const sourceInsights = context.analysis.reportOverview.weakOwnedSourceCategories.slice(0, 2).map((source) => ({
    id: `weak_source:${source.sourceType}`,
    kind: "opportunity" as const,
    title: `Weak owned source category: ${source.sourceType}`,
    summary: `Owned occurrence share is ${source.ownedShare}% across ${source.occurrenceCount} occurrences.`,
    evidence: [source.evidenceLabel],
    availability: context.availability.source_owner_type
  }));
  const reviewInsight = context.analysis.reportOverview.preQualityGateCandidateCount > 0
    ? [{
      id: "recommendations:pre_quality_gate",
      kind: "risk" as const,
      title: "Recommendation candidates need review",
      summary: `${context.analysis.reportOverview.preQualityGateCandidateCount} candidates are not approved actions.`,
      evidence: ["recommendationQualityGate.summary"],
      availability: context.availability.review_workflow
    }]
    : [];

  return [...topicGapInsights, ...sourceInsights, ...reviewInsight];
}

function buildNextActions(context: BuildContext): ReportActionSummary[] {
  return context.input.recommendations.slice(0, 5).map((recommendation) => ({
    id: recommendation.id,
    title: recommendation.title,
    priority: recommendation.priority,
    targetUrl: recommendation.target_url,
    relatedPromptId: recommendation.related_prompt_id,
    relatedTopicId: recommendation.related_topic_id,
    evidence: [
      recommendation.reason ?? "recommendation_candidate",
      `impact_score:${recommendation.impact_score}`
    ],
    availability: availability(
      "partial",
      "Recommendation candidate is available, but it is not treated as an approved action.",
      "not_customer_visible"
    )
  }));
}

function buildWarnings(availabilityMap: ReportAvailabilityMap): ReportWarningSummary[] {
  return Object.entries(availabilityMap)
    .filter(([, item]) => item.status !== "available")
    .map(([code, item]) => ({
      code,
      severity: item.status === "unavailable" ? "blocking" : item.status === "future" ? "info" : "warning",
      message: item.message,
      availability: item
    }));
}

function createComparisonRow(row: ReportBrandRankingRow, primary: ReportBrandRankingRow | null): ReportComparisonRow {
  return {
    brand: row.brand,
    primaryBrandName: primary?.brand.name ?? null,
    aiPresenceGap: gapMetric("ai_presence_gap", primary?.aiPresenceRate ?? null, row.aiPresenceRate),
    sovGap: gapMetric("sov_gap", primary?.shareOfVoice ?? null, row.shareOfVoice),
    averagePositionGap: gapMetric("average_position_gap", primary?.averagePosition ?? null, row.averagePosition),
    coMentionedCompetitors: [],
    availability: mergeAvailability([row.availability, primary?.availability].filter(isNonNullable), "Comparison row is available.")
  };
}

function buildSegmentRows(
  context: BuildContext,
  kind: ReportSegmentPerformanceRow["kind"],
  baseAvailability: ReportDataAvailability,
  getSegment: (context: BuildContext, prompt: RecoraPromptRow) => { id: string; label: string } | null
): ReportUnavailableOr<ReportSegmentPerformanceRow[]> {
  if (baseAvailability.status === "needs_metadata" || baseAvailability.status === "unavailable") {
    return unavailableOr<ReportSegmentPerformanceRow[]>(null, baseAvailability);
  }

  const promptsBySegment = new Map<string, { id: string; label: string; prompts: RecoraPromptRow[] }>();
  for (const prompt of context.input.prompts) {
    const segment = getSegment(context, prompt);
    if (!segment) continue;
    const current = promptsBySegment.get(segment.id) ?? { ...segment, prompts: [] };
    current.prompts.push(prompt);
    promptsBySegment.set(segment.id, current);
  }

  const rows = Array.from(promptsBySegment.values()).map((segment) => {
    const promptIds = new Set(segment.prompts.map((prompt) => prompt.id));
    const conversations = conversationsForPromptIds(context, promptIds);
    const aiPresenceRate = segmentMetric(context, segment.id, "ai_presence_rate", conversations);
    const shareOfVoice = metricValue({
      key: `segment_sov:${segment.id}`,
      label: "Share of Voice",
      value: null,
      unit: "percent",
      basis: "requires explicit SOV measurement_purpose",
      availability: context.availability.measurement_purpose
    });

    return {
      id: segment.id,
      label: segment.label,
      kind,
      promptCount: segment.prompts.length,
      observationCount: conversations.length,
      aiPresenceRate,
      shareOfVoice,
      topCompetitorName: null,
      competitiveGap: metricValue({
        key: `segment_gap:${segment.id}`,
        label: "Competitive gap",
        value: null,
        unit: "percent",
        basis: "requires explicit competitor comparison scope",
        availability: context.availability.prompt_type
      }),
      availability: baseAvailability
    };
  }).sort((left, right) =>
    right.observationCount - left.observationCount ||
    left.label.localeCompare(right.label)
  );

  return unavailableOr(rows, rows.length > 0 ? baseAvailability : availability("unavailable", "No segment rows could be built.", "empty_result"));
}

function buildPersonaTopicHeatmap(context: BuildContext): ReportPersonaTopicHeatmapRow[] {
  if (context.availability.persona_metadata.status === "needs_metadata" || context.availability.topic_metadata.status === "needs_metadata") {
    return [];
  }

  const groups = new Map<string, { persona: RecoraPersonaRow; topic: RecoraTopicRow; promptIds: Set<string> }>();
  for (const prompt of context.input.prompts) {
    if (!prompt.persona_id) continue;
    const persona = context.personaById.get(prompt.persona_id);
    const topic = context.topicById.get(prompt.topic_id);
    if (!persona || !topic) continue;
    const key = `${persona.id}:${topic.id}`;
    const current = groups.get(key) ?? { persona, topic, promptIds: new Set<string>() };
    current.promptIds.add(prompt.id);
    groups.set(key, current);
  }

  return Array.from(groups.values()).map((group) => {
    const conversations = conversationsForPromptIds(context, group.promptIds);
    return {
      personaId: group.persona.id,
      personaName: group.persona.name,
      topicId: group.topic.id,
      topicName: group.topic.name,
      promptCount: group.promptIds.size,
      observationCount: conversations.length,
      aiPresenceRate: segmentMetric(context, `${group.persona.id}:${group.topic.id}`, "persona_topic_ai_presence", conversations),
      availability: mergeAvailability(
        [context.availability.persona_metadata, context.availability.topic_metadata],
        "Persona x topic metadata is available."
      )
    };
  });
}

function buildPromptRow(context: BuildContext, prompt: RecoraPromptRow): ReportPromptRow {
  const promptConversations = conversationsForPromptIds(context, new Set([prompt.id]));
  const conversationIds = new Set(promptConversations.map((conversation) => conversation.id));
  const targetMentions = context.primaryBrand
    ? context.input.brandMentions.filter((mention) =>
      mention.brand_id === context.primaryBrand?.id &&
      mention.mentioned &&
      conversationIds.has(mention.conversation_id)
    )
    : [];
  const competitorMentions = context.input.brandMentions.filter((mention) => {
    const brand = context.brandSummariesById.get(mention.brand_id);
    return brand?.brandType === "competitor" && mention.mentioned && conversationIds.has(mention.conversation_id);
  });
  const promptCitations = context.input.citations.filter((citation) => conversationIds.has(citation.conversation_id));
  const promptType = getPromptType(prompt);
  const measurementPurpose = getMeasurementPurpose(prompt);
  const eligibility = getPromptMetricEligibility(promptType.value, measurementPurpose.value, promptType.availability);

  return {
    promptId: prompt.id,
    promptText: prompt.text,
    topicId: prompt.topic_id,
    topicName: context.topicById.get(prompt.topic_id)?.name ?? null,
    personaId: prompt.persona_id,
    personaName: prompt.persona_id ? context.personaById.get(prompt.persona_id)?.name ?? null : null,
    useCase: promptMetadataValue(prompt, "use_case", context.availability.use_case_metadata),
    funnelStage: promptFunnelStageValue(prompt, context.availability.funnel_stage_metadata),
    category: promptMetadataValue(prompt, "category", context.availability.category_metadata),
    promptType,
    measurementPurpose,
    metricEligibility: eligibility,
    answerCount: promptConversations.length,
    targetBrandMentionedCount: unique(targetMentions.map((mention) => mention.conversation_id)).length,
    competitorMentionedCount: unique(competitorMentions.map((mention) => mention.conversation_id)).length,
    citationOccurrenceCount: sum(promptCitations.map(getCitationOccurrenceCount)),
    aiPresenceRate: metricValue({
      key: `prompt_ai_presence:${prompt.id}`,
      label: "AI presence rate",
      value: eligibility.visibility ? percent(unique(targetMentions.map((mention) => mention.conversation_id)).length, promptConversations.length) : null,
      unit: "percent",
      basis: "prompt-level brand mentions",
      availability: eligibility.visibility ? availability("available", "Prompt is eligible for visibility metrics.") : promptType.availability
    }),
    shareOfVoice: metricValue({
      key: `prompt_sov:${prompt.id}`,
      label: "Share of Voice",
      value: null,
      unit: "percent",
      basis: "prompt-level SOV requires explicit brand set denominator",
      availability: eligibility.shareOfVoice ? context.availability.measurement_purpose : measurementPurpose.availability
    }),
    averagePosition: metricValue({
      key: `prompt_average_position:${prompt.id}`,
      label: "Average position",
      value: targetMentions.length > 0
        ? round2(average(targetMentions.map((mention) => mention.position).filter(isFiniteNumber)))
        : null,
      unit: "rank",
      basis: "brand_mentions.position",
      availability: targetMentions.some((mention) => typeof mention.position === "number")
        ? availability("available", "Position labels are available for this prompt.")
        : context.availability.position_labels
    }),
    status: promptType.availability.status === "available" && measurementPurpose.availability.status === "available"
      ? "ready_for_metrics"
      : "needs_metadata",
    availability: mergeAvailability([promptType.availability, measurementPurpose.availability], "Prompt metadata is available.")
  };
}

function buildAnswerRow(context: BuildContext, conversation: RecoraAiConversationRow): ReportAnswerRow {
  const runItem = context.runItemById.get(conversation.run_item_id) ?? null;
  const prompt = runItem ? context.promptById.get(runItem.prompt_id) ?? null : null;
  const model = runItem ? context.modelById.get(runItem.model_id) ?? null : null;
  const mentions = context.mentionsByConversationId.get(conversation.id) ?? [];
  const citations = context.citationsByConversationId.get(conversation.id) ?? [];
  const targetMention = context.primaryBrand
    ? mentions.find((mention) => mention.brand_id === context.primaryBrand?.id && mention.mentioned) ?? null
    : null;
  const competitors = mentions
    .filter((mention) => mention.mentioned && context.brandSummariesById.get(mention.brand_id)?.brandType === "competitor")
    .map((mention) => ({
      brandId: mention.brand_id,
      name: context.brandSummariesById.get(mention.brand_id)?.name ?? mention.brand_id,
      position: mention.position
    }))
    .sort((left, right) =>
      (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER) ||
      left.name.localeCompare(right.name)
    );

  return {
    conversationId: conversation.id,
    runItemId: runItem?.id ?? null,
    promptId: prompt?.id ?? null,
    promptText: prompt?.text ?? conversation.prompt_text_snapshot ?? null,
    modelLabel: model?.display_name ?? conversation.model_returned ?? conversation.model_requested ?? conversation.model_snapshot ?? null,
    answerExcerpt: excerpt(conversation.answer_summary ?? conversation.raw_answer),
    targetBrandMentioned: Boolean(targetMention),
    targetBrandPosition: unavailableOr(
      targetMention ? toAnswerPosition(targetMention.position) : "missing",
      targetMention && typeof targetMention.position === "number"
        ? availability("available", "Target brand position is available.")
        : context.availability.position_labels
    ),
    targetBrandSentiment: unavailableOr(
      targetMention ? toSentimentLabel(targetMention.sentiment) : "unknown",
      targetMention && targetMention.sentiment !== "unclear"
        ? availability("available", "Target brand sentiment label is available.")
        : context.availability.sentiment_labels
    ),
    targetEvidenceSnippet: targetMention?.evidence_snippet ?? targetMention?.mention_text ?? null,
    mentionedCompetitors: competitors,
    citationOccurrenceCount: sum(citations.map(getCitationOccurrenceCount)),
    citationDomains: unique(citations.map((citation) => citation.domain)),
    narrative: unavailableOr<string>(null, context.availability.narrative_labels),
    caveat: unavailableOr<string>(null, context.availability.caveat_labels),
    availability: availability("available", "AI answer row is available.")
  };
}

function buildCitationUrlRow(context: BuildContext, citationId: string): ReportCitationUrlRow {
  const citation = context.input.citations.find((item) => item.id === citationId);
  if (!citation) {
    return {
      citationId,
      conversationId: "",
      url: null,
      canonicalUrl: null,
      domain: "",
      title: null,
      ownerType: unavailableOr<ReportCitationOwnerType>(null, context.availability.source_owner_type),
      sourceType: "unknown",
      occurrenceCount: 0,
      brandRelated: "unknown",
      sourceFreshness: unavailableOr<RecoraSourceFreshnessReadModel>(null, context.availability.source_freshness),
      sourceToClaim: unavailableOr<RecoraSourceToClaimReadModel>(null, availability("unavailable", "Citation row is missing.", "missing_input")),
      promptId: null,
      promptText: null,
      availability: availability("unavailable", "Citation row is missing.", "missing_input")
    };
  }

  const conversation = context.conversationById.get(citation.conversation_id) ?? null;
  const runItem = conversation ? context.runItemById.get(conversation.run_item_id) ?? null : null;
  const prompt = runItem ? context.promptById.get(runItem.prompt_id) ?? null : null;
  const sourceDomain = citation.source_domain_id ? context.sourceDomainById.get(citation.source_domain_id) ?? null : null;
  const ownerType = getCitationOwnerType(context, citation, sourceDomain);
  const sourceFreshness = {
    status: citation.source_freshness_status,
    retrievedAt: citation.source_retrieved_at,
    publishedAt: citation.source_published_at,
    lastModifiedAt: citation.source_last_modified_at,
    ageDays: citation.source_freshness_days,
    needsVerification: citation.source_freshness_status === "unknown" || citation.source_freshness_status === "not_checked"
  };
  const sourceToClaim = {
    status: citation.source_to_claim_status,
    claimText: citation.claim_text ?? citation.cited_text,
    note: citation.source_to_claim_note,
    needsReviewBeforePublication: citation.source_to_claim_status === "unknown" || citation.source_to_claim_status === "not_reviewed"
  };

  return {
    citationId: citation.id,
    conversationId: citation.conversation_id,
    url: citation.url,
    canonicalUrl: citation.canonical_url,
    domain: citation.domain,
    title: citation.title,
    ownerType,
    sourceType: citation.source_type,
    occurrenceCount: getCitationOccurrenceCount(citation),
    brandRelated: citation.brand_related,
    sourceFreshness: unavailableOr(
      sourceFreshness,
      sourceFreshness.needsVerification ? context.availability.source_freshness : availability("available", "Source freshness is available.")
    ),
    sourceToClaim: unavailableOr(
      sourceToClaim,
      sourceToClaim.needsReviewBeforePublication
        ? availability("partial", "Source-to-claim needs review before publication.", "new_extraction_required")
        : availability("available", "Source-to-claim status is available.")
    ),
    promptId: prompt?.id ?? null,
    promptText: prompt?.text ?? conversation?.prompt_text_snapshot ?? null,
    availability: availability("available", "Citation URL row is available.")
  };
}

function buildRecommendationRow(
  recommendation: RecoraRecommendationRow,
  gate: RecoraRecommendationGateRow | null
): ReportRecommendationRow {
  return {
    recommendationId: recommendation.id,
    candidateId: gate?.candidateId ?? getMetadataString(getMetadataRecord(recommendation.metadata), "candidate_id") ?? recommendation.id,
    title: recommendation.title,
    type: recommendation.type,
    priority: recommendation.priority,
    impactScore: toNumberOrNull(recommendation.impact_score),
    effortScore: toNumberOrNull(recommendation.effort_score),
    targetUrl: recommendation.target_url,
    relatedPromptId: recommendation.related_prompt_id,
    relatedTopicId: recommendation.related_topic_id,
    publicationState: gate?.publicationState ?? null,
    qualityGateStage: gate?.stage ?? null,
    qualityGateDecision: gate?.decision ?? null,
    reviewStatus: unavailableOr(
      gate?.publicationState ?? null,
      futureAvailability("Customer-facing review status persistence is not implemented in this read model.")
    ),
    evidence: [
      recommendation.reason,
      gate?.blockingReason,
      gate?.evidenceLabel
    ].filter(isNonEmptyString),
    availability: gate?.stage === "reviewed"
      ? availability("partial", "Reviewed recommendation candidate is available; publication workflow is separate.", "partial_metadata")
      : availability("partial", "Recommendation candidate requires quality gate or human review.", "not_customer_visible")
  };
}

function buildMetricSnapshotsByBrandId(metricSnapshots: RecoraMetricSnapshotRow[]) {
  const rows = new Map<string, RecoraMetricSnapshotRow>();
  for (const snapshot of metricSnapshots) {
    if (snapshot.scope_type !== "brand" || !snapshot.brand_id) continue;
    const current = rows.get(snapshot.brand_id);
    if (!current || snapshot.created_at > current.created_at) rows.set(snapshot.brand_id, snapshot);
  }
  return rows;
}

function buildEligibleConversationIdsByPurpose(input: NormalizedInput) {
  const runItemById = new Map(input.runItems.map((item) => [item.id, item]));
  const promptById = new Map(input.prompts.map((prompt) => [prompt.id, prompt]));
  const result = new Map<ReportMeasurementPurpose, Set<string>>();

  for (const purpose of KNOWN_MEASUREMENT_PURPOSES) {
    result.set(purpose, new Set<string>());
  }

  for (const conversation of input.conversations) {
    const runItem = runItemById.get(conversation.run_item_id);
    const prompt = runItem ? promptById.get(runItem.prompt_id) : null;
    if (!prompt) continue;
    const promptType = getPromptType(prompt).value;
    const purpose = getMeasurementPurpose(prompt).value;
    if (!promptType || !purpose) continue;
    if (!isMarketMetricEligiblePrompt(promptType, purpose)) continue;
    const bucket = result.get(purpose) ?? new Set<string>();
    bucket.add(conversation.id);
    result.set(purpose, bucket);

    if (purpose === "visibility" || purpose === "ranking") {
      const visibilityBucket = result.get("visibility") ?? new Set<string>();
      visibilityBucket.add(conversation.id);
      result.set("visibility", visibilityBucket);
    }
    if (purpose === "sov") {
      const sovBucket = result.get("sov") ?? new Set<string>();
      sovBucket.add(conversation.id);
      result.set("sov", sovBucket);
    }
  }

  return result;
}

function createBrandSummary(brand: RecoraBrandRow): ReportBrandSummary {
  return {
    brandId: brand.id,
    name: brand.name,
    brandType: brand.brand_type,
    domain: brand.domain,
    category: brand.category,
    aliases: getStringArray(brand.aliases),
    isPrimary: brand.brand_type === "primary"
  };
}

function getPrimaryOrProjectSnapshot(context: BuildContext) {
  if (context.primaryBrand) {
    const primarySnapshot = context.metricSnapshotsByBrandId.get(context.primaryBrand.id);
    if (primarySnapshot) return primarySnapshot;
  }

  return context.input.metricSnapshots.find((snapshot) => snapshot.scope_type === "project") ?? null;
}

function snapshotScopeAvailability(context: BuildContext) {
  if (context.availability.prompt_type.status === "available" && context.availability.measurement_purpose.status === "available") {
    return availability("available", "Metric snapshot is available with prompt metadata present.");
  }

  return availability(
    "partial",
    "Metric snapshot is available, but prompt_type or measurement_purpose cannot be verified in this read model.",
    "scope_unverified"
  );
}

function getPromptType(prompt: RecoraPromptRow): ReportUnavailableOr<ReportPromptType> {
  const value = getPromptMetadataString(prompt, "prompt_type");
  if (value && isReportPromptType(value)) {
    return unavailableOr(value, availability("available", "Prompt type metadata is available."));
  }
  if (value) {
    return unavailableOr("unknown", availability("partial", `Unknown prompt_type value: ${value}`, "partial_metadata"));
  }
  return unavailableOr<ReportPromptType>(null, availability("needs_metadata", "prompt_type is missing.", "missing_metadata"));
}

function getMeasurementPurpose(prompt: RecoraPromptRow): ReportUnavailableOr<ReportMeasurementPurpose> {
  const value = getPromptMetadataString(prompt, "measurement_purpose");
  if (value && isReportMeasurementPurpose(value)) {
    return unavailableOr(value, availability("available", "Measurement purpose metadata is available."));
  }
  if (value) {
    return unavailableOr("unknown", availability("partial", `Unknown measurement_purpose value: ${value}`, "partial_metadata"));
  }
  return unavailableOr<ReportMeasurementPurpose>(null, availability("needs_metadata", "measurement_purpose is missing.", "missing_metadata"));
}

function getPromptMetricEligibility(
  promptType: ReportPromptType | null,
  measurementPurpose: ReportMeasurementPurpose | null,
  baseAvailability: ReportDataAvailability
): ReportPromptMetricEligibility {
  const marketEligible = Boolean(promptType && measurementPurpose && isMarketMetricEligiblePrompt(promptType, measurementPurpose));
  const sentimentEligible = Boolean(promptType === "branded" && (measurementPurpose === "sentiment" || measurementPurpose === "brand_perception"));
  const citationEligible = measurementPurpose === "citation_validation" || promptType === "citation_check";

  return {
    visibility: marketEligible && (measurementPurpose === "visibility" || measurementPurpose === "ranking"),
    ranking: marketEligible && (measurementPurpose === "ranking" || measurementPurpose === "visibility"),
    shareOfVoice: marketEligible && measurementPurpose === "sov",
    sentiment: sentimentEligible,
    citation: citationEligible,
    availability: baseAvailability
  };
}

function isMarketMetricEligiblePrompt(promptType: ReportPromptType, measurementPurpose: ReportMeasurementPurpose) {
  if (promptType !== "non_branded" && promptType !== "comparison_generic") return false;
  return measurementPurpose === "visibility" || measurementPurpose === "ranking" || measurementPurpose === "sov";
}

function promptMetadataValue(
  prompt: RecoraPromptRow,
  key: string,
  fallbackAvailability: ReportDataAvailability
): ReportUnavailableOr<string> {
  const value = getPromptMetadataString(prompt, key);
  return unavailableOr(value, value ? availability("available", `${key} metadata is available.`) : fallbackAvailability);
}

function promptFunnelStageValue(prompt: RecoraPromptRow, fallbackAvailability: ReportDataAvailability): ReportUnavailableOr<string> {
  const explicit = getPromptMetadataString(prompt, "funnel_stage");
  if (explicit) return unavailableOr(explicit, availability("available", "funnel_stage metadata is available."));
  if (prompt.buyer_stage) {
    return unavailableOr(
      prompt.buyer_stage,
      availability("partial", "Using existing buyer_stage as a partial funnel-stage field.", "partial_metadata")
    );
  }
  return unavailableOr<string>(null, fallbackAvailability);
}

function getPromptPersonaKey(context: BuildContext, prompt: RecoraPromptRow) {
  if (!prompt.persona_id) return null;
  const persona = context.personaById.get(prompt.persona_id);
  return persona ? { id: persona.id, label: persona.name } : null;
}

function getPromptUseCaseKey(_context: BuildContext, prompt: RecoraPromptRow) {
  const value = getPromptMetadataString(prompt, "use_case");
  return value ? { id: value, label: value } : null;
}

function getPromptFunnelStageKey(_context: BuildContext, prompt: RecoraPromptRow) {
  const value = getPromptMetadataString(prompt, "funnel_stage") ?? prompt.buyer_stage;
  return value ? { id: value, label: value } : null;
}

function getPromptTopicKey(context: BuildContext, prompt: RecoraPromptRow) {
  const topic = context.topicById.get(prompt.topic_id);
  return topic ? { id: topic.id, label: topic.name } : null;
}

function getPromptCategoryKey(_context: BuildContext, prompt: RecoraPromptRow) {
  const value = getPromptMetadataString(prompt, "category");
  return value ? { id: value, label: value } : null;
}

function conversationsForPromptIds(context: BuildContext, promptIds: Set<string>) {
  return context.input.conversations.filter((conversation) => {
    const runItem = context.runItemById.get(conversation.run_item_id);
    return Boolean(runItem && promptIds.has(runItem.prompt_id));
  });
}

function segmentMetric(
  context: BuildContext,
  keyPart: string,
  metricKey: string,
  conversations: RecoraAiConversationRow[]
): ReportMetricValue {
  if (!context.primaryBrand) {
    return metricValue({
      key: `${metricKey}:${keyPart}`,
      label: "AI presence rate",
      value: null,
      unit: "percent",
      basis: "missing primary brand",
      availability: availability("unavailable", "Primary brand is missing.", "missing_input")
    });
  }

  if (context.availability.prompt_type.status !== "available" || context.availability.measurement_purpose.status !== "available") {
    return metricValue({
      key: `${metricKey}:${keyPart}`,
      label: "AI presence rate",
      value: null,
      unit: "percent",
      basis: "requires prompt_type and measurement_purpose",
      availability: mergeAvailability(
        [context.availability.prompt_type, context.availability.measurement_purpose],
        "Prompt scope metadata is available."
      )
    });
  }

  const conversationIds = new Set(conversations.map((conversation) => conversation.id));
  const displayCount = unique(context.input.brandMentions
    .filter((mention) =>
      mention.brand_id === context.primaryBrand?.id &&
      mention.mentioned &&
      conversationIds.has(mention.conversation_id)
    )
    .map((mention) => mention.conversation_id)).length;

  return metricValue({
    key: `${metricKey}:${keyPart}`,
    label: "AI presence rate",
    value: percent(displayCount, conversations.length),
    unit: "percent",
    basis: "segment prompt mentions",
    availability: availability("available", "Segment metric is derived from eligible prompt observations.")
  });
}

function getDomainOwnerType(context: BuildContext, citations: RecoraCitationRow[]): ReportUnavailableOr<ReportCitationOwnerType> {
  const types = citations.map((citation) => {
    const sourceDomain = citation.source_domain_id ? context.sourceDomainById.get(citation.source_domain_id) ?? null : null;
    return getCitationOwnerType(context, citation, sourceDomain).value;
  }).filter(isNonNullable);
  const value = types.find((type) => type !== "unknown") ?? "unknown";
  return unavailableOr(value, context.availability.source_owner_type);
}

function getCitationOwnerType(
  context: BuildContext,
  citation: RecoraCitationRow,
  sourceDomain: RecoraSourceDomainRow | null
): ReportUnavailableOr<ReportCitationOwnerType> {
  const explicitOwnerType = getRecordString(citation, "owner_type") ?? (sourceDomain ? getRecordString(sourceDomain, "owner_type") : null);
  if (explicitOwnerType && isOwnerType(explicitOwnerType)) {
    return unavailableOr(explicitOwnerType, availability("available", "source owner_type is available."));
  }

  if (sourceDomain?.owner_brand_id) {
    const ownerBrand = context.brandSummariesById.get(sourceDomain.owner_brand_id);
    if (ownerBrand?.brandType === "primary") {
      return unavailableOr("owned", availability("partial", "Derived from source_domains.owner_brand_id.", "partial_metadata"));
    }
    if (ownerBrand?.brandType === "competitor") {
      return unavailableOr("competitor", availability("partial", "Derived from source_domains.owner_brand_id.", "partial_metadata"));
    }
  }

  if (citation.source_type === "owned") {
    return unavailableOr("owned", availability("partial", "Derived from citations.source_type.", "partial_metadata"));
  }
  if (citation.source_type === "competitor") {
    return unavailableOr("competitor", availability("partial", "Derived from citations.source_type.", "partial_metadata"));
  }
  if (citation.source_type === "media" || citation.source_type === "review" || citation.source_type === "technical") {
    return unavailableOr("third_party", availability("partial", "Derived from citations.source_type.", "partial_metadata"));
  }

  return unavailableOr("unknown", context.availability.source_owner_type);
}

function getDomainFreshness(citations: RecoraCitationRow[]): ReportUnavailableOr<RecoraSourceFreshnessReadModel["status"]> {
  if (citations.length === 0) {
    return unavailableOr<RecoraSourceFreshnessReadModel["status"]>(
      null,
      availability("unavailable", "No citations are available for this domain.", "empty_result")
    );
  }

  const statuses = citations.map((citation) => citation.source_freshness_status);
  const known = statuses.filter((status) => status !== "unknown" && status !== "not_checked");
  if (known.length > 0) {
    return unavailableOr(known[0], known.length === statuses.length
      ? availability("available", "Source freshness is available for this domain.")
      : availability("partial", "Some source freshness values need extraction.", "new_extraction_required"));
  }

  return unavailableOr("not_checked", availability("needs_extraction", "Source freshness needs extraction.", "new_extraction_required"));
}

function countAvailability(count: number, message: string): ReportDataAvailability {
  return count > 0
    ? availability("available", message, undefined, count, count)
    : availability("unavailable", "No rows are available.", "empty_result", 0, 0);
}

function promptMetadataAvailability(
  prompts: RecoraPromptRow[],
  key: string,
  availableMessage: string
): ReportDataAvailability {
  if (prompts.length === 0) {
    return availability("unavailable", "No prompts are available.", "missing_input", 0, 0);
  }
  const availableCount = prompts.filter((prompt) => Boolean(getPromptMetadataString(prompt, key))).length;
  if (availableCount === prompts.length) return availability("available", availableMessage, undefined, availableCount, prompts.length);
  if (availableCount > 0) {
    return availability(
      "partial",
      `${key} metadata is available for ${availableCount}/${prompts.length} prompts.`,
      "partial_metadata",
      availableCount,
      prompts.length
    );
  }
  return availability("needs_metadata", `${key} metadata is missing.`, "missing_metadata", 0, prompts.length);
}

function relationAvailability<T extends { id: string }>(
  prompts: RecoraPromptRow[],
  rows: T[],
  getId: (prompt: RecoraPromptRow) => string | null,
  availableMessage: string,
  missingMessage: string
): ReportDataAvailability {
  if (prompts.length === 0) {
    return availability("unavailable", "No prompts are available.", "missing_input", 0, 0);
  }
  const rowIds = new Set(rows.map((row) => row.id));
  const promptIds = prompts.map(getId).filter(isNonEmptyString);
  const availableCount = promptIds.filter((id) => rowIds.has(id)).length;
  if (availableCount === prompts.length) return availability("available", availableMessage, undefined, availableCount, prompts.length);
  if (availableCount > 0) return availability("partial", missingMessage, "partial_metadata", availableCount, prompts.length);
  return availability("needs_metadata", missingMessage, "missing_metadata", 0, prompts.length);
}

function funnelStageAvailability(prompts: RecoraPromptRow[]): ReportDataAvailability {
  if (prompts.length === 0) {
    return availability("unavailable", "No prompts are available.", "missing_input", 0, 0);
  }
  const explicitCount = prompts.filter((prompt) => Boolean(getPromptMetadataString(prompt, "funnel_stage"))).length;
  if (explicitCount === prompts.length) {
    return availability("available", "funnel_stage metadata is available.", undefined, explicitCount, prompts.length);
  }
  const buyerStageCount = prompts.filter((prompt) => Boolean(prompt.buyer_stage)).length;
  if (buyerStageCount > 0) {
    return availability(
      "partial",
      "Using buyer_stage as a partial funnel-stage field; explicit funnel_stage metadata is still needed.",
      "partial_metadata",
      buyerStageCount,
      prompts.length
    );
  }
  return availability("needs_metadata", "funnel_stage metadata is missing.", "missing_metadata", 0, prompts.length);
}

function sentimentAvailability(mentions: RecoraBrandMentionRow[]): ReportDataAvailability {
  const mentionedRows = mentions.filter((mention) => mention.mentioned);
  if (mentionedRows.length === 0) {
    return availability("needs_extraction", "No brand mention sentiment rows are available.", "new_extraction_required", 0, 0);
  }
  const availableCount = mentionedRows.filter((mention) => mention.sentiment !== "unclear").length;
  if (availableCount === mentionedRows.length) {
    return availability("available", "Sentiment labels are available.", undefined, availableCount, mentionedRows.length);
  }
  if (availableCount > 0) {
    return availability("partial", "Some sentiment labels are unclear.", "new_extraction_required", availableCount, mentionedRows.length);
  }
  return availability("needs_extraction", "Sentiment labels need extraction.", "new_extraction_required", 0, mentionedRows.length);
}

function extractionAvailability(
  mentions: RecoraBrandMentionRow[],
  key: string,
  missingMessage: string
): ReportDataAvailability {
  const mentionedRows = mentions.filter((mention) => mention.mentioned);
  if (mentionedRows.length === 0) {
    return availability("needs_extraction", missingMessage, "new_extraction_required", 0, 0);
  }
  const availableCount = mentionedRows.filter((mention) => Boolean(getRecordString(mention, key))).length;
  if (availableCount === mentionedRows.length) {
    return availability("available", `${key} is available.`, undefined, availableCount, mentionedRows.length);
  }
  if (availableCount > 0) {
    return availability("partial", `${key} is partially available.`, "new_extraction_required", availableCount, mentionedRows.length);
  }
  return availability("needs_extraction", missingMessage, "new_extraction_required", 0, mentionedRows.length);
}

function positionAvailability(mentions: RecoraBrandMentionRow[]): ReportDataAvailability {
  const mentionedRows = mentions.filter((mention) => mention.mentioned);
  if (mentionedRows.length === 0) {
    return availability("needs_extraction", "No brand mention position rows are available.", "new_extraction_required", 0, 0);
  }
  const availableCount = mentionedRows.filter((mention) => typeof mention.position === "number").length;
  if (availableCount === mentionedRows.length) {
    return availability("available", "Position labels are available.", undefined, availableCount, mentionedRows.length);
  }
  if (availableCount > 0) {
    return availability("partial", "Some position labels need extraction.", "new_extraction_required", availableCount, mentionedRows.length);
  }
  return availability("needs_extraction", "Position labels need extraction.", "new_extraction_required", 0, mentionedRows.length);
}

function sourceOwnerTypeAvailability(
  citations: RecoraCitationRow[],
  sourceDomains: RecoraSourceDomainRow[]
): ReportDataAvailability {
  if (citations.length === 0) {
    return availability("unavailable", "No citation rows are available.", "missing_input", 0, 0);
  }
  const explicitCount = citations.filter((citation) => Boolean(getRecordString(citation, "owner_type"))).length;
  if (explicitCount === citations.length) {
    return availability("available", "source owner_type is available.", undefined, explicitCount, citations.length);
  }
  const partialCount =
    sourceDomains.filter((domain) => Boolean(domain.owner_brand_id)).length +
    citations.filter((citation) => citation.source_type === "owned" || citation.source_type === "competitor").length;
  if (partialCount > 0) {
    return availability(
      "needs_metadata",
      "First-class source owner_type metadata is missing; existing source_type or owner_brand_id can only support partial row labels.",
      "missing_metadata",
      0,
      citations.length
    );
  }
  return availability("needs_metadata", "source owner_type metadata is missing.", "missing_metadata", 0, citations.length);
}

function sourceFreshnessAvailability(citations: RecoraCitationRow[]): ReportDataAvailability {
  if (citations.length === 0) {
    return availability("unavailable", "No citation rows are available.", "missing_input", 0, 0);
  }
  const availableCount = citations.filter((citation) =>
    citation.source_freshness_status !== "unknown" && citation.source_freshness_status !== "not_checked"
  ).length;
  if (availableCount === citations.length) {
    return availability("available", "Source freshness is available.", undefined, availableCount, citations.length);
  }
  if (availableCount > 0) {
    return availability("partial", "Some source freshness values need extraction.", "new_extraction_required", availableCount, citations.length);
  }
  return availability("needs_extraction", "Source freshness needs extraction.", "new_extraction_required", 0, citations.length);
}

function futureAvailability(message: string): ReportDataAvailability {
  return availability("future", message, "future_integration");
}

function availability(
  status: ReportDataStatus,
  message: string,
  reason?: ReportUnavailableReason,
  availableCount?: number,
  totalCount?: number
): ReportDataAvailability {
  return {
    status,
    reason,
    message,
    availableCount,
    totalCount
  };
}

function unavailableOr<T>(value: T | null, availabilityValue: ReportDataAvailability): ReportUnavailableOr<T> {
  return {
    value,
    availability: availabilityValue
  };
}

function filterUnavailableRows<T>(rows: T[], availabilityValue: ReportDataAvailability): ReportUnavailableOr<T[]> {
  if (availabilityValue.status === "available" || availabilityValue.status === "partial") {
    return unavailableOr(rows, rows.length > 0 ? availability("available", "Rows are available.") : availability("available", "No matching rows found."));
  }
  return unavailableOr<T[]>(null, availabilityValue);
}

function mergeAvailability(items: ReportDataAvailability[], availableMessage: string): ReportDataAvailability {
  if (items.length === 0) return availability("unavailable", "No availability inputs were provided.", "missing_input");
  const statuses = items.map((item) => item.status);
  if (statuses.every((status) => status === "available")) return availability("available", availableMessage);
  if (statuses.some((status) => status === "unavailable")) {
    const item = items.find((candidate) => candidate.status === "unavailable");
    return item ?? availability("unavailable", "Unavailable.");
  }
  if (statuses.some((status) => status === "needs_metadata")) {
    const item = items.find((candidate) => candidate.status === "needs_metadata");
    return item ?? availability("needs_metadata", "Metadata is needed.", "missing_metadata");
  }
  if (statuses.some((status) => status === "needs_extraction")) {
    const item = items.find((candidate) => candidate.status === "needs_extraction");
    return item ?? availability("needs_extraction", "Extraction is needed.", "new_extraction_required");
  }
  if (statuses.some((status) => status === "future")) {
    const item = items.find((candidate) => candidate.status === "future");
    return item ?? futureAvailability("Future integration is needed.");
  }
  return availability("partial", availableMessage, "partial_metadata");
}

function metricValue(input: {
  key: string;
  label: string;
  value: number | string | null;
  unit: ReportMetricUnit;
  basis: string;
  availability: ReportDataAvailability;
  caution?: string;
}): ReportMetricValue {
  return input;
}

function gapMetric(key: string, left: ReportMetricValue | null, right: ReportMetricValue): ReportMetricValue {
  const leftValue = toNumberOrNull(left?.value);
  const rightValue = toNumberOrNull(right.value);
  return metricValue({
    key,
    label: key,
    value: leftValue === null || rightValue === null ? null : round2(leftValue - rightValue),
    unit: right.unit,
    basis: `${left?.basis ?? "missing"} vs ${right.basis}`,
    availability: mergeAvailability([left?.availability, right.availability].filter(isNonNullable), "Gap metric is available.")
  });
}

function getPromptMetadataString(prompt: RecoraPromptRow, key: string) {
  return getRecordString(prompt, key) ??
    getRecordString(prompt, toCamelCase(key)) ??
    getMetadataString(getMetadataRecord(getRecordValue(prompt, "metadata")), key);
}

function getRecordString(value: unknown, key: string) {
  const record = asRecord(value);
  const item = record?.[key];
  return typeof item === "string" && item.trim() ? item.trim() : null;
}

function getRecordValue(value: unknown, key: string) {
  const record = asRecord(value);
  return record?.[key];
}

function getMetadataRecord(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getStringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter(isNonEmptyString) : [];
}

function isReportPromptType(value: string): value is ReportPromptType {
  return KNOWN_PROMPT_TYPES.includes(value as ReportPromptType);
}

function isReportMeasurementPurpose(value: string): value is ReportMeasurementPurpose {
  return KNOWN_MEASUREMENT_PURPOSES.includes(value as ReportMeasurementPurpose);
}

function isOwnerType(value: string): value is ReportCitationOwnerType {
  return value === "owned" || value === "competitor" || value === "third_party" || value === "unknown";
}

function toAnswerPosition(position: number | null): ReportAnswerPosition {
  if (typeof position !== "number" || !Number.isFinite(position)) return "unknown";
  if (position <= 1) return "top";
  if (position <= 3) return "middle";
  return "bottom";
}

function toSentimentLabel(value: RecoraBrandMentionRow["sentiment"]): ReportSentimentLabel {
  if (value === "positive" || value === "neutral" || value === "negative") return value;
  return "unknown";
}

function getCitationOccurrenceCount(citation: RecoraCitationRow) {
  return Math.max(1, toNumberOrNull(citation.occurrence_count) ?? 1);
}

function getMentionCount(mention: RecoraBrandMentionRow) {
  return Math.max(0, toNumberOrNull(mention.mention_count) ?? (mention.mentioned ? 1 : 0));
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return round2((part / total) * 100);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumeric(value: number | string | null) {
  const parsed = toNumberOrNull(value);
  return parsed ?? 0;
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function excerpt(value: string | null | undefined, maxLength = 280) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function priorityWeight(priority: RecoraRecommendationRow["priority"] | "unknown") {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  if (priority === "low") return 2;
  return 3;
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
