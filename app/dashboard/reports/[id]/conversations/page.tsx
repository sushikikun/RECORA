import { ConversationsPage } from "@/components/recora/report-pages";
import { getRecoraConversationsData } from "@/lib/recora/db";

export const dynamic = "force-dynamic";

export default async function ReportConversationsPage() {
  const conversationsData = await getConversationsDataOrNull();

  return <ConversationsPage conversationsData={conversationsData} />;
}

async function getConversationsDataOrNull() {
  try {
    const data = await getRecoraConversationsData();
    return data.project && data.conversations.length > 0 ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora conversations data. Falling back to sample data.", error);
    return null;
  }
}
