# Exec Plan: Issue #123 - P4-C contract billing entitlement integration

> Status: **Draft PR / Human review**
> Issue: [#123](https://github.com/sushikikun/RECORA/issues/123)
> Parent: [#119](https://github.com/sushikikun/RECORA/issues/119)
> OWNER Execute record: [5146829541](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5146829541)
> Scope clarification: [5147041024](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5147041024)
> PR review authority: [5147396871](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5147396871)
> Latest OWNER blocking authority: [5151017104](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5151017104)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Baseline: `origin/master` = `565dab92f065c608fbdf0ee62c423186fc2994ed`
> Branch: `codex/issue-123-p4-c`
> PR: [#126](https://github.com/sushikikun/RECORA/pull/126) Draft

## Authority and scope

Issue #123 is authorized by OWNER Execute comment `5146829541`, narrowed by
`5147041024`, remediated for PR #126 by `5147396871`, corrected for the six
blocking items in `5149660032`, updated for the confirm/reconcile blocking
items in `5150078684`, the recovery/retry/transitive-supersession blockers in
`5150556826`, and the attempt/reconcile receipt-to-effect causal binding
blockers in `5151017104`. P4-A migration,
`lib/recora/phase4-command-contract.ts`, and the merged Phase 3 entitlement,
lifecycle, tenant, and operator contracts remain read-only authorities.

Allowed changes remain limited to this Exec Plan, the P4-C function-only additive
migration, the P4-C server-only RPC client/DTO module, and the Issue #123 local
verifier. Out of scope: editing existing migrations, schema/table/column/RLS/type
changes, `recora_private` exposure, generic mutation RPCs, P4-B files, live
providers/webhooks, pricing/product decisions, direct SQL drivers in runtime code,
package/lockfile changes, remote/production DB writes, Ready conversion, merge,
Issue close, and #124 start.

## Implementation result

- The provider-neutral command no longer accepts `downstreamEffectResult`, caller
  policy keys, caller fingerprints, resolved entitlements, capabilities/limits, or
  access flags. Provider fixture input cannot decide downstream completion or
  customer access.
- `public.recora_p4c_apply_contract_billing_entitlement_command` is an
  action-specific service-role-only SECURITY DEFINER RPC. It derives policy from
  authorized operator evidence, builds or checks the canonical fingerprint inside
  Postgres, locks authoritative P4 contract rows, and performs dedupe, ordering,
  projection, billing receipt/payment fact, immutable entitlement snapshot/pointer,
  and pending checkpoint/outbox creation in one transaction.
- Apply now stops at pending checkpoint/outbox for lifecycle-affecting effects.
  Completion is separated into `public.recora_p4c_confirm_lifecycle_checkpoint_command`,
  which requires actual Phase 3 lifecycle event/current evidence and records a
  completed correction checkpoint/outbox with an independent command receipt.
- Failed or denied lifecycle evidence is separated into
  `public.recora_p4c_reconcile_lifecycle_checkpoint_command`, which verifies the
  Phase 3 operator audit event before superseding the prior blocker with a P4-A
  correction row and creating a new `reconciliation_required` checkpoint/outbox
  bound to the action-specific reconcile receipt, request, and correlation.
- `public.recora_p4c_record_lifecycle_checkpoint_attempt_command` records
  action-specific retry evidence for lifecycle checkpoint attempts: retryable
  failure, failed-to-pending retry scheduling, retry exhaustion, and recovery
  after exhaustion. Because P4-A checkpoint/outbox command receipt identities are
  immutable, each accepted attempt safely supersedes the prior blocker with a
  correction row and creates a new current blocker whose events are bound to the
  attempt receipt, request, and correlation.
- A later correct Phase 3 lifecycle success event can now confirm a previously
  reconciled or exhausted checkpoint/outbox, producing a completed correction and
  superseding the original blocker.
- Confirm/reconcile now check their idempotency receipts before mutable checkpoint
  state filters, bind operator evidence exactly to the checkpoint and Phase 3
  evidence command, require causal Phase 3 reason evidence derived from the
  checkpoint id, and replay the same command after supersession/recovery without
  turning failed commands into accepted replays.
- Plan policy resolution is bounded to the currently effective authoritative
  policy head across the full supersession chain. Unauthorized policy
  substitution, future policy, expired policy, direct superseded-current policy,
  and transitive non-head policy paths fail closed.
- Billing receipts remain `applied` while lifecycle effects are pending;
  checkpoint/outbox completion is only produced by the confirm RPC after actual
  Phase 3 lifecycle evidence. A later authoritative payment success compensates
  pending suspension effects by creating completed correction checkpoint/outbox
  rows and superseding the pending effect.
- The TypeScript server-only module now exposes apply, confirm, and reconcile
  wrappers with the same exact-result fail-closed validation contract.
- The customer-safe result is generated only after committed RPC work re-evaluates
  the real Phase 3 entitlement resolver, Phase 3 lifecycle hard ceiling, and P4
  checkpoint gate. Plan-stage and uncommitted envelopes remain fail-closed.
- The TypeScript boundary validates exact one-row RPC results, exact keys, strict
  primitive types, known outcome/reason enums, plain capabilities/limits objects,
  and rejects extra rows/keys, string booleans, accessors, Proxy traps, and
  customer-unsafe internal keys.

## Isolation

Issue #123 uses the Codex worktree at:

`C:/Users/nakan/.codex/worktrees/22f6/recora-main`

The isolated local Supabase stack uses:

- Workdir: `C:/tmp/recora-issue-123-p4c-supabase`
- Guarded DB container: `supabase_db_recoraissue123`

No Issue #122 Supabase stack, linked remote, production database, live provider,
or webhook path was used.

## Verification record

Completed on 2026-08-01 against latest local head after OWNER `5151017104`:

- Supabase reset matrix on the Issue #123 workdir passed: `db reset --local --yes --no-seed`, `db reset --local --yes`, and seeded re-reset `db reset --local --yes`.
- Issue #123 full matrix passed after the final attempt/reconcile receipt-to-effect fix: `RECORA_ISSUE_123_DB_CONTAINER=supabase_db_recoraissue123 RECORA_ISSUE_123_SUPABASE_WORKDIR=C:/tmp/recora-issue-123-p4c-supabase npx tsx scripts/verify-issue-123-p4c-contract-billing-entitlement.ts`.
- The Issue #123 matrix includes provider-neutral fixture checks; billing receipt/payment fact projection; immutable entitlement snapshot/pointer derivation; pending checkpoint/outbox creation; recovery from `reconciliation_required` and exhausted checkpoints by later correct Phase 3 success evidence; retryable failure, too-early failed-to-pending retry without an accepted receipt, later same-retry success after `next_attempt_at`, attempt count, retry exhaustion, exhaustion recovery, accepted receipt tracing to exact checkpoint/outbox effects and action request/correlation, replay without extra checkpoint/outbox events, conflict/concurrency, rollback, double snapshot/effect prevention, and customer access recovery.
- Negative coverage includes malformed RPC rows, extra rows/keys, string `false`, accessors, Proxy traps, unknown outcome/reason, failed-command same retry, unauthorized policy substitution, future/expired/superseded/direct and transitive non-head policies, lifecycle hard ceiling, and checkpoint completed with lifecycle suspended.
- P4-A regression passed on the Issue #123 isolated container via a `C:/tmp` retargeted copy of `scripts/verify-issue-121-p4a-common-contract-state-events.ts`.
- Phase 3 3A-3H integration/security suite passed on the Issue #123 isolated container via a `C:/tmp` retargeted copy of `scripts/verify-issue-117-phase3-integration-security.ts`; its reset matrix also reported migration-only, seeded, and seeded-idempotency passed.
- Supabase advisors passed: `node node_modules/supabase/dist/supabase.js --workdir C:/tmp/recora-issue-123-p4c-supabase db advisors --local` reported `No issues found`.
- `npm run recora:preflight:full` passed. Local warnings only: `.env.local` missing, mixed migration naming style, known mock/static dashboard fallback refs, uncommitted/important-area changes for 3 files within the approved file set, and LF/CRLF notices.
- `npm run typecheck` passed.
- `npm run lint` passed with no ESLint warnings or errors.
- `npm run build` passed. Existing warning: `metadataBase` fallback to localhost.
- `git diff --check` passed with LF/CRLF notices only.
- `npm run recora:commit-check`: nested `recora:preflight:full` and typecheck passed; it exited 1 only on the repository-wide manual migration gate `supabase migrations: migration commits are not auto-allowed yet`. This is expected for the OWNER-authorized P4-C function-only migration and is recorded as the manual R3 commit gate.

## Stop conditions

Stop at Draft PR / Human review. Do not mark Ready, merge, close Issue #123, close
parent #119, or start #124. Stop and record evidence if any remote/production
write, product/provider decision, package/lockfile change, generic mutation RPC,
or broader schema/RLS change becomes necessary.