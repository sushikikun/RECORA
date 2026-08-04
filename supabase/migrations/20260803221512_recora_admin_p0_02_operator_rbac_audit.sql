-- Recora Admin P0 / M02 operator RBAC and audit convergence.
--
-- M02 adds only the private authorization and audit structures needed to close
-- human command evidence. Fixed role/capability catalog rows belong to M03.

set search_path = public, extensions;

do $admin_p0_m02_inventory$
declare
  existing_relation_count integer;
begin
  if to_regclass('recora_private.admin_command_receipts') is null
    or to_regclass('recora_operator.operator_identities') is null
    or to_regclass('recora_audit.operator_events') is null then
    raise exception 'Recora Admin P0 M02 failed: required M01 and operator foundations are missing';
  end if;

  if not exists (
    select 1 from recora_private.admin_p0_schema_versions
    where schema_version = 'recora_admin_p0_design_v1_3'
      and canonical_manifest_sha256 = 'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a'
      and repository_baseline_commit = '2c2a6fba70b75e858abc71a7447840bf32f3507d'
      and migration_set_digest = 'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a'
  ) then
    raise exception 'Recora Admin P0 M02 failed: approved M00 schema pin is missing';
  end if;

  select count(*) into existing_relation_count
  from (values
    (to_regclass('recora_operator.admin_accounts')),
    (to_regclass('recora_operator.admin_identity_security_projections')),
    (to_regclass('recora_operator.admin_roles')),
    (to_regclass('recora_operator.admin_capabilities')),
    (to_regclass('recora_operator.admin_role_capabilities')),
    (to_regclass('recora_operator.admin_role_assignments')),
    (to_regclass('recora_operator.admin_scope_assignments')),
    (to_regclass('recora_audit.operator_event_scopes'))
  ) relation_inventory(relation_oid)
  where relation_oid is not null;

  if existing_relation_count not in (0, 8) then
    raise exception 'Recora Admin P0 M02 failed: partial relation inventory detected (% of 8)', existing_relation_count;
  end if;
end;
$admin_p0_m02_inventory$;

create table if not exists recora_operator.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text generated always as (lower(btrim(email))) stored,
  display_name text not null,
  status text not null default 'invited',
  operator_identity_id uuid unique references recora_operator.operator_identities(id) on delete restrict,
  invited_at timestamptz not null default now(),
  activated_at timestamptz,
  suspended_at timestamptz,
  deactivated_at timestamptz,
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_accounts_email_check check (btrim(email) <> ''),
  constraint admin_accounts_name_check check (btrim(display_name) <> ''),
  constraint admin_accounts_status_check check (status in ('invited', 'active', 'suspended', 'deactivated')),
  constraint admin_accounts_version_check check (row_version > 0),
  constraint admin_accounts_time_shape_check check (
    (status = 'invited' and activated_at is null and suspended_at is null and deactivated_at is null)
    or (status = 'active' and activated_at is not null and suspended_at is null and deactivated_at is null)
    or (status = 'suspended' and suspended_at is not null and deactivated_at is null)
    or (status = 'deactivated' and deactivated_at is not null)
  )
);

create unique index if not exists admin_accounts_live_email_unique
on recora_operator.admin_accounts (normalized_email)
where status <> 'deactivated';

create table if not exists recora_operator.admin_identity_security_projections (
  admin_account_id uuid primary key references recora_operator.admin_accounts(id) on delete restrict,
  mfa_state text not null default 'unknown',
  observed_at timestamptz not null,
  source_version text not null,
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_identity_mfa_state_check check (mfa_state in ('unknown', 'not_enrolled', 'enrolled')),
  constraint admin_identity_source_check check (btrim(source_version) <> ''),
  constraint admin_identity_version_check check (row_version > 0)
);

create table if not exists recora_operator.admin_roles (
  id uuid primary key default gen_random_uuid(),
  role_code text not null unique,
  display_name text not null,
  description text not null,
  is_system_defined boolean not null default true,
  is_editable boolean not null default false,
  created_at timestamptz not null default now(),
  constraint admin_roles_code_check check (role_code ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint admin_roles_name_check check (btrim(display_name) <> ''),
  constraint admin_roles_description_check check (btrim(description) <> ''),
  constraint admin_roles_fixed_check check (is_system_defined is true and is_editable is false)
);

create table if not exists recora_operator.admin_capabilities (
  id uuid primary key default gen_random_uuid(),
  capability_code text not null unique,
  domain_code text not null,
  sensitivity text not null,
  created_at timestamptz not null default now(),
  constraint admin_capabilities_code_check check (capability_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'),
  constraint admin_capabilities_domain_check check (domain_code ~ '^[a-z][a-z0-9_.:-]{1,63}$'),
  constraint admin_capabilities_risk_check check (sensitivity in ('W1', 'W2', 'W3'))
);

create table if not exists recora_operator.admin_role_capabilities (
  role_id uuid not null references recora_operator.admin_roles(id) on delete restrict,
  capability_id uuid not null references recora_operator.admin_capabilities(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (role_id, capability_id)
);

create table if not exists recora_operator.admin_role_assignments (
  id uuid primary key default gen_random_uuid(),
  admin_account_id uuid not null references recora_operator.admin_accounts(id) on delete restrict,
  role_id uuid not null references recora_operator.admin_roles(id) on delete restrict,
  status text not null default 'active',
  assigned_by_admin_account_id uuid not null references recora_operator.admin_accounts(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason_code text,
  row_version bigint not null default 1,
  constraint admin_role_assignments_status_check check (status in ('active', 'revoked', 'expired')),
  constraint admin_role_assignments_version_check check (row_version > 0),
  constraint admin_role_assignments_reason_check check (
    revoked_reason_code is null or revoked_reason_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_role_assignments_state_check check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null and revoked_reason_code is not null)
    or (status = 'expired' and revoked_at is null and expires_at is not null)
  )
);

create unique index if not exists admin_role_assignments_active_unique
on recora_operator.admin_role_assignments (admin_account_id, role_id)
where status = 'active';

create table if not exists recora_operator.admin_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  role_assignment_id uuid not null references recora_operator.admin_role_assignments(id) on delete restrict,
  scope_type text not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  status text not null default 'active',
  assigned_by_admin_account_id uuid not null references recora_operator.admin_accounts(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason_code text,
  row_version bigint not null default 1,
  constraint admin_scope_assignments_type_check check (scope_type in ('global', 'customer', 'project')),
  constraint admin_scope_assignments_status_check check (status in ('active', 'revoked', 'expired')),
  constraint admin_scope_assignments_version_check check (row_version > 0),
  constraint admin_scope_assignments_reason_check check (
    revoked_reason_code is null or revoked_reason_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  constraint admin_scope_assignments_state_check check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null and revoked_reason_code is not null)
    or (status = 'expired' and revoked_at is null and expires_at is not null)
  ),
  constraint admin_scope_assignments_shape_check check (
    (scope_type = 'global' and organization_id is null and project_id is null)
    or (scope_type = 'customer' and organization_id is not null and project_id is null)
    or (scope_type = 'project' and organization_id is not null and project_id is not null)
  ),
  constraint admin_scope_assignments_project_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict
);

create unique index if not exists admin_scope_assignments_active_unique
on recora_operator.admin_scope_assignments (
  role_assignment_id,
  scope_type,
  coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
where status = 'active';

alter table recora_audit.operator_events
  add column if not exists actor_type text,
  add column if not exists actor_system_component_code text,
  add column if not exists risk_class text,
  add column if not exists operation_outcome text,
  add column if not exists idempotency_key text,
  add column if not exists corrects_event_id uuid,
  add column if not exists admin_account_id uuid,
  add column if not exists capability_code text,
  add column if not exists role_assignment_id uuid,
  add column if not exists scope_assignment_id uuid,
  add column if not exists auth_assurance text,
  add column if not exists step_up_verified timestamptz;

alter table recora_audit.operator_events
  drop constraint if exists operator_events_admin_account_fkey,
  add constraint operator_events_admin_account_fkey foreign key (admin_account_id)
    references recora_operator.admin_accounts(id) on delete restrict,
  drop constraint if exists operator_events_role_assignment_fkey,
  add constraint operator_events_role_assignment_fkey foreign key (role_assignment_id)
    references recora_operator.admin_role_assignments(id) on delete restrict,
  drop constraint if exists operator_events_scope_assignment_fkey,
  add constraint operator_events_scope_assignment_fkey foreign key (scope_assignment_id)
    references recora_operator.admin_scope_assignments(id) on delete restrict,
  drop constraint if exists operator_events_corrects_event_fkey,
  add constraint operator_events_corrects_event_fkey foreign key (corrects_event_id)
    references recora_audit.operator_events(id) on delete restrict deferrable initially deferred,
  drop constraint if exists operator_events_actor_shape_check,
  add constraint operator_events_actor_shape_check check (
    (actor_type is null
      and actor_system_component_code is null
      and admin_account_id is null
      and capability_code is null
      and role_assignment_id is null
      and scope_assignment_id is null
      and auth_assurance is null
      and step_up_verified is null)
    or (actor_type = 'admin' and admin_account_id is not null and actor_system_component_code is null)
    or (actor_type = 'system' and admin_account_id is null and actor_system_component_code is not null
      and capability_code is null and role_assignment_id is null and scope_assignment_id is null
      and auth_assurance is null and step_up_verified is null)
  ),
  drop constraint if exists operator_events_risk_class_check,
  add constraint operator_events_risk_class_check check (risk_class is null or risk_class in ('W1', 'W2', 'W3')),
  drop constraint if exists operator_events_component_check,
  add constraint operator_events_component_check check (
    actor_system_component_code is null or actor_system_component_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  drop constraint if exists operator_events_operation_check,
  add constraint operator_events_operation_check check (
    operation_outcome is null or operation_outcome ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  drop constraint if exists operator_events_idempotency_check,
  add constraint operator_events_idempotency_check check (
    idempotency_key is null or idempotency_key ~ '^[a-zA-Z0-9][a-zA-Z0-9_.:-]{2,191}$'
  ),
  drop constraint if exists operator_events_capability_check,
  add constraint operator_events_capability_check check (
    capability_code is null or capability_code ~ '^[a-z][a-z0-9_.:-]{1,127}$'
  ),
  drop constraint if exists operator_events_assurance_check,
  add constraint operator_events_assurance_check check (
    auth_assurance is null or auth_assurance in ('mfa', 'step_up')
  );

create index if not exists operator_events_admin_time_idx
on recora_audit.operator_events (admin_account_id, occurred_at desc)
where admin_account_id is not null;

create index if not exists operator_events_correction_idx
on recora_audit.operator_events (corrects_event_id)
where corrects_event_id is not null;

create table if not exists recora_audit.operator_event_scopes (
  audit_event_id uuid not null references recora_audit.operator_events(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  scope_type text not null,
  scope_key text generated always as (
    case
      when scope_type = 'global' then 'global'
      when scope_type = 'customer' then 'customer:' || organization_id::text
      when scope_type = 'project' then 'project:' || project_id::text
      else null
    end
  ) stored,
  created_at timestamptz not null default now(),
  primary key (audit_event_id, scope_key),
  constraint operator_event_scopes_type_check check (scope_type in ('global', 'customer', 'project')),
  constraint operator_event_scopes_shape_check check (
    (scope_type = 'global' and organization_id is null and project_id is null)
    or (scope_type = 'customer' and organization_id is not null and project_id is null)
    or (scope_type = 'project' and organization_id is not null and project_id is not null)
  ),
  constraint operator_event_scopes_project_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict
);

alter table recora_private.admin_command_receipts
  drop constraint if exists admin_command_receipts_admin_account_fkey,
  add constraint admin_command_receipts_admin_account_fkey foreign key (admin_account_id)
    references recora_operator.admin_accounts(id) on delete restrict;

create or replace function recora_operator.admin_p0_is_effective_platform_admin(p_admin_account_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from recora_operator.admin_accounts account_row
    join recora_operator.admin_identity_security_projections projection_row
      on projection_row.admin_account_id = account_row.id and projection_row.mfa_state = 'enrolled'
    join recora_operator.operator_identities identity_row
      on identity_row.id = account_row.operator_identity_id
     and identity_row.status = 'active'::recora_operator.operator_status
    join recora_operator.admin_role_assignments assignment_row
      on assignment_row.admin_account_id = account_row.id
     and assignment_row.status = 'active'
     and (assignment_row.expires_at is null or assignment_row.expires_at > now())
    join recora_operator.admin_roles role_row
      on role_row.id = assignment_row.role_id and role_row.role_code = 'platform_admin'
    join recora_operator.admin_scope_assignments scope_row
      on scope_row.role_assignment_id = assignment_row.id
     and scope_row.status = 'active'
     and (scope_row.expires_at is null or scope_row.expires_at > now())
     and scope_row.scope_type = 'global'
    where account_row.id = p_admin_account_id and account_row.status = 'active'
  );
$$;

create or replace function recora_operator.admin_p0_assert_last_platform_admin(
  p_excluded_account_id uuid,
  p_excluded_role_assignment_id uuid,
  p_excluded_scope_assignment_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from recora_operator.admin_accounts account_row
    join recora_operator.admin_identity_security_projections projection_row
      on projection_row.admin_account_id = account_row.id and projection_row.mfa_state = 'enrolled'
    join recora_operator.operator_identities identity_row
      on identity_row.id = account_row.operator_identity_id
     and identity_row.status = 'active'::recora_operator.operator_status
    join recora_operator.admin_role_assignments assignment_row
      on assignment_row.admin_account_id = account_row.id
     and assignment_row.status = 'active'
     and (assignment_row.expires_at is null or assignment_row.expires_at > now())
    join recora_operator.admin_roles role_row
      on role_row.id = assignment_row.role_id and role_row.role_code = 'platform_admin'
    join recora_operator.admin_scope_assignments scope_row
      on scope_row.role_assignment_id = assignment_row.id
     and scope_row.status = 'active'
     and (scope_row.expires_at is null or scope_row.expires_at > now())
     and scope_row.scope_type = 'global'
    where account_row.status = 'active'
      and account_row.id is distinct from p_excluded_account_id
      and assignment_row.id is distinct from p_excluded_role_assignment_id
      and scope_row.id is distinct from p_excluded_scope_assignment_id
  ) then
    raise exception 'LAST_PLATFORM_ADMIN_PROTECTED';
  end if;
end;
$$;

create or replace function recora_operator.admin_p0_assert_privilege_change(
  p_actor_admin_account_id uuid,
  p_subject_admin_account_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_actor_admin_account_id is null
    or p_subject_admin_account_id is null
    or p_actor_admin_account_id = p_subject_admin_account_id then
    raise exception 'SELF_PRIVILEGE_ESCALATION_FORBIDDEN';
  end if;

  if not recora_operator.admin_p0_is_effective_platform_admin(p_actor_admin_account_id) then
    raise exception 'effective platform admin is required for privilege changes';
  end if;
end;
$$;

create or replace function recora_operator.admin_p0_validate_admin_account()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  identity_status recora_operator.operator_status;
begin
  if tg_op = 'DELETE' then
    if recora_operator.admin_p0_is_effective_platform_admin(old.id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(old.id, null, null);
    end if;
    raise exception 'admin account records are retained; deactivate instead';
  end if;

  if new.status = 'active' then
    select status into identity_status from recora_operator.operator_identities
    where id = new.operator_identity_id;
    if not found or identity_status <> 'active'::recora_operator.operator_status then
      raise exception 'active admin accounts require an active operator identity';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'deactivated' then
      raise exception 'deactivated admin accounts are terminal';
    end if;
    if new.row_version <> old.row_version + 1 then
      raise exception 'admin account row_version must advance by one';
    end if;
    if old.status = 'active' and new.status <> 'active'
      and recora_operator.admin_p0_is_effective_platform_admin(old.id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(old.id, null, null);
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function recora_operator.admin_p0_validate_operator_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  affected_account_id uuid;
begin
  if tg_op = 'UPDATE'
    and old.status = 'active'::recora_operator.operator_status
    and new.status <> 'active'::recora_operator.operator_status then
    select id into affected_account_id
    from recora_operator.admin_accounts
    where operator_identity_id = old.id;
    if found and recora_operator.admin_p0_is_effective_platform_admin(affected_account_id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(affected_account_id, null, null);
    end if;
  end if;
  return new;
end;
$$;

create or replace function recora_operator.admin_p0_validate_identity_projection()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.mfa_state = 'enrolled'
      and recora_operator.admin_p0_is_effective_platform_admin(old.admin_account_id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(old.admin_account_id, null, null);
    end if;
    raise exception 'admin identity security projections are retained';
  end if;

  if tg_op = 'UPDATE' then
    if new.admin_account_id is distinct from old.admin_account_id then
      raise exception 'admin identity security projection owner is immutable';
    end if;
    if new.observed_at < old.observed_at then
      raise exception 'stale identity security projection cannot overwrite newer observation';
    end if;
    if new.row_version <> old.row_version + 1 then
      raise exception 'admin identity security projection row_version must advance by one';
    end if;
    if old.mfa_state = 'enrolled' and new.mfa_state <> 'enrolled'
      and recora_operator.admin_p0_is_effective_platform_admin(old.admin_account_id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(old.admin_account_id, null, null);
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function recora_operator.admin_p0_prevent_catalog_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'M02 role and capability catalog rows are immutable';
  end if;
  return new;
end;
$$;

create or replace function recora_operator.admin_p0_validate_role_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if recora_operator.admin_p0_is_effective_platform_admin(old.admin_account_id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(null, old.id, null);
    end if;
    raise exception 'admin role assignment history is retained';
  end if;

  if new.status = 'active' and new.expires_at is not null and new.expires_at <= now() then
    raise exception 'active role assignments cannot already be expired';
  end if;
  if new.status = 'expired' and new.expires_at > now() then
    raise exception 'expired role assignments require an elapsed expiry';
  end if;

  if tg_op = 'UPDATE' then
    if old.status in ('revoked', 'expired') then
      raise exception 'revoked or expired role assignments are terminal';
    end if;
    if new.admin_account_id is distinct from old.admin_account_id
      or new.role_id is distinct from old.role_id
      or new.assigned_by_admin_account_id is distinct from old.assigned_by_admin_account_id
      or new.assigned_at is distinct from old.assigned_at then
      raise exception 'role assignment identity is immutable';
    end if;
    if new.row_version <> old.row_version + 1 then
      raise exception 'admin role assignment row_version must advance by one';
    end if;
    if recora_operator.admin_p0_is_effective_platform_admin(old.admin_account_id)
      and (new.status <> 'active' or (new.expires_at is not null and new.expires_at <= now())) then
      perform recora_operator.admin_p0_assert_last_platform_admin(null, old.id, null);
    end if;
  end if;
  return new;
end;
$$;

create or replace function recora_operator.admin_p0_validate_scope_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  affected_account_id uuid;
  excluded_scope_id uuid;
begin
  if tg_op = 'DELETE' then
    select admin_account_id into affected_account_id
    from recora_operator.admin_role_assignments
    where id = old.role_assignment_id;
    if found and recora_operator.admin_p0_is_effective_platform_admin(affected_account_id) then
      perform recora_operator.admin_p0_assert_last_platform_admin(null, null, old.id);
    end if;
    raise exception 'admin scope assignment history is retained';
  end if;

  excluded_scope_id := case when tg_op = 'UPDATE' then old.id else null end;
  if new.status = 'active' and new.expires_at is not null and new.expires_at <= now() then
    raise exception 'active scope assignments cannot already be expired';
  end if;
  if new.status = 'expired' and new.expires_at > now() then
    raise exception 'expired scope assignments require an elapsed expiry';
  end if;

  if tg_op = 'UPDATE' then
    if old.status in ('revoked', 'expired') then
      raise exception 'revoked or expired scope assignments are terminal';
    end if;
    if new.role_assignment_id is distinct from old.role_assignment_id
      or new.scope_type is distinct from old.scope_type
      or new.organization_id is distinct from old.organization_id
      or new.project_id is distinct from old.project_id
      or new.assigned_by_admin_account_id is distinct from old.assigned_by_admin_account_id
      or new.assigned_at is distinct from old.assigned_at then
      raise exception 'scope assignment identity is immutable';
    end if;
    if new.row_version <> old.row_version + 1 then
      raise exception 'admin scope assignment row_version must advance by one';
    end if;
    select admin_account_id into affected_account_id
    from recora_operator.admin_role_assignments
    where id = old.role_assignment_id;
    if found and recora_operator.admin_p0_is_effective_platform_admin(affected_account_id)
      and (new.status <> 'active' or (new.expires_at is not null and new.expires_at <= now())) then
      perform recora_operator.admin_p0_assert_last_platform_admin(null, null, old.id);
    end if;
  end if;

  if new.status = 'active' then
    if new.scope_type = 'global' and exists (
      select 1 from recora_operator.admin_scope_assignments scope_row
      where scope_row.role_assignment_id = new.role_assignment_id
        and scope_row.status = 'active'
        and scope_row.id is distinct from excluded_scope_id
    ) then
      raise exception 'global scope cannot coexist with customer or project scope';
    end if;
    if new.scope_type = 'customer' and exists (
      select 1 from recora_operator.admin_scope_assignments scope_row
      where scope_row.role_assignment_id = new.role_assignment_id
        and scope_row.status = 'active'
        and scope_row.id is distinct from excluded_scope_id
        and (scope_row.scope_type = 'global'
          or (scope_row.scope_type = 'project' and scope_row.organization_id = new.organization_id))
    ) then
      raise exception 'customer scope is redundant with global or project scope';
    end if;
    if new.scope_type = 'project' and exists (
      select 1 from recora_operator.admin_scope_assignments scope_row
      where scope_row.role_assignment_id = new.role_assignment_id
        and scope_row.status = 'active'
        and scope_row.id is distinct from excluded_scope_id
        and (scope_row.scope_type = 'global'
          or (scope_row.scope_type = 'customer' and scope_row.organization_id = new.organization_id))
    ) then
      raise exception 'project scope is redundant with global or customer scope';
    end if;
  end if;
  return new;
end;
$$;

create or replace function recora_operator.admin_p0_assert_active_role_scopes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from recora_operator.admin_role_assignments assignment_row
    left join recora_operator.admin_scope_assignments scope_row
      on scope_row.role_assignment_id = assignment_row.id
     and scope_row.status = 'active'
     and (scope_row.expires_at is null or scope_row.expires_at > now())
    where assignment_row.status = 'active'
      and (assignment_row.expires_at is null or assignment_row.expires_at > now())
    group by assignment_row.id
    having count(scope_row.id) = 0
  ) then
    raise exception 'active role assignments require an active scope';
  end if;

  if exists (
    select 1
    from recora_operator.admin_role_assignments assignment_row
    join recora_operator.admin_roles role_row on role_row.id = assignment_row.role_id
    where assignment_row.status = 'active'
      and (assignment_row.expires_at is null or assignment_row.expires_at > now())
      and role_row.role_code in ('platform_admin', 'system_operator')
      and not exists (
        select 1 from recora_operator.admin_scope_assignments scope_row
        where scope_row.role_assignment_id = assignment_row.id
          and scope_row.status = 'active'
          and (scope_row.expires_at is null or scope_row.expires_at > now())
          and scope_row.scope_type = 'global'
      )
  ) then
    raise exception 'platform_admin and system_operator require global scope';
  end if;
  return null;
end;
$$;

create or replace function recora_audit.admin_p0_validate_operator_event_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.corrects_event_id is not null then
    if new.corrects_event_id = new.id then
      raise exception 'operator audit correction cannot self-reference';
    end if;
    if exists (
      with recursive correction_chain(id, corrects_event_id, path) as (
        select event_row.id, event_row.corrects_event_id, array[event_row.id]
        from recora_audit.operator_events event_row
        where event_row.id = new.corrects_event_id
        union all
        select event_row.id, event_row.corrects_event_id, correction_chain.path || event_row.id
        from recora_audit.operator_events event_row
        join correction_chain on event_row.id = correction_chain.corrects_event_id
        where not event_row.id = any(correction_chain.path)
      )
      select 1 from correction_chain
      where id = new.id or corrects_event_id = new.id
    ) then
      raise exception 'operator audit correction cycle is not allowed';
    end if;
  end if;
  return new;
end;
$$;

create or replace function recora_audit.prevent_operator_event_scope_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'operator event scopes are append-only';
end;
$$;

create or replace function recora_private.admin_p0_scope_covers_receipt(
  p_scope_assignment_id uuid,
  p_organization_id uuid,
  p_project_id uuid
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from recora_operator.admin_scope_assignments scope_row
    where scope_row.id = p_scope_assignment_id
      and scope_row.status = 'active'
      and (scope_row.expires_at is null or scope_row.expires_at > now())
      and (
        scope_row.scope_type = 'global'
        or (scope_row.scope_type = 'customer' and scope_row.organization_id = p_organization_id)
        or (scope_row.scope_type = 'project'
          and scope_row.organization_id = p_organization_id
          and scope_row.project_id = p_project_id)
      )
      and (p_organization_id is not null or scope_row.scope_type = 'global')
  );
$$;

create or replace function recora_private.admin_p0_validate_command_receipt_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  audit_row recora_audit.operator_events%rowtype;
  operator_receipt_row recora_operator.operator_command_receipts%rowtype;
  account_row recora_operator.admin_accounts%rowtype;
  identity_status recora_operator.operator_status;
  assignment_row recora_operator.admin_role_assignments%rowtype;
  scope_row recora_operator.admin_scope_assignments%rowtype;
  expected_audit_outcome recora_audit.operator_audit_outcome;
begin
  if new.actor_type = 'admin' then
    if not exists (select 1 from recora_operator.admin_role_capabilities) then
      raise exception 'P0 admin command receipt insertion is disabled until M02 authorization convergence';
    end if;

    select * into account_row
    from recora_operator.admin_accounts
    where id = new.admin_account_id;
    if not found or account_row.status <> 'active' then
      raise exception 'admin command receipt requires an active admin account';
    end if;

    select status into identity_status
    from recora_operator.operator_identities
    where id = account_row.operator_identity_id;
    if not found or identity_status <> 'active'::recora_operator.operator_status then
      raise exception 'admin command receipt requires an active operator identity';
    end if;

    if not exists (
      select 1 from recora_operator.admin_identity_security_projections projection_row
      where projection_row.admin_account_id = account_row.id
        and projection_row.mfa_state = 'enrolled'
    ) then
      raise exception 'admin command receipt requires enrolled MFA';
    end if;
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
      or lower(audit_row.action) is distinct from lower(new.command_name)
      or audit_row.target_type is distinct from new.target_type
      or audit_row.target_id is distinct from new.target_id then
      raise exception 'P0 command receipt audit causal mismatch';
    end if;

    expected_audit_outcome := case
      when new.outcome in ('accepted', 'committed', 'reconciliation_required') then 'success'::recora_audit.operator_audit_outcome
      when new.outcome = 'denied' then 'denied'::recora_audit.operator_audit_outcome
      else 'failed'::recora_audit.operator_audit_outcome
    end;
    if audit_row.outcome is distinct from expected_audit_outcome then
      raise exception 'P0 command receipt audit outcome mismatch';
    end if;
  end if;

  if new.actor_type = 'admin' then
    if audit_row.actor_type is distinct from 'admin'
      or audit_row.admin_account_id is distinct from new.admin_account_id
      or audit_row.actor_operator_id is distinct from account_row.operator_identity_id
      or audit_row.actor_system_component_code is not null
      or audit_row.operation_outcome is distinct from new.outcome
      or audit_row.idempotency_key is distinct from new.idempotency_key
      or audit_row.risk_class is null
      or audit_row.capability_code is null
      or audit_row.role_assignment_id is null
      or audit_row.scope_assignment_id is null
      or audit_row.auth_assurance not in ('mfa', 'step_up') then
      raise exception 'admin command receipt audit authorization evidence mismatch';
    end if;

    if audit_row.risk_class = 'W3'
      and (audit_row.auth_assurance <> 'step_up'
        or audit_row.step_up_verified is null
        or audit_row.step_up_verified < now() - interval '15 minutes'
        or audit_row.step_up_verified > now() + interval '1 minute') then
      raise exception 'admin command receipt requires fresh W3 step-up evidence';
    end if;

    select * into assignment_row
    from recora_operator.admin_role_assignments
    where id = audit_row.role_assignment_id;
    select * into scope_row
    from recora_operator.admin_scope_assignments
    where id = audit_row.scope_assignment_id;

    if not found
      or assignment_row.admin_account_id is distinct from account_row.id
      or assignment_row.status <> 'active'
      or (assignment_row.expires_at is not null and assignment_row.expires_at <= now())
      or scope_row.role_assignment_id is distinct from assignment_row.id
      or scope_row.status <> 'active'
      or (scope_row.expires_at is not null and scope_row.expires_at <= now())
      or not recora_private.admin_p0_scope_covers_receipt(scope_row.id, new.organization_id, new.project_id) then
      raise exception 'admin command receipt role or scope is not effective';
    end if;

    if not exists (
      select 1
      from recora_operator.admin_role_capabilities map_row
      join recora_operator.admin_capabilities capability_row
        on capability_row.id = map_row.capability_id
      where map_row.role_id = assignment_row.role_id
        and capability_row.capability_code = audit_row.capability_code
    ) then
      raise exception 'admin command receipt capability is not granted by role assignment';
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
      or lower(operator_receipt_row.action) is distinct from lower(new.command_name)
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

drop trigger if exists admin_accounts_validate_mutation on recora_operator.admin_accounts;
create trigger admin_accounts_validate_mutation
before insert or update or delete on recora_operator.admin_accounts
for each row execute function recora_operator.admin_p0_validate_admin_account();

drop trigger if exists operator_identities_validate_m02 on recora_operator.operator_identities;
create trigger operator_identities_validate_m02
before update on recora_operator.operator_identities
for each row execute function recora_operator.admin_p0_validate_operator_identity();

drop trigger if exists admin_identity_validate_mutation on recora_operator.admin_identity_security_projections;
create trigger admin_identity_validate_mutation
before insert or update or delete on recora_operator.admin_identity_security_projections
for each row execute function recora_operator.admin_p0_validate_identity_projection();

drop trigger if exists admin_roles_prevent_mutation on recora_operator.admin_roles;
create trigger admin_roles_prevent_mutation
before insert or update or delete on recora_operator.admin_roles
for each row execute function recora_operator.admin_p0_prevent_catalog_mutation();

drop trigger if exists admin_capabilities_prevent_mutation on recora_operator.admin_capabilities;
create trigger admin_capabilities_prevent_mutation
before insert or update or delete on recora_operator.admin_capabilities
for each row execute function recora_operator.admin_p0_prevent_catalog_mutation();

drop trigger if exists admin_role_capabilities_prevent_mutation on recora_operator.admin_role_capabilities;
create trigger admin_role_capabilities_prevent_mutation
before insert or update or delete on recora_operator.admin_role_capabilities
for each row execute function recora_operator.admin_p0_prevent_catalog_mutation();

drop trigger if exists admin_role_assignments_validate_mutation on recora_operator.admin_role_assignments;
create trigger admin_role_assignments_validate_mutation
before insert or update or delete on recora_operator.admin_role_assignments
for each row execute function recora_operator.admin_p0_validate_role_assignment();

drop trigger if exists admin_scope_assignments_validate_mutation on recora_operator.admin_scope_assignments;
create trigger admin_scope_assignments_validate_mutation
before insert or update or delete on recora_operator.admin_scope_assignments
for each row execute function recora_operator.admin_p0_validate_scope_assignment();

drop trigger if exists admin_role_assignments_scope_check on recora_operator.admin_role_assignments;
create constraint trigger admin_role_assignments_scope_check
after insert or update or delete on recora_operator.admin_role_assignments
deferrable initially deferred
for each row execute function recora_operator.admin_p0_assert_active_role_scopes();

drop trigger if exists admin_scope_assignments_role_check on recora_operator.admin_scope_assignments;
create constraint trigger admin_scope_assignments_role_check
after insert or update or delete on recora_operator.admin_scope_assignments
deferrable initially deferred
for each row execute function recora_operator.admin_p0_assert_active_role_scopes();

drop trigger if exists operator_events_validate_m02_insert on recora_audit.operator_events;
create trigger operator_events_validate_m02_insert
before insert on recora_audit.operator_events
for each row execute function recora_audit.admin_p0_validate_operator_event_insert();

drop trigger if exists operator_event_scopes_append_only on recora_audit.operator_event_scopes;
create trigger operator_event_scopes_append_only
before update or delete on recora_audit.operator_event_scopes
for each row execute function recora_audit.prevent_operator_event_scope_mutation();

drop trigger if exists admin_command_receipts_validate_insert on recora_private.admin_command_receipts;
create trigger admin_command_receipts_validate_insert
before insert on recora_private.admin_command_receipts
for each row execute function recora_private.admin_p0_validate_command_receipt_insert();

alter table recora_operator.admin_accounts enable row level security;
alter table recora_operator.admin_identity_security_projections enable row level security;
alter table recora_operator.admin_roles enable row level security;
alter table recora_operator.admin_capabilities enable row level security;
alter table recora_operator.admin_role_capabilities enable row level security;
alter table recora_operator.admin_role_assignments enable row level security;
alter table recora_operator.admin_scope_assignments enable row level security;
alter table recora_audit.operator_events enable row level security;
alter table recora_audit.operator_event_scopes enable row level security;

revoke all on schema recora_operator from public, anon, authenticated, service_role;
revoke all on schema recora_audit from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_accounts from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_identity_security_projections from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_roles from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_capabilities from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_role_capabilities from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_role_assignments from public, anon, authenticated, service_role;
revoke all on table recora_operator.admin_scope_assignments from public, anon, authenticated, service_role;
revoke all on table recora_audit.operator_events from public, anon, authenticated, service_role;
revoke all on table recora_audit.operator_event_scopes from public, anon, authenticated, service_role;

revoke all on function recora_operator.admin_p0_is_effective_platform_admin(uuid)
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_assert_last_platform_admin(uuid, uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_assert_privilege_change(uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_validate_admin_account()
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_validate_operator_identity()
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_validate_identity_projection()
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_prevent_catalog_mutation()
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_validate_role_assignment()
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_validate_scope_assignment()
from public, anon, authenticated, service_role;
revoke all on function recora_operator.admin_p0_assert_active_role_scopes()
from public, anon, authenticated, service_role;
revoke all on function recora_audit.admin_p0_validate_operator_event_insert()
from public, anon, authenticated, service_role;
revoke all on function recora_audit.prevent_operator_event_scope_mutation()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_scope_covers_receipt(uuid, uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_validate_command_receipt_insert()
from public, anon, authenticated, service_role;

do $admin_p0_m02_verify$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'recora_operator.admin_accounts',
    'recora_operator.admin_identity_security_projections',
    'recora_operator.admin_roles',
    'recora_operator.admin_capabilities',
    'recora_operator.admin_role_capabilities',
    'recora_operator.admin_role_assignments',
    'recora_operator.admin_scope_assignments',
    'recora_audit.operator_event_scopes'
  ] loop
    if to_regclass(relation_name) is null then
      raise exception 'Recora Admin P0 M02 verification failed: relation % is missing', relation_name;
    end if;
    if not exists (
      select 1 from pg_class relation_row
      where relation_row.oid = to_regclass(relation_name)
        and relation_row.relrowsecurity is true
    ) then
      raise exception 'Recora Admin P0 M02 verification failed: RLS is missing for %', relation_name;
    end if;
    if has_table_privilege('anon', relation_name, 'SELECT')
      or has_table_privilege('authenticated', relation_name, 'SELECT')
      or has_table_privilege('service_role', relation_name, 'SELECT')
      or has_table_privilege('service_role', relation_name, 'INSERT')
      or has_table_privilege('service_role', relation_name, 'UPDATE')
      or has_table_privilege('service_role', relation_name, 'DELETE') then
      raise exception 'Recora Admin P0 M02 verification failed: protected role privilege remains on %', relation_name;
    end if;
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'recora_private.admin_command_receipts'::regclass
      and conname = 'admin_command_receipts_admin_account_fkey'
      and convalidated is true
  ) then
    raise exception 'Recora Admin P0 M02 verification failed: admin receipt account FK is missing';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname in ('recora_operator', 'recora_audit', 'recora_private')
      and function_row.proname like 'admin_p0_%'
      and function_row.prosecdef is true
  ) then
    raise exception 'Recora Admin P0 M02 verification failed: private helper uses elevated execution';
  end if;
end;
$admin_p0_m02_verify$;
