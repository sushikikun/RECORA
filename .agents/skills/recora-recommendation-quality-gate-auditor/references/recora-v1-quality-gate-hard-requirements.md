# RECORA v1 Quality Gate Hard Requirements

## Purpose

Use this reference when `recora-recommendation-quality-gate-auditor` audits RECORA candidate drafts under v1 hardening.

The quality gate owns final publication decisions. It must block auto-publication when evidence-ledger fields are missing or when claim strength exceeds evidence.

## Auto-Publish Blocking Missing Fields

Do not `auto_publish` when any publication-critical field is missing, unknown, or `NEEDS_VERIFICATION`:

- `measurement_run_id`
- prompt text, prompt ID, or prompt category
- provider
- provider status
- seed terms or seed contamination risk
- source-to-claim status when citation/source claims are involved
- evidence scope
- citation URLs/source domains when citation claims are involved
- observation count
- client-facing scoped wording

## Measurement Run Requirement

Missing `measurement_run_id` blocks `auto_publish`.

Allowed outcomes:

- `hold` when the candidate is otherwise plausible and can be verified.
- `suppress` when the candidate invents evidence, guarantees outcomes, or has hard-risk flags.

## Prompt / Provider / Seed / Source-To-Claim Requirement

Missing prompt, provider, seed risk, or source-to-claim status blocks `auto_publish`.

For citation/source candidates, `source_to_claim_status` must be:

- `supported`, or
- clearly scoped as partial with safe wording and human-reviewed evidence.

Unknown or not_checked source-to-claim status should normally be `hold`.

## Provider Status Rule

`provider_status` cannot be evidence quality.

Even `supported` only means a measurement or review method exists. It does not prove:

- the answer is correct
- the source supports the claim
- the recommendation is safe
- the candidate should be published

## Client-Facing Wording Requirement

Client-facing recommendations require scoped wording:

- tie the claim to the measured run/query/provider
- avoid universal claims
- avoid AI citation/ranking/revenue guarantees
- state verification needs when evidence is incomplete
- use calm, non-alarmist language

## Synthetic Fixture Rule

`synthetic_fixture_only` must not be treated as production evidence.

Use synthetic fixtures for evals and smoke tests only. If a candidate relies only on synthetic fixture evidence:

- do not auto_publish for real client display
- mark as internal/eval-only
- require production RECORA measurement before client-facing use

## Candidate A Pattern From Smoke Test

Direct measurement with scoped wording can be publishable in a smoke test when all required evidence exists:

- direct measurement evidence
- non-branded query
- `no_seed`
- known provider status
- scoped wording
- no secret/automation/guarantee risk

For real client display, confirm the run is production evidence, not synthetic-only.

