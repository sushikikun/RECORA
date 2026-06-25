import { ReportLandingPage } from "@/components/recora/report-pages";
import {
  assertPublicReportRouteAllowed,
  canUseDesignCheckReport,
  DesignCheckPreviewNotice,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  assertPublicReportRouteAllowed(projectSlug);

  if (canUseDesignCheckReport(projectSlug)) {
    const { getDesignCheckReportOverviewData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
    return (
      <>
        <DesignCheckPreviewNotice />
        <ReportLandingPage projectSlug={projectSlug} data={getDesignCheckReportOverviewData()} />
      </>
    );
  }

  return <ReportLandingPage projectSlug={projectSlug} />;
}
