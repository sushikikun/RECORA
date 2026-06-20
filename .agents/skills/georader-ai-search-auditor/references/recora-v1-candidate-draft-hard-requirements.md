# RECORA v1 Candidate Draft Hard Requirements

## Purpose

Use this reference when `georader-ai-search-auditor` drafts RECORA recommendation candidates.

The goal is to prevent under-specified or overconfident candidates from reaching the quality gate. Georader drafts candidate material only; it does not make final publication decisions.

## Required Candidate Status Language

Use:

- `candidate_draft`
- `review_required`
- `draft_time_rejection`

Do not use:

- `auto_publish`
- `hold`
- `suppress`
- "approved"
- "ready to publish"

Those decisions belong to `recora-recommendation-quality-gate-auditor`.

## Mandatory Candidate Draft Fields

Every candidate draft must include these fields. If a value is unavailable, mark it as `unknown` or `NEEDS_VERIFICATION` rather than inventing it.

| Field | Required handling |
|---|---|
| `candidate_id` | Use supplied ID. If absent, mark `unknown`; do not invent a production-looking ID. |
| `candidate_type` | Name the observation/recommendation type. |
| `source_skill` | Use `georader-ai-search-auditor`. |
| `measurement_run_id` | Use supplied run ID; otherwise `unknown` and `NEEDS_VERIFICATION`. |
| `prompt_category` | Use RECORA query taxonomy where possible. |
| `persona` | Use supplied persona, `none`, or `unknown`. |
| `buyer_stage` | Use supplied stage or `unknown`; do not infer without basis. |
| `search_mode` | State API/export/manual/source review/supplied fixture/unknown. |
| `provider` | State provider/platform if supplied; otherwise `unknown`. |
| `provider_status` | Use supported/planned/unknown/not_inspected/manual_only/research_only/blocked/disabled. |
| `target_brand` | Use supplied client/brand/entity. |
| `competitors_observed` | List competitors or use an empty list/unknown. |
| `evidence_scope` | State exactly what the evidence can and cannot support. |
| `observation_count` | Use supplied count or `unknown`; do not invent. |
| `absence_count` | Use supplied count or `unknown`. |
| `mention_count` | Use supplied count or `unknown`. |
| `citation_count` | Use supplied count or `unknown`; do not use as proof by itself. |
| `source_domain_count` | Use supplied count or `unknown`. |
| `citation_urls` | List supplied URLs or use an empty list/unknown. |
| `source_to_claim_status` | Use supported/partial/contradicted/unknown/not_checked/not_applicable. |
| `seed_terms` | List brand/competitor/category/persona/source seed terms or use an empty list/unknown. |
| `seed_contamination_risk` | Use brand_seeded/competitor_seeded/category_seeded/persona_seeded/no_seed/unknown. |
| `claim_summary` | Summarize only what the evidence supports. |
| `recommendation_summary` | Draft a scoped action/review recommendation. |
| `client_facing_draft` | Use only if evidence is strong enough for gate review; otherwise `not_allowed_until_verified`. |
| `evidence_grade_suggestion` | Suggest A/B/C/D/F or `NEEDS_VERIFICATION`; quality gate may override. |
| `priority_suggestion` | Suggest P0/P1/P2 or review priority; quality gate may override. |
| `confidence_suggestion` | high/medium/low, based on evidence quality. |
| `risk_flags` | List evidence, seed, provider, source, implementation, secret, or wording risks. |
| `needs_human_review` | true/false; use true for incomplete evidence, citation gaps, or sensitive claims. |
| `remeasurement_signal` | State what should be remeasured or verified next. |

## Draft Rules

- Do not invent IDs, measurements, citations, source domains, competitors, prompts, dates, providers, or outcomes.
- Do not produce final publication decisions.
- Do not call a draft `auto_publish`.
- Do not imply that `provider_status: supported` proves answer quality, citation quality, or publication readiness.
- Mark missing measurement identifiers, prompt text, provider, seed risk, or source-to-claim status as `NEEDS_VERIFICATION`.
- Use candidate-level wording such as "This candidate suggests..." or "Review whether..." instead of client-ready claims when evidence is incomplete.

## Candidate A Pattern From Smoke Test

A direct-measurement candidate may be strong when all are present:

- direct RECORA measurement evidence
- non-branded query
- `no_seed`
- known provider and provider status
- clear scoped absence or visibility gap
- no citation/source misuse
- safe wording

Even then, georader must output `candidate_draft` or `review_required`, not final publication status.

## Missing Field Handling

If a required field is unavailable:

- keep the field present
- set value to `unknown`, `not_checked`, `not_applicable`, or `NEEDS_VERIFICATION`
- add a risk flag
- set `needs_human_review: true` when the missing field affects client-facing safety
- avoid a client-facing draft if measurement identity or evidence basis is missing

