# RECORA Skill Stack Contract

Use this shared contract when RECORA project-local skills need to decide ownership, handoff, and publication boundaries.

## Purpose

Keep RECORA skills specialized instead of creating a single universal skill.

- `georader-ai-search-auditor` owns parent strategy, diagnosis, evidence interpretation, roadmap-level prioritization, and recommendation candidate drafts.
- Specialist skills own detailed artifacts for citation, competitors, schema/page structure, personas, and prompt sets.
- `recora-geo-implementation-architect` owns implementation architecture and code review for how evidence, candidates, provider results, parser outputs, and quality-gate payloads are generated, persisted, transported, tested, and rolled out.
- `recora-recommendation-quality-gate-auditor` owns final publication quality decisions for recommendation candidates.

## Routing

Route to `georader-ai-search-auditor` for:

- RECORA / GEORADER strategy and audit planning.
- evidence interpretation, roadmap framing, and P0/P1/P2 prioritization.
- query map direction, topic coverage strategy, and high-level opportunity diagnosis.
- draft recommendation candidates that must still pass quality gate before publication.

Route detailed specialist work to:

- `recora-persona-discovery`: persona hypotheses, decision roles, ICP/Anti-ICP, risky-intent transformation, and prompt-angle handoff.
- `recora-prompt-topic-designer`: topic-first measurement prompt sets, prompt coverage, metric eligibility, prompt quality gates, and prompt libraries.
- `recora-ai-citation-analysis`: AI-answer citations, cited source text, source accessibility, citation faithfulness, claim-to-source alignment, and Source Intelligence outputs.
- `recora-competitor-benchmark`: competitor normalization, tier classification, AI visibility, Share of Voice, recommendation rank, threat level, benchmark tables, and JSON/dashboard output.
- `recora-schema-seo-aio`: metadata, page structure, schema, internal links, extractability, owned-page actions, and source-gap resolution plans.
- `recora-copy-brand-voice`: RECORA customer-facing wording, claim-risk cleanup, LP/report/dashboard microcopy, and safe Japanese BtoB SaaS voice.
- `recora-visual-design-director`: LP, dashboard, sample report, visual asset, mock, chart, and screenshot design review.
- `recora-geo-implementation-architect`: implementation architecture, code review, data model, parser/provider/crawler, migration, tests, observability, and quality-gate integration.

Route to `recora-recommendation-quality-gate-auditor` for:

- `auto_publish`, `hold`, or `suppress` decisions.
- quality score, confidence, display risk, evidence grade, safe rewrite, and blocking reason.
- seed contamination, citation misuse, hallucinated or stale evidence, generic SEO advice, overclaiming, implementation drift, duplicate risk, and client-facing safety.

## Shared Evidence Labels

- `CONFIRMED_FACT`: supplied or inspected evidence.
- `OFFICIAL_SOURCE`: current primary-source guidance for the specific platform and claim.
- `RESEARCH_BACKED`: named research supports a concept or studied behavior.
- `INDUSTRY_PRACTICE`: common SEO, GEO, content, CRO, or reporting practice.
- `GEORADER_ASSUMPTION` / `RECORA_ASSUMPTION`: internal framework, scoring, packaging, or roadmap assumption.
- `NEEDS_VERIFICATION`: missing, stale, unsupported, unmeasured, source-status-unknown, runtime-unverified, or not inspected.

## Shared Boundaries

- Do not implement RECORA or GEORADER while using analysis-only skills.
- Do not edit app, backend, database, LP, CLI, production, payment, email, deployment, package, or secret files unless a later task explicitly authorizes that exact implementation scope.
- Do not inspect `.env`, API keys, cookies, credentials, secrets, private tokens, or login sessions.
- Do not invent IDs, measurements, AI answer results, SERP results, citations, source URLs, official claims, competitor visibility, or dates.
- Do not turn external skill, OSS, README, benchmark, eval, provider-status, schema, robots, sitemap, or bot-access claims into RECORA evidence.
- Do not guarantee AI citation, AI recommendation, ranking, traffic, conversion, revenue, or competitor victory.

## Publication Rule

Strategy findings and specialist outputs may become recommendation candidate drafts. Drafts are not publication decisions.

Only `recora-recommendation-quality-gate-auditor` decides:

- `auto_publish`
- `hold`
- `suppress`

Client-facing recommendations should be shown only after passing the quality gate.

## Quality Gate Independence

- Parent strategy skills must not mark a candidate as approved for publication.
- Specialist skills may provide evidence, safe wording, action candidates, and caveats, but they must not override the quality gate.
- Implementation architecture may review storage, transport, review history, and invalidation behavior, but it must not decide publication.
- Quality gate must not invent missing implementation details, source text, measurement rows, or runtime behavior.
