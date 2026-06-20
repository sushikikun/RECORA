# Quality Gate Persistence Gap

## CONFIRMED_FROM_FILES

- Current candidate outputs include `should_save_to_recommendations: "review_required"`.
- Current candidate outputs include `display_decision: "show"`.
- Current candidate outputs include `quality_score`.
- No inspected candidate output contains a `quality_gate_review` object.
- No inspected candidate output contains `auto_publish`, `hold`, or `suppress`.
- `RECORA-SKILL-STACK.md` says quality gate decides `auto_publish`, `hold`, or `suppress`.
- `RECORA-SKILL-STACK-V1-HARDENING.md` says quality-gate decisions should be stored separately from georader draft fields.

## USER_PROVIDED_CONTEXT

- The v0.3 patch should focus on quality-gate handoff gaps and quality-gate review persistence.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Whether production has a `quality_gate_reviews` table or equivalent remains NEEDS_VERIFICATION.
- Whether `display_decision` is user-facing remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Treat `quality_score` in the generator as candidate-generation confidence or readiness score unless quality-gate code confirms otherwise.
- Add a separate persisted quality-gate review object:
  - `review_id`
  - `candidate_id`
  - `candidate_schema_version`
  - `decision`
  - `quality_score`
  - `confidence`
  - `risk_level`
  - `evidence_grade`
  - `flags`
  - `reviewer_comment`
  - `safe_rewrite`
  - `blocking_reason`
  - `review_version`
  - `reviewed_at`
  - `supersedes_review_id`
- Publication should require an explicit approved gate review, not generator `display_decision`.
- Re-running the gate should append or supersede, not overwrite history.

## DO_NOT_ASSUME

- Do not assume `display_decision: "show"` is publication approval.
- Do not assume `review_required` is persisted as a formal quality-gate hold.
- Do not allow candidate generation to own `auto_publish`, `hold`, or `suppress`.
