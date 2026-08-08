import {
  RECORA_TOPIC_READY_GOLD_FIXTURES_V3,
  type RecoraTopicMeaningMutationAxisV3,
  type RecoraTopicMeaningMutationExpectationV3
} from "./fixtures/recora-measurement-topic-gold-fixtures";
import {
  compileReadyRecoraMeasurementPersonasV3
} from "../lib/recora/measurement-persona-compiler";
import type {
  RecoraPersonaCompilationV3
} from "../lib/recora/measurement-persona-contract";
import {
  compileRecoraMeasurementTopicsV3
} from "../lib/recora/measurement-topic-compiler";
import {
  RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,
  type RecoraTopicCompilationV3
} from "../lib/recora/measurement-topic-contract";
import type {
  RecoraPromptGenerationInputV1
} from "../lib/recora/prompt-generation-input";

function compile(
  input: RecoraPromptGenerationInputV1,
  persona: RecoraPersonaCompilationV3
): RecoraTopicCompilationV3 {
  return compileRecoraMeasurementTopicsV3({
    contractVersion: RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION,
    generationInput: input,
    personaCompilation: persona
  });
}

function classify(
  baseline: Extract<RecoraTopicCompilationV3, { status: "ready" }>,
  result: RecoraTopicCompilationV3
): RecoraTopicMeaningMutationExpectationV3 {
  if (result.status === "needs_review") return "became_needs_review";
  if (result.status === "catalog_gap") return "became_catalog_gap";
  if (result.status !== "ready") return "became_catalog_gap";
  const before = baseline.selected.map((topic) => topic.primaryBlueprintKey).join("|");
  const after = result.selected.map((topic) => topic.primaryBlueprintKey).join("|");
  if (before !== after) return "selection_changed";
  return baseline.selectionIdentity.fingerprint === result.selectionIdentity.fingerprint
    ? "invariant_by_design"
    : "identity_only_changed";
}

function mutate(
  axis: RecoraTopicMeaningMutationAxisV3,
  recipeKey: string,
  originalInput: RecoraPromptGenerationInputV1,
  originalPersona: RecoraPersonaCompilationV3
): {
  input: RecoraPromptGenerationInputV1;
  persona: RecoraPersonaCompilationV3;
} {
  const input = structuredClone(originalInput);
  const persona = structuredClone(originalPersona);
  switch (axis) {
    case "audience_priority":
      if (input.audience.scope === "both") {
        input.audience.priority = input.audience.priority === "b2b_first"
          ? "b2c_first"
          : "b2b_first";
      }
      break;
    case "primary_action":
      input.actions.primary = input.actions.primary === "inquiry"
        ? "contract"
        : "inquiry";
      break;
    case "offering_model":
      if (recipeKey.startsWith("standard_")) {
        input.business.primaryOfferingModel = "managed_service";
      } else {
        input.business.secondaryOfferingModels = [
          ...input.business.secondaryOfferingModels,
          input.business.primaryOfferingModel === "managed_service"
            ? "consumer_service"
            : "managed_service"
        ];
      }
      break;
    case "structure_motion":
      input.generationContext.structureSignals = [
        ...input.generationContext.structureSignals,
        input.generationContext.structureSignals.includes("b2b_buying_group")
          ? "individual_travel"
          : "b2b_buying_group"
      ];
      break;
    case "geography":
      if (input.delivery.geographicBinding === "none") {
        input.delivery.geographicBinding = "service_area";
        input.delivery.serviceCoverage = "regional";
        input.delivery.serviceAreas = [
          {
            areaKey: "JP-27",
            label: "大阪府",
            level: "prefecture",
            parentAreaKey: "JP",
            resolutionStatus: "canonical"
          }
        ];
      } else {
        input.delivery.serviceAreas = [
          ...input.delivery.serviceAreas,
          {
            areaKey: "JP-27",
            label: "大阪府",
            level: "prefecture",
            parentAreaKey: "JP",
            resolutionStatus: "canonical"
          }
        ];
      }
      break;
    case "trust_regulation":
      input.trust.regulatoryFlags = [
        ...input.trust.regulatoryFlags,
        input.trust.regulatoryFlags.includes("mandatory_disclosure")
          ? "advertising_restriction"
          : "mandatory_disclosure"
      ];
      break;
    case "persona_modifier":
      if (persona.status === "ready") {
        const first = persona.selected[0];
        persona.selected = [
          {
            ...first,
            modifierKeys: [...first.modifierKeys, "lifecycle.synthetic_meaning_change"],
            selectionSemanticKey: `${first.selectionSemanticKey}|modifier:synthetic`
          },
          ...persona.selected.slice(1)
        ] as typeof persona.selected;
      }
      break;
    case "focus_theme":
      input.generationContext.focusThemes = ["料金"];
      break;
    case "persona_market_side":
      if (persona.status === "ready") {
        persona.selected = persona.selected.map((item) => ({
          ...item,
          marketSides: []
        })) as typeof persona.selected;
      }
      break;
  }
  return { input, persona };
}

const axes: readonly RecoraTopicMeaningMutationAxisV3[] = [
  "audience_priority",
  "primary_action",
  "offering_model",
  "structure_motion",
  "geography",
  "trust_regulation",
  "persona_modifier",
  "focus_theme",
  "persona_market_side"
];

const output: Record<string, {
  primaryBlueprintKeys: readonly string[];
  meaningExpectations: Readonly<Record<RecoraTopicMeaningMutationAxisV3, RecoraTopicMeaningMutationExpectationV3>>;
}> = {};

for (const fixture of RECORA_TOPIC_READY_GOLD_FIXTURES_V3) {
  const persona = compileReadyRecoraMeasurementPersonasV3(fixture.generationInput);
  if (persona.status !== "ready") {
    throw new Error(`${fixture.caseKey}: Persona is ${persona.status}: ${JSON.stringify(persona)}`);
  }
  const baseline = compile(fixture.generationInput, persona);
  if (baseline.status !== "ready") {
    throw new Error(`${fixture.caseKey}: Topic is ${baseline.status}: ${JSON.stringify(baseline)}`);
  }
  const meaning = {} as Record<RecoraTopicMeaningMutationAxisV3, RecoraTopicMeaningMutationExpectationV3>;
  for (const axis of axes) {
    const mutation = mutate(axis, fixture.expectedRecipeKey, fixture.generationInput, persona);
    meaning[axis] = classify(baseline, compile(mutation.input, mutation.persona));
  }
  output[fixture.expectedRecipeKey] = {
    primaryBlueprintKeys: baseline.selected.map((topic) => topic.primaryBlueprintKey),
    meaningExpectations: meaning
  };
}

process.stdout.write(JSON.stringify(output, null, 2));
