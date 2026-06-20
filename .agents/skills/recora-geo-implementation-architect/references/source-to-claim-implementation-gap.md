# Source-To-Claim Implementation Gap

## CONFIRMED_FROM_FILES

- The generator has `supports_claim` on citation rows.
- `normalizeSupportsClaim()` maps only `"true"` and `"false"` directly; all other values become `"unknown"`.
- The citation candidate is created when web-search citation details exist and unknown supports-claim details exist.
- The inspected JSON citation candidate has:
  - `citation_count: 26`
  - `supports_claim_values: ["unknown"]`
  - `supports_claim_unknown_count: 26`
  - `primary_evidence_scope: "web_search_citations"`
- The code and output include cautionary language that URL existence is not claim support.

## USER_PROVIDED_CONTEXT

- The v0.3 patch should focus especially on `source_to_claim_status` and citation count vs citation support.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Whether a separate source-to-claim review exists elsewhere is NEEDS_VERIFICATION.
- Whether `supports_claim` is manually reviewed, parser-derived, or provider-derived is NEEDS_VERIFICATION.
- Source freshness and retrieval date behavior were not verified.

## RECOMMENDED_ARCHITECTURE

- Add explicit `source_to_claim_status` to candidate contract:
  - `supported`
  - `partially_supported`
  - `contradicted`
  - `unrelated`
  - `unknown`
  - `not_reviewed`
  - `not_applicable`
- Keep `supports_claim_values` as low-level citation field if needed, but do not use it as the publication contract.
- Add `source_to_claim_review_refs` to citation candidates.
- Gate citation candidates with `unknown` or `not_reviewed` as hold by default.
- Add a separate review object recording:
  - reviewed source URL
  - answer claim
  - source excerpt reference
  - reviewer or parser version
  - status
  - reviewed_at
  - needs_verification

## DO_NOT_ASSUME

- Do not assume citation count proves source support.
- Do not assume `supports_claim_values: ["unknown"]` is safe for client-facing publication.
- Do not assume domain/source type classification proves relevance.
