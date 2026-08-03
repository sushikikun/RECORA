# Superseded Exec Plan Record: Issue #141 Measurement Design Wave 1 Foundation

Status: **Superseded before implementation**
Issue: **#141**
Superseded by: **Issue #144**
Date: **2026-08-04**

## Original plan

Issue #141 planned a greenfield Measurement Design Wave 1 split:

```text
W1A
Persona / Topic / Intent Cell / Prompt identity and revision tables

W1B
Prompt Set / membership / validation tables
```

The plan was documentation only. It was merged after CI passed.

## Superseding OWNER decision

The OWNER clarified that prompts are finalized during onboarding and normally do not
change during ongoing measurement.

The correct physical direction is:

```text
reuse current public.personas / public.topics / public.prompts
reuse current measurement_runs / run_items / ai_conversations evidence
add only the minimum finalization, grouping, classification and eligibility fields
```

The new identity/revision and Prompt Set table hierarchy is not an initial product
requirement.

## Execution record

- No W1A migration was created.
- No W1B migration was created.
- No Local Supabase environment was started.
- No DB, seed, backfill, runtime, or production operation occurred.
- Issue #143's Execute approval was revoked and the Issue was closed as not planned.

## Result

The plan is retained only as historical design evidence.
It must not be used as an implementation instruction.

Current authority:

- Issue #144;
- `docs/recora-prompt-measurement-contract-v1.md`;
- `docs/recora-measurement-design-existing-foundation-v1.md`;
- `docs/exec-plans/active/issue-144-measurement-design-existing-foundation-retrofit.md`.