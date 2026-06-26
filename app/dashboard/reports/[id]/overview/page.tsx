import { redirect } from "next/navigation";
import {
  getRecoraVisualVariant,
  withRecoraVisualVariantSearchParam
} from "@/lib/recora/dev-preview/design-visual-variant";
import {
  assertPublicReportRouteAllowed,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportOverviewPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  assertPublicReportRouteAllowed(projectSlug);

  redirect(withRecoraVisualVariantSearchParam(`/dashboard/reports/${projectSlug}`, getRecoraVisualVariant(searchParams)));
}