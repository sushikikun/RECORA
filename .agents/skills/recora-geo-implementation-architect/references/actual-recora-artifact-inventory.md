# Actual RECORA Artifact Inventory

## CONFIRMED_FROM_FILES

### Skill Stack

- `.agents/skills/RECORA-SKILL-STACK.md`
  - Defines two original roles: georader drafts candidates; quality gate decides `auto_publish`, `hold`, or `suppress`.
- `.agents/skills/RECORA-SKILL-STACK-V1-HARDENING.md`
  - Encodes smoke-test hardening: direct measurement can be strong, citation gap with unknown source support must hold, README/browser/API/secrets candidates should become draft-time rejection or suppress.
- `.agents/skills/georader-ai-search-auditor/SKILL.md`
  - Version v0.9 with v1.0 hardening language.
- `.agents/skills/recora-recommendation-quality-gate-auditor/SKILL.md`
  - Version v0.3.1 with v1.0 hardening language.
- `.agents/skills/recora-geo-implementation-architect/SKILL.md`
  - Version v0.2-oss-calibration.

### Real Candidate Artifacts

- `tmp/recora-recommendation-candidates/generate-recommendation-candidates.ts`
  - TypeScript generator artifact.
  - Size observed: 86603 bytes.
  - Defines `Candidate`, `CandidateEvidence`, and `CandidatesPayload` types.
  - Uses `LocalPostgresClient` and read queries for project, runs, brands, run items, conversations, mentions, citations, and counts.
  - Defines `TABLES`: `measurement_runs`, `run_items`, `ai_conversations`, `brand_mentions`, `citations`, `source_domains`, `recommendations`.
  - Writes JSON and Markdown outputs.
- `tmp/recora-recommendation-candidates/recommendation-candidates.json`
  - Size observed: 152771 bytes.
  - Contains 3 generated candidates.
- `tmp/recora-recommendation-candidates/recommendation-candidates.md`
  - Size observed: 14851 bytes.
  - Markdown render of the same candidate run.

## USER_PROVIDED_CONTEXT

- The user asked to inspect actual RECORA artifacts only if available in the workspace.
- The user asked not to modify output files.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- No actual RECORA app repository root was proven from these artifacts.
- Output path values inside JSON reference `C:\Users\nakan\work\recora\...`, which is outside the requested workspace and was not inspected.
- No production migration files for RECORA candidate or gate persistence were inspected.

## RECOMMENDED_ARCHITECTURE

- Treat `tmp/recora-recommendation-candidates/` as a real-code calibration fixture set.
- Require future implementation reviews to cite which files were inspected before making claims.
- Add an artifact-inventory section to review outputs whenever current code is under discussion.

## DO_NOT_ASSUME

- Do not assume all copied candidate files in the workspace are production outputs.
- Do not assume temporary artifacts are authoritative database schema.
- Do not infer production quality-gate behavior from `display_decision` or `quality_score`.
