import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRunWithMetricSnapshots,
  getRecoraBrands,
  getRecoraMetricSnapshots,
  getRecoraProject
} from "./dashboard";
import type {
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraCitationRow,
  RecoraLeaderboardDbData,
  RecoraPromptRow,
  RecoraRunItemRow,
  RecoraTopicRow
} from "./types";

const RUN_ITEM_COLUMNS =
  "id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const TOPIC_COLUMNS = "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraLeaderboardData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraLeaderboardDbData> {
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

  const [brands, metricSnapshots, runItems] = await Promise.all([
    brandsPromise,
    getRecoraMetricSnapshots(latestRun.id, supabase),
    getRunItems(latestRun.id, supabase)
  ]);

  const conversations = await getAiConversations(
    runItems.map((item) => item.id),
    supabase
  );
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
  return (data ?? []) as RecoraCitationRow[];
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
