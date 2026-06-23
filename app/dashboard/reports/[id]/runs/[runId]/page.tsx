import { RunDetailPage } from "@/components/recora/run-detail-page";
import { getRecoraRunDetailData } from "@/lib/recora/db";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute
} from "../../../report-route-guard";

type ReportRunDetailPageProps = {
  params: {
    id: string;
    runId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ReportRunDetailPage({ params }: ReportRunDetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    const runDetailData = await getRunDetailDataOrNull(projectSlug, params.runId);

    return <RunDetailPage data={runDetailData} projectSlug={projectSlug} runId={params.runId} />;
  });
}

async function getRunDetailDataOrNull(projectSlug: string, runId: string) {
  try {
    const data = await getRecoraRunDetailData(projectSlug, runId);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora run detail data.", error);
    return null;
  }
}
