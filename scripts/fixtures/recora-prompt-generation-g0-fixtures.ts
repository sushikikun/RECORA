import {
  RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION,
  type RecoraPromptGenerationBlockerCode,
  type RecoraPromptGenerationDraftInputV1,
  type RecoraPromptGenerationReviewCode
} from "../../lib/recora/prompt-generation-input";

export type RecoraG0ReadyFixture = {
  caseKey: string;
  input: RecoraPromptGenerationDraftInputV1;
  expectedStructureSignals: readonly string[];
  unexpectedStructureSignals?: readonly string[];
  expectedTrustClass: "standard" | "high_trust" | "regulated";
};

export type RecoraG0NeedsReviewFixture = {
  caseKey: string;
  input: RecoraPromptGenerationDraftInputV1;
  expectedReviewCodes: readonly RecoraPromptGenerationReviewCode[];
};

export type RecoraG0BlockedFixture = {
  caseKey: string;
  input: RecoraPromptGenerationDraftInputV1;
  expectedBlockerCodes: readonly RecoraPromptGenerationBlockerCode[];
};

const BASE: RecoraPromptGenerationDraftInputV1 = {
  contractVersion: RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION,
  market: { country: "JP", locale: "ja-JP" },
  subject: {
    operatorCompanyName: "株式会社サンプル",
    primary: {
      type: "service",
      name: "サンプルサービス",
      aliases: ["Sample Service"],
      officialUrl: "https://example.jp/service"
    },
    secondary: []
  },
  audience: { scope: "b2b", priority: null },
  business: {
    primaryDomain: "it_software",
    secondaryDomains: [],
    primaryOfferingModel: "saas_software",
    secondaryOfferingModels: [],
    commerceChannels: [],
    commerceRoles: [],
    summary: "日本企業向けのサービスです。"
  },
  actions: { primary: "demo_or_trial", secondary: ["contract"] },
  delivery: {
    mode: "online",
    serviceCoverage: "nationwide",
    locationStructure: "none",
    geographicBinding: "none",
    serviceAreas: [],
    locations: []
  },
  trust: {
    decisionImpactFlags: [],
    regulatoryFlags: [],
    sensitiveContexts: []
  },
  generationContext: {
    structureSignals: ["b2b_buying_group"],
    customerSides: ["prospective_customer"],
    actorRelations: [],
    lifecycleSignals: [],
    focusThemes: ["比較"],
    diagnosisGoals: ["候補発見"]
  }
};

function patch(
  source: RecoraPromptGenerationDraftInputV1,
  change: Partial<RecoraPromptGenerationDraftInputV1>
): RecoraPromptGenerationDraftInputV1 {
  return {
    ...source,
    ...change,
    market: { ...source.market, ...change.market },
    subject: { ...source.subject, ...change.subject },
    audience: { ...source.audience, ...change.audience },
    business: { ...source.business, ...change.business },
    actions: { ...source.actions, ...change.actions },
    delivery: { ...source.delivery, ...change.delivery },
    trust: { ...source.trust, ...change.trust },
    generationContext: {
      ...source.generationContext,
      ...change.generationContext
    }
  };
}

function ready(
  caseKey: string,
  input: RecoraPromptGenerationDraftInputV1,
  expectedStructureSignals: readonly string[],
  expectedTrustClass: RecoraG0ReadyFixture["expectedTrustClass"] = "standard",
  unexpectedStructureSignals: readonly string[] = []
): RecoraG0ReadyFixture {
  return {
    caseKey,
    input,
    expectedStructureSignals,
    unexpectedStructureSignals,
    expectedTrustClass
  };
}

const PRODUCT = patch(BASE, {
  subject: {
    primary: {
      type: "product",
      name: "サンプル商品",
      aliases: [],
      officialUrl: "https://example.jp/product"
    }
  },
  audience: { scope: "b2c" },
  business: {
    primaryDomain: "retail_product_sales",
    primaryOfferingModel: "product",
    commerceChannels: ["ecommerce"],
    commerceRoles: ["brand_owner", "direct_seller"],
    summary: "自社ECで販売する商品です。"
  },
  actions: { primary: "purchase", secondary: [] },
  generationContext: {
    structureSignals: ["commerce_single_purchase"],
    customerSides: [
      "prospective_customer",
      "end_user_or_beneficiary",
      "payer_or_sponsor"
    ]
  }
});

const LOCAL = patch(BASE, {
  subject: {
    primary: {
      type: "location_facility",
      name: "青山店",
      aliases: [],
      officialUrl: "https://example.jp/aoyama"
    }
  },
  audience: { scope: "b2c" },
  business: {
    primaryDomain: "food_beauty_lifestyle",
    primaryOfferingModel: "physical_location_service",
    summary: "予約制の地域店舗です。"
  },
  actions: { primary: "reservation", secondary: ["visit"] },
  delivery: {
    mode: "in_person",
    serviceCoverage: "local",
    locationStructure: "single_location",
    geographicBinding: "physical_location",
    locations: [
      {
        type: "location_facility",
        name: "青山店",
        aliases: [],
        officialUrl: "https://example.jp/aoyama"
      }
    ]
  },
  generationContext: {
    structureSignals: ["local_facility"],
    customerSides: ["prospective_customer", "end_user_or_beneficiary"]
  }
});

function motion(
  caseKey: string,
  domain: string,
  model: string,
  signal: string,
  action = "inquiry",
  extra: Partial<RecoraPromptGenerationDraftInputV1> = {},
  trustClass: RecoraG0ReadyFixture["expectedTrustClass"] = "standard"
) {
  const input = patch(
    patch(BASE, {
      business: {
        primaryDomain: domain,
        primaryOfferingModel: model,
        summary: `${caseKey}の確定済み事業です。`
      },
      actions: { primary: action, secondary: [] },
      generationContext: { structureSignals: [signal] }
    }),
    extra
  );
  return ready(caseKey, input, [signal], trustClass);
}

export const RECORA_G0_READY_FIXTURES: readonly RecoraG0ReadyFixture[] = [
  ready("ready_b2b_saas", BASE, ["b2b_buying_group"]),
  ready(
    "ready_b2b_saas_direct_subscription",
    patch(BASE, {
      actions: { primary: "start_subscription", secondary: ["contract"] }
    }),
    ["b2b_buying_group"],
    "standard",
    ["commerce_subscription"]
  ),
  ready(
    "ready_d2c_single_purchase",
    PRODUCT,
    ["commerce_single_purchase"]
  ),
  ready(
    "ready_d2c_subscription",
    patch(PRODUCT, {
      actions: { primary: "start_subscription", secondary: ["purchase"] },
      generationContext: {
        structureSignals: ["commerce_subscription"],
        lifecycleSignals: ["renewal_decider", "cancellation_decider"]
      }
    }),
    ["commerce_subscription"]
  ),
  ready("ready_local_store", LOCAL, ["local_facility"]),
  ready(
    "ready_in_person_service_area_not_facility",
    patch(BASE, {
      business: {
        primaryDomain: "professional_consulting",
        primaryOfferingModel: "managed_service",
        summary: "担当者が顧客先へ訪問して提供するサービスです。"
      },
      actions: { primary: "inquiry", secondary: ["contract"] },
      delivery: {
        mode: "in_person",
        serviceCoverage: "regional",
        locationStructure: "none",
        geographicBinding: "service_area",
        serviceAreas: [
          {
            areaKey: "JP-13",
            label: "東京都",
            level: "prefecture",
            parentAreaKey: "JP",
            resolutionStatus: "canonical"
          }
        ],
        locations: []
      }
    }),
    ["b2b_buying_group"],
    "standard",
    ["local_facility"]
  ),
  motion(
    "ready_adult_healthcare",
    "healthcare",
    "physical_location_service",
    "adult_healthcare",
    "reservation",
    {
      trust: {
        decisionImpactFlags: ["safety_or_health"],
        regulatoryFlags: ["regulated_service", "advertising_restriction"],
        sensitiveContexts: ["personal", "health"]
      }
    },
    "regulated"
  ),
  motion(
    "ready_care_welfare",
    "care_welfare",
    "consumer_service",
    "care_welfare",
    "consultation",
    {
      trust: {
        decisionImpactFlags: ["livelihood"],
        sensitiveContexts: ["personal", "health"]
      }
    },
    "high_trust"
  ),
  motion(
    "ready_adult_education",
    "education",
    "consumer_service",
    "adult_education",
    "application"
  ),
  motion(
    "ready_child_education",
    "education",
    "physical_location_service",
    "child_education",
    "application"
  ),
  motion(
    "ready_professional_service",
    "professional_consulting",
    "professional_advisory",
    "professional_service_b2b",
    "consultation",
    {
      trust: {
        decisionImpactFlags: ["legal_rights"],
        sensitiveContexts: ["legal"]
      }
    },
    "high_trust"
  ),
  motion(
    "ready_recruiting_saas",
    "recruiting_hr",
    "saas_software",
    "recruiting_employer_saas",
    "demo_or_trial",
    {
      trust: { sensitiveContexts: ["personal", "employment"] }
    },
    "high_trust"
  ),
  motion(
    "ready_real_estate_rental",
    "real_estate",
    "professional_advisory",
    "real_estate_rental",
    "inquiry"
  ),
  motion(
    "ready_real_estate_purchase",
    "real_estate",
    "professional_advisory",
    "real_estate_purchase_residential",
    "consultation",
    {
      trust: {
        decisionImpactFlags: ["high_cost", "long_term_commitment"]
      }
    },
    "high_trust"
  ),
  motion(
    "ready_real_estate_sale",
    "real_estate",
    "professional_advisory",
    "real_estate_sale",
    "consultation"
  ),
  motion(
    "ready_insurance",
    "finance_insurance",
    "professional_advisory",
    "insurance",
    "consultation",
    {
      trust: {
        decisionImpactFlags: ["long_term_commitment"],
        regulatoryFlags: ["regulated_service"],
        sensitiveContexts: ["financial"]
      }
    },
    "regulated"
  ),
  motion(
    "ready_marketplace_brand",
    "consumer_services",
    "marketplace_platform",
    "marketplace_brand",
    "purchase",
    {
      generationContext: {
        customerSides: [
          "demand_side_participant",
          "supply_side_participant"
        ]
      }
    }
  ),
  motion(
    "ready_marketplace_operator_customer",
    "it_software",
    "saas_software",
    "marketplace_operator_customer",
    "demo_or_trial"
  ),
  ready(
    "ready_multi_location_consumer",
    patch(LOCAL, {
      delivery: { locationStructure: "multi_location" },
      generationContext: {
        structureSignals: [
          "multi_location_consumer_brand",
          "local_facility"
        ]
      }
    }),
    ["local_facility", "multi_location_consumer_brand"]
  ),
  motion(
    "ready_multi_location_customer_org",
    "it_software",
    "saas_software",
    "multi_location_customer_organization",
    "demo_or_trial",
    {
      delivery: {
        mode: "hybrid",
        serviceCoverage: "nationwide",
        locationStructure: "multi_location",
        geographicBinding: "physical_location",
        locations: [
          {
            type: "location_facility",
            name: "顧客拠点",
            aliases: [],
            officialUrl: null
          }
        ]
      }
    }
  ),
  motion(
    "ready_manufacturing",
    "manufacturing_industrial",
    "product",
    "manufacturing_capex",
    "request_quote",
    { trust: { decisionImpactFlags: ["high_cost"] } },
    "high_trust"
  ),
  motion(
    "ready_logistics",
    "logistics_supply_chain",
    "managed_service",
    "logistics_shipper_buying",
    "request_quote"
  )
];

function review(
  caseKey: string,
  input: RecoraPromptGenerationDraftInputV1,
  code: RecoraPromptGenerationReviewCode
): RecoraG0NeedsReviewFixture {
  return { caseKey, input, expectedReviewCodes: [code] };
}

export const RECORA_G0_NEEDS_REVIEW_FIXTURES: readonly RecoraG0NeedsReviewFixture[] = [
  review(
    "review_both_priority_missing",
    patch(BASE, { audience: { scope: "both", priority: null } }),
    "audience_priority_required"
  ),
  review(
    "review_healthcare_motion",
    patch(BASE, {
      business: { primaryDomain: "healthcare" },
      generationContext: { structureSignals: [] }
    }),
    "healthcare_motion_required"
  ),
  review(
    "review_regulated_healthcare_motion",
    patch(BASE, {
      business: { primaryDomain: "healthcare" },
      trust: {
        decisionImpactFlags: ["safety_or_health"],
        regulatoryFlags: ["regulated_service"],
        sensitiveContexts: ["health"]
      },
      generationContext: { structureSignals: [] }
    }),
    "healthcare_motion_required"
  ),
  review(
    "review_education_motion",
    patch(BASE, {
      business: { primaryDomain: "education" },
      generationContext: { structureSignals: [] }
    }),
    "education_motion_required"
  ),
  review(
    "review_real_estate_motion",
    patch(BASE, {
      business: { primaryDomain: "real_estate" },
      generationContext: { structureSignals: [] }
    }),
    "real_estate_motion_required"
  ),
  review(
    "review_finance_motion",
    patch(BASE, {
      business: { primaryDomain: "finance_insurance" },
      generationContext: { structureSignals: [] }
    }),
    "finance_motion_required"
  ),
  review(
    "review_marketplace_motion",
    patch(BASE, {
      business: { primaryOfferingModel: "marketplace_platform" },
      generationContext: { structureSignals: [] }
    }),
    "marketplace_motion_required"
  ),
  review(
    "review_multi_location_motion",
    patch(LOCAL, {
      delivery: { locationStructure: "multi_location" },
      generationContext: { structureSignals: ["local_facility"] }
    }),
    "multi_location_motion_required"
  ),
  review(
    "review_travel_motion",
    patch(BASE, {
      business: { primaryDomain: "travel_hospitality" },
      generationContext: { structureSignals: [] }
    }),
    "travel_motion_required"
  ),
  review(
    "review_actor_relation",
    patch(BASE, {
      generationContext: {
        actorRelations: [
          {
            leftRoleKey: "decider",
            rightRoleKey: "payer",
            relation: "unknown"
          }
        ]
      }
    }),
    "actor_relation_unconfirmed"
  ),
  review(
    "review_service_area_missing",
    patch(BASE, {
      delivery: {
        mode: "in_person",
        geographicBinding: "service_area",
        serviceCoverage: "regional",
        serviceAreas: []
      }
    }),
    "service_area_details_required"
  )
];

function blocked(
  caseKey: string,
  input: RecoraPromptGenerationDraftInputV1,
  code: RecoraPromptGenerationBlockerCode
): RecoraG0BlockedFixture {
  return { caseKey, input, expectedBlockerCodes: [code] };
}

export const RECORA_G0_BLOCKED_FIXTURES: readonly RecoraG0BlockedFixture[] = [
  blocked(
    "blocked_contract",
    { ...BASE, contractVersion: "old" },
    "unsupported_contract_version"
  ),
  blocked(
    "blocked_country",
    patch(BASE, { market: { country: "US" } }),
    "unsupported_country"
  ),
  blocked(
    "blocked_subject",
    patch(BASE, { subject: { primary: undefined } }),
    "primary_subject_missing"
  ),
  blocked(
    "blocked_audience",
    patch(BASE, { audience: { scope: undefined } }),
    "audience_scope_missing"
  ),
  blocked(
    "blocked_action",
    patch(BASE, { actions: { primary: undefined } }),
    "primary_action_missing"
  ),
  blocked(
    "blocked_delivery_conflict",
    patch(BASE, {
      delivery: {
        locationStructure: "none",
        geographicBinding: "physical_location"
      }
    }),
    "delivery_geography_conflict"
  ),
  blocked(
    "blocked_online_physical_location",
    patch(LOCAL, { delivery: { mode: "online" } }),
    "delivery_geography_conflict"
  ),
  blocked(
    "blocked_signal_conflict",
    patch(PRODUCT, {
      generationContext: {
        structureSignals: [
          "commerce_single_purchase",
          "commerce_subscription"
        ]
      }
    }),
    "structure_signal_conflict"
  ),
  blocked(
    "blocked_signal_domain_mismatch",
    patch(BASE, {
      generationContext: { structureSignals: ["child_education"] }
    }),
    "structure_signal_conflict"
  ),
  blocked(
    "blocked_non_marketplace_market_sides",
    patch(BASE, {
      generationContext: {
        customerSides: [
          "demand_side_participant",
          "supply_side_participant"
        ]
      }
    }),
    "customer_side_invalid"
  ),
  blocked(
    "blocked_actor_relation",
    patch(BASE, {
      generationContext: {
        actorRelations: [
          {
            leftRoleKey: "same",
            rightRoleKey: "same",
            relation: "same_actor"
          }
        ]
      }
    }),
    "actor_relation_invalid"
  ),
  blocked(
    "blocked_actor_role_key",
    patch(BASE, {
      generationContext: {
        actorRelations: [
          {
            leftRoleKey: "決定者!",
            rightRoleKey: "payer",
            relation: "same_actor"
          }
        ]
      }
    }),
    "actor_relation_invalid"
  )
];

export const RECORA_G0_PROFILE_FIXTURES = [
  { questionLimit: 50, expectedStatus: "ready", expectedTotal: 50 },
  { questionLimit: 100, expectedStatus: "ready", expectedTotal: 100 },
  { questionLimit: 200, expectedStatus: "ready", expectedTotal: 200 },
  { questionLimit: 75, expectedStatus: "blocked", expectedTotal: 75 }
] as const;

export const RECORA_G0_LEGACY_SEED_FIXTURES = [
  {
    caseKey: "legacy_seed_requires_review",
    expectedStatus: "needs_review",
    seed: {
      companyName: "株式会社レガシー",
      brandName: "Legacy",
      officialSiteUrl: "https://example.jp",
      productOrServiceDescription: "既存Seedのサービス説明です。",
      industryCategory: "SaaS",
      targetCustomers: "法人",
      regions: ["日本"],
      language: "ja",
      knownCompetitors: ["競合A"]
    }
  }
] as const;
