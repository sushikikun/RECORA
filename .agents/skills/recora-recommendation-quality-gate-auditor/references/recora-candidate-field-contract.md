# Recora Candidate Field Contract

Use this contract when auditing recommendation candidates produced by `georader-ai-search-auditor` or Recora generation pipelines.

## Required Fields For Review

- `candidate_id`
- `candidate_type`
- `source_skill` or generation source
- `claim_summary`
- `recommendation_summary`
- `evidence_scope`
- evidence labels or evidence grade
- risk flags when known

## Strongly Preferred Measurement Fields

- `measurement_run_id`
- `run_item_ids`
- `ai_conversation_ids`
- `prompt_ids`
- `prompt_category`
- `search_mode`
- `target_brand`
- `competitors_observed`
- `observation_count`
- `absence_count`
- `mention_count`
- `citation_count`
- `source_domain_count`
- `citation_urls`
- `supports_claim_status`
- `seed_terms`
- `seed_contamination_risk`
- `remeasurement_signal`
- `created_from`

## Optional Fields

- `client_facing_draft`
- `priority_suggestion`
- `confidence_suggestion`
- `needs_human_review`
- `duplicate_candidate_ids`
- `source_ledger`

## Missing Fields That Block auto_publish

Block `auto_publish` when any are missing and material to the claim:

- `measurement_run_id` for measurement-based claims.
- source-to-claim mapping for citation-based claims.
- `seed_terms` or seed-risk assessment for discovery claims.
- `supports_claim_status` for citation support claims.
- observation counts for visibility or absence claims.
- client-safe wording for client-facing display.

## Hold Triggers

Use `hold` when:

- `measurement_run_id` is missing but the candidate is plausible.
- `supports_claim_status` is `unknown`.
- citation count is high but source support is unverified.
- observation count is low.
- seed terms are unknown.
- source freshness is unknown.
- duplicate risk exists.
- safe client-facing rewrite is needed.

## Suppress Triggers

Use `suppress` when:

- evidence is invented.
- source or citation is hallucinated.
- seed terms are present and the candidate claims organic discovery.
- citation count is used as proof while source support is unknown.
- the candidate guarantees AI citation, recommendation, ranking, traffic, conversion, or revenue.
- the candidate asks for secrets or implementation.
- the recommendation is generic and disconnected from measurement evidence.

## Safe Client-Facing Rewrite

If the candidate is useful but risky, provide `safe_client_facing_rewrite` and keep decision as `hold` until the rewrite and missing evidence are approved.
