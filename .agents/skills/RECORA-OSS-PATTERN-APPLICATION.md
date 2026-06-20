# RECORA OSS Pattern Application

## Scope And Evidence

- Target: apply the research package at `skill-patches/recora-open-source-reference-research-v0.1/` to a future RECORA skill-stack patch package.
- Output type: internal patch package.
- Confirmed facts: existing skill stack keeps drafting and quality-gating separate.
- Evidence basis: local research package and existing project-local skill files were inspected.
- Not inspected: app code, backend, database, LP, CLI, production behavior, secrets, external repo source code, runtime measurements, or live AI answer data.

## Stack Rule

Preserve:

- `georader-ai-search-auditor`: strategy, analysis, query maps, evidence interpretation, and recommendation candidate drafts.
- `recora-recommendation-quality-gate-auditor`: `auto_publish`, `hold`, or `suppress` decisions and candidate quality checks.

## What This Package Adds

### For georader-ai-search-auditor

- OSS adoption policy.
- Evidence ledger pattern.
- Query taxonomy and seed-risk pattern.
- Citation opportunity and competitor gap pattern.
- Provider capability status pattern.
- Patch notes for future `SKILL.md` update.
- Eval additions for evidence-ledger drafting, query classification, citation opportunity handling, provider unknown handling, and README-as-proof avoidance.

### For recora-recommendation-quality-gate-auditor

- OSS quality-gate policy.
- README-as-proof and marketing claim risk rules.
- External service and automation risk rules.
- Provider status gate rules.
- Citation opportunity gate rules.
- Patch notes for future `SKILL.md` update.
- Eval additions for README-as-proof suppression, external automation hold, provider unknown hold, citation count/source unknown hold, safe auto-publish, and browser/API/login/secrets suppression.

## Product/Data Model Implications

- Treat evidence ledger fields as the shared contract between draft and gate.
- Store query category and seed risk with every candidate.
- Store provider status separately from evidence quality.
- Store citation/source data with source-to-claim status.
- Treat competitor citation gaps as hypotheses until verified.
- Keep technical readiness separate from AI citation proof.

## Application Boundary

This package does not:

- edit existing skills
- edit app/backend/database/LP/CLI/production files
- create migrations
- inspect or modify `.env`
- request or store secrets
- clone repositories
- install packages
- run external scripts
- copy external repository source code

