# Recommendation Candidate Schema V1 Proposal

## CONFIRMED_FROM_FILES

- Candidate JSON currently uses `id`, `type`, `priority`, `summary`, `rationale`, `evidence`, `confidence`, `quality_score`, `display_decision`, `customer_facing_caution`, `should_save_to_recommendations`, `save_reason`, and `suggested_next_action`.
- Candidate JSON evidence currently includes run IDs, prompt IDs, conversation IDs, run item IDs, topics, personas, search modes, citation URLs/domains/details, support values, source domain types, observation rows, citation rows, and DB write status.
- Candidate JSON does not expose explicit `schema_version`, `generator_version`, `parser_version`, or `review_version`.
- No migration confirms a `recommendation_candidates` table.

## USER_PROVIDED_CONTEXT

- v0.4 should strengthen DB/schema calibration and avoid treating candidate JSON fields as DB columns unless confirmed.

## NEEDS_VERIFICATION

- Exact target DB columns for candidate persistence are unconfirmed.
- Whether candidates should persist as normalized columns, JSONB payload, or both requires design approval.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

For a v1 candidate persistence contract, require these logical fields even if physical columns are still design-stage:

- Stable candidate identity: candidate ID, project ID, source measurement run ID, aggregate run ID when present, candidate type, schema version, generator version.
- Evidence lineage: prompt IDs, run item IDs, conversation IDs, citation IDs, source domain IDs, evidence scope, evidence ledger references.
- Risk and review flags: source-to-claim status, seed contamination risk, client-facing risk flags, needs human review.
- Display draft fields: title, summary, rationale, caution, priority suggestion, confidence suggestion, quality score suggestion.
- Gate handoff fields: gate input payload hash, gate status, latest gate review ID, publication eligibility state.
- Regeneration controls: idempotency key, content hash, superseded-by ID, generated at, generator config hash.

## DO_NOT_ASSUME

- Do not persist candidate display fields without preserving evidence references.
- Do not treat quality score as quality-gate approval.
- Do not use `display_decision` as approval.
- Do not let candidates overwrite published recommendations without a gate review record.
