import fs from "node:fs/promises";
import process from "node:process";
import {
  getMeasurementProfile,
  getMeasurementProfileIds,
  getSearchModeRunItemMultiplier,
  isMeasurementProfileId,
  type MeasurementProfileSearchMode
} from "../lib/recora/measurement-profiles";

type StageStatus = "blocked" | "ready_for_manual_execution" | "pending_review";
type ReportReadyGateStatus = "customer_ready" | "not_ready" | "unknown";

type OrganizationInput = {
  organizationType?: unknown;
  organization_type?: unknown;
  dataEnvironment?: unknown;
  data_environment?: unknown;
  isInternal?: unknown;
  is_internal?: unknown;
  isDemo?: unknown;
  is_demo?: unknown;
};

type PromptInventoryInput = {
  total?: unknown;
  nonBranded?: unknown;
  branded?: unknown;
  citationCheck?: unknown;
};

type PlanInput = {
  projectSlug?: unknown;
  organization?: unknown;
  measurementProfileId?: unknown;
  promptSetVersion?: unknown;
  searchMode?: unknown;
  models?: unknown;
  promptInventory?: unknown;
  expectedAnswersPerPrompt?: unknown;
  recommendationReviewRequired?: unknown;
  reportPath?: unknown;
  sourceMeasurementRunId?: unknown;
  aggregateRunId?: unknown;
  metricSnapshotCount?: unknown;
  validObservationCount?: unknown;
  recommendationCandidatePath?: unknown;
  recommendationCandidateCount?: unknown;
  customerVisibleRecommendationCount?: unknown;
  reportReadyGateStatus?: unknown;
};

type NormalizedOrganization = {
  organizationType: string | null;
  dataEnvironment: string | null;
  isInternal: boolean | null;
  isDemo: boolean | null;
  customerDataBoundarySatisfied: boolean;
};

type NormalizedPromptInventory = {
  total: number;
  nonBranded: number;
  branded: number;
  citationCheck: number;
  otherOrUnclassified: number;
};

type NormalizedPlanInput = {
  projectSlug: string;
  organization: NormalizedOrganization;
  measurementProfileId: string;
  promptSetVersion: string;
  searchMode: MeasurementProfileSearchMode;
  models: string[];
  promptInventory: NormalizedPromptInventory;
  expectedAnswersPerPrompt: number;
  recommendationReviewRequired: boolean;
  reportPath: string;
  sourceMeasurementRunId: string | null;
  aggregateRunId: string | null;
  metricSnapshotCount: number;
  validObservationCount: number;
  recommendationCandidatePath: string | null;
  recommendationCandidateCount: number;
  customerVisibleRecommendationCount: number;
  reportReadyGateStatus: ReportReadyGateStatus;
};

type PlannedCommand = {
  label: string;
  command: string;
  executesInThisScript: false;
  notes: string[];
};

type PlannedStage = {
  id:
    | "bootstrap_review"
    | "prompt_taxonomy_review"
    | "measurement_preflight"
    | "measurement_execution"
    | "aggregate_generation"
    | "metric_snapshot_validation"
    | "recommendation_generation"
    | "recommendation_review"
    | "report_ready_check"
    | "customer_url_share";
  status: StageStatus;
  prerequisites: string[];
  plannedCommand: string | null;
  expectedOutput: string;
  blockingConditions: string[];
  administratorApprovalRequired: boolean;
};

const SAMPLE_INPUT = {
  projectSlug: "example-client-ai-search",
  organization: {
    organization_type: "client",
    data_environment: "production",
    is_internal: false,
    is_demo: false
  },
  measurementProfileId: "standard-v01",
  promptSetVersion: "example-client-v1",
  searchMode: "both",
  models: ["gpt-4.1-mini"],
  promptInventory: {
    total: 10,
    nonBranded: 6,
    branded: 2,
    citationCheck: 2
  },
  expectedAnswersPerPrompt: 2,
  recommendationReviewRequired: true,
  reportPath: "/dashboard/reports/example-client-ai-search",
  sourceMeasurementRunId: null,
  aggregateRunId: null,
  metricSnapshotCount: 0,
  validObservationCount: 0,
  recommendationCandidatePath: null,
  recommendationCandidateCount: 0,
  customerVisibleRecommendationCount: 0,
  reportReadyGateStatus: "not_ready"
} as const;

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "projectSlug",
  "organization",
  "measurementProfileId",
  "promptSetVersion",
  "searchMode",
  "models",
  "promptInventory",
  "expectedAnswersPerPrompt",
  "recommendationReviewRequired",
  "reportPath",
  "sourceMeasurementRunId",
  "aggregateRunId",
  "metricSnapshotCount",
  "validObservationCount",
  "recommendationCandidatePath",
  "recommendationCandidateCount",
  "customerVisibleRecommendationCount",
  "reportReadyGateStatus"
]);

const ALLOWED_ORGANIZATION_KEYS = new Set([
  "organizationType",
  "organization_type",
  "dataEnvironment",
  "data_environment",
  "isInternal",
  "is_internal",
  "isDemo",
  "is_demo"
]);

const ALLOWED_PROMPT_INVENTORY_KEYS = new Set(["total", "nonBranded", "branded", "citationCheck"]);

const FORBIDDEN_KEY_PARTS = [
  "secret",
  "api_key",
  "apikey",
  "token",
  "password",
  "credential",
  "connection_string",
  "connectionstring",
  "database_url",
  "databaseurl",
  "db_url",
  "dburl",
  "service_role",
  "servicerole",
  "supabase_url",
  "supabaseurl",
  "openai_api_key",
  "openaiapikey"
];

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.printSample) {
    printJson(SAMPLE_INPUT);
    return;
  }

  if (!options.inputPath) {
    throw new Error("Use --print-sample or --input <json>.");
  }

  const input = await readInput(options.inputPath);
  const normalized = normalizeInput(input);
  const plan = buildPlan(normalized);
  printJson(plan);
}

function parseArgs(args: string[]) {
  const options = {
    printSample: false,
    inputPath: null as string | null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--print-sample") {
      options.printSample = true;
      continue;
    }
    if (arg === "--input") {
      if (!next || next.startsWith("--")) throw new Error("--input requires a JSON file path.");
      options.inputPath = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--input=")) {
      const value = arg.slice("--input=".length);
      if (!value) throw new Error("--input requires a JSON file path.");
      options.inputPath = value;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.printSample && options.inputPath) {
    throw new Error("--print-sample and --input cannot be used together.");
  }

  return options;
}

async function readInput(inputPath: string): Promise<PlanInput> {
  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw.replace(/^\uFEFF/, "")) as unknown;
  if (!isRecord(parsed)) throw new Error("Input JSON must be an object.");
  rejectForbiddenKeys(parsed);
  rejectUnknownKeys(parsed, ALLOWED_TOP_LEVEL_KEYS, "input");
  return parsed;
}

function normalizeInput(input: PlanInput): NormalizedPlanInput {
  const projectSlug = requireString(input.projectSlug, "projectSlug");
  validateProjectSlug(projectSlug);

  const organization = normalizeOrganization(input.organization);
  const measurementProfileId = requireString(input.measurementProfileId, "measurementProfileId");
  if (!isMeasurementProfileId(measurementProfileId)) {
    throw new Error(`measurementProfileId must be one of: ${getMeasurementProfileIds().join(", ")}.`);
  }

  const promptSetVersion = requireString(input.promptSetVersion, "promptSetVersion");
  validatePromptSetVersion(promptSetVersion);

  const searchMode = requireSearchMode(input.searchMode);
  const models = requireStringArray(input.models, "models");
  const promptInventory = normalizePromptInventory(input.promptInventory);
  const expectedAnswersPerPrompt = requireNonNegativeInteger(input.expectedAnswersPerPrompt, "expectedAnswersPerPrompt");
  if (expectedAnswersPerPrompt < 1) throw new Error("expectedAnswersPerPrompt must be at least 1.");

  const reportPath = requireString(input.reportPath, "reportPath");
  if (!reportPath.startsWith(`/dashboard/reports/${projectSlug}`)) {
    throw new Error(`reportPath must start with /dashboard/reports/${projectSlug}.`);
  }

  return {
    projectSlug,
    organization,
    measurementProfileId,
    promptSetVersion,
    searchMode,
    models,
    promptInventory,
    expectedAnswersPerPrompt,
    recommendationReviewRequired: requireBoolean(input.recommendationReviewRequired, "recommendationReviewRequired"),
    reportPath,
    sourceMeasurementRunId: optionalString(input.sourceMeasurementRunId, "sourceMeasurementRunId"),
    aggregateRunId: optionalString(input.aggregateRunId, "aggregateRunId"),
    metricSnapshotCount: optionalNonNegativeInteger(input.metricSnapshotCount, "metricSnapshotCount"),
    validObservationCount: optionalNonNegativeInteger(input.validObservationCount, "validObservationCount"),
    recommendationCandidatePath: optionalString(input.recommendationCandidatePath, "recommendationCandidatePath"),
    recommendationCandidateCount: optionalNonNegativeInteger(input.recommendationCandidateCount, "recommendationCandidateCount"),
    customerVisibleRecommendationCount: optionalNonNegativeInteger(
      input.customerVisibleRecommendationCount,
      "customerVisibleRecommendationCount"
    ),
    reportReadyGateStatus: normalizeReportReadyGateStatus(input.reportReadyGateStatus)
  };
}

function buildPlan(input: NormalizedPlanInput) {
  const profile = getMeasurementProfile(input.measurementProfileId);
  if (!profile) throw new Error(`Unknown measurement profile: ${input.measurementProfileId}`);

  const derivedAnswersPerPrompt = getSearchModeRunItemMultiplier(input.searchMode);
  const expectedAnswerCount = input.promptInventory.total * input.models.length * input.expectedAnswersPerPrompt;
  const profilePromptCountMatches = profile.promptCount === input.promptInventory.total;
  const expectedAnswersMatchSearchMode = input.expectedAnswersPerPrompt === derivedAnswersPerPrompt;
  const promptTaxonomyIsComplete = input.promptInventory.otherOrUnclassified === 0;
  const visibilityMetricEligiblePromptCount = input.promptInventory.nonBranded;
  const sentimentReviewPromptCount = input.promptInventory.branded;
  const citationReviewPromptCount = input.promptInventory.citationCheck;

  const commands = buildCommands(input);
  const stages = buildStages(input, {
    profilePromptCountMatches,
    expectedAnswersMatchSearchMode,
    promptTaxonomyIsComplete,
    commands
  });
  const urlSharingEligible = input.reportReadyGateStatus === "customer_ready";

  return {
    mode: "plan_only",
    generatedAt: new Date().toISOString(),
    executionPolicy: {
      commandsAreNotExecuted: true,
      openAiCallsAttempted: false,
      databaseConnectionsAttempted: false,
      databaseWritesAttempted: false,
      childProcessesSpawned: false,
      filesWrittenByThisScript: false,
      executeFlagSupported: false
    },
    project: {
      slug: input.projectSlug,
      reportPath: input.reportPath,
      customerDataBoundary: {
        required: {
          organization_type: "client",
          data_environment: "production",
          is_internal: false,
          is_demo: false
        },
        received: {
          organization_type: input.organization.organizationType,
          data_environment: input.organization.dataEnvironment,
          is_internal: input.organization.isInternal,
          is_demo: input.organization.isDemo
        },
        satisfied: input.organization.customerDataBoundarySatisfied,
        note: "customer_data is necessary but not sufficient for customer_ready."
      }
    },
    measurementConfiguration: {
      measurementProfileId: input.measurementProfileId,
      measurementProfilePromptCount: profile.promptCount,
      promptSetVersion: input.promptSetVersion,
      searchMode: input.searchMode,
      models: input.models,
      modelCliFlagSupportedByMeasurementRunner: false,
      modelNote: "The current measurement runner uses its existing model configuration and does not accept a --model flag.",
      expectedAnswersPerPrompt: input.expectedAnswersPerPrompt,
      derivedAnswersPerPromptFromSearchMode: derivedAnswersPerPrompt,
      expectedAnswerCount,
      promptInventory: input.promptInventory
    },
    metricEligibilitySummary: {
      visibilityRankingShareOfVoiceCompetitorGap: {
        promptScope: "non_branded only",
        promptCount: visibilityMetricEligiblePromptCount,
        excluded: ["branded", "citation_check"]
      },
      sentimentBrandPerception: {
        promptScope: "branded only",
        promptCount: sentimentReviewPromptCount
      },
      citationEvidenceReview: {
        promptScope: "citation_check only",
        promptCount: citationReviewPromptCount,
        note: "Citation occurrence is evidence inventory, not ranking evidence."
      }
    },
    plannedCommands: commands,
    orderedStages: stages,
    requiredManualApprovals: [
      "Confirm the customer_data boundary and that no demo/local/sample project is being used.",
      "Approve prompt taxonomy before OpenAI measurement.",
      "Approve OpenAI measurement cost and model configuration outside this script.",
      "Review aggregate and metric snapshots before recommendation generation.",
      "Review recommendation candidates before changing any publication state to customer_visible.",
      "Confirm report ready gate status before sharing the report URL."
    ],
    reportReadyPrerequisites: {
      customerDataBoundarySatisfied: input.organization.customerDataBoundarySatisfied,
      completedOpenAiMeasurementRunRequired: true,
      sourceMeasurementRunId: input.sourceMeasurementRunId,
      aggregateRunId: input.aggregateRunId,
      metricSnapshotCount: input.metricSnapshotCount,
      validObservationCount: input.validObservationCount,
      customerVisibleRecommendationCount: input.customerVisibleRecommendationCount,
      reportReadyGateStatus: input.reportReadyGateStatus
    },
    urlSharing: {
      status: urlSharingEligible ? "eligible" : "blocked",
      reason: urlSharingEligible
        ? "reportReadyGateStatus is customer_ready. Administrator still performs final URL review."
        : "reportReadyGateStatus is not customer_ready. Do not share the customer report URL."
    },
    validationSummary: {
      profilePromptCountMatches,
      expectedAnswersMatchSearchMode,
      promptTaxonomyIsComplete,
      noSecretsOrConnectionFieldsAccepted: true
    }
  };
}

function buildCommands(input: NormalizedPlanInput): PlannedCommand[] {
  const measurementRunId = input.sourceMeasurementRunId ?? "<completed-openai-measurement-run-id>";
  const aggregateRunId = input.aggregateRunId ?? "<aggregate-run-id>";
  const aggregateOutputPath = `output/report-cycles/${input.projectSlug}/aggregate.json`;
  const recommendationOutputDir = `output/recommendation-candidates/${input.projectSlug}`;
  const recommendationInputPath = input.recommendationCandidatePath ?? `${recommendationOutputDir}/recommendation-candidates.json`;

  return [
    {
      label: "OpenAI measurement execution",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/run-openai-measurement.ts",
        "--project-slug",
        input.projectSlug,
        "--profile",
        input.measurementProfileId,
        "--search-mode",
        input.searchMode
      ]),
      executesInThisScript: false,
      notes: [
        "OpenAI measurement is never executed by this plan script.",
        "Administrator approval is required before running this command manually."
      ]
    },
    {
      label: "Cycle orchestrator reference plan",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/run-recora-report-cycle.ts",
        "--project-slug",
        input.projectSlug,
        "--measurement-run-id",
        measurementRunId,
        "--plan"
      ]),
      executesInThisScript: false,
      notes: [
        "Reference only. The existing orchestrator can plan or run phases, spawn child scripts, and write manifests.",
        "Do not run it during this no-DB/no-file-write planning step."
      ]
    },
    {
      label: "Metric snapshot dry-run",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/recalculate-metric-snapshots.ts",
        "--project-slug",
        input.projectSlug,
        "--source-run-id",
        measurementRunId,
        "--search-mode",
        "combined",
        "--output-json",
        aggregateOutputPath
      ]),
      executesInThisScript: false,
      notes: ["Dry-run by default. Add --apply only after administrator approval and DB target confirmation."]
    },
    {
      label: "Metric snapshot apply after approval",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/recalculate-metric-snapshots.ts",
        "--project-slug",
        input.projectSlug,
        "--source-run-id",
        measurementRunId,
        "--search-mode",
        "combined",
        "--output-json",
        aggregateOutputPath,
        "--apply"
      ]),
      executesInThisScript: false,
      notes: [
        "Write-capable command. Do not run until the dry-run output and DB target are approved.",
        "Non-local writes require the existing DB write guard flags."
      ]
    },
    {
      label: "Recommendation candidate generation",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/generate-recommendation-candidates.ts",
        "--project-slug",
        input.projectSlug,
        "--measurement-run-id",
        measurementRunId,
        "--aggregate-run-id",
        aggregateRunId,
        "--output-dir",
        recommendationOutputDir
      ]),
      executesInThisScript: false,
      notes: ["Generates candidate files for administrator review. This plan script does not run it."]
    },
    {
      label: "Recommendation save dry-run",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/save-recommendation-candidates.ts",
        "--input",
        recommendationInputPath,
        "--dry-run"
      ]),
      executesInThisScript: false,
      notes: ["Dry-run only. Review publication_state before any apply."]
    },
    {
      label: "Recommendation save apply after approval",
      command: joinCommand([
        "npx",
        "tsx",
        "scripts/save-recommendation-candidates.ts",
        "--input",
        recommendationInputPath,
        "--apply"
      ]),
      executesInThisScript: false,
      notes: [
        "Write-capable command. Use only after quality review and publication_state decisions.",
        "Non-local writes require the existing DB write guard flags."
      ]
    },
    {
      label: "Report ready read-model check",
      command: "npm run recora:dashboard-read-model:check",
      executesInThisScript: false,
      notes: ["Confirms the dashboard read model path compiles and remains callable; it is not a customer approval by itself."]
    }
  ];
}

function buildStages(
  input: NormalizedPlanInput,
  context: {
    profilePromptCountMatches: boolean;
    expectedAnswersMatchSearchMode: boolean;
    promptTaxonomyIsComplete: boolean;
    commands: PlannedCommand[];
  }
): PlannedStage[] {
  const hasMeasurementRun = Boolean(input.sourceMeasurementRunId);
  const hasAggregateRun = Boolean(input.aggregateRunId);
  const hasMetricSnapshots = input.metricSnapshotCount > 0;
  const hasValidObservations = input.validObservationCount > 0;
  const hasRecommendationCandidates = input.recommendationCandidateCount > 0 || Boolean(input.recommendationCandidatePath);
  const hasCustomerVisibleRecommendations = input.customerVisibleRecommendationCount > 0;
  const measurementConfigBlocks = [
    ...(!context.profilePromptCountMatches
      ? ["measurement profile prompt count does not match promptInventory.total"]
      : []),
    ...(!context.expectedAnswersMatchSearchMode
      ? ["expectedAnswersPerPrompt does not match the selected searchMode"]
      : [])
  ];
  const taxonomyBlocks = [
    ...(input.promptInventory.total <= 0 ? ["promptInventory.total must be greater than 0"] : []),
    ...(input.promptInventory.nonBranded <= 0 ? ["at least one non-branded prompt is required for visibility/ranking metrics"] : []),
    ...(!context.promptTaxonomyIsComplete ? ["prompt taxonomy has unclassified prompts"] : [])
  ];

  const measurementCommand = commandByLabel(context.commands, "OpenAI measurement execution");
  const aggregateDryRunCommand = commandByLabel(context.commands, "Metric snapshot dry-run");
  const recommendationGenerateCommand = commandByLabel(context.commands, "Recommendation candidate generation");
  const recommendationSaveDryRunCommand = commandByLabel(context.commands, "Recommendation save dry-run");
  const reportReadyCommand = commandByLabel(context.commands, "Report ready read-model check");

  return [
    {
      id: "bootstrap_review",
      status: input.organization.customerDataBoundarySatisfied ? "pending_review" : "blocked",
      prerequisites: [
        "project slug exists in the intended environment",
        "organization_type=client",
        "data_environment=production",
        "is_internal=false",
        "is_demo=false"
      ],
      plannedCommand: null,
      expectedOutput: "Administrator confirms this is a real customer project, not demo/local/sample data.",
      blockingConditions: input.organization.customerDataBoundarySatisfied
        ? []
        : ["customer_data boundary is not satisfied"],
      administratorApprovalRequired: true
    },
    {
      id: "prompt_taxonomy_review",
      status: taxonomyBlocks.length === 0 ? "pending_review" : "blocked",
      prerequisites: [
        "primary brand and competitor brands are registered",
        "personas, topics, and prompts are mapped",
        "non_branded, branded, and citation_check prompt purposes are separated"
      ],
      plannedCommand: null,
      expectedOutput: "Prompt inventory is approved for metric eligibility and measurement planning.",
      blockingConditions: taxonomyBlocks,
      administratorApprovalRequired: true
    },
    {
      id: "measurement_preflight",
      status: measurementConfigBlocks.length === 0 && taxonomyBlocks.length === 0 ? "ready_for_manual_execution" : "blocked",
      prerequisites: [
        "prompt taxonomy review has no blockers",
        "measurement profile exists",
        "prompt set version is explicit",
        "OpenAI measurement cost/model approval is recorded outside this script"
      ],
      plannedCommand: null,
      expectedOutput: "Administrator approves the exact OpenAI measurement command.",
      blockingConditions: measurementConfigBlocks,
      administratorApprovalRequired: true
    },
    {
      id: "measurement_execution",
      status: hasMeasurementRun
        ? "pending_review"
        : measurementConfigBlocks.length === 0 && taxonomyBlocks.length === 0
          ? "ready_for_manual_execution"
          : "blocked",
      prerequisites: ["measurement_preflight is approved", "OpenAI execution is explicitly approved"],
      plannedCommand: measurementCommand,
      expectedOutput: "Completed OpenAI measurement run id with data_source=openai_measurement.",
      blockingConditions: [],
      administratorApprovalRequired: true
    },
    {
      id: "aggregate_generation",
      status: hasMeasurementRun ? "ready_for_manual_execution" : "blocked",
      prerequisites: ["completed source measurement run id is available"],
      plannedCommand: aggregateDryRunCommand,
      expectedOutput: "Aggregate output is reviewed, then metric snapshot apply can be approved separately.",
      blockingConditions: hasMeasurementRun ? [] : ["aggregate generation requires sourceMeasurementRunId"],
      administratorApprovalRequired: true
    },
    {
      id: "metric_snapshot_validation",
      status: hasAggregateRun && hasMetricSnapshots && hasValidObservations ? "pending_review" : "blocked",
      prerequisites: [
        "aggregate run id is available",
        "metric snapshots exist",
        "valid observations exist for the source measurement run"
      ],
      plannedCommand: null,
      expectedOutput: "Metric snapshots are confirmed as derived from valid non-branded observation scope.",
      blockingConditions: [
        ...(!hasAggregateRun ? ["aggregateRunId is not available yet"] : []),
        ...(!hasMetricSnapshots ? ["metricSnapshotCount is 0"] : []),
        ...(!hasValidObservations ? ["validObservationCount is 0"] : [])
      ],
      administratorApprovalRequired: true
    },
    {
      id: "recommendation_generation",
      status: hasMeasurementRun && hasAggregateRun ? "ready_for_manual_execution" : "blocked",
      prerequisites: ["completed measurement run id is available", "aggregate run id is available"],
      plannedCommand: recommendationGenerateCommand,
      expectedOutput: "Recommendation candidate JSON/Markdown is generated for quality review.",
      blockingConditions: [
        ...(!hasMeasurementRun ? ["sourceMeasurementRunId is required"] : []),
        ...(!hasAggregateRun ? ["aggregateRunId is required"] : [])
      ],
      administratorApprovalRequired: true
    },
    {
      id: "recommendation_review",
      status: hasRecommendationCandidates ? "pending_review" : "blocked",
      prerequisites: [
        "recommendation candidate output exists",
        "quality gate review is complete",
        "publication_state is not treated as customer_visible until approved"
      ],
      plannedCommand: recommendationSaveDryRunCommand,
      expectedOutput: "Only approved recommendations become customer_visible; drafts remain candidate/review states.",
      blockingConditions: hasRecommendationCandidates
        ? []
        : ["recommendation candidates are not available yet"],
      administratorApprovalRequired: input.recommendationReviewRequired
    },
    {
      id: "report_ready_check",
      status: hasMetricSnapshots && hasValidObservations && hasCustomerVisibleRecommendations
        ? "ready_for_manual_execution"
        : "blocked",
      prerequisites: [
        "customer_data boundary is satisfied",
        "completed OpenAI measurement and aggregate evidence exists",
        "metric snapshots and valid observations are present",
        "customer-visible recommendation state has been reviewed"
      ],
      plannedCommand: reportReadyCommand,
      expectedOutput: "Report ready gate can be checked without exposing admin diagnostics to customers.",
      blockingConditions: [
        ...(!input.organization.customerDataBoundarySatisfied ? ["customer_data boundary is not satisfied"] : []),
        ...(!hasMetricSnapshots ? ["metric snapshots are missing"] : []),
        ...(!hasValidObservations ? ["valid observations are missing"] : []),
        ...(!hasCustomerVisibleRecommendations ? ["no customer_visible recommendations are planned"] : [])
      ],
      administratorApprovalRequired: true
    },
    {
      id: "customer_url_share",
      status: input.reportReadyGateStatus === "customer_ready" ? "pending_review" : "blocked",
      prerequisites: ["report ready gate status is customer_ready", "final browser review is complete"],
      plannedCommand: null,
      expectedOutput: "Customer receives the prepared report URL only after final approval.",
      blockingConditions: input.reportReadyGateStatus === "customer_ready"
        ? []
        : ["reportReadyGateStatus is not customer_ready"],
      administratorApprovalRequired: true
    }
  ];
}

function normalizeOrganization(value: unknown): NormalizedOrganization {
  if (!isRecord(value)) throw new Error("organization must be an object.");
  rejectUnknownKeys(value, ALLOWED_ORGANIZATION_KEYS, "organization");
  const organizationType = optionalString(value.organization_type ?? value.organizationType, "organization.organization_type");
  const dataEnvironment = optionalString(value.data_environment ?? value.dataEnvironment, "organization.data_environment");
  const isInternal = optionalBoolean(value.is_internal ?? value.isInternal, "organization.is_internal");
  const isDemo = optionalBoolean(value.is_demo ?? value.isDemo, "organization.is_demo");

  return {
    organizationType,
    dataEnvironment,
    isInternal,
    isDemo,
    customerDataBoundarySatisfied:
      organizationType === "client" &&
      dataEnvironment === "production" &&
      isInternal === false &&
      isDemo === false
  };
}

function normalizePromptInventory(value: unknown): NormalizedPromptInventory {
  if (!isRecord(value)) throw new Error("promptInventory must be an object.");
  rejectUnknownKeys(value, ALLOWED_PROMPT_INVENTORY_KEYS, "promptInventory");
  const total = requireNonNegativeInteger(value.total, "promptInventory.total");
  const nonBranded = requireNonNegativeInteger(value.nonBranded, "promptInventory.nonBranded");
  const branded = requireNonNegativeInteger(value.branded, "promptInventory.branded");
  const citationCheck = requireNonNegativeInteger(value.citationCheck, "promptInventory.citationCheck");
  const classified = nonBranded + branded + citationCheck;
  if (classified > total) {
    throw new Error("promptInventory nonBranded + branded + citationCheck cannot exceed total.");
  }
  return {
    total,
    nonBranded,
    branded,
    citationCheck,
    otherOrUnclassified: total - classified
  };
}

function requireSearchMode(value: unknown): MeasurementProfileSearchMode {
  const searchMode = requireString(value, "searchMode");
  if (searchMode !== "no-search" && searchMode !== "web-search" && searchMode !== "both") {
    throw new Error("searchMode must be no-search, web-search, or both.");
  }
  return searchMode;
}

function normalizeReportReadyGateStatus(value: unknown): ReportReadyGateStatus {
  if (value == null) return "unknown";
  const status = requireString(value, "reportReadyGateStatus");
  if (status === "customer_ready" || status === "not_ready" || status === "unknown") return status;
  throw new Error("reportReadyGateStatus must be customer_ready, not_ready, or unknown.");
}

function validateProjectSlug(value: string) {
  if (value.length < 3 || value.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
    throw new Error("projectSlug must be 3-63 characters using lowercase letters, numbers, and hyphens.");
  }
}

function validatePromptSetVersion(value: string) {
  if (!/^[A-Za-z0-9._-]{3,80}$/.test(value)) {
    throw new Error("promptSetVersion must be 3-80 characters using letters, numbers, dot, underscore, or hyphen.");
  }
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
  return value.trim();
}

function optionalString(value: unknown, label: string) {
  if (value == null) return null;
  return requireString(value, label);
}

function requireStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty string array.`);
  return value.map((item, index) => {
    const model = requireString(item, `${label}[${index}]`);
    if (!/^[A-Za-z0-9._:-]+$/.test(model)) {
      throw new Error(`${label}[${index}] contains unsupported characters.`);
    }
    return model;
  });
}

function requireBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean.`);
  return value;
}

function optionalBoolean(value: unknown, label: string) {
  if (value == null) return null;
  return requireBoolean(value, label);
}

function requireNonNegativeInteger(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function optionalNonNegativeInteger(value: unknown, label: string) {
  if (value == null) return 0;
  return requireNonNegativeInteger(value, label);
}

function rejectForbiddenKeys(value: unknown, path = "input") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (FORBIDDEN_KEY_PARTS.some((part) => normalizedKey.includes(part))) {
      throw new Error(`${path}.${key} is not allowed because secrets and connection details are not accepted.`);
    }
    rejectForbiddenKeys(nested, `${path}.${key}`);
  }
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, label: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not a supported input field.`);
  }
}

function commandByLabel(commands: PlannedCommand[], label: string) {
  return commands.find((command) => command.label === label)?.command ?? null;
}

function joinCommand(parts: string[]) {
  return parts.map(quoteCommandPart).join(" ");
}

function quoteCommandPart(value: string) {
  return /^[A-Za-z0-9._:/<>=-]+$/.test(value) ? value : JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
