import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import {
  formatRecoraRunStatusJa,
  translateReportReadyReason,
  type RecoraPhase1AdminProjectContext,
  type RecoraPhase1AdminReason,
  type RecoraPhase1AdminRunOption,
  type RecoraPhase1AdminStatus
} from "@/lib/recora/phase1-admin-plan";
import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getRecoraDashboardData,
  getRecoraProjectDataOrigin
} from "./dashboard";
import { getRecoraRunsData, type RecoraRunHistoryItem } from "./runs";
import type { RecoraBrandRow, RecoraProjectRow } from "./types";

const PROJECT_LIMIT = 50;
const PROJECT_COLUMNS =
  "id, organization_id, slug, name, workspace_name, language, region, default_period, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export type RecoraAdminOperationProjectSummary = RecoraPhase1AdminProjectContext & {
  brandName: string;
  targetUrl: string;
  latestMeasurementAt: string | null;
  latestMeasurementRunId: string | null;
  measurementStatus: RecoraPhase1AdminStatus;
  aggregateStatus: RecoraPhase1AdminStatus;
  recommendationStatus: RecoraPhase1AdminStatus;
  currentRemainingIssues: RecoraPhase1AdminReason[];
};

export type RecoraAdminOperationsData = {
  projects: RecoraAdminOperationProjectSummary[];
};

export type RecoraAdminOperationDetail = RecoraAdminOperationProjectSummary & {
  selectedMeasurementRunId: string | null;
};

export async function getRecoraAdminOperationsData(): Promise<RecoraAdminOperationsData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const projects = await getReadableProjects(supabase);
  const summaries = await Promise.all(projects.map((project) => getProjectSummary(project)));

  return {
    projects: summaries.filter((summary): summary is RecoraAdminOperationProjectSummary => Boolean(summary))
  };
}

export async function getRecoraAdminOperationDetail(projectSlug: string): Promise<RecoraAdminOperationDetail | null> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getProjectBySlug(projectSlug, supabase);
  if (!project) return null;

  const summary = await getProjectSummary(project);
  if (!summary) return null;

  return {
    ...summary,
    selectedMeasurementRunId: summary.currentSourceMeasurementRunId ?? summary.completedMeasurementRuns[0]?.id ?? null
  };
}

async function getProjectSummary(project: RecoraProjectRow): Promise<RecoraAdminOperationProjectSummary | null> {
  const [dashboardData, runsData, dataOriginStatus] = await Promise.all([
    getRecoraDashboardData(project.slug),
    getRecoraRunsData(project.slug),
    getProjectDataOrigin(project)
  ]);
  const effectiveProject = dashboardData.project ?? runsData.project ?? project;
  if (!effectiveProject) return null;

  const completedMeasurementRuns = buildCompletedMeasurementRunOptions(runsData.runs);
  const latestMeasurementRun = getLatestMeasurementRun(runsData.runs);
  const latestCompletedMeasurementRun = completedMeasurementRuns[0] ?? null;
  const primaryBrand = getPrimaryBrand(dashboardData.brands);
  const reportReadyBlockingReasons = dashboardData.reportReadyGate.adminDiagnostic.blockingReasons.map((reason) =>
    translateReportReadyReason(reason.code, reason.message)
  );
  const reportReadyDiagnosticNotes = dashboardData.reportReadyGate.adminDiagnostic.diagnosticNotes.map((reason) =>
    translateReportReadyReason(reason.code, reason.message)
  );
  const currentAggregateRunId = dashboardData.latestRun?.id ?? null;
  const aggregateStatus = resolveAggregateStatus({
    hasAggregateRun: Boolean(currentAggregateRunId),
    metricSnapshotCount: dashboardData.metricSnapshots.length,
    latestMeasurementRun
  });
  const recommendationStatus = resolveRecommendationStatus({
    customerVisibleRecommendationCount: dashboardData.recommendations.length,
    aggregateStatus
  });

  return {
    projectSlug: effectiveProject.slug,
    projectName: effectiveProject.name,
    brandName: primaryBrand?.name ?? effectiveProject.name,
    targetUrl: formatTargetUrl(primaryBrand?.domain),
    dataBoundaryLabel: formatDataBoundaryLabel(dataOriginStatus),
    latestMeasurementAt: latestCompletedMeasurementRun?.completedAt ?? latestMeasurementRun?.completedAt ?? null,
    latestMeasurementRunId: latestCompletedMeasurementRun?.id ?? latestMeasurementRun?.id ?? null,
    measurementStatus: resolveMeasurementStatus(latestMeasurementRun),
    aggregateStatus,
    recommendationStatus,
    reportUrl: `/dashboard/reports/${effectiveProject.slug}`,
    reportReadyStatus: dashboardData.reportReadyGate.status,
    reportReadyStatusLabel: dashboardData.reportReadyGate.status === "customer_ready" ? "公開可能" : "レポート準備中",
    reportReadyBlockingReasons,
    reportReadyDiagnosticNotes,
    currentRemainingIssues: reportReadyBlockingReasons,
    currentAggregateRunId,
    currentSourceMeasurementRunId: dashboardData.reportReadyGate.adminDiagnostic.sourceMeasurementRunId,
    currentMetricSnapshotCount: dashboardData.reportReadyGate.adminDiagnostic.metricSnapshotCount,
    currentValidObservationCount: dashboardData.reportReadyGate.adminDiagnostic.validObservationCount,
    customerVisibleRecommendationCount: dashboardData.reportReadyGate.adminDiagnostic.customerVisibleRecommendationCount,
    completedMeasurementRuns
  };
}

async function getReadableProjects(supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(PROJECT_LIMIT);

  throwIfSupabaseError("projects", error);
  return (data ?? []) as RecoraProjectRow[];
}

async function getProjectBySlug(projectSlug: string, supabase: RecoraSupabaseClient) {
  const normalizedSlug = projectSlug.trim();
  if (!normalizedSlug) return null;

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  throwIfSupabaseError("projects", error);
  return (data as RecoraProjectRow | null) ?? null;
}

async function getProjectDataOrigin(project: RecoraProjectRow) {
  try {
    const supabase = createRecoraSupabaseClient();
    return await getRecoraProjectDataOrigin(project.organization_id, supabase);
  } catch {
    return "unknown";
  }
}

function buildCompletedMeasurementRunOptions(runs: RecoraRunHistoryItem[]): RecoraPhase1AdminRunOption[] {
  return runs
    .filter((run) => run.kind === "measurement" && run.status === "completed" && run.aiConversationCount > 0)
    .map((run) => ({
      id: run.id,
      label: `${formatDateTime(run.completedAt)} / ${shortId(run.id)} / ${run.aiConversationCount}回答`,
      completedAt: run.completedAt,
      aiConversationCount: run.aiConversationCount,
      promptCount: run.promptCount,
      searchMode: run.searchMode,
      measurementProfileId: run.measurementProfileId
    }));
}

function getLatestMeasurementRun(runs: RecoraRunHistoryItem[]) {
  return runs.find((run) => run.kind === "measurement") ?? null;
}

function resolveMeasurementStatus(run: RecoraRunHistoryItem | null): RecoraPhase1AdminStatus {
  if (!run) return "計測待ち";
  return formatRecoraRunStatusJa(run.status);
}

function resolveAggregateStatus(input: {
  hasAggregateRun: boolean;
  metricSnapshotCount: number;
  latestMeasurementRun: RecoraRunHistoryItem | null;
}): RecoraPhase1AdminStatus {
  if (input.hasAggregateRun && input.metricSnapshotCount > 0) return "設定済み";
  if (input.latestMeasurementRun?.status === "failed") return "失敗";
  if (input.latestMeasurementRun?.status === "completed") return "集計待ち";
  if (input.latestMeasurementRun?.status === "running") return "レポート準備中";
  return "未設定";
}

function resolveRecommendationStatus(input: {
  customerVisibleRecommendationCount: number;
  aggregateStatus: RecoraPhase1AdminStatus;
}): RecoraPhase1AdminStatus {
  if (input.customerVisibleRecommendationCount > 0) return "設定済み";
  if (input.aggregateStatus === "設定済み") return "改善案確認待ち";
  return "未設定";
}

function formatDataBoundaryLabel(value: string): "demo" | "customer" | "未設定" {
  if (value === "customer_data") return "customer";
  if (value === "demo_or_local") return "demo";
  return "未設定";
}

function getPrimaryBrand(brands: RecoraBrandRow[]) {
  return brands.find((brand) => brand.brand_type === "primary") ?? brands[0] ?? null;
}

function formatTargetUrl(domain: string | null | undefined) {
  if (!domain) return "未設定";
  const normalized = domain.trim();
  if (!normalized) return "未設定";
  return normalized.startsWith("http://") || normalized.startsWith("https://") ? normalized : `https://${normalized}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "日時未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo"
  }).format(date);
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;
  throw new Error(`Failed to load Recora admin operations ${context}: ${error.message}`);
}
