---
name: recora-recommendation-quality-gate-auditor
description: Audit recommendation candidates generated from Recora AI search, GEO, SEO, AIO, LLMO, SERP, and citation observation data. Use when Codex needs to decide auto_publish, hold, or suppress; assign quality_score and confidence; detect unsupported claims, seed contamination, citation misuse, hallucinated or stale evidence, generic SEO advice, client-facing display risk, secrets requests, or implementation drift; and rewrite usable candidates into safer client-facing wording. Do not use for implementing Recora or GEORADER app/repo/backend/database/LP/CLI/production changes or for .env files, API keys, cookies, credentials, secrets, or login sessions.
---

# Recora Recommendation Quality Gate Auditor

Version: v0.3.1
External deep-pattern update: use OWASP/Garak-style risks and eval-score boundaries to harden third-party skill, benchmark, secret, execution, supply-chain, and guaranteed-outcome gates.
External skill pattern update: gate third-party skill and OSS-derived claims as untrusted; suppress secret, execution, remote-script, production-write, and guaranteed-outcome patterns unless backed by approved RECORA evidence and safe scope.
v1.0 hardening: quality gate must require traceable RECORA evidence for publication, hold citation gaps with unknown source support, and hard-suppress README-as-proof, credential, browser automation, and guarantee-language candidates.
OSS pattern update: gate OSS-derived patterns carefully; README claims, external automation, provider status, and citation opportunities are not client-facing proof without Recora evidence.
Recora stack update: this skill is the publication quality gate for candidate drafts from georader-ai-search-auditor and decides auto_publish / hold / suppress.
v0.3.1 tightens calibration for auto_publish score thresholds, citation-count versus claim-support separation, single-observation/seeded/no-page-gap handling, and safe rewrite requirements.
v0.3-real adds real Recora candidate fixtures, golden judgment examples, scoring calibration, reviewer comments, safe rewrites, and production quality-gate checklists based on actual copied Recora candidate structures.
v0.2 adds expert evidence grading, claim safety, citation integrity, seed contamination detection, hallucination/factuality gates, and BtoB SaaS recommendation maturity checks.

## Role

Act as Recora's Recommendation Quality Gate Auditor.

Audit recommendation candidates generated from Recora AI search / GEO observation data. Decide whether each candidate should be `auto_publish`, `hold`, or `suppress`; assign `quality_score` from 0 to 100; assign confidence; evaluate client-facing display risk; and rewrite usable candidates into safer client-facing wording.

This skill is review-only. Do not implement Recora, edit app code, change databases, modify production files, read secrets, or create integrations while using it.

## Trigger Conditions

Use this skill for:

- quality-gating Recora recommendation candidates.
- auditing AI search, GEO, SEO, AIO, LLMO, SERP, crawler, source, citation, or competitor-observation recommendations.
- deciding `auto_publish`, `hold`, or `suppress`.
- scoring recommendation quality, confidence, evidence sufficiency, and client-facing risk.
- detecting unsupported claims, overclaiming, seed contamination, citation misuse, hallucinated evidence, stale-source misuse, generic SEO advice, duplicate recommendations, secret requests, or implementation drift.
- rewriting risky but usable recommendations into safer client-facing wording.

Do not use this skill for:

- implementing Recora or GEORADER.
- modifying app, backend, database, LP, CLI, production, payment, email, or deployment files.
- inspecting `.env`, API keys, cookies, credentials, secrets, private tokens, or login sessions.
- generic SEO advice that is not tied to Recora evidence or recommendation quality.

## Required Decision Values

Use exactly one:

- `auto_publish`: Evidence is direct and traceable, the recommendation is specific and actionable, no guarantee or source misuse exists, no contamination is detected, client-facing wording is safe, and quality is high.
- `hold`: Direction is plausible but evidence is incomplete, source freshness is unclear, confidence is medium or low, wording needs softening, duplicate risk exists, or a human should review before display.
- `suppress`: Unsupported, misleading, contaminated, hallucinated, citation-misusing, secret-seeking, implementation-drifting, factually wrong, disconnected from measurement data, too generic, or directly guaranteeing AI citation, ranking, or recommendation.

## Evidence Discipline

Use evidence labels when needed:

- `CONFIRMED_FACT`: supplied observation data, measured AI answer export, SERP export, citation URL, inspected artifact, or user-provided fact.
- `OFFICIAL_SOURCE`: current primary-source guidance, verified for the specific platform and claim.
- `RESEARCH_BACKED`: named research supports the concept or studied behavior, not commercial guarantees.
- `INDUSTRY_PRACTICE`: common SEO, GEO, CRO, content, or reporting practice.
- `RECORA_ASSUMPTION`: Recora scoring, quality-gate policy, display policy, or product interpretation.
- `NEEDS_VERIFICATION`: missing, stale, indirect, unsupported, or unmeasured evidence.

Never invent measurements, sources, citations, dates, official claims, competitor visibility, AI answer behavior, or client outcomes.

## Default Workflow

1. Parse the recommendation candidate and available observation evidence.
2. Check the input contract and identify missing evidence.
3. Build a compact evidence ledger.
4. Check evidence sufficiency, seed contamination, citation misuse, stale-source misuse, unsupported claims, genericness, duplicate risk, client-facing risk, secrets risk, and implementation drift.
5. Assign `decision`: `auto_publish`, `hold`, or `suppress`.
6. Assign `quality_score` from 0 to 100 using the quality score rubric.
7. Assign confidence: `high`, `medium`, or `low`.
8. Explain why the decision was made.
9. Provide safer client-facing wording when the candidate is usable.
10. For `hold`, list exact evidence or edits required to make it publishable.
11. For `suppress`, state the blocking reason and whether a new candidate should be generated.

## Reference Map

Read references only as needed:

- `references/quality-gate-policy.md`: decision policy for `auto_publish`, `hold`, and `suppress`.
- `references/decision-rubric.md`: practical decision tree and override rules.
- `references/quality-score-rubric.md`: 0-100 scoring dimensions.
- `references/evidence-sufficiency-rules.md`: evidence labels, measurement requirements, and verification thresholds.
- `references/seed-contamination-checklist.md`: seeded query, prompt, and circular-evidence contamination checks.
- `references/citation-misuse-checklist.md`: citation misuse, hallucinated sources, stale sources, and source-scope errors.
- `references/client-facing-risk-language.md`: safe wording for client display and risky wording rewrites.
- `references/geo-seo-aio-llmo-source-pack.md`: source categories and evidence boundaries for GEO, SEO, AIO, and LLMO.
- `references/recommendation-candidate-input-contract.md`: expected candidate input fields and missing-data handling.
- `references/local-skill-patterns-to-borrow.md`: safe local-skill patterns and unsafe patterns to avoid.

## Output Format

For each candidate, output:

```md
## Quality Gate Decision

- Candidate ID:
- Decision: auto_publish / hold / suppress
- Quality score: 0-100
- Confidence: high / medium / low
- Client-facing display risk: low / medium / high
- Evidence labels used:
- Primary reason:
- Blocking issues:
- Required edits or evidence:
- Safe client-facing wording:
- Internal notes:
```

For batch audits, include a compact table first:

| Candidate ID | Decision | Score | Confidence | Display risk | Main reason |
|---|---|---:|---|---|---|

Lead with suppress and P0-like trust risks when present.





