export const PROJECT_SETUP_DRAFT_SCHEMA_VERSION = "project_setup_draft_v1" as const;

export const MIN_DRAFT_CONFIDENCE_SCORE = 70;
export const MIN_PROMPT_QUALITY_SCORE = 75;

export type DraftReviewStatus =
  | "draft"
  | "needs_review"
  | "approved"
  | "rejected"
  | "needs_revision"
  | "superseded";

export type SourceStatus = "provided" | "inferred" | "missing" | "needs_confirmation";

export type BuyerStage = "awareness" | "exploration" | "comparison" | "validation" | "decision";

export type PromptIntent =
  | "non_branded"
  | "branded"
  | "comparison"
  | "buyer_intent"
  | "problem_aware"
  | "solution_aware"
  | "citation_check"
  | "sentiment"
  | "brand_perception";

export type PromptCategory =
  | "non_branded"
  | "branded"
  | "competitor_comparison"
  | "problem_solution"
  | "alternative_search"
  | "pricing_reputation"
  | "citation_check"
  | "persona_based";

export type PromptBrandingMode = "non_branded" | "branded" | "brand_optional" | "competitor_only";
export type PromptBrandMentionRule = "brand_excluded" | "brand_included" | "brand_optional" | "competitor_only";
export type PromptCompetitorMentionRule =
  | "no_competitor"
  | "named_competitors"
  | "category_competitors"
  | "unknown_competitor_discovery";

export type PromptIntentType =
  | "informational"
  | "commercial_investigation"
  | "comparison"
  | "transactional"
  | "reputational"
  | "evidence_seeking"
  | "risk_checking";

export type PromptLanguageMode =
  | "natural_conversation"
  | "raw_search_like"
  | "anxious_user"
  | "comparison_shortcut"
  | "professional_research";

export type PromptResponseShape =
  | "candidate_list"
  | "ranked_recommendation"
  | "comparative_set"
  | "evaluation_criteria"
  | "explanatory_answer"
  | "evidence_answer"
  | "branded_sentiment_answer";

export type PromptCandidateMentionOpportunity = "direct" | "likely" | "weak" | "none";
export type PromptRankingOpportunity = "direct" | "comparable_set" | "weak" | "none";
export type PromptMetricState = "eligible" | "excluded";

export type PromptMetricEligibility = {
  brandingMode: PromptBrandingMode;
  visibilityRate: PromptMetricState;
  ranking: PromptMetricState;
  shareOfVoice: PromptMetricState;
  sentiment: PromptMetricState;
  brandPerception: PromptMetricState;
  citationCheck: PromptMetricState;
  reasons: string[];
};

export type PromptGateDecision =
  | "ready_for_measurement"
  | "revise_before_measurement"
  | "internal_only"
  | "reject";

export type PromptSeedContaminationRisk = "none" | "low" | "medium" | "high";

export type PersonaRoleType =
  | "decision_maker"
  | "economic_buyer"
  | "end_user"
  | "evaluator"
  | "technical_reviewer"
  | "blocker"
  | "influencer"
  | "purchaser"
  | "user"
  | "comparator"
  | "recommender_influencer"
  | "repeat_user"
  | "agency_or_consultant";

export type PersonaPromptReadiness =
  | "ready_for_prompt_design"
  | "usable_with_caution"
  | "needs_more_evidence"
  | "do_not_handoff";

export type TopicType =
  | "market_discovery_topic"
  | "problem_solution_topic"
  | "category_discovery_topic"
  | "competitor_comparison_topic"
  | "alternative_search_topic"
  | "pricing_reputation_topic"
  | "citation_evidence_topic"
  | "branded_sentiment_topic"
  | "persona_specific_topic"
  | "local_regional_topic"
  | "regulated_risk_topic";

export type TopicMetricTarget = {
  visibilityRate: PromptMetricState;
  ranking: PromptMetricState;
  sentiment: PromptMetricState;
  citationCheck: PromptMetricState;
  riskCheck: PromptMetricState;
};

export type TopicQualityDecision =
  | "topic_ready"
  | "topic_needs_more_prompts"
  | "topic_needs_persona_refinement"
  | "topic_too_broad"
  | "topic_too_narrow"
  | "topic_metric_mismatch"
  | "topic_reject";

export type TopicCoverageStatus = "covered" | "undercovered" | "overcovered" | "mismatched" | "rejected";

export type RecoraHandoffSkill =
  | "recora-persona-discovery"
  | "recora-prompt-topic-designer"
  | "recora-ai-citation-analysis"
  | "recora-competitor-benchmark"
  | "recora-schema-seo-aio"
  | "recora-recommendation-quality-gate-auditor"
  | "none";

export type CompetitorDraftSource =
  | "provided"
  | "site_inferred"
  | "category_inferred"
  | "measured_ai_answer"
  | "citation_source"
  | "substitute_pattern";

export type CompetitorTier = "Direct" | "Adjacent" | "Aspirational" | "Substitute";

export type CitationSourceType =
  | "own_site"
  | "competitor_site"
  | "third_party_media"
  | "comparison_site"
  | "review_site"
  | "directory"
  | "social"
  | "official_source"
  | "government_or_academic"
  | "unknown"
  | "low_confidence";

export type SourceToClaimStatus = "not_reviewed" | "unknown" | "supported" | "partially_supported" | "unsupported";

export type PageImprovementAngleKind =
  | "faq"
  | "comparison_page"
  | "pricing_clarity"
  | "case_study"
  | "glossary"
  | "methodology_or_report"
  | "internal_links"
  | "body_aligned_json_ld"
  | "third_party_profile_correction"
  | "earned_evidence_or_partner_proof";

export type ProjectSetupSeedInput = {
  companyName: string;
  brandName: string;
  officialSiteUrl: string;
  productOrServiceDescription: string;
  industryCategory: string;
  targetCustomers: string;
  regions: readonly string[];
  language: string;
  serviceName?: string;
  brandAliases?: readonly string[];
  knownCompetitors?: readonly string[];
  avoidCompetitors?: readonly string[];
  strengths?: readonly string[];
  knownRisks?: readonly string[];
  diagnosisGoals?: readonly PromptIntent[];
};

export type InputCompletionItem = {
  field: string;
  status: SourceStatus;
  value: string | readonly string[] | null;
  note?: string;
};

export type PersonaDraft = {
  personaId: string;
  displayName: string;
  segment: string;
  businessType: string;
  industryCategory: string;
  industrySubtype?: string;
  roleType: PersonaRoleType;
  detailedDecisionRole: string;
  roleMappingReason: string;
  buyerStage: BuyerStage;
  jobs: readonly string[];
  painPoints: readonly string[];
  triggerEvents: readonly string[];
  switchingForces: readonly string[];
  alternativesConsidered: readonly string[];
  comparisonAxis: readonly string[];
  proofNeeded: readonly string[];
  trustRequirement: string;
  promptAngle: string;
  promptReadiness: PersonaPromptReadiness;
  researchSufficiency: string;
  confidenceScore: number;
  needsVerification: boolean;
  riskFlags: readonly string[];
  sourceStatus: SourceStatus;
  reviewStatus: DraftReviewStatus;
};

export type TopicDraft = {
  topicId: string;
  topicName: string;
  topicType: TopicType;
  diagnosisGoal: string;
  targetPersonaId: string | null;
  buyerStage: BuyerStage;
  metricTarget: TopicMetricTarget;
  brandMentionPolicy: PromptBrandMentionRule;
  expectedSignal: string;
  minimumPromptCount: number;
  riskOrBias: string | null;
  handoffSkill: RecoraHandoffSkill;
  topicQualityDecision: TopicQualityDecision;
  coverageStatus: TopicCoverageStatus;
  confidenceScore: number;
  reviewStatus: DraftReviewStatus;
};

export type PromptDraft = {
  promptId: string;
  topicId: string;
  personaId: string | null;
  text: string;
  rawUserIntent?: string;
  languageMode: PromptLanguageMode;
  category: PromptCategory;
  intent: PromptIntent;
  intentType: PromptIntentType;
  buyerStage: BuyerStage;
  brandingMode: PromptBrandingMode;
  brandMentionRule: PromptBrandMentionRule;
  competitorMentionRule: PromptCompetitorMentionRule;
  responseShape: PromptResponseShape;
  candidateMentionOpportunity: PromptCandidateMentionOpportunity;
  rankingOpportunity: PromptRankingOpportunity;
  expectedSignal: string;
  qualityScore: number;
  gateDecision: PromptGateDecision;
  gateReason: string;
  sourceStatus: SourceStatus;
  seedTerms: readonly string[];
  seedContaminationRisk: PromptSeedContaminationRisk;
  needsVerification: boolean;
  confidenceScore: number;
  reviewStatus: DraftReviewStatus;
  riskFlags: readonly string[];
};

export type CompetitorDraft = {
  competitorId: string;
  rawName: string;
  normalizedName: string;
  brandAliases: readonly string[];
  companyName: string | null;
  productName: string | null;
  domain: string | null;
  source: CompetitorDraftSource;
  tier: CompetitorTier;
  marketRegion: string | null;
  entityConfidenceScore: number;
  classificationConfidenceScore: number;
  lowConfidenceReasons: readonly string[];
  evidence: readonly string[];
  riskFlags: readonly string[];
  reviewStatus: DraftReviewStatus;
};

export type CitationAngleDraft = {
  angleId: string;
  sourceType: CitationSourceType;
  claimOrQuestion: string;
  targetUrl: string | null;
  expectedSignal: string;
  sourceToClaimStatus: SourceToClaimStatus;
  confidenceScore: number;
  sourceStatus: SourceStatus;
  reviewStatus: DraftReviewStatus;
  riskFlags: readonly string[];
};

export type PageImprovementAngleDraft = {
  angleId: string;
  kind: PageImprovementAngleKind;
  targetPage: string | null;
  rationale: string;
  expectedEffectHypothesis: string;
  requiredEvidence: readonly string[];
  confidenceScore: number;
  sourceStatus: SourceStatus;
  reviewStatus: DraftReviewStatus;
  riskFlags: readonly string[];
};

export type ProjectSetupDraft = {
  schemaVersion: typeof PROJECT_SETUP_DRAFT_SCHEMA_VERSION;
  draftId: string;
  projectSlug: string | null;
  promptSetVersion: string | null;
  generatorVersion: string | null;
  seedInput: ProjectSetupSeedInput;
  inputCompletion: readonly InputCompletionItem[];
  reviewStatus: DraftReviewStatus;
  confidenceScore: number;
  personas: readonly PersonaDraft[];
  topics: readonly TopicDraft[];
  prompts: readonly PromptDraft[];
  competitors: readonly CompetitorDraft[];
  citationAngles: readonly CitationAngleDraft[];
  pageImprovementAngles: readonly PageImprovementAngleDraft[];
  riskFlags: readonly string[];
};

export type PromptMeasurementReadiness = {
  promptId: string;
  measurementReady: boolean;
  metricEligibility: PromptMetricEligibility;
  blockers: string[];
};

export type MetricEligiblePromptIds = {
  visibilityRate: string[];
  ranking: string[];
  shareOfVoice: string[];
  sentiment: string[];
  brandPerception: string[];
  citationCheck: string[];
};

export type ProjectSetupDraftValidation = {
  blockers: string[];
  warnings: string[];
  promptReadiness: PromptMeasurementReadiness[];
  metricEligiblePromptIds: MetricEligiblePromptIds;
};

export type ProjectSetupDraftMaterializationDecision = {
  materializationReady: boolean;
  blockers: string[];
  validation: ProjectSetupDraftValidation;
};

export type BrandIdentityForDraft = {
  brandName: string;
  serviceName?: string;
  aliases?: readonly string[];
  officialSiteUrl?: string;
  domain?: string;
};

export function derivePromptMetricEligibility(
  prompt: PromptDraft,
  brandIdentity: BrandIdentityForDraft
): PromptMetricEligibility {
  const brandingMode = derivePromptBrandingMode(prompt, brandIdentity);
  const hasBrandSignal = brandingMode === "branded";
  const isBrandOptional = brandingMode === "brand_optional" || prompt.brandMentionRule === "brand_optional";
  const isSentimentLike = isSentimentOrBrandPerceptionPrompt(prompt);
  const isCitationLike = prompt.intent === "citation_check" || prompt.category === "citation_check" || prompt.responseShape === "evidence_answer";
  const responseSupportsMarketMetrics = supportsMarketMetricResponseShape(prompt.responseShape);
  const visibilityOpportunity = prompt.candidateMentionOpportunity === "direct" || prompt.candidateMentionOpportunity === "likely";
  const rankingOpportunity = prompt.rankingOpportunity === "direct" || prompt.rankingOpportunity === "comparable_set";
  const marketMetricCandidate =
    !hasBrandSignal &&
    !isBrandOptional &&
    !isSentimentLike &&
    !isCitationLike &&
    prompt.brandMentionRule === "brand_excluded" &&
    responseSupportsMarketMetrics;
  const visibilityRate = marketMetricCandidate && visibilityOpportunity ? "eligible" : "excluded";
  const ranking = marketMetricCandidate && rankingOpportunity ? "eligible" : "excluded";
  const shareOfVoice = visibilityRate;
  const sentiment = hasBrandSignal && isSentimentLike ? "eligible" : "excluded";
  const brandPerception =
    hasBrandSignal && (prompt.intent === "brand_perception" || prompt.intent === "branded" || prompt.responseShape === "branded_sentiment_answer")
      ? "eligible"
      : "excluded";
  const citationCheck = isCitationLike ? "eligible" : "excluded";
  const reasons = buildPromptMetricEligibilityReasons(prompt, {
    brandingMode,
    hasBrandSignal,
    isBrandOptional,
    isSentimentLike,
    isCitationLike,
    responseSupportsMarketMetrics,
    visibilityOpportunity,
    rankingOpportunity,
    visibilityRate,
    ranking,
    sentiment,
    brandPerception,
    citationCheck
  });

  return {
    brandingMode,
    visibilityRate,
    ranking,
    shareOfVoice,
    sentiment,
    brandPerception,
    citationCheck,
    reasons
  };
}

export function derivePromptBrandingMode(prompt: PromptDraft, brandIdentity: BrandIdentityForDraft): PromptBrandingMode {
  if (
    prompt.brandMentionRule === "brand_included" ||
    prompt.brandingMode === "branded" ||
    prompt.intent === "branded" ||
    prompt.responseShape === "branded_sentiment_answer" ||
    promptTextContainsBrandSignal(prompt.text, brandIdentity)
  ) {
    return "branded";
  }

  if (prompt.brandMentionRule === "brand_optional" || prompt.brandingMode === "brand_optional") {
    return "brand_optional";
  }

  if (prompt.brandMentionRule === "competitor_only" || prompt.brandingMode === "competitor_only") {
    return "competitor_only";
  }

  return "non_branded";
}

export function promptTextContainsBrandSignal(text: string, brandIdentity: BrandIdentityForDraft) {
  const normalizedText = normalizeBrandSignal(text);
  return getBrandSignals(brandIdentity).some((signal) => normalizedText.includes(signal));
}

export function getPromptMeasurementReadiness(
  prompt: PromptDraft,
  brandIdentity: BrandIdentityForDraft
): PromptMeasurementReadiness {
  const metricEligibility = derivePromptMetricEligibility(prompt, brandIdentity);
  const blockers: string[] = [];

  if (!hasText(prompt.promptId)) blockers.push("prompt_id_missing");
  if (!hasText(prompt.topicId)) blockers.push("topic_id_missing");
  if (!hasText(prompt.text)) blockers.push("prompt_text_missing");
  if (prompt.personaId == null || !hasText(prompt.personaId)) blockers.push("persona_id_required_before_measurement");
  if (!isApprovedReviewStatus(prompt.reviewStatus)) blockers.push("review_status_not_approved");
  if (prompt.confidenceScore < MIN_DRAFT_CONFIDENCE_SCORE) blockers.push("confidence_below_measurement_threshold");
  if (prompt.qualityScore < MIN_PROMPT_QUALITY_SCORE) blockers.push("quality_score_below_ready_threshold");
  if (prompt.gateDecision !== "ready_for_measurement") blockers.push("gate_decision_not_ready_for_measurement");
  if (prompt.seedContaminationRisk === "medium" || prompt.seedContaminationRisk === "high") {
    blockers.push("seed_contamination_risk_requires_review");
  }
  if (metricEligibility.brandingMode === "brand_optional") blockers.push("brand_optional_prompt_must_be_split_before_measurement");
  if (!hasAnyEligibleMetric(metricEligibility)) blockers.push("no_metric_or_review_use_is_eligible");

  return {
    promptId: prompt.promptId,
    measurementReady: blockers.length === 0,
    metricEligibility,
    blockers
  };
}

export function validateProjectSetupSeedInput(input: ProjectSetupSeedInput) {
  const blockers: string[] = [];

  if (!hasText(input.companyName)) blockers.push("seedInput.companyName is required");
  if (!hasText(input.brandName)) blockers.push("seedInput.brandName is required");
  if (!hasText(input.officialSiteUrl)) blockers.push("seedInput.officialSiteUrl is required");
  if (!hasText(input.productOrServiceDescription)) blockers.push("seedInput.productOrServiceDescription is required");
  if (!hasText(input.industryCategory)) blockers.push("seedInput.industryCategory is required");
  if (!hasText(input.targetCustomers)) blockers.push("seedInput.targetCustomers is required");
  if (input.regions.length === 0) blockers.push("seedInput.regions must include at least one region");
  if (!hasText(input.language)) blockers.push("seedInput.language is required");
  if (hasText(input.officialSiteUrl) && !isLikelyHttpUrl(input.officialSiteUrl)) {
    blockers.push("seedInput.officialSiteUrl must be an http or https URL");
  }

  return blockers;
}

export function validateProjectSetupDraft(draft: ProjectSetupDraft): ProjectSetupDraftValidation {
  const blockers = validateProjectSetupSeedInput(draft.seedInput);
  const warnings: string[] = [];
  const brandIdentity = getBrandIdentityFromDraft(draft);
  const promptReadiness = draft.prompts.map((prompt) => getPromptMeasurementReadiness(prompt, brandIdentity));
  const metricEligiblePromptIds = collectMetricEligiblePromptIds(promptReadiness);
  const personaIds = new Set(draft.personas.map((persona) => persona.personaId).filter(hasText));
  const topicIds = new Set(draft.topics.map((topic) => topic.topicId).filter(hasText));

  if (draft.schemaVersion !== PROJECT_SETUP_DRAFT_SCHEMA_VERSION) {
    blockers.push("schemaVersion must be project_setup_draft_v1");
  }
  if (!hasText(draft.draftId)) blockers.push("draftId is required");
  if (draft.confidenceScore < MIN_DRAFT_CONFIDENCE_SCORE) warnings.push("draft_confidence_below_materialization_threshold");
  if (draft.personas.length === 0) blockers.push("at least one persona draft is required");
  if (draft.topics.length === 0) blockers.push("at least one topic draft is required");
  if (draft.prompts.length === 0) blockers.push("at least one prompt draft is required");

  addDuplicateBlockers(blockers, draft.personas.map((persona) => persona.personaId), "personaId");
  addDuplicateBlockers(blockers, draft.topics.map((topic) => topic.topicId), "topicId");
  addDuplicateBlockers(blockers, draft.prompts.map((prompt) => prompt.promptId), "promptId");

  for (const persona of draft.personas) {
    if (!hasText(persona.personaId)) blockers.push("persona.personaId is required");
    if (!hasText(persona.displayName)) blockers.push(`persona ${persona.personaId || "(missing)"} displayName is required`);
    if (!hasText(persona.promptAngle)) warnings.push(`persona ${persona.personaId || "(missing)"} promptAngle is missing`);
    if (persona.promptReadiness === "needs_more_evidence" || persona.promptReadiness === "do_not_handoff") {
      warnings.push(`persona ${persona.personaId || "(missing)"} is not ready for normal prompt handoff`);
    }
  }

  for (const topic of draft.topics) {
    if (!hasText(topic.topicId)) blockers.push("topic.topicId is required");
    if (!hasText(topic.topicName)) blockers.push(`topic ${topic.topicId || "(missing)"} topicName is required`);
    if (!hasText(topic.expectedSignal)) blockers.push(`topic ${topic.topicId || "(missing)"} expectedSignal is required`);
    if (topic.minimumPromptCount < 1) blockers.push(`topic ${topic.topicId || "(missing)"} minimumPromptCount must be at least 1`);
    if (topic.targetPersonaId && !personaIds.has(topic.targetPersonaId)) {
      blockers.push(`topic ${topic.topicId} references unknown persona ${topic.targetPersonaId}`);
    }
    if (topic.topicQualityDecision === "topic_metric_mismatch" || topic.topicQualityDecision === "topic_reject") {
      blockers.push(`topic ${topic.topicId || "(missing)"} is not ready for measurement design`);
    }
  }

  for (const prompt of draft.prompts) {
    if (!hasText(prompt.promptId)) blockers.push("prompt.promptId is required");
    if (!hasText(prompt.topicId)) blockers.push(`prompt ${prompt.promptId || "(missing)"} topicId is required`);
    if (hasText(prompt.topicId) && !topicIds.has(prompt.topicId)) {
      blockers.push(`prompt ${prompt.promptId || "(missing)"} references unknown topic ${prompt.topicId}`);
    }
    if (prompt.personaId == null || !personaIds.has(prompt.personaId)) {
      blockers.push(`prompt ${prompt.promptId || "(missing)"} references missing or unknown persona`);
    }
    const persona = draft.personas.find((item) => item.personaId === prompt.personaId);
    if (persona && (persona.promptReadiness === "needs_more_evidence" || persona.promptReadiness === "do_not_handoff")) {
      blockers.push(`prompt ${prompt.promptId || "(missing)"} uses persona ${persona.personaId} before prompt handoff is ready`);
    }
    if (!hasText(prompt.expectedSignal)) blockers.push(`prompt ${prompt.promptId || "(missing)"} expectedSignal is required`);
  }

  return {
    blockers,
    warnings,
    promptReadiness,
    metricEligiblePromptIds
  };
}

export function getProjectSetupDraftMaterializationDecision(
  draft: ProjectSetupDraft
): ProjectSetupDraftMaterializationDecision {
  const validation = validateProjectSetupDraft(draft);
  const blockers = [...validation.blockers];

  if (!isApprovedReviewStatus(draft.reviewStatus)) blockers.push("draft_review_status_not_approved");
  if (draft.confidenceScore < MIN_DRAFT_CONFIDENCE_SCORE) blockers.push("draft_confidence_below_materialization_threshold");

  for (const item of draft.personas) {
    if (!isApprovedReviewStatus(item.reviewStatus)) blockers.push(`persona ${item.personaId || "(missing)"} review_status_not_approved`);
  }
  for (const item of draft.topics) {
    if (!isApprovedReviewStatus(item.reviewStatus)) blockers.push(`topic ${item.topicId || "(missing)"} review_status_not_approved`);
  }
  for (const item of draft.prompts) {
    if (!isApprovedReviewStatus(item.reviewStatus)) blockers.push(`prompt ${item.promptId || "(missing)"} review_status_not_approved`);
  }
  for (const item of draft.competitors) {
    if (!isApprovedReviewStatus(item.reviewStatus)) blockers.push(`competitor ${item.competitorId || "(missing)"} review_status_not_approved`);
  }
  for (const item of draft.citationAngles) {
    if (!isApprovedReviewStatus(item.reviewStatus)) blockers.push(`citation angle ${item.angleId || "(missing)"} review_status_not_approved`);
  }
  for (const item of draft.pageImprovementAngles) {
    if (!isApprovedReviewStatus(item.reviewStatus)) blockers.push(`page improvement angle ${item.angleId || "(missing)"} review_status_not_approved`);
  }
  for (const readiness of validation.promptReadiness) {
    for (const blocker of readiness.blockers) {
      blockers.push(`prompt ${readiness.promptId || "(missing)"} ${blocker}`);
    }
  }

  return {
    materializationReady: blockers.length === 0,
    blockers: uniqueStrings(blockers),
    validation
  };
}

export function isApprovedReviewStatus(status: DraftReviewStatus) {
  return status === "approved";
}

export function getBrandIdentityFromDraft(draft: ProjectSetupDraft): BrandIdentityForDraft {
  return {
    brandName: draft.seedInput.brandName,
    serviceName: draft.seedInput.serviceName,
    aliases: draft.seedInput.brandAliases,
    officialSiteUrl: draft.seedInput.officialSiteUrl
  };
}

function collectMetricEligiblePromptIds(readiness: readonly PromptMeasurementReadiness[]): MetricEligiblePromptIds {
  const result: MetricEligiblePromptIds = {
    visibilityRate: [],
    ranking: [],
    shareOfVoice: [],
    sentiment: [],
    brandPerception: [],
    citationCheck: []
  };

  for (const item of readiness) {
    if (item.metricEligibility.visibilityRate === "eligible") result.visibilityRate.push(item.promptId);
    if (item.metricEligibility.ranking === "eligible") result.ranking.push(item.promptId);
    if (item.metricEligibility.shareOfVoice === "eligible") result.shareOfVoice.push(item.promptId);
    if (item.metricEligibility.sentiment === "eligible") result.sentiment.push(item.promptId);
    if (item.metricEligibility.brandPerception === "eligible") result.brandPerception.push(item.promptId);
    if (item.metricEligibility.citationCheck === "eligible") result.citationCheck.push(item.promptId);
  }

  return result;
}

function buildPromptMetricEligibilityReasons(
  prompt: PromptDraft,
  context: {
    brandingMode: PromptBrandingMode;
    hasBrandSignal: boolean;
    isBrandOptional: boolean;
    isSentimentLike: boolean;
    isCitationLike: boolean;
    responseSupportsMarketMetrics: boolean;
    visibilityOpportunity: boolean;
    rankingOpportunity: boolean;
    visibilityRate: PromptMetricState;
    ranking: PromptMetricState;
    sentiment: PromptMetricState;
    brandPerception: PromptMetricState;
    citationCheck: PromptMetricState;
  }
) {
  const reasons: string[] = [];

  if (context.hasBrandSignal) reasons.push("brand_signal_present_excluded_from_visibility_ranking_sov");
  if (context.isBrandOptional) reasons.push("brand_optional_prompt_must_be_split");
  if (prompt.intent === "comparison" && context.hasBrandSignal) reasons.push("comparison_prompt_contains_brand_signal");
  if (context.isSentimentLike && context.hasBrandSignal) reasons.push("branded_sentiment_or_perception_prompt");
  if (context.isCitationLike) reasons.push("citation_or_evidence_prompt_separated_from_ranking");
  if (!context.responseSupportsMarketMetrics && !context.isSentimentLike && !context.isCitationLike) {
    reasons.push("response_shape_not_candidate_or_ranking_oriented");
  }
  if (!context.visibilityOpportunity && context.visibilityRate === "excluded") {
    reasons.push("candidate_mention_opportunity_not_direct_or_likely");
  }
  if (!context.rankingOpportunity && context.ranking === "excluded") {
    reasons.push("ranking_opportunity_not_direct_or_comparable_set");
  }
  if (context.visibilityRate === "eligible") reasons.push("eligible_non_branded_candidate_mention_prompt");
  if (context.ranking === "eligible") reasons.push("eligible_non_branded_ranking_prompt");
  if (context.sentiment === "eligible") reasons.push("eligible_branded_sentiment_prompt");
  if (context.brandPerception === "eligible") reasons.push("eligible_branded_perception_prompt");
  if (context.citationCheck === "eligible") reasons.push("eligible_citation_check_prompt");

  return uniqueStrings(reasons);
}

function isSentimentOrBrandPerceptionPrompt(prompt: PromptDraft) {
  return (
    prompt.intent === "sentiment" ||
    prompt.intent === "brand_perception" ||
    prompt.intent === "branded" ||
    prompt.category === "branded" ||
    prompt.responseShape === "branded_sentiment_answer" ||
    prompt.intentType === "reputational"
  );
}

function supportsMarketMetricResponseShape(responseShape: PromptResponseShape) {
  return (
    responseShape === "candidate_list" ||
    responseShape === "ranked_recommendation" ||
    responseShape === "comparative_set"
  );
}

function hasAnyEligibleMetric(metricEligibility: PromptMetricEligibility) {
  return (
    metricEligibility.visibilityRate === "eligible" ||
    metricEligibility.ranking === "eligible" ||
    metricEligibility.shareOfVoice === "eligible" ||
    metricEligibility.sentiment === "eligible" ||
    metricEligibility.brandPerception === "eligible" ||
    metricEligibility.citationCheck === "eligible"
  );
}

function getBrandSignals(brandIdentity: BrandIdentityForDraft) {
  return uniqueStrings([
    brandIdentity.brandName,
    brandIdentity.serviceName,
    brandIdentity.domain,
    brandIdentity.officialSiteUrl ? extractHostname(brandIdentity.officialSiteUrl) : null,
    ...(brandIdentity.aliases ?? [])
  ]
    .filter((value): value is string => typeof value === "string")
    .map(normalizeBrandSignal)
    .filter((value) => value.length >= 2));
}

function normalizeBrandSignal(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
}

function extractHostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function isLikelyHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function addDuplicateBlockers(blockers: string[], values: readonly string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!hasText(value)) continue;
    if (seen.has(value)) blockers.push(`${label} must be unique: ${value}`);
    seen.add(value);
  }
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values));
}
