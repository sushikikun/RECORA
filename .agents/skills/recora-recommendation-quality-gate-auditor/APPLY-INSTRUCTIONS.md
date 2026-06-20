# Apply Instructions For Recora Recommendation Quality Gate Auditor v0.1

This package is for creating a new project-local Codex skill:

`recora-recommendation-quality-gate-auditor`

## Files In This Package

- `SKILL.md`
- `references/quality-gate-policy.md`
- `references/decision-rubric.md`
- `references/quality-score-rubric.md`
- `references/evidence-sufficiency-rules.md`
- `references/seed-contamination-checklist.md`
- `references/citation-misuse-checklist.md`
- `references/client-facing-risk-language.md`
- `references/geo-seo-aio-llmo-source-pack.md`
- `references/recommendation-candidate-input-contract.md`
- `references/local-skill-patterns-to-borrow.md`
- `evals/evals.json`
- `APPLY-INSTRUCTIONS.md`

## Apply Steps

1. Create the project-local skill directory when write access is available:
   - `.agents/skills/recora-recommendation-quality-gate-auditor/`

2. Copy this package's `SKILL.md` into that directory.

3. Copy the full `references/` directory into:
   - `.agents/skills/recora-recommendation-quality-gate-auditor/references/`

4. Copy the full `evals/` directory into:
   - `.agents/skills/recora-recommendation-quality-gate-auditor/evals/`

5. Validate:
   - `SKILL.md` frontmatter has only `name` and `description`.
   - `evals/evals.json` parses successfully.
   - no executable scripts were added.
   - no placeholders remain.

## Safety Checks

- Do not edit existing skills directly while applying this patch unless explicitly requested.
- Do not edit app code, backend, database, LP, CLI, production files, payment/email integrations, or deployment files.
- Do not touch `.env`, API keys, cookies, credentials, secrets, private tokens, or login sessions.
- Do not add scripts.
- Do not invent official claims, source URLs, citations, dates, AI answer results, SERP results, or competitor visibility.
- Keep the skill review-only: it audits recommendation candidates and does not implement Recora.
