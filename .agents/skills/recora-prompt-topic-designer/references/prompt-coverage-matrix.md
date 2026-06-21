# Prompt Coverage Matrix

Use this reference when checking whether a Recora prompt set is balanced, machine-readable, and ready for measurement.

For topic-first design, check `topic-taxonomy-and-prompt-mapping.md` before using this prompt-level matrix. Prompt coverage should validate the prompts derived from topics, not replace topic design.

Substantial outputs should follow this order: Topic Set, Topic Coverage Matrix, Topic-to-Prompt Mapping, Prompt List, Prompt Quality Gate, Bias Audit, Measurement Readiness.

## Required Coverage Fields

```md
## Coverage Matrix

- category_coverage:
- buyer_stage_coverage:
- persona_coverage:
- intent_coverage:
- signal_coverage:
- brand_vs_nonbrand_balance:
- competitor_balance:
- evidence_check_coverage:
- metric_eligibility_coverage:
- visibility_rate_prompt_count:
- ranking_prompt_count:
- sentiment_prompt_count:
- branded_prompt_excluded_from_visibility:
- branded_prompt_excluded_from_ranking:
- industry_adapter_used:
- business_model_fit:
- persona_fit_by_industry:
- local_or_regional_coverage:
- regulated_industry_risk_coverage:
- consumer_review_coverage:
- BtoB_decision_committee_coverage:
- missing_required_area:
- revision_needed:
```

## Field Guidance

- `category_coverage`: counts and gaps for `non_branded`, `branded`, `competitor_comparison`, `problem_solution`, `alternative_search`, `pricing_reputation`, `citation_check`, and `persona_based`.
- `buyer_stage_coverage`: coverage for `awareness`, `exploration`, `comparison`, `validation`, and `decision`.
- `persona_coverage`: personas or roles covered, including assumed personas and missing buyer roles.
- `intent_coverage`: coverage for `informational`, `commercial_investigation`, `comparison`, `transactional`, `reputational`, `evidence_seeking`, and `risk_checking`.
- `signal_coverage`: whether expected signals cover brand mention, competitor mention, citation/source, recommendation/order, comparison axes, pricing/reputation, and risk.
- `brand_vs_nonbrand_balance`: count `brand_excluded`, `brand_included`, `brand_optional`, and `competitor_only`.
- `competitor_balance`: count `no_competitor`, `named_competitors`, `category_competitors`, and `unknown_competitor_discovery`.
- `evidence_check_coverage`: whether `citation_check` and `evidence_seeking` prompts exist.
- `metric_eligibility_coverage`: whether every prompt has visibility/ranking/sentiment eligibility values.
- `visibility_rate_prompt_count`: count prompts eligible for AI Visibility Rate.
- `ranking_prompt_count`: count prompts eligible for AI Ranking.
- `sentiment_prompt_count`: count prompts eligible for sentiment / brand perception.
- `branded_prompt_excluded_from_visibility`: `yes` only when all `branded` and `brand_included` prompts are excluded from visibility rate.
- `branded_prompt_excluded_from_ranking`: `yes` only when all `branded` and `brand_included` prompts are excluded from ranking.
- `industry_adapter_used`: the selected adapter from `industry-business-model-adapters.md`, or `none` when no industry adaptation is needed.
- `business_model_fit`: whether prompt families match BtoB, BtoC, local, regulated, product, service, marketplace, or hybrid business logic.
- `persona_fit_by_industry`: whether personas match the industry's real decision roles rather than reusing a generic B2B SaaS committee.
- `local_or_regional_coverage`: whether local area, service area, opening hours, access, availability, and nearby alternatives are covered when relevant.
- `regulated_industry_risk_coverage`: whether healthcare, finance, insurance, legal, real estate, and similar high-risk prompts avoid diagnosis/advice/guarantees and include source/risk checks.
- `consumer_review_coverage`: whether reviews, price sensitivity, convenience, quality, and reputation are covered for B2C, local, EC, education, and consumer services.
- `BtoB_decision_committee_coverage`: whether executive buyer, department owner, evaluator, practitioner, security/procurement, or operations roles are covered when relevant.
- `missing_required_area`: list missing categories, stages, personas, intents, or signals.
- `revision_needed`: `yes` or `no`, with reason.

## Metric Eligibility Rules

Use these rules when deciding whether a prompt can be used in Recora metrics.

| metric | eligible prompt types | required conditions | excluded prompts | reason |
|---|---|---|---|---|
| `visibility_rate` | `non_branded`, `problem_solution`, `alternative_search`, `competitor_comparison` | Use `brand_mention_rule: brand_excluded` by default. | `branded`, `brand_mention_rule: brand_included` | Brand-seeded prompts can artificially raise mention rate. |
| `ranking` | `non_branded`, `alternative_search`, `competitor_comparison`, category discovery, vendor shortlist | Use `brand_mention_rule: brand_excluded`; prefer `category_competitors` or `unknown_competitor_discovery`. | `branded`, `brand_mention_rule: brand_included` | Prompted-brand rank is not market ranking. |
| `sentiment` | `branded`, brand perception, reputation, risk, trust, strengths/weakness prompts | Use `brand_mention_rule: brand_included` when evaluating how AI describes the brand. | Non-branded discovery prompts unless they intentionally ask about brand perception after measurement. | Sentiment is a separate brand perception metric. |

Default prompt-level mapping:

```md
metric_eligibility:
  visibility_rate: eligible | excluded
  ranking: eligible | excluded
  sentiment: eligible | excluded
```

- `non_branded`: visibility_rate `eligible`, ranking `eligible`, sentiment `excluded`.
- `competitor_comparison`: visibility_rate `eligible`, ranking `eligible`, sentiment `excluded`.
- `branded`: visibility_rate `excluded`, ranking `excluded`, sentiment `eligible`.
- `citation_check`: visibility_rate `excluded` unless brand-excluded and recommendation-oriented; ranking `excluded` unless comparison-oriented; sentiment `excluded` unless brand-included and sentiment-oriented.

Report-level rule:

- Do not mix AI Visibility Rate, AI Ranking, and Sentiment into one score.
- Report visibility and ranking from non-branded / brand-excluded prompts.
- Report sentiment as a separate brand perception view.
- Flag `revision_needed: yes` if a `branded` or `brand_included` prompt is eligible for visibility rate or ranking.

## Mode Minimums

| mode | minimum_prompt_count | minimum_category_coverage | minimum_buyer_stage_coverage | minimum_persona_coverage | required evidence check |
|---|---:|---|---|---|---|
| `lite` | 8 | at least `non_branded`, `competitor_comparison`, `branded`, `citation_check`, `persona_based` | 3 stages | 2 personas or roles | 1 citation/evidence prompt |
| `standard` | 16 | all required categories | 4 stages | 3 personas or roles | 2+ citation/evidence prompts |
| `deep` | 32 | all required categories with variants | all 5 stages | 5 personas or roles | citation/evidence prompts across multiple stages |

## Balance Rules

- Default broad diagnosis target: about 60% `non_branded`, 20% `competitor_comparison`, 10% `branded`, 10% `citation_check`.
- `branded` prompts should not dominate unless the diagnosis goal is explicitly branded-answer quality.
- If `competitors` are unknown, prefer `unknown_competitor_discovery` and `category_competitors`.
- If persona coverage is weak, mark `revision_needed: yes` and hand off to `recora-persona-discovery`.
- If citation/evidence coverage is missing, add at least one `citation_check` prompt or mark the prompt set not ready for source analysis.
- If the business model is B2C, local, healthcare, EC/product, education, real estate, professional services, finance/insurance, or recruiting/HR, select an industry adapter and check persona, review, local, regulated-risk, and buyer-stage fit.

## Industry Coverage Rules

Use `industry-business-model-adapters.md` to check these areas:

| business context | coverage focus | common failure |
|---|---|---|
| BtoB SaaS | decision committee, ROI, integrations, security, support, proof | treating all buyers as one generic manager |
| BtoC service | reviews, price, convenience, first-time anxiety, quality | using B2B procurement language |
| Local business | area, access, opening hours, availability, reviews, booking | missing local intent |
| Clinic / healthcare | safety, credentials, risk, consultation, source quality | medical overclaiming |
| EC / product | reviews, price, delivery, return, warranty, specs | unsupported price/review/stock claims |
| Education / school | beginner fit, curriculum, support, outcomes, price | guaranteed outcome claims |
| Real estate | area, cost, trust, contract risk, availability | stale listing or legal/financial overclaiming |
| Professional services | expertise, case studies, fees, consultation, trust | guaranteed result claims |
| Finance / insurance | fees, risk, regulation, suitability, source quality | investment/insurance advice overclaim |
| Recruiting / HR | candidate quality, hiring speed, fees, mismatch risk, compliance | unsupported hiring outcome claims |

Set `revision_needed: yes` when a prompt set applies B2B SaaS wording to a consumer, local, regulated, product, or professional-service context without adapting persona, stage, expected signal, and risk notes.

## Failure Diagnosis Hooks

Use `prompt-design-failure-diagnosis.md` when the matrix shows these gaps:

| coverage_gap | likely_failure_type | required_repair |
|---|---|---|
| `non_branded` missing or thin | `non_branded_undercoverage` | Add natural `brand_excluded` discovery prompts before branded validation. |
| `brand_included` dominates | `branded_overfit` | Reduce brand seeding and rebalance toward category, problem, and alternative prompts. |
| `branded` eligible for visibility or ranking | `branded_overfit` | Set visibility/ranking eligibility to `excluded` and use the prompt only for sentiment or brand validation. |
| business model and prompt family mismatch | `business_model_mismatch` | Select the correct industry adapter and rewrite persona, stage, and prompt families. |
| B2B committee language used for B2C/local | `b2b_template_overapplied_to_b2c` | Replace executive/evaluator language with consumer, local, review, price, and convenience angles. |
| missing local area or near-me intent | `missing_local_intent` | Add area, access, opening hours, booking, nearby alternative, and review prompts. |
| regulated claim overreach | `regulated_industry_overclaim` | Remove diagnosis/advice/guarantee wording and add source/risk/qualification checks. |
| buyer stages missing | `buyer_stage_collapse` | Add awareness, exploration, validation, and decision prompts as needed. |
| persona coverage missing or shallow | `persona_flattening` | Change wording and expected signal by role, or hand off to `recora-persona-discovery`. |
| evidence prompts missing | `citation_check_missing` | Add `citation_check` / `evidence_seeking` prompts and hand off to `recora-ai-citation-analysis`. |
| competitor mix too narrow | `competitor_overconstraint` | Mix `named_competitors`, `category_competitors`, and `unknown_competitor_discovery`. |
| signal coverage vague | `weak_expected_signal` | Rewrite `expected_signal` into observable mention, citation, comparison, recommendation, or risk signals. |
| labels or IDs inconsistent | `machine_readability_failure` | Normalize fields, allowed values, and one stable ID per prompt. |

If any hook is triggered, set `revision_needed: yes`, revise the prompt set, and rerun the matrix before freezing a version.

## Machine-readable Coverage Example

```json
{
  "category_coverage": {"non_branded": 10, "competitor_comparison": 4, "branded": 2, "citation_check": 2},
  "buyer_stage_coverage": ["awareness", "exploration", "comparison", "validation"],
  "persona_coverage": ["marketing_leader", "seo_manager", "founder"],
  "intent_coverage": ["informational", "comparison", "evidence_seeking", "reputational"],
  "signal_coverage": ["brand_mention", "competitor_mention", "citation", "recommendation", "risk"],
  "brand_vs_nonbrand_balance": {"brand_excluded": 14, "brand_included": 2},
  "competitor_balance": {"unknown_competitor_discovery": 3, "category_competitors": 3, "no_competitor": 10},
  "evidence_check_coverage": "present",
  "metric_eligibility_coverage": "present",
  "visibility_rate_prompt_count": 14,
  "ranking_prompt_count": 10,
  "sentiment_prompt_count": 2,
  "branded_prompt_excluded_from_visibility": "yes",
  "branded_prompt_excluded_from_ranking": "yes",
  "industry_adapter_used": "b2b_saas",
  "business_model_fit": "present",
  "persona_fit_by_industry": "present",
  "local_or_regional_coverage": "not_applicable",
  "regulated_industry_risk_coverage": "not_applicable",
  "consumer_review_coverage": "not_applicable",
  "BtoB_decision_committee_coverage": "present",
  "missing_required_area": [],
  "revision_needed": "no"
}
```
