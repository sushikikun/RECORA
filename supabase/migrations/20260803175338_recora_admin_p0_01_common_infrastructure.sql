-- Recora Admin P0 / M01 common infrastructure v1.3 (M00 + Canonical-package-aware baseline).
--
-- Purpose:
-- - Create the universal P0 command receipt.
-- - Create a private durable asynchronous outbox projection.
-- - Create read-model refresh run metadata.
-- - Reserve the private admin_read schema without exposing it to the Data API.
--
-- Boundary:
-- - M00 must already be present with the approved design v1.3 pin.
-- - The implementation repository baseline is 49fd9007a4e93f80285660cf1f9e98c115d60a30;
--   M00 retains its original evidence pin 2c2a6fba70b75e858abc71a7447840bf32f3507d.
-- - M01 does not create administrator accounts, roles, capabilities, business state,
--   customer-facing views, or any browser/service-role write path.
-- - M02 adds admin-account FK and final role-assignment authorization evidence.
-- - No public or legacy recora_admin data is converted or mutated.

set search_path = public, extensions;

-- Inventory must complete before the first persistent write in this migration.
do $admin_p0_m01_inventory$
declare
  pinned_row recora_private.admin_p0_schema_versions%rowtype;
  existing_relation_count integer;
begin
  if to_regclass('recora_private.admin_p0_schema_versions') is null then
    raise exception 'Recora Admin P0 M01 failed: M00 schema contract is missing';
  end if;

  select * into pinned_row
  from recora_private.admin_p0_schema_versions
  where schema_version = 'recora_admin_p0_design_v1_3';

  if not found
    or pinned_row.canonical_package_id is distinct from 'RECORA-ADMIN-P0-CANONICAL'
    or pinned_row.canonical_version is distinct from '1.0'
    or pinned_row.canonical_manifest_sha256 is distinct from 'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a'
    or pinned_row.repository_baseline_commit is distinct from '2c2a6fba70b75e858abc71a7447840bf32f3507d'
    or pinned_row.migration_set_digest is distinct from 'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a' then
    raise exception 'Recora Admin P0 M01 failed: M00 design pin does not match the approved v1.3 implementation package';
  end if;

  if to_regprocedure('recora_private.p4_reject_history_mutation()') is null
    or to_regprocedure('recora_audit.is_safe_audit_summary(jsonb)') is null
    or to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Recora Admin P0 M01 failed: required immutable/payload/update helpers are missing';
  end if;

  if to_regclass('recora_operator.operator_command_receipts') is null
    or to_regclass('recora_audit.operator_events') is null
    or to_regclass('public.organizations') is null
    or to_regclass('public.projects') is null then
    raise exception 'Recora Admin P0 M01 failed: required causal or tenant relations are missing';
  end if;

  select count(*) into existing_relation_count
  from (values
    (to_regclass('recora_private.admin_command_receipts')),
    (to_regclass('recora_private.admin_outbox_messages')),
    (to_regclass('recora_private.admin_read_refreshes'))
  ) relation_inventory(relation_oid)
  where relation_oid is not null;

  if existing_relation_count not in (0, 3) then
    raise exception 'Recora Admin P0 M01 failed: partial M01 relation inventory detected (% of 3)', existing_relation_count;
  end if;

  if existing_relation_count = 0 and exists (
    select 1 from pg_namespace where nspname = 'admin_read'
  ) then
    raise exception 'Recora Admin P0 M01 failed: admin_read schema already exists without the complete M01 relation set';
  end if;

  if existing_relation_count = 3 and not exists (
    select 1 from pg_namespace where nspname = 'admin_read'
  ) then
    raise exception 'Recora Admin P0 M01 failed: M01 relations exist but admin_read schema is missing';
  end if;
end;
$admin_p0_m01_inventory$;

create schema if not exists admin_read;
comment on schema admin_read is
  'Private Recora administrator read-model schema. It is not a browser or customer Data API surface.';
revoke all on schema admin_read from public, anon, authenticated, service_role;

create table if not exists recora_private.admin_command_receipts (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  admin_account_id uuid,
  system_component_code text,
  command_name text not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  target_type text not null,
  target_id uuid,
  idempotency_key text not null,
  request_fingerprint text not null,
  request_id uuid not null,
  correlation_id uuid not null,
  outcome text not null,
  stable_reason_code text not null,
  operator_command_receipt_id uuid references recora_operator.operator_command_receipts(id) on delete restrict,
  audit_event_id uuid references recora_audit.operator_events(id) on delete restrict,
  actor_identity_key text generated always as (
    case
      when actor_type = 'admin' then 'admin:' || admin_account_id::text
      else 'system:' || system_component_code
    end
  ) stored,
  scope_key text generated always as (
    case
      when project_id is not null then 'project:' || project_id::text
      when organization_id is not null then 'organization:' || organization_id::text
      else 'global'
    end
  ) stored,
  created_at timestamptz not null default now(),
  constraint admin_command_receipts_actor_type_check check (
    actor_type in ('admin', 'system')
  ),
  constraint admin_command_receipts_actor_exactly_one_check check (
    (actor_type = 'admin' and admin_account_id is not null and system_component_code is null)
    or
    (actor_type = 'system' and admin_account_id is null and system_component_code is not null)
  ),
  constraint admin_command_receipts_system_component_format_check check (
    system_component_code is null
    or system_component_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_command_receipts_command_name_format_check check (
    command_name ~ '^[A-Z][A-Za-z0-9]{1,127}$'
  ),
  constraint admin_command_receipts_target_type_format_check check (
    target_type ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_command_receipts_idempotency_key_format_check check (
    idempotency_key ~ '^[a-zA-Z0-9][a-zA-Z0-9_.:-]{2,191}$'
  ),
  constraint admin_command_receipts_request_fingerprint_format_check check (
    request_fingerprint ~ '^[0-9a-f]{64}$'
  ),
  constraint admin_command_receipts_stable_reason_code_format_check check (
    stable_reason_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_command_receipts_outcome_check check (
    outcome in ('accepted', 'committed', 'denied', 'failed', 'reconciliation_required')
  ),
  constraint admin_command_receipts_project_requires_organization_check check (
    project_id is null or organization_id is not null
  ),
  constraint admin_command_receipts_project_scope_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint admin_command_receipts_human_audit_required_check check (
    actor_type <> 'admin' or audit_event_id is not null
  ),
  constraint admin_command_receipts_system_operator_receipt_forbidden_check check (
    actor_type <> 'system' or operator_command_receipt_id is null
  ),
  constraint admin_command_receipts_operator_receipt_requires_audit_check check (
    operator_command_receipt_id is null or audit_event_id is not null
  ),
  constraint admin_command_receipts_denied_failed_no_success_receipt_check check (
    outcome not in ('denied', 'failed') or operator_command_receipt_id is null
  )
);

comment on table recora_private.admin_command_receipts is
  'Universal append-only P0 command receipt for global, organization, and project operations. M02 adds the admin-account FK and final role-assignment authorization evidence.';
comment on column recora_private.admin_command_receipts.operator_command_receipt_id is
  'Optional bridge to the existing Phase 3 organization/project-scoped successful operator receipt. It is not used to fabricate global scope.';
comment on column recora_private.admin_command_receipts.admin_account_id is
  'P0 admin account reference. The FK is deliberately deferred to M02, where admin_accounts is created.';

create unique index if not exists admin_command_receipts_actor_scope_idempotency_unique
on recora_private.admin_command_receipts (
  actor_identity_key,
  scope_key,
  command_name,
  idempotency_key
);
create unique index if not exists admin_command_receipts_audit_event_unique
on recora_private.admin_command_receipts (audit_event_id)
where audit_event_id is not null;
create unique index if not exists admin_command_receipts_operator_receipt_unique
on recora_private.admin_command_receipts (operator_command_receipt_id)
where operator_command_receipt_id is not null;
create index if not exists admin_command_receipts_request_idx
on recora_private.admin_command_receipts (request_id, created_at desc);
create index if not exists admin_command_receipts_correlation_idx
on recora_private.admin_command_receipts (correlation_id, created_at desc);
create index if not exists admin_command_receipts_scope_time_idx
on recora_private.admin_command_receipts (organization_id, project_id, created_at desc);
create index if not exists admin_command_receipts_target_time_idx
on recora_private.admin_command_receipts (target_type, target_id, created_at desc);

create or replace function recora_private.admin_p0_resolve_command_receipt_replay(
  p_actor_type text,
  p_admin_account_id uuid,
  p_system_component_code text,
  p_organization_id uuid,
  p_project_id uuid,
  p_command_name text,
  p_idempotency_key text,
  p_request_fingerprint text
)
returns table (
  receipt_id uuid,
  replayable boolean,
  reason_code text
)
language plpgsql
stable
set search_path = ''
as $$
declare
  resolved_actor_key text;
  resolved_scope_key text;
  existing_receipt recora_private.admin_command_receipts%rowtype;
begin
  if p_actor_type = 'admin' and p_admin_account_id is not null and p_system_component_code is null then
    resolved_actor_key := 'admin:' || p_admin_account_id::text;
  elsif p_actor_type = 'system' and p_admin_account_id is null and p_system_component_code is not null then
    resolved_actor_key := 'system:' || p_system_component_code;
  else
    return query select null::uuid, false, 'invalid_actor'::text;
    return;
  end if;

  if p_request_fingerprint is null or p_request_fingerprint !~ '^[0-9a-f]{64}$' then
    return query select null::uuid, false, 'invalid_fingerprint'::text;
    return;
  end if;

  if p_project_id is not null then
    if p_organization_id is null or not exists (
      select 1 from public.projects project_row
      where project_row.id = p_project_id
        and project_row.organization_id = p_organization_id
    ) then
      return query select null::uuid, false, 'invalid_scope'::text;
      return;
    end if;
  elsif p_organization_id is not null and not exists (
    select 1 from public.organizations organization_row
    where organization_row.id = p_organization_id
  ) then
    return query select null::uuid, false, 'invalid_scope'::text;
    return;
  end if;

  resolved_scope_key := case
    when p_project_id is not null then 'project:' || p_project_id::text
    when p_organization_id is not null then 'organization:' || p_organization_id::text
    else 'global'
  end;

  select * into existing_receipt
  from recora_private.admin_command_receipts receipt_row
  where receipt_row.actor_identity_key = resolved_actor_key
    and receipt_row.scope_key = resolved_scope_key
    and receipt_row.command_name = p_command_name
    and receipt_row.idempotency_key = p_idempotency_key;

  if not found then
    return query select null::uuid, false, 'not_found'::text;
  elsif existing_receipt.request_fingerprint = p_request_fingerprint then
    return query select existing_receipt.id, true, 'idempotent_replay'::text;
  else
    return query select existing_receipt.id, false, 'idempotency_conflict'::text;
  end if;
end;
$$;

comment on function recora_private.admin_p0_resolve_command_receipt_replay(
  text, uuid, text, uuid, uuid, text, text, text
) is
  'Private replay lookup. Future command transactions must combine it with locking and the unique receipt index; only a matching server-computed request fingerprint is replayable.';

create or replace function recora_private.admin_p0_validate_command_receipt_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  audit_row recora_audit.operator_events%rowtype;
  operator_receipt_row recora_operator.operator_command_receipts%rowtype;
begin
  if new.actor_type = 'admin' then
    raise exception 'P0 admin command receipt insertion is disabled until M02 authorization convergence';
  end if;

  if new.audit_event_id is not null then
    select * into audit_row
    from recora_audit.operator_events
    where id = new.audit_event_id;

    if not found
      or audit_row.request_id is distinct from new.request_id
      or audit_row.correlation_id is distinct from new.correlation_id
      or audit_row.organization_id is distinct from new.organization_id
      or audit_row.project_id is distinct from new.project_id
      or audit_row.action is distinct from new.command_name
      or audit_row.target_type is distinct from new.target_type
      or audit_row.target_id is distinct from new.target_id then
      raise exception 'P0 command receipt audit causal mismatch';
    end if;

    if (new.outcome in ('accepted', 'committed', 'reconciliation_required')
        and audit_row.outcome::text <> 'success')
      or (new.outcome = 'denied' and audit_row.outcome::text <> 'denied')
      or (new.outcome = 'failed' and audit_row.outcome::text <> 'failed') then
      raise exception 'P0 command receipt audit outcome mismatch';
    end if;
  end if;

  if new.operator_command_receipt_id is not null then
    select * into operator_receipt_row
    from recora_operator.operator_command_receipts
    where id = new.operator_command_receipt_id;

    if not found
      or operator_receipt_row.audit_event_id is distinct from new.audit_event_id
      or operator_receipt_row.organization_id is distinct from new.organization_id
      or operator_receipt_row.project_id is distinct from new.project_id
      or operator_receipt_row.action is distinct from new.command_name
      or operator_receipt_row.target_type is distinct from new.target_type
      or operator_receipt_row.target_id is distinct from new.target_id
      or operator_receipt_row.request_id is distinct from new.request_id
      or operator_receipt_row.correlation_id is distinct from new.correlation_id then
      raise exception 'P0 command receipt legacy operator receipt mismatch';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_command_receipts_validate_insert
on recora_private.admin_command_receipts;
create trigger admin_command_receipts_validate_insert
before insert on recora_private.admin_command_receipts
for each row execute function recora_private.admin_p0_validate_command_receipt_insert();

drop trigger if exists admin_command_receipts_append_only
on recora_private.admin_command_receipts;
create trigger admin_command_receipts_append_only
before update or delete on recora_private.admin_command_receipts
for each row execute function recora_private.p4_reject_history_mutation();

create table if not exists recora_private.admin_outbox_messages (
  id uuid primary key default gen_random_uuid(),
  command_receipt_id uuid not null references recora_private.admin_command_receipts(id) on delete restrict,
  message_type text not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  aggregate_type text not null,
  aggregate_id uuid,
  payload_reference jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  aggregate_key text generated always as (
    aggregate_type || ':' || coalesce(aggregate_id::text, 'global')
  ) stored,
  constraint admin_outbox_messages_message_type_format_check check (
    message_type ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_outbox_messages_aggregate_type_format_check check (
    aggregate_type ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_outbox_messages_project_requires_organization_check check (
    project_id is null or organization_id is not null
  ),
  constraint admin_outbox_messages_project_scope_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint admin_outbox_messages_payload_object_check check (
    jsonb_typeof(payload_reference) = 'object'
    and recora_audit.is_safe_audit_summary(payload_reference)
  ),
  constraint admin_outbox_messages_status_check check (
    status in ('pending', 'processing', 'delivered', 'failed', 'reconciliation_required')
  ),
  constraint admin_outbox_messages_attempt_count_check check (attempt_count >= 0),
  constraint admin_outbox_messages_row_version_check check (row_version > 0),
  constraint admin_outbox_messages_available_after_created_check check (
    available_at >= created_at
  ),
  constraint admin_outbox_messages_last_error_code_format_check check (
    last_error_code is null or last_error_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_outbox_messages_status_timestamp_check check (
    (status = 'pending' and locked_at is null and delivered_at is null)
    or (status = 'processing' and locked_at is not null and delivered_at is null)
    or (status = 'delivered' and delivered_at is not null and last_error_code is null)
    or (status in ('failed', 'reconciliation_required') and delivered_at is null and last_error_code is not null)
  )
);

comment on table recora_private.admin_outbox_messages is
  'Private durable asynchronous delivery projection. Detailed attempt evidence is emitted to system_event after M08; M01 does not add an unplanned attempt-history table.';
comment on column recora_private.admin_outbox_messages.payload_reference is
  'Bounded safe reference object only. Raw prompts, AI answers, provider payloads, credentials, PII, and request/response bodies are forbidden.';

create unique index if not exists admin_outbox_messages_command_aggregate_unique
on recora_private.admin_outbox_messages (
  command_receipt_id,
  message_type,
  aggregate_key
);
create index if not exists admin_outbox_messages_pending_available_idx
on recora_private.admin_outbox_messages (available_at, created_at)
where status = 'pending';
create index if not exists admin_outbox_messages_processing_locked_idx
on recora_private.admin_outbox_messages (locked_at)
where status = 'processing';
create index if not exists admin_outbox_messages_scope_status_idx
on recora_private.admin_outbox_messages (organization_id, project_id, status, created_at);

create or replace function recora_private.admin_p0_validate_outbox_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  receipt_organization_id uuid;
  receipt_project_id uuid;
  receipt_outcome text;
begin
  if tg_op = 'INSERT' then
    select organization_id, project_id, outcome
    into receipt_organization_id, receipt_project_id, receipt_outcome
    from recora_private.admin_command_receipts
    where id = new.command_receipt_id;

    if not found
      or receipt_organization_id is distinct from new.organization_id
      or receipt_project_id is distinct from new.project_id then
      raise exception 'admin_outbox_messages command receipt scope mismatch';
    end if;

    if receipt_outcome <> 'accepted' then
      raise exception 'admin_outbox_messages requires an accepted asynchronous command receipt';
    end if;

    if new.status <> 'pending'
      or new.attempt_count <> 0
      or new.row_version <> 1
      or new.locked_at is not null
      or new.delivered_at is not null
      or new.last_error_code is not null then
      raise exception 'admin_outbox_messages must be inserted as a new pending row';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'admin_outbox_messages is retained; delete is not allowed';
  end if;

  if old.status in ('delivered', 'failed', 'reconciliation_required') then
    raise exception 'admin_outbox_messages terminal row is immutable';
  end if;

  if old.command_receipt_id is distinct from new.command_receipt_id
    or old.message_type is distinct from new.message_type
    or old.organization_id is distinct from new.organization_id
    or old.project_id is distinct from new.project_id
    or old.aggregate_type is distinct from new.aggregate_type
    or old.aggregate_id is distinct from new.aggregate_id
    or old.payload_reference is distinct from new.payload_reference
    or old.created_at is distinct from new.created_at then
    raise exception 'admin_outbox_messages identity and payload are immutable';
  end if;

  if new.row_version <> old.row_version + 1 then
    raise exception 'admin_outbox_messages row_version must advance by one';
  end if;

  if not (
    (old.status = 'pending' and new.status in ('processing', 'failed', 'reconciliation_required'))
    or
    (old.status = 'processing' and new.status in ('pending', 'delivered', 'failed', 'reconciliation_required'))
  ) then
    raise exception 'admin_outbox_messages transition is not allowed';
  end if;

  if old.status = 'pending' and new.status = 'processing' then
    if new.attempt_count <> old.attempt_count + 1
      or new.available_at is distinct from old.available_at then
      raise exception 'admin_outbox_messages claim must increment attempt_count once without rescheduling';
    end if;
  elsif old.status = 'processing' and new.status = 'pending' then
    if new.attempt_count <> old.attempt_count
      or new.available_at < old.available_at then
      raise exception 'admin_outbox_messages lease recovery must preserve attempts and move availability forward';
    end if;
  else
    if new.attempt_count <> old.attempt_count
      or new.available_at is distinct from old.available_at then
      raise exception 'admin_outbox_messages attempt or availability changed outside claim recovery';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_outbox_messages_validate_transition
on recora_private.admin_outbox_messages;
create trigger admin_outbox_messages_validate_transition
before insert or update or delete on recora_private.admin_outbox_messages
for each row execute function recora_private.admin_p0_validate_outbox_transition();

create table if not exists recora_private.admin_read_refreshes (
  id uuid primary key default gen_random_uuid(),
  read_model_code text not null,
  status text not null default 'running',
  source_watermark jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  row_count bigint,
  error_code text,
  row_version bigint not null default 1,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_read_refreshes_read_model_code_format_check check (
    read_model_code ~ '^[A-Z][A-Za-z0-9]{1,127}$'
  ),
  constraint admin_read_refreshes_status_check check (
    status in ('running', 'completed', 'failed', 'cancelled')
  ),
  constraint admin_read_refreshes_source_watermark_check check (
    jsonb_typeof(source_watermark) = 'object'
    and recora_audit.is_safe_audit_summary(source_watermark)
  ),
  constraint admin_read_refreshes_row_count_check check (
    row_count is null or row_count >= 0
  ),
  constraint admin_read_refreshes_error_code_format_check check (
    error_code is null or error_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_read_refreshes_row_version_check check (row_version > 0),
  constraint admin_read_refreshes_completed_after_started_check check (
    completed_at is null or completed_at >= started_at
  ),
  constraint admin_read_refreshes_terminal_fields_check check (
    (status = 'running' and completed_at is null and row_count is null and error_code is null)
    or (status = 'completed' and completed_at is not null and row_count is not null and error_code is null)
    or (status = 'failed' and completed_at is not null and error_code is not null)
    or (status = 'cancelled' and completed_at is not null)
  )
);

comment on table recora_private.admin_read_refreshes is
  'One row per materialized read-model refresh run. A running row may reach one terminal state; terminal rows are immutable.';

create unique index if not exists admin_read_refreshes_one_running_per_model_unique
on recora_private.admin_read_refreshes (read_model_code)
where status = 'running';
create index if not exists admin_read_refreshes_model_time_idx
on recora_private.admin_read_refreshes (read_model_code, started_at desc);
create index if not exists admin_read_refreshes_correlation_idx
on recora_private.admin_read_refreshes (correlation_id, started_at desc);

create or replace function recora_private.admin_p0_validate_read_refresh_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'running'
      or new.row_version <> 1
      or new.completed_at is not null
      or new.row_count is not null
      or new.error_code is not null then
      raise exception 'admin_read_refreshes must be inserted as a new running row';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'admin_read_refreshes is retained; delete is not allowed';
  end if;

  if old.status <> 'running' then
    raise exception 'admin_read_refreshes terminal row is immutable';
  end if;

  if old.read_model_code is distinct from new.read_model_code
    or old.source_watermark is distinct from new.source_watermark
    or old.started_at is distinct from new.started_at
    or old.correlation_id is distinct from new.correlation_id
    or old.created_at is distinct from new.created_at then
    raise exception 'admin_read_refreshes run identity is immutable';
  end if;

  if new.status not in ('completed', 'failed', 'cancelled') then
    raise exception 'admin_read_refreshes transition is not allowed';
  end if;

  if new.row_version <> old.row_version + 1 then
    raise exception 'admin_read_refreshes row_version must advance by one';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_read_refreshes_validate_transition
on recora_private.admin_read_refreshes;
create trigger admin_read_refreshes_validate_transition
before insert or update or delete on recora_private.admin_read_refreshes
for each row execute function recora_private.admin_p0_validate_read_refresh_transition();

alter table recora_private.admin_command_receipts enable row level security;
alter table recora_private.admin_outbox_messages enable row level security;
alter table recora_private.admin_read_refreshes enable row level security;

revoke all on table recora_private.admin_command_receipts from public, anon, authenticated, service_role;
revoke all on table recora_private.admin_outbox_messages from public, anon, authenticated, service_role;
revoke all on table recora_private.admin_read_refreshes from public, anon, authenticated, service_role;

revoke all on function recora_private.admin_p0_resolve_command_receipt_replay(
  text, uuid, text, uuid, uuid, text, text, text
) from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_validate_command_receipt_insert()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_validate_outbox_transition()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_validate_read_refresh_transition()
from public, anon, authenticated, service_role;

-- Post-DDL structural verification. This performs no row conversion or seed write.
do $admin_p0_m01_verify$
declare
  relation_name text;
  required_constraint record;
  required_trigger record;
  missing_column_count bigint;
begin
  foreach relation_name in array array[
    'recora_private.admin_command_receipts',
    'recora_private.admin_outbox_messages',
    'recora_private.admin_read_refreshes'
  ] loop
    if to_regclass(relation_name) is null then
      raise exception 'Recora Admin P0 M01 verification failed: % is missing', relation_name;
    end if;

    if not exists (
      select 1
      from pg_class relation_row
      where relation_row.oid = to_regclass(relation_name)
        and relation_row.relrowsecurity is true
    ) then
      raise exception 'Recora Admin P0 M01 verification failed: % does not have RLS enabled', relation_name;
    end if;

    if has_table_privilege('anon', relation_name, 'SELECT')
      or has_table_privilege('authenticated', relation_name, 'SELECT')
      or has_table_privilege('service_role', relation_name, 'SELECT')
      or has_table_privilege('service_role', relation_name, 'INSERT')
      or has_table_privilege('service_role', relation_name, 'UPDATE')
      or has_table_privilege('service_role', relation_name, 'DELETE') then
      raise exception 'Recora Admin P0 M01 verification failed: direct role privilege remains on %', relation_name;
    end if;
  end loop;

  select count(*)
  into missing_column_count
  from (
    values
      ('admin_command_receipts', 'id', 'uuid', 'NO'),
      ('admin_command_receipts', 'actor_type', 'text', 'NO'),
      ('admin_command_receipts', 'admin_account_id', 'uuid', 'YES'),
      ('admin_command_receipts', 'system_component_code', 'text', 'YES'),
      ('admin_command_receipts', 'command_name', 'text', 'NO'),
      ('admin_command_receipts', 'organization_id', 'uuid', 'YES'),
      ('admin_command_receipts', 'project_id', 'uuid', 'YES'),
      ('admin_command_receipts', 'target_type', 'text', 'NO'),
      ('admin_command_receipts', 'target_id', 'uuid', 'YES'),
      ('admin_command_receipts', 'idempotency_key', 'text', 'NO'),
      ('admin_command_receipts', 'request_fingerprint', 'text', 'NO'),
      ('admin_command_receipts', 'request_id', 'uuid', 'NO'),
      ('admin_command_receipts', 'correlation_id', 'uuid', 'NO'),
      ('admin_command_receipts', 'outcome', 'text', 'NO'),
      ('admin_command_receipts', 'stable_reason_code', 'text', 'NO'),
      ('admin_command_receipts', 'operator_command_receipt_id', 'uuid', 'YES'),
      ('admin_command_receipts', 'audit_event_id', 'uuid', 'YES'),
      ('admin_command_receipts', 'created_at', 'timestamp with time zone', 'NO'),
      ('admin_outbox_messages', 'id', 'uuid', 'NO'),
      ('admin_outbox_messages', 'command_receipt_id', 'uuid', 'NO'),
      ('admin_outbox_messages', 'message_type', 'text', 'NO'),
      ('admin_outbox_messages', 'organization_id', 'uuid', 'YES'),
      ('admin_outbox_messages', 'project_id', 'uuid', 'YES'),
      ('admin_outbox_messages', 'aggregate_type', 'text', 'NO'),
      ('admin_outbox_messages', 'aggregate_id', 'uuid', 'YES'),
      ('admin_outbox_messages', 'payload_reference', 'jsonb', 'NO'),
      ('admin_outbox_messages', 'status', 'text', 'NO'),
      ('admin_outbox_messages', 'attempt_count', 'integer', 'NO'),
      ('admin_outbox_messages', 'available_at', 'timestamp with time zone', 'NO'),
      ('admin_outbox_messages', 'locked_at', 'timestamp with time zone', 'YES'),
      ('admin_outbox_messages', 'delivered_at', 'timestamp with time zone', 'YES'),
      ('admin_outbox_messages', 'last_error_code', 'text', 'YES'),
      ('admin_outbox_messages', 'row_version', 'bigint', 'NO'),
      ('admin_outbox_messages', 'created_at', 'timestamp with time zone', 'NO'),
      ('admin_outbox_messages', 'updated_at', 'timestamp with time zone', 'NO'),
      ('admin_read_refreshes', 'id', 'uuid', 'NO'),
      ('admin_read_refreshes', 'read_model_code', 'text', 'NO'),
      ('admin_read_refreshes', 'status', 'text', 'NO'),
      ('admin_read_refreshes', 'source_watermark', 'jsonb', 'NO'),
      ('admin_read_refreshes', 'started_at', 'timestamp with time zone', 'NO'),
      ('admin_read_refreshes', 'completed_at', 'timestamp with time zone', 'YES'),
      ('admin_read_refreshes', 'row_count', 'bigint', 'YES'),
      ('admin_read_refreshes', 'error_code', 'text', 'YES'),
      ('admin_read_refreshes', 'row_version', 'bigint', 'NO'),
      ('admin_read_refreshes', 'correlation_id', 'uuid', 'NO'),
      ('admin_read_refreshes', 'created_at', 'timestamp with time zone', 'NO'),
      ('admin_read_refreshes', 'updated_at', 'timestamp with time zone', 'NO')
  ) as required(table_name, column_name, data_type, is_nullable)
  left join information_schema.columns actual
    on actual.table_schema = 'recora_private'
   and actual.table_name = required.table_name
   and actual.column_name = required.column_name
   and actual.data_type = required.data_type
   and actual.is_nullable = required.is_nullable
  where actual.column_name is null;

  if missing_column_count > 0 then
    raise exception 'Recora Admin P0 M01 verification failed: % required column contract(s) are missing or incompatible', missing_column_count;
  end if;

  for required_constraint in
    select *
    from (values
      ('admin_command_receipts', 'admin_command_receipts_pkey'),
      ('admin_command_receipts', 'admin_command_receipts_actor_type_check'),
      ('admin_command_receipts', 'admin_command_receipts_actor_exactly_one_check'),
      ('admin_command_receipts', 'admin_command_receipts_system_component_format_check'),
      ('admin_command_receipts', 'admin_command_receipts_command_name_format_check'),
      ('admin_command_receipts', 'admin_command_receipts_target_type_format_check'),
      ('admin_command_receipts', 'admin_command_receipts_idempotency_key_format_check'),
      ('admin_command_receipts', 'admin_command_receipts_request_fingerprint_format_check'),
      ('admin_command_receipts', 'admin_command_receipts_stable_reason_code_format_check'),
      ('admin_command_receipts', 'admin_command_receipts_outcome_check'),
      ('admin_command_receipts', 'admin_command_receipts_project_requires_organization_check'),
      ('admin_command_receipts', 'admin_command_receipts_project_scope_fkey'),
      ('admin_command_receipts', 'admin_command_receipts_human_audit_required_check'),
      ('admin_command_receipts', 'admin_command_receipts_system_operator_receipt_forbidden_check'),
      ('admin_command_receipts', 'admin_command_receipts_operator_receipt_requires_audit_check'),
      ('admin_command_receipts', 'admin_command_receipts_denied_failed_no_success_receipt_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_pkey'),
      ('admin_outbox_messages', 'admin_outbox_messages_command_receipt_id_fkey'),
      ('admin_outbox_messages', 'admin_outbox_messages_message_type_format_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_aggregate_type_format_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_project_requires_organization_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_project_scope_fkey'),
      ('admin_outbox_messages', 'admin_outbox_messages_payload_object_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_status_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_attempt_count_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_row_version_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_available_after_created_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_last_error_code_format_check'),
      ('admin_outbox_messages', 'admin_outbox_messages_status_timestamp_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_pkey'),
      ('admin_read_refreshes', 'admin_read_refreshes_read_model_code_format_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_status_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_source_watermark_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_row_count_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_error_code_format_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_row_version_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_completed_after_started_check'),
      ('admin_read_refreshes', 'admin_read_refreshes_terminal_fields_check')
    ) as contract(table_name, constraint_name)
  loop
    if not exists (
      select 1
      from pg_constraint constraint_row
      where constraint_row.conrelid = format('recora_private.%I', required_constraint.table_name)::regclass
        and constraint_row.conname = required_constraint.constraint_name
        and constraint_row.convalidated is true
    ) then
      raise exception 'Recora Admin P0 M01 verification failed: constraint %.% is missing or unvalidated',
        required_constraint.table_name, required_constraint.constraint_name;
    end if;
  end loop;

  for required_trigger in
    select *
    from (values
      ('admin_command_receipts', 'admin_command_receipts_validate_insert'),
      ('admin_command_receipts', 'admin_command_receipts_append_only'),
      ('admin_outbox_messages', 'admin_outbox_messages_validate_transition'),
      ('admin_read_refreshes', 'admin_read_refreshes_validate_transition')
    ) as contract(table_name, trigger_name)
  loop
    if not exists (
      select 1
      from pg_trigger trigger_row
      where trigger_row.tgrelid = format('recora_private.%I', required_trigger.table_name)::regclass
        and trigger_row.tgname = required_trigger.trigger_name
        and trigger_row.tgenabled <> 'D'
        and trigger_row.tgisinternal is false
    ) then
      raise exception 'Recora Admin P0 M01 verification failed: trigger %.% is missing or disabled',
        required_trigger.table_name, required_trigger.trigger_name;
    end if;
  end loop;

  if not exists (select 1 from pg_namespace where nspname = 'admin_read') then
    raise exception 'Recora Admin P0 M01 verification failed: admin_read schema is missing';
  end if;

  if has_schema_privilege('anon', 'admin_read', 'USAGE')
    or has_schema_privilege('authenticated', 'admin_read', 'USAGE')
    or has_schema_privilege('service_role', 'admin_read', 'USAGE') then
    raise exception 'Recora Admin P0 M01 verification failed: admin_read schema is directly accessible';
  end if;

  if to_regprocedure('recora_private.admin_p0_resolve_command_receipt_replay(text,uuid,text,uuid,uuid,text,text,text)') is null then
    raise exception 'Recora Admin P0 M01 verification failed: idempotency replay resolver is missing';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = any(array[
        'admin_p0_resolve_command_receipt_replay',
        'admin_p0_validate_command_receipt_insert',
        'admin_p0_validate_outbox_transition',
        'admin_p0_validate_read_refresh_transition'
      ])
      and function_row.prosecdef is true
  ) then
    raise exception 'Recora Admin P0 M01 verification failed: a private M01 helper has prosecdef enabled';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    cross join lateral aclexplode(
      coalesce(function_row.proacl, acldefault('f', function_row.proowner))
    ) privilege_row
    left join pg_roles granted_role on granted_role.oid = privilege_row.grantee
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = any(array[
        'admin_p0_resolve_command_receipt_replay',
        'admin_p0_validate_command_receipt_insert',
        'admin_p0_validate_outbox_transition',
        'admin_p0_validate_read_refresh_transition'
      ])
      and privilege_row.privilege_type = 'EXECUTE'
      and (
        privilege_row.grantee = 0
        or exists (
          select 1
          from pg_roles protected_role
          where protected_role.rolname = any(array['anon', 'authenticated', 'service_role'])
            and granted_role.oid is not null
            and (
              protected_role.oid = granted_role.oid
              or pg_has_role(protected_role.oid, granted_role.oid, 'USAGE')
            )
        )
      )
  ) then
    raise exception 'Recora Admin P0 M01 verification failed: a private M01 helper has an executable ACL grant for a protected role';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'recora_private'
      and indexname = 'admin_command_receipts_actor_scope_idempotency_unique'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'recora_private'
      and indexname = 'admin_outbox_messages_command_aggregate_unique'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'recora_private'
      and indexname = 'admin_read_refreshes_one_running_per_model_unique'
  ) then
    raise exception 'Recora Admin P0 M01 verification failed: a critical unique index is missing';
  end if;
end;
$admin_p0_m01_verify$;
