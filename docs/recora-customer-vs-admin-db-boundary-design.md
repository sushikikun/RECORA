# Recora Three-Layer DB Boundary Design

Status: Docs-only boundary design
Last updated: 2026-07-04

## Overview

This document defines Recora's target responsibility boundary across three logical data layers:

1. Admin Control DB
2. Customer Measurement DB
3. Customer Published Read Model

This is not a decision to physically split the Supabase project into three databases now. The goal is to fix the responsibility boundary, source-of-truth rules, projection rules, and RLS direction first. Later PRs can decide whether the boundary is implemented through schemas, tables, RLS policies, read-model tables, views, or a stronger physical split.

It follows:

- `docs/recora-customer-db-readiness-audit.md`
- `docs/recora-customer-org-project-boundary-design.md`
- `docs/recora-admin-db-current-state-audit.md`
- `docs/recora-report-data-readiness.md`
- `docs/recora-prompt-scope-db-migration-plan.md`
- `docs/recora-prompt-scope-backfill-review-record.md`
- `docs/recora-customer-measurement-db-readiness-audit.md` records the read-only readiness audit for the Customer Measurement DB measured-result source-of-truth layer.

The main rule is simple: Admin Control DB owns mutable internal workflow and operational control; Customer Measurement DB owns official measured result data; Customer Published Read Model owns the stable, approved, customer-facing snapshots read by customer screens.

This PR is docs-only. It does not create migrations, write to any database, run Supabase db push, apply backfill, change RLS/policies/grants, implement customer UI, implement admin UI, change Auth/middleware/LP/handoff files, or change `package-lock.json`.

## Scope

This document covers:

- the three-layer split between Admin Control DB, Customer Measurement DB, and Customer Published Read Model
- which entities belong to internal operations, measured source results, and published customer snapshots
- source-of-truth rules for contracts, jobs, measurements, publication, recommendations, prompts, and reports
- projection and snapshot rules between admin workflow, measured evidence, and customer-visible read models
- a data ownership matrix for later schema, RLS, and read-model PRs
- shared identifier and traceability rules
- RLS implications
- migration implications
- recommended PR sequence after this docs-only PR

## Non-goals

This document does not:

- implement customer-facing report UI
- implement admin UI
- add or edit database migrations
- run `supabase db push` or remote DB apply
- run UPDATE, INSERT, DELETE, seed, repair, reset, or backfill apply
- change RLS, policies, grants, helper functions, views, or Data API exposure
- run OpenAI, crawlers, search jobs, external API jobs, or measurements
- change LP, Auth, middleware, handoff, public assets, or package lock files
- decide final table names, final SQL constraints, final indexes, final retention policy, or final auth role model

## Architecture Split

Recora should treat the product boundary as three data layers plus customer/admin UI consumers.

| Layer or surface | Primary role | Source of truth? | Customer-visible? |
| --- | --- | --- | --- |
| Admin Control DB | Internal operations, contracts, ownership, execution, publication control, reviews, and audit logs. | Yes, for control and workflow state. | No direct customer display. |
| Customer Measurement DB | Official measured result source: prompt snapshots, AI answers, citations, mentions, metrics, and source metadata. | Yes, for measured result data. | Not directly by default; must pass readiness/publication gates. |
| Customer Published Read Model | Published, approved, display-safe report/read-model snapshots. | Yes, for customer-facing display snapshots. | Yes, for authorized customer screens. |
| Admin UI | Internal operator surface for control, review, and audit. | No; reads/writes approved admin paths later. | No direct customer display. |
| Customer-facing UI | Customer report/dashboard surface. | No; reads published read model only. | Yes. |

The current repository already has public measurement tables and a `recora_admin` schema. This design intentionally keeps final physical placement open. The same Supabase project may later hold schemas, tables, RLS policies, projection tables, or views that implement these responsibilities.

## Admin Control DB

Admin Control DB is the source of truth for internal operations, contracts, ownership, execution management, publication decisions, review workflows, and audit history.

Admin Control DB should own:

- customers and contract accounts
- organizations
- organization memberships
- project ownership and project configuration
- `plan_configs`
- customer subscriptions
- usage limits and quotas
- measurement trigger/button state
- measurement jobs, queues, retries, errors, and cost state
- worker execution status
- measurement run operational lifecycle
- project setup drafts
- generator raw output
- prompt approval and materialization controls
- report publication controls
- `admin_draft`, `review_required`, `customer_ready`, `hidden`, and `archived` workflow decisions
- recommendation review queues
- recommendation approval and dismissal workflow
- Page Brief and Action Plan drafts before publication
- admin audit logs
- internal operation logs
- internal notes
- OpenAI/provider raw or debug payloads if they are retained under a later approved policy

Admin Control DB should not be treated as:

- the source of truth for customer-facing published report content
- the direct read source for customer-facing UI
- the display boundary for approved AI answers, citations, metrics, recommendations, Page Brief, or Action Plan

## Customer Measurement DB

Customer Measurement DB is the source of truth for official measured result data. It preserves the result of what Recora actually measured for a customer/project, but it is not automatically the data surface that customer screens read.

Customer Measurement DB should own:

- customer / organization / project scope references needed for result ownership and RLS checks
- target brand and aliases used for the measured run
- known competitors used for the measured run
- approved/materialized prompts
- `prompt_type`
- `measurement_purpose`
- persona, use case, funnel stage, topic, and category used for measurement
- measurement result side of `measurement_runs`
- measurement prompt snapshots
- AI answers
- brand mentions
- competitor mentions
- citations
- metric snapshots
- source metadata
- source owner type and freshness when extracted for result storage
- sentiment, caveat, narrative, or source-to-claim labels if extracted and approved for result storage

Customer Measurement DB should not own:

- customer, organization, membership, or project ownership source-of-truth
- contract, subscription, billing, usage-limit, or quota source-of-truth
- measurement job, queue, retry, cost, worker, or button state
- publication control workflow
- recommendation review workflow
- admin notes or audit logs
- unapproved generated drafts
- customer-facing display state by itself

Customer Measurement DB can include `customer_id`, `organization_id`, or `project_id` references for scope and traceability. Those references do not make it the source of truth for ownership or membership.

## Customer Published Read Model

Customer Published Read Model is the only data layer that customer-facing report screens should read by default. It contains published, approved, display-safe, stable snapshots generated after measurement and publication review.

Customer Published Read Model should own:

- published report snapshots
- published measurement snapshots
- published prompt snapshots
- published AI answer snapshots
- published citation snapshots
- published metric snapshots
- customer-visible source snapshots
- approved customer-facing recommendations
- published Page Brief
- published Action Plan
- display-safe report summaries
- stable `snapshot_version`
- `published_at`
- visibility or published state
- source IDs for traceability

Customer Published Read Model should not own:

- unapproved drafts
- review-required data
- failed, partial, or unverified results
- admin review queues
- internal notes
- raw generator output
- OpenAI/provider debug payloads
- measurement job, retry, cost, or worker state
- plan/subscription source-of-truth
- admin audit logs

Customer Published Read Model is built from Customer Measurement DB result data after Admin Control DB publication approval. Its job is stable customer display, not operational control or raw evidence preservation.

## Source-Of-Truth Rules

| Data area | Admin Control DB | Customer Measurement DB | Customer Published Read Model | Source of truth | Projection needed | Customer-visible? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| customer / contract account | Contract account, billing/ops context, plan assignment. | Scope reference only if needed. | Sanitized display identity only if needed. | Admin Control DB | Optional entitlement/display projection. | Only sanitized fields. | Customer Measurement DB and read model do not own contracts. |
| organization / membership | Organization and membership source-of-truth. | Scope reference for measured results. | Scope reference for published reads. | Admin Control DB | Yes, for authorization checks. | Only through published read model. | Customer roles should not read admin membership internals. |
| project ownership | Project owner/config/source-of-truth. | Project reference for measured result. | Project reference for published snapshot. | Admin Control DB | Yes. | Yes, as display scope. | Snapshots reference projects but do not own configuration. |
| plan config / subscription / usage | Plans, subscriptions, limits, quotas, usage enforcement. | None, except result scope if relevant. | Optional customer-safe entitlement summary. | Admin Control DB | Optional. | Optional summary only. | Billing/ops details stay admin-owned. |
| measurement job / button | Button, trigger, queue, retry, worker, error, cost. | None. | None. | Admin Control DB | No direct customer projection. | No. | Only completed result status may become customer-safe later. |
| measurement run operational state | Lifecycle, retry/error, worker status, cost. | Result-side references after execution. | Published status only. | Admin Control DB | Yes, after completion/review. | Only published result status. | Do not expose operational errors by default. |
| measurement result | Operational context only. | Official measured result source. | Published result snapshot. | Customer Measurement DB | Yes. | Only after publication. | Includes answers, mentions, citations, metrics, and scope. |
| prompt draft / generator output | Draft, raw generator output, materialization control. | None until approved/materialized. | None. | Admin Control DB | Yes, approved prompt only. | No raw draft. | Raw generator output must not become customer data by default. |
| materialized prompt | Approval/materialization source and change history. | Approved prompt and measurement-time snapshot. | Published prompt summary/snapshot. | Customer Measurement DB for measured prompt data; Admin Control DB for approval workflow. | Yes. | Published summary only. | Historical measurements read measurement-time snapshots. |
| measurement prompt snapshot | Approval context. | Prompt text, scope, purpose, persona/topic/category at run time. | Published prompt snapshot/summary. | Customer Measurement DB | Yes. | Yes after publication. | Prevents later prompt edits from rewriting history. |
| AI answer | Provider/debug operations if retained. | Official answer body and model/run metadata. | Display-safe published answer snapshot. | Customer Measurement DB | Yes. | Yes after publication. | Treat answer text as untrusted input. |
| citation / source | Review/debug operations if retained. | URL/domain/source metadata/source-to-claim facts. | Display-safe published citation/source snapshot. | Customer Measurement DB | Yes. | Yes after publication. | Unknown/not-reviewed states stay explicit. |
| metric snapshot | Calculation job/QA state. | Official calculated metric value and metric version. | Published metric value/version. | Customer Measurement DB | Yes. | Yes after publication. | Do not recalculate historical published snapshots in place. |
| report publication control | Review history, blockers, operator decisions, visibility workflow. | Source result data for publication. | Published report snapshot. | Admin Control DB for approval; Published Read Model for display snapshot. | Yes. | Yes after publication. | Customer UI reads the published snapshot, not admin review rows. |
| published report snapshot | Publication decision reference. | Source measured result. | Customer-facing report snapshot. | Customer Published Read Model | Built from measurement and approval. | Yes. | Stable display contract for customers. |
| recommendation candidate/review | Candidate generation, quality gate, review, approve/dismiss, notes. | Evidence used by the candidate. | None until approved. | Admin Control DB for workflow. | Yes, approved only. | No candidate display. | Candidate generation is not publication. |
| approved recommendation | Approval decision. | Evidence references. | Approved customer-facing recommendation snapshot. | Customer Published Read Model for display; Admin Control DB for approval history. | Yes. | Yes. | Preserve source evidence references. |
| Page Brief / Action Plan draft | Draft, review queue, rejected versions, operator edits. | Evidence inputs. | None until approved. | Admin Control DB | Yes, approved only. | No draft display. | Separate drafts from customer artifacts. |
| published Page Brief / Action Plan | Approval decision reference. | Evidence inputs. | Published artifact snapshot. | Customer Published Read Model | Yes. | Yes. | Version and supersede, do not mutate history silently. |
| audit log | Operation events, internal notes, prompt change events, admin audit logs. | None, except traceable source IDs. | Usually none; optional customer-safe history later. | Admin Control DB | Usually no. | No raw admin audit. | Retention policy needs later design. |
| internal debug/raw payload | Retained only under internal policy. | None unless normalized into approved result fields. | None. | Admin Control DB | No. | No. | Never expose secrets/debug payloads. |

Rules:

- Contracts, plans, usage limits, customer/org/membership/project ownership, measurement execution, publication workflow, recommendation review workflow, cost state, and audit logs are Admin Control DB concerns.
- Official measured AI answers, citations, brand/competitor mentions, source metadata, prompt snapshots, and metrics are Customer Measurement DB concerns.
- Customer-facing reports, metrics, AI answers, citations, recommendations, Page Brief, and Action Plan are Customer Published Read Model concerns after publication.
- Customer Published Read Model is created after Admin Control DB approval and from Customer Measurement DB result data.
- Customer-facing UI should read Customer Published Read Model by default.
- If customer-facing UI must inspect Customer Measurement DB for drill-down, it should still pass a published/visibility gate.
- Customer-facing UI should not read Admin Control DB directly.

## Projection And Snapshot Rules

Projection turns measured source data and approved admin decisions into customer-visible snapshot state. The projection should be explicit, auditable, and conservative.

Measurement flow:

1. Admin Control DB owns measurement button, job, queue, retry, cost, and worker status.
2. Customer Measurement DB stores completed measurement results, prompt snapshots, AI answers, citations, source metadata, and metrics.
3. Admin Control DB owns publication/review decisions.
4. Customer Published Read Model stores published reports, answers, citations, metrics, recommendations, Page Brief, and Action Plan.
5. Customer-facing UI reads Customer Published Read Model.

Report flow:

- Admin Control DB owns publication control, `admin_draft`, `review_required`, `customer_ready`, and `hidden` decisions.
- Customer Measurement DB owns the measured source result data.
- Customer Published Read Model owns the customer-visible report snapshot.

Recommendation flow:

- Admin Control DB owns recommendation candidates, quality-gate review, approval, dismissal, and internal notes.
- Customer Measurement DB owns the evidence and result data used to support the recommendation.
- Customer Published Read Model owns approved customer-facing recommendations, published Page Brief, and published Action Plan.

Prompt flow:

- Admin Control DB owns project setup drafts, generator raw output, approval, and materialization controls.
- Customer Measurement DB owns approved/materialized prompts and measurement-time prompt snapshots.
- Customer Published Read Model owns published prompt summaries or prompt snapshots shown in the report.

Snapshot rules:

- Store customer-visible values that were used at publication time.
- Preserve prompt text, `prompt_type`, `measurement_purpose`, persona/use_case/funnel_stage/topic/category, and model/run references at measurement time.
- Preserve citation URLs/domains, owner type, freshness, source-to-claim status, and unknown/not-reviewed states as explicit values.
- Preserve metric values and metric contract/version used for the report.
- Do not rewrite historical customer snapshots when prompt definitions, plan configs, admin notes, or recommendation candidates change later.
- Supersede snapshots with a new version when a customer-visible report is republished.

## Data Model Direction

Potential Admin Control DB entities include:

- `admin_customers` or `customers`
- `organizations`
- `organization_memberships`
- `projects`
- `plan_configs`
- `subscriptions`
- `usage_limits`
- `measurement_jobs`
- `measurement_run_operations`
- `project_setup_drafts`
- `generator_outputs`
- `materialization_controls`
- `report_publication_controls`
- `recommendation_reviews`
- `page_brief_drafts`
- `action_plan_drafts`
- `admin_audit_logs`

Potential Customer Measurement DB entities include:

- `measurement_runs`
- `run_items`
- `customer_measurement_results`
- `measurement_prompt_snapshots`
- `customer_ai_answers`
- `customer_brand_mentions`
- `customer_competitor_mentions`
- `customer_citations`
- `customer_source_metadata`
- `customer_metric_snapshots`
- measured sentiment/caveat/narrative labels
- source-to-claim review facts

Potential Customer Published Read Model entities include:

- `published_report_snapshots`
- `published_measurement_snapshots`
- `published_prompt_snapshots`
- `published_ai_answer_snapshots`
- `published_citation_snapshots`
- `published_source_snapshots`
- `published_metric_snapshots`
- `published_recommendations`
- `published_page_briefs`
- `published_action_plans`

These names are not final. The fixed role is the responsibility boundary.

## Shared Identifiers And References

Customer Measurement DB and Customer Published Read Model should retain source references for traceability, while customer-facing displays should prefer snapshot contents over live admin/internal rows.

Recommended source reference fields:

- `source_customer_id`
- `source_organization_id`
- `source_project_id`
- `source_measurement_run_id`
- `source_prompt_id`
- `source_report_id`
- `source_run_item_id`, if needed for answer-level traceability
- `source_conversation_id`, if needed for citation/mention traceability
- `source_recommendation_candidate_id`, if needed for review traceability
- `snapshot_version`
- `published_at`
- `published_by` or internal actor reference, if later approved for admin audit only

Rules:

- Customer-facing UI should not expose raw Admin Control DB IDs as the primary display contract.
- Consider stable public display IDs for reports and snapshots.
- Keep enough source references to audit how a published customer snapshot was produced.
- Deletion, retention, archival, and customer data export policy require a later design.

## RLS Implications

Admin Control DB RLS expectations:

- Customer roles should not read Admin Control DB directly.
- Internal operator and server-side access need explicit RLS/authorization design.
- Service-role operations must stay server/internal only.
- Publication and recommendation review workflows are not customer role capabilities.
- Admin write actors, operator identity, retention, and audit taxonomy need a later design.

Customer Measurement DB RLS expectations:

- Rows need explicit customer/organization/project scope references or tested join paths.
- Customer Measurement DB may include raw or near-raw measured result data, so direct customer display should be conservative.
- Customer access should require tenant/project scope and a published/readiness gate when exposed.
- Failed, partial, seed, hidden, or review-required result data must not leak through direct table reads or derived joins.
- Views, if used, should be security-invoker unless a later RLS audit approves another shape.

Customer Published Read Model RLS expectations:

- This is the primary customer-facing read surface.
- RLS should be as simple as possible: organization/project membership plus published visibility state.
- `anon` should not read production customer data unless a later explicit public-share design exists.
- Only `customer_visible` / published snapshots should be readable.
- Hidden, revoked, archived, draft, review-required, and superseded states need explicit rules.
- Customer A must not read Customer B data through direct table access, joins, report URLs, or derived read models.

SECURITY DEFINER expectations:

- Do not place broad SECURITY DEFINER access in public/exposed schemas without a dedicated review.
- Do not use SECURITY DEFINER as a shortcut for customer data access.
- If helper functions are needed, they require a separate RLS/security design PR.

This PR does not change RLS, policies, grants, helper functions, views, or Data API exposure.

## Migration Implications

This document implies later migration/design PRs, but it does not create migrations.

Customer Measurement DB migration candidates:

- measurement prompt snapshot schema
- prompt metadata schema
- customer/project scope references for measured results
- source owner type and freshness
- measured answer/citation/metric source result schema if missing

Customer Published Read Model migration candidates:

- published report snapshot schema
- published measurement snapshot schema
- published AI answer/citation/metric snapshot schema
- customer-visible recommendation schema
- published Page Brief / Action Plan schema
- visibility state
- snapshot version
- published timestamp

Admin Control DB migration candidates:

- report publication control schema
- measurement job schema
- recommendation review workflow schema
- Page Brief / Action Plan draft schema
- subscription / usage linkage schema
- admin audit log schema
- organization / membership / project ownership schema if missing

Shared/bridge migration candidates:

- projection/materialization tracking
- published snapshot source mapping
- traceability source IDs
- archive/delete/retention policy support

Migration constraints:

- Keep migrations additive where possible.
- Keep migration, remote apply, and backfill/apply as separate PRs.
- Stop before remote apply until there is explicit human approval.
- Validate row counts, null/unknown handling, foreign keys, duplicate prevention, and tenant boundaries before remote apply.
- Do not backfill prompt scope automatically; the current review record has `safe_explicit_candidate = 0` and `apply_candidate = 0`.

## Recommended PR Sequence

1. `docs/customer-vs-admin-db-boundary-design`
   - This PR.
   - Docs-only three-layer responsibility boundary.

2. `docs/customer-measurement-db-readiness-audit`
   - Read-only/docs-only audit of Customer Measurement DB source-of-truth readiness.
   - Confirm measurement runs, prompts, AI answers, citations, metrics, source metadata, and scope references.
   - No DB write.

3. `docs/customer-published-read-model-readiness-audit`
   - Read-only/docs-only audit of Customer Published Read Model readiness.
   - Confirm published report snapshots, published answers, published citations, published metrics, approved recommendations, Page Brief, and Action Plan boundaries.
   - No DB write.

4. `chore/customer-published-read-model-rls-readiness-audit`
   - Read-only audit of the customer-facing published read model, grants, policies, helper functions, views, and advisors.

5. `chore/customer-measurement-db-rls-readiness-audit`
   - Read-only audit of measured result source data, tenant joins, grants, policies, helper functions, views, and advisors.

6. `chore/admin-control-db-rls-readiness-audit`
   - Read-only audit of Admin Control DB schema grants, policies, service-role RPC exposure, and advisor output.

7. `docs/measurement-result-projection-design`
   - Define Admin measurement job -> Customer Measurement DB -> Customer Published Read Model projection.

8. `docs/report-publication-projection-design`
   - Define report publication state, internal review history, and published report snapshot ownership.

9. `feat/measurement-prompt-snapshot-schema-local`
   - Local-only migration for measurement-time prompt snapshots.
   - No remote apply.

10. `feat/customer-published-report-snapshot-schema-local`
    - Local-only migration for published customer report snapshots.
    - No remote apply.

11. `feat/customer-source-snapshot-schema-local`
    - Local-only migration for customer source/citation snapshots, owner type, freshness, and source-to-claim display metadata.
    - No remote apply.

12. `feat/customer-visible-recommendation-schema-local`
    - Local-only migration for approved customer-visible recommendations, Page Brief, and Action Plan snapshots.
    - No remote apply.

13. `feat/admin-report-publication-control-schema-local`
    - Local-only migration for Admin Control DB report publication controls.
    - No remote apply.

14. `feat/admin-measurement-job-schema-local`
    - Local-only migration for Admin Control DB measurement button/job/run operation state.
    - No remote apply.

15. `feat/admin-recommendation-review-schema-local`
    - Local-only migration for Admin Control DB recommendation review workflow.
    - No remote apply.

16. `docs/plan-subscription-usage-boundary-design`
    - Docs-only contract/usage/quota boundary and customer-safe entitlement projection design.

Remote apply PRs:

- One explicit remote-apply checkpoint per approved migration.
- Stop before `supabase db push` until human approval.

Projection/backfill dry-run/apply PRs:

- Separate dry-run and apply checkpoints per field group.
- Prompt scope backfill remains on hold until a human review explicitly approves concrete rows.

## Open Decisions

- Should these layers stay in one Supabase project through schemas/RLS/read models, or later become a physical split?
- Should Customer Measurement DB live in `public`, a dedicated schema, or a future separate database?
- Should Customer Published Read Model be tables, security-invoker views, materialized snapshots, or a combination?
- Which fields are required in the first published report snapshot MVP?
- Which source owner/freshness and source-to-claim fields belong in Customer Measurement DB versus Published Read Model?
- How should Page Brief and Action Plan versions relate to recommendation review events?
- What is the durable admin operator identity model for future writes?
- What customer-safe entitlement data, if any, should be projected from Admin Control DB plan/subscription state?
- What are the retention, archive, and deletion rules for raw evidence, measured result data, published snapshots, and admin audit logs?
- Which RLS policies and helper functions are safe enough for launch after the dedicated audits?
