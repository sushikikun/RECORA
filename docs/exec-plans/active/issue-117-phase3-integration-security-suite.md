# Exec Plan: Issue #117 Phase 3 integration/security suite

## Metadata

| Field | Value |
|---|---|
| Issue / parent | `#117` / `#102` |
| Risk / execution | `R3` / `Local Codex` |
| Spec / approval | `Full` / Issue-body `Execute` approval |
| Base | `origin/master` including PR #116 merge `f041c6cfd87e78d3fff3a8236c80acf79ca25814` |
| Branch | `codex/issue-117-phase3-integration-security` |
| Status | `Human review` |

## Objective and isolation

Prove the already-merged `102-3A` through `102-3G` contracts together on one
Issue #117-only local Supabase database. The suite fails closed when replay, a child
verifier, or the RLS/grant/function/schema matrix fails. It does not implement a Phase
4-10 feature.

- `scripts/verify-issue-117-phase3-integration-security.ts` runs migration-only and
  seeded reset, 3A-3F using temporary `C:/tmp` child copies with only their fixed local
  container guard replaced, the DB/network-free 3G verifier, and the matrix inventory.
- The only database is `supabase_db_recoraissue117`, with temporary workdir
  `C:/tmp/recora-issue-117-supabase` and non-colliding ports. Analytics, remote/linked
  DBs, `supabase db push`, real-data deletion, `.env`, external AI, URL fetch, and DNS
  are excluded.
- A temporary `server-only` marker shim under `C:/tmp` permits Node-only verifier
  execution without changing product source, dependencies, existing child verifiers, or
  migrations.

## Human review finding and correction

OWNER comment `5133496218` correctly identified a Phase 3 blocking defect: the
102-3C customer RLS helpers could allow an accepted active member after the
102-3F service-role lifecycle resolver had denied that scope. The earlier
"no blocking defect" and "lifecycle integration passed" statements are
superseded by this record.

The additive migration
`20260730163156_recora_authoritative_lifecycle_rls_access.sql` creates
`recora_private.resolve_data_lifecycle_access(uuid, uuid)` as the single
lifecycle selection authority. The service-role-only
`public.recora_resolve_data_lifecycle_access()` delegates to it, while the
existing customer RLS helpers consume an unexposed boolean wrapper of the same
decision. Exact project state takes precedence over organization fallback.
Invalid, missing, and ambiguous lifecycle selections return deny; only
`active` permits customer access or new measurement.

The migration bootstraps an organization-level `active` row only for an
organization that already exists when the migration runs and has no
organization-level lifecycle row. It creates no project ownership mapping,
operator identity, fixed owner, service actor, audit event, or lifecycle event.
A scope created later requires an explicit lifecycle row and fails closed. The
migration also removes default browser/PUBLIC execution for private audit and
trigger helpers, retaining only the necessary service-role validation grants.

## Acceptance matrix after correction

| Boundary | Result |
|---|---|
| Migration-only demo baseline / seeded replay on the same isolated DB | Passed |
| 3A–3G existing contracts, including updated 3C replay order | Passed; each exit code and machine `status: ok` |
| Active accepted customer and active anon demo/local | Own allowed scope only |
| `access_suspended`, `retained`, `deletion_scheduled`, `deleting`, `deleted`, `deletion_failed` | Data API/RLS UUID, slug, list, search, count, pagination, JOIN, and RLS-helper RPC denied |
| Missing and deliberately ambiguous lifecycle | Resolver and RLS denied |
| Project-specific state and organization fallback | Same authoritative result; project state has the 3F precedence |
| A/B substitution, raw/internal/browser-write/operator boundaries | Denied or unavailable as before |
| Public/private table, view, sequence, policy, function, and `SECURITY DEFINER` inventory | Passed with signature allowlist and fixed empty `search_path` |
| PR #71 classification | Exact 10-area machine fixture; answer body/excerpt and citation/source remain candidates, all raw/internal keys denied |
| 3C–3H local catalog/type drift | Relations, columns, composite constraints, enums, policy/RLS, function signatures, and grants passed |

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

## Merge inventory and human-review stop condition

| Contract | Issue / PR | merged `master` SHA |
|---|---|---|
| 102-3A | #80 / #81 | `5df688ac5dc76f30e73baef504ad06e46ec7d68d` |
| 102-3B | #105 / #106 | `6319ef7fb84a57e8f22b909190ce2e76d4aed135` |
| 102-3C | #107 / #112 | `d2353bde5f9d503b88c652c2fca29d1abd0cdd9a` |
| 102-3D | #108 / #111 | `2fb878acfecb9bf80a8a6f1d1c113797b38bcf6f` |
| 102-3E | #109 / #110 | `4c01eb0cdb3ae45c38dbad2b9596f14ee8df596e` |
| 102-3F | #113 / #115 | `a495e55a820e41df6432d6479eab52021e02e6b5` |
| 102-3G | #114 / #116 | `f041c6cfd87e78d3fff3a8236c80acf79ca25814` |
| 102-3H | #117 / #118 | Draft PR; no merge SHA yet |

PR #118 remains Draft. Do not Ready, merge, or close Issue #117 or #102.
Issue #102 remains open until this corrected PR has Human review and merge
approval, all Phase 3 contracts remain accepted on the resulting master, and
downstream/release owners accept the documented interfaces and residual risks.
