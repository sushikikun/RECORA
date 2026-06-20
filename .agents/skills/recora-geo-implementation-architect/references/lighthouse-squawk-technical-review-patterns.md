# Lighthouse / Squawk Technical Review Patterns

Use these as review heuristics only. Do not run Lighthouse, Unlighthouse, Squawk, or any external tool from this skill patch.

## Technical SEO Review Pattern

Borrow category separation from Lighthouse-style audits:

- crawlability
- indexability
- rendering
- metadata
- structured data
- accessibility readiness
- performance as user experience
- page evidence visibility

Treat these as technical readiness checks, not AI visibility proof.

## Migration Safety Review Pattern

Borrow Squawk-like migration review categories:

- destructive drops
- lock-heavy operations
- backfills without batching
- missing rollback
- missing shadow/rehearsal plan
- unsafe defaults
- nullable-to-not-null transitions
- index creation without concurrency or rollout plan where relevant
- RLS policy drift
- constraint changes without data validation

## SQL / Schema Review Pattern

Review:

- index and constraint changes
- RLS policy scope
- client/project tenant boundaries
- generated type drift
- evidence history preservation
- idempotency of backfills
- migration ordering

## Prohibited Claims

- Do not say a Lighthouse score proves AI visibility.
- Do not say a Squawk-like checklist proves migration safety.
- Do not advise running external CLIs unless a separate approved implementation task explicitly allows it.

## Output Format

For each finding, include:

- category
- evidence observed
- severity
- RECORA data or client impact
- required local fixture or review step
- external tool not run status
