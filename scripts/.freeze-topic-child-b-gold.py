from __future__ import annotations

import json
import sys
from pathlib import Path

FIXTURE = Path("scripts/fixtures/recora-measurement-topic-gold-fixtures.ts")

if len(sys.argv) != 2:
    raise SystemExit("usage: freeze-topic-child-b-gold.py <expectations.json>")

values = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
if not isinstance(values, dict) or len(values) != 35:
    raise RuntimeError(
        f"expected 35 ready expectation sets, got "
        f"{len(values) if isinstance(values, dict) else type(values).__name__}"
    )

text = FIXTURE.read_text(encoding="utf-8")
start = text.index("function expectedKeys(")
end = text.index("export const RECORA_TOPIC_READY_GOLD_FIXTURES_V3", start)

primary = {
    key: payload["primaryBlueprintKeys"]
    for key, payload in sorted(values.items())
}
meaning = {
    key: payload["meaningExpectations"]
    for key, payload in sorted(values.items())
}
for key, keys in primary.items():
    if not isinstance(keys, list) or len(keys) != 6:
        raise RuntimeError(f"{key}: expected exactly six primary keys")

primary_json = json.dumps(primary, ensure_ascii=False, indent=2, sort_keys=True)
meaning_json = json.dumps(meaning, ensure_ascii=False, indent=2, sort_keys=True)

replacement = f'''export const RECORA_TOPIC_FROZEN_PRIMARY_EXPECTATIONS_V3 = {primary_json} as const;

export const RECORA_TOPIC_FROZEN_MEANING_EXPECTATIONS_V3 = {meaning_json} as const;

function expectedKeys(
  spec: TopicGenerationSpecV3
): RecoraTopicReadyGoldFixtureV3["expectedPrimaryBlueprintKeys"] {{
  const frozen = RECORA_TOPIC_FROZEN_PRIMARY_EXPECTATIONS_V3[
    spec.recipeKey as keyof typeof RECORA_TOPIC_FROZEN_PRIMARY_EXPECTATIONS_V3
  ];
  if (frozen) {{
    return frozen;
  }}
  const nonT4 = EXPECTED_PRIMARY_WITHOUT_T4[
    spec.recipeKey as keyof typeof EXPECTED_PRIMARY_WITHOUT_T4
  ];
  const t4 = EXPECTED_ACTION_BLUEPRINTS[spec.action];
  return [nonT4[0], nonT4[1], nonT4[2], t4, nonT4[3], nonT4[4]];
}}

function meaningExpectations(
  spec: TopicGenerationSpecV3
): RecoraTopicReadyGoldFixtureV3["meaningExpectations"] {{
  return RECORA_TOPIC_FROZEN_MEANING_EXPECTATIONS_V3[
    spec.recipeKey as keyof typeof RECORA_TOPIC_FROZEN_MEANING_EXPECTATIONS_V3
  ];
}}

'''

FIXTURE.write_text(text[:start] + replacement + text[end:], encoding="utf-8", newline="\n")
print("Topic Gold expectations frozen")
