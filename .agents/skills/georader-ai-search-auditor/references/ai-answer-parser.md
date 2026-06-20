# AI Answer Parser

Use this reference when reviewing supplied AI answer outputs from ChatGPT, Gemini, Perplexity, AI Overviews, or similar systems.

## Evidence Rule

Only parse AI answers that are supplied, exported, transcribed, or generated in a verified workflow. Otherwise mark answer state as `NEEDS_VERIFICATION`.

Do not invent model outputs, citations, competitors, or scores.

## Extraction Schema

For each answer, extract:

- query.
- model/source if known.
- evidence label.
- brand mentioned: yes/no.
- mention position: first, top 3, lower, cited only, absent.
- competitors mentioned.
- recommendation status: strongly recommended, recommended, listed, neutral mention, absent, discouraged.
- sentiment: positive, neutral, negative, unclear.
- cited URLs.
- cited domains.
- claims made about the brand.
- evidence quality.
- hallucination risk.
- missing evidence.
- conversion opportunity.
- notes for client-facing report.

## Recommendation Status Rules

- `strongly recommended`: answer actively selects the brand as a good fit and gives reasons.
- `recommended`: answer recommends or includes the brand in a shortlist with some rationale.
- `listed`: answer names the brand but does not clearly recommend it.
- `neutral mention`: answer refers to the brand only in passing.
- `absent`: answer does not mention the brand.
- `discouraged`: answer warns against the brand or suggests it is a poor fit.

## Citation Rules

- Count cited URLs separately from cited domains.
- Do not treat a citation as supportive unless it backs the claim being made.
- Flag citations that point only to competitor pages, directories, outdated pages, thin pages, or unrelated content.
- Mark claims as unsupported when the answer states a benefit, price, case study, ranking, methodology, or capability without a clear source.

## Output Shape

Prefer a compact table:

| Query | Brand status | Position | Competitors | Citations | Score | Evidence label | Risk |
|---|---|---|---|---|---:|---|---|

Follow the table with:

- top patterns.
- best opportunities.
- hallucination or trust risks.
- content/citation gaps to fix.
- GEORADER report implications.
