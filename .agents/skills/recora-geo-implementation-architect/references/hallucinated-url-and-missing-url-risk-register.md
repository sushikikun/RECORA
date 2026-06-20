# Hallucinated URL And Missing URL Risk Register

## CONFIRMED_FROM_FILES

- Citation status is set to `not_requested` for no-search mode in inspected scripts.
- Web-search mode with no citations becomes `none_returned` or `unavailable` depending on script path.
- Candidate output warns that URL existence is not claim support.
- `safeHostname()` can return null or an empty string for invalid URLs depending on script path.

## USER_PROVIDED_CONTEXT

- v0.5 must cover hallucinated or invalid citation URLs, provider-specific citation fields missing, malformed/empty/refusal answers, and missing URL risk.

## NEEDS_VERIFICATION

- No confirmed URL reachability, retrieval, or source fetch validation was inspected.
- No confirmed provider parser error state distinct from true no-citation state was found.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Separate provider no-citation, parser failed, citation field missing, malformed URL, unreachable URL, blocked retrieval, and not-reviewed source support states.
- Treat malformed, empty, refusal, or blocked answers as invalid for brand absence unless explicitly classified.
- Store invalid URL reason and provider raw citation path.
- Keep source retrieval validation separate from provider citation extraction.

## DO_NOT_ASSUME

- Do not treat parser failure as no citations.
- Do not treat no citations as a client weakness if web search was not requested.
- Do not treat malformed or refusal output as valid brand absence.
