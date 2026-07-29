# Issue #109: operator authorization and audit foundation

## Metadata

- Issue: [#109](https://github.com/sushikikun/RECORA/issues/109)
- Parent: [#102](https://github.com/sushikikun/RECORA/issues/102)
- Risk: `R3`
- Execution: `Local Codex`
- Spec level: `Full`
- Approval: `Execute` (recorded in the Issue body)
- Status: `In progress`
- Baseline: `master` / `6319ef7` (102-3B merged)
- Branch: `codex/issue-109-operator-authorization-audit`

## Scope and boundary

This child implements only 102-3E:

- verified operator identity linked to `auth.users.id`, with `active`, `suspended`, and `revoked` status;
- additive, tenant/project-scoped action grants without finalizing a staff-role catalog;
- a server-only explicit command contract that verifies the current Auth user before a service-role-only database command evaluates status, permission, tenant/project ownership, reason, request ID, and correlation ID;
- private append-only audit evidence for successful, denied, and failed command attempts; and
- isolated-local fixtures for authorization, grants, cross-tenant rejection, immutability, sensitive-summary rejection, and atomic command/audit behavior.

It does not create a real owner/operator, hard-code a user ID or email, add customer/admin UI, change customer routes, define broad 102-3C RLS/grants, implement 102-3D entitlements, or connect a business operation. `service_role` is a server capability only and is never persisted as an actor.

## Existing-state inventory

- 102-3B provides `organizations` as tenant root, `projects.organization_id`, an `(id, organization_id)` candidate key, and accepted active customer membership helpers.
- `recora_admin.operation_events` is a legacy internal-operation skeleton. It lacks verified operator identity, action grants, reason/request/correlation/outcome contracts, mutation blockers, and transaction-coupled command evidence; this child does not modify it.
- Existing Phase 1 local admin access uses a fixed local actor and is not a production authorization model. This child adds a separate server-only contract and does not alter the Phase 1 path.

## Data and authorization model

`recora_operator.operator_identities` maps a verified immutable `auth.users.id` to status. The migration has no seed or production registration path. `operator_action_grants` contains an action permission and an optional global, organization, or project scope; a project scope is composite-FK-bound to its organization.

The private resolver denies, with a stable reason code, when identity is missing/unregistered, status is not active, action/permission is malformed, reason is blank or unsafe, the organization/project target does not exist or does not match authoritative ownership, the target type is not one of the explicit foundation targets, or no active grant matches. Organization and project existence are checked before grant evaluation; only authoritative tenant/project IDs are copied into denied or failed audit foreign keys.

The public RPC is deliberately explicit and is executable only by `service_role`. The `lib/recora/operator-authorization-audit.ts` caller is server-only, obtains the current identity through `auth.getUser()`, and passes that ID to the command boundary. Browser/customer roles have neither schema/table access nor RPC execute privilege.

## Audit and atomicity model

`recora_audit.operator_events` retains operator actor (when identity resolution succeeded), tenant/project scope, action, target, permission, reason, before/after safe summaries, request/correlation IDs, time, outcome, and failure reason. Database and server-only TypeScript validation use the same bounded allowlist-shaped contract: opaque safe keys, bounded bytes/depth/array size, and rejection of email/phone, cookie/session/auth claims, raw request/response/provider payloads, database URLs, private keys, JWTs, and representative API tokens. Unsafe reason or summary input is denied without retaining the raw value. Active grants use a partial unique index so revoked rows remain history and a new grant can be issued. The event table rejects update and delete through triggers; customer roles have no table privileges, and corrections are separate events. Truncate remains available only to local reset/owner maintenance so fresh seeded replay can rebuild dependent demo tables.

The foundation command writes a success audit event and immutable command receipt in one database function/transaction. The production RPC has no test-only failure parameter; the verifier creates a temporary local trigger inside its rollback transaction to force receipt failure, proving the receipt and initial success event roll back while a separate failed event remains. This establishes the primitive for future explicit business commands: each must perform its own business mutation and audit insert in one RPC transaction; generic table-mutation RPCs are not introduced.

## Local verification and isolation

The verifier uses `docker exec` only against the issue-specific local database container created from a `C:/tmp/recora-issue-109-supabase` workdir with `project_id = recora-issue-109` and ports distinct from the existing Wave 2 `recora` stack. It does not inspect, stop, delete, or connect to another Wave 2 container, and never runs `supabase db push` or a remote/non-local command.

Required checks:

1. migration-only and seeded local reset;
2. migration replay/idempotency, migration list, and advisors;
3. 102-3E dedicated fixture; 102-3A and 102-3B regressions;
4. preflight, typecheck, lint, build, diff, commit-check, scope, and lockfile/secret checks.

The correction verifier additionally covers nonexistent organization/project and unregistered-operator denials, safe audit reason/summary rejection across nested arrays and values, active duplicate rejection plus revoke/regrant history, and customer-role RPC privilege denial.

## Rollback

Rollback is additive: stop callers of the new explicit command contract, retain legacy paths, and preserve audit evidence. Do not drop the schemas/tables or mutate event history. Any correction is a new audit event. No production/live migration, backfill, registration, deployment, merge, or branch/worktree/temp-stack deletion is authorized by this Issue.

## Phase 9 handoff

Phase 9 may create a server-side operator/admin UI only after consuming this contract. It must not pass a browser-selected tenant as authorization, expose service-role credentials, directly read/write operator/audit tables, or replace explicit action-level commands with generic mutation RPCs. It must provision real operators in a separately approved operation.
