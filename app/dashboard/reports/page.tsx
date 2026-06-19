import { ReportsIndexPage } from "@/components/recora/report-pages";
import { getRecoraDashboardData } from "@/lib/recora/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const dashboardData = await getDashboardDataOrNull();

  return <ReportsIndexPage dashboardData={dashboardData} />;
}

async function getDashboardDataOrNull() {
  try {
    const data = await getRecoraDashboardData();
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora reports index data.", error);
    return null;
  }
}
