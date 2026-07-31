# Issue #122 P4-B Account Access

## Authority

- Parent: Issue #119 P4 customer lifecycle/account/contract/billing.
- Execute authority: latest OWNER comment `5147037668` on Issue #122.
- Baseline: `565dab92f065c608fbdf0ee62c423186fc2994ed` / `origin/master`.
- Risk: R3. Execution lane: Local Codex only. Spec level: Full Spec. Approval: OWNER Execute comment. Ready: yes for the narrow P4-B additive RPC migration and server-only wrapper.

## Scope

Implement P4-B account access over the existing P4-A and Phase 3 contracts:

- Service-role-only action RPCs for invitation create, resend, revoke, accept.
- Invitation acceptance creates the Phase 3 active membership and P4 membership episode/events in one transaction.
- Service-role-only operator commands for membership suspend, audited reactivate, and revoke.
- Revoked membership re-entry requires a new invitation and new membership episode; direct revoked-row reactivation is rejected.
- Derived customer access returns a customer-safe DTO from active accepted membership, lifecycle hard ceiling, entitlement snapshot, and P4 checkpoint gate.

## Non-Scope

- No `recora_private` Data API exposure.
- No edits to existing migrations, P4-A files, P4-C files, signup/login UI, live Auth writes, email sending, live providers, remote/production DBs, deployment, dependencies, package manifests, or lockfiles.
- No table, column, enum, index, constraint, or RLS additions/changes.
- No browser-role grants and no generic arbitrary-table mutation RPC.

## Implementation Notes

P4-A membership episode state is `invited`, `active`, `revoked`. Therefore suspend and audited reactivate are represented as Phase 3 `organization_members.membership_status` transitions with P4 command receipts and operator audit evidence while the P4 membership episode remains active. Revoke advances the P4 membership episode to `revoked` and then frees the Phase 3 user identity so a future rejoin must create a new invitation and episode.

## Verification Plan

Run the Issue #122 verifier against an isolated local Supabase project/container, then run migration reset coverage, Phase 3/P4-A regressions, advisors where available, preflight, typecheck, lint, build, diff, commit-check, and scope/secret/lockfile inspection. Stop at Draft PR / Human review.