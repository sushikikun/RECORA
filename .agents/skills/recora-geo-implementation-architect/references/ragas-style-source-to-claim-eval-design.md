# Ragas-Style Source-To-Claim Eval Design

Purpose: borrow source-support evaluation structure for RECORA without running Ragas or using Ragas scores as RECORA evidence.

## Core Rule

Source-to-claim evaluation must be local, evidence-scoped, and traceable to RECORA observations. A citation count is not claim support.

## Review Structure

| Step | Requirement |
|---|---|
| Claim extraction | Identify the exact claim made by the candidate. |
| Evidence span | Identify the source text, answer span, page section, or observation supporting the claim. |
| Citation relation | Classify the relation between source and claim. |
| Source provenance | Record whether the source came from provider answer, RECORA crawler, user artifact, prompt seed, or external tool output. |
| Review status | Record whether the source was reviewed, unavailable, or unknown. |
| Fixture link | Add a local golden fixture for recurring failure modes. |

## Relation Enum

| Status | Meaning | Gate implication |
|---|---|---|
| `supported` | Source directly supports the exact claim. | Eligible if all other gates pass. |
| `partially_supported` | Source supports part of the claim but important detail is missing. | Hold. |
| `contradicted` | Source conflicts with the claim. | Suppress. |
| `unrelated` | Source does not address the claim. | Suppress if client-facing. |
| `unknown` | Relation cannot be determined from available evidence. | Hold. |
| `not_reviewed` | Source relation was not inspected. | Hold. |

## Local Golden Fixtures

| Fixture | Expected relation |
|---|---|
| Exact product claim in cited source | `supported` |
| Source mentions category but not client claim | `partially_supported` or `unrelated` depending wording |
| Cited URL redirects to unrelated page | `unrelated` |
| Source contradicts generated recommendation | `contradicted` |
| Source is inaccessible or blocked | `unknown` |
| Source was supplied by prompt seed | Relation may be supported but seed risk remains |
| README feature claim used as evidence | `not_reviewed` until independently inspected |

## Implementation Review Questions

- Does the data model store claim text separately from recommendation text?
- Does the citation record include original URL and normalized URL?
- Does quality-gate payload include source-to-claim relation?
- Can relation be replayed when parser versions change?
- Are source spans stored without exposing secrets or private client data?
