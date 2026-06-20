# Actual Table To RECORA Concept Map

## CONFIRMED_FROM_FILES

| RECORA concept | Confirmed table or field | Fit | Gap |
| --- | --- | --- | --- |
| measurement_runs | `measurement_runs` | strong | Needs run kind/version fields if metadata is not enough. |
| run_items | `run_items` | strong | Provider attempt state is not separated. |
| ai_conversations | `ai_conversations` | strong | Parser/version and normalized provider contract fields are partial. |
| brand_mentions | `brand_mentions` | partial | Competitor mentions are represented as brand rows where `brand_type` is competitor, not a dedicated table. |
| competitor_mentions | `brands.brand_type = competitor` plus `brand_mentions` | partial | No dedicated competitor mention lineage table. |
| citations | `citations` | partial | Nullable support flag is not full source-to-claim review. |
| source_domains | `source_domains` | strong | Classification provenance and reviewer status are not confirmed. |
| source_to_claim_reviews | none found | missing | Needs dedicated review rows or versioned review artifact. |
| evidence_ledger_entries | none found | missing | Raw evidence exists, but no generic ledger entry table found. |
| recommendation_candidates | none found | missing | Candidate JSON is not confirmed as persisted table rows. |
| quality_gate_reviews | none found | missing | Gate outcomes need separate persisted review object. |
| published_recommendations | `recommendations` may be final work item | partial | Publication boundary is not explicit. |
| rejected_candidates | none found | missing | Rejections need audit-preserved persistence. |
| remeasurement_tasks | none found | missing | No task queue/remediation measurement table found. |
| provider_executions | `ai_conversations` provider fields | partial | No per-attempt execution table found. |
| prompt_taxonomy | `topics`, `personas`, `prompts` | partial | Taxonomy versioning and seed linkage missing. |
| seed_terms | none found | missing | Seed terms are not first-class persisted objects. |
| seed_contamination_risk | candidate JSON scoring note only | missing | No DB field/table confirmed. |
| provider_status | `run_items.status`, `ai_conversations.citation_status` | partial | Provider status is not the same as evidence quality. |
| schema_version | none found in candidate JSON or migrations as candidate field | missing | Needs versioned candidate/gate contract. |
| generator_version | none found | missing | Required for replay and backfill safety. |
| parser_version | none found | missing | Required for mention/citation reprocessing. |
| review_version | none found | missing | Required for gate/source-to-claim review comparability. |

## USER_PROVIDED_CONTEXT

- The map should focus on whether RECORA persistence can represent measurement, provider, parser, citation, claim, recommendation, quality-gate, and version concepts.

## NEEDS_VERIFICATION

- No generated type file was available to confirm final application-facing row shapes.
- No production DB inspection was performed.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Keep actual table mapping separate from proposed target mapping.
- For every missing concept, require an explicit migration proposal, backfill plan, and review-mode refusal to edit migrations unless separately authorized.
- Represent version fields in persisted rows that affect replay or user-visible decisions.

## DO_NOT_ASSUME

- Do not map `display_decision` to `quality_gate_reviews`.
- Do not map `should_save_to_recommendations` to publication approval.
- Do not map seed absence scoring notes to persisted seed contamination review.
