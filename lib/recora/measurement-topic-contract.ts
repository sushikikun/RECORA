import {
  RECORA_CUSTOMER_ACTIONS,
  RECORA_GENERATION_STRUCTURE_SIGNALS
} from "./prompt-generation-input";
import type {
  RecoraAudiencePriority,
  RecoraAudienceScope,
  RecoraBusinessDomain,
  RecoraCommerceChannel,
  RecoraCommerceRole,
  RecoraCustomerAction,
  RecoraDecisionImpactFlag,
  RecoraDerivedTrustClass,
  RecoraGenerationCustomerSide,
  RecoraGenerationStructureSignal,
  RecoraGeographicBinding,
  RecoraLifecycleSignal,
  RecoraLocationStructure,
  RecoraOfferingModel,
  RecoraRegulatoryFlag,
  RecoraSensitiveContext,
  RecoraServiceCoverage,
  RecoraSubjectType
} from "./prompt-generation-input";
import type {
  RecoraPersonaRoleFamily,
  RecoraPersonaTopicInfluenceDimension
} from "./measurement-persona-contract";
import {
  RECORA_PROMPT_METRIC_KEYS,
  RECORA_QUESTION_ACTS
} from "./prompt-measurement-contract";
import type {
  RecoraPromptMetricKey,
  RecoraPromptPanelRole,
  RecoraQuestionAct
} from "./prompt-measurement-contract";
import type {
  RecoraMeasurementPurpose,
  RecoraPromptType
} from "./prompt-scope";

export const RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION =
  "recora_topic_blueprint_catalog_ja_v3" as const;
export const RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION =
  "recora_measurement_topic_compiler_v1" as const;
export const RECORA_TOPIC_SELECTION_SEMANTICS_VERSION =
  "recora_topic_selection_semantics_v1" as const;
export const RECORA_TOPIC_PACK_POLICY_VERSION =
  "recora_topic_pack_policy_ja_v1" as const;
export const RECORA_TOPIC_RECIPE_MAPPING_VERSION =
  "recora_topic_recipe_mapping_ja_v1" as const;
export const RECORA_TOPIC_PRIMARY_ACTION_BINDING_VERSION =
  "recora_topic_primary_action_binding_v1" as const;
export const RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION =
  "recora_topic_domain_offering_binding_v1" as const;
export const RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_VERSION =
  "recora_prompt_subject_structure_binding_v1" as const;
export const RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION =
  "recora_prompt_subject_domain_offering_binding_v1" as const;
export const RECORA_TOPIC_ALIAS_REGISTRY_VERSION =
  "recora_topic_alias_registry_ja_v1" as const;
export const RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION =
  "recora_natural_citation_overlay_policy_v1" as const;
export const RECORA_TOPIC_MEASUREMENT_LANE_POLICY_VERSION =
  "recora_topic_measurement_lane_policy_v1" as const;

export const RECORA_TOPIC_BLUEPRINT_EXPECTED_COUNT = 332 as const;
export const RECORA_TOPIC_PACK_EXPECTED_COUNT = 44 as const;
export const RECORA_TOPIC_OBSERVATION_OVERLAY_EXPECTED_COUNT = 1 as const;

export const RECORA_TOPIC_COVERAGE_DIMENSIONS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6"
] as const;

export const RECORA_TOPIC_FAMILIES = [
  "need_discovery",
  "candidate_discovery",
  "comparison",
  "alternative_search",
  "fit_and_selection",
  "pricing_and_value",
  "action_readiness",
  "implementation_and_operation",
  "continuation_and_switching",
  "local_and_regional",
  "trust_and_reputation",
  "regulated_risk",
  "citation_and_evidence",
  "branded_perception",
  "service_specific"
] as const;

export const RECORA_TOPIC_SPECIFICITY_TIERS = [
  "structure_motion",
  "industry",
  "offering_subject",
  "audience",
  "common"
] as const;

export const RECORA_TOPIC_BLUEPRINT_KINDS = [
  "selectable",
  "conditional",
  "observation_overlay"
] as const;

export const RECORA_TOPIC_MEASUREMENT_LANE_KEYS = [
  "market_discovery",
  "market_comparison",
  "criteria_explanation",
  "action_readiness",
  "trust_risk_diagnostic",
  "self_branded_perception",
  "natural_citation_overlay",
  "forced_citation_validation",
  "named_entity_comparison_diagnostic"
] as const;

export const RECORA_TOPIC_EXPECTED_ENTITY_TYPES = [
  "solution_category",
  "company",
  "brand",
  "service",
  "product",
  "location_facility",
  "professional_person",
  "marketplace_listing",
  "market_side_participant",
  "comparison_criterion",
  "price_fee",
  "contract_condition",
  "action_requirement",
  "implementation_requirement",
  "operational_requirement",
  "qualification_registration",
  "risk_caution",
  "review_reputation_signal",
  "evidence_source",
  "official_information",
  "lifecycle_condition"
] as const;

export const RECORA_TOPIC_EXPECTED_ANSWER_SHAPES = [
  "candidate_list",
  "ranked_recommendation",
  "comparative_set",
  "evaluation_criteria",
  "explanatory_answer",
  "evidence_answer",
  "branded_sentiment_answer"
] as const;

export const RECORA_RESOLVED_TOPIC_SUBTYPE_KEYS = [
  "food_dining",
  "beauty_wellness",
  "other_lifestyle"
] as const;

export const RECORA_TOPIC_ROW_OVERRIDE_FIELDS = [
  "primaryCoverage",
  "measurementLane",
  "semanticGroupKey",
  "customerFacingNameTemplate",
  "expectedEntityTypes",
  "expectedAnswerShapes",
  "questionActs",
  "applicability"
] as const;

export const RECORA_TOPIC_PACK_KEYS = [
  "common_discovery",
  "common_comparison",
  "common_fit_action",
  "common_trust_continuation",
  "diagnostic_brand_citation",
  "b2b_buying",
  "b2c_decision",
  "both_audience",
  "family_proxy",
  "agency_delivery",
  "b2b2c",
  "marketplace_demand",
  "marketplace_supply",
  "marketplace_operator",
  "multi_location",
  "franchise",
  "subscription_membership",
  "urgent_service",
  "public_nonprofit",
  "manufacturer_channel",
  "company_brand",
  "offering_service",
  "offering_product",
  "location_facility",
  "professional_person",
  "saas_software",
  "commerce_product",
  "publisher_content",
  "enterprise_it_security",
  "healthcare_clinic",
  "care_welfare",
  "education_school",
  "professional_service",
  "recruiting_hr",
  "real_estate",
  "finance_insurance",
  "travel_hospitality",
  "restaurant_food_catering",
  "beauty_wellness",
  "construction_home_service",
  "manufacturing_industrial",
  "logistics_supply_chain",
  "automotive_mobility",
  "media_content_advertising"
] as const;

export type RecoraTopicCoverageDimensionV3 =
  typeof RECORA_TOPIC_COVERAGE_DIMENSIONS[number];
export type RecoraTopicFamilyV3 = typeof RECORA_TOPIC_FAMILIES[number];
export type RecoraTopicSpecificityTierV3 =
  typeof RECORA_TOPIC_SPECIFICITY_TIERS[number];
export type RecoraTopicBlueprintKindV3 =
  typeof RECORA_TOPIC_BLUEPRINT_KINDS[number];
export type RecoraTopicMeasurementLaneKeyV3 =
  typeof RECORA_TOPIC_MEASUREMENT_LANE_KEYS[number];
export type RecoraTopicExpectedEntityTypeV3 =
  typeof RECORA_TOPIC_EXPECTED_ENTITY_TYPES[number];
export type RecoraTopicExpectedAnswerShapeV3 =
  typeof RECORA_TOPIC_EXPECTED_ANSWER_SHAPES[number];
export type RecoraResolvedTopicSubtypeKeyV3 =
  typeof RECORA_RESOLVED_TOPIC_SUBTYPE_KEYS[number];
export type RecoraTopicRowOverrideFieldV3 =
  typeof RECORA_TOPIC_ROW_OVERRIDE_FIELDS[number];
export type RecoraTopicPackKeyV3 = typeof RECORA_TOPIC_PACK_KEYS[number];

export type RecoraPromptSubjectLabelRuleV3 =
  | {
      kind: "primary_subject_name";
      allowedLanes: readonly ["self_branded_perception"];
    }
  | {
      kind: "structure_signal";
      bindingKey: typeof RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_VERSION;
    }
  | {
      kind: "domain_offering";
      bindingKey: typeof RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION;
    }
  | {
      kind: "fixed_catalog_label";
      labelKey: string;
    };

export type RecoraTopicBlueprintApplicabilityV3 = {
  audienceScopesAny: readonly RecoraAudienceScope[] | null;
  audiencePrioritiesAny:
    | readonly (RecoraAudiencePriority | null)[]
    | null;
  primarySubjectTypesAny: readonly RecoraSubjectType[] | null;
  secondarySubjectTypesAny: readonly RecoraSubjectType[] | null;
  primaryBusinessDomainsAny: readonly RecoraBusinessDomain[] | null;
  secondaryBusinessDomainsAny: readonly RecoraBusinessDomain[] | null;
  primaryOfferingModelsAny: readonly RecoraOfferingModel[] | null;
  secondaryOfferingModelsAny: readonly RecoraOfferingModel[] | null;
  commerceChannelsAny: readonly RecoraCommerceChannel[] | null;
  commerceChannelsAll: readonly RecoraCommerceChannel[] | null;
  commerceRolesAny: readonly RecoraCommerceRole[] | null;
  commerceRolesAll: readonly RecoraCommerceRole[] | null;
  commerceRolesNone: readonly RecoraCommerceRole[] | null;
  primaryActionsAny: readonly RecoraCustomerAction[] | null;
  secondaryActionsAny: readonly RecoraCustomerAction[] | null;
  structureSignalsAll: readonly RecoraGenerationStructureSignal[] | null;
  structureSignalsAny: readonly RecoraGenerationStructureSignal[] | null;
  structureSignalsNone: readonly RecoraGenerationStructureSignal[] | null;
  geographicBindingsAny: readonly RecoraGeographicBinding[] | null;
  serviceCoveragesAny: readonly RecoraServiceCoverage[] | null;
  locationStructuresAny: readonly RecoraLocationStructure[] | null;
  trustClassesAny: readonly RecoraDerivedTrustClass[] | null;
  decisionImpactFlagsAny: readonly RecoraDecisionImpactFlag[] | null;
  regulatoryFlagsAny: readonly RecoraRegulatoryFlag[] | null;
  sensitiveContextsAny: readonly RecoraSensitiveContext[] | null;
  personaInfluencesAny:
    | readonly RecoraPersonaTopicInfluenceDimension[]
    | null;
  personaRoleFamiliesAny: readonly RecoraPersonaRoleFamily[] | null;
  marketSidesAny: readonly RecoraGenerationCustomerSide[] | null;
  lifecycleSignalsAny: readonly RecoraLifecycleSignal[] | null;
  lifecycleSignalsAll: readonly RecoraLifecycleSignal[] | null;
  lifecycleSignalsNone: readonly RecoraLifecycleSignal[] | null;
  resolvedTopicSubtypeKeysAny:
    | readonly RecoraResolvedTopicSubtypeKeyV3[]
    | null;
};

export type RecoraTopicBlueprintSourceRowOptionsV3 = {
  kind?: RecoraTopicBlueprintKindV3;
  specificityTier?: RecoraTopicSpecificityTierV3;
  internalSummary?: string;
  measurementGoal?: string;
  comparisonAxes?: readonly string[];
  coverageDimensions?: readonly RecoraTopicCoverageDimensionV3[];
  applicability?: Partial<RecoraTopicBlueprintApplicabilityV3>;
  personaInfluencesAny?:
    | readonly RecoraPersonaTopicInfluenceDimension[]
    | null;
  personaRoleFamiliesAny?: readonly RecoraPersonaRoleFamily[] | null;
  marketSidesAny?: readonly RecoraGenerationCustomerSide[] | null;
  promptSubjectLabelRule?: RecoraPromptSubjectLabelRuleV3;
  customerFacingNameTemplateKey?: string;
  semanticGroupKey?: string;
  expectedAnswerShapes?: readonly RecoraTopicExpectedAnswerShapeV3[];
  questionActs?: readonly RecoraQuestionAct[];
};

export type RecoraTopicBlueprintSourceRowV3 = readonly [
  pack: RecoraTopicPackKeyV3,
  blueprintKey: string,
  customerFacingNameTemplate: string,
  family: RecoraTopicFamilyV3,
  primaryCoverage: RecoraTopicCoverageDimensionV3,
  measurementLane: RecoraTopicMeasurementLaneKeyV3,
  semanticGroupKey: string,
  expectedEntityTypes: readonly RecoraTopicExpectedEntityTypeV3[],
  expectedAnswerShapes: readonly RecoraTopicExpectedAnswerShapeV3[],
  questionActs: readonly RecoraQuestionAct[],
  options?: RecoraTopicBlueprintSourceRowOptionsV3
];

export type RecoraTopicBlueprintSeedV3 = readonly [
  blueprintKey: string,
  customerFacingNameTemplate: string,
  family: RecoraTopicFamilyV3,
  primaryCoverage: RecoraTopicCoverageDimensionV3,
  measurementLane: RecoraTopicMeasurementLaneKeyV3,
  expectedEntityTypes?: readonly RecoraTopicExpectedEntityTypeV3[] | null,
  options?: RecoraTopicBlueprintSourceRowOptionsV3
];

export type RecoraTopicPackPolicyV3 = {
  pack: RecoraTopicPackKeyV3;
  specificityTier: RecoraTopicSpecificityTierV3;
  defaultApplicability: RecoraTopicBlueprintApplicabilityV3;
  defaultPersonaInfluencesAny:
    | readonly RecoraPersonaTopicInfluenceDimension[]
    | null;
  defaultPersonaRoleFamiliesAny:
    | readonly RecoraPersonaRoleFamily[]
    | null;
  defaultMarketSidesAny:
    | readonly RecoraGenerationCustomerSide[]
    | null;
  allowedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  defaultExpectedEntityTypes:
    readonly RecoraTopicExpectedEntityTypeV3[];
  defaultExpectedAnswerShapes:
    readonly RecoraTopicExpectedAnswerShapeV3[];
  promptSubjectLabelRule: RecoraPromptSubjectLabelRuleV3;
  requiredRowOverrides: readonly RecoraTopicRowOverrideFieldV3[];
};

export type RecoraTopicBlueprintV3 = {
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  blueprintKey: string;
  pack: RecoraTopicPackKeyV3;
  kind: RecoraTopicBlueprintKindV3;
  specificityTier: RecoraTopicSpecificityTierV3;
  family: RecoraTopicFamilyV3;
  primaryCoverage: RecoraTopicCoverageDimensionV3;
  coverageDimensions: readonly RecoraTopicCoverageDimensionV3[];
  customerFacingNameTemplateKey: string;
  customerFacingNameTemplate: string;
  internalSummary: string;
  promptSubjectLabelRule: RecoraPromptSubjectLabelRuleV3;
  semanticGroupKey: string;
  semanticVariantKey: string;
  applicability: RecoraTopicBlueprintApplicabilityV3;
  personaInfluencesAny:
    | readonly RecoraPersonaTopicInfluenceDimension[]
    | null;
  personaRoleFamiliesAny: readonly RecoraPersonaRoleFamily[] | null;
  marketSidesAny: readonly RecoraGenerationCustomerSide[] | null;
  measurementGoal: string;
  expectedEntityTypes: readonly RecoraTopicExpectedEntityTypeV3[];
  comparisonAxes: readonly string[];
  expectedAnswerShapes: readonly RecoraTopicExpectedAnswerShapeV3[];
  questionActs: readonly RecoraQuestionAct[];
  measurementLane: RecoraTopicMeasurementLaneKeyV3;
  fixedOrder: number;
};

export type RecoraTopicMeasurementLaneV3 = {
  laneKey: RecoraTopicMeasurementLaneKeyV3;
  laneKind: "prompt_generating" | "observation_overlay";
  allowedPromptTypes: readonly RecoraPromptType[];
  allowedMeasurementPurposes: readonly RecoraMeasurementPurpose[];
  allowedQuestionActs: readonly RecoraQuestionAct[];
  allowedResponseShapes: readonly RecoraTopicExpectedAnswerShapeV3[];
  allowedPanelRoles: readonly RecoraPromptPanelRole[];
  allowedMetricKeys: readonly RecoraPromptMetricKey[];
  forbiddenMetricKeys: readonly RecoraPromptMetricKey[];
};

export type RecoraTopicDomainOfferingBindingV3 = {
  bindingKey: typeof RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION;
  primaryBusinessDomain: RecoraBusinessDomain | null;
  primaryOfferingModel: RecoraOfferingModel | null;
  resolvedTopicSubtypeKey: RecoraResolvedTopicSubtypeKeyV3 | null;
  blueprintKey: string;
};

export type RecoraPromptSubjectDomainOfferingBindingV3 = {
  bindingKey:
    typeof RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION;
  primaryBusinessDomain: RecoraBusinessDomain | null;
  primaryOfferingModel: RecoraOfferingModel | null;
  resolvedTopicSubtypeKey: RecoraResolvedTopicSubtypeKeyV3 | null;
  labelKey: string;
  label: string;
};

export type RecoraTopicAliasRegistryEntryV3 = {
  mappingKey: string;
  aliases: readonly string[];
  targetBlueprintKeys: readonly string[];
};

export type RecoraLegacyTopicMigrationV3 = {
  legacyKey: string;
  disposition:
    | "split"
    | "rename"
    | "specialize"
    | "diagnostic_only";
  successorBlueprintKeys: readonly string[];
  notes: string;
};

function metricDifference(
  allowedMetricKeys: readonly RecoraPromptMetricKey[]
): readonly RecoraPromptMetricKey[] {
  const allowed = new Set(allowedMetricKeys);
  return RECORA_PROMPT_METRIC_KEYS.filter((key) => !allowed.has(key));
}

function lane(
  input: Omit<RecoraTopicMeasurementLaneV3, "forbiddenMetricKeys">
): RecoraTopicMeasurementLaneV3 {
  return {
    ...input,
    forbiddenMetricKeys: metricDifference(input.allowedMetricKeys)
  };
}

export const RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3 = {
  market_discovery: lane({
    laneKey: "market_discovery",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["non_branded"],
    allowedMeasurementPurposes: [
      "visibility",
      "ranking",
      "sov",
      "recommendation_input"
    ],
    allowedQuestionActs: [
      "discover_candidates",
      "request_shortlist",
      "request_ranking"
    ],
    allowedResponseShapes: [
      "candidate_list",
      "ranked_recommendation"
    ],
    allowedPanelRoles: ["core", "discovery", "robustness"],
    allowedMetricKeys: [
      "visibility",
      "ranking",
      "sov",
      "naturalCitationObservation",
      "recommendationInput"
    ]
  }),
  market_comparison: lane({
    laneKey: "market_comparison",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["non_branded", "comparison_generic"],
    allowedMeasurementPurposes: [
      "visibility",
      "ranking",
      "sov",
      "recommendation_input"
    ],
    allowedQuestionActs: [
      "compare_candidates",
      "ask_evaluation_criteria"
    ],
    allowedResponseShapes: ["comparative_set", "evaluation_criteria"],
    allowedPanelRoles: ["core", "discovery", "robustness"],
    allowedMetricKeys: [
      "visibility",
      "ranking",
      "sov",
      "naturalCitationObservation",
      "recommendationInput"
    ]
  }),
  criteria_explanation: lane({
    laneKey: "criteria_explanation",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["non_branded", "comparison_generic"],
    allowedMeasurementPurposes: ["recommendation_input"],
    allowedQuestionActs: [
      "ask_evaluation_criteria",
      "assess_fit",
      "ask_explanation"
    ],
    allowedResponseShapes: ["evaluation_criteria", "explanatory_answer"],
    allowedPanelRoles: ["core", "robustness", "diagnostic"],
    allowedMetricKeys: [
      "naturalCitationObservation",
      "recommendationInput"
    ]
  }),
  action_readiness: lane({
    laneKey: "action_readiness",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["non_branded"],
    allowedMeasurementPurposes: ["recommendation_input"],
    allowedQuestionActs: [
      "ask_evaluation_criteria",
      "assess_risk",
      "verify_claim"
    ],
    allowedResponseShapes: ["evaluation_criteria", "explanatory_answer"],
    allowedPanelRoles: ["core", "robustness", "diagnostic"],
    allowedMetricKeys: [
      "naturalCitationObservation",
      "riskCheck",
      "recommendationInput"
    ]
  }),
  trust_risk_diagnostic: lane({
    laneKey: "trust_risk_diagnostic",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["non_branded"],
    allowedMeasurementPurposes: ["recommendation_input"],
    allowedQuestionActs: [
      "assess_reputation",
      "assess_risk",
      "verify_claim",
      "request_sources"
    ],
    allowedResponseShapes: ["evidence_answer", "evaluation_criteria"],
    allowedPanelRoles: ["diagnostic"],
    allowedMetricKeys: [
      "naturalCitationObservation",
      "riskCheck",
      "recommendationInput"
    ]
  }),
  self_branded_perception: lane({
    laneKey: "self_branded_perception",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["branded"],
    allowedMeasurementPurposes: ["sentiment", "brand_perception"],
    allowedQuestionActs: [
      "assess_reputation",
      "assess_fit",
      "assess_risk",
      "verify_claim"
    ],
    allowedResponseShapes: [
      "branded_sentiment_answer",
      "evidence_answer",
      "explanatory_answer"
    ],
    allowedPanelRoles: ["diagnostic"],
    allowedMetricKeys: [
      "sentiment",
      "brandPerception",
      "naturalCitationObservation",
      "riskCheck",
      "recommendationInput"
    ]
  }),
  natural_citation_overlay: lane({
    laneKey: "natural_citation_overlay",
    laneKind: "observation_overlay",
    allowedPromptTypes: [
      "non_branded",
      "branded",
      "comparison_generic",
      "comparison_named",
      "competitor_named"
    ],
    allowedMeasurementPurposes: [
      "visibility",
      "ranking",
      "sov",
      "sentiment",
      "brand_perception",
      "recommendation_input"
    ],
    allowedQuestionActs: RECORA_QUESTION_ACTS,
    allowedResponseShapes: [
      "candidate_list",
      "ranked_recommendation",
      "comparative_set",
      "evaluation_criteria",
      "explanatory_answer",
      "evidence_answer",
      "branded_sentiment_answer"
    ],
    allowedPanelRoles: ["core", "discovery", "robustness", "diagnostic"],
    allowedMetricKeys: ["naturalCitationObservation"]
  }),
  forced_citation_validation: lane({
    laneKey: "forced_citation_validation",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["citation_check"],
    allowedMeasurementPurposes: ["citation_validation"],
    allowedQuestionActs: ["request_sources", "verify_claim"],
    allowedResponseShapes: ["evidence_answer"],
    allowedPanelRoles: ["diagnostic"],
    allowedMetricKeys: ["forcedCitationValidation"]
  }),
  named_entity_comparison_diagnostic: lane({
    laneKey: "named_entity_comparison_diagnostic",
    laneKind: "prompt_generating",
    allowedPromptTypes: ["comparison_named", "competitor_named"],
    allowedMeasurementPurposes: ["recommendation_input"],
    allowedQuestionActs: [
      "compare_candidates",
      "assess_risk",
      "verify_claim"
    ],
    allowedResponseShapes: ["comparative_set", "evaluation_criteria"],
    allowedPanelRoles: ["diagnostic"],
    allowedMetricKeys: [
      "naturalCitationObservation",
      "riskCheck",
      "recommendationInput"
    ]
  })
} as const satisfies Readonly<
  Record<RecoraTopicMeasurementLaneKeyV3, RecoraTopicMeasurementLaneV3>
>;

export function createRecoraTopicSourceRowsV3(
  pack: RecoraTopicPackKeyV3,
  seeds: readonly RecoraTopicBlueprintSeedV3[]
): readonly RecoraTopicBlueprintSourceRowV3[] {
  return seeds.map((seed) => {
    const [
      blueprintKey,
      customerFacingNameTemplate,
      family,
      primaryCoverage,
      measurementLane,
      expectedEntityTypes,
      options
    ] = seed;
    const lanePolicy = RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3[measurementLane];
    const defaultEntities: readonly RecoraTopicExpectedEntityTypeV3[] =
      measurementLane === "market_discovery"
        ? ["service", "solution_category"]
        : measurementLane === "market_comparison"
          ? ["service", "comparison_criterion"]
          : measurementLane === "action_readiness"
            ? ["service", "action_requirement"]
            : measurementLane === "trust_risk_diagnostic" ||
                measurementLane === "forced_citation_validation" ||
                measurementLane === "natural_citation_overlay"
              ? ["service", "evidence_source"]
              : ["service", "comparison_criterion"];
    const suffix = blueprintKey.replace(/^[^.]+\./, "").replace(/\./g, "_");
    return [
      pack,
      blueprintKey,
      customerFacingNameTemplate,
      family,
      primaryCoverage,
      measurementLane,
      options?.semanticGroupKey ?? `${family}.${suffix}`,
      expectedEntityTypes ?? defaultEntities,
      options?.expectedAnswerShapes ?? lanePolicy.allowedResponseShapes,
      options?.questionActs ?? lanePolicy.allowedQuestionActs,
      options
    ] as const;
  });
}

export const RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1 = {
  purchase: "common.pre_purchase_checks",
  start_subscription: "common.pre_subscription_checks",
  reservation: "common.pre_reservation_checks",
  visit: "common.pre_visit_checks",
  inquiry: "common.pre_inquiry_checks",
  request_quote: "common.pre_quote_request_checks",
  request_material: "common.pre_material_request_checks",
  consultation: "common.pre_consultation_checks",
  application: "common.pre_application_checks",
  demo_or_trial: "common.pre_demo_trial_checks",
  contract: "common.pre_contract_checks",
  job_application: "common.pre_job_application_checks",
  content_view: "common.content_access_conditions",
  content_subscription: "common.pre_content_subscription_checks"
} as const satisfies Readonly<Record<RecoraCustomerAction, string>>;

export const RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1 = {
  b2b_buying_group: "法人向け業務サービス",
  enterprise_it_security: "法人向けIT・セキュリティサービス",
  agency_delivery: "代理店向け業務支援サービス",
  b2b2c: "法人導入型の利用者向けサービス",
  commerce_single_purchase: "商品・ECサイト",
  commerce_subscription: "定期購入商品・サブスクリプション",
  commerce_gift: "ギフト向け商品・EC",
  local_facility: "地域の店舗・施設",
  urgent_service: "緊急対応の住宅修理サービス",
  adult_healthcare: "医療機関・相談先",
  care_welfare: "介護・福祉サービス",
  adult_education: "スクール・学習サービス",
  child_education: "子ども向けスクール・教育サービス",
  corporate_training: "法人研修・人材育成サービス",
  multi_location_consumer_brand: "地域の店舗・施設",
  multi_location_customer_organization: "多拠点組織向け業務サービス",
  franchise_consumer_brand: "地域の店舗・施設",
  franchise_recruitment: "フランチャイズ本部・加盟募集",
  marketplace_brand: "マーケットプレイス",
  marketplace_operator_customer: "マーケットプレイス運営支援サービス",
  professional_service_b2b: "専門サービス・相談先",
  recruiting_employer_saas: "採用管理・人事支援サービス",
  real_estate_rental: "賃貸物件・仲介会社",
  real_estate_purchase_residential: "購入物件・不動産会社",
  real_estate_sale: "不動産売却・仲介会社",
  insurance: "保険商品・相談先",
  manufacturing_capex: "製造設備・産業ソリューション",
  logistics_shipper_buying: "物流会社・3PL・物流システム",
  individual_travel: "旅行先・宿泊・体験サービス",
  group_or_business_travel: "団体旅行・出張手配サービス",
  public_nonprofit_customer: "公共・非営利向けサービス",
  media_brand: "メディア・コンテンツサービス"
} as const satisfies Readonly<
  Record<RecoraGenerationStructureSignal, string>
>;

export const RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1:
  readonly RecoraTopicDomainOfferingBindingV3[] = [
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "it_software",
    primaryOfferingModel: "saas_software",
    resolvedTopicSubtypeKey: null,
    blueprintKey: "saas.feature_workflow_fit"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "professional_consulting",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    blueprintKey: "professional_service.expertise_specialization"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "consumer_services",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    blueprintKey: "consumer_service.experience_fit"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "retail_product_sales",
    primaryOfferingModel: "product",
    resolvedTopicSubtypeKey: null,
    blueprintKey: "product.spec_quality"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "automotive_mobility",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    blueprintKey: "automotive.vehicle_use_ownership_fit"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "construction_home_service",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    blueprintKey: "home_service.work_scope_site_conditions"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "food_beauty_lifestyle",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: "food_dining",
    blueprintKey: "food.menu_occasion_experience_fit"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "food_beauty_lifestyle",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: "beauty_wellness",
    blueprintKey: "beauty.treatment_service_experience"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "food_beauty_lifestyle",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: "other_lifestyle",
    blueprintKey: "consumer_service.experience_fit"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: null,
    primaryOfferingModel: "managed_service",
    resolvedTopicSubtypeKey: null,
    blueprintKey: "managed_service.operating_model"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: null,
    primaryOfferingModel: "physical_location_service",
    resolvedTopicSubtypeKey: null,
    blueprintKey: "location.access_transport_parking"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "media_content",
    primaryOfferingModel: "publisher_content",
    resolvedTopicSubtypeKey: null,
    blueprintKey: "media.audience_advertiser_creator_ecosystem"
  },
  {
    bindingKey: RECORA_TOPIC_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "other",
    primaryOfferingModel: "other",
    resolvedTopicSubtypeKey: null,
    blueprintKey: "service.process_workflow"
  }
];

export const RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDINGS_V1:
  readonly RecoraPromptSubjectDomainOfferingBindingV3[] = [
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "it_software",
    primaryOfferingModel: "saas_software",
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.it_saas",
    label: "SaaS・業務ソフトウェア"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "professional_consulting",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.professional_service",
    label: "専門サービス・相談先"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "consumer_services",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.consumer_service",
    label: "消費者向けサービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "retail_product_sales",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.product_brand",
    label: "商品・ブランド"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "automotive_mobility",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.automotive",
    label: "車両・自動車サービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "construction_home_service",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.home_service",
    label: "住宅修理・施工サービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "food_beauty_lifestyle",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: "food_dining",
    labelKey: "subject.food_dining",
    label: "飲食店・食事サービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "food_beauty_lifestyle",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: "beauty_wellness",
    labelKey: "subject.beauty_wellness",
    label: "美容・ウェルネスサービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "food_beauty_lifestyle",
    primaryOfferingModel: null,
    resolvedTopicSubtypeKey: "other_lifestyle",
    labelKey: "subject.other_lifestyle",
    label: "生活関連サービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: null,
    primaryOfferingModel: "managed_service",
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.managed_service",
    label: "業務代行・運用支援サービス"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: null,
    primaryOfferingModel: "physical_location_service",
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.physical_location",
    label: "地域の店舗・施設"
  },
  {
    bindingKey: RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDING_VERSION,
    primaryBusinessDomain: "media_content",
    primaryOfferingModel: "publisher_content",
    resolvedTopicSubtypeKey: null,
    labelKey: "subject.publisher_content",
    label: "メディア・コンテンツサービス"
  }
];

export const RECORA_TOPIC_ALIAS_REGISTRY_JA_V1:
  readonly RecoraTopicAliasRegistryEntryV3[] = [
  {
    mappingKey: "focus.security",
    aliases: ["セキュリティ", "情報セキュリティ", "安全なデータ管理"],
    targetBlueprintKeys: [
      "enterprise.security_architecture",
      "enterprise.privacy_data_protection"
    ]
  },
  {
    mappingKey: "focus.price",
    aliases: ["料金", "価格", "費用", "コスト"],
    targetBlueprintKeys: [
      "common.price_fee_clarity",
      "common.price_value_comparison"
    ]
  },
  {
    mappingKey: "focus.reputation",
    aliases: ["口コミ", "評判", "レビュー"],
    targetBlueprintKeys: ["common.reviews_reputation"]
  },
  {
    mappingKey: "focus.integration",
    aliases: ["連携", "API", "システム連携"],
    targetBlueprintKeys: ["saas.integration_api"]
  },
  {
    mappingKey: "focus.local",
    aliases: ["地域", "アクセス", "近く", "店舗"],
    targetBlueprintKeys: [
      "location.nearby_facility_discovery",
      "location.access_transport_parking"
    ]
  },
  {
    mappingKey: "diagnosis.forced_citation",
    aliases: ["引用確認", "出典確認", "情報源を求める"],
    targetBlueprintKeys: ["diagnostic.forced_citation_validation"]
  },
  {
    mappingKey: "subtype.food_dining",
    aliases: ["飲食", "レストラン", "飲食店", "ケータリング"],
    targetBlueprintKeys: ["food.dining_cuisine_discovery"]
  },
  {
    mappingKey: "subtype.beauty_wellness",
    aliases: ["美容", "サロン", "ウェルネス", "フィットネス"],
    targetBlueprintKeys: ["beauty.service_goal_fit"]
  }
];

export const RECORA_LEGACY_TOPIC_MIGRATION_V3:
  readonly RecoraLegacyTopicMigrationV3[] = [
  {
    legacyKey: "category-discovery",
    disposition: "split",
    successorBlueprintKeys: [
      "common.candidate_provider_discovery",
      "common.recommendation_shortlist",
      "common.comparison_axis_explanation"
    ],
    notes: "候補発見と比較をT1・T2へ分離する。"
  },
  {
    legacyKey: "problem-solution",
    disposition: "rename",
    successorBlueprintKeys: [
      "common.problem_need_discovery",
      "common.solution_category_discovery"
    ],
    notes: "課題説明と解決カテゴリ発見を分離する。"
  },
  {
    legacyKey: "selection-criteria",
    disposition: "split",
    successorBlueprintKeys: [
      "common.use_case_fit",
      "common.pre_contract_checks"
    ],
    notes: "適合と行動直前条件を分ける。"
  },
  {
    legacyKey: "alternative-search",
    disposition: "specialize",
    successorBlueprintKeys: [
      "common.alternative_method_comparison",
      "common.substitute_category_comparison"
    ],
    notes: "事業motion別の代替比較へ具体化する。"
  },
  {
    legacyKey: "pricing-reputation",
    disposition: "split",
    successorBlueprintKeys: [
      "common.price_fee_clarity",
      "common.reviews_reputation",
      "common.track_record_proof"
    ],
    notes: "料金・口コミ・実績を別意味として保持する。"
  },
  {
    legacyKey: "regulated-risk",
    disposition: "split",
    successorBlueprintKeys: [
      "common.qualification_credentials",
      "common.risk_cautions",
      "common.transparency_disclosure"
    ],
    notes: "資格・リスク・開示を業種条件付きへ分解する。"
  },
  {
    legacyKey: "citation-check",
    disposition: "diagnostic_only",
    successorBlueprintKeys: [
      "diagnostic.forced_citation_validation",
      "diagnostic.source_quality_gap"
    ],
    notes: "自然引用観測は別Overlayへ分離する。"
  },
  {
    legacyKey: "branded-sentiment",
    disposition: "diagnostic_only",
    successorBlueprintKeys: [
      "diagnostic.subject_reputation_sentiment",
      "diagnostic.subject_fit_perception"
    ],
    notes: "分析対象名を含む指名診断として扱う。"
  },
  {
    legacyKey: "local-regional",
    disposition: "split",
    successorBlueprintKeys: [
      "location.nearby_facility_discovery",
      "location.access_transport_parking",
      "location.booking_walkin_conditions"
    ],
    notes: "近隣発見・アクセス・予約を分離する。"
  }
];

export function hasCompletePrimaryActionBindingV1(): boolean {
  return RECORA_CUSTOMER_ACTIONS.every(
    (action) => RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1[action].length > 0
  );
}

export function hasCompleteStructureSubjectBindingV1(): boolean {
  return RECORA_GENERATION_STRUCTURE_SIGNALS.every(
    (signal) => RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1[signal].length > 0
  );
}
