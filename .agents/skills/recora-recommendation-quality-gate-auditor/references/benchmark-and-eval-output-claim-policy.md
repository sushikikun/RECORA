# Benchmark And Eval Output Claim Policy

Purpose: define how RECORA quality gate should treat OpenAI Evals, Ragas, promptfoo, Garak, Lighthouse, and similar benchmark or evaluation outputs.

## Core Boundary

Eval outputs can support internal regression review. They cannot prove client AI visibility, ranking, citation, traffic, conversion, or revenue.

## Rules

| Rule | Gate effect |
|---|---|
| External eval score is not RECORA measurement evidence. | Hold if used as proof; suppress if client-facing overclaim. |
| Benchmark result cannot justify `auto_publish`. | `auto_publish` still requires RECORA evidence and safe wording. |
| Ragas-like score does not prove source support without source review. | Hold until claim-to-source relation is inspected. |
| Garak-style result does not certify safety. | Treat as internal risk signal only. |
| Lighthouse-style score does not prove AI visibility. | Treat as technical readiness context only. |
| Promptfoo/OpenAI Evals-style matrix does not prove market coverage. | Treat as internal coverage structure only. |

## Allowed Uses

- local fixture design.
- regression case shape.
- pass/fail expectation format.
- rubric dimensions.
- source-to-claim review vocabulary.
- safe rewrite comparison.
- internal quality trend tracking.

## Disallowed Uses

- client-facing "AI visibility score" based on external eval output.
- official GEO score claim.
- guaranteed citation or ranking claim.
- benchmark superiority claim without inspected evidence.
- replacing RECORA observation data with external tool output.

## Decision Examples

| Candidate | Decision |
|---|---|
| "Ragas score is high, so publish this as a source-supported recommendation." | `hold` until source support is reviewed. |
| "Garak found no issues, so this external skill is safe." | `suppress` as overreliance. |
| "Use an OpenAI Evals-like fixture to regression-test hold/suppress decisions." | Internal-only allowed. |
| "Lighthouse SEO score proves AI visibility is low." | `suppress`. |
