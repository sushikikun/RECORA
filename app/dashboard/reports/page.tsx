import { ReportsIndexPage } from "@/components/recora/report-pages";
import {
  getDefaultReportSlug,
  getReportRouteDashboardDataOrNull,
  ReportPreparationPage
} from "./report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const dashboardData = await getDashboardDataOrNull();
  if (dashboardData?.reportReadyGate.status !== "customer_ready") {
    return <ReportPreparationPage />;
  }

  return <ReportsIndexPage dashboardData={dashboardData} />;
}

async function getDashboardDataOrNull() {
  const projectSlug = getDefaultReportSlug();
  if (!projectSlug) return null;

  return getReportRouteDashboardDataOrNull(projectSlug);
}
