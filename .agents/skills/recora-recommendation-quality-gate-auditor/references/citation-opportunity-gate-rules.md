# Citation Opportunity Gate Rules

## Purpose

Use this reference when a candidate is based on citation opportunities, competitor citation gaps, source domain gaps, source type gaps, citation counts, or client-mentioned-but-not-cited observations.

## Core Rule

Citation opportunity can be useful, but it is not proof.

It may support a candidate only when tied to specific prompt/provider/date evidence and reviewed source-to-claim status.

## Required Evidence

Before considering client-facing publication, check:

- prompt/query text
- prompt category
- seed risk
- provider/platform
- provider status
- date/run ID or supplied observation reference
- competitor cited or mentioned
- client absent, mentioned, cited, or ambiguous
- citation URLs and source domains
- source-to-claim status
- confidence
- needed verification

## Decision Rules

### Hold

Hold when:

- citation_count exists but `source_to_claim_status` is unknown or not_checked
- competitor cited/client absent is not tied to prompt, provider, and date/run evidence
- source domain gap is plausible but not verified
- source type gap is inferred from limited evidence
- client is mentioned but not cited and the recommendation overstates absence

### Suppress

Suppress when:

- citation count is treated as proof of correctness or impact
- competitor citation is generalized to all AI search without evidence
- the candidate guarantees that adding a source will cause citation
- source-to-claim evidence contradicts the recommendation
- the candidate recommends scraping, crawling, paid services, credentials, or automation to capture citations

### Auto-Publish

Only consider `auto_publish` when:

- citation opportunity is backed by actual RECORA observation evidence
- source-to-claim status is supported or clearly scoped
- query, provider, date/run, and seed risk are known
- wording uses "opportunity" or "gap", not guarantee language
- recommendation is specific but limited to what the evidence supports

## Client-Facing Rewrite Rules

Use:

- "citation opportunity"
- "source gap"
- "competitor citation gap"
- "review whether the client has comparable evidence"
- "fresh validation is required before claiming impact"

Avoid:

- "guaranteed citation"
- "AI will cite this"
- "competitor citations prove lost visibility"
- "citation count proves authority"

