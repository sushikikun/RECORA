import type {
  RecoraPromptGenerationInputV1,
  RecoraPromptGenerationNormalizationResultV1
} from "./prompt-generation-input";
import {
  RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
  RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION,
  RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT,
  RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
  RECORA_PERSONA_COMPILATION_CONTRACT_VERSION,
  buildRecoraMeasurementPersonaId,
  buildRecoraPersonaSelectionFingerprint,
  buildRecoraPersonaSelectionSemanticKey,
  projectRecoraPersonaSelectionInputV3,
  type RecoraPersonaAlternativeV3,
  type RecoraPersonaBlueprintV3,
  type RecoraPersonaCompilationV3,
  type RecoraPersonaCoverageDimension,
  type RecoraPersonaExcludedV3,
  type RecoraPersonaReviewQuestionV3,
  type RecoraPersonaSelectionInputV3,
  type RecoraPersonaSelectionRecipeV3,
  type RecoraSelectedPersonaV3
} from "./measurement-persona-contract";
import {
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3,
  validateRecoraPersonaBlueprintCatalogV3
} from "./measurement-persona-catalog";
import { matchRecoraPersonaSelectionRecipesV3 } from "./measurement-persona-selection-rules";

export type RecoraMeasurementPersonaCompilerOptions = {
  catalog?: readonly RecoraPersonaBlueprintV3[];
};

export function compileRecoraMeasurementPersonasV3(
  upstream: RecoraPromptGenerationNormalizationResultV1,
  options: RecoraMeasurementPersonaCompilerOptions = {}
): RecoraPersonaCompilationV3 {
  if (upstream.status === "blocked") {
    return emptyResult("blocked", {
      blockers: ["generation_input_blocked", ...upstream.blockers],
      warnings: upstream.warnings
    });
  }
  if (upstream.status === "needs_review") {
    return emptyResult("needs_review", {
      reviewQuestions: upstream.reviewQuestions.map((item) => ({
        code: item.code,
        message: item.message,
        allowedAnswers: item.allowedAnswers
      })),
      warnings: upstream.warnings
    });
  }
  if (!upstream.value) {
    return emptyResult("blocked", {
      blockers: ["compiler_internal_invariant"]
    });
  }

  return compileReadyInput(upstream.value, options);
}

export function compileReadyRecoraMeasurementPersonasV3(
  input: RecoraPromptGenerationInputV1,
  options: RecoraMeasurementPersonaCompilerOptions = {}
): RecoraPersonaCompilationV3 {
  return compileReadyInput(input, options);
}

function compileReadyInput(
  input: RecoraPromptGenerationInputV1,
  options: RecoraMeasurementPersonaCompilerOptions
): RecoraPersonaCompilationV3 {
  if (input.contractVersion !== "recora_prompt_generation_input_v1") {
    return emptyResult("blocked", {
      blockers: ["unsupported_generation_input_version"]
    });
  }

  const selectionInput = projectRecoraPersonaSelectionInputV3(input);
  const selectionInputBlockers = validatePersonaSelectionInput(selectionInput);
  if (selectionInputBlockers.length > 0) {
    return emptyResult("blocked", { blockers: selectionInputBlockers });
  }

  const catalog = options.catalog ?? RECORA_PERSONA_BLUEPRINT_CATALOG_V3;
  if (catalog === RECORA_PERSONA_BLUEPRINT_CATALOG_V3) {
    const validation = validateRecoraPersonaBlueprintCatalogV3();
    if (!validation.valid) {
      return emptyResult("blocked", {
        blockers: ["compiler_internal_invariant", ...validation.blockers]
      });
    }
  }

  const byKey = new Map(catalog.map((item) => [item.blueprintKey, item]));
  const matchedRecipes = matchRecoraPersonaSelectionRecipesV3(
    selectionInput.structureSignals,
    selectionInput.audience.scope,
    selectionInput.audience.priority
  );
  const specificRecipes = matchedRecipes.filter((item) => !item.fallback);
  const fallbackRecipes = matchedRecipes.filter((item) => item.fallback);
  const dominantSpecificRecipes = specificRecipes.filter((candidate) =>
    specificRecipes.every(
      (other) =>
        candidate.recipeKey === other.recipeKey ||
        candidate.supersedesRecipeKeys?.includes(other.recipeKey)
    )
  );

  if (
    specificRecipes.length > 1 &&
    dominantSpecificRecipes.length !== 1
  ) {
    return emptyResult("needs_review", {
      reviewQuestions: [
        {
          code: "multiple_selection_recipes_match",
          message:
            "複数の事業構造に対応するPersona Recipeが同時に一致しました。優先する測定構造を確認してください。",
          allowedAnswers: specificRecipes.map((item) => item.recipeKey)
        }
      ],
      warnings: [
        `matching_persona_recipes:${specificRecipes
          .map((item) => item.recipeKey)
          .join(",")}`
      ]
    });
  }
  if (specificRecipes.length === 0 && fallbackRecipes.length > 1) {
    return emptyResult("blocked", {
      blockers: ["compiler_internal_invariant"],
      warnings: [
        `multiple_fallback_persona_recipes:${fallbackRecipes
          .map((item) => item.recipeKey)
          .join(",")}`
      ]
    });
  }

  const specificRecipe =
    specificRecipes.length === 1
      ? specificRecipes[0]
      : dominantSpecificRecipes[0];
  const recipe = specificRecipe ?? fallbackRecipes[0];
  if (!recipe) {
    return emptyResult("catalog_gap", {
      blockers: ["required_coverage_missing"],
      warnings: ["no_persona_selection_recipe"]
    });
  }
  const actorReview = findActorRelationReview(selectionInput, recipe);
  if (actorReview) {
    return emptyResult("needs_review", {
      reviewQuestions: [actorReview],
      recipeKey: recipe.recipeKey,
      warnings: ["recipe_supporting_role_is_distinct_actor"]
    });
  }

  const fingerprint = buildRecoraPersonaSelectionFingerprint(selectionInput);
  const selected: RecoraSelectedPersonaV3[] = [];
  const missingKeys: string[] = [];
  const conditionalFailures: string[] = [];

  recipe.selections.forEach((selection, index) => {
    const primary = byKey.get(selection.primaryBlueprintKey);
    if (!primary) {
      missingKeys.push(selection.primaryBlueprintKey);
      return;
    }

    const supporting = (selection.supportingBlueprintKeys ?? [])
      .map((key) => byKey.get(key))
      .filter((item): item is RecoraPersonaBlueprintV3 => Boolean(item));
    for (const key of selection.supportingBlueprintKeys ?? []) {
      if (!byKey.has(key)) missingKeys.push(key);
    }

    const modifierKeys = (selection.modifierBindings ?? [])
      .filter((binding) =>
        selectionInput.lifecycleSignals.includes(binding.signal)
      )
      .map((binding) => binding.modifierBlueprintKey);
    const modifiers = modifierKeys
      .map((key) => byKey.get(key))
      .filter((item): item is RecoraPersonaBlueprintV3 => Boolean(item));
    for (const key of modifierKeys) {
      if (!byKey.has(key)) missingKeys.push(key);
    }

    const allBlueprints = [primary, ...supporting, ...modifiers];
    for (const blueprint of allBlueprints) {
      if (
        blueprint.kind === "conditional" &&
        !isConditionalBlueprintApplicable(
          blueprint,
          selectionInput,
          recipe.recipeKey
        )
      ) {
        conditionalFailures.push(blueprint.blueprintKey);
      }
    }

    const coverageDimensions = unique(
      allBlueprints.flatMap((item) => item.coverageDimensions)
    );
    const marketSides = unique(
      [primary, ...supporting].map((item) => item.marketSide)
    );
    const roleFamilies = unique(
      [primary, ...supporting].map((item) => item.roleFamily)
    );
    const topicInfluenceDimensions = unique(
      allBlueprints.flatMap((item) => item.topicInfluenceDimensions)
    );
    const selectionSemanticKey = buildRecoraPersonaSelectionSemanticKey({
      primaryBlueprintKey: primary.blueprintKey,
      supportingBlueprintKeys: supporting.map((item) => item.blueprintKey),
      modifierKeys: modifiers.map((item) => item.blueprintKey)
    });
    const displayName = supporting.length
      ? `${primary.label}（${supporting.map((item) => item.label).join("・")}）`
      : primary.label;

    selected.push({
      contractVersion: RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION,
      compilerVersion: RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
      catalogVersion: RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
      personaId: buildRecoraMeasurementPersonaId({
        personaSelectionFingerprint: fingerprint,
        primaryBlueprintKey: primary.blueprintKey,
        supportingBlueprintKeys: supporting.map((item) => item.blueprintKey),
        modifierKeys: modifiers.map((item) => item.blueprintKey)
      }),
      selectionSemanticKey,
      primaryBlueprintKey: primary.blueprintKey,
      supportingBlueprintKeys: supporting.map((item) => item.blueprintKey),
      modifierKeys: modifiers.map((item) => item.blueprintKey),
      coverageDimensions,
      marketSides,
      roleFamilies,
      topicInfluenceDimensions,
      displayName,
      description: buildDescription(primary, supporting, modifiers),
      triggerSituation: `${selectionInput.subject.semanticName}について候補を探し、比較し、判断する場面`,
      primaryGoal: buildPrimaryGoal(coverageDimensions),
      selectionEvidence: [
        `recipe:${recipe.recipeKey}`,
        ...selectionInput.structureSignals.map(
          (signal) => `structure:${signal}`
        )
      ],
      sortOrder: index + 1
    });
  });

  if (missingKeys.length > 0) {
    return emptyResult("catalog_gap", {
      blockers: ["selected_blueprint_missing"],
      warnings: unique(missingKeys.map((key) => `missing:${key}`)),
      recipeKey: recipe.recipeKey,
      personaSelectionFingerprint: fingerprint
    });
  }
  if (conditionalFailures.length > 0) {
    return emptyResult("blocked", {
      blockers: ["conditional_blueprint_not_customer_side"],
      warnings: unique(
        conditionalFailures.map((key) => `conditional_not_applicable:${key}`)
      ),
      recipeKey: recipe.recipeKey,
      personaSelectionFingerprint: fingerprint
    });
  }

  const duplicateIndexes = findDuplicateSelectionIndexes(selected);
  if (duplicateIndexes.length > 0) {
    replaceDuplicateSelections(
      selected,
      duplicateIndexes,
      recipe,
      byKey,
      selectionInput,
      fingerprint
    );
  }

  const blockers = validateSelected(
    selected,
    recipe,
    selectionInput,
    byKey
  );
  if (blockers.length > 0) {
    return emptyResult("catalog_gap", {
      blockers,
      warnings: ["selected_persona_contract_not_satisfied"],
      recipeKey: recipe.recipeKey,
      personaSelectionFingerprint: fingerprint
    });
  }

  const alternatives = buildAlternatives(
    recipe,
    byKey,
    selectionInput,
    selected
  );
  const excluded = buildExcluded(
    catalog,
    selected,
    alternatives,
    selectionInput,
    recipe
  );

  return {
    contractVersion: RECORA_PERSONA_COMPILATION_CONTRACT_VERSION,
    compilerVersion: RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
    catalogVersion: RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
    status: "ready",
    selected,
    alternatives,
    excluded,
    reviewQuestions: [],
    blockers: [],
    warnings: recipe.fallback
      ? ["audience_fallback_recipe_used"]
      : specificRecipes.length > 1
        ? [
            `superseded_persona_recipes:${specificRecipes
              .filter((item) => item.recipeKey !== recipe.recipeKey)
              .map((item) => item.recipeKey)
              .join(",")}`
          ]
        : [],
    recipeKey: recipe.recipeKey,
    personaSelectionFingerprint: fingerprint
  };
}

function validatePersonaSelectionInput(
  input: RecoraPersonaSelectionInputV3
): string[] {
  const blockers: string[] = [];
  if (input.market.country !== "JP") blockers.push("unsupported_country");
  if (input.market.locale !== "ja-JP") blockers.push("unsupported_locale");
  if (!input.subject.semanticName) blockers.push("primary_subject_name_missing");

  const relationsByPair = new Map<string, Set<string>>();
  for (const relation of input.actorRelations) {
    if (
      !relation.leftRoleKey ||
      !relation.rightRoleKey ||
      relation.leftRoleKey === relation.rightRoleKey
    ) {
      blockers.push("actor_relation_conflict");
      continue;
    }
    const pair = actorRelationKey(
      relation.leftRoleKey,
      relation.rightRoleKey
    );
    const relations = relationsByPair.get(pair) ?? new Set<string>();
    relations.add(relation.relation);
    relationsByPair.set(pair, relations);
  }
  if (Array.from(relationsByPair.values()).some((items) => items.size > 1)) {
    blockers.push("actor_relation_conflict");
  }

  return unique(blockers);
}

function findActorRelationReview(
  input: RecoraPersonaSelectionInputV3,
  recipe: RecoraPersonaSelectionRecipeV3
): RecoraPersonaReviewQuestionV3 | null {
  const relationMap = new Map(
    input.actorRelations.map((item) => [
      actorRelationKey(item.leftRoleKey, item.rightRoleKey),
      item.relation
    ])
  );

  for (const selection of recipe.selections) {
    for (const supportingKey of selection.supportingBlueprintKeys ?? []) {
      const relation = relationMap.get(
        actorRelationKey(selection.primaryBlueprintKey, supportingKey)
      );
      if (relation === "same_actor") continue;

      return {
        code: "actor_relation_changes_persona_count",
        message:
          relation === "distinct_actors"
            ? "同一Personaへまとめる予定の役割が別人物として確認されています。優先する5件を確認してください。"
            : "同一Personaへまとめる役割が同一人物か確認できません。優先する5件を確認してください。",
        allowedAnswers: [
          "keep_primary",
          "promote_supporting",
          "review_persona_set"
        ]
      };
    }
  }
  return null;
}

function actorRelationKey(leftRoleKey: string, rightRoleKey: string): string {
  return [leftRoleKey, rightRoleKey].sort().join("|");
}

function isConditionalBlueprintApplicable(
  blueprint: RecoraPersonaBlueprintV3,
  input: RecoraPersonaSelectionInputV3,
  recipeKey: string
): boolean {
  if (blueprint.kind !== "conditional") return true;
  if (blueprint.requiredSignalsAny.length === 0) return false;
  return blueprint.requiredSignalsAny.some((signal) =>
    input.structureSignals.includes(signal)
  );
}

function validateSelected(
  selected: readonly RecoraSelectedPersonaV3[],
  recipe: RecoraPersonaSelectionRecipeV3,
  input: RecoraPersonaSelectionInputV3,
  byKey: ReadonlyMap<string, RecoraPersonaBlueprintV3>
): string[] {
  const blockers: string[] = [];
  if (selected.length !== RECORA_MEASUREMENT_PERSONA_SELECTED_COUNT) {
    blockers.push("selected_count_mismatch");
  }
  if (
    new Set(selected.map((item) => item.selectionSemanticKey)).size !==
    selected.length
  ) {
    blockers.push("selected_semantic_duplicate");
  }
  if (new Set(selected.map((item) => item.personaId)).size !== selected.length) {
    blockers.push("persona_identity_collision");
  }
  if (selected.some((item) => item.topicInfluenceDimensions.length < 2)) {
    blockers.push("selected_topic_effects_insufficient");
  }

  for (const item of selected) {
    const primary = byKey.get(item.primaryBlueprintKey);
    const supporting = item.supportingBlueprintKeys.map((key) => byKey.get(key));
    const modifiers = item.modifierKeys.map((key) => byKey.get(key));
    if (
      primary?.kind === "modifier" ||
      supporting.some((blueprint) => blueprint?.kind === "modifier")
    ) {
      blockers.push("selected_modifier_standalone");
    }
    if (modifiers.some((blueprint) => blueprint?.kind !== "modifier")) {
      blockers.push("compiler_internal_invariant");
    }
  }

  const coverage = new Set(selected.flatMap((item) => item.coverageDimensions));
  for (const required of recipe.requiredCoverage) {
    if (!coverage.has(required)) blockers.push("required_coverage_missing");
  }

  const selectedMarketSides = new Set(
    selected.flatMap((item) => item.marketSides)
  );
  const inputMarketSides = new Set(input.customerSides);
  for (const required of recipe.requiredMarketSides) {
    if (
      !inputMarketSides.has(required) ||
      !selectedMarketSides.has(required)
    ) {
      blockers.push("required_market_side_missing");
    }
  }

  return unique(blockers);
}

function findDuplicateSelectionIndexes(
  selected: readonly RecoraSelectedPersonaV3[]
): number[] {
  const seen = new Map<string, number>();
  const duplicates: number[] = [];
  selected.forEach((item, index) => {
    const previous = seen.get(item.selectionSemanticKey);
    if (previous == null) seen.set(item.selectionSemanticKey, index);
    else duplicates.push(index);
  });
  return duplicates;
}

function replaceDuplicateSelections(
  selected: RecoraSelectedPersonaV3[],
  duplicateIndexes: readonly number[],
  recipe: RecoraPersonaSelectionRecipeV3,
  byKey: ReadonlyMap<string, RecoraPersonaBlueprintV3>,
  input: RecoraPersonaSelectionInputV3,
  fingerprint: string
) {
  const used = new Set(selected.map((item) => item.selectionSemanticKey));
  const alternatives = recipe.alternativeBlueprintKeys
    .map((key) => byKey.get(key))
    .filter((item): item is RecoraPersonaBlueprintV3 => Boolean(item))
    .filter((item) => item.kind !== "modifier")
    .filter((item) =>
      isConditionalBlueprintApplicable(item, input, recipe.recipeKey)
    );

  for (const index of duplicateIndexes) {
    const replacement = alternatives.find((item) => {
      const semanticKey = buildRecoraPersonaSelectionSemanticKey({
        primaryBlueprintKey: item.blueprintKey,
        supportingBlueprintKeys: [],
        modifierKeys: []
      });
      return !used.has(semanticKey);
    });
    if (!replacement) continue;

    const semanticKey = buildRecoraPersonaSelectionSemanticKey({
      primaryBlueprintKey: replacement.blueprintKey,
      supportingBlueprintKeys: [],
      modifierKeys: []
    });
    used.add(semanticKey);
    selected[index] = {
      contractVersion: RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION,
      compilerVersion: RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
      catalogVersion: RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
      personaId: buildRecoraMeasurementPersonaId({
        personaSelectionFingerprint: fingerprint,
        primaryBlueprintKey: replacement.blueprintKey,
        supportingBlueprintKeys: [],
        modifierKeys: []
      }),
      selectionSemanticKey: semanticKey,
      primaryBlueprintKey: replacement.blueprintKey,
      supportingBlueprintKeys: [],
      modifierKeys: [],
      coverageDimensions: replacement.coverageDimensions,
      marketSides: [replacement.marketSide],
      roleFamilies: [replacement.roleFamily],
      topicInfluenceDimensions: replacement.topicInfluenceDimensions,
      displayName: replacement.label,
      description: replacement.description,
      triggerSituation: `${input.subject.semanticName}について候補を探し、比較し、判断する場面`,
      primaryGoal: buildPrimaryGoal(replacement.coverageDimensions),
      selectionEvidence: [
        `recipe:${recipe.recipeKey}`,
        "duplicate_replaced_by_alternative"
      ],
      sortOrder: index + 1
    };
  }
}

function buildAlternatives(
  recipe: RecoraPersonaSelectionRecipeV3,
  byKey: ReadonlyMap<string, RecoraPersonaBlueprintV3>,
  input: RecoraPersonaSelectionInputV3,
  selected: readonly RecoraSelectedPersonaV3[]
): RecoraPersonaAlternativeV3[] {
  const selectedKeys = new Set(
    selected.flatMap((item) => [
      item.primaryBlueprintKey,
      ...item.supportingBlueprintKeys,
      ...item.modifierKeys
    ])
  );

  return recipe.alternativeBlueprintKeys
    .map((key) => byKey.get(key))
    .filter((item): item is RecoraPersonaBlueprintV3 => Boolean(item))
    .filter((item) => !selectedKeys.has(item.blueprintKey))
    .filter((item) => item.kind !== "modifier")
    .filter((item) =>
      isConditionalBlueprintApplicable(item, input, recipe.recipeKey)
    )
    .map((item) => {
      const replaceableSelectionIndexes = selected
        .map((selection, selectionIndex) => {
          const replacement = buildAlternativeReplacement(
            selection,
            item,
            selectionIndex
          );
          const hypothetical = selected.map((current, currentIndex) =>
            currentIndex === selectionIndex ? replacement : current
          );
          return validateSelected(
            hypothetical,
            recipe,
            input,
            byKey
          ).length === 0
            ? selectionIndex
            : -1;
        })
        .filter((selectionIndex) => selectionIndex >= 0);

      return {
        blueprintKey: item.blueprintKey,
        label: item.label,
        replaceableSelectionIndexes,
        reasons: ["recipe_alternative_contract_preserved"]
      };
    })
    .filter((item) => item.replaceableSelectionIndexes.length > 0)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

function buildAlternativeReplacement(
  source: RecoraSelectedPersonaV3,
  blueprint: RecoraPersonaBlueprintV3,
  selectionIndex: number
): RecoraSelectedPersonaV3 {
  return {
    ...source,
    personaId: `alternative:${blueprint.blueprintKey}:${selectionIndex}`,
    selectionSemanticKey: buildRecoraPersonaSelectionSemanticKey({
      primaryBlueprintKey: blueprint.blueprintKey,
      supportingBlueprintKeys: [],
      modifierKeys: []
    }),
    primaryBlueprintKey: blueprint.blueprintKey,
    supportingBlueprintKeys: [],
    modifierKeys: [],
    coverageDimensions: blueprint.coverageDimensions,
    marketSides: [blueprint.marketSide],
    roleFamilies: [blueprint.roleFamily],
    topicInfluenceDimensions: blueprint.topicInfluenceDimensions,
    displayName: blueprint.label,
    description: blueprint.description,
    primaryGoal: buildPrimaryGoal(blueprint.coverageDimensions),
    selectionEvidence: ["recipe_alternative_contract_check"]
  };
}

function buildExcluded(
  catalog: readonly RecoraPersonaBlueprintV3[],
  selected: readonly RecoraSelectedPersonaV3[],
  alternatives: readonly RecoraPersonaAlternativeV3[],
  input: RecoraPersonaSelectionInputV3,
  recipe: RecoraPersonaSelectionRecipeV3
): RecoraPersonaExcludedV3[] {
  const used = new Set([
    ...selected.flatMap((item) => [
      item.primaryBlueprintKey,
      ...item.supportingBlueprintKeys,
      ...item.modifierKeys
    ]),
    ...alternatives.map((item) => item.blueprintKey)
  ]);
  const selectedGroups = new Set<string>(
    selected
      .flatMap((item) => [
        item.primaryBlueprintKey,
        ...item.supportingBlueprintKeys
      ])
      .map(
        (key) =>
          catalog.find((item) => item.blueprintKey === key)?.semanticGroupKey
      )
      .filter((key): key is string => Boolean(key))
  );

  return catalog
    .filter((item) => !used.has(item.blueprintKey))
    .map((item) => {
      const reasonCodes: RecoraPersonaExcludedV3["reasonCodes"][number][] = [];
      if (item.kind === "modifier") {
        reasonCodes.push("modifier_not_standalone");
        return { blueprintKey: item.blueprintKey, reasonCodes };
      }

      const override = recipe.exclusionReasonOverrides?.[item.blueprintKey];
      if (override) reasonCodes.push(override);

      if (
        input.audience.scope === "b2b" &&
        item.blueprintKey.startsWith("b2c.")
      ) {
        reasonCodes.push("wrong_customer_scope");
      }
      if (
        input.audience.scope === "b2c" &&
        item.blueprintKey.startsWith("b2b.")
      ) {
        reasonCodes.push("wrong_customer_scope");
      }
      if (!input.customerSides.includes(item.marketSide)) {
        reasonCodes.push("wrong_market_side");
      }
      if (
        item.requiredSignalsAny.length > 0 &&
        !item.requiredSignalsAny.some((signal) =>
          input.structureSignals.includes(signal)
        )
      ) {
        reasonCodes.push("wrong_business_motion");
      }
      if (
        item.kind === "conditional" &&
        !isConditionalBlueprintApplicable(item, input, recipe.recipeKey)
      ) {
        reasonCodes.push("conditional_side_not_customer");
      }
      if (selectedGroups.has(item.semanticGroupKey)) {
        reasonCodes.push("semantic_duplicate");
      }
      reasonCodes.push("not_required_by_selected_recipe");

      return {
        blueprintKey: item.blueprintKey,
        reasonCodes: unique(reasonCodes)
      };
    });
}

function buildDescription(
  primary: RecoraPersonaBlueprintV3,
  supporting: readonly RecoraPersonaBlueprintV3[],
  modifiers: readonly RecoraPersonaBlueprintV3[]
): string {
  return [
    primary.description,
    supporting.length
      ? `兼任する役割: ${supporting.map((item) => item.label).join("、")}。`
      : "",
    modifiers.length
      ? `現在の状況: ${modifiers.map((item) => item.label).join("、")}。`
      : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function buildPrimaryGoal(
  coverage: readonly RecoraPersonaCoverageDimension[]
): string {
  const primary = coverage[0] ?? "C1";
  const goals: Record<RecoraPersonaCoverageDimension, string> = {
    C1: "課題や目的に合う候補を見つける",
    C2: "複数候補を比較し違いを理解する",
    C3: "購入・予約・申込・導入の判断を行う",
    C4: "実際の利用・運用・受益への適合を確認する",
    C5: "関係者へ推薦し合意形成を進める",
    C6: "技術・法務・安全・契約上の審査を行う",
    C7: "家族・代理・別支払者として判断を支える",
    C8: "継続・更新・解約・乗り換えを判断する"
  };
  return goals[primary];
}

function emptyResult(
  status: RecoraPersonaCompilationV3["status"],
  change: Partial<RecoraPersonaCompilationV3> = {}
): RecoraPersonaCompilationV3 {
  return {
    contractVersion: RECORA_PERSONA_COMPILATION_CONTRACT_VERSION,
    compilerVersion: RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
    catalogVersion: RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
    status,
    selected: [],
    alternatives: [],
    excluded: [],
    reviewQuestions: [],
    blockers: [],
    warnings: [],
    recipeKey: null,
    personaSelectionFingerprint: null,
    ...change
  };
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort();
}
