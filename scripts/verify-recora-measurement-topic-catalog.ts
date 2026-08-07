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
  RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3,
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
