import { TopicsPromptsDbPage } from "@/components/recora/topics-prompts-page";
import { getRecoraTopicsPromptsData } from "@/lib/recora/db";

const CURRENT_PROJECT_SLUG = "mieruca-seo-demo";

export const dynamic = "force-dynamic";

export default async function ConfigTopicsPromptsPage() {
  const { data, loadError } = await getTopicsPromptsDataOrNull();

  return <TopicsPromptsDbPage topicsPromptsData={data} loadError={loadError} />;
}

async function getTopicsPromptsDataOrNull() {
  try {
    const data = await getRecoraTopicsPromptsData(CURRENT_PROJECT_SLUG);
    return { data, loadError: false };
  } catch (error) {
    console.warn("Failed to load Recora topics/prompts data.", error);
    return { data: null, loadError: true };
  }
}
