import assert from "node:assert/strict";

import type {
  RecoraConfirmedActorRelation,
  RecoraPromptGenerationInputV1,
  RecoraPromptGenerationNormalizationResultV1
} from "../lib/recora/prompt-generation-input";
import {
  RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT,
  RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
  RECORA_PERSONA_COMPILATION_CONTRACT_VERSION,
  RECORA_PERSONA_GOLD_FIXTURE_VERSION,
  RECORA_PERSONA_TOPIC_INFLUENCE_DIMENSIONS,
  type RecoraPersonaBlueprintV3,
  type RecoraPersonaGoldFixtureV3,
  type RecoraPersonaGoldSelectionV3
} from "../lib/recora/measurement-persona-contract";
import {
  RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS,
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3,
  validateRecoraPersonaBlueprintCatalogV3
} from "../lib/recora/measurement-persona-catalog";
import {
  compileReadyRecoraMeasurementPersonasV3,
  compileRecoraMeasurementPersonasV3
} from "../lib/recora/measurement-persona-compiler";
import {
  RECORA_PERSONA_BLOCKED_GOLD_FIXTURES_V3,
  RECORA_PERSONA_CATALOG_GAP_GOLD_FIXTURES_V3,
  RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3,
  RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3,
  RECORA_PERSONA_READY_GOLD_FIXTURES_V3,
  upstreamResultForFixture
} from "./fixtures/recora-measurement-persona-gold-fixtures";

const catalogValidation = validateRecoraPersonaBlueprintCatalogV3();
assert.equal(catalogValidation.valid, true, catalogValidation.blockers.join(","));
assert.deepEqual(RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS, {
  total: 192,
  selectable: 152,
  conditional: 33,
  modifier: 7
});
assert.equal(
  new Set(
    RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) => item.blueprintKey)
  ).size,
  192
);
assert.equal(
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3.every(
    (item) =>
      item.kind === "modifier" || item.topicInfluenceDimensions.length >= 2
  ),
  true
);
assert.equal(
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3.filter(
    (item) => item.kind === "modifier"
  ).every((item) => item.blueprintKey.startsWith("lifecycle.")),
  true
);
assert.equal(
  RECORA_PERSONA_TOPIC_INFLUENCE_DIMENSIONS.length,
  new Set(RECORA_PERSONA_TOPIC_INFLUENCE_DIMENSIONS).size
);

assert.deepEqual(RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3, {
  ready: 31,
  needsReview: 12,
  catalogGap: 3,
  blocked: 8
});

for (const fixture of RECORA_PERSONA_READY_GOLD_FIXTURES_V3) {
  verifyReadyFixture(fixture);
  verifyReadyFixtureInvariance(fixture);
}

for (const fixture of RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3) {
  const result = compileRecoraMeasurementPersonasV3(
    upstreamResultForFixture(fixture)
  );
  assert.equal(result.status, "needs_review", fixture.caseKey);
  assert.equal(result.selected.length, 0, fixture.caseKey);
  assert.ok(result.reviewQuestions.length > 0, fixture.caseKey);
}

for (const fixture of RECORA_PERSONA_BLOCKED_GOLD_FIXTURES_V3) {
  const result = compileRecoraMeasurementPersonasV3(
    upstreamResultForFixture(fixture)
  );
  assert.equal(result.status, "blocked", fixture.caseKey);
  assert.equal(result.selected.length, 0, fixture.caseKey);
  assert.ok(result.blockers.length > 0, fixture.caseKey);
}

verifyCatalogGapFixtures();
verifyDistinctActorReview();
verifyUpstreamInvariantFailure();

console.log(
  JSON.stringify(
    {
      status: "PASS",
      catalog: RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS,
      fixtures: RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3,
      readyExecutions: RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length,
      invarianceExecutions:
        RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length * 10
    },
    null,
    2
  )
);

function verifyReadyFixture(fixture: RecoraPersonaGoldFixtureV3) {
  assert.equal(fixture.fixtureVersion, RECORA_PERSONA_GOLD_FIXTURE_VERSION);
  assert.ok(fixture.generationInput, fixture.caseKey);
  assert.ok(fixture.expectedSelected, fixture.caseKey);
  assert.equal(fixture.expectedSelected.length, 5, fixture.caseKey);

  const result = compileReadyRecoraMeasurementPersonasV3(
    fixture.generationInput
  );
  assert.equal(result.contractVersion, RECORA_PERSONA_COMPILATION_CONTRACT_VERSION);
  assert.equal(result.catalogVersion, RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION);
  assert.equal(result.status, "ready", `${fixture.caseKey}:${result.blockers}`);
  assert.equal(
    result.selected.length,
    RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT,
    fixture.caseKey
  );
  assert.equal(result.recipeKey, fixture.expectedRecipeKey, fixture.caseKey);
  assert.match(result.personaSelectionFingerprint ?? "", /^[0-9a-f]{64}$/);
  assert.equal(new Set(result.selected.map((item) => item.personaId)).size, 5);
  assert.equal(
    new Set(result.selected.map((item) => item.selectionSemanticKey)).size,
    5
  );
  assert.deepEqual(
    result.selected.map(toGoldSelection),
    fixture.expectedSelected,
    fixture.caseKey
  );
  assert.deepEqual(
    result.selected.map((item) => item.sortOrder),
    [1, 2, 3, 4, 5],
    fixture.caseKey
  );
  assert.equal(
    result.selected.every((item) => item.topicInfluenceDimensions.length >= 2),
    true,
    fixture.caseKey
  );
  for (const alternative of fixture.expectedAlternativeKeys ?? []) {
    assert.ok(
      result.alternatives.some((item) => item.blueprintKey === alternative),
      `${fixture.caseKey}: alternative ${alternative}`
    );
  }
}

function verifyReadyFixtureInvariance(fixture: RecoraPersonaGoldFixtureV3) {
  const input = fixture.generationInput;
  assert.ok(input, fixture.caseKey);

  const baseline = compileReadyRecoraMeasurementPersonasV3(input);
  assert.equal(baseline.status, "ready", fixture.caseKey);
  const baselineShape = resultIdentityShape(baseline);

  const variants: RecoraPromptGenerationInputV1[] = [
    input,
    reorderAndDuplicate(input, "business"),
    reorderAndDuplicate(input, "actions"),
    reorderAndDuplicate(input, "signals"),
    reorderAndDuplicate(input, "sides"),
    reorderAndDuplicate(input, "relations"),
    reorderAndDuplicate(input, "lifecycle"),
    {
      ...input,
      generationContext: {
        ...input.generationContext,
        focusThemes: ["別の重点テーマ"]
      }
    },
    {
      ...input,
      generationContext: {
        ...input.generationContext,
        diagnosisGoals: ["別の確認目的"]
      }
    },
    {
      ...input,
      generationIdentity: {
        ...input.generationIdentity,
        fingerprint: "0".repeat(64)
      }
    }
  ];

  for (const [index, variant] of variants.entries()) {
    const result = compileReadyRecoraMeasurementPersonasV3(variant);
    assert.equal(result.status, "ready", `${fixture.caseKey}:variant${index}`);
    assert.deepEqual(
      resultIdentityShape(result),
      baselineShape,
      `${fixture.caseKey}:variant${index}`
    );
  }
}

function verifyCatalogGapFixtures() {
  const fixtures = RECORA_PERSONA_CATALOG_GAP_GOLD_FIXTURES_V3;

  const missingRequired = catalogWithout("b2b.problem_owner");
  const result1 = compileReadyRecoraMeasurementPersonasV3(
    requireGenerationInput(fixtures[0]),
    { catalog: missingRequired }
  );
  assert.equal(result1.status, "catalog_gap", fixtures[0].caseKey);
  assert.ok(result1.blockers.includes("selected_blueprint_missing"));

  const onlyFour = catalogWithout(
    "commerce.repeat_purchase_user",
    "b2c.recommender_influencer",
    "b2c.alternate_payer"
  );
  const result2 = compileReadyRecoraMeasurementPersonasV3(
    requireGenerationInput(fixtures[1]),
    { catalog: onlyFour }
  );
  assert.equal(result2.status, "catalog_gap", fixtures[1].caseKey);

  const insufficient = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) =>
    item.blueprintKey === "local.nearby_need_owner"
      ? { ...item, topicInfluenceDimensions: ["need_and_candidate_discovery"] as const }
      : item
  );
  const result3 = compileReadyRecoraMeasurementPersonasV3(
    requireGenerationInput(fixtures[2]),
    { catalog: insufficient }
  );
  assert.equal(result3.status, "catalog_gap", fixtures[2].caseKey);
  assert.ok(result3.blockers.includes("selected_topic_effects_insufficient"));
}

function verifyDistinctActorReview() {
  const source = requireGenerationInput(
    RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0]
  );
  const relation: RecoraConfirmedActorRelation = {
    leftRoleKey: "b2b.internal_champion",
    rightRoleKey: "b2b.problem_owner",
    relation: "distinct_actors"
  };
  const result = compileReadyRecoraMeasurementPersonasV3({
    ...source,
    generationContext: {
      ...source.generationContext,
      actorRelations: [relation]
    }
  });
  assert.equal(result.status, "needs_review");
  assert.ok(
    result.reviewQuestions.some(
      (item) => item.code === "actor_relation_changes_persona_count"
    )
  );
}

function verifyUpstreamInvariantFailure() {
  const upstream: RecoraPromptGenerationNormalizationResultV1 = {
    status: "ready",
    value: null,
    reviewQuestions: [],
    blockers: [],
    warnings: []
  };
  const result = compileRecoraMeasurementPersonasV3(upstream);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockers.includes("compiler_internal_invariant"));
}

function requireGenerationInput(
  fixture: RecoraPersonaGoldFixtureV3
): RecoraPromptGenerationInputV1 {
  assert.ok(fixture.generationInput, fixture.caseKey);
  return fixture.generationInput;
}

function toGoldSelection(item: {
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  modifierKeys: readonly string[];
}): RecoraPersonaGoldSelectionV3 {
  return {
    primaryBlueprintKey: item.primaryBlueprintKey,
    supportingBlueprintKeys: item.supportingBlueprintKeys,
    modifierKeys: item.modifierKeys
  };
}

function resultIdentityShape(result: ReturnType<typeof compileReadyRecoraMeasurementPersonasV3>) {
  return {
    status: result.status,
    recipeKey: result.recipeKey,
    personaSelectionFingerprint: result.personaSelectionFingerprint,
    selected: result.selected.map((item) => ({
      personaId: item.personaId,
      selectionSemanticKey: item.selectionSemanticKey,
      primaryBlueprintKey: item.primaryBlueprintKey,
      supportingBlueprintKeys: item.supportingBlueprintKeys,
      modifierKeys: item.modifierKeys,
      sortOrder: item.sortOrder
    }))
  };
}

function catalogWithout(...keys: readonly string[]): readonly RecoraPersonaBlueprintV3[] {
  const removed = new Set(keys);
  return RECORA_PERSONA_BLUEPRINT_CATALOG_V3.filter(
    (item) => !removed.has(item.blueprintKey)
  );
}

function reorderAndDuplicate(
  input: RecoraPromptGenerationInputV1,
  target:
    | "business"
    | "actions"
    | "signals"
    | "sides"
    | "relations"
    | "lifecycle"
): RecoraPromptGenerationInputV1 {
  if (target === "business") {
    return {
      ...input,
      business: {
        ...input.business,
        secondaryDomains: reverseDuplicate(input.business.secondaryDomains),
        secondaryOfferingModels: reverseDuplicate(
          input.business.secondaryOfferingModels
        ),
        commerceChannels: reverseDuplicate(input.business.commerceChannels),
        commerceRoles: reverseDuplicate(input.business.commerceRoles)
      }
    };
  }
  if (target === "actions") {
    return {
      ...input,
      actions: {
        ...input.actions,
        secondary: reverseDuplicate(input.actions.secondary)
      }
    };
  }
  if (target === "signals") {
    return {
      ...input,
      generationContext: {
        ...input.generationContext,
        structureSignals: reverseDuplicate(
          input.generationContext.structureSignals
        )
      }
    };
  }
  if (target === "sides") {
    return {
      ...input,
      generationContext: {
        ...input.generationContext,
        customerSides: reverseDuplicate(input.generationContext.customerSides)
      }
    };
  }
  if (target === "relations") {
    return {
      ...input,
      generationContext: {
        ...input.generationContext,
        actorRelations: reverseDuplicate(input.generationContext.actorRelations)
      }
    };
  }
  return {
    ...input,
    generationContext: {
      ...input.generationContext,
      lifecycleSignals: reverseDuplicate(
        input.generationContext.lifecycleSignals
      )
    }
  };
}

function reverseDuplicate<T>(values: readonly T[]): readonly T[] {
  if (values.length === 0) return [];
  return [...values].reverse().concat(values[0]);
}