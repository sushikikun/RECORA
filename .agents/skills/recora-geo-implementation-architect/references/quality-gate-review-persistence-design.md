# Quality Gate Review Persistence Design

## CONFIRMED_FROM_FILES

- Candidate output contains `display_decision: "show"` for inspected candidates.
- Candidate output contains `should_save_to_recommendations: "review_required"` for inspected candidates.
- No `quality_gate_reviews` table or equivalent migration was found.
- Existing `recommendations.status` enum has `open`, `planned`, `done`, and `dismissed`; it does not encode `auto_publish`, `hold`, or `suppress`.

## USER_PROVIDED_CONTEXT

- The recommendation quality-gate skill owns final publication quality decisions.
- The implementation architect must refuse to decide `auto_publish`, `hold`, or `suppress`.

## NEEDS_VERIFICATION

- Actual quality-gate persistence is absent from the inspected schema.
- Whether quality-gate outcomes are stored elsewhere in application code is not known from the snapshot.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Persist quality-gate reviews in a separate audit table or equivalent immutable artifact.
- Link each review to a candidate ID, candidate schema version, evidence payload hash, reviewer skill/version, decision, reasons, risk flags, and reviewed timestamp.
- Keep gate review output separate from candidate generation output and final recommendation publication.
- Allow multiple reviews per candidate with a latest-review pointer or queryable ordering.
- Store rejected/suppressed candidates rather than dropping them.

## DO_NOT_ASSUME

- Do not treat `display_decision` as approval.
- Do not treat `should_save_to_recommendations: review_required` as approval.
- Do not use `recommendations.status` as a hidden gate decision without explicit mapping and migration evidence.
