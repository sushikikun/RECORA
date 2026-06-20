# OSS Implementation Patterns Policy

Use the existing OSS research package only for patterns.

## Rules

- Do not copy source code.
- Do not treat README claims as implementation facts.
- Check licenses before any later code adoption.
- Crawling, browser automation, and external-service designs are research-only unless approved.
- Firecrawl/Crawl4AI/LibreCrawl-style extraction patterns may inform interfaces, not be assumed as RECORA dependencies.
- Provider support remains unknown until implemented and tested.
- OSS-derived score models are internal pattern ideas, not official GEO standards.
- OSS repository claims cannot support client-facing RECORA evidence.

## Safe Uses

- field lists
- architecture questions
- eval cases
- anti-patterns
- source/citation ledger patterns
- provider capability registry patterns
- report evidence inspection patterns
- crawler/extraction contract review questions
- technical SEO readiness issue taxonomy
- retry, idempotency, and cost-control failure patterns
- parser and citation fixture design

## Unsafe Uses

- dependency adoption without approval
- code copying
- external API design that assumes credentials
- browser, login, scraping, or CAPTCHA automation
- claims that a tactic guarantees AI citation or ranking
- treating public demos, stars, screenshots, or README feature lists as proof
- assuming a referenced OSS tool is a RECORA dependency
- running external tools from a skill review
- turning technical SEO scores into AI visibility evidence
- using OSS score weights as official GEO standards
