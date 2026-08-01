# Issue #122 P4-B Account Access

## Authority

- Parent: Issue #119 P4 customer lifecycle/account/contract/billing.
- Execute authority: latest OWNER comment `5149714147` on Issue #122, superseding `5147037668` only for the current unmerged P4-B migration actor-evidence additions.
- Baseline: `565dab92f065c608fbdf0ee62c423186fc2994ed` / `origin/master`.
- Risk: R3. Execution lane: Local Codex only. Spec level: Full Spec. Approval: OWNER Execute comment. Ready: yes for the narrow P4-B additive RPC migration and server-only wrapper.

## Scope

Implement P4-B account access over the existing P4-A and Phase 3 contracts:

- Service-role-only action RPCs for invitation create, resend, revoke, and membership operations.
- Invitation acceptance is a separate authenticated-only RPC using `auth.uid()` plus confirmed Auth email hashing; it creates the Phase 3 active membership and P4 membership episode/events in one transaction.
- Service-role-only operator commands for membership suspend, audited reactivate, and revoke.
- Revoked membership re-entry requires a new invitation and new membership episode; direct revoked-row reactivation is rejected.
- Derived customer access returns a customer-safe DTO from active accepted membership, lifecycle hard ceiling, entitlement snapshot, and P4 checkpoint gate.

## Non-Scope

- No `recora_private` Data API exposure.
- No edits to existing migrations, P4-A files, P4-C files, signup/login UI, live Auth writes, email sending, live providers, remote/production DBs, deployment, dependencies, package manifests, or lockfiles.
- No table, column, enum, index, constraint, or RLS additions/changes beyond OWNER comment `5149714147` additions inside the current P4-B migration: `customer_session`, one nullable Auth user evidence FK, and actor-shape fail-closed constraint.
- No browser-role grants except authenticated-only invitation accept; no generic arbitrary-table mutation RPC.

## Implementation Notes

P4-A membership episode state is `invited`, `active`, `revoked`. Therefore suspend and audited reactivate are represented as Phase 3 `organization_members.membership_status` transitions with P4 command receipts and operator audit evidence while the P4 membership episode remains active. Revoke advances the P4 membership episode to `revoked` and then frees the Phase 3 user identity so a future rejoin must create a new invitation and episode.

Customer invitation acceptance is not operator or provider evidence: command receipts use `customer_session` and store the `auth.uid()` user in the new Auth user evidence column, while operator/audit evidence is absent by actor-shape constraint. Operator commands continue to require explicit operator identity and service-role-only execution.

Expired pending invitations are finalized to `expired` with an append-only event before a new invitation ID is created for the same tenant recipient hash. Active resend creates a new pending ID and terminally invalidates the prior invitation as `revoked`; the P4-A `superseded` state remains a model state, but the existing P4-A partial pending unique index plus supersession FK/initial-state rules do not permit safe active supersede construction without editing P4-A, which is out of scope.

## Verification Plan

Run the Issue #122 verifier against an isolated local Supabase project/container, then run migration reset coverage, Phase 3/P4-A regressions, advisors where available, preflight, typecheck, lint, build, diff, commit-check, and scope/secret/lockfile inspection. Stop at Draft PR / Human review.
## Verification Results

2026-08-01 PR #127 update on branch `codex/issue-122-p4b-account-access`:

- Isolated Issue #122 Supabase stack `supabase_db_recoraissue122p4b`: migration-only reset, seeded reset, and seeded reset idempotency all passed.
- `RECORA_ISSUE_122_DB_CONTAINER=supabase_db_recoraissue122p4b npx tsx scripts/verify-issue-122-p4b-account-access.ts` passed, covering authenticated accept positive, anon/service_role denial, no claimed user ID argument, unverified/mismatched/unconfirmed/cross-tenant/expired/revoked negatives, replay/conflict/concurrency, stale expired reinvite, admin permission, owner rejection, audit target consistency, actor-shape checks, and TypeScript DTO fail-closed cases.
- P4-A regression passed with `RECORA_ISSUE_121_DB_CONTAINER=supabase_db_recoraissue121 npx tsx scripts/verify-issue-121-p4a-common-contract-state-events.ts`.
- Phase 3 3A-3H regression passed with an untracked temp copy of `scripts/verify-issue-117-phase3-integration-security.ts` that adds only the newly approved `public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)` authenticated RPC to the browser EXECUTE allowlist. The tracked pre-P4-B verifier otherwise stops on that expected new P4-B grant.
- `npx supabase db advisors --local` on the Issue #122 stack passed with no issues. `npx supabase db lint --local` exited 0 with pre-existing volatility warnings in `recora_private.canonicalize_deletion_manifest_summary` and `recora_private.resolve_data_lifecycle_access`, both outside P4-B scope.
- `npm run recora:preflight:full`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run recora:dashboard-read-model:check` passed. Build emitted the existing `metadataBase` warning only. `npm run recora:commit-check` re-ran preflight successfully but stopped on the generic migration auto-allow guard; manual normal commit is used under Issue #122 OWNER migration approval.