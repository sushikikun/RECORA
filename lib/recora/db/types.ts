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
export type RecoraRunItemStatus = "queued" | "completed" | "failed" | "skipped";
export type RecoraRecommendationStatus =
  | "strongly_recommended"
  | "recommended"
  | "listed"
  | "neutral"
  | "absent"
  | "discouraged";
export type RecoraSentiment = "positive" | "neutral" | "negative" | "unclear";
export type RecoraSourceType =
  | "owned"
  | "competitor"
  | "media"
  | "review"
  | "technical"
  | "unknown";
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
export type RecoraCitationStatus = "unknown" | "not_requested" | "unavailable" | "available" | "partial" | "error";
export type RecoraBrandRelatedness = "unknown" | "target_brand" | "competitor" | "unknown_competitor" | "category" | "general" | "unrelated";

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
  metadata: Json;
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

export type RecoraPersonaRow = {
  id: string;
  project_id: string;
  name: string;
  segment: string | null;
  weight: number;
  jobs: Json;
  pain_points: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoraTopicRow = {
  id: string;
  project_id: string;
  name: string;
  intent: string | null;
  priority: RecoraPriority;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoraPromptRow = {
  id: string;
  project_id: string;
  topic_id: string;
  persona_id: string | null;
  text: string;
  intent: string | null;
  buyer_stage: string | null;
  priority: RecoraPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoraAiModelRow = {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoraRunItemRow = {
  id: string;
  run_id: string;
  prompt_id: string;
  persona_id: string;
  model_id: string;
  status: RecoraRunItemStatus;
  error_message: string | null;
  latency_ms: number | null;
  captured_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoraAiConversationRow = {
  id: string;
  run_item_id: string;
  raw_answer: string;
  answer_summary: string | null;
  answer_hash: string;
  prompt_text_snapshot: string;
  model_snapshot: string;
  captured_at: string;
  created_at: string;
  updated_at: string;
  provider: string | null;
  model_requested: string | null;
  model_returned: string | null;
  response_id: string | null;
  web_search_enabled: boolean;
  citation_status: RecoraCitationStatus;
  measured_at: string | null;
  response_time_ms: number | null;
};

export type RecoraBrandMentionRow = {
  id: string;
  conversation_id: string;
  brand_id: string;
  mentioned: boolean;
  position: number | null;
  recommendation_status: RecoraRecommendationStatus;
  sentiment: RecoraSentiment;
  answer_score: number;
  mention_text: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoraCitationRow = {
  id: string;
  conversation_id: string;
  brand_id: string | null;
  source_domain_id: string | null;
  url: string | null;
  domain: string;
  title: string | null;
  source_type: RecoraSourceType;
  supports_claim: boolean | null;
  occurrence_count: number;
  created_at: string;
  updated_at: string;
  canonical_url: string | null;
  start_index: number | null;
  end_index: number | null;
  cited_text: string | null;
  brand_related: RecoraBrandRelatedness;
};

export type RecoraSourceDomainRow = {
  id: string;
  project_id: string;
  domain: string;
  source_type: RecoraSourceType;
  owner_brand_id: string | null;
  trust_label: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoraConversationsDbData = {
  project: RecoraProjectRow | null;
  latestRun: RecoraMeasurementRunRow | null;
  brands: RecoraBrandRow[];
  runItems: RecoraRunItemRow[];
  prompts: RecoraPromptRow[];
  personas: RecoraPersonaRow[];
  topics: RecoraTopicRow[];
  aiModels: RecoraAiModelRow[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
};

export type RecoraSourcesDbData = {
  project: RecoraProjectRow | null;
  latestRun: RecoraMeasurementRunRow | null;
  sourceDomains: RecoraSourceDomainRow[];
  conversations: RecoraAiConversationRow[];
  citations: RecoraCitationRow[];
};

export type RecoraRecommendationsDbData = {
  project: RecoraProjectRow | null;
  latestRun: RecoraMeasurementRunRow | null;
  brands: RecoraBrandRow[];
  recommendations: RecoraRecommendationRow[];
  topics: RecoraTopicRow[];
  prompts: RecoraPromptRow[];
};

export type RecoraLeaderboardDbData = {
  project: RecoraProjectRow | null;
  latestRun: RecoraMeasurementRunRow | null;
  brands: RecoraBrandRow[];
  metricSnapshots: RecoraMetricSnapshotRow[];
  runItems: RecoraRunItemRow[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
  prompts: RecoraPromptRow[];
  topics: RecoraTopicRow[];
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

export type RecoraTopicsPromptsDbData = {
  project: RecoraProjectRow | null;
  topics: RecoraTopicRow[];
  prompts: RecoraPromptRow[];
  personas: RecoraPersonaRow[];
};
