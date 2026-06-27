import { PromptsAnalysisPage } from "@/components/recora/report-pages";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

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
