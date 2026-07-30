# Exec Plan: Issue #117 Phase 3 integration/security suite

## Metadata

| Field | Value |
|---|---|
| Issue / parent | `#117` / `#102` |
| Risk / execution | `R3` / `Local Codex` |
| Spec / approval | `Full` / Issue-body `Execute` approval |
| Base | `origin/master` including PR #116 merge `f041c6cfd87e78d3fff3a8236c80acf79ca25814` |
| Branch | `codex/issue-117-phase3-integration-security` |
| Status | `Final correction and conditional merge gate (OWNER 5134202088)` |

## Objective and isolation

Prove the already-merged `102-3A` through `102-3G` contracts together on one
Issue #117-only local Supabase database. The suite fails closed when replay, a child
verifier, or the RLS/grant/function/schema matrix fails. It does not implement a Phase
4-10 feature.

- `scripts/verify-issue-117-phase3-integration-security.ts` runs migration-only and
  seeded reset, 3A-3F using temporary `C:/tmp` child copies with only their fixed local
  container guard replaced, the DB/network-free 3G verifier, and the matrix inventory.
- Because the 3F child intentionally replays its historical migration for its own contract,
  3H reapplies the current additive lifecycle migration before the final inventory and
  cross-component matrix. This verifies the actual final schema without altering 3F history.
- The only database is `supabase_db_recoraissue117`, with temporary workdir
  `C:/tmp/recora-issue-117-supabase` and non-colliding ports. Analytics, remote/linked
  DBs, `supabase db push`, real-data deletion, `.env`, external AI, URL fetch, and DNS
  are excluded.
- A temporary `server-only` marker shim under `C:/tmp` permits Node-only verifier
  execution without changing product source, dependencies, existing child verifiers, or
  migrations.

## Human review corrections

OWNER comment `5133496218` established the first lifecycle/RLS correction. OWNER
follow-up `5134202088` then identified three final blocking defects: the
`organization_members` policy bypassed lifecycle; a project-level `active` row could
reopen an organization-level deny; and seeded reset did not recreate the standard demo
lifecycle row.

The approved additive migration retains
`recora_private.resolve_data_lifecycle_access(uuid, uuid)` as the sole decision source.
It now evaluates exactly one organization-level lifecycle row first. Organization state
must be `active` before customer access or new measurement is permitted; missing,
ambiguous, and every non-active organization state deny regardless of project state.
Only then does one exact project lifecycle row act as an additional restrictive override;
no project row inherits the active organization state. The service-role-only public 3F
resolver and customer RLS helpers consume this same decision/reason contract.

The migration recreates the authenticated `organization_members` select policy with
`user_id = auth.uid()` and `recora_private.can_read_organization(organization_id)`. Thus
only an active member's own row is visible and organization lifecycle deny removes the
membership row as well. The seed now performs an idempotent organization-level `active`
upsert for `recora-internal-demo` immediately after organization creation. Neither path
creates inferred ownership, operator identity, audit event, or lifecycle event.
## Acceptance matrix after correction

| Boundary | Result |
|---|---|
| Migration-only baseline and two seeded resets on the same isolated DB | Pass; standard demo has exactly one active organization lifecycle fixture, no event, and anon customer-safe org/project/brand read before private fixtures |
| 3A-3G contracts including updated 3C | Pass; each exit code and machine `status: ok` |
| Active accepted customer | Own organization/project/customer-safe rows and exactly one own membership row only |
| All six organization non-active states, missing, ambiguous, and recovery | Data API/RLS UUID, slug, list, search, count, pagination, JOIN, helper, and membership row fail closed; active recovery restores only own scope |
| Organization hard ceiling and project restrictive override | Non-active/missing/ambiguous organization denies despite project `active`; active organization inherits absent project row and a project non-active row restricts only that project |
| Active/non-active/missing anon demo/local | Active only; non-active and missing demo denied |
| A/B substitution, raw/internal/browser-write/operator boundaries | Denied or unavailable |
| Public/private relation, policy, sequence, function, grant, and `SECURITY DEFINER` inventory | Pass; explicit browser signature allowlist and fixed empty `search_path` |
| PR #71 classification | Exact ten-area fixture; answer body/excerpt and citation/source retained, all raw/internal keys denied |
| 3C-3H catalog/type drift | Relations, columns, constraints, enums, signatures, lifecycle policy shape, and grants pass |
The installed CLI still requires a Platform token for `supabase gen types --local`.
No token, remote path, or `.env` was used. There is no generated DB-type
canonical file; the isolated catalog matrix is the drift authority and the
repository TypeScript typecheck is supplementary.

## Rollback and residual risk

This is a forward-only additive correction. A rollback, if approved, must be a
new reviewed migration that redefines both the public resolver and customer RLS
helpers together; bootstrap rows remain inert under the prior helper behavior
and are not destructively removed. Before any production application, a live
lifecycle-source inventory must verify that every pre-existing organization
without an organization-level row is intentionally compatible with the
bootstrap. Remote/production validation, provider runtime, URL fetch/DNS,
actual deletion/purge, deployment, and Phase 4–10 implementation remain out of
scope.

## Merge inventory and final conditional gate

| Contract | Issue / PR | merged `master` SHA |
|---|---|---|
| 102-3A | #80 / #81 | `5df688ac5dc76f30e73baef504ad06e46ec7d68d` |
| 102-3B | #105 / #106 | `6319ef7fb84a57e8f22b909190ce2e76d4aed135` |
| 102-3C | #107 / #112 | `d2353bde5f9d503b88c652c2fca29d1abd0cdd9a` |
| 102-3D | #108 / #111 | `2fb878acfecb9bf80a8a6f1d1c113797b38bcf6f` |
| 102-3E | #109 / #110 | `4c01eb0cdb3ae45c38dbad2b9596f14ee8df596e` |
| 102-3F | #113 / #115 | `a495e55a820e41df6432d6479eab52021e02e6b5` |
| 102-3G | #114 / #116 | `f041c6cfd87e78d3fff3a8236c80acf79ca25814` |
| 102-3H | #117 / #118 | Final conditional merge gate; merge SHA pending |

The correction is forward-only. Any rollback requires a separately approved migration
that updates the authoritative resolver, customer RLS, and membership policy together
without deleting bootstrap/seed lifecycle fixtures. Before production use, a live
lifecycle-source inventory remains required. Remote/production work, DB push, external
AI, URL fetch/DNS, actual delete/purge, deployment, and Phase 4-10 runtime/product work
remain excluded.

After every specified local validation succeeds, PR #118 is normally merged with the
latest `origin/master` merged non-force and no conflict, seven changed files only,
Recora CI success, zero unresolved review threads, and Vercel success (or OWNER's sole
build-rate-limit exception). OWNER `5134202088` then authorizes Ready conversion,
ordinary squash merge, merge-SHA CI confirmation, and completed close of Issues #117
and #102 with direct result records. Ruleset/admin bypass, force push, and repository
settings changes are prohibited.