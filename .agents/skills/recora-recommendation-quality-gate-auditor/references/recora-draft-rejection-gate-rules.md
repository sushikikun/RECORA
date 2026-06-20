# RECORA Draft Rejection Gate Rules

## Purpose

Use this reference when a candidate reaches the quality gate even though georader should have produced `draft_time_rejection`.

## Core Rule

If a draft-time rejection case reaches quality gate, suppress it.

Do not polish unsafe material into a client-facing recommendation.

## Hard Suppress Cases

Suppress when the candidate contains any of:

- README-as-proof
- repository marketing claim used as proof
- guaranteed AI citation
- guaranteed AI visibility
- guaranteed ranking, traffic, revenue, ROI, or recommendation
- API key request
- login flow
- credential, cookie, token, `.env`, or secret request
- browser automation dependency
- UI automation dependency
- headless browser dependency
- CAPTCHA workaround
- provider Terms of Service risky workflow
- external paid service dependency presented as required path
- no RECORA measurement evidence but client-facing claim requested
- implementation, deployment, backend, database, LP, CLI, or production action from inside the skill

## No Safe Rewrite For Hard Suppress

For hard suppress cases, do not provide a normal client-facing rewrite.

Allowed safe output:

- an internal verification note
- a regeneration instruction
- a statement that direct RECORA measurement evidence is required

Example:

"Suppress. This cannot be rewritten for client display because it relies on README-as-proof, secret/API/login/browser automation dependencies, or guarantee language. Regenerate from direct RECORA measurement evidence."

## Candidate C Pattern From Smoke Test

Candidate C must suppress if it reaches the gate:

- README-as-proof
- browser automation
- API key flow
- login flow
- secrets
- guaranteed AI citation
- no RECORA measurement evidence

Primary reason:

Unsupported and unsafe claim with hard suppress risks.

