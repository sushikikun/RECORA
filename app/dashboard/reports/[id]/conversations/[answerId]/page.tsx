import { RecoraCustomerDashboardV03Page } from "@/components/recora/customer-dashboard-v03";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute
} from "../../../report-route-guard";

type ReportAnswerDetailPageProps = {
  params: {
    id: string;
    answerId: string;
  };
  searchParams?: {
    visual?: string;
    data?: string | string[];
  };
};

export const dynamic = "force-dynamic";

export default async function ReportAnswerDetailPage({ params, searchParams }: ReportAnswerDetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(
    projectSlug,
    () => (
      <RecoraCustomerDashboardV03Page
        page="answerDetail"
        projectSlug={projectSlug}
        projectName="Recora"
        detailId={params.answerId}
      />
    ),
    { searchParams }
  );
}
