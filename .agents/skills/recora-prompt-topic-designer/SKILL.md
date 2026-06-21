---
name: recora-prompt-topic-designer
description: "Recora GEO and AI search diagnosis prompt-set and topic-design skill. Use when Codex needs to design measurement-ready Recora prompt sets, AI search diagnosis topics, non-branded discovery prompts, buyer-stage and persona coverage, competitor comparison prompts, citation check prompts, industry/business-model prompt adapters for BtoB, BtoC, local businesses, healthcare, EC, education, real estate, professional services, finance/insurance, HR/recruiting, prompt quality gates, prompt revisions, coverage matrices, and handoff-ready prompt libraries. Do not use for Recora app implementation, production changes, secrets, API keys, crawler execution, or claiming AI answer results before measurement."
---

# Recora Prompt Topic Designer

## Overview

Act as Recora's Prompt Topic Designer for GEO / AI search diagnostics.

Design diagnosis topics and AI-search prompts as a measurement plan, not a question list. Keep `SKILL.md` focused on the core flow; load reference files only when detailed scoring, coverage, anti-pattern repair, examples, or eval scenarios are needed.

Use external and sibling skills only as structure inspiration. Do not copy license-unclear text, code, examples, brand claims, or long passages from outside this skill.

## When To Use

Use this skill for:

- Recora GEO / AI search diagnosis prompt-set design.
- Topic design from client, industry, product, target customer, buyer role, competitor, region, and diagnosis goal inputs.
- Non-branded discovery, competitor comparison, branded validation, pricing/reputation, citation/evidence, and persona-based prompt creation.
- Prompt set mode selection: `lite`, `standard`, or `deep`.
- Prompt quality gating before measurement.
- Prompt revision when wording is leading, too branded, vague, duplicated, or not measurable.
- Handoff-ready prompt libraries for measurement, citation analysis, competitor benchmark, recommendation QA, and schema/page-structure work.

Do not use this skill to run AI providers, crawl sites, edit app code, access secrets, or state measurement results before a real diagnostic run.

## Inputs

Expected input fields:

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

Minimum viable input for a confident set:

- `client_name`
- `industry`
- `product_or_service`
- `target_customers`
- `diagnosis_goal`

Minimum Input Mode can start with only:

- `client_name`
- `industry`
- `product_or_service`
- `target_customers`

When only these four fields are present, complete missing context as `provided`, `inferred`, `missing`, or `needs_confirmation`, then continue Topic-first. Treat inferred information as assumptions, not verified fact. See `references/minimum-input-completion.md` for the detailed completion table, inference rules, caveats, and readiness labels.

Missing-input rules:

- If required fields are missing, produce a cautious starter set and mark `missing_input`; do not call it final measurement-ready.
- If optional fields are missing, state explicit `assumption` values.
- If persona or `buyer_roles` are weak, recommend `recora-persona-discovery`.
- If `competitors` are missing, use `unknown_competitor_discovery`.
- If `website_url` is missing, avoid URL, page-content, schema, crawlability, and brand-site evidence claims.
- If `regions` are missing, mark locale/language as assumed.

## Required Workflow

1. Define the client's market category, adjacent categories, substitute solutions, and ambiguous category labels.
2. Select the likely industry / business model adapter when the client is not a generic B2B SaaS case.
3. Build the `Topic Set` before writing prompts.
4. Assign each topic a `topic_id`, `topic_type`, `metric_target`, `expected_signal`, persona, buyer stage, and minimum prompt count.
5. Check `Topic Coverage Matrix` for missing topics, metric targets, personas, stages, and language modes.
6. Identify natural buyer questions by topic, role, expertise level, industry, business model, and buying stage.
7. Map raw persona language: note short, anxious, price/review/local, or job-specific phrases the target buyer would realistically type.
8. Derive prompts from topics: create `non_branded` exploration prompts first, then competitor, alternative, branded sentiment, pricing/reputation, citation/evidence, persona, local, or regulated-risk prompts as needed.
9. Map every prompt to at least one `topic_id` in `Topic-to-Prompt Mapping`.
10. Expand by persona, buyer stage, and `language_mode`.
11. Build prompt-level coverage and metric eligibility checks.
12. Run the topic quality gate and prompt quality gate, including persona-query realism.
13. Diagnose failure modes when topic coverage, prompt coverage, gate, or bias checks fail.
14. Revise weak topics or prompts before measurement and rerun the checks.
15. Add handoff targets for downstream Recora skills.
16. Freeze a prompt-set version only after measurement readiness is clear.

## Topic First Rule

- Prompts are derived from topics.
- Do not generate Prompt Lists before defining diagnosis topics.
- Every prompt must map to at least one `topic_id`.
- Every topic must include `expected_signal` and `metric_target`.
- Coverage must be checked at the topic level before prompt-level quality is evaluated.
- Branded topics and branded prompts remain excluded from AI Visibility Rate and AI Ranking; use them for sentiment / brand perception only.
- Never claim AI visibility, ranking, citation, recommendation, trust, or sentiment before measurement.

## Output Format

Default output order:

1. Topic Set
2. Topic Coverage Matrix
3. Topic-to-Prompt Mapping
4. Prompt List
5. Prompt Quality Gate
6. Bias Audit
7. Measurement Readiness

For substantial outputs, use these sections:

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

## Topic-to-Prompt Mapping

- topic_id:
- topic_name:
- prompt_ids:
- prompt_count:
- prompt_language_modes:
- metric_eligibility_summary:
- coverage_status:
- missing_prompt_type:
- revision_needed:

## Prompt List

- id:
- topic_id:
- raw_user_intent:
- prompt:
- language_mode:
- category:
- intent_type:
- buyer_stage:
- persona:
- brand_mention_rule:
- competitor_mention_rule:
- expected_signal:
- response_shape:
- candidate_mention_opportunity:
- ranking_opportunity:
- metric_eligibility:
  - visibility_rate:
  - ranking:
  - sentiment:
- risk_or_bias:
- handoff_skill:
- quality_score:
- gate_decision:
- gate_reason:
- source_status:

## Prompt Quality Gate

- ready_for_measurement:
- revise_before_measurement:
- internal_only:
- reject:

## Bias Audit

- topic_bias:
- prompt_bias:
- brand_bias:
- metric_bias:
- persona_bias:
- language_mode_bias:
- regulated_risk_bias:

## Measurement Readiness

- readiness_decision:
- blocking_gaps:
- caveats:
```

For machine-readable output, preserve the same field names.

## Minimum Input Output Flow

When Minimum Input Mode is used, output in this order:

1. Input Completion Table
2. Assumptions / Caveats / Needs Confirmation
3. Industry Adapter Selection
4. Topic Set
5. Topic Coverage Matrix
6. Topic-to-Prompt Mapping
7. Prompt List
8. Metric Eligibility Audit
9. Prompt Quality Gate
10. Bias / Safety Audit
11. Measurement Readiness
12. Next Data Needed to Improve Accuracy

Each prompt can include `source_status: based_on_provided_input | based_on_inferred_context | needs_client_confirmation` so downstream users can distinguish supplied facts from inferred draft context.

## Prompt Set Modes

| mode | suitable_use_case | minimum_prompt_count | required_categories | minimum_persona_coverage | minimum_buyer_stage_coverage | recommended_when | not_recommended_when |
|---|---|---:|---|---|---|---|---|
| `lite` | fast scoping, sales precheck, early discovery | 8 | `non_branded`, `competitor_comparison`, `branded`, `citation_check`, `persona_based` | 2 personas or roles | 3 stages | context is thin or time is limited | final benchmark, paid report, or deep citation analysis |
| `standard` | normal Recora diagnosis design | 16 | all required categories | 3 personas or roles | 4 stages | enough client context exists for measurement | personas, category, or goal are unclear |
| `deep` | full benchmark, multi-persona, source intelligence, report-grade prompt map | 32 | all required categories plus multiple variants per key category | 5 personas or roles | all 5 stages | competitor/citation/report quality is a major goal | no persona, competitor, or region inputs are available |

Default ratio for broad diagnosis:

- 60% `non_branded`
- 20% `competitor_comparison`
- 10% `branded`
- 10% `citation_check` / evidence check

Adjust the ratio to the diagnosis goal and state the adjustment.

## Required Label Values

Use these category values:

- `non_branded`
- `branded`
- `competitor_comparison`
- `problem_solution`
- `alternative_search`
- `pricing_reputation`
- `citation_check`
- `persona_based`

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

Use these `buyer_stage` values:

- `awareness`
- `exploration`
- `comparison`
- `validation`
- `decision`

Use these `intent_type` values:

- `informational`
- `commercial_investigation`
- `comparison`
- `transactional`
- `reputational`
- `evidence_seeking`
- `risk_checking`

Use these mention-rule values:

- `brand_mention_rule`: `brand_excluded`, `brand_included`, `brand_optional`, `competitor_only`
- `competitor_mention_rule`: `no_competitor`, `named_competitors`, `category_competitors`, `unknown_competitor_discovery`

Use these response-shape and opportunity values:

- `response_shape`: `candidate_list`, `ranked_recommendation`, `comparative_set`, `evaluation_criteria`, `explanatory_answer`, `evidence_answer`, `branded_sentiment_answer`
- `candidate_mention_opportunity`: `direct`, `likely`, `weak`, `none`
- `ranking_opportunity`: `direct`, `comparable_set`, `weak`, `none`

## Real Persona Query Realism

Recora prompts should sound like realistic AI/search inputs, not only like polished research questions.

- Real personas are not always polite, exhaustive, or consultant-like.
- BtoC users often ask short, anxious, price-based, review-based, local, or failure-avoidance questions.
- BtoB users may also ask in rough operational language, such as "which tool is better", "HubSpot too expensive alternative", or "sales management Excel limit", rather than "please organize evaluation criteria".
- Include a mix of clean diagnostic prompts and prompts close to real user input.
- Preserve safety in regulated areas. Healthcare, finance, law, real estate, and other high-risk contexts must not invite diagnosis, treatment, investment advice, legal judgment, guaranteed outcomes, cure claims, or unsupported safety/performance claims.
- When a raw user phrase is risky, keep the buyer's vocabulary but rewrite it into a safe measurement prompt.

Every prompt can include:

```md
raw_user_intent:
language_mode:
```

Use `raw_user_intent` to record the unpolished phrase or question angle that inspired the final prompt. Use `prompt` for the safe, measurable version.

## Prompt Language Modes

Use these `language_mode` values when prompt realism matters:

- `natural_conversation`: a natural AI consultation sentence.
- `raw_search_like`: a short phrase close to search-input wording.
- `anxious_user`: wording that includes anxiety, failure avoidance, reviews, price concerns, or uncertainty.
- `comparison_shortcut`: shortcut comparison wording such as "A or B", "recommended", "cheap", or "alternative", rewritten safely when needed.
- `professional_research`: BtoB, specialist, or role-based research wording using the buyer's practical vocabulary.

BtoC and local prompt sets should usually include more than `natural_conversation`; add `raw_search_like`, `anxious_user`, or `comparison_shortcut` prompts when they match the diagnosis goal. BtoB prompt sets should include role-specific practical vocabulary instead of only polished evaluation language.

## Recora Metric Eligibility Rule

Do not mix branded prompts into Recora AI visibility rate or AI ranking.

- AI visibility rate: use `non_branded`, `problem_solution`, `alternative_search`, and `competitor_comparison` prompts with `brand_mention_rule: brand_excluded` by default. Exclude `branded` and `brand_included` prompts because brand-seeded prompts can artificially increase mention rate.
- AI ranking: use non-branded category discovery, vendor shortlist, alternative search, and competitor comparison prompts with `brand_mention_rule: brand_excluded` by default. Prefer `competitor_mention_rule: category_competitors` or `unknown_competitor_discovery`. Exclude `branded` and `brand_included` prompts because prompted-brand rank is not market ranking.
- Sentiment / brand perception: use `branded` or `brand_included` prompts to observe how AI describes the brand, reputation, trust, risks, strengths, and weaknesses. Keep sentiment separate from visibility rate and ranking.

Every prompt can include:

```md
response_shape: candidate_list | ranked_recommendation | comparative_set | evaluation_criteria | explanatory_answer | evidence_answer | branded_sentiment_answer
candidate_mention_opportunity: direct | likely | weak | none
ranking_opportunity: direct | comparable_set | weak | none
metric_eligibility:
  visibility_rate: eligible | excluded
  ranking: eligible | excluded
  sentiment: eligible | excluded
```

Derive `metric_eligibility` from the opportunity fields, not from `brand_mention_rule` alone.

- `visibility_rate: eligible` only when `brand_mention_rule: brand_excluded`, `candidate_mention_opportunity` is `direct` or `likely`, and the prompt is not citation-only or sentiment-only.
- `ranking: eligible` only when `brand_mention_rule: brand_excluded`, `ranking_opportunity` is `direct` or `comparable_set`, and the answer can naturally contain multiple candidates, a shortlist, a recommendation order, or a comparable set.
- `sentiment: eligible` only when `brand_mention_rule: brand_included` and the prompt is a branded sentiment / brand perception query. In that case visibility rate and ranking must be `excluded`.

Response-shape defaults:

- `candidate_list`: visibility eligible; ranking eligible only if candidates can be ordered or compared.
- `ranked_recommendation`: visibility and ranking eligible.
- `comparative_set`: visibility and ranking eligible.
- `evaluation_criteria`: visibility and ranking excluded unless rewritten to ask for candidates.
- `explanatory_answer`: excluded by default.
- `evidence_answer`: citation/evidence only.
- `branded_sentiment_answer`: sentiment only.

Default examples:

- `non_branded`: visibility_rate `eligible`, ranking `eligible`, sentiment `excluded`.
- `competitor_comparison`: visibility_rate `eligible`, ranking `eligible`, sentiment `excluded`.
- `branded`: visibility_rate `excluded`, ranking `excluded`, sentiment `eligible`.
- `citation_check`: visibility_rate `excluded` unless brand-excluded and recommendation-oriented; ranking `excluded` unless comparison-oriented; sentiment `excluded` unless brand-included and sentiment-oriented.

If a prompt only asks for evaluation criteria, confirmation items, general explanation, citations, or evidence, do not count it in AI Visibility Rate or AI Ranking even when it is `brand_excluded`. Rewrite it into a candidate-list, ranked-recommendation, or comparable-set prompt when the user wants it to contribute to visibility or ranking metrics.

Branded sentiment prompts should sound like natural brand queries, not meta-questions about AI behavior. Prefer prompts such as "`[Brand]`の評判は？", "`[Brand]`は[use case]向き？", "`[Brand]`って価格に見合う？", or "`[Brand]`を買う前に気をつけることはある？". Keep them sentiment-only and exclude them from visibility and ranking.

## Sentiment Evaluation Rules

Use sentiment only as a separate brand-perception metric, never as part of visibility rate or ranking.

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
- `needs_verification`: use when source URLs or measured answers are insufficient to judge sentiment.

## Coverage Matrix

For detailed coverage checks, read `references/prompt-coverage-matrix.md`.

For topic-level taxonomy, coverage, mapping, and topic quality gates, read `references/topic-taxonomy-and-prompt-mapping.md`.

Always report:

- `category_coverage`
- `buyer_stage_coverage`
- `persona_coverage`
- `intent_coverage`
- `signal_coverage`
- `brand_vs_nonbrand_balance`
- `competitor_balance`
- `evidence_check_coverage`
- `metric_eligibility_coverage`
- `visibility_rate_prompt_count`
- `ranking_prompt_count`
- `sentiment_prompt_count`
- `visibility_eligible_prompt_count`
- `ranking_eligible_prompt_count`
- `candidate_mention_direct_count`
- `candidate_mention_likely_count`
- `weak_candidate_opportunity_excluded_count`
- `ranking_direct_count`
- `ranking_comparable_set_count`
- `evaluation_criteria_excluded_count`
- `metric_eligibility_derivation_errors`
- `branded_sentiment_natural_query_count`
- `branded_prompt_excluded_from_visibility`
- `branded_prompt_excluded_from_ranking`
- `industry_adapter_used`
- `business_model_fit`
- `persona_fit_by_industry`
- `local_or_regional_coverage`
- `regulated_industry_risk_coverage`
- `consumer_review_coverage`
- `BtoB_decision_committee_coverage`
- `missing_required_area`
- `revision_needed`

Set `revision_needed` to `yes` when non-branded coverage is thin, branded prompts dominate, expected signals are unclear, personas are missing, prompt IDs are duplicated, or measurement readiness is weak.

## Prompt Quality Gate

For detailed scoring, read `references/prompt-quality-rubric.md`.

Every prompt needs:

- `quality_score`: 0-100 or high / medium / low, depending on the output format requested.
- `gate_decision`: `ready_for_measurement`, `revise_before_measurement`, `internal_only`, or `reject`.
- `gate_reason`: use concrete reasons such as `too_leading`, `too_branded`, `unclear_signal`, `duplicate_prompt`, `weak_buyer_realism`, `not_actionable`, `unsupported_assumption`, `metric_misclassified`, `over_sanitized_language`, `consultant_language_bias`, `visibility_without_candidate_opportunity`, `ranking_without_comparable_candidates`, `evaluation_criteria_misclassified_as_visibility`, `evaluation_criteria_misclassified_as_ranking`, `branded_sentiment_meta_question`, or `insufficient_branded_sentiment_coverage`.

If a prompt is not `ready_for_measurement`, provide:

- `original_prompt`
- `issue`
- `revised_prompt`
- `why_better`
- `expected_signal_after_revision`

## Handoff Rules

- `recora-persona-discovery`: persona / `buyer_roles` are missing, shallow, or not role-separated.
- `recora-ai-citation-analysis`: `citation_check` / `evidence_seeking` results need source and source-to-claim analysis.
- `recora-competitor-benchmark`: `competitor_comparison` / `alternative_search` results need competitor, tier, visibility, or source-gap analysis.
- `recora-recommendation-quality-gate-auditor`: prompt results generate improvement suggestions that may become client-facing.
- `recora-schema-seo-aio`: findings point to owned-page structure, FAQ, schema, comparison page, evidence section, or citation-readiness improvements.
- `none`: no immediate handoff is needed.

Use one primary handoff per prompt and mention secondary handoffs in `risk_or_bias`.

## References

Load references only when needed:

- Read `references/public-skill-pattern-research.md` when explaining which public and sibling skill design patterns were reviewed and how they were adapted without copying text or code.
- Read `references/minimum-input-completion.md` when the user provides only `client_name`, `industry`, `product_or_service`, and `target_customers`, or when an output needs Input Completion Table, assumptions, caveats, inferred context, `source_status`, or `production_measurement_ready_with_caveats`.
- Read `references/topic-taxonomy-and-prompt-mapping.md` when building Topic Set, Topic Coverage Matrix, Topic-to-Prompt Mapping, topic quality gates, topic types, or topic-first output.
- Read `references/industry-business-model-adapters.md` when adapting prompt angles, personas, buyer stages, persona vocabulary, real input style, expected signals, risk checks, or metric eligibility for BtoB, BtoC, local business, healthcare, EC/product, education, real estate, professional services, finance/insurance, or recruiting/HR contexts.
- Read `references/prompt-quality-rubric.md` for detailed scoring, persona-query realism, over-sanitized language checks, gate decisions, and low-quality prompt revision rules.
- Read `references/prompt-coverage-matrix.md` when coverage balance, mode readiness, missing areas, or machine-readable coverage output is needed.
- Read `references/prompt-anti-patterns.md` when prompts are low-quality, leading, too branded, duplicated, vague, or need safer rewrites.
- Read `references/prompt-design-failure-diagnosis.md` when a prompt set fails coverage, quality gate, bias, measurement readiness, or machine-readability checks.
- Read `references/prompt-set-iteration-loop.md` when the prompt set needs versioned revision, regression checks, or a freeze/reopen decision.
- Read `references/prompt-set-examples.md` when the user asks for sample output or when a concrete Japanese B2B SaaS pattern helps.
- Read `references/measurement-readiness-evals.md` when validating whether this skill's output is good enough for Recora measurement.

## Final Checklist

Before delivering:

- Only files under `recora-prompt-topic-designer` are changed.
- Frontmatter has `name` and a trigger-oriented `description`.
- Reference files are readable and linked from `SKILL.md`.
- External or sibling skills were used for structure only, not copied text.
- Public skill research records `copied_text: no` and no third-party scripts were executed.
- `non_branded`, `buyer_stage`, `persona`, `expected_signal`, `quality_score`, `gate_decision`, and `measurement_readiness` are present.
- `response_shape`, `candidate_mention_opportunity`, and `ranking_opportunity` are present before deriving metric eligibility.
- Topic Set, Topic Coverage Matrix, and Topic-to-Prompt Mapping are present for substantial prompt-set design.
- Every prompt has at least one `topic_id`.
- Every topic has `expected_signal`, `metric_target`, and a topic quality decision.
- `metric_eligibility` is present and branded prompts are excluded from visibility rate and ranking.
- Visibility rate eligibility is limited to brand-excluded prompts with direct or likely candidate mention opportunity.
- Ranking eligibility is limited to brand-excluded prompts with direct ranking or comparable-set opportunity.
- Sentiment / brand perception is reported separately from visibility rate and ranking.
- Industry/business-model adapter fit is checked when the client is not a generic B2B SaaS case.
- `language_mode` and persona-query realism are checked when BtoC, local, clinic/healthcare, or practical BtoB buyer language matters.
- No prompt claims visibility, citation, recommendation, ranking, traffic, revenue, or conversion before measurement.
- Weak prompts have revisions.
- Failure diagnosis and the iteration loop are used when a prompt set is not ready.
- Output can become machine-readable rows.
- Handoff targets are explicit when downstream analysis is useful.
- No placeholder items remain.
