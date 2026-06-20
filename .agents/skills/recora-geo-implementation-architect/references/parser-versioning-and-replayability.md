# Parser Versioning And Replayability

## CONFIRMED_FROM_FILES

- Inspection output contains `extraction_method: "deterministic_text_parser_v0.1"` in suggested brand mention mapping.
- Candidate output search did not find `parser_version`, `extraction_version`, `schema_version`, or `generator_version` fields.
- Raw answers and raw provider responses are persisted by inspected scripts.
- Derived mention/citation rows are inserted from parser output.

## USER_PROVIDED_CONTEXT

- v0.5 should require parser versioning, extraction versioning, replayable extraction jobs, and golden outputs.

## NEEDS_VERIFICATION

- `extraction_method` appears in analysis output, but persisted parser/extraction version fields are not confirmed.
- No replay job table or supersession flow was confirmed.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Persist `parser_version`, `extraction_version`, alias set version, source-domain classifier version, and citation extractor version on derived rows or linked extraction runs.
- Store raw input hashes and output hashes for replay comparison.
- Make parser upgrades create new derived extraction records or supersede old ones without mutating raw evidence.
- Block strict replay claims when version fields are absent.

## DO_NOT_ASSUME

- Do not assume a hard-coded extraction method string is enough for replay.
- Do not assume derived rows can be compared across parser changes without versions.
- Do not assume raw answer preservation alone makes extraction reproducible.
