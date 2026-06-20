# Migration And RLS Risk Register

## CONFIRMED_FROM_FILES

- Migration 0001 creates initial public tables, constraints, triggers, and indexes.
- Migration 0002 adds AI provider/output, extraction, citation, and index fields.
- Migration 0003 adds metadata JSON objects to `measurement_runs` and `metric_snapshots`.
- Inspected migrations do not enable RLS and do not define policies.
- Indexes exist for common project/run/prompt/brand/citation/recommendation lookups.
- Unique constraints exist for selected identities such as one primary brand per project, project-domain pairs, run item measurement identity, conversation per run item, source domain per project/domain, brand mention per conversation/brand, and metric snapshot scope.

## USER_PROVIDED_CONTEXT

- The implementation architect must not infer RLS safety without policy inspection.
- The implementation architect must not edit migrations in review mode.

## NEEDS_VERIFICATION

- Whether these migrations have been applied to any live database is unknown.
- Whether RLS is enabled outside these migrations is unknown.
- Whether application code uses service-role access, server-only access, or client Supabase access is not proven by this snapshot.
- Whether indexes cover candidate regeneration, source-to-claim review, quality-gate review, and provider attempt querying is unverified because those tables are absent.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Add migration proposals in additive phases: new tables, backfill, dual-write or shadow-read, validation queries, policy enablement, and cutover.
- Require tenant/project predicates for every user-exposed table.
- Add project-aware foreign keys or denormalized `project_id` where policy joins would be too fragile or expensive.
- Add partial unique indexes for idempotent candidate generation and provider response dedupe.
- Add review/audit tables with immutable reviewer, version, decision, and evidence-reference fields.

## DO_NOT_ASSUME

- Do not expose public tables through a client API before policy evidence exists.
- Do not rely on JSON metadata for authorization.
- Do not treat existing lookup indexes as sufficient for missing candidate/gate/review tables.
- Do not run migrations or database commands as part of this patch.
