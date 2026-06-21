# Recommendation Falsifiability

Research date: 2026-06-21

Purpose: make Recora SEO/AIO/schema recommendations testable without implying guaranteed SEO rankings or AI citations.

## Core Model

Every important recommendation should answer:

- Observation: what was observed?
- Hypothesis: why should the recommendation address the observation?
- Recommendation: what should change?
- Dependency: what must be true for the recommendation to be valid?
- Leading indicator: what early signal would suggest the change is working?
- Failure condition: what outcome would show the recommendation did not work or needs revision?
- Validation method: how to check the signal?
- Evidence needed: what evidence is missing or required?
- Caveat: what the recommendation does not guarantee.
- Quality-gate trigger: when to route to `recora-recommendation-quality-gate-auditor`.

## Recora Falsifiability Template

```md
### Recommendation

- Observation:
- Hypothesis:
- Recommendation:
- Dependency:
- Leading indicator:
- Failure condition:
- Validation method:
- Evidence needed:
- Caveat:
- Quality-gate trigger:
```

## Examples

### 1. FAQ addition

- Observation: AI-search answers or page review show recurring confusion about pricing, diagnosis inputs, source evidence, or implementation limits.
- Hypothesis: Visible, question-scoped answers reduce ambiguity and make the page easier to extract accurately.
- Recommendation: Add visible FAQ sections with one direct answer per question and match schema only when FAQ text is visible.
- Dependency: Target page has enough verified facts to answer the question without inventing claims.
- Leading indicator: Re-measured answers use fewer incorrect assumptions or page snippets become more aligned with visible FAQ wording.
- Failure condition: After a defined recheck window, measured answers still repeat the same misunderstanding or the FAQ is not crawled/rendered.
- Validation method: Compare before/after AI-search observations, page source/rendered HTML, and internal links to FAQ anchors.
- Evidence needed: Original prompt/provider/date, answer text, target page HTML, FAQ copy, and crawl/index evidence where available.
- Caveat: FAQ structure and FAQPage schema do not guarantee AI citation, ranking, or rich result display.
- Quality-gate trigger: FAQ mentions pricing, competitor claims, customer outcomes, AI citation expectations, or source gaps.

### 2. Comparison page improvement

- Observation: Competitor/source-gap evidence shows Recora or a client is missing from comparison-stage prompts or is described less clearly than competitors.
- Hypothesis: A fair comparison page can clarify criteria and entity fit for users and extraction systems.
- Recommendation: Create or improve a comparison page with scope, audience, criteria, fair fit/non-fit guidance, evidence limits, and update date.
- Dependency: Competitor statements are sourced or clearly marked `NEEDS_VERIFICATION`.
- Leading indicator: The page becomes easier to extract into neutral comparison criteria; internal links and headings align with buyer questions.
- Failure condition: Re-audit finds unsupported competitor claims, one-sided sales copy, or no improvement in answer extractability.
- Validation method: Review source evidence, rendered page structure, schema/body consistency, and measured comparison prompts.
- Evidence needed: Competitor source texts, prompt observations, page inventory, legal/brand constraints.
- Caveat: A comparison page can improve clarity but does not guarantee AI recommendation or competitor displacement.
- Quality-gate trigger: Any competitor, pricing, legal, or comparative superiority claim.

### 3. Pricing page clarity

- Observation: Users or AI-search answers misunderstand plan scope, included items, usage limits, billing conditions, or next step.
- Hypothesis: Explicit pricing structure reduces unsupported assumptions in user and AI summaries.
- Recommendation: Add visible pricing model, included/excluded items, limits, billing/contract terms, plan fit, and pricing FAQ.
- Dependency: Pricing facts are approved and current.
- Leading indicator: Page reviewers and measured answers summarize pricing with fewer missing or incorrect conditions.
- Failure condition: Pricing remains ambiguous, requires hidden sales knowledge, or conflicts with product/legal facts.
- Validation method: Compare visible copy, metadata, FAQ, schema fields, and user-facing sales materials.
- Evidence needed: Approved pricing source, page copy, update date, and any measured answer examples.
- Caveat: Pricing clarity may support conversion and extraction clarity but does not guarantee revenue or AI citation.
- Quality-gate trigger: Any pricing, discount, contract, guarantee, or ROI statement.

### 4. JSON-LD addition

- Observation: Page has clear visible entity/page facts but lacks matching JSON-LD or has invalid/mismatched structured data.
- Hypothesis: Valid body-aligned JSON-LD can support machine interpretation when it does not add new claims.
- Recommendation: Add or repair JSON-LD using only visible/supportable facts and validate rendered output.
- Dependency: Required fields are present on page or can be added visibly.
- Leading indicator: Schema parser detects valid JSON-LD, and schema fields match page text.
- Failure condition: Validator errors remain, fields are invisible/unsupported, or page intent maps to the wrong schema type.
- Validation method: JSON-LD extractor, schema validator, rendered HTML check, manual body/schema consistency review.
- Evidence needed: Rendered HTML, visible content, target schema type, validation result.
- Caveat: JSON-LD can support interpretation and eligible features, but it does not guarantee rankings, rich results, or AI citations.
- Quality-gate trigger: Review/rating/pricing/offer/customer result fields or any invented fact risk.

### 5. robots check

- Observation: Important public pages may be blocked, or private/dashboard pages may be exposed without clear approval.
- Hypothesis: Crawl and index controls should match page intent before SEO/AIO recommendations are made.
- Recommendation: Check robots.txt, page robots meta, X-Robots-Tag, and crawler access by page type.
- Dependency: The page's intended public/private status is confirmed.
- Leading indicator: Public target pages are not accidentally blocked; private pages are not recommended for indexation.
- Failure condition: Crawl access remains misaligned with page intent or bot access is incorrectly presented as AI visibility.
- Validation method: robots parser, header check, rendered/source HTML, sitemap comparison, product/security approval for private areas.
- Evidence needed: robots.txt, headers, page HTML, sitemap, intended page policy.
- Caveat: Crawler access does not guarantee indexing, ranking, AI exposure, or citation.
- Quality-gate trigger: Dashboard, private report, user data, diagnosis flow, or bot-specific AI-search claim.

### 6. Source gap to third-party placement

- Observation: `recora-ai-citation-analysis` identifies a source gap where AI answers rely on third-party sources and owned pages alone are unlikely to supply independent evidence.
- Hypothesis: Owned-page clarity and legitimate third-party evidence solve different parts of the source gap.
- Recommendation: Split action into owned-page clarification and legitimate third-party evidence work such as directories, partner pages, analyst/media coverage, or review correction.
- Dependency: Source gap is verified against measured AI answers and source text.
- Leading indicator: New or corrected third-party sources contain accurate, attributable, crawlable facts.
- Failure condition: Third-party action becomes spammy, unsupported, paid without disclosure, or does not correct the source gap.
- Validation method: Source text review, crawl/index check, AI-search remeasurement, quality-gate review.
- Evidence needed: Prompt/provider/date, cited sources, competitor source advantage, candidate third-party source policy.
- Caveat: Third-party coverage must be earned or corrected legitimately and does not guarantee AI adoption.
- Quality-gate trigger: Any outreach, review, directory, media, partner, or third-party citation recommendation.

### 7. Case study addition

- Observation: Recora/client pages lack concrete proof, methodology, timeline, customer attributes, or outcome constraints.
- Hypothesis: Evidence-rich case structure improves claim support and reduces overgeneralized summaries.
- Recommendation: Add case study structure: problem, baseline, action, result, measurement basis, timeline, approval/anonymization status, and replication caveat.
- Dependency: Customer approval and measurable evidence exist.
- Leading indicator: Case study claims become attributable and easier to summarize without overgeneralization.
- Failure condition: Claims cannot be verified, results imply guaranteed replication, or approval status is unclear.
- Validation method: Review customer-approved materials, dates, metrics, screenshots, and page copy.
- Evidence needed: Customer/source approval, metric definitions, time period, baseline, result evidence.
- Caveat: A case study can support evidence density but does not guarantee similar outcomes or AI citation.
- Quality-gate trigger: Customer claims, quantitative results, industry comparisons, or anonymized proof.

### 8. Glossary addition

- Observation: Recora/client category terms are unclear or AI-search answers use inconsistent definitions.
- Hypothesis: Consistent definitions and internal links strengthen entity clarity and prompt-topic coverage.
- Recommendation: Add glossary pages with short definition, related terms, examples, Recora context, caveats, and internal links.
- Dependency: Definitions are accurate and aligned with product truth.
- Leading indicator: Pages provide extractable definitions and connect to service/report/comparison pages.
- Failure condition: Glossary becomes thin, duplicated, keyword-stuffed, or disconnected from user questions.
- Validation method: Page outline review, internal-link map, duplicate/thin-content check, measured answer wording.
- Evidence needed: Term list, target audience, product context, related page inventory.
- Caveat: Glossary content can improve clarity but does not guarantee ranking or AI answer inclusion.
- Quality-gate trigger: Any term definition tied to regulated, legal, medical, financial, or competitor claims.

### 9. Sample report page improvement

- Observation: Sample report does not make diagnosis outputs, evidence labels, caveats, source intelligence, or recommendation logic easy to extract.
- Hypothesis: A clearer sample report helps users and extraction systems understand what Recora measures without implying guaranteed outcomes.
- Recommendation: Structure sample report with clear evidence labels, source-gap explanation, methodology, measured vs inferred separation, and caveat blocks.
- Dependency: Sample data is approved, non-private, and clearly labeled as sample or anonymized.
- Leading indicator: Reviewers and AI-search tests can summarize what Recora measures and what recommendations mean without confusing sample data for a guarantee.
- Failure condition: Output implies guaranteed AI visibility, hides caveats, or exposes private/client data.
- Validation method: Rendered page review, privacy review, AI-search remeasurement, quality-gate audit.
- Evidence needed: Sample report source, privacy approval, methodology text, labels, caveat copy.
- Caveat: Better sample report structure supports understanding and extraction clarity; it does not guarantee AI citation or conversion.
- Quality-gate trigger: Any sample-client claim, measurement methodology claim, dashboard data, or guarantee-adjacent wording.

### 10. Sitemap check

- Observation: A public target page is not confirmed in sitemap data, or sitemap entries may include blocked, duplicate, private, or stale URLs.
- Hypothesis: Sitemap clarity can support URL discovery when canonical public pages are represented accurately.
- Recommendation: Verify sitemap inclusion, canonical URL alignment, lastmod quality, and blocked/noindex URL exclusion.
- Dependency: Target page is intended to be public and sitemap files are available.
- Leading indicator: Public canonical pages appear in sitemap and blocked/private pages are absent.
- Failure condition: Sitemap remains stale, includes noncanonical/private URLs, or is described as an indexing guarantee.
- Validation method: Sitemap parser, robots.txt sitemap directive check, canonical/noindex comparison.
- Evidence needed: sitemap URL(s), robots.txt, canonical target, index intent.
- Caveat: Sitemap inclusion supports discovery but does not guarantee crawling, indexing, ranking, or AI citation.
- Quality-gate trigger: Sitemap recommendations affect private reports, dashboards, or client-sensitive pages.

### 11. AI-answer misinformation correction page

- Observation: Measured branded prompts show AI answers repeating incorrect product facts, pricing, availability, methodology, or source claims.
- Hypothesis: A visible, crawlable source-of-truth page can reduce ambiguity for users and future retrieval systems.
- Recommendation: Create or improve a public correction/FAQ/source-of-truth page with corrected facts, dates, scope, caveats, and internal links.
- Dependency: The misinformation is measured with prompt/provider/date/answer text and corrected facts are approved.
- Leading indicator: Re-measured branded prompts show fewer incorrect claims or cite/mention the corrected public source.
- Failure condition: Misinformation persists after remeasurement, the correction page is not discoverable, or facts remain ambiguous.
- Validation method: Before/after AI-search measurement, rendered page inspection, internal-link check, Search Console/crawl evidence if available.
- Evidence needed: prompt, provider, date, answer text, approved correction facts, target page HTML.
- Caveat: A correction page may support factual clarity but does not guarantee AI systems will use or cite it.
- Quality-gate trigger: Any correction involving pricing, legal, customer, competitor, safety, or public reputation claims.

## When To Use `NEEDS_VERIFICATION`

Use `NEEDS_VERIFICATION` when:

- observed evidence is screenshot-only, route-only, or user-description-only
- crawlability, indexability, rendered content, schema validity, or source text has not been inspected
- AI-search observation lacks prompt, provider, date, or answer text
- recommendation depends on third-party source content not yet read
- pricing, reviews, customer outcomes, competitor claims, or source-gap conclusions are not verified
- expected effect is based on third-party public skill claims or industry statistics

## Quality-Gate Triggers

Route to `recora-recommendation-quality-gate-auditor` when:

- failure condition is ambiguous
- leading indicator is not measurable
- recommendation could be read as guaranteed ranking, traffic, conversion, or AI citation
- schema would encode facts not visible on the page
- third-party/source ecosystem action is proposed
- public indexation of dashboard/private/report data is involved
