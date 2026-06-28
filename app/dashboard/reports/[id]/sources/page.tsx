import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { SourcesPage } from "@/components/recora/report-pages";
import { canUseCustomerReportDesignLabReport } from "@/lib/recora/customer-report-design-lab/access";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportSourcesPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  if (canUseCustomerReportDesignLabReport(projectSlug, searchParams)) {
    return <CustomerReportDesignLab activePage="sources" />;
  }

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      const { getDesignCheckSourcesData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
      return <SourcesPage sourcesData={getDesignCheckSourcesData()} />;
    }

    const sourcesData = await getSourcesDataOrNull(projectSlug);

    return <SourcesPage sourcesData={sourcesData} />;
  }, { searchParams });
}

async function getSourcesDataOrNull(projectSlug: string) {
  try {
    const { getRecoraSourcesData } = await import("@/lib/recora/db");
    const data = await getRecoraSourcesData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora sources data.", error);
    return null;
  }
}
