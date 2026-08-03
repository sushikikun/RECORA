# Exec Plan: Issue #136 Measurement Design Canonical Data Model

This file is a living execution record. It tracks Stage 1 design work only. It does
not authorize Stage 2 migration, DB execution, production inventory, backfill, or
cutover.

## Metadata

| Field | Value |
|---|---|
| Issue | `#136` — `https://github.com/sushikikun/RECORA/issues/136` |
| Risk | `R3` parent scope; Stage 1 docs-only |
| Spec level | `Full` |
| Execution | `Cloud Codex` for Stage 1; `Local Codex` required for Stage 2+ |
| Approval | Issue #136 Stage 1 `Plan` approval recorded from OWNER conversation on 2026-08-04 |
| Owner | `sushikikun` |
| Status | `Active` |
| Updated | `2026-08-04` |

Exec Plan text does not grant approval. Issue #136 is the authority for allowed and
prohibited operations.

## Objective / expected outcome

Produce a formal, zero-based canonical data model for Recora measurement design that:

- is derived from current product requirements rather than legacy table shape;
- reuses the accepted tenant, entitlement, audit, publication, and privacy foundations;
- separates semantic design, prompt panel, multi-model execution matrix, and policy versions;
- preserves immutable historical measurement meaning;
- defines explicit one-way legacy import and controlled cutover;
- divides implementation into separately approvable Waves.

Stage 1 ends at a docs-only stacked Draft PR and Human review.

## Context and constraints

### Current upstream state

- `master`: `49fd9007a4e93f80285660cf1f9e98c115d60a30`
- PR #133 contract head: `f804830bfe764a198836d9b9841ad82e166bd151`
- PR #135 TypeScript contract head at Stage 1 start: `58c19da05d20cf6c3fcb5867303f971954ca10e7`
- PR #133 and #135 are Draft and unmerged.
- Branch for this plan is stacked from PR #133.

### Latest product direction

The legacy DB is reference and migration source only. The new canonical model must not
be designed as an extension of legacy persona/topic/prompt tables.

### Existing foundations consumed

- organization and project tenant ownership;
- accepted membership and authorization boundaries;
- immutable entitlement snapshots;
- operator identity, capability and audit;
- post-launch `control / measurement / publication / api / audit` separation;
- Admin P0 measurement cycle/item/attempt/revision responsibilities;
- external-AI provider-safe payload boundary.

### Key design refinement found during Stage 1

The prompt contract's singular `execution_profile_id` on a prompt-set version is too
narrow for Recora's multi-model measurement product.

The canonical design separates:

```text
measurement_design_version
  ├─ prompt_set_version
  ├─ execution_profile_set_version
  └─ measurement_policy_bundle_version
```

This requires an upstream contract amendment before Stage 2.

## Scope / non-goals

### In scope

- formal canonical entity model;
- version and lifecycle boundaries;
- schema responsibility;
- DB versus finalization-validator constraints;
- measurement runtime and snapshot handoff;
- legacy isolation, import classification and cutover;
- rollback and implementation Waves;
- docs index update;
- stacked Draft PR and review evidence.

### Non-goals

- SQL or Supabase migration;
- local, linked, remote, or production DB access;
- product/runtime code changes;
- changes to PR #135 code;
- legacy row inventory or production data interpretation;
- provider calls;
- customer/admin UI implementation;
- Ready conversion, merge, deploy, or cleanup.

## Assumptions and dependencies

| Item | State / evidence | Impact if false |
|---|---|---|
| Same Supabase project remains the default physical environment | Confirmed OWNER direction | A new architecture decision and re-plan are required |
| `control / measurement / publication / api / audit` remains accepted | `recora-post-launch-operations-architecture.md` | Stop before schema redesign |
| organization/project and entitlement snapshot contracts are stable inputs | `recora-data-tenant-security-privacy.md` | Stop and escalate to upstream owner |
| Admin measurement cycle/item/attempt responsibilities remain adopted | Admin P0 Canonical measurement spec | Reconcile responsibility before Stage 2 |
| PR #133 and #135 remain unmerged during Stage 1 | Confirmed at start | Rebase and revalidate if merged or changed |
| Multi-model measurement is a product requirement | Current settings/dashboard product direction | Execution profile set may be simplified only by OWNER decision |

## Risk and safety boundaries

- Highest Risk: `R3`
- Allowed changes: two approved docs plus minimal `docs/README.md` index update
- Prohibited changes: DB, migration, code, package, lockfile, production, provider call
- Required approvals:
  - Stage 1 docs/stacked Draft PR: approved in Issue #136
  - Stage 2 implementation: separate R2/R3 Execute approval
  - production inventory/import/cutover: separate R3 approval per operation
  - merge/Ready: separate Human approval
- Stop conditions:
  - canonical model requires a formal FK to legacy;
  - accepted tenant/entitlement/publication contract must be redefined;
  - DB inspection is required to complete Stage 1;
  - non-doc changes become necessary;
  - upstream contract conflict cannot be resolved in review.
- Secret and data handling:
  - no `.env`, credential, token, DB URL or production row data;
  - no raw customer/provider content in docs.

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Authority and invariants | `Completed` | Read Issue #136 inputs; fix greenfield/legacy boundary; identify consumed cross-cutting contracts | Product invariants and authority order documented |
| M2: Canonical entity and version model | `Completed` | Define aggregate, identity/revision, panel, multi-model execution set, policy bundle, lifecycle, constraints | New model exists independently of legacy table layout |
| M3: Runtime, legacy and cutover | `Completed` | Define item/attempt grain, contract snapshots, import decisions, shadow/cutover/rollback and Waves | One-way migration and recovery boundaries documented |
| M4: Index, validation and Draft PR | `In progress` | Update docs index; verify exact scope and upstream alignment; create stacked Draft PR; record CI | Docs-only CI passes and PR reaches Human review |

## Validation plan

| Validation | When | Expected result | Actual result / evidence |
|---|---|---|---|
| PR #133 alignment review | M2/M4 | Prompt classification, panel and eligibility retained; amendments explicit | Design refinement recorded; final PR review pending |
| PR #135 alignment review | M2/M4 | Type contract differences identified, no silent incompatibility | Singular execution profile amendment identified; final review pending |
| Tenant/entitlement/audit/publication review | M2/M4 | No redefinition of upstream foundations | Document consumes existing contracts; final review pending |
| Admin measurement responsibility review | M3/M4 | Design model supplies references without replacing cycle/item/attempt authority | Item/attempt handoff documented; final review pending |
| Legacy-first anti-pattern review | M3/M4 | Canonical entity section precedes legacy inventory and contains no legacy FK | PASS by document inspection; PR review pending |
| `git diff --check` | M4 | no whitespace errors | Pending CI |
| exact changed scope | M4 | only approved 3 docs | Pending compare |
| secret/env/DB URL scan | M4 | no sensitive values | Pending CI/review |
| repository CI | M4 | PASS | Pending |

## Rollback / recovery

### Stage 1 docs

- Trigger: incorrect authority, unresolved upstream conflict, or docs CI failure.
- Preconditions: no DB/product effects exist.
- Steps:
  1. stop edits outside approved docs;
  2. preserve Issue and PR evidence;
  3. correct or supersede the docs branch;
  4. do not start Stage 2.
- Preserved evidence/data: Issue #136, commits, PR comments, validation results.
- Recovery verification: docs diff and CI return to PASS.
- Escalation: OWNER Human review.

### Future implementation boundary

The canonical implementation rollback is designed around successor versions and the
previous safe publication pointer. Canonical history, import lineage, attempts, and
published versions are never deleted to perform rollback.

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| `2026-08-04` | M1 | Issue #136 created with greenfield/legacy authority and Stage 1 boundary | Define canonical aggregate and schema responsibilities |
| `2026-08-04` | M2 | Canonical design document created; measurement design version binds semantic panel, execution profile set and policy bundle | Complete runtime and legacy handoff |
| `2026-08-04` | M3 | Defined planned observation versus retry, execution snapshot, one-way import, shadow/cutover and three implementation Waves | Update index and validate stacked PR |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| `2026-08-04` | Build new canonical model rather than extending legacy public tables | Latest OWNER direction | Legacy is migration source only; no canonical FK to legacy |
| `2026-08-04` | Use accepted schemas instead of creating a separate Supabase project | Post-launch architecture and OWNER clarification | `control` owns design; `measurement` owns evidence; `api/publication/audit` retain boundaries |
| `2026-08-04` | `measurement_design_version` is the complete production contract | Need one reproducible identity for every run | Design binds component revisions, panel, execution matrix, policy and entitlement |
| `2026-08-04` | Separate prompt-set version from execution-profile-set version | Recora measures multiple AI models; semantic and execution changes have different comparability effects | PR #133/#135 require amendment before Stage 2 |
| `2026-08-04` | Stable identities plus immutable revisions for persona/topic/Intent Cell/prompt | Required for continuity and historical reproducibility | Design versions bind exact revisions through memberships |
| `2026-08-04` | One planned observation is separate from retry attempts | Statistical repeats must not be confused with recovery calls | `measurement_item` includes observation ordinal; attempts are append-only children |
| `2026-08-04` | One-way explicit legacy import; no permanent dual write | Prevent old rows from remaining semantic authority | Cutover uses import lineage, shadow validation and canonical-only writer |
| `2026-08-04` | Rollback creates a successor-compatible design version | Avoid state reversal and history mutation | Previous safe publication remains; canonical evidence is preserved |

## Results and remaining risks

### Results

- Canonical model designed independently from legacy table shape.
- Version boundaries for semantic panel, execution matrix and policies defined.
- Multi-model execution-profile-set requirement identified.
- Measurement item/attempt/snapshot contract defined.
- Legacy import, cutover, rollback and Wave boundaries defined.

### Validation results

- Formal CI and exact scope validation are pending M4.
- No DB, migration, runtime, production or external provider validation was performed.

### Deviations from plan

- None at this stage.

### Remaining risks

- PR #133 and PR #135 still describe a singular prompt-set execution profile and require amendment or successor contract.
- Physical DDL and PostgreSQL feasibility are intentionally untested until Stage 2 approval.
- Analysis-target and brand-identity version contracts depend on their source domain.
- Final semantic clustering, panel profile, repeat and SOV policies remain experimental.

### Completion record

- Final status: `Active`
- Completed or closed at: N/A
- Follow-up: Stage 2 child Issues only after Human review and Execute approval
- Archive path: `docs/exec-plans/completed/issue-136-measurement-design-canonical-data-model.md`
