# Scoring Calibration Guide For v0.3-real

Use this guide to calibrate quality-gate scores against the actual Recora candidate patterns found in the copied files.

## Actual Score Pattern

| Candidate | Original score | Original confidence | Original save decision | Gate decision |
|---|---:|---|---|---|
| `rec-23677594-brand-visibility-gap` | 85 | medium | `review_required` | `auto_publish` with strict observed-scope wording |
| `rec-23677594-citation-evidence-review` | 76 | medium | `review_required` | `hold` |
| `rec-23677594-case-study-evidence-gap` | 45 | low | `review_required` | `hold` as internal verification item |

## Calibrated Bands

- `90-100`: safe auto-publish when evidence is direct, wording is safe, and risk is low.
- `85-89`: auto-publish is allowed only when direct measurement is strong and wording stays strictly within observed scope.
- `75-84`: usually hold; citation or source-review candidates in this range need human verification.
- `50-74`: hold; needs review, more evidence, rewrite, or deduplication.
- `25-49`: usually suppress for client-facing recommendations, but hold is allowed for internal-only verification items with explicit low-confidence language.
- `0-24`: suppress.

## Actual Calibration Lessons

### Direct Measurement

The brand visibility candidate reached 85 because it had:

- 10 absent observation rows.
- 5 prompt types.
- both no-search and web-search observations.
- response excerpts.
- citations not used as primary proof.

Quality gate rule: direct measurement can pass at 85, but only if the claim stays within measured scope.

### Citation Presence Is Not Citation Support

The citation review candidate scored 76 despite 26 citation rows because:

- all `supports_claim` values were unknown.
- source-to-claim mapping was not verified.
- the candidate was a verification item, not an improvement recommendation.

Quality gate rule: citation presence alone should hold, not auto-publish as proof.

### Low-Sample Proof Gaps Need Hold

The case-study candidate scored 45 because:

- it had only 1 observation.
- it had only 1 matched clue.
- no citations supported the gap.
- the generated note itself warns not to conclude page shortage or improvement effect.

Quality gate rule: low-score candidates can hold only as internal verification prompts, not as client-facing recommendations.

## Score Adjustments

- Add confidence when measurement ID, run ID, prompt count, search mode, and observation rows are present.
- Cap score when the recommendation relies on `supports_claim=unknown`.
- Cap score when only one prompt or observation supports the finding.
- Reduce score when a candidate could imply a total visibility absence from partial observations.
- Reduce score when display wording could turn "review item" into "confirmed finding."
- Suppress regardless of score if a risky variant guarantees AI citation, ranking, recommendation, traffic, or revenue.

## Decision Consistency

- A score of 85 can be `auto_publish` only if risk is low and wording is safe.
- A score of 76 should remain `hold` when source support is unverified.
- A score of 45 should not become `auto_publish`; hold only when clearly internal or verification-oriented.
