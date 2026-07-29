# Recora data, tenant security, and privacy contract

Status: **Issue #102 Stage 1 design complete / Human review required**

This document defines the target contract for Recora tenant ownership, contract and
entitlement enforcement, immutable measurement history, customer and operator data
boundaries, external AI payloads, retention, and deletion. It is a design contract,
not a statement that the current implementation already satisfies every requirement.

The governing sources are:

- [Issue #102](https://github.com/sushikikun/RECORA/issues/102) and the
  [latest OWNER approval](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5116752218)
- [`recora-post-launch-operations-architecture.md`](./recora-post-launch-operations-architecture.md)
- [`recora-agentic-sdlc.md`](./recora-agentic-sdlc.md)
- [`exec-plans/active/issue-102-data-tenant-security-privacy.md`](./exec-plans/active/issue-102-data-tenant-security-privacy.md)

When this document conflicts with the post-launch operations architecture on
publication, measurement operations, control, audit, or customer read paths, the
post-launch operations architecture takes precedence.

## 1. Scope and non-goals

This contract covers:

- organization, membership, project, and child-row tenant ownership
- contract, subscription, entitlement, limit, and measurement-design lineage
- customer, operator, worker, and service-role authorization boundaries
- immutable measurement evidence, derived data, and published report versions
- cross-tenant isolation across Data API, RPC, routes, jobs, and exports
- external AI provider payload allowlists and privacy controls
- suspension, termination, retention, restoration, and deletion
- additive migration, backfill, compatibility, rollback, and test requirements

Stage 1 does not implement schema, RLS, API, Auth, measurement, publication, admin,
retention, or deletion changes. It does not assert live Supabase state. Current-state
findings below are based on `master` at `4fcd505` and repository migrations and code.
Live drift, role grants, policy behavior, data classification, advisors, and actual
tenant assignments remain unverified until separately approved read-only inspection.

## 2. Non-negotiable decisions

1. `organization` is the tenant root.
2. Every externally addressable or independently authorized root row carries
   `organization_id`. New tenant-owned tables default to carrying it directly.
3. A leaf may derive ownership through a parent only when the chain is mandatory,
   indexed, enforced by composite foreign keys, and exercised by isolation tests.
4. Membership alone is insufficient. Authorization also checks membership acceptance,
   tenant lifecycle, object ownership, and the action-specific role.
5. Customer browser code reads only customer-safe `api` read models backed by the
   current published report version. It does not read raw `measurement`, internal
   `control`, or `audit` data.
6. `ready`, `approved`, and `published` are separate formal states. They are not
   inferred only from JSON metadata.
7. Published report versions and their published child rows are immutable. A
   correction creates a new version and atomically switches the current pointer.
8. A failed newer measurement, aggregation, validation, or publication cycle does not
   replace the previously published healthy report.
9. Contract or plan changes never mutate historical entitlement, setup, measurement,
   result, or publication meaning.
10. Measurement execution is provider-neutral. Cron enqueues work; workers claim,
    execute, retry, and record attempts using idempotency controls.
11. Branded prompts do not feed visibility, ranking, Share of Voice, average position,
    or competitor-gap metrics.
12. One valid observation or one metric snapshot cannot satisfy completeness or
    metric-validity gates.
13. Important admin actions, reruns, approvals, publication pointer changes,
    permission changes, subscription changes, and deletion actions create audit
    events.
14. Supabase service-role and provider credentials remain server-only and never enter
    customer or admin browser bundles.
15. Destructive legacy removal occurs only after additive migration, backfill,
    verification, read-path cutover, and an approved rollback checkpoint.

## 3. Current `master` inventory

The classifications in this section mean:

- **Reusable**: the structure is a sound foundation, subject to the target contract.
- **Fix**: retain the concept but correct its enforcement or lineage.
- **Deprecate**: keep only for compatibility until a verified replacement is active.
- **Missing**: add in separately approved Stage 2 child work.

### 3.1 Reusable foundations

| Foundation | Repository evidence | Conditions for reuse |
|---|---|---|
| Organization, membership, and project tenant root | `supabase/migrations/20260620181714_recora_tenant_foundation.sql:16-52,78-134` | Require accepted membership, lifecycle checks, and verified existing assignments |
| Private RLS helper placement | `supabase/migrations/20260620202448_recora_minimal_rls.sql:10-127` | Keep `SECURITY DEFINER` helpers out of exposed schemas, fixed `search_path`, and narrow execute grants |
| RLS enabled and browser writes revoked on current public tables | `supabase/migrations/20260620202448_recora_minimal_rls.sql:129-184` | Replace customer raw reads with publication read models and test actual role behavior |
| Private `recora_admin` schema and read-only RPC boundary | `supabase/migrations/20260627204737_recora_admin_p0a.sql:346-361`; `20260701054500_recora_admin_customer_ops_readonly_rpc.sql:220-226` | Add production operator identity, authorization, audited write APIs, and tenant-safe result contracts |
| Server-only service-role client | `lib/supabase/server.ts:1,63-83` | Continue to prohibit browser imports and add caller/action authorization before privileged work |
| Setup draft validation and generator safety checks | `lib/recora/project-setup-draft.ts:380-397,566-671`; `lib/recora/project-setup-draft-generator.ts:595-691` | Persist immutable versions and connect materialization to entitlement and approval gates |
| Prompt and provider evidence snapshots | `supabase/migrations/0001_recora_v01_schema.sql:232-247`; `scripts/run-openai-measurement.ts:638-687` | Add design, entitlement, payload-policy, adapter, parser, and attempt lineage |
| Batch item idempotency skeleton | `supabase/migrations/20260628123152_recora_admin_p0b_batches.sql:102-153` | Add tenant ownership to the batch root and use a real provider-neutral queue worker |
| Prompt scope and valid-observation helpers | `lib/recora/prompt-scope.ts:71-111`; `lib/recora/report-eligibility.ts:290-299` | Make them authoritative in execution and aggregation, with fail-closed tests |
| Citation URL and occurrence evidence | `scripts/run-openai-measurement.ts:730-835,958-1029` | Separate provider adapter parsing, parse status, claim support review, and immutable reparsing |
| Operation-event skeleton | `supabase/migrations/20260627204737_recora_admin_p0a.sql:222-251` | Make it append-only and write it atomically with privileged business actions |

### 3.2 Structures that require correction

| Finding | Risk | Required correction |
|---|---|---|
| Tenant foundation assigns every legacy project without an organization to the anonymous demo organization | P0 | Before any production migration, inventory live project ownership; use explicit mapping/quarantine and fail closed instead of bulk demo assignment |
| Core evidence uses independent foreign keys that can join rows from different projects | P0 | Add project-scoped unique keys and composite foreign keys after a cross-tenant orphan audit and backfill |
| Membership helper does not require `accepted_at` | P0 | Define accepted, active membership as a formal predicate and test invited/unaccepted/revoked users |
| Customer authentication cookie is not propagated to dashboard DB queries | P0 | Resolve the authenticated user with `auth.getUser()`, use the session-aware server client, then authorize tenant/project membership |
| Signup creates an Auth user but no membership | P0 | Add an invitation or onboarding transaction that establishes an accepted organization relationship |
| Measurement runs are selected by project slug without contract, actor, or entitlement enforcement | P0 | Resolve the tenant, actor, lifecycle, entitlement snapshot, design version, budget, and idempotency key before enqueue and again at worker start |
| Recalculation reuses an aggregate and updates metric snapshots in place | P0 | Create versioned derived results; never mutate a historical aggregate or published result |
| Timeout, refusal, blocked, malformed, empty, partial, and valid absence are not separate provider outcomes | P0 | Introduce a provider-neutral result state and prohibit invalid observations from becoming absence evidence |
| `plan_configs.config` and subscription entitlement JSON are mutable and resolved by a live join | P0 | Version plan policies and persist immutable resolved entitlement snapshots |
| Measurement batch root has no direct tenant ownership | P0 | Carry organization/project on the batch root and enforce all schedule/intake links with composite tenant keys |
| Current admin access is localhost-only with a fixed all-role actor | P0 | Add production operator identity, role checks, reason capture, and audit; keep local mode explicitly non-production |
| Audit append-only behavior exists only in comments and no runtime write path exists | P1 | Add immutable event constraints and an authorized, transaction-coupled insert path |
| Metric uniqueness omits calculation/version semantics | P1 | Version metric definitions and include the immutable calculation identity in derived-result uniqueness |
| Typed Supabase schema is absent and hand-written types drift from migrations | P1 | Generate and check `Database` types; make schema drift fail CI |
| Large child queries rely on the PostgREST row cap without cursor pagination | P1 | Add deterministic cursor pagination and completeness tests |
| `site-inspect` is unauthenticated and DNS is resolved separately for validation and fetch | P1 candidate | Require auth/rate limits and validate a DNS-pinned connection strategy; reproduce DNS-rebinding risk before severity is finalized |

### 3.3 Compatibility-only or deprecation candidates

- direct customer access to `public.measurement_runs`, `run_items`,
  `ai_conversations`, `citations`, `metric_snapshots`, and related raw evidence
- anonymous demo access to the entire raw measurement hierarchy
- selecting the latest completed aggregate as the customer report
- treating Phase 1 `customer_ready` as final publication state
- OpenAI-specific `data_source` and one-observation readiness logic
- metadata-only recommendation/publication state
- treating `report_publication_reviews.status = published` as an immutable customer
  publication
- a fixed demo customer/subscription inside a historical schema migration
- static TypeScript measurement profile identifiers as the durable design contract
- local-development admin authorization as a production admin design
- the legacy direct measurement orchestrator as a production queue
- raw provider inspection artifacts as an import source of truth

These paths must not be removed in the same migration that introduces their
replacement. They remain compatibility-only until the new read and write paths pass
the acceptance gates in this document.

### 3.4 Missing target capabilities

- logical `api`, `publication`, `measurement`, `control`, and `audit` boundaries
- immutable report publication versions, published children, and current pointer
- versioned plan policy and immutable resolved entitlement snapshot
- durable setup draft, measurement design, prompt set, and approval versions
- provider-neutral queue, worker, attempt, retry, budget, and adapter contracts
- production customer membership resolution and operator authentication
- formal quality gates and completeness profiles
- lifecycle, retention policy, restoration, deletion job, deletion manifest, and
  deletion result
- append-only, queryable, tenant-aware admin audit
- executable cross-tenant, fresh replay, backfill, rollback, and privacy tests

## 4. Tenant ownership contract

### 4.1 Root and keys

`organizations.id` is the tenant identifier. `projects.organization_id` is mandatory.
The organization referenced by every contract, subscription, setup, measurement,
publication, control, and audit root must equal the project's organization.

For new tenant-owned roots:

- store `organization_id not null`
- store `project_id not null` when the object is project-scoped
- reference `projects` through `(project_id, organization_id)`
- create indexes beginning with the tenant key for common tenant queries
- never accept `organization_id` only from a client body; derive or verify it from the
  authorized project

For child evidence, either store `organization_id` and `project_id` directly or use a
mandatory parent chain with composite foreign keys. Independent foreign keys that
permit `run A + prompt B` or `conversation A + brand B` are prohibited.

### 4.2 Membership and actor

Customer access requires all of:

1. a verified authenticated user from `auth.getUser()`
2. an accepted, active organization membership
3. a tenant lifecycle state that permits the requested action
4. ownership of the project or child row by that organization
5. a role/action grant for non-read actions

Invitation, acceptance, suspension, revocation, and role changes are explicit states.
User-editable JWT metadata is not an authorization source. A missing or ambiguous
tenant returns a non-enumerating denial.

Workers and operators use separate identities:

- a worker receives a claimed job whose organization/project and immutable execution
  inputs are already recorded
- an operator has a production identity, a scoped role, and a recorded reason
- the service role is a server capability, not an actor; the actor is recorded
  separately for every privileged action

### 4.3 RLS, grants, views, functions, and RPC

- RLS is enabled on every exposed tenant table.
- Policies use both `USING` and `WITH CHECK` where writes are allowed.
- Table and sequence privileges are explicit; RLS does not replace `GRANT` review.
- Customer-facing views use `security_invoker = true` and expose only approved fields.
- `SECURITY DEFINER` functions live in a non-exposed schema, use a fixed empty or
  explicit `search_path`, fully qualify objects, validate the actor, and have narrow
  execute grants.
- RPCs return tenant-safe DTOs and must not allow a caller-provided tenant to override
  the actor's tenant.
- Service-role APIs validate actor, action, project, lifecycle, and entitlement before
  performing a write.

## 5. Contract, entitlement, setup, and measurement lineage

The dependency direction is:

```text
contract/subscription
  → versioned plan policy
  → immutable resolved entitlement snapshot
  → immutable approved measurement-design version
  → queue job and worker attempt
  → raw evidence
  → versioned derived result
  → immutable publication version
```

### 5.1 Plan and entitlement

A plan policy version has an immutable identifier, effective interval, feature flags,
limits, supported model/provider policy, frequency/budget policy, and schema version.
Updating a marketed plan creates a new version.

An entitlement snapshot resolves:

- organization and optional project
- subscription and plan-policy version
- approved overrides and their reason
- effective start/end
- prompt, model, provider, frequency, concurrency, and cost limits
- allowed features and data-processing policy
- resolution schema version and hash

Snapshots are immutable. A contract change creates a new current snapshot but does not
rewrite snapshots referenced by setup designs, jobs, runs, results, or publications.

Enforcement occurs at:

1. setup draft creation or regeneration
2. setup/design approval and materialization
3. job enqueue
4. worker claim/start
5. provider-call budget reservation
6. retry or rerun

A rejected gate records a structured reason and audit event without starting provider
work.

### 5.2 Setup draft and measurement design

A durable setup draft stores the generator/schema version, tenant/project target,
source inputs, personas, topics, prompts, review state, validation results, and
entitlement snapshot used to create it.

Approval materializes a new immutable measurement-design version containing:

- organization and project
- setup draft and approval record
- entitlement snapshot
- prompt-set version and complete prompt-definition snapshots
- persona/topic/brand/competitor snapshots
- prompt type and measurement eligibility
- requested provider/model/search configuration
- completeness profile and metric-definition version
- external payload policy version
- effective interval and supersession link

The design state is separate from subscription and publication:

`draft → validating → review_required → approved → active → superseded | archived`

An approved design is immutable. A change creates a successor. Every queue job, attempt,
run, derived result, and publication references the exact design version.

## 6. Measurement evidence and historical immutability

### 6.1 Queue and attempt model

Cron and operator actions enqueue jobs; they do not perform long-running provider work.
A job carries tenant/project, design version, entitlement snapshot, idempotency key,
priority, budget reservation, scheduled time, and audit correlation ID.

A worker:

1. atomically claims one eligible job
2. revalidates lifecycle and entitlement
3. creates an immutable attempt record
4. calls a provider through a common adapter
5. stores raw provider evidence once
6. records structured result/error status
7. enqueues parsing and derived work
8. retries only retryable failures using bounded backoff and budget

Provider idempotency support is used when available. When it is unavailable, Recora
records request identity and treats an unknown provider outcome as a distinct state;
it does not silently issue an unbounded duplicate call.

### 6.2 Provider result states

At minimum, distinguish:

- `succeeded`
- `refused`
- `blocked`
- `empty`
- `partial`
- `malformed`
- `timed_out`
- `rate_limited`
- `provider_error_retryable`
- `provider_error_terminal`
- `canceled`
- `unknown_outcome`

Only a validated successful observation may become positive or negative brand evidence.
Refusal, empty output, parse failure, and timeout must not become `absent`.

### 6.3 Raw, parsed, derived, and published layers

- raw provider response and request evidence are append-only
- parser output is versioned and may be superseded, never rewritten in place
- aggregate and metric results are versioned by source evidence set, design, parser,
  metric definition, and calculation implementation
- recalculation creates a new derived result
- publication copies or references a frozen, validated result set
- published rows reject update/delete except through an approved lifecycle workflow

Prompt text, actual provider/model, request/response identity, usage, attempt, parser,
payload policy, design, entitlement, and metric versions remain traceable from every
published value.

## 7. Publication and customer read contract

Publication states are:

`draft → validating → ready → approved → published → superseded | withdrawn`

Each state change is formal and audited. `ready` means automated completeness and metric
validity gates passed. `approved` records an authorized reviewer and reason.
`published` records an immutable version that the customer may read.

`project_current_publication` points to exactly one healthy published version. Pointer
switch and audit event occur atomically. A failed candidate leaves the pointer
unchanged.

Customer routes resolve:

```text
authenticated user
  → accepted organization membership
  → authorized project
  → current published report pointer
  → customer-safe api read model
```

Customer responses exclude raw answers, raw provider payloads, internal run/job IDs,
internal errors, operator notes, entitlement internals, audit details, and secrets.
Raw run/conversation screens are internal evidence tools, not customer report routes.

## 8. Customer and admin separation

| Surface | Identity | Allowed data | Prohibited data/action |
|---|---|---|---|
| Customer browser | authenticated accepted member | current customer-safe publication for its tenant | raw measurement/control/audit, other tenant, service role |
| Customer server action | customer actor plus authorized project | narrowly scoped writes allowed by lifecycle and entitlement | arbitrary organization/project selection |
| Operator UI | production operator identity and scoped role | authorized control/read models | direct browser service-role access |
| Operator write API | operator identity, role, reason, request ID | explicit command with audit event | generic table mutation |
| Worker | claimed job identity | immutable job/design/evidence scope | free-form tenant selection |
| Service role | server capability | only behind authorized server module | use as end-user identity or browser credential |

Admin read and write paths are separate from customer paths. Sensitive reads may also
require audit. Permission, subscription, rerun, approval, publication, and deletion
changes record actor, tenant, target, before/after state, reason, request/correlation
ID, time, and outcome.

## 9. External AI payload and privacy contract

### 9.1 Allowlist

The provider-neutral request DTO may contain only fields required for the approved
measurement design:

- immutable prompt text snapshot
- public target brand, service, domain, and approved aliases when required
- approved public competitor names when required
- locale/language and search mode
- provider/model/tool configuration allowed by the entitlement
- optionally, approved public web-page text with its source URL and size/classification
- request, schema, adapter, and payload-policy version identifiers that contain no
  secret or customer PII

### 9.2 Denylist

The request must reject or redact:

- member name, email, phone, user ID, auth claims, cookies, or session identifiers
- contract, plan, billing, payment, quota, or commercial negotiation details
- internal notes, audit contents, operator identity, or support content
- secrets, tokens, credentials, database URLs, environment values, or private keys
- another tenant's identifiers, prompts, results, domains, or internal metadata
- unapproved personal, confidential, or regulated data

The payload is constructed from a typed allowlist DTO, not by serializing an internal
database object. Before network activity, validate classification, size, tenant/design
lineage, entitlement, budget, and denylist patterns. Persist the payload policy version
and a safe hash. Logs use opaque IDs and structured status; they do not print prompt
text or raw provider output.

### 9.3 Adapter and test contract

Every provider adapter maps the common request and result types without leaking
provider-specific payload shape into aggregation. Contract fixtures cover success,
refusal, blocked, empty, malformed, partial, timeout, rate limit, retryable/terminal
errors, citations unavailable, and citation parse failure. Network calls are mocked in
privacy and idempotency tests.

`store: false` is retained where supported but is not a substitute for payload
minimization, vendor terms, retention policy, or deletion design.

## 10. Lifecycle, retention, restoration, and deletion

Subscription status, customer access state, and data lifecycle are separate. The data
lifecycle is:

`active → access_suspended → terminated_retained → deletion_scheduled → deleting → deleted`

Exceptional states include `legal_hold`, `restored`, and `deletion_failed`.

- `access_suspended`: deny customer access and all new setup/measurement work; keep
  data unchanged.
- `terminated_retained`: keep data under a versioned retention policy until
  `retain_until`; permit only explicitly authorized internal handling.
- `deletion_scheduled`: create an immutable inventory/manifest and idempotent job.
- `deleting`: delete in dependency order with checkpoints, retries, and per-category
  outcomes.
- `deleted`: retain only the minimum permitted tombstone and audit proof.
- `legal_hold`: suspend deletion for defined categories without silently restoring
  customer access.

Retention duration is configuration, not a hard-coded number in this contract. The
policy version defines treatment for Auth/membership, setup/design, raw provider
evidence, derived results, published reports, billing/contract records, operational
events, and security/audit records. Legal and contractual approval is required before
defaults are implemented.

Deletion is never a blind project cascade. It records tenant, policy, scope, inventory
counts, exclusions/holds, attempt history, result counts, errors, actor, reason, and
correlation ID. Restoration is allowed only before the policy's irreversible boundary
and creates an audit event.

## 11. Threat and failure ledger

| ID | Threat/failure | Status from Stage 1 | Required control |
|---|---|---|---|
| T1 | Legacy real project becomes anonymous demo data | Confirmed migration behavior; live applicability unverified | Explicit live inventory and mapping; fail-closed migration |
| T2 | Privileged writer creates cross-project evidence references | Confirmed schema permits it | Composite tenant FKs and negative fixtures |
| T3 | Customer auth session is ignored by dashboard queries | Confirmed code path | Session-aware client and route/project authorization |
| T4 | Customer reads latest/raw internal measurement instead of published version | Confirmed code path | Publication pointer and customer-safe API read model |
| T5 | Plan mutation changes historical entitlement meaning | Confirmed live-join design | Immutable plan policy and resolved snapshot |
| T6 | Duplicate provider cost after timeout/commit failure | Confirmed missing attempt/idempotency model | Queue, attempt, budget reservation, bounded retry |
| T7 | Provider failure becomes negative brand evidence | Confirmed parser/control-flow risk | Formal provider result and valid-observation gate |
| T8 | Recalculation mutates past aggregate | Confirmed upsert path | Immutable derived versions |
| T9 | External payload includes PII/secret through prompt text | No allowlist/denylist; exploit not demonstrated | Typed allowlist, redaction/rejection, log safety tests |
| T10 | Unauthenticated site inspection is abused for outbound requests | Endpoint confirmed; DNS-rebinding is a static candidate | Auth, rate limit, DNS-pinned design, focused validation |
| T11 | Admin action is unattributed or unaudited | Production admin/write audit missing | Operator identity, authorization, transaction-coupled audit |
| T12 | Contract termination leaves access or measurement active | Lifecycle enforcement missing | Separate access/data states and tests |
| T13 | Deletion cascade removes required evidence/audit without manifest | Current cascade and deletion workflow absence confirmed | Policy-driven manifest, holds, checkpoints, proof |
| T14 | Fresh database cannot reach a secure reproducible state | Master migration replay blocker confirmed | Resolve #81-equivalent blocker and add replay CI |

No finding in this Stage 1 document is a claim about an exploited production system.
Runtime-only hypotheses require separate validation approval.

## 12. Cross-tenant and security test contract

Fixtures contain:

- organization A and B
- accepted member A and B
- invited but unaccepted member
- revoked/suspended member
- anonymous actor
- scoped operator and worker
- demo and non-demo projects
- complete parent/child evidence and one deliberately rejected cross-tenant fixture

Every customer-visible table, view, RPC, route, export, and job is tested for:

1. own-tenant positive read/action
2. other-tenant UUID and slug direct access
3. list, search, filter, pagination, and count leakage
4. embedded/nested relation and multi-hop join leakage
5. RPC tenant-parameter substitution
6. create with another tenant/project
7. update reparenting, including `WITH CHECK`
8. delete and bulk action
9. anonymous and unaccepted membership
10. suspended/terminated lifecycle
11. error/404 consistency and absence of existence leaks

Additional suites verify:

- anon/authenticated cannot call admin RPCs
- security-definer functions and grants are minimal
- customer responses contain no raw answer, provider payload, internal ID/error, or
  audit/operator fields
- entitlement changes leave past design/run/result/publication hashes and references
  unchanged
- published rows reject mutation and pointer switches are atomic
- failed newer cycles preserve the current publication
- provider payload allowlist, denylist, logging, and mock adapter behavior
- duplicate delivery and retry do not duplicate provider work or evidence
- branded/non-eligible prompts never enter protected metrics
- retention, restoration, legal hold, deletion retry, and audit proof
- pagination remains complete above 1,000 child rows

## 13. Additive migration, backfill, compatibility, and rollback

### 13.1 Prerequisite

`master` fresh replay currently stops in
`supabase/migrations/20260701073553_recora_internal_demo_subscription.sql:10-33`
because it requires a project that migrations do not create. Draft PR
[#81](https://github.com/sushikikun/RECORA/pull/81) proposes a fix but is not part of
`master` and is not assumed merged. Stage 2 schema work must first decide whether to
merge, replace, or supersede that fix, then prove migration-only and full seed replay.

### 13.2 Sequence

1. Inventory live schema, grants, policies, functions, project-to-organization mapping,
   cross-tenant/orphan counts, current subscriptions, and publication/read usage.
2. Make fresh migration replay deterministic without embedding required demo business
   rows in historical schema migration.
3. Add new schemas, roots, immutable version entities, lifecycle fields, constraints,
   and supporting indexes without removing legacy paths.
4. Add composite candidate keys and `NOT VALID` tenant foreign keys where needed.
5. Backfill tenant ownership, plan-policy versions, entitlement snapshots, design
   versions, and publication candidates in bounded, restartable chunks.
6. Validate row counts, nulls, duplicates, orphan and cross-tenant links, hashes, and
   constraint validity before enforcement.
7. Shadow-write or materialize new immutable paths while legacy reads remain available.
8. Verify customer-safe publication reads, RLS/API isolation, admin authorization,
   provider payloads, lifecycle, and audit.
9. Atomically switch customer reads to the current publication pointer.
10. Enforce new write gates and stop creating legacy-only state.
11. Remove legacy grants/read paths only in a later approved change after observation
    and rollback windows pass.

Backfill SQL must be idempotent, tenant-scoped, bounded, observable without secrets,
and safe to resume. Every migration records expected pre/post counts and queries for
cross-tenant anomalies.

### 13.3 Rollback

Rollback is application-level and additive:

- stop new-schema writers and queue claims with an approved feature/control flag
- retain legacy read compatibility until the publication path is verified
- switch a customer pointer only to an already healthy immutable publication
- resume an idempotent backfill from its checkpoint
- never roll back by mutating published versions, historical entitlement snapshots,
  raw evidence, or audit events
- never drop a new column/table/constraint in the emergency rollback step

Destructive cleanup is a separate change after evidence confirms it is safe.

## 14. Stage 2 child-issue split

Each child is independently scoped. Because the parent is R3, any database write,
migration, local reset, external API execution, privileged operation, or production
effect requires the exact child scope and a separate Execute approval.

| Child | Scope and acceptance | Depends on |
|---|---|---|
| 102-A Fresh replay baseline | Resolve #81-equivalent blocker; migration-only and seeded fresh replay pass; no fixed required business row in schema migration | none |
| 102-B Tenant ownership and composite integrity | Inventory/backfill plan approved; accepted membership predicate; organization/project keys and composite FKs reject cross-tenant rows | 102-A |
| 102-C RLS, grants, API, and auth isolation | Session-aware customer auth; customer A/B, anon, invitation, lifecycle, URL/list/join/RPC tests pass; no raw customer grants | 102-B |
| 102-D Contract and entitlement versions | Versioned plan policy and immutable resolved snapshots; create/finalize/enqueue/worker gates and historical-immutability tests pass | 102-B |
| 102-E Durable setup and measurement design | Draft persistence, approval/materialization, immutable design and prompt-set versions, full lineage to entitlement | 102-D |
| 102-F Provider-neutral queue and privacy | Queue/attempt/idempotency/retry/budget adapters; payload allowlist/denylist and failure-state tests | 102-D, 102-E |
| 102-G Immutable derived results and quality gates | Versioned parse/aggregate/metric results; prompt eligibility and completeness gates; no in-place historical mutation | 102-F |
| 102-H Publication and customer read cutover | Immutable publication children/current pointer; atomic publish; failed cycle preserves healthy report; customer-safe API only | 102-C, 102-G |
| 102-I Production admin and audit | Operator identity/roles, command APIs, reason/before/after/request audit, sensitive-read policy | 102-B |
| 102-J Lifecycle, retention, and deletion | Access suspension, policy version, restoration/hold, manifest, idempotent deletion, proof/audit | 102-D, 102-H, 102-I |
| 102-K Integration and legacy retirement | Fresh replay CI, full cross-tenant/security suite, staged cutover observation, approved removal of compatibility paths | 102-C through 102-J |

Child creation itself is outside Stage 1 unless separately requested. The identifiers
above are planning labels, not existing Issue numbers.

## 15. Stage 2 entry and stop conditions

Stage 2 must not start until:

- this design and Exec Plan receive Human review
- the parent/child scope, dependencies, and acceptance criteria are accepted
- live Supabase target identity and read/write boundary are confirmed
- any required migration plan is approved
- the exact R3 Execute operation receives a separate explicit approval

Stop before any:

- schema, migration, RLS, grant, function, view, or live DB change
- Supabase local reset or production/non-local query/write not explicitly approved
- Auth, API, measurement, publication, admin, retention, or deletion implementation
- external provider execution
- secret/environment inspection
- ready-for-review PR conversion, merge, deploy, Issue close, or branch deletion

## 16. Stage 1 validation and residual risk

Stage 1 validates repository evidence and document integrity only. It intentionally
does not validate:

- live schema drift, RLS/grants, advisors, data ownership, or existing cross-tenant rows
- real JWT behavior and runtime route isolation
- DNS-rebinding exploitability
- provider calls, idempotency, payload minimization, or vendor behavior
- fresh local migration replay, because it is a write-capable local DB operation and
  `master` has a known blocker
- retention periods or legal requirements

These are explicit residual risks and required inputs to the appropriate child Issues,
not silent assumptions.
