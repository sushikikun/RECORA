# Lighthouse-Style Technical Readiness Review

Purpose: borrow page-readiness categories for RECORA implementation review. Do not run Lighthouse and do not treat Lighthouse-style scores as AI visibility proof.

## Core Rule

Technical readiness findings are prerequisites and context. They are not direct evidence of AI citation, ranking, traffic, or recommendation.

## Review Categories

| Category | RECORA review questions |
|---|---|
| Crawlability | Can important public source pages be discovered and fetched without login, cookies, or blocked states? |
| Metadata | Are titles, descriptions, headings, and page identifiers available for extraction and evidence display? |
| Canonical | Are canonical URLs, redirects, duplicates, and URL variants handled without losing original evidence? |
| Structured data | Does structured data match visible content and remain separate from proof of AI visibility? |
| Internal links | Can proof pages, comparison pages, FAQs, and case studies be discovered through stable links? |
| Performance as caution | Could severe loading failure affect evidence extraction or rendering review? |
| Accessibility as caution | Could inaccessible or hidden content affect source clarity or extraction reliability? |

## Implementation Boundaries

- Do not run Lighthouse.
- Do not create a site audit dependency.
- Do not convert page scores into RECORA AI visibility evidence.
- Do not inspect logged-in pages or private dashboards.
- Do not perform browser automation unless a later task explicitly approves it.

## Handoff To Quality Gate

Technical readiness candidates should include:

- page URL or page group.
- observed or inspected evidence.
- readiness category.
- client-safe impact.
- statement that readiness does not guarantee AI citation or ranking.

Candidates lacking RECORA evidence should be held before publication.
