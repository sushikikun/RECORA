# Recora Measurement Design Canonical Data Model v1

Status: **Stage 1 formal target / docs-only**
Issue: **#136**
Last updated: **2026-08-04**
Implementation status: **Not implemented**
Production / remote DB authorization: **None**

## 0. Position and authority

This document defines the new canonical data model for Recora measurement design.
It covers persona, topic, Intent Cell, prompt, panel, execution configuration,
measurement-time snapshots, lifecycle, legacy import, and cutover boundaries.

Authority order for this domain:

1. the latest OWNER decision recorded in Issue #136;
2. this document after Human review;
3. `docs/recora-prompt-measurement-contract-v1.md` in PR #133;
4. `docs/recora-data-tenant-security-privacy.md`;
5. `docs/recora-post-launch-operations-architecture.md`;
6. the adopted Recora Admin P0 state, read-model, authorization/audit, and measurement-management specifications;
7. PR #135 TypeScript target contracts;
8. current `master` implementation as legacy inventory only.

Where this document is more specific about physical responsibility, version
boundaries, or legacy isolation, it is the target authority for the measurement-design
data model. It does not authorize implementation.

---

## 1. Owner decision: build the canonical model from product requirements

The canonical measurement-design model is **not** an extension of the current
`public.personas`, `public.topics`, `public.prompts`, or legacy measurement hierarchy.

The formal direction is:

```text
Current product requirements
  → new canonical model
  → new canonical runtime
  → explicit one-way legacy import where justified
```

The direction is not:

```text
Legacy tables
  → add enough columns
  → treat the legacy rows as the new canonical model
```

### 1.1 Legacy role

Legacy structures may be used only for:

- read-only inventory;
- historical evidence preservation;
- explicit import-candidate discovery;
- compatibility reads during cutover;
- regression comparison;
- proving that no customer history is lost.

Legacy structures must not:

- determine the canonical entity model;
- remain the long-term writer for the new domain;
- receive new canonical meaning through metadata fallbacks;
- become the parent of canonical foreign keys;
- change the meaning of canonical history when a legacy row changes;
- be silently promoted through prompt-text inference.

### 1.2 Physical environment

This decision does not require a second Supabase project.
The default target is one Supabase project with logical separation:

```text
canonical schemas and tables
legacy public structures retained during migration
```

The canonical and legacy domains are logically independent even when they share the
same PostgreSQL instance.

---

## 2. Product invariants

The data model must make the following statements mechanically true.

1. `organization` remains the tenant root.
2. Every project-scoped canonical root is owned by one organization and one project.
3. A measurement design is versioned and reproducible.
4. Persona, topic, Intent Cell, and prompt continuity are distinguishable from their immutable revisions.
5. A semantic prompt panel is independent from the provider/model execution matrix.
6. One active Core Intent Cell contributes one canonical Core prompt to the headline denominator for a measurement context.
7. Robustness variants do not create independent headline intent weight.
8. Branded, named-comparison, competitor-only, criteria-only, and forced-citation prompts cannot enter market metrics incorrectly.
9. A production measurement uses one immutable measurement-design version.
10. Every intended observation and every retry can be distinguished.
11. Historical measurement references continue to resolve to the same design, entitlement, prompt, execution, and policy meaning.
12. A new design can be activated without mutating the previous design.
13. Customer browsers never read canonical control, raw measurement, or audit tables directly.
14. Legacy data cannot become canonical without an explicit import decision and lineage.
15. Rollback creates or activates a successor-compatible version; it does not erase canonical history.

---

## 3. Domain architecture

### 3.1 High-level hierarchy

```text
Organization
└─ Project
   └─ Measurement Design                         stable aggregate identity
      ├─ Measurement Design Versions            immutable finalized configurations
      │  ├─ Persona Revision Memberships
      │  ├─ Topic Revision Memberships
      │  ├─ Intent Cell Revision Memberships
      │  ├─ Prompt Set Version
      │  ├─ Execution Profile Set Version
      │  ├─ Panel Profile Version
      │  ├─ Measurement Policy Bundle Version
      │  ├─ Entitlement Snapshot
      │  ├─ Analysis Target / Brand Identity Versions
      │  └─ Validation and compilation evidence
      └─ Current Version Pointer

Measurement Cycle
└─ Measurement Item                             one planned observation
   ├─ Contract Snapshot                         exact design/prompt/execution state
   └─ Measurement Attempts                      initial call and recovery retries
      └─ Provider evidence and answer observations
```

### 3.2 Aggregate root

`measurement_design` is the stable aggregate root for one project measurement scope.
A project may have more than one design when the scopes are intentionally distinct,
for example separate languages, regions, brands, products, or formal measurement
programs.

The stable design identity is not the active configuration. The active configuration
is selected by a current-version pointer.

### 3.3 Design key

Each design must have a stable `design_key` unique within a project. The key is an
opaque product identifier, not a mutable display name. The version records the actual
scope fields.

Example conceptual scope:

```yaml
design_key: primary-ja-jp
analysis_target_version_id: ...
brand_identity_version_id: ...
locale: ja-JP
region_scope: JP
```

Changing only a display label does not require a new design identity. Changing the
semantic measurement scope may require a new design identity rather than another
revision of the old design.

---

## 4. Schema responsibility

The accepted post-launch schema architecture remains in force.

| Schema | Measurement-design responsibility |
|---|---|
| `control` | canonical design identities, immutable revisions, panel compilation, execution configuration, lifecycle pointers, validation facts |
| `measurement` | planned observation snapshots, attempts, provider request/response evidence, parsed observations, errors, usage and cost |
| `audit` | operator commands, activation/supersession decisions, exception decisions, import and cutover evidence |
| `publication` | immutable published-version references to canonical design and measurement identities |
| `api` | customer-safe and admin-safe read models; never the canonical writer |

No new schema is required at Stage 1. A future implementation may propose a dedicated
schema only through a separate architecture decision and approval.

### 4.1 Canonical write boundary

Canonical writes occur through server-side commands, workers, or approved migration
tooling. Customer browsers do not write canonical design rows directly.

### 4.2 Read-model boundary

Admin and customer UI states are projections. They do not become independent saved
sources of truth. The exception queue is derived from validation findings, lifecycle,
and audit decisions.

---

## 5. Version-boundary decision

The canonical model separates four concerns that were previously easy to conflate.

```text
Semantic design
Prompt panel
Execution matrix
Measurement/aggregation policies
```

### 5.1 Measurement-design version

A `measurement_design_version` binds the complete configuration used to authorize and
interpret a production measurement:

- analysis target and brand identity versions;
- persona, topic, and Intent Cell revision sets;
- prompt-set version;
- execution-profile-set version;
- panel-profile version;
- measurement-policy-bundle version;
- entitlement snapshot;
- contract/schema versions;
- validation and compilation evidence.

Once finalized, the version is immutable.

### 5.2 Prompt-set version

A `prompt_set_version` is the immutable semantic panel:

- exact prompt revisions;
- Intent Cell revision mapping;
- panel roles;
- variant roles;
- sort order;
- approved business weight;
- inclusion reason.

It does **not** own one provider/model execution profile.

### 5.3 Execution-profile-set version

An `execution_profile_set_version` is the immutable provider/model matrix used with the
panel. It supports multiple AI models and surfaces in one measurement design.

It contains memberships to immutable single execution profiles.

### 5.4 Policy-bundle version

A `measurement_policy_bundle_version` binds the versioned policies used to interpret
results:

- metric definitions;
- valid-response policy;
- aggregation policy;
- repeat policy;
- completeness/publication compatibility policy where applicable.

### 5.5 Consequence for PR #133 and PR #135

The singular `execution_profile_id` currently shown on `prompt_set_version` is too
narrow for Recora's multi-model measurement product.

The target amendment is:

```text
measurement_design_version
  ├─ prompt_set_version_id
  ├─ execution_profile_set_version_id
  └─ measurement_policy_bundle_version_id
```

A provider/model matrix change creates a new measurement-design version and a new
execution-profile-set version. It does not require a new prompt-set version when the
semantic panel is unchanged.

An aggregation-policy-only change similarly creates a new measurement-design version
and policy-bundle version. It does not rewrite the prompt panel.

This amendment must be reflected in PR #133 and PR #135 before Stage 2 execution or in
an explicitly approved successor contract PR.

---

## 6. Canonical entity model

The names below are recommended physical targets. Stage 2 may refine pluralization or
implementation details without changing the entity responsibilities.

## 6.1 Measurement design aggregate

### `control.measurement_designs`

Stable identity for a project measurement program.

Minimum fields:

```text
id
organization_id
project_id
design_key
display_name
lifecycle_status
created_at
created_by_actor_type
created_by_actor_id
```

Constraints:

- unique `(organization_id, project_id, design_key)`;
- composite FK to `(project_id, organization_id)`;
- no FK to a legacy table;
- display name is not an identity key.

### `control.measurement_design_versions`

Immutable finalized configuration.

Minimum fields:

```text
id
organization_id
project_id
measurement_design_id
version_number
status
contract_version
analysis_target_version_id
brand_identity_version_id
entitlement_snapshot_id
prompt_set_version_id
execution_profile_set_version_id
panel_profile_version_id
measurement_policy_bundle_version_id
source_evidence_bundle_id
content_hash
supersedes_measurement_design_version_id
rollback_of_measurement_design_version_id
created_at
validated_at
ready_at
activated_at
superseded_at
retired_at
```

Rules:

- unique `(measurement_design_id, version_number)`;
- finalized content hash is immutable;
- active version requires all mandatory references;
- active version requires no blocking validation finding;
- historical entitlement snapshot cannot be replaced;
- source evidence reference is immutable after finalization.

### `control.measurement_design_current_versions`

Mutable pointer only.

```text
organization_id
project_id
measurement_design_id
current_measurement_design_version_id
row_version
updated_at
```

The pointer switch, previous-version supersession, and audit event occur in one
transaction.

The pointer never selects a draft, invalid, or cross-project version.

---

## 6.2 Persona identity and revision

### `control.persona_identities`

Stable continuity identity for one decision-role concept within a measurement design.

### `control.persona_revisions`

Immutable definition containing, at minimum:

- decision role;
- role in purchase/use/evaluation/approval;
- practical vocabulary;
- jobs, pains, triggers and switching forces;
- comparison axes;
- proof and trust requirements;
- industry/business-model fit;
- evidence source status;
- confidence;
- risk flags;
- content hash;
- revision number and supersession relation.

### `control.measurement_design_version_personas`

Binds exact persona revisions to a design version.

A revision may be reused by a successor design version if its meaning and content are
unchanged. A new revision is created only when a measurement-affecting definition
changes.

A new persona identity is required when semantic continuity no longer holds.

---

## 6.3 Topic identity and revision

### `control.topic_identities`

Stable identity for one diagnostic topic.

### `control.topic_revisions`

Immutable definition containing:

- topic name and type;
- diagnosis goal;
- expected signal types;
- target metrics;
- intended persona and buyer-stage coverage;
- minimum coverage requirement;
- risk/bias notes;
- evidence source and confidence;
- content hash and supersession.

### `control.measurement_design_version_topics`

Binds exact topic revisions to a design version.

Topic revisions do not force every prompt under the topic to share one buyer stage or
one expected signal.

---

## 6.4 Intent Cell identity and revision

### `control.intent_cell_identities`

Stable semantic measurement identity.

The identity continues only while the underlying buyer need remains comparable.

### `control.intent_cell_revisions`

Immutable semantic definition containing:

```text
id
organization_id
project_id
intent_cell_id
revision_number
persona_revision_id
primary_topic_revision_id
buyer_stage
locale
region_scope
intent_summary
expected_signal_types
business_priority
tracking_scope
improvement_scope
status
content_hash
supersedes_intent_cell_revision_id
```

### `control.intent_cell_revision_topics`

Many-to-many secondary-topic mapping.

### `control.measurement_design_version_intent_cells`

Binds exact Intent Cell revisions to a design version.

Rules:

- persona/topic references must belong to the same organization, project and design scope;
- a semantic change that breaks trend continuity creates a new Intent Cell identity;
- a wording or non-semantic metadata change may create a new revision of the same identity;
- `tracking_scope` and `improvement_scope` remain independent.

---

## 6.5 Prompt identity, revision and metric eligibility

### `control.prompt_identities`

Stable prompt-series identity under one Intent Cell identity.

A prompt identity is not reused across unrelated Intent Cells.

### `control.prompt_revisions`

Immutable measurement-affecting prompt version.

Minimum fields:

```text
id
organization_id
project_id
prompt_id
revision_number
intent_cell_revision_id
prompt_text
prompt_text_hash
brand_scope
question_family
question_act
response_shape
language_mode
buyer_stage
temporal_class
variant_role
competitor_seed_policy
candidate_mention_opportunity
ranking_opportunity
expected_signals
source_status
seed_contamination_risk
confidence_score
quality_score
quality_score_version
risk_flags
status
content_hash
supersedes_prompt_revision_id
effective_from
effective_to
```

A new revision is mandatory when any interpretation or aggregation-affecting value
changes.

### `control.prompt_revision_metric_eligibilities`

Normalized immutable rows, one per prompt revision and metric key.

```text
prompt_revision_id
metric_key
eligibility_state
eligibility_policy_version
reason_codes
content_hash
```

Metric keys include:

- visibility;
- ranking;
- SOV;
- sentiment;
- brand perception;
- natural citation observation;
- forced citation validation;
- risk check;
- recommendation input.

The eligibility map is authoritative. A single `measurement_purpose` is not.

### Identity-context validation

Activation requires explicit target-brand and known-competitor identity context.
Text/metadata conflicts create blocking findings or manual-review exceptions.

Text inference may propose a candidate classification but cannot grant official
eligibility.

---

## 6.6 Prompt set and membership

### `control.prompt_sets`

Stable panel identity under a measurement design.

### `control.prompt_set_versions`

Immutable compiled semantic panel.

Minimum fields:

```text
id
organization_id
project_id
prompt_set_id
version_number
status
panel_profile_version_id
compiler_version
semantic_clusterer_version
content_hash
supersedes_prompt_set_version_id
created_at
validated_at
frozen_at
```

### `control.prompt_set_memberships`

```text
id
organization_id
project_id
prompt_set_version_id
prompt_revision_id
intent_cell_revision_id
panel_role
variant_role
sort_order
business_weight
inclusion_reason
compilation_decision_id
```

Database-enforceable constraints:

- unique membership ID and sort order inside the set version;
- one prompt revision appears at most once in one set version;
- prompt revision and Intent Cell revision must match through a composite FK;
- partial unique index for one `core + canonical` membership per Intent Cell revision per set version;
- all rows belong to the same organization and project.

Finalization-validator constraints:

- every Robustness Intent Cell has a Core canonical membership;
- profile counts and minimum coverage are satisfied;
- no unresolved semantic duplicate overweights one Intent Cell;
- topic/persona/buyer-stage coverage satisfies the selected profile;
- all selected revisions are active and compatible;
- market-metric contamination checks pass.

Discovery, Seasonal and Event memberships are outside the base profile total unless the
profile version explicitly says otherwise.

---

## 6.7 Execution profiles and multi-model profile sets

### `control.execution_profiles`

One immutable provider/model/surface execution context.

Minimum fields:

```text
id
organization_id
project_id
provider
surface
requested_model
model_version_policy
system_prompt_version
execution_template_version
web_search_mode
search_activation_policy
live_or_cached
locale
region
domain_filters
search_budget
account_or_session_condition
provider_configuration_schema_version
content_hash
status
```

Secrets and credentials are not stored in the profile. Secret resolution is an
external server capability.

### `control.execution_profile_sets`

Stable identity for one provider/model matrix.

### `control.execution_profile_set_versions`

Immutable matrix version.

```text
id
organization_id
project_id
execution_profile_set_id
version_number
status
content_hash
supersedes_execution_profile_set_version_id
created_at
frozen_at
```

### `control.execution_profile_set_memberships`

```text
execution_profile_set_version_id
execution_profile_id
sort_order
required_for_formal_measurement
required_for_publication_coverage
planned_observation_weight
membership_reason
```

Changing provider, model, surface, search configuration, locale, region, or membership
creates a new execution-profile-set version and measurement-design version.

It does not create a new prompt-set version when the semantic panel is unchanged.

---

## 6.8 Panel profiles and measurement policy bundles

### `control.panel_profile_versions`

Versioned profile definition rather than a permanent enum.

It records:

- profile key;
- target Core, Robustness and Diagnostic counts;
- overlay rules;
- minimum topic/persona/stage coverage;
- experimental flag;
- evaluation method and decision record;
- content hash.

The initial 50 / 100 / 200 definitions remain experimental.

### System policy artifacts

System-owned immutable artifacts define:

- metric-definition versions;
- valid-response-policy versions;
- aggregation-policy versions;
- repeat-policy versions;
- compatibility-policy versions.

### `control.measurement_policy_bundle_versions`

Binds exact policy versions into one hashable contract.

A design version references the bundle. A policy change creates a new bundle and a new
measurement-design version.

The bundle does not mutate historical results.

---

## 6.9 Validation, compilation and exception evidence

### `control.design_validation_runs`

Append-only record of validation execution.

### `control.design_validation_findings`

Append-only typed findings with:

- entity type and ID;
- validator and policy version;
- severity;
- stable reason code;
- evidence reference;
- created time;
- resolved/superseded relation.

### `control.prompt_set_compilation_runs`

Append-only compilation evidence containing:

- source measurement-design version;
- candidate-pool identity and count;
- compiler and semantic-clusterer versions;
- target panel profile;
- result hash;
- status and timestamps.

### `control.prompt_set_compilation_decisions`

One row per candidate decision:

- included/excluded/exception;
- target Intent Cell;
- assigned panel/variant role;
- reason codes;
- coverage effect;
- selected prompt revision.

Human review does not directly edit an active panel. A review decision produces new
validation/decision evidence and, when necessary, a successor design or set version.

The admin exception queue is derived from unresolved blocking/warning findings and
audit decisions.

---

## 7. Lifecycle and immutable pointers

## 7.1 Measurement-design version lifecycle

Target states:

```text
draft
→ validating
→ ready
→ active
→ superseded or retired

validating → rejected
ready → held
held → validating
```

Rules:

- `draft` may be edited through controlled builders;
- `validating` does not accept arbitrary mutation;
- `ready` is complete and immutable;
- `active` is selected by the current pointer and immutable;
- `superseded`, `retired`, and `rejected` are historical terminal interpretations;
- corrections create a successor version.

## 7.2 Component lifecycle

Persona, topic, Intent Cell, prompt, prompt-set and execution-profile-set revisions are
immutable once validated/frozen. Their active use is determined through the active
measurement-design version.

A separate `active` flag on every child must not become a conflicting second authority.

## 7.3 Activation transaction

Activation must perform, atomically:

1. lock current pointer and target design version;
2. verify tenant/project ownership;
3. verify entitlement and lifecycle allow activation;
4. verify all referenced component revisions and hashes;
5. verify no blocking validation finding remains;
6. verify profile counts and execution matrix;
7. mark target version active;
8. supersede prior active version when present;
9. switch current pointer with optimistic row version;
10. append audit event.

Failure leaves the previous active pointer unchanged.

## 7.4 Rollback and recovery

Rollback does not mutate or delete the failed active version.

The preferred recovery is a successor design version that reuses the prior known-good
immutable components and records:

```text
rollback_of_measurement_design_version_id
supersedes_measurement_design_version_id
reason and audit event
```

This preserves monotonic history and avoids reactivating an ambiguous superseded state.

---

## 8. Database constraints versus finalization validation

## 8.1 Database-enforced

PostgreSQL should enforce:

- not-null canonical IDs and version references;
- organization/project composite ownership;
- candidate keys and composite FKs;
- version-number uniqueness;
- content-hash presence;
- immutable/finalized-row update rejection;
- one current pointer per design;
- one Core canonical membership per Intent Cell revision per set version;
- no duplicate prompt membership;
- no duplicate execution-profile membership;
- append-only validation, compilation, import and audit evidence;
- browser grants revoked from canonical private schemas;
- RLS on any exposed tenant projection.

## 8.2 Finalization-validator enforced

Application/transaction validators should enforce facts that require set-wide or
semantic evaluation:

- semantic clustering and duplicate intent review;
- target-brand and competitor-text contamination;
- response-shape and metric-eligibility consistency;
- Robustness-to-Core coverage;
- exact profile counts and coverage matrix;
- persona/topic/stage distribution;
- model/surface compatibility;
- regulated-risk safety;
- major Core-panel change classification;
- compatibility with the previous design version.

The finalization validator runs under a versioned policy and saves its findings.

---

## 9. Measurement-runtime handoff

This document does not replace the adopted Admin P0 measurement-management model.
It provides the design references that the runtime must consume.

### 9.1 Canonical logical item grain

One formal `measurement_item` represents:

```text
one prompt-set membership
× one execution-profile-set membership
× one planned observation ordinal
```

This distinguishes an intended repeated observation from a retry.

### 9.2 Retry versus statistical repeat

- `planned_observation_ordinal` is created by the repeat policy and contributes to the intended denominator;
- `measurement_attempt` is an execution attempt for one logical item;
- provider timeout/retry creates another attempt for the same item;
- a cycle revision selects at most one accepted attempt for each logical item;
- failed attempts remain append-only evidence.

### 9.3 Required item references

A formal measurement item must reference:

```text
organization_id
project_id
measurement_cycle_id
measurement_design_version_id
prompt_set_version_id
prompt_set_membership_id
prompt_revision_id
intent_cell_revision_id
execution_profile_set_version_id
execution_profile_set_membership_id
execution_profile_id
measurement_policy_bundle_version_id
entitlement_snapshot_id
planned_observation_ordinal
```

The runtime must reject cross-tenant or mixed-version combinations.

### 9.4 Additional validation

Additional-validation cycles may use existing active prompt and execution identities but
remain outside formal publication and headline metric promotion unless a separately
approved successor design/set version is activated.

---

## 10. Measurement-time snapshot contract

Canonical control rows are immutable, but every formal item also stores an execution
snapshot. This protects reproducibility across retention, parser changes, provider
changes, and future schema evolution.

### `measurement.measurement_item_contract_snapshots`

Minimum content:

```text
organization_id
project_id
measurement_item_id
snapshot_schema_version
measurement_design_version_id and hash
prompt_set_version_id and hash
prompt_set_membership_id
prompt_id
prompt_revision_id
prompt_text
prompt_text_hash
intent_cell_id
intent_cell_revision_id
panel_role
variant_role
brand_scope
question_family
question_act
response_shape
language_mode
buyer_stage
temporal_class
eligibility_snapshot
execution_profile_set_version_id and hash
execution_profile_id and hash
policy_bundle_version_id and hash
entitlement_snapshot_id and schema version
created_at
snapshot_hash
```

Indexed scalar fields support safe queries. A canonical versioned JSON contract may
preserve the complete snapshot when its schema and hash are validated.

### `measurement.measurement_item_metric_eligibility_snapshots`

Optional normalized child rows preserve metric-by-metric eligibility for query and
audit without interpreting current control rows.

### Attempt evidence

Each attempt records:

- requested and actual provider/model;
- live/cache/search activation outcome;
- account/session condition category;
- attempt number and idempotency key;
- provider request/response references;
- timing, usage, cost and stable failure code;
- observation timestamp.

An actual provider/model mismatch does not rewrite the execution profile. It is recorded
as execution evidence and affects compatibility/quality decisions.

---

## 11. Aggregation and comparability references

Aggregation occurs in this order:

```text
accepted attempt
→ planned observation item
→ prompt revision
→ Intent Cell revision
→ topic/persona/buyer-stage segments
→ overall metric
```

Robustness variants are aggregated within or beside their Intent Cell. They are not
independent headline intents.

### Compatibility assessment

A previous-period comparison requires an append-only or reproducible compatibility
assessment between design versions.

Compatibility factors include:

- semantic panel membership;
- execution-profile set;
- provider/model versions;
- policy bundle;
- panel profile;
- locale/region;
- target/brand identity;
- valid-response coverage.

The customer UI must suppress a simple previous-period delta when the assessment says
not comparable.

A future implementation may persist `measurement_design_version_compatibility`
assessments or derive them from immutable hashes and policy rules. The authority must be
versioned and auditable.

---

## 12. Tenant security, authorization and privacy

The Phase 3 tenant/security foundation is consumed without redefinition.

### 12.1 Tenant keys

Every tenant-owned root stores `organization_id`. Project-scoped roots also store
`project_id` and reference `(project_id, organization_id)`.

Leaf ownership may derive through a mandatory, indexed, composite-FK-enforced chain.
High-risk membership and execution tables should carry tenant keys explicitly where it
materially strengthens integrity and query safety.

### 12.2 Customer access

Customer browsers receive only `api` projections or `publication` projections approved
for customer display.

They never directly access:

- control design definitions;
- raw validation findings;
- compilation internals;
- measurement attempts;
- provider envelopes;
- import lineage;
- operator/audit data.

### 12.3 Operator access

Operator commands require verified operator identity, capability, tenant/project scope,
reason, idempotency, expected row version, and audit evidence.

The service role is an execution capability, not actor identity.

### 12.4 External AI payload

Only the validated provider-safe payload may include the prompt text and approved public
analysis-target data. It does not include tenant IDs, entitlement documents, billing,
audit, internal notes, secrets, or legacy import evidence.

---

## 13. Publication and read-model handoff

A publication records immutable references to at least:

```text
measurement_design_version_id
prompt_set_version_id
execution_profile_set_version_id
measurement_policy_bundle_version_id
source measurement cycle/revision
metric definition version
```

Customer-facing published prompt results use the measurement-time snapshot or a safe
published projection, not live joins to mutable control or legacy rows.

Admin read models expose:

- current design version;
- next-version candidate and validation status;
- panel composition and coverage;
- execution-profile matrix;
- unresolved exceptions;
- revision diffs and compatibility;
- cutover/import evidence where authorized.

They do not allow direct editing of frozen rows.

---

## 14. Legacy boundary

## 14.1 No canonical dependency on legacy

Canonical tables must not have formal foreign keys to current legacy persona, topic,
prompt, run, conversation, metric or recommendation tables.

Import lineage stores legacy source identifiers as opaque source references and hashes.
A missing or later-mutated legacy row cannot invalidate canonical history.

## 14.2 Import classifications

Every legacy candidate receives exactly one decision:

| Decision | Meaning |
|---|---|
| `explicit_import` | sufficient explicit evidence exists to create canonical rows |
| `review_required` | candidate may be useful but needs human or stronger evidence |
| `historical_only` | preserve old result/history without canonical semantic promotion |
| `compatibility_read_only` | temporary read path only during cutover |
| `do_not_import` | invalid, unsafe, duplicate, sample/demo, or no longer relevant |

### Import evidence

An import decision records:

```text
import_batch_id
source_system
source_table
source_primary_key
source_content_hash
source_snapshot_time
decision
reason_codes
evidence_reference
target_canonical_ids
reviewed_by / reviewed_at when required
importer_version
created_at
```

The mapping is append-only.

## 14.3 Legacy category fields

Legacy `prompt_type`, `measurement_purpose`, mixed categories, and inferred scope are
migration hints only. They do not grant canonical eligibility.

## 14.4 Historical results

Legacy measurement results remain labeled with their historical measurement definition.
They are not recalculated as if the new Intent Cell, panel, valid-response, or SOV
contract had always existed.

A crosswalk may support historical display, but the UI must not imply metric continuity
without a compatibility assessment.

---

## 15. Cutover strategy

The target is one-way cutover, not permanent dual write.

### Stage C0: Canonical foundation

- create new schemas/tables, constraints and RLS locally;
- no legacy mutation;
- no production writer switch.

### Stage C1: Canonical fixture and replay validation

- build complete canonical fixtures;
- compile 50/100/200 experimental panels;
- execute local/test measurement snapshots;
- prove tenant and history invariants.

### Stage C2: Read-only legacy inventory and import decisions

- snapshot legacy candidate rows;
- classify each candidate;
- import only `explicit_import` rows;
- preserve source hashes and lineage.

### Stage C3: Shadow operation

- generate canonical design and panel in parallel;
- compare counts, coverage, eligibility and expected runtime items;
- do not publish canonical results as equivalent to legacy results automatically.

### Stage C4: Canonical-only writer

- stop creating new canonical meaning in legacy tables;
- route design creation, activation and formal measurement items through canonical APIs;
- short-lived one-way compatibility replication is allowed only when separately approved and reconciled.

### Stage C5: Read-model cutover

- admin reads canonical control/read models;
- customer reads publication projections generated from canonical measurement;
- previous safe publication remains available if cutover fails.

### Stage C6: Legacy freeze and retirement

- freeze legacy writers;
- monitor compatibility reads;
- archive historical tables according to retention policy;
- remove legacy paths only after zero-use evidence, rollback readiness and separate approval.

---

## 16. Rollback and recovery

Rollback boundaries differ by phase.

### Before canonical writer cutover

- stop the new migration/workflow;
- preserve canonical test/import evidence;
- legacy production behavior remains unchanged.

### After canonical writer cutover but before read cutover

- stop new canonical commands;
- retain canonical rows and audit evidence;
- restore the approved previous writer path only through a separately authorized recovery command;
- do not delete imported canonical history.

### After read-model cutover

- keep or restore the previous safe publication pointer;
- do not expose raw legacy or canonical measurement tables;
- investigate and create a successor canonical design/version;
- record recovery in audit.

No rollback rewrites imported lineage, historical attempts, or published versions.

---

## 17. Legacy inventory map

This inventory is intentionally after the canonical model.

| Legacy area | Stage 1 treatment |
|---|---|
| `public.personas` | candidate source only; explicit revision evidence required |
| `public.topics` | candidate source only; mixed semantics require review |
| `public.prompts` | prompt-text/history source; no direct canonical authority |
| `prompt_type` / `measurement_purpose` | compatibility hints only |
| setup-draft persona/topic/prompt objects | generation evidence; not finalized canonical design |
| legacy measurement runs/items | historical evidence and shadow comparison |
| AI conversations/provider responses | historical measurement evidence under legacy definitions |
| metric snapshots | historical output; no silent new-definition recalculation |
| existing customer dashboard joins | compatibility read path until publication/read-model cutover |

The Stage 2 inventory must classify actual rows without assigning ambiguous records to
a demo tenant or inferring official metric eligibility from text.

---

## 18. Implementation waves

Stage 2 and later require separate R2/R3 Execute approvals.

### Wave 1: Canonical identity and version foundation

Scope:

- design/persona/topic/Intent Cell/prompt identities and revisions;
- metric eligibility;
- prompt sets and immutable memberships;
- panel profile and policy-bundle references;
- tenant/composite constraints;
- validation fixtures and local replay.

Exit:

- no runtime cutover;
- complete local security and immutability tests;
- PR merged before Wave 2 integration.

### Wave 2: Execution matrix and snapshot foundation

Scope:

- execution profiles and profile-set versions;
- measurement-design finalization/activation;
- measurement item reference contract;
- execution contract snapshots;
- attempt/repeat distinction;
- Admin measurement-management integration contract.

Exit:

- local/test full measurement cycle succeeds;
- historical snapshot reproducibility proven;
- no production writer switch.

### Wave 3: Legacy import audit and controlled cutover

Scope:

- import batch/item/decision evidence;
- read-only production inventory under separate approval;
- explicit import and shadow validation;
- canonical-only writer switch;
- admin/customer read-model integration;
- legacy freeze/retirement conditions.

Production inventory, import, backfill, writer switch, and read cutover are distinct R3
approvals. A Wave 3 implementation PR does not authorize production execution.

---

## 19. Validation matrix

The implementation must eventually prove at least:

### Identity and version

- duplicate version numbers fail;
- finalized rows cannot be updated/deleted;
- successor revisions preserve prior hashes;
- cross-project component references fail;
- current pointer cannot select invalid or cross-tenant versions.

### Panel

- one Core canonical per Intent Cell revision;
- duplicate membership fails;
- Robustness without Core fails finalization;
- incorrect profile counts fail;
- branded/competitor/forced-citation contamination fails market eligibility;
- paraphrases do not multiply headline intent weight.

### Execution

- multiple models exist in one execution-profile-set version;
- changing the execution matrix leaves the prompt-set version unchanged when semantics are unchanged;
- planned observations and retries are distinguishable;
- every item has an immutable contract snapshot;
- actual provider/model variance is recorded, not used to rewrite the profile.

### Tenant and privacy

- customer A cannot read or reference customer B's design, components, snapshots or attempts;
- browser roles cannot write control/measurement/audit tables;
- provider-safe payload omits tenant, entitlement, billing, audit and legacy evidence.

### Legacy and cutover

- canonical rows have no FK dependency on legacy;
- source hash mutation does not change imported canonical meaning;
- ambiguous rows remain unimported;
- legacy history is not recalculated under new definitions;
- failed cutover retains the previous safe publication.

---

## 20. Open decisions

The following remain for approved implementation planning or experiment policy:

- exact physical table names and schema DDL;
- whether some system policy artifacts use tables or signed repository manifests;
- analysis-target and brand-identity version contracts owned by their source domain;
- exact major-Core-change threshold;
- semantic-clustering implementation and evaluation corpus;
- final 50/100/200 profile adoption;
- provider/model repeat policy;
- final SOV and demand-weighting definitions;
- production shadow duration and cutover success threshold;
- legacy retention period and archive mechanism.

These open items do not weaken the canonical identity, immutability, tenant, and legacy
isolation decisions in this document.

---

## 21. Acceptance criteria for the canonical model

The canonical model is ready for Stage 2 planning only when:

1. the greenfield/legacy boundary is accepted;
2. PR #133 is amended for the measurement-design aggregate and execution-profile-set boundary;
3. PR #135 is amended or superseded so TypeScript matches this boundary;
4. entity grain and immutable revision rules are accepted;
5. DB constraints and finalization-validator constraints are separated;
6. the Admin measurement-item/attempt model consumes the canonical references without responsibility conflict;
7. tenant, entitlement, audit, publication and privacy contracts remain intact;
8. legacy import and cutover are one-way, explicit and rollback-aware;
9. implementation Waves and approval boundaries are accepted;
10. no migration, DB write, backfill or production cutover has been implied by Stage 1 approval.

---

## 22. Stage 1 result

This document defines the new target independently of the legacy table layout.

It intentionally leaves implementation, migration, production inventory, and cutover
for separately approved work. Existing production behavior remains unchanged until a
new canonical implementation is validated and explicitly activated.
