-- Recora v0.1 schema
-- Scope:
-- - Store AI answer evidence first.
-- - Derive dashboard metrics from raw AI conversations, brand mentions, and citations.
-- - Do not create LP, billing, API, seed data, project_competitors, or extracted_claims in v0.1.
--
-- Important:
-- AI visibility / AI表示率 is a Recora-defined measurement metric.
-- It is not an official metric from OpenAI, Google, Anthropic, Perplexity, or any AI platform.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.recora_brand_type as enum (
  'primary',
  'competitor'
);

create type public.recora_priority as enum (
  'high',
  'medium',
  'low'
);

create type public.recora_run_status as enum (
  'draft',
  'running',
  'completed',
  'failed'
);

create type public.recora_run_item_status as enum (
  'queued',
  'completed',
  'failed',
  'skipped'
);

create type public.recora_recommendation_status as enum (
  'strongly_recommended',
  'recommended',
  'listed',
  'neutral',
  'absent',
  'discouraged'
);

create type public.recora_sentiment as enum (
  'positive',
  'neutral',
  'negative',
  'unclear'
);

create type public.recora_source_type as enum (
  'owned',
  'competitor',
  'media',
  'review',
  'technical',
  'unknown'
);

create type public.recora_metric_scope_type as enum (
  'project',
  'brand',
  'topic',
  'persona',
  'model',
  'prompt',
  'source_domain'
);

create type public.recora_recommendation_type as enum (
  'content',
  'source',
  'technical',
  'prompt',
  'risk',
  'competitive'
);

create type public.recora_recommendation_state as enum (
  'open',
  'planned',
  'done',
  'dismissed'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  workspace_name text,
  language text not null default 'ja',
  region text not null default 'JP',
  default_period text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.projects is
  'Recora analysis project. v0.1 focuses on dashboard measurement data, not billing or external integrations.';

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  brand_type public.recora_brand_type not null,
  name text not null,
  reading text,
  domain text,
  aliases jsonb not null default '[]'::jsonb,
  category text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_aliases_is_array check (jsonb_typeof(aliases) = 'array')
);

comment on table public.brands is
  'Stores both the primary brand and competitor brands. v0.1 intentionally does not create project_competitors.';

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  segment text,
  weight numeric(8,4) not null default 1,
  jobs jsonb not null default '[]'::jsonb,
  pain_points jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personas_weight_positive check (weight > 0),
  constraint personas_jobs_is_array check (jsonb_typeof(jobs) = 'array'),
  constraint personas_pain_points_is_array check (jsonb_typeof(pain_points) = 'array')
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  intent text,
  priority public.recora_priority not null default 'medium',
  weight numeric(8,4) not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_weight_positive check (weight > 0)
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  persona_id uuid references public.personas(id) on delete set null,
  text text not null,
  intent text,
  buyer_stage text,
  priority public.recora_priority not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model_name text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_models_provider_model_name_unique unique (provider, model_name)
);

create table public.measurement_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.recora_run_status not null default 'draft',
  period_start date not null,
  period_end date not null,
  comparison_start date,
  comparison_end date,
  region text not null default 'JP',
  language text not null default 'ja',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_runs_period_order check (period_end >= period_start),
  constraint measurement_runs_comparison_order check (
    comparison_start is null
    or comparison_end is null
    or comparison_end >= comparison_start
  ),
  constraint measurement_runs_completed_after_started check (
    started_at is null
    or completed_at is null
    or completed_at >= started_at
  )
);

create table public.run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.measurement_runs(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete restrict,
  persona_id uuid not null references public.personas(id) on delete restrict,
  model_id uuid not null references public.ai_models(id) on delete restrict,
  status public.recora_run_item_status not null default 'queued',
  error_message text,
  latency_ms integer,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint run_items_latency_non_negative check (latency_ms is null or latency_ms >= 0),
  constraint run_items_unique_measurement unique (run_id, prompt_id, persona_id, model_id)
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  run_item_id uuid not null references public.run_items(id) on delete cascade,
  raw_answer text not null,
  answer_summary text,
  answer_hash text not null,
  prompt_text_snapshot text not null,
  model_snapshot text not null,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_run_item_unique unique (run_item_id)
);

comment on table public.ai_conversations is
  'Raw AI answers are the source of truth. Scores and metric snapshots must remain explainable from this evidence.';

create table public.source_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  domain text not null,
  source_type public.recora_source_type not null default 'unknown',
  owner_brand_id uuid references public.brands(id) on delete set null,
  trust_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_domains_project_domain_unique unique (project_id, domain)
);

create table public.brand_mentions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  mentioned boolean not null default false,
  position integer,
  recommendation_status public.recora_recommendation_status not null default 'absent',
  sentiment public.recora_sentiment not null default 'unclear',
  answer_score numeric(3,2) not null default 0,
  mention_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_mentions_position_positive check (position is null or position > 0),
  constraint brand_mentions_answer_score_range check (answer_score >= 0 and answer_score <= 5),
  constraint brand_mentions_conversation_brand_unique unique (conversation_id, brand_id)
);

comment on table public.brand_mentions is
  'Stores Recora answer-level brand evaluation. answer_score is a Recora-defined score, not an official AI platform score.';

create table public.citations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  source_domain_id uuid references public.source_domains(id) on delete set null,
  url text,
  domain text not null,
  title text,
  source_type public.recora_source_type not null default 'unknown',
  supports_claim boolean,
  occurrence_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint citations_occurrence_count_positive check (occurrence_count > 0)
);

create table public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.measurement_runs(id) on delete cascade,
  scope_type public.recora_metric_scope_type not null,
  scope_id uuid,
  brand_id uuid references public.brands(id) on delete cascade,
  ai_visibility numeric(6,2) not null default 0,
  ai_mention_count integer not null default 0,
  citation_count integer not null default 0,
  share_of_voice numeric(6,2) not null default 0,
  competitive_gap numeric(6,2),
  average_position numeric(8,2),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metric_snapshots_ai_visibility_range check (ai_visibility >= 0 and ai_visibility <= 100),
  constraint metric_snapshots_ai_mention_count_non_negative check (ai_mention_count >= 0),
  constraint metric_snapshots_citation_count_non_negative check (citation_count >= 0),
  constraint metric_snapshots_share_of_voice_range check (share_of_voice >= 0 and share_of_voice <= 100),
  constraint metric_snapshots_average_position_positive check (average_position is null or average_position > 0)
);

comment on table public.metric_snapshots is
  'Aggregated dashboard values. The source of truth remains raw data in run_items, ai_conversations, brand_mentions, and citations.';

comment on column public.metric_snapshots.ai_visibility is
  'Recora-defined AI visibility percentage. This is not an official metric from any AI platform.';

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  run_id uuid references public.measurement_runs(id) on delete set null,
  type public.recora_recommendation_type not null,
  priority public.recora_priority not null default 'medium',
  impact_score numeric(5,2) not null default 0,
  effort_score numeric(5,2),
  title text not null,
  reason text,
  target_url text,
  related_topic_id uuid references public.topics(id) on delete set null,
  related_prompt_id uuid references public.prompts(id) on delete set null,
  status public.recora_recommendation_state not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recommendations_impact_score_range check (impact_score >= 0 and impact_score <= 100),
  constraint recommendations_effort_score_range check (effort_score is null or (effort_score >= 0 and effort_score <= 100)),
  constraint recommendations_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.recommendations is
  'Improvement recommendations derived from Recora measurement evidence. v0.1 stores recommendations but does not implement full automation.';

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger set_personas_updated_at
before update on public.personas
for each row execute function public.set_updated_at();

create trigger set_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

create trigger set_prompts_updated_at
before update on public.prompts
for each row execute function public.set_updated_at();

create trigger set_ai_models_updated_at
before update on public.ai_models
for each row execute function public.set_updated_at();

create trigger set_measurement_runs_updated_at
before update on public.measurement_runs
for each row execute function public.set_updated_at();

create trigger set_run_items_updated_at
before update on public.run_items
for each row execute function public.set_updated_at();

create trigger set_ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create trigger set_source_domains_updated_at
before update on public.source_domains
for each row execute function public.set_updated_at();

create trigger set_brand_mentions_updated_at
before update on public.brand_mentions
for each row execute function public.set_updated_at();

create trigger set_citations_updated_at
before update on public.citations
for each row execute function public.set_updated_at();

create trigger set_metric_snapshots_updated_at
before update on public.metric_snapshots
for each row execute function public.set_updated_at();

create trigger set_recommendations_updated_at
before update on public.recommendations
for each row execute function public.set_updated_at();

create unique index brands_one_primary_per_project_idx
on public.brands (project_id)
where brand_type = 'primary';

create unique index brands_project_domain_unique_idx
on public.brands (project_id, domain)
where domain is not null;

create index brands_project_id_idx on public.brands (project_id);
create index brands_project_type_idx on public.brands (project_id, brand_type);
create index brands_active_idx on public.brands (project_id, is_active);

create index personas_project_id_idx on public.personas (project_id);
create index personas_active_idx on public.personas (project_id, is_active);

create index topics_project_id_idx on public.topics (project_id);
create index topics_priority_idx on public.topics (project_id, priority);
create index topics_active_idx on public.topics (project_id, is_active);

create index prompts_project_id_idx on public.prompts (project_id);
create index prompts_topic_id_idx on public.prompts (topic_id);
create index prompts_persona_id_idx on public.prompts (persona_id);
create index prompts_active_idx on public.prompts (project_id, is_active);

create index ai_models_active_idx on public.ai_models (is_active);

create index measurement_runs_project_id_idx on public.measurement_runs (project_id);
create index measurement_runs_project_status_idx on public.measurement_runs (project_id, status);
create index measurement_runs_project_period_idx on public.measurement_runs (project_id, period_start, period_end);
create index measurement_runs_created_at_idx on public.measurement_runs (created_at desc);

create index run_items_run_id_idx on public.run_items (run_id);
create index run_items_prompt_id_idx on public.run_items (prompt_id);
create index run_items_persona_id_idx on public.run_items (persona_id);
create index run_items_model_id_idx on public.run_items (model_id);
create index run_items_run_status_idx on public.run_items (run_id, status);

create index ai_conversations_run_item_id_idx on public.ai_conversations (run_item_id);
create index ai_conversations_answer_hash_idx on public.ai_conversations (answer_hash);
create index ai_conversations_captured_at_idx on public.ai_conversations (captured_at desc);

create index source_domains_project_id_idx on public.source_domains (project_id);
create index source_domains_owner_brand_id_idx on public.source_domains (owner_brand_id);
create index source_domains_type_idx on public.source_domains (project_id, source_type);

create index brand_mentions_conversation_id_idx on public.brand_mentions (conversation_id);
create index brand_mentions_brand_id_idx on public.brand_mentions (brand_id);
create index brand_mentions_brand_mentioned_idx on public.brand_mentions (brand_id, mentioned);
create index brand_mentions_brand_status_idx on public.brand_mentions (brand_id, recommendation_status);

create index citations_conversation_id_idx on public.citations (conversation_id);
create index citations_brand_id_idx on public.citations (brand_id);
create index citations_source_domain_id_idx on public.citations (source_domain_id);
create index citations_domain_idx on public.citations (domain);
create index citations_source_type_idx on public.citations (source_type);

create index metric_snapshots_run_id_idx on public.metric_snapshots (run_id);
create index metric_snapshots_brand_id_idx on public.metric_snapshots (brand_id);
create index metric_snapshots_scope_idx on public.metric_snapshots (run_id, scope_type, scope_id);
create index metric_snapshots_run_brand_scope_idx on public.metric_snapshots (run_id, brand_id, scope_type);

create unique index metric_snapshots_unique_scope_idx
on public.metric_snapshots (
  run_id,
  scope_type,
  coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(brand_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index recommendations_project_id_idx on public.recommendations (project_id);
create index recommendations_run_id_idx on public.recommendations (run_id);
create index recommendations_project_status_idx on public.recommendations (project_id, status);
create index recommendations_project_priority_idx on public.recommendations (project_id, priority);
create index recommendations_related_topic_id_idx on public.recommendations (related_topic_id);
create index recommendations_related_prompt_id_idx on public.recommendations (related_prompt_id);

-- RLS is intentionally not enabled in this v0.1 schema migration.
-- TODO before exposing these tables through Supabase Data API:
-- 1. Enable row level security on public tables.
-- 2. Add project/workspace-aware policies.
-- 3. Grant anon/authenticated access only after RLS policies are in place.
