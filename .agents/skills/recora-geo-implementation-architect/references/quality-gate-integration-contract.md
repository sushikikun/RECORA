# Quality Gate Integration Contract

## Input To Quality Gate

- complete candidate payload
- evidence refs
- seed risk
- provider status
- source-to-claim status
- client-facing draft
- risk flags

## Output From Quality Gate

- `auto_publish`, `hold`, or `suppress`
- `quality_score`
- `confidence`
- `risk_level`
- `evidence_grade`
- `flags`
- `reviewer_comment`
- safe rewrite
- blocking reason
- review version
- `reviewed_at`

## Rules

- Candidate generation and gate review are separate stages.
- Gate output must be persisted separately from candidate source data.
- Re-running a gate should preserve review history.
- Publication should use an explicit approved gate review.
- Changing evidence should invalidate or supersede prior gate decisions.
- The implementation architect can review gate integration but must not decide publication.

## Review Questions

- Is quality-gate history append-only or supersession-safe?
- Can a published recommendation point to the exact approved review?
- Does evidence change invalidate stale approvals?
- Are safe rewrites stored as gate output, not raw candidate facts?
- Can `hold` and `suppress` reasons be reported internally without confusing clients?
