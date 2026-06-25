import { RunCyclePanel } from "@/components/recora/run-cycle-panel";
import { RunHistoryList } from "@/components/recora/run-history-list";
import { PageHeader } from "@/components/recora/ui";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function Page({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      const { getDesignCheckRunsData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
      return (
        <>
          <PageHeader
            eyebrow="レポート詳細"
            title="実行履歴"
            description="この確認用レポートに紐づく測定と集計の状態を確認します。ここから新しい測定は実行できません。"
          />
          <RunHistoryList projectSlug={projectSlug} runsData={getDesignCheckRunsData()} />
        </>
      );
    }

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
    const { getRecoraRunsData } = await import("@/lib/recora/db");
    const data = await getRecoraRunsData(projectSlug);
    return { runsData: data.project ? data : null, loadError: false };
  } catch (error) {
    console.warn("Failed to load Recora run history data.", error);
    return { runsData: null, loadError: true };
  }
}
