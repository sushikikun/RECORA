import { RECORA_PERSONA_READY_GOLD_FIXTURES_V3 } from "./fixtures/recora-measurement-persona-gold-fixtures";

const expectations = Object.fromEntries(
  RECORA_PERSONA_READY_GOLD_FIXTURES_V3.map((fixture) => {
    if (
      !fixture.expectedRequiredCoverage ||
      !fixture.expectedRequiredMarketSides ||
      !fixture.expectedAlternativeKeys ||
      !fixture.expectedExclusionCodes
    ) {
      throw new Error(`Incomplete ready fixture expectation: ${fixture.caseKey}`);
    }

    return [
      fixture.caseKey,
      {
        expectedRequiredCoverage: fixture.expectedRequiredCoverage,
        expectedRequiredMarketSides: fixture.expectedRequiredMarketSides,
        expectedAlternativeKeys: fixture.expectedAlternativeKeys,
        expectedExclusionCodes: fixture.expectedExclusionCodes
      }
    ];
  })
);

process.stdout.write(`${JSON.stringify(expectations, null, 2)}\n`);
