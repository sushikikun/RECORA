# Recora Prompt Scope Backfill Review Plan

Status: Review plan / docs only
Last updated: 2026-07-01

This document records the human review plan for prompt scope backfill after the PR #51 read-only dry-run.

This is not a backfill apply procedure.
This is not a DB write procedure.
This does not run UPDATE, INSERT, DELETE, migration, seed, repair, reset, Supabase db push, or remote DB apply.
This does not change customer-facing UI, dashboard UI, report tabs UI, LP, Auth, handoff files, or package-lock.

## Overview

PR #51 added `scripts/inspect-recora-prompt-scope-backfill.ts`, a read-only dry-run that inspects existing `public.prompts` rows and classifies whether `prompt_type` / `measurement_purpose` can be reviewed for future backfill.

The dry-run found no `safe_explicit_candidate` rows. Therefore, the next step is human review planning, not automatic backfill. `inferred_candidate` and `manual_review` rows can become official `explicit` scope only after a reviewer records an explicit decision, allowed values, reason, and apply eligibility.

## Current Dry-Run Result

PR #51 dry-run result:

- total prompts: 8
- already_explicit: 0
- safe_explicit_candidate: 0
- inferred_candidate: 5
- manual_review: 3
- leave_null: 0
- invalid_existing_value: 0
- missing_required_context: 0
- existing prompt_type: null 8
- existing measurement_purpose: null 8

Interpretation:

- All inspected prompts currently have `prompt_type = null` and `measurement_purpose = null`.
- There are no `safe_explicit_candidate` rows, so there are no rows that should be automatically updated.
- The 5 `inferred_candidate` rows are suggestions only. They are not official scope.
- The 3 `manual_review` rows need human judgement before any value can be considered.
- There are no invalid existing values.
- There is no missing required context, but that does not imply automatic backfill is safe.

## Why Apply Is Blocked

Backfill apply is blocked because:

- `safe_explicit_candidate` is 0.
- `inferred_candidate` is not official scope.
- Prompt-text inference alone cannot make a row market-metric eligible.
- Comparison, competitor, and brand-alias contamination could change metric meaning.
- `citation_check` rows could be mixed into ranking evidence if applied carelessly.
- `branded` prompts could be mixed into visibility, ranking, or SOV if applied carelessly.
- Existing metric interpretation could change if old prompts are reclassified without review.
- Before any remote DB write, target prompt IDs and proposed values must be reviewed by a human.

## Review Categories

### `already_explicit`

The row already has recognized `prompt_type` and `measurement_purpose` values.

Current count: 0.

### `inferred_candidate`

The dry-run can infer a possible scope from prompt text or nearby context, but the value is not official.

Rules:

- Do not backfill automatically.
- Do not use as visibility, ranking, or SOV eligibility.
- Promote to `explicit` only after human review.
- Record the reason if the row remains inferred.

### `manual_review`

The row needs human judgement because automatic classification is risky.

Use this for:

- named competitor mentions
- target brand or alias ambiguity
- generic versus named comparison ambiguity
- partial existing metadata
- conflicts between trusted metadata and prompt text
- uncertain measurement purpose

Do not update these rows without a reviewer decision.

### `leave_null`

The row has insufficient evidence. Keep official fields null and keep the report/read model in `needs_metadata`.

### `explicit_backfill_candidate`

This category is created only after human review. A row becomes an `explicit_backfill_candidate` only when:

- proposed `prompt_type` is one of the allowed values
- proposed `measurement_purpose` is one of the allowed values
- `decision_reason` is present
- target prompt ID is clear
- apply eligibility is clear
- apply dry-run has confirmed the exact update target

### `do_not_backfill`

Use when the prompt should not receive scope metadata through backfill.

Reasons can include:

- scope is unclear
- prompt text should be revised first
- row is not measurement-ready
- row should remain historical-only
- customer-visible interpretation risk is too high

## Human Review Checklist

For each prompt row, review:

1. Does the prompt include the target brand name?
2. Does the prompt include a target brand alias?
3. Does the prompt include a known competitor name?
4. Does the prompt include a known competitor alias?
5. Is the prompt a non-branded market, category, use-case, problem, or selection query?
6. Is the prompt a branded brand-check query?
7. Is the prompt a generic comparison or a named comparison?
8. Is the prompt a known-competitor comparison?
9. Is the prompt mainly for citation/source validation?
10. Is the prompt mainly for sentiment or brand perception?
11. Is the prompt only an input for recommendation generation?
12. Should the prompt be eligible for visibility, ranking, or SOV?
13. Should the prompt be limited to sentiment or brand perception?
14. Should the prompt be limited to citation validation?
15. Should the prompt be excluded from measurement?
16. Is the row from an unapproved draft?
17. Is the row approved and measurement-ready?

Important review rule:

- If the target brand name or alias appears, do not classify the row as `non_branded` for visibility, ranking, or SOV.
- If a known competitor name or alias appears, confirm whether the row is `competitor_named`, `comparison_named`, or recommendation input.
- If the prompt is citation-focused, keep it in `citation_validation` and do not mix it into ranking evidence.

## Prompt Type Decision Rules

### `non_branded`

Use only when:

- the prompt does not include the target brand name
- the prompt does not include target brand aliases
- the prompt does not include known competitor names or aliases
- the prompt asks about a category, use case, problem, comparison axis, or selection axis
- the prompt may be used for visibility, ranking, or SOV
- a human reviewer has approved the value

### `branded`

Use when:

- the target brand name or alias is included
- the prompt asks about brand evaluation, perception, fit, strengths, weaknesses, or caveats
- the purpose is sentiment, brand perception, narrative, or caveat analysis

Do not use `branded` rows for visibility, ranking, or SOV.

### `comparison_generic`

Use when:

- the prompt compares categories, use cases, or selection criteria
- no target brand, target alias, known competitor, or competitor alias is named

Initial handling:

- Treat conservatively.
- Do not automatically include in market metrics.
- If later used for market metrics, define explicit eligibility rules in a separate PR.

### `comparison_named`

Use when:

- the target brand or another named brand appears in a comparison prompt

Do not use for visibility, ranking, or SOV. It can be useful for brand perception or recommendation input after review.

### `competitor_named`

Use when:

- a known competitor name or alias appears

Do not use for visibility, ranking, or SOV. It can be useful for competitor understanding, comparison review, or recommendation input after review.

### `citation_check`

Use when:

- the prompt is mainly about citations, sources, URLs, references, or evidence

Use with `citation_validation`. Do not mix into ranking evidence.

## Measurement Purpose Decision Rules

### `visibility`

Use for observing whether the target brand appears in AI answers. Primary prompt type should be `non_branded`.

### `ranking`

Use for observing recommendation order, answer position, or comparable-set order. Primary prompt type should be `non_branded`. Exclude `branded` and `citation_check`.

### `sov`

Use for Share of Voice. Primary prompt type should be `non_branded`. Exclude `comparison_named` and `competitor_named`.

### `sentiment`

Use for positive, negative, or neutral tone about the brand. Keep separate from visibility and SOV.

### `brand_perception`

Use for how AI frames the brand, including perceived strengths, weaknesses, caveats, trust, and fit. Keep separate from market metrics.

### `citation_validation`

Use for citation/source validation. Keep separate from ranking evidence.

### `recommendation_input`

Use when the prompt result is meant to feed improvement-candidate generation. Keep distinct from market metrics.

## Market Metrics Eligibility

Market metrics include:

- AI visibility rate
- ranking
- Share of Voice
- brand ranking
- prompt-level visibility
- prompt-level SOV

A row can be eligible only when:

- `prompt_type` is `non_branded`
- `measurement_purpose` is `visibility`, `ranking`, or `sov`
- target brand name and aliases are absent
- known competitor names and aliases are absent
- the row is not `citation_check`
- the row is not `comparison_named`
- the row is not `competitor_named`
- the row is explicit, not inferred
- the prompt is approved and measurement-ready
- a human reviewer has approved the decision

Not eligible:

- `branded`
- `comparison_named`
- `competitor_named`
- `citation_check`
- `inferred_candidate`
- `manual_review`
- `leave_null`
- unapproved draft rows
- prompts that include target brand aliases
- prompts that include competitor names

`comparison_generic` remains conservative. It could become eligible later, but only after a separate PR defines explicit conditions and tests.

## Inferred Vs Explicit Handling

`inferred_candidate` is a review aid only. It must not become:

- official `prompt_type`
- official `measurement_purpose`
- visibility eligibility
- ranking eligibility
- SOV eligibility
- backfill apply input

Promotion to explicit requires:

- human reviewer
- proposed allowed values
- reason
- row-level output record
- apply dry-run
- separate approval before any DB write

## Manual Review Handling

Manual review rows should remain unchanged until the reviewer can resolve:

- named versus generic comparison
- competitor contamination
- brand alias contamination
- citation-only intent
- branded sentiment or brand perception intent
- whether the prompt should be revised rather than backfilled

Rows that cannot be resolved should become `leave_null` or `do_not_backfill`.

## Review Output Format

Human review should produce a compact row list with:

- `prompt_id`
- `prompt_text_short`
- `current_prompt_type`
- `current_measurement_purpose`
- `dry_run_bucket`
- `proposed_prompt_type`
- `proposed_measurement_purpose`
- `decision_status`
- `decision_reason`
- `reviewer_note`
- `eligible_for_market_metrics`
- `eligible_for_recommendation_input`
- `apply_candidate`

Allowed `decision_status` values:

- `approve_explicit_backfill`
- `keep_inferred`
- `manual_review_needed`
- `leave_null`
- `do_not_backfill`
- `revise_prompt_later`

`apply_candidate` is `true` only when `decision_status` is `approve_explicit_backfill`.

Keep `prompt_text_short` truncated. Do not publish large raw customer prompt text in docs or PR descriptions.

## Apply Readiness Criteria

Apply can be planned only when:

- only `approve_explicit_backfill` rows are targeted
- proposed `prompt_type` is allowed
- proposed `measurement_purpose` is allowed
- `eligible_for_market_metrics` matches the rules above
- `comparison_named`, `competitor_named`, and `citation_check` are not mixed into market metrics
- inferred-only rows are not updated
- `manual_review_needed` rows are not updated
- `leave_null` rows are not updated
- `do_not_backfill` rows are not updated
- target prompt IDs and values are explicit
- apply dry-run confirms exact target count and IDs
- execution stops for human confirmation before any remote DB write

## Do-Not-Apply Criteria

Do not apply when:

- the decision is inferred only
- human review is incomplete
- prompt type or measurement purpose is ambiguous
- a brand-containing prompt would become `non_branded`
- a competitor-containing prompt would become `non_branded`
- `citation_check` would be mixed into ranking or SOV
- `comparison_named` would be mixed into visibility, ranking, or SOV
- `competitor_named` would be mixed into visibility, ranking, or SOV
- the row came from an unapproved draft
- the prompt itself should be revised first
- project or brand context is missing
- `reviewer_note` is missing
- proposed values are outside allowed values
- historical metric recalculation would be required but is not planned

## Suggested Next PRs

1. `docs/prompt-scope-backfill-review-plan`
   - This PR.
   - Docs-only.
   - No DB write.

2. `chore/prompt-scope-backfill-review-record`
   - Store or document the human review result in a compact, non-secret format.
   - No DB write.
   - Confirm candidate target rows.
   - Avoid large raw prompt text output.

3. `chore/prompt-scope-backfill-apply-dry-run`
   - Generate an apply dry-run for only `approve_explicit_backfill` rows.
   - No real UPDATE.
   - Confirm count and target IDs.

4. `chore/prompt-scope-backfill-apply`
   - Run the real UPDATE only after explicit approval.
   - Target only `approve_explicit_backfill`.
   - Verify with read-only inspection.
   - Confirm Advisors.
   - Do not recalculate metrics.

5. `docs/prompt-scope-post-backfill-status`
   - Record post-backfill status.
   - Track remaining null, inferred, and manual-review rows.

## Non-Goals

- No DB write.
- No UPDATE, INSERT, DELETE, DROP, seed, repair, reset, or backfill apply.
- No migration.
- No Supabase db push.
- No remote DB apply.
- No external API execution.
- No web crawl or search execution.
- No customer-facing UI change.
- No dashboard UI, onboarding UI, report tabs UI, LP, Auth, or handoff change.
- No package-lock change.
- No secrets, token, API key, or DB URL display.

## Open Decisions

- Where the human review record should live before apply dry-run.
- Whether `comparison_generic` can ever be market-metric eligible.
- Whether prompt revisions are required before any backfill.
- Whether any row should remain permanently null for historical safety.
- How a later apply dry-run should present target IDs without exposing too much customer prompt text.
- Whether measurement-time prompt snapshots should later copy official scope values.
