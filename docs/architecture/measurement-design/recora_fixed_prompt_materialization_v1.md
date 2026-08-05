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

The fields are optional for compatibility with existing draft fixtures and readers. They are required by fixed-prompt materialization. The materializer never infers them from prompt text. Prompt text itself is also required and must remain non-empty after whitespace and line-ending normalization.

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

Market metrics require a brand-excluded prompt, no separator-insensitive target-brand signal, no known competitor pre-seeding, no brand-optional wording, no forced citation request, a market-capable response shape, acceptable seed contamination, and direct or likely candidate/ranking opportunity. SOV requires visibility eligibility.

Authoritative competitor context is a conservative merge of `seedInput.knownCompetitors`, `seedInput.avoidCompetitors`, approved `draft.competitors` identity fields (`rawName`, `normalizedName`, `brandAliases`, `companyName`, `productName`, and `domain`), and explicit caller-provided known competitors or aliases. Caller input adds to this context; it does not erase approved draft context. Any unapproved draft competitor blocks formal materialization. `competitor_only` and `named_competitors` prompts require both non-empty authoritative known competitor context and a known competitor signal in the prompt text; missing context fails with `known_competitor_identity_context_missing`, and missing text signal fails with `competitor_only_text_missing_known_competitor` or `named_competitor_text_missing_known_competitor`.

Authoritative target brand context is also conservative. Caller `input.brandIdentity` cannot erase the Draft brand identity: Draft brand name remains primary, Draft service/site/domain fields are preserved when present, and caller brand values only fill missing fields or add aliases for matching/contamination detection. Target-brand signals are built from Draft brand name, service name, aliases, official-site hostname, domain, and conservatively merged caller brand identity. B1 normalizes target and competitor signals with NFKC, lowercase, and separator removal so spaces, hyphens, underscores, punctuation, and width differences cannot hide identity matches. Metric eligibility, identity validation, and compatibility projection use this same target-brand detector.

Target-brand and known-competitor normalized signal sets must be disjoint. Any intersection fails formal materialization with `competitor_identity_overlaps_target_brand`. Named-comparison and competitor-only text matching must be satisfied by a distinct known competitor signal that does not overlap target-brand identity.

Branded metrics require explicit self-branded prompts. Forced citation validation and natural citation observation are mutually exclusive. `risk_check` eligibility is explicit: `intentType === "risk_checking"` or a closed risk semantic intent-key group (`implementation-risk`, `regulated-risk`, `price-reputation-risk`, or `local-price-reputation-risk`). Arbitrary quality or review `riskFlags` are not eligibility authority. Risk-only and recommendation-input-only prompts may be materialized as diagnostic prompts when all other readiness gates pass.

## Compatibility Fields

`prompt_type` is deterministic with this priority:

1. forced citation -> `citation_check`
2. competitor-only metadata -> `competitor_named`
3. explicit self-branded plus named competitor metadata/context -> `comparison_named`
4. target brand or self-branded -> `branded`
5. named competitor -> `competitor_named`
6. non-branded comparison -> `comparison_generic`
7. otherwise -> `non_branded`

`measurement_purpose` is only a compatibility hint. Multi-metric eligibility remains authoritative. Non-null hints must point to an eligible metric. Generic comparison prompts may carry `null` when the older single-purpose scope cannot safely represent the market purpose. Contradictory metadata is not corrected from text inference; for example, a `competitor_only` prompt that contains the target brand fails closed instead of being reclassified as `comparison_named`.

## Stable IDs

The materializer creates deterministic UUIDs from project slug plus source ID:

```text
persona UUID = stableUuid(projectSlug, "persona:" + personaId)
topic UUID   = stableUuid(projectSlug, "topic:" + topicId)
prompt UUID  = stableUuid(projectSlug, "prompt:" + promptId)
```

Prompt text is never the only identity input. Source IDs are trimmed and Unicode NFC-normalized before the scoped UUID input is built. If two different raw Persona, Topic, or Prompt source IDs collapse to the same stable UUID after that normalization, materialization fails closed. When both Draft `projectSlug` and caller `input.projectSlug` are present, their trimmed/NFC-normalized values must match exactly or materialization fails with `project_slug_mismatch`. Project ID is supplied by the caller for future DB materialization; when omitted in pure tests, the same stable UUID function can derive a fixture project ID.

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

- empty or whitespace-only Prompt text
- duplicate Persona, Topic, or Prompt source ID
- duplicate Persona, Topic, or Prompt stable UUID after trim/NFC source ID normalization
- missing Persona or Topic reference
- missing or invalid `intentKey`
- missing or invalid `panelRole`
- more than one Core prompt for the same project and intent key
- Robustness without a same-intent Core prompt
- Core or Robustness prompt that is not materialization-ready
- brand-optional prompts
- medium or high seed contamination
- no eligible analysis
- target brand contamination in brand-excluded prompts, including separator, punctuation, and width variants
- known competitor contamination outside named-competitor scope
- target-brand and known-competitor identity overlap (`competitor_identity_overlaps_target_brand`)
- missing authoritative known competitor context for competitor-only or named-competitor prompts
- competitor-only or named-competitor prompt text without a distinct known competitor signal
- unapproved draft competitor records
- competitor-only prompts that contain the target brand
- caller brand identity that would otherwise erase Draft brand context
- Draft/caller project slug mismatch
- natural and forced citation eligibility on the same prompt
- compatibility hint mismatch

Diagnostic-only intents are allowed when the prompt has explicit metadata and at least one eligible analysis.

## Verification

The B1 verifier is `npm run recora:fixed-prompt-materialization:check`. It covers generator metadata, 9-key metric eligibility, negative fail-closed cases, prompt text non-empty checks, separator-insensitive target-brand detection, approved draft competitor context, required distinct known-competitor context/text signals for competitor-only and named-competitor prompts, target/competitor identity overlap rejection, conservative caller/Draft brand identity merging, Draft/caller project slug mismatch, risk semantic eligibility without `riskFlags` heuristics, competitor-only identity contradictions, stable UUID repeatability/collision behavior, canonical JSON stability, hash sensitivity, and exact prompt count behavior.

Required repository checks for this unit are the Issue #154 command set, including project setup draft checks, generator check/eval, prompt measurement contract check, Unit A static schema check, B1 verifier, preflight, typecheck, lint, build, and `git diff --check`.
