# Codebase Reading Protocol

Before giving RECORA implementation advice:

1. Identify the actual repository root.
2. Identify package manager, language, framework, and build/test commands from real files.
3. Inspect `package.json` and relevant config.
4. Inspect current types, schemas, validation code, and domain contracts.
5. Inspect migrations and tests before proposing schema changes.
6. Inspect data flow from provider response to candidate output.
7. Separate confirmed code facts from architecture recommendations.
8. Say `not inspected` when files are unavailable.

## Required Evidence Discipline

- Never infer runtime success from typecheck alone.
- Never infer current schema from a temporary script, JSON export, README, or user-provided entity list.
- Never claim a job, queue, provider adapter, parser, quality gate, or migration works unless inspected and verified.
- Mark inaccessible or unavailable evidence `NEEDS_VERIFICATION`.

## Minimum File Areas To Inspect When Relevant

- package and lock files
- TypeScript config
- app/router or API route files
- library/domain modules
- provider adapter modules
- parser and extraction modules
- candidate generation modules
- quality-gate integration modules
- migrations and schema definitions
- tests, fixtures, and snapshots
- job/queue/retry/cost-control code
- logging and audit code
