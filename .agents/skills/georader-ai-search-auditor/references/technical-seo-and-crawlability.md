# Technical SEO And Crawlability

Use this reference when technical discoverability affects SEO, GEO, AI citation readiness, or GEORADER report quality.

## Evidence Labels

- Inspected robots.txt, sitemap, rendered HTML, HTTP status, Search Console exports, crawl exports, or browser output are `CONFIRMED_FACT`.
- Official platform guidance is `OFFICIAL_SOURCE` only when checked against primary docs.
- General crawlability and rendering recommendations are usually `INDUSTRY_PRACTICE`.
- Unchecked live-site state is `NEEDS_VERIFICATION`.

## Checks

| Area | Check |
|---|---|
| Crawlability | robots.txt, sitemap reference, important pages linked, no accidental blocks |
| Indexability | meta robots, canonical tags, status codes, redirects, noindex, duplicate/thin pages |
| Rendering | critical content visible in initial HTML or verified rendered output, no blank JS-only content |
| Structured Data Opportunity | Organization, WebSite, Article, FAQPage, BreadcrumbList, Product/SoftwareApplication where page content supports it |
| Mobile And CWV | mobile readability, layout stability, LCP/INP/CLS evidence when available |
| Agent Accessibility | semantic HTML, labeled forms, real buttons/links, accessible names, stable selectors |
| AI Crawler Policy | whether AI crawler access aligns with the client's training/citation strategy |

## Overclaim Guardrails

- Do not say "no schema exists" from static fetch alone if scripts may inject JSON-LD.
- Do not claim a page is indexable without checking status, robots, canonical, and noindex evidence.
- Do not claim Core Web Vitals pass without lab or field data.
- Do not claim AI crawlers can cite a site unless crawler policy and content access were checked.
- For agent-facing recommendations, frame them as forward-looking opportunities unless backed by official source or inspected evidence.

## Output Pattern

| Area | Status | Evidence label | Risk | Recommendation |
|---|---|---|---|---|

Keep recommendations as audit/planning guidance. Do not implement robots.txt, schema, routes, or code in this skill.
