-- Issue #109 / 102-3E operator identity, authorization, and append-only audit foundation.
--
-- This migration is intentionally additive. It creates no production operator and
-- does not infer an operator from an email, service role, or JWT user metadata.
-- A server-only module must first verify auth.getUser(), then invoke the explicit
-- service-role-only command boundary with that immutable auth user id.

set search_path = public, extensions;

create schema if not exists recora_operator;
create schema if not exists recora_audit;

comment on schema recora_operator is
  'Private operator identity, scoped action-grant, and explicit command-boundary schema. It is not a customer or browser Data API surface.';
comment on schema recora_audit is
  'Private append-only audit evidence schema. Corrections are new events; historical events are never mutated.';

revoke all on schema recora_operator from public, anon, authenticated;
revoke all on schema recora_audit from public, anon, authenticated;

do $operator_types$
begin
  if not exists (
    select 1
    from pg_type type_row
    join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'recora_operator'
      and type_row.typname = 'operator_status'
  ) then
    create type recora_operator.operator_status as enum (
      'active',
      'suspended',
      'revoked'
    );
  end if;

  if not exists (
    select 1
    from pg_type type_row
    join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'recora_audit'
      and type_row.typname = 'operator_audit_outcome'
  ) then
    create type recora_audit.operator_audit_outcome as enum (
      'success',
      'denied',
      'failed'
    );
  end if;
end;
$operator_types$;

create table if not exists recora_operator.operator_identities (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  status recora_operator.operator_status not null default 'active',
  display_label text,
  status_reason_code text,
  created_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  constraint operator_identities_display_label_not_blank check (
    display_label is null or btrim(display_label) <> ''
  ),
  constraint operator_identities_status_reason_not_blank check (
    status_reason_code is null or btrim(status_reason_code) <> ''
  )
);

comment on table recora_operator.operator_identities is
  'Verified human operator identities linked only to auth.users.id. No email, mutable JWT metadata, service role, or fixed local actor is an authorization source.';
comment on column recora_operator.operator_identities.display_label is
  'Optional non-sensitive operational label. Do not store email addresses, tokens, credentials, or personal profile data.';

create table if not exists recora_operator.operator_action_grants (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references recora_operator.operator_identities(id) on delete restrict,
  permission text not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_reason_code text,
  constraint operator_action_grants_permission_format check (
    permission ~ '^[a-z][a-z0-9_.:-]{2,127}$'
  ),
  constraint operator_action_grants_project_requires_organization check (
    project_id is null or organization_id is not null
  ),
  constraint operator_action_grants_project_scope_fkey
    foreign key (project_id, organization_id)
    references public.projects(id, organization_id)
    on delete restrict,
  constraint operator_action_grants_revocation_reason_not_blank check (
    revoked_reason_code is null or btrim(revoked_reason_code) <> ''
  )
);

comment on table recora_operator.operator_action_grants is
  'Scoped action permissions. A NULL organization/project is a deliberately provisioned broader scope, not caller-selected tenant context.';

drop index if exists recora_operator.operator_action_grants_effective_scope_unique;
create unique index operator_action_grants_effective_scope_unique
on recora_operator.operator_action_grants (
  operator_id,
  permission,
  coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
) where revoked_at is null;

create index if not exists operator_action_grants_lookup_idx
on recora_operator.operator_action_grants (
  operator_id,
  permission,
  organization_id,
  project_id
)
where revoked_at is null;

create or replace function recora_audit.is_safe_audit_reason(
  payload text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if payload is null or btrim(payload) = '' or octet_length(payload) > 2048 then
    return false;
  end if;

  return payload !~* '(postgres(?:ql)?://|-----begin [a-z ]*private key-----|(^|[^a-z0-9])sk-[a-z0-9_-]{12,}([^a-z0-9]|$)|(^|[^a-z0-9])ghp_[a-z0-9]{16,}([^a-z0-9]|$)|(^|[^a-z0-9])github_pat_[a-z0-9_]{16,}([^a-z0-9]|$)|(^|[^a-z0-9])eyj[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}([^a-z0-9]|$)|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(^|[^0-9])\+?[0-9][0-9 .()\-]{6,}[0-9]([^0-9]|$)|(^|[^a-z0-9])(cookie|session|authorization|auth[_ -]?claims?|jwt|access[_ -]?token|refresh[_ -]?token|raw[_ -]?(request|response)|provider[_ -]?payload|database[_ -]?url|private[_ -]?key)([^a-z0-9]|$))';
end;
$$;

create or replace function recora_audit.is_safe_audit_summary_value(
  payload jsonb,
  depth integer default 0
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  entry_key text;
  entry_value jsonb;
  scalar_value text;
begin
  if payload is null or depth > 5 or octet_length(payload::text) > 16384 then
    return false;
  end if;

  if jsonb_typeof(payload) = 'object' then
    if (select count(*) from jsonb_each(payload)) > 32 then
      return false;
    end if;

    for entry_key, entry_value in
      select key, value from jsonb_each(payload)
    loop
      if octet_length(entry_key) > 64
        or entry_key !~ '^[a-z][a-z0-9_.:-]{0,63}$'
        or lower(entry_key) ~ '(^|[_.:-])(secret|token|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|request|response|provider|payload|database|private|api)([_.:-]|$)'
        or not recora_audit.is_safe_audit_summary_value(entry_value, depth + 1) then
        return false;
      end if;
    end loop;
    return true;
  end if;

  if jsonb_typeof(payload) = 'array' then
    if jsonb_array_length(payload) > 64 then
      return false;
    end if;

    for entry_value in select value from jsonb_array_elements(payload)
    loop
      if not recora_audit.is_safe_audit_summary_value(entry_value, depth + 1) then
        return false;
      end if;
    end loop;
    return true;
  end if;

  if jsonb_typeof(payload) = 'string' then
    scalar_value := payload #>> '{}';
    return octet_length(scalar_value) <= 512
      and recora_audit.is_safe_audit_reason(scalar_value);
  end if;

  return jsonb_typeof(payload) in ('null', 'boolean', 'number');
end;
$$;

create or replace function recora_audit.is_safe_audit_summary(
  payload jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select recora_audit.is_safe_audit_summary_value(payload, 0);
$$;

comment on function recora_audit.is_safe_audit_reason(text) is
  'Rejects raw PII, session/auth material, request/response/provider payloads, database URLs, private keys, and representative token/JWT forms. Reasons are short opaque explanations, not raw evidence.';
comment on function recora_audit.is_safe_audit_summary(jsonb) is
  'Allowlist-shaped recursive audit summary contract: bounded object keys, depth, array length, scalar length, and safe opaque values only. Never store raw request, response, session, provider, PII, or credential material.';

create table if not exists recora_audit.operator_events (
  id uuid primary key default gen_random_uuid(),
  actor_operator_id uuid references recora_operator.operator_identities(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  permission_used text,
  reason text,
  before_summary jsonb not null default '{}'::jsonb,
  after_summary jsonb not null default '{}'::jsonb,
  request_id uuid not null,
  correlation_id uuid not null,
  outcome recora_audit.operator_audit_outcome not null,
  failure_reason_code text,
  occurred_at timestamptz not null default now(),
  constraint operator_events_action_format check (
    action ~ '^[a-z][a-z0-9_.:-]{2,127}$'
  ),
  constraint operator_events_target_type_format check (
    target_type ~ '^[a-z][a-z0-9_.:-]{2,127}$'
  ),
  constraint operator_events_permission_format check (
    permission_used is null or permission_used ~ '^[a-z][a-z0-9_.:-]{2,127}$'
  ),
  constraint operator_events_project_requires_organization check (
    project_id is null or organization_id is not null
  ),
  constraint operator_events_project_scope_fkey
    foreign key (project_id, organization_id)
    references public.projects(id, organization_id)
    on delete restrict,
  constraint operator_events_reason_not_blank check (
    reason is null or btrim(reason) <> ''
  ),
  constraint operator_events_reason_safe check (
    reason is null or recora_audit.is_safe_audit_reason(reason)
  ),
  constraint operator_events_outcome_failure_reason check (
    (outcome = 'success' and failure_reason_code is null)
    or (outcome in ('denied', 'failed') and failure_reason_code is not null and btrim(failure_reason_code) <> '')
  ),
  constraint operator_events_before_summary_safe check (
    recora_audit.is_safe_audit_summary(before_summary)
  ),
  constraint operator_events_after_summary_safe check (
    recora_audit.is_safe_audit_summary(after_summary)
  )
);

comment on table recora_audit.operator_events is
  'Append-only operator authorization and command audit evidence. A denied event may have no operator actor only when identity verification itself failed; it never records service_role as an actor.';

create table if not exists recora_operator.operator_command_receipts (
  id uuid primary key default gen_random_uuid(),
  audit_event_id uuid not null references recora_audit.operator_events(id) on delete restrict,
  operator_id uuid not null references recora_operator.operator_identities(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  request_id uuid not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  constraint operator_command_receipts_project_scope_fkey
    foreign key (project_id, organization_id)
    references public.projects(id, organization_id)
    on delete restrict,
  constraint operator_command_receipts_action_format check (
    action ~ '^[a-z][a-z0-9_.:-]{2,127}$'
  ),
  constraint operator_command_receipts_target_type_format check (
    target_type ~ '^[a-z][a-z0-9_.:-]{2,127}$'
  )
);

comment on table recora_operator.operator_command_receipts is
  'Internal immutable receipt created atomically with the success audit event by the explicit foundation command. Future business commands must create their own business change and audit event in the same database transaction.';

create unique index if not exists operator_command_receipts_request_unique
on recora_operator.operator_command_receipts (request_id, action, target_type, target_id);

create index if not exists operator_events_actor_time_idx
on recora_audit.operator_events (actor_operator_id, occurred_at desc)
where actor_operator_id is not null;
create index if not exists operator_events_tenant_time_idx
on recora_audit.operator_events (organization_id, project_id, occurred_at desc)
where organization_id is not null;
create index if not exists operator_events_target_time_idx
on recora_audit.operator_events (target_type, target_id, occurred_at desc);
create index if not exists operator_events_correlation_idx
on recora_audit.operator_events (correlation_id, occurred_at desc);

alter table recora_operator.operator_identities enable row level security;
alter table recora_operator.operator_action_grants enable row level security;
alter table recora_operator.operator_command_receipts enable row level security;
alter table recora_audit.operator_events enable row level security;

revoke all on all tables in schema recora_operator from public, anon, authenticated;
revoke all on all tables in schema recora_audit from public, anon, authenticated;
revoke all on all sequences in schema recora_operator from public, anon, authenticated;
revoke all on all sequences in schema recora_audit from public, anon, authenticated;

create or replace function recora_audit.prevent_operator_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'operator audit events are append-only; record a corrective event instead';
end;
$$;

create or replace function recora_operator.prevent_command_receipt_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'operator command receipts are immutable';
end;
$$;

drop trigger if exists operator_events_prevent_update_delete on recora_audit.operator_events;
create trigger operator_events_prevent_update_delete
before update or delete on recora_audit.operator_events
for each row execute function recora_audit.prevent_operator_event_mutation();

drop trigger if exists operator_command_receipts_prevent_update_delete on recora_operator.operator_command_receipts;
create trigger operator_command_receipts_prevent_update_delete
before update or delete on recora_operator.operator_command_receipts
for each row execute function recora_operator.prevent_command_receipt_mutation();

create or replace function recora_operator.resolve_command_authorization(
  p_auth_user_id uuid,
  p_permission text,
  p_organization_id uuid,
  p_project_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text
)
returns table (
  authorized boolean,
  operator_id uuid,
  failure_reason_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_operator_id uuid;
  resolved_status recora_operator.operator_status;
begin
  if p_auth_user_id is null then
    return query select false, null::uuid, 'operator_identity_required'::text;
    return;
  end if;

  select identity_row.id, identity_row.status
  into resolved_operator_id, resolved_status
  from recora_operator.operator_identities identity_row
  where identity_row.auth_user_id = p_auth_user_id;

  if resolved_operator_id is null then
    return query select false, null::uuid, 'operator_not_registered'::text;
    return;
  end if;

  if resolved_status <> 'active'::recora_operator.operator_status then
    return query select false, resolved_operator_id, 'operator_not_active'::text;
    return;
  end if;

  if p_permission is null or p_permission !~ '^[a-z][a-z0-9_.:-]{2,127}$' then
    return query select false, resolved_operator_id, 'permission_invalid'::text;
    return;
  end if;

  if p_action is null or p_action !~ '^[a-z][a-z0-9_.:-]{2,127}$' then
    return query select false, resolved_operator_id, 'action_invalid'::text;
    return;
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    return query select false, resolved_operator_id, 'reason_required'::text;
    return;
  end if;

  if p_organization_id is null then
    return query select false, resolved_operator_id, 'tenant_scope_required'::text;
    return;
  end if;

  if not exists (
    select 1
    from public.organizations organization_row
    where organization_row.id = p_organization_id
  ) then
    return query select false, resolved_operator_id, 'target_organization_not_found'::text;
    return;
  end if;

  if p_target_type = 'organization' then
    if p_project_id is not null or p_target_id is distinct from p_organization_id then
      return query select false, resolved_operator_id, 'target_scope_mismatch'::text;
      return;
    end if;
  elsif p_target_type = 'project' then
    if p_project_id is null or p_target_id is distinct from p_project_id then
      return query select false, resolved_operator_id, 'target_scope_mismatch'::text;
      return;
    end if;

    if not exists (
      select 1
      from public.projects project_row
      where project_row.id = p_project_id
    ) then
      return query select false, resolved_operator_id, 'target_project_not_found'::text;
      return;
    end if;

    if not exists (
      select 1
      from public.projects project_row
      where project_row.id = p_project_id
        and project_row.organization_id = p_organization_id
    ) then
      return query select false, resolved_operator_id, 'target_scope_mismatch'::text;
      return;
    end if;
  else
    return query select false, resolved_operator_id, 'target_type_not_supported'::text;
    return;
  end if;

  if not recora_audit.is_safe_audit_reason(p_reason) then
    if p_reason is null or btrim(p_reason) = '' then
      return query select false, resolved_operator_id, 'reason_required'::text;
    else
      return query select false, resolved_operator_id, 'reason_unsafe'::text;
    end if;
    return;
  end if;

  if not exists (
    select 1
    from recora_operator.operator_action_grants grant_row
    where grant_row.operator_id = resolved_operator_id
      and grant_row.permission = p_permission
      and grant_row.revoked_at is null
      and (grant_row.organization_id is null or grant_row.organization_id = p_organization_id)
      and (grant_row.project_id is null or grant_row.project_id = p_project_id)
  ) then
    return query select false, resolved_operator_id, 'permission_denied'::text;
    return;
  end if;

  return query select true, resolved_operator_id, null::text;
end;
$$;

comment on function recora_operator.resolve_command_authorization(uuid, text, uuid, uuid, text, text, uuid, text) is
  'Private authorization primitive. It verifies registered active operator status, scoped action grant, tenant/project target ownership, and mandatory reason without trusting a caller-selected tenant alone.';

create or replace function public.recora_operator_execute_authorized_command_receipt(
  p_auth_user_id uuid,
  p_permission text,
  p_organization_id uuid,
  p_project_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_before_summary jsonb default '{}'::jsonb,
  p_after_summary jsonb default '{}'::jsonb
)
returns table (
  audit_event_id uuid,
  outcome recora_audit.operator_audit_outcome,
  failure_reason_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authorization_result record;
  created_audit_event_id uuid;
  audit_organization_id uuid;
  audit_project_id uuid;
  effective_authorized boolean;
  effective_operator_id uuid;
  effective_failure_reason text;
  safe_reason text;
begin
  if p_request_id is null or p_correlation_id is null then
    raise exception 'request_id and correlation_id are required';
  end if;

  safe_reason := case
    when recora_audit.is_safe_audit_reason(p_reason) then nullif(btrim(p_reason), '')
    else null
  end;

  select *
  into authorization_result
  from recora_operator.resolve_command_authorization(
    p_auth_user_id,
    p_permission,
    p_organization_id,
    p_project_id,
    p_action,
    p_target_type,
    p_target_id,
    p_reason
  );

  effective_authorized := authorization_result.authorized;
  effective_operator_id := authorization_result.operator_id;
  effective_failure_reason := authorization_result.failure_reason_code;

  if effective_authorized
    and (
      not recora_audit.is_safe_audit_summary(p_before_summary)
      or not recora_audit.is_safe_audit_summary(p_after_summary)
    ) then
    effective_authorized := false;
    effective_failure_reason := 'summary_unsafe';
  end if;

  select organization_row.id
  into audit_organization_id
  from public.organizations organization_row
  where organization_row.id = p_organization_id;

  select project_row.id
  into audit_project_id
  from public.projects project_row
  where project_row.id = p_project_id
    and project_row.organization_id = p_organization_id;

  if not effective_authorized then
    insert into recora_audit.operator_events (
      actor_operator_id,
      organization_id,
      project_id,
      action,
      target_type,
      target_id,
      permission_used,
      reason,
      before_summary,
      after_summary,
      request_id,
      correlation_id,
      outcome,
      failure_reason_code
    ) values (
      effective_operator_id,
      audit_organization_id,
      audit_project_id,
      case when p_action ~ '^[a-z][a-z0-9_.:-]{2,127}$' then p_action else 'operator.command.invalid' end,
      case when p_target_type ~ '^[a-z][a-z0-9_.:-]{2,127}$' then p_target_type else 'operator.target.invalid' end,
      coalesce(p_target_id, p_organization_id, gen_random_uuid()),
      case when p_permission ~ '^[a-z][a-z0-9_.:-]{2,127}$' then p_permission else null end,
      safe_reason,
      '{}'::jsonb,
      '{}'::jsonb,
      p_request_id,
      p_correlation_id,
      'denied'::recora_audit.operator_audit_outcome,
      coalesce(effective_failure_reason, 'authorization_denied')
    ) returning id into created_audit_event_id;

    return query select created_audit_event_id, 'denied'::recora_audit.operator_audit_outcome, coalesce(effective_failure_reason, 'authorization_denied');
    return;
  end if;

  begin
    insert into recora_audit.operator_events (
      actor_operator_id,
      organization_id,
      project_id,
      action,
      target_type,
      target_id,
      permission_used,
      reason,
      before_summary,
      after_summary,
      request_id,
      correlation_id,
      outcome,
      failure_reason_code
    ) values (
      effective_operator_id,
      p_organization_id,
      p_project_id,
      p_action,
      p_target_type,
      p_target_id,
      p_permission,
      safe_reason,
      p_before_summary,
      p_after_summary,
      p_request_id,
      p_correlation_id,
      'success'::recora_audit.operator_audit_outcome,
      null
    ) returning id into created_audit_event_id;

    insert into recora_operator.operator_command_receipts (
      audit_event_id,
      operator_id,
      organization_id,
      project_id,
      action,
      target_type,
      target_id,
      request_id,
      correlation_id
    ) values (
      created_audit_event_id,
      effective_operator_id,
      p_organization_id,
      p_project_id,
      p_action,
      p_target_type,
      p_target_id,
      p_request_id,
      p_correlation_id
    );

    return query select created_audit_event_id, 'success'::recora_audit.operator_audit_outcome, null::text;
    return;
  exception
    when others then
      insert into recora_audit.operator_events (
        actor_operator_id,
        organization_id,
        project_id,
        action,
        target_type,
        target_id,
        permission_used,
        reason,
        before_summary,
        after_summary,
        request_id,
        correlation_id,
        outcome,
        failure_reason_code
      ) values (
        effective_operator_id,
        audit_organization_id,
        audit_project_id,
        case when p_action ~ '^[a-z][a-z0-9_.:-]{2,127}$' then p_action else 'operator.command.invalid' end,
        case when p_target_type ~ '^[a-z][a-z0-9_.:-]{2,127}$' then p_target_type else 'operator.target.invalid' end,
        coalesce(p_target_id, p_organization_id, gen_random_uuid()),
        case when p_permission ~ '^[a-z][a-z0-9_.:-]{2,127}$' then p_permission else null end,
        safe_reason,
        '{"status":"failed"}'::jsonb,
        '{"receipt":"rolled_back"}'::jsonb,
        p_request_id,
        p_correlation_id,
        'failed'::recora_audit.operator_audit_outcome,
        'command_execution_failed'
      ) returning id into created_audit_event_id;

      return query select created_audit_event_id, 'failed'::recora_audit.operator_audit_outcome, 'command_execution_failed'::text;
      return;
  end;
end;
$$;

comment on function public.recora_operator_execute_authorized_command_receipt(uuid, text, uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb, jsonb) is
  'Service-role-only explicit operator foundation command. A server-only caller supplies only an auth.getUser()-verified user id. It emits success, denied, or failed audit evidence and atomically rolls back its immutable command receipt on failure. Future business mutations must use their own explicit command RPC and write their business mutation plus audit event in the same transaction.';

revoke all on function recora_operator.resolve_command_authorization(uuid, text, uuid, uuid, text, text, uuid, text)
from public, anon, authenticated;
revoke all on function public.recora_operator_execute_authorized_command_receipt(uuid, text, uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.recora_operator_execute_authorized_command_receipt(uuid, text, uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb, jsonb)
to service_role;