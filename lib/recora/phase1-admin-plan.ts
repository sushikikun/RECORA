export type RecoraPhase1AdminStatus =
  | "未設定"
  | "設定済み"
  | "計測待ち"
  | "計測中"
  | "集計待ち"
  | "改善案確認待ち"
  | "レポート準備中"
  | "公開可能"
  | "失敗";

export type RecoraPhase1AdminReason = {
  code: string;
  message: string;
};

export type RecoraPhase1AdminRunOption = {
  id: string;
  label: string;
  completedAt: string | null;
  aiConversationCount: number;
  promptCount: number;
  searchMode: string | null;
  measurementProfileId: string | null;
};

export type RecoraPhase1AdminProjectContext = {
  projectSlug: string;
  projectName: string;
  dataBoundaryLabel: "demo" | "customer" | "未設定";
  reportUrl: string;
  reportReadyStatus: "customer_ready" | "not_ready";
  reportReadyStatusLabel: RecoraPhase1AdminStatus;
  reportReadyBlockingReasons: RecoraPhase1AdminReason[];
  reportReadyDiagnosticNotes: RecoraPhase1AdminReason[];
  currentAggregateRunId: string | null;
  currentSourceMeasurementRunId: string | null;
  currentMetricSnapshotCount: number;
  currentValidObservationCount: number;
  customerVisibleRecommendationCount: number | null;
  completedMeasurementRuns: RecoraPhase1AdminRunOption[];
};

export type RecoraPhase1AdminPlanSelection = {
  selectedMeasurementRunId: string | null;
  applyAggregate: boolean;
  generateRecommendations: boolean;
  applyRecommendations: boolean;
  checkReportReady: boolean;
};

export type RecoraPhase1AdminPlan = {
  targetProject: string;
  targetMeasurementRunId: string | null;
  modeLabel: "読み取りのみ" | "書き込みが必要";
  requiresWrite: boolean;
  externalAiMeasurement: "発生しない";
  plannedStages: string[];
  skippedStages: string[];
  reportReadyCurrentStatus: RecoraPhase1AdminStatus;
  blockingConditions: string[];
  nextActions: string[];
  cliCommandSuggestions: string[];
};

export function createRecoraPhase1AdminExecutionPlan(
  project: RecoraPhase1AdminProjectContext,
  selection: RecoraPhase1AdminPlanSelection
): RecoraPhase1AdminPlan {
  const selectedRun = project.completedMeasurementRuns.find((run) => run.id === selection.selectedMeasurementRunId) ?? null;
  const requiresWrite = selection.applyAggregate || selection.generateRecommendations || selection.applyRecommendations;
  const blockingConditions = buildBlockingConditions(project, selection, selectedRun);
  const plannedStages = buildPlannedStages(selection);
  const skippedStages = buildSkippedStages(selection);

  return {
    targetProject: `${project.projectName} (${project.projectSlug})`,
    targetMeasurementRunId: selectedRun?.id ?? selection.selectedMeasurementRunId,
    modeLabel: requiresWrite ? "書き込みが必要" : "読み取りのみ",
    requiresWrite,
    externalAiMeasurement: "発生しない",
    plannedStages,
    skippedStages,
    reportReadyCurrentStatus: project.reportReadyStatusLabel,
    blockingConditions,
    nextActions: buildNextActions(project, selection, selectedRun, blockingConditions),
    cliCommandSuggestions: buildCliCommandSuggestions(project, selection, selectedRun)
  };
}

export function translateReportReadyReason(code: string, fallbackMessage?: string): RecoraPhase1AdminReason {
  const messageByCode: Record<string, string> = {
    project_not_found: "案件が見つかりません。",
    report_run_not_found: "完了済みの集計runがありません。",
    seed_measurement_run: "seed計測runは顧客向け根拠に使えません。",
    report_run_not_completed: "最新の集計runが完了していません。",
    report_run_not_openai_measurement: "集計runがOpenAI計測由来として確認できません。",
    report_run_not_aggregate: "最新runが集計runではありません。",
    source_measurement_run_missing: "集計runに元のmeasurement run IDが紐づいていません。",
    seed_source_measurement_run: "seed由来のmeasurement runは顧客向け根拠に使えません。",
    metric_snapshots_missing: "metric_snapshotsがありません。",
    valid_observations_missing: "有効な観測結果がありません。",
    data_origin_unknown: "データ区分が確認できません。",
    placeholder_evidence_detected: "demo/local/sample由来の根拠が混在している可能性があります。",
    measurement_profile_unknown: "measurement profileまたはprompt set versionを確認できません。",
    measurement_profile_legacy_source_only: "source measurement runはありますが、profileまたはprompt set versionが明示されていません。",
    recommendations_not_customer_visible: "改善案候補はありますが、顧客表示可能な改善案がありません。"
  };

  return {
    code,
    message: messageByCode[code] ?? fallbackMessage ?? code
  };
}

export function formatRecoraRunStatusJa(status: string | null | undefined): RecoraPhase1AdminStatus {
  if (status === "completed") return "設定済み";
  if (status === "running") return "計測中";
  if (status === "failed") return "失敗";
  if (status === "draft") return "計測待ち";
  return "未設定";
}

function buildBlockingConditions(
  project: RecoraPhase1AdminProjectContext,
  selection: RecoraPhase1AdminPlanSelection,
  selectedRun: RecoraPhase1AdminRunOption | null
) {
  const blockers: string[] = [];

  if (!selectedRun) {
    blockers.push("完了済みOpenAI measurement runを選択してください。");
  }

  if (selection.generateRecommendations && !selection.applyAggregate && !project.currentAggregateRunId) {
    blockers.push("改善案候補生成には、対象measurement runに対応する集計結果が必要です。");
  }

  if (selection.applyRecommendations && !selection.generateRecommendations) {
    blockers.push("改善案を保存対象にする前に、改善案候補生成を選択してください。");
  }

  if (selection.applyRecommendations && project.customerVisibleRecommendationCount === null) {
    blockers.push("顧客表示可能な改善案数をread modelで確認できていません。");
  }

  if (selection.checkReportReady && project.reportReadyBlockingReasons.length > 0) {
    blockers.push(...project.reportReadyBlockingReasons.map((reason) => reason.message));
  }

  return uniqueStrings(blockers);
}

function buildPlannedStages(selection: RecoraPhase1AdminPlanSelection) {
  const stages = [
    "対象案件と完了済みOpenAI measurement runを確認する",
    "OpenAIの新規計測は行わない"
  ];

  if (selection.applyAggregate) {
    stages.push("選択したmeasurement runを元に集計を行う");
  }
  if (selection.generateRecommendations) {
    stages.push("改善案候補を生成する");
  }
  if (selection.applyRecommendations) {
    stages.push("改善案を保存対象にする");
  }
  if (selection.checkReportReady) {
    stages.push("report-ready状態を確認する");
  }

  return stages;
}

function buildSkippedStages(selection: RecoraPhase1AdminPlanSelection) {
  const stages = [
    "顧客プロジェクトのbootstrap",
    "OpenAI APIを使った新規計測",
    "remote migration適用",
    "任意SQL実行"
  ];

  if (!selection.applyAggregate) {
    stages.push("集計の実行");
  }
  if (!selection.generateRecommendations) {
    stages.push("改善案候補生成");
  }
  if (!selection.applyRecommendations) {
    stages.push("改善案保存");
  }
  if (!selection.checkReportReady) {
    stages.push("report-ready確認");
  }

  return stages;
}

function buildNextActions(
  project: RecoraPhase1AdminProjectContext,
  selection: RecoraPhase1AdminPlanSelection,
  selectedRun: RecoraPhase1AdminRunOption | null,
  blockers: string[]
) {
  if (!selectedRun) {
    return ["既存の完了済みOpenAI measurement runを選択してください。"];
  }

  if (blockers.length > 0) {
    return [
      "表示された残課題を解消してから、CLI実行の可否を人間が判断してください。",
      "この画面から実処理は起動しません。"
    ];
  }

  if (!selection.applyAggregate && !selection.generateRecommendations && !selection.applyRecommendations) {
    return [
      "現在状態とreport-readyの残課題を確認してください。",
      "書き込みが必要な工程は選択されていません。"
    ];
  }

  return [
    `${project.projectSlug}を対象に、表示されたCLIコマンド案を人間が確認してください。`,
    "DB host、project slug、measurement run ID、書き込み範囲を別チェックポイントで確認してから実行してください。"
  ];
}

function buildCliCommandSuggestions(
  project: RecoraPhase1AdminProjectContext,
  selection: RecoraPhase1AdminPlanSelection,
  selectedRun: RecoraPhase1AdminRunOption | null
) {
  const measurementRunId = selectedRun?.id ?? "<completed-openai-measurement-run-id>";
  const suggestions = [
    formatCliCommand([
      "npx",
      "tsx",
      "scripts/inspect-recora-measurement-runs.ts",
      "--project-slug",
      project.projectSlug,
      "--limit",
      "5"
    ])
  ];

  if (selection.applyAggregate || selection.generateRecommendations || selection.applyRecommendations) {
    suggestions.push(formatCliCommand([
      "npx",
      "tsx",
      "scripts/run-recora-report-cycle.ts",
      "--project-slug",
      project.projectSlug,
      "--measurement-run-id",
      measurementRunId,
      "--aggregate-search-mode",
      "combined",
      ...(selection.applyAggregate ? ["--apply-aggregate"] : []),
      ...(selection.generateRecommendations ? ["--generate-recommendations"] : []),
      ...(selection.applyRecommendations ? ["--apply-recommendations"] : [])
    ]));
    suggestions.push(formatCliCommand([
      "npm",
      "run",
      "recora:phase1:operator",
      "--",
      "--client-config",
      ".\\tmp\\client-project.json",
      "--execute-local",
      "--skip-bootstrap",
      "--customer-data-boundary-confirmed",
      "--measurement-run-id",
      measurementRunId,
      ...(selection.applyAggregate ? ["--apply-aggregate"] : []),
      ...(selection.generateRecommendations ? ["--generate-recommendations"] : []),
      ...(selection.applyRecommendations ? ["--apply-recommendations"] : []),
      "--expected-db-host",
      "127.0.0.1"
    ]));
  } else {
    suggestions.push(formatCliCommand([
      "npm",
      "run",
      "recora:dashboard-read-model:check"
    ]));
  }

  return suggestions;
}

function formatCliCommand(parts: string[]) {
  return parts.map((part) => (isSafeCliArgument(part) ? part : JSON.stringify(part))).join(" ");
}

function isSafeCliArgument(value: string) {
  return /^[A-Za-z0-9._/:=@\\-]+$/.test(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
