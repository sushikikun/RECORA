# Zod / JSON Schema Validation Patterns

Use this as a contract-first review pattern. Do not mandate Zod, JSON Schema, or any library unless implementation is explicitly approved.

## Safe Patterns To Borrow

- Treat provider, crawler, parser, and candidate payloads as unknown until parsed.
- Preserve invalid raw payloads where safe, with error status and version metadata.
- Use strict candidate schemas for publication-bound objects.
- Use discriminated unions for candidate types and provider result statuses.
- Use enums for controlled decision fields.
- Include schema/version metadata on every generated object.

## Candidate Contract Fields

Review whether payloads include:

- `schema_version`
- `generator_version`
- `parser_version`
- `provider_status`
- `source_to_claim_status`
- `seed_risk`
- `gate_decision`
- `observation_ids`
- `raw_evidence_refs`
- `normalized_url`
- `original_url`
- `created_at`

## Recommended Enum Families

- `provider_status`: `ok`, `empty`, `refusal`, `timeout`, `blocked`, `error`, `unknown`
- `source_to_claim_status`: `directly_supported`, `partially_supported`, `mentions_topic_only`, `unsupported`, `source_unavailable`, `not_reviewed`
- `seed_risk`: `none`, `low`, `medium`, `high`, `contaminated`
- `gate_decision`: `auto_publish`, `hold`, `suppress`
- `candidate_type`: `content_gap`, `citation_gap`, `technical_readiness`, `schema_opportunity`, `source_support`, `implementation_plan_only`

## Review Anti-Patterns

- accepting provider JSON as valid without parse status
- removing unknown fields before preserving raw evidence
- mixing client-facing recommendation text with unvalidated tool output
- omitting version fields
- using generated types as the sole source of truth

## Output Guidance

When advising implementation, say "Zod-like" or "schema-validation pattern" if no library adoption is approved.
