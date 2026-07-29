# Issue #108 — 102-3D plan policy and entitlement history

Status: **Owner follow-up 5121258898 validated; ready for Draft PR handoff**
Parent: #102
Risk: **R3**
Execution: **Local Codex**
Spec level: **Full**
Approval: **Execute — Issue #108 body**

## Scope

- Add immutable versioned plan-policy records, resolved entitlement snapshots, and mutable current pointers.
- Provide only a service-role RPC and server-only resolver/fixture contract; do not connect Phases 4–7.
- Use an isolated local Supabase project `recora-issue-108-v2` under `C:/tmp`, with its own unique ports and containers.

## Confirmed design

- Existing `recora_admin.plan_configs` and subscription entitlement JSON remain mutable operational inventory, not historical truth.
- `recora_private.plan_policy_versions` and `recora_private.entitlement_snapshots` are append-only; update/delete triggers reject mutation.
- Snapshot documents are versioned, typed JSON objects with exactly `capabilities` and `limits`; their safe names, boolean capabilities, finite non-negative numeric limits, and SHA-256 hashes are validated fail-closed in SQL and TypeScript.
- Each policy family has one root and one successor per version. Successors retain the family and use a strictly later effective timestamp, so a lineage cannot fork or become same-time ambiguous.
- The snapshot idempotency key is unique inside its organization/project scope; repeated delivery cannot create unlimited snapshots.
- Current pointers are mutable but must exactly match the referenced snapshot organization/project scope.
- A service-role-only RPC returns capability/limit data and stable fail-closed reason codes, never contract, subscription, billing, payment, policy, or exception detail.
- Opaque contract and exception references are short identifier-shaped values only; exception source and reason are present together or absent together. New private helpers explicitly revoke default browser-role execution.

## Backfill and rollback

- No historical backfill is performed: current mutable plan/subscription JSON lacks an approved source-contract and resolution event identity.
- Phase 4 creates future snapshots from an opaque contract reference through its separately approved business process.
- Rollback is additive: stop new writers and resolver consumers, retain legacy operational reads, and do not drop or mutate immutable history.

## Validation results

- Isolated local project `recora-issue-108-v2` only: `supabase db reset --local --no-seed` and seeded `supabase db reset --local` both passed. The expanded 102-3D verifier passed after each reset, including total JSON validation and table rejection, one strict policy lineage, opaque-reference shape/pairing, resolver non-leakage, and private/public RPC privilege checks.
- The 102-3A and 102-3B regression verifiers passed against the same isolated database through local temporary copies whose container guard alone was retargeted; no other Wave 2 container, worktree, or branch was modified.
- `supabase migration list --local` completed through `20260729163300`; local security and performance advisor checks reported no issues. Typecheck, lint, and production build passed. The eight `recora:preflight:full` subchecks were executed directly with the installed Node runtime and passed; the literal npm wrapper was unavailable in this Codex runtime.
- Scope, lockfile, secret-pattern, and `git diff --check` checks passed. After staging only the four intended files, the prescribed `recora:commit-check` ran: all non-migration gates and its nested preflight passed; it exited 1 only because this repository intentionally has no automatic Supabase-migration allow flow. The task-specific R3 Execute approval remains the manual authorization for this migration commit and Draft-PR update.
- The temporary isolated local stack remains running; no temporary container or stack will be deleted.

## Out of scope

- Billing/contract lifecycle and payment integration (Phase 4).
- Setup, queue/provider execution, result/read-model integration (Phases 5–7).
- 102-3C RLS/grants boundary, 102-3E operator/audit, and any remote or production Supabase operation.