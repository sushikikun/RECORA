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

## Acceptance matrix

| Boundary | Result |
|---|---|
| Migration-only demo-only baseline and seeded replay on the same DB | Passed |
| 3A-3B identity, ownership, accepted-active membership only | Passed |
| 3C A/B UUID, slug, list, search, count, pagination, joins, RPC, raw-data boundaries | Passed |
| 3D immutable entitlement/history and fail-closed tenant resolution | Passed |
| 3E scoped operator, service-only RPC, append-only audit | Passed |
| 3F lifecycle/hold/restore/manifest/attempt and access fail-closed behavior | Passed |
| 3G payload allowlist/denylist, plain text, URL/content budget, runtime brand | Passed; no DB/provider/network call |
| RLS, private relation grants, security-definer PUBLIC grants, RPC grants, catalog type/enum drift | Passed |
| PR #71 customer-safe candidate vs raw provider/control/audit/internal boundary | Passed by 3C/3G and grant inventory |

## Results and decision

The suite emitted machine JSON with `status: ok`; every child returned exit code zero and
its own `status: ok` JSON. Migration list and local security/performance advisors passed.
No Phase 3 blocking defect was mechanically proven, so no additive migration or server
integration helper was added.

The installed CLI required a Platform token for `supabase gen types --local`, even against
the isolated stack. Supplying one would violate this Issue's no-remote/no-`.env` boundary.
The suite instead asserts the local catalog's public column, lifecycle-enum, and relevant hand-maintained application type contracts;
repository `tsc --noEmit` is the TypeScript type check. No generated type file exists.

## Later-phase interfaces and non-goals

- Phase 4 consumes tenant/entitlement contracts; billing transitions remain Phase 4.
- Phases 5-6 consume member/project, entitlement/history, and payload contracts; setup,
  queues, providers, retries, budgets, fetch, and DNS remain theirs.
- Phase 7 owns quality decisions and the safe customer read model; Phase 8 may consume
  only safe DTOs and must not read raw measurement/provider/control/audit data.
- Phase 9 consumes operator identity/permission/audit contracts; no admin UI is included.

No remote/production validation, live-data inspection, dashboard/admin UI, contract
business processing, measurement execution, provider call, URL fetch, DNS, queue/worker,
analysis/publication, or real deletion ran. Issue #102 stays open until every accepted
Phase 3 child is merged, this result receives Human review, and downstream/release owners
accept these interface and residual-risk handoffs. This Issue remains Draft for Human
review.
