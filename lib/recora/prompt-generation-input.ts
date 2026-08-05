export const RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION =
  "recora_prompt_generation_input_v1" as const;
export const RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION =
  "recora_prompt_generation_draft_input_v1" as const;
export const RECORA_PROMPT_GENERATION_SEMANTICS_VERSION =
  "recora_prompt_generation_semantics_v1" as const;
export const RECORA_PROMPT_GENERATION_COUNTRY = "JP" as const;
export const RECORA_PROMPT_GENERATION_LOCALE = "ja-JP" as const;

export const RECORA_SUBJECT_TYPES = [
  "company",
  "brand",
  "service",
  "product",
  "location_facility",
  "professional_person"
] as const;

export const RECORA_AUDIENCE_SCOPES = ["b2b", "b2c", "both"] as const;
export const RECORA_AUDIENCE_PRIORITIES = [
  "b2b_first",
  "b2c_first",
  "balanced"
] as const;

export const RECORA_BUSINESS_DOMAINS = [
  "it_software",
  "professional_consulting",
  "consumer_services",
  "retail_product_sales",
  "healthcare",
  "care_welfare",
  "education",
  "recruiting_hr",
  "real_estate",
  "finance_insurance",
  "travel_hospitality",
  "food_beauty_lifestyle",
  "media_content",
  "manufacturing_industrial",
  "logistics_supply_chain",
  "automotive_mobility",
  "construction_home_service",
  "public_nonprofit",
  "other"
] as const;

export const RECORA_OFFERING_MODELS = [
  "saas_software",
  "managed_service",
  "professional_advisory",
  "consumer_service",
  "product",
  "physical_location_service",
  "marketplace_platform",
  "publisher_content",
  "other"
] as const;

export const RECORA_COMMERCE_CHANNELS = [
  "ecommerce",
  "physical_retail",
  "third_party_marketplace"
] as const;

export const RECORA_COMMERCE_ROLES = [
  "brand_owner",
  "manufacturer",
  "direct_seller",
  "retailer",
  "marketplace_seller",
  "marketplace_operator"
] as const;

export const RECORA_CUSTOMER_ACTIONS = [
  "purchase",
  "start_subscription",
  "reservation",
  "visit",
  "inquiry",
  "request_quote",
  "request_material",
  "consultation",
  "application",
  "demo_or_trial",
  "contract",
  "job_application",
  "content_view",
  "content_subscription"
] as const;

export const RECORA_DELIVERY_MODES = [
  "online",
  "in_person",
  "hybrid"
] as const;
export const RECORA_SERVICE_COVERAGES = [
  "nationwide",
  "regional",
  "local"
] as const;
export const RECORA_LOCATION_STRUCTURES = [
  "none",
  "single_location",
  "multi_location"
] as const;
export const RECORA_GEOGRAPHIC_BINDINGS = [
  "none",
  "service_area",
  "physical_location",
  "service_area_and_physical_location"
] as const;

export const RECORA_JAPAN_AREA_LEVELS = [
  "nationwide",
  "region",
  "prefecture",
  "municipality",
  "district",
  "custom",
  "unresolved"
] as const;
export const RECORA_JAPAN_AREA_RESOLUTION_STATUSES = [
  "canonical",
  "custom",
  "unresolved"
] as const;

export const RECORA_DECISION_IMPACT_FLAGS = [
  "high_cost",
  "long_term_commitment",
  "safety_or_health",
  "livelihood",
  "legal_rights",
  "employment"
] as const;
export const RECORA_REGULATORY_FLAGS = [
  "licensed_profession",
  "regulated_service",
  "regulated_product",
  "advertising_restriction",
  "mandatory_disclosure"
] as const;
export const RECORA_SENSITIVE_CONTEXTS = [
  "personal",
  "health",
  "financial",
  "employment",
  "legal"
] as const;
export const RECORA_DECISION_IMPACT_LEVELS = [
  "standard",
  "elevated",
  "critical"
] as const;
export const RECORA_DERIVED_TRUST_CLASSES = [
  "standard",
  "high_trust",
  "regulated"
] as const;

export const RECORA_GENERATION_STRUCTURE_SIGNALS = [
  "b2b_buying_group",
  "enterprise_it_security",
  "agency_delivery",
  "b2b2c",
  "commerce_single_purchase",
  "commerce_subscription",
  "commerce_gift",
  "local_facility",
  "urgent_service",
  "adult_healthcare",
  "care_welfare",
  "adult_education",
  "child_education",
  "corporate_training",
  "multi_location_consumer_brand",
  "multi_location_customer_organization",
  "franchise_consumer_brand",
  "franchise_recruitment",
  "marketplace_brand",
  "marketplace_operator_customer",
  "professional_service_b2b",
  "recruiting_employer_saas",
  "real_estate_rental",
  "real_estate_purchase_residential",
  "real_estate_sale",
  "insurance",
  "manufacturing_capex",
  "logistics_shipper_buying",
  "individual_travel",
  "group_or_business_travel",
  "public_nonprofit_customer",
  "media_brand"
] as const;

export const RECORA_GENERATION_CUSTOMER_SIDES = [
  "prospective_customer",
  "current_customer",
  "end_user_or_beneficiary",
  "payer_or_sponsor",
  "influencer_or_referrer",
  "demand_side_participant",
  "supply_side_participant",
  "partner_or_intermediary"
] as const;

export const RECORA_ACTOR_RELATIONS = [
  "same_actor",
  "distinct_actors",
  "unknown"
] as const;

export const RECORA_LIFECYCLE_SIGNALS = [
  "first_time_explorer",
  "trial_user",
  "active_user",
  "failed_prior_choice_researcher",
  "renewal_decider",
  "cancellation_decider",
  "switching_evaluator"
] as const;

export const RECORA_PROMPT_GENERATION_REVIEW_CODES = [
  "audience_priority_required",
  "healthcare_motion_required",
  "education_motion_required",
  "real_estate_motion_required",
  "finance_motion_required",
  "marketplace_motion_required",
  "multi_location_motion_required",
  "travel_motion_required",
  "actor_relation_unconfirmed",
  "service_area_details_required",
  "physical_location_details_required",
  "legacy_audience_required",
  "legacy_primary_action_required",
  "legacy_business_model_required",
  "legacy_structure_confirmation_required"
] as const;

export const RECORA_PROMPT_GENERATION_BLOCKER_CODES = [
  "unsupported_contract_version",
  "unsupported_country",
  "unsupported_locale",
  "primary_subject_missing",
  "primary_subject_type_invalid",
  "primary_subject_name_missing",
  "subject_url_invalid",
  "secondary_subject_invalid",
  "audience_scope_missing",
  "audience_scope_invalid",
  "audience_priority_invalid",
  "unexpected_audience_priority",
  "primary_business_domain_missing",
  "primary_business_domain_invalid",
  "primary_offering_model_missing",
  "primary_offering_model_invalid",
  "business_summary_missing",
  "primary_action_missing",
  "primary_action_invalid",
  "delivery_mode_missing",
  "delivery_mode_invalid",
  "service_coverage_missing",
  "service_coverage_invalid",
  "location_structure_missing",
  "location_structure_invalid",
  "geographic_binding_missing",
  "geographic_binding_invalid",
  "delivery_geography_conflict",
  "service_area_invalid",
  "location_invalid",
  "trust_flag_invalid",
  "structure_signal_invalid",
  "structure_signal_conflict",
  "customer_side_invalid",
  "customer_side_missing",
  "actor_relation_invalid",
  "actor_relation_conflict",
  "lifecycle_signal_invalid",
  "normalizer_internal_invariant"
] as const;

export type RecoraSubjectType = typeof RECORA_SUBJECT_TYPES[number];
export type RecoraAudienceScope = typeof RECORA_AUDIENCE_SCOPES[number];
export type RecoraAudiencePriority =
  typeof RECORA_AUDIENCE_PRIORITIES[number];
export type RecoraBusinessDomain = typeof RECORA_BUSINESS_DOMAINS[number];
export type RecoraOfferingModel = typeof RECORA_OFFERING_MODELS[number];
export type RecoraCommerceChannel = typeof RECORA_COMMERCE_CHANNELS[number];
export type RecoraCommerceRole = typeof RECORA_COMMERCE_ROLES[number];
export type RecoraCustomerAction = typeof RECORA_CUSTOMER_ACTIONS[number];
export type RecoraDeliveryMode = typeof RECORA_DELIVERY_MODES[number];
export type RecoraServiceCoverage = typeof RECORA_SERVICE_COVERAGES[number];
export type RecoraLocationStructure =
  typeof RECORA_LOCATION_STRUCTURES[number];
export type RecoraGeographicBinding =
  typeof RECORA_GEOGRAPHIC_BINDINGS[number];
export type RecoraJapanAreaLevel = typeof RECORA_JAPAN_AREA_LEVELS[number];
export type RecoraJapanAreaResolutionStatus =
  typeof RECORA_JAPAN_AREA_RESOLUTION_STATUSES[number];
export type RecoraDecisionImpactFlag =
  typeof RECORA_DECISION_IMPACT_FLAGS[number];
export type RecoraRegulatoryFlag = typeof RECORA_REGULATORY_FLAGS[number];
export type RecoraSensitiveContext = typeof RECORA_SENSITIVE_CONTEXTS[number];
export type RecoraDecisionImpactLevel =
  typeof RECORA_DECISION_IMPACT_LEVELS[number];
export type RecoraDerivedTrustClass =
  typeof RECORA_DERIVED_TRUST_CLASSES[number];
export type RecoraGenerationStructureSignal =
  typeof RECORA_GENERATION_STRUCTURE_SIGNALS[number];
export type RecoraGenerationCustomerSide =
  typeof RECORA_GENERATION_CUSTOMER_SIDES[number];
export type RecoraActorRelation = typeof RECORA_ACTOR_RELATIONS[number];
export type RecoraLifecycleSignal = typeof RECORA_LIFECYCLE_SIGNALS[number];
export type RecoraPromptGenerationReviewCode =
  typeof RECORA_PROMPT_GENERATION_REVIEW_CODES[number];
export type RecoraPromptGenerationBlockerCode =
  typeof RECORA_PROMPT_GENERATION_BLOCKER_CODES[number];

export type RecoraSubjectRef = {
  type: RecoraSubjectType;
  name: string;
  aliases: readonly string[];
  officialUrl: string | null;
};

export type RecoraJapanAreaRef = {
  areaKey: string | null;
  label: string;
  level: RecoraJapanAreaLevel;
  parentAreaKey: string | null;
  resolutionStatus: RecoraJapanAreaResolutionStatus;
};

export type RecoraConfirmedActorRelation = {
  leftRoleKey: string;
  rightRoleKey: string;
  relation: RecoraActorRelation;
};

export type RecoraDerivedTrustProfile = {
  decisionImpactLevel: RecoraDecisionImpactLevel;
  derivedClass: RecoraDerivedTrustClass;
  derivationVersion: "recora_trust_derivation_v1";
  reasons: readonly string[];
};

export type RecoraPromptGenerationIdentity = {
  semanticsVersion: typeof RECORA_PROMPT_GENERATION_SEMANTICS_VERSION;
  hashAlgorithm: "sha256";
  fingerprint: string;
};

export type RecoraPromptGenerationInputV1 = {
  contractVersion: typeof RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION;
  market: {
    country: typeof RECORA_PROMPT_GENERATION_COUNTRY;
    locale: typeof RECORA_PROMPT_GENERATION_LOCALE;
  };
  subject: {
    operatorCompanyName: string | null;
    primary: RecoraSubjectRef;
    secondary: readonly RecoraSubjectRef[];
  };
  audience: {
    scope: RecoraAudienceScope;
    priority: RecoraAudiencePriority | null;
  };
  business: {
    primaryDomain: RecoraBusinessDomain;
    secondaryDomains: readonly RecoraBusinessDomain[];
    primaryOfferingModel: RecoraOfferingModel;
    secondaryOfferingModels: readonly RecoraOfferingModel[];
    commerceChannels: readonly RecoraCommerceChannel[];
    commerceRoles: readonly RecoraCommerceRole[];
    summary: string;
  };
  actions: {
    primary: RecoraCustomerAction;
    secondary: readonly RecoraCustomerAction[];
  };
  delivery: {
    mode: RecoraDeliveryMode;
    serviceCoverage: RecoraServiceCoverage;
    locationStructure: RecoraLocationStructure;
    geographicBinding: RecoraGeographicBinding;
    serviceAreas: readonly RecoraJapanAreaRef[];
    locations: readonly RecoraSubjectRef[];
  };
  trust: {
    decisionImpactFlags: readonly RecoraDecisionImpactFlag[];
    regulatoryFlags: readonly RecoraRegulatoryFlag[];
    sensitiveContexts: readonly RecoraSensitiveContext[];
    derived: RecoraDerivedTrustProfile;
  };
  generationContext: {
    structureSignals: readonly RecoraGenerationStructureSignal[];
    customerSides: readonly RecoraGenerationCustomerSide[];
    actorRelations: readonly RecoraConfirmedActorRelation[];
    lifecycleSignals: readonly RecoraLifecycleSignal[];
    focusThemes: readonly string[];
    diagnosisGoals: readonly string[];
  };
  generationIdentity: RecoraPromptGenerationIdentity;
};

export type RecoraPromptGenerationDraftInputV1 = {
  contractVersion?: string;
  market?: {
    country?: string;
    locale?: string;
  };
  subject?: {
    operatorCompanyName?: string | null;
    primary?: {
      type?: string;
      name?: string;
      aliases?: readonly string[];
      officialUrl?: string | null;
    };
    secondary?: readonly {
      type?: string;
      name?: string;
      aliases?: readonly string[];
      officialUrl?: string | null;
    }[];
  };
  audience?: {
    scope?: string;
    priority?: string | null;
  };
  business?: {
    primaryDomain?: string;
    secondaryDomains?: readonly string[];
    primaryOfferingModel?: string;
    secondaryOfferingModels?: readonly string[];
    commerceChannels?: readonly string[];
    commerceRoles?: readonly string[];
    summary?: string;
  };
  actions?: {
    primary?: string;
    secondary?: readonly string[];
  };
  delivery?: {
    mode?: string;
    serviceCoverage?: string;
    locationStructure?: string;
    geographicBinding?: string;
    serviceAreas?: readonly {
      areaKey?: string | null;
      label?: string;
      level?: string;
      parentAreaKey?: string | null;
      resolutionStatus?: string;
    }[];
    locations?: readonly {
      type?: string;
      name?: string;
      aliases?: readonly string[];
      officialUrl?: string | null;
    }[];
  };
  trust?: {
    decisionImpactFlags?: readonly string[];
    regulatoryFlags?: readonly string[];
    sensitiveContexts?: readonly string[];
  };
  generationContext?: {
    structureSignals?: readonly string[];
    customerSides?: readonly string[];
    actorRelations?: readonly {
      leftRoleKey?: string;
      rightRoleKey?: string;
      relation?: string;
    }[];
    lifecycleSignals?: readonly string[];
    focusThemes?: readonly string[];
    diagnosisGoals?: readonly string[];
  };
};

export type RecoraPromptGenerationReviewQuestion = {
  code: RecoraPromptGenerationReviewCode;
  message: string;
  allowedAnswers: readonly string[];
};

export type RecoraPromptGenerationNormalizationResultV1 = {
  status: "ready" | "needs_review" | "blocked";
  value: RecoraPromptGenerationInputV1 | null;
  reviewQuestions: readonly RecoraPromptGenerationReviewQuestion[];
  blockers: readonly RecoraPromptGenerationBlockerCode[];
  warnings: readonly string[];
};