# Japanese Brand Normalization And Alias Rules

## CONFIRMED_FROM_FILES

- Inspected parser code uses `value.normalize("NFKC").toLowerCase()` before matching.
- Brand aliases are gathered from brand name, reading, and JSON alias values in `run-openai-measurement.ts`.
- Aliases are sorted by length before matching.

## USER_PROVIDED_CONTEXT

- Review should cover Japanese full-width and half-width variations, spacing variations, ambiguous aliases, partial substring false positives, and unrelated entity name collisions.

## NEEDS_VERIFICATION

- No confirmed handling was found for Japanese spacing removal, kana/romanization policy, word boundaries, legal suffixes, or alias provenance.
- No confirmed fixture set proves behavior for Japanese brand collisions.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Keep original answer text unchanged and store normalized text only as derived parser state.
- Version alias sets and normalization rules.
- Track matched alias, normalized alias, source span, match class, and ambiguity status.
- Add Japanese fixtures for full-width/half-width, space insertion, kana/romanization, short aliases, product names, corporate suffixes, and homographs.
- Prefer explicit span validation over raw substring counting.

## DO_NOT_ASSUME

- Do not assume NFKC handles all Japanese brand variants.
- Do not assume a short alias is safe without collision review.
- Do not assume the first normalized index maps perfectly to the original string span.
