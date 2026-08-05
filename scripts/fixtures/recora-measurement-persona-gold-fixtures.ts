import {
  RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
  RECORA_PROMPT_GENERATION_SEMANTICS_VERSION,
  type RecoraAudiencePriority,
  type RecoraAudienceScope,
  type RecoraGenerationCustomerSide,
  type RecoraGenerationStructureSignal,
  type RecoraLifecycleSignal,
  type RecoraPromptGenerationInputV1,
  type RecoraPromptGenerationNormalizationResultV1
} from "../../lib/recora/prompt-generation-input";
import { buildRecoraPromptGenerationIdentity } from "../../lib/recora/prompt-generation-input-normalizer";
import {
  RECORA_PERSONA_GOLD_FIXTURE_VERSION,
  type RecoraPersonaGoldFixtureV3,
  type RecoraPersonaGoldSelectionV3
} from "../../lib/recora/measurement-persona-contract";

const ALL_GENERAL_SIDES: readonly RecoraGenerationCustomerSide[] = [
  "prospective_customer",
  "current_customer",
  "end_user_or_beneficiary",
  "payer_or_sponsor",
  "influencer_or_referrer",
  "partner_or_intermediary"
];

function makeInput(input: {
  signals: readonly RecoraGenerationStructureSignal[];
  lifecycle?: readonly RecoraLifecycleSignal[];
  audienceScope?: RecoraAudienceScope;
  audiencePriority?: RecoraAudiencePriority | null;
  customerSides?: readonly RecoraGenerationCustomerSide[];
  subjectName?: string;
}): RecoraPromptGenerationInputV1 {
  const scope = input.audienceScope ?? "b2b";
  const base = {
    contractVersion: RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
    market: { country: "JP" as const, locale: "ja-JP" as const },
    subject: {
      operatorCompanyName: "株式会社サンプル",
      primary: {
        type: "service" as const,
        name: input.subjectName ?? "サンプルサービス",
        aliases: [] as readonly string[],
        officialUrl: "https://example.jp/service"
      },
      secondary: [] as const
    },
    audience: {
      scope,
      priority:
        input.audiencePriority ??
        (scope === "both" ? ("balanced" as const) : null)
    },
    business: {
      primaryDomain: "it_software" as const,
      secondaryDomains: [] as const,
      primaryOfferingModel: "saas_software" as const,
      secondaryOfferingModels: [] as const,
      commerceChannels: [] as const,
      commerceRoles: [] as const,
      summary: "Persona CompilerのGold Fixtureです。"
    },
    actions: {
      primary: "inquiry" as const,
      secondary: ["contract"] as const
    },
    delivery: {
      mode: "online" as const,
      serviceCoverage: "nationwide" as const,
      locationStructure: "none" as const,
      geographicBinding: "none" as const,
      serviceAreas: [] as const,
      locations: [] as const
    },
    trust: {
      decisionImpactFlags: [] as const,
      regulatoryFlags: [] as const,
      sensitiveContexts: [] as const,
      derived: {
        decisionImpactLevel: "standard" as const,
        derivedClass: "standard" as const,
        derivationVersion: "recora_trust_derivation_v1" as const,
        reasons: [] as const
      }
    },
    generationContext: {
      structureSignals: [...new Set(input.signals)].sort(),
      customerSides: [
        ...new Set(input.customerSides ?? ALL_GENERAL_SIDES)
      ].sort(),
      actorRelations: [] as const,
      lifecycleSignals: [...new Set(input.lifecycle ?? [])].sort(),
      focusThemes: ["比較"],
      diagnosisGoals: ["候補発見"]
    }
  } satisfies Omit<RecoraPromptGenerationInputV1, "generationIdentity">;

  return {
    ...base,
    generationIdentity: buildRecoraPromptGenerationIdentity(base)
  };
}

function s(
  primaryBlueprintKey: string,
  supportingBlueprintKeys: readonly string[] = [],
  modifierKeys: readonly string[] = []
): RecoraPersonaGoldSelectionV3 {
  return { primaryBlueprintKey, supportingBlueprintKeys, modifierKeys };
}

function readyFixture(input: {
  caseKey: string;
  recipeKey: string;
  signals: readonly RecoraGenerationStructureSignal[];
  selected: readonly RecoraPersonaGoldSelectionV3[];
  lifecycle?: readonly RecoraLifecycleSignal[];
  audienceScope?: RecoraAudienceScope;
  customerSides?: readonly RecoraGenerationCustomerSide[];
  alternatives?: readonly string[];
}): RecoraPersonaGoldFixtureV3 {
  return {
    fixtureVersion: RECORA_PERSONA_GOLD_FIXTURE_VERSION,
    caseKey: input.caseKey,
    expectedStatus: "ready",
    generationInput: makeInput({
      signals: input.signals,
      lifecycle: input.lifecycle,
      audienceScope: input.audienceScope,
      customerSides: input.customerSides,
      subjectName: input.caseKey
    }),
    expectedRecipeKey: input.recipeKey,
    expectedSelected: input.selected,
    expectedAlternativeKeys: input.alternatives ?? []
  };
}

const FIRST = ["first_time_explorer"] as const;
const SWITCH = ["switching_evaluator"] as const;
const SUBSCRIPTION_LIFECYCLE = [
  "first_time_explorer",
  "active_user",
  "renewal_decider",
  "cancellation_decider",
  "switching_evaluator"
] as const;

export const RECORA_PERSONA_READY_GOLD_FIXTURES_V3: readonly RecoraPersonaGoldFixtureV3[] = [
  readyFixture({
    caseKey: "R01_standard_b2b_saas",
    recipeKey: "standard_b2b",
    signals: ["b2b_buying_group"],
    selected: [
      s("b2b.problem_owner", ["b2b.internal_champion"]),
      s("b2b.solution_evaluator"),
      s("b2b.strategic_decision_owner", ["b2b.economic_buyer"]),
      s("b2b.end_user", ["b2b.operations_owner"]),
      s("b2b.technical_reviewer", ["b2b.security_privacy_reviewer"])
    ]
  }),
  readyFixture({
    caseKey: "R02_enterprise_it_security",
    recipeKey: "enterprise_it_security",
    signals: ["b2b_buying_group", "enterprise_it_security"],
    selected: [
      s("b2b.problem_owner", ["b2b.internal_champion"]),
      s("enterprise.solution_architect_evaluator"),
      s("enterprise.it_strategy_owner", ["b2b.economic_buyer"]),
      s("enterprise.system_administrator"),
      s("enterprise.security_reviewer", ["enterprise.vendor_risk_reviewer"])
    ]
  }),
  readyFixture({
    caseKey: "R03_b2b_managed_professional_service",
    recipeKey: "professional_service_b2b",
    signals: ["b2b_buying_group", "professional_service_b2b"],
    lifecycle: SWITCH,
    selected: [
      s("professional.client_problem_owner"),
      s("professional.provider_evaluator"),
      s("professional.engagement_decision_owner", ["b2b.economic_buyer"]),
      s("professional.operational_liaison"),
      s("professional.client_problem_owner", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R04_agency_delivery_tool",
    recipeKey: "agency_delivery",
    signals: ["b2b_buying_group", "agency_delivery"],
    selected: [
      s("b2b.problem_owner", ["b2b.internal_champion"]),
      s("b2b.solution_evaluator"),
      s("agency.owner_buyer", ["b2b.economic_buyer"]),
      s("agency.operator"),
      s("agency.client_evaluator")
    ]
  }),
  readyFixture({
    caseKey: "R05_b2b2c_corporate_training",
    recipeKey: "b2b2c_corporate_training",
    signals: ["b2b_buying_group", "b2b2c", "corporate_training"],
    selected: [
      s("b2b.problem_owner", ["b2b.internal_champion"]),
      s("b2b.solution_evaluator"),
      s("b2b2c.sponsor_decision_owner", ["b2b.economic_buyer"]),
      s("b2b2c.end_beneficiary", ["education.active_learner"]),
      s("b2b2c.outcome_accountability_owner", ["b2b2c.client_operator"])
    ]
  }),
  readyFixture({
    caseKey: "R06_d2c_single_purchase",
    recipeKey: "commerce_single_purchase",
    signals: ["commerce_single_purchase"],
    lifecycle: [...FIRST, ...SWITCH],
    audienceScope: "b2c",
    selected: [
      s("commerce.product_need_user", [], ["lifecycle.first_time_explorer"]),
      s("commerce.product_comparator"),
      s("commerce.purchase_owner", ["b2c.payer"]),
      s("commerce.product_recipient"),
      s("commerce.repeat_purchase_user", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R07_d2c_subscription",
    recipeKey: "commerce_subscription",
    signals: ["commerce_subscription"],
    lifecycle: SUBSCRIPTION_LIFECYCLE,
    audienceScope: "b2c",
    selected: [
      s("commerce.product_need_user", [], ["lifecycle.first_time_explorer"]),
      s("commerce.product_comparator"),
      s("subscription.acquisition_decider", ["commerce.purchase_owner", "b2c.payer"]),
      s("commerce.product_recipient", [], ["lifecycle.active_user"]),
      s("subscription.renewal_value_decider", ["subscription.churn_cancellation_decider"], ["lifecycle.cancellation_decider", "lifecycle.renewal_decider", "lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R08_gift_ecommerce",
    recipeKey: "commerce_gift",
    signals: ["commerce_gift"],
    audienceScope: "b2c",
    selected: [
      s("b2c.group_occasion_planner"),
      s("commerce.product_comparator"),
      s("commerce.gift_purchaser", ["b2c.payer"]),
      s("commerce.product_recipient"),
      s("b2c.recommender_influencer", ["family.co_decision_member"])
    ]
  }),
  readyFixture({
    caseKey: "R09_local_facility",
    recipeKey: "local_facility",
    signals: ["local_facility"],
    lifecycle: [...FIRST, ...SWITCH],
    audienceScope: "b2c",
    selected: [
      s("local.nearby_need_owner", [], ["lifecycle.first_time_explorer"]),
      s("local.provider_comparator"),
      s("local.booking_decider", ["b2c.payer"]),
      s("local.service_recipient"),
      s("b2c.actual_user", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R10_urgent_home_service",
    recipeKey: "urgent_home_service",
    signals: ["urgent_service"],
    audienceScope: "b2c",
    selected: [
      s("home_service.occupant_need_owner"),
      s("urgent.rapid_comparator"),
      s("urgent.booking_payment_decider", ["b2c.payer"]),
      s("home_service.site_contact_recipient"),
      s("urgent.property_owner_manager_proxy")
    ]
  }),
  readyFixture({
    caseKey: "R11_adult_healthcare",
    recipeKey: "adult_healthcare",
    signals: ["adult_healthcare", "local_facility"],
    lifecycle: SWITCH,
    audienceScope: "b2c",
    selected: [
      s("healthcare.patient_need_owner"),
      s("healthcare.provider_evaluator"),
      s("healthcare.booking_decider", ["b2c.payer"]),
      s("healthcare.patient_recipient"),
      s("b2c.actual_user", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R12_care_welfare",
    recipeKey: "care_welfare",
    signals: ["care_welfare"],
    lifecycle: SWITCH,
    audienceScope: "b2c",
    selected: [
      s("care.care_recipient"),
      s("care.family_need_coordinator"),
      s("care.service_start_decider", ["b2c.alternate_payer"]),
      s("care.care_manager_referrer"),
      s("family.caregiver_supporter", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R13_adult_education",
    recipeKey: "adult_education",
    signals: ["adult_education"],
    lifecycle: SUBSCRIPTION_LIFECYCLE,
    audienceScope: "b2c",
    selected: [
      s("education.learner_need_owner", [], ["lifecycle.first_time_explorer"]),
      s("education.course_evaluator"),
      s("education.enrollment_decider", ["b2c.payer"]),
      s("education.active_learner"),
      s("subscription.renewal_value_decider", ["subscription.churn_cancellation_decider"], ["lifecycle.cancellation_decider", "lifecycle.renewal_decider", "lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R14_child_education",
    recipeKey: "child_education",
    signals: ["child_education", "local_facility"],
    lifecycle: SWITCH,
    audienceScope: "b2c",
    selected: [
      s("education.active_learner"),
      s("family.need_interpreter"),
      s("education.course_evaluator"),
      s("family.guardian_decision_maker", ["education.enrollment_decider", "b2c.alternate_payer"]),
      s("family.co_decision_member", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R15_multi_location_consumer_brand",
    recipeKey: "multi_location_consumer_brand",
    signals: ["multi_location_consumer_brand", "local_facility"],
    lifecycle: [...FIRST, ...SWITCH],
    audienceScope: "b2c",
    selected: [
      s("local.nearby_need_owner", [], ["lifecycle.first_time_explorer"]),
      s("local.provider_comparator"),
      s("local.booking_decider", ["b2c.payer"]),
      s("local.service_recipient"),
      s("b2c.actual_user", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R16_multi_location_customer_organization",
    recipeKey: "multi_location_customer_organization",
    signals: ["b2b_buying_group", "multi_location_customer_organization"],
    selected: [
      s("b2b.problem_owner", ["multilocation.hq_operations_owner"]),
      s("b2b.solution_evaluator"),
      s("multilocation.hq_strategy_owner", ["b2b.economic_buyer"]),
      s("branch.local_operator"),
      s("enterprise.security_reviewer", ["b2b.implementation_change_owner"])
    ]
  }),
  readyFixture({
    caseKey: "R17A_franchise_consumer_brand",
    recipeKey: "franchise_consumer_brand",
    signals: ["franchise_consumer_brand", "local_facility"],
    lifecycle: [...FIRST, ...SWITCH],
    audienceScope: "b2c",
    selected: [
      s("local.nearby_need_owner", [], ["lifecycle.first_time_explorer"]),
      s("local.provider_comparator"),
      s("local.booking_decider", ["b2c.payer"]),
      s("local.service_recipient"),
      s("b2c.actual_user", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R17B_franchise_recruitment",
    recipeKey: "franchise_recruitment",
    signals: ["b2b_buying_group", "franchise_recruitment"],
    selected: [
      s("b2b.problem_owner"),
      s("b2b.solution_evaluator"),
      s("franchise.franchisee_owner", ["b2b.economic_buyer"]),
      s("franchise.location_operator"),
      s("b2b.legal_compliance_blocker")
    ]
  }),
  readyFixture({
    caseKey: "R18_marketplace_brand",
    recipeKey: "marketplace_brand",
    signals: ["b2b_buying_group", "marketplace_brand"],
    lifecycle: ["renewal_decider"],
    audienceScope: "both",
    customerSides: ["demand_side_participant", "supply_side_participant"],
    selected: [
      s("marketplace.demand_need_owner"),
      s("marketplace.demand_listing_comparator"),
      s("marketplace.demand_transaction_decider", ["marketplace.demand_service_recipient"]),
      s("marketplace.supply_business_owner", ["marketplace.supply_platform_evaluator"]),
      s("marketplace.supply_listing_operator", ["marketplace.supply_service_fulfiller"], ["lifecycle.renewal_decider"])
    ]
  }),
  readyFixture({
    caseKey: "R19_marketplace_operator_customer",
    recipeKey: "marketplace_operator_customer",
    signals: ["b2b_buying_group", "marketplace_operator_customer"],
    selected: [
      s("b2b.problem_owner"),
      s("enterprise.solution_architect_evaluator"),
      s("marketplace.operator_business_owner", ["b2b.economic_buyer"]),
      s("b2b.operations_owner", ["marketplace.support_dispute_owner"]),
      s("marketplace.trust_safety_owner", ["enterprise.security_reviewer"])
    ]
  }),
  readyFixture({
    caseKey: "R20_b2b_professional_service",
    recipeKey: "professional_service_b2b",
    signals: ["b2b_buying_group", "professional_service_b2b"],
    lifecycle: SWITCH,
    selected: [
      s("professional.client_problem_owner"),
      s("professional.provider_evaluator"),
      s("professional.engagement_decision_owner", ["b2b.economic_buyer"]),
      s("professional.operational_liaison"),
      s("professional.client_problem_owner", [], ["lifecycle.switching_evaluator"])
    ]
  }),
  readyFixture({
    caseKey: "R21_recruiting_employer_saas",
    recipeKey: "recruiting_employer_saas",
    signals: ["b2b_buying_group", "recruiting_employer_saas"],
    selected: [
      s("recruiting.hiring_problem_owner", ["b2b.internal_champion"]),
      s("recruiting.solution_evaluator"),
      s("recruiting.adoption_decision_owner", ["b2b.economic_buyer"]),
      s("recruiting.recruiter_operator"),
      s("b2b.security_privacy_reviewer", ["b2b.legal_compliance_blocker"])
    ]
  }),
  readyFixture({
    caseKey: "R22_real_estate_rental",
    recipeKey: "real_estate_rental",
    signals: ["real_estate_rental"],
    lifecycle: FIRST,
    audienceScope: "b2c",
    selected: [
      s("rental.moving_need_owner", [], ["lifecycle.first_time_explorer"]),
      s("rental.property_agent_evaluator"),
      s("rental.application_contract_decider"),
      s("rental.actual_tenant"),
      s("family.co_decision_member", ["b2c.alternate_payer"])
    ]
  }),
  readyFixture({
    caseKey: "R23_real_estate_purchase",
    recipeKey: "real_estate_purchase_residential",
    signals: ["real_estate_purchase_residential"],
    audienceScope: "b2c",
    selected: [
      s("homepurchase.home_need_owner"),
      s("homepurchase.property_evaluator"),
      s("homepurchase.mortgage_contract_decider", ["b2c.payer"]),
      s("homepurchase.household_occupant"),
      s("family.co_decision_member")
    ]
  }),
  readyFixture({
    caseKey: "R24_real_estate_sale",
    recipeKey: "real_estate_sale",
    signals: ["real_estate_sale"],
    audienceScope: "b2c",
    selected: [
      s("homesale.disposition_need_owner"),
      s("homesale.broker_valuation_evaluator"),
      s("homesale.sale_contract_decider"),
      s("homesale.estate_inheritance_stakeholder"),
      s("agency.external_advisor")
    ]
  }),
  readyFixture({
    caseKey: "R25_insurance",
    recipeKey: "insurance",
    signals: ["insurance"],
    lifecycle: ["renewal_decider"],
    audienceScope: "b2c",
    selected: [
      s("insurance.coverage_need_owner"),
      s("b2c.option_evaluator"),
      s("insurance.policyholder", ["b2c.payer"]),
      s("insurance.insured_person"),
      s("insurance.policyholder", [], ["lifecycle.renewal_decider"])
    ]
  }),
  readyFixture({
    caseKey: "R26_manufacturing_capex",
    recipeKey: "manufacturing_capex",
    signals: ["b2b_buying_group", "manufacturing_capex"],
    selected: [
      s("manufacturing.plant_problem_owner"),
      s("manufacturing.technical_spec_evaluator"),
      s("manufacturing.capex_decision_owner"),
      s("manufacturing.procurement_buyer"),
      s("manufacturing.operator_maintenance_user")
    ]
  }),
  readyFixture({
    caseKey: "R27_logistics_shipper_buying",
    recipeKey: "logistics_shipper_buying",
    signals: ["b2b_buying_group", "logistics_shipper_buying"],
    selected: [
      s("logistics.operations_problem_owner"),
      s("logistics.solution_evaluator"),
      s("logistics.contract_sla_decider"),
      s("logistics.dispatch_warehouse_operator"),
      s("logistics.integration_data_reviewer")
    ]
  }),
  readyFixture({
    caseKey: "R28_group_business_travel",
    recipeKey: "group_or_business_travel",
    signals: ["b2b_buying_group", "group_or_business_travel"],
    selected: [
      s("travel.traveler_need_owner"),
      s("b2c.option_evaluator"),
      s("travel.booking_decider", ["b2b.economic_buyer"]),
      s("travel.trip_recipient"),
      s("travel.group_event_planner")
    ]
  }),
  readyFixture({
    caseKey: "R29_public_nonprofit_customer",
    recipeKey: "public_nonprofit_customer",
    signals: ["b2b_buying_group", "public_nonprofit_customer"],
    selected: [
      s("b2b.problem_owner"),
      s("b2b.solution_evaluator"),
      s("public.procurement_owner", ["public.program_decision_owner", "b2b.economic_buyer"]),
      s("public.frontline_operator"),
      s("public.compliance_accessibility_reviewer")
    ]
  }),
  readyFixture({
    caseKey: "R30_media_brand",
    recipeKey: "media_brand",
    signals: ["media_brand"],
    audienceScope: "both",
    selected: [
      s("media.reader_viewer"),
      s("media.paid_subscriber", ["subscription.acquisition_decider"]),
      s("media.advertiser_buyer"),
      s("media.agency_media_planner"),
      s("media.external_creator_contributor")
    ]
  })
];

function upstreamFixture(
  caseKey: string,
  expectedStatus: "needs_review" | "blocked",
  codes: readonly string[]
): RecoraPersonaGoldFixtureV3 {
  return {
    fixtureVersion: RECORA_PERSONA_GOLD_FIXTURE_VERSION,
    caseKey,
    expectedStatus,
    generationInput: null,
    upstreamReviewCodes: expectedStatus === "needs_review" ? codes : [],
    upstreamBlockerCodes: expectedStatus === "blocked" ? codes : []
  };
}

export const RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3: readonly RecoraPersonaGoldFixtureV3[] = [
  upstreamFixture("NR01_audience_priority", "needs_review", ["audience_priority_required"]),
  upstreamFixture("NR02_marketplace_subject", "needs_review", ["marketplace_motion_required"]),
  upstreamFixture("NR03_marketplace_side", "needs_review", ["required_market_side_ambiguous"]),
  upstreamFixture("NR04_agency_motion", "needs_review", ["agency_motion_required"]),
  upstreamFixture("NR05_multi_location_motion", "needs_review", ["multi_location_motion_required"]),
  upstreamFixture("NR06_franchise_motion", "needs_review", ["franchise_motion_required"]),
  upstreamFixture("NR07_education_motion", "needs_review", ["education_motion_required"]),
  upstreamFixture("NR08_real_estate_motion", "needs_review", ["real_estate_motion_required"]),
  upstreamFixture("NR09_finance_motion", "needs_review", ["finance_motion_required"]),
  upstreamFixture("NR10_payer_relation", "needs_review", ["actor_relation_unconfirmed"]),
  upstreamFixture("NR11_family_relation", "needs_review", ["required_family_role_ambiguous"]),
  upstreamFixture("NR12_urgent_motion", "needs_review", ["urgent_motion_required"])
];

export const RECORA_PERSONA_BLOCKED_GOLD_FIXTURES_V3: readonly RecoraPersonaGoldFixtureV3[] = [
  upstreamFixture("BL01_subject_missing", "blocked", ["primary_subject_missing"]),
  upstreamFixture("BL02_audience_missing", "blocked", ["audience_scope_missing"]),
  upstreamFixture("BL03_action_missing", "blocked", ["primary_action_missing"]),
  upstreamFixture("BL04_country", "blocked", ["unsupported_country"]),
  upstreamFixture("BL05_locale", "blocked", ["unsupported_locale"]),
  upstreamFixture("BL06_contract", "blocked", ["unsupported_contract_version"]),
  upstreamFixture("BL07_side_conflict", "blocked", ["customer_side_invalid"]),
  upstreamFixture("BL08_scope_conflict", "blocked", ["structure_signal_conflict"])
];

export const RECORA_PERSONA_CATALOG_GAP_GOLD_FIXTURES_V3: readonly RecoraPersonaGoldFixtureV3[] = [
  {
    ...RECORA_PERSONA_READY_GOLD_FIXTURES_V3[0],
    caseKey: "CG01_required_blueprint_removed",
    expectedStatus: "catalog_gap"
  },
  {
    ...RECORA_PERSONA_READY_GOLD_FIXTURES_V3[5],
    caseKey: "CG02_only_four_required_roles",
    expectedStatus: "catalog_gap"
  },
  {
    ...RECORA_PERSONA_READY_GOLD_FIXTURES_V3[8],
    caseKey: "CG03_topic_effects_insufficient",
    expectedStatus: "catalog_gap"
  }
];

export function upstreamResultForFixture(
  fixture: RecoraPersonaGoldFixtureV3
): RecoraPromptGenerationNormalizationResultV1 {
  if (fixture.expectedStatus === "ready" || fixture.expectedStatus === "catalog_gap") {
    return {
      status: "ready",
      value: fixture.generationInput,
      reviewQuestions: [],
      blockers: [],
      warnings: []
    };
  }
  if (fixture.expectedStatus === "needs_review") {
    return {
      status: "needs_review",
      value: null,
      reviewQuestions: (fixture.upstreamReviewCodes ?? []).map((code) => ({
        code: code as never,
        message: code,
        allowedAnswers: ["review"]
      })),
      blockers: [],
      warnings: []
    };
  }
  return {
    status: "blocked",
    value: null,
    reviewQuestions: [],
    blockers: (fixture.upstreamBlockerCodes ?? []) as never,
    warnings: []
  };
}

export const RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3 = {
  ready: RECORA_PERSONA_READY_GOLD_FIXTURES_V3.length,
  needsReview: RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3.length,
  catalogGap: RECORA_PERSONA_CATALOG_GAP_GOLD_FIXTURES_V3.length,
  blocked: RECORA_PERSONA_BLOCKED_GOLD_FIXTURES_V3.length
} as const;

export const RECORA_PERSONA_FIXTURE_SEMANTICS_VERSION =
  RECORA_PROMPT_GENERATION_SEMANTICS_VERSION;