# Primary Source Watchlist

Research date: 2026-06-21

Purpose: list official and primary sources that should anchor Recora SEO/AIO/schema decisions. Public skills, blogs, and research can inspire patterns, but this watchlist owns factual refresh discipline.

## Watchlist

| Source | URL | Why it matters for Recora | What changes often | Refresh interval | What to never overclaim | How it affects SKILL.md / references / future scripts |
|---|---|---|---|---|---|---|
| OpenAI Codex Skills docs | https://developers.openai.com/codex/skills | Defines Codex skill structure, references, metadata, and progressive disclosure expectations. | Skill format, recommended metadata, references/scripts conventions. | 60-90 days, and before metadata changes. | Do not claim unsupported skill behavior or undocumented routing guarantees. | Keep `SKILL.md` thin; update reference routing if docs change. |
| OpenAI Skills Catalog | https://github.com/openai/skills | Public examples of skill packaging and curated reference/script patterns. | Repo structure, examples, license files. | 60-90 days. | Do not assume all skills share one license or format detail. | Use for structure inspiration only. |
| Google AI optimization guide | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide | Official Google framing for generative AI features on Search. | AI Overviews/AI Mode language, feature eligibility, llms.txt statements, crawler/rendering advice. | 60-90 days. | Do not claim any page will appear in AI Overviews or AI Mode. | Guides safe AIO/GEO language and SEO/AIO separation. |
| Google structured data guidelines | https://developers.google.com/search/docs/appearance/structured-data/sd-policies | Official rules for structured data quality and eligibility. | Supported formats, rich-result policies, required/recommended fields, manual-action language. | 60-90 days. | Do not claim structured data guarantees rich results, rankings, traffic, or AI citations. | Drives schema caveats and validation requirements. |
| Google structured data feature docs | https://developers.google.com/search/docs/appearance/structured-data/search-gallery | Official list of supported Search structured data features. | Rich result availability, feature deprecations, eligibility. | 60 days, before recommending a rich result. | Do not claim schema.org type validity equals Google feature eligibility. | Future schema checker should flag feature support separately from schema.org validity. |
| Google robots.txt docs | https://developers.google.com/search/docs/crawling-indexing/robots/intro | Clarifies robots.txt as crawl-access control, not index removal. | Examples, limitations, bot-specific guidance. | 60-90 days. | Do not claim robots.txt controls all crawlers or prevents indexing by itself. | Future robots checker should separate access, indexation, and AI use. |
| Google robots meta / X-Robots-Tag docs | https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag | Defines noindex/nofollow/snippet directives and header behavior. | Directive support and examples. | 60-90 days. | Do not assume a blocked crawler sees noindex. | Future noindex checker should combine headers, meta, and robots access. |
| Google canonical docs | https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls | Defines canonical signals and duplicate URL consolidation. | JS canonical guidance, duplicate handling, examples. | 60-90 days. | Do not claim canonical is an absolute directive. | Future canonical checker should flag conflicts and internal-link mismatch. |
| Google sitemap docs | https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview | Defines sitemap discovery support. | XML guidance, lastmod guidance, sitemap index recommendations. | 60-90 days. | Do not claim sitemap submission guarantees crawl or index. | Future sitemap checker should report inclusion, not promised indexing. |
| schema.org Organization | https://schema.org/Organization | Entity identity for Recora/client organizations. | Properties and pending/deprecated status. | 90-180 days. | Do not imply authority from Organization schema alone. | Schema candidates for LP/about/provider pages. |
| schema.org SoftwareApplication | https://schema.org/SoftwareApplication | Recora software product pages and SaaS-like offers. | Properties and examples. | 90-180 days. | Do not encode invisible features, pricing, ratings, or availability. | Schema candidate for Recora LP/product pages. |
| schema.org FAQPage | https://schema.org/FAQPage | Visible FAQ sections and FAQ pages. | Type/properties; Google rich-result support is separate. | 90-180 days; Google feature support 60 days. | Do not claim FAQPage guarantees Google FAQ rich results or AI citations. | FAQ schema only when visible Q&A matches. |
| schema.org Article | https://schema.org/Article | Glossary, research, public report, and guide pages. | Properties, author/date/publisher conventions. | 90-180 days. | Do not invent author/date/publisher details. | Schema candidate for reports, guides, glossary pages. |
| schema.org BreadcrumbList | https://schema.org/BreadcrumbList | Site hierarchy and breadcrumb markup. | Properties and examples. | 90-180 days. | Do not add hierarchy that page/site structure does not support. | Use `BreadcrumbList`, not loose "Breadcrumb schema" wording. |
| schema.org Product | https://schema.org/Product | Product-like SaaS offer pages where visible content supports it. | Offer/review/rating property conventions. | 90-180 days. | Do not add reviews, ratings, prices, or offers without visible evidence. | Product vs Service decision depends on page intent. |
| schema.org Service | https://schema.org/Service | Service/diagnosis/consulting pages. | Properties and examples. | 90-180 days. | Do not invent service area, provider, rating, or offer details. | Candidate for service pages and diagnosis offerings. |
| Bing Webmaster Guidelines | https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a | Secondary search-engine guidance beyond Google. | Bing crawler/indexing/spam guidance; page requires JS in some fetches. | 90 days. | Do not apply Bing guidance as Google or AI-search behavior. | References only; future scripts may track Bing-specific checks separately. |
| Bing robots.txt help | https://www.bing.com/webmasters/help/how-to-create-a-robots-txt-file-cb7c31ec | Bing-specific crawl control context. | Bot support, examples, interface details. | 90 days. | Do not assume Bingbot rules apply to all AI/search crawlers. | Optional future robots checker source. |
| Microsoft IndexNow | https://www.indexnow.org/ | URL change notification protocol supported by some engines. | Participating engines, API guidance, implementation details. | 90 days. | Do not claim IndexNow guarantees indexing or ranking. | Future discovery-support notes only. |
| Perplexity docs overview | https://docs.perplexity.ai/docs/getting-started/overview | Public provider docs exist, but crawler-specific public docs were not verified in this pass. | Product/API docs, crawler docs if published. | 30-60 days. | Do not claim Perplexity crawler behavior from unofficial reports as official fact. | Mark provider/crawler behavior `NEEDS_VERIFICATION` unless official docs or measured logs exist. |
| W3C JSON-LD 1.1 | https://www.w3.org/TR/json-ld11/ | Primary technical standard for JSON-LD syntax and linked-data concepts. | Stable recommendation; errata/editor drafts may evolve. | 180 days or before advanced JSON-LD design. | Do not equate JSON-LD technical validity with Google rich-result eligibility or AI citation. | Future JSON-LD checker can separate syntax, schema.org semantics, and Google support. |

## Source Classification Rules

- `OFFICIAL_PRIMARY`: OpenAI, Google, schema.org, Microsoft/Bing, W3C, provider-owned docs.
- `PUBLIC_SKILL`: GitHub/public skill repos; useful for design patterns.
- `THIRD_PARTY_ANALYSIS`: blogs, news, independent audits, industry posts.
- `RESEARCH`: papers and benchmarks; useful for risk models and eval design.
- `RECORA_MEASURED`: Recora/client observed prompt/provider/date/source data.

## Conflict Rules

- Official source beats public skill when the claim is about platform behavior.
- Current measured Recora data beats generic industry claims for that specific diagnosis.
- Research papers inform risk/eval design but do not become product claims without validation.
- When official sources are silent, keep the claim as `NEEDS_VERIFICATION`.
- Provider-specific docs apply only to that provider.

## Update Procedure

1. Check the relevant source before client-facing recommendations that depend on it.
2. Record source date, source category, and what changed.
3. Update `reference-freshness-policy.md` only when the refresh interval or category logic changes.
4. Update `seo-schema-aio-source-notes.md` when factual guidance changes.
5. Update `evidence-collector-ideas.md` only when a source affects future script design.
