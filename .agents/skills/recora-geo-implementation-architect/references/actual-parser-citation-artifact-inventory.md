# Actual Parser Citation Artifact Inventory

## CONFIRMED_FROM_FILES

| Artifact | Present | Role |
| --- | --- | --- |
| `tmp/recora-parser-citation-snapshot-inventory.csv` | yes | Snapshot file inventory. |
| `scripts/inspect-openai-output.ts` | yes | OpenAI response inspection, mention parsing, citation extraction, markdown/JSON output. |
| `scripts/run-openai-measurement.ts` | yes | Measurement execution plus parser/extractor persistence logic. |
| `scripts/import-openai-inspection.ts` | yes | Imports inspection artifacts into DB tables. |
| `scripts/generate-recommendation-candidates.ts` | yes | Builds recommendation candidate evidence from persisted rows. |
| `scripts/save-recommendation-candidates.ts` | yes | Saves selected display candidates to `recommendations`. |
| `output/openai-inspection/*.json` and `.md` | yes | Inspection result fixtures. |
| `output/recommendation-candidates/*.json` and `.md` | yes | Candidate output fixtures. |
| `lib/recora/db/conversations.ts` | yes | Reads conversations, brand mentions, citations. |
| `lib/recora/db/sources.ts` | yes | Reads source domains and citations. |
| `supabase/migrations/*.sql` | yes | Schema evidence for mention/citation tables. |
| Dedicated parser test files | no obvious files | Needs verification. |
| Generated parser golden fixtures | no obvious files | Needs verification. |

## USER_PROVIDED_CONTEXT

- Inspect parser, extraction, mention, citation, source, and provider-related TypeScript files only if present.

## NEEDS_VERIFICATION

- Files outside the copied snapshots were not treated as implementation evidence.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.
- No secret-like filenames were found by filename scan in the parser/citation snapshot.

## RECOMMENDED_ARCHITECTURE

- Maintain an artifact inventory before any parser review.
- Require reviewers to mark absent test files, generated types, or parser modules as unavailable rather than inferring behavior.
- Treat output JSON/Markdown as observed artifacts, not proof that all edge cases are handled.

## DO_NOT_ASSUME

- Do not assume scripts are production code paths unless the repository proves it.
- Do not assume output fixtures cover all provider formats.
- Do not assume UI display logic validates extraction correctness.
