# Citation And Source-To-Claim Architecture

## Citation Processing

- Preserve original citation URL.
- Canonicalize separately.
- Normalize domains.
- Deduplicate without losing occurrence count.
- Track answer span or claim relation where available.
- Distinguish cited URL existence from claim support.
- Detect hallucinated, malformed, unreachable, and missing URLs.
- Distinguish competitor citations and client citations.
- Store source freshness and retrieval date as separate concepts.
- Preserve provider citation payloads separately from normalized citation records.
- Track whether citation came from answer text, provider metadata, inline markdown, source table, crawl extraction, SERP result, or manual review.
- Track duplicate cause: repeated job delivery, repeated provider citation, canonicalization collision, or true repeated occurrence.
- Track source type and association: client-owned, competitor-owned, third-party, media, marketplace, documentation, review, unknown.

## Source-To-Claim Status

Support:

- `supported`
- `partially_supported`
- `contradicted`
- `unrelated`
- `unknown`
- `not_reviewed`

## Rules

- Citation count alone cannot justify a recommendation.
- A domain match is not claim support.
- A URL existing is not claim support.
- Source-to-claim status should be explicit before citation-based candidates are client-facing.
- If source retrieval is unavailable, record `unknown` or `not_reviewed`, not `supported`.
- Technical SEO source readiness is not source-to-claim support.
- A cited competitor source is not evidence for the client unless the claim explicitly concerns a competitor gap.
- Source freshness and retrieval freshness must not be conflated.
- Citation extraction failure must not become "no citations".

## Review Questions

- Are original URLs and canonical URLs stored separately?
- Can duplicates caused by retries be detected?
- Are occurrence counts preserved?
- Is the cited span or claim relation captured when available?
- Are client, competitor, third-party, and unrelated sources distinguishable?
- Is source-to-claim review persisted separately from raw citation extraction?
- Are hallucinated, unreachable, blocked, and malformed URLs detectable?
- Can citation records link to both the answer span and the source artifact when available?
- Are citation-based candidates held when `source_to_claim_status` is `unknown` or `not_reviewed`?
