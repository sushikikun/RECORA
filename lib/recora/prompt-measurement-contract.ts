import type { BrandIdentityForDraft, PromptDraft, TopicType } from "./project-setup-draft";
import type { RecoraMeasurementPurpose, RecoraPromptScope, RecoraPromptType } from "./prompt-scope";

export const RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION = "recora_prompt_measurement_contract_v1" as const;
export const RECORA_PROMPT_BRAND_SCOPES = ["brand_excluded", "self_branded", "named_comparison", "competitor_only", "brand_optional"] as const;
export const RECORA_QUESTION_FAMILIES = ["market_discovery", "category_discovery", "problem_solution", "alternative_search", "competitor_comparison", "pricing_reputation", "implementation_operation", "citation_evidence", "branded_perception", "local_regional", "regulated_risk"] as const;
export const RECORA_QUESTION_ACTS = ["discover_candidates", "request_shortlist", "request_ranking", "compare_candidates", "ask_evaluation_criteria", "assess_fit", "assess_reputation", "assess_risk", "verify_claim", "request_sources", "ask_explanation"] as const;
export const RECORA_PROMPT_RESPONSE_SHAPES = ["candidate_list", "ranked_recommendation", "comparative_set", "evaluation_criteria", "explanatory_answer", "evidence_answer", "branded_sentiment_answer"] as const;
export const RECORA_PROMPT_LANGUAGE_MODES = ["natural_conversation", "raw_search_like", "anxious_user", "comparison_shortcut", "professional_research"] as const;
export const RECORA_BUYER_STAGES = ["awareness", "exploration", "comparison", "validation", "decision"] as const;
export const RECORA_COMPETITOR_SEED_POLICIES = ["no_competitor", "named_competitors", "category_competitors", "unknown_competitor_discovery"] as const;
export const RECORA_PROMPT_TEMPORAL_CLASSES = ["evergreen", "seasonal", "event_bound", "volatile_dynamic"] as const;
export const RECORA_PROMPT_VARIANT_ROLES = ["canonical", "robustness", "diagnostic", "control"] as const;
export const RECORA_PROMPT_PANEL_ROLES = ["core", "discovery", "robustness", "diagnostic", "seasonal", "event"] as const;
export const RECORA_PROMPT_REVISION_STATUSES = ["candidate", "validated", "active", "held", "retired", "rejected", "superseded"] as const;
export const RECORA_PROMPT_SET_VERSION_STATUSES = ["draft", "validating", "active", "frozen", "superseded", "retired"] as const;
export const RECORA_VALID_RESPONSE_STATUSES = ["valid_answer", "empty_answer", "refusal", "provider_error", "timeout", "invalid_payload", "cancelled"] as const;
export const RECORA_PROMPT_METRIC_KEYS = ["visibility", "ranking", "sov", "sentiment", "brandPerception", "naturalCitationObservation", "forcedCitationValidation", "riskCheck", "recommendationInput"] as const;

export type RecoraPromptBrandScope = typeof RECORA_PROMPT_BRAND_SCOPES[number];
export type RecoraQuestionFamily = typeof RECORA_QUESTION_FAMILIES[number];
export type RecoraQuestionAct = typeof RECORA_QUESTION_ACTS[number];
export type RecoraPromptTemporalClass = typeof RECORA_PROMPT_TEMPORAL_CLASSES[number];
export type RecoraPromptVariantRole = typeof RECORA_PROMPT_VARIANT_ROLES[number];
export type RecoraPromptPanelRole = typeof RECORA_PROMPT_PANEL_ROLES[number];
export type RecoraPromptRevisionStatus = typeof RECORA_PROMPT_REVISION_STATUSES[number];
export type RecoraPromptSetVersionStatus = typeof RECORA_PROMPT_SET_VERSION_STATUSES[number];
export type RecoraValidResponseStatus = typeof RECORA_VALID_RESPONSE_STATUSES[number];
export type RecoraPromptMetricKey = typeof RECORA_PROMPT_METRIC_KEYS[number];
export type RecoraPromptMetricState = "eligible" | "excluded";
export type RecoraPromptMetricEligibility = Record<RecoraPromptMetricKey, RecoraPromptMetricState> & { reasons: readonly string[] };
export type RecoraPromptMetricEligibilityAuthority = "explicit_contract" | "legacy_explicit" | "compatibility_inferred";
export type RecoraPromptQualityScoreSource = "calculated" | "template_prior" | "legacy_unknown";
export type RecoraPromptProfileId = "design_preview_lite_8" | "design_preview_standard_16" | "design_preview_deep_32" | "measurement_profile_experimental_50" | "measurement_profile_experimental_100" | "measurement_profile_experimental_200";

type Version = typeof RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION;
type Shape = PromptDraft["responseShape"];
type Stage = PromptDraft["buyerStage"];
type Metric = RecoraPromptMetricEligibility;

export type RecoraIntentCellContract = { contractVersion: Version; intentCellId: string; projectId: string; primaryTopicId: string; secondaryTopicIds: readonly string[]; personaId: string; buyerStage: Stage; locale: string; regionScope: string | null; intentSummary: string; expectedSignalTypes: readonly string[]; businessPriority: number | null; trackingScope: boolean; improvementScope: boolean; status: RecoraPromptRevisionStatus };
export type RecoraPromptRevisionContract = { contractVersion: Version; promptId: string; promptRevisionId: string; promptVersion: number; intentCellId: string; text: string; contentHash: string; brandScope: RecoraPromptBrandScope; questionFamily: RecoraQuestionFamily; questionAct: RecoraQuestionAct; responseShape: Shape; languageMode: PromptDraft["languageMode"]; buyerStage: Stage; temporalClass: RecoraPromptTemporalClass; variantRole: RecoraPromptVariantRole; competitorSeedPolicy: PromptDraft["competitorMentionRule"]; candidateMentionOpportunity: PromptDraft["candidateMentionOpportunity"]; rankingOpportunity: PromptDraft["rankingOpportunity"]; expectedSignals: readonly string[]; metricEligibility: Metric; metricEligibilityAuthority: RecoraPromptMetricEligibilityAuthority; sourceStatus: PromptDraft["sourceStatus"] | "legacy_explicit"; seedContaminationRisk: PromptDraft["seedContaminationRisk"]; confidenceScore: number | null; qualityScore: number | null; qualityScoreSource: RecoraPromptQualityScoreSource; riskFlags: readonly string[]; lifecycleStatus: RecoraPromptRevisionStatus; supersedesPromptRevisionId: string | null; effectiveFrom: string | null; effectiveTo: string | null };
export type RecoraPromptRevisionContractCandidate = Omit<RecoraPromptRevisionContract, "promptRevisionId" | "promptVersion" | "intentCellId" | "contentHash"> & { legacyPromptId: string; promptRevisionId: null; promptVersion: null; intentCellId: null; contentHash: null };
export type RecoraPromptSetMembershipContract = { contractVersion: Version; membershipId: string; promptSetVersionId: string; promptRevisionId: string; intentCellId: string; panelRole: RecoraPromptPanelRole; variantRole: RecoraPromptVariantRole; sortOrder: number; businessWeight: number | null; inclusionReason: string };
export type RecoraPromptSetVersionContract = { contractVersion: Version; promptSetId: string; promptSetVersionId: string; versionLabel: string; profileId: RecoraPromptProfileId; status: RecoraPromptSetVersionStatus; executionProfileId: string; metricDefinitionVersion: string; validResponsePolicyVersion: string; aggregationPolicyVersion: string; repeatPolicyId: string; activatedAt: string | null; frozenAt: string | null; supersedesPromptSetVersionId: string | null };
export type RecoraExecutionProfileContract = { contractVersion: Version; executionProfileId: string; provider: string; surface: string; model: string; modelVersion: string; systemPromptVersion: string; executionTemplateVersion: string; webSearchMode: string; searchActivationPolicy: string; liveOrCached: "live" | "cached" | "mixed" | "not_applicable"; locale: string; region: string | null; domainFilters: readonly string[]; searchBudget: number | null; accountOrSessionCondition: string; repeatPolicyId: string; validResponsePolicyVersion: string; metricDefinitionVersion: string; aggregationPolicyVersion: string };
export type RecoraPromptProfileDefinition = { id: RecoraPromptProfileId; kind: "design_preview" | "experimental_measurement"; targetTotal: number; coreCanonical: number | null; robustness: number | null; diagnostic: number | null; productionMeasurementEligible: boolean; experimental: boolean };
export type RecoraContractValidationResult = { valid: boolean; blockers: readonly string[]; warnings: readonly string[] };
export type RecoraCompatibilityAdapterResult<T> = { status: "needs_contract_fields" | "manual_review" | "blocked"; value: T; missingFields: readonly string[]; warnings: readonly string[]; reviewReasons: readonly string[] };
export type LegacyPromptDraftAdapterContext = { brandIdentity: BrandIdentityForDraft; knownCompetitors?: readonly string[]; knownCompetitorAliases?: readonly string[]; topicType?: TopicType | null; temporalClass?: RecoraPromptTemporalClass; variantRole?: RecoraPromptVariantRole };
export type RecoraLegacyPromptScopeCandidate = { contractVersion: Version; legacyPromptType: RecoraPromptType | null; legacyMeasurementPurpose: RecoraMeasurementPurpose | null; legacyScopeStatus: RecoraPromptScope["status"]; brandScope: RecoraPromptBrandScope | null; questionFamily: RecoraQuestionFamily | null; primaryPurposeHint: RecoraMeasurementPurpose | null; metricEligibility: Metric; metricEligibilityAuthority: "compatibility_inferred" };
export type RecoraLegacyScopeProjectionResult = { status: "projected" | "blocked"; scope: RecoraPromptScope; warnings: readonly string[] };

export const RECORA_PROMPT_PROFILE_DEFINITIONS = [
  profile("design_preview_lite_8", 8), profile("design_preview_standard_16", 16), profile("design_preview_deep_32", 32),
  profile("measurement_profile_experimental_50", 50, 38, 8, 4), profile("measurement_profile_experimental_100", 100, 70, 20, 10),
  profile("measurement_profile_experimental_200", 200, 130, 45, 25)
] as const satisfies readonly RecoraPromptProfileDefinition[];

export function createExcludedPromptMetricEligibility(reasons: readonly string[] = []): Metric {
  return { visibility: "excluded", ranking: "excluded", sov: "excluded", sentiment: "excluded", brandPerception: "excluded", naturalCitationObservation: "excluded", forcedCitationValidation: "excluded", riskCheck: "excluded", recommendationInput: "excluded", reasons: uniq(reasons) };
}
export function getRecoraPromptProfileDefinition(id: RecoraPromptProfileId): RecoraPromptProfileDefinition {
  const found = RECORA_PROMPT_PROFILE_DEFINITIONS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown Recora prompt profile: ${id}`);
  return found;
}
export function validateIntentCellContract(value: RecoraIntentCellContract): RecoraContractValidationResult {
  const blockers = req([["intent_cell_id", value.intentCellId], ["project_id", value.projectId], ["primary_topic_id", value.primaryTopicId], ["persona_id", value.personaId], ["locale", value.locale], ["intent_summary", value.intentSummary]]);
  const warnings: string[] = [];
  version(blockers, value.contractVersion);
  if (!value.expectedSignalTypes.length) blockers.push("expected_signal_types_missing");
  if (new Set(value.secondaryTopicIds).size !== value.secondaryTopicIds.length || value.secondaryTopicIds.includes(value.primaryTopicId)) blockers.push("topic_mapping_invalid");
  if (value.businessPriority != null && (!Number.isFinite(value.businessPriority) || value.businessPriority < 0 || value.businessPriority > 100)) blockers.push("business_priority_invalid");
  if (value.status === "active" && !value.trackingScope) blockers.push("active_intent_cell_requires_tracking_scope");
  if (value.improvementScope && !value.trackingScope) warnings.push("improvement_scope_without_tracking_scope_requires_review");
  return verdict(blockers, warnings);
}
export function validatePromptRevisionContract(value: RecoraPromptRevisionContract): RecoraContractValidationResult {
  const blockers = req([["prompt_id", value.promptId], ["prompt_revision_id", value.promptRevisionId], ["intent_cell_id", value.intentCellId], ["prompt_text", value.text], ["content_hash", value.contentHash]]);
  const warnings: string[] = [];
  version(blockers, value.contractVersion);
  if (!Number.isInteger(value.promptVersion) || value.promptVersion < 1) blockers.push("prompt_version_invalid");
  if (!value.expectedSignals.length) blockers.push("expected_signals_missing");
  boundedScore(blockers, value.qualityScore); boundedScore(blockers, value.confidenceScore);
  const market = marketEligible(value.metricEligibility), forced = forcedCitation(value);
  if (value.brandScope === "brand_optional") blockers.push("brand_optional_must_be_split_before_production");
  if (market && value.brandScope !== "brand_excluded") blockers.push("market_metrics_require_brand_excluded_scope");
  if (market && ["medium", "high"].includes(value.seedContaminationRisk)) blockers.push("market_metrics_reject_seed_contamination");
  if (value.metricEligibility.visibility === "eligible" && (!marketShape(value.responseShape) || !["direct", "likely"].includes(value.candidateMentionOpportunity))) blockers.push("visibility_eligibility_invalid");
  if (value.metricEligibility.ranking === "eligible" && (!marketShape(value.responseShape) || !["direct", "comparable_set"].includes(value.rankingOpportunity))) blockers.push("ranking_eligibility_invalid");
  if (value.metricEligibility.sov === "eligible" && value.metricEligibility.visibility !== "eligible") blockers.push("sov_requires_visibility_eligibility");
  if (["evaluation_criteria", "explanatory_answer", "evidence_answer", "branded_sentiment_answer"].includes(value.responseShape) && market) blockers.push("non_market_response_shape_in_market_metrics");
  if ((value.metricEligibility.sentiment === "eligible" || value.metricEligibility.brandPerception === "eligible") && value.brandScope !== "self_branded") blockers.push("brand_metrics_require_self_branded_scope");
  if (forced && market) blockers.push("forced_citation_prompt_in_market_metrics");
  if ((forced && value.metricEligibility.forcedCitationValidation !== "eligible") || (!forced && value.metricEligibility.forcedCitationValidation === "eligible")) blockers.push("forced_citation_eligibility_invalid");
  if (value.metricEligibility.naturalCitationObservation === "eligible" && value.metricEligibility.forcedCitationValidation === "eligible") blockers.push("natural_and_forced_citation_must_be_separate");
  if (value.lifecycleStatus === "active") {
    if (!anyEligible(value.metricEligibility)) blockers.push("active_revision_requires_eligible_analysis");
    if (value.metricEligibilityAuthority !== "explicit_contract") blockers.push("active_revision_requires_explicit_eligibility");
    if (!["provided", "legacy_explicit"].includes(value.sourceStatus)) blockers.push("active_revision_requires_explicit_source_status");
    if (value.qualityScoreSource !== "calculated" || value.qualityScore == null) blockers.push("active_revision_requires_calculated_quality");
    if (!text(value.effectiveFrom)) blockers.push("active_revision_effective_from_missing");
  }
  if (value.metricEligibilityAuthority !== "explicit_contract") warnings.push("metric_eligibility_not_authoritative");
  if (value.qualityScoreSource !== "calculated") warnings.push("quality_score_not_calculated");
  return verdict(blockers, warnings);
}
export function validatePromptSetMembershipContract(value: RecoraPromptSetMembershipContract): RecoraContractValidationResult {
  const blockers = req([["membership_id", value.membershipId], ["prompt_set_version_id", value.promptSetVersionId], ["prompt_revision_id", value.promptRevisionId], ["intent_cell_id", value.intentCellId]]);
  const warnings: string[] = [];
  version(blockers, value.contractVersion);
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0) blockers.push("sort_order_invalid");
  if (value.businessWeight != null && value.businessWeight <= 0) blockers.push("business_weight_invalid");
  if (!text(value.inclusionReason)) warnings.push("inclusion_reason_missing");
  if (value.panelRole === "core" && value.variantRole !== "canonical") blockers.push("core_requires_canonical");
  if (value.panelRole === "robustness" && value.variantRole !== "robustness") blockers.push("robustness_requires_robustness_variant");
  if (value.panelRole === "diagnostic" && !["diagnostic", "control"].includes(value.variantRole)) blockers.push("diagnostic_role_invalid");
  return verdict(blockers, warnings);
}
export function validatePromptSetVersionContract(value: RecoraPromptSetVersionContract): RecoraContractValidationResult {
  const blockers = req([["prompt_set_id", value.promptSetId], ["prompt_set_version_id", value.promptSetVersionId], ["version_label", value.versionLabel]]);
  const warnings: string[] = [], production = ["active", "frozen"].includes(value.status);
  version(blockers, value.contractVersion);
  if (production) {
    blockers.push(...req([["execution_profile_id", value.executionProfileId], ["metric_definition_version", value.metricDefinitionVersion], ["valid_response_policy_version", value.validResponsePolicyVersion], ["aggregation_policy_version", value.aggregationPolicyVersion], ["repeat_policy_id", value.repeatPolicyId], ["activated_at", value.activatedAt]]));
    if (!getRecoraPromptProfileDefinition(value.profileId).productionMeasurementEligible) blockers.push("production_set_requires_measurement_profile");
  }
  if (value.status === "frozen" && !text(value.frozenAt)) blockers.push("frozen_at_missing");
  if (!production && !getRecoraPromptProfileDefinition(value.profileId).productionMeasurementEligible) warnings.push("design_preview_profile");
  return verdict(blockers, warnings);
}
export function validateExecutionProfileContract(value: RecoraExecutionProfileContract): RecoraContractValidationResult {
  const blockers = req([["execution_profile_id", value.executionProfileId], ["provider", value.provider], ["surface", value.surface], ["model", value.model], ["model_version", value.modelVersion], ["system_prompt_version", value.systemPromptVersion], ["execution_template_version", value.executionTemplateVersion], ["web_search_mode", value.webSearchMode], ["search_activation_policy", value.searchActivationPolicy], ["locale", value.locale], ["account_or_session_condition", value.accountOrSessionCondition], ["repeat_policy_id", value.repeatPolicyId], ["valid_response_policy_version", value.validResponsePolicyVersion], ["metric_definition_version", value.metricDefinitionVersion], ["aggregation_policy_version", value.aggregationPolicyVersion]]);
  const warnings: string[] = [];
  version(blockers, value.contractVersion);
  if (value.searchBudget != null && (!Number.isInteger(value.searchBudget) || value.searchBudget < 0)) blockers.push("search_budget_invalid");
  if (value.liveOrCached === "mixed") warnings.push("mixed_cache_mode_requires_compatibility_rule");
  return verdict(blockers, warnings);
}

export function adaptLegacyPromptDraftToContractCandidate(prompt: PromptDraft, context: LegacyPromptDraftAdapterContext): RecoraCompatibilityAdapterResult<RecoraPromptRevisionContractCandidate> {
  const warnings = ["legacy_prompt_requires_intent_cell_and_revision", "legacy_eligibility_is_proposed"], reviewReasons: string[] = [];
  const brandScope = draftBrandScope(prompt, context, warnings, reviewReasons);
  const questionFamily = draftQuestionFamily(prompt, context.topicType, reviewReasons);
  const questionAct = draftQuestionAct(prompt);
  if (prompt.sourceStatus !== "provided" || prompt.reviewStatus !== "approved") reviewReasons.push("legacy_prompt_not_explicitly_approved");
  if (prompt.gateDecision !== "ready_for_measurement") reviewReasons.push(`legacy_prompt_gate_${prompt.gateDecision}`);
  if (["medium", "high"].includes(prompt.seedContaminationRisk)) reviewReasons.push("seed_contamination_review");
  const value: RecoraPromptRevisionContractCandidate = {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION, legacyPromptId: prompt.promptId, promptId: prompt.promptId || "legacy-prompt-missing-id",
    promptRevisionId: null, promptVersion: null, intentCellId: null, contentHash: null, text: prompt.text, brandScope, questionFamily, questionAct,
    responseShape: prompt.responseShape, languageMode: prompt.languageMode, buyerStage: prompt.buyerStage,
    temporalClass: context.temporalClass ?? (prompt.category === "pricing_reputation" ? "volatile_dynamic" : "evergreen"),
    variantRole: context.variantRole ?? draftVariantRole(prompt), competitorSeedPolicy: prompt.competitorMentionRule,
    candidateMentionOpportunity: prompt.candidateMentionOpportunity, rankingOpportunity: prompt.rankingOpportunity,
    expectedSignals: prompt.expectedSignal ? [prompt.expectedSignal] : [], metricEligibility: draftEligibility(prompt, brandScope, questionFamily, questionAct),
    metricEligibilityAuthority: "compatibility_inferred", sourceStatus: prompt.sourceStatus, seedContaminationRisk: prompt.seedContaminationRisk,
    confidenceScore: prompt.confidenceScore, qualityScore: prompt.qualityScore, qualityScoreSource: "template_prior", riskFlags: prompt.riskFlags,
    lifecycleStatus: "candidate", supersedesPromptRevisionId: null, effectiveFrom: null, effectiveTo: null
  };
  const status = brandScope === "brand_optional" || prompt.gateDecision === "reject" ? "blocked" : reviewReasons.length ? "manual_review" : "needs_contract_fields";
  return { status, value, missingFields: ["promptRevisionId", "promptVersion", "intentCellId", "contentHash", "calculatedQualityScore"], warnings, reviewReasons: uniq(reviewReasons) };
}
export function adaptLegacyPromptScopeToContractCandidate(scope: RecoraPromptScope): RecoraCompatibilityAdapterResult<RecoraLegacyPromptScopeCandidate> {
  const reviewReasons = [scope.status !== "explicit" ? `legacy_scope_${scope.status}` : "", !scope.promptType ? "prompt_type_missing" : "", !scope.measurementPurpose ? "purpose_missing" : ""].filter(Boolean);
  return {
    status: reviewReasons.length ? "manual_review" : "needs_contract_fields",
    value: { contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION, legacyPromptType: scope.promptType, legacyMeasurementPurpose: scope.measurementPurpose, legacyScopeStatus: scope.status, brandScope: legacyBrandScope(scope.promptType), questionFamily: legacyQuestionFamily(scope.promptType), primaryPurposeHint: scope.measurementPurpose, metricEligibility: createExcludedPromptMetricEligibility(["legacy_scope_insufficient"]), metricEligibilityAuthority: "compatibility_inferred" },
    missingFields: ["promptText", "promptRevisionId", "intentCellId", "responseShape", "opportunityFields"], warnings: ["legacy_scope_never_confers_official_eligibility"], reviewReasons
  };
}
export function projectPromptRevisionToLegacyScope(revision: RecoraPromptRevisionContract, primaryPurpose: RecoraMeasurementPurpose | null = null): RecoraLegacyScopeProjectionResult {
  const validation = validatePromptRevisionContract(revision);
  if (!validation.valid) return blocked(["target_contract_invalid", ...validation.blockers]);
  if (revision.lifecycleStatus !== "active" || revision.metricEligibilityAuthority !== "explicit_contract") return blocked(["projection_requires_active_explicit_revision"]);
  const promptType = legacyPromptType(revision), purposes = representablePurposes(revision.metricEligibility), warnings = ["lossy_projection"];
  const genericMarketMismatch = promptType === "comparison_generic" && marketEligible(revision.metricEligibility);
  if (genericMarketMismatch) warnings.push("legacy_generic_comparison_not_market_eligible");
  let measurementPurpose = primaryPurpose;
  if (measurementPurpose && !purposes.includes(measurementPurpose)) { warnings.push("selected_purpose_not_eligible"); measurementPurpose = null; }
  else if (!measurementPurpose && purposes.length === 1) measurementPurpose = purposes[0];
  else if (!measurementPurpose && purposes.length > 1) warnings.push("multiple_purposes_require_selection");
  if (genericMarketMismatch && measurementPurpose && ["visibility", "ranking", "sov"].includes(measurementPurpose)) { measurementPurpose = null; warnings.push("legacy_generic_comparison_market_purpose_omitted"); }
  if (revision.metricEligibility.naturalCitationObservation === "eligible" || revision.metricEligibility.riskCheck === "eligible") warnings.push("target_metrics_not_representable");
  if (measurementPurpose && purposes.length > 1) warnings.push("other_eligible_purposes_omitted");
  return { status: "projected", scope: { promptType, measurementPurpose, status: "explicit", notes: warnings }, warnings };
}

function profile(id: RecoraPromptProfileId, targetTotal: number, coreCanonical: number | null = null, robustness: number | null = null, diagnostic: number | null = null): RecoraPromptProfileDefinition { const production = coreCanonical != null; return { id, kind: production ? "experimental_measurement" : "design_preview", targetTotal, coreCanonical, robustness, diagnostic, productionMeasurementEligible: production, experimental: production }; }
function draftBrandScope(prompt: PromptDraft, context: LegacyPromptDraftAdapterContext, warnings: string[], review: string[]): RecoraPromptBrandScope {
  if (prompt.brandMentionRule === "brand_optional" || prompt.brandingMode === "brand_optional") return "brand_optional";
  const body = normalize(prompt.text), self = identitySignals(context.brandIdentity).some((signal) => body.includes(signal));
  const competitors = uniq([...(context.knownCompetitors ?? []), ...(context.knownCompetitorAliases ?? [])]).map(normalize);
  const competitor = competitors.some((signal) => body.includes(signal)), named = prompt.competitorMentionRule === "named_competitors";
  if (self && (competitor || named)) { review.push("named_comparison_review"); return "named_comparison"; }
  if (self || prompt.brandingMode === "branded" || prompt.brandMentionRule === "brand_included") return "self_branded";
  if (competitor || named || prompt.brandingMode === "competitor_only" || prompt.brandMentionRule === "competitor_only") { if (named && !competitors.length) warnings.push("named_competitor_identity_missing"); review.push("competitor_entity_review"); return "competitor_only"; }
  return "brand_excluded";
}
function draftQuestionFamily(prompt: PromptDraft, topicType: TopicType | null | undefined, review: string[]): RecoraQuestionFamily {
  const topicMap: Record<TopicType, RecoraQuestionFamily | null> = { market_discovery_topic: "market_discovery", problem_solution_topic: "problem_solution", category_discovery_topic: "category_discovery", competitor_comparison_topic: "competitor_comparison", alternative_search_topic: "alternative_search", pricing_reputation_topic: "pricing_reputation", citation_evidence_topic: "citation_evidence", branded_sentiment_topic: "branded_perception", persona_specific_topic: null, local_regional_topic: "local_regional", regulated_risk_topic: "regulated_risk" };
  if (topicType && topicMap[topicType]) return topicMap[topicType] as RecoraQuestionFamily;
  const categoryMap: Partial<Record<PromptDraft["category"], RecoraQuestionFamily>> = { branded: "branded_perception", competitor_comparison: "competitor_comparison", problem_solution: "problem_solution", alternative_search: "alternative_search", pricing_reputation: "pricing_reputation", citation_check: "citation_evidence" };
  if (categoryMap[prompt.category]) return categoryMap[prompt.category] as RecoraQuestionFamily;
  if (prompt.category === "persona_based") { if (prompt.intentType === "risk_checking") return "implementation_operation"; review.push("persona_family_review"); }
  return prompt.intent === "problem_aware" ? "problem_solution" : ["candidate_list", "ranked_recommendation"].includes(prompt.responseShape) ? "category_discovery" : "market_discovery";
}
function draftQuestionAct(prompt: PromptDraft): RecoraQuestionAct {
  if (prompt.responseShape === "evidence_answer" || prompt.intent === "citation_check") return "request_sources";
  if (prompt.responseShape === "branded_sentiment_answer") return prompt.intent === "brand_perception" ? "assess_fit" : "assess_reputation";
  if (prompt.responseShape === "ranked_recommendation") return "request_ranking";
  if (prompt.responseShape === "candidate_list") return "request_shortlist";
  if (prompt.responseShape === "comparative_set") return "compare_candidates";
  if (prompt.responseShape === "evaluation_criteria") return prompt.intentType === "risk_checking" ? "assess_risk" : "ask_evaluation_criteria";
  return prompt.intentType === "risk_checking" ? "assess_risk" : prompt.intentType === "reputational" ? "assess_reputation" : "ask_explanation";
}
function draftEligibility(prompt: PromptDraft, brandScope: RecoraPromptBrandScope, family: RecoraQuestionFamily, act: RecoraQuestionAct): Metric {
  if (prompt.gateDecision === "reject") return createExcludedPromptMetricEligibility(["rejected"]);
  const forced = act === "request_sources" || family === "citation_evidence" || prompt.responseShape === "evidence_answer";
  const marketBase = brandScope === "brand_excluded" && !forced && marketShape(prompt.responseShape) && ["none", "low"].includes(prompt.seedContaminationRisk);
  const visibility = marketBase && ["direct", "likely"].includes(prompt.candidateMentionOpportunity);
  const ranking = marketBase && ["direct", "comparable_set"].includes(prompt.rankingOpportunity);
  const sentiment = brandScope === "self_branded" && (family === "branded_perception" || prompt.responseShape === "branded_sentiment_answer");
  const risk = prompt.intentType === "risk_checking" || ["regulated_risk", "implementation_operation"].includes(family);
  return { visibility: state(visibility), ranking: state(ranking), sov: state(visibility), sentiment: state(sentiment), brandPerception: state(sentiment), naturalCitationObservation: state(!forced && brandScope !== "brand_optional"), forcedCitationValidation: state(forced), riskCheck: state(risk), recommendationInput: state(visibility || ranking || sentiment || forced || risk || ["ask_evaluation_criteria", "ask_explanation", "compare_candidates"].includes(act)), reasons: ["compatibility_inferred"] };
}
function draftVariantRole(prompt: PromptDraft): RecoraPromptVariantRole { return prompt.category === "citation_check" || prompt.category === "branded" || prompt.brandingMode !== "non_branded" ? "diagnostic" : "canonical"; }
function legacyBrandScope(type: RecoraPromptType | null): RecoraPromptBrandScope | null { return type === "branded" ? "self_branded" : type === "comparison_named" ? "named_comparison" : type === "competitor_named" ? "competitor_only" : type ? "brand_excluded" : null; }
function legacyQuestionFamily(type: RecoraPromptType | null): RecoraQuestionFamily | null { return type === "branded" ? "branded_perception" : ["comparison_generic", "comparison_named", "competitor_named"].includes(type ?? "") ? "competitor_comparison" : type === "citation_check" ? "citation_evidence" : type === "non_branded" ? "market_discovery" : null; }
function legacyPromptType(revision: RecoraPromptRevisionContract): RecoraPromptType { if (forcedCitation(revision)) return "citation_check"; if (revision.brandScope === "self_branded") return "branded"; if (revision.brandScope === "named_comparison") return "comparison_named"; if (revision.brandScope === "competitor_only") return "competitor_named"; return revision.questionFamily === "competitor_comparison" || revision.questionAct === "compare_candidates" ? "comparison_generic" : "non_branded"; }
function representablePurposes(value: Metric): RecoraMeasurementPurpose[] { const pairs: readonly [RecoraPromptMetricKey, RecoraMeasurementPurpose][] = [["visibility", "visibility"], ["ranking", "ranking"], ["sov", "sov"], ["sentiment", "sentiment"], ["brandPerception", "brand_perception"], ["forcedCitationValidation", "citation_validation"], ["recommendationInput", "recommendation_input"]]; return pairs.filter(([key]) => value[key] === "eligible").map(([, purpose]) => purpose); }
function identitySignals(value: BrandIdentityForDraft): string[] { return uniq([value.brandName, value.serviceName, value.domain, value.officialSiteUrl ? host(value.officialSiteUrl) : null, ...(value.aliases ?? [])].filter((item): item is string => typeof item === "string").map(normalize).filter((item) => item.length >= 2)); }
function blocked(warnings: string[]): RecoraLegacyScopeProjectionResult { return { status: "blocked", scope: { promptType: null, measurementPurpose: null, status: "missing", notes: warnings }, warnings }; }
function forcedCitation(value: RecoraPromptRevisionContract): boolean { return value.questionAct === "request_sources" || value.questionFamily === "citation_evidence" || value.responseShape === "evidence_answer"; }
function marketEligible(value: Metric): boolean { return [value.visibility, value.ranking, value.sov].includes("eligible"); }
function anyEligible(value: Metric): boolean { return RECORA_PROMPT_METRIC_KEYS.some((key) => value[key] === "eligible"); }
function marketShape(value: Shape): boolean { return ["candidate_list", "ranked_recommendation", "comparative_set"].includes(value); }
function state(value: boolean): RecoraPromptMetricState { return value ? "eligible" : "excluded"; }
function boundedScore(blockers: string[], value: number | null): void { if (value != null && (!Number.isFinite(value) || value < 0 || value > 100)) blockers.push("score_out_of_range"); }
function req(entries: readonly (readonly [string, string | null])[]): string[] { return entries.filter(([, value]) => !text(value)).map(([name]) => `${name}_missing`); }
function version(blockers: string[], value: string): void { if (value !== RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION) blockers.push("contract_version_mismatch"); }
function verdict(blockers: string[], warnings: string[]): RecoraContractValidationResult { return { valid: blockers.length === 0, blockers: uniq(blockers), warnings: uniq(warnings) }; }
function host(value: string): string { try { return new URL(value).hostname; } catch { return value; } }
function normalize(value: string): string { return value.normalize("NFKC").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, ""); }
function text(value: string | null | undefined): value is string { return typeof value === "string" && value.trim().length > 0; }
function uniq(values: readonly (string | null | undefined)[]): string[] { return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))); }
