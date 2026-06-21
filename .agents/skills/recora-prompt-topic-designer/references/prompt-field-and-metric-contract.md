# Prompt Field And Metric Contract

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
