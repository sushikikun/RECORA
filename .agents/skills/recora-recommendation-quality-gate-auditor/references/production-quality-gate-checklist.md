# Production Quality Gate Checklist For v0.3-real

Use this checklist before any Recora recommendation candidate is shown to clients.

## Candidate Identity

- Candidate ID is present.
- Candidate type is present.
- Original priority is present.
- Original confidence is present.
- Original save decision is present.
- Original quality score is present.

## Evidence Traceability

- Measurement run ID is present.
- Aggregate run ID is present when used.
- Prompt count and observation count are present.
- Conversation IDs or observation rows are traceable.
- Search mode is present.
- Primary evidence scope is clear.

## Actual v0.3-real Checks

- For brand visibility: confirm absent observations, prompt spread, and search-mode spread.
- For citation evidence: confirm `supports_claim` status before treating citations as proof.
- For case-study evidence: confirm sample size and matched clues before making a page-gap claim.

## Source Integrity

- Citation URL exists in supplied data.
- Source domain and source type are known or marked for review.
- Source supports the claim before client-facing use.
- `supports_claim=unknown` is not treated as verified.
- Citation presence is not treated as citation support.

## Claim Safety

- No AI citation guarantee.
- No AI recommendation guarantee.
- No ranking, traffic, conversion, or revenue guarantee.
- No total AI invisibility claim from partial observations.
- No case-study or page-gap claim from a single clue.
- No competitor dominance claim without measured competitor evidence.

## Risk Threshold

- `auto_publish`: score >= 85, direct measurement, low client-facing risk, safe wording.
- `hold`: score 50-84, or source/mapping/sample review needed.
- `hold`: score 25-49 only when the candidate is explicitly an internal verification item.
- `suppress`: hallucinated evidence, citation misuse, seed contamination, unsafe guarantee, or secret/implementation drift.

## Final Client Display Check

- Is the recommendation true to measured evidence?
- Is the wording scoped to the actual run?
- Is the claim useful and actionable?
- Are verification needs clear?
- Is the Recora metric caution preserved?
- Are secrets and implementation instructions absent?
