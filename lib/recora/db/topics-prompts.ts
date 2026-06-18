import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import { getDefaultRecoraProjectSlug, getRecoraProject } from "./dashboard";
import type {
  RecoraPersonaRow,
  RecoraPromptRow,
  RecoraTopicRow,
  RecoraTopicsPromptsDbData
} from "./types";

const TOPIC_COLUMNS =
  "id, project_id, name, intent, priority, weight, is_active, created_at, updated_at";
const PROMPT_COLUMNS =
  "id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active, created_at, updated_at";
const PERSONA_COLUMNS =
  "id, project_id, name, segment, weight, jobs, pain_points, is_active, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export async function getRecoraTopicsPromptsData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraTopicsPromptsDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyTopicsPromptsData();
  }

  const [topics, prompts, personas] = await Promise.all([
    getTopics(project.id, supabase),
    getPrompts(project.id, supabase),
    getPersonas(project.id, supabase)
  ]);

  return {
    project,
    topics,
    prompts,
    personas
  };
}

function emptyTopicsPromptsData(): RecoraTopicsPromptsDbData {
  return {
    project: null,
    topics: [],
    prompts: [],
    personas: []
  };
}

async function getTopics(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_COLUMNS)
    .eq("project_id", projectId)
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false });

  throwIfSupabaseError("topics", error);
  return (data ?? []) as RecoraTopicRow[];
}

async function getPrompts(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("prompts")
    .select(PROMPT_COLUMNS)
    .eq("project_id", projectId)
    .order("is_active", { ascending: false })
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false });

  throwIfSupabaseError("prompts", error);
  return (data ?? []) as RecoraPromptRow[];
}

async function getPersonas(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("personas")
    .select(PERSONA_COLUMNS)
    .eq("project_id", projectId)
    .order("weight", { ascending: false })
    .order("name", { ascending: true });

  throwIfSupabaseError("personas", error);
  return (data ?? []) as RecoraPersonaRow[];
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora topics/prompts ${context}: ${error.message}`);
}
