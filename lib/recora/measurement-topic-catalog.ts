import { RECORA_GENERATION_STRUCTURE_SIGNALS } from "./prompt-generation-input";
import type {
  RecoraBusinessDomain,
  RecoraCustomerAction,
  RecoraGenerationCustomerSide,
  RecoraGenerationStructureSignal
} from "./prompt-generation-input";
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
  audienceScopesAny: null,
  audiencePrioritiesAny: null,
  primarySubjectTypesAny: null,
  secondarySubjectTypesAny: null,
  primaryBusinessDomainsAny: null,
  secondaryBusinessDomainsAny: null,
  primaryOfferingModelsAny: null,
  secondaryOfferingModelsAny: null,
  commerceChannelsAny: null,
  commerceChannelsAll: null,
  commerceRolesAny: null,
  commerceRolesAll: null,
  commerceRolesNone: null,
  primaryActionsAny: null,
  secondaryActionsAny: null,
  structureSignalsAll: null,
  structureSignalsAny: null,
  structureSignalsNone: null,
  geographicBindingsAny: null,
  serviceCoveragesAny: null,
  locationStructuresAny: null,
  trustClassesAny: null,
  decisionImpactFlagsAny: null,
  regulatoryFlagsAny: null,
  sensitiveContextsAny: null,
  personaInfluencesAny: null,
  personaRoleFamiliesAny: null,
  marketSidesAny: null,
  lifecycleSignalsAny: null,
  lifecycleSignalsAll: null,
  lifecycleSignalsNone: null,
  resolvedTopicSubtypeKeysAny: null
};

export const RECORA_TOPIC_ALL_SOURCE_ROWS_V3 = [
  ...RECORA_TOPIC_COMMON_SOURCE_ROWS_V3,
  ...RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3,
  ...RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3
] as const satisfies readonly RecoraTopicBlueprintSourceRowV3[];

type FixedPackPolicyDefinitionV3 = {
  specificityTier: RecoraTopicSpecificityTierV3;
  allowedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  applicability?: Partial<RecoraTopicBlueprintApplicabilityV3>;
  influences: NonNullable<
    RecoraTopicPackPolicyV3["defaultPersonaInfluencesAny"]
  >;
  roles?: NonNullable<
    RecoraTopicPackPolicyV3["defaultPersonaRoleFamiliesAny"]
  >;
  sides?: NonNullable<RecoraTopicPackPolicyV3["defaultMarketSidesAny"]>;
  promptLabelAuthority?: "structure" | "domain";
};

const N = "need_and_candidate_discovery" as const;
const C = "comparison_and_alternatives" as const;
const A = "action_and_contract_decision" as const;
const U = "usage_or_outcome_fit" as const;
const T = "trust_evidence_and_risk" as const;
const L = "continuation_and_switching" as const;
const O = "technical_and_operational_fit" as const;
const F = "family_or_proxy_decision" as const;

export const RECORA_TOPIC_FIXED_PACK_POLICY_DEFINITIONS_V3 = {
  common_discovery: {
    specificityTier: "common",
    allowedLaneKeys: ["market_discovery", "criteria_explanation"],
    influences: [N, C]
  },
  common_comparison: {
    specificityTier: "common",
    allowedLaneKeys: ["market_comparison", "criteria_explanation"],
    influences: [C, N, L]
  },
  common_fit_action: {
    specificityTier: "common",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    influences: [U, A, F, O]
  },
  common_trust_continuation: {
    specificityTier: "common",
    allowedLaneKeys: [
      "trust_risk_diagnostic",
      "criteria_explanation",
      "action_readiness",
      "market_comparison"
    ],
    influences: [T, L, A]
  },
  diagnostic_brand_citation: {
    specificityTier: "common",
    allowedLaneKeys: [
      "self_branded_perception",
      "natural_citation_overlay",
      "forced_citation_validation"
    ],
    influences: [T, C]
  },
  b2b_buying: {
    specificityTier: "audience",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      audienceScopesAny: ["b2b", "both"],
      structureSignalsAny: ["b2b_buying_group"]
    },
    influences: [N, C, A, U, T, O],
    roles: [
      "need_owner",
      "evaluator",
      "decision_owner",
      "payer",
      "end_user",
      "operator",
      "champion",
      "reviewer",
      "ratifier",
      "blocker"
    ]
  },
  b2c_decision: {
    specificityTier: "audience",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { audienceScopesAny: ["b2c", "both"] },
    influences: [N, C, A, U, T, F],
    roles: [
      "need_owner",
      "evaluator",
      "decision_owner",
      "payer",
      "end_user",
      "recipient",
      "recommender",
      "proxy"
    ]
  },
  both_audience: {
    specificityTier: "structure_motion",
    allowedLaneKeys: ["criteria_explanation", "action_readiness"],
    applicability: {
      audienceScopesAny: ["both"],
      audiencePrioritiesAny: ["b2b_first", "b2c_first", "balanced"]
    },
    influences: [N, C, A, U, T, O]
  },
  family_proxy: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { audienceScopesAny: ["b2c", "both"] },
    influences: [F, A, U, T],
    roles: ["proxy", "payer", "recipient", "recommender"],
    sides: [
      "payer_or_sponsor",
      "end_user_or_beneficiary",
      "influencer_or_referrer"
    ]
  },
  agency_delivery: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { structureSignalsAll: ["agency_delivery"] },
    influences: [N, C, A, U, T, O],
    roles: ["decision_owner", "operator", "evaluator", "advisor", "provider"],
    sides: ["partner_or_intermediary", "prospective_customer"],
    promptLabelAuthority: "structure"
  },
  b2b2c: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { structureSignalsAll: ["b2b2c"] },
    influences: [N, A, U, T, O],
    sides: [
      "payer_or_sponsor",
      "prospective_customer",
      "end_user_or_beneficiary"
    ],
    promptLabelAuthority: "structure"
  },
  marketplace_demand: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      structureSignalsAll: ["marketplace_brand"],
      primaryOfferingModelsAny: ["marketplace_platform"]
    },
    influences: [N, C, A, U, T],
    sides: ["demand_side_participant"],
    promptLabelAuthority: "structure"
  },
  marketplace_supply: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      structureSignalsAll: ["marketplace_brand"],
      primaryOfferingModelsAny: ["marketplace_platform"]
    },
    influences: [C, A, U, T, L, O],
    sides: ["supply_side_participant"],
    promptLabelAuthority: "structure"
  },
  marketplace_operator: {
    specificityTier: "structure_motion",
    allowedLaneKeys: ["criteria_explanation", "trust_risk_diagnostic"],
    applicability: {
      audienceScopesAny: ["b2b", "both"],
      structureSignalsAll: ["marketplace_operator_customer"]
    },
    influences: [A, U, T, O],
    roles: ["decision_owner", "operator", "reviewer", "champion"],
    sides: ["prospective_customer"],
    promptLabelAuthority: "structure"
  },
  multi_location: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      structureSignalsAny: [
        "multi_location_consumer_brand",
        "multi_location_customer_organization"
      ]
    },
    influences: [N, C, A, U, T, O],
    promptLabelAuthority: "structure"
  },
  franchise: {
    specificityTier: "structure_motion",
    allowedLaneKeys: ["criteria_explanation", "trust_risk_diagnostic"],
    applicability: {
      structureSignalsAny: [
        "franchise_consumer_brand",
        "franchise_recruitment"
      ]
    },
    influences: [N, C, A, U, T, O],
    promptLabelAuthority: "structure"
  },
  subscription_membership: {
    specificityTier: "structure_motion",
    allowedLaneKeys: ["criteria_explanation", "action_readiness"],
    applicability: {
      structureSignalsAny: [
        "commerce_subscription",
        "adult_education",
        "media_brand"
      ]
    },
    influences: [A, U, L, T]
  },
  urgent_service: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { structureSignalsAll: ["urgent_service"] },
    influences: [N, C, A, T, F, O],
    promptLabelAuthority: "structure"
  },
  public_nonprofit: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { structureSignalsAll: ["public_nonprofit_customer"] },
    influences: [N, C, A, U, T, O],
    sides: [
      "prospective_customer",
      "payer_or_sponsor",
      "end_user_or_beneficiary"
    ],
    promptLabelAuthority: "structure"
  },
  manufacturer_channel: {
    specificityTier: "industry",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: [
        "manufacturing_industrial",
        "retail_product_sales"
      ],
      primaryOfferingModelsAny: ["product"]
    },
    influences: [C, A, U, T, O],
    roles: ["decision_owner", "payer", "operator", "champion"],
    sides: [
      "prospective_customer",
      "payer_or_sponsor",
      "partner_or_intermediary"
    ]
  },
  company_brand: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "trust_risk_diagnostic"
    ],
    applicability: { primarySubjectTypesAny: ["company", "brand"] },
    influences: [N, C, T]
  },
  offering_service: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryOfferingModelsAny: [
        "managed_service",
        "professional_advisory",
        "consumer_service",
        "physical_location_service"
      ]
    },
    influences: [A, U, T, O]
  },
  offering_product: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { primaryOfferingModelsAny: ["product"] },
    influences: [N, C, A, U, T]
  },
  location_facility: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      geographicBindingsAny: [
        "physical_location",
        "service_area_and_physical_location"
      ],
      locationStructuresAny: ["single_location", "multi_location"]
    },
    influences: [N, C, A, U, T, L]
  },
  professional_person: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { primarySubjectTypesAny: ["professional_person"] },
    influences: [C, A, U, T],
    roles: ["evaluator", "decision_owner", "advisor", "recommender"]
  },
  saas_software: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { primaryOfferingModelsAny: ["saas_software"] },
    influences: [C, A, U, T, O]
  },
  commerce_product: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["retail_product_sales"],
      primaryOfferingModelsAny: ["product"],
      structureSignalsAny: [
        "commerce_single_purchase",
        "commerce_subscription",
        "commerce_gift"
      ],
      commerceChannelsAny: [
        "ecommerce",
        "physical_retail",
        "third_party_marketplace"
      ],
      commerceRolesAny: [
        "brand_owner",
        "manufacturer",
        "direct_seller",
        "retailer",
        "marketplace_seller",
        "marketplace_operator"
      ]
    },
    influences: [N, C, A, U, T, L, F]
  },
  publisher_content: {
    specificityTier: "offering_subject",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic",
      "forced_citation_validation"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["media_content"],
      primaryOfferingModelsAny: ["publisher_content"]
    },
    influences: [N, A, U, T, L]
  },
  enterprise_it_security: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      audienceScopesAny: ["b2b", "both"],
      structureSignalsAll: ["enterprise_it_security"],
      primaryOfferingModelsAny: ["saas_software", "managed_service"]
    },
    influences: [C, A, U, T, O],
    roles: ["evaluator", "decision_owner", "operator", "reviewer", "blocker"],
    promptLabelAuthority: "structure"
  },
  healthcare_clinic: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      structureSignalsAll: ["adult_healthcare"],
      primaryBusinessDomainsAny: ["healthcare"],
      trustClassesAny: ["high_trust", "regulated"]
    },
    influences: [N, C, A, U, T, L],
    promptLabelAuthority: "structure"
  },
  care_welfare: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      structureSignalsAll: ["care_welfare"],
      primaryBusinessDomainsAny: ["care_welfare"]
    },
    influences: [N, C, A, U, T, L, F],
    sides: [
      "end_user_or_beneficiary",
      "payer_or_sponsor",
      "influencer_or_referrer"
    ],
    promptLabelAuthority: "structure"
  },
  education_school: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["education"],
      structureSignalsAny: [
        "adult_education",
        "child_education",
        "corporate_training"
      ]
    },
    influences: [N, C, A, U, T, L, F],
    promptLabelAuthority: "structure"
  },
  professional_service: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["professional_consulting"]
    },
    influences: [N, C, A, U, T, L, O]
  },
  recruiting_hr: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      structureSignalsAll: ["recruiting_employer_saas"],
      primaryBusinessDomainsAny: ["recruiting_hr"]
    },
    influences: [N, C, A, U, T, O],
    promptLabelAuthority: "structure"
  },
  real_estate: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["real_estate"],
      structureSignalsAny: [
        "real_estate_rental",
        "real_estate_purchase_residential",
        "real_estate_sale"
      ]
    },
    influences: [N, C, A, U, T, F],
    promptLabelAuthority: "structure"
  },
  finance_insurance: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["finance_insurance"],
      structureSignalsAll: ["insurance"],
      trustClassesAny: ["high_trust", "regulated"]
    },
    influences: [N, C, A, U, T, L, F],
    promptLabelAuthority: "structure"
  },
  travel_hospitality: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["travel_hospitality"],
      structureSignalsAny: ["individual_travel", "group_or_business_travel"]
    },
    influences: [N, C, A, U, T, L, F],
    promptLabelAuthority: "structure"
  },
  restaurant_food_catering: {
    specificityTier: "industry",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["food_beauty_lifestyle"],
      resolvedTopicSubtypeKeysAny: ["food_dining"]
    },
    influences: [N, C, A, U, T, F]
  },
  beauty_wellness: {
    specificityTier: "industry",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["food_beauty_lifestyle"],
      resolvedTopicSubtypeKeysAny: ["beauty_wellness"],
      structureSignalsNone: ["adult_healthcare"]
    },
    influences: [N, C, A, U, T, L]
  },
  construction_home_service: {
    specificityTier: "industry",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["construction_home_service"],
      structureSignalsNone: ["urgent_service"]
    },
    influences: [N, C, A, U, T, O, F]
  },
  manufacturing_industrial: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["manufacturing_industrial"],
      structureSignalsAll: ["manufacturing_capex"]
    },
    influences: [N, C, A, U, T, O],
    promptLabelAuthority: "structure"
  },
  logistics_supply_chain: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["logistics_supply_chain"],
      structureSignalsAll: ["logistics_shipper_buying"]
    },
    influences: [N, C, A, U, T, O],
    promptLabelAuthority: "structure"
  },
  automotive_mobility: {
    specificityTier: "industry",
    allowedLaneKeys: [
      "market_discovery",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic"
    ],
    applicability: { primaryBusinessDomainsAny: ["automotive_mobility"] },
    influences: [N, C, A, U, T, L, O]
  },
  media_content_advertising: {
    specificityTier: "structure_motion",
    allowedLaneKeys: [
      "market_discovery",
      "market_comparison",
      "criteria_explanation",
      "action_readiness",
      "trust_risk_diagnostic",
      "self_branded_perception",
      "forced_citation_validation"
    ],
    applicability: {
      primaryBusinessDomainsAny: ["media_content"],
      structureSignalsAll: ["media_brand"]
    },
    influences: [N, C, A, U, T, L, O],
    sides: [
      "end_user_or_beneficiary",
      "payer_or_sponsor",
      "partner_or_intermediary"
    ],
    promptLabelAuthority: "structure"
  }
} as const satisfies Readonly<
  Record<RecoraTopicPackKeyV3, FixedPackPolicyDefinitionV3>
>;

const REQUIRED_ROW_OVERRIDES = [
  "primaryCoverage",
  "measurementLane",
  "semanticGroupKey",
  "customerFacingNameTemplate",
  "expectedEntityTypes",
  "expectedAnswerShapes",
  "questionActs",
  "applicability"
] as const;

function materializePackPolicy(
  pack: RecoraTopicPackKeyV3
): RecoraTopicPackPolicyV3 {
  const definition: FixedPackPolicyDefinitionV3 =
    RECORA_TOPIC_FIXED_PACK_POLICY_DEFINITIONS_V3[pack];
  const applicability: RecoraTopicBlueprintApplicabilityV3 = {
    ...EMPTY_APPLICABILITY,
    ...(definition.applicability ?? {})
  };
  const useStructureLabel =
    definition.promptLabelAuthority === "structure" ||
    applicability.structureSignalsAll !== null ||
    applicability.structureSignalsAny !== null;
  return {
    pack,
    specificityTier: definition.specificityTier,
    defaultApplicability: applicability,
    defaultPersonaInfluencesAny: definition.influences,
    defaultPersonaRoleFamiliesAny: definition.roles ?? null,
    defaultMarketSidesAny: definition.sides ?? null,
    allowedLaneKeys: definition.allowedLaneKeys,
    defaultExpectedEntityTypes: ["service"],
    defaultExpectedAnswerShapes: ["evaluation_criteria"],
    promptSubjectLabelRule: useStructureLabel
      ? {
          kind: "structure_signal",
          bindingKey: "recora_prompt_subject_structure_binding_v1"
        }
      : {
          kind: "domain_offering",
          bindingKey: "recora_prompt_subject_domain_offering_binding_v1"
        },
    requiredRowOverrides: REQUIRED_ROW_OVERRIDES
  };
}

export const RECORA_TOPIC_PACK_POLICIES_V3 = RECORA_TOPIC_PACK_KEYS.map(
  materializePackPolicy
);

function influencesForCoverage(
  coverage: RecoraTopicCoverageDimensionV3
) {
  if (coverage === "T1") return [N, C] as const;
  if (coverage === "T2") return [C, L] as const;
  if (coverage === "T3") return [U, A] as const;
  if (coverage === "T4") return [A] as const;
  if (coverage === "T5") return [T] as const;
  return [O, U] as const;
}

export const RECORA_TOPIC_REVIEWED_SECONDARY_COVERAGE_V3: Readonly<
  Record<string, readonly RecoraTopicCoverageDimensionV3[]>
> = {};

export const RECORA_TOPIC_CANONICAL_SEMANTIC_GROUP_KEYS_V3 = [
  "discovery.need",
  "discovery.candidate",
  "comparison.candidate",
  "comparison.alternative",
  "fit.use_case",
  "fit.target_user",
  "fit.cost",
  "fit.compatibility",
  "fit.general",
  "action.purchase",
  "action.contract",
  "action.booking",
  "action.application",
  "action.readiness",
  "operation.implementation",
  "lifecycle.continuation",
  "local.access",
  "trust.reputation",
  "trust.credentials",
  "trust.evidence",
  "trust.price_clarity",
  "trust.risk",
  "trust.general",
  "citation.evidence",
  "subject.perception",
  "service.specific"
] as const;

function canonicalSemanticGroupKey(
  blueprintKey: string,
  family: RecoraTopicBlueprintV3["family"],
  semanticVariantKey: string
): typeof RECORA_TOPIC_CANONICAL_SEMANTIC_GROUP_KEYS_V3[number] {
  const value = `${blueprintKey}.${semanticVariantKey}`.toLowerCase();
  if (family === "need_discovery") return "discovery.need";
  if (family === "candidate_discovery") return "discovery.candidate";
  if (family === "comparison") return "comparison.candidate";
  if (family === "alternative_search") return "comparison.alternative";
  if (family === "fit_and_selection") {
    if (
      /(use_case|need_scope|problem_scope|workflow_fit|product_need_fit|care_need_scope)/.test(
        value
      )
    ) {
      return "fit.use_case";
    }
    if (/(target|recipient|beneficiary|audience|household)/.test(value)) {
      return "fit.target_user";
    }
    if (/(price|cost|budget|affordability|finance|unit_economics)/.test(value)) {
      return "fit.cost";
    }
    if (/(compatib|integration|environment|spec)/.test(value)) {
      return "fit.compatibility";
    }
    return "fit.general";
  }
  if (family === "pricing_and_value") return "fit.cost";
  if (family === "action_readiness") {
    if (/(purchase|delivery|returns|exchange)/.test(value)) return "action.purchase";
    if (/(contract|subscription|renewal|cancel|pause|plan_change)/.test(value)) {
      return "action.contract";
    }
    if (/(booking|reservation|visit|appointment|availability)/.test(value)) {
      return "action.booking";
    }
    if (/(application|enrollment|onboarding|registration)/.test(value)) {
      return "action.application";
    }
    return "action.readiness";
  }
  if (family === "implementation_and_operation") {
    return "operation.implementation";
  }
  if (family === "continuation_and_switching") {
    return "lifecycle.continuation";
  }
  if (family === "local_and_regional") return "local.access";
  if (family === "regulated_risk") return "trust.risk";
  if (family === "trust_and_reputation") {
    if (/(review|reputation|social_proof)/.test(value)) return "trust.reputation";
    if (/(qualification|license|credential|registration)/.test(value)) {
      return "trust.credentials";
    }
    if (/(evidence|proof|track_record|official|disclosure|audit)/.test(value)) {
      return "trust.evidence";
    }
    if (/(price|fee|cost|charge)/.test(value)) return "trust.price_clarity";
    return "trust.general";
  }
  if (family === "citation_and_evidence") return "citation.evidence";
  if (family === "branded_perception") return "subject.perception";
  return "service.specific";
}

export const RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3: Readonly<
  Record<RecoraTopicPackKeyV3, number>
> = {
  common_discovery: 14,
  common_comparison: 8,
  common_fit_action: 23,
  common_trust_continuation: 16,
  diagnostic_brand_citation: 8,
  b2b_buying: 10,
  b2c_decision: 8,
  both_audience: 5,
  family_proxy: 6,
  agency_delivery: 7,
  b2b2c: 6,
  marketplace_demand: 6,
  marketplace_supply: 7,
  marketplace_operator: 7,
  multi_location: 6,
  franchise: 6,
  subscription_membership: 5,
  urgent_service: 5,
  public_nonprofit: 6,
  manufacturer_channel: 6,
  company_brand: 4,
  offering_service: 14,
  offering_product: 5,
  location_facility: 8,
  professional_person: 5,
  saas_software: 8,
  commerce_product: 8,
  publisher_content: 3,
  enterprise_it_security: 7,
  healthcare_clinic: 7,
  care_welfare: 6,
  education_school: 7,
  professional_service: 6,
  recruiting_hr: 6,
  real_estate: 19,
  finance_insurance: 8,
  travel_hospitality: 5,
  restaurant_food_catering: 5,
  beauty_wellness: 5,
  construction_home_service: 6,
  manufacturing_industrial: 6,
  logistics_supply_chain: 6,
  automotive_mobility: 6,
  media_content_advertising: 7
};

const POLICY_BY_PACK = new Map(
  RECORA_TOPIC_PACK_POLICIES_V3.map((item) => [item.pack, item])
);

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return Array.from(new Set(values));
}

function mergeApplicability(
  base: RecoraTopicBlueprintApplicabilityV3,
  override: Partial<RecoraTopicBlueprintApplicabilityV3> | undefined,
  blueprintKey: string
): RecoraTopicBlueprintApplicabilityV3 {
  if (!override) return { ...base };
  const result = { ...base } as RecoraTopicBlueprintApplicabilityV3;
  const baseRecord = base as unknown as Record<
    string,
    readonly string[] | null
  >;
  const overrideRecord = override as unknown as Record<
    string,
    readonly string[] | null | undefined
  >;
  const resultRecord = result as unknown as Record<
    string,
    readonly string[] | null
  >;

  for (const field of Object.keys(baseRecord)) {
    const next = overrideRecord[field];
    if (next === undefined) continue;
    const parent = baseRecord[field];
    if (next === null) {
      if (parent !== null) {
        throw new Error(
          `topic_pack_applicability_relaxed:${blueprintKey}:${field}`
        );
      }
      resultRecord[field] = null;
      continue;
    }
    if (next.length === 0) {
      throw new Error(`topic_applicability_empty:${blueprintKey}:${field}`);
    }
    if (parent !== null) {
      const parentValues = new Set(parent);
      if (next.some((value) => !parentValues.has(value))) {
        throw new Error(
          `topic_pack_applicability_broadened:${blueprintKey}:${field}`
        );
      }
    }
    resultRecord[field] = next;
  }
  return result;
}

function hasConstraint(
  value: RecoraTopicBlueprintApplicabilityV3
): boolean {
  return Object.values(value).some((item) => item !== null);
}

function coverageDimensions(
  blueprintKey: string,
  primary: RecoraTopicCoverageDimensionV3,
  requested?: readonly RecoraTopicCoverageDimensionV3[]
) {
  return unique([
    primary,
    ...(RECORA_TOPIC_REVIEWED_SECONDARY_COVERAGE_V3[blueprintKey] ?? []),
    ...(requested ?? [])
  ]);
}

function buildBlueprint(
  row: RecoraTopicBlueprintSourceRowV3,
  index: number
): RecoraTopicBlueprintV3 {
  const [
    pack,
    blueprintKey,
    name,
    family,
    primaryCoverage,
    measurementLane,
    semanticGroupKey,
    entities,
    shapes,
    acts,
    options
  ] = row;
  const policy = POLICY_BY_PACK.get(pack);
  if (!policy) throw new Error(`topic_pack_policy_missing:${pack}`);

  const applicability = mergeApplicability(
    policy.defaultApplicability,
    options?.applicability,
    blueprintKey
  );
  const kind =
    options?.kind ??
    (blueprintKey === "diagnostic.natural_citation_observation"
      ? "observation_overlay"
      : hasConstraint(applicability)
        ? "conditional"
        : "selectable");
  const lanePolicy =
    RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3[measurementLane];
  const tier = options?.specificityTier ?? policy.specificityTier;

  return {
    catalogVersion: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
    blueprintKey,
    pack,
    kind,
    specificityTier: tier,
    family,
    primaryCoverage,
    coverageDimensions: coverageDimensions(
      blueprintKey,
      primaryCoverage,
      options?.coverageDimensions
    ),
    customerFacingNameTemplateKey:
      options?.customerFacingNameTemplateKey ?? `topic_name.${blueprintKey}`,
    customerFacingNameTemplate: name,
    internalSummary: options?.internalSummary ?? name,
    promptSubjectLabelRule:
      measurementLane === "self_branded_perception"
        ? {
            kind: "primary_subject_name",
            allowedLanes: ["self_branded_perception"]
          }
        : options?.promptSubjectLabelRule ?? policy.promptSubjectLabelRule,
    semanticGroupKey: canonicalSemanticGroupKey(
      blueprintKey,
      family,
      options?.semanticGroupKey ?? semanticGroupKey
    ),
    semanticVariantKey: options?.semanticGroupKey ?? semanticGroupKey,
    applicability,
    personaInfluencesAny:
      options?.personaInfluencesAny ??
      policy.defaultPersonaInfluencesAny ??
      influencesForCoverage(primaryCoverage),
    personaRoleFamiliesAny:
      options?.personaRoleFamiliesAny ??
      policy.defaultPersonaRoleFamiliesAny,
    marketSidesAny: options?.marketSidesAny ?? policy.defaultMarketSidesAny,
    measurementGoal: options?.measurementGoal ?? name,
    expectedEntityTypes: entities,
    comparisonAxes: options?.comparisonAxes ?? [name],
    expectedAnswerShapes:
      kind === "observation_overlay"
        ? lanePolicy.allowedResponseShapes
        : options?.expectedAnswerShapes ?? shapes,
    questionActs:
      kind === "observation_overlay"
        ? lanePolicy.allowedQuestionActs
        : options?.questionActs ?? acts,
    measurementLane,
    fixedOrder: index + 1
  };
}

export const RECORA_TOPIC_BLUEPRINT_CATALOG_V3 =
  RECORA_TOPIC_ALL_SOURCE_ROWS_V3.map(buildBlueprint);

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) result.add(value);
    seen.add(value);
  }
  return Array.from(result);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function nonEmptyArrays(
  value: RecoraTopicBlueprintApplicabilityV3
): boolean {
  return Object.values(value).every(
    (item) => !Array.isArray(item) || item.length > 0
  );
}

function validateBlueprint(
  item: RecoraTopicBlueprintV3,
  blockers: string[]
) {
  if (
    !item.blueprintKey ||
    !item.customerFacingNameTemplate ||
    !item.semanticGroupKey ||
    !item.measurementGoal
  ) {
    blockers.push(`required_field_missing:${item.blueprintKey}`);
  }
  if (
    !item.expectedEntityTypes.length ||
    !item.expectedAnswerShapes.length ||
    !item.questionActs.length ||
    !item.coverageDimensions.length
  ) {
    blockers.push(`required_array_empty:${item.blueprintKey}`);
  }
  if (!nonEmptyArrays(item.applicability)) {
    blockers.push(`applicability_empty_array:${item.blueprintKey}`);
  }

  const policy = POLICY_BY_PACK.get(item.pack);
  if (!policy?.allowedLaneKeys.includes(item.measurementLane)) {
    blockers.push(`pack_lane_invalid:${item.blueprintKey}`);
  }

  const lane = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3[item.measurementLane];
  if (
    item.expectedAnswerShapes.some(
      (value) => !lane.allowedResponseShapes.includes(value)
    )
  ) {
    blockers.push(`answer_shape_lane_mismatch:${item.blueprintKey}`);
  }
  if (
    item.questionActs.some((value) => !lane.allowedQuestionActs.includes(value))
  ) {
    blockers.push(`question_act_lane_mismatch:${item.blueprintKey}`);
  }
  if (
    item.kind === "observation_overlay" &&
    lane.laneKind !== "observation_overlay"
  ) {
    blockers.push(`overlay_lane_kind_invalid:${item.blueprintKey}`);
  }
  if (
    item.kind !== "observation_overlay" &&
    lane.laneKind === "observation_overlay"
  ) {
    blockers.push(`selectable_overlay_lane_invalid:${item.blueprintKey}`);
  }
}

export function validateRecoraMeasurementTopicCatalogV3() {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const catalog = RECORA_TOPIC_BLUEPRINT_CATALOG_V3;

  if (catalog.length !== RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT) {
    blockers.push(
      `blueprint_count:${catalog.length}:${RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT}`
    );
  }
  if (
    RECORA_TOPIC_PACK_POLICIES_V3.length !==
    RECORA_TOPIC_PACK_EXPECTED_COUNT
  ) {
    blockers.push(
      `pack_policy_count:${RECORA_TOPIC_PACK_POLICIES_V3.length}:${RECORA_TOPIC_PACK_EXPECTED_COUNT}`
    );
  }
  if (
    new Set(RECORA_TOPIC_PACK_POLICIES_V3.map((policy) => policy.pack))
      .size !== RECORA_TOPIC_PACK_EXPECTED_COUNT
  ) {
    blockers.push("pack_policy_key_duplicate");
  }
  if (
    RECORA_TOPIC_COMMON_SOURCE_ROWS_V3.length !== 69 ||
    RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3.length !== 96 ||
    RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3.length !== 167
  ) {
    blockers.push(
      `source_partition_count:${RECORA_TOPIC_COMMON_SOURCE_ROWS_V3.length}:${RECORA_TOPIC_STRUCTURE_SOURCE_ROWS_V3.length}:${RECORA_TOPIC_INDUSTRY_SOURCE_ROWS_V3.length}`
    );
  }

  for (const pack of RECORA_TOPIC_PACK_KEYS) {
    const actual = catalog.filter((item) => item.pack === pack).length;
    if (actual !== RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3[pack]) {
      blockers.push(
        `pack_item_count:${pack}:${actual}:${RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3[pack]}`
      );
    }
  }

  for (const value of duplicates(catalog.map((item) => item.blueprintKey))) {
    blockers.push(`blueprint_key_duplicate:${value}`);
  }
  for (const value of duplicates(catalog.map((item) => String(item.fixedOrder)))) {
    blockers.push(`fixed_order_duplicate:${value}`);
  }

  const overlay = catalog.filter(
    (item) => item.kind === "observation_overlay"
  );
  if (overlay.length !== RECORA_TOPIC_OBSERVATION_OVERLAY_EXPECTED_COUNT) {
    blockers.push(`observation_overlay_count:${overlay.length}`);
  }
  if (
    overlay[0]?.blueprintKey !==
      "diagnostic.natural_citation_observation" ||
    overlay[0]?.measurementLane !== "natural_citation_overlay"
  ) {
    blockers.push("natural_citation_overlay_contract_mismatch");
  }

  for (const item of catalog) validateBlueprint(item, blockers);

  const keys = new Set(catalog.map((item) => item.blueprintKey));
  for (const legacy of RECORA_LEGACY_TOPIC_MIGRATION_V3) {
    if (keys.has(legacy.legacyKey)) {
      blockers.push(`legacy_key_reused:${legacy.legacyKey}`);
    }
    for (const target of legacy.successorBlueprintKeys) {
      if (!keys.has(target)) {
        blockers.push(`legacy_successor_missing:${legacy.legacyKey}:${target}`);
      }
    }
  }

  if (!hasCompletePrimaryActionBindingV1()) {
    blockers.push("primary_action_binding_incomplete");
  }
  for (const [action, key] of Object.entries(
    RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1
  )) {
    const item = catalog.find((value) => value.blueprintKey === key);
    if (
      !item ||
      item.primaryCoverage !== "T4" ||
      item.measurementLane !== "action_readiness" ||
      !item.applicability.primaryActionsAny?.includes(
        action as RecoraCustomerAction
      )
    ) {
      blockers.push(`action_binding_invalid:${action}:${key}`);
    }
  }

  if (
    !hasCompleteStructureSubjectBindingV1() ||
    Object.keys(RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1).length !==
      RECORA_GENERATION_STRUCTURE_SIGNALS.length
  ) {
    blockers.push("structure_subject_binding_incomplete");
  }

  for (const binding of RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1) {
    if (!keys.has(binding.blueprintKey)) {
      blockers.push(`domain_offering_target_missing:${binding.blueprintKey}`);
    }
  }
  for (const alias of RECORA_TOPIC_ALIAS_REGISTRY_JA_V1) {
    for (const key of alias.targetBlueprintKeys) {
      if (!keys.has(key)) {
        blockers.push(`alias_target_missing:${alias.mappingKey}:${key}`);
      }
    }
  }

  const canonicalGroups = new Set(
    RECORA_TOPIC_CANONICAL_SEMANTIC_GROUP_KEYS_V3
  );
  const exact = new Map<string, string>();
  for (const item of catalog) {
    if (!canonicalGroups.has(item.semanticGroupKey as never)) {
      blockers.push(`canonical_semantic_group_unknown:${item.blueprintKey}`);
    }
    if (!item.semanticVariantKey) {
      blockers.push(`semantic_variant_missing:${item.blueprintKey}`);
    }
    const signature = stableJson({
      kind: item.kind,
      family: item.family,
      primaryCoverage: item.primaryCoverage,
      coverageDimensions: item.coverageDimensions,
      semanticGroupKey: item.semanticGroupKey,
      semanticVariantKey: item.semanticVariantKey,
      entities: item.expectedEntityTypes,
      shapes: item.expectedAnswerShapes,
      questionActs: item.questionActs,
      lane: item.measurementLane,
      applicability: item.applicability,
      personaInfluencesAny: item.personaInfluencesAny,
      personaRoleFamiliesAny: item.personaRoleFamiliesAny,
      marketSidesAny: item.marketSidesAny
    });
    const previous = exact.get(signature);
    if (previous) {
      blockers.push(`exact_duplicate:${previous}:${item.blueprintKey}`);
    } else {
      exact.set(signature, item.blueprintKey);
    }
  }

  const coverageInventory = Object.fromEntries(
    RECORA_TOPIC_COVERAGE_DIMENSIONS.map((coverage) => [
      coverage,
      catalog.filter((item) => item.coverageDimensions.includes(coverage)).length
    ])
  ) as Record<RecoraTopicCoverageDimensionV3, number>;
  for (const coverage of RECORA_TOPIC_COVERAGE_DIMENSIONS) {
    if (coverageInventory[coverage] < 1) {
      blockers.push(`coverage_inventory_empty:${coverage}`);
    }
  }

  const natural =
    RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.natural_citation_overlay;
  if (
    natural.laneKind !== "observation_overlay" ||
    natural.allowedMetricKeys.join(",") !== "naturalCitationObservation" ||
    !natural.forbiddenMetricKeys.includes("forcedCitationValidation")
  ) {
    blockers.push("natural_citation_lane_boundary_invalid");
  }

  const forced =
    RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.forced_citation_validation;
  if (
    forced.allowedMetricKeys.join(",") !== "forcedCitationValidation" ||
    !forced.forbiddenMetricKeys.includes("naturalCitationObservation")
  ) {
    blockers.push("forced_citation_lane_boundary_invalid");
  }

  const branded =
    RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.self_branded_perception;
  for (const key of ["visibility", "ranking", "sov"] as const) {
    if (!branded.forbiddenMetricKeys.includes(key)) {
      blockers.push(`self_branded_metric_boundary_missing:${key}`);
    }
  }

  if (!RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION) {
    blockers.push("overlay_policy_version_missing");
  }

  return {
    valid: blockers.length === 0,
    blockers: unique(blockers),
    warnings: unique(warnings),
    counts: {
      blueprints: catalog.length,
      packs: new Set(catalog.map((item) => item.pack)).size,
      observationOverlays: overlay.length,
      coverageInventory
    }
  };
}

export function getRecoraMeasurementTopicBlueprintV3(
  blueprintKey: string
): RecoraTopicBlueprintV3 | null {
  return (
    RECORA_TOPIC_BLUEPRINT_CATALOG_V3.find(
      (item) => item.blueprintKey === blueprintKey
    ) ?? null
  );
}
