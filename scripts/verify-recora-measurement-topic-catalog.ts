import {
  RECORA_GENERATION_STRUCTURE_SIGNALS
} from "../lib/recora/prompt-generation-input";
import {
  RECORA_LEGACY_TOPIC_MIGRATION_V3,
  RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1,
  RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT,
  RECORA_TOPIC_COVERAGE_DIMENSIONS,
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,
  RECORA_TOPIC_OBSERVATION_OVERLAY_EXPECTED_COUNT,
  RECORA_TOPIC_PACK_EXPECTED_COUNT,
  RECORA_TOPIC_PACK_KEYS,
  RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1
} from "../lib/recora/measurement-topic-contract";
import {
  RECORA_TOPIC_BLUEPRINT_CATALOG_V3,
  RECORA_TOPIC_CANONICAL_SEMANTIC_GROUP_KEYS_V3,
  RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3,
  RECORA_TOPIC_PACK_POLICIES_V3,
  getRecoraMeasurementTopicBlueprintV3,
  validateRecoraMeasurementTopicCatalogV3
} from "../lib/recora/measurement-topic-catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: actual=${String(actual)} expected=${String(expected)}`);
  }
}

function sameJson(actual: unknown, expected: unknown, message: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${message}: actual=${left} expected=${right}`);
  }
}

const validation = validateRecoraMeasurementTopicCatalogV3();

equal(
  validation.valid,
  true,
  `Topic Catalog validation failed:\n${validation.blockers.join("\n")}`
);
equal(
  validation.counts.blueprints,
  RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT,
  "Blueprint count"
);
equal(validation.counts.packs, RECORA_TOPIC_PACK_EXPECTED_COUNT, "Pack count");
equal(
  validation.counts.observationOverlays,
  RECORA_TOPIC_OBSERVATION_OVERLAY_EXPECTED_COUNT,
  "Observation overlay count"
);
equal(RECORA_TOPIC_PACK_KEYS.length, 44, "Pack key count");
equal(
  Object.keys(RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3).length,
  44,
  "Expected pack count registry"
);
equal(
  Object.values(RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3).reduce(
    (sum, value) => sum + value,
    0
  ),
  332,
  "Expected row total"
);

const keys = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.map(
  (blueprint) => blueprint.blueprintKey
);
equal(new Set(keys).size, keys.length, "Blueprint key uniqueness");

const fixedOrders = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.map(
  (blueprint) => blueprint.fixedOrder
);
equal(new Set(fixedOrders).size, fixedOrders.length, "Fixed-order uniqueness");
sameJson(
  fixedOrders,
  Array.from({ length: 332 }, (_, index) => index + 1),
  "Fixed-order sequence"
);

const overlay = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.filter(
  (blueprint) => blueprint.kind === "observation_overlay"
);
equal(overlay.length, 1, "Observation overlay rows");
equal(
  overlay[0]?.blueprintKey,
  "diagnostic.natural_citation_observation",
  "Natural citation overlay key"
);
equal(
  overlay[0]?.measurementLane,
  "natural_citation_overlay",
  "Natural citation overlay lane"
);

for (const coverage of RECORA_TOPIC_COVERAGE_DIMENSIONS) {
  assert(
    validation.counts.coverageInventory[coverage] > 0,
    `Coverage inventory is empty: ${coverage}`
  );
}

for (const [action, blueprintKey] of Object.entries(
  RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1
)) {
  const blueprint = getRecoraMeasurementTopicBlueprintV3(blueprintKey);
  assert(blueprint, `${action}: missing ${blueprintKey}`);
  equal(blueprint.primaryCoverage, "T4", `${action}: primary coverage`);
  equal(blueprint.measurementLane, "action_readiness", `${action}: lane`);
  assert(
    (blueprint.applicability.primaryActionsAny as readonly string[] | null)
      ?.includes(action),
    `${action}: applicability`
  );
}

equal(
  Object.keys(RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1).length,
  RECORA_GENERATION_STRUCTURE_SIGNALS.length,
  "Structure subject-label binding count"
);
for (const signal of RECORA_GENERATION_STRUCTURE_SIGNALS) {
  assert(
    RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1[signal].trim().length > 0,
    signal
  );
}

for (const legacy of RECORA_LEGACY_TOPIC_MIGRATION_V3) {
  equal(keys.includes(legacy.legacyKey), false, legacy.legacyKey);
  assert(legacy.successorBlueprintKeys.length > 0, legacy.legacyKey);
}

const selfBranded =
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.self_branded_perception;
assert(selfBranded.forbiddenMetricKeys.includes("visibility"), "self-branded visibility");
assert(selfBranded.forbiddenMetricKeys.includes("ranking"), "self-branded ranking");
assert(selfBranded.forbiddenMetricKeys.includes("sov"), "self-branded SOV");

const natural =
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.natural_citation_overlay;
sameJson(
  natural.allowedMetricKeys,
  ["naturalCitationObservation"],
  "Natural citation allowed metrics"
);
assert(
  natural.forbiddenMetricKeys.includes("forcedCitationValidation"),
  "Natural citation must forbid forced citation"
);

const forced =
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.forced_citation_validation;
sameJson(
  forced.allowedMetricKeys,
  ["forcedCitationValidation"],
  "Forced citation allowed metrics"
);
assert(
  forced.forbiddenMetricKeys.includes("naturalCitationObservation"),
  "Forced citation must forbid natural citation"
);

for (const requiredKey of [
  "common.problem_need_discovery",
  "common.pre_job_application_checks",
  "diagnostic.subject_reputation_sentiment",
  "diagnostic.natural_citation_observation",
  "b2b.business_case_roi",
  "marketplace.supply_listing_inventory_operations",
  "saas.feature_workflow_fit",
  "healthcare.provider_qualification_specialty",
  "realestate.purchase_due_diligence_specifics",
  "insurance.coverage_structure_fit",
  "food.menu_occasion_experience_fit",
  "beauty.treatment_service_experience",
  "automotive.vehicle_use_ownership_fit",
  "media.audience_advertiser_creator_ecosystem"
]) {
  assert(getRecoraMeasurementTopicBlueprintV3(requiredKey), requiredKey);
}


const policyByPack = new Map(
  RECORA_TOPIC_PACK_POLICIES_V3.map((policy) => [policy.pack, policy])
);
sameJson(
  policyByPack.get("common_discovery")?.allowedLaneKeys,
  ["market_discovery", "criteria_explanation"],
  "Common discovery lanes must be fixed policy data"
);
assert(
  !policyByPack
    .get("common_discovery")
    ?.allowedLaneKeys.includes("self_branded_perception"),
  "Common discovery must not inherit lanes from rows"
);
sameJson(
  policyByPack.get("marketplace_demand")?.defaultMarketSidesAny,
  ["demand_side_participant"],
  "Marketplace demand side authority"
);
sameJson(
  policyByPack.get("marketplace_supply")?.defaultMarketSidesAny,
  ["supply_side_participant"],
  "Marketplace supply side authority"
);
assert(
  policyByPack
    .get("location_facility")
    ?.defaultApplicability.geographicBindingsAny?.includes(
      "physical_location"
    ),
  "Location pack must require physical geography"
);
assert(
  policyByPack
    .get("finance_insurance")
    ?.defaultApplicability.trustClassesAny?.includes("regulated"),
  "Finance pack must retain trust authority"
);

sameJson(
  getRecoraMeasurementTopicBlueprintV3("service.scope_fit")
    ?.coverageDimensions,
  ["T3"],
  "T3 must not be promoted to T6 by tier"
);
sameJson(
  getRecoraMeasurementTopicBlueprintV3("company.corporate_trust_reputation")
    ?.coverageDimensions,
  ["T5"],
  "T5 must not be promoted to T6 by tier"
);

const fitSemanticKeys = [
  "common.use_case_fit",
  "commerce.product_need_fit",
  "healthcare.care_need_scope",
  "recruiting.hiring_workflow_fit"
].map(
  (key) => getRecoraMeasurementTopicBlueprintV3(key)?.semanticGroupKey
);
equal(new Set(fitSemanticKeys).size, 1, "Canonical fit semantic group");
assert(
  RECORA_TOPIC_CANONICAL_SEMANTIC_GROUP_KEYS_V3.includes(
    fitSemanticKeys[0] as never
  ),
  "Canonical semantic group registry"
);

sameJson(
  getRecoraMeasurementTopicBlueprintV3(
    "location.facility_equipment_environment"
  )?.expectedEntityTypes,
  ["location_facility", "comparison_criterion", "operational_requirement"],
  "Facility environment entity"
);
assert(
  !getRecoraMeasurementTopicBlueprintV3(
    "finance.need_product_discovery"
  )?.expectedEntityTypes.includes("price_fee"),
  "Finance discovery must not treat price as candidate entity"
);
assert(
  !getRecoraMeasurementTopicBlueprintV3(
    "home_service.contractor_discovery"
  )?.expectedEntityTypes.includes("contract_condition"),
  "Contractor discovery must not treat contract as candidate entity"
);

console.log(
  JSON.stringify(
    {
      status: "PASS",
      catalogVersion:
        RECORA_TOPIC_BLUEPRINT_CATALOG_V3[0]?.catalogVersion ?? null,
      blueprints: validation.counts.blueprints,
      packs: validation.counts.packs,
      observationOverlays: validation.counts.observationOverlays,
      coverageInventory: validation.counts.coverageInventory,
      warnings: validation.warnings
    },
    null,
    2
  )
);
