# Golden Judgment Examples For Actual Candidates

Use these as human-review-style expected judgments for the 3 actual candidates found in the copied files.

## `rec-23677594-brand-visibility-gap`

- Final decision: `auto_publish`
- quality_score: 85
- confidence: medium
- risk_level: low
- evidence_grade: `DIRECT_MEASUREMENT`
- Reasons:
  - The candidate is based on actual Recora measurement data.
  - It uses 10 absent observations across 5 prompts and both no-search and web-search modes.
  - It does not use citations as primary evidence.
  - The original caution already limits the claim to Recora's observed scope and avoids official-platform language.
- Flags:
  - `small_sample`
  - `not_official_platform_metric`
  - `avoid_total_absence_claim`
- Safe client-facing rewrite:
  - "In this Recora observation set, the brand was not clearly shown in some relevant questions. Treat this as a measured visibility gap within the tested query set, then review the affected prompts and strengthen the corresponding comparison, selection-criteria, FAQ, or proof pages."

## `rec-23677594-citation-evidence-review`

- Final decision: `hold`
- quality_score: 76
- confidence: medium
- risk_level: medium
- evidence_grade: `DIRECT_MEASUREMENT` for citation presence; `NEEDS_VERIFICATION` for claim support
- Reasons:
  - The 26 citation rows, 26 unique URLs, and 20 domains are directly measured.
  - `supports_claim` is unknown for all 26 rows.
  - The candidate is explicitly a citation verification item, not an improvement recommendation.
  - Auto-publishing could invite citation misuse if URLs are treated as proof.
- Flags:
  - `supports_claim_unknown`
  - `citation_integrity_review_required`
  - `source_to_claim_mapping_missing`
- Safe client-facing rewrite:
  - "The observed AI answers included citation URLs, but each source still needs review to confirm whether it supports the answer's claim. Treat this as a citation validation task before using the sources as recommendation evidence."

## `rec-23677594-case-study-evidence-gap`

- Final decision: `hold`
- quality_score: 45
- confidence: low
- risk_level: medium
- evidence_grade: `SUPPORTED_INFERENCE`
- Reasons:
  - The candidate is based on only 1 observation and 1 matched clue.
  - It may point to a useful proof-asset review, but it does not prove a site gap.
  - The generated wording correctly says not to conclude page shortage or improvement effect.
  - It should remain a human-review item until more observations or page evidence exist.
- Flags:
  - `low_sample`
  - `single_prompt_scope`
  - `proof_gap_not_confirmed`
  - `client_display_needs_review`
- Safe client-facing rewrite:
  - "One observed answer suggested that evidence or case-study information may need additional confirmation. Before presenting this as a finding, verify whether relevant case studies, adoption examples, or usage evidence exist on the site and whether AI answers can cite them."

## Distribution

- `auto_publish`: 1
- `hold`: 2
- `suppress`: 0

No actual candidate required suppression. Suppress behavior should still be covered by v0.3-real evals using risky variants derived from the actual candidate structures.
