import assert from "node:assert/strict";

import {
  derivePromptMetricEligibility,
  getBrandIdentityFromDraft,
  getProjectSetupDraftMaterializationDecision,
  getPromptMeasurementReadiness,
  promptTextContainsBrandSignal,
  validateProjectSetupDraft
} from "../lib/recora/project-setup-draft";
import type { ProjectSetupDraft, ProjectSetupSeedInput, PromptDraft } from "../lib/recora/project-setup-draft";
import {
  deduplicateProjectSetupDraft,
  generateProjectSetupDraft,
  validateGeneratedProjectSetupDraft
} from "../lib/recora/project-setup-draft-generator";

const b2bSoftwareSeed: ProjectSetupSeedInput = {
  companyName: "Hikari Metric Labs Inc.",
  brandName: "PromptHarbor",
  officialSiteUrl: "https://promptharbor.example",
  productOrServiceDescription: "BtoBマーケティングチーム向けに、AI検索での表示状況と引用元確認を支援する診断ソフトウェア。",
  industryCategory: "BtoB SaaS",
  targetCustomers: "BtoB SaaSのマーケティング責任者とコンテンツ運用担当者",
  regions: ["Japan"],
  language: "ja",
  serviceName: "PromptHarbor",
  brandAliases: ["プロンプトハーバー", "PHARBOR"],
  strengths: ["AI検索での表示確認", "引用元確認"],
  knownRisks: ["競合名や引用元は未測定では断定しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "comparison", "citation_check", "sentiment"]
};

const localServiceSeed: ProjectSetupSeedInput = {
  companyName: "Mizunowa Care Studio",
  brandName: "Mizunowa",
  officialSiteUrl: "https://mizunowa.example",
  productOrServiceDescription: "地域の高齢者向けに、運動習慣づくりと見守り相談を支援する予約制サービス。",
  industryCategory: "地域サービス",
  targetCustomers: "離れて暮らす家族の見守りや通いやすい運動支援を探す利用者と家族",
  regions: ["神奈川県"],
  language: "ja",
  serviceName: "Mizunowa",
  brandAliases: ["ミズノワ"],
  strengths: ["予約制の相談", "地域で通いやすい支援"],
  knownRisks: ["健康効果や安全性を断定しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "citation_check", "sentiment"]
};

const incompleteSeed: ProjectSetupSeedInput = {
  companyName: "",
  brandName: "",
  officialSiteUrl: "not-a-url",
  productOrServiceDescription: "",
  industryCategory: "",
  targetCustomers: "",
  regions: [],
  language: ""
};

const b2bFirst = generateProjectSetupDraft(b2bSoftwareSeed);
const b2bSecond = generateProjectSetupDraft(b2bSoftwareSeed);
assert.deepEqual(b2bFirst, b2bSecond);
assert.deepEqual(b2bFirst.blockers, []);
assert.equal(b2bFirst.generatedAt, null);

const localResult = generateProjectSetupDraft(localServiceSeed);
assert.deepEqual(localResult.blockers, []);

for (const result of [b2bFirst, localResult]) {
  assertGeneratedDraftQuality(result.draft);
}

const incompleteResult = generateProjectSetupDraft(incompleteSeed);
assert.ok(incompleteResult.blockers.includes("seedInput.companyName is required"));
assert.ok(incompleteResult.blockers.includes("seedInput.brandName is required"));
assert.ok(incompleteResult.blockers.includes("seedInput.officialSiteUrl must be an http or https URL"));
assert.ok(incompleteResult.blockers.includes("seedInput.regions must include at least one region"));
assert.equal(incompleteResult.draft.personas.length, 0);
assert.equal(incompleteResult.draft.topics.length, 0);
assert.equal(incompleteResult.draft.prompts.length, 0);

const duplicateDraft = {
  ...b2bFirst.draft,
  personas: [...b2bFirst.draft.personas, b2bFirst.draft.personas[0]],
  topics: [...b2bFirst.draft.topics, b2bFirst.draft.topics[0]],
  prompts: [...b2bFirst.draft.prompts, b2bFirst.draft.prompts[0]]
} satisfies ProjectSetupDraft;
const deduplicated = deduplicateProjectSetupDraft(duplicateDraft);
assert.equal(deduplicated.personas.length, b2bFirst.draft.personas.length);
assert.equal(deduplicated.topics.length, b2bFirst.draft.topics.length);
assert.equal(deduplicated.prompts.length, b2bFirst.draft.prompts.length);

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    deterministicGeneration: true,
    personaTopicPromptReferences: true,
    nonBrandedPromptsExcludeBrandSignals: true,
    brandedPromptsExcludedFromVisibilityRankingSov: true,
    brandedSentimentSeparated: true,
    buyerIntentNonBrandedCanBeMetricEligible: true,
    unapprovedPromptsNotMeasurementReady: true,
    duplicateDraftItemsRemoved: true,
    insufficientInputReturnsBlockers: true,
    unapprovedDraftRejectedByMaterialization: true,
    generatedDraftPassesBaseValidation: true
  },
  generatedCounts: {
    b2bSoftware: b2bFirst.generationSummary.generatedCounts,
    localService: localResult.generationSummary.generatedCounts
  },
  metricEligiblePromptIds: {
    b2bSoftware: b2bFirst.generationSummary.metricEligiblePromptIds,
    localService: localResult.generationSummary.metricEligiblePromptIds
  }
}, null, 2));

function assertGeneratedDraftQuality(draft: ProjectSetupDraft) {
  const baseValidation = validateProjectSetupDraft(draft);
  const generatedValidation = validateGeneratedProjectSetupDraft(draft);
  assert.deepEqual(baseValidation.blockers, []);
  assert.deepEqual(generatedValidation.blockers, []);

  assert.ok(draft.personas.length >= 2);
  assert.ok(draft.personas.length <= 4);
  assert.ok(draft.topics.length >= 3);
  assert.ok(draft.topics.length <= 6);
  assert.ok(draft.prompts.length >= draft.topics.length);
  assert.equal(draft.competitors.length, 0);
  assert.equal(draft.citationAngles.length, 0);
  assert.equal(draft.pageImprovementAngles.length, 0);

  assertNoDuplicateValues(draft.personas.map((persona) => persona.personaId), "personaId");
  assertNoDuplicateValues(draft.topics.map((topic) => topic.topicId), "topicId");
  assertNoDuplicateValues(draft.prompts.map((prompt) => prompt.promptId), "promptId");
  assertNoDuplicateValues(draft.prompts.map((prompt) => normalize(prompt.text)), "prompt text");

  const personaIds = new Set(draft.personas.map((persona) => persona.personaId));
  const topicIds = new Set(draft.topics.map((topic) => topic.topicId));
  for (const topic of draft.topics) {
    assert.ok(topic.targetPersonaId === null || personaIds.has(topic.targetPersonaId));
    assert.equal(topic.reviewStatus, "needs_review");
  }
  for (const prompt of draft.prompts) {
    assert.ok(topicIds.has(prompt.topicId));
    assert.ok(prompt.personaId !== null && personaIds.has(prompt.personaId));
    assert.equal(prompt.reviewStatus, "needs_review");
  }

  const brandIdentity = getBrandIdentityFromDraft(draft);
  for (const prompt of draft.prompts) {
    const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
    const readiness = getPromptMeasurementReadiness(prompt, brandIdentity);
    assert.equal(readiness.measurementReady, false);
    assert.ok(readiness.blockers.includes("review_status_not_approved"));

    if (prompt.brandMentionRule === "brand_excluded") {
      assert.equal(promptTextContainsBrandSignal(prompt.text, brandIdentity), false, prompt.promptId);
    }
    if (prompt.brandMentionRule === "brand_included" || promptTextContainsBrandSignal(prompt.text, brandIdentity)) {
      assertMarketMetricsExcluded(prompt, eligibility);
    }
    if (prompt.intent === "citation_check") {
      assertMarketMetricsExcluded(prompt, eligibility);
      assert.equal(eligibility.citationCheck, "eligible");
    }
  }

  const brandedSentimentPrompt = draft.prompts.find((prompt) =>
    prompt.brandMentionRule === "brand_included" && (prompt.intent === "sentiment" || prompt.intent === "brand_perception")
  );
  assert.ok(brandedSentimentPrompt);
  const sentimentEligibility = derivePromptMetricEligibility(brandedSentimentPrompt, brandIdentity);
  assert.equal(sentimentEligibility.sentiment, "eligible");
  assert.equal(sentimentEligibility.brandPerception, "eligible");

  const buyerIntentPrompt = draft.prompts.find((prompt) =>
    prompt.intent === "buyer_intent" && prompt.brandMentionRule === "brand_excluded"
  );
  assert.ok(buyerIntentPrompt);
  const buyerEligibility = derivePromptMetricEligibility(buyerIntentPrompt, brandIdentity);
  assert.equal(buyerEligibility.visibilityRate, "eligible");
  assert.equal(buyerEligibility.ranking, "eligible");
  assert.equal(buyerEligibility.shareOfVoice, "eligible");

  const materializationDecision = getProjectSetupDraftMaterializationDecision(draft);
  assert.equal(materializationDecision.materializationReady, false);
  assert.ok(materializationDecision.blockers.includes("draft_review_status_not_approved"));
}

function assertMarketMetricsExcluded(
  prompt: PromptDraft,
  eligibility: ReturnType<typeof derivePromptMetricEligibility>
) {
  assert.equal(eligibility.visibilityRate, "excluded", prompt.promptId);
  assert.equal(eligibility.ranking, "excluded", prompt.promptId);
  assert.equal(eligibility.shareOfVoice, "excluded", prompt.promptId);
}

function assertNoDuplicateValues(values: readonly string[], label: string) {
  assert.equal(new Set(values).size, values.length, `${label} has duplicates`);
}

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}
