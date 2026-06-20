# Real Code Test Fixture Plan

## CONFIRMED_FROM_FILES

The inspected real candidate outputs provide fixture seeds for:

- brand visibility gap candidate
- citation evidence review candidate
- case study evidence gap candidate
- citation candidate with 26 citations and unknown support
- read-only generation with unchanged table counts
- `review_required` candidate state
- current schema gaps against stack contract

## USER_PROVIDED_CONTEXT

- The skill should design tests from actual candidate examples.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Existing test framework for the RECORA app was not inspected.
- Whether current artifacts are stable enough for golden fixtures remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

Create fixture groups:

### Candidate Schema Fixtures

- current JSON accepted as legacy fixture
- strict v1/v0.3 contract fixture with aliases added
- missing `schema_version` rejection
- missing `source_to_claim_status` hold
- missing `seed_contamination_risk` hold
- missing `source_skill` warning

### Source-To-Claim Fixtures

- citation count present, all source support unknown
- cited URL exists but source claim not reviewed
- source-to-claim supported
- source-to-claim partially supported
- source-to-claim contradicted

### Parser And Extraction Fixtures

- raw answer contains target brand only as prompt echo
- raw answer contains target brand by substring collision
- alias / Japanese width variation
- URL contains brand but answer text does not
- competitor mention present, target absent
- source domain heuristic classification unknown

### Quality Gate Handoff Fixtures

- direct evidence candidate ready for gate review
- citation gap candidate held for source verification
- unsafe candidate becomes draft-time rejection
- generator score distinct from quality-gate score
- quality gate review history supersedes prior review

### Idempotency Fixtures

- repeated generation for same run/type
- generator version changes with same run/type
- same citation emitted twice from retry
- latest output overwritten while run output remains stable

## DO_NOT_ASSUME

- Do not rely on production data values in tests without redaction and approval.
- Do not use `.env` or live DB connections in fixture tests.
- Do not make tests depend on external APIs, crawlers, or browser automation.
