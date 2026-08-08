from __future__ import annotations

from pathlib import Path

COMPILER = Path("lib/recora/measurement-topic-compiler.ts")
text = COMPILER.read_text(encoding="utf-8")
old = '''  } else if (rule.kind === "domain_offering") {\n    const resolved = resolveDomainLabel(context);\n    if (!resolved || resolved.ambiguous) return null;\n    key = resolved.key;\n    label = resolved.label;\n  } else {'''
new = '''  } else if (rule.kind === "domain_offering") {\n    const resolved = resolveDomainLabel(context);\n    if (resolved && !resolved.ambiguous) {\n      key = resolved.key;\n      label = resolved.label;\n    } else if (context.recipe.structureSignal) {\n      const structureLabel =\n        RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1[context.recipe.structureSignal];\n      if (!structureLabel) return null;\n      key = `structure.${context.recipe.structureSignal}`;\n      label = structureLabel;\n    } else {\n      return null;\n    }\n  } else {'''
count = text.count(old)
if count != 1:
    raise RuntimeError(f"subject label fallback target count: {count}")
COMPILER.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")
print("Topic subject-label fallback applied")
