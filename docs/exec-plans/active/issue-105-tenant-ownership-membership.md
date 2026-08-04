# Exec Plan: Issue #105 tenant ownership and accepted membership

This is the living execution record for Issue #105 / 102-3B. The Issue body is the
OWNER's R3 Execute approval; this plan does not expand that approval.

## Metadata

| Field | Value |
|---|---|
| Issue | [#105](https://github.com/sushikikun/RECORA/issues/105) |
| Parent | [#102](https://github.com/sushikikun/RECORA/issues/102) |
| Risk | `R3` |
| Spec level | `Full` |
| Execution | `Local Codex` |
| Approval | `Execute` recorded in the Issue #105 body |
| Owner | `sushikikun` |
| Status | `Active` |
| Updated | `2026-07-29` |

## Objective / expected outcome

Deliver the additive 102-3B foundation that keeps `organizations.id` as the tenant
identifier, preserves explicit `projects.organization_id` ownership without guessing a
demo tenant, and authorizes a customer only through an authenticated `user_id` with an
accepted active membership. Invalid, suspended, revoked, anonymous, missing, and
ambiguous implicit tenant contexts fail closed. The result supplies stable predicates,
candidate-key evidence, and local fixtures to 102-3C without implementing 102-3C RLS,
grant, or composite-child-FK scope.

## Context and confirmed inventory

Authority order:

1. Parent Issue #102 confirmed principles
2. `docs/recora-data-tenant-security-privacy.md`
3. `docs/exec-plans/active/issue-102-data-tenant-security-privacy.md`
4. Issue #105 R3 Execute scope
5. current `master` implementation facts

Start state:

- official-repository worktree:
  `C:/tmp/recora-issue-105-tenant-ownership-membership`
- git common directory: `C:/Users/nakan/work/recora-main/.git` (outside OneDrive)
- branch: `codex/issue-105-tenant-ownership-membership`
- `HEAD == origin/master == 5df688a`
- working tree and staged state were clean
- dependency #80 / 102-3A is complete at
  `5df688ac5dc76f30e73baef504ad06e46ec7d68d`
- Supabase CLI `2.106.0`, config project ID `recora`, linked-project marker absent,
  and local Postgres container `supabase_db_recora` were confirmed without displaying
  credentials

Confirmed schema and migration facts:

- `organizations.id` is the existing tenant root.
- `projects.organization_id` is `NOT NULL`, references `organizations(id)` with
  `ON DELETE RESTRICT`, and has the candidate key
  `projects_id_organization_id_unique (id, organization_id)`.
- the historical tenant-foundation migration assigned then-null projects to
  `recora-internal-demo`; this child does not rewrite that historical migration or
  repeat that inference.
- local seed inserts the demo organization and project with an explicit
  `organization_id`.
- `organization_members` has `invited_at` and `accepted_at`, but no suspension or
  revocation state.
- `recora_private.is_organization_member(uuid)` currently checks only `auth.uid()` and
  `user_id`; it does not require `accepted_at`.
- the predicate is a `SECURITY DEFINER` function in the non-exposed
  `recora_private` schema with fixed empty `search_path`; existing RLS helpers consume
  it.
- local read-only inventory before implementation found one organization, one project,
  zero memberships, and zero project/membership nulls, orphans, or duplicates.

## Scope / non-goals

### In scope

- one new additive migration under `supabase/migrations/**`
- a minimal membership lifecycle state for `invited`, `active`, `suspended`, and
  `revoked`
- deterministic existing-membership backfill based only on recorded `accepted_at`
- fail-closed pre-write inventory for null/orphan/duplicate or contradictory rows
- accepted-active membership and unambiguous implicit-tenant predicates in
  `recora_private`
- preservation/verification of the project `(id, organization_id)` candidate key
- one local-only Docker/Postgres transaction verification script
- one npm script entry
- the directly affected database row type
- this child plan and the parent plan's 102-3B progress record

### Non-goals

- project ownership remapping or production data repair
- 102-3C composite child FKs, broad RLS/grant changes, or route separation
- signup, invitation delivery/acceptance UI, onboarding, contract/entitlement work
- measurement, queue, worker, dashboard, admin, retention, or external-AI work
- production, remote, linked, or non-local database access
- `supabase db push`, deploy, merge, Ready conversion, or Issue close

## Membership state and effective predicate

Add `public.recora_organization_membership_status` with:

- `invited`: not accepted; never effective
- `active`: authenticated `user_id` and `accepted_at` are both present; effective
- `suspended`: previously accepted but currently ineffective
- `revoked`: ineffective, whether revoked before or after acceptance

Add `organization_members.membership_status` with a default of `invited`. Existing rows
are mapped deterministically: `accepted_at IS NOT NULL` becomes `active`, otherwise
`invited`. Constraints reject `accepted_at` without `user_id`, reject `active` or
`suspended` without both authenticated identity and acceptance, and reject `invited`
with an acceptance timestamp.

`recora_private.is_organization_member(target_organization_id)` returns true only when
the current authenticated `auth.uid()` has a row for that organization with
`membership_status = 'active'` and `accepted_at IS NOT NULL`.

`recora_private.resolve_unambiguous_organization_id()` returns an organization only
when the authenticated actor has exactly one effective membership. Zero or multiple
effective memberships return `NULL`; explicit organization checks remain available for
legitimate multi-tenant users.

## Existing-data inventory and fail-closed rules

Before the migration writes schema or data, it checks:

- project `organization_id` nulls and orphan organizations
- duplicate `(project.id, organization_id)` candidate keys
- membership organization nulls/orphans
- duplicate `(organization_id, user_id)` rows
- accepted membership rows without an authenticated `user_id`

Any failure raises a specific exception before DDL/backfill. The migration only reports
the count of demo-owned projects as review candidates; it does not classify or remap
them. No project is assigned to the demo organization, and no production mapping is
inferred.

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Gate and inventory | `Completed` | Read Issue/source documents, confirm clean latest worktree, inspect migrations/schema/helper/seed and local count inventory | Approved scope and confirmed facts recorded |
| M2: Additive migration | `Completed` | Create migration with CLI, pre-write inventory, membership state/constraints/backfill, candidate-key guard, and least-privilege predicates | Migration is additive, rerunnable, and contains no ownership remap |
| M3: Local fixture | `Completed` | Add local-only transaction verification and npm entry; cover A/B ownership and membership states | All twelve Issue fixture outcomes pass without leftovers |
| M4: Fresh replay and repository validation | `Completed` | Run migration-only/seeded resets, 102-3A regression, migration list, advisors, preflight, typecheck, lint, build, diff, commit check | Required local and repository validations pass; commit gate is completed during explicit staging |
| M5: Draft PR handoff | `In progress` | Update plans, explicit stage, commit, normal push, create new Draft PR, report to Issues #105/#102 | Draft PR remains Draft; no merge/Ready/Issue close |

## Local test fixture

The verification uses only `supabase_db_recora` and transaction rollback:

1. create organizations A and B
2. create project A explicitly under organization A
3. reject a project with missing ownership and prove no demo reassignment
4. accepted-active member A is true for A
5. invited/unaccepted member is false
6. suspended and revoked members are false
7. member A is false for organization B
8. anonymous actor is false
9. no effective membership and multiple effective memberships make implicit tenant
   resolution return `NULL`
10. reapply the migration twice without duplicate objects or semantic changes
11. verify seed's demo organization/project relation is explicit after seeded replay
12. rerun the 102-3A bootstrap regression after migration-only and seeded replay

Fixtures use fixed non-secret UUIDs, insert only local fictional rows, and roll back.
The script never discovers or accepts a database URL and never connects to
`supabase_analytics_recora`.

## Validation plan

| Validation | Expected result | Actual result / evidence |
|---|---|---|
| `npm run recora:issue-105-tenant-membership:check` after no-seed reset | all tenant/membership cases pass | Passed: all cases returned `status: ok` |
| `supabase db reset --local --no-seed` | all migrations replay | Passed with migration `20260729151417` applied |
| dedicated check in migration-only state | pass | Passed |
| `supabase db reset --local` | migrations and seed replay | Passed |
| dedicated check in seeded state | pass | Passed |
| `supabase migration list --local` | new migration listed locally | Passed: `20260729151417` listed locally |
| `supabase db advisors --local` | no local security/performance issue | Passed: `No issues found` |
| `npm run recora:issue-80-local-supabase-bootstrap:check` | 102-3A remains green | Passed after both migration-only and seeded replay |
| `npm run recora:preflight:full` | pass, FAIL 0 | Passed, `FAIL: 0` |
| `npm run typecheck` | pass | Passed |
| `npm run lint` | pass without errors | Passed with no warnings or errors |
| `npm run build` | pass | Passed; existing `metadataBase` warning only |
| `git diff --check` | pass | Passed |
| `npm run recora:commit-check` | preflight passes; migration requires explicit approval | Preflight and all other checks passed; the expected migration-only gate emitted `FAIL: 1`. Issue #105's R3 Execute body explicitly authorizes this migration, commit, push, and Draft PR, so the manual commit path is approved and recorded. |
| changed/staged scope and secret scan | approved files only; no secret/env/DB URL | Passed: exactly six approved files; zero sensitive-pattern matches |
| `package-lock.json` comparison | unchanged | Passed: no diff |

## Backfill, compatibility, and rollback

Backfill changes only `organization_members.membership_status` and derives it from
`accepted_at`; it never changes `organization_id`, `project_id`, `user_id`, email, or
role. Existing RLS policies continue to call the same `is_organization_member(uuid)`
signature, so their effective access becomes fail-closed without a broad RLS rewrite.

Rollback is roll-forward and additive:

- before merge or remote application, revert this task commit and repeat local replay
- after any separately approved future application, do not drop the enum/column or
  rewrite membership evidence as an emergency action
- replace the predicate through a new reviewed migration only after impact inventory
- preserve membership status and acceptance evidence for later audit integration

This task performs no remote application, so no production data rollback is required.

## 102-3C handoff

102-3C receives:

- confirmed `projects (id, organization_id)` candidate key
- effective explicit membership predicate
- fail-closed unambiguous implicit-tenant resolver
- organization A/B, accepted, invited, suspended, revoked, anonymous, and ambiguous
  fixtures
- evidence that unknown ownership is rejected rather than remapped

102-3C remains responsible for composite child FKs, complete RLS `USING`/`WITH CHECK`,
explicit table/sequence grants, customer/operator RPC separation, and URL/list/join/RPC
cross-tenant tests.

## Risk and safety boundaries

- Highest risk: `R3`
- Authorized DB: formally sourced local Supabase only
- Prohibited DBs: linked, remote, production, non-local, and
  `supabase_analytics_recora`
- Secrets: do not display or persist `.env`, URLs, keys, tokens, or credentials
- Git: explicit-path staging only; normal push; new PR must remain Draft
- Stop if the repo/worktree becomes stale or dirty from another owner, migration needs
  an unapproved file, local identity cannot be proven, inventory finds unsafe data,
  required validation fails outside approved scope, or a remote/privileged operation
  becomes necessary

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| 2026-07-29 | M1 | Start gate, source reading, static schema audit, Supabase changelog/docs review, and local read-only count/schema inventory completed | Create the additive migration |
| 2026-07-29 | M2-M3 | Added the additive tenant/membership migration, directly affected type, and local-only rollback fixture; migration reapplication and unsafe-inventory failure both passed | Run fresh replay and repository gates |
| 2026-07-29 | M4 | Both local reset modes, dedicated checks, 102-3A regression, local migration list/advisors, preflight, typecheck, lint, build, and diff check passed | Complete explicit staging, commit gate, Draft PR, and Issue reports |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| 2026-07-29 | Do not add project ownership metadata or remap rows in 102-3B | `organization_id NOT NULL`, FK, and composite candidate key already exist; historical inference cannot be reversed safely without external mapping | Migration verifies invariants and reports demo-owned review candidates only |
| 2026-07-29 | Add one membership status enum/column | Existing timestamps cannot represent suspended or revoked; a single state column is the minimum additive representation | Future writers must transition status and acceptance consistently |
| 2026-07-29 | Backfill accepted rows as active and unaccepted rows as invited | Uses recorded acceptance evidence only and does not infer tenant ownership | Existing accepted membership remains compatible; all other states fail closed |
| 2026-07-29 | Add an unambiguous implicit resolver | Explicit target membership can support legitimate multi-tenant users, while implicit context must reject zero or multiple matches | 102-3C receives a stable fail-closed context primitive |

## Results and remaining risks

### Results

- `organizations.id` remains the tenant identifier and project ownership is neither
  inferred nor remapped.
- membership authorization now requires an authenticated, accepted, active row;
  invited, suspended, revoked, anonymous, cross-tenant, missing, and ambiguous
  contexts fail closed.
- fresh migration-only and seeded replay both pass, including the 102-3A regression.
- all local database fixtures roll back, and the local advisors report no issues.
- repository preflight, typecheck, lint, production build, and diff checks pass.
- no linked, remote, production, non-local, or `supabase_analytics_recora` database was
  connected to or used.
- final explicit staging, commit gate, normal push, Draft PR creation, and Issue
  reporting remain in M5.

### Remaining risks

- historical projects previously assigned to the demo organization cannot be
  distinguished from legitimate demo projects using current columns; this migration
  does not guess or repair them
- production/live tenant inventory is unverified and outside this local-only approval
- signup/invitation/acceptance/suspension/revocation writers do not yet consume the new
  state contract
- full customer/operator RLS and composite child integrity remain 102-3C
