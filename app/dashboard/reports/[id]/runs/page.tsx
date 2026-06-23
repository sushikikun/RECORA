import { RunCyclePanel } from "@/components/recora/run-cycle-panel";
import { RunHistoryList } from "@/components/recora/run-history-list";
import { getRecoraRunsData } from "@/lib/recora/db";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function Page({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    const { runsData, loadError } = await getRunsDataOrNull(projectSlug);

    return (
      <>
        <RunCyclePanel projectSlug={projectSlug} />
        <RunHistoryList projectSlug={projectSlug} runsData={runsData} loadError={loadError} />
      </>
    );
  });
}

async function getRunsDataOrNull(projectSlug: string) {
  try {
    const data = await getRecoraRunsData(projectSlug);
    return { runsData: data.project ? data : null, loadError: false };
  } catch (error) {
    console.warn("Failed to load Recora run history data.", error);
    return { runsData: null, loadError: true };
  }
}
