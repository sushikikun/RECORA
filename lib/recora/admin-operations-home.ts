import type {
  RecoraAdminOperationProjectSummary,
  RecoraAdminOperationsData
} from "@/lib/recora/db/admin-operations";

export type AdminAttentionDomain = "quality" | "publication";
export type AdminAttentionLevel = "critical" | "high" | "medium" | "low";
export type AdminOperationalSignalDomain = "measurement" | "quality" | "publication";
export type AdminOperationalSignalLevel = "high" | "medium" | "low";

export type AdminAttentionWorkItem = {
  workItemId: string;
  sourceKind: "phase1_compatibility_adapter";
  sourceEntityType: "project";
  sourceEntityId: string;
  navigationDomain: AdminAttentionDomain;
  projectSlug: string;
  projectName: string;
  brandName: string;
  attentionLevel: AdminAttentionLevel;
  humanActionRequired: true;
  title: string;
  summary: string;
  reasonCode: string;
  safeFallbackCode: "keep_previous_publication_or_preparing";
  relatedRoute: string;
  observedAt: string | null;
};

export type AdminOperationalSignal = {
  signalId: string;
  domain: AdminOperationalSignalDomain;
  level: AdminOperationalSignalLevel;
  projectSlug: string;
  projectName: string;
  brandName: string;
  title: string;
  summary: string;
  reasonCode: string;
  relatedRoute: string;
  observedAt: string | null;
};

export type AdminUnclassifiedReason = {
  projectSlug: string;
  projectName: string;
  reasonCode: string;
  summary: string;
};

export type AdminOperationsHomeSnapshot = {
  pageContext: {
    adapterKind: "phase1_compatibility" | "unavailable";
    formalReadModelConnected: false;
    readSnapshotAt: string | null;
    freshnessState: "compatibility" | "unknown";
  };
  operationalVerdict: {
    state: "attention_required" | "signal_detected" | "normal" | "unavailable";
    affectedProjectCount: number;
    humanAttentionCount: number;
    operationalSignalCount: number;
    unclassifiedReasonCount: number;
  };
  humanAttention: {
    items: AdminAttentionWorkItem[];
    byDomain: Record<AdminAttentionDomain, number>;
  };
  operationalSignals: AdminOperationalSignal[];
  publicationStatus: {
    customerReadyProjectCount: number;
    notReadyProjectCount: number;
    notReadyIsHumanAttention: false;
  };
  measurementStatus: {
    failedProjectCount: number;
    projectsWithCompletedRuns: number;
    totalProjectCount: number;
    latestObservationAt: string | null;
  };
  adapterWarnings: {
    unclassifiedReasons: AdminUnclassifiedReason[];
    ignoredReasonCount: number;
  };
  affectedProjects: Array<{
    projectSlug: string;
    projectName: string;
    brandName: string;
    attentionCount: number;
    signalCount: number;
    relatedRoute: string;
  }>;
  loadError: string | null;
};

type AttentionRule = {
  navigationDomain: AdminAttentionDomain;
  attentionLevel: AdminAttentionLevel;
  title: string;
};

type SignalRule = {
  domain: AdminOperationalSignalDomain;
  level: AdminOperationalSignalLevel;
  title: string;
};

const ATTENTION_RULES: Record<string, AttentionRule> = {
  seed_measurement_run: {
    navigationDomain: "quality",
    attentionLevel: "high",
    title: "顧客向け根拠に使えない測定run"
  },
  report_run_not_openai_measurement: {
    navigationDomain: "quality",
    attentionLevel: "high",
    title: "測定由来を確認できない集計run"
  },
  seed_source_measurement_run: {
    navigationDomain: "quality",
    attentionLevel: "high",
    title: "seed由来の測定結果"
  },
  valid_observations_missing: {
    navigationDomain: "quality",
    attentionLevel: "high",
    title: "有効な観測結果がない"
  },
  data_origin_unknown: {
    navigationDomain: "quality",
    attentionLevel: "high",
    title: "データ区分を確認できない"
  },
  placeholder_evidence_detected: {
    navigationDomain: "quality",
    attentionLevel: "high",
    title: "仮データ由来の根拠を検出"
  },
  measurement_profile_unknown: {
    navigationDomain: "quality",
    attentionLevel: "medium",
    title: "測定profileを確認できない"
  },
  measurement_profile_legacy_source_only: {
    navigationDomain: "quality",
    attentionLevel: "medium",
    title: "旧形式の測定profile"
  }
};

const SIGNAL_RULES: Record<string, SignalRule> = {
  report_run_not_found: {
    domain: "measurement",
    level: "medium",
    title: "完了済み集計runがない"
  },
  report_run_not_completed: {
    domain: "measurement",
    level: "low",
    title: "集計runが完了していない"
  },
  report_run_not_aggregate: {
    domain: "measurement",
    level: "high",
    title: "最新runが集計runではない"
  },
  source_measurement_run_missing: {
    domain: "measurement",
    level: "high",
    title: "元のmeasurement runがない"
  },
  metric_snapshots_missing: {
    domain: "measurement",
    level: "high",
    title: "metric snapshotがない"
  }
};

const IGNORED_REASON_CODES = new Set(["recommendations_not_customer_visible"]);

export function createAdminOperationsHomeSnapshot(
  data: RecoraAdminOperationsData
): AdminOperationsHomeSnapshot {
  const attentionItems: AdminAttentionWorkItem[] = [];
  const operationalSignals: AdminOperationalSignal[] = [];
  const unclassifiedReasons: AdminUnclassifiedReason[] = [];
  let ignoredReasonCount = 0;

  for (const project of data.projects) {
    if (project.measurementStatus === "失敗") {
      operationalSignals.push(createStatusSignal(project, {
        signalId: `${project.projectSlug}:measurement_failed`,
        domain: "measurement",
        level: "high",
        title: "最新の測定runが失敗",
        summary: "測定管理で失敗runを確認してください。",
        reasonCode: "measurement_status_failed"
      }));
    }

    if (project.aggregateStatus === "失敗") {
      operationalSignals.push(createStatusSignal(project, {
        signalId: `${project.projectSlug}:aggregate_failed`,
        domain: "measurement",
        level: "high",
        title: "集計処理が失敗",
        summary: "測定管理で集計runを確認してください。",
        reasonCode: "aggregate_status_failed"
      }));
    }

    project.currentRemainingIssues.forEach((reason, index) => {
      if (IGNORED_REASON_CODES.has(reason.code)) {
        ignoredReasonCount += 1;
        return;
      }

      const attentionRule = ATTENTION_RULES[reason.code];
      if (attentionRule) {
        attentionItems.push({
          workItemId: `${project.projectSlug}:${reason.code}:${index}`,
          sourceKind: "phase1_compatibility_adapter",
          sourceEntityType: "project",
          sourceEntityId: project.projectSlug,
          navigationDomain: attentionRule.navigationDomain,
          projectSlug: project.projectSlug,
          projectName: project.projectName,
          brandName: project.brandName,
          attentionLevel: attentionRule.attentionLevel,
          humanActionRequired: true,
          title: attentionRule.title,
          summary: reason.message,
          reasonCode: reason.code,
          safeFallbackCode: "keep_previous_publication_or_preparing",
          relatedRoute: buildDomainRoute(attentionRule.navigationDomain, project.projectSlug, reason.code),
          observedAt: project.latestMeasurementAt
        });
        return;
      }

      const signalRule = SIGNAL_RULES[reason.code];
      if (signalRule) {
        operationalSignals.push(createStatusSignal(project, {
          signalId: `${project.projectSlug}:${reason.code}:${index}`,
          domain: signalRule.domain,
          level: signalRule.level,
          title: signalRule.title,
          summary: reason.message,
          reasonCode: reason.code
        }));
        return;
      }

      unclassifiedReasons.push({
        projectSlug: project.projectSlug,
        projectName: project.projectName,
        reasonCode: reason.code,
        summary: reason.message
      });
    });
  }

  attentionItems.sort(compareAttentionItems);
  operationalSignals.sort(compareOperationalSignals);

  const latestObservationAt = getLatestObservationAt(data);
  const humanAttentionProjects = new Set(attentionItems.map((item) => item.projectSlug));
  const signalProjects = new Set(operationalSignals.map((item) => item.projectSlug));
  const affectedProjectSlugs = new Set<string>();
  humanAttentionProjects.forEach((projectSlug) => affectedProjectSlugs.add(projectSlug));
  signalProjects.forEach((projectSlug) => affectedProjectSlugs.add(projectSlug));

  return {
    pageContext: {
      adapterKind: "phase1_compatibility",
      formalReadModelConnected: false,
      readSnapshotAt: latestObservationAt,
      freshnessState: latestObservationAt ? "compatibility" : "unknown"
    },
    operationalVerdict: {
      state: attentionItems.length > 0
        ? "attention_required"
        : operationalSignals.length > 0 || unclassifiedReasons.length > 0
          ? "signal_detected"
          : "normal",
      affectedProjectCount: affectedProjectSlugs.size,
      humanAttentionCount: attentionItems.length,
      operationalSignalCount: operationalSignals.length,
      unclassifiedReasonCount: unclassifiedReasons.length
    },
    humanAttention: {
      items: attentionItems,
      byDomain: {
        quality: attentionItems.filter((item) => item.navigationDomain === "quality").length,
        publication: attentionItems.filter((item) => item.navigationDomain === "publication").length
      }
    },
    operationalSignals,
    publicationStatus: {
      customerReadyProjectCount: data.projects.filter((project) => project.reportReadyStatus === "customer_ready").length,
      notReadyProjectCount: data.projects.filter((project) => project.reportReadyStatus !== "customer_ready").length,
      notReadyIsHumanAttention: false
    },
    measurementStatus: {
      failedProjectCount: data.projects.filter((project) => project.measurementStatus === "失敗").length,
      projectsWithCompletedRuns: data.projects.filter((project) => project.completedMeasurementRuns.length > 0).length,
      totalProjectCount: data.projects.length,
      latestObservationAt
    },
    adapterWarnings: {
      unclassifiedReasons,
      ignoredReasonCount
    },
    affectedProjects: data.projects
      .filter((project) => affectedProjectSlugs.has(project.projectSlug))
      .map((project) => ({
        projectSlug: project.projectSlug,
        projectName: project.projectName,
        brandName: project.brandName,
        attentionCount: attentionItems.filter((item) => item.projectSlug === project.projectSlug).length,
        signalCount: operationalSignals.filter((item) => item.projectSlug === project.projectSlug).length,
        relatedRoute: getProjectPrimaryRoute(project.projectSlug, attentionItems, operationalSignals)
      }))
      .sort((a, b) => b.attentionCount - a.attentionCount || b.signalCount - a.signalCount || a.projectName.localeCompare(b.projectName, "ja")),
    loadError: null
  };
}

export function createUnavailableAdminOperationsHomeSnapshot(
  message: string
): AdminOperationsHomeSnapshot {
  return {
    pageContext: {
      adapterKind: "unavailable",
      formalReadModelConnected: false,
      readSnapshotAt: null,
      freshnessState: "unknown"
    },
    operationalVerdict: {
      state: "unavailable",
      affectedProjectCount: 0,
      humanAttentionCount: 0,
      operationalSignalCount: 0,
      unclassifiedReasonCount: 0
    },
    humanAttention: {
      items: [],
      byDomain: { quality: 0, publication: 0 }
    },
    operationalSignals: [],
    publicationStatus: {
      customerReadyProjectCount: 0,
      notReadyProjectCount: 0,
      notReadyIsHumanAttention: false
    },
    measurementStatus: {
      failedProjectCount: 0,
      projectsWithCompletedRuns: 0,
      totalProjectCount: 0,
      latestObservationAt: null
    },
    adapterWarnings: {
      unclassifiedReasons: [],
      ignoredReasonCount: 0
    },
    affectedProjects: [],
    loadError: message
  };
}

function createStatusSignal(
  project: RecoraAdminOperationProjectSummary,
  input: Omit<AdminOperationalSignal, "projectSlug" | "projectName" | "brandName" | "relatedRoute" | "observedAt">
): AdminOperationalSignal {
  return {
    ...input,
    projectSlug: project.projectSlug,
    projectName: project.projectName,
    brandName: project.brandName,
    relatedRoute: buildDomainRoute(input.domain, project.projectSlug, input.reasonCode),
    observedAt: project.latestMeasurementAt
  };
}

function buildDomainRoute(
  domain: AdminOperationalSignalDomain | AdminAttentionDomain,
  projectSlug: string,
  reasonCode: string
) {
  const pathname = domain === "measurement"
    ? "/internal/measurements"
    : domain === "publication"
      ? "/internal/publication"
      : "/internal/quality";
  const query = new URLSearchParams({ project: projectSlug, reason: reasonCode });
  return `${pathname}?${query.toString()}`;
}

function getProjectPrimaryRoute(
  projectSlug: string,
  attentionItems: AdminAttentionWorkItem[],
  operationalSignals: AdminOperationalSignal[]
) {
  return attentionItems.find((item) => item.projectSlug === projectSlug)?.relatedRoute
    ?? operationalSignals.find((item) => item.projectSlug === projectSlug)?.relatedRoute
    ?? `/internal/projects/${encodeURIComponent(projectSlug)}`;
}

function compareAttentionItems(a: AdminAttentionWorkItem, b: AdminAttentionWorkItem) {
  return attentionRank(a.attentionLevel) - attentionRank(b.attentionLevel)
    || compareDatesDescending(a.observedAt, b.observedAt)
    || a.projectName.localeCompare(b.projectName, "ja");
}

function compareOperationalSignals(a: AdminOperationalSignal, b: AdminOperationalSignal) {
  return signalRank(a.level) - signalRank(b.level)
    || compareDatesDescending(a.observedAt, b.observedAt)
    || a.projectName.localeCompare(b.projectName, "ja");
}

function attentionRank(level: AdminAttentionLevel) {
  if (level === "critical") return 0;
  if (level === "high") return 1;
  if (level === "medium") return 2;
  return 3;
}

function signalRank(level: AdminOperationalSignalLevel) {
  if (level === "high") return 0;
  if (level === "medium") return 1;
  return 2;
}

function compareDatesDescending(a: string | null, b: string | null) {
  return toEpoch(b) - toEpoch(a);
}

function toEpoch(value: string | null) {
  if (!value) return 0;
  const epoch = new Date(value).getTime();
  return Number.isNaN(epoch) ? 0 : epoch;
}

function getLatestObservationAt(data: RecoraAdminOperationsData) {
  return data.projects
    .map((project) => project.latestMeasurementAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => toEpoch(b) - toEpoch(a))[0] ?? null;
}
