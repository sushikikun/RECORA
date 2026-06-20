import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRunWithMetricSnapshots,
  getRecoraBrands,
  getRecoraProject,
  getSourceMeasurementRunId
} from "./dashboard";
import { isDisplayableCitation, isOpenAiMeasuredConversation } from "./display-filters";
import type {
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraCitationRow,
  RecoraLeaderboardDbData,
  RecoraMetricSnapshotRow,
  RecoraPromptRow,
  RecoraRunItemRow,
  RecoraTopicRow
} from "./types";

const RUN_ITEM_COLUMNS =
  "id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at, provider, model_requested, model_returned, response_id, web_search_enabled, citation_status, measured_at, response_time_ms";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at, canonical_url, start_index, end_index, cited_text, brand_related";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const TOPIC_COLUMNS = "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const METRIC_SNAPSHOT_COLUMNS =
  "id, run_id, scope_type, scope_id, brand_id, ai_visibility, ai_mention_count, citation_count, share_of_voice, competitive_gap, average_position, calculated_at, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraLeaderboardData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraLeaderboardDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyLeaderboardData();
  }

  const latestRun = await getLatestRunWithMetricSnapshots(project.id, supabase);
  const brandsPromise = getRecoraBrands(project.id, supabase);

  if (!latestRun) {
    const brands = await brandsPromise;
    return { ...emptyLeaderboardData(), project, latestRun, brands };
  }

  const sourceMeasurementRunId = getSourceMeasurementRunId(latestRun);

  const [brands, metricSnapshots, runItems] = await Promise.all([
    brandsPromise,
    getBrandMetricSnapshots(latestRun.id, supabase),
    getRunItems(sourceMeasurementRunId ?? latestRun.id, supabase)
  ]);

  const conversations = (await getAiConversations(
    runItems.map((item) => item.id),
    supabase
  )).filter(isOpenAiMeasuredConversation);
  const conversationIds = uniqueIds(conversations.map((item) => item.id));

  const [brandMentions, citations, prompts] = await Promise.all([
    getBrandMentions(conversationIds, supabase),
    getCitations(conversationIds, supabase),
    getPrompts(uniqueIds(runItems.map((item) => item.prompt_id)), supabase)
  ]);

  const topics = await getTopics(uniqueIds(prompts.map((item) => item.topic_id)), supabase);

  return {
    project,
    latestRun,
    brands,
    metricSnapshots,
    runItems,
    conversations,
    brandMentions,
    citations,
    prompts,
    topics
  };
}

function emptyLeaderboardData(): RecoraLeaderboardDbData {
  return {
    project: null,
    latestRun: null,
    brands: [],
    metricSnapshots: [],
    runItems: [],
    conversations: [],
    brandMentions: [],
    citations: [],
    prompts: [],
    topics: []
  };
}

async function getRunItems(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("run_items")
    .select(RUN_ITEM_COLUMNS)
    .eq("run_id", runId);

  throwIfSupabaseError("run_items", error);
  return (data ?? []) as RecoraRunItemRow[];
}

async function getBrandMetricSnapshots(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("metric_snapshots")
    .select(METRIC_SNAPSHOT_COLUMNS)
    .eq("run_id", runId)
    .eq("scope_type", "brand")
    .order("ai_visibility", { ascending: false })
    .order("created_at", { ascending: true });

  throwIfSupabaseError("metric_snapshots", error);
  return (data ?? []) as RecoraMetricSnapshotRow[];
}

async function getAiConversations(runItemIds: string[], supabase: RecoraSupabaseClient) {
  if (runItemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select(AI_CONVERSATION_COLUMNS)
    .in("run_item_id", runItemIds);

  throwIfSupabaseError("ai_conversations", error);
  return (data ?? []) as RecoraAiConversationRow[];
}

async function getBrandMentions(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("brand_mentions")
    .select(BRAND_MENTION_COLUMNS)
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("brand_mentions", error);
  return (data ?? []) as RecoraBrandMentionRow[];
}

async function getCitations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select(CITATION_COLUMNS)
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("citations", error);
  return ((data ?? []) as RecoraCitationRow[]).filter(isDisplayableCitation);
}

async function getPrompts(promptIds: string[], supabase: RecoraSupabaseClient) {
  if (promptIds.length === 0) return [];

  const { data, error } = await supabase.from("prompts").select(PROMPT_COLUMNS).in("id", promptIds);

  throwIfSupabaseError("prompts", error);
  return (data ?? []) as RecoraPromptRow[];
}

async function getTopics(topicIds: string[], supabase: RecoraSupabaseClient) {
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase.from("topics").select(TOPIC_COLUMNS).in("id", topicIds);

  throwIfSupabaseError("topics", error);
  return (data ?? []) as RecoraTopicRow[];
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora leaderboard ${context}: ${error.message}`);
}
