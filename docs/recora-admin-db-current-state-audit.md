# Recora Admin DB Current State Audit

Status: Read-only current-state audit
Last updated: 2026-07-02

## Overview

This document records the current Recora admin/internal operations DB state before the customer DB and admin DB boundary is redesigned again.

The audit follows:

- `docs/recora-customer-db-readiness-audit.md`
- `docs/recora-customer-org-project-boundary-design.md`
- PR #56 merge commit `257233764ba2ea3e3c4f929ab49da9b6a898dffd`

The core finding is that Recora now has a real `recora_admin` schema for internal operational metadata, but several customer-facing projection boundaries are still not first-class. Admin-owned plan/subscription, measurement job, publication review, prompt-change, and internal note tables exist. Customer-visible report snapshots, report publication state, recommendation workflow state, Page Brief, Action Plan, and measurement prompt snapshots still need separate design or schema work.

This PR is a read-only audit and docs update. It does not create a migration, write to any database, run Supabase db push, apply backfill, seed data, repair/reset migration history, run OpenAI/external APIs, crawl the web, implement UI, implement auth, change middleware, or modify LP/Auth/handoff areas.

## Scope

This audit covers:

- live Supabase schema metadata for `public`, `recora_admin`, and relevant `recora_private` helper functions
- RLS flags, table grants, policy counts, row estimates, relevant constraints, views, and helper function exposure
- Supabase Advisors security/performance output
- repository docs, migrations, scripts, `/internal` pages, and admin read models related to internal operations
- current candidates for admin DB ownership and customer DB projection

This audit does not inspect customer row bodies, prompt text, AI answer text, citation URL inventories, raw recommendation bodies, secrets, DB URLs, tokens, passwords, cookies, or `.env` values.

## Non-goals

This PR does not:

- change DB schema or add a migration
- run `supabase db push`
- run UPDATE, INSERT, DELETE, ALTER, CREATE, DROP, GRANT, REVOKE, TRUNCATE, or COMMENT SQL against the remote DB
- change RLS, policies, grants, function exposure, or Data API exposure
- execute measurement jobs, OpenAI calls, crawlers, search, seeds, repairs, resets, or backfills
- change customer-facing dashboard UI, admin UI, onboarding UI, report tabs UI, LP, Auth, middleware, or handoff files
- change `package-lock.json`

## Audit method

Repository checks:

- Started from a clean worktree on `docs/admin-db-current-state-audit` at `origin/master`.
- Confirmed `origin/master` contains PR #56 merge commit `257233764ba2ea3e3c4f929ab49da9b6a898dffd`.
- Searched `docs`, `supabase/migrations`, `lib/recora`, `scripts`, `app/internal`, `app/dashboard`, and `components/recora` for admin/internal, plan, subscription, usage, measurement job, report publication, recommendation review, project setup draft, and audit-log references.

Supabase checks:

- Used Supabase CLI `2.109.0` via `npx --yes supabase`.
- Linked the worktree to the existing Recora project without displaying DB URL, tokens, password, or secrets in this document.
- Confirmed `supabase db query --linked --file <temp sql>` is available.
- Ran SELECT-only audit queries for objects/RLS flags, candidate columns, policies, grants, row estimates, constraints, views/materialized views, and helper functions.
- Ran Supabase Advisors for `security` and `performance`.

Important execution note:

- An initial CLI attempt passed multiline SQL incorrectly and executed only a no-column `SELECT`, returning an empty object row. It did not write to the database. The audit was then re-run with temporary SQL files via `--file`, which returned the expected schema metadata.

## Current admin/internal DB candidates

| Area | Existing table / artifact | Evidence | Current role | Likely owner DB | Customer DB projection needed? | Status | Risk | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| plan configs | `recora_admin.plan_configs` | live table, RLS enabled, estimated rows 5, service_role SELECT only | internal plan definitions and mutable entitlement config | admin_db | yes, only derived entitlement/visibility summary | exists | medium | Pricing/limits remain config-driven and not a customer contract yet. |
| subscriptions | `recora_admin.customer_subscriptions` | live table, estimated rows 1 | customer plan assignment and contract state | admin_db | yes, only customer-safe entitlement state | exists | medium | No Stripe/billing integration in scope. |
| usage limits / quota | `plan_configs.config`, `customer_subscriptions.entitlement_config`; no live `usage_events` or `monthly_usage` table | docs/migration search and live schema | intended quota/usage source but not a durable usage ledger | admin_db | yes, only consumed/remaining customer-safe projection | partial | high | Needs separate usage boundary design before customer launch. |
| measurement jobs / run controls | `recora_admin.measurement_schedules`, `measurement_batches`, `measurement_batch_items`; `lib/recora/phase1-admin-plan.ts` | live tables, all estimated rows 0; code is plan-only | scheduling, queue, retry, and per-item run linkage | admin_db | yes, completed-result status only | partial | high | Schema exists, but no durable worker/write flow is active in this audit. |
| measurement runs | `public.measurement_runs`, `public.run_items`, `public.ai_conversations` | live row estimates: runs 6, run_items 26, ai_conversations 26 | measured evidence source and run lifecycle | both_with_projection | yes, immutable result/report snapshot | exists | high | Execution lifecycle and customer-visible result snapshot are still coupled through public run data. |
| project setup drafts | `lib/recora/project-setup-draft.ts`, `lib/recora/project-setup-draft-generator.ts`, verification scripts | repository code/docs only | draft generation/review before materialization | admin_db | yes, only approved materialized prompts/personas/topics | partial | high | No dedicated live admin table for project setup drafts was found. |
| generator outputs | project setup generator code and tests | repository code/docs only | pre-approval generated draft data | admin_db | only after approval/materialization | needs_design | high | Raw generator output must not become customer-visible by default. |
| materialization controls | project setup readiness functions and verification scripts | repository code/docs only | gate draft approval before prompt/result use | admin_db | yes, materialized safe entities only | partial | high | DB workflow state is not first-class. |
| report publication controls | `recora_admin.report_publication_reviews`; `recora_admin_customer_ops_readonly` RPC | live table, estimated rows 0, service_role SELECT/EXECUTE only | internal report-level review/publication history | both_with_projection | yes, customer-safe report publication state/snapshot | exists_empty | blocker | Table exists, but no customer-facing report publication projection is first-class. |
| recommendations | `public.recommendations`; customer-visible predicate | live row estimate 6, RLS policy exists | recommendation candidates and customer-visible filtered rows | both_with_projection | yes, approved/published recommendation snapshot | partial | high | Publication metadata exists, but review workflow is not durable enough. |
| recommendation review | planned `recora_admin.recommendation_review_events`; report read model review queue future state | docs/code references only | human/quality-gate workflow | admin_db | approved recommendation only | needs_design | high | No live admin review-events table was found. |
| Page Brief / Action Plan drafts | report tabs/readiness docs | docs/read-model future state only | reviewed implementation guidance drafts | admin_db | approved customer-facing versions only | missing | medium | Needs a later workflow/schema decision. |
| admin audit logs | `recora_admin.operation_events` | live table, estimated rows 0, service_role SELECT only | append-only internal operation log | admin_db | no, except summarized customer-safe status if needed | exists_empty | medium | Write actor, retention, and event taxonomy remain later work. |
| internal operation logs / notes | `recora_admin.internal_notes`, `prompt_change_events` | live tables, estimated rows 0 | internal notes and prompt change history | admin_db | no, except approved prompt snapshots | exists_empty | medium | Notes must not store secrets, raw AI answers, aggregate values, prompt bodies, or recommendation bodies. |
| customer-facing report snapshots | no first-class report snapshot table confirmed | docs and live schema | desired immutable customer report boundary | customer_db | n/a | missing | blocker | Needed to decouple report display from internal review/workflow rows. |
| customer-facing measurement snapshots | `public.measurement_runs`, `run_items`, `ai_conversations`, `metric_snapshots`, `brand_mentions`, `citations` | live row estimates and public RLS policies | measured evidence shown to customer | customer_db | n/a | partial | high | Prompt snapshot and publication-state boundary remain incomplete. |

## Plan and subscription state

Current live state:

- `recora_admin.plan_configs`: exists, RLS enabled, estimated rows 5.
- `recora_admin.customer_subscriptions`: exists, RLS enabled, estimated rows 1.
- `recora_admin.customer_profiles`: exists, RLS enabled, estimated rows 1.
- `recora_admin` tables grant SELECT only to `service_role`; no `anon` or `authenticated` table grants were observed.
- `/internal/plans` reads compact plan data through `public.recora_admin_plan_configs_readonly()`.
- The plan RPC is `security invoker`, executable only by `service_role` in the inspected live grants.

Gaps:

- Usage ledger tables such as `usage_events` or `monthly_usage` are not live in this audit.
- Customer entitlement, quota, usage-limit display, and plan-specific report visibility are not a customer-facing DB contract yet.
- Stripe/payment integration remains out of scope.

## Measurement execution state

Current live state:

- `recora_admin.measurement_schedules`: exists, estimated rows 0.
- `recora_admin.measurement_batches`: exists, estimated rows 0.
- `recora_admin.measurement_batch_items`: exists, estimated rows 0.
- `measurement_batch_items.measurement_run_id` links admin queue items to `public.measurement_runs` after execution.
- `public.measurement_runs`: estimated rows 6.
- `public.run_items`: estimated rows 26.
- `public.ai_conversations`: estimated rows 26.
- `public.metric_snapshots`: estimated rows 18.
- `/internal/operations` and `/internal/projects` read existing dashboard/run state and build plan-only execution suggestions.

Gaps:

- The admin job tables are schema-ready but empty in the live estimate.
- No approved worker/write path is active in this PR.
- Measurement job lifecycle and completed customer result snapshots are not yet separated into distinct admin-owned and customer-owned records.

## Project setup draft and materialization state

Current state:

- Draft generation/review concepts exist in `lib/recora/project-setup-draft.ts`, `lib/recora/project-setup-draft-generator.ts`, and verification scripts.
- Draft readiness checks include review-status blockers before materialization.
- No live `recora_admin` project setup draft table was found in the inspected schema.

Gaps:

- Project setup draft data, raw generator output, review status, and materialization controls are not a durable admin DB workflow yet.
- Customer DB should receive only approved/materialized project setup data, not raw generator output.

## Report publication and visibility control

Current live state:

- `recora_admin.report_publication_reviews`: exists, RLS enabled, estimated rows 0.
- Status constraints include `pending_review`, `approved`, `published`, `needs_fix`, `rejected`, and `unpublished`.
- The table links to `organization_id`, `project_id`, and `measurement_run_id`.
- `/internal/customer-ops` can read latest report review status through `public.recora_admin_customer_ops_readonly()`.
- The customer report read model has a report-ready concept, and recommendation visibility has its own predicate.

Gaps:

- There is no first-class customer-facing report snapshot/publication table confirmed in the live schema.
- `recora_admin.report_publication_reviews` is internal control history; it should not be the only customer display boundary.
- Recommendation customer visibility is necessary but not sufficient for report-level publication.

## Recommendation review and workflow state

Current live state:

- `public.recommendations`: exists, estimated rows 6.
- `public.recommendations` has a customer-visible predicate through RLS/policy helpers and metadata/state rules.
- The report tabs view model treats recommendation review workflow, Page Brief, and Action Plan as future/partial surfaces.

Gaps:

- No live `recora_admin.recommendation_review_events` table was found.
- Recommendation candidate generation, human review, quality-gate decision, customer publication, Page Brief, and Action Plan should not share one ambiguous state model.
- Approved customer-facing recommendation snapshots need a clearer projection boundary.

## Admin audit/log state

Current live state:

- `recora_admin.operation_events`: exists, estimated rows 0.
- `recora_admin.internal_notes`: exists, estimated rows 0.
- `recora_admin.prompt_change_events`: exists, estimated rows 0.
- Table comments and constraints require internal-only use and prohibit secrets/raw AI answer/aggregate/recommendation body storage.

Gaps:

- Durable internal operator identity is not implemented.
- Write actors, event retention, note body retention, and audit-event taxonomy need later design before admin writes are enabled.
- The current `/internal` surface remains local, guarded, and read-only.

## RLS, grants, and exposure notes

Live schema observations:

- All inspected `public` and `recora_admin` tables have RLS enabled.
- No inspected table had forced RLS enabled.
- `recora_admin` tables had 0 policies and SELECT grants only to `service_role`; no `anon` or `authenticated` grants were observed for admin tables.
- `public` customer/measurement tables have SELECT grants for `anon` and/or `authenticated`, with one SELECT policy per table in the inspected policy count.
- `organization_members` had SELECT for `authenticated` and `service_role`, but not `anon` in the inspected candidate grants.
- `public.recora_admin_plan_configs_readonly()` and `public.recora_admin_customer_ops_readonly()` are `security invoker` functions and executable only by `service_role` in the inspected grants.
- `recora_private` helper functions such as `can_read_project`, `can_read_run`, and `is_organization_member` are `security definer` and executable by `anon` / `authenticated`; they are part of the current public RLS helper design and still require dedicated customer RLS audit before launch.
- No public or `recora_admin` views/materialized views were found in the inspected live schemas.
- Supabase Advisors returned no security or performance issues.

Interpretation:

- The admin DB exposure shape is good for a read-only internal control plane: admin tables are not broadly granted to customer roles, and admin RPCs are service-role only.
- Customer-facing public tables still need the separate RLS readiness audit planned in previous docs, because SELECT grants exist and safety depends on policy correctness and helper functions.

## Customer DB projection candidates

Customer DB should own or project:

- published customer report snapshots
- completed measurement result snapshots
- prompt snapshots at measurement time
- AI answers shown to customers
- brand and competitor mentions shown to customers
- citations and source metadata shown to customers
- metric snapshots shown to customers
- source owner/freshness fields shown to customers
- approved customer-facing recommendations
- approved customer-facing Page Brief and Action Plan artifacts
- customer-safe entitlement/visibility summaries derived from admin plan/subscription state

Customer DB should not own:

- plan authoring config
- subscription/billing operational state beyond customer-safe entitlement projection
- measurement queues, retry counts, worker refs, error bodies, or internal run controls
- raw generator output and unapproved project setup drafts
- report review history, operator notes, internal blockers, or audit details
- pre-quality-gate recommendation candidates

## Admin DB ownership candidates

Admin DB should own:

- `plan_configs`
- `customer_profiles`
- `customer_subscriptions`
- usage and quota ledgers when designed
- measurement schedules
- measurement batches and batch items
- measurement trigger/button state and retry/error state
- project setup drafts before approval
- generator raw output before materialization
- report publication control and review history
- recommendation review workflow and quality-gate operational history
- prompt change events
- internal audit logs and operation events
- internal notes and operator-only context

Both with projection:

- `measurement_runs`: admin DB owns execution/job lifecycle; customer DB owns completed result snapshot.
- `recommendations`: admin DB owns review workflow; customer DB owns approved/published recommendation artifacts.
- `reports`: admin DB owns publication control; customer DB owns published report snapshot.
- `projects`: admin DB owns configuration/operations context; customer DB owns report/result scope reference.

## Findings

Blocker:

- Report-level customer publication is not first-class in the customer DB surface. `recora_admin.report_publication_reviews` exists, but it is internal control history, not a complete customer-visible report snapshot boundary.
- Measurement execution lifecycle and customer measurement result snapshots are not cleanly separated yet. `public.measurement_runs` currently carries both run status and customer-visible evidence lineage.
- Project setup drafts and generator outputs are not durable admin DB workflow records. Raw generated drafts must not become customer DB data without approval/materialization.

High:

- Recommendation review workflow is not first-class. `public.recommendations` and metadata predicates exist, but `recommendation_review_events`, Page Brief, and Action Plan workflow persistence are not live.
- Plan/subscription tables exist, but usage/quota ledger and customer entitlement projection are not designed as a durable customer-facing contract.
- Admin measurement job tables exist but are empty in live estimates and do not imply an approved worker/write flow.

Medium:

- `operation_events`, `internal_notes`, and `prompt_change_events` exist but are empty in live estimates; operator identity, write actor policy, and retention are later work.
- `recora_private` SECURITY DEFINER helpers are exposed to `anon` / `authenticated` for RLS helper use. This is expected from the current minimal RLS design but should stay in the dedicated RLS audit scope.
- Public customer/measurement tables have SELECT grants to customer roles and rely on policies. This is not an admin DB blocker, but it remains a customer launch risk until separately audited.

Low:

- Some docs/routes still mention older `/dashboard/admin/operations` wording even though the current internal route redirects to `/internal/operations`.
- Row counts are PostgreSQL estimates, not exact counts.
- Live row body content was intentionally not inspected.

Information gaps:

- No tenant isolation probe was run for Customer A vs Customer B.
- No customer login/auth session path was inspected.
- No row bodies, raw AI answers, prompt text, citations, or recommendation bodies were inspected.
- No write path, worker path, seed, backfill, repair, reset, or migration apply was executed.

## Recommended next PRs

1. `docs/customer-vs-admin-db-boundary-design`
   - Use this audit to formally define customer DB vs admin DB ownership and projection rules.
   - Docs-only.

2. `chore/customer-db-rls-readiness-audit`
   - Read-only audit of customer-facing public table RLS, grants, policies, exposed functions, helper functions, views, and advisors.
   - Keep it separate from admin DB readiness.

3. `docs/measurement-result-projection-design`
   - Define how admin measurement job lifecycle projects into immutable customer measurement result snapshots.

4. `docs/report-publication-projection-design`
   - Define report publication state, internal review history, and customer-facing report snapshot ownership.

5. `docs/recommendation-workflow-boundary-design`
   - Define candidate generation, human review, quality-gate decisions, Page Brief, Action Plan, and customer publication boundaries.

6. `docs/plan-subscription-usage-boundary-design`
   - Define plan, subscription, usage, quota, and entitlement projection rules. No Stripe implementation.

7. `feat/customer-report-snapshot-schema-local`
   - Local-only migration for customer report snapshots. Stop before remote apply.

8. `feat/measurement-prompt-snapshot-schema-local`
   - Local-only migration for measured prompt snapshots. Stop before remote apply.

9. `feat/admin-recommendation-review-schema-local`
   - Local-only admin DB schema for recommendation review events. Stop before remote apply.

10. `feat/admin-usage-ledger-schema-local`
   - Local-only admin DB usage/quota ledger. Stop before remote apply.

RLS/policy/grant changes, migrations, and remote apply must remain separate PRs with explicit checkpoints.

## Open decisions

- Should customer-facing report publication state live in a public report snapshot table, a customer-facing read-model table, or a projection derived from `recora_admin.report_publication_reviews`?
- What exact fields are required for immutable measurement result snapshots?
- Where should measured prompt snapshots live: `run_items`, a new prompt snapshot table, or a report snapshot payload?
- How should plan/subscription/usage state become a customer-safe entitlement projection without exposing internal billing/ops data?
- What is the durable operator identity model for future admin writes?
- How should recommendation review events, Page Brief, and Action Plan artifacts be versioned and published?
- What retention policy applies to internal notes, operation events, generator raw output, and customer report snapshots?
- Which customer RLS policies and helper functions are safe enough for launch after the dedicated RLS readiness audit?