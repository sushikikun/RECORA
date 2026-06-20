# Quality Score Rubric

Assign `quality_score` from 0 to 100. The score reflects publishability and usefulness, not how persuasive the recommendation sounds.

## Dimensions

Score each dimension from 0 to 10, then sum.

| Dimension | 0-3 | 4-7 | 8-10 |
|---|---|---|---|
| Evidence traceability | no traceable evidence | partial or indirect evidence | direct measured or verified evidence |
| Measurement relevance | disconnected from observations | loosely tied to observations | tightly tied to measured Recora data |
| GEO/SEO/AIO/LLMO correctness | wrong or overclaiming | mostly correct with caveats | correct and evidence-scoped |
| Specificity | generic advice | somewhat specific | precise issue and action |
| Actionability | vague | actionable after review | immediately actionable |
| Client-facing safety | risky or alarming | needs wording edits | safe and calm |
| Source/citation integrity | fake or misused source | source scope unclear | source support is clean |
| Seed contamination risk | contaminated | uncertain | clean |
| Freshness / verification handling | stale or implied verification | some unknowns marked | freshness handled clearly |
| Recora product fit | not suited to Recora report | partially useful | strong fit for Recora quality gate |

## Score Bands

- `90-100`: excellent. Strong `auto_publish` candidate if no hard block exists.
- `80-89`: publishable with high quality. Usually `auto_publish` if display risk is low.
- `65-79`: useful but needs review, evidence, or wording. Usually `hold`.
- `50-64`: weak but salvageable. Usually `hold` with substantial edits.
- `25-49`: poor, risky, or disconnected. Usually `suppress`.
- `0-24`: unsafe or unusable. Suppress.

## Decision Overrides

The score does not override hard blocks. A candidate with invented evidence, seed contamination, citation misuse, secret requests, implementation drift, or guaranteed AI outcomes must be `suppress` even if some dimensions score well.

## Scoring Notes

- Penalize generic SEO advice heavily unless tied to measured Recora evidence.
- Penalize stale source claims if current status matters.
- Penalize missing query/platform/date context for AI search observations.
- Reward safe rewrites only if the underlying recommendation remains evidence-backed.
- Use `hold`, not `auto_publish`, when confidence is medium and display risk is not low.
