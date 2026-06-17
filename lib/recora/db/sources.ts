import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRecoraMeasurementRun,
  getRecoraProject
} from "./dashboard";
import type {
  RecoraCitationRow,
  RecoraSourcesDbData,
  RecoraSourceDomainRow
} from "./types";

const SOURCE_DOMAIN_COLUMNS =
  "id, project_id, domain, source_type, owner_brand_id, trust_label, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraSourcesData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraSourcesDbData> {
  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptySourcesData();
  }

  const latestRun = await getLatestRecoraMeasurementRun(project.id, supabase);
  const sourceDomainsPromise = getSourceDomains(project.id, supabase);

  if (!latestRun) {
    const sourceDomains = await sourceDomainsPromise;
    return { ...emptySourcesData(), project, latestRun, sourceDomains };
  }

  const [sourceDomains, runItemIds] = await Promise.all([
    sourceDomainsPromise,
    getRunItemIds(latestRun.id, supabase)
  ]);

  const conversationIds = await getConversationIds(runItemIds, supabase);
  const citations = await getCitations(conversationIds, supabase);

  return {
    project,
    latestRun,
    sourceDomains,
    citations
  };
}

function emptySourcesData(): RecoraSourcesDbData {
  return {
    project: null,
    latestRun: null,
    sourceDomains: [],
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
  return (data ?? []) as RecoraSourceDomainRow[];
}

async function getRunItemIds(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase.from("run_items").select("id").eq("run_id", runId);

  throwIfSupabaseError("run_items", error);
  return ((data ?? []) as Array<{ id: string }>).map((item) => item.id);
}

async function getConversationIds(runItemIds: string[], supabase: RecoraSupabaseClient) {
  if (runItemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id")
    .in("run_item_id", runItemIds);

  throwIfSupabaseError("ai_conversations", error);
  return ((data ?? []) as Array<{ id: string }>).map((conversation) => conversation.id);
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
  return (data ?? []) as RecoraCitationRow[];
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error("Failed to load Recora sources " + context + ": " + error.message);
}
