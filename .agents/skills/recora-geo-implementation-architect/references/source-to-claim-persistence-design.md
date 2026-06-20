# Source To Claim Persistence Design

## CONFIRMED_FROM_FILES

- `citations.supports_claim` exists and migration comments state null means support has not been verified.
- `citations` also has URL, domain, title, canonical URL, text span, cited text, raw citation JSON, source type, and brand relatedness.
- Candidate JSON citation evidence includes `supports_claim_values` and `supports_claim_unknown_count`.
- The inspected citation candidate has citation evidence but support status remains unknown in output.
- No `source_to_claim_reviews` table or equivalent migration was found.

## USER_PROVIDED_CONTEXT

- v0.4 must strengthen citation extraction and source-to-claim review at persistence level.

## NEEDS_VERIFICATION

- The review workflow for turning unknown support into supported, contradicted, unrelated, or unverifiable is not persisted in inspected migrations.
- The exact relation between a claim sentence and one or more citation rows is not modeled in the inspected schema.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Add persisted source-to-claim review objects that link claim text or claim hash to citation rows and source domains.
- Store review status separately from provider citation availability.
- Preserve reviewer version, review method, reviewed at, evidence excerpt, source excerpt when available, and uncertainty reason.
- Allow one claim to map to multiple sources and one source to map to multiple claims.
- Use `citations.supports_claim` only as a legacy or derived convenience field unless a richer review object confirms it.

## DO_NOT_ASSUME

- Do not treat URL presence as claim support.
- Do not treat provider citation status as source quality.
- Do not treat `supports_claim = null` or unknown values as safe evidence for client-facing claims.
