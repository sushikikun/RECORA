# Source Domain Normalization Rules

## CONFIRMED_FROM_FILES

- Source domains are stored in `source_domains` and linked from `citations`.
- `run-openai-measurement.ts` classifies source type by matched brand domain or heuristic URL/domain terms.
- `generate-recommendation-candidates.ts` reclassifies source domain type using stored source type, owner domains, and domain hints for ecommerce, media, foreign brand, manufacturer, and unknown.
- Candidate output states source domain types are simple Recora classifications and require real URL review.

## USER_PROVIDED_CONTEXT

- v0.5 should strengthen source-domain normalization and prevent domain/source classification from becoming claim support.

## NEEDS_VERIFICATION

- No confirmed public suffix handling, registrable-domain parsing, IDN handling, or subdomain policy was found.
- Source classification provenance and confidence are not confirmed as persisted fields.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Normalize source domains with an explicit domain parser and versioned rules.
- Store host, registrable domain, original URL, canonical URL, source type, classifier version, classifier basis, and confidence.
- Treat source type as a routing/review signal only.
- Add fixtures for subdomains, country-code domains, marketplace URLs, competitor-owned domains, and ambiguous brand domains.

## DO_NOT_ASSUME

- Do not infer ownership from substring hints alone.
- Do not treat source type as source quality.
- Do not treat a domain match as source-to-claim support.
