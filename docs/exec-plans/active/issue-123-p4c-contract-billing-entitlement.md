# Exec Plan: Issue #123 - P4-C contract billing entitlement integration

> Status: **Ready for Draft PR / Human review**
> Issue: [#123](https://github.com/sushikikun/RECORA/issues/123)
> Parent: [#119](https://github.com/sushikikun/RECORA/issues/119)
> OWNER Execute record: [5146829541](https://github.com/sushikikun/RECORA/issues/123#issuecomment-5146829541)
> Risk: R3 / Execution: Local Codex / Specification: Full
> Baseline: `origin/master` = `565dab92f065c608fbdf0ee62c423186fc2994ed`
> Branch: `codex/issue-123-p4-c`

## Authority and scope

The latest Issue #123 OWNER Execute record is the task authority. It consumes P4-A
as the read-only persistence/interface authority, the merged Phase 3 entitlement,
lifecycle, and operator-audit contracts as downstream authorities, and the
approved Phase 4 parent specification as the product-decision boundary.

Allowed changes are limited to this Issue #123 Exec Plan, a P4-C server-only
contract/billing/entitlement/lifecycle integration module, the Issue #123 local
verifier, and minimal documentation synchronization if required.

Out of scope: migration, schema, RLS, P4-B Auth/invitation/membership/access files,
live webhook endpoints, signature SDKs, payment provider APIs, pricing, trial,
grace, dunning, refund, billing cadence, policy activation, production cutover,
remote or linked databases, `.env`, deploy, package, lockfile, new dependencies,
Ready conversion, merge, Issue close, #124 start, and worktree deletion.

## Implementation plan

1. Add a server-only P4-C module that validates provider-neutral fixture envelopes
   with exact plain-object checks, rejects sensitive/internal references, maps the
   envelope to P4-A command fixtures, classifies duplicate/conflict/ordering cases,
   and emits only a customer-safe derived result.
2. Add an Issue #123 verifier guarded to
   `RECORA_ISSUE_123_DB_CONTAINER=supabase_db_recoraissue123` and an absolute
   temporary Supabase workdir under `C:/tmp`.
3. In the verifier, use only provider-neutral fixture data and the Issue #123 local
   Supabase database to prove:
   - receipt validation, duplicate replay, idempotency conflict, source ordering,
     contradictory payment fact, and correction lineage
   - deterministic contract projection updates
   - immutable entitlement snapshot creation and same-scope current pointer switch
   - atomic rollback on partial receipt/projection failure
   - checkpoint/outbox fail-closed, retry, retry exhaustion, correction, and recovery
   - cross-tenant/project denial and concurrent replay safety
   - customer-safe result excludes provider, billing, audit, payload, and pointer
     internals
4. Re-run Phase 3 3A-3H regressions and P4-A contract regression against the same
   isolated Issue #123 database by retargeting existing verifier container guards
   only in temporary copies when needed.
5. Run required local checks: advisors, `npm run recora:preflight:full`, explicit
   typecheck, lint, build, `git diff --check`, commit-check, scope/secret/env/DB
   URL/lockfile checks.

## Isolation

Issue #123 uses the current Codex worktree at:

`C:/Users/nakan/.codex/worktrees/22f6/recora-main`

The branch starts from `565dab92f065c608fbdf0ee62c423186fc2994ed`. The isolated
local Supabase stack must use a temporary workdir, non-default ports, and
container guard `supabase_db_recoraissue123`. It must not reuse Issue #122 or
any linked/remote/production Supabase project.

## Progress log

- 2026-08-01: Start gate read. Issue #123 OWNER Execute record `5146829541`
  authorizes R3 Local Codex execution from baseline `565dab92...`.
- 2026-08-01: `git fetch origin` succeeded. The worktree was clean detached at
  `565dab9`, matching `origin/master`; `git-common-dir` is
  `C:/Users/nakan/work/recora-main/.git`, not OneDrive.
- 2026-08-01: Created branch `codex/issue-123-p4-c` from
  `565dab92f065c608fbdf0ee62c423186fc2994ed`.
- 2026-08-01: Initial `recora:whereami` and `recora:before-codex` failed before
  dependency installation because `tsx` was not present. `npm ci` installed the
  existing lockfile dependencies without package or lockfile edits; both checks
  then passed. `.env.local` is missing, which is acceptable for this local
  fixture-only task and no `.env` was read.

## Stop conditions

Stop and record evidence on Issue #123 and parent #119 if any required persistence
or P4-A/Phase 3 interface is missing, a migration or package/lockfile change would
be required, a product/provider decision is required, a live provider/webhook/API
or production/remote DB action is needed, or a validation weakens fail-closed
behavior.

## Verification record

Completed on 2026-08-01 against Issue #123 isolated local Supabase workdir
`C:/tmp/recora-issue-123-p4c-supabase` and guarded container
`supabase_db_recoraissue123`.

Passed:

- `scripts/verify-issue-123-p4c-contract-billing-entitlement.ts`: provider-neutral envelope validation, receipt duplicate/conflict/ordering, payment fact contradiction and correction lineage, contract projection, immutable entitlement snapshot plus current pointer switch, partial-failure rollback, checkpoint/outbox fail-closed/retry-exhaustion/correction recovery, cross-tenant/project rejection, concurrent replay, and customer-safe output boundary.
- P4-A regression via temporary retargeted copy of `scripts/verify-issue-121-p4a-common-contract-state-events.ts` against the Issue #123 container: all P4-A RLS/grants, payload fingerprint boundary, idempotency/conflict, checkpoint, invitation, payment/delete/renewal, parent/project scope, and concurrent idempotency cases passed.
- Phase 3 integration regression via temporary retargeted copy of `scripts/verify-issue-117-phase3-integration-security.ts` against the Issue #123 container: 3A-3H tenant, composite isolation, entitlement history, operator audit, retention/deletion, AI payload safety, catalog/type/grant drift, and customer-information-boundary matrix passed.
- `node ./node_modules/supabase/dist/supabase.js --workdir C:/tmp/recora-issue-123-p4c-supabase db advisors --local`: no issues found.
- `npm run recora:preflight:full`: passed. Expected local warnings were `.env.local` missing, mixed migration naming style, and known mock/static fallback references; no FAIL rows.
- `npm run typecheck`: passed directly before and as part of `recora:preflight:full`.
- `npm run lint`: passed with no ESLint warnings or errors.
- `npm run build`: passed. Existing warnings were the Supabase Edge Runtime `process.version` import trace, missing `metadataBase` fallback to localhost, and webpack large-string cache warnings.
- Scope checks: no package/lockfile, Supabase migration, or `lib/recora/phase4-command-contract.ts` diff; changed files are limited to this Exec Plan, the new P4-C module, and the new Issue #123 verifier.
- Secret/URL scan over changed files: no DB URL, service-role key, API key, token, or secret pattern found.

Final pre-commit pass after staging the approved files only:

- `git diff --cached --check`: passed.
- `npm run recora:commit-check`: passed with PASS=8, WARN=0, FAIL=0.
