# Parser Library Extraction Boundary Patterns

Purpose: borrow safe parser/extraction boundaries from extraction libraries without installing parser libraries or running crawlers.

## Core Rule

Parser and extraction outputs are derived evidence. Preserve raw evidence first, record extraction version, and never treat cleaned output as the only source of truth.

## Required Fields

| Field | Purpose |
|---|---|
| `raw_answer` | Original provider answer or supplied artifact text. |
| `raw_html` | Original HTML when available and safe to store. |
| `raw_url` | URL exactly as observed. |
| `normalized_url` | URL after deterministic normalization. |
| `canonical_url` | Canonical URL when inspected. |
| `source_domain` | Normalized domain for grouping. |
| `extracted_text` | Derived text from parser/extractor. |
| `extraction_status` | Complete, partial, empty, malformed, blocked, or not inspected. |
| `extraction_version` | Parser/extractor version or local rule version. |
| `normalization_reason` | Why a URL or text field was normalized. |

## Fixture Categories

- malformed HTML.
- empty body.
- article page.
- product page.
- docs page.
- pricing page.
- JavaScript-rendered content.
- blocked or login-required content.
- duplicate URL variants.
- tracking parameters.
- fragment identifiers.
- hallucinated citation URL.
- content extracted but claim unsupported.

## Boundaries

- Do not install Trafilatura, Readability, html-to-text, Scrapy, normalize-url, or crawler libraries through this skill.
- Do not perform browser automation.
- Do not crawl sites without explicit approval.
- Do not overwrite original URL with normalized URL.
- Do not treat extraction completeness as claim support.

## Review Questions

- Are raw and derived fields stored separately?
- Can parser output be replayed by version?
- Can source-to-claim review inspect the original source?
- Are malformed, empty, blocked, and partial extraction states represented?
- Can quality gate see extraction status before publication?
