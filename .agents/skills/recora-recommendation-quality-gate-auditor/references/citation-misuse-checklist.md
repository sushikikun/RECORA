# Citation Misuse Checklist

Use this checklist to detect source, citation, and evidence misuse in recommendation candidates.

## Suppress-Level Misuse

Suppress when a candidate:

- invents a source title, URL, author, publication, citation, measurement, or last checked date.
- says a source supports a claim it does not support.
- uses a local skill file as if it were an external client-facing source.
- treats research as official platform policy.
- treats third-party commentary as official guidance.
- uses a domain-only citation as proof, such as "(developers.google.com)".
- cites a stale source as current when current behavior matters.
- uses an AI-generated answer as proof of factual accuracy without source verification.
- claims official endorsement by Google, OpenAI, Anthropic, Perplexity, or another platform without direct source support.

## Hold-Level Misuse

Use `hold` when:

- the source may support the direction but exact scope is unclear.
- the URL is missing and source status matters.
- the source is named but not checked in the task.
- the source is old and platform behavior may have changed.
- a research claim needs narrower wording.
- client-facing wording needs a source caveat.

## Source Ledger Minimum

Internal review should capture:

| Source title | Owner | URL if known | Evidence label | Claim supported | Claim not supported | Last checked if known |
|---|---|---|---|---|---|---|

If URL, current status, or last checked date is unknown, use `NEEDS_VERIFICATION` rather than implying verification.

## Common Overclaims

Unsafe:

- "Google says this will make AI cite you."
- "Schema guarantees AI Overviews."
- "Allowing OAI-SearchBot guarantees ChatGPT recommendation."
- "The GEO paper proves a 40% lift for this client."
- "This citation confirms competitor dominance" when it only mentions a competitor.

Safe:

- "The source supports the narrower premise, but current client outcome needs verification."
- "This improves citation readiness, not guaranteed citation."
- "This research supports the concept, not a commercial guarantee."

## Decision Impact

- Fake or hallucinated source: `suppress`.
- Misstated source scope: `suppress` if misleading, otherwise `hold`.
- Missing freshness or URL: usually `hold`.
- Clean and direct source support: can support `auto_publish` if all other gates pass.
