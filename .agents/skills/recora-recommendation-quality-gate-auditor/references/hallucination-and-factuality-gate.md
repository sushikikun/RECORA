# Hallucination And Factuality Gate

Use this reference to prevent recommendation candidates from repeating unsupported AI answer claims as facts.

## Checks

Check whether:

- AI answer claim is supported by cited or supplied evidence.
- candidate does not repeat unsupported AI claims as facts.
- client facts are not invented.
- competitor claims are not invented.
- dates, metrics, rankings, citations, and source owners are not invented.
- AI answer does not misattribute a source.
- recommendation distinguishes "AI said" from "confirmed fact".
- factual claims are traceable to supplied data, official sources, research, or inspected artifacts.

## Decision Rules

`suppress` for:

- invented facts.
- hallucinated citations.
- fake metrics.
- fake rankings.
- fake competitor claims.
- fake official source claims.
- AI answer claims repeated as confirmed facts when unsupported.

`hold` for:

- plausible but unverified factual claims.
- AI answer claims that may be true but lack supporting source evidence.
- source attribution that needs review.
- client facts that need confirmation before display.

`auto_publish` only when:

- facts are traceable, or
- wording is safely scoped as an observation, not a confirmed external fact.

## Required Distinction

Use:

- "The AI answer stated..."
- "The supplied citation supports..."
- "The supplied evidence confirms..."
- "This remains `NEEDS_VERIFICATION`..."

Do not collapse these into one certainty level.

## Examples

Unsafe:

- "The competitor has SOC2 because the AI answer said so."

Safe:

- "The AI answer described the competitor as having SOC2, but the supplied evidence does not verify that claim. Treat as `NEEDS_VERIFICATION` before client-facing use."
