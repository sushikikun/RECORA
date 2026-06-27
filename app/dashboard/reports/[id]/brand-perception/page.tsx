import { BrandPerceptionPage } from "@/components/recora/report-pages";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportBrandPerceptionPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      return <BrandPerceptionPage qualityState="limited" />;
    }

    return <BrandPerceptionPage qualityState="limited" brandPerceptionData={await getBrandPerceptionDataOrNull(projectSlug)} />;
  }, { searchParams });
}

async function getBrandPerceptionDataOrNull(projectSlug: string) {
  try {
    const { getRecoraBrandPerceptionData } = await import("@/lib/recora/db");
    const data = await getRecoraBrandPerceptionData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora brand perception data.", error);
    return null;
  }
}
