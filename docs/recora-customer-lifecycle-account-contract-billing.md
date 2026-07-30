# Recora Customer Lifecycle, Account, Contract, and Billing Specification

Status: **Stage 1 proposal — Human review required before any implementation**
Issue: [#119](https://github.com/sushikikun/RECORA/issues/119)
Baseline: `master` at `787fe84b48456bab569b6b5c043d6852271a674f`
Scope: Phase 4 technical contract; no product pricing or payment-provider decision

## 1. Authority and non-goals

This document is the proposed Phase 4 technical specification. The latest OWNER
record in Issue #119 remains the approval authority. It consumes, and does not
redefine, the Phase 3 tenant, membership, entitlement, lifecycle, operator, and
audit contracts.

The following are deliberately **not** decided here: registration channel,
payment provider, marketed plan names, prices, free period, billing cadence,
proration, refunds, tax/invoice operations, self-service billing portal timing,
retention duration, or final UI. A later product decision may supply those values
without changing the state boundaries below.

No Stage 1 outcome authorizes a schema, Auth, signup, RLS, provider, DB, or
production change.

## 2. Phase 3 contracts consumed unchanged

- `organizations` is the tenant root and projects have explicit organization
  ownership ([tenant foundation](../supabase/migrations/20260620181714_recora_tenant_foundation.sql#L16)).
- An effective customer membership is an authenticated `user_id` with recorded
  acceptance and `membership_status = active`; invited, suspended, revoked,
  missing, and ambiguous memberships fail closed
  ([membership migration](../supabase/migrations/20260729151417_tenant_ownership_accepted_membership.sql#L245)).
- The organization lifecycle must have exactly one active organization row before
  customer access. It is the hard ceiling; a project row can only further restrict
  access ([authoritative lifecycle resolver](../supabase/migrations/20260730163156_recora_authoritative_lifecycle_rls_access.sql#L30)).
- Plan-policy versions and entitlement snapshots are append-only; a mutable current
  pointer may move, but the historical snapshot never changes
  ([entitlement migration](../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L57)).
- Current entitlement resolution is service-role only and returns capabilities,
  limits, stable reason codes, and no contract/billing detail
  ([resolver](../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L337)).
- Data lifecycle state and evidence are separate from customer access and retain
  the `active → access_suspended → retained` path; actual deletion is not a
  Phase 4 operation ([retention contract](../supabase/migrations/20260730130000_recora_retention_deletion_state.sql#L8)).
- Important operator actions use a verified Auth identity plus the Phase 3
  authorization/audit command receipt; service role is never an actor identity
  ([server boundary](../lib/recora/operator-authorization-audit.ts#L52)).

## 3. Static current-state inventory

The classification records present-master facts, not a claim that the existing
records are a complete Phase 4 implementation.

| Area | Evidence | Classification | Phase 4 handling |
|---|---|---|---|
| Email/password signup | `app/signup/actions.ts:48` calls Auth `signUp`; it creates no organization, membership, profile, subscription, or project | Fix | Keep as an identity-creation primitive only; add an approved post-verification onboarding/assignment contract later. |
| Login, confirmation, recovery, password change | `app/login/actions.ts:26`, `app/auth/confirm/route.ts:28`, `app/forgot-password/actions.ts:31`, `app/auth/update-password/actions.ts:34` | Reuse | Keep token/session primitives and safe failure handling; do not equate a successful login with customer access. |
| Redirect/session helpers | `lib/recora/auth-access.ts:11`, `lib/supabase/middleware.ts:6` | Fix | Retain safe same-origin next-path handling and session refresh, then add one server-side customer-access decision. |
| Invite acceptance | confirmation route accepts Auth `invite` OTP at `app/auth/confirm/route.ts:7`; no membership invitation create/resend/cancel/claim command exists | Missing | Define a tenant-bound, expiring, one-time invitation command/event path before enabling any invite channel. |
| Membership foundation | `public.organization_members` plus accepted-active predicate | Reuse | Consume its Phase 3 predicate. Role labels are business authorization inputs, not a replacement for the predicate. |
| Internal customer profile | `recora_admin.customer_profiles` has a mutable internal lifecycle field at `supabase/migrations/20260627204737_recora_admin_p0a.sql:57` | Compatibility-only | Do not use it as the customer-access gate or silently backfill a new business state from it. |
| Internal subscription | `recora_admin.customer_subscriptions` has mutable status/config/billing mode at the same migration line 91 | Compatibility-only | Treat only as a legacy/manual input candidate after an explicit reconciliation command; never as historical entitlement truth. |
| Internal plan config | mutable JSON config at the same migration line 35 | Compatibility-only | Map an approved policy family to Phase 3 plan-policy versions; do not expose or repurpose current plan codes as marketed products. |
| Diagnostic intake and demo bootstrap | `diagnostic_intakes` at line 135 and internal demo-only upsert in `20260701073553_recora_internal_demo_subscription.sql` | Compatibility-only | Preserve as internal/demo operations. Do not infer a real-customer contract, access, or billing history. |
| Internal plan/customer pages | server-only service-role read RPCs in `lib/recora/internal-plan-configs.ts:43` and `lib/recora/internal-customer-ops.ts:80`; local-only guard in `app/internal/layout.tsx:14` | Reuse for internal read-only visibility | Retain the customer/operator boundary; a production operator console and write commands remain later approved work. |
| Customer dashboard/settings | `app/dashboard/layout.tsx` has no account/contract access gate and its current read model selects measurement data directly (`lib/recora/db/dashboard.ts:92`) | Later phase / Fix | It is not a Phase 4 entitlement or account surface and must not become one by reading internal contract/billing data. |

## 4. Separated authoritative state model

The following state domains must remain distinct. A transition in one domain does
not implicitly mutate another domain unless an approved command explicitly says
so and records its event, correlation ID, actor, outcome, and idempotency key.

| Domain | Authoritative source | Technical states / resolution | Does not authorize |
|---|---|---|---|
| Auth account | Auth provider; verified server-side by `auth.getUser()` | provider account/session/verified-email facts; absence is fail closed | membership, tenant, contract, entitlement, or operator role |
| Organization membership | `public.organization_members` and Phase 3 predicate | `invited`, `active`, `suspended`, `revoked` | billing or data retention state |
| Customer/business lifecycle | new Phase 4 internal relationship record | `lead`, `onboarding`, `serving`, `paused`, `closed`, `rejected` | direct customer access, payment outcome, or deletion |
| Contract/subscription | new provider-neutral current contract plus append-only contract event history | `draft`, `pending_activation`, `active`, `paused`, `canceled`, `ended` | payment settlement, membership change, or snapshot mutation |
| Billing/payment | append-only normalized provider/manual event history | `received`, `validated`, `applied`, `ignored_duplicate`, `rejected`, `reconciliation_required`; payment outcome is an opaque normalized attribute | direct RLS or customer browser access |
| Entitlement resolution | Phase 3 policy version, immutable snapshot, current pointer, resolver | `ok`, `no_snapshot`, `ambiguous_snapshot`, `expired_snapshot`, `invalid_scope` | customer identity or lifecycle transition |
| Customer access | derived server-side decision; not a mutable duplicate status | allowed only when all required predicates pass; otherwise deny with stable non-sensitive reason | data deletion or billing mutation |
| Data lifecycle / retention | Phase 3 lifecycle command/event/evidence | `active`, `access_suspended`, `retained`, `deletion_scheduled`, `deleting`, `deleted`, `deletion_failed` | replacement for contract or payment history |

The business lifecycle labels above are operational relationship states, not plan,
price, trial, cadence, or provider decisions. The final implementation may add an
explicit compatibility mapping only after a pre-write inventory proves each legacy
row is unambiguous.

### 4.1 Customer access predicate

The authoritative customer-access decision must be computed, not inferred from a
single status:

```text
verified Auth identity
AND accepted active organization membership
AND exactly one active organization lifecycle (hard ceiling)
AND requested project belongs to that organization
AND a current, unambiguous, time-valid entitlement snapshot permits the requested capability
AND no project lifecycle restriction denies the requested project
```

Missing, ambiguous, expired, contradictory, or unavailable input denies access.
Authentication alone, a legacy customer profile, a legacy subscription row, a
provider event, and a service-role client are each insufficient. Anonymous demo
read behavior remains the explicit Phase 3 demo exception and must never become a
customer fallback.

### 4.2 Transition authority and causality

```text
validated manual command or validated provider event
  → append-only contract/billing event
  → current contract projection
  → plan-policy resolution
  → new immutable entitlement snapshot
  → current-snapshot pointer update
  → derived customer access decision
  → Phase 3 data-lifecycle command only when an approved policy requires it
```

- The command is idempotent by a source event ID or a generated command key scoped
  to its tenant/project. Duplicate delivery returns the prior outcome; it must not
  create a second snapshot or transition.
- Provider signature validation happens at ingress before any state write. Raw
  signatures, secrets, payment payloads, and full provider responses are not
  stored in customer-visible data or audit summaries.
- Out-of-order events do not overwrite later state. They remain append-only
  evidence and become `reconciliation_required` when a deterministic ordering rule
  cannot safely apply them.
- Reversal is a new correction event, contract projection, snapshot, and pointer
  update; no historical event or snapshot is edited.
- A payment failure, pause, cancellation, or end has no pre-decided commercial
  grace behavior here. Product policy later chooses the permitted transition; the
  implementation must still make it explicit, audited, idempotent, and fail closed.

## 5. Account and membership contract

1. Signup, login, confirmation, recovery, password change, and email change are
   identity operations. They never create a customer membership merely because a
   provider account exists.
2. An invitation binds intended organization, intended email or verified identity,
   invited role, expiry, issuer, and opaque one-time invitation ID. It rejects
   cross-tenant acceptance, hijack, replay, cancel-after-accept, duplicate active
   membership, and open redirect.
3. A user may have multiple organizations. Implicit organization selection fails
   closed when absent or ambiguous; explicit organization/project scope is checked
   against active membership and ownership.
4. Suspend, revoke, and reactivate are explicit operator commands. Reactivation
   needs a new authorization decision; it never revives a revoked invitation or
   overrides the organization lifecycle hard ceiling.
5. Customer roles (`owner`, `admin`, `member`, `viewer`) can constrain permitted
   customer actions, but may not weaken Phase 3 membership, lifecycle, project, or
   entitlement predicates.

## 6. Contract, billing, and entitlement source contract

- A contract is the provider-neutral, organization-scoped authorization input. A
  project may receive a scoped override only through an explicit, tenant-safe
  contract/policy command.
- Current contract projection and append-only contract-event history are distinct.
  Current state is replaceable; events are not.
- Existing `recora_admin.plan_configs`, `customer_subscriptions`, and JSON
  documents are mutable compatibility inventory. They are reconciled into a policy
  version and a new snapshot, never mutated into a historical ledger.
- Provider identifiers are opaque references with bounded format/length. They are
  not customer-visible fields and do not carry secrets or payment payloads.
- Manual contracts and future webhook-originated contracts normalize into the same
  command/event envelope. Provider adapters own signature verification and mapping;
  domain commands own tenant validation, idempotency, audit, and snapshot creation.
- The Phase 3 resolver remains the only consumer-facing entitlement output. No
  browser table/RPC exposes subscription, billing, policy, exception, or provider
  details.

## 7. Customer, operator, and external-actor boundaries

| Actor | Permitted Phase 4 boundary | Prohibited boundary |
|---|---|---|
| Customer | own account settings and membership-scoped customer-safe reads after the derived access check | direct writes to contract, billing, entitlement pointer, operator/audit, or lifecycle tables/RPCs |
| Recora operator | authorized, reasoned, audited server command | acting through a customer browser identity or using service role as the actor |
| Provider webhook | validated provider-event ingress with opaque source identity | direct operator impersonation, RLS bypass, or raw-payload propagation |
| Service role | server execution capability behind a verified actor/event command | identity, membership, payment-provider, or customer actor classification |

## 8. Compatibility, migration, and rollback rules

- Start any implementation with a read-only inventory for null, orphan, duplicate,
  contradictory, or ambiguous legacy customer/profile/subscription/plan rows.
- Do not infer a customer relationship, membership, payment state, contract start,
  lifecycle, entitlement, or retention deadline from demo/manual rows.
- Introduce new state/event/pointer structures additively. Preserve compatibility
  reads until the new writer, resolver, and customer access decision pass their
  dedicated tests.
- A production backfill, provider switch, billing migration, or external webhook
  activation needs separate R3 approval. Phase 4 rollback is a new corrective
  event/snapshot or a feature-gated read-path reversal, never deletion or mutation
  of immutable history.

## 9. Proposed implementation split: three Waves maximum

The following are proposed child Issues only. They require individual R2/R3
Execute approvals after this Stage 1 review; no Issue is created by this document.

```text
Wave 1: P4-A state/event foundation
             │
             ├──────────────┐
Wave 2: P4-B account &      P4-C contract/billing adapter and
        membership commands       entitlement/lifecycle integration
             │                    │
             └──────────────┬─────┘
                            ▼
Wave 3: P4-D end-to-end security, recovery, and compatibility suite
```

| Wave | Proposed child Issue | Scope and independent exit criteria | Dependencies / anti-conflict rule |
|---|---|---|---|
| 1 | P4-A — Provider-neutral contract/billing state and command foundation | One additive migration set defines contract/event/idempotency/reconciliation and compatibility-read boundaries; server-only command interfaces; no provider SDK/webhook activation or pricing decision. Local schema/RLS/grant/negative tests pass. | Sole Phase 4 migration owner. It imports Phase 3 interfaces and exposes stable interfaces to Wave 2. |
| 2 | P4-B — Account, invitation, and membership access commands | Auth-adjacent server flows for invitation/accept/suspend/revoke/reactivate and the derived customer-access gate; tests cover enumeration, takeover, tenant substitution, replay, multi-organization ambiguity, and lifecycle hard ceiling. | Depends on P4-A interfaces; no migration edits. Does not decide registration channel or final UI. |
| 2 | P4-C — Contract/billing adapter normalization and entitlement/lifecycle projection | Manual command and fixture adapter normalize to P4-A events; deterministic snapshot/pointer creation and approved lifecycle command handoff; tests cover duplicate, reverse order, retry, fail closed, pause/cancel/reactivate policy hooks. | Depends on P4-A; no migration edits and no external provider call. It must not modify P4-B Auth flows. |
| 3 | P4-D — Phase 4 integration/security and compatibility proof | Same isolated local DB verifies account/membership, contract/billing events, snapshots, customer access, lifecycle, operator audit, legacy compatibility, and no customer billing exposure. | Depends on P4-B and P4-C. No downstream UI work; a blocking correction needs separately approved additive scope. |

## 10. Stage 1 acceptance record

- Latest-master static audit evidence is recorded above.
- No environment file, credential, DB, Supabase CLI/MCP, external payment API,
  package, lockfile, Auth source, migration, or product source is changed by this
  specification.
- Human review must choose the Stage 2 child-Issue execution order and approve the
  relevant R2/R3 implementation authority before any write-capable work begins.