import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import type {
  RecoraBrandRow,
  RecoraDashboardCounts,
  RecoraDashboardDbData,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraProjectRow,
  RecoraRecommendationRow
} from "./types";

const DEFAULT_PROJECT_SLUG = "recora-kenzai-q2";

const PROJECT_COLUMNS =
  "id, slug, name, workspace_name, language, region, default_period, created_at, updated_at";
const BRAND_COLUMNS =
  "id, project_id, brand_type, name, reading, domain, aliases, category, description, is_active, created_at, updated_at";
const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, created_at, updated_at";
const METRIC_SNAPSHOT_COLUMNS =
  "id, run_id, scope_type, scope_id, brand_id, ai_visibility, ai_mention_count, citation_count, share_of_voice, competitive_gap, average_position, calculated_at, created_at, updated_at";
const RECOMMENDATION_COLUMNS =
  "id, project_id, run_id, type, priority, impact_score, effort_score, title, reason, target_url, related_topic_id, related_prompt_id, status, metadata, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export function getDefaultRecoraProjectSlug() {
  return process.env.RECORA_DEFAULT_PROJECT_SLUG ?? DEFAULT_PROJECT_SLUG;
}

export async function getRecoraProject(
  projectSlug = getDefaultRecoraProjectSlug(),
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("slug", projectSlug)
    .maybeSingle();

  throwIfSupabaseError("projects", error);
  return (data as RecoraProjectRow | null) ?? null;
}

export async function getRecoraBrands(
  projectId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraBrandRow[]> {
  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_COLUMNS)
    .eq("project_id", projectId)
    .order("brand_type", { ascending: true })
    .order("name", { ascending: true });

  throwIfSupabaseError("brands", error);
  return (data ?? []) as RecoraBrandRow[];
}

export async function getLatestRecoraMeasurementRun(
  projectId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraMeasurementRunRow | null> {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs", error);
  return (data as RecoraMeasurementRunRow | null) ?? null;
}

export async function getLatestRunWithMetricSnapshots(
  projectId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraMeasurementRunRow | null> {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  throwIfSupabaseError("measurement_runs", error);
  const runs = (data ?? []) as RecoraMeasurementRunRow[];
  if (runs.length === 0) return null;

  const runIdsWithSnapshots = await getMetricSnapshotRunIds(
    runs.map((run) => run.id),
    supabase
  );

  return runs.find((run) => runIdsWithSnapshots.has(run.id)) ?? null;
}

export async function getRecoraMetricSnapshots(
  runId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraMetricSnapshotRow[]> {
  const { data, error } = await supabase
    .from("metric_snapshots")
    .select(METRIC_SNAPSHOT_COLUMNS)
    .eq("run_id", runId)
    .order("scope_type", { ascending: true })
    .order("ai_visibility", { ascending: false });

  throwIfSupabaseError("metric_snapshots", error);
  return (data ?? []) as RecoraMetricSnapshotRow[];
}

export async function getRecoraRecommendations(
  projectId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraRecommendationRow[]> {
  const { data, error } = await supabase
    .from("recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("project_id", projectId)
    .order("impact_score", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError("recommendations", error);
  return (data ?? []) as RecoraRecommendationRow[];
}

export async function getRecoraDashboardCounts(
  runId: string | null,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraDashboardCounts> {
  if (!runId) {
    return { aiConversations: 0, citations: 0 };
  }

  const runItemIds = await getRunItemIds(runId, supabase);
  if (runItemIds.length === 0) {
    return { aiConversations: 0, citations: 0 };
  }

  const conversationIds = await getConversationIds(runItemIds, supabase);
  if (conversationIds.length === 0) {
    return { aiConversations: 0, citations: 0 };
  }

  const citationIds = await getCitationIds(conversationIds, supabase);

  return {
    aiConversations: conversationIds.length,
    citations: citationIds.length
  };
}

export async function getRecoraDashboardData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraDashboardDbData> {
  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyDashboardData();
  }

  const latestRun = await getLatestRunWithMetricSnapshots(project.id, supabase);

  const [brands, metricSnapshots, recommendations, counts] = await Promise.all([
    getRecoraBrands(project.id, supabase),
    latestRun ? getRecoraMetricSnapshots(latestRun.id, supabase) : Promise.resolve([]),
    getRecoraRecommendations(project.id, supabase),
    getRecoraDashboardCounts(latestRun?.id ?? null, supabase)
  ]);

  return {
    project,
    latestRun,
    brands,
    metricSnapshots,
    recommendations,
    counts
  };
}

function emptyDashboardData(): RecoraDashboardDbData {
  return {
    project: null,
    latestRun: null,
    brands: [],
    metricSnapshots: [],
    recommendations: [],
    counts: {
      aiConversations: 0,
      citations: 0
    }
  };
}

async function getMetricSnapshotRunIds(runIds: string[], supabase: RecoraSupabaseClient) {
  if (runIds.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from("metric_snapshots")
    .select("run_id")
    .in("run_id", runIds);

  throwIfSupabaseError("metric_snapshots", error);
  return new Set(((data ?? []) as Array<{ run_id: string }>).map((snapshot) => snapshot.run_id));
}
async function getRunItemIds(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase.from("run_items").select("id").eq("run_id", runId);

  throwIfSupabaseError("run_items", error);
  return ((data ?? []) as Array<{ id: string }>).map((item) => item.id);
}

async function getConversationIds(runItemIds: string[], supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id")
    .in("run_item_id", runItemIds);

  throwIfSupabaseError("ai_conversations", error);
  return ((data ?? []) as Array<{ id: string }>).map((conversation) => conversation.id);
}

async function getCitationIds(conversationIds: string[], supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("citations")
    .select("id")
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("citations", error);
  return ((data ?? []) as Array<{ id: string }>).map((citation) => citation.id);
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) {
    return;
  }

  throw new Error(`Failed to load Recora ${context}: ${error.message}`);
}
