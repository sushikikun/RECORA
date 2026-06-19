-- Recora measurement analysis read-model fields.
--
-- Scope:
-- - Keep raw AI responses immutable.
-- - Add first-class source-to-claim and source freshness state for report/read
--   models without changing existing citation extraction behavior.
-- - Preserve legacy supports_claim for backward compatibility.
--
-- This migration is additive. It does not run source retrieval, quality-gate
-- review, or production data backfills beyond safe legacy status mapping.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'recora_source_to_claim_status'
  ) then
    create type public.recora_source_to_claim_status as enum (
      'supported',
      'partially_supported',
      'contradicted',
      'unrelated',
      'unknown',
      'not_reviewed'
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
      and t.typname = 'recora_source_freshness_status'
  ) then
    create type public.recora_source_freshness_status as enum (
      'fresh',
      'recent',
      'stale',
      'unknown',
      'not_checked'
    );
  end if;
end
$$;

alter table public.citations
  add column if not exists source_to_claim_status public.recora_source_to_claim_status not null default 'not_reviewed',
  add column if not exists claim_text text,
  add column if not exists source_to_claim_note text,
  add column if not exists source_retrieved_at timestamptz,
  add column if not exists source_published_at date,
  add column if not exists source_last_modified_at timestamptz,
  add column if not exists source_freshness_status public.recora_source_freshness_status not null default 'not_checked',
  add column if not exists source_freshness_days integer;

comment on column public.citations.source_to_claim_status is
  'Explicit source-to-claim review state. Citation presence alone must not be treated as claim support.';
comment on column public.citations.claim_text is
  'Answer claim text associated with this citation when extraction or review can identify it.';
comment on column public.citations.source_to_claim_note is
  'Internal note explaining source-to-claim status, review gaps, or parser limitations.';
comment on column public.citations.source_retrieved_at is
  'When Recora retrieved or checked the cited source content, if retrieval was performed.';
comment on column public.citations.source_published_at is
  'Published date extracted from the source, when available. Null means unavailable or not checked.';
comment on column public.citations.source_last_modified_at is
  'Last-modified timestamp from the source, when available. Null means unavailable or not checked.';
comment on column public.citations.source_freshness_status is
  'Freshness classification for the cited source. Not checked/unknown must stay distinct from fresh.';
comment on column public.citations.source_freshness_days is
  'Approximate age in days at retrieval time when source date evidence exists.';

update public.citations
set source_to_claim_status = case
  when supports_claim is true then 'supported'::public.recora_source_to_claim_status
  when supports_claim is false then 'unknown'::public.recora_source_to_claim_status
  else source_to_claim_status
end
where supports_claim is not null
  and source_to_claim_status = 'not_reviewed';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'citations_source_freshness_days_non_negative'
      and conrelid = 'public.citations'::regclass
  ) then
    alter table public.citations
      add constraint citations_source_freshness_days_non_negative
      check (source_freshness_days is null or source_freshness_days >= 0);
  end if;
end
$$;

create index if not exists citations_source_to_claim_status_idx
  on public.citations (source_to_claim_status);

create index if not exists citations_source_freshness_status_idx
  on public.citations (source_freshness_status);

create index if not exists citations_source_retrieved_at_idx
  on public.citations (source_retrieved_at desc)
  where source_retrieved_at is not null;
