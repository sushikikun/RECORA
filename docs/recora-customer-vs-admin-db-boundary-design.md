# Recora Customer Vs Admin DB Boundary Design

Status: Docs-only boundary design
Last updated: 2026-07-02

## Overview

This document defines the target split between Recora customer-facing data and Recora admin/internal operations data.

It follows:

- `docs/recora-customer-db-readiness-audit.md`
- `docs/recora-customer-org-project-boundary-design.md`
- `docs/recora-admin-db-current-state-audit.md`
- `docs/recora-report-data-readiness.md`
- `docs/recora-prompt-scope-db-migration-plan.md`
- `docs/recora-prompt-scope-backfill-review-record.md`

The main rule is simple: customer-facing screens should read approved, customer-visible snapshots. Admin/internal screens should own mutable workflow, contract, execution, review, and publication-control state. Data may refer to the same organization, project, prompt, run, or report, but the source of truth is different depending on whether the data is customer-visible evidence or internal operational state.

This PR is docs-only. It does not create migrations, write to any database, run Supabase db push, apply backfill, change RLS/policies/grants, implement customer UI, implement admin UI, change Auth/middleware/LP/handoff files, or change `package-lock.json`.

## Scope

This document covers:

- the four-way split between customer-facing UI, customer DB, admin UI, and admin DB
- which entities belong to customer-visible result snapshots
- which entities belong to admin/internal operations
- source-of-truth rules for contracts, jobs, publication, recommendations, prompts, and reports
- projection and snapshot rules between admin-owned workflow and customer-visible records
- a data ownership matrix for the next schema and RLS PRs
- customer DB and admin DB data model direction
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
- change RLS, policies, grants, helper functions, or Data API exposure
- run OpenAI, crawlers, search jobs, external API jobs, or measurements
- change LP, Auth, middleware, handoff, public assets, or package lock files
- decide final table names, final SQL constraints, final indexes, final retention policy, or final auth role model

## Architecture split

Recora should treat the product boundary as four cooperating surfaces.

| Surface | Japanese label | Primary role | Owns mutable workflow? | Owns customer-visible evidence? |
| --- | --- | --- | --- | --- |
| Customer-facing UI | 顧客用画面 | Shows approved reports, AI answers, citations, metrics, and recommendations to authorized customers. | No | Reads customer DB snapshots only. |
| Customer DB | 顧客用DB | Stores durable customer-visible measurement/report snapshots and approved artifacts. | No, except publication-safe snapshot lifecycle. | Yes |
| Admin UI | 管理用画面 | Lets internal operators manage contracts, measurement execution, publication decisions, and review queues. | Yes | No direct customer display. |
| Admin DB | 管理用DB | Stores internal operations, contract, execution, review, publication-control, logs, and drafts. | Yes | Projects approved outputs to customer DB. |

The current repository already has public measurement tables and a `recora_admin` schema. This design does not require an immediate schema split by physical database. It defines ownership boundaries first. Later PRs can decide whether the customer/admin separation stays as schemas and RLS boundaries inside one Supabase project or becomes a stronger physical split.

## Customer-facing UI responsibilities

Customer-facing UI is responsible for displaying only customer-approved data. It should show:

- customer-ready reports
- measured AI answers approved for the report context
- visible brand mentions and competitor mentions
- citations, source URLs, source domains, owner type, and freshness that are safe for customer display
- metric snapshots such as AI presence rate, ranking, and SOV
- approved recommendations
- approved Page Brief
- approved Action Plan

Customer-facing UI must not:

- read admin drafts as display data
- infer report publication from internal workflow rows alone
- display raw generator output
- display candidate-only recommendations as approved actions
- display hidden, review-required, admin-draft, failed, seed, debug, or internal reports
- expose service-role operational data, error bodies, internal notes, or cost/debug traces

Customer-facing UI is out of scope for this PR.

## Customer DB responsibilities

Customer DB owns the customer-visible truth for reports and measurements after review/publication. It should store immutable or append-only snapshots of what the customer is allowed to see.

Customer DB should own:

- published customer report snapshots
- customer-visible measurement result snapshots
- measurement prompt snapshots
- prompt text at measurement time
- `prompt_type` at measurement time
- `measurement_purpose` at measurement time
- persona, use case, funnel stage, topic, and category at measurement time
- AI answers shown to the customer
- brand mentions shown to the customer
- competitor mentions shown to the customer
- citations shown to the customer
- source URLs and domains shown to the customer
- source `owner_type` shown to the customer
- source freshness shown to the customer
- metric snapshots shown to the customer
- AI presence rate, ranking, and SOV snapshots
- sentiment, caveat, and narrative snapshots when approved
- approved customer-facing recommendations
- approved customer-facing Page Brief
- approved customer-facing Action Plan

Customer DB should not own:

- `plan_configs`
- subscriptions or billing operations
- usage-limit enforcement logic
- measurement button state
- job queues
- worker execution state
- retry or error operational state
- admin review queues
- recommendation approval workflow state
- report publication control workflow state
- internal notes
- internal audit logs
- raw generator output
- unapproved drafts or recommendations
- raw/debug payloads
- service-role operational data

## Admin UI responsibilities

Admin UI is responsible for internal operations and human review. It should support internal operators who need to:

- confirm customer contracts and plan assignments
- inspect subscription and usage-limit status
- trigger or schedule measurements
- inspect measurement job lifecycle and worker status
- retry or suppress failed operational runs
- review generated prompt/project setup drafts
- decide whether a report can be published
- review recommendation candidates
- approve, dismiss, hide, or archive recommendations
- review Page Brief and Action Plan drafts before publication
- inspect internal notes, operation events, and audit trails

Admin UI must not be treated as a customer display boundary. If an operator approves a report or recommendation, that decision should create or update an explicit customer-visible projection/snapshot. Customer-facing UI should not read admin workflow rows directly.

Admin UI is out of scope for this PR.

## Admin DB responsibilities

Admin DB owns internal mutable operations and workflow state. It should be the source of truth for:

- customers and contract accounts
- organizations and memberships when used for internal/customer access control
- project ownership and project configuration
- `plan_configs`
- customer subscriptions
- usage limits and quotas
- measurement trigger/button state
- measurement jobs, queues, retries, and errors
- worker status
- run lifecycle and operational status
- project setup drafts
- generator raw output
- prompt approval and materialization controls
- report publication controls
- `admin_draft`, `review_required`, `customer_ready`, `hidden`, and `archived` workflow decisions
- recommendation review queues
- recommendation approval and dismissal decisions
- Page Brief and Action Plan drafts before publication
- internal notes
- operation logs
- audit logs
- cost/debug traces
- service-role operational data

Admin DB should project only approved, customer-safe outputs into Customer DB. It must not rely on customer-facing snapshots to reconstruct the complete internal workflow history.

## Source-of-truth rules

| Area | Source of truth | Customer-visible output |
| --- | --- | --- |
| Contracts and plan limits | Admin DB | Optional customer-safe entitlement summary only. |
| Subscription/billing operations | Admin DB | Optional read-only plan/entitlement projection, no billing internals. |
| Usage-limit enforcement | Admin DB | Optional consumed/remaining display projection after design approval. |
| Measurement job and execution state | Admin DB | Completed customer measurement snapshot. |
| Publication decision | Admin DB | Published customer report snapshot. |
| Recommendation review state | Admin DB | Approved customer recommendation snapshot. |
| Page Brief / Action Plan review | Admin DB | Approved customer Page Brief / Action Plan snapshot. |
| Prompt draft/generator/materialization | Admin DB | Measurement-time prompt snapshot. |
| Customer-visible AI answers/citations/metrics | Customer DB snapshot | Customer-facing UI reads these snapshots. |
| Historical reports | Customer DB snapshot | Reproducible customer view, independent of later admin edits. |

Rules:

- Contracts, limits, jobs, execution state, publication decisions, and recommendation review state are Admin DB concerns.
- Customer-visible measurement results, AI answers, citations, source metadata, and metrics are Customer DB snapshot concerns.
- Approved recommendations, Page Brief, and Action Plan are approved in Admin DB, then projected to Customer DB as published snapshots.
- Historical reports should remain reproducible from Customer DB snapshots.
- Admin drafts and internal workflow state must not be exposed directly to customers.
- Candidate generation is not a publication decision.
- A report is not customer-visible until a publication workflow explicitly projects a customer-ready snapshot.

## Projection and snapshot rules

Projection turns approved admin/internal state into customer-visible snapshot state. The projection should be explicit, auditable, and conservative.

| Flow | Admin-owned state | Customer-owned projection |
| --- | --- | --- |
| Measurement | Job, queue, worker, retry, run lifecycle, error state. | Completed result, prompt, answer, citation, source, and metric snapshots. |
| Report | Publication workflow, review history, internal notes, blockers. | Published report snapshot with stable display content. |
| Recommendation | Candidate, quality gate, admin review, internal note. | Approved recommendation, Page Brief, and Action Plan snapshots. |
| Prompt | Draft, generator output, approval/materialization controls. | Prompt snapshot used for measurement/report. |
| Plan/subscription | Plan config, subscription, billing/ops, limit enforcement. | Usually none; only customer-safe entitlement/visibility projection if needed. |

Snapshot rules:

- Store the customer-visible values that were used at publication time.
- Preserve prompt text, `prompt_type`, `measurement_purpose`, persona/use_case/funnel_stage/topic/category, and model/run references at measurement time.
- Preserve citation URLs/domains, owner type, freshness, source-to-claim status, and unknown/not-reviewed states as explicit values.
- Preserve metric values and metric contract/version used for the report.
- Do not rewrite historical customer snapshots when prompt definitions, plan configs, admin notes, or recommendation candidates change later.
- Supersede snapshots with a new version when a customer-visible report is republished.

## Data ownership matrix

| Data area | Customer DB ownership | Admin DB ownership | Projection rule |
| --- | --- | --- | --- |
| Customer / contract account | Customer-safe display identifiers only if needed. | Contract account, plan assignment, billing/ops metadata. | Project only sanitized customer identity/entitlement fields when required. |
| Organization / membership | Tenant boundary for customer reads. | Internal access-control and operator workflow context when needed. | Customer reads require membership/project boundary; admin internals stay hidden. |
| Project | Report/result scope reference and customer-visible project metadata. | Project setup, operational config, internal status, draft setup. | Customer snapshots reference project but do not expose internal config. |
| Plan / subscription | Optional customer-safe entitlement summary. | Plan configs, subscriptions, limits, quota enforcement. | No customer DB row unless display/entitlement requires it. |
| Measurement job | No. | Trigger, queue, worker, retry, error, run lifecycle. | Completed result snapshot only after success/review. |
| Measurement result | Customer-visible result snapshot. | Execution trace and internal operational state. | Snapshot AI answers, mentions, citations, metrics, and scope at report time. |
| Prompt draft / generator output | No. | Drafts, raw generator output, materialization controls. | Only approved prompt snapshot reaches Customer DB. |
| Measurement prompt snapshot | Prompt text and scope metadata at measurement time. | Prompt approval/materialization source and change history. | Snapshot from approved/materialized prompt used for the run. |
| AI answers | Answers shown to customer. | Raw/debug/provider details if needed for operations. | Customer snapshot stores visible answer body and display metadata only. |
| Brand mentions | Customer-visible mention facts. | Internal extraction/review traces if needed. | Snapshot approved visible mentions with source run references. |
| Competitor mentions | Customer-visible competitor mention facts. | Competitor configuration/review traces. | Snapshot approved visible competitor evidence. |
| Citations / sources | Customer-visible URL/domain, owner type, freshness, support status. | Raw extraction/debug/review details. | Snapshot approved source metadata; keep unknown explicit. |
| Metrics | Customer-visible metric snapshots and metric versions. | Calculation jobs, validation status, internal QA notes. | Snapshot published values; do not recalculate historical reports in place. |
| Recommendations | Approved customer-facing recommendations. | Candidate generation, review, approval/dismissal, internal notes. | Project only approved/published recommendation artifacts. |
| Page Brief / Action Plan | Approved customer-facing artifacts. | Drafts, review queue, operator edits, rejected versions. | Publish approved snapshot versions only. |
| Report publication control | Published report snapshot and visible state. | Publication review history, blockers, operator decisions. | Admin decision creates customer-ready snapshot; internal rows stay hidden. |
| Audit log | Usually no; only customer-safe history if later designed. | Operation events, internal notes, prompt change events, audit logs. | Do not expose raw admin audit logs to customers. |

## Customer DB data model direction

Potential Customer DB entities include:

- `customer_report_snapshots`
- `customer_measurement_snapshots`
- `customer_prompt_snapshots`
- `customer_ai_answer_snapshots`
- `customer_brand_mentions`
- `customer_competitor_mentions`
- `customer_citation_snapshots`
- `customer_source_snapshots`
- `customer_metric_snapshots`
- `customer_visible_recommendations`
- `customer_page_brief_snapshots`
- `customer_action_plan_snapshots`

These names are not final. The fixed role is customer-visible measured results and published snapshots.

Priority order:

1. Customer report snapshot.
2. Measurement prompt snapshot.
3. Customer metric snapshots.
4. Customer AI answer, citation, and source snapshots.
5. Source owner/freshness and source-to-claim display metadata.
6. Customer-visible recommendations.
7. Customer-visible Page Brief and Action Plan.

Design constraints:

- Prefer additive migrations.
- Keep raw evidence immutable.
- Represent `null`, `unknown`, `not_reviewed`, and `absent` explicitly.
- Preserve source IDs for traceability without making admin IDs part of the customer contract.
- Keep customer snapshots stable after publication.

## Admin DB data model direction

Potential Admin DB entities include:

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

These names are not final. The fixed role is internal operations, contract management, execution management, publication control, and human review.

Priority order:

1. Report publication control.
2. Measurement job/run operation state.
3. Recommendation review workflow.
4. Customer/project ownership and internal status.
5. Plan/subscription/usage linkage.
6. Admin audit log.
7. Project setup drafts and generator output retention.

Design constraints:

- Admin DB should preserve review history and rejected/held candidates.
- Admin workflow state should be mutable only through approved server/internal paths.
- Customer roles should not read admin DB tables directly.
- Service-role usage should stay server/internal only and should be audited separately.
- Admin notes must not store secrets, raw sensitive provider payloads, or customer-visible facts that lack a publication path.

## Shared identifiers and references

Customer snapshots should retain source references for traceability, but customer-facing displays should prefer snapshot contents over live admin/internal rows.

Recommended source reference fields:

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

- Customer-facing UI should not expose raw Admin DB IDs as the primary display contract.
- Consider stable public display IDs for reports and snapshots.
- Keep enough source references to audit how a published customer snapshot was produced.
- Deletion, retention, archival, and customer data export policy require a later design.

## RLS implications

Customer DB RLS expectations:

- Authenticated users can read only snapshots for organizations/projects where they are members.
- `anon` should not read production customer data unless a later explicit public-share design exists.
- Customer reads require both tenant boundary and publication/snapshot state.
- Customer roles must not see admin drafts, internal notes, debug payloads, review queues, hidden reports, or review-required artifacts.
- Views, if used, should be tenant-safe and preferably security-invoker unless a later RLS audit approves another shape.
- SECURITY DEFINER helpers must be intentionally scoped and audited.

Admin DB RLS expectations:

- Admin/internal tables are for internal operators and server-side operations only.
- Customer roles should not have direct table grants for admin/internal data.
- Service-role operations must stay server/internal only.
- Admin write actors, operator identity, retention, and audit taxonomy need a later design.

Separate read-only RLS audits should be done before customer launch:

- `chore/customer-db-rls-readiness-audit`
- `chore/admin-db-rls-readiness-audit`

This PR does not change RLS, policies, grants, helper functions, views, or Data API exposure.

## Migration implications

This document implies later migration/design PRs, but it does not create migrations.

Customer DB migration candidates:

- customer report snapshot
- measurement prompt snapshot
- customer metric snapshot
- customer AI answer/citation/source snapshots
- source owner/freshness and source-to-claim display fields
- customer-visible recommendations
- customer-visible Page Brief and Action Plan

Admin DB migration candidates:

- report publication control
- measurement job/run operation state
- recommendation review workflow
- Page Brief and Action Plan drafts
- subscription/usage linkage
- admin audit log
- organization/membership/project ownership improvements if missing

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

## Recommended PR sequence

1. `docs/customer-vs-admin-db-boundary-design`
   - This PR.
   - Docs-only.

2. `chore/customer-db-rls-readiness-audit`
   - Read-only audit of customer-facing snapshot/table RLS, grants, policies, exposed functions, helpers, views, and advisors.

3. `chore/admin-db-rls-readiness-audit`
   - Read-only audit of admin/internal schema grants, policies, service-role RPC exposure, and advisor output.

4. `docs/measurement-result-projection-design`
   - Define how admin measurement job lifecycle projects into customer measurement result snapshots.

5. `docs/report-publication-projection-design`
   - Define report publication state, internal review history, and customer-facing report snapshots.

6. `feat/customer-report-snapshot-schema-local`
   - Local-only migration for customer report snapshots.
   - No remote apply.

7. `feat/measurement-prompt-snapshot-schema-local`
   - Local-only migration for measurement-time prompt snapshots.
   - No remote apply.

8. `feat/customer-source-snapshot-schema-local`
   - Local-only migration for customer source/citation snapshots, owner type, freshness, and source-to-claim display metadata.
   - No remote apply.

9. `feat/customer-visible-recommendation-schema-local`
   - Local-only migration for approved customer-visible recommendations, Page Brief, and Action Plan snapshots.
   - No remote apply.

10. `feat/admin-report-publication-control-schema-local`
    - Local-only migration for internal report publication controls.
    - No remote apply.

11. `feat/admin-measurement-job-schema-local`
    - Local-only migration for internal measurement job/run operation state.
    - No remote apply.

12. `feat/admin-recommendation-review-schema-local`
    - Local-only migration for recommendation review workflow.
    - No remote apply.

13. `docs/plan-subscription-usage-boundary-design`
    - Docs-only contract/usage/quota boundary and customer-safe entitlement projection design.

14. Remote apply PRs
    - One explicit remote-apply checkpoint per approved migration.
    - Stop before `supabase db push` until human approval.

15. Projection/backfill dry-run/apply PRs
    - Separate dry-run and apply checkpoints per field group.
    - Prompt scope backfill remains on hold until a human review explicitly approves concrete rows.

## Open decisions

- Should customer-facing snapshots live in `public`, a dedicated customer schema, or a future separate customer DB?
- Should report publication state be represented as a customer report snapshot table, a read-model table, or a projection from admin publication controls?
- Which fields are required in the first customer report snapshot MVP?
- Should source owner/freshness live in source snapshot rows, source domain rows, or a derived read model?
- How should Page Brief and Action Plan versions relate to recommendation review events?
- What is the durable admin operator identity model for future writes?
- What customer-safe entitlement data, if any, should be projected from plan/subscription state?
- What are the retention, archive, and deletion rules for raw evidence, customer snapshots, and admin audit logs?
- Which customer RLS policies and helper functions are safe enough for launch after the dedicated audit?
