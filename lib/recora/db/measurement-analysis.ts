import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import {
  createRecoraMeasurementAnalysisReadModel,
  type RecoraMeasurementAnalysisReadModel
} from "@/lib/recora/measurement-analysis-read-model";
import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getRecoraBrands,
  getRecoraProject
} from "./dashboard";
import { isDisplayableCitation, isDisplayableRecommendation } from "./display-filters";
import type {
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraProjectRow,
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRunItemRow,
  RecoraSourceDomainRow,
  RecoraTopicRow
} from "./types";

const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";
const RUN_ITEM_COLUMNS =
  "id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at, provider, model_requested, model_returned, response_id, raw_response, usage, web_search_enabled, citation_status, measured_at, response_time_ms";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, mention_count, first_mention_index, evidence_snippet, confidence, matched_alias, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at, canonical_url, start_index, end_index, cited_text, raw_citation, brand_related, source_to_claim_status, claim_text, source_to_claim_note, source_retrieved_at, source_published_at, source_last_modified_at, source_freshness_status, source_freshness_days";
const SOURCE_DOMAIN_COLUMNS =
  "id, project_id, domain, source_type, owner_brand_id, trust_label, created_at, updated_at";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const TOPIC_COLUMNS =
  "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const METRIC_SNAPSHOT_COLUMNS =
  "id, run_id, scope_type, scope_id, brand_id, ai_visibility, ai_mention_count, citation_count, share_of_voice, competitive_gap, average_position, calculated_at, metadata, created_at, updated_at";
const RECOMMENDATION_COLUMNS =
  "id, project_id, run_id, type, priority, impact_score, effort_score, title, reason, target_url, related_topic_id, related_prompt_id, status, metadata, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export type RecoraMeasurementAnalysisDbData = {
  project: RecoraProjectRow | null;
  currentRun: RecoraMeasurementRunRow | null;
  previousRun: RecoraMeasurementRunRow | null;
  aggregateRun: RecoraMeasurementRunRow | null;
  brands: RecoraBrandRow[];
  runItems: RecoraRunItemRow[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraBrandMentionRow[];
  previousBrandMentions: RecoraBrandMentionRow[] | null;
  citations: RecoraCitationRow[];
  sourceDomains: RecoraSourceDomainRow[];
  metricSnapshots: RecoraMetricSnapshotRow[];
  recommendations: RecoraRecommendationRow[];
  prompts: RecoraPromptRow[];
  topics: RecoraTopicRow[];
  readModel: RecoraMeasurementAnalysisReadModel | null;
};

export async function getRecoraMeasurementAnalysisData(
  projectSlug = getDefaultRecoraProjectSlug(),
  measurementRunId: string | null = null
): Promise<RecoraMeasurementAnalysisDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyMeasurementAnalysisData();
  }

  const currentRun = measurementRunId
    ? await getMeasurementRunById(project.id, measurementRunId, supabase)
    : await getLatestMeasurementRun(project.id, supabase);

  if (!currentRun) {
    return { ...emptyMeasurementAnalysisData(), project };
  }

  const [brands, runItems, aggregateRun, previousRun, sourceDomains, recommendations] = await Promise.all([
    getRecoraBrands(project.id, supabase),
    getRunItemsForRun(currentRun.id, supabase),
    getLatestAggregateRunForSourceRun(project.id, currentRun.id, supabase),
    getPreviousMeasurementRun(project.id, currentRun, supabase),
    getSourceDomains(project.id, supabase),
    getRecommendationCandidates(project.id, currentRun.id, supabase)
  ]);
  const conversations = await getConversationsForRunItems(runItems.map((item) => item.id), supabase);
  const conversationIds = conversations.map((conversation) => conversation.id);
  const [brandMentions, citations, prompts, metricSnapshots, previousBrandMentions] = await Promise.all([
    getBrandMentionsForConversations(conversationIds, supabase),
    getCitationsForConversations(conversationIds, supabase),
    getPromptsByIds(uniqueIds(runItems.map((item) => item.prompt_id)), supabase),
    aggregateRun ? getMetricSnapshotsForRun(aggregateRun.id, supabase) : Promise.resolve([]),
    previousRun ? getPreviousBrandMentions(previousRun.id, supabase) : Promise.resolve(null)
  ]);
  const topics = await getTopicsByIds(uniqueIds(prompts.map((prompt) => prompt.topic_id)), supabase);
  const readModel = createRecoraMeasurementAnalysisReadModel({
    brands,
    runItems,
    conversations,
    brandMentions,
    citations,
    metricSnapshots,
    recommendations,
    previousBrandMentions,
    prompts,
    topics,
    sourceDomains
  });

  return {
    project,
    currentRun,
    previousRun,
    aggregateRun,
    brands,
    runItems,
    conversations,
    brandMentions,
    previousBrandMentions,
    citations,
    sourceDomains,
    metricSnapshots,
    recommendations,
    prompts,
    topics,
    readModel
  };
}

function emptyMeasurementAnalysisData(): RecoraMeasurementAnalysisDbData {
  return {
    project: null,
    currentRun: null,
    previousRun: null,
    aggregateRun: null,
    brands: [],
    runItems: [],
    conversations: [],
    brandMentions: [],
    previousBrandMentions: null,
    citations: [],
    sourceDomains: [],
    metricSnapshots: [],
    recommendations: [],
    prompts: [],
    topics: [],
    readModel: null
  };
}

async function getLatestMeasurementRun(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .eq("metadata->>run_kind", "measurement")
    .eq("metadata->>data_source", "openai_measurement")
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs latest", error);
  return (data as RecoraMeasurementRunRow | null) ?? null;
}

async function getMeasurementRunById(projectId: string, runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("id", runId)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs by id", error);
  return (data as RecoraMeasurementRunRow | null) ?? null;
}

async function getPreviousMeasurementRun(
  projectId: string,
  currentRun: RecoraMeasurementRunRow,
  supabase: RecoraSupabaseClient
) {
  const cutoff = currentRun.completed_at ?? currentRun.created_at;
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .eq("metadata->>run_kind", "measurement")
    .eq("metadata->>data_source", "openai_measurement")
    .lt("created_at", currentRun.created_at)
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs previous", error);
  const run = (data as RecoraMeasurementRunRow | null) ?? null;
  if (run && (run.completed_at ?? run.created_at) <= cutoff) return run;
  return run;
}

async function getLatestAggregateRunForSourceRun(
  projectId: string,
  sourceRunId: string,
  supabase: RecoraSupabaseClient
) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .eq("metadata->>run_kind", "aggregate")
    .eq("metadata->>data_source", "openai_measurement")
    .eq("metadata->>source_run_id", sourceRunId)
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs aggregate", error);
  return (data as RecoraMeasurementRunRow | null) ?? null;
}

async function getRunItemsForRun(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("run_items")
    .select(RUN_ITEM_COLUMNS)
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  throwIfSupabaseError("run_items", error);
  return (data ?? []) as RecoraRunItemRow[];
}

async function getConversationsForRunItems(runItemIds: string[], supabase: RecoraSupabaseClient) {
  if (runItemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select(AI_CONVERSATION_COLUMNS)
    .in("run_item_id", runItemIds)
    .order("captured_at", { ascending: true });

  throwIfSupabaseError("ai_conversations", error);
  return (data ?? []) as RecoraAiConversationRow[];
}

async function getBrandMentionsForConversations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("brand_mentions")
    .select(BRAND_MENTION_COLUMNS)
    .in("conversation_id", conversationIds)
    .order("position", { ascending: true });

  throwIfSupabaseError("brand_mentions", error);
  return (data ?? []) as RecoraBrandMentionRow[];
}

async function getCitationsForConversations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select(CITATION_COLUMNS)
    .in("conversation_id", conversationIds)
    .order("occurrence_count", { ascending: false })
    .order("created_at", { ascending: true });

  throwIfSupabaseError("citations", error);
  return ((data ?? []) as RecoraCitationRow[]).filter(isDisplayableCitation);
}

async function getSourceDomains(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("source_domains")
    .select(SOURCE_DOMAIN_COLUMNS)
    .eq("project_id", projectId)
    .order("source_type", { ascending: true })
    .order("domain", { ascending: true });

  throwIfSupabaseError("source_domains", error);
  return (data ?? []) as RecoraSourceDomainRow[];
}

async function getMetricSnapshotsForRun(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("metric_snapshots")
    .select(METRIC_SNAPSHOT_COLUMNS)
    .eq("run_id", runId)
    .order("scope_type", { ascending: true })
    .order("ai_visibility", { ascending: false });

  throwIfSupabaseError("metric_snapshots", error);
  return (data ?? []) as RecoraMetricSnapshotRow[];
}

async function getRecommendationCandidates(
  projectId: string,
  measurementRunId: string,
  supabase: RecoraSupabaseClient
) {
  const { data, error } = await supabase
    .from("recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("project_id", projectId)
    .eq("metadata->>source", "recommendation_candidate_generator")
    .eq("metadata->>measurement_run_id", measurementRunId)
    .eq("metadata->>data_source", "openai_measurement")
    .order("created_at", { ascending: false });

  throwIfSupabaseError("recommendations", error);
  return ((data ?? []) as RecoraRecommendationRow[]).filter(isDisplayableRecommendation);
}

async function getPreviousBrandMentions(runId: string, supabase: RecoraSupabaseClient) {
  const runItems = await getRunItemsForRun(runId, supabase);
  const conversations = await getConversationsForRunItems(runItems.map((item) => item.id), supabase);
  return getBrandMentionsForConversations(conversations.map((conversation) => conversation.id), supabase);
}

async function getPromptsByIds(promptIds: string[], supabase: RecoraSupabaseClient) {
  if (promptIds.length === 0) return [];

  const { data, error } = await supabase
    .from("prompts")
    .select(PROMPT_COLUMNS)
    .in("id", promptIds);

  throwIfSupabaseError("prompts", error);
  return (data ?? []) as RecoraPromptRow[];
}

async function getTopicsByIds(topicIds: string[], supabase: RecoraSupabaseClient) {
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_COLUMNS)
    .in("id", topicIds);

  throwIfSupabaseError("topics", error);
  return (data ?? []) as RecoraTopicRow[];
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora measurement analysis ${context}: ${error.message}`);
}
