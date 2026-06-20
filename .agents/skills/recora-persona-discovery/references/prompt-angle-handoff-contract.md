# Prompt Angle Handoff Contract

Use this contract when producing `Handoff to recora-prompt-topic-designer`.

Only hand off included personas. Do not pass excluded, unsupported, `anti_icp`, `not_enough_evidence`, or `not_enough_to_use` personas downstream unless the handoff purpose is explicitly verification or research planning.

## Required Fields

Every handoff row must include:

- `persona_id`: Stable ID such as `P1`, `P2`, `P3`.
- `role_type`: One of the allowed B2B or B2C role values.
- `buyer_stage`: One of the allowed stage values.
- `pain`: Main pain or job-to-be-done in one compact sentence.
- `switching_forces`: Compact push/pull/habit/anxiety summary.
- `journey_stage`: Primary AI-search journey stage.
- `problem_narrative`: Compact struggling-moment summary.
- `vocabulary_terms`: Words or phrases the persona may use in AI search.
- `alternatives_considered`: Direct competitor, existing SEO tool, agency/consultant, in-house manual research, spreadsheet/ad hoc prompt testing, do nothing, or wait and see.
- `prompt_angle`: Reusable testing direction for prompt generation.
- `sample_ai_questions`: 2 to 4 natural AI-search questions.
- `priority`: `high`, `medium`, or `low`.
- `confidence`: `high`, `medium`, or `low`.
- `icp_fit`: `likely_icp`, `possible_icp`, or `adjacent_segment` for normal handoff. Do not normal-handoff `anti_icp` or `not_enough_evidence`.
- `traceability_claim_ids`: Claim IDs from `evidence-to-persona-traceability.md` that support the persona and prompt angle.
- `research_sufficiency`: Gate value from `research-sufficiency-gate.md`.
- `confidence_upgrade_needed`: Compact description of missing data needed to raise confidence.
- `questions_to_validate_before_prompt_design`: 1 to 3 research questions needed before stronger prompt design, especially for low-confidence or borderline personas.
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

- `awareness`
- `exploration`
- `comparison`
- `validation`
- `decision`

For `repeat_user`, usually use `validation` for renew/rebuy confidence checks or `decision` for final continued-use questions.

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
| persona_id | role_type | buyer_stage | pain | switching_forces | journey_stage | problem_narrative | vocabulary_terms | alternatives_considered | prompt_angle | sample_ai_questions | priority | confidence | icp_fit | traceability_claim_ids | research_sufficiency | confidence_upgrade_needed | questions_to_validate_before_prompt_design | needs_verification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | evaluator | comparison | Needs to reduce vendor-selection risk before recommending a tool. | Push: current reporting is unclear; Pull: clearer evidence; Habit: existing SEO tools; Anxiety: implementation risk. | comparison | Evaluator must recommend a shortlist but lacks proof that alternatives solve the real problem. | "compare tools"; "implementation risk"; "case study" | direct competitor; existing SEO tool; in-house manual research | Test prompts where a practical evaluator compares category alternatives, asks what criteria matter, and looks for proof such as integrations, pricing clarity, implementation examples, and case studies. | "What should I compare before choosing a [category] tool?"; "Which [category] tools are best for teams that need [use case]?"; "What risks should I check before adopting [category] software?" | high | medium | possible_icp | C1; C3; C5 | enough_for_prompt_design | Needs sales notes or interviews proving evaluator role, budget influence, and actual vocabulary. | "What triggered the shortlist request?"; "Which alternatives were compared?"; "What proof was required before recommendation?" | Verify actual evaluator role from sales notes or customer interviews. |
```

## Handoff Blockers

Do not include a persona in normal prompt-design handoff when any of these apply:

- `icp_fit` is `anti_icp` or `not_enough_evidence`.
- `research_sufficiency` is `not_enough_to_use`.
- Required traceability claims have `inference_type` of `unsupported`.
- The persona lacks `traceability_claim_ids`.
- The persona lacks validation questions for the assumptions behind the prompt angle.
- The prompt angle cannot connect persona context, search intent, alternatives, comparison criteria, and proof needs.

## Handoff Quality Checks

- Each persona has at least one distinct prompt angle.
- Sample questions are natural AI-search questions, not SEO keyword fragments.
- Prompt angles avoid guaranteed outcomes or predicted AI visibility.
- Persona IDs remain stable throughout the output.
- `needs_verification` is never empty when customer data is unavailable.
- `traceability_claim_ids` point to evidence or explicit research gaps in the traceability table.
- `questions_to_validate_before_prompt_design` targets the assumptions behind the prompt angle.
- `confidence_upgrade_needed` matches the missing data in `persona-confidence-upgrade-data.md`.
- Handoff rows are consistent with the Persona Decision Table.
- Personas with high `exclusion_risk` are not handed off as normal diagnosis targets.
- `anti_icp`, `not_enough_evidence`, `unsupported`, and `not_enough_to_use` candidates are not handed off as normal diagnosis targets.
- Switching forces, journey stage, problem narrative, vocabulary, and alternatives connect directly to `prompt_angle` and `sample_ai_questions`.
