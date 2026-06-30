# Recora Prompt Scope DB Migration Plan

Status: Local migration added / remote apply pending
Last updated: 2026-07-01

This document started as a plan and proposal. It now records the local schema migration file added for review, while remote execution remains out of scope.

This PR creates a local migration file only.
This PR does not run Supabase db push.
This PR does not write to any remote DB.
This PR does not execute external APIs.
This document is not the final customer-facing public specification.

The prompt scope basis is to avoid mixing visibility, ranking, and Share of Voice with sentiment, brand perception, and citation validation. Visibility/ranking/SOV must be traceable to prompts that are eligible for market-discovery measurement, not to branded, named-comparison, competitor-seeded, or citation-only checks.

## Overview

PR #45 added code-level first-class prompt scope contracts in `lib/recora/prompt-scope.ts`:

- `prompt_type`
- `measurement_purpose`
- explicit / inferred / missing scope status
- helper functions that only allow explicit `non_branded` scope into visibility, ranking, and SOV

The next database work should make those concepts durable without silently changing historical metrics. This document records the recommended persistence model, backfill approach, validation gates, and PR split before any migration is written or applied.

## Current state

Confirmed from repo artifacts only:

- `lib/recora/prompt-scope.ts` defines prompt types, measurement purposes, labels, and metric-eligibility helpers.
- `scripts/verify-prompt-scope.ts` verifies that named comparison, named competitor, citation check, missing, inferred, and `comparison_generic` scopes do not currently enter visibility/ranking/SOV.
- `lib/recora/report-tabs-view-model.ts` reads `prompt_type` and `measurement_purpose` from prompt fields, camelCase fields, or `metadata`, then marks missing official values as `needs_metadata`.
- `components/recora/report-tabs/recora-report-tabs.tsx` displays prompt scope metadata and keeps inferred, missing, or unknown scope out of official metric eligibility.
- The repo migration `supabase/migrations/0001_recora_v01_schema.sql` defines `public.prompts` with `text`, `intent`, `buyer_stage`, priority, active status, and timestamps. It does not define `prompt_type` or `measurement_purpose`.
- The same migration stores run execution through `public.run_items` and answer evidence through `public.ai_conversations.prompt_text_snapshot`.
- `public.metric_snapshots` is documented as aggregate data whose source of truth remains raw run items, AI conversations, brand mentions, and citations.
- `docs/recora-admin-db-design.md` already notes a later first-class column review for `public.prompts.prompt_type`, `metric_eligibility`, `prompt_set_version`, and run prompt-set versioning.
- Project setup drafts are generated as `needs_review` and are not automatically approved or measurement-ready.
- Local migration file `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql` now adds nullable `prompt_type` and `measurement_purpose` columns to `public.prompts` only, with allowed-value check constraints.
- The local migration file has not been applied to any linked Supabase project or remote DB.

Not confirmed in this PR:

- live DB schema
- remote migration history
- production row counts
- real prompt metadata distribution
- final table names for draft, approved prompt, materialized prompt, or run prompt snapshot
- RLS and grant details for any new future columns

## Goals

- Define where official `prompt_type` and `measurement_purpose` should live.
- Preserve the distinction between explicit, inferred, and missing scope.
- Give T04 and report read models a stable path from `needs_metadata` toward explicit metadata.
- Plan a safe backfill that does not reinterpret historical metrics silently.
- Keep visibility/ranking/SOV separated from branded sentiment, brand perception, named competitor comparison, and citation validation.
- Identify human checkpoints before remote DB application or backfill writes.

## Non-goals

- No remote migration execution in this PR.
- No Supabase db push.
- No local or remote DB writes.
- No metric recalculation job.
- No UI implementation.
- No external API execution.
- No LP/Auth/handoff/package-lock changes.
- No customer-facing public promise that AI visibility, ranking, citation, traffic, or revenue will improve.

## Prompt scope contract

Prompt types:

| Value | Meaning | Default metric role |
|---|---|---|
| `non_branded` | Target brand and aliases are excluded from prompt text. | Primary scope for visibility/ranking/SOV when purpose matches. |
| `branded` | Target brand or alias is included. | Sentiment, brand perception, caveat, and narrative only. |
| `comparison_generic` | Generic category/use-case comparison without named brands. | Not automatically eligible yet. Candidate for later market metrics only with explicit approval rules. |
| `comparison_named` | Comparison includes target brand, competitor, or named brands. | Excluded from visibility/ranking/SOV. |
| `competitor_named` | Prompt seeds a known competitor name or alias. | Excluded from visibility/ranking/SOV. |
| `citation_check` | Prompt is for citation or source validation. | Citation validation only, not ranking evidence. |

Measurement purposes:

| Value | Meaning |
|---|---|
| `visibility` | Observe whether the target brand appears in AI answers. |
| `ranking` | Observe recommendation order, answer position, or comparable-set order. |
| `sov` | Observe Share of Voice in the same valid prompt scope. |
| `sentiment` | Observe answer tone about a branded query. |
| `brand_perception` | Observe how AI describes or frames the brand. |
| `citation_validation` | Observe citations, URLs, and source grounding. |
| `recommendation_input` | Feed improvement candidate generation after quality gates. |

Core rules:

- visibility/ranking/SOV primarily use `non_branded` prompts.
- branded prompts are sentiment/brand perception/caveat/narrative only.
- `comparison_named` and `competitor_named` must not be mixed into visibility/ranking/SOV.
- `citation_check` is citation validation, not ranking evidence.
- A comparison prompt containing the target brand or alias is excluded from visibility/ranking/SOV.
- If `knownCompetitors` exist, named competitor comparison prompts must be detected and avoided for non-branded market metrics.
- Do not generate competitor names without evidence.
- Unapproved project setup drafts are not measurement ready.
- Inferred classification is not official scope and backfill must handle it carefully.

## Candidate persistence locations

| Location | Pros | Cons |
|---|---|---|
| Prompt definition / project prompt table, likely `public.prompts` or its future materialized equivalent | Closest to prompt meaning. Good source for T04 filters and measurement scope. Easy for read models to join. | Requires real schema confirmation. Needs a clear draft / approved / materialized boundary. Current repo migration does not have the fields. |
| Project setup draft / generated prompt draft | Generator can emit candidate type and purpose before approval. Useful for operator review. | Unapproved draft is not measurement-ready. Weak audit source if it is the only persistence layer. |
| Measurement run prompt snapshot, likely run-item or AI-conversation snapshot extension | Captures the official scope used at measurement time. Historical runs stay stable even if prompt definitions change later. | Duplicates prompt-definition metadata. Backfill and migration are heavier. Exact table shape needs schema design. |
| `metric_snapshots` or derived metrics | Close to aggregate result display. | Bad source of truth for prompt scope. Too late for prompt filtering. Can hide mixed-scope inputs. |
| `ai_answers` / `ai_conversations`, `brand_mentions`, `citations` | Near raw evidence and downstream extraction. | Not the source of prompt meaning. Would duplicate scope across answer and evidence rows. Better for joins or snapshots, not official prompt scope ownership. |

## Recommended persistence model

Recommended future model:

- Store explicit `prompt_type` and `measurement_purpose` on the approved prompt definition or materialized project prompt row.
- Copy official `prompt_type` and `measurement_purpose` into a measurement-time prompt snapshot when a run item is executed.
- Allow project setup drafts to hold candidate values, but keep them as draft metadata until operator approval and materialization.
- Do not make `metric_snapshots`, `brand_mentions`, `citations`, or `ai_conversations` the source of truth for prompt scope.
- Use joins or measurement-time snapshots when downstream evidence rows need to display scope.
- Preserve historical run interpretation by reading the measurement-time snapshot for past runs rather than the current mutable prompt definition.

This remains subject to live schema confirmation before any remote apply. The local migration below is the first additive schema file and does not execute against a remote DB.

Future schema design should decide whether to use Postgres enums, text with check constraints, or a reference table. Whichever option is chosen, the allowed values must stay aligned with `lib/recora/prompt-scope.ts`.

## Local schema migration added (2026-07-01)

Migration file:

- `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql`

Target table:

- `public.prompts` only

Added columns:

- `prompt_type text`
- `measurement_purpose text`

Constraints:

- `prompts_prompt_type_check`
- `prompts_measurement_purpose_check`

Allowed `prompt_type` values:

- `non_branded`
- `branded`
- `comparison_generic`
- `comparison_named`
- `competitor_named`
- `citation_check`

Allowed `measurement_purpose` values:

- `visibility`
- `ranking`
- `sov`
- `sentiment`
- `brand_perception`
- `citation_validation`
- `recommendation_input`

Scope memo:

- Prompt definition candidate: `public.prompts` is the only safely identified prompt definition table in the repo migrations.
- Draft prompt candidate: no DB-backed draft prompt table is safely identified in the repo migrations. Project setup drafts remain TypeScript/domain-model drafts and are not measurement-ready until approved and materialized.
- Measurement-run prompt snapshot candidate: no dedicated run prompt snapshot table is safely identified. `public.run_items` links to `public.prompts`, and `public.ai_conversations.prompt_text_snapshot` stores answer evidence text, not official prompt scope ownership.
- Downstream evidence and aggregate tables are not targeted. The migration does not alter `public.ai_conversations`, `public.brand_mentions`, `public.citations`, `public.metric_snapshots`, or `public.recommendations`.
- Nullable field additions are enough for this local schema step because existing rows can remain `null` / `needs_metadata` until a separately approved remote apply and backfill.

Remote and data status:

- No Supabase db push was executed.
- No remote DB write was executed.
- No production DB write was executed.
- No backfill was executed.
- Existing rows remain unchanged; after future remote apply they will remain `null` until a separate approved backfill.
- T04 `needs_metadata` remains the expected behavior until the migration is remotely applied and explicit metadata is backfilled or materialized.

Open design points after this local migration:

- Whether measurement-time scope should later be copied onto `public.run_items`, a dedicated prompt snapshot table, or another approved snapshot model.
- Whether project setup drafts should persist candidate scope values in a future draft table or stay as operator-reviewed domain-model output until materialization.
- Whether future remote apply should generate DB types or additional schema checks after the linked project is explicitly approved.

## Backfill strategy

Backfill should categorize rows before writing any data.

### Read-only dry-run script

PR 1 of the customer DB completion track adds:

- `scripts/inspect-recora-prompt-scope-backfill.ts`
- `npm run recora:prompt-scope-backfill:dry-run`

The script is a read-only inspection step. It uses `supabase db query --linked` to run a fixed SELECT against `public.prompts`, joined only to existing project, topic, persona, and brand context needed for classification. It does not generate UPDATE SQL and does not run INSERT, UPDATE, DELETE, migration, seed, repair, reset, or backfill apply.

The dry-run buckets existing prompt rows into:

- `already_explicit`
- `safe_explicit_candidate`
- `inferred_candidate`
- `manual_review`
- `leave_null`
- `invalid_existing_value`
- `missing_required_context`

Dry-run output includes total row counts, counts by bucket, existing `prompt_type` and `measurement_purpose` value counts, reason-code counts, and up to five truncated samples per bucket. Samples are for operator review only and intentionally do not produce executable SQL.

Classification rules are intentionally conservative:

- `already_explicit` requires recognized existing values in both first-class fields.
- `invalid_existing_value` is used when an existing non-null field is outside the allowed contract.
- `safe_explicit_candidate` requires trusted existing metadata, such as existing prompt intent or topic intent values, that clearly maps to both scope fields.
- Prompt text alone can only create `inferred_candidate`, never a safe explicit backfill.
- `inferred_candidate` is review-only and must not be treated as official market-metric scope.
- `manual_review` is used for partial existing metadata, known competitor mentions, named or ambiguous comparisons, or conflicts between trusted metadata and prompt text.
- `leave_null` keeps rows without enough evidence as `needs_metadata`.
- `missing_required_context` is used when required project or primary-brand context is absent.

This dry-run is a gate before any future write-capable backfill PR. A later apply PR must compare the dry-run counts, explicitly choose which `safe_explicit_candidate` rows are eligible, and require a separate human checkpoint before any remote DB write.

### A. Safe explicit backfill

Use when an existing trusted source already contains explicit scope metadata, for example an approved fixture, materialized prompt contract, or operator-approved draft.

- Backfill as explicit only when the source is approved and unambiguous.
- Preserve provenance, such as source table, source version, and reviewer or materialization state when available.
- Eligible market metrics can only use these rows after validation.

### B. Safe inferred but not explicit

Use when scope can be inferred from text or existing fields but was not stored as official metadata.

- Mark as inferred, not explicit.
- Do not allow inferred rows into visibility/ranking/SOV.
- Use inferred rows as review targets and migration QA only.
- Example: text-based branded detection can suggest `branded`, but it must not become official metric scope without review.

### C. Needs manual review

Use when meaning is ambiguous.

- brand aliases or competitor aliases could collide with normal words
- comparison intent is present but named vs generic is unclear
- `comparison_generic` vs `comparison_named` cannot be proven
- prompt text includes category names that also match brand names
- seed data came from unapproved drafts

### D. Leave null / needs_metadata

Use when there is no safe evidence.

- Leave official fields null or mark as `needs_metadata`.
- Do not fallback to all observations.
- Do not include the row in visibility/ranking/SOV until explicit metadata exists.

Backfill constraints:

- Do not reinterpret historical measurement results silently.
- Do not rewrite past `metric_snapshots` automatically.
- Backfill only prompt definition or prompt snapshot metadata.
- Metric recalculation is a separate PR and procedure.
- Remote DB backfill requires explicit human approval after dry-run counts.

Prohibited backfill behavior:

- Do not infer `non_branded` just because no brand name was found.
- Do not make comparison prompts eligible without evidence.
- Do not mix `competitor_named` into SOV.
- Do not mix `citation_check` into ranking evidence.
- Do not treat unapproved project setup drafts as measurement ready.

## Inferred vs explicit scope

| Scope status | Meaning | Metric eligibility |
|---|---|---|
| explicit | Stored in an official DB field or approved materialized prompt record. Confirmed by operator approval or trusted generation/materialization. | Can be used for eligibility when type and purpose match. |
| inferred | Derived by text rules, existing intent fields, or heuristics. Useful for QA and review. | Not eligible for visibility/ranking/SOV. Must not be promoted to explicit without review. |
| missing | No trusted basis. | Not eligible. T04 should keep showing `needs_metadata`. |

The read model can display inferred or missing status, but official market metrics must require explicit scope.

## comparison_generic eligibility

`comparison_generic` is convenient but dangerous. Initial implementation should keep only explicit `non_branded` as the primary market metric scope. Add `comparison_generic` eligibility later only after metadata, operator approval, and validation are in place.

`comparison_generic` can be market-metric eligible only when all of these are true:

- `prompt_type` is `comparison_generic`.
- `measurement_purpose` is `visibility`, `ranking`, or `sov`.
- Prompt text has no target brand name or alias.
- Prompt text has no `knownCompetitors` names or aliases.
- The comparison is about a category, use case, criteria, or decision axis, not named brands.
- The prompt is operator-approved.
- The project setup draft has been approved and materialized for measurement.
- The prompt is not `citation_check`.
- The prompt is clearly separated from `branded`, `competitor_named`, and `comparison_named`.

Eligible examples:

- "中小企業向けのAI検索可視化ツールを比較するとき、何を見るべき？"
- "美容クリニックを選ぶとき、料金と口コミ以外に何を確認すべき？"
- "BtoB SaaSの導入比較で、運用負荷を判断するポイントは？"

Not eligible examples:

- "RecoraとA社を比較して"
- "Recoraの評判は？"
- "A社とB社ならどちらがよい？"
- "RecoraはAI回答で引用されている？"
- "ミエルカSEOと競合を比較して"

## Metric impact

Affected metrics and display areas:

- AI presence / visibility
- Share of Voice
- brand ranking
- prompt-level rank
- sentiment
- brand perception
- caveat
- citation validation
- recommendation candidates

Rules:

- Adding DB fields must not silently change past metrics.
- New scoped aggregation must be a separate PR or job.
- Old and new scoped metrics need display caution during transition.
- UI should show the scope basis, for example explicit, inferred, missing, or snapshot-based.
- T04 scope filtering becomes active once explicit fields exist.
- Sentiment and brand perception stay separate from market visibility/ranking/SOV.
- Recommendation candidates must record which prompt scope and evidence basis produced them before any quality-gate or customer-display step.

## Read model / UI impact

Expected impact after future schema work:

- T04 can move rows from `needs_metadata` to available when official scope fields are present.
- Scope filter chips can count explicit prompt types from DB-backed metadata.
- Measurement purpose filter chips can count explicit purposes from DB-backed metadata.
- Prompt rows can show whether a row is market-metric eligible, sentiment-only, citation-validation-only, or missing metadata.
- Existing read model safeguards should continue to treat missing, unknown, or inferred metadata as ineligible for official visibility/ranking/SOV.
- Metric snapshots should expose whether they were calculated from the new explicit scope or an older unverified scope.

No UI changes are part of this docs PR.

## Migration PR plan

Recommended PR split:

| PR | Branch candidate | Scope | Remote write? |
|---|---|---|---|
| PR A | `docs/prompt-scope-db-migration-plan` | This docs-only plan. No migration. | No |
| PR B | `feat/prompt-scope-schema-local` | Add migration file, local schema/types, local tests, and stop before remote db push. | No |
| PR C | `chore/prompt-scope-remote-apply` | With explicit approval, confirm db diff, apply migration, run read-only verification and advisors, report results. | Yes, after checkpoint |
| PR D | `feat/prompt-scope-backfill-draft` | Backfill script in dry-run mode, categorize counts, no remote writes. | No |
| PR E | `chore/prompt-scope-backfill-apply` | With explicit approval, run remote backfill, read-only verification, no metric recalculation. | Yes, after checkpoint |
| PR F | `feat/prompt-scope-filter-active` | Activate T04/read-model filtering using explicit DB fields, with missing/inferred handling. | No DB write expected |
| PR G | `feat/comparison-generic-eligibility` | Add `comparison_generic` eligibility after explicit metadata and approval rules are proven. | No DB write expected |

## Remote DB application procedure

Future remote application must use a separate checkpoint and must not be bundled with unrelated UI or docs changes.

Procedure:

- Confirm git status is clean except the intended migration/apply files.
- Confirm the migration file is the intended prompt-scope migration only.
- Confirm local migration behavior and generated types if applicable.
- Produce a Supabase db diff or equivalent dry-run review.
- Confirm there are no unexpected migrations.
- Human checkpoint before any linked remote apply.
- Do not run `supabase db push --linked` without explicit approval.
- Apply only the approved migration.
- Run post-apply read-only verification.
- Confirm migration history.
- Run advisors or equivalent Supabase review.
- Record the results in the PR.

Prohibited during remote apply:

- reset/repair operations
- seed reinsert
- unexpected migrations
- DB writes outside the approved migration
- secret display
- service-role exposure
- production data edits outside the approved procedure

## Validation plan

Docs-only PR validation:

- `npm run recora:preflight:full`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- `npm run recora:prompt-scope:check`
- `npm run recora:dashboard-read-model:check`
- `npm run recora:commit-check`

Future schema PR validation:

- local migration apply
- schema or generated type compatibility
- prompt read model compatibility
- constraint tests for allowed prompt types and purposes
- missing/unknown/inferred scope fixtures
- branded prompt exclusion fixtures
- named comparison and competitor-named exclusion fixtures
- citation-check exclusion from ranking/SOV fixtures
- `comparison_generic` remains excluded unless its later rules are explicitly implemented

Future remote apply validation:

- migration history confirms the intended migration
- prompt fields exist with expected constraints
- read-only counts for null, explicit, inferred, and manual-review categories
- RLS and grants remain tenant-safe
- advisors have no new relevant issues
- T04 `needs_metadata` behavior is reduced only for explicit rows

Future backfill validation:

- dry-run counts for explicit, inferred, manual review, and null/needs_metadata
- pre/post row count comparison
- no automatic metric recalculation
- no historical metric reinterpretation without a separate scoped aggregation PR
- sampled manual review of ambiguous comparison and competitor cases

## Rollback / remediation notes

For additive schema:

- Prefer additive nullable fields first.
- Keep existing read models working when fields are null.
- Do not drop old metadata or rewrite historical prompt text.
- If values are wrong, mark rows as `needs_metadata` or revert explicit status rather than recalculating metrics silently.
- If a remote migration is applied incorrectly, stop and create a remediation plan. Do not run repair/reset commands without explicit approval.

For backfill:

- Backfill writes should be reversible by source batch id or migration/backfill run id.
- Store enough provenance to identify which rows came from explicit source, inference, manual review, or unknown source.
- If inferred values were accidentally promoted, remove eligibility first, then repair metadata after review.

For metrics:

- Historical `metric_snapshots` should not be rewritten in the metadata backfill PR.
- Recalculation needs a separate PR, scoped query plan, old/new comparison, and display caution.

## Open decisions

- Exact persistence target: `public.prompts` columns, a prompt definition table, or a materialized prompt table.
- Measurement-time snapshot target: `public.run_items`, `public.ai_conversations`, or a dedicated run prompt snapshot table.
- Whether to use Postgres enums, check-constrained text, or reference tables for allowed values.
- Whether to store `prompt_scope_status` as a column, metadata, or derived read-model state.
- Whether to store `metric_eligibility` as derived code only or a cached field with provenance.
- How to preserve prompt-set version and generator version across approved prompts and measurement runs.
- How to represent manual review state for ambiguous backfill rows.
- How to expose old vs new scoped metrics in UI without confusing customers.
- When to activate `comparison_generic` for market metrics, if at all.
