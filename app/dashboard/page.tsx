import { DashboardHomePage } from "@/components/recora/report-pages";
import { getRecoraDashboardData } from "@/lib/recora/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboardData = await getDashboardDataOrNull();

  return <DashboardHomePage dashboardData={dashboardData} />;
}

async function getDashboardDataOrNull() {
  try {
    const data = await getRecoraDashboardData();
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora dashboard data. Falling back to sample data.", error);
    return null;
  }
}
