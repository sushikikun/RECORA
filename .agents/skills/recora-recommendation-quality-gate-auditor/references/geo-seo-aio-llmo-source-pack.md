# GEO SEO AIO LLMO Source Pack

Use this pack to keep Recora recommendation quality decisions grounded in appropriate source categories and evidence boundaries.

This pack is not a citation by itself. Treat the categories below as verification targets. Use `OFFICIAL_SOURCE` only for current primary-source claims verified during the task or supplied by the user.

## Official-Source Categories

- Google Search Central generative AI search / AI features guidance.
- Google Search Essentials.
- Google structured data guidelines.
- Google crawler and robots guidance.
- OpenAI crawler docs.
- Anthropic crawler docs.
- Perplexity crawler docs.
- RFC 9309 Robots Exclusion Protocol.

## Research Categories

- GEO: Generative Engine Optimization.
- empirical AI search / AI Overview source overlap studies.
- structural feature engineering for GEO.
- RAG research.
- hallucination / factuality evaluation research.
- citation behavior research.

## Evidence Boundaries

- Google-oriented GEO/AIO work should not be framed as a magic channel separate from SEO.
- Structured data helps comprehension and rich result eligibility when supported by guidelines; it does not guarantee AI citation, ranking, or recommendation.
- Bot allow/block settings may affect access conditions; they do not guarantee inclusion, citation, or recommendation.
- GEO research can support visibility and attribution concepts, but not commercial outcome guarantees.
- RAG research can support retrieval-grounding concepts, but not universal behavior across all AI search platforms.
- Empirical AI search studies support measuring SERP visibility and AI answer visibility separately.
- Current client visibility, AI answer inclusion, citations, SERP position, and competitor visibility are `NEEDS_VERIFICATION` unless actual measurement data is supplied.

## Decision Implications

`auto_publish` can use these sources only when:

- the source supports the exact claim.
- the source status and scope are clear.
- the recommendation does not overclaim outcomes.
- client-specific measurement is supplied for client-specific claims.

Use `hold` when:

- source category is relevant but exact source status is unclear.
- research supports a concept but not the candidate's outcome claim.
- current platform behavior needs verification.

Use `suppress` when:

- candidate invents official support.
- candidate treats research as a guarantee.
- candidate treats platform access as citation proof.
- candidate collapses SERP visibility and AI answer visibility into one unsupported claim.

## Recora-Friendly Framing

- "citation readiness" instead of "guaranteed citation".
- "AI answer visibility measurement" instead of "AI ranking proof".
- "source support" instead of "official endorsement".
- "access conditions" instead of "guaranteed inclusion".
- "research-informed hypothesis" instead of "proven outcome".
