# Topic Taxonomy and Prompt Mapping

Use this reference when Recora prompt design must start from diagnosis topics instead of jumping straight to a prompt list.

## Topic First Rule

- Prompts must be derived from topics.
- Do not mass-produce prompts before defining diagnosis topics.
- Every prompt must map to at least one `topic_id`.
- Every topic must include `expected_signal` and `metric_target`.
- Check coverage at the topic level before checking individual prompt quality.
- Topic design should clarify what Recora is trying to observe: visibility, ranking, sentiment, citation behavior, risk framing, buyer-stage behavior, persona language, or local/regulated behavior.
- Keep Recora metric rules intact: branded topics and branded prompts are excluded from AI Visibility Rate and AI Ranking, and are used for sentiment / brand perception only.
- Do not claim AI visibility, ranking, citation, recommendation, trust, or sentiment before measurement.

## Output Order

Use this order for substantial prompt-set design:

1. Topic Set
2. Topic Coverage Matrix
3. Topic-to-Prompt Mapping
4. Prompt List
5. Prompt Quality Gate
6. Bias Audit
7. Measurement Readiness

## Topic Types

Use these `topic_type` values:

- `market_discovery_topic`
- `problem_solution_topic`
- `category_discovery_topic`
- `competitor_comparison_topic`
- `alternative_search_topic`
- `pricing_reputation_topic`
- `citation_evidence_topic`
- `branded_sentiment_topic`
- `persona_specific_topic`
- `local_regional_topic`
- `regulated_risk_topic`

## Topic Set Schema

```md
## Topic Set

- topic_id:
- topic_name:
- topic_type:
- diagnosis_goal:
- target_persona:
- buyer_stage:
- metric_target:
  - visibility_rate:
  - ranking:
  - sentiment:
  - citation_check:
  - risk_check:
- brand_mention_policy:
- expected_signal:
- minimum_prompt_count:
- risk_or_bias:
- handoff_skill:
```

## Metric Target Guidance

- `visibility_rate`: use non-branded, problem, alternative, category, local, or competitor topics with `brand_mention_policy: brand_excluded`, but only mapped prompts with `candidate_mention_opportunity: direct` or `likely` are visibility eligible.
- `ranking`: use category discovery, vendor shortlist, alternative search, local/regional comparison, and competitor comparison topics with `brand_mention_policy: brand_excluded`, but only mapped prompts with `ranking_opportunity: direct` or `comparable_set` are ranking eligible.
- `sentiment`: use branded sentiment topics only; exclude these topics from visibility and ranking.
- `citation_check`: use citation/evidence topics to observe source types, cited URLs, evidence quality, and source-to-claim fit.
- `risk_check`: use regulated, pricing/reputation, review-risk, safety, legal/financial caution, or hallucination-risk topics.

Do not treat all prompts under a visibility/ranking topic as metric eligible. A topic can contain criteria, safety, or citation prompts that support diagnosis but are excluded from visibility/ranking denominators.

## Brand Mention Policy

Use these values:

- `brand_excluded`: topic should generate prompts without the client brand; eligible for visibility/ranking when other conditions fit.
- `brand_included`: topic is explicitly about the client brand; sentiment or brand validation only.
- `brand_optional`: topic can be tested with and without the brand, but metric eligibility must be split per prompt.
- `competitor_only`: topic is about named or category competitors without the client brand.

If `brand_mention_policy: brand_included`, set:

```md
metric_target:
  visibility_rate: excluded
  ranking: excluded
  sentiment: eligible
```

## Topic-to-Prompt Mapping

```md
## Topic-to-Prompt Mapping

- topic_id:
- topic_name:
- prompt_ids:
- prompt_count:
- prompt_language_modes:
- response_shapes:
- candidate_mention_opportunity_summary:
- ranking_opportunity_summary:
- metric_eligibility_summary:
- coverage_status:
- missing_prompt_type:
- revision_needed:
```

Coverage status values:

- `covered`: topic has enough prompts for its minimum count and metric target.
- `undercovered`: topic has too few prompts, too few personas, too few language modes, or missing buyer stages.
- `overcovered`: topic has too many near-duplicate prompts compared with other required topics.
- `mismatched`: prompt labels, metric eligibility, or brand mention rules conflict with the topic.
- `rejected`: topic should not be used because it is unsafe, unsupported, or not diagnostic.

## Topic Coverage Matrix

```md
## Topic Coverage Matrix

- required_topics:
- covered_topics:
- undercovered_topics:
- overcovered_topics:
- missing_metric_target:
- missing_persona_angle:
- missing_buyer_stage:
- missing_language_mode:
- topic_balance_note:
```

## Topic Quality Gate

Use one gate decision per topic:

- `topic_ready`: topic has clear diagnostic purpose, metric target, expected signal, persona/stage fit, and enough mapped prompts.
- `topic_needs_more_prompts`: topic is useful but below `minimum_prompt_count` or lacks required prompt variants.
- `topic_needs_persona_refinement`: target persona is too generic, not industry-realistic, or lacks realistic language modes.
- `topic_too_broad`: topic combines too many diagnostic goals, stages, personas, or metric targets.
- `topic_too_narrow`: topic is only one prompt idea, one keyword, one brand claim, or one unsupported assumption.
- `topic_metric_mismatch`: metric target conflicts with brand mention policy, category, or prompt eligibility.
- `topic_reject`: topic is unsafe, unsupported, non-diagnostic, or would create pre-measurement claims.

## Topic Quality Checks

- `topic_id` is stable and unique.
- `topic_name` names a buyer problem, category, comparison, evidence, local, persona, branded sentiment, or risk area.
- `topic_type` uses the allowed values.
- `diagnosis_goal` says what Recora wants to observe, not what the brand wants to prove.
- `target_persona` is specific enough for the industry and business model.
- `buyer_stage` matches the topic's decision moment.
- `metric_target` is present and does not mix branded sentiment into visibility/ranking.
- `expected_signal` is observable from AI answer text, mentioned entities, ranking/order, citations, or risk language.
- `minimum_prompt_count` is enough to avoid one-prompt topics.
- `handoff_skill` is set when citation, competitor, persona, recommendation, or schema follow-up is likely.

## Prompt Mapping Rules

- A prompt can map to more than one topic only when it genuinely measures both; avoid using one prompt to fill unrelated coverage gaps.
- A prompt mapped to a `branded_sentiment_topic` must have `brand_mention_rule: brand_included` and visibility/ranking excluded.
- A prompt mapped to visibility/ranking topics should usually have `brand_mention_rule: brand_excluded`.
- A prompt mapped to a visibility topic is visibility eligible only when it also has `candidate_mention_opportunity: direct` or `likely`.
- A prompt mapped to a ranking topic is ranking eligible only when it also has `ranking_opportunity: direct` or `comparable_set`.
- Prompts with `response_shape: evaluation_criteria`, `explanatory_answer`, `evidence_answer`, or `branded_sentiment_answer` should not count toward visibility/ranking even when they support the same topic.
- A `citation_evidence_topic` must have at least one prompt that can produce source/citation behavior for downstream analysis.
- A `regulated_risk_topic` must avoid diagnosis, treatment, legal judgment, investment advice, guaranteed outcomes, cure claims, and unsupported safety/performance claims.
- A BtoC, local, or clinic topic should include at least one realistic `language_mode` such as `raw_search_like`, `anxious_user`, or `comparison_shortcut` when appropriate.

## Failure Patterns

| failure | detection | repair |
|---|---|---|
| prompt_first_design | Prompt list exists but topics are vague or missing. | Define topics first, then remap prompts to `topic_id`. |
| orphan_prompt | Prompt has no `topic_id`. | Attach it to a real topic or remove it. |
| orphan_topic | Topic has no prompts. | Add prompts or remove the topic from the measurement set. |
| topic_metric_mismatch | Branded topic targets visibility/ranking, or non-branded topic targets sentiment without brand context. | Fix `metric_target` and prompt eligibility. |
| prompt_metric_derivation_mismatch | Prompt metric eligibility conflicts with `response_shape`, `candidate_mention_opportunity`, or `ranking_opportunity`. | Re-derive metric eligibility; exclude criteria/evidence/sentiment prompts or rewrite them into candidate-list/comparable-set prompts. |
| topic_overfragmentation | Many topics differ only by wording. | Merge topics and vary prompts within the topic. |
| topic_undercoverage | Topic has fewer prompts than `minimum_prompt_count`. | Add prompt variants by persona, buyer stage, language mode, or metric target. |
| weak_topic_signal | `expected_signal` is not observable. | Rewrite expected signal into mention, rank/order, citation, comparison, sentiment, or risk-language signals. |

## Mini Example: BtoC / Clinic Topic Mapping

```md
## Topic Set

- topic_id: TOPIC-CLINIC-LOCAL-001
- topic_name: 東京の美容クリニック選びで、料金・口コミ・安全性がAI回答でどう扱われるか
- topic_type: local_regional_topic
- diagnosis_goal: Observe local clinic discovery, price/review framing, safety language, and whether AI avoids unsupported medical claims.
- target_persona: 初めて美容医療を検討する人, 料金重視の人, 口コミを確認したい人
- buyer_stage: exploration, comparison, validation
- metric_target:
  - visibility_rate: eligible
  - ranking: eligible
  - sentiment: excluded
  - citation_check: optional
  - risk_check: eligible
- brand_mention_policy: brand_excluded
- expected_signal: Observe whether AI mentions local clinic options or categories, which price/review/safety axes appear, and whether risk or consultation wording is cautious.
- minimum_prompt_count: 3
- risk_or_bias: Reviews and price may be stale or unsupported; avoid treatment recommendations and safety guarantees.
- handoff_skill: recora-competitor-benchmark

## Topic-to-Prompt Mapping

- topic_id: TOPIC-CLINIC-LOCAL-001
- topic_name: 東京の美容クリニック選びで、料金・口コミ・安全性がAI回答でどう扱われるか
- prompt_ids: PTD-CLINIC-TOKYO-001, PTD-CLINIC-TOKYO-002, PTD-CLINIC-TOKYO-003
- prompt_count: 3
- prompt_language_modes: natural_conversation, raw_search_like, anxious_user
- metric_eligibility_summary: visibility_rate eligible 3, ranking eligible 3, sentiment excluded 3
- coverage_status: covered
- missing_prompt_type: none
- revision_needed: no
```

Prompts:

```md
- id: PTD-CLINIC-TOKYO-001
  topic_id: TOPIC-CLINIC-LOCAL-001
  prompt: 東京で美容クリニックを選ぶとき料金と口コミはどう比較すべき？
  language_mode: natural_conversation

- id: PTD-CLINIC-TOKYO-002
  topic_id: TOPIC-CLINIC-LOCAL-001
  raw_user_intent: 美容クリニック 口コミ悪い 避けたい
  prompt: 美容クリニックの口コミを見るとき、参考になる内容と慎重に扱うべき内容はどう分けられますか？
  language_mode: anxious_user

- id: PTD-CLINIC-TOKYO-003
  topic_id: TOPIC-CLINIC-LOCAL-001
  prompt: 東京で肌治療の相談先を探すとき、料金・医師情報・リスク説明は何を確認すべき？
  language_mode: raw_search_like
```
