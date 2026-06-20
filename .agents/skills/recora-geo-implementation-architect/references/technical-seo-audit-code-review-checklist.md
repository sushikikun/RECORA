# Technical SEO Audit Code Review Checklist

## Scope

Use this reference when reviewing technical SEO audit code, page/source readiness checks, crawlability logic, structured data extraction, report issue objects, and related test fixtures.

Technical SEO audit evidence is a readiness lane. It is not direct proof of AI answer visibility, citation, ranking, traffic, or recommendation.

## Audit Categories

Review whether the implementation separates categories such as:

- crawlability
- indexability
- canonicalization
- redirects
- HTTP status
- robots and sitemap signals
- metadata
- headings and content structure
- duplicate/thin content
- internal links and link graph
- structured data
- source/citation readability
- page freshness signals
- performance/Core Web Vitals when actually measured
- mobile/rendering when actually measured
- AI-facing files such as `llms.txt` only as readiness signals

## Issue Object Contract

Review for structured issue fields:

- `issue_id`
- `audit_run_id`
- `page_url`
- `category`
- `severity`
- `field`
- `observed_value`
- `expected_or_recommended_value`
- `evidence_ref`
- `readiness_only`
- `ai_citation_impact_verified`
- `confidence`
- `source_method`
- `tool_or_parser_version`
- `created_at`
- `needs_verification`

## Review Checks

- Do not collapse technical SEO, citation support, and AI answer visibility into one unexplained score.
- Do not label generic SEO advice as GEO evidence without a linked observation.
- Do not treat `llms.txt`, schema, H1 fixes, speed, or sitemap presence as AI citation proof.
- Do not infer rendered UX from non-rendered HTML crawl unless rendering was actually performed.
- Distinguish skipped assets from successful rendering.
- Track whether PageSpeed, Lighthouse, browser rendering, or external APIs were actually run.
- Keep issue severity separate from quality-gate publication state.
- Require field dictionaries for audit fields that appear in reports.
- Require validation summaries and not-inspected sections.

## Candidate Generation Boundary

Technical audit findings can become recommendation candidates only when:

- the technical issue is directly linked to inspected evidence
- the candidate is scoped as readiness/source clarity unless AI-answer evidence exists
- source-to-claim or source-readiness status is known or marked `NEEDS_VERIFICATION`
- the quality gate receives readiness-only flags and confidence limits

## Fixtures To Require

- robots-disallowed page
- noindex page
- canonical mismatch
- redirect chain
- duplicate title
- missing source title
- malformed JSON-LD
- valid structured data but no AI citation proof
- `llms.txt` present but unverified impact
- JS-required content not rendered
- crawl timeout
- rate-limited crawl
- source page changed since citation
