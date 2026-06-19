import { PersonasConfigPage } from "@/components/recora/report-pages";
import { getRecoraTopicsPromptsData } from "@/lib/recora/db";

const CURRENT_PROJECT_SLUG = "recora-kenzai-q2";

export const dynamic = "force-dynamic";

export default async function ConfigPersonasPage() {
  const topicsPromptsData = await getTopicsPromptsDataOrNull();

  return <PersonasConfigPage topicsPromptsData={topicsPromptsData} />;
}

async function getTopicsPromptsDataOrNull() {
  try {
    const data = await getRecoraTopicsPromptsData(CURRENT_PROJECT_SLUG);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora personas config data.", error);
    return null;
  }
}
