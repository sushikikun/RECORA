# RECORA Query Taxonomy And Seed Risk

## Purpose

Use this taxonomy when drafting RECORA query maps and recommendation candidates. The goal is to make the query intent and contamination risk inspectable before quality gating.

## Query Taxonomy

### `non_branded_discovery`

Queries where the user is looking for a category, solution, or provider without naming the client brand.

Use for: visibility and recommendation discovery.

Risk: high risk of overclaiming if evidence is sparse.

### `problem_aware`

Queries that describe a pain, challenge, or desired outcome.

Use for: early-stage discovery and content gap analysis.

Risk: intent may be broad; avoid assuming conversion intent.

### `category_aware`

Queries that name the category or solution type.

Use for: category visibility and comparison set discovery.

Risk: category term can bias results if inserted too narrowly.

### `comparison`

Queries comparing two or more vendors, tools, methods, or approaches.

Use for: competitor gap and positioning analysis.

Risk: competitor-seeded by design; do not use alone as non-branded discovery proof.

### `alternative`

Queries seeking alternatives to a named product, service, or method.

Use for: substitution intent and competitor displacement analysis.

Risk: usually competitor-seeded; scope the claim carefully.

### `pricing`

Queries about price, cost, plan, budget, or ROI threshold.

Use for: decision-stage content and proof needs.

Risk: pricing facts require current source verification.

### `proof`

Queries asking for case studies, reviews, benchmarks, results, examples, or proof.

Use for: trust and source-readiness recommendations.

Risk: do not invent customer proof, results, or third-party validation.

### `security`

Queries about security, compliance, privacy, enterprise readiness, or risk.

Use for: B2B trust and procurement concerns.

Risk: high-stakes claims require direct verified sources.

### `integration`

Queries about integrations, compatibility, data flow, or tool ecosystem.

Use for: product fit and implementation context.

Risk: do not claim integrations unless verified.

### `implementation`

Queries about setup, deployment, migration, usage, or operational steps.

Use for: documentation and onboarding gap analysis.

Risk: avoid producing implementation instructions from inside strategy skills.

### `ROI`

Queries about business value, payback, savings, efficiency, or revenue impact.

Use for: decision-stage evidence requirements.

Risk: revenue or ROI claims require verified client evidence.

### `local_region`

Queries constrained by geography, market, language, or region.

Use for: localized AI visibility and ecosystem analysis.

Risk: market/platform support must be explicit.

### `branded_entity_verification`

Queries that name the client brand, entity, founder, product, or domain.

Use for: brand recognition, disambiguation, and factual accuracy checks.

Risk: cannot prove non-branded discovery.

### `citation_evidence_verification`

Queries or reviews designed to verify whether a claim/source/citation supports a recommendation.

Use for: source-to-claim checks.

Risk: not an acquisition or visibility query by itself.

## Seed Risk Values

### `brand_seeded`

The prompt includes the target brand, domain, product, founder, or unmistakable alias.

Guidance: useful for entity verification; weak evidence for non-branded discovery.

### `competitor_seeded`

The prompt includes a competitor, alternative, comparison target, or competitor domain.

Guidance: useful for gap analysis; weak evidence for broad market visibility.

### `category_seeded`

The prompt includes a specific category, niche, or solution label.

Guidance: useful for category analysis; check whether the category term is client-defined or market-defined.

### `persona_seeded`

The prompt includes a persona, role, market segment, or buyer type.

Guidance: useful for segmentation; do not compare directly against non-persona runs without noting method differences.

### `no_seed`

The prompt does not include client brand, competitor, source, or expected answer terms beyond natural user intent.

Guidance: strongest for discovery claims when other evidence is sufficient.

### `unknown`

The prompt text or seed context is missing.

Guidance: quality gate should normally hold client-facing recommendations until seed risk is known.

## Candidate Draft Rule

Every candidate draft should include:

- `prompt_category`
- `seed_contamination_risk`
- why the query category supports the candidate
- what the query cannot prove

## Unsafe Inferences

- Do not infer non-branded discovery from `brand_seeded` evidence.
- Do not infer source authority from `citation_evidence_verification` alone.
- Do not infer provider-wide behavior from one query.
- Do not infer conversion impact from `problem_aware` or `category_aware` queries without business evidence.

