-- Issue #117 / 102-3H: bind customer RLS to the same authoritative lifecycle
-- decision consumed by the service-role resolver. This is additive: the only
-- compatibility bootstrap creates an organization-level active state for
-- organizations that existed when this migration ran. A new organization
-- requires an explicit organization-level lifecycle row and therefore fails
-- closed. A project inherits its active organization's state unless it has an
-- explicit, more restrictive lifecycle row.
begin;

insert into recora_private.data_lifecycle_current (
  organization_id,
  project_id,
  state
)
select
  organization_row.id,
  null,
  'active'::recora_private.data_lifecycle_state
from public.organizations organization_row
where not exists (
  select 1
  from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = organization_row.id
    and current_row.project_id is null
);

comment on table recora_private.data_lifecycle_current is
  'Mutable organization or project current lifecycle state. Issue #117 bootstrapped an active organization-level state only for organizations existing during the additive migration; a new organization requires an explicit lifecycle decision, while a project inherits active organization state unless it has an explicit restrictive override.';

create or replace function recora_private.resolve_data_lifecycle_access(
  p_organization_id uuid,
  p_project_id uuid default null
)
returns table (
  customer_access_allowed boolean,
  new_measurement_allowed boolean,
  restore_eligible boolean,
  reason_code text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  organization_candidate_count integer;
  project_candidate_count integer;
  organization_lifecycle_row recora_private.data_lifecycle_current%rowtype;
  project_lifecycle_row recora_private.data_lifecycle_current%rowtype;
  legal_hold_active boolean;
begin
  if p_organization_id is null or not exists (
    select 1
    from public.organizations organization_row
    where organization_row.id = p_organization_id
  ) then
    return query select false, false, false, 'invalid_scope'::text;
    return;
  end if;

  if p_project_id is not null and not exists (
    select 1
    from public.projects project_row
    where project_row.id = p_project_id
      and project_row.organization_id = p_organization_id
  ) then
    return query select false, false, false, 'invalid_scope'::text;
    return;
  end if;

  select count(*) into organization_candidate_count
  from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = p_organization_id
    and current_row.project_id is null;

  if organization_candidate_count = 0 then
    return query select false, false, false, 'no_lifecycle_state'::text;
    return;
  end if;

  if organization_candidate_count <> 1 then
    return query select false, false, false, 'ambiguous_lifecycle_state'::text;
    return;
  end if;

  select current_row.* into organization_lifecycle_row
  from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = p_organization_id
    and current_row.project_id is null;

  legal_hold_active := organization_lifecycle_row.legal_hold_started_at is not null
    and organization_lifecycle_row.legal_hold_released_at is null;

  if organization_lifecycle_row.state <> 'active'::recora_private.data_lifecycle_state then
    if organization_lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state
      and organization_lifecycle_row.restore_eligible
      and organization_lifecycle_row.restore_deadline_at is not null
      and organization_lifecycle_row.restore_deadline_at > clock_timestamp()
      and organization_lifecycle_row.deletion_started_at is null
      and not legal_hold_active
    then
      return query select false, false, true, 'retained_restore_eligible'::text;
      return;
    end if;

    return query select false, false, false, organization_lifecycle_row.state::text;
    return;
  end if;

  if p_project_id is null then
    return query select true, true, false, 'active'::text;
    return;
  end if;

  select count(*) into project_candidate_count
  from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = p_organization_id
    and current_row.project_id = p_project_id;

  if project_candidate_count = 0 then
    return query select true, true, false, 'active'::text;
    return;
  end if;

  if project_candidate_count <> 1 then
    return query select false, false, false, 'ambiguous_lifecycle_state'::text;
    return;
  end if;

  select current_row.* into project_lifecycle_row
  from recora_private.data_lifecycle_current current_row
  where current_row.organization_id = p_organization_id
    and current_row.project_id = p_project_id;

  legal_hold_active := project_lifecycle_row.legal_hold_started_at is not null
    and project_lifecycle_row.legal_hold_released_at is null;

  if project_lifecycle_row.state = 'active'::recora_private.data_lifecycle_state then
    return query select true, true, false, 'active'::text;
    return;
  elsif project_lifecycle_row.state = 'retained'::recora_private.data_lifecycle_state
    and project_lifecycle_row.restore_eligible
    and project_lifecycle_row.restore_deadline_at is not null
    and project_lifecycle_row.restore_deadline_at > clock_timestamp()
    and project_lifecycle_row.deletion_started_at is null
    and not legal_hold_active
  then
    return query select false, false, true, 'retained_restore_eligible'::text;
    return;
  end if;

  return query select false, false, false, project_lifecycle_row.state::text;
end;
$$;

comment on function recora_private.resolve_data_lifecycle_access(uuid, uuid) is
  'Authoritative lifecycle selection for service-role resolution and customer RLS: exactly one active organization lifecycle is the hard customer-access ceiling; a project inherits it unless one exact project row adds a restrictive override. Invalid, missing, and ambiguous scopes fail closed.';

create or replace function recora_private.is_customer_lifecycle_access_allowed(
  p_organization_id uuid,
  p_project_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select resolution.customer_access_allowed
    from recora_private.resolve_data_lifecycle_access(p_organization_id, p_project_id) resolution
  ), false);
$$;

create or replace function recora_private.can_read_organization_identity(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_organization_id is not null
    and (
      ((select auth.role()) = 'anon'
        and (select auth.uid()) is null
        and recora_private.is_demo_organization(target_organization_id))
      or ((select auth.role()) = 'authenticated'
        and (select auth.uid()) is not null
        and recora_private.is_organization_member(target_organization_id))
    );
$$;

create or replace function recora_private.can_read_organization(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select recora_private.can_read_organization_identity(target_organization_id)
    and recora_private.is_customer_lifecycle_access_allowed(target_organization_id, null);
$$;

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
        and recora_private.can_read_organization_identity(project_row.organization_id)
        and recora_private.is_customer_lifecycle_access_allowed(
          project_row.organization_id,
          project_row.id
        )
    );
$$;

drop policy if exists "recora_member_organization_members_select" on public.organization_members;
create policy "recora_member_organization_members_select"
on public.organization_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  and recora_private.can_read_organization(organization_id)
);

create or replace function public.recora_resolve_data_lifecycle_access(
  p_organization_id uuid,
  p_project_id uuid default null
)
returns table (
  customer_access_allowed boolean,
  new_measurement_allowed boolean,
  restore_eligible boolean,
  reason_code text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    resolution.customer_access_allowed,
    resolution.new_measurement_allowed,
    resolution.restore_eligible,
    resolution.reason_code
  from recora_private.resolve_data_lifecycle_access(p_organization_id, p_project_id) resolution;
$$;

revoke all on function recora_private.resolve_data_lifecycle_access(uuid, uuid)
  from public, anon, authenticated;
revoke all on function recora_private.is_customer_lifecycle_access_allowed(uuid, uuid)
  from public, anon, authenticated;
revoke all on function recora_private.can_read_organization_identity(uuid)
  from public, anon, authenticated;
revoke all on function public.recora_resolve_data_lifecycle_access(uuid, uuid)
  from public, anon, authenticated;
revoke all on function recora_audit.is_safe_audit_reason(text)
  from public, anon, authenticated;
revoke all on function recora_audit.is_safe_audit_summary(jsonb)
  from public, anon, authenticated;
revoke all on function recora_audit.is_safe_audit_summary_value(jsonb, integer)
  from public, anon, authenticated;
revoke all on function recora_audit.prevent_operator_event_mutation()
  from public, anon, authenticated;
revoke all on function recora_operator.prevent_command_receipt_mutation()
  from public, anon, authenticated;
grant execute on function public.recora_resolve_data_lifecycle_access(uuid, uuid)
  to service_role;
grant execute on function recora_audit.is_safe_audit_reason(text)
  to service_role;
grant execute on function recora_audit.is_safe_audit_summary(jsonb)
  to service_role;
grant execute on function recora_audit.is_safe_audit_summary_value(jsonb, integer)
  to service_role;

comment on function public.recora_resolve_data_lifecycle_access(uuid, uuid) is
  'Service-role-only lifecycle resolver backed by recora_private.resolve_data_lifecycle_access. It returns only access, measurement, restore booleans and stable reason codes, with organization lifecycle as the hard customer-access ceiling.';

commit;
