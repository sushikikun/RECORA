# Recora Operational DB Completion Plan

Status: Docs-only operational DB completion plan
Last updated: 2026-07-06

## Overview

This document records the operational DB completion plan for Recora before customer launch. It connects the existing three-layer DB boundary to the daily operating model: manual admin-triggered measurement, plan-based question/model limits, project-level AI model selection, publication, reruns, AI answer visibility, and recommendation publishing.

It follows:

- `docs/recora-customer-vs-admin-db-boundary-design.md`
- `docs/recora-customer-measurement-db-readiness-audit.md`
- `docs/recora-admin-db-current-state-audit.md`
- `docs/recora-customer-db-readiness-audit.md`
- `docs/recora-customer-org-project-boundary-design.md`
- `docs/recora-report-data-readiness.md`
- `docs/recora-report-tabs-spec.md`
- `docs/recora-report-metric-contracts.md`
- `docs/recora-prompt-scope-db-migration-plan.md`

The main rule remains unchanged: Admin Control DB owns mutable internal operation state, Customer Measurement DB owns official measured result data, and Customer Published Read Model owns approved customer-facing snapshots. This plan adds the operational sequence and DB capability gaps needed to make that model work in daily Recora operation.

This is not a decision to physically split the Supabase project into multiple databases now. The boundary can still be implemented with schemas, tables, RLS, views, read-model tables, or later physical separation. The first requirement is responsibility clarity.

This PR is docs-only. It does not create migrations, write to any database, run Supabase db push, run backfill, seed, repair, reset, run external APIs or measurement jobs, implement UI, change Auth/middleware/LP/handoff files, or change `package-lock.json`.

## Scope

This document covers:

- the five-part Recora product/data structure
- confirmed operational decisions for daily measurement and publication
- open operational decisions that should remain explicit before schema work
- the end-to-end daily operation flow
- Admin DB requirements for measurement control, plans, model selection, publication control, reruns, and audit logs
- Customer Measurement DB requirements for official measured result storage
- customer-facing published data requirements for safe report display
- measurement batch/job requirements
- plan and model requirements
- publication, failure/rerun, AI answer visibility, and recommendation publishing requirements
- missing DB capabilities and proposed DB work packages
- recommended PR sequence after this docs-only plan

## Non-goals

This document does not:

- implement customer-facing UI
- implement admin UI
- add or edit database migrations
- run `supabase db push` or remote apply
- run UPDATE, INSERT, DELETE, ALTER TABLE, seed, repair, reset, or backfill apply
- change RLS, policies, grants, helper functions, views, or Data API exposure
- run OpenAI, web crawl, search, measurement, or external API jobs
- change LP, Auth, middleware, handoff, public assets, or package lock files
- decide final table names, final SQL constraints, final indexes, final retention policy, final auth role model, or final physical DB split

## Recora five-part structure

Recora should be planned as five connected but separate surfaces/layers:

1. Customer-facing screen
   - The customer report/dashboard UI.
   - Reads only approved customer-facing published data by default.
   - Not changed by this PR.

2. Customer-facing published data
   - Published and approved data that customer UI can read.
   - Includes published reports, metrics, prompt summaries, answer excerpts, citations, recommendations, Page Brief, and Action Plan.
   - Must not expose raw, failed, incomplete, unverified, review-required, or internal-only data.

3. Customer Measurement DB
   - Stores actual measured result data.
   - Includes measurement runs, prompt snapshots, model-level answers, mentions, citations, source facts, metrics, and recommendation evidence.
   - Not the default customer-facing display surface.

4. Admin screen
   - Internal operator UI for measurement execution, publication review, reruns, visibility decisions, and operational checks.
   - Not changed by this PR.

5. Admin DB
   - Internal operation DB for contracts, plans, project ownership, selected models, measurement button/batch state, execution status, publication control, reviews, and logs.
   - Source of truth for mutable operational control.

The five-part structure maps onto the three-layer DB boundary:

| Five-part area | Three-layer responsibility |
| --- | --- |
| Customer-facing screen | UI consumer of Customer Published Read Model |
| Customer-facing published data | Customer Published Read Model |
| Customer Measurement DB | Customer Measurement DB |
| Admin screen | UI consumer/operator of Admin Control DB |
| Admin DB | Admin Control DB |

## Confirmed operation decisions

- Every customer should be measured daily.
- Daily measurement starts manually from the admin screen with one batch button.
- The batch button can run all customers/all projects.
- The operation also needs project-level execution for a single project.
- Operators must be able to see per-model measurement status and results.
- Plan question count is per day.
- Example: 100 questions x 2 models = 200 AI answers per day.
- AI model count depends on the customer's plan.
- Actual AI models are selected per project by an admin operator.
- After measurement, the base behavior is automatic publication.
- Later pre-publish checks are added before publication.
- When pre-publish checks exist, only passed data is automatically published.
- Failed measurements are stored as failed or incomplete, not silently dropped.
- Admin operators can rerun failed or incomplete parts.
- Failed parts are handled by admin rerun operation.
- Customers do not necessarily see full AI answer bodies.
- Admin operators choose which AI answer bodies or excerpts are visible to customers.
- Recommendations are automatically published to customers, subject to later safety/check rules.

## Open operation decisions

- Exact contents of pre-publish checks.
- Concrete AI model names available for selection.
- Whether model changes apply immediately, on the next daily run, or after approval.
- Partial failure publish thresholds.
- AI answer publication criteria.
- Minimum checks before recommendation auto-publish.
- Which customers or projects can be excluded from all-project batch execution.
- Model failure rerun scope: item, model, prompt, project, customer, or batch.
- Published data withdrawal and unpublish conditions.
- Retention period for customer-visible AI answer bodies and raw measured answer bodies.
- Whether project-level execution can override plan limits for support/debug cases.
- Whether customer-visible plan entitlement summaries should be projected.
- Whether failed or incomplete measurement status should ever appear to customers.
- Operator identity and audit taxonomy for future write-capable admin actions.

## End-to-end daily operation flow

1. Admin operator opens the admin screen.
2. Admin operator presses the batch measurement button.
3. Admin DB creates a measurement batch.
4. The system selects customers and projects for the run.
5. The system confirms each project plan and selected AI models.
6. The system creates measurement tasks from questions x models.
7. Measurement runs.
8. Successful results are saved to Customer Measurement DB.
9. Failed or incomplete results are saved as failed/incomplete.
10. Admin operator can rerun failures.
11. Data that passes pre-publish checks is projected to customer-facing published data.
12. Recommendations are automatically published to the customer-facing published data layer.
13. Admin operator chooses which AI answer bodies or excerpts are visible.
14. Customer-facing UI reads only customer-facing published data.

The flow intentionally separates execution, measured evidence, publication, and display. Customer-facing UI should not read raw admin job state or raw measured answer rows by default.

## Admin DB requirements

Admin DB must own the operation state needed to run Recora every day.

Required capabilities:

- customer and contract account references
- organization and project ownership source-of-truth
- customer plan assignment
- plan daily question count
- plan model-count limit
- selected AI models per project
- project daily measurement enabled/disabled flag
- active/inactive project state
- all-project and single-project measurement trigger state
- measurement batches
- measurement batch items or equivalent job items
- per-model execution status
- task status for prompt x model execution
- success, partial, failed, incomplete, canceled, and retry-ready states
- failed-item rerun targets
- pre-publish check results
- publish eligibility and block reason
- AI answer visible/hidden decision
- recommendation review/check state before customer publication, if later required
- admin operation logs
- internal notes and audit records with secret-safe retention rules

Likely missing or incomplete capabilities from the current readiness audits:

- durable worker/write flow for measurement batches and items
- first-class selected models per project
- first-class plan/model limits connected to daily measurement tasks
- first-class per-model task status and result linkage
- first-class failure rerun target and retry lineage
- first-class pre-publish check result model
- first-class answer visibility decision model
- complete recommendation review event model
- complete Page Brief and Action Plan draft/review workflow
- final admin operator identity model for future writes

Admin DB should not become the customer-facing report source. It can approve, block, and audit publication, but the customer-facing display snapshot belongs to Customer Published Read Model.

## Customer Measurement DB requirements

Customer Measurement DB must preserve official measured result data and enough context to explain what was measured.

Required capabilities:

- measurement run/result source references
- measurement date and period
- project and organization scope references
- selected models measured for the project/run
- prompts/questions measured
- prompt text at measurement time
- `prompt_type` at measurement time
- `measurement_purpose` at measurement time
- persona, use case, funnel stage, topic, and category at measurement time
- prompt-set version or materialized prompt version
- model-level AI answers
- answer status and timing
- brand mentions
- competitor mentions
- citations
- source metadata, owner/freshness values, and source-to-claim status where available
- metric snapshots with metric definition/version/provenance
- model-level result rows for comparison and failure analysis
- success, failed, partial, and incomplete result states
- recommendation evidence references
- traceability to source batch/job/run/item where safe and needed

Known gaps from the Customer Measurement DB readiness audit:

- no first-class measurement prompt snapshot table
- no run-time copy of official prompt scope and measurement purpose
- no run-time copy of persona/use-case/funnel-stage/topic/category metadata
- no prompt-set version or materialized prompt version
- metric version/provenance is not first-class
- projection tracking into Customer Published Read Model is not first-class
- recommendation evidence and review workflow separation is incomplete

Customer Measurement DB stores source evidence. Customer-facing display still needs a published snapshot boundary.

## Customer-facing published data requirements

Customer-facing published data is the Customer Published Read Model. It must contain approved, stable, display-safe snapshots.

Required published data:

- published report snapshots
- published measurement/result snapshots
- published prompt list or prompt summaries
- published AI answer bodies or excerpts selected for customer display
- published citation/source snapshots
- published metric snapshots
- published recommendations
- published Page Brief
- published Action Plan
- published date
- visibility state
- source references for traceability
- data version or snapshot version
- supersession/archive state for replaced snapshots

Customer-facing published data must exclude:

- unverified results
- failed or incomplete measurements
- internal notes
- raw/debug provider payloads
- admin review queue state
- unapproved recommendation candidates
- review-required, suppressed, hidden, or draft artifacts
- raw answers that were not selected for customer visibility

The customer-facing UI should read this layer by default. Any direct drill-down into Customer Measurement DB should still pass explicit publication and visibility gates.

## Measurement batch and job requirements

Logical entities to design later:

- `measurement_batch`
- batch scope such as `all_customers_all_projects` or `single_project`
- `measurement_job`
- `measurement_job_item`
- project reference
- prompt reference
- AI model reference
- task status
- started/completed/failed timestamps
- error summary
- retry lineage such as `retry_of`
- admin trigger reference
- trigger timestamp

Candidate status values:

- `queued`
- `running`
- `succeeded`
- `partial`
- `failed`
- `canceled`
- `retry_ready`

Do not over-decide final enum names in this docs-only PR. The important requirement is model-level granularity. A 100-question project with two selected models produces 200 answer tasks per day, and operators need to know which model/prompt items succeeded, failed, or need rerun.

## Plan and model requirements

Confirmed behavior:

- Question count is a per-day plan limit.
- AI model count is plan-dependent.
- A project has selected AI models chosen by admin.
- Daily answer volume is question count x selected model count.
- Example: 100 questions x 2 models = 200 answers/day.

DB capabilities needed:

- plan daily question limit
- plan max model count
- project selected models
- project daily measurement enabled flag
- project active/inactive state
- validation that selected model count is within the plan max model count
- traceability from measurement batch to the plan/model settings used at execution time
- optional customer-safe entitlement projection, if later needed for UI

Open decisions:

- concrete model names
- model catalog ownership and retirement rules
- whether plan/model changes apply immediately or next day
- whether support/admin can temporarily override a plan
- how suspended, paused, or trial projects are handled
- how excluded projects are represented in all-project batch runs

## Publication requirements

Confirmed behavior:

- Base behavior after measurement is automatic publication.
- Later pre-publish checks will be introduced.
- Once pre-publish checks exist, only data passing those checks should auto-publish.

DB capabilities needed:

- pre-publish check result
- publish eligibility flag/state
- published timestamp
- publish block reason
- published data version
- source measurement batch reference
- source measurement run reference
- source job/item references where needed
- projection/materialization tracking
- superseded/archived published snapshot state

Open decisions:

- exact pre-publish checks
- partial failure publication threshold
- who can override a publication block
- whether customer-visible report status can say data is delayed or incomplete
- withdrawal/unpublish conditions
- whether publication is per project, per report, per prompt group, per model, or per batch

## Failure and rerun requirements

Confirmed behavior:

- Successful measurements are saved.
- Failed measurements are saved as failed or incomplete.
- Admin can rerun failed parts.
- Failed parts are handled by admin rerun operation.

DB capabilities needed:

- failed job item records
- failure reason and error summary
- failure class, if later useful
- retry target
- retry batch
- `retry_of` lineage
- success count
- failed count
- incomplete count
- partial state on batch/job/project
- rerun result linkage back to the original failed item

Publication rule:

- Failed and incomplete results should not silently become customer-visible.
- Partial publication needs an explicit threshold and display rule before launch.

## AI answer visibility requirements

Confirmed behavior:

- Customers do not necessarily see full AI answer bodies.
- Admin chooses which answer body or excerpt is visible.

DB capabilities needed:

- answer visibility state
- visible/hidden decision
- reviewed by
- reviewed at
- visibility reason
- published answer snapshot
- answer excerpt/body selected for display
- source conversation/run item reference
- retention and deletion policy for raw answer body and published answer snapshot

Rules:

- Treat AI answer text as untrusted input.
- Do not expose raw answer bodies by default.
- Preserve enough source references to audit why an answer was shown.
- Use Customer Published Read Model for customer-facing answer display.

## Recommendation publishing requirements

Confirmed behavior:

- Recommendations are automatically published to customers.

DB capabilities needed:

- generated recommendation candidate
- customer-visible published recommendation snapshot
- source evidence references
- target prompt/topic/url references
- expected impact and priority fields
- generated timestamp
- published timestamp
- safety/check state, if later required
- suppression/hold reason, if not published
- supersession/versioning for revised recommendations
- Page Brief and Action Plan linkage when recommendations become implementation work

Rules:

- Recommendation candidates, quality-gate/review decisions, and published recommendations must stay separate.
- Customer-facing recommendations need traceable evidence.
- Provider failures, missing evidence, or unknown review state should not become confident customer-facing recommendations.

Open decisions:

- minimum safety checks before recommendation auto-publish
- whether some recommendation types require human review
- dangerous or unsupported recommendation suppression rules
- how Page Brief and Action Plan are generated, reviewed, and published

## Missing DB capabilities

Admin DB gaps:

- first-class measurement batch/job/item workflow for daily manual batch operation
- first-class all-project and single-project run scopes
- selected models per project
- plan daily question and max model-count linkage to execution
- project daily measurement enabled/disabled flag
- per-model task status
- failure rerun target and retry lineage
- pre-publish check result
- answer visibility review
- recommendation review/check events, if required before auto-publication
- durable admin operation logs for future writes

Customer Measurement DB gaps:

- measurement prompt snapshot
- prompt/persona/topic/use-case/funnel/category metadata snapshot
- prompt-set or materialized prompt version
- run-time official prompt scope and measurement purpose copy
- model-level result contract
- metric definition/version/provenance
- source owner/freshness/source-to-claim publication readiness
- recommendation evidence mapping
- projection/materialization tracking to Customer Published Read Model
- retention/archive/delete design for raw answers, citations, measured results, and evidence

Customer Published Read Model gaps:

- published report snapshot
- published measurement/result snapshot
- published prompt snapshot/list
- published answer snapshot
- published citation/source snapshot
- published metric snapshot
- customer-visible recommendation snapshot
- published Page Brief
- published Action Plan
- snapshot version
- published/hidden/superseded/archived visibility state
- source references from published data back to measured evidence and admin publication decisions

## Proposed DB work packages

1. Operational boundary alignment
   - Keep the five-part structure and three-layer DB responsibility model aligned.
   - Use this document as the source for daily operation assumptions.

2. Admin measurement batch/job design
   - Define batch, job, item, status, retry, scope, and admin trigger semantics.
   - Keep final SQL out of the design PR.

3. Plan and model entitlement design
   - Define plan daily question count, max model count, selected models per project, and project daily measurement flags.

4. Customer Published Read Model readiness audit
   - Read-only/docs-only audit for published report/read-model snapshot readiness.

5. Measurement prompt snapshot design
   - Define immutable measurement-time prompt, scope, persona/topic/category, model, and approval provenance.

6. Measurement result projection design
   - Define Admin DB execution state to Customer Measurement DB result source to Customer Published Read Model projection.

7. Report publication projection design
   - Define pre-publish checks, publication eligibility, published snapshots, blocking, supersession, and withdrawal.

8. AI answer visibility design
   - Define answer visibility review and published answer snapshot rules.

9. Recommendation publishing design
   - Define generated candidate, safety/check state, auto-published recommendation snapshot, Page Brief, and Action Plan linkage.

10. Local additive schema PRs
    - Add migrations only after docs/design PRs are approved.
    - Keep local migration, remote apply, dry-run/backfill, and UI work separate.

## Recommended PR sequence

1. `docs/operational-db-completion-plan`
   - This PR.
   - Docs-only daily operation and DB completion plan.

2. `docs/customer-published-read-model-readiness-audit`
   - Read-only/docs-only audit of published report/read-model snapshot readiness.

3. `docs/admin-measurement-batch-job-design`
   - Define Admin DB batch/job/item/status/rerun semantics.

4. `docs/plan-model-entitlement-boundary-design`
   - Define plan daily question limit, max model count, project selected models, and project daily measurement enablement.

5. `docs/measurement-prompt-snapshot-design`
   - Define immutable prompt/scope/persona/topic/category snapshot requirements.

6. `docs/measurement-result-projection-design`
   - Define Admin DB execution state to Customer Measurement DB result source to Customer Published Read Model projection.

7. `docs/report-publication-projection-design`
   - Define pre-publish checks, publication eligibility, published snapshots, and unpublish/supersede behavior.

8. `docs/ai-answer-visibility-design`
   - Define customer-visible answer body/excerpt review and snapshot rules.

9. `docs/recommendation-publishing-quality-gate-design`
   - Define recommendation auto-publish checks, holds, suppression, Page Brief, and Action Plan linkage.

10. `feat/admin-measurement-job-schema-local`
    - Local-only additive migration for Admin DB measurement batch/job/item workflow.
    - No remote apply.

11. `feat/project-selected-models-plan-limits-schema-local`
    - Local-only additive migration for selected models, daily measurement flag, and plan/model execution limits.
    - No remote apply.

12. `feat/measurement-prompt-snapshot-schema-local`
    - Local-only additive migration for measurement-time prompt snapshots.
    - No remote apply.

13. `feat/customer-published-report-snapshot-schema-local`
    - Local-only additive migration for Customer Published Read Model report and metric snapshots.
    - No remote apply.

14. `feat/customer-visible-recommendation-schema-local`
    - Local-only additive migration for published recommendations, Page Brief, and Action Plan snapshots.
    - No remote apply.

15. `chore/customer-published-read-model-rls-readiness-audit`
    - Read-only audit of customer-facing published snapshot grants, policies, helper functions, views, and advisors.

16. `chore/customer-measurement-db-rls-readiness-audit`
    - Read-only audit of measured-result data grants, tenant joins, policies, helper functions, views, and advisors.

17. `chore/admin-control-db-rls-readiness-audit`
    - Read-only audit of Admin DB grants, policies, service-role access, helper functions, and advisors.

Remote apply and backfill PRs:

- One explicit remote-apply checkpoint per approved migration.
- Stop before `supabase db push` until human approval.
- Keep backfill dry-run and backfill apply separate.
- Do not combine DB writes with UI or report display changes.

## Open questions

- What exact pre-publish checks must pass before auto-publication?
- Which concrete AI models are available, and how are retired/replaced models handled?
- How should model selection changes apply to daily runs?
- What partial failure threshold still allows publication?
- Should failed/incomplete measurement status ever be customer-visible?
- What is the minimum safety/check set before recommendation auto-publish?
- Which customers/projects can be excluded from all-project batch execution?
- What rerun scope should admin support: item, model, prompt, project, customer, or batch?
- What conditions should withdraw, hide, or supersede published data?
- How long should raw answer bodies and published answer snapshots be retained?
- Should customer-visible published data include entitlement/plan summaries?
- Should Customer Published Read Model be implemented as tables, security-invoker views, materialized snapshots, or a combination?
- Should Customer Measurement DB stay in `public`, move to a dedicated schema, or later become a physical split?
- What admin operator identity model is required before write-capable admin actions?
- What event taxonomy is needed for operation logs without exposing secrets or raw provider payloads?
