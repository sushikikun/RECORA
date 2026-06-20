# Recora Skill Stack Contract

Use this shared contract to make `georader-ai-search-auditor` and `recora-recommendation-quality-gate-auditor` work together as a Recora production skill stack.

## Purpose

The stack separates strategy generation from publication quality control.

- `georader-ai-search-auditor` creates Recora GEO / SEO / AIO / LLMO / AI search strategy, diagnosis, query maps, evidence interpretation, improvement ideas, and recommendation candidate drafts.
- `recora-recommendation-quality-gate-auditor` audits recommendation candidates and decides whether they can become client-facing recommendations.

## Routing

Route to `georader-ai-search-auditor` for:

- Recora strategy and audit planning.
- query maps and prompt taxonomies.
- AI answer, SERP, citation-readiness, competitor gap, and content architecture interpretation.
- improvement ideas and recommendation candidate draft generation.

Route to `recora-recommendation-quality-gate-auditor` for:

- `auto_publish`, `hold`, or `suppress` decisions.
- quality score and confidence.
- client-facing display risk.
- seed contamination, citation misuse, hallucinated evidence, stale-source misuse, generic SEO advice, duplicate risk, and overclaim checks.
- safe client-facing rewrites.

## Shared Evidence Labels

- `CONFIRMED_FACT`: supplied or inspected evidence.
- `OFFICIAL_SOURCE`: current primary-source guidance for the specific platform and claim.
- `RESEARCH_BACKED`: named research supports a concept or studied behavior.
- `INDUSTRY_PRACTICE`: common SEO, GEO, content, CRO, or reporting practice.
- `GEORADER_ASSUMPTION` / `RECORA_ASSUMPTION`: internal framework, scoring, packaging, or roadmap assumption.
- `NEEDS_VERIFICATION`: missing, stale, unsupported, unmeasured, or source-status-unknown evidence.

## Shared Boundaries

- Do not implement Recora or GEORADER.
- Do not edit app, backend, database, LP, CLI, production, payment, email, deployment, or secret files.
- Do not inspect `.env`, API keys, cookies, credentials, secrets, private tokens, or login sessions.
- Do not invent IDs, measurements, AI answer results, SERP results, citations, source URLs, official claims, or competitor visibility.

## Publication Rule

Strategy findings can become recommendation candidate drafts. Drafts are not publication decisions.

Only `recora-recommendation-quality-gate-auditor` decides:

- `auto_publish`
- `hold`
- `suppress`

Client-facing recommendations should be shown only after passing the quality gate.

## Client-Facing Safety

- Avoid guarantees of AI citation, ranking, recommendation, traffic, conversion, or revenue.
- Use measured-scope language for Recora observations.
- Mark missing IDs, source support, seed status, or current visibility as `NEEDS_VERIFICATION`.
- Keep internal risk language out of client-facing text unless it is made calm and evidence-scoped.
