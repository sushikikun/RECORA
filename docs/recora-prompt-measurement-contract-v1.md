# Recora Prompt & Measurement Contract v1

Status: **Formal target contract / existing-foundation amendment**
Last updated: **2026-08-04**
Authority: **Latest OWNER-approved Recora product direction**
Implementation status: **Partially implemented**
Production / remote DB authorization: **None**

## 0. Latest OWNER amendment

This document is the formal contract for Recora Prompt and Measurement Design.
The latest product decision changes the physical implementation direction while keeping
the core measurement rules.

The formal assumptions are now:

1. prompts are generated and confirmed during onboarding;
2. finalized prompts normally do not change during ongoing measurement;
3. current `public.personas`, `public.topics`, and `public.prompts` are the storage
   foundation;
4. current `public.measurement_runs`, `public.run_items`, `public.ai_conversations`, and
   `public.ai_models` are the measurement-evidence foundation;
5. only missing prompt-finalization, grouping, classification, eligibility, and evidence
   fields are added;
6. a new Persona / Topic / Intent Cell / Prompt identity-revision hierarchy is not an
   initial implementation requirement;
7. a separate Prompt Set Version database is not an initial implementation requirement;
8. legacy import, dual-write, and cutover infrastructure are not required for the fixed
   prompt operating model.

The earlier greenfield persistence model remains in Git history as design exploration.
It is not the current physical implementation target.

The semantic rules in this contract remain authoritative even when the existing tables
are used.

---

## 1. Position in the Recora-wide structure

```text
Customer and project management
        ↓
Customer onboarding
        ↓
Prompt and measurement design       ← this contract
        ↓
Measurement execution
        ↓
AI answer and citation analysis
        ↓
Quality and exception decisions
        ↓
Publication and report generation
        ↓
Customer-facing screens
```

Prompt and Measurement Design owns:

- Persona, Topic, and prompt generation and confirmation;
- prompt classification;
- prompt metric eligibility;
- grouping equivalent buyer intents;
- deciding which fixed prompts participate in normal measurement;
- handing finalized prompts to Measurement Execution.

It does not own:

- provider calls, queue, retry, or attempt execution;
- answer, mention, ranking, citation, or sentiment parsing;
- quality and publication decisions;
- customer or administrator screen state;
- tenant, entitlement, authorization, audit, or publication foundations.

## 1.1 Authority order

1. the latest OWNER decision recorded in the active Issue;
2. this document;
3. `docs/recora-measurement-design-existing-foundation-v1.md` for physical storage;
4. `docs/recora-data-tenant-security-privacy.md` for tenant and privacy boundaries;
5. adopted Recora Admin P0 state, authorization, audit, and measurement-management
   contracts;
6. `docs/recora-post-launch-operations-architecture.md` for the accepted
   `control / measurement / publication / api / audit` responsibilities;
7. current implementation facts where they do not conflict with the above.

---

## 2. Fixed-prompt operating model

The normal lifecycle is:

```text
onboarding inputs
→ Persona / Topic / prompt candidates
→ automatic validation
→ customer-facing confirmation of understandable themes and important questions
→ prompt finalization
→ repeated measurement with the same finalized prompts
```

After finalization, normal operation must not change:

- prompt text;
- Topic or Persona mapping;
- buyer stage;
- prompt type and classification;
- Intent grouping;
- panel role;
- metric eligibility.

The system may change operational data such as the latest run status, but not the meaning
of a finalized prompt.

An exceptional future requirement to replace the measurement questions must use a
separate approved reset or successor-design process. It must not silently edit the
prompts used by an existing time series. That exceptional process is outside the initial
implementation.

---

## 3. Existing storage foundation

The initial physical foundation is:

```text
projects
├─ personas
├─ topics
└─ prompts

measurement_runs
└─ run_items
   └─ ai_conversations
      ├─ brand_mentions
      └─ citations
```

### 3.1 Existing Persona and Topic

`public.personas` and `public.topics` remain the project-scoped definitions used by
finalized prompts.

They are not split into separate identity and revision tables in the initial
implementation.

### 3.2 Existing Prompt

`public.prompts` remains the prompt definition table.

It already stores:

- project;
- Topic;
- optional Persona;
- prompt text;
- intent;
- buyer stage;
- priority;
- active state.

The existing prompt-scope migration also defines nullable `prompt_type` and
`measurement_purpose` fields. These fields remain compatibility fields and partial
classification inputs. A single `measurement_purpose` is not the complete metric
eligibility authority.

### 3.3 Existing measurement evidence

`public.run_items` already binds a run, prompt, Persona, and AI model.

`public.ai_conversations` already preserves:

- exact prompt text snapshot;
- model snapshot;
- provider;
- requested and returned model;
- web-search state;
- capture and measurement timestamps;
- answer and provider evidence.

These fields must be reused before adding new snapshot structures.

---

## 4. Minimum prompt metadata

The minimum retrofit must evaluate the following prompt-level information.
Exact physical column names and JSON-versus-scalar choices require a separately approved
R2 migration plan.

### 4.1 Finalization

The database must distinguish an editable candidate from a finalized measurement prompt.
The first-choice representation is a finalized state or timestamp on `public.prompts`.

Finalization must fail closed when required classification or eligibility information is
missing.

After finalization, measurement-affecting fields must be protected from direct update.

### 4.2 Intent grouping

A project-scoped stable key such as `intent_key` groups prompts that represent the same
buyer need.

Example:

```text
intent_key: smb-attendance-recommendation
├─ canonical natural-language prompt
├─ search-like robustness wording
└─ diagnostic or control wording
```

This grouping prevents paraphrases from multiplying the headline denominator.

An independent Intent Cell table is not required for the initial fixed-prompt model.

### 4.3 Panel role

Each finalized prompt has one role:

- `core`: contributes to the normal headline intent panel;
- `robustness`: tests wording sensitivity within an existing Core intent;
- `diagnostic`: tests branded, citation-request, risk, control, or other non-headline
  behavior.

Seasonal and event prompts are not part of the initial fixed-prompt implementation unless
a separate product decision adds them.

### 4.4 Response and opportunity metadata

Metric eligibility must know whether the prompt naturally provides an opportunity for a
brand or candidate to appear.

The minimum contract distinguishes:

- candidate-list or recommendation response;
- ranked recommendation or comparable set;
- evaluation-criteria-only answer;
- explanatory answer;
- evidence or source-request answer;
- branded sentiment or perception answer.

The implementation may persist a `response_shape` plus candidate/ranking opportunity, or
an equivalent validated structure.

### 4.5 Multi-metric eligibility

A prompt may be eligible for more than one analysis. A single
`measurement_purpose` must not be treated as the complete authority.

Required metric keys are:

- visibility;
- ranking;
- SOV;
- sentiment;
- brand perception;
- natural citation observation;
- forced citation validation;
- risk check;
- recommendation input.

The physical representation may be a fixed validated JSON object or explicit columns.
A separate eligibility table is not required unless a later implementation proves it is
necessary.

---

## 5. Prompt type and brand rules

The existing prompt types remain useful compatibility categories:

- `non_branded`;
- `branded`;
- `comparison_generic`;
- `comparison_named`;
- `competitor_named`;
- `citation_check`.

They must be interpreted conservatively.

### 5.1 Market metrics

Visibility, ranking, and SOV require all of the following:

1. the prompt does not contain the target brand, target aliases, or target domain;
2. the prompt does not pre-seed a known competitor name;
3. candidate mention is a natural expected answer opportunity;
4. ranking uses a ranked recommendation or comparable candidate set;
5. the prompt is not criteria-only, explanation-only, branded sentiment, or forced
   citation;
6. prompt metadata is explicit and finalized;
7. the answer is valid under the valid-response policy.

### 5.2 Branded prompts

Branded prompts may support:

- sentiment;
- brand perception;
- reputation;
- strengths and weaknesses;
- fit and risk;
- factual/entity accuracy.

They must not enter market visibility, ranking, or SOV.

### 5.3 Named comparison and competitor prompts

Named comparison and competitor-seeded prompts may support comparison diagnostics and
recommendation inputs. They must not be interpreted as natural market discovery.

### 5.4 Citation prompts

A normal prompt may naturally produce citations. That is
`natural_citation_observation`.

A prompt that explicitly asks for sources is `forced_citation_validation`.

The two must never be combined into one citation-rate denominator.

---

## 6. Fixed measurement set

The initial measurement set is the finalized active prompt collection for one project.
No separate Prompt Set table is required.

The set is fixed by product behavior:

- prompts are finalized before normal measurement;
- no prompt is added, removed, or rewritten during normal ongoing measurement;
- the measurement scheduler uses the same finalized collection for each cycle;
- a configuration mismatch blocks the run rather than silently changing the denominator.

A separate versioned Prompt Set is a future option only if the product later supports
multiple concurrent panels, frequent prompt replacement, languages/regions with separate
panels, or formal successor designs.

---

## 7. Measurement evidence and execution conditions

Prompt text and provider/model evidence must remain reproducible.
The existing evidence hierarchy is reused.

At minimum a completed observation resolves to:

- measurement run;
- run item;
- finalized prompt;
- prompt text snapshot;
- Persona and Topic mapping;
- AI model identity;
- provider;
- requested and returned model;
- search mode or web-search state;
- locale and region;
- capture or measurement time;
- success, failure, refusal, or empty-answer status.

A new classification snapshot is unnecessary when finalized prompt metadata is truly
immutable. It is added only if a read-only audit proves historical interpretation cannot
be reproduced from the finalized prompt row and existing snapshots.

Model and provider behavior may change even when prompt text does not. Therefore model,
provider, search, and observation-time evidence remain mandatory.

---

## 8. Valid response and denominator rules

Provider errors, timeouts, invalid payloads, refusals, and empty answers are not brand
absence observations.

They must be separated from valid answers.

For a valid answer:

- eligible prompt and target brand not present → legitimate zero;
- provider failure or invalid answer → excluded from the brand-presence denominator and
  reported as coverage/completeness loss.

The customer report must show or preserve enough information to explain the denominator.

---

## 9. Aggregation order

The minimum aggregation order is:

```text
valid run item
→ prompt
→ intent_key
→ Topic / Persona / buyer stage
→ overall metric
```

Core prompts determine the headline intent panel.
Robustness prompts are summarized within or beside their Core intent and do not add
independent headline weight.
Diagnostic prompts are reported separately from market metrics.

Raw, intent-balanced, and business-weighted views must not be silently conflated.
Any weighting rule must be versioned in code or configuration and explained in the
published metric definition.

---

## 10. Quality and exception handling

Normal prompt generation and finalization should be automatic.
People handle defined exceptions only, such as:

- ambiguous business category;
- regulated or high-risk wording;
- target-brand or known-competitor contamination;
- unresolved semantic duplicate;
- missing important Topic or Persona coverage;
- conflict between customer-confirmed context and generated prompts;
- incomplete metric eligibility.

The customer is asked to confirm understandable themes and important questions, not
internal enums or eligibility fields.

---

## 11. Security and UI boundary

The accepted tenant and security foundation remains authoritative.

- every prompt belongs to one project and its organization;
- cross-project and cross-tenant references fail closed;
- customer browsers do not write prompt or raw measurement tables directly;
- administrator actions use authorized server commands and audit evidence;
- customer screens read only safe `api` or `publication` projections;
- provider payloads exclude tenant IDs, billing, audit data, internal notes, secrets, and
  unnecessary personal data.

The service role is an execution capability, not a human actor identity.

---

## 12. Initial implementation boundary

The next approved DB plan must start from the current schema and classify each proposed
change as:

- reuse unchanged;
- add one column or constraint;
- add one narrow snapshot field only if required;
- not needed;
- future requirement.

The initial implementation must not create:

- Persona identity/revision tables;
- Topic identity/revision tables;
- Intent Cell identity/revision tables;
- Prompt identity/revision tables;
- Prompt Set identity/version/membership tables;
- legacy import and cutover tables;
- a second Supabase project;
- a direct browser mutation API.

A migration is approved only after a separate R2 Plan and Execute decision.

---

## 13. Acceptance criteria

The existing-foundation implementation is ready only when:

1. finalized prompts cannot be silently rewritten;
2. all finalized prompts have explicit grouping, role, classification, and eligibility;
3. branded, named, competitor, criteria-only, and forced-citation prompts are excluded
   from inappropriate market metrics;
4. paraphrases do not multiply headline intent weight;
5. the same finalized prompt collection is used for ongoing measurement;
6. historical prompt text and provider/model/search evidence remain explainable;
7. provider failures are not counted as brand absence;
8. tenant and project isolation remain intact;
9. no unnecessary new table or dual-write path is introduced;
10. customer and administrator screens continue to use safe read and command boundaries.

---

## 14. Superseded implementation assumptions

The following are not current initial requirements:

- a greenfield Measurement Design database independent of current prompt tables;
- stable identity plus immutable revision tables for every Persona, Topic, Intent Cell,
  and Prompt;
- a mandatory Prompt Set Version hierarchy;
- one-way legacy import and cutover infrastructure for prompts;
- 50 / 100 / 200 profiles as a physical database requirement;
- changing prompts from period to period.

These may be reconsidered only when a demonstrated product requirement cannot be handled
safely by the fixed existing foundation.