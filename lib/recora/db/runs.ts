import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import { getDefaultRecoraProjectSlug, getRecoraProject } from "./dashboard";
import type { Json, RecoraProjectRow, RecoraRunStatus } from "./types";

const RUN_HISTORY_LIMIT = 50;

const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";

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

function getMetadataRecord(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value ? value : null;
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora runs ${context}: ${error.message}`);
}
