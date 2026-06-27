# Recora Codex Operating Workflow

Last updated: 2026-06-27

This document describes the project-scoped Codex operating layer for Recora. It complements `docs/recora-dev-workflow.md`; it does not replace the existing database, measurement, commit, or deployment procedures.

## Standard Codex App workspace

New Codex App work should use this starting point:

- ChatGPT project: `recora-main`
- Start mode: `New Worktree`
- Environment: `recora-main-local`
- Base branch: `master`
- Task branch: `codex/<short-task-name>`

Do not start new work from old `recora` / `recora_2` ChatGPT projects or from OneDrive-derived Recora worktrees.

Before editing, staging, committing, or pushing, Codex must fetch and report the current Git state:

```powershell
git fetch origin
git rev-parse --show-toplevel
git rev-parse --git-common-dir
git branch --show-current
git rev-parse --short HEAD
git rev-parse --short origin/master
git status --short --untracked-files=all
```

Decision rules:

- If `git-common-dir` points to OneDrive, stop and report that in Japanese.
- If the worktree is on `master` and `HEAD == origin/master` with a clean tree, create the task branch before editing.
- If a Codex-managed worktree is in detached `HEAD` and `HEAD == origin/master` with a clean tree, create the task branch before editing and continue.
- If detached `HEAD` differs from `origin/master`, or the tree is dirty, stop and ask for direction.
- If local `master` is older than `origin/master`, stop and ask whether to update, recreate the worktree, or choose another base.
- If there are uncommitted changes that were not explicitly assigned to the current task, stop or isolate them before editing.

## Architecture

```text
Parent Codex session
髫ｨ荵励飴隶鯉ｽｳ /plan -> /goal -> /review
髫ｨ荵励飴隶鯉ｽｳ recora_mapper
髫ｨ荵励飴隶鯉ｽｳ recora_db_auditor
髫ｨ荵励飴隶鯉ｽｳ recora_docs_researcher
髫ｨ荵励飴隶鯉ｽｳ recora_ui_verifier
髫ｨ荵励飴隶鯉ｽｳ recora_implementation_worker
髫ｨ荵怜繭隶鯉ｽｳ recora_reviewer
```

Project integrations:

- `openai_docs`: official OpenAI product documentation.
- `context7`: current framework and package documentation.
- `supabase_recora_ro`: Recora Supabase project, project-scoped and read-only.
- `playwright`: browser inspection and repeatable UI verification.
- Codex Security plugin: security scan and finding triage, installed locally through `/plugins`.

The existing `.agents/skills/**` stack remains the source of specialist product, GEO, prompt, citation, competitor, schema, copy, design, implementation-architecture, and recommendation-quality guidance.

## First local activation

Run after applying the operating layer:

```powershell
cd "$env:USERPROFILE\work\recora"
codex --version
codex features enable goals
codex mcp login supabase_recora_ro
npx -y playwright@latest install chromium
codex
```

Inside Codex:

```text
/status
/mcp
/hooks
/plugins
```

Expected MCP entries:

```text
openai_docs
context7
supabase_recora_ro
playwright
```

Review and trust the project hooks through `/hooks`. Open `/plugins`, install Codex Security, and begin a new thread after installation.

## Standard implementation flow

```text
/plan

For the requested Recora change:
1. Read AGENTS.md and docs/recora-dev-workflow.md.
2. Spawn recora_mapper, recora_db_auditor, recora_docs_researcher, and recora_ui_verifier in parallel where relevant.
3. Wait for all evidence and consolidate one implementation plan.
4. Give the approved scope to recora_implementation_worker.
5. Run task-specific validation plus Recora preflight.
6. Re-run recora_ui_verifier for browser-visible changes.
7. Spawn recora_reviewer for an independent final review.
8. Fix confirmed findings and stop before commit.
```

Then:

```text
/goal Complete the approved Recora task from evidence collection through independently reviewed implementation. Use the named Recora agents for their assigned lanes, preserve unrelated changes, run all required validation, and stop before commit.
```

Finish with:

```text
/review
```

## Protected areas for setup and measurement tasks

Project setup, client configuration, prompt planning, and measurement-design tasks must not modify LP, Auth, or handoff surfaces unless the user explicitly scopes that work.

Protected paths include:

```text
_handoff/**
app/auth/**
app/login/**
app/signup/**
app/forgot-password/**
middleware.ts
lib/supabase/**
lib/recora/auth-access.ts
components/recora/lp/**
components/recora/brand/**
public/**
```

## Hooks

SessionStart injects the latest commit and working-tree status using safe `git` inspection commands. It does not run repository-controlled package scripts automatically.

When the working tree is dirty, Stop runs only safe `git` inspection commands:

```powershell
git status --short
git diff --check
```

A failed git inspection blocks task completion and returns the confirmed output to Codex. Runtime, UI, report, API, and deployment tasks must still run package-script validation manually, including `npm run recora:preflight:full`, `npm run lint`, and `npm run build` where required.

## Supabase

The read-only MCP is scoped to:

```text
project_ref = xcobkidvqjldquzqhebi
features = database,docs
```

Use it for schema, RLS, policies, helper functions, logs, advisors, measurement runs, metric snapshots, and report-readiness inspection.

The initial live audit found one Security Advisor warning:

```text
function_search_path_mutable: public.set_updated_at
```

That database change is intentionally separate from this operating layer and should be implemented as a dedicated migration task.

## Playwright verification

Start Recora:

```powershell
npm run dev
```

Verify at least:

```text
/dashboard
/dashboard/reports/<project-slug>
/dashboard/reports/<project-slug>/leaderboard
/dashboard/reports/<project-slug>/conversations
/dashboard/reports/<project-slug>/sources
/dashboard/reports/<project-slug>/recommendations
```

Capture route, viewport, steps, visible result, console errors, failed requests, and screenshot references.

## Worktrees

The standard Codex App starting point is `recora-main` with `New Worktree`, `recora-main-local`, and `master`. Codex App worktrees may live outside `$env:USERPROFILE\work\recora`, so Recora dev checks allow them only when the directory is a Git repo with the expected Recora repo signals; path, env, secret, and OneDrive warnings still run.

Every new Codex task should create a task branch before edits. If the worktree opens in detached `HEAD`, it is acceptable only when `HEAD == origin/master` and the tree is clean; create the task branch immediately, then continue.

Use one worktree per independently reviewable lane:

```text
worktree A: product implementation
worktree B: Supabase and RLS audit
worktree C: browser regression verification
worktree D: security findings
```

## Automation templates

Daily health:

```text
Run npm run recora:preflight:full and git diff --check. Inspect newly failing checks and high-risk path changes. Do not edit files. Create an inbox item only for actionable findings.
```

Weekly Supabase audit:

```text
Use supabase_recora_ro. Review schema drift, RLS, tenant boundaries, Security and Performance Advisors, failed measurement runs, report readiness, and recommendation publication states. Do not write to the database.
```

Weekly UI smoke:

```text
Start Recora and use Playwright to verify the dashboard and all report tabs. Report broken navigation, console errors, failed requests, empty-state regressions, and viewport-specific layout failures.
```

Weekly security review:

```text
Use Codex Security to review changes since the previous scan. Verify and classify findings, then create separate remediation tasks for confirmed issues.
```

## Vercel

After confirming the Recora Vercel team and project slugs:

```powershell
codex mcp add vercel_recora --url "https://mcp.vercel.com/<team-slug>/<project-slug>"
codex mcp login vercel_recora
```

Use it for deployment status, preview URLs, runtime logs, and post-deploy smoke checks.

## Stash and destructive Git safety

Stash handling:

- Prefer preserving stash entries and asking the human which entry to inspect or apply.
- Do not run `stash drop` or otherwise delete stash entries without explicit human confirmation.
- In PowerShell, quote stash refs such as `"stash@{0}"`.

Destructive or history-changing operations require explicit human confirmation before execution:

```text
git reset
git clean
git branch -d / -D
git worktree remove
git stash drop
```

## Commit procedure

```powershell
npm run recora:commit-check
git diff --cached --name-only
```

Keep the operating layer separate from product code, Skills, migrations, and database fixes.
