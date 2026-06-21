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

## Scenario 11

- scenario_name: branded_prompts_do_not_distort_visibility_or_ranking
- input_context: Prompt set includes a mix of `non_branded`, `competitor_comparison`, `citation_check`, and `branded` prompts. The user wants AI Visibility Rate, AI Ranking, and Sentiment.
- expected_behavior: Add `metric_eligibility` to every prompt and keep branded prompts out of visibility rate and ranking calculations.
- must_include: `metric_eligibility` for each prompt, `visibility_rate: excluded` on `branded` / `brand_included` prompts, `ranking: excluded` on `branded` / `brand_included` prompts, and `sentiment: eligible` on sentiment-oriented branded prompts.
- must_not_include: branded prompts counted in AI Visibility Rate, branded prompts counted in AI Ranking, or one blended score that mixes visibility/ranking/sentiment.
- pass_criteria: Branded prompts are excluded from `visibility_rate`; branded prompts are excluded from `ranking`; branded prompts are eligible only for sentiment; sentiment is evaluated separately as `positive`, `neutral`, or `negative`; `metric_eligibility` is shown for each prompt.
- failure_signals: Any `branded` or `brand_included` prompt is marked visibility/ranking eligible, sentiment is missing from branded prompts, or reporting language treats branded visibility as market visibility.

## Scenario 12

- scenario_name: b2c_service_adapter_works
- input_context: Client is a consumer-facing service with booking, reviews, price sensitivity, and first-time user concerns.
- expected_behavior: Use the `b2c_service` adapter and avoid B2B SaaS committee language.
- must_include: review/reputation prompts, price/convenience prompts, first-time user persona, `brand_excluded` visibility/ranking prompts, and branded sentiment prompts excluded from visibility/ranking.
- must_not_include: procurement committee language, enterprise ROI framing, or branded prompts counted in visibility/ranking.
- pass_criteria: Prompt set measures consumer discovery, comparison, reviews, price/value, and brand sentiment separately.
- failure_signals: Personas are executives/evaluators only, reviews are missing, or branded sentiment is mixed into ranking.

## Scenario 13

- scenario_name: local_business_adapter_works
- input_context: Client is a local restaurant, salon, gym, school, repair shop, or similar area-based business.
- expected_behavior: Use the `local_business` adapter and include local intent.
- must_include: area/nearby prompts, access/opening-hours/booking or availability signals, review signals, local competitor/alternative discovery, and branded sentiment excluded from visibility/ranking.
- must_not_include: national SaaS-style category prompts only, or claims about map visibility before measurement.
- pass_criteria: Prompt set can observe local discovery, nearby alternatives, review themes, booking/visit intent, and separate brand perception.
- failure_signals: No area terms, no local alternatives, no review/booking signals, or visibility claims before measurement.

## Scenario 14

- scenario_name: clinic_healthcare_adapter_avoids_medical_overclaiming
- input_context: Client is a clinic, dental clinic, cosmetic medicine provider, treatment center, or healthcare-related service.
- expected_behavior: Use the `clinic_healthcare` adapter and avoid diagnosis, treatment promises, or unsupported safety claims.
- must_include: general information prompts, safety/qualification/source checks, risk/side-effect verification prompts, consultation-readiness framing, and branded trust/sentiment prompts excluded from visibility/ranking.
- must_not_include: medical diagnosis, treatment recommendation, guaranteed outcome, cure claim, or unsupported safety claim.
- pass_criteria: Prompt set can measure AI search visibility and source behavior while keeping healthcare claims cautious and verifiable.
- failure_signals: Prompts ask AI to diagnose, recommend treatment, guarantee results, or treat branded prompts as ranking.

## Scenario 15

- scenario_name: ecommerce_product_adapter_uses_review_price_delivery_axes
- input_context: Client sells products through EC, D2C, retail, marketplace, or product pages.
- expected_behavior: Use the `ecommerce_product` adapter and include product decision criteria.
- must_include: review, price/value, delivery, return, warranty, stock/specification, substitute product, and branded sentiment prompts.
- must_not_include: unsupported review counts, price claims, stock claims, or guaranteed product superiority before measurement.
- pass_criteria: Prompt set can observe product discovery, comparison, alternatives, review concerns, price/delivery/return criteria, and brand perception separately.
- failure_signals: Product prompts look like SaaS vendor comparisons, reviews are missing, or unsupported price/stock claims appear.

## Scenario 16

- scenario_name: professional_services_adapter_uses_trust_expertise_case_study_axes
- input_context: Client is a law firm, consultant, agency, accounting firm, SEO company, web production company, or other professional service provider.
- expected_behavior: Use the `professional_services` adapter and include expertise, trust, proof, fee, and consultation criteria.
- must_include: problem-based expert discovery, provider comparison, case-study/proof signals, fee/consultation checks, risk/trust prompts, and branded sentiment excluded from visibility/ranking.
- must_not_include: guaranteed legal/financial/business outcomes, unsupported case results, or generic product-style prompts only.
- pass_criteria: Prompt set can observe expert discovery, comparison axes, proof needs, trust signals, and sentiment without overclaiming results.
- failure_signals: No expertise/case-study angle, guaranteed outcome wording, wrong persona, or missing fee/trust checks.

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
- Metric eligibility is present for visibility rate, ranking, and sentiment.
- Branded prompts are excluded from visibility rate and ranking.
- Sentiment is evaluated separately from visibility/ranking.
- Industry adapter selection is explicit when the client is not generic B2B SaaS.
- B2C/local/EC/service prompts include review, price, trust, convenience, and decision-realism where relevant.
- Regulated contexts avoid diagnosis, legal/financial advice, and guaranteed outcomes.
- Unsupported assumptions are marked.
- Handoff targets are explicit when downstream analysis is useful.
