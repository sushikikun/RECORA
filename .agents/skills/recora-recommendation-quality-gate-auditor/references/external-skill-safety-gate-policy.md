# External Skill Safety Gate Policy

Use this policy when a recommendation candidate references an external skill, OSS repository, benchmark, README, tool output, or third-party audit pattern.

## Core Rule

Third-party skills and OSS-derived claims are untrusted until audited. External patterns can improve RECORA's internal review structure, but they are not client evidence by themselves.

## Evidence Labels

- `OSS_RESEARCH_PATTERN`: a pattern borrowed from an OSS repository, documentation, or research package as an internal rubric or schema idea.
- `EXTERNAL_SKILL_PATTERN`: a pattern borrowed from a third-party skill or skill-like package as an internal review structure.
- `NEEDS_VERIFICATION`: any external claim that has not been verified against RECORA observations, code, tests, or approved source evidence.
- `RECORA_EVIDENCE`: RECORA-controlled measurement, observation, extracted source, inspected fixture, or approved internal record.

## Gate Rules

- Never treat external README claims as RECORA evidence.
- Never treat external benchmark claims as proof of client AI visibility, citation, ranking, traffic, or revenue.
- Never auto_publish a recommendation based only on external tool claims, external skill text, or OSS marketing copy.
- Hold or suppress candidates that present external tool output as client-facing proof without RECORA measurement.
- Keep external pattern influence visible in internal notes using `OSS_RESEARCH_PATTERN` or `EXTERNAL_SKILL_PATTERN`.
- Require RECORA evidence ledger references before any client-facing recommendation can be published.

## Decision Guidance

- `auto_publish`: allowed only when external pattern influence is internal-only and the candidate is supported by direct RECORA evidence.
- `hold`: use when the idea is plausible but external evidence has not been mapped to RECORA observations or source-to-claim support.
- `suppress`: use when the candidate turns external claims into guarantees, client proof, secret requests, execution steps, or production actions.

## Safe Wording

- Safe: "Use an internal evaluation rubric inspired by external eval patterns to review RECORA fixtures."
- Hold: "This tool claims it can measure AI visibility; verify with RECORA observations before client display."
- Suppress: "This external tool proves the client will be cited by ChatGPT."
