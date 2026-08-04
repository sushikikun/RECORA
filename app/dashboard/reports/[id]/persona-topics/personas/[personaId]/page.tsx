import { RecoraCustomerDashboardV03Page } from "@/components/recora/customer-dashboard-v03";
import { normalizeReportSlug, renderCustomerReadyReportRoute } from "../../../../report-route-guard";

type DetailPageProps = {
  params: { id: string; personaId: string };
  searchParams?: { visual?: string; data?: string | string[] };
};

export const dynamic = "force-dynamic";

export default async function DetailPage({ params, searchParams }: DetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  return renderCustomerReadyReportRoute(
    projectSlug,
    () => (
      <RecoraCustomerDashboardV03Page
        page="personaDetail"
        projectSlug={projectSlug}
        projectName="Recora"
        detailId={params.personaId}
      />
    ),
    { searchParams }
  );
}
