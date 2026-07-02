import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { LeaderboardPage } from "@/components/recora/report-pages";
import { canUseCustomerReportDesignLabReport } from "@/lib/recora/customer-report-design-lab/access";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportLeaderboardPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  if (canUseCustomerReportDesignLabReport(projectSlug, searchParams)) {
    return <CustomerReportDesignLab activePage="leaderboard" />;
  }

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      const { getDesignCheckLeaderboardData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
      return <LeaderboardPage leaderboardData={getDesignCheckLeaderboardData()} />;
    }

    const leaderboardData = await getLeaderboardDataOrNull(projectSlug);

    return <LeaderboardPage leaderboardData={leaderboardData} />;
  }, { searchParams });
}

async function getLeaderboardDataOrNull(projectSlug: string) {
  try {
    const { getRecoraLeaderboardData } = await import("@/lib/recora/db");
    const data = await getRecoraLeaderboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora leaderboard data.", error);
    return null;
  }
}
