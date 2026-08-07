import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";
import type {
  RecoraPhase1AdminReason,
  RecoraPhase1AdminStatus
} from "@/lib/recora/phase1-admin-plan";

export type AdminQualitySourceState =
  | "connected"
  | "compatibility"
  | "not_connected";

export type AdminQualitySourceKey =
  | "projects"
  | "reportReady"
  | "qualityCases"
  | "evidenceRules"
  | "commands";

export type AdminQualitySourceStatus = {
  key: AdminQualitySourceKey;
  label: string;
  state: AdminQualitySourceState;
  note: string;
};

export type AdminQualityProjectItem = {
  organizationId: string | null;
  projectSlug: string;
  projectName: string;
  brandName: string;
  targetUrl: string;
  measurementStatus: RecoraPhase1AdminStatus;
  aggregateStatus: RecoraPhase1AdminStatus;
  reportReadyStatus: "customer_ready" | "not_ready";
  reportReadyStatusLabel: RecoraPhase1AdminStatus;
  blockers: RecoraPhase1AdminReason[];
  diagnosticNotes: RecoraPhase1AdminReason[];
  blockerCount: number;
  diagnosticNoteCount: number;
  metricSnapshotCount: number;
  validObservationCount: number;
  customerVisibleRecommendationCount: number | null;
  currentAggregateRunId: string | null;
  currentSourceMeasurementRunId: string | null;
};

export type AdminQualityReviewItem = AdminQualityProjectItem;

export type AdminQualityReasonSummary = {
  code: string;
  message: string;
  projectCount: number;
  occurrenceCount: number;
};

export type AdminQualityExceptionSnapshot = {
  sources: AdminQualitySourceStatus[];
  projectCount: number | null;
  blockedProjectCount: number | null;
  blockerCount: number | null;
  diagnosticNoteCount: number | null;
  projects: AdminQualityProjectItem[];
  reviewQueue: AdminQualityReviewItem[];
  reasonSummary: AdminQualityReasonSummary[];
};

export function buildAdminQualityExceptionSnapshot(
  data: RecoraAdminOperationsData | null
): AdminQualityExceptionSnapshot {
  if (!data) {
    return {
      sources: buildSources(false),
      projectCount: null,
      blockedProjectCount: null,
      blockerCount: null,
      diagnosticNoteCount: null,
      projects: [],
      reviewQueue: [],
      reasonSummary: []
    };
  }

  const projects = data.projects.map((project): AdminQualityProjectItem => ({
    organizationId: project.organizationId ?? null,
    projectSlug: project.projectSlug,
    projectName: project.projectName,
    brandName: project.brandName,
    targetUrl: project.targetUrl,
    measurementStatus: project.measurementStatus,
    aggregateStatus: project.aggregateStatus,
    reportReadyStatus: project.reportReadyStatus,
    reportReadyStatusLabel: project.reportReadyStatusLabel,
    blockers: project.reportReadyBlockingReasons,
    diagnosticNotes: project.reportReadyDiagnosticNotes,
    blockerCount: project.reportReadyBlockingReasons.length,
    diagnosticNoteCount: project.reportReadyDiagnosticNotes.length,
    metricSnapshotCount: project.currentMetricSnapshotCount,
    validObservationCount: project.currentValidObservationCount,
    customerVisibleRecommendationCount:
      project.customerVisibleRecommendationCount,
    currentAggregateRunId: project.currentAggregateRunId,
    currentSourceMeasurementRunId: project.currentSourceMeasurementRunId
  }));

  const reviewQueue = projects
    .filter((project) => project.blockerCount > 0)
    .sort((left, right) => {
      const countDifference = right.blockerCount - left.blockerCount;
      return countDifference !== 0
        ? countDifference
        : left.projectName.localeCompare(right.projectName, "ja");
    });

  return {
    sources: buildSources(true),
    projectCount: projects.length,
    blockedProjectCount: reviewQueue.length,
    blockerCount: projects.reduce(
      (sum, project) => sum + project.blockerCount,
      0
    ),
    diagnosticNoteCount: projects.reduce(
      (sum, project) => sum + project.diagnosticNoteCount,
      0
    ),
    projects,
    reviewQueue,
    reasonSummary: buildReasonSummary(projects)
  };
}

function buildReasonSummary(
  projects: AdminQualityProjectItem[]
): AdminQualityReasonSummary[] {
  const summaries = new Map<
    string,
    {
      message: string;
      projectSlugs: Set<string>;
      occurrenceCount: number;
    }
  >();

  for (const project of projects) {
    for (const blocker of project.blockers) {
      const key = blocker.code || "unknown";
      const existing = summaries.get(key);

      if (existing) {
        existing.projectSlugs.add(project.projectSlug);
        existing.occurrenceCount += 1;
        continue;
      }

      summaries.set(key, {
        message: blocker.message || key,
        projectSlugs: new Set([project.projectSlug]),
        occurrenceCount: 1
      });
    }
  }

  return Array.from(summaries.entries())
    .map(([code, summary]) => ({
      code,
      message: summary.message,
      projectCount: summary.projectSlugs.size,
      occurrenceCount: summary.occurrenceCount
    }))
    .sort((left, right) => {
      const occurrenceDifference =
        right.occurrenceCount - left.occurrenceCount;
      return occurrenceDifference !== 0
        ? occurrenceDifference
        : left.code.localeCompare(right.code);
    });
}

function buildSources(available: boolean): AdminQualitySourceStatus[] {
  return [
    {
      key: "projects",
      label: "Project read",
      state: available ? "compatibility" : "not_connected",
      note: available
        ? "既存Project readの最新50件まで参照"
        : "Project compatibility readを取得できません"
    },
    {
      key: "reportReady",
      label: "Report-ready gate",
      state: available ? "compatibility" : "not_connected",
      note: available
        ? "公開準備ブロッカーと診断ノートを互換表示"
        : "report-ready compatibility readを取得できません"
    },
    {
      key: "qualityCases",
      label: "Formal quality cases",
      state: "not_connected",
      note: "case ID・lifecycle・担当・期限は未接続"
    },
    {
      key: "evidenceRules",
      label: "Evidence ledger / rule version",
      state: "not_connected",
      note: "証拠台帳・品質rule versionは未接続"
    },
    {
      key: "commands",
      label: "Quality commands",
      state: "not_connected",
      note: "再処理・却下・公開許可・保留commandは未接続"
    }
  ];
}
