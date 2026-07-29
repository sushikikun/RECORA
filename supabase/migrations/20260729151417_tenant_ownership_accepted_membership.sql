-- Issue #105 / 102-3B tenant ownership and accepted-membership foundation.
--
-- This migration is intentionally additive:
-- - organizations.id remains the tenant identifier.
-- - projects.organization_id is validated, never inferred or remapped.
-- - membership authorization requires an authenticated accepted active row.
-- - implicit tenant resolution fails closed when zero or multiple active
--   memberships exist.

set search_path = public, extensions;

-- Inspect the existing ownership and membership data before any persistent
-- schema or data write. A failed inventory must leave the database unchanged.
do $inventory$
declare
  project_null_organization_count bigint;
  project_orphan_organization_count bigint;
  project_duplicate_candidate_key_count bigint;
  demo_owned_project_review_count bigint;
  membership_null_organization_count bigint;
  membership_orphan_organization_count bigint;
  membership_duplicate_user_count bigint;
  membership_accepted_without_user_count bigint;
  ambiguous_accepted_user_count bigint;
begin
  select count(*)
  into project_null_organization_count
  from public.projects
  where organization_id is null;

  if project_null_organization_count > 0 then
    raise exception
      'Issue 105 inventory failed: % project row(s) have unknown organization ownership; provide an explicit mapping or quarantine before retrying',
      project_null_organization_count;
  end if;

  select count(*)
  into project_orphan_organization_count
  from public.projects project_row
  left join public.organizations organization_row
    on organization_row.id = project_row.organization_id
  where organization_row.id is null;

  if project_orphan_organization_count > 0 then
    raise exception
      'Issue 105 inventory failed: % project row(s) reference a missing organization; repair explicitly before retrying',
      project_orphan_organization_count;
  end if;

  select count(*)
  into project_duplicate_candidate_key_count
  from (
    select project_row.id, project_row.organization_id
    from public.projects project_row
    group by project_row.id, project_row.organization_id
    having count(*) > 1
  ) duplicate_project;

  if project_duplicate_candidate_key_count > 0 then
    raise exception
      'Issue 105 inventory failed: % duplicate project tenant candidate key(s) found',
      project_duplicate_candidate_key_count;
  end if;

  select count(*)
  into membership_null_organization_count
  from public.organization_members
  where organization_id is null;

  if membership_null_organization_count > 0 then
    raise exception
      'Issue 105 inventory failed: % membership row(s) have no organization',
      membership_null_organization_count;
  end if;

  select count(*)
  into membership_orphan_organization_count
  from public.organization_members member_row
  left join public.organizations organization_row
    on organization_row.id = member_row.organization_id
  where organization_row.id is null;

  if membership_orphan_organization_count > 0 then
    raise exception
      'Issue 105 inventory failed: % membership row(s) reference a missing organization',
      membership_orphan_organization_count;
  end if;

  select count(*)
  into membership_duplicate_user_count
  from (
    select member_row.organization_id, member_row.user_id
    from public.organization_members member_row
    where member_row.user_id is not null
    group by member_row.organization_id, member_row.user_id
    having count(*) > 1
  ) duplicate_membership;

  if membership_duplicate_user_count > 0 then
    raise exception
      'Issue 105 inventory failed: % duplicate organization/user membership(s) found',
      membership_duplicate_user_count;
  end if;

  select count(*)
  into membership_accepted_without_user_count
  from public.organization_members
  where accepted_at is not null
    and user_id is null;

  if membership_accepted_without_user_count > 0 then
    raise exception
      'Issue 105 inventory failed: % accepted membership row(s) have no authenticated user_id; map or quarantine them explicitly before retrying',
      membership_accepted_without_user_count;
  end if;

  select count(*)
  into demo_owned_project_review_count
  from public.projects project_row
  join public.organizations organization_row
    on organization_row.id = project_row.organization_id
  where organization_row.is_demo is true;

  select count(*)
  into ambiguous_accepted_user_count
  from (
    select member_row.user_id
    from public.organization_members member_row
    where member_row.user_id is not null
      and member_row.accepted_at is not null
    group by member_row.user_id
    having count(*) > 1
  ) ambiguous_user;

  raise notice
    'Issue 105 ownership inventory: projects=%, demo-owned review candidates=%, unknown=0, orphan=0, duplicate candidate keys=0',
    (select count(*) from public.projects),
    demo_owned_project_review_count;
  raise notice
    'Issue 105 membership inventory: rows=%, accepted=%, invited/unaccepted=%, users with multiple accepted organizations=%',
    (select count(*) from public.organization_members),
    (select count(*) from public.organization_members where accepted_at is not null),
    (select count(*) from public.organization_members where accepted_at is null),
    ambiguous_accepted_user_count;
end;
$inventory$;

do $membership_type$
begin
  if not exists (
    select 1
    from pg_type type_row
    join pg_namespace namespace_row
      on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'public'
      and type_row.typname = 'recora_organization_membership_status'
  ) then
    create type public.recora_organization_membership_status as enum (
      'invited',
      'active',
      'suspended',
      'revoked'
    );
  end if;
end;
$membership_type$;

alter table public.organization_members
  add column if not exists membership_status
    public.recora_organization_membership_status;

comment on column public.organization_members.membership_status is
  'Authorization lifecycle state. Only accepted active rows with auth.uid() identity are effective customer memberships.';

-- Backfill only from recorded acceptance evidence. Tenant ownership, identity,
-- email, and role are never inferred or changed.
update public.organization_members
set membership_status = case
  when accepted_at is not null then 'active'::public.recora_organization_membership_status
  else 'invited'::public.recora_organization_membership_status
end
where membership_status is null;

alter table public.organization_members
  alter column membership_status
    set default 'invited'::public.recora_organization_membership_status,
  alter column membership_status set not null;

do $membership_constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_acceptance_identity_check'
  ) then
    alter table public.organization_members
      add constraint organization_members_acceptance_identity_check
      check (accepted_at is null or user_id is not null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_status_consistency_check'
  ) then
    alter table public.organization_members
      add constraint organization_members_status_consistency_check
      check (
        (
          membership_status = 'invited'::public.recora_organization_membership_status
          and accepted_at is null
        )
        or (
          membership_status = 'active'::public.recora_organization_membership_status
          and user_id is not null
          and accepted_at is not null
        )
        or (
          membership_status = 'suspended'::public.recora_organization_membership_status
          and user_id is not null
          and accepted_at is not null
        )
        or (
          membership_status = 'revoked'::public.recora_organization_membership_status
          and (accepted_at is null or user_id is not null)
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_id_organization_id_unique'
  ) then
    alter table public.projects
      add constraint projects_id_organization_id_unique
      unique (id, organization_id);
  end if;
end;
$membership_constraints$;

create or replace function recora_private.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and target_organization_id is not null
    and exists (
      select 1
      from public.organization_members member_row
      where member_row.organization_id = target_organization_id
        and member_row.user_id = (select auth.uid())
        and member_row.accepted_at is not null
        and member_row.membership_status =
          'active'::public.recora_organization_membership_status
    );
$$;

comment on function recora_private.is_organization_member(uuid) is
  'Returns true only for the authenticated actor''s accepted active membership in the explicit target organization.';

create or replace function recora_private.resolve_unambiguous_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when count(*) = 1 then (array_agg(member_row.organization_id))[1]
    else null
  end
  from public.organization_members member_row
  where (select auth.uid()) is not null
    and member_row.user_id = (select auth.uid())
    and member_row.accepted_at is not null
    and member_row.membership_status =
      'active'::public.recora_organization_membership_status;
$$;

comment on function recora_private.resolve_unambiguous_organization_id() is
  'Returns the sole accepted active tenant for auth.uid(); returns NULL for anonymous, missing, or multiple active memberships.';

revoke all on function recora_private.is_organization_member(uuid)
from public;
grant execute on function recora_private.is_organization_member(uuid)
to anon, authenticated;

revoke all on function recora_private.resolve_unambiguous_organization_id()
from public, anon, authenticated;
grant execute on function recora_private.resolve_unambiguous_organization_id()
to authenticated;

do $migration_summary$
begin
  raise notice
    'Issue 105 membership backfill complete: invited=%, active=%, suspended=%, revoked=%',
    (
      select count(*)
      from public.organization_members
      where membership_status = 'invited'
    ),
    (
      select count(*)
      from public.organization_members
      where membership_status = 'active'
    ),
    (
      select count(*)
      from public.organization_members
      where membership_status = 'suspended'
    ),
    (
      select count(*)
      from public.organization_members
      where membership_status = 'revoked'
    );
end;
$migration_summary$;
