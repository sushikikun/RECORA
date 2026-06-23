import { RecommendationsPage } from "@/components/recora/report-pages";
import { getRecoraRecommendationsData } from "@/lib/recora/db";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportRecommendationsPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    const recommendationsData = await getRecommendationsDataOrNull(projectSlug);

    return <RecommendationsPage recommendationsData={recommendationsData} />;
  });
}

async function getRecommendationsDataOrNull(projectSlug: string) {
  try {
    const data = await getRecoraRecommendationsData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora recommendations data.", error);
    return null;
  }
}
