# External Tool And Skill Claim Risk

Use this gate when a recommendation candidate repeats external tool, skill, README, benchmark, or marketing claims.

## High-Risk Claim Patterns

Suppress candidates containing these patterns unless independently backed by approved RECORA evidence and rewritten safely:

- "world first"
- "guaranteed ranking"
- "guaranteed AI citation"
- "guaranteed recommendation"
- "official GEO standard" without an official primary source
- "README proves"
- "benchmark proves client visibility"
- generic "AI visibility score" with no RECORA method, observation IDs, or source-to-claim support
- external tool output used as client-facing proof without RECORA measurement

## Hold Patterns

Use `hold` when:

- a benchmark claim may be useful internally but lacks inspected fixtures.
- a tool claims broad coverage but RECORA has not inspected code, tests, limitations, or license.
- an external score is real for that tool but not mapped to RECORA's evidence ledger.
- a third-party output mentions a source domain but not whether the source supports the claim.

## Required Checks

- What exactly was inspected: README, docs, code, tests, runtime, or research package only.
- Whether the claim is external marketing, research-backed, official-source-backed, or RECORA evidence.
- Whether the candidate uses external claims for internal planning or client-facing publication.
- Whether source-to-claim status exists for any cited URL.

## Safe Rewrites

- Unsafe: "This OSS tool proves the client will rank in AI answers."
- Safe internal: "Borrow this external tool's evaluation structure for RECORA fixtures."
- Safe client-facing after evidence: "RECORA observations show this source was cited in the sampled query set; the recommendation is based on those observations, not the external tool's README."
