import { redirect } from "next/navigation";
import {
  getRecoraVisualVariant,
  withRecoraVisualVariantSearchParam
} from "@/lib/recora/dev-preview/design-visual-variant";
import {
  assertPublicReportRouteAllowed,
  canUseReadOnlyRealDbPreview,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../../report-route-guard";
import { withRecoraRealDbPreviewSearchParam } from "@/lib/recora/dev-preview/real-db-preview-url";

export const dynamic = "force-dynamic";

export default async function ReportOverviewPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  assertPublicReportRouteAllowed(projectSlug);

  const href = withRecoraVisualVariantSearchParam(`/dashboard/reports/${projectSlug}`, getRecoraVisualVariant(searchParams));
  redirect(withRecoraRealDbPreviewSearchParam(href, canUseReadOnlyRealDbPreview(projectSlug, searchParams)));
}
