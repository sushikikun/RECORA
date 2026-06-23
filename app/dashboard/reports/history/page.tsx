import { ReportHistoryPage } from "@/components/recora/report-pages";
import {
  getDefaultReportSlug,
  renderCustomerReadyReportRoute
} from "../report-route-guard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const projectSlug = getDefaultReportSlug();

  return renderCustomerReadyReportRoute(projectSlug, () => <ReportHistoryPage />);
}
