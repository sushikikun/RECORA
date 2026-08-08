from __future__ import annotations

import base64
import gzip
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "// -----------------------------------------------------------------------------\n// Child B: Measurement Topic Compiler contracts"

PAYLOADS = {
    "lib/recora/measurement-topic-selection-rules.ts": "scripts/.topic-child-b-selection-rules.gz.b64",
    "lib/recora/measurement-topic-compiler.ts": "scripts/.topic-child-b-compiler.gz.b64",
    "scripts/fixtures/recora-measurement-topic-gold-fixtures.ts": "scripts/.topic-child-b-fixture.gz.b64",
    "scripts/verify-recora-measurement-topic-compiler.ts": "scripts/.topic-child-b-verifier.gz.b64",
    "docs/architecture/measurement-design/recora_measurement_topic_compiler_v3_ja.md": "scripts/.topic-child-b-docs.gz.b64",
}


def decode_payload(path: Path) -> str:
    encoded = "".join(path.read_text(encoding="utf-8").split())
    return gzip.decompress(base64.b64decode(encoded)).decode("utf-8")


for destination, payload in PAYLOADS.items():
    target = ROOT / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        decode_payload(ROOT / payload).rstrip() + "\n",
        encoding="utf-8",
        newline="\n",
    )

contract_path = ROOT / "lib/recora/measurement-topic-contract.ts"
contract = contract_path.read_text(encoding="utf-8")
if MARKER in contract:
    contract = contract[: contract.index(MARKER)].rstrip()
appendix = decode_payload(
    ROOT / "scripts/.topic-child-b-contract-append.gz.b64"
).strip()
contract_path.write_text(
    contract.rstrip() + "\n\n" + appendix + "\n",
    encoding="utf-8",
    newline="\n",
)

print("Topic Child B files materialized")
