import type {
  BrandIdentityForDraft,
  PromptDraft,
  TopicType
} from "./project-setup-draft";
import type {
  RecoraMeasurementPurpose,
  RecoraPromptScope,
  RecoraPromptType
} from "./prompt-scope";

export const RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION =
  "recora_prompt_measurement_contract_v1" as const;

export const RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY = {
  layer: "business_operations_foundation",
  capability: "prompt_measurement_design",
  consumes: [
    "customer_project_context",
    "onboarding_confirmation",
    "tenant_authorization",
    "entitlement_snapshot",
    "analysis_target_version",
    "brand_identity_version"
  ],
  produces: ["measurement_design_version"],
  doesNotOwn: [
    "provider_execution",
    "queue_retry",
    "answer_citation_analysis",
    "quality_decision",
    "publication_decision",
    "customer_screen_state",
    "administrator_screen_state",
    "authentication",
    "tenant_foundation",
    "audit_foundation"
  ]
} as const;

export const RECORA_PROMPT_BRAND_SCOPES = [
  "brand_excluded",
  "self_branded",
  "named_comparison",
  "competitor_only",
  "brand_optional"
] as const;

export const RECORA_QUESTION_FAMILIES = [
  "market_discovery",
  "category_discovery",
  "problem_solution",
  "alternative_search",
  "competitor_comparison",
  "pricing_reputation",
  "implementation_operation",
  "citation_evidence",
  "branded_perception",
  "local_regional",
  "regulated_risk"
] as const;

export const RECORA_QUESTION_ACTS = [
  "discover_candidates",
  "request_shortlist",
  "request_ranking",
  "compare_candidates",
  "ask_evaluation_criteria",
  "assess_fit",
  "assess_reputation",
  "assess_risk",
  "verify_claim",
  "request_sources",
  "ask_explanation"
] as const;

export const RECORA_PROMPT_RESPONSE_SHAPES = [
  "candidate_list",
  "ranked_recommendation",
  "comparative_set",
  "evaluation_criteria",
  "explanatory_answer",
  "evidence_answer",
  "branded_sentiment_answer"
] as const;

export const RECORA_PROMPT_LANGUAGE_MODES = [
  "natural_conversation",
  "raw_search_like",
  "anxious_user",
  "comparison_shortcut",
  "professional_research"
] as const;

export const RECORA_BUYER_STAGES = [
  "awareness",
  "exploration",
  "comparison",
  "validation",
  "decision"
] as const;

export const RECORA_COMPETITOR_SEED_POLICIES = [
  "no_competitor",
  "named_competitors",
  "category_competitors",
  "unknown_competitor_discovery"
] as const;

export const RECORA_PROMPT_TEMPORAL_CLASSES = [
  "evergreen",
  "seasonal",
  "event_bound",
  "volatile_dynamic"
] as const;

export const RECORA_PROMPT_VARIANT_ROLES = [
  "canonical",
  "robustness",
  "diagnostic",
  "control"
] as const;

export const RECORA_PROMPT_PANEL_ROLES = [
  "core",
  "discovery",
  "robustness",
  "diagnostic",
  "seasonal",
  "event"
] as const;

export const RECORA_INTENT_CELL_STATUSES = [
  "candidate",
  "validated",
  "ready",
  "held",
  "retired",
  "rejected",
  "superseded"
] as const;

export const RECORA_PROMPT_REVISION_STATUSES = [
  "candidate",
  "validated",
  "ready",
  "held",
  "retired",
  "rejected",
  "superseded"
] as const;

export const RECORA_PROMPT_SET_VERSION_STATUSES = [
  "draft",
  "validating",
  "ready",
  "frozen",
  "superseded",
  "retired"
] as const;

export const RECORA_EXECUTION_PROFILE_STATUSES = [
  "candidate",
  "ready",
  "retired"
] as const;

export const RECORA_EXECUTION_PROFILE_SET_VERSION_STATUSES = [
  "draft",
  "validating",
  "ready",
  "frozen",
  "superseded",
  "retired"
] as const;

export const RECORA_MEASUREMENT_POLICY_BUNDLE_VERSION_STATUSES = [
  "draft",
  "validating",
  "ready",
  "frozen",
  "superseded",
  "retired"
] as const;

export const RECORA_MEASUREMENT_DESIGN_VERSION_STATUSES = [
  "draft",
  "validating",
  "ready",
  "active",
  "held",
  "rejected",
  "superseded",
  "retired"
] as const;

export const RECORA_VALID_RESPONSE_STATUSES = [
  "valid_answer",
  "empty_answer",
  "refusal",
  "provider_error",
  "timeout",
  "invalid_payload",
  "cancelled"
] as const;

export const RECORA_PROMPT_METRIC_KEYS = [
  "visibility",
  "ranking",
  "sov",
  "sentiment",
  "brandPerception",
  "naturalCitationObservation",
  "forcedCitationValidation",
  "riskCheck",
  "recommendationInput"
] as const;

export type RecoraPromptBrandScope =
  typeof RECORA_PROMPT_BRAND_SCOPES[number];
export type RecoraQuestionFamily =
  typeof RECORA_QUESTION_FAMILIES[number];
export type RecoraQuestionAct = typeof RECORA_QUESTION_ACTS[number];
export type RecoraPromptTemporalClass =
  typeof RECORA_PROMPT_TEMPORAL_CLASSES[number];
export type RecoraPromptVariantRole =
  typeof RECORA_PROMPT_VARIANT_ROLES[number];
export type RecoraPromptPanelRole =
  typeof RECORA_PROMPT_PANEL_ROLES[number];
export type RecoraIntentCellStatus =
  typeof RECORA_INTENT_CELL_STATUSES[number];
export type RecoraPromptRevisionStatus =
  typeof RECORA_PROMPT_REVISION_STATUSES[number];
export type RecoraPromptSetVersionStatus =
  typeof RECORA_PROMPT_SET_VERSION_STATUSES[number];
export type RecoraExecutionProfileStatus =
  typeof RECORA_EXECUTION_PROFILE_STATUSES[number];
export type RecoraExecutionProfileSetVersionStatus =
  typeof RECORA_EXECUTION_PROFILE_SET_VERSION_STATUSES[number];
export type RecoraMeasurementPolicyBundleVersionStatus =
  typeof RECORA_MEASUREMENT_POLICY_BUNDLE_VERSION_STATUSES[number];
export type RecoraMeasurementDesignVersionStatus =
  typeof RECORA_MEASUREMENT_DESIGN_VERSION_STATUSES[number];
export type RecoraValidResponseStatus =
  typeof RECORA_VALID_RESPONSE_STATUSES[number];
export type RecoraPromptMetricKey = typeof RECORA_PROMPT_METRIC_KEYS[number];
export type RecoraPromptMetricState = "eligible" | "excluded";
export type RecoraPromptMetricEligibilityAuthority =
  | "explicit_contract"
  | "legacy_explicit"
  | "compatibility_inferred";
export type RecoraPromptQualityScoreSource =
  | "calculated"
  | "template_prior"
  | "legacy_unknown";
export type RecoraPromptProfileId =
  | "design_preview_lite_8"
  | "design_preview_standard_16"
  | "design_preview_deep_32"
  | "measurement_profile_experimental_50"
  | "measurement_profile_experimental_100"
  | "measurement_profile_experimental_200";

export type RecoraPromptMetricEligibility = {
  visibility: RecoraPromptMetricState;
  ranking: RecoraPromptMetricState;
  sov: RecoraPromptMetricState;
  sentiment: RecoraPromptMetricState;
  brandPerception: RecoraPromptMetricState;
  naturalCitationObservation: RecoraPromptMetricState;
  forcedCitationValidation: RecoraPromptMetricState;
  riskCheck: RecoraPromptMetricState;
  recommendationInput: RecoraPromptMetricState;
  reasons: readonly string[];
};

type ContractVersion = typeof RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION;
type PromptResponseShape = PromptDraft["responseShape"];
type BuyerStage = PromptDraft["buyerStage"];

export type RecoraIntentCellRevisionContract = {
  contractVersion: ContractVersion;
  intentCellId: string;
  intentCellRevisionId: string;
  revisionNumber: number;
  projectId: string;
  personaRevisionId: string;
  primaryTopicRevisionId: string;
  secondaryTopicRevisionIds: readonly string[];
  buyerStage: BuyerStage;
  locale: string;
  regionScope: string | null;
  intentSummary: string;
  expectedSignalTypes: readonly string[];
  businessPriority: number | null;
  trackingScope: boolean;
  improvementScope: boolean;
  status: RecoraIntentCellStatus;
  contentHash: string;
  supersedesIntentCellRevisionId: string | null;
};

export type RecoraIntentCellContract = RecoraIntentCellRevisionContract;

export type RecoraPromptRevisionContract = {
  contractVersion: ContractVersion;
  promptId: string;
  promptRevisionId: string;
  promptVersion: number;
  intentCellId: string;
  intentCellRevisionId: string;
  text: string;
  contentHash: string;
  brandScope: RecoraPromptBrandScope;
  questionFamily: RecoraQuestionFamily;
  questionAct: RecoraQuestionAct;
  responseShape: PromptResponseShape;
  languageMode: PromptDraft["languageMode"];
  buyerStage: BuyerStage;
  temporalClass: RecoraPromptTemporalClass;
  variantRole: RecoraPromptVariantRole;
  competitorSeedPolicy: PromptDraft["competitorMentionRule"];
  candidateMentionOpportunity: PromptDraft["candidateMentionOpportunity"];
  rankingOpportunity: PromptDraft["rankingOpportunity"];
  expectedSignals: readonly string[];
  metricEligibility: RecoraPromptMetricEligibility;
  metricEligibilityAuthority: RecoraPromptMetricEligibilityAuthority;
  sourceStatus: PromptDraft["sourceStatus"] | "legacy_explicit";
  seedContaminationRisk: PromptDraft["seedContaminationRisk"];
  confidenceScore: number | null;
  qualityScore: number | null;
  qualityScoreSource: RecoraPromptQualityScoreSource;
  riskFlags: readonly string[];
  lifecycleStatus: RecoraPromptRevisionStatus;
  supersedesPromptRevisionId: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type RecoraPromptRevisionContractCandidate = Omit<
  RecoraPromptRevisionContract,
  | "promptRevisionId"
  | "promptVersion"
  | "intentCellId"
  | "intentCellRevisionId"
  | "contentHash"
> & {
  legacyPromptId: string;
  promptRevisionId: null;
  promptVersion: null;
  intentCellId: null;
  intentCellRevisionId: null;
  contentHash: null;
};

export type RecoraPromptSetMembershipContract = {
  contractVersion: ContractVersion;
  membershipId: string;
  promptSetVersionId: string;
  promptRevisionId: string;
  intentCellId: string;
  intentCellRevisionId: string;
  panelRole: RecoraPromptPanelRole;
  variantRole: RecoraPromptVariantRole;
  sortOrder: number;
  businessWeight: number | null;
  inclusionReason: string;
};

export type RecoraPromptSetVersionContract = {
  contractVersion: ContractVersion;
  promptSetId: string;
  promptSetVersionId: string;
  versionLabel: string;
  panelProfileVersionId: RecoraPromptProfileId;
  status: RecoraPromptSetVersionStatus;
  compilerVersion: string;
  semanticClustererVersion: string;
  contentHash: string;
  validatedAt: string | null;
  frozenAt: string | null;
  supersedesPromptSetVersionId: string | null;
};

export type RecoraExecutionProfileContract = {
  contractVersion: ContractVersion;
  executionProfileId: string;
  provider: string;
  surface: string;
  requestedModel: string;
  modelVersionPolicy: string;
  systemPromptVersion: string;
  executionTemplateVersion: string;
  webSearchMode: string;
  searchActivationPolicy: string;
  liveOrCached: "live" | "cached" | "mixed" | "not_applicable";
  locale: string;
  region: string | null;
  domainFilters: readonly string[];
  searchBudget: number | null;
  accountOrSessionCondition: string;
  providerConfigurationSchemaVersion: string;
  contentHash: string;
  status: RecoraExecutionProfileStatus;
};

export type RecoraExecutionProfileSetVersionContract = {
  contractVersion: ContractVersion;
  executionProfileSetId: string;
  executionProfileSetVersionId: string;
  versionLabel: string;
  status: RecoraExecutionProfileSetVersionStatus;
  contentHash: string;
  validatedAt: string | null;
  frozenAt: string | null;
  supersedesExecutionProfileSetVersionId: string | null;
};

export type RecoraExecutionProfileSetMembershipContract = {
  contractVersion: ContractVersion;
  membershipId: string;
  executionProfileSetVersionId: string;
  executionProfileId: string;
  sortOrder: number;
  requiredForFormalMeasurement: boolean;
  requiredForPublicationCoverage: boolean;
  plannedObservationWeight: number | null;
  membershipReason: string;
};

export type RecoraMeasurementPolicyBundleVersionContract = {
  contractVersion: ContractVersion;
  measurementPolicyBundleVersionId: string;
  versionLabel: string;
  status: RecoraMeasurementPolicyBundleVersionStatus;
  metricDefinitionVersion: string;
  validResponsePolicyVersion: string;
  aggregationPolicyVersion: string;
  repeatPolicyVersion: string;
  compatibilityPolicyVersion: string;
  contentHash: string;
  validatedAt: string | null;
  frozenAt: string | null;
  supersedesMeasurementPolicyBundleVersionId: string | null;
};

export type RecoraMeasurementDesignVersionContract = {
  contractVersion: ContractVersion;
  measurementDesignId: string;
  measurementDesignVersionId: string;
  versionNumber: number;
  status: RecoraMeasurementDesignVersionStatus;
  analysisTargetVersionId: string;
  brandIdentityVersionId: string;
  promptSetVersionId: string;
  executionProfileSetVersionId: string;
  panelProfileVersionId: RecoraPromptProfileId;
  measurementPolicyBundleVersionId: string;
  entitlementSnapshotId: string;
  sourceEvidenceBundleId: string;
  contentHash: string;
  supersedesMeasurementDesignVersionId: string | null;
  rollbackOfMeasurementDesignVersionId: string | null;
  createdAt: string;
  validatedAt: string | null;
  readyAt: string | null;
  activatedAt: string | null;
  supersededAt: string | null;
  retiredAt: string | null;
};

export type RecoraPromptProfileDefinition = {
  id: RecoraPromptProfileId;
  kind: "design_preview" | "experimental_measurement";
  targetTotal: number;
  coreCanonical: number | null;
  robustness: number | null;
  diagnostic: number | null;
  productionMeasurementEligible: boolean;
  experimental: boolean;
};

export type RecoraContractValidationResult = {
  valid: boolean;
  blockers: readonly string[];
  warnings: readonly string[];
};

export type RecoraCompatibilityAdapterResult<T> = {
  status: "needs_contract_fields" | "manual_review" | "blocked";
  value: T;
  missingFields: readonly string[];
  warnings: readonly string[];
  reviewReasons: readonly string[];
};

export type RecoraPromptRevisionIdentityContext = {
  brandIdentity: BrandIdentityForDraft;
  knownCompetitors?: readonly string[];
  knownCompetitorAliases?: readonly string[];
};

export type LegacyPromptDraftAdapterContext =
  RecoraPromptRevisionIdentityContext & {
    topicType?: TopicType | null;
    temporalClass?: RecoraPromptTemporalClass;
    variantRole?: RecoraPromptVariantRole;
  };

export type RecoraPromptSetCompilationContract = {
  contractVersion: ContractVersion;
  promptSetVersion: RecoraPromptSetVersionContract;
  intentCells: readonly RecoraIntentCellRevisionContract[];
  promptRevisions: readonly RecoraPromptRevisionContract[];
  memberships: readonly RecoraPromptSetMembershipContract[];
};

export type RecoraExecutionProfileSetCompilationContract = {
  contractVersion: ContractVersion;
  executionProfileSetVersion: RecoraExecutionProfileSetVersionContract;
  executionProfiles: readonly RecoraExecutionProfileContract[];
  memberships: readonly RecoraExecutionProfileSetMembershipContract[];
};

export type RecoraMeasurementDesignCompilationContract = {
  contractVersion: ContractVersion;
  measurementDesignVersion: RecoraMeasurementDesignVersionContract;
  promptSetCompilation: RecoraPromptSetCompilationContract;
  executionProfileSetCompilation: RecoraExecutionProfileSetCompilationContract;
  measurementPolicyBundleVersion: RecoraMeasurementPolicyBundleVersionContract;
};

export type RecoraLegacyPromptScopeCandidate = {
  contractVersion: ContractVersion;
  legacyPromptType: RecoraPromptType | null;
  legacyMeasurementPurpose: RecoraMeasurementPurpose | null;
  legacyScopeStatus: RecoraPromptScope["status"];
  brandScope: RecoraPromptBrandScope | null;
  questionFamily: RecoraQuestionFamily | null;
  primaryPurposeHint: RecoraMeasurementPurpose | null;
  metricEligibility: RecoraPromptMetricEligibility;
  metricEligibilityAuthority: "compatibility_inferred";
};

export type RecoraLegacyScopeProjectionResult = {
  status: "projected" | "blocked";
  scope: RecoraPromptScope;
  warnings: readonly string[];
};

export const RECORA_PROMPT_PROFILE_DEFINITIONS = [
  profile("design_preview_lite_8", 8),
  profile("design_preview_standard_16", 16),
  profile("design_preview_deep_32", 32),
  profile("measurement_profile_experimental_50", 50, 38, 8, 4),
  profile("measurement_profile_experimental_100", 100, 70, 20, 10),
  profile("measurement_profile_experimental_200", 200, 130, 45, 25)
] as const satisfies readonly RecoraPromptProfileDefinition[];

export function createExcludedPromptMetricEligibility(
  reasons: readonly string[] = []
): RecoraPromptMetricEligibility {
  return {
    visibility: "excluded",
    ranking: "excluded",
    sov: "excluded",
    sentiment: "excluded",
    brandPerception: "excluded",
    naturalCitationObservation: "excluded",
    forcedCitationValidation: "excluded",
    riskCheck: "excluded",
    recommendationInput: "excluded",
    reasons: uniqueStrings(reasons)
  };
}

export function getRecoraPromptProfileDefinition(
  id: RecoraPromptProfileId
): RecoraPromptProfileDefinition {
  const definition = RECORA_PROMPT_PROFILE_DEFINITIONS.find(
    (item) => item.id === id
  );
  if (!definition) throw new Error(`Unknown Recora prompt profile: ${id}`);
  return definition;
}

export function validateIntentCellContract(
  value: RecoraIntentCellRevisionContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["intent_cell_id", value.intentCellId],
    ["intent_cell_revision_id", value.intentCellRevisionId],
    ["project_id", value.projectId],
    ["persona_revision_id", value.personaRevisionId],
    ["primary_topic_revision_id", value.primaryTopicRevisionId],
    ["locale", value.locale],
    ["intent_summary", value.intentSummary],
    ["content_hash", value.contentHash]
  ]);
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  validatePositiveVersionNumber(
    blockers,
    value.revisionNumber,
    "intent_cell_revision_number_invalid"
  );
  if (value.expectedSignalTypes.length === 0) {
    blockers.push("expected_signal_types_missing");
  }
  if (
    new Set(value.secondaryTopicRevisionIds).size !==
      value.secondaryTopicRevisionIds.length ||
    value.secondaryTopicRevisionIds.includes(value.primaryTopicRevisionId)
  ) {
    blockers.push("topic_mapping_invalid");
  }
  if (
    value.businessPriority != null &&
    (!Number.isFinite(value.businessPriority) ||
      value.businessPriority < 0 ||
      value.businessPriority > 100)
  ) {
    blockers.push("business_priority_invalid");
  }
  if (value.status === "ready" && !value.trackingScope) {
    blockers.push("ready_intent_cell_requires_tracking_scope");
  }
  if (
    value.revisionNumber > 1 &&
    !hasText(value.supersedesIntentCellRevisionId)
  ) {
    blockers.push("intent_cell_revision_requires_supersedes");
  }
  if (
    value.supersedesIntentCellRevisionId === value.intentCellRevisionId &&
    hasText(value.supersedesIntentCellRevisionId)
  ) {
    blockers.push("intent_cell_revision_cannot_supersede_itself");
  }
  if (value.improvementScope && !value.trackingScope) {
    warnings.push("improvement_scope_without_tracking_scope_requires_review");
  }

  return validationResult(blockers, warnings);
}

export function validatePromptRevisionContract(
  value: RecoraPromptRevisionContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["prompt_id", value.promptId],
    ["prompt_revision_id", value.promptRevisionId],
    ["intent_cell_id", value.intentCellId],
    ["intent_cell_revision_id", value.intentCellRevisionId],
    ["prompt_text", value.text],
    ["content_hash", value.contentHash]
  ]);
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  validatePositiveVersionNumber(
    blockers,
    value.promptVersion,
    "prompt_version_invalid"
  );
  if (value.expectedSignals.length === 0) blockers.push("expected_signals_missing");
  validateScore(blockers, value.qualityScore);
  validateScore(blockers, value.confidenceScore);
  validateRevisionDates(value, blockers, warnings);

  const marketEligible = hasMarketMetricEligibility(value.metricEligibility);
  const forcedCitation = isForcedCitationRevision(value);

  if (value.brandScope === "brand_optional") {
    blockers.push("brand_optional_must_be_split_before_production");
  }
  if (
    value.brandScope === "named_comparison" &&
    value.questionAct !== "compare_candidates"
  ) {
    blockers.push("named_comparison_requires_compare_act");
  }
  if (marketEligible && value.brandScope !== "brand_excluded") {
    blockers.push("market_metrics_require_brand_excluded_scope");
  }
  if (
    marketEligible &&
    ["medium", "high"].includes(value.seedContaminationRisk)
  ) {
    blockers.push("market_metrics_reject_seed_contamination");
  }
  if (
    value.metricEligibility.visibility === "eligible" &&
    (!supportsMarketMetricResponseShape(value.responseShape) ||
      !["direct", "likely"].includes(value.candidateMentionOpportunity))
  ) {
    blockers.push("visibility_eligibility_invalid");
  }
  if (
    value.metricEligibility.ranking === "eligible" &&
    (!supportsMarketMetricResponseShape(value.responseShape) ||
      !["direct", "comparable_set"].includes(value.rankingOpportunity))
  ) {
    blockers.push("ranking_eligibility_invalid");
  }
  if (
    value.metricEligibility.sov === "eligible" &&
    value.metricEligibility.visibility !== "eligible"
  ) {
    blockers.push("sov_requires_visibility_eligibility");
  }
  if (
    [
      "evaluation_criteria",
      "explanatory_answer",
      "evidence_answer",
      "branded_sentiment_answer"
    ].includes(value.responseShape) &&
    marketEligible
  ) {
    blockers.push("non_market_response_shape_in_market_metrics");
  }
  if (
    (value.metricEligibility.sentiment === "eligible" ||
      value.metricEligibility.brandPerception === "eligible") &&
    value.brandScope !== "self_branded"
  ) {
    blockers.push("brand_metrics_require_self_branded_scope");
  }
  if (forcedCitation && marketEligible) {
    blockers.push("forced_citation_prompt_in_market_metrics");
  }
  if (
    (forcedCitation &&
      value.metricEligibility.forcedCitationValidation !== "eligible") ||
    (!forcedCitation &&
      value.metricEligibility.forcedCitationValidation === "eligible")
  ) {
    blockers.push("forced_citation_eligibility_invalid");
  }
  if (
    value.metricEligibility.naturalCitationObservation === "eligible" &&
    value.metricEligibility.forcedCitationValidation === "eligible"
  ) {
    blockers.push("natural_and_forced_citation_must_be_separate");
  }

  if (value.lifecycleStatus === "ready") {
    if (!hasAnyEligibleMetric(value.metricEligibility)) {
      blockers.push("ready_revision_requires_eligible_analysis");
    }
    if (value.metricEligibilityAuthority !== "explicit_contract") {
      blockers.push("ready_revision_requires_explicit_eligibility");
    }
    if (!["provided", "legacy_explicit"].includes(value.sourceStatus)) {
      blockers.push("ready_revision_requires_explicit_source_status");
    }
    if (
      value.qualityScoreSource !== "calculated" ||
      value.qualityScore == null
    ) {
      blockers.push("ready_revision_requires_calculated_quality");
    }
    if (!hasText(value.effectiveFrom)) {
      blockers.push("ready_revision_effective_from_missing");
    }
    if (value.metricEligibility.reasons.length === 0) {
      blockers.push("ready_revision_eligibility_reasons_missing");
    }
    if (value.promptVersion > 1 && !hasText(value.supersedesPromptRevisionId)) {
      blockers.push("ready_revision_version_requires_supersedes");
    }
  }

  if (value.metricEligibilityAuthority !== "explicit_contract") {
    warnings.push("metric_eligibility_not_authoritative");
  }
  if (value.qualityScoreSource !== "calculated") {
    warnings.push("quality_score_not_calculated");
  }

  return validationResult(blockers, warnings);
}

export function validatePromptRevisionIdentityContext(
  value: RecoraPromptRevisionContract,
  context: RecoraPromptRevisionIdentityContext
): RecoraContractValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const normalizedText = normalizeIdentity(value.text);
  const targetSignals = identitySignals(context.brandIdentity);
  const competitorSignals = uniqueStrings([
    ...(context.knownCompetitors ?? []),
    ...(context.knownCompetitorAliases ?? [])
  ])
    .map(normalizeIdentity)
    .filter((signal) => signal.length >= 2);
  const targetPresent = targetSignals.some((signal) =>
    normalizedText.includes(signal)
  );
  const competitorPresent = competitorSignals.some((signal) =>
    normalizedText.includes(signal)
  );

  if (targetSignals.length === 0) {
    warnings.push("target_brand_identity_context_missing");
  }
  if (
    ["competitor_only", "named_comparison"].includes(value.brandScope) &&
    competitorSignals.length === 0
  ) {
    blockers.push("known_competitor_identity_context_missing");
  }
  if (value.brandScope === "brand_excluded" && targetPresent) {
    blockers.push("target_brand_signal_in_brand_excluded_text");
  }
  if (value.brandScope === "self_branded" && !targetPresent) {
    blockers.push("self_branded_text_missing_target_brand");
  }
  if (value.brandScope === "competitor_only" && targetPresent) {
    blockers.push("competitor_only_contains_target_brand");
  }
  if (
    value.brandScope === "competitor_only" &&
    competitorSignals.length > 0 &&
    !competitorPresent
  ) {
    blockers.push("competitor_only_text_missing_known_competitor");
  }
  if (
    value.brandScope === "named_comparison" &&
    !targetPresent &&
    !competitorPresent
  ) {
    blockers.push("named_comparison_text_missing_named_entity");
  }
  if (
    hasMarketMetricEligibility(value.metricEligibility) &&
    competitorPresent
  ) {
    blockers.push("known_competitor_signal_in_market_prompt");
  }

  return validationResult(blockers, warnings);
}

export function validatePromptSetMembershipContract(
  value: RecoraPromptSetMembershipContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["membership_id", value.membershipId],
    ["prompt_set_version_id", value.promptSetVersionId],
    ["prompt_revision_id", value.promptRevisionId],
    ["intent_cell_id", value.intentCellId],
    ["intent_cell_revision_id", value.intentCellRevisionId]
  ]);
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0) {
    blockers.push("sort_order_invalid");
  }
  if (value.businessWeight != null && value.businessWeight <= 0) {
    blockers.push("business_weight_invalid");
  }
  if (!hasText(value.inclusionReason)) {
    warnings.push("inclusion_reason_missing");
  }
  if (value.panelRole === "core" && value.variantRole !== "canonical") {
    blockers.push("core_requires_canonical");
  }
  if (
    value.panelRole === "robustness" &&
    value.variantRole !== "robustness"
  ) {
    blockers.push("robustness_requires_robustness_variant");
  }
  if (
    value.panelRole === "diagnostic" &&
    !["diagnostic", "control"].includes(value.variantRole)
  ) {
    blockers.push("diagnostic_role_invalid");
  }

  return validationResult(blockers, warnings);
}

export function validatePromptSetVersionContract(
  value: RecoraPromptSetVersionContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["prompt_set_id", value.promptSetId],
    ["prompt_set_version_id", value.promptSetVersionId],
    ["version_label", value.versionLabel],
    ["compiler_version", value.compilerVersion],
    ["semantic_clusterer_version", value.semanticClustererVersion],
    ["content_hash", value.contentHash]
  ]);
  const warnings: string[] = [];
  const finalized = ["ready", "frozen"].includes(value.status);

  validateContractVersion(blockers, value.contractVersion);
  if (finalized && !hasText(value.validatedAt)) {
    blockers.push("finalized_prompt_set_requires_validated_at");
  }
  if (value.status === "frozen") {
    if (!hasText(value.frozenAt)) blockers.push("frozen_at_missing");
    if (
      !getRecoraPromptProfileDefinition(value.panelProfileVersionId)
        .productionMeasurementEligible
    ) {
      blockers.push("frozen_set_requires_measurement_profile");
    }
  }
  if (
    !getRecoraPromptProfileDefinition(value.panelProfileVersionId)
      .productionMeasurementEligible
  ) {
    warnings.push("design_preview_profile");
  }
  if (
    value.supersedesPromptSetVersionId === value.promptSetVersionId &&
    hasText(value.supersedesPromptSetVersionId)
  ) {
    blockers.push("prompt_set_version_cannot_supersede_itself");
  }

  return validationResult(blockers, warnings);
}

export function validateExecutionProfileContract(
  value: RecoraExecutionProfileContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["execution_profile_id", value.executionProfileId],
    ["provider", value.provider],
    ["surface", value.surface],
    ["requested_model", value.requestedModel],
    ["model_version_policy", value.modelVersionPolicy],
    ["system_prompt_version", value.systemPromptVersion],
    ["execution_template_version", value.executionTemplateVersion],
    ["web_search_mode", value.webSearchMode],
    ["search_activation_policy", value.searchActivationPolicy],
    ["locale", value.locale],
    ["account_or_session_condition", value.accountOrSessionCondition],
    [
      "provider_configuration_schema_version",
      value.providerConfigurationSchemaVersion
    ],
    ["content_hash", value.contentHash]
  ]);
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  if (
    value.searchBudget != null &&
    (!Number.isInteger(value.searchBudget) || value.searchBudget < 0)
  ) {
    blockers.push("search_budget_invalid");
  }
  if (value.liveOrCached === "mixed") {
    warnings.push("mixed_cache_mode_requires_compatibility_rule");
  }
  if (new Set(value.domainFilters).size !== value.domainFilters.length) {
    blockers.push("duplicate_domain_filter");
  }

  return validationResult(blockers, warnings);
}

export function validateExecutionProfileSetVersionContract(
  value: RecoraExecutionProfileSetVersionContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["execution_profile_set_id", value.executionProfileSetId],
    [
      "execution_profile_set_version_id",
      value.executionProfileSetVersionId
    ],
    ["version_label", value.versionLabel],
    ["content_hash", value.contentHash]
  ]);
  const warnings: string[] = [];
  const finalized = ["ready", "frozen"].includes(value.status);

  validateContractVersion(blockers, value.contractVersion);
  if (finalized && !hasText(value.validatedAt)) {
    blockers.push("finalized_execution_profile_set_requires_validated_at");
  }
  if (value.status === "frozen" && !hasText(value.frozenAt)) {
    blockers.push("frozen_execution_profile_set_requires_frozen_at");
  }
  if (
    value.supersedesExecutionProfileSetVersionId ===
      value.executionProfileSetVersionId &&
    hasText(value.supersedesExecutionProfileSetVersionId)
  ) {
    blockers.push("execution_profile_set_cannot_supersede_itself");
  }

  return validationResult(blockers, warnings);
}

export function validateExecutionProfileSetMembershipContract(
  value: RecoraExecutionProfileSetMembershipContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["membership_id", value.membershipId],
    [
      "execution_profile_set_version_id",
      value.executionProfileSetVersionId
    ],
    ["execution_profile_id", value.executionProfileId]
  ]);
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0) {
    blockers.push("execution_profile_sort_order_invalid");
  }
  if (
    value.plannedObservationWeight != null &&
    (!Number.isFinite(value.plannedObservationWeight) ||
      value.plannedObservationWeight <= 0)
  ) {
    blockers.push("planned_observation_weight_invalid");
  }
  if (!hasText(value.membershipReason)) {
    warnings.push("execution_profile_membership_reason_missing");
  }

  return validationResult(blockers, warnings);
}

export function validateMeasurementPolicyBundleVersionContract(
  value: RecoraMeasurementPolicyBundleVersionContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    [
      "measurement_policy_bundle_version_id",
      value.measurementPolicyBundleVersionId
    ],
    ["version_label", value.versionLabel],
    ["metric_definition_version", value.metricDefinitionVersion],
    ["valid_response_policy_version", value.validResponsePolicyVersion],
    ["aggregation_policy_version", value.aggregationPolicyVersion],
    ["repeat_policy_version", value.repeatPolicyVersion],
    ["compatibility_policy_version", value.compatibilityPolicyVersion],
    ["content_hash", value.contentHash]
  ]);
  const warnings: string[] = [];
  const finalized = ["ready", "frozen"].includes(value.status);

  validateContractVersion(blockers, value.contractVersion);
  if (finalized && !hasText(value.validatedAt)) {
    blockers.push("finalized_policy_bundle_requires_validated_at");
  }
  if (value.status === "frozen" && !hasText(value.frozenAt)) {
    blockers.push("frozen_policy_bundle_requires_frozen_at");
  }
  if (
    value.supersedesMeasurementPolicyBundleVersionId ===
      value.measurementPolicyBundleVersionId &&
    hasText(value.supersedesMeasurementPolicyBundleVersionId)
  ) {
    blockers.push("policy_bundle_cannot_supersede_itself");
  }

  return validationResult(blockers, warnings);
}

export function validateMeasurementDesignVersionContract(
  value: RecoraMeasurementDesignVersionContract
): RecoraContractValidationResult {
  const blockers = requiredFields([
    ["measurement_design_id", value.measurementDesignId],
    ["measurement_design_version_id", value.measurementDesignVersionId],
    ["analysis_target_version_id", value.analysisTargetVersionId],
    ["brand_identity_version_id", value.brandIdentityVersionId],
    ["prompt_set_version_id", value.promptSetVersionId],
    [
      "execution_profile_set_version_id",
      value.executionProfileSetVersionId
    ],
    ["panel_profile_version_id", value.panelProfileVersionId],
    [
      "measurement_policy_bundle_version_id",
      value.measurementPolicyBundleVersionId
    ],
    ["entitlement_snapshot_id", value.entitlementSnapshotId],
    ["source_evidence_bundle_id", value.sourceEvidenceBundleId],
    ["content_hash", value.contentHash],
    ["created_at", value.createdAt]
  ]);
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  validatePositiveVersionNumber(
    blockers,
    value.versionNumber,
    "measurement_design_version_number_invalid"
  );
  validateTimestampField(blockers, value.createdAt, "created_at_invalid");
  validateOptionalTimestampField(
    blockers,
    value.validatedAt,
    "validated_at_invalid"
  );
  validateOptionalTimestampField(blockers, value.readyAt, "ready_at_invalid");
  validateOptionalTimestampField(
    blockers,
    value.activatedAt,
    "activated_at_invalid"
  );
  validateOptionalTimestampField(
    blockers,
    value.supersededAt,
    "superseded_at_invalid"
  );
  validateOptionalTimestampField(
    blockers,
    value.retiredAt,
    "retired_at_invalid"
  );

  if (["ready", "active"].includes(value.status)) {
    if (!hasText(value.validatedAt)) {
      blockers.push("ready_design_requires_validated_at");
    }
    if (!hasText(value.readyAt)) blockers.push("ready_design_requires_ready_at");
  }
  if (value.status === "active" && !hasText(value.activatedAt)) {
    blockers.push("active_design_requires_activated_at");
  }
  if (
    value.versionNumber > 1 &&
    !hasText(value.supersedesMeasurementDesignVersionId)
  ) {
    blockers.push("measurement_design_version_requires_supersedes");
  }
  if (
    value.supersedesMeasurementDesignVersionId ===
      value.measurementDesignVersionId &&
    hasText(value.supersedesMeasurementDesignVersionId)
  ) {
    blockers.push("measurement_design_version_cannot_supersede_itself");
  }
  if (
    value.rollbackOfMeasurementDesignVersionId ===
      value.measurementDesignVersionId &&
    hasText(value.rollbackOfMeasurementDesignVersionId)
  ) {
    blockers.push("measurement_design_version_cannot_rollback_itself");
  }
  if (
    value.status === "superseded" &&
    !hasText(value.supersededAt)
  ) {
    warnings.push("superseded_design_missing_superseded_at");
  }
  if (value.status === "retired" && !hasText(value.retiredAt)) {
    warnings.push("retired_design_missing_retired_at");
  }

  return validationResult(blockers, warnings);
}

export function validatePromptSetCompilationContract(
  value: RecoraPromptSetCompilationContract
): RecoraContractValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  appendValidation(
    blockers,
    warnings,
    "prompt_set_version",
    value.promptSetVersion.promptSetVersionId,
    validatePromptSetVersionContract(value.promptSetVersion)
  );

  const intentCells = new Map<string, RecoraIntentCellRevisionContract>();
  const revisions = new Map<string, RecoraPromptRevisionContract>();

  for (const duplicate of duplicateValues(
    value.intentCells.map((item) => item.intentCellRevisionId)
  )) {
    blockers.push(`duplicate_intent_cell_revision_id:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.promptRevisions.map((item) => item.promptRevisionId)
  )) {
    blockers.push(`duplicate_prompt_revision_id:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.memberships.map((item) => item.membershipId)
  )) {
    blockers.push(`duplicate_membership_id:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.memberships.map((item) => item.promptRevisionId)
  )) {
    blockers.push(`duplicate_prompt_revision_membership:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.memberships.map((item) => String(item.sortOrder))
  )) {
    blockers.push(`duplicate_sort_order:${duplicate}`);
  }

  for (const intentCell of value.intentCells) {
    intentCells.set(intentCell.intentCellRevisionId, intentCell);
    appendValidation(
      blockers,
      warnings,
      "intent_cell",
      intentCell.intentCellRevisionId,
      validateIntentCellContract(intentCell)
    );
  }
  for (const revision of value.promptRevisions) {
    revisions.set(revision.promptRevisionId, revision);
    appendValidation(
      blockers,
      warnings,
      "prompt_revision",
      revision.promptRevisionId,
      validatePromptRevisionContract(revision)
    );
  }

  const coreCountByIntentCellRevision = new Map<string, number>();
  const coreIntentCellRevisions = new Set<string>();
  const robustnessIntentCellRevisions = new Set<string>();
  const roleCounts: Record<"core" | "robustness" | "diagnostic", number> = {
    core: 0,
    robustness: 0,
    diagnostic: 0
  };
  const frozen = value.promptSetVersion.status === "frozen";

  for (const membership of value.memberships) {
    appendValidation(
      blockers,
      warnings,
      "membership",
      membership.membershipId,
      validatePromptSetMembershipContract(membership)
    );
    if (
      membership.promptSetVersionId !==
      value.promptSetVersion.promptSetVersionId
    ) {
      blockers.push(
        `membership_set_version_mismatch:${membership.membershipId}`
      );
    }

    const intentCell = intentCells.get(membership.intentCellRevisionId);
    const revision = revisions.get(membership.promptRevisionId);
    if (!intentCell) {
      blockers.push(
        `membership_unknown_intent_cell_revision:${membership.membershipId}`
      );
    }
    if (!revision) {
      blockers.push(
        `membership_unknown_prompt_revision:${membership.membershipId}`
      );
    }
    if (intentCell && intentCell.intentCellId !== membership.intentCellId) {
      blockers.push(
        `membership_intent_identity_mismatch:${membership.membershipId}`
      );
    }
    if (revision) {
      if (
        revision.intentCellRevisionId !== membership.intentCellRevisionId ||
        revision.intentCellId !== membership.intentCellId
      ) {
        blockers.push(
          `membership_revision_intent_mismatch:${membership.membershipId}`
        );
      }
      if (revision.variantRole !== membership.variantRole) {
        blockers.push(
          `membership_revision_variant_mismatch:${membership.membershipId}`
        );
      }
      if (frozen && revision.lifecycleStatus !== "ready") {
        blockers.push(
          `frozen_membership_revision_not_ready:${membership.membershipId}`
        );
      }
    }
    if (frozen && intentCell && intentCell.status !== "ready") {
      blockers.push(
        `frozen_membership_intent_cell_not_ready:${membership.membershipId}`
      );
    }

    if (membership.panelRole === "core") {
      roleCounts.core += 1;
      coreIntentCellRevisions.add(membership.intentCellRevisionId);
      coreCountByIntentCellRevision.set(
        membership.intentCellRevisionId,
        (coreCountByIntentCellRevision.get(membership.intentCellRevisionId) ??
          0) + 1
      );
    }
    if (membership.panelRole === "robustness") {
      roleCounts.robustness += 1;
      robustnessIntentCellRevisions.add(membership.intentCellRevisionId);
    }
    if (membership.panelRole === "diagnostic") {
      roleCounts.diagnostic += 1;
    }
  }

  for (const [intentCellRevisionId, count] of Array.from(
    coreCountByIntentCellRevision.entries()
  )) {
    if (count !== 1) {
      blockers.push(
        `core_canonical_count_invalid:${intentCellRevisionId}`
      );
    }
  }
  for (const intentCellRevisionId of Array.from(
    robustnessIntentCellRevisions.values()
  )) {
    if (!coreIntentCellRevisions.has(intentCellRevisionId)) {
      blockers.push(
        `robustness_without_core_intent_cell:${intentCellRevisionId}`
      );
    }
  }

  if (frozen) {
    const profile = getRecoraPromptProfileDefinition(
      value.promptSetVersion.panelProfileVersionId
    );
    if (profile.coreCanonical !== roleCounts.core) {
      blockers.push("profile_core_count_mismatch");
    }
    if (profile.robustness !== roleCounts.robustness) {
      blockers.push("profile_robustness_count_mismatch");
    }
    if (profile.diagnostic !== roleCounts.diagnostic) {
      blockers.push("profile_diagnostic_count_mismatch");
    }
    if (
      roleCounts.core + roleCounts.robustness + roleCounts.diagnostic !==
      profile.targetTotal
    ) {
      blockers.push("profile_base_total_mismatch");
    }
  }

  return validationResult(blockers, warnings);
}

export function validateExecutionProfileSetCompilationContract(
  value: RecoraExecutionProfileSetCompilationContract
): RecoraContractValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  appendValidation(
    blockers,
    warnings,
    "execution_profile_set_version",
    value.executionProfileSetVersion.executionProfileSetVersionId,
    validateExecutionProfileSetVersionContract(
      value.executionProfileSetVersion
    )
  );

  const profiles = new Map<string, RecoraExecutionProfileContract>();
  for (const duplicate of duplicateValues(
    value.executionProfiles.map((item) => item.executionProfileId)
  )) {
    blockers.push(`duplicate_execution_profile_id:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.memberships.map((item) => item.membershipId)
  )) {
    blockers.push(`duplicate_execution_membership_id:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.memberships.map((item) => item.executionProfileId)
  )) {
    blockers.push(`duplicate_execution_profile_membership:${duplicate}`);
  }
  for (const duplicate of duplicateValues(
    value.memberships.map((item) => String(item.sortOrder))
  )) {
    blockers.push(`duplicate_execution_sort_order:${duplicate}`);
  }

  for (const profile of value.executionProfiles) {
    profiles.set(profile.executionProfileId, profile);
    appendValidation(
      blockers,
      warnings,
      "execution_profile",
      profile.executionProfileId,
      validateExecutionProfileContract(profile)
    );
  }

  let formalRequiredCount = 0;
  let publicationRequiredCount = 0;
  const frozen = value.executionProfileSetVersion.status === "frozen";

  for (const membership of value.memberships) {
    appendValidation(
      blockers,
      warnings,
      "execution_membership",
      membership.membershipId,
      validateExecutionProfileSetMembershipContract(membership)
    );
    if (
      membership.executionProfileSetVersionId !==
      value.executionProfileSetVersion.executionProfileSetVersionId
    ) {
      blockers.push(
        `execution_membership_set_version_mismatch:${membership.membershipId}`
      );
    }
    const profile = profiles.get(membership.executionProfileId);
    if (!profile) {
      blockers.push(
        `execution_membership_unknown_profile:${membership.membershipId}`
      );
    } else if (frozen && profile.status !== "ready") {
      blockers.push(
        `frozen_execution_membership_profile_not_ready:${membership.membershipId}`
      );
    }
    if (membership.requiredForFormalMeasurement) formalRequiredCount += 1;
    if (membership.requiredForPublicationCoverage) {
      publicationRequiredCount += 1;
    }
  }

  if (frozen && value.memberships.length === 0) {
    blockers.push("frozen_execution_profile_set_requires_membership");
  }
  if (frozen && formalRequiredCount === 0) {
    blockers.push("frozen_execution_profile_set_requires_formal_profile");
  }
  if (frozen && publicationRequiredCount === 0) {
    warnings.push("no_execution_profile_required_for_publication_coverage");
  }

  return validationResult(blockers, warnings);
}

export function validateMeasurementDesignCompilationContract(
  value: RecoraMeasurementDesignCompilationContract
): RecoraContractValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  validateContractVersion(blockers, value.contractVersion);
  appendValidation(
    blockers,
    warnings,
    "measurement_design_version",
    value.measurementDesignVersion.measurementDesignVersionId,
    validateMeasurementDesignVersionContract(value.measurementDesignVersion)
  );
  appendValidation(
    blockers,
    warnings,
    "prompt_set_compilation",
    value.promptSetCompilation.promptSetVersion.promptSetVersionId,
    validatePromptSetCompilationContract(value.promptSetCompilation)
  );
  appendValidation(
    blockers,
    warnings,
    "execution_profile_set_compilation",
    value.executionProfileSetCompilation.executionProfileSetVersion
      .executionProfileSetVersionId,
    validateExecutionProfileSetCompilationContract(
      value.executionProfileSetCompilation
    )
  );
  appendValidation(
    blockers,
    warnings,
    "measurement_policy_bundle",
    value.measurementPolicyBundleVersion.measurementPolicyBundleVersionId,
    validateMeasurementPolicyBundleVersionContract(
      value.measurementPolicyBundleVersion
    )
  );

  const design = value.measurementDesignVersion;
  const promptSet = value.promptSetCompilation.promptSetVersion;
  const executionSet =
    value.executionProfileSetCompilation.executionProfileSetVersion;
  const policy = value.measurementPolicyBundleVersion;

  if (design.promptSetVersionId !== promptSet.promptSetVersionId) {
    blockers.push("design_prompt_set_version_mismatch");
  }
  if (
    design.executionProfileSetVersionId !==
    executionSet.executionProfileSetVersionId
  ) {
    blockers.push("design_execution_profile_set_version_mismatch");
  }
  if (
    design.measurementPolicyBundleVersionId !==
    policy.measurementPolicyBundleVersionId
  ) {
    blockers.push("design_policy_bundle_version_mismatch");
  }
  if (design.panelProfileVersionId !== promptSet.panelProfileVersionId) {
    blockers.push("design_panel_profile_version_mismatch");
  }

  if (design.status === "active") {
    if (promptSet.status !== "frozen") {
      blockers.push("active_design_requires_frozen_prompt_set");
    }
    if (executionSet.status !== "frozen") {
      blockers.push("active_design_requires_frozen_execution_profile_set");
    }
    if (policy.status !== "frozen") {
      blockers.push("active_design_requires_frozen_policy_bundle");
    }
  }

  return validationResult(blockers, warnings);
}

export function adaptLegacyPromptDraftToContractCandidate(
  prompt: PromptDraft,
  context: LegacyPromptDraftAdapterContext
): RecoraCompatibilityAdapterResult<RecoraPromptRevisionContractCandidate> {
  const warnings = [
    "legacy_prompt_requires_intent_cell_and_revision",
    "legacy_eligibility_is_proposed",
    "legacy_adapter_is_migration_inspection_only"
  ];
  const reviewReasons: string[] = [];
  const missingFields = [
    "promptRevisionId",
    "promptVersion",
    "intentCellId",
    "intentCellRevisionId",
    "contentHash",
    "calculatedQualityScore"
  ];

  if (!hasText(prompt.promptId)) {
    reviewReasons.push("legacy_prompt_id_missing");
    missingFields.push("promptId");
  }

  const brandScope = deriveLegacyBrandScope(
    prompt,
    context,
    warnings,
    reviewReasons
  );
  const questionFamily = deriveLegacyQuestionFamily(
    prompt,
    context.topicType,
    reviewReasons
  );
  const questionAct = deriveLegacyQuestionAct(prompt);

  if (prompt.sourceStatus !== "provided" || prompt.reviewStatus !== "approved") {
    reviewReasons.push("legacy_prompt_not_explicitly_approved");
  }
  if (prompt.gateDecision !== "ready_for_measurement") {
    reviewReasons.push(`legacy_prompt_gate_${prompt.gateDecision}`);
  }
  if (["medium", "high"].includes(prompt.seedContaminationRisk)) {
    reviewReasons.push("seed_contamination_review");
  }

  const value: RecoraPromptRevisionContractCandidate = {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    legacyPromptId: prompt.promptId,
    promptId: prompt.promptId || "legacy-prompt-missing-id",
    promptRevisionId: null,
    promptVersion: null,
    intentCellId: null,
    intentCellRevisionId: null,
    contentHash: null,
    text: prompt.text,
    brandScope,
    questionFamily,
    questionAct,
    responseShape: prompt.responseShape,
    languageMode: prompt.languageMode,
    buyerStage: prompt.buyerStage,
    temporalClass:
      context.temporalClass ??
      (prompt.category === "pricing_reputation"
        ? "volatile_dynamic"
        : "evergreen"),
    variantRole: context.variantRole ?? deriveLegacyVariantRole(prompt),
    competitorSeedPolicy: prompt.competitorMentionRule,
    candidateMentionOpportunity: prompt.candidateMentionOpportunity,
    rankingOpportunity: prompt.rankingOpportunity,
    expectedSignals: prompt.expectedSignal ? [prompt.expectedSignal] : [],
    metricEligibility: deriveLegacyMetricEligibility(
      prompt,
      brandScope,
      questionFamily,
      questionAct
    ),
    metricEligibilityAuthority: "compatibility_inferred",
    sourceStatus: prompt.sourceStatus,
    seedContaminationRisk: prompt.seedContaminationRisk,
    confidenceScore: prompt.confidenceScore,
    qualityScore: prompt.qualityScore,
    qualityScoreSource: "template_prior",
    riskFlags: prompt.riskFlags,
    lifecycleStatus: "candidate",
    supersedesPromptRevisionId: null,
    effectiveFrom: null,
    effectiveTo: null
  };

  const status =
    brandScope === "brand_optional" || prompt.gateDecision === "reject"
      ? "blocked"
      : reviewReasons.length > 0
        ? "manual_review"
        : "needs_contract_fields";

  return {
    status,
    value,
    missingFields: uniqueStrings(missingFields),
    warnings: uniqueStrings(warnings),
    reviewReasons: uniqueStrings(reviewReasons)
  };
}

export function adaptLegacyPromptScopeToContractCandidate(
  scope: RecoraPromptScope
): RecoraCompatibilityAdapterResult<RecoraLegacyPromptScopeCandidate> {
  const reviewReasons = [
    scope.status !== "explicit" ? `legacy_scope_${scope.status}` : "",
    !scope.promptType ? "prompt_type_missing" : "",
    !scope.measurementPurpose ? "purpose_missing" : ""
  ].filter(Boolean);

  return {
    status:
      reviewReasons.length > 0 ? "manual_review" : "needs_contract_fields",
    value: {
      contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
      legacyPromptType: scope.promptType,
      legacyMeasurementPurpose: scope.measurementPurpose,
      legacyScopeStatus: scope.status,
      brandScope: legacyPromptTypeToBrandScope(scope.promptType),
      questionFamily: legacyPromptTypeToQuestionFamily(scope.promptType),
      primaryPurposeHint: scope.measurementPurpose,
      metricEligibility: createExcludedPromptMetricEligibility([
        "legacy_scope_insufficient"
      ]),
      metricEligibilityAuthority: "compatibility_inferred"
    },
    missingFields: [
      "promptText",
      "promptRevisionId",
      "intentCellRevisionId",
      "responseShape",
      "opportunityFields"
    ],
    warnings: [
      "legacy_scope_never_confers_official_eligibility",
      "legacy_adapter_is_migration_inspection_only"
    ],
    reviewReasons
  };
}

export function projectPromptRevisionToLegacyScope(
  revision: RecoraPromptRevisionContract,
  primaryPurpose: RecoraMeasurementPurpose | null = null
): RecoraLegacyScopeProjectionResult {
  const validation = validatePromptRevisionContract(revision);
  if (!validation.valid) {
    return blockedLegacyProjection([
      "target_contract_invalid",
      ...validation.blockers
    ]);
  }
  if (
    revision.lifecycleStatus !== "ready" ||
    revision.metricEligibilityAuthority !== "explicit_contract"
  ) {
    return blockedLegacyProjection([
      "projection_requires_ready_explicit_revision"
    ]);
  }

  const promptType = projectLegacyPromptType(revision);
  const representablePurposes = getRepresentableLegacyPurposes(
    revision.metricEligibility
  );
  const warnings = [
    "lossy_projection",
    "legacy_projection_is_compatibility_read_only"
  ];
  const genericMarketMismatch =
    promptType === "comparison_generic" &&
    hasMarketMetricEligibility(revision.metricEligibility);

  if (genericMarketMismatch) {
    warnings.push("legacy_generic_comparison_not_market_eligible");
  }

  let measurementPurpose = primaryPurpose;
  if (
    measurementPurpose &&
    !representablePurposes.includes(measurementPurpose)
  ) {
    warnings.push("selected_purpose_not_eligible");
    measurementPurpose = null;
  } else if (!measurementPurpose && representablePurposes.length === 1) {
    measurementPurpose = representablePurposes[0];
  } else if (!measurementPurpose && representablePurposes.length > 1) {
    warnings.push("multiple_purposes_require_selection");
  }

  if (
    genericMarketMismatch &&
    measurementPurpose &&
    ["visibility", "ranking", "sov"].includes(measurementPurpose)
  ) {
    measurementPurpose = null;
    warnings.push("legacy_generic_comparison_market_purpose_omitted");
  }
  if (
    revision.metricEligibility.naturalCitationObservation === "eligible" ||
    revision.metricEligibility.riskCheck === "eligible"
  ) {
    warnings.push("target_metrics_not_representable");
  }
  if (measurementPurpose && representablePurposes.length > 1) {
    warnings.push("other_eligible_purposes_omitted");
  }

  return {
    status: "projected",
    scope: {
      promptType,
      measurementPurpose,
      status: "explicit",
      notes: warnings
    },
    warnings
  };
}

function profile(
  id: RecoraPromptProfileId,
  targetTotal: number,
  coreCanonical: number | null = null,
  robustness: number | null = null,
  diagnostic: number | null = null
): RecoraPromptProfileDefinition {
  const productionMeasurementEligible = coreCanonical != null;
  return {
    id,
    kind: productionMeasurementEligible
      ? "experimental_measurement"
      : "design_preview",
    targetTotal,
    coreCanonical,
    robustness,
    diagnostic,
    productionMeasurementEligible,
    experimental: productionMeasurementEligible
  };
}

function deriveLegacyBrandScope(
  prompt: PromptDraft,
  context: LegacyPromptDraftAdapterContext,
  warnings: string[],
  reviewReasons: string[]
): RecoraPromptBrandScope {
  if (
    prompt.brandMentionRule === "brand_optional" ||
    prompt.brandingMode === "brand_optional"
  ) {
    return "brand_optional";
  }

  const normalizedText = normalizeIdentity(prompt.text);
  const targetSignals = identitySignals(context.brandIdentity);
  const competitorSignals = uniqueStrings([
    ...(context.knownCompetitors ?? []),
    ...(context.knownCompetitorAliases ?? [])
  ])
    .map(normalizeIdentity)
    .filter((signal) => signal.length >= 2);
  const targetPresent = targetSignals.some((signal) =>
    normalizedText.includes(signal)
  );
  const competitorPresent = competitorSignals.some((signal) =>
    normalizedText.includes(signal)
  );
  const declaredSelfBranded =
    prompt.brandingMode === "branded" ||
    prompt.brandMentionRule === "brand_included";
  const declaredBrandExcluded =
    prompt.brandingMode === "non_branded" &&
    prompt.brandMentionRule === "brand_excluded";
  const declaredNamedCompetitor =
    prompt.competitorMentionRule === "named_competitors";

  if (declaredSelfBranded && !targetPresent) {
    reviewReasons.push("brand_included_metadata_without_target_signal");
  }
  if (declaredBrandExcluded && targetPresent) {
    reviewReasons.push("target_brand_signal_in_brand_excluded_prompt");
  }
  if (
    prompt.competitorMentionRule === "no_competitor" &&
    competitorPresent
  ) {
    reviewReasons.push("known_competitor_signal_with_no_competitor_policy");
  }
  if (declaredNamedCompetitor && competitorSignals.length === 0) {
    warnings.push("named_competitor_identity_missing");
  }

  if (targetPresent && (competitorPresent || declaredNamedCompetitor)) {
    reviewReasons.push("named_comparison_review");
    return "named_comparison";
  }
  if (targetPresent || declaredSelfBranded) return "self_branded";
  if (
    competitorPresent ||
    declaredNamedCompetitor ||
    prompt.brandingMode === "competitor_only" ||
    prompt.brandMentionRule === "competitor_only"
  ) {
    reviewReasons.push("competitor_entity_review");
    return "competitor_only";
  }
  return "brand_excluded";
}

function deriveLegacyQuestionFamily(
  prompt: PromptDraft,
  topicType: TopicType | null | undefined,
  reviewReasons: string[]
): RecoraQuestionFamily {
  const topicMap: Record<TopicType, RecoraQuestionFamily | null> = {
    market_discovery_topic: "market_discovery",
    problem_solution_topic: "problem_solution",
    category_discovery_topic: "category_discovery",
    competitor_comparison_topic: "competitor_comparison",
    alternative_search_topic: "alternative_search",
    pricing_reputation_topic: "pricing_reputation",
    citation_evidence_topic: "citation_evidence",
    branded_sentiment_topic: "branded_perception",
    persona_specific_topic: null,
    local_regional_topic: "local_regional",
    regulated_risk_topic: "regulated_risk"
  };

  if (topicType && topicMap[topicType]) {
    return topicMap[topicType] as RecoraQuestionFamily;
  }

  const categoryMap: Partial<
    Record<PromptDraft["category"], RecoraQuestionFamily>
  > = {
    branded: "branded_perception",
    competitor_comparison: "competitor_comparison",
    problem_solution: "problem_solution",
    alternative_search: "alternative_search",
    pricing_reputation: "pricing_reputation",
    citation_check: "citation_evidence"
  };
  if (categoryMap[prompt.category]) {
    return categoryMap[prompt.category] as RecoraQuestionFamily;
  }
  if (prompt.category === "persona_based") {
    if (prompt.intentType === "risk_checking") {
      return "implementation_operation";
    }
    reviewReasons.push("persona_family_review");
  }
  if (prompt.intent === "problem_aware") return "problem_solution";
  if (["candidate_list", "ranked_recommendation"].includes(prompt.responseShape)) {
    return "category_discovery";
  }
  return "market_discovery";
}

function deriveLegacyQuestionAct(prompt: PromptDraft): RecoraQuestionAct {
  if (
    prompt.responseShape === "evidence_answer" ||
    prompt.intent === "citation_check"
  ) {
    return "request_sources";
  }
  if (prompt.responseShape === "branded_sentiment_answer") {
    return prompt.intent === "brand_perception"
      ? "assess_fit"
      : "assess_reputation";
  }
  if (prompt.responseShape === "ranked_recommendation") {
    return "request_ranking";
  }
  if (prompt.responseShape === "candidate_list") return "request_shortlist";
  if (prompt.responseShape === "comparative_set") {
    return "compare_candidates";
  }
  if (prompt.responseShape === "evaluation_criteria") {
    return prompt.intentType === "risk_checking"
      ? "assess_risk"
      : "ask_evaluation_criteria";
  }
  if (prompt.intentType === "risk_checking") return "assess_risk";
  if (prompt.intentType === "reputational") return "assess_reputation";
  return "ask_explanation";
}

function deriveLegacyMetricEligibility(
  prompt: PromptDraft,
  brandScope: RecoraPromptBrandScope,
  questionFamily: RecoraQuestionFamily,
  questionAct: RecoraQuestionAct
): RecoraPromptMetricEligibility {
  if (prompt.gateDecision === "reject") {
    return createExcludedPromptMetricEligibility(["rejected"]);
  }

  const forcedCitation =
    questionAct === "request_sources" ||
    questionFamily === "citation_evidence" ||
    prompt.responseShape === "evidence_answer";
  const marketBase =
    brandScope === "brand_excluded" &&
    !forcedCitation &&
    supportsMarketMetricResponseShape(prompt.responseShape) &&
    ["none", "low"].includes(prompt.seedContaminationRisk);
  const visibility =
    marketBase &&
    ["direct", "likely"].includes(prompt.candidateMentionOpportunity);
  const ranking =
    marketBase &&
    ["direct", "comparable_set"].includes(prompt.rankingOpportunity);
  const sentiment =
    brandScope === "self_branded" &&
    (questionFamily === "branded_perception" ||
      prompt.responseShape === "branded_sentiment_answer");
  const riskCheck =
    prompt.intentType === "risk_checking" ||
    ["regulated_risk", "implementation_operation"].includes(questionFamily);
  const recommendationInput =
    visibility ||
    ranking ||
    sentiment ||
    forcedCitation ||
    riskCheck ||
    [
      "ask_evaluation_criteria",
      "ask_explanation",
      "compare_candidates"
    ].includes(questionAct);

  return {
    visibility: metricState(visibility),
    ranking: metricState(ranking),
    sov: metricState(visibility),
    sentiment: metricState(sentiment),
    brandPerception: metricState(sentiment),
    naturalCitationObservation: metricState(
      !forcedCitation && brandScope !== "brand_optional"
    ),
    forcedCitationValidation: metricState(forcedCitation),
    riskCheck: metricState(riskCheck),
    recommendationInput: metricState(recommendationInput),
    reasons: ["compatibility_inferred"]
  };
}

function deriveLegacyVariantRole(
  prompt: PromptDraft
): RecoraPromptVariantRole {
  return prompt.category === "citation_check" ||
    prompt.category === "branded" ||
    prompt.brandingMode !== "non_branded"
    ? "diagnostic"
    : "canonical";
}

function legacyPromptTypeToBrandScope(
  promptType: RecoraPromptType | null
): RecoraPromptBrandScope | null {
  if (promptType === "branded") return "self_branded";
  if (promptType === "comparison_named") return "named_comparison";
  if (promptType === "competitor_named") return "competitor_only";
  return promptType ? "brand_excluded" : null;
}

function legacyPromptTypeToQuestionFamily(
  promptType: RecoraPromptType | null
): RecoraQuestionFamily | null {
  if (promptType === "branded") return "branded_perception";
  if (
    ["comparison_generic", "comparison_named", "competitor_named"].includes(
      promptType ?? ""
    )
  ) {
    return "competitor_comparison";
  }
  if (promptType === "citation_check") return "citation_evidence";
  if (promptType === "non_branded") return "market_discovery";
  return null;
}

function projectLegacyPromptType(
  revision: RecoraPromptRevisionContract
): RecoraPromptType {
  if (isForcedCitationRevision(revision)) return "citation_check";
  if (revision.brandScope === "self_branded") return "branded";
  if (revision.brandScope === "named_comparison") return "comparison_named";
  if (revision.brandScope === "competitor_only") return "competitor_named";
  if (
    revision.questionFamily === "competitor_comparison" ||
    revision.questionAct === "compare_candidates"
  ) {
    return "comparison_generic";
  }
  return "non_branded";
}

function getRepresentableLegacyPurposes(
  value: RecoraPromptMetricEligibility
): RecoraMeasurementPurpose[] {
  const pairs: readonly [RecoraPromptMetricKey, RecoraMeasurementPurpose][] = [
    ["visibility", "visibility"],
    ["ranking", "ranking"],
    ["sov", "sov"],
    ["sentiment", "sentiment"],
    ["brandPerception", "brand_perception"],
    ["forcedCitationValidation", "citation_validation"],
    ["recommendationInput", "recommendation_input"]
  ];
  return pairs
    .filter(([key]) => value[key] === "eligible")
    .map(([, purpose]) => purpose);
}

function identitySignals(value: BrandIdentityForDraft): string[] {
  return uniqueStrings([
    value.brandName,
    value.serviceName,
    value.domain,
    value.officialSiteUrl ? extractHostname(value.officialSiteUrl) : null,
    ...(value.aliases ?? [])
  ])
    .map(normalizeIdentity)
    .filter((signal) => signal.length >= 2);
}

function blockedLegacyProjection(
  warnings: string[]
): RecoraLegacyScopeProjectionResult {
  return {
    status: "blocked",
    scope: {
      promptType: null,
      measurementPurpose: null,
      status: "missing",
      notes: warnings
    },
    warnings
  };
}

function isForcedCitationRevision(
  value: RecoraPromptRevisionContract
): boolean {
  return (
    value.questionAct === "request_sources" ||
    value.questionFamily === "citation_evidence" ||
    value.responseShape === "evidence_answer"
  );
}

function hasMarketMetricEligibility(
  value: RecoraPromptMetricEligibility
): boolean {
  return [value.visibility, value.ranking, value.sov].includes("eligible");
}

function hasAnyEligibleMetric(
  value: RecoraPromptMetricEligibility
): boolean {
  return RECORA_PROMPT_METRIC_KEYS.some(
    (key) => value[key] === "eligible"
  );
}

function supportsMarketMetricResponseShape(
  value: PromptResponseShape
): boolean {
  return [
    "candidate_list",
    "ranked_recommendation",
    "comparative_set"
  ].includes(value);
}

function metricState(value: boolean): RecoraPromptMetricState {
  return value ? "eligible" : "excluded";
}

function validateRevisionDates(
  value: RecoraPromptRevisionContract,
  blockers: string[],
  warnings: string[]
): void {
  const effectiveFrom = parseTimestamp(value.effectiveFrom);
  const effectiveTo = parseTimestamp(value.effectiveTo);

  if (value.effectiveFrom && effectiveFrom == null) {
    blockers.push("effective_from_invalid");
  }
  if (value.effectiveTo && effectiveTo == null) {
    blockers.push("effective_to_invalid");
  }
  if (
    effectiveFrom != null &&
    effectiveTo != null &&
    effectiveTo <= effectiveFrom
  ) {
    blockers.push("effective_interval_invalid");
  }
  if (
    value.supersedesPromptRevisionId === value.promptRevisionId &&
    hasText(value.supersedesPromptRevisionId)
  ) {
    blockers.push("prompt_revision_cannot_supersede_itself");
  }
  if (
    value.lifecycleStatus === "superseded" &&
    !hasText(value.effectiveTo)
  ) {
    warnings.push("superseded_revision_effective_to_missing");
  }
}

function validateScore(blockers: string[], value: number | null): void {
  if (
    value != null &&
    (!Number.isFinite(value) || value < 0 || value > 100)
  ) {
    blockers.push("score_out_of_range");
  }
}

function validatePositiveVersionNumber(
  blockers: string[],
  value: number,
  reasonCode: string
): void {
  if (!Number.isInteger(value) || value < 1) blockers.push(reasonCode);
}

function validateTimestampField(
  blockers: string[],
  value: string,
  reasonCode: string
): void {
  if (!hasText(value) || parseTimestamp(value) == null) blockers.push(reasonCode);
}

function validateOptionalTimestampField(
  blockers: string[],
  value: string | null,
  reasonCode: string
): void {
  if (value != null && parseTimestamp(value) == null) blockers.push(reasonCode);
}

function requiredFields(
  entries: readonly (readonly [string, string | null | undefined])[]
): string[] {
  return entries
    .filter(([, value]) => !hasText(value))
    .map(([name]) => `${name}_missing`);
}

function validateContractVersion(blockers: string[], value: string): void {
  if (value !== RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION) {
    blockers.push("contract_version_mismatch");
  }
}

function appendValidation(
  blockers: string[],
  warnings: string[],
  entityType: string,
  entityId: string,
  result: RecoraContractValidationResult
): void {
  for (const blocker of result.blockers) {
    blockers.push(`${entityType}:${entityId}:${blocker}`);
  }
  for (const warning of result.warnings) {
    warnings.push(`${entityType}:${entityId}:${warning}`);
  }
}

function validationResult(
  blockers: string[],
  warnings: string[]
): RecoraContractValidationResult {
  const uniqueBlockers = uniqueStrings(blockers);
  const uniqueWarnings = uniqueStrings(warnings);
  return {
    valid: uniqueBlockers.length === 0,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings
  };
}

function duplicateValues(values: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function extractHostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(
  values: readonly (string | null | undefined)[]
): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      )
    )
  );
}
