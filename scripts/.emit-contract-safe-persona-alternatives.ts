import { compileReadyRecoraMeasurementPersonasV3 } from "../lib/recora/measurement-persona-compiler";
import { RECORA_PERSONA_READY_GOLD_FIXTURES_V3 } from "./fixtures/recora-measurement-persona-gold-fixtures";

const alternativesByCase = Object.fromEntries(
  RECORA_PERSONA_READY_GOLD_FIXTURES_V3.map((fixture) => {
    if (!fixture.generationInput) {
      throw new Error(`Missing ready input: ${fixture.caseKey}`);
    }
    const result = compileReadyRecoraMeasurementPersonasV3(
      fixture.generationInput
    );
    if (result.status !== "ready") {
      throw new Error(
        `${fixture.caseKey}: expected ready, got ${result.status}:${result.blockers.join(",")}`
      );
    }
    return [
      fixture.caseKey,
      result.alternatives.map((item) => item.blueprintKey)
    ];
  })
);

process.stdout.write(`${JSON.stringify(alternativesByCase, null, 2)}\n`);
