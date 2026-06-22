import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  evaluateRecoraReportReadyGate,
  isCustomerVisibleRecommendation,
  type RecoraReportDataOriginStatus
} from "@/lib/recora/report-eligibility";
import type {
  RecoraBrandRow,
  RecoraDashboardCounts,
  RecoraDashboardDbData,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraProjectRow,
  RecoraRecommendationRow
} from "./types";
import { getMetadataRecord, getMetadataString, isDisplayableRecommendation, isOpenAiAggregateRun } from "./display-filters";

const PROJECT_COLUMNS =
  "id, organization_id, slug, name, workspace_name, language, region, default_period, created_at, updated_at";
const ORGANIZATION_ORIGIN_COLUMNS =
  "id, organization_type, data_environment, is_demo";
const BRAND_COLUMNS =
  "id, project_id, brand_type, name, reading, domain, aliases, category, description, is_active, created_at, updated_at";
const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";
const METRIC_SNAPSHOT_COLUMNS =
  "id, run_id, scope_type, scope_id, brand_id, ai_visibility, ai_mention_count, citation_count, share_of_voice, competitive_gap, average_position, calculated_at, created_at, updated_at";
const RECOMMENDATION_COLUMNS =
  "id, project_id, run_id, type, priority, impact_score, effort_score, title, reason, target_url, related_topic_id, related_prompt_id, status, metadata, created_at, updated_at";
const LIVE_RECOMMENDATION_PROFILE_IDS = ["standard-v01", "custom-openai-run"] as const;

type RecoraSupabaseClient = SupabaseClient;
type RecoraOrganizationOriginRow = {
  id: string;
  organization_type: string | null;
  data_environment: string | null;
  is_demo: boolean | null;
};

export function getDefaultRecoraProjectSlug() {
  return process.env.RECORA_DEFAULT_PROJECT_SLUG?.trim() ?? "";
}

export async function getRecoraProject(
  projectSlug = getDefaultRecoraProjectSlug(),
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraProjectRow | null> {
  const normalizedSlug = projectSlug.trim();
  if (!normalizedSlug) return null;

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("slug", normalizedSlug)
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

export async function getRecoraProjectDataOrigin(
  organizationId: string | null,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraReportDataOriginStatus> {
  if (!organizationId) return "unknown";

  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_ORIGIN_COLUMNS)
    .eq("id", organizationId)
    .maybeSingle();

  throwIfSupabaseError("organizations", error);

  const origin = (data as RecoraOrganizationOriginRow | null) ?? null;
  if (!origin) return "unknown";
  if (origin.is_demo || origin.data_environment === "demo" || origin.data_environment === "local") {
    return "demo_or_local";
  }
  if (origin.organization_type === "client" && origin.data_environment === "production" && origin.is_demo === false) {
    return "customer_data";
  }

  return "unknown";
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
    .eq("metadata->>run_kind", "aggregate")
    .eq("metadata->>data_source", "openai_measurement")
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs", error);
  const run = (data as RecoraMeasurementRunRow | null) ?? null;
  if (!run) return null;

  if (!isOpenAiAggregateRun(run)) return null;

  const runIdsWithSnapshots = await getMetricSnapshotRunIdsOrNull([run.id], supabase);
  if (runIdsWithSnapshots === null) return run;
  return runIdsWithSnapshots.has(run.id) ? run : null;
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

export async function getRecoraMetricSnapshotsOrEmpty(
  runId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient(),
  context = "metric_snapshots"
): Promise<RecoraMetricSnapshotRow[]> {
  try {
    return await getRecoraMetricSnapshots(runId, supabase);
  } catch (error) {
    logRecoraReadModelWarning(context, error, { runId });
    return [];
  }
}

export async function getRecoraRecommendations(
  projectId: string,
  sourceMeasurementRunId: string | null = null,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient(),
  options: { aggregateRunId?: string | null } = {}
): Promise<RecoraRecommendationRow[]> {
  if (!sourceMeasurementRunId) return [];

  const { data, error } = await supabase
    .from("recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("project_id", projectId)
    .eq("metadata->>measurement_run_id", sourceMeasurementRunId)
    .in("metadata->>measurement_profile_id", [...LIVE_RECOMMENDATION_PROFILE_IDS])
    .eq("metadata->>data_source", "openai_measurement")
    .order("impact_score", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError("recommendations", error);
  return ((data ?? []) as RecoraRecommendationRow[])
    .filter((item) => isLiveShowRecommendation(item, sourceMeasurementRunId, options.aggregateRunId ?? null))
    .filter(isDisplayableRecommendation)
    .filter((item) =>
      isCustomerVisibleRecommendation({
        status: item.status,
        metadata: getMetadataRecord(item.metadata)
      })
    );
}

export async function getLatestStandardV01MeasurementRun(
  projectId: string,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraMeasurementRunRow | null> {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .eq("metadata->>run_kind", "measurement")
    .eq("metadata->>data_source", "openai_measurement")
    .eq("metadata->>measurement_profile_id", "standard-v01")
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError("measurement_runs", error);
  return (data as RecoraMeasurementRunRow | null) ?? null;
}

function isLiveShowRecommendation(
  item: RecoraRecommendationRow,
  sourceMeasurementRunId: string,
  aggregateRunId: string | null
) {
  const metadata = getMetadataRecord(item.metadata);
  const source = getMetadataString(metadata, "source");
  const profileId = getMetadataString(metadata, "measurement_profile_id");
  const aggregateRunMatches =
    profileId !== "custom-openai-run" ||
    Boolean(aggregateRunId && getMetadataString(metadata, "aggregate_run_id") === aggregateRunId);

  return (
    source === "recommendation_candidate_generator" &&
    getMetadataString(metadata, "measurement_run_id") === sourceMeasurementRunId &&
    isLiveRecommendationProfileId(profileId) &&
    getMetadataString(metadata, "data_source") === "openai_measurement" &&
    aggregateRunMatches
  );
}

function isLiveRecommendationProfileId(profileId: string | null) {
  return LIVE_RECOMMENDATION_PROFILE_IDS.some((allowedProfileId) => allowedProfileId === profileId);
}

export function getSourceMeasurementRunId(run: Pick<RecoraMeasurementRunRow, "id" | "metadata"> | null | undefined) {
  if (!run) return null;

  const metadata = getMetadataRecord(run.metadata);
  return getMetadataString(metadata, "source_run_id") ?? run.id;
}

export async function getRecoraDashboardCounts(
  runId: string | null,
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraDashboardCounts> {
  if (!runId) {
    return { aiConversations: 0, validObservations: 0, citations: 0 };
  }

  const runItems = await getRunItemsForCounts(runId, supabase);
  if (runItems.length === 0) {
    return { aiConversations: 0, validObservations: 0, citations: 0 };
  }

  const conversations = await getConversationsForCounts(runItems.map((item) => item.id), supabase);
  if (conversations.length === 0) {
    return { aiConversations: 0, validObservations: 0, citations: 0 };
  }

  const validRunItemIds = new Set(
    runItems
      .filter((item) => item.status === "completed" && !item.error_message)
      .map((item) => item.id)
  );
  const validObservationCount = conversations.filter((conversation) =>
    validRunItemIds.has(conversation.run_item_id) &&
    (conversation.provider === "openai" || Boolean(conversation.response_id))
  ).length;
  const citationIds = await getCitationIds(conversations.map((conversation) => conversation.id), supabase);

  return {
    aiConversations: conversations.length,
    validObservations: validObservationCount,
    citations: citationIds.length
  };
}

export async function getRecoraDashboardData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraDashboardDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyDashboardData(projectSlug);
  }

  const latestRun = await getLatestRunWithMetricSnapshots(project.id, supabase);
  const latestStandardRunPromise = getLatestStandardV01MeasurementRun(project.id, supabase);
  const sourceMeasurementRunId = getSourceMeasurementRunId(latestRun);

  const [brands, metricSnapshots, latestStandardRun, counts, dataOriginStatus] = await Promise.all([
    getRecoraBrands(project.id, supabase),
    latestRun ? getRecoraMetricSnapshotsOrEmpty(latestRun.id, supabase, "dashboard_metric_snapshots") : Promise.resolve([]),
    latestStandardRunPromise,
    getRecoraDashboardCounts(sourceMeasurementRunId, supabase),
    getRecoraProjectDataOrigin(project.organization_id, supabase)
  ]);
  const recommendationSourceRunId = sourceMeasurementRunId ?? latestStandardRun?.id ?? null;
  const recommendations = await getRecoraRecommendations(project.id, recommendationSourceRunId, supabase, {
    aggregateRunId: sourceMeasurementRunId ? latestRun?.id ?? null : null
  });
  const reportReadyGate = evaluateRecoraReportReadyGate({
    projectSlug,
    projectExists: true,
    run: latestRun
      ? {
          id: latestRun.id,
          status: latestRun.status,
          metadata: getMetadataRecord(latestRun.metadata),
          started_at: latestRun.started_at,
          completed_at: latestRun.completed_at
        }
      : null,
    metricSnapshotCount: metricSnapshots.length,
    validObservationCount: counts.validObservations,
    hasPlaceholderEvidence: dataOriginStatus !== "customer_data",
    dataOriginStatus,
    sourceMeasurementRunId,
    customerVisibleRecommendationCount: recommendations.length,
    internalRecommendationCandidateCount: null
  });

  return {
    project,
    latestRun,
    brands,
    metricSnapshots,
    recommendations,
    counts,
    reportReadyGate
  };
}

function emptyDashboardData(projectSlug: string | null = null): RecoraDashboardDbData {
  return {
    project: null,
    latestRun: null,
    brands: [],
    metricSnapshots: [],
    recommendations: [],
    counts: {
      aiConversations: 0,
      validObservations: 0,
      citations: 0
    },
    reportReadyGate: evaluateRecoraReportReadyGate({
      projectSlug,
      projectExists: false,
      run: null,
      metricSnapshotCount: 0,
      validObservationCount: 0,
      dataOriginStatus: "unknown",
      customerVisibleRecommendationCount: null,
      internalRecommendationCandidateCount: null
    })
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

async function getMetricSnapshotRunIdsOrNull(runIds: string[], supabase: RecoraSupabaseClient) {
  try {
    return await getMetricSnapshotRunIds(runIds, supabase);
  } catch (error) {
    logRecoraReadModelWarning("latest_aggregate_metric_snapshot_check", error, {
      runIdCount: runIds.length,
      firstRunId: runIds[0] ?? null
    });
    return null;
  }
}
async function getRunItemsForCounts(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("run_items")
    .select("id, status, error_message")
    .eq("run_id", runId);

  throwIfSupabaseError("run_items", error);
  return (data ?? []) as Array<{ id: string; status: string | null; error_message: string | null }>;
}

async function getConversationsForCounts(runItemIds: string[], supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, run_item_id, provider, response_id")
    .in("run_item_id", runItemIds);

  throwIfSupabaseError("ai_conversations", error);
  return (data ?? []) as Array<{
    id: string;
    run_item_id: string;
    provider: string | null;
    response_id: string | null;
  }>;
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

export function logRecoraReadModelWarning(
  context: string,
  error: unknown,
  details: Record<string, string | number | boolean | null> = {}
) {
  console.warn("Recora dashboard read model warning.", {
    context,
    ...details,
    error: getSafeErrorSummary(error)
  });
}

function getSafeErrorSummary(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      message: typeof record.message === "string" ? record.message : undefined,
      details: typeof record.details === "string" ? record.details : undefined
    };
  }

  return { message: String(error) };
}
