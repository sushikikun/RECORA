import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";
import type {
  RecoraPhase1AdminRunOption,
  RecoraPhase1AdminStatus
} from "@/lib/recora/phase1-admin-plan";

export type AdminMeasurementSourceState =
  | "connected"
  | "compatibility"
  | "not_connected";

export type AdminMeasurementSourceKey =
  | "projects"
  | "measurementRuns"
  | "runItems"
  | "dailyEligibility"
  | "modelHealth"
  | "commands";

export type AdminMeasurementSourceStatus = {
  key: AdminMeasurementSourceKey;
  label: string;
  state: AdminMeasurementSourceState;
  note: string;
};

export type AdminMeasurementAttentionKind = "failed" | "running" | "waiting";

export type AdminMeasurementCompletedRun = {
  runId: string;
  completedAt: string | null;
  promptCount: number;
  aiConversationCount: number;
  searchMode: string | null;
  measurementProfileId: string | null;
};

export type AdminMeasurementProjectItem = {
  organizationId: string | null;
  projectSlug: string;
  projectName: string;
  brandName: string;
  targetUrl: string;
  measurementStatus: RecoraPhase1AdminStatus;
  aggregateStatus: RecoraPhase1AdminStatus;
  latestCompletedAt: string | null;
  completedRunCount: number;
  latestCompletedRun: AdminMeasurementCompletedRun | null;
  attentionKind: AdminMeasurementAttentionKind | null;
  attentionLabel: string | null;
  attentionReason: string | null;
};

export type AdminMeasurementAttentionItem = {
  projectSlug: string;
  projectName: string;
  brandName: string;
  measurementStatus: RecoraPhase1AdminStatus;
  kind: AdminMeasurementAttentionKind;
  label: string;
  reason: string;
};

export type AdminMeasurementRecentRun = AdminMeasurementCompletedRun & {
  projectSlug: string;
  projectName: string;
  brandName: string;
};

export type AdminMeasurementManagementSnapshot = {
  sources: AdminMeasurementSourceStatus[];
  projectCount: number | null;
  completedRunCount: number | null;
  projectsWithCompletedRuns: number | null;
  runningProjectCount: number | null;
  failedProjectCount: number | null;
  waitingProjectCount: number | null;
  projects: AdminMeasurementProjectItem[];
  attentionQueue: AdminMeasurementAttentionItem[];
  recentRuns: AdminMeasurementRecentRun[];
};

export function buildAdminMeasurementManagementSnapshot(
  data: RecoraAdminOperationsData | null
): AdminMeasurementManagementSnapshot {
  if (!data) {
    return {
      sources: buildSources(false),
      projectCount: null,
      completedRunCount: null,
      projectsWithCompletedRuns: null,
      runningProjectCount: null,
      failedProjectCount: null,
      waitingProjectCount: null,
      projects: [],
      attentionQueue: [],
      recentRuns: []
    };
  }

  const projects = data.projects.map((project): AdminMeasurementProjectItem => {
    const latestCompletedRun = toCompletedRun(project.completedMeasurementRuns[0] ?? null);
    const attention = resolveAttention(
      project.measurementStatus,
      project.completedMeasurementRuns.length
    );

    return {
      organizationId: project.organizationId ?? null,
      projectSlug: project.projectSlug,
      projectName: project.projectName,
      brandName: project.brandName,
      targetUrl: project.targetUrl,
      measurementStatus: project.measurementStatus,
      aggregateStatus: project.aggregateStatus,
      latestCompletedAt: latestCompletedRun?.completedAt ?? null,
      completedRunCount: project.completedMeasurementRuns.length,
      latestCompletedRun,
      attentionKind: attention?.kind ?? null,
      attentionLabel: attention?.label ?? null,
      attentionReason: attention?.reason ?? null
    };
  });

  const attentionQueue = projects
    .filter(
      (project): project is AdminMeasurementProjectItem & {
        attentionKind: AdminMeasurementAttentionKind;
        attentionLabel: string;
        attentionReason: string;
      } =>
        project.attentionKind !== null &&
        project.attentionLabel !== null &&
        project.attentionReason !== null
    )
    .map((project): AdminMeasurementAttentionItem => ({
      projectSlug: project.projectSlug,
      projectName: project.projectName,
      brandName: project.brandName,
      measurementStatus: project.measurementStatus,
      kind: project.attentionKind,
      label: project.attentionLabel,
      reason: project.attentionReason
    }))
    .sort((left, right) => {
      const rankDifference = attentionRank(left.kind) - attentionRank(right.kind);
      return rankDifference !== 0
        ? rankDifference
        : left.projectName.localeCompare(right.projectName, "ja");
    });

  const recentRuns = data.projects
    .flatMap((project) =>
      project.completedMeasurementRuns.map(
        (run): AdminMeasurementRecentRun => ({
          projectSlug: project.projectSlug,
          projectName: project.projectName,
          brandName: project.brandName,
          ...toCompletedRun(run)!
        })
      )
    )
    .sort((left, right) => {
      const timeDifference = runTimestamp(right.completedAt) - runTimestamp(left.completedAt);
      return timeDifference !== 0
        ? timeDifference
        : left.runId.localeCompare(right.runId);
    })
    .slice(0, 8);

  return {
    sources: buildSources(true),
    projectCount: projects.length,
    completedRunCount: projects.reduce(
      (sum, project) => sum + project.completedRunCount,
      0
    ),
    projectsWithCompletedRuns: projects.filter(
      (project) => project.completedRunCount > 0
    ).length,
    runningProjectCount: projects.filter(
      (project) => project.measurementStatus === "計測中"
    ).length,
    failedProjectCount: projects.filter(
      (project) => project.measurementStatus === "失敗"
    ).length,
    waitingProjectCount: projects.filter(
      (project) => project.attentionKind === "waiting"
    ).length,
    projects,
    attentionQueue,
    recentRuns
  };
}

function buildSources(available: boolean): AdminMeasurementSourceStatus[] {
  return [
    {
      key: "projects",
      label: "Project read",
      state: available ? "compatibility" : "not_connected",
      note: available
        ? "既存Project readから参照"
        : "Project compatibility readを取得できません"
    },
    {
      key: "measurementRuns",
      label: "Measurement run history",
      state: available ? "compatibility" : "not_connected",
      note: available
        ? "完了runと最新measurement状態を参照"
        : "既存run historyを取得できません"
    },
    {
      key: "runItems",
      label: "Run item / progress",
      state: "not_connected",
      note: "prompt・provider単位の進捗は未接続"
    },
    {
      key: "dailyEligibility",
      label: "Daily eligibility / schedule",
      state: "not_connected",
      note: "日次対象判定・次回予定は未接続"
    },
    {
      key: "modelHealth",
      label: "AI model / provider health",
      state: "not_connected",
      note: "モデル停止・provider状態は未接続"
    },
    {
      key: "commands",
      label: "Safety control / commands",
      state: "not_connected",
      note: "再試行・停止・手動実行commandは未接続"
    }
  ];
}

function resolveAttention(
  measurementStatus: RecoraPhase1AdminStatus,
  completedRunCount: number
): {
  kind: AdminMeasurementAttentionKind;
  label: string;
  reason: string;
} | null {
  if (measurementStatus === "失敗") {
    return {
      kind: "failed",
      label: "失敗",
      reason: "最新measurement runが失敗状態です。正式な失敗理由readと再試行commandは未接続です。"
    };
  }

  if (measurementStatus === "計測中") {
    return {
      kind: "running",
      label: "進行中",
      reason: "measurement runが進行中です。run item単位の進捗と停止commandは未接続です。"
    };
  }

  if (
    completedRunCount === 0 &&
    (measurementStatus === "計測待ち" || measurementStatus === "未設定")
  ) {
    return {
      kind: "waiting",
      label: "初回完了待ち",
      reason: "完了済みmeasurement runをまだ確認できません。日次対象外・設定不備・障害のいずれかは推測しません。"
    };
  }

  return null;
}

function toCompletedRun(
  run: RecoraPhase1AdminRunOption | null
): AdminMeasurementCompletedRun | null {
  if (!run) return null;

  return {
    runId: run.id,
    completedAt: run.completedAt,
    promptCount: run.promptCount,
    aiConversationCount: run.aiConversationCount,
    searchMode: run.searchMode,
    measurementProfileId: run.measurementProfileId
  };
}

function attentionRank(kind: AdminMeasurementAttentionKind) {
  if (kind === "failed") return 0;
  if (kind === "running") return 1;
  return 2;
}

function runTimestamp(value: string | null) {
  if (!value) return -1;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? -1 : timestamp;
}
