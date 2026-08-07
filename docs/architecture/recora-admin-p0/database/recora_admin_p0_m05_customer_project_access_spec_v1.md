# Recora Admin P0 M05 Customer Project Access

## Scope

M05 adds the private, authoritative customer Project access boundary. An
authenticated customer may read a Project only when all of the following are
true:

    accepted active organization membership
    AND explicit active customer Project access grant
    AND authoritative lifecycle access

M05 does not add customer roles, Project passwords, browser APIs, server
actions, grant/revoke RPCs, a Project selector, contract entitlement, or an
access-window policy.

## Authority

- Issue: #179
- Risk: R3
- Execution: Local Codex
- Spec level: Full
- Approval: Execute
- Ready: true
- Owner: sushikikun
- OWNER worktree clarification: 5196597449
- OWNER fast-forward sync clarification: 5197494408
- OWNER correction authority: 5197962759
- PR #182 Human review: receipt cross-column uniqueness and authenticated
  Project-scoped RLS measurement
- Initial implementation baseline: bd78e3effb5c5866af5dd1233f7d6984a4aaae9f
- Post-sync comparison baseline / PR base: a9a2760565bdddd9105fc039e792148c3b83b704
- M04 merge ancestor: dc79c17caafc984daf1cc7546821a3401ba94d4c
- M05-M23 authority:
  recora_admin_p0_m05_m23_implementation_authority_v1.md
- M05-M23 manifest:
  recora_admin_p0_m05_m23_authority_manifest_v1.json

The M00 Canonical manifest and physical schema manifest remain immutable
baseline evidence. M05 does not edit any prior migration, seed, manifest, or
M00-M04 unit specification.

## Existing Foundations

M05 reuses, without duplicating, these existing authorities:

- auth.users
- public.organizations
- public.projects
- public.organization_members
- P4-B membership status, invitation, episode, and customer-session contracts
- recora_private.resolve_data_lifecycle_access(uuid, uuid)
- recora_private.can_read_organization_identity(uuid)
- recora_private.can_read_project(uuid)
- recora_private.admin_command_receipts
- recora_operator.admin_accounts
- recora_audit.operator_events

recora_audit.operator_events remains the single audit store. M05 creates no
parallel event or history relation and does not copy grant rows, email, raw
reason text, credentials, or PII into audit or outbox payloads.

## Exact Relation

M05 creates exactly one application relation:

    recora_private.customer_project_access_grants

Its exact columns are:

    id uuid PK
    organization_id uuid NOT NULL
    project_id uuid NOT NULL
    organization_member_id uuid NOT NULL
    customer_auth_user_id uuid NOT NULL
    status text NOT NULL
    issued_command_receipt_id uuid NOT NULL
    revoked_command_receipt_id uuid NULL
    granted_at timestamptz NOT NULL
    revoked_at timestamptz NULL
    row_version bigint NOT NULL
    created_at timestamptz NOT NULL
    updated_at timestamptz NOT NULL

The relation has these required foreign-key boundaries:

- (project_id, organization_id) references
  public.projects(id, organization_id).
- (organization_member_id, organization_id) references the exact membership
  row and tenant. M05 adds only the minimal validated
  organization_members(id, organization_id) unique constraint required for
  this composite foreign key.
- customer_auth_user_id references auth.users(id).
- issued and revoked receipt IDs reference
  recora_private.admin_command_receipts(id) with ON DELETE RESTRICT.

The insert guard also requires that the membership row has the same
customer_auth_user_id, is accepted, and has membership_status = active.
This preserves historical grant rows when P4-B later terminally revokes a
membership and clears its current user binding.

## Grant Episodes And Immutability

One row represents one customer-user and Project grant episode.

    new active grant
    -> Project may be read when membership and lifecycle are also active

    active grant
    -> revoked grant

    revoked grant
    -> terminal history row

    regrant
    -> a different, new active grant row

status is exactly active or revoked.

- An active row has null revoke receipt and revoke time.
- A revoked row has both revoke receipt and revoke time.
- Only active -> revoked is a permitted update.
- A revoked row cannot be updated or deleted.
- A revoke advances row_version by exactly one.
- ID, organization, Project, membership, customer user, issued receipt,
  grant time, and creation time are immutable.
- A grant and revoke receipt must be different committed receipts with the
  same organization and Project scope as the grant.
- One admin_command_receipts.id is globally one-time across every grant row's
  issued_command_receipt_id and revoked_command_receipt_id columns.
- The transition guard locks relevant receipt rows with FOR UPDATE in
  deterministic UUID order before its global history scan, so concurrent
  issue/revoke paths cannot double-use a receipt or deadlock.
- The database allows at most one active row per
  (project_id, customer_auth_user_id) and one active row per
  (project_id, organization_member_id).
- Revoked history can have multiple rows for the same customer and Project.

## Customer Read Boundary

M05 creates private helper:

    recora_private.has_active_customer_project_access(
      target_project_id uuid,
      target_auth_user_id uuid
    ) returns boolean

The helper returns true only when exactly one same-scope Project,
organization, accepted active membership, authenticated user, and active grant
row agree. Null, missing, duplicated, ambiguous, cross-tenant, inactive
membership, and inactive grant cases return false.

The helper is a narrow SECURITY DEFINER read-only function with a fixed empty
search_path, because RLS policy evaluation needs private grant-state access
while browser roles retain no direct table or helper access. It has no mutation
behavior and direct PUBLIC, anon, authenticated, and service_role execute
grants are revoked.

recora_private.can_read_project(uuid) is redefined additively:

- anonymous demo reads retain the existing demo boundary;
- authenticated customer reads require the M05 helper and existing lifecycle
  access;
- M05 does not change organization identity access or the existing
  organization-membership self-read contract.

Every existing Project-scoped public RLS policy that delegates to
can_read_project() therefore receives the same explicit Project grant
boundary. M05 gives authenticated SELECT only on the existing Project-scoped
public relations required for that policy evaluation: projects, prompts,
measurement_runs, ai_conversations, citations, metric_snapshots, and
recommendations. Those grants do not bypass RLS.

## Security And ACL

The grant table enables RLS and grants direct table access to none of:

    PUBLIC
    anon
    authenticated
    service_role

M05 introduces no browser Data API exposure, no customer write policy, no
public view, no generic mutation RPC, and no change to public customer write
rights. The authenticated read grants are limited to the seven existing
Project-scoped public relations and remain subject to their RLS policies;
the private grant relation and private helper remain directly inaccessible.
service_role is never treated as a customer or administrator actor.
A Project ID is not a credential, token, or password.

## No Backfill Or Seed

M05 does not insert, update, delete, transform, repair, infer, or backfill
business grant rows. In particular, it does not derive grants from:

- organization membership;
- dashboard history;
- legacy recora_admin data;
- subscriptions or JSON metadata;
- demo customers;
- existing Auth users, admins, or receipts.

Immediately after M05, an authenticated non-demo customer without an explicit
grant fails closed for Project-scoped reads. Existing production grant
bootstrap is deliberately outside M05.

## M04 Verifier Compatibility

M04's static verifier retains all existing M04 schema, P4-B, security,
fixture, and baseline checks. Its package-order assertion becomes exact only
when the M05 verifier exists:

    M03 static
    -> M04 static
    -> M05 static
    -> Project Setup draft check

In a pre-M05 source checkout with no M05 verifier, M04 continues to require
its former direct sequence. The compatibility rule does not permit arbitrary
intermediate scripts.

## Validation

The M05 verifier covers:

- baseline, M04 ancestry, and M05-M23 authority presence;
- M00 through M05 migration order;
- one-relation inventory, exact columns, PK, FKs, checks, indexes, and
  transition trigger;
- private helper security attributes, fixed search_path, and ACLs;
- the can_read_project() source contract;
- no inferred backfill, grant seed, public generic mutation RPC, DROP, or
  TRUNCATE;
- migration-only, seeded, and replay reset;
- M00-M05 critical regressions;
- active and revoked grant positive and negative fixtures, including both
  issued-to-revoked and revoked-to-issued cross-column receipt reuse denial;
- a dedicated-local two-session concurrent issue/revoke fixture that proves
  one global receipt use commits and the competing cross-column use rejects;
- authenticated-role and JWT-context Project A/B and organization A/B actual
  SELECT matrix, including Project A only, simultaneous A+B, B-only revoke,
  suspended membership, terminal membership, and a separate organization;
- Project-scoped RLS regression for projects, prompts, measurement runs,
  ai_conversations, citations, metric snapshots, and recommendations;
- protected direct table/helper denial;
- migration list and local security/performance advisors.

All ordinary database fixtures run in transactions that roll back. The
cross-session concurrency fixture commits uniquely generated setup rows only
in the dedicated local M05 stack so both sessions can observe them; the
required subsequent seeded reset removes those local-only fixtures.

## Out Of Scope

- M06 and later units
- contracts, entitlements, and six-month access windows
- product plans, pricing, or Stripe
- customer login, customer API, Project selector, or management UI
- operator grant/revoke command implementation
- generic mutation RPCs
- read models
- production grant bootstrap
- remote, linked, or production database operations
- supabase db push
- old M05 settings-core work
- cleanup, deployment, merge, or PR Ready conversion