import assert from "node:assert/strict";

import type { ProjectSetupSeedInput } from "../lib/recora/project-setup-draft";
import { generateProjectSetupDraft } from "../lib/recora/project-setup-draft-generator";

const seoSeed: ProjectSetupSeedInput = {
  companyName: "ミエルカSEO",
  brandName: "ミエルカSEO",
  officialSiteUrl: "https://mieru-ca.com/",
  productOrServiceDescription: "SEOとAI検索での露出を改善するマーケティング向け分析サービス。",
  industryCategory: "SEO / AI検索対策",
  targetCustomers: "BtoB / SEO担当者、マーケティング責任者",
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
  targetCustomers: "BtoC / 初めて選ぶ人、料金を重視する人、口コミを重視する人",
  regions: ["日本"],
  language: "ja",
  serviceName: "さくら英会話",
  brandAliases: ["さくら英語"],
  knownCompetitors: [],
  strengths: [],
  knownRisks: [],
  diagnosisGoals: ["non_branded", "brand_perception", "problem_aware"]
};

const seoSeedKey = stableSeedKey(seoSeed);
const schoolSeedKey = stableSeedKey(schoolSeed);
assert.notEqual(seoSeedKey, schoolSeedKey, "different Step1/Step2 inputs must create different seed keys");

const seoDraft = generateProjectSetupDraft(seoSeed).draft;
const schoolDraft = generateProjectSetupDraft(schoolSeed).draft;

const seoPromptText = seoDraft.prompts.map((prompt) => prompt.text).join("\n");
const schoolPromptText = schoolDraft.prompts.map((prompt) => prompt.text).join("\n");

assert.notEqual(seoPromptText, schoolPromptText, "different seeds must create different prompt examples");
assert.notDeepEqual(
  seoDraft.topics.map((topic) => topic.topicName),
  schoolDraft.topics.map((topic) => topic.topicName),
  "different seeds must create different question areas"
);
assert.ok(seoDraft.prompts.length > 0, "SEO seed must create prompt examples");
assert.ok(schoolDraft.prompts.length > 0, "school seed must create prompt examples");

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
        schoolPromptCount: schoolDraft.prompts.length
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
