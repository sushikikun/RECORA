import {
  RECORA_PROMPT_PROFILE_DEFINITIONS,
  getRecoraPromptProfileDefinition,
  type RecoraPromptProfileId
} from "./prompt-measurement-contract";

export const RECORA_PROMPT_GENERATION_PROFILE_SIZES = [50, 100, 200] as const;
export type RecoraPromptGenerationProfileSize =
  typeof RECORA_PROMPT_GENERATION_PROFILE_SIZES[number];
export type RecoraPromptMinimumProfileSize =
  RecoraPromptGenerationProfileSize;

export type RecoraPromptGenerationProfileSelection = {
  profileId: Extract<
    RecoraPromptProfileId,
    | "measurement_profile_experimental_50"
    | "measurement_profile_experimental_100"
    | "measurement_profile_experimental_200"
  >;
  targetTotal: RecoraPromptGenerationProfileSize;
  coreCount: number;
  robustnessCount: number;
  diagnosticCount: number;
};

export type RecoraPromptGenerationProfileSelectionResult = {
  status: "ready" | "blocked";
  value: RecoraPromptGenerationProfileSelection | null;
  blockers: readonly string[];
};

export function selectRecoraPromptGenerationProfile(
  questionLimit: number
): RecoraPromptGenerationProfileSelectionResult {
  if (!isRecoraPromptGenerationProfileSize(questionLimit)) {
    return {
      status: "blocked",
      value: null,
      blockers: ["unsupported_question_limit"]
    };
  }

  const definition = RECORA_PROMPT_PROFILE_DEFINITIONS.find(
    (item) =>
      item.productionMeasurementEligible && item.targetTotal === questionLimit
  );

  if (
    !definition ||
    definition.coreCanonical == null ||
    definition.robustness == null ||
    definition.diagnostic == null ||
    !isMeasurementProfileId(definition.id)
  ) {
    return {
      status: "blocked",
      value: null,
      blockers: ["measurement_profile_authority_missing"]
    };
  }

  const profileId = definition.id;
  const authority = getRecoraPromptProfileDefinition(profileId);
  const countsTotal =
    authority.coreCanonical! + authority.robustness! + authority.diagnostic!;
  if (countsTotal !== authority.targetTotal) {
    return {
      status: "blocked",
      value: null,
      blockers: ["measurement_profile_authority_invalid"]
    };
  }

  return {
    status: "ready",
    value: {
      profileId,
      targetTotal: questionLimit,
      coreCount: authority.coreCanonical!,
      robustnessCount: authority.robustness!,
      diagnosticCount: authority.diagnostic!
    },
    blockers: []
  };
}

export function isRecoraPromptGenerationProfileSize(
  value: number
): value is RecoraPromptGenerationProfileSize {
  return RECORA_PROMPT_GENERATION_PROFILE_SIZES.some(
    (candidate) => candidate === value
  );
}

export function deriveRecoraPromptProfileMembership(
  minimumProfileSize: RecoraPromptMinimumProfileSize
): readonly RecoraPromptGenerationProfileSize[] {
  return RECORA_PROMPT_GENERATION_PROFILE_SIZES.filter(
    (size) => size >= minimumProfileSize
  );
}

export function isNestedRecoraPromptMembership(input: {
  minimumProfileSize: RecoraPromptMinimumProfileSize;
  memberships: readonly number[];
}): boolean {
  const normalizedMemberships = Array.from(new Set(input.memberships)).sort(
    (left, right) => left - right
  );
  return (
    JSON.stringify(normalizedMemberships) ===
    JSON.stringify(deriveRecoraPromptProfileMembership(input.minimumProfileSize))
  );
}

function isMeasurementProfileId(
  value: RecoraPromptProfileId
): value is RecoraPromptGenerationProfileSelection["profileId"] {
  return (
    value === "measurement_profile_experimental_50" ||
    value === "measurement_profile_experimental_100" ||
    value === "measurement_profile_experimental_200"
  );
}