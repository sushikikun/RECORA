from __future__ import annotations

from pathlib import Path

CATALOG = Path("lib/recora/measurement-topic-catalog.ts")
CONTRACT = Path("lib/recora/measurement-topic-contract.ts")
INDUSTRY = Path("lib/recora/measurement-topic-catalog-industry.ts")
VERIFY = Path("scripts/verify-recora-measurement-topic-catalog.ts")
DOC = Path("docs/architecture/measurement-design/recora_measurement_topic_catalog_v3_ja.md")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"{path}: expected exactly one match, got {count}\nTARGET:\n{old[:500]}"
        )
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


def replace_section(path: Path, start_marker: str, end_marker: str, replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    path.write_text(
        text[:start] + replacement.rstrip() + "\n\n" + text[end:],
        encoding="utf-8",
        newline="\n",
    )


replace_once(
    CONTRACT,
    "  semanticGroupKey: string;\n  applicability: RecoraTopicBlueprintApplicabilityV3;",
    "  semanticGroupKey: string;\n  semanticVariantKey: string;\n  applicability: RecoraTopicBlueprintApplicabilityV3;",
)

fixed_policy_section = r'''type FixedPackPolicyDefinitionV3 = {
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
  const definition = RECORA_TOPIC_FIXED_PACK_POLICY_DEFINITIONS_V3[pack];
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
}'''

replace_section(
    CATALOG,
    "const COMMON_PACKS =",
    "export const RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3",
    fixed_policy_section,
)

merge_applicability = r'''function mergeApplicability(
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
}'''
replace_section(CATALOG, "function mergeApplicability(", "function hasConstraint(", merge_applicability)

coverage_function = r'''function coverageDimensions(
  blueprintKey: string,
  primary: RecoraTopicCoverageDimensionV3,
  requested?: readonly RecoraTopicCoverageDimensionV3[]
) {
  return unique([
    primary,
    ...(RECORA_TOPIC_REVIEWED_SECONDARY_COVERAGE_V3[blueprintKey] ?? []),
    ...(requested ?? [])
  ]);
}'''
replace_section(CATALOG, "function coverageDimensions(", "function buildBlueprint(", coverage_function)

replace_once(
    CATALOG,
    "    policy.defaultApplicability,\n    options?.applicability\n  );",
    "    policy.defaultApplicability,\n    options?.applicability,\n    blueprintKey\n  );",
)
replace_once(
    CATALOG,
    "    coverageDimensions: coverageDimensions(\n      primaryCoverage,\n      family,\n      measurementLane,\n      tier,\n      options?.coverageDimensions\n    ),",
    "    coverageDimensions: coverageDimensions(\n      blueprintKey,\n      primaryCoverage,\n      options?.coverageDimensions\n    ),",
)
replace_once(
    CATALOG,
    "    semanticGroupKey: options?.semanticGroupKey ?? semanticGroupKey,\n    applicability,",
    "    semanticGroupKey: canonicalSemanticGroupKey(\n      blueprintKey,\n      family,\n      options?.semanticGroupKey ?? semanticGroupKey\n    ),\n    semanticVariantKey: options?.semanticGroupKey ?? semanticGroupKey,\n    applicability,",
)
replace_once(
    CATALOG,
    "    personaInfluencesAny:\n      options?.personaInfluencesAny ?? influencesForCoverage(primaryCoverage),",
    "    personaInfluencesAny:\n      options?.personaInfluencesAny ??\n      policy.defaultPersonaInfluencesAny ??\n      influencesForCoverage(primaryCoverage),",
)

exact_validation = r'''  const canonicalGroups = new Set(
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

'''
replace_section(CATALOG, "  const exact = new Map<string, string>();", "  const coverageInventory", exact_validation)

old_minimum = '''  const minimum: Record<RecoraTopicCoverageDimensionV3, number> = {
    T1: 45,
    T2: 45,
    T3: 55,
    T4: 45,
    T5: 60,
    T6: 100
  };
  for (const coverage of RECORA_TOPIC_COVERAGE_DIMENSIONS) {
    if (coverageInventory[coverage] < minimum[coverage]) {
      blockers.push(
        `coverage_inventory_low:${coverage}:${coverageInventory[coverage]}:${minimum[coverage]}`
      );
    }
  }
'''
new_minimum = '''  for (const coverage of RECORA_TOPIC_COVERAGE_DIMENSIONS) {
    if (coverageInventory[coverage] < 1) {
      blockers.push(`coverage_inventory_empty:${coverage}`);
    }
  }
'''
replace_once(CATALOG, old_minimum, new_minimum)

replace_once(
    INDUSTRY,
    '["location.facility_equipment_environment","設備・個室・衛生・環境・利用条件","implementation_and_operation","T6","criteria_explanation",["product","comparison_criterion","operational_requirement"]]',
    '["location.facility_equipment_environment","設備・個室・衛生・環境・利用条件","implementation_and_operation","T6","criteria_explanation",["location_facility","comparison_criterion","operational_requirement"]]',
)
replace_once(
    INDUSTRY,
    '["finance.need_product_discovery","目的に対応する金融商品・保障・相談先の種類","candidate_discovery","T1","market_discovery",["service","price_fee","solution_category"]]',
    '["finance.need_product_discovery","目的に対応する金融商品・保障・相談先の種類","candidate_discovery","T1","market_discovery",["product","service","professional_person","solution_category"]]',
)
replace_once(
    INDUSTRY,
    '["home_service.contractor_discovery","修理・施工・改修内容に対応できる事業者候補","candidate_discovery","T1","market_discovery",["service","contract_condition","solution_category"]]',
    '["home_service.contractor_discovery","修理・施工・改修内容に対応できる事業者候補","candidate_discovery","T1","market_discovery",["company","service","solution_category"]]',
)

verify_import_old = '''  RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT,
  RECORA_TOPIC_COVERAGE_DIMENSIONS,
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,'''
verify_import_new = '''  RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT,
  RECORA_TOPIC_COVERAGE_DIMENSIONS,
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,'''
# no contract import change is needed here

replace_once(
    VERIFY,
    '''  RECORA_TOPIC_BLUEPRINT_CATALOG_V3,
  RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3,
  getRecoraMeasurementTopicBlueprintV3,
  validateRecoraMeasurementTopicCatalogV3
} from "../lib/recora/measurement-topic-catalog";''',
    '''  RECORA_TOPIC_BLUEPRINT_CATALOG_V3,
  RECORA_TOPIC_CANONICAL_SEMANTIC_GROUP_KEYS_V3,
  RECORA_TOPIC_EXPECTED_PACK_COUNTS_V3,
  RECORA_TOPIC_PACK_POLICIES_V3,
  getRecoraMeasurementTopicBlueprintV3,
  validateRecoraMeasurementTopicCatalogV3
} from "../lib/recora/measurement-topic-catalog";''',
)

verifier_checks = r'''
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
'''
replace_once(VERIFY, "console.log(\n", verifier_checks + "\nconsole.log(\n")

appendix = r'''

## 20. Human Reviewで固定したCatalog authority

Child AのHuman Reviewでは、Catalog自身の行からPolicyを逆算して誤りを正当化しないよう、次を固定した。

```text
44 Pack Policy
→ Source Rowとは独立した固定データ

Row applicability override
→ Pack条件を狭めることだけ許可
→ null化・許可外値追加はCatalog build時に失敗

Secondary Coverage
→ Blueprint primaryCoverage
  ＋ review済み固定Registry
  ＋ 行別明示
→ tierだけを理由にT3/T5をT6へ昇格しない

Semantic identity
→ canonical semantic group
  ＋ semantic variant
→ 共通候補と業種固有候補のspecializationを比較可能にする

Exact duplicate
→ 日本語表示名ではなく、Lane・Entity・Question Act・Applicability・
   Persona authority・semantic identityで判定
```

特に、Marketplaceの需要側・供給側・運営側、ECの販売経路、店舗の地理条件、高信頼領域のtrust条件をPack authorityとして保持する。
'''
text = DOC.read_text(encoding="utf-8")
if "## 20. Human Reviewで固定したCatalog authority" not in text:
    DOC.write_text(text.rstrip() + appendix + "\n", encoding="utf-8", newline="\n")

print("Topic Catalog Human Review patch applied")
