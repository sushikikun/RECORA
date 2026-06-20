# ICP / Anti-ICP Fit

Use this reference to classify whether each persona is useful for Recora diagnosis.

This is not a sales segmentation claim. Without customer data, classify fit as a hypothesis.

## Fit Values

Use exactly one:

- `likely_icp`: Strong fit for Recora diagnosis based on pain, decision influence, search behavior, comparison need, evidence, and prompt-angle usefulness.
- `possible_icp`: Plausible fit, but evidence or buying role needs validation.
- `adjacent_segment`: Related audience that may influence or inform diagnosis but is not a primary target.
- `anti_icp`: Not useful or risky for Recora diagnosis.
- `not_enough_evidence`: Insufficient evidence to classify.

## Evaluation Axes

Score or describe:

- `pain_intensity`
- `budget_likelihood`
- `decision_influence`
- `ai_search_likelihood`
- `comparison_need`
- `evidence_availability`
- `recora_diagnosis_usefulness`
- `risk_of_generic_output`

## Anti-ICP Examples

Classify as `anti_icp` or `not_enough_evidence` when:

- Pain is weak.
- Persona is unlikely to use AI search.
- Persona has no buying, adoption, or recommendation influence.
- There is no comparison axis.
- Recora cannot observe a useful prompt angle.
- Site evidence is too weak.
- The segment is too broad, such as "marketers", "small businesses", or "executives" without a struggling moment.
- The persona requires customer interview evidence before use.

## Required Output

```md
| persona_id | icp_fit | pain_intensity | budget_likelihood | decision_influence | ai_search_likelihood | comparison_need | evidence_availability | recora_diagnosis_usefulness | risk_of_generic_output | reason |
|---|---|---|---|---|---|---|---|---|---|---|
```

Do not include `anti_icp`, `unsupported`, or `not_enough_evidence` personas in normal handoff.
