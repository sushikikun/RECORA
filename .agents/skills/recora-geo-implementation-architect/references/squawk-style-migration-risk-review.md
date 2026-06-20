# Squawk-Style Migration Risk Review

Purpose: borrow migration-safety review categories without running Squawk or any migration linter.

## Core Rule

Use migration risk categories as a manual review rubric. Do not run Squawk, apply migrations, connect to production databases, or request credentials.

## Risk Categories

| Category | Review questions |
|---|---|
| Blocking changes | Could the migration lock large tables, block reads/writes, or run too long? |
| Missing indexes | Do new foreign keys, filters, joins, or uniqueness rules need supporting indexes? |
| Unsafe constraints | Are new `not null`, unique, foreign-key, or check constraints safe for existing data? |
| RLS / policy gaps | Do policies preserve tenant isolation, service boundaries, and expected roles? |
| Backfill risk | Is the backfill batched, resumable, idempotent, observable, and safe to retry? |
| Rollback risk | Is rollback defined without losing raw evidence, candidate history, or quality-gate decisions? |
| Generated type drift | Do generated types, migrations, API handlers, and candidate schemas agree? |
| Evidence retention | Does the migration preserve raw provider payloads and source/citation ledgers? |

## Severity Guidance

| Finding | Suggested severity |
|---|---|
| Tenant data exposure through RLS gap | P0 |
| Irreversible deletion of evidence or gate history | P0 |
| Provider failure state migrated into valid absence | P0 |
| Backfill without idempotency | P1 |
| Missing version fields during schema change | P1 |
| Missing index for new query path | P1 or P2 based on scale |

## Required Output

Migration reviews should include:

- affected tables or payloads.
- confirmed inspected artifacts or `NEEDS_VERIFICATION`.
- RLS impact.
- backfill and rollback notes.
- test fixture or dry-run expectation.
- explicit no-production-write boundary.
