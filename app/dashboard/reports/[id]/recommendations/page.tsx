import { RecommendationsPage } from "@/components/recora/report-pages";
import { getRecoraRecommendationsData } from "@/lib/recora/db";

const CURRENT_REPORT_SLUG = "recora-kenzai-q2";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportRecommendationsPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ReportRecommendationsPage({ params }: ReportRecommendationsPageProps) {
  const recommendationsData = await getRecommendationsDataOrNull(normalizeReportSlug(params.id));

  return <RecommendationsPage recommendationsData={recommendationsData} />;
}

async function getRecommendationsDataOrNull(projectSlug: string) {
  try {
    const data = await getRecoraRecommendationsData(projectSlug);
    return data.project && data.recommendations.length > 0 ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora recommendations data. Falling back to sample data.", error);
    return null;
  }
}

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
