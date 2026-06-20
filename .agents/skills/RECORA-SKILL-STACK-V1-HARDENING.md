# RECORA Skill Stack v1.0 Hardening

## Scope And Evidence

- Target: RECORA project-local skill stack hardening package.
- Based on: completed review-only smoke test for Candidate A, Candidate B, and Candidate C patterns.
- Output type: patch package only.
- Not included: existing skill edits, app code changes, backend/database/LP/CLI/production changes, crawler/browser automation, API keys, credentials, cookies, secrets, login sessions, or external repository source code.

## Current Stack Rule

- `georader-ai-search-auditor` creates strategy analysis, query maps, evidence interpretation, and recommendation candidate drafts.
- `recora-recommendation-quality-gate-auditor` decides `auto_publish`, `hold`, or `suppress`.

This package preserves that boundary.

## Smoke Test Findings Encoded

### Candidate A

Worked as intended:

- direct measurement evidence
- non-branded query
- `no_seed`
- known provider status
- scoped wording
- quality gate could reasonably choose `auto_publish` in smoke-test context

Hardening outcome:

- require all evidence-ledger fields
- keep georader language as `candidate_draft` or `review_required`
- quality gate may auto-publish only when evidence is direct, traceable, and production-valid

### Candidate B

Worked but must stay hold:

- citation opportunity / competitor citation gap
- citation count present
- source-to-claim status unknown
- competitor seeded
- single observation
- must not become client-facing proof

Hardening outcome:

- georader marks `review_required`
- georader avoids impact claims
- quality gate holds until source verification and scoped wording exist

### Candidate C

Exposed a georader weakness:

- README-as-proof
- browser automation
- API key flow
- login flow
- secrets
- guaranteed AI citation
- no RECORA measurement evidence

Hardening outcome:

- georader should output `draft_time_rejection`, not a candidate draft
- quality gate should suppress if it reaches the gate

## Files Added In This Package

### georader-ai-search-auditor

- `references/recora-v1-candidate-draft-hard-requirements.md`
- `references/recora-draft-time-rejection-rules.md`
- `references/recora-citation-gap-client-facing-rules.md`
- `SKILL.md.patch-notes.md`
- `evals.v1-hardening-additions.json`

### recora-recommendation-quality-gate-auditor

- `references/recora-v1-quality-gate-hard-requirements.md`
- `references/recora-draft-rejection-gate-rules.md`
- `references/recora-citation-gap-hold-rules.md`
- `SKILL.md.patch-notes.md`
- `evals.v1-hardening-additions.json`

## v1 Product/Data Model Implications

- Candidate drafts need a mandatory evidence-ledger contract.
- Draft-time rejection should be a first-class output state before quality gate.
- Citation gaps need source-to-claim verification before publication.
- Provider status must be stored separately from evidence quality.
- Synthetic fixture evidence must be marked separately from production evidence.
- Quality-gate decisions should be stored separately from georader draft fields.

## Remaining Weakness Before Skill Body Application

- The package is not yet merged into live skill bodies.
- Eval JSON files need integration with the actual local eval harness.
- Current live outputs may still allow unsafe draft construction unless these references are applied.
- Real production fixtures are still needed to calibrate score thresholds beyond synthetic smoke-test cases.

