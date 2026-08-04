# Recora Fixed Prompt Configuration Schema v1

Status: Unit A local implementation
Issue: #148
Source plan: `docs/exec-plans/active/issue-146-measurement-design-minimal-prompt-retrofit.md`
Scope: existing `public.projects` and `public.prompts` only

## Purpose

This schema adds the minimum physical contract needed to freeze a project's fixed Prompt configuration while preserving the existing Persona, Topic, Prompt, run, and conversation foundation.

No new application table is introduced. Unit A does not materialize setup drafts, create finalization commands/RPCs, backfill existing rows, write measurement metadata, or change runtime/UI behavior.

## Project Columns

`public.projects` adds four nullable fields:

- `prompt_configuration_finalized_at timestamptz`
- `prompt_configuration_hash text`
- `prompt_configuration_contract_version text`
- `prompt_configuration_count integer`

The project configuration is valid only when all four fields are null or all four are non-null. The hash must be lowercase SHA-256 hex, the contract version must be non-empty, and count must be at least one.

Once `prompt_configuration_finalized_at` is non-null, the four configuration fields are immutable by ordinary `UPDATE`. The initial all-null to all-non-null finalization path remains possible for a future server-side Unit B command.

## Prompt Columns

`public.prompts` adds six nullable fields:

- `intent_key text`
- `panel_role text`
- `response_shape text`
- `candidate_mention_opportunity text`
- `ranking_opportunity text`
- `metric_eligibility jsonb`

`intent_key` is lowercase kebab-case when present. `panel_role` is limited to `core`, `robustness`, and `diagnostic`. Response and opportunity fields use the fixed value sets recorded in Issue #148.

## Metric Eligibility JSON

`metric_eligibility` is nullable before finalization. When present, it must be a JSON object with exactly these top-level keys:

- `visibility`
- `ranking`
- `sov`
- `sentiment`
- `brand_perception`
- `natural_citation_observation`
- `forced_citation_validation`
- `risk_check`
- `recommendation_input`

Each key maps to an object with only `state` and `reason_codes`. `state` is `eligible` or `excluded`. `reason_codes` is a non-empty string array, and each reason code is lowercase snake_case.

Unit A validates structure only. Semantic alignment between prompt type, response shape, opportunities, target brand, competitors, and metric eligibility belongs to Unit B finalization validation.

## Guard Design

The migration uses private helper functions in `recora_private` with fixed `search_path = ''`. They are not `SECURITY DEFINER`, and direct `EXECUTE` is revoked from `public`, `anon`, `authenticated`, and `service_role`.

The Prompt guard rejects ordinary `INSERT`, `UPDATE`, and direct `DELETE` for prompts whose project is finalized. Parent project deletion/retention cascade is allowed so existing project lifecycle behavior is not blocked.

The Project guard rejects rewrites to finalized configuration fields after finalization.

## Security And Compatibility

Existing RLS policies and grants are preserved. Browser roles receive no new write grants. Existing rows remain valid with all ten new columns null. Existing `prompts -> topics/personas` project integrity is reused from the composite tenant isolation migration.

## Verification

Expected local validation for Issue #148:

- static verifier before DB startup: `npm run recora:fixed-prompt-schema:static-check`
- migration-only reset with `--local --no-seed`
- DB verifier against `supabase_db_recora-fixed-prompt-unit-a`
- seeded reset with `--local`
- DB verifier again
- second reset/replay
- RLS/grant/function inventory
- security and performance advisors
- `npm run recora:prompt-measurement-contract:check`
- `npm run recora:preflight:full`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

Remote, linked, and production Supabase are out of scope. Human review remains the stopping point after Draft PR creation.
