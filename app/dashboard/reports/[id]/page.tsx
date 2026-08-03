import { ReportLandingPage } from "@/components/recora/report-pages";
import {
  CustomerReportProductionDesignPage,
  type CustomerReportDesignVariant
} from "@/components/recora/customer-report-production-design/customer-report-production-design";
import {
  canUseReadOnlyRealDbPreview,
  canUseDesignCheckReport,
  CURRENT_REPORT_SLUG,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../report-route-guard";
import { getRecoraVisualVariant } from "@/lib/recora/dev-preview/design-visual-variant";
import { normalizeRecoraReportTabId } from "@/components/recora/report-tabs/recora-report-tabs";

export const dynamic = "force-dynamic";

type CustomerReportSearchParams = ReportSlugPageProps["searchParams"] & {
  design?: string | string[];
};

function normalizeCustomerReportDesignVariant(value: string | string[] | undefined): CustomerReportDesignVariant {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "executive" || raw === "analyst" || raw === "action" ? raw : "action";
}

export default async function ReportPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  const visualVariant = getRecoraVisualVariant(searchParams);
  const realDbPreviewEnabled = canUseReadOnlyRealDbPreview(projectSlug, searchParams);
  const activeReportTab = normalizeRecoraReportTabId(searchParams?.reportTab);
  const customerReportSearchParams = searchParams as CustomerReportSearchParams | undefined;
  const customerReportDesign = normalizeCustomerReportDesignVariant(customerReportSearchParams?.design);

  if (projectSlug === CURRENT_REPORT_SLUG) {
    return <CustomerReportProductionDesignPage projectSlug={projectSlug} design={customerReportDesign} />;
  }

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
