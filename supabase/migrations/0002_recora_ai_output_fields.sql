-- Recora v0.1 AI output evidence fields.
--
-- This migration extends the raw evidence tables so Recora can store observed
-- AI provider outputs, including OpenAI Responses with and without web search.
-- Recora metrics such as AI visibility, AI share, citation signals, and
-- improvement priority are Recora-defined observation metrics. They are not
-- official metrics from OpenAI or any other AI platform.
--
-- RLS is intentionally unchanged in v0.1. TODO: enable RLS and policies before
-- exposing these tables to production clients.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'recora_citation_status'
  ) then
    create type public.recora_citation_status as enum (
      'unknown',
      'not_requested',
      'unavailable',
      'available',
      'partial',
      'error'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'recora_extraction_confidence'
  ) then
    create type public.recora_extraction_confidence as enum (
      'unknown',
      'low',
      'medium',
      'high'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'recora_brand_relatedness'
  ) then
    create type public.recora_brand_relatedness as enum (
      'unknown',
      'target_brand',
      'competitor',
      'unknown_competitor',
      'category',
      'general',
      'unrelated'
    );
  end if;
end
$$;

alter table public.ai_conversations
  add column if not exists provider text,
  add column if not exists model_requested text,
  add column if not exists model_returned text,
  add column if not exists response_id text,
  add column if not exists raw_response jsonb,
  add column if not exists usage jsonb,
  add column if not exists web_search_enabled boolean not null default false,
  add column if not exists citation_status public.recora_citation_status not null default 'unknown',
  add column if not exists measured_at timestamptz,
  add column if not exists response_time_ms integer;

comment on column public.ai_conversations.provider is
  'AI provider that produced the response, for example openai, gemini, perplexity, or claude. Kept as text so new providers can be stored without schema changes.';
comment on column public.ai_conversations.model_requested is
  'Model identifier requested by Recora before execution.';
comment on column public.ai_conversations.model_returned is
  'Model identifier returned by the provider response, when available.';
comment on column public.ai_conversations.response_id is
  'Provider response identifier for traceability and deduplication. Do not treat it as a public user-facing identifier.';
comment on column public.ai_conversations.raw_response is
  'Raw provider response JSON for auditability. Store provider output evidence, not secrets or request credentials.';
comment on column public.ai_conversations.usage is
  'Provider usage metadata such as token counts or billing units, when returned.';
comment on column public.ai_conversations.web_search_enabled is
  'Whether the observation requested a provider web-search or browsing tool.';
comment on column public.ai_conversations.citation_status is
  'Citation availability observed for this answer. This is a Recora observation label, not an official AI platform score.';
comment on column public.ai_conversations.measured_at is
  'Timestamp when Recora measured the provider response. Prefer this for analysis when it differs from insertion time.';
comment on column public.ai_conversations.response_time_ms is
  'Elapsed response time in milliseconds measured by Recora, when available.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_conversations_response_time_ms_non_negative'
      and conrelid = 'public.ai_conversations'::regclass
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_response_time_ms_non_negative
      check (response_time_ms is null or response_time_ms >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_conversations_raw_response_object'
      and conrelid = 'public.ai_conversations'::regclass
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_raw_response_object
      check (raw_response is null or jsonb_typeof(raw_response) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_conversations_usage_object'
      and conrelid = 'public.ai_conversations'::regclass
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_usage_object
      check (usage is null or jsonb_typeof(usage) = 'object');
  end if;
end
$$;

alter table public.brand_mentions
  add column if not exists mention_count integer not null default 0,
  add column if not exists first_mention_index integer,
  add column if not exists evidence_snippet text,
  add column if not exists confidence public.recora_extraction_confidence not null default 'unknown',
  add column if not exists matched_alias text;

comment on column public.brand_mentions.mention_count is
  'Number of detected mentions for this brand in the answer text.';
comment on column public.brand_mentions.first_mention_index is
  'Zero-based character index for the first detected brand mention in raw_answer, when available.';
comment on column public.brand_mentions.evidence_snippet is
  'Short answer excerpt used as evidence for the mention classification.';
comment on column public.brand_mentions.confidence is
  'Extractor confidence for this mention row. It is a Recora extraction label, not a provider score.';
comment on column public.brand_mentions.matched_alias is
  'Specific brand name or alias that matched the answer text.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brand_mentions_mention_count_non_negative'
      and conrelid = 'public.brand_mentions'::regclass
  ) then
    alter table public.brand_mentions
      add constraint brand_mentions_mention_count_non_negative
      check (mention_count >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'brand_mentions_first_mention_index_non_negative'
      and conrelid = 'public.brand_mentions'::regclass
  ) then
    alter table public.brand_mentions
      add constraint brand_mentions_first_mention_index_non_negative
      check (first_mention_index is null or first_mention_index >= 0);
  end if;
end
$$;

alter table public.citations
  add column if not exists canonical_url text,
  add column if not exists start_index integer,
  add column if not exists end_index integer,
  add column if not exists cited_text text,
  add column if not exists raw_citation jsonb,
  add column if not exists brand_related public.recora_brand_relatedness not null default 'unknown';

comment on column public.citations.canonical_url is
  'Normalized URL used for grouping citation records when it can be derived safely.';
comment on column public.citations.start_index is
  'Zero-based character index where the cited span starts in raw_answer, when returned by the provider.';
comment on column public.citations.end_index is
  'Zero-based character index where the cited span ends in raw_answer, when returned by the provider.';
comment on column public.citations.cited_text is
  'Answer text span associated with the citation, when available.';
comment on column public.citations.raw_citation is
  'Raw citation annotation JSON returned by the provider.';
comment on column public.citations.brand_related is
  'Recora classification of how the citation relates to the target brand, competitors, category, or general background.';
comment on column public.citations.supports_claim is
  'Null means support has not been verified. URL presence alone must not be treated as evidence that the cited source supports the answer claim.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'citations_span_non_negative'
      and conrelid = 'public.citations'::regclass
  ) then
    alter table public.citations
      add constraint citations_span_non_negative
      check (
        (start_index is null or start_index >= 0)
        and (end_index is null or end_index >= 0)
        and (start_index is null or end_index is null or end_index >= start_index)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'citations_raw_citation_object'
      and conrelid = 'public.citations'::regclass
  ) then
    alter table public.citations
      add constraint citations_raw_citation_object
      check (raw_citation is null or jsonb_typeof(raw_citation) = 'object');
  end if;
end
$$;

create unique index if not exists ai_conversations_provider_response_id_unique_idx
  on public.ai_conversations (provider, response_id)
  where provider is not null and response_id is not null;

create index if not exists ai_conversations_provider_model_measured_idx
  on public.ai_conversations (provider, model_returned, measured_at desc);

create index if not exists ai_conversations_citation_status_idx
  on public.ai_conversations (citation_status);

create index if not exists brand_mentions_confidence_idx
  on public.brand_mentions (confidence);

create index if not exists brand_mentions_first_mention_idx
  on public.brand_mentions (brand_id, first_mention_index)
  where first_mention_index is not null;

create index if not exists brand_mentions_mention_count_idx
  on public.brand_mentions (brand_id, mentioned, mention_count desc);

create index if not exists citations_canonical_url_idx
  on public.citations (canonical_url)
  where canonical_url is not null;

create index if not exists citations_brand_related_idx
  on public.citations (brand_related);

create index if not exists citations_text_span_idx
  on public.citations (conversation_id, start_index, end_index)
  where start_index is not null;
