import assert from "node:assert/strict";

import {
  RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
  RECORA_FIXED_PROMPT_METRIC_KEYS,
  canonicalizeJson,
  materializeFixedPromptConfiguration,
  materializeFixedPromptMetricEligibility,
  normalizeFixedPromptMetricEligibility,
  sha256Lowercase,
  stableUuid,
  validateFixedPromptCanonicalPrompts,
  validateFixedPromptMaterializationDraft
} from "../lib/recora/fixed-prompt-materialization";
import {
  PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
  type BuyerStage,
  type PersonaDraft,
  type ProjectSetupDraft,
  type ProjectSetupSeedInput,
  type PromptDraft,
  type TopicDraft
} from "../lib/recora/project-setup-draft";
import { generateProjectSetupDraft } from "../lib/recora/project-setup-draft-generator";
import type { RecoraFixedPromptMetricEligibility } from "../lib/recora/db/types";

const SHA_256_HEX = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const INTENT_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REASON_CODE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const projectId = stableUuid("recora-demo", "project:fixture");
const brandIdentity = {
  brandName: "Recora",
  serviceName: "Recora",
  aliases: ["recora"],
  officialSiteUrl: "https://recora.example"
} as const;
const materializationInput = {
  projectId,
  brandIdentity,
  knownCompetitors: ["RivalCo"],
  knownCompetitorAliases: ["Rival Cloud"]
} as const;

const seedInput: ProjectSetupSeedInput = {
  companyName: "Recora Inc.",
  brandName: "Recora",
  officialSiteUrl: "https://recora.example",
  productOrServiceDescription: "AI search visibility diagnostics for BtoB SaaS teams.",
  industryCategory: "AI search visibility software",
  targetCustomers: "Marketing leaders comparing AI search diagnostics.",
  regions: ["Japan"],
  language: "en",
  serviceName: "Recora",
  brandAliases: ["recora"],
  knownCompetitors: ["RivalCo"],
  diagnosisGoals: ["non_branded", "comparison", "citation_check", "sentiment"]
};

const completeDraft = createDraft({
  prompts: [
    createPrompt({
      promptId: "prompt-market-core",
      intentKey: "category-shortlist",
      panelRole: "core"
    }),
    createPrompt({
      promptId: "prompt-brand-diagnostic",
      text: "What is Recora's reputation and what should a buyer verify before using it?",
      intentKey: "brand-reputation",
      panelRole: "diagnostic",
      category: "branded",
      intent: "sentiment",
      intentType: "reputational",
      brandingMode: "branded",
      brandMentionRule: "brand_included",
      competitorMentionRule: "no_competitor",
      responseShape: "branded_sentiment_answer",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none"
    }),
    createPrompt({
      promptId: "prompt-citation-diagnostic",
      text: "When comparing AI search visibility tools, which source types should an AI answer cite?",
      intentKey: "citation-source-validation",
      panelRole: "diagnostic",
      category: "citation_check",
      intent: "citation_check",
      intentType: "evidence_seeking",
      responseShape: "evidence_answer",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none"
    }),
    createPrompt({
      promptId: "prompt-risk-diagnostic",
      text: "Before adopting AI search visibility software, what implementation risks should a team verify?",
      intentKey: "implementation-risk",
      panelRole: "diagnostic",
      category: "persona_based",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      riskFlags: ["implementation_risk_check"]
    }),
    createPrompt({
      promptId: "prompt-recommendation-diagnostic",
      text: "Before choosing AI search visibility software, which selection criteria should a team collect?",
      intentKey: "selection-criteria",
      panelRole: "diagnostic",
      category: "persona_based",
      intent: "non_branded",
      intentType: "informational",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none"
    })
  ]
});

const plan = materializeFixedPromptConfiguration(completeDraft, materializationInput);
assert.equal(plan.contractVersion, RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION);
assert.equal(plan.projectSlug, "recora-demo");
assert.equal(plan.projectId, projectId);
assert.equal(plan.promptConfigurationCount, completeDraft.prompts.length);
assert.match(plan.promptConfigurationHash, SHA_256_HEX);
assert.doesNotThrow(() => JSON.parse(plan.canonicalJson));
assert.deepEqual(validateFixedPromptCanonicalPrompts(plan.prompts).blockers, []);
assert.deepEqual(plan.prompts.map((prompt) => prompt.id), [...plan.prompts.map((prompt) => prompt.id)].sort());
assert.ok(plan.sourceMappings.personas.every((item) => UUID.test(item.id)));
assert.ok(plan.sourceMappings.topics.every((item) => UUID.test(item.id)));
assert.ok(plan.sourceMappings.prompts.every((item) => UUID.test(item.id)));
const marketCanonicalPrompt = plan.prompts.find((prompt) => prompt.metric_eligibility.visibility.state === "eligible");
assert.ok(marketCanonicalPrompt, "market canonical prompt missing");
const marketEligibility = materializeFixedPromptMetricEligibility(completeDraft.prompts[0], materializationInput);
assertMetricState(marketEligibility, "visibility", "eligible");
assertMetricState(marketEligibility, "ranking", "eligible");
assertMetricState(marketEligibility, "sov", "eligible");
assertMetricState(marketEligibility, "natural_citation_observation", "eligible");
assertMetricState(marketEligibility, "forced_citation_validation", "excluded");
assertAllMetricReasons(marketEligibility);

const brandedEligibility = materializeFixedPromptMetricEligibility(completeDraft.prompts[1], materializationInput);
assertMetricState(brandedEligibility, "visibility", "excluded");
assertMetricState(brandedEligibility, "ranking", "excluded");
assertMetricState(brandedEligibility, "sov", "excluded");
assertMetricState(brandedEligibility, "sentiment", "eligible");
assertMetricState(brandedEligibility, "brand_perception", "eligible");

const forcedCitationEligibility = materializeFixedPromptMetricEligibility(completeDraft.prompts[2], materializationInput);
assertMetricState(forcedCitationEligibility, "natural_citation_observation", "excluded");
assertMetricState(forcedCitationEligibility, "forced_citation_validation", "eligible");
assertMetricState(forcedCitationEligibility, "visibility", "excluded");
assertMetricState(forcedCitationEligibility, "ranking", "excluded");

const riskOnlyEligibility = materializeFixedPromptMetricEligibility(completeDraft.prompts[3], materializationInput);
assertMetricState(riskOnlyEligibility, "risk_check", "eligible");
assertMetricState(riskOnlyEligibility, "recommendation_input", "eligible");
assertMetricState(riskOnlyEligibility, "visibility", "excluded");
assertMetricState(riskOnlyEligibility, "ranking", "excluded");

const recommendationOnlyEligibility = materializeFixedPromptMetricEligibility(completeDraft.prompts[4], materializationInput);
assertMetricState(recommendationOnlyEligibility, "recommendation_input", "eligible");
assertMetricState(recommendationOnlyEligibility, "risk_check", "excluded");
assertMetricState(recommendationOnlyEligibility, "visibility", "excluded");
assertMetricState(recommendationOnlyEligibility, "ranking", "excluded");
assertMetricState(recommendationOnlyEligibility, "natural_citation_observation", "excluded");

const namedCompetitorEligibility = materializeFixedPromptMetricEligibility(
  createPrompt({
    promptId: "prompt-named-competitor",
    text: "How does RivalCo compare with other AI search visibility tools?",
    competitorMentionRule: "named_competitors",
    responseShape: "comparative_set",
    candidateMentionOpportunity: "direct",
    rankingOpportunity: "comparable_set"
  }),
  materializationInput
);
assertMetricState(namedCompetitorEligibility, "visibility", "excluded");
assertMetricState(namedCompetitorEligibility, "ranking", "excluded");
assertMetricState(namedCompetitorEligibility, "sov", "excluded");

const normalizedReasons = normalizeFixedPromptMetricEligibility({
  ...marketEligibility,
  visibility: { state: "eligible", reason_codes: ["z_reason", "a_reason", "z_reason"] }
});
assert.deepEqual(normalizedReasons.visibility.reason_codes, ["a_reason", "z_reason"]);

expectBlocked("manual metadata missing", patchPrompt(completeDraft, 0, { intentKey: undefined }), "intent_key_missing");
expectBlocked("invalid intent key", patchPrompt(completeDraft, 0, { intentKey: "Bad_Key" }), "intent_key_invalid");
expectBlocked("unapproved draft", { ...completeDraft, reviewStatus: "needs_review" }, "draft_review_status_not_approved");
expectBlocked("low confidence draft", { ...completeDraft, confidenceScore: 60 }, "draft_confidence_below_materialization_threshold");
expectBlocked("gate not ready", patchPrompt(completeDraft, 0, { gateDecision: "revise_before_measurement" }), "gate_decision_not_ready_for_measurement");
expectBlocked("brand optional", patchPrompt(completeDraft, 0, {
  brandingMode: "brand_optional",
  brandMentionRule: "brand_optional"
}), "brand_optional_prompt_must_be_split_before_materialization");
expectBlocked("target brand contamination", patchPrompt(completeDraft, 0, {
  text: "Which AI search visibility tools should a team compare, including Recora?"
}), "target_brand_signal_in_brand_excluded_text");
expectBlocked("known competitor contamination", patchPrompt(completeDraft, 0, {
  text: "Which AI search visibility tools should a team compare, including RivalCo?"
}), "known_competitor_signal_without_named_competitor_scope");
expectBlocked("duplicate core", createDraft({
  prompts: [
    completeDraft.prompts[0],
    createPrompt({ promptId: "prompt-market-core-copy", intentKey: "category-shortlist", panelRole: "core" })
  ]
}), "duplicate_core_prompts");
expectBlocked("robustness without core", createDraft({
  prompts: [createPrompt({ promptId: "prompt-orphan-robustness", intentKey: "orphan-intent", panelRole: "robustness" })]
}), "robustness_without_core");
expectBlocked("no eligible analysis", createDraft({
  prompts: [createPrompt({
    promptId: "prompt-no-analysis",
    intentKey: "no-analysis",
    panelRole: "diagnostic",
    intent: "non_branded",
    intentType: "informational",
    responseShape: "candidate_list",
    candidateMentionOpportunity: "none",
    rankingOpportunity: "none"
  })]
}), "no_eligible_analysis");

const diagnosticOnly = materializeFixedPromptConfiguration(createDraft({
  prompts: [completeDraft.prompts[3]]
}), materializationInput);
assert.equal(diagnosticOnly.promptConfigurationCount, 1);
assert.equal(diagnosticOnly.prompts[0].panel_role, "diagnostic");

const compatibilityMismatch = validateFixedPromptCanonicalPrompts([
  {
    ...marketCanonicalPrompt,
    measurement_purpose: "sentiment"
  }
]);
assert.ok(compatibilityMismatch.blockers.some((blocker) => blocker.includes("compatibility_measurement_purpose_not_eligible")));

const naturalForcedMismatch = validateFixedPromptCanonicalPrompts([
  {
    ...marketCanonicalPrompt,
    metric_eligibility: {
      ...marketCanonicalPrompt.metric_eligibility,
      forced_citation_validation: { state: "eligible", reason_codes: ["manual_bad_fixture"] }
    }
  }
]);
assert.ok(naturalForcedMismatch.blockers.some((blocker) => blocker.includes("natural_and_forced_citation_must_be_separate")));
const sameUuid = stableUuid("recora-demo", "prompt:prompt-market-core");
assert.equal(sameUuid, stableUuid("recora-demo", "prompt:prompt-market-core"));
assert.match(sameUuid, UUID);
assert.notEqual(sameUuid, stableUuid("recora-other", "prompt:prompt-market-core"));
assert.notEqual(sameUuid, stableUuid("recora-demo", "topic:prompt-market-core"));
assert.notEqual(sameUuid, stableUuid("recora-demo", "prompt:prompt-other"));

const reorderedPlan = materializeFixedPromptConfiguration({
  ...completeDraft,
  personas: [...completeDraft.personas].reverse(),
  topics: [...completeDraft.topics].reverse(),
  prompts: [...completeDraft.prompts].reverse()
}, materializationInput);
assert.equal(reorderedPlan.promptConfigurationHash, plan.promptConfigurationHash);
assert.equal(reorderedPlan.canonicalJson, plan.canonicalJson);

assert.equal(canonicalizeJson({ b: 2, a: 1 }), canonicalizeJson({ a: 1, b: 2 }));
assert.equal(
  canonicalizeJson({ text: "Cafe\u0301\r\nLine", metric_eligibility: normalizedReasons }),
  canonicalizeJson({ metric_eligibility: normalizedReasons, text: "Caf\u00e9\nLine" })
);
assert.throws(() => canonicalizeJson({ ok: true, missing: undefined }));

const reasonOrderA = canonicalizeJson({
  metric_eligibility: normalizeFixedPromptMetricEligibility({
    ...marketEligibility,
    ranking: { state: "eligible", reason_codes: ["b_reason", "a_reason"] }
  })
});
const reasonOrderB = canonicalizeJson({
  metric_eligibility: normalizeFixedPromptMetricEligibility({
    ...marketEligibility,
    ranking: { state: "eligible", reason_codes: ["a_reason", "b_reason", "a_reason"] }
  })
});
assert.equal(reasonOrderA, reasonOrderB);

const textMutationPlan = materializeFixedPromptConfiguration(
  patchPrompt(completeDraft, 0, { text: "Which AI search visibility software should a BtoB team shortlist first?" }),
  materializationInput
);
assert.notEqual(textMutationPlan.promptConfigurationHash, plan.promptConfigurationHash);

const addedPromptPlan = materializeFixedPromptConfiguration(createDraft({
  prompts: [
    ...completeDraft.prompts,
    createPrompt({
      promptId: "prompt-extra-risk",
      intentKey: "extra-risk",
      panelRole: "diagnostic",
      text: "What procurement risk should be reviewed before buying AI search visibility software?",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      riskFlags: ["procurement_risk_check"]
    })
  ]
}), materializationInput);
assert.equal(addedPromptPlan.promptConfigurationCount, plan.promptConfigurationCount + 1);
assert.notEqual(addedPromptPlan.promptConfigurationHash, plan.promptConfigurationHash);

const mutatedEligibilityHash = sha256Lowercase(canonicalizeJson({
  contract_version: RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
  project_id: plan.projectId,
  prompts: plan.prompts.map((prompt) => prompt.id === marketCanonicalPrompt.id ? {
    ...prompt,
    metric_eligibility: {
      ...prompt.metric_eligibility,
      visibility: { state: "excluded", reason_codes: ["manual_hash_fixture"] }
    }
  } : prompt)
}));
assert.notEqual(mutatedEligibilityHash, plan.promptConfigurationHash);

const secondPersona = createPersona({
  personaId: "persona-demand-gen-leader",
  displayName: "Demand generation leader",
  roleType: "evaluator"
});
const remappedPersonaPlan = materializeFixedPromptConfiguration(createDraft({
  personas: [createPersona(), secondPersona],
  prompts: completeDraft.prompts.map((prompt, index) => index === 0 ? { ...prompt, personaId: secondPersona.personaId } : prompt)
}), materializationInput);
assert.notEqual(remappedPersonaPlan.promptConfigurationHash, plan.promptConfigurationHash);

const generatedResult = generateProjectSetupDraft(seedInput);
const generatedDraft = generatedResult.draft;
assert.ok(generatedDraft.prompts.length > 0);
for (const prompt of generatedDraft.prompts) {
  assert.ok(prompt.intentKey, `${prompt.promptId} intentKey missing`);
  assert.match(prompt.intentKey, INTENT_KEY, `${prompt.promptId} intentKey invalid`);
  assert.ok(prompt.panelRole === "core" || prompt.panelRole === "diagnostic", `${prompt.promptId} panelRole invalid`);
  assert.notEqual(prompt.panelRole, "robustness", `${prompt.promptId} generated unsupported robustness`);
}

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    approvedCompleteDraftPasses: true,
    generatorPromptsHaveMetadata: generatedDraft.prompts.length,
    metricEligibilityNineKeys: RECORA_FIXED_PROMPT_METRIC_KEYS.length,
    manualMetadataMissingFails: true,
    invalidIntentKeyFails: true,
    unapprovedDraftFails: true,
    lowConfidenceFails: true,
    gateNotReadyFails: true,
    brandOptionalFails: true,
    targetBrandContaminationFails: true,
    knownCompetitorContaminationFails: true,
    duplicateCoreFails: true,
    robustnessWithoutCoreFails: true,
    diagnosticOnlyPasses: true,
    riskOnlyPasses: true,
    recommendationOnlyPasses: true,
    naturalForcedCitationMismatchFails: true,
    compatibilityMismatchFails: true,
    uuidAndHashStable: true
  },
  promptConfigurationHash: plan.promptConfigurationHash,
  promptConfigurationCount: plan.promptConfigurationCount
}, null, 2));
function assertMetricState(
  eligibility: RecoraFixedPromptMetricEligibility,
  metricKey: typeof RECORA_FIXED_PROMPT_METRIC_KEYS[number],
  state: "eligible" | "excluded"
) {
  assert.equal(eligibility[metricKey].state, state, metricKey);
}

function assertAllMetricReasons(eligibility: RecoraFixedPromptMetricEligibility) {
  assert.deepEqual(Object.keys(eligibility), [...RECORA_FIXED_PROMPT_METRIC_KEYS]);
  for (const metricKey of RECORA_FIXED_PROMPT_METRIC_KEYS) {
    const reasonCodes = eligibility[metricKey].reason_codes;
    assert.ok(reasonCodes.length > 0, `${metricKey} reason_codes missing`);
    assert.deepEqual(reasonCodes, Array.from(new Set(reasonCodes)).sort(), `${metricKey} reason_codes canonical`);
    for (const reasonCode of reasonCodes) {
      assert.match(reasonCode, REASON_CODE, `${metricKey} reason code format`);
    }
  }
}

function expectBlocked(name: string, draft: ProjectSetupDraft, expectedBlocker: string) {
  const validation = validateFixedPromptMaterializationDraft(draft, materializationInput);
  assert.equal(validation.materializationReady, false, name);
  assert.ok(
    validation.blockers.some((blocker) => blocker.includes(expectedBlocker)),
    `${name}: expected ${expectedBlocker}, got ${validation.blockers.join(", ")}`
  );
}

function createDraft(overrides: Partial<ProjectSetupDraft> = {}): ProjectSetupDraft {
  const persona = createPersona();
  const topic = createTopic();
  return {
    schemaVersion: PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
    draftId: "setup-draft-fixed-prompt-b1",
    projectSlug: "recora-demo",
    promptSetVersion: "setup-draft-v1",
    generatorVersion: "fixture-v1",
    seedInput,
    inputCompletion: [
      { field: "brandName", status: "provided", value: seedInput.brandName },
      { field: "industryCategory", status: "provided", value: seedInput.industryCategory }
    ],
    reviewStatus: "approved",
    confidenceScore: 88,
    personas: [persona],
    topics: [topic],
    prompts: [createPrompt()],
    competitors: [],
    citationAngles: [],
    pageImprovementAngles: [],
    riskFlags: [],
    ...overrides
  };
}

function createPersona(overrides: Partial<PersonaDraft> = {}): PersonaDraft {
  return {
    personaId: "persona-marketing-leader",
    displayName: "Marketing leader",
    segment: "BtoB SaaS marketing",
    businessType: "BtoB",
    industryCategory: "AI search visibility software",
    roleType: "decision_maker",
    detailedDecisionRole: "Owns measurement vendor selection",
    roleMappingReason: "Matches Recora reporting buyer",
    buyerStage: "comparison",
    jobs: ["Compare AI search visibility tools"],
    painPoints: ["AI answer visibility is hard to measure"],
    triggerEvents: ["Need a repeatable AI search report"],
    switchingForces: ["Manual checks are too slow"],
    alternativesConsidered: ["SEO agency", "manual prompt checks"],
    comparisonAxis: ["measurement coverage", "evidence quality"],
    proofNeeded: ["sample report", "methodology"],
    trustRequirement: "Evidence-labeled reports",
    promptAngle: "Compare AI search visibility diagnosis tools without seeding a brand.",
    promptReadiness: "ready_for_prompt_design",
    researchSufficiency: "site_informed_hypothesis",
    confidenceScore: 84,
    needsVerification: false,
    riskFlags: [],
    sourceStatus: "provided",
    reviewStatus: "approved",
    ...overrides
  };
}

function createTopic(overrides: Partial<TopicDraft> = {}): TopicDraft {
  return {
    topicId: "topic-ai-search-diagnosis",
    topicName: "AI search visibility diagnosis tool discovery",
    topicType: "category_discovery_topic",
    diagnosisGoal: "Observe vendor discovery, recommendation order, and evidence-source behavior.",
    targetPersonaId: "persona-marketing-leader",
    buyerStage: "comparison",
    metricTarget: {
      visibilityRate: "eligible",
      ranking: "eligible",
      sentiment: "excluded",
      citationCheck: "eligible",
      riskCheck: "eligible"
    },
    brandMentionPolicy: "brand_excluded",
    expectedSignal: "AI answer mentions candidate tools, rank or order, and cited source types.",
    minimumPromptCount: 1,
    riskOrBias: "Avoid seeding Recora in non-branded discovery prompts.",
    handoffSkill: "recora-competitor-benchmark",
    topicQualityDecision: "topic_ready",
    coverageStatus: "covered",
    confidenceScore: 84,
    reviewStatus: "approved",
    ...overrides
  };
}

function createPrompt(overrides: Partial<PromptDraft> = {}): PromptDraft {
  const buyerStage: BuyerStage = "comparison";
  return {
    promptId: "prompt-market-core",
    topicId: "topic-ai-search-diagnosis",
    personaId: "persona-marketing-leader",
    text: "Which AI search visibility diagnosis tools should a BtoB SaaS marketing team compare first?",
    rawUserIntent: "AI search visibility diagnosis tools comparison",
    intentKey: "category-shortlist",
    panelRole: "core",
    languageMode: "natural_conversation",
    category: "non_branded",
    intent: "buyer_intent",
    intentType: "commercial_investigation",
    buyerStage,
    brandingMode: "non_branded",
    brandMentionRule: "brand_excluded",
    competitorMentionRule: "unknown_competitor_discovery",
    responseShape: "ranked_recommendation",
    candidateMentionOpportunity: "direct",
    rankingOpportunity: "direct",
    expectedSignal: "AI answer returns candidate tools and recommendation order.",
    qualityScore: 86,
    gateDecision: "ready_for_measurement",
    gateReason: "Clear non-branded buyer intent with candidate and ranking opportunity.",
    sourceStatus: "provided",
    seedTerms: [],
    seedContaminationRisk: "low",
    needsVerification: false,
    confidenceScore: 84,
    reviewStatus: "approved",
    riskFlags: [],
    ...overrides
  };
}

function patchPrompt(draft: ProjectSetupDraft, index: number, overrides: Partial<PromptDraft>): ProjectSetupDraft {
  return {
    ...draft,
    prompts: draft.prompts.map((prompt, promptIndex) => promptIndex === index ? { ...prompt, ...overrides } : prompt)
  };
}