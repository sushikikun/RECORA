# Issue #122 P4-B Account Access

## Authority

- Parent: Issue #119 P4 customer lifecycle/account/contract/billing.
- Execute authority: OWNER comment `5147037668` authorized the additive P4-B RPC migration; OWNER comment `5149714147` authorized the current-migration customer-session actor evidence and authenticated accept split; latest OWNER comments `5150122269`, `5150482336`, and `5151116159` authorize the PR #127 corrections recorded here, including provider-fixture/operator-evidence compatibility, email-confirmation, legacy-gate, replay, documentation, minimal customer-safe projection, P4-C-shaped entitlement integration, and post-authorization rejection audit evidence.
- Baseline: `565dab92f065c608fbdf0ee62c423186fc2994ed` / `origin/master`.
- Risk: R3. Execution lane: Local Codex only. Spec level: Full Spec. Approval: OWNER Execute comment. Ready: yes for the narrow P4-B additive RPC migration and server-only wrapper.

## Scope

Implement P4-B account access over the existing P4-A and Phase 3 contracts:

- Service-role-only action RPCs for invitation create, resend, revoke, and membership operations.
- Invitation acceptance is a separate authenticated-only RPC using `auth.uid()` plus `email_confirmed_at`-verified Auth email normalization and SHA-256 hashing; it creates the Phase 3 active membership and P4 membership episode/events in one transaction.
- Service-role-only operator commands for membership suspend, audited reactivate, and revoke.
- Revoked membership re-entry requires a new invitation and new membership episode; direct revoked-row reactivation is rejected.
- Derived customer access returns a customer-safe DTO from active accepted membership, lifecycle hard ceiling, entitlement snapshot, and P4 checkpoint gate.
- The customer-safe entitlement DTO is a minimal projection: it returns only `capabilityAllowed`, never the resolver capability/limit maps. It accepts safe technical P4-C-shaped keys such as `measurement`, `analysis`, and `prompts`, while provider, billing, audit, pointer, internal, raw, payload, secret, token, credential, authorization, and private namespaces fail closed.

## Non-Scope

- No `recora_private` Data API exposure.
- No edits to existing migrations, P4-A files, P4-C files, signup/login UI, live Auth writes, email sending, live providers, remote/production DBs, deployment, dependencies, package manifests, or lockfiles.
- No table, column, enum, index, constraint, or RLS additions/changes beyond the OWNER-approved additions inside the current P4-B migration: enum value `p4_source_kind = customer_session`, nullable `recora_private.p4_command_receipts.customer_auth_user_id uuid references auth.users(id) on delete restrict`, and the replacement `p4_command_receipt_actor_shape` constraint. The constraint permits provider_fixture with no evidence or a complete operator audit/command-receipt pair, and rejects customer evidence or half-pairs.
- No browser-role grants except authenticated-only invitation accept; no generic arbitrary-table mutation RPC.

## Implementation Notes

P4-A membership episode state is `invited`, `active`, `revoked`. Therefore suspend and audited reactivate are represented as Phase 3 `organization_members.membership_status` transitions with P4 command receipts and operator audit evidence while the P4 membership episode remains active. Revoke advances the P4 membership episode to `revoked` and then frees the Phase 3 user identity so a future rejoin must create a new invitation and episode.

Customer invitation acceptance is not operator or provider evidence: command receipts use `customer_session`, store the `auth.uid()` user in `customer_auth_user_id`, require `email_confirmed_at`, and pass the P4-A legacy-inventory gate. Operator commands continue to require explicit current identity, permission, scope, paired Phase 3 audit evidence, and service-role-only execution.

Expired pending invitations are finalized to `expired` with an append-only event before a new invitation ID is created for the same tenant recipient hash. Live resend creates a new pending ID and terminally invalidates the prior invitation as `superseded`, with `superseded_by_invitation_id` pointing at the replacement invitation. Expired pending resend/reinvite first finalizes the old row as `expired` with an append-only event, then creates a replacement pending ID. Operator replay revalidates current identity/permission/scope and target evidence, while recorded results are reconstructed from append-only evidence so replay remains stable after later accept, supersede, suspend, reactivate, revoke, or rejoin transitions.
After replay authorization succeeds, pending/state/expiry/recipient and membership-state rejections revalidate the current operator identity, permission, scope, and real invitation or membership target, then append one `denied` audit event containing the command reason, failure reason, request ID, and correlation ID. These rejection paths return no accepted P4 receipt, operator command receipt, invitation/membership event, current-row mutation, or membership episode mutation. Unexpected operator receipt failures retain a `failed` audit event.

## Verification Plan

Run the Issue #122 verifier against an isolated local Supabase project/container, then run migration reset coverage, Phase 3/P4-A regressions, advisors where available, preflight, typecheck, lint, build, diff, commit-check, and scope/secret/lockfile inspection. Stop at Draft PR / Human review.
## Verification Results

2026-08-01 PR #127 update on branch `codex/issue-122-p4b-account-access`:

- Isolated Issue #122 Supabase stack `supabase_db_recoraissue122p4b`: migration-only reset, seeded reset, and seeded reset idempotency all passed.
- `RECORA_ISSUE_122_DB_CONTAINER=supabase_db_recoraissue122p4b npx tsx scripts/verify-issue-122-p4b-account-access.ts` passed, covering authenticated accept positive, anon/service_role denial, no claimed user ID argument, unverified/mismatched/unconfirmed/cross-tenant/expired/revoked negatives, replay/conflict/concurrency, stale expired reinvite, admin permission, owner rejection, audit target consistency, actor-shape checks, and TypeScript DTO fail-closed cases.
- Latest OWNER comment `5151116159` is covered by the same formal verifier: P4-C-shaped `measurement`/`analysis`/`prompts` safe entitlement resolution, minimal `capabilityAllowed` DTO projection, exact post-authorization denial audits for pending/state/expiry/recipient/membership and cross-tenant rejection, temporal replay stability, and no accepted receipt or domain mutation on rejection.
- P4-A regression passed on the seeded Issue #121-only local stack with `RECORA_ISSUE_121_DB_CONTAINER=supabase_db_recoraissue121 npx tsx scripts/verify-issue-121-p4a-common-contract-state-events.ts`; the unseeded attempt was correctly rejected by the verifier prerequisite because its project fixture was absent.
- Phase 3 3A-3H regression now uses the tracked `scripts/verify-issue-117-phase3-integration-security.ts`, which allowlists only `public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)` for authenticated execution and asserts anon/service_role denial plus service-role-only grants on all other P4-B public RPCs.
- `npx supabase --workdir C:\tmp\recoraissue122p4b db advisors --local` passed with no issues. `npx supabase --workdir C:\tmp\recoraissue122p4b db lint --local` exited 0 with pre-existing volatility warnings in `recora_private.canonicalize_deletion_manifest_summary` and `recora_private.resolve_data_lifecycle_access`, both outside P4-B scope.
- `npm run recora:preflight:full`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run recora:dashboard-read-model:check` passed; build emitted only the existing `metadataBase` warning. Scope, forbidden-path, secret/DB-URL, lockfile, and `git diff --check` scans passed. `npm run recora:commit-check` re-ran preflight successfully but stopped on the generic migration auto-allow guard; manual normal commit is used under Issue #122 OWNER migration approval.
