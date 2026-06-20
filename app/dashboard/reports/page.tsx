import { ReportsIndexPage } from "@/components/recora/report-pages";
import { getRecoraDashboardData } from "@/lib/recora/db";

const CURRENT_PROJECT_SLUG = "mieruca-seo-demo";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const dashboardData = await getDashboardDataOrNull();

  return <ReportsIndexPage dashboardData={dashboardData} />;
}

async function getDashboardDataOrNull() {
  try {
    const data = await getRecoraDashboardData(CURRENT_PROJECT_SLUG);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora reports index data.", error);
    return null;
  }
}
