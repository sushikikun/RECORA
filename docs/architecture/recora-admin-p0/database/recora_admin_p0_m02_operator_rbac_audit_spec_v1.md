# Recora Admin P0 M02 Operator RBAC And Audit Spec v1

## Scope

M02 adds the private operator authorization and audit convergence substrate for Recora Admin P0.

- Issue: #139
- Baseline: \`ed37aa85f2996b33429e34c86918d047be36e6b8\`
- Migration: \`recora_admin_p0_02_operator_rbac_audit\`
- M03 fixed role/capability seed, business tables, UI, routes, APIs, and generic mutation RPCs are out of scope.

M02 is additive. It does not alter public or legacy \`recora_admin\` data, seed an administrator, create an Auth user, or infer P0 roles from legacy action grants.

## Relations

M02 creates exactly these private relations:

1. \`recora_operator.admin_accounts\`
2. \`recora_operator.admin_identity_security_projections\`
3. \`recora_operator.admin_roles\`
4. \`recora_operator.admin_capabilities\`
5. \`recora_operator.admin_role_capabilities\`
6. \`recora_operator.admin_role_assignments\`
7. \`recora_operator.admin_scope_assignments\`
8. \`recora_audit.operator_event_scopes\`

It extends \`recora_audit.operator_events\` and \`recora_private.admin_command_receipts\`. Existing \`operator_identities\`, \`operator_action_grants\`, \`operator_command_receipts\`, append-only audit helpers, M01 outbox, and M01 read-refresh infrastructure remain authorities.

## Account And Identity

\`admin_accounts\` has an invited, active, suspended, or deactivated lifecycle.

- Invited accounts may have no operator identity.
- Active accounts require an active existing \`operator_identities\` row.
- Deactivated accounts are terminal.
- A partial unique index rejects a normalized email collision for every non-deactivated account.
- Credential, token, session, password, and MFA secret columns are absent.

\`admin_identity_security_projections\` stores only current MFA observation state: \`unknown\`, \`not_enrolled\`, or \`enrolled\`.

- Older \`observed_at\` values cannot overwrite a newer observation.
- The table is private and no protected role has direct write access.
- Unknown or non-enrolled MFA is never authorization evidence.

## Role And Scope

Roles, capabilities, and maps are immutable catalog relations. M02 creates no catalog rows; M03 owns the eight roles, 64 capabilities, and maps.

Role and scope assignment state is \`active\`, \`revoked\`, or \`expired\`.

- Active duplicate account-role and logical scope assignments are rejected.
- Revoked and expired records cannot be revived.
- Every effective role assignment has an effective scope.
- \`platform_admin\` and \`system_operator\` require global scope.
- Global scope cannot coexist with customer or project scope on one role assignment.
- Customer scope and a project scope under that customer are rejected as redundant.
- Project scope uses a composite organization/project foreign key.
- The last effective platform admin cannot be suspended, deactivated, lose enrolled MFA, lose the platform role, or lose global scope.
- The private privilege-change validator rejects self role or scope escalation and cannot bootstrap a first platform admin.

An effective platform admin is an active account with an active operator identity, enrolled MFA, active unexpired \`platform_admin\` assignment, and active unexpired global scope.

## Audit And Receipt Closure

\`operator_events\` stays the single append-only audit table. M02 adds actor type, system component, risk class, operation outcome, idempotency, correction, admin account, capability, role assignment, scope assignment, MFA assurance, and step-up evidence fields.

Legacy events keep nullable M02 evidence fields. M02 does not fabricate role, scope, MFA, or step-up evidence for history.

- \`corrects_event_id\` records a new correction event; self references and cycles are rejected.
- \`operator_event_scopes\` is append-only, has a null-safe primary scope key, rejects duplicate scopes, and validates project ownership.
- Existing bounded safe-summary checks remain the only summary contract.

M02 replaces M01's provisional human receipt rejection with final authorization evidence validation. An admin receipt requires:

- active admin account and active linked operator identity;
- enrolled MFA;
- a mapped capability from an active unexpired role assignment;
- an active unexpired scope assignment that covers the receipt;
- audit actor, request, correlation, normalized action, target, outcome, idempotency, capability, role, scope, and assurance evidence;
- fresh step-up evidence for W3;

A global human receipt does not require a legacy operator command receipt. A successful
organization/project-scoped admin receipt may omit the legacy operator command receipt.
When a compatibility bridge is supplied, the legacy receipt must match the audit event,
scope, action, target, request, and correlation evidence exactly. M02 normal reset remains
fail-closed because the M03 catalog is empty.

## Boundary And Validation

All M02 tables and helpers have RLS enabled or are private dependencies, and direct schema/table/function access is revoked from \`PUBLIC\`, \`anon\`, \`authenticated\`, and \`service_role\`. Private helpers are SECURITY INVOKER.

The M02 verifier checks:

- static relation inventory, no M03 catalog seed, migration ordering, and PostgreSQL identifier byte limits;
- account, MFA, role, scope, last-admin, and self-escalation constraints;
- global and scoped human receipt positive cases using transaction rollback fixtures;
- MFA, account, operator, capability, scope, and W3 negative cases;
- append-only audit and event-scope checks;
- protected role table and helper denial;
- migration replay.

No fixture persists an admin, Auth user, role, capability, scope, receipt, or audit event.
