# Exec Plan: Issue #144 Measurement Design Existing Foundation Retrofit

This is a living document for correcting Recora Measurement Design from a greenfield
11-table persistence plan to a minimal retrofit of the current Persona, Topic, Prompt,
and measurement-evidence foundation.

The current phase is **docs and planning only**. It does not authorize migration, DB
access, Local Supabase execution, runtime changes, or production operations.

## Metadata

| Field | Value |
|---|---|
| Issue | `#144` — `https://github.com/sushikikun/RECORA/issues/144` |
| Parent | `#136` |
| Supersedes | Issue #141 physical W1A/W1B plan and Issue #143 |
| Risk | `R1 docs correction`; future DB work is `R2` |
| Spec level | `Light` |
| Execution | `Cloud Codex / docs-only` |
| Approval | OWNER 2026-08-04: existing foundation minimal retrofit |
| Owner | `sushikikun` |
| Status | `Active / Human review pending` |
| Updated | `2026-08-04` |

This Exec Plan does not grant DB Execute approval.

---

## 1. Objective

Replace the incorrect implementation assumption:

```text
new Persona / Topic / Intent Cell / Prompt identity-revision database
+ Prompt Set versions
+ legacy cutover
```

with the actual product assumption:

```text
current personas / topics / prompts
+ fixed finalized prompt metadata
+ current run / item / conversation evidence
+ only the smallest missing fields and constraints
```

The result must be an implementation-ready direction without creating migration or
runtime code.

---

## 2. Context

The earlier design assumed prompts could change frequently and needed independent
version continuity. The OWNER clarified:

- prompts are finalized during onboarding;
- normal measurement uses the same prompts continuously;
- existing foundation should be changed rather than replaced.

No W1A migration, Local Supabase stack, DB write, commit, or PR was started under Issue
#143. Its Execute approval was explicitly revoked before implementation.

---

## 3. Confirmed repository evidence

Read-only repository inspection confirmed:

- `public.personas` exists and is project-scoped;
- `public.topics` exists and is project-scoped;
- `public.prompts` exists and links project, Topic, optional Persona, text, intent, buyer
  stage, priority, and active state;
- migration `20260701044743_recora_prompt_scope_fields.sql` already adds nullable
  `prompt_type` and `measurement_purpose` with check constraints;
- `public.measurement_runs` exists for project periods;
- `public.run_items` binds run, prompt, Persona, and AI model;
- `public.ai_conversations` stores exact prompt text snapshot, model snapshot, provider,
  requested/returned model, web-search state, answer evidence, and timing;
- the Phase 3 tenant, RLS, entitlement, and audit foundation is already a formal
  dependency.

The current repository type `RecoraPromptRow` does not yet expose the prompt-scope
columns, which is a future implementation gap rather than a reason for a new database.

---

## 4. Scope

### In scope

- correct the Prompt and Measurement contract;
- add the existing-foundation physical direction;
- remove the greenfield canonical physical document from current authority;
- archive the superseded Issue #141 plan;
- update the documentation map;
- identify the smallest candidate prompt and evidence changes;
- identify follow-up code-contract work separately.

### Non-goals

- migration or SQL;
- Local, linked, remote, or production Supabase;
- row inventory or backfill;
- prompt generator changes;
- measurement runtime changes;
- customer or administrator UI;
- TypeScript contract deletion or simplification in this Issue;
- Ready, merge, deploy, or cutover.

---

## 5. Main decisions

### D1. Existing tables are the foundation

Reuse:

```text
public.personas
public.topics
public.prompts
public.measurement_runs
public.run_items
public.ai_conversations
public.ai_models
```

The initial implementation does not add a new parallel Prompt domain.

### D2. Prompts are fixed after finalization

Normal operation does not edit prompt text or measurement-affecting metadata.

The minimum implementation needs an explicit finalization state and mutation guard, not
Prompt Revision tables.

### D3. Intent grouping is a prompt field

Use a stable project-scoped `intent_key` or equivalent on finalized prompts.

An independent Intent Cell table is not initially required.

### D4. The project prompt collection is the fixed set

All finalized, measurement-enabled project prompts form the measurement set.

No Prompt Set identity/version/membership tables are initially required.

### D5. Existing evidence is reused

Prompt text and model/provider/search evidence already exist in
`ai_conversations` and related rows.

A new classification snapshot is added only if prompt immutability cannot preserve
historical interpretation.

### D6. Semantic metric rules remain

The simplified persistence direction does not weaken:

- market-metric exclusions;
- multi-metric eligibility;
- natural versus forced citation separation;
- Intent-balanced aggregation;
- valid-response denominator rules;
- tenant and publication boundaries.

---

## 6. Candidate minimal physical change

This is a candidate for a future R2 Plan, not approved DDL.

### 6.1 `public.prompts`

Evaluate only these additions:

```text
finalized_at or lifecycle_status
intent_key
panel_role
response_shape
candidate_mention_opportunity
ranking_opportunity
metric_eligibility
classification or eligibility policy version if required
```

Before selecting columns, reuse existing:

```text
prompt_type
measurement_purpose
intent
buyer_stage
priority
is_active
```

Every field must be classified as:

- reuse unchanged;
- add;
- derived in code;
- unnecessary;
- future.

### 6.2 Existing evidence chain

Evaluate whether current evidence is sufficient:

```text
run_items.prompt_id
ai_conversations.prompt_text_snapshot
ai_conversations.model_snapshot
provider / requested_model / returned_model
web_search_enabled
measured_at / captured_at
```

Do not add a snapshot field unless a concrete historical interpretation gap remains
after prompts are made immutable.

### 6.3 Existing DB types and code

Future implementation may need:

- DB row type updates for current prompt-scope columns;
- storage of finalized metadata;
- fixed-prompt mutation validation;
- metric calculation reading explicit finalized eligibility;
- generation-to-finalization materialization.

These are separate from the docs correction.

---

## 7. DB versus application responsibility

### DB candidates

- required values at finalization;
- checked role and response values;
- fixed prompt mutation guard;
- Topic and Persona project consistency;
- Intent-key and Core uniqueness where required;
- RLS and grants.

### Application validator candidates

- target brand and competitor contamination;
- response/opportunity consistency;
- criteria-only exclusion;
- natural/forced citation separation;
- Robustness/Core relationship;
- semantic duplicate detection;
- coverage;
- valid-response treatment.

Prompt-text inference may suggest metadata but never grant finalized eligibility.

---

## 8. Security boundary

The implementation must consume the latest Phase 3 tenant foundation and verify:

- organization/project ownership;
- current composite keys and constraints;
- Persona/Topic/Prompt/run tenant chains;
- RLS and grants;
- customer and operator paths.

It must not create a browser write path, generic mutation RPC, service-role actor model,
or weaker RLS.

---

## 9. Milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Stop obsolete implementation | `Completed` | Revoke #143 Execute and close as superseded | No Local/DB task may start |
| M2: Read-only foundation audit | `Completed` | Inspect base schema, prompt-scope migration, DB row types | Existing tables and gaps recorded |
| M3: Correct formal docs | `In progress` | Replace greenfield persistence authority and archive old plan | Docs consistently state minimal retrofit |
| M4: Docs CI and Human review | `Pending` | Exact diff, preflight, lint, build | CI PASS and Draft PR ready |
| M5: Follow-up decision | `Pending` | Decide whether TypeScript contract simplification is needed | Separate Issue or documented no-change |
| M6: Future R2 Plan | `Pending` | Create exact minimal migration plan after review | Plan/Execute remain separate |

---

## 10. Validation plan

| Validation | Expected result | Actual result |
|---|---|---|
| #143 state | closed / not planned / Execute revoked | Completed |
| repository evidence review | current tables and snapshots confirmed | Completed |
| authority consistency | no current greenfield physical authority remains | Pending final diff |
| changed files | approved docs only | Pending |
| whitespace | no error | Pending CI |
| Recora preflight/typecheck | PASS | Pending CI |
| lint | PASS | Pending CI |
| build | PASS | Pending CI |
| secret/env/token/DB URL values | none | Pending final review |

---

## 11. Rollback

This phase changes documentation only.

If the correction is rejected:

1. close the docs PR without merge;
2. retain #143 as closed until a new explicit OWNER decision reauthorizes it;
3. preserve Issue and Git evidence;
4. do not start DB work.

There is no production rollback because no DB or runtime change occurs.

---

## 12. Stop conditions

Stop before DB planning when:

- the current schema cannot safely support fixed finalized prompts;
- the Phase 3 tenant foundation must be redesigned;
- the existing TypeScript contract makes docs-only correction insufficient;
- a new table is proven necessary but its product requirement is unclear;
- DB inspection beyond repository evidence is required;
- docs scope must expand to runtime or migration files.

---

## 13. Progress log

| Date | Milestone | Update | Next step |
|---|---|---|---|
| 2026-08-04 | M1 | #143 Execute revoked; Issue closed as superseded | Create correction Issue |
| 2026-08-04 | M2 | Existing prompt and evidence foundation confirmed from repository | Correct formal docs |
| 2026-08-04 | M3 | Issue #144 and correction branch created | Complete docs and CI |

---

## 14. Decision log

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-08-04 | Reuse existing Persona/Topic/Prompt foundation | Prompts remain fixed after onboarding | No new identity/revision hierarchy |
| 2026-08-04 | No initial Prompt Set tables | Project finalized prompts are fixed | Smaller migration and runtime scope |
| 2026-08-04 | Reuse current conversation snapshots | Prompt/model evidence already exists | New snapshot only if proven necessary |
| 2026-08-04 | Keep semantic eligibility rules | Simpler persistence must not reduce metric quality | Validators remain fail closed |
| 2026-08-04 | Separate TypeScript simplification decision | Docs correction should not hide code impact | Follow-up after Human review |

---

## 15. Results and remaining risks

### Expected result

- formal docs match the fixed-prompt product;
- obsolete W1A execution is safely stopped;
- current tables are the official starting point;
- future DB work can be a small R2 migration rather than a new subsystem.

### Remaining risks

- exact prompt metadata columns are not yet selected;
- current Phase 3 catalog constraints need local verification before migration;
- `RecoraPromptRow` type drift remains;
- the merged TypeScript contract still contains larger future aggregate types and may
  require a separate simplification Issue;
- existing deployed rows may lack explicit prompt scope metadata;
- no backfill is authorized.

### Completion record

- Final status: `Active / Human review pending`
- Follow-up: separate TypeScript-contract review and minimal R2 migration plan
- Archive path after completion:
  `docs/exec-plans/completed/issue-144-measurement-design-existing-foundation-retrofit.md`