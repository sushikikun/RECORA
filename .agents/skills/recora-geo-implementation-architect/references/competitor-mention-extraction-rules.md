# Competitor Mention Extraction Rules

## CONFIRMED_FROM_FILES

- `inspect-openai-output.ts` uses a fixed competitor list in the script.
- `run-openai-measurement.ts` analyzes all brands from DB rows, including primary and competitor brands.
- Candidate evidence builds competitor presence by grouping mention rows against competitor brands.
- Migrations represent competitors as brands with `brand_type = competitor`, not as a separate competitor mention table.

## USER_PROVIDED_CONTEXT

- Review must distinguish seeded competitor mention, organic competitor mention, competitor mention, target/competitor collision, and recommendation language versus mere mention.

## NEEDS_VERIFICATION

- No confirmed field separates competitor discovery from seeded competitor tracking.
- No confirmed collision handling exists when a competitor alias overlaps with the target brand alias.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Treat competitor extraction as an entity-resolution problem, not a simple string count.
- Record brand type, alias source, match span, match confidence, collision status, and mention origin.
- Add review fixtures for overlapping aliases, same domain owner, generic category names, and seeded competitor lists.
- Keep competitor gap findings separate from source-to-claim support findings.

## DO_NOT_ASSUME

- Do not count competitor names supplied by the prompt as organic competitor visibility.
- Do not treat a competitor-owned citation as support for a client claim unless the claim concerns competitor coverage.
- Do not assume one alias can map to only one brand without conflict handling.
