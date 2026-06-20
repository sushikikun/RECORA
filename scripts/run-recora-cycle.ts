import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  getExpectedRunItems,
  getMeasurementProfile,
  getMeasurementProfileIds,
  isMeasurementProfileId,
  type MeasurementProfile,
  type MeasurementProfileId
} from "../lib/recora/measurement-profiles";
import { assertRecoraDbWriteAllowed } from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = "recora-kenzai-q2";
const DEFAULT_PROMPT_LIMIT = 1;
const DEFAULT_SEARCH_MODE: SearchMode = "both";
const DEFAULT_AGGREGATE_SEARCH_MODE: AggregateSearchMode = "combined";

type SearchMode = "no-search" | "web-search" | "both";
type AggregateSearchMode = "combined" | "no-search" | "web-search" | "both";

type Options = {
  projectSlug: string;
  promptLimit: number;
  promptLimitProvided: boolean;
  profileId: MeasurementProfileId | null;
  searchMode: SearchMode;
  aggregateSearchMode: AggregateSearchMode;
  execute: boolean;
  applyAggregate: boolean;
};

type JsonRecord = Record<string, unknown>;

type ChildScriptCommand = {
  label: string;
  executable: string;
  args: string[];
  displayCommand: string[];
};

type CommandResult = {
  command: ChildScriptCommand;
  output: JsonRecord;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  assertRecoraDbWriteAllowed({
    databaseUrl: process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
    operation: "run-recora-cycle --execute",
    projectSlug: options.projectSlug,
    isWrite: options.execute,
    allowNonLocalDb: false,
    confirmNonLocalDbWrite: null
  });
  const profile = options.profileId ? getMeasurementProfile(options.profileId) : null;
  const measurementCommand = buildMeasurementCommand(options);
  const aggregateCommandWithoutSourceRun = buildAggregateCommand(options, null);
  const dashboardUrls = buildDashboardUrls(options.projectSlug);
  const profileSummary = profile ? buildProfileSummary(profile, options.searchMode) : null;

  if (!options.execute) {
    printJson({
      mode: "dry-run",
      projectSlug: options.projectSlug,
      promptLimit: profile ? null : options.promptLimit,
      promptCount: profile ? profile.promptCount : options.promptLimit,
      expectedRunItems: profile ? getExpectedRunItems(profile, options.searchMode) : getExpectedRunItems({ promptCount: options.promptLimit }, options.searchMode),
      searchMode: options.searchMode,
      selectedPromptIds: profile ? [...profile.promptIds] : null,
      profile: profileSummary,
      aggregateSearchMode: options.aggregateSearchMode,
      measurementRunId: null,
      measurement: {
        status: "planned_not_executed",
        command: formatCommand(measurementCommand.displayCommand),
        childCommandResolution: describeChildCommand(measurementCommand),
        insertedCounts: null
      },
      aggregate: {
        status: "not_run_waiting_for_measurement_run",
        commandTemplate: formatCommand(aggregateCommandWithoutSourceRun.displayCommand),
        childCommandResolution: describeChildCommand(aggregateCommandWithoutSourceRun),
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
    promptLimit: profile ? null : options.promptLimit,
    promptCount: profile ? profile.promptCount : options.promptLimit,
    expectedRunItems: profile ? getExpectedRunItems(profile, options.searchMode) : getExpectedRunItems({ promptCount: options.promptLimit }, options.searchMode),
    searchMode: options.searchMode,
    selectedPromptIds: profile ? [...profile.promptIds] : null,
    profile: profileSummary,
    aggregateSearchMode: options.aggregateSearchMode,
    measurementRunId,
    measurement: {
      status: getString(measurementResult.output, "runStatus"),
      command: formatCommand(measurementCommand.displayCommand),
      childCommandResolution: describeChildCommand(measurementCommand),
      insertedCounts: buildMeasurementInsertedCounts(measurementResult.output),
      guardrails: asRecord(measurementResult.output.guardrails)
    },
    aggregate: {
      status: getString(aggregateResult.output, "mode"),
      command: formatCommand(aggregateCommand.displayCommand),
      childCommandResolution: describeChildCommand(aggregateCommand),
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
    promptLimitProvided: false,
    profileId: null,
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
      options.promptLimitProvided = true;
      index += 1;
      continue;
    }
    if (arg === "--profile" && next) {
      if (!isMeasurementProfileId(next)) {
        throw new Error(`--profile must be one of: ${getMeasurementProfileIds().join(", ")}.`);
      }
      options.profileId = next;
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

  if (options.profileId && options.promptLimitProvided) {
    throw new Error("--profile and --prompt-limit cannot be used together.");
  }

  return options;
}

function buildMeasurementCommand(options: Options) {
  const profile = options.profileId ? getMeasurementProfile(options.profileId) : null;
  const promptSelectionArgs = profile
    ? ["--profile", profile.id]
    : ["--prompt-limit", String(options.promptLimit)];

  return buildChildScriptCommand("OpenAI measurement", "scripts/run-openai-measurement.ts", [
    "--project-slug",
    options.projectSlug,
    ...promptSelectionArgs,
    "--search-mode",
    options.searchMode
  ]);
}

function buildAggregateCommand(options: Options, sourceRunId: string | null) {
  const args = [
    "--project-slug",
    options.projectSlug,
    "--search-mode",
    options.aggregateSearchMode
  ];

  if (sourceRunId) {
    args.push("--source-run-id", sourceRunId);
  } else {
    args.push("--source-run-id", "<measurementRunId>");
  }

  if (options.applyAggregate) {
    args.push("--apply");
  }

  return buildChildScriptCommand("metric_snapshots recalculation", "scripts/recalculate-metric-snapshots.ts", args);
}

function buildChildScriptCommand(label: string, scriptPath: string, scriptArgs: string[]): ChildScriptCommand {
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

function buildDashboardUrls(projectSlug: string) {
  return {
    dashboard: "/dashboard",
    conversations: `/dashboard/reports/${projectSlug}/conversations`,
    sources: `/dashboard/reports/${projectSlug}/sources`,
    leaderboard: `/dashboard/reports/${projectSlug}/leaderboard`
  };
}

function buildProfileSummary(profile: MeasurementProfile, searchMode: SearchMode) {
  return {
    id: profile.id,
    label: profile.label,
    description: profile.description,
    useCase: profile.useCase,
    promptCount: profile.promptCount,
    expectedRunItems: getExpectedRunItems(profile, searchMode),
    defaultSearchMode: profile.defaultSearchMode,
    searchMode,
    warning: profile.warning,
    isRecommended: profile.isRecommended,
    selectedPromptIds: [...profile.promptIds]
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

async function runJsonCommand(command: ChildScriptCommand): Promise<CommandResult> {
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
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `${command.label} failed. command=${formatCommand(command.displayCommand)} exitCode=${code}. stderr=${summarizeText(stderr)}`
          )
        );
        return;
      }

      try {
        resolve({
          command,
          output: parseJsonFromStdout(stdout)
        });
      } catch (error) {
        reject(
          new Error(
            `Failed to parse JSON output from ${command.label}. command=${formatCommand(command.displayCommand)}. ${
              (error as Error).message
            } stdoutTail=${summarizeText(stdout.slice(-1000))}`
          )
        );
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

function resolveTsxCliPath() {
  const tsxCliPath = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsxCliPath)) {
    throw new Error(`Cannot find local tsx CLI at ${relativeForDisplay(tsxCliPath)}. Run npm install before using this script.`);
  }
  return tsxCliPath;
}

function relativeForDisplay(value: string) {
  const relative = path.relative(process.cwd(), value);
  return relative && !relative.startsWith("..") ? relative.replace(/\\/g, "/") : value.replace(/\\/g, "/");
}

function describeChildCommand(command: ChildScriptCommand) {
  return {
    label: command.label,
    platform: process.platform,
    executable: path.basename(command.executable),
    executableKind: "process.execPath",
    runner: relativeForDisplay(command.args[0] ?? ""),
    shell: false,
    displayCommand: formatCommand(command.displayCommand)
  };
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
  npx tsx scripts/run-recora-cycle.ts --project-slug recora-kenzai-q2 --profile small-v01 --search-mode both
  npx tsx scripts/run-recora-cycle.ts --project-slug recora-kenzai-q2 --prompt-limit 1 --search-mode both --execute --apply-aggregate

Options:
  --project-slug <slug>               Target Recora project slug. Default: recora-kenzai-q2
  --prompt-limit <number>             Number of prompts to measure. Default: 1
  --profile <id>                      Measurement profile: small-v01 or standard-v01. Cannot be combined with --prompt-limit.
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
