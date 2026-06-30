export const RECORA_PROMPT_TYPES = [
  "non_branded",
  "branded",
  "comparison_generic",
  "comparison_named",
  "competitor_named",
  "citation_check"
] as const;

export type RecoraPromptType = typeof RECORA_PROMPT_TYPES[number];

export const RECORA_MEASUREMENT_PURPOSES = [
  "visibility",
  "ranking",
  "sov",
  "sentiment",
  "brand_perception",
  "citation_validation",
  "recommendation_input"
] as const;

export type RecoraMeasurementPurpose = typeof RECORA_MEASUREMENT_PURPOSES[number];

export type RecoraPromptScopeStatus = "explicit" | "inferred" | "missing";

export type RecoraPromptScope = {
  promptType: RecoraPromptType | null;
  measurementPurpose: RecoraMeasurementPurpose | null;
  status: RecoraPromptScopeStatus;
  notes?: string[];
};

export const RECORA_PROMPT_TYPE_LABELS: Record<RecoraPromptType, string> = {
  non_branded: "非指名",
  branded: "指名",
  comparison_generic: "一般比較",
  comparison_named: "指名比較",
  competitor_named: "競合名入り",
  citation_check: "引用確認"
};

export const RECORA_MEASUREMENT_PURPOSE_LABELS: Record<RecoraMeasurementPurpose, string> = {
  visibility: "表示率",
  ranking: "ランキング",
  sov: "Share of Voice",
  sentiment: "感情",
  brand_perception: "ブランド認識",
  citation_validation: "引用確認",
  recommendation_input: "改善候補入力"
};

const PROMPT_TYPE_SET = new Set<string>(RECORA_PROMPT_TYPES);
const MEASUREMENT_PURPOSE_SET = new Set<string>(RECORA_MEASUREMENT_PURPOSES);

export function isRecoraPromptType(value: string): value is RecoraPromptType {
  return PROMPT_TYPE_SET.has(value);
}

export function isRecoraMeasurementPurpose(value: string): value is RecoraMeasurementPurpose {
  return MEASUREMENT_PURPOSE_SET.has(value);
}

export function getRecoraPromptTypeLabel(value: RecoraPromptType): string {
  return RECORA_PROMPT_TYPE_LABELS[value];
}

export function getRecoraMeasurementPurposeLabel(value: RecoraMeasurementPurpose): string {
  return RECORA_MEASUREMENT_PURPOSE_LABELS[value];
}

export function isVisibilityEligiblePromptScope(scope: RecoraPromptScope): boolean {
  return hasExplicitNonBrandedPurpose(scope, "visibility");
}

export function isRankingEligiblePromptScope(scope: RecoraPromptScope): boolean {
  return hasExplicitNonBrandedPurpose(scope, "ranking");
}

export function isSovEligiblePromptScope(scope: RecoraPromptScope): boolean {
  return hasExplicitNonBrandedPurpose(scope, "sov");
}

export function isSentimentEligiblePromptScope(scope: RecoraPromptScope): boolean {
  return hasExplicitPurpose(scope, "branded", "sentiment");
}

export function isBrandPerceptionEligiblePromptScope(scope: RecoraPromptScope): boolean {
  return hasExplicitPurpose(scope, "branded", "brand_perception");
}

export function isCitationValidationPromptScope(scope: RecoraPromptScope): boolean {
  if (scope.status !== "explicit") return false;
  return scope.promptType === "citation_check" || scope.measurementPurpose === "citation_validation";
}

function hasExplicitNonBrandedPurpose(
  scope: RecoraPromptScope,
  purpose: "visibility" | "ranking" | "sov"
): boolean {
  return hasExplicitPurpose(scope, "non_branded", purpose);
}

function hasExplicitPurpose(
  scope: RecoraPromptScope,
  promptType: RecoraPromptType,
  measurementPurpose: RecoraMeasurementPurpose
): boolean {
  return scope.status === "explicit" &&
    scope.promptType === promptType &&
    scope.measurementPurpose === measurementPurpose;
}
