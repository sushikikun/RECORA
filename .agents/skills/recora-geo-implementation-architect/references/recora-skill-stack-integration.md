# RECORA Skill Stack Integration

## Three-Skill Stack

`georader-ai-search-auditor` owns strategy and candidate draft contracts:

- GEO / SEO / AIO / LLMO strategy
- query and prompt taxonomy
- evidence interpretation
- recommendation candidate drafts
- no final client publication decision

`recora-geo-implementation-architect` owns implementation architecture and code correctness:

- provider adapters
- parser and extraction contracts
- evidence ledger persistence
- candidate generation pipeline
- quality-gate transport and history
- jobs, retries, idempotency, observability, tests, migrations, and rollout safety

`recora-recommendation-quality-gate-auditor` owns publication quality gate:

- `auto_publish`, `hold`, or `suppress`
- quality score, confidence, risk level, evidence grade, flags, comments, safe rewrite, blocking reason, version, and review timestamp

## Handoff

1. `georader-ai-search-auditor` defines or drafts the evidence-backed candidate contract.
2. `recora-geo-implementation-architect` validates how the contract is generated, normalized, persisted, and transported.
3. `recora-recommendation-quality-gate-auditor` evaluates the generated candidate for publication.
4. `recora-geo-implementation-architect` must not override the quality-gate decision.
5. `recora-recommendation-quality-gate-auditor` must not invent technical implementation details.

## Shared Rule

Use `NEEDS_VERIFICATION` for missing, runtime-unverified, inaccessible, stale, or unsupported details. Do not turn strategy assumptions, README claims, or provider status into implementation facts.
