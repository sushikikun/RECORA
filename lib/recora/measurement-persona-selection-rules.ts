import type { RecoraGenerationStructureSignal } from "./prompt-generation-input";
import type {
  RecoraPersonaSelectionRecipeEntryV3,
  RecoraPersonaSelectionRecipeV3
} from "./measurement-persona-contract";

function entry(
  primaryBlueprintKey: string,
  supportingBlueprintKeys: readonly string[] = [],
  modifierBindings: RecoraPersonaSelectionRecipeEntryV3["modifierBindings"] = []
): RecoraPersonaSelectionRecipeEntryV3 {
  return { primaryBlueprintKey, supportingBlueprintKeys, modifierBindings };
}

function recipe(input: RecoraPersonaSelectionRecipeV3) {
  return input;
}

const FIRST_TIME = {
  signal: "first_time_explorer",
  modifierBlueprintKey: "lifecycle.first_time_explorer"
} as const;
const ACTIVE = {
  signal: "active_user",
  modifierBlueprintKey: "lifecycle.active_user"
} as const;
const RENEWAL = {
  signal: "renewal_decider",
  modifierBlueprintKey: "lifecycle.renewal_decider"
} as const;
const CANCELLATION = {
  signal: "cancellation_decider",
  modifierBlueprintKey: "lifecycle.cancellation_decider"
} as const;
const SWITCHING = {
  signal: "switching_evaluator",
  modifierBlueprintKey: "lifecycle.switching_evaluator"
} as const;

export const RECORA_PERSONA_SELECTION_RECIPES_V3: readonly RecoraPersonaSelectionRecipeV3[] = [
  recipe({
    recipeKey: "enterprise_it_security",
    matchSignalsAll: ["enterprise_it_security"],
    selections: [
      entry("b2b.problem_owner", ["b2b.internal_champion"]),
      entry("enterprise.solution_architect_evaluator"),
      entry("enterprise.it_strategy_owner", ["b2b.economic_buyer"]),
      entry("enterprise.system_administrator"),
      entry("enterprise.security_reviewer", ["enterprise.vendor_risk_reviewer"])
    ],
    alternativeBlueprintKeys: [
      "b2b.procurement_ratifier",
      "b2b.legal_compliance_blocker",
      "b2b.technical_reviewer"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 10
  }),
  recipe({
    recipeKey: "agency_delivery",
    matchSignalsAll: ["agency_delivery"],
    selections: [
      entry("b2b.problem_owner", ["b2b.internal_champion"]),
      entry("b2b.solution_evaluator"),
      entry("agency.owner_buyer", ["b2b.economic_buyer"]),
      entry("agency.operator"),
      entry("agency.client_evaluator")
    ],
    alternativeBlueprintKeys: [
      "agency.client_decision_owner",
      "agency.external_advisor",
      "agency.implementation_partner"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C5"],
    requiredMarketSides: ["partner_or_intermediary", "prospective_customer"],
    priority: 20
  }),
  recipe({
    recipeKey: "b2b2c_corporate_training",
    matchSignalsAll: ["b2b2c", "corporate_training"],
    selections: [
      entry("b2b.problem_owner", ["b2b.internal_champion"]),
      entry("b2b.solution_evaluator"),
      entry("b2b2c.sponsor_decision_owner", ["b2b.economic_buyer"]),
      entry("b2b2c.end_beneficiary", ["education.active_learner"]),
      entry("b2b2c.outcome_accountability_owner", ["b2b2c.client_operator"])
    ],
    alternativeBlueprintKeys: [
      "education.course_evaluator",
      "education.teacher_school_recommender"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C5", "C6"],
    requiredMarketSides: ["payer_or_sponsor", "end_user_or_beneficiary"],
    priority: 30
  }),
  recipe({
    recipeKey: "commerce_gift",
    matchSignalsAll: ["commerce_gift"],
    selections: [
      entry("b2c.group_occasion_planner"),
      entry("commerce.product_comparator"),
      entry("commerce.gift_purchaser", ["b2c.payer"]),
      entry("commerce.product_recipient"),
      entry("b2c.recommender_influencer", ["family.co_decision_member"])
    ],
    alternativeBlueprintKeys: [
      "commerce.product_need_user",
      "b2c.alternate_payer"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C5", "C7"],
    requiredMarketSides: ["payer_or_sponsor", "end_user_or_beneficiary"],
    priority: 40
  }),
  recipe({
    recipeKey: "commerce_subscription",
    matchSignalsAll: ["commerce_subscription"],
    selections: [
      entry("commerce.product_need_user", [], [FIRST_TIME]),
      entry("commerce.product_comparator"),
      entry("subscription.acquisition_decider", ["commerce.purchase_owner", "b2c.payer"]),
      entry("commerce.product_recipient", [], [ACTIVE]),
      entry(
        "subscription.renewal_value_decider",
        ["subscription.churn_cancellation_decider"],
        [SWITCHING, RENEWAL, CANCELLATION]
      )
    ],
    alternativeBlueprintKeys: [
      "commerce.repeat_purchase_user",
      "subscription.active_member_user"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "current_customer"],
    priority: 50
  }),
  recipe({
    recipeKey: "commerce_single_purchase",
    matchSignalsAll: ["commerce_single_purchase"],
    selections: [
      entry("commerce.product_need_user", [], [FIRST_TIME]),
      entry("commerce.product_comparator"),
      entry("commerce.purchase_owner", ["b2c.payer"]),
      entry("commerce.product_recipient"),
      entry("commerce.repeat_purchase_user", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: [
      "b2c.recommender_influencer",
      "b2c.alternate_payer"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 60
  }),
  recipe({
    recipeKey: "urgent_home_service",
    matchSignalsAll: ["urgent_service"],
    selections: [
      entry("home_service.occupant_need_owner"),
      entry("urgent.rapid_comparator"),
      entry("urgent.booking_payment_decider", ["b2c.payer"]),
      entry("home_service.site_contact_recipient"),
      entry("urgent.property_owner_manager_proxy")
    ],
    alternativeBlueprintKeys: [
      "urgent.family_proxy_decider",
      "home_service.property_owner_need_owner",
      "home_service.emergency_decider"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C7"],
    requiredMarketSides: ["prospective_customer", "payer_or_sponsor"],
    priority: 70
  }),
  recipe({
    recipeKey: "adult_healthcare",
    matchSignalsAll: ["adult_healthcare"],
    selections: [
      entry("healthcare.patient_need_owner"),
      entry("healthcare.provider_evaluator"),
      entry("healthcare.booking_decider", ["b2c.payer"]),
      entry("healthcare.patient_recipient"),
      entry("b2c.actual_user", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: [
      "healthcare.referring_professional",
      "family.need_interpreter"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 80
  }),
  recipe({
    recipeKey: "care_welfare",
    matchSignalsAll: ["care_welfare"],
    selections: [
      entry("care.care_recipient"),
      entry("care.family_need_coordinator"),
      entry("care.service_start_decider", ["b2c.alternate_payer"]),
      entry("care.care_manager_referrer"),
      entry("family.caregiver_supporter", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: [
      "family.formal_proxy_decision_maker",
      "family.need_interpreter"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C5", "C7", "C8"],
    requiredMarketSides: ["end_user_or_beneficiary", "payer_or_sponsor"],
    priority: 90
  }),
  recipe({
    recipeKey: "child_education",
    matchSignalsAll: ["child_education"],
    selections: [
      entry("education.active_learner"),
      entry("family.need_interpreter"),
      entry("education.course_evaluator"),
      entry("family.guardian_decision_maker", ["education.enrollment_decider", "b2c.alternate_payer"]),
      entry("family.co_decision_member", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: [
      "education.teacher_school_recommender",
      "family.caregiver_supporter"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C7", "C8"],
    requiredMarketSides: ["end_user_or_beneficiary", "payer_or_sponsor"],
    priority: 100
  }),
  recipe({
    recipeKey: "adult_education",
    matchSignalsAll: ["adult_education"],
    selections: [
      entry("education.learner_need_owner", [], [FIRST_TIME]),
      entry("education.course_evaluator"),
      entry("education.enrollment_decider", ["b2c.payer"]),
      entry("education.active_learner"),
      entry(
        "subscription.renewal_value_decider",
        ["subscription.churn_cancellation_decider"],
        [SWITCHING, RENEWAL, CANCELLATION]
      )
    ],
    alternativeBlueprintKeys: [
      "education.teacher_school_recommender",
      "lifecycle.trial_user"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 110
  }),
  recipe({
    recipeKey: "multi_location_consumer_brand",
    matchSignalsAll: ["multi_location_consumer_brand"],
    selections: [
      entry("local.nearby_need_owner", [], [FIRST_TIME]),
      entry("local.provider_comparator"),
      entry("local.booking_decider", ["b2c.payer"]),
      entry("local.service_recipient"),
      entry("b2c.actual_user", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: [
      "b2c.group_occasion_planner",
      "b2c.recommender_influencer"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 120
  }),
  recipe({
    recipeKey: "multi_location_customer_organization",
    matchSignalsAll: ["multi_location_customer_organization"],
    selections: [
      entry("b2b.problem_owner", ["multilocation.hq_operations_owner"]),
      entry("b2b.solution_evaluator"),
      entry("multilocation.hq_strategy_owner", ["b2b.economic_buyer"]),
      entry("branch.local_operator"),
      entry("enterprise.security_reviewer", ["b2b.implementation_change_owner"])
    ],
    alternativeBlueprintKeys: [
      "multilocation.hq_procurement_owner",
      "branch.local_manager",
      "multilocation.hq_brand_reputation_owner"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 130
  }),
  recipe({
    recipeKey: "franchise_consumer_brand",
    matchSignalsAll: ["franchise_consumer_brand"],
    selections: [
      entry("local.nearby_need_owner", [], [FIRST_TIME]),
      entry("local.provider_comparator"),
      entry("local.booking_decider", ["b2c.payer"]),
      entry("local.service_recipient"),
      entry("b2c.actual_user", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: ["b2c.recommender_influencer"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 140
  }),
  recipe({
    recipeKey: "franchise_recruitment",
    matchSignalsAll: ["franchise_recruitment"],
    selections: [
      entry("b2b.problem_owner"),
      entry("b2b.solution_evaluator"),
      entry("franchise.franchisee_owner", ["b2b.economic_buyer"]),
      entry("franchise.location_operator"),
      entry("b2b.legal_compliance_blocker")
    ],
    alternativeBlueprintKeys: [
      "franchise.brand_compliance_reviewer",
      "b2b.procurement_ratifier"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 150
  }),
  recipe({
    recipeKey: "marketplace_brand",
    matchSignalsAll: ["marketplace_brand"],
    selections: [
      entry("marketplace.demand_need_owner"),
      entry("marketplace.demand_listing_comparator"),
      entry("marketplace.demand_transaction_decider", ["marketplace.demand_service_recipient"]),
      entry("marketplace.supply_business_owner", ["marketplace.supply_platform_evaluator"]),
      entry(
        "marketplace.supply_listing_operator",
        ["marketplace.supply_service_fulfiller"],
        [RENEWAL]
      )
    ],
    alternativeBlueprintKeys: [
      "marketplace.supply_onboarding_decider",
      "b2c.payer"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4"],
    requiredMarketSides: ["demand_side_participant", "supply_side_participant"],
    priority: 160
  }),
  recipe({
    recipeKey: "marketplace_operator_customer",
    matchSignalsAll: ["marketplace_operator_customer"],
    selections: [
      entry("b2b.problem_owner"),
      entry("enterprise.solution_architect_evaluator"),
      entry("marketplace.operator_business_owner", ["b2b.economic_buyer"]),
      entry("b2b.operations_owner", ["marketplace.support_dispute_owner"]),
      entry("marketplace.trust_safety_owner", ["enterprise.security_reviewer"])
    ],
    alternativeBlueprintKeys: [
      "marketplace.demand_growth_owner",
      "marketplace.supply_growth_owner",
      "b2b.procurement_ratifier"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer"],
    priority: 170
  }),
  recipe({
    recipeKey: "recruiting_employer_saas",
    matchSignalsAll: ["recruiting_employer_saas"],
    selections: [
      entry("recruiting.hiring_problem_owner", ["b2b.internal_champion"]),
      entry("recruiting.solution_evaluator"),
      entry("recruiting.adoption_decision_owner", ["b2b.economic_buyer"]),
      entry("recruiting.recruiter_operator"),
      entry("b2b.security_privacy_reviewer", ["b2b.legal_compliance_blocker"])
    ],
    alternativeBlueprintKeys: ["recruiting.hiring_manager_stakeholder"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 180
  }),
  recipe({
    recipeKey: "real_estate_rental",
    matchSignalsAll: ["real_estate_rental"],
    selections: [
      entry("rental.moving_need_owner", [], [FIRST_TIME]),
      entry("rental.property_agent_evaluator"),
      entry("rental.application_contract_decider"),
      entry("rental.actual_tenant"),
      entry("family.co_decision_member", ["b2c.alternate_payer"])
    ],
    alternativeBlueprintKeys: ["family.formal_proxy_decision_maker"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C7"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 190
  }),
  recipe({
    recipeKey: "real_estate_purchase_residential",
    matchSignalsAll: ["real_estate_purchase_residential"],
    selections: [
      entry("homepurchase.home_need_owner"),
      entry("homepurchase.property_evaluator"),
      entry("homepurchase.mortgage_contract_decider", ["b2c.payer"]),
      entry("homepurchase.household_occupant"),
      entry("family.co_decision_member")
    ],
    alternativeBlueprintKeys: ["b2c.alternate_payer"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C7"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 200
  }),
  recipe({
    recipeKey: "real_estate_sale",
    matchSignalsAll: ["real_estate_sale"],
    selections: [
      entry("homesale.disposition_need_owner"),
      entry("homesale.broker_valuation_evaluator"),
      entry("homesale.sale_contract_decider"),
      entry("homesale.estate_inheritance_stakeholder"),
      entry("agency.external_advisor")
    ],
    alternativeBlueprintKeys: [
      "homesale.co_owner_decision_member",
      "lifecycle.switching_evaluator"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C5", "C7"],
    requiredMarketSides: ["prospective_customer", "influencer_or_referrer"],
    priority: 210
  }),
  recipe({
    recipeKey: "insurance",
    matchSignalsAll: ["insurance"],
    selections: [
      entry("insurance.coverage_need_owner"),
      entry("b2c.option_evaluator"),
      entry("insurance.policyholder", ["b2c.payer"]),
      entry("insurance.insured_person"),
      entry("insurance.policyholder", [], [RENEWAL])
    ],
    alternativeBlueprintKeys: [
      "insurance.beneficiary",
      "insurance.claimant",
      "finance.guarantor_collateral_provider"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "payer_or_sponsor"],
    priority: 220
  }),
  recipe({
    recipeKey: "manufacturing_capex",
    matchSignalsAll: ["manufacturing_capex"],
    selections: [
      entry("manufacturing.plant_problem_owner"),
      entry("manufacturing.technical_spec_evaluator"),
      entry("manufacturing.capex_decision_owner"),
      entry("manufacturing.procurement_buyer"),
      entry("manufacturing.operator_maintenance_user")
    ],
    alternativeBlueprintKeys: [
      "b2b.security_privacy_reviewer",
      "b2b.legal_compliance_blocker"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 230
  }),
  recipe({
    recipeKey: "logistics_shipper_buying",
    matchSignalsAll: ["logistics_shipper_buying"],
    selections: [
      entry("logistics.operations_problem_owner"),
      entry("logistics.solution_evaluator"),
      entry("logistics.contract_sla_decider"),
      entry("logistics.dispatch_warehouse_operator"),
      entry("logistics.integration_data_reviewer")
    ],
    alternativeBlueprintKeys: ["b2b.procurement_ratifier"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 240
  }),
  recipe({
    recipeKey: "group_or_business_travel",
    matchSignalsAll: ["group_or_business_travel"],
    selections: [
      entry("travel.traveler_need_owner"),
      entry("b2c.option_evaluator"),
      entry("travel.booking_decider", ["b2b.economic_buyer"]),
      entry("travel.trip_recipient"),
      entry("travel.group_event_planner")
    ],
    alternativeBlueprintKeys: ["b2c.alternate_payer"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C5", "C7"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 250
  }),
  recipe({
    recipeKey: "individual_travel",
    matchSignalsAll: ["individual_travel"],
    selections: [
      entry("travel.traveler_need_owner", [], [FIRST_TIME]),
      entry("b2c.option_evaluator"),
      entry("travel.booking_decider", ["b2c.payer"]),
      entry("travel.trip_recipient"),
      entry("b2c.actual_user", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: ["b2c.group_occasion_planner"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 260
  }),
  recipe({
    recipeKey: "public_nonprofit_customer",
    matchSignalsAll: ["public_nonprofit_customer"],
    selections: [
      entry("b2b.problem_owner"),
      entry("b2b.solution_evaluator"),
      entry("public.procurement_owner", ["public.program_decision_owner", "b2b.economic_buyer"]),
      entry("public.frontline_operator"),
      entry("public.compliance_accessibility_reviewer")
    ],
    alternativeBlueprintKeys: [
      "public.citizen_service_beneficiary",
      "nonprofit.institutional_funder"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "payer_or_sponsor"],
    priority: 270
  }),
  recipe({
    recipeKey: "media_brand",
    matchSignalsAll: ["media_brand"],
    selections: [
      entry("media.reader_viewer"),
      entry("media.paid_subscriber", ["subscription.acquisition_decider"]),
      entry("media.advertiser_buyer"),
      entry("media.agency_media_planner"),
      entry("media.external_creator_contributor")
    ],
    alternativeBlueprintKeys: [
      "b2c.option_evaluator",
      "subscription.renewal_value_decider"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C5", "C8"],
    requiredMarketSides: [
      "end_user_or_beneficiary",
      "payer_or_sponsor",
      "partner_or_intermediary"
    ],
    priority: 280
  }),
  recipe({
    recipeKey: "professional_service_b2b",
    matchSignalsAll: ["professional_service_b2b"],
    selections: [
      entry("professional.client_problem_owner"),
      entry("professional.provider_evaluator"),
      entry("professional.engagement_decision_owner", ["b2b.economic_buyer"]),
      entry("professional.operational_liaison"),
      entry("professional.client_problem_owner", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: [
      "agency.external_advisor",
      "b2b.legal_compliance_blocker"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 290
  }),
  recipe({
    recipeKey: "local_facility",
    matchSignalsAll: ["local_facility"],
    forbiddenSignals: [
      "adult_healthcare",
      "child_education",
      "multi_location_consumer_brand",
      "franchise_consumer_brand"
    ],
    selections: [
      entry("local.nearby_need_owner", [], [FIRST_TIME]),
      entry("local.provider_comparator"),
      entry("local.booking_decider", ["b2c.payer"]),
      entry("local.service_recipient"),
      entry("b2c.actual_user", [], [SWITCHING])
    ],
    alternativeBlueprintKeys: ["b2c.recommender_influencer"],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C8"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 300
  }),
  recipe({
    recipeKey: "standard_b2b",
    matchSignalsAll: ["b2b_buying_group"],
    forbiddenSignals: [
      "enterprise_it_security",
      "agency_delivery",
      "b2b2c",
      "marketplace_operator_customer",
      "multi_location_customer_organization",
      "franchise_recruitment",
      "professional_service_b2b",
      "recruiting_employer_saas",
      "manufacturing_capex",
      "logistics_shipper_buying",
      "public_nonprofit_customer"
    ],
    selections: [
      entry("b2b.problem_owner", ["b2b.internal_champion"]),
      entry("b2b.solution_evaluator"),
      entry("b2b.strategic_decision_owner", ["b2b.economic_buyer"]),
      entry("b2b.end_user", ["b2b.operations_owner"]),
      entry("b2b.technical_reviewer", ["b2b.security_privacy_reviewer"])
    ],
    alternativeBlueprintKeys: [
      "b2b.procurement_ratifier",
      "b2b.legal_compliance_blocker",
      "b2b.implementation_change_owner"
    ],
    requiredCoverage: ["C1", "C2", "C3", "C4", "C6"],
    requiredMarketSides: ["prospective_customer", "end_user_or_beneficiary"],
    priority: 999
  })
] as const;

export function matchRecoraPersonaSelectionRecipesV3(
  signals: readonly RecoraGenerationStructureSignal[]
): readonly RecoraPersonaSelectionRecipeV3[] {
  const signalSet = new Set(signals);
  return RECORA_PERSONA_SELECTION_RECIPES_V3.filter((item) => {
    const all = (item.matchSignalsAll ?? []).every((signal) =>
      signalSet.has(signal)
    );
    const any =
      !item.matchSignalsAny?.length ||
      item.matchSignalsAny.some((signal) => signalSet.has(signal));
    const forbidden = (item.forbiddenSignals ?? []).some((signal) =>
      signalSet.has(signal)
    );
    return all && any && !forbidden;
  }).sort((left, right) => left.priority - right.priority);
}