# Recora Prompt & Measurement Contract v1

Status: **Formal target contract / docs-only**
Last updated: **2026-08-04**
Authority: **Latest OWNER-approved Recora product direction**
Implementation status: **Not yet fully implemented**
Production / remote DB authorization: **None**

## 0. Position and authority

This document defines Recora's **Prompt and Measurement Design** domain contract.
It is not a standalone prompt database specification and it does not own the whole
measurement, analysis, publication, or UI architecture.

### 0.1 Position in the new Recora-wide structure

```text
1. User touchpoints and screen layer
   ├─ Public site
   ├─ Customer onboarding
   ├─ Customer-facing screens
   ├─ Administrator-facing screens
   └─ Published reports

2. Business and operations foundation layer
   ├─ Customer and project management
   ├─ Prompt and measurement design          ← this contract
   ├─ Measurement execution
   ├─ AI answer and citation analysis
   ├─ Quality and exception decisions
   ├─ Publication decision and report generation
   ├─ Operational control
   └─ Incident, audit, usage and cost operations

3. Shared platform and cross-cutting capabilities
   ├─ Authentication and authorization
   ├─ Tenant isolation
   ├─ Formal state management
   ├─ Evidence and audit
   ├─ Database platform
   ├─ AI/provider integration
   ├─ Job and queue infrastructure
   ├─ Notification
   └─ Security and observability
```

The domain receives approved business context from customer/project management and
onboarding. It produces an immutable, versioned `measurement_design_version` for
Measurement Execution.

It MUST NOT absorb:

- provider execution, retry, queue, or attempt selection;
- answer, mention, ranking, citation, or sentiment analysis;
- quality or publication decisions;
- customer report materialization;
- customer or administrator screen state;
- authentication, tenant ownership, entitlement, audit, or publication foundations.

### 0.2 Authority order

1. latest OWNER decision in the active Issue or approval record;
2. this document after Human review;
3. `docs/recora-measurement-design-canonical-data-model-v1.md` for the more specific
   canonical data-model boundary;
4. `docs/recora-data-tenant-security-privacy.md` for tenant, entitlement, privacy,
   authorization, and historical-reference foundations;
5. adopted Recora Admin P0 state, read-model, authorization/audit, and
   measurement-management specifications;
6. `docs/recora-post-launch-operations-architecture.md` for the accepted
   `control / measurement / publication / api / audit` separation;
7. current runtime and deployed database as legacy implementation facts only.

A conflict between target and current implementation is a migration gap. It MUST NOT be
silently resolved by inference.

### 0.3 Legacy boundary

The canonical model is designed from current product requirements. It is not an
extension of current `public.personas`, `public.topics`, `public.prompts`, or the legacy
measurement hierarchy.

```text
Product requirements
  → new canonical model
  → new canonical runtime
  → explicit one-way legacy import where justified
```

Legacy structures are limited to read-only inventory, historical evidence, explicit
import-candidate discovery, temporary compatibility reads, and regression comparison.
Canonical tables MUST NOT have formal foreign-key dependencies on legacy tables.

### 0.4 Superseded product rules

This contract supersedes:

- loose question lists as production measurement units;
- fixed 60/20/10/10 ratios for every project;
- 8 / 16 / 32 prompts as production panel sizes;
- branded prompts in visibility, ranking, or SOV;
- criteria-only prompts in visibility or ranking;
- one execution as a stable market conclusion;
- mutable prompt text or panel membership without versions;
- manual approval for every normal generated prompt;
- one semantic Prompt Set bound directly to one provider/model profile;
- designing the final model around legacy public tables.

The terms MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative.

---

## 1. Purpose and non-goals

Recora prompts are part of a versioned measurement design, not merely a question list.
The contract must identify:

1. buyer need, Persona, Topic, Intent Cell, buyer stage, locale, and region;
2. exact Prompt Revision and classification;
3. metric eligibility;
4. panel and variant roles;
5. semantic Prompt Set Version;
6. provider/model/surface Execution Profile Set Version;
7. Metric, Valid Response, Aggregation, Repeat, and Compatibility policies;
8. complete Measurement Design Version;
9. exact historical execution snapshot;
10. allowed downstream analysis, quality, publication, and recommendation use.

This contract does not permanently fix commercial 50 / 100 / 200 mapping, repeat count,
SOV formula, demand weighting, publication thresholds, provider retry implementation,
UI layout, or production legacy-import decisions.

---

## 2. Product invariants

1. `organization` remains the tenant root and `project` remains the project scope.
2. A production measurement consumes one immutable `measurement_design_version`.
3. Persona, Topic, Intent Cell, and Prompt identities are distinct from immutable revisions.
4. The semantic prompt panel is independent from the provider/model execution matrix.
5. A policy-only change does not rewrite the semantic panel.
6. One selected Core Intent Cell contributes one canonical Core Prompt Revision.
7. Robustness variants do not create independent headline weight.
8. Branded, named, competitor-only, criteria-only, and forced-citation prompts cannot
   enter market metrics incorrectly.
9. Candidate generation is distinct from formal panel compilation.
10. Planned observations are distinct from provider retry attempts.
11. Historical results resolve to the same design, prompt, execution, entitlement, and policy meaning.
12. Normal processing is automatic and people handle defined exceptions.
13. Customer browsers do not read canonical `control`, raw `measurement`, or `audit` data.
14. Legacy rows cannot become canonical through text inference alone.
15. Rollback preserves history and uses successor versions or the previous safe publication.

---

## 3. Canonical hierarchy

```text
Organization
└─ Project
   └─ Measurement Design                         stable aggregate identity
      ├─ Measurement Design Versions            immutable complete contracts
      │  ├─ Persona Revision Memberships
      │  ├─ Topic Revision Memberships
      │  ├─ Intent Cell Revision Memberships
      │  ├─ Prompt Set Version                  semantic panel
      │  ├─ Execution Profile Set Version       provider/model/surface matrix
      │  ├─ Panel Profile Version
      │  ├─ Measurement Policy Bundle Version
      │  ├─ Entitlement Snapshot
      │  ├─ Analysis Target / Brand Identity Versions
      │  └─ Validation and Compilation Evidence
      └─ Current Version Pointer

Measurement Cycle                               owned by Measurement Execution
└─ Measurement Item                            one planned observation
   ├─ Measurement Contract Snapshot
   └─ Measurement Attempts                     initial call and recovery retries
      └─ Provider evidence and answer observations
```

### 3.1 Measurement Design Version

A finalized version binds:

```yaml
measurement_design_id:
measurement_design_version_id:
version_number:
analysis_target_version_id:
brand_identity_version_id:
persona_revision_memberships: []
topic_revision_memberships: []
intent_cell_revision_memberships: []
prompt_set_version_id:
execution_profile_set_version_id:
panel_profile_version_id:
measurement_policy_bundle_version_id:
entitlement_snapshot_id:
source_evidence_bundle_id:
content_hash:
status:
supersedes_measurement_design_version_id:
activated_at:
```

A finalized or active version is immutable.

### 3.2 Persona, Topic, and Intent Cell

Persona represents a decision role and context. Topic represents a diagnostic area.
Intent Cell is the primary semantic measurement unit.

Each uses stable identity plus immutable revision. An Intent Cell Revision includes its
Persona Revision, primary and secondary Topic Revisions, buyer stage, locale, region,
semantic summary, expected signals, business priority, tracking scope, improvement scope,
status, lineage, and content hash.

The active Prompt Set Version includes at most one `core + canonical` Prompt Revision
per selected Intent Cell Revision.

### 3.3 Prompt Identity and Revision

`prompt_id` identifies continuity and `prompt_revision_id` identifies one immutable
measurement-affecting version.

A new revision is required when text, Intent Cell membership, brand scope, question
family/act, response shape, buyer stage, language mode, temporal class, eligibility,
risk, or any interpretation/aggregation-affecting value changes.

### 3.4 Prompt Set Version

A Prompt Set Version is the immutable semantic panel.

```yaml
prompt_set_id:
prompt_set_version_id:
version_number:
status:
panel_profile_version_id:
compiler_version:
semantic_clusterer_version:
content_hash:
supersedes_prompt_set_version_id:
validated_at:
frozen_at:
```

Membership contains Prompt Revision, Intent Cell Revision, panel role, variant role,
sort order, optional business weight, inclusion reason, and compilation decision.

A Prompt Set Version does not own one execution profile or policy bundle.

### 3.5 Execution Profile Set Version

An Execution Profile is one immutable provider/model/surface context. It includes
provider, surface, requested model, model-version policy, system and template versions,
search settings, live/cache mode, locale, region, domain filters, search budget,
session condition, provider configuration schema, content hash, and status.

An Execution Profile Set Version is the immutable multi-model matrix. Membership records
formal-measurement requirement, publication-coverage requirement, planned observation
weight, sort order, and reason.

Changing provider/model/surface configuration creates a new Execution Profile Set Version
and Measurement Design Version, but not a new Prompt Set Version when semantics are unchanged.

### 3.6 Measurement Policy Bundle Version

The bundle binds exact Metric Definition, Valid Response, Aggregation, Repeat, and
Compatibility policy versions. A policy change creates a new bundle and Measurement
Design Version. It does not rewrite the semantic panel or historical result.

---

## 4. Orthogonal prompt classification

The authoritative model separates:

- `brand_scope`: `brand_excluded`, `self_branded`, `named_comparison`,
  `competitor_only`, draft-only `brand_optional`;
- `question_family`: market/category discovery, problem-solution, alternative,
  competitor comparison, pricing/reputation, implementation/operation,
  citation/evidence, branded perception, local/regional, regulated risk;
- `question_act`: discover, shortlist, rank, compare, criteria, fit, reputation, risk,
  verify, sources, explain;
- `response_shape`: candidate list, ranked recommendation, comparative set,
  evaluation criteria, explanatory answer, evidence answer, branded sentiment answer;
- `language_mode`: natural, raw search-like, anxious, comparison shortcut,
  professional research;
- `buyer_stage`: awareness, exploration, comparison, validation, decision;
- `temporal_class`: evergreen, seasonal, event-bound, volatile dynamic.

Persona is represented by Persona Revision, not `persona_based` as a question family.
Buyer stage is authoritative at Prompt and Intent Cell Revision level, not inherited
blindly from Topic.

---

## 5. Panel roles and profiles

Allowed roles are Core, Discovery, Robustness, Diagnostic, Seasonal, and Event.

- Core defines the stable semantic denominator.
- Discovery identifies candidates but does not alter Core automatically.
- Robustness tests expression sensitivity inside the same Intent Cell and requires Core.
- Diagnostic covers branded, named, source-request, search-activation, order, evidence,
  provider, and surface tests outside default market headline metrics.
- Seasonal and Event are overlays unless explicitly included by a versioned profile.

The existing 8 / 16 / 32 modes are design previews only.
Initial production profiles remain experimental:

| Profile | Core | Robustness | Diagnostic | Total |
|---|---:|---:|---:|---:|
| 50 | 38 | 8 | 4 | 50 |
| 100 | 70 | 20 | 10 | 100 |
| 200 | 130 | 45 | 25 | 200 |

The compiler receives approximately two to three times the final candidate count and
selects through quality and coverage constraints, not `slice(0, N)`.

---

## 6. Metric eligibility

One Prompt Revision may be eligible for multiple analyses:

```yaml
visibility:
ranking:
sov:
sentiment:
brand_perception:
natural_citation_observation:
forced_citation_validation:
risk_check:
recommendation_input:
reasons: []
```

Visibility requires brand exclusion, no disallowed brand/competitor seed, direct or
likely candidate opportunity, an eligible candidate response shape, acceptable
contamination risk, and a ready immutable design.

Ranking additionally requires direct or comparable-set ranking opportunity.
SOV has a separately versioned formula and is not numerically equivalent to visibility.

Self-branded prompts may support sentiment and brand perception but not default market
visibility, ranking, or SOV. Named comparisons remain outside default market headline
metrics.

Natural citation observation and forced citation validation are separate. Criteria,
implementation, verification, and regulated-risk prompts may support risk and
recommendation analysis without being market-metric eligible.

---

## 7. Quality, validation, and automation

Hard gates reject missing revision mappings, text/metadata conflicts, brand or competitor
contamination, unsplit brand-optional prompts, response/eligibility conflicts, insufficient
candidate/ranking opportunity, semantic overweighting, Robustness without Core, profile
or coverage failure, incomplete execution/policy references, unsafe regulated wording,
stale assumptions, and invalid component lifecycle.

Final quality score is calculated from actual checks, not copied from template constants.

```text
Receive approved onboarding/project inputs
→ Generate candidates
→ Hard gates
→ Semantic clustering
→ Coverage/profile checks
→ Compile Prompt Set Version
→ Bind Execution Profile Set and Policy Bundle
→ Validate Measurement Design Version
→ Activate automatically when no exception remains
```

Human review is limited to ambiguous category/target, regulated risk, contamination,
unresolved duplicate, coverage gap, low-confidence source/persona, customer/site conflict,
major Core change, and invalid legacy/import evidence.

---

## 8. Measurement Execution handoff

The formal output is one immutable Measurement Design Version.
Measurement Execution consumes it without redefining prompt semantics, eligibility, or
panel membership.

One logical Measurement Item is:

```text
one Prompt Set Membership
× one Execution Profile Set Membership
× one planned observation ordinal
```

A retry is another append-only Attempt for the same Item.

Each Item references the design, prompt set, prompt membership, prompt revision, Intent
Cell Revision, execution set, execution membership, execution profile, policy bundle,
entitlement snapshot, cycle, and planned observation ordinal.

Each Item stores a full contract snapshot with exact prompt text, classification,
eligibility, panel role, execution fingerprint, policy and entitlement references, hashes,
schema version, and timestamp. Actual provider/model variance is recorded as evidence and
does not rewrite the profile.

---

## 9. Valid response and aggregation

Response status distinguishes valid answer, empty answer, refusal, provider error,
timeout, invalid payload, and cancelled.

Failures and refusals are not brand-absence zeros. A valid answer without the brand is a
visibility zero. Citation-unsupported surfaces are excluded from citation denominators.
Attempted count, valid count, and applicable denominator remain available.

Aggregation order is:

```text
Accepted Attempt
→ Planned Observation Item
→ Prompt Revision
→ Intent Cell Revision
→ Topic / Persona / Buyer Stage
→ Overall Metric
```

Core is intent-balanced. Robustness does not multiply headline weight. Visibility,
ranking, SOV, citation, sentiment, perception, accuracy, and run health remain separate.

---

## 10. Lifecycle and activation

Measurement Design Version lifecycle:

```text
draft → validating → ready → active → superseded or retired
validating → rejected
ready → held
held → validating
```

Ready and Active are immutable. Corrections create successors. Activation atomically
validates tenant/project, entitlement, component hashes, findings, profile counts, and
execution matrix; marks the target active; supersedes the prior version; switches the
current pointer; and appends audit evidence. Failure leaves the prior pointer unchanged.

Component active use is determined by the active Measurement Design Version. Mutable
child `active` flags must not become a second authority.

Rollback creates a successor-compatible design and preserves canonical history and the
previous safe publication.

---

## 11. Interfaces with the rest of Recora

### Onboarding

Onboarding owns understandable business input, target site, analysis target, category
evidence, region/language, important customer situations, and business relevance.
Customers do not manually design internal enums, eligibility, panel roles, or policies.
Approximately 12 visible question candidates may be shown for confirmation, but they are
not the production panel size.

### Measurement Execution

Consumes the frozen design version and owns planned Items, Attempts, provider calls,
retry, queue, and accepted-attempt selection.

### AI answer and citation analysis

Consumes provider evidence and snapshots. Design candidates are not measured facts.

### Quality and exception decisions

Consumes validation findings and measurement evidence. Normal cases are automatic and
people handle defined exceptions.

### Publication and reports

Consumes quality-approved measurements and creates immutable customer-safe publication
versions. It does not reinterpret history through mutable control or legacy rows.

### Customer screens

Read only safe `api` or `publication` projections and present understandable questions,
segments, models, metrics, denominators, citations, and improvement targets.

### Administrator screens

Use formal commands, read models, authorization, optimistic concurrency, and audit.
They are not direct table editors.

### Public site

Does not depend directly on this internal domain.

---

## 12. Logical schema responsibility

| Schema | Responsibility |
|---|---|
| `control` | canonical design identities/versions, component revisions, Prompt Sets, Execution Profile Sets, policies, validation/compilation evidence, lifecycle pointers |
| `measurement` | planned Items, snapshots, Attempts, provider evidence, observations, errors, usage, cost |
| `publication` | immutable customer-published versions and safe projections |
| `api` | customer-safe and administrator-safe read models; never the canonical writer |
| `audit` | commands, activation, exception, import, migration, cutover, recovery evidence |

Authentication, tenant isolation, entitlement, operator identity, audit, queue,
notification, and security are shared foundations consumed rather than redefined.

---

## 13. Legacy import and cutover

Every legacy candidate receives one decision:

- `explicit_import`;
- `review_required`;
- `historical_only`;
- `compatibility_read_only`;
- `do_not_import`.

Import evidence records source, opaque ID, source hash, snapshot time, decision, reasons,
evidence, target canonical IDs, reviewer when required, importer version, and timestamp.
Legacy categories and text inference are hints only and cannot grant canonical eligibility.
Legacy results remain under historical definitions and are not silently recalculated.

```text
Canonical foundation
→ fixtures and replay
→ read-only legacy inventory
→ explicit import decisions
→ shadow validation
→ canonical-only writer
→ admin/customer read-model cutover
→ legacy freeze and retirement after evidence
```

Permanent dual write is not the target. No production inventory, import, backfill,
writer switch, or read cutover is authorized by this document.

---

## 14. Acceptance criteria

The contract is implemented only when:

1. every formal measurement references an immutable Measurement Design Version;
2. the version binds exact semantic panel, execution matrix, policies, entitlement, and target identities;
3. every Core Intent Cell has one canonical Prompt Revision;
4. Robustness does not multiply headline weight;
5. Prompt Set and Execution Profile Set are independently versioned;
6. policy changes do not rewrite the panel;
7. component content and membership are immutable by revision/version;
8. market-metric exclusions are enforced;
9. natural and forced citation are separate;
10. planned observations and retries are distinguishable;
11. every Item has a complete snapshot;
12. denominator handling is explicit;
13. SOV is separately versioned;
14. quality scores are calculated;
15. ordinary generation and activation are automatic;
16. customer screens use safe projections;
17. administrator operations use commands and audit;
18. legacy inference cannot create official eligibility;
19. canonical rows have no formal dependency on legacy rows;
20. rollback and cutover preserve history.

---

## 15. Experimental decisions

Profile sizes/allocations, repeat policy, publication thresholds, SOV, demand weighting,
provider surfaces, Seasonal/Event promotion, provider compatibility, semantic clustering,
and major Core-change thresholds remain versioned experiments with recorded methods,
results, and decisions.

---

## 16. Implementation order

1. Human-review this contract and the Canonical Data Model.
2. Align TypeScript with Measurement Design Version, Execution Profile Set, and Policy Bundle.
3. Wave 1: canonical identity/revision, eligibility, Prompt Set, and panel foundations.
4. Prove tenant, immutability, and profile constraints locally.
5. Wave 2: Execution Profile Sets, design activation, Item references, and snapshots.
6. Integrate Measurement Execution without moving queue/retry/provider responsibility into design.
7. Implement versioned response, aggregation, and compatibility policies.
8. Update administrator read models and exception commands.
9. Update publication and customer-safe read models.
10. Wave 3: separately approved legacy inventory, import decisions, and shadow validation.
11. Switch to canonical-only writer and safe read models under separate approval.
12. Retire legacy paths only after zero-use evidence and rollback readiness.

No remote DB migration, production backfill, metric recalculation, provider call,
customer-visible behavior change, Ready conversion, merge, deploy, or cutover is
authorized by this docs-only contract.
