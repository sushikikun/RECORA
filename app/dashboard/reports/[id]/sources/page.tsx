import { SourcesPage } from "@/components/recora/report-pages";
import { getRecoraSourcesData } from "@/lib/recora/db";

const CURRENT_REPORT_SLUG = "mieruca-seo-demo";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportSourcesPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ReportSourcesPage({ params }: ReportSourcesPageProps) {
  const sourcesData = await getSourcesDataOrNull(normalizeReportSlug(params.id));

  return <SourcesPage sourcesData={sourcesData} />;
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

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
