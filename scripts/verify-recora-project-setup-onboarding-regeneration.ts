import assert from "node:assert/strict";

import type { ProjectSetupSeedInput } from "../lib/recora/project-setup-draft";
import { generateProjectSetupDraft } from "../lib/recora/project-setup-draft-generator";

const seoSeed: ProjectSetupSeedInput = {
  companyName: "ミエルカSEO",
  brandName: "ミエルカSEO",
  officialSiteUrl: "https://mieru-ca.com/",
  productOrServiceDescription: "SEOとAI検索での露出を改善するマーケティング向け分析サービス。",
  industryCategory: "SEO / AI検索対策",
  targetCustomers: "BtoB。主な検討者: SEO担当者、マーケティング責任者、導入を判断する責任者。",
  regions: ["日本"],
  language: "ja",
  serviceName: "ミエルカSEO",
  brandAliases: ["ミエルカ", "Mieruca"],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "comparison", "citation_check"]
};

const schoolSeed: ProjectSetupSeedInput = {
  companyName: "さくら英会話",
  brandName: "さくら英会話",
  officialSiteUrl: "https://example.com/",
  productOrServiceDescription: "初心者向けの英会話スクール。口コミや料金を重視する個人が比較するサービス。",
  industryCategory: "スクール / 教育",
  targetCustomers: "BtoC。主なペルソナ: 初めて選ぶ人、料金を比較する人、口コミを重視する人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "さくら英会話",
  brandAliases: ["さくら英語"],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "brand_perception", "problem_aware"]
};

const ecSeed: ProjectSetupSeedInput = {
  companyName: "Hikari D2C",
  brandName: "Hikari D2C",
  officialSiteUrl: "https://example.com/shop",
  productOrServiceDescription: "スキンケア商品のEC。価格、口コミ、品質、返品条件を比較して購入する個人向けサービス。",
  industryCategory: "EC / 商品",
  targetCustomers: "BtoC / EC。主なペルソナ: 価格を比較する人、口コミを重視する人、品質を確認したい人、返品条件を確認したい人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "Hikari D2C",
  brandAliases: ["Hikari"],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "comparison", "problem_aware"]
};

const clinicSeed: ProjectSetupSeedInput = {
  companyName: "さくら美容クリニック",
  brandName: "さくら美容クリニック",
  officialSiteUrl: "https://example.com/clinic",
  productOrServiceDescription: "美容クリニック。初めて相談する人が料金、口コミ、資格、リスク説明を確認するサービス。",
  industryCategory: "クリニック / 医療",
  targetCustomers: "BtoC。主なペルソナ: 初めて相談する人、料金を確認したい人、口コミを重視する人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "さくら美容クリニック",
  brandAliases: ["さくら美容"],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "brand_perception", "problem_aware"]
};

const localSeed: ProjectSetupSeedInput = {
  companyName: "まちの整体予約",
  brandName: "まちの整体予約",
  officialSiteUrl: "https://example.com/local",
  productOrServiceDescription: "地域の整体予約サービス。近くで探す人が予約しやすさ、料金、口コミ、対応エリアを確認するサービス。",
  industryCategory: "地域サービス",
  targetCustomers: "BtoC / 地域サービス。主なペルソナ: 近くで探している人、予約しやすさを重視する人、口コミを重視する人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "まちの整体予約",
  brandAliases: ["まち整体"],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "brand_perception", "problem_aware"]
};

const beginnerEnglishSeed: ProjectSetupSeedInput = {
  companyName: "はじめて英会話",
  brandName: "はじめて英会話",
  officialSiteUrl: "https://example.com/beginner-english",
  productOrServiceDescription: "初心者向けの英会話スクール。初めて英会話を始める社会人が、料金、口コミ、通いやすさ、体験しやすさを比較するサービス。",
  industryCategory: "スクール / 教育",
  targetCustomers: "BtoC / スクール / 教育。主な検討者: 初めて英会話を始める社会人、料金を比較する人、口コミを重視する人、通いやすさを重視する人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "はじめて英会話",
  brandAliases: [],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "brand_perception", "problem_aware"]
};

const kidsEnglishSeed: ProjectSetupSeedInput = {
  companyName: "こども英会話ラボ",
  brandName: "こども英会話ラボ",
  officialSiteUrl: "https://example.com/kids-english",
  productOrServiceDescription: "子ども向け英会話スクール。保護者が、子どもに合う教室、講師、カリキュラム、通いやすさ、安全性を比較するサービス。",
  industryCategory: "スクール / 教育",
  targetCustomers: "BtoC / スクール / 教育。主な検討者: 子どもに合う教室を探す保護者、講師やカリキュラムを確認したい保護者、通いやすさや安全性を重視する人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "こども英会話ラボ",
  brandAliases: [],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "brand_perception", "problem_aware"]
};

const mattressEcSeed: ProjectSetupSeedInput = {
  companyName: "Nemuri Mattress",
  brandName: "Nemuri Mattress",
  officialSiteUrl: "https://example.com/mattress",
  productOrServiceDescription: "マットレスEC。睡眠悩みを解決したい人が、寝心地、素材、価格、口コミ、返品条件を比較して購入するサービス。",
  industryCategory: "EC / 商品",
  targetCustomers: "BtoC / EC / 商品。主な検討者: 睡眠悩みを解決したい人、価格と口コミを比較する人、返品条件を確認したい人、品質や素材を確認したい人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "Nemuri Mattress",
  brandAliases: [],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "comparison", "problem_aware"]
};

const cosmeticsEcSeed: ProjectSetupSeedInput = {
  companyName: "Hikari Skin",
  brandName: "Hikari Skin",
  officialSiteUrl: "https://example.com/cosmetics",
  productOrServiceDescription: "化粧品EC。肌に合うか確認したい人が、成分、口コミ、価格、定期購入条件を比較して購入するサービス。",
  industryCategory: "EC / 商品",
  targetCustomers: "BtoC / EC / 商品。主な検討者: 肌に合うか確認したい人、成分や口コミを重視する人、価格と定期購入条件を確認したい人。",
  regions: ["日本"],
  language: "ja",
  serviceName: "Hikari Skin",
  brandAliases: [],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "comparison", "problem_aware"]
};

const recruitingSaasSeed: ProjectSetupSeedInput = {
  companyName: "採用管理クラウド",
  brandName: "採用管理クラウド",
  officialSiteUrl: "https://example.com/recruiting-saas",
  productOrServiceDescription: "採用管理SaaS。人事担当者、採用責任者、経営者、現場面接担当者が、採用業務、候補者管理、現場連携、費用対効果を確認するサービス。",
  industryCategory: "採用 / HR",
  targetCustomers: "BtoB / 採用 / HR。主な検討者: 人事担当者、採用責任者、経営者・役員、現場面接担当者。",
  regions: ["日本"],
  language: "ja",
  serviceName: "採用管理クラウド",
  brandAliases: [],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "comparison", "problem_aware"]
};

const seoSeedKey = stableSeedKey(seoSeed);
const schoolSeedKey = stableSeedKey(schoolSeed);
const ecSeedKey = stableSeedKey(ecSeed);
const clinicSeedKey = stableSeedKey(clinicSeed);
const localSeedKey = stableSeedKey(localSeed);
const beginnerEnglishSeedKey = stableSeedKey(beginnerEnglishSeed);
const kidsEnglishSeedKey = stableSeedKey(kidsEnglishSeed);
const mattressEcSeedKey = stableSeedKey(mattressEcSeed);
const cosmeticsEcSeedKey = stableSeedKey(cosmeticsEcSeed);
const recruitingSaasSeedKey = stableSeedKey(recruitingSaasSeed);
assert.notEqual(seoSeedKey, schoolSeedKey, "different Step1/Step2 inputs must create different seed keys");
assert.notEqual(schoolSeedKey, clinicSeedKey, "different BtoC categories must create different seed keys");
assert.notEqual(schoolSeedKey, ecSeedKey, "school and EC inputs must create different seed keys");
assert.notEqual(ecSeedKey, clinicSeedKey, "EC and clinic inputs must create different seed keys");
assert.notEqual(localSeedKey, clinicSeedKey, "local service and clinic inputs must create different seed keys");
assert.notEqual(beginnerEnglishSeedKey, kidsEnglishSeedKey, "same school category must still differ by service description");
assert.notEqual(mattressEcSeedKey, cosmeticsEcSeedKey, "same EC category must still differ by service description");
assert.notEqual(seoSeedKey, recruitingSaasSeedKey, "different BtoB services must create different seed keys");

const seoDraft = generateProjectSetupDraft(seoSeed).draft;
const schoolDraft = generateProjectSetupDraft(schoolSeed).draft;
const ecDraft = generateProjectSetupDraft(ecSeed).draft;
const clinicDraft = generateProjectSetupDraft(clinicSeed).draft;
const localDraft = generateProjectSetupDraft(localSeed).draft;
const beginnerEnglishDraft = generateProjectSetupDraft(beginnerEnglishSeed).draft;
const kidsEnglishDraft = generateProjectSetupDraft(kidsEnglishSeed).draft;
const mattressEcDraft = generateProjectSetupDraft(mattressEcSeed).draft;
const cosmeticsEcDraft = generateProjectSetupDraft(cosmeticsEcSeed).draft;
const recruitingSaasDraft = generateProjectSetupDraft(recruitingSaasSeed).draft;

const seoPromptText = seoDraft.prompts.map((prompt) => prompt.text).join("\n");
const schoolPromptText = schoolDraft.prompts.map((prompt) => prompt.text).join("\n");
const ecPromptText = ecDraft.prompts.map((prompt) => prompt.text).join("\n");
const clinicPromptText = clinicDraft.prompts.map((prompt) => prompt.text).join("\n");
const localPromptText = localDraft.prompts.map((prompt) => prompt.text).join("\n");
const beginnerEnglishPromptText = beginnerEnglishDraft.prompts.map((prompt) => prompt.text).join("\n");
const kidsEnglishPromptText = kidsEnglishDraft.prompts.map((prompt) => prompt.text).join("\n");
const mattressEcPromptText = mattressEcDraft.prompts.map((prompt) => prompt.text).join("\n");
const cosmeticsEcPromptText = cosmeticsEcDraft.prompts.map((prompt) => prompt.text).join("\n");
const recruitingSaasPromptText = recruitingSaasDraft.prompts.map((prompt) => prompt.text).join("\n");

assert.notEqual(seoPromptText, schoolPromptText, "different seeds must create different prompt examples");
assert.notDeepEqual(
  seoDraft.topics.map((topic) => topic.topicName),
  schoolDraft.topics.map((topic) => topic.topicName),
  "different seeds must create different question areas"
);
assert.ok(seoDraft.prompts.length > 0, "SEO seed must create prompt examples");
assert.ok(schoolDraft.prompts.length > 0, "school seed must create prompt examples");
assert.ok(ecDraft.prompts.length > 0, "EC seed must create prompt examples");
assert.ok(clinicDraft.prompts.length > 0, "clinic seed must create prompt examples");
assert.ok(localDraft.prompts.length > 0, "local service seed must create prompt examples");
assert.ok(beginnerEnglishDraft.prompts.length > 0, "beginner English seed must create prompt examples");
assert.ok(kidsEnglishDraft.prompts.length > 0, "kids English seed must create prompt examples");
assert.ok(mattressEcDraft.prompts.length > 0, "mattress EC seed must create prompt examples");
assert.ok(cosmeticsEcDraft.prompts.length > 0, "cosmetics EC seed must create prompt examples");
assert.ok(recruitingSaasDraft.prompts.length > 0, "recruiting SaaS seed must create prompt examples");
assert.notEqual(schoolPromptText, clinicPromptText, "school and clinic seeds must create different prompt examples");
assert.notEqual(schoolPromptText, ecPromptText, "school and EC seeds must create different prompt examples");
assert.notEqual(ecPromptText, clinicPromptText, "EC and clinic seeds must create different prompt examples");
assert.notEqual(localPromptText, clinicPromptText, "local service and clinic seeds must create different prompt examples");
assert.notEqual(beginnerEnglishPromptText, kidsEnglishPromptText, "beginner and kids English services must create different prompt examples");
assert.notEqual(mattressEcPromptText, cosmeticsEcPromptText, "mattress and cosmetics EC services must create different prompt examples");
assert.notEqual(seoPromptText, recruitingSaasPromptText, "SEO support and recruiting SaaS must create different prompt examples");
assert.notDeepEqual(
  schoolDraft.topics.map((topic) => topic.topicName),
  clinicDraft.topics.map((topic) => topic.topicName),
  "school and clinic seeds must create different question areas"
);
assertIncludesAny(
  beginnerEnglishDraft.topics.map((topic) => topic.topicName).join("\n"),
  ["Beginner", "lesson", "trial", "level"],
  "beginner English question areas"
);
assertIncludesAny(
  kidsEnglishDraft.topics.map((topic) => topic.topicName).join("\n"),
  ["Child", "guardian", "teacher", "curriculum", "safety"],
  "kids English question areas"
);
assertIncludesAny(
  mattressEcDraft.topics.map((topic) => topic.topicName).join("\n"),
  ["Sleep", "mattress", "comfort", "materials", "return"],
  "mattress EC question areas"
);
assertIncludesAny(
  cosmeticsEcDraft.topics.map((topic) => topic.topicName).join("\n"),
  ["Skin", "ingredient", "subscription", "reviews"],
  "cosmetics EC question areas"
);
assertIncludesAny(
  recruitingSaasDraft.topics.map((topic) => topic.topicName).join("\n"),
  ["Hiring", "Recruiting", "candidate", "Stakeholder"],
  "recruiting SaaS question areas"
);
assert.ok(
  !/AI search visibility|Citation and source readiness|SEO/i.test(recruitingSaasDraft.topics.map((topic) => topic.topicName).join("\n")),
  "recruiting SaaS question areas must not reuse SEO/AI-search defaults"
);

assertNoMechanicalSeedTarget(seoSeed.targetCustomers, "seoSeed");
assertNoMechanicalSeedTarget(schoolSeed.targetCustomers, "schoolSeed");
assertNoMechanicalSeedTarget(ecSeed.targetCustomers, "ecSeed");
assertNoMechanicalSeedTarget(clinicSeed.targetCustomers, "clinicSeed");
assertNoMechanicalSeedTarget(localSeed.targetCustomers, "localSeed");
assertNoMechanicalSeedTarget(beginnerEnglishSeed.targetCustomers, "beginnerEnglishSeed");
assertNoMechanicalSeedTarget(kidsEnglishSeed.targetCustomers, "kidsEnglishSeed");
assertNoMechanicalSeedTarget(mattressEcSeed.targetCustomers, "mattressEcSeed");
assertNoMechanicalSeedTarget(cosmeticsEcSeed.targetCustomers, "cosmeticsEcSeed");
assertNoMechanicalSeedTarget(recruitingSaasSeed.targetCustomers, "recruitingSaasSeed");
assertIncludesAll(seoSeed.targetCustomers, ["SEO担当者", "マーケティング責任者", "導入を判断する責任者"], "seoSeed targetCustomers");
assertIncludesAll(schoolSeed.targetCustomers, ["初めて選ぶ人", "料金を比較する人", "口コミを重視する人"], "schoolSeed targetCustomers");
assertIncludesAll(ecSeed.targetCustomers, ["価格を比較する人", "口コミを重視する人", "品質を確認したい人", "返品条件を確認したい人"], "ecSeed targetCustomers");
assertIncludesAll(clinicSeed.targetCustomers, ["初めて相談する人", "料金を確認したい人", "口コミを重視する人"], "clinicSeed targetCustomers");
assertIncludesAll(localSeed.targetCustomers, ["近くで探している人", "予約しやすさを重視する人", "口コミを重視する人"], "localSeed targetCustomers");
assertIncludesAll(beginnerEnglishSeed.targetCustomers, ["初めて英会話を始める社会人", "料金を比較する人", "口コミを重視する人"], "beginnerEnglishSeed targetCustomers");
assertIncludesAll(kidsEnglishSeed.targetCustomers, ["子どもに合う教室を探す保護者", "講師やカリキュラムを確認したい保護者"], "kidsEnglishSeed targetCustomers");
assertIncludesAll(mattressEcSeed.targetCustomers, ["睡眠悩みを解決したい人", "返品条件を確認したい人", "品質や素材を確認したい人"], "mattressEcSeed targetCustomers");
assertIncludesAll(cosmeticsEcSeed.targetCustomers, ["肌に合うか確認したい人", "成分や口コミを重視する人", "価格と定期購入条件を確認したい人"], "cosmeticsEcSeed targetCustomers");
assertIncludesAll(recruitingSaasSeed.targetCustomers, ["人事担当者", "採用責任者", "経営者・役員", "現場面接担当者"], "recruitingSaasSeed targetCustomers");
assertNoConsumerRoleSuffixes(schoolDraft.personas.map((persona) => persona.displayName).join("\n"), "schoolDraft personas");
assertNoConsumerRoleSuffixes(ecDraft.personas.map((persona) => persona.displayName).join("\n"), "ecDraft personas");
assertNoConsumerRoleSuffixes(clinicDraft.personas.map((persona) => persona.displayName).join("\n"), "clinicDraft personas");
assertNoConsumerRoleSuffixes(localDraft.personas.map((persona) => persona.displayName).join("\n"), "localDraft personas");
assertNoConsumerRoleSuffixes(beginnerEnglishDraft.personas.map((persona) => persona.displayName).join("\n"), "beginnerEnglishDraft personas");
assertNoConsumerRoleSuffixes(kidsEnglishDraft.personas.map((persona) => persona.displayName).join("\n"), "kidsEnglishDraft personas");
assertNoConsumerRoleSuffixes(mattressEcDraft.personas.map((persona) => persona.displayName).join("\n"), "mattressEcDraft personas");
assertNoConsumerRoleSuffixes(cosmeticsEcDraft.personas.map((persona) => persona.displayName).join("\n"), "cosmeticsEcDraft personas");
assertNoUnsafeCustomerPersonaLabels([
  seoSeed.targetCustomers,
  schoolSeed.targetCustomers,
  ecSeed.targetCustomers,
  clinicSeed.targetCustomers,
  localSeed.targetCustomers,
  beginnerEnglishSeed.targetCustomers,
  kidsEnglishSeed.targetCustomers,
  mattressEcSeed.targetCustomers,
  cosmeticsEcSeed.targetCustomers,
  recruitingSaasSeed.targetCustomers
].join("\n"));

console.log(
  JSON.stringify(
    {
      status: "ok",
      checkedCases: {
        differentSeedKeys: seoSeedKey !== schoolSeedKey,
        differentPromptExamples: seoPromptText !== schoolPromptText,
        differentQuestionAreas:
          JSON.stringify(seoDraft.topics.map((topic) => topic.topicName)) !==
          JSON.stringify(schoolDraft.topics.map((topic) => topic.topicName)),
        seoPromptCount: seoDraft.prompts.length,
        schoolPromptCount: schoolDraft.prompts.length,
        ecPromptCount: ecDraft.prompts.length,
        clinicPromptCount: clinicDraft.prompts.length,
        localPromptCount: localDraft.prompts.length,
        beginnerEnglishPromptCount: beginnerEnglishDraft.prompts.length,
        kidsEnglishPromptCount: kidsEnglishDraft.prompts.length,
        mattressEcPromptCount: mattressEcDraft.prompts.length,
        cosmeticsEcPromptCount: cosmeticsEcDraft.prompts.length,
        recruitingSaasPromptCount: recruitingSaasDraft.prompts.length,
        differentB2cPromptExamples:
          schoolPromptText !== clinicPromptText &&
          schoolPromptText !== ecPromptText &&
          ecPromptText !== clinicPromptText &&
          localPromptText !== clinicPromptText,
        sameCategoryServiceSpecificPersonas:
          beginnerEnglishSeedKey !== kidsEnglishSeedKey &&
          mattressEcSeedKey !== cosmeticsEcSeedKey &&
          seoSeedKey !== recruitingSaasSeedKey,
        beginnerVsKidsEnglishPersonas: true,
        mattressVsCosmeticsEcPersonas: true,
        recruitingSaasPersonas: true,
        naturalTargetCustomers: true,
        customerPersonaLabelsDifferByProfile: true,
        ecPersonaLabels: true,
        clinicPersonaLabels: true,
        localServicePersonaLabels: true,
        consumerPersonaLabelsAvoidB2BRoles: true
      }
    },
    null,
    2
  )
);

function stableSeedKey(seedInput: ProjectSetupSeedInput) {
  return JSON.stringify({
    companyName: seedInput.companyName,
    brandName: seedInput.brandName,
    officialSiteUrl: seedInput.officialSiteUrl,
    productOrServiceDescription: seedInput.productOrServiceDescription,
    industryCategory: seedInput.industryCategory,
    targetCustomers: seedInput.targetCustomers,
    regions: seedInput.regions,
    language: seedInput.language,
    brandAliases: seedInput.brandAliases,
    knownCompetitors: seedInput.knownCompetitors,
    diagnosisGoals: seedInput.diagnosisGoals
  });
}

function assertNoMechanicalSeedTarget(value: string, label: string) {
  assert.ok(!/Bto[BC]\s*\/\s*.+の導入判断者/.test(value), `${label} must not join BtoB/BtoC and role suffix`);
  assert.ok(!/decision_maker|evaluator|end_user|roleType|personaId/.test(value), `${label} must not include raw role fields`);
}

function assertNoConsumerRoleSuffixes(value: string, label: string) {
  assert.ok(!/BtoB\s*\//.test(value), `${label} must not include BtoB prefix`);
  assert.ok(!/導入判断者|比較評価担当者|現場利用者|decision_maker|evaluator|end_user|roleType|personaId/.test(value), `${label} must not include BtoB role suffixes`);
}

function assertNoUnsafeCustomerPersonaLabels(value: string) {
  const labelText = value
    .split("\n")
    .map((line) => line.split(":").slice(1).join(":") || line)
    .join("\n");
  assert.ok(!/BtoB\s*\/\s*[^。\n]+|BtoC\s*\/\s*[^。\n]+の導入判断者/.test(labelText), "customer persona labels must not include raw BtoB/BtoC prefixes");
  assert.ok(!/の導入判断者|の比較評価担当者|の現場利用者/.test(labelText), "customer persona labels must not include mechanical role suffixes");
  assert.ok(!/decision_maker|evaluator|end_user|roleType|personaId/.test(labelText), "customer persona labels must not include raw role fields");
}

function assertIncludesAll(value: string, expected: readonly string[], label: string) {
  for (const item of expected) {
    assert.ok(value.includes(item), `${label} must include ${item}`);
  }
}

function assertIncludesAny(value: string, expected: readonly string[], label: string) {
  assert.ok(expected.some((item) => value.includes(item)), `${label} must include at least one of: ${expected.join(", ")}`);
}
