import { RecoraCustomerDashboardV03Page } from "@/components/recora/customer-dashboard-v03";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute
} from "../../../report-route-guard";

type ReportPromptDetailPageProps = {
  params: {
    id: string;
    promptId: string;
  };
  searchParams?: {
    visual?: string;
    data?: string | string[];
  };
};

export const dynamic = "force-dynamic";

export default async function ReportPromptDetailPage({ params, searchParams }: ReportPromptDetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(
    projectSlug,
    () => (
      <RecoraCustomerDashboardV03Page
        page="promptDetail"
        projectSlug={projectSlug}
        projectName="Recora"
        detailId={params.promptId}
      />
    ),
    { searchParams }
  );
}
