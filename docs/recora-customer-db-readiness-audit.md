# Recora Customer DB Readiness Audit

Status: Docs-only readiness audit
Last updated: 2026-07-02

## Overview

This document audits the current Recora repository state as a customer DB foundation. It organizes what already exists, what is partial, what is missing, and which follow-up PRs should be created before customer-facing report and measurement operations are considered complete.

This is not a UI implementation, not a DB migration, and not a remote DB operation. It does not run backfill, seed, repair, reset, external API jobs, web crawling, or Supabase db push. The intent is to sequence the next DB work safely after the prompt scope backfill track was paused with no automatic apply candidates.

Prompt scope context:

- PR #48 added `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql`.
- The migration adds nullable `public.prompts.prompt_type text` and `public.prompts.measurement_purpose text`, with check constraints.
- The later review record shows `safe_explicit_candidate = 0` and `apply_candidate = 0`.
- Existing prompt scope backfill remains paused until a later human review explicitly approves concrete rows.

## Scope

This audit covers repository evidence for:

- customer, organization, project, and membership boundaries
- project, brand, competitor, persona, topic, and prompt relations
- prompt scope and prompt metadata
- measurement run, run item, AI conversation, brand mention, citation, and metric snapshot relations
- citation/source metadata and review readiness
- recommendations, Page Brief, Action Plan, and report publication workflow data
- plan, subscription, usage, and quota linkage
- RLS, grants, customer visibility, and internal/admin separation
- audit log and operational history foundations

## Non-goals

This PR intentionally does not do any of the following:

- implement UI, dashboard, onboarding, report tabs, LP, Auth, handoff, or middleware changes
- create or modify DB migrations
- run `supabase db push`, remote DB apply, backfill apply, seed, repair, reset, or DB write operations
- run OpenAI, external API, web crawl, or search execution
- modify `app/**`, `components/**`, `lib/**`, `scripts/**`, `supabase/migrations/**`, `package.json`, or `package-lock.json`
- expose or change `.env`, secrets, tokens, API keys, DB URLs, or project credentials

## Current known state

Repository evidence indicates that the base measurement schema exists in `public`:

- `public.projects`
- `public.brands`
- `public.personas`
- `public.topics`
- `public.prompts`
- `public.ai_models`
- `public.measurement_runs`
- `public.run_items`
- `public.ai_conversations`
- `public.source_domains`
- `public.brand_mentions`
- `public.citations`
- `public.metric_snapshots`
- `public.recommendations`

Tenant foundation exists:

- `public.organizations`
- `public.organization_members`
- `public.projects.organization_id`

Minimal customer visibility controls exist:

- RLS is enabled for the public measurement tables in the minimal RLS migration.
- `anon` and `authenticated` have SELECT grants on many public tables, but policies restrict rows to demo/local/member boundaries.
- write operations are revoked from `anon` and `authenticated`.
- recommendations have an additional customer-visible predicate that excludes hidden, suppressed, review-required, candidate-only, and pre-quality-gate states.

Admin and operational tables exist in `recora_admin`:

- `recora_admin.plan_configs`
- `recora_admin.customer_profiles`
- `recora_admin.customer_subscriptions`
- `recora_admin.diagnostic_intakes`
- `recora_admin.measurement_schedules`
- `recora_admin.operation_events`
- `recora_admin.measurement_batches`
- `recora_admin.measurement_batch_items`
- `recora_admin.report_publication_reviews`
- `recora_admin.prompt_change_events`
- `recora_admin.internal_notes`

Admin schema safety foundations exist:

- `recora_admin` tables have RLS enabled.
- broad `public`, `anon`, and `authenticated` access is revoked.
- service-role read access and read-only RPCs exist for internal operations.
- the current docs still describe final write actors, internal authorization, and customer-visible entitlement/read-model behavior as follow-up work.

Prompt scope exists but remains incomplete for historical rows:

- `public.prompts.prompt_type` and `public.prompts.measurement_purpose` exist in the local migration history.
- The prior remote read-only checkpoint reported both columns as nullable text fields with no default, both check constraints validated, and no Supabase Advisors WARN/ERROR blocker.
- Existing rows remain null unless separately reviewed and backfilled.
- `docs/recora-prompt-scope-backfill-review-record.md` keeps every reviewed row as `apply_candidate = false`.

Important limitations:

- This audit is based on repository artifacts, not a fresh remote DB inspection.
- It does not confirm live row counts, live grants, Data API exposure, or current Supabase Advisors.
- It does not prove customer production data is complete.
- It does not make any customer-facing report visible.

## Customer DB readiness matrix

| Area | Required DB capability | Current evidence | Status | Risk | Next PR | Notes |
|---|---|---|---|---|---|---|
| Customer / organization boundary | A durable customer/org/project boundary with membership-aware report visibility. | `public.organizations`, `public.organization_members`, `public.projects.organization_id`, minimal RLS policies. | partial | high | `docs/customer-org-project-boundary-design` | The foundation exists, but the final customer report visibility contract and membership model need design before customer launch. |
| Project / brand / competitor relation | Per-project target brand, known competitors, domains, and aliases. | `public.brands` has `brand_type`; docs currently treat competitors as `brands.brand_type = competitor` or future config. | partial | medium | `feat/customer-project-brand-competitor-schema-local` | No first-class `project_competitors` table is confirmed; decide whether `brands` remains the source of truth. |
| Project / prompts relation | Prompts linked to the project, topic/persona context, active status, and metric eligibility. | `public.prompts` links to project/topic/persona in the base schema. | partial | high | `feat/customer-prompt-metadata-schema-local` | Relationship exists, but measurement-ready, approval, and richer metadata are not complete. |
| Prompt scope | Durable `prompt_type` and `measurement_purpose` that gate visibility/ranking/SOV. | `20260701044743_recora_prompt_scope_fields.sql`; code-level prompt scope helpers; review record has no apply candidates. | partial | high | Later human-reviewed backfill PR only after explicit approval | Columns exist, but null rows remain ineligible for official visibility/ranking/SOV. |
| Prompt metadata | Persona, use case, funnel stage, topic/category, approval status, and measurement readiness. | Existing `personas`, `topics`, prompt intent/buyer stage; report readiness docs list new metadata needs. | needs_migration | high | `feat/customer-prompt-metadata-schema-local` | Needed before customer reporting can explain segments reliably. |
| Measurement prompt snapshot | Immutable measured prompt snapshot containing text, scope, purpose, persona/topic metadata, and versioning. | `run_items` links to prompts and `ai_conversations.prompt_text_snapshot` stores text evidence. | needs_design | high | `docs/measurement-prompt-snapshot-design` | Text snapshot exists, but official prompt scope/metadata snapshot ownership is not first-class. |
| Measurement result relation | Measurement runs, AI answers, mentions, citations, and metrics trace back to project/run/prompt. | `measurement_runs`, `run_items`, `ai_conversations`, `brand_mentions`, `citations`, `metric_snapshots`. | partial | medium | `chore/measurement-result-relation-audit` | Core relations exist; customer-grade traceability needs a focused relation audit. |
| Citation/source metadata | Source owner type, freshness, source-to-claim state, and citation review fields. | `source_domains`, `citations`, source freshness and source-to-claim fields in read-model types and DB selections. | partial | medium | `feat/source-owner-freshness-schema-local` | Source freshness is partial; first-class owner type remains incomplete in report tab availability. |
| Recommendation workflow | Review status, Page Brief, Action Plan, ownership, action state, and evidence links. | `public.recommendations`, publication metadata, `recora_admin.report_publication_reviews`, report tabs docs for Page Brief / Action Plan. | needs_design | high | `feat/recommendation-workflow-schema-local` | Customer-facing workflow must separate recommendation candidates, reviewed actions, and published actions. |
| Plan/subscription linkage | Customer/project/subscription/plan_config/usage-limit linkage. | `recora_admin.plan_configs`, `customer_subscriptions`, customer ops read-only RPCs. | partial | medium | `docs/customer-plan-subscription-db-design` | Admin tables exist, but entitlement, quota, and customer-visible plan behavior still need design. |
| Report publication state | Report-level states such as admin draft, review required, hidden, and customer ready. | Recommendation-level customer-visible predicate; `recora_admin.report_publication_reviews`; `report-eligibility` returns `customer_ready` / `not_ready`. | needs_design | high | `feat/report-publication-state-schema-local` | Recommendation gate exists, but a first-class report publication state is not yet complete. |
| RLS / customer visibility | Prevent Customer A from reading Customer B data and prevent drafts from leaking. | Public RLS policies, revoked writes, recommendation customer-visible predicate, admin schema revokes. | needs_rls_audit | blocker | `chore/customer-db-rls-readiness-audit` | A read-only live audit of grants, policies, exposed tables, functions, and advisors is required before customer launch. |
| Audit log | Durable history for approvals, publication changes, prompt changes, and measurement/review events. | `recora_admin.operation_events`, `prompt_change_events`, `internal_notes`, publication review tables. | partial | medium | `docs/customer-db-audit-log-design` | The tables exist, but durable write actors, retention, and customer-visible audit boundaries need decisions. |
| Usage tracking / measurement quota | Track measurement consumption by plan, subscription, project, run, and schedule. | `customer_subscriptions`, `measurement_schedules`, `measurement_batches`, AI conversation `usage`. | needs_design | high | `docs/customer-plan-subscription-db-design` | Usage data exists in pieces, but customer quota enforcement is not first-class. |
| Sentiment / caveat / narrative labels | Separate qualitative labels from visibility/ranking/SOV metrics. | Metric contract docs keep sentiment and brand perception separate from non-branded visibility metrics. | future | medium | Later narrative-label design PR | Useful for reports, but should not block P0 customer DB readiness. |
| Claim-to-source relation | Reviewable source support for claims before publication. | Citation fields include `source_to_claim_status`, `claim_text`, and notes. | partial | medium | `feat/source-owner-freshness-schema-local` | Fields exist; publication workflow and reviewer decisions need stronger contracts. |
| Measurement job queue / retry / error state | Durable queue, retry, batch item, and failure tracking. | `measurement_batches`, `measurement_batch_items`, `measurement_runs.status`, scripts for operator flows. | partial | medium | Later measurement job workflow PR | Batch tables exist, but customer-grade queue/retry semantics are not the current priority. |
| Customer data deletion / retention | Retention and deletion policy for org/project/run/answer/citation data. | No dedicated retention/deletion policy identified in the audited artifacts. | needs_design | high | Later data-retention design PR | Required before broader customer operations and offboarding. |

## P0 findings

P0 foundation is partially present, but not customer-complete.

- Customer/org/project boundary exists through `organizations`, `organization_members`, and `projects.organization_id`, but needs a written customer visibility contract.
- Project/brand/competitor modeling exists through `brands.brand_type`, but first-class competitor ownership and alias handling remain unresolved.
- Project/prompt relations exist, but prompt approval, measurement readiness, and rich persona/use-case/funnel metadata are incomplete.
- `prompt_type` and `measurement_purpose` columns exist, but historical rows remain null and are not safe to backfill automatically.
- Measurement result relations exist, but the official measured prompt snapshot is not first-class.
- Recommendation rows and a recommendation publication predicate exist, but report-level publication state is still not first-class.
- RLS exists and should be treated as a launch blocker until a dedicated read-only RLS/grants/advisors audit confirms the live surface.

## P1 findings

P1 operational DB work has useful foundations, but most customer operations are still partial.

- Source freshness and source-to-claim fields exist, but source owner type and publication-review workflow need stronger schema/read-model contracts.
- Recommendation review status, Page Brief, and Action Plan concepts are documented but need durable workflow fields.
- Plan configs and customer subscriptions exist in `recora_admin`, but customer entitlement, quota, and usage limits are not yet a customer-facing contract.
- Measurement batches and batch items exist, but retry/error/queue semantics need a later operational design pass.
- Audit-event tables exist, but write actors, retention, and customer-visible audit boundaries need decisions.

## P2 findings

P2 items should wait until the P0/P1 customer DB surface is stable.

- Sentiment, caveat, and narrative labels can improve reports, but they must stay separate from visibility/ranking/SOV.
- Claim-to-source review should become more explicit before claims are published to customers.
- Measurement job retry and failure handling should be formalized after the customer boundary and publication state are settled.
- Customer data deletion and retention need a later privacy/compliance design before broader customer onboarding.

## RLS and visibility concerns

The repository has meaningful RLS foundations, but customer launch should require a separate read-only RLS readiness audit.

Required checks for the next RLS audit:

- confirm all customer-related public tables have RLS enabled in the live database
- confirm `anon` and `authenticated` grants are necessary and safely constrained by policies
- confirm Customer A cannot read Customer B project/report data
- confirm `recora_admin` tables and read-only RPCs are not exposed to customer clients
- confirm SECURITY DEFINER helper functions are not broadly exposed beyond intended use
- confirm any views used for customer reporting are security-invoker or otherwise tenant-safe
- confirm report publication state prevents unapproved drafts from appearing as `customer_ready`
- confirm Supabase Advisors have no WARN/ERROR blocker for customer launch

This PR does not change RLS or grants.

## Recommended PR sequence

1. `docs/customer-db-readiness-audit`
   - This PR.
   - Docs-only.
   - No DB write.

2. `docs/customer-org-project-boundary-design`
   - Define customer, organization, project, membership, and report visibility semantics.
   - No UI.
   - No migration.

3. `chore/customer-db-rls-readiness-audit`
   - Read-only audit of RLS, policies, grants, exposed tables, functions, and advisors.
   - No DB write.

4. `docs/measurement-prompt-snapshot-design`
   - Define the relationship between prompt definitions and immutable measured prompt snapshots.
   - No migration.

5. `feat/customer-prompt-metadata-schema-local`
   - Add local migration for persona/use_case/funnel_stage/topic/category and prompt readiness metadata.
   - No remote apply.

6. `feat/report-publication-state-schema-local`
   - Add local migration for report publication state.
   - No remote apply.

7. `feat/source-owner-freshness-schema-local`
   - Add local migration for source owner/freshness metadata.
   - No remote apply.

8. `feat/recommendation-workflow-schema-local`
   - Add local migration for recommendation review, Page Brief, and Action Plan workflow.
   - No remote apply.

9. `docs/customer-plan-subscription-db-design`
   - Design plan_config, subscription, usage, quota, and entitlement linkage.
   - No Stripe implementation.

10. Remote apply PRs
   - One explicit remote-apply checkpoint per migration.
   - Stop before `supabase db push` until approved.

11. Backfill dry-run / apply PRs
   - One dry-run and one apply checkpoint per field group.
   - Prompt scope backfill apply only after human review yields `approve_explicit_backfill`.

## Stop points for DB work

Stop and ask for explicit human approval before:

- creating any migration file
- running any remote DB write
- running `supabase db push`
- running backfill apply, seed, repair, or reset
- changing RLS, grants, policies, or function exposure
- making any report publication state customer-visible
- recalculating or rewriting historical metrics
- adding dependencies or changing `package-lock.json`
- touching LP, Auth, handoff, or customer-facing UI code

## Open decisions

- What is the final customer/org/project/member visibility contract?
- Should competitors remain `brands.brand_type = competitor`, or should Recora add a first-class project competitor table?
- Which prompt metadata fields are required before a prompt becomes measurement-ready?
- Where should immutable measured prompt snapshots live?
- Is report publication state best modeled in `public`, `recora_admin`, or a customer-facing read model boundary?
- How should Page Brief and Action Plan workflow data relate to recommendations?
- How should plan, subscription, usage, and measurement quota be linked to organization/project scope?
- What source owner/freshness values are safe to show to customers?
- How should claim-to-source review be represented before publication?
- What retention and deletion policy is required for customer data?
