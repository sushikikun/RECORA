# Exec Plan: Issue #107 composite tenant isolation and customer/operator boundary

This is the living execution record for Issue #107 / 102-3C. The Issue body is
the OWNER's R3 Execute approval; this plan does not expand that approval.

## Metadata

| Field | Value |
|---|---|
| Issue | [#107](https://github.com/sushikikun/RECORA/issues/107) |
| Parent | [#102](https://github.com/sushikikun/RECORA/issues/102) |
| Dependency | Issue #105 / 102-3B, squash-merged at `6319ef7fb84a57e8f22b909190ce2e76d4aed135` |
| Risk | `R3` |
| Spec level | `Full` |
| Execution | `Local Codex` |
| Approval | `Execute` recorded in the Issue #107 body |
| Owner | `sushikikun` |
| Status | `Active` |
| Updated | `2026-07-30` |

## Objective / expected outcome

Deliver the additive 102-3C boundary in which:

- `organizations.id` remains the tenant root and `projects.organization_id`
  remains the authoritative project owner
- deep project evidence derives `project_id` only from a mandatory parent
- composite candidate keys and foreign keys reject cross-project combinations
- authenticated access requires the accepted active membership predicate from
  102-3B and cannot leak another tenant through UUID, slug, list, filter, count,
  pagination, JOIN, multi-hop, or helper-function calls; it never inherits the
  anon demo/local exception
- anonymous access is limited to `is_demo = true` organizations whose
  `data_environment` is `demo` or `local`
- customer browser roles have no write access, raw measurement/provider access,
  `recora_admin` access, or internal recommendation metadata
- operator/control access remains a server-only capability without implementing
  the operator identity and permission model owned by 102-3E

## Authority and start state

Authority order:

1. Issue #107 body and its OWNER R3 Execute approval
2. parent Issue #102 confirmed principles
3. `docs/recora-data-tenant-security-privacy.md`
4. `docs/exec-plans/active/issue-102-data-tenant-security-privacy.md`
5. dependency Issue #105 / 102-3B and its Exec Plan
6. current `master` implementation facts

Start gate:

- task worktree:
  `C:/tmp/recora-issue-107-composite-rls-boundary`
- git common directory:
  `C:/Users/nakan/work/recora-main/.git` (outside OneDrive)
- branch:
  `codex/issue-107-composite-rls-boundary`
- start revision:
  `HEAD == origin/master == 6319ef7fb84a`
- initial worktree and staged state: clean
- Issue: `R3 / Local Codex / Full / Execute / Ready`
- no other Wave 2 worktree, branch, or container is used or modified

## Confirmed pre-implementation inventory

### Public project chains

The pre-change public schema had RLS enabled on all 16 tables but relied on
single-column FKs for several cross-project relationships:

- `prompts(project_id, topic_id, persona_id)`
- `run_items(run_id, prompt_id, persona_id)`
- `source_domains(project_id, owner_brand_id)`
- `brand_mentions(conversation_id, brand_id)`
- `citations(conversation_id, brand_id, source_domain_id)`
- `metric_snapshots(run_id, scope_id, brand_id)`
- `recommendations(project_id, run_id, related_topic_id, related_prompt_id)`

`run_items`, `ai_conversations`, `brand_mentions`, `citations`, and
`metric_snapshots` did not carry `project_id`, so their ownership required
multi-hop lookup and could not participate directly in a composite FK.

The migration performs a fail-closed inventory before persistent writes:

- project/organization and project-root null/orphan ownership
- duplicate `(id, project_id)` candidate keys
- prompt/topic/persona cross-project relationships
- run/prompt/persona cross-project relationships
- brand, conversation, citation, source-domain, and metric relationships
- polymorphic metric scope ownership
- recommendation run/topic/prompt ownership

Unsafe inventory raises before DDL or backfill. It never assigns a demo tenant,
changes project ownership, or invents a mapping.

### RLS and grants

Before 102-3C:

- RLS allowed demo-or-member SELECT on every public table
- 102-3B had already changed effective membership to authenticated,
  accepted, and `active`
- `anon` and `authenticated` both had table-wide SELECT on raw measurement
  tables, including provider response and usage columns
- customer browser writes were already revoked and had no write policies
- `recora_admin` tables were RLS-enabled with no policies and granted only to
  `service_role`
- the two public admin read-only functions were executable only by
  `service_role`

102-3C preserves the no-browser-write model, narrows authenticated reads, and
reasserts schema/table/sequence/function boundaries explicitly.

## Scope / non-goals

### In scope

- one additive migration:
  `supabase/migrations/20260729164230_composite_tenant_isolation.sql`
- one dedicated verifier:
  `scripts/verify-issue-107-composite-tenant-isolation.ts`
- this child Exec Plan
- fail-closed inventory, deterministic backfill, composite constraints, direct
  project indexes, compatibility triggers, RLS/policy replacement, and explicit
  grants
- isolated local Supabase replay and security fixtures

### Non-goals

- no parent Exec Plan, `docs/README.md`, or `package.json` change
- no dependency or lockfile change
- no 102-3D entitlement/history schema
- no 102-3E operator identity, permission, or audit schema
- no Phase 7 customer-safe publication/read-model implementation
- no Phase 8 route/dashboard integration
- no Phase 9 admin UI or write API
- no production, remote, linked, non-local, or
  `supabase_analytics_recora` database access
- no `supabase db push`, deploy, Ready conversion, merge, Issue close, branch
  deletion, worktree deletion, or temporary-stack deletion

## Implementation design

### Project ownership and compatibility

Add non-null `project_id` to:

- `run_items`
- `ai_conversations`
- `brand_mentions`
- `citations`
- `metric_snapshots`

Existing rows are backfilled from their mandatory parent in dependency order.
A private `SECURITY DEFINER` trigger with fixed empty `search_path` preserves
legacy writers that omit the new column. The trigger always derives ownership
from the mandatory parent and rejects an explicit mismatch; callers cannot
choose a tenant by supplying `project_id`.

### Composite integrity

Add `(id, project_id)` candidate keys where required and composite FKs across:

- prompt to topic/persona
- run item to run/prompt/persona
- conversation to run item
- source domain to owner brand
- brand mention to conversation/brand
- citation to conversation/brand/source domain
- metric snapshot to run/brand
- recommendation to run/topic/prompt

`metric_snapshots.scope_id` is polymorphic and cannot use one physical FK. A
private constraint trigger validates every non-null scope against the
run-derived project; global AI model scopes remain global.

### RLS and customer access

All exposed public tables retain RLS. Project-owned policies use direct
`project_id` after composite integrity is established. Organization/project
helpers branch on auth context: anon callers can use only the explicit demo/local
predicate, while authenticated callers must satisfy stored accepted active
membership. Membership SELECT is reduced to the authenticated actor's own
effective row.

`authenticated` receives:

- tenant-filtered SELECT on organization, own membership, project, brand,
  persona, topic, and global AI model configuration
- column-level SELECT on customer-visible recommendations, excluding `metadata`

It does not receive direct SELECT on prompt text or raw measurement/evidence
tables. Phase 7 must create the customer-safe publication/read model and Phase 8
must consume it.

`anon` keeps the legacy demo read path for the current local/demo dashboard, but
RLS restricts every tenant row to an organization with both `is_demo = true`
and `data_environment in ('demo', 'local')`. Anonymous access never reaches
production/non-demo tenant rows. The demo/local exception is not granted to an
authenticated customer without an accepted active membership.

Neither browser role receives INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
TRIGGER, or sequence privileges, and no browser write policy is created.

### Phase 8 authorization contract

The 102-3C database contract for a future customer route is:

1. use the session-aware Supabase server client, never service role as actor
   identity
2. query `public.projects` by the requested UUID or slug
3. rely on project RLS to derive `organization_id` and require the current
   `auth.uid()` accepted active membership
4. treat zero rows as unauthorized/not found without distinguishing another
   tenant
5. obtain answer/citation/report payloads only from the future Phase 7
   customer-safe published read model

No route integration is included here.

### Operator boundary

`recora_admin` schema/table/sequence/function privileges are revoked from
`public`, `anon`, and `authenticated`. Public admin read-only functions remain
service-role-only. Private trigger helpers have no browser EXECUTE grant.
`service_role` is a server capability and is not accepted as an actor identity.
102-3E remains responsible for real operator identity, permission, reason, and
audit behavior.

## Isolated local Supabase boundary

The untracked and uncommitted local-only workdir is:

`C:/tmp/recora-issue-107-isolated-supabase`

Isolation facts:

- `project_id = "recora-issue-107"`
- API port `56321`
- DB port `56322`
- shadow port `56320`
- Studio port `56323`
- mail port `56324`
- analytics port `56327`
- pooler port `56329`
- edge inspector port `58083`
- linked-project marker absent
- no candidate port was listening before start
- no `recora-issue-107` container existed before start
- runtime containers use the suffix `recora-issue-107`
- DB verifier hard-codes only `supabase_db_recora-issue-107`

The existing `supabase_*_recora` stack and
`supabase_analytics_recora` are not queried, stopped, restarted, renamed, or
otherwise modified.

## Milestones

| Milestone | Status | Exit criteria |
|---|---|---|
| M1: Gate and inventory | `Completed` | Issue/source approval, latest clean worktree, schema/RLS/grant inventory, and isolated-stack proof recorded |
| M2: Additive migration | `Completed` | Backfill, compatibility derivation, composite integrity, RLS, grants, and customer/operator boundary replay |
| M3: Dedicated security verifier | `Completed` | A/B, invalid memberships, anon demo, raw/admin denial, URL/list/JOIN/RPC/write/integrity/reapply fixtures pass |
| M4: Full validation | `Completed` | both reset modes, 3A/3B regressions, migration list, advisors, and repository checks pass |
| M5: Draft PR handoff | `In progress` | explicit stage complete; approved commit, normal push, new Draft PR, and Issue #107/#102 reports remain; no Ready/merge |

## Validation plan

| Validation | Expected | Current evidence |
|---|---|---|
| migration-only isolated reset | all migrations replay without seed | Passed |
| seeded isolated reset | migration plus existing seed replay; legacy inserts derive project | Passed |
| dedicated 102-3C verifier via existing `tsx` | all security/integrity cases pass and roll back | Passed |
| migration reapply | no duplicate objects or semantic drift | Passed inside dedicated verifier |
| unsafe pre-write inventory | cross-project fixture rejected before migration writes | Passed inside dedicated verifier |
| 102-3A verifier against isolated container | pass | Passed with in-memory container-name substitution; source unchanged |
| 102-3B verifier against isolated container | pass | Passed with in-memory container-name substitution; source unchanged |
| local migration list | new migration listed locally | Passed; latest local migration is `20260729164230` |
| local advisors | no unreviewed issue | Passed; `No issues found` |
| `npm run recora:preflight:full` | pass | Passed |
| `npm run typecheck` | pass | Passed directly and within preflight |
| `npm run lint` | pass | Passed; no warnings or errors |
| `npm run build` | pass | Passed; existing `metadataBase` warning only |
| `git diff --check` | pass | Passed on the staged three-file diff |
| `npm run recora:commit-check` | expected migration gate recorded | Preflight passed; expected single manual migration gate failed; Issue body provides explicit R3 Execute approval |
| exact scope / secret scan | three approved files only; no secret/URL/key | Passed; three approved files and zero value-pattern hits |
| package lock comparison | unchanged | Passed; unchanged from `origin/master` |

The existing Issue #80 and #105 verifier source hard-codes the historical local
container name. For this task, each source is executed unchanged except for an
in-memory container-name substitution to
`supabase_db_recora-issue-107`; no existing verifier file or other container is
modified.

## Backfill, rollout, and rollback

Backfill writes only the five new `project_id` columns and derives them through
mandatory parents. It never changes organization ownership, project ownership,
membership, prompt, evidence payload, or customer classification. Inventory
must report zero null/orphan/duplicate/cross-project problems before the
backfill starts.

This approval applies the migration only to the isolated local database.
Future application to a non-local database requires a separate R3 checkpoint,
read-only inventory, backup/restore readiness, and staged rollout.

Rollback is roll-forward and additive:

- before any future remote application, revert the task commit and replay
  locally
- after a separately approved application, stop affected writers if an
  invariant fails and preserve the new ownership evidence
- do not drop project columns, candidate keys, or evidence as an emergency
  action
- correct a policy, grant, helper, or constraint only through a new reviewed
  migration
- restore legacy customer reads only through a customer-safe read model, not by
  reopening raw measurement/provider tables

## Decision log

| Date | Decision | Rationale / impact |
|---|---|---|
| 2026-07-30 | Carry project ownership on deep evidence rows | Direct project filtering and composite FKs remove multi-hop ambiguity |
| 2026-07-30 | Derive omitted project IDs in a private trigger | Preserves legacy service writers while rejecting caller tenant substitution |
| 2026-07-30 | Keep single-column FKs alongside composite FKs | Additive compatibility and existing delete semantics are preserved |
| 2026-07-30 | Validate polymorphic metric scope with a constraint trigger | One physical FK cannot target several scoped tables |
| 2026-07-30 | Deny authenticated direct raw measurement access | Phase 7/8 must provide the customer-safe published read model |
| 2026-07-30 | Preserve anon access only for demo/local rows | Keeps the synthetic demo path without exposing real tenants |
| 2026-07-30 | Use DB RLS as the Phase 8 authorization contract | Avoids premature route/UI work and prevents service role from becoming actor identity |
| 2026-07-30 | Reassert the existing admin boundary without adding operator identity | 102-3E owns operator permission and audit foundations |
| 2026-07-30 | Proceed through the manual migration commit gate | `recora:commit-check` passed preflight and raised its expected migration-only FAIL; the Issue body explicitly approves this exact R3 migration execution and commit |
| 2026-07-30 | Separate authenticated and anon tenant predicates | Authenticated customer context requires accepted active membership; anon context alone may use demo/local compatibility |

## Results and remaining risks

Current implementation results:

- migration-only and seeded fresh replay pass in the isolated stack
- existing seed writers remain compatible without supplying new project IDs
- dedicated fixtures reject cross-project relation creation, caller project
  substitution, cross-project reparenting, and metric scope substitution
- active A/B membership is tenant-scoped; invited, suspended, revoked, missing,
  and anonymous production access fail closed
- UUID, slug, list, search, filter, count, pagination, JOIN, multi-hop, and
  helper calls do not leak tenant B
- authenticated raw measurement, internal recommendation metadata, browser
  writes, and operator/control access are denied
- anonymous legacy evidence access is limited to local/demo tenant rows
- Issue #80 and #105 regression verifiers pass against the isolated container
- the local migration list ends at `20260729164230`; DB advisors report no issue
- `recora:preflight:full`, typecheck, lint, and build pass; build retains only
  the existing `metadataBase` warning
- cached diff, exact scope, secret-value-pattern, and lockfile checks pass for
  the approved three-file set
- commit-check passes preflight and reports the expected single manual migration
  gate; the Issue body's explicit R3 Execute approval supplies human authority
- explicit helper assertions for demo allow and production deny

Remaining risks and intentionally deferred work:

- production/live data inventory is unverified and outside this local-only
  approval
- Phase 7 must provide immutable customer-safe publication data and explicit
  answer/citation classification
- Phase 8 must integrate a session-aware customer route against that read model
- 102-3E must implement operator identity, permissions, reasons, and audit
- polymorphic metric scope validation is write-time; later schema evolution
  should replace polymorphism with formal typed references if practical
- commit, push, Draft PR creation, and Issue reports remain before handoff
  validation is otherwise complete
