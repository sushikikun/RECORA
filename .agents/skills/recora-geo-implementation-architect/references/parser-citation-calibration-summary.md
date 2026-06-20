# Parser Citation Calibration Summary

## CONFIRMED_FROM_FILES

- `tmp/recora-parser-citation-snapshot/` exists and includes parser/citation-related scripts, DB read/write helpers, OpenAI inspection outputs, recommendation candidate outputs, and Supabase migrations.
- `scripts/inspect-openai-output.ts` contains a deterministic inspection parser that extracts output text, brand mentions, citation objects, citation status, and suggested DB mapping.
- `scripts/run-openai-measurement.ts` contains measurement-time brand analysis and citation extraction logic.
- `scripts/import-openai-inspection.ts` imports inspection output into `ai_conversations`, `brand_mentions`, `source_domains`, and `citations`.
- `scripts/generate-recommendation-candidates.ts` reads mention/citation rows and produces candidate JSON/Markdown with citation and source classification notes.
- Candidate output contains a citation review candidate with `citation_count: 26`, `supports_claim_values: ["unknown"]`, and `supports_claim_unknown_count: 26`.
- Migrations confirm `citations` fields for original URL, canonical URL, domain, source type, support flag, occurrence count, text span, cited text, raw citation JSON, and brand relatedness.

## USER_PROVIDED_CONTEXT

- v0.5 should strengthen parser, mention extraction, citation extraction, URL normalization, source-to-claim status, prompt echo, seed contamination, parser versioning, and extraction fixture review behavior.
- The patch must not edit the existing skill, RECORA app code, migrations, database, secrets, or production files.

## NEEDS_VERIFICATION

- No dedicated parser package or test suite was found in the snapshot; parser logic appears embedded in scripts.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.
- Runtime behavior was not executed.
- Provider-specific formats beyond the inspected OpenAI-style output remain unverified.
- Whether upstream extraction records carry prompt seed, parser version, extraction version, or source-to-claim review state remains unverified.

## RECOMMENDED_ARCHITECTURE

- Treat raw answers, provider payloads, normalized mentions, normalized citations, source-domain classifications, and source-to-claim reviews as separate artifacts.
- Require parser and extraction versions on derived mention/citation rows and candidate evidence.
- Require source-to-claim status before citation-backed recommendations become client-facing.
- Add golden fixtures for prompt echo, seeded brands, alias collisions, URL-only brand strings, malformed answers, duplicate citations, and provider citation shape drift.

## DO_NOT_ASSUME

- Do not assume substring matches are organic brand mentions.
- Do not assume citation count is claim support.
- Do not assume a cited URL containing a brand means the answer mentioned that brand.
- Do not assume parser output is replayable without version and fixture evidence.
