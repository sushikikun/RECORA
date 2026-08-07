import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";
import type { RecoraPhase1AdminStatus } from "@/lib/recora/phase1-admin-plan";

export type AdminIncidentAuditSourceState =
  | "connected"
  | "compatibility"
  | "not_connected";

export type AdminIncidentAuditSourceKey =
  | "projects"
  | "systemEvents"
  | "incidents"
  | "componentHealth"
  | "recoveryClearance"
  | "auditLog"
  | "commands";

export type AdminIncidentAuditSourceStatus = {
  key: AdminIncidentAuditSourceKey;
  label: string;
  state: AdminIncidentAuditSourceState;
  note: string;
};

export type AdminIncidentProjectScopeItem = {
  organizationId: string | null;
  projectSlug: string;
  projectName: string;
  brandName: string;
  targetUrl: string;
  measurementStatus: RecoraPhase1AdminStatus;
  aggregateStatus: RecoraPhase1AdminStatus;
  reportReadyStatus: "customer_ready" | "not_ready";
  reportReadyStatusLabel: RecoraPhase1AdminStatus;
  incidentStatus: string | null;
  auditStatus: string | null;
};

export type AdminIncidentAuditSnapshot = {
  sources: AdminIncidentAuditSourceStatus[];
  projectCount: number | null;
  openIncidentCount: number | null;
  recoveryPendingCount: number | null;
  degradedComponentCount: number | null;
  auditEventCount: number | null;
  projectScopes: AdminIncidentProjectScopeItem[];
  incidents: readonly unknown[];
  recoveries: readonly unknown[];
  auditEntries: readonly unknown[];
};

export function buildAdminIncidentAuditSnapshot(
  data: RecoraAdminOperationsData | null
): AdminIncidentAuditSnapshot {
  if (!data) {
    return {
      sources: buildSources(false),
      projectCount: null,
      openIncidentCount: null,
      recoveryPendingCount: null,
      degradedComponentCount: null,
      auditEventCount: null,
      projectScopes: [],
      incidents: [],
      recoveries: [],
      auditEntries: []
    };
  }

  const projectScopes = data.projects.map(
    (project): AdminIncidentProjectScopeItem => ({
      organizationId: project.organizationId ?? null,
      projectSlug: project.projectSlug,
      projectName: project.projectName,
      brandName: project.brandName,
      targetUrl: project.targetUrl,
      measurementStatus: project.measurementStatus,
      aggregateStatus: project.aggregateStatus,
      reportReadyStatus: project.reportReadyStatus,
      reportReadyStatusLabel: project.reportReadyStatusLabel,
      incidentStatus: null,
      auditStatus: null
    })
  );

  return {
    sources: buildSources(true),
    projectCount: projectScopes.length,
    openIncidentCount: null,
    recoveryPendingCount: null,
    degradedComponentCount: null,
    auditEventCount: null,
    projectScopes,
    incidents: [],
    recoveries: [],
    auditEntries: []
  };
}

function buildSources(
  projectReadAvailable: boolean
): AdminIncidentAuditSourceStatus[] {
  return [
    {
      key: "projects",
      label: "Project scope read",
      state: projectReadAvailable ? "compatibility" : "not_connected",
      note: projectReadAvailable
        ? "既存Project readの最新50件を影響scope参照に限定"
        : "Project compatibility readを取得できません"
    },
    {
      key: "systemEvents",
      label: "System events",
      state: "not_connected",
      note: "event ID・component・lifecycleは未接続"
    },
    {
      key: "incidents",
      label: "Incidents",
      state: "not_connected",
      note: "incident ID・status・severity・impactは未接続"
    },
    {
      key: "componentHealth",
      label: "Component health",
      state: "not_connected",
      note: "system component・dependency healthは未接続"
    },
    {
      key: "recoveryClearance",
      label: "Recovery / clearance",
      state: "not_connected",
      note: "復旧step・verification・解除decisionは未接続"
    },
    {
      key: "auditLog",
      label: "Append-only audit log",
      state: "not_connected",
      note: "actor・command・target・receipt・occurred atは未接続"
    },
    {
      key: "commands",
      label: "Incident / audit commands",
      state: "not_connected",
      note: "宣言・acknowledge・復旧・解除・監査note commandは未接続"
    }
  ];
}
