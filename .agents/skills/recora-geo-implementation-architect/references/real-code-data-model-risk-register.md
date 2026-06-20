# Real Code Data Model Risk Register

## CONFIRMED_FROM_FILES

- The generator's local `TABLES` list includes:
  - `measurement_runs`
  - `run_items`
  - `ai_conversations`
  - `brand_mentions`
  - `citations`
  - `source_domains`
  - `recommendations`
- The generator queries `brands`, `prompts`, `topics`, and `personas` through joins or direct selects.
- The generator derives candidates into file outputs, not direct database writes, in the inspected path.
- The generator records table count snapshots before and after generation.

## USER_PROVIDED_CONTEXT

- Known RECORA entities include measurement runs, run items, conversations, mentions, citations, source domains, recommendations, and recommendation candidates.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- No migration defining recommendation candidates or quality gate reviews was inspected.
- No RLS, authorization, tenant boundary, or service-role policy was inspected.
- Whether `recommendations` is used for drafts, published recommendations, or both remains NEEDS_VERIFICATION.

## Risk Register

| Risk | Severity | Confirmed basis | Recommended review action |
|---|---|---|---|
| Raw evidence and derived candidate data may be coupled in one export object | P1 | `Candidate` embeds `CandidateEvidence` and client-facing fields together | Separate raw refs, derived candidate, and gate review contracts |
| Candidate identity may collide across generator/schema versions | P1 | ID uses run ID prefix and type | Add project/run/type/version hash or explicit idempotency key |
| No observed `schema_version` | P1 | Missing from candidate JSON | Add schema version before persistence |
| No observed `quality_gate_review` object | P0/P1 | Candidate has `review_required`, not persisted gate output | Add separate review entity before publication |
| Source-to-claim review not first-class | P0/P1 | Citation candidate has `supports_claim_values: ["unknown"]` | Add normalized `source_to_claim_status` |
| Seed contamination not first-class | P1 | No `seed_terms` or `seed_contamination_risk` observed | Persist prompt seed terms and risk |

## RECOMMENDED_ARCHITECTURE

- Introduce append-only or supersession-safe entities:
  - `recommendation_candidate_drafts`
  - `draft_time_rejections`
  - `quality_gate_reviews`
  - `published_recommendations`
  - `candidate_generation_runs`
- Persist raw evidence references, not full mutable raw evidence copies, when possible.
- Use additive migrations only after real schema inspection.

## DO_NOT_ASSUME

- Do not prescribe exact table columns until migrations and generated types are inspected.
- Do not assume `recommendations` can safely hold draft, gate, and published states together.
