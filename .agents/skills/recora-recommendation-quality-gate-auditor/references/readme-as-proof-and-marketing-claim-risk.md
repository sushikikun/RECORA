# README-As-Proof And Marketing Claim Risk

## Purpose

Use this reference when a recommendation candidate relies on public repository README language, vendor marketing, benchmark claims, feature claims, screenshots, stars, or repository popularity.

## Core Rule

README claims are not validated facts.

They can inspire internal patterns. They cannot become client-facing evidence unless independently verified through appropriate RECORA evidence, official sources, or directly inspected artifacts.

## High-Risk Claim Types

Treat these as high risk:

- "world first", "only", "best", "leading", or "definitive"
- "guarantees", "gets your brand mentioned", "maximum visibility", or similar outcome language
- benchmark claims, coverage claims, speed claims, accuracy claims, or market statistics
- provider/platform support claims that are not verified in RECORA
- claims that a tactic will cause AI citation, ranking, or recommendation
- screenshots or demos presented as proof of actual behavior
- repository stars, forks, releases, or activity presented as quality proof

## Decision Rules

### Suppress

Suppress when:

- README or marketing claims are used as proof of client outcome.
- The candidate repeats unverified benchmark/statistic language as fact.
- The candidate says a tactic guarantees AI citation, ranking, or recommendation.
- The candidate claims RECORA supports a provider because an external repository claims support.

### Hold

Hold when:

- README research is used as inspiration but the candidate lacks RECORA measurement evidence.
- The candidate can be rewritten into an internal planning note.
- The claim may be useful but needs official-source, research-source, or RECORA evidence.

### Auto-Publish

Auto-publish only when:

- README language is not used as proof.
- Actual RECORA evidence supports the client-facing claim.
- Wording is scoped and safe.

## Safe Rewrite Pattern

Unsafe:

"This open-source GEO tool proves that adding citation pages will make AI engines cite the client."

Safe:

"OSS research suggests citation/source ledgers are a useful review structure. For this client, publication requires RECORA measurement evidence showing the relevant query, provider, citation, and source-to-claim support."

