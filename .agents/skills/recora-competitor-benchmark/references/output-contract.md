# Output Contract

Use this reference when producing dashboard-ready data, JSON, report tables, or client-facing summaries.

## JSON Output Contract

When machine-readable output is requested, use this contract. Use `null` for unmeasured numbers, add `estimated` where inferred, add `insufficient_sample` for thin samples, and do not fill unknown facts.

```json
{
  "client": {
    "name": "",
    "url": "",
    "market_region": "",
    "language": ""
  },
  "sample": {
    "observation_date": "",
    "engines_checked": [],
    "total_prompts": 0,
    "total_answers": 0,
    "sample_quality": "",
    "limitations": []
  },
  "competitors": [
    {
      "raw_name": "",
      "normalized_name": "",
      "tier": "",
      "market_region": "",
      "entity_confidence": "",
      "classification_confidence": "",
      "low_confidence_reasons": [],
      "visibility": {
        "ai_visibility": null,
        "share_of_voice": null,
        "avg_recommendation_rank": null,
        "top_1_rate": null,
        "top_3_rate": null,
        "prompt_coverage": null,
        "sample_size": 0,
        "sample_quality": ""
      },
      "evidence": {
        "answer_contexts": [],
        "cited_sources": [],
        "third_party_sources": [],
        "official_sources": [],
        "evidence_confidence": ""
      },
      "advantages": [],
      "gaps_against_client": [],
      "threat_level": "",
      "opportunities": []
    }
  ],
  "persona_comparison": [],
  "prompt_topic_comparison": [],
  "source_gap": [],
  "recommended_counter_moves": [],
  "report_summary": {
    "executive_summary": "",
    "key_findings": [],
    "risks": [],
    "next_actions": []
  }
}
```

## Required Tables

Use these table schemas when building reports or dashboard exports:

- `Competitor Tier Table`: `competitor_name`, `normalized_name`, `tier`, `market_region`, `rationale`, `evidence`, `confidence`, `low_confidence_reason`.
- `Visibility Benchmark Table`: `competitor_name`, `ai_visibility`, `share_of_voice`, `avg_rank`, `top_1_rate`, `top_3_rate`, `prompt_coverage`, `sample_size`, `sample_quality`, `confidence`.
- `Persona Comparison Table`: `persona`, `client_visibility`, `strongest_competitor`, `competitor_tier`, `competitor_advantage`, `client_gap`, `recommended_counter_move`, `confidence`.
- `Prompt Topic Comparison Table`: `prompt_topic`, `prompt_intent`, `client_mentioned`, `competitors_mentioned`, `recommendation_order`, `citation_summary`, `client_gap`, `opportunity`, `confidence`.
- `Counter-Move Table`: `action`, `target_gap`, `target_competitor`, `target_persona`, `target_prompt_topic`, `expected_effect`, `evidence`, `confidence`, `risk`, `priority`.

## Dashboard Table Schema

Include:

- `competitor_name`
- `competitor_tier`
- `market_region`
- `ai_visibility`
- `share_of_voice`
- `avg_recommendation_rank`
- `top_1_rate`
- `top_3_rate`
- `prompt_coverage`
- `sample_size`
- `sample_quality`
- `citation_strength`
- `citation_diversity`
- `positioning_clarity`
- `buyer_fit`
- `category_ownership`
- `threat_level`
- `opportunity_gap`
- `confidence`
- `notes`

## Report Summary Rules

Client-facing summaries must say "within the observed sample" or equivalent, and include:

- client name and URL
- market, language, and engines checked
- observation date
- sample size and sample quality
- strongest direct competitor when evidence supports it
- strongest adjacent or substitute risk
- aspirational references
- main `source_gap`
- main `positioning_gap`
- highest-priority counter-move
- all `missing_input`, `not_measured`, `estimated`, `insufficient_sample`, and `low_confidence` caveats

Do not write "will be cited", "can beat this competitor", "will rank higher in AI", "Share of Voice is high" without measured data, or "the competitor is weak" without evidence.

