import { DashboardHomePage } from "@/components/recora/report-pages";
import { getDefaultRecoraProjectSlug, getRecoraDashboardData, getRecoraHomeReadModelData } from "@/lib/recora/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dashboardData, homeReadModelData] = await Promise.all([
    getDashboardDataOrNull(),
    getHomeReadModelDataOrNull()
  ]);

  return <DashboardHomePage dashboardData={dashboardData} homeReadModelData={homeReadModelData} />;
}

async function getDashboardDataOrNull() {
  try {
    const projectSlug = getDefaultRecoraProjectSlug();
    if (!projectSlug) return null;

    const data = await getRecoraDashboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora dashboard data.", error);
    return null;
  }
}

async function getHomeReadModelDataOrNull() {
  try {
    const projectSlug = getDefaultRecoraProjectSlug();
    if (!projectSlug) return null;

    const data = await getRecoraHomeReadModelData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora home read model data.", error);
    return null;
  }
}
