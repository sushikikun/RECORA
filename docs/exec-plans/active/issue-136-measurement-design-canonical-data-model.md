# Exec Plan: Issue #136 Measurement Design Canonical Data Model

This file is a living execution record for Stage 1 design work only. It does not
authorize Stage 2 migration, DB execution, production inventory, backfill, provider
execution, or cutover.

## Metadata

| Field | Value |
|---|---|
| Issue | `#136` — `https://github.com/sushikikun/RECORA/issues/136` |
| Risk | `R3` parent scope; Stage 1 docs-only |
| Spec level | `Full` |
| Execution | `Cloud Codex` for Stage 1; `Local Codex` required for Stage 2+ |
| Approval | Issue #136 Stage 1 `Plan` approval and subsequent OWNER continuation instructions recorded on 2026-08-04 |
| Owner | `sushikikun` |
| Status | `Blocked` — upstream contracts are aligned; Human review and an approved master-based CI path for the stacked PR remain required |
| Updated | `2026-08-04` |

Exec Plan text does not grant approval. Issue #136 is the authority for allowed and
prohibited operations.

## Objective / expected outcome

Produce a formal, zero-based canonical data model for Recora Prompt and Measurement
Design that:

- follows the new Recora-wide responsibility structure;
- is derived from product requirements rather than legacy table shape;
- consumes accepted tenant, entitlement, audit, publication, and privacy foundations;
- separates semantic Prompt Set, multi-model Execution Profile Set, and policy versions;
- preserves immutable historical measurement meaning;
- defines explicit one-way legacy import and controlled cutover;
- divides implementation into separately approvable Waves.

Stage 1 ends at a docs-only stacked Draft PR and Human review.

## Context and constraints

### Recora-wide position

Issue #136 owns only:

```text
Business and operations foundation
└─ Prompt and measurement design
```

It receives approved customer/project and onboarding context and produces one immutable
`measurement_design_version` for Measurement Execution.

It does not own provider execution, queue/retry, answer/citation analysis, quality or
publication decisions, customer/admin screen state, authentication, tenant foundation,
entitlement, audit foundation, or the public site.

### Current upstream state

- `master`: `3f3515b6286fdaa4cd131afb969bcc7877c14f73`
- PR #133 contract head: `072599cd875fc527849864cb0592ace87414dc18`
- PR #133 Recora CI run #253: PASS
- PR #135 TypeScript contract head: `c6951ec43aa75b438687bb9b9eab7b2ffea80c1b`
- PR #135 Recora CI run #254: PASS
- PR #133 and #135 remain Draft and unmerged.
- PR #137 remains stacked on the PR #133 branch.
- The repository CI workflow runs pull-request checks only when the base is `master`, so
  PR #137 does not receive CI while it remains stacked.

### Resolved upstream refinement

The previous singular `execution_profile_id` on Prompt Set Version was replaced by:

```text
measurement_design_version
  ├─ prompt_set_version_id
  ├─ execution_profile_set_version_id
  └─ measurement_policy_bundle_version_id
```

PR #133 now documents this boundary and PR #135 now enforces it through types and
cross-object validators.

## Scope / non-goals

### In scope

- formal canonical entity model;
- version and lifecycle boundaries;
- schema responsibility;
- DB versus finalization-validator constraints;
- Measurement Execution and snapshot handoff;
- legacy isolation, import classification and cutover;
- rollback and implementation Waves;
- docs index update;
- stacked Draft PR and review evidence.

### Non-goals

- SQL or Supabase migration;
- local, linked, remote, or production DB access;
- product/runtime code changes in PR #137;
- legacy row inventory or production data interpretation;
- provider calls;
- customer/admin UI implementation;
- Ready conversion, merge, deploy, retarget, cutover, or cleanup.

## Assumptions and dependencies

| Item | State / evidence | Impact if false |
|---|---|---|
| Same Supabase project remains the default physical environment | Confirmed OWNER direction | New architecture decision and re-plan required |
| `control / measurement / publication / api / audit` remains accepted | Post-launch architecture | Stop before schema redesign |
| Organization/project and entitlement snapshot contracts remain inputs | Tenant/security/privacy contract | Stop and escalate upstream |
| Admin measurement cycle/item/attempt responsibilities remain adopted | Admin P0 Canonical measurement specification | Reconcile before Stage 2 |
| Multi-model measurement remains a product requirement | Revised PR #133 and PR #135 | Execution Profile Set boundary would require OWNER revision |
| PR #137 stays stacked until dependency review | Current Human-review boundary | Retarget/rebase requires explicit dependency review |

## Risk and safety boundaries

- Highest Risk: `R3`
- Allowed Stage 1 changes: two approved docs plus minimal `docs/README.md` index update
- Prohibited: DB, migration, runtime, package, lockfile, production, provider call
- Required approvals:
  - Stage 1 docs and stacked Draft PR: recorded in Issue #136
  - Stage 2 implementation: separate R2/R3 Execute approval
  - production inventory/import/cutover: separate R3 approval per operation
  - Ready/merge: separate Human approval
  - retarget/rebase for final CI: Human review of dependency order
- Stop conditions:
  - canonical model requires a formal FK to legacy;
  - accepted tenant/entitlement/publication contract must be redefined;
  - production data inference is required;
  - non-doc changes become necessary inside PR #137;
  - final CI or scope validation fails.
- Secret and data handling:
  - no `.env`, credential, token, DB URL, production row, or raw provider/customer content.

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Authority and invariants | `Completed` | Fix Recora-wide position and greenfield/legacy boundary | Product invariants and responsibility interfaces documented |
| M2: Canonical entity and version model | `Completed` | Define aggregate, revisions, semantic panel, execution set, policy bundle, lifecycle and constraints | Model exists independently from legacy layout |
| M3: Runtime, legacy and cutover | `Completed` | Define planned item vs retry, snapshot, import decisions, shadow/cutover/rollback and Waves | One-way migration and recovery boundaries documented |
| M4: Upstream alignment | `Completed` | Amend PR #133 and PR #135; sync latest master; run master-based CI | PR #133 CI #253 and PR #135 CI #254 pass |
| M5: Stacked PR final review path | `Blocked` | Human-review dependency order; approve retarget/rebase or other master-based validation path; run CI | Exact three-doc scope remains valid and master-based CI passes |

## Validation plan and current evidence

| Validation | Result / evidence |
|---|---|
| Recora-wide responsibility review | PASS; Prompt and Measurement Design remains one business/operations domain |
| PR #133 alignment | PASS; Measurement Design Version, Execution Profile Set and Policy Bundle documented; CI #253 PASS |
| PR #135 alignment | PASS; TypeScript aggregate and cross-object validators implemented; CI #254 PASS |
| Tenant/entitlement/audit/publication review | PASS; existing foundations are consumed, not redefined |
| Admin measurement responsibility review | PASS; design supplies immutable references without replacing cycle/item/attempt authority |
| Legacy-first anti-pattern review | PASS; canonical model precedes legacy inventory and contains no legacy FK |
| Exact stacked scope | PASS before upstream sync; PR #137 branch has been synchronized with revised PR #133 and must be rechecked in final review |
| Secret/content review | PASS; docs contain no sensitive values |
| PR #137 repository CI | NOT TRIGGERED because its base is not `master`; this remains a blocker, not a pass |

## Rollback / recovery

### Stage 1 docs

- Trigger: incorrect authority, unresolved conflict, scope drift, or final validation failure.
- Steps:
  1. stop outside approved docs;
  2. preserve Issue, commit, PR, and validation evidence;
  3. correct or supersede the docs branch;
  4. do not start Stage 2.
- Recovery verification: exact scope and approved master-based CI return PASS.
- Escalation: OWNER Human review.

### Future implementation boundary

Implementation rollback uses successor versions and the previous safe publication
pointer. Canonical history, import lineage, attempts, audit evidence, and published
versions are not deleted or rewritten to roll back.

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| `2026-08-04` | M1 | Issue #136 created with Recora-wide and greenfield/legacy authority | Define canonical aggregate |
| `2026-08-04` | M2 | Measurement Design Version binds semantic panel, execution set and policy bundle | Complete runtime and legacy handoff |
| `2026-08-04` | M3 | Planned observation/retry, snapshot, one-way import, shadow/cutover and Waves defined | Align upstream contracts |
| `2026-08-04` | M4 | PR #133 amended and CI #253 PASS; PR #135 amended and CI #254 PASS | Synchronize stacked PR and complete Human-review validation path |
| `2026-08-04` | M5 | PR #137 branch synchronized with revised PR #133; CI still unavailable on non-master base | Human review and approved master-based CI path |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| `2026-08-04` | Build new canonical model rather than extending legacy public tables | Latest OWNER direction | Legacy is migration source only; no canonical FK |
| `2026-08-04` | Follow the new Recora-wide structure | OWNER instruction | Domain interfaces and exclusions are explicit |
| `2026-08-04` | Use accepted logical schemas in one Supabase project | Existing architecture | `control` owns design; other schemas retain their responsibilities |
| `2026-08-04` | Measurement Design Version is the complete production contract | Historical reproducibility | One immutable reference authorizes each formal run |
| `2026-08-04` | Separate semantic Prompt Set and multi-model Execution Profile Set | Independent semantic/execution changes | PR #133/#135 amended and validated |
| `2026-08-04` | Separate policy bundle from Prompt Set | Policy changes must not rewrite panel history | New design version binds new policy bundle |
| `2026-08-04` | Stable identities plus immutable revisions | Continuity and evidence | Persona/Topic/Intent Cell/Prompt histories remain reproducible |
| `2026-08-04` | Separate planned observation and retry attempts | Statistical integrity | Measurement Item and Attempt grains remain distinct |
| `2026-08-04` | One-way explicit legacy import; no permanent dual write | Prevent legacy semantic authority | Shadow validation precedes canonical-only writer |
| `2026-08-04` | Keep PR #137 stacked until dependency review | Preserve an intelligible review diff | Final CI remains pending an approved path |

## Results and remaining risks

### Results

- Canonical model is independent from legacy table shape.
- Recora-wide responsibility and interface boundaries are explicit.
- Semantic panel, execution matrix and policy versions are independently modeled.
- Measurement item/attempt/snapshot contract is defined.
- Legacy import, cutover, rollback and implementation Waves are defined.
- Upstream PR #133 and PR #135 are aligned and pass full master-based CI.

### Validation results

- PR #133 CI #253: PASS.
- PR #135 CI #254: PASS.
- PR #137: no CI while stacked on a non-master base.
- No DB, migration, runtime, production inventory, provider, or backfill validation was performed.

### Deviations from plan

- The stacked PR cannot trigger the repository's current master-only pull-request CI.
  This is recorded as a blocker rather than reported as success.

### Remaining risks

- PR #137 requires final exact-diff review and an approved master-based CI path.
- PR #133, #135 and #137 remain Draft and unmerged.
- Physical DDL and PostgreSQL feasibility remain untested until Stage 2 approval.
- Analysis-target and brand-identity version contracts depend on their source domain.
- Semantic clustering, profile adoption, repeat, SOV and cutover thresholds remain experimental.

### Completion record

- Final status: `Blocked`
- Completed or closed at: N/A
- Follow-up: Human-review dependency order, then approved master-based validation before any Stage 2 planning or execution
- Archive path: `docs/exec-plans/completed/issue-136-measurement-design-canonical-data-model.md`
