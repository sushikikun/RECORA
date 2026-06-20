# Backfill And Migration Safety Plan

## CONFIRMED_FROM_FILES

- Current migrations are additive for AI output fields and metric metadata after the base schema.
- Current generator records DB write status as `not_written` in candidate output.
- Existing `recommendations` count remains unchanged in inspected output.
- Existing schema includes JSON metadata on `recommendations`, `measurement_runs`, and `metric_snapshots`.

## USER_PROVIDED_CONTEXT

- Migration proposals should require backfill, rollback, validation queries, and shadow mode.
- The implementation architect must refuse to edit migrations in review mode.

## NEEDS_VERIFICATION

- Actual data volume, production migration tooling, backup policy, and rollback mechanism are unknown.
- Existing application reads for `recommendations` are not inspected in this snapshot.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Phase 1: add new tables and nullable links without changing existing reads.
- Phase 2: backfill from candidate JSON or existing recommendations only after field mapping is reviewed.
- Phase 3: run validation queries for row counts, orphaned references, duplicate idempotency keys, null version fields, and unsupported source-to-claim states.
- Phase 4: shadow-write candidate/gate/source-to-claim objects while preserving old outputs.
- Phase 5: compare old and new outputs before cutover.
- Phase 6: enable policy-protected reads only after policy tests pass.
- Rollback plan: keep old read path available, disable new writes, preserve backfilled rows for audit, and avoid destructive down migration for evidence tables.

## DO_NOT_ASSUME

- Do not backfill claim support from URL presence.
- Do not backfill quality-gate approval from display state.
- Do not backfill tenant/project access policy from application filters alone.
- Do not run migration commands as part of review-mode patching.
