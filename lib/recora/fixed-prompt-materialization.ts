import { createHash } from "node:crypto";

import {
  MIN_DRAFT_CONFIDENCE_SCORE,
  MIN_PROMPT_QUALITY_SCORE,
  getBrandIdentityFromDraft,
  isApprovedReviewStatus,
  promptTextContainsBrandSignal,
  validateProjectSetupDraft,
  type BrandIdentityForDraft,
  type CompetitorDraft,
  type ProjectSetupDraft,
  type PromptDraft
} from "./project-setup-draft";
import type {
  RecoraFixedPromptCandidateMentionOpportunity,
  RecoraFixedPromptMetricEligibility,
  RecoraFixedPromptMetricEligibilityState,
  RecoraFixedPromptMetricKey,
  RecoraFixedPromptPanelRole,
  RecoraFixedPromptRankingOpportunity,
  RecoraFixedPromptResponseShape,
  RecoraPriority
} from "./db/types";
import type { RecoraMeasurementPurpose, RecoraPromptType } from "./prompt-scope";

export const RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION =
  "recora_fixed_prompt_configuration_v1" as const;

export const RECORA_FIXED_PROMPT_METRIC_KEYS = [
  "visibility",
  "ranking",
  "sov",
  "sentiment",
  "brand_perception",
  "natural_citation_observation",
  "forced_citation_validation",
  "risk_check",
  "recommendation_input"
] as const satisfies readonly RecoraFixedPromptMetricKey[];

export const RECORA_FIXED_PROMPT_PANEL_ROLES = [
  "core",
  "robustness",
  "diagnostic"
] as const satisfies readonly RecoraFixedPromptPanelRole[];

export type FixedPromptMetricEligibilityContext = {
  brandIdentity: BrandIdentityForDraft;
  knownCompetitors?: readonly string[];
  knownCompetitorAliases?: readonly string[];
};

export type FixedPromptMaterializationInput = {
  projectId?: string;
  projectSlug?: string;
  brandIdentity?: BrandIdentityForDraft;
  knownCompetitors?: readonly string[];
  knownCompetitorAliases?: readonly string[];
};

export type FixedPromptCompatibilityFields = {
  promptType: RecoraPromptType;
  measurementPurpose: RecoraMeasurementPurpose | null;
};

export type FixedPromptCanonicalPrompt = {
  id: string;
  project_id: string;
  topic_id: string;
  persona_id: string | null;
  text: string;
  intent: PromptDraft["intent"];
  buyer_stage: PromptDraft["buyerStage"];
  priority: RecoraPriority;
  is_active: boolean;
  prompt_type: RecoraPromptType;
  measurement_purpose: RecoraMeasurementPurpose | null;
  intent_key: string;
  panel_role: RecoraFixedPromptPanelRole;
  response_shape: RecoraFixedPromptResponseShape;
  candidate_mention_opportunity: RecoraFixedPromptCandidateMentionOpportunity;
  ranking_opportunity: RecoraFixedPromptRankingOpportunity;
  metric_eligibility: RecoraFixedPromptMetricEligibility;
  contract_version: typeof RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION;
};

export type FixedPromptSourceMapping = {
  sourceId: string;
  id: string;
};

export type FixedPromptMaterializationPlan = {
  contractVersion: typeof RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION;
  projectSlug: string;
  projectId: string;
  sourceMappings: {
    personas: readonly FixedPromptSourceMapping[];
    topics: readonly FixedPromptSourceMapping[];
    prompts: readonly FixedPromptSourceMapping[];
  };
  prompts: readonly FixedPromptCanonicalPrompt[];
  promptConfigurationCount: number;
  promptConfigurationHash: string;
  canonicalJson: string;
};

export type FixedPromptMaterializationValidation = {
  materializationReady: boolean;
  blockers: readonly string[];
  warnings: readonly string[];
};

export type FixedPromptMaterializationResult =
  | { ok: true; plan: FixedPromptMaterializationPlan }
  | { ok: false; blockers: readonly string[]; warnings: readonly string[] };

type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalJsonValue[]
  | { readonly [key: string]: CanonicalJsonValue };

const LOWERCASE_KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA_256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const REASON_CODE_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const PANEL_ROLE_SET = new Set<string>(RECORA_FIXED_PROMPT_PANEL_ROLES);
const MARKET_RESPONSE_SHAPES = new Set<PromptDraft["responseShape"]>([
  "candidate_list",
  "ranked_recommendation",
  "comparative_set"
]);
const RISK_CHECK_INTENT_KEY_GROUPS = new Set<string>([
  "implementation-risk",
  "regulated-risk",
  "price-reputation-risk",
  "local-price-reputation-risk"
]);

export class FixedPromptMaterializationError extends Error {
  readonly blockers: readonly string[];

  constructor(blockers: readonly string[]) {
    super(`Fixed prompt materialization blocked: ${blockers.join(", ")}`);
    this.name = "FixedPromptMaterializationError";
    this.blockers = blockers;
  }
}
export function tryMaterializeFixedPromptConfiguration(
  draft: ProjectSetupDraft,
  input: FixedPromptMaterializationInput = {}
): FixedPromptMaterializationResult {
  const validation = validateFixedPromptMaterializationDraft(draft, input);
  if (!validation.materializationReady) {
    return {
      ok: false,
      blockers: validation.blockers,
      warnings: validation.warnings
    };
  }

  try {
    return {
      ok: true,
      plan: materializeFixedPromptConfiguration(draft, input)
    };
  } catch (error) {
    if (error instanceof FixedPromptMaterializationError) {
      return { ok: false, blockers: error.blockers, warnings: [] };
    }
    throw error;
  }
}

export function materializeFixedPromptConfiguration(
  draft: ProjectSetupDraft,
  input: FixedPromptMaterializationInput = {}
): FixedPromptMaterializationPlan {
  const validation = validateFixedPromptMaterializationDraft(draft, input);
  if (!validation.materializationReady) {
    throw new FixedPromptMaterializationError(validation.blockers);
  }

  const projectSlug = resolveProjectSlug(draft, input);
  const projectId = resolveProjectId(projectSlug, input.projectId);
  const context = resolveMetricContext(draft, input);
  const personaIdBySource = buildSourceUuidMap(projectSlug, "persona", draft.personas.map((persona) => persona.personaId));
  const topicIdBySource = buildSourceUuidMap(projectSlug, "topic", draft.topics.map((topic) => topic.topicId));
  const promptIdBySource = buildSourceUuidMap(projectSlug, "prompt", draft.prompts.map((prompt) => prompt.promptId));

  const prompts = draft.prompts
    .map((prompt): FixedPromptCanonicalPrompt => {
      const metricEligibility = materializeFixedPromptMetricEligibility(prompt, context);
      const compatibility = materializeFixedPromptCompatibilityFields(prompt, metricEligibility, context);
      return {
        id: requireMapValue(promptIdBySource, prompt.promptId, "prompt_uuid_missing"),
        project_id: projectId,
        topic_id: requireMapValue(topicIdBySource, prompt.topicId, "topic_uuid_missing"),
        persona_id: prompt.personaId ? requireMapValue(personaIdBySource, prompt.personaId, "persona_uuid_missing") : null,
        text: normalizeCanonicalText(prompt.text),
        intent: prompt.intent,
        buyer_stage: prompt.buyerStage,
        priority: getPromptPriority(prompt),
        is_active: true,
        prompt_type: compatibility.promptType,
        measurement_purpose: compatibility.measurementPurpose,
        intent_key: requirePromptIntentKey(prompt),
        panel_role: requirePromptPanelRole(prompt),
        response_shape: prompt.responseShape,
        candidate_mention_opportunity: prompt.candidateMentionOpportunity,
        ranking_opportunity: prompt.rankingOpportunity,
        metric_eligibility: metricEligibility,
        contract_version: RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const promptValidation = validateFixedPromptCanonicalPrompts(prompts);
  if (!promptValidation.materializationReady) {
    throw new FixedPromptMaterializationError(promptValidation.blockers);
  }

  const canonicalPayload = {
    contract_version: RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
    project_id: projectId,
    prompts
  };
  const canonicalJson = canonicalizeJson(canonicalPayload);
  const promptConfigurationHash = sha256Lowercase(canonicalJson);

  return {
    contractVersion: RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
    projectSlug,
    projectId,
    sourceMappings: {
      personas: mapToSortedSourceMappings(personaIdBySource),
      topics: mapToSortedSourceMappings(topicIdBySource),
      prompts: mapToSortedSourceMappings(promptIdBySource)
    },
    prompts,
    promptConfigurationCount: prompts.length,
    promptConfigurationHash,
    canonicalJson
  };
}

export function validateFixedPromptMaterializationDraft(
  draft: ProjectSetupDraft,
  input: FixedPromptMaterializationInput = {}
): FixedPromptMaterializationValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const structure = validateProjectSetupDraft(draft);
  blockers.push(...structure.blockers);
  warnings.push(...structure.warnings);

  const projectSlug = resolveProjectSlug(draft, input);
  if (!hasText(projectSlug)) blockers.push("project_slug_required");
  if (hasText(projectSlug) && !LOWERCASE_KEBAB_CASE.test(projectSlug)) {
    blockers.push("project_slug_must_be_lowercase_kebab_case");
  }
  if (input.projectId != null && !UUID_PATTERN.test(input.projectId)) {
    blockers.push("project_id_must_be_uuid");
  }
  if (!isApprovedReviewStatus(draft.reviewStatus)) blockers.push("draft_review_status_not_approved");
  if (draft.confidenceScore < MIN_DRAFT_CONFIDENCE_SCORE) {
    blockers.push("draft_confidence_below_materialization_threshold");
  }

  addDuplicateSourceIdBlockers(blockers, "persona", draft.personas.map((persona) => persona.personaId));
  addDuplicateSourceIdBlockers(blockers, "topic", draft.topics.map((topic) => topic.topicId));
  addDuplicateSourceIdBlockers(blockers, "prompt", draft.prompts.map((prompt) => prompt.promptId));
  if (hasText(projectSlug) && LOWERCASE_KEBAB_CASE.test(projectSlug)) {
    addStableUuidCollisionBlockers(blockers, projectSlug, "persona", draft.personas.map((persona) => persona.personaId));
    addStableUuidCollisionBlockers(blockers, projectSlug, "topic", draft.topics.map((topic) => topic.topicId));
    addStableUuidCollisionBlockers(blockers, projectSlug, "prompt", draft.prompts.map((prompt) => prompt.promptId));
  }

  const context = resolveMetricContext(draft, input);
  const corePromptIdsByIntentKey = new Map<string, string[]>();
  const robustnessPromptIdsByIntentKey = new Map<string, string[]>();
  for (const persona of draft.personas) {
    if (!isApprovedReviewStatus(persona.reviewStatus)) {
      blockers.push(`persona ${label(persona.personaId)} review_status_not_approved`);
    }
  }

  for (const topic of draft.topics) {
    if (!isApprovedReviewStatus(topic.reviewStatus)) {
      blockers.push(`topic ${label(topic.topicId)} review_status_not_approved`);
    }
  }

  for (const competitor of draft.competitors) {
    if (!isApprovedReviewStatus(competitor.reviewStatus)) {
      blockers.push(`competitor ${label(competitor.competitorId)} review_status_not_approved`);
    }
  }

  for (const prompt of draft.prompts) {
    const promptLabel = label(prompt.promptId);
    const metricEligibility = materializeFixedPromptMetricEligibility(prompt, context);
    const intentKey = prompt.intentKey;
    const panelRole = prompt.panelRole;

    if (!isApprovedReviewStatus(prompt.reviewStatus)) {
      blockers.push(`prompt ${promptLabel} review_status_not_approved`);
    }
    if (prompt.confidenceScore < MIN_DRAFT_CONFIDENCE_SCORE) {
      blockers.push(`prompt ${promptLabel} confidence_below_materialization_threshold`);
    }
    if (prompt.qualityScore < MIN_PROMPT_QUALITY_SCORE) {
      blockers.push(`prompt ${promptLabel} quality_score_below_materialization_threshold`);
    }
    if (prompt.gateDecision !== "ready_for_measurement") {
      blockers.push(`prompt ${promptLabel} gate_decision_not_ready_for_measurement`);
    }
    if (!hasText(prompt.text)) {
      blockers.push(`prompt ${promptLabel} text_required`);
    }
    if (prompt.seedContaminationRisk === "medium" || prompt.seedContaminationRisk === "high") {
      blockers.push(`prompt ${promptLabel} seed_contamination_risk_requires_review`);
    }
    if (prompt.brandingMode === "brand_optional" || prompt.brandMentionRule === "brand_optional") {
      blockers.push(`prompt ${promptLabel} brand_optional_prompt_must_be_split_before_materialization`);
    }
    if (!hasText(intentKey)) {
      blockers.push(`prompt ${promptLabel} intent_key_missing`);
    } else if (!LOWERCASE_KEBAB_CASE.test(intentKey)) {
      blockers.push(`prompt ${promptLabel} intent_key_invalid`);
    }
    if (!hasText(panelRole)) {
      blockers.push(`prompt ${promptLabel} panel_role_missing`);
    } else if (!PANEL_ROLE_SET.has(panelRole)) {
      blockers.push(`prompt ${promptLabel} panel_role_invalid`);
    }

    if (hasText(intentKey) && panelRole === "core") {
      appendMapValue(corePromptIdsByIntentKey, intentKey, prompt.promptId);
    }
    if (hasText(intentKey) && panelRole === "robustness") {
      appendMapValue(robustnessPromptIdsByIntentKey, intentKey, prompt.promptId);
    }

    if ((panelRole === "core" || panelRole === "robustness") && !isPromptReadyForFixedMaterialization(prompt, metricEligibility)) {
      blockers.push(`prompt ${promptLabel} core_or_robustness_not_materialization_ready`);
    }
    if (!hasAnyEligibleFixedMetric(metricEligibility)) {
      blockers.push(`prompt ${promptLabel} no_eligible_analysis`);
    }
    if (
      metricEligibility.natural_citation_observation.state === "eligible" &&
      metricEligibility.forced_citation_validation.state === "eligible"
    ) {
      blockers.push(`prompt ${promptLabel} natural_and_forced_citation_must_be_separate`);
    }

    const identityBlockers = validatePromptIdentityBoundary(prompt, metricEligibility, context);
    blockers.push(...identityBlockers.map((blocker) => `prompt ${promptLabel} ${blocker}`));

    const compatibility = materializeFixedPromptCompatibilityFields(prompt, metricEligibility, context);
    const compatibilityBlocker = getCompatibilityHintBlocker(compatibility.measurementPurpose, metricEligibility);
    if (compatibilityBlocker) blockers.push(`prompt ${promptLabel} ${compatibilityBlocker}`);
  }

  corePromptIdsByIntentKey.forEach((promptIds, intentKey) => {
    if (promptIds.length > 1) {
      blockers.push(`intent ${intentKey} duplicate_core_prompts`);
    }
  });
  robustnessPromptIdsByIntentKey.forEach((promptIds, intentKey) => {
    if (!corePromptIdsByIntentKey.has(intentKey)) {
      blockers.push(`intent ${intentKey} robustness_without_core:${promptIds.join(",")}`);
    }
  });

  return validationResult(blockers, warnings);
}

export function validateFixedPromptCanonicalPrompts(
  prompts: readonly FixedPromptCanonicalPrompt[]
): FixedPromptMaterializationValidation {
  const blockers: string[] = [];
  const seenPromptIds = new Set<string>();
  const coreByIntentKey = new Map<string, string[]>();
  const robustnessByIntentKey = new Map<string, string[]>();

  for (const prompt of prompts) {
    const promptLabel = label(prompt.id);
    if (!UUID_PATTERN.test(prompt.id)) blockers.push(`prompt ${promptLabel} id_must_be_uuid`);
    if (!UUID_PATTERN.test(prompt.project_id)) blockers.push(`prompt ${promptLabel} project_id_must_be_uuid`);
    if (!UUID_PATTERN.test(prompt.topic_id)) blockers.push(`prompt ${promptLabel} topic_id_must_be_uuid`);
    if (prompt.persona_id != null && !UUID_PATTERN.test(prompt.persona_id)) {
      blockers.push(`prompt ${promptLabel} persona_id_must_be_uuid`);
    }
    if (!hasText(prompt.text)) blockers.push(`prompt ${promptLabel} text_required`);
    if (seenPromptIds.has(prompt.id)) blockers.push(`prompt ${promptLabel} duplicate_prompt_uuid`);
    seenPromptIds.add(prompt.id);
    if (prompt.contract_version !== RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION) {
      blockers.push(`prompt ${promptLabel} contract_version_invalid`);
    }
    if (!LOWERCASE_KEBAB_CASE.test(prompt.intent_key)) blockers.push(`prompt ${promptLabel} intent_key_invalid`);
    if (!PANEL_ROLE_SET.has(prompt.panel_role)) blockers.push(`prompt ${promptLabel} panel_role_invalid`);

    const shapeBlockers = validateMetricEligibilityShape(prompt.metric_eligibility)
      .map((blocker) => `prompt ${promptLabel} ${blocker}`);
    blockers.push(...shapeBlockers);

    if (hasAnyEligibleFixedMetric(prompt.metric_eligibility) === false) {
      blockers.push(`prompt ${promptLabel} no_eligible_analysis`);
    }
    if (
      prompt.metric_eligibility.natural_citation_observation.state === "eligible" &&
      prompt.metric_eligibility.forced_citation_validation.state === "eligible"
    ) {
      blockers.push(`prompt ${promptLabel} natural_and_forced_citation_must_be_separate`);
    }
    const compatibilityBlocker = getCompatibilityHintBlocker(prompt.measurement_purpose, prompt.metric_eligibility);
    if (compatibilityBlocker) blockers.push(`prompt ${promptLabel} ${compatibilityBlocker}`);

    if (prompt.panel_role === "core") appendMapValue(coreByIntentKey, prompt.intent_key, prompt.id);
    if (prompt.panel_role === "robustness") appendMapValue(robustnessByIntentKey, prompt.intent_key, prompt.id);
  }

  coreByIntentKey.forEach((promptIds, intentKey) => {
    if (promptIds.length > 1) blockers.push(`intent ${intentKey} duplicate_core_prompts`);
  });
  robustnessByIntentKey.forEach((promptIds, intentKey) => {
    if (!coreByIntentKey.has(intentKey)) {
      blockers.push(`intent ${intentKey} robustness_without_core:${promptIds.join(",")}`);
    }
  });

  return validationResult(blockers, []);
}
export function materializeFixedPromptMetricEligibility(
  prompt: PromptDraft,
  context: FixedPromptMetricEligibilityContext
): RecoraFixedPromptMetricEligibility {
  const targetBrandPresent = promptTextContainsBrandSignal(prompt.text, context.brandIdentity);
  const knownCompetitorPresent = promptTextContainsKnownCompetitorSignal(prompt.text, context);
  const explicitSelfBranded = isExplicitSelfBrandedPrompt(prompt);
  const brandOptional = prompt.brandingMode === "brand_optional" || prompt.brandMentionRule === "brand_optional";
  const forcedCitation = isForcedCitationPrompt(prompt);
  const namedCompetitor = isNamedCompetitorPrompt(prompt) || knownCompetitorPresent;
  const marketResponseShape = MARKET_RESPONSE_SHAPES.has(prompt.responseShape);
  const contaminationAcceptable = prompt.seedContaminationRisk === "none" || prompt.seedContaminationRisk === "low";
  const marketBoundary =
    prompt.brandingMode === "non_branded" &&
    prompt.brandMentionRule === "brand_excluded" &&
    !targetBrandPresent &&
    !brandOptional &&
    !forcedCitation &&
    !explicitSelfBranded &&
    !namedCompetitor &&
    marketResponseShape &&
    contaminationAcceptable;
  const visibility = marketBoundary && ["direct", "likely"].includes(prompt.candidateMentionOpportunity);
  const ranking = marketBoundary && ["direct", "comparable_set"].includes(prompt.rankingOpportunity);
  const sentiment =
    explicitSelfBranded &&
    (prompt.intent === "sentiment" || prompt.intentType === "reputational" || prompt.responseShape === "branded_sentiment_answer");
  const brandPerception =
    explicitSelfBranded &&
    (prompt.intent === "brand_perception" || prompt.intent === "branded" || prompt.responseShape === "branded_sentiment_answer");
  const riskCheck = prompt.intentType === "risk_checking" || hasRiskCheckIntentKey(prompt);
  const naturalCitationObservation =
    !forcedCitation &&
    !brandOptional &&
    (visibility || ranking || sentiment || brandPerception || riskCheck || prompt.responseShape === "explanatory_answer");
  const recommendationInput =
    visibility ||
    ranking ||
    sentiment ||
    brandPerception ||
    forcedCitation ||
    riskCheck ||
    prompt.responseShape === "evaluation_criteria" ||
    prompt.responseShape === "explanatory_answer" ||
    prompt.intent === "comparison" ||
    prompt.intent === "solution_aware";

  return normalizeFixedPromptMetricEligibility({
    visibility: metricEntry(visibility, "eligible_non_branded_candidate_opportunity", marketExclusionReasons({
      targetBrandPresent,
      knownCompetitorPresent,
      explicitSelfBranded,
      brandOptional,
      forcedCitation,
      marketResponseShape,
      contaminationAcceptable,
      opportunity: ["direct", "likely"].includes(prompt.candidateMentionOpportunity),
      opportunityReason: "candidate_mention_opportunity_not_direct_or_likely"
    })),
    ranking: metricEntry(ranking, "eligible_non_branded_ranking_opportunity", marketExclusionReasons({
      targetBrandPresent,
      knownCompetitorPresent,
      explicitSelfBranded,
      brandOptional,
      forcedCitation,
      marketResponseShape,
      contaminationAcceptable,
      opportunity: ["direct", "comparable_set"].includes(prompt.rankingOpportunity),
      opportunityReason: "ranking_opportunity_not_direct_or_comparable_set"
    })),
    sov: metricEntry(visibility, "eligible_visibility_denominator", visibility ? [] : ["sov_requires_visibility_eligibility"]),
    sentiment: metricEntry(sentiment, "eligible_self_branded_sentiment", explicitSelfBranded ? ["sentiment_intent_not_present"] : ["sentiment_requires_self_branded_prompt"]),
    brand_perception: metricEntry(brandPerception, "eligible_self_branded_perception", explicitSelfBranded ? ["brand_perception_intent_not_present"] : ["brand_perception_requires_self_branded_prompt"]),
    natural_citation_observation: metricEntry(naturalCitationObservation, "eligible_natural_citation_observation", forcedCitation ? ["forced_citation_uses_validation_metric"] : ["natural_citation_not_expected_for_prompt_shape"]),
    forced_citation_validation: metricEntry(forcedCitation, "eligible_forced_citation_validation", ["prompt_does_not_force_citation_validation"]),
    risk_check: metricEntry(riskCheck, "eligible_risk_check", ["prompt_not_risk_or_implementation_check"]),
    recommendation_input: metricEntry(recommendationInput, "eligible_recommendation_input", ["prompt_not_usable_for_recommendation_input"])
  });
}

export function materializeFixedPromptCompatibilityFields(
  prompt: PromptDraft,
  metricEligibility: RecoraFixedPromptMetricEligibility,
  context: FixedPromptMetricEligibilityContext
): FixedPromptCompatibilityFields {
  const targetBrandPresent = promptTextContainsBrandSignal(prompt.text, context.brandIdentity);
  const knownCompetitorPresent = promptTextContainsKnownCompetitorSignal(prompt.text, context);
  const forcedCitation = metricEligibility.forced_citation_validation.state === "eligible";
  const competitorOnly = isCompetitorOnlyPrompt(prompt);
  const explicitSelfBranded = isExplicitSelfBrandedPrompt(prompt) || targetBrandPresent;
  const explicitNamedCompetitor = isNamedCompetitorPrompt(prompt) || knownCompetitorPresent;
  const promptType = forcedCitation
    ? "citation_check"
    : competitorOnly
      ? "competitor_named"
      : explicitSelfBranded && explicitNamedCompetitor
        ? "comparison_named"
        : explicitSelfBranded
          ? "branded"
          : explicitNamedCompetitor
            ? "competitor_named"
            : isGenericComparisonPrompt(prompt)
              ? "comparison_generic"
              : "non_branded";

  const rawPurpose = selectMeasurementPurpose(metricEligibility);
  const measurementPurpose = promptType === "comparison_generic" && isMarketPurpose(rawPurpose)
    ? null
    : rawPurpose;

  return { promptType, measurementPurpose };
}

export function stableUuid(projectSlug: string, sourceId: string): string {
  if (!hasText(projectSlug) || !LOWERCASE_KEBAB_CASE.test(projectSlug)) {
    throw new Error("projectSlug must be lowercase kebab-case");
  }
  if (!hasText(sourceId)) throw new Error("sourceId is required");

  const digest = createHash("sha256")
    .update(`${projectSlug}\u0000${normalizeCanonicalText(sourceId)}`, "utf8")
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join("-");
}

export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(toCanonicalJsonValue(value));
}

export function sha256Lowercase(value: string): string {
  const hash = createHash("sha256").update(value, "utf8").digest("hex");
  if (!SHA_256_HEX_PATTERN.test(hash)) throw new Error("sha256_hash_generation_failed");
  return hash;
}

export function normalizeFixedPromptMetricEligibility(
  value: RecoraFixedPromptMetricEligibility
): RecoraFixedPromptMetricEligibility {
  const result: Partial<RecoraFixedPromptMetricEligibility> = {};
  for (const key of RECORA_FIXED_PROMPT_METRIC_KEYS) {
    const entry = value[key];
    result[key] = {
      state: entry.state,
      reason_codes: canonicalReasonCodes(entry.reason_codes)
    };
  }
  return result as RecoraFixedPromptMetricEligibility;
}

export function hasAnyEligibleFixedMetric(value: RecoraFixedPromptMetricEligibility): boolean {
  return RECORA_FIXED_PROMPT_METRIC_KEYS.some((key) => value[key].state === "eligible");
}

export function promptTextContainsKnownCompetitorSignal(
  text: string,
  context: Pick<FixedPromptMetricEligibilityContext, "knownCompetitors" | "knownCompetitorAliases">
): boolean {
  const normalizedText = normalizeIdentity(text);
  return getKnownCompetitorSignals(context).some((signal) => normalizedText.includes(signal));
}
function resolveMetricContext(
  draft: ProjectSetupDraft,
  input: FixedPromptMaterializationInput
): FixedPromptMetricEligibilityContext {
  const approvedCompetitors = draft.competitors.filter((competitor) => isApprovedReviewStatus(competitor.reviewStatus));
  return {
    brandIdentity: input.brandIdentity ?? getBrandIdentityFromDraft(draft),
    knownCompetitors: uniqueStrings([
      ...(draft.seedInput.knownCompetitors ?? []),
      ...(draft.seedInput.avoidCompetitors ?? []),
      ...approvedCompetitors.flatMap(getCompetitorPrimarySignals),
      ...(input.knownCompetitors ?? [])
    ]),
    knownCompetitorAliases: uniqueStrings([
      ...approvedCompetitors.flatMap((competitor) => competitor.brandAliases),
      ...(input.knownCompetitorAliases ?? [])
    ])
  };
}

function getCompetitorPrimarySignals(competitor: CompetitorDraft): string[] {
  return [
    competitor.rawName,
    competitor.normalizedName,
    competitor.companyName,
    competitor.productName,
    competitor.domain
  ].filter(hasText);
}

function resolveProjectSlug(draft: ProjectSetupDraft, input: FixedPromptMaterializationInput): string {
  return normalizeCanonicalText(input.projectSlug ?? draft.projectSlug ?? "");
}

function resolveProjectId(projectSlug: string, projectId: string | undefined): string {
  return projectId ?? stableUuid(projectSlug, `project:${projectSlug}`);
}

function buildSourceUuidMap(projectSlug: string, scope: "persona" | "topic" | "prompt", sourceIds: readonly string[]) {
  return new Map(sourceIds.map((sourceId) => [sourceId, stableUuid(projectSlug, scopedStableSourceId(scope, sourceId))]));
}

function scopedStableSourceId(scope: "persona" | "topic" | "prompt", sourceId: string): string {
  return `${scope}:${normalizeCanonicalText(sourceId)}`;
}

function mapToSortedSourceMappings(map: ReadonlyMap<string, string>): FixedPromptSourceMapping[] {
  return Array.from(map.entries())
    .map(([sourceId, id]) => ({ sourceId, id }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function requireMapValue(map: ReadonlyMap<string, string>, key: string, blocker: string): string {
  const value = map.get(key);
  if (!value) throw new FixedPromptMaterializationError([blocker]);
  return value;
}

function requirePromptIntentKey(prompt: PromptDraft): string {
  if (!hasText(prompt.intentKey)) throw new FixedPromptMaterializationError([`prompt ${label(prompt.promptId)} intent_key_missing`]);
  return prompt.intentKey;
}

function requirePromptPanelRole(prompt: PromptDraft): RecoraFixedPromptPanelRole {
  if (!hasText(prompt.panelRole) || !PANEL_ROLE_SET.has(prompt.panelRole)) {
    throw new FixedPromptMaterializationError([`prompt ${label(prompt.promptId)} panel_role_invalid`]);
  }
  return prompt.panelRole as RecoraFixedPromptPanelRole;
}

function validationResult(blockers: readonly string[], warnings: readonly string[]): FixedPromptMaterializationValidation {
  return {
    materializationReady: blockers.length === 0,
    blockers: uniqueStrings(blockers),
    warnings: uniqueStrings(warnings)
  };
}

function addDuplicateSourceIdBlockers(blockers: string[], scope: string, values: readonly string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!hasText(value)) continue;
    if (seen.has(value)) blockers.push(`duplicate_${scope}_source_id:${value}`);
    seen.add(value);
  }
}

function addStableUuidCollisionBlockers(
  blockers: string[],
  projectSlug: string,
  scope: "persona" | "topic" | "prompt",
  values: readonly string[]
) {
  const sourceIdByUuid = new Map<string, string>();
  for (const value of values) {
    if (!hasText(value)) continue;
    const uuid = stableUuid(projectSlug, scopedStableSourceId(scope, value));
    const previousValue = sourceIdByUuid.get(uuid);
    if (previousValue != null && previousValue !== value) {
      blockers.push(`${scope}_stable_uuid_collision:${previousValue}:${value}`);
      continue;
    }
    sourceIdByUuid.set(uuid, value);
  }
}

function appendMapValue(map: Map<string, string[]>, key: string, value: string) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function isPromptReadyForFixedMaterialization(
  prompt: PromptDraft,
  metricEligibility: RecoraFixedPromptMetricEligibility
): boolean {
  return (
    isApprovedReviewStatus(prompt.reviewStatus) &&
    prompt.confidenceScore >= MIN_DRAFT_CONFIDENCE_SCORE &&
    prompt.qualityScore >= MIN_PROMPT_QUALITY_SCORE &&
    prompt.gateDecision === "ready_for_measurement" &&
    prompt.seedContaminationRisk !== "medium" &&
    prompt.seedContaminationRisk !== "high" &&
    prompt.brandingMode !== "brand_optional" &&
    prompt.brandMentionRule !== "brand_optional" &&
    hasAnyEligibleFixedMetric(metricEligibility)
  );
}

function validatePromptIdentityBoundary(
  prompt: PromptDraft,
  metricEligibility: RecoraFixedPromptMetricEligibility,
  context: FixedPromptMetricEligibilityContext
): string[] {
  const blockers: string[] = [];
  const targetBrandPresent = promptTextContainsBrandSignal(prompt.text, context.brandIdentity);
  const knownCompetitorPresent = promptTextContainsKnownCompetitorSignal(prompt.text, context);
  const marketEligible =
    metricEligibility.visibility.state === "eligible" ||
    metricEligibility.ranking.state === "eligible" ||
    metricEligibility.sov.state === "eligible";

  if (isCompetitorOnlyPrompt(prompt) && targetBrandPresent) {
    blockers.push("competitor_only_contains_target_brand");
  }
  if ((prompt.brandMentionRule === "brand_excluded" || prompt.brandingMode === "non_branded") && targetBrandPresent) {
    blockers.push("target_brand_signal_in_brand_excluded_text");
  }
  if (isExplicitSelfBrandedPrompt(prompt) && !targetBrandPresent) {
    blockers.push("self_branded_text_missing_target_brand");
  }
  if (knownCompetitorPresent && !isNamedCompetitorPrompt(prompt)) {
    blockers.push("known_competitor_signal_without_named_competitor_scope");
  }
  if (marketEligible && knownCompetitorPresent) {
    blockers.push("known_competitor_signal_in_market_prompt");
  }

  return blockers;
}

function validateMetricEligibilityShape(value: RecoraFixedPromptMetricEligibility): string[] {
  const blockers: string[] = [];
  const keys = Object.keys(value);
  if (keys.length !== RECORA_FIXED_PROMPT_METRIC_KEYS.length) blockers.push("metric_eligibility_key_count_invalid");
  for (const key of RECORA_FIXED_PROMPT_METRIC_KEYS) {
    const entry = value[key];
    if (!entry) {
      blockers.push(`metric_eligibility_${key}_missing`);
      continue;
    }
    if (entry.state !== "eligible" && entry.state !== "excluded") {
      blockers.push(`metric_eligibility_${key}_state_invalid`);
    }
    if (!Array.isArray(entry.reason_codes) || entry.reason_codes.length === 0) {
      blockers.push(`metric_eligibility_${key}_reason_codes_missing`);
      continue;
    }
    for (const reason of entry.reason_codes) {
      if (!REASON_CODE_PATTERN.test(reason)) blockers.push(`metric_eligibility_${key}_reason_code_invalid`);
    }
  }
  for (const key of keys) {
    if (!(RECORA_FIXED_PROMPT_METRIC_KEYS as readonly string[]).includes(key)) {
      blockers.push(`metric_eligibility_unknown_key:${key}`);
    }
  }
  return uniqueStrings(blockers);
}
function getCompatibilityHintBlocker(
  purpose: RecoraMeasurementPurpose | null,
  metricEligibility: RecoraFixedPromptMetricEligibility
): string | null {
  const metricKey = measurementPurposeToMetricKey(purpose);
  if (metricKey && metricEligibility[metricKey].state !== "eligible") {
    return "compatibility_measurement_purpose_not_eligible";
  }
  return null;
}

function measurementPurposeToMetricKey(
  purpose: RecoraMeasurementPurpose | null
): RecoraFixedPromptMetricKey | null {
  if (purpose === "visibility") return "visibility";
  if (purpose === "ranking") return "ranking";
  if (purpose === "sov") return "sov";
  if (purpose === "sentiment") return "sentiment";
  if (purpose === "brand_perception") return "brand_perception";
  if (purpose === "citation_validation") return "forced_citation_validation";
  if (purpose === "recommendation_input") return "recommendation_input";
  return null;
}

function selectMeasurementPurpose(
  metricEligibility: RecoraFixedPromptMetricEligibility
): RecoraMeasurementPurpose | null {
  if (metricEligibility.forced_citation_validation.state === "eligible") return "citation_validation";
  if (metricEligibility.sentiment.state === "eligible") return "sentiment";
  if (metricEligibility.brand_perception.state === "eligible") return "brand_perception";
  if (metricEligibility.ranking.state === "eligible") return "ranking";
  if (metricEligibility.visibility.state === "eligible") return "visibility";
  if (metricEligibility.sov.state === "eligible") return "sov";
  if (metricEligibility.recommendation_input.state === "eligible") return "recommendation_input";
  return null;
}

function isMarketPurpose(purpose: RecoraMeasurementPurpose | null): boolean {
  return purpose === "visibility" || purpose === "ranking" || purpose === "sov";
}

function metricEntry(
  eligible: boolean,
  eligibleReason: string,
  excludedReasons: readonly string[]
): { state: RecoraFixedPromptMetricEligibilityState; reason_codes: string[] } {
  return {
    state: eligible ? "eligible" : "excluded",
    reason_codes: canonicalReasonCodes(eligible ? [eligibleReason] : excludedReasons)
  };
}

function marketExclusionReasons(input: {
  targetBrandPresent: boolean;
  knownCompetitorPresent: boolean;
  explicitSelfBranded: boolean;
  brandOptional: boolean;
  forcedCitation: boolean;
  marketResponseShape: boolean;
  contaminationAcceptable: boolean;
  opportunity: boolean;
  opportunityReason: string;
}): string[] {
  const reasons: string[] = [];
  if (input.targetBrandPresent || input.explicitSelfBranded) reasons.push("target_brand_excluded_from_market_metrics");
  if (input.knownCompetitorPresent) reasons.push("known_competitor_excluded_from_market_metrics");
  if (input.brandOptional) reasons.push("brand_optional_prompt_must_be_split");
  if (input.forcedCitation) reasons.push("forced_citation_separated_from_market_metrics");
  if (!input.marketResponseShape) reasons.push("response_shape_not_market_metric_eligible");
  if (!input.contaminationAcceptable) reasons.push("seed_contamination_not_acceptable");
  if (!input.opportunity) reasons.push(input.opportunityReason);
  return reasons.length > 0 ? reasons : ["market_metric_boundary_not_met"];
}

function hasRiskCheckIntentKey(prompt: PromptDraft): boolean {
  const intentKey = prompt.intentKey;
  if (!hasText(intentKey)) return false;
  return Array.from(RISK_CHECK_INTENT_KEY_GROUPS).some(
    (intentKeyGroup) => intentKey === intentKeyGroup || intentKey.endsWith(`-${intentKeyGroup}`)
  );
}

function isExplicitSelfBrandedPrompt(prompt: PromptDraft): boolean {
  return prompt.brandingMode === "branded" || prompt.brandMentionRule === "brand_included" || prompt.category === "branded";
}

function isCompetitorOnlyPrompt(prompt: PromptDraft): boolean {
  return prompt.brandingMode === "competitor_only" || prompt.brandMentionRule === "competitor_only";
}

function isNamedCompetitorPrompt(prompt: PromptDraft): boolean {
  return isCompetitorOnlyPrompt(prompt) || prompt.competitorMentionRule === "named_competitors";
}

function isGenericComparisonPrompt(prompt: PromptDraft): boolean {
  return (
    prompt.intent === "comparison" ||
    prompt.category === "competitor_comparison" ||
    prompt.category === "alternative_search" ||
    prompt.responseShape === "comparative_set"
  );
}

function isForcedCitationPrompt(prompt: PromptDraft): boolean {
  return prompt.intent === "citation_check" || prompt.category === "citation_check" || prompt.responseShape === "evidence_answer";
}

function getPromptPriority(prompt: PromptDraft): RecoraPriority {
  if (prompt.panelRole === "core") return "high";
  if (prompt.panelRole === "robustness") return "medium";
  return "low";
}

function canonicalReasonCodes(reasons: readonly string[]): string[] {
  const normalized = reasons
    .map((reason) => reason.trim().toLowerCase())
    .filter((reason) => reason.length > 0);
  const values = normalized.length > 0 ? normalized : ["deterministic_reason_required"];
  return Array.from(new Set(values)).sort();
}

function toCanonicalJsonValue(value: unknown): CanonicalJsonValue {
  if (value === undefined) throw new Error("canonical_json_undefined_value_forbidden");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return normalizeCanonicalText(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("canonical_json_non_finite_number_forbidden");
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => toCanonicalJsonValue(item));
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = isMetricEligibilityObject(record)
      ? RECORA_FIXED_PROMPT_METRIC_KEYS
      : Object.keys(record).sort();
    const result: Record<string, CanonicalJsonValue> = {};
    for (const key of keys) {
      if (record[key] === undefined) throw new Error(`canonical_json_undefined_value_forbidden:${key}`);
      result[key] = toCanonicalJsonValue(record[key]);
    }
    return result;
  }
  throw new Error(`canonical_json_unsupported_value_type:${typeof value}`);
}

function isMetricEligibilityObject(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return RECORA_FIXED_PROMPT_METRIC_KEYS.every((key) => keys.includes(key));
}

function normalizeCanonicalText(value: string): string {
  return value.normalize("NFC").replace(/\r\n?/g, "\n").trim();
}

function getKnownCompetitorSignals(
  context: Pick<FixedPromptMetricEligibilityContext, "knownCompetitors" | "knownCompetitorAliases">
): string[] {
  return uniqueStrings([
    ...(context.knownCompetitors ?? []),
    ...(context.knownCompetitorAliases ?? [])
  ]
    .map(normalizeIdentity)
    .filter((signal) => signal.length >= 2));
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠々ー]+/g, "")
    .trim();
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function label(value: string | null | undefined): string {
  return hasText(value) ? value : "(missing)";
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
