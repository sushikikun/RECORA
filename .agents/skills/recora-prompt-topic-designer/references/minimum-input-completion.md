# Minimum Input Completion

Use this reference when the user provides only the minimum client context but still needs a production-quality Recora topic and prompt design draft.

## Minimum Input Mode

Start design when these four fields are present:

- `client_name`
- `industry`
- `product_or_service`
- `target_customers`

Do not stop because optional inputs are missing. Complete the missing design context as `provided`, `inferred`, `missing`, or `needs_confirmation`, then continue with Topic-first output.

Minimum Input Mode must not treat inferred context as verified fact. It creates a measurement-design draft, not a fully client-verified benchmark.

## Input Completion Table

Always output this table before the Topic Set when Minimum Input Mode is used.

```md
## Input Completion Table

- field:
- value:
- status: provided | inferred | missing | needs_confirmation
- confidence: high | medium | low
- reason:
- used_for:
- caveat:
```

Include these fields:

- `client_name`
- `website_url`
- `industry`
- `business_model`
- `product_or_service`
- `target_customers`
- `regions`
- `buyer_roles_or_personas`
- `competitors`
- `known_strengths`
- `known_risks`
- `diagnosis_goal`
- `mode`
- `regulated_industry`
- `industry_adapter`
- `raw_user_intents`

## Inference Rules

### Business Model Inference

Use the client's `industry` and `product_or_service` to infer a draft business model.

| input clue | inferred business_model |
|---|---|
| SaaS / tool / system / software | BtoB SaaS or subscription software |
| clinic / beauty / dental | local appointment-based service |
| EC / online shop / product / D2C | ecommerce / product sales |
| school / course / cram school / lesson | education service |
| professional firm / consultant / agency / production company | professional services |
| real estate / rental / sale / brokerage | real estate service |
| recruiting / staffing / HR | recruiting / HR service |

When the clue is weak, mark `business_model` as `inferred` with `confidence: low` and add it to `needs_confirmation`.

### Persona Inference

Infer practical personas from `target_customers`; do not present them as verified customer segments.

BtoB persona patterns:

- executive buyer
- department owner
- practitioner / operator
- IT or security evaluator
- procurement / approval owner

BtoC persona patterns:

- first-time user
- price-sensitive user
- review-sensitive user
- failure-avoidant user
- urgent user
- family decision helper

Local persona patterns:

- nearby searcher
- today / this-week visitor
- pre-booking checker
- review-focused user
- price-sensitive user

Clinic persona patterns:

- first-time patient or consulter
- user comparing cost and safety
- review checker
- anxious user
- user checking doctor information and risk explanation

If target customers are too broad, create at least three inferred personas and add `recora-persona-discovery` as a handoff.

### Competitor Inference

- Do not invent real competitor names.
- If `competitors` are missing, use `competitor_mention_rule: unknown_competitor_discovery` or `category_competitors`.
- Use `named_competitors` only when names are supplied by the user or verified source context.
- If named competitors are needed for the diagnosis, mark `competitors` as `needs_confirmation`.

### Region Inference

- If the industry or target customers imply local intent, infer a region need and mark it `needs_confirmation` when no area is supplied.
- If region is not central to the business model, use `national_or_unspecified`.
- For local business, clinic, real estate, restaurant, school, and similar models, region is important and should appear in `needs_confirmation`.

### Diagnosis Goal Inference

If `diagnosis_goal` is missing, generate this standard goal:

> Diagnose how AI search handles non-branded discovery, comparison, alternative search, citation/evidence behavior, and brand sentiment for the client's category.

Keep branded prompts sentiment-only. Measure AI visibility rate and ranking with non-branded / `brand_excluded` prompts.

## Inferred But Not Allowed To Assert

Never assert these without user input or measured evidence:

- real competitor names
- official website content, schema, pricing pages, FAQ structure, or citation readiness when `website_url` is missing
- actual AI visibility, ranking, citations, recommendations, sentiment, trust, or reputation
- customer segments as verified personas
- pricing, review, safety, performance, legal, medical, or financial claims
- region-specific market dominance or local ranking

## Production Quality With Caveats

Use these readiness labels:

- `production_ready_prompt_design`: Topic-first design, metric eligibility, quality gate, coverage matrix, assumptions, and caveats are complete enough for a strong draft.
- `production_measurement_ready_with_caveats`: Measurement can be prepared from the draft, but missing URL, competitors, regions, or client proof remain caveats.
- `not_full_client_verified`: Official client facts, site evidence, real competitor set, pricing, claims, and reputation have not been verified.

Every Minimum Input Mode output must include:

- `assumptions`
- `caveats`
- `needs_confirmation`
- `next_data_needed`

## Minimum Input Output Flow

Use this order:

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

## Prompt Source Status

Each prompt may include:

```md
source_status: based_on_provided_input | based_on_inferred_context | needs_client_confirmation
```

Guidance:

- `based_on_provided_input`: prompt is directly grounded in the four minimum fields.
- `based_on_inferred_context`: prompt uses inferred business model, persona, buyer stage, raw intent, region, risk, or category context.
- `needs_client_confirmation`: prompt depends on missing URL, real competitors, pricing, claims, region, proof, or regulated-industry facts.

## Production-Quality Criteria

Minimum Input Mode can be treated as close to production quality only when:

- Topic Set exists.
- Every prompt has `topic_id`.
- Every prompt has `metric_eligibility`.
- Branded prompts are excluded from visibility and ranking.
- Branded prompts are sentiment-only.
- Buyer stages are distributed.
- At least three personas are present.
- `raw_user_intent` and `language_mode` are present where realism matters.
- Every prompt has `expected_signal`.
- Coverage matrix and quality gate are present.
- Assumptions and caveats are explicit.
- Unsafe or unsupported claims are absent.
- Missing competitors do not produce invented competitor names.

If any condition fails, use `revise_before_measurement` or `production_measurement_ready_with_caveats`, not unqualified readiness.
