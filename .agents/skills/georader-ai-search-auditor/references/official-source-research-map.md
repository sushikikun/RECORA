# Official Source Research Map

Use this reference when making GEO, SEO, AI search, crawler, structured data, citation-readiness, or Recora claims that depend on official platform guidance or current research.

## Evidence Use

- Use `OFFICIAL_SOURCE` only for claims grounded in primary platform documentation, standards documents, or platform-owner docs inspected for the task.
- Use `RESEARCH_BACKED` only for claims grounded in named research. Do not treat research as official platform policy.
- Use `INDUSTRY_PRACTICE` for common SEO, content, CRO, or reporting practices when no official or research source is being used.
- Use `GEORADER_ASSUMPTION` for GEORADER or Recora scoring, packaging, report structure, positioning, and roadmap choices.
- Use `NEEDS_VERIFICATION` for current SERP behavior, AI answer visibility, crawler behavior in logs, market claims, client facts, Recora facts, rates, and business metrics that were not verified in the task.

## Official Source Map

| Claim Area | Primary Sources To Check | Safe Claim Scope | Do Not Claim |
|---|---|---|---|
| Google AI features | Google Search Central: `https://developers.google.com/search/docs/appearance/ai-features` | Google's published guidance for AI Overviews and AI Mode eligibility, controls, and measurement. | Do not claim special GEO markup, guaranteed AI Overview inclusion, or guaranteed citation. |
| Google crawling | Google crawling docs: `https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers` and `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers` | Google crawler categories, verification concepts, and robots behavior for Google crawlers. | Do not claim every Google fetcher obeys every robots rule without checking the relevant crawler category. |
| Google-Extended | Google common crawlers docs, Google-Extended section: `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers` | Google-Extended is a product token for certain non-Search AI training/grounding controls; verify current wording before client use. | Do not say Google-Extended is a Google Search ranking signal or controls Google Search inclusion. |
| robots.txt | RFC 9309: `https://www.rfc-editor.org/rfc/rfc9309` | Robots Exclusion Protocol syntax, grouping, matching, and the limits of robots.txt as a crawler signal. | Do not present robots.txt as authentication, security, or guaranteed enforcement against all agents. |
| OpenAI crawlers | OpenAI crawler docs: `https://developers.openai.com/api/docs/bots` | OAI-SearchBot, GPTBot, ChatGPT-User, and their stated purposes and controls. | Do not say allowing an OpenAI bot guarantees ChatGPT citation, recommendation, traffic, or ranking. |
| Anthropic crawlers | Claude Help Center crawler article: `https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler` | ClaudeBot, Claude-User, Claude-SearchBot, robots.txt controls, and Anthropic's stated crawler principles. | Do not guarantee Claude visibility or cite Anthropic behavior from old docs without checking current docs. |
| Perplexity crawlers | Perplexity crawler docs: `https://docs.perplexity.ai/docs/resources/perplexity-crawlers` | PerplexityBot, Perplexity-User, official IP endpoints, and Perplexity's stated WAF guidance. | Do not guarantee Perplexity citation or infer training use beyond the current official page. |
| Structured data | Schema.org and Google structured data docs | Schema vocabulary, Google rich-result eligibility, validation guidance, and visible-content matching rules. | Do not claim schema alone causes AI citation, AI Overviews, or rich results. |
| Search basics | Google Search Essentials and SEO Starter Guide | Technical requirements, helpful content, crawlability, indexability, internal links, page experience, and content clarity. | Do not rebrand normal SEO basics as official GEO standards. |

## Research Map

| Research Area | Source To Check | Safe Claim Scope | Limit |
|---|---|---|---|
| GEO as research term | `GEO: Generative Engine Optimization`, arXiv: `https://arxiv.org/abs/2311.09735` | GEO is a research framing for improving visibility in generative engine responses under studied conditions. | Do not treat its reported gains as expected client outcomes or official platform guidance. |
| Retrieval grounding | `Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks`, arXiv: `https://arxiv.org/abs/2005.11401` | Retrieval can provide external knowledge and provenance in studied systems. | Do not infer a specific commercial AI platform's retrieval or citation behavior unless that platform documents it or current tests show it. |
| robots compliance limits | `Scrapers selectively respect robots.txt directives`, arXiv: `https://arxiv.org/abs/2505.21733` | Robots compliance varies by crawler class in the study; robots.txt alone may be insufficient as a control. | Do not use this as proof that a named platform is currently violating robots.txt unless the named platform is directly evidenced. |

## Recora Rule

Recora is a product-name-ready evolution path for GEORADER unless the user or inspected artifacts prove more. Recora claims about product status, customers, metrics, citations, platform support, pricing, workflows, backend behavior, or official recognition must be `NEEDS_VERIFICATION` unless verified in the current task.

## Output Rule

For source-grounded outputs, include a compact evidence scope:

- Official sources inspected:
- Research sources inspected:
- User-provided facts:
- GEORADER / Recora assumptions:
- Needs verification before client use:

Do not cite this local file as an external source in client-facing work. Cite or name the original official or research source.
