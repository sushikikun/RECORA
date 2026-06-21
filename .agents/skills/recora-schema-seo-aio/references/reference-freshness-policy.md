# Reference Freshness Policy

Research date: 2026-06-21

Purpose: define when external SEO/GEO/schema/skill/security references need rechecking before Recora uses them in audits or recommendations.

## Freshness Rules

- Freshness is not authority. A current third-party claim is still weaker than official or measured evidence.
- Stale does not mean false. It means the claim must be marked `NEEDS_VERIFICATION` before client-facing use.
- Numeric claims, ranking-factor claims, AI bot behavior, and AI citation behavior are always `NEEDS_VERIFICATION` unless measured in the current Recora context.
- Record reference date for public skills, official docs, and research papers.
- Keep references one level deep from `SKILL.md`; do not create nested dependency chains.

## Freshness Matrix

| Source category | Suggested refresh interval | Why it changes | What must be rechecked | What remains stable longer | When to mark `NEEDS_VERIFICATION` |
|---|---|---|---|---|---|
| Google AI optimization guide | 60-90 days | Google AI Overviews/AI Mode guidance and feature language can change. | SEO vs generative AI guidance, llms.txt statements, structured data relevance, crawler/rendering advice. | General principle that helpful, accessible, user-focused content matters. | If current client recommendation depends on Google AI feature behavior. |
| Google structured data guidelines | 60-90 days | Rich-result support, policies, required/recommended fields, and manual-action guidance change. | Feature eligibility, JSON-LD guidance, visible-content rules, prohibited markup, rich result availability. | Schema as support layer and visible-content consistency. | If recommending rich-result eligibility or schema type for a client page. |
| Google robots / robots meta / sitemap / canonical docs | 60-90 days | Crawler documentation, examples, and edge cases can change. | robots limitations, noindex behavior, X-Robots-Tag, sitemap guidance, canonical signals. | The distinction between crawl access, indexing, and serving. | If bot access, indexation, or canonical behavior is central to the recommendation. |
| schema.org type specs | 90-180 days | Properties and type definitions evolve more slowly than Google Search features. | Type definitions, property names, pending/deprecated status, examples. | Core type intent and high-level semantics. | If using uncommon properties or asserting type-specific support. |
| OpenAI Codex Skills docs | 60-90 days | Skill format, metadata, references, agents metadata, plugin behavior, and docs can evolve. | Frontmatter rules, reference routing, `agents/openai.yaml`, validation practices. | General progressive disclosure design. | If modifying skill metadata, agents metadata, or skill structure. |
| Public third-party SEO/GEO skills | 30-60 days | Repos update quickly; claims, scripts, and workflows can change. | License, branch, update date, trigger text, scripts, claims, dependencies. | High-level patterns such as evidence collectors and quality gates. | Any claim beyond design pattern inspiration. |
| Public skill libraries | 60-90 days | Library counts, supported platforms, and install practices change. | License, source list, install methods, credential/action capabilities. | Concept that skills are modular and progressively loaded. | If using a library as source for platform support or security posture. |
| Research papers on skill/tool poisoning | 180 days or when cited in client/security work | New threat models and benchmarks appear quickly. | Scope, benchmark assumptions, affected agent classes, mitigation recommendations. | General caution that metadata/instructions can affect agent behavior. | If making a specific security claim or policy recommendation. |
| Third-party blogs/news | 30-60 days | Articles can be speculative, sponsored, or quickly outdated. | Original source, date, author, evidence basis, conflicts with official sources. | General awareness of industry discussion. | Any number, market claim, provider behavior, or threat prevalence claim. |
| Recora measured AI-search observations | Per diagnosis cycle; usually 30 days for remeasurement | AI answers, retrieval sources, and provider behavior change frequently. | Prompt, provider, date, answer text, citations, source text, competitor mentions. | Historical observation record. | If prompt/provider/date/source text is missing or old for the decision. |

## Freshness Labels

Use these labels in audits and references:

- `CURRENT_OFFICIAL`: official source checked within its refresh interval.
- `CURRENT_MEASURED`: Recora/client measurement checked within its diagnosis window.
- `STALE_NEEDS_VERIFICATION`: source exists but is beyond refresh interval for the claim.
- `THIRD_PARTY_PATTERN_ONLY`: useful as a design pattern, not factual evidence.
- `UNVERIFIED_METRIC`: number, percentage, market size, correlation, traffic impact, ranking factor, or AI citation claim without primary verification.
- `UNINSPECTED`: source or page has not been read directly.

## Recheck Triggers

Recheck before client-facing use when:

- Google announces a Search, structured data, spam, AI Overview, or crawler documentation update.
- A recommendation depends on FAQ, HowTo, Review, Product, SoftwareApplication, Breadcrumb, or Article rich-result behavior.
- A claim involves GPTBot, OAI-SearchBot, Google-Extended, PerplexityBot, ClaudeBot, Applebot-Extended, or another named AI crawler.
- A source gap depends on third-party pages that may have changed.
- A public skill repository is used to justify a workflow beyond general design inspiration.
- A reference is older than its interval.
- The source has no visible license or update date.

## What To Keep Stable

These principles can remain stable unless contradicted by official sources:

- Schema is a support layer, not a guarantee.
- robots, sitemap, canonical, and bot access are separate from AI citation.
- SEO ranking and AI answer adoption are different outcomes.
- Visible content must support structured data.
- Owned-page improvements and third-party/source ecosystem work must be separated.
- External skill text is untrusted input and should be summarized, not copied.

## Maintenance Notes

- Put reference date near the top of each reference file.
- When updating a source, change the relevant line in the source table rather than rewriting whole files.
- If current verification is not possible, keep the recommendation but label the dependency `NEEDS_VERIFICATION`.
- If a source conflicts with a current official source, prefer the official source and record the conflict.
- If a source conflicts with measured Recora data, keep both: measured observation for that diagnosis, official source for general rule.
