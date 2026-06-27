# Recora Codex Operating Rules

This repository is the Recora product repository. Read `docs/recora-dev-workflow.md` and `.agents/skills/RECORA-SKILL-STACK.md` before changing code.

## Scope and ownership

- Work only inside this repository unless the task explicitly names another project.
- Preserve existing human-authored changes. Do not overwrite or mix unrelated working-tree changes.
- Keep `.agents/skills/**` changes separate from product-code changes under `app/**`, `components/**`, `lib/**`, `scripts/**`, or `supabase/**`.
- Use the existing Recora skill stack for strategy, implementation architecture, specialist analysis, and recommendation quality gates.

## Codex App startup

- New work should start from the ChatGPT project `recora-main`, start mode `New Worktree`, environment `recora-main-local`, and base branch `master`.
- Do not use the old `recora` / `recora_2` projects or OneDrive-derived Recora worktrees for new work.
- Before editing, staging, committing, or pushing, run `git fetch origin` and report the repo root, `git-common-dir`, current branch or detached `HEAD`, short `HEAD`, short `origin/master`, and dirty state.
- If `git-common-dir` points to OneDrive, stop and report it in Japanese.
- If a Codex-managed worktree starts in detached `HEAD`, continue only when `HEAD == origin/master` and the working tree is clean, then create a task branch before editing. If detached `HEAD` differs from `origin/master`, or the tree is dirty, stop and ask for direction.
- If `master` is older than `origin/master`, stop and ask for direction before editing.
- For project setup or measurement-design tasks, do not touch LP, Auth, or handoff areas, including `_handoff/**`, `app/auth/**`, `app/login/**`, `app/signup/**`, `app/forgot-password/**`, `middleware.ts`, `lib/supabase/**`, `lib/recora/auth-access.ts`, `components/recora/lp/**`, `components/recora/brand/**`, or `public/**`.

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

## Git safety

- Do not run `reset`, `clean`, branch deletion, worktree deletion, or `stash drop` without explicit human confirmation.
- When using stash, inspect and preserve entries; do not delete stash entries without human confirmation.
- In PowerShell, quote stash refs such as `"stash@{0}"`.
- Stage only the explicitly intended files. Do not use `git add .` or broad staging commands.
