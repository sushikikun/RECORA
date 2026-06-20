# RECORA Skill Stack

This project-level note describes the intended project-local Recora skill stack.

## Skills

- `georader-ai-search-auditor`: Recora GEO / SEO / AIO / LLMO / AI Search Optimization Specialist.
- `recora-recommendation-quality-gate-auditor`: Recora Recommendation Quality Gate Auditor.

## How They Work Together

1. `georader-ai-search-auditor` analyzes Recora observations, AI answers, SERP gaps, query maps, citation readiness, content architecture, and competitor gaps.
2. It creates recommendation candidate drafts with evidence scope, candidate fields, risk flags, and safe draft wording.
3. `recora-recommendation-quality-gate-auditor` reviews each candidate and decides `auto_publish`, `hold`, or `suppress`.
4. Only candidates that pass the quality gate become client-facing recommendations.
5. Hold candidates become internal review tasks. Suppress candidates are not shown to clients.

## What Not To Use Them For

- Do not implement Recora or GEORADER.
- Do not edit app, backend, database, LP, CLI, production, payment, email, deployment, or secret files.
- Do not inspect `.env`, API keys, cookies, credentials, secrets, private tokens, or login sessions.
- Do not invent measurements, official claims, citations, source URLs, AI answer results, SERP results, or competitor visibility.

## How To Test

- Ask `georader-ai-search-auditor` to draft a candidate from measured evidence and confirm it avoids `auto_publish`.
- Ask `recora-recommendation-quality-gate-auditor` to gate the candidate and verify the decision is `auto_publish`, `hold`, or `suppress`.
- Test missing measurement IDs, `supports_claim=unknown`, seeded competitor prompts, generic SEO advice, and safe direct-measurement candidates.
