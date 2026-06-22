import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { evaluateRecoraReportReadyGate } from "../lib/recora/report-eligibility";

type JsonRecord = Record<string, unknown>;
type MeasurementSearchMode = "no-search" | "web-search" | "both";
type AggregateSearchMode = "combined" | "no-search" | "web-search" | "both";

type Options = {
  clientConfigPath: string | null;
  executeLocal: boolean;
  skipBootstrap: boolean;
  customerDataBoundaryConfirmed: boolean;
  measurementRunId: string | null;
  executeMeasurement: boolean;
  confirmMeasurementExecution: string | null;
  promptLimit: number | null;
  profileId: string | null;
  measurementSearchMode: MeasurementSearchMode;
  aggregateSearchMode: AggregateSearchMode;
  applyAggregate: boolean;
  generateRecommendations: boolean;
  applyRecommendations: boolean;
  expectedDbHost: string | null;
  outputDir: string | null;
};

type ChildCommand = {
  label: string;
  executable: string;
  args: string[];
  displayCommand: string[];
};

type CommandResult = {
  command: ChildCommand;
  stdout: string;
  output: JsonRecord | null;
};

const DEFAULT_MEASUREMENT_SEARCH_MODE: MeasurementSearchMode = "both";
const DEFAULT_AGGREGATE_SEARCH_MODE: AggregateSearchMode = "combined";
const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const MEASUREMENT_CONFIRM_PREFIX = "run-openai:";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.clientConfigPath) {
    throw new Error("Missing --client-config <json>. Use prepare-recora-client-project.ts --print-sample for the config shape.");
  }

  const clientConfig = await readClientConfig(options.clientConfigPath);
  const projectSlug = getProjectSlug(clientConfig);
  validateOptions(options, projectSlug);
  assertExpectedDbHostMatches(options.expectedDbHost);

  const plannedOperations = buildPlannedOperations(options, projectSlug);
  if (options.executeLocal) {
    logOperatorEvent("planned_operations_before_write", { projectSlug, plannedOperations });
  }

  const bootstrapCommand = options.skipBootstrap
    ? null
    : buildScriptCommand(
        "client bootstrap",
        "scripts/prepare-recora-client-project.ts",
        [
          "--input",
          options.clientConfigPath,
          options.executeLocal ? "--execute" : "--dry-run",
          ...(!options.executeLocal ? ["--skip-existing-slug-check"] : [])
        ]
      );
  const bootstrapResult = bootstrapCommand ? await runCommand(bootstrapCommand, { parseJson: !options.executeLocal }) : null;

  let reportCycleResult: CommandResult | null = null;
  const shouldRunReportCycle = options.executeLocal;
  if (shouldRunReportCycle) {
    const reportCycleCommand = buildReportCycleCommand(options, projectSlug);
    reportCycleResult = await runCommand(reportCycleCommand, { parseJson: true });
  }

  const manifest = reportCycleResult?.output ?? null;
  const operatorSummary = buildOperatorSummary({
    projectSlug,
    options,
    manifest,
    bootstrapExecuted: Boolean(bootstrapCommand && options.executeLocal),
    plannedOperations
  });

  printJson({
    mode: options.executeLocal ? "execute-local" : "dry-run",
    projectSlug,
    clientConfig: relativeForDisplay(path.resolve(options.clientConfigPath)),
    bootstrap: bootstrapResult
      ? {
          status: "completed",
          command: formatCommand(bootstrapResult.command.displayCommand),
          preview: bootstrapResult.output
        }
      : {
          status: options.skipBootstrap ? "skipped" : "not_run",
          command: bootstrapCommand ? formatCommand(bootstrapCommand.displayCommand) : null,
          preview: null
        },
    plannedOperations,
    reportCycle: reportCycleResult
      ? {
          status: "completed",
          command: formatCommand(reportCycleResult.command.displayCommand),
          manifestPath: getString(manifest, "manifestPath"),
          manifest
        }
      : {
          status: "not_run",
          command: formatCommand(buildReportCycleCommand(options, projectSlug).displayCommand),
          manifestPath: null,
          manifest: null
        },
    operatorSummary,
    safety: {
      dryRunDefault: true,
      localExecutionCheckpoint: "--execute-local",
      bootstrapWritesLocalOnly: true,
      realMeasurementCheckpoint: `--execute-measurement --confirm-measurement-execution ${MEASUREMENT_CONFIRM_PREFIX}${projectSlug}`,
      nonLocalWrites: "Use the child report-cycle write guard flags only after a separate operator checkpoint.",
      secretsPrinted: false
    }
  });
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    clientConfigPath: null,
    executeLocal: false,
    skipBootstrap: false,
    customerDataBoundaryConfirmed: false,
    measurementRunId: null,
    executeMeasurement: false,
    confirmMeasurementExecution: null,
    promptLimit: null,
    profileId: null,
    measurementSearchMode: DEFAULT_MEASUREMENT_SEARCH_MODE,
    aggregateSearchMode: DEFAULT_AGGREGATE_SEARCH_MODE,
    applyAggregate: false,
    generateRecommendations: false,
    applyRecommendations: false,
    expectedDbHost: null,
    outputDir: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--client-config" && next) {
      options.clientConfigPath = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--client-config=")) {
      options.clientConfigPath = arg.slice("--client-config=".length);
      continue;
    }
    if (arg === "--execute-local") {
      options.executeLocal = true;
      continue;
    }
    if (arg === "--skip-bootstrap") {
      options.skipBootstrap = true;
      continue;
    }
    if (arg === "--customer-data-boundary-confirmed") {
      options.customerDataBoundaryConfirmed = true;
      continue;
    }
    if (arg === "--measurement-run-id" && next) {
      options.measurementRunId = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--measurement-run-id=")) {
      options.measurementRunId = arg.slice("--measurement-run-id=".length);
      continue;
    }
    if (arg === "--execute-measurement") {
      options.executeMeasurement = true;
      continue;
    }
    if (arg === "--confirm-measurement-execution" && next) {
      options.confirmMeasurementExecution = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--confirm-measurement-execution=")) {
      options.confirmMeasurementExecution = arg.slice("--confirm-measurement-execution=".length);
      continue;
    }
    if (arg === "--prompt-limit" && next) {
      options.promptLimit = parsePositiveInteger(next, "--prompt-limit");
      index += 1;
      continue;
    }
    if (arg.startsWith("--prompt-limit=")) {
      options.promptLimit = parsePositiveInteger(arg.slice("--prompt-limit=".length), "--prompt-limit");
      continue;
    }
    if (arg === "--profile" && next) {
      options.profileId = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--profile=")) {
      options.profileId = arg.slice("--profile=".length);
      continue;
    }
    if (arg === "--search-mode" && next) {
      options.measurementSearchMode = parseMeasurementSearchMode(next);
      index += 1;
      continue;
    }
    if (arg.startsWith("--search-mode=")) {
      options.measurementSearchMode = parseMeasurementSearchMode(arg.slice("--search-mode=".length));
      continue;
    }
    if (arg === "--aggregate-search-mode" && next) {
      options.aggregateSearchMode = parseAggregateSearchMode(next);
      index += 1;
      continue;
    }
    if (arg.startsWith("--aggregate-search-mode=")) {
      options.aggregateSearchMode = parseAggregateSearchMode(arg.slice("--aggregate-search-mode=".length));
      continue;
    }
    if (arg === "--apply-aggregate") {
      options.applyAggregate = true;
      continue;
    }
    if (arg === "--generate-recommendations") {
      options.generateRecommendations = true;
      continue;
    }
    if (arg === "--apply-recommendations") {
      options.applyRecommendations = true;
      continue;
    }
    if (arg === "--expected-db-host" && next) {
      options.expectedDbHost = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--expected-db-host=")) {
      options.expectedDbHost = arg.slice("--expected-db-host=".length);
      continue;
    }
    if (arg === "--output-dir" && next) {
      options.outputDir = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg.startsWith("--output-dir=")) {
      options.outputDir = path.resolve(arg.slice("--output-dir=".length));
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function validateOptions(options: Options, projectSlug: string) {
  if (options.measurementRunId && options.executeMeasurement) {
    throw new Error("--measurement-run-id and --execute-measurement cannot be used together.");
  }
  if (options.profileId && options.promptLimit) {
    throw new Error("--profile and --prompt-limit cannot be used together.");
  }
  if (options.applyRecommendations && !options.generateRecommendations) {
    throw new Error("--apply-recommendations requires --generate-recommendations.");
  }
  if (options.executeLocal && options.measurementRunId && !options.skipBootstrap) {
    throw new Error(
      "Existing measurement run flow requires --skip-bootstrap because client bootstrap refuses existing organization/project slugs."
    );
  }
  if (options.executeMeasurement) {
    const expected = `${MEASUREMENT_CONFIRM_PREFIX}${projectSlug}`;
    if (options.confirmMeasurementExecution !== expected) {
      throw new Error(`Real measurement requires --confirm-measurement-execution ${expected}.`);
    }
  }
  if (!options.executeLocal && (options.applyAggregate || options.applyRecommendations || options.executeMeasurement)) {
    logOperatorEvent("dry_run_checkpoint", {
      note: "Write-capable or real-measurement flags were supplied without --execute-local. This run will only print the plan."
    });
  }
}

function assertExpectedDbHostMatches(expectedHost: string | null) {
  if (!expectedHost) return;
  const normalizedExpectedHost = normalizeExpectedDbHost(expectedHost);
  const databaseUrl = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("RECORA_DATABASE_URL is not a valid PostgreSQL URL.");
  }
  const actualHost = parsed.hostname.trim().toLowerCase();
  if (actualHost !== normalizedExpectedHost) {
    throw new Error(`RECORA_DATABASE_URL host mismatch before bootstrap. expectedHost=${normalizedExpectedHost} actualHost=${actualHost}`);
  }
}

function normalizeExpectedDbHost(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) throw new Error("--expected-db-host requires a non-empty host.");
  if (normalized.includes("/") || normalized.includes(":")) {
    throw new Error("--expected-db-host must be a host name only, not a URL or host:port.");
  }
  return normalized;
}

async function readClientConfig(inputPath: string): Promise<JsonRecord> {
  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw.replace(/^\uFEFF/, "")) as unknown;
  if (!isRecord(parsed)) throw new Error("Client config JSON must be an object.");
  return parsed;
}

function getProjectSlug(config: JsonRecord) {
  const project = isRecord(config.project) ? config.project : {};
  const slug = getString(project, "slug");
  if (!slug) throw new Error("Client config must include project.slug.");
  return slug;
}

function buildPlannedOperations(options: Options, projectSlug: string) {
  const bootstrapCommand = buildScriptCommand("client bootstrap", "scripts/prepare-recora-client-project.ts", [
    "--input",
    options.clientConfigPath ?? "<client-config>",
    options.executeLocal ? "--execute" : "--dry-run",
    ...(!options.executeLocal ? ["--skip-existing-slug-check"] : [])
  ]);
  const reportCycleCommand = buildReportCycleCommand(options, projectSlug);

  return [
    {
      id: "client_bootstrap",
      mode: options.executeLocal ? "execute-local" : "dry-run",
      command: options.skipBootstrap ? null : formatCommand(bootstrapCommand.displayCommand),
      writes: options.executeLocal && !options.skipBootstrap ? "local-db-only" : "none",
      checkpoint: options.executeLocal ? "approved by --execute-local" : "not approved"
    },
    {
      id: "report_cycle",
      mode: options.executeLocal ? "execute-local" : "dry-run",
      command: formatCommand(reportCycleCommand.displayCommand),
      writes: resolveReportCycleWriteIntent(options),
      checkpoint: options.executeLocal ? "approved by --execute-local" : "not approved"
    },
    {
      id: "customer_report_url",
      mode: "review",
      command: null,
      url: `/dashboard/reports/${projectSlug}`,
      writes: "none",
      checkpoint: "share only after reportReadyStatus is customer_ready"
    }
  ];
}

function buildReportCycleCommand(options: Options, projectSlug: string): ChildCommand {
  const args = ["--project-slug", projectSlug];

  if (options.executeLocal && options.executeMeasurement) {
    args.push("--execute-measurement");
    if (options.profileId) {
      args.push("--profile", options.profileId);
    } else if (options.promptLimit) {
      args.push("--prompt-limit", String(options.promptLimit));
    }
    args.push("--search-mode", options.measurementSearchMode);
  } else if (options.measurementRunId) {
    args.push("--measurement-run-id", options.measurementRunId);
  } else {
    args.push("--plan");
  }

  args.push("--aggregate-search-mode", options.aggregateSearchMode);

  if (options.executeLocal && options.applyAggregate) args.push("--apply-aggregate");
  if (options.executeLocal && options.generateRecommendations) args.push("--generate-recommendations");
  if (options.executeLocal && options.applyRecommendations) args.push("--apply-recommendations");
  if (options.expectedDbHost) args.push("--expected-db-host", options.expectedDbHost);
  if (options.outputDir) args.push("--output-dir", options.outputDir);

  return buildScriptCommand("report cycle", "scripts/run-recora-report-cycle.ts", args);
}

function buildScriptCommand(label: string, scriptPath: string, scriptArgs: string[]): ChildCommand {
  const tsxCliPath = resolveTsxCliPath();
  const executable = process.execPath;
  const args = [tsxCliPath, scriptPath, ...scriptArgs];
  return {
    label,
    executable,
    args,
    displayCommand: ["node", relativeForDisplay(tsxCliPath), scriptPath, ...scriptArgs]
  };
}

async function runCommand(command: ChildCommand, options: { parseJson: boolean }): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command.label} failed. exitCode=${code ?? "unknown"}. stderr=${summarizeText(stderr)}`));
        return;
      }

      resolve({
        command,
        stdout,
        output: options.parseJson ? parseJsonFromStdout(stdout) : null
      });
    });
  });
}

function buildOperatorSummary(input: {
  projectSlug: string;
  options: Options;
  manifest: JsonRecord | null;
  bootstrapExecuted: boolean;
  plannedOperations: ReturnType<typeof buildPlannedOperations>;
}) {
  const { projectSlug, options, manifest } = input;
  const metricSnapshots = asRecord(manifest?.metricSnapshots);
  const counts = asRecord(manifest?.counts);
  const recommendationCandidates = asRecord(manifest?.recommendationCandidates);
  const recommendationSaveDryRun = asRecord(manifest?.recommendationSaveDryRun);
  const recommendationSaveApply = asRecord(manifest?.recommendationSaveApply);
  const measurementRunId = getString(manifest, "measurementRunId") ?? options.measurementRunId;
  const aggregateRunId = getString(manifest, "aggregateRunId");
  const reportUrl = `/dashboard/reports/${projectSlug}`;
  const customerDataBoundaryConfirmed =
    input.bootstrapExecuted || options.customerDataBoundaryConfirmed;
  const writtenSnapshotCount = getNumber(metricSnapshots, "writtenSnapshotCount") ?? 0;
  const candidateCount = getNumber(recommendationCandidates, "candidateCount") ?? 0;
  const reportReadyGate = evaluateRecoraReportReadyGate({
    projectSlug,
    projectExists: input.bootstrapExecuted || options.skipBootstrap,
    run: aggregateRunId
      ? {
          id: aggregateRunId,
          status: "completed",
          metadata: {
            run_kind: "aggregate",
            data_source: "openai_measurement",
            source_run_id: measurementRunId
          }
        }
      : null,
    metricSnapshotCount: writtenSnapshotCount,
    validObservationCount: getNumber(counts, "aiConversations") ?? 0,
    hasPlaceholderEvidence: customerDataBoundaryConfirmed ? false : undefined,
    dataOriginStatus: customerDataBoundaryConfirmed ? "customer_data" : "unknown",
    sourceMeasurementRunId: measurementRunId,
    customerVisibleRecommendationCount: null,
    internalRecommendationCandidateCount: candidateCount
  });

  return {
    projectSlug,
    measurementRunId,
    aggregateRunId,
    aggregateStatus: resolveAggregateStatus(metricSnapshots),
    recommendationStatus: resolveRecommendationStatus(
      recommendationCandidates,
      recommendationSaveDryRun,
      recommendationSaveApply
    ),
    reportReadyStatus: reportReadyGate.status,
    reportUrl,
    remainingBlockers: reportReadyGate.adminDiagnostic.blockingReasons.map((reason) => ({
      code: reason.code,
      message: reason.message
    })),
    reportReadyGate
  };
}

function resolveAggregateStatus(metricSnapshots: JsonRecord) {
  const status = getString(metricSnapshots, "status") ?? "not_requested";
  const mode = getString(metricSnapshots, "mode");
  const databaseWritePerformed = getBoolean(metricSnapshots, "databaseWritePerformed");
  if (status === "completed" && mode) {
    return databaseWritePerformed ? `${mode}_written` : `${mode}_planned`;
  }
  return status;
}

function resolveRecommendationStatus(
  recommendationCandidates: JsonRecord,
  recommendationSaveDryRun: JsonRecord,
  recommendationSaveApply: JsonRecord
) {
  const applyStatus = getString(recommendationSaveApply, "status");
  if (applyStatus === "completed") return "saved_internal_candidates";
  const dryRunStatus = getString(recommendationSaveDryRun, "status");
  if (dryRunStatus === "completed") return "save_dry_run_completed";
  const candidateStatus = getString(recommendationCandidates, "status");
  if (candidateStatus) return candidateStatus;
  return "not_requested";
}

function resolveReportCycleWriteIntent(options: Options) {
  const writes: string[] = [];
  if (options.executeLocal && options.executeMeasurement) writes.push("measurement observations");
  if (options.executeLocal && options.applyAggregate) writes.push("aggregate metric snapshots");
  if (options.executeLocal && options.applyRecommendations) writes.push("recommendations");
  return writes.length > 0 ? writes.join(", ") : "none";
}

function resolveTsxCliPath() {
  const tsxCliPath = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsxCliPath)) {
    throw new Error(`Cannot find local tsx CLI at ${relativeForDisplay(tsxCliPath)}. Run npm install before using this script.`);
  }
  return tsxCliPath;
}

function parseJsonFromStdout(stdout: string): JsonRecord {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("stdout was empty.");
  const dryRunMarker = "\nDry-run complete.";
  const candidate = trimmed.includes(dryRunMarker)
    ? trimmed.slice(0, trimmed.indexOf(dryRunMarker)).trim()
    : trimmed;

  try {
    return asRequiredRecord(JSON.parse(candidate));
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object was found in stdout.");
    return asRequiredRecord(JSON.parse(candidate.slice(start, end + 1)));
  }
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function parseMeasurementSearchMode(value: string): MeasurementSearchMode {
  if (value === "no-search" || value === "web-search" || value === "both") return value;
  throw new Error("--search-mode must be no-search, web-search, or both.");
}

function parseAggregateSearchMode(value: string): AggregateSearchMode {
  if (value === "combined" || value === "no-search" || value === "web-search" || value === "both") return value;
  throw new Error("--aggregate-search-mode must be combined, no-search, web-search, or both.");
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asRequiredRecord(value: unknown): JsonRecord {
  if (!isRecord(value)) throw new Error("Parsed JSON was not an object.");
  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record: unknown, key: string) {
  const value = isRecord(record) ? record[key] : null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumber(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getBoolean(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function relativeForDisplay(value: string) {
  const relative = path.relative(process.cwd(), value);
  return relative && !relative.startsWith("..") ? relative.replace(/\\/g, "/") : value.replace(/\\/g, "/");
}

function formatCommand(command: string[]) {
  return command.map((part) => (part.includes(" ") ? JSON.stringify(part) : part)).join(" ");
}

function summarizeText(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 600 ? `${cleaned.slice(0, 600)}...` : cleaned;
}

function logOperatorEvent(event: string, details: unknown) {
  process.stderr.write(`[recora-phase1-operator] ${event} ${JSON.stringify(details, null, 2)}\n`);
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`Usage:
  npm run recora:phase1:operator -- --client-config .\\tmp\\client-project.json
  npm run recora:phase1:operator -- --client-config .\\tmp\\client-project.json --execute-local --skip-bootstrap --customer-data-boundary-confirmed --measurement-run-id <completed-openai-run-id> --apply-aggregate --generate-recommendations
  npm run recora:phase1:operator -- --client-config .\\tmp\\client-project.json --execute-local --execute-measurement --confirm-measurement-execution run-openai:<project-slug> --profile small-v01 --apply-aggregate --generate-recommendations

Options:
  --client-config <json>              Required client bootstrap JSON.
  --execute-local                     Checkpoint for local DB writes. Omit for dry-run.
  --skip-bootstrap                    Do not call prepare-recora-client-project.ts. Required for existing measurement-run flow.
  --customer-data-boundary-confirmed  Use only when an existing project has been checked as customer_data.
  --measurement-run-id <id>           Use an existing completed OpenAI measurement run.
  --execute-measurement               Run OpenAI measurement through the report-cycle script.
  --confirm-measurement-execution     Required with --execute-measurement. Expected: run-openai:<project-slug>.
  --prompt-limit <number>             Measurement prompt count when executing measurement.
  --profile <id>                      Measurement profile when executing measurement.
  --search-mode <mode>                no-search, web-search, or both. Default: both.
  --apply-aggregate                   Persist aggregate metric snapshots, only with --execute-local.
  --generate-recommendations          Generate recommendation candidate files, only with --execute-local.
  --apply-recommendations             Save recommendations after dry-run save, only with --execute-local.
  --expected-db-host <host>           Forwarded to report-cycle DB host check.
  --output-dir <path>                 Forwarded to report-cycle manifest/output directory.
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
