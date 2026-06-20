# Provider Status Gate Rules

## Purpose

Use this reference when a candidate includes `provider_status` or makes platform/provider support claims.

## Core Rule

Provider status describes capability, not evidence quality.

Even `supported` does not prove the answer is correct, the source supports the claim, or the candidate should be published.

## Status Handling

### `supported`

Meaning: a measurement or review method exists in the RECORA context.

Gate rule:

- Can support review only when paired with actual RECORA evidence.
- Still require query, date/run, seed risk, answer/source evidence, and source-to-claim status.

### `planned`

Meaning: future support is planned.

Gate rule:

- Cannot support `auto_publish`.
- Use `hold` or internal note unless the client-facing claim does not depend on the provider.

### `unknown`

Meaning: support status is not known.

Gate rule:

- Cannot support `auto_publish`.
- Hold if provider evidence is required.

### `not_inspected`

Meaning: provider support or measurement was not checked.

Gate rule:

- Cannot support `auto_publish`.
- Include in required verification or limitations.

### `manual_only`

Meaning: only supplied/manual evidence review is available.

Gate rule:

- Client-facing wording must say the evidence is based on supplied/manual review.
- Auto-publish only if all other evidence checks pass and no automation is implied.

### `research_only`

Meaning: the provider/method is only a future research idea.

Gate rule:

- Not client-facing proof.
- Hold or internal note.

### `blocked`

Meaning: provider/method cannot currently be used.

Gate rule:

- Hold or technical review.
- Do not publish claims dependent on blocked evidence.

### `disabled`

Meaning: provider/method is intentionally unavailable.

Gate rule:

- Hold or suppress if the recommendation depends on it.

## Suppress When

- Candidate says planned, unknown, not_inspected, research_only, blocked, or disabled provider status proves a client result.
- Candidate invents platform support.
- Candidate says supported status alone proves answer or citation quality.

