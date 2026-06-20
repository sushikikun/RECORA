# Eval And Benchmark Claim Gate Rules

External eval tools can improve RECORA's internal evaluation structure, but they cannot prove client AI visibility.

## Allowed Internal Influence

External tools such as OpenAI Evals, Ragas, promptfoo, Garak, and DeepEval may inspire:

- test-case shape
- golden fixtures
- prompt matrices
- red-team categories
- claim support checks
- regression suites
- scorer explanations
- threshold calibration

## Not Allowed As Client Proof

External eval tools and benchmark scores cannot:

- prove client AI visibility
- prove AI citation
- substitute for RECORA observations
- replace source-to-claim review
- be shown as an official RECORA score unless RECORA defines and validates that score
- justify auto_publish without RECORA evidence

## Gate Decisions

- `hold`: external eval pattern is useful, but the candidate lacks RECORA fixtures, observation IDs, or local evidence mapping.
- `suppress`: candidate treats an external metric as proof of client visibility, citation, ranking, or guaranteed outcome.
- `auto_publish`: possible only when the external pattern is internal-only and final wording rests on RECORA evidence.

## Required Fields For Safe Use

- local fixture name or observation ID
- scope of evaluation
- claim under test
- source-to-claim status
- evaluator version or rubric version
- limitations
- client-facing visibility status: internal-only or approved

## Safe Wording

- "Use Ragas-like faithfulness questions internally to check whether a source supports the recommendation."
- "Do not present a Ragas, promptfoo, Garak, or benchmark score as the client's AI visibility score."
