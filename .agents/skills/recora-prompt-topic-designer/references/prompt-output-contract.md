# Prompt Output Contract

## Output Format

Default output order:

1. Topic Set
2. Topic Coverage Matrix
3. Topic-to-Prompt Mapping
4. Prompt List
5. Prompt Quality Gate
6. Bias Audit
7. Measurement Readiness

For substantial outputs, use these sections:

```md
## Topic Set

- topic_id:
- topic_name:
- topic_type:
- diagnosis_goal:
- target_persona:
- buyer_stage:
- metric_target:
  - visibility_rate:
  - ranking:
  - sentiment:
  - citation_check:
  - risk_check:
- brand_mention_policy:
- expected_signal:
- minimum_prompt_count:
- risk_or_bias:
- handoff_skill:

## Topic Coverage Matrix

- required_topics:
- covered_topics:
- undercovered_topics:
- overcovered_topics:
- missing_metric_target:
- missing_persona_angle:
- missing_buyer_stage:
- missing_language_mode:
- topic_balance_note:

## Topic-to-Prompt Mapping

- topic_id:
- topic_name:
- prompt_ids:
- prompt_count:
- prompt_language_modes:
- metric_eligibility_summary:
- coverage_status:
- missing_prompt_type:
- revision_needed:

## Prompt List

- id:
- topic_id:
- raw_user_intent:
- prompt:
- language_mode:
- category:
- intent_type:
- buyer_stage:
- persona:
- brand_mention_rule:
- competitor_mention_rule:
- expected_signal:
- response_shape:
- candidate_mention_opportunity:
- ranking_opportunity:
- metric_eligibility:
  - visibility_rate:
  - ranking:
  - sentiment:
- risk_or_bias:
- handoff_skill:
- quality_score:
- gate_decision:
- gate_reason:
- source_status:

## Prompt Quality Gate

- ready_for_measurement:
- revise_before_measurement:
- internal_only:
- reject:

## Bias Audit

- topic_bias:
- prompt_bias:
- brand_bias:
- metric_bias:
- persona_bias:
- language_mode_bias:
- regulated_risk_bias:

## Measurement Readiness

- readiness_decision:
- blocking_gaps:
- caveats:
```

For machine-readable output, preserve the same field names.
