# Citation URL Normalization And Deduplication

## CONFIRMED_FROM_FILES

- `inspect-openai-output.ts` extracts `url_citation` and generic URL nodes, then deduplicates by source type, URL, and text span.
- `run-openai-measurement.ts` canonicalizes URLs by lowercasing protocol/hostname, removing `www.`, deleting `utm_`, `gclid`, `fbclid`, and `msclkid` parameters, clearing hash, grouping by canonical URL, and incrementing occurrence count.
- `import-openai-inspection.ts` canonicalizes URLs by removing `utm_` parameters and hash, but the inspected helper does not lower-case host or strip `www`.
- Migrations include `canonical_url`, `occurrence_count`, `start_index`, `end_index`, `cited_text`, and `raw_citation`.

## USER_PROVIDED_CONTEXT

- Review should require original URL, canonical URL, domain, occurrence count, and claim relation.

## NEEDS_VERIFICATION

- Canonicalization differs across inspected scripts.
- Invalid URL handling returns the original URL or empty hostname depending on helper.
- No confirmed test fixture proves duplicate retry citations are safe.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Define one shared URL canonicalization module for parser and importer paths.
- Preserve original URL exactly as returned by provider.
- Store canonical URL, normalized domain, occurrence count, duplicate cause, citation source path, and raw provider node.
- Deduplicate derived support by canonical URL plus claim relation, while preserving repeated occurrence counts.
- Add fixtures for tracking parameters, hash fragments, mixed case hosts, `www`, malformed URLs, and repeated provider annotations.

## DO_NOT_ASSUME

- Do not assume deduplicated URLs are deduplicated claims.
- Do not assume retry duplicates should create additional support.
- Do not assume canonical URL can replace the original URL.
