# Structured Data And Schema Research Pack

Use this pack when Recora or GEORADER outputs discuss structured data, schema.org, JSON-LD, rich results, entity clarity, citation readiness, or BtoB SaaS page markup opportunities.

This pack is instruction-only. It does not authorize implementation. Do not output schema code unless the user creates a separate implementation task.

## Source Targets To Verify

- Google structured data introduction.
- Google general structured data guidelines.
- Google structured data search gallery.
- schema.org vocabulary.

Assign `OFFICIAL_SOURCE` only when the current Google or schema.org source was inspected or supplied and supports the exact claim. If the source URL, current source status, or last checked date is unknown, use `NEEDS_VERIFICATION`.

## Safe Claim Boundaries

- Google uses structured data to understand page content and support rich result eligibility when current Google guidance supports that claim.
- Structured data must match visible page content and follow Google's structured data guidelines when used for Google Search features.
- schema.org vocabulary and Google rich result support are related but not identical.
- A schema.org type existing does not mean Google supports a rich result for that type.
- Structured data is a comprehension and eligibility aid, not a ranking guarantee or AI citation guarantee.

## BtoB SaaS / Recora Opportunities

Use these only when the visible page content supports them:

- `Organization`: company identity, official name, URL, sameAs profiles, contact points where appropriate.
- `SoftwareApplication`: software product pages with visible product details.
- `Service`: service pages with clear service descriptions and provider context.
- `Article`: research, methodology, guide, or blog content.
- `FAQPage`: visible FAQ content that follows current Google guidance and is appropriate for the page.
- `BreadcrumbList`: navigational hierarchy.
- `Dataset`: only for visible, legitimate dataset content with clear metadata.

Label these as opportunities, not implementation instructions.

## Do Not Claim

- Do not say schema guarantees rich results.
- Do not say schema guarantees AI Overviews, ChatGPT citation, Perplexity citation, Claude retrieval, ranking, or traffic.
- Do not treat schema.org vocabulary as proof of Google rich result eligibility.
- Do not output JSON-LD or modify site files while using the audit skill.

## Recora Strategy Use

Structured data can support Recora recommendations by:

- clarifying entity relationships.
- aligning machine-readable descriptions with visible content.
- helping audit consistency between page claims and markup opportunities.
- making source claims easier to inspect in future implementation work.

Use labels:

- `OFFICIAL_SOURCE` for verified Google or schema.org guidance.
- `INDUSTRY_PRACTICE` for structured data review as SEO hygiene.
- `GEORADER_ASSUMPTION` for Recora scoring and prioritization.
- `NEEDS_VERIFICATION` for page-specific markup, current eligibility, validation results, and implementation status.

## Client-Facing Safe Language

- "Structured data can help search systems understand page content and may support eligible rich results, but it does not guarantee ranking or AI citation."
- "Schema opportunities should be limited to content that is visibly present on the page."
- "Implementation should be handled separately after page content and eligibility are verified."
