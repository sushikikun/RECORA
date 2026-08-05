import { createHash } from "node:crypto";

import type {
  RecoraGenerationCustomerSide,
  RecoraGenerationStructureSignal,
  RecoraLifecycleSignal,
  RecoraPromptGenerationInputV1
} from "./prompt-generation-input";

export const RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION =
  "recora_persona_blueprint_catalog_ja_v3" as const;
export const RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION =
  "recora_measurement_persona_compiler_v1" as const;
export const RECORA_PERSONA_GOLD_FIXTURE_VERSION =
  "recora_persona_gold_fixtures_ja_v3" as const;
export const RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION =
  "recora_measurement_persona_v3" as const;
export const RECORA_PERSONA_COMPILATION_CONTRACT_VERSION =
  "recora_persona_compilation_v3" as const;
export const RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT = 5 as const;

export const RECORA_PERSONA_COVERAGE_DIMENSIONS = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8"
] as const;

export const RECORA_PERSONA_TOPIC_INFLUENCE_DIMENSIONS = [
  "need_and_candidate_discovery",
  "comparison_and_alternatives",
  "action_and_contract_decision",
  "usage_or_outcome_fit",
  "trust_evidence_and_risk",
  "continuation_and_switching",
  "technical_and_operational_fit",
  "family_or_proxy_decision"
] as const;

export const RECORA_PERSONA_ROLE_FAMILIES = [
  "need_owner",
  "evaluator",
  "decision_owner",
  "payer",
  "end_user",
  "operator",
  "recipient",
  "champion",
  "reviewer",
  "ratifier",
  "blocker",
  "recommender",
  "advisor",
  "proxy",
  "existing_user",
  "provider",
  "funder",
  "creator"
] as const;

export const RECORA_PERSONA_BLUEPRINT_KINDS = [
  "selectable",
  "conditional",
  "modifier"
] as const;

export const RECORA_PERSONA_COMPILATION_STATUSES = [
  "ready",
  "needs_review",
  "catalog_gap",
  "blocked"
] as const;

export const RECORA_PERSONA_EXCLUSION_REASON_CODES = [
  "subject_internal",
  "wrong_customer_scope",
  "wrong_market_side",
  "wrong_business_motion",
  "unsupported_family_role",
  "unsupported_guardian_role",
  "unsupported_urgent_context",
  "unsupported_regulated_role",
  "modifier_not_standalone",
  "semantic_duplicate",
  "less_than_two_topic_effects",
  "lower_specificity_than_selected",
  "incompatible_with_primary_action",
  "incompatible_with_subject_type",
  "conditional_side_not_customer",
  "not_required_by_selected_recipe",
  "catalog_item_missing"
] as const;

export const RECORA_PERSONA_REVIEW_QUESTION_CODES = [
  "generation_input_needs_review",
  "actor_relation_changes_persona_count",
  "multiple_selection_recipes_match",
  "required_market_side_ambiguous",
  "required_family_role_ambiguous"
] as const;

export const RECORA_PERSONA_BLOCKER_CODES = [
  "generation_input_blocked",
  "unsupported_generation_input_version",
  "unsupported_persona_catalog_version",
  "unsupported_persona_compiler_version",
  "selected_count_mismatch",
  "selected_blueprint_missing",
  "selected_modifier_standalone",
  "selected_semantic_duplicate",
  "selected_topic_effects_insufficient",
  "required_coverage_missing",
  "required_market_side_missing",
  "conditional_blueprint_not_customer_side",
  "persona_identity_collision",
  "compiler_internal_invariant"
] as const;

export type RecoraPersonaCoverageDimension =
  typeof RECORA_PERSONA_COVERAGE_DIMENSIONS[number];
export type RecoraPersonaTopicInfluenceDimension =
  typeof RECORA_PERSONA_TOPIC_INFLUENCE_DIMENSIONS[number];
export type RecoraPersonaRoleFamily =
  typeof RECORA_PERSONA_ROLE_FAMILIES[number];
export type RecoraPersonaBlueprintKind =
  typeof RECORA_PERSONA_BLUEPRINT_KINDS[number];
export type RecoraPersonaCompilationStatus =
  typeof RECORA_PERSONA_COMPILATION_STATUSES[number];
export type RecoraPersonaExclusionReasonCode =
  typeof RECORA_PERSONA_EXCLUSION_REASON_CODES[number];
export type RecoraPersonaReviewQuestionCode =
  typeof RECORA_PERSONA_REVIEW_QUESTION_CODES[number];
export type RecoraPersonaBlockerCode =
  typeof RECORA_PERSONA_BLOCKER_CODES[number];

export type RecoraPersonaBlueprintV3 = {
  catalogVersion: typeof RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION;
  blueprintKey: string;
  pack: string;
  label: string;
  description: string;
  kind: RecoraPersonaBlueprintKind;
  coverageDimensions: readonly RecoraPersonaCoverageDimension[];
  roleFamily: RecoraPersonaRoleFamily;
  marketSide: RecoraGenerationCustomerSide;
  semanticGroupKey: string;
  topicInfluenceDimensions: readonly RecoraPersonaTopicInfluenceDimension[];
  requiredSignalsAny: readonly RecoraGenerationStructureSignal[];
  fixedOrder: number;
};

export type RecoraPersonaSelectionRecipeEntryV3 = {
  primaryBlueprintKey: string;
  supportingBlueprintKeys?: readonly string[];
  modifierBindings?: readonly {
    signal: RecoraLifecycleSignal;
    modifierBlueprintKey: string;
  }[];
};

export type RecoraPersonaSelectionRecipeV3 = {
  recipeKey: string;
  matchSignalsAll?: readonly RecoraGenerationStructureSignal[];
  matchSignalsAny?: readonly RecoraGenerationStructureSignal[];
  forbiddenSignals?: readonly RecoraGenerationStructureSignal[];
  selections: readonly [
    RecoraPersonaSelectionRecipeEntryV3,
    RecoraPersonaSelectionRecipeEntryV3,
    RecoraPersonaSelectionRecipeEntryV3,
    RecoraPersonaSelectionRecipeEntryV3,
    RecoraPersonaSelectionRecipeEntryV3
  ];
  alternativeBlueprintKeys: readonly string[];
  requiredCoverage: readonly RecoraPersonaCoverageDimension[];
  requiredMarketSides: readonly RecoraGenerationCustomerSide[];
  priority: number;
};

export type RecoraSelectedPersonaV3 = {
  contractVersion: typeof RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION;
  catalogVersion: typeof RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION;
  personaId: string;
  selectionSemanticKey: string;
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  modifierKeys: readonly string[];
  coverageDimensions: readonly RecoraPersonaCoverageDimension[];
  marketSides: readonly RecoraGenerationCustomerSide[];
  roleFamilies: readonly RecoraPersonaRoleFamily[];
  topicInfluenceDimensions: readonly RecoraPersonaTopicInfluenceDimension[];
  displayName: string;
  description: string;
  triggerSituation: string;
  primaryGoal: string;
  selectionEvidence: readonly string[];
  sortOrder: number;
};

export type RecoraPersonaAlternativeV3 = {
  blueprintKey: string;
  label: string;
  replaceableSelectionIndexes: readonly number[];
  rank: number;
  reasons: readonly string[];
};

export type RecoraPersonaExcludedV3 = {
  blueprintKey: string;
  reasonCodes: readonly RecoraPersonaExclusionReasonCode[];
};

export type RecoraPersonaReviewQuestionV3 = {
  code: RecoraPersonaReviewQuestionCode | string;
  message: string;
  allowedAnswers: readonly string[];
};

export type RecoraPersonaCompilationV3 = {
  contractVersion: typeof RECORA_PERSONA_COMPILATION_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION;
  catalogVersion: typeof RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION;
  status: RecoraPersonaCompilationStatus;
  selected: readonly RecoraSelectedPersonaV3[];
  alternatives: readonly RecoraPersonaAlternativeV3[];
  excluded: readonly RecoraPersonaExcludedV3[];
  reviewQuestions: readonly RecoraPersonaReviewQuestionV3[];
  blockers: readonly (RecoraPersonaBlockerCode | string)[];
  warnings: readonly string[];
  recipeKey: string | null;
  personaSelectionFingerprint: string | null;
};

export type RecoraPersonaGoldSelectionV3 = {
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  modifierKeys: readonly string[];
};

export type RecoraPersonaGoldFixtureV3 = {
  fixtureVersion: typeof RECORA_PERSONA_GOLD_FIXTURE_VERSION;
  caseKey: string;
  expectedStatus: RecoraPersonaCompilationStatus;
  generationInput: RecoraPromptGenerationInputV1 | null;
  upstreamReviewCodes?: readonly string[];
  upstreamBlockerCodes?: readonly string[];
  expectedRecipeKey?: string;
  expectedSelected?: readonly RecoraPersonaGoldSelectionV3[];
  expectedAlternativeKeys?: readonly string[];
  expectedExclusionCodes?: readonly RecoraPersonaExclusionReasonCode[];
};

const TOPIC_INFLUENCE_BY_COVERAGE: Record<
  RecoraPersonaCoverageDimension,
  readonly RecoraPersonaTopicInfluenceDimension[]
> = {
  C1: ["need_and_candidate_discovery", "usage_or_outcome_fit"],
  C2: ["comparison_and_alternatives", "trust_evidence_and_risk"],
  C3: ["action_and_contract_decision", "trust_evidence_and_risk"],
  C4: ["usage_or_outcome_fit", "continuation_and_switching"],
  C5: ["comparison_and_alternatives", "trust_evidence_and_risk"],
  C6: ["trust_evidence_and_risk", "technical_and_operational_fit"],
  C7: ["family_or_proxy_decision", "action_and_contract_decision"],
  C8: ["continuation_and_switching", "comparison_and_alternatives"]
};

export function personaTopicInfluencesForCoverage(
  coverage: readonly RecoraPersonaCoverageDimension[]
): readonly RecoraPersonaTopicInfluenceDimension[] {
  return unique(
    coverage.flatMap((dimension) => TOPIC_INFLUENCE_BY_COVERAGE[dimension])
  );
}

export function buildRecoraPersonaSelectionFingerprint(
  input: RecoraPromptGenerationInputV1
): string {
  const semantic = {
    version: "recora_persona_selection_semantics_v1",
    market: input.market,
    subject: input.subject,
    audience: input.audience,
    business: input.business,
    actions: input.actions,
    delivery: input.delivery,
    trust: {
      decisionImpactFlags: input.trust.decisionImpactFlags,
      regulatoryFlags: input.trust.regulatoryFlags,
      sensitiveContexts: input.trust.sensitiveContexts,
      derivedClass: input.trust.derived.derivedClass,
      decisionImpactLevel: input.trust.derived.decisionImpactLevel
    },
    generationContext: {
      structureSignals: input.generationContext.structureSignals,
      customerSides: input.generationContext.customerSides,
      actorRelations: input.generationContext.actorRelations,
      lifecycleSignals: input.generationContext.lifecycleSignals
    }
  };

  return createHash("sha256").update(stableJson(semantic)).digest("hex");
}

export function buildRecoraMeasurementPersonaId(input: {
  personaSelectionFingerprint: string;
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  modifierKeys: readonly string[];
}): string {
  const semantic = {
    version: RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION,
    personaSelectionFingerprint: input.personaSelectionFingerprint,
    primaryBlueprintKey: input.primaryBlueprintKey,
    supportingBlueprintKeys: unique(input.supportingBlueprintKeys),
    modifierKeys: unique(input.modifierKeys)
  };

  return `persona_v3_${createHash("sha256")
    .update(stableJson(semantic))
    .digest("hex")
    .slice(0, 32)}`;
}

export function buildRecoraPersonaSelectionSemanticKey(input: {
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  modifierKeys: readonly string[];
}): string {
  return [
    input.primaryBlueprintKey,
    unique(input.supportingBlueprintKeys).join(","),
    unique(input.modifierKeys).join(",")
  ].join("|");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).sort().join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort();
}