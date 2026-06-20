# RECORA Citation Opportunity And Competitor Gap Pattern

## Purpose

Use this reference when drafting citation/source recommendations from AI answer observations, SERP evidence, crawl/source review, or supplied reports.

## Key Principle

A citation opportunity is a hypothesis, not proof of impact.

It can justify a candidate draft for review. It cannot by itself prove that adding content, changing a page, or earning a source will cause AI systems to cite the client.

## Definitions

### Citation Opportunity

An observation where a source, domain, page type, or evidence pattern appears relevant to AI answer citations or source use, and the client may have a comparable gap.

Required context:

- prompt/query
- provider/platform
- date or run ID if available
- cited URL/domain
- source-to-claim status
- client relation to the source pattern
- confidence and needed verification

### Competitor Citation Gap

An observation where a competitor is cited and the client is not cited for a specific prompt/provider/run.

Required context:

- competitor name
- query category
- seed risk
- provider
- provider status
- citation URL/domain
- whether the source supports the answer claim
- whether the client was mentioned but not cited, absent, or ambiguous

### Source Domain Gap

An observation where source domains commonly cite or describe competitors, but the client lacks comparable representation in the inspected evidence.

Required context:

- domain list
- source type
- source relevance
- evidence scope
- source freshness if known

### Source Type Gap

An observation where a source type, such as comparison pages, review sites, documentation, case studies, standards pages, or community discussions, appears in observed citations and the client lacks comparable evidence.

Required context:

- source type
- observed examples
- source-to-claim status
- client evidence gap

### Source-To-Claim Unknown

The source exists, but it has not been checked against the claim or recommendation.

Drafting rule: mark as `NEEDS_VERIFICATION` and expect the quality gate to hold if used for client-facing claims.

### Competitor Cited / Client Absent

The competitor is cited and the client is absent in a specific observation.

Drafting rule: describe the exact observation. Do not generalize to all AI search, all providers, or all queries.

### Client Mentioned / Not Cited

The client is mentioned in the answer but does not appear as a cited source.

Drafting rule: treat as a source-readiness or citation-readiness opportunity, not a visibility absence.

## Candidate Wording

Safe:

- "This observation suggests a citation opportunity for review."
- "Competitor X was cited for this prompt/provider while the client was absent; validate whether a comparable evidence-backed source exists."
- "The source-to-claim status is unknown, so this should remain internal until verified."
- "This may point to a source domain gap, but impact is not proven."

Unsafe:

- "Create this page and AI will cite the client."
- "Competitor citations prove the client is losing AI search."
- "This domain gap guarantees lost demand."
- "The citation count proves this recommendation."

## Candidate Draft Fields

Include:

- `opportunity_type`: citation_opportunity, competitor_citation_gap, source_domain_gap, source_type_gap, client_mentioned_not_cited
- `prompt_category`
- `seed_contamination_risk`
- `provider`
- `provider_status`
- `competitor`
- `client_presence_status`
- `citation_urls`
- `source_domains`
- `source_to_claim_status`
- `evidence_scope`
- `confidence`
- `needs_verification`
- `quality_gate_note`

## Boundary

Do not recommend outreach, scraping, crawling, browser automation, paid services, API keys, or implementation steps from this reference. Keep output as evidence interpretation and candidate drafting only.

