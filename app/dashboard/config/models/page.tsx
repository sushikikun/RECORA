import { ModelsConfigPage } from "@/components/recora/report-pages";
import { getRecoraConversationsData } from "@/lib/recora/db";

const CURRENT_PROJECT_SLUG = "mieruca-seo-demo";

export const dynamic = "force-dynamic";

export default async function ConfigModelsPage() {
  const conversationsData = await getConversationsDataOrNull();

  return <ModelsConfigPage conversationsData={conversationsData} />;
}

async function getConversationsDataOrNull() {
  try {
    const data = await getRecoraConversationsData(CURRENT_PROJECT_SLUG);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora models config data.", error);
    return null;
  }
}
