# Prompt Angle Handoff Contract

Use this contract when producing `Handoff to recora-prompt-topic-designer`.

## Required Fields

Every handoff row must include:

- `persona_id`: Stable ID such as `P1`, `P2`, `P3`.
- `role_type`: One of the allowed B2B or B2C role values.
- `buyer_stage`: One of the allowed stage values.
- `pain`: Main pain or job-to-be-done in one compact sentence.
- `prompt_angle`: Reusable testing direction for prompt generation.
- `sample_ai_questions`: 2 to 4 natural AI-search questions.
- `priority`: `high`, `medium`, or `low`.
- `confidence`: `high`, `medium`, or `low`.
- `needs_verification`: Specific missing evidence, customer data, or site page to verify.

## Allowed Role Values

B2B:

- `decision_maker`
- `economic_buyer`
- `end_user`
- `evaluator`
- `influencer`
- `agency_or_consultant`

B2C:

- `purchaser`
- `user`
- `comparator`
- `recommender_influencer`
- `repeat_user`

Marketplace or agency-support cases may use these values with side labels in the persona name or business model side column.

## Allowed Buyer Stage Values

Prefer values already compatible with `recora-prompt-topic-designer`:

- `early_research`
- `solution_exploration`
- `comparison_shortlist`
- `purchase_validation`
- `implementation_planning`

For `repeat_user`, usually use `purchase_validation` for renew/rebuy confidence checks or `implementation_planning` for post-adoption success and continued-use questions.

## Prompt Angle Requirements

A prompt angle is not a final prompt. It should tell `recora-prompt-topic-designer` what kind of prompts to create.

It must include:

- Persona context
- Trigger situation
- Search intent
- Comparison target or category
- Comparison axis
- Evidence or proof need

Good shape:

```md
Test prompts where [persona] is trying to [decision/job], compares [alternatives/categories], and looks for [proof/evidence] before [buying/adopting/renewing].
```

## Sample Handoff Row

```md
| persona_id | role_type | buyer_stage | pain | prompt_angle | sample_ai_questions | priority | confidence | needs_verification |
|---|---|---|---|---|---|---|---|---|
| P1 | evaluator | comparison_shortlist | Needs to reduce vendor-selection risk before recommending a tool. | Test prompts where a practical evaluator compares category alternatives, asks what criteria matter, and looks for proof such as integrations, pricing clarity, implementation examples, and case studies. | "What should I compare before choosing a [category] tool?"; "Which [category] tools are best for teams that need [use case]?"; "What risks should I check before adopting [category] software?" | high | medium | Verify actual evaluator role from sales notes or customer interviews. |
```

## Handoff Quality Checks

- Each persona has at least one distinct prompt angle.
- Sample questions are natural AI-search questions, not SEO keyword fragments.
- Prompt angles avoid guaranteed outcomes or predicted AI visibility.
- Persona IDs remain stable throughout the output.
- `needs_verification` is never empty when customer data is unavailable.
