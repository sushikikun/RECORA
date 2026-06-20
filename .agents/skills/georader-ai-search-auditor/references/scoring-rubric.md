# Scoring Rubric

Use this reference for answer-level scores, expert review scoring, and P0/P1/P2 severity.

## Evidence Rule

The scoring model is the `GEORADER Expert Review Framework`. It is a `GEORADER_ASSUMPTION`, not an official GEO standard and not a platform ranking system.

Do not imply that Google, OpenAI, Gemini, Perplexity, or any other platform uses this score.

## AI Answer-Level Score

| Score | Meaning |
|---:|---|
| 0 | Not visible |
| 1 | Mentioned weakly |
| 2 | Listed but not recommended |
| 3 | Recommended with weak evidence |
| 4 | Recommended with clear evidence |
| 5 | Strongly recommended with citations and clear fit |

## GEORADER Expert Review Framework

Use a 100-point score only when scoring helps the report. Otherwise, use qualitative P0/P1/P2 findings.

| Area | Points | What To Check |
|---|---:|---|
| Technical Discoverability | 12.5 | crawlability, indexability, rendering, sitemap/robots, canonical, mobile, structured data opportunity |
| Search Intent Coverage | 12.5 | non-branded, problem-aware, comparison, branded, pricing, industry, region, conversion queries |
| Topical Authority | 12.5 | hub/spoke coverage, glossary, FAQ, comparison, industry/use-case pages, internal links |
| Entity / Brand Authority | 12.5 | company clarity, author/operator info, proof, third-party mentions, source consistency |
| AI Citation Readiness | 12.5 | citable claims, source-backed evidence, cited URLs/domains, extractable proof assets |
| Competitive SERP / AI Gap | 12.5 | competitors outranking or being recommended, cited source advantage, comparison narrative |
| Conversion SEO | 12.5 | CTA clarity, proof, objections, funnel trust, form honesty, internal sharing readiness |
| Report / Product Value | 12.5 | report usefulness, severity quality, paid diagnosis value, monthly roadmap clarity |

## Severity Rules

P0:

- secrets or credential exposure.
- fake or misleading form completion, payment, email, delivery, or diagnosis claims.
- client-facing report claim that is unsupported, falsely official, or materially misleading.
- diagnosis logic or scoring that can produce wrong client recommendations.
- confirmed or likely indexability/crawlability blocker for critical pages.
- production/data safety risk.

P1:

- major AI visibility, search intent, or citation-readiness gap.
- competitor consistently wins key discovery, comparison, or AI answer prompts.
- missing proof for core claims.
- weak report structure that reduces paid value.
- unclear service, target customer, methodology, pricing/package, or next action.

P2:

- wording polish.
- optional prompt expansion.
- lower-impact content gaps.
- visualization/table improvements.
- minor client-facing clarity improvements.
- experiments for future measurement.

## Score Communication

- Do not hide poor scores.
- Explain what evidence caused the score and what would raise it.
- Label the score as GEORADER's expert review, not an official standard.
- Keep client-facing score language factual and calm.
- Keep internal score language direct when it helps prioritization.
