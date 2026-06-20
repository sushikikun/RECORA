# RECORA Provider Capability Status

## Purpose

Use provider capability status to prevent accidental overclaims about which AI platforms, search surfaces, or measurement methods RECORA supports.

## Core Rule

`provider_status` is not quality evidence by itself.

It describes whether a provider/platform/method is available or known in the RECORA context. It does not prove an answer is valid, a citation is relevant, a source supports a claim, or a recommendation should be published.

## Status Values

### `supported`

Meaning: RECORA has a known measurement or review method for this provider/platform in the specific context.

Use carefully:

- Supported means "method exists", not "result is trustworthy".
- Still require prompt, date/run, answer/source evidence, seed risk, and source-to-claim checks.

### `planned`

Meaning: the provider/platform is planned or mentioned for future support.

Use carefully:

- Cannot support client-facing measurement claims.
- Mark recommendations relying on planned support as `NEEDS_VERIFICATION`.

### `unknown`

Meaning: provider/platform capability was not supplied or cannot be determined from available evidence.

Use carefully:

- Do not infer support.
- Candidate should normally be internal-only or quality-gate hold.

### `not_inspected`

Meaning: provider/platform capability exists as a question but was not inspected in the current task.

Use carefully:

- Include in "not inspected" sections.
- Do not use for client-facing proof.

### `manual_only`

Meaning: evidence can be reviewed manually from supplied artifacts, exports, screenshots, or documents, but no live or automated measurement method is assumed.

Use carefully:

- Client-facing wording must scope the evidence to supplied/manual review.
- Do not imply automation.

### `research_only`

Meaning: the provider/platform/method is only a future research idea or OSS-derived pattern.

Use carefully:

- Do not use as client-facing proof.
- Keep recommendations internal or planning-only.

### `blocked`

Meaning: provider/platform/method cannot currently be used because of policy, access, compliance, cost, technical, or missing-evidence constraints.

Use carefully:

- Draft as blocker or limitation, not as measurement evidence.

### `disabled`

Meaning: provider/platform/method is intentionally turned off or unavailable in current RECORA workflow.

Use carefully:

- Do not draft client-facing claims that depend on it.

## Candidate Draft Requirements

Every platform-specific candidate should include:

- provider
- provider_status
- search_mode
- what the status permits
- what the status does not prove
- needed verification

## Unsafe Inferences

- `supported` does not mean the observed answer is correct.
- `planned` does not mean the platform was measured.
- `unknown` does not mean unsupported; it means do not claim support.
- `manual_only` does not mean automated monitoring exists.
- `research_only` does not mean client-facing evidence.

