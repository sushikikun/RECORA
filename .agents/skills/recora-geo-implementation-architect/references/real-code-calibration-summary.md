# Real Code Calibration Summary

## CONFIRMED_FROM_FILES

- Existing installed skill inspected: `.agents/skills/recora-geo-implementation-architect/SKILL.md`.
- Installed implementation architect is currently `Version: v0.2-oss-calibration`.
- Stack files inspected:
  - `.agents/skills/RECORA-SKILL-STACK.md`
  - `.agents/skills/RECORA-SKILL-STACK-V1-HARDENING.md`
  - `.agents/skills/georader-ai-search-auditor/SKILL.md`
  - `.agents/skills/recora-recommendation-quality-gate-auditor/SKILL.md`
- Real RECORA candidate artifacts inspected:
  - `tmp/recora-recommendation-candidates/generate-recommendation-candidates.ts`
  - `tmp/recora-recommendation-candidates/recommendation-candidates.json`
  - `tmp/recora-recommendation-candidates/recommendation-candidates.md`
- The generated JSON contains 3 candidates:
  - `rec-23677594-brand-visibility-gap`
  - `rec-23677594-citation-evidence-review`
  - `rec-23677594-case-study-evidence-gap`
- The payload records `db_write_status: "not_written"`.
- The payload records `db_write_check.unchanged: true` and `recommendations_before: 6`, `recommendations_after: 6`.
- The citation candidate records `citation_count: 26` and `supports_claim_values: ["unknown"]`.
- The generator writes JSON and Markdown outputs only in the inspected code path; no insert/update/delete statements were observed in the inspected generator.
- The generator reads local environment values if run through `loadEnvLocal()`, but this calibration did not run it and did not inspect `.env.local`.

## USER_PROVIDED_CONTEXT

- The task asks for a v0.3 real-code calibration patch only.
- Existing skills must not be edited directly.
- App code, backend, database, migrations, LP, CLI, production files, secrets, cookies, credentials, and login sessions are out of scope.
- The patch must strengthen implementation review behavior against inspected RECORA artifacts.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- RECORA production app code was not inspected.
- Production migrations and generated database types were not inspected.
- Runtime behavior of the candidate generator was not executed during this calibration.
- Whether the inspected temporary generator is the active production implementation remains NEEDS_VERIFICATION.
- Whether quality gate reviews are persisted in the production database remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Treat the inspected candidate generator and exports as calibration fixtures for implementation review.
- Require future implementation reviews to map actual output fields to the skill-stack candidate contract before recommending code changes.
- Add a strict candidate output schema layer that keeps current output compatibility while adding explicit contract fields.
- Add separate persisted objects for raw measurement evidence, derived candidate draft, draft-time rejection, and quality-gate review.
- Add version fields: `schema_version`, `generator_version`, `parser_version`, and `quality_gate_version`.

## DO_NOT_ASSUME

- Do not assume the current JSON shape is the database schema.
- Do not assume `supports_claim_values: ["unknown"]` is equivalent to `source_to_claim_status`.
- Do not assume `display_decision: "show"` means quality-gate approval.
- Do not assume `quality_score` is a publication quality-gate score.
- Do not assume the temporary generator's local DB queries are safe for production without migration, RLS, and authorization review.
