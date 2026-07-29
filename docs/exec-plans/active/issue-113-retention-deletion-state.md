# Issue #113 / 102-3F retention and deletion-state foundation

Status: **Implemented locally; validation and Draft PR handoff pending**
Parent: #102
Risk: **R3**
Execution: **Local Codex**
Spec level: **Full**
Approval: **Execute ? Issue #113 body**

## Inventory and boundary

- The master baseline supplies explicit organization/project ownership (#105), immutable entitlement history (#108), and private operator authorization/audit primitives (#109).
- This child adds only lifecycle state, server-only access resolution, and deletion preparation evidence. It does not start a contract workflow, perform any data or storage deletion, schedule a worker, add UI, or connect 3C/3G/3H.
- The dedicated local project is `recora-issue-113` under `C:/tmp` with its own ports and `supabase_db_recora-issue-113` container. It is not linked to a remote project.

## State and transition model

- Current state is one row per organization scope or project scope, constrained by the #105 composite ownership key and an optimistic version.
- States are `active`, `access_suspended`, `retained`, `deletion_scheduled`, `deleting`, `deleted`, and `deletion_failed`. `deleted` has no outbound transition.
- The database allows only: active Å® access_suspended; access_suspended Å® active/retained; retained Å® active/deletion_scheduled; deletion_scheduled Å® retained/deleting; deleting Å® deleted/deletion_failed; deletion_failed Å® deleting/retained.
- A narrow initialization operation establishes the first `active` row only from expected version 0; all later commands require an authoritative current state and version.
- Retention policy/version references are opaque identifiers. The caller must provide explicit start and future deadlines when entering `retained`; no retention-day default is introduced.
- Legal holds are set/released through their own explicit operator command, versioned and evented. An active hold blocks scheduled/deleting/deleted transitions. Restore requires an unexpired restore deadline, eligibility, no active hold, and no started deletion.

## Command, resolver, and evidence

- The `recora_transition_data_lifecycle` service-role RPC invokes the #109 private authorization primitive with `data_lifecycle.transition`, validates scope/state/version and transition-specific payloads, then atomically updates current state, appends lifecycle evidence, creates any required manifest/attempt, and appends the #109 operator event.
- The `recora_set_data_lifecycle_legal_hold` service-role RPC uses the same explicit operator boundary and appends hold evidence plus its operator event atomically.
- `recora_resolve_data_lifecycle_access` is service-role-only. Its four outputs are customer-access allowance, new-measurement allowance, restore eligibility, and a stable reason. It selects the exact project scope before an organization fallback and fails closed for invalid, absent, or ambiguous scope.
- Manifests are append-only and store an opaque versioned identifier, SHA-256-format hash, and schema-versioned allowlisted category/count summary only. Attempts are append-only and preserve number, bounded timing, outcome, and an opaque failure code. Neither mechanism deletes anything.

## Rollback and handoff

- Rollback is additive: stop new lifecycle command/resolver consumers, retain existing operational reads, and preserve all lifecycle, manifest, attempt, and operator evidence. Do not drop or rewrite history.
- Phase 4 supplies contract-driven entry/retention deadlines. Phases 5/6 consume the resolver before new design/execution. Phase 9 may introduce the approved operator UX. A later deletion worker must use manifests and append attempts; it must not bypass this lifecycle boundary.

## Validation record

- Pending final run: migration-only and seeded reset, dedicated 3F verifier, migration list/advisors, 3A/3B/3D/3E regressions on the same isolated stack, preflight/typecheck/lint/build, diff/scope/secret/lockfile checks, and the manual R3 migration commit path.