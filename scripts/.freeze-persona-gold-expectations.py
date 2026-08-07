from __future__ import annotations

import json
import sys
from pathlib import Path

FIXTURE = Path("scripts/fixtures/recora-measurement-persona-gold-fixtures.ts")
VERIFY = Path("scripts/verify-recora-measurement-persona-compiler.ts")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"{label}: expected one match, got {count}\nTARGET:\n{old[:500]}"
        )
    return text.replace(old, new, 1)


if len(sys.argv) != 2:
    raise SystemExit(
        "usage: freeze-persona-gold-expectations.py <expectations.json>"
    )

expectations_path = Path(sys.argv[1])
expectations = json.loads(expectations_path.read_text(encoding="utf-8"))
if not isinstance(expectations, dict) or len(expectations) != 31:
    raise RuntimeError(
        f"expected 31 ready Persona Gold expectations, got {len(expectations) if isinstance(expectations, dict) else type(expectations).__name__}"
    )

fixture_text = FIXTURE.read_text(encoding="utf-8")
fixture_text = replace_once(
    fixture_text,
    '''import {
  RECORA_PERSONA_GOLD_FIXTURE_VERSION,
  type RecoraPersonaGoldFixtureV3,
  type RecoraPersonaGoldSelectionV3
} from "../../lib/recora/measurement-persona-contract";
import { RECORA_PERSONA_BLUEPRINT_BY_KEY } from "../../lib/recora/measurement-persona-catalog";
import { RECORA_PERSONA_SELECTION_RECIPES_V3 } from "../../lib/recora/measurement-persona-selection-rules";''',
    '''import {
  RECORA_PERSONA_GOLD_FIXTURE_VERSION,
  type RecoraPersonaCoverageDimension,
  type RecoraPersonaExclusionReasonCode,
  type RecoraPersonaGoldFixtureV3,
  type RecoraPersonaGoldSelectionV3
} from "../../lib/recora/measurement-persona-contract";''',
    "fixture imports"
)

mapping_json = json.dumps(
    expectations,
    ensure_ascii=False,
    indent=2,
    sort_keys=True
)
mapping_block = f'''type RecoraPersonaReadyGoldExpectationV3 = {{
  expectedRequiredCoverage: readonly RecoraPersonaCoverageDimension[];
  expectedRequiredMarketSides: readonly RecoraGenerationCustomerSide[];
  expectedAlternativeKeys: readonly string[];
  expectedExclusionCodes: readonly RecoraPersonaExclusionReasonCode[];
}};

export const RECORA_PERSONA_READY_GOLD_EXPECTATIONS_V3: Readonly<
  Record<string, RecoraPersonaReadyGoldExpectationV3>
> = {mapping_json};

'''

new_ready_fixture = r'''function readyFixture(input: {
  caseKey: string;
  recipeKey: string;
  signals: readonly RecoraGenerationStructureSignal[];
  selected: readonly RecoraPersonaGoldSelectionV3[];
  lifecycle?: readonly RecoraLifecycleSignal[];
  audienceScope?: RecoraAudienceScope;
  customerSides?: readonly RecoraGenerationCustomerSide[];
}): RecoraPersonaGoldFixtureV3 {
  const expectation =
    RECORA_PERSONA_READY_GOLD_EXPECTATIONS_V3[input.caseKey];
  if (!expectation) {
    throw new Error(`Unknown Persona Gold expectation: ${input.caseKey}`);
  }

  const actorRelations: RecoraConfirmedActorRelation[] = input.selected.flatMap(
    (selection) =>
      selection.supportingBlueprintKeys.map((supportingBlueprintKey) => ({
        leftRoleKey: selection.primaryBlueprintKey,
        rightRoleKey: supportingBlueprintKey,
        relation: "same_actor" as const
      }))
  );
  const generationInput = makeInput({
    signals: input.signals,
    lifecycle: input.lifecycle,
    audienceScope: input.audienceScope,
    customerSides:
      input.customerSides ?? expectation.expectedRequiredMarketSides,
    actorRelations,
    subjectName: input.caseKey
  });

  return {
    fixtureVersion: RECORA_PERSONA_GOLD_FIXTURE_VERSION,
    caseKey: input.caseKey,
    expectedStatus: "ready",
    generationInput,
    expectedRecipeKey: input.recipeKey,
    expectedSelected: input.selected,
    expectedRequiredCoverage: expectation.expectedRequiredCoverage,
    expectedRequiredMarketSides: expectation.expectedRequiredMarketSides,
    expectedAlternativeKeys: expectation.expectedAlternativeKeys,
    expectedExclusionCodes: expectation.expectedExclusionCodes
  };
}
'''

start = fixture_text.index("function readyFixture(input: {")
end = fixture_text.index("\nconst FIRST =", start)
fixture_text = (
    fixture_text[:start]
    + mapping_block
    + new_ready_fixture
    + fixture_text[end:]
)
FIXTURE.write_text(fixture_text, encoding="utf-8", newline="\n")

verify_text = VERIFY.read_text(encoding="utf-8")
verify_text = replace_once(
    verify_text,
    'import assert from "node:assert/strict";\n',
    'import assert from "node:assert/strict";\nimport { readFileSync } from "node:fs";\n',
    "verifier fs import"
)
verify_text = replace_once(
    verify_text,
    '''  RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3,
  RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3,
  RECORA_PERSONA_READY_GOLD_FIXTURES_V3,
  upstreamResultForFixture''',
    '''  RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3,
  RECORA_PERSONA_NEEDS_REVIEW_GOLD_FIXTURES_V3,
  RECORA_PERSONA_READY_GOLD_EXPECTATIONS_V3,
  RECORA_PERSONA_READY_GOLD_FIXTURES_V3,
  upstreamResultForFixture''',
    "verifier fixture import"
)
verify_text = replace_once(
    verify_text,
    '''assert.deepEqual(RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3, {
  ready: 31,
  needsReview: 12,
  catalogGap: 3,
  blocked: 8
});
verifyFixtureCatalogReferences();''',
    '''assert.deepEqual(RECORA_PERSONA_GOLD_FIXTURE_COUNTS_V3, {
  ready: 31,
  needsReview: 12,
  catalogGap: 3,
  blocked: 8
});
assert.deepEqual(
  Object.keys(RECORA_PERSONA_READY_GOLD_EXPECTATIONS_V3).sort(),
  RECORA_PERSONA_READY_GOLD_FIXTURES_V3.map((item) => item.caseKey).sort()
);
const goldFixtureSource = readFileSync(
  "scripts/fixtures/recora-measurement-persona-gold-fixtures.ts",
  "utf8"
);
assert.equal(
  goldFixtureSource.includes("RECORA_PERSONA_SELECTION_RECIPES_V3"),
  false
);
assert.equal(
  goldFixtureSource.includes("RECORA_PERSONA_BLUEPRINT_BY_KEY"),
  false
);
verifyFixtureCatalogReferences();''',
    "verifier independent expectation checks"
)
VERIFY.write_text(verify_text, encoding="utf-8", newline="\n")
