# Source To Claim Status Review Design

## CONFIRMED_FROM_FILES

- `citations.supports_claim` exists as nullable boolean.
- Migration comments state null means support has not been verified.
- Candidate output normalizes null or missing support to `unknown`.
- No `source_to_claim_status` field was found in candidate JSON search.
- No dedicated source-to-claim review table was confirmed in inspected migrations.

## USER_PROVIDED_CONTEXT

- Source-to-claim status should use `supported`, `partially_supported`, `contradicted`, `unrelated`, `unknown`, and `not_reviewed`.

## NEEDS_VERIFICATION

- The source-to-claim review workflow is not confirmed.
- Exact persistence target for source-to-claim decisions is not confirmed.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Add source-to-claim status as a first-class review artifact linked to answer claim, citation row, source URL, source excerpt, reviewer or parser version, and review timestamp.
- Treat `supports_claim` as low-level or legacy field unless a richer review object exists.
- Require citation-backed candidate generation to emit held/review-needed state when status is `unknown` or `not_reviewed`.
- Preserve claim text and claim hash separately from citation URL.

## DO_NOT_ASSUME

- Do not collapse unknown support into supported.
- Do not treat citation count, domain match, or citation status as claim support.
- Do not let source-to-claim review decide quality-gate publication state.
