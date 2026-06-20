# DB Fixture And Validation Plan

## CONFIRMED_FROM_FILES

- Snapshot includes `supabase/seed.sql`; it was not treated as schema authority.
- Candidate output has 10 prompts, 20 observations, 3 candidates, 26 citations for the citation candidate, and DB write status `not_written`.
- Generator reads tables related to measurement runs, run items, conversations, brand mentions, citations, source domains, and recommendations.

## USER_PROVIDED_CONTEXT

- v0.4 evals should cover missing migrations/types, concept mapping, gate/source-to-claim persistence, version fields, RLS context, idempotency, provider status, migration safety, and refusal boundaries.

## NEEDS_VERIFICATION

- There are no test files in the snapshot.
- There is no generated DB type fixture.
- Runtime query validation cannot be performed because database commands are out of scope.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

Fixture set for future implementation:

- Migration inventory fixture: snapshot with migrations present and generated types absent.
- RLS absence fixture: schema with public tables and no policy statements.
- Candidate output fixture: candidate JSON lacking version fields.
- Citation review fixture: citation rows with unknown claim support.
- Gate confusion fixture: display state present but gate decision absent.
- Idempotency fixture: two generator runs with same run ID/type and changed evidence hash.
- Provider state fixture: completed run item with partial or error citation status.
- Seed risk fixture: prompt echo or seed echo matched as brand mention.
- Backfill fixture: existing recommendations without candidate/gate lineage.
- Tenant fixture: project-scoped rows requiring policy predicates.

Validation checks:

- JSON contract parse.
- Migration/static SQL scan for table, index, policy, and enum presence.
- Candidate payload version checks.
- Concept map coverage checks.
- No migration execution, no database writes, and no external service calls.

## DO_NOT_ASSUME

- Do not treat local seed success as production migration safety.
- Do not require live database access to perform review-mode static validation.
- Do not create executable fixture scripts in this patch.
