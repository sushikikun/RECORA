import { RunCyclePanel } from "@/components/recora/run-cycle-panel";
import { RunHistoryList } from "@/components/recora/run-history-list";
import { getRecoraRunsData } from "@/lib/recora/db";

const CURRENT_REPORT_SLUG = "recora-kenzai-q2";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportRunsPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export default async function Page({ params }: ReportRunsPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  const { runsData, loadError } = await getRunsDataOrNull(projectSlug);

  return (
    <>
      <RunCyclePanel projectSlug={projectSlug} />
      <RunHistoryList projectSlug={projectSlug} runsData={runsData} loadError={loadError} />
    </>
  );
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

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
