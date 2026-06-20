# RECORA Citation Gap Hold Rules

## Purpose

Use this reference when auditing citation opportunities, competitor citation gaps, source domain gaps, source type gaps, or citation-count-based candidates.

## Core Rule

Citation gaps are hypotheses until source verification is complete.

They can be useful, but they do not prove impact, future citation, ranking, revenue, or broad AI visibility.

## Hold Rules

Use `hold` when:

- `citation_count` is present but `source_to_claim_status` is missing.
- `source_to_claim_status` is `unknown`.
- `source_to_claim_status` is `not_checked`.
- competitor was cited and client was absent, but prompt/provider/date/source evidence is incomplete.
- `seed_contamination_risk` is `competitor_seeded` and `observation_count` is 1.
- source domain gap is plausible but not verified.
- source type gap is inferred from limited evidence.
- wording can be made safe after verification.

## Suppress Rules

Use `suppress` when:

- citation count is treated as proof of correctness or impact.
- competitor citation is generalized to all AI search without evidence.
- the candidate guarantees citation, ranking, traffic, revenue, or recommendation.
- source-to-claim evidence contradicts the recommendation.
- the candidate requires scraping, crawling, browser automation, API keys, credentials, login, paid services, or implementation.

## Publishability Conditions

A citation opportunity can become publishable only after:

- prompt/query is known
- provider/platform is known
- date or measurement run is known
- seed risk is known and acceptable for the claim
- source-to-claim status is verified
- source freshness/relevance is checked when material
- wording uses opportunity/gap/review language
- no impact guarantee is present

## Candidate B Pattern From Smoke Test

Candidate B must remain `hold` when it has:

- citation opportunity or competitor citation gap
- citation count present
- `source_to_claim_status: unknown`
- `competitor_seeded`
- single observation
- client absent

Required evidence to move beyond hold:

- source-to-claim verification
- broader or repeated measurement if making broader visibility claims
- scoped wording limited to the observed query/provider/date

