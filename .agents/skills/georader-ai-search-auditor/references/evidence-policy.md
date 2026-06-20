# Evidence Policy

Use this reference whenever an output contains GEO, SEO, LLMO, AI search, ranking, citation, crawler, structured data, report, or GEORADER strategy claims.

## Evidence Labels

Use these labels explicitly when the distinction matters:

| Label | Use For | Requirements |
|---|---|---|
| `CONFIRMED_FACT` | User-provided data, inspected files, supplied AI answers, screenshots, exports, runtime output, or verified repository evidence | State the source or artifact inspected |
| `OFFICIAL_SOURCE` | Guidance backed by official documentation or primary sources such as Google Search Central, OpenAI documentation, schema.org, or vendor primary docs | Cite or name the official source; do not generalize beyond it |
| `RESEARCH_BACKED` | Concepts supported by academic papers or credible research, including GEO / generative engine optimization research | Name the research source when available; avoid overstating scope |
| `INDUSTRY_PRACTICE` | Widely used SEO, content strategy, technical SEO, CRO, sales, or digital marketing practice that is not necessarily official | Present as practice or heuristic, not as official standard |
| `GEORADER_ASSUMPTION` | GEORADER-specific scoring, report structure, product packaging, service positioning, or roadmap strategy | State that it is GEORADER's internal framework or assumption |
| `NEEDS_VERIFICATION` | Useful but unverified claim, current-state question, fresh SERP/AI answer/crawler behavior, or unsupported client evidence | Mark what should be checked before client or production use |

## Hard Rules

- Do not present a GEORADER framework as an official standard.
- Do not call something a ranking factor unless an official source or credible research explicitly supports that framing.
- Do not cite local skill text as an external source. Local skills can inspire patterns, but they are not evidence for client-facing claims.
- Do not invent citations, statistics, source names, AI answer results, SERP results, or crawler behavior.
- If the claim affects trust, money, delivery, diagnosis accuracy, or client recommendations, use `CONFIRMED_FACT` or `NEEDS_VERIFICATION`.

## Official Source Handling

Use `OFFICIAL_SOURCE` only when the answer is based on primary documentation. Examples of acceptable source types:

- Google Search Central and official Google developer/search documentation.
- OpenAI, Anthropic, Perplexity, Microsoft, or other vendor primary documentation.
- schema.org vocabulary definitions and official validation tools.
- Standards bodies or platform-owner documentation.

If official documentation was not checked in the current task, say so and use `NEEDS_VERIFICATION` or `INDUSTRY_PRACTICE`.

## Output Pattern

For strategic reports, include a compact evidence ledger:

| Claim | Evidence label | Basis | Client-safe? |
|---|---|---|---|

For short answers, inline labels are enough:

- `[GEORADER_ASSUMPTION] GEORADER Expert Review Framework can score the site across eight review areas.`
- `[NEEDS_VERIFICATION] Current AI answer visibility should be measured with fresh query results before a client report.`

## Unsafe Claim Examples

Avoid:

- "This is the official GEO standard."
- "Google will rank this higher."
- "AI will definitely cite this page."
- "This guarantees recommendation in ChatGPT."

Use:

- "This is a GEORADER-specific review framework."
- "This may improve crawlability and evidence clarity; current ranking impact needs verification."
- "This increases citation readiness, but actual AI citation requires testing."
- "This helps AI systems evaluate the claim when the page is accessible and supported by sources."
