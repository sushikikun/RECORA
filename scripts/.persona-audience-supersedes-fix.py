from pathlib import Path

CONTRACT = Path("lib/recora/measurement-persona-contract.ts")
RULES = Path("lib/recora/measurement-persona-selection-rules.ts")
COMPILER = Path("lib/recora/measurement-persona-compiler.ts")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"{path}: expected one match, got {count}\nTARGET:\n{old[:500]}"
        )
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


replace_once(
    CONTRACT,
    "  fallback?: boolean;\n"
    "  matchSignalsAll?: readonly RecoraGenerationStructureSignal[];",
    "  fallback?: boolean;\n"
    "  supersedesRecipeKeys?: readonly string[];\n"
    "  matchSignalsAll?: readonly RecoraGenerationStructureSignal[];"
)

replace_once(
    RULES,
    '  recipe({\n'
    '    recipeKey: "commerce_gift",\n'
    '    matchSignalsAll: ["commerce_gift"],',
    '  recipe({\n'
    '    recipeKey: "commerce_gift",\n'
    '    supersedesRecipeKeys: ["commerce_single_purchase"],\n'
    '    matchSignalsAll: ["commerce_gift"],'
)

replace_once(
    COMPILER,
    '''  const specificRecipes = matchedRecipes.filter((item) => !item.fallback);
  const fallbackRecipes = matchedRecipes.filter((item) => item.fallback);

  if (specificRecipes.length > 1) {
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

  const recipe = specificRecipes[0] ?? fallbackRecipes[0];''',
    '''  const specificRecipes = matchedRecipes.filter((item) => !item.fallback);
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
  const recipe = specificRecipe ?? fallbackRecipes[0];'''
)

replace_once(
    COMPILER,
    '    warnings: recipe.fallback ? ["audience_fallback_recipe_used"] : [],',
    '''    warnings: recipe.fallback
      ? ["audience_fallback_recipe_used"]
      : specificRecipes.length > 1
        ? [
            `superseded_persona_recipes:${specificRecipes
              .filter((item) => item.recipeKey !== recipe.recipeKey)
              .map((item) => item.recipeKey)
              .join(",")}`
          ]
        : [],'''
)
