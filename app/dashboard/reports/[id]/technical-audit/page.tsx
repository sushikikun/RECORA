import { redirect } from "next/navigation";
import {
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default function ReportTechnicalAuditPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  redirect(`/dashboard/reports/${projectSlug}/recommendations`);
}
