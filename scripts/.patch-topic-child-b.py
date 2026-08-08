from pathlib import Path

COMPILER = Path("lib/recora/measurement-topic-compiler.ts")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"{path}: expected one match, got {count}\nTARGET:\n{old}"
        )
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


replace_once(
    COMPILER,
    '''  const staticValidation =
    recipes === RECORA_TOPIC_SELECTION_RECIPES_V3
      ? validateRecoraTopicSelectionRecipesV3(personaKeys)
      : validateCustomRecipes(recipes, personaKeys);
  return [...staticValidation];''',
    '''  if (recipes === RECORA_TOPIC_SELECTION_RECIPES_V3) {
    return [...validateRecoraTopicSelectionRecipesV3(personaKeys).blockers];
  }
  return validateCustomRecipes(recipes, personaKeys);'''
)

print("Topic Child B follow-up patch applied")
