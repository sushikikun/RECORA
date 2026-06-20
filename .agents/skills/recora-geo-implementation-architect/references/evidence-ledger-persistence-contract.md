# Evidence Ledger Persistence Contract

## Code-Facing Evidence Ledger Fields

- `evidence_id`
- `measurement_run_id`
- `run_item_id`
- `prompt_id`
- `prompt_text`
- `prompt_category`
- `persona`
- `buyer_stage`
- `provider`
- `provider_status`
- `search_mode`
- `target_brand`
- `seed_terms`
- `seed_contamination_risk`
- `answer_ref`
- `answer_excerpt`
- `mention_refs`
- `citation_refs`
- `source_domain_refs`
- `source_to_claim_status`
- `evidence_scope`
- `confidence`
- `parser_version`
- `schema_version`
- `created_at`
- `needs_verification`

## Rules

- Never invent unavailable IDs.
- `unknown` is distinct from absent.
- Adapter failure is distinct from valid absence.
- Evidence records must be traceable back to raw measurement data.
- Evidence scope must state what the evidence can and cannot support.
- Parser and schema versions must be available for replay and audit.
- Evidence ledger records should be append-only or superseded rather than silently overwritten when practical.

## Review Questions

- Can a reviewer open the raw response from an evidence record?
- Can a candidate list all evidence records it uses?
- Are seed terms and prompt text available for contamination review?
- Are source-to-claim statuses normalized and queryable?
- Are `needs_verification` reasons specific enough for action?
