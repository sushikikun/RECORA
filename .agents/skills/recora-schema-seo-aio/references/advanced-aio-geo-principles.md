# Advanced AIO / GEO Principles

Research date: 2026-06-21

Purpose: define Recora-specific AIO/GEO principles for page audits and recommendations. These principles complement SEO and schema, but do not guarantee AI citation.

## Core Distinctions

| Term | Meaning in Recora | Do not confuse with |
|---|---|---|
| Visibility | Brand/page appears or is retrievable in an observed AI/search surface. | Ranking, recommendation, or citation. |
| Mention | Brand/entity is named in an answer. | Endorsement or source citation. |
| Citation | A URL/source is linked or attributed in an answer. | Positive recommendation or ranking. |
| Recommendation | AI answer suggests the brand/product/service as a fit. | Mere mention or citation. |
| Sentiment | Tone or evaluation attached to the brand/entity. | Visibility volume. |

## Principles

### Answer extractability

Pages should contain direct, visible, section-scoped answers. Use short summaries before long explanations, tables for criteria, and labels for evidence/caveats.

### Entity clarity

Name the company, product, category, audience, region, deliverables, limitations, and adjacent competitors/alternatives when relevant. Ambiguous entity naming weakens both SEO and AIO/GEO interpretation.

### Source-to-claim alignment

Every important claim should point to a support type: owned page fact, customer evidence, measurement, third-party source, or `NEEDS_VERIFICATION`.

### Evidence density

Increase the amount of useful proof per page section: examples, dates, methodology, sample size, pricing facts, screenshots, case data, source labels, or constraints. Do not inflate with keywords.

### Third-party source ecosystem

Owned pages can clarify facts, but independent source gaps often require legitimate third-party evidence such as directories, partner pages, reviews, media, industry mentions, or public reports.

### Prompt-topic to page mapping

Map each important prompt topic to a page or section:

- definition prompt -> glossary or FAQ
- comparison prompt -> comparison page
- pricing prompt -> pricing page
- proof prompt -> case study or report
- method prompt -> sample report or research page
- source/citation prompt -> source intelligence page

### Buyer question coverage

Pages should answer evaluator questions by stage: definition, problem, category, comparison, pricing, proof, risk, implementation, and next action.

### Comparison fairness

Comparison pages must define scope, criteria, audience, fit/non-fit, evidence limits, and update date. Competitor claims require current sources or `NEEDS_VERIFICATION`.

### Brand vs non-branded prompt separation

- Do not mix branded prompts into AI visibility/ranking evaluation.
- Use branded prompts mainly for sentiment, brand recognition, entity clarity, and misinformation checks.
- Use non-branded prompts for discovery visibility, recommendation order, competitor comparison, and source gaps.

### Citation confidence

Citation confidence is a bounded judgment from evidence, not a prediction guarantee. Consider:

- source is public and crawlable
- content directly supports the answer claim
- source has independent or official authority for the topic
- page has extractable summaries and evidence labels
- source is fresh enough for the claim
- observed AI answers have cited similar source types

### Source gap severity

Classify source gaps:

- `P0`: AI answers contain harmful misinformation, private data risk, false pricing/review/customer claims, or severe competitor misinformation.
- `P1`: high-value non-branded prompt lacks Recora/client source support while competitors have source support.
- `P2`: owned page is unclear or missing extractable answer/evidence.
- `P3`: supporting internal-link/schema/content polish.

### Owned-page vs external-source split

Every source gap should be classified into one or more actions:

- page improvement
- new page
- external publication/listing/review/partner/media action
- measurement continuation

Do not present schema, robots, sitemap, bot access, or llms.txt as the whole source-gap solution.

### Measurement before claim

Use measured prompt/provider/date/source data before making claims about AI visibility, mentions, citations, recommendations, or sentiment. Without measurement, label as `NEEDS_VERIFICATION`.

### No guaranteed AI citation

Never claim that body structure, schema, robots, sitemap, bot access, llms.txt, or third-party outreach guarantees AI citation.

## Recora-Specific Rules

- Branded prompts are primarily for sentiment, brand recognition, entity clarity, and misinformation correction.
- Non-branded prompts are prioritized for AI visibility rate, recommendation/ranking-style comparisons, source gaps, and category ownership.
- Comparison recommendations must state whether they target user clarity, search discovery, AI extractability, or third-party evidence.
- Source gap recommendations must explicitly separate owned-page and external-source work.
- Dashboard and private report pages are not public SEO/AIO targets unless explicitly approved.
- Sample report pages must separate sample/anonymized data from product outcome claims.

## Safe Metrics Language

Use:

- "observed in the measured prompt set"
- "within this provider/date sample"
- "citation confidence is higher/lower because..."
- "source gap severity is P1 because..."
- "requires remeasurement"

Avoid:

- "AI ranking improved" without a defined metric
- "visibility increased" without prompt/provider/date/method
- "will be cited" or "will be recommended"
- "bot access proves exposure"
- "schema proves trust"

## Recommendation Checklist

Before finalizing an AIO/GEO recommendation:

1. Identify prompt type: branded or non-branded.
2. Identify outcome type: visibility, mention, citation, recommendation, or sentiment.
3. Identify page/source type.
4. Identify evidence level.
5. Identify source gap severity.
6. Split owned-page and external-source actions.
7. Add falsifiability fields.
8. Add safe caveat.
9. Route to quality gate if client-facing or risky.
