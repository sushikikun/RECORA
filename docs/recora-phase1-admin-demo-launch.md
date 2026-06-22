# Recora Phase 1 Admin Demo Launch Runbook

Last updated: 2026-06-22

This runbook defines the Phase 1 operating model for launching Recora as an administrator-operated demo service.

## Scope

Phase 1 is not self-serve SaaS.

The intended workflow is:

1. An administrator registers a customer project.
2. An administrator prepares brands, competitors, personas, topics, and prompts.
3. An administrator runs measurement, aggregate, and recommendation generation.
4. An administrator reviews whether the report is ready.
5. The customer receives a prepared report URL.

Phase 1 does not include Stripe, billing, customer self-registration, a full authentication UI, customer-run measurement, or self-serve prompt editing.

## Do

- Keep customer setup and measurement as explicit administrator operations.
- Use dry-run commands before any write-capable command.
- Keep project slug, measurement profile, prompt set version, run id, and aggregate id visible in operator notes.
- Use OpenAI measurement data only when the run metadata identifies it as `data_source=openai_measurement`.
- Use aggregate runs only when the run is completed and identifies `run_kind=aggregate`.
- Treat metric snapshots as derived read-model rows, not raw observations.
- Treat citation rows, citation occurrences, unique URLs, and unique domains as separate concepts.
- Treat recommendation candidates as drafts until reviewed.
- Keep source freshness and source-to-claim status separate from citation occurrence counts.

## Do Not

- Do not run OpenAI measurement from a customer-facing UI.
- Do not write to production DB without an explicit operator-approved command.
- Do not show `.env`, API keys, database URLs, service role keys, or credentials.
- Do not commit secrets, env backups, raw provider payload dumps, or credential-bearing logs.
- Do not change schema or migrations as part of Phase 1 P0 work.
- Do not use service role fallback for dashboard reads.
- Do not expose placeholder, seed, example, demo, or local-only data as if it were a customer report.
- Do not present recommendations as approved measures, guaranteed outcomes, or completed work.

## Customer Project Setup

Use a dedicated administrator workflow for each customer project.

Minimum project inputs:

- organization name and organization slug.
- project slug and display name.
- primary brand name, domain, and aliases.
- competitor brand names, domains, and aliases.
- personas or buyer roles.
- topics.
- prompts mapped to topics and personas.
- intended region and language.
- measurement profile id.
- prompt set version or operator note.

For Phase 1, if a generic customer bootstrap script is unavailable, create the project with the existing guarded scripts only after reviewing a dry-run plan. Do not reuse `mieruca-seo-demo` or other demo slugs for real customer data unless the data is explicitly safe to publish as demo/local data.

## Dry-Run Check

Before any write-capable operation:

```powershell
npm run recora:whereami
npm run recora:before-codex
```

For write-capable scripts, use their dry-run or plan mode first. Confirm:

- target project slug.
- target DB host, without printing credentials.
- expected measurement profile.
- prompt count and expected run item count.
- whether the command is read-only, dry-run, or write-capable.
- whether the command can call OpenAI.

If the command can write to a non-local DB, stop unless the operator has explicitly approved the exact command, target project slug, DB host, and confirmation flag.

## Measurement Run Preconditions

Before running measurement:

- The project exists.
- The primary brand and competitors are registered.
- Prompts are active and mapped to topics.
- The measurement profile is known.
- The prompt set is suitable for Phase 1 reporting.
- The operator has confirmed whether the run will call OpenAI.

Prompt eligibility should be treated as follows until schema support exists:

- `non_branded`, `problem_solution`, `alternative_search`, and eligible `competitor_comparison` prompts can feed AI visibility and ranking metrics.
- `branded` or brand-included prompts are sentiment / brand perception only.
- `citation_check` prompts are source evidence prompts unless they naturally ask for candidate lists or comparable recommendations.
- Branded prompts must not be mixed into AI visibility rate, ranking, Share of Voice, average position, or competitor gap.
- If the current schema cannot safely separate non-branded prompts, do not fall back to all observations for ranking metrics. Treat the metric scope as not ready or 0 eligible observations until the prompt set is reviewed.

If prompt type and metric eligibility are not available in structured metadata, document the prompt set version and limitation in operator notes.

## Aggregate Generation

After measurement completes:

1. Confirm the measurement run is completed.
2. Confirm it is OpenAI measurement data.
3. Generate or recalculate the aggregate run in dry-run mode first.
4. Apply the aggregate only with the approved guarded command.
5. Confirm the aggregate run metadata includes the source measurement run id.

The aggregate is a derived reporting layer. It must not be treated as raw observation evidence.

## Metric Snapshot Check

Before sharing a report:

- Confirm metric snapshots exist for the latest aggregate run.
- Confirm project or primary brand snapshots are present.
- Confirm snapshot values are described as derived metrics.
- Confirm average position and Share of Voice are shown only for eligible measurement scopes.
- Confirm any small-sample warning remains visible when sample size is limited.

If metric snapshots are missing, the report is not customer-ready.

## Recommendation Candidate Generation

Recommendation generation produces candidates, not approved customer actions.

The candidate output should preserve:

- source measurement run id.
- aggregate run id when available.
- measurement profile id.
- candidate id.
- evidence counts.
- citation/source evidence when used.
- confidence.
- quality-gate fields when reviewed.
- display policy fields.

Candidates generated with `review_required`, `pre_quality_gate`, or `candidate_only` status are administrator review material.

## Recommendation Review

Use the quality-gate policy before showing recommendations to a customer.

Recommended Phase 1 display states:

- `customer_visible`: reviewed and safe for customer display.
- `review_required`: useful draft, but not a customer-facing recommendation yet.
- `pre_quality_gate`: generated candidate without completed review.
- `candidate_only`: internal candidate kept for administrator review.
- `hidden_internal`: suppressed, rejected, seed/example, or otherwise unsafe for customer display.

With the current schema, these states may be represented through existing `metadata` fields. An explicit `publication_state` takes priority over legacy display metadata. `auto_publish + display_decision=show` is a legacy customer-visible fallback only when no explicit publication state exists. `display_decision=show` alone is not enough.

## Report Ready Check

A report can be treated as `customer_ready` only when all of these are true:

- project slug resolves to a project.
- latest reporting run exists.
- latest reporting run is completed.
- latest reporting run is an OpenAI aggregate run.
- source measurement run id is known.
- metric snapshots exist.
- at least one valid observation is available.
- seed/example placeholders are not used as customer evidence.
- measurement profile or prompt set version is identifiable.
- recommendations shown to the customer are reviewed and customer-visible, or the UI clearly shows that no customer-visible recommendation is ready.

If any condition fails, the customer UI should show a safe preparation state rather than placeholder data.

The customer route is fail-closed: only `customer_ready` can render the report. `not_ready`, `admin_diagnostic`, missing gate data, unknown data origin, or demo/local/sample origin must render a generic preparation state without project slug, reason codes, metric snapshot counts, or valid observation counts.

## Customer URL Checklist

Before sharing the report URL:

- Run the report ready check.
- Open the report URL locally or in the target deployment.
- Confirm the project name, reporting period, and updated timestamp.
- Confirm the report is based on the intended project slug.
- Confirm no demo/sample/placeholder data appears as customer evidence.
- Confirm recommendations are not presented as approved implementation or guaranteed outcomes.
- Confirm source freshness and source-to-claim review status are not overstated.
- Confirm no raw provider payload, internal run diagnostics, API cost, credentials, or stack traces are visible.

## Demo, Local, Sample, And Customer Data Boundary

- Demo data is for public examples and internal explanation.
- Local data is for development only.
- Sample data is UI-only placeholder material and must not be used as customer evidence.
- Real customer data must use a dedicated project slug and organization context.
- Do not mix demo/local/sample rows into customer-facing read models.
- Do not use `is_demo=true` as a shortcut for confidential customer data unless the customer has approved that publishing model.

## Operator Verification

Recommended checks after Phase 1 P0 changes:

```powershell
npm run recora:preflight
npm run recora:dashboard-read-model:check
npm run lint
npm run build
git diff --check
git status --short --untracked-files=all -- . ':(exclude).agents/skills/**'
```

## Notes For Future Phases

Phase 1 intentionally avoids new schema. Later phases should consider first-class tables or fields for report snapshots, share tokens, prompt type, metric eligibility, prompt set versions, quality-gate review history, and customer-facing publication state.
