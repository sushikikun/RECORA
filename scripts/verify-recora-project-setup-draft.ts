import assert from "node:assert/strict";

import {
  PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
  derivePromptMetricEligibility,
  getProjectSetupDraftMaterializationDecision,
  getPromptMeasurementReadiness,
  validateProjectSetupDraft
} from "../lib/recora/project-setup-draft";
import type {
  BuyerStage,
  PersonaDraft,
  ProjectSetupDraft,
  ProjectSetupSeedInput,
  PromptDraft,
  TopicDraft
} from "../lib/recora/project-setup-draft";

const brandIdentity = {
  brandName: "Recora",
  serviceName: "Recora",
  aliases: ["recora"],
  officialSiteUrl: "https://recora.example"
} as const;

const seedInput: ProjectSetupSeedInput = {
  companyName: "Recora Inc.",
  brandName: "Recora",
  officialSiteUrl: "https://recora.example",
  productOrServiceDescription: "AI search visibility diagnosis for BtoB SaaS teams.",
  industryCategory: "BtoB SaaS",
  targetCustomers: "Marketing leaders who need AI search visibility diagnostics.",
  regions: ["Japan"],
  language: "ja",
  serviceName: "Recora",
  brandAliases: ["recora"],
  diagnosisGoals: ["non_branded", "comparison", "citation_check", "sentiment"]
};

const persona = createPersona();
const topic = createTopic();

const nonBrandedBuyerIntentPrompt = createPrompt({
  promptId: "prompt-non-branded-buyer-intent",
  text: "AI検索で自社サービスの表示状況を診断できるツールのおすすめは？",
  intent: "buyer_intent",
  category: "non_branded",
  brandMentionRule: "brand_excluded",
  responseShape: "ranked_recommendation",
  candidateMentionOpportunity: "direct",
  rankingOpportunity: "direct"
});

const brandedComparisonPrompt = createPrompt({
  promptId: "prompt-branded-comparison",
  text: "Recoraと他のAI検索診断ツールを比較するときの候補を教えて",
  intent: "comparison",
  category: "competitor_comparison",
  brandMentionRule: "brand_excluded",
  responseShape: "comparative_set",
  candidateMentionOpportunity: "direct",
  rankingOpportunity: "comparable_set"
});

const brandedSentimentPrompt = createPrompt({
  promptId: "prompt-branded-sentiment",
  text: "Recoraの評判や導入前に気をつける点は？",
  intent: "sentiment",
  category: "branded",
  brandingMode: "branded",
  brandMentionRule: "brand_included",
  intentType: "reputational",
  responseShape: "branded_sentiment_answer",
  candidateMentionOpportunity: "none",
  rankingOpportunity: "none"
});

const citationCheckPrompt = createPrompt({
  promptId: "prompt-citation-check",
  text: "AI検索診断ツールを比較するとき、回答はどのような情報源を参照する？",
  intent: "citation_check",
  category: "citation_check",
  intentType: "evidence_seeking",
  responseShape: "evidence_answer",
  candidateMentionOpportunity: "none",
  rankingOpportunity: "none"
});

const brandedComparisonEligibility = derivePromptMetricEligibility(brandedComparisonPrompt, brandIdentity);
assert.equal(brandedComparisonEligibility.visibilityRate, "excluded");
assert.equal(brandedComparisonEligibility.ranking, "excluded");
assert.equal(brandedComparisonEligibility.shareOfVoice, "excluded");
assert.ok(brandedComparisonEligibility.reasons.includes("comparison_prompt_contains_brand_signal"));

const nonBrandedBuyerIntentEligibility = derivePromptMetricEligibility(nonBrandedBuyerIntentPrompt, brandIdentity);
assert.equal(nonBrandedBuyerIntentEligibility.visibilityRate, "eligible");
assert.equal(nonBrandedBuyerIntentEligibility.ranking, "eligible");
assert.equal(nonBrandedBuyerIntentEligibility.shareOfVoice, "eligible");
assert.equal(nonBrandedBuyerIntentEligibility.sentiment, "excluded");

const sentimentEligibility = derivePromptMetricEligibility(brandedSentimentPrompt, brandIdentity);
assert.equal(sentimentEligibility.visibilityRate, "excluded");
assert.equal(sentimentEligibility.ranking, "excluded");
assert.equal(sentimentEligibility.shareOfVoice, "excluded");
assert.equal(sentimentEligibility.sentiment, "eligible");
assert.equal(sentimentEligibility.brandPerception, "eligible");

const unapprovedPromptReadiness = getPromptMeasurementReadiness(
  createPrompt({
    promptId: "prompt-unapproved",
    reviewStatus: "needs_review"
  }),
  brandIdentity
);
assert.equal(unapprovedPromptReadiness.measurementReady, false);
assert.ok(unapprovedPromptReadiness.blockers.includes("review_status_not_approved"));

const completeDraft = createDraft({
  personas: [persona],
  topics: [topic],
  prompts: [nonBrandedBuyerIntentPrompt, brandedSentimentPrompt, citationCheckPrompt]
});
const validation = validateProjectSetupDraft(completeDraft);
assert.deepEqual(validation.blockers, []);
assert.deepEqual(validation.metricEligiblePromptIds.visibilityRate, ["prompt-non-branded-buyer-intent"]);
assert.deepEqual(validation.metricEligiblePromptIds.ranking, ["prompt-non-branded-buyer-intent"]);
assert.deepEqual(validation.metricEligiblePromptIds.shareOfVoice, ["prompt-non-branded-buyer-intent"]);
assert.deepEqual(validation.metricEligiblePromptIds.sentiment, ["prompt-branded-sentiment"]);
assert.deepEqual(validation.metricEligiblePromptIds.citationCheck, ["prompt-citation-check"]);

const materializationDecision = getProjectSetupDraftMaterializationDecision(completeDraft);
assert.equal(materializationDecision.materializationReady, true);

const missingInfoValidation = validateProjectSetupDraft(
  createDraft({
    seedInput: {
      ...seedInput,
      brandName: "",
      officialSiteUrl: "not-a-url",
      regions: []
    },
    personas: [],
    topics: [],
    prompts: []
  })
);
assert.ok(missingInfoValidation.blockers.includes("seedInput.brandName is required"));
assert.ok(missingInfoValidation.blockers.includes("seedInput.officialSiteUrl must be an http or https URL"));
assert.ok(missingInfoValidation.blockers.includes("seedInput.regions must include at least one region"));
assert.ok(missingInfoValidation.blockers.includes("at least one persona draft is required"));
assert.ok(missingInfoValidation.blockers.includes("at least one topic draft is required"));
assert.ok(missingInfoValidation.blockers.includes("at least one prompt draft is required"));

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    brandedPromptExcludedFromVisibilityRankingSov: true,
    nonBrandedBuyerIntentMetricEligible: true,
    brandedSentimentSeparated: true,
    unapprovedPromptNotMeasurementReady: true,
    personaTopicPromptIntegrity: validation.blockers.length === 0,
    missingInfoReturnsBlockers: missingInfoValidation.blockers.length >= 6
  },
  metricEligiblePromptIds: validation.metricEligiblePromptIds,
  materializationReady: materializationDecision.materializationReady
}, null, 2));

function createDraft(overrides: Partial<ProjectSetupDraft> = {}): ProjectSetupDraft {
  return {
    schemaVersion: PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
    draftId: "setup-draft-1",
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
    prompts: [nonBrandedBuyerIntentPrompt],
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
    industryCategory: "BtoB SaaS",
    industrySubtype: "marketing technology",
    roleType: "decision_maker",
    detailedDecisionRole: "decision_maker",
    roleMappingReason: "same_as_decision_role",
    buyerStage: "comparison",
    jobs: ["Compare AI search visibility tools"],
    painPoints: ["Unclear AI answer visibility"],
    triggerEvents: ["Need to report AI search performance"],
    switchingForces: ["Manual spreadsheet tracking is too slow"],
    alternativesConsidered: ["SEO agency", "manual search checks"],
    comparisonAxis: ["measurement coverage", "source evidence"],
    proofNeeded: ["sample report", "methodology"],
    trustRequirement: "needs evidence-labeled reports",
    promptAngle: "Compare AI search visibility diagnosis tools without seeding a brand.",
    promptReadiness: "ready_for_prompt_design",
    researchSufficiency: "site_informed_hypothesis",
    confidenceScore: 82,
    needsVerification: true,
    riskFlags: [],
    sourceStatus: "inferred",
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
      riskCheck: "excluded"
    },
    brandMentionPolicy: "brand_excluded",
    expectedSignal: "AI answer mentions candidate tools, rank/order, and cited source types.",
    minimumPromptCount: 1,
    riskOrBias: "Avoid seeding Recora in non-branded discovery prompts.",
    handoffSkill: "recora-competitor-benchmark",
    topicQualityDecision: "topic_ready",
    coverageStatus: "covered",
    confidenceScore: 82,
    reviewStatus: "approved",
    ...overrides
  };
}

function createPrompt(overrides: Partial<PromptDraft> = {}): PromptDraft {
  const buyerStage: BuyerStage = "comparison";
  return {
    promptId: "prompt-default",
    topicId: "topic-ai-search-diagnosis",
    personaId: "persona-marketing-leader",
    text: "AI検索の表示状況を診断できるツールのおすすめは？",
    rawUserIntent: "AI検索 診断 ツール おすすめ",
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
    sourceStatus: "inferred",
    seedTerms: [],
    seedContaminationRisk: "low",
    needsVerification: true,
    confidenceScore: 82,
    reviewStatus: "approved",
    riskFlags: [],
    ...overrides
  };
}
