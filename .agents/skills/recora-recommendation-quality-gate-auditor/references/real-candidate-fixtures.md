# Real Candidate Fixtures For v0.3-real

This reference summarizes the actual copied Recora recommendation candidate files:

- `tmp/recora-recommendation-candidates/recommendation-candidates.json`
- `tmp/recora-recommendation-candidates/recommendation-candidates.md`
- `tmp/recora-recommendation-candidates/generate-recommendation-candidates.ts`

## Input Read Result

- Generated at: `2026-06-18T11:37:12.489Z`
- Project slug: `recora-kenzai-q2`
- Measurement run: `23677594-080c-424e-bff0-dc931d106b33`
- Aggregate run: `5f6e433f-dd09-4341-b2de-7240ff5ce042`
- Profile: `standard-v01`
- Observation scope: 10 prompts / 20 observations
- Data scope: 20 run items, 20 OpenAI conversations, 100 brand mentions, 26 citations, 0 excluded example citations, 0 failed run items
- Candidate count in actual files: 3
- Generator limit: `MAX_CANDIDATES = 3`
- DB write status: `not_written`
- Recommendation count check: 6 before / 6 after / unchanged

The request mentioned 5 actual candidates, but the copied files contain 3 candidates. Do not invent two additional candidates.

## JSON Read Caveat

The JSON file was read for ASCII fields and candidate evidence fields, but direct JSON parsing failed in the current shell. The Markdown report and targeted field extraction from the JSON were used to avoid inventing facts.

## Candidate Summary

| Candidate | Original priority | Original confidence | Original save decision | Original quality score | Display decision | Evidence signals used | Potential risks | Likely gate decision |
|---|---|---|---|---:|---|---|---|---|
| `rec-23677594-brand-visibility-gap` | P1 | medium | `review_required` | 85 | show | `target_brand_absent_observations`; 10 absent observations; 5 unique prompts; no-search and web-search; 0 citation rows; citations not used as primary evidence | Small sample; trend should not become a total absence claim; Recora metric is not official platform evaluation | `auto_publish` only with observed-scope wording |
| `rec-23677594-citation-evidence-review` | P1 | medium | `review_required` | 76 | show | `web_search_citations`; 4 web-search observations; 26 citation rows; 26 unique URLs; 20 domains; `supports_claim=unknown` for all 26 | Citation misuse risk if URLs are treated as claim support; source-to-claim mapping unverified | `hold` |
| `rec-23677594-case-study-evidence-gap` | P2 | low | `review_required` | 45 | show | `case_study_prompt_responses`; 1 web-search observation; 1 matched clue; 0 citation rows | Very low sample; cannot prove site/page gap; client-facing display should not state a deficiency as fact | `hold` as internal review item, not auto-publish |

## Candidate-Specific Notes

### `rec-23677594-brand-visibility-gap`

- Type: `brand_visibility_gap`
- Original display category: improvement proposal
- Evidence grade: `DIRECT_MEASUREMENT`
- Primary evidence scope: `target_brand_absent_observations`
- Citation use: citations are not primary evidence
- Observed weakness: target brand absent in 10 of 20 observations in the reported scope
- Gate interpretation: strong enough for client display only if framed as "in the observed query set, some questions did not show the brand."

### `rec-23677594-citation-evidence-review`

- Type: `citation_evidence_review`
- Original display category: citation verification item
- Evidence grade: `DIRECT_MEASUREMENT` for citation presence; `NEEDS_VERIFICATION` for source support
- Primary evidence scope: `web_search_citations`
- Citation use: citations are primary evidence for the review item, not for improvement claims
- Observed weakness: all 26 citation rows have `supports_claim=unknown`
- Gate interpretation: hold until each citation is checked against the claim it is supposed to support.

### `rec-23677594-case-study-evidence-gap`

- Type: `case_study_evidence_gap`
- Original display category: sample shortage
- Evidence grade: `SUPPORTED_INFERENCE`
- Primary evidence scope: `case_study_prompt_responses`
- Citation use: citations are not primary evidence
- Observed weakness: 1 observation and 1 matched clue only
- Gate interpretation: hold as a verification prompt; do not display as confirmed case-study or proof-asset gap.
