# Recora Codex Operating Rules

This repository is the Recora product repository. Read `docs/recora-dev-workflow.md` and `.agents/skills/RECORA-SKILL-STACK.md` before changing code.

## Scope and ownership

- Work only inside this repository unless the task explicitly names another project.
- Preserve existing human-authored changes. Do not overwrite or mix unrelated working-tree changes.
- Keep `.agents/skills/**` changes separate from product-code changes under `app/**`, `components/**`, `lib/**`, `scripts/**`, or `supabase/**`.
- Use the existing Recora skill stack for strategy, implementation architecture, specialist analysis, and recommendation quality gates.

## Tools

- Use `/plan` before `/goal` for multi-file, database, deployment, or long-running work.
- Use MCP servers, plugins, subagents, worktrees, automations, and browser verification when they improve accuracy or speed.
- Prefer the Recora-scoped Supabase connection for schema, RLS, logs, advisors, and data inspection.
- Use current primary documentation for framework and API behavior; use the OpenAI Docs MCP for OpenAI products.
- Verify UI changes with Playwright and verify deployments with the Recora Vercel project when available.

## Secrets and environments

- Do not print, paste, commit, or expose `.env*`, database URLs, API keys, tokens, cookies, credentials, or private keys.
- Environment values may be checked for presence and target identity without displaying the full value.
- Confirm the target project, environment, and database host before write-capable operations.

## Database and external effects

- Start database work with schema/RLS inspection or dry-run planning.
- Production or non-local writes, migrations, measurement execution, and external API jobs require an explicit task scope and a separate checkpoint before execution.
- Do not combine a migration with unrelated UI or application work.
- Keep Recora metrics traceable to raw observations and never invent measurements, citations, sources, or provider results.

## Validation

After changes, run:

```powershell
npm run recora:preflight:full
git diff --check
```

For runtime, dashboard, report, API, or deployment-affecting changes, also run:

```powershell
npm run lint
npm run build
```

For dashboard/read-model changes, also run:

```powershell
npm run recora:dashboard-read-model:check
```

Use `npm run recora:commit-check` before committing. Codex must not push unless the task explicitly authorizes it.