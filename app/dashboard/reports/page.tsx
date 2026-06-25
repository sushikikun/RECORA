import { ReportsIndexPage, type ReportsIndexPreviewRow } from "@/components/recora/report-pages";
import {
  getRecoraDesignPreviewLabel,
  isRecoraDesignPreviewEnabled
} from "@/lib/recora/dev-preview/design-preview-access";
import {
  getDefaultReportSlug,
  getReportRouteDashboardDataOrNull,
  ReportPreparationPage
} from "./report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  if (isRecoraDesignPreviewEnabled()) {
    return (
      <ReportsIndexPage
        previewModeLabel={getRecoraDesignPreviewLabel()}
        previewReportRows={[await getDesignCheckPreviewReportRow()]}
      />
    );
  }

  const dashboardData = await getDashboardDataOrNull();
  if (dashboardData?.reportReadyGate.status !== "customer_ready") {
    return <ReportPreparationPage />;
  }

  return <ReportsIndexPage dashboardData={dashboardData} />;
}

async function getDashboardDataOrNull() {
  const projectSlug = getDefaultReportSlug();
  if (!projectSlug) return null;

  return getReportRouteDashboardDataOrNull(projectSlug);
}

async function getDesignCheckPreviewReportRow(): Promise<ReportsIndexPreviewRow> {
  const { DESIGN_CHECK_REPORT_SLUG, designCheckReportSummary } = await import(
    "@/lib/recora/dev-preview/design-check-report-fixture"
  );

  return {
    id: DESIGN_CHECK_REPORT_SLUG,
    name: designCheckReportSummary.reportName,
    projectName: designCheckReportSummary.projectName,
    period: designCheckReportSummary.period,
    lastUpdated: designCheckReportSummary.lastUpdated,
    status: designCheckReportSummary.status,
    aiVisibility: `${designCheckReportSummary.aiVisibility}%`,
    validObservations: `${designCheckReportSummary.validObservations.toLocaleString("ja-JP")}件`,
    averageRank: `${designCheckReportSummary.averageRank.toFixed(1)}位`,
    mentionRate: `${designCheckReportSummary.mentionRate}%`,
    href: `/dashboard/reports/${DESIGN_CHECK_REPORT_SLUG}`
  };
}
