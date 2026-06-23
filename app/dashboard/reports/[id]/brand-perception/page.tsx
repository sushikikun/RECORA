import { BrandPerceptionPage } from "@/components/recora/report-pages";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportBrandPerceptionPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, () => <BrandPerceptionPage />);
}
