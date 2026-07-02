# Recora Page Evidence Snapshot

Page Evidence Snapshot is an internal foundation for collecting page-level evidence before Recommendation Engine v1.1 integration.

This PR adds local-only tools that can fetch an existing URL or read an HTML fixture and produce JSON snapshots with:

- HTTP status, final URL, fetch status, and fetch error details.
- canonical URL, meta robots, noindex, nofollow, nosnippet, and data-nosnippet signals.
- JSON-LD types and schema parse warnings.
- title, h1, heading paths, visible text length, and text blocks.

## In Scope

- Lightweight Page Fetcher with timeout, redirect, content-type, and size guards.
- Page Evidence Extractor for HTML fixtures and fetched HTML.
- Text Block Converter based on h1-h6 heading paths.
- Internal CLI: `npm run recora:page-evidence:inspect`.
- Local fixtures and unit checks.

## Out Of Scope

- OpenAI API execution.
- External search API URL discovery.
- Production DB writes.
- Supabase db push.
- Remote migration creation or application.
- URL Collector DB integration.
- Recommendation Engine v1.1 Adapter implementation.
- Customer-facing publication decisions.

Future DB storage names can use `page_evidence_snapshots` and `page_text_blocks`, but this foundation intentionally writes only local JSON.
