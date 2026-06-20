# Source Pack For Quality Gate

Use this source pack to understand the source categories a Recora recommendation quality gate should recognize.

This file is not a citation. It lists categories to verify and boundaries to enforce.

## Official Categories

- Google AI search / generative AI optimization guidance.
- Google Search Essentials.
- Google structured data guidelines.
- Google crawler / robots guidance.
- OpenAI crawler docs.
- Anthropic crawler docs.
- Perplexity crawler docs.
- RFC 9309 robots.txt.

## Research Categories

- GEO: Generative Engine Optimization.
- RAG for knowledge-intensive NLP.
- AI search / AI Overview empirical studies.
- Structural Feature Engineering for GEO.
- hallucination / factuality evaluation surveys.
- citation behavior studies.

## Source Rules

- Do not invent URLs or last checked dates.
- Do not cite source names as proof without claim mapping.
- Treat fast-changing crawler behavior and AI answer behavior as `NEEDS_VERIFICATION` unless supplied.
- Research supports concepts, not guarantees.
- Official-source claims must be platform-specific and claim-specific.
- Third-party studies are not official platform policy.
- Local skill references are not external evidence.

## Quality Gate Implications

`auto_publish` can rely on official or research sources only when:

- the source is present or verified.
- the claim is narrow enough for the source.
- the recommendation does not imply guaranteed outcomes.
- client-specific current-state claims are supported by measurement.

Use `hold` when:

- source category is relevant but source status is unclear.
- source support is indirect.
- current behavior may have changed.

Use `suppress` when:

- source is fake.
- source is misrepresented.
- source support is used to claim guaranteed outcomes.
- source name is used as proof without supplied evidence.
