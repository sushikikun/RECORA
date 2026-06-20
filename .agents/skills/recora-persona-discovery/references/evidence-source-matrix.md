# Evidence Source Matrix

Use this matrix to extract buyer signals from public site and supplied evidence.

## Required Columns

```md
| evidence_source | observed_signal | persona_implication | confidence_impact | limitation |
|---|---|---|---|---|
```

## Source Patterns

| evidence_source | observed_signal examples | persona_implication | confidence_impact | limitation |
|---|---|---|---|---|
| homepage | headline, value proposition, category claim, CTA, target audience | broad audience, category, problem framing | medium when explicit | often marketing-led and broad |
| product_page | features, workflows, integrations, use cases | end user, evaluator, technical influencer | medium to high when role/use case is explicit | may omit buyer or budget owner |
| pricing | free trial, contact sales, enterprise plan, seats, usage, quote | buyer type, budget owner, adoption scale | high for packaging inference | price opacity can require sales data |
| case_study | customer role/title, industry, problem, result, quote | validated-ish role and use case | high if specific and current | one case is not a full segment |
| testimonial | pain, outcome, role, vocabulary | language, objections, desired outcomes | medium when specific | often curated and incomplete |
| CTA | demo, free diagnosis, contact, download, request quote | buyer stage and intent | medium | CTA can target lead capture, not real buyer |
| FAQ | objections, pricing, process, support, security | evaluator concerns and decision barriers | medium | may reflect anticipated, not observed, concerns |
| comparison_page | named alternatives, categories, decision axes | comparator/evaluator persona | medium to high | may be biased by brand positioning |
| review_site | complaints, alternatives, vocabulary, role clues | real-world pains and language | high when available | may be stale or unrepresentative |
| hiring_page | roles being hired, go-to-market motion, customer functions | company focus, target market clues | low to medium | hiring needs are indirect evidence |
| docs/help_center | workflows, integrations, setup, troubleshooting | end user and technical influencer | medium | users of docs may differ from buyers |

## Pricing And Packaging Inference

Use pricing to infer, not prove:

- Self-serve/free trial: hands-on evaluator, small team, practitioner, or product-led motion may matter.
- Contact sales/enterprise: economic buyer, decision maker, procurement, security, or technical evaluator may matter.
- Usage-based pricing: operations, finance, or technical buyer may ask about scaling and cost control.
- Agency plan or client/reporting language: agency/consultant personas may matter.

## Case Study / Testimonial Extraction

When present, extract:

- role/title
- industry
- company size when stated
- problem
- trigger event
- alternative considered
- objection
- desired outcome
- language used
- measurable result, if stated

Do not generalize from one case study to a main customer segment without more data.
