# SEO / Schema / AIO Source Notes

Research date: 2026-06-21

Purpose: summarize primary SEO/schema/AIO guidance for Recora's `recora-schema-seo-aio` skill. These notes are not a replacement for current source verification when a client-facing claim depends on a specific search feature, schema eligibility, or platform behavior.

## Source Index

### Google Official Sources

| Source | URL | License if visible | Recora use |
|---|---|---|---|
| Google Search Central: Optimizing for generative AI features on Google Search | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide | Page footer indicates CC BY 4.0 for docs and Apache 2.0 for code samples | AIO/GEO safety language, Google AI Overviews/AI Mode guidance, SEO vs AEO/GEO framing |
| Google Search Central: General structured data guidelines | https://developers.google.com/search/docs/appearance/structured-data/sd-policies | Google docs license applies; verify current page footer when quoting | Structured data eligibility, JSON-LD recommendation, visible-content consistency, no guarantee of rich results |
| Google Search Central: Introduction to robots.txt | https://developers.google.com/search/docs/crawling-indexing/robots/intro | Google docs license applies; verify current page footer when quoting | robots.txt limitations and crawl vs index separation |
| Google Search Central: Sitemaps overview | https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview | Google docs license applies; verify current page footer when quoting | Sitemap as discovery support, not crawl/index guarantee |
| Google Search Central: Canonicalization | https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls | Google docs license applies; verify current page footer when quoting | Canonical signals, duplicate URL consolidation, JS canonical clarity |
| Google Search Central: Robots meta tags and X-Robots-Tag | https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag | Google docs license applies; verify current page footer when quoting | noindex/nofollow handling and crawler access requirements |
| Google Search Central updates: FAQ rich result removal | https://developers.google.com/search/updates#removing-faq-rich-result | Google docs license applies; verify current page footer when quoting | FAQ rich-result caveat for Google Search |

### Schema.org Official Type Sources

| Type | URL | Recora use |
|---|---|---|
| Organization | https://schema.org/Organization | Recora or client entity identity, official profiles, contact/brand facts when visible/supported |
| SoftwareApplication | https://schema.org/SoftwareApplication | Recora software/product pages when visible content supports app category, feature scope, provider, screenshots, operating context, offer/pricing status |
| FAQPage | https://schema.org/FAQPage | Visible FAQ pages or sections; Google FAQ rich-result support must be verified separately |
| Article | https://schema.org/Article | Glossary, research, report, guide, or editorial pages with visible headline/body/date/author/publisher signals |
| BreadcrumbList | https://schema.org/BreadcrumbList | Visible or meaningful page hierarchy using ordered list items and positions |
| Product | https://schema.org/Product | Product-like pages or SaaS product descriptions only when visible facts support product, brand, offers, ratings, etc. |
| Service | https://schema.org/Service | Service pages with visible provider, service category, area/audience/channel/offer details |

### OpenAI Official Sources

| Source | URL | License if visible | Recora use |
|---|---|---|---|
| OpenAI Codex Skills docs | https://developers.openai.com/codex/skills | `NEEDS_VERIFICATION` | Skill structure, references folder, frontmatter, implicit trigger descriptions |
| OpenAI API evals guide | https://developers.openai.com/api/docs/guides/evals | `NEEDS_VERIFICATION` | Evaluation thinking: representative test data, explicit testing criteria, ground-truth or expected outputs |
| OpenAI Skills Catalog | https://github.com/openai/skills | Per-skill license files; sample checked as Apache-2.0 | Public examples of references and optional metadata |

### Third-Party / Research Sources

Public SEO/GEO skill repositories and industry articles can inspire checklists and evidence collection, but their claims about AI visibility, market size, traffic, correlation, or platform behavior are not primary facts for Recora. Use `NEEDS_VERIFICATION` unless confirmed by primary data, measured Recora observations, or official platform documentation.

For public skill safety and research-derived risk handling, use:

- `public-skill-risk-notes.md` for public skill intake, license, metadata, supply-chain, credential, and side-effect risks.
- `reference-freshness-policy.md` for refresh intervals and stale-source labels.
- `recommendation-falsifiability.md` when turning official or third-party evidence into a testable recommendation.

## Primary Guidance For Recora

### Structured data is supportive, not a guarantee

- Structured data can help Google and other systems understand page meaning and can make a page eligible for supported search features.
- Valid structured data does not guarantee rich results, rankings, traffic, AI citations, or AI recommendations.
- A structured data manual action can affect rich-result eligibility. Do not treat schema as a ranking lever.
- For Recora outputs, describe schema as an interpretation and eligibility support layer.

Safe wording:

- "This schema may support machine interpretation and rich-result eligibility where the feature is supported."
- "This does not guarantee ranking, rich results, AI citation, or AI recommendation."

Unsafe wording:

- "Add schema so AI systems will cite the page."
- "JSON-LD will improve rankings."
- "FAQPage schema will create Google FAQ rich results." Google removed the FAQ rich result documentation in 2026; verify current Search feature support before mentioning rich-result eligibility.

### JSON-LD usage

- Google supports JSON-LD, Microdata, and RDFa for eligible structured data; JSON-LD is the recommended format in Google's structured data guidelines.
- Recora should recommend JSON-LD by default because it is easier to keep separate, validate, and manage in Next.js/React contexts.
- Prefer stable `@id` values when multiple nodes describe the same organization, product, service, article, breadcrumb, or web page.
- Future implementation must validate rendered output, because static source checks can miss injected or missing JSON-LD.

### Visible content and schema consistency

- Do not mark up content that is not visible or otherwise clearly supported by the page.
- If visible facts are missing, the recommendation should say which page section must be added before schema can safely encode the fact.
- Review, AggregateRating, pricing, availability, customer outcomes, and competitor claims require especially strict visible evidence.
- Missing data should be marked `NEEDS_VERIFICATION` rather than guessed.

Recora-specific application:

- LP: Organization + SoftwareApplication may be appropriate only if the page clearly states company/product identity, product category, features, provider, and offer state.
- Sample report page: Article or Report-like article structure may be appropriate if visible metadata, methodology, body, caveats, and update date exist.
- Diagnose/new page: schema should not distract from trust, privacy, input clarity, and conversion flow. Form pages are not automatically SEO targets.
- Dashboard pages: usually private product surfaces. Do not recommend public indexation or public schema without product/security approval.

### robots.txt limitations

- robots.txt controls crawler access; it is not a reliable method for keeping a page out of search results.
- A disallowed URL can still appear without a useful snippet if other pages link to it.
- Use noindex or access control for index exclusion when the page can be crawled or when privacy requires protection.
- A crawler blocked by robots.txt may not see page-level `noindex` or structured data.

Recora-specific application:

- Separate "bot access can fetch the page" from "the page is indexed" and from "AI systems will use the page."
- Do not say allowing GPTBot, Googlebot, PerplexityBot, or other crawlers will increase AI-search exposure.
- For private dashboards, blocking/public access is a product/security decision, not an SEO optimization.

### noindex, canonical, sitemap, and internal links

- `noindex` and X-Robots-Tag directives are indexing/serving controls when a crawler can discover them.
- Canonical annotations help communicate a preferred URL, especially for duplicates, but they are signals and must align with internal links.
- Sitemaps help search engines discover URLs, but do not guarantee crawling or indexing.
- Internal links help discovery, hierarchy, and topical relationships. They also make page intent easier to understand.

Recora-specific application:

- For LP, sample report, glossary, comparison, pricing, and case study pages, check sitemap inclusion and internal links if the page is intended to be public.
- For diagnose/new and dashboard pages, first decide whether the page is a public acquisition page, a form flow, or a private product page.
- Do not recommend indexation for internal dashboards unless explicitly exposed and approved.

### Google generative AI optimization guide: Recora scope

Google's official guidance frames generative AI features in Search as built on core Search systems and says foundational SEO remains relevant. Recora can use this safely as:

- SEO fundamentals still matter for Google AI Overviews and AI Mode eligibility.
- Helpful, unique, well-structured, non-commodity content is safer than AEO/GEO hacks.
- Page structure, headings, visible content, accessibility, and rendered experience can matter for both users and systems that interpret pages.
- Structured data is useful for supported Search features but is not required for Google's generative AI search experiences.
- `llms.txt` is not needed for Google Search visibility or rankings according to the 2026 Google update note; it may still be relevant to other services and must be treated as service-specific.

Recora should not use Google's guidance to claim:

- any page will appear in AI Overviews
- any schema will affect AI answers
- any bot allowance will create AI-search visibility
- AIO/GEO is entirely separate from SEO for Google Search

### Schema.org type selection notes

| Type | Consider when | Required caution |
|---|---|---|
| Organization | Page identifies a company, brand, legal entity, or publisher with visible/supportable facts. | Do not use it to imply third-party authority or invented social profiles. |
| SoftwareApplication | Page describes Recora or client software with app category, provider, feature scope, operating context, screenshot/app signals, and offer/pricing status. | Do not encode features, ratings, prices, or availability missing from visible content. |
| FAQPage | Page or section presents visible FAQ questions and answers. | Google Search FAQ rich-result support changed; separate schema.org validity from Google feature eligibility. |
| Article | Page is article-like: guide, glossary, research, report, case study narrative, or editorial content. | Need visible headline, body, date, author/publisher where possible. |
| BreadcrumbList | Page has meaningful hierarchy and visible or clearly supported breadcrumb structure. | Use `BreadcrumbList`, not loose "Breadcrumb schema" terminology. |
| Product | Page describes a product or product-like SaaS offer with visible product facts. | Product can cover services broadly in schema.org, but Recora should prefer Service for service pages to avoid ambiguity. |
| Service | Page describes a service, consulting offer, diagnosis service, implementation service, or hybrid offer. | Requires visible provider/service facts; avoid invented service areas, channels, or ratings. |

### Safe AIO/GEO wording

Use:

- "May improve extraction clarity."
- "Can make the page easier for systems and users to interpret."
- "Moves the page closer to a citation-ready structure."
- "Supports discovery and interpretation, but does not guarantee AI citation."
- "This third-party/source gap requires legitimate external evidence, not only owned-page edits."

Avoid:

- "Will be cited by ChatGPT/Gemini/Perplexity/AI Overviews."
- "Bot access increases AI-search exposure."
- "Schema gets the page into AI answers."
- "SEO ranking improvement equals AI answer adoption."
- "Add keywords to force AI systems to associate the brand with the topic."

## Google Official vs Third-Party Claims

Use Google official sources for:

- Search crawling, indexing, canonical, robots, sitemap, structured data, rich-result eligibility, and Google generative AI search guidance.

Use schema.org for:

- Type definitions and property semantics.

Use OpenAI official sources for:

- Codex skill structure, references, optional scripts, metadata, and evaluation patterns.

Use third-party skills/blogs only for:

- Workflow design inspiration.
- Candidate evidence collectors.
- Rubric ideas.
- Non-authoritative industry vocabulary.

Mark as `NEEDS_VERIFICATION`:

- market-size estimates
- AI traffic growth statistics
- provider-specific citation behavior
- crawler-specific AI-search impact
- ranking/citation correlations
- support for specific Google rich-result features after known deprecations
