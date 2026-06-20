# External Source-To-Claim Patterns For GEO Analysis

Purpose: borrow source-to-claim concepts for GEO analysis, citation opportunity framing, and recommendation drafts.

## Core Rule

Citation count does not prove source support. A source must support the specific claim before it can be used as client-facing evidence.

## Analysis Fields

| Field | Use |
|---|---|
| `claim_text` | Exact strategic claim or recommendation claim. |
| `source_url` | Original cited or inspected source URL. |
| `source_relevance` | Whether the source is owned, third-party, competitor, vendor, media, review, docs, or unknown. |
| `claim_relation` | Supported, partially supported, contradicted, unrelated, unknown, or not reviewed. |
| `evidence_label` | CONFIRMED_FACT, OFFICIAL_SOURCE, RESEARCH_BACKED, INDUSTRY_PRACTICE, GEORADER_ASSUMPTION, or NEEDS_VERIFICATION. |
| `citation_gap` | Missing source type or missing proof asset needed for citation readiness. |
| `seed_risk` | Whether the source/claim may have been introduced by the prompt or input seed. |

## Strategy Use

Use source-to-claim analysis to:

- identify proof pages.
- identify missing comparison pages or FAQs.
- separate competitor citation observations from actual support.
- soften recommendations when source support is partial.
- mark external tool claims as `NEEDS_VERIFICATION`.

## Unsafe Uses

Do not:

- say citation count proves claim support.
- turn a topic-only source into a client proof claim.
- use external README claims as source evidence.
- publish unsupported citation-gap recommendations without quality-gate review.
- claim guaranteed AI citation from improved source support.

## Safe Wording

"The cited source appears relevant to the topic, but the exact claim support needs verification before client-facing publication."
