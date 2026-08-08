import { createHash } from "node:crypto";

import {
  RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION
} from "./prompt-generation-input";
import type {
  RecoraGenerationCustomerSide,
  RecoraPromptGenerationInputV1
} from "./prompt-generation-input";
import {
  RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
  RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT,
  RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
  RECORA_PERSONA_COMPILATION_CONTRACT_VERSION
} from "./measurement-persona-contract";
import type {
  RecoraPersonaCompilationV3,
  RecoraPersonaRoleFamily,
  RecoraPersonaTopicInfluenceDimension,
  RecoraSelectedPersonaV3
} from "./measurement-persona-contract";
import {
  RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION,
  RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION,
  RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDINGS_V1,
  RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1,
  RECORA_TOPIC_ALIAS_REGISTRY_JA_V1,
  RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
  RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1,
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,
  RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1,
  RECORA_TOPIC_RECIPE_MAPPING_VERSION,
  RECORA_TOPIC_SELECTION_SEMANTICS_VERSION
} from "./measurement-topic-contract";
import type {
  RecoraResolvedTopicSubtypeKeyV3,
  RecoraTopicBlueprintV3,
  RecoraTopicCoverageDimensionV3,
  RecoraTopicExpectedAnswerShapeV3,
  RecoraTopicExpectedEntityTypeV3,
  RecoraTopicMeasurementLaneKeyV3
} from "./measurement-topic-contract";
import {
  RECORA_TOPIC_BLUEPRINT_CATALOG_V3,
  validateRecoraMeasurementTopicCatalogV3
} from "./measurement-topic-catalog";
import {
  RECORA_TOPIC_SELECTION_RECIPES_V3,
  getRecoraTopicSelectionRecipeV3,
  validateRecoraTopicSelectionRecipesV3
} from "./measurement-topic-selection-rules";
import type {
  RecoraTopicPersonaSortOrderV3,
  RecoraTopicRecipeSlotV3,
  RecoraTopicSelectionRecipeV3
} from "./measurement-topic-selection-rules";

export const RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION =
  "recora_topic_selection_input_v3" as const;
export const RECORA_MEASUREMENT_TOPIC_CONTRACT_VERSION =
  "recora_measurement_topic_v3" as const;
export const RECORA_TOPIC_COMPILATION_CONTRACT_VERSION =
  "recora_topic_compilation_v3" as const;
export const RECORA_TOPIC_GOLD_FIXTURE_VERSION =
  "recora_topic_gold_fixtures_ja_v3" as const;
export const RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT = 6 as const;

export const RECORA_TOPIC_REVIEW_CODES_V3 = [
  "generation_input_needs_review",
  "persona_compilation_needs_review",
  "multiple_topic_recipes_match",
  "required_focus_theme_unmapped",
  "required_focus_themes_conflict",
  "prompt_subject_label_too_broad",
  "food_beauty_subtype_conflict",
  "required_market_side_ambiguous",
  "required_geographic_focus_without_context",
  "required_lifecycle_focus_without_persona_state"
] as const;

export const RECORA_TOPIC_CATALOG_GAP_CODES_V3 = [
  "required_topic_blueprint_missing",
  "approved_topic_bundle_incomplete",
  "selected_topic_count_mismatch",
  "required_topic_coverage_missing",
  "selected_topic_semantic_duplicate",
  "topic_primary_edge_missing",
  "persona_topic_coverage_missing",
  "required_market_side_coverage_missing"
] as const;

export const RECORA_TOPIC_BLOCKER_CODES_V3 = [
  "unsupported_topic_input_version",
  "unsupported_country",
  "unsupported_locale",
  "unsupported_persona_contract_version",
  "unsupported_persona_catalog_version",
  "unsupported_persona_compiler_version",
  "persona_compilation_blocked",
  "persona_selected_count_mismatch",
  "persona_identity_duplicate",
  "persona_semantic_key_duplicate",
  "topic_catalog_invalid",
  "topic_identity_collision",
  "compiler_internal_invariant"
] as const;

export const RECORA_TOPIC_WARNING_CODES_V3 = [
  "optional_focus_theme_unmapped",
  "optional_diagnosis_goal_unmapped",
  "food_beauty_subtype_unresolved",
  "generic_prompt_subject_label_used",
  "no_safe_topic_alternative",
  "specificity_fallback_used",
  "natural_citation_overlay_attached"
] as const;

export type RecoraTopicCompilationStatusV3 =
  | "ready"
  | "needs_review"
  | "catalog_gap"
  | "blocked";
export type RecoraTopicReviewCodeV3 =
  typeof RECORA_TOPIC_REVIEW_CODES_V3[number];
export type RecoraTopicCatalogGapCodeV3 =
  typeof RECORA_TOPIC_CATALOG_GAP_CODES_V3[number];
export type RecoraTopicBlockerCodeV3 =
  typeof RECORA_TOPIC_BLOCKER_CODES_V3[number];
export type RecoraTopicWarningCodeV3 =
  typeof RECORA_TOPIC_WARNING_CODES_V3[number];

export type RecoraTopicCompilerInputV3 = {
  contractVersion: typeof RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION;
  generationInput: RecoraPromptGenerationInputV1;
  personaCompilation: RecoraPersonaCompilationV3;
};

export type RecoraSelectedTopicMeasurementLaneV3 = {
  blueprintKey: string;
  laneKey: RecoraTopicMeasurementLaneKeyV3;
  allowedMetricKeys: readonly string[];
  forbiddenMetricKeys: readonly string[];
};

export type RecoraSelectedTopicV3 = {
  contractVersion: typeof RECORA_MEASUREMENT_TOPIC_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION;
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  topicId: string;
  selectionSemanticKey: string;
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  primaryCoverage: RecoraTopicCoverageDimensionV3;
  coverageDimensions: readonly RecoraTopicCoverageDimensionV3[];
  customerFacingNameTemplateKey: string;
  customerFacingName: string;
  internalSummary: string;
  promptSubjectLabelKey: string;
  promptSubjectLabel: string;
  personaIds: readonly string[];
  measurementLanes: readonly RecoraSelectedTopicMeasurementLaneV3[];
  measurementGoal: string;
  expectedEntityTypes: readonly RecoraTopicExpectedEntityTypeV3[];
  comparisonAxes: readonly string[];
  expectedAnswerShapes: readonly RecoraTopicExpectedAnswerShapeV3[];
  selectionEvidence: readonly string[];
  sortOrder: 1 | 2 | 3 | 4 | 5 | 6;
};

export type RecoraPersonaTopicEdgeV3 = {
  personaId: string;
  topicId: string;
  edgeRole: "primary" | "supporting";
  matchedBlueprintKeys: readonly string[];
  matchedInfluenceDimensions: readonly RecoraPersonaTopicInfluenceDimension[];
  matchedRoleFamilies: readonly RecoraPersonaRoleFamily[];
  matchedMarketSides: readonly RecoraGenerationCustomerSide[];
  reasons: readonly string[];
};

export type RecoraTopicObservationOverlayV3 = {
  overlayKey: "diagnostic.natural_citation_observation";
  policyVersion: typeof RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION;
  laneKey: "natural_citation_overlay";
  appliesToTopicIds: readonly string[];
  excludedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  metricKey: "naturalCitationObservation";
  reasons: readonly string[];
};

export type RecoraTopicAlternativeV3 = {
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  replaceableTopicIndexes: readonly number[];
  rank: number;
  resultingPrimaryCoverage: RecoraTopicCoverageDimensionV3;
  resultingLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  reasons: readonly string[];
};

export type RecoraTopicExcludedV3 = {
  blueprintKey: string;
  reasonCodes: readonly string[];
};

export type RecoraTopicReviewQuestionV3 = {
  code: RecoraTopicReviewCodeV3 | string;
  message: string;
  allowedAnswers: readonly string[];
};

export type RecoraTopicSelectionIdentityV3 = {
  semanticsVersion: typeof RECORA_TOPIC_SELECTION_SEMANTICS_VERSION;
  hashAlgorithm: "sha256";
  fingerprint: string;
};

export type RecoraReadyTopicCompilationV3 = {
  contractVersion: typeof RECORA_TOPIC_COMPILATION_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION;
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  status: "ready";
  selected: readonly RecoraSelectedTopicV3[];
  personaTopicEdges: readonly RecoraPersonaTopicEdgeV3[];
  alternatives: readonly RecoraTopicAlternativeV3[];
  excluded: readonly RecoraTopicExcludedV3[];
  observationOverlays: readonly RecoraTopicObservationOverlayV3[];
  reviewQuestions: readonly [];
  blockers: readonly [];
  warnings: readonly string[];
  topicRecipeKey: string;
  topicSelectionIdentity: RecoraTopicSelectionIdentityV3;
};

export type RecoraNonReadyTopicCompilationV3 = {
  contractVersion: typeof RECORA_TOPIC_COMPILATION_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION;
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  status: Exclude<RecoraTopicCompilationStatusV3, "ready">;
  selected: readonly [];
  personaTopicEdges: readonly [];
  alternatives: readonly [];
  excluded: readonly RecoraTopicExcludedV3[];
  observationOverlays: readonly [];
  reviewQuestions: readonly RecoraTopicReviewQuestionV3[];
  blockers: readonly string[];
  warnings: readonly string[];
  topicRecipeKey: string | null;
  topicSelectionIdentity: null;
};

export type RecoraTopicCompilationV3 =
  | RecoraReadyTopicCompilationV3
  | RecoraNonReadyTopicCompilationV3;

export type RecoraMeasurementTopicCompilerOptionsV3 = {
  catalog?: readonly RecoraTopicBlueprintV3[];
  recipes?: readonly RecoraTopicSelectionRecipeV3[];
};

type ResolvedPromptSubjectLabel = {
  key: string;
  label: string;
  generic: boolean;
};

type ResolvedAliasContext = {
  mappedFocusKeys: readonly string[];
  mappedDiagnosisKeys: readonly string[];
  requestedBlueprintKeys: readonly string[];
  requiredBlueprintKeys: readonly string[];
  requiredUnmapped: readonly string[];
  optionalFocusUnmapped: readonly string[];
  optionalDiagnosisUnmapped: readonly string[];
  subtype: RecoraResolvedTopicSubtypeKeyV3 | null;
  subtypeConflict: boolean;
};

type TopicDraft = {
  primary: RecoraTopicBlueprintV3;
  supporting: readonly RecoraTopicBlueprintV3[];
  coverage: RecoraTopicCoverageDimensionV3;
  label: ResolvedPromptSubjectLabel;
  sortOrder: 1 | 2 | 3 | 4 | 5 | 6;
};

type MatchedPersonaAuthority = {
  persona: RecoraSelectedPersonaV3;
  matchedBlueprintKeys: readonly string[];
  matchedInfluenceDimensions: readonly RecoraPersonaTopicInfluenceDimension[];
  matchedRoleFamilies: readonly RecoraPersonaRoleFamily[];
  matchedMarketSides: readonly RecoraGenerationCustomerSide[];
};

type EdgeDraft = MatchedPersonaAuthority & {
  topicIndex: number;
  edgeRole: "primary" | "supporting";
};

const SPECIFICITY_RANK = {
  structure_motion: 0,
  industry: 1,
  offering_subject: 2,
  audience: 3,
  common: 4
} as const;

export function compileRecoraMeasurementTopicsV3(
  input: RecoraTopicCompilerInputV3,
  options: RecoraMeasurementTopicCompilerOptionsV3 = {}
): RecoraTopicCompilationV3 {
  if (
    input.contractVersion !== RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION ||
    input.generationInput.contractVersion !==
      RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION
  ) {
    return nonReady("blocked", {
      blockers: ["unsupported_topic_input_version"]
    });
  }

  const generation = input.generationInput;
  if (generation.market.country !== "JP") {
    return nonReady("blocked", { blockers: ["unsupported_country"] });
  }
  if (generation.market.locale !== "ja-JP") {
    return nonReady("blocked", { blockers: ["unsupported_locale"] });
  }

  const personaCompilation = input.personaCompilation;
  if (
    personaCompilation.contractVersion !==
    RECORA_PERSONA_COMPILATION_CONTRACT_VERSION
  ) {
    return nonReady("blocked", {
      blockers: ["unsupported_persona_contract_version"]
    });
  }
  if (
    personaCompilation.catalogVersion !==
    RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION
  ) {
    return nonReady("blocked", {
      blockers: ["unsupported_persona_catalog_version"]
    });
  }
  if (
    personaCompilation.compilerVersion !==
    RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION
  ) {
    return nonReady("blocked", {
      blockers: ["unsupported_persona_compiler_version"]
    });
  }
  if (personaCompilation.status === "needs_review") {
    return nonReady("needs_review", {
      reviewQuestions: [
        {
          code: "persona_compilation_needs_review",
          message: "Persona Compilationの確認事項を解消してください。",
          allowedAnswers: personaCompilation.reviewQuestions.flatMap(
            (item) => item.allowedAnswers
          )
        }
      ],
      warnings: personaCompilation.warnings
    });
  }
  if (personaCompilation.status === "catalog_gap") {
    return nonReady("catalog_gap", {
      blockers: personaCompilation.blockers,
      warnings: personaCompilation.warnings
    });
  }
  if (personaCompilation.status !== "ready") {
    return nonReady("blocked", {
      blockers: [
        "persona_compilation_blocked",
        ...personaCompilation.blockers
      ],
      warnings: personaCompilation.warnings
    });
  }

  const personaGate = validatePersonaSet(personaCompilation.selected);
  if (personaGate.length > 0) {
    return nonReady("blocked", { blockers: personaGate });
  }

  const catalog = options.catalog ?? RECORA_TOPIC_BLUEPRINT_CATALOG_V3;
  const catalogGate = validateCatalogAuthority(catalog, options.catalog == null);
  if (catalogGate.length > 0) {
    return nonReady("blocked", {
      blockers: ["topic_catalog_invalid", ...catalogGate]
    });
  }

  const recipes = options.recipes ?? RECORA_TOPIC_SELECTION_RECIPES_V3;
  const recipeGate =
    options.recipes == null
      ? validateRecoraTopicSelectionRecipesV3().blockers
      : validateCustomRecipeAuthority(recipes);
  if (recipeGate.length > 0) {
    return nonReady("blocked", {
      blockers: ["compiler_internal_invariant", ...recipeGate]
    });
  }

  const matchingRecipes = recipes.filter(
    (item) => item.personaRecipeKey === personaCompilation.recipeKey
  );
  if (matchingRecipes.length > 1) {
    return nonReady("needs_review", {
      reviewQuestions: [
        {
          code: "multiple_topic_recipes_match",
          message: "複数のTopic Recipeが同じPersona Recipeへ一致しました。",
          allowedAnswers: matchingRecipes.map((item) => item.recipeKey)
        }
      ]
    });
  }
  const recipe =
    matchingRecipes[0] ??
    getRecoraTopicSelectionRecipeV3(personaCompilation.recipeKey);
  if (!recipe) {
    return nonReady("catalog_gap", {
      blockers: ["required_topic_blueprint_missing"],
      warnings: ["topic_recipe_not_found"]
    });
  }

  const aliasContext = resolveAliasContext(generation);
  if (aliasContext.subtypeConflict) {
    return nonReady("needs_review", {
      reviewQuestions: [
        {
          code: "food_beauty_subtype_conflict",
          message:
            "飲食と美容の両方へ一致するため、測定対象の分類を確認してください。",
          allowedAnswers: [
            "food_dining",
            "beauty_wellness",
            "other_lifestyle"
          ]
        }
      ],
      topicRecipeKey: recipe.recipeKey
    });
  }
  if (aliasContext.requiredUnmapped.length > 0) {
    return nonReady("needs_review", {
      reviewQuestions: aliasContext.requiredUnmapped.map((value) => ({
        code: "required_focus_theme_unmapped",
        message: `必須テーマをレビュー済みTopicへ対応付けられません: ${value}`,
        allowedAnswers: ["remove_requirement", "select_reviewed_topic"]
      })),
      topicRecipeKey: recipe.recipeKey
    });
  }

  const byKey = new Map(catalog.map((item) => [item.blueprintKey, item]));
  if (hasRequiredThemeConflict(aliasContext, byKey)) {
    return nonReady("needs_review", {
      reviewQuestions: [
        {
          code: "required_focus_themes_conflict",
          message:
            "複数の必須テーマが同じCoverage枠で競合し、承認済みbundleを確定できません。",
          allowedAnswers: ["choose_primary_theme", "remove_requirement"]
        }
      ],
      topicRecipeKey: recipe.recipeKey
    });
  }
  if (
    hasRequiredGeographicFocus(generation) &&
    generation.delivery.geographicBinding === "none"
  ) {
    return nonReady("needs_review", {
      reviewQuestions: [
        {
          code: "required_geographic_focus_without_context",
          message: "地域を必須テーマにしましたが地域条件がありません。",
          allowedAnswers: ["add_geography", "remove_requirement"]
        }
      ],
      topicRecipeKey: recipe.recipeKey
    });
  }
  if (
    hasRequiredLifecycleFocus(generation) &&
    generation.generationContext.lifecycleSignals.length === 0
  ) {
    return nonReady("needs_review", {
      reviewQuestions: [
        {
          code: "required_lifecycle_focus_without_persona_state",
          message:
            "継続・解約・乗り換えを必須にしましたがLifecycle状態がありません。",
          allowedAnswers: ["add_lifecycle_state", "remove_requirement"]
        }
      ],
      topicRecipeKey: recipe.recipeKey
    });
  }

  const eligible = catalog.filter(
    (item) =>
      item.kind !== "observation_overlay" &&
      isBlueprintApplicable(
        item,
        generation,
        personaCompilation.selected,
        aliasContext.subtype
      )
  );
  const eligibleKeys = new Set(eligible.map((item) => item.blueprintKey));

  const draftResult = resolveTopicDrafts({
    recipe,
    generation,
    eligible,
    eligibleKeys,
    byKey,
    aliasContext
  });
  if (draftResult.status !== "ready") {
    return nonReady(draftResult.status, {
      blockers: draftResult.blockers,
      warnings: draftResult.warnings,
      reviewQuestions: draftResult.reviewQuestions,
      topicRecipeKey: recipe.recipeKey
    });
  }

  const edgeResult = buildEdgeDrafts(
    draftResult.drafts,
    personaCompilation.selected,
    recipe
  );
  if (!edgeResult.valid) {
    return nonReady("catalog_gap", {
      blockers: edgeResult.blockers,
      warnings: edgeResult.warnings,
      topicRecipeKey: recipe.recipeKey
    });
  }

  const identity = buildTopicSelectionIdentity(
    generation,
    personaCompilation.selected,
    recipe,
    aliasContext,
    draftResult.drafts
  );
  const materialized = materializeTopics(
    draftResult.drafts,
    edgeResult.edges,
    identity,
    recipe.recipeKey
  );
  if (
    new Set(materialized.selected.map((item) => item.topicId)).size !==
    materialized.selected.length
  ) {
    return nonReady("blocked", {
      blockers: ["topic_identity_collision"],
      topicRecipeKey: recipe.recipeKey
    });
  }

  const observationOverlays: readonly RecoraTopicObservationOverlayV3[] = [
    {
      overlayKey: "diagnostic.natural_citation_observation",
      policyVersion: RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION,
      laneKey: "natural_citation_overlay",
      appliesToTopicIds: materialized.selected
        .filter((topic) =>
          topic.measurementLanes.some(
            (lane) => lane.laneKey !== "forced_citation_validation"
          )
        )
        .map((topic) => topic.topicId),
      excludedLaneKeys: ["forced_citation_validation"],
      metricKey: "naturalCitationObservation",
      reasons: [
        "通常Promptに自然に付いた引用を6Topic横断で観測する",
        "強制引用確認とは別集計にする"
      ]
    }
  ];

  const alternatives = buildAlternatives({
    drafts: draftResult.drafts,
    eligibleKeys,
    byKey,
    recipe,
    generation,
    personas: personaCompilation.selected,
    aliasContext
  });
  const selectedKeys = new Set(
    draftResult.drafts.flatMap((draft) => [
      draft.primary.blueprintKey,
      ...draft.supporting.map((item) => item.blueprintKey)
    ])
  );
  const excluded = catalog
    .filter(
      (item) =>
        item.kind !== "observation_overlay" &&
        !selectedKeys.has(item.blueprintKey)
    )
    .map((item) => ({
      blueprintKey: item.blueprintKey,
      reasonCodes: [
        eligibleKeys.has(item.blueprintKey)
          ? "not_selected_by_topic_recipe"
          : "not_applicable_to_generation_context"
      ]
    }));

  const warnings = unique([
    ...personaCompilation.warnings,
    ...draftResult.warnings,
    ...aliasContext.optionalFocusUnmapped.map(
      (value) => `optional_focus_theme_unmapped:${value}`
    ),
    ...aliasContext.optionalDiagnosisUnmapped.map(
      (value) => `optional_diagnosis_goal_unmapped:${value}`
    ),
    ...(generation.business.primaryDomain === "food_beauty_lifestyle" &&
    aliasContext.subtype == null
      ? ["food_beauty_subtype_unresolved"]
      : []),
    ...(alternatives.length === 0 ? ["no_safe_topic_alternative"] : []),
    "natural_citation_overlay_attached"
  ]);

  return {
    contractVersion: RECORA_TOPIC_COMPILATION_CONTRACT_VERSION,
    compilerVersion: RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION,
    catalogVersion: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
    status: "ready",
    selected: materialized.selected,
    personaTopicEdges: materialized.edges,
    alternatives,
    excluded,
    observationOverlays,
    reviewQuestions: [],
    blockers: [],
    warnings,
    topicRecipeKey: recipe.recipeKey,
    topicSelectionIdentity: identity
  };
}

function validatePersonaSet(
  selected: readonly RecoraSelectedPersonaV3[]
): string[] {
  const blockers: string[] = [];
  if (selected.length !== RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT) {
    blockers.push("persona_selected_count_mismatch");
  }
  if (new Set(selected.map((item) => item.personaId)).size !== selected.length) {
    blockers.push("persona_identity_duplicate");
  }
  if (
    new Set(selected.map((item) => item.selectionSemanticKey)).size !==
    selected.length
  ) {
    blockers.push("persona_semantic_key_duplicate");
  }
  if (new Set(selected.map((item) => item.sortOrder)).size !== selected.length) {
    blockers.push("compiler_internal_invariant");
  }
  if (selected.some((item) => item.topicInfluenceDimensions.length < 2)) {
    blockers.push("compiler_internal_invariant");
  }
  return unique(blockers);
}

function validateCatalogAuthority(
  catalog: readonly RecoraTopicBlueprintV3[],
  isFrozenCatalog: boolean
): string[] {
  if (isFrozenCatalog) {
    const result = validateRecoraMeasurementTopicCatalogV3();
    return result.valid ? [] : [...result.blockers];
  }
  const blockers: string[] = [];
  if (catalog.length === 0) blockers.push("catalog_empty");
  if (new Set(catalog.map((item) => item.blueprintKey)).size !== catalog.length) {
    blockers.push("catalog_key_duplicate");
  }
  if (
    catalog.some(
      (item) =>
        item.catalogVersion !== RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION
    )
  ) {
    blockers.push("catalog_version_mismatch");
  }
  return blockers;
}

function validateCustomRecipeAuthority(
  recipes: readonly RecoraTopicSelectionRecipeV3[]
): string[] {
  const blockers: string[] = [];
  if (recipes.length === 0) blockers.push("topic_recipe_empty");
  if (new Set(recipes.map((item) => item.recipeKey)).size !== recipes.length) {
    blockers.push("topic_recipe_key_duplicate");
  }
  if (
    recipes.some(
      (item) =>
        item.slots.map((slot) => slot.coverage).join(",") !==
        "T1,T2,T3,T4,T5,T6"
    )
  ) {
    blockers.push("topic_recipe_coverage_invalid");
  }
  return blockers;
}

function resolveAliasContext(
  input: RecoraPromptGenerationInputV1
): ResolvedAliasContext {
  const mappedFocusKeys: string[] = [];
  const mappedDiagnosisKeys: string[] = [];
  const requestedBlueprintKeys: string[] = [];
  const requiredBlueprintKeys: string[] = [];
  const requiredUnmapped: string[] = [];
  const optionalFocusUnmapped: string[] = [];
  const optionalDiagnosisUnmapped: string[] = [];

  const mapThemes = (
    values: readonly string[],
    mappedKeys: string[],
    optionalUnmapped: string[]
  ) => {
    for (const raw of values) {
      const parsed = parseTheme(raw);
      const matches = RECORA_TOPIC_ALIAS_REGISTRY_JA_V1.filter((item) =>
        item.aliases.some(
          (alias) => normalize(alias) === parsed.normalized
        )
      );
      if (matches.length === 0) {
        (parsed.required ? requiredUnmapped : optionalUnmapped).push(
          parsed.raw
        );
        continue;
      }
      for (const match of matches) {
        mappedKeys.push(match.mappingKey);
        requestedBlueprintKeys.push(...match.targetBlueprintKeys);
        if (parsed.required) {
          requiredBlueprintKeys.push(...match.targetBlueprintKeys);
        }
      }
    }
  };

  mapThemes(
    input.generationContext.focusThemes,
    mappedFocusKeys,
    optionalFocusUnmapped
  );
  mapThemes(
    input.generationContext.diagnosisGoals,
    mappedDiagnosisKeys,
    optionalDiagnosisUnmapped
  );

  const subtypeText = normalize(
    [
      input.business.summary,
      ...input.generationContext.focusThemes,
      ...input.generationContext.diagnosisGoals
    ].join(" ")
  );
  const food = aliasesFor("subtype.food_dining").some((value) =>
    subtypeText.includes(value)
  );
  const beauty = aliasesFor("subtype.beauty_wellness").some((value) =>
    subtypeText.includes(value)
  );
  const subtypeConflict = food && beauty;
  const subtype: RecoraResolvedTopicSubtypeKeyV3 | null = subtypeConflict
    ? null
    : food
      ? "food_dining"
      : beauty
        ? "beauty_wellness"
        : input.business.primaryDomain === "food_beauty_lifestyle"
          ? "other_lifestyle"
          : null;

  return {
    mappedFocusKeys: sortedUnique(mappedFocusKeys),
    mappedDiagnosisKeys: sortedUnique(mappedDiagnosisKeys),
    requestedBlueprintKeys: unique(requestedBlueprintKeys),
    requiredBlueprintKeys: unique(requiredBlueprintKeys),
    requiredUnmapped: unique(requiredUnmapped),
    optionalFocusUnmapped: unique(optionalFocusUnmapped),
    optionalDiagnosisUnmapped: unique(optionalDiagnosisUnmapped),
    subtype,
    subtypeConflict
  };
}

function parseTheme(rawValue: string) {
  const raw = rawValue.trim();
  const required = /^(required|必須)\s*[:：]/i.test(raw);
  const value = raw.replace(/^(required|必須)\s*[:：]\s*/i, "");
  return { raw, required, normalized: normalize(value) };
}

function aliasesFor(mappingKey: string): string[] {
  return RECORA_TOPIC_ALIAS_REGISTRY_JA_V1.filter(
    (item) => item.mappingKey === mappingKey
  ).flatMap((item) => item.aliases.map(normalize));
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function hasRequiredThemeConflict(
  aliases: ResolvedAliasContext,
  byKey: ReadonlyMap<string, RecoraTopicBlueprintV3>
): boolean {
  const groupsByCoverage = new Map<string, Set<string>>();
  for (const key of aliases.requiredBlueprintKeys) {
    const item = byKey.get(key);
    if (!item) continue;
    const groups = groupsByCoverage.get(item.primaryCoverage) ?? new Set();
    groups.add(item.semanticGroupKey);
    groupsByCoverage.set(item.primaryCoverage, groups);
  }
  return Array.from(groupsByCoverage.values()).some(
    (groups) => groups.size > 1
  );
}

function hasRequiredGeographicFocus(
  input: RecoraPromptGenerationInputV1
): boolean {
  return input.generationContext.focusThemes.some((value) => {
    const parsed = parseTheme(value);
    return (
      parsed.required &&
      ["地域", "アクセス", "近く", "店舗"].some((alias) =>
        parsed.normalized.includes(normalize(alias))
      )
    );
  });
}

function hasRequiredLifecycleFocus(
  input: RecoraPromptGenerationInputV1
): boolean {
  return input.generationContext.focusThemes.some((value) => {
    const parsed = parseTheme(value);
    return (
      parsed.required &&
      ["更新", "解約", "継続", "乗り換え", "休止"].some((alias) =>
        parsed.normalized.includes(normalize(alias))
      )
    );
  });
}

function isBlueprintApplicable(
  blueprint: RecoraTopicBlueprintV3,
  input: RecoraPromptGenerationInputV1,
  personas: readonly RecoraSelectedPersonaV3[],
  subtype: RecoraResolvedTopicSubtypeKeyV3 | null
): boolean {
  const context: Readonly<Record<string, readonly (string | null)[]>> = {
    audienceScopesAny: [input.audience.scope],
    audiencePrioritiesAny: [input.audience.priority],
    primarySubjectTypesAny: [input.subject.primary.type],
    secondarySubjectTypesAny: input.subject.secondary.map((item) => item.type),
    primaryBusinessDomainsAny: [input.business.primaryDomain],
    secondaryBusinessDomainsAny: input.business.secondaryDomains,
    primaryOfferingModelsAny: [input.business.primaryOfferingModel],
    secondaryOfferingModelsAny: input.business.secondaryOfferingModels,
    commerceChannelsAny: input.business.commerceChannels,
    commerceChannelsAll: input.business.commerceChannels,
    commerceRolesAny: input.business.commerceRoles,
    commerceRolesAll: input.business.commerceRoles,
    commerceRolesNone: input.business.commerceRoles,
    primaryActionsAny: [input.actions.primary],
    secondaryActionsAny: input.actions.secondary,
    structureSignalsAll: input.generationContext.structureSignals,
    structureSignalsAny: input.generationContext.structureSignals,
    structureSignalsNone: input.generationContext.structureSignals,
    geographicBindingsAny: [input.delivery.geographicBinding],
    serviceCoveragesAny: [input.delivery.serviceCoverage],
    locationStructuresAny: [input.delivery.locationStructure],
    trustClassesAny: [input.trust.derived.derivedClass],
    decisionImpactFlagsAny: input.trust.decisionImpactFlags,
    regulatoryFlagsAny: input.trust.regulatoryFlags,
    sensitiveContextsAny: input.trust.sensitiveContexts,
    personaInfluencesAny: unique(
      personas.flatMap((item) => item.topicInfluenceDimensions)
    ),
    personaRoleFamiliesAny: unique(
      personas.flatMap((item) => item.roleFamilies)
    ),
    marketSidesAny: unique(personas.flatMap((item) => item.marketSides)),
    lifecycleSignalsAny: input.generationContext.lifecycleSignals,
    lifecycleSignalsAll: input.generationContext.lifecycleSignals,
    lifecycleSignalsNone: input.generationContext.lifecycleSignals,
    resolvedTopicSubtypeKeysAny: subtype ? [subtype] : []
  };

  for (const [field, rawRequirement] of Object.entries(
    blueprint.applicability
  )) {
    const requirement = rawRequirement as
      | readonly (string | null)[]
      | null;
    if (requirement === null) continue;
    const actual = new Set(context[field] ?? []);
    if (field.endsWith("All")) {
      if (!requirement.every((value) => actual.has(value))) return false;
    } else if (field.endsWith("None")) {
      if (requirement.some((value) => actual.has(value))) return false;
    } else if (!requirement.some((value) => actual.has(value))) {
      return false;
    }
  }

  return personas.some((persona) =>
    personaMatchesBlueprintAuthority(persona, blueprint)
  );
}

function personaMatchesBlueprintAuthority(
  persona: RecoraSelectedPersonaV3,
  blueprint: RecoraTopicBlueprintV3
): boolean {
  const influenceMatches = intersection(
    persona.topicInfluenceDimensions,
    blueprint.personaInfluencesAny ?? []
  );
  const roleMatches = intersection(
    persona.roleFamilies,
    blueprint.personaRoleFamiliesAny ?? []
  );
  const sideMatches = intersection(
    persona.marketSides,
    blueprint.marketSidesAny ?? []
  );
  return (
    (blueprint.personaInfluencesAny == null || influenceMatches.length > 0) &&
    (blueprint.personaRoleFamiliesAny == null || roleMatches.length > 0) &&
    (blueprint.marketSidesAny == null || sideMatches.length > 0)
  );
}

function resolveTopicDrafts(input: {
  recipe: RecoraTopicSelectionRecipeV3;
  generation: RecoraPromptGenerationInputV1;
  eligible: readonly RecoraTopicBlueprintV3[];
  eligibleKeys: ReadonlySet<string>;
  byKey: ReadonlyMap<string, RecoraTopicBlueprintV3>;
  aliasContext: ResolvedAliasContext;
}):
  | {
      status: "ready";
      drafts: readonly TopicDraft[];
      blockers: readonly string[];
      warnings: readonly string[];
      reviewQuestions: readonly RecoraTopicReviewQuestionV3[];
    }
  | {
      status: "needs_review" | "catalog_gap";
      blockers: readonly string[];
      warnings: readonly string[];
      reviewQuestions: readonly RecoraTopicReviewQuestionV3[];
    } {
  const drafts: TopicDraft[] = [];
  const usedSemanticGroups = new Set<string>();
  const warnings: string[] = [];

  for (let index = 0; index < input.recipe.slots.length; index += 1) {
    const recipeSlot = input.recipe.slots[index];
    const primaryResolution = resolvePrimaryBlueprint({
      slot: recipeSlot,
      generation: input.generation,
      eligible: input.eligible,
      eligibleKeys: input.eligibleKeys,
      byKey: input.byKey,
      subtype: input.aliasContext.subtype,
      usedSemanticGroups
    });
    if (!primaryResolution.blueprint) {
      return {
        status: "catalog_gap",
        blockers: [
          "required_topic_blueprint_missing",
          `required_topic_coverage_missing:${recipeSlot.coverage}`
        ],
        warnings,
        reviewQuestions: []
      };
    }
    const primary = primaryResolution.blueprint;
    usedSemanticGroups.add(primary.semanticGroupKey);
    if (primaryResolution.usedFallback) {
      warnings.push(`specificity_fallback_used:${recipeSlot.coverage}`);
    }

    const requestedForSlot = input.aliasContext.requestedBlueprintKeys.filter(
      (key) => input.byKey.get(key)?.primaryCoverage === recipeSlot.coverage
    );
    const supportingKeys = unique([
      ...recipeSlot.supportingBlueprintKeys,
      ...requestedForSlot,
      ...(recipeSlot.coverage === "T5" &&
      input.aliasContext.mappedDiagnosisKeys.includes(
        "diagnosis.forced_citation"
      )
        ? ["diagnostic.forced_citation_validation"]
        : [])
    ]);
    const supporting: RecoraTopicBlueprintV3[] = [];
    for (const key of supportingKeys) {
      if (key === primary.blueprintKey) continue;
      const item = input.byKey.get(key);
      const requiredByRecipe = recipeSlot.supportingBlueprintKeys.includes(key);
      const requiredByTheme = input.aliasContext.requiredBlueprintKeys.includes(key);
      if (!item || item.kind === "observation_overlay") {
        if (requiredByRecipe || requiredByTheme) {
          return {
            status: "catalog_gap",
            blockers: ["approved_topic_bundle_incomplete", `missing:${key}`],
            warnings,
            reviewQuestions: []
          };
        }
        continue;
      }
      if (
        !input.eligibleKeys.has(key) ||
        !recipeSlot.allowedLaneKeys.includes(item.measurementLane)
      ) {
        if (requiredByRecipe || requiredByTheme) {
          return {
            status: "catalog_gap",
            blockers: [
              "approved_topic_bundle_incomplete",
              `not_applicable:${key}`
            ],
            warnings,
            reviewQuestions: []
          };
        }
        continue;
      }
      supporting.push(item);
    }

    const label = resolvePromptSubjectLabel(
      primary,
      input.generation,
      input.recipe,
      input.aliasContext.subtype
    );
    if (!label) {
      return {
        status: "needs_review",
        blockers: [],
        warnings,
        reviewQuestions: [
          {
            code: "prompt_subject_label_too_broad",
            message: "安全なnon-branded対象ラベルを確定できません。",
            allowedAnswers: ["confirm_domain", "confirm_offering_model"]
          }
        ]
      };
    }
    if (label.generic) warnings.push("generic_prompt_subject_label_used");

    drafts.push({
      primary,
      supporting: uniqueByKey(supporting),
      coverage: recipeSlot.coverage,
      label,
      sortOrder: (index + 1) as TopicDraft["sortOrder"]
    });
  }

  if (drafts.length !== RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT) {
    return {
      status: "catalog_gap",
      blockers: ["selected_topic_count_mismatch"],
      warnings,
      reviewQuestions: []
    };
  }
  if (
    new Set(drafts.map((item) => item.primary.semanticGroupKey)).size !==
    drafts.length
  ) {
    return {
      status: "catalog_gap",
      blockers: ["selected_topic_semantic_duplicate"],
      warnings,
      reviewQuestions: []
    };
  }
  return {
    status: "ready",
    drafts,
    blockers: [],
    warnings: unique(warnings),
    reviewQuestions: []
  };
}

function resolvePrimaryBlueprint(input: {
  slot: RecoraTopicRecipeSlotV3;
  generation: RecoraPromptGenerationInputV1;
  eligible: readonly RecoraTopicBlueprintV3[];
  eligibleKeys: ReadonlySet<string>;
  byKey: ReadonlyMap<string, RecoraTopicBlueprintV3>;
  subtype: RecoraResolvedTopicSubtypeKeyV3 | null;
  usedSemanticGroups: ReadonlySet<string>;
}): { blueprint: RecoraTopicBlueprintV3 | null; usedFallback: boolean } {
  const authority = input.slot.primaryAuthority;
  const primaryKey =
    authority.kind === "fixed_blueprint"
      ? authority.blueprintKey
      : authority.kind === "primary_action_binding"
        ? RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1[
            input.generation.actions.primary
          ]
        : resolveDomainOfferingBlueprintKey(
            input.generation,
            input.subtype
          );
  const keyCandidates = unique([
    ...(primaryKey ? [primaryKey] : []),
    ...authority.fallbackBlueprintKeys
  ]);
  for (let index = 0; index < keyCandidates.length; index += 1) {
    const item = input.byKey.get(keyCandidates[index]);
    if (
      item &&
      input.eligibleKeys.has(item.blueprintKey) &&
      item.primaryCoverage === input.slot.coverage &&
      input.slot.allowedLaneKeys.includes(item.measurementLane) &&
      !input.usedSemanticGroups.has(item.semanticGroupKey)
    ) {
      return { blueprint: item, usedFallback: index > 0 || primaryKey == null };
    }
  }

  const fallback = input.eligible
    .filter(
      (item) =>
        authority.fallbackPacks.includes(item.pack) &&
        item.primaryCoverage === input.slot.coverage &&
        input.slot.allowedLaneKeys.includes(item.measurementLane) &&
        !input.usedSemanticGroups.has(item.semanticGroupKey) &&
        item.kind !== "observation_overlay"
    )
    .sort((left, right) => {
      const pack =
        authority.fallbackPacks.indexOf(left.pack) -
        authority.fallbackPacks.indexOf(right.pack);
      if (pack !== 0) return pack;
      const specificity =
        SPECIFICITY_RANK[left.specificityTier] -
        SPECIFICITY_RANK[right.specificityTier];
      if (specificity !== 0) return specificity;
      return left.fixedOrder - right.fixedOrder;
    })[0];
  return { blueprint: fallback ?? null, usedFallback: true };
}

function resolveDomainOfferingBlueprintKey(
  generation: RecoraPromptGenerationInputV1,
  subtype: RecoraResolvedTopicSubtypeKeyV3 | null
): string | null {
  const matches = RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1.filter(
    (item) =>
      (item.primaryBusinessDomain == null ||
        item.primaryBusinessDomain === generation.business.primaryDomain) &&
      (item.primaryOfferingModel == null ||
        item.primaryOfferingModel ===
          generation.business.primaryOfferingModel) &&
      (item.resolvedTopicSubtypeKey == null ||
        item.resolvedTopicSubtypeKey === subtype)
  ).sort((left, right) => bindingSpecificity(right) - bindingSpecificity(left));
  return matches[0]?.blueprintKey ?? null;
}

function bindingSpecificity(input: {
  primaryBusinessDomain: string | null;
  primaryOfferingModel: string | null;
  resolvedTopicSubtypeKey: string | null;
}): number {
  return [
    input.primaryBusinessDomain,
    input.primaryOfferingModel,
    input.resolvedTopicSubtypeKey
  ].filter(Boolean).length;
}

function resolvePromptSubjectLabel(
  blueprint: RecoraTopicBlueprintV3,
  generation: RecoraPromptGenerationInputV1,
  recipe: RecoraTopicSelectionRecipeV3,
  subtype: RecoraResolvedTopicSubtypeKeyV3 | null
): ResolvedPromptSubjectLabel | null {
  const rule = blueprint.promptSubjectLabelRule;
  if (rule.kind === "primary_subject_name") {
    if (blueprint.measurementLane !== "self_branded_perception") return null;
    const label = generation.subject.primary.name.trim();
    return label
      ? { key: "subject.primary", label, generic: false }
      : null;
  }
  if (rule.kind === "structure_signal") {
    const signal =
      recipe.structureSignal &&
      generation.generationContext.structureSignals.includes(
        recipe.structureSignal
      )
        ? recipe.structureSignal
        : generation.generationContext.structureSignals.find(
            (item) => RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1[item]
          );
    if (signal) {
      return {
        key: `structure.${signal}`,
        label: RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1[signal],
        generic: false
      };
    }
  }
  if (rule.kind === "domain_offering" || rule.kind === "structure_signal") {
    const matches = RECORA_PROMPT_SUBJECT_DOMAIN_OFFERING_BINDINGS_V1.filter(
      (item) =>
        (item.primaryBusinessDomain == null ||
          item.primaryBusinessDomain === generation.business.primaryDomain) &&
        (item.primaryOfferingModel == null ||
          item.primaryOfferingModel ===
            generation.business.primaryOfferingModel) &&
        (item.resolvedTopicSubtypeKey == null ||
          item.resolvedTopicSubtypeKey === subtype)
    ).sort(
      (left, right) => bindingSpecificity(right) - bindingSpecificity(left)
    );
    const match = matches[0];
    if (match) {
      return { key: match.labelKey, label: match.label, generic: false };
    }
  }
  if (rule.kind === "fixed_catalog_label") {
    return {
      key: rule.labelKey,
      label: blueprint.customerFacingNameTemplate,
      generic: false
    };
  }
  if (
    generation.business.primaryDomain === "other" &&
    generation.business.primaryOfferingModel === "other"
  ) {
    return null;
  }
  const fallbackBySubject = {
    company: "企業・事業者",
    brand: "商品・サービスのブランド",
    service: "サービス・事業者",
    product: "商品・ブランド",
    location_facility: "地域の店舗・施設",
    professional_person: "専門家・相談先"
  } as const;
  return {
    key: `fallback.${generation.subject.primary.type}`,
    label: fallbackBySubject[generation.subject.primary.type],
    generic: true
  };
}

function buildEdgeDrafts(
  drafts: readonly TopicDraft[],
  personas: readonly RecoraSelectedPersonaV3[],
  recipe: RecoraTopicSelectionRecipeV3
): {
  valid: boolean;
  edges: readonly EdgeDraft[];
  blockers: readonly string[];
  warnings: readonly string[];
} {
  const sortedPersonas = [...personas].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
  const edges: EdgeDraft[] = [];
  const blockers: string[] = [];

  drafts.forEach((draft, topicIndex) => {
    const slot = recipe.slots[topicIndex];
    const blueprints = [draft.primary, ...draft.supporting];
    const matched = sortedPersonas
      .map((persona) => matchPersona(persona, blueprints))
      .filter((item) => item.matchedBlueprintKeys.length > 0);
    const primary = slot.primaryPersonaSortOrders
      .map((sortOrder) =>
        matched.find((item) => item.persona.sortOrder === sortOrder)
      )
      .find(
        (item): item is MatchedPersonaAuthority => item !== undefined
      );
    if (!primary) {
      blockers.push(`topic_primary_edge_missing:${draft.coverage}`);
      return;
    }
    edges.push({ ...primary, topicIndex, edgeRole: "primary" });
    for (const item of matched) {
      if (item.persona.personaId === primary.persona.personaId) continue;
      if (
        !slot.supportingPersonaSortOrders.includes(
          item.persona.sortOrder as RecoraTopicPersonaSortOrderV3
        )
      ) {
        continue;
      }
      edges.push({ ...item, topicIndex, edgeRole: "supporting" });
    }
  });

  if (drafts.length !== RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT) {
    blockers.push("selected_topic_count_mismatch");
  }
  if (
    sortedPersonas.some(
      (persona) =>
        new Set(
          edges
            .filter((item) => item.persona.personaId === persona.personaId)
            .map((item) => item.topicIndex)
        ).size < 2
    )
  ) {
    blockers.push("persona_topic_coverage_missing");
  }
  const primaryCounts = new Map<string, number>();
  for (const edge of edges.filter((item) => item.edgeRole === "primary")) {
    primaryCounts.set(
      edge.persona.personaId,
      (primaryCounts.get(edge.persona.personaId) ?? 0) + 1
    );
  }
  if (
    Array.from(primaryCounts.values()).some(
      (count) => count === RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT
    )
  ) {
    blockers.push("persona_topic_coverage_missing");
  }
  const representedSides = new Set(
    edges.flatMap((item) => item.persona.marketSides)
  );
  if (
    recipe.requiredMarketSides.some((side) => !representedSides.has(side))
  ) {
    blockers.push("required_market_side_coverage_missing");
  }
  const edgeIdentity = edges.map(
    (item) => `${item.topicIndex}:${item.persona.personaId}`
  );
  if (new Set(edgeIdentity).size !== edgeIdentity.length) {
    blockers.push("compiler_internal_invariant");
  }
  return {
    valid: blockers.length === 0,
    edges,
    blockers: unique(blockers),
    warnings: []
  };
}

function matchPersona(
  persona: RecoraSelectedPersonaV3,
  blueprints: readonly RecoraTopicBlueprintV3[]
): MatchedPersonaAuthority {
  const matchedBlueprintKeys: string[] = [];
  const influences: RecoraPersonaTopicInfluenceDimension[] = [];
  const roles: RecoraPersonaRoleFamily[] = [];
  const sides: RecoraGenerationCustomerSide[] = [];
  for (const blueprint of blueprints) {
    if (!personaMatchesBlueprintAuthority(persona, blueprint)) continue;
    matchedBlueprintKeys.push(blueprint.blueprintKey);
    influences.push(
      ...intersection(
        persona.topicInfluenceDimensions,
        blueprint.personaInfluencesAny ?? []
      )
    );
    roles.push(
      ...intersection(
        persona.roleFamilies,
        blueprint.personaRoleFamiliesAny ?? []
      )
    );
    sides.push(
      ...intersection(
        persona.marketSides,
        blueprint.marketSidesAny ?? []
      )
    );
  }
  return {
    persona,
    matchedBlueprintKeys: unique(matchedBlueprintKeys),
    matchedInfluenceDimensions: unique(influences),
    matchedRoleFamilies: unique(roles),
    matchedMarketSides: unique(sides)
  };
}

function buildTopicSelectionIdentity(
  generation: RecoraPromptGenerationInputV1,
  personas: readonly RecoraSelectedPersonaV3[],
  recipe: RecoraTopicSelectionRecipeV3,
  aliases: ResolvedAliasContext,
  drafts: readonly TopicDraft[]
): RecoraTopicSelectionIdentityV3 {
  const semantic = {
    selectionSemanticsVersion: RECORA_TOPIC_SELECTION_SEMANTICS_VERSION,
    catalogVersion: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
    compilerVersion: RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION,
    recipeMappingVersion: RECORA_TOPIC_RECIPE_MAPPING_VERSION,
    overlayPolicyVersion: RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION,
    market: generation.market,
    subject: {
      type: generation.subject.primary.type,
      semanticName: normalize(generation.subject.primary.name),
      secondaryTypes: sortedUnique(
        generation.subject.secondary.map((item) => item.type)
      )
    },
    labels: drafts.map((item) => item.label.key),
    resolvedSubtypeKey: aliases.subtype,
    audience: generation.audience,
    business: {
      primaryDomain: generation.business.primaryDomain,
      secondaryDomains: sortedUnique(generation.business.secondaryDomains),
      primaryOfferingModel: generation.business.primaryOfferingModel,
      secondaryOfferingModels: sortedUnique(
        generation.business.secondaryOfferingModels
      ),
      commerceChannels: sortedUnique(
        generation.business.commerceChannels
      ),
      commerceRoles: sortedUnique(generation.business.commerceRoles)
    },
    actions: {
      primary: generation.actions.primary,
      secondary: sortedUnique(generation.actions.secondary)
    },
    delivery: {
      mode: generation.delivery.mode,
      serviceCoverage: generation.delivery.serviceCoverage,
      locationStructure: generation.delivery.locationStructure,
      geographicBinding: generation.delivery.geographicBinding,
      serviceAreas: generation.delivery.serviceAreas
        .map(
          (item) =>
            item.areaKey ?? `${item.level}:${normalize(item.label)}`
        )
        .sort(),
      locations: generation.delivery.locations
        .map((item) => `${item.type}:${normalize(item.name)}`)
        .sort()
    },
    trust: {
      derivedClass: generation.trust.derived.derivedClass,
      decisionImpactFlags: sortedUnique(
        generation.trust.decisionImpactFlags
      ),
      regulatoryFlags: sortedUnique(generation.trust.regulatoryFlags),
      sensitiveContexts: sortedUnique(generation.trust.sensitiveContexts)
    },
    structureSignals: sortedUnique(
      generation.generationContext.structureSignals
    ),
    customerSides: sortedUnique(
      generation.generationContext.customerSides
    ),
    actorRelations: generation.generationContext.actorRelations
      .map((item) => ({
        roles: [item.leftRoleKey, item.rightRoleKey].sort(),
        relation: item.relation
      }))
      .sort((left, right) => stableJson(left).localeCompare(stableJson(right))),
    lifecycleSignals: sortedUnique(
      generation.generationContext.lifecycleSignals
    ),
    mappedFocusKeys: aliases.mappedFocusKeys,
    mappedDiagnosisKeys: aliases.mappedDiagnosisKeys,
    recipeKey: recipe.recipeKey,
    personas: [...personas]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => ({
        personaId: item.personaId,
        selectionSemanticKey: item.selectionSemanticKey,
        primaryBlueprintKey: item.primaryBlueprintKey,
        supportingBlueprintKeys: sortedUnique(item.supportingBlueprintKeys),
        modifierKeys: sortedUnique(item.modifierKeys),
        roleFamilies: sortedUnique(item.roleFamilies),
        marketSides: sortedUnique(item.marketSides),
        topicInfluenceDimensions: sortedUnique(
          item.topicInfluenceDimensions
        ),
        sortOrder: item.sortOrder
      }))
  };
  return {
    semanticsVersion: RECORA_TOPIC_SELECTION_SEMANTICS_VERSION,
    hashAlgorithm: "sha256",
    fingerprint: createHash("sha256")
      .update(stableJson(semantic))
      .digest("hex")
  };
}

function materializeTopics(
  drafts: readonly TopicDraft[],
  edgeDrafts: readonly EdgeDraft[],
  identity: RecoraTopicSelectionIdentityV3,
  recipeKey: string
): {
  selected: readonly RecoraSelectedTopicV3[];
  edges: readonly RecoraPersonaTopicEdgeV3[];
} {
  const selected: RecoraSelectedTopicV3[] = [];
  const topicIds: string[] = [];
  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    const draftEdges = edgeDrafts
      .filter((edge) => edge.topicIndex === index)
      .sort((left, right) => {
        if (left.edgeRole !== right.edgeRole) {
          return left.edgeRole === "primary" ? -1 : 1;
        }
        return left.persona.sortOrder - right.persona.sortOrder;
      });
    const laneKeys = unique([
      draft.primary.measurementLane,
      ...draft.supporting.map((item) => item.measurementLane)
    ]);
    const projection = {
      primaryCoverage: draft.coverage,
      primaryBlueprintKey: draft.primary.blueprintKey,
      supportingBlueprintKeys: draft.supporting.map(
        (item) => item.blueprintKey
      ),
      customerFacingNameTemplateKey:
        draft.primary.customerFacingNameTemplateKey,
      promptSubjectLabelKey: draft.label.key,
      measurementLaneKeys: laneKeys,
      edges: draftEdges.map((edge) => ({
        personaSelectionSemanticKey: edge.persona.selectionSemanticKey,
        edgeRole: edge.edgeRole
      }))
    };
    const selectionSemanticKey = [
      draft.coverage,
      draft.primary.blueprintKey,
      draft.supporting.map((item) => item.blueprintKey).join(","),
      draft.primary.customerFacingNameTemplateKey,
      draft.label.key,
      laneKeys.join(","),
      projection.edges
        .map(
          (edge) => `${edge.personaSelectionSemanticKey}:${edge.edgeRole}`
        )
        .join(",")
    ].join("|");
    const topicId = `topic_v3_${createHash("sha256")
      .update(identity.fingerprint)
      .update(stableJson(projection))
      .digest("hex")
      .slice(0, 32)}`;
    topicIds.push(topicId);
    const blueprints = [draft.primary, ...draft.supporting];
    selected.push({
      contractVersion: RECORA_MEASUREMENT_TOPIC_CONTRACT_VERSION,
      compilerVersion: RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION,
      catalogVersion: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
      topicId,
      selectionSemanticKey,
      primaryBlueprintKey: draft.primary.blueprintKey,
      supportingBlueprintKeys: draft.supporting.map(
        (item) => item.blueprintKey
      ),
      primaryCoverage: draft.coverage,
      coverageDimensions: unique(
        blueprints.flatMap((item) => item.coverageDimensions)
      ),
      customerFacingNameTemplateKey:
        draft.primary.customerFacingNameTemplateKey,
      customerFacingName: customerFacingName(draft),
      internalSummary: blueprints
        .map((item) => item.internalSummary)
        .join(" / "),
      promptSubjectLabelKey: draft.label.key,
      promptSubjectLabel: draft.label.label,
      personaIds: draftEdges.map((edge) => edge.persona.personaId),
      measurementLanes: blueprints.map((item) => {
        const lane =
          RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3[item.measurementLane];
        return {
          blueprintKey: item.blueprintKey,
          laneKey: item.measurementLane,
          allowedMetricKeys: lane.allowedMetricKeys,
          forbiddenMetricKeys: lane.forbiddenMetricKeys
        };
      }),
      measurementGoal: blueprints
        .map((item) => item.measurementGoal)
        .join(" / "),
      expectedEntityTypes: unique(
        blueprints.flatMap((item) => item.expectedEntityTypes)
      ),
      comparisonAxes: unique(
        blueprints.flatMap((item) => item.comparisonAxes)
      ),
      expectedAnswerShapes: unique(
        blueprints.flatMap((item) => item.expectedAnswerShapes)
      ),
      selectionEvidence: [
        `recipe:${recipeKey}`,
        `coverage:${draft.coverage}`,
        `primary:${draft.primary.blueprintKey}`,
        ...draft.supporting.map(
          (item) => `supporting:${item.blueprintKey}`
        )
      ],
      sortOrder: draft.sortOrder
    });
  }

  const edges = edgeDrafts.map((edge) => ({
    personaId: edge.persona.personaId,
    topicId: topicIds[edge.topicIndex],
    edgeRole: edge.edgeRole,
    matchedBlueprintKeys: edge.matchedBlueprintKeys,
    matchedInfluenceDimensions: edge.matchedInfluenceDimensions,
    matchedRoleFamilies: edge.matchedRoleFamilies,
    matchedMarketSides: edge.matchedMarketSides,
    reasons: [
      `persona:${edge.persona.selectionSemanticKey}`,
      `topic:${drafts[edge.topicIndex].coverage}`
    ]
  }));
  return { selected, edges };
}

function customerFacingName(draft: TopicDraft): string {
  const names = unique([
    draft.primary.customerFacingNameTemplate,
    ...draft.supporting.map((item) => item.customerFacingNameTemplate)
  ]);
  return names.length <= 2 ? names.join("・") : names[0];
}

function buildAlternatives(input: {
  drafts: readonly TopicDraft[];
  eligibleKeys: ReadonlySet<string>;
  byKey: ReadonlyMap<string, RecoraTopicBlueprintV3>;
  recipe: RecoraTopicSelectionRecipeV3;
  generation: RecoraPromptGenerationInputV1;
  personas: readonly RecoraSelectedPersonaV3[];
  aliasContext: ResolvedAliasContext;
}): readonly RecoraTopicAlternativeV3[] {
  const alternatives: RecoraTopicAlternativeV3[] = [];
  const selectedKeys = new Set(
    input.drafts.map((item) => item.primary.blueprintKey)
  );

  input.recipe.slots.forEach((slot, index) => {
    for (const key of slot.alternativeBlueprintKeys) {
      const candidate = input.byKey.get(key);
      if (
        !candidate ||
        !input.eligibleKeys.has(key) ||
        candidate.kind === "observation_overlay" ||
        candidate.primaryCoverage !== slot.coverage ||
        !slot.allowedLaneKeys.includes(candidate.measurementLane) ||
        selectedKeys.has(key)
      ) {
        continue;
      }
      const label = resolvePromptSubjectLabel(
        candidate,
        input.generation,
        input.recipe,
        input.aliasContext.subtype
      );
      if (!label) continue;
      const current = input.drafts[index];
      const virtualDrafts = input.drafts.map((draft, draftIndex) =>
        draftIndex === index
          ? {
              ...draft,
              primary: candidate,
              supporting: draft.supporting.filter(
                (item) => item.blueprintKey !== candidate.blueprintKey
              ),
              label
            }
          : draft
      );
      if (
        new Set(
          virtualDrafts.map((item) => item.primary.semanticGroupKey)
        ).size !== virtualDrafts.length
      ) {
        continue;
      }
      const virtualEdges = buildEdgeDrafts(
        virtualDrafts,
        input.personas,
        input.recipe
      );
      if (!virtualEdges.valid) continue;
      const virtualIdentity = buildTopicSelectionIdentity(
        input.generation,
        input.personas,
        input.recipe,
        input.aliasContext,
        virtualDrafts
      );
      const virtualMaterialized = materializeTopics(
        virtualDrafts,
        virtualEdges.edges,
        virtualIdentity,
        input.recipe.recipeKey
      );
      if (
        new Set(
          virtualMaterialized.selected.map((item) => item.topicId)
        ).size !== RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT
      ) {
        continue;
      }
      alternatives.push({
        primaryBlueprintKey: candidate.blueprintKey,
        supportingBlueprintKeys: current.supporting.map(
          (item) => item.blueprintKey
        ),
        replaceableTopicIndexes: [index],
        rank: alternatives.length + 1,
        resultingPrimaryCoverage: candidate.primaryCoverage,
        resultingLaneKeys: unique([
          candidate.measurementLane,
          ...current.supporting.map((item) => item.measurementLane)
        ]),
        reasons: [
          `reviewed_alternative_for:${slot.coverage}`,
          `candidate:${candidate.blueprintKey}`
        ]
      });
      break;
    }
  });
  return alternatives;
}

function nonReady(
  status: Exclude<RecoraTopicCompilationStatusV3, "ready">,
  input: {
    blockers?: readonly string[];
    warnings?: readonly string[];
    reviewQuestions?: readonly RecoraTopicReviewQuestionV3[];
    excluded?: readonly RecoraTopicExcludedV3[];
    topicRecipeKey?: string | null;
  }
): RecoraNonReadyTopicCompilationV3 {
  return {
    contractVersion: RECORA_TOPIC_COMPILATION_CONTRACT_VERSION,
    compilerVersion: RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION,
    catalogVersion: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
    status,
    selected: [],
    personaTopicEdges: [],
    alternatives: [],
    excluded: input.excluded ?? [],
    observationOverlays: [],
    reviewQuestions: input.reviewQuestions ?? [],
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
    topicRecipeKey: input.topicRecipeKey ?? null,
    topicSelectionIdentity: null
  };
}

function intersection<T extends string>(
  left: readonly T[],
  right: readonly T[]
): T[] {
  const rightSet = new Set(right);
  return unique(left.filter((item) => rightSet.has(item)));
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function uniqueByKey(
  values: readonly RecoraTopicBlueprintV3[]
): RecoraTopicBlueprintV3[] {
  const byKey = new Map(values.map((item) => [item.blueprintKey, item]));
  return Array.from(byKey.values()).sort(
    (left, right) => left.fixedOrder - right.fixedOrder
  );
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return unique(values).sort();
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function getRecoraMeasurementTopicCompilerVersionsV3() {
  return {
    input: RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,
    selectedTopic: RECORA_MEASUREMENT_TOPIC_CONTRACT_VERSION,
    compilation: RECORA_TOPIC_COMPILATION_CONTRACT_VERSION,
    compiler: RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION,
    catalog: RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
    selectionSemantics: RECORA_TOPIC_SELECTION_SEMANTICS_VERSION,
    recipeMapping: RECORA_TOPIC_RECIPE_MAPPING_VERSION,
    overlayPolicy: RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION
  } as const;
}
