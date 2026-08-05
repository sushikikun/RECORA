-- Recora Admin P0 / M05 customer Project access.
--
-- Boundary:
-- - Create one private, append-only grant-episode relation.
-- - Require an explicit active grant in addition to existing membership and lifecycle access.
-- - Do not create a browser mutation path, infer/backfill grants, or seed business grants.

begin;

set search_path = public, extensions;

-- Verify the implemented M00-M04 and P4-B contracts before adding persistent M05 DDL.
do $recora_admin_p0_m05_inventory$
declare
  m00_pin record;
  m05_relation_count integer;
  m05_helper_count integer;
begin
  if to_regclass('recora_private.admin_p0_schema_versions') is null then
    raise exception 'Recora Admin P0 M05 failed: M00 schema contract is missing';
  end if;

  select *
  into m00_pin
  from recora_private.admin_p0_schema_versions
  where schema_version = 'recora_admin_p0_design_v1_3';

  if not found
    or m00_pin.canonical_package_id is distinct from 'RECORA-ADMIN-P0-CANONICAL'
    or m00_pin.canonical_version is distinct from '1.0'
    or m00_pin.canonical_manifest_sha256 is distinct from 'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a'
    or m00_pin.migration_set_digest is distinct from 'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a'
  then
    raise exception 'Recora Admin P0 M05 failed: approved M00 design pin is incompatible';
  end if;

  if exists (
    select 1
    from unnest(array[
      'recora_private.admin_command_receipts',
      'recora_operator.admin_accounts',
      'recora_audit.operator_events',
      'public.organizations',
      'public.projects',
      'public.organization_members',
      'recora_private.p4_command_receipts',
      'recora_private.p4_invitations',
      'recora_private.p4_membership_episodes'
    ]) required_relation
    where to_regclass(required_relation) is null
  ) then
    raise exception 'Recora Admin P0 M05 failed: required M01-M04 or P4-B relation is missing';
  end if;

  if to_regclass('auth.users') is null
    or to_regprocedure('recora_private.resolve_data_lifecycle_access(uuid,uuid)') is null
    or to_regprocedure('recora_private.can_read_organization_identity(uuid)') is null
    or to_regprocedure('recora_private.can_read_project(uuid)') is null
  then
    raise exception 'Recora Admin P0 M05 failed: required Auth or lifecycle/RLS helper is missing';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_id_organization_id_unique'
      and contype = 'u'
      and convalidated
  ) then
    raise exception 'Recora Admin P0 M05 failed: public.projects(id, organization_id) uniqueness is missing';
  end if;

  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and (
        (column_name = 'id' and udt_name = 'uuid' and is_nullable = 'NO')
        or (column_name = 'organization_id' and udt_name = 'uuid' and is_nullable = 'NO')
        or (column_name = 'user_id' and udt_name = 'uuid')
        or (column_name = 'accepted_at' and udt_name = 'timestamptz')
        or (column_name = 'membership_status'
          and udt_name = 'recora_organization_membership_status'
          and is_nullable = 'NO')
      )
  ) <> 5 then
    raise exception 'Recora Admin P0 M05 failed: M04/P4-B organization_members shape is incompatible';
  end if;

  if exists (
    select 1
    from public.projects project_row
    left join public.organizations organization_row
      on organization_row.id = project_row.organization_id
    where organization_row.id is null
  ) or exists (
    select 1
    from public.organization_members member_row
    left join public.organizations organization_row
      on organization_row.id = member_row.organization_id
    where organization_row.id is null
  ) then
    raise exception 'Recora Admin P0 M05 failed: orphan public project or membership relation found';
  end if;

  select count(*)
  into m05_relation_count
  from (values
    (to_regclass('recora_private.customer_project_access_grants'))
  ) relation_inventory(relation_oid)
  where relation_oid is not null;

  select count(*)
  into m05_helper_count
  from (values
    (to_regprocedure('recora_private.has_active_customer_project_access(uuid,uuid)'))
  ) helper_inventory(helper_oid)
  where helper_oid is not null;

  if m05_relation_count <> 0 or m05_helper_count <> 0 then
    raise exception 'Recora Admin P0 M05 failed: a same-responsibility customer Project access object already exists';
  end if;
end;
$recora_admin_p0_m05_inventory$;

-- The membership identity primary key implies this pair is unique. PostgreSQL
-- requires the exact validated key before a composite tenant FK may reference it.
do $recora_admin_p0_m05_membership_reference_key$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_id_organization_id_unique'
      and contype = 'u'
  ) then
    alter table public.organization_members
      add constraint organization_members_id_organization_id_unique
      unique (id, organization_id);
  end if;
end;
$recora_admin_p0_m05_membership_reference_key$;

create table recora_private.customer_project_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null,
  organization_member_id uuid not null,
  customer_auth_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active',
  issued_command_receipt_id uuid not null,
  revoked_command_receipt_id uuid,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  row_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_project_access_grants_project_scope_fkey
    foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint customer_project_access_grants_member_scope_fkey
    foreign key (organization_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete restrict,
  constraint customer_project_access_grants_issued_receipt_fkey
    foreign key (issued_command_receipt_id)
    references recora_private.admin_command_receipts(id) on delete restrict,
  constraint customer_project_access_grants_revoked_receipt_fkey
    foreign key (revoked_command_receipt_id)
    references recora_private.admin_command_receipts(id) on delete restrict,
  constraint customer_project_access_grants_status_check
    check (status in ('active', 'revoked')),
  constraint customer_project_access_grants_revocation_shape_check
    check (
      (status = 'active' and revoked_command_receipt_id is null and revoked_at is null)
      or
      (status = 'revoked' and revoked_command_receipt_id is not null and revoked_at is not null)
    ),
  constraint customer_project_access_grants_receipts_distinct_check
    check (
      revoked_command_receipt_id is null
      or issued_command_receipt_id <> revoked_command_receipt_id
    ),
  constraint customer_project_access_grants_row_version_positive
    check (row_version > 0),
  constraint customer_project_access_grants_issued_receipt_unique
    unique (issued_command_receipt_id),
  constraint customer_project_access_grants_revoked_receipt_unique
    unique (revoked_command_receipt_id)
);

comment on table recora_private.customer_project_access_grants is
  'Private M05 history of explicit customer Project access grant episodes. An active grant requires a current accepted active membership and authoritative lifecycle access at read time; revoked rows are terminal and regrant creates a new row.';

create unique index customer_project_access_grants_active_user_project_key
on recora_private.customer_project_access_grants (project_id, customer_auth_user_id)
where status = 'active';

create unique index customer_project_access_grants_active_member_project_key
on recora_private.customer_project_access_grants (project_id, organization_member_id)
where status = 'active';

create index customer_project_access_grants_member_history_idx
on recora_private.customer_project_access_grants (
  organization_id,
  organization_member_id,
  created_at desc
);

create or replace function recora_private.admin_p0_validate_customer_project_access_grant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  membership_match_count integer;
  issued_receipt_match_count integer;
  revoked_receipt_match_count integer;
begin
  if tg_op = 'DELETE' then
    raise exception 'M05 customer Project access grant history is retained; delete is not allowed';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'active'
      or new.revoked_command_receipt_id is not null
      or new.revoked_at is not null
      or new.row_version <> 1
    then
      raise exception 'M05 grant must be inserted as a new active row';
    end if;

    select count(*)
    into membership_match_count
    from public.organization_members member_row
    where member_row.id = new.organization_member_id
      and member_row.organization_id = new.organization_id
      and member_row.user_id = new.customer_auth_user_id
      and member_row.accepted_at is not null
      and member_row.membership_status = 'active'::public.recora_organization_membership_status;

    if membership_match_count <> 1 then
      raise exception 'M05 grant requires exactly one accepted active membership with the same organization and customer user';
    end if;

    select count(*)
    into issued_receipt_match_count
    from recora_private.admin_command_receipts receipt_row
    where receipt_row.id = new.issued_command_receipt_id
      and receipt_row.organization_id = new.organization_id
      and receipt_row.project_id = new.project_id
      and receipt_row.outcome = 'committed';

    if issued_receipt_match_count <> 1 then
      raise exception 'M05 grant requires one committed issued command receipt with matching Project scope';
    end if;

    return new;
  end if;

  if old.status = 'revoked' then
    raise exception 'M05 revoked customer Project access grant is terminal';
  end if;

  if old.id is distinct from new.id
    or old.organization_id is distinct from new.organization_id
    or old.project_id is distinct from new.project_id
    or old.organization_member_id is distinct from new.organization_member_id
    or old.customer_auth_user_id is distinct from new.customer_auth_user_id
    or old.issued_command_receipt_id is distinct from new.issued_command_receipt_id
    or old.granted_at is distinct from new.granted_at
    or old.created_at is distinct from new.created_at
  then
    raise exception 'M05 grant identity, tenant, customer, issue receipt, grant time, and creation time are immutable';
  end if;

  if new.status <> 'revoked'
    or new.revoked_command_receipt_id is null
    or new.revoked_at is null
  then
    raise exception 'M05 customer Project access only permits an active to revoked transition';
  end if;

  if new.row_version <> old.row_version + 1 then
    raise exception 'M05 grant row_version must advance by exactly one';
  end if;

  select count(*)
  into revoked_receipt_match_count
  from recora_private.admin_command_receipts receipt_row
  where receipt_row.id = new.revoked_command_receipt_id
    and receipt_row.organization_id = new.organization_id
    and receipt_row.project_id = new.project_id
    and receipt_row.outcome = 'committed';

  if revoked_receipt_match_count <> 1 then
    raise exception 'M05 revoke requires one committed revoked command receipt with matching Project scope';
  end if;

  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;

create trigger customer_project_access_grants_transition_guard
before insert or update or delete on recora_private.customer_project_access_grants
for each row execute function recora_private.admin_p0_validate_customer_project_access_grant();

create or replace function recora_private.has_active_customer_project_access(
  target_project_id uuid,
  target_auth_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  candidate_count integer;
begin
  if target_project_id is null or target_auth_user_id is null then
    return false;
  end if;

  select count(*)
  into candidate_count
  from public.projects project_row
  join public.organization_members member_row
    on member_row.organization_id = project_row.organization_id
   and member_row.user_id = target_auth_user_id
   and member_row.accepted_at is not null
   and member_row.membership_status = 'active'::public.recora_organization_membership_status
  join recora_private.customer_project_access_grants grant_row
    on grant_row.organization_id = project_row.organization_id
   and grant_row.project_id = project_row.id
   and grant_row.organization_member_id = member_row.id
   and grant_row.customer_auth_user_id = member_row.user_id
   and grant_row.status = 'active'
  where project_row.id = target_project_id;

  return candidate_count = 1;
end;
$$;

comment on function recora_private.has_active_customer_project_access(uuid, uuid) is
  'Private fail-closed M05 read helper. It confirms exactly one active grant whose Project, organization, accepted active membership, and authenticated customer user all agree. Direct execution is forbidden.';

create or replace function recora_private.can_read_project(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_project_id is not null
    and exists (
      select 1
      from public.projects project_row
      where project_row.id = target_project_id
        and recora_private.is_customer_lifecycle_access_allowed(
          project_row.organization_id,
          project_row.id
        )
        and (
          (
            (select auth.role()) = 'anon'
            and (select auth.uid()) is null
            and recora_private.can_read_organization_identity(project_row.organization_id)
          )
          or (
            (select auth.role()) = 'authenticated'
            and (select auth.uid()) is not null
            and recora_private.has_active_customer_project_access(
              project_row.id,
              (select auth.uid())
            )
          )
        )
    );
$$;

alter table recora_private.customer_project_access_grants enable row level security;

revoke all on table recora_private.customer_project_access_grants
from public, anon, authenticated, service_role;

revoke all on function recora_private.admin_p0_validate_customer_project_access_grant()
from public, anon, authenticated, service_role;

revoke all on function recora_private.has_active_customer_project_access(uuid, uuid)
from public, anon, authenticated, service_role;


do $recora_admin_p0_m05_verify$
begin
  if to_regclass('recora_private.customer_project_access_grants') is null
    or to_regprocedure('recora_private.has_active_customer_project_access(uuid,uuid)') is null
    or not exists (
      select 1
      from pg_class relation_row
      where relation_row.oid = 'recora_private.customer_project_access_grants'::regclass
        and relation_row.relrowsecurity
    )
    or exists (
      select 1
      from pg_proc function_row
      join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
      where namespace_row.nspname = 'recora_private'
        and function_row.proname = 'has_active_customer_project_access'
        and function_row.prosecdef is not true
    )
    or has_table_privilege('public', 'recora_private.customer_project_access_grants', 'select')
    or has_table_privilege('anon', 'recora_private.customer_project_access_grants', 'select')
    or has_table_privilege('authenticated', 'recora_private.customer_project_access_grants', 'select')
    or has_table_privilege('service_role', 'recora_private.customer_project_access_grants', 'select')
    or has_function_privilege(
      'authenticated',
      'recora_private.has_active_customer_project_access(uuid, uuid)',
      'execute'
    )
  then
    raise exception 'Recora Admin P0 M05 verification failed: private grant relation or helper security contract is incompatible';
  end if;
end;
$recora_admin_p0_m05_verify$;

commit;