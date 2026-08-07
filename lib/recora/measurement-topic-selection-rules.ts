import type {
  RecoraGenerationCustomerSide,
  RecoraGenerationStructureSignal
} from "./prompt-generation-input";
import type {
  RecoraTopicCoverageDimensionV3,
  RecoraTopicMeasurementLaneKeyV3,
  RecoraTopicPackKeyV3
} from "./measurement-topic-contract";

export const RECORA_TOPIC_SELECTION_RECIPE_COUNT_V3 = 35 as const;

export const RECORA_TOPIC_RECIPE_KEYS_V3 = [
  "standard_b2b",
  "standard_b2c",
  "standard_both_b2b_first",
  "standard_both_b2c_first",
  "standard_both_balanced",
  "enterprise_it_security",
  "agency_delivery",
  "b2b2c_corporate_training",
  "commerce_gift",
  "commerce_subscription",
  "commerce_single_purchase",
  "urgent_home_service",
  "adult_healthcare",
  "care_welfare",
  "child_education",
  "adult_education",
  "multi_location_consumer_brand",
  "multi_location_customer_organization",
  "franchise_consumer_brand",
  "franchise_recruitment",
  "marketplace_brand",
  "marketplace_operator_customer",
  "recruiting_employer_saas",
  "real_estate_rental",
  "real_estate_purchase_residential",
  "real_estate_sale",
  "insurance",
  "manufacturing_capex",
  "logistics_shipper_buying",
  "group_or_business_travel",
  "individual_travel",
  "public_nonprofit_customer",
  "media_brand",
  "professional_service_b2b",
  "local_facility"
] as const;

export type RecoraTopicRecipeKeyV3 =
  typeof RECORA_TOPIC_RECIPE_KEYS_V3[number];
export type RecoraTopicPersonaSortOrderV3 = 1 | 2 | 3 | 4 | 5;

export type RecoraTopicSlotPrimaryAuthorityV3 =
  | {
      kind: "fixed_blueprint";
      blueprintKey: string;
      fallbackBlueprintKeys: readonly string[];
      fallbackPacks: readonly RecoraTopicPackKeyV3[];
    }
  | {
      kind: "primary_action_binding";
      fallbackBlueprintKeys: readonly string[];
      fallbackPacks: readonly RecoraTopicPackKeyV3[];
    }
  | {
      kind: "domain_offering_binding";
      fallbackBlueprintKeys: readonly string[];
      fallbackPacks: readonly RecoraTopicPackKeyV3[];
    };

export type RecoraTopicRecipeSlotV3 = {
  coverage: RecoraTopicCoverageDimensionV3;
  primaryAuthority: RecoraTopicSlotPrimaryAuthorityV3;
  supportingBlueprintKeys: readonly string[];
  alternativeBlueprintKeys: readonly string[];
  allowedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  primaryPersonaSortOrders: readonly RecoraTopicPersonaSortOrderV3[];
  supportingPersonaSortOrders: readonly RecoraTopicPersonaSortOrderV3[];
};

export type RecoraTopicSelectionRecipeV3 = {
  recipeKey: RecoraTopicRecipeKeyV3;
  personaRecipeKey: RecoraTopicRecipeKeyV3;
  structureSignal: RecoraGenerationStructureSignal | null;
  slots: readonly [
    RecoraTopicRecipeSlotV3,
    RecoraTopicRecipeSlotV3,
    RecoraTopicRecipeSlotV3,
    RecoraTopicRecipeSlotV3,
    RecoraTopicRecipeSlotV3,
    RecoraTopicRecipeSlotV3
  ];
  requiredMarketSides: readonly RecoraGenerationCustomerSide[];
};

type RecipeSeedV3 = {
  key: RecoraTopicRecipeKeyV3;
  signal: RecoraGenerationStructureSignal | null;
  packs: readonly RecoraTopicPackKeyV3[];
  sides: readonly RecoraGenerationCustomerSide[];
  t6BlueprintKey: string | null;
};

const P = "prospective_customer" as const;
const U = "end_user_or_beneficiary" as const;
const Y = "payer_or_sponsor" as const;
const I = "influencer_or_referrer" as const;
const C = "current_customer" as const;
const D = "demand_side_participant" as const;
const S = "supply_side_participant" as const;
const M = "partner_or_intermediary" as const;

const RECIPE_SEEDS_V3 = [
  { key: "standard_b2b", signal: "b2b_buying_group", packs: ["b2b_buying"], sides: [P, U], t6BlueprintKey: null },
  { key: "standard_b2c", signal: null, packs: ["b2c_decision"], sides: [P, Y, U, I], t6BlueprintKey: null },
  { key: "standard_both_b2b_first", signal: "b2b_buying_group", packs: ["both_audience", "b2b_buying"], sides: [P, Y, U], t6BlueprintKey: null },
  { key: "standard_both_b2c_first", signal: "b2b_buying_group", packs: ["both_audience", "b2c_decision"], sides: [P, Y, U], t6BlueprintKey: null },
  { key: "standard_both_balanced", signal: "b2b_buying_group", packs: ["both_audience", "b2b_buying", "b2c_decision"], sides: [P, Y, U], t6BlueprintKey: null },
  { key: "enterprise_it_security", signal: "enterprise_it_security", packs: ["enterprise_it_security", "saas_software", "b2b_buying"], sides: [P, U], t6BlueprintKey: "enterprise.security_architecture" },
  { key: "agency_delivery", signal: "agency_delivery", packs: ["agency_delivery", "professional_service"], sides: [M, P], t6BlueprintKey: "managed_service.operating_model" },
  { key: "b2b2c_corporate_training", signal: "corporate_training", packs: ["b2b2c", "education_school"], sides: [Y, U], t6BlueprintKey: "managed_service.operating_model" },
  { key: "commerce_gift", signal: "commerce_gift", packs: ["commerce_product", "offering_product"], sides: [Y, U], t6BlueprintKey: "product.spec_quality" },
  { key: "commerce_subscription", signal: "commerce_subscription", packs: ["subscription_membership", "commerce_product"], sides: [P, C], t6BlueprintKey: "product.spec_quality" },
  { key: "commerce_single_purchase", signal: "commerce_single_purchase", packs: ["commerce_product", "offering_product"], sides: [P, U], t6BlueprintKey: "product.spec_quality" },
  { key: "urgent_home_service", signal: "urgent_service", packs: ["urgent_service", "construction_home_service"], sides: [P, Y], t6BlueprintKey: "service.process_workflow" },
  { key: "adult_healthcare", signal: "adult_healthcare", packs: ["healthcare_clinic", "professional_person"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "care_welfare", signal: "care_welfare", packs: ["care_welfare", "family_proxy"], sides: [U, Y], t6BlueprintKey: "service.process_workflow" },
  { key: "child_education", signal: "child_education", packs: ["education_school", "family_proxy"], sides: [U, Y], t6BlueprintKey: "service.process_workflow" },
  { key: "adult_education", signal: "adult_education", packs: ["education_school", "subscription_membership"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "multi_location_consumer_brand", signal: "multi_location_consumer_brand", packs: ["multi_location", "location_facility"], sides: [P, U], t6BlueprintKey: "location.access_transport_parking" },
  { key: "multi_location_customer_organization", signal: "multi_location_customer_organization", packs: ["multi_location", "b2b_buying"], sides: [P, U], t6BlueprintKey: "managed_service.operating_model" },
  { key: "franchise_consumer_brand", signal: "franchise_consumer_brand", packs: ["franchise", "location_facility"], sides: [P, U], t6BlueprintKey: "location.access_transport_parking" },
  { key: "franchise_recruitment", signal: "franchise_recruitment", packs: ["franchise", "b2b_buying"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "marketplace_brand", signal: "marketplace_brand", packs: ["marketplace_demand", "marketplace_supply"], sides: [D, S], t6BlueprintKey: null },
  { key: "marketplace_operator_customer", signal: "marketplace_operator_customer", packs: ["marketplace_operator", "enterprise_it_security"], sides: [P], t6BlueprintKey: "managed_service.operating_model" },
  { key: "recruiting_employer_saas", signal: "recruiting_employer_saas", packs: ["recruiting_hr", "saas_software"], sides: [P, U], t6BlueprintKey: "saas.feature_workflow_fit" },
  { key: "real_estate_rental", signal: "real_estate_rental", packs: ["real_estate", "location_facility"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "real_estate_purchase_residential", signal: "real_estate_purchase_residential", packs: ["real_estate", "finance_insurance"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "real_estate_sale", signal: "real_estate_sale", packs: ["real_estate", "professional_service"], sides: [P, I], t6BlueprintKey: "service.process_workflow" },
  { key: "insurance", signal: "insurance", packs: ["finance_insurance", "professional_person"], sides: [P, Y], t6BlueprintKey: "service.process_workflow" },
  { key: "manufacturing_capex", signal: "manufacturing_capex", packs: ["manufacturing_industrial", "manufacturer_channel"], sides: [P, U], t6BlueprintKey: "product.spec_quality" },
  { key: "logistics_shipper_buying", signal: "logistics_shipper_buying", packs: ["logistics_supply_chain", "b2b_buying"], sides: [P, U], t6BlueprintKey: "managed_service.operating_model" },
  { key: "group_or_business_travel", signal: "group_or_business_travel", packs: ["travel_hospitality", "b2b_buying"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "individual_travel", signal: "individual_travel", packs: ["travel_hospitality", "b2c_decision"], sides: [P, U], t6BlueprintKey: "service.process_workflow" },
  { key: "public_nonprofit_customer", signal: "public_nonprofit_customer", packs: ["public_nonprofit", "b2b_buying"], sides: [P, Y], t6BlueprintKey: "managed_service.operating_model" },
  { key: "media_brand", signal: "media_brand", packs: ["media_content_advertising", "publisher_content"], sides: [U, Y, M], t6BlueprintKey: "media.audience_advertiser_creator_ecosystem" },
  { key: "professional_service_b2b", signal: "professional_service_b2b", packs: ["professional_service", "professional_person"], sides: [P, U], t6BlueprintKey: "professional_service.expertise_specialization" },
  { key: "local_facility", signal: "local_facility", packs: ["location_facility", "b2c_decision"], sides: [P, U], t6BlueprintKey: "location.access_transport_parking" }
] as const satisfies readonly RecipeSeedV3[];

const ALL_PERSONAS = [1, 2, 3, 4, 5] as const;
const DISCOVERY_LANES = ["market_discovery"] as const;
const COMPARISON_LANES = [
  "market_comparison",
  "criteria_explanation"
] as const;
const CRITERIA_LANES = ["criteria_explanation", "market_comparison"] as const;
const ACTION_LANES = ["action_readiness"] as const;
const TRUST_LANES = [
  "trust_risk_diagnostic",
  "self_branded_perception",
  "forced_citation_validation"
] as const;
const SERVICE_LANES = [
  "criteria_explanation",
  "action_readiness",
  "trust_risk_diagnostic",
  "market_comparison",
  "market_discovery"
] as const;

function fixedAuthority(
  blueprintKey: string,
  fallbackBlueprintKeys: readonly string[],
  fallbackPacks: readonly RecoraTopicPackKeyV3[]
): RecoraTopicSlotPrimaryAuthorityV3 {
  return {
    kind: "fixed_blueprint",
    blueprintKey,
    fallbackBlueprintKeys,
    fallbackPacks
  };
}

function slot(input: RecoraTopicRecipeSlotV3): RecoraTopicRecipeSlotV3 {
  return input;
}

function materializeRecipe(seed: RecipeSeedV3): RecoraTopicSelectionRecipeV3 {
  const t6Authority: RecoraTopicSlotPrimaryAuthorityV3 =
    seed.t6BlueprintKey === null
      ? {
          kind: "domain_offering_binding",
          fallbackBlueprintKeys: ["service.process_workflow"],
          fallbackPacks: seed.packs
        }
      : fixedAuthority(
          seed.t6BlueprintKey,
          ["service.process_workflow"],
          seed.packs
        );
  return {
    recipeKey: seed.key,
    personaRecipeKey: seed.key,
    structureSignal: seed.signal,
    slots: [
      slot({
        coverage: "T1",
        primaryAuthority: fixedAuthority(
          "common.candidate_provider_discovery",
          ["common.solution_category_discovery"],
          ["common_discovery", ...seed.packs]
        ),
        supportingBlueprintKeys: [],
        alternativeBlueprintKeys: ["common.recommendation_shortlist"],
        allowedLaneKeys: DISCOVERY_LANES,
        primaryPersonaSortOrders: [1],
        supportingPersonaSortOrders: ALL_PERSONAS
      }),
      slot({
        coverage: "T2",
        primaryAuthority: fixedAuthority(
          "common.comparison_axis_explanation",
          ["common.alternative_method_comparison"],
          ["common_comparison", ...seed.packs]
        ),
        supportingBlueprintKeys: [],
        alternativeBlueprintKeys: ["common.substitute_category_comparison"],
        allowedLaneKeys: COMPARISON_LANES,
        primaryPersonaSortOrders: [2, 1],
        supportingPersonaSortOrders: ALL_PERSONAS
      }),
      slot({
        coverage: "T3",
        primaryAuthority: fixedAuthority(
          "common.use_case_fit",
          ["common.price_value_comparison"],
          ["common_fit_action", ...seed.packs]
        ),
        supportingBlueprintKeys: [],
        alternativeBlueprintKeys: ["common.price_value_comparison"],
        allowedLaneKeys: CRITERIA_LANES,
        primaryPersonaSortOrders: [4, 2, 1],
        supportingPersonaSortOrders: ALL_PERSONAS
      }),
      slot({
        coverage: "T4",
        primaryAuthority: {
          kind: "primary_action_binding",
          fallbackBlueprintKeys: [],
          fallbackPacks: ["common_fit_action", ...seed.packs]
        },
        supportingBlueprintKeys: [],
        alternativeBlueprintKeys: [],
        allowedLaneKeys: ACTION_LANES,
        primaryPersonaSortOrders: [3, 1, 2],
        supportingPersonaSortOrders: ALL_PERSONAS
      }),
      slot({
        coverage: "T5",
        primaryAuthority: fixedAuthority(
          "common.reviews_reputation",
          ["common.track_record_proof"],
          ["common_trust_continuation", ...seed.packs]
        ),
        supportingBlueprintKeys: ["diagnostic.subject_reputation_sentiment"],
        alternativeBlueprintKeys: [
          "common.track_record_proof",
          "common.qualification_credentials",
          "common.risk_cautions"
        ],
        allowedLaneKeys: TRUST_LANES,
        primaryPersonaSortOrders: [5, 2, 3],
        supportingPersonaSortOrders: ALL_PERSONAS
      }),
      slot({
        coverage: "T6",
        primaryAuthority: t6Authority,
        supportingBlueprintKeys: [],
        alternativeBlueprintKeys: [],
        allowedLaneKeys: SERVICE_LANES,
        primaryPersonaSortOrders: [4, 5, 2],
        supportingPersonaSortOrders: ALL_PERSONAS
      })
    ],
    requiredMarketSides: seed.sides
  };
}

export const RECORA_TOPIC_SELECTION_RECIPES_V3:
  readonly RecoraTopicSelectionRecipeV3[] = RECIPE_SEEDS_V3.map(
  materializeRecipe
);

export function getRecoraTopicSelectionRecipeV3(
  personaRecipeKey: string | null
): RecoraTopicSelectionRecipeV3 | null {
  if (!personaRecipeKey) return null;
  return (
    RECORA_TOPIC_SELECTION_RECIPES_V3.find(
      (item) => item.personaRecipeKey === personaRecipeKey
    ) ?? null
  );
}

export function validateRecoraTopicSelectionRecipesV3(): {
  valid: boolean;
  blockers: readonly string[];
  counts: { recipes: number };
} {
  const blockers: string[] = [];
  const keys = RECORA_TOPIC_SELECTION_RECIPES_V3.map(
    (item) => item.personaRecipeKey
  );
  if (
    RECORA_TOPIC_SELECTION_RECIPES_V3.length !==
    RECORA_TOPIC_SELECTION_RECIPE_COUNT_V3
  ) {
    blockers.push("topic_recipe_count_mismatch");
  }
  if (new Set(keys).size !== keys.length) {
    blockers.push("topic_recipe_key_duplicate");
  }
  for (const recipe of RECORA_TOPIC_SELECTION_RECIPES_V3) {
    if (
      recipe.slots.map((item) => item.coverage).join(",") !==
      "T1,T2,T3,T4,T5,T6"
    ) {
      blockers.push(`topic_recipe_coverage_invalid:${recipe.recipeKey}`);
    }
    if (
      recipe.slots.some(
        (item) =>
          item.primaryPersonaSortOrders.length === 0 ||
          item.supportingPersonaSortOrders.length === 0
      )
    ) {
      blockers.push(`topic_recipe_persona_selector_empty:${recipe.recipeKey}`);
    }
  }
  return {
    valid: blockers.length === 0,
    blockers,
    counts: { recipes: RECORA_TOPIC_SELECTION_RECIPES_V3.length }
  };
}
