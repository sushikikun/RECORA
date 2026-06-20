# Parser And Extraction Risk Register

## CONFIRMED_FROM_FILES

- `buildObservations()` marks target brand mentioned when a matching `brand_mentions` row exists or when `conversation.raw_answer.includes(primaryBrand.name)`.
- `buildObservations()` stores `response_excerpt` by truncating raw answer text.
- `toCitationEvidence()` maps citation fields into normalized citation evidence.
- `classifySourceDomain()` uses existing source type when available, then heuristic domain hints for owned, competitor, ecommerce, media, foreign brand, manufacturer, and unknown.
- `normalizeSupportsClaim()` maps null and unrecognized values to `unknown`.

## USER_PROVIDED_CONTEXT

- The skill should identify parser/extraction risks from actual candidate examples.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Alias handling, Japanese width/spacing normalization, prompt echo handling, and name-collision rules were not verified in the inspected generator.
- Whether mention extraction happens upstream or only inside this generator remains NEEDS_VERIFICATION.
- Whether citation extraction parser versions are stored remains NEEDS_VERIFICATION.

## Risk Register

| Risk | Severity | Confirmed basis | Recommended review action |
|---|---|---|---|
| Raw substring match can create false positives | P1 | `raw_answer.includes(primaryBrand.name)` observed | Require alias table, spans, context, and parser version |
| Prompt-seeded mentions may be counted without seed fields | P1 | No `seed_terms` or `seed_contamination_risk` in output | Propagate prompt seed metadata into evidence |
| Source domain type can be heuristic | P2/P1 | `classifySourceDomain()` uses hints | Mark as classification confidence, not fact |
| Citation support remains unknown | P1 | `supports_claim` normalizes unknown | Add source-to-claim review layer |
| Parser output lacks version fields | P1 | No `parser_version` or `extractor_version` observed | Add parser/generator/schema versions |

## RECOMMENDED_ARCHITECTURE

- Add extraction records with:
  - parser version
  - extracted span
  - source text reference
  - match type
  - alias used
  - confidence
  - seed contamination risk
  - needs verification
- Keep URL-only brand matches distinct from answer-text mentions.
- Treat heuristic source classification as review signal, not source truth.

## DO_NOT_ASSUME

- Do not assume raw substring match proves organic visibility.
- Do not assume source domain type proves source quality.
- Do not assume a cited page mentioning a brand means the answer recommended that brand.
