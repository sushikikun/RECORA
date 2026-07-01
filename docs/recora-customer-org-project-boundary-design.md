# Recora Customer Organization Project Boundary Design

Status: Docs-only boundary design
Last updated: 2026-07-02

## Overview

This document defines the target customer, organization, membership, project, and report visibility boundaries for the Recora customer DB completion track.

It follows `docs/recora-customer-db-readiness-audit.md`, which identified customer/org/project boundary, RLS/customer visibility, report publication state, and measurement prompt snapshot as P0 gaps. This design handles the first of those gaps: what must be treated as the durable tenant and project boundary before RLS audit, report publication migration, prompt snapshot design, or customer-facing UI work can proceed.

This PR is docs-only. It does not create a migration, write to any database, run Supabase db push, apply backfills, implement UI, implement auth, change middleware, or modify LP/Auth/handoff areas.

## Scope

This document covers:

- target ownership for customer, organization, membership, project, and report visibility
- definitions for customer, organization, organization membership, project, brand, competitor, prompt, measurement run, report, and recommendation
- relationship model for current and target entities
- project-owned data and required join paths
- report visibility states and customer-display rules
- membership roles as a design input for later RLS work
- RLS boundary expectations for the next read-only audit
- internal-only data that must not become customer-visible
- migration implications and suggested PR sequence

## Non-goals

This document does not:

- create or edit DB migrations
- run DB writes, UPDATE, INSERT, DELETE, seed, repair, reset, or backfill apply
- run `supabase db push` or remote DB apply
- implement RLS policies or grants
- implement auth, middleware, login/signup flows, LP, handoff, dashboard UI, onboarding UI, or report tabs UI
- run OpenAI, external API, web crawl, or search execution
- change `app/**`, `components/**`, `lib/**`, `scripts/**`, `supabase/migrations/**`, `package.json`, or `package-lock.json`
- expose or change `.env`, secrets, tokens, API keys, DB URLs, or project credentials

## Current evidence

Confirmed from repository artifacts:

- `public.organizations` exists as the tenant root for Recora workspaces and projects.
- `public.organization_members` exists as the membership foundation and supports either `user_id` or email identity.
- `public.projects.organization_id` exists and points to `public.organizations`.
- `public.projects` is the parent for project-owned measurement setup and report evidence.
- `public.brands`, `public.personas`, `public.topics`, `public.prompts`, and `public.measurement_runs` directly include `project_id`.
- `public.run_items` links to `measurement_runs` and `prompts`.
- `public.ai_conversations`, `public.brand_mentions`, and `public.citations` join back to the project through run items and measurement runs.
- `public.metric_snapshots` links to `measurement_runs`.
- `public.recommendations` directly includes `project_id`, optional `run_id`, and optional `related_prompt_id`.
- Minimal RLS migrations enable RLS on public customer/measurement tables, grant SELECT to `anon` / `authenticated` where intended, revoke writes from those roles, and constrain access through demo/local/member helpers.
- `public.recommendations` has an additional customer-visible predicate that excludes hidden, suppressed, review-required, candidate-only, and pre-quality-gate rows.
- `recora_admin` contains internal operational tables such as `plan_configs`, `customer_profiles`, `customer_subscriptions`, `measurement_batches`, `measurement_batch_items`, `report_publication_reviews`, `operation_events`, `prompt_change_events`, and `internal_notes`.
- `recora_admin` tables have RLS enabled and broad `public`, `anon`, and `authenticated` access revoked.

Not confirmed by this PR:

- live DB row distribution
- live Data API exposure settings
- live Supabase Advisors output
- final auth implementation
- final RLS policies for a customer launch surface
- final report publication schema
- customer-facing UI behavior

## Target ownership model

The target ownership model is:

```text
customer
  -> organizations
     -> organization_memberships
     -> projects
        -> project brands / known competitors / prompts
        -> measurement runs
           -> measurement prompt snapshots
           -> AI answers / brand mentions / citations / metric snapshots
        -> recommendations
        -> reports / report snapshots
```

Design rules:

- A customer is the commercial/accounting/business unit. It may map to subscription, plan, usage, and customer operations. It must not be assumed to be a single authenticated user.
- An organization is the application tenant root for logged-in users, memberships, projects, and customer-visible report access.
- Organization membership connects users to organizations and is the future basis for customer RLS.
- A project belongs to exactly one organization.
- Brand, known competitors, prompts, measurement runs, recommendations, reports, source metadata, and usage events are project-owned.
- A customer-visible report must be controlled by both project/organization membership and report publication state.
- Internal-only data remains internal even when it belongs to the same organization/project.

Where the existing schema differs from this target, this document labels the difference as a migration implication rather than assuming the DB already implements it.

## Entity definitions

### Customer

A customer is the business/accounting unit for subscription, plan, usage, and commercial operations.

Rules:

- A customer is not necessarily one authenticated user.
- A customer may own one or more organizations in future account models.
- Current repository evidence mostly models customer operations through `recora_admin.customer_profiles`, `recora_admin.customer_subscriptions`, and organization/project references.
- Customer-facing entitlement should be derived through organization/project scope, not through loose email matching or UI-only state.

### Organization

An organization is the Recora tenant root.

Rules:

- `public.organizations` is the current durable tenant root.
- `organization_type`, `data_environment`, `is_internal`, and `is_demo` are boundary signals.
- Demo/internal/local organizations must not be mixed into production customer projects.
- Organization membership should be the default authorization basis for customer project/report reads.

### Organization membership

An organization membership links a user or invited email to an organization.

Rules:

- `public.organization_members` is the current membership foundation.
- Membership carries a role.
- Membership is the RLS boundary input for project reads, report reads, and project-owned evidence.
- Membership must not grant access to `recora_admin` internal tables.
- Email-only invitation rows need a clear activation/claiming model before customer launch.

### Project

A project is the customer-facing measurement/reporting unit.

Rules:

- `public.projects` belongs to `public.organizations` through `organization_id`.
- Project is the parent boundary for target brand, competitors, prompts, measurement runs, recommendations, and reports.
- Project IDs should be available directly or through an unambiguous join path for all customer-visible report data.
- Tables that only link through `measurement_run_id`, `run_item_id`, or `conversation_id` must have a documented path back to project and organization.

### Brand

A brand is a project-scoped entity used for target brand and competitor mention extraction.

Rules:

- Current schema uses `public.brands.brand_type` for primary and competitor brands.
- Aliases and official URLs are project-scoped.
- Prompt matching and brand mentions must use project-scoped brand context.
- Competitor names must not be generated without evidence or reused across projects without explicit project ownership.

### Competitor

A competitor is a project-owned known competitor or discovered competitor candidate.

Rules:

- Current schema does not confirm a first-class `project_competitors` table.
- The current source of truth is likely `public.brands` with `brand_type = competitor`.
- A later schema PR should decide whether to keep competitors in `brands` or introduce a dedicated project competitor model.
- Known competitor names and aliases must be separated from non-branded discovery prompts to avoid contaminating visibility/ranking/SOV.

### Prompt

A prompt is a project-owned measurement question.

Rules:

- `public.prompts` is project-scoped and links to topic/persona context.
- `prompt_type` and `measurement_purpose` are first-class prompt scope fields, but existing rows remain null until explicitly reviewed.
- Persona, use case, funnel stage, topic/category, prompt approval, and measurement readiness need later schema/design work.
- Draft project setup output must not be treated as measurement-ready until materialized and approved.

### Measurement run

A measurement run is one execution unit for a project.

Rules:

- `public.measurement_runs` is project-scoped.
- `run_items` link the run to prompts.
- `ai_conversations` hold answer evidence and prompt text snapshots, but this is not a complete official prompt scope snapshot.
- Later design should define immutable measurement prompt snapshots that copy official prompt scope and metadata used at run time.

### Report

A report is the customer-visible presentation boundary for one project and one or more measurement sources.

Rules:

- A report must belong to a project and organization.
- A report should reference a measurement run or report snapshot source.
- Customer visibility must be controlled by a report-level publication state.
- Recommendations may have their own customer-visible gate, but that is not sufficient for report-level publication.

### Recommendation

A recommendation is a project-scoped improvement candidate or reviewed action.

Rules:

- `public.recommendations` currently links to project, optional run, and optional prompt.
- Recommendation customer visibility is constrained by metadata and state.
- Recommendation workflow fields, Page Brief, Action Plan, and review history need later schema work.
- Recommendation generation must not imply publication.

## Relationship model

Target relationships:

| Relationship | Target rule | Current evidence | Gap / note |
|---|---|---|---|
| customer -> organization | Customer/account owns or maps to organization. | Customer operations tables reference organization. | Exact customer account model still needs plan/subscription design. |
| organization -> membership | Organization has many memberships. | `public.organization_members.organization_id`. | Invitation lifecycle and auth claiming need later auth/RLS work. |
| organization -> project | Organization has many projects. | `public.projects.organization_id`. | Existing foundation is present. |
| project -> brand | Project owns primary brand and competitor brands. | `public.brands.project_id`. | Decide whether competitors stay in `brands` or move to first-class table. |
| project -> prompt | Project owns prompts. | `public.prompts.project_id`. | Prompt readiness and richer metadata remain incomplete. |
| project -> measurement_run | Project owns measurement runs. | `public.measurement_runs.project_id`. | Existing foundation is present. |
| measurement_run -> run_item | Run contains per-prompt items. | `public.run_items.run_id`, `prompt_id`. | Run item may be a candidate home for prompt snapshot, but not decided. |
| run_item -> AI answer | AI answer belongs to run item. | `public.ai_conversations.run_item_id`. | Join path to project must be validated in RLS audit. |
| AI answer -> brand mentions | Mention evidence belongs to answer. | `public.brand_mentions.conversation_id`. | Join path to project must be validated in RLS audit. |
| AI answer -> citations | Citation evidence belongs to answer. | `public.citations.conversation_id`. | Source-to-claim and freshness need later schema/read-model work. |
| measurement_run -> metric_snapshot | Metrics belong to run and scope. | `public.metric_snapshots.run_id`. | Metric snapshot scope must remain traceable to prompt/run inputs. |
| project -> recommendation | Project owns recommendations. | `public.recommendations.project_id`. | Workflow/review fields need later schema work. |
| project -> report | Project owns reports. | Report-level table not yet confirmed. | Needs report publication-state schema design. |
| report -> measurement source | Report references run/snapshot evidence. | `report_publication_reviews.measurement_run_id`; read models use runs. | Needs first-class report publication state. |

## Project-owned data

The following data should be project-owned, directly or through a documented join path:

- primary brand and brand aliases
- known competitors and competitor aliases
- personas, topics, prompts, and prompt metadata
- measurement runs
- measurement prompt snapshots
- AI answers / conversations
- brand mentions
- citations and source metadata
- metric snapshots
- recommendations
- reports and report snapshots
- report publication reviews
- usage events and measurement quota consumption

Project ownership requirements:

- Customer-visible rows should either include `project_id` directly or have a short, tested join path to `public.projects`.
- If a row uses only `measurement_run_id`, `run_item_id`, or `conversation_id`, the RLS audit must confirm the join path reaches the correct project and organization.
- Project ownership must not depend on prompt text, brand name strings, report URL paths, or front-end state.
- Downstream derived tables must not become independent sources of truth that can drift away from project/organization ownership.
- Internal operational rows should still carry `organization_id` and `project_id` when they refer to customer/project work.

## Report visibility model

Target report publication states:

| State | Meaning | Customer visibility |
|---|---|---|
| `admin_draft` | Internal report preparation state. | Not visible. |
| `review_required` | Human or quality review is required before customer display. | Not visible. |
| `customer_ready` | Approved for customer display within the correct organization/project boundary. | Visible to authorized members only. |
| `hidden` | Explicitly suppressed from customer display. | Not visible. |
| `archived` | Historical report retained for audit or later review. | Not visible by default; any customer access needs a separate rule. |

Required rules:

- No report is customer-visible without a report publication state.
- `customer_ready` does not override organization membership or project ownership.
- `admin_draft`, `review_required`, and `hidden` are never visible to customer roles.
- Failed, partial, seed, demo, or internal measurement runs cannot become customer-ready without explicit review.
- Missing or inferred prompt scope metadata should force `review_required` for affected official visibility/ranking/SOV claims.
- Recommendation-level customer visibility is necessary but not sufficient for report-level publication.
- Internal/demo reports must not be mixed into production customer projects.

Later schema work should decide whether report publication state is stored in a new public report table, a report snapshot table, `recora_admin.report_publication_reviews`, or a customer-facing read-model boundary. This PR does not make that schema decision final.

## Membership and roles

Target role values for design:

| Role | Intended capability | Notes |
|---|---|---|
| `owner` | Manage organization, projects, memberships, and report access. | Final write capabilities require later auth and RLS design. |
| `admin` | Manage projects, review reports, and manage recommendations. | Customer-facing write scope is not implemented in this PR. |
| `editor` | Edit prompts or recommendations after approval workflows exist. | Future role; should not bypass review gates. |
| `viewer` | View customer-ready reports only. | Must not see internal drafts or hidden reports. |

Membership design rules:

- Membership is organization-scoped first.
- Project-specific overrides may be added later, but the base customer boundary is organization membership plus project ownership.
- `viewer` must not see reports unless report state is `customer_ready`.
- `owner`, `admin`, and `editor` must not see `recora_admin` internal operational data through customer-facing APIs.
- Role names in docs are design inputs only; this PR does not implement auth or RLS policy changes.

## RLS boundary expectations

The next `chore/customer-db-rls-readiness-audit` PR should verify that:

- authenticated users can read only projects belonging to organizations where they are members
- organization membership is required for project-owned prompts, measurement runs, conversations, citations, metrics, recommendations, and reports
- `anon` cannot read production customer data
- internal/admin-only tables remain unavailable to customer roles
- service-role operations remain server/internal only
- all customer-related public tables have RLS enabled
- public SELECT grants are constrained by tenant-safe policies
- views, if used, are security-invoker or otherwise tenant-safe
- SECURITY DEFINER functions are not publicly callable beyond intended helpers
- report publication state prevents non-`customer_ready` reports from appearing in customer reads
- demo/internal/local data does not leak into production customer reports
- Customer A cannot read Customer B data through direct table access, joins, report URLs, or derived read models

This PR does not change RLS, grants, policies, functions, or views.

## Internal-only data

The following data must remain internal unless a later PR defines a sanitized customer-facing contract:

- raw generator output
- unapproved project setup drafts
- internal prompt generation diagnostics
- measurement debug logs
- raw OpenAI or provider request/response payloads when sensitive
- service-role operational data
- cost/debug traces
- crawler/debug details
- warning/blocker IDs
- raw evaluation artifacts
- internal-only recommendations before review
- hidden, admin draft, or review-required reports
- failed measurement debug payloads
- backfill dry-run review artifacts unless explicitly sanitized
- internal notes and operator comments

Customer-visible data and internal operational data may refer to the same organization/project, but they must remain separated by schema, state, grants/RLS, and read-model contracts.

## Migration implications

This document implies later migration or design PRs, but does not create them.

Likely later migration/design areas:

- customer/account model and organization linkage, if customer needs to become first-class beyond admin tables
- organization membership activation/claiming and final role values
- project ownership constraints, including composite organization/project references where needed
- first-class competitor model or a confirmed `brands.brand_type = competitor` contract
- report publication state and report snapshots
- measurement prompt snapshot table or approved run-item snapshot extension
- prompt metadata fields/table for persona, use case, funnel stage, topic/category, approval, and measurement readiness
- source owner type and freshness fields/contracts
- recommendation review, Page Brief, and Action Plan workflow
- usage/subscription linkage and quota tracking
- audit log retention and customer data deletion policy

Migration constraints:

- Prefer additive migrations.
- Keep raw measurement evidence immutable.
- Separate migration, remote apply, and backfill into distinct PRs.
- Validate row counts, null/unknown handling, foreign keys, duplicate prevention, and tenant boundaries before any remote apply.
- Keep publication disabled until report visibility and RLS validation are complete.

## Suggested PR sequence

1. `docs/customer-org-project-boundary-design`
   - This PR.
   - Docs-only.

2. `chore/customer-db-rls-readiness-audit`
   - Read-only audit of RLS, grants, policies, exposed tables, functions, views, and advisors.
   - No DB write.

3. `docs/measurement-prompt-snapshot-design`
   - Define prompt definition to measurement-time snapshot ownership.
   - No migration.

4. `feat/report-publication-state-schema-local`
   - Add local migration for report publication state after the design is approved.
   - No remote apply.

5. `feat/customer-prompt-metadata-schema-local`
   - Add local migration for persona/use_case/funnel_stage/topic/category and prompt readiness metadata.
   - No remote apply.

6. `feat/source-owner-freshness-schema-local`
   - Add local migration for source owner/freshness metadata.
   - No remote apply.

7. `feat/recommendation-workflow-schema-local`
   - Add local migration for recommendation review, Page Brief, and Action Plan workflow.
   - No remote apply.

8. `docs/customer-plan-subscription-db-design`
   - Design plan, subscription, usage, quota, and entitlement linkage.
   - No Stripe implementation.

9. Remote apply PRs
   - One explicit remote-apply checkpoint per migration.
   - Stop before `supabase db push` until approved.

10. Backfill dry-run / apply PRs
   - One dry-run and one apply checkpoint per field group.
   - Prompt scope backfill remains paused until human review yields `approve_explicit_backfill`.

## Open decisions

- Should `customer` become a first-class public/admin table beyond the current admin customer profile/subscription model?
- Should organizations support multiple customers, or should customer-to-organization stay one-to-one for now?
- Should competitors remain in `public.brands`, or should a first-class project competitor table be introduced?
- Where should report publication state live: public report table, report snapshot table, admin review table, or read-model boundary?
- What is the exact relationship between reports and measurement runs when a report aggregates multiple runs?
- Where should immutable measurement prompt snapshots live?
- What role values are final for customer launch, and how do invitation rows become authenticated memberships?
- How should project-level role overrides work, if at all?
- What data is safe for customer viewers versus admins/editors?
- What deletion and retention rules apply when a customer or project is offboarded?
