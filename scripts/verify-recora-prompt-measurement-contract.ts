import assert from "node:assert/strict";

import type { PromptDraft } from "../lib/recora/project-setup-draft";
import type { RecoraPromptScope } from "../lib/recora/prompt-scope";
import {
  RECORA_BUYER_STAGES,
  RECORA_COMPETITOR_SEED_POLICIES,
  RECORA_EXECUTION_PROFILE_SET_VERSION_STATUSES,
  RECORA_EXECUTION_PROFILE_STATUSES,
  RECORA_INTENT_CELL_STATUSES,
  RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY,
  RECORA_MEASUREMENT_DESIGN_VERSION_STATUSES,
  RECORA_MEASUREMENT_POLICY_BUNDLE_VERSION_STATUSES,
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
  validateExecutionProfileSetCompilationContract,
  validateIntentCellContract,
  validateMeasurementDesignCompilationContract,
  validateMeasurementDesignVersionContract,
  validateMeasurementPolicyBundleVersionContract,
  validatePromptRevisionContract,
  validatePromptRevisionIdentityContext,
  validatePromptSetCompilationContract,
  type RecoraExecutionProfileContract,
  type RecoraExecutionProfileSetCompilationContract,
  type RecoraExecutionProfileSetMembershipContract,
  type RecoraExecutionProfileSetVersionContract,
  type RecoraIntentCellRevisionContract,
  type RecoraMeasurementDesignCompilationContract,
  type RecoraMeasurementDesignVersionContract,
  type RecoraMeasurementPolicyBundleVersionContract,
  type RecoraPromptMetricEligibility,
  type RecoraPromptRevisionContract,
  type RecoraPromptSetCompilationContract,
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
  RECORA_INTENT_CELL_STATUSES,
  RECORA_PROMPT_REVISION_STATUSES,
  RECORA_PROMPT_SET_VERSION_STATUSES,
  RECORA_EXECUTION_PROFILE_STATUSES,
  RECORA_EXECUTION_PROFILE_SET_VERSION_STATUSES,
  RECORA_MEASUREMENT_POLICY_BUNDLE_VERSION_STATUSES,
  RECORA_MEASUREMENT_DESIGN_VERSION_STATUSES,
  RECORA_VALID_RESPONSE_STATUSES,
  RECORA_PROMPT_METRIC_KEYS
] as const;

for (const values of enumCollections) {
  assert.ok(values.length > 0);
  assert.equal(new Set(values).size, values.length);
}

assert.equal(
  RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY.layer,
  "business_operations_foundation"
);
assert.equal(
  RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY.capability,
  "prompt_measurement_design"
);
assert.deepEqual(
  RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY.produces,
  ["measurement_design_version"]
);
assert.ok(
  RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY.doesNotOwn.includes(
    "provider_execution"
  )
);
assert.ok(
  RECORA_MEASUREMENT_DESIGN_DOMAIN_BOUNDARY.doesNotOwn.includes(
    "publication_decision"
  )
);

assert.equal(RECORA_PROMPT_PROFILE_DEFINITIONS.length, 6);
for (const profile of RECORA_PROMPT_PROFILE_DEFINITIONS) {
  if (!profile.productionMeasurementEligible) {
    assert.equal(profile.kind, "design_preview");
    continue;
  }
  assert.equal(
    (profile.coreCanonical ?? 0) +
      (profile.robustness ?? 0) +
      (profile.diagnostic ?? 0),
    profile.targetTotal
  );
}
assert.equal(
  getRecoraPromptProfileDefinition("measurement_profile_experimental_50")
    .targetTotal,
  50
);
assert.equal(
  getRecoraPromptProfileDefinition("measurement_profile_experimental_100")
    .targetTotal,
  100
);
assert.equal(
  getRecoraPromptProfileDefinition("measurement_profile_experimental_200")
    .targetTotal,
  200
);

const identityContext = {
  brandIdentity: {
    brandName: "Recora",
    serviceName: "レコラ",
    aliases: ["RECORA"],
    officialSiteUrl: "https://recora.example"
  },
  knownCompetitors: ["RivalCo"],
  knownCompetitorAliases: ["ライバルコ"]
} as const;

const legacyMarket = adaptLegacyPromptDraftToContractCandidate(
  legacyPrompt(),
  identityContext
);
assert.equal(legacyMarket.status, "needs_contract_fields");
assert.equal(legacyMarket.value.brandScope, "brand_excluded");
assert.equal(legacyMarket.value.metricEligibility.visibility, "eligible");
assert.equal(legacyMarket.value.metricEligibility.ranking, "eligible");
assert.equal(legacyMarket.value.metricEligibility.sov, "eligible");
assert.equal(legacyMarket.value.metricEligibilityAuthority, "compatibility_inferred");
assert.ok(legacyMarket.missingFields.includes("intentCellRevisionId"));
assert.ok(
  legacyMarket.warnings.includes("legacy_adapter_is_migration_inspection_only")
);

const criteriaOnly = adaptLegacyPromptDraftToContractCandidate(
  legacyPrompt({
    text: "導入前に契約条件と運用リスクをどう確認すべきですか。",
    category: "persona_based",
    intent: "solution_aware",
    intentType: "risk_checking",
    responseShape: "evaluation_criteria",
    candidateMentionOpportunity: "weak",
    rankingOpportunity: "weak"
  }),
  { ...identityContext, topicType: "persona_specific_topic" }
);
assert.equal(criteriaOnly.value.metricEligibility.visibility, "excluded");
assert.equal(criteriaOnly.value.metricEligibility.ranking, "excluded");
assert.equal(criteriaOnly.value.metricEligibility.riskCheck, "eligible");
assert.equal(criteriaOnly.value.metricEligibility.recommendationInput, "eligible");

const forcedCitation = adaptLegacyPromptDraftToContractCandidate(
  legacyPrompt({
    text: "比較の根拠となる出典を示してください。",
    category: "citation_check",
    intent: "citation_check",
    intentType: "evidence_seeking",
    responseShape: "evidence_answer",
    candidateMentionOpportunity: "none",
    rankingOpportunity: "none"
  }),
  identityContext
);
assert.equal(forcedCitation.value.metricEligibility.visibility, "excluded");
assert.equal(
  forcedCitation.value.metricEligibility.naturalCitationObservation,
  "excluded"
);
assert.equal(
  forcedCitation.value.metricEligibility.forcedCitationValidation,
  "eligible"
);

const metadataConflict = adaptLegacyPromptDraftToContractCandidate(
  legacyPrompt({
    text: "このサービスの評判は？",
    category: "branded",
    intent: "brand_perception",
    intentType: "reputational",
    brandingMode: "branded",
    brandMentionRule: "brand_included",
    responseShape: "branded_sentiment_answer",
    candidateMentionOpportunity: "none",
    rankingOpportunity: "none"
  }),
  identityContext
);
assert.equal(metadataConflict.status, "manual_review");
assert.ok(
  metadataConflict.reviewReasons.includes(
    "brand_included_metadata_without_target_signal"
  )
);

const targetContamination = adaptLegacyPromptDraftToContractCandidate(
  legacyPrompt({ text: "Recoraを含む候補を3つ挙げてください。" }),
  identityContext
);
assert.equal(targetContamination.status, "manual_review");
assert.ok(
  targetContamination.reviewReasons.includes(
    "target_brand_signal_in_brand_excluded_prompt"
  )
);

const legacyScope = adaptLegacyPromptScopeToContractCandidate(
  currentScope("non_branded", "visibility")
);
assert.equal(legacyScope.status, "needs_contract_fields");
assert.equal(legacyScope.value.metricEligibility.visibility, "excluded");
assert.ok(
  legacyScope.warnings.includes("legacy_adapter_is_migration_inspection_only")
);

const intentCell = readyIntentCell();
assert.equal(validateIntentCellContract(intentCell).valid, true);
assert.ok(
  validateIntentCellContract({ ...intentCell, trackingScope: false })
    .blockers.includes("ready_intent_cell_requires_tracking_scope")
);
assert.ok(
  validateIntentCellContract({
    ...intentCell,
    revisionNumber: 2,
    supersedesIntentCellRevisionId: null
  }).blockers.includes("intent_cell_revision_requires_supersedes")
);

const promptRevision = readyPromptRevision();
assert.equal(validatePromptRevisionContract(promptRevision).valid, true);
assert.ok(
  validatePromptRevisionContract({
    ...promptRevision,
    brandScope: "self_branded"
  }).blockers.includes("market_metrics_require_brand_excluded_scope")
);
assert.ok(
  validatePromptRevisionContract({
    ...promptRevision,
    responseShape: "evaluation_criteria",
    candidateMentionOpportunity: "weak",
    rankingOpportunity: "weak"
  }).blockers.includes("non_market_response_shape_in_market_metrics")
);
assert.ok(
  validatePromptRevisionContract({
    ...promptRevision,
    metricEligibilityAuthority: "compatibility_inferred"
  }).blockers.includes("ready_revision_requires_explicit_eligibility")
);
assert.ok(
  validatePromptRevisionContract({
    ...promptRevision,
    qualityScoreSource: "template_prior"
  }).blockers.includes("ready_revision_requires_calculated_quality")
);
assert.ok(
  validatePromptRevisionIdentityContext(
    { ...promptRevision, text: "RivalCoを含む候補を比較してください。" },
    identityContext
  ).blockers.includes("known_competitor_signal_in_market_prompt")
);

const validPromptCompilation = buildPromptCompilation();
assert.equal(validatePromptSetCompilationContract(validPromptCompilation).valid, true);
assert.equal(
  "executionProfileId" in validPromptCompilation.promptSetVersion,
  false
);
assert.equal(
  "metricDefinitionVersion" in validPromptCompilation.promptSetVersion,
  false
);

const duplicateCore = clonePromptCompilation(validPromptCompilation);
const extraCore = readyPromptRevision({
  promptId: "prompt-extra-core",
  promptRevisionId: "prompt-revision-extra-core",
  intentCellId: "intent-cell-core-001",
  intentCellRevisionId: "intent-cell-revision-core-001",
  contentHash: "sha256:prompt-revision-extra-core"
});
duplicateCore.promptRevisions.push(extraCore);
duplicateCore.memberships.push(
  promptMembership({
    membershipId: "membership-extra-core",
    promptRevisionId: extraCore.promptRevisionId,
    intentCellId: extraCore.intentCellId,
    intentCellRevisionId: extraCore.intentCellRevisionId,
    sortOrder: 50
  })
);
assert.ok(
  validatePromptSetCompilationContract(duplicateCore).blockers.includes(
    "core_canonical_count_invalid:intent-cell-revision-core-001"
  )
);

const missingDiagnostic = clonePromptCompilation(validPromptCompilation);
const diagnosticIndex = missingDiagnostic.memberships.findIndex(
  (item) => item.panelRole === "diagnostic"
);
assert.notEqual(diagnosticIndex, -1);
const [removedDiagnostic] = missingDiagnostic.memberships.splice(diagnosticIndex, 1);
missingDiagnostic.promptRevisions = missingDiagnostic.promptRevisions.filter(
  (item) => item.promptRevisionId !== removedDiagnostic.promptRevisionId
);
assert.ok(
  validatePromptSetCompilationContract(missingDiagnostic).blockers.includes(
    "profile_diagnostic_count_mismatch"
  )
);

const validExecutionCompilation = buildExecutionCompilation();
assert.equal(
  validateExecutionProfileSetCompilationContract(validExecutionCompilation).valid,
  true
);
assert.equal(validExecutionCompilation.executionProfiles.length, 2);
assert.equal(
  validateExecutionProfileContract(validExecutionCompilation.executionProfiles[0])
    .valid,
  true
);

const duplicateExecution = cloneExecutionCompilation(validExecutionCompilation);
duplicateExecution.memberships[1] = {
  ...duplicateExecution.memberships[1],
  executionProfileId: duplicateExecution.memberships[0].executionProfileId
};
assert.ok(
  validateExecutionProfileSetCompilationContract(duplicateExecution).blockers.some(
    (item) => item.startsWith("duplicate_execution_profile_membership:")
  )
);

const policyBundle = frozenPolicyBundle();
assert.equal(
  validateMeasurementPolicyBundleVersionContract(policyBundle).valid,
  true
);
assert.ok(
  validateMeasurementPolicyBundleVersionContract({
    ...policyBundle,
    aggregationPolicyVersion: ""
  }).blockers.includes("aggregation_policy_version_missing")
);

const activeDesign = activeDesignVersion();
assert.equal(validateMeasurementDesignVersionContract(activeDesign).valid, true);
assert.ok(
  validateMeasurementDesignVersionContract({ ...activeDesign, activatedAt: null })
    .blockers.includes("active_design_requires_activated_at")
);

const validDesignCompilation = buildDesignCompilation();
assert.equal(
  validateMeasurementDesignCompilationContract(validDesignCompilation).valid,
  true
);

const promptMismatch = buildDesignCompilation({
  design: { promptSetVersionId: "prompt-set-version-other" }
});
assert.ok(
  validateMeasurementDesignCompilationContract(promptMismatch).blockers.includes(
    "design_prompt_set_version_mismatch"
  )
);

const executionMismatch = buildDesignCompilation({
  design: {
    executionProfileSetVersionId: "execution-profile-set-version-other"
  }
});
assert.ok(
  validateMeasurementDesignCompilationContract(executionMismatch).blockers.includes(
    "design_execution_profile_set_version_mismatch"
  )
);

const policyMismatch = buildDesignCompilation({
  design: { measurementPolicyBundleVersionId: "policy-bundle-other" }
});
assert.ok(
  validateMeasurementDesignCompilationContract(policyMismatch).blockers.includes(
    "design_policy_bundle_version_mismatch"
  )
);

const executionV2 = buildExecutionCompilation({
  executionProfileSetId: "execution-profile-set-002",
  executionProfileSetVersionId: "execution-profile-set-version-002",
  versionLabel: "2026-08-exec-v2",
  contentHash: "sha256:execution-profile-set-version-002",
  supersedesExecutionProfileSetVersionId: "execution-profile-set-version-001"
});
const executionOnlyChange = buildDesignCompilation({
  design: {
    measurementDesignVersionId: "measurement-design-version-002",
    versionNumber: 2,
    executionProfileSetVersionId: "execution-profile-set-version-002",
    contentHash: "sha256:measurement-design-version-002",
    supersedesMeasurementDesignVersionId: "measurement-design-version-001"
  },
  execution: executionV2
});
assert.equal(
  executionOnlyChange.measurementDesignVersion.promptSetVersionId,
  validDesignCompilation.measurementDesignVersion.promptSetVersionId
);
assert.equal(
  validateMeasurementDesignCompilationContract(executionOnlyChange).valid,
  true
);

const projection = projectPromptRevisionToLegacyScope(
  promptRevision,
  "visibility"
);
assert.equal(projection.status, "projected");
assert.equal(projection.scope.promptType, "non_branded");
assert.equal(projection.scope.measurementPurpose, "visibility");
assert.ok(projection.warnings.includes("lossy_projection"));
assert.ok(
  projection.warnings.includes("legacy_projection_is_compatibility_read_only")
);
assert.equal(
  projectPromptRevisionToLegacyScope({
    ...promptRevision,
    lifecycleStatus: "validated"
  }).status,
  "blocked"
);

console.log(
  JSON.stringify(
    {
      status: "ok",
      checkedCases: {
        enumCollections: enumCollections.length,
        promptProfiles: RECORA_PROMPT_PROFILE_DEFINITIONS.length,
        recoraWholeStructureBoundary: true,
        measurementDesignIsSingleFormalOutput: true,
        semanticPanelSeparatedFromExecutionMatrix: true,
        policiesSeparatedFromPromptSet: true,
        legacyAdaptersAreInspectionOnly: true,
        legacyMetadataTextMismatchRequiresReview: true,
        criteriaOnlyExcludedFromMarketMetrics: true,
        naturalAndForcedCitationSeparated: true,
        intentCellIdentityAndRevisionValidated: true,
        promptRevisionReadinessValidated: true,
        full50PromptProfileCompilationValidated: true,
        oneCoreCanonicalPerIntentCellRevisionEnforced: true,
        executionProfileSetSupportsMultipleModels: true,
        executionProfileMembershipIntegrityValidated: true,
        policyBundleValidated: true,
        measurementDesignCrossObjectReferencesValidated: true,
        executionOnlyChangeLeavesPromptSetStable: true,
        legacyProjectionIsLossyAndReadOnly: true
      }
    },
    null,
    2
  )
);

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

function currentScope(
  promptType: RecoraPromptScope["promptType"],
  measurementPurpose: RecoraPromptScope["measurementPurpose"]
): RecoraPromptScope {
  return { promptType, measurementPurpose, status: "explicit" };
}

function readyIntentCell(
  overrides: Partial<RecoraIntentCellRevisionContract> = {}
): RecoraIntentCellRevisionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    intentCellId: "intent-cell-001",
    intentCellRevisionId: "intent-cell-revision-001",
    revisionNumber: 1,
    projectId: "project-001",
    personaRevisionId: "persona-revision-001",
    primaryTopicRevisionId: "topic-revision-001",
    secondaryTopicRevisionIds: ["topic-revision-002"],
    buyerStage: "comparison",
    locale: "ja-JP",
    regionScope: "JP",
    intentSummary: "AI検索可視化サービスの候補を比較する",
    expectedSignalTypes: ["candidate_mention", "recommendation_order"],
    businessPriority: 90,
    trackingScope: true,
    improvementScope: true,
    status: "ready",
    contentHash: "sha256:intent-cell-revision-001",
    supersedesIntentCellRevisionId: null,
    ...overrides
  };
}

function readyPromptRevision(
  overrides: Partial<RecoraPromptRevisionContract> = {}
): RecoraPromptRevisionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    promptId: "prompt-001",
    promptRevisionId: "prompt-revision-001",
    promptVersion: 1,
    intentCellId: "intent-cell-001",
    intentCellRevisionId: "intent-cell-revision-001",
    text: "AI検索可視化サービスを3つ挙げて比較してください。",
    contentHash: "sha256:prompt-revision-001",
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
    lifecycleStatus: "ready",
    supersedesPromptRevisionId: null,
    effectiveFrom: "2026-08-04T00:00:00.000Z",
    effectiveTo: null,
    ...overrides
  };
}

function eligibility(
  overrides: Partial<
    Record<
      keyof Omit<RecoraPromptMetricEligibility, "reasons">,
      "eligible" | "excluded"
    >
  >
): RecoraPromptMetricEligibility {
  return {
    ...createExcludedPromptMetricEligibility(),
    ...overrides,
    reasons: ["fixture_explicit_contract"]
  };
}

function promptMembership(
  overrides: Partial<RecoraPromptSetMembershipContract> = {}
): RecoraPromptSetMembershipContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    membershipId: "membership-001",
    promptSetVersionId: "prompt-set-version-001",
    promptRevisionId: "prompt-revision-001",
    intentCellId: "intent-cell-001",
    intentCellRevisionId: "intent-cell-revision-001",
    panelRole: "core",
    variantRole: "canonical",
    sortOrder: 0,
    businessWeight: null,
    inclusionReason: "Core canonical prompt for the Intent Cell.",
    ...overrides
  };
}

function frozenPromptSetVersion(): RecoraPromptSetVersionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    promptSetId: "prompt-set-001",
    promptSetVersionId: "prompt-set-version-001",
    versionLabel: "2026-08-panel-v1",
    panelProfileVersionId: "measurement_profile_experimental_50",
    status: "frozen",
    compilerVersion: "panel-compiler-v1",
    semanticClustererVersion: "semantic-clusterer-v1",
    contentHash: "sha256:prompt-set-version-001",
    validatedAt: "2026-08-04T00:00:00.000Z",
    frozenAt: "2026-08-04T00:05:00.000Z",
    supersedesPromptSetVersionId: null
  };
}

function readyExecutionProfile(
  overrides: Partial<RecoraExecutionProfileContract> = {}
): RecoraExecutionProfileContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    executionProfileId: "execution-profile-001",
    provider: "provider-one",
    surface: "api-search",
    requestedModel: "model-one",
    modelVersionPolicy: "provider-reported-version",
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
    providerConfigurationSchemaVersion: "provider-config-v1",
    contentHash: "sha256:execution-profile-001",
    status: "ready",
    ...overrides
  };
}

function frozenExecutionSetVersion(
  overrides: Partial<RecoraExecutionProfileSetVersionContract> = {}
): RecoraExecutionProfileSetVersionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    executionProfileSetId: "execution-profile-set-001",
    executionProfileSetVersionId: "execution-profile-set-version-001",
    versionLabel: "2026-08-exec-v1",
    status: "frozen",
    contentHash: "sha256:execution-profile-set-version-001",
    validatedAt: "2026-08-04T00:00:00.000Z",
    frozenAt: "2026-08-04T00:05:00.000Z",
    supersedesExecutionProfileSetVersionId: null,
    ...overrides
  };
}

function executionMembership(
  overrides: Partial<RecoraExecutionProfileSetMembershipContract> = {}
): RecoraExecutionProfileSetMembershipContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    membershipId: "execution-membership-001",
    executionProfileSetVersionId: "execution-profile-set-version-001",
    executionProfileId: "execution-profile-001",
    sortOrder: 0,
    requiredForFormalMeasurement: true,
    requiredForPublicationCoverage: true,
    plannedObservationWeight: 1,
    membershipReason: "Primary formal provider/model context.",
    ...overrides
  };
}

function frozenPolicyBundle(): RecoraMeasurementPolicyBundleVersionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    measurementPolicyBundleVersionId: "measurement-policy-bundle-version-001",
    versionLabel: "2026-08-policy-v1",
    status: "frozen",
    metricDefinitionVersion: "metric-v1",
    validResponsePolicyVersion: "valid-response-v1",
    aggregationPolicyVersion: "aggregation-v1",
    repeatPolicyVersion: "repeat-v1",
    compatibilityPolicyVersion: "compatibility-v1",
    contentHash: "sha256:measurement-policy-bundle-version-001",
    validatedAt: "2026-08-04T00:00:00.000Z",
    frozenAt: "2026-08-04T00:05:00.000Z",
    supersedesMeasurementPolicyBundleVersionId: null
  };
}

function activeDesignVersion(
  overrides: Partial<RecoraMeasurementDesignVersionContract> = {}
): RecoraMeasurementDesignVersionContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    measurementDesignId: "measurement-design-001",
    measurementDesignVersionId: "measurement-design-version-001",
    versionNumber: 1,
    status: "active",
    analysisTargetVersionId: "analysis-target-version-001",
    brandIdentityVersionId: "brand-identity-version-001",
    promptSetVersionId: "prompt-set-version-001",
    executionProfileSetVersionId: "execution-profile-set-version-001",
    panelProfileVersionId: "measurement_profile_experimental_50",
    measurementPolicyBundleVersionId:
      "measurement-policy-bundle-version-001",
    entitlementSnapshotId: "entitlement-snapshot-001",
    sourceEvidenceBundleId: "source-evidence-bundle-001",
    contentHash: "sha256:measurement-design-version-001",
    supersedesMeasurementDesignVersionId: null,
    rollbackOfMeasurementDesignVersionId: null,
    createdAt: "2026-08-04T00:00:00.000Z",
    validatedAt: "2026-08-04T00:03:00.000Z",
    readyAt: "2026-08-04T00:04:00.000Z",
    activatedAt: "2026-08-04T00:06:00.000Z",
    supersededAt: null,
    retiredAt: null,
    ...overrides
  };
}

function buildPromptCompilation(): MutablePromptCompilation {
  const intentCells: RecoraIntentCellRevisionContract[] = [];
  const promptRevisions: RecoraPromptRevisionContract[] = [];
  const memberships: RecoraPromptSetMembershipContract[] = [];
  let sortOrder = 0;

  for (let index = 1; index <= 38; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const intentCellId = `intent-cell-core-${suffix}`;
    const intentCellRevisionId = `intent-cell-revision-core-${suffix}`;
    const promptRevisionId = `prompt-revision-core-${suffix}`;
    intentCells.push(
      readyIntentCell({
        intentCellId,
        intentCellRevisionId,
        intentSummary: `Core intent ${suffix}`,
        primaryTopicRevisionId: `topic-revision-core-${suffix}`,
        secondaryTopicRevisionIds: [],
        contentHash: `sha256:${intentCellRevisionId}`
      })
    );
    promptRevisions.push(
      readyPromptRevision({
        promptId: `prompt-core-${suffix}`,
        promptRevisionId,
        intentCellId,
        intentCellRevisionId,
        text: `AI検索可視化サービスの候補を3つ挙げて比較してください ${suffix}`,
        contentHash: `sha256:${promptRevisionId}`
      })
    );
    memberships.push(
      promptMembership({
        membershipId: `membership-core-${suffix}`,
        promptRevisionId,
        intentCellId,
        intentCellRevisionId,
        sortOrder,
        inclusionReason: `Core canonical ${suffix}`
      })
    );
    sortOrder += 1;
  }

  for (let index = 1; index <= 8; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const intentCellId = `intent-cell-core-${suffix}`;
    const intentCellRevisionId = `intent-cell-revision-core-${suffix}`;
    const promptRevisionId = `prompt-revision-robustness-${suffix}`;
    promptRevisions.push(
      readyPromptRevision({
        promptId: `prompt-robustness-${suffix}`,
        promptRevisionId,
        intentCellId,
        intentCellRevisionId,
        text: `AI検索 可視化 ツール 比較 ${suffix}`,
        contentHash: `sha256:${promptRevisionId}`,
        languageMode: "raw_search_like",
        variantRole: "robustness"
      })
    );
    memberships.push(
      promptMembership({
        membershipId: `membership-robustness-${suffix}`,
        promptRevisionId,
        intentCellId,
        intentCellRevisionId,
        panelRole: "robustness",
        variantRole: "robustness",
        sortOrder,
        inclusionReason: `Robustness variant ${suffix}`
      })
    );
    sortOrder += 1;
  }

  for (let index = 1; index <= 4; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const intentCellId = `intent-cell-core-${suffix}`;
    const intentCellRevisionId = `intent-cell-revision-core-${suffix}`;
    const promptRevisionId = `prompt-revision-diagnostic-${suffix}`;
    promptRevisions.push(
      readyPromptRevision({
        promptId: `prompt-diagnostic-${suffix}`,
        promptRevisionId,
        intentCellId,
        intentCellRevisionId,
        text: `AI検索可視化サービスの比較根拠となる出典を示してください ${suffix}`,
        contentHash: `sha256:${promptRevisionId}`,
        questionFamily: "citation_evidence",
        questionAct: "request_sources",
        responseShape: "evidence_answer",
        variantRole: "diagnostic",
        candidateMentionOpportunity: "none",
        rankingOpportunity: "none",
        metricEligibility: eligibility({
          forcedCitationValidation: "eligible",
          recommendationInput: "eligible"
        })
      })
    );
    memberships.push(
      promptMembership({
        membershipId: `membership-diagnostic-${suffix}`,
        promptRevisionId,
        intentCellId,
        intentCellRevisionId,
        panelRole: "diagnostic",
        variantRole: "diagnostic",
        sortOrder,
        inclusionReason: `Diagnostic source check ${suffix}`
      })
    );
    sortOrder += 1;
  }

  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    promptSetVersion: frozenPromptSetVersion(),
    intentCells,
    promptRevisions,
    memberships
  };
}

function buildExecutionCompilation(
  setOverrides: Partial<RecoraExecutionProfileSetVersionContract> = {}
): MutableExecutionCompilation {
  const setVersion = frozenExecutionSetVersion(setOverrides);
  const first = readyExecutionProfile();
  const second = readyExecutionProfile({
    executionProfileId: "execution-profile-002",
    provider: "provider-two",
    requestedModel: "model-two",
    contentHash: "sha256:execution-profile-002"
  });
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    executionProfileSetVersion: setVersion,
    executionProfiles: [first, second],
    memberships: [
      executionMembership({
        executionProfileSetVersionId: setVersion.executionProfileSetVersionId
      }),
      executionMembership({
        membershipId: "execution-membership-002",
        executionProfileSetVersionId: setVersion.executionProfileSetVersionId,
        executionProfileId: second.executionProfileId,
        sortOrder: 1,
        requiredForPublicationCoverage: false,
        membershipReason: "Secondary formal provider/model context."
      })
    ]
  };
}

function buildDesignCompilation(
  overrides: {
    design?: Partial<RecoraMeasurementDesignVersionContract>;
    prompt?: RecoraPromptSetCompilationContract;
    execution?: RecoraExecutionProfileSetCompilationContract;
    policy?: RecoraMeasurementPolicyBundleVersionContract;
  } = {}
): RecoraMeasurementDesignCompilationContract {
  return {
    contractVersion: RECORA_PROMPT_MEASUREMENT_CONTRACT_VERSION,
    measurementDesignVersion: activeDesignVersion(overrides.design),
    promptSetCompilation: overrides.prompt ?? buildPromptCompilation(),
    executionProfileSetCompilation:
      overrides.execution ?? buildExecutionCompilation(),
    measurementPolicyBundleVersion: overrides.policy ?? frozenPolicyBundle()
  };
}

type MutablePromptCompilation = {
  contractVersion: RecoraPromptSetCompilationContract["contractVersion"];
  promptSetVersion: RecoraPromptSetVersionContract;
  intentCells: RecoraIntentCellRevisionContract[];
  promptRevisions: RecoraPromptRevisionContract[];
  memberships: RecoraPromptSetMembershipContract[];
};

type MutableExecutionCompilation = {
  contractVersion: RecoraExecutionProfileSetCompilationContract["contractVersion"];
  executionProfileSetVersion: RecoraExecutionProfileSetVersionContract;
  executionProfiles: RecoraExecutionProfileContract[];
  memberships: RecoraExecutionProfileSetMembershipContract[];
};

function clonePromptCompilation(
  value: RecoraPromptSetCompilationContract
): MutablePromptCompilation {
  return {
    contractVersion: value.contractVersion,
    promptSetVersion: { ...value.promptSetVersion },
    intentCells: value.intentCells.map((item) => ({ ...item })),
    promptRevisions: value.promptRevisions.map((item) => ({
      ...item,
      metricEligibility: { ...item.metricEligibility }
    })),
    memberships: value.memberships.map((item) => ({ ...item }))
  };
}

function cloneExecutionCompilation(
  value: RecoraExecutionProfileSetCompilationContract
): MutableExecutionCompilation {
  return {
    contractVersion: value.contractVersion,
    executionProfileSetVersion: { ...value.executionProfileSetVersion },
    executionProfiles: value.executionProfiles.map((item) => ({ ...item })),
    memberships: value.memberships.map((item) => ({ ...item }))
  };
}
