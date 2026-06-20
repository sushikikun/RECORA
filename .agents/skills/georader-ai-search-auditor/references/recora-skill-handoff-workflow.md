# Recora Skill Handoff Workflow

Use this workflow when Recora strategy findings need to become recommendation candidates.

## Step 1: Strategy And Drafting

`georader-ai-search-auditor` reviews measurement data, AI answers, SERP / AI gaps, query maps, citation readiness, technical discoverability, content architecture, and competitor gaps.

It may create recommendation candidate drafts with evidence scope and risk flags.

## Step 2: Quality Gate

`recora-recommendation-quality-gate-auditor` reviews each candidate and decides:

- `auto_publish`
- `hold`
- `suppress`

## Step 3: Client-Facing Recommendations

Only candidates that pass the quality gate can become client-facing recommendations.

## Step 4: Hold Candidates

`hold` candidates become internal review tasks. They need missing measurement IDs, source-to-claim checks, seed review, citation review, deduplication, or safer wording before publication.

## Step 5: Suppress Candidates

`suppress` candidates are not shown to clients. Log them as rejected or risky with the reason, such as overclaim, hallucinated evidence, citation misuse, seed contamination, generic advice, secret request, or implementation drift.

## Handoff Output

When handing off, include:

- candidate draft fields.
- evidence labels.
- known missing fields.
- risk flags.
- suggested priority and confidence.
- client-facing draft, if safe.
- remeasurement signal.

Do not include publication decisions such as `auto_publish`.
