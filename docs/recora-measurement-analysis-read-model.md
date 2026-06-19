# Recora Measurement Analysis Read Model

## Scope

This document maps measured AI answers to the internal data needed by Recora
report screens. It is an internal implementation contract, not a client-facing
claim. Recora metrics are observation metrics, not official AI platform scores.

## Current Data Capability Classification

| Screen item | Current capability | Basis |
|---|---|---|
| Report overview: topics with large competitor gaps | Derivable from existing data | `prompts.topic_id`, `run_items`, `ai_conversations`, and `brand_mentions` can derive topic-level target vs competitor display rates. Topic `metric_snapshots` can be used when present. |
| Report overview: weak owned-source categories | Derivable from existing data | `citations.source_type`, `citations.brand_related`, and `occurrence_count` support owned share by source type. |
| Report overview: pre-quality-gate candidate count | Derivable from existing data | `recommendations.metadata` can identify candidate generator rows. Dedicated gate review history still needs separate persistence. |
| Brand comparison: display rate | Existing data | `brand_mentions.mentioned` over measured conversations. |
| Brand comparison: average position | Existing data | `brand_mentions.position`. |
| Brand comparison: mention context | Extraction added / available | `brand_mentions.evidence_snippet` and `mention_text`; prompts/topics provide context. |
| Brand comparison: co-mentioned competitors | Derivable from existing data | Same-conversation `brand_mentions` rows. |
| Brand comparison: new appearance brands | Derivable when previous run is loaded | Requires previous measurement run mentions. If unavailable, mark `NEEDS_VERIFICATION`. |
| Sources: occurrence count | Existing data | `citations.occurrence_count`. |
| Sources: URL/domain/source type | Existing data | `citations.url`, `canonical_url`, `domain`, `source_type`, plus `source_domains`. |
| Sources: source freshness | Schema/read model added | `source_freshness_status`, source dates, and retrieval timestamp added to `citations`. Not checked by current measurement scripts. |
| Sources: source-to-claim status | Schema/read model added | `source_to_claim_status` added to `citations`; legacy `supports_claim` maps to `supported` or `unknown`. |
| Recommendation quality gate before/after | Read model added; full review history still needed | `quality_gate_decision` metadata can be read when present. Missing gate decision is treated as `pre_quality_gate`. Dedicated append-only review table remains a future schema step. |

## Measurement Flow

```text
measurement run
  -> run item
  -> AI raw response in ai_conversations.raw_response/raw_answer
  -> parsed observation in ai_conversations provider/model/citation fields
  -> brand mention extraction in brand_mentions
  -> competitor co-occurrence derived by conversation_id
  -> citation/source extraction in citations and source_domains
  -> source-to-claim status in citations.source_to_claim_status
  -> source freshness status in citations.source_freshness_status and source date fields
  -> recommendation candidate in recommendations with candidate metadata
  -> quality gate metadata when reviewed
  -> measurement analysis read model
```

## Added Internal Contract

- `lib/recora/measurement-analysis-read-model.ts`
  - Pure read model builder from measured DB rows.
  - Produces report overview, brand comparison, source rows, and quality-gate
    candidate state.
- `lib/recora/db/measurement-analysis.ts`
  - Server-side DB loader for the latest measured run or a selected run.
  - Loads previous measurement mentions when available for new appearance
    detection.
- `supabase/migrations/0004_recora_measurement_analysis_read_model_fields.sql`
  - Adds explicit `source_to_claim_status`.
  - Adds explicit source freshness status and date fields.

## Needs Verification Boundaries

- Source freshness remains `not_checked` until a source retrieval/extraction
  stage records dates or freshness.
- Source-to-claim statuses remain `not_reviewed` or `unknown` unless a parser,
  evaluator, or human review writes a specific status.
- New appearance brands require a comparable previous measurement run.
- Candidate generation is not quality-gate approval. Missing
  `quality_gate_decision` means `pre_quality_gate`.
