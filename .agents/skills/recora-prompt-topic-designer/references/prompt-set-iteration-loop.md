# Prompt Set Iteration Loop

Use this reference when a Recora prompt set needs to move from draft to measurement-ready.

The loop should improve the prompt set without making pre-measurement claims about visibility, citation, ranking, or recommendation outcomes.

## Loop Overview

1. Draft Prompt Set
2. Run Coverage Matrix
3. Run Quality Gate
4. Run Bias Audit
5. Diagnose Failures
6. Revise Low-quality Prompts
7. Recheck Measurement Readiness
8. Prepare Handoff
9. Freeze Prompt Set Version

## 1. Draft Prompt Set

Create the initial prompt set from the input contract:

- `client_name`
- `website_url`
- `industry`
- `business_model`
- `product_or_service`
- `target_customers`
- `competitors`
- `regions`
- `buyer_roles`
- `known_strengths`
- `known_risks`
- `diagnosis_goal`

Draft rules:

- Start with `non_branded` discovery prompts.
- Include persona and buyer-stage variation.
- Include `competitor_comparison`, `branded`, `citation_check`, and evidence prompts where relevant.
- Mark missing optional fields as `assumption`.
- Avoid URL-based claims when `website_url` is missing.

## 2. Run Coverage Matrix

Use `prompt-coverage-matrix.md` to check:

- `category_coverage`
- `buyer_stage_coverage`
- `persona_coverage`
- `intent_coverage`
- `signal_coverage`
- `brand_vs_nonbrand_balance`
- `competitor_balance`
- `evidence_check_coverage`
- `missing_required_area`
- `revision_needed`

Set `revision_needed: yes` when any required category, buyer stage, persona, signal, evidence check, or balance rule is missing for the selected mode.

## 3. Run Quality Gate

Use `prompt-quality-rubric.md` to score each prompt.

Gate decisions:

- `ready_for_measurement`
- `revise_before_measurement`
- `internal_only`
- `reject`

Gate reasons:

- `too_leading`
- `too_branded`
- `unclear_signal`
- `duplicate_prompt`
- `weak_buyer_realism`
- `not_actionable`
- `unsupported_assumption`

Every prompt that is not `ready_for_measurement` needs a revision record.

## 4. Run Bias Audit

Check whether the set is biased by:

- Client brand seeding.
- A fixed competitor list that excludes unknown competitors.
- Late-stage buyer assumptions.
- Persona labels that do not change the question.
- Prompt wording that implies the client should be cited, preferred, or recommended.
- Unsupported claims about market category, pricing, reputation, customer fit, or citation sources.

Bias audit output:

```md
## Bias Audit

- branded_overfit:
- competitor_overconstraint:
- buyer_stage_collapse:
- persona_flattening:
- leading_question_bias:
- unsupported_market_assumption:
- revision_needed:
```

## 5. Diagnose Failures

Use `prompt-design-failure-diagnosis.md` when coverage, gate, or bias checks fail.

Diagnosis output:

```md
## Failure Diagnosis

- failure_type:
- affected_prompt_ids:
- symptom:
- detection_rule:
- likely_cause:
- repair_strategy:
- revised_prompt_pattern:
- related_reference_file:
- quality_gate_result:
```

## 6. Revise Low-quality Prompts

For each failed or weak prompt, provide:

```md
- original_prompt:
- issue:
- revised_prompt:
- why_better:
- expected_signal_after_revision:
```

Revision rules:

- Repair the smallest useful unit: prompt wording, label, expected signal, handoff, or topic grouping.
- Remove prompts that exist only to reach a count.
- Split multi-intent prompts into one measurable question each.
- Keep one stable `id` per prompt; if the meaning changes substantially, use a new ID and log it.
- Do not add more branded prompts to fix a non-branded coverage problem.

## 7. Recheck Measurement Readiness

Use `measurement-readiness-evals.md` after revisions.

Minimum readiness checks:

- The same prompt can be run across multiple AI engines.
- Answer text can be parsed for brand mention, competitor mention, citation/source, recommendation/order, comparison axes, pricing/reputation, and risk where relevant.
- `expected_signal` is observable.
- `prompt_id` is unique.
- `buyer_stage`, `persona`, category, intent, and mention rules can be aggregated.
- Unsupported assumptions are marked or handed off.

## 8. Prepare Handoff

Assign one primary handoff per prompt when useful:

- `recora-persona-discovery`: persona or `buyer_roles` are missing, shallow, or not role-separated.
- `recora-ai-citation-analysis`: citation/source behavior needs analysis.
- `recora-competitor-benchmark`: competitor comparison, substitute discovery, or market alternatives need analysis.
- `recora-recommendation-quality-gate-auditor`: measurement results may produce client-facing recommendations.
- `recora-schema-seo-aio`: owned pages, FAQ, schema, comparison pages, or evidence sections may need improvement.
- `none`: no immediate downstream skill is needed.

Handoff record:

```md
- prompt_id:
- primary_handoff_skill:
- handoff_reason:
- expected_input_to_handoff:
- not_for_this_skill:
```

## 9. Freeze Prompt Set Version

Freeze only when:

- Required categories for the selected mode are present.
- Non-branded coverage is sufficient for the diagnosis goal.
- Buyer stages and personas meet the selected mode minimums.
- Every prompt has an observable `expected_signal`.
- Every prompt has a quality gate result.
- Weak prompts are revised or removed.
- Handoff targets are explicit where needed.
- Machine-readable fields are stable.
- No pre-measurement claims remain.

## Versioning Rule

Use this pattern:

```md
prompt_set_version: vYYYYMMDD.N
status: draft | revised | frozen | reopened
owner: recora-prompt-topic-designer
change_reason:
changed_prompt_ids:
coverage_summary:
quality_gate_summary:
measurement_readiness:
```

Increment:

- Patch number when wording, expected signal, or labels change.
- Date and sequence when the client context, diagnosis goal, persona set, competitor assumptions, or mode changes.
- Reopen a frozen version instead of silently editing it after measurement begins.

## Stop Condition

Stop iterating and mark `ready_for_measurement` when:

- Coverage matrix has no blocking gaps for the chosen mode.
- Quality gate has no `reject` prompts and no unresolved `revise_before_measurement` prompts.
- Bias audit has no severe branded, leading, competitor, persona, or unsupported assumption issues.
- Measurement-readiness evals pass for the prompt set's risk profile.
- Handoff plan is explicit.

Stop and mark `internal_only` when:

- Required context is too weak to support measurement.
- The output is useful for scoping but relies on assumptions.
- The user needs persona, competitor, or source research before measurement.

## Regression Check

Before freezing a revised prompt set, compare it against the previous version:

- Did non-branded coverage decrease without a goal-based reason?
- Did a revision introduce brand seeding?
- Did a revision remove buyer-stage or persona variety?
- Did expected signals become less observable?
- Did prompt IDs remain stable where meaning stayed stable?
- Did a new prompt duplicate an existing one?
- Did handoff coverage regress?
- Did machine-readable fields stay consistent?

## prompt_set_changelog

```md
## Prompt Set Changelog

- version:
- date:
- status:
- changed_prompt_ids:
- added_prompt_ids:
- removed_prompt_ids:
- reason_for_change:
- coverage_change:
- quality_gate_change:
- readiness_change:
- handoff_change:
- remaining_risks:
```

## when_to_reopen_prompt_set

Reopen the prompt set when:

- The client changes product, category, region, pricing, or target customers.
- New buyer personas or roles are discovered.
- Competitor assumptions change.
- Measurement shows many prompts are not parseable.
- AI engines consistently answer a prompt as multiple questions.
- Citation or source analysis requires more evidence-oriented prompts.
- Client-facing recommendations need a safer prompt-result basis.
- A prompt is found to be leading, over-branded, duplicated, or unsupported.
