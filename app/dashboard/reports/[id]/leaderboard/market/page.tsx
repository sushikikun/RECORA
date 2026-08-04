import { RecoraCustomerDashboardV03Page } from "@/components/recora/customer-dashboard-v03";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportBrandMarketPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(
    projectSlug,
    () => <RecoraCustomerDashboardV03Page page="brandMarket" projectSlug={projectSlug} projectName="Recora" />,
    { searchParams }
  );
}
