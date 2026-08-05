import assert from "node:assert/strict";

import {
  RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION,
  type RecoraConfirmedActorRelation,
  type RecoraPromptGenerationInputV1,
  type RecoraPromptGenerationNormalizationResultV1
} from "../lib/recora/prompt-generation-input";
import {
  RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT,
  RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
  RECORA_PERSONA_COMPILATION_CONTRACT_VERSION,
  RECORA_PERSONA_GOLD_FIXTURE_VERSION,
  RECORA_PERSONA_TOPIC_INFLUENCE_DIMENSIONS,
  projectRecoraPersonaSelectionInputV3,
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
import { normalizeRecoraPromptGenerationInput } from "../lib/recora/prompt-generation-input-normalizer";
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
verifyFixtureCatalogReferences();

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
verifyMissingActorReview();
verifyActorRelationConflictBlocked();
verifyMarketSideCoverageFailure();
verifyModifierStandaloneFailure();
verifyIgnoredGeneratorFields();
verifyProfileProjection();
verifyDisplayNameIdStability();
verifyUpstreamInvariantFailure();

console.log(
  JSON.stringify(
    {
      status: "PASS",
      catalog: RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS,
      fixtures: RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3,
      readyExecutions: RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length,
      baseExecutions:
        RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_CATALOG_GAP_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_BLOCKED_GOLD_FIXTURES_V3.length,
      invarianceExecutions:
        RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length * 10,
      minimumExecutionCases:
        RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_CATALOG_GAP_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_BLOCKED_GOLD_FIXTURES_V3.length +
        RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length * 10
    },
    null,
    2
  )
);

function verifyReadyFixture(fixture: RecoraPersonaGoldFixtureV3) {
  assert.equal(fixture.fixtureVersion, RECORA_PERSONA_GOLD_FIXTURE_VERSION);
  assert.ok(fixture.expectedSelected, fixture.caseKey);
  assert.ok(fixture.expectedRequiredCoverage, fixture.caseKey);
  assert.ok(fixture.expectedRequiredMarketSides, fixture.caseKey);
  assert.ok(fixture.expectedAlternativeKeys, fixture.caseKey);
  assert.ok(fixture.expectedExclusionCodes, fixture.caseKey);
  assert.equal(fixture.expectedSelected.length, 5, fixture.caseKey);

  const input = requireGenerationInput(fixture);
  const result = compileReadyRecoraMeasurementPersonasV3(input);
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
    fixture.expectedSelected.map(toGoldSelection),
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

  const coverage = new Set(
    result.selected.flatMap((item) => item.coverageDimensions)
  );
  for (const required of fixture.expectedRequiredCoverage) {
    assert.ok(coverage.has(required), `${fixture.caseKey}:coverage:${required}`);
  }
  const marketSides = new Set(result.selected.flatMap((item) => item.marketSides));
  for (const required of fixture.expectedRequiredMarketSides) {
    assert.ok(marketSides.has(required), `${fixture.caseKey}:side:${required}`);
  }

  assert.deepEqual(
    result.alternatives.map((item) => item.blueprintKey),
    fixture.expectedAlternativeKeys,
    `${fixture.caseKey}:alternatives`
  );
  for (const expectedCode of fixture.expectedExclusionCodes) {
    assert.ok(
      result.excluded.some((item) => item.reasonCodes.includes(expectedCode)),
      `${fixture.caseKey}:exclusion:${expectedCode}`
    );
  }
}

function verifyReadyFixtureInvariance(fixture: RecoraPersonaGoldFixtureV3) {
  const input = requireGenerationInput(fixture);
  const baseline = compileReadyRecoraMeasurementPersonasV3(input);
  assert.equal(baseline.status, "ready", fixture.caseKey);
  const baselineShape = resultIdentityShape(baseline);

  const variants: readonly [string, RecoraPromptGenerationInputV1][] = [
    ["D01_repeat", cloneInput(input)],
    ["D02_secondary_domains", reverseSecondaryDomains(input)],
    ["D03_secondary_offerings", reverseSecondaryOfferingModels(input)],
    ["D04_secondary_actions", reverseSecondaryActions(input)],
    ["D05_structure_signals", reverseStructureSignals(input)],
    ["D06_customer_sides", reverseCustomerSides(input)],
    ["D07_actor_relations", reverseActorRelations(input)],
    ["D08_duplicate_values", duplicateSelectionArrays(input)],
    ["D09_focus_theme", changeFocusTheme(input)],
    ["D10_profile_size", withProfileSize(input, 200)]
  ];

  for (let index = 0; index < variants.length; index += 1) {
    const [code, variant] = variants[index];
    const result = compileReadyRecoraMeasurementPersonasV3(variant);
    assert.equal(result.status, "ready", `${fixture.caseKey}:${code}`);
    assert.deepEqual(
      resultIdentityShape(result),
      baselineShape,
      `${fixture.caseKey}:${code}`
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
    item.blueprintKey === "local.provider_comparator"
      ? {
          ...item,
          topicInfluenceDimensions: ["need_and_candidate_discovery"] as const
        }
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
  const relation = source.generationContext.actorRelations[0];
  assert.ok(relation);
  const result = compileReadyRecoraMeasurementPersonasV3({
    ...source,
    generationContext: {
      ...source.generationContext,
      actorRelations: source.generationContext.actorRelations.map((item) =>
        item.leftRoleKey === relation.leftRoleKey &&
        item.rightRoleKey === relation.rightRoleKey
          ? { ...item, relation: "distinct_actors" as const }
          : item
      )
    }
  });
  assert.equal(result.status, "needs_review");
  assert.ok(
    result.reviewQuestions.some(
      (item) => item.code === "actor_relation_changes_persona_count"
    )
  );
}

function verifyMissingActorReview() {
  const source = requireGenerationInput(
    RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0]
  );
  const result = compileReadyRecoraMeasurementPersonasV3({
    ...source,
    generationContext: {
      ...source.generationContext,
      actorRelations: source.generationContext.actorRelations.slice(1)
    }
  });
  assert.equal(result.status, "needs_review");
  assert.ok(
    result.reviewQuestions.some(
      (item) => item.code === "actor_relation_changes_persona_count"
    )
  );
}

function verifyActorRelationConflictBlocked() {
  const source = requireGenerationInput(
    RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0]
  );
  const relation = source.generationContext.actorRelations[0];
  assert.ok(relation);
  const result = compileReadyRecoraMeasurementPersonasV3({
    ...source,
    generationContext: {
      ...source.generationContext,
      actorRelations: [
        ...source.generationContext.actorRelations,
        { ...relation, relation: "distinct_actors" as const }
      ]
    }
  });
  assert.equal(result.status, "blocked");
  assert.ok(result.blockers.includes("actor_relation_conflict"));
}

function verifyMarketSideCoverageFailure() {
  const fixture = RECORA_PERSONA_READY_GOLD_FIXTURES_V3.find(
    (item) => item.expectedRecipeKey === "marketplace_brand"
  );
  assert.ok(fixture);
  const source = requireGenerationInput(fixture);
  const supplyKeys = new Set([
    "marketplace.supply_business_owner",
    "marketplace.supply_platform_evaluator",
    "marketplace.supply_listing_operator",
    "marketplace.supply_service_fulfiller"
  ]);
  const catalog = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) =>
    supplyKeys.has(item.blueprintKey)
      ? { ...item, marketSide: "prospective_customer" as const }
      : item
  );
  const result = compileReadyRecoraMeasurementPersonasV3(source, { catalog });
  assert.equal(result.status, "catalog_gap");
  assert.ok(result.blockers.includes("required_market_side_missing"));
}

function verifyModifierStandaloneFailure() {
  const fixture = RECORA_PERSONA_READY_GOLD_FIXTURES_V3.find(
    (item) => item.expectedRecipeKey === "local_facility"
  );
  assert.ok(fixture);
  const source = requireGenerationInput(fixture);
  const catalog = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) =>
    item.blueprintKey === "local.provider_comparator"
      ? { ...item, kind: "modifier" as const }
      : item
  );
  const result = compileReadyRecoraMeasurementPersonasV3(source, { catalog });
  assert.equal(result.status, "catalog_gap");
  assert.ok(result.blockers.includes("selected_modifier_standalone"));
}

function verifyIgnoredGeneratorFields() {
  const source = requireGenerationInput(
    RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0]
  );
  const baseline = compileReadyRecoraMeasurementPersonasV3(source);
  const variant: RecoraPromptGenerationInputV1 = {
    ...source,
    subject: {
      ...source.subject,
      operatorCompanyName: "表示専用の別会社名",
      primary: {
        ...source.subject.primary,
        aliases: ["表示専用別名"],
        officialUrl: "https://changed.example.jp"
      },
      secondary: [
        {
          type: "brand",
          name: "表示専用の副対象",
          aliases: [],
          officialUrl: null
        }
      ]
    },
    business: {
      ...source.business,
      commerceChannels: ["physical_retail"],
      commerceRoles: ["retailer"],
      summary: "表示・根拠専用の別説明"
    },
    delivery: {
      ...source.delivery,
      serviceAreas: [
        {
          areaKey: null,
          label: "表示専用地域",
          level: "custom",
          parentAreaKey: null,
          resolutionStatus: "custom"
        }
      ],
      locations: []
    },
    generationContext: {
      ...source.generationContext,
      focusThemes: ["別の重点テーマ"],
      diagnosisGoals: ["別の確認目的"]
    },
    generationIdentity: {
      ...source.generationIdentity,
      fingerprint: "0".repeat(64)
    }
  };
  assert.deepEqual(
    resultIdentityShape(compileReadyRecoraMeasurementPersonasV3(variant)),
    resultIdentityShape(baseline)
  );
}

function verifyProfileProjection() {
  const source = requireGenerationInput(
    RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0]
  );
  const projections = ([50, 100, 200] as const).map((size) =>
    projectRecoraPersonaSelectionInputV3(withProfileSize(source, size))
  );
  assert.deepEqual(projections[0], projections[1]);
  assert.deepEqual(projections[1], projections[2]);
}

function verifyDisplayNameIdStability() {
  const source = requireGenerationInput(
    RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0]
  );
  const baseline = compileReadyRecoraMeasurementPersonasV3(source);
  const firstKey = baseline.selected[0]?.primaryBlueprintKey;
  assert.ok(firstKey);
  const catalog = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) =>
    item.blueprintKey === firstKey
      ? {
          ...item,
          label: `${item.label}（表示変更）`,
          description: `${item.description} 表示文だけを変更。`
        }
      : item
  );
  const changed = compileReadyRecoraMeasurementPersonasV3(source, { catalog });
  assert.equal(changed.status, "ready");
  assert.equal(
    changed.selected[0]?.personaId,
    baseline.selected[0]?.personaId
  );
  assert.equal(
    changed.selected[0]?.selectionSemanticKey,
    baseline.selected[0]?.selectionSemanticKey
  );
  assert.equal(
    changed.personaSelectionFingerprint,
    baseline.personaSelectionFingerprint
  );
}

function verifyFixtureCatalogReferences() {
  const keys = new Set(
    RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) => item.blueprintKey)
  );
  for (const fixture of RECORA_PERSONA_READY_GOLD_FIXTURES_V3) {
    assert.ok(fixture.expectedSelected, fixture.caseKey);
    assert.ok(fixture.expectedAlternativeKeys, fixture.caseKey);
    assert.ok(fixture.expectedAlternativeKeys.length > 0, fixture.caseKey);
    for (const selection of fixture.expectedSelected) {
      assert.ok(keys.has(selection.primaryBlueprintKey), fixture.caseKey);
      for (const key of selection.supportingBlueprintKeys) {
        assert.ok(keys.has(key), `${fixture.caseKey}:${key}`);
      }
      for (const key of selection.modifierKeys) {
        assert.ok(keys.has(key), `${fixture.caseKey}:${key}`);
      }
    }
    for (const key of fixture.expectedAlternativeKeys) {
      assert.ok(keys.has(key), `${fixture.caseKey}:${key}`);
    }
  }
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
  const input = fixture.generationInput;
  const normalized = normalizeRecoraPromptGenerationInput({
    contractVersion: RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION,
    market: input.market,
    subject: input.subject,
    audience: input.audience,
    business: input.business,
    actions: input.actions,
    delivery: input.delivery,
    trust: {
      decisionImpactFlags: input.trust.decisionImpactFlags,
      regulatoryFlags: input.trust.regulatoryFlags,
      sensitiveContexts: input.trust.sensitiveContexts
    },
    generationContext: input.generationContext
  });
  assert.equal(
    normalized.status,
    "ready",
    `${fixture.caseKey}:${normalized.blockers.join(",")}:${normalized.reviewQuestions
      .map((item) => item.code)
      .join(",")}`
  );
  assert.ok(normalized.value, fixture.caseKey);
  return normalized.value;
}

function toGoldSelection(item: {
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  modifierKeys: readonly string[];
}): RecoraPersonaGoldSelectionV3 {
  return {
    primaryBlueprintKey: item.primaryBlueprintKey,
    supportingBlueprintKeys: item.supportingBlueprintKeys,
    modifierKeys: Array.from(item.modifierKeys).sort()
  };
}

function resultIdentityShape(
  result: ReturnType<typeof compileReadyRecoraMeasurementPersonasV3>
) {
  return result;
}

function catalogWithout(
  ...keys: readonly string[]
): readonly RecoraPersonaBlueprintV3[] {
  const removed = new Set(keys);
  return RECORA_PERSONA_BLUEPRINT_CATALOG_V3.filter(
    (item) => !removed.has(item.blueprintKey)
  );
}

function cloneInput(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return JSON.parse(JSON.stringify(input)) as RecoraPromptGenerationInputV1;
}

function reverseSecondaryDomains(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    business: {
      ...input.business,
      secondaryDomains: reverse(input.business.secondaryDomains)
    }
  };
}

function reverseSecondaryOfferingModels(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    business: {
      ...input.business,
      secondaryOfferingModels: reverse(input.business.secondaryOfferingModels)
    }
  };
}

function reverseSecondaryActions(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    actions: {
      ...input.actions,
      secondary: reverse(input.actions.secondary)
    }
  };
}

function reverseStructureSignals(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    generationContext: {
      ...input.generationContext,
      structureSignals: reverse(input.generationContext.structureSignals)
    }
  };
}

function reverseCustomerSides(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    generationContext: {
      ...input.generationContext,
      customerSides: reverse(input.generationContext.customerSides)
    }
  };
}

function reverseActorRelations(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    generationContext: {
      ...input.generationContext,
      actorRelations: reverse(input.generationContext.actorRelations)
    }
  };
}

function duplicateSelectionArrays(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    business: {
      ...input.business,
      secondaryDomains: duplicate(input.business.secondaryDomains),
      secondaryOfferingModels: duplicate(
        input.business.secondaryOfferingModels
      )
    },
    actions: {
      ...input.actions,
      secondary: duplicate(input.actions.secondary)
    },
    trust: {
      ...input.trust,
      decisionImpactFlags: duplicate(input.trust.decisionImpactFlags),
      regulatoryFlags: duplicate(input.trust.regulatoryFlags),
      sensitiveContexts: duplicate(input.trust.sensitiveContexts)
    },
    generationContext: {
      ...input.generationContext,
      structureSignals: duplicate(input.generationContext.structureSignals),
      customerSides: duplicate(input.generationContext.customerSides),
      actorRelations: duplicate(input.generationContext.actorRelations),
      lifecycleSignals: duplicate(input.generationContext.lifecycleSignals)
    }
  };
}

function changeFocusTheme(
  input: RecoraPromptGenerationInputV1
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    generationContext: {
      ...input.generationContext,
      focusThemes: ["別の重点テーマ"]
    }
  };
}

function withProfileSize(
  input: RecoraPromptGenerationInputV1,
  measurementProfileSize: 50 | 100 | 200
): RecoraPromptGenerationInputV1 {
  return {
    ...input,
    measurementProfileSize
  } as RecoraPromptGenerationInputV1;
}

function reverse<T>(values: readonly T[]): readonly T[] {
  return Array.from(values).reverse();
}

function duplicate<T>(values: readonly T[]): readonly T[] {
  return values.length === 0 ? [] : [...values, ...values];
}
