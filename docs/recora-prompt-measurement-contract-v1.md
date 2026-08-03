# Recora Prompt & Measurement Contract v1

Status: Formal target contract / docs-only
Last updated: 2026-08-04
Authority: User-approved Recora product direction
Implementation status: Not yet fully implemented

## 0. Position of this document

This document is the target source of truth for future Recora prompt design, prompt-set construction, measurement execution, aggregation, database design, administration UI, and customer-facing read models.

Until the migration described here is implemented, the current runtime code and deployed database remain the source of truth for actual production behavior. A conflict between this contract and current implementation must be surfaced as a migration gap. It must not be silently resolved by inference.

This contract supersedes the following as final product rules:

- treating a loose question list as the measurement unit;
- applying a fixed 60/20/10/10 prompt ratio to every project;
- treating 8 / 16 / 32 prompts as the production measurement panel size;
- mixing branded prompts into AI visibility, ranking, or Share of Voice;
- counting criteria-only prompts as visibility or ranking prompts;
- treating a single execution as a stable market conclusion;
- allowing prompt wording or panel membership to change without an immutable version;
- requiring manual approval for every normal generated prompt.

The following existing principles remain valid and are incorporated into this contract:

- topic-first prompt design;
- explicit persona and buyer-stage mapping;
- non-branded and branded measurement separation;
- response-shape-aware metric eligibility;
- industry and business-model adapters;
- citation analysis separated from ranking evidence;
- conservative handling of inferred metadata;
- normal operations are automated and humans handle exceptions.

The terms MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative.

---

## 1. Purpose

Recora prompts are a versioned measurement design, not a list of questions.

The contract must make it possible to answer all of the following without ambiguity:

1. What buyer need is being measured?
2. Which persona, topic, use case, and buyer stage does it represent?
3. Is the prompt non-branded, branded, named-comparison, or competitor-only?
4. What answer shape can naturally result?
5. Which metrics may use the result?
6. Is the prompt part of the stable KPI panel, a robustness test, a diagnostic test, or a discovery pool?
7. Which exact text revision was executed?
8. Under which provider, model, search, locale, and execution conditions was it executed?
9. How is the execution aggregated without overweighting paraphrases?
10. Which customer-facing conclusion or improvement hypothesis may use the result?

### 1.1 Non-goals

This contract does not fix the following experimental values permanently:

- the final commercial mapping of 50 / 100 / 200 prompt profiles;
- a universal repeat count for every provider and model;
- the final Share of Voice formula;
- the final demand-weighting formula;
- the final minimum-valid-observation threshold;
- the final official API-versus-consumer-UI measurement surface.

These must be versioned experiments. Their uncertainty must not block the core domain model.

---

## 2. Design principles

### 2.1 Topic first

A Topic Set MUST be defined before production prompts are selected. Every active prompt revision MUST map to at least one valid topic.

### 2.2 Intent before wording

Recora MUST distinguish the semantic buyer intent from the text used to express it. Multiple paraphrases of one intent MUST NOT receive multiple independent weights in the headline KPI merely because more variants were generated.

### 2.3 Candidate generation is not panel selection

The system MAY generate a broad candidate pool, but only a compiled and versioned prompt-set version may enter production measurement.

### 2.4 Measurement role separation

Core, discovery, robustness, diagnostic, seasonal, and event prompts MUST remain distinguishable. Diagnostic or forced-citation prompts MUST NOT silently enter the market KPI denominator.

### 2.5 Multiple metric eligibility

One prompt revision may be usable for multiple analyses. A single `measurement_purpose` value MUST NOT be the authoritative eligibility model.

### 2.6 Immutable history

Prompt text, metric-affecting metadata, panel membership, and execution conditions MUST be reproducible for every historical run.

### 2.7 Automation by default

Normal generation, quality validation, panel compilation, measurement, and publication readiness checks SHOULD be automatic. Human review is required only for defined exceptions or high-risk cases.

### 2.8 No pre-measurement claims

Generated topics and prompts are measurement hypotheses. They MUST NOT be represented as evidence that a brand is visible, recommended, cited, trusted, accurate, or competitive before actual measurement.

---

## 3. Canonical domain hierarchy

```text
Project
└─ Persona
└─ Topic
   └─ Intent Cell
      ├─ Prompt identity
      │  └─ Immutable prompt revisions
      └─ Prompt-set-version memberships
         ├─ Core
         ├─ Discovery
         ├─ Robustness
         ├─ Diagnostic
         ├─ Seasonal
         └─ Event
            └─ Execution profile
               └─ Measurement run
                  └─ Run item / execution
                     └─ Answer observation
```

### 3.1 Topic

A topic represents a meaningful diagnostic area, such as category discovery, problem-solution discovery, alternative search, implementation risk, local comparison, citation evidence, or branded perception.

A topic MUST include:

- `topic_id`;
- `topic_name`;
- `topic_type`;
- `diagnosis_goal`;
- covered personas;
- covered buyer stages;
- target metrics;
- observable expected signals;
- minimum intended coverage;
- risk or bias notes;
- lifecycle status.

A topic MAY map to multiple personas and buyer stages. It MUST NOT force all prompts under the topic to share one buyer stage or one expected signal.

### 3.2 Persona

A persona is a role and decision-context model, not only a demographic label.

A persona SHOULD include:

- decision role;
- practical vocabulary;
- jobs, pains, triggers, and switching forces;
- comparison axes;
- required proof;
- trust requirements;
- industry and business-model fit;
- confidence and source status.

### 3.3 Intent Cell

An Intent Cell is the primary semantic measurement unit.

An Intent Cell represents one buyer need under a sufficiently specific context, normally including:

- market or problem need;
- persona or decision role;
- buyer stage;
- locale or region when material;
- expected candidate or answer behavior.

Required fields:

```yaml
intent_cell_id:
project_id:
primary_topic_id:
secondary_topic_ids: []
persona_id:
buyer_stage:
locale:
region_scope:
intent_summary:
expected_signal_types: []
business_priority:
tracking_scope: true
improvement_scope: true
status:
```

Each active Core Intent Cell MUST have exactly one canonical active prompt revision per provider-language measurement context unless a documented exception exists.

### 3.4 Prompt identity and prompt revision

`prompt_id` identifies a continuing prompt series. `prompt_revision_id` identifies one immutable measurement-affecting version.

```yaml
prompt_id:
prompt_revision_id:
prompt_version:
intent_cell_id:
text:
content_hash:
variant_role:
supersedes_prompt_revision_id:
effective_from:
effective_to:
```

A new prompt revision MUST be created when any of the following changes:

- prompt text;
- brand scope;
- question family or question act;
- response shape;
- buyer stage;
- language mode;
- intent-cell membership;
- metric eligibility;
- risk classification;
- any field that can change interpretation or aggregation.

Historical run items MUST retain the exact executed prompt text and classification snapshot.

### 3.5 Prompt set and prompt-set version

A Prompt Set is the continuing measurement-panel identity for a project. A Prompt-set version is an immutable membership and execution contract.

```yaml
prompt_set_id:
prompt_set_version_id:
version_label:
status:
execution_profile_id:
metric_definition_version:
valid_response_policy_version:
aggregation_policy_version:
repeat_policy_id:
activated_at:
frozen_at:
supersedes_prompt_set_version_id:
```

Changing membership, panel role, metric eligibility, execution profile, or aggregation contract MUST create a new prompt-set version.

---

## 4. Orthogonal prompt classification

The system MUST NOT use one mixed `category` field as the complete prompt classification.

### 4.1 Brand scope

Allowed values:

- `brand_excluded`: target brand, aliases, service names, and domain are absent;
- `self_branded`: target brand is explicitly included;
- `named_comparison`: target brand and/or named brands are explicitly compared;
- `competitor_only`: one or more named competitors are included while the target brand is absent;
- `brand_optional`: draft-only state that MUST be split before production measurement.

Known competitor names and aliases MUST be checked separately from target-brand contamination.

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

`persona_based` is not a question family. Persona is represented by `persona_id` and persona-specific wording.

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

Retain the current values:

- `candidate_list`;
- `ranked_recommendation`;
- `comparative_set`;
- `evaluation_criteria`;
- `explanatory_answer`;
- `evidence_answer`;
- `branded_sentiment_answer`.

### 4.5 Language mode

Retain the current values:

- `natural_conversation`;
- `raw_search_like`;
- `anxious_user`;
- `comparison_shortcut`;
- `professional_research`.

A production panel SHOULD include realistic language modes appropriate to the business model. BtoC, local, clinic, school, and EC projects SHOULD include raw, anxious, review, price, locality, or failure-avoidance language when relevant. BtoB projects SHOULD include role-specific operational vocabulary rather than generic consultant wording only.

### 4.6 Buyer stage

Retain:

- `awareness`;
- `exploration`;
- `comparison`;
- `validation`;
- `decision`.

Buyer stage is a prompt-revision field. It MUST NOT be inherited blindly from a topic when the actual prompt represents another stage.

### 4.7 Temporal class

Allowed values:

- `evergreen`;
- `seasonal`;
- `event_bound`;
- `volatile_dynamic`.

Price, availability, legal-rule, personnel, news, and other volatile questions SHOULD be marked `volatile_dynamic` and use an appropriate refresh and evidence policy.

---

## 5. Panel roles

Allowed values:

- `core`;
- `discovery`;
- `robustness`;
- `diagnostic`;
- `seasonal`;
- `event`.

### 5.1 Core

Core prompts define the stable customer KPI and period comparison. Core membership MUST remain frozen for the active prompt-set version.

Each Core Intent Cell SHOULD contribute one canonical prompt revision to the headline denominator.

### 5.2 Discovery

Discovery prompts search for new buyer needs, categories, competitors, language patterns, and emerging questions. Discovery results MUST NOT automatically modify the active Core denominator.

Promotion from Discovery to Core requires:

1. relevance evidence;
2. semantic-duplicate review;
3. coverage impact review;
4. a new prompt-set version.

### 5.3 Robustness

Robustness prompts test paraphrase, brevity, wording, anxiety, search-like language, ordering, and other expression sensitivity within an Intent Cell.

Robustness variants MUST NOT be counted as independent Core intents. Their results are aggregated within or reported beside the Intent Cell according to the aggregation policy.

### 5.4 Diagnostic

Diagnostic prompts test controlled behavior such as:

- forced source requests;
- branded perception;
- named comparison;
- search activation;
- order reversal;
- evidence verification;
- provider or surface behavior.

Diagnostic results MUST remain separate from the default market visibility, ranking, and SOV headline KPIs unless a metric definition explicitly states otherwise.

### 5.5 Seasonal and event

Seasonal and event prompts are overlays. They MUST NOT silently change the stable Core denominator. Promotion to Core requires a new set version.

---

## 6. Prompt profiles

### 6.1 Design preview modes

The existing 8 / 16 / 32 prompt modes are reclassified as design and evaluation modes:

- `design_preview_lite_8`;
- `design_preview_standard_16`;
- `design_preview_deep_32`.

They MAY be used for onboarding previews, sales prechecks, Skill evaluation, or internal design review. They MUST NOT be assumed to be the production customer measurement panel.

### 6.2 Experimental production profiles

Initial experimental profiles:

| Profile | Core canonical | Robustness | Diagnostic | Base total |
|---|---:|---:|---:|---:|
| `measurement_profile_experimental_50` | 38 | 8 | 4 | 50 |
| `measurement_profile_experimental_100` | 70 | 20 | 10 | 100 |
| `measurement_profile_experimental_200` | 130 | 45 | 25 | 200 |

These allocations are experimental defaults, not permanent commercial plan definitions.

For the same project scope, profiles SHOULD be nested where possible:

```text
50-profile intents ⊂ 100-profile intents ⊂ 200-profile intents
```

Seasonal and event overlays are outside the base total unless the set version explicitly includes them.

### 6.3 Candidate pool size

The panel compiler SHOULD receive approximately two to three times the final required candidate count. It MUST select through quality and coverage constraints rather than truncating the first N generated prompts.

---

## 7. Metric eligibility

A prompt revision may have multiple metric-eligibility states.

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

`primary_purpose` MAY exist for display and routing, but MUST NOT replace the full eligibility map.

### 7.1 Visibility

Visibility is eligible only when all of the following hold:

- `brand_scope = brand_excluded`;
- no target-brand signal is detected;
- no disallowed named-competitor seeding is detected;
- candidate mention opportunity is direct or likely;
- response shape is `candidate_list`, `ranked_recommendation`, or `comparative_set`;
- the prompt is not forced-citation-only, sentiment-only, or explanation-only;
- the prompt revision is active and measurement-ready.

A valid answer with no target-brand mention is a valid zero, not a missing observation.

### 7.2 Ranking

Ranking is eligible only when all visibility conditions hold and:

- ranking opportunity is `direct` or `comparable_set`;
- multiple candidates or a meaningful recommendation order can naturally appear.

Criteria-only, explanation-only, and evidence-only prompts are excluded.

### 7.3 Share of Voice

SOV MAY use the same eligible market prompt population as visibility, but its numeric formula MUST be separately versioned. `sov` eligibility MUST NOT imply that SOV equals visibility.

The production formula must identify whether it uses:

- prompt-level presence;
- mention counts;
- position weighting;
- answer-section weighting;
- another explicitly versioned method.

### 7.4 Sentiment and brand perception

Self-branded natural queries may be eligible for sentiment and brand perception. They are excluded from visibility, ranking, and SOV.

Named comparisons MAY support comparative-perception analysis, but MUST remain outside the default market headline metrics.

### 7.5 Natural citation observation

A normal market or brand query may be eligible for observing naturally produced citations when the provider surface supports them.

A prompt that explicitly requests sources MUST NOT be included in the natural-citation headline metric.

### 7.6 Forced citation validation

Prompts with `question_act = request_sources`, `question_family = citation_evidence`, or `response_shape = evidence_answer` may be eligible for forced citation validation.

These results are diagnostic and must remain separate from natural citation behavior and ranking evidence.

### 7.7 Risk check

Criteria, implementation, regulated-risk, and verification prompts may be eligible for `risk_check` even when they are excluded from visibility and ranking.

### 7.8 Recommendation input

A measured prompt may be eligible as recommendation input when its answer, source behavior, factual gap, competitor pattern, or risk signal can support an improvement hypothesis.

Eligibility for recommendation input does not authorize customer publication. Recommendation quality and publication gates remain separate.

### 7.9 Mandatory exclusion cases

The following MUST be excluded from market visibility, ranking, and SOV:

- `self_branded`;
- `named_comparison`;
- `competitor_only` with named entities;
- `brand_optional`;
- `evaluation_criteria` without candidate request;
- `explanatory_answer`;
- `evidence_answer` used only for source checks;
- `branded_sentiment_answer`;
- unapproved inferred scope;
- prompts with medium or high seed-contamination risk;
- prompts outside the active Core set when calculating the Core headline metric.

---

## 8. Measurement execution contract

Every production run MUST reference an immutable execution profile.

Required execution fingerprint:

```yaml
execution_profile_id:
provider:
surface:
model:
model_version:
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
repeat_policy_id:
valid_response_policy_version:
metric_definition_version:
aggregation_policy_version:
```

API, consumer UI, search UI, live search, cached search, and no-search runs MUST NOT be merged without a declared compatibility rule.

A model-version or material execution-profile change SHOULD create a new comparison segment. The system MUST surface the discontinuity rather than presenting it as ordinary brand movement.

### 8.1 Run-item snapshot

Every run item MUST snapshot:

- prompt-set version;
- prompt revision;
- exact prompt text;
- intent-cell ID;
- panel role;
- classification fields;
- metric eligibility;
- execution profile;
- provider raw identifiers needed for traceability;
- execution timestamp.

---

## 9. Valid-response policy

The response policy MUST distinguish at least:

- `valid_answer`;
- `empty_answer`;
- `refusal`;
- `provider_error`;
- `timeout`;
- `invalid_payload`;
- `cancelled`.

Default contract:

- market metrics use valid answers as the content denominator;
- failures and refusals are not silently converted into brand-absence zeros;
- failures and refusals reduce execution coverage and may block publication;
- a valid answer without the target brand is a valid visibility zero;
- a valid citation-capable answer without citations is a natural-citation zero when natural citation is eligible;
- a no-search answer may remain valid for visibility, while search activation is reported separately;
- surfaces that do not support citations are excluded from citation denominators rather than recorded as citation zeros.

Every customer-visible metric MUST retain attempted count, valid count, and the applicable denominator.

---

## 10. Aggregation

The normative aggregation order is:

```text
Execution
→ Prompt revision observation
→ Intent Cell observation
→ Topic / Persona / Buyer stage
→ Overall project view
```

### 10.1 Execution to prompt revision

Repeated valid executions of the same prompt revision and compatible execution profile are aggregated according to `repeat_policy_id`.

### 10.2 Prompt revision to Intent Cell

The canonical Core prompt is the default headline observation for the Intent Cell.

Robustness variants are aggregated separately or used to produce a robustness range. They MUST NOT independently multiply the Intent Cell's headline weight.

### 10.3 Intent Cell to overall

The default Core headline MUST be intent-balanced across active eligible Core Intent Cells.

Recora MAY additionally report:

- raw observation rate;
- business-weighted rate;
- demand-estimated rate.

A weighted metric MUST display or preserve:

- the unweighted value;
- weights;
- weight source;
- weight version;
- denominator.

### 10.4 Metric separation

Visibility, ranking, SOV, citation behavior, sentiment, brand perception, accuracy, and run health MUST remain separate. They MUST NOT be merged into one unexplained composite score.

---

## 11. Quality and readiness gates

### 11.1 Hard gates

A prompt revision MUST fail production readiness when any of the following applies:

- required identity or mapping fields are absent;
- no valid Intent Cell exists;
- brand-scope metadata conflicts with the text;
- a non-branded prompt contains target-brand identity;
- a market prompt contains a disallowed known competitor identity;
- brand-optional wording has not been split;
- response shape conflicts with metric eligibility;
- visibility is marked eligible without direct or likely candidate opportunity;
- ranking is marked eligible without comparable candidates;
- semantic duplication would overrepresent one Intent Cell;
- the prompt is unsafe or overclaims in a regulated context;
- the question depends on unsupported or stale assumptions;
- the prompt cannot be parsed or interpreted consistently;
- the prompt revision or set version is not active.

### 11.2 Quality scoring

A final `quality_score` MUST be derived from actual checks. A template's fixed score is only a prior and MUST NOT be treated as the final measured quality score.

Scoring dimensions SHOULD include:

- naturalness;
- diagnostic value;
- non-leading wording;
- buyer realism;
- persona vocabulary fit;
- buyer-stage fit;
- expected-signal clarity;
- response-shape fit;
- metric-eligibility fit;
- industry and business-model fit;
- regulated-risk safety;
- local or consumer realism where applicable;
- machine readability;
- semantic distinctiveness.

### 11.3 Gate outcomes

Retain:

- `ready_for_measurement`;
- `revise_before_measurement`;
- `internal_only`;
- `reject`.

### 11.4 Automatic normal path

The normal path is:

```text
Generate candidates
→ Run hard gates
→ Run semantic clustering
→ Run coverage checks
→ Compile panel
→ Activate automatically
```

Human review is required only for exceptions such as:

- ambiguous industry or category;
- high-risk regulated wording;
- brand or competitor contamination;
- unresolved semantic duplication;
- important topic undercoverage;
- low-confidence persona;
- customer input contradicting site evidence;
- major Core-panel change;
- invalid or legacy metadata.

The exception queue is a derived operational view. It SHOULD NOT become an independent permanent source of truth separate from prompt, validation, and audit records.

---

## 12. Prompt and set lifecycle

### 12.1 Prompt-revision status

Allowed target values:

- `candidate`;
- `validated`;
- `active`;
- `held`;
- `retired`;
- `rejected`;
- `superseded`.

### 12.2 Prompt-set-version status

Allowed target values:

- `draft`;
- `validating`;
- `active`;
- `frozen`;
- `superseded`;
- `retired`.

An active prompt-set version is immutable. Corrections create a new version.

---

## 13. Onboarding and panel compilation

Customers SHOULD NOT manually design detailed prompt metadata.

The onboarding flow should:

1. read and analyze the target site;
2. infer category, business model, personas, and question areas;
3. show customer-readable important question candidates;
4. allow the customer to confirm business relevance, target region, language, and important buyer situations;
5. generate a larger internal candidate pool;
6. compile the production panel automatically;
7. route only exceptions for human review.

The onboarding UI MAY show 12 important question candidates for confirmation. These are customer-facing candidates, not the final measurement-panel count.

### 13.1 Panel compiler requirements

The compiler MUST:

- use Topic Set and persona inputs;
- generate two to three times the target count where feasible;
- detect target-brand and known-competitor contamination;
- cluster semantic duplicates into Intent Cells;
- assign canonical, robustness, diagnostic, and other roles;
- satisfy topic, persona, buyer-stage, response-shape, and metric coverage;
- preserve one canonical Core prompt per selected Intent Cell;
- avoid selecting through simple `slice(0, N)` truncation;
- create an immutable prompt-set version;
- output reasons for inclusion, exclusion, and exception routing.

---

## 14. Customer-facing presentation

Customer UI MUST translate internal metadata into understandable concepts.

Primary presentation units:

- important questions;
- topics;
- personas or decision roles;
- buyer stages;
- AI visibility;
- answer position or recommendation order;
- SOV;
- citations and source ownership;
- brand perception;
- valid observation count;
- provider or model differences;
- identified weaknesses and improvement targets.

The Prompts page SHOULD show important questions first.

Customer-visible metrics MUST show numerator, denominator, or observation count sufficient to understand the value.

Internal enums such as `question_family`, `panel_role`, and eligibility reason codes MAY appear in advanced detail but MUST NOT dominate the default customer experience.

`tracking_scope` and `improvement_scope` MUST remain separate. A prompt may be tracked without creating a customer-facing improvement proposal.

Diagnostic, branded, and forced-citation results MUST be visually separated from the default market visibility KPI.

---

## 15. Administration requirements

The administration view should support:

- active prompt-set version;
- next-version candidate pool;
- Core / Discovery / Robustness / Diagnostic membership;
- semantic duplicate clusters;
- automated exclusions and reasons;
- unresolved exceptions;
- topic, persona, and buyer-stage coverage gaps;
- prompt revision diff;
- execution-profile incompatibilities;
- invalid-response and coverage failures;
- activation, hold, retirement, and supersession history.

Audit history MUST remain the single saved source for operator actions. Display state should be derived from formal records rather than stored independently in multiple UI-specific states.

---

## 16. Conceptual database target

The exact physical schema is implementation work, but the domain should support at least:

### 16.1 Identity and revision

- `prompts`: stable prompt identity;
- `prompt_revisions`: immutable measurement-affecting revisions;
- `prompt_intent_cells`: semantic measurement units.

### 16.2 Panel versioning

- `prompt_sets`;
- `prompt_set_versions`;
- `prompt_set_memberships`.

Membership should include:

- prompt revision;
- panel role;
- canonical or variant role;
- sort order;
- optional approved business weight;
- inclusion reason.

### 16.3 Eligibility and execution

- prompt-revision metric eligibility, either normalized or as a validated immutable contract;
- `execution_profiles`;
- run-to-prompt-set-version link;
- run-item prompt and eligibility snapshot.

### 16.4 Compatibility

Existing `prompts.prompt_type` and `prompts.measurement_purpose` fields may remain during migration as compatibility projections. They are not the final authoritative model.

No existing row may be promoted to official metric eligibility based only on prompt-text inference.

---

## 17. Current-to-target migration map

| Current item | Current role | Target handling |
|---|---|---|
| `PromptCategory` | Mixed topic, brand, persona, and citation classification | Replace as authority with `question_family`; keep compatibility mapping |
| `PromptIntent` | Mixed query type and measurement meaning | Map to `question_act`, brand scope, or routing metadata as appropriate |
| `PromptBrandingMode` | Brand inclusion state | Migrate to `brand_scope` |
| `PromptBrandMentionRule` | Brand inclusion rule | Merge into validated `brand_scope` contract |
| `PromptCompetitorMentionRule` | Competitor seeding behavior | Retain as competitor-seed policy and entity-contamination check |
| `PromptResponseShape` | Expected answer form | Retain |
| `candidateMentionOpportunity` | Visibility opportunity | Retain and validate |
| `rankingOpportunity` | Ranking opportunity | Retain and validate |
| single `measurement_purpose` | One DB/read-model purpose | Deprecate as authority; retain optional `primary_purpose` compatibility field |
| `PromptMetricEligibility` | Multiple metric flags | Expand with natural citation, forced citation, risk check, and recommendation input |
| `prompt_type` DB field | Coarse display scope | Keep as compatibility projection during migration |
| `promptId` | Current generated identity | Split into stable `prompt_id` and immutable `prompt_revision_id` |
| `rawUserIntent` | Generation trace | Retain as generation rationale, not semantic aggregation key |
| `languageMode` | Wording mode | Retain |
| `buyerStage` inherited from topic | Stage label | Make prompt-revision authoritative |
| topic-level `expectedSignal` copied to prompt | Shared signal | Make prompt-revision expected signals explicit |
| fixed template `qualityScore` | Generated prior | Rename internally to prior and calculate final quality score |
| `reviewStatus = needs_review` for every generated item | Safety-first manual workflow | Replace normal path with automated validation and exception-only review |
| `MAX_GENERATED_PROMPTS = 18` | Draft-generator limit | Keep only for design preview; do not use as production panel compiler limit |
| 8 / 16 / 32 modes | Skill output modes | Rename as design-preview modes |
| 50 / 100 / 200 | Proposed measurement sizes | Keep as experimental production profiles |
| `shareOfVoice = visibilityRate` in eligibility code | Shared eligibility shortcut | Keep only as eligibility compatibility; calculate SOV under its own metric version |
| text-normalized deduplication | Surface duplicate prevention | Add semantic clustering and Intent Cells |
| nullable `promptSetVersion` | Draft support | Require immutable set version for active production measurement |
| current scope backfill based on text inference | Review aid | Never auto-promote; require explicit validated migration |

### 17.1 Existing data

Legacy rows are classified as one of:

- explicitly valid and migratable;
- review candidate;
- legacy retained without metric eligibility;
- invalid metadata requiring correction.

Historical results must be preserved. They may be labeled under the legacy measurement definition rather than recalculated as if the new contract had always applied.

---

## 18. Acceptance criteria

The contract is considered implemented only when all of the following are true:

1. No active production prompt exists without an Intent Cell.
2. Every active Core Intent Cell has one canonical prompt revision.
3. Prompt text and metric-affecting metadata are immutable by revision.
4. Active measurement always references a non-null prompt-set version.
5. Panel membership changes create a new set version.
6. Branded, named-comparison, competitor-only, criteria-only, and forced-citation prompts cannot enter market headline metrics incorrectly.
7. Natural citation and forced citation are separate.
8. Robustness variants do not multiply headline intent weight.
9. Valid answers, failures, refusals, and unsupported citation surfaces have explicit denominator handling.
10. Every run item has an execution and prompt snapshot.
11. SOV uses its own versioned formula.
12. Quality scores are calculated rather than copied from fixed template values.
13. Normal prompt generation and activation are automatic.
14. Human operators see only defined exceptions and major version changes.
15. Customer UI exposes understandable questions and sufficient denominator context.
16. Legacy inferred metadata cannot become official eligibility without validation.

---

## 19. Experimental decisions still open

The following remain explicit experiments:

- whether the production profiles remain 50 / 100 / 200;
- whether 38/8/4, 70/20/10, and 130/45/25 are the best allocations;
- repeat count and adaptive variance policy by provider and surface;
- minimum valid-response coverage for report publication;
- official SOV formula;
- business-priority and external-demand weighting;
- API, consumer UI, and search UI production roles;
- seasonal and event promotion rules;
- provider-model compatibility across time.

Each experiment must have an identifier, evaluation method, result, and decision record. An experimental value must not be silently treated as a permanent product invariant.

---

## 20. Implementation order

1. Adopt this document as the target contract.
2. Add new TypeScript domain types without removing current compatibility types.
3. Add explicit adapters between current and target classifications.
4. Implement deterministic metric-eligibility checks under the new model.
5. Add additive database structures for Intent Cells, revisions, set versions, memberships, execution profiles, and snapshots.
6. Implement the panel compiler and semantic clustering.
7. Implement valid-response and aggregation policies.
8. Update measurement execution to freeze the full execution fingerprint.
9. Update administration read models and exception review.
10. Update customer read models and denominator presentation.
11. Run a read-only migration audit for existing prompts and runs.
12. Migrate only explicitly validated rows.
13. Activate the new contract per project or prompt-set version behind a controlled rollout.

No remote database migration, production backfill, metric recalculation, or customer-visible behavior change is authorized by this docs-only contract commit.
