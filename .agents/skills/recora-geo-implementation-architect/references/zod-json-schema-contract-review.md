# Zod / JSON Schema Contract Review

Purpose: borrow schema-validation patterns for RECORA candidate and quality-gate payload review without mandating Zod, Ajv, Valibot, or any validator dependency.

## Core Rule

Use schema-validation patterns as review heuristics. Do not prescribe a library unless a later implementation task explicitly approves dependency selection, license review, and code changes.

## Contract Review Checklist

| Area | Review expectation |
|---|---|
| Strict candidate JSON | Candidate payload should reject unknown unsafe states and preserve raw evidence separately. |
| Discriminated candidate types | `candidate_type` should identify the recommendation family, such as `technical_seo`, `citation_gap`, `content_gap`, `schema_opportunity`, `competitor_gap`, `trust_risk`, or `implementation_risk`. |
| Enum validation | Status fields should use known values and fail closed on unknown values. |
| `schema_version` | Required for payload compatibility and migrations. |
| `generator_version` | Required for recommendation generator traceability. |
| `parser_version` | Required when parser or extraction output influences the candidate. |
| `review_version` | Required for quality-gate decision policy traceability. |
| Parse-safe boundaries | Treat external provider/tool payloads as unknown until validated; never coerce provider failure into absence evidence. |

## Suggested Enum Families

| Enum | Values |
|---|---|
| `source_to_claim_status` | `supported`, `partially_supported`, `contradicted`, `unrelated`, `unknown`, `not_reviewed` |
| `provider_status` | `answered`, `empty`, `refusal`, `timeout`, `rate_limited`, `blocked`, `provider_error`, `not_run` |
| `seed_risk` | `none`, `possible`, `confirmed`, `unknown` |
| `gate_decision` | `auto_publish`, `hold`, `suppress` |
| `extraction_status` | `complete`, `partial`, `empty`, `malformed`, `blocked`, `not_inspected` |

## Failure Modes To Flag

- missing evidence IDs.
- missing schema version.
- unknown status coerced to a valid value.
- parser-derived candidate without parser version.
- source/citation recommendation without source-to-claim status.
- provider timeout treated as brand absence.
- external pattern influence unlabeled.

## Review Output

Implementation review should state:

- contract issue.
- affected payload or handoff.
- risk to quality gate.
- minimum schema or enum change needed.
- fixture case that would catch the issue.
