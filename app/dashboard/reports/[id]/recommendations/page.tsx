import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { RecommendationsPage } from "@/components/recora/report-pages";
import { canUseCustomerReportDesignLabReport } from "@/lib/recora/customer-report-design-lab/access";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportRecommendationsPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  if (canUseCustomerReportDesignLabReport(projectSlug, searchParams)) {
    return <CustomerReportDesignLab activePage="recommendations" />;
  }

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      const { getDesignCheckRecommendationsData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
      return <RecommendationsPage recommendationsData={getDesignCheckRecommendationsData()} />;
    }

    const recommendationsData = await getRecommendationsDataOrNull(projectSlug);

    return <RecommendationsPage recommendationsData={recommendationsData} />;
  }, { searchParams });
}

async function getRecommendationsDataOrNull(projectSlug: string) {
  try {
    const { getRecoraRecommendationsData } = await import("@/lib/recora/db");
    const data = await getRecoraRecommendationsData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora recommendations data.", error);
    return null;
  }
}
