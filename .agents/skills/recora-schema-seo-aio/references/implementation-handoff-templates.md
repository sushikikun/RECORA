# Implementation Handoff Templates

Research date: 2026-06-21

Purpose: standardize how Recora SEO/AIO/schema findings are handed to implementation, design, copy, and quality-gate owners.

## Universal Fields

Every handoff should include:

- Target page
- Target section
- Problem
- Evidence
- Recommended change
- SEO effect
- AIO/GEO effect
- Required visible content
- Schema impact
- Owner/control
- Validation method
- Risk/caveat
- Quality-gate needed: yes/no

## SEO Technical Fix Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | metadata / canonical / robots / sitemap / internal links |
| Problem |  |
| Evidence |  |
| Recommended change |  |
| SEO effect | Supports crawl/index/snippet/discovery clarity. |
| AIO/GEO effect | Only indirect unless it improves extractability or source clarity. |
| Required visible content |  |
| Schema impact | none / check body-schema consistency |
| Owner/control | engineering / content / product |
| Validation method | source/rendered HTML, headers, robots, sitemap, crawl check |
| Risk/caveat | Does not guarantee ranking or AI citation. |
| Quality-gate needed | yes/no |

## Schema Implementation Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | JSON-LD / visible source section |
| Problem |  |
| Evidence |  |
| Recommended change | Add or repair body-aligned JSON-LD. |
| SEO effect | Supports structured interpretation and eligible features where supported. |
| AIO/GEO effect | Supports interpretation of visible facts, not citation. |
| Required visible content |  |
| Schema impact | schema type, fields, validation notes |
| Owner/control | engineering + content |
| Validation method | rendered JSON-LD extraction, schema validation, body/schema consistency |
| Risk/caveat | No invented facts; no guarantee. |
| Quality-gate needed | yes if review/rating/pricing/customer/competitor claims |

## FAQ / Content Block Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | FAQ / direct answer / definition |
| Problem |  |
| Evidence |  |
| Recommended change | Add visible one-question-one-answer block. |
| SEO effect | May support long-tail discovery and snippet clarity. |
| AIO/GEO effect | Improves answer extractability. |
| Required visible content | approved answer text and caveat |
| Schema impact | FAQPage only if visible Q&A matches. |
| Owner/control | copy/content |
| Validation method | rendered page review, FAQ/schema match |
| Risk/caveat | No AI citation guarantee. |
| Quality-gate needed | yes if claims are sensitive |

## Comparison Page Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | comparison scope / criteria table |
| Problem |  |
| Evidence |  |
| Recommended change | Add scope, audience, criteria, fair fit/non-fit, evidence, update date. |
| SEO effect | Supports comparison-stage discovery. |
| AIO/GEO effect | Improves criteria extractability and competitor context. |
| Required visible content | verified competitor/category facts |
| Schema impact | Article/BreadcrumbList if article-like; avoid review/rating unless real. |
| Owner/control | content + legal/quality gate |
| Validation method | source review, competitor fact check, rendered page |
| Risk/caveat | Unsupported competitor claims are `NEEDS_VERIFICATION`. |
| Quality-gate needed | yes |

## Pricing Clarity Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | pricing model / FAQ / plan table |
| Problem |  |
| Evidence |  |
| Recommended change | Clarify model, inclusions, exclusions, limits, billing/contract terms. |
| SEO effect | Supports high-intent page clarity. |
| AIO/GEO effect | Reduces pricing misunderstanding in summaries. |
| Required visible content | approved pricing facts |
| Schema impact | Product/Service/SoftwareApplication only if visible facts support it. |
| Owner/control | product + sales + content |
| Validation method | approved pricing source, rendered copy, schema/body check |
| Risk/caveat | No revenue or AI citation guarantee. |
| Quality-gate needed | yes |

## Source Gap To Content Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | new/updated owned page section |
| Problem | source gap / source opportunity |
| Evidence | prompt/provider/date, answer text, cited sources |
| Recommended change | Clarify owned facts with direct answer, evidence, links, caveats. |
| SEO effect | Supports discoverable owned source. |
| AIO/GEO effect | Improves source-to-claim alignment and extractability. |
| Required visible content | approved facts and evidence labels |
| Schema impact | optional support after visible text exists |
| Owner/control | content/product |
| Validation method | re-audit page, remeasure prompts, source-to-claim check |
| Risk/caveat | Owned content may not resolve third-party evidence gap. |
| Quality-gate needed | yes if client-facing |

## Source Gap To Third-Party Action Handoff

| Field | Content |
|---|---|
| Target page | third-party source/profile/listing/media/partner page |
| Target section | source fact/profile/review/case proof |
| Problem | independent source evidence gap |
| Evidence | observed citations and competitor source advantage |
| Recommended change | Legitimately correct, complete, or earn third-party evidence. |
| SEO effect | External source ecosystem support. |
| AIO/GEO effect | May improve independent source support if retrieved. |
| Required visible content | approved facts and source policy compliance |
| Schema impact | usually none on Recora site |
| Owner/control | external owner / PR / partner / customer |
| Validation method | source text review, crawl/index check, remeasurement |
| Risk/caveat | No fake reviews, fabricated citations, or manipulative outreach. |
| Quality-gate needed | yes |

## Quality-Gate Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section |  |
| Problem | risky recommendation / claim / schema / source gap |
| Evidence |  |
| Recommended change | Review, suppress, hold, or rewrite. |
| SEO effect |  |
| AIO/GEO effect |  |
| Required visible content |  |
| Schema impact |  |
| Owner/control | `recora-recommendation-quality-gate-auditor` |
| Validation method | rubric, evidence sufficiency, caveat review |
| Risk/caveat | Avoid overclaiming and unsupported client-facing claims. |
| Quality-gate needed | yes |

## Frontend / Design Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | layout / table / FAQ / report module |
| Problem |  |
| Evidence |  |
| Recommended change | Make key answers visible, scannable, accessible, and not hidden only in images/PDFs. |
| SEO effect | Supports visible content and internal linking. |
| AIO/GEO effect | Supports extractability and evidence labels. |
| Required visible content | headings, summaries, tables, caveats |
| Schema impact | content must match schema if schema is used |
| Owner/control | frontend/design |
| Validation method | rendered page review, mobile/desktop check |
| Risk/caveat | Visual polish must not hide critical evidence. |
| Quality-gate needed | maybe |

## Copy / Brand Voice Handoff

| Field | Content |
|---|---|
| Target page |  |
| Target section | headline / FAQ / caveat / comparison copy |
| Problem |  |
| Evidence |  |
| Recommended change | Rewrite in Recora's evidence-led B2B voice with safe caveats. |
| SEO effect | Supports page intent and snippet clarity. |
| AIO/GEO effect | Supports precise extraction and reduces misinformation. |
| Required visible content | approved facts and caveats |
| Schema impact | schema must mirror final copy |
| Owner/control | copy/brand voice |
| Validation method | copy review, claim/evidence check, quality gate if risky |
| Risk/caveat | Do not turn caveats into sales hype. |
| Quality-gate needed | yes if claim-sensitive |
