import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_AGGREGATE_SEARCH_MODE: AggregateSearchMode = "combined";
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type AggregateSearchMode = "combined" | "no-search" | "web-search" | "both";
type JsonRecord = Record<string, unknown>;

type Options = {
  projectSlug: string;
  measurementRunId: string;
  plan: boolean;
  applyAggregate: boolean;
  generateRecommendations: boolean;
  applyRecommendations: boolean;
  aggregateSearchMode: AggregateSearchMode;
  outputDir: string | null;
};

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

type LocalDatabase = {
  url: string;
  host: string;
  port: string;
};

type CycleManifest = {
  mode: string;
  generatedAt: string;
  projectSlug: string;
  measurementRunId: string;
  aggregateRunId: string | null;
  aggregateSearchMode: AggregateSearchMode;
  counts: {
    aiConversations: number | null;
    brandMentions: number | null;
    citations: number | null;
    sourceDomains: number | null;
  };
  metricSnapshots: {
    mode: string | null;
    databaseWriteAllowed: boolean | null;
    databaseWritePerformed: boolean | null;
    insertedSnapshotCount: number | null;
    updatedSnapshotCount: number | null;
    writtenSnapshotCount: number | null;
    before: number | null;
    after: number | null;
  };
  recommendationCandidates: {
    status: "not_requested" | "skipped_no_candidates" | "generated";
    candidateCount: number | null;
    outputJson: string | null;
    outputMarkdown: string | null;
  };
  recommendationSaveDryRun: {
    status: "not_run" | "skipped_no_candidates" | "completed";
    insertTargetCount: number | null;
    skippedCount: number | null;
    duplicateCount: number | null;
    recommendationsBefore: number | null;
    recommendationsAfter: number | null;
    databaseWritePerformed: boolean | null;
  };
  recommendationSaveApply: {
    status: "not_requested" | "skipped_no_candidates" | "completed";
    insertedCount: number | null;
    savedCandidateIds: string[];
    recommendationsBefore: number | null;
    recommendationsAfter: number | null;
    databaseWritePerformed: boolean | null;
  };
  dashboardUrls: ReturnType<typeof buildDashboardUrls>;
  safety: {
    openAiApiExecuted: false;
    localDatabaseOnly: true;
    databaseHost: string;
    databasePort: string;
    planDefault: boolean;
    applyAggregateRequiredForMetricSnapshotWrite: boolean;
    applyRecommendationsRequiredForRecommendationWrite: boolean;
    recommendationPolicy: string;
  };
  commands: {
    aggregate: ReturnType<typeof describeChildCommand>;
    generateRecommendations: ReturnType<typeof describeChildCommand> | null;
    saveRecommendationsDryRun: ReturnType<typeof describeChildCommand> | null;
    saveRecommendationsApply: ReturnType<typeof describeChildCommand> | null;
  };
  manifestPath: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const database = resolveLocalDatabase();
  const outputDir = resolveOutputDir(options);
  const manifestPath = path.join(outputDir, "manifest.json");
  const childEnv = {
    ...process.env,
    RECORA_DATABASE_URL: database.url
  };

  await fs.mkdir(outputDir, { recursive: true });

  const aggregateCommand = buildAggregateCommand(options, path.join(outputDir, "aggregate.json"));
  const aggregateResult = await runJsonCommand(aggregateCommand, childEnv);
  assertAggregateSourceMatches(aggregateResult.output, options.measurementRunId);

  const aggregateRunId = resolveAggregateRunId(aggregateResult.output);
  const candidateOutputDir = path.join(outputDir, "recommendation-candidates");
  let generateCommand: ChildScriptCommand | null = null;
  let generateResult: CommandResult | null = null;
  let saveDryRunCommand: ChildScriptCommand | null = null;
  let saveDryRunResult: CommandResult | null = null;
  let saveApplyCommand: ChildScriptCommand | null = null;
  let saveApplyResult: CommandResult | null = null;

  if (options.generateRecommendations) {
    if (!aggregateRunId) {
      throw new Error(
        "Recommendation generation requires an aggregate run linked by source_run_id. Run with --apply-aggregate or use a measurement run that already has an aggregate."
      );
    }
    generateCommand = buildGenerateRecommendationsCommand(options, aggregateRunId, candidateOutputDir);
    generateResult = await runJsonCommand(generateCommand, childEnv);

    const candidateCount = getNumber(generateResult.output, "candidateCount") ?? 0;
    if (candidateCount > 0) {
      const candidateInputPath = getGeneratedCandidateInputPath(generateResult.output, candidateOutputDir, options.measurementRunId);
      saveDryRunCommand = buildSaveRecommendationsCommand(candidateInputPath, false);
      saveDryRunResult = await runJsonCommand(saveDryRunCommand, childEnv);

      if (options.applyRecommendations) {
        saveApplyCommand = buildSaveRecommendationsCommand(candidateInputPath, true);
        saveApplyResult = await runJsonCommand(saveApplyCommand, childEnv);
      }
    }
  }

  const manifest = buildManifest({
    options,
    database,
    aggregateCommand,
    aggregateOutput: aggregateResult.output,
    aggregateRunId,
    generateCommand,
    generateOutput: generateResult?.output ?? null,
    saveDryRunCommand,
    saveDryRunOutput: saveDryRunResult?.output ?? null,
    saveApplyCommand,
    saveApplyOutput: saveApplyResult?.output ?? null,
    manifestPath
  });

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  printJson(manifest);
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    projectSlug: "",
    measurementRunId: "",
    plan: false,
    applyAggregate: false,
    generateRecommendations: false,
    applyRecommendations: false,
    aggregateSearchMode: DEFAULT_AGGREGATE_SEARCH_MODE,
    outputDir: null
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
    if (arg.startsWith("--project-slug=")) {
      options.projectSlug = arg.slice("--project-slug=".length);
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
    if (arg === "--aggregate-search-mode" && next) {
      if (!isAggregateSearchMode(next)) {
        throw new Error("--aggregate-search-mode must be combined, no-search, web-search, or both.");
      }
      options.aggregateSearchMode = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--aggregate-search-mode=")) {
      const value = arg.slice("--aggregate-search-mode=".length);
      if (!isAggregateSearchMode(value)) {
        throw new Error("--aggregate-search-mode must be combined, no-search, web-search, or both.");
      }
      options.aggregateSearchMode = value;
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
    if (arg === "--plan") {
      options.plan = true;
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

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (!options.projectSlug) throw new Error("--project-slug is required.");
  if (!options.measurementRunId) throw new Error("--measurement-run-id is required.");
  if (options.plan && (options.applyAggregate || options.generateRecommendations || options.applyRecommendations)) {
    throw new Error("--plan cannot be combined with apply or generation flags.");
  }
  if (options.applyRecommendations && !options.generateRecommendations) {
    throw new Error("--apply-recommendations requires --generate-recommendations.");
  }

  return options;
}

function resolveLocalDatabase(): LocalDatabase {
  const url = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const parsed = parseDatabaseUrl(url);
  if (!LOCAL_DATABASE_HOSTS.has(parsed.hostname)) {
    throw new Error("Refusing to run against a non-local RECORA_DATABASE_URL. This MVP orchestrator is local-only.");
  }
  return {
    url,
    host: parsed.hostname,
    port: parsed.port || "5432"
  };
}

function parseDatabaseUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("RECORA_DATABASE_URL is not a valid PostgreSQL URL.");
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("RECORA_DATABASE_URL must use postgresql:// or postgres://.");
  }
  return parsed;
}

function resolveOutputDir(options: Options) {
  if (options.outputDir) return options.outputDir;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runShort = options.measurementRunId.slice(0, 8);
  return path.join(process.cwd(), "output", "report-cycles", `${options.projectSlug}-${runShort}-${timestamp}`);
}

function buildAggregateCommand(options: Options, outputJsonPath: string) {
  const args = [
    "--project-slug",
    options.projectSlug,
    "--source-run-id",
    options.measurementRunId,
    "--search-mode",
    options.aggregateSearchMode,
    "--output-json",
    outputJsonPath
  ];
  if (options.applyAggregate) args.push("--apply");
  return buildChildScriptCommand("metric snapshot aggregate", "scripts/recalculate-metric-snapshots.ts", args);
}

function buildGenerateRecommendationsCommand(options: Options, aggregateRunId: string, outputDir: string) {
  return buildChildScriptCommand("recommendation candidates generation", "scripts/generate-recommendation-candidates.ts", [
    "--project-slug",
    options.projectSlug,
    "--measurement-run-id",
    options.measurementRunId,
    "--aggregate-run-id",
    aggregateRunId,
    "--output-dir",
    outputDir
  ]);
}

function buildSaveRecommendationsCommand(inputPath: string, apply: boolean) {
  const args = ["--input", inputPath];
  args.push(apply ? "--apply" : "--dry-run");
  return buildChildScriptCommand(
    apply ? "recommendations save apply" : "recommendations save dry-run",
    "scripts/save-recommendation-candidates.ts",
    args
  );
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

async function runJsonCommand(command: ChildScriptCommand, env: NodeJS.ProcessEnv): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
      cwd: process.cwd(),
      env,
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
        resolve({ command, output: parseJsonFromStdout(stdout) });
      } catch (error) {
        reject(
          new Error(
            `Failed to parse JSON output from ${command.label}. command=${formatCommand(command.displayCommand)}. ${(error as Error).message} stdoutTail=${summarizeText(stdout.slice(-1000))}`
          )
        );
      }
    });
  });
}

function buildManifest(input: {
  options: Options;
  database: LocalDatabase;
  aggregateCommand: ChildScriptCommand;
  aggregateOutput: JsonRecord;
  aggregateRunId: string | null;
  generateCommand: ChildScriptCommand | null;
  generateOutput: JsonRecord | null;
  saveDryRunCommand: ChildScriptCommand | null;
  saveDryRunOutput: JsonRecord | null;
  saveApplyCommand: ChildScriptCommand | null;
  saveApplyOutput: JsonRecord | null;
  manifestPath: string;
}): CycleManifest {
  const { options, aggregateOutput, generateOutput, saveDryRunOutput, saveApplyOutput } = input;
  const candidateCount = generateOutput ? getNumber(generateOutput, "candidateCount") ?? 0 : null;
  const noCandidates = candidateCount === 0;
  return {
    mode: resolveMode(options),
    generatedAt: new Date().toISOString(),
    projectSlug: options.projectSlug,
    measurementRunId: options.measurementRunId,
    aggregateRunId: input.aggregateRunId,
    aggregateSearchMode: options.aggregateSearchMode,
    counts: {
      aiConversations: getNumber(aggregateOutput, "conversationCount"),
      brandMentions: getNumber(aggregateOutput, "brandMentionCount"),
      citations: getNumber(aggregateOutput, "citationCount"),
      sourceDomains: getNumber(aggregateOutput, "sourceDomainCount")
    },
    metricSnapshots: {
      mode: getString(aggregateOutput, "mode"),
      databaseWriteAllowed: getBoolean(aggregateOutput, "databaseWriteAllowed"),
      databaseWritePerformed: getBoolean(aggregateOutput, "databaseWritePerformed"),
      insertedSnapshotCount: getNumber(aggregateOutput, "insertedSnapshotCount"),
      updatedSnapshotCount: getNumber(aggregateOutput, "updatedSnapshotCount"),
      writtenSnapshotCount: getNumber(aggregateOutput, "writtenSnapshotCount"),
      before: getNumber(aggregateOutput, "metricSnapshotsBefore"),
      after: getNumber(aggregateOutput, "metricSnapshotsAfter")
    },
    recommendationCandidates: {
      status: generateOutput ? noCandidates ? "skipped_no_candidates" : "generated" : "not_requested",
      candidateCount,
      outputJson: generateOutput ? getOutputPath(generateOutput, "run_json") : null,
      outputMarkdown: generateOutput ? getOutputPath(generateOutput, "run_markdown") : null
    },
    recommendationSaveDryRun: {
      status: saveDryRunOutput ? "completed" : noCandidates ? "skipped_no_candidates" : "not_run",
      insertTargetCount: saveDryRunOutput ? getNumber(saveDryRunOutput, "insertTargetCount") : null,
      skippedCount: saveDryRunOutput ? getNumber(saveDryRunOutput, "skippedCount") : null,
      duplicateCount: saveDryRunOutput ? getNumber(saveDryRunOutput, "duplicateCount") : null,
      recommendationsBefore: saveDryRunOutput ? getNumber(saveDryRunOutput, "recommendationsBefore") : null,
      recommendationsAfter: saveDryRunOutput ? getNumber(saveDryRunOutput, "recommendationsAfter") : null,
      databaseWritePerformed: saveDryRunOutput ? getBoolean(saveDryRunOutput, "databaseWritePerformed") : null
    },
    recommendationSaveApply: {
      status: saveApplyOutput ? "completed" : noCandidates ? "skipped_no_candidates" : "not_requested",
      insertedCount: saveApplyOutput ? getNumber(saveApplyOutput, "insertedCount") : null,
      savedCandidateIds: saveApplyOutput ? getStringArray(saveApplyOutput, "savedCandidateIds") : [],
      recommendationsBefore: saveApplyOutput ? getNumber(saveApplyOutput, "recommendationsBefore") : null,
      recommendationsAfter: saveApplyOutput ? getNumber(saveApplyOutput, "recommendationsAfter") : null,
      databaseWritePerformed: saveApplyOutput ? getBoolean(saveApplyOutput, "databaseWritePerformed") : null
    },
    dashboardUrls: buildDashboardUrls(options.projectSlug),
    safety: {
      openAiApiExecuted: false,
      localDatabaseOnly: true,
      databaseHost: input.database.host,
      databasePort: input.database.port,
      planDefault: !options.applyAggregate && !options.generateRecommendations && !options.applyRecommendations,
      applyAggregateRequiredForMetricSnapshotWrite: true,
      applyRecommendationsRequiredForRecommendationWrite: true,
      recommendationPolicy: "Only display_decision=show and should_save_to_recommendations=review_required candidates can be saved by the child save script."
    },
    commands: {
      aggregate: describeChildCommand(input.aggregateCommand),
      generateRecommendations: input.generateCommand ? describeChildCommand(input.generateCommand) : null,
      saveRecommendationsDryRun: input.saveDryRunCommand ? describeChildCommand(input.saveDryRunCommand) : null,
      saveRecommendationsApply: input.saveApplyCommand ? describeChildCommand(input.saveApplyCommand) : null
    },
    manifestPath: input.manifestPath
  };
}

function resolveMode(options: Options) {
  if (options.plan || (!options.applyAggregate && !options.generateRecommendations && !options.applyRecommendations)) return "plan";
  if (options.applyRecommendations) return "apply-aggregate-generate-and-save";
  if (options.generateRecommendations) return options.applyAggregate ? "apply-aggregate-and-generate" : "aggregate-dry-run-and-generate";
  if (options.applyAggregate) return "apply-aggregate";
  return "plan";
}

function resolveAggregateRunId(output: JsonRecord) {
  const direct = getString(output, "aggregateRunId");
  if (direct) return direct;
  const existing = asRecord(output.existingAggregate);
  return getString(existing, "id");
}

function assertAggregateSourceMatches(output: JsonRecord, measurementRunId: string) {
  const selectedSourceRunId = getString(output, "selectedSourceRunId");
  const selectedSourceRunStatus = getString(output, "selectedSourceRunStatus");
  if (selectedSourceRunId !== measurementRunId) {
    throw new Error("Aggregate dry-run/apply did not select the requested measurementRunId.");
  }
  if (selectedSourceRunStatus !== "completed") {
    throw new Error(`Selected measurement run must be completed. Actual status: ${selectedSourceRunStatus ?? "unknown"}.`);
  }
}

function getGeneratedCandidateInputPath(output: JsonRecord, outputDir: string, measurementRunId: string) {
  const runJson = getOutputPath(output, "run_json");
  if (runJson) return runJson;
  return path.join(outputDir, measurementRunId, "recommendation-candidates.json");
}

function getOutputPath(output: JsonRecord, key: "json" | "markdown" | "run_json" | "run_markdown") {
  const outputRecord = asRecord(output.output);
  const value = outputRecord[key];
  return typeof value === "string" ? value : null;
}

function buildDashboardUrls(projectSlug: string) {
  return {
    dashboard: "/dashboard",
    reports: "/dashboard/reports",
    reportOverview: `/dashboard/reports/${projectSlug}`,
    conversations: `/dashboard/reports/${projectSlug}/conversations`,
    leaderboard: `/dashboard/reports/${projectSlug}/leaderboard`,
    sources: `/dashboard/reports/${projectSlug}/sources`,
    recommendations: `/dashboard/reports/${projectSlug}/recommendations`,
    runs: `/dashboard/reports/${projectSlug}/runs`
  };
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

function getStringArray(record: JsonRecord, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isAggregateSearchMode(value: string): value is AggregateSearchMode {
  return value === "combined" || value === "no-search" || value === "web-search" || value === "both";
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`Usage:
  npx tsx scripts/run-recora-report-cycle.ts --project-slug mieruca-seo-demo --measurement-run-id <id> --plan
  npx tsx scripts/run-recora-report-cycle.ts --project-slug mieruca-seo-demo --measurement-run-id <id> --apply-aggregate --generate-recommendations
  npx tsx scripts/run-recora-report-cycle.ts --project-slug mieruca-seo-demo --measurement-run-id <id> --apply-aggregate --generate-recommendations --apply-recommendations

Options:
  --project-slug <slug>           Required Recora project slug.
  --measurement-run-id <id>       Required completed OpenAI measurement run id.
  --plan                          Validate and write a plan manifest only. This is the default when no action flags are set.
  --apply-aggregate               Persist metric_snapshots through recalculate-metric-snapshots.ts.
  --generate-recommendations      Generate recommendation candidate JSON/Markdown output.
  --apply-recommendations         Persist recommendations after a dry-run save check. Requires --generate-recommendations.
  --aggregate-search-mode <mode>  combined, no-search, web-search, or both. Default: combined.
  --output-dir <path>             Optional manifest/output directory.

Safety:
  This MVP never runs OpenAI measurement. It forces RECORA_DATABASE_URL to a local PostgreSQL URL for child scripts and refuses non-local RECORA_DATABASE_URL values.
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
