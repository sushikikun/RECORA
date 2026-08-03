# Exec Plan: Issue #136 Measurement Design Canonical Data Model

This file is the living execution record for Stage 1 design work only. It does not
authorize Stage 2 migration, database execution, production inventory, import,
backfill, provider execution, deployment, or cutover.

## Metadata

| Field | Value |
|---|---|
| Issue | `#136` — `https://github.com/sushikikun/RECORA/issues/136` |
| Risk | `R3` parent scope; Stage 1 docs-only |
| Spec level | `Full` |
| Execution | `Cloud Codex` for Stage 1; `Local Codex` required for Stage 2+ |
| Approval | Stage 1 `Plan` approval and subsequent OWNER continuation instructions recorded on 2026-08-04 |
| Owner | `sushikikun` |
| Status | `Stage 1 complete / Human review ready` — master-based validation PR #140 CI #255 passed; Stage 2 remains unapproved |
| Updated | `2026-08-04` |

Exec Plan text does not grant approval. Issue #136 is the authority for allowed and
prohibited operations.

## Objective and outcome

Produce a formal, zero-based canonical data model for Recora Prompt and Measurement
Design that:

- follows the new Recora-wide responsibility structure;
- is derived from product requirements rather than legacy table shape;
- consumes accepted tenant, entitlement, audit, publication, and privacy foundations;
- separates the semantic Prompt Set, multi-model Execution Profile Set, and policy versions;
- preserves immutable historical measurement meaning;
- defines explicit one-way legacy import and controlled cutover;
- divides implementation into separately approvable Waves.

Stage 1 ends after the target documents, TypeScript contract alignment, exact-scope
review, and master-based CI evidence are ready for Human review. Stage 1 does not
include Ready conversion, merge, or Stage 2 implementation.

## Recora-wide responsibility boundary

Issue #136 owns only:

```text
Business and operations foundation
└─ Prompt and measurement design
```

It receives approved customer/project and onboarding context and produces one immutable
`measurement_design_version` for Measurement Execution.

It does not own:

- provider execution;
- queue or retry;
- AI answer or citation analysis;
- quality or publication decisions;
- customer or administrator screen state;
- authentication, tenant, entitlement, or audit foundations;
- the public site.

The formal flow is:

```text
Customer/project and onboarding context
  → Prompt and Measurement Design
  → frozen measurement_design_version
  → Measurement Execution
  → AI answer and citation analysis
  → Quality and exception handling
  → Publication
  → customer-safe read models
```

## Current validated state

- `master`: `3f3515b6286fdaa4cd131afb969bcc7877c14f73`
- PR #133 contract head: `072599cd875fc527849864cb0592ace87414dc18`
- PR #133 Recora CI run #253: PASS
- PR #135 TypeScript contract head: `c6951ec43aa75b438687bb9b9eab7b2ffea80c1b`
- PR #135 Recora CI run #254: PASS
- PR #137 canonical-model head: `7410ac295c9ee4c86235c0c12caf41863380702d`
- PR #137 remains stacked on PR #133 and is mergeable
- Validation-only PR #140 head: `0913f0c1268dda0796aa51f68ce11a5b135a49ed`
- PR #140 Recora CI run #255: PASS
- PR #133, PR #135, PR #137, and PR #140 remain Draft and unmerged

PR #140 is not a merge vehicle. It exists only to validate the combined documentation
state against `master` without retargeting the focused stacked PR #137.

## Resolved aggregate refinement

The previous singular `execution_profile_id` on Prompt Set Version was replaced by:

```text
measurement_design_version
  ├─ prompt_set_version_id
  ├─ execution_profile_set_version_id
  ├─ panel_profile_version_id
  └─ measurement_policy_bundle_version_id
```

Consequences:

- semantic panel change creates a successor Prompt Set Version and Design Version;
- provider/model matrix change creates a successor Execution Profile Set Version and Design Version;
- metric, response, aggregation, repeat, or compatibility policy change creates a successor Policy Bundle Version and Design Version;
- an execution-only change does not rewrite the semantic Prompt Set.

PR #133 documents this boundary and PR #135 enforces it with additive TypeScript types
and cross-object validators.

## Scope and non-goals

### Stage 1 scope

- formal canonical entity model;
- version and lifecycle boundaries;
- logical schema responsibilities;
- database-constraint versus finalization-validator responsibilities;
- Measurement Execution and snapshot handoff;
- legacy isolation and import classification;
- shadow validation, cutover, rollback, and implementation Waves;
- documentation map update;
- Draft PR and validation evidence.

### Stage 1 non-goals

- SQL or Supabase migration;
- local, linked, remote, or production database access;
- production data inventory or interpretation;
- provider calls;
- customer or administrator UI implementation;
- product/runtime integration;
- Ready conversion or merge;
- production import, writer switch, read cutover, deployment, or cleanup.

## Assumptions and dependencies

| Item | State / evidence | Impact if false |
|---|---|---|
| Same Supabase project remains the default physical environment | Confirmed OWNER direction | New architecture decision and re-plan required |
| `control / measurement / publication / api / audit` remains accepted | Post-launch architecture | Stop before physical schema planning |
| Organization/project and entitlement snapshot contracts remain shared inputs | Tenant/security/privacy contract | Stop and reconcile upstream |
| Admin measurement cycle/item/attempt responsibilities remain adopted | Admin P0 canonical specifications | Reconcile responsibility before Stage 2 |
| Multi-model measurement remains a product requirement | Revised PR #133 and PR #135 | Execution Profile Set boundary requires OWNER revision if removed |
| Existing persona/topic/prompt tables remain legacy reference and import sources only | Latest OWNER decision | Stop if a future plan makes them canonical parents |

## Risk and safety boundaries

- Highest risk: `R3`
- Stage 1 allowed changes: approved documentation, additive TypeScript contract, deterministic verifier, and temporary validation evidence
- Stage 1 prohibited operations: database, migration, provider, production, import, backfill, deploy, cutover
- Stage 2 implementation requires separate R2/R3 Execute approval
- Production inventory, import, writer switch, read cutover, and rollback execution each require separate R3 approval
- Ready conversion and merge require separate Human approval
- No `.env`, credential, token, database URL, production row, or raw provider/customer content may be included

Stop before Stage 2 if:

- canonical entities require a formal foreign key to legacy rows;
- accepted tenant, entitlement, audit, or publication foundations must be redefined;
- non-approved production data inference is required;
- a Wave cannot be isolated safely;
- physical DDL cannot satisfy tenant, immutability, or history requirements;
- Human review identifies an unresolved responsibility conflict.

## Milestones

| Milestone | Status | Result |
|---|---|---|
| M1: Authority and invariants | `Completed` | Recora-wide position and greenfield/legacy boundary fixed |
| M2: Canonical entity and version model | `Completed` | Aggregate, revisions, Prompt Set, Execution Profile Set, Policy Bundle, lifecycle, and constraints defined |
| M3: Runtime, legacy, and cutover boundary | `Completed` | Planned observation versus retry, snapshots, import, shadow, cutover, rollback, and Waves defined |
| M4: Upstream contract alignment | `Completed` | PR #133 CI #253 and PR #135 CI #254 pass on current master baseline |
| M5: Stacked documentation validation | `Completed` | PR #137 synchronized; validation-only PR #140 CI #255 passes against master |
| M6: Human review and adoption decision | `Pending` | Review PR #133, #135, and #137; decide Ready/merge order separately |

## Validation evidence

| Validation | Result |
|---|---|
| Recora-wide responsibility review | PASS; the domain remains one business/operations capability |
| PR #133 contract alignment | PASS; complete Measurement Design aggregate and interfaces documented |
| PR #133 CI | PASS; run #253 includes whitespace, preflight, typecheck, lint, and build |
| PR #135 TypeScript alignment | PASS; multi-model execution set, policy bundle, identity/revision, and cross-object validation implemented |
| PR #135 CI | PASS; run #254 includes whitespace, preflight, verifier, typecheck, lint, and build |
| PR #137 greenfield-before-legacy review | PASS; canonical model precedes legacy inventory and contains no canonical legacy FK |
| PR #137 exact focused scope | PASS; three approved documentation files |
| Combined master-based documentation scope | PASS; PR #140 contains exactly four approved documentation files |
| Combined master-based CI | PASS; PR #140 run #255 includes whitespace, preflight, typecheck, lint, and build |
| Secret/content review | PASS; no sensitive values or production records included |
| Database/runtime/provider validation | NOT PERFORMED; outside Stage 1 authority |

## Implementation Waves after approval

### Wave 1: Canonical semantic foundation

- Measurement Design identity and version shell
- Persona, Topic, Intent Cell, and Prompt identities/revisions
- metric eligibility
- Prompt Set Version and memberships
- tenant, immutability, and finalization constraints

### Wave 2: Execution and immutable evidence handoff

- Execution Profile and Execution Profile Set Versions
- Measurement Policy Bundle Version
- Design activation/current pointer
- planned Measurement Item references
- contract snapshots
- planned repeat versus provider retry separation

### Wave 3: Explicit legacy migration and controlled cutover

- production inventory under separate approval
- Import Batch and Import Decision
- explicit transformation/review decisions
- shadow validation
- canonical-only writer switch
- administrator/customer read-model cutover
- legacy writer freeze and eventual retirement

Each Wave requires its own Issue, Exec Plan, scope, local-only validation, rollback plan,
and Execute approval.

## Rollback and recovery

### Stage 1 documents and contracts

If Human review finds an incorrect authority or unresolved conflict:

1. stop before Stage 2;
2. preserve Issue, commit, PR, and CI evidence;
3. amend or supersede the affected Draft PR;
4. rerun exact-scope and master-based CI validation;
5. do not treat prior PASS evidence as applying to changed content.

### Future canonical implementation

Rollback uses successor versions and the previous safe publication pointer. Canonical
history, import lineage, measurement attempts, audit evidence, and published versions
are never deleted or rewritten merely to roll back.

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| `2026-08-04` | M1 | Issue #136 created with Recora-wide and greenfield/legacy authority | Define canonical aggregate |
| `2026-08-04` | M2 | Measurement Design Version binds semantic panel, execution set, and policy bundle | Complete runtime and legacy handoff |
| `2026-08-04` | M3 | Planned observation/retry, snapshot, one-way import, shadow/cutover, and Waves defined | Align upstream contracts |
| `2026-08-04` | M4 | PR #133 CI #253 PASS and PR #135 CI #254 PASS | Synchronize canonical-model PR |
| `2026-08-04` | M5 | PR #137 synchronized; validation PR #140 CI #255 PASS against master | Human review and adoption decision |

## Decision log

| Date | Decision | Rationale | Impact |
|---|---|---|---|
| `2026-08-04` | Build a new canonical model rather than extending legacy public tables | Latest OWNER direction | Legacy remains reference, history, and explicit import source only |
| `2026-08-04` | Follow the new Recora-wide responsibility structure | Prevent domain overlap | Input/output and non-owned responsibilities are explicit |
| `2026-08-04` | Use accepted logical schemas in one Supabase project | Reuse shared foundations without creating a separate product database | `control`, `measurement`, `publication`, `api`, and `audit` retain separate responsibilities |
| `2026-08-04` | Measurement Design Version is the complete production contract | Historical reproducibility | One immutable version authorizes and interprets a formal run |
| `2026-08-04` | Separate semantic Prompt Set and multi-model Execution Profile Set | Semantic and execution changes are independent | Provider/model change does not rewrite the panel |
| `2026-08-04` | Separate Policy Bundle from Prompt Set | Policy changes must not rewrite semantic history | New Design Version binds the new policy version |
| `2026-08-04` | Use stable identities and immutable revisions | Preserve continuity and evidence | Persona, Topic, Intent Cell, and Prompt history remains reproducible |
| `2026-08-04` | Separate planned observation and provider retry | Protect statistical meaning | Measurement Item and Attempt remain distinct |
| `2026-08-04` | Use explicit one-way legacy import, not permanent dual write | Prevent legacy semantic authority | Shadow validation precedes canonical-only writer |
| `2026-08-04` | Validate the stacked docs through temporary PR #140 | Preserve focused review diffs while satisfying master-only CI | Technical CI blocker resolved without retargeting PR #137 |

## Results and remaining risks

### Stage 1 results

- Canonical model is independent from legacy table shape.
- Recora-wide responsibility and interface boundaries are explicit.
- Semantic panel, execution matrix, and policy versions are independently modeled.
- Measurement item/attempt/snapshot responsibility is defined.
- Legacy import, cutover, rollback, and implementation Waves are defined.
- PR #133, #135, and the combined documentation state pass complete master-based CI.
- PR #137 remains a focused, mergeable stacked review PR.

### Remaining risks

- PR #133, #135, and #137 are still Draft and unmerged.
- Human review may require content changes, which would require renewed validation.
- Physical PostgreSQL DDL and constraint feasibility are untested until Stage 2 approval.
- Analysis-target and brand-identity versions depend on their source-domain contracts.
- Semantic clustering, profile adoption, repeat, SOV, and cutover thresholds remain experimental.
- Production inventory and import classifications have not been executed.

## Completion record

- Stage 1 status: `Completed; Human review pending`
- Completed at: `2026-08-04`
- Stage 2 status: `Not approved`
- Next formal gate: Human review of PR #133, #135, and #137, followed by separate Ready/merge decisions
- Archive path after Issue completion: `docs/exec-plans/completed/issue-136-measurement-design-canonical-data-model.md`
