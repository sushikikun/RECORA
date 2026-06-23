# Recora Phase 1 Admin Measurement Cycle

Last updated: 2026-06-22

This runbook defines the plan-only operating cycle after a Phase 1 customer project has been bootstrapped. It is for administrator planning and review before any OpenAI measurement or database write happens.

The Phase 1 operator command is internal-operator-only. Do not expose it to customers, make it a broadly clickable admin UI action, or add public sample client JSON. Build each input JSON for the specific engagement and keep it in `tmp/` or another untracked operator path.

Phase 1 remains administrator-operated:

1. Review the bootstrapped customer project.
2. Review the prompt taxonomy.
3. Plan OpenAI measurement.
4. Plan aggregate and metric snapshot generation.
5. Plan recommendation candidate generation.
6. Review recommendations.
7. Check report readiness.
8. Share the prepared report URL only after the ready gate passes.

This document does not introduce self-serve measurement, Stripe, billing, customer-run jobs, schema changes, or migration work.

## Hard Safety Rules

- Do not run OpenAI measurement during planning.
- Do not connect to production DB during planning.
- Do not write to any DB during planning.
- Do not paste or print `.env`, API keys, database URLs, service role keys, or credentials.
- Do not use demo, local, seed, sample, or placeholder data as a customer report workaround.
- Do not change schema, migrations, `package.json`, or `package-lock.json` for this cycle.
- Do not run write-capable scripts until a human has approved the exact target and command.

## Plan-Only Script

Use `scripts/plan-recora-report-cycle.ts` to produce a measurement cycle plan. The script reads only the supplied JSON file, validates it, and prints a plan. It does not connect to Supabase, Postgres, OpenAI, or any remote service. It does not spawn child processes. It does not write output files.

Print a safe sample:

```powershell
npx tsx scripts/plan-recora-report-cycle.ts --print-sample
```

Run against a local planning JSON file:

```powershell
npx tsx scripts/plan-recora-report-cycle.ts --input .\tmp\recora-report-cycle-plan.json
```

The script intentionally has no `--execute` flag. Unknown CLI arguments are rejected.

## Input Contract

The planning JSON should contain:

- `projectSlug`: the customer project slug.
- `organization`: customer data boundary fields.
- `measurementProfileId`: an existing Recora measurement profile such as `small-v01` or `standard-v01`.
- `promptSetVersion`: the prompt taxonomy version. This is not a metric version.
- `searchMode`: `no-search`, `web-search`, or `both`.
- `models`: model names planned by the administrator. The current measurement runner does not accept a `--model` CLI flag, so this is planning metadata only.
- `promptInventory.total`: total prompts in the selected prompt set.
- `promptInventory.nonBranded`: prompts eligible for AI visibility, ranking, Share of Voice, and competitor gap.
- `promptInventory.branded`: prompts used for brand perception or sentiment review.
- `promptInventory.citationCheck`: prompts used for citation/source evidence review.
- `expectedAnswersPerPrompt`: `1` for `no-search` or `web-search`, `2` for `both`.
- `recommendationReviewRequired`: normally `true` for customer reports.
- `reportPath`: the dashboard report path, for example `/dashboard/reports/example-client-ai-search`.
- Optional artifact fields: `sourceMeasurementRunId`, `aggregateRunId`, `metricSnapshotCount`, `validObservationCount`, `recommendationCandidatePath`, `recommendationCandidateCount`, `customerVisibleRecommendationCount`, and `reportReadyGateStatus`.

Do not include connection strings, API keys, tokens, passwords, service role values, or `.env` values in the input. The script rejects known secret and connection-related field names.

## Customer Data Boundary

A bootstrapped project can be treated as Phase 1 `customer_data` only when the administrator has confirmed:

- `organization_type=client`
- `data_environment=production`
- `is_internal=false`
- `is_demo=false`

These fields are necessary but not sufficient for `customer_ready`. A customer report still requires a completed OpenAI measurement run, an aggregate run, metric snapshots, valid observations, reviewed recommendation publication state, and the report ready gate.

## Prompt Taxonomy

Use prompt types consistently:

- `non_branded`: AI visibility, ranking, Share of Voice, average position, and competitor gap.
- `branded`: brand impression, sentiment, reputation, and "how does AI describe us?" review.
- `citation_check`: source and citation evidence review.

Do not mix branded prompts into visibility, ranking, Share of Voice, or competitor gap metrics. Do not treat citation occurrence counts as ranking evidence.

## Measurement Profile And Prompt Set Version

`measurementProfileId` selects the existing measurement profile. The plan script checks it against the local profile definitions.

`promptSetVersion` identifies the prompt taxonomy used for this customer cycle. It should not be used as a metric version and should not be inferred from metric snapshot metadata.

## Stages

The plan script prints these ordered stages:

- `bootstrap_review`: confirm the customer project is not demo/local/sample data.
- `prompt_taxonomy_review`: confirm prompt categories and metric eligibility.
- `measurement_preflight`: confirm profile, prompt set version, search mode, expected answer count, and administrator approval.
- `measurement_execution`: plan the OpenAI measurement command, but do not run it.
- `aggregate_generation`: plan metric snapshot dry-run and later apply.
- `metric_snapshot_validation`: confirm aggregate id, metric snapshots, and valid observations.
- `recommendation_generation`: plan candidate generation after measurement and aggregate ids exist.
- `recommendation_review`: review candidate quality and publication state before customer display.
- `report_ready_check`: confirm the ready gate can be checked without leaking administrator diagnostics.
- `customer_url_share`: share only when the report ready gate is `customer_ready`.

Each stage includes:

- `status`: `blocked`, `ready_for_manual_execution`, or `pending_review`.
- prerequisites.
- planned command when a command exists.
- expected output.
- blocking conditions.
- whether administrator approval is required.

## Existing Script Mapping

The plan-only script references existing commands but never runs them:

- Measurement: `scripts/run-openai-measurement.ts`
- Cycle orchestrator reference: `scripts/run-recora-report-cycle.ts`
- Metric snapshot aggregate: `scripts/recalculate-metric-snapshots.ts`
- Recommendation candidate generation: `scripts/generate-recommendation-candidates.ts`
- Recommendation dry-run/save: `scripts/save-recommendation-candidates.ts`
- Dashboard read model check: `npm run recora:dashboard-read-model:check`

`scripts/run-recora-report-cycle.ts --plan` is still an existing operator tool, but it can write a manifest and inspect DB target configuration. For this planning step, prefer `scripts/plan-recora-report-cycle.ts` because it does not connect to DB, does not call OpenAI, does not spawn child scripts, and does not write files.

## Canonical Operator Sequence

For a client config, use the wrapper entry point first. It reuses the existing bootstrap and report-cycle scripts and prints one final operator summary.

Dry-run:

```powershell
npm run recora:phase1:operator -- --client-config .\tmp\client-project.json
```

This default dry-run renders the client bootstrap plan with `--skip-existing-slug-check` and does not connect to the DB, write a report-cycle manifest, or run OpenAI.

Approved local execution after a completed OpenAI measurement run already exists:

```powershell
npm run recora:phase1:operator -- --client-config .\tmp\client-project.json --execute-local --skip-bootstrap --customer-data-boundary-confirmed --measurement-run-id <completed-openai-measurement-run-id> --apply-aggregate --generate-recommendations --expected-db-host 127.0.0.1
```

Approved local execution that also runs OpenAI measurement:

```powershell
npm run recora:phase1:operator -- --client-config .\tmp\client-project.json --execute-local --execute-measurement --confirm-measurement-execution run-openai:<project-slug> --profile small-v01 --apply-aggregate --generate-recommendations --expected-db-host 127.0.0.1
```

The final `operatorSummary` includes:

- `projectSlug`
- `measurementRunId`
- `aggregateStatus`
- `recommendationStatus`
- `reportReadyStatus`
- `reportUrl`
- `remainingBlockers`

`reportReadyStatus` is calculated with the centralized report ready gate in `lib/recora/report-eligibility.ts`. If `remainingBlockers` is not empty, stop before sharing the URL.

## Approval Gates

Do not proceed to the next stage when:

- the project is not confirmed as `customer_data`.
- prompt taxonomy has unclassified or mixed-use prompts.
- `measurementProfileId` is unknown.
- `promptSetVersion` is missing or confused with metric version.
- expected answer count does not match search mode.
- OpenAI measurement cost/model approval is missing.
- a completed OpenAI measurement run id is missing.
- aggregate id, metric snapshots, or valid observation counts are missing.
- recommendation candidates have not passed review.
- no recommendation is safe for customer display when the report needs recommendations.
- the report ready gate is not `customer_ready`.

## URL Sharing Checklist

Before sending the report URL to a customer:

- The project slug is correct.
- The report path points to the customer project, not demo/local/sample data.
- The report ready gate is `customer_ready`.
- Metric snapshots are derived from the intended completed OpenAI measurement run.
- Valid observation count is greater than zero.
- Visibility/ranking/Share of Voice metrics exclude branded prompts.
- Citation/source sections do not overstate unreviewed evidence.
- Recommendations marked `customer_visible` have passed administrator review.
- The customer-facing page does not show internal reason codes, run ids, diagnostic notes, secrets, or DB configuration.

## Failure Handling

If any stage is `blocked`, stop the cycle and fix the blocker before moving forward. Do not run later scripts to "see what happens." Phase 1 customer reports should fail closed until the required evidence and review state exist.
