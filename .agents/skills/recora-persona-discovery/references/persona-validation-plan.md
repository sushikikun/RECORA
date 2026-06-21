# Persona Validation Plan

Use this reference to turn persona hypotheses into a validation plan before they become stronger Recora diagnosis inputs.

This plan does not prove a persona is real. It names the assumptions, questions, evidence, and data sources needed to decide whether the persona is safe to use for prompt design now.

## Required Fields

For each included or borderline persona, output:

- `assumptions_to_validate`
- `validation_questions`
- `evidence_needed`
- `data_sources_to_check`
- `confidence_upgrade_condition`
- `validation_priority`
- `should_use_for_prompt_design_now`

## Data Sources To Check

Use these source labels:

- `customer_interview`
- `sales_call_notes`
- `inquiry_form_data`
- `CRM_notes`
- `case_studies`
- `support_tickets`
- `search_query_logs`
- `AI_search_prompt_logs`
- `win_loss_notes`
- `agency_partner_feedback`

## Validation Priority

Use one:

- `high`: The persona strongly affects prompt design or handoff risk.
- `medium`: The persona is useful, but missing evidence can be handled with caveats.
- `low`: The persona is secondary, adjacent, or mostly useful for research backlog.

## Prompt Design Use Decision

Use one:

- `yes`: Evidence and prompt readiness are enough for prompt design with clear caveats.
- `caution`: The persona can be used only with explicit hypothesis language and verification notes.
- `no`: Do not hand off to prompt design until the validation gap is addressed.

Do not use `yes` when `prompt_readiness` is `needs_more_evidence` or `do_not_handoff`.

## Question Rules

Good validation questions should:

- Ask about past behavior, not hypothetical preference.
- Identify the struggling moment, trigger, current alternative, desired outcome, and switching anxiety.
- Confirm who cares, who pays, who uses, and who may block adoption.
- Capture the customer's natural words, not vendor language.
- Test whether the persona would ask AI-search questions and what proof they would need.

Avoid leading questions such as "Would Recora help?" or "Do you need AI search diagnosis?"

## Output Table

```md
| persona_id | assumptions_to_validate | validation_questions | evidence_needed | data_sources_to_check | confidence_upgrade_condition | validation_priority | should_use_for_prompt_design_now |
|---|---|---|---|---|---|---|---|
```

## Upgrade Guidance

- Move `low` to `medium` only when several site signals plus at least one customer or external signal support the role, trigger, alternative, or vocabulary.
- Move `medium` to `high` only when 5 to 10 relevant data points support pain, trigger, alternatives, decision role, and vocabulary.
- Keep site-only personas as hypotheses even when they are useful for prompt design.
- Hold personas out of normal handoff when validation would likely change the prompt angle.
