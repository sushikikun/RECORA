import { LeaderboardPage } from "@/components/recora/report-pages";
import { getRecoraLeaderboardData } from "@/lib/recora/db";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportLeaderboardPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    const leaderboardData = await getLeaderboardDataOrNull(projectSlug);

    return <LeaderboardPage leaderboardData={leaderboardData} />;
  });
}

async function getLeaderboardDataOrNull(projectSlug: string) {
  try {
    const data = await getRecoraLeaderboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora leaderboard data.", error);
    return null;
  }
}
