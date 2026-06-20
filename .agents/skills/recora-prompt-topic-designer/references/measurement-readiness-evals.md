# Measurement Readiness Evals

Use these scenarios to check whether `recora-prompt-topic-designer` is producing prompt sets that are ready for Recora measurement.

Each scenario should be checked against the generated prompt set before it is treated as `ready_for_measurement`.

## Scenario 1

- scenario_name: weak_client_context_starter_set
- input_context: Only `client_name`, `industry`, `product_or_service`, `target_customers`, and `diagnosis_goal` are provided. `website_url`, `competitors`, `buyer_roles`, `regions`, `known_strengths`, and `known_risks` are missing.
- expected_behavior: Produce a cautious starter set, mark missing inputs, state assumptions, and avoid final measurement readiness unless the gaps are acceptable for the requested mode.
- must_include: `missing_input`, `assumption`, non-branded prompts, `expected_signal`, and handoff to `recora-persona-discovery` when roles are weak.
- must_not_include: URL/page/schema claims, invented competitors, or statements that the prompt set is final without caveats.
- pass_criteria: The set can support early scoping and clearly separates assumptions from supplied facts.
- failure_signals: Unsupported market assumptions, no missing-input notes, or claims based on absent URL/competitor/persona data.

## Scenario 2

- scenario_name: no_competitor_list
- input_context: Client context is strong, but no competitor names are supplied.
- expected_behavior: Use `unknown_competitor_discovery` and `category_competitors` instead of inventing competitor names.
- must_include: `competitor_mention_rule: unknown_competitor_discovery`, `alternative_search`, `competitor_comparison`, and `recora-competitor-benchmark` handoff where relevant.
- must_not_include: fabricated competitor names or prompts that assume a known market map.
- pass_criteria: AI answers can reveal which alternatives appear without seeding a fixed competitor list.
- failure_signals: Named competitors appear without input support, or all competitor prompts require named competitors.

## Scenario 3

- scenario_name: no_persona_or_buyer_roles
- input_context: User asks for standard mode, but `buyer_roles` and personas are missing or generic.
- expected_behavior: Create role assumptions only when marked, include a persona-discovery handoff, and avoid pretending the persona model is validated.
- must_include: `persona` fields, explicit assumptions, `recora-persona-discovery` handoff, and persona coverage gaps in the coverage matrix.
- must_not_include: over-specific buyer roles presented as verified customer segments.
- pass_criteria: The prompt set can be used as a draft while clearly flagging persona uncertainty.
- failure_signals: Persona labels are absent, copied across prompts without wording changes, or treated as verified data.

## Scenario 4

- scenario_name: over_branded_prompt_set
- input_context: Draft prompt set contains mostly prompts with the client brand name.
- expected_behavior: Diagnose `branded_overfit`, rebalance toward `non_branded`, and keep branded prompts for validation.
- must_include: `brand_vs_nonbrand_balance`, revised non-branded prompts, `gate_reason: too_branded` where appropriate, and revised prompt records.
- must_not_include: more branded prompts as the main fix.
- pass_criteria: Non-branded prompts become the largest group unless the diagnosis goal explicitly justifies another ratio.
- failure_signals: Branded prompts dominate without explanation, or `brand_excluded` prompts are missing.

## Scenario 5

- scenario_name: low_expected_signal_clarity
- input_context: Prompts are plausible, but `expected_signal` values are vague.
- expected_behavior: Diagnose `weak_expected_signal` and rewrite expected signals into observable measurement targets.
- must_include: observable signals such as brand mention, competitor mention, citation/source, comparison axes, recommendation/order, pricing/reputation, or risk.
- must_not_include: vague signals such as "check quality", "see if it works", or pre-measurement claims that the brand appears.
- pass_criteria: Each prompt has a signal that can be extracted from answer text or citations.
- failure_signals: Expected signals are missing, predictions, or not tied to observable answer elements.

## Scenario 6

- scenario_name: duplicate_prompt_cluster
- input_context: Prompt set reaches the minimum count by repeating similar questions with minor wording changes.
- expected_behavior: Diagnose `duplicate_prompt_cluster`, remove or merge duplicates, and add distinct prompts only when they serve a different category, stage, persona, or signal.
- must_include: affected prompt IDs, revision records, and an explanation of the distinct signal after revision.
- must_not_include: duplicate prompts kept only to satisfy prompt count.
- pass_criteria: Similar prompts have meaningfully different diagnostic purpose.
- failure_signals: Repeated wording, same labels, same expected signal, and no reason for retaining both prompts.

## Scenario 7

- scenario_name: citation_check_missing
- input_context: Diagnosis goal mentions source trust, evidence, citations, or AI answer grounding.
- expected_behavior: Include `citation_check` prompts and `evidence_seeking` intent, then hand off to `recora-ai-citation-analysis`.
- must_include: citation/source expected signals, `recora-ai-citation-analysis` handoff, and no source-appearance guarantee.
- must_not_include: pre-measurement citation guarantees for the client or a specific source.
- pass_criteria: The set can observe cited URLs, source types, and source-to-claim support.
- failure_signals: No citation/evidence prompts, no citation handoff, or citation guarantees.

## Scenario 8

- scenario_name: machine_readable_output_missing
- input_context: User needs prompt sets that can become measurement rows.
- expected_behavior: Use the required field names and one prompt per row or list item.
- must_include: stable `id`, `prompt`, `category`, `intent_type`, `buyer_stage`, `persona`, `brand_mention_rule`, `competitor_mention_rule`, `expected_signal`, `risk_or_bias`, `handoff_skill`, `quality_score`, `gate_decision`, and `gate_reason`.
- must_not_include: narrative-only prompt lists, inconsistent labels, or missing IDs.
- pass_criteria: The output can be converted to structured data without manual interpretation.
- failure_signals: Mixed field names, duplicate IDs, missing required fields, or prose-only output.

## Scenario 9

- scenario_name: handoff_skill_missing
- input_context: Prompt set includes persona uncertainty, competitor discovery, citation checks, and possible client-facing recommendations.
- expected_behavior: Assign specific handoff skills where downstream analysis is useful.
- must_include: `recora-persona-discovery`, `recora-ai-citation-analysis`, `recora-competitor-benchmark`, `recora-recommendation-quality-gate-auditor`, or `recora-schema-seo-aio` where conditions match.
- must_not_include: `handoff_skill: none` for prompts that clearly need downstream analysis.
- pass_criteria: Each prompt has one primary handoff or a clear reason for `none`.
- failure_signals: Handoff fields are blank, generic, or inconsistent with prompt category and expected signal.

## Scenario 10

- scenario_name: unsupported_assumptions
- input_context: Draft prompt set includes category claims, competitor names, persona details, pricing/reputation angles, or URL evidence not supplied by the user.
- expected_behavior: Mark unsupported claims as assumptions, weaken the language, or route to the appropriate discovery skill before measurement.
- must_include: `assumption` notes, `gate_reason: unsupported_assumption` where relevant, and a revision path.
- must_not_include: unverified customer segments, competitor lists, pricing claims, reputation claims, or page/schema claims.
- pass_criteria: The set distinguishes supplied facts, assumptions, and items needing handoff or validation.
- failure_signals: The prompt set treats guessed market facts as known, or uses unsupported claims inside prompts.

## Compact Pass Checklist

- Non-branded coverage exists and is not crowded out by branded prompts.
- Buyer stages are distributed for the selected mode.
- Persona changes wording and expected signal, or persona uncertainty is handed off.
- Competitor prompts are neutral and support unknown discovery when needed.
- Citation checks are present when evidence/source analysis is part of the goal.
- Every prompt has a unique ID.
- Every prompt has an observable expected signal.
- Every prompt has a quality gate result.
- Low-quality prompts have revisions or are removed.
- Machine-readable fields use the required names and allowed label values.
- Unsupported assumptions are marked.
- Handoff targets are explicit when downstream analysis is useful.
