export const RECORA_TOPIC_GOLD_FIXTURE_VERSION =
  "recora_topic_gold_fixtures_ja_v3" as const;

export const RECORA_TOPIC_READY_GOLD_CASES_V3 = [
  ["R01", "standard_b2b", "@domain_offering"],
  ["R02", "standard_b2c", "@domain_offering"],
  ["R03", "standard_both_b2b_first", "@domain_offering"],
  ["R04", "standard_both_b2c_first", "@domain_offering"],
  ["R05", "standard_both_balanced", "@domain_offering"],
  ["R06", "enterprise_it_security", "enterprise.security_architecture"],
  ["R07", "agency_delivery", "managed_service.operating_model"],
  ["R08", "b2b2c_corporate_training", "managed_service.operating_model"],
  ["R09", "commerce_gift", "product.spec_quality"],
  ["R10", "commerce_subscription", "product.spec_quality"],
  ["R11", "commerce_single_purchase", "product.spec_quality"],
  ["R12", "urgent_home_service", "service.process_workflow"],
  ["R13", "adult_healthcare", "service.process_workflow"],
  ["R14", "care_welfare", "service.process_workflow"],
  ["R15", "child_education", "service.process_workflow"],
  ["R16", "adult_education", "service.process_workflow"],
  ["R17", "multi_location_consumer_brand", "location.access_transport_parking"],
  ["R18", "multi_location_customer_organization", "managed_service.operating_model"],
  ["R19", "franchise_consumer_brand", "location.access_transport_parking"],
  ["R20", "franchise_recruitment", "service.process_workflow"],
  ["R21", "marketplace_brand", "@domain_offering"],
  ["R22", "marketplace_operator_customer", "managed_service.operating_model"],
  ["R23", "recruiting_employer_saas", "saas.feature_workflow_fit"],
  ["R24", "real_estate_rental", "service.process_workflow"],
  ["R25", "real_estate_purchase_residential", "service.process_workflow"],
  ["R26", "real_estate_sale", "service.process_workflow"],
  ["R27", "insurance", "service.process_workflow"],
  ["R28", "manufacturing_capex", "product.spec_quality"],
  ["R29", "logistics_shipper_buying", "managed_service.operating_model"],
  ["R30", "group_or_business_travel", "service.process_workflow"],
  ["R31", "individual_travel", "service.process_workflow"],
  ["R32", "public_nonprofit_customer", "managed_service.operating_model"],
  ["R33", "media_brand", "media.audience_advertiser_creator_ecosystem"],
  ["R34", "professional_service_b2b", "professional_service.expertise_specialization"],
  ["R35", "local_facility", "location.access_transport_parking"]
] as const;

export const RECORA_TOPIC_NEEDS_REVIEW_GOLD_CASES_V3 = [
  ["NR01", "generation_input_needs_review"],
  ["NR02", "persona_compilation_needs_review"],
  ["NR03", "multiple_topic_recipes_match"],
  ["NR04", "required_focus_theme_unmapped"],
  ["NR05", "required_focus_themes_conflict"],
  ["NR06", "prompt_subject_label_too_broad"],
  ["NR07", "food_beauty_subtype_conflict"],
  ["NR08", "required_market_side_ambiguous"],
  ["NR09", "required_geographic_focus_without_context"],
  ["NR10", "required_lifecycle_focus_without_persona_state"]
] as const;

export const RECORA_TOPIC_CATALOG_GAP_GOLD_CASES_V3 = [
  ["CG01", "required_topic_blueprint_missing"],
  ["CG02", "approved_topic_bundle_incomplete"],
  ["CG03", "selected_topic_count_mismatch"],
  ["CG04", "selected_topic_semantic_duplicate"],
  ["CG05", "topic_primary_edge_missing"],
  ["CG06", "persona_topic_coverage_missing"],
  ["CG07", "required_market_side_coverage_missing"]
] as const;

export const RECORA_TOPIC_BLOCKED_GOLD_CASES_V3 = [
  ["BL01", "unsupported_topic_input_version"],
  ["BL02", "unsupported_country"],
  ["BL03", "unsupported_locale"],
  ["BL04", "persona_compilation_blocked"],
  ["BL05", "unsupported_persona_contract_version"],
  ["BL06", "persona_selected_count_mismatch"],
  ["BL07", "persona_identity_duplicate"],
  ["BL08", "persona_semantic_key_duplicate"],
  ["BL09", "topic_catalog_invalid"],
  ["BL10", "topic_identity_collision"]
] as const;

export const RECORA_TOPIC_INVARIANCE_TRANSFORMS_V3 = [
  "same_input_rerun",
  "secondary_domain_order",
  "secondary_offering_order",
  "secondary_action_order",
  "structure_signal_order",
  "customer_side_order",
  "actor_relation_order",
  "persona_array_order_preserving_sort_order",
  "duplicate_semantic_array_values",
  "external_profile_50_100_200",
  "stored_generation_fingerprint",
  "persona_display_text",
  "persona_selection_evidence",
  "focus_diagnosis_order",
  "topic_display_label_only"
] as const;

export const RECORA_TOPIC_MEANING_CHANGE_TRANSFORMS_V3 = [
  "audience_priority",
  "primary_action",
  "offering_model",
  "structure_motion",
  "geographic_binding",
  "trust_or_regulation",
  "persona_modifier",
  "required_focus_theme",
  "persona_market_side"
] as const;

export type RecoraTopicGoldStatusV3 =
  | "ready"
  | "needs_review"
  | "catalog_gap"
  | "blocked";

export type RecoraTopicGoldFixtureV3 = {
  fixtureVersion: typeof RECORA_TOPIC_GOLD_FIXTURE_VERSION;
  caseKey: string;
  expectedStatus: RecoraTopicGoldStatusV3;
  expectedTopicRecipeKey?: string;
  expectedPrimaryCoverage?: readonly ["T1", "T2", "T3", "T4", "T5", "T6"];
  expectedPrimaryBlueprintAuthorities?: readonly [
    "common.candidate_provider_discovery",
    "common.comparison_axis_explanation",
    "common.use_case_fit",
    "@primary_action",
    "common.reviews_reputation",
    string
  ];
  expectedT5SupportingBlueprintKeys?: readonly [
    "diagnostic.subject_reputation_sentiment"
  ];
  expectedTopicIdPrefix?: "topic_v3_";
  expectedCode?: string;
};

export const RECORA_MEASUREMENT_TOPIC_GOLD_FIXTURES_V3:
  readonly RecoraTopicGoldFixtureV3[] = [
  ...RECORA_TOPIC_READY_GOLD_CASES_V3.map(
    ([caseKey, recipeKey, t6Authority]) => ({
      fixtureVersion: RECORA_TOPIC_GOLD_FIXTURE_VERSION,
      caseKey,
      expectedStatus: "ready" as const,
      expectedTopicRecipeKey: recipeKey,
      expectedPrimaryCoverage: ["T1", "T2", "T3", "T4", "T5", "T6"] as const,
      expectedPrimaryBlueprintAuthorities: [
        "common.candidate_provider_discovery",
        "common.comparison_axis_explanation",
        "common.use_case_fit",
        "@primary_action",
        "common.reviews_reputation",
        t6Authority
      ] as const,
      expectedT5SupportingBlueprintKeys: [
        "diagnostic.subject_reputation_sentiment"
      ] as const,
      expectedTopicIdPrefix: "topic_v3_" as const
    })
  ),
  ...RECORA_TOPIC_NEEDS_REVIEW_GOLD_CASES_V3.map(([caseKey, code]) => ({
    fixtureVersion: RECORA_TOPIC_GOLD_FIXTURE_VERSION,
    caseKey,
    expectedStatus: "needs_review" as const,
    expectedCode: code
  })),
  ...RECORA_TOPIC_CATALOG_GAP_GOLD_CASES_V3.map(([caseKey, code]) => ({
    fixtureVersion: RECORA_TOPIC_GOLD_FIXTURE_VERSION,
    caseKey,
    expectedStatus: "catalog_gap" as const,
    expectedCode: code
  })),
  ...RECORA_TOPIC_BLOCKED_GOLD_CASES_V3.map(([caseKey, code]) => ({
    fixtureVersion: RECORA_TOPIC_GOLD_FIXTURE_VERSION,
    caseKey,
    expectedStatus: "blocked" as const,
    expectedCode: code
  }))
];

export const RECORA_TOPIC_GOLD_EXPECTED_COUNTS_V3 = {
  ready: 35,
  needsReview: 10,
  catalogGap: 7,
  blocked: 10,
  base: 62,
  invariancePerReady: 15,
  meaningChangePerReady: 9,
  minimumExecutions: 902
} as const;
