# Recora Measurement Design Existing Foundation v1

Status: **Formal target / docs-only correction**
Issue: **#144**
Last updated: **2026-08-04**
Implementation status: **Not implemented**
Production / remote DB authorization: **None**

## 0. Purpose

This document defines how Recora Prompt and Measurement Design uses the current Persona,
Topic, Prompt, run, and conversation foundation.

The product assumption is simple:

```text
onboarding finalizes the prompts
→ ongoing measurement reuses the same prompts
```

The target is therefore a minimal retrofit of the current foundation, not a new prompt
database.

The earlier greenfield identity/revision and Prompt Set design was useful design
exploration, but it is not the current physical implementation target.

## 0.1 Authority

1. latest OWNER decision in Issue #144;
2. this document;
3. `docs/recora-prompt-measurement-contract-v1.md` for semantic rules;
4. `docs/recora-data-tenant-security-privacy.md` for tenant and privacy foundations;
5. adopted Recora Admin P0 contracts;
6. current repository implementation facts.

---

## 1. Position in the Recora-wide structure

This capability remains inside:

```text
Business and operations foundation
└─ Prompt and measurement design
```

It receives approved onboarding and project context, finalizes the fixed prompts, and
hands them to Measurement Execution.

It does not own provider execution, answer analysis, quality, publication, or screen
state.

---

## 2. Confirmed current foundation

The following facts are confirmed from current repository migrations and types.

## 2.1 Project design tables

### `public.personas`

Current role:

- project-scoped Persona definition;
- name and segment;
- weight;
- jobs and pain points;
- active state.

Initial target:

- reuse;
- do not split into identity and revision tables;
- add fields only when a concrete onboarding or analysis requirement cannot be stored
  safely in the current definition.

### `public.topics`

Current role:

- project-scoped Topic definition;
- name and intent;
- priority and weight;
- active state.

Initial target:

- reuse;
- do not split into identity and revision tables;
- keep buyer-stage and expected-signal differences at prompt level where needed.

### `public.prompts`

Current fields include:

- `project_id`;
- `topic_id`;
- optional `persona_id`;
- `text`;
- `intent`;
- `buyer_stage`;
- `priority`;
- `is_active`;
- timestamps.

The existing additive migration
`20260701044743_recora_prompt_scope_fields.sql` also defines:

- `prompt_type`;
- `measurement_purpose`;
- check constraints for their current values.

Initial target:

- reuse as the finalized prompt definition table;
- add only the minimum data required to freeze prompts and calculate metrics correctly;
- keep `prompt_type` and `measurement_purpose` as compatibility fields;
- do not treat one `measurement_purpose` as the complete metric authority.

## 2.2 Measurement evidence tables

### `public.measurement_runs`

Current role:

- one project measurement period;
- status;
- period and comparison period;
- region and language;
- start and completion timestamps.

Initial target:

- reuse;
- do not add a new Measurement Design aggregate unless a later product requirement
  demonstrates that the existing run relationship is insufficient.

### `public.run_items`

Current role:

- binds one run, prompt, Persona, and AI model;
- records queued/completed/failed/skipped state;
- records latency, capture time, and error.

Initial target:

- reuse;
- verify current Phase 3 tenant/project integrity before any new migration;
- add snapshot data only when the current evidence chain cannot reproduce the
  interpretation of a completed item.

### `public.ai_conversations`

Current evidence already includes:

- raw answer and answer hash;
- exact `prompt_text_snapshot`;
- `model_snapshot`;
- provider;
- requested and returned model;
- response ID and raw response;
- usage;
- web-search state;
- citation status;
- measurement and response timing.

Initial target:

- reuse;
- do not duplicate prompt text or model evidence in a new table;
- add a classification snapshot only if fixed-prompt immutability cannot guarantee
  historical interpretation.

### `public.ai_models`

Current role:

- provider and model identity;
- display name and active state.

Initial target:

- reuse;
- actual provider/model differences remain answer evidence rather than rewriting the
  prompt definition.

---

## 3. Product invariants

The minimal retrofit must make the following true.

1. prompts are finalized before normal measurement;
2. finalized prompt text and measurement-affecting metadata do not change silently;
3. the project reuses the same finalized prompts for each normal measurement cycle;
4. each prompt remains linked to its existing Persona and Topic;
5. equivalent wording variants share one stable intent grouping;
6. Core, Robustness, and Diagnostic prompts are distinguishable;
7. prompt metric eligibility is explicit and multi-metric;
8. branded, named, competitor-seeded, criteria-only, and forced-citation prompts do not
   contaminate market metrics;
9. provider/model/search evidence remains reproducible from current run evidence;
10. provider failure is not interpreted as brand absence;
11. tenant and project isolation continue to use the accepted Phase 3 foundation;
12. customer and administrator browsers do not directly mutate prompt or raw
    measurement tables.

---

## 4. Minimum gap assessment

The following are candidates for the smallest safe retrofit. They are not yet approved
DDL.

## 4.1 Prompt finalization

Current gap:

- `public.prompts.is_active` does not distinguish an editable candidate from a finalized
  measurement prompt;
- the table has an ordinary updated-at trigger and no confirmed measurement-field freeze.

First-choice change:

- add a finalized state or `finalized_at`;
- require finalized metadata before a prompt is measured;
- reject updates to prompt text, mappings, classification, and eligibility after
  finalization.

No Prompt Revision table is required under the fixed-prompt assumption.

## 4.2 Intent grouping

Current gap:

- there is no confirmed stable key grouping paraphrases of the same buyer need.

First-choice change:

- add a project-scoped `intent_key` or equivalent validated field on `public.prompts`;
- require every finalized Core or Robustness prompt to have the key;
- aggregate at `intent_key` before project totals.

No Intent Cell table is required initially.

## 4.3 Panel role

Current gap:

- Core, Robustness, and Diagnostic roles are not confirmed as first-class DB data.

First-choice change:

- add a small checked `panel_role` field to `public.prompts`;
- permit only the roles required by the fixed prompt product;
- require a Core prompt for every intent that has a Robustness prompt.

No Prompt Set or membership table is required initially.

## 4.4 Response and opportunity metadata

Current gap:

- `prompt_type` alone does not always prove that a candidate or ranking opportunity
  exists;
- criteria-only prompts can otherwise be misclassified.

First-choice change:

- add the smallest validated representation of response shape and candidate/ranking
  opportunity;
- prefer explicit fields over prompt-text inference for finalized prompts.

Possible fields:

```text
response_shape
candidate_mention_opportunity
ranking_opportunity
```

The exact number of columns is determined by the later R2 physical plan.

## 4.5 Multi-metric eligibility

Current gap:

- `measurement_purpose` is one value;
- one prompt may legitimately support multiple analyses;
- natural and forced citation need separate flags.

First-choice options:

1. a fixed checked JSON object on `public.prompts`;
2. explicit boolean/state columns for the nine metric keys.

A separate eligibility table is not required unless the physical review proves it is
safer or substantially simpler.

The final representation must be typed, validated, deterministic, and protected after
finalization.

## 4.6 Historical classification evidence

Current evidence:

- prompt text is already snapshotted;
- model and provider details are already snapshotted or stored as answer evidence.

Decision rule:

- if prompt classification and eligibility become immutable after finalization, do not
  duplicate them per run;
- if the current schema permits historical interpretation to drift, add one narrow
  validated snapshot object to the existing evidence chain;
- do not create a new snapshot hierarchy without proof of need.

---

## 5. Fixed measurement set

The initial prompt set is:

```text
all finalized, measurement-enabled prompts for the project
```

The set is stable because normal product operation does not edit, add, or remove prompts
after finalization.

Therefore initial implementation does not require:

- `prompt_sets`;
- `prompt_set_versions`;
- `prompt_set_memberships`;
- panel compilation persistence;
- a legacy-to-canonical prompt cutover.

The measurement job must fail closed when:

- an expected finalized prompt is missing;
- a prompt lacks required classification or eligibility;
- prompt count or grouping differs from the confirmed configuration;
- a prompt has been modified after finalization.

A small deterministic project-level fingerprint may be evaluated later if needed to
prove the collection has not changed. It does not require a Prompt Set table.

---

## 6. What remains in application validation

The database should enforce simple structural integrity. Application validators enforce
semantic rules.

### DB or constraint candidates

- allowed enum/check values;
- finalized required fields;
- immutable measurement-affecting prompt fields;
- project-scoped intent-key uniqueness where appropriate;
- one Core prompt per project and intent key, if the fixed product requires it;
- Topic and Persona ownership consistency using the accepted tenant/project keys;
- no direct browser write grants.

### Application validator candidates

- target-brand and known-competitor contamination;
- candidate/ranking opportunity consistency;
- criteria-only market-metric exclusion;
- natural versus forced citation separation;
- Robustness requires Core;
- semantic duplicate detection;
- required Persona, Topic, and buyer-stage coverage;
- valid-response and denominator treatment.

The validator remains fail closed. Prompt-text inference may propose a candidate but does
not grant official eligibility.

---

## 7. Tenant, RLS, and access boundary

The Phase 3 tenant and security foundation is consumed without redefinition.

Before any physical migration, the implementation must verify the latest local catalog
for:

- organization ownership of the project;
- project composite keys;
- Persona, Topic, Prompt, run, item, and conversation tenant chains;
- RLS and grants;
- customer/browser access;
- private helper conventions.

The minimal retrofit must not:

- weaken current RLS;
- trust caller-supplied organization substitution;
- expose prompt or raw measurement tables to customer browsers;
- create a generic mutation RPC;
- treat service role as operator identity.

---

## 8. Minimal implementation candidates

A later R2 Plan should attempt to keep the implementation to one or two additive
migrations and a small verifier set.

### Candidate change A: finalized prompt metadata

Target:

- `public.prompts` only.

Possible additions:

```text
finalized_at or lifecycle_status
intent_key
panel_role
response_shape
candidate_mention_opportunity
ranking_opportunity
metric_eligibility
classification_version or eligibility_policy_version when required
```

The exact list must be reduced after checking what can be safely represented by existing
`prompt_type`, `measurement_purpose`, `intent`, and `buyer_stage`.

### Candidate change B: evidence gap only if proven

Target:

- existing `run_items` or `ai_conversations` only.

Possible addition:

- one prompt-classification/eligibility snapshot object.

This change is omitted when finalized prompt immutability is sufficient.

### Candidate code changes

- update DB types for existing and new prompt fields;
- align prompt eligibility calculation with stored finalized metadata;
- add a fixed-prompt finalization verifier;
- preserve current prompt-generation and measurement runtime until separately approved.

---

## 9. Explicitly not required

The initial fixed-prompt model does not require:

- a new `control` Prompt domain;
- Measurement Design identity/version tables;
- Persona identity/revision tables;
- Topic identity/revision tables;
- Intent Cell identity/revision tables;
- Prompt identity/revision tables;
- Prompt Set identity/version/membership tables;
- Execution Profile Set tables;
- Policy Bundle tables;
- legacy import batches;
- shadow write and cutover infrastructure;
- a second Supabase project.

These are reconsidered only after a concrete product requirement demonstrates that the
existing foundation cannot safely represent it.

---

## 10. Exceptional prompt replacement

The normal product does not change prompts after finalization.

If a future customer must replace the measurement question set, the product must make a
separate decision about:

- whether the old and new periods are comparable;
- whether to create a new project measurement configuration;
- how the customer UI labels the break;
- whether previous-period deltas are suppressed.

That future workflow must not be pre-built into the initial database without need.

---

## 11. Implementation sequence

1. read-only inventory of the latest schema, columns, constraints, RLS, grants, and code
   paths;
2. classify every proposed field as reuse, add, unnecessary, or future;
3. choose the smallest prompt metadata representation;
4. determine whether any new run snapshot is actually needed;
5. write a separate R2 Plan with migration, local validation, rollback, and exact files;
6. obtain separate Execute approval;
7. implement only in dedicated Local Supabase;
8. stop before remote or production application.

---

## 12. Acceptance criteria

The minimal retrofit design is complete when:

1. current Persona, Topic, Prompt, run, item, and conversation tables remain the
   foundation;
2. no new greenfield identity/revision hierarchy is required;
3. prompts are explicitly finalized and protected;
4. Intent grouping and panel role are explicit;
5. multi-metric eligibility is explicit;
6. market-metric contamination is fail closed;
7. existing prompt text and model evidence are reused;
8. no redundant snapshot table is introduced;
9. tenant and project isolation remain intact;
10. a future R2 implementation can name an exact small migration scope.

---

## 13. Supersession record

This document supersedes the physical direction previously stored at
`docs/recora-measurement-design-canonical-data-model-v1.md` and the W1A/W1B new-table
plan in Issue #141.

The previous documents remain available in Git history as design exploration. No W1A
migration or database operation was performed before supersession.