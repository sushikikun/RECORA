export type AdminIncidentAuditSourceState =
  | "connected"
  | "compatibility"
  | "not_connected";

export type AdminIncidentAuditSourceKey =
  | "incidents"
  | "systemHealth"
  | "recovery"
  | "audit"
  | "readModel"
  | "commands";

export type AdminIncidentAuditSourceStatus = {
  key: AdminIncidentAuditSourceKey;
  label: string;
  state: AdminIncidentAuditSourceState;
  note: string;
};

export type AdminSystemComponentKey =
  | "measurement"
  | "aggregate"
  | "publication"
  | "authentication"
  | "inquiry"
  | "aiProvider";

export type AdminSystemComponentPlaceholder = {
  key: AdminSystemComponentKey;
  label: string;
  description: string;
  expectedSource: string;
  healthState: null;
};

export type AdminIncidentAuditSnapshot = {
  sources: AdminIncidentAuditSourceStatus[];
  activeIncidentCount: number | null;
  affectedScopeCount: number | null;
  recoveryInProgressCount: number | null;
  recentAuditEventCount: number | null;
  incidents: [];
  components: AdminSystemComponentPlaceholder[];
  recoveryItems: [];
  auditEntries: [];
};

export function buildAdminIncidentAuditSnapshot(): AdminIncidentAuditSnapshot {
  return {
    sources: buildSources(),
    activeIncidentCount: null,
    affectedScopeCount: null,
    recoveryInProgressCount: null,
    recentAuditEventCount: null,
    incidents: [],
    components: buildComponents(),
    recoveryItems: [],
    auditEntries: []
  };
}

function buildSources(): AdminIncidentAuditSourceStatus[] {
  return [
    {
      key: "incidents",
      label: "M09 incident / system events",
      state: "not_connected",
      note: "incident lifecycle・severity・影響scopeは未接続"
    },
    {
      key: "systemHealth",
      label: "System component health",
      state: "not_connected",
      note: "componentごとのhealth・degradation・outageは未接続"
    },
    {
      key: "recovery",
      label: "M15 recovery / clearance",
      state: "not_connected",
      note: "復旧step・検証・clearance・reopenは未接続"
    },
    {
      key: "audit",
      label: "M02 operator audit",
      state: "not_connected",
      note: "append-only保存契約は存在するが管理画面readは未接続"
    },
    {
      key: "readModel",
      label: "M22 incident / audit read model",
      state: "not_connected",
      note: "管理画面用の安全なread projectionは未接続"
    },
    {
      key: "commands",
      label: "Incident / recovery / correction commands",
      state: "not_connected",
      note: "宣言・ack・復旧・解除・correction commandは未接続"
    }
  ];
}

function buildComponents(): AdminSystemComponentPlaceholder[] {
  return [
    {
      key: "measurement",
      label: "Measurement execution",
      description: "日次測定、run、worker、queue、再試行の実行基盤",
      expectedSource: "M09 / M10 / M11 / M22",
      healthState: null
    },
    {
      key: "aggregate",
      label: "Aggregate / read model",
      description: "集計、metric生成、顧客・管理画面readの生成基盤",
      expectedSource: "M09 / M22",
      healthState: null
    },
    {
      key: "publication",
      label: "Publication / delivery",
      description: "公開候補、version、current pointer、配信確認",
      expectedSource: "M09 / M12–M15 / M22",
      healthState: null
    },
    {
      key: "authentication",
      label: "Authentication / access",
      description: "管理者・顧客認証、membership、Project access",
      expectedSource: "M02 / M05 / M09 / M22",
      healthState: null
    },
    {
      key: "inquiry",
      label: "Customer inquiry",
      description: "顧客問い合わせ、内部note、resolution/reopen",
      expectedSource: "M04 / M09 / M22",
      healthState: null
    },
    {
      key: "aiProvider",
      label: "AI provider / model",
      description: "provider応答、model availability、rate limit、安全停止",
      expectedSource: "M09 / M10 / M22",
      healthState: null
    }
  ];
}
