# Playwright-Style Fixture Strategy

Purpose: borrow fixture isolation and reproducibility patterns without running Playwright or browser automation.

## Core Rule

Prefer deterministic local fixtures over live browsers, live providers, logged-in sessions, or external network calls.

## Fixture Pattern

| Fixture element | Requirement |
|---|---|
| Setup | Defines local input data only, with no secrets or live network. |
| Exercise | Describes the parser, adapter, candidate generator, or quality-gate behavior being reviewed. |
| Expected output | Stores expected status, relation, decision, or normalized fields. |
| Teardown | No persistent external state. |
| Reproduction notes | Explain the bug or risk the fixture protects against. |

## Golden Snapshot Uses

Use snapshot-like review for:

- normalized provider payload.
- parser output.
- citation extraction output.
- source-to-claim relation.
- candidate JSON.
- quality-gate decision.
- safe client-facing wording.

## Hard Boundaries

Do not use fixture strategy to justify:

- browser automation.
- cookies or login sessions.
- CAPTCHA handling.
- crawling private or consent-gated content.
- screenshots as AI visibility proof.
- live provider calls from a skill review.

## Example Fixture Families

- provider timeout.
- provider refusal.
- empty answer.
- malformed citation URL.
- duplicate URL variants.
- prompt echo.
- Japanese width or spacing variants.
- source unavailable.
- README-as-proof.
- production-write recommendation.
