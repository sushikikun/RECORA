# Issue #113 / 102-3F retention and deletion-state foundation

Status: **OWNER follow-up implemented; final validation and Draft PR handoff pending**
Parent: #102
Risk: **R3**
Execution: **Local Codex**
Spec level: **Full**
Approval: **Execute — Issue #113 body**
Ready: **Yes — limited to the approved four files**

## Inventory and boundary

- This child adds lifecycle state, a server-only command/resolver boundary, and deletion preparation evidence. It does not start a contract workflow, perform data or storage deletion, schedule a worker, add UI, or connect 3C/3G/3H.
- The dedicated local project is recora-issue-113 under C:/tmp, with supabase_db_recora-issue-113. It is not linked to a remote project.
- The follow-up remains within the approved migration, lifecycle module, verifier, and this Exec Plan.

## State and command boundary

- Current state is one row per organization or project scope, backed by #105 composite ownership and optimistic versioning. The state graph remains active → access_suspended → retained → deletion_scheduled → deleting → deleted/deletion_failed, with only the explicit inverse/retry edges described in the Issue.
- transitionDataLifecycle and setDataLifecycleLegalHold are server-only APIs. Each obtains the current session user through auth.getUser() before it creates the service-role client and passes only that verified ID to the service-role RPC. No exported command input accepts an operator user ID.
- The DB RPCs retain service-role-only grants and fixed search_path. They invoke the #109 scoped operator authorization primitive in the same transaction as state, append-only evidence, and operator audit writes.
- Validation rejects NULL/partial/unknown lifecycle, retention, restore, manifest, and attempt combinations with stable reason codes before a state/manifest/attempt write. Denials retain bounded operator audit evidence only; raw optional payloads are not recorded.

## Trusted manifests and append-only evidence

- A manifest is selected at deletion_scheduled; a direct deletion_failed → deleting retry must select a newly created manifest. A scheduled manifest may be abandoned by returning to retained, and the next schedule creates the next scope-monotonic version.
- The allowlisted category summary is canonicalized before SHA-256 is calculated from identifier, version, tenant/project scope, and canonical summary. Caller hash input is required to exactly match the trusted value.
- data_lifecycle_current holds only the active manifest selection. Deletion start and every attempt resolve that explicit ID/version, never the implicit latest manifest.
- data_lifecycle_decision_evidence is a private, RLS-protected, append-only typed history. It records retention policy/version/deadlines, legal-hold apply/release and opaque reference, and selected manifest/attempt IDs and outcomes with lifecycle event/version linkage.
- Current state remains the mutable current-value projection. Retain → restore → re-retain and hold apply → release → reapply preserve each historical decision as separate evidence.

## Rollback and handoff

- Rollback is additive: stop new command/resolver consumers and preserve lifecycle, manifest, attempt, decision evidence, and operator audit history. Do not drop or rewrite history.
- A later approved deletion worker must consume the explicit selected manifest and append attempts through this boundary. It must not perform actual deletion under this Issue.

## Validation record

- The expanded 3F verifier covers verified server-only identity boundaries; NULL next-state; partial retention/restore; partial/tampered/version-invalid manifests; partial/NULL/mismatched attempts; retain/restore/re-retain; hold apply/release/reapply; manifest v1/v2/v3 selection; retry attempt linkage; append-only history; RLS and service-role boundaries.
- Final required run remains: migration-only and seeded reset, expanded 3F verifier, 3A/3B/3D/3E regressions, migration list/advisors, preflight/typecheck/lint/build, diff/scope/secret/lockfile checks, recora:commit-check, non-force origin/master merge, and post-merge revalidation.
- The migration auto-rejection in recora:commit-check uses Issue #113’s R3 Execute approval as the documented manual path. Any other validation failure blocks handoff.
