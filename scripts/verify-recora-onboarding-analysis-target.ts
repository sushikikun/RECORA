import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  analysisTargetTypes,
  buildAnalysisTargetDraft,
  getAnalysisTargetLabel,
  getAnalysisTargetUiContract,
  toLegacyProjectSetupTargetSeed,
  validateAnalysisTargetInput
} from "../lib/recora/onboarding-analysis-target";
import type {
  AnalysisTargetFormInput,
  AnalysisTargetType
} from "../lib/recora/onboarding-analysis-target";

const baseInput: AnalysisTargetFormInput = {
  targetType: null,
  targetName: "Recora",
  targetAliases: ["レコラ", "RECORA"],
  officialUrl: "recora.example",
  mainBusiness: "",
  organizationName: "",
  productScope: "single_product",
  deliveryFormat: "",
  storeLocation: ""
};

const cases: Array<{
  targetType: AnalysisTargetType;
  input: Partial<AnalysisTargetFormInput>;
  expectedCompanyName: string;
  expectedContext: readonly string[];
}> = [
  {
    targetType: "company",
    input: { targetName: "株式会社Recora", mainBusiness: "AI検索分析SaaSの開発・提供" },
    expectedCompanyName: "株式会社Recora",
    expectedContext: ["分析対象種別: 企業", "主な事業: AI検索分析SaaSの開発・提供"]
  },
  {
    targetType: "brand",
    input: { organizationName: "株式会社Recora" },
    expectedCompanyName: "株式会社Recora",
    expectedContext: ["分析対象種別: ブランド", "運営会社: 株式会社Recora"]
  },
  {
    targetType: "product",
    input: { organizationName: "Recora Labs", productScope: "product_series" },
    expectedCompanyName: "Recora Labs",
    expectedContext: ["分析対象種別: 商品", "ブランド・メーカー: Recora Labs", "対象範囲: 商品シリーズ"]
  },
  {
    targetType: "service",
    input: { organizationName: "株式会社Recora", deliveryFormat: "Webサービス" },
    expectedCompanyName: "株式会社Recora",
    expectedContext: ["分析対象種別: サービス", "提供形式: Webサービス"]
  },
  {
    targetType: "store",
    input: { targetName: "Recora 渋谷店", organizationName: "Recora", storeLocation: "東京都渋谷区" },
    expectedCompanyName: "Recora",
    expectedContext: ["分析対象種別: 店舗", "店舗所在地: 東京都渋谷区"]
  }
];

assert.deepEqual(analysisTargetTypes, ["company", "brand", "product", "service", "store"]);
assert.deepEqual(validateAnalysisTargetInput(baseInput), ["分析対象の種類を選んでください。"]);
assert.equal(buildAnalysisTargetDraft(baseInput), null);

for (const testCase of cases) {
  const input = {
    ...baseInput,
    ...testCase.input,
    targetType: testCase.targetType
  } satisfies AnalysisTargetFormInput;

  assert.deepEqual(validateAnalysisTargetInput(input), [], `${testCase.targetType} validation`);
  const target = buildAnalysisTargetDraft(input);
  assert.ok(target, `${testCase.targetType} target`);
  assert.equal(target.targetType, testCase.targetType);
  assert.equal(target.officialUrl, "https://recora.example");

  const legacy = toLegacyProjectSetupTargetSeed(target);
  assert.equal(legacy.companyName, testCase.expectedCompanyName, `${testCase.targetType} companyName`);
  assert.equal(legacy.brandName, input.targetName.trim(), `${testCase.targetType} brandName`);
  assert.equal(legacy.serviceName, input.targetName.trim(), `${testCase.targetType} serviceName`);
  assert.deepEqual(legacy.brandAliases, ["レコラ", "RECORA"]);
  for (const expected of testCase.expectedContext) {
    assert.ok(legacy.identificationContext.includes(expected), `${testCase.targetType} context: ${expected}`);
  }

  const contract = getAnalysisTargetUiContract(testCase.targetType);
  assert.equal(getAnalysisTargetLabel(testCase.targetType), contract.label);
  assert.ok(contract.nameLabel.length > 0);
  assert.ok(contract.urlLabel.length > 0);
  assert.ok(contract.urlHelp.length > 0);
}

assert.ok(
  validateAnalysisTargetInput({ ...baseInput, targetType: "company" }).includes("主な事業を入力してください。")
);
assert.ok(
  validateAnalysisTargetInput({ ...baseInput, targetType: "brand" }).includes("運営会社を入力してください。")
);
assert.ok(
  validateAnalysisTargetInput({ ...baseInput, targetType: "product" }).includes("ブランド・メーカー名を入力してください。")
);
assert.ok(
  validateAnalysisTargetInput({ ...baseInput, targetType: "service" }).includes("提供形式を入力してください。")
);
assert.ok(
  validateAnalysisTargetInput({ ...baseInput, targetType: "store" }).includes("店舗所在地を入力してください。")
);

const wizardPath = path.join(
  process.cwd(),
  "components",
  "recora",
  "onboarding",
  "project-setup-wizard.tsx"
);
const wizardSource = fs.readFileSync(wizardPath, "utf8");
const pageSource = fs.readFileSync(
  path.join(process.cwd(), "app", "onboarding", "project-setup", "page.tsx"),
  "utf8"
);

for (const removedMarker of [
  "competitorMode",
  "competitorInput",
  "known_competitors_confirmed",
  "競合の扱い",
  "候補を抽出してもらう",
  "1プロジェクトにつき",
  "共通の計測条件",
  "主に見たい相手",
  "質問領域",
  "1ページだけ",
  "保存・承認・計測反映"
]) {
  assert.equal(wizardSource.includes(removedMarker), false, `removed onboarding marker: ${removedMarker}`);
}

for (const expectedMarker of [
  "analysisTargetTypes.map",
  "TargetSpecificFields",
  "buildAnalysisTargetFormInput",
  "toLegacyProjectSetupTargetSeed",
  "対象AIモデル",
  "おすすめ設定",
  "visiblePromptCount",
  "質問を検索",
  "さらに10件表示",
  "すべて確認",
  "プロジェクトを作成"
]) {
  assert.equal(wizardSource.includes(expectedMarker), true, `required onboarding marker: ${expectedMarker}`);
}

assert.deepEqual(
  analysisTargetTypes.map((targetType) => getAnalysisTargetUiContract(targetType).shortDescription),
  ["会社・法人", "ブランド全体", "商品・シリーズ", "SaaS・提供サービス", "店舗・支店"]
);

assert.equal(pageSource.includes("競合"), false, "removed competitor wording from onboarding metadata");
assert.equal(pageSource.includes("プロジェクト設定 | Recora"), true, "updated onboarding page title");

console.log("Recora onboarding analysis target checks passed.");
