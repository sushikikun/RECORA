# Testing And Fixture Strategy

## Test Layers

- unit tests
- schema validation tests
- parser fixtures
- adapter contract tests
- pipeline integration tests
- database transaction tests
- idempotency tests
- retry tests
- quality-gate handoff tests
- snapshot/golden tests
- regression tests

## Required Fixtures

- valid non-branded absence
- seeded brand mention
- seeded competitor mention
- malformed answer
- empty/refusal answer
- duplicate citations
- hallucinated URL
- source-to-claim unknown
- provider timeout
- partial provider result
- repeated job delivery
- direct evidence candidate
- unsafe README/API/login/browser candidate
- citation-gap hold candidate
- README claim treated as implementation fact
- planned provider displayed as live
- provider no-citation result
- citation parser failure
- source freshness unknown
- competitor-owned citation used as client support
- crawler timeout
- robots-disallowed crawl
- rate-limited extraction
- JS-required page not rendered
- malformed structured data
- valid schema with no AI citation proof
- technical SEO readiness-only candidate
- `llms.txt` present with unverified impact
- repeated crawl job delivery
- source page changed after citation

## Review Questions

- Do parser fixtures preserve raw answers and expected spans?
- Do schema tests reject missing source-to-claim status when required?
- Do retry tests avoid duplicate citations, mentions, candidates, and recommendations?
- Do integration tests cover partial completion and terminal failure?
- Do gate handoff tests prove candidate generation does not decide `auto_publish`?
- Do golden tests capture safe output wording and risk flags?
- Do crawler/extraction fixtures keep technical readiness separate from AI answer evidence?
- Do provider adapter fixtures distinguish provider no-citation, parser failure, timeout, blocked, and valid absence states?
- Do source-to-claim fixtures hold or reject candidates when source support is unknown?
- Do cost-control fixtures prove budget exhaustion does not become an evidence claim?

## OSS-Calibrated Failure Patterns

Include regression fixtures inspired by OSS research anti-patterns:

- crawler output converted directly into AI citation proof
- browser automation suggested in review-only mode
- external API key requested for an adapter review
- README feature list converted into RECORA provider support
- generic technical SEO audit issue converted into a GEO recommendation without evidence
- LLM judge output treated as definitive brand verification
- trend comparison across incompatible query sets or collection methods
- report score hides missing source-to-claim review
