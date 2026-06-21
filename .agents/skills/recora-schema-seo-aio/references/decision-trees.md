# Decision Trees

Research date: 2026-06-21

Purpose: give `recora-schema-seo-aio` fast yes/no paths for recurring unsafe or ambiguous SEO/AIO/schema decisions.

## Global Rule

If required evidence is missing, do not infer the answer. Mark the item `NEEDS_VERIFICATION`, give the safest next evidence request, and avoid guarantee language.

## Schema Recommendation Decision Tree

- Required evidence: target page type, visible body content, rendered/source HTML, intended schema type, current JSON-LD if any.
- Tree:
  1. Is there visible or clearly supportable page content for the schema facts? If no, do not recommend schema yet.
  2. Is the schema type aligned with page intent? If no, choose a better type or mark `NEEDS_VERIFICATION`.
  3. Would schema add reviews, ratings, pricing, offers, outcomes, or competitor claims? If yes, require evidence and quality gate.
  4. Can rendered JSON-LD be validated against body content? If no, mark validation `NEEDS_VERIFICATION`.
- Safe output: "Add or repair body-aligned schema only after visible facts exist."
- Escalate to quality gate: review/rating/pricing/customer/competitor claims, body/schema mismatch, or client-facing guarantee risk.

## FAQPage Decision Tree

- Required evidence: visible FAQ questions and answers, page source/rendered text, proposed JSON-LD.
- Tree:
  1. Is there visible FAQ content on the page? If no, recommend visible FAQ first.
  2. Are questions and answers one-to-one and not hidden-only or sales claims disguised as FAQ? If no, rewrite content before schema.
  3. Does JSON-LD match the visible FAQ exactly enough for body/schema consistency? If no, revise.
  4. Is the expected benefit phrased as support, not citation/rich-result guarantee? If no, rewrite.
- Safe output: "Use FAQPage only for visible matching Q&A and validate rendered JSON-LD."
- Escalate to quality gate: pricing, competitor, customer result, legal, or AI-citation wording in FAQ.

## Review / AggregateRating Decision Tree

- Required evidence: real reviews, reviewer/source, rating count/value if aggregate, visibility or legitimate representation, approval.
- Tree:
  1. Do real reviews or ratings exist? If no, reject Review/AggregateRating.
  2. Are they visible or legitimately represented with explainable basis? If no, reject.
  3. Is the aggregation method, count, and source explainable? If no, reject AggregateRating.
  4. Could the markup mislead users, search engines, or clients? If yes, route to quality gate.
- Safe output: "Do not propose Review/AggregateRating unless evidence is real, visible/supportable, and approved."
- Escalate to quality gate: any review/rating schema, testimonials, customer outcomes, or reputation claims.

## Product vs Service Schema Decision Tree

- Required evidence: page intent, visible product/service description, provider, features/deliverables, offer/pricing status if used.
- Tree:
  1. Is the page primarily a software/product offer? If yes, consider SoftwareApplication or Product only with visible facts.
  2. Is the page primarily a service or consulting offer? If yes, consider Service only with visible deliverables/process.
  3. Is it a hybrid page? If yes, state primary page intent and avoid forcing both unless both are visibly supported.
  4. Would fields include invisible price, features, effects, ratings, or offers? If yes, remove or add visible content first.
- Safe output: "Choose schema by page intent and visible facts; omit unsupported fields."
- Escalate to quality gate: pricing, offers, feature claims, customer outcomes, or ambiguity that may mislead.

## Robots / Sitemap / Bot Access Decision Tree

- Required evidence: robots.txt, robots meta/X-Robots-Tag, sitemap, canonical, page intent, crawl/index observations where available.
- Tree:
  1. Is the page intended to be public? If no or unknown, do not recommend crawler/index exposure.
  2. Is a public target blocked or missing from sitemap? If yes, recommend technical review as discovery/access support.
  3. Does the user ask to claim AI exposure, citation, or ranking from robots/sitemap/bot access? If yes, reject the causal claim.
  4. Are crawl logs, index evidence, and AI observations available? If no, mark outcomes `NEEDS_VERIFICATION`.
- Safe output: "This supports access/discovery only; it does not prove indexing, ranking, AI use, or citation."
- Escalate to quality gate: dashboard/private pages, bot-specific claims, sitemap exposure of sensitive URLs.

## AI Citation Claim Decision Tree

- Required evidence: prompt, provider, date, answer text, cited URLs, source-to-claim mapping.
- Tree:
  1. Is there an observed citation URL? If no, do not call it a citation.
  2. Does the cited source support the claim? If no, mark source-to-claim gap.
  3. Is the claim about future citation after implementation? If yes, use only cautious hypothesis language.
  4. Does wording imply guarantee or certainty? If yes, rewrite.
- Safe output: "This may improve extraction/source clarity, but future AI citation is not guaranteed."
- Escalate to quality gate: client-facing citation claims, paid/third-party evidence, competitor citation advantage.

## Branded vs Non-Branded Prompt Decision Tree

- Required evidence: prompt text, prompt class, provider, date, answer, metric being reported.
- Tree:
  1. Does the prompt include the brand/client name? If yes, classify as branded.
  2. Is the output measuring sentiment, recognition, entity clarity, or misinformation? If yes, branded prompts can be used.
  3. Is the output measuring visibility/ranking/competitor discovery? If yes, exclude branded prompts.
  4. Is the metric summary mixed? If yes, split tables and caveats.
- Safe output: "Branded prompts are not included in non-branded visibility/ranking metrics."
- Escalate to quality gate: client report metrics, competitor benchmark, high-level executive summary.

## Mention vs Citation Decision Tree

- Required evidence: answer text, cited URLs, citation UI/output, source text if available.
- Tree:
  1. Is the brand or page named in the answer? If yes, record mention.
  2. Is a URL/source linked or attributed? If no, do not record citation.
  3. Does the cited URL belong to or support the relevant claim? If no, record citation confidence/source-to-claim issue.
  4. Does the report language collapse mention and citation? If yes, rewrite.
- Safe output: "Mentioned, but citation is `NEEDS_VERIFICATION` or not present."
- Escalate to quality gate: citation KPI reporting, source gap, competitor comparison.

## Source Gap Resolution Decision Tree

- Required evidence: source gap record, prompt/provider/date, answer, cited sources, source text, target claim, page inventory.
- Tree:
  1. Is the gap verified against source text? If no, mark `NEEDS_VERIFICATION`.
  2. Is the missing support a first-party factual clarity issue? If yes, use owned-page clarification or new owned page.
  3. Is independent proof required? If yes, add third-party evidence, directory/profile, review/listing, media/PR, or partner/customer proof action.
  4. Is evidence weak or one-off? If yes, choose ongoing monitoring only.
- Safe output: "Split owned-page work from external-source ecosystem work."
- Escalate to quality gate: any third-party action, review, PR, competitor, pricing, customer, or source-to-claim risk.

## Dashboard / Public Indexation Decision Tree

- Required evidence: route/page type, auth status, product/security approval, public exposure intent, robots/noindex/sitemap status.
- Tree:
  1. Is the page a dashboard, private report, authenticated view, or user/client data surface? If yes, private by default.
  2. Is public exposure explicitly approved? If no, do not recommend public SEO, sitemap, schema, or indexation.
  3. If public export is approved, is sensitive data removed and public page intent clear? If no, block.
  4. Are noindex/robots/sitemap aligned with intent? If unknown, mark `NEEDS_VERIFICATION`.
- Safe output: "Do not recommend public indexation without product/security approval."
- Escalate to quality gate: any dashboard/private/public-indexation recommendation.

## Screenshot-Only Audit Decision Tree

- Required evidence: screenshot, route, available page copy; missing source/rendered HTML, headers, JSON-LD, sitemap, robots.
- Tree:
  1. Is source/rendered HTML missing? If yes, classify as lightweight audit.
  2. Is the user asking for canonical/noindex/schema/indexability conclusions? If yes, mark `NEEDS_VERIFICATION`.
  3. Can visible hierarchy, copy, CTA, trust, and extractability be reviewed? If yes, review only those visible aspects.
  4. Is a technical claim needed for publication? If yes, request source/header/rendered evidence.
- Safe output: "From screenshot only, technical crawl/index/schema status is not inspected."
- Escalate to quality gate: screenshot-only findings used as client-facing technical conclusions.

## Client-Facing Wording Decision Tree

- Required evidence: draft wording, intended audience, evidence level, metric basis, risky claims.
- Tree:
  1. Does wording imply guaranteed ranking, traffic, revenue, rich result, AI citation, AI recommendation, or AI visibility? If yes, rewrite.
  2. Does wording merge SEO and AIO/GEO? If yes, split effects.
  3. Does wording depend on unverified crawl/source/AI/third-party evidence? If yes, add `NEEDS_VERIFICATION`.
  4. Does wording mention competitor, pricing, reviews, customer results, or third-party evidence? If yes, quality gate.
- Safe output: "Use measured, caveated, falsifiable language with validation method."
- Escalate to quality gate: any client-facing Warning, sensitive claim, or executive-summary metric.
