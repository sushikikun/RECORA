import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import { getDefaultRecoraProjectSlug, getRecoraBrands, getRecoraProject } from "./dashboard";
import { isDisplayableCitation } from "./display-filters";
import type {
  Json,
  RecoraAiConversationRow,
  RecoraAiModelRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraPersonaRow,
  RecoraProjectRow,
  RecoraPromptRow,
  RecoraRunItemRow,
  RecoraRunStatus,
  RecoraTopicRow
} from "./types";

const RUN_HISTORY_LIMIT = 50;

const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";
const RUN_ITEM_COLUMNS =
  "id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at, provider, model_requested, model_returned, response_id, web_search_enabled, citation_status, measured_at, response_time_ms";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, mention_count, first_mention_index, evidence_snippet, confidence, matched_alias, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at, canonical_url, start_index, end_index, cited_text, brand_related";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const TOPIC_COLUMNS = "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const PERSONA_COLUMNS = "id, project_id, name, segment, weight, jobs, pain_points, is_active, created_at, updated_at";
const AI_MODEL_COLUMNS = "id, provider, model_name, display_name, is_active, created_at, updated_at";
const METRIC_SNAPSHOT_COLUMNS =
  "id, run_id, scope_type, scope_id, brand_id, ai_visibility, ai_mention_count, citation_count, share_of_voice, competitive_gap, average_position, calculated_at, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export type RecoraRunHistoryKind = "measurement" | "aggregate" | "sample" | "unknown";

export type RecoraRunHistoryItem = {
  id: string;
  status: RecoraRunStatus;
  kind: RecoraRunHistoryKind;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  sourceRunId: string | null;
  searchMode: string | null;
  measurementProfileId: string | null;
  measurementProfileLabel: string | null;
  measurementProfilePromptCount: number | null;
  measurementProfileExpectedRunItems: number | null;
  promptCount: number;
  runItemCount: number;
  aiConversationCount: number;
  brandMentionCount: number;
  citationCount: number;
  metricSnapshotCount: number;
  aggregateSnapshotCount: number;
  isAggregated: boolean;
};

export type RecoraRunsDbData = {
  project: RecoraProjectRow | null;
  runs: RecoraRunHistoryItem[];
};

export type RecoraRunDetailBrandMentionRow = RecoraBrandMentionRow & {
  mention_count: number;
  first_mention_index: number | null;
  evidence_snippet: string | null;
  confidence: string;
  matched_alias: string | null;
};

export type RecoraRunDetailSummary = {
  promptCount: number;
  expectedRunItems: number | null;
  runItemCount: number;
  aiConversationCount: number;
  brandMentionCount: number;
  citationCount: number;
  sourceDomainCount: number;
  failedItemCount: number;
  metricSnapshotCount: number;
};

export type RecoraRunDetailDbData = {
  project: RecoraProjectRow | null;
  run: RecoraMeasurementRunRow | null;
  kind: RecoraRunHistoryKind;
  sourceRunId: string | null;
  searchMode: string | null;
  measurementProfileId: string | null;
  measurementProfileLabel: string | null;
  measurementProfilePromptCount: number | null;
  measurementProfileExpectedRunItems: number | null;
  selectedPromptIds: string[];
  relatedAggregateRuns: RecoraMeasurementRunRow[];
  brands: RecoraBrandRow[];
  runItems: RecoraRunItemRow[];
  prompts: RecoraPromptRow[];
  topics: RecoraTopicRow[];
  personas: RecoraPersonaRow[];
  aiModels: RecoraAiModelRow[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraRunDetailBrandMentionRow[];
  citations: RecoraCitationRow[];
  metricSnapshots: RecoraMetricSnapshotRow[];
  summary: RecoraRunDetailSummary;
};

type MeasurementRunHistoryRow = {
  id: string;
  project_id: string;
  status: RecoraRunStatus;
  period_start: string;
  period_end: string;
  comparison_start: string | null;
  comparison_end: string | null;
  region: string;
  language: string;
  started_at: string | null;
  completed_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

type RunItemHistoryRow = {
  id: string;
  run_id: string;
  prompt_id: string;
};

type ConversationHistoryRow = {
  id: string;
  run_item_id: string;
  provider: string | null;
  web_search_enabled: boolean;
};

type CountableConversationChildRow = {
  id: string;
  conversation_id: string;
};

type MetricSnapshotHistoryRow = {
  id: string;
  run_id: string;
  scope_type: string;
};

export async function getRecoraRunsData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraRunsDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return { project: null, runs: [] };
  }

  const runs = await getMeasurementRuns(project.id, supabase);
  const runIds = runs.map((run) => run.id);

  if (runIds.length === 0) {
    return { project, runs: [] };
  }

  const runItems = await getRunItems(runIds, supabase);
  const runItemIds = runItems.map((item) => item.id);
  const conversations = await getConversations(runItemIds, supabase);
  const conversationIds = conversations.map((conversation) => conversation.id);

  const [brandMentions, citations, metricSnapshots] = await Promise.all([
    getBrandMentions(conversationIds, supabase),
    getCitations(conversationIds, supabase),
    getMetricSnapshots(runIds, supabase)
  ]);

  return {
    project,
    runs: buildRunHistoryItems(runs, runItems, conversations, brandMentions, citations, metricSnapshots)
  };
}

export async function getRecoraRunDetailData(
  projectSlug = getDefaultRecoraProjectSlug(),
  runId: string
): Promise<RecoraRunDetailDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyRunDetailData();
  }

  const run = await getMeasurementRunById(project.id, runId, supabase);

  if (!run) {
    return emptyRunDetailData(project);
  }

  const [runItems, metricSnapshots, brands, relatedAggregateRuns] = await Promise.all([
    getRunItemsForRun(run.id, supabase),
    getMetricSnapshotsForRun(run.id, supabase),
    getRecoraBrands(project.id, supabase),
    getAggregateRunsForSourceRun(project.id, run.id, supabase)
  ]);
  const runItemIds = runItems.map((item) => item.id);
  const [conversations, prompts, personas, aiModels] = await Promise.all([
    getConversationsForRunItems(runItemIds, supabase),
    getPromptsByIds(uniqueIds(runItems.map((item) => item.prompt_id)), supabase),
    getPersonasByIds(uniqueIds(runItems.map((item) => item.persona_id)), supabase),
    getAiModelsByIds(uniqueIds(runItems.map((item) => item.model_id)), supabase)
  ]);
  const topics = await getTopicsByIds(uniqueIds(prompts.map((prompt) => prompt.topic_id)), supabase);
  const conversationIds = conversations.map((conversation) => conversation.id);
  const [brandMentions, citations] = await Promise.all([
    getBrandMentionsForConversations(conversationIds, supabase),
    getCitationsForConversations(conversationIds, supabase)
  ]);
  const displayableCitations = citations.filter(isDisplayableCitation);
  const metadata = getMetadataRecord(run.metadata);
  const kind = classifyRunKind(run, runItems.length, conversations, metricSnapshots.length);

  return {
    project,
    run,
    kind,
    sourceRunId: getMetadataString(metadata, "source_run_id"),
    searchMode: getSearchMode(metadata, conversations),
    measurementProfileId: getMetadataString(metadata, "measurement_profile_id"),
    measurementProfileLabel: getMetadataString(metadata, "measurement_profile_label"),
    measurementProfilePromptCount: getMetadataNumber(metadata, "prompt_count"),
    measurementProfileExpectedRunItems: getMetadataNumber(metadata, "expected_run_items"),
    selectedPromptIds: getMetadataStringArray(metadata, "selected_prompt_ids"),
    relatedAggregateRuns,
    brands,
    runItems,
    prompts,
    topics,
    personas,
    aiModels,
    conversations,
    brandMentions,
    citations: displayableCitations,
    metricSnapshots,
    summary: {
      promptCount: uniqueCount(runItems.map((item) => item.prompt_id)),
      expectedRunItems: getMetadataNumber(metadata, "expected_run_items"),
      runItemCount: runItems.length,
      aiConversationCount: conversations.length,
      brandMentionCount: brandMentions.length,
      citationCount: displayableCitations.length,
      sourceDomainCount: uniqueCount(displayableCitations.map((citation) => citation.source_domain_id ?? citation.domain)),
      failedItemCount: runItems.filter((item) => item.status === "failed").length,
      metricSnapshotCount: metricSnapshots.length
    }
  };
}

function emptyRunDetailData(project: RecoraProjectRow | null = null): RecoraRunDetailDbData {
  return {
    project,
    run: null,
    kind: "unknown",
    sourceRunId: null,
    searchMode: null,
    measurementProfileId: null,
    measurementProfileLabel: null,
    measurementProfilePromptCount: null,
    measurementProfileExpectedRunItems: null,
    selectedPromptIds: [],
    relatedAggregateRuns: [],
    brands: [],
    runItems: [],
    prompts: [],
    topics: [],
    personas: [],
    aiModels: [],
    conversations: [],
    brandMentions: [],
    citations: [],
    metricSnapshots: [],
    summary: {
      promptCount: 0,
      expectedRunItems: null,
      runItemCount: 0,
      aiConversationCount: 0,
      brandMentionCount: 0,
      citationCount: 0,
      sourceDomainCount: 0,
      failedItemCount: 0,
      metricSnapshotCount: 0
    }
  };
}

async function getMeasurementRunById(projectId: string, runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("id", runId)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs", error);
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
    .order("created_at", { ascending: true });

  throwIfSupabaseError("brand_mentions", error);
  return (data ?? []) as RecoraRunDetailBrandMentionRow[];
}

async function getCitationsForConversations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select(CITATION_COLUMNS)
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  throwIfSupabaseError("citations", error);
  return (data ?? []) as RecoraCitationRow[];
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

async function getPersonasByIds(personaIds: string[], supabase: RecoraSupabaseClient) {
  if (personaIds.length === 0) return [];

  const { data, error } = await supabase
    .from("personas")
    .select(PERSONA_COLUMNS)
    .in("id", personaIds);

  throwIfSupabaseError("personas", error);
  return (data ?? []) as RecoraPersonaRow[];
}

async function getAiModelsByIds(modelIds: string[], supabase: RecoraSupabaseClient) {
  if (modelIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_models")
    .select(AI_MODEL_COLUMNS)
    .in("id", modelIds);

  throwIfSupabaseError("ai_models", error);
  return (data ?? []) as RecoraAiModelRow[];
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

async function getAggregateRunsForSourceRun(projectId: string, sourceRunId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("metadata->>run_kind", "aggregate")
    .eq("metadata->>data_source", "openai_measurement")
    .eq("metadata->>source_run_id", sourceRunId)
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError("measurement_runs aggregate", error);
  return (data ?? []) as RecoraMeasurementRunRow[];
}

async function getMeasurementRuns(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(RUN_HISTORY_LIMIT);

  throwIfSupabaseError("measurement_runs", error);
  return (data ?? []) as MeasurementRunHistoryRow[];
}

async function getRunItems(runIds: string[], supabase: RecoraSupabaseClient) {
  if (runIds.length === 0) return [];

  const { data, error } = await supabase
    .from("run_items")
    .select("id, run_id, prompt_id")
    .in("run_id", runIds);

  throwIfSupabaseError("run_items", error);
  return (data ?? []) as RunItemHistoryRow[];
}

async function getConversations(runItemIds: string[], supabase: RecoraSupabaseClient) {
  if (runItemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, run_item_id, provider, web_search_enabled")
    .in("run_item_id", runItemIds);

  throwIfSupabaseError("ai_conversations", error);
  return (data ?? []) as ConversationHistoryRow[];
}

async function getBrandMentions(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("brand_mentions")
    .select("id, conversation_id")
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("brand_mentions", error);
  return (data ?? []) as CountableConversationChildRow[];
}

async function getCitations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select("id, conversation_id")
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("citations", error);
  return (data ?? []) as CountableConversationChildRow[];
}

async function getMetricSnapshots(runIds: string[], supabase: RecoraSupabaseClient) {
  if (runIds.length === 0) return [];

  const { data, error } = await supabase
    .from("metric_snapshots")
    .select("id, run_id, scope_type")
    .in("run_id", runIds);

  throwIfSupabaseError("metric_snapshots", error);
  return (data ?? []) as MetricSnapshotHistoryRow[];
}

function buildRunHistoryItems(
  runs: MeasurementRunHistoryRow[],
  runItems: RunItemHistoryRow[],
  conversations: ConversationHistoryRow[],
  brandMentions: CountableConversationChildRow[],
  citations: CountableConversationChildRow[],
  metricSnapshots: MetricSnapshotHistoryRow[]
) {
  const runItemsByRunId = groupBy(runItems, (item) => item.run_id);
  const runIdByRunItemId = new Map(runItems.map((item) => [item.id, item.run_id]));
  const conversationsByRunId = groupBy(conversations, (conversation) => runIdByRunItemId.get(conversation.run_item_id) ?? "");
  const runIdByConversationId = new Map(
    conversations.map((conversation) => [conversation.id, runIdByRunItemId.get(conversation.run_item_id) ?? ""])
  );
  const brandMentionsByRunId = groupBy(brandMentions, (mention) => runIdByConversationId.get(mention.conversation_id) ?? "");
  const citationsByRunId = groupBy(citations, (citation) => runIdByConversationId.get(citation.conversation_id) ?? "");
  const metricSnapshotsByRunId = groupBy(metricSnapshots, (snapshot) => snapshot.run_id);
  const aggregateSnapshotsBySourceRunId = buildAggregateSnapshotsBySourceRunId(runs, metricSnapshotsByRunId);

  return runs.map((run) => {
    const metadata = getMetadataRecord(run.metadata);
    const sourceRunId = getMetadataString(metadata, "source_run_id");
    const runItemsForRun = runItemsByRunId.get(run.id) ?? [];
    const conversationsForRun = conversationsByRunId.get(run.id) ?? [];
    const metricSnapshotsForRun = metricSnapshotsByRunId.get(run.id) ?? [];
    const kind = classifyRunKind(run, runItemsForRun.length, conversationsForRun, metricSnapshotsForRun.length);
    const aggregateSnapshotCount = aggregateSnapshotsBySourceRunId.get(run.id) ?? 0;

    return {
      id: run.id,
      status: run.status,
      kind,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      createdAt: run.created_at,
      sourceRunId,
      searchMode: getSearchMode(metadata, conversationsForRun),
      measurementProfileId: getMetadataString(metadata, "measurement_profile_id"),
      measurementProfileLabel: getMetadataString(metadata, "measurement_profile_label"),
      measurementProfilePromptCount: getMetadataNumber(metadata, "prompt_count"),
      measurementProfileExpectedRunItems: getMetadataNumber(metadata, "expected_run_items"),
      promptCount: uniqueCount(runItemsForRun.map((item) => item.prompt_id)),
      runItemCount: runItemsForRun.length,
      aiConversationCount: conversationsForRun.length,
      brandMentionCount: (brandMentionsByRunId.get(run.id) ?? []).length,
      citationCount: (citationsByRunId.get(run.id) ?? []).length,
      metricSnapshotCount: metricSnapshotsForRun.length,
      aggregateSnapshotCount,
      isAggregated: kind === "aggregate" || metricSnapshotsForRun.length > 0 || aggregateSnapshotCount > 0
    } satisfies RecoraRunHistoryItem;
  });
}

function buildAggregateSnapshotsBySourceRunId(
  runs: MeasurementRunHistoryRow[],
  metricSnapshotsByRunId: Map<string, MetricSnapshotHistoryRow[]>
) {
  const snapshotsBySourceRunId = new Map<string, number>();

  for (const run of runs) {
    const metadata = getMetadataRecord(run.metadata);
    if (getMetadataString(metadata, "run_kind") !== "aggregate") continue;

    const sourceRunId = getMetadataString(metadata, "source_run_id");
    if (!sourceRunId) continue;

    snapshotsBySourceRunId.set(
      sourceRunId,
      (snapshotsBySourceRunId.get(sourceRunId) ?? 0) + (metricSnapshotsByRunId.get(run.id) ?? []).length
    );
  }

  return snapshotsBySourceRunId;
}

function classifyRunKind(
  run: MeasurementRunHistoryRow,
  runItemCount: number,
  conversations: ConversationHistoryRow[],
  metricSnapshotCount: number
): RecoraRunHistoryKind {
  const metadata = getMetadataRecord(run.metadata);
  const runKind = getMetadataString(metadata, "run_kind");
  const dataSource = getMetadataString(metadata, "data_source");

  if (runKind === "aggregate") return "aggregate";
  if (dataSource === "openai_measurement" || conversations.some((conversation) => conversation.provider === "openai")) {
    return "measurement";
  }
  if (run.id.startsWith("70000000-") || (runItemCount > 0 && metricSnapshotCount > 0)) {
    return "sample";
  }
  if (runItemCount > 0) {
    return "measurement";
  }

  return "unknown";
}

function getSearchMode(metadata: Record<string, unknown>, conversations: ConversationHistoryRow[]) {
  const metadataSearchMode = getMetadataString(metadata, "search_mode");
  if (metadataSearchMode) return metadataSearchMode;
  if (conversations.length === 0) return null;

  const webSearchCount = conversations.filter((conversation) => conversation.web_search_enabled).length;
  const noSearchCount = conversations.length - webSearchCount;

  if (webSearchCount > 0 && noSearchCount > 0) return "both";
  if (webSearchCount > 0) return "web-search";
  return "no-search";
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;

    const existing = grouped.get(key);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getMetadataRecord(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value ? value : null;
}

function getMetadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getMetadataStringArray(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora runs ${context}: ${error.message}`);
}
