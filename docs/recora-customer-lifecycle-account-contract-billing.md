# Recora Customer Lifecycle, Account, Contract, and Billing Specification

Status: **Stage 1 Human review approved; Stage 2 child Execute unapproved**
Issue: [#119](https://github.com/sushikikun/RECORA/issues/119)
OWNER review record: [5135247884](https://github.com/sushikikun/RECORA/issues/119#issuecomment-5135247884)
Approved baseline: `origin/master` at `787fe84b48456bab569b6b5c043d6852271a674f` (PR #118 merge)
Scope: Phase 4 technical contract only; no product pricing, registration-channel, or payment-provider decision

## 1. Authority order, scope, and non-goals

The authority order is strict:

1. The latest OWNER record in Issue #119, including the Stage 1 approval and limits.
2. The merged Phase 3 tenant, membership, organization-lifecycle, entitlement, data-lifecycle, and operator-audit contracts.
3. This Human-review-approved Phase 4 Stage 1 specification and its Exec Plan.
4. Only compatible parts of the post-launch operations architecture and legacy/static repository evidence.

A lower source never overrides a higher source. The post-launch operations architecture is a compatible reference, not an authority that can replace an Issue #119 OWNER decision or a merged Phase 3 contract. This document consumes Phase 3; it does not redefine it.

The following remain undecided: registration/invite channel, payment provider, merchant/tax/invoice model, marketed plan names, price, currency, free period, billing cadence, proration, refund, grace, dunning, cancellation/reactivation policy, contract template, seat/usage measure, retention duration, and final UI. A later approved product decision supplies those values without changing the technical boundaries here.

This Stage 1 baseline authorizes no schema/migration, Auth/signup/invitation implementation, RLS, DB/Supabase, provider/webhook/API, package/lockfile, deploy, child-Issue, or Stage 2 Execute work.

## 2. Phase 3 contracts consumed unchanged

- `organizations` is the tenant root and projects have explicit organization ownership ([tenant foundation](../supabase/migrations/20260620181714_recora_tenant_foundation.sql#L16)).
- Accepted active membership requires `accepted_at` and `membership_status = active`; invited, suspended, revoked, missing, and ambiguous membership fail closed ([membership state](../supabase/migrations/20260729151417_tenant_ownership_accepted_membership.sql#L168), [effective predicate](../supabase/migrations/20260729151417_tenant_ownership_accepted_membership.sql#L258)).
- Organization lifecycle is the hard customer-access ceiling; a project lifecycle can only add a restrictive override ([resolver](../supabase/migrations/20260730163156_recora_authoritative_lifecycle_rls_access.sql#L28), [hard ceiling](../supabase/migrations/20260730163156_recora_authoritative_lifecycle_rls_access.sql#L157)).
- Plan-policy versions and entitlement snapshots are append-only; only a current pointer may change ([policy/snapshot](../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L57), [pointer](../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L264)).
- The Phase 3 entitlement resolver is a **server-side downstream entitlement contract**. It is service-role-only and returns capabilities/limits and stable reasons, never contract, subscription, billing, payment, policy, or exception detail ([resolver boundary](../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L337)). It is not browser-public.
- Phase 3 owns data lifecycle state, guarded command, append-only evidence, retention, and deletion semantics ([state](../supabase/migrations/20260730130000_recora_retention_deletion_state.sql#L8), [events](../supabase/migrations/20260730130000_recora_retention_deletion_state.sql#L144)).
- Important operator actions require a verified actor and Phase 3 authorization/audit receipt; service role is execution capability, never actor identity ([server boundary](../lib/recora/operator-authorization-audit.ts#L52)).

## 3. Current-master inventory and compatibility boundary

| Area | Static evidence | Classification | Phase 4 handling |
| --- | --- | --- | --- |
| Email/password signup | `app/signup/actions.ts:48` creates Auth identity only. | Fix | Identity creation is never customer provisioning or access. |
| Login, confirmation, recovery, password change | `app/login/actions.ts:26`, `app/auth/confirm/route.ts:28`, `app/forgot-password/actions.ts:31`, `app/auth/update-password/actions.ts:34`. | Reuse | Login is insufficient for customer access. |
| Invitation | Auth invite OTP exists, but no tenant-bound create/resend/cancel/claim command exists. | Missing | P4-A defines one-time invitation persistence; P4-B may implement commands only after Execute approval. |
| Membership | Phase 3 `organization_members` predicate. | Reuse | Business role never weakens it. |
| Legacy commercial data | [`recora_admin` inventory](../supabase/migrations/20260627204737_recora_admin_p0a.sql#L35). | Compatibility-only | Mutable plan/profile/subscription/JSON fields are not contract, billing, entitlement, or access authority. |
| Internal demo | [`demo bootstrap`](../supabase/migrations/20260701073553_recora_internal_demo_subscription.sql#L14). | Compatibility-only | Never proves a real customer contract/payment/access history. |
| Dashboard/settings | `app/dashboard/layout.tsx`; `lib/recora/db/dashboard.ts:92`. | Later phase / Fix | No commercial surface is inferred from current dashboard code. |

## 4. Authoritative transition contract

The following domains are separate. P4-A is the proposed owner of new Phase 4 current/history/event persistence; this document creates none. Every later command records correlation ID, verified actor or source, outcome, and domain-scoped idempotency key. No domain status authorizes a direct write to another domain.

| Domain | Authoritative source and states | Allowed transition and actor/command | Forbidden transition | Idempotency key | Direct customer-access effect |
| --- | --- | --- | --- | --- | --- |
| Auth account facts | Auth provider facts: account, verified-email, credential/recovery, deactivation. | Provider/Auth server records a fact after its own proof. | Treat session, user metadata, or email string as verified; create membership/contract from identity alone. | Provider user ID + provider event/request ID. | No direct grant; no verified identity denies. |
| Invitation lifecycle | P4-A one-time record/history: `pending`, `accepted`, `expired`, `revoked`, `superseded`. | Operator `invite.create` creates pending; bound recipient `invite.accept` accepts; clock marks expiry; operator cancel revokes; resend creates a new pending invitation and supersedes the old one. | Accept after expiry/revocation/supersession; cancel after acceptance; cross-tenant or mismatched-recipient acceptance; revive terminal row. | Invitation ID + command type; acceptance binds verified recipient. | No direct grant; accepted invitation is only membership input. |
| Organization membership | Phase 3 `organization_members`: `invited`, `active`, `suspended`, `revoked`. | `invited -> active` only via valid accepted invitation; `active -> suspended/revoked` by authorized operator; `suspended -> active` only by fresh audited reactivation and membership event. | `revoked -> active` in the same row; activation from login, contract, billing, demo, or profile. Revocation needs new invitation/new membership episode. | Organization + membership relation + request ID. | Active accepted membership is necessary, never sufficient. |
| Customer/business lifecycle | P4-A current relationship plus append-only episode history: `lead`, `onboarding`, `serving`, `paused`, `closed`, `rejected`. | Authorized operator relationship command changes the current episode; later renewed relationship uses a new episode. | Use as plan/trial/payment/entitlement state; resurrect closed/rejected episode; direct deletion/RLS grant. | Organization + lifecycle episode + request ID. | None; it is internal operations state. |
| Contract/subscription projection | P4-A provider-neutral current contract plus append-only events: `draft`, `pending_activation`, `active`, `paused`, `canceled`, `ended`. | Event/approved manual command moves `draft -> pending_activation/canceled`, `pending_activation -> active/canceled`, `active -> paused/canceled/ended`, or `paused -> active/canceled/ended` through approved policy hook. New contract episode follows canceled/ended. | Edit history; revive canceled/ended in place; set entitlement pointer directly; assume grace, price, or access. | Contract ID + source sequence/command key. | Indirect only through committed entitlement pointer and derived decision. || Billing-event processing state | P4-A receipt/process record: `received`, `validated`, `applying`, `applied`, `ignored_duplicate`, `rejected`, `reconciliation_required`. | Ingress/manual adapter writes received; normalizer validates; atomic command makes `applying -> applied` only when all required effects commit. Duplicate is ignored; invalid is rejected; ordering/conflict/retry exhaustion requires reconciliation. | Raw payload as payment fact; applied before required effects; overwrite a receipt/outcome. | Source namespace + source/manual ID + tenant scope + payload fingerprint. | None; pending/reconciliation-required required effects fail closed. |
| Normalized billing/payment fact | Append-only provider-neutral fact: `payment_succeeded`, `payment_failed`, `payment_reversed`, `payment_disputed`, or `payment_unknown`, with opaque external reference. | Validated receipt appends a fact. Correction appends a later correcting fact with causal reference. | Mutate/delete fact; expose payment method, invoice, provider ID, webhook, or payload; equate fact with process state. | Source namespace + event ID + fact kind + tenant scope. | None; it invokes a policy hook only through projection. |
| Entitlement resolution/current pointer | Phase 3 immutable snapshot/current pointer; resolution is `ok`, `no_snapshot`, `ambiguous_snapshot`, `expired_snapshot`, or `invalid_scope`. | Atomic P4 command creates a snapshot and moves same-scope pointer after policy resolution. | Mutate history; cross-tenant/project pointer; customer/browser invocation of resolver. | Scope + policy/version/source-contract causal reference + command key. | Required input; non-`ok` denies. |
| Derived customer access | Server-side computed `allowed` or `denied` with stable customer-safe reason. | Recompute from committed Phase 3/4 authorities for each request/capability. | Persist duplicate grant; fallback to login, legacy subscription, demo, or provider event. | Evaluation key is diagnostic only, never authority. | Only customer-facing decision; incomplete required downstream effect denies. |
| Phase 3 data lifecycle | Phase 3 state/evidence: `active`, `access_suspended`, `retained`, `deletion_scheduled`, `deleting`, `deleted`, `deletion_failed`. | Only existing Phase 3 authorized command transitions using expected state, request ID, evidence, and authorization rules. | Contract/billing/business status directly updates lifecycle; access suspension equals deletion; overwrite evidence. | Lifecycle ID + request ID. | Organization lifecycle remains hard ceiling; required pending checkpoint denies. |

### 4.1 Invitation and history rules

Acceptance is tenant-bound and one-time. Replay returns the recorded outcome only for the same verified identity and command key; it never creates another membership. Resend never reopens an old invitation: it supersedes it and creates a new ID. Expired, revoked, superseded, canceled, and cross-tenant attempts fail closed. Revoked membership and ended/canceled contract episodes are not silently resurrected: a later authorized relationship uses new invitation, membership episode, contract event, or contract episode. Event, snapshot, audit, and lifecycle evidence remains append-only.

### 4.2 Customer-access predicate

```text
verified Auth identity
AND accepted active organization membership
AND exactly one active organization lifecycle (hard ceiling)
AND requested project belongs to that organization
AND current, unambiguous, time-valid entitlement permits capability
AND no project lifecycle restriction denies the project
AND no required Phase 4 downstream checkpoint is pending or failed
```

Missing, ambiguous, contradictory, expired, unavailable, or non-active input denies. Authentication, legacy profile/subscription, normalized payment fact, provider event, service-role client, and anonymous demo behavior are each insufficient. The Phase 3 demo exception is never a customer fallback.

## 5. Event, projection, entitlement, access, and lifecycle recovery contract

Contract projection and billing-event processing are separate. A billing receipt says how an input is handled; a normalized billing/payment fact says what was observed; a contract projection says the current provider-neutral relationship. None is an entitlement pointer or access grant.

1. When effects are in one data store, one atomic command/transaction must perform event dedupe, append-only event/receipt write, projection update, approved policy resolution, immutable snapshot creation, same-scope pointer update, command/audit receipt, and `applied` outcome.
2. Derived access evaluates only committed authority. Receipt cannot become `applied` until every required downstream effect is committed and causally referenced.
3. If a required Phase 3 lifecycle command or protected boundary cannot join that transaction, the atomic command writes durable outbox/checkpoint data: correlation ID, idempotency key, expected lifecycle version, required effect, retry schedule, and safe failure category. Until successful receipt, derived access fails closed with stable non-sensitive pending/failure reason.
4. `reconciliation_required` is mandatory for unsafe ordering, source conflict, incomplete projection/pointer chain, contradictory idempotency content, or bounded retry exhaustion. It is never silently replayed as a new commercial event.
5. Retry reuses the exact source/command key and returns prior outcome. Permanent failure records failed receipt/checkpoint and needs authorized operator reconciliation with reason/audit record.
6. Correction is a compensating append-only event/fact and, where required, new projection/snapshot/pointer. It never overwrites event, fact, snapshot, pointer history, audit receipt, or lifecycle evidence.
7. Access suspension and retention/deletion are separate causal steps. Policy may request Phase 3 `access_suspended`; retention begins only through its own Phase 3 command/evidence. Retention failure neither re-enables access nor deletes data.

## 6. Customer-safe and actor allowlists

No UI is chosen. A later server surface may return only this **customer-safe derived contract/account summary** after the derived access check:

| Customer-safe allowlist | Explicit exclusion |
| --- | --- |
| Derived access allowed/denied and stable non-sensitive reason category. | Provider customer/subscription/invoice/payment IDs, payment method, raw webhook/payload/signature, exception metadata, internal notes, operator audit, reconciliation detail. |
| Effective entitlement period only when policy authorizes it, and scoped capability availability expressed safely. | Marketed plan, price, tax, discount, grace/dunning explanation, policy document, entitlement snapshot/pointer IDs, internal policy versions unless separately approved. |
| Caller's own verified-account status, own safe membership scope/role, and explicit organization/project selection state. | Other users' membership, tenant commercial state, internal lifecycle, service-role result, control data, or audit data. |

The downstream entitlement contract remains private to trusted server consumers. A separate server view-model may derive the customer-safe result; it must not forward the resolver output wholesale to a browser.

| Actor | Allowlisted operations (UI-independent) | Prohibited operations |
| --- | --- | --- |
| Customer | Own login/logout, recovery, own verified email/password change through Auth proof, explicit scope selection, accept bound invitation, read own safe summary, request permitted account action. | Create/cancel/resend invitation; change membership role/status; alter contract/billing; move pointer; reconcile/lifecycle command; read provider/internal/audit data. |
| Authorized operator | Create/cancel/resend invitation; suspend/revoke/reactivate membership; approved manual contract command; reconcile receipt/projection; policy activation only with separate product authority; Phase 3 lifecycle command; all verified/reasoned/audited server command. | Act as customer, use service role as actor, expose raw provider payload, bypass Phase 3 authorization/evidence. |
| Provider-neutral adapter | Normalize manual fixture or future validated provider input into receipt/fact command. | Live provider API/webhook in Stage 1; direct RLS bypass/pointer write; actor/operator impersonation. |
| Service role | Execute server command after verified actor/event authorization. | Browser credential, actor classification, autonomous access grant, audit bypass. |
## 7. Proposed implementation split: three Waves maximum

No child Issue is created by this Stage 1 baseline. Each child requires its own later R2/R3 Execute approval.

```text
Wave 1
  P4-A: common canonical Phase 4 state/event persistence and server command boundary
      |\
      | \-- Wave 2 P4-B: account, invitation, membership, and derived-access commands
      |
      \---- Wave 2 P4-C: fixture/normalized-event adapter, contract projection,
                           entitlement and lifecycle integration
                 \         /
                  \-------/
                   Wave 3 P4-D: compatibility cutover and end-to-end release gate
```

| Wave | Proposed child Issue | Scope owned by the child | Parallel/decision boundary |
| --- | --- | --- | --- |
| 1 | P4-A: common canonical authority/state/event foundation | Sole Phase 4 additive persistence owner: business lifecycle current plus append-only history; invitation current/history or one-time contract; provider-neutral contract current plus append-only events; normalized billing receipt/dedupe/order/reconciliation; causal references to Phase 3 policy/snapshot/lifecycle/audit; server-only command interfaces; compatibility-inventory gate. | No provider, price, registration, or live-cutover decision. Stable shared schema/interface and fixture boundary complete before Wave 2. |
| 2 | P4-B: account/invitation/membership and derived access | Auth-adjacent server commands, invitation acceptance, membership commands, explicit scope selection, and derived customer-access gate using P4-A/Phase 3 contracts. | Depends on P4-A; edits no migration and no P4-C contract/billing files. No final UI/registration decision. |
| 2 | P4-C: provider-neutral fixture, billing normalization, and projection | Manual fixture plus provider-neutral normalized-event adapter; contract projection; atomic snapshot/pointer effect; lifecycle checkpoint/outbox recovery; negative/idempotency tests. | Depends on P4-A; edits no migration/Auth flow; no live provider call. Interface, fixture, and fail-closed policy hooks can precede provider/price/trial/cadence choice; policy activation/live cutover cannot. |
| 3 | P4-D: compatibility cutover and release proof | End-to-end security/recovery/compatibility/customer-safe/operator-audit proof and release/cutover gate. | Depends on P4-B/P4-C. It alone proposes compatibility cutover and does not expand into Phase 5-10. |

## 8. Compatibility, rollback, and stop conditions

Keep legacy `plan_configs`, `customer_profiles`, `customer_subscriptions`, and demo bootstrap read-compatible until P4-D proves approved cutover. Do not infer commercial truth from mutable/demo rows. Preserve healthy entitlement/access behavior when a new command path fails. Roll back through feature-gated read routing and compensating event/snapshot/correction records, never destructive cleanup or historical mutation.

Stop for Human review if a product decision is required; a proposal weakens Phase 3 fail-closed behavior; an effect cannot be atomic or durably recoverable; a legacy row would become authority; DB/Supabase/provider/environment/production use is needed without approval; or lifecycle, membership, entitlement, audit, customer-safe, or retention evidence fails.

## 9. Stage 1 approved acceptance record

- OWNER record 5135247884 approved this Stage 1 baseline after these five documentation corrections.
- Authority order, real evidence paths, transition matrix, invitation rules, billing separation, atomic/recovery contract, three-Wave boundary, deferred product decisions, and customer-safe allowlists are synchronized with the Exec Plan.
- Stage 2 child Execute remains unapproved. No child Issue, product implementation, migration, Auth/DB/Supabase/provider action, or UI decision is created by this document.