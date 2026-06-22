import { RunDetailPage } from "@/components/recora/run-detail-page";
import { getRecoraDashboardData, getRecoraRunDetailData } from "@/lib/recora/db";

const CURRENT_REPORT_SLUG = "mieruca-seo-demo";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportRunDetailPageProps = {
  params: {
    id: string;
    runId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ReportRunDetailPage({ params }: ReportRunDetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  const runDetailData = await getRunDetailDataOrNull(projectSlug, params.runId);

  return <RunDetailPage data={runDetailData} projectSlug={projectSlug} runId={params.runId} />;
}

async function getRunDetailDataOrNull(projectSlug: string, runId: string) {
  try {
    const dashboardData = await getRecoraDashboardData(projectSlug);
    if (dashboardData.reportReadyGate.status !== "customer_ready") return null;

    const data = await getRecoraRunDetailData(projectSlug, runId);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora run detail data.", error);
    return null;
  }
}

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
