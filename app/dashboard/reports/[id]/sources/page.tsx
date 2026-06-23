import { SourcesPage } from "@/components/recora/report-pages";
import { getRecoraSourcesData } from "@/lib/recora/db";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportSourcesPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    const sourcesData = await getSourcesDataOrNull(projectSlug);

    return <SourcesPage sourcesData={sourcesData} />;
  });
}

async function getSourcesDataOrNull(projectSlug: string) {
  try {
    const data = await getRecoraSourcesData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora sources data.", error);
    return null;
  }
}
