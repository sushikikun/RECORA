# Source Review Checklist

Use this checklist when reviewing each cited URL or referenced source. Do not judge a citation from the URL alone when source text or metadata can be checked.

## Required Review Fields

For each source, record:

- `citation_id`
- `url`
- `final_url`
- `normalized_domain`
- `source_accessibility`
- `source_text_status`
- `page_title`
- `author_or_publisher`
- `published_at`
- `updated_at`
- `language`
- `region_or_market`
- `page_type`
- `page_purpose`
- `source_owner`
- `cited_entity`
- `supporting_passage_summary`
- `passage_location_hint`
- `quality_signal`
- `authority_signal`
- `bias_flags`
- `volatility_flags`
- `risk_flags`
- `control_level`
- `verification_needed`
- `client_report_ready`

## Checklist

### Access And URL

- Does the URL exist?
- Does it return the expected content?
- Does it redirect? If yes, record raw URL and final URL.
- Is `final_url` confirmed?
- Does the URL displayed in the citation UI match the final URL?
- Is this an app/dashboard URL rather than a public content page?
- Is it readable as an external shared URL?
- Does it require login?
- Is it a post-login page?
- Is it paywalled?
- Is it blocked or unavailable?
- Does canonical URL differ from the cited URL?

### Page Identity

- What is the page title?
- Who is the author, publisher, or operator?
- Is the source official, third-party, competitor-owned, comparison, review, directory, social, government/academic, or unknown?
- Is the page in the relevant language and region?
- Is the page about the same product, service, category, or market as the AI answer?

### Freshness

- Is a published date visible?
- Is an updated date visible?
- Is the topic time-sensitive?
- Is the information stale for the claim being made?
- Does the source show old pricing, old features, old rankings, or old brand positioning?

### Claim Support

- Is `source_text` non-empty?
- Is the AI-answer claim present in the source body?
- Is the support direct, partial, adjacent, unsupported, contradicted, or unverifiable?
- Is there a passage that supports the claim?
- Does the passage support the same entity, product, market, date, and scope?
- Does the source support the claim or only the general topic?
- Has the source been marked `confirmed` from URL/domain alone? If yes, downgrade it.

### Authority And Quality

- Is the source primary evidence, expert/editorial evidence, user review, directory listing, or marketing copy?
- Does the source include original evidence, methodology, data, screenshots, review counts, or citations?
- Is the page thin, duplicated, scraped, AI-generated, or generic?
- Are author and publisher signals clear?
- Does the source look maintained?

### Bias And Commercial Influence

- Are affiliate links present?
- Is there sponsorship or pay-to-play risk?
- Is the vendor profile claimed or controlled by the vendor?
- Is the ranking method clear?
- Are review counts and review freshness visible?
- Is there excessive commercial intent?

### Entity And Gap

- Which entity does the source strengthen: own brand, competitor, category, neutral, or unknown?
- Does the source omit the own brand while including competitors?
- Does the source misrepresent the own brand?
- Can the own site directly fix the information gap?
- Is third-party outreach or listing correction needed?

### Client Report Readiness

- Can this source be cited in a client-facing finding?
- Does the source require caveats?
- Is the source text checked?
- Is the finding confirmed, likely, hypothesis, advisory, unverified, contradicted, or blocked?
- What verification is needed before publication?
- If the URL is an app/dashboard page and source text is empty, has it been normalized to `login_required` or `source_text_unavailable`?

## Output Notes

Summarize the supporting passage instead of quoting long text. If no source text is checked, write `not_checked` and downgrade the finding.

If a citation URL points to an application/dashboard page and no source text is available, treat it as `login_required` or `source_text_unavailable`. Do not treat the URL as confirmed evidence even if the brand or competitor can be identified from the domain.
