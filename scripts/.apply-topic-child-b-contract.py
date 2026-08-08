from __future__ import annotations

from pathlib import Path

CONTRACT = Path("lib/recora/measurement-topic-contract.ts")
COMPILER = Path("lib/recora/measurement-topic-compiler.ts")
MARKER_START = "// === RECORA TOPIC COMPILER V3 CONTRACT START ==="
MARKER_END = "// === RECORA TOPIC COMPILER V3 CONTRACT END ==="


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, got {count}\n{old[:300]}")
    return text.replace(old, new, 1)


text = CONTRACT.read_text(encoding="utf-8")
if MARKER_START in text:
    start = text.index(MARKER_START)
    end = text.index(MARKER_END, start) + len(MARKER_END)
    text = text[:start].rstrip() + "\n"
    if end < len(text):
        text += text[end:]

if "RecoraPromptGenerationInputV1" not in text.split("export const RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION", 1)[0]:
    text = replace_once(
        text,
        "  RecoraServiceCoverage,\n  RecoraSubjectType\n} from \"./prompt-generation-input\";",
        "  RecoraServiceCoverage,\n  RecoraSubjectType,\n  RecoraPromptGenerationInputV1\n} from \"./prompt-generation-input\";",
        "prompt generation import",
    )
if "RecoraPersonaCompilationV3" not in text.split("export const RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION", 1)[0]:
    text = replace_once(
        text,
        "  RecoraPersonaRoleFamily,\n  RecoraPersonaTopicInfluenceDimension\n} from \"./measurement-persona-contract\";",
        "  RecoraPersonaRoleFamily,\n  RecoraPersonaTopicInfluenceDimension,\n  RecoraPersonaCompilationV3\n} from \"./measurement-persona-contract\";\nimport type {\n  RecoraTopicSelectionRecipeV3\n} from \"./measurement-topic-selection-rules\";",
        "persona import",
    )

block = r'''

// === RECORA TOPIC COMPILER V3 CONTRACT START ===
export const RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION =
  "recora_topic_selection_input_v3" as const;
export const RECORA_MEASUREMENT_TOPIC_CONTRACT_VERSION =
  "recora_measurement_topic_v3" as const;
export const RECORA_TOPIC_COMPILATION_CONTRACT_VERSION =
  "recora_topic_compilation_v3" as const;
export const RECORA_TOPIC_GOLD_FIXTURE_CONTRACT_VERSION =
  "recora_topic_gold_fixtures_ja_v3" as const;
export const RECORA_TOPIC_SELECTED_COUNT_V3 = 6 as const;
export const RECORA_TOPIC_PERSONA_COUNT_V3 = 5 as const;

export const RECORA_TOPIC_COMPILATION_STATUSES_V3 = [
  "ready",
  "needs_review",
  "catalog_gap",
  "blocked"
] as const;

export const RECORA_TOPIC_REVIEW_CODES_V3 = [
  "persona_compilation_needs_review",
  "focus_theme_conflict",
  "food_beauty_subtype_conflict",
  "prompt_subject_label_too_broad",
  "primary_action_mismatch",
  "topic_selection_ambiguous",
  "required_market_side_ambiguous",
  "required_geographic_context_ambiguous",
  "required_lifecycle_context_ambiguous"
] as const;

export const RECORA_TOPIC_CATALOG_GAP_CODES_V3 = [
  "persona_compilation_catalog_gap",
  "required_topic_blueprint_missing",
  "approved_topic_bundle_incomplete",
  "required_topic_coverage_missing",
  "selected_topic_semantic_duplicate",
  "topic_primary_edge_missing",
  "persona_topic_coverage_missing",
  "required_market_side_coverage_missing",
  "no_feasible_topic_set"
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
  "persona_sort_order_duplicate",
  "persona_topic_influence_insufficient",
  "topic_catalog_invalid",
  "topic_recipe_mapping_invalid",
  "topic_identity_collision",
  "compiler_internal_invariant"
] as const;

export const RECORA_TOPIC_WARNING_CODES_V3 = [
  "topic_alias_unmapped",
  "topic_subtype_defaulted"
] as const;

export type RecoraTopicCompilationStatusV3 =
  typeof RECORA_TOPIC_COMPILATION_STATUSES_V3[number];
export type RecoraTopicNonReadyStatusV3 = Exclude<
  RecoraTopicCompilationStatusV3,
  "ready"
>;
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

export type RecoraSelectedTopicLaneBindingV3 = {
  blueprintKey: string;
  laneKey: RecoraTopicMeasurementLaneKeyV3;
  promptSubjectLabelKey: string;
  promptSubjectLabel: string;
  questionActs: readonly RecoraQuestionAct[];
  expectedAnswerShapes: readonly RecoraTopicExpectedAnswerShapeV3[];
  allowedMetricKeys: readonly RecoraPromptMetricKey[];
  forbiddenMetricKeys: readonly RecoraPromptMetricKey[];
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
  laneBindings: readonly RecoraSelectedTopicLaneBindingV3[];
  personaIds: readonly string[];
  measurementGoal: string;
  expectedEntityTypes: readonly RecoraTopicExpectedEntityTypeV3[];
  comparisonAxes: readonly string[];
  expectedAnswerShapes: readonly RecoraTopicExpectedAnswerShapeV3[];
  selectionEvidence: readonly string[];
  sortOrder: 1 | 2 | 3 | 4 | 5 | 6;
};

export type RecoraPersonaTopicEdgeDraftV3 = {
  personaId: string;
  personaSelectionSemanticKey: string;
  personaSortOrder: number;
  edgeRole: "primary" | "supporting";
  matchedBlueprintKeys: readonly string[];
  matchedInfluenceDimensions: readonly RecoraPersonaTopicInfluenceDimension[];
  matchedRoleFamilies: readonly RecoraPersonaRoleFamily[];
  matchedMarketSides: readonly RecoraGenerationCustomerSide[];
  reasons: readonly string[];
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

export type RecoraTopicObservationTargetV3 = {
  topicId: string;
  includedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
};

export type RecoraTopicObservationOverlayV3 = {
  overlayKey: "diagnostic.natural_citation_observation";
  policyVersion: typeof RECORA_NATURAL_CITATION_OVERLAY_POLICY_VERSION;
  metricKey: "naturalCitationObservation";
  targets: readonly RecoraTopicObservationTargetV3[];
  excludedLaneKeys: readonly ["forced_citation_validation"];
  reasons: readonly string[];
};

export type RecoraTopicAlternativeV3 = {
  coverage: RecoraTopicCoverageDimensionV3;
  replacesTopicId: string;
  primaryBlueprintKey: string;
  supportingBlueprintKeys: readonly string[];
  reasons: readonly string[];
};

export type RecoraTopicExcludedReasonCodeV3 =
  | "observation_overlay_not_selectable"
  | "not_selected_by_recipe"
  | "typed_applicability_not_satisfied";

export type RecoraTopicExcludedCandidateV3 = {
  blueprintKey: string;
  reasonCode: RecoraTopicExcludedReasonCodeV3;
};

export type RecoraTopicSelectionIdentityV3 = {
  selectionSemanticsVersion: typeof RECORA_TOPIC_SELECTION_SEMANTICS_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION;
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  hashAlgorithm: "sha256";
  fingerprint: string;
};

export type RecoraReadyTopicCompilationV3 = {
  contractVersion: typeof RECORA_TOPIC_COMPILATION_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION;
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  selectionSemanticsVersion: typeof RECORA_TOPIC_SELECTION_SEMANTICS_VERSION;
  status: "ready";
  topicRecipeKey: string;
  selected: readonly [
    RecoraSelectedTopicV3,
    RecoraSelectedTopicV3,
    RecoraSelectedTopicV3,
    RecoraSelectedTopicV3,
    RecoraSelectedTopicV3,
    RecoraSelectedTopicV3
  ];
  personaTopicEdges: readonly RecoraPersonaTopicEdgeV3[];
  alternatives: readonly RecoraTopicAlternativeV3[];
  excludedCandidates: readonly RecoraTopicExcludedCandidateV3[];
  observationOverlays: readonly [RecoraTopicObservationOverlayV3];
  selectionIdentity: RecoraTopicSelectionIdentityV3;
  reviewCodes: readonly [];
  catalogGapCodes: readonly [];
  blockerCodes: readonly [];
  warnings: readonly RecoraTopicWarningCodeV3[];
};

export type RecoraNonReadyTopicCompilationV3 = {
  contractVersion: typeof RECORA_TOPIC_COMPILATION_CONTRACT_VERSION;
  compilerVersion: typeof RECORA_MEASUREMENT_TOPIC_COMPILER_VERSION;
  catalogVersion: typeof RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION;
  selectionSemanticsVersion: typeof RECORA_TOPIC_SELECTION_SEMANTICS_VERSION;
  status: RecoraTopicNonReadyStatusV3;
  topicRecipeKey: null;
  selected: readonly [];
  personaTopicEdges: readonly [];
  alternatives: readonly [];
  excludedCandidates: readonly [];
  observationOverlays: readonly [];
  selectionIdentity: null;
  reviewCodes: readonly RecoraTopicReviewCodeV3[];
  catalogGapCodes: readonly RecoraTopicCatalogGapCodeV3[];
  blockerCodes: readonly RecoraTopicBlockerCodeV3[];
  warnings: readonly RecoraTopicWarningCodeV3[];
};

export type RecoraTopicCompilationV3 =
  | RecoraReadyTopicCompilationV3
  | RecoraNonReadyTopicCompilationV3;

export type RecoraTopicCompilerOptionsV3 = {
  catalog?: readonly RecoraTopicBlueprintV3[];
  recipes?: readonly RecoraTopicSelectionRecipeV3[];
  aliasRegistry?: readonly RecoraTopicAliasRegistryEntryV3[];
};
// === RECORA TOPIC COMPILER V3 CONTRACT END ===
'''

text = text.rstrip() + block + "\n"
CONTRACT.write_text(text, encoding="utf-8", newline="\n")

compiler = COMPILER.read_text(encoding="utf-8")
compiler = compiler.replace(
    "  selected: readonly RecoraSelectedTopicV3[];\n  edges: readonly RecoraPersonaTopicEdgeV3[];",
    '  selected: RecoraReadyTopicCompilationV3["selected"];\n  edges: readonly RecoraPersonaTopicEdgeV3[];',
)
compiler = compiler.replace(
    "  return { selected, edges, identity, overlay };",
    '  return {\n    selected: selected as unknown as RecoraReadyTopicCompilationV3["selected"],\n    edges,\n    identity,\n    overlay\n  };',
)
COMPILER.write_text(compiler, encoding="utf-8", newline="\n")
print("Topic Compiler contract appended")
