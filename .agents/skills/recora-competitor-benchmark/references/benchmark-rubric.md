# Benchmark Rubric

Use this reference when classifying competitors, assigning Threat Level, choosing confidence, or deciding whether evidence is too thin.

## Tier Decision Rubric

Score each competitor as `High`, `Medium`, `Low`, or `Unknown` on:

- `customer_overlap`
- `use_case_overlap`
- `buying_context_overlap`
- `budget_competition`
- `ai_answer_co_occurrence`
- `third_party_evidence`
- `market_region_fit`
- `language_market_fit`
- `pricing_or_plan_overlap`
- `implementation_model_overlap`

Use the pattern to decide tier:

- `Direct`: Mostly `High` across customer, use case, buying context, market/language fit, and AI co-occurrence; at least one non-official evidence source or clear AI answer context.
- `Adjacent`: Some `High`/`Medium` overlap, but buying context, implementation model, or purchase objective is not fully aligned.
- `Aspirational`: Strong reference value, but low/unknown local purchase substitution or buyer overlap.
- `Substitute`: Strong budget, time, or workflow competition even when product category differs.

If several decisive fields are `Unknown`, attach `low_confidence` and avoid final tier language.

## Tier Evidence Thresholds

- `Direct`: Same customer segment, use case, purchase timing, and comparison context; co-listed in AI answers; and at least one support type beyond competitor self-claims, such as third-party information, comparison articles, reviews, case studies, or useful AI answer context.
- `Adjacent`: Some overlap in feature, customer, or use case; plausible alternative; but purchase objective is not fully identical.
- `Aspirational`: Not a direct competitor; useful for category formation, report design, UI, messaging, or AI visibility design; includes overseas leading services and major category leaders.
- `Substitute`: Achieves the same outcome by a different method, including SEO agencies, consultants, in-house operations, AI tools, spreadsheets, BI, Notion, or existing workflows. Include when it can take the customer's budget or operational time.

## Market Region

Use these market-region values:

- `Japan direct market`
- `Japan adjacent market`
- `Global reference`
- `Overseas aspirational`
- `Unknown market relevance`

Treat overseas SaaS as `Aspirational` or `Adjacent` by default. Do not classify it as Japan `Direct` unless there is strong evidence such as domestic sales motion, Japanese-language support, Japanese entity or partner, Japanese case studies, domestic comparison context, and the same buyer/use case/purchase timing. A service appearing in Japanese AI answers does not prove it is a domestic purchase substitute.

## Low-Confidence Rules

Attach `low_confidence` when:

- The competitor appears only once in AI answers.
- The only evidence is the competitor site's own claims.
- Customer, use case, pricing band, or buying context is unclear.
- Evidence is weak for treating an overseas service as a domestic direct competitor.
- The category looks similar, but real substitutability is unclear.
- Only the competitor name appears, while answer context or citation support is weak.
- The source evidence does not support the answer claim being analyzed.

## Sample Quality

Always report sample size for Share of Voice, recommendation rank, and prompt coverage:

- `prompts < 10`: `directional_only`
- `prompts 10-29`: `weak_sample`
- `prompts 30-49`: `usable_but_limited`
- `prompts >= 50`: `benchmark_ready`

Attach `insufficient_sample` to thin samples and avoid claiming rank movement, category ownership, or threat level shifts from small prompt sets.

## Confidence

Output confidence as `high`, `medium`, `low`, or `insufficient_data`.

Base confidence on `sample_size`, `source_quality`, `prompt_diversity`, `persona_diversity`, `engine_diversity`, `citation_support`, `answer_context_clarity`, `entity_resolution_confidence`, and `market_region_confidence`.

- `high`: repeated observations, diverse prompts/personas/engines, clear answer context, resolved entity, and supporting independent sources.
- `medium`: usable but limited observations or partial source/context support.
- `low`: thin samples, weak context, unresolved market/entity questions, or mostly official/self-claimed evidence.
- `insufficient_data`: missing or too sparse observations for a responsible metric or tier decision.

## Benchmark Calculations

Use these formulas only when required observations exist:

- `AI Visibility`: `mentioned_prompts / total_prompts`, segmented by persona, prompt topic, and engine.
- `Share of Voice`: `brand_mentions / all_brand_mentions`; `rank_weighted_sov` only when `recommendation_rank` exists; mark inferred values `estimated`.
- `Recommendation Rank`: average rank only across prompts where the competitor appeared. Keep non-appearance separate. Also report first-place rate and Top 3 rate when rank data exists.
- `Prompt Coverage`: `appeared_prompt_topics / total_prompt_topics`; list where each competitor appears and does not appear.
- `Citation Strength`: evaluate authority, relevance, independence, freshness, and buyer usefulness. Do not use URL count as strength.

## Threat Level

Use `High`, `Medium`, `Low`, `Watch`, or `Not Comparable`.

Score these axes:

- `same_buyer_context`
- `higher_recommendation_rank`
- `repeated_visibility`
- `prompt_topic_overlap`
- `persona_overlap`
- `source_authority_advantage`
- `domestic_market_relevance`
- `purchase_substitution_risk`
- `client_absence_where_competitor_present`
- `evidence_confidence`

Rules:

- `High`: Only when there is Direct-equivalent evidence or strong Substitute evidence, plus meaningful observed visibility/rank/source support.
- `Medium`: Meaningful overlap or substitution risk, but evidence, sample, or market fit is incomplete.
- `Low`: Mentioned but weakly overlapping, low visibility, weak context, or low domestic substitution risk.
- `Watch`: Early signal, aspirational reference, or low-confidence pattern worth monitoring.
- `Not Comparable`: Reference service, overseas aspirational tool, unrelated category, or insufficient buyer/use-case overlap.

Aspirational competitors are usually `Watch` or `Not Comparable`. Do not assign `High` to overseas references without domestic purchase substitution evidence. Do not assert threat level from insufficient samples.

## Advantage And Gap Labels

Extract competitor advantages using:

- `stronger_category_association`
- `clearer_positioning`
- `more_third_party_sources`
- `stronger_comparison_presence`
- `better_case_study_visibility`
- `clearer_pricing_or_plan`
- `stronger_review_presence`
- `more_specific_use_cases`
- `better_page_structure`
- `more_frequent_mentions`
- `higher_recommendation_rank`
- `stronger_source_authority`

Classify opportunities as `content_gap`, `citation_gap`, `positioning_gap`, `persona_gap`, `prompt_topic_gap`, `category_gap`, `proof_gap`, `comparison_page_gap`, `case_study_gap`, or `technical_visibility_gap`.

## Counter-Move Priority

Prioritize counter-moves by `impact`, `evidence_strength`, `ease_of_execution`, `risk`, `dependency`, `time_to_learn`, and `confidence`.

- `P0`: Important, evidence-backed, and should be tested soon.
- `P1`: Important, but needs additional confirmation before execution.
- `P2`: Worth addressing over the medium term.
- `P3`: Reference or backlog item.
- `Do Not Recommend`: Evidence is too weak, risk is high, or it is not safe for client presentation.

