import type {
  Json,
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraMetricSnapshotRow,
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRunItemRow,
  RecoraSourceDomainRow,
  RecoraSourceFreshnessStatus,
  RecoraSourceToClaimStatus,
  RecoraTopicRow
} from "./db/types";

export type RecoraEvidenceLabel = "CONFIRMED_FACT" | "RECORA_ASSUMPTION" | "NEEDS_VERIFICATION";

export type RecoraMentionContext = {
  conversationId: string;
  promptId: string | null;
  topicId: string | null;
  topicName: string | null;
  promptText: string | null;
  snippet: string | null;
  recommendationStatus: string;
  sentiment: string;
  evidenceLabel: RecoraEvidenceLabel;
};

export type RecoraBrandCoMention = {
  brandId: string;
  name: string;
  count: number;
};

export type RecoraNewAppearanceStatus =
  | "new_candidate"
  | "known_or_absent"
  | "needs_verification";

export type RecoraBrandComparisonRow = {
  brandId: string;
  name: string;
  brandType: RecoraBrandRow["brand_type"];
  displayCount: number;
  displayRate: number;
  averagePosition: number | null;
  mentionCount: number;
  mentionContexts: RecoraMentionContext[];
  coMentionedCompetitors: RecoraBrandCoMention[];
  newAppearanceStatus: RecoraNewAppearanceStatus;
  newAppearanceNeedsVerification: boolean;
};

export type RecoraTopicGapInsight = {
  topicId: string | null;
  topicName: string;
  primaryBrandDisplayRate: number;
  topCompetitorName: string | null;
  topCompetitorDisplayRate: number;
  competitiveGap: number;
  conversationCount: number;
  evidenceLabel: RecoraEvidenceLabel;
  source: "metric_snapshot" | "derived_from_mentions";
};

export type RecoraWeakSourceCategory = {
  sourceType: RecoraCitationRow["source_type"];
  occurrenceCount: number;
  ownedOccurrenceCount: number;
  ownedShare: number;
  sourceToClaimSupportedCount: number;
  needsReviewCount: number;
  evidenceLabel: RecoraEvidenceLabel;
};

export type RecoraSourceFreshnessReadModel = {
  status: RecoraSourceFreshnessStatus;
  retrievedAt: string | null;
  publishedAt: string | null;
  lastModifiedAt: string | null;
  ageDays: number | null;
  needsVerification: boolean;
};

export type RecoraSourceToClaimReadModel = {
  status: RecoraSourceToClaimStatus;
  claimText: string | null;
  note: string | null;
  needsReviewBeforePublication: boolean;
};

export type RecoraCitationSourceReadModel = {
  citationId: string;
  conversationId: string;
  domain: string;
  url: string | null;
  canonicalUrl: string | null;
  sourceType: RecoraCitationRow["source_type"];
  occurrenceCount: number;
  brandRelated: RecoraCitationRow["brand_related"];
  title: string | null;
  citedText: string | null;
  sourceFreshness: RecoraSourceFreshnessReadModel;
  sourceToClaim: RecoraSourceToClaimReadModel;
};

export type RecoraSourceDomainReadModel = {
  domain: string;
  sourceType: RecoraCitationRow["source_type"];
  occurrenceCount: number;
  citationCount: number;
  urls: string[];
  sourceToClaimStatusCounts: Record<RecoraSourceToClaimStatus, number>;
  freshnessStatusCounts: Record<RecoraSourceFreshnessStatus, number>;
};

export type RecoraQualityGateDecision = "auto_publish" | "hold" | "suppress";
export type RecoraQualityGateStage = "pre_quality_gate" | "reviewed";

export type RecoraRecommendationGateRow = {
  recommendationId: string;
  candidateId: string;
  title: string;
  type: RecoraRecommendationRow["type"];
  priority: RecoraRecommendationRow["priority"];
  stage: RecoraQualityGateStage;
  decision: RecoraQualityGateDecision | null;
  qualityScore: number | null;
  confidence: string | null;
  displayDecision: string | null;
  blockingReason: string | null;
  evidenceLabel: RecoraEvidenceLabel;
};

export type RecoraRecommendationGateSummary = {
  totalCandidateCount: number;
  preQualityGateCandidateCount: number;
  reviewedCandidateCount: number;
  autoPublishCount: number;
  holdCount: number;
  suppressCount: number;
};

export type RecoraReportOverviewAnalysis = {
  largeTopicGaps: RecoraTopicGapInsight[];
  weakOwnedSourceCategories: RecoraWeakSourceCategory[];
  preQualityGateCandidateCount: number;
  newAppearanceBrandCandidates: RecoraBrandComparisonRow[];
  needsVerification: string[];
};

export type RecoraMeasurementAnalysisReadModel = {
  reportOverview: RecoraReportOverviewAnalysis;
  brandComparison: RecoraBrandComparisonRow[];
  sources: {
    citationSources: RecoraCitationSourceReadModel[];
    sourceDomains: RecoraSourceDomainReadModel[];
  };
  recommendationQualityGate: {
    summary: RecoraRecommendationGateSummary;
    candidates: RecoraRecommendationGateRow[];
  };
};

export type CreateRecoraMeasurementAnalysisInput = {
  brands: RecoraBrandRow[];
  runItems: RecoraRunItemRow[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
  metricSnapshots?: RecoraMetricSnapshotRow[];
  recommendations?: RecoraRecommendationRow[];
  previousBrandMentions?: RecoraBrandMentionRow[] | null;
  prompts?: RecoraPromptRow[];
  topics?: RecoraTopicRow[];
  sourceDomains?: RecoraSourceDomainRow[];
};

const SOURCE_TO_CLAIM_STATUSES: RecoraSourceToClaimStatus[] = [
  "supported",
  "partially_supported",
  "contradicted",
  "unrelated",
  "unknown",
  "not_reviewed"
];

const SOURCE_FRESHNESS_STATUSES: RecoraSourceFreshnessStatus[] = [
  "fresh",
  "recent",
  "stale",
  "unknown",
  "not_checked"
];

export function createRecoraMeasurementAnalysisReadModel(
  input: CreateRecoraMeasurementAnalysisInput
): RecoraMeasurementAnalysisReadModel {
  const normalized = normalizeInput(input);
  const brandComparison = buildBrandComparison(normalized);
  const citationSources = buildCitationSources(normalized.citations);
  const sourceDomains = buildSourceDomains(citationSources);
  const qualityGateCandidates = buildRecommendationGateRows(normalized.recommendations);
  const qualityGateSummary = summarizeQualityGate(qualityGateCandidates);
  const largeTopicGaps = buildTopicGaps(normalized, brandComparison);
  const weakOwnedSourceCategories = buildWeakOwnedSourceCategories(citationSources);

  return {
    reportOverview: {
      largeTopicGaps,
      weakOwnedSourceCategories,
      preQualityGateCandidateCount: qualityGateSummary.preQualityGateCandidateCount,
      newAppearanceBrandCandidates: brandComparison.filter((brand) => brand.newAppearanceStatus === "new_candidate"),
      needsVerification: buildNeedsVerificationFlags({
        topicGaps: largeTopicGaps,
        weakOwnedSourceCategories,
        brandComparison,
        citationSources,
        qualityGateSummary
      })
    },
    brandComparison,
    sources: {
      citationSources,
      sourceDomains
    },
    recommendationQualityGate: {
      summary: qualityGateSummary,
      candidates: qualityGateCandidates
    }
  };
}

function normalizeInput(input: CreateRecoraMeasurementAnalysisInput) {
  const conversationIds = new Set(input.conversations.map((conversation) => conversation.id));
  const displayableCitations = input.citations.filter((citation) =>
    !isExampleDomain(citation.domain) && !isExampleDomain(citation.url)
  );

  return {
    ...input,
    metricSnapshots: input.metricSnapshots ?? [],
    recommendations: input.recommendations ?? [],
    previousBrandMentions: input.previousBrandMentions,
    prompts: input.prompts ?? [],
    topics: input.topics ?? [],
    sourceDomains: input.sourceDomains ?? [],
    brandMentions: input.brandMentions.filter((mention) => conversationIds.has(mention.conversation_id)),
    citations: displayableCitations.filter((citation) => conversationIds.has(citation.conversation_id))
  };
}

function buildBrandComparison(input: ReturnType<typeof normalizeInput>): RecoraBrandComparisonRow[] {
  const conversations = input.conversations;
  const mentionsByBrandId = groupBy(input.brandMentions, (mention) => mention.brand_id);
  const mentionedByConversationId = groupBy(
    input.brandMentions.filter((mention) => mention.mentioned),
    (mention) => mention.conversation_id
  );
  const brandById = new Map(input.brands.map((brand) => [brand.id, brand]));
  const previousMentionedBrandIds = Array.isArray(input.previousBrandMentions)
    ? new Set(input.previousBrandMentions.filter((mention) => mention.mentioned).map((mention) => mention.brand_id))
    : null;

  return input.brands.map((brand) => {
    const brandMentions = mentionsByBrandId.get(brand.id) ?? [];
    const displayedMentions = brandMentions.filter((mention) => mention.mentioned);
    const positions = displayedMentions.map((mention) => toNumberOrNull(mention.position)).filter(isFiniteNumber);
    const coMentionedCompetitors = buildCoMentionedCompetitors(
      brand.id,
      mentionedByConversationId,
      brandById
    );
    const displayCount = unique(displayedMentions.map((mention) => mention.conversation_id)).length;
    const newAppearanceStatus = getNewAppearanceStatus(displayCount, previousMentionedBrandIds, brand.id);

    return {
      brandId: brand.id,
      name: brand.name,
      brandType: brand.brand_type,
      displayCount,
      displayRate: percent(displayCount, conversations.length),
      averagePosition: positions.length > 0 ? round2(average(positions)) : null,
      mentionCount: brandMentions.reduce((sum, mention) => sum + getMentionCount(mention), 0),
      mentionContexts: buildMentionContexts(displayedMentions, input),
      coMentionedCompetitors,
      newAppearanceStatus,
      newAppearanceNeedsVerification: newAppearanceStatus === "needs_verification"
    };
  }).sort((left, right) =>
    right.displayRate - left.displayRate ||
    (left.averagePosition ?? Number.MAX_SAFE_INTEGER) - (right.averagePosition ?? Number.MAX_SAFE_INTEGER) ||
    left.name.localeCompare(right.name)
  );
}

function buildCoMentionedCompetitors(
  brandId: string,
  mentionedByConversationId: Map<string, RecoraBrandMentionRow[]>,
  brandById: Map<string, RecoraBrandRow>
): RecoraBrandCoMention[] {
  const counts = new Map<string, RecoraBrandCoMention>();

  for (const mentions of Array.from(mentionedByConversationId.values())) {
    if (!mentions.some((mention) => mention.brand_id === brandId)) continue;

    for (const mention of mentions) {
      if (mention.brand_id === brandId) continue;
      const brand = brandById.get(mention.brand_id);
      if (!brand || brand.brand_type !== "competitor") continue;
      const current = counts.get(brand.id) ?? { brandId: brand.id, name: brand.name, count: 0 };
      current.count += 1;
      counts.set(brand.id, current);
    }
  }

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5);
}

function buildMentionContexts(
  mentions: RecoraBrandMentionRow[],
  input: ReturnType<typeof normalizeInput>
): RecoraMentionContext[] {
  const conversationById = new Map(input.conversations.map((conversation) => [conversation.id, conversation]));
  const runItemById = new Map(input.runItems.map((runItem) => [runItem.id, runItem]));
  const promptById = new Map(input.prompts.map((prompt) => [prompt.id, prompt]));
  const topicById = new Map(input.topics.map((topic) => [topic.id, topic]));

  return mentions
    .sort((left, right) =>
      (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER) ||
      left.created_at.localeCompare(right.created_at)
    )
    .slice(0, 3)
    .map((mention) => {
      const conversation = conversationById.get(mention.conversation_id);
      const runItem = conversation ? runItemById.get(conversation.run_item_id) : null;
      const prompt = runItem ? promptById.get(runItem.prompt_id) : null;
      const topic = prompt ? topicById.get(prompt.topic_id) : null;

      return {
        conversationId: mention.conversation_id,
        promptId: prompt?.id ?? null,
        topicId: topic?.id ?? null,
        topicName: topic?.name ?? null,
        promptText: prompt?.text ?? conversation?.prompt_text_snapshot ?? null,
        snippet: firstText(mention.evidence_snippet, mention.mention_text),
        recommendationStatus: mention.recommendation_status,
        sentiment: mention.sentiment,
        evidenceLabel: "CONFIRMED_FACT"
      };
    });
}

function getNewAppearanceStatus(
  displayCount: number,
  previousMentionedBrandIds: Set<string> | null,
  brandId: string
): RecoraNewAppearanceStatus {
  if (displayCount === 0) return "known_or_absent";
  if (!previousMentionedBrandIds) return "needs_verification";
  return previousMentionedBrandIds.has(brandId) ? "known_or_absent" : "new_candidate";
}

function buildCitationSources(citations: RecoraCitationRow[]): RecoraCitationSourceReadModel[] {
  return citations.map((citation) => {
    const sourceToClaim = getSourceToClaimReadModel(citation);

    return {
      citationId: citation.id,
      conversationId: citation.conversation_id,
      domain: citation.domain,
      url: citation.url,
      canonicalUrl: citation.canonical_url,
      sourceType: citation.source_type,
      occurrenceCount: Math.max(1, citation.occurrence_count ?? 1),
      brandRelated: citation.brand_related,
      title: citation.title,
      citedText: citation.cited_text,
      sourceFreshness: getSourceFreshnessReadModel(citation),
      sourceToClaim
    };
  }).sort((left, right) =>
    right.occurrenceCount - left.occurrenceCount ||
    left.domain.localeCompare(right.domain) ||
    (left.url ?? "").localeCompare(right.url ?? "")
  );
}

function buildSourceDomains(citations: RecoraCitationSourceReadModel[]): RecoraSourceDomainReadModel[] {
  const rows = new Map<string, RecoraSourceDomainReadModel>();

  for (const citation of citations) {
    const key = `${citation.domain.toLowerCase()}::${citation.sourceType}`;
    const current = rows.get(key) ?? {
      domain: citation.domain,
      sourceType: citation.sourceType,
      occurrenceCount: 0,
      citationCount: 0,
      urls: [],
      sourceToClaimStatusCounts: createStatusCountMap(SOURCE_TO_CLAIM_STATUSES),
      freshnessStatusCounts: createStatusCountMap(SOURCE_FRESHNESS_STATUSES)
    };

    current.occurrenceCount += citation.occurrenceCount;
    current.citationCount += 1;
    if (citation.url && !current.urls.includes(citation.url)) current.urls.push(citation.url);
    current.sourceToClaimStatusCounts[citation.sourceToClaim.status] += citation.occurrenceCount;
    current.freshnessStatusCounts[citation.sourceFreshness.status] += citation.occurrenceCount;
    rows.set(key, current);
  }

  return Array.from(rows.values())
    .sort((left, right) =>
      right.occurrenceCount - left.occurrenceCount ||
      right.citationCount - left.citationCount ||
      left.domain.localeCompare(right.domain)
    );
}

function buildTopicGaps(
  input: ReturnType<typeof normalizeInput>,
  brandComparison: RecoraBrandComparisonRow[]
): RecoraTopicGapInsight[] {
  const fromSnapshots = buildTopicGapsFromMetricSnapshots(input.metricSnapshots, input.topics);
  if (fromSnapshots.length > 0) return fromSnapshots;

  const primaryBrand = input.brands.find((brand) => brand.brand_type === "primary") ?? null;
  if (!primaryBrand) return [];

  const conversationById = new Map(input.conversations.map((conversation) => [conversation.id, conversation]));
  const runItemById = new Map(input.runItems.map((runItem) => [runItem.id, runItem]));
  const promptById = new Map(input.prompts.map((prompt) => [prompt.id, prompt]));
  const topicById = new Map(input.topics.map((topic) => [topic.id, topic]));
  const brandComparisonById = new Map(brandComparison.map((brand) => [brand.brandId, brand]));
  const topicConversationIds = new Map<string, Set<string>>();
  const topicDisplayByBrandId = new Map<string, Map<string, Set<string>>>();

  for (const conversation of input.conversations) {
    const runItem = runItemById.get(conversation.run_item_id);
    const prompt = runItem ? promptById.get(runItem.prompt_id) : null;
    const topicId = prompt?.topic_id ?? "unknown";
    setAdd(topicConversationIds, topicId, conversation.id);
  }

  for (const mention of input.brandMentions.filter((item) => item.mentioned)) {
    const conversation = conversationById.get(mention.conversation_id);
    const runItem = conversation ? runItemById.get(conversation.run_item_id) : null;
    const prompt = runItem ? promptById.get(runItem.prompt_id) : null;
    const topicId = prompt?.topic_id ?? "unknown";
    const byBrand = topicDisplayByBrandId.get(topicId) ?? new Map<string, Set<string>>();
    const conversationIds = byBrand.get(mention.brand_id) ?? new Set<string>();
    conversationIds.add(mention.conversation_id);
    byBrand.set(mention.brand_id, conversationIds);
    topicDisplayByBrandId.set(topicId, byBrand);
  }

  return Array.from(topicConversationIds.entries())
    .map(([topicId, conversationIds]) => {
      const byBrand = topicDisplayByBrandId.get(topicId) ?? new Map<string, Set<string>>();
      const conversationCount = conversationIds.size;
      const primaryRate = percent(byBrand.get(primaryBrand.id)?.size ?? 0, conversationCount);
      const competitor = input.brands
        .filter((brand) => brand.brand_type === "competitor")
        .map((brand) => ({
          brand,
          displayRate: percent(byBrand.get(brand.id)?.size ?? 0, conversationCount)
        }))
        .sort((left, right) =>
          right.displayRate - left.displayRate ||
          (brandComparisonById.get(left.brand.id)?.averagePosition ?? Number.MAX_SAFE_INTEGER) -
            (brandComparisonById.get(right.brand.id)?.averagePosition ?? Number.MAX_SAFE_INTEGER)
        )[0] ?? null;
      const topic = topicById.get(topicId);

      return {
        topicId: topic?.id ?? null,
        topicName: topic?.name ?? "unknown_topic",
        primaryBrandDisplayRate: primaryRate,
        topCompetitorName: competitor?.brand.name ?? null,
        topCompetitorDisplayRate: competitor?.displayRate ?? 0,
        competitiveGap: round2(primaryRate - (competitor?.displayRate ?? 0)),
        conversationCount,
        evidenceLabel: "CONFIRMED_FACT",
        source: "derived_from_mentions"
      } satisfies RecoraTopicGapInsight;
    })
    .filter((item) => item.conversationCount > 0)
    .sort((left, right) =>
      Math.abs(right.competitiveGap) - Math.abs(left.competitiveGap) ||
      right.conversationCount - left.conversationCount ||
      left.topicName.localeCompare(right.topicName)
    )
    .slice(0, 5);
}

function buildTopicGapsFromMetricSnapshots(
  metricSnapshots: RecoraMetricSnapshotRow[],
  topics: RecoraTopicRow[]
): RecoraTopicGapInsight[] {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  return metricSnapshots
    .filter((snapshot) => snapshot.scope_type === "topic" && typeof snapshot.competitive_gap === "number")
    .map((snapshot) => ({
      topicId: snapshot.scope_id,
      topicName: snapshot.scope_id ? topicById.get(snapshot.scope_id)?.name ?? "unknown_topic" : "unknown_topic",
      primaryBrandDisplayRate: round2(snapshot.ai_visibility),
      topCompetitorName: null,
      topCompetitorDisplayRate: round2(snapshot.ai_visibility - (snapshot.competitive_gap ?? 0)),
      competitiveGap: round2(snapshot.competitive_gap ?? 0),
      conversationCount: getMetadataNumber(getMetadataRecord(snapshot.metadata), "sample_size") ?? 0,
      evidenceLabel: "CONFIRMED_FACT" as const,
      source: "metric_snapshot" as const
    }))
    .sort((left, right) =>
      Math.abs(right.competitiveGap) - Math.abs(left.competitiveGap) ||
      left.topicName.localeCompare(right.topicName)
    )
    .slice(0, 5);
}

function buildWeakOwnedSourceCategories(citations: RecoraCitationSourceReadModel[]): RecoraWeakSourceCategory[] {
  const bySourceType = new Map<RecoraCitationRow["source_type"], RecoraWeakSourceCategory>();

  for (const citation of citations) {
    const current = bySourceType.get(citation.sourceType) ?? {
      sourceType: citation.sourceType,
      occurrenceCount: 0,
      ownedOccurrenceCount: 0,
      ownedShare: 0,
      sourceToClaimSupportedCount: 0,
      needsReviewCount: 0,
      evidenceLabel: "CONFIRMED_FACT"
    };

    current.occurrenceCount += citation.occurrenceCount;
    if (citation.sourceType === "owned" || citation.brandRelated === "target_brand") {
      current.ownedOccurrenceCount += citation.occurrenceCount;
    }
    if (citation.sourceToClaim.status === "supported" || citation.sourceToClaim.status === "partially_supported") {
      current.sourceToClaimSupportedCount += citation.occurrenceCount;
    }
    if (citation.sourceToClaim.needsReviewBeforePublication) {
      current.needsReviewCount += citation.occurrenceCount;
    }
    bySourceType.set(citation.sourceType, current);
  }

  return Array.from(bySourceType.values())
    .map((item) => ({
      ...item,
      ownedShare: percent(item.ownedOccurrenceCount, item.occurrenceCount)
    }))
    .sort((left, right) =>
      left.ownedShare - right.ownedShare ||
      right.occurrenceCount - left.occurrenceCount ||
      left.sourceType.localeCompare(right.sourceType)
    );
}

function buildRecommendationGateRows(recommendations: RecoraRecommendationRow[]): RecoraRecommendationGateRow[] {
  return recommendations.map((recommendation) => {
    const metadata = getMetadataRecord(recommendation.metadata);
    const decision = getQualityGateDecision(metadata);
    const stage: RecoraQualityGateStage = decision ? "reviewed" : "pre_quality_gate";
    const evidenceLabel: RecoraEvidenceLabel = stage === "reviewed" ? "CONFIRMED_FACT" : "NEEDS_VERIFICATION";

    return {
      recommendationId: recommendation.id,
      candidateId: getMetadataString(metadata, "candidate_id") ?? recommendation.id,
      title: recommendation.title,
      type: recommendation.type,
      priority: recommendation.priority,
      stage,
      decision,
      qualityScore: getMetadataNumber(metadata, "quality_score") ?? recommendation.impact_score ?? null,
      confidence: getMetadataString(metadata, "confidence"),
      displayDecision: getMetadataString(metadata, "display_decision"),
      blockingReason: getMetadataString(metadata, "blocking_reason") ?? getMetadataString(metadata, "reviewer_comment"),
      evidenceLabel
    };
  }).sort((left, right) =>
    getGateSortWeight(left) - getGateSortWeight(right) ||
    (right.qualityScore ?? 0) - (left.qualityScore ?? 0) ||
    left.title.localeCompare(right.title)
  );
}

function summarizeQualityGate(rows: RecoraRecommendationGateRow[]): RecoraRecommendationGateSummary {
  return {
    totalCandidateCount: rows.length,
    preQualityGateCandidateCount: rows.filter((row) => row.stage === "pre_quality_gate").length,
    reviewedCandidateCount: rows.filter((row) => row.stage === "reviewed").length,
    autoPublishCount: rows.filter((row) => row.decision === "auto_publish").length,
    holdCount: rows.filter((row) => row.decision === "hold").length,
    suppressCount: rows.filter((row) => row.decision === "suppress").length
  };
}

function buildNeedsVerificationFlags(input: {
  topicGaps: RecoraTopicGapInsight[];
  weakOwnedSourceCategories: RecoraWeakSourceCategory[];
  brandComparison: RecoraBrandComparisonRow[];
  citationSources: RecoraCitationSourceReadModel[];
  qualityGateSummary: RecoraRecommendationGateSummary;
}) {
  const flags: string[] = [];

  if (input.topicGaps.length === 0) {
    flags.push("topic_gap_requires_prompt_topic_measurements");
  }
  if (input.weakOwnedSourceCategories.length === 0) {
    flags.push("weak_owned_source_category_requires_citations");
  }
  if (input.brandComparison.some((brand) => brand.newAppearanceNeedsVerification)) {
    flags.push("new_appearance_requires_previous_measurement_run");
  }
  if (input.citationSources.some((citation) => citation.sourceFreshness.needsVerification)) {
    flags.push("source_freshness_requires_source_date_or_retrieval");
  }
  if (input.citationSources.some((citation) => citation.sourceToClaim.needsReviewBeforePublication)) {
    flags.push("source_to_claim_requires_review_before_publication");
  }
  if (input.qualityGateSummary.preQualityGateCandidateCount > 0) {
    flags.push("recommendation_candidates_require_quality_gate_review");
  }

  return unique(flags);
}

function getSourceFreshnessReadModel(citation: RecoraCitationRow): RecoraSourceFreshnessReadModel {
  const status = isSourceFreshnessStatus(citation.source_freshness_status)
    ? citation.source_freshness_status
    : "not_checked";

  return {
    status,
    retrievedAt: citation.source_retrieved_at ?? null,
    publishedAt: citation.source_published_at ?? null,
    lastModifiedAt: citation.source_last_modified_at ?? null,
    ageDays: toNumberOrNull(citation.source_freshness_days),
    needsVerification: status === "not_checked" || status === "unknown"
  };
}

function getSourceToClaimReadModel(citation: RecoraCitationRow): RecoraSourceToClaimReadModel {
  const status = getSourceToClaimStatus(citation);

  return {
    status,
    claimText: citation.claim_text ?? citation.cited_text ?? null,
    note: citation.source_to_claim_note ?? null,
    needsReviewBeforePublication: status === "unknown" || status === "not_reviewed"
  };
}

function getSourceToClaimStatus(citation: RecoraCitationRow): RecoraSourceToClaimStatus {
  if (isSourceToClaimStatus(citation.source_to_claim_status)) return citation.source_to_claim_status;
  if (citation.supports_claim === true) return "supported";
  if (citation.supports_claim === false) return "unknown";
  return "not_reviewed";
}

function getQualityGateDecision(metadata: Record<string, unknown>): RecoraQualityGateDecision | null {
  const value =
    getMetadataString(metadata, "quality_gate_decision") ??
    getMetadataString(metadata, "gate_decision") ??
    getMetadataString(metadata, "decision");

  if (value === "auto_publish" || value === "hold" || value === "suppress") return value;
  return null;
}

function getGateSortWeight(row: RecoraRecommendationGateRow) {
  if (row.stage === "pre_quality_gate") return 0;
  if (row.decision === "suppress") return 1;
  if (row.decision === "hold") return 2;
  return 3;
}

function getMentionCount(mention: RecoraBrandMentionRow) {
  const explicit = toNumberOrNull(mention.mention_count);
  if (explicit !== null) return Math.max(0, explicit);
  return mention.mentioned ? 1 : 0;
}

function getMetadataRecord(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMetadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createStatusCountMap<T extends string>(values: T[]): Record<T, number> {
  return values.reduce((result, value) => {
    result[value] = 0;
    return result;
  }, {} as Record<T, number>);
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

function setAdd(map: Map<string, Set<string>>, key: string, value: string) {
  const current = map.get(key) ?? new Set<string>();
  current.add(value);
  map.set(key, current);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSourceToClaimStatus(value: unknown): value is RecoraSourceToClaimStatus {
  return typeof value === "string" && SOURCE_TO_CLAIM_STATUSES.includes(value as RecoraSourceToClaimStatus);
}

function isSourceFreshnessStatus(value: unknown): value is RecoraSourceFreshnessStatus {
  return typeof value === "string" && SOURCE_FRESHNESS_STATUSES.includes(value as RecoraSourceFreshnessStatus);
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
