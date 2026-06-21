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
| `persona_query_realism` | The prompt sounds like something the target person would actually type into AI or search. | Usable for diagnosis, but slightly too polished or survey-like. | Sounds like a research questionnaire, consultant memo, or internal planning note rather than real user input. |
| `over_sanitized_language` | Safety is preserved while keeping real buyer vocabulary such as price, reviews, anxiety, locality, or job-specific shorthand. | Safe but a little too clean; revise if the prompt set lacks raw or anxious variants. | Safe wording removes the user's real concern so much that the prompt no longer resembles the likely query. |
| `buyer_vocabulary_fit` | Uses the industry's and persona's real vocabulary, such as consumer price/review terms or B2B role-specific workarounds. | Mostly understandable, but generic. | Uses vocabulary from the wrong industry or sounds like a consultant taxonomy. |
| `measurement_readiness` | Can be run across engines and parsed consistently. | Runnable but may need normalization. | Ambiguous, multi-question, provider-specific, or hard to parse. |
| `persona_specificity` | Persona or role changes the wording and signal. | Persona is named but not deeply reflected. | No persona, or persona is irrelevant. |
| `stage_fit` | Buyer stage is explicit and reflected in the prompt. | Stage is inferable but weak. | Stage is missing or mismatched. |
| `expected_signal_clarity` | Expected signal is observable from answer text, citations, or entities. | Signal is partly observable. | Signal is vague, impossible, or a prediction. |
| `metric_eligibility_fit` | Visibility/ranking/sentiment eligibility matches prompt category and brand mention rule. | Eligibility is present but one edge case needs review. | Branded or `brand_included` prompt is eligible for visibility rate or ranking. |
| `industry_fit` | Prompt angle reflects the selected industry adapter and category reality. | Broadly relevant but partly generic. | B2B SaaS or generic wording is applied to the wrong industry. |
| `business_model_fit` | Prompt reflects BtoB, BtoC, local, product, service, regulated, marketplace, or hybrid buying logic. | Business model is implied but weak. | Business model logic conflicts with the client context. |
| `persona_realism_by_industry` | Persona reflects real industry decision roles, such as patient, parent, shopper, local visitor, evaluator, or committee buyer. | Persona is plausible but generic. | Persona is unrealistic for the industry. |
| `regulated_claim_safety` | Regulated industries avoid diagnosis, legal/financial advice, guarantees, and unsupported safety/performance claims. | Some caution is present but needs sharper risk wording. | Prompt invites medical/legal/financial diagnosis, advice, or guaranteed outcomes. |
| `local_intent_fit` | Local businesses include area, availability, access, opening hours, booking, and nearby alternatives when relevant. | Some locality is present but incomplete. | Local intent is missing for a local business. |
| `consumer_decision_realism` | B2C/EC/education prompts include reviews, price, convenience, quality, trust, and first-time anxiety where relevant. | Consumer concerns are present but thin. | Consumer prompts use B2B procurement language or ignore reviews/price/convenience. |

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
- `metric_misclassified`
- `industry_mismatch`
- `regulated_overclaim`
- `over_sanitized_language`
- `consultant_language_bias`
- `missing_raw_search_intent`
- `missing_emotional_trigger`
- `professional_persona_overgeneralized`

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
| `metric_misclassified` | `branded_overfit` or `measurement_unready` | Exclude branded prompts from visibility/ranking and use them only for sentiment or brand perception. |
| `industry_mismatch` | `b2b_template_overapplied_to_b2c`, `wrong_persona_for_industry`, or `business_model_mismatch` | Select the correct adapter and rewrite persona, stage, and prompt family. |
| `regulated_overclaim` | `regulated_industry_overclaim` | Remove diagnosis/advice/guarantee wording and add source, qualification, risk, and verification checks. |
| `over_sanitized_language` | `over_sanitized_query` | Rewrite into a safer version of the buyer's likely raw phrase, preserving price, review, anxiety, local, or role-specific vocabulary. |
| `consultant_language_bias` | `consultant_language_bias` | Replace research-report language with a realistic AI/search question and add `language_mode`. |
| `missing_raw_search_intent` | `missing_raw_search_intent` | Add at least one `raw_search_like` or `comparison_shortcut` prompt when the buyer would search that way. |
| `missing_emotional_trigger` | `missing_emotional_trigger` | Add safe anxiety, price, review, or failure-avoidance wording for BtoC/local/clinic contexts. |
| `professional_persona_overgeneralized` | `professional_persona_overgeneralized` | Add role-specific practical vocabulary for BtoB and specialist personas. |

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
- Convert over-polished research questions into realistic persona language while keeping them measurable.
- Preserve `raw_user_intent` when the final prompt is a safer rewrite of a rough query.
- Add or revise `language_mode` when the set lacks realistic variation.
- Remove claims that the brand is best, visible, cited, or recommended.
- Reduce brand seeding unless the category is `branded`.
- Add persona, buyer stage, and decision context.
- Replace named competitors with `unknown_competitor_discovery` when competitors are missing.
- Make `expected_signal` observable from answer text, mentions, citations, recommendation order, or risks.
- Add `metric_eligibility` and exclude `branded` / `brand_included` prompts from AI Visibility Rate and AI Ranking.
- Use branded prompts for sentiment / brand perception only, with sentiment reported separately.
- Select an industry/business model adapter before reusing B2B SaaS prompt patterns.
- Rewrite B2C, local, EC, education, healthcare, real estate, finance, professional-service, and HR prompts around their real buyer concerns.
- For regulated industries, remove diagnosis, legal/financial advice, investment advice, guaranteed outcomes, and unsupported safety/performance claims.
- In regulated industries, keep real anxiety or shorthand but transform it into source, qualification, risk, consultation-readiness, or comparison-check wording.
- Split multi-intent prompts into separate prompts when measurement would be unclear.

When `persona_query_realism`, `over_sanitized_language`, or `buyer_vocabulary_fit` is `low`, provide a revision before measurement.

## Industry Fit Rule

When the client is not a generic B2B SaaS case, check the prompt against `industry-business-model-adapters.md`.

- BtoC services should include review, price, quality, convenience, first-time concern, and availability angles.
- Local businesses should include area, access, opening hours, booking, and nearby alternatives.
- Clinics and healthcare should use general information, comparison, safety, qualification, and source-check language, not diagnosis or treatment recommendations.
- Clinics and healthcare should also preserve realistic patient/consumer vocabulary such as "first time", "scared", "cheap", "reviews", "avoid failure", or local area names, then rewrite safely.
- EC/product prompts should include review, price, delivery, return, warranty, specs, and substitute-product angles.
- Education prompts should include curriculum, instructor/support, price, learner fit, and outcome-evidence checks without guaranteeing outcomes.
- Real estate prompts should include area, cost, contract-risk, trust, and availability checks without legal/financial overclaiming.
- Professional services should include expertise, cases, fees, consultation fit, and trust signals without guaranteed results.
- Finance/insurance prompts should include risk, fee, regulation, suitability, and source checks without investment or insurance advice.
- Recruiting/HR prompts should include candidate quality, hiring speed, cost, mismatch risk, and compliance without guaranteed hiring outcomes.

## Sentiment Quality Rule

When a branded prompt is used for sentiment, require:

```md
sentiment_label: positive | neutral | negative
sentiment_reason:
quoted_or_observed_phrase:
risk_note:
needs_verification:
```

- `positive`: AI describes the brand as favorable, credible, a strong candidate, or having clear strengths.
- `neutral`: AI gives factual, conditional, general, or information-limited descriptions.
- `negative`: AI describes risks, uncertainty, reputation concerns, pricing concerns, adoption concerns, or competitor disadvantages.
- `needs_verification`: mark `true` when source URLs or measured answers are insufficient to judge sentiment.

Do not use sentiment labels to influence AI Visibility Rate or AI Ranking.

After revision, rerun the coverage matrix, quality gate, and measurement-readiness evals. If the same failure remains, use `prompt-set-iteration-loop.md` to record the change and decide whether the prompt stays `internal_only` or is removed.
