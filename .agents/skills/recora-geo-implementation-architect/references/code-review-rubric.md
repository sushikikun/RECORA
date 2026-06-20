# Code Review Rubric

Score implementation reviews across:

- correctness
- traceability
- type safety
- runtime validation
- idempotency
- error handling
- observability
- testability
- security
- migration safety
- cost control
- crawler/extraction boundary
- technical SEO readiness boundary
- RECORA contract compatibility
- strategy-skill compatibility
- quality-gate compatibility

## Severity

### P0

Use for issues that can corrupt evidence, publish unsafe recommendations, expose secrets, run production/destructive operations, break tenant boundaries, turn provider failures into client claims, or bypass the quality gate.

Also use P0 when code turns technical SEO readiness, crawler output, README claims, planned provider status, browser automation, or citation count into client-facing AI visibility proof.

### P1

Use for issues that materially weaken evidence traceability, parser correctness, source-to-claim validity, idempotency, retries, tests, migration safety, or rollout control.

Also use P1 for missing normalized provider states, missing collection method, missing crawler/extractor versioning, weak cost controls, unclear source freshness, or incomplete technical-readiness boundaries.

### P2

Use for useful improvements, clarity, maintainability, fixture coverage, observability polish, non-blocking schema refinements, or lower-risk consistency improvements.

## Finding Shape

For each finding include:

- severity
- confirmed evidence
- why it matters
- recommended fix
- affected file or contract when known
- tests or fixtures required
- remaining `NEEDS_VERIFICATION` items
