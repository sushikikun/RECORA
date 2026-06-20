# Idempotency And Regeneration Risk Register

## CONFIRMED_FROM_FILES

- `buildCandidateId()` returns `rec-${measurementRunId.slice(0, 8)}-${type.replace(/_/g, "-")}`.
- Candidate generation caps at `MAX_CANDIDATES = 3`.
- The generator writes both latest output files and run-specific output files.
- The payload stores `generated_at`.
- The payload stores `db_write_check` before/after counts.
- No `schema_version`, `generator_version`, or `idempotency_key` was observed in the candidate JSON.

## USER_PROVIDED_CONTEXT

- The v0.3 patch should focus on regeneration/idempotency and duplicate candidate generation risk.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Whether generated candidates are later inserted into a database remains NEEDS_VERIFICATION.
- Whether repeated generation can overwrite or duplicate downstream recommendations remains NEEDS_VERIFICATION.
- Whether a queue/job system exists for this generation remains NEEDS_VERIFICATION.

## Risk Register

| Risk | Severity | Confirmed basis | Recommended review action |
|---|---|---|---|
| Candidate ID omits schema/generator version | P1 | ID based on run ID prefix and type | Add versioned idempotency key or separate stable identity and generation ID |
| Run ID prefix may be insufficient globally | P2/P1 | Uses first 8 characters | Include full run ID or project/run/type hash |
| Latest output files can be overwritten | P2/P1 | Writes non-run-specific JSON and MD | Treat latest files as views; preserve run-specific immutable artifacts |
| Regeneration history not explicit | P1 | No generation run object observed | Add candidate generation run record |
| Unsafe candidates lack draft-time rejection records | P1 | Current output has only normal candidates | Add rejection output path with reason |

## RECOMMENDED_ARCHITECTURE

- Separate:
  - `candidate_stable_key`
  - `candidate_generation_id`
  - `candidate_schema_version`
  - `generator_version`
  - `source_measurement_run_id`
- Add idempotency keys for:
  - measurement run candidate generation
  - candidate per type/evidence set
  - citation/source-to-claim review
  - quality-gate review
- Preserve generation history and supersession reason.

## DO_NOT_ASSUME

- Do not assume repeated file generation is safe for database persistence.
- Do not assume a same ID means same evidence if generator logic changes.
