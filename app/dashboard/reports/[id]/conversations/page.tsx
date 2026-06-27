import { ConversationsPage } from "@/components/recora/report-pages";
import {
  canUseDesignCheckReport,
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportConversationsPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    if (canUseDesignCheckReport(projectSlug)) {
      const { getDesignCheckConversationsData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
      return <ConversationsPage conversationsData={getDesignCheckConversationsData()} />;
    }

    const conversationsData = await getConversationsDataOrNull(projectSlug);

    return <ConversationsPage conversationsData={conversationsData} />;
  }, { searchParams });
}

async function getConversationsDataOrNull(projectSlug: string) {
  try {
    const { getRecoraConversationsData } = await import("@/lib/recora/db");
    const data = await getRecoraConversationsData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora conversations data.", error);
    return null;
  }
}
