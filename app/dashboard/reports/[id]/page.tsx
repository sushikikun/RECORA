import { ReportLandingPage } from "@/components/recora/report-pages";
import {
  assertPublicReportRouteAllowed,
  canUseDesignCheckReport,
  DesignCheckPreviewNotice,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../report-route-guard";
import { getRecoraVisualVariant } from "@/lib/recora/dev-preview/design-visual-variant";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  const visualVariant = getRecoraVisualVariant(searchParams);

  assertPublicReportRouteAllowed(projectSlug);

  if (canUseDesignCheckReport(projectSlug)) {
    const { getDesignCheckReportOverviewData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
    return (
      <>
        <DesignCheckPreviewNotice />
        <ReportLandingPage projectSlug={projectSlug} data={getDesignCheckReportOverviewData()} visualVariant={visualVariant} />
      </>
    );
  }

  return <ReportLandingPage projectSlug={projectSlug} />;
}
