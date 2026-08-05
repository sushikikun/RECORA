-- Recora Admin P0 / M04 customer, project, and inquiry write model.
--
-- Boundary:
-- - Reuse public tenant roots and the approved P4-B membership lifecycle.
-- - Add private M04 state only; do not backfill legacy or public business rows.
-- - Keep inquiry body content out of audit and outbox projections.

set search_path = public, extensions;

-- This inventory must complete before any M04 persistent DDL.
do $admin_p0_m04_inventory$
declare
  m00_pin record;
  private_relation_count integer;
  public_extension_count integer;
  orphan_project_count bigint;
  cross_tenant_project_count bigint;
  duplicate_normalized_email_count bigint;
begin
  if to_regclass('recora_private.admin_p0_schema_versions') is null then
    raise exception 'Recora Admin P0 M04 failed: M00 schema contract is missing';
  end if;

  select *
  into m00_pin
  from recora_private.admin_p0_schema_versions
  where schema_version = 'recora_admin_p0_design_v1_3';

  if not found
    or m00_pin.canonical_package_id is distinct from 'RECORA-ADMIN-P0-CANONICAL'
    or m00_pin.canonical_version is distinct from '1.0'
    or m00_pin.canonical_manifest_sha256 is distinct from 'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a'
    or m00_pin.migration_set_digest is distinct from 'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a' then
    raise exception 'Recora Admin P0 M04 failed: approved M00 design pin is incompatible';
  end if;

  if exists (
    select 1
    from unnest(array[
      'recora_private.admin_command_receipts',
      'recora_private.admin_outbox_messages',
      'recora_private.admin_read_refreshes',
      'recora_operator.admin_accounts',
      'recora_operator.admin_identity_security_projections',
      'recora_operator.admin_roles',
      'recora_operator.admin_capabilities',
      'recora_operator.admin_role_capabilities',
      'recora_operator.admin_role_assignments',
      'recora_operator.admin_scope_assignments',
      'recora_audit.operator_events',
      'recora_audit.operator_event_scopes',
      'recora_private.admin_notification_categories',
      'public.organizations',
      'public.projects',
      'public.organization_members',
      'recora_private.p4_command_receipts',
      'recora_private.p4_invitations',
      'recora_private.p4_invitation_events',
      'recora_private.p4_membership_episodes',
      'recora_private.p4_membership_episode_events'
    ]) required_relation
    where to_regclass(required_relation) is null
  ) then
    raise exception 'Recora Admin P0 M04 failed: required M01, M02, M03, P4-B, or public relation is missing';
  end if;

  if not exists (
    select 1
    from pg_enum enum_row
    join pg_type type_row on type_row.oid = enum_row.enumtypid
    join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'recora_private'
      and type_row.typname = 'p4_source_kind'
      and enum_row.enumlabel = 'customer_session'
  ) then
    raise exception 'Recora Admin P0 M04 failed: P4-B customer_session source kind is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'recora_private'
      and table_name = 'p4_command_receipts'
      and column_name = 'customer_auth_user_id'
      and udt_name = 'uuid'
  ) or not exists (
    select 1
    from pg_constraint
    where conrelid = 'recora_private.p4_command_receipts'::regclass
      and conname = 'p4_command_receipt_actor_shape'
      and convalidated
  ) then
    raise exception 'Recora Admin P0 M04 failed: P4-B customer actor contract is missing';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.proname = 'recora_p4b_resolve_customer_access'
  ) then
    raise exception 'Recora Admin P0 M04 failed: P4-B customer access RPC boundary is missing';
  end if;

  if (select count(*) from recora_operator.admin_roles) <> 8
    or (select count(*) from recora_operator.admin_capabilities) <> 64
    or (select count(*) from recora_operator.admin_role_capabilities) <> 185
    or (select count(*) from recora_private.admin_notification_categories) <> 8 then
    raise exception 'Recora Admin P0 M04 failed: M03 static catalog inventory is incompatible';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_id_organization_id_unique'
      and contype = 'u'
      and convalidated
  ) then
    raise exception 'Recora Admin P0 M04 failed: public.projects(id, organization_id) uniqueness is missing';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'invitation_expires_at'
  ) then
    raise exception 'Recora Admin P0 M04 failed: unsupported membership expiry column is present';
  end if;

  select count(*)
  into orphan_project_count
  from public.projects project_row
  left join public.organizations organization_row
    on organization_row.id = project_row.organization_id
  where organization_row.id is null;

  if orphan_project_count <> 0 then
    raise exception 'Recora Admin P0 M04 failed: % orphan public project row(s) found', orphan_project_count;
  end if;

  select count(*)
  into cross_tenant_project_count
  from (
    select organization_id, project_id
    from recora_private.admin_command_receipts
    where project_id is not null
    union all
    select organization_id, project_id
    from recora_private.admin_outbox_messages
    where project_id is not null
    union all
    select organization_id, project_id
    from recora_private.p4_command_receipts
    where project_id is not null
  ) scoped_project
  left join public.projects project_row
    on project_row.id = scoped_project.project_id
   and project_row.organization_id = scoped_project.organization_id
  where project_row.id is null;

  if cross_tenant_project_count <> 0 then
    raise exception 'Recora Admin P0 M04 failed: % cross-tenant project relation(s) found', cross_tenant_project_count;
  end if;

  select count(*)
  into duplicate_normalized_email_count
  from (
    select organization_id, pg_catalog.lower(pg_catalog.btrim(email))
    from public.organization_members
    where membership_status::text <> 'revoked'
      and email is not null
      and pg_catalog.btrim(email) <> ''
    group by organization_id, pg_catalog.lower(pg_catalog.btrim(email))
    having count(*) > 1
  ) duplicate_email;

  if duplicate_normalized_email_count <> 0 then
    raise exception 'Recora Admin P0 M04 failed: % non-revoked normalized membership email duplicate(s) found', duplicate_normalized_email_count;
  end if;

  select count(*)
  into private_relation_count
  from unnest(array[
    'recora_private.admin_customer_profiles',
    'recora_private.admin_project_states',
    'recora_private.admin_customer_inquiries',
    'recora_private.admin_customer_inquiry_notes'
  ]) required_relation
  where to_regclass(required_relation) is not null;

  if private_relation_count not in (0, 4) then
    raise exception 'Recora Admin P0 M04 failed: partial private M04 relation inventory (% of 4)', private_relation_count;
  end if;

  if private_relation_count = 4 then
    if (
      select array_agg(column_name order by ordinal_position)
      from information_schema.columns
      where table_schema = 'recora_private'
        and table_name = 'admin_customer_profiles'
    ) is distinct from array[
      'organization_id',
      'primary_contact_name',
      'primary_contact_email',
      'access_control',
      'blocked_incident_id',
      'row_version',
      'last_command_receipt_id',
      'created_at',
      'updated_at'
    ]::text[] or exists (
      select 1
      from (values
        ('organization_id', 'uuid', 'NO'),
        ('primary_contact_name', 'text', 'YES'),
        ('primary_contact_email', 'text', 'YES'),
        ('access_control', 'text', 'NO'),
        ('blocked_incident_id', 'uuid', 'YES'),
        ('row_version', 'int8', 'NO'),
        ('last_command_receipt_id', 'uuid', 'NO'),
        ('created_at', 'timestamptz', 'NO'),
        ('updated_at', 'timestamptz', 'NO')
      ) expected(column_name, udt_name, is_nullable)
      left join information_schema.columns actual
        on actual.table_schema = 'recora_private'
       and actual.table_name = 'admin_customer_profiles'
       and actual.column_name = expected.column_name
      where actual.column_name is null
        or actual.udt_name <> expected.udt_name
        or actual.is_nullable <> expected.is_nullable
    ) then
      raise exception 'Recora Admin P0 M04 failed: incompatible existing customer profile column inventory';
    end if;

    if (
      select array_agg(column_name order by ordinal_position)
      from information_schema.columns
      where table_schema = 'recora_private'
        and table_name = 'admin_project_states'
    ) is distinct from array[
      'project_id',
      'organization_id',
      'lifecycle_status',
      'automation_control',
      'publication_control_state',
      'active_configuration_revision_id',
      'row_version',
      'last_command_receipt_id',
      'created_at',
      'updated_at'
    ]::text[] or exists (
      select 1
      from (values
        ('project_id', 'uuid', 'NO'),
        ('organization_id', 'uuid', 'NO'),
        ('lifecycle_status', 'text', 'NO'),
        ('automation_control', 'text', 'NO'),
        ('publication_control_state', 'text', 'NO'),
        ('active_configuration_revision_id', 'uuid', 'YES'),
        ('row_version', 'int8', 'NO'),
        ('last_command_receipt_id', 'uuid', 'NO'),
        ('created_at', 'timestamptz', 'NO'),
        ('updated_at', 'timestamptz', 'NO')
      ) expected(column_name, udt_name, is_nullable)
      left join information_schema.columns actual
        on actual.table_schema = 'recora_private'
       and actual.table_name = 'admin_project_states'
       and actual.column_name = expected.column_name
      where actual.column_name is null
        or actual.udt_name <> expected.udt_name
        or actual.is_nullable <> expected.is_nullable
    ) then
      raise exception 'Recora Admin P0 M04 failed: incompatible existing project state column inventory';
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'recora_private'
        and table_name = 'admin_customer_inquiry_notes'
        and column_name in ('author_admin_account_id', 'correlation_id')
        and (udt_name <> 'uuid' or is_nullable <> 'NO')
    ) or (
      select count(*)
      from information_schema.columns
      where table_schema = 'recora_private'
        and table_name = 'admin_customer_inquiry_notes'
        and column_name in ('author_admin_account_id', 'correlation_id')
    ) <> 2 then
      raise exception 'Recora Admin P0 M04 failed: incompatible existing inquiry note author or correlation contract';
    end if;

    if (
      select array_agg(attribute_row.attname order by key_column.ordinality)
      from pg_constraint constraint_row
      cross join unnest(constraint_row.conkey) with ordinality as key_column(attnum, ordinality)
      join pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = key_column.attnum
      where constraint_row.conrelid = 'recora_private.admin_customer_profiles'::regclass
        and constraint_row.contype = 'p'
    ) is distinct from array['organization_id']::text[] then
      raise exception 'Recora Admin P0 M04 failed: customer profile primary key must be organization_id';
    end if;

    if (
      select array_agg(attribute_row.attname order by key_column.ordinality)
      from pg_constraint constraint_row
      cross join unnest(constraint_row.conkey) with ordinality as key_column(attnum, ordinality)
      join pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = key_column.attnum
      where constraint_row.conrelid = 'recora_private.admin_project_states'::regclass
        and constraint_row.contype = 'p'
    ) is distinct from array['project_id']::text[] then
      raise exception 'Recora Admin P0 M04 failed: project state primary key must be project_id';
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'recora_private.admin_customer_profiles'::regclass
        and conname = 'admin_customer_profiles_last_command_receipt_fkey'
        and contype = 'f'
        and confrelid = 'recora_private.admin_command_receipts'::regclass
        and confdeltype = 'r'
        and convalidated
    ) or not exists (
      select 1
      from pg_constraint
      where conrelid = 'recora_private.admin_project_states'::regclass
        and conname = 'admin_project_states_last_command_receipt_fkey'
        and contype = 'f'
        and confrelid = 'recora_private.admin_command_receipts'::regclass
        and confdeltype = 'r'
        and convalidated
    ) or not exists (
      select 1
      from pg_constraint
      where conrelid = 'recora_private.admin_customer_inquiry_notes'::regclass
        and conname = 'admin_customer_inquiry_notes_author_admin_account_fkey'
        and contype = 'f'
        and confrelid = 'recora_operator.admin_accounts'::regclass
        and confdeltype = 'r'
        and convalidated
    ) then
      raise exception 'Recora Admin P0 M04 failed: incompatible existing M04 causal foreign key inventory';
    end if;
  end if;

  select count(*)
  into public_extension_count
  from (
    values
      ('public', 'organizations', 'row_version'),
      ('public', 'projects', 'row_version'),
      ('public', 'organization_members', 'row_version'),
      ('public', 'organization_members', 'normalized_email')
  ) expected_column(schema_name, table_name, column_name)
  join information_schema.columns actual
    on actual.table_schema = expected_column.schema_name
   and actual.table_name = expected_column.table_name
   and actual.column_name = expected_column.column_name;

  if public_extension_count not in (0, 4) then
    raise exception 'Recora Admin P0 M04 failed: partial public M04 extension inventory (% of 4)', public_extension_count;
  end if;

  if exists (
    select 1
    from information_schema.columns actual
    where (actual.table_schema, actual.table_name, actual.column_name) in (
      ('public', 'organizations', 'row_version'),
      ('public', 'projects', 'row_version'),
      ('public', 'organization_members', 'row_version')
    )
      and (actual.udt_name <> 'int8' or actual.is_nullable <> 'NO')
  ) or exists (
    select 1
    from information_schema.columns actual
    where actual.table_schema = 'public'
      and actual.table_name = 'organization_members'
      and actual.column_name = 'normalized_email'
      and (actual.udt_name <> 'text' or actual.is_generated <> 'ALWAYS')
  ) then
    raise exception 'Recora Admin P0 M04 failed: incompatible pre-existing M04 public column inventory';
  end if;
end;
$admin_p0_m04_inventory$;
alter table public.organizations
  add column if not exists row_version bigint not null default 1;

alter table public.projects
  add column if not exists row_version bigint not null default 1;

alter table public.organization_members
  add column if not exists normalized_email text generated always as (
    case
      when email is null then null
      else pg_catalog.lower(pg_catalog.btrim(email))
    end
  ) stored,
  add column if not exists row_version bigint not null default 1;

do $admin_p0_m04_public_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organizations'::regclass
      and conname = 'organizations_row_version_positive'
  ) then
    alter table public.organizations
      add constraint organizations_row_version_positive check (row_version > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_row_version_positive'
  ) then
    alter table public.projects
      add constraint projects_row_version_positive check (row_version > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_row_version_positive'
  ) then
    alter table public.organization_members
      add constraint organization_members_row_version_positive check (row_version > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_m04_status_shape'
  ) then
    alter table public.organization_members
      add constraint organization_members_m04_status_shape check (
        membership_status::text not in ('active', 'suspended')
        or (user_id is not null and accepted_at is not null)
      );
  end if;
end;
$admin_p0_m04_public_constraints$;

create unique index if not exists organization_members_nonrevoked_email_key
on public.organization_members (organization_id, normalized_email)
where membership_status <> 'revoked'::public.recora_organization_membership_status
  and normalized_email is not null;

create or replace function recora_private.admin_p0_guard_organization_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'M04 organization physical deletion is prohibited';
  end if;

  if old.id is distinct from new.id
    or old.slug is distinct from new.slug then
    raise exception 'M04 organization identity is immutable';
  end if;

  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  elsif new.row_version <> old.row_version + 1 then
    raise exception 'M04 organization row_version must advance by exactly one';
  end if;

  return new;
end;
$$;

create or replace function recora_private.admin_p0_guard_project_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.id is distinct from new.id
    or old.organization_id is distinct from new.organization_id
    or old.slug is distinct from new.slug then
    raise exception 'M04 project identity and tenant ownership are immutable';
  end if;

  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  elsif new.row_version <> old.row_version + 1 then
    raise exception 'M04 project row_version must advance by exactly one';
  end if;

  return new;
end;
$$;

create or replace function recora_private.admin_p0_guard_member_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.id is distinct from new.id
    or old.organization_id is distinct from new.organization_id then
    raise exception 'M04 membership identity and tenant ownership are immutable';
  end if;

  if old.membership_status::text = 'revoked' then
    if new.membership_status::text <> 'revoked' then
      raise exception 'M04 revoked membership is terminal';
    end if;

    if not (
      old.user_id is not null
      and new.user_id is null
      and old.accepted_at is not null
      and new.accepted_at is null
      and new.email = recora_private.p4b_revoked_membership_email(old.id)
      and new.role is not distinct from old.role
      and new.invited_at is not distinct from old.invited_at
    )
      and (
        new.user_id is distinct from old.user_id
        or new.accepted_at is distinct from old.accepted_at
        or new.email is distinct from old.email
        or new.role is distinct from old.role
        or new.invited_at is distinct from old.invited_at
      ) then
      raise exception 'M04 revoked membership is terminal';
    end if;
  end if;

  if new.membership_status::text in ('active', 'suspended')
    and (new.user_id is null or new.accepted_at is null) then
    raise exception 'M04 active or suspended membership requires user identity and acceptance';
  end if;

  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  elsif new.row_version <> old.row_version + 1 then
    raise exception 'M04 membership row_version must advance by exactly one';
  end if;

  return new;
end;
$$;

do $admin_p0_m04_public_triggers$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.organizations'::regclass
      and tgname = 'admin_p0_organizations_write_guard'
      and not tgisinternal
  ) then
    create trigger admin_p0_organizations_write_guard
    before update or delete on public.organizations
    for each row execute function recora_private.admin_p0_guard_organization_write();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.projects'::regclass
      and tgname = 'admin_p0_projects_write_guard'
      and not tgisinternal
  ) then
    create trigger admin_p0_projects_write_guard
    before update on public.projects
    for each row execute function recora_private.admin_p0_guard_project_write();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.organization_members'::regclass
      and tgname = 'admin_p0_members_write_guard'
      and not tgisinternal
  ) then
    create trigger admin_p0_members_write_guard
    before update on public.organization_members
    for each row execute function recora_private.admin_p0_guard_member_write();
  end if;
end;
$admin_p0_m04_public_triggers$;
create table if not exists recora_private.admin_customer_profiles (
  organization_id uuid primary key,
  primary_contact_name text,
  primary_contact_email text,
  access_control text not null default 'enabled',
  blocked_incident_id uuid,
  row_version bigint not null default 1,
  last_command_receipt_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_customer_profiles_organization_fkey
    foreign key (organization_id)
    references public.organizations(id) on delete restrict,
  constraint admin_customer_profiles_last_command_receipt_fkey
    foreign key (last_command_receipt_id)
    references recora_private.admin_command_receipts(id) on delete restrict,
  constraint admin_customer_profiles_access_control_check
    check (access_control in ('enabled', 'suspended_by_admin', 'blocked_by_system')),
  constraint admin_customer_profiles_block_shape
    check (
      (access_control = 'blocked_by_system' and blocked_incident_id is not null)
      or (access_control <> 'blocked_by_system' and blocked_incident_id is null)
    ),
  constraint admin_customer_profiles_row_version_check check (row_version > 0)
);

create table if not exists recora_private.admin_project_states (
  project_id uuid primary key,
  organization_id uuid not null,
  lifecycle_status text not null default 'setup_in_progress',
  automation_control text not null default 'running',
  publication_control_state text not null default 'enabled',
  active_configuration_revision_id uuid,
  row_version bigint not null default 1,
  last_command_receipt_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_project_states_project_org_fkey
    foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint admin_project_states_last_command_receipt_fkey
    foreign key (last_command_receipt_id)
    references recora_private.admin_command_receipts(id) on delete restrict,
  constraint admin_project_states_lifecycle_check
    check (lifecycle_status in ('setup_in_progress', 'active', 'closed')),
  constraint admin_project_states_automation_check
    check (automation_control in ('running', 'paused_by_admin', 'blocked_by_system')),
  constraint admin_project_states_publication_check
    check (publication_control_state in ('enabled', 'paused_by_admin', 'blocked_by_system')),
  constraint admin_project_states_row_version_check check (row_version > 0)
);

create table if not exists recora_private.admin_customer_inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  subject text not null,
  body text not null,
  received_at timestamptz not null default now(),
  status text not null default 'new',
  notification_state text not null default 'unknown',
  assigned_admin_account_id uuid references recora_operator.admin_accounts(id) on delete restrict,
  resolution_note_id uuid,
  reopen_reason_note_id uuid,
  resolved_at timestamptz,
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_customer_inquiries_project_org_fkey
    foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint admin_customer_inquiries_subject_check check (pg_catalog.btrim(subject) <> ''),
  constraint admin_customer_inquiries_body_check check (pg_catalog.btrim(body) <> ''),
  constraint admin_customer_inquiries_status_check
    check (status in ('new', 'in_progress', 'resolved')),
  constraint admin_customer_inquiries_notification_check
    check (notification_state in ('delivered', 'retrying', 'failed', 'unknown')),
  constraint admin_customer_inquiries_resolved_at_check
    check (
      (status = 'resolved' and resolved_at is not null)
      or (status <> 'resolved' and resolved_at is null)
    ),
  constraint admin_customer_inquiries_resolution_pointer_check
    check (status = 'resolved' or resolution_note_id is null),
  constraint admin_customer_inquiries_row_version_check check (row_version > 0)
);

create table if not exists recora_private.admin_customer_inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references recora_private.admin_customer_inquiries(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid,
  note_type text not null,
  body text not null,
  author_admin_account_id uuid not null,
  correlation_id uuid not null,
  corrects_note_id uuid references recora_private.admin_customer_inquiry_notes(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint admin_customer_inquiry_notes_author_admin_account_fkey
    foreign key (author_admin_account_id)
    references recora_operator.admin_accounts(id) on delete restrict,
  constraint admin_customer_inquiry_notes_type_check
    check (note_type in ('internal', 'resolution', 'correction', 'reopen_reason')),
  constraint admin_customer_inquiry_notes_body_check check (pg_catalog.btrim(body) <> ''),
  constraint admin_customer_inquiry_notes_correction_check
    check (
      (note_type = 'correction' and corrects_note_id is not null)
      or (note_type <> 'correction' and corrects_note_id is null)
    )
);

do $admin_p0_m04_inquiry_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'recora_private.admin_customer_inquiries'::regclass
      and conname = 'admin_customer_inquiries_resolution_note_fkey'
  ) then
    alter table recora_private.admin_customer_inquiries
      add constraint admin_customer_inquiries_resolution_note_fkey
      foreign key (resolution_note_id)
      references recora_private.admin_customer_inquiry_notes(id)
      on delete restrict
      deferrable initially deferred;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'recora_private.admin_customer_inquiries'::regclass
      and conname = 'admin_customer_inquiries_reopen_note_fkey'
  ) then
    alter table recora_private.admin_customer_inquiries
      add constraint admin_customer_inquiries_reopen_note_fkey
      foreign key (reopen_reason_note_id)
      references recora_private.admin_customer_inquiry_notes(id)
      on delete restrict
      deferrable initially deferred;
  end if;
end;
$admin_p0_m04_inquiry_constraints$;

create index if not exists admin_customer_profiles_access_idx
on recora_private.admin_customer_profiles (access_control, organization_id);

create index if not exists admin_project_states_org_lifecycle_idx
on recora_private.admin_project_states (organization_id, lifecycle_status);

create index if not exists admin_customer_inquiries_queue_idx
on recora_private.admin_customer_inquiries (organization_id, status, received_at);

create index if not exists admin_customer_inquiry_notes_scope_idx
on recora_private.admin_customer_inquiry_notes (inquiry_id, created_at);

create or replace function recora_private.admin_p0_guard_customer_profile()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception 'M04 customer profile identity is immutable';
  end if;

  if old.access_control = 'blocked_by_system'
    and new.access_control <> 'blocked_by_system' then
    raise exception 'M04 system-blocked customer profile cannot be ordinarily unblocked';
  end if;

  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  elsif new.row_version <> old.row_version + 1 then
    raise exception 'M04 customer profile row_version must advance by exactly one';
  end if;

  return new;
end;
$$;

create or replace function recora_private.admin_p0_guard_project_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.project_id is distinct from new.project_id
    or old.organization_id is distinct from new.organization_id then
    raise exception 'M04 project state scope identity is immutable';
  end if;

  if old.lifecycle_status = 'closed'
    and new.lifecycle_status <> 'closed' then
    raise exception 'M04 closed project state is terminal';
  end if;

  if old.automation_control = 'blocked_by_system'
    and new.automation_control <> 'blocked_by_system' then
    raise exception 'M04 system-blocked automation cannot be ordinarily cleared';
  end if;

  if old.publication_control_state = 'blocked_by_system'
    and new.publication_control_state <> 'blocked_by_system' then
    raise exception 'M04 system-blocked publication cannot be ordinarily cleared';
  end if;

  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  elsif new.row_version <> old.row_version + 1 then
    raise exception 'M04 project state row_version must advance by exactly one';
  end if;

  return new;
end;
$$;
create or replace function recora_private.admin_p0_guard_customer_inquiry()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.id is distinct from new.id
    or old.organization_id is distinct from new.organization_id
    or old.project_id is distinct from new.project_id
    or old.subject is distinct from new.subject
    or old.body is distinct from new.body
    or old.received_at is distinct from new.received_at then
    raise exception 'M04 inquiry incoming scope and content are immutable';
  end if;

  if new.status <> old.status
    and not (
      (old.status = 'new' and new.status in ('in_progress', 'resolved'))
      or (old.status = 'in_progress' and new.status = 'resolved')
      or (old.status = 'resolved' and new.status = 'in_progress')
    ) then
    raise exception 'M04 inquiry status transition is invalid';
  end if;

  if new.status <> 'resolved'
    and (new.resolved_at is not null or new.resolution_note_id is not null) then
    raise exception 'M04 non-resolved inquiry cannot retain resolution fields';
  end if;

  if new.status = 'resolved'
    and new.reopen_reason_note_id is not null then
    raise exception 'M04 resolved inquiry cannot retain a reopen reason';
  end if;

  if old.status <> 'resolved'
    and new.status = 'in_progress'
    and new.reopen_reason_note_id is not null then
    raise exception 'M04 reopen reason is valid only for a resolved inquiry transition';
  end if;

  if new.row_version = old.row_version then
    new.row_version := old.row_version + 1;
  elsif new.row_version <> old.row_version + 1 then
    raise exception 'M04 inquiry row_version must advance by exactly one';
  end if;

  return new;
end;
$$;

create or replace function recora_private.admin_p0_validate_inquiry_note()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inquiry_row recora_private.admin_customer_inquiries%rowtype;
begin
  select *
  into inquiry_row
  from recora_private.admin_customer_inquiries
  where id = new.inquiry_id;

  if not found
    or inquiry_row.organization_id is distinct from new.organization_id
    or inquiry_row.project_id is distinct from new.project_id then
    raise exception 'M04 inquiry note scope does not match its inquiry';
  end if;

  if new.note_type = 'correction'
    and not exists (
      select 1
      from recora_private.admin_customer_inquiry_notes prior_note
      where prior_note.id = new.corrects_note_id
        and prior_note.inquiry_id = new.inquiry_id
    ) then
    raise exception 'M04 correction note must reference a prior note in the same inquiry';
  end if;

  return new;
end;
$$;

create or replace function recora_private.admin_p0_validate_inquiry_note_contract()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'resolved' then
    if new.resolution_note_id is null
      or not exists (
        select 1
        from recora_private.admin_customer_inquiry_notes note_row
        where note_row.id = new.resolution_note_id
          and note_row.inquiry_id = new.id
          and note_row.organization_id = new.organization_id
          and note_row.project_id is not distinct from new.project_id
          and note_row.note_type = 'resolution'
      ) then
      raise exception 'M04 inquiry resolution requires a same-transaction resolution note';
    end if;
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'resolved'
    and new.status = 'in_progress' then
    if new.reopen_reason_note_id is null
      or not exists (
        select 1
        from recora_private.admin_customer_inquiry_notes note_row
        where note_row.id = new.reopen_reason_note_id
          and note_row.inquiry_id = new.id
          and note_row.organization_id = new.organization_id
          and note_row.project_id is not distinct from new.project_id
          and note_row.note_type = 'reopen_reason'
      ) then
      raise exception 'M04 inquiry reopening requires a same-transaction reopen reason';
    end if;
  end if;

  return null;
end;
$$;

do $admin_p0_m04_private_triggers$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'recora_private.admin_customer_profiles'::regclass
      and tgname = 'admin_customer_profiles_write_guard'
      and not tgisinternal
  ) then
    create trigger admin_customer_profiles_write_guard
    before update on recora_private.admin_customer_profiles
    for each row execute function recora_private.admin_p0_guard_customer_profile();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'recora_private.admin_project_states'::regclass
      and tgname = 'admin_project_states_write_guard'
      and not tgisinternal
  ) then
    create trigger admin_project_states_write_guard
    before update on recora_private.admin_project_states
    for each row execute function recora_private.admin_p0_guard_project_state();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'recora_private.admin_customer_inquiries'::regclass
      and tgname = 'admin_customer_inquiries_write_guard'
      and not tgisinternal
  ) then
    create trigger admin_customer_inquiries_write_guard
    before update on recora_private.admin_customer_inquiries
    for each row execute function recora_private.admin_p0_guard_customer_inquiry();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'recora_private.admin_customer_inquiry_notes'::regclass
      and tgname = 'admin_customer_inquiry_notes_scope_guard'
      and not tgisinternal
  ) then
    create trigger admin_customer_inquiry_notes_scope_guard
    before insert on recora_private.admin_customer_inquiry_notes
    for each row execute function recora_private.admin_p0_validate_inquiry_note();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'recora_private.admin_customer_inquiry_notes'::regclass
      and tgname = 'admin_customer_inquiry_notes_append_only'
      and not tgisinternal
  ) then
    create trigger admin_customer_inquiry_notes_append_only
    before update or delete on recora_private.admin_customer_inquiry_notes
    for each row execute function recora_private.p4_reject_history_mutation();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'recora_private.admin_customer_inquiries'::regclass
      and tgname = 'admin_customer_inquiries_note_contract'
      and not tgisinternal
  ) then
    create constraint trigger admin_customer_inquiries_note_contract
    after insert or update on recora_private.admin_customer_inquiries
    deferrable initially deferred
    for each row execute function recora_private.admin_p0_validate_inquiry_note_contract();
  end if;
end;
$admin_p0_m04_private_triggers$;

alter table recora_private.admin_customer_profiles enable row level security;
alter table recora_private.admin_project_states enable row level security;
alter table recora_private.admin_customer_inquiries enable row level security;
alter table recora_private.admin_customer_inquiry_notes enable row level security;

revoke all on table recora_private.admin_customer_profiles from public, anon, authenticated, service_role;
revoke all on table recora_private.admin_project_states from public, anon, authenticated, service_role;
revoke all on table recora_private.admin_customer_inquiries from public, anon, authenticated, service_role;
revoke all on table recora_private.admin_customer_inquiry_notes from public, anon, authenticated, service_role;

revoke all on function recora_private.admin_p0_guard_organization_write()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_guard_project_write()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_guard_member_write()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_guard_customer_profile()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_guard_project_state()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_guard_customer_inquiry()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_validate_inquiry_note()
from public, anon, authenticated, service_role;
revoke all on function recora_private.admin_p0_validate_inquiry_note_contract()
from public, anon, authenticated, service_role;