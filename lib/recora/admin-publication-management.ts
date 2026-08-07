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
  | "publicationCandidates"
  | "currentPublication"
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
  currentAggregateRunId: string | null;
  currentSourceMeasurementRunId: string | null;
  metricSnapshotCount: number;
  validObservationCount: number;
  reportUrl: string;
  formalPublicationState: null;
  deliveryState: null;
};

export type AdminPublicationManagementSnapshot = {
  sources: AdminPublicationSourceStatus[];
  projectCount: number | null;
  readyProjectCount: number | null;
  notReadyProjectCount: number | null;
  blockerCount: number | null;
  diagnosticNoteCount: number | null;
  projects: AdminPublicationProjectItem[];
  readyQueue: AdminPublicationProjectItem[];
  blockedQueue: AdminPublicationProjectItem[];
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
      diagnosticNoteCount: null,
      projects: [],
      readyQueue: [],
      blockedQueue: []
    };
  }

  const projects = data.projects.map((project): AdminPublicationProjectItem => ({
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
    currentAggregateRunId: project.currentAggregateRunId,
    currentSourceMeasurementRunId: project.currentSourceMeasurementRunId,
    metricSnapshotCount: project.currentMetricSnapshotCount,
    validObservationCount: project.currentValidObservationCount,
    reportUrl: project.reportUrl,
    formalPublicationState: null,
    deliveryState: null
  }));

  const readyQueue = projects
    .filter((project) => project.reportReadyStatus === "customer_ready")
    .sort((left, right) => left.projectName.localeCompare(right.projectName, "ja"));

  const blockedQueue = projects
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
    readyProjectCount: readyQueue.length,
    notReadyProjectCount: blockedQueue.length,
    blockerCount: projects.reduce(
      (sum, project) => sum + project.blockerCount,
      0
    ),
    diagnosticNoteCount: projects.reduce(
      (sum, project) => sum + project.diagnosticNoteCount,
      0
    ),
    projects,
    readyQueue,
    blockedQueue
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
        ? "顧客表示gate・blocker・diagnosticを互換表示"
        : "report-ready compatibility readを取得できません"
    },
    {
      key: "publicationCandidates",
      label: "Publication candidate / version",
      state: "not_connected",
      note: "candidate ID・version・生成日時は未接続"
    },
    {
      key: "currentPublication",
      label: "Current publication pointer",
      state: "not_connected",
      note: "現在公開中の版・公開者・公開日時は未接続"
    },
    {
      key: "delivery",
      label: "Delivery verification",
      state: "not_connected",
      note: "反映・顧客閲覧・配信確認は未接続"
    },
    {
      key: "commands",
      label: "Publication commands",
      state: "not_connected",
      note: "公開・再公開・取消・復元commandは未接続"
    }
  ];
}
