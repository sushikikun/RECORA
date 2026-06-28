-- Recora admin DB P0-B batch queue tables.
-- Scope:
-- - Add internal batch and batch item queue metadata tables.
-- - Keep raw measurement results, AI answers, aggregate metric values, and
--   recommendation bodies in existing public measurement tables.
-- - Do not create customer-facing read models, report publication tables,
--   prompt change tables, internal notes, worker write paths, or UI.

set search_path = public, extensions;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.measurement_runs'::regclass
      and conname = 'measurement_runs_id_project_id_unique'
  ) then
    alter table public.measurement_runs
      add constraint measurement_runs_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'recora_admin.measurement_schedules'::regclass
      and conname = 'measurement_schedules_id_organization_project_unique'
  ) then
    alter table recora_admin.measurement_schedules
      add constraint measurement_schedules_id_organization_project_unique unique (id, organization_id, project_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'recora_admin.diagnostic_intakes'::regclass
      and conname = 'diagnostic_intakes_id_organization_project_unique'
  ) then
    alter table recora_admin.diagnostic_intakes
      add constraint diagnostic_intakes_id_organization_project_unique unique (id, organization_id, project_id);
  end if;
end;
$$;

create table recora_admin.measurement_batches (
  id uuid primary key default gen_random_uuid(),
  batch_type text not null,
  status text not null default 'queued',
  requested_by_type text not null default 'operator',
  requested_by_id text,
  source_schedule_id uuid references recora_admin.measurement_schedules(id) on delete restrict,
  diagnostic_intake_id uuid references recora_admin.diagnostic_intakes(id) on delete restrict,
  target_period_start timestamptz,
  target_period_end timestamptz,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_batches_batch_type_check check (
    batch_type in ('manual', 'free_diagnostic', 'weekly_1', 'weekly_2', 'backfill', 'replay')
  ),
  constraint measurement_batches_status_check check (
    status in ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'canceled')
  ),
  constraint measurement_batches_requested_by_type_check check (
    requested_by_type in ('operator', 'script', 'worker', 'system')
  ),
  constraint measurement_batches_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint measurement_batches_period_order check (
    target_period_start is null
    or target_period_end is null
    or target_period_end >= target_period_start
  ),
  constraint measurement_batches_started_after_queued check (
    started_at is null or started_at >= queued_at
  ),
  constraint measurement_batches_finished_after_started check (
    finished_at is null
    or started_at is null
    or finished_at >= started_at
  ),
  constraint measurement_batches_canceled_after_queued check (
    canceled_at is null or canceled_at >= queued_at
  )
);

comment on table recora_admin.measurement_batches is
  'Internal batch queue parent for Recora measurement orchestration. Stores queue/tracking metadata only; OpenAI execution is handled by future worker/operator commands, not inside customer HTTP requests. Raw AI answers, aggregate values, and recommendation bodies remain in public measurement tables.';

comment on column recora_admin.measurement_batches.metadata is
  'JSON object for internal queue metadata only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate metric copies, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.measurement_batches.source_schedule_id is
  'Optional source schedule that requested this batch. Schedule-driven measurement execution is handled by future worker/operator write paths.';

comment on column recora_admin.measurement_batches.diagnostic_intake_id is
  'Optional diagnostic intake that requested this batch. Diagnostic result bodies and AI answers must remain in public measurement tables.';

create table recora_admin.measurement_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references recora_admin.measurement_batches(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null,
  schedule_id uuid references recora_admin.measurement_schedules(id) on delete restrict,
  diagnostic_intake_id uuid references recora_admin.diagnostic_intakes(id) on delete restrict,
  measurement_run_id uuid references public.measurement_runs(id) on delete restrict,
  idempotency_key text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  priority integer not null default 100,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  last_error_code text,
  last_error_message text,
  worker_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_batch_items_project_organization_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint measurement_batch_items_schedule_project_fkey
    foreign key (schedule_id, organization_id, project_id) references recora_admin.measurement_schedules(id, organization_id, project_id) on delete restrict,
  constraint measurement_batch_items_diagnostic_intake_project_fkey
    foreign key (diagnostic_intake_id, organization_id, project_id) references recora_admin.diagnostic_intakes(id, organization_id, project_id) on delete restrict,
  constraint measurement_batch_items_measurement_run_project_fkey
    foreign key (measurement_run_id, project_id) references public.measurement_runs(id, project_id) on delete restrict,
  constraint measurement_batch_items_idempotency_key_unique unique (idempotency_key),
  constraint measurement_batch_items_idempotency_key_not_blank check (btrim(idempotency_key) <> ''),
  constraint measurement_batch_items_status_check check (
    status in ('queued', 'running', 'completed', 'failed', 'retryable', 'skipped', 'canceled')
  ),
  constraint measurement_batch_items_attempt_count_check check (attempt_count >= 0),
  constraint measurement_batch_items_max_attempts_check check (max_attempts >= 1),
  constraint measurement_batch_items_attempts_order check (attempt_count <= max_attempts),
  constraint measurement_batch_items_priority_check check (priority >= 0),
  constraint measurement_batch_items_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint measurement_batch_items_started_after_queued check (
    started_at is null or started_at >= queued_at
  ),
  constraint measurement_batch_items_finished_after_started check (
    finished_at is null
    or started_at is null
    or finished_at >= started_at
  )
);

comment on column recora_admin.measurement_batch_items.idempotency_key is
  'Stable duplicate-prevention key for queue delivery and worker retries. Retried work should reuse the existing item with the same idempotency_key rather than enqueueing a duplicate.';

comment on column recora_admin.measurement_batch_items.measurement_run_id is
  'Optional link to the actual public.measurement_runs row. Once set, replay handling for existing runs and failures after run creation but before item update must be specified by a future worker write-path PR.';

comment on column recora_admin.measurement_batch_items.last_error_message is
  'Short operational error summary only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, prompts, aggregate values, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.measurement_batch_items.worker_ref is
  'Opaque worker/operator reference for future execution tracking. It must not contain secrets, API keys, tokens, DB URLs, raw AI answers, or customer-sensitive payloads.';

comment on column recora_admin.measurement_batch_items.metadata is
  'JSON object for internal queue metadata only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate metric copies, recommendation bodies, or unnecessary PII.';

create trigger set_recora_admin_measurement_batches_updated_at
before update on recora_admin.measurement_batches
for each row execute function public.set_updated_at();

create trigger set_recora_admin_measurement_batch_items_updated_at
before update on recora_admin.measurement_batch_items
for each row execute function public.set_updated_at();

create index measurement_batches_status_queued_at_idx
on recora_admin.measurement_batches (status, queued_at);

create index measurement_batches_batch_type_status_idx
on recora_admin.measurement_batches (batch_type, status);

create index measurement_batches_source_schedule_id_idx
on recora_admin.measurement_batches (source_schedule_id)
where source_schedule_id is not null;

create index measurement_batches_diagnostic_intake_id_idx
on recora_admin.measurement_batches (diagnostic_intake_id)
where diagnostic_intake_id is not null;

create index measurement_batch_items_batch_status_idx
on recora_admin.measurement_batch_items (batch_id, status);

create index measurement_batch_items_status_priority_queued_at_idx
on recora_admin.measurement_batch_items (status, priority, queued_at);

create index measurement_batch_items_organization_id_idx
on recora_admin.measurement_batch_items (organization_id);

create index measurement_batch_items_project_id_idx
on recora_admin.measurement_batch_items (project_id);

create index measurement_batch_items_project_organization_idx
on recora_admin.measurement_batch_items (project_id, organization_id);

create index measurement_batch_items_schedule_project_idx
on recora_admin.measurement_batch_items (schedule_id, organization_id, project_id)
where schedule_id is not null;

create index measurement_batch_items_diagnostic_intake_project_idx
on recora_admin.measurement_batch_items (diagnostic_intake_id, organization_id, project_id)
where diagnostic_intake_id is not null;

create index measurement_batch_items_measurement_run_project_idx
on recora_admin.measurement_batch_items (measurement_run_id, project_id)
where measurement_run_id is not null;

alter table recora_admin.measurement_batches enable row level security;
alter table recora_admin.measurement_batch_items enable row level security;

revoke all on table recora_admin.measurement_batches from public;
revoke all on table recora_admin.measurement_batches from anon;
revoke all on table recora_admin.measurement_batches from authenticated;
revoke all on table recora_admin.measurement_batch_items from public;
revoke all on table recora_admin.measurement_batch_items from anon;
revoke all on table recora_admin.measurement_batch_items from authenticated;

grant usage on schema recora_admin to service_role;
grant select on table recora_admin.measurement_batches to service_role;
grant select on table recora_admin.measurement_batch_items to service_role;

comment on table recora_admin.measurement_batch_items is
  'Internal per-project or per-intake queue item for a measurement batch. HTTP requests must not execute OpenAI measurement directly; future worker/operator write paths will claim and update these rows. Actual measurement runs are stored in public.measurement_runs and linked through measurement_run_id; this table must not duplicate raw AI answers, aggregate values, or recommendation bodies.';
