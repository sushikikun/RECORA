# Anti-Patterns

Use this reference before finalizing an audit or report.

## Prohibited Output Patterns

- Ending with only a list of competitor names.
- Concluding with only a total-score ranking.
- Treating overseas GEO tools as Japan Direct competitors casually.
- Missing Substitute competitors such as SEO agencies, consultants, AI tools, and in-house operations.
- Judging a competitor strong from one AI-answer mention.
- Classifying from official-site copy alone.
- Treating competitor marketing copy as verified fact.
- Asserting Share of Voice without measured observations.
- Omitting sample size, sample quality, engines checked, observation date, or confidence.
- Averaging away persona-level, prompt-topic-level, or engine-level differences.
- Providing counter-moves without evidence, risk, confidence, and priority.
- Using salesy certainty such as "can win", "will beat", "will rank above", "will be cited", or "will increase AI visibility".
- Declaring competitors weak without evidence.
- Using bot access, schema, or a single page type as proof that AI citation will increase.

## Final Quality Checks

Before delivery, confirm:

- Competitor names were normalized and unresolved entities are marked.
- Direct / Adjacent / Aspirational / Substitute are separated.
- Overseas references are not treated as Japan Direct without evidence.
- Substitute competitors are included.
- Share of Voice is not asserted without measured data.
- `sample_size`, `sample_quality`, `confidence`, and `low_confidence_reason` are included where needed.
- Competitor strength is decomposed into visibility, rank, sources, context, and positioning.
- Counter-moves include evidence, expected effect, risk, confidence, and priority.
- JSON uses `null`, `estimated`, and `insufficient_sample` correctly.
- Client-facing wording avoids guarantees and unsupported competitive claims.

