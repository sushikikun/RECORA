# OSS Patterns Adoption Policy

## Purpose

Use this reference when applying RECORA open-source reference research to `georader-ai-search-auditor` outputs.

This reference is for pattern adoption only. It does not authorize code changes, production changes, external integrations, crawling, browser automation, API key handling, or direct edits to existing skill files.

## Core Rule

Borrow patterns, not source code.

Open-source repositories can inspire structure, terminology, candidate fields, report sections, risk checks, and evaluation cases. They must not be treated as proof that a RECORA client has visibility, citations, ranking, traffic, revenue, or implementation capability.

## Evidence Labels

Use these labels when open-source repository research influences output:

- `OSS_RESEARCH_PATTERN`: an internal pattern derived from public README/repository research. This label supports structure or planning, not client-facing factual claims.
- `NEEDS_VERIFICATION`: a repository claim, feature claim, benchmark, statistic, provider support claim, integration claim, or outcome claim that has not been independently verified for RECORA.
- Existing labels such as `CONFIRMED_FACT`, `OFFICIAL_SOURCE`, `RESEARCH_BACKED`, `INDUSTRY_PRACTICE`, and `GEORADER_ASSUMPTION` still apply when their normal requirements are met.

Do not use `OSS_RESEARCH_PATTERN` as a substitute for RECORA measurement evidence.

## README And Repository Claims

Public README content can support:

- naming a pattern to consider
- drafting a field list
- identifying anti-patterns
- designing future eval cases
- shaping internal product questions

Public README content cannot support:

- a client-facing claim that a tactic works
- a claim that RECORA supports a provider/platform
- a claim that a repository's method is accurate or safe
- a claim that a score, benchmark, or external statistic is true
- a claim that a client is cited, recommended, ranked, or absent in AI answers

## Draft -> Gate Flow

Preserve the current RECORA stack:

- `georader-ai-search-auditor` drafts strategy, query maps, evidence interpretation, and recommendation candidates.
- `recora-recommendation-quality-gate-auditor` decides `auto_publish`, `hold`, or `suppress`.

Do not draft candidates as final client-facing recommendations. Include the evidence ledger fields and quality-gate notes needed for later review.

## Safe Borrow-Now Patterns

Use these patterns when drafting RECORA candidates:

- evidence ledger fields for every recommendation candidate
- query taxonomy and seed-risk classification
- provider capability status
- citation opportunity and competitor gap fields
- source-to-claim support status
- not-inspected and needs-verification fields
- explicit separation of measurement evidence from technical readiness evidence

## Research-Only Patterns

Mark these as future/research-only unless separately approved:

- live multi-provider AI answer measurement
- product UI or browser-surface measurement
- login flows and stored sessions
- API key, BYOK, or credential flows
- crawling, scraping, headless browser, or external extraction services
- scheduled monitors and automation
- cloud sync, paid services, or hosted report upload
- content push, deploy, rewrite, or auto-fix flows

## Candidate Draft Requirements

When OSS patterns shape a RECORA candidate draft, include:

- evidence label: `OSS_RESEARCH_PATTERN` for structure, plus `NEEDS_VERIFICATION` for unverified claims
- evidence ledger fields when available
- query taxonomy and seed risk
- provider status
- citation/source context
- whether the candidate is internal-only or potentially client-facing after gate review
- explicit limitations and not-inspected items
- quality-gate handoff notes

## Unsafe Drafting Patterns

Do not draft candidates that:

- guarantee AI citation, ranking, traffic, revenue, or ROI
- cite repository README claims as client evidence
- recommend secret access, `.env` edits, cookies, credentials, or login sessions
- recommend browser automation, UI automation, crawling, scraping, package installs, or external scripts
- imply provider support from planned or unknown status
- treat citation count as claim support
- treat seeded prompt results as non-branded discovery evidence
- propose implementation from inside the skill

