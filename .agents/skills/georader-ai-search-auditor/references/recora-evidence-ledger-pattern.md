# RECORA Evidence Ledger Pattern

## Purpose

Use an evidence ledger when drafting RECORA recommendation candidates. The ledger makes it clear what was measured, what was merely inferred, and what still needs verification before client-facing use.

## Required Mindset

Evidence before advice.

A recommendation candidate should be traceable to measured or supplied evidence. OSS-derived structures can shape the candidate format, but they are not evidence of client outcomes.

## Evidence Ledger Object

Use these fields when available. If a field is unknown, mark it clearly instead of inventing it.

| Field | Meaning | Required handling |
|---|---|---|
| `measurement_run_id` | ID for the measurement or observation run | Use `unknown` if not supplied |
| `run_item_ids` | IDs of answer/crawl/source observations used | Use an empty list only when no observation exists |
| `prompt_id` | ID of the prompt or query template | Use `unknown` if not supplied |
| `prompt_text` | Exact prompt/query text | Required for strong recommendation drafts |
| `prompt_category` | Query taxonomy category | Use the taxonomy reference |
| `persona` | Persona/role used in prompt, if any | Use `none` or `unknown` when applicable |
| `buyer_stage` | Awareness, consideration, decision, retention, or unknown | Do not infer without context |
| `search_mode` | API, product UI, SERP, manual review, crawl/source review, or unknown | Keep method separate from result |
| `provider` | Platform/model/search surface | Use `unknown` if not inspected |
| `provider_status` | Capability status for the provider/platform | Use provider status reference |
| `answer_excerpt` | Short relevant excerpt from supplied answer | Do not invent or over-quote |
| `target_brand_mention_status` | mentioned, cited, recommended, absent, ambiguous, not_inspected, unknown | Separate mention from citation |
| `competitor_mentions` | Competitors mentioned or cited | Include source context when known |
| `citations` | Cited URLs or citation records | Include empty/unknown explicitly |
| `source_domains` | Domains found in citations or source review | Do not treat domains alone as proof |
| `source_to_claim_status` | supported, contradicted, partial, unknown, not_checked | Required before strong claims |
| `seed_terms` | Brand, competitor, category, source, or other seeded terms | Preserve for contamination review |
| `seed_contamination_risk` | brand_seeded, competitor_seeded, category_seeded, persona_seeded, no_seed, unknown | Use query taxonomy reference |
| `evidence_scope` | What the evidence can and cannot support | Keep narrow and explicit |
| `confidence` | high, medium, low | Base on evidence quality, not optimism |
| `needs_verification` | Specific missing checks | Required for incomplete evidence |

## Minimal Candidate Ledger

A candidate should normally include at least:

- `prompt_text`
- `prompt_category`
- `search_mode`
- `provider`
- `provider_status`
- `target_brand_mention_status`
- `competitor_mentions`
- `citations`
- `source_to_claim_status`
- `seed_contamination_risk`
- `evidence_scope`
- `confidence`
- `needs_verification`

If these are missing, draft as internal-only or mark for quality-gate hold.

## Source-To-Claim Status

Use:

- `supported`: cited/source evidence directly supports the recommendation claim.
- `partial`: evidence supports only part of the claim.
- `contradicted`: evidence conflicts with the claim.
- `unknown`: source exists but support was not checked.
- `not_checked`: no source-to-claim review was performed.

Do not use citation count alone as source-to-claim support.

## Evidence Scope Examples

Safe:

- "This single supplied observation shows a competitor citation gap for this query and provider."
- "This technical-readiness issue may affect source clarity; AI citation impact is unverified."
- "This OSS pattern supports candidate structure only, not client evidence."

Unsafe:

- "The client is invisible across AI search."
- "Adding this source will make ChatGPT cite the client."
- "This repository proves the tactic works."

## Handoff To Quality Gate

Every drafted candidate should include quality-gate notes:

- evidence strengths
- missing fields
- seed risk
- provider status concern
- citation/source support status
- whether the wording is internal-only or potentially client-facing

