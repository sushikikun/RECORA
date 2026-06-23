import { TechnicalAuditPage } from "@/components/recora/report-pages";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportTechnicalAuditPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, () => <TechnicalAuditPage />);
}
