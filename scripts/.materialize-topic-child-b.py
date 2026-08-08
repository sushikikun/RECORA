from __future__ import annotations

import base64
import gzip
from pathlib import Path
from typing import TypeAlias

ROOT = Path(__file__).resolve().parents[1]
MARKER = "// -----------------------------------------------------------------------------\n// Child B: Measurement Topic Compiler contracts"
PayloadPath: TypeAlias = str | tuple[str, ...]

PAYLOADS: dict[str, PayloadPath] = {
    "lib/recora/measurement-topic-selection-rules.ts": "scripts/.topic-child-b-selection-rules.gz.b64",
    "lib/recora/measurement-topic-compiler.ts": "scripts/.topic-child-b-compiler.gz.b64",
    "scripts/fixtures/recora-measurement-topic-gold-fixtures.ts": (
        "scripts/.topic-child-b-fixture.part1.b64",
        "scripts/.topic-child-b-fixture.part2.b64",
        "scripts/.topic-child-b-fixture.part3.b64",
        "scripts/.topic-child-b-fixture.part4.b64",
    ),
    "scripts/verify-recora-measurement-topic-compiler.ts": "scripts/.topic-child-b-verifier.gz.b64",
    "docs/architecture/measurement-design/recora_measurement_topic_compiler_v3_ja.md": "scripts/.topic-child-b-docs.gz.b64",
}


def decode_payload(payload_paths: PayloadPath) -> str:
    paths = (payload_paths,) if isinstance(payload_paths, str) else payload_paths
    encoded = "".join(
        "".join((ROOT / path).read_text(encoding="utf-8").split())
        for path in paths
    )
    try:
        return gzip.decompress(base64.b64decode(encoded, validate=True)).decode("utf-8")
    except Exception as error:
        raise RuntimeError(f"invalid payload {paths}: {error}") from error


for destination, payload_paths in PAYLOADS.items():
    print("Decoding", payload_paths, "->", destination)
    target = ROOT / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        decode_payload(payload_paths).rstrip() + "\n",
        encoding="utf-8",
        newline="\n",
    )

contract_path = ROOT / "lib/recora/measurement-topic-contract.ts"
contract = contract_path.read_text(encoding="utf-8")
if MARKER in contract:
    contract = contract[: contract.index(MARKER)].rstrip()
print("Decoding scripts/.topic-child-b-contract-append.gz.b64 -> contract appendix")
appendix = decode_payload(
    "scripts/.topic-child-b-contract-append.gz.b64"
).strip()
contract_path.write_text(
    contract.rstrip() + "\n\n" + appendix + "\n",
    encoding="utf-8",
    newline="\n",
)

print("Topic Child B files materialized")
