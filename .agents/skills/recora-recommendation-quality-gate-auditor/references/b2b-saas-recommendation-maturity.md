# B2B SaaS Recommendation Maturity

Use this reference to judge whether a recommendation is mature enough for BtoB SaaS clients.

## Strong Recommendation Criteria

A strong BtoB SaaS recommendation should specify:

- buyer stage.
- target persona.
- query type.
- evidence gap.
- page or asset type.
- expected decision support.
- measurement signal to recheck.
- client-facing explanation.
- risk or assumption.

## Buyer Stages

- awareness.
- problem-aware.
- category-aware.
- comparison.
- alternative.
- pricing and ROI.
- proof and trust.
- security and procurement.
- implementation and integration.
- vendor shortlist.

## Common Asset Types

- category hub.
- problem page.
- use-case page.
- industry page.
- comparison page.
- alternative page.
- pricing or ROI page.
- methodology page.
- case study.
- security or trust page.
- integration page.
- FAQ.
- glossary.
- sample report.

## Weak Recommendation Signals

A weak recommendation has:

- generic SEO advice.
- no target query.
- no asset type.
- no link to measurement data.
- no BtoB buying context.
- vague "make content better" wording.
- no confidence or risk label.
- no remeasurement signal.

## Quality Gate Use

`auto_publish` requires high maturity plus evidence fit.

`hold` when:

- BtoB SaaS logic is strong but measurement is incomplete.
- buyer stage or asset type is missing.
- recommendation needs client-safe wording.

`suppress` when:

- candidate is generic and cannot be tied to Recora evidence.
- candidate invents buyer pain, persona, competitor results, or performance outcomes.

## Mature Output Pattern

Use:

| Buyer stage | Persona | Query type | Evidence gap | Asset recommendation | Remeasurement signal |
|---|---|---|---|---|---|

Client-safe wording should explain why the asset helps buyer decision-making, not promise AI citation.
