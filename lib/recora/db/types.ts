export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RecoraBrandType = "primary" | "competitor";
export type RecoraPriority = "high" | "medium" | "low";
export type RecoraRunStatus = "draft" | "running" | "completed" | "failed";
export type RecoraMetricScopeType =
  | "project"
  | "brand"
  | "topic"
  | "persona"
  | "model"
  | "prompt"
  | "source_domain";
export type RecoraRecommendationType =
  | "content"
  | "source"
  | "technical"
  | "prompt"
  | "risk"
  | "competitive";
export type RecoraRecommendationState = "open" | "planned" | "done" | "dismissed";

export type RecoraProjectRow = {
  id: string;
  slug: string;
  name: string;
  workspace_name: string | null;
  language: string;
  region: string;
  default_period: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoraBrandRow = {
  id: string;
  project_id: string;
  brand_type: RecoraBrandType;
  name: string;
  reading: string | null;
  domain: string | null;
  aliases: Json;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoraMeasurementRunRow = {
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
  created_at: string;
  updated_at: string;
};

export type RecoraMetricSnapshotRow = {
  id: string;
  run_id: string;
  scope_type: RecoraMetricScopeType;
  scope_id: string | null;
  brand_id: string | null;
  ai_visibility: number;
  ai_mention_count: number;
  citation_count: number;
  share_of_voice: number;
  competitive_gap: number | null;
  average_position: number | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;
};

export type RecoraRecommendationRow = {
  id: string;
  project_id: string;
  run_id: string | null;
  type: RecoraRecommendationType;
  priority: RecoraPriority;
  impact_score: number;
  effort_score: number | null;
  title: string;
  reason: string | null;
  target_url: string | null;
  related_topic_id: string | null;
  related_prompt_id: string | null;
  status: RecoraRecommendationState;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type RecoraDashboardCounts = {
  aiConversations: number;
  citations: number;
};

export type RecoraDashboardDbData = {
  project: RecoraProjectRow | null;
  latestRun: RecoraMeasurementRunRow | null;
  brands: RecoraBrandRow[];
  metricSnapshots: RecoraMetricSnapshotRow[];
  recommendations: RecoraRecommendationRow[];
  counts: RecoraDashboardCounts;
};
