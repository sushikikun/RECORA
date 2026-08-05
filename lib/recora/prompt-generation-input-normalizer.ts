import { createHash } from "node:crypto";

import type { ProjectSetupSeedInput } from "./project-setup-draft";
import {
  RECORA_ACTOR_RELATIONS,
  RECORA_AUDIENCE_PRIORITIES,
  RECORA_AUDIENCE_SCOPES,
  RECORA_BUSINESS_DOMAINS,
  RECORA_COMMERCE_CHANNELS,
  RECORA_COMMERCE_ROLES,
  RECORA_CUSTOMER_ACTIONS,
  RECORA_DECISION_IMPACT_FLAGS,
  RECORA_DELIVERY_MODES,
  RECORA_GENERATION_CUSTOMER_SIDES,
  RECORA_GENERATION_STRUCTURE_SIGNALS,
  RECORA_GEOGRAPHIC_BINDINGS,
  RECORA_JAPAN_AREA_LEVELS,
  RECORA_JAPAN_AREA_RESOLUTION_STATUSES,
  RECORA_LIFECYCLE_SIGNALS,
  RECORA_LOCATION_STRUCTURES,
  RECORA_OFFERING_MODELS,
  RECORA_PROMPT_GENERATION_COUNTRY,
  RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION,
  RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
  RECORA_PROMPT_GENERATION_LOCALE,
  RECORA_PROMPT_GENERATION_SEMANTICS_VERSION,
  RECORA_REGULATORY_FLAGS,
  RECORA_SENSITIVE_CONTEXTS,
  RECORA_SERVICE_COVERAGES,
  RECORA_SUBJECT_TYPES,
  type RecoraAudiencePriority,
  type RecoraAudienceScope,
  type RecoraBusinessDomain,
  type RecoraCommerceChannel,
  type RecoraCommerceRole,
  type RecoraConfirmedActorRelation,
  type RecoraCustomerAction,
  type RecoraDecisionImpactFlag,
  type RecoraDeliveryMode,
  type RecoraDerivedTrustProfile,
  type RecoraGenerationCustomerSide,
  type RecoraGenerationStructureSignal,
  type RecoraGeographicBinding,
  type RecoraJapanAreaRef,
  type RecoraLifecycleSignal,
  type RecoraLocationStructure,
  type RecoraOfferingModel,
  type RecoraPromptGenerationBlockerCode,
  type RecoraPromptGenerationDraftInputV1,
  type RecoraPromptGenerationIdentity,
  type RecoraPromptGenerationInputV1,
  type RecoraPromptGenerationNormalizationResultV1,
  type RecoraPromptGenerationReviewCode,
  type RecoraPromptGenerationReviewQuestion,
  type RecoraRegulatoryFlag,
  type RecoraSensitiveContext,
  type RecoraServiceCoverage,
  type RecoraSubjectRef,
  type RecoraSubjectType
} from "./prompt-generation-input";

const TRUST_VERSION = "recora_trust_derivation_v1" as const;
type Acc = {
  blockers: RecoraPromptGenerationBlockerCode[];
  reviews: RecoraPromptGenerationReviewQuestion[];
  warnings: string[];
};
type DraftSubjectRef = { type?: string; name?: string; aliases?: readonly string[]; officialUrl?: string | null };
type DraftAreaRef = { areaKey?: string | null; label?: string; level?: string; parentAreaKey?: string | null; resolutionStatus?: string };
type DraftActorRelation = { leftRoleKey?: string; rightRoleKey?: string; relation?: string };

export function normalizeRecoraPromptGenerationInput(
  draft: RecoraPromptGenerationDraftInputV1
): RecoraPromptGenerationNormalizationResultV1 {
  const acc: Acc = { blockers: [], reviews: [], warnings: [] };
  if (text(draft.contractVersion) !== RECORA_PROMPT_GENERATION_DRAFT_CONTRACT_VERSION) {
    acc.blockers.push("unsupported_contract_version");
  }
  if (text(draft.market?.country) !== RECORA_PROMPT_GENERATION_COUNTRY) {
    acc.blockers.push("unsupported_country");
  }
  if (text(draft.market?.locale).toLowerCase() !== RECORA_PROMPT_GENERATION_LOCALE.toLowerCase()) {
    acc.blockers.push("unsupported_locale");
  }

  const primary = subject(draft.subject?.primary, true, acc);
  const secondary = subjects(draft.subject?.secondary, acc);
  const scope = requiredEnum(
    draft.audience?.scope,
    RECORA_AUDIENCE_SCOPES,
    "audience_scope_missing",
    "audience_scope_invalid",
    acc
  );
  const priority = nullableEnum(
    draft.audience?.priority,
    RECORA_AUDIENCE_PRIORITIES,
    "audience_priority_invalid",
    acc
  );
  if (scope === "both" && priority == null) addReview(acc, "audience_priority_required");
  if (scope && scope !== "both" && priority != null) acc.blockers.push("unexpected_audience_priority");

  const primaryDomain = requiredEnum(
    draft.business?.primaryDomain,
    RECORA_BUSINESS_DOMAINS,
    "primary_business_domain_missing",
    "primary_business_domain_invalid",
    acc
  );
  const secondaryDomains = enumList(
    draft.business?.secondaryDomains,
    RECORA_BUSINESS_DOMAINS,
    "primary_business_domain_invalid",
    acc
  );
  const primaryOfferingModel = requiredEnum(
    draft.business?.primaryOfferingModel,
    RECORA_OFFERING_MODELS,
    "primary_offering_model_missing",
    "primary_offering_model_invalid",
    acc
  );
  const secondaryOfferingModels = enumList(
    draft.business?.secondaryOfferingModels,
    RECORA_OFFERING_MODELS,
    "primary_offering_model_invalid",
    acc
  );
  const commerceChannels = enumList(
    draft.business?.commerceChannels,
    RECORA_COMMERCE_CHANNELS,
    "primary_offering_model_invalid",
    acc
  );
  const commerceRoles = enumList(
    draft.business?.commerceRoles,
    RECORA_COMMERCE_ROLES,
    "primary_offering_model_invalid",
    acc
  );
  const summary = text(draft.business?.summary);
  if (!summary) acc.blockers.push("business_summary_missing");

  const primaryAction = requiredEnum(
    draft.actions?.primary,
    RECORA_CUSTOMER_ACTIONS,
    "primary_action_missing",
    "primary_action_invalid",
    acc
  );
  const secondaryActions = enumList(
    draft.actions?.secondary,
    RECORA_CUSTOMER_ACTIONS,
    "primary_action_invalid",
    acc
  );

  const mode = requiredEnum(
    draft.delivery?.mode,
    RECORA_DELIVERY_MODES,
    "delivery_mode_missing",
    "delivery_mode_invalid",
    acc
  );
  const serviceCoverage = requiredEnum(
    draft.delivery?.serviceCoverage,
    RECORA_SERVICE_COVERAGES,
    "service_coverage_missing",
    "service_coverage_invalid",
    acc
  );
  const locationStructure = requiredEnum(
    draft.delivery?.locationStructure,
    RECORA_LOCATION_STRUCTURES,
    "location_structure_missing",
    "location_structure_invalid",
    acc
  );
  const geographicBinding = requiredEnum(
    draft.delivery?.geographicBinding,
    RECORA_GEOGRAPHIC_BINDINGS,
    "geographic_binding_missing",
    "geographic_binding_invalid",
    acc
  );
  const serviceAreas = areas(draft.delivery?.serviceAreas, acc);
  const locations = subjects(draft.delivery?.locations, acc, true);
  validateGeography(locationStructure, geographicBinding, serviceAreas, locations, acc);

  const decisionImpactFlags = enumList(
    draft.trust?.decisionImpactFlags,
    RECORA_DECISION_IMPACT_FLAGS,
    "trust_flag_invalid",
    acc
  );
  const regulatoryFlags = enumList(
    draft.trust?.regulatoryFlags,
    RECORA_REGULATORY_FLAGS,
    "trust_flag_invalid",
    acc
  );
  const sensitiveContexts = enumList(
    draft.trust?.sensitiveContexts,
    RECORA_SENSITIVE_CONTEXTS,
    "trust_flag_invalid",
    acc
  );
  const derived = deriveRecoraTrustProfileV1({
    decisionImpactFlags,
    regulatoryFlags,
    sensitiveContexts
  });

  const providedSignals = enumList(
    draft.generationContext?.structureSignals,
    RECORA_GENERATION_STRUCTURE_SIGNALS,
    "structure_signal_invalid",
    acc
  );
  const lifecycleSignals = enumList(
    draft.generationContext?.lifecycleSignals,
    RECORA_LIFECYCLE_SIGNALS,
    "lifecycle_signal_invalid",
    acc
  );
  const actorRelations = relations(draft.generationContext?.actorRelations, acc);
  if (actorRelations.some((item) => item.relation === "unknown")) {
    addReview(acc, "actor_relation_unconfirmed");
  }

  const structureSignals = deriveSignals({
    providedSignals,
    scope,
    primaryDomain,
    primaryOfferingModel,
    primaryAction,
    secondaryActions,
    mode,
    locationStructure,
    geographicBinding,
    regulatoryFlags
  });
  validateSignals(structureSignals, acc);
  addMotionReviews({
    primaryDomain,
    primaryOfferingModel,
    locationStructure,
    structureSignals,
    acc
  });

  const suppliedSides = enumList(
    draft.generationContext?.customerSides,
    RECORA_GENERATION_CUSTOMER_SIDES,
    "customer_side_invalid",
    acc
  );
  const customerSides = deriveCustomerSides(scope, structureSignals, suppliedSides);
  if (customerSides.length === 0) acc.blockers.push("customer_side_missing");

  const focusThemes = strings(draft.generationContext?.focusThemes);
  const diagnosisGoals = strings(draft.generationContext?.diagnosisGoals);
  if (acc.blockers.length > 0 || !primary || !scope || !primaryDomain || !primaryOfferingModel ||
      !primaryAction || !mode || !serviceCoverage || !locationStructure || !geographicBinding) {
    return result("blocked", null, acc);
  }

  const semanticInput = {
    contractVersion: RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
    market: {
      country: RECORA_PROMPT_GENERATION_COUNTRY,
      locale: RECORA_PROMPT_GENERATION_LOCALE
    },
    subject: {
      operatorCompanyName: nullableText(draft.subject?.operatorCompanyName),
      primary,
      secondary
    },
    audience: { scope, priority },
    business: {
      primaryDomain,
      secondaryDomains: without(secondaryDomains, primaryDomain),
      primaryOfferingModel,
      secondaryOfferingModels: without(secondaryOfferingModels, primaryOfferingModel),
      commerceChannels,
      commerceRoles,
      summary
    },
    actions: {
      primary: primaryAction,
      secondary: without(secondaryActions, primaryAction)
    },
    delivery: {
      mode,
      serviceCoverage,
      locationStructure,
      geographicBinding,
      serviceAreas,
      locations
    },
    trust: {
      decisionImpactFlags,
      regulatoryFlags,
      sensitiveContexts,
      derived
    },
    generationContext: {
      structureSignals,
      customerSides,
      actorRelations,
      lifecycleSignals,
      focusThemes,
      diagnosisGoals
    }
  } as Omit<RecoraPromptGenerationInputV1, "generationIdentity">;

  const value: RecoraPromptGenerationInputV1 = {
    ...semanticInput,
    generationIdentity: buildRecoraPromptGenerationIdentity(semanticInput)
  };
  return acc.reviews.length > 0
    ? result("needs_review", null, acc)
    : result("ready", value, acc);
}

export function deriveRecoraTrustProfileV1(input: {
  decisionImpactFlags: readonly RecoraDecisionImpactFlag[];
  regulatoryFlags: readonly RecoraRegulatoryFlag[];
  sensitiveContexts: readonly RecoraSensitiveContext[];
}): RecoraDerivedTrustProfile {
  const regulated = input.regulatoryFlags.length > 0;
  const critical =
    input.decisionImpactFlags.includes("safety_or_health") ||
    input.decisionImpactFlags.includes("livelihood") ||
    input.decisionImpactFlags.includes("legal_rights");
  const elevated = critical || input.decisionImpactFlags.length > 0 || input.sensitiveContexts.length > 0;
  return {
    decisionImpactLevel: critical ? "critical" : elevated ? "elevated" : "standard",
    derivedClass: regulated ? "regulated" : elevated ? "high_trust" : "standard",
    derivationVersion: TRUST_VERSION,
    reasons: unique([
      ...input.decisionImpactFlags.map((item) => `decision:${item}`),
      ...input.regulatoryFlags.map((item) => `regulatory:${item}`),
      ...input.sensitiveContexts.map((item) => `sensitive:${item}`)
    ])
  };
}

export function buildRecoraPromptGenerationIdentity(
  input: Omit<RecoraPromptGenerationInputV1, "generationIdentity">
): RecoraPromptGenerationIdentity {
  const semantic = {
    semanticsVersion: RECORA_PROMPT_GENERATION_SEMANTICS_VERSION,
    market: input.market,
    subject: input.subject,
    audience: input.audience,
    business: {
      ...input.business,
      summary: input.business.summary
    },
    actions: input.actions,
    delivery: input.delivery,
    trust: {
      decisionImpactFlags: input.trust.decisionImpactFlags,
      regulatoryFlags: input.trust.regulatoryFlags,
      sensitiveContexts: input.trust.sensitiveContexts,
      derived: {
        decisionImpactLevel: input.trust.derived.decisionImpactLevel,
        derivedClass: input.trust.derived.derivedClass,
        derivationVersion: input.trust.derived.derivationVersion
      }
    },
    generationContext: {
      structureSignals: input.generationContext.structureSignals,
      customerSides: input.generationContext.customerSides,
      actorRelations: input.generationContext.actorRelations,
      lifecycleSignals: input.generationContext.lifecycleSignals
    }
  };
  return {
    semanticsVersion: RECORA_PROMPT_GENERATION_SEMANTICS_VERSION,
    hashAlgorithm: "sha256",
    fingerprint: createHash("sha256").update(stableJson(semantic)).digest("hex")
  };
}

export function adaptProjectSetupSeedInputToPromptGenerationInput(
  seed: ProjectSetupSeedInput
): RecoraPromptGenerationNormalizationResultV1 {
  const reviewCodes: RecoraPromptGenerationReviewCode[] = [
    "legacy_audience_required",
    "legacy_primary_action_required",
    "legacy_business_model_required",
    "legacy_structure_confirmation_required"
  ];
  const warnings = [
    "legacy_seed_requires_confirmation",
    seed.knownCompetitors?.length ? "legacy_known_competitors_are_ignored_for_classification" : ""
  ].filter(Boolean);
  return {
    status: "needs_review",
    value: null,
    reviewQuestions: reviewCodes.map(reviewQuestion),
    blockers: [],
    warnings
  };
}

function deriveSignals(input: {
  providedSignals: readonly RecoraGenerationStructureSignal[];
  scope: RecoraAudienceScope | null;
  primaryDomain: RecoraBusinessDomain | null;
  primaryOfferingModel: RecoraOfferingModel | null;
  primaryAction: RecoraCustomerAction | null;
  secondaryActions: readonly RecoraCustomerAction[];
  mode: RecoraDeliveryMode | null;
  locationStructure: RecoraLocationStructure | null;
  geographicBinding: RecoraGeographicBinding | null;
  regulatoryFlags: readonly RecoraRegulatoryFlag[];
}): RecoraGenerationStructureSignal[] {
  const output = [...input.providedSignals];
  const actions = new Set([input.primaryAction, ...input.secondaryActions]);
  if (input.scope === "b2b" || input.scope === "both") output.push("b2b_buying_group");
  if (actions.has("start_subscription")) output.push("commerce_subscription");
  else if (input.primaryOfferingModel === "product" && actions.has("purchase")) output.push("commerce_single_purchase");
  if (input.locationStructure !== "none" || input.geographicBinding === "physical_location" || input.mode === "in_person") output.push("local_facility");
  if (input.primaryDomain === "recruiting_hr" && input.primaryOfferingModel === "saas_software") output.push("recruiting_employer_saas");
  if (input.primaryDomain === "manufacturing_industrial") output.push("manufacturing_capex");
  if (input.primaryDomain === "logistics_supply_chain") output.push("logistics_shipper_buying");
  if (input.primaryDomain === "media_content") output.push("media_brand");
  if (input.primaryOfferingModel === "professional_advisory" && (input.scope === "b2b" || input.scope === "both")) output.push("professional_service_b2b");
  if (input.regulatoryFlags.length > 0 && input.primaryDomain === "healthcare") output.push("adult_healthcare");
  return unique(output);
}

function addMotionReviews(input: {
  primaryDomain: RecoraBusinessDomain | null;
  primaryOfferingModel: RecoraOfferingModel | null;
  locationStructure: RecoraLocationStructure | null;
  structureSignals: readonly RecoraGenerationStructureSignal[];
  acc: Acc;
}) {
  const signals = new Set(input.structureSignals);
  const has = (...items: RecoraGenerationStructureSignal[]) => items.some((item) => signals.has(item));
  if (input.primaryDomain === "healthcare" && !has("adult_healthcare", "care_welfare")) addReview(input.acc, "healthcare_motion_required");
  if (input.primaryDomain === "education" && !has("adult_education", "child_education", "corporate_training")) addReview(input.acc, "education_motion_required");
  if (input.primaryDomain === "real_estate" && !has("real_estate_rental", "real_estate_purchase_residential", "real_estate_sale")) addReview(input.acc, "real_estate_motion_required");
  if (input.primaryDomain === "finance_insurance" && !has("insurance")) addReview(input.acc, "finance_motion_required");
  if (input.primaryOfferingModel === "marketplace_platform" && !has("marketplace_brand", "marketplace_operator_customer")) addReview(input.acc, "marketplace_motion_required");
  if (input.locationStructure === "multi_location" && !has("multi_location_consumer_brand", "multi_location_customer_organization")) addReview(input.acc, "multi_location_motion_required");
  if (input.primaryDomain === "travel_hospitality" && !has("individual_travel", "group_or_business_travel")) addReview(input.acc, "travel_motion_required");
}

function deriveCustomerSides(
  scope: RecoraAudienceScope | null,
  signals: readonly RecoraGenerationStructureSignal[],
  supplied: readonly RecoraGenerationCustomerSide[]
): RecoraGenerationCustomerSide[] {
  const output = [...supplied];
  const set = new Set(signals);
  if (set.has("marketplace_brand")) output.push("demand_side_participant", "supply_side_participant");
  else if (set.has("agency_delivery")) output.push("partner_or_intermediary", "prospective_customer");
  else if (set.has("b2b2c")) output.push("payer_or_sponsor", "end_user_or_beneficiary");
  else if (scope) output.push("prospective_customer");
  return unique(output);
}

function validateSignals(signals: readonly RecoraGenerationStructureSignal[], acc: Acc) {
  const pairs: readonly [RecoraGenerationStructureSignal, RecoraGenerationStructureSignal][] = [
    ["commerce_single_purchase", "commerce_subscription"],
    ["adult_education", "child_education"],
    ["adult_education", "corporate_training"],
    ["child_education", "corporate_training"],
    ["real_estate_rental", "real_estate_purchase_residential"],
    ["real_estate_rental", "real_estate_sale"],
    ["real_estate_purchase_residential", "real_estate_sale"],
    ["marketplace_brand", "marketplace_operator_customer"],
    ["multi_location_consumer_brand", "multi_location_customer_organization"],
    ["franchise_consumer_brand", "franchise_recruitment"],
    ["individual_travel", "group_or_business_travel"]
  ];
  const set = new Set(signals);
  if (pairs.some(([left, right]) => set.has(left) && set.has(right))) {
    acc.blockers.push("structure_signal_conflict");
  }
}

function validateGeography(
  locationStructure: RecoraLocationStructure | null,
  binding: RecoraGeographicBinding | null,
  serviceAreas: readonly RecoraJapanAreaRef[],
  locations: readonly RecoraSubjectRef[],
  acc: Acc
) {
  if (!locationStructure || !binding) return;
  if (locationStructure === "none" && (locations.length > 0 || ["physical_location", "service_area_and_physical_location"].includes(binding))) acc.blockers.push("delivery_geography_conflict");
  if (locationStructure !== "none" && !["physical_location", "service_area_and_physical_location"].includes(binding)) acc.blockers.push("delivery_geography_conflict");
  if (binding === "none" && (serviceAreas.length > 0 || locations.length > 0)) acc.blockers.push("delivery_geography_conflict");
  if (["service_area", "service_area_and_physical_location"].includes(binding) && serviceAreas.length === 0) addReview(acc, "service_area_details_required");
  if (["physical_location", "service_area_and_physical_location"].includes(binding) && locations.length === 0) addReview(acc, "physical_location_details_required");
}

function subject(
  value: DraftSubjectRef | undefined,
  required: boolean,
  acc: Acc,
  location = false
): RecoraSubjectRef | null {
  if (!value) {
    if (required) acc.blockers.push("primary_subject_missing");
    return null;
  }
  const type = enumValue(value.type, RECORA_SUBJECT_TYPES);
  const name = text(value.name);
  if (!type) acc.blockers.push(required ? "primary_subject_type_invalid" : "secondary_subject_invalid");
  if (!name) acc.blockers.push(required ? "primary_subject_name_missing" : "secondary_subject_invalid");
  if (location && type && type !== "location_facility") acc.blockers.push("location_invalid");
  const officialUrl = url(value.officialUrl, acc);
  return type && name ? { type, name, aliases: strings(value.aliases), officialUrl } : null;
}

function subjects(
  values: readonly DraftSubjectRef[] | undefined,
  acc: Acc,
  location = false
): RecoraSubjectRef[] {
  const output: RecoraSubjectRef[] = [];
  for (const value of values ?? []) {
    const item = subject(value, false, acc, location);
    if (item) output.push(item);
  }
  return dedupe(output, (item) => `${item.type}\u0000${item.name.toLowerCase()}\u0000${item.officialUrl ?? ""}`)
    .sort((a, b) => `${a.type}:${a.name}`.localeCompare(`${b.type}:${b.name}`, "ja"));
}

function areas(values: readonly DraftAreaRef[] | undefined, acc: Acc): RecoraJapanAreaRef[] {
  const output: RecoraJapanAreaRef[] = [];
  for (const value of values ?? []) {
    const label = text(value.label);
    const level = enumValue(value.level, RECORA_JAPAN_AREA_LEVELS);
    const resolutionStatus = enumValue(value.resolutionStatus, RECORA_JAPAN_AREA_RESOLUTION_STATUSES);
    if (!label || !level || !resolutionStatus) {
      acc.blockers.push("service_area_invalid");
      continue;
    }
    output.push({
      areaKey: nullableText(value.areaKey),
      label,
      level,
      parentAreaKey: nullableText(value.parentAreaKey),
      resolutionStatus
    });
  }
  return dedupe(output, (item) => `${item.areaKey ?? ""}\u0000${item.label.toLowerCase()}`)
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

function relations(
  values: readonly DraftActorRelation[] | undefined,
  acc: Acc
): RecoraConfirmedActorRelation[] {
  const byPair = new Map<string, RecoraConfirmedActorRelation>();
  for (const value of values ?? []) {
    const left = text(value.leftRoleKey);
    const right = text(value.rightRoleKey);
    const relation = enumValue(value.relation, RECORA_ACTOR_RELATIONS);
    if (!left || !right || !relation || left === right) {
      acc.blockers.push("actor_relation_invalid");
      continue;
    }
    const pair = [left, right].sort();
    const key = pair.join("\u0000");
    const existing = byPair.get(key);
    if (existing && existing.relation !== relation) acc.blockers.push("actor_relation_conflict");
    else byPair.set(key, { leftRoleKey: pair[0], rightRoleKey: pair[1], relation });
  }
  return Array.from(byPair.values()).sort((a, b) =>
    `${a.leftRoleKey}:${a.rightRoleKey}`.localeCompare(`${b.leftRoleKey}:${b.rightRoleKey}`)
  );
}

function requiredEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  missing: RecoraPromptGenerationBlockerCode,
  invalid: RecoraPromptGenerationBlockerCode,
  acc: Acc
): T | null {
  if (!text(raw)) {
    acc.blockers.push(missing);
    return null;
  }
  const value = enumValue(raw, allowed);
  if (!value) acc.blockers.push(invalid);
  return value;
}

function nullableEnum<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[],
  invalid: RecoraPromptGenerationBlockerCode,
  acc: Acc
): T | null {
  if (!text(raw)) return null;
  const value = enumValue(raw, allowed);
  if (!value) acc.blockers.push(invalid);
  return value;
}

function enumList<T extends string>(
  values: readonly string[] | undefined,
  allowed: readonly T[],
  invalid: RecoraPromptGenerationBlockerCode,
  acc: Acc
): T[] {
  const output: T[] = [];
  for (const raw of values ?? []) {
    const value = enumValue(raw, allowed);
    if (!value) acc.blockers.push(invalid);
    else output.push(value);
  }
  return unique(output);
}

function enumValue<T extends string>(raw: string | null | undefined, allowed: readonly T[]): T | null {
  const token = text(raw).toLowerCase().replace(/[\s-]+/g, "_");
  return allowed.find((item) => item === token) ?? null;
}

function reviewQuestion(code: RecoraPromptGenerationReviewCode): RecoraPromptGenerationReviewQuestion {
  const answers: Record<RecoraPromptGenerationReviewCode, readonly string[]> = {
    audience_priority_required: ["b2b_first", "b2c_first", "balanced"],
    healthcare_motion_required: ["adult_healthcare", "care_welfare"],
    education_motion_required: ["adult_education", "child_education", "corporate_training"],
    real_estate_motion_required: ["real_estate_rental", "real_estate_purchase_residential", "real_estate_sale"],
    finance_motion_required: ["insurance", "other_finance_requires_review"],
    marketplace_motion_required: ["marketplace_brand", "marketplace_operator_customer"],
    multi_location_motion_required: ["multi_location_consumer_brand", "multi_location_customer_organization"],
    travel_motion_required: ["individual_travel", "group_or_business_travel"],
    actor_relation_unconfirmed: ["same_actor", "distinct_actors"],
    service_area_details_required: ["provide_service_areas"],
    physical_location_details_required: ["provide_locations"],
    legacy_audience_required: ["b2b", "b2c", "both"],
    legacy_primary_action_required: [...RECORA_CUSTOMER_ACTIONS],
    legacy_business_model_required: ["confirm_business_domain_and_offering_model"],
    legacy_structure_confirmation_required: ["confirm_generation_structure"]
  };
  return { code, message: code, allowedAnswers: answers[code] };
}

function addReview(acc: Acc, code: RecoraPromptGenerationReviewCode) {
  if (!acc.reviews.some((item) => item.code === code)) acc.reviews.push(reviewQuestion(code));
}

function result(
  status: RecoraPromptGenerationNormalizationResultV1["status"],
  value: RecoraPromptGenerationInputV1 | null,
  acc: Acc
): RecoraPromptGenerationNormalizationResultV1 {
  return {
    status,
    value,
    reviewQuestions: acc.reviews.sort((a, b) => a.code.localeCompare(b.code)),
    blockers: unique(acc.blockers),
    warnings: unique(acc.warnings.filter(Boolean))
  };
}

function url(raw: string | null | undefined, acc: Acc): string | null {
  const value = text(raw);
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("protocol");
    parsed.hash = "";
    return parsed.toString();
  } catch {
    acc.blockers.push("subject_url_invalid");
    return null;
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function text(value: string | null | undefined): string {
  return value?.normalize("NFKC").trim().replace(/\s+/g, " ") ?? "";
}
function nullableText(value: string | null | undefined): string | null {
  return text(value) || null;
}
function strings(values: readonly string[] | undefined): string[] {
  return dedupe((values ?? []).map(text).filter(Boolean), (item) => item.toLocaleLowerCase("ja"))
    .sort((a, b) => a.localeCompare(b, "ja"));
}
function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort();
}
function without<T>(values: readonly T[], primary: T): T[] {
  return values.filter((item) => item !== primary);
}
function dedupe<T>(values: readonly T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((item) => {
    const token = key(item);
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}
