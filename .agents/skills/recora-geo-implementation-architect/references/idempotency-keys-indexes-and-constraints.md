# Idempotency Keys Indexes And Constraints

## CONFIRMED_FROM_FILES

- `run_items` has a unique measurement constraint across run, prompt, persona, and model.
- `ai_conversations` has a unique conversation per run item.
- `source_domains` has a unique project/domain constraint.
- `brand_mentions` has a unique conversation/brand constraint.
- `metric_snapshots` has a unique scope index.
- `ai_conversations` has a partial unique index on provider and response ID.
- Candidate generator builds candidate IDs from the measurement run ID prefix and candidate type.
- Candidate generator writes output files and marks DB write status as `not_written`.

## USER_PROVIDED_CONTEXT

- v0.4 should address duplicate candidate regeneration requiring idempotency keys.

## NEEDS_VERIFICATION

- No confirmed DB-level idempotency key exists for candidate generation.
- No confirmed idempotency key exists for gate reviews, source-to-claim reviews, or remeasurement tasks.
- Candidate ID stability is not enough to prove safe replay because truncated run ID plus type can collide across scopes or versions.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Define candidate generation idempotency as a hash over project, source run, aggregate run, candidate type, evidence scope, prompt set, search mode set, generator version, parser version, and schema version.
- Add unique constraints or partial unique indexes on active candidate identities.
- Keep superseded candidates instead of destructive replacement.
- Store content hashes for review input payloads so repeated generation can be detected.
- Add validation queries that compare before/after counts and duplicate key candidates during migration rollout.

## DO_NOT_ASSUME

- Do not assume file output path uniqueness prevents DB duplicates.
- Do not assume provider response ID uniqueness covers candidate or gate idempotency.
- Do not assume candidate ID prefixing is safe across future generator versions.
