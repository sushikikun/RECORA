import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestStandardV01MeasurementRun,
  getLatestRunWithMetricSnapshots,
  getRecoraBrands,
  getRecoraProject,
  getRecoraRecommendations
} from "./dashboard";
import {
  getMetadataRecord,
  getMetadataString,
  isDisplayableRecommendation
} from "./display-filters";
import type {
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRecommendationsDbData,
  RecoraTopicRow
} from "./types";

const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const TOPIC_COLUMNS = "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const RECOMMENDATION_COLUMNS =
  "id, project_id, run_id, type, priority, impact_score, effort_score, title, reason, target_url, related_topic_id, related_prompt_id, status, metadata, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraRecommendationsData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraRecommendationsDbData> {
  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyRecommendationsData();
  }

  const [latestRun, latestStandardRun, brands] = await Promise.all([
    getLatestRunWithMetricSnapshots(project.id, supabase),
    getLatestStandardV01MeasurementRun(project.id, supabase),
    getRecoraBrands(project.id, supabase)
  ]);
  const [recommendations, allRecommendationCandidates] = await Promise.all([
    getRecoraRecommendations(project.id, latestStandardRun?.id ?? null, supabase),
    getRecoraRecommendationCandidates(project.id, latestStandardRun?.id ?? null, supabase)
  ]);
  const preQualityGateCandidateCount = latestStandardRun
    ? allRecommendationCandidates.filter((item) => {
        const metadata = getMetadataRecord(item.metadata);
        return getMetadataString(metadata, "display_decision") !== "show";
      }).length
    : null;

  const [topics, prompts] = await Promise.all([
    getTopics(uniqueIds(recommendations.map((item) => item.related_topic_id)), supabase),
    getPrompts(uniqueIds(recommendations.map((item) => item.related_prompt_id)), supabase)
  ]);

  return {
    project,
    latestRun,
    brands,
    recommendations,
    preQualityGateCandidateCount,
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
    preQualityGateCandidateCount: null,
    topics: [],
    prompts: []
  };
}

async function getRecoraRecommendationCandidates(
  projectId: string,
  latestStandardRunId: string | null,
  supabase: RecoraSupabaseClient
): Promise<RecoraRecommendationRow[]> {
  if (!latestStandardRunId) return [];

  const { data, error } = await supabase
    .from("recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("project_id", projectId)
    .eq("metadata->>measurement_run_id", latestStandardRunId)
    .eq("metadata->>measurement_profile_id", "standard-v01")
    .eq("metadata->>data_source", "openai_measurement")
    .order("impact_score", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError("recommendation candidates", error);
  return ((data ?? []) as RecoraRecommendationRow[])
    .filter((item) => isLatestStandardV01Candidate(item, latestStandardRunId))
    .filter(isDisplayableRecommendation);
}

function isLatestStandardV01Candidate(item: RecoraRecommendationRow, latestStandardRunId: string) {
  const metadata = getMetadataRecord(item.metadata);

  return (
    getMetadataString(metadata, "source") === "recommendation_candidate_generator" &&
    getMetadataString(metadata, "measurement_run_id") === latestStandardRunId &&
    getMetadataString(metadata, "measurement_profile_id") === "standard-v01" &&
    getMetadataString(metadata, "data_source") === "openai_measurement"
  );
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
