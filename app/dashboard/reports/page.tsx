import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { ReportsIndexPage, type ReportsIndexPreviewRow } from "@/components/recora/report-pages";
import { canUseCustomerReportDesignLab } from "@/lib/recora/customer-report-design-lab/access";
import {
  getRecoraDesignPreviewLabel,
  isRecoraDesignPreviewEnabled
} from "@/lib/recora/dev-preview/design-preview-access";
import {
  getRecoraVisualVariant,
  withRecoraVisualVariantSearchParam
} from "@/lib/recora/dev-preview/design-visual-variant";
import {
  getRecoraRealDbPreviewLabel,
  isRecoraRealDbPreviewEnabled,
  RECORA_REAL_DB_PREVIEW_PROJECT_SLUG
} from "@/lib/recora/dev-preview/real-db-preview-access";
import {
  getDefaultReportSlug,
  getReportRouteDashboardDataOrNull,
  ReportPreparationPage
} from "./report-route-guard";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: {
    data?: string | string[];
    visual?: string;
  };
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const visualVariant = getRecoraVisualVariant(searchParams);

  if (canUseCustomerReportDesignLab(searchParams)) {
    return <CustomerReportDesignLab activePage="reports" />;
  }

  if (isRecoraRealDbPreviewEnabled(searchParams)) {
    return (
      <ReportsIndexPage
        dashboardData={await getReportRouteDashboardDataOrNull(RECORA_REAL_DB_PREVIEW_PROJECT_SLUG)}
        previewModeLabel={getRecoraRealDbPreviewLabel(searchParams)}
        realDbPreviewEnabled
      />
    );
  }

  if (isRecoraDesignPreviewEnabled()) {
    return (
      <ReportsIndexPage
        previewModeLabel={getRecoraDesignPreviewLabel()}
        previewReportRows={[await getDesignCheckPreviewReportRow(visualVariant)]}
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

async function getDesignCheckPreviewReportRow(visualVariant = getRecoraVisualVariant()): Promise<ReportsIndexPreviewRow> {
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
    href: withRecoraVisualVariantSearchParam(`/dashboard/reports/${DESIGN_CHECK_REPORT_SLUG}`, visualVariant)
  };
}
