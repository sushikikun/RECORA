-- Issue #108 / 102-3D versioned plan policy and immutable entitlement history.
-- Existing recora_admin plan/subscription JSON is mutable operational inventory;
-- it is deliberately not backfilled as historical entitlement truth here.

set search_path = public, extensions;

create or replace function recora_private.is_valid_entitlement_document(document jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select document is not null
    and jsonb_typeof(document) = 'object'
    and jsonb_typeof(document->'capabilities') = 'object'
    and jsonb_typeof(document->'limits') = 'object'
    and not exists (
      select 1 from jsonb_each(document->'capabilities') capability
      where jsonb_typeof(capability.value) <> 'boolean'
    )
    and not exists (
      select 1 from jsonb_each(document->'limits') limit_value
      where jsonb_typeof(limit_value.value) <> 'number'
        or (limit_value.value #>> '{}')::numeric < 0
    );
$$;

create table if not exists recora_private.plan_policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  policy_schema_version smallint not null,
  effective_from timestamptz not null,
  effective_until timestamptz,
  policy_document jsonb not null,
  policy_hash text not null,
  supersedes_policy_version_id uuid,
  created_at timestamptz not null default now(),
  constraint plan_policy_versions_policy_key_not_blank check (btrim(policy_key) <> ''),
  constraint plan_policy_versions_schema_version_positive check (policy_schema_version > 0),
  constraint plan_policy_versions_effective_interval_valid check (
    effective_until is null or effective_until > effective_from
  ),
  constraint plan_policy_versions_document_valid check (
    recora_private.is_valid_entitlement_document(policy_document)
  ),
  constraint plan_policy_versions_policy_hash_format check (policy_hash ~ '^[0-9a-f]{64}$'),
  constraint plan_policy_versions_policy_key_hash_unique unique (policy_key, policy_hash),
  constraint plan_policy_versions_supersedes_fkey foreign key (supersedes_policy_version_id)
    references recora_private.plan_policy_versions(id) on delete restrict
);

comment on table recora_private.plan_policy_versions is
  'Append-only versioned plan-policy definitions. A successor is created instead of changing a marketed policy version.';
comment on column recora_private.plan_policy_versions.policy_key is
  'Stable internal policy family identifier, never a customer-visible marketed plan name or billing value.';

create or replace function recora_private.reject_entitlement_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only; create a successor or a new snapshot instead', tg_table_name;
end;
$$;

create or replace function recora_private.validate_plan_policy_version_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  predecessor recora_private.plan_policy_versions%rowtype;
begin
  new.policy_hash = encode(
    extensions.digest(
      convert_to(new.policy_document::text || ':' || new.policy_schema_version::text, 'utf8'),
      'sha256'
    ),
    'hex'
  );

  if new.supersedes_policy_version_id is null then
    return new;
  end if;

  select * into predecessor
  from recora_private.plan_policy_versions
  where id = new.supersedes_policy_version_id;

  if not found then
    raise exception 'Plan policy successor must reference an existing predecessor';
  end if;

  if predecessor.policy_key <> new.policy_key
    or predecessor.effective_from > new.effective_from then
    raise exception 'Plan policy successor must preserve its policy family and move forward in time';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_plan_policy_version_insert on recora_private.plan_policy_versions;
create trigger validate_plan_policy_version_insert
before insert on recora_private.plan_policy_versions
for each row execute function recora_private.validate_plan_policy_version_insert();

drop trigger if exists reject_plan_policy_version_mutation on recora_private.plan_policy_versions;
create trigger reject_plan_policy_version_mutation
before update or delete on recora_private.plan_policy_versions
for each row execute function recora_private.reject_entitlement_history_mutation();

create table if not exists recora_private.entitlement_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid,
  source_contract_reference text,
  plan_policy_version_id uuid not null,
  entitlement_schema_version smallint not null,
  resolved_document jsonb not null,
  effective_from timestamptz not null,
  effective_until timestamptz,
  resolved_at timestamptz not null default now(),
  resolver_version text not null,
  exception_source_reference text,
  exception_reason_reference text,
  idempotency_key text not null,
  scope_key text not null,
  document_hash text not null,
  created_at timestamptz not null default now(),
  constraint entitlement_snapshots_id_organization_id_unique unique (id, organization_id),
  constraint entitlement_snapshots_id_organization_project_id_unique unique (id, organization_id, project_id),
  constraint entitlement_snapshots_scope_idempotency_key_unique unique (scope_key, idempotency_key),
  constraint entitlement_snapshots_organization_fkey foreign key (organization_id)
    references public.organizations(id) on delete restrict,
  constraint entitlement_snapshots_organization_project_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint entitlement_snapshots_plan_policy_version_fkey foreign key (plan_policy_version_id)
    references recora_private.plan_policy_versions(id) on delete restrict,
  constraint entitlement_snapshots_schema_version_positive check (entitlement_schema_version > 0),
  constraint entitlement_snapshots_document_valid check (
    recora_private.is_valid_entitlement_document(resolved_document)
  ),
  constraint entitlement_snapshots_effective_interval_valid check (
    effective_until is null or effective_until > effective_from
  ),
  constraint entitlement_snapshots_resolver_version_not_blank check (btrim(resolver_version) <> ''),
  constraint entitlement_snapshots_idempotency_key_not_blank check (btrim(idempotency_key) <> ''),
  constraint entitlement_snapshots_scope_key_not_blank check (btrim(scope_key) <> ''),
  constraint entitlement_snapshots_document_hash_format check (document_hash ~ '^[0-9a-f]{64}$'),
  constraint entitlement_snapshots_source_reference_not_blank check (
    source_contract_reference is null or btrim(source_contract_reference) <> ''
  ),
  constraint entitlement_snapshots_exception_reference_not_blank check (
    (exception_source_reference is null or btrim(exception_source_reference) <> '')
    and (exception_reason_reference is null or btrim(exception_reason_reference) <> '')
  )
);

comment on table recora_private.entitlement_snapshots is
  'Append-only resolved tenant/project entitlement history. Contract references are opaque and are not resolver output.';
comment on column recora_private.entitlement_snapshots.idempotency_key is
  'Opaque upstream resolution-request identity; a duplicate request cannot create unlimited snapshots in one scope.';

create or replace function recora_private.validate_entitlement_snapshot_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  policy_schema_version smallint;
begin
  new.scope_key = case
    when new.project_id is null then 'organization:' || new.organization_id::text
    else 'project:' || new.project_id::text
  end;
  new.document_hash = encode(
    extensions.digest(
      convert_to(
        new.resolved_document::text
        || ':' || new.entitlement_schema_version::text
        || ':' || new.resolver_version,
        'utf8'
      ),
      'sha256'
    ),
    'hex'
  );

  select version_row.policy_schema_version into policy_schema_version
  from recora_private.plan_policy_versions version_row
  where version_row.id = new.plan_policy_version_id;

  if not found then
    raise exception 'Entitlement snapshot must reference an existing plan-policy version';
  end if;
  if policy_schema_version <> new.entitlement_schema_version then
    raise exception 'Entitlement snapshot schema version must match its plan-policy version';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_entitlement_snapshot_insert on recora_private.entitlement_snapshots;
create trigger validate_entitlement_snapshot_insert
before insert on recora_private.entitlement_snapshots
for each row execute function recora_private.validate_entitlement_snapshot_insert();

drop trigger if exists reject_entitlement_snapshot_mutation on recora_private.entitlement_snapshots;
create trigger reject_entitlement_snapshot_mutation
before update or delete on recora_private.entitlement_snapshots
for each row execute function recora_private.reject_entitlement_history_mutation();

create table if not exists recora_private.current_entitlement_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid,
  snapshot_id uuid not null,
  updated_at timestamptz not null default now(),
  constraint current_entitlement_snapshots_organization_fkey foreign key (organization_id)
    references public.organizations(id) on delete restrict,
  constraint current_entitlement_snapshots_organization_project_fkey foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  constraint current_entitlement_snapshots_snapshot_organization_fkey foreign key (snapshot_id, organization_id)
    references recora_private.entitlement_snapshots(id, organization_id) on delete restrict
);

comment on table recora_private.current_entitlement_snapshots is
  'Mutable organization or project current-snapshot pointer; changing it never mutates the referenced immutable snapshot.';

create unique index if not exists current_entitlement_snapshots_organization_scope_unique
on recora_private.current_entitlement_snapshots (organization_id)
where project_id is null;
create unique index if not exists current_entitlement_snapshots_project_scope_unique
on recora_private.current_entitlement_snapshots (organization_id, project_id)
where project_id is not null;

create or replace function recora_private.validate_current_entitlement_snapshot_pointer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  snapshot_project_id uuid;
begin
  select snapshot_row.project_id into snapshot_project_id
  from recora_private.entitlement_snapshots snapshot_row
  where snapshot_row.id = new.snapshot_id
    and snapshot_row.organization_id = new.organization_id;

  if not found then
    raise exception 'Current entitlement pointer must reference a snapshot in the same organization';
  end if;
  if snapshot_project_id is distinct from new.project_id then
    raise exception 'Current entitlement pointer project scope must exactly match its snapshot scope';
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists validate_current_entitlement_snapshot_pointer on recora_private.current_entitlement_snapshots;
create trigger validate_current_entitlement_snapshot_pointer
before insert or update on recora_private.current_entitlement_snapshots
for each row execute function recora_private.validate_current_entitlement_snapshot_pointer();

alter table recora_private.plan_policy_versions enable row level security;
alter table recora_private.entitlement_snapshots enable row level security;
alter table recora_private.current_entitlement_snapshots enable row level security;
revoke all on recora_private.plan_policy_versions from public, anon, authenticated;
revoke all on recora_private.entitlement_snapshots from public, anon, authenticated;
revoke all on recora_private.current_entitlement_snapshots from public, anon, authenticated;

create or replace function public.recora_resolve_current_entitlement_snapshot(
  p_organization_id uuid,
  p_project_id uuid default null
)
returns table (
  snapshot_id uuid,
  entitlement_schema_version smallint,
  capabilities jsonb,
  limits jsonb,
  resolver_version text,
  snapshot_hash text,
  effective_from timestamptz,
  effective_until timestamptz,
  reason_code text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  candidate_count integer;
  active_count integer;
begin
  if p_organization_id is null then
    return query select null::uuid, null::smallint, null::jsonb, null::jsonb, null::text,
      null::text, null::timestamptz, null::timestamptz, 'invalid_scope'::text;
    return;
  end if;

  if p_project_id is not null and not exists (
    select 1 from public.projects project_row
    where project_row.id = p_project_id and project_row.organization_id = p_organization_id
  ) then
    return query select null::uuid, null::smallint, null::jsonb, null::jsonb, null::text,
      null::text, null::timestamptz, null::timestamptz, 'invalid_scope'::text;
    return;
  end if;

  with candidates as (
    select pointer.snapshot_id,
      case when p_project_id is not null and pointer.project_id = p_project_id then 0 else 1 end as precedence
    from recora_private.current_entitlement_snapshots pointer
    where pointer.organization_id = p_organization_id
      and (pointer.project_id is null or (p_project_id is not null and pointer.project_id = p_project_id))
  ), preferred as (
    select candidate.snapshot_id from candidates candidate
    where candidate.precedence = (select min(candidate_precedence.precedence) from candidates candidate_precedence)
  )
  select count(*), count(*) filter (
    where snapshot_row.effective_from <= now()
      and (snapshot_row.effective_until is null or snapshot_row.effective_until > now())
  ) into candidate_count, active_count
  from preferred pointer
  join recora_private.entitlement_snapshots snapshot_row
    on snapshot_row.id = pointer.snapshot_id and snapshot_row.organization_id = p_organization_id;

  if candidate_count = 0 then
    return query select null::uuid, null::smallint, null::jsonb, null::jsonb, null::text,
      null::text, null::timestamptz, null::timestamptz, 'no_snapshot'::text;
    return;
  end if;
  if candidate_count <> 1 then
    return query select null::uuid, null::smallint, null::jsonb, null::jsonb, null::text,
      null::text, null::timestamptz, null::timestamptz, 'ambiguous_snapshot'::text;
    return;
  end if;
  if active_count <> 1 then
    return query select null::uuid, null::smallint, null::jsonb, null::jsonb, null::text,
      null::text, null::timestamptz, null::timestamptz, 'expired_snapshot'::text;
    return;
  end if;

  return query
  with candidates as (
    select pointer.snapshot_id,
      case when p_project_id is not null and pointer.project_id = p_project_id then 0 else 1 end as precedence
    from recora_private.current_entitlement_snapshots pointer
    where pointer.organization_id = p_organization_id
      and (pointer.project_id is null or (p_project_id is not null and pointer.project_id = p_project_id))
  )
  select snapshot_row.id, snapshot_row.entitlement_schema_version,
    snapshot_row.resolved_document->'capabilities', snapshot_row.resolved_document->'limits',
    snapshot_row.resolver_version, snapshot_row.document_hash,
    snapshot_row.effective_from, snapshot_row.effective_until, 'ok'::text
  from candidates pointer
  join recora_private.entitlement_snapshots snapshot_row
    on snapshot_row.id = pointer.snapshot_id and snapshot_row.organization_id = p_organization_id
  where pointer.precedence = (select min(candidate_precedence.precedence) from candidates candidate_precedence)
    and snapshot_row.effective_from <= now()
    and (snapshot_row.effective_until is null or snapshot_row.effective_until > now());
end;
$$;

comment on function public.recora_resolve_current_entitlement_snapshot(uuid, uuid) is
  'Service-role-only tenant-safe resolver. It returns current capability/limit data and stable reason codes, never contract, subscription, billing, payment, policy, or exception detail.';

create or replace function public.recora_validate_entitlement_snapshot_reference(
  p_organization_id uuid,
  p_project_id uuid,
  p_snapshot_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  snapshot_project_id uuid;
begin
  if p_organization_id is null or p_snapshot_id is null then return 'invalid_scope'; end if;
  if p_project_id is not null and not exists (
    select 1 from public.projects project_row
    where project_row.id = p_project_id and project_row.organization_id = p_organization_id
  ) then return 'invalid_scope'; end if;

  select snapshot_row.project_id into snapshot_project_id
  from recora_private.entitlement_snapshots snapshot_row
  where snapshot_row.id = p_snapshot_id and snapshot_row.organization_id = p_organization_id;

  if not found then return 'invalid_reference'; end if;
  if snapshot_project_id is not null and snapshot_project_id is distinct from p_project_id then
    return 'invalid_reference';
  end if;
  return 'ok';
end;
$$;

comment on function public.recora_validate_entitlement_snapshot_reference(uuid, uuid, uuid) is
  'Service-role-only historical reference validator; it confirms tenant/project scope without returning snapshot, contract, billing, or policy content.';

revoke all on function public.recora_resolve_current_entitlement_snapshot(uuid, uuid)
from public, anon, authenticated;
revoke all on function public.recora_validate_entitlement_snapshot_reference(uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.recora_resolve_current_entitlement_snapshot(uuid, uuid) to service_role;
grant execute on function public.recora_validate_entitlement_snapshot_reference(uuid, uuid, uuid) to service_role;