from __future__ import annotations

import json
import sys
from pathlib import Path

FIXTURE = Path("scripts/fixtures/recora-measurement-persona-gold-fixtures.ts")

if len(sys.argv) != 2:
    raise SystemExit(
        "usage: update-persona-gold-alternatives.py <alternatives.json>"
    )

alternatives = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
if not isinstance(alternatives, dict) or len(alternatives) != 31:
    raise RuntimeError(
        f"expected 31 alternative sets, got {len(alternatives) if isinstance(alternatives, dict) else type(alternatives).__name__}"
    )

text = FIXTURE.read_text(encoding="utf-8")
const_marker = "export const RECORA_PERSONA_READY_GOLD_EXPECTATIONS_V3"
const_start = text.index(const_marker)
mapping_start = text.index("> = ", const_start) + len("> = ")
mapping_end = text.index(";\n\nfunction readyFixture", mapping_start)
expectations = json.loads(text[mapping_start:mapping_end])

if set(expectations) != set(alternatives):
    raise RuntimeError(
        f"case mismatch: missing={sorted(set(expectations) - set(alternatives))} "
        f"extra={sorted(set(alternatives) - set(expectations))}"
    )

for case_key, keys in alternatives.items():
    if not isinstance(keys, list) or not all(isinstance(key, str) for key in keys):
        raise RuntimeError(f"invalid alternatives: {case_key}")
    expectations[case_key]["expectedAlternativeKeys"] = keys

mapping_json = json.dumps(
    expectations,
    ensure_ascii=False,
    indent=2,
    sort_keys=True
)
text = text[:mapping_start] + mapping_json + text[mapping_end:]
FIXTURE.write_text(text, encoding="utf-8", newline="\n")
