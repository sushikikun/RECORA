# Migration And Rollout Playbook

## Sequence

1. Read-only assessment first.
2. Migration proposal.
3. Backfill plan.
4. Shadow mode.
5. Dual-write only when justified.
6. Validation queries.
7. Rollback plan.
8. Feature flag.
9. Canary.
10. Audit comparison.
11. Publication disabled until validation.

## Rules

- No destructive migration without explicit approval.
- No migration proposal before inspecting real schema and migrations.
- Prefer additive changes for evidence, candidate, gate, and audit fields.
- Keep raw evidence immutable during backfill.
- Preserve old gate decisions and mark superseded reviews explicitly.
- Validate row counts, null/unknown handling, foreign keys, duplicate prevention, and tenant boundaries.

## Review Questions

- What data is backfilled and from what source?
- What is the rollback behavior if derived rows are wrong?
- Can publication stay disabled while shadow data is validated?
- Are validation queries safe and read-only?
- Does the rollout preserve historical reviews and published recommendations?
