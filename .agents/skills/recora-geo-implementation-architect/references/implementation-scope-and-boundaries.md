# Implementation Scope And Boundaries

## Modes

- `architecture-review`: review proposed architecture and contracts.
- `code-review`: review existing implementation for correctness and risk.
- `data-model-review`: review tables, types, migrations, and schema boundaries.
- `pipeline-review`: review provider-to-candidate data flow.
- `parser-review`: review answer parsing, mention extraction, and normalization.
- `provider-adapter-review`: review provider result contracts and failure handling.
- `candidate-generation-review`: review evidence-to-candidate generation.
- `quality-gate-integration-review`: review handoff payloads, persisted reviews, and publication controls.
- `test-plan`: design fixtures and test layers.
- `migration-plan`: propose migration, backfill, validation, and rollback.
- `implementation-plan`: produce implementation-ready steps without edits.
- `explicitly-authorized-implementation`: edit only the user-approved scope.

Default to review-only.

## Prohibited Actions

- secret access
- production deployment
- destructive migrations
- unapproved database writes
- unapproved external API calls
- CAPTCHA bypass
- login automation
- browser automation or provider UI automation unless separately approved
- copying OSS code without license review
- credential, cookie, API key, token, or secret handling
- turning review output into a publication decision

## Implementation Authorization

Implementation is authorized only when the user explicitly asks for file changes and names the scope. When authorized:

- inspect current code before editing
- modify only approved files
- preserve backward compatibility where possible
- create or update tests
- state migration, data, rollback, privacy, cost, and rollout risks
- never access secrets
