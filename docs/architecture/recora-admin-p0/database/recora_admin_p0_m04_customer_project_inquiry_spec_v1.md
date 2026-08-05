# Recora Admin P0 M04 Customer, Project, and Inquiry Write Model

## Scope

M04 introduces the private customer profile, project state, customer inquiry,
and inquiry note write models. It also adds the minimum public row-version and
normalized membership-email extensions needed to protect their tenant scope.

## Authority

- Issue: #161
- Risk: R3
- Execution: Local Codex
- Spec level: Full
- Owner Execute approval: 5189580181
- Owner correction authority: 5190206310
- Implementation baseline: 269f8bc3c2c1e56e16ade6ab6cbc5b64c7817e7c
- M03 merge ancestor: 8d5d2a7cac4bbe13d07fe42bfbd855458bc80495

The M00 pin remains the source for the Canonical manifest
f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a
and physical manifest
d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a.

## Exact Relations

M04 creates exactly these private relations:

- recora_private.admin_customer_profiles
- recora_private.admin_project_states
- recora_private.admin_customer_inquiries
- recora_private.admin_customer_inquiry_notes

It does not create M05 relations, browser views, APIs, routes, server actions,
generic mutation RPCs, or a new authority path.

## Natural Primary Keys and Causal Links

`recora_private.admin_customer_profiles` has no surrogate `id`. Its natural
primary key is `organization_id`, which restricts deletion through
`public.organizations(id)`. Its exact private profile fields are
`primary_contact_name`, `primary_contact_email`, `access_control`,
`blocked_incident_id`, `row_version`, `last_command_receipt_id`, `created_at`,
and `updated_at`. `last_command_receipt_id` is required and references
`recora_private.admin_command_receipts(id)` with `ON DELETE RESTRICT`.

`recora_private.admin_project_states` has no surrogate `id`. Its natural
primary key is `project_id`; `organization_id` is retained in the composite
ownership FK to `public.projects(id, organization_id)`. The canonical state
columns are `lifecycle_status`, `automation_control`, and
`publication_control_state`. `last_command_receipt_id` is required and
references `recora_private.admin_command_receipts(id)` with `ON DELETE
RESTRICT`.

`recora_private.admin_customer_inquiry_notes` requires both
`author_admin_account_id` and `correlation_id`. The author references
`recora_operator.admin_accounts(id)` with `ON DELETE RESTRICT`; correlation
is an explicit non-null UUID. The allowed implementation-support pointers are
`resolution_note_id`, `reopen_reason_note_id`, and `corrects_note_id` only.
They retain exact inquiry scope and note-type validation and do not replace the
formal fields.

## Public Extensions

public.organizations, public.projects, and public.organization_members receive
row_version bigint not null default 1. Accepted updates advance exactly one
version. Organization and project identity are immutable; project tenant
movement is disallowed, and organization physical deletion is blocked.

Memberships receive a stored normalized_email using the P4-B normalization
contract lower(btrim(email)). A non-revoked membership email is unique within
its organization. Active and suspended memberships require both user_id and
accepted_at; a revoked membership cannot be revived.

No invitation expiry field, credential, or session state is added.

## Tenant Ownership

Every project state uses the existing composite
(project_id, organization_id) relationship to public.projects. Every inquiry
and note has an explicit organization scope and a nullable project scope; a
present project must belong to that organization. Note scope must match the
inquiry exactly.

## Customer and Project States

Customer access values are enabled, suspended_by_admin, and blocked_by_system.
A system block requires a nullable-future incident UUID reference value,
without adding a future incident foreign key, and cannot be ordinarily cleared.
The nullable primary contact fields are private profile data and are not copied
to audit or outbox data by M04.

Project `lifecycle_status` values are setup_in_progress, active, and closed.
`automation_control` values are running, paused_by_admin, and
blocked_by_system; `publication_control_state` values are enabled,
paused_by_admin, and blocked_by_system. Closed lifecycle is terminal and
system blocks cannot be ordinarily cleared. `active_configuration_revision_id`
is nullable and has no future M09 foreign key.

## P4-B Reuse

M04 inventories and preserves customer_session,
p4_command_receipts.customer_auth_user_id, the actor-shape constraint, P4-B
invitation and membership episode relations, and the customer access RPC
boundary. It adds no P4-B migration, function, or lifecycle change.

## Inquiry Contract

Inquiry status values are new, in_progress, and resolved. Notification state
values are delivered, retrying, failed, and unknown. Incoming
organization/project scope, subject, body, and received time are immutable.
Assignment and notification updates do not change inquiry status.

Notes are append-only and have types internal, resolution, correction, and
reopen_reason. Their body is nonblank, every note records a non-null
`author_admin_account_id` and `correlation_id`, and corrections can point only
to a prior note for the same inquiry. Resolving requires a matching resolution
note at transaction completion. Reopening resolved to in_progress requires a
matching reopen-reason note at transaction completion. `resolved_at` is
present only for resolved inquiries.

## Row Version

Public roots and mutable private M04 rows reject a supplied version other than
the prior value plus one. When an approved existing update path does not supply
a version, the trigger advances it by one. This preserves P4-B lifecycle
updates while still rejecting stale or plus-two writes.

## Security

All four private tables enable RLS. PUBLIC, anon, authenticated, and
service_role receive no direct table privileges. M04 private helpers are
SECURITY INVOKER; no SECURITY DEFINER, browser Data API grant, or generic
write RPC is introduced. Inquiry body and email values are not copied into
audit or outbox records by M04.

## No Backfill

M04 performs no bootstrap rows, legacy conversion, legacy JSON interpretation,
seed change, public business-row update, or repair/backfill. Public column
defaults and generated data are additive schema extensions only.

## Validation

The verifier checks authority pins, migration ordering, exact relation scope,
public extensions, P4-B inventory, M03 catalog counts, identifier lengths,
private RLS and ACLs, row-version behavior, tenant mismatch rejection,
append-only notes, resolution/reopen requirements, migration replay, migration
list, and local security/performance advisors. All fixtures roll back.

## Out of Scope

M05 and later business models, management UI, API endpoints, command handlers,
new invitation flows, remote/linked/production database operations,
supabase db push, cleanup, and deployment are outside M04.
