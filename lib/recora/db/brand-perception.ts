import { getDefaultRecoraProjectSlug } from "./dashboard";
import { getRecoraConversationsData } from "./conversations";
import type { RecoraBrandPerceptionDbData } from "./types";

export async function getRecoraBrandPerceptionData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraBrandPerceptionDbData> {
  return getRecoraConversationsData(projectSlug);
}
