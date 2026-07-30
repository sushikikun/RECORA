# Issue #102 Stage 1: Phase 3 data, tenant security, and privacy foundation

## Metadata

- Issue: [#102](https://github.com/sushikikun/RECORA/issues/102)
- Initial Stage 1 approval:
  [OWNER comment 5116752218](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5116752218)
- Parallel-development policy:
  [OWNER comment 5117068026](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5117068026)
- Human-review correction:
  [OWNER comment 5117210498](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5117210498)
- Human-review follow-up:
  [OWNER comment 5117655117](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5117655117)
- Risk: `R3`
- Execution: `Local Codex`
- Spec level: `Full`
- Approval: `Plan`
- Priority: `P0`
- Area: `Infrastructure`
- Ready: `Stage 1 document revision only`
- Status: `Stage 1 follow-up revised; Human review required`
- Base: `master` at `4fcd505`
- Branch: `codex/issue-102-stage1-data-tenant-security-plan`
- Draft PR: [#103](https://github.com/sushikikun/RECORA/pull/103)
- Authoritative design:
  [`docs/recora-data-tenant-security-privacy.md`](../../recora-data-tenant-security-privacy.md)

### Authority order

1. Issue #102 confirmed principles
2. OWNER comment 5116752218
3. OWNER comment 5117068026
4. OWNER Human review 5117210498
5. OWNER Human review follow-up 5117655117
6. confirmed `master` implementation facts

Existing architecture documents, PRs, and unmerged branches are reference material.
They do not override this order or automatically contribute unapproved product and
operational decisions.

## Objective

Use the completed read-only audit to produce an implementation-ready plan for Phase 3
only:

- tenant ownership and accepted membership
- composite integrity, RLS, grants, and customer/operator boundary
- common contract/entitlement/history-reference foundation
- operator identity/authorization/audit foundation
- retention/deletion-state foundation
- external-AI payload safety foundation
- fresh replay and security tests

Document interfaces for Phases 4–10 without implementing their product/runtime scope or
creating those features as Issue #102 children. Stop before Stage 2.

## Context

The Stage 1 audit remains accepted. OWNER Human review required correction of its scope:

- Issue/OWNER decisions are above existing architecture references.
- Issue #102 is the parent for Phase 3, not Phases 4–10.
- later-phase implementation is separated from Phase 3 child work
- customer reflection remains `反映 / 保留`
- mandatory human `approved` is not assumed
- PR #71's entire customer-screen information structure remains supported, including
  customer-safe AI answer/detail content
- Phases 4–10 may start in parallel behind interfaces, adapters, fixtures, and mocks
- Phase 10 is the LP/public-site phase, not a final-integration phase
- PR #71's unmerged implementation values remain revisable, while its OWNER-adopted
  customer-screen information structure is a formal product criterion

The current revision changes only the three OWNER-approved documents. It does not alter
the accepted audit evidence or product/database state.

## Sources and evidence

Required task sources:

- Issue #102
- OWNER comments 5116752218, 5117068026, 5117210498, and 5117655117
- `docs/recora-agentic-sdlc.md`
- `docs/README.md`
- `docs/recora-dev-workflow.md`
- `.agents/skills/RECORA-SKILL-STACK.md`
- `docs/exec-plans/templates/exec-plan-template.md`

Reference-only sources:

- `docs/recora-post-launch-operations-architecture.md`
- PR #71 unmerged code implementation, design values, and mock values
- PR #81 fresh-replay proposal
- other current or historical audit/design documents and unmerged branches

OWNER-adopted product criterion:

- PR #71 customer-screen information structure: 10 primary screens and their major
  detail views

Confirmed repository evidence remains based on `master` at `4fcd505`. No `.env` or
secret was read or displayed. No DB connection, write, migration, reset, provider call,
or production action was performed.

## Scope

### Phase 3 direct scope

- organization-root tenant ownership and existing-data mapping
- accepted membership, tenant-access, and object/action authorization primitives
- composite tenant keys/FKs and cross-tenant rejection
- RLS, grants, safe functions/views/RPCs, and customer/operator access boundary
- versioned plan policy, immutable resolved entitlement snapshot, and resolver
- immutable reference contract for historical measurement designs and results
- operator identity, permission, and append-only audit primitives
- configurable retention/deletion state, manifest, outcome, and audit primitives
- typed external-AI allowlist/denylist validator and privacy fixtures
- fresh replay, generated type/schema drift, RLS/grant, cross-tenant, permission,
  history, lifecycle-state, audit, and payload security tests
- additive migration/backfill/rollback plan for the above

### Dependency contracts only

- Phase 4 contract source → entitlement-resolver input
- Phase 5 member/project/entitlement/payload interfaces and historical-design reference
- Phase 6 tenant/entitlement/payload interfaces
- Phase 7 immutable-history and customer-safe `反映 / 保留` classification boundary
- Phase 8 customer identity/project authorization and safe DTO boundary
- Phase 9 operator identity/permission/audit command boundary
- Phase 10 public-entry tenant/classification boundary where an LP/public-site flow
  enters customer context

### Outside Issue #102 implementation

- Phase 4 contract/account/billing lifecycle business processing
- Phase 5 onboarding, setup draft, question finalization, and measurement-design
  integration
- Phase 6 queue, worker, provider call, retry, budget, and provider adapters
- Phase 7 analysis, quality rules, detailed internal states, `反映 / 保留`, customer-safe
  answer/citation read model, prompt eligibility, and completeness rules
- Phase 8 customer dashboard real-data connection
- Phase 9 admin screen
- Phase 10 LP/public site: LP, service/feature introductions, pricing, FAQ, contact,
  legal pages, and service-start entry paths

Those phases use separate Issues, worktrees, branches, and Draft PRs. Their interface,
adapter, fixture, and mock work may begin before Issue #102 completes. Real integration,
Ready conversion, and merge stop at the relevant upstream contract gate. Phase 10 may
build public content in parallel, but real pricing/contract/registration paths depend on
Phase 4 and alignment with actual customer screens/content depends on Phase 8.
Cross-phase integration and release verification is a shared gate, not Phase 10 scope.

### Current Stage 1 revision scope

- `docs/recora-data-tenant-security-privacy.md`
- `docs/exec-plans/active/issue-102-data-tenant-security-privacy.md`
- `docs/README.md`
- exact validation, explicit staging, commit, push, Draft PR #103 update, and Project
  verification or unverified-status report, followed by an Issue completion report

No implementation, schema, RLS, API, Auth, DB write, Stage 2 Execute, ready PR, merge,
deploy, Issue close, or branch/worktree deletion is authorized.

## Start gate evidence

- review comment 5117655117 is the latest OWNER instruction
- current worktree:
  `C:/Users/nakan/.codex/worktrees/0492/recora-main`
- git-common-dir:
  `C:/Users/nakan/work/recora-main/.git` (not OneDrive)
- branch:
  `codex/issue-102-stage1-data-tenant-security-plan`
- revision start:
  `HEAD == origin/task branch == 1b383b4`
- base:
  `origin/master == 4fcd505`
- initial revision working tree: clean
- PR #103: open Draft targeting `master`
- Project target after handoff: `Human review / Approval Plan`

## Accepted audit summary

### Phase 3 findings

- fresh migration replay stops on a required fixed demo project
- tenant-foundation migration maps unassigned projects to anonymous demo ownership
- independent evidence FKs permit privileged cross-project combinations
- accepted membership is not required
- customer session is not propagated into dashboard DB queries
- mutable plan JSON/live join does not preserve historical entitlement meaning
- production operator identity/write authorization/audit is missing
- retention/deletion-state and executable tenant security suites are missing
- a common external-AI payload validator is missing

### Downstream findings retained only as handoffs

- customer routes currently read latest/raw measurement instead of a safe customer DTO
- measurement-design and execution paths do not consume an entitlement snapshot
- queue/worker/provider retry/idempotency runtime is missing
- aggregation mutates prior metrics
- detailed analysis/reflection/read-model and dashboard integration are incomplete
- admin UI is not production-ready

These findings remain useful, but they do not become Issue #102 children when their
implementation belongs to Phases 4–10.

## Human-review correction matrix

| OWNER instruction | Revision |
|---|---|
| Correct source priority | Issue and four OWNER comments are ordered above `master`; architecture/PR/branch material is reference-only except the explicitly OWNER-adopted PR #71 information structure |
| Limit Issue #102 to Phase 3 | direct scope now contains only shared data/security/privacy foundations and tests |
| Reorganize Stage 2 | split into Phase 3 direct children, downstream dependency contracts, and later-phase Issue candidates |
| Align `反映 / 保留` | external customer outcome is two-state; detailed internal model belongs to Phase 7 |
| Do not require human `approved` | no mandatory human approval state is fixed; Phase 7 decides review conditions |
| Preserve PR #71 information structure | all 10 primary customer screens and major detail views remain the product baseline; unmerged code/design/mock values remain revisable; customer-safe answer body/excerpt/citations remain allowed |
| Apply parallel policy | Phases 4–10 may start separately behind interfaces/mocks; integration gates are explicit |
| Correct Phase 10 | Phase 10 is LP/public site; Phase 4/8 dependencies are explicit; cross-phase integration/release remains a shared gate |
| Move non-Phase-3 decisions | queue, retry, prompt eligibility, completeness, publication detail, and aggregation design moved to owning phases |

## Execution plan and progress

### Milestone 1 — Original Stage 1 audit

- [x] Confirm original Stage 1 approval and classifications.
- [x] Fetch and verify clean `master` baseline in the official worktree.
- [x] Audit schema/migrations/RLS/Auth/API/admin/contracts/entitlements/measurement/
  publication/privacy/retention/tests read-only.
- [x] Record confirmed repository behavior separately from runtime hypotheses.
- [x] Create the formal design, Exec Plan, docs navigation, and Draft PR #103.
- [x] Run required validation and hand off to Human review.

### Milestone 2 — OWNER Human-review revision

- [x] Read comments 5117210498 and 5117068026 and re-check Issue #102.
- [x] Correct authority order and reference-only documents.
- [x] Restrict direct implementation scope to Phase 3.
- [x] Reorganize child work into three categories.
- [x] Document parallel-worktree/interface/mock/integration gates.
- [x] Map internal states to customer `反映 / 保留` without mandatory human approval.
- [x] Preserve customer-safe AI answer/detail body, excerpt, and citations.
- [x] Move queue, prompt eligibility, completeness, publication, and aggregation details
  to their owning phases.

### Milestone 3 — Previous revision validation and handoff

- [x] Run `npm run recora:preflight:full` with existing fnm Node/npm.
- [x] Run `git diff --check`.
- [x] Record docs-only lint/build omission reason.
- [x] Run `npm run recora:commit-check`.
- [x] Inspect exact changed/staged file lists and staged whitespace.
- [x] Commit and push only the three approved documents.
- [x] Update PR #103 body while keeping it Draft.
- [x] Record Project `Human review / Approval Plan` as unverified without mutation because the local `gh` token lacks `project` / `read:project`.
- [x] Post the previous completion directly to Issue #102 in comment 5117486620 and stop.

### Milestone 4 — OWNER follow-up 5117655117

- [x] Re-fetch Issue #102, OWNER comments, PR #103, and clean Git start state.
- [x] Reclassify Phase 10 as LP/public site and move integration/release to a shared gate.
- [x] Distinguish PR #71's revisable implementation values from its adopted
  information structure.
- [x] Preserve all 10 primary customer-screen areas and major detail views through the
  Phase 3 tenant/RLS/grant/classification boundary.
- [x] Run the same required validation and inspect exact changed/staged scope.
- [x] Commit and push only the approved documents.
- [x] Update PR #103 body and verify it remains Draft.
- [x] Leave Project unchanged and report it unverified if token scope remains insufficient.
- [ ] Post completion directly to Issue #102 and stop.

## Phase 3 child plan

The authoritative acceptance criteria are in
[`docs/recora-data-tenant-security-privacy.md`](../../recora-data-tenant-security-privacy.md#131-phase-3-direct-implementation-children).

1. `102-3A` fresh replay baseline — completed through Issue #80 / PR #81
2. `102-3B` tenant ownership and accepted membership — Issue #105 local
   implementation and validation completed on 2026-07-29; Draft PR handoff in progress
3. `102-3C` composite integrity, RLS, grants, and customer/operator boundary
4. `102-3D` plan policy, entitlement snapshot, and historical references
5. `102-3E` operator identity, authorization, and audit foundation
6. `102-3F` retention and deletion-state foundation
7. `102-3G` external-AI payload safety foundation
8. `102-3H` Phase 3 integration/security suite

These are planning labels, not created Issues. Every write-capable or privileged child
needs its own R3 Execute approval.

## Downstream dependency and parallel-work plan

Phases 4–10 may start separately before Issue #102 completes. Each records:

- the Phase 3 contract it consumes
- the temporary interface/adapter/fixture/mock
- what is not connected
- the integration stop condition
- the upstream Issue/PR required before Ready conversion or merge

No later phase may independently define or change tenant ownership, RLS, operator
authorization, entitlements/limits, retention/deletion, or external-AI payload policy.
No branch or worktree mixes multiple phases. Phase 10 owns the LP/public site and may
start in parallel; real pricing/contract/registration integration waits for Phase 4,
customer-screen/content alignment waits for Phase 8, and cross-phase integration/release
verification remains a shared gate.

## Migration and rollback strategy

Phase 3 starts with deterministic fresh replay. PR #81 is reference-only and is not
assumed merged. An approved Phase 3 child chooses the actual resolution.

All Phase 3 migration work is additive:

1. inspect live tenant/schema/grant/policy state under approved read-only access
2. resolve replay without required demo business rows in schema migration
3. add tenant/access, plan/entitlement/history, operator/audit, retention/deletion, and
   payload-policy primitives
4. backfill in bounded idempotent chunks
5. validate null/orphan/duplicate/cross-tenant/hash/constraint invariants
6. expose interfaces and fixtures to later phases
7. run the Phase 3 security suite before tightening compatibility paths

It does not build setup, queue, provider, analysis/publication, dashboard, or admin UI
paths. Emergency rollback stops new Phase 3 writers/interfaces, resumes backfill from a
checkpoint, and retains compatibility reads. It does not drop additive schema or mutate
historical entitlement references/audit evidence.

## Validation plan

Required for this document-only revision:

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

`npm run lint` and `npm run build` may be skipped because this revision changes only
Markdown architecture/plan/navigation and cannot affect runtime, dashboard, API,
dependencies, generated code, or deployment behavior. PR CI remains applicable.

Phase 3 implementation validation is child-specific and separately approved. Later
phases own their own runtime/UI/integration suites.

## Decision log

| Date | Decision |
|---|---|
| 2026-07-29 | Organization remains the tenant root and accepted membership is required. |
| 2026-07-29 | Contract data is separated from versioned plan policy and immutable entitlement snapshots. |
| 2026-07-29 | Issue #102 defines immutable historical references but does not implement setup, queue, analysis, read model, dashboard, or admin UI. |
| 2026-07-29 | Customer reflection is `反映 / 保留`; mandatory human `approved` is not assumed. |
| 2026-07-29 | Customer-safe AI answer body, excerpt, and citations remain allowed; provider envelopes/internal data remain internal. |
| 2026-07-29 | Phases 4–10 may start in parallel in separate worktrees behind interfaces/mocks, with integration/Ready/merge gates. |
| 2026-07-29 | Every Phase 3 Stage 2 child retains separate R3 Execute approval. |
| 2026-07-29 | Phase 10 is LP/public site; cross-phase integration/release is a shared gate, with real Phase 4 and Phase 8 dependencies recorded separately. |
| 2026-07-29 | PR #71 code/design/mock values remain revisable, while its 10-screen customer information structure and major detail views are an OWNER-adopted product criterion preserved by Phase 3 boundaries and implemented by Phase 8. |

## Results and residual risk

The revised Stage 1 plan provides:

- corrected authority order
- Phase 3-only direct implementation scope
- downstream interface and parallel-development gates
- corrected `反映 / 保留` and the full PR #71 customer-information boundary
- dependency-ordered Phase 3 children and later-phase Issue candidates
- correct Phase 10 LP/public-site ownership and shared cross-phase release gate

Unverified items remain live schema/data/grant/policy drift, JWT/RLS runtime behavior,
fresh replay after an approved fix, downstream integration, DNS-rebinding runtime
behavior, and legal retention defaults. This revision does not authorize Stage 2.

## Phase 3 integration record: Issue #117 / 102-3H

Issue #117 used latest `master` including PR #116 merge
`f041c6cfd87e78d3fff3a8236c80acf79ca25814` and the sole isolated local database
`supabase_db_recoraissue117`. Migration-only demo-only baseline replay, seeded replay,
the 3A-3F child contracts, and the DB/network-free 3G contract all returned exit code
zero with machine `status: ok`.

The cross-component matrix passed: accepted-active membership and lifecycle fail-closed
checks; Organization/Project A-B direct/list/search/count/pagination/join/RPC isolation;
composite integrity; immutable entitlement/history; scoped operator/audit; lifecycle
state/hold/restore/manifest controls; payload privacy; browser grants/RLS and
security-definer/service-only function boundaries; catalog type/enum contract checks; and
the PR #71 customer-safe versus raw/internal data boundary. No Phase 3 blocking defect
was proven, so the authorized minimum additive correction was not needed.

The installed local CLI required a Platform token for `gen types --local`; no token,
remote DB, `.env`, provider, fetch, DNS, or real deletion was used. The suite substituted
local catalog and hand-maintained application type checks plus `tsc --noEmit`; no generated type file exists. Phase 4-9
interfaces remain those in the parent contract: tenant/entitlement (4), member/project,
