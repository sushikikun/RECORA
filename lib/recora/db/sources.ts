import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getRecoraProject
} from "./dashboard";
import {
  isDisplayableCitation,
  isDisplayableSourceDomain,
  isOpenAiAggregateRun,
  isOpenAiMeasuredConversation,
  isSeedMeasurementRunId
} from "./display-filters";
import type {
  RecoraAiConversationRow,
  RecoraCitationRow,
  RecoraMeasurementRunRow,
  RecoraRunItemRow,
  RecoraSourcesDbData,
  RecoraSourceDomainRow
} from "./types";

const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";
const SOURCE_DOMAIN_COLUMNS =
  "id, project_id, domain, source_type, owner_brand_id, trust_label, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at, canonical_url, start_index, end_index, cited_text, brand_related";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at, provider, model_requested, model_returned, response_id, web_search_enabled, citation_status, measured_at, response_time_ms";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraSourcesData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraSourcesDbData> {
  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptySourcesData();
  }

  const [sourceDomains, completedRuns] = await Promise.all([
    getSourceDomains(project.id, supabase),
    getCompletedRuns(project.id, supabase)
  ]);
  const candidateRunIds = completedRuns
    .filter((run) => !isSeedMeasurementRunId(run.id) && !isOpenAiAggregateRun(run))
    .map((run) => run.id);

  if (candidateRunIds.length === 0) {
    return { ...emptySourcesData(), project, latestRun: null, sourceDomains };
  }

  const candidateRunItems = await getRunItemsForRuns(candidateRunIds, supabase);
  const conversations = (await getAiConversations(candidateRunItems.map((item) => item.id), supabase))
    .filter(isOpenAiMeasuredConversation);
  const visibleRunItemIds = new Set(conversations.map((item) => item.run_item_id));
  const runItems = candidateRunItems.filter((item) => visibleRunItemIds.has(item.id));
  const latestRun = getLatestRunForRunItems(completedRuns, runItems);
  const conversationIds = conversations.map((conversation) => conversation.id);
  const citations = await getCitations(conversationIds, supabase);

  return {
    project,
    latestRun,
    sourceDomains,
    conversations,
    citations
  };
}

function emptySourcesData(): RecoraSourcesDbData {
  return {
    project: null,
    latestRun: null,
    sourceDomains: [],
    conversations: [],
    citations: []
  };
}

async function getSourceDomains(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("source_domains")
    .select(SOURCE_DOMAIN_COLUMNS)
    .eq("project_id", projectId)
    .order("source_type", { ascending: true })
    .order("domain", { ascending: true });

  throwIfSupabaseError("source_domains", error);
  return ((data ?? []) as RecoraSourceDomainRow[]).filter(isDisplayableSourceDomain);
}

async function getCompletedRuns(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError("measurement_runs", error);
  return (data ?? []) as RecoraMeasurementRunRow[];
}

async function getRunItemsForRuns(runIds: string[], supabase: RecoraSupabaseClient) {
  if (runIds.length === 0) return [];

  const { data, error } = await supabase
    .from("run_items")
    .select("id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at")
    .in("run_id", runIds);

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

async function getCitations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select(CITATION_COLUMNS)
    .in("conversation_id", conversationIds)
    .order("occurrence_count", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError("citations", error);
  return ((data ?? []) as RecoraCitationRow[]).filter(isDisplayableCitation);
}

function getLatestRunForRunItems(runs: RecoraMeasurementRunRow[], runItems: RecoraRunItemRow[]) {
  const runIds = new Set(runItems.map((item) => item.run_id));
  return runs.find((run) => runIds.has(run.id)) ?? null;
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error("Failed to load Recora sources " + context + ": " + error.message);
}
