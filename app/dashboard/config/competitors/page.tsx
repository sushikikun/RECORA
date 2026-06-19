import { CompetitorsConfigPage } from "@/components/recora/report-pages";
import { getRecoraDashboardData } from "@/lib/recora/db";

const CURRENT_PROJECT_SLUG = "recora-kenzai-q2";

export const dynamic = "force-dynamic";

export default async function ConfigCompetitorsPage() {
  const dashboardData = await getDashboardDataOrNull();

  return <CompetitorsConfigPage dashboardData={dashboardData} />;
}

async function getDashboardDataOrNull() {
  try {
    const data = await getRecoraDashboardData(CURRENT_PROJECT_SLUG);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora competitors config data.", error);
    return null;
  }
}
