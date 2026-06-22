export type MeasurementProfileSearchMode = "no-search" | "web-search" | "both";
export type MeasurementProfileId = "small-v01" | "standard-v01";
export type RecoraPromptCategory =
  | "non_branded"
  | "branded"
  | "competitor_comparison"
  | "problem_solution"
  | "alternative_search"
  | "pricing_reputation"
  | "citation_check"
  | "persona_based";

export type RecoraPromptMetricEligibility = {
  visibilityRate: "eligible" | "excluded";
  ranking: "eligible" | "excluded";
  sentiment: "eligible" | "excluded";
  defaultUse: string;
};
export type RecoraPromptMetricEligibilityInput = {
  category?: string | null;
  brandMentionRule?: string | null;
  responseShape?: string | null;
};

export type MeasurementProfile = {
  id: MeasurementProfileId;
  label: string;
  description: string;
  useCase: string;
  promptIds: readonly string[];
  promptCount: number;
  defaultSearchMode: MeasurementProfileSearchMode;
  expectedRunItems: number;
  warning: string;
  isRecommended: boolean;
};

export const DEFAULT_MEASUREMENT_PROFILE_ID: MeasurementProfileId = "small-v01";

export const phase1PromptMetricEligibilityPolicy: Record<RecoraPromptCategory, RecoraPromptMetricEligibility> = {
  non_branded: {
    visibilityRate: "eligible",
    ranking: "eligible",
    sentiment: "excluded",
    defaultUse: "AI visibility, ranking, Share of Voice, and competitor gap when the response can naturally mention candidates."
  },
  branded: {
    visibilityRate: "excluded",
    ranking: "excluded",
    sentiment: "eligible",
    defaultUse: "Brand perception and sentiment only. Do not mix into market visibility or ranking."
  },
  competitor_comparison: {
    visibilityRate: "eligible",
    ranking: "eligible",
    sentiment: "excluded",
    defaultUse: "Competitor comparison when the prompt is brand-excluded or comparison-oriented."
  },
  problem_solution: {
    visibilityRate: "eligible",
    ranking: "eligible",
    sentiment: "excluded",
    defaultUse: "Problem/solution discovery when the answer can naturally include vendors or recommended options."
  },
  alternative_search: {
    visibilityRate: "eligible",
    ranking: "eligible",
    sentiment: "excluded",
    defaultUse: "Alternative and shortlist prompts when the answer can naturally compare candidates."
  },
  pricing_reputation: {
    visibilityRate: "excluded",
    ranking: "excluded",
    sentiment: "eligible",
    defaultUse: "Use as brand perception only when the prompt includes the target brand. Use ranking metrics only for explicitly non-branded comparison prompts."
  },
  citation_check: {
    visibilityRate: "excluded",
    ranking: "excluded",
    sentiment: "excluded",
    defaultUse: "Source evidence and citation review. Do not treat citation occurrence as ranking evidence."
  },
  persona_based: {
    visibilityRate: "eligible",
    ranking: "eligible",
    sentiment: "excluded",
    defaultUse: "Eligible only when the prompt is non-branded and candidate/recommendation-shaped."
  }
};

const SMALL_V01_PROMPT_IDS = [
  "50000000-0000-4000-8000-000000000001"
] as const;

const STANDARD_V01_PROMPT_IDS = [
  "50000000-0000-4000-8000-000000000001",
  "50000000-0000-4000-8000-000000000002",
  "50000000-0000-4000-8000-000000000003",
  "50000000-0000-4000-8000-000000000004",
  "50000000-0000-4000-8000-000000000005",
  "50000000-0000-4000-8000-000000000007",
  "50000000-0000-4000-8000-000000000008",
  "50000000-0000-4000-8000-000000000009",
  "50000000-0000-4000-8000-000000000010",
  "50000000-0000-4000-8000-000000000012"
] as const;

export const measurementProfiles: readonly MeasurementProfile[] = [
  {
    id: "small-v01",
    label: "小規模測定",
    description: "OpenAI API / DB保存 / 集計フローの疎通確認に使う最小構成です。",
    useCase: "動作確認向け",
    promptIds: SMALL_V01_PROMPT_IDS,
    promptCount: SMALL_V01_PROMPT_IDS.length,
    defaultSearchMode: "both",
    expectedRunItems: getExpectedRunItemsByCount(SMALL_V01_PROMPT_IDS.length, "both"),
    warning: "1プロンプトをno-search / web-searchの両方で確認します。",
    isRecommended: false
  },
  {
    id: "standard-v01",
    label: "標準測定",
    description: "Recora v0.1の基本的なAI検索観測に使う推奨構成です。",
    useCase: "非ブランド発見、比較、ブランド理解、根拠確認、実績確認、リスク確認をバランスよく測定",
    promptIds: STANDARD_V01_PROMPT_IDS,
    promptCount: STANDARD_V01_PROMPT_IDS.length,
    defaultSearchMode: "both",
    expectedRunItems: getExpectedRunItemsByCount(STANDARD_V01_PROMPT_IDS.length, "both"),
    warning: "10プロンプト x bothで最大20回程度のOpenAI呼び出しになります。",
    isRecommended: true
  }
] as const;

export function getMeasurementProfile(profileId: string | null | undefined) {
  return measurementProfiles.find((profile) => profile.id === profileId) ?? null;
}

export function getPhase1PromptMetricEligibility(
  input: string | RecoraPromptMetricEligibilityInput | null | undefined
) {
  const category = typeof input === "string" || input == null ? input : input.category;
  const brandMentionRule = typeof input === "object" && input ? normalizeEligibilityToken(input.brandMentionRule) : null;
  const responseShape = typeof input === "object" && input ? normalizeEligibilityToken(input.responseShape) : null;

  if (brandMentionRule === "brand_included" || responseShape === "branded_sentiment_answer" || category === "branded") {
    return phase1PromptMetricEligibilityPolicy.branded;
  }

  if (category && isRecoraPromptCategory(category)) {
    return phase1PromptMetricEligibilityPolicy[category];
  }

  return null;
}

function normalizeEligibilityToken(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? null;
}

export function isRecoraPromptCategory(value: string): value is RecoraPromptCategory {
  return Object.prototype.hasOwnProperty.call(phase1PromptMetricEligibilityPolicy, value);
}

export function isMeasurementProfileId(value: string): value is MeasurementProfileId {
  return measurementProfiles.some((profile) => profile.id === value);
}

export function getMeasurementProfileIds() {
  return measurementProfiles.map((profile) => profile.id);
}

export function getExpectedRunItems(
  profile: Pick<MeasurementProfile, "promptCount">,
  searchMode: MeasurementProfileSearchMode
) {
  return getExpectedRunItemsByCount(profile.promptCount, searchMode);
}

export function getSearchModeRunItemMultiplier(searchMode: MeasurementProfileSearchMode) {
  return searchMode === "both" ? 2 : 1;
}

function getExpectedRunItemsByCount(promptCount: number, searchMode: MeasurementProfileSearchMode) {
  return promptCount * getSearchModeRunItemMultiplier(searchMode);
}
