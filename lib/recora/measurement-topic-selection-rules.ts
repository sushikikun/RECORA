import {
  RECORA_CUSTOMER_ACTIONS,
  type RecoraCustomerAction,
  type RecoraGenerationCustomerSide,
  type RecoraGenerationStructureSignal
} from "./prompt-generation-input";
import {
  RECORA_PERSONA_SELECTION_RECIPES_V3
} from "./measurement-persona-selection-rules";
import type {
  RecoraTopicCoverageDimensionV3,
  RecoraTopicMeasurementLaneKeyV3
} from "./measurement-topic-contract";

export const RECORA_TOPIC_SELECTION_RECIPE_COUNT_V3 = 35 as const;
export const RECORA_TOPIC_SLOT_PRIMARY_CANDIDATE_LIMIT_V3 = 8 as const;
export const RECORA_TOPIC_SLOT_SUPPORTING_BLUEPRINT_LIMIT_V3 = 4 as const;
export const RECORA_TOPIC_SLOT_ALTERNATIVE_LIMIT_V3 = 8 as const;

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
  | { kind: "fixed_blueprint"; blueprintKey: string }
  | { kind: "primary_action_binding" }
  | { kind: "domain_offering_binding" };

export type RecoraTopicSlotChoiceV3 = {
  choiceKey: string;
  choiceRank: number;
  primaryAuthority: RecoraTopicSlotPrimaryAuthorityV3;
  supportingBlueprintKeys: readonly string[];
  allowedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  allowedPrimaryActions: readonly RecoraCustomerAction[] | null;
  primaryPersonaSortOrders: readonly RecoraTopicPersonaSortOrderV3[];
  supportingPersonaSortOrders: readonly RecoraTopicPersonaSortOrderV3[];
};

export type RecoraTopicRecipeSlotV3 = {
  coverage: RecoraTopicCoverageDimensionV3;
  choices: readonly RecoraTopicSlotChoiceV3[];
  alternativeChoices: readonly RecoraTopicSlotChoiceV3[];
  approvedFocusPrimaryBlueprintKeys: readonly string[];
  approvedFocusSupportingBlueprintKeys: readonly string[];
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

type BundleSeedV3 = {
  primary: string;
  supporting?: readonly string[];
};

type SpecificT4SeedV3 = BundleSeedV3 & {
  allowedPrimaryActions: readonly RecoraCustomerAction[];
};

type RecipeSeedV3 = {
  key: RecoraTopicRecipeKeyV3;
  signal: RecoraGenerationStructureSignal | null;
  requiredMarketSides: readonly RecoraGenerationCustomerSide[];
  t1?: BundleSeedV3;
  t2?: BundleSeedV3;
  t3?: BundleSeedV3;
  t4?: SpecificT4SeedV3;
  t5?: BundleSeedV3;
  t6?: BundleSeedV3;
};

const P = "prospective_customer" as const;
const C = "current_customer" as const;
const U = "end_user_or_beneficiary" as const;
const Y = "payer_or_sponsor" as const;
const I = "influencer_or_referrer" as const;
const D = "demand_side_participant" as const;
const S = "supply_side_participant" as const;
const M = "partner_or_intermediary" as const;

const RECIPE_SEEDS_V3 = [
  { key: "standard_b2b", signal: "b2b_buying_group", requiredMarketSides: [P, U], t3: { primary: "b2b.business_case_roi" }, t5: { primary: "b2b.vendor_risk_continuity" } },
  { key: "standard_b2c", signal: null, requiredMarketSides: [P, Y, U, I], t3: { primary: "b2c.personal_goal_fit" }, t5: { primary: "b2c.social_proof_reviews" } },
  { key: "standard_both_b2b_first", signal: "b2b_buying_group", requiredMarketSides: [P, Y, U], t3: { primary: "both.audience_priority_alignment" }, t6: { primary: "both.support_delivery_difference" } },
  { key: "standard_both_b2c_first", signal: "b2b_buying_group", requiredMarketSides: [P, Y, U], t3: { primary: "both.audience_priority_alignment" }, t6: { primary: "both.support_delivery_difference" } },
  { key: "standard_both_balanced", signal: "b2b_buying_group", requiredMarketSides: [P, Y, U], t3: { primary: "both.offer_scope_difference" }, t6: { primary: "both.support_delivery_difference" } },
  { key: "enterprise_it_security", signal: "enterprise_it_security", requiredMarketSides: [P, U], t2: { primary: "common.feature_scope_comparison" }, t3: { primary: "b2b.business_case_roi" }, t5: { primary: "enterprise.privacy_data_protection", supporting: ["enterprise.compliance_audit", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "enterprise.security_architecture", supporting: ["enterprise.identity_access_management", "saas.integration_api", "saas.data_import_migration"] } },
  { key: "agency_delivery", signal: "agency_delivery", requiredMarketSides: [M, P], t3: { primary: "agency.client_use_case_fit" }, t5: { primary: "agency.responsibility_boundary", supporting: ["agency.evidence_reporting", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "agency.multi_client_operations", supporting: ["agency.delivery_handoff"] } },
  { key: "b2b2c_corporate_training", signal: "corporate_training", requiredMarketSides: [Y, U], t3: { primary: "b2b2c.beneficiary_experience_fit", supporting: ["b2b2c.sponsor_business_case"] }, t5: { primary: "b2b2c.data_privacy_responsibility", supporting: ["b2b2c.outcome_accountability", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "b2b2c.client_operator_workflow" } },
  { key: "commerce_gift", signal: "commerce_gift", requiredMarketSides: [Y, U], t1: { primary: "common.candidate_product_discovery" }, t3: { primary: "commerce.product_need_fit" }, t5: { primary: "commerce.authorized_purchase_channel", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "commerce.gift_recipient_occasion_fit", supporting: ["commerce.materials_ingredients_specs"] } },
  { key: "commerce_subscription", signal: "commerce_subscription", requiredMarketSides: [P, C], t1: { primary: "common.candidate_product_discovery" }, t3: { primary: "commerce.product_need_fit" }, t5: { primary: "commerce.authorized_purchase_channel", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "subscription.ongoing_value", supporting: ["subscription.renewal_conditions", "subscription.pause_cancellation"] } },
  { key: "commerce_single_purchase", signal: "commerce_single_purchase", requiredMarketSides: [P, U], t1: { primary: "common.candidate_product_discovery" }, t3: { primary: "commerce.product_need_fit" }, t5: { primary: "commerce.authorized_purchase_channel", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "commerce.materials_ingredients_specs", supporting: ["commerce.delivery_fulfillment", "commerce.returns_exchange"] } },
  { key: "urgent_home_service", signal: "urgent_service", requiredMarketSides: [P, Y], t1: { primary: "urgent.response_time_availability" }, t3: { primary: "service.scope_fit" }, t4: { primary: "urgent.emergency_price_transparency", allowedPrimaryActions: ["request_quote", "inquiry"] }, t5: { primary: "urgent.qualification_safety", supporting: ["urgent.post_service_warranty", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "urgent.service_area_access" } },
  { key: "adult_healthcare", signal: "adult_healthcare", requiredMarketSides: [P, U], t2: { primary: "healthcare.continuation_referral_alternative" }, t3: { primary: "healthcare.care_need_scope" }, t4: { primary: "healthcare.consultation_booking_flow", allowedPrimaryActions: ["reservation", "consultation"] }, t5: { primary: "healthcare.treatment_risk_explanation", supporting: ["healthcare.official_medical_information", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "healthcare.provider_qualification_specialty" } },
  { key: "care_welfare", signal: "care_welfare", requiredMarketSides: [U, Y], t1: { primary: "care.care_manager_referral" }, t3: { primary: "care.recipient_daily_life_fit", supporting: ["care.family_coordination"] }, t4: { primary: "care.service_start_assessment", allowedPrimaryActions: ["consultation", "application"] }, t5: { primary: "common.official_information", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "care.support_content_staff", supporting: ["care.continuation_change_exit"] } },
  { key: "child_education", signal: "child_education", requiredMarketSides: [U, Y], t3: { primary: "education.course_goal_fit", supporting: ["family.dependent_recipient_fit"] }, t4: { primary: "education.trial_enrollment_flow", allowedPrimaryActions: ["application", "demo_or_trial"] }, t5: { primary: "education.teacher_quality_fit", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "education.curriculum_learning_method", supporting: ["education.schedule_location_online"] } },
  { key: "adult_education", signal: "adult_education", requiredMarketSides: [P, U], t3: { primary: "education.course_goal_fit" }, t4: { primary: "education.trial_enrollment_flow", allowedPrimaryActions: ["application", "demo_or_trial"] }, t5: { primary: "education.teacher_quality_fit", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "education.curriculum_learning_method", supporting: ["education.continuation_progress_support"] } },
  { key: "multi_location_consumer_brand", signal: "multi_location_consumer_brand", requiredMarketSides: [P, U], t1: { primary: "multilocation.location_discovery" }, t2: { primary: "multilocation.location_difference" }, t3: { primary: "b2c.personal_goal_fit" }, t4: { primary: "multilocation.availability_inventory", allowedPrimaryActions: ["reservation", "visit", "purchase"] }, t5: { primary: "multilocation.local_reputation", supporting: ["multilocation.brand_consistency", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "multilocation.cross_location_booking_use" } },
  { key: "multi_location_customer_organization", signal: "multi_location_customer_organization", requiredMarketSides: [P, U], t3: { primary: "b2b.business_case_roi" }, t5: { primary: "b2b.vendor_risk_continuity", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "b2b.implementation_readiness", supporting: ["b2b.adoption_change_management"] } },
  { key: "franchise_consumer_brand", signal: "franchise_consumer_brand", requiredMarketSides: [P, U], t1: { primary: "location.nearby_facility_discovery" }, t2: { primary: "brand.brand_differentiation" }, t3: { primary: "b2c.personal_goal_fit" }, t5: { primary: "multilocation.local_reputation", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "location.access_transport_parking", supporting: ["location.facility_equipment_environment"] } },
  { key: "franchise_recruitment", signal: "franchise_recruitment", requiredMarketSides: [P, U], t1: { primary: "company.company_candidate_discovery" }, t3: { primary: "franchise.investment_fit", supporting: ["franchise.unit_economics"] }, t5: { primary: "franchise.hq_support", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "franchise.territory_market", supporting: ["franchise.operating_standards"] } },
  { key: "marketplace_brand", signal: "marketplace_brand", requiredMarketSides: [D, S], t1: { primary: "marketplace.demand_listing_discovery" }, t2: { primary: "marketplace.demand_listing_comparison" }, t3: { primary: "marketplace.demand_fulfillment_quality", supporting: ["marketplace.supply_participation_fit"] }, t4: { primary: "marketplace.demand_total_price_fees", supporting: ["marketplace.supply_onboarding_requirements"], allowedPrimaryActions: ["purchase", "reservation", "application"] }, t5: { primary: "marketplace.demand_transaction_trust", supporting: ["marketplace.supply_rules_compliance", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "marketplace.supply_listing_inventory_operations" } },
  { key: "marketplace_operator_customer", signal: "marketplace_operator_customer", requiredMarketSides: [P], t3: { primary: "marketplace.operator_monetization_model" }, t5: { primary: "marketplace.operator_trust_safety", supporting: ["marketplace.operator_regulatory_data_governance", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "marketplace.operator_platform_operations", supporting: ["marketplace.operator_liquidity_balance", "marketplace.operator_dispute_operations"] } },
  { key: "recruiting_employer_saas", signal: "recruiting_employer_saas", requiredMarketSides: [P, U], t2: { primary: "common.feature_scope_comparison" }, t3: { primary: "recruiting.hiring_workflow_fit" }, t5: { primary: "recruiting.personal_data_privacy", supporting: ["recruiting.legal_fairness_compliance", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "recruiting.hr_system_integration", supporting: ["recruiting.recruiter_hiring_manager_operations", "recruiting.candidate_experience"] } },
  { key: "real_estate_rental", signal: "real_estate_rental", requiredMarketSides: [P, U], t1: { primary: "realestate.rental_area_property_discovery" }, t3: { primary: "realestate.rental_living_fit" }, t4: { primary: "realestate.rental_application_screening", allowedPrimaryActions: ["inquiry", "application"] }, t5: { primary: "realestate.rental_contract_important_terms", supporting: ["realestate.professional_license_disclosure", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "realestate.rental_property_area_specifics" } },
  { key: "real_estate_purchase_residential", signal: "real_estate_purchase_residential", requiredMarketSides: [P, U], t1: { primary: "realestate.purchase_area_property_discovery" }, t3: { primary: "realestate.purchase_household_future_fit", supporting: ["realestate.purchase_budget_mortgage"] }, t5: { primary: "realestate.purchase_contract_disclosure", supporting: ["realestate.purchase_property_condition", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "realestate.purchase_due_diligence_specifics" } },
  { key: "real_estate_sale", signal: "real_estate_sale", requiredMarketSides: [P, I], t1: { primary: "company.company_candidate_discovery" }, t2: { primary: "realestate.sale_broker_comparison" }, t3: { primary: "common.use_case_fit" }, t4: { primary: "realestate.sale_fee_tax_timeline", supporting: ["realestate.sale_contract_strategy"], allowedPrimaryActions: ["inquiry", "consultation", "contract"] }, t5: { primary: "realestate.professional_license_disclosure", supporting: ["realestate.sale_coowner_inheritance", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "realestate.sale_marketing_transaction_process" } },
  { key: "insurance", signal: "insurance", requiredMarketSides: [P, Y], t1: { primary: "finance.need_product_discovery" }, t2: { primary: "finance.fee_risk_comparison" }, t3: { primary: "finance.suitability_risk_tolerance" }, t5: { primary: "finance.advisor_license_conflict", supporting: ["insurance.coverage_exclusions_claims", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "insurance.coverage_structure_fit" } },
  { key: "manufacturing_capex", signal: "manufacturing_capex", requiredMarketSides: [P, U], t1: { primary: "manufacturing.production_problem_solution" }, t2: { primary: "common.feature_scope_comparison" }, t3: { primary: "manufacturing.capex_total_cost" }, t4: { primary: "manufacturing.supplier_procurement", allowedPrimaryActions: ["request_quote", "contract"] }, t5: { primary: "manufacturing.quality_safety_compliance", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "manufacturing.technical_spec_performance", supporting: ["manufacturing.operator_maintenance"] } },
  { key: "logistics_shipper_buying", signal: "logistics_shipper_buying", requiredMarketSides: [P, U], t1: { primary: "logistics.operations_problem_solution" }, t2: { primary: "logistics.provider_3pl_comparison" }, t3: { primary: "common.use_case_fit" }, t4: { primary: "logistics.pricing_sla", allowedPrimaryActions: ["request_quote", "contract"] }, t5: { primary: "logistics.continuity_claims_exceptions", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "logistics.warehouse_dispatch_operations", supporting: ["logistics.tracking_integration_data"] } },
  { key: "group_or_business_travel", signal: "group_or_business_travel", requiredMarketSides: [P, U], t1: { primary: "travel.destination_accommodation_discovery" }, t3: { primary: "common.target_user_fit" }, t4: { primary: "travel.booking_price_change_cancellation", allowedPrimaryActions: ["reservation", "contract"] }, t5: { primary: "travel.accessibility_safety_documents", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "travel.group_business_requirements" } },
  { key: "individual_travel", signal: "individual_travel", requiredMarketSides: [P, U], t1: { primary: "travel.destination_accommodation_discovery" }, t3: { primary: "common.use_case_fit" }, t4: { primary: "travel.booking_price_change_cancellation", allowedPrimaryActions: ["reservation"] }, t5: { primary: "travel.accessibility_safety_documents", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "travel.itinerary_experience_fit" } },
  { key: "public_nonprofit_customer", signal: "public_nonprofit_customer", requiredMarketSides: [P, Y], t3: { primary: "public.program_service_eligibility" }, t4: { primary: "public.procurement_requirements", allowedPrimaryActions: ["request_quote", "application", "contract"] }, t5: { primary: "public.accountability_disclosure", supporting: ["public.beneficiary_outcome_evidence", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "public.accessibility_inclusion" } },
  { key: "media_brand", signal: "media_brand", requiredMarketSides: [U, Y, M], t1: { primary: "media.audience_content_discovery" }, t2: { primary: "media.agency_media_comparison" }, t3: { primary: "media.paid_subscription_value", supporting: ["media.advertiser_media_fit"] }, t4: { primary: "media.creator_contributor_terms", allowedPrimaryActions: ["content_subscription", "content_view", "contract"] }, t5: { primary: "media.brand_safety_measurement", supporting: ["publisher.content_authority_quality", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "media.audience_advertiser_creator_ecosystem" } },
  { key: "professional_service_b2b", signal: "professional_service_b2b", requiredMarketSides: [P, U], t3: { primary: "professional_service.client_problem_scope_fit" }, t4: { primary: "professional_service.engagement_process", allowedPrimaryActions: ["consultation", "inquiry", "contract"] }, t5: { primary: "professional_service.case_track_record", supporting: ["professional.credentials_registration", "diagnostic.subject_reputation_sentiment"] }, t6: { primary: "professional_service.collaboration_document_workflow", supporting: ["professional_service.expertise_specialization"] } },
  { key: "local_facility", signal: "local_facility", requiredMarketSides: [P, U], t1: { primary: "location.nearby_facility_discovery" }, t2: { primary: "multilocation.location_difference" }, t3: { primary: "b2c.personal_goal_fit" }, t4: { primary: "location.booking_walkin_conditions", supporting: ["location.hours_availability"], allowedPrimaryActions: ["reservation", "visit"] }, t5: { primary: "location.staff_service_experience", supporting: ["diagnostic.subject_reputation_sentiment"] }, t6: { primary: "location.access_transport_parking", supporting: ["location.facility_equipment_environment"] } }
] as const satisfies readonly RecipeSeedV3[];

const ALL_PERSONAS = [1, 2, 3, 4, 5] as const;
const DISCOVERY_LANES = ["market_discovery", "criteria_explanation"] as const;
const COMPARISON_LANES = ["market_comparison", "criteria_explanation"] as const;
const FIT_LANES = ["criteria_explanation", "market_comparison", "trust_risk_diagnostic"] as const;
const ACTION_LANES = ["action_readiness", "criteria_explanation", "trust_risk_diagnostic"] as const;
const TRUST_LANES = ["trust_risk_diagnostic", "self_branded_perception", "forced_citation_validation"] as const;
const SERVICE_LANES = ["criteria_explanation", "action_readiness", "trust_risk_diagnostic", "market_comparison", "market_discovery"] as const;

function fixedChoice(input: {
  key: string;
  rank: number;
  bundle?: BundleSeedV3;
  allowedLanes: readonly RecoraTopicMeasurementLaneKeyV3[];
  allowedPrimaryActions?: readonly RecoraCustomerAction[] | null;
  primaryPersonas: readonly RecoraTopicPersonaSortOrderV3[];
}): RecoraTopicSlotChoiceV3 {
  return {
    choiceKey: input.key,
    choiceRank: input.rank,
    primaryAuthority: {
      kind: "fixed_blueprint",
      blueprintKey: input.bundle?.primary ?? input.key
    },
    supportingBlueprintKeys: input.bundle?.supporting ?? [],
    allowedLaneKeys: input.allowedLanes,
    allowedPrimaryActions: input.allowedPrimaryActions ?? null,
    primaryPersonaSortOrders: input.primaryPersonas,
    supportingPersonaSortOrders: ALL_PERSONAS
  };
}

function authorityChoice(input: {
  key: string;
  rank: number;
  kind: "primary_action_binding" | "domain_offering_binding";
  allowedLanes: readonly RecoraTopicMeasurementLaneKeyV3[];
  primaryPersonas: readonly RecoraTopicPersonaSortOrderV3[];
}): RecoraTopicSlotChoiceV3 {
  return {
    choiceKey: input.key,
    choiceRank: input.rank,
    primaryAuthority: { kind: input.kind },
    supportingBlueprintKeys: [],
    allowedLaneKeys: input.allowedLanes,
    allowedPrimaryActions: null,
    primaryPersonaSortOrders: input.primaryPersonas,
    supportingPersonaSortOrders: ALL_PERSONAS
  };
}

function uniqueChoices(
  choices: readonly RecoraTopicSlotChoiceV3[]
): readonly RecoraTopicSlotChoiceV3[] {
  const byIdentity = new Map<string, RecoraTopicSlotChoiceV3>();
  for (const item of choices) {
    const authority =
      item.primaryAuthority.kind === "fixed_blueprint"
        ? item.primaryAuthority.blueprintKey
        : item.primaryAuthority.kind;
    byIdentity.set(`${authority}|${item.choiceRank}`, item);
  }
  return [...byIdentity.values()].sort((left, right) => {
    if (left.choiceRank !== right.choiceRank) {
      return left.choiceRank - right.choiceRank;
    }
    return left.choiceKey < right.choiceKey ? -1 : left.choiceKey > right.choiceKey ? 1 : 0;
  });
}

function recipeSlot(input: RecoraTopicRecipeSlotV3): RecoraTopicRecipeSlotV3 {
  return input;
}

function materializeRecipe(seed: RecipeSeedV3): RecoraTopicSelectionRecipeV3 {
  const t1Specific = seed.t1 ?? { primary: "common.candidate_provider_discovery" };
  const t2Specific = seed.t2 ?? { primary: "common.direct_candidate_comparison" };
  const t3Specific = seed.t3 ?? { primary: "common.use_case_fit" };
  const t5Specific = seed.t5 ?? { primary: "common.reviews_reputation", supporting: ["diagnostic.subject_reputation_sentiment"] };

  const t1Choices = uniqueChoices([
    fixedChoice({ key: `recipe.${seed.key}.T1.primary`, rank: 10, bundle: t1Specific, allowedLanes: DISCOVERY_LANES, primaryPersonas: [1, 2] }),
    fixedChoice({ key: "common.candidate_provider_discovery", rank: 20, allowedLanes: DISCOVERY_LANES, primaryPersonas: [1, 2] }),
    fixedChoice({ key: "common.solution_category_discovery", rank: 30, allowedLanes: DISCOVERY_LANES, primaryPersonas: [1, 2] })
  ]);
  const t2Choices = uniqueChoices([
    fixedChoice({ key: `recipe.${seed.key}.T2.primary`, rank: 10, bundle: t2Specific, allowedLanes: COMPARISON_LANES, primaryPersonas: [2, 1] }),
    fixedChoice({ key: "common.direct_candidate_comparison", rank: 20, allowedLanes: COMPARISON_LANES, primaryPersonas: [2, 1] }),
    fixedChoice({ key: "common.comparison_axis_explanation", rank: 30, allowedLanes: COMPARISON_LANES, primaryPersonas: [2, 1] })
  ]);
  const t3Choices = uniqueChoices([
    fixedChoice({ key: `recipe.${seed.key}.T3.primary`, rank: 10, bundle: t3Specific, allowedLanes: FIT_LANES, primaryPersonas: [4, 2, 1] }),
    fixedChoice({ key: "common.use_case_fit", rank: 20, allowedLanes: FIT_LANES, primaryPersonas: [4, 2, 1] }),
    fixedChoice({ key: "common.target_user_fit", rank: 30, allowedLanes: FIT_LANES, primaryPersonas: [4, 1, 2] })
  ]);
  const t4Choices = uniqueChoices([
    ...(seed.t4
      ? [fixedChoice({ key: `recipe.${seed.key}.T4.primary`, rank: 5, bundle: seed.t4, allowedLanes: ACTION_LANES, allowedPrimaryActions: seed.t4.allowedPrimaryActions, primaryPersonas: [3, 1, 2] })]
      : []),
    authorityChoice({ key: "primary_action_binding", rank: 10, kind: "primary_action_binding", allowedLanes: ACTION_LANES, primaryPersonas: [3, 1, 2] })
  ]);
  const t5Choices = uniqueChoices([
    fixedChoice({ key: `recipe.${seed.key}.T5.primary`, rank: 10, bundle: t5Specific, allowedLanes: TRUST_LANES, primaryPersonas: [5, 2, 3] }),
    fixedChoice({ key: "common.reviews_reputation", rank: 20, bundle: { primary: "common.reviews_reputation", supporting: ["diagnostic.subject_reputation_sentiment"] }, allowedLanes: TRUST_LANES, primaryPersonas: [5, 2, 3] }),
    fixedChoice({ key: "common.official_information", rank: 30, bundle: { primary: "common.official_information", supporting: ["diagnostic.subject_reputation_sentiment"] }, allowedLanes: TRUST_LANES, primaryPersonas: [5, 2, 3] })
  ]);
  const t6Choices = uniqueChoices([
    ...(seed.t6
      ? [fixedChoice({ key: `recipe.${seed.key}.T6.primary`, rank: 10, bundle: seed.t6, allowedLanes: SERVICE_LANES, primaryPersonas: [4, 5, 2] })]
      : [authorityChoice({ key: "domain_offering_binding", rank: 10, kind: "domain_offering_binding", allowedLanes: SERVICE_LANES, primaryPersonas: [4, 5, 2] })]),
    authorityChoice({ key: "domain_offering_binding.fallback", rank: 20, kind: "domain_offering_binding", allowedLanes: SERVICE_LANES, primaryPersonas: [4, 5, 2] }),
    fixedChoice({ key: "service.process_workflow", rank: 30, allowedLanes: SERVICE_LANES, primaryPersonas: [4, 5, 2] })
  ]);

  return {
    recipeKey: seed.key,
    personaRecipeKey: seed.key,
    structureSignal: seed.signal,
    slots: [
      recipeSlot({ coverage: "T1", choices: t1Choices, alternativeChoices: t1Choices.slice(1), approvedFocusPrimaryBlueprintKeys: ["location.nearby_facility_discovery"], approvedFocusSupportingBlueprintKeys: [] }),
      recipeSlot({ coverage: "T2", choices: t2Choices, alternativeChoices: t2Choices.slice(1), approvedFocusPrimaryBlueprintKeys: ["common.price_value_comparison"], approvedFocusSupportingBlueprintKeys: [] }),
      recipeSlot({ coverage: "T3", choices: t3Choices, alternativeChoices: t3Choices.slice(1), approvedFocusPrimaryBlueprintKeys: [], approvedFocusSupportingBlueprintKeys: [] }),
      recipeSlot({ coverage: "T4", choices: t4Choices, alternativeChoices: [], approvedFocusPrimaryBlueprintKeys: [], approvedFocusSupportingBlueprintKeys: [] }),
      recipeSlot({ coverage: "T5", choices: t5Choices, alternativeChoices: t5Choices.slice(1), approvedFocusPrimaryBlueprintKeys: ["common.reviews_reputation", "common.price_fee_clarity", "enterprise.privacy_data_protection"], approvedFocusSupportingBlueprintKeys: ["diagnostic.forced_citation_validation", "diagnostic.source_quality_gap"] }),
      recipeSlot({ coverage: "T6", choices: t6Choices, alternativeChoices: t6Choices.slice(1), approvedFocusPrimaryBlueprintKeys: ["enterprise.security_architecture", "saas.integration_api", "location.access_transport_parking"], approvedFocusSupportingBlueprintKeys: [] })
    ],
    requiredMarketSides: seed.requiredMarketSides
  };
}

export const RECORA_TOPIC_SELECTION_RECIPES_V3:
  readonly RecoraTopicSelectionRecipeV3[] = RECIPE_SEEDS_V3.map(materializeRecipe);

export function getRecoraTopicSelectionRecipeV3(
  personaRecipeKey: string | null
): RecoraTopicSelectionRecipeV3 | null {
  if (!personaRecipeKey) return null;
  return RECORA_TOPIC_SELECTION_RECIPES_V3.find(
    (item) => item.personaRecipeKey === personaRecipeKey
  ) ?? null;
}

export function validateRecoraTopicSelectionRecipesV3(
  recipes: readonly RecoraTopicSelectionRecipeV3[] = RECORA_TOPIC_SELECTION_RECIPES_V3
): {
  valid: boolean;
  blockers: readonly string[];
  counts: { recipes: number };
} {
  const blockers: string[] = [];
  const personaKeys = RECORA_PERSONA_SELECTION_RECIPES_V3
    .map((item) => item.recipeKey)
    .sort();
  const topicKeys = recipes.map((item) => item.personaRecipeKey).sort();

  if (recipes.length !== RECORA_TOPIC_SELECTION_RECIPE_COUNT_V3) {
    blockers.push("topic_recipe_count_mismatch");
  }
  if (new Set(topicKeys).size !== topicKeys.length) {
    blockers.push("topic_recipe_mapping_duplicate");
  }
  if (personaKeys.join("|") !== topicKeys.join("|")) {
    blockers.push("topic_recipe_mapping_incomplete");
  }

  for (const recipe of recipes) {
    if (recipe.slots.map((item) => item.coverage).join(",") !== "T1,T2,T3,T4,T5,T6") {
      blockers.push(`topic_recipe_coverage_invalid:${recipe.recipeKey}`);
    }
    for (const slotItem of recipe.slots) {
      if (slotItem.choices.length === 0 || slotItem.choices.length > RECORA_TOPIC_SLOT_PRIMARY_CANDIDATE_LIMIT_V3) {
        blockers.push(`topic_recipe_candidate_limit:${recipe.recipeKey}:${slotItem.coverage}`);
      }
      if (slotItem.alternativeChoices.length > RECORA_TOPIC_SLOT_ALTERNATIVE_LIMIT_V3) {
        blockers.push(`topic_recipe_alternative_limit:${recipe.recipeKey}:${slotItem.coverage}`);
      }
      for (const item of [...slotItem.choices, ...slotItem.alternativeChoices]) {
        if (item.supportingBlueprintKeys.length > RECORA_TOPIC_SLOT_SUPPORTING_BLUEPRINT_LIMIT_V3) {
          blockers.push(`topic_recipe_supporting_limit:${recipe.recipeKey}:${slotItem.coverage}:${item.choiceKey}`);
        }
        if (item.primaryPersonaSortOrders.length === 0) {
          blockers.push(`topic_recipe_primary_selector_empty:${recipe.recipeKey}:${slotItem.coverage}:${item.choiceKey}`);
        }
        if (item.supportingPersonaSortOrders.length === 0) {
          blockers.push(`topic_recipe_supporting_selector_empty:${recipe.recipeKey}:${slotItem.coverage}:${item.choiceKey}`);
        }
        if (item.allowedPrimaryActions && item.allowedPrimaryActions.some((action) => !RECORA_CUSTOMER_ACTIONS.includes(action))) {
          blockers.push(`topic_recipe_action_invalid:${recipe.recipeKey}:${slotItem.coverage}:${item.choiceKey}`);
        }
      }
      const rankIdentity = slotItem.choices.map((item) => `${item.choiceRank}:${item.choiceKey}`);
      if (new Set(rankIdentity).size !== rankIdentity.length) {
        blockers.push(`topic_recipe_choice_duplicate:${recipe.recipeKey}:${slotItem.coverage}`);
      }
    }
  }

  return {
    valid: blockers.length === 0,
    blockers,
    counts: { recipes: recipes.length }
  };
}
