# Recora Prompt Scope Backfill Review Record

Status: Human review record / docs only
Last updated: 2026-07-01

This document records a compact review aid for the 8 existing `public.prompts` rows inspected by the PR #51 read-only dry-run and planned in PR #52.

This is not a backfill apply record.
This does not approve any row for DB update.
This does not run UPDATE, INSERT, DELETE, migration, seed, repair, reset, Supabase db push, or remote DB apply.
This does not change customer-facing UI, dashboard UI, report tabs UI, LP, Auth, handoff files, or package-lock.

## Source Dry-Run

Source command:

- `npm run recora:prompt-scope-backfill:dry-run`

Source result:

- generated at: `2026-07-01T14:01:55.820Z`
- mode: `supabase db query --linked`
- read only: `true`
- writes executed: `false`
- update SQL generated: `false`
- total prompts: 8
- fetched prompts: 8
- truncated: `false`

Bucket counts:

| Bucket | Count |
|---|---:|
| `already_explicit` | 0 |
| `safe_explicit_candidate` | 0 |
| `inferred_candidate` | 5 |
| `manual_review` | 3 |
| `leave_null` | 0 |
| `invalid_existing_value` | 0 |
| `missing_required_context` | 0 |

Existing official values:

| Field | Value | Count |
|---|---|---:|
| `prompt_type` | `null` | 8 |
| `measurement_purpose` | `null` | 8 |

Reason counts:

| Category | Reason | Count |
|---|---|---:|
| `inferred_candidate` | `brand_signal_text_only` | 2 |
| `inferred_candidate` | `citation_signal_text_only` | 3 |
| `manual_review` | `comparison_ambiguous` | 2 |
| `manual_review` | `known_competitor_mentioned` | 1 |

## Review Position

Because `safe_explicit_candidate` is 0, this record does not create any apply target.

All rows below remain official `prompt_type = null` and `measurement_purpose = null` until a human reviewer explicitly approves allowed values in a later step. The `proposed_*` values are review aids only and must not be treated as visibility, ranking, SOV, recommendation, or backfill eligibility.

Current review outcome:

- rows approved for explicit backfill: 0
- rows requiring human review: 8
- rows eligible for market metrics now: 0
- rows eligible for recommendation input now: 0
- rows with `apply_candidate = true`: 0

## Compact Row Record

`prompt_text_short` uses compact operator-facing summaries instead of full raw prompt text.

| prompt_id | prompt_text_short | current_prompt_type | current_measurement_purpose | dry_run_bucket | proposed_prompt_type | proposed_measurement_purpose | decision_status | decision_reason | reviewer_note | eligible_for_market_metrics | eligible_for_recommendation_input | apply_candidate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `4f91b8a7-b44b-4397-804f-202f039d8cda` | citation/source check for official pages | `null` | `null` | `inferred_candidate` | `citation_check` | `citation_validation` | `manual_review_needed` | `citation_signal_text_only`; citation/source wording is text-only inference. | Confirm this is citation validation only and not ranking/SOV evidence. | `false` | `false` | `false` |
| `6ec5f0be-1ae7-4004-8f4e-cbc7543b8eaf` | branded fit check for consulting support | `null` | `null` | `inferred_candidate` | `branded` | `null` | `manual_review_needed` | `brand_signal_text_only`; target brand appears but purpose is not explicit. | Decide whether this is `brand_perception`, `recommendation_input`, or should remain null. | `false` | `false` | `false` |
| `9fe3e2b8-f4e1-41ca-86a8-e03b8d418ac5` | citation/source check for case-study evidence | `null` | `null` | `inferred_candidate` | `citation_check` | `citation_validation` | `manual_review_needed` | `citation_signal_text_only`; source/evidence wording is text-only inference. | Confirm this is citation validation only and not market metric input. | `false` | `false` | `false` |
| `e0b93aa4-900a-49ac-82ad-96fceaf3b753` | branded pre-adoption caveat check | `null` | `null` | `inferred_candidate` | `branded` | `null` | `manual_review_needed` | `brand_signal_text_only`; target brand appears but purpose is not explicit. | Decide whether this is `brand_perception`, `recommendation_input`, or should remain null. | `false` | `false` | `false` |
| `f84d6124-ea85-4e93-8a17-4fbe6e8ab154` | citation/source check for AI/GEO features | `null` | `null` | `inferred_candidate` | `citation_check` | `citation_validation` | `manual_review_needed` | `citation_signal_text_only`; trusted-source wording is text-only inference. | Confirm this is citation validation only and keep out of ranking/SOV. | `false` | `false` | `false` |
| `7572fc9d-bc62-404b-889e-f5741d673a9a` | generic comparison of SEO and AI-search tools | `null` | `null` | `manual_review` | `comparison_generic` | `null` | `manual_review_needed` | `comparison_ambiguous`; generic-vs-named comparison and metric eligibility are not explicit. | Confirm whether this can remain generic, needs prompt revision, or should stay null. | `false` | `false` | `false` |
| `b58b6a40-f5c9-4c83-8443-4070fd33434c` | generic comparison of AI SEO content tools | `null` | `null` | `manual_review` | `comparison_generic` | `null` | `manual_review_needed` | `comparison_ambiguous`; comparison purpose and metric eligibility are not explicit. | Confirm whether this can remain generic, needs prompt revision, or should stay null. | `false` | `false` | `false` |
| `e13a946a-ac27-4b03-849a-8cda20db4388` | named competitor comparison | `null` | `null` | `manual_review` | `competitor_named` | `null` | `manual_review_needed` | `known_competitor_mentioned`; named competitor comparison is not market-metric eligible. | Decide whether to use as competitor understanding/recommendation input or leave null. | `false` | `false` | `false` |

## Proposed Candidate Summary

| proposed_prompt_type | proposed_measurement_purpose | Rows | Handling |
|---|---|---:|---|
| `citation_check` | `citation_validation` | 3 | Review-only. Keep out of visibility, ranking, and SOV. |
| `branded` | `null` | 2 | Review-only. Purpose is unresolved. Do not use for market metrics. |
| `comparison_generic` | `null` | 2 | Manual review. Later eligibility needs separate explicit rules. |
| `competitor_named` | `null` | 1 | Manual review. Keep out of visibility, ranking, and SOV. |

## Next Apply Dry-Run Conditions

A later apply dry-run can be prepared only after a human reviewer creates rows with:

- `decision_status = approve_explicit_backfill`
- allowed `proposed_prompt_type`
- allowed `proposed_measurement_purpose`
- non-empty `decision_reason`
- non-empty `reviewer_note`
- correct `eligible_for_market_metrics`
- correct `eligible_for_recommendation_input`
- `apply_candidate = true`

Current target count for a future apply dry-run is 0.

The next apply dry-run must still be read-only. It must list exact target IDs and proposed values, confirm count and IDs, and stop for human approval before any remote DB write.

## Out Of Scope

- No DB write.
- No UPDATE, INSERT, DELETE, DROP, seed, repair, reset, or backfill apply.
- No migration.
- No Supabase db push.
- No remote DB apply.
- No metric recalculation.
- No external API execution.
- No web crawl or search execution.
- No customer-facing UI change.
- No dashboard UI, onboarding UI, report tabs UI, LP, Auth, or handoff change.
- No package-lock change.
- No secrets, token, API key, or DB URL display.
