# Issue #102 Stage 1: data, tenant security, and privacy foundation

## Metadata

- Issue: [#102](https://github.com/sushikikun/RECORA/issues/102)
- OWNER approval:
  [comment 5116752218](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5116752218)
- Risk: `R3`
- Execution: `Local Codex`
- Spec level: `Full`
- Approval: `Plan`
- Priority: `P0`
- Area: `Infrastructure`
- Ready: `Stage 1 only`
- Status: `Stage 1 complete; Human review required`
- Base: `master` at `4fcd505`
- Branch: `codex/issue-102-stage1-data-tenant-security-plan`
- Authoritative design:
  [`docs/recora-data-tenant-security-privacy.md`](../../recora-data-tenant-security-privacy.md)

## Objective

Audit the current `master` data, tenant, authorization, measurement, publication,
privacy, audit, retention, and deletion boundaries, then produce an implementation-ready
foundation and child-issue sequence. Stop before Stage 2 code, schema, database,
external provider, or privileged operations.

## Context

Recora already has Phase 1 tenant/RLS, measurement, admin-read, and dashboard structures,
but the post-launch architecture requires stronger invariants:

- customers read the current immutable publication, not the latest/raw measurement
- contract and entitlement changes do not rewrite historical meaning
- tenant isolation is enforced in keys, policies, routes, jobs, and tests
- measurement is provider-neutral, queued, idempotent, privacy-minimized, and traceable
- suspension, retention, deletion, and privileged actions are formal and auditable

This Stage 1 plan turns those requirements into an evidence-based contract. It does not
implement them.

## Source documents and evidence

Read before work:

- `docs/recora-agentic-sdlc.md`
- `docs/README.md`
- `docs/recora-dev-workflow.md`
- `.agents/skills/RECORA-SKILL-STACK.md`
- `docs/recora-post-launch-operations-architecture.md`
- `docs/exec-plans/templates/exec-plan-template.md`
- Issue #102 and OWNER comment 5116752218

Repository areas inspected read-only:

- `supabase/config.toml`, `supabase/seed.sql`, and all current migrations
- `app/api/recora/**`, customer dashboard/report routes, Auth actions, and internal routes
- `lib/supabase/**`, `lib/recora/db/**`, auth/access, setup, entitlement-read, and
  readiness modules
- measurement, aggregation, recommendation, report-cycle, backfill, and verification
  scripts
- package scripts and CI workflow
- related current design/audit documents
- open PRs relevant to fresh replay and customer report structure

No `.env`/secret was read or displayed. No DB connection, database write, migration,
local reset, external API call, or production operation was performed.

## Scope

### In scope

- repository-based current-state inventory
- reusable/fix/deprecate/missing classification
- formal tenant, entitlement, design, evidence, publication, admin, privacy, lifecycle,
  migration, rollback, and test contracts
- child-issue decomposition with dependencies, acceptance criteria, validation, and
  Stage 2 boundaries
- the two approved documentation files and this docs navigation update
- explicit commit, push, Draft PR, Project transition, and Issue completion report

### Out of scope

- schema, migration, RLS, grant, function, view, or generated type changes
- application, API, Auth, dashboard, admin, measurement, or worker implementation
- Supabase local/live inspection or writes
- provider execution or environment/secret inspection
- package or lockfile changes
- repo settings, ready PR, merge, deployment, Issue close, or branch/worktree deletion

## Start gate evidence

- OWNER comment author association: `OWNER`
- OWNER explicitly marked only Stage 1 Ready and authorized read-only audit, the three
  approved docs, validation, explicit staging/commit/push, Draft PR, and Project
  transitions.
- `git fetch origin` completed before editing.
- Repository root:
  `C:/Users/nakan/.codex/worktrees/0492/recora-main`
- Git common dir: `C:/Users/nakan/work/recora-main/.git` (not OneDrive)
- Initial state: detached `HEAD`, clean, `HEAD == origin/master == 4fcd505`
- Dedicated task branch created before editing:
  `codex/issue-102-stage1-data-tenant-security-plan`
- Project fields set and verified before execution:
  `In Progress / R3 / Local Codex / Full / Plan / P0 / Infrastructure`

## Current-state audit summary

### Reusable

- organization/member/project tenant root and basic RLS helper design
- RLS enabled, browser writes revoked, and private admin schema
- server-only service-role client and two narrow read-only admin RPCs
- setup-draft TypeScript validation/generation safety
- prompt/model/raw-response/citation evidence skeleton
- batch-item idempotency key and operation-event skeleton
- explicit prompt-scope and valid-observation helpers

### Must fix

- master fresh migration replay stops on a required fixed demo project
- tenant-foundation migration maps all unassigned projects to anonymous demo ownership
- core evidence foreign keys permit cross-project combinations for privileged writers
- accepted membership is not required
- customer Auth cookie is not propagated into dashboard queries, while signup creates no
  membership
- customer routes read latest aggregate/raw measurement instead of a current
  publication
- measurement execution does not enforce actor, tenant lifecycle, contract, entitlement,
  budget, or immutable design
- retry/idempotency/provider failure states and provider-neutral workers are missing
- aggregation updates prior metric snapshots in place
- plan/entitlement is a mutable JSON/live-join model
- production operator auth, write authorization, and append-only audit are missing
- retention/deletion and executable cross-tenant DB tests are absent

### Deprecate after verified cutover

- raw public measurement as the customer data surface
- anonymous demo access to the raw hierarchy
- latest-aggregate/one-observation/OpenAI-only customer readiness
- metadata-only publication state
- fixed demo data in schema migration
- local all-role admin and direct measurement orchestration as production patterns

### Missing

- immutable plan/entitlement, setup/design, derived result, and publication versions
- current publication pointer and customer-safe API read model
- provider-neutral queue/attempt/adapter/payload contract
- lifecycle/retention/deletion manifest and proof
- production operator identity and transaction-coupled audit
- fresh replay, RLS, API, history, privacy, and rollback suites

Detailed evidence and target decisions are recorded in the authoritative design.

## Risk analysis

### Highest risks

1. A legacy real project could be mapped to an anonymously readable demo tenant during
   migration. Live applicability is unknown and must be inspected before any migration.
2. Independent foreign keys allow a privileged writer or future worker to create
   cross-project evidence that RLS checks through only one ownership chain.
3. Customer Auth and DB reads are disconnected; a real customer path is non-functional,
   and raw demo data remains the main anonymous surface.
4. Contract changes can alter live entitlement meaning without preserving the conditions
   used by prior setup or measurement.
5. Provider failures can become absence evidence, duplicate calls can incur repeated
   cost, and recalculation can mutate historical aggregates.
6. There is no canonical immutable publication/current pointer or retention/deletion
   workflow.

### Static security candidates requiring later validation

- DNS validation and fetch perform separate resolution in `site-inspect`; DNS rebinding
  remains a hypothesis, not a confirmed exploit.
- Runtime JWT/RLS behavior and live grants/policies may differ from repository
  migrations.
- No Stage 1 finding asserts an exploited production system.

## Execution plan and progress

### Milestone 1 — Start gate and baseline

- [x] Read Issue #102 and OWNER comment 5116752218.
- [x] Confirm `R3 / Local Codex / Full / Plan / Stage 1 Ready`.
- [x] Read mandatory lifecycle, workflow, post-launch, skill-stack, and plan sources.
- [x] Fetch origin and verify clean `HEAD == origin/master`.
- [x] Verify git-common-dir is outside OneDrive.
- [x] Create a dedicated task branch.
- [x] Add Issue #102 to the project and set/verify approved fields.

### Milestone 2 — Read-only inventory and threat review

- [x] Audit migrations, tenant keys, RLS, grants, functions, RPCs, seed, and replay.
- [x] Audit customer/Auth/API/admin/service-role boundaries.
- [x] Audit contracts, plans, entitlements, setup drafts, publication, and audit.
- [x] Audit measurement, provider payloads, parsing, aggregation, retry, and privacy.
- [x] Audit test coverage, CI, fresh replay, backfill, and rollback.
- [x] Classify reusable, fix, deprecate, and missing structures.
- [x] Record confirmed findings separately from runtime hypotheses.

### Milestone 3 — Formal design

- [x] Define organization-root tenant and membership contract.
- [x] Define contract → plan policy → entitlement snapshot → design lineage.
- [x] Define historical evidence, derived result, and publication immutability.
- [x] Define customer/admin/worker/service-role separation.
- [x] Define external AI payload allowlist/denylist and provider adapter tests.
- [x] Define lifecycle, retention, restoration, deletion, and audit.
- [x] Define cross-tenant/RLS/API test matrix.
- [x] Define additive migration, backfill, compatibility, and rollback.
- [x] Split Stage 2 into dependency-ordered child scopes.
- [x] Record exact Stage 2 entry and stop conditions.

### Milestone 4 — Stage 1 validation and handoff

- [x] Run `npm run recora:preflight:full` with existing fnm Node/npm.
- [x] Run `git diff --check`.
- [x] Record docs-only lint/build omission reason.
- [x] Run `npm run recora:commit-check` before commit.
- [x] Inspect exact changed and staged file lists and staged whitespace check.
- [x] Commit only approved documentation files.
- [x] Push the task branch and open a Draft PR to `master`.
- [x] Transition Project Status to `Human review` and keep Approval `Plan`.
- [ ] Post the completion report directly to Issue #102.
- [ ] Stop without Stage 2, ready PR, merge, deploy, close, or cleanup.

## Target child issues

Planning labels and dependency order:

1. `102-A` fresh replay baseline and #81-equivalent decision
2. `102-B` tenant ownership, accepted membership, and composite integrity
3. `102-C` RLS/grants/customer Auth/API isolation and executable A/B tests
4. `102-D` plan-policy and immutable entitlement snapshots
5. `102-E` durable setup draft and immutable measurement design
6. `102-F` provider-neutral queue, idempotency, retry, budget, and payload privacy
7. `102-G` immutable parsing/aggregation/metrics and completeness gates
8. `102-H` immutable publication/current pointer and customer read cutover
9. `102-I` production operator auth and transaction-coupled audit
10. `102-J` lifecycle, retention, restoration, and deletion
11. `102-K` integration, fresh replay CI, cutover observation, and legacy retirement

Acceptance criteria, dependencies, and Stage 2 approvals for each are defined in
[`docs/recora-data-tenant-security-privacy.md`](../../recora-data-tenant-security-privacy.md#14-stage-2-child-issue-split).
Child Issues are not created by Stage 1.

## Migration and rollback strategy

The first implementation dependency is deterministic fresh replay. Current `master`
stops at `20260701073553_recora_internal_demo_subscription.sql` when the fixed project
does not exist. Draft PR #81 is relevant but unmerged; Stage 2 must explicitly decide
whether to merge, replace, or supersede it.

All subsequent work is additive:

1. inventory live state under separately approved read-only access
2. add new roots/versions/keys/indexes
3. backfill in bounded, idempotent chunks
4. validate tenant/orphan/null/duplicate counts and constraints
5. shadow new immutable writes and publication reads
6. switch the customer pointer only after isolation and completeness gates pass
7. retire compatibility paths later

Emergency rollback disables new writers/claims or returns to the still-supported legacy
read path. It does not drop additive schema or mutate historical entitlement, evidence,
derived results, publications, or audit.

## Validation plan

Stage 1 required:

```powershell
fnm use 24.18.0
npm run recora:preflight:full
git diff --check
npm run recora:commit-check
git diff --name-only
git status --short --untracked-files=all
git diff --cached --name-only
git diff --cached --check
```

`npm run lint` and `npm run build` may be skipped because Stage 1 changes only Markdown
architecture and plan documents and does not affect runtime, dashboard, report, API,
dependencies, generated code, or deployment behavior. CI will still run its configured
checks on the Draft PR.

Stage 2 validation is child-specific and requires separate approval. It includes fresh
Supabase replay, real role/JWT RLS tests, API/route isolation, entitlement history,
provider adapter/idempotency/privacy, publication pointer, lifecycle/deletion, and
backfill/rollback suites.

## Decision log

| Date | Decision |
|---|---|
| 2026-07-29 | Treat organization as the tenant root and require direct or composite-enforced ownership throughout the hierarchy. |
| 2026-07-29 | Keep customer publication, raw measurement, control, and audit as separate data surfaces. |
| 2026-07-29 | Use immutable plan/entitlement/design/evidence/derived/publication lineage; never reinterpret history through a live plan join. |
| 2026-07-29 | Preserve Phase 1 paths only as compatibility paths until verified cutover. |
| 2026-07-29 | Treat runtime-only security hypotheses as candidates requiring separately approved validation. |
| 2026-07-29 | Split implementation into R3 child scopes; this Stage 1 does not grant Execute approval. |

## Results and residual risk

Stage 1 produced the implementation contract and dependency-ordered plan. It did not
change product code or database state.

Residual/unverified items:

- live schema/data/grant/policy drift and actual project organization mapping
- real JWT/session RLS behavior
- fresh replay after an approved #81-equivalent fix
- production Auth/operator design
- runtime provider/idempotency/privacy behavior
- legal/contractual retention defaults
- DNS-rebinding validation for `site-inspect`

These are explicit Stage 2 inputs. They do not authorize implementation.
