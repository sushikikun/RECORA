# Crawler And Extraction Architecture

## Scope

Use this reference to review crawler, scraper, source extraction, crawl-result normalization, and future web-context architecture. Do not run crawlers, browser automation, external APIs, package installs, or scripts from this skill.

## Evidence Boundary

Crawler and extraction outputs are source/readiness evidence. They are not direct AI-answer visibility evidence.

Do not infer:

- AI will cite a page because it is crawlable.
- AI did cite a page because a crawler found it.
- A technical SEO score proves AI visibility.
- A `llms.txt`, schema, sitemap, or clean markdown export guarantees citation.

## Conceptual Extraction Contract

Review for fields such as:

- `crawl_job_id`
- `crawl_run_id`
- `source_url_original`
- `source_url_canonical`
- `domain`
- `page_title`
- `http_status`
- `retrieved_at`
- `robots_status`
- `rendering_mode`
- `content_type`
- `raw_html_ref`
- `clean_text_ref`
- `markdown_ref`
- `structured_data_ref`
- `links`
- `outbound_citations`
- `metadata`
- `screenshot_ref`
- `extraction_status`
- `error_code`
- `retryable`
- `schema_version`
- `extractor_version`
- `needs_verification`

## Review Checks

- Preserve raw page/source artifact separately from cleaned or markdown output.
- Keep search, scrape, map, crawl, render, and manual review as distinct evidence types.
- Store source URL and canonical URL separately.
- Record retrieval date separately from source freshness.
- Distinguish blocked, robots-disallowed, timeout, rate-limited, JavaScript-required, empty, malformed, and successful extraction.
- Record whether JavaScript rendering was used or merely planned.
- Keep links, citations, structured data, page text, screenshots, and metadata as separate derived outputs.
- Prevent crawler failure from becoming source absence or brand absence.
- Require tenant/run isolation for long-running extraction jobs.
- Require rate limits, budgets, cancellation, stale job detection, and retry safety.

## Compliance And Safety

Future crawler implementation requires separate review for:

- robots and provider terms
- rate limits
- privacy and sensitive data minimization
- tenant isolation
- source retention and deletion
- credential-free operation
- no CAPTCHA bypass
- no login/session automation
- no stealth/proxy evasion unless explicitly approved by legal and technical owners

## Implementation Review Questions

- Can extracted source evidence be traced back to the exact raw artifact?
- Are derived extraction outputs versioned and rerunnable?
- Are source artifacts excluded from client-facing claims until source-to-claim review exists?
- Are crawl errors visible in logs and candidate risk flags?
- Can the same crawl job be replayed without duplicating source/citation rows?
- Are crawler progress states separated from final evidence?
