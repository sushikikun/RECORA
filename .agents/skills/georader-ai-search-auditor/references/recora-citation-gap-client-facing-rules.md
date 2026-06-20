# RECORA Citation Gap Client-Facing Rules

## Purpose

Use this reference when drafting candidates from citation opportunities, competitor citation gaps, source domain gaps, source type gaps, or client-mentioned/not-cited observations.

## Core Rule

A citation gap is an opportunity, not proof.

It can justify review and remeasurement. It cannot prove impact, lost visibility, future citation, ranking, revenue, or recommendation.

## Required Evidence For Citation Gap Candidates

Before drafting a citation-gap candidate, include:

- prompt/query text or prompt ID
- prompt category
- provider/platform
- provider status
- date, measurement run ID, or supplied observation reference
- target brand presence status
- competitor cited or mentioned
- citation URLs
- source domains
- source-to-claim status
- seed terms and seed contamination risk
- observation count
- confidence and needed verification

## No Client-Facing Recommendation Yet

If `source_to_claim_status` is `unknown`, `not_checked`, or missing:

- do not provide a client-facing impact claim
- set `needs_human_review: true`
- set `client_facing_draft: not_allowed_until_source_verified`
- use `review_required`
- mark `NEEDS_VERIFICATION`

## Competitor Cited / Client Absent

This pattern requires prompt/provider/date/source evidence.

If the competitor was cited and the client was absent, draft only the scoped observation:

"In this supplied observation, Competitor X was cited for Prompt Y on Provider Z while the client was absent."

Do not generalize to:

- all AI search
- all providers
- all non-branded visibility
- lost revenue
- guaranteed opportunity capture

## Competitor Seeded Or Single Observation

If either is true:

- `seed_contamination_risk: competitor_seeded`
- `observation_count: 1`

Then:

- set `needs_human_review: true`
- use `review_required`
- include a remeasurement signal
- avoid client-facing impact wording

If both are true, the candidate should normally remain internal until source verification and broader measurement exist.

## Safe Wording

Use:

- "citation opportunity"
- "competitor citation gap"
- "source gap"
- "review whether"
- "verify source support"
- "remeasure after validation"
- "may indicate a gap, but impact is not proven"

Avoid:

- "AI will cite"
- "guaranteed visibility"
- "competitor citations prove loss"
- "citation count proves authority"
- "publish this to capture the citation"

## Candidate B Pattern From Smoke Test

Candidate B should remain `review_required` at draft time when it has:

- citation opportunity or competitor citation gap
- citation count present
- `source_to_claim_status: unknown`
- `competitor_seeded`
- single observation

It must not become client-facing proof until source verification and scoped wording are available.

