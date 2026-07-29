-- Issue #113 / 102-3F: retention and deletion-state foundation.
-- Additive evidence foundation only: no deletion, purge, scheduler, or contract integration.

begin;

do $create_types$
begin
  create type recora_private.data_lifecycle_state as enum (
    'active', 'access_suspended', 'retained', 'deletion_scheduled',
    'deleting', 'deleted', 'deletion_failed'
  );
exception when duplicate_object then null;
end;
$create_types$;

create or replace function recora_private.is_safe_lifecycle_reference(p_value text)
returns boolean language sql immutable set search_path = '' as $$
  select p_value is not null and char_length(p_value) between 3 and 128
    and p_value ~ '^[a-z][a-z0-9_.:-]{2,127}$'
    and recora_audit.is_safe_audit_reason(p_value);
$$;

create or replace function recora_private.is_valid_deletion_manifest_summary(p_summary jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  category_row jsonb;
  category_name text;
  category_count text;
  category_total integer;
  distinct_total integer;
begin
  if p_summary is null or jsonb_typeof(p_summary) <> 'object'
    or (select count(*) from jsonb_object_keys(p_summary)) <> 2 or not (p_summary ? 'schema_version')
    or not (p_summary ? 'categories') or jsonb_typeof(p_summary->'schema_version') <> 'number'
    or p_summary->>'schema_version' <> '1' or jsonb_typeof(p_summary->'categories') <> 'array'
  then return false; end if;
  select count(*) into category_total from jsonb_array_elements(p_summary->'categories');
  if category_total < 1 or category_total > 16 then return false; end if;
  for category_row in select value from jsonb_array_elements(p_summary->'categories') loop
    if jsonb_typeof(category_row) <> 'object' or (select count(*) from jsonb_object_keys(category_row)) <> 2
      or not (category_row ? 'category') or not (category_row ? 'count')
      or jsonb_typeof(category_row->'category') <> 'string' or jsonb_typeof(category_row->'count') <> 'number'
    then return false; end if;
    category_name := category_row->>'category'; category_count := category_row->>'count';
    if category_name not in (
      'organization_configuration', 'project_configuration', 'measurement_evidence',
      'published_report_versions', 'operational_audit_evidence', 'storage_objects'
    ) or category_count !~ '^(0|[1-9][0-9]{0,8})$' then return false; end if;
  end loop;
  select count(distinct value->>'category') into distinct_total from jsonb_array_elements(p_summary->'categories');
  return distinct_total = category_total;
end;
$$;

create table if not exists recora_private.data_lifecycle_current (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  state recora_private.data_lifecycle_state not null default 'active'::recora_private.data_lifecycle_state,
  retention_policy_reference text,
  retention_policy_version_reference text,
  retention_started_at timestamptz,
  retention_deadline_at timestamptz,
  restore_deadline_at timestamptz,
  restore_eligible boolean not null default false,
  legal_hold_started_at timestamptz,
  legal_hold_released_at timestamptz,
  legal_hold_reason_reference text,
  deletion_scheduled_at timestamptz,
  deletion_started_at timestamptz,
  deletion_completed_at timestamptz,
  last_request_id uuid,
  last_correlation_id uuid,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_lifecycle_current_project_scope_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint data_lifecycle_current_version_positive check (version > 0),
  constraint data_lifecycle_current_retention_reference_pair check (
    (retention_policy_reference is null and retention_policy_version_reference is null)
    or (retention_policy_reference is not null and retention_policy_version_reference is not null
      and recora_private.is_safe_lifecycle_reference(retention_policy_reference)
      and recora_private.is_safe_lifecycle_reference(retention_policy_version_reference))
  ),
  constraint data_lifecycle_current_retention_timestamp_pair check (
    (retention_started_at is null and retention_deadline_at is null)
    or (retention_started_at is not null and retention_deadline_at is not null
      and retention_deadline_at > retention_started_at)
  ),
  constraint data_lifecycle_current_restore_consistency check (
    (restore_eligible is false and restore_deadline_at is null)
    or (restore_eligible is true and restore_deadline_at is not null)
  ),
  constraint data_lifecycle_current_legal_hold_consistency check (
    (legal_hold_started_at is null and legal_hold_released_at is null and legal_hold_reason_reference is null)
    or (legal_hold_started_at is not null and legal_hold_reason_reference is not null
      and recora_private.is_safe_lifecycle_reference(legal_hold_reason_reference)
      and (legal_hold_released_at is null or legal_hold_released_at >= legal_hold_started_at))
  ),
  constraint data_lifecycle_current_deletion_timestamp_order check (
    (deletion_started_at is null or deletion_scheduled_at is null or deletion_started_at >= deletion_scheduled_at)
    and (deletion_completed_at is null or deletion_started_at is not null)
    and (deletion_completed_at is null or deletion_completed_at >= deletion_started_at)
  )
);

comment on table recora_private.data_lifecycle_current is
  'Mutable organization or project current lifecycle state, separate from contract operations, with explicit deadlines only.';

create unique index if not exists data_lifecycle_current_organization_scope_unique
on recora_private.data_lifecycle_current (organization_id) where project_id is null;
create unique index if not exists data_lifecycle_current_project_scope_unique
on recora_private.data_lifecycle_current (organization_id, project_id) where project_id is not null;

create or replace function recora_private.validate_data_lifecycle_current()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (tg_op = 'INSERT' or new.retention_deadline_at is distinct from old.retention_deadline_at)
    and new.retention_deadline_at is not null and new.retention_deadline_at <= now()
  then raise exception 'retention_deadline_at must be an explicit future deadline when it changes'; end if;
  if (tg_op = 'INSERT' or new.restore_deadline_at is distinct from old.restore_deadline_at)
    and new.restore_deadline_at is not null and new.restore_deadline_at <= now()
  then raise exception 'restore_deadline_at must be an explicit future deadline when it changes'; end if;
  if new.restore_deadline_at is not null and new.retention_deadline_at is not null
    and new.restore_deadline_at > new.retention_deadline_at
  then raise exception 'restore_deadline_at must not exceed retention_deadline_at'; end if;
  if tg_op = 'UPDATE' then new.updated_at = now(); end if;
  return new;
end;
$$;

drop trigger if exists validate_data_lifecycle_current on recora_private.data_lifecycle_current;
create trigger validate_data_lifecycle_current before insert or update on recora_private.data_lifecycle_current
for each row execute function recora_private.validate_data_lifecycle_current();

create table if not exists recora_private.data_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  lifecycle_id uuid not null references recora_private.data_lifecycle_current(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  event_kind text not null,
  previous_state recora_private.data_lifecycle_state,
  next_state recora_private.data_lifecycle_state not null,
  version bigint not null,
  actor_operator_id uuid not null references recora_operator.operator_identities(id) on delete restrict,
  reason text not null,
  request_id uuid not null,
  correlation_id uuid not null,
  occurred_at timestamptz not null default now(),
  constraint data_lifecycle_events_project_scope_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint data_lifecycle_events_version_positive check (version > 0),
  constraint data_lifecycle_events_kind_shape check (
    (event_kind = 'initialized' and previous_state is null and next_state = 'active'::recora_private.data_lifecycle_state)
    or (event_kind = 'state_transition' and previous_state is not null)
    or (event_kind in ('legal_hold_applied', 'legal_hold_released') and previous_state = next_state)
  ),
  constraint data_lifecycle_events_reason_safe check (recora_audit.is_safe_audit_reason(reason)),
  constraint data_lifecycle_events_scope_request_unique unique (lifecycle_id, request_id),
  constraint data_lifecycle_events_scope_version_unique unique (lifecycle_id, version)
);

create table if not exists recora_private.deletion_manifests (
  id uuid primary key default gen_random_uuid(),
  lifecycle_id uuid not null references recora_private.data_lifecycle_current(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  manifest_identifier text not null,
  manifest_version smallint not null,
  manifest_hash text not null,
  category_counts jsonb not null,
  actor_operator_id uuid not null references recora_operator.operator_identities(id) on delete restrict,
  request_id uuid not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  constraint deletion_manifests_project_scope_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint deletion_manifests_identifier_safe check (recora_private.is_safe_lifecycle_reference(manifest_identifier)),
  constraint deletion_manifests_version_positive check (manifest_version > 0),
  constraint deletion_manifests_hash_format check (manifest_hash ~ '^[0-9a-f]{64}$'),
  constraint deletion_manifests_summary_valid check (recora_private.is_valid_deletion_manifest_summary(category_counts)),
  constraint deletion_manifests_scope_version_unique unique (lifecycle_id, manifest_version),
  constraint deletion_manifests_scope_identifier_unique unique (lifecycle_id, manifest_identifier),
  constraint deletion_manifests_scope_request_unique unique (lifecycle_id, request_id)
);

create table if not exists recora_private.deletion_attempts (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references recora_private.deletion_manifests(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  attempt_number integer not null,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  outcome text not null,
  failure_reason_code text,
  actor_operator_id uuid not null references recora_operator.operator_identities(id) on delete restrict,
  request_id uuid not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  constraint deletion_attempts_project_scope_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint deletion_attempts_number_positive check (attempt_number > 0),
  constraint deletion_attempts_timeline check (finished_at >= started_at),
  constraint deletion_attempts_outcome check (outcome in ('success', 'failed')),
  constraint deletion_attempts_failure_consistency check (
    (outcome = 'success' and failure_reason_code is null)
    or (outcome = 'failed' and failure_reason_code is not null
      and recora_private.is_safe_lifecycle_reference(failure_reason_code))
  ),
  constraint deletion_attempts_manifest_number_unique unique (manifest_id, attempt_number),
  constraint deletion_attempts_manifest_request_unique unique (manifest_id, request_id)
);
create or replace function recora_private.validate_data_lifecycle_event_scope()
returns trigger language plpgsql set search_path = '' as $$
declare expected_project_id uuid;
begin
  select lifecycle_row.project_id into expected_project_id
  from recora_private.data_lifecycle_current lifecycle_row
  where lifecycle_row.id = new.lifecycle_id and lifecycle_row.organization_id = new.organization_id;
  if not found or expected_project_id is distinct from new.project_id then
    raise exception 'data lifecycle event scope must exactly match the current lifecycle scope';
  end if;
  return new;
end;
$$;

create or replace function recora_private.validate_deletion_manifest_scope()
returns trigger language plpgsql set search_path = '' as $$
declare expected_project_id uuid;
begin
  select lifecycle_row.project_id into expected_project_id
  from recora_private.data_lifecycle_current lifecycle_row
  where lifecycle_row.id = new.lifecycle_id and lifecycle_row.organization_id = new.organization_id;
  if not found or expected_project_id is distinct from new.project_id then
    raise exception 'deletion manifest scope must exactly match the lifecycle scope';
  end if;
  return new;
end;
$$;

create or replace function recora_private.validate_deletion_attempt_scope()
returns trigger language plpgsql set search_path = '' as $$
declare expected_organization_id uuid; expected_project_id uuid;
begin
  select manifest_row.organization_id, manifest_row.project_id into expected_organization_id, expected_project_id
  from recora_private.deletion_manifests manifest_row where manifest_row.id = new.manifest_id;
  if not found or expected_organization_id is distinct from new.organization_id
    or expected_project_id is distinct from new.project_id
  then raise exception 'deletion attempt scope must exactly match the deletion manifest scope'; end if;
  return new;
end;
$$;

create or replace function recora_private.prevent_data_lifecycle_history_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'data lifecycle evidence is append-only; record a new lifecycle event or attempt instead';
end;
$$;

drop trigger if exists validate_data_lifecycle_event_scope on recora_private.data_lifecycle_events;
create trigger validate_data_lifecycle_event_scope before insert on recora_private.data_lifecycle_events
for each row execute function recora_private.validate_data_lifecycle_event_scope();
drop trigger if exists data_lifecycle_events_prevent_update_delete on recora_private.data_lifecycle_events;
create trigger data_lifecycle_events_prevent_update_delete before update or delete on recora_private.data_lifecycle_events
for each row execute function recora_private.prevent_data_lifecycle_history_mutation();

drop trigger if exists validate_deletion_manifest_scope on recora_private.deletion_manifests;
create trigger validate_deletion_manifest_scope before insert on recora_private.deletion_manifests
for each row execute function recora_private.validate_deletion_manifest_scope();
drop trigger if exists deletion_manifests_prevent_update_delete on recora_private.deletion_manifests;
create trigger deletion_manifests_prevent_update_delete before update or delete on recora_private.deletion_manifests
for each row execute function recora_private.prevent_data_lifecycle_history_mutation();

drop trigger if exists validate_deletion_attempt_scope on recora_private.deletion_attempts;
create trigger validate_deletion_attempt_scope before insert on recora_private.deletion_attempts
for each row execute function recora_private.validate_deletion_attempt_scope();
drop trigger if exists deletion_attempts_prevent_update_delete on recora_private.deletion_attempts;
create trigger deletion_attempts_prevent_update_delete before update or delete on recora_private.deletion_attempts
for each row execute function recora_private.prevent_data_lifecycle_history_mutation();

create index if not exists data_lifecycle_current_scope_state_idx
on recora_private.data_lifecycle_current (organization_id, project_id, state);
create index if not exists data_lifecycle_events_scope_time_idx
on recora_private.data_lifecycle_events (organization_id, project_id, occurred_at desc);
create index if not exists deletion_manifests_scope_created_idx
on recora_private.deletion_manifests (organization_id, project_id, created_at desc);
create index if not exists deletion_attempts_manifest_time_idx
on recora_private.deletion_attempts (manifest_id, attempt_number, finished_at desc);

alter table recora_private.data_lifecycle_current enable row level security;
alter table recora_private.data_lifecycle_events enable row level security;
alter table recora_private.deletion_manifests enable row level security;
alter table recora_private.deletion_attempts enable row level security;
revoke all on recora_private.data_lifecycle_current from public, anon, authenticated;
revoke all on recora_private.data_lifecycle_events from public, anon, authenticated;
revoke all on recora_private.deletion_manifests from public, anon, authenticated;
revoke all on recora_private.deletion_attempts from public, anon, authenticated;
revoke all on all sequences in schema recora_private from public, anon, authenticated;

create or replace function recora_private.write_data_lifecycle_operator_event(
  p_actor_operator_id uuid, p_organization_id uuid, p_project_id uuid, p_action text,
  p_target_type text, p_target_id uuid, p_permission text, p_reason text,
  p_before_summary jsonb, p_after_summary jsonb, p_request_id uuid, p_correlation_id uuid,
  p_outcome recora_audit.operator_audit_outcome, p_failure_reason_code text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare created_audit_event_id uuid;
begin
  insert into recora_audit.operator_events (
    actor_operator_id, organization_id, project_id, action, target_type, target_id,
    permission_used, reason, before_summary, after_summary, request_id, correlation_id,
    outcome, failure_reason_code
  ) values (
    p_actor_operator_id, p_organization_id, p_project_id, p_action, p_target_type, p_target_id,
    p_permission, p_reason, p_before_summary, p_after_summary, p_request_id, p_correlation_id,
    p_outcome, p_failure_reason_code
  ) returning id into created_audit_event_id;
  return created_audit_event_id;
end;
$$;

create or replace function public.recora_transition_data_lifecycle(
  p_auth_user_id uuid, p_organization_id uuid, p_project_id uuid, p_expected_state text,
  p_expected_version bigint, p_next_state text, p_reason text, p_request_id uuid,
  p_correlation_id uuid, p_retention_policy_reference text default null,
  p_retention_policy_version_reference text default null, p_retention_started_at timestamptz default null,
  p_retention_deadline_at timestamptz default null, p_restore_eligible boolean default null,
  p_restore_deadline_at timestamptz default null, p_manifest_identifier text default null,
  p_manifest_version smallint default null, p_manifest_hash text default null,
  p_manifest_summary jsonb default null, p_attempt_started_at timestamptz default null,
  p_attempt_finished_at timestamptz default null, p_attempt_outcome text default null,
  p_attempt_failure_reason_code text default null
)
returns table (lifecycle_id uuid, lifecycle_version bigint, outcome recora_audit.operator_audit_outcome, failure_reason_code text)
language plpgsql security definer set search_path = '' as $$
declare
  authorization_result record;
  lifecycle_row recora_private.data_lifecycle_current%rowtype;
  target_state recora_private.data_lifecycle_state;
  audit_organization_id uuid; audit_project_id uuid; target_type text; target_id uuid;
  safe_reason text; legal_hold_active boolean; transition_allowed boolean;
  resolved_manifest_id uuid; manifest_created boolean := false; attempt_number integer;
  next_version bigint; failure_code text;
begin
  if p_request_id is null or p_correlation_id is null then raise exception 'request_id and correlation_id are required'; end if;
  target_type := case when p_project_id is null then 'organization' else 'project' end;
  target_id := coalesce(p_project_id, p_organization_id, gen_random_uuid());
  safe_reason := case when recora_audit.is_safe_audit_reason(p_reason) then nullif(btrim(p_reason), '') else null end;
  select organization_row.id into audit_organization_id from public.organizations organization_row where organization_row.id = p_organization_id;
  select project_row.id into audit_project_id from public.projects project_row
  where project_row.id = p_project_id and project_row.organization_id = p_organization_id;
  select * into authorization_result from recora_operator.resolve_command_authorization(
    p_auth_user_id, 'data_lifecycle.transition', p_organization_id, p_project_id,
    'data_lifecycle.transition', target_type, target_id, p_reason
  );
  if not authorization_result.authorized then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, audit_organization_id, audit_project_id,
      'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition',
      safe_reason, '{}'::jsonb, '{}'::jsonb, p_request_id, p_correlation_id,
      'denied'::recora_audit.operator_audit_outcome, coalesce(authorization_result.failure_reason_code, 'authorization_denied')
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome,
      coalesce(authorization_result.failure_reason_code, 'authorization_denied'); return;
  end if;
  if p_expected_version is null or p_expected_version < 0 then failure_code := 'version_required';
  elsif p_next_state not in ('active', 'access_suspended', 'retained', 'deletion_scheduled', 'deleting', 'deleted', 'deletion_failed') then failure_code := 'next_state_invalid'; end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, audit_organization_id, audit_project_id,
      'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition',
      safe_reason, '{}'::jsonb, '{}'::jsonb, p_request_id, p_correlation_id,
      'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;
  target_state := p_next_state::recora_private.data_lifecycle_state;
  select * into lifecycle_row from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = p_organization_id and current_row.project_id is not distinct from p_project_id for update;
  if not found then
    if p_expected_state is not null or p_expected_version <> 0 or target_state <> 'active'::recora_private.data_lifecycle_state
      or p_retention_policy_reference is not null or p_retention_policy_version_reference is not null
      or p_retention_started_at is not null or p_retention_deadline_at is not null
      or p_restore_eligible is not null or p_restore_deadline_at is not null
      or p_manifest_identifier is not null or p_manifest_version is not null or p_manifest_hash is not null or p_manifest_summary is not null
      or p_attempt_started_at is not null or p_attempt_finished_at is not null or p_attempt_outcome is not null or p_attempt_failure_reason_code is not null
    then failure_code := 'lifecycle_initialization_invalid';
    else
      insert into recora_private.data_lifecycle_current (organization_id, project_id, state, last_request_id, last_correlation_id, version)
      values (p_organization_id, p_project_id, 'active'::recora_private.data_lifecycle_state, p_request_id, p_correlation_id, 1)
      returning * into lifecycle_row;
      insert into recora_private.data_lifecycle_events (
        lifecycle_id, organization_id, project_id, event_kind, previous_state, next_state, version,
        actor_operator_id, reason, request_id, correlation_id
      ) values (
        lifecycle_row.id, p_organization_id, p_project_id, 'initialized', null,
        'active'::recora_private.data_lifecycle_state, lifecycle_row.version,
        authorization_result.operator_id, safe_reason, p_request_id, p_correlation_id
      );
      perform recora_private.write_data_lifecycle_operator_event(
        authorization_result.operator_id, p_organization_id, p_project_id,
        'data_lifecycle.initialize', target_type, target_id, 'data_lifecycle.transition', safe_reason,
        '{}'::jsonb, jsonb_build_object('state', 'active', 'version', lifecycle_row.version),
        p_request_id, p_correlation_id, 'success'::recora_audit.operator_audit_outcome, null
      );
      return query select lifecycle_row.id, lifecycle_row.version, 'success'::recora_audit.operator_audit_outcome, null::text; return;
    end if;
  elsif exists (select 1 from recora_private.data_lifecycle_events event_row where event_row.lifecycle_id = lifecycle_row.id and event_row.request_id = p_request_id) then failure_code := 'duplicate_request';
  elsif p_expected_state is null or p_expected_state <> lifecycle_row.state::text then failure_code := 'state_conflict';
  elsif p_expected_version <> lifecycle_row.version then failure_code := 'version_conflict'; end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, p_organization_id, p_project_id,
      'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      coalesce(jsonb_build_object('state', lifecycle_row.state::text, 'version', lifecycle_row.version), '{}'::jsonb),
      '{}'::jsonb, p_request_id, p_correlation_id, 'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;  transition_allowed :=
    (lifecycle_row.state = 'active'::recora_private.data_lifecycle_state and target_state = 'access_suspended'::recora_private.data_lifecycle_state)
    or (lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state in ('active'::recora_private.data_lifecycle_state, 'retained'::recora_private.data_lifecycle_state))
    or (lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state and target_state in ('active'::recora_private.data_lifecycle_state, 'deletion_scheduled'::recora_private.data_lifecycle_state))
    or (lifecycle_row.state = 'deletion_scheduled'::recora_private.data_lifecycle_state and target_state in ('retained'::recora_private.data_lifecycle_state, 'deleting'::recora_private.data_lifecycle_state))
    or (lifecycle_row.state = 'deleting'::recora_private.data_lifecycle_state and target_state in ('deleted'::recora_private.data_lifecycle_state, 'deletion_failed'::recora_private.data_lifecycle_state))
    or (lifecycle_row.state = 'deletion_failed'::recora_private.data_lifecycle_state and target_state in ('deleting'::recora_private.data_lifecycle_state, 'retained'::recora_private.data_lifecycle_state));
  if not transition_allowed then failure_code := 'transition_not_allowed';
  else
    legal_hold_active := lifecycle_row.legal_hold_started_at is not null and lifecycle_row.legal_hold_released_at is null;
    if legal_hold_active and target_state in (
      'deletion_scheduled'::recora_private.data_lifecycle_state,
      'deleting'::recora_private.data_lifecycle_state,
      'deleted'::recora_private.data_lifecycle_state
    ) then failure_code := 'legal_hold_active';
    elsif lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state
      and target_state = 'active'::recora_private.data_lifecycle_state
      and (lifecycle_row.restore_eligible is not true or lifecycle_row.restore_deadline_at is null
        or lifecycle_row.restore_deadline_at <= clock_timestamp() or lifecycle_row.deletion_started_at is not null or legal_hold_active)
    then failure_code := 'restore_not_eligible'; end if;
  end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, p_organization_id, p_project_id,
      'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      jsonb_build_object('state', lifecycle_row.state::text, 'version', lifecycle_row.version),
      '{}'::jsonb, p_request_id, p_correlation_id, 'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;

  if lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state
    and target_state = 'retained'::recora_private.data_lifecycle_state
  then
    if not recora_private.is_safe_lifecycle_reference(p_retention_policy_reference)
      or not recora_private.is_safe_lifecycle_reference(p_retention_policy_version_reference)
      or p_retention_started_at is null or p_retention_started_at > now()
      or p_retention_deadline_at is null or p_retention_deadline_at <= now()
      or p_retention_deadline_at <= p_retention_started_at or p_restore_eligible is null
      or (p_restore_eligible and (p_restore_deadline_at is null or p_restore_deadline_at <= now() or p_restore_deadline_at > p_retention_deadline_at))
      or (not p_restore_eligible and p_restore_deadline_at is not null)
    then failure_code := 'retention_payload_invalid'; end if;
  elsif p_retention_policy_reference is not null or p_retention_policy_version_reference is not null
    or p_retention_started_at is not null or p_retention_deadline_at is not null
    or p_restore_eligible is not null or p_restore_deadline_at is not null
  then failure_code := 'retention_payload_not_allowed'; end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, p_organization_id, p_project_id,
      'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      jsonb_build_object('state', lifecycle_row.state::text, 'version', lifecycle_row.version),
      '{}'::jsonb, p_request_id, p_correlation_id, 'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;

  if target_state = 'deleting'::recora_private.data_lifecycle_state then
    select manifest_row.id into resolved_manifest_id from recora_private.deletion_manifests manifest_row
    where manifest_row.lifecycle_id = lifecycle_row.id order by manifest_row.manifest_version desc limit 1;
    if resolved_manifest_id is null then
      if not recora_private.is_safe_lifecycle_reference(p_manifest_identifier)
        or p_manifest_version is null or p_manifest_version <= 0
        or p_manifest_hash is null or p_manifest_hash !~ '^[0-9a-f]{64}$'
        or not recora_private.is_valid_deletion_manifest_summary(p_manifest_summary)
      then failure_code := 'manifest_required';
      else
        insert into recora_private.deletion_manifests (
          lifecycle_id, organization_id, project_id, manifest_identifier, manifest_version, manifest_hash,
          category_counts, actor_operator_id, request_id, correlation_id
        ) values (
          lifecycle_row.id, p_organization_id, p_project_id, p_manifest_identifier, p_manifest_version, p_manifest_hash,
          p_manifest_summary, authorization_result.operator_id, p_request_id, p_correlation_id
        ) returning id into resolved_manifest_id;
        manifest_created := true;
      end if;
    elsif p_manifest_identifier is not null or p_manifest_version is not null
      or p_manifest_hash is not null or p_manifest_summary is not null
    then failure_code := 'manifest_payload_not_allowed'; end if;
  elsif p_manifest_identifier is not null or p_manifest_version is not null
    or p_manifest_hash is not null or p_manifest_summary is not null
  then failure_code := 'manifest_payload_not_allowed'; end if;

  if failure_code is null and target_state in ('deleted'::recora_private.data_lifecycle_state, 'deletion_failed'::recora_private.data_lifecycle_state) then
    select manifest_row.id into resolved_manifest_id from recora_private.deletion_manifests manifest_row
    where manifest_row.lifecycle_id = lifecycle_row.id order by manifest_row.manifest_version desc limit 1;
    if resolved_manifest_id is null then failure_code := 'manifest_required';
    elsif p_attempt_started_at is null or p_attempt_finished_at is null
      or p_attempt_started_at > now() or p_attempt_finished_at > now() or p_attempt_finished_at < p_attempt_started_at
      or (target_state = 'deleted'::recora_private.data_lifecycle_state and (p_attempt_outcome <> 'success' or p_attempt_failure_reason_code is not null))
      or (target_state = 'deletion_failed'::recora_private.data_lifecycle_state and (p_attempt_outcome <> 'failed' or not recora_private.is_safe_lifecycle_reference(p_attempt_failure_reason_code)))
    then failure_code := 'attempt_payload_invalid'; end if;
  elsif p_attempt_started_at is not null or p_attempt_finished_at is not null
    or p_attempt_outcome is not null or p_attempt_failure_reason_code is not null
  then failure_code := 'attempt_payload_not_allowed'; end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, p_organization_id, p_project_id,
      'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      jsonb_build_object('state', lifecycle_row.state::text, 'version', lifecycle_row.version),
      '{}'::jsonb, p_request_id, p_correlation_id, 'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;

  next_version := lifecycle_row.version + 1;
  update recora_private.data_lifecycle_current set
    state = target_state,
    retention_policy_reference = case when lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then p_retention_policy_reference else lifecycle_row.retention_policy_reference end,
    retention_policy_version_reference = case when lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then p_retention_policy_version_reference else lifecycle_row.retention_policy_version_reference end,
    retention_started_at = case when lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then p_retention_started_at else lifecycle_row.retention_started_at end,
    retention_deadline_at = case when lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then p_retention_deadline_at else lifecycle_row.retention_deadline_at end,
    restore_eligible = case
      when lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then p_restore_eligible
      when lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state and target_state = 'active'::recora_private.data_lifecycle_state then false
      when lifecycle_row.state = 'deletion_failed'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then false
      else lifecycle_row.restore_eligible end,
    restore_deadline_at = case
      when lifecycle_row.state = 'access_suspended'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then p_restore_deadline_at
      when lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state and target_state = 'active'::recora_private.data_lifecycle_state then null
      when lifecycle_row.state = 'deletion_failed'::recora_private.data_lifecycle_state and target_state = 'retained'::recora_private.data_lifecycle_state then null
      else lifecycle_row.restore_deadline_at end,
    deletion_scheduled_at = case when target_state = 'deletion_scheduled'::recora_private.data_lifecycle_state then coalesce(lifecycle_row.deletion_scheduled_at, now()) else lifecycle_row.deletion_scheduled_at end,
    deletion_started_at = case when target_state = 'deleting'::recora_private.data_lifecycle_state then coalesce(lifecycle_row.deletion_started_at, now()) else lifecycle_row.deletion_started_at end,
    deletion_completed_at = case when target_state = 'deleted'::recora_private.data_lifecycle_state then p_attempt_finished_at else lifecycle_row.deletion_completed_at end,
    last_request_id = p_request_id, last_correlation_id = p_correlation_id, version = next_version
  where id = lifecycle_row.id and version = lifecycle_row.version returning * into lifecycle_row;
  if not found then raise exception 'lifecycle optimistic update conflict'; end if;

  if target_state in ('deleted'::recora_private.data_lifecycle_state, 'deletion_failed'::recora_private.data_lifecycle_state) then
    select coalesce(max(attempt_row.attempt_number), 0) + 1 into attempt_number
    from recora_private.deletion_attempts attempt_row where attempt_row.manifest_id = resolved_manifest_id;
    insert into recora_private.deletion_attempts (
      manifest_id, organization_id, project_id, attempt_number, started_at, finished_at,
      outcome, failure_reason_code, actor_operator_id, request_id, correlation_id
    ) values (
      resolved_manifest_id, p_organization_id, p_project_id, attempt_number, p_attempt_started_at, p_attempt_finished_at,
      p_attempt_outcome, p_attempt_failure_reason_code, authorization_result.operator_id, p_request_id, p_correlation_id
    );
  end if;
  insert into recora_private.data_lifecycle_events (
    lifecycle_id, organization_id, project_id, event_kind, previous_state, next_state,
    version, actor_operator_id, reason, request_id, correlation_id
  ) values (
    lifecycle_row.id, p_organization_id, p_project_id, 'state_transition',
    p_expected_state::recora_private.data_lifecycle_state, target_state, lifecycle_row.version,
    authorization_result.operator_id, safe_reason, p_request_id, p_correlation_id
  );
  perform recora_private.write_data_lifecycle_operator_event(
    authorization_result.operator_id, p_organization_id, p_project_id,
    'data_lifecycle.transition', target_type, target_id, 'data_lifecycle.transition', safe_reason,
    jsonb_build_object('state', p_expected_state, 'version', p_expected_version),
    jsonb_strip_nulls(jsonb_build_object('state', target_state::text, 'version', lifecycle_row.version,
      'manifest_created', manifest_created, 'attempt_outcome', p_attempt_outcome)),
    p_request_id, p_correlation_id, 'success'::recora_audit.operator_audit_outcome, null
  );
  return query select lifecycle_row.id, lifecycle_row.version, 'success'::recora_audit.operator_audit_outcome, null::text;
end;
$$;

comment on function public.recora_transition_data_lifecycle(uuid, uuid, uuid, text, bigint, text, text, uuid, uuid, text, text, timestamptz, timestamptz, boolean, timestamptz, text, smallint, text, jsonb, timestamptz, timestamptz, text, text) is
  'Service-role-only explicit lifecycle command. It verifies active scoped operator and optimistic state/version, writes state/event/manifest-or-attempt/audit evidence atomically, and never deletes tenant data.';
create or replace function public.recora_set_data_lifecycle_legal_hold(
  p_auth_user_id uuid, p_organization_id uuid, p_project_id uuid, p_expected_version bigint,
  p_hold_action text, p_reason text, p_legal_hold_reason_reference text,
  p_request_id uuid, p_correlation_id uuid
)
returns table (lifecycle_id uuid, lifecycle_version bigint, outcome recora_audit.operator_audit_outcome, failure_reason_code text)
language plpgsql security definer set search_path = '' as $$
declare
  authorization_result record; lifecycle_row recora_private.data_lifecycle_current%rowtype;
  audit_organization_id uuid; audit_project_id uuid; target_type text; target_id uuid;
  safe_reason text; hold_active boolean; event_kind text; failure_code text;
begin
  if p_request_id is null or p_correlation_id is null then raise exception 'request_id and correlation_id are required'; end if;
  target_type := case when p_project_id is null then 'organization' else 'project' end;
  target_id := coalesce(p_project_id, p_organization_id, gen_random_uuid());
  safe_reason := case when recora_audit.is_safe_audit_reason(p_reason) then nullif(btrim(p_reason), '') else null end;
  select organization_row.id into audit_organization_id from public.organizations organization_row where organization_row.id = p_organization_id;
  select project_row.id into audit_project_id from public.projects project_row
  where project_row.id = p_project_id and project_row.organization_id = p_organization_id;
  select * into authorization_result from recora_operator.resolve_command_authorization(
    p_auth_user_id, 'data_lifecycle.transition', p_organization_id, p_project_id,
    'data_lifecycle.legal_hold', target_type, target_id, p_reason
  );
  if not authorization_result.authorized then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, audit_organization_id, audit_project_id,
      'data_lifecycle.legal_hold', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      '{}'::jsonb, '{}'::jsonb, p_request_id, p_correlation_id,
      'denied'::recora_audit.operator_audit_outcome, coalesce(authorization_result.failure_reason_code, 'authorization_denied')
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome,
      coalesce(authorization_result.failure_reason_code, 'authorization_denied'); return;
  end if;
  select * into lifecycle_row from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = p_organization_id and current_row.project_id is not distinct from p_project_id for update;
  if not found then failure_code := 'lifecycle_not_initialized';
  elsif p_expected_version is null or p_expected_version <> lifecycle_row.version then failure_code := 'version_conflict';
  elsif p_hold_action not in ('apply', 'release') then failure_code := 'hold_action_invalid';
  elsif exists (select 1 from recora_private.data_lifecycle_events event_row where event_row.lifecycle_id = lifecycle_row.id and event_row.request_id = p_request_id) then failure_code := 'duplicate_request'; end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, p_organization_id, p_project_id,
      'data_lifecycle.legal_hold', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      '{}'::jsonb, '{}'::jsonb, p_request_id, p_correlation_id,
      'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;
  hold_active := lifecycle_row.legal_hold_started_at is not null and lifecycle_row.legal_hold_released_at is null;
  if lifecycle_row.state = 'deleted'::recora_private.data_lifecycle_state then failure_code := 'lifecycle_terminal';
  elsif p_hold_action = 'apply' and (hold_active or not recora_private.is_safe_lifecycle_reference(p_legal_hold_reason_reference)) then failure_code := 'legal_hold_apply_invalid';
  elsif p_hold_action = 'release' and (not hold_active or p_legal_hold_reason_reference is not null) then failure_code := 'legal_hold_release_invalid'; end if;
  if failure_code is not null then
    perform recora_private.write_data_lifecycle_operator_event(
      authorization_result.operator_id, p_organization_id, p_project_id,
      'data_lifecycle.legal_hold', target_type, target_id, 'data_lifecycle.transition', safe_reason,
      jsonb_build_object('state', lifecycle_row.state::text, 'version', lifecycle_row.version),
      '{}'::jsonb, p_request_id, p_correlation_id, 'denied'::recora_audit.operator_audit_outcome, failure_code
    );
    return query select null::uuid, null::bigint, 'denied'::recora_audit.operator_audit_outcome, failure_code; return;
  end if;
  if p_hold_action = 'apply' then
    update recora_private.data_lifecycle_current set legal_hold_started_at = now(), legal_hold_released_at = null,
      legal_hold_reason_reference = p_legal_hold_reason_reference, last_request_id = p_request_id,
      last_correlation_id = p_correlation_id, version = lifecycle_row.version + 1
    where id = lifecycle_row.id and version = lifecycle_row.version returning * into lifecycle_row;
    event_kind := 'legal_hold_applied';
  else
    update recora_private.data_lifecycle_current set legal_hold_released_at = now(), last_request_id = p_request_id,
      last_correlation_id = p_correlation_id, version = lifecycle_row.version + 1
    where id = lifecycle_row.id and version = lifecycle_row.version returning * into lifecycle_row;
    event_kind := 'legal_hold_released';
  end if;
  if not found then raise exception 'lifecycle optimistic update conflict'; end if;
  insert into recora_private.data_lifecycle_events (
    lifecycle_id, organization_id, project_id, event_kind, previous_state, next_state,
    version, actor_operator_id, reason, request_id, correlation_id
  ) values (
    lifecycle_row.id, p_organization_id, p_project_id, event_kind, lifecycle_row.state,
    lifecycle_row.state, lifecycle_row.version, authorization_result.operator_id,
    safe_reason, p_request_id, p_correlation_id
  );
  perform recora_private.write_data_lifecycle_operator_event(
    authorization_result.operator_id, p_organization_id, p_project_id,
    'data_lifecycle.legal_hold', target_type, target_id, 'data_lifecycle.transition', safe_reason,
    jsonb_build_object('version', p_expected_version),
    jsonb_build_object('hold_action', p_hold_action, 'version', lifecycle_row.version),
    p_request_id, p_correlation_id, 'success'::recora_audit.operator_audit_outcome, null
  );
  return query select lifecycle_row.id, lifecycle_row.version, 'success'::recora_audit.operator_audit_outcome, null::text;
end;
$$;

create or replace function public.recora_resolve_data_lifecycle_access(
  p_organization_id uuid, p_project_id uuid default null
)
returns table (
  customer_access_allowed boolean, new_measurement_allowed boolean,
  restore_eligible boolean, reason_code text
)
language plpgsql stable security definer set search_path = '' as $$
declare candidate_count integer; lifecycle_row recora_private.data_lifecycle_current%rowtype; legal_hold_active boolean;
begin
  if p_organization_id is null or not exists (
    select 1 from public.organizations organization_row where organization_row.id = p_organization_id
  ) then return query select false, false, false, 'invalid_scope'::text; return; end if;
  if p_project_id is not null and not exists (
    select 1 from public.projects project_row where project_row.id = p_project_id and project_row.organization_id = p_organization_id
  ) then return query select false, false, false, 'invalid_scope'::text; return; end if;
  with candidates as (
    select current_row.id, case when p_project_id is not null and current_row.project_id = p_project_id then 0 else 1 end as precedence
    from recora_private.data_lifecycle_current current_row
    where current_row.organization_id = p_organization_id
      and (current_row.project_id is null or (p_project_id is not null and current_row.project_id = p_project_id))
  ), preferred as (
    select candidate.id from candidates candidate
    where candidate.precedence = (select min(candidate_precedence.precedence) from candidates candidate_precedence)
  ) select count(*) into candidate_count from preferred;
  if candidate_count = 0 then return query select false, false, false, 'no_lifecycle_state'::text; return; end if;
  if candidate_count <> 1 then return query select false, false, false, 'ambiguous_lifecycle_state'::text; return; end if;
  with candidates as (
    select current_row.id, case when p_project_id is not null and current_row.project_id = p_project_id then 0 else 1 end as precedence
    from recora_private.data_lifecycle_current current_row
    where current_row.organization_id = p_organization_id
      and (current_row.project_id is null or (p_project_id is not null and current_row.project_id = p_project_id))
  ) select current_row.* into lifecycle_row from candidates candidate
  join recora_private.data_lifecycle_current current_row on current_row.id = candidate.id
  where candidate.precedence = (select min(candidate_precedence.precedence) from candidates candidate_precedence);
  legal_hold_active := lifecycle_row.legal_hold_started_at is not null and lifecycle_row.legal_hold_released_at is null;
  if lifecycle_row.state = 'active'::recora_private.data_lifecycle_state then
    return query select true, true, false, 'active'::text; return;
  elsif lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state
    and lifecycle_row.restore_eligible and lifecycle_row.restore_deadline_at is not null
    and lifecycle_row.restore_deadline_at > clock_timestamp() and lifecycle_row.deletion_started_at is null and not legal_hold_active
  then return query select false, false, true, 'retained_restore_eligible'::text; return; end if;
  return query select false, false, false, lifecycle_row.state::text;
end;
$$;

comment on function public.recora_resolve_data_lifecycle_access(uuid, uuid) is
  'Service-role-only lifecycle resolver. It returns only access, measurement, restore booleans and stable reason codes.';

revoke all on function recora_private.is_safe_lifecycle_reference(text) from public, anon, authenticated;
revoke all on function recora_private.is_valid_deletion_manifest_summary(jsonb) from public, anon, authenticated;
revoke all on function recora_private.validate_data_lifecycle_current() from public, anon, authenticated;
revoke all on function recora_private.validate_data_lifecycle_event_scope() from public, anon, authenticated;
revoke all on function recora_private.validate_deletion_manifest_scope() from public, anon, authenticated;
revoke all on function recora_private.validate_deletion_attempt_scope() from public, anon, authenticated;
revoke all on function recora_private.prevent_data_lifecycle_history_mutation() from public, anon, authenticated;
revoke all on function recora_private.write_data_lifecycle_operator_event(uuid, uuid, uuid, text, text, uuid, text, text, jsonb, jsonb, uuid, uuid, recora_audit.operator_audit_outcome, text) from public, anon, authenticated;
revoke all on function public.recora_transition_data_lifecycle(uuid, uuid, uuid, text, bigint, text, text, uuid, uuid, text, text, timestamptz, timestamptz, boolean, timestamptz, text, smallint, text, jsonb, timestamptz, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.recora_set_data_lifecycle_legal_hold(uuid, uuid, uuid, bigint, text, text, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.recora_resolve_data_lifecycle_access(uuid, uuid) from public, anon, authenticated;
grant execute on function public.recora_transition_data_lifecycle(uuid, uuid, uuid, text, bigint, text, text, uuid, uuid, text, text, timestamptz, timestamptz, boolean, timestamptz, text, smallint, text, jsonb, timestamptz, timestamptz, text, text) to service_role;
grant execute on function public.recora_set_data_lifecycle_legal_hold(uuid, uuid, uuid, bigint, text, text, text, uuid, uuid) to service_role;
grant execute on function public.recora_resolve_data_lifecycle_access(uuid, uuid) to service_role;

commit;