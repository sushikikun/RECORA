# Exec Plan: Issue #119 — Phase 4 customer lifecycle, account, contract, and billing

> Status: **Stage 1 plan complete; Human review required**
> Issue: [#119](https://github.com/sushikikun/RECORA/issues/119)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Approval: Stage 1 Plan only / Updated: 2026-07-31
> Starting baseline: `origin/master` = `787fe84b48456bab569b6b5c043d6852271a674f` (PR #118 merge)

## 1. Objective and authorization boundary

Define the smallest Phase 4 delivery sequence that can make the customer account, membership, contract, billing-event, entitlement, access, and data-lifecycle relationships explicit without changing the already-merged Phase 3 security contracts.

This plan is an approved **planning artifact only**. It authorizes no implementation, migration, RLS change, Auth or signup change, database connection, Supabase use, payment-provider connection, webhook, package/lockfile change, deployment, Ready-for-review transition, merge, or Issue close.

The companion normative proposal is [`recora-customer-lifecycle-account-contract-billing.md`](../../recora-customer-lifecycle-account-contract-billing.md). Where it conflicts with the post-launch operations architecture, the latter prevails.

## 2. Fixed inputs and static evidence

| Area | Current-master evidence | Stage 1 conclusion |
| --- | --- | --- |
| Identity | [`app/signup/actions.ts`](../../../app/signup/actions.ts) creates a Supabase Auth identity only; login, confirm, reset, and password update likewise do not provision customer tenancy. | Identity is necessary but never sufficient for customer access. |
| Membership | [`20260729151417_phase3_membership_lifecycle_entitlement_hardening.sql`](../../../supabase/migrations/20260729151417_phase3_membership_lifecycle_entitlement_hardening.sql) defines accepted, active membership semantics. | Reuse as the authoritative membership predicate; missing, invited, suspended, revoked, or ambiguous membership denies. |
| Customer lifecycle | [`20260730163156_phase3_centralize_customer_lifecycle_access.sql`](../../../supabase/migrations/20260730163156_phase3_centralize_customer_lifecycle_access.sql) provides the authoritative organization lifecycle hard ceiling and project restriction. | Preserve the organization ceiling; never replace it with account, contract, or subscription metadata. |
| Entitlements | [`20260729163300_phase3_entitlement_policy_snapshots.sql`](../../../supabase/migrations/20260729163300_phase3_entitlement_policy_snapshots.sql) resolves immutable policy snapshots through a current pointer. | Contract/billing may cause a new snapshot and pointer switch, not mutate historical snapshots. |
| Data lifecycle | [`20260730130000_phase3_data_lifecycle_retention.sql`](../../../supabase/migrations/20260730130000_phase3_data_lifecycle_retention.sql) owns retention states and append-only evidence. | Phase 4 may request a transition through the authorized lifecycle command; it must not bypass Phase 3 retention semantics. |
| Legacy commercial data | [`20260627204737_customer_lifecycle_subscription_evidence.sql`](../../../supabase/migrations/20260627204737_customer_lifecycle_subscription_evidence.sql) contains mutable plan/profile/subscription rows and a JSON entitlement field. | Compatibility/inventory only; neither subscription status nor JSON is an authoritative customer-access or billing ledger. |
| Demo bootstrap | [`20260701073553_demo_customer_lifecycle_subscription_evidence.sql`](../../../supabase/migrations/20260701073553_demo_customer_lifecycle_subscription_evidence.sql) creates internal demo compatibility data. | Not a production commercial contract or payment fixture. |
| Customer/dashboard reads | [`lib/recora/db/dashboard.ts`](../../../lib/recora/db/dashboard.ts) reads product data; [`app/dashboard/layout.tsx`](../../../app/dashboard/layout.tsx) does not establish a commercial account gate. | Add no dashboard decision in Stage 1; future customer-facing changes must consume the authoritative access result. |

## 3. Invariants to preserve

1. Customer access is derived only when all required authorities succeed: verified Auth identity, active accepted membership, exactly one active organization lifecycle authority, project ownership, a valid current entitlement snapshot for the capability, and no project-specific restriction.
2. The organization lifecycle is the hard ceiling. Project lifecycle may only narrow access.
3. Missing, duplicate/ambiguous, non-active, or malformed authority records fail closed. No legacy subscription field, compatibility profile, dashboard route, or demo identity may open customer access.
4. Contract and billing are append-only event/projection concerns. Provider callbacks are untrusted until verified, idempotent, ordered/reconciled, and auditable. A reversal creates a later fact; it does not rewrite history.
5. Policy versions and entitlement snapshots stay immutable. Changes use an approved policy/snapshot, a new pointer, and an auditable causal reference.
6. Customer-facing code never receives raw contract, billing, control, audit, or service-role data; it receives a minimum capability result.
7. Published reports and retention behavior retain the Phase 3/post-launch guarantees. A commercial state transition must not delete data or bypass lifecycle evidence.

## 4. Product decisions deliberately deferred

The following require explicit Product/Finance/Legal/Operations decisions before a later implementation wave and are intentionally not selected here:

- payment processor(s), merchant of record, tax/invoice model, settlement geography, and webhook trust model;
- registration/onboarding/invite route and approval flow;
- plan names, price, currency, free trial, billing cadence, proration, cancellation/refund, grace, dunning, suspension, and reactivation policy;
- contract template, signer, seat/usage measure, sales-assisted versus self-serve motion, and which services may initiate an authoritative commercial command;
- account ownership transfer, organization merge/split, retention exceptions, and support/operator permissions.

A later implementation must surface each decision as an input/approval, not infer it from the old `customer_subscriptions` data or demo seed.

## 5. Minimum child-Issue graph — maximum three Waves

No child Issue is created by this Stage 1 task. The graph below is the proposed minimum split for Human review.

```text
P4-A  Canonical contract/account data model and authority boundary (Wave 1)
  ├─> P4-B  Account, organization, membership, and customer-access command flow (Wave 2)
  └─> P4-C  Provider-neutral billing-event adapter and entitlement projection (Wave 2)
           └─> P4-D  Cross-component acceptance, compatibility cutover, and operational runbook (Wave 3)
P4-B ───────────────────────────────────────────────────────────────────────┘
```

| Proposed child | Wave | Depends on | Smallest outcome | Explicitly excluded |
| --- | --- | --- | --- | --- |
| P4-A: Canonical commercial authority model | 1 | Human product-decision record and architecture approval | Additive, provider-neutral canonical contract/account/billing-event authority model; formal ownership and RLS/command threat model; compatibility read plan. | Provider integration, signup UI, pricing, entitlement behavior changes, data deletion. |
| P4-B: Account and membership customer-access commands | 2 | P4-A | Authorized account/org/member lifecycle commands and customer-facing minimum access result, using the Phase 3 lifecycle and membership authorities. | Billing provider, commercial policy choices, raw dashboard/billing exposure. |
| P4-C: Billing event to entitlement projection | 2 | P4-A plus explicit provider/product approvals | Verified, idempotent provider-neutral event ingress boundary; audited contract projection and immutable entitlement pointer transition. | Live payment activation without separate R3 execution approval; pricing decision by engineering. |
| P4-D: Cutover, security matrix, and operator runbook | 3 | P4-B and P4-C | End-to-end contract/security/rollback matrix, compatibility cutover, access/data-lifecycle regression suite, and release runbook. | Phase 5–10 functionality, destructive cleanup, legacy data deletion. |

Wave 2 workstreams may proceed in parallel only after P4-A’s authority contract and the separate product decisions they consume have been approved. P4-D is the sole cutover gate.

## 6. Delivery checkpoints

| Milestone | Status | Evidence / exit condition |
| --- | --- | --- |
| M1: Start gate and baseline | Complete | Clean dedicated worktree created from `787fe84…`; no Phase 3 conflict found by static audit. |
| M2: Read-only contract inventory | Complete | Evidence table above and companion specification distinguish current fact, compatibility-only inventory, and later work. |
| M3: Formal Stage 1 documents | Complete | This plan, companion specification, and minimal documentation index entry contain no product implementation. |
| M4: Stage 1 local validation | Complete | `recora:preflight:full`, explicit `typecheck`, `lint`, `build`, approved-three-file scope, untracked whitespace, diff, secret/env/DB-URL, and forbidden product/package path checks passed. Commit/push/Draft PR remain the authorized publishing handoff. |
| M5: Human review / Stage 2 authorization | Pending | Human selects product decisions, approves child Issue scope, and separately authorizes any write-capable/DB/Auth/payment operation. |

## 7. Validation matrix for later implementation

The child Issues must retain, not weaken, the Phase 3 contracts. Before P4-D cutover they must demonstrate at minimum:

| Case | Expected result |
| --- | --- |
| authenticated customer, active accepted membership, one active organization lifecycle, valid current entitlement | Access only to permitted capability and scoped customer data. |
| no membership / invited / suspended / revoked / ambiguous membership | Data API/RLS/customer access denied. |
| missing / duplicate / non-active organization lifecycle | Data API/RLS/customer access denied. |
| active organization but restricted/non-active project lifecycle | Access denied or narrowed according to the existing project restriction. |
| expired, missing, superseded, malformed, or denied entitlement snapshot | Capability denied; no fallback to mutable subscription JSON. |
| replayed, forged, out-of-order, or unverifiable billing event | No state mutation; recorded/reconciled according to the approved ingress policy. |
| account closure, access suspension, retention/deletion lifecycle transition | Existing lifecycle evidence, RLS ceiling, report-publication safety, and retention behavior remain intact. |
| anon demo and standard customer | Explicitly separate principals and fixtures; neither may become a fallback for the other. |

## 8. Compatibility, rollback, and stop conditions

### Compatibility

Keep legacy `plan_configs`, `customer_profiles`, `customer_subscriptions`, and demo bootstrap rows read-compatible until P4-D proves the canonical path and records an approved cutover. Do not interpret old rows as historical commercial truth. Keep Phase 3 public resolver output minimal and service-role-only boundaries intact.

### Rollback

Future waves must be additive and reversible at the read-routing level: preserve the previously healthy entitlement pointer and customer access path, record an append-only compensating event/transition, disable the new command path, and revert the application route to the retained authoritative Phase 3 path. No rollback may delete commercial, entitlement, lifecycle, report, or audit evidence.

### Stop conditions

Stop and return to Human review when any of these occur:

- a product decision in Section 4 is required but not explicitly approved;
- a proposed change would make legacy subscription/profile data authoritative, weaken an RLS fail-closed case, expose control/audit/billing data, or mutate an immutable snapshot;
- the work requires remote/production DB, `supabase db push`, external payment/API connectivity, `.env`, a destructive operation, Ruleset bypass, or a Phase 5–10 feature without a separate approval;
- lifecycle, membership, entitlement, data-retention, or published-report regression evidence fails.

## 9. Stage 1 progress log

- 2026-07-31 — Read-only audit started from PR #118 merge `787fe84b48456bab569b6b5c043d6852271a674f` on latest `origin/master`.
- 2026-07-31 — Confirmed identity, membership, lifecycle, entitlement, legacy subscription, demo, dashboard, and operations boundaries by static source inspection only; no Supabase/DB/Auth/API/environment access.
- 2026-07-31 — Produced the formal proposal and this dependency-aware plan. No child Issues, migrations, product code, or product decisions were created.
- 2026-07-31 — Required local validation passed. Awaiting the authorized commit/push/Draft PR handoff and then Human review.