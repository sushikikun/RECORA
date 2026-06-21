import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  assertRecoraDbWriteAllowed,
  createRecoraDbWriteGuardCliOptions,
  parseRecoraDbWriteGuardArg
} from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_AGGREGATE_SEARCH_MODE: AggregateSearchMode = "combined";
const DEFAULT_MEASUREMENT_SEARCH_MODE: MeasurementSearchMode = "both";
const DEFAULT_PROMPT_LIMIT = 1;
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type MeasurementSearchMode = "no-search" | "web-search" | "both";
type AggregateSearchMode = "combined" | "no-search" | "web-search" | "both";
type JsonRecord = Record<string, unknown>;
type PhaseStatus = "not_requested" | "planned_not_executed" | "completed" | "skipped_no_candidates";

type Options = {
  projectSlug: string;
  measurementRunId: string | null;
  executeMeasurement: boolean;
  promptLimit: number;
  promptLimitProvided: boolean;
  profileId: string | null;
  measurementSearchMode: MeasurementSearchMode;
  plan: boolean;
  applyAggregate: boolean;
  generateRecommendations: boolean;
  applyRecommendations: boolean;
  aggregateSearchMode: AggregateSearchMode;
  outputDir: string | null;
  allowNonLocalDb: boolean;
  confirmNonLocalDbWrite: string | null;
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

type ResolvedDatabase = {
  url: string;
  host: string;
  port: string;
  isLocal: boolean;
};

type ManifestCommand = ReturnType<typeof describeChildCommand>;

type CycleManifest = {
  mode: string;
  generatedAt: string;
  projectSlug: string;
  measurementRunId: string | null;
  aggregateRunId: string | null;
  measurementSearchMode: MeasurementSearchMode;
  aggregateSearchMode: AggregateSearchMode;
  demoSeedCheck: {
    status: PhaseStatus;
    note: string;
  };
  measurement: {
    status: PhaseStatus;
    runStatus: string | null;
    openAiApiExecuted: boolean;
    promptLimit: number | null;
    promptCount: number | null;
    expectedRunItems: number | null;
    insertedCounts: {
      runItemsCreated: number | null;
      aiConversationsInserted: number | null;
      brandMentionsInserted: number | null;
      citationsInserted: number | null;
      sourceDomainsUpserted: number | null;
      failedItems: number | null;
      skippedDuplicates: number | null;
    } | null;
  };
  counts: {
    aiConversations: number | null;
    brandMentions: number | null;
    citations: number | null;
    sourceDomains: number | null;
  };
  metricSnapshots: {
    status: PhaseStatus;
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
    status: PhaseStatus;
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
    status: PhaseStatus;
    insertedCount: number | null;
    savedCandidateIds: string[];
    recommendationsBefore: number | null;
    recommendationsAfter: number | null;
    databaseWritePerformed: boolean | null;
  };
  dashboardUrls: ReturnType<typeof buildDashboardUrls>;
  safety: {
    openAiApiExecuted: boolean;
    databaseIsLocal: boolean;
    databaseHost: string;
    databasePort: string;
    databaseWriteIntent: boolean;
    planDefault: boolean;
    executeMeasurementRequiredForOpenAi: boolean;
    applyAggregateRequiredForMetricSnapshotWrite: boolean;
    applyRecommendationsRequiredForRecommendationWrite: boolean;
    nonLocalPlanAllowed: boolean;
    nonLocalWritesRequireConfirmation: boolean;
    recommendationPolicy: string;
  };
  commands: {
    measurement: ManifestCommand | null;
    aggregate: ManifestCommand | null;
    generateRecommendations: ManifestCommand | null;
    saveRecommendationsDryRun: ManifestCommand | null;
    saveRecommendationsApply: ManifestCommand | null;
  };
  manifestPath: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const database = resolveDatabase(options);
  const outputDir = resolveOutputDir(options);
  const manifestPath = path.join(outputDir, "manifest.json");
  const childEnv = {
    ...process.env,
    RECORA_DATABASE_URL: database.url
  };

  await fs.mkdir(outputDir, { recursive: true });

  const measurementCommand = buildMeasurementCommand(options);
  let measurementResult: CommandResult | null = null;
  let selectedMeasurementRunId = options.measurementRunId;

  if (options.executeMeasurement) {
    measurementResult = await runJsonCommand(measurementCommand, childEnv);
    selectedMeasurementRunId = getString(measurementResult.output, "measurementRunId");
    assertExecutedMeasurementIsUsable(measurementResult.output, selectedMeasurementRunId);
  }

  let aggregateCommand: ChildScriptCommand | null = null;
  let aggregateResult: CommandResult | null = null;
  let aggregateRunId: string | null = null;
  let generateCommand: ChildScriptCommand | null = null;
  let generateResult: CommandResult | null = null;
  let saveDryRunCommand: ChildScriptCommand | null = null;
  let saveDryRunResult: CommandResult | null = null;
  let saveApplyCommand: ChildScriptCommand | null = null;
  let saveApplyResult: CommandResult | null = null;

  if (selectedMeasurementRunId) {
    aggregateCommand = buildAggregateCommand(options, selectedMeasurementRunId, path.join(outputDir, "aggregate.json"));
    aggregateResult = await runJsonCommand(aggregateCommand, childEnv);
    assertAggregateSourceMatches(aggregateResult.output, selectedMeasurementRunId);
    aggregateRunId = resolveAggregateRunId(aggregateResult.output);
  }

  if (options.generateRecommendations) {
    if (!selectedMeasurementRunId) {
      throw new Error("Recommendation generation requires a measurement run. Use --measurement-run-id or --execute-measurement.");
    }
    if (!aggregateRunId) {
      throw new Error(
        "Recommendation generation requires an aggregate run linked by source_run_id. Run with --apply-aggregate or use a measurement run that already has an aggregate."
      );
    }
    const candidateOutputDir = path.join(outputDir, "recommendation-candidates");
    generateCommand = buildGenerateRecommendationsCommand(options, selectedMeasurementRunId, aggregateRunId, candidateOutputDir);
    generateResult = await runJsonCommand(generateCommand, childEnv);

    const candidateCount = getNumber(generateResult.output, "candidateCount") ?? 0;
    if (candidateCount > 0) {
      const candidateInputPath = getGeneratedCandidateInputPath(generateResult.output, candidateOutputDir, selectedMeasurementRunId);
      saveDryRunCommand = buildSaveRecommendationsCommand(candidateInputPath, false, options);
      saveDryRunResult = await runJsonCommand(saveDryRunCommand, childEnv);

      if (options.applyRecommendations) {
        saveApplyCommand = buildSaveRecommendationsCommand(candidateInputPath, true, options);
        saveApplyResult = await runJsonCommand(saveApplyCommand, childEnv);
      }
    }
  }

  const manifest = buildManifest({
    options,
    database,
    measurementCommand,
    measurementOutput: measurementResult?.output ?? null,
    measurementRunId: selectedMeasurementRunId,
    aggregateCommand,
    aggregateOutput: aggregateResult?.output ?? null,
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
  const guardOptions = createRecoraDbWriteGuardCliOptions();
  const options: Options = {
    projectSlug: "",
    measurementRunId: null,
    executeMeasurement: false,
    promptLimit: DEFAULT_PROMPT_LIMIT,
    promptLimitProvided: false,
    profileId: null,
    measurementSearchMode: DEFAULT_MEASUREMENT_SEARCH_MODE,
    plan: false,
    applyAggregate: false,
    generateRecommendations: false,
    applyRecommendations: false,
    aggregateSearchMode: DEFAULT_AGGREGATE_SEARCH_MODE,
    outputDir: null,
    allowNonLocalDb: guardOptions.allowNonLocalDb,
    confirmNonLocalDbWrite: guardOptions.confirmNonLocalDbWrite
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    const guardConsumed = parseRecoraDbWriteGuardArg(args, index, options);
    if (guardConsumed > 0) {
      index += guardConsumed - 1;
      continue;
    }

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
    if (arg === "--execute-measurement") {
      options.executeMeasurement = true;
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
    if (arg.startsWith("--prompt-limit=")) {
      const parsed = Number(arg.slice("--prompt-limit=".length));
      if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--prompt-limit must be a positive integer.");
      options.promptLimit = parsed;
      options.promptLimitProvided = true;
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
      if (!isMeasurementSearchMode(next)) throw new Error("--search-mode must be no-search, web-search, or both.");
      options.measurementSearchMode = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--search-mode=")) {
      const value = arg.slice("--search-mode=".length);
      if (!isMeasurementSearchMode(value)) throw new Error("--search-mode must be no-search, web-search, or both.");
      options.measurementSearchMode = value;
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
  if (options.measurementRunId && options.executeMeasurement) {
    throw new Error("--measurement-run-id and --execute-measurement cannot be used together.");
  }
  if (!options.measurementRunId && !options.executeMeasurement && !options.plan) {
    throw new Error("Use --measurement-run-id, --execute-measurement, or --plan.");
  }
  if (options.profileId && options.promptLimitProvided) {
    throw new Error("--profile and --prompt-limit cannot be used together.");
  }
  if (options.plan && (options.applyAggregate || options.generateRecommendations || options.applyRecommendations || options.executeMeasurement)) {
    throw new Error("--plan cannot be combined with execute, apply, or generation flags.");
  }
  if (options.applyRecommendations && !options.generateRecommendations) {
    throw new Error("--apply-recommendations requires --generate-recommendations.");
  }

  return options;
}

function resolveDatabase(options: Options): ResolvedDatabase {
  const url = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const parsed = parseDatabaseUrl(url);
  const isLocal = LOCAL_DATABASE_HOSTS.has(parsed.hostname);
  assertRecoraDbWriteAllowed({
    databaseUrl: url,
    operation: "run-recora-report-cycle write phase",
    projectSlug: options.projectSlug,
    isWrite: hasDatabaseWriteIntent(options),
    allowNonLocalDb: options.allowNonLocalDb,
    confirmNonLocalDbWrite: options.confirmNonLocalDbWrite
  });
  return {
    url,
    host: parsed.hostname,
    port: parsed.port || "5432",
    isLocal
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
  const runShort = options.measurementRunId ? options.measurementRunId.slice(0, 8) : "new-run";
  return path.join(process.cwd(), "output", "report-cycles", `${options.projectSlug}-${runShort}-${timestamp}`);
}

function buildMeasurementCommand(options: Options) {
  const promptSelectionArgs = options.profileId
    ? ["--profile", options.profileId]
    : ["--prompt-limit", String(options.promptLimit)];
  return buildChildScriptCommand("OpenAI measurement", "scripts/run-openai-measurement.ts", [
    "--project-slug",
    options.projectSlug,
    ...promptSelectionArgs,
    "--search-mode",
    options.measurementSearchMode,
    ...buildNonLocalDbWriteGuardArgs(options)
  ]);
}

function buildAggregateCommand(options: Options, measurementRunId: string, outputJsonPath: string) {
  const args = [
    "--project-slug",
    options.projectSlug,
    "--source-run-id",
    measurementRunId,
    "--search-mode",
    options.aggregateSearchMode,
    "--output-json",
    outputJsonPath
  ];
  if (options.applyAggregate) {
    args.push("--apply", ...buildNonLocalDbWriteGuardArgs(options));
  }
  return buildChildScriptCommand("metric snapshot aggregate", "scripts/recalculate-metric-snapshots.ts", args);
}

function buildGenerateRecommendationsCommand(options: Options, measurementRunId: string, aggregateRunId: string, outputDir: string) {
  return buildChildScriptCommand("recommendation candidates generation", "scripts/generate-recommendation-candidates.ts", [
    "--project-slug",
    options.projectSlug,
    "--measurement-run-id",
    measurementRunId,
    "--aggregate-run-id",
    aggregateRunId,
    "--output-dir",
    outputDir
  ]);
}

function buildSaveRecommendationsCommand(inputPath: string, apply: boolean, options: Options) {
  const args = ["--input", inputPath];
  args.push(apply ? "--apply" : "--dry-run");
  if (apply) args.push(...buildNonLocalDbWriteGuardArgs(options));
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
  database: ResolvedDatabase;
  measurementCommand: ChildScriptCommand;
  measurementOutput: JsonRecord | null;
  measurementRunId: string | null;
  aggregateCommand: ChildScriptCommand | null;
  aggregateOutput: JsonRecord | null;
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
  const measurementTotals = input.measurementOutput ? asRecord(input.measurementOutput.totals) : {};
  return {
    mode: resolveMode(options),
    generatedAt: new Date().toISOString(),
    projectSlug: options.projectSlug,
    measurementRunId: input.measurementRunId,
    aggregateRunId: input.aggregateRunId,
    measurementSearchMode: options.measurementSearchMode,
    aggregateSearchMode: options.aggregateSearchMode,
    demoSeedCheck: {
      status: resolveDemoSeedCheckStatus(options, input.measurementRunId),
      note: "Demo seed/project readiness is validated by run-openai-measurement.ts before any OpenAI call: project, prompts, personas, and brands must exist. This orchestrator does not create or mix seed data."
    },
    measurement: {
      status: input.measurementOutput ? "completed" : options.executeMeasurement ? "not_requested" : "planned_not_executed",
      runStatus: input.measurementOutput ? getString(input.measurementOutput, "runStatus") : null,
      openAiApiExecuted: Boolean(input.measurementOutput),
      promptLimit: input.measurementOutput ? getNumber(input.measurementOutput, "promptLimit") : options.profileId ? null : options.promptLimit,
      promptCount: input.measurementOutput ? getNumber(input.measurementOutput, "promptCount") : null,
      expectedRunItems: input.measurementOutput ? getNumber(input.measurementOutput, "expectedRunItems") : null,
      insertedCounts: input.measurementOutput
        ? {
            runItemsCreated: getNumber(measurementTotals, "runItemsCreated"),
            aiConversationsInserted: getNumber(measurementTotals, "aiConversationsInserted"),
            brandMentionsInserted: getNumber(measurementTotals, "brandMentionsInserted"),
            citationsInserted: getNumber(measurementTotals, "citationsInserted"),
            sourceDomainsUpserted: getNumber(measurementTotals, "sourceDomainsUpserted"),
            failedItems: getNumber(measurementTotals, "failedItems"),
            skippedDuplicates: getNumber(measurementTotals, "skippedDuplicates")
          }
        : null
    },
    counts: {
      aiConversations: aggregateOutput ? getNumber(aggregateOutput, "conversationCount") : null,
      brandMentions: aggregateOutput ? getNumber(aggregateOutput, "brandMentionCount") : null,
      citations: aggregateOutput ? getNumber(aggregateOutput, "citationCount") : null,
      sourceDomains: aggregateOutput ? getNumber(aggregateOutput, "sourceDomainCount") : null
    },
    metricSnapshots: {
      status: aggregateOutput ? "completed" : "planned_not_executed",
      mode: aggregateOutput ? getString(aggregateOutput, "mode") : null,
      databaseWriteAllowed: aggregateOutput ? getBoolean(aggregateOutput, "databaseWriteAllowed") : null,
      databaseWritePerformed: aggregateOutput ? getBoolean(aggregateOutput, "databaseWritePerformed") : null,
      insertedSnapshotCount: aggregateOutput ? getNumber(aggregateOutput, "insertedSnapshotCount") : null,
      updatedSnapshotCount: aggregateOutput ? getNumber(aggregateOutput, "updatedSnapshotCount") : null,
      writtenSnapshotCount: aggregateOutput ? getNumber(aggregateOutput, "writtenSnapshotCount") : null,
      before: aggregateOutput ? getNumber(aggregateOutput, "metricSnapshotsBefore") : null,
      after: aggregateOutput ? getNumber(aggregateOutput, "metricSnapshotsAfter") : null
    },
    recommendationCandidates: {
      status: generateOutput ? noCandidates ? "skipped_no_candidates" : "completed" : options.generateRecommendations ? "planned_not_executed" : "not_requested",
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
      status: saveApplyOutput ? "completed" : noCandidates ? "skipped_no_candidates" : options.applyRecommendations ? "planned_not_executed" : "not_requested",
      insertedCount: saveApplyOutput ? getNumber(saveApplyOutput, "insertedCount") : null,
      savedCandidateIds: saveApplyOutput ? getStringArray(saveApplyOutput, "savedCandidateIds") : [],
      recommendationsBefore: saveApplyOutput ? getNumber(saveApplyOutput, "recommendationsBefore") : null,
      recommendationsAfter: saveApplyOutput ? getNumber(saveApplyOutput, "recommendationsAfter") : null,
      databaseWritePerformed: saveApplyOutput ? getBoolean(saveApplyOutput, "databaseWritePerformed") : null
    },
    dashboardUrls: buildDashboardUrls(options.projectSlug),
    safety: {
      openAiApiExecuted: Boolean(input.measurementOutput),
      databaseIsLocal: input.database.isLocal,
      databaseHost: input.database.host,
      databasePort: input.database.port,
      databaseWriteIntent: hasDatabaseWriteIntent(options),
      planDefault: isPlanOnly(options),
      executeMeasurementRequiredForOpenAi: true,
      applyAggregateRequiredForMetricSnapshotWrite: true,
      applyRecommendationsRequiredForRecommendationWrite: true,
      nonLocalPlanAllowed: true,
      nonLocalWritesRequireConfirmation: true,
      recommendationPolicy: "Only display_decision=show and should_save_to_recommendations=review_required candidates can be saved by the child save script."
    },
    commands: {
      measurement: describeChildCommand(input.measurementCommand),
      aggregate: input.aggregateCommand ? describeChildCommand(input.aggregateCommand) : null,
      generateRecommendations: input.generateCommand ? describeChildCommand(input.generateCommand) : null,
      saveRecommendationsDryRun: input.saveDryRunCommand ? describeChildCommand(input.saveDryRunCommand) : null,
      saveRecommendationsApply: input.saveApplyCommand ? describeChildCommand(input.saveApplyCommand) : null
    },
    manifestPath: input.manifestPath
  };
}

function resolveMode(options: Options) {
  if (isPlanOnly(options)) return "plan";
  if (options.executeMeasurement && options.applyRecommendations) return "execute-measurement-aggregate-generate-and-save";
  if (options.executeMeasurement && options.generateRecommendations) return "execute-measurement-aggregate-and-generate";
  if (options.executeMeasurement) return options.applyAggregate ? "execute-measurement-and-apply-aggregate" : "execute-measurement-aggregate-dry-run";
  if (options.applyRecommendations) return "apply-aggregate-generate-and-save";
  if (options.generateRecommendations) return options.applyAggregate ? "apply-aggregate-and-generate" : "aggregate-dry-run-and-generate";
  if (options.applyAggregate) return "apply-aggregate";
  return "plan";
}

function isPlanOnly(options: Options) {
  return options.plan || (!options.measurementRunId && !options.executeMeasurement && !options.applyAggregate && !options.generateRecommendations && !options.applyRecommendations);
}

function hasDatabaseWriteIntent(options: Options) {
  return options.executeMeasurement || options.applyAggregate || options.applyRecommendations;
}

function buildNonLocalDbWriteGuardArgs(options: Options) {
  const args: string[] = [];
  if (options.allowNonLocalDb) args.push("--allow-non-local-db");
  if (options.confirmNonLocalDbWrite) {
    args.push("--confirm-non-local-db-write", options.confirmNonLocalDbWrite);
  }
  return args;
}

function resolveDemoSeedCheckStatus(options: Options, measurementRunId: string | null): PhaseStatus {
  if (options.plan) return "planned_not_executed";
  if (options.executeMeasurement && measurementRunId) return "completed";
  if (measurementRunId) return "completed";
  return "not_requested";
}

function resolveAggregateRunId(output: JsonRecord) {
  const direct = getString(output, "aggregateRunId");
  if (direct) return direct;
  const existing = asRecord(output.existingAggregate);
  return getString(existing, "id");
}

function assertExecutedMeasurementIsUsable(output: JsonRecord, measurementRunId: string | null) {
  if (!measurementRunId) throw new Error("OpenAI measurement completed without measurementRunId in output.");
  const runStatus = getString(output, "runStatus");
  if (runStatus !== "completed") throw new Error(`OpenAI measurement did not complete successfully. runStatus=${runStatus ?? "unknown"}.`);
  const totals = asRecord(output.totals);
  const insertedConversations = getNumber(totals, "aiConversationsInserted") ?? 0;
  if (insertedConversations <= 0) {
    throw new Error("OpenAI measurement produced no new ai_conversations. Stopping before aggregate to avoid an empty source run.");
  }
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

function isMeasurementSearchMode(value: string): value is MeasurementSearchMode {
  return value === "no-search" || value === "web-search" || value === "both";
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
  npx tsx scripts/run-recora-report-cycle.ts --project-slug mieruca-seo-demo --execute-measurement --prompt-limit 8 --search-mode both --apply-aggregate --generate-recommendations --apply-recommendations

Options:
  --project-slug <slug>           Required Recora project slug.
  --measurement-run-id <id>       Reuse an existing completed OpenAI measurement run.
  --execute-measurement           Create a new OpenAI measurement run before aggregate. Mutually exclusive with --measurement-run-id.
  --prompt-limit <number>         Prompt count for new measurement. Default: 1.
  --profile <id>                  Measurement profile for new measurement. Cannot be combined with --prompt-limit.
  --search-mode <mode>            Measurement search mode: no-search, web-search, or both. Default: both.
  --plan                          Write a plan manifest only. No OpenAI call and no DB write.
  --apply-aggregate               Persist metric_snapshots through recalculate-metric-snapshots.ts.
  --generate-recommendations      Generate recommendation candidate JSON/Markdown output.
  --apply-recommendations         Persist recommendations after a dry-run save check. Requires --generate-recommendations.
  --aggregate-search-mode <mode>  combined, no-search, web-search, or both. Default: combined.
  --output-dir <path>             Optional manifest/output directory.
  --allow-non-local-db            Permit non-local DB write phases only with the confirmation flag below.
  --confirm-non-local-db-write    Required confirmation for non-local write phases. Expected: write:<projectSlug>.

Safety:
  --plan is allowed against non-local RECORA_DATABASE_URL for read-only connection checks.
  OpenAI measurement runs only with --execute-measurement.
  Non-local DB writes require --allow-non-local-db and --confirm-non-local-db-write write:<projectSlug>.
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
