# Recora Codex Operating Rules

This repository is the Recora product repository. Read `docs/recora-agentic-sdlc.md`, `docs/README.md`, `docs/recora-dev-workflow.md`, and `.agents/skills/RECORA-SKILL-STACK.md` before changing code.

For customer reporting, measurement operations, publication, admin operations, contracts, queues, or post-launch data architecture, also read `docs/recora-post-launch-operations-architecture.md`. It is the canonical post-launch operations architecture and takes precedence over Phase 1 runbooks when they conflict.

## Task start gate

- Read the task Issue and every source document it designates before editing.
- For Full Spec work, or when the Issue requires an Exec Plan, read the linked plan before editing and keep it updated through handoff; stop if a required plan is missing.
- Confirm and report the Issue number, Risk, Execution, Spec level, Approval, and `Ready` state.
- Do not edit when the task is not `Ready`, a required field is missing, a dependency is blocked, or the local start conditions below are not satisfied.
- For R2 work, obtain human approval of the plan and a separate explicit approval before implementation or write-capable execution.
- For R3 work, stop after research, planning, read-only inspection, or an explicitly approved dry-run until the exact production or privileged operation is individually approved.
- Treat `docs/recora-agentic-sdlc.md` as the source of truth for lifecycle states, risk classification, execution lanes, specification levels, and approval gates.

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

## Post-launch operations architecture

- Treat `docs/recora-post-launch-operations-architecture.md` as the source of truth for customer publication, measurement evidence, operational control, admin actions, queues, and auditability.
- Phase 1 admin-demo runbooks are transitional operating instructions, not the target post-launch architecture.
- Customer-facing routes must read the current published report version, not the latest measurement or aggregate run.
- Do not let customer-facing code read raw `measurement`, internal `control`, or `audit` data directly.
- Preserve the previously published healthy report when a newer measurement, aggregate, validation, or publication cycle fails.
- Keep `ready`, `approved`, and `published` as distinct states.
- Treat published report versions as immutable. Corrections require a new version and an explicit pointer switch.
- Do not add new publication, approval, or quality states only inside metadata. Use formal columns and keep legacy metadata as migration compatibility only.
- New measurement architecture must be provider-neutral. Do not extend OpenAI-only readiness logic as the long-term model.
- A report must not pass completeness or metric-validity gates merely because one valid observation or one metric snapshot exists.
- Preserve prompt-type eligibility: branded prompts do not feed visibility, ranking, Share of Voice, average position, or competitor-gap metrics.
- Cron should enqueue work; long-running provider measurement belongs in queue workers with retry and idempotency controls.
- Important admin actions, reruns, approvals, publication changes, permission changes, and subscription changes require audit events.
- Never expose a Supabase service role or secret key to customer or admin browser code.
- Start schema migration additively and keep legacy read paths until the publication-based customer path is verified.

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

At handoff, report acceptance-criteria coverage, the exact validations run and their results, unverified items, and residual risks.

Use `npm run recora:commit-check` before committing. Codex must not push unless the task explicitly authorizes it.

## Git safety

- Do not run `reset`, `clean`, branch deletion, worktree deletion, or `stash drop` without explicit human confirmation.
- When using stash, inspect and preserve entries; do not delete stash entries without human confirmation.
- In PowerShell, quote stash refs such as `"stash@{0}"`.
- Stage only the explicitly intended files. Do not use `git add .` or broad staging commands.
