# Provider Response Normalization Boundary

## CONFIRMED_FROM_FILES

- Inspected scripts parse OpenAI-style response objects, including `output_text`, nested `output`, `url_citation`, generic URL nodes, model, response ID, usage, and web search status.
- `ai_conversations` stores provider, model requested, model returned, response ID, raw response JSON, usage JSON, web search flag, citation status, measured time, and response time.
- `extractCitations()` walks arbitrary JSON nodes, but the confirmed implementation is still calibrated to OpenAI-like structures.

## USER_PROVIDED_CONTEXT

- v0.5 must handle provider-specific citation formats and prevent missing provider citation fields from becoming no-citation findings.

## NEEDS_VERIFICATION

- Gemini, Perplexity, Anthropic, or other provider response formats were not confirmed in the snapshot.
- No provider adapter contract tests were found for citation normalization.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Normalize provider responses into a provider-neutral raw answer and citation annotation contract before parser logic runs.
- Distinguish provider did not request citations, provider returned no citations, parser could not find citation fields, parser failed, and citations were extracted.
- Keep raw provider payload path for every extracted citation.
- Add adapter fixtures for each provider shape before using provider data in candidate evidence.

## DO_NOT_ASSUME

- Do not assume an absent OpenAI field means no citations for another provider.
- Do not assume all providers expose start/end spans.
- Do not assume provider citations are verified source support.
