# AI Citation Source Integrity

Use this reference to evaluate whether citations and sources in a recommendation candidate support the claim being made.

## Integrity Checks

Check whether:

- cited URL exists in supplied data.
- source domain matches the candidate claim.
- source actually supports the claim.
- citation is not merely a homepage when a specific page is needed.
- cited source is not competitor-only unless the recommendation is competitor-gap related.
- source is not stale or unverified when current behavior is claimed.
- citation is not hallucinated.
- source is not a seed prompt artifact.
- source owner, title, and URL are represented accurately when known.
- source is not being used to support broader claims than it can carry.

## Decision Rules

`auto_publish` only when:

- source-to-claim mapping is clear.
- cited URLs or source records are present in supplied evidence.
- the source supports the narrow claim.
- client-facing wording does not overstate source support.

`hold` when:

- source exists but support is weak or indirect.
- source status or freshness is unclear.
- a homepage citation needs a more specific page.
- the cited source supports a weaker recommendation than the candidate states.
- source owner or date needs verification.

`suppress` when:

- citation is invented.
- source is hallucinated.
- citation is misused or misleading.
- source is seed-contaminated.
- candidate claims official support that the source does not provide.

## Internal Source Ledger

Use:

| Candidate claim | Cited source | Supplied URL? | Supported? | Not supported | Integrity decision |
|---|---|---|---|---|---|

If the supplied data does not include the source, do not invent it. Mark the source as `NEEDS_VERIFICATION` and use `hold` or `suppress` depending on risk.

## Client-Safe Language

- "The supplied source supports this narrower point."
- "The current citation does not yet support the broader recommendation."
- "A more specific source URL is needed before client-facing publication."
- "The citation appears to be generated or unsupported, so this candidate should be suppressed."
