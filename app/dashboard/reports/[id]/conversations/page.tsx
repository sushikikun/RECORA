import { ConversationsPage } from "@/components/recora/report-pages";
import { getRecoraConversationsData } from "@/lib/recora/db";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportConversationsPage({ params }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  return renderCustomerReadyReportRoute(projectSlug, async () => {
    const conversationsData = await getConversationsDataOrNull(projectSlug);

    return <ConversationsPage conversationsData={conversationsData} />;
  });
}

async function getConversationsDataOrNull(projectSlug: string) {
  try {
    const data = await getRecoraConversationsData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora conversations data.", error);
    return null;
  }
}
