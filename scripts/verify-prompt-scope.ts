import assert from "node:assert/strict";

import {
  RECORA_MEASUREMENT_PURPOSES,
  RECORA_MEASUREMENT_PURPOSE_LABELS,
  RECORA_PROMPT_TYPES,
  RECORA_PROMPT_TYPE_LABELS,
  isBrandPerceptionEligiblePromptScope,
  isCitationValidationPromptScope,
  isRankingEligiblePromptScope,
  isSentimentEligiblePromptScope,
  isSovEligiblePromptScope,
  isVisibilityEligiblePromptScope,
  type RecoraMeasurementPurpose,
  type RecoraPromptScope,
  type RecoraPromptScopeStatus,
  type RecoraPromptType
} from "../lib/recora/prompt-scope";

for (const promptType of RECORA_PROMPT_TYPES) {
  assert.equal(typeof RECORA_PROMPT_TYPE_LABELS[promptType], "string", `${promptType} needs a display label`);
  assert.ok(RECORA_PROMPT_TYPE_LABELS[promptType].length > 0, `${promptType} label must not be empty`);
}

for (const purpose of RECORA_MEASUREMENT_PURPOSES) {
  assert.equal(typeof RECORA_MEASUREMENT_PURPOSE_LABELS[purpose], "string", `${purpose} needs a display label`);
  assert.ok(RECORA_MEASUREMENT_PURPOSE_LABELS[purpose].length > 0, `${purpose} label must not be empty`);
}

assert.equal(isVisibilityEligiblePromptScope(scope("non_branded", "visibility")), true);
assert.equal(isRankingEligiblePromptScope(scope("non_branded", "ranking")), true);
assert.equal(isSovEligiblePromptScope(scope("non_branded", "sov")), true);
assert.equal(isSentimentEligiblePromptScope(scope("branded", "sentiment")), true);
assert.equal(isBrandPerceptionEligiblePromptScope(scope("branded", "brand_perception")), true);

assert.equal(isRankingEligiblePromptScope(scope("citation_check", "citation_validation")), false);
assert.equal(isSovEligiblePromptScope(scope("citation_check", "citation_validation")), false);
assert.equal(isCitationValidationPromptScope(scope("citation_check", "citation_validation")), true);

for (const promptType of ["comparison_named", "competitor_named"] as const) {
  assert.equal(isVisibilityEligiblePromptScope(scope(promptType, "visibility")), false);
  assert.equal(isRankingEligiblePromptScope(scope(promptType, "ranking")), false);
  assert.equal(isSovEligiblePromptScope(scope(promptType, "sov")), false);
}

assert.equal(isVisibilityEligiblePromptScope(scope("comparison_generic", "visibility")), false);
assert.equal(isRankingEligiblePromptScope(scope("comparison_generic", "ranking")), false);
assert.equal(isSovEligiblePromptScope(scope("comparison_generic", "sov")), false);

assert.equal(isVisibilityEligiblePromptScope(scope(null, null, "missing")), false);
assert.equal(isRankingEligiblePromptScope(scope(null, null, "missing")), false);
assert.equal(isSovEligiblePromptScope(scope(null, null, "missing")), false);
assert.equal(isVisibilityEligiblePromptScope(scope("non_branded", "visibility", "inferred")), false);

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    promptTypeLabels: RECORA_PROMPT_TYPES.length,
    measurementPurposeLabels: RECORA_MEASUREMENT_PURPOSES.length,
    nonBrandedVisibilityEligible: true,
    nonBrandedRankingEligible: true,
    nonBrandedSovEligible: true,
    brandedSentimentEligible: true,
    brandedBrandPerceptionEligible: true,
    citationCheckExcludedFromRankingAndSov: true,
    namedComparisonExcludedFromMarketMetrics: true,
    missingAndInferredScopeExcludedFromMarketMetrics: true
  }
}, null, 2));

function scope(
  promptType: RecoraPromptType | null,
  measurementPurpose: RecoraMeasurementPurpose | null,
  status: RecoraPromptScopeStatus = "explicit"
): RecoraPromptScope {
  return {
    promptType,
    measurementPurpose,
    status
  };
}
