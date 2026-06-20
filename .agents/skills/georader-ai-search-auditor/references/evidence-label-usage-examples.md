# Evidence Label Usage Examples

Use this reference when deciding how to label claims. Prefer labels on important claims, scores, findings, and client-facing recommendations.

## CONFIRMED_FACT

Use for facts verified from supplied files, user-provided context, inspected repository files, runtime output, screenshots, exports, or supplied AI answers.

Good:

- `[CONFIRMED_FACT] The user supplied three competitors: Alpha, Beta, and Gamma.`
- `[CONFIRMED_FACT] The supplied AI answer mentions Competitor A first and does not mention {BRAND}.`
- `[CONFIRMED_FACT] The inspected report template labels the data as "sample".`

Bad:

- `[CONFIRMED_FACT] The site has no schema.` when only a static fetch was inspected.
- `[CONFIRMED_FACT] ChatGPT does not recommend the brand.` when no current AI answer output was supplied.

## OFFICIAL_SOURCE

Use only for primary-source-backed guidance. Name the official source or say it was supplied/checked.

Good:

- `[OFFICIAL_SOURCE] Google Search Central guidance should be followed for crawlability and indexability recommendations when Google Search is the target.`
- `[OFFICIAL_SOURCE] schema.org defines the vocabulary, but rich-result eligibility depends on platform-specific documentation.`

Bad:

- `[OFFICIAL_SOURCE] FAQ pages guarantee AI citations.`
- `[OFFICIAL_SOURCE] GEORADER Expert Review Framework is the official GEO standard.`

## RESEARCH_BACKED

Use for academic papers or credible research. Name the research when available and avoid stretching its scope.

Good:

- `[RESEARCH_BACKED] A cited GEO research paper can support the idea that source-backed claims may improve generative-engine visibility in the tested setting.`

Bad:

- `[RESEARCH_BACKED] All AI engines rank pages using this exact method.`
- `[RESEARCH_BACKED] This tactic guarantees recommendation in ChatGPT.`

## INDUSTRY_PRACTICE

Use for common SEO, CRO, content strategy, technical SEO, and marketing practices that are useful but not official standards.

Good:

- `[INDUSTRY_PRACTICE] Hub-and-spoke content architecture helps organize topical coverage and internal links.`
- `[INDUSTRY_PRACTICE] Clear CTAs and proof near the form reduce buyer anxiety.`
- `[INDUSTRY_PRACTICE] Comparison pages often serve high-intent evaluation queries.`

Bad:

- `[INDUSTRY_PRACTICE] Google officially requires hub-and-spoke architecture.`
- `[INDUSTRY_PRACTICE] AI will cite every page with a FAQ section.`

## GEORADER_ASSUMPTION

Use for GEORADER-specific strategy, scoring, report structure, positioning, roadmap, or product packaging.

Good:

- `[GEORADER_ASSUMPTION] The GEORADER Expert Review Framework scores Technical Discoverability, Search Intent Coverage, Topical Authority, Entity / Brand Authority, AI Citation Readiness, Competitive SERP / AI Gap, Conversion SEO, and Report / Product Value.`
- `[GEORADER_ASSUMPTION] Paid diagnosis can be packaged as a current-state report plus monthly improvement roadmap.`

Bad:

- `[GEORADER_ASSUMPTION] This is Google's official GEO score.`
- `[GEORADER_ASSUMPTION] The client's backend form works.` when no runtime evidence exists.

## NEEDS_VERIFICATION

Use when a claim could be useful but needs fresh research, current SERP/AI answer data, official documentation, runtime checks, or user-provided evidence.

Good:

- `[NEEDS_VERIFICATION] Current AI answer visibility should be measured with fresh ChatGPT/Gemini/Perplexity queries before client delivery.`
- `[NEEDS_VERIFICATION] Robots.txt and sitemap status were not inspected because no URL was supplied.`
- `[NEEDS_VERIFICATION] Search volume and ranking difficulty are unknown without keyword or Search Console data.`

Bad:

- `[NEEDS_VERIFICATION] The form definitely submits.` This should not be asserted.
- No label on an unsupported ranking or citation claim.

## Mixed Claim Pattern

Use multiple labels when a recommendation has several evidence types:

```md
- [CONFIRMED_FACT] The supplied report has no citation table.
- [INDUSTRY_PRACTICE] Citation tables make evidence easier to scan.
- [GEORADER_ASSUMPTION] GEORADER reports should include cited domains as a paid-diagnosis value signal.
- [NEEDS_VERIFICATION] Actual cited domains require fresh AI answer data.
```
