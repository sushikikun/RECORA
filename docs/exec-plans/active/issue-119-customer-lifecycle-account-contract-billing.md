# Exec Plan: Issue #119 - Phase 4 customer lifecycle, account, contract, and billing

> Status: **Stage 1 Human review approved; P4-B and P4-C child Execute approved with Draft PRs in Human review; P4-D / #124 unstarted and unapproved**
> Issue: [#119](https://github.com/sushikikun/RECORA/issues/119)
> OWNER review record: [5135247884](https://github.com/sushikikun/RECORA/issues/119#issuecomment-5135247884)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Approved baseline: `origin/master` = `787fe84b48456bab569b6b5c043d6852271a674f` (PR #118 merge)
> Updated: 2026-08-01

## 1. Authority and authorization boundary

Authority order is: latest Issue #119 OWNER record; merged Phase 3 contracts; this Human-review-approved Phase 4 Stage 1 specification/plan; then only compatible reference architecture and legacy/static evidence. The post-launch operations architecture is a compatible reference only and cannot override the OWNER record or Phase 3.

This plan records the approved Stage 1 baseline. Stage 1 itself authorized none of those operations; later OWNER Execute records separately authorize the narrow P4-B and P4-C child scopes below. P4-D / #124 remains unstarted and unapproved.

The normative companion is [`recora-customer-lifecycle-account-contract-billing.md`](../../recora-customer-lifecycle-account-contract-billing.md). It owns the full transition matrix, atomicity/recovery contract, and customer-safe allowlists; this plan makes them delivery gates.

## 2. Fixed current-master evidence

| Area | Verified latest-master evidence | Stage 1 conclusion |
| --- | --- | --- |
| Identity | [`app/signup/actions.ts`](../../../app/signup/actions.ts) creates Auth identity only. | Identity is necessary, never customer access. |
| Membership | [`20260729151417_tenant_ownership_accepted_membership.sql`](../../../supabase/migrations/20260729151417_tenant_ownership_accepted_membership.sql#L168) stores state/acceptance and [predicate](../../../supabase/migrations/20260729151417_tenant_ownership_accepted_membership.sql#L258) requires accepted active membership. | Reuse Phase 3 predicate; missing/invited/suspended/revoked/ambiguous denies. |
| Organization lifecycle | [`20260730163156_recora_authoritative_lifecycle_rls_access.sql`](../../../supabase/migrations/20260730163156_recora_authoritative_lifecycle_rls_access.sql#L28) resolves scope and [hard ceiling](../../../supabase/migrations/20260730163156_recora_authoritative_lifecycle_rls_access.sql#L157). | Preserve organization ceiling; project only restricts. |
| Entitlement | [`20260729163300_recora_plan_entitlement_history.sql`](../../../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L57) has immutable policy/snapshot history, [pointer](../../../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L264), [server resolver](../../../supabase/migrations/20260729163300_recora_plan_entitlement_history.sql#L337). | New snapshot/pointer with causal reference; no mutation/browser exposure. |
| Data lifecycle | [`20260730130000_recora_retention_deletion_state.sql`](../../../supabase/migrations/20260730130000_recora_retention_deletion_state.sql#L8) has state and [events](../../../supabase/migrations/20260730130000_recora_retention_deletion_state.sql#L144). | Only Phase 3 command/evidence owns lifecycle. |
| Legacy commercial inventory | [`20260627204737_recora_admin_p0a.sql`](../../../supabase/migrations/20260627204737_recora_admin_p0a.sql#L35). | Compatibility-only; no commercial/customer-access authority. |
| Demo bootstrap | [`20260701073553_recora_internal_demo_subscription.sql`](../../../supabase/migrations/20260701073553_recora_internal_demo_subscription.sql#L14). | Internal demo, not production contract/payment fixture. |
| Customer surface | [`lib/recora/db/dashboard.ts`](../../../lib/recora/db/dashboard.ts), [`app/dashboard/layout.tsx`](../../../app/dashboard/layout.tsx). | Future surface consumes derived customer-safe output only. |

## 3. Stage 1 invariants and delivery gates

1. Customer access derives only from verified identity, accepted active membership, exactly one active organization lifecycle, project ownership, valid current entitlement, project restriction, and completed required downstream checkpoints.
2. The companion matrix separates ten domains: Auth facts, invitation lifecycle, membership, business lifecycle, contract projection, billing receipt processing, normalized payment fact, entitlement/current pointer, derived access, and Phase 3 data lifecycle. `trial`, `past_due`, payment failure, pause, cancel, and reactivation remain technical facts/policy hooks; commercial timing/access result is undecided.
3. P4-A must make event dedupe, append-only event, projection, snapshot, pointer, and applied receipt one transaction/equivalent atomic command when in one store. A non-transactional lifecycle effect requires durable outbox/checkpoint, retryable receipt, and fail-closed access until receipt succeeds.
4. `applied` requires all required downstream effects and causal/audit receipt. Unsafe ordering, contradictory idempotency, incomplete chain, or bounded retry failure is `reconciliation_required`. Correction is compensating append-only evidence only.
5. Customer-safe derived result is separate from server-side entitlement resolution. Provider IDs/payloads, payment data, notes, audit, exception metadata, and policy/pointer internals are not customer output.
6. The P4-B customer-safe entitlement projection exposes only `capabilityAllowed`; it does not freeze product keys such as `report.view`, `export.data`, or `projects`. Safe technical P4-C-shaped keys such as `measurement`, `analysis`, and `prompts` may resolve, while sensitive namespaces fail closed. Operator rejection after authorization records one exact-target denied audit with reason, failure code, request ID, and correlation ID, and creates no accepted receipt or domain mutation.

## 4. Deferred product decisions

No provider, merchant/tax/invoice model, registration/onboarding/invite route, plan name/price/currency/free period/cadence, proration/refund/grace/dunning, sales model, seat/usage measure, contract template, or final UI is decided. P4-C Issue #123 is now Execute-approved for its provider-neutral interfaces, manual fixtures, normalized events, fail-closed policy hooks, and function-only additive migration in Draft PR #126 / Human review. Policy activation and live cutover still await separate product authority.

## 5. Minimum child-Issue graph: three Waves maximum

No child Issue is created by Stage 1.

```text
Wave 1: P4-A common canonical authority/state/event persistence + command boundary
             |\
             | \-- Wave 2: P4-B account/invitation/membership/derived access (one approved additive RPC migration exception)
             |
             \---- Wave 2: P4-C fixtures/event adapter/projection/entitlement/lifecycle (function-only additive migration)
                         \       /
                          \-----/
                    Wave 3: P4-D compatibility cutover and end-to-end release gate
```

| Proposed child | Wave | Required scope | Dependency and anti-conflict boundary |
| --- | --- | --- | --- |
| P4-A: common Phase 4 authority/state/event foundation | 1 | Sole additive persistence owner: business lifecycle current/history; invitation current/history or one-time contract; provider-neutral contract current/events; normalized billing receipt/dedupe/order/reconciliation; Phase 3 policy/snapshot/lifecycle/audit causal links; server-only command interfaces; compatibility inventory gate. | No provider/price/registration/live-cutover decision. Stable shared schema/interface/fixture boundary completes before Wave 2. |
| P4-B: account, invitation, membership, derived access | 2 | Auth-adjacent server commands, authenticated invitation accept, membership commands, explicit scope selection, and a minimal customer-safe access projection using P4-A/Phase 3. | Depends on P4-A; OWNER comments `5147037668`, `5149714147`, `5150122269`, `5150482336`, and `5151116159` on Issue #122 allow exactly one narrow additive P4-B RPC migration plus minimal customer-session actor evidence inside that same migration. Post-authorization domain rejection must retain exact denied audit evidence without accepted P4/domain mutation. No P4-C contract/billing file edits. No final UI/registration decision. |
| P4-C: provider-neutral fixture, projection, lifecycle integration | 2 | Manual fixture/normalized-event adapter; projection; immutable snapshot/pointer effect; lifecycle checkpoint/outbox; negative/idempotency tests; one function-only additive migration. | Depends on P4-A; no Auth flow or live provider call. It may run parallel with P4-B under its separate Execute scope. |
| P4-D: cutover and release proof | 3 | End-to-end security/recovery/compatibility/customer-safe/operator-audit proof and release gate. | Depends on P4-B/P4-C; alone proposes compatibility cutover after separate approval. |

## 6. Delivery checkpoints

| Milestone | Status | Exit condition |
| --- | --- | --- |
| M1: Start gate and baseline | Complete | Dedicated worktree began from `787fe84...`; Phase 3 evidence statically verified. |
| M2: Formal authority/transition contract | Complete | Authority order, real evidence paths, ten domains, invitation semantics, billing separation, recovery, safe surfaces, and Waves are in companion spec. |
| M3: Stage 1 Human review approval | Complete | OWNER comment 5135247884 approved corrected baseline subject to three-document change, validation, master merge, and CI gates. |
| M4: Revalidation and merge gate | In progress | Required local/link/scope/secret checks, conflict-free non-force master merge, CI/thread/Vercel gates remain. |
| M5: Stage 2 child Execute | Partial | P4-B Issue #122 and P4-C Issue #123 have separate Execute authority and remain Draft PR #127 / #126 in Human review. P4-D / #124 remains unstarted and unapproved. |

## 7. Verification and stop conditions

Before merge require: preflight full, explicit typecheck, lint, build, commit-check, diff check, exact three-document changed/staged scope, broken relative-link/nonexistent-path scan, secret/env/DB-URL/token scan, and no product/Auth/migration/lockfile change. After conflict-free non-force latest-master merge, repeat relevant checks. Require Recora CI success, zero unresolved review threads, and Vercel success or only platform `build-rate-limit` with local build and Recora CI success.

Stop for merge conflict, scope/link/check failure, nonzero thread, CI failure, non-allowed Vercel failure, required undecided product choice, DB/Supabase/provider/Auth implementation request, or any weakened Phase 3 fail-closed contract.

## 8. Rollback and approved-baseline record

Future work is additive: retain compatible reads until P4-D proof; preserve healthy entitlement/access; use feature-gated read routing and compensating event/snapshot/correction records; never delete or overwrite commercial, entitlement, lifecycle, report, or audit history.

- 2026-07-31: Static audit from PR #118 baseline completed without DB/Supabase/Auth/provider/environment use.
- 2026-07-31: Stage 1 documentation PR #120 opened.
- 2026-07-31: OWNER record 5135247884 approved the Stage 1 baseline and five documentation corrections.
- 2026-08-01: P4-B Issue #122 was updated under OWNER comments 5149714147, 5150122269, 5150482336, and 5151116159 on branch `codex/issue-122-p4b-account-access`; PR #127 remains Draft / Human review. The tracked Phase 3 verifier `scripts/verify-issue-117-phase3-integration-security.ts` is the formal regression authority, and the Issue #122 verifier now covers P4-C-shaped safe entitlement projection plus exact rejection audit/no-mutation evidence. P4-C Issue #123 is separately Execute-approved with Draft PR #126 / Human review. P4-D / #124 remains unstarted and unapproved.
