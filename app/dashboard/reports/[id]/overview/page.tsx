import { redirect } from "next/navigation";
import {
  assertPublicReportRouteAllowed,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportOverviewPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  assertPublicReportRouteAllowed(projectSlug);

  redirect(`/dashboard/reports/${projectSlug}`);
}
