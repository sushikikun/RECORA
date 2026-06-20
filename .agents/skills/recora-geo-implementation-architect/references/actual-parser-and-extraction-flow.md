# Actual Parser And Extraction Flow

## CONFIRMED_FROM_FILES

- `inspect-openai-output.ts` calls `extractOutputText()`, `extractCitations()`, and `analyzeOutput()`.
- `analyzeOutput()` calls `analyzeBrand()` for the target brand and competitors, ranks mentioned brands by first mention index, and creates suggested DB mapping.
- `analyzeBrand()` normalizes text and aliases with NFKC lowercasing, uses `indexOf` for first match, counts occurrences, builds snippets, and classifies recommendation status and sentiment from surrounding/full text.
- `extractCitations()` walks JSON, reads `url_citation` nodes and generic URL nodes with title/source/snippet, and deduplicates by source type, URL, and span in the inspection script.
- `run-openai-measurement.ts` extracts citations similarly, then groups by canonical URL and increments occurrence count.
- `import-openai-inspection.ts` inserts parsed conversations, brand mentions, citations, and source domains, with `supports_claim` set to null.
- `generate-recommendation-candidates.ts` maps citation rows into candidate evidence, normalizes `supports_claim` null or unrecognized values to `unknown`, and records citation counts and unique URL/domain counts.

## USER_PROVIDED_CONTEXT

- v0.5 should help the implementation architect produce implementation file-impact maps without editing files.

## NEEDS_VERIFICATION

- Whether prompt text is excluded from answer text before mention detection is not confirmed.
- Whether seeded brand and competitor terms are propagated into mention rows is not confirmed.
- Whether parser and extraction version fields are persisted is not confirmed.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Review flow from provider response to raw answer to normalized mentions to normalized citations to candidate evidence as separate stages.
- Require each derived row to record source raw artifact, parser/extractor version, match strategy, and risk flags.
- Require replay jobs to recompute derived rows without mutating raw answers or provider payloads.

## DO_NOT_ASSUME

- Do not assume NFKC lowercasing is sufficient Japanese normalization.
- Do not assume `indexOf` proves a valid entity mention.
- Do not assume deduplication by canonical URL preserves all meaningful source-to-claim occurrences unless occurrence semantics are tested.
