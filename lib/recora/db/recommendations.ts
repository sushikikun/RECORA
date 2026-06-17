import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRunWithMetricSnapshots,
  getRecoraBrands,
  getRecoraProject,
  getRecoraRecommendations
} from "./dashboard";
import type {
  RecoraPromptRow,
  RecoraRecommendationsDbData,
  RecoraTopicRow
} from "./types";

const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const TOPIC_COLUMNS = "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraRecommendationsData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraRecommendationsDbData> {
  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyRecommendationsData();
  }

  const [latestRun, brands, recommendations] = await Promise.all([
    getLatestRunWithMetricSnapshots(project.id, supabase),
    getRecoraBrands(project.id, supabase),
    getRecoraRecommendations(project.id, supabase)
  ]);

  const [topics, prompts] = await Promise.all([
    getTopics(uniqueIds(recommendations.map((item) => item.related_topic_id)), supabase),
    getPrompts(uniqueIds(recommendations.map((item) => item.related_prompt_id)), supabase)
  ]);

  return {
    project,
    latestRun,
    brands,
    recommendations,
    topics,
    prompts
  };
}

function emptyRecommendationsData(): RecoraRecommendationsDbData {
  return {
    project: null,
    latestRun: null,
    brands: [],
    recommendations: [],
    topics: [],
    prompts: []
  };
}

async function getTopics(topicIds: string[], supabase: RecoraSupabaseClient) {
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase.from("topics").select(TOPIC_COLUMNS).in("id", topicIds);

  throwIfSupabaseError("topics", error);
  return (data ?? []) as RecoraTopicRow[];
}

async function getPrompts(promptIds: string[], supabase: RecoraSupabaseClient) {
  if (promptIds.length === 0) return [];

  const { data, error } = await supabase.from("prompts").select(PROMPT_COLUMNS).in("id", promptIds);

  throwIfSupabaseError("prompts", error);
  return (data ?? []) as RecoraPromptRow[];
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora recommendations ${context}: ${error.message}`);
}
