import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";
import type {
  RecoraPhase1AdminReason,
  RecoraPhase1AdminStatus
} from "@/lib/recora/phase1-admin-plan";

export type AdminPublicationSourceState =
  | "connected"
  | "compatibility"
  | "not_connected";

export type AdminPublicationSourceKey =
  | "projects"
  | "reportReady"
  | "candidates"
  | "versions"
  | "currentPointer"
  | "delivery"
  | "commands";

export type AdminPublicationSourceStatus = {
  key: AdminPublicationSourceKey;
  label: string;
  state: AdminPublicationSourceState;
  note: string;
};

export type AdminPublicationProjectItem = {
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
  publicationCandidateStatus: string | null;
  currentPublicationStatus: string | null;
  deliveryVerificationStatus: string | null;
};

export type AdminPublicationReadinessItem = AdminPublicationProjectItem;

export type AdminPublicationManagementSnapshot = {
  sources: AdminPublicationSourceStatus[];
  projectCount: number | null;
  readyProjectCount: number | null;
  notReadyProjectCount: number | null;
  blockerCount: number | null;
  projects: AdminPublicationProjectItem[];
  readyProjects: AdminPublicationReadinessItem[];
  blockedProjects: AdminPublicationReadinessItem[];
};

export function buildAdminPublicationManagementSnapshot(
  data: RecoraAdminOperationsData | null
): AdminPublicationManagementSnapshot {
  if (!data) {
    return {
      sources: buildSources(false),
      projectCount: null,
      readyProjectCount: null,
      notReadyProjectCount: null,
      blockerCount: null,
      projects: [],
      readyProjects: [],
      blockedProjects: []
    };
  }

  const projects = data.projects.map(
    (project): AdminPublicationProjectItem => ({
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
      currentSourceMeasurementRunId: project.currentSourceMeasurementRunId,
      publicationCandidateStatus: null,
      currentPublicationStatus: null,
      deliveryVerificationStatus: null
    })
  );

  const readyProjects = projects
    .filter((project) => project.reportReadyStatus === "customer_ready")
    .sort((left, right) =>
      left.projectName.localeCompare(right.projectName, "ja")
    );

  const blockedProjects = projects
    .filter((project) => project.reportReadyStatus === "not_ready")
    .sort((left, right) => {
      const blockerDifference = right.blockerCount - left.blockerCount;
      return blockerDifference !== 0
        ? blockerDifference
        : left.projectName.localeCompare(right.projectName, "ja");
    });

  return {
    sources: buildSources(true),
    projectCount: projects.length,
    readyProjectCount: readyProjects.length,
    notReadyProjectCount: blockedProjects.length,
    blockerCount: projects.reduce(
      (sum, project) => sum + project.blockerCount,
      0
    ),
    projects,
    readyProjects,
    blockedProjects
  };
}

function buildSources(available: boolean): AdminPublicationSourceStatus[] {
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
        ? "公開候補を作る前提条件だけを互換表示"
        : "report-ready compatibility readを取得できません"
    },
    {
      key: "candidates",
      label: "Publication candidates",
      state: "not_connected",
      note: "候補ID・lifecycle・生成時刻は未接続"
    },
    {
      key: "versions",
      label: "Publication versions",
      state: "not_connected",
      note: "公開版・version履歴・公開actorは未接続"
    },
    {
      key: "currentPointer",
      label: "Current publication pointer",
      state: "not_connected",
      note: "現在公開中の正式pointerは未接続"
    },
    {
      key: "delivery",
      label: "Delivery verification",
      state: "not_connected",
      note: "配信先・配信状態・顧客表示確認は未接続"
    },
    {
      key: "commands",
      label: "Publication commands",
      state: "not_connected",
      note: "候補生成・公開・rollback・再配信・検証commandは未接続"
    }
  ];
}
