# Recora data, tenant security, and privacy contract

Status: **Issue #102 Stage 1 revised after OWNER Human review follow-up / Human review required**

This document defines the Phase 3 common data, tenant-security, and privacy foundation.
It also defines the interfaces that later phases must consume without assigning their
product or runtime implementation to Issue #102.

## Authority order

For Issue #102, use the following order. A lower source cannot override a higher one:

1. [Issue #102 confirmed principles](https://github.com/sushikikun/RECORA/issues/102)
2. [OWNER approval 5116752218](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5116752218)
3. [OWNER parallel-development policy 5117068026](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5117068026)
4. [OWNER Human review 5117210498](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5117210498)
5. [OWNER Human review follow-up 5117655117](https://github.com/sushikikun/RECORA/issues/102#issuecomment-5117655117)
6. Confirmed implementation facts on `master` at `4fcd505`

[`recora-agentic-sdlc.md`](./recora-agentic-sdlc.md) controls lifecycle and approval
mechanics. Existing architecture documents, PRs, and unmerged branches, including
[`recora-post-launch-operations-architecture.md`](./recora-post-launch-operations-architecture.md),
are reference material and do not automatically contribute product or operational
decisions. PR #71's unmerged code implementation, design values, and mock values are
also reference material and remain revisable. Its OWNER-adopted customer-screen
information structure is a formal product criterion that Issue #102 must preserve.

## 1. Phase 3 scope and parallel development

### 1.1 Issue #102 directly owns

- tenant root and ownership relationships
- authorization foundation including accepted membership
- composite tenant integrity
- RLS, grants, and customer/operator access boundaries
- common data foundation separating contract data from entitlements and limits
- versioned plan-policy and immutable entitlement-snapshot foundation
- reference contract that keeps historical measurement designs and results unchanged
- operator identity, authorization, and audit foundation
- configurable post-contract retention and deletion-state foundation
- common external-AI payload allowlist, denylist, and safety-inspection foundation
- fresh replay, cross-tenant, RLS, permission, and historical-immutability security tests

Stage 1 documents and plans this scope only. It does not implement schema, RLS, API,
Auth, database, or external-provider changes.

### 1.2 Later phases own their product and runtime implementation

- Phase 4: contract start/change, payment failure, suspension, cancellation, and other
  contract-lifecycle business processing
- Phase 5: onboarding, durable setup draft, question finalization, and real
  measurement-design integration
- Phase 6: queue, worker, provider call, retry, budget, and provider-adapter runtime
- Phase 7: analysis results, quality decisions, `反映 / 保留`, and the customer-display
  read model
- Phase 8: customer dashboard real-data integration
- Phase 9: operator/admin screens
- Phase 10: LP and public site, including the LP, service and feature introductions,
  pricing, FAQ, contact, legal pages, and service-start entry paths

Cross-phase integration and release verification is a shared gate across the owning
phases; it is not Phase 10. Phase 10 may start in parallel, but real pricing, contract,
and registration-path integration depends on Phase 4, while alignment with the actual
customer surface and displayed content depends on Phase 8.

Issue #102 may define the interfaces those phases must respect. It does not implement
those later-phase features or create them as Issue #102 Stage 2 children.

### 1.3 Parallel-development policy

Phases 4–10 may begin before Issue #102 is complete when each uses a separate Issue,
worktree, branch, and Draft PR. A later phase must isolate Issue #102 dependencies behind
an interface, adapter, fixture, or mock and must record the unresolved dependency in its
Issue and PR. It must not independently redefine tenant ownership, RLS, operator access,
entitlements/limits, retention/deletion, or the external-AI data boundary. Integration,
Ready conversion, and merge stop until the required upstream contract is settled and
integration verification succeeds.

## 2. Phase 3 non-negotiable decisions

1. `organization` is the tenant root.
2. Every externally addressable or independently authorized tenant root row carries
   `organization_id`. A project-scoped root also carries `project_id`.
3. A leaf may derive ownership through a parent only when the chain is mandatory,
   indexed, composite-FK-enforced, and covered by positive and negative isolation tests.
4. Authorization requires verified identity, accepted active membership, tenant access
   state, object ownership, and action permission. User-editable metadata is not an
   authorization source.
5. Customer and operator paths are separate. Customers cannot access another tenant or
   internal provider envelopes, control data, audit data, secrets, or internal errors.
6. Phase 3 preserves PR #71's OWNER-adopted customer-screen information structure,
   including all 10 primary screens and their major detail views. It may expose fields
   classified as customer-safe, including an AI answer body, excerpt, and citation
   information, but it does not implement or redesign the screens.
7. Contract/plan records are separated from resolved entitlements/limits. The latter are
   versioned and snapshotted immutably.
8. Later contract changes never rewrite the entitlement conditions referenced by a
   historical measurement design or result.
9. OWNER/operator identity, permission, tenant scope, action, reason, and outcome are
   auditable through a common foundation. The service role is a server capability, not
   the operator identity.
10. Contract-access state, retention configuration, restore eligibility, deletion state,
    and deletion outcome are representable without fixing the product workflow or a
    retention-day value in Phase 3.
11. External-AI requests are built from a typed allowlist and reject secrets, login data,
    billing data, unnecessary personal data, internal notes, and other-tenant data.
12. Exposed tenant tables use RLS and explicit grants; privileged functions and views
    follow least privilege; migration replay and security tests are mandatory.
13. Legacy removal is additive and rollback-aware. Historical references and audit
    evidence are not mutated to perform rollback.

The following are not Phase 3 non-negotiable decisions: a queue/worker design, provider
retry rules, branded-prompt metric eligibility, completeness observation counts,
detailed analysis/publication states, or aggregate/derived-result implementation. Their
owning phases decide them while respecting the Phase 3 tenant and privacy boundaries.

## 3. Current `master` inventory

This is an audit inventory, not an assignment of every finding to Issue #102. Items that
belong to Phases 4–10 are handed off in Section 13.

- **Reusable**: sound foundation within the confirmed Phase 3 contract.
- **Fix**: retain the concept but correct tenant, authorization, or history enforcement.
- **Deprecate**: compatibility-only until a verified replacement exists.
- **Missing**: implement in a Phase 3 child or hand off to the owning later phase.

### 3.1 Reusable foundations

| Foundation | Repository evidence | Phase ownership |
|---|---|---|
| Organization, membership, and project tenant root | `supabase/migrations/20260620181714_recora_tenant_foundation.sql:16-52,78-134` | Phase 3 fixes acceptance and existing assignments |
| Private RLS helper placement | `supabase/migrations/20260620202448_recora_minimal_rls.sql:10-127` | Phase 3 retains fixed `search_path` and narrow grants |
| RLS enabled and browser writes revoked on current public tables | `supabase/migrations/20260620202448_recora_minimal_rls.sql:129-184` | Phase 3 verifies actual role boundaries |
| Private `recora_admin` schema and read-only RPC boundary | `supabase/migrations/20260627204737_recora_admin_p0a.sql:346-361` | Phase 3 common identity/authorization/audit; Phase 9 UI |
| Server-only service-role client | `lib/supabase/server.ts:1,63-83` | Phase 3 privileged-access contract |
| Setup-draft validation and generator safety | `lib/recora/project-setup-draft.ts:380-397,566-671` | Phase 5 may reuse through the Phase 3 entitlement interface |
| Prompt/provider evidence snapshots | `supabase/migrations/0001_recora_v01_schema.sql:232-247` | Phase 3 defines immutable references; Phases 6–7 own runtime/result behavior |
| Batch-item idempotency skeleton | `supabase/migrations/20260628123152_recora_admin_p0b_batches.sql:102-153` | Phase 6 candidate; not a Phase 3 queue decision |
| Prompt-scope and valid-observation helpers | `lib/recora/prompt-scope.ts:71-111`; `lib/recora/report-eligibility.ts:290-299` | Phase 7 candidate; not a Phase 3 metric decision |
| Operation-event skeleton | `supabase/migrations/20260627204737_recora_admin_p0a.sql:222-251` | Phase 3 audit foundation |

### 3.2 Confirmed structures requiring correction

| Finding | Priority | Owner or handoff |
|---|---|---|
| Tenant migration assigns every legacy project without an organization to the anonymous demo organization | P0 | Phase 3 live inventory, explicit mapping/quarantine, fail-closed backfill |
| Core evidence uses independent FKs that permit cross-project combinations | P0 | Phase 3 composite tenant keys and backfill audit |
| Membership helper does not require `accepted_at` | P0 | Phase 3 accepted-membership predicate |
| Customer Auth cookie is not propagated to dashboard DB queries | P0 | Phase 3 session/tenant authorization contract; Phase 8 consumes it |
| Signup creates Auth user but no membership | P0 | Phase 3 membership primitive; Phase 4/5 chooses business onboarding |
| Mutable plan JSON is joined live to subscriptions | P0 | Phase 3 versioned plan policy and immutable resolved snapshot |
| Current admin access is localhost-only with a fixed all-role actor | P0 | Phase 3 operator identity/authorization/audit; Phase 9 UI |
| Customer routes read latest/raw measurement rather than a customer-display result | P0 | Phase 3 blocks unsafe access; Phases 7–8 build and consume the safe read model |
| Measurement does not enforce tenant/entitlement/design conditions | P0 | Phase 3 interface; Phase 5 design and Phase 6 execution integration |
| Provider retry/result-state runtime is missing | P0 | Phase 6 follow-up |
| Aggregation mutates prior metric snapshots | P0 | Phase 7 follow-up under the Phase 3 immutable-reference contract |
| Typed Supabase schema drifts from migrations | P1 | Phase 3 generated-type/security-test foundation |
| `site-inspect` is unauthenticated; DNS validation/fetch are separate | P1 candidate | Phase 5 follow-up; runtime exploitability remains unverified |

### 3.3 Compatibility and deprecation candidates

Phase 3 may revoke or narrow unsafe tenant/public grants when its approved migration plan
requires it. Product-path replacement belongs to the owning later phase.

- anonymous demo access to the raw measurement hierarchy
- direct customer reachability to internal measurement/control/audit objects
- a fixed demo customer/subscription inside a historical schema migration
- local-development all-role admin as a production authorization model
- mutable plan JSON/live join as historical entitlement truth
- metadata-only state where a formal tenant/security field is required

Latest-aggregate selection, OpenAI-specific readiness, provider orchestration, prompt
eligibility, completeness, analysis states, and publication/read-model shape remain audit
findings handed to Phases 6–8 rather than Phase 3 deprecation work.

### 3.4 Missing Phase 3 capabilities

- explicit accepted-membership and tenant-access predicates
- composite organization/project integrity for tenant-owned roots and child chains
- executable customer A/B RLS, grant, RPC, and route-isolation tests
- versioned plan policy, immutable entitlement snapshot, resolver interface, and history
  references
- production operator identity, permission, and append-only audit primitives
- retention/deletion state, configurable policy reference, manifest/result primitives
- typed external-AI payload allowlist/denylist validator and privacy fixtures
- deterministic fresh replay and generated schema/type drift checks

## 4. Tenant ownership and access contract

### 4.1 Root and keys

`organizations.id` is the tenant identifier. `projects.organization_id` is mandatory.
Every Phase 3 tenant-owned root derives its organization from an authorized project or a
trusted server-side lookup; it does not trust a client-supplied organization identifier.

New tenant-owned roots:

- store `organization_id not null`
- store `project_id not null` when project-scoped
- reference projects with `(project_id, organization_id)`
- create indexes beginning with tenant keys for common tenant queries
- use composite keys on parent/child chains that could otherwise mix projects

Before constraints are validated, backfill audits must identify null, orphan, duplicate,
and cross-tenant rows. Existing rows are never silently assigned to the demo tenant.

### 4.2 Membership and actors

Customer access requires:

1. a user verified with `auth.getUser()`
2. an accepted, active organization membership
3. tenant access state that allows the action
4. project/row ownership by that organization
5. action permission for writes or sensitive operations

Invitation, acceptance, suspension, revocation, and role changes are explicit. Missing,
revoked, or ambiguous tenant context returns a non-enumerating denial.

An operator uses a production identity and scoped authorization. Downstream worker or
integration code receives a tenant-scoped contract through an interface; Phase 3 does
not implement a queue or worker. The service role remains server-only and never becomes
an end-user or operator identity.

### 4.3 RLS, grants, views, functions, and RPC

- enable RLS on every exposed tenant table
- use both `USING` and `WITH CHECK` for tenant-owned updates
- review grants and sequence privileges separately from RLS
- use `security_invoker = true` for exposed customer views
- keep genuine `SECURITY DEFINER` functions in a non-exposed schema, fully qualify
  objects, fix `search_path`, validate actor/tenant, and grant execution narrowly
- reject caller-supplied tenant substitution in RPCs and server modules
- select only required columns and paginate user-facing collections
- keep service-role functions behind an operator/tenant/action authorization module

## 5. Contract, entitlement, and historical-reference foundation

The cross-phase dependency is:

```text
Phase 4 contract business state
  → Phase 3 versioned plan-policy data
  → Phase 3 immutable resolved entitlement snapshot
  → Phase 5 measurement-design reference
  → Phase 6 execution reference
  → Phase 7 result/reflection reference
```

Phase 3 owns only the plan-policy, resolver/snapshot, tenant constraints, and immutable
reference contract in this chain.

### 5.1 Versioned plan policy

A plan-policy version has an immutable ID, schema version, effective interval, typed
capability/limit definition, and supersession relation. Updating a marketed plan creates
a successor rather than changing the meaning of a prior version. Specific plan names,
prices, question counts, AI counts, and payment-provider behavior are not decided here.

### 5.2 Immutable entitlement snapshot

A resolved snapshot records:

- organization and optional project scope
- opaque source-contract/subscription reference supplied by Phase 4
- plan-policy version
- resolved capability/limit document under a versioned schema
- effective interval, resolution time, resolver version, and safe hash
- approved exception metadata only when a separately authorized business process
  supplies it; Phase 3 does not require human approval

The snapshot is append-only. A contract change may create a new current snapshot but
cannot rewrite a snapshot referenced by historical data.

### 5.3 Consumer interface and immutable references

Phase 3 provides an interface/fixture capable of:

- resolving the current tenant-scoped snapshot
- answering whether a named capability/limit is available without exposing contract or
  billing data
- returning stable reason codes without tenant enumeration
- attaching `entitlement_snapshot_id` and schema version to a downstream record
- rejecting cross-tenant snapshot references

Phase 5 owns checks at setup/design creation and finalization. Phase 6 owns checks at
enqueue/execution/retry. Those phases may use mocks before the Phase 3 implementation is
ready, but integration stops until the real interface passes contract tests.

A historical measurement design/result reference must continue to resolve to the same
snapshot identity after contract or plan changes. Phase 3 defines and tests the reference
constraint; it does not implement setup drafts, measurement-design state machines,
provider execution, parsing, aggregation, or result state machines.

## 6. Customer and operator data boundary

| Surface | Identity | Phase 3 boundary | Owning product phase |
|---|---|---|---|
| Customer browser/server | verified accepted member and authorized project | own-tenant customer-safe fields only; no provider envelope/control/audit/other tenant | Phase 8 consumes Phase 7 read model |
| Operator server | production operator identity, permission, tenant, reason | authorized customer read/change with an audit event | Phase 9 UI |
| Downstream execution | tenant-scoped interface input | cannot choose an unrelated tenant or bypass payload/entitlement contract | Phase 5/6 |
| Service role | server capability | narrow server module only; never browser or actor identity | shared |

Phase 3 implements identity, authorization, tenant scope, grants/RLS, and audit primitives.
It does not implement the customer dashboard, admin screen, queue, or analysis read model.
Sensitive operator reads and important changes record actor, tenant, target, permission,
reason, request/correlation ID, time, and outcome. The exact future staff-role catalog is
not decided here.

## 7. `反映 / 保留` and PR #71 customer-information contract

PR #71's OWNER-adopted product baseline preserves 10 primary customer-screen areas and
their major detail views: overview, brand/competitor, persona/topic, prompt, AI answer,
citation/source, brand perception, trend, recommendation, and settings. The unmerged
code, design values, and mock values may be redesigned or corrected, but Phase 3 does
not remove or redefine this information structure. Phase 3 supplies only the tenant,
RLS, grant, and customer-safe classification boundary; Phase 8 owns the actual screen
implementation and data connection.

The confirmed customer-reflection outcomes are:

- `反映`: eligible for the customer-display surface
- `保留`: not displayed to the customer until the owning Phase 7 process changes the
  decision

Any internal validation, version, analysis, or publication representation must map
unambiguously to one of those two customer outcomes. Internal technical states do not
create a third customer outcome. `approved` is not fixed as a mandatory human-review
step. Phase 7 decides when human confirmation is required and owns the detailed state
model and quality conditions.

Phase 3 enforces the data boundary around the decision and customer-safe payload for
the entire retained PR #71 information structure. Within the AI-answer and
AI-answer-detail areas, the customer surface may include:

- customer-display answer body
- customer-display excerpt
- customer-display citation/source information
- other fields explicitly classified as customer-safe by Phase 7

The following remain internal and are not customer-display fields:

- raw provider request and provider response envelope
- internal metadata, prompts classified as internal, retry/control data, and cost data
- secrets, credentials, authentication/session data, contract/billing internals
- internal errors, operator notes, audit details, or another tenant's data

Phase 7 creates the safe DTO/read model and the `反映 / 保留` decision. Phase 8 renders
it. Issue #102 supplies the tenant/RLS/grant/classification boundary and negative tests.

## 8. External-AI payload safety foundation

### 8.1 Allowlist

The typed payload DTO may contain only fields required by a downstream measurement
purpose and permitted by the resolved entitlement, for example:

- immutable question/prompt text supplied by the owning phase
- public target brand, service, domain, and required public aliases
- public competitor identifiers when the measurement purpose requires them
- locale/language and permitted search/tool configuration
- optional public page text with source, size, and classification
- non-secret schema, request, and payload-policy version identifiers

Phase 3 defines the common DTO, versioned field classification, size rules, validator,
safe hash, and negative fixtures. It does not implement provider adapters or calls.

### 8.2 Denylist

Reject or redact:

- member name, email, phone, user ID, auth claims, cookies, and sessions
- contract, plan, billing, payment, quota, or negotiation details
- internal notes, audit contents, operator/support content
- secrets, tokens, credentials, database URLs, environment values, and private keys
- other-tenant identifiers, prompts, results, domains, or metadata
- unnecessary personal, confidential, or regulated data

Payloads are constructed from the allowlist DTO, not by serializing internal database
objects. Logs use opaque IDs and structured status; they do not print prompt text or
provider responses. `store: false`, where supported, is retained by the provider-owning
phase but does not replace data minimization or retention controls.

### 8.3 Downstream adapter contract

Phase 6 must run the Phase 3 validator immediately before every provider call and prove
that each adapter maps only allowlisted fields. Phase 6 owns provider-neutral adapter,
retry, error, budget, and idempotency behavior. Its fixture/mock work may begin in
parallel, but integration stops until the payload validator contract is stable.

## 9. Retention and deletion-state foundation

Phase 3 separates contract business state, customer-access state, and data-lifecycle
state. It implements data primitives capable of representing:

`active → access_suspended → retained → deletion_scheduled → deleting → deleted`

Exceptional states include restore eligibility, legal hold, and deletion failure.
The schema records organization, policy/version reference, retention start and deadline,
restore deadline/eligibility, deletion scope, manifest, attempt/outcome, actor, reason,
and audit correlation.

The retention duration is configurable. Phase 3 does not choose a number of days or
implement payment failure/cancellation business processing. Phase 4 maps contract events
to the Phase 3 access/lifecycle interface. Phases 5 and 6 must stop new design/execution
when the interface denies it. Phase 9 renders operator controls later.

Deletion is not a blind project cascade. It is idempotent, tenant-scoped,
manifest-driven, and auditable. Legal/contractual approval is required before default
retention and purge rules are implemented.

## 10. Threat and handoff ledger

| ID | Threat/failure | Stage 1 fact | Direct owner |
|---|---|---|---|
| T1 | Legacy real project becomes anonymous demo data | Migration behavior confirmed; live applicability unverified | Phase 3 |
| T2 | Privileged writer creates cross-project references | Schema permits independent-FK combinations | Phase 3 |
| T3 | Customer session is ignored by DB reads | Current server-query path confirmed | Phase 3 boundary; Phase 8 consumption |
| T4 | Customer reaches internal/raw or other-tenant data | Current grants/read paths require replacement | Phase 3 access boundary; Phases 7–8 safe read model |
| T5 | Plan mutation changes historical entitlement meaning | Mutable live-join design confirmed | Phase 3 foundation; Phase 4 source integration |
| T6 | Provider failure/duplicate cost | Runtime controls missing | Phase 6 follow-up |
| T7 | Recalculation mutates prior metrics | Current upsert path confirmed | Phase 7 follow-up under Phase 3 history contract |
| T8 | Payload includes secret/PII/other tenant | Common validator missing | Phase 3 validator; Phase 6 integration |
| T9 | Site inspection outbound abuse | Endpoint confirmed; DNS-rebinding only a static candidate | Phase 5 follow-up |
| T10 | Operator action is unattributed | Production identity/write-audit path missing | Phase 3 foundation; Phase 9 UI |
| T11 | Contract end leaves access active | Lifecycle interface missing | Phase 3 state; Phase 4 trigger; Phases 5–6 enforcement |
| T12 | Deletion removes data without proof | Manifest/result workflow missing | Phase 3 foundation |
| T13 | Fresh DB cannot replay | Master migration blocker confirmed | Phase 3 |

No Stage 1 finding claims an exploited production system. Runtime hypotheses require a
separately approved validation scope.

## 11. Phase 3 security-test contract

Fixtures include organizations A/B, accepted members A/B, invited/unaccepted and revoked
members, anonymous actor, scoped operator, demo/non-demo projects, and a deliberately
rejected cross-tenant reference.

Phase 3 tests:

1. own-tenant positive access and other-tenant UUID/slug denial
2. list/search/filter/pagination/count and embedded/join/RPC non-leakage
3. create/update/reparent/delete enforcement with `USING` and `WITH CHECK`
4. anonymous, unaccepted, revoked, suspended, and missing-tenant behavior
5. explicit grants and rejection of customer calls to operator RPCs
6. least-privilege functions/views and no browser service-role exposure
7. current entitlement resolution and immutable historical snapshot references
8. contract/plan change fixtures leave past reference IDs/hashes unchanged
9. operator authorization and audit-event integrity
10. retention/deletion state, manifest, restore/hold, retry, and audit integrity
11. payload allowlist/denylist, size, logging, secret/PII/other-tenant negative fixtures
12. fresh migration replay, seed replay, schema/type drift, and backfill invariants
13. fixtures for every retained PR #71 customer-screen area accept customer-safe
    classified fields, including AI-answer body/excerpt/citations, while provider
    envelopes, internal metadata/errors, audit details, and other-tenant fields are
    denied

Downstream phases add their own integration tests: Phase 5 setup/design enforcement,
Phase 6 provider/runtime behavior, Phase 7 analysis and `反映 / 保留`, Phase 8 dashboard,
and Phase 9 admin UI. Those are not Issue #102 child acceptance tests.

## 12. Additive migration, backfill, compatibility, and rollback

### 12.1 Prerequisite

`master` fresh replay currently stops in
`supabase/migrations/20260701073553_recora_internal_demo_subscription.sql:10-33`
because it requires a project not created by migrations. Draft PR #81 is reference only;
Stage 2 must choose an approved resolution and then prove migration-only and seeded
replay.

### 12.2 Phase 3 sequence

1. inspect live schema/grants/policies/functions and tenant/orphan/cross-tenant counts
   under separately approved read-only access
2. make fresh replay deterministic without required demo business rows in schema
   migrations
3. add tenant/access, plan-policy, entitlement-snapshot, operator/audit,
   retention/deletion, and payload-policy primitives additively
4. add composite candidate keys and initially non-validating constraints where required
5. backfill ownership and Phase 3 version/reference data in bounded idempotent chunks
6. validate counts, nulls, duplicates, orphans, cross-tenant links, hashes, and
   constraints
7. expose versioned interfaces/fixtures for Phases 4–10 without implementing their
   product paths
8. run the complete Phase 3 security suite before tightening legacy grants or writes
9. remove compatibility paths only in a later approved change after dependent phases
   have integrated and verified replacement paths

Phase 3 does not backfill setup drafts, build a queue, recalculate results, define
detailed publication states, switch a customer read model, connect dashboard data, or
implement an admin screen.

### 12.3 Rollback

Rollback remains additive: stop new Phase 3 writers/interfaces, resume an idempotent
backfill from a checkpoint, retain old compatible reads until a verified dependent path
exists, and avoid destructive drops in the emergency step. It never mutates historical
entitlement references or audit evidence. Later phases own rollback for their own
product/runtime integration.

## 13. Stage 2 split and cross-phase dependencies

Every Phase 3 child requires its own accepted scope and separate R3 Execute approval for
DB, RLS, Auth, migration, privileged, or external effects. Labels are planning labels,
not existing Issue numbers.

### 13.1 Phase 3 direct implementation children

| Child | Scope and acceptance | Depends on |
|---|---|---|
| 102-3A Fresh replay baseline | Resolve the master blocker; migration-only and seeded replay pass; no required business row in schema migration | none |
| 102-3B Tenant ownership and membership | Explicit organization/project ownership, accepted membership, safe existing-data mapping | 102-3A |
| 102-3C Composite integrity, RLS, grants, and customer/operator boundary | Composite tenant constraints and customer A/B, anon, URL/list/join/RPC tests pass | 102-3B |
| 102-3D Plan policy, entitlement snapshot, and history references | Versioned policy, immutable snapshot/resolver, cross-tenant rejection, history contract tests | 102-3B |
| 102-3E Operator identity, authorization, and audit foundation | OWNER/operator identity and scoped authorization; append-only audit primitives and tests | 102-3B |
| 102-3F Retention and deletion-state foundation | Configurable policy/state, restore/hold, manifest/result, access-state tests; no product retention-day decision | 102-3D, 102-3E |
| 102-3G External-AI payload safety foundation | Typed allowlist/denylist validator, safe logging/hash, privacy fixtures | 102-3B, 102-3D |
| 102-3H Phase 3 integration/security suite | Fresh replay, RLS/grants, cross-tenant, history, audit, lifecycle, payload tests pass together | 102-3C through 102-3G |

### 13.2 Dependency contracts delivered to later phases

| Consumer | Issue #102 delivers | Integration stop condition |
|---|---|---|
| Phase 4 | tenant-scoped contract source interface and entitlement resolver input | no independent entitlement/tenant schema; wait for 102-3D before real integration |
| Phase 5 | accepted-member/project resolver, entitlement lookup, immutable design-reference contract, payload validator | may use mocks; stop real DB/Auth integration until 102-3C/3D/3G pass |
| Phase 6 | tenant/entitlement reference and payload-safety interface | may build queue/adapters separately; stop provider integration until 102-3D/3G pass |
| Phase 7 | immutable history reference and customer-safe `反映 / 保留` classification boundary | Phase 7 owns detailed quality/state/read model; stop real integration until 102-3C/3D pass |
| Phase 8 | customer identity/project authorization and safe DTO boundary | no direct internal/raw table access; wait for Phase 7 read model and 102-3C |
| Phase 9 | operator identity/permission/audit command boundary | may build UI with fixtures; wait for 102-3E before real admin integration |
| Phase 10 (LP/public site) | Phase 3 tenant/classification boundary only where a public flow enters customer context | static/public content may proceed; real pricing/contract/registration paths wait for Phase 4, customer-screen claims/links wait for Phase 8, and the shared release gate remains cross-phase |

### 13.3 Later-phase Issue candidates

Create these under their own parent Issue, worktree, branch, and Draft PR, not as Issue
#102 children:

- Phase 4 contract/account/billing lifecycle and entitlement-source integration
- Phase 5 onboarding, setup draft, question finalization, and measurement-design
  integration
- Phase 6 queue, worker, provider call, retry, budget, and provider adapters
- Phase 7 analysis, quality decision, `反映 / 保留`, customer-safe AI answer, citation,
  and read model
- Phase 8 customer dashboard real-data connection
- Phase 9 operator/admin UI
- Phase 10 LP/public site: LP, service/feature introductions, pricing, FAQ, contact,
  legal pages, and service-start entry paths; real pricing/contract/registration
  integration depends on Phase 4, and customer-surface alignment depends on Phase 8

Per OWNER comment 5117068026, these may start in parallel behind interfaces, adapters,
fixtures, or mocks. They cannot redefine Issue #102 contracts or mix with this worktree.
Cross-phase integration and release verification is owned jointly by the affected phases
and is not assigned to Phase 10.

## 14. Stage 2 entry and current stop conditions

Issue #102 Stage 2 Phase 3 work starts only after:

- this revised design and Exec Plan receive Human review
- direct Phase 3 child scope, dependencies, and acceptance criteria are accepted
- live Supabase target and read/write boundary are confirmed
- each required migration/operation has its own R3 Execute approval

Later phases do not need to wait to begin separate mock/adapter/interface work, but their
real integration, Ready conversion, and merge stop at the dependency gates in Section
13.2.

This Stage 1 revision stops before any schema, migration, RLS, grant, Auth, API, DB,
provider, lifecycle, deletion, or product implementation; local DB reset; secret access;
PR Ready conversion; merge; deploy; Issue close; or branch/worktree deletion.

## 15. Stage 1 validation and residual risk

Stage 1 validates repository evidence and document integrity only. It does not validate:

- live schema/data/grant/policy drift or actual project organization mapping
- real JWT/session RLS and route behavior
- fresh local replay after an approved blocker fix
- runtime payload/provider behavior or DNS-rebinding exploitability
- business lifecycle integration in Phase 4
- setup/execution/analysis/dashboard/admin integration in Phases 5–9
- legal/contractual retention defaults

These are explicit Phase 3 or downstream inputs, not silent assumptions and not Stage 2
Execute authorization.

## 16. Phase 3 integration evidence (Issue #117 / 102-3H)

OWNER Human review comment `5133496218` supersedes the first 3H conclusion:
customer RLS could bypass the service-role lifecycle resolver, which is a Phase
3 blocking defect. The correction is the additive migration
`20260730163156_recora_authoritative_lifecycle_rls_access.sql`.

It centralizes lifecycle selection in
`recora_private.resolve_data_lifecycle_access(uuid, uuid)`. The public 3F
resolver and customer RLS helpers use the same selection: exact project state
wins over organization fallback; only `active` allows customer access and new
measurement; invalid, missing, and ambiguous selection fails closed. To preserve
existing organization compatibility, the migration adds an organization-level
`active` lifecycle row only where an organization already exists and lacks one.
It does not infer tenant ownership, create a fake operator/service actor, or
create audit/lifecycle events. New scopes require an explicit lifecycle row.

On the Issue #117-only local database, migration-only and seeded replay; updated
3C; all 3A–3G contracts; expanded lifecycle/RLS matrix; public/private table,
view, sequence, policy, function, and security-definer inventory; exact PR #71
ten-area classification fixture; and 3C–3H catalog/type drift matrix passed
with machine `status: ok`. The matrix directly proves active customer access;
all six non-active states, missing state, and deliberate ambiguity deny
Data API/RLS direct, slug, list, search, count, pagination, JOIN, and RLS-helper
RPC paths; active recovery works; project precedence matches RLS; and anon
demo/local is denied for non-active or missing lifecycle.

The fixture preserves answer body/excerpt and citation/source as customer-safe
candidates for the exact ten PR #71 areas, while rejecting raw provider envelope,
internal metadata/error, retry/control, cost, audit, operator note, billing, and
other-tenant keys. Full catalog inventory enforces RLS, no browser writes or
sequence use, private-relation isolation, function signature allowlists, no
default PUBLIC execute, fixed `search_path` for every security definer, and
service-role-only privileged RPCs.

No generated DB-type canonical file exists. The local CLI requests a Platform
token even for `gen types --local`; no token, `.env`, remote/linked/production
DB, provider, fetch, DNS, DB push, analytics container, or actual deletion was
used. The local catalog matrix is the type-drift authority; TypeScript checking
is supplementary. A production application still requires a live lifecycle
source inventory before the deterministic bootstrap is acceptable. Any rollback
must be a separately approved forward migration that updates resolver and RLS
together and leaves bootstrap rows intact rather than deleting data.

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

Issue #102 remains OPEN. It may be considered for close only after PR #118 has
Human review and an explicitly approved merge, the merged master repeats the
accepted Phase 3 evidence, and downstream/release owners accept the documented
interfaces and residual risks. PR #118 remains Draft; no Ready conversion,
merge, or Issue close is authorized by this evidence.
