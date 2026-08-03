import assert from "node:assert/strict";

import type { PromptDraft } from "../lib/recora/project-setup-draft";
import type { RecoraPromptScope } from "../lib/recora/prompt-scope";
import {
  RECORA_BUYER_STAGES,
  RECORA_COMPETITOR_SEED_POLICIES,
  RECORA_PROMPT_BRAND_SCOPES,
  RECORA_PROMPT_LANGUAGE_MODES,
  RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
  RECORA_PROMPT_METRIC_KEYS,
  RECORA_PROMPT_PANEL_ROLES,
  RECORA_PROMPT_PROFILE_DEFINITIONS,
  RECORA_PROMPT_RESPONSE_SHAPES,
  RECORA_PROMPT_REVISION_STATUSES,
  RECORA_PROMPT_SET_VERSION_STATUSES,
  RECORA_PROMPT_TEMPORAL_CLASSES,
  RECORA_PROMPT_VARIANT_ROLES,
  RECORA_QUESTION_ACTS,
  RECORA_QUESTION_FAMILIES,
  RECORA_VALID_RESPONSE_STATUSES,
  adaptLegacyPromptDraftToContractCandidate,
  adaptLegacyPromptScopeToContractCandidate,
  createExcludedPromptMetricEligibility,
  getRecoraPromptProfileDefinition,
  projectPromptRevisionToLegacyScope,
  validateExecutionProfileContract,
  validateIntentCellContract,
  validatePromptRevisionContract,
  validatePromptSetMembershipContract,
  validatePromptSetVersionContract,
  type RecoraExecutionProfileContract,
  type RecoraIntentCellContract,
  type RecoraPromptMetricEligibility,
  type RecoraPromptRevisionContract,
  type RecoraPromptSetMembershipContract,
  type RecoraPromptSetVersionContract
} from "../lib/recora/prompt-measurement-contract";

const enumCollections = [
  RECORA_PROMPT_BRAND_SCOPES,
  RECORA_QUESTION_FAMILIES,
  RECORA_QUESTION_ACTS,
  RECORA_PROMPT_RESPONSE_SHAPES,
  RECORA_PROMPT_LANGUAGE_MODES,
  RECORA_BUYER_STAGES,
  RECORA_COMPETITOR_SEED_POLICIES,
  RECORA_PROMPT_TEMPORAL_CLASSES,
  RECORA_PROMPT_VARIANT_ROLES,
  RECORA_PROMPT_PANEL_ROLES,
  RECORA_PROMPT_REVISION_STATUSES,
  RECORA_PROMPT_SET_VERSION_STATUSES,
  RECORA_VALID_RESPONSE_STATUSES,
  RECORA_PROMPT_METRIC_KEYS
] as const;

for (const values of enumCollections) {
  assert.ok(values.length > 0, "contract enum collection must not be empty");
  assert.equal(new Set(values).size, values.length, "contract enum collection must be unique");
}

assert.equal(RECORA_PROMPT_PROFILE_DEFINITIONS.length, 6);
for (const profile of RECORA_PROMPT_PROFILE_DEFINITIONS) {
  if (profile.productionMeasurementEligible) {
    assert.equal((profile.coreCanonical ?? 0) + (profile.robustness ?? 0) + (profile.diagnostic ?? 0), profile.targetTotal);
  } else {
    assert.equal(profile.kind, "design_preview");
  }
}
assert.equal(getRecoraPromptProfileDefinition("measurement_profile_experimental_50").targetTotal, 50);
assert.equal(getRecoraPromptProfileDefinition("measurement_profile_experimental_100").targetTotal, 100);
assert.equal(getRecoraPromptProfileDefinition("measurement_profile_experimental_200").targetTotal, 200);

const legacyContext = {
  brandIdentity: {
    brandName: "Recora",
    serviceName: "レコラ",
    aliases: ["RECORA"],
    officialSiteUrl: "https://recora.example"
  },
  knownCompetitors: ["RivalCo"],
  knownCompetitorAliases: ["ライバルコ"]
} as const;

const marketCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt(), legacyContext);
assert.equal(marketCandidate.status, "needs_contract_fields");
assert.equal(marketCandidate.value.brandScope, "brand_excluded");
assert.equal(marketCandidate.value.metricEligibility.visibility, "eligible");
assert.equal(marketCandidate.value.metricEligibility.ranking, "eligible");
assert.equal(marketCandidate.value.metricEligibility.sov, "eligible");
assert.equal(marketCandidate.value.metricEligibility.naturalCitationObservation, "eligible");
assert.equal(marketCandidate.value.metricEligibility.forcedCitationValidation, "excluded");
assert.equal(marketCandidate.value.metricEligibilityAuthority, "compatibility_inferred");
assert.ok(marketCandidate.missingFields.includes("intentCellId"));

const criteriaCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt({
  text: "導入前に契約条件と運用リスクをどう確認すべきですか。",
  category: "persona_based",
  intent: "solution_aware",
  intentType: "risk_checking",
  responseShape: "evaluation_criteria",
  candidateMentionOpportunity: "weak",
  rankingOpportunity: "weak"
}), { ...legacyContext, topicType: "persona_specific_topic" });
assert.equal(criteriaCandidate.value.questionFamily, "implementation_operation");
assert.equal(criteriaCandidate.value.metricEligibility.visibility, "excluded");
assert.equal(criteriaCandidate.value.metricEligibility.ranking, "excluded");
assert.equal(criteriaCandidate.value.metricEligibility.riskCheck, "eligible");
assert.equal(criteriaCandidate.value.metricEligibility.recommendationInput, "eligible");

const citationCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt({
  text: "比較の根拠となる出典を示してください。",
  category: "citation_check",
  intent: "citation_check",
  intentType: "evidence_seeking",
  responseShape: "evidence_answer",
  candidateMentionOpportunity: "none",
  rankingOpportunity: "none"
}), legacyContext);
assert.equal(citationCandidate.value.metricEligibility.visibility, "excluded");
assert.equal(citationCandidate.value.metricEligibility.naturalCitationObservation, "excluded");
assert.equal(citationCandidate.value.metricEligibility.forcedCitationValidation, "eligible");

const brandedCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt({
  text: "Recoraの評判と利用前の注意点は？",
  category: "branded",
  intent: "brand_perception",
  intentType: "reputational",
  brandingMode: "branded",
  brandMentionRule: "brand_included",
  responseShape: "branded_sentiment_answer",
  candidateMentionOpportunity: "none",
  rankingOpportunity: "none"
}), legacyContext);
assert.equal(brandedCandidate.value.brandScope, "self_branded");
assert.equal(brandedCandidate.value.metricEligibility.visibility, "excluded");
assert.equal(brandedCandidate.value.metricEligibility.sentiment, "eligible");
assert.equal(brandedCandidate.value.metricEligibility.brandPerception, "eligible");

const competitorCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt({
  text: "RivalCoの代替候補を比較してください。",
  category: "competitor_comparison",
  intent: "comparison",
  intentType: "comparison",
  brandingMode: "competitor_only",
  brandMentionRule: "competitor_only",
  competitorMentionRule: "named_competitors",
  responseShape: "comparative_set"
}), legacyContext);
assert.equal(competitorCandidate.value.brandScope, "competitor_only");
assert.equal(competitorCandidate.value.metricEligibility.visibility, "excluded");
assert.equal(competitorCandidate.status, "manual_review");

const optionalCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt({
  brandingMode: "brand_optional",
  brandMentionRule: "brand_optional"
}), legacyContext);
assert.equal(optionalCandidate.value.brandScope, "brand_optional");
assert.equal(optionalCandidate.status, "blocked");

const rejectedCandidate = adaptLegacyPromptDraftToContractCandidate(legacyPrompt({ gateDecision: "reject" }), legacyContext);
assert.equal(rejectedCandidate.status, "blocked");
for (const metric of RECORA_PROMPT_METRIC_KEYS) assert.equal(rejectedCandidate.value.metricEligibility[metric], "excluded");

const explicitLegacyScope = adaptLegacyPromptScopeToContractCandidate(legacyScope("non_branded", "visibility"));
assert.equal(explicitLegacyScope.status, "needs_contract_fields");
assert.equal(explicitLegacyScope.value.metricEligibility.visibility, "excluded");
assert.equal(explicitLegacyScope.value.metricEligibilityAuthority, "compatibility_inferred");
const inferredLegacyScope = adaptLegacyPromptScopeToContractCandidate(legacyScope("non_branded", "visibility", "inferred"));
assert.equal(inferredLegacyScope.status, "manual_review");

const intentCell = validIntentCell();
assert.equal(validateIntentCellContract(intentCell).valid, true);
assert.ok(validateIntentCellContract({ ...intentCell, trackingScope: false }).blockers.includes("active_intent_cell_requires_tracking_scope"));

const revision = validActiveRevision();
assert.equal(validatePromptRevisionContract(revision).valid, true);
assert.ok(validatePromptRevisionContract({ ...revision, brandScope: "self_branded" }).blockers.includes("market_metrics_require_brand_excluded_scope"));
assert.ok(validatePromptRevisionContract({
  ...revision,
  responseShape: "evaluation_criteria",
  candidateMentionOpportunity: "weak",
  rankingOpportunity: "weak"
}).blockers.includes("non_market_response_shape_in_market_metrics"));
const forcedMixed = validatePromptRevisionContract({
  ...revision,
  questionFamily: "citation_evidence",
  questionAct: "request_sources",
  responseShape: "evidence_answer",
  candidateMentionOpportunity: "none",
  rankingOpportunity: "none",
  metricEligibility: eligibility({
    naturalCitationObservation: "eligible",
    forcedCitationValidation: "eligible",
    recommendationInput: "eligible"
  })
});
assert.ok(forcedMixed.blockers.includes("natural_and_forced_citation_must_be_separate"));
assert.ok(validatePromptRevisionContract({ ...revision, metricEligibilityAuthority: "compatibility_inferred" }).blockers.includes("active_revision_requires_explicit_eligibility"));
assert.ok(validatePromptRevisionContract({ ...revision, sourceStatus: "inferred" }).blockers.includes("active_revision_requires_explicit_source_status"));
assert.ok(validatePromptRevisionContract({ ...revision, qualityScoreSource: "template_prior" }).blockers.includes("active_revision_requires_calculated_quality"));

assert.equal(validatePromptSetMembershipContract(membership()).valid, true);
assert.ok(validatePromptSetMembershipContract(membership({ variantRole: "robustness" })).blockers.includes("core_requires_canonical"));
assert.ok(validatePromptSetMembershipContract(membership({ panelRole: "robustness", variantRole: "canonical" })).blockers.includes("robustness_requires_robustness_variant"));
assert.equal(validatePromptSetMembershipContract(membership({ panelRole: "diagnostic", variantRole: "control" })).valid, true);
assert.ok(validatePromptSetMembershipContract(membership({ panelRole: "diagnostic", variantRole: "canonical" })).blockers.includes("diagnostic_role_invalid"));

assert.equal(validatePromptSetVersionContract(activeSetVersion()).valid, true);
assert.ok(validatePromptSetVersionContract({ ...activeSetVersion(), profileId: "design_preview_standard_16" }).blockers.includes("production_set_requires_measurement_profile"));
assert.ok(validatePromptSetVersionContract({ ...activeSetVersion(), status: "frozen", frozenAt: null }).blockers.includes("frozen_at_missing"));

assert.equal(validateExecutionProfileContract(executionProfile()).valid, true);
assert.ok(validateExecutionProfileContract({ ...executionProfile(), liveOrCached: "mixed" }).warnings.includes("mixed_cache_mode_requires_compatibility_rule"));
assert.ok(validateExecutionProfileContract({ ...executionProfile(), accountOrSessionCondition: "" }).blockers.includes("account_or_session_condition_missing"));

const projection = projectPromptRevisionToLegacyScope(revision, "visibility");
assert.equal(projection.status, "projected");
assert.equal(projection.scope.promptType, "non_branded");
assert.equal(projection.scope.measurementPurpose, "visibility");
assert.ok(projection.warnings.includes("lossy_projection"));
assert.ok(projection.warnings.includes("target_metrics_not_representable"));

const inactiveProjection = projectPromptRevisionToLegacyScope({ ...revision, lifecycleStatus: "validated" });
assert.equal(inactiveProjection.status, "blocked");
assert.ok(inactiveProjection.warnings.includes("projection_requires_active_explicit_revision"));

const comparisonProjection = projectPromptRevisionToLegacyScope({
  ...revision,
  questionFamily: "competitor_comparison",
  questionAct: "compare_candidates",
  responseShape: "comparative_set"
}, "visibility");
assert.equal(comparisonProjection.scope.promptType, "comparison_generic");
assert.ok(comparisonProjection.warnings.includes("legacy_generic_comparison_not_market_eligible"));

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    enumCollections: enumCollections.length,
    promptProfiles: RECORA_PROMPT_PROFILE_DEFINITIONS.length,
    legacyMarketCandidatePreservedAsProposedOnly: true,
    criteriaOnlyExcludedFromMarketMetrics: true,
    riskAndRecommendationOnlyUsePreserved: true,
    naturalAndForcedCitationSeparated: true,
    brandedAndNamedScopesExcludedFromMarketMetrics: true,
    rejectedLegacyPromptHasNoEligibleAnalysis: true,
    intentCellContractValidated: true,
    activeRevisionRequiresExplicitAuthoritySourceAndCalculatedQuality: true,
    panelRoleAndVariantRoleValidated: true,
    activeSetPoliciesAndProductionProfileRequired: true,
    executionProfileValidated: true,
    legacyScopeProjectionIsLossyAndExplicit: true,
    nonActiveOrInferredProjectionBlocked: true
  }
}, null, 2));

function legacyPrompt(overrides: Partial<PromptDraft> = {}): PromptDraft {
  return {
    promptId: "legacy-prompt-001",
    topicId: "topic-001",
    personaId: "persona-001",
    text: "AI検索の可視化サービスを3つ挙げて比較してください。",
    rawUserIntent: "AI検索 可視化 おすすめ 比較",
    languageMode: "natural_conversation",
    category: "non_branded",
    intent: "buyer_intent",
    intentType: "commercial_investigation",
    buyerStage: "comparison",
    brandingMode: "non_branded",
    brandMentionRule: "brand_excluded",
    competitorMentionRule: "unknown_competitor_discovery",
    responseShape: "comparative_set",
    candidateMentionOpportunity: "direct",
    rankingOpportunity: "comparable_set",
    expectedSignal: "候補名と比較理由が現れるか。",
    qualityScore: 82,
    gateDecision: "ready_for_measurement",
    gateReason: "fixture",
    sourceStatus: "provided",
    seedTerms: ["AI検索"],
    seedContaminationRisk: "none",
    needsVerification: false,
    confidenceScore: 84,
    reviewStatus: "approved",
    riskFlags: [],
    ...overrides
  };
}

function legacyScope(
  promptType: RecoraPromptScope["promptType"],
  measurementPurpose: RecoraPromptScope["measurementPurpose"],
  status: RecoraPromptScope["status"] = "explicit"
): RecoraPromptScope {
  return { promptType, measurementPurpose, status };
}

function validIntentCell(): RecoraIntentCellContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    intentCellId: "intent-cell-001",
    projectId: "project-001",
    primaryTopicId: "topic-001",
    secondaryTopicIds: ["topic-002"],
    personaId: "persona-001",
    buyerStage: "comparison",
    locale: "ja-JP",
    regionScope: "JP",
    intentSummary: "AI検索可視化サービスの候補を比較する",
    expectedSignalTypes: ["candidate_mention", "recommendation_order"],
    businessPriority: 90,
    trackingScope: true,
    improvementScope: true,
    status: "active"
  };
}

function validActiveRevision(): RecoraPromptRevisionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    promptId: "prompt-001",
    promptRevisionId: "prompt-revision-001",
    promptVersion: 1,
    intentCellId: "intent-cell-001",
    text: "AI検索可視化サービスを3つ挙げて比較してください。",
    contentHash: "sha256:fixture-prompt-revision-001",
    brandScope: "brand_excluded",
    questionFamily: "category_discovery",
    questionAct: "request_shortlist",
    responseShape: "candidate_list",
    languageMode: "natural_conversation",
    buyerStage: "comparison",
    temporalClass: "evergreen",
    variantRole: "canonical",
    competitorSeedPolicy: "unknown_competitor_discovery",
    candidateMentionOpportunity: "direct",
    rankingOpportunity: "direct",
    expectedSignals: ["candidate_mention", "recommendation_order"],
    metricEligibility: eligibility({
      visibility: "eligible",
      ranking: "eligible",
      sov: "eligible",
      naturalCitationObservation: "eligible",
      recommendationInput: "eligible"
    }),
    metricEligibilityAuthority: "explicit_contract",
    sourceStatus: "provided",
    seedContaminationRisk: "none",
    confidenceScore: 91,
    qualityScore: 92,
    qualityScoreSource: "calculated",
    riskFlags: [],
    lifecycleStatus: "active",
    supersedesPromptRevisionId: null,
    effectiveFrom: "2026-08-04T00:00:00.000Z",
    effectiveTo: null
  };
}

function eligibility(overrides: Partial<Record<keyof Omit<RecoraPromptMetricEligibility, "reasons">, "eligible" | "excluded">>): RecoraPromptMetricEligibility {
  return {
    ...createExcludedPromptMetricEligibility(),
    ...overrides,
    reasons: ["fixture_explicit_contract"]
  };
}

function membership(overrides: Partial<RecoraPromptSetMembershipContract> = {}): RecoraPromptSetMembershipContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    membershipId: "membership-001",
    promptSetVersionId: "prompt-set-version-001",
    promptRevisionId: "prompt-revision-001",
    intentCellId: "intent-cell-001",
    panelRole: "core",
    variantRole: "canonical",
    sortOrder: 0,
    businessWeight: null,
    inclusionReason: "Core canonical prompt for the intent cell.",
    ...overrides
  };
}

function activeSetVersion(): RecoraPromptSetVersionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    promptSetId: "prompt-set-001",
    promptSetVersionId: "prompt-set-version-001",
    versionLabel: "2026-08-v1",
    profileId: "measurement_profile_experimental_50",
    status: "active",
    executionProfileId: "execution-profile-001",
    metricDefinitionVersion: "metric-v1",
    validResponsePolicyVersion: "valid-response-v1",
    aggregationPolicyVersion: "aggregation-v1",
    repeatPolicyId: "repeat-v1",
    activatedAt: "2026-08-04T00:00:00.000Z",
    frozenAt: null,
    supersedesPromptSetVersionId: null
  };
}

function executionProfile(): RecoraExecutionProfileContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    executionProfileId: "execution-profile-001",
    provider: "provider-fixture",
    surface: "api-search",
    model: "model-fixture",
    modelVersion: "model-fixture-v1",
    systemPromptVersion: "system-v1",
    executionTemplateVersion: "template-v1",
    webSearchMode: "enabled",
    searchActivationPolicy: "provider-auto",
    liveOrCached: "live",
    locale: "ja-JP",
    region: "JP",
    domainFilters: [],
    searchBudget: 3,
    accountOrSessionCondition: "stateless-server-session",
    repeatPolicyId: "repeat-v1",
    validResponsePolicyVersion: "valid-response-v1",
    metricDefinitionVersion: "metric-v1",
    aggregationPolicyVersion: "aggregation-v1"
  };
}
