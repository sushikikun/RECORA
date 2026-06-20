# Quality Gate Policy

Use this policy to decide whether a recommendation candidate generated from Recora observation data should be `auto_publish`, `hold`, or `suppress`.

## Core Principle

A recommendation can be displayed to a client only when its claim strength matches its evidence. The gate should prefer a useful `hold` over a risky `auto_publish`, and a clear `suppress` over polishing a misleading candidate.

## auto_publish

Use `auto_publish` only when all are true:

- evidence is direct and traceable to supplied Recora measurement or verified source material.
- the recommendation is specific, actionable, and tied to the measured issue.
- no AI citation, AI recommendation, ranking, traffic, conversion, or revenue guarantee is present.
- no seed contamination is detected.
- no citation misuse, hallucinated source, stale-source misuse, or fake official claim is present.
- no sensitive, reputational, legal, payment, secret, or implementation risk is present.
- client-facing wording is calm, precise, and evidence-scoped.
- quality_score is high, usually 80 or above.
- confidence is high or well-supported medium.

## hold

Use `hold` when the candidate may be useful but is not ready for client display:

- evidence direction is plausible but incomplete.
- source status, source freshness, query date, platform, location, or competitor measurement is unclear.
- wording needs softening.
- confidence is medium or low.
- duplicate or near-duplicate risk exists.
- the candidate is too broad but can be made specific.
- source support is indirect and needs human review.
- quality_score is usually 50 to 79.

`hold` should include exact edits or missing evidence needed to become publishable.

## suppress

Use `suppress` when a candidate should not be displayed or reused without regeneration:

- unsupported claim.
- invented evidence.
- hallucinated source.
- seed contamination.
- citation misuse.
- direct guarantee of AI ranking, citation, recommendation, traffic, conversion, or revenue.
- factually wrong or misleading.
- not connected to measurement data.
- too generic to be useful.
- asks for secrets, private credentials, login sessions, or unredacted sensitive logs.
- drifts into implementation, DB writes, production changes, or app modification.
- quality_score is usually below 50, or any hard suppress override applies.

## Hard Suppress Overrides

Suppress regardless of score when the candidate:

- invents a source, citation, client fact, AI answer, SERP result, or competitor result.
- claims official endorsement or official standard status without verified official source support.
- says a crawler setting, schema, content format, or source guarantees AI citation or ranking.
- uses seeded prompts as proof of organic visibility.
- requests `.env`, API keys, cookies, credentials, secrets, or private tokens.
- instructs implementation changes inside the quality gate task.

## Decision Output

Always include:

- decision.
- quality_score.
- confidence.
- client-facing display risk.
- evidence labels.
- primary reason.
- blocking issues.
- required edits or evidence.
- safe client-facing wording when usable.
