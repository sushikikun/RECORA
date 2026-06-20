# Actual Candidate JSON Schema Gaps

## CONFIRMED_FROM_FILES

The inspected `recommendation-candidates.json` top-level keys include:

- `generated_at`
- `project_slug`
- `project_name`
- `measurement_run_id`
- `aggregate_run_id`
- `measurement_profile_id`
- `source_run_status`
- `observation_count`
- `prompt_count`
- `candidate_count`
- `candidates`
- `db_write_status`
- `recora_metric_notice`
- `db_write_check`
- `data_scope`
- `output`

Candidate top-level keys include:

- `id`
- `type`
- `priority`
- `summary`
- `rationale`
- `evidence`
- `confidence`
- `quality_score`
- `display_decision`
- `customer_facing_caution`
- `should_save_to_recommendations`
- `save_reason`
- `suggested_next_action`

Evidence keys include:

- `measurement_run_id`
- `aggregate_run_id`
- `selected_prompt_ids`
- `conversation_ids`
- `run_item_ids`
- `prompt_texts`
- `topics`
- `personas`
- `search_modes`
- `citation_urls`
- `citation_domains`
- `supports_claim_values`
- `primary_evidence_scope`
- `citation_count`
- `unique_domain_count`
- `supports_claim_unknown_count`
- `observation_rows`
- `citation_rows`

## Contract Gap Matrix

| Stack contract field | Current observed location | Gap |
|---|---|---|
| `candidate_id` | `candidate.id` | name mismatch |
| `candidate_type` | `candidate.type` | name mismatch |
| `source_skill` | missing | add explicit generator/source |
| `measurement_run_id` | `candidate.evidence.measurement_run_id` and top-level payload | present but nested |
| `run_item_ids` | `candidate.evidence.run_item_ids` | present |
| `ai_conversation_ids` | `candidate.evidence.conversation_ids` | name mismatch |
| `prompt_ids` | `candidate.evidence.selected_prompt_ids` | name mismatch; selected vs evidence prompt scope needs review |
| `prompt_category` | `candidate.evidence.topics` | name and meaning mismatch |
| `persona` | `candidate.evidence.personas` | plural array, no scalar contract |
| `buyer_stage` | missing | add or mark unknown |
| `search_mode` | `candidate.evidence.search_modes` | plural array, name mismatch |
| `provider` | missing in candidate evidence | add or mark unknown; generator filters OpenAI observations |
| `provider_status` | missing | add explicit capability status |
| `target_brand` | missing as contract field | brand appears in related/evidence data but not explicit |
| `competitors_observed` | `candidate.evidence.competitor_presence` | name mismatch and structure needs contract |
| `evidence_scope` | `candidate.evidence.primary_evidence_scope` | name mismatch |
| `observation_count` | `candidate.evidence.observation_count` | present |
| `absence_count` | missing | derive explicitly for absence candidate or mark unknown |
| `mention_count` | missing | target mention count not summarized as contract field |
| `citation_count` | `candidate.evidence.citation_count` | present |
| `source_domain_count` | `candidate.evidence.unique_domain_count` | name mismatch |
| `citation_urls` | `candidate.evidence.citation_urls` | present |
| `source_to_claim_status` | missing | critical gap |
| `seed_terms` | missing | critical gap |
| `seed_contamination_risk` | missing | critical gap |
| `claim_summary` | missing | candidate has `summary`, but claim boundary unclear |
| `recommendation_summary` | missing | candidate has `suggested_next_action` |
| `client_facing_draft` | missing | caution/display text exists but not a gate-ready draft |
| `evidence_grade_suggestion` | missing | add or mark NEEDS_VERIFICATION |
| `priority_suggestion` | `candidate.priority` | name and ownership mismatch |
| `confidence_suggestion` | `candidate.confidence` | name and ownership mismatch |
| `risk_flags` | missing | critical gap |
| `needs_human_review` | implied by `review_required` | make explicit boolean |
| `remeasurement_signal` | missing | add explicit next measurement condition |
| `created_from` | missing | add generator/source artifact |
| `schema_version` | missing | critical gap |

## USER_PROVIDED_CONTEXT

- Candidate JSON should be reviewed against the current RECORA skill-stack contract.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Whether downstream consumers require the current names remains NEEDS_VERIFICATION.
- Whether some missing fields exist elsewhere in production code remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Add a versioned candidate contract wrapper without deleting existing fields.
- Keep old keys during a compatibility window and add contract aliases.
- Make missing-but-required fields explicit with `unknown`, `not_checked`, `not_applicable`, or `NEEDS_VERIFICATION`.
- Add schema validation tests that fail when critical fields are omitted.
- Treat citation candidates with missing `source_to_claim_status` as review-only and quality-gate hold.

## DO_NOT_ASSUME

- Do not assume `supports_claim_values` is equivalent to `source_to_claim_status`.
- Do not assume `topics` is the same as `prompt_category`.
- Do not assume `search_modes` can always be collapsed to one `search_mode`.
