import { ReportLandingPage } from "@/components/recora/report-pages";
import {
  canUseReadOnlyRealDbPreview,
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../report-route-guard";
import { getRecoraVisualVariant } from "@/lib/recora/dev-preview/design-visual-variant";
import { normalizeRecoraReportTabId } from "@/components/recora/report-tabs/recora-report-tabs";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  const visualVariant = getRecoraVisualVariant(searchParams);
  const realDbPreviewEnabled = canUseReadOnlyRealDbPreview(projectSlug, searchParams);
  const activeReportTab = normalizeRecoraReportTabId(searchParams?.reportTab);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      const { getDesignCheckReportOverviewData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
      return (
        <ReportLandingPage
          projectSlug={projectSlug}
          data={getDesignCheckReportOverviewData()}
          visualVariant={visualVariant}
          activeReportTab={activeReportTab}
        />
      );
    }

    return (
      <ReportLandingPage
        projectSlug={projectSlug}
        visualVariant={visualVariant}
        readOnlyRealDbPreviewEnabled={realDbPreviewEnabled}
        activeReportTab={activeReportTab}
      />
    );
  }, { searchParams });
}
