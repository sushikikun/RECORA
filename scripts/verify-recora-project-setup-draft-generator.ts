import assert from "node:assert/strict";

import {
  derivePromptMetricEligibility,
  getBrandIdentityFromDraft,
  getProjectSetupDraftMaterializationDecision,
  getPromptMeasurementReadiness,
  promptTextContainsBrandSignal,
  validateProjectSetupDraft
} from "../lib/recora/project-setup-draft";
import type {
  PersonaRoleType,
  ProjectSetupDraft,
  ProjectSetupSeedInput,
  PromptDraft,
  TopicType
} from "../lib/recora/project-setup-draft";
import {
  deduplicateProjectSetupDraft,
  generateProjectSetupDraft,
  validateGeneratedProjectSetupDraft
} from "../lib/recora/project-setup-draft-generator";

const MAX_PROMPTS_PER_TOPIC = 4;
const MAX_GENERATED_PERSONAS = 5;
const MAX_GENERATED_PROMPTS = 18;

type ValidCase = {
  id: string;
  seed: ProjectSetupSeedInput;
  expectedBusinessModel: string;
  requiredRoles: readonly PersonaRoleType[];
  requiredTopics: readonly TopicType[];
  requiresRegulatedReview?: boolean;
  requiresLocalPrompt?: boolean;
  requiresHighTicketB2BReview?: boolean;
  requiresB2CComparisonReview?: boolean;
};

const b2bSoftwareSeed: ProjectSetupSeedInput = {
  companyName: "Hikari Metric Labs Inc.",
  brandName: "PromptHarbor",
  officialSiteUrl: "https://promptharbor.example",
  productOrServiceDescription: "BtoBマーケティングチーム向けに、AI検索での表示状況と引用元確認を支援する診断ソフトウェア。",
  industryCategory: "BtoB SaaS",
  targetCustomers: "BtoB SaaSのマーケティング責任者、SEO担当者、コンテンツ運用担当者",
  regions: ["Japan"],
  language: "ja",
  serviceName: "PromptHarbor",
  brandAliases: ["プロンプトハーバー", "PHARBOR"],
  strengths: ["AI検索での表示確認", "引用元確認"],
  knownRisks: ["競合名や引用元は未測定では断定しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "comparison", "citation_check", "sentiment"]
};

const professionalServiceSeed: ProjectSetupSeedInput = {
  companyName: "Nagai Growth Partners",
  brandName: "Nagai Growth",
  officialSiteUrl: "https://nagai-growth.example",
  productOrServiceDescription: "法人向けのマーケティング戦略、営業資料、SEO/GEO改善を支援するコンサルティングサービス。",
  industryCategory: "コンサルティング・専門サービス",
  targetCustomers: "成長期のBtoB企業の経営者、マーケティング責任者、事業部長",
  regions: ["Japan"],
  language: "ja",
  serviceName: "Nagai Growth Advisory",
  strengths: ["戦略設計と実行支援", "BtoBマーケティング経験"],
  knownRisks: ["成果や売上向上を保証しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "comparison", "sentiment"]
};

const clinicSeed: ProjectSetupSeedInput = {
  companyName: "Sakura Skin Clinic",
  brandName: "Sakura Skin",
  officialSiteUrl: "https://sakura-skin.example",
  productOrServiceDescription: "初めて美容医療を検討する人向けに、医師情報、料金、相談前の説明を重視する美容皮膚科クリニック。",
  industryCategory: "美容医療クリニック",
  targetCustomers: "新宿周辺で美容皮膚科を慎重に比較したい初回相談者と家族",
  regions: ["東京都新宿区"],
  language: "ja",
  serviceName: "Sakura Skin",
  brandAliases: ["サクラ スキン"],
  strengths: ["医師情報の明示", "料金と相談前説明"],
  knownRisks: ["治療効果や安全性を保証しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "citation_check", "sentiment"]
};

const localServiceSeed: ProjectSetupSeedInput = {
  companyName: "Mizunowa Care Studio",
  brandName: "Mizunowa",
  officialSiteUrl: "https://mizunowa.example",
  productOrServiceDescription: "地域の高齢者向けに、見守り相談、外出付き添い、予約制サポートを提供する地域サービス。",
  industryCategory: "地域サービス",
  targetCustomers: "離れて暮らす家族の見守りや通いやすい生活支援を探す利用者と家族",
  regions: ["神奈川県"],
  language: "ja",
  serviceName: "Mizunowa",
  brandAliases: ["ミズノワ"],
  strengths: ["予約制の相談", "地域で通いやすい支援"],
  knownRisks: ["健康効果や安全性を断定しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "comparison", "sentiment"]
};

const highTicketB2BSeed: ProjectSetupSeedInput = {
  companyName: "Kansai Factory Cloud Inc.",
  brandName: "FactoryPilot",
  officialSiteUrl: "https://factorypilot.example",
  productOrServiceDescription: "製造業の複数拠点向けに、設備保全、在庫、作業実績を統合する高単価な業務基盤クラウド。",
  industryCategory: "製造業向けBtoBクラウド・基幹業務SaaS",
  targetCustomers: "複数拠点の製造業で、DX投資を検討する経営企画、工場長、情報システム、現場責任者",
  regions: ["Japan"],
  language: "ja",
  serviceName: "FactoryPilot",
  brandAliases: ["ファクトリーパイロット"],
  strengths: ["複数拠点の業務統合", "導入支援", "既存システム連携"],
  knownRisks: ["導入費用、移行負荷、セキュリティ審査が重い"],
  diagnosisGoals: ["non_branded", "buyer_intent", "comparison", "citation_check", "sentiment"]
};

const b2cComparisonSeed: ProjectSetupSeedInput = {
  companyName: "Kokochi Life Co.",
  brandName: "NemuruFit",
  officialSiteUrl: "https://nemurufit.example",
  productOrServiceDescription: "睡眠に悩む一般消費者向けに、素材、価格、返品条件を明示して販売するD2C寝具ブランド。",
  industryCategory: "D2C寝具・EC商品",
  targetCustomers: "寝心地、価格、口コミ、返品条件を比較してから購入したい一般消費者",
  regions: ["Japan"],
  language: "ja",
  serviceName: "NemuruFit",
  brandAliases: ["ねむるフィット"],
  strengths: ["素材情報の明示", "返品条件のわかりやすさ"],
  knownRisks: ["効果や口コミ評価を断定しない"],
  diagnosisGoals: ["non_branded", "buyer_intent", "comparison", "sentiment"]
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

const validCases: readonly ValidCase[] = [
  {
    id: "b2bSoftware",
    seed: b2bSoftwareSeed,
    expectedBusinessModel: "b2b_software",
    requiredRoles: ["decision_maker", "end_user", "evaluator", "technical_reviewer"],
    requiredTopics: ["category_discovery_topic", "alternative_search_topic", "citation_evidence_topic", "branded_sentiment_topic"]
  },
  {
    id: "professionalService",
    seed: professionalServiceSeed,
    expectedBusinessModel: "professional_service",
    requiredRoles: ["decision_maker", "evaluator", "economic_buyer", "end_user"],
    requiredTopics: ["alternative_search_topic", "pricing_reputation_topic", "branded_sentiment_topic"]
  },
  {
    id: "clinic",
    seed: clinicSeed,
    expectedBusinessModel: "healthcare",
    requiredRoles: ["comparator", "user", "recommender_influencer"],
    requiredTopics: ["local_regional_topic", "regulated_risk_topic", "citation_evidence_topic", "branded_sentiment_topic"],
    requiresRegulatedReview: true,
    requiresLocalPrompt: true
  },
  {
    id: "localService",
    seed: localServiceSeed,
    expectedBusinessModel: "local_service",
    requiredRoles: ["comparator", "purchaser", "user", "repeat_user"],
    requiredTopics: ["local_regional_topic", "pricing_reputation_topic", "alternative_search_topic", "branded_sentiment_topic"],
    requiresLocalPrompt: true
  },
  {
    id: "highTicketB2B",
    seed: highTicketB2BSeed,
    expectedBusinessModel: "b2b_software",
    requiredRoles: ["decision_maker", "economic_buyer", "evaluator", "technical_reviewer"],
    requiredTopics: ["category_discovery_topic", "alternative_search_topic", "regulated_risk_topic", "citation_evidence_topic", "branded_sentiment_topic"],
    requiresHighTicketB2BReview: true
  },
  {
    id: "b2cComparison",
    seed: b2cComparisonSeed,
    expectedBusinessModel: "ecommerce",
    requiredRoles: ["comparator", "purchaser", "user", "repeat_user"],
    requiredTopics: ["problem_solution_topic", "alternative_search_topic", "pricing_reputation_topic", "branded_sentiment_topic"],
    requiresB2CComparisonReview: true
  }
];

const b2bFirst = generateProjectSetupDraft(b2bSoftwareSeed);
const b2bSecond = generateProjectSetupDraft(b2bSoftwareSeed);
assert.deepEqual(b2bFirst, b2bSecond);
assert.deepEqual(b2bFirst.blockers, []);
assert.equal(b2bFirst.generatedAt, null);

const caseResults = validCases.map((testCase) => ({
  id: testCase.id,
  result: generateProjectSetupDraft(testCase.seed)
}));

for (const testCase of validCases) {
  const result = caseResults.find((caseResult) => caseResult.id === testCase.id)?.result;
  assert.ok(result, testCase.id);
  assert.deepEqual(result.blockers, [], testCase.id);
  assert.equal(result.generationSummary.businessModel, testCase.expectedBusinessModel, testCase.id);
  assertGeneratedDraftQuality(result.draft);
  assertCaseSpecificQuality(testCase, result.draft);
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
    b2bSoftwareRoleSplit: true,
    professionalServiceAdapter: true,
    clinicRegulatedSafety: true,
    localServiceRegionalIntent: true,
    highTicketB2BBudgetApprovalRole: true,
    b2cComparisonProductAdapter: true,
    personaTopicPromptReferences: true,
    nonBrandedPromptsExcludeBrandSignals: true,
    brandedPromptsExcludedFromVisibilityRankingSov: true,
    brandedSentimentSeparated: true,
    multiplePromptVariantsPerTopic: true,
    promptVariantCountsBounded: true,
    promptVariantLanguageModesCovered: true,
    selectionTopicHasCriteriaAndCandidateVariants: true,
    citationCheckSeparatedFromMarketMetrics: true,
    buyerIntentAndAlternativePromptsCanBeMetricEligible: true,
    criteriaAndRiskPromptsExcludedFromMarketMetrics: true,
    unapprovedPromptsNotMeasurementReady: true,
    duplicateDraftItemsRemoved: true,
    insufficientInputReturnsBlockers: true,
    unapprovedDraftRejectedByMaterialization: true,
    generatedDraftPassesBaseValidation: true
  },
  generatedCounts: Object.fromEntries(caseResults.map(({ id, result }) => [id, result.generationSummary.generatedCounts])),
  metricEligiblePromptIds: Object.fromEntries(caseResults.map(({ id, result }) => [id, result.generationSummary.metricEligiblePromptIds])),
  topicTypes: Object.fromEntries(caseResults.map(({ id, result }) => [id, result.draft.topics.map((topic) => topic.topicType)]))
}, null, 2));

function assertGeneratedDraftQuality(draft: ProjectSetupDraft) {
  const baseValidation = validateProjectSetupDraft(draft);
  const generatedValidation = validateGeneratedProjectSetupDraft(draft);
  assert.deepEqual(baseValidation.blockers, []);
  assert.deepEqual(generatedValidation.blockers, []);

  assert.equal(draft.reviewStatus, "needs_review");
  assert.ok(draft.personas.length >= 2);
  assert.ok(draft.personas.length <= MAX_GENERATED_PERSONAS);
  assert.ok(draft.topics.length >= 3);
  assert.ok(draft.topics.length <= 6);
  assert.ok(draft.prompts.length >= draft.topics.length + 3);
  assert.ok(draft.prompts.length <= MAX_GENERATED_PROMPTS);
  assert.equal(draft.competitors.length, 0);
  assert.equal(draft.citationAngles.length, 0);
  assert.equal(draft.pageImprovementAngles.length, 0);

  assertNoDuplicateValues(draft.personas.map((persona) => persona.personaId), "personaId");
  assertNoDuplicateValues(draft.topics.map((topic) => topic.topicId), "topicId");
  assertNoDuplicateValues(draft.prompts.map((prompt) => prompt.promptId), "promptId");
  assertNoDuplicateValues(draft.prompts.map((prompt) => normalize(prompt.text)), "prompt text");
  assertPromptVariantCoverage(draft);

  for (const item of draft.inputCompletion) {
    assert.ok(item.status === "provided" || item.status === "inferred" || item.status === "missing" || item.status === "needs_confirmation");
  }
  assert.ok(draft.inputCompletion.some((item) => item.field === "businessModel"));
  assert.ok(draft.inputCompletion.some((item) => item.field === "industryAdapter"));

  const personaIds = new Set(draft.personas.map((persona) => persona.personaId));
  const topicIds = new Set(draft.topics.map((topic) => topic.topicId));
  for (const persona of draft.personas) {
    assert.equal(persona.reviewStatus, "needs_review");
    assert.equal(persona.promptReadiness, "usable_with_caution");
    assert.equal(persona.needsVerification, true);
    assert.equal(persona.sourceStatus, "inferred");
    assert.ok(persona.detailedDecisionRole.length > 0);
    assert.ok(persona.roleMappingReason.length > 0);
    assert.ok(persona.jobs.length > 0);
    assert.ok(persona.painPoints.length > 0);
    assert.ok(persona.comparisonAxis.length > 0);
    assert.ok(persona.proofNeeded.length > 0);
  }
  for (const topic of draft.topics) {
    assert.ok(topic.targetPersonaId === null || personaIds.has(topic.targetPersonaId));
    assert.equal(topic.reviewStatus, "needs_review");
    assert.ok(topic.expectedSignal.length > 0);
    assert.ok(topic.minimumPromptCount >= 1);
  }
  for (const prompt of draft.prompts) {
    assert.ok(topicIds.has(prompt.topicId));
    assert.ok(prompt.personaId !== null && personaIds.has(prompt.personaId));
    assert.equal(prompt.reviewStatus, "needs_review");
    assert.equal(prompt.needsVerification, true);
    assert.ok(prompt.rawUserIntent && prompt.rawUserIntent.length > 0);
    assert.ok(prompt.expectedSignal.length > 0);
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
    if (prompt.responseShape === "evaluation_criteria" || prompt.responseShape === "evidence_answer") {
      assertMarketMetricsExcluded(prompt, eligibility);
    }
  }

  const brandedSentimentPrompt = draft.prompts.find((prompt) =>
    prompt.brandMentionRule === "brand_included" && (prompt.intent === "sentiment" || prompt.intent === "brand_perception")
  );
  assert.ok(brandedSentimentPrompt);
  const sentimentEligibility = derivePromptMetricEligibility(brandedSentimentPrompt, brandIdentity);
  assert.equal(sentimentEligibility.sentiment, "eligible");
  assert.equal(sentimentEligibility.brandPerception, "eligible");
  const brandedPrompts = draft.prompts.filter((prompt) => prompt.brandMentionRule === "brand_included");
  assert.ok(brandedPrompts.length >= 1);
  assert.ok(brandedPrompts.length <= 2);
  assert.ok(brandedPrompts.some((prompt) => prompt.intent === "sentiment"));
  assert.ok(brandedPrompts.some((prompt) => prompt.intent === "brand_perception"));

  const marketPrompt = draft.prompts.find((prompt) =>
    prompt.brandMentionRule === "brand_excluded" &&
    (prompt.intent === "buyer_intent" || prompt.intent === "comparison") &&
    (prompt.responseShape === "ranked_recommendation" || prompt.responseShape === "comparative_set")
  );
  assert.ok(marketPrompt);
  const marketEligibility = derivePromptMetricEligibility(marketPrompt, brandIdentity);
  assert.equal(marketEligibility.visibilityRate, "eligible");
  assert.equal(marketEligibility.ranking, "eligible");
  assert.equal(marketEligibility.shareOfVoice, "eligible");

  const materializationDecision = getProjectSetupDraftMaterializationDecision(draft);
  assert.equal(materializationDecision.materializationReady, false);
  assert.ok(materializationDecision.blockers.includes("draft_review_status_not_approved"));
}

function assertPromptVariantCoverage(draft: ProjectSetupDraft) {
  const brandIdentity = getBrandIdentityFromDraft(draft);
  const promptsByTopic = new Map<string, PromptDraft[]>();
  for (const prompt of draft.prompts) {
    promptsByTopic.set(prompt.topicId, [...(promptsByTopic.get(prompt.topicId) ?? []), prompt]);
  }

  for (const topic of draft.topics) {
    const topicPrompts = promptsByTopic.get(topic.topicId) ?? [];
    assert.ok(topicPrompts.length >= topic.minimumPromptCount, `${topic.topicType} has too few prompts`);
    assert.ok(topicPrompts.length <= MAX_PROMPTS_PER_TOPIC, `${topic.topicType} has too many prompts`);
    if (topic.minimumPromptCount >= 3) {
      assert.ok(new Set(topicPrompts.map((prompt) => prompt.languageMode)).size >= 2, `${topic.topicType} lacks language mode variety`);
    }
  }

  const multiPromptTopics = draft.topics.filter((topic) =>
    topic.topicType !== "citation_evidence_topic" && topic.topicType !== "branded_sentiment_topic"
  );
  assert.ok(multiPromptTopics.every((topic) => (promptsByTopic.get(topic.topicId) ?? []).length >= 2));

  const selectionTopic = draft.topics.find((topic) => topic.topicType === "persona_specific_topic");
  assert.ok(selectionTopic);
  const selectionPrompts = promptsByTopic.get(selectionTopic.topicId) ?? [];
  assert.ok(selectionPrompts.length >= 3);
  assert.ok(selectionPrompts.some((prompt) => prompt.responseShape === "evaluation_criteria"));
  assert.ok(selectionPrompts.some((prompt) => {
    const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
    return prompt.brandMentionRule === "brand_excluded" &&
      prompt.responseShape === "ranked_recommendation" &&
      eligibility.visibilityRate === "eligible" &&
      eligibility.ranking === "eligible";
  }));

  const citationPrompts = draft.prompts.filter((prompt) => prompt.intent === "citation_check" || prompt.category === "citation_check");
  if (draft.topics.some((topic) => topic.topicType === "citation_evidence_topic")) {
    assert.ok(citationPrompts.length >= 1);
    assert.ok(citationPrompts.length <= 2);
  } else {
    assert.equal(citationPrompts.length, 0);
  }
  for (const prompt of citationPrompts) {
    const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
    assertMarketMetricsExcluded(prompt, eligibility);
    assert.equal(eligibility.citationCheck, "eligible");
  }
}

function assertCaseSpecificQuality(testCase: ValidCase, draft: ProjectSetupDraft) {
  const roleTypes = new Set(draft.personas.map((persona) => persona.roleType));
  for (const role of testCase.requiredRoles) {
    assert.ok(roleTypes.has(role), `${testCase.id} missing role ${role}`);
  }

  const topicTypes = new Set(draft.topics.map((topic) => topic.topicType));
  for (const topicType of testCase.requiredTopics) {
    assert.ok(topicTypes.has(topicType), `${testCase.id} missing topic ${topicType}`);
  }

  if (testCase.requiresRegulatedReview) {
    assert.ok(draft.riskFlags.includes("regulated_or_high_trust_review_required"));
    assert.ok(draft.topics.some((topic) => topic.topicType === "regulated_risk_topic" && topic.metricTarget.riskCheck === "eligible"));
    const regulatedPrompt = draft.prompts.find((prompt) => prompt.riskFlags.includes("risky_intent_safely_transformed"));
    assert.ok(regulatedPrompt);
    assert.equal(regulatedPrompt.intentType, "risk_checking");
    assert.ok(regulatedPrompt.riskFlags.includes("risky_intent_safely_transformed"));
    assertNoUnsafeRegulatedPrompt(regulatedPrompt.text);
  }

  if (testCase.requiresLocalPrompt) {
    const regionalPrompt = draft.prompts.find((prompt) => prompt.topicId.includes("local-regional"));
    assert.ok(regionalPrompt);
    assert.equal(regionalPrompt.responseShape, "ranked_recommendation");
    assert.equal(regionalPrompt.candidateMentionOpportunity, "direct");
    assert.equal(regionalPrompt.rankingOpportunity, "direct");
  }

  if (testCase.requiresHighTicketB2BReview) {
    assert.ok(roleTypes.has("economic_buyer"));
    const budgetPersona = draft.personas.find((persona) => persona.roleType === "economic_buyer");
    assert.ok(budgetPersona);
    assert.ok(
      budgetPersona.painPoints.some((painPoint) =>
        painPoint.includes("予算") || painPoint.includes("費用対効果") || painPoint.toLowerCase().includes("budget")
      )
    );
    assert.ok(draft.prompts.some((prompt) =>
      prompt.text.includes("費用対効果") ||
      prompt.text.includes("移行負荷") ||
      prompt.text.includes("セキュリティ") ||
      prompt.text.toLowerCase().includes("roi")
    ));
  }

  if (testCase.requiresB2CComparisonReview) {
    const languageModes = new Set(draft.prompts.map((prompt) => prompt.languageMode));
    assert.ok(languageModes.has("raw_search_like"));
    assert.ok(languageModes.has("anxious_user"));
    assert.ok(languageModes.has("comparison_shortcut"));
    assert.ok(draft.prompts.some((prompt) =>
      prompt.text.includes("返品条件") ||
      prompt.text.includes("口コミ") ||
      prompt.text.includes("素材") ||
      prompt.text.toLowerCase().includes("return policy")
    ));
  }
}

function assertNoUnsafeRegulatedPrompt(text: string) {
  const unsafeFragments = ["治る", "必ず", "保証", "診断して", "投資判断", "勝てる", "採用される"];
  for (const fragment of unsafeFragments) {
    assert.equal(text.includes(fragment), false, `regulated prompt contains unsafe fragment: ${fragment}`);
  }
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
