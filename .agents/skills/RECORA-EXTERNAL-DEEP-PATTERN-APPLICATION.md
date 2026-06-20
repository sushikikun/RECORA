# RECORA External Deep Pattern Application

Package: `recora-external-skill-deep-patterns-apply-v0.2`

Source research package: `skill-patches/recora-external-skill-research-v0.2-deep-patterns/`

Scope: apply-oriented patch package only. This package does not edit live RECORA skills, app code, backend, database, migrations, LP, CLI, production files, or secret files.

## Application Goal

Incorporate safe external skill/tool patterns into the RECORA three-skill stack as local reference material and eval additions:

1. `recora-recommendation-quality-gate-auditor`
2. `recora-geo-implementation-architect`
3. `georader-ai-search-auditor`

No external tool is approved for installation, execution, dependency adoption, source-code copying, or production use.

## What Improves Quality Gate

| File | Improvement |
|---|---|
| `owasp-genai-risk-gate-rules.md` | Adds internal flags for prompt injection, sensitive information disclosure, supply-chain risk, insecure output handling, excessive agency, tool misuse, overreliance, and untrusted source influence. |
| `garak-style-red-team-risk-gate.md` | Adds red-team fixture categories for adversarial prompts, exfiltration, tool misuse, unsafe automation, policy bypass, and external prompt injection. |
| `benchmark-and-eval-output-claim-policy.md` | Blocks eval and benchmark scores from becoming client-facing AI visibility proof. |
| `external-skill-supply-chain-gate.md` | Treats external skills, README claims, scripts, remote URLs, shell commands, package installs, and production writes as high risk. |
| `third-party-tool-adoption-safety-checklist.md` | Adds license, maintenance, execution, network, secret, production-write, data-retention, dependency, and fixture-alternative checks. |
| `client-facing-evidence-vs-eval-score-boundary.md` | Separates RECORA measurement evidence from internal eval/rubric scores. |
| `evals.external-deep-patterns-additions.json` | Adds future eval cases for secrets, remote scripts, production writes, benchmark proof, source-review gaps, supply-chain risk, internal rubric borrowing, and guarantee claims. |

## What Improves Implementation Architect

| File | Improvement |
|---|---|
| `zod-json-schema-contract-review.md` | Adds strict, versioned, parse-safe candidate and review payload checks without mandating a library. |
| `ragas-style-source-to-claim-eval-design.md` | Adds local source-to-claim relation design and golden fixture categories. |
| `lighthouse-style-technical-readiness-review.md` | Adds crawlability, metadata, canonical, structured data, links, performance, and accessibility readiness categories without running Lighthouse. |
| `squawk-style-migration-risk-review.md` | Adds migration risk categories around blocking changes, indexes, constraints, RLS, backfill, rollback, and generated type drift without running Squawk. |
| `playwright-style-fixture-strategy.md` | Adds deterministic local fixture and golden snapshot concepts without browser automation. |
| `semgrep-codeql-style-static-review-heuristics.md` | Adds rule-like findings and source/sink thinking without running scanners. |
| `parser-library-extraction-boundary-patterns.md` | Adds raw preservation, normalized output, extraction version, malformed fixtures, content/source separation, and URL normalization boundaries. |
| `evals.external-deep-patterns-additions.json` | Adds future eval cases for schema contracts, source-to-claim fixtures, readiness review, migration review, dependency review, browser rejection, static heuristics, and parser fixtures. |

## What Improves GEORADER

| File | Improvement |
|---|---|
| `external-eval-patterns-for-query-coverage.md` | Adds prompt set, persona, buyer-stage, provider/mode, citation opportunity, and competitor-gap coverage review. |
| `external-source-to-claim-patterns-for-geo-analysis.md` | Adds citation support status, source relevance, claim relation, evidence ledger, and citation-gap framing. |
| `external-technical-readiness-patterns-for-reporting.md` | Adds crawlability, schema readiness, metadata readiness, source-page clarity, canonical risk, and no-guarantee reporting boundaries. |
| `evals.external-deep-patterns-additions.json` | Adds future eval cases for query coverage, score-as-proof rejection, source-to-claim readiness, technical readiness, guarantee rejection, and quality-gate handoff. |

## Apply Order

1. Apply quality-gate references first, because this skill blocks unsafe external claims before publication.
2. Apply implementation-architect references second, because this skill reviews schema, parser, source-to-claim, technical readiness, migration, static-review, and fixture design.
3. Apply GEORADER references third, because strategy should inherit safer coverage and evidence framing after gates are defined.

## Non-Goals

This package does not:

- approve external dependencies.
- approve package installation.
- approve tool execution.
- approve source-code copying.
- approve browser automation.
- approve database access or migrations.
- approve production writes.
- prove external tools are safe.
- claim source-code, dependency, install, or legal license audits were completed.

## Remaining Weakness Before Applying

The v0.2 research package inspected public docs and public repository pages only. Before direct tool adoption, RECORA would still need source-code review, dependency audit, install behavior review, security advisory review, data privacy review, and legal license review.
