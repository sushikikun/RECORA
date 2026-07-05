# Recora Customer Measurement DB Readiness Audit

Status: Read-only/docs-only readiness audit
Last updated: 2026-07-04

## Overview

This document audits the current readiness of Recora's Customer Measurement DB layer: the logical source-of-truth layer for official measured result data.

It follows:

- `docs/recora-customer-vs-admin-db-boundary-design.md`
- `docs/recora-customer-db-readiness-audit.md`
- `docs/recora-customer-org-project-boundary-design.md`
- `docs/recora-admin-db-current-state-audit.md`
- `docs/recora-report-data-readiness.md`
- `docs/recora-report-tabs-spec.md`
- `docs/recora-report-metric-contracts.md`
- `docs/recora-prompt-scope-db-migration-plan.md`
- `docs/recora-prompt-scope-backfill-review-record.md`
- `docs/recora-operational-db-completion-plan.md` records daily batch measurement, plan/model limits, publication, rerun, answer visibility, and recommendation publishing decisions for later DB work.

The audit finding is that Recora already has a useful measured-result table set in `public`, but it is not yet a complete Customer Measurement DB contract. Core evidence tables exist for projects, brands, prompts, runs, run items, AI answers, mentions, citations, source domains, metrics, and recommendations. The main gaps are measurement-time prompt snapshots, first-class prompt/persona/topic metadata snapshots, clear separation from Admin Control DB execution state, and projection readiness into a Customer Published Read Model.

This PR is docs-only. It does not create migrations, write to any database, run Supabase db push, apply backfill, change RLS/policies/grants, run external APIs, implement UI, change Auth/middleware/LP/handoff files, or change `package-lock.json`.

## Scope

This audit covers:

- current measurement/result tables that could belong to Customer Measurement DB
- join paths from measured rows back to project and organization scope
- prompt definition and measurement-time prompt snapshot readiness
- prompt scope readiness for `prompt_type` and `measurement_purpose`
- persona, topic, use-case, funnel-stage, and category metadata readiness
- AI answer, brand mention, competitor mention, citation, source, metric, and recommendation evidence readiness
- projection readiness from measured source data to a future Customer Published Read Model
- read-only Supabase schema observations for candidate tables, columns, foreign keys, RLS flags, policies, row estimates, constraints, views, and relevant SECURITY DEFINER functions

## Non-goals

This audit does not:

- implement Customer Measurement DB tables, schemas, views, RLS, policies, grants, or helper functions
- create or edit database migrations
- run `supabase db push`, remote apply, repair, reset, seed, or backfill apply
- run UPDATE, INSERT, DELETE, ALTER, CREATE, DROP, GRANT, REVOKE, TRUNCATE, or COMMENT SQL against the remote DB
- inspect customer row bodies, prompt text bodies, AI answer bodies, citation URL inventories, raw recommendation bodies, secrets, DB URLs, tokens, cookies, passwords, or `.env` values
- execute OpenAI, web crawl, search, measurement, or external API jobs
- implement customer-facing UI, admin UI, Auth, middleware, LP, or handoff changes
- change `package.json` or `package-lock.json`
- decide final physical database split, final table names, final retention policy, or final customer auth model

## Audit method

Repository checks:

- Started from a clean worktree on `docs/customer-measurement-db-readiness-audit` at `origin/master`.
- Confirmed the worktree branch, HEAD, and `origin/master` were aligned before editing.
- Read the three-layer DB boundary design, customer DB readiness audit, admin DB audit, customer/org/project boundary design, report data readiness, report tabs spec, metric contracts, prompt scope migration plan, prompt scope backfill review record, and Recora operating instructions.
- Searched migrations and DB read-model code for measured result tables, prompt scope fields, prompt metadata, source metadata, metric snapshots, recommendation evidence, RLS, and report projection paths.

Supabase checks:

- Used Supabase CLI `2.109.0` via `npx --yes supabase`.
- Used the linked Recora project without displaying project ref, DB URL, token, password, or secrets in this document.
- Ran SELECT-only `supabase db query --linked --file <temp sql>` checks for:
  - candidate objects and RLS flags
  - candidate table columns
  - candidate foreign keys
  - row estimates
  - constraint names and types
  - measurement/report/customer-related views and materialized views
  - measurement/report/customer-related SECURITY DEFINER functions
  - candidate table policy counts

No DB write, migration, Supabase db push, backfill, seed, repair, reset, or external API execution was performed.

Read-only Supabase summary:

- Candidate tables found: 13 of 13.
- Candidate tables with RLS enabled: 13 of 13.
- Candidate tables with forced RLS: 0 of 13.
- Candidate tables with one select policy each: 13 of 13.
- Measurement/report/customer-related views or materialized views found: 0.
- Measurement/report/customer-related public SECURITY DEFINER functions found: 0.
- Row estimates are small and should be treated as rough PostgreSQL estimates, not production completeness proof.

## Current measurement/result inventory

The current `public` schema contains the main measured-result candidates:

| Table | Current role | Read-only observation | Measurement DB readiness |
| --- | --- | --- | --- |
| `projects` | Project scope and organization reference. | Has `organization_id`; RLS enabled. | Scope foundation exists, but Admin Control DB remains ownership source-of-truth. |
| `brands` | Primary and competitor brand records. | `brand_type`, `domain`, `aliases`, `category`; RLS enabled. | Useful for measurement context; first-class competitor model remains undecided. |
| `personas` | Project persona definitions. | `segment`, `weight`, `jobs`, `pain_points`; RLS enabled. | Partial; no measurement-time persona snapshot. |
| `topics` | Project topic definitions. | `intent`, `priority`, `weight`; RLS enabled. | Partial; no category/use-case/funnel metadata contract. |
| `prompts` | Project prompt definitions. | `prompt_type` and `measurement_purpose` columns and checks exist; RLS enabled. | Partial; current rows still need explicit reviewed metadata and measurement-time snapshot copy. |
| `measurement_runs` | Run/result metadata and current run lifecycle fields. | `project_id`, `status`, period, region, language, metadata; RLS enabled. | Useful source, but execution state and measured result state are still coupled. |
| `run_items` | Per-run prompt/persona/model execution rows. | FKs to run, prompt, persona, model; RLS enabled. | Good join hub; lacks official prompt scope/metadata snapshot fields. |
| `ai_conversations` | AI answer evidence and prompt text snapshot. | `raw_answer`, `answer_summary`, `prompt_text_snapshot`, model/provider fields; RLS enabled. | Answer source exists; prompt text snapshot is not a full measurement prompt snapshot. |
| `brand_mentions` | Answer-level brand/competitor mention evidence. | FKs to conversation and brand; mention counts, position, sentiment, evidence snippet; RLS enabled. | Useful evidence; competitor mentions are represented through `brands.brand_type`, not a separate table. |
| `citations` | Citation/source evidence per answer. | URL/domain, canonical URL, source type, spans, source-to-claim, freshness fields; RLS enabled. | Strong partial source evidence; owner/freshness contracts need hardening. |
| `source_domains` | Project source-domain catalog. | `project_id`, `source_type`, `owner_brand_id`, `trust_label`; RLS enabled. | Useful source owner candidate; no explicit `owner_type` enum separate from `source_type`. |
| `metric_snapshots` | Calculated aggregate metric rows. | Run FK, scope type/id, brand FK, visibility/SOV/count fields, metadata; RLS enabled. | Partial; needs metric contract/version and source-run traceability rules for published snapshots. |
| `recommendations` | Improvement candidates and reviewed/published-like states. | Project/run/topic/prompt references, score fields, status, metadata; RLS enabled. | Evidence relation exists, but workflow and published recommendation snapshots are not first-class. |

Estimated live rows from read-only inspection:

| Table | Estimated rows |
| --- | ---: |
| `projects` | 1 |
| `brands` | 5 |
| `personas` | 4 |
| `topics` | 5 |
| `prompts` | 8 |
| `measurement_runs` | 6 |
| `run_items` | 26 |
| `ai_conversations` | 26 |
| `brand_mentions` | 130 |
| `citations` | 51 |
| `source_domains` | 34 |
| `metric_snapshots` | 18 |
| `recommendations` | 6 |

## Candidate Customer Measurement DB tables

The current Customer Measurement DB candidate set is:

- `measurement_runs`
- `run_items`
- `ai_conversations`
- `brand_mentions`
- `citations`
- `source_domains`
- `metric_snapshots`
- `recommendations`
- `prompts`
- `personas`
- `topics`
- `brands`
- `projects` as a scope reference only

These are candidates for the logical measured-result layer, not a final physical schema decision. The current tables live in `public` and should not be treated as a finished customer-facing read surface. Customer screens should read a Customer Published Read Model after publication approval, not raw or near-raw measurement rows by default.

## Join path readiness

Confirmed join paths:

| Source row | Project/organization path | Status | Notes |
| --- | --- | --- | --- |
| `brands` | `brands.project_id -> projects.id -> projects.organization_id` | ready | Direct project scope exists. |
| `personas` | `personas.project_id -> projects.id -> projects.organization_id` | ready | Direct project scope exists. |
| `topics` | `topics.project_id -> projects.id -> projects.organization_id` | ready | Direct project scope exists. |
| `prompts` | `prompts.project_id -> projects.id -> projects.organization_id` | ready | Direct project scope plus topic/persona FKs exist. |
| `measurement_runs` | `measurement_runs.project_id -> projects.id -> projects.organization_id` | ready | Direct project scope exists. |
| `run_items` | `run_items.run_id -> measurement_runs.project_id -> projects.organization_id` | ready | Also links to prompt/persona/model. |
| `ai_conversations` | `ai_conversations.run_item_id -> run_items.run_id -> measurement_runs.project_id` | ready | Short join path exists, but no direct `project_id`. |
| `brand_mentions` | `brand_mentions.conversation_id -> ai_conversations -> run_items -> measurement_runs.project_id` | ready | Also links to `brands`. |
| `citations` | `citations.conversation_id -> ai_conversations -> run_items -> measurement_runs.project_id` | ready | Also links to `source_domains` and optional `brands`. |
| `source_domains` | `source_domains.project_id -> projects.id -> projects.organization_id` | ready | Direct project scope exists. |
| `metric_snapshots` | `metric_snapshots.run_id -> measurement_runs.project_id -> projects.organization_id` | ready | Also links to optional `brands`. |
| `recommendations` | `recommendations.project_id -> projects.id -> projects.organization_id` | ready | Also links to optional run/topic/prompt. |

Join-path risk:

- Several evidence rows depend on multi-hop joins rather than direct `project_id`.
- RLS already exists, but customer launch still needs a dedicated read-only RLS/grants/advisors audit for Customer Measurement DB and Customer Published Read Model.
- Customer-facing UI should prefer published snapshots so direct multi-hop joins do not become the display contract.

## Prompt snapshot readiness

Current readiness is partial.

Existing foundations:

- `prompts` stores prompt definitions, project/topic/persona references, prompt text, intent, buyer stage, priority, and active status.
- `run_items` links a run to prompt, persona, and model.
- `ai_conversations.prompt_text_snapshot` stores the prompt text used for an answer.
- `ai_conversations.model_snapshot`, provider/model fields, response id, usage, web search flag, citation status, measured timestamp, and response time fields provide answer-execution context.

Missing for Customer Measurement DB:

- no first-class measurement prompt snapshot table
- no run-time copy of `prompt_type` and `measurement_purpose`
- no run-time copy of persona/use-case/funnel-stage/topic/category metadata
- no prompt-set version or prompt approval/materialization version on the measured run
- no durable distinction between current mutable prompt definition and the official prompt context used at measurement time

Readiness judgment:

- `ai_conversations.prompt_text_snapshot` is useful evidence, but it is not enough to preserve official prompt scope, purpose, persona, topic, and category semantics.
- A future measurement prompt snapshot should be introduced before customer-facing report snapshots depend on prompt scope metrics.

## Prompt scope readiness

Current readiness is partial.

Confirmed:

- `public.prompts.prompt_type text` exists.
- `public.prompts.measurement_purpose text` exists.
- `prompts_prompt_type_check` exists.
- `prompts_measurement_purpose_check` exists.
- Prior dry-run review found 8 prompt rows with both official fields null, `safe_explicit_candidate = 0`, and `apply_candidate = false` for all rows.
- Report tab logic treats missing official prompt scope as `needs_metadata` and keeps inferred/missing scope out of official visibility/ranking/SOV eligibility.

Gaps:

- Existing rows are not officially classified.
- Common DB prompt fetch constants and shared `RecoraPromptRow` types are not yet a durable all-read-path contract for the new fields.
- Measurement-time prompt snapshots do not copy these fields.
- No approved backfill apply exists.

Readiness judgment:

- Schema fields exist, but Customer Measurement DB is not yet ready to use historical prompt rows for official visibility/ranking/SOV metrics unless explicit reviewed metadata is present and copied into measurement-time snapshots.

## Persona/topic metadata readiness

Current readiness is partial.

Existing foundations:

- `personas` has name, segment, weight, jobs, and pain points.
- `topics` has name, intent, priority, and weight.
- `prompts` links to topic and optional persona.
- `prompts.buyer_stage` can partially stand in for funnel stage in read-model code.

Missing:

- no first-class `use_case`
- no first-class `funnel_stage` separate from the partial `buyer_stage` field
- no first-class prompt/category metadata for report segmentation
- no approved/draft/materialized prompt state in Customer Measurement DB
- no measurement-time snapshot of persona/topic/category values

Readiness judgment:

- Persona/topic joins are usable for partial reporting, but stable customer measurement reports need explicit and snapshotted metadata before T03/T04 analysis can be treated as official.

## AI answer readiness

Current readiness is strong partial.

Existing foundations:

- `ai_conversations` stores `raw_answer`, `answer_summary`, `answer_hash`, prompt text snapshot, model snapshot, provider/model fields, response id, usage, web search flag, citation status, measured timestamp, and response time.
- `ai_conversations` has a unique constraint on `run_item_id`, which supports one answer record per run item.
- Report/read-model code treats AI answers as evidence and filters displayable results.

Gaps:

- raw provider payload retention and customer display boundaries need a retention/display policy.
- answer text is untrusted input and must not be published without a display-safe projection.
- no Customer Published Read Model snapshot exists for approved answer excerpts.

Readiness judgment:

- AI answer source evidence exists, but customer-facing use should pass through published answer snapshots or equivalent projection rules.

## Brand and competitor mention readiness

Current readiness is partial.

Existing foundations:

- `brands.brand_type` separates `primary` and `competitor`.
- `brand_mentions` links an AI conversation to a brand and stores mention state, position, recommendation status, sentiment, answer score, mention count, first mention index, evidence snippet, confidence, and matched alias.
- The table has a conversation/brand unique constraint.

Gaps:

- no separate `competitor_mentions` table; competitor evidence is inferred through the linked brand's `brand_type`.
- no first-class discovered competitor candidate workflow.
- sentiment/narrative/caveat labels are still partial and should stay separate from visibility/ranking/SOV metrics.
- prompt echo contamination and alias matching still need dedicated QA before customer publication.

Readiness judgment:

- Brand/competitor mention evidence is usable for measured source analysis, but published customer display needs explicit quality gates and a snapshot boundary.

## Citation/source readiness

Current readiness is strong partial.

Existing foundations:

- `citations` stores URL/domain/title/source type, occurrence count, canonical URL, answer span indexes, cited text, raw citation metadata, brand relatedness, source-to-claim status, claim text, reviewer note, retrieved/published/modified timestamps, freshness status, and freshness days.
- `source_domains` stores project-scoped domain, source type, owner brand reference, and trust label.
- Citation rows can join back to project through conversation/run-item/run and can also link to source domains.

Gaps:

- `source_type` is currently doing work close to owner classification, but report docs still call for explicit `owner_type` semantics such as owned, competitor, third party, and unknown.
- source freshness is present but depends on extraction quality and should preserve unknown/not-checked states.
- source-to-claim fields exist, but review workflow and publication requirements are not first-class.
- there is no published citation/source snapshot table.

Readiness judgment:

- Citation/source evidence is one of the stronger measured-result areas, but it still needs explicit owner/freshness/source-to-claim publication rules before customer display.

## Metric snapshot readiness

Current readiness is partial.

Existing foundations:

- `metric_snapshots` stores run, scope type/id, brand id, AI visibility, AI mention count, citation count, share of voice, competitive gap, average position, calculated timestamp, and metadata.
- Constraints protect range and non-negative values.
- Report context code uses aggregate runs and `metadata.source_run_id` to relate metric snapshots back to source measurement runs.

Gaps:

- metric definition/version is not first-class.
- old and new prompt-scope eligibility cannot be compared safely without explicit scope metadata and snapshot provenance.
- metric snapshots are aggregate output, not raw evidence source-of-truth.
- no Customer Published Read Model snapshot exists for customer-visible metric values.

Readiness judgment:

- Metric snapshots are useful derived measurement rows, but customer-facing reports need metric contract/version and publication snapshot boundaries before they become stable display contracts.

## Recommendation evidence readiness

Current readiness is partial.

Existing foundations:

- `recommendations` links to project, optional run, optional topic, and optional prompt.
- Recommendation rows contain type, priority, impact/effort scores, title, reason, target URL, status, and metadata.
- Read-model code distinguishes pre-quality-gate and reviewed recommendation candidates.
- Existing visibility rules try to exclude hidden, suppressed, review-required, candidate-only, and pre-quality-gate rows.

Gaps:

- no first-class recommendation review event table is confirmed in the measured-result layer.
- Page Brief and Action Plan are not durable published customer artifacts yet.
- recommendation evidence relations still depend partly on optional FKs and metadata.
- no approved customer-visible recommendation snapshot exists.

Readiness judgment:

- Recommendation rows can reference measurement evidence, but approved customer-facing recommendation artifacts belong in Customer Published Read Model after Admin Control DB review and publication approval.

## Projection readiness to Customer Published Read Model

Current readiness is not complete.

Projection inputs that exist:

- project/organization scope
- brands and competitors
- prompts, personas, topics
- measurement runs and run items
- AI answer evidence
- brand mention evidence
- citation/source evidence
- metric snapshots
- recommendation candidates and metadata

Projection blockers:

- no first-class published report snapshot table
- no published measurement snapshot table
- no published prompt snapshot table
- no published answer/citation/source snapshot table
- no published metric snapshot table
- no published recommendation, Page Brief, or Action Plan snapshot table
- no explicit projection/materialization tracking from Admin Control DB approval to Customer Published Read Model
- no snapshot version/published_at/published_by contract

Readiness judgment:

- Customer Measurement DB source rows are present enough to design projections, but Customer Published Read Model readiness must be audited and designed before customer-facing report UI reads customer data by default.

## Findings

Blocker:

- Measurement-time prompt snapshots are not first-class. Prompt text is snapshotted on `ai_conversations`, but official prompt scope, measurement purpose, persona/use-case/funnel-stage/topic/category, prompt approval/materialization version, and prompt-set version are not preserved as a measurement-time contract.
- Customer Measurement DB source rows and Customer Published Read Model snapshots are not separated yet. Customer-facing report display should not depend directly on raw or near-raw measurement evidence tables.
- `measurement_runs` still carries both execution lifecycle/status and measured result lineage. Admin Control DB job/execution state and Customer Measurement DB official result state need clearer separation before customer launch.

High:

- `prompt_type` and `measurement_purpose` exist remotely, but existing prompt rows remain unapproved/null from the prior dry-run review and cannot safely enter official visibility/ranking/SOV eligibility.
- Persona/use-case/funnel-stage/topic/category metadata is incomplete and not snapshotted at measurement time.
- Recommendation review, Page Brief, Action Plan, and approved customer recommendation snapshots are not first-class.
- Metric snapshots need metric definition/version and prompt-scope provenance before stable customer publication.

Medium:

- Citation/source evidence is comparatively mature, but owner type, freshness, source-to-claim review, and display rules need a dedicated schema/read-model design.
- Competitor mentions are represented through `brand_mentions` plus `brands.brand_type`, not a first-class competitor mention surface.
- Public candidate tables have RLS enabled and one select policy each, but customer launch still needs dedicated RLS/grants/advisors audits for measured result data and published read models.

Low:

- Row estimates are useful orientation only, not production data completeness proof.
- No measurement/report/customer-related views or materialized views were found, which keeps the current shape simple but means published read-model projection is still missing.

## Missing capabilities

Customer Measurement DB still needs:

- measurement prompt snapshot schema/design
- prompt-set version or materialized prompt version
- run-time copies of `prompt_type` and `measurement_purpose`
- run-time copies of persona/use-case/funnel-stage/topic/category metadata
- explicit prompt approval/materialization state before measurement
- source owner type and source freshness publication rules
- source-to-claim review/publication rules
- metric contract/version/provenance
- recommendation evidence mapping and review workflow separation
- projection/materialization tracking into Customer Published Read Model
- published snapshot source references and snapshot versioning
- retention/archive/delete design for raw answers, citations, measured results, and published snapshots

## Recommended next PRs

1. `docs/customer-published-read-model-readiness-audit`
   - Read-only/docs-only audit of published report/read-model snapshot readiness.
   - Confirm published report snapshots, published prompt/answer/citation/source/metric snapshots, approved recommendations, Page Brief, and Action Plan boundaries.
   - No DB write.

2. `docs/measurement-prompt-snapshot-design`
   - Define the immutable measurement-time prompt snapshot contract.
   - Include prompt text, prompt scope, measurement purpose, persona/use-case/funnel-stage/topic/category, model/run references, prompt-set version, and approval/materialization provenance.
   - No migration.

3. `docs/measurement-result-projection-design`
   - Define Admin Control DB execution state -> Customer Measurement DB result source -> Customer Published Read Model projection.
   - Keep execution lifecycle, measured evidence, and published display snapshots separate.

4. `docs/report-publication-projection-design`
   - Define report publication state, review decisions, projection timing, snapshot versioning, and customer visibility rules.

5. `feat/measurement-prompt-snapshot-schema-local`
   - Local-only additive migration after the design is approved.
   - Stop before remote apply.

6. `feat/customer-published-report-snapshot-schema-local`
   - Local-only additive migration for published report/read-model snapshots.
   - Stop before remote apply.

7. `feat/customer-source-snapshot-schema-local`
   - Local-only additive migration for source/citation owner, freshness, source-to-claim, and display-safe source snapshot fields.
   - Stop before remote apply.

8. `feat/customer-visible-recommendation-schema-local`
   - Local-only additive migration for approved customer recommendation snapshots, Page Brief, and Action Plan artifacts.
   - Stop before remote apply.

9. `chore/customer-measurement-db-rls-readiness-audit`
   - Read-only audit of measured-result table grants, policies, helper functions, tenant joins, views, and advisors.
   - Run after the measurement/publication boundary is clearer.

10. `chore/customer-published-read-model-rls-readiness-audit`
   - Read-only audit of customer-facing published snapshot grants, policies, helper functions, views, and advisors.
   - Run before customer-facing reads are treated as launch-ready.

Remote apply and backfill PRs must remain separate explicit checkpoints.

## Open decisions

- Should Customer Measurement DB remain in `public`, move to a dedicated schema, or later become a physical split?
- Should measurement prompt snapshots live on `run_items`, in a dedicated table, or in a broader measurement result snapshot table?
- Which prompt metadata fields are required for the first official customer report: persona, use_case, funnel_stage, topic, category, prompt-set version, approval state, or all of them?
- Should competitors remain in `brands.brand_type = competitor`, or should Recora add first-class project competitor and competitor mention tables?
- What exact metric definition/version fields are required before published metric snapshots are stable?
- Which source owner/freshness/source-to-claim values belong in Customer Measurement DB versus Customer Published Read Model?
- How should recommendation evidence, review events, Page Brief, and Action Plan versions connect to measured evidence?
- What publication state creates a customer-visible report snapshot, and where should projection/materialization status live?
- What retention, archive, deletion, and customer data export rules apply to raw answers, citations, measured result rows, published snapshots, and admin audit data?
- Which dedicated RLS audit should run first after published read-model readiness: Customer Measurement DB or Customer Published Read Model?
