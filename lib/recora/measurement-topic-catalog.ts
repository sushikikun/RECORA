import { RECORA_GENERATION_STRUCTURE_SIGNALS } from "./prompt-generation-input";
import type {
  RecoraTopicBlueprintApplicabilityV3,
  RecoraTopicBlueprintSourceRowV3,
  RecoraTopicBlueprintV3,
  RecoraTopicCoverageDimensionV3,
  RecoraTopicMeasurementLaneKeyV3,
  RecoraTopicPackKeyV3,
  RecoraTopicPackPolicyV3,
  RecoraTopicSpecificityTierV3
} from "./measurement-topic-contract";
import {
  RECORA_LEGACY_TOPIC_MIGRATION_V3,
  RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION,
  RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1,
  RECORA_TOPIC_ALIAS_REGISTRY_JA_V1,
  RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
  RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT,
  RECORA_TOPIC_COVERAGE_DIMENSIONS,
  RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1,
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,
  RECORA_TOPIC_OBSERVATION_OVERLAY_EXPECTED_COUNT,
  RECORA_TOPIC_PACK_EXPECTED_COUNT,
  RECORA_TOPIC_PACK_KEYS,
  RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1,
  hasCompletePrimaryActionBindingV1,
  hasCompleteStructureSubjectBindingV1
} from "./measurement-topic-contract";
import { RECORA_TOPIC_COMMON_SOURCE_ROWS_V3 } from "./measurement-topic-catalog-common";
import { RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3 } from "./measurement-topic-catalog-structure";
import { RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3 } from "./measurement-topic-catalog-industry";

const EMPTY_APPLICABILITY: RecoraTopicBlueprintApplicabilityV3 = {
  audienceScopesAny: null, audiencePrioritiesAny: null,
  primarySubjectTypesAny: null, secondarySubjectTypesAny: null,
  primaryBusinessDomainsAny: null, secondaryBusinessDomainsAny: null,
  primaryOfferingModelsAny: null, secondaryOfferingModelsAny: null,
  commerceChannelsAny: null, commerceChannelsAll: null,
  commerceRolesAny: null, commerceRolesAll: null, commerceRolesNone: null,
  primaryActionsAny: null, secondaryActionsAny: null,
  structureSignalsAll: null, structureSignalsAny: null, structureSignalsNone: null,
  geographicBindingsAny: null, serviceCoveragesAny: null, locationStructuresAny: null,
  trustClassesAny: null, decisionImpactFlagsAny: null,
  regulatoryFlagsAny: null, sensitiveContextsAny: null,
  personaInfluencesAny: null, personaRoleFamiliesAny: null, marketSidesAny: null,
  lifecycleSignalsAny: null, lifecycleSignalsAll: null, lifecycleSignalsNone: null,
  resolvedTopicSubtypeKeysAny: null
};

export const RECORA_TOPIC_ALL_SOURCE_ROWS_V3 = [
  ...RECORA_TOPIC_COMMON_SOURCE_ROWS_V3,
  ...RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3,
  ...RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3
] as const satisfies readonly RecoraTopicBlueprintSourceRowV3[];

const COMMON_PACKS = new Set<RecoraTopicPackKeyV3>([
  "common_discovery", "common_comparison", "common_fit_action",
  "common_trust_continuation", "diagnostic_brand_citation"
]);
const AUDIENCE_PACKS = new Set<RecoraTopicPackKeyV3>(["b2b_buying", "b2c_decision"]);
const OFFERING_PACKS = new Set<RecoraTopicPackKeyV3>([
  "company_brand", "offering_service", "offering_product", "location_facility",
  "professional_person", "saas_software", "commerce_product", "publisher_content"
]);
const STRUCTURE_SIGNAL_BY_PACK: Partial<Record<RecoraTopicPackKeyV3, readonly string[]>> = {
  agency_delivery: ["agency_delivery"], b2b2c: ["b2b2c"],
  marketplace_demand: ["marketplace_brand"], marketplace_supply: ["marketplace_brand"],
  marketplace_operator: ["marketplace_operator_customer"],
  multi_location: ["multi_location_consumer_brand", "multi_location_customer_organization"],
  franchise: ["franchise_consumer_brand", "franchise_recruitment"],
  urgent_service: ["urgent_service"], public_nonprofit: ["public_nonprofit_customer"],
  enterprise_it_security: ["enterprise_it_security"], healthcare_clinic: ["adult_healthcare"],
  care_welfare: ["care_welfare"], education_school: ["adult_education", "child_education", "corporate_training"],
  recruiting_hr: ["recruiting_employer_saas"],
  real_estate: ["real_estate_rental", "real_estate_purchase_residential", "real_estate_sale"],
  finance_insurance: ["insurance"], travel_hospitality: ["individual_travel", "group_or_business_travel"],
  manufacturing_industrial: ["manufacturing_capex"],
  logistics_supply_chain: ["logistics_shipper_buying"],
  media_content_advertising: ["media_brand"]
};
const DOMAIN_BY_PACK: Partial<Record<RecoraTopicPackKeyV3, string>> = {
  enterprise_it_security: "it_software", healthcare_clinic: "healthcare",
  care_welfare: "care_welfare", education_school: "education",
  professional_service: "professional_consulting", recruiting_hr: "recruiting_hr",
  real_estate: "real_estate", finance_insurance: "finance_insurance",
  travel_hospitality: "travel_hospitality", restaurant_food_catering: "food_beauty_lifestyle",
  beauty_wellness: "food_beauty_lifestyle", construction_home_service: "construction_home_service",
  manufacturing_industrial: "manufacturing_industrial",
  logistics_supply_chain: "logistics_supply_chain", automotive_mobility: "automotive_mobility",
  media_content_advertising: "media_content", publisher_content: "media_content"
};
const MARKET_SIDES_BY_PACK: Partial<Record<RecoraTopicPackKeyV3, readonly string[]>> = {
  marketplace_demand: ["demand_side_participant"],
  marketplace_supply: ["supply_side_participant"],
  marketplace_operator: ["prospective_customer"],
  agency_delivery: ["partner_or_intermediary", "prospective_customer"],
  b2b2c: ["payer_or_sponsor", "prospective_customer", "end_user_or_beneficiary"],
  public_nonprofit: ["prospective_customer", "payer_or_sponsor", "end_user_or_beneficiary"],
  media_content_advertising: ["end_user_or_beneficiary", "payer_or_sponsor", "partner_or_intermediary"]
};

function tierForPack(pack: RecoraTopicPackKeyV3): RecoraTopicSpecificityTierV3 {
  if (COMMON_PACKS.has(pack)) return "common";
  if (AUDIENCE_PACKS.has(pack)) return "audience";
  if (OFFERING_PACKS.has(pack)) return "offering_subject";
  if (["restaurant_food_catering", "beauty_wellness", "construction_home_service", "automotive_mobility", "manufacturer_channel"].includes(pack)) return "industry";
  return "structure_motion";
}
function influencesForCoverage(coverage: RecoraTopicCoverageDimensionV3) {
  if (coverage === "T1") return ["need_and_candidate_discovery", "comparison_and_alternatives"] as const;
  if (coverage === "T2") return ["comparison_and_alternatives", "continuation_and_switching"] as const;
  if (coverage === "T3") return ["usage_or_outcome_fit", "action_and_contract_decision", "technical_and_operational_fit", "family_or_proxy_decision"] as const;
  if (coverage === "T4") return ["action_and_contract_decision", "family_or_proxy_decision"] as const;
  if (coverage === "T5") return ["trust_evidence_and_risk"] as const;
  return ["technical_and_operational_fit", "usage_or_outcome_fit"] as const;
}
function policyApplicability(pack: RecoraTopicPackKeyV3): RecoraTopicBlueprintApplicabilityV3 {
  const value = { ...EMPTY_APPLICABILITY };
  if (pack === "b2b_buying") value.audienceScopesAny = ["b2b", "both"];
  if (pack === "b2c_decision" || pack === "family_proxy") value.audienceScopesAny = ["b2c", "both"];
  if (pack === "both_audience") value.audienceScopesAny = ["both"];
  const signals = STRUCTURE_SIGNAL_BY_PACK[pack] as readonly any[] | undefined;
  if (signals) value.structureSignalsAny = signals;
  const domain = DOMAIN_BY_PACK[pack] as any;
  if (domain) value.primaryBusinessDomainsAny = [domain];
  if (pack === "restaurant_food_catering") value.resolvedTopicSubtypeKeysAny = ["food_dining"];
  if (pack === "beauty_wellness") value.resolvedTopicSubtypeKeysAny = ["beauty_wellness"];
  return value;
}

function makePackPolicies(): readonly RecoraTopicPackPolicyV3[] {
  return RECORA_TOPIC_PACK_KEYS.map((pack) => {
    const rows = RECORA_TOPIC_ALL_SOURCE_ROWS_V3.filter((row) => row[0] === pack);
    const lanes = [...new Set(rows.map((row) => row[5]))];
    const firstCoverage = rows[0]?.[4] ?? "T3";
    return {
      pack,
      specificityTier: tierForPack(pack),
      defaultApplicability: policyApplicability(pack),
      defaultPersonaInfluencesAny: influencesForCoverage(firstCoverage),
      defaultPersonaRoleFamiliesAny: null,
      defaultMarketSidesAny: (MARKET_SIDES_BY_PACK[pack] as any) ?? null,
      allowedLaneKeys: lanes,
      defaultExpectedEntityTypes: ["service"],
      defaultExpectedAnswerShapes: ["evaluation_criteria"],
      promptSubjectLabelRule: STRUCTURE_SIGNAL_BY_PACK[pack]
        ? { kind: "structure_signal", bindingKey: "recora_prompt_subject_structure_binding_v1" }
        : { kind: "domain_offering", bindingKey: "recora_prompt_subject_domain_offering_binding_v1" },
      requiredRowOverrides: [
        "primaryCoverage", "measurementLane", "semanticGroupKey",
        "customerFacingNameTemplate", "expectedEntityTypes",
        "expectedAnswerShapes", "questionActs", "applicability"
      ]
    } as RecoraTopicPackPolicyV3;
  });
}
export const RECORA_TOPIC_PACK_POLICIES_V3 = makePackPolicies();

export const RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3: Readonly<Record<RecoraTopicPackKeyV3, number>> = {
  common_discovery:14, common_comparison:8, common_fit_action:23,
  common_trust_continuation:16, diagnostic_brand_citation:8,
  b2b_buying:10, b2c_decision:8, both_audience:5, family_proxy:6,
  agency_delivery:7, b2b2c:6, marketplace_demand:6, marketplace_supply:7,
  marketplace_operator:7, multi_location:6, franchise:6, subscription_membership:5,
  urgent_service:5, public_nonprofit:6, manufacturer_channel:6,
  company_brand:4, offering_service:14, offering_product:5, location_facility:8,
  professional_person:5, saas_software:8, commerce_product:8, publisher_content:3,
  enterprise_it_security:7, healthcare_clinic:7, care_welfare:6, education_school:7,
  professional_service:6, recruiting_hr:6, real_estate:19, finance_insurance:8,
  travel_hospitality:5, restaurant_food_catering:5, beauty_wellness:5,
  construction_home_service:6, manufacturing_industrial:6, logistics_supply_chain:6,
  automotive_mobility:6, media_content_advertising:7
};
const POLICY_BY_PACK = new Map(RECORA_TOPIC_PACK_POLICIES_V3.map((item) => [item.pack, item]));
function unique<T extends string>(values: readonly T[]): readonly T[] { return [...new Set(values)]; }
function mergeApplicability(base: RecoraTopicBlueprintApplicabilityV3, override?: Partial<RecoraTopicBlueprintApplicabilityV3>): RecoraTopicBlueprintApplicabilityV3 {
  return override ? { ...base, ...override } : { ...base };
}
function hasConstraint(value: RecoraTopicBlueprintApplicabilityV3): boolean {
  return Object.values(value).some((item) => item !== null);
}
function coverageDimensions(primary: RecoraTopicCoverageDimensionV3, family: RecoraTopicBlueprintV3["family"], lane: RecoraTopicMeasurementLaneKeyV3, tier: RecoraTopicSpecificityTierV3, requested?: readonly RecoraTopicCoverageDimensionV3[]) {
  const values: RecoraTopicCoverageDimensionV3[] = [primary];
  if (primary === "T1" && lane === "market_discovery") values.push("T2");
  if (primary === "T2") values.push("T3");
  if (primary === "T3" && family === "fit_and_selection") values.push("T1");
  if (primary === "T3" && tier !== "common") values.push("T6");
  if (primary === "T4") values.push("T3");
  if (primary === "T5" && tier !== "common") values.push("T6");
  if (primary === "T6") { values.push("T3"); if (lane === "trust_risk_diagnostic") values.push("T5"); }
  if (requested) values.push(...requested);
  return unique(values);
}
function buildBlueprint(row: RecoraTopicBlueprintSourceRowV3, index: number): RecoraTopicBlueprintV3 {
  const [pack, blueprintKey, name, family, primaryCoverage, measurementLane, semanticGroupKey, entities, shapes, acts, options] = row;
  const policy = POLICY_BY_PACK.get(pack);
  if (!policy) throw new Error(`topic_pack_policy_missing:${pack}`);
  const applicability = mergeApplicability(policy.defaultApplicability, options?.applicability);
  const kind = options?.kind ?? (blueprintKey === "diagnostic.natural_citation_observation" ? "observation_overlay" : hasConstraint(applicability) ? "conditional" : "selectable");
  const lanePolicy = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3[measurementLane];
  const tier = options?.specificityTier ?? policy.specificityTier;
  return {
    catalogVersion: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
    blueprintKey, pack, kind, specificityTier: tier, family, primaryCoverage,
    coverageDimensions: coverageDimensions(primaryCoverage, family, measurementLane, tier, options?.coverageDimensions),
    customerFacingNameTemplateKey: options?.customerFacingNameTemplateKey ?? `topic_name.${blueprintKey}`,
    customerFacingNameTemplate: name,
    internalSummary: options?.internalSummary ?? name,
    promptSubjectLabelRule: measurementLane === "self_branded_perception"
      ? { kind: "primary_subject_name", allowedLanes: ["self_branded_perception"] }
      : options?.promptSubjectLabelRule ?? policy.promptSubjectLabelRule,
    semanticGroupKey: options?.semanticGroupKey ?? semanticGroupKey,
    applicability,
    personaInfluencesAny: options?.personaInfluencesAny ?? influencesForCoverage(primaryCoverage),
    personaRoleFamiliesAny: options?.personaRoleFamiliesAny ?? policy.defaultPersonaRoleFamiliesAny,
    marketSidesAny: options?.marketSidesAny ?? policy.defaultMarketSidesAny,
    measurementGoal: options?.measurementGoal ?? name,
    expectedEntityTypes: entities,
    comparisonAxes: options?.comparisonAxes ?? [name],
    expectedAnswerShapes: kind === "observation_overlay" ? lanePolicy.allowedResponseShapes : options?.expectedAnswerShapes ?? shapes,
    questionActs: kind === "observation_overlay" ? lanePolicy.allowedQuestionActs : options?.questionActs ?? acts,
    measurementLane,
    fixedOrder: index + 1
  };
}
export const RECORA_TOPIC_BLUEPRINT_CATALOG_V3 = RECORA_TOPIC_ALL_SOURCE_ROWS_V3.map(buildBlueprint);

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>(); const result = new Set<string>();
  for (const value of values) { if (seen.has(value)) result.add(value); seen.add(value); }
  return [...result];
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
function nonEmptyArrays(value: RecoraTopicBlueprintApplicabilityV3): boolean {
  return Object.values(value).every((item) => !Array.isArray(item) || item.length > 0);
}
function validateBlueprint(item: RecoraTopicBlueprintV3, blockers: string[]) {
  if (!item.blueprintKey || !item.customerFacingNameTemplate || !item.semanticGroupKey || !item.measurementGoal) blockers.push(`required_field_missing:${item.blueprintKey}`);
  if (!item.expectedEntityTypes.length || !item.expectedAnswerShapes.length || !item.questionActs.length || !item.coverageDimensions.length) blockers.push(`required_array_empty:${item.blueprintKey}`);
  if (!nonEmptyArrays(item.applicability)) blockers.push(`applicability_empty_array:${item.blueprintKey}`);
  const policy = POLICY_BY_PACK.get(item.pack);
  if (!policy?.allowedLaneKeys.includes(item.measurementLane)) blockers.push(`pack_lane_invalid:${item.blueprintKey}`);
  const lane = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3[item.measurementLane];
  if (item.expectedAnswerShapes.some((value) => !lane.allowedResponseShapes.includes(value))) blockers.push(`answer_shape_lane_mismatch:${item.blueprintKey}`);
  if (item.questionActs.some((value) => !lane.allowedQuestionActs.includes(value))) blockers.push(`question_act_lane_mismatch:${item.blueprintKey}`);
  if (item.kind === "observation_overlay" && lane.laneKind !== "observation_overlay") blockers.push(`overlay_lane_kind_invalid:${item.blueprintKey}`);
  if (item.kind !== "observation_overlay" && lane.laneKind === "observation_overlay") blockers.push(`selectable_overlay_lane_invalid:${item.blueprintKey}`);
}
export function validateRecoraMeasurementTopicCatalogV3() {
  const blockers: string[] = []; const warnings: string[] = [];
  const catalog = RECORA_TOPIC_BLUEPRINT_CATALOG_V3;
  if (catalog.length !== RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT) blockers.push(`blueprint_count:${catalog.length}:${RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT}`);
  if (RECORA_TOPIC_PACK_POLICIES_V3.length !== RECORA_TOPIC_PACK_EXPECTED_COUNT) blockers.push(`pack_policy_count:${RECORA_TOPIC_PACK_POLICIES_V3.length}:${RECORA_TOPIC_PACK_EXPECTED_COUNT}`);
  if (new Set(RECORA_TOPIC_PACK_POLICIES_V3.map((p) => p.pack)).size !== RECORA_TOPIC_PACK_EXPECTED_COUNT) blockers.push("pack_policy_key_duplicate");
  if (RECORA_TOPIC_COMMON_SOURCE_ROWS_V3.length !== 69 || RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3.length !== 96 || RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3.length !== 167) blockers.push(`source_partition_count:${RECORA_TOPIC_COMMON_SOURCE_ROWS_V3.length}:${RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3.length}:${RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3.length}`);
  for (const pack of RECORA_TOPIC_PACK_KEYS) {
    const actual = catalog.filter((item) => item.pack === pack).length;
    if (actual !== RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3[pack]) blockers.push(`pack_item_count:${pack}:${actual}:${RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3[pack]}`);
  }
  for (const value of duplicates(catalog.map((item) => item.blueprintKey))) blockers.push(`blueprint_key_duplicate:${value}`);
  for (const value of duplicates(catalog.map((item) => String(item.fixedOrder)))) blockers.push(`fixed_order_duplicate:${value}`);
  const overlay = catalog.filter((item) => item.kind === "observation_overlay");
  if (overlay.length !== RECORA_TOPIC_OBSERVATION_OVERLAY_EXPECTED_COUNT) blockers.push(`observation_overlay_count:${overlay.length}`);
  if (overlay[0]?.blueprintKey !== "diagnostic.natural_citation_observation" || overlay[0]?.measurementLane !== "natural_citation_overlay") blockers.push("natural_citation_overlay_contract_mismatch");
  for (const item of catalog) validateBlueprint(item, blockers);
  const keys = new Set(catalog.map((item) => item.blueprintKey));
  for (const legacy of RECORA_LEGACY_TOPIC_MIGRATION_V3) {
    if (keys.has(legacy.legacyKey)) blockers.push(`legacy_key_reused:${legacy.legacyKey}`);
    for (const target of legacy.successorBlueprintKeys) if (!keys.has(target)) blockers.push(`legacy_successor_missing:${legacy.legacyKey}:${target}`);
  }
  if (!hasCompletePrimaryActionBindingV1()) blockers.push("primary_action_binding_incomplete");
  for (const [action, key] of Object.entries(RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1)) {
    const item = catalog.find((value) => value.blueprintKey === key);
    if (!item || item.primaryCoverage !== "T4" || item.measurementLane !== "action_readiness" || !item.applicability.primaryActionsAny?.includes(action as any)) blockers.push(`action_binding_invalid:${action}:${key}`);
  }
  if (!hasCompleteStructureSubjectBindingV1() || Object.keys(RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1).length !== RECORA_GENERATION_STRUCTURE_SIGNALS.length) blockers.push("structure_subject_binding_incomplete");
  for (const binding of RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1) if (!keys.has(binding.blueprintKey)) blockers.push(`domain_offering_target_missing:${binding.blueprintKey}`);
  for (const alias of RECORA_TOPIC_ALIAS_REGISTRY_JA_V1) for (const key of alias.targetBlueprintKeys) if (!keys.has(key)) blockers.push(`alias_target_missing:${alias.mappingKey}:${key}`);
  const exact = new Map<string, string>();
  for (const item of catalog) {
    const signature = stableJson({ goal:item.measurementGoal, entities:item.expectedEntityTypes, axes:item.comparisonAxes, shapes:item.expectedAnswerShapes, lane:item.measurementLane, applicability:item.applicability });
    const previous = exact.get(signature); if (previous) blockers.push(`exact_duplicate:${previous}:${item.blueprintKey}`); else exact.set(signature, item.blueprintKey);
  }
  const semantic = new Map<string, string>();
  for (const item of catalog) {
    const signature = stableJson({ tier:item.specificityTier, semantic:item.semanticGroupKey, applicability:item.applicability });
    const previous = semantic.get(signature); if (previous) blockers.push(`same_tier_semantic_overlap:${previous}:${item.blueprintKey}`); else semantic.set(signature, item.blueprintKey);
  }
  const coverageInventory = Object.fromEntries(RECORA_TOPIC_COVERAGE_DIMENSIONS.map((coverage) => [coverage, catalog.filter((item) => item.coverageDimensions.includes(coverage)).length])) as Record<RecoraTopicCoverageDimensionV3, number>;
  const minimum: Record<RecoraTopicCoverageDimensionV3, number> = { T1:45, T2:45, T3:55, T4:45, T5:60, T6:100 };
  for (const coverage of RECORA_TOPIC_COVERAGE_DIMENSIONS) if (coverageInventory[coverage] < minimum[coverage]) blockers.push(`coverage_inventory_low:${coverage}:${coverageInventory[coverage]}:${minimum[coverage]}`);
  const natural = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.natural_citation_overlay;
  if (natural.laneKind !== "observation_overlay" || natural.allowedMetricKeys.join(",") !== "naturalCitationObservation" || !natural.forbiddenMetricKeys.includes("forcedCitationValidation")) blockers.push("natural_citation_lane_boundary_invalid");
  const forced = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.forced_citation_validation;
  if (forced.allowedMetricKeys.join(",") !== "forcedCitationValidation" || !forced.forbiddenMetricKeys.includes("naturalCitationObservation")) blockers.push("forced_citation_lane_boundary_invalid");
  const branded = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.self_branded_perception;
  for (const key of ["visibility","ranking","sov"] as const) if (!branded.forbiddenMetricKeys.includes(key)) blockers.push(`self_branded_metric_boundary_missing:${key}`);
  if (!RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION) blockers.push("overlay_policy_version_missing");
  return { valid:blockers.length === 0, blockers:unique(blockers), warnings:unique(warnings), counts:{ blueprints:catalog.length, packs:new Set(catalog.map((item) => item.pack)).size, observationOverlays:overlay.length, coverageInventory } };
}
export function getRecoraMeasurementTopicBlueprintV3(blueprintKey: string): RecoraTopicBlueprintV3 | null {
  return RECORA_TOPIC_BLUEPRINT_CATALOG_V3.find((item) => item.blueprintKey === blueprintKey) ?? null;
}
