import { ConversationsPage } from "@/components/recora/report-pages";
import { getRecoraConversationsData } from "@/lib/recora/db";

const CURRENT_REPORT_SLUG = "mieruca-seo-demo";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportConversationsPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ReportConversationsPage({ params }: ReportConversationsPageProps) {
  const conversationsData = await getConversationsDataOrNull(normalizeReportSlug(params.id));

  return <ConversationsPage conversationsData={conversationsData} />;
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

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
