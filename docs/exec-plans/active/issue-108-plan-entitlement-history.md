# Issue #108 — 102-3D plan policy and entitlement history

Status: **Completed**
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
- Snapshot documents are versioned, typed JSON objects (`capabilities` booleans and non-negative numeric `limits`) with SHA-256 hashes.
- The snapshot idempotency key is unique inside its organization/project scope; repeated delivery cannot create unlimited snapshots.
- Current pointers are mutable but must exactly match the referenced snapshot organization/project scope.
- A service-role-only RPC returns capability/limit data and stable fail-closed reason codes, never contract, subscription, billing, payment, policy, or exception detail.

## Backfill and rollback

- No historical backfill is performed: current mutable plan/subscription JSON lacks an approved source-contract and resolution event identity.
- Phase 4 creates future snapshots from an opaque contract reference through its separately approved business process.
- Rollback is additive: stop new writers and resolver consumers, retain legacy operational reads, and do not drop or mutate immutable history.

## Validation results

- Dedicated 102-3D fixture passed after isolated local reset both without seed and with seed: A/B organizations, v1/v2 policies, A1/A2/B1 snapshots, scope rejection, immutable hashes, idempotency, and fail-closed resolver states.
- Isolated local migration list and security/performance advisors passed with no findings; 102-3A and 102-3B baseline verifier logic also passed against this same isolated database.
- The exact preflight subchecks and `tsc --noEmit`, plus `next lint`, `next build`, and diff checks passed. The `recora:commit-check` guard intentionally reports a migration as not auto-allowed and cannot invoke unavailable `npm`; the Issue #108 R3 Execute approval explicitly permits this manually reviewed migration commit.
- The temporary isolated local stack remains running; no temporary container or stack was deleted.

## Out of scope

- Billing/contract lifecycle and payment integration (Phase 4).
- Setup, queue/provider execution, result/read-model integration (Phases 5–7).
- 102-3C RLS/grants boundary, 102-3E operator/audit, and any remote or production Supabase operation.