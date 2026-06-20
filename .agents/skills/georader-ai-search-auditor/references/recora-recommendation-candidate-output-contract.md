# Recora Recommendation Candidate Output Contract

Use this contract when `georader-ai-search-auditor` creates improvement candidate drafts for quality-gate review.

## Required Principle

This skill may draft recommendation candidates, but it must not decide `auto_publish`. Use `candidate_draft` or `review_required` language and hand the candidate to `recora-recommendation-quality-gate-auditor`.

## Preferred Candidate Fields

| Field | Guidance |
|---|---|
| `candidate_id` | Use an existing stable ID if supplied. Do not invent IDs. |
| `candidate_type` | Use a descriptive type such as `brand_visibility_gap`, `citation_evidence_review`, `comparison_content_gap`, `case_study_evidence_gap`, or `technical_discoverability_gap`. |
| `source_skill` | Use `georader-ai-search-auditor`. |
| `measurement_run_id` | Include when supplied. Otherwise `NEEDS_VERIFICATION`. |
| `run_item_ids` | Include supplied IDs only. |
| `ai_conversation_ids` | Include supplied IDs only. |
| `prompt_ids` | Include supplied prompt IDs only. |
| `prompt_category` | Mark unknown when not supplied. |
| `search_mode` | Use supplied mode such as `no-search`, `web-search`, or unknown. |
| `target_brand` | Use supplied brand only. |
| `competitors_observed` | Use measured competitors only; do not infer from seed lists. |
| `evidence_scope` | Describe the measured basis, such as `target_brand_absent_observations` or `web_search_citations`. |
| `observation_count` | Use measured count when supplied. |
| `absence_count` | Use measured count when supplied. |
| `mention_count` | Use measured count when supplied. |
| `citation_count` | Use measured count when supplied. |
| `source_domain_count` | Use measured count when supplied. |
| `citation_urls` | Use supplied URLs only. |
| `supports_claim_status` | Use `true`, `false`, `unknown`, mixed, or `NEEDS_VERIFICATION`. |
| `seed_terms` | Include supplied seed terms; unknown if not available. |
| `seed_contamination_risk` | low / medium / high / unknown. |
| `claim_summary` | State only what the evidence supports. |
| `recommendation_summary` | Draft action, not publication decision. |
| `client_facing_draft` | Safe draft only, no guarantees. |
| `evidence_grade_suggestion` | Suggested grade only; quality gate can override. |
| `priority_suggestion` | Suggested P0/P1/P2 or P1/P2 only; quality gate can override. |
| `confidence_suggestion` | Suggested high / medium / low. |
| `risk_flags` | Include missing IDs, seed risk, citation risk, overclaim risk, low sample, genericness, stale source, or duplicate risk. |
| `needs_human_review` | Use true when evidence is incomplete or client-facing risk exists. |
| `remeasurement_signal` | Define what to recheck after changes. |
| `created_from` | Name source artifact, measurement, user request, or inspected file when known. |

## Rules

- Do not invent IDs.
- Do not invent evidence.
- If fields are unavailable, mark `unknown` or `NEEDS_VERIFICATION`.
- Do not recommend `auto_publish` directly.
- Use `candidate_draft` or `review_required` language.
- Avoid client-facing guarantees of AI citation, ranking, recommendation, traffic, conversion, or revenue.
