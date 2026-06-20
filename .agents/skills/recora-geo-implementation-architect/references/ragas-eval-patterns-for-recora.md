# Ragas-Style Eval Patterns For RECORA

Use these patterns to improve RECORA fixture and regression design. Do not run Ragas or treat Ragas scores as RECORA visibility proof.

## Borrowed Eval Structure

- golden fixtures
- answer-to-source support checks
- claim support evaluation
- faithfulness-like questions
- retrieval/citation support checks
- source availability status
- regression tests for parser and recommendation output

## RECORA-Specific Eval Questions

- Does the cited source support the exact recommendation claim?
- Does the answer merely mention the topic, or does it support the client action?
- Is the provider result a timeout, refusal, blocked state, empty answer, or valid answer?
- Was the brand mention seeded by the prompt?
- Are original URLs preserved before normalization?
- Does the candidate include observation IDs and source-to-claim status?

## Required Fixture Types

- directly supported source
- topic-only source
- unsupported source
- unavailable or hallucinated source
- prompt echo
- provider refusal
- provider timeout
- empty answer
- duplicate URLs
- Japanese spacing or width variants

## Boundary

Ragas-like checks are internal QA. They cannot prove:

- AI visibility
- AI citation
- ranking
- traffic
- revenue
- production correctness

## Implementation Review Output

Recommend local fixtures and deterministic assertions before any external evaluator is considered.
