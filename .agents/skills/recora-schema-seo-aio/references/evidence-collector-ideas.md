# Evidence Collector Ideas

Research date: 2026-06-21

Purpose: outline future deterministic or hybrid evidence collectors for `recora-schema-seo-aio`. Do not create scripts from this file automatically. Scripts should support audits with evidence, not publish recommendations without human/LLM judgment.

## Design Principles

- No script should read `.env`, `.env.local`, API keys, cookies, credentials, or private dashboards unless the user explicitly provides an approved artifact.
- Prefer deterministic parsing for technical facts and human/LLM judgment for page intent, evidence quality, and AIO/GEO interpretation.
- Output machine-readable JSON plus a concise human summary.
- Mark missing or blocked evidence as `NEEDS_VERIFICATION`.
- Separate SEO technical evidence from AIO/GEO extractability evidence.
- Treat bots, robots, sitemap, schema, body structure, and third-party sources as separate evidence lanes.

## Candidate Collectors

| Collector | Purpose | Inputs | Output | Risk | Deterministic script appropriate? | Human/LLM judgment still needed? |
|---|---|---|---|---|---|---|
| Metadata checker | Extract title, meta description, OG/Twitter basics, language, viewport, and obvious duplicate/missing values. | URL, HTML source, rendered HTML, or saved page file. | JSON with values, lengths, duplicates, missing fields, and evidence snippets. | Length heuristics can become rigid; title quality is semantic. | Yes. | Yes, for page intent fit and copy quality. |
| Heading outline checker | Build H1-H6 outline and flag missing H1, multiple H1s, skipped levels, or vague headings. | HTML source or rendered DOM. | Ordered heading list, hierarchy warnings, target sections. | Some designs intentionally use multiple H1s; hidden headings may mislead. | Yes. | Yes, for whether headings answer buyer questions. |
| Canonical / noindex checker | Detect canonical, robots meta, X-Robots-Tag, noindex/nofollow, and conflicts. | HTTP headers, HTML source, rendered HTML. | Canonical URL, index directives, conflicts, `NEEDS_VERIFICATION` where headers unavailable. | Static fetch can miss JS changes; blocked fetch is not a page issue. | Yes. | Yes, for deciding public/index intent. |
| robots checker | Fetch and parse robots.txt, relevant groups, sitemap directives, and common crawler access for Googlebot and named AI crawlers. | Domain URL and robots.txt. | Access summary per crawler and path, sitemap references, parser caveats. | robots syntax differs by crawler; access does not prove indexing or AI use. | Yes. | Yes, for policy implications and dashboard/privacy decisions. |
| sitemap checker | Discover sitemap from robots.txt or common paths, parse URL entries, identify target page inclusion, lastmod, and public page coverage. | Domain URL, robots.txt, sitemap XML. | Sitemap list, target inclusion, parse errors, stale/missing signals. | Sitemap inclusion does not guarantee crawling/indexing. | Yes. | Yes, for page importance and internal-link recommendations. |
| JSON-LD extractor | Extract JSON-LD blocks, parse `@type`, `@id`, graph nodes, syntax errors, and page/entity relationships. | HTML source or rendered HTML. | Parsed nodes, type list, syntax errors, missing context/type, source line if available. | Rendered vs source mismatch; script cannot decide if facts are true. | Yes. | Yes, for schema/body consistency and type appropriateness. |
| Schema/body consistency checker | Compare schema fields against visible text and page facts: names, descriptions, prices, ratings, dates, FAQ pairs, breadcrumbs. | Parsed JSON-LD, visible text, headings, extracted FAQ/pricing/review sections. | Field-level status: visible, supported, missing, conflicting, `NEEDS_VERIFICATION`. | String matching can miss paraphrases or falsely match boilerplate. | Hybrid. | Yes, strongly. |
| Internal-link checker | Extract internal links, anchor text, link depth if crawl allowed, and links to/from priority pages. | URL, HTML, optional crawl set. | Internal link map, orphan risk, anchor clarity notes, target page gaps. | Crawl depth can explode; JS links may be missed. | Yes for extraction; limited crawl scope. | Yes, for information architecture recommendations. |
| Answer extractability checker | Detect direct-answer blocks, definitions, summaries, Q&A, tables, dates, authors, methodology, and evidence labels. | Rendered text, headings, markdown/HTML sections, screenshot OCR if needed. | Extractability score components and missing elements by section. | Scoring is subjective; cannot predict AI adoption. | Hybrid. | Yes, for quality, clarity, and Recora-specific interpretation. |
| Pricing clarity checker | Identify pricing model, plan names, included/excluded items, limits, contract terms, CTA, FAQ, and caveats. | Pricing page HTML/text or user-provided copy. | Pricing facts found/missing, ambiguity list, recommended visible sections. | Pricing may intentionally require inquiry; false positives if business model is custom. | Hybrid. | Yes, for conversion and trust judgment. |
| FAQ visibility checker | Extract visible FAQ questions/answers, accordion state, schema match, and topic grouping. | HTML source, rendered DOM, JSON-LD. | FAQ list, visibility status, schema match/mismatch, topic gaps. | Hidden/accordion content can still be user-visible; browser state matters. | Yes for extraction; hybrid for grouping. | Yes, for buyer-intent coverage and safe wording. |
| Source gap to page action mapper | Convert `recora-ai-citation-analysis` source gaps into owned-page fixes, new pages, internal links, and third-party evidence needs. | Source gap record, AI answer evidence, cited URLs, target page inventory. | Action map with owned vs third-party controls, required evidence, and quality-gate flags. | Source gaps can be stale or based on unverified source text. | Hybrid. | Yes, strongly. |
| Reference freshness checker | Compare reference source dates, source categories, and refresh windows against `reference-freshness-policy.md`. | Reference files, source tables, research dates, optional current source metadata. | Freshness labels, stale references, claims requiring `NEEDS_VERIFICATION`, source categories needing recheck. | Dates can be present but claims may still be unsupported; external checks may need network. | Yes for local date/category checks; optional network checks only with approval. | Yes, for deciding whether a stale claim affects a client recommendation. |

## Future Script Output Contract

Recommended JSON shape:

```json
{
  "collector": "metadata-checker",
  "mode": "source|rendered|user_supplied",
  "target": "https://example.com/page",
  "evidence_level": "measured|source|rendered|screenshot|user_description",
  "findings": [
    {
      "layer": "seo_technical|aio_geo_extractability|structured_data|content_structure|source_ecosystem",
      "status": "confirmed|likely|needs_verification|not_applicable",
      "evidence": "short observed fact",
      "risk": "short caveat",
      "recommended_followup": "implementable next check or fix"
    }
  ],
  "limitations": [
    "missing rendered HTML",
    "robots fetch blocked"
  ]
}
```

## Script Suitability Notes

- Best first scripts: metadata checker, heading outline checker, canonical/noindex checker, JSON-LD extractor.
- Next scripts: robots checker, sitemap checker, FAQ visibility checker, internal-link checker, reference freshness checker.
- Highest judgment scripts: answer extractability checker, pricing clarity checker, schema/body consistency checker, source gap mapper.
- Browser-based collectors should be optional because they add runtime, dependencies, and sandbox/network risk.
- External APIs should be optional and explicit. Do not require credentials for baseline audits.

## Human Review Gates

Require human/LLM review before client-facing output when:

- a recommendation affects public indexation of Recora dashboard or diagnosis flow pages
- schema encodes pricing, reviews, ratings, customer outcomes, or competitor claims
- a page action is based on an AI-search source gap
- the collector uses only screenshot or user description
- third-party outreach, reviews, directories, PR, or partner mentions are proposed
- wording could imply guaranteed SEO ranking or AI citation
