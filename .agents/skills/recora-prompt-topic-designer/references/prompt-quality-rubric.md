# Prompt Quality Rubric

Use this reference when scoring Recora prompt quality, assigning gate decisions, or revising weak prompts.

## Scoring Dimensions

Score each dimension as `high`, `medium`, or `low`.

| dimension | high | medium | low |
|---|---|---|---|
| `naturalness` | Sounds like a realistic AI-search question from a buyer. | Slightly formal or dense but still plausible. | Keyword list, internal jargon, or unnatural phrasing. |
| `diagnostic_value` | Reveals a clear Recora observation such as mentions, citations, comparison criteria, or risk. | Useful but broad; needs sharper signal. | Does not explain what Recora should learn. |
| `non_leading` | Does not imply the desired answer or winner. | Mild framing but not strongly biased. | Presumes the client is best, visible, cited, or recommended. |
| `buyer_realism` | Matches a real buyer role, concern, and decision moment. | Buyer is plausible but generic. | No buyer context or unrealistic buyer behavior. |
| `measurement_readiness` | Can be run across engines and parsed consistently. | Runnable but may need normalization. | Ambiguous, multi-question, provider-specific, or hard to parse. |
| `persona_specificity` | Persona or role changes the wording and signal. | Persona is named but not deeply reflected. | No persona, or persona is irrelevant. |
| `stage_fit` | Buyer stage is explicit and reflected in the prompt. | Stage is inferable but weak. | Stage is missing or mismatched. |
| `expected_signal_clarity` | Expected signal is observable from answer text, citations, or entities. | Signal is partly observable. | Signal is vague, impossible, or a prediction. |

## Quality Score

Use 0-100 when producing a detailed prompt list.

- 90-100: all or nearly all dimensions are `high`.
- 75-89: mostly `high`, with minor caveats.
- 60-74: at least one important `medium`; revise before primary measurement.
- 40-59: one or more important `low`; internal exploration only.
- 0-39: misleading, unmeasurable, unsafe, or unusable.

Use `high / medium / low` when a compact output is requested.

## Gate Mapping

| gate_decision | Use when | Typical score |
|---|---|---|
| `ready_for_measurement` | Natural, non-leading, measurable, buyer-realistic, and has expected signal. | 75-100 |
| `revise_before_measurement` | Direction is useful but one or more dimensions need repair. | 60-74 |
| `internal_only` | Useful for strategy exploration but too broad, biased, or hard to parse. | 40-59 |
| `reject` | Leading, unsupported, duplicated, unsafe, or not diagnostic. | 0-39 |

## Gate Reasons

Use one or more of these values:

- `too_leading`
- `too_branded`
- `unclear_signal`
- `duplicate_prompt`
- `weak_buyer_realism`
- `not_actionable`
- `unsupported_assumption`

## Failure Diagnosis Link

When assigning a gate decision, map the reason to `prompt-design-failure-diagnosis.md` when possible.

| gate_reason | likely_failure_type | next_action |
|---|---|---|
| `too_leading` | `leading_question_bias` | Rewrite as a neutral buyer question before measurement. |
| `too_branded` | `branded_overfit` or `non_branded_undercoverage` | Rebalance with `brand_excluded` prompts and reduce client-brand seeding. |
| `unclear_signal` | `weak_expected_signal` or `vague_topic_set` | Replace broad goals with observable answer, citation, mention, comparison, or risk signals. |
| `duplicate_prompt` | `duplicate_prompt_cluster` | Merge, remove, or create a distinct stage/persona/signal variant. |
| `weak_buyer_realism` | `buyer_stage_collapse` or `persona_flattening` | Add role-specific wording and stage-appropriate buyer context. |
| `not_actionable` | `measurement_unready` or `machine_readability_failure` | Split into one measurable question and restore required fields. |
| `unsupported_assumption` | `unsupported_market_assumption` | Mark assumptions, weaken claims, or hand off before measurement. |

## Low-Quality Revision Rule

When any important dimension is `low`, produce a revision:

```md
- original_prompt:
- issue:
- revised_prompt:
- why_better:
- expected_signal_after_revision:
```

Repair rules:

- Convert SEO keywords into a conversational buyer question.
- Remove claims that the brand is best, visible, cited, or recommended.
- Reduce brand seeding unless the category is `branded`.
- Add persona, buyer stage, and decision context.
- Replace named competitors with `unknown_competitor_discovery` when competitors are missing.
- Make `expected_signal` observable from answer text, mentions, citations, recommendation order, or risks.
- Split multi-intent prompts into separate prompts when measurement would be unclear.

After revision, rerun the coverage matrix, quality gate, and measurement-readiness evals. If the same failure remains, use `prompt-set-iteration-loop.md` to record the change and decide whether the prompt stays `internal_only` or is removed.
