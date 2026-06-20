# Client-Facing Risk Language

Use this reference to rewrite usable recommendation candidates into safer client-facing wording.

## Client-Facing Principles

- Be specific, calm, and evidence-scoped.
- Do not alarm the client unless there is a verified trust or safety risk.
- Separate observed facts from recommendations.
- State uncertainty without sounding helpless.
- Avoid internal-only terms when a plain explanation works.
- Do not guarantee AI citation, recommendation, ranking, traffic, conversion, or revenue.

## Risk Levels

| Risk | Description | Decision impact |
|---|---|---|
| low | evidence-backed, clear, no guarantee, no sensitive issue | can support auto_publish |
| medium | useful but needs softer wording or more evidence | hold |
| high | misleading, unsupported, reputationally risky, sensitive, or overclaiming | suppress or hold after rewrite |

## Safe Rewrite Patterns

Guarantee:

- Risky: "This will make AI recommend your company."
- Safe: "This can improve the clarity and evidence available to AI systems, but recommendation outcomes need measurement."

Competitor visibility:

- Risky: "Competitors dominate AI answers."
- Safe: "The supplied observations suggest a competitor visibility gap. Current visibility should be confirmed across the agreed query set."

Citation:

- Risky: "Adding this source will get cited."
- Safe: "Adding a clear, verifiable source may improve citation readiness. Actual citation should be tested."

Structured data:

- Risky: "Schema will trigger AI citations."
- Safe: "Structured data can help clarify page content and eligibility for supported search features, but it does not guarantee citation or ranking."

Crawler access:

- Risky: "Allowing bots guarantees inclusion."
- Safe: "Crawler access can improve access conditions for documented crawlers, while inclusion and citation require separate measurement."

Evidence gap:

- Risky: "Your SEO is bad."
- Safe: "The current evidence does not yet support a confident client-facing finding. We recommend verifying the query results and source status before publishing this recommendation."

## Suppress Language

When suppressing, use concise internal wording:

- "Suppress because the candidate guarantees AI citation without evidence."
- "Suppress because the source appears hallucinated."
- "Suppress because the observation is seeded and cannot support organic visibility."
- "Suppress because the candidate asks for secrets or implementation access."

Do not produce client-facing wording for candidates that remain misleading after rewrite.
