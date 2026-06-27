import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getRecoraBrands,
  getRecoraProject
} from "./dashboard";
import { getLatestRecoraReportContext } from "./report-context";
import {
  isDisplayableCitation,
  isOpenAiMeasuredConversation
} from "./display-filters";
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
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at, provider, model_requested, model_returned, response_id, web_search_enabled, citation_status, measured_at, response_time_ms";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const PERSONA_COLUMNS =
  "id, project_id, name, segment, weight, jobs, pain_points, is_active, created_at, updated_at";
const TOPIC_COLUMNS =
  "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const AI_MODEL_COLUMNS =
  "id, provider, model_name, display_name, is_active, created_at, updated_at";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, mention_count, first_mention_index, evidence_snippet, confidence, matched_alias, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at, canonical_url, start_index, end_index, cited_text, brand_related, source_to_claim_status, claim_text, source_to_claim_note, source_retrieved_at, source_published_at, source_last_modified_at, source_freshness_status, source_freshness_days";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraConversationsData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraConversationsDbData> {
  const supabase = createRecoraSupabaseClient();
  const reportContext = await getLatestRecoraReportContext(projectSlug, supabase);
  const project = reportContext.project ?? await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyConversationsData();
  }

  const brands = await getRecoraBrands(project.id, supabase);
  const sourceMeasurementRunId = reportContext.sourceMeasurementRunId;

  if (!sourceMeasurementRunId || !reportContext.sourceMeasurementRun) {
    return { ...emptyConversationsData(), project, latestRun: null, brands };
  }

  const candidateRunItems = await getRunItemsForRuns([sourceMeasurementRunId], supabase);

  const conversations = (await getAiConversations(
    candidateRunItems.map((item) => item.id),
    supabase
  )).filter(isOpenAiMeasuredConversation);
  const visibleRunItemIds = new Set(conversations.map((item) => item.run_item_id));
  const runItems = candidateRunItems.filter((item) => visibleRunItemIds.has(item.id));
  const latestRun = reportContext.sourceMeasurementRun;

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

async function getRunItemsForRuns(runIds: string[], supabase: RecoraSupabaseClient) {
  if (runIds.length === 0) return [];

  const { data, error } = await supabase
    .from("run_items")
    .select(RUN_ITEM_COLUMNS)
    .in("run_id", runIds)
    .order("captured_at", { ascending: false })
    .order("created_at", { ascending: false });

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
  return ((data ?? []) as RecoraCitationRow[]).filter(isDisplayableCitation);
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora conversations ${context}: ${error.message}`);
}
