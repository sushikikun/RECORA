import { spawn } from "node:child_process";
import process from "node:process";

const DEFAULT_PROJECT_SLUG = "recora-kenzai-q2";
const DEFAULT_PROMPT_LIMIT = 1;
const DEFAULT_SEARCH_MODE: SearchMode = "both";
const DEFAULT_AGGREGATE_SEARCH_MODE: AggregateSearchMode = "combined";

type SearchMode = "no-search" | "web-search" | "both";
type AggregateSearchMode = "combined" | "no-search" | "web-search" | "both";

type Options = {
  projectSlug: string;
  promptLimit: number;
  searchMode: SearchMode;
  aggregateSearchMode: AggregateSearchMode;
  execute: boolean;
  applyAggregate: boolean;
};

type JsonRecord = Record<string, unknown>;

type CommandResult = {
  command: string[];
  output: JsonRecord;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const measurementCommand = buildMeasurementCommand(options);
  const aggregateCommandWithoutSourceRun = buildAggregateCommand(options, null);
  const dashboardUrls = buildDashboardUrls(options.projectSlug);

  if (!options.execute) {
    printJson({
      mode: "dry-run",
      projectSlug: options.projectSlug,
      promptLimit: options.promptLimit,
      searchMode: options.searchMode,
      aggregateSearchMode: options.aggregateSearchMode,
      measurementRunId: null,
      measurement: {
        status: "planned_not_executed",
        command: formatCommand(measurementCommand),
        insertedCounts: null
      },
      aggregate: {
        status: "not_run_waiting_for_measurement_run",
        commandTemplate: formatCommand(aggregateCommandWithoutSourceRun),
        aggregateRunId: null,
        insertedSnapshotCount: null,
        updatedSnapshotCount: null,
        writtenSnapshotCount: null
      },
      recommendationsBefore: null,
      recommendationsAfter: null,
      metricSnapshotsBefore: null,
      metricSnapshotsAfter: null,
      dashboardUrls,
      safety: {
        openAiApiExecuted: false,
        databaseWritePerformed: false,
        executeRequiredForOpenAi: true,
        applyAggregateRequiredForMetricSnapshotWrite: true,
        note: "--execute was not provided, so OpenAI measurement and aggregate recalculation were not run."
      }
    });
    return;
  }

  const measurementResult = await runJsonCommand(measurementCommand);
  const measurementRunId = getString(measurementResult.output, "measurementRunId");
  if (!measurementRunId) {
    throw new Error("Measurement completed but measurementRunId was not found in the measurement script output.");
  }

  const aggregateCommand = buildAggregateCommand(options, measurementRunId);
  const aggregateResult = await runJsonCommand(aggregateCommand);

  printJson({
    mode: options.applyAggregate ? "execute-and-apply-aggregate" : "execute-measurement-aggregate-dry-run",
    projectSlug: options.projectSlug,
    promptLimit: options.promptLimit,
    searchMode: options.searchMode,
    aggregateSearchMode: options.aggregateSearchMode,
    measurementRunId,
    measurement: {
      status: getString(measurementResult.output, "runStatus"),
      command: formatCommand(measurementCommand),
      insertedCounts: buildMeasurementInsertedCounts(measurementResult.output),
      guardrails: asRecord(measurementResult.output.guardrails)
    },
    aggregate: {
      status: getString(aggregateResult.output, "mode"),
      command: formatCommand(aggregateCommand),
      selectedSourceRunId: getString(aggregateResult.output, "selectedSourceRunId"),
      aggregateRunId: getString(aggregateResult.output, "aggregateRunId") ?? getExistingAggregateRunId(aggregateResult.output),
      insertedSnapshotCount: getNumber(aggregateResult.output, "insertedSnapshotCount"),
      updatedSnapshotCount: getNumber(aggregateResult.output, "updatedSnapshotCount"),
      writtenSnapshotCount: getNumber(aggregateResult.output, "writtenSnapshotCount"),
      plannedProjectSnapshots: getNumber(aggregateResult.output, "plannedProjectSnapshots"),
      plannedBrandSnapshots: getNumber(aggregateResult.output, "plannedBrandSnapshots"),
      databaseWriteAllowed: getBoolean(aggregateResult.output, "databaseWriteAllowed"),
      databaseWritePerformed: getBoolean(aggregateResult.output, "databaseWritePerformed")
    },
    recommendationsBefore: getNumber(aggregateResult.output, "recommendationsBefore"),
    recommendationsAfter: getNumber(aggregateResult.output, "recommendationsAfter"),
    metricSnapshotsBefore: getNumber(aggregateResult.output, "metricSnapshotsBefore"),
    metricSnapshotsAfter: getNumber(aggregateResult.output, "metricSnapshotsAfter"),
    dashboardUrls,
    safety: {
      openAiApiExecuted: true,
      databaseWritePerformed: getBoolean(aggregateResult.output, "databaseWritePerformed") ?? false,
      metricSnapshotsWrittenOnlyWhenApplyAggregateProvided: options.applyAggregate,
      recommendationsWritten: false,
      note:
        "This cycle stores OpenAI measurement observations only when --execute is provided, and stores metric_snapshots only when --apply-aggregate is provided. Recommendations are not generated or saved."
    }
  });
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    projectSlug: DEFAULT_PROJECT_SLUG,
    promptLimit: DEFAULT_PROMPT_LIMIT,
    searchMode: DEFAULT_SEARCH_MODE,
    aggregateSearchMode: DEFAULT_AGGREGATE_SEARCH_MODE,
    execute: false,
    applyAggregate: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--project-slug" && next) {
      options.projectSlug = next;
      index += 1;
      continue;
    }
    if (arg === "--prompt-limit" && next) {
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--prompt-limit must be a positive integer.");
      options.promptLimit = parsed;
      index += 1;
      continue;
    }
    if (arg === "--search-mode" && next) {
      if (!isSearchMode(next)) throw new Error("--search-mode must be no-search, web-search, or both.");
      options.searchMode = next;
      index += 1;
      continue;
    }
    if (arg === "--aggregate-search-mode" && next) {
      if (!isAggregateSearchMode(next)) {
        throw new Error("--aggregate-search-mode must be combined, no-search, web-search, or both.");
      }
      options.aggregateSearchMode = next;
      index += 1;
      continue;
    }
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--apply-aggregate") {
      options.applyAggregate = true;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function buildMeasurementCommand(options: Options) {
  return [
    "npx",
    "tsx",
    "scripts/run-openai-measurement.ts",
    "--project-slug",
    options.projectSlug,
    "--prompt-limit",
    String(options.promptLimit),
    "--search-mode",
    options.searchMode
  ];
}

function buildAggregateCommand(options: Options, sourceRunId: string | null) {
  const command = [
    "npx",
    "tsx",
    "scripts/recalculate-metric-snapshots.ts",
    "--project-slug",
    options.projectSlug,
    "--search-mode",
    options.aggregateSearchMode
  ];

  if (sourceRunId) {
    command.push("--source-run-id", sourceRunId);
  } else {
    command.push("--source-run-id", "<measurementRunId>");
  }

  if (options.applyAggregate) {
    command.push("--apply");
  }

  return command;
}

function buildDashboardUrls(projectSlug: string) {
  return {
    dashboard: "/dashboard",
    conversations: `/dashboard/reports/${projectSlug}/conversations`,
    sources: `/dashboard/reports/${projectSlug}/sources`,
    leaderboard: `/dashboard/reports/${projectSlug}/leaderboard`
  };
}

function buildMeasurementInsertedCounts(output: JsonRecord) {
  const totals = asRecord(output.totals);
  return {
    runItemsCreated: getNumber(totals, "runItemsCreated"),
    aiConversationsInserted: getNumber(totals, "aiConversationsInserted"),
    brandMentionsInserted: getNumber(totals, "brandMentionsInserted"),
    citationsInserted: getNumber(totals, "citationsInserted"),
    sourceDomainsUpserted: getNumber(totals, "sourceDomainsUpserted"),
    failedItems: getNumber(totals, "failedItems"),
    skippedDuplicates: getNumber(totals, "skippedDuplicates")
  };
}

function getExistingAggregateRunId(output: JsonRecord) {
  const existingAggregate = asRecord(output.existingAggregate);
  return getString(existingAggregate, "id");
}

async function runJsonCommand(command: string[]): Promise<CommandResult> {
  const executable = resolveExecutable(command[0]);
  const args = command.slice(1);

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: process.env,
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
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${formatCommand(command)} failed with exit code ${code}. ${summarizeText(stderr)}`));
        return;
      }

      try {
        resolve({
          command,
          output: parseJsonFromStdout(stdout)
        });
      } catch (error) {
        reject(new Error(`Failed to parse JSON output from ${formatCommand(command)}. ${(error as Error).message}`));
      }
    });
  });
}

function parseJsonFromStdout(stdout: string): JsonRecord {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("stdout was empty.");

  try {
    return asRequiredRecord(JSON.parse(trimmed));
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object was found in stdout.");
    return asRequiredRecord(JSON.parse(trimmed.slice(start, end + 1)));
  }
}

function resolveExecutable(value: string) {
  if (value === "npx" && process.platform === "win32") return "npx.cmd";
  return value;
}

function formatCommand(command: string[]) {
  return command.map((part) => (part.includes(" ") ? JSON.stringify(part) : part)).join(" ");
}

function summarizeText(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 500 ? `${cleaned.slice(0, 500)}...` : cleaned;
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
}

function asRequiredRecord(value: unknown): JsonRecord {
  const record = asRecord(value);
  if (Object.keys(record).length === 0 && (typeof value !== "object" || value === null || Array.isArray(value))) {
    throw new Error("Parsed JSON was not an object.");
  }
  return record;
}

function getString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function getNumber(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getBoolean(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function isSearchMode(value: string): value is SearchMode {
  return value === "no-search" || value === "web-search" || value === "both";
}

function isAggregateSearchMode(value: string): value is AggregateSearchMode {
  return value === "combined" || value === "no-search" || value === "web-search" || value === "both";
}

function printJson(value: JsonRecord) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`Usage:
  npx tsx scripts/run-recora-cycle.ts --project-slug recora-kenzai-q2 --prompt-limit 1 --search-mode both
  npx tsx scripts/run-recora-cycle.ts --project-slug recora-kenzai-q2 --prompt-limit 1 --search-mode both --execute --apply-aggregate

Options:
  --project-slug <slug>               Target Recora project slug. Default: recora-kenzai-q2
  --prompt-limit <number>             Number of prompts to measure. Default: 1
  --search-mode <mode>                no-search, web-search, or both. Default: both
  --aggregate-search-mode <mode>      combined, no-search, web-search, or both. Default: combined
  --execute                           Actually run OpenAI measurement.
  --apply-aggregate                   Persist metric_snapshots during aggregate recalculation.
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
