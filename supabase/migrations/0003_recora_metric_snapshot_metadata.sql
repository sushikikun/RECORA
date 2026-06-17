-- Recora v0.1 metric snapshot metadata fields.
--
-- Scope:
-- - Allow aggregate measurement runs and metric snapshots to keep their source
--   run, calculation, sample-size, and search-mode context without changing
--   the existing dashboard-facing metric columns.
-- - Keep this migration additive and backward-compatible with existing seed
--   rows and metric_snapshots.
--
-- Important:
-- Recora metrics are Recora-defined observation metrics. They are not official
-- evaluations from OpenAI, Google, Anthropic, Perplexity, or any AI platform.
--
-- RLS is intentionally unchanged in this migration.

alter table public.measurement_runs
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.measurement_runs.metadata is
  'Recora run metadata for v0.1 measurement and aggregate runs. Expected keys include run_kind, source_run_id, data_source, calculation_method, sample_size_note, and recora_metric_notice. Recora metrics are not official AI platform evaluations.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'measurement_runs_metadata_is_object'
      and conrelid = 'public.measurement_runs'::regclass
  ) then
    alter table public.measurement_runs
      add constraint measurement_runs_metadata_is_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end;
$$;

alter table public.metric_snapshots
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.metric_snapshots.metadata is
  'Recora metric snapshot metadata for source_run_id, data_source, search_mode, metric_version, calculation_method, sample_size, no_search_breakdown, web_search_breakdown, recora_metric_notice, and confidence_note. Recora metrics are not official AI platform evaluations.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'metric_snapshots_metadata_is_object'
      and conrelid = 'public.metric_snapshots'::regclass
  ) then
    alter table public.metric_snapshots
      add constraint metric_snapshots_metadata_is_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end;
$$;
