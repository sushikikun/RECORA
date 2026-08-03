# Recora Prompt & Measurement Contract v1

Status: **Formal target contract / docs-only**  
Last updated: **2026-08-04**  
Authority: **Latest OWNER-approved Recora product direction**  
Implementation status: **Not yet fully implemented**  
Production / remote DB authorization: **None**

## 0. Position and authority

This document defines the product and domain contract for Recora's
**Prompt and Measurement Design** capability.

It is not a standalone prompt database specification and it does not own the whole
measurement, analysis, publication, or UI architecture. It is one domain inside the
new Recora-wide structure.

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

The Prompt and Measurement Design domain receives approved business context from
customer/project management and onboarding. It produces an immutable,
versioned `measurement_design_version` for Measurement Execution.

It MUST NOT absorb the responsibilities of:

- provider execution, retry, queue, or attempt selection;
- answer, mention, ranking, citation, or sentiment analysis;
- quality or publication decisions;
- customer report materialization;
- customer or administrator screen state;
- authentication, tenant ownership, entitlement, audit, or publication foundations.

### 0.2 Authority order

For this domain, use the following order:

1. the latest OWNER decision recorded in the active Issue or approval record;
2. this document after Human review;
3. `docs/recora-measurement-design-canonical-data-model-v1.md` for the more specific
   canonical data-model boundary;
4. `docs/recora-data-tenant-security-privacy.md` for tenant, entitlement, privacy,
   authorization, and historical-reference foundations;
5. the adopted Recora Admin P0 state, read-model, authorization/audit, and
   measurement-management specifications;
6. `docs/recora-post-launch-operations-architecture.md` for the accepted
   `control / measurement / publication / api / audit` separation;
7. current runtime and deployed database as legacy implementation facts only.

A conflict between the target contract and current implementation is a migration gap.
It MUST NOT be silently resolved by inference.

### 0.3 Legacy boundary

The canonical model is designed from current product requirements. It is not an
extension of the current `public.personas`, `public.topics`, `public.prompts`, or legacy
measurement hierarchy.

```text
Product requirements
  → new canonical model
  → new canonical runtime
  → explicit one-way legacy import where justified
```

The direction is not:

```text
Legacy tables
  → keep adding fields
  → treat old rows as the new canonical model
```

Legacy structures are limited to:

- read-only inventory;
- historical evidence;
- explicit import-candidate discovery;
- temporary compatibility reads;
- regression and cutover comparison.

Canonical tables MUST NOT have formal foreign-key dependencies on legacy prompt,
persona, topic, run, response, metric, or recommendation tables.

### 0.4 Superseded product rules

This contract supersedes:

- treating a loose question list as the production measurement unit;
- applying a fixed 60/20/10/10 ratio to every project;
- treating 8 / 16 / 32 prompts as production panel sizes;
- mixing branded prompts into visibility, ranking, or SOV;
- counting criteria-only questions as visibility or ranking opportunities;
- treating one execution as a stable market conclusion;
- changing prompt wording or panel membership without an immutable version;
- requiring manual approval for every ordinary generated prompt;
- binding one semantic prompt set directly to one provider/model execution profile;
- redesigning the final model around legacy public tables.

The terms MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative.

---

## 1. Purpose

Recora prompts are part of a versioned measurement design, not merely a list of
questions.

The contract must answer, without ambiguity:

1. What buyer need is being measured?
2. Which persona, topic, use case, buyer stage, locale, and region does it represent?
3. What exact prompt revision expresses that need?
4. Is it non-branded, self-branded, named-comparison, competitor-only, or draft-only?
5. What answer shape can naturally result?
6. Which metrics may consume the observation?
7. Is it Core, Discovery, Robustness, Diagnostic, Seasonal, or Event?
8. Which semantic prompt-set version contains it?
9. Which provider/model/surface matrix executes it?
10. Which metric, valid-response, aggregation, and repeat policies interpret it?
11. Which immutable measurement-design version binds all of those components?
12. Which exact design and execution snapshot produced a historical result?
13. Which downstream analysis, quality, publication, or improvement process may use it?

### 1.1 Non-goals

This contract does not permanently fix:

- the commercial mapping of 50 / 100 / 200 profiles;
- universal repeat counts;
- the final SOV formula;
- the final demand-weighting formula;
- publication completeness thresholds;
- the final API-versus-consumer-UI measurement role;
- provider retry and queue implementation;
- customer or administrator page layout;
- production legacy-import decisions.

These remain versioned experiments or separately owned implementation decisions.

---

## 2. Product invariants

The domain must make the following mechanically true.

1. `organization` remains the tenant root and `project` remains the project scope.
2. Prompt and measurement design is owned by one project and one organization.
3. A production measurement consumes one immutable `measurement_design_version`.
4. Persona, Topic, Intent Cell, and Prompt continuity are distinct from their immutable revisions.
5. The semantic prompt panel is independent from the provider/model execution matrix.
6. A policy-only change does not rewrite the semantic panel.
7. One selected Core Intent Cell contributes one canonical Core prompt to the headline
   semantic denominator for the active prompt-set version.
8. Robustness paraphrases do not receive independent headline weight.
9. Branded, named, competitor-only, criteria-only, and forced-citation prompts cannot
   enter market metrics incorrectly.
10. Candidate generation is distinct from formal panel compilation.
11. Every planned observation is distinguishable from provider retry attempts.
12. Every historical result resolves to the same design, prompt, execution, entitlement,
    and policy meaning.
13. Normal generation, validation, compilation, activation, and measurement preparation
    are automated; people handle defined exceptions.
14. Customer browsers do not read canonical `control`, raw `measurement`, or `audit`
    data directly.
15. Legacy rows cannot become canonical merely through prompt-text inference.
16. Rollback preserves history and uses a successor version or previous safe publication,
    rather than deleting or mutating evidence.

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

### 3.1 Measurement Design

A Measurement Design is the stable identity for one project measurement program.
A project may have more than one design when scope is intentionally distinct, such as
language, region, brand, product, or formal measurement program.

A `measurement_design_version` binds the complete production contract:

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

### 3.2 Persona

A Persona is a decision-role and decision-context model, not merely a demographic label.

A Persona Revision SHOULD include:

- purchase, use, evaluation, or approval role;
- practical vocabulary;
- jobs, pains, triggers, and switching forces;
- comparison axes;
- required proof and trust requirements;
- industry and business-model fit;
- evidence source status and confidence;
- risk flags and content hash.

Persona Identity represents continuity. Persona Revision represents one immutable
measurement-affecting definition.

### 3.3 Topic

A Topic is a meaningful diagnostic area such as category discovery, problem-solution,
alternative search, implementation risk, local comparison, citation evidence, or
branded perception.

A Topic Revision MUST include:

- name and type;
- diagnosis goal;
- expected signal types;
- intended personas and buyer stages;
- target metrics;
- minimum coverage;
- risk or bias notes;
- source status, confidence, lifecycle, and content hash.

A Topic may cover multiple personas and buyer stages. It MUST NOT force all Prompt
Revisions under it to inherit one buyer stage or expected signal.

### 3.4 Intent Cell

An Intent Cell is the primary semantic measurement unit.

It represents one buyer need under a sufficiently specific context, normally including:

- market or problem need;
- persona or decision role;
- buyer stage;
- locale or region when material;
- expected candidate or answer behavior.

Required conceptual fields:

```yaml
intent_cell_id:
intent_cell_revision_id:
project_id:
persona_revision_id:
primary_topic_revision_id:
secondary_topic_revision_ids: []
buyer_stage:
locale:
region_scope:
intent_summary:
expected_signal_types: []
business_priority:
tracking_scope: true
improvement_scope: true
status:
content_hash:
```

The active Prompt Set Version MUST include at most one `core + canonical` Prompt Revision
per selected Intent Cell Revision.

Robustness variants may share the Intent Cell but MUST NOT multiply its headline weight.

### 3.5 Prompt Identity and Prompt Revision

`prompt_id` identifies a continuing prompt series. `prompt_revision_id` identifies one
immutable measurement-affecting version.

```yaml
prompt_id:
prompt_revision_id:
prompt_version:
intent_cell_revision_id:
text:
content_hash:
brand_scope:
question_family:
question_act:
response_shape:
language_mode:
buyer_stage:
temporal_class:
variant_role:
metric_eligibility:
supersedes_prompt_revision_id:
effective_from:
effective_to:
```

A new revision is required when any of the following changes:

- prompt text;
- Intent Cell Revision membership;
- brand scope;
- question family or act;
- response shape;
- buyer stage;
- language mode or temporal class;
- metric eligibility;
- risk classification;
- any interpretation or aggregation-affecting value.

### 3.6 Prompt Set and Prompt Set Version

A Prompt Set is the continuing identity of one semantic panel.
A Prompt Set Version is the immutable panel membership contract.

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
created_at:
validated_at:
frozen_at:
```

Membership includes:

```yaml
prompt_revision_id:
intent_cell_revision_id:
panel_role:
variant_role:
sort_order:
business_weight:
inclusion_reason:
compilation_decision_id:
```

A Prompt Set Version does **not** own one provider/model execution profile and it does
not directly own metric, valid-response, aggregation, or repeat policy versions.
Those belong to the Measurement Design Version through separately versioned components.

Changing semantic membership, panel role, variant role, eligibility-affecting prompt
revision, or semantic weighting creates a new Prompt Set Version and Measurement Design
Version.

### 3.7 Execution Profile and Execution Profile Set Version

An Execution Profile is one immutable provider/model/surface execution context.

```yaml
execution_profile_id:
provider:
surface:
requested_model:
model_version_policy:
system_prompt_version:
execution_template_version:
web_search_mode:
search_activation_policy:
live_or_cached:
locale:
region:
domain_filters: []
search_budget:
account_or_session_condition:
provider_configuration_schema_version:
content_hash:
status:
```

Secrets and credentials MUST NOT be stored in this profile.

An Execution Profile Set Version is the immutable multi-model execution matrix.
Its memberships include:

```yaml
execution_profile_id:
sort_order:
required_for_formal_measurement:
required_for_publication_coverage:
planned_observation_weight:
membership_reason:
```

Changing provider, model, surface, search mode, locale, region, or matrix membership
creates a new Execution Profile Set Version and Measurement Design Version.
It does not create a new Prompt Set Version when the semantic panel is unchanged.

### 3.8 Measurement Policy Bundle Version

A Measurement Policy Bundle Version binds the exact policies used to interpret a run:

- Metric Definition Version;
- Valid Response Policy Version;
- Aggregation Policy Version;
- Repeat Policy Version;
- Compatibility Policy Version;
- completeness or publication-compatibility policy where applicable.

A policy change creates a new bundle and Measurement Design Version. It MUST NOT mutate
historical results or rewrite the semantic panel.

---

## 4. Orthogonal prompt classification

The system MUST NOT use one mixed `category` as the complete classification.

### 4.1 Brand scope

Allowed values:

- `brand_excluded`;
- `self_branded`;
- `named_comparison`;
- `competitor_only`;
- `brand_optional` as a draft-only state that MUST be split before production.

Target-brand names, aliases, service names, and domains MUST be validated separately
from known competitor names and aliases.

### 4.2 Question family

Allowed target values:

- `market_discovery`;
- `category_discovery`;
- `problem_solution`;
- `alternative_search`;
- `competitor_comparison`;
- `pricing_reputation`;
- `implementation_operation`;
- `citation_evidence`;
- `branded_perception`;
- `local_regional`;
- `regulated_risk`.

`persona_based` is not a family. Persona is represented through the Persona Revision
and wording context.

### 4.3 Question act

Allowed target values:

- `discover_candidates`;
- `request_shortlist`;
- `request_ranking`;
- `compare_candidates`;
- `ask_evaluation_criteria`;
- `assess_fit`;
- `assess_reputation`;
- `assess_risk`;
- `verify_claim`;
- `request_sources`;
- `ask_explanation`.

### 4.4 Response shape

Allowed values:

- `candidate_list`;
- `ranked_recommendation`;
- `comparative_set`;
- `evaluation_criteria`;
- `explanatory_answer`;
- `evidence_answer`;
- `branded_sentiment_answer`.

### 4.5 Language mode

Allowed values:

- `natural_conversation`;
- `raw_search_like`;
- `anxious_user`;
- `comparison_shortcut`;
- `professional_research`.

BtoC, local, clinic, school, and EC projects SHOULD include relevant review, price,
locality, anxiety, or failure-avoidance language. BtoB projects SHOULD include
role-specific operational vocabulary rather than generic consultant wording alone.

### 4.6 Buyer stage

Allowed values:

- `awareness`;
- `exploration`;
- `comparison`;
- `validation`;
- `decision`.

Buyer stage is authoritative at Prompt Revision and Intent Cell Revision level. It MUST
NOT be inherited blindly from Topic.

### 4.7 Temporal class

Allowed values:

- `evergreen`;
- `seasonal`;
- `event_bound`;
- `volatile_dynamic`.

Price, availability, legal-rule, personnel, news, and other volatile questions SHOULD
use `volatile_dynamic` and an appropriate evidence and refresh policy.

---

## 5. Panel roles and profiles

Allowed panel roles:

- `core`;
- `discovery`;
- `robustness`;
- `diagnostic`;
- `seasonal`;
- `event`.

### 5.1 Core

Core defines the stable semantic denominator and period-comparison basis.
Core membership is frozen for an active Prompt Set Version.

Each selected Core Intent Cell contributes one canonical Prompt Revision.

### 5.2 Discovery

Discovery finds new needs, language, categories, and competitors.
Discovery results MUST NOT silently alter the active Core denominator.

Promotion requires:

1. relevance evidence;
2. semantic-duplicate review;
3. coverage review;
4. a successor Prompt Set Version and Measurement Design Version.

### 5.3 Robustness

Robustness tests paraphrase, brevity, anxiety, search-like language, ordering, and other
expression sensitivity inside an Intent Cell.

A Robustness membership requires a Core canonical membership for the same Intent Cell
in the formal base panel unless a documented experimental profile explicitly permits an
exception.

### 5.4 Diagnostic

Diagnostic includes:

- forced source requests;
- branded perception;
- named comparison;
- search activation;
- order reversal;
- evidence verification;
- provider or surface behavior.

Diagnostic results remain separate from default visibility, ranking, and SOV headline
metrics unless a separately versioned metric definition explicitly says otherwise.

### 5.5 Seasonal and Event

Seasonal and Event are overlays. They MUST NOT silently change the stable Core
denominator.

### 5.6 Design preview modes

The existing 8 / 16 / 32 modes are design and evaluation modes:

- `design_preview_lite_8`;
- `design_preview_standard_16`;
- `design_preview_deep_32`.

They MAY support onboarding previews, sales prechecks, Skill evaluation, or internal
design review. They MUST NOT be assumed to be production panels.

### 5.7 Experimental production profiles

Initial experimental definitions:

| Profile | Core canonical | Robustness | Diagnostic | Base total |
|---|---:|---:|---:|---:|
| `measurement_profile_experimental_50` | 38 | 8 | 4 | 50 |
| `measurement_profile_experimental_100` | 70 | 20 | 10 | 100 |
| `measurement_profile_experimental_200` | 130 | 45 | 25 | 200 |

These are versioned Panel Profile artifacts, not permanent commercial plan definitions.
For the same scope, profile intent coverage SHOULD be nested where feasible.

The compiler SHOULD receive approximately two to three times the final candidate count
and MUST select through quality and coverage constraints rather than `slice(0, N)`.

---

## 6. Metric eligibility

One Prompt Revision may have multiple eligibility states.

```yaml
metric_eligibility:
  visibility: eligible | excluded
  ranking: eligible | excluded
  sov: eligible | excluded
  sentiment: eligible | excluded
  brand_perception: eligible | excluded
  natural_citation_observation: eligible | excluded
  forced_citation_validation: eligible | excluded
  risk_check: eligible | excluded
  recommendation_input: eligible | excluded
reasons: []
```

A display or routing `primary_purpose` MAY exist but is not authoritative.

### 6.1 Visibility

Visibility is eligible only when:

- `brand_scope = brand_excluded`;
- no target-brand identity is present;
- no disallowed known-competitor identity is seeded;
- candidate mention opportunity is `direct` or `likely`;
- response shape is `candidate_list`, `ranked_recommendation`, or `comparative_set`;
- the prompt is not forced-citation-only, sentiment-only, criteria-only, or explanation-only;
- seed contamination is acceptable;
- the Prompt Revision and active Measurement Design Version are ready.

A valid answer without the target brand is a valid zero.

### 6.2 Ranking

Ranking requires all visibility conditions and:

- ranking opportunity is `direct` or `comparable_set`;
- multiple candidates or meaningful recommendation order can naturally appear.

### 6.3 Share of Voice

SOV may use the same eligible market population as visibility, but its numeric formula
MUST be separately versioned. SOV eligibility MUST NOT imply SOV equals visibility.

### 6.4 Sentiment and brand perception

Self-branded natural queries may be eligible for sentiment and brand perception.
They are excluded from market visibility, ranking, and SOV.

Named comparisons may support comparative perception but remain outside default market
headline metrics.

### 6.5 Natural and forced citation

A normal market or brand query may be eligible for natural citation observation when
the provider surface supports citations.

A prompt explicitly requesting sources is eligible for forced citation validation and
MUST NOT enter the natural-citation headline denominator.

### 6.6 Risk and recommendation input

Criteria, implementation, verification, and regulated-risk prompts may be eligible for
`risk_check` even when excluded from visibility and ranking.

A measured prompt may be eligible as recommendation input, but this does not authorize
customer publication. Recommendation quality and publication remain downstream gates.

### 6.7 Mandatory market-metric exclusions

The following are excluded from default visibility, ranking, and SOV:

- `self_branded`;
- `named_comparison`;
- `competitor_only` with named entities;
- `brand_optional`;
- criteria-only, explanation-only, evidence-only, or branded-sentiment answer shapes;
- unapproved inferred scope;
- medium or high seed-contamination risk;
- Diagnostic, Discovery, Seasonal, or Event memberships when calculating Core headline
  metrics, unless a metric definition explicitly establishes another view.

---

## 7. Quality, validation, and automation

### 7.1 Hard gates

A Prompt Revision or compiled design fails production readiness when:

- required identity or revision mappings are missing;
- no valid Intent Cell Revision exists;
- text and brand-scope metadata conflict;
- a non-branded market prompt contains target-brand or disallowed competitor identity;
- draft-only `brand_optional` has not been split;
- response shape conflicts with metric eligibility;
- candidate or ranking opportunity is insufficient;
- semantic duplication overweights one Intent Cell;
- a Robustness membership lacks the required Core membership;
- the selected panel fails profile or coverage constraints;
- provider/model matrix or policy references are incomplete;
- regulated-risk language is unsafe or overclaims;
- assumptions are stale or unsupported;
- component revisions or the Measurement Design Version are not valid and immutable.

### 7.2 Quality scoring

A final `quality_score` MUST be calculated from actual checks. A template-fixed number is
a prior only.

Dimensions SHOULD include:

- naturalness;
- diagnostic value;
- non-leading wording;
- buyer realism and persona vocabulary;
- buyer-stage fit;
- expected-signal clarity;
- response-shape and metric fit;
- industry and business-model fit;
- regulated-risk safety;
- local or consumer realism where relevant;
- machine readability;
- semantic distinctiveness.

### 7.3 Gate outcomes

Prompt-level outcomes retain:

- `ready_for_measurement`;
- `revise_before_measurement`;
- `internal_only`;
- `reject`.

Measurement Design Version lifecycle is separately defined in Section 10.

### 7.4 Automatic normal path

```text
Receive approved onboarding/project inputs
→ Generate candidates
→ Run hard gates
→ Run semantic clustering
→ Run coverage and profile checks
→ Compile Prompt Set Version
→ Bind Execution Profile Set and Policy Bundle
→ Validate Measurement Design Version
→ Activate automatically when no exception remains
```

Human review is limited to defined exceptions such as:

- ambiguous business category or analysis target;
- high-risk regulated wording;
- brand or competitor contamination;
- unresolved semantic duplication;
- important coverage gaps;
- low-confidence Persona or source evidence;
- customer input contradicting site evidence;
- major Core-panel change;
- invalid legacy metadata or import evidence.

The exception queue is a read-model projection, not an independent source of truth.

---

## 8. Measurement execution handoff

The Prompt and Measurement Design domain does not execute providers. It hands one
immutable Measurement Design Version to Measurement Execution.

### 8.1 Logical planned-observation grain

One formal Measurement Item represents:

```text
one Prompt Set Membership
× one Execution Profile Set Membership
× one planned observation ordinal
```

A statistical repeat is a separate planned item. A retry is another append-only
Measurement Attempt for the same item.

### 8.2 Required item references

A formal item must reference:

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

Measurement Execution MUST reject cross-tenant, cross-project, or mixed-version
combinations. It MUST NOT reinterpret prompt meaning, eligibility, or panel membership.

### 8.3 Execution contract snapshot

Every formal item snapshots:

- Measurement Design Version ID and hash;
- Prompt Set Version and membership;
- Prompt Identity, Prompt Revision, exact text, and text hash;
- Intent Cell Identity and Revision;
- panel and variant roles;
- prompt classification;
- metric-eligibility map and reasons;
- Execution Profile Set Version and membership;
- Execution Profile and hash;
- Measurement Policy Bundle Version and hash;
- entitlement snapshot reference and schema version;
- snapshot schema version, timestamp, and hash.

Each Attempt records requested and actual provider/model, search/cache outcome, attempt
number, idempotency key, provider evidence references, timing, usage, cost, and stable
failure code.

An actual provider/model mismatch is evidence. It MUST NOT rewrite the execution profile.

---

## 9. Valid-response and aggregation policy

### 9.1 Response status

The policy distinguishes at least:

- `valid_answer`;
- `empty_answer`;
- `refusal`;
- `provider_error`;
- `timeout`;
- `invalid_payload`;
- `cancelled`.

Default rules:

- content metrics use valid answers as the content denominator;
- failure and refusal are not converted into brand-absence zeros;
- failures reduce coverage and may block downstream publication;
- a valid answer without the target brand is a visibility zero;
- a valid citation-capable answer without citation is a natural-citation zero when eligible;
- citation-unsupported surfaces are excluded from citation denominators;
- search activation is reported separately from answer validity.

Customer-visible metrics retain attempted count, valid count, and applicable denominator.

### 9.2 Aggregation order

```text
Accepted Attempt
→ Planned Observation Item
→ Prompt Revision Observation
→ Intent Cell Revision Observation
→ Topic / Persona / Buyer Stage Segments
→ Overall Metric
```

Core canonical is the default headline observation for an Intent Cell.
Robustness variants produce a separate robustness view or are aggregated inside the
Intent Cell according to the versioned policy.

The default Core headline is intent-balanced across eligible active Core Intent Cells.
Recora may also report raw, business-weighted, or demand-estimated views, provided the
unweighted value, weights, source, version, and denominator remain available.

Visibility, ranking, SOV, citation behavior, sentiment, brand perception, accuracy, and
run health remain separate. They MUST NOT be collapsed into an unexplained composite.

---

## 10. Lifecycle and immutable activation

### 10.1 Measurement Design Version lifecycle

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

- draft may be edited through controlled builders;
- validating does not accept arbitrary mutation;
- ready and active are immutable;
- corrections create a successor version;
- only the current-version pointer selects the active production design;
- failure during activation leaves the previous pointer unchanged.

### 10.2 Component lifecycle

Persona, Topic, Intent Cell, Prompt, Prompt Set, Execution Profile Set, Panel Profile,
and Policy Bundle revisions are immutable once validated or frozen.

A separate mutable `active` flag on every child MUST NOT become a conflicting authority.
Active use is determined by the active Measurement Design Version.

### 10.3 Activation transaction

Activation atomically:

1. locks the current pointer and target version;
2. validates tenant/project ownership;
3. validates entitlement and lifecycle;
4. validates all component references and hashes;
5. confirms no blocking finding remains;
6. verifies panel profile and execution matrix;
7. marks the target active;
8. supersedes the previous active version when present;
9. switches the pointer with optimistic row version;
10. appends audit evidence.

### 10.4 Rollback

Rollback does not delete or reactivate ambiguous historical state. It creates a
successor-compatible Measurement Design Version that reuses known-good immutable
components and records rollback and supersession lineage.

The previous safe publication remains available until a successor publication passes
its downstream gates.

---

## 11. Interfaces with the rest of Recora

### 11.1 Customer/project management and onboarding input

Onboarding owns understandable input and confirmation:

- target site and analysis target;
- business description and category evidence;
- target region and language;
- important customer situations and question areas;
- customer-confirmed business relevance.

Customers SHOULD NOT manually design internal enums, Prompt Revision metadata, metric
eligibility, panel roles, or execution-policy details.

The onboarding UI may show approximately 12 important question candidates for
confirmation. Those are not the final production panel size.

### 11.2 Output to Measurement Execution

The only formal production output is an immutable `measurement_design_version` and its
component references. Measurement Execution consumes it without redefining semantics.

### 11.3 AI answer and citation analysis

Analysis consumes actual provider evidence and contract snapshots. It MUST NOT treat
Persona, Topic, Prompt, or panel candidates as measured facts.

### 11.4 Quality and exception decisions

Quality consumes design-validation findings and measurement evidence. Normal cases are
automatic; defined exceptions and major version changes are routed to people.

### 11.5 Publication and report generation

Publication consumes quality-approved measurements and creates immutable customer-safe
publication versions. It does not read mutable legacy or live control rows to reinterpret
historical results.

### 11.6 Customer-facing screens

Customer screens read only customer-safe `api` or `publication` projections.
They present understandable questions, topics, personas, buyer stages, model differences,
metrics, denominators, citations, and improvement targets.

Internal enums and reason codes may appear in advanced detail but do not dominate the
default experience.

### 11.7 Administrator-facing screens

Administrator screens use formal commands, read models, capability checks, optimistic
concurrency, and audit. They are not direct table editors.

They may show current design version, next-version candidate, panel composition,
execution matrix, unresolved findings, version diff, compatibility, and authorized import
or cutover evidence.

### 11.8 Public site

The public site does not depend directly on this internal domain.

---

## 12. Logical schema responsibility

The accepted schema separation remains:

| Schema | Responsibility |
|---|---|
| `control` | canonical Measurement Design identities and versions, component revisions, Prompt Sets, Execution Profile Sets, policies, validation and compilation evidence, lifecycle pointers |
| `measurement` | planned items, contract snapshots, attempts, provider evidence, answer/citation observations, errors, usage, and cost |
| `publication` | immutable customer-published versions and safe published projections |
| `api` | customer-safe and administrator-safe read models; never the canonical writer |
| `audit` | operator commands, activation, exception, import, migration, cutover, and recovery evidence |

Customer browsers MUST NOT directly read or write `control`, raw `measurement`, or
`audit` data.

Authentication, tenant isolation, entitlement resolution, operator identity, audit,
queue, notification, and security are shared foundations consumed by this domain. This
contract does not redefine them.

---

## 13. Legacy import and cutover

### 13.1 Import decisions

Every legacy candidate receives one decision:

- `explicit_import`;
- `review_required`;
- `historical_only`;
- `compatibility_read_only`;
- `do_not_import`.

Import evidence records source system, table, opaque source ID, source hash, snapshot
time, decision, reason codes, evidence reference, target canonical IDs, reviewer when
required, importer version, and timestamp.

### 13.2 No inference-based promotion

Legacy `prompt_type`, `measurement_purpose`, mixed categories, and text inference are
migration hints only. They cannot grant canonical metric eligibility.

### 13.3 Historical results

Legacy results remain under their historical measurement definition. They are not
recalculated as if the new Intent Cell, panel, response, aggregation, or SOV contract had
always applied.

### 13.4 One-way cutover

```text
Canonical foundation
→ canonical fixtures and replay
→ read-only legacy inventory
→ explicit import decisions
→ shadow validation
→ canonical-only writer
→ administrator/customer read-model cutover
→ legacy writer freeze and retirement after evidence
```

Permanent dual write is not the target.

No production inventory, import, backfill, writer switch, or read cutover is authorized
by this document.

---

## 14. Acceptance criteria

The contract is implemented only when:

1. every formal measurement references a non-null immutable Measurement Design Version;
2. the Design Version binds exact Persona, Topic, Intent Cell, Prompt Set, Execution
   Profile Set, Panel Profile, Policy Bundle, entitlement, and target identities;
3. no active production Prompt Revision exists without an Intent Cell Revision;
4. every selected Core Intent Cell has one canonical Prompt Revision in the Prompt Set;
5. Robustness variants do not create independent headline intent weight;
6. semantic Prompt Set and provider/model Execution Profile Set are independently versioned;
7. policy-only changes do not rewrite the semantic panel;
8. Prompt Revision and finalized component content are immutable;
9. panel membership changes create successor Prompt Set and Design Versions;
10. branded, named, competitor-only, criteria-only, and forced-citation prompts cannot
    enter market headline metrics incorrectly;
11. natural and forced citation remain separate;
12. planned observations and retry attempts are distinguishable;
13. every item has a complete execution contract snapshot;
14. failures, refusals, unsupported surfaces, and valid brand-absence have explicit
    denominator handling;
15. SOV uses a separately versioned formula;
16. quality scores are calculated rather than copied from template constants;
17. normal generation and activation are automatic and people see defined exceptions;
18. customer screens read only safe publication/API projections;
19. administrator operations use commands, authorization, read models, and audit;
20. legacy inferred metadata cannot become official eligibility without explicit validation;
21. canonical rows have no formal dependency on legacy rows;
22. rollback and cutover preserve canonical and published history.

---

## 15. Experimental decisions still open

The following remain explicit experiments:

- final use of 50 / 100 / 200 profiles;
- 38/8/4, 70/20/10, and 130/45/25 allocations;
- repeat and adaptive variance policy by provider and surface;
- publication coverage thresholds;
- final SOV formula;
- business-priority and external-demand weighting;
- API, consumer UI, and search UI production roles;
- Seasonal and Event promotion rules;
- provider/model compatibility across time;
- semantic-clustering implementation and evaluation corpus;
- major Core-panel change threshold.

Each experiment requires an identifier, method, result, and decision record.
Experimental values MUST NOT silently become permanent invariants.

---

## 16. Implementation order

1. Adopt this contract and the new Canonical Data Model through Human review.
2. Align the TypeScript contract with Measurement Design Version, Execution Profile Set,
   and Policy Bundle boundaries.
3. Wave 1: implement canonical identity/revision, eligibility, Prompt Set, and panel
   foundations in new canonical structures.
4. Prove tenant, immutability, and profile constraints locally with fresh replay.
5. Wave 2: implement Execution Profile Sets, Design finalization/activation, planned item
   references, and contract snapshots.
6. Integrate with Measurement Execution without moving queue/retry/provider responsibility
   into the design domain.
7. Implement versioned valid-response, aggregation, and compatibility policies.
8. Update administrator read models and exception commands.
9. Update publication and customer-safe read models.
10. Wave 3: run separately approved read-only legacy inventory and import decisions.
11. Perform shadow validation without claiming old and new metrics are automatically equivalent.
12. Switch to canonical-only writer and safe read models under separate approval.
13. Freeze and retire legacy paths only after zero-use evidence, rollback readiness, and
    separate authorization.

No remote database migration, production backfill, metric recalculation, provider call,
customer-visible behavior change, Ready conversion, merge, deploy, or cutover is
authorized by this docs-only contract.
