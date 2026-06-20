-- Recora minimal RLS foundation.
-- Goal:
-- - Keep local/public demo dashboards readable.
-- - Prevent real client project data from being readable through anon access.
-- - Leave writes to service-role/CLI/job paths only; no anon/authenticated write
--   policies are created in this migration.

set search_path = public, extensions;

create schema if not exists recora_private;
revoke all on schema recora_private from public;

create or replace function recora_private.is_demo_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations organization_row
    where organization_row.id = target_organization_id
      and organization_row.is_demo is true
      and organization_row.data_environment in ('demo', 'local')
  );
$$;

create or replace function recora_private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members member_row
      where member_row.organization_id = target_organization_id
        and member_row.user_id = (select auth.uid())
    );
$$;

create or replace function recora_private.can_read_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select recora_private.is_demo_organization(target_organization_id)
    or recora_private.is_organization_member(target_organization_id);
$$;

create or replace function recora_private.can_read_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects project_row
    where project_row.id = target_project_id
      and recora_private.can_read_organization(project_row.organization_id)
  );
$$;

create or replace function recora_private.can_read_run(target_run_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.measurement_runs run_row
    where run_row.id = target_run_id
      and recora_private.can_read_project(run_row.project_id)
  );
$$;

create or replace function recora_private.can_read_run_item(target_run_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.run_items run_item_row
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    where run_item_row.id = target_run_item_id
      and recora_private.can_read_project(run_row.project_id)
  );
$$;

create or replace function recora_private.can_read_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ai_conversations conversation_row
    join public.run_items run_item_row on run_item_row.id = conversation_row.run_item_id
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    where conversation_row.id = target_conversation_id
      and recora_private.can_read_project(run_row.project_id)
  );
$$;

revoke all on all functions in schema recora_private from public;
grant usage on schema recora_private to anon, authenticated;
grant execute on function recora_private.is_demo_organization(uuid) to anon, authenticated;
grant execute on function recora_private.is_organization_member(uuid) to anon, authenticated;
grant execute on function recora_private.can_read_organization(uuid) to anon, authenticated;
grant execute on function recora_private.can_read_project(uuid) to anon, authenticated;
grant execute on function recora_private.can_read_run(uuid) to anon, authenticated;
grant execute on function recora_private.can_read_run_item(uuid) to anon, authenticated;
grant execute on function recora_private.can_read_conversation(uuid) to anon, authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.brands enable row level security;
alter table public.personas enable row level security;
alter table public.topics enable row level security;
alter table public.prompts enable row level security;
alter table public.ai_models enable row level security;
alter table public.measurement_runs enable row level security;
alter table public.run_items enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.source_domains enable row level security;
alter table public.brand_mentions enable row level security;
alter table public.citations enable row level security;
alter table public.metric_snapshots enable row level security;
alter table public.recommendations enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.organizations to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant select on public.brands to anon, authenticated;
grant select on public.personas to anon, authenticated;
grant select on public.topics to anon, authenticated;
grant select on public.prompts to anon, authenticated;
grant select on public.ai_models to anon, authenticated;
grant select on public.measurement_runs to anon, authenticated;
grant select on public.run_items to anon, authenticated;
grant select on public.ai_conversations to anon, authenticated;
grant select on public.source_domains to anon, authenticated;
grant select on public.brand_mentions to anon, authenticated;
grant select on public.citations to anon, authenticated;
grant select on public.metric_snapshots to anon, authenticated;
grant select on public.recommendations to anon, authenticated;
grant select on public.organization_members to authenticated;

revoke all on public.organization_members from anon;

revoke insert, update, delete, truncate, references, trigger
on public.organizations,
   public.organization_members,
   public.projects,
   public.brands,
   public.personas,
   public.topics,
   public.prompts,
   public.ai_models,
   public.measurement_runs,
   public.run_items,
   public.ai_conversations,
   public.source_domains,
   public.brand_mentions,
   public.citations,
   public.metric_snapshots,
   public.recommendations
from anon, authenticated;

drop policy if exists "recora_demo_or_member_organizations_select" on public.organizations;
create policy "recora_demo_or_member_organizations_select"
on public.organizations
for select
to anon, authenticated
using (recora_private.can_read_organization(id));

drop policy if exists "recora_member_organization_members_select" on public.organization_members;
create policy "recora_member_organization_members_select"
on public.organization_members
for select
to authenticated
using (recora_private.is_organization_member(organization_id));

drop policy if exists "recora_demo_or_member_projects_select" on public.projects;
create policy "recora_demo_or_member_projects_select"
on public.projects
for select
to anon, authenticated
using (recora_private.can_read_project(id));

drop policy if exists "recora_demo_or_member_brands_select" on public.brands;
create policy "recora_demo_or_member_brands_select"
on public.brands
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_personas_select" on public.personas;
create policy "recora_demo_or_member_personas_select"
on public.personas
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_topics_select" on public.topics;
create policy "recora_demo_or_member_topics_select"
on public.topics
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_prompts_select" on public.prompts;
create policy "recora_demo_or_member_prompts_select"
on public.prompts
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_ai_models_select" on public.ai_models;
create policy "recora_ai_models_select"
on public.ai_models
for select
to anon, authenticated
using (true);

drop policy if exists "recora_demo_or_member_measurement_runs_select" on public.measurement_runs;
create policy "recora_demo_or_member_measurement_runs_select"
on public.measurement_runs
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_run_items_select" on public.run_items;
create policy "recora_demo_or_member_run_items_select"
on public.run_items
for select
to anon, authenticated
using (recora_private.can_read_run(run_id));

drop policy if exists "recora_demo_or_member_ai_conversations_select" on public.ai_conversations;
create policy "recora_demo_or_member_ai_conversations_select"
on public.ai_conversations
for select
to anon, authenticated
using (recora_private.can_read_run_item(run_item_id));

drop policy if exists "recora_demo_or_member_source_domains_select" on public.source_domains;
create policy "recora_demo_or_member_source_domains_select"
on public.source_domains
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_brand_mentions_select" on public.brand_mentions;
create policy "recora_demo_or_member_brand_mentions_select"
on public.brand_mentions
for select
to anon, authenticated
using (recora_private.can_read_conversation(conversation_id));

drop policy if exists "recora_demo_or_member_citations_select" on public.citations;
create policy "recora_demo_or_member_citations_select"
on public.citations
for select
to anon, authenticated
using (recora_private.can_read_conversation(conversation_id));

drop policy if exists "recora_demo_or_member_metric_snapshots_select" on public.metric_snapshots;
create policy "recora_demo_or_member_metric_snapshots_select"
on public.metric_snapshots
for select
to anon, authenticated
using (recora_private.can_read_run(run_id));

drop policy if exists "recora_demo_or_member_recommendations_select" on public.recommendations;
create policy "recora_demo_or_member_recommendations_select"
on public.recommendations
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));
