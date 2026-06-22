import { LeaderboardPage } from "@/components/recora/report-pages";
import { getRecoraDashboardData, getRecoraLeaderboardData } from "@/lib/recora/db";

const CURRENT_REPORT_SLUG = "mieruca-seo-demo";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportLeaderboardPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ReportLeaderboardPage({ params }: ReportLeaderboardPageProps) {
  const leaderboardData = await getLeaderboardDataOrNull(normalizeReportSlug(params.id));

  return <LeaderboardPage leaderboardData={leaderboardData} />;
}

async function getLeaderboardDataOrNull(projectSlug: string) {
  try {
    const dashboardData = await getRecoraDashboardData(projectSlug);
    if (dashboardData.reportReadyGate.status !== "customer_ready") return null;

    const data = await getRecoraLeaderboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora leaderboard data.", error);
    return null;
  }
}

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
