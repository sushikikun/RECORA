# Citation Support Review Workflow

## CONFIRMED_FROM_FILES

- Candidate output has a citation evidence review candidate rather than a direct recommendation when citation support is unknown.
- `save-recommendation-candidates.ts` can plan insertion for candidates with `display_decision: "show"`, storing evidence metadata into `recommendations`.
- Existing quality-gate responsibility remains separate from the implementation architect.

## USER_PROVIDED_CONTEXT

- The implementation architect must not decide `auto_publish`, `hold`, or `suppress`.
- Citation-backed recommendations require source-to-claim review before client-facing use.

## NEEDS_VERIFICATION

- Whether saved `recommendations` are client-facing in production is not confirmed from this patch.
- Whether quality gate review persistence exists elsewhere is not confirmed.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Use a staged workflow: extract citation, normalize URL/domain, link to claim, review source support, then hand candidate to quality gate.
- Require each citation support review to store status, reason, source excerpt, claim excerpt, review version, reviewer type, and uncertainty flags.
- Hold citation-backed candidates when all supporting sources are unknown, not reviewed, unrelated, contradicted, malformed, or unreachable.
- Keep implementation review focused on data structures, testability, and file-impact maps.

## DO_NOT_ASSUME

- Do not treat a display candidate as approved.
- Do not treat a citation review candidate as a published recommendation.
- Do not let the implementation architect make final publication decisions.
