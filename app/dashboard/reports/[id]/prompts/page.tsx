import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { PromptsAnalysisPage } from "@/components/recora/report-pages";
import { canUseCustomerReportDesignLabReport } from "@/lib/recora/customer-report-design-lab/access";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  if (canUseCustomerReportDesignLabReport(projectSlug, searchParams)) {
    return <CustomerReportDesignLab activePage="prompts" />;
  }

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      return <PromptsAnalysisPage />;
    }

    return <PromptsAnalysisPage promptsAnalysisData={await getPromptsAnalysisDataOrNull(projectSlug)} />;
  }, { searchParams });
}

async function getPromptsAnalysisDataOrNull(projectSlug: string) {
  try {
    const { getRecoraLeaderboardData } = await import("@/lib/recora/db");
    const data = await getRecoraLeaderboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora prompts analysis data.", error);
    return null;
  }
}
