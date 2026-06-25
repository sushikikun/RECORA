import { redirect } from "next/navigation";
import {
  assertPublicReportRouteAllowed,
  canUseDesignCheckReport,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportTrendsPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  assertPublicReportRouteAllowed(projectSlug);

  if (canUseDesignCheckReport(projectSlug)) {
    redirect("/dashboard?design-check=1#trends");
  }

  redirect("/dashboard#trends");
}
