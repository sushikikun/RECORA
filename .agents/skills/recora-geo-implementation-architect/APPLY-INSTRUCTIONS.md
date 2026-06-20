# Apply Instructions

This package creates the v0.2-oss-calibration project-local Codex skill patch for:

`recora-geo-implementation-architect`

Install location:

`.agents/skills/recora-geo-implementation-architect`

## Install Manually

1. Create the target directory if needed:

   `.agents/skills/recora-geo-implementation-architect`

2. Copy these package contents into that directory, replacing the v0.1 files only when you intentionally apply v0.2:

   - `SKILL.md`
   - `agents/openai.yaml`
   - `references/`
   - `evals/evals.json`

3. Do not copy `APPLY-INSTRUCTIONS.md` into the installed skill unless you intentionally want local install notes inside the skill folder.

4. Do not edit existing RECORA skills as part of this package installation.

## Post-Install Validation

- Confirm `SKILL.md` frontmatter contains only `name` and `description`.
- Confirm the installed folder name is `recora-geo-implementation-architect`.
- Confirm `evals/evals.json` parses as JSON.
- Confirm all files are UTF-8.
- Confirm no executable scripts were added.
- Confirm no app, backend, database, migration, LP, CLI, production, `.env`, credential, cookie, token, or login-session files were modified.
- Confirm the new OSS-calibrated references are present:
  - `references/oss-derived-implementation-patterns.md`
  - `references/crawler-and-extraction-architecture.md`
  - `references/technical-seo-audit-code-review-checklist.md`
- Confirm no third-party source code, executable crawler, browser automation, external-service setup, or credential template was added.

This task does not install the skill.
