# Exec Plan: Issue #121 - P4-A common contract, state, and event foundation

> Status: **Execute approved; Draft PR / Human review handoff**
> Issue: [#121](https://github.com/sushikikun/RECORA/issues/121)
> Parent: [#119](https://github.com/sushikikun/RECORA/issues/119)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Baseline: `origin/master` = `ae83929640eecd1e58dfed1742143bbd3395f355` (PR #120 merge)

## Authority and scope

The latest Issue #121 Execute approval, merged Phase 3 contracts, and the approved
Phase 4 specification are authoritative in that order. This child owns the only
additive Phase 4 persistence migration. It does not alter Phase 3 tenant,
membership, organization-lifecycle, immutable entitlement, operator-audit, or
retention contracts.

Allowed files are this plan, one additive migration, the server-only P4 command
type contract, and the dedicated local verifier. No package, lockfile, Auth flow,
provider SDK, webhook endpoint, email, browser/API surface, or product decision is
part of this work.

## Delivered persistence boundary

1. Organization-scoped business lifecycle current episode plus immutable history:
   `lead`, `onboarding`, `serving`, `paused`, `closed`, and `rejected`.
2. Tenant-bound one-time invitation current/history with opaque invitation ID,
   recipient-binding hash, issuer command receipt, expiry, request/correlation IDs,
   and terminal-row non-revival. Resend is represented only by a new ID and a
   supersession event.
3. Provider-neutral contract current projection and immutable ordered events:
   `draft`, `pending_activation`, `active`, `paused`, `canceled`, and `ended`.
   Terminal contract episodes cannot be reactivated in place.
4. Billing receipt process state separated from normalized immutable payment facts.
   Only opaque source references and fingerprints are stored; raw webhook payloads,
   signatures, payment methods, and full provider bodies have no column.
5. Command receipt, causal Phase 3 policy/snapshot/operator-audit references,
   durable outbox/checkpoint, source ordering, dedupe, and reconciliation primitives.
   A checkpoint gate returns only an allow/deny boolean and a stable reason; it is
   not a customer-facing authorization path.
6. A private legacy-inventory assertion runs before P4 command receipt insertion.
   It rejects null/orphan/duplicate/contradictory compatibility rows rather than
   converting `plan_configs`, `customer_profiles`, or `customer_subscriptions` into
   authority.

## Security and atomicity contract

- Every P4 relation is in `recora_private`, has RLS enabled, and is revoked from
  `public`, `anon`, and `authenticated`.
- Immutable histories, facts, and command receipts reject update/delete. Mutable
  current/projection/checkpoint records preserve a monotonically increasing version
  and reject terminal episode reactivation.
- Foreign keys use organization/project composite scope where applicable and are
  indexed. Command receipts bind an operator audit/receipt pair when the source is
  manual; future provider-neutral adapters remain separate from live provider use.
- P4-B/C must make dedupe, event/fact, projection, entitlement pointer/snapshot,
  audit receipt, and `applied` outcome one transaction when possible. A lifecycle
  operation outside that transaction must leave a pending/failed/reconciliation
  checkpoint and durable outbox row; consumers must deny until completion.
- The `public.recora_p4_resolve_checkpoint_gate(uuid, uuid)` RPC has fixed empty
  `search_path`, is service-role-only, and returns no commercial/provider detail.

## Verification plan

Run only against the Issue #121 temporary local Supabase stack with its dedicated
workdir, ports, and `supabase_db_recoraissue121` container guard:

1. Migration-only reset, seeded reset, then seeded replay on the same stack.
2. Dedicated P4-A positive, negative, dedupe, ordering, reconciliation,
   append-only, scope, RLS/grant/function-search-path, legacy-inventory, and
   checkpoint fail-closed checks.
3. Required Phase 3 regression suite and local migration/advisor checks.
4. `recora:preflight:full`, typecheck, lint, build, diff check, and commit check,
   followed by exact-scope/secret/env/DB-URL/lockfile checks.

## Deferred and stop conditions

No provider, plan name, price, currency, free period, cadence, grace, dunning,
refund, invite/signup route, final UI, provider call, webhook, Auth operation, or
production/remote DB action is selected or executed. Stop for any requirement to
weaken Phase 3, make legacy data authoritative, persist raw payment/provider data,
or bypass the local-only boundary.

## OWNER remediation (comment 5140661305)

P4-A preserves Phase 3 `recora_private` schema usage and the customer RLS helper grants; only P4-A relations/functions are revoked from browser roles. The shared foundation now carries immutable invitation role binding, acceptance/user/membership causal links, append-only membership episodes/events, a single pending invitation per organization/recipient, and supersession validation. Command receipts use an advisory transaction lock for semantic idempotency, excluding transport request/correlation telemetry from replay identity and recording conflicts as append-only evidence. Checkpoint gating evaluates only the current unsuperseded, access-blocking causal checkpoint so a retry/correction completion can restore access. All current identity/source/causal fields are immutable outside explicit state transitions.

The dedicated verifier covers P4 private catalog/grants/search path, semantic retry/conflict, invitation/membership invariants, state/event/fact/order/recovery negatives, and invokes the needed Phase 3 matrix from the same isolated seeded DB. No provider, Auth flow, or product decision is introduced.