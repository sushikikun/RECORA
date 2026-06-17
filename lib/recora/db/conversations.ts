import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRecoraMeasurementRun,
  getRecoraBrands,
  getRecoraProject
} from "./dashboard";
import type {
  RecoraAiConversationRow,
  RecoraAiModelRow,
  RecoraBrandMentionRow,
  RecoraCitationRow,
  RecoraConversationsDbData,
  RecoraPersonaRow,
  RecoraPromptRow,
  RecoraRunItemRow,
  RecoraTopicRow
} from "./types";

const RUN_ITEM_COLUMNS =
  "id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const PERSONA_COLUMNS =
  "id, project_id, name, segment, weight, jobs, pain_points, is_active, created_at, updated_at";
const TOPIC_COLUMNS =
  "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const AI_MODEL_COLUMNS =
  "id, provider, model_name, display_name, is_active, created_at, updated_at";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraConversationsData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraConversationsDbData> {
  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyConversationsData();
  }

  const latestRun = await getLatestRecoraMeasurementRun(project.id, supabase);

  if (!latestRun) {
    const brands = await getRecoraBrands(project.id, supabase);
    return { ...emptyConversationsData(), project, latestRun, brands };
  }

  const [brands, runItems] = await Promise.all([
    getRecoraBrands(project.id, supabase),
    getRunItems(latestRun.id, supabase)
  ]);

  const conversations = await getAiConversations(
    runItems.map((item) => item.id),
    supabase
  );

  const [prompts, personas, aiModels, brandMentions, citations] = await Promise.all([
    getPrompts(uniqueIds(runItems.map((item) => item.prompt_id)), supabase),
    getPersonas(uniqueIds(runItems.map((item) => item.persona_id)), supabase),
    getAiModels(uniqueIds(runItems.map((item) => item.model_id)), supabase),
    getBrandMentions(uniqueIds(conversations.map((item) => item.id)), supabase),
    getCitations(uniqueIds(conversations.map((item) => item.id)), supabase)
  ]);

  const topics = await getTopics(uniqueIds(prompts.map((item) => item.topic_id)), supabase);

  return {
    project,
    latestRun,
    brands,
    runItems,
    prompts,
    personas,
    topics,
    aiModels,
    conversations,
    brandMentions,
    citations
  };
}

function emptyConversationsData(): RecoraConversationsDbData {
  return {
    project: null,
    latestRun: null,
    brands: [],
    runItems: [],
    prompts: [],
    personas: [],
    topics: [],
    aiModels: [],
    conversations: [],
    brandMentions: [],
    citations: []
  };
}

async function getRunItems(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("run_items")
    .select(RUN_ITEM_COLUMNS)
    .eq("run_id", runId)
    .order("captured_at", { ascending: false });

  throwIfSupabaseError("run_items", error);
  return (data ?? []) as RecoraRunItemRow[];
}

async function getAiConversations(runItemIds: string[], supabase: RecoraSupabaseClient) {
  if (runItemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select(AI_CONVERSATION_COLUMNS)
    .in("run_item_id", runItemIds)
    .order("captured_at", { ascending: false });

  throwIfSupabaseError("ai_conversations", error);
  return (data ?? []) as RecoraAiConversationRow[];
}

async function getPrompts(promptIds: string[], supabase: RecoraSupabaseClient) {
  if (promptIds.length === 0) return [];

  const { data, error } = await supabase.from("prompts").select(PROMPT_COLUMNS).in("id", promptIds);

  throwIfSupabaseError("prompts", error);
  return (data ?? []) as RecoraPromptRow[];
}

async function getPersonas(personaIds: string[], supabase: RecoraSupabaseClient) {
  if (personaIds.length === 0) return [];

  const { data, error } = await supabase.from("personas").select(PERSONA_COLUMNS).in("id", personaIds);

  throwIfSupabaseError("personas", error);
  return (data ?? []) as RecoraPersonaRow[];
}

async function getTopics(topicIds: string[], supabase: RecoraSupabaseClient) {
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase.from("topics").select(TOPIC_COLUMNS).in("id", topicIds);

  throwIfSupabaseError("topics", error);
  return (data ?? []) as RecoraTopicRow[];
}

async function getAiModels(modelIds: string[], supabase: RecoraSupabaseClient) {
  if (modelIds.length === 0) return [];

  const { data, error } = await supabase.from("ai_models").select(AI_MODEL_COLUMNS).in("id", modelIds);

  throwIfSupabaseError("ai_models", error);
  return (data ?? []) as RecoraAiModelRow[];
}

async function getBrandMentions(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("brand_mentions")
    .select(BRAND_MENTION_COLUMNS)
    .in("conversation_id", conversationIds)
    .order("position", { ascending: true });

  throwIfSupabaseError("brand_mentions", error);
  return (data ?? []) as RecoraBrandMentionRow[];
}

async function getCitations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select(CITATION_COLUMNS)
    .in("conversation_id", conversationIds)
    .order("occurrence_count", { ascending: false });

  throwIfSupabaseError("citations", error);
  return (data ?? []) as RecoraCitationRow[];
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora conversations ${context}: ${error.message}`);
}
