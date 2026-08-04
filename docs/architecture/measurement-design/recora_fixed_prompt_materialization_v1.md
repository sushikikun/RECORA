# Recora Fixed Prompt Materialization Contract v1

Source issue: GitHub Issue #154
Source plan: `docs/exec-plans/active/issue-152-fixed-prompt-materialization-finalization.md`
Contract version: `recora_fixed_prompt_configuration_v1`

## Scope

Unit B1 is a pure code contract. It does not connect to Supabase, run migrations, seed data, create application tables, write Persona/Topic/Prompt rows, finalize Projects, change the bootstrap writer, or touch runtime/UI/API/provider behavior.

The contract converts an approved `ProjectSetupDraft` into the deterministic data shape that a later Unit B2 transactional writer can persist into the existing Unit A columns on `projects` and `prompts`.

```text
approved ProjectSetupDraft
-> explicit intentKey / panelRole
-> 9-key metric_eligibility
-> compatibility prompt_type / measurement_purpose
-> deterministic DB UUID mapping
-> canonical prompt collection
-> SHA-256 hash / count
```

## PromptDraft Metadata

`PromptDraft` has additive optional fields:

```ts
intentKey?: string
panelRole?: "core" | "robustness" | "diagnostic"
```

The fields are optional for compatibility with existing draft fixtures and readers. They are required by fixed-prompt materialization. The materializer never infers them from prompt text.

The generator assigns both fields from its internal semantic `variantKey` mapping. The initial generator does not synthesize `robustness` prompts because it does not create true paraphrase pairs.

`intentKey` must be lowercase kebab-case. It is based on semantic variant grouping plus topic/persona stable components when they matter; it is not a topic ID alone and not a prompt text hash.

## Metric Eligibility

`metric_eligibility` uses the exact Unit A keys:

```text
visibility
ranking
sov
sentiment
brand_perception
natural_citation_observation
forced_citation_validation
risk_check
recommendation_input
```

Each key maps to:

```json
{ "state": "eligible", "reason_codes": ["deterministic_reason"] }
```

or:

```json
{ "state": "excluded", "reason_codes": ["deterministic_reason"] }
```

Every metric has non-empty deterministic reason codes. Reason codes are deduplicated and sorted lexicographically.

Market metrics require a brand-excluded prompt, no known competitor pre-seeding, no brand-optional wording, no forced citation request, a market-capable response shape, acceptable seed contamination, and direct or likely candidate/ranking opportunity. SOV requires visibility eligibility.

Branded metrics require explicit self-branded prompts. Forced citation validation and natural citation observation are mutually exclusive. Risk-only and recommendation-input-only prompts may be materialized as diagnostic prompts when all other readiness gates pass.

## Compatibility Fields

`prompt_type` is deterministic with this priority:

1. forced citation -> `citation_check`
2. target brand plus known competitor -> `comparison_named`
3. target brand or self-branded -> `branded`
4. competitor-only or named competitor -> `competitor_named`
5. non-branded comparison -> `comparison_generic`
6. otherwise -> `non_branded`

`measurement_purpose` is only a compatibility hint. Multi-metric eligibility remains authoritative. Non-null hints must point to an eligible metric. Generic comparison prompts may carry `null` when the older single-purpose scope cannot safely represent the market purpose.

## Stable IDs

The materializer creates deterministic UUIDs from project slug plus source ID:

```text
persona UUID = stableUuid(projectSlug, "persona:" + personaId)
topic UUID   = stableUuid(projectSlug, "topic:" + topicId)
prompt UUID  = stableUuid(projectSlug, "prompt:" + promptId)
```

Prompt text is never the only identity input. Project ID is supplied by the caller for future DB materialization; when omitted in pure tests, the same stable UUID function can derive a fixture project ID.

## Canonical Hash

Canonical prompt objects contain:

```text
id
project_id
topic_id
persona_id
text
intent
buyer_stage
priority
is_active
prompt_type
measurement_purpose
intent_key
panel_role
response_shape
candidate_mention_opportunity
ranking_opportunity
metric_eligibility
contract_version
```

The hash payload includes the contract version, project ID, and canonical prompts sorted by DB prompt UUID ascending. It excludes timestamps, provider responses, row order, input array order, and any external execution state.

Canonical JSON sorts object keys recursively, preserves the Unit A metric key order inside `metric_eligibility`, normalizes text to Unicode NFC, normalizes line endings to LF, rejects `undefined`, and hashes the resulting JSON with lowercase SHA-256.

## Fail-Closed Validation

Materialization fails closed for:

- duplicate Persona, Topic, or Prompt source ID
- missing Persona or Topic reference
- missing or invalid `intentKey`
- missing or invalid `panelRole`
- more than one Core prompt for the same project and intent key
- Robustness without a same-intent Core prompt
- Core or Robustness prompt that is not materialization-ready
- brand-optional prompts
- medium or high seed contamination
- no eligible analysis
- target brand contamination in brand-excluded prompts
- known competitor contamination outside named-competitor scope
- natural and forced citation eligibility on the same prompt
- compatibility hint mismatch

Diagnostic-only intents are allowed when the prompt has explicit metadata and at least one eligible analysis.

## Verification

The B1 verifier is `npm run recora:fixed-prompt-materialization:check`. It covers generator metadata, 9-key metric eligibility, negative fail-closed cases, stable UUID repeatability and sensitivity, canonical JSON stability, hash sensitivity, and exact prompt count behavior.

Required repository checks for this unit are the Issue #154 command set, including project setup draft checks, generator check/eval, prompt measurement contract check, Unit A static schema check, B1 verifier, preflight, typecheck, lint, build, and `git diff --check`.