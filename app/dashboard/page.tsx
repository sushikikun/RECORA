import { DashboardHomePage } from "@/components/recora/report-pages";
import { getRecoraDashboardData, getRecoraHomeReadModelData } from "@/lib/recora/db";

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
    const data = await getRecoraDashboardData();
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora dashboard data.", error);
    return null;
  }
}

async function getHomeReadModelDataOrNull() {
  try {
    const data = await getRecoraHomeReadModelData();
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora home read model data.", error);
    return null;
  }
}
