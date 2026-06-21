# RECORA Skill Stack

This project-level note describes the intended project-local Recora skill stack after P0 cleanup.

## Shared References

- `references/recora-skill-stack-contract.md`: shared ownership, routing, evidence, and quality-gate boundaries.
- `references/recora-skill-handoff-workflow.md`: shared parent-to-specialist-to-quality-gate handoff workflow.

## Core Roles

- `georader-ai-search-auditor`: parent strategy and diagnosis owner for evidence interpretation, roadmap-level prioritization, query-map direction, report quality, and recommendation candidate drafts.
- `recora-recommendation-quality-gate-auditor`: independent publication quality gate for `auto_publish`, `hold`, or `suppress`.
- `recora-geo-implementation-architect`: implementation architecture and code-review owner for parser/provider/data/model/storage/jobs/tests/migrations/quality-gate integration.

## Specialist Roles

- `recora-persona-discovery`: persona hypotheses, decision-role separation, ICP/Anti-ICP, risky-intent transformation, and prompt-angle handoff.
- `recora-prompt-topic-designer`: topic-first prompt set design, prompt coverage, metric eligibility, and measurement readiness.
- `recora-ai-citation-analysis`: citation inventory, cited source text, citation correctness/faithfulness, source-to-claim alignment, and Source Intelligence reports.
- `recora-competitor-benchmark`: competitor normalization, tier classification, AI Visibility, Share of Voice, recommendation rank, threat level, benchmark tables, and dashboard/JSON outputs.
- `recora-schema-seo-aio`: page-level SEO/AIO/schema audits, owned-page actions, structured data, internal links, and source-gap resolution plans.
- `recora-copy-brand-voice`: RECORA brand voice, claim-risk cleanup, LP/report/dashboard microcopy, and safe Japanese BtoB SaaS wording.
- `recora-visual-design-director`: LP, dashboard, sample report, visual asset, mock, chart, CTA, and screenshot design review.

## How They Work Together

1. `georader-ai-search-auditor` frames the strategy, evidence scope, roadmap priority, and candidate draft direction.
2. Specialist skills produce detailed artifacts only in their own lanes.
3. Candidate drafts preserve source skill, evidence labels, missing evidence, risk flags, confidence, and caveats.
4. `recora-recommendation-quality-gate-auditor` reviews each candidate and decides `auto_publish`, `hold`, or `suppress`.
5. Only candidates that pass the quality gate become client-facing recommendations.
6. `recora-geo-implementation-architect` may review how the candidate and gate decisions are generated, persisted, transported, invalidated, and tested, but it does not decide publication.

## What Not To Use Them For

- Do not implement Recora or GEORADER while using analysis-only skills.
- Do not edit app, backend, database, LP, CLI, production, payment, email, deployment, package, or secret files unless explicitly authorized in a separate implementation task.
- Do not inspect `.env`, API keys, cookies, credentials, secrets, private tokens, or login sessions.
- Do not invent measurements, official claims, citations, source URLs, AI answer results, SERP results, dates, or competitor visibility.
- Do not guarantee AI citation, ranking, recommendation, traffic, conversion, revenue, or competitor victory.

## Excluded From RECORA Stack

- `keiba-ai-domain-expert` is not part of the RECORA project-local skill stack. It has been retired from `.agents/skills` because it is a horse-racing AI domain skill, not a RECORA GEO/AIO/AI-search skill.
