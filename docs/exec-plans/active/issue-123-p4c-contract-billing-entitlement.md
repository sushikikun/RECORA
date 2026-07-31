# Exec Plan: Issue #123 - P4-C contract billing entitlement integration

> Status: **Draft PR / Human review**
> Issue: [#123](https://github.com/sushikikun/RECORA/issues/123)
> Parent: [#119](https://github.com/sushikikun/RECORA/issues/119)
> OWNER Execute record: [5146829541](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5146829541)
> Scope clarification: [5147041024](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5147041024)
> Latest PR review authority: [5147396871](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5147396871)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Baseline: `origin/master` = `565dab92f065c608fbdf0ee62c423186fc2994ed`
> Branch: `codex/issue-123-p4-c`
> PR: [#126](https://github.com/sushikikun/RECORA/pull/126) Draft

## Authority and scope

Issue #123 is authorized by OWNER Execute comment `5146829541`, with the narrow
migration exception in `5147041024` and the PR #126 remediation requirements in
`5147396871`. P4-A migration, `lib/recora/phase4-command-contract.ts`, and the
Phase 3 entitlement/lifecycle/operator contracts are read-only authorities.

Allowed changes are limited to this Exec Plan, one new P4-C-specific additive
function-only migration, the P4-C server-only RPC client/DTO module, and the Issue
#123 local verifier. The new public boundary must be action-specific,
service-role-only, `SECURITY DEFINER`, fixed empty `search_path`, fully-qualified
for schema objects, and must revoke `PUBLIC`/`anon`/`authenticated` execution.

Out of scope: editing existing migrations, schema/table/column/RLS/type changes,
recora_private exposure, generic mutation RPCs, P4-B files, live providers,
webhooks, pricing/product decisions, direct SQL drivers in runtime code,
package/lockfile changes, remote/production DB writes, Ready conversion, merge,
Issue close, and #124 start.

## Implementation result

- Added `20260731210957_p4c_contract_billing_entitlement_rpc.sql`, a function-only
  migration containing private helpers plus `public.recora_p4c_apply_contract_billing_entitlement_command`.
- The RPC locks authoritative P4 contract projection state, computes canonical
  fingerprints server-side, routes dedupe/idempotency through P4-A command
  receipts, writes billing receipt/payment fact/contract projection evidence,
  creates immutable Phase 3 entitlement snapshots from the current approved plan
  policy key, switches the current pointer, and derives checkpoint/outbox recovery
  from authoritative DB state in one transaction.
- Deferred P4-A constraint triggers are forced with `set constraints all immediate`
  inside the SECURITY DEFINER RPC so validation completes before returning to the
  service-role caller.
- Updated the server-only module to validate only normalized command input and to
  return `customerAccessAllowed=true` only from the committed RPC result after the
  Phase 3 resolver and P4 checkpoint gate are re-evaluated.
- Rewrote the verifier so P4-C state transitions use the actual service-role RPC;
  psql writes are limited to local fixture setup and catalog/invariant inspection.

## Isolation

Issue #123 uses the Codex worktree at:

`C:/Users/nakan/.codex/worktrees/22f6/recora-main`

The isolated local Supabase stack uses:

- Workdir: `C:/tmp/recora-issue-123-p4c-supabase`
- Guarded DB container: `supabase_db_recoraissue123`

No Issue #122 Supabase stack, linked remote, or production database was used.

## Verification record

Completed so far on 2026-08-01:

- `RECORA_ISSUE_123_DB_CONTAINER=supabase_db_recoraissue123 RECORA_ISSUE_123_SUPABASE_WORKDIR=C:/tmp/recora-issue-123-p4c-supabase npx tsx scripts/verify-issue-123-p4c-contract-billing-entitlement.ts`: passed.
  - Covered service-role RPC positive path, anon/authenticated denial, wrong tenant,
    stale ordering, conflicting canonical payload/idempotency conflict, concurrent
    identical replay, concurrent conflicting replay/conflict evidence, plan-stage
    no-allow, authoritative policy-derived snapshot/pointer, pending checkpoint
    fail-closed, reconciliation checkpoint recovery, transaction rollback/no
    residue, and customer-safe DTO boundary.
- `npm run recora:preflight:full`: passed. Expected local warnings only:
  `.env.local` missing, mixed migration naming style, known mock/static dashboard
  fallback references, and CRLF notice for the verifier file.
- `git diff --check`: passed with the same CRLF notice for the verifier file.
- `npm run lint`: passed with no ESLint warnings or errors.
- `npm run build`: passed. Existing warning: `metadataBase` fallback to localhost.
- `npm run recora:commit-check`: preflight/typecheck passed; commit-check stopped
  on its migration safety gate with `supabase migrations: migration commits are
  not auto-allowed yet`. This is expected for the OWNER-authorized P4-C
  function-only migration because `scripts/recora-safe-commit.ts` has no current
  migration allow flag or exception path.

## Stop conditions

Stop at Draft PR / Human review. Do not mark Ready, merge, close Issue #123, close
parent #119, or start #124. Stop and record evidence if any remote/production
write, product/provider decision, package/lockfile change, generic mutation RPC,
or broader schema/RLS change becomes necessary.