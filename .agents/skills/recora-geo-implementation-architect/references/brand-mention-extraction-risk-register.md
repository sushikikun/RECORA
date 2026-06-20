# Brand Mention Extraction Risk Register

## CONFIRMED_FROM_FILES

- `inspect-openai-output.ts` and `run-openai-measurement.ts` use normalized substring/index matching for brand aliases.
- `run-openai-measurement.ts` stores `matchedAlias`, `mentionCount`, `firstMentionIndex`, `evidenceSnippet`, `recommendationStatus`, `sentiment`, and `confidence`.
- Existing risk references already identify `raw_answer.includes(primaryBrand.name)` in candidate generation as a false-positive risk.
- Missing or absent mentions can still receive medium confidence in `run-openai-measurement.ts`.

## USER_PROVIDED_CONTEXT

- v0.5 must review explicit target mention, prompt echo, seeded mention, organic mention, URL-only mention, aliases, Japanese width/spacing variants, substring false positives, name collisions, sentiment, and recommendation language.

## NEEDS_VERIFICATION

- No confirmed parser state distinguishes organic mentions from prompt echo or seeded terms.
- No confirmed persisted field records mention source as answer text, markdown link title, URL, citation text, prompt echo, or seed echo.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

| Risk | Review requirement |
| --- | --- |
| Substring false positive | Require token/span-aware matching and collision fixtures. |
| Prompt echo | Exclude prompt text and label echoed prompt spans. |
| Seed contamination | Persist seed terms and seed-risk flags on derived mentions. |
| URL-only brand match | Separate URL/source matches from answer-text mentions. |
| Link title mismatch | Keep markdown link title, URL, and answer text spans separate. |
| Sentiment confusion | Classify sentiment after mention validity is proven. |
| Recommendation language confusion | Store recommendation language separately from mention presence. |

## DO_NOT_ASSUME

- Do not treat a brand string inside a URL as an answer mention.
- Do not treat a seeded competitor as discovered competitor visibility.
- Do not treat neutral listing as recommendation language.
