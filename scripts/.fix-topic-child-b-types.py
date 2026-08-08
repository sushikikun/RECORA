from __future__ import annotations

from pathlib import Path

COMPILER = Path("lib/recora/measurement-topic-compiler.ts")
VERIFY = Path("scripts/verify-recora-measurement-topic-compiler.ts")


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, got {count}\n{old[:300]}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


replace_once(
    COMPILER,
    '''  RECORA_AUDIENCE_PRIORITIES,\n  RECORA_AUDIENCE_SCOPES,\n  RECORA_BUSINESS_DOMAINS,''',
    '''  RECORA_BUSINESS_DOMAINS,''',
    "remove unused audience constants",
)
replace_once(
    COMPILER,
    '''  RECORA_SUBJECT_TYPES,\n  type RecoraGenerationCustomerSide,\n  type RecoraPromptGenerationInputV1''',
    '''  RECORA_SUBJECT_TYPES,\n  type RecoraPromptGenerationInputV1''',
    "remove unused customer-side type",
)
replace_once(
    COMPILER,
    '''  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,\n  RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,''',
    '''  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,\n  RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1,\n  RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,''',
    "add primary action binding import",
)
replace_once(
    COMPILER,
    '''function intersects(left: readonly string[], right: readonly string[]): boolean {\n  const rightSet = new Set(right);\n  return left.some((value) => rightSet.has(value));\n}\n\nfunction containsAll(left: readonly string[], right: readonly string[]): boolean {\n  const leftSet = new Set(left);\n  return right.every((value) => leftSet.has(value));\n}\n\nfunction containsNone(left: readonly string[], right: readonly string[]): boolean {\n  const leftSet = new Set(left);\n  return right.every((value) => !leftSet.has(value));\n}''',
    '''function intersects(left: readonly unknown[], right: readonly unknown[]): boolean {\n  const rightSet = new Set(right);\n  return left.some((value) => rightSet.has(value));\n}\n\nfunction containsAll(left: readonly unknown[], right: readonly unknown[]): boolean {\n  const leftSet = new Set(left);\n  return right.every((value) => leftSet.has(value));\n}\n\nfunction containsNone(left: readonly unknown[], right: readonly unknown[]): boolean {\n  const leftSet = new Set(left);\n  return right.every((value) => !leftSet.has(value));\n}''',
    "generalize set predicates",
)
replace_once(
    COMPILER,
    '''  const anyChecks: readonly [readonly string[] | null, readonly string[]][] = [''',
    '''  const anyChecks: readonly [readonly unknown[] | null, readonly unknown[]][] = [''',
    "widen applicability tuple",
)
replace_once(
    COMPILER,
    '''    influences: uniqueCodePoint(\n      influenceRequirements.flatMap((required) =>\n        persona.topicInfluenceDimensions.filter((value) => required.includes(value))\n      )\n    ),\n    roles: uniqueCodePoint(\n      roleRequirements.flatMap((required) =>\n        persona.roleFamilies.filter((value) => required.includes(value))\n      )\n    ),\n    marketSides: uniqueCodePoint(\n      sideRequirements.flatMap((required) =>\n        persona.marketSides.filter((value) => required.includes(value))\n      )\n    )''',
    '''    influences: uniqueCodePoint(\n      influenceRequirements.flatMap((required) =>\n        persona.topicInfluenceDimensions.filter((value) => required.includes(value))\n      )\n    ) as RecoraPersonaTopicEdgeDraftV3["matchedInfluenceDimensions"],\n    roles: uniqueCodePoint(\n      roleRequirements.flatMap((required) =>\n        persona.roleFamilies.filter((value) => required.includes(value))\n      )\n    ) as RecoraPersonaTopicEdgeDraftV3["matchedRoleFamilies"],\n    marketSides: uniqueCodePoint(\n      sideRequirements.flatMap((required) =>\n        persona.marketSides.filter((value) => required.includes(value))\n      )\n    ) as RecoraPersonaTopicEdgeDraftV3["matchedMarketSides"]''',
    "narrow persona authority output",
)
replace_once(
    COMPILER,
    '''      expectedEntityTypes: uniqueCodePoint(topic.allBlueprints.flatMap((item) => item.expectedEntityTypes)),''',
    '''      expectedEntityTypes: uniqueCodePoint(\n        topic.allBlueprints.flatMap((item) => item.expectedEntityTypes)\n      ) as RecoraSelectedTopicV3["expectedEntityTypes"],''',
    "narrow expected entity types",
)
replace_once(
    VERIFY,
    '''  RecoraPersonaCompilationV3,\n  RecoraSelectedPersonaV3\n} from "../lib/recora/measurement-persona-contract";''',
    '''  RecoraPersonaCompilationV3\n} from "../lib/recora/measurement-persona-contract";''',
    "remove unused selected persona import",
)
replace_once(
    VERIFY,
    '''  RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,\n  RECORA_TOPIC_COVERAGE_DIMENSIONS,\n  type RecoraTopicCompilationV3,''',
    '''  RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,\n  type RecoraTopicCompilationV3,''',
    "remove unused coverage import",
)

print("Topic Compiler type-boundary fixes applied")
