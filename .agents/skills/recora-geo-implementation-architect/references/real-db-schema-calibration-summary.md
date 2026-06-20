# Real DB Schema Calibration Summary

## CONFIRMED_FROM_FILES

- The inspected snapshot has enough migration evidence to calibrate v0.4 against real DB artifacts, but not enough to declare production schema completeness.
- Confirmed first-class persisted concepts include projects, brands, personas, topics, prompts, AI models, measurement runs, run items, AI conversations, source domains, brand mentions, citations, metric snapshots, and recommendations.
- Confirmed evidence tables preserve raw answer text, answer hash, prompt/model snapshots, citation URL/domain/title/source type, mention status, and source domain classification.
- Confirmed additive AI output fields include provider, requested/returned model, response ID, raw response JSON, usage JSON, web search flag, citation status, measured time, response latency, mention count, extraction confidence, matched alias, canonical URL, citation span, cited text, raw citation JSON, and brand relatedness.
- Confirmed `measurement_runs.metadata` and `metric_snapshots.metadata` exist as JSON objects for run and metric context.
- Confirmed `recommendations` exists, but no separate `recommendation_candidates`, `quality_gate_reviews`, `rejected_candidates`, or `published_recommendations` table was found in migrations.
- Confirmed RLS is not enabled in inspected migrations and no policy definitions were found.

## USER_PROVIDED_CONTEXT

- v0.4 should focus on real DB/schema calibration for RECORA persistence.
- The implementation architect should inspect or explicitly mark unavailable migrations, schema, Supabase types, RLS, indexes, and persistence targets before proposing DB changes.

## NEEDS_VERIFICATION

- Generated Supabase types are unavailable.
- Exact production DB state is unavailable.
- Tenant model is not confirmed beyond `project_id` and `workspace_name` fields in migration evidence.
- Whether `metadata` JSON carries versioning keys consistently is not proven by schema.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Preserve current raw evidence tables as the measurement source of truth.
- Add explicit draft/gate/publication persistence instead of overloading `recommendations`.
- Add source-to-claim review persistence for citation support decisions.
- Add version fields for schema, generator, parser, and review behavior.
- Add idempotency keys and partial unique indexes for regeneration safety.
- Add RLS policies and tenant-aware access checks before exposing tables through Supabase APIs.

## DO_NOT_ASSUME

- Do not assume `supports_claim` alone is a complete source-to-claim review.
- Do not assume `citation_status` is evidence quality.
- Do not assume `recommendations.status` can represent draft candidates, gate review states, and publication state without ambiguity.
- Do not assume metadata JSON replaces explicit columns for operationally critical state.
