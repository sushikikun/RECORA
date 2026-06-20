# Machine-readable Output Schema

Use this reference when a Recora citation audit needs structured output for dashboards, report generation, QA review, monitoring, or downstream skill handoff.

This is an output contract, not implementation code. Use JSON-compatible Markdown examples when useful, but do not create scripts for this skill.

## Top-level Objects

At minimum, define these objects:

- `input_completeness`
- `observation_context`
- `citation_inventory`
- `claim_inventory`
- `evidence_ledger`
- `source_classification`
- `citation_risks`
- `source_opportunities`
- `recommended_actions`
- `report_readiness`
- `handoff_payload`

## JSON-compatible Skeleton

```json
{
  "input_completeness": [],
  "observation_context": {},
  "citation_inventory": [],
  "claim_inventory": [],
  "evidence_ledger": [],
  "source_classification": [],
  "citation_risks": [],
  "source_opportunities": [],
  "recommended_actions": [],
  "report_readiness": {},
  "handoff_payload": []
}
```

Use `unknown`, `not_provided`, `not_checked`, or `unverified` instead of omitting important fields. Use `null` only when the value is genuinely not applicable.

## input_completeness Item

- `input_name`
- `status`
- `impact`
- `needed_next`

Recommended `status` values: `provided`, `partial`, `missing`, `not_applicable`, `unknown`.

## observation_context Object

- `engine`
- `model_name`
- `interface`
- `prompt_text`
- `topic`
- `persona`
- `language`
- `region`
- `observed_at`
- `run_id`
- `answer_text`
- `cited_urls`
- `citation_ui_type`
- `logged_in_state`
- `personalization_possible`
- `notes`

Do not combine observations with different engine/model/interface/persona/language/region/date unless the output explicitly groups them separately.

## citation_inventory Item

Each `citation_inventory` item must include:

- `citation_id`
- `url`
- `normalized_domain`
- `final_url`
- `source_accessibility`
- `source_class`
- `source_owner`
- `cited_entity`
- `page_type`
- `page_purpose`
- `source_text_status`
- `freshness_status`
- `quality_signal`
- `authority_signal`
- `bias_flags`
- `volatility_flags`
- `risk_flags`
- `confidence`
- `notes`

## claim_inventory Item

Each `claim_inventory` item must include:

- `claim_id`
- `atomic_claim`
- `claim_type`
- `claim_severity`
- `related_citation_ids`
- `correctness_status`
- `faithfulness_status`
- `alignment_status`
- `triangulation_status`
- `contradictory_evidence_status`
- `evidence_strength`
- `confidence`
- `verification_note`

## evidence_ledger Item

- `item_id`
- `claim_or_finding`
- `evidence_type`
- `source_url`
- `source_class`
- `source_text_status`
- `alignment_status`
- `correctness_status`
- `faithfulness_status`
- `evidence_strength`
- `finding_status`
- `confidence`
- `risk_level`
- `verification_needed`
- `notes`

## source_classification Item

- `citation_id`
- `url`
- `source_type`
- `source_owner`
- `cited_entity`
- `page_purpose`
- `control_level`
- `authority_signal`
- `quality_signal`
- `confidence`

## citation_risks Item

- `risk_id`
- `risk_type`
- `linked_claim_ids`
- `linked_citation_ids`
- `severity`
- `risk_score`
- `finding_status`
- `why_it_matters`
- `evidence_basis`
- `verification_needed`

Risk types should include: `outdated_source`, `hallucinated_or_missing_source`, `mismatched_claim`, `competitor_dominated_source`, `low_quality_source`, `irrelevant_source`, `unverifiable_source`, `thin_or_duplicate_content`, `misleading_comparison`, `brand_misrepresentation`, `commercial_or_affiliate_bias`, `synthetic_source_risk`, `cross_engine_mismatch`.

## source_opportunities Item

- `opportunity_id`
- `opportunity_type`
- `source_gap_addressed`
- `target_source_or_page`
- `control_level`
- `evidence_basis`
- `expected_effect_hypothesis`
- `verification_method`
- `confidence`
- `finding_status`

## recommended_actions Item

Each `recommended_actions` item must include:

- `action_id`
- `action_type`
- `target_url_or_page_idea`
- `reason`
- `linked_claim_ids`
- `linked_citation_ids`
- `linked_gap`
- `expected_effect_hypothesis`
- `evidence_needed`
- `control_level`
- `priority`
- `confidence`
- `verification_method`
- `acceptance_criteria`
- `report_readiness`
- `handoff_target`

Allowed `action_type` values:

- `own_site_fix`
- `own_site_new_page`
- `third_party_outreach`
- `evidence_building`
- `technical_support`
- `monitoring`

Allowed `handoff_target` values:

- `recora-competitor-benchmark`
- `recora-schema-seo-aio`
- `recora-recommendation-quality-gate-auditor`
- `none`

## report_readiness Object

- `decision`
- `reason`
- `blocking_items`
- `client_safe`
- `next_verification_steps`

Allowed `decision` values:

- `ready_for_client_report`
- `internal_only`
- `needs_more_evidence`
- `blocked_by_missing_source_text`
- `blocked_by_conflicting_evidence`

## handoff_payload Item

- `handoff_id`
- `handoff_target`
- `payload_type`
- `linked_action_ids`
- `linked_claim_ids`
- `linked_citation_ids`
- `summary`
- `required_context`
- `readiness`

## Enumerations

### source_class / source_type

- `own_site`
- `competitor_site`
- `third_party_media`
- `comparison_site`
- `review_site`
- `directory`
- `social`
- `official_source`
- `government_or_academic`
- `unknown`
- `low_confidence`

### source_accessibility

- `accessible`
- `blocked`
- `paywalled`
- `login_required`
- `broken`
- `redirected`
- `unavailable`
- `not_checked`

### source_text_status

- `checked`
- `snippet_only`
- `not_provided`
- `unavailable`
- `not_checked`
- `unknown`

### claim_type

- `factual`
- `comparative`
- `recommendation`
- `pricing`
- `feature`
- `review_or_reputation`
- `market_positioning`
- `legal_or_regulatory`
- `statistic`
- `temporal`
- `subjective`
- `unknown`

### claim_severity

- `low`
- `medium`
- `high`
- `critical`

### correctness_status

- `correct_supported`
- `partially_correct`
- `adjacent_but_not_supporting`
- `unsupported`
- `contradicted`
- `unverifiable`

### faithfulness_status

- `likely_faithful`
- `possibly_faithful`
- `weak_faithfulness`
- `likely_post_rationalized`
- `unverifiable`

### alignment_status

- `aligned`
- `partial`
- `adjacent`
- `unsupported`
- `contradicted`
- `unverifiable`
- `not_checked`

### triangulation_status

- `single_source_only`
- `multiple_independent_sources`
- `primary_source_available`
- `third_party_only`
- `conflicting_sources`
- `no_source`
- `unknown`

### contradictory_evidence_status

- `no_conflict_found`
- `minor_conflict`
- `major_conflict`
- `direct_contradiction`
- `unknown`

### evidence_strength

- `strong`
- `moderate`
- `weak`
- `none`
- `unknown`

### finding_status

- `confirmed`
- `likely`
- `hypothesis`
- `advisory`
- `unverified`
- `contradicted`
- `blocked`

### confidence

- `high`
- `medium`
- `low`
- `unknown`

## Validation Rules

- Every `claim_id`, `citation_id`, `risk_id`, `opportunity_id`, and `action_id` must be stable inside the output.
- Every material recommendation must link to at least one `linked_claim_ids`, `linked_citation_ids`, or `linked_gap`.
- URL-only or source-text-missing findings must not use `finding_status: confirmed`.
- `claim_severity: critical` requires checked evidence for client-facing confirmation.
- `contradicted` findings must appear in `citation_risks` and `report_readiness.blocking_items` unless clearly resolved.
- `technical_support` actions must not claim guaranteed AI citation lift.
- Cross-engine outputs must preserve observation context by engine/model/interface/date.
