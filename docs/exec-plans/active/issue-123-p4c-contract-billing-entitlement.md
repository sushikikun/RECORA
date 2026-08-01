# Exec Plan: Issue #123 - P4-C contract billing entitlement integration

> Status: **Draft PR / Human review**
> Issue: [#123](https://github.com/sushikikun/RECORA/issues/123)
> Parent: [#119](https://github.com/sushikikun/RECORA/issues/119)
> OWNER Execute record: [5146829541](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5146829541)
> Scope clarification: [5147041024](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5147041024)
> PR review authority: [5147396871](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5147396871)
> Latest OWNER blocking authority: [5149660032](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5149660032)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Baseline: `origin/master` = `565dab92f065c608fbdf0ee62c423186fc2994ed`
> Branch: `codex/issue-123-p4-c`
> PR: [#126](https://github.com/sushikikun/RECORA/pull/126) Draft

## Authority and scope

Issue #123 is authorized by OWNER Execute comment `5146829541`, narrowed by
`5147041024`, remediated for PR #126 by `5147396871`, and corrected for the six
blocking items in `5149660032`. P4-A migration,
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
  Phase 3 operator audit event before moving the pending checkpoint/outbox to
  `reconciliation_required`.
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

Completed on 2026-08-01 against latest local head:

- Issue #123 full matrix: `RECORA_ISSUE_123_DB_CONTAINER=supabase_db_recoraissue123 RECORA_ISSUE_123_SUPABASE_WORKDIR=C:/tmp/recora-issue-123-p4c-supabase npx tsx scripts/verify-issue-123-p4c-contract-billing-entitlement.ts` passed.
- Supabase reset matrix on the Issue #123 workdir passed: `db reset --local --yes --no-seed`, `db reset --local --yes`, and seeded re-reset `db reset --local --yes`.
- P4-A regression passed on the Issue #123 isolated container via a `C:/tmp` retargeted copy of `scripts/verify-issue-121-p4a-common-contract-state-events.ts`.
- Phase 3 3A-3H integration/security suite passed on the Issue #123 isolated container via a `C:/tmp` retargeted copy of `scripts/verify-issue-117-phase3-integration-security.ts`.
- Supabase advisors: `node node_modules/supabase/dist/supabase.js --workdir C:/tmp/recora-issue-123-p4c-supabase db advisors --local` passed with `No issues found`.
- `npm run recora:preflight:full` passed. Local warnings only: `.env.local` missing, mixed migration naming style, known mock/static dashboard fallback refs, and LF/CRLF notices.
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