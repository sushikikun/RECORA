# Extraction Fixtures And Golden Tests

## CONFIRMED_FROM_FILES

- OpenAI inspection JSON and recommendation candidate JSON can serve as observed fixtures.
- No dedicated parser test or golden fixture directory was found in the parser/citation snapshot inventory.
- Current skill testing reference already requires parser fixtures, adapter contract tests, snapshot/golden tests, regression tests, and source-to-claim fixtures.

## USER_PROVIDED_CONTEXT

- v0.5 evals must cover each parser/citation bug class and require extraction fixtures for each bug class.

## NEEDS_VERIFICATION

- No test runner, parser fixture format, or golden output schema was confirmed for parser extraction.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

Required fixture classes:

- Raw substring target false positive.
- Prompt echo counted as organic mention.
- Seeded target or competitor counted as discovered visibility.
- Cited URL contains brand while answer text does not.
- Japanese width, spacing, alias, and collision variants.
- Target and competitor alias overlap.
- Citation count exists but source-to-claim status is unknown.
- Duplicate citation URLs from provider or retry.
- Hallucinated, malformed, and unreachable URLs.
- Provider-specific citation field missing or renamed.
- Malformed, empty, refusal, blocked, or partial answers.
- Parser version missing during replay.

Golden outputs should include raw answer ID, normalized mention rows, citation rows, source-to-claim status, risk flags, and expected candidate gating state.

## DO_NOT_ASSUME

- Do not rely on one OpenAI output as broad parser coverage.
- Do not accept fixture pass without raw input and expected spans.
- Do not let tests assert publication decisions owned by the quality-gate skill.
