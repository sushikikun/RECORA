import assert from "node:assert/strict";

import {
  derivePromptMetricEligibility,
  getBrandIdentityFromDraft,
  promptTextContainsBrandSignal
} from "../lib/recora/project-setup-draft";
import type {
  PersonaRoleType,
  ProjectSetupDraft,
  ProjectSetupSeedInput,
  TopicType
} from "../lib/recora/project-setup-draft";
import { generateProjectSetupDraft } from "../lib/recora/project-setup-draft-generator";

type EvalCase = {
  id: string;
  seed: ProjectSetupSeedInput;
  requiredRoles: readonly PersonaRoleType[];
  requiredTopics: readonly TopicType[];
  minScore: number;
  regulated?: boolean;
  local?: boolean;
};

type CheckResult = {
  label: string;
  points: number;
  maxPoints: number;
  passed: boolean;
  severity: "pass" | "warning" | "fail";
  detail?: string;
};

const evalCases: readonly EvalCase[] = [
  {
    id: "japanese-b2b-saas",
    seed: {
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
    },
    requiredRoles: ["decision_maker", "end_user", "evaluator", "technical_reviewer"],
    requiredTopics: ["category_discovery_topic", "alternative_search_topic", "citation_evidence_topic", "branded_sentiment_topic"],
    minScore: 84
  },
  {
    id: "professional-services",
    seed: {
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
    },
    requiredRoles: ["decision_maker", "evaluator", "economic_buyer", "end_user"],
    requiredTopics: ["alternative_search_topic", "pricing_reputation_topic", "branded_sentiment_topic"],
    minScore: 82
  },
  {
    id: "clinic-or-school",
    seed: {
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
    },
    requiredRoles: ["comparator", "user", "recommender_influencer"],
    requiredTopics: ["local_regional_topic", "regulated_risk_topic", "citation_evidence_topic", "branded_sentiment_topic"],
    minScore: 84,
    regulated: true,
    local: true
  },
  {
    id: "regional-service",
    seed: {
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
    },
    requiredRoles: ["comparator", "purchaser", "user", "repeat_user"],
    requiredTopics: ["local_regional_topic", "pricing_reputation_topic", "alternative_search_topic", "branded_sentiment_topic"],
    minScore: 82,
    local: true
  }
];

const insufficientInputSeed: ProjectSetupSeedInput = {
  companyName: "",
  brandName: "",
  officialSiteUrl: "not-a-url",
  productOrServiceDescription: "",
  industryCategory: "",
  targetCustomers: "",
  regions: [],
  language: ""
};

const evaluations = evalCases.map((testCase) => evaluateCase(testCase));
const insufficientInput = generateProjectSetupDraft(insufficientInputSeed);
assert.ok(insufficientInput.blockers.length >= 4);
assert.equal(insufficientInput.draft.personas.length, 0);
assert.equal(insufficientInput.draft.topics.length, 0);
assert.equal(insufficientInput.draft.prompts.length, 0);

for (const evaluation of evaluations) {
  assert.equal(evaluation.failures.length, 0, `${evaluation.id} has failures: ${evaluation.failures.join(", ")}`);
  assert.ok(evaluation.score >= evaluation.minScore, `${evaluation.id} score ${evaluation.score} is below ${evaluation.minScore}`);
}

console.log(JSON.stringify({
  status: "ok",
  rubric: "Recora persona discovery, prompt/topic designer, and quality-gate minimum-input criteria",
  scoreUnit: "0-100 deterministic heuristic score",
  evaluations,
  insufficientInput: {
    status: "blocked_as_expected",
    blockers: insufficientInput.blockers
  },
  remainingGaps: [
    "one_prompt_per_topic_is_a_scoping_draft_not_a_full_standard_prompt_set",
    "personas_are_inferred_hypotheses_until_site_or_customer_evidence_is_reviewed",
    "competitor_citation_and_page_improvement_candidates_remain_empty_by_design"
  ]
}, null, 2));

function evaluateCase(testCase: EvalCase) {
  const result = generateProjectSetupDraft(testCase.seed);
  const draft = result.draft;
  const checks: CheckResult[] = [
    check("no_blockers", 8, result.blockers.length === 0, result.blockers.join(", ")),
    check("generated_counts_within_contract", 8, draft.personas.length >= 2 && draft.personas.length <= 4 && draft.topics.length >= 3 && draft.topics.length <= 6 && draft.prompts.length >= draft.topics.length),
    check("draft_requires_review", 7, draft.reviewStatus === "needs_review" && draft.personas.every((persona) => persona.reviewStatus === "needs_review") && draft.topics.every((topic) => topic.reviewStatus === "needs_review") && draft.prompts.every((prompt) => prompt.reviewStatus === "needs_review")),
    check("persona_role_split", 12, includesAll(draft.personas.map((persona) => persona.roleType), testCase.requiredRoles)),
    check("persona_prompt_readiness_cautious", 8, draft.personas.every((persona) => persona.promptReadiness === "usable_with_caution" && persona.needsVerification && persona.sourceStatus === "inferred")),
    check("topic_coverage", 12, includesAll(draft.topics.map((topic) => topic.topicType), testCase.requiredTopics)),
    check("topic_metric_separation", 10, topicsKeepMetricsSeparated(draft)),
    check("brand_nonbrand_separation", 12, promptsKeepBrandSeparated(draft)),
    check("market_metric_derivation", 10, promptsDeriveMarketMetricsCorrectly(draft)),
    check("unsupported_sections_empty", 6, draft.competitors.length === 0 && draft.citationAngles.length === 0 && draft.pageImprovementAngles.length === 0),
    check("industry_safety_adapter", 7, industryAdapterCheck(draft, testCase))
  ];
  const score = checks.reduce((sum, item) => sum + item.points, 0);
  const maxScore = checks.reduce((sum, item) => sum + item.maxPoints, 0);
  const normalizedScore = Math.round((score / maxScore) * 100);
  const failures = checks.filter((item) => item.severity === "fail").map((item) => item.label);

  return {
    id: testCase.id,
    score: normalizedScore,
    minScore: testCase.minScore,
    businessModel: result.generationSummary.businessModel,
    generatedCounts: result.generationSummary.generatedCounts,
    checks,
    failures
  };
}

function check(label: string, maxPoints: number, passed: boolean, detail?: string): CheckResult {
  return {
    label,
    points: passed ? maxPoints : 0,
    maxPoints,
    passed,
    severity: passed ? "pass" : "fail",
    detail
  };
}

function topicsKeepMetricsSeparated(draft: ProjectSetupDraft) {
  return draft.topics.every((topic) => {
    if (topic.topicType === "branded_sentiment_topic") {
      return topic.metricTarget.visibilityRate === "excluded" &&
        topic.metricTarget.ranking === "excluded" &&
        topic.metricTarget.sentiment === "eligible";
    }
    if (topic.topicType === "citation_evidence_topic") {
      return topic.metricTarget.visibilityRate === "excluded" &&
        topic.metricTarget.ranking === "excluded" &&
        topic.metricTarget.citationCheck === "eligible";
    }
    if (topic.topicType === "regulated_risk_topic") {
      return topic.metricTarget.visibilityRate === "excluded" &&
        topic.metricTarget.ranking === "excluded" &&
        topic.metricTarget.riskCheck === "eligible";
    }
    return true;
  });
}

function promptsKeepBrandSeparated(draft: ProjectSetupDraft) {
  const brandIdentity = getBrandIdentityFromDraft(draft);
  return draft.prompts.every((prompt) => {
    const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
    if (prompt.brandMentionRule === "brand_excluded" && promptTextContainsBrandSignal(prompt.text, brandIdentity)) return false;
    if (prompt.brandMentionRule === "brand_included") {
      return eligibility.visibilityRate === "excluded" &&
        eligibility.ranking === "excluded" &&
        eligibility.shareOfVoice === "excluded" &&
        eligibility.sentiment === "eligible";
    }
    return true;
  });
}

function promptsDeriveMarketMetricsCorrectly(draft: ProjectSetupDraft) {
  const brandIdentity = getBrandIdentityFromDraft(draft);
  let hasMarketEligiblePrompt = false;
  for (const prompt of draft.prompts) {
    const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
    const isMarketShape = prompt.responseShape === "candidate_list" ||
      prompt.responseShape === "ranked_recommendation" ||
      prompt.responseShape === "comparative_set";
    if (!isMarketShape && (eligibility.visibilityRate === "eligible" || eligibility.ranking === "eligible")) return false;
    if (eligibility.visibilityRate === "eligible" && eligibility.ranking === "eligible") hasMarketEligiblePrompt = true;
  }
  return hasMarketEligiblePrompt;
}

function industryAdapterCheck(draft: ProjectSetupDraft, testCase: EvalCase) {
  const inputCompletion = Object.fromEntries(draft.inputCompletion.map((item) => [item.field, item.value]));
  if (!inputCompletion.industryAdapter) return false;
  if (testCase.regulated) {
    const riskyPrompt = draft.prompts.find((prompt) => prompt.intentType === "risk_checking");
    return draft.riskFlags.includes("regulated_or_high_trust_review_required") &&
      Boolean(riskyPrompt) &&
      riskyPrompt?.riskFlags.includes("risky_intent_safely_transformed") === true &&
      !containsUnsafeRegulatedWording(riskyPrompt.text);
  }
  if (testCase.local) {
    return draft.topics.some((topic) => topic.topicType === "local_regional_topic") &&
      draft.prompts.some((prompt) => prompt.languageMode === "comparison_shortcut" || prompt.languageMode === "anxious_user");
  }
  return true;
}

function containsUnsafeRegulatedWording(text: string) {
  return ["治る", "必ず", "保証", "診断して", "投資判断", "勝てる", "採用される"].some((fragment) => text.includes(fragment));
}

function includesAll<T extends string>(values: readonly T[], requiredValues: readonly T[]) {
  const valueSet = new Set(values);
  return requiredValues.every((requiredValue) => valueSet.has(requiredValue));
}
