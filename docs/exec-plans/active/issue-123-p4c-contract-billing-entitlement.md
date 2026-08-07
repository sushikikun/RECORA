# Exec Plan: Issue #123 - P4-C contract billing entitlement integration

> Status: **Draft PR / post-P4-B combined verification correction implemented; local full regression pending**
> Issue: [#123](https://github.com/sushikikun/RECORA/issues/123)
> Parent: [#119](https://github.com/sushikikun/RECORA/issues/119)
> PR: [#126](https://github.com/sushikikun/RECORA/pull/126) Draft
> Risk: R3 / Execution: Local Codex / Specification: Full
> Branch: `codex/issue-123-p4-c`
> Original P4-A baseline: `565dab92f065c608fbdf0ee62c423186fc2994ed`
> P4-B merge baseline: `2c2a6fba70b75e858abc71a7447840bf32f3507d`
> Post-P4-B synchronization parent head: `c8567c60f196ecf27e0c70753693ca1daec7c103`

## 1. Authority

The authority order for this work is:

1. OWNER Execute record `5146829541`.
2. P4-C function-only migration clarification `5147041024`.
3. P4-C correction records `5147396871`, `5149660032`, `5150078684`, `5150556826`, and `5151017104`.
4. P4-B merge and post-merge synchronization approval `5153841336`.
5. Post-sync blocking review `4836053412` and OWNER correction `5153935800`.
6. Five-file scope amendment `5153978894`.
7. Merge済みPhase 3、P4-A、P4-B contracts.

P4-A migration, P4-B migration, `lib/recora/phase4-command-contract.ts`, and the merged Phase 3 tenant, membership, entitlement, lifecycle, operator authorization, and audit contracts remain read-only authorities.

## 2. Approved file scope

The PR diff after the post-sync correction is limited to exactly these five files:

- `docs/exec-plans/active/issue-123-p4c-contract-billing-entitlement.md`
- `lib/recora/phase4-contract-billing-entitlement.ts`
- `scripts/verify-issue-123-p4bc-post-sync-integration.ts`
- `scripts/verify-issue-123-p4c-contract-billing-entitlement.ts`
- `supabase/migrations/20260731210957_p4c_contract_billing_entitlement_rpc.sql`

The new `verify-issue-123-p4bc-post-sync-integration.ts` file is verification orchestration only. It does not add product runtime behavior.

Out of scope:

- editing the merged P4-B migration;
- editing P4-A or Phase 3 migrations/contracts;
- schema/table/column/type/index/RLS changes beyond the already approved P4-C function-only migration;
- `recora_private` Data API exposure or a generic mutation RPC;
- signup, login, invitation UI, pricing, plan, provider, webhook, or product-policy decisions;
- package or lockfile changes, new dependencies, `.env` access, remote/production DB, deploy, email, live Auth/provider writes;
- Ready conversion, merge, Issue close, or Issue #124 start.

## 3. P4-C implementation

- Provider-neutral input cannot decide resolved entitlement, capabilities, limits, customer access, downstream completion, policy identity, or payload fingerprint.
- `public.recora_p4c_apply_contract_billing_entitlement_command` is an action-specific service-role-only `SECURITY DEFINER` RPC with an empty fixed `search_path`.
- It derives policy authority from exact operator evidence and performs dedupe, ordering, contract projection, billing receipt/payment fact, immutable entitlement snapshot/current pointer, and required checkpoint/outbox creation atomically.
- Lifecycle-affecting work remains pending until a separate evidence-bound checkpoint command confirms or reconciles the Phase 3 effect.
- Confirm, reconcile, and attempt commands use independent action receipts. They do not rebind immutable P4-A receipt identity or reuse the initial apply receipt for later effects.
- Retryable failure, delayed retry, exhaustion, reconciliation, correction, and recovery are append-only and idempotent.
- Customer-safe output is produced only after committed work re-evaluates Phase 3 entitlement, lifecycle hard ceiling, and P4 checkpoint gate.
- The TypeScript boundary accepts exactly one plain RPC row with exact keys and known scalar/reason types. Extra rows/keys, accessors, Proxy traps, malformed primitives, and customer-unsafe internal keys fail closed.

## 4. Post-P4-B combined-verification correction

The previous Issue #123 verifier copied only the P4-C migration into its temporary Supabase workdir. That allowed a stale workdir to pass without proving that merged P4-B actor evidence was installed.

The formal post-sync authority is now:

`scripts/verify-issue-123-p4bc-post-sync-integration.ts`

It must fail closed unless all of the following are true:

1. The checked-out head contains both exact migrations:
   - `20260731203135_p4b_account_invitation_membership_rpcs.sql`
   - `20260731210957_p4c_contract_billing_entitlement_rpc.sql`
2. P4-B sorts before P4-C.
3. Byte-identical copies of both migrations are synchronized into every isolated Phase 4/Phase 3 verification workdir before reset.
4. No stale duplicate P4-B/P4-C migration variant exists in those workdirs.
5. The real catalog includes `customer_session`, `customer_auth_user_id` with its `auth.users(id) ON DELETE RESTRICT` FK, and one active replacement `p4_command_receipt_actor_shape` constraint.
6. Real inserts prove the actor matrix:
   - provider fixture with no actor evidence: accepted;
   - provider fixture with a complete operator pair: accepted;
   - manual command with a complete operator pair: accepted;
   - customer-session command with customer Auth evidence only: accepted;
   - provider/manual half-pairs: rejected;
   - provider/manual commands containing customer evidence: rejected;
   - customer-session commands containing operator evidence or missing customer evidence: rejected.
7. The existing Issue #123, Issue #122, P4-A, and Phase 3 3A-3H verifiers all pass against synchronized workdirs containing both migrations.
8. Advisors, DB lint, application checks, exact diff scope, secret/DB-URL scan, whitespace, and the migration manual commit gate pass.

The orchestrator does not weaken or replace the existing dedicated matrices. It composes them and proves that each is running from the same synchronized repository head.

## 5. Isolation contract

All workdirs must be absolute temporary paths and all containers must match their exact guard names.

| Scope | Workdir environment | Container environment | Required container |
| --- | --- | --- | --- |
| Issue #123 | `RECORA_ISSUE_123_SUPABASE_WORKDIR` | `RECORA_ISSUE_123_DB_CONTAINER` | `supabase_db_recoraissue123` |
| Issue #122 | `RECORA_ISSUE_122_SUPABASE_WORKDIR` | `RECORA_ISSUE_122_DB_CONTAINER` | `supabase_db_recoraissue122p4b` |
| Issue #121 | `RECORA_ISSUE_121_SUPABASE_WORKDIR` | `RECORA_ISSUE_121_DB_CONTAINER` | `supabase_db_recoraissue121` |
| Issue #117 | `RECORA_ISSUE_117_SUPABASE_WORKDIR` | `RECORA_ISSUE_117_DB_CONTAINER` | `supabase_db_recoraissue117` |

The comparison baseline defaults to `RECORA_PHASE4_BASE_REF=origin/master` and must be an ancestor of the tested `HEAD`.

No linked, remote, or production database is permitted. No external provider/network operation is part of the verifier.

## 6. Formal execution command

Run from the clean P4-C worktree after fetching the current branch head:

```powershell
$env:RECORA_PHASE4_BASE_REF = "origin/master"
$env:RECORA_ISSUE_123_SUPABASE_WORKDIR = "C:\tmp\recora-issue-123-p4c-supabase"
$env:RECORA_ISSUE_123_DB_CONTAINER = "supabase_db_recoraissue123"
$env:RECORA_ISSUE_122_SUPABASE_WORKDIR = "C:\tmp\recoraissue122p4b"
$env:RECORA_ISSUE_122_DB_CONTAINER = "supabase_db_recoraissue122p4b"
$env:RECORA_ISSUE_121_SUPABASE_WORKDIR = "C:\tmp\recora-issue-121-p4a-supabase"
$env:RECORA_ISSUE_121_DB_CONTAINER = "supabase_db_recoraissue121"
$env:RECORA_ISSUE_117_SUPABASE_WORKDIR = "C:\tmp\recora-issue-117-supabase"
$env:RECORA_ISSUE_117_DB_CONTAINER = "supabase_db_recoraissue117"
npx tsx scripts/verify-issue-123-p4bc-post-sync-integration.ts
```

The operator must record `git rev-parse HEAD`, `git rev-parse origin/master`, both migration SHA-256 values, all four workdirs/containers, and the final command result in Issue #123 and parent Issue #119.

## 7. Verification state

### Historical pre-sync evidence

The pre-P4-B-sync P4-C matrix passed at head `f084ca2022317389f1a23d581eb9575effec7ba2`, including P4-C reset, the Issue #123 verifier, P4-A, Phase 3 3A-3H, advisors, preflight, typecheck, lint, build, diff, and the known migration manual gate.

This historical evidence is retained, but it is not post-sync integration proof.

### Current post-sync evidence

- Git synchronization parent `c8567c60f196ecf27e0c70753693ca1daec7c103` includes P4-B merge commit `2c2a6fba70b75e858abc71a7447840bf32f3507d` without rebase, force push, or history rewrite.
- Hosted Recora CI #232 and Vercel preview passed for the synchronization head.
- Static review found the combined-verifier gap and blocked Ready/merge.
- The combined orchestrator correction is implemented in the commit containing this plan.
- **Local four-stack full regression remains pending.** Do not mark this section PASS until the formal command above succeeds on the exact committed head and its evidence is recorded.

Required final gates:

- Issue #123 migration-only, seeded, and seeded-replay resets with both migrations;
- real catalog/actor-shape matrix;
- Issue #123 P4-C formal verifier;
- Issue #122 P4-B formal verifier;
- Issue #121 P4-A formal verifier;
- Issue #117 Phase 3 3A-3H formal verifier;
- Supabase advisors and DB lint;
- `npm run recora:preflight:full`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- `npm run recora:dashboard-read-model:check`;
- `git diff --check` and exact five-file scope;
- secret/env/DB URL/package/lockfile inspection;
- `npm run recora:commit-check`, allowing only the known OWNER-authorized migration manual gate.

## 8. Stop conditions

Stop and record evidence if:

- either migration is missing, altered, duplicated, or ordered incorrectly in any isolated workdir;
- catalog actor evidence differs from the P4-B contract;
- any dedicated verifier or reset fails;
- commit-check reports anything beyond the known migration manual gate;
- a sixth changed file, package/lockfile change, remote/production access, provider/product decision, or wider schema/RLS change becomes necessary.

PR #126 remains Draft / Human review. Do not mark Ready, merge, close Issue #123 or parent #119, start Issue #124, deploy, or delete the branch/worktree without a later explicit OWNER approval.
