-- Issue #107 / 102-3C composite tenant integrity, RLS, grants, and customer/operator boundary.
--
-- This migration is additive and fail closed:
-- - tenant ownership is inventoried before persistent writes;
-- - deep evidence rows carry a project_id derived only from their mandatory parent;
-- - composite foreign keys reject cross-project associations;
-- - authenticated customer reads remain limited to customer-safe legacy surfaces;
-- - raw measurement/provider data and recora_admin stay outside the customer browser boundary.

set search_path = public, extensions;

-- Pre-write inventory. Do not infer, remap, or repair ownership here.
do $inventory$
declare
  root_null_or_orphan_count bigint;
  duplicate_candidate_key_count bigint;
  cross_project_relation_count bigint;
begin
  select count(*)
  into root_null_or_orphan_count
  from (
    select 'projects.organization' as relation_name, project_row.id
    from public.projects project_row
    left join public.organizations organization_row
      on organization_row.id = project_row.organization_id
    where project_row.organization_id is null or organization_row.id is null

    union all

    select 'brands.project', brand_row.id
    from public.brands brand_row
    left join public.projects project_row on project_row.id = brand_row.project_id
    where brand_row.project_id is null or project_row.id is null

    union all

    select 'personas.project', persona_row.id
    from public.personas persona_row
    left join public.projects project_row on project_row.id = persona_row.project_id
    where persona_row.project_id is null or project_row.id is null

    union all

    select 'topics.project', topic_row.id
    from public.topics topic_row
    left join public.projects project_row on project_row.id = topic_row.project_id
    where topic_row.project_id is null or project_row.id is null

    union all

    select 'prompts.project', prompt_row.id
    from public.prompts prompt_row
    left join public.projects project_row on project_row.id = prompt_row.project_id
    where prompt_row.project_id is null or project_row.id is null

    union all

    select 'measurement_runs.project', run_row.id
    from public.measurement_runs run_row
    left join public.projects project_row on project_row.id = run_row.project_id
    where run_row.project_id is null or project_row.id is null

    union all

    select 'source_domains.project', source_row.id
    from public.source_domains source_row
    left join public.projects project_row on project_row.id = source_row.project_id
    where source_row.project_id is null or project_row.id is null

    union all

    select 'recommendations.project', recommendation_row.id
    from public.recommendations recommendation_row
    left join public.projects project_row on project_row.id = recommendation_row.project_id
    where recommendation_row.project_id is null or project_row.id is null
  ) invalid_root;

  if root_null_or_orphan_count > 0 then
    raise exception
      'Issue 107 inventory failed: % tenant root row(s) have null or orphan ownership; map or quarantine explicitly before retrying',
      root_null_or_orphan_count;
  end if;

  select count(*)
  into duplicate_candidate_key_count
  from (
    select 'brands' as table_name, brand_row.id
    from public.brands brand_row
    group by brand_row.id, brand_row.project_id
    having count(*) > 1

    union all

    select 'personas', persona_row.id
    from public.personas persona_row
    group by persona_row.id, persona_row.project_id
    having count(*) > 1

    union all

    select 'topics', topic_row.id
    from public.topics topic_row
    group by topic_row.id, topic_row.project_id
    having count(*) > 1

    union all

    select 'prompts', prompt_row.id
    from public.prompts prompt_row
    group by prompt_row.id, prompt_row.project_id
    having count(*) > 1

    union all

    select 'measurement_runs', run_row.id
    from public.measurement_runs run_row
    group by run_row.id, run_row.project_id
    having count(*) > 1

    union all

    select 'source_domains', source_row.id
    from public.source_domains source_row
    group by source_row.id, source_row.project_id
    having count(*) > 1
  ) duplicate_candidate;

  if duplicate_candidate_key_count > 0 then
    raise exception
      'Issue 107 inventory failed: % duplicate project candidate key(s) found',
      duplicate_candidate_key_count;
  end if;

  select count(*)
  into cross_project_relation_count
  from (
    select 'prompts.topic' as relation_name, prompt_row.id
    from public.prompts prompt_row
    join public.topics topic_row on topic_row.id = prompt_row.topic_id
    where prompt_row.project_id is distinct from topic_row.project_id

    union all

    select 'prompts.persona', prompt_row.id
    from public.prompts prompt_row
    join public.personas persona_row on persona_row.id = prompt_row.persona_id
    where prompt_row.persona_id is not null
      and prompt_row.project_id is distinct from persona_row.project_id

    union all

    select 'run_items.run', run_item_row.id
    from public.run_items run_item_row
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    join public.prompts prompt_row on prompt_row.id = run_item_row.prompt_id
    join public.personas persona_row on persona_row.id = run_item_row.persona_id
    where run_row.project_id is distinct from prompt_row.project_id
       or run_row.project_id is distinct from persona_row.project_id

    union all

    select 'source_domains.owner_brand', source_row.id
    from public.source_domains source_row
    join public.brands brand_row on brand_row.id = source_row.owner_brand_id
    where source_row.owner_brand_id is not null
      and source_row.project_id is distinct from brand_row.project_id

    union all

    select 'brand_mentions.brand', mention_row.id
    from public.brand_mentions mention_row
    join public.ai_conversations conversation_row
      on conversation_row.id = mention_row.conversation_id
    join public.run_items run_item_row on run_item_row.id = conversation_row.run_item_id
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    join public.brands brand_row on brand_row.id = mention_row.brand_id
    where run_row.project_id is distinct from brand_row.project_id

    union all

    select 'citations.brand', citation_row.id
    from public.citations citation_row
    join public.ai_conversations conversation_row
      on conversation_row.id = citation_row.conversation_id
    join public.run_items run_item_row on run_item_row.id = conversation_row.run_item_id
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    join public.brands brand_row on brand_row.id = citation_row.brand_id
    where citation_row.brand_id is not null
      and run_row.project_id is distinct from brand_row.project_id

    union all

    select 'citations.source_domain', citation_row.id
    from public.citations citation_row
    join public.ai_conversations conversation_row
      on conversation_row.id = citation_row.conversation_id
    join public.run_items run_item_row on run_item_row.id = conversation_row.run_item_id
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    join public.source_domains source_row on source_row.id = citation_row.source_domain_id
    where citation_row.source_domain_id is not null
      and run_row.project_id is distinct from source_row.project_id

    union all

    select 'metric_snapshots.brand', snapshot_row.id
    from public.metric_snapshots snapshot_row
    join public.measurement_runs run_row on run_row.id = snapshot_row.run_id
    join public.brands brand_row on brand_row.id = snapshot_row.brand_id
    where snapshot_row.brand_id is not null
      and run_row.project_id is distinct from brand_row.project_id

    union all

    select 'metric_snapshots.scope', snapshot_row.id
    from public.metric_snapshots snapshot_row
    join public.measurement_runs run_row on run_row.id = snapshot_row.run_id
    where snapshot_row.scope_id is not null
      and not (
        case snapshot_row.scope_type::text
          when 'project' then snapshot_row.scope_id = run_row.project_id
          when 'brand' then exists (
            select 1 from public.brands scoped_row
            where scoped_row.id = snapshot_row.scope_id
              and scoped_row.project_id = run_row.project_id
          )
          when 'topic' then exists (
            select 1 from public.topics scoped_row
            where scoped_row.id = snapshot_row.scope_id
              and scoped_row.project_id = run_row.project_id
          )
          when 'persona' then exists (
            select 1 from public.personas scoped_row
            where scoped_row.id = snapshot_row.scope_id
              and scoped_row.project_id = run_row.project_id
          )
          when 'model' then exists (
            select 1 from public.ai_models scoped_row
            where scoped_row.id = snapshot_row.scope_id
          )
          when 'prompt' then exists (
            select 1 from public.prompts scoped_row
            where scoped_row.id = snapshot_row.scope_id
              and scoped_row.project_id = run_row.project_id
          )
          when 'source_domain' then exists (
            select 1 from public.source_domains scoped_row
            where scoped_row.id = snapshot_row.scope_id
              and scoped_row.project_id = run_row.project_id
          )
          else false
        end
      )

    union all

    select 'recommendations.run', recommendation_row.id
    from public.recommendations recommendation_row
    join public.measurement_runs run_row on run_row.id = recommendation_row.run_id
    where recommendation_row.run_id is not null
      and recommendation_row.project_id is distinct from run_row.project_id

    union all

    select 'recommendations.topic', recommendation_row.id
    from public.recommendations recommendation_row
    join public.topics topic_row on topic_row.id = recommendation_row.related_topic_id
    where recommendation_row.related_topic_id is not null
      and recommendation_row.project_id is distinct from topic_row.project_id

    union all

    select 'recommendations.prompt', recommendation_row.id
    from public.recommendations recommendation_row
    join public.prompts prompt_row on prompt_row.id = recommendation_row.related_prompt_id
    where recommendation_row.related_prompt_id is not null
      and recommendation_row.project_id is distinct from prompt_row.project_id
  ) cross_project_relation;

  if cross_project_relation_count > 0 then
    raise exception
      'Issue 107 inventory failed: % cross-project relation(s) found; repair explicitly before retrying',
      cross_project_relation_count;
  end if;

  raise notice
    'Issue 107 pre-write inventory passed: null/orphan roots=0, duplicate candidate keys=0, cross-project relations=0';
end;
$inventory$;

-- Carry project ownership on externally addressable evidence rows. The columns
-- begin nullable only for deterministic backfill from mandatory parents.
alter table public.run_items
  add column if not exists project_id uuid;
alter table public.ai_conversations
  add column if not exists project_id uuid;
alter table public.brand_mentions
  add column if not exists project_id uuid;
alter table public.citations
  add column if not exists project_id uuid;
alter table public.metric_snapshots
  add column if not exists project_id uuid;

update public.run_items child_row
set project_id = parent_row.project_id
from public.measurement_runs parent_row
where parent_row.id = child_row.run_id
  and child_row.project_id is null;

update public.ai_conversations child_row
set project_id = parent_row.project_id
from public.run_items parent_row
where parent_row.id = child_row.run_item_id
  and child_row.project_id is null;

update public.brand_mentions child_row
set project_id = parent_row.project_id
from public.ai_conversations parent_row
where parent_row.id = child_row.conversation_id
  and child_row.project_id is null;

update public.citations child_row
set project_id = parent_row.project_id
from public.ai_conversations parent_row
where parent_row.id = child_row.conversation_id
  and child_row.project_id is null;

update public.metric_snapshots child_row
set project_id = parent_row.project_id
from public.measurement_runs parent_row
where parent_row.id = child_row.run_id
  and child_row.project_id is null;

do $backfill_check$
declare
  unresolved_count bigint;
  mismatched_count bigint;
begin
  select
    (select count(*) from public.run_items where project_id is null)
    + (select count(*) from public.ai_conversations where project_id is null)
    + (select count(*) from public.brand_mentions where project_id is null)
    + (select count(*) from public.citations where project_id is null)
    + (select count(*) from public.metric_snapshots where project_id is null)
  into unresolved_count;

  if unresolved_count > 0 then
    raise exception
      'Issue 107 backfill failed: % evidence row(s) could not derive project ownership from a mandatory parent',
      unresolved_count;
  end if;

  select count(*)
  into mismatched_count
  from (
    select run_item_row.id
    from public.run_items run_item_row
    join public.measurement_runs run_row on run_row.id = run_item_row.run_id
    where run_item_row.project_id is distinct from run_row.project_id

    union all

    select conversation_row.id
    from public.ai_conversations conversation_row
    join public.run_items run_item_row on run_item_row.id = conversation_row.run_item_id
    where conversation_row.project_id is distinct from run_item_row.project_id

    union all

    select mention_row.id
    from public.brand_mentions mention_row
    join public.ai_conversations conversation_row
      on conversation_row.id = mention_row.conversation_id
    where mention_row.project_id is distinct from conversation_row.project_id

    union all

    select citation_row.id
    from public.citations citation_row
    join public.ai_conversations conversation_row
      on conversation_row.id = citation_row.conversation_id
    where citation_row.project_id is distinct from conversation_row.project_id

    union all

    select snapshot_row.id
    from public.metric_snapshots snapshot_row
    join public.measurement_runs run_row on run_row.id = snapshot_row.run_id
    where snapshot_row.project_id is distinct from run_row.project_id
  ) mismatch;

  if mismatched_count > 0 then
    raise exception
      'Issue 107 backfill failed: % evidence row(s) conflict with mandatory-parent project ownership',
      mismatched_count;
  end if;
end;
$backfill_check$;

alter table public.run_items alter column project_id set not null;
alter table public.ai_conversations alter column project_id set not null;
alter table public.brand_mentions alter column project_id set not null;
alter table public.citations alter column project_id set not null;
alter table public.metric_snapshots alter column project_id set not null;

comment on column public.run_items.project_id is
  'Tenant project derived from measurement_runs; caller-supplied mismatches are rejected.';
comment on column public.ai_conversations.project_id is
  'Tenant project derived from run_items; caller-supplied mismatches are rejected.';
comment on column public.brand_mentions.project_id is
  'Tenant project derived from ai_conversations; composite FKs keep brand evidence in one project.';
comment on column public.citations.project_id is
  'Tenant project derived from ai_conversations; composite FKs keep citation evidence in one project.';
comment on column public.metric_snapshots.project_id is
  'Tenant project derived from measurement_runs; scope references are validated against it.';

-- Candidate keys and composite FKs are additive. Existing single-column FKs stay
-- in place for compatibility and delete semantics.
do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.brands'::regclass
      and conname = 'brands_id_project_id_unique'
  ) then
    alter table public.brands
      add constraint brands_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.personas'::regclass
      and conname = 'personas_id_project_id_unique'
  ) then
    alter table public.personas
      add constraint personas_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.topics'::regclass
      and conname = 'topics_id_project_id_unique'
  ) then
    alter table public.topics
      add constraint topics_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.run_items'::regclass
      and conname = 'run_items_id_project_id_unique'
  ) then
    alter table public.run_items
      add constraint run_items_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ai_conversations'::regclass
      and conname = 'ai_conversations_id_project_id_unique'
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_domains'::regclass
      and conname = 'source_domains_id_project_id_unique'
  ) then
    alter table public.source_domains
      add constraint source_domains_id_project_id_unique unique (id, project_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_topic_project_fkey'
  ) then
    alter table public.prompts
      add constraint prompts_topic_project_fkey
      foreign key (topic_id, project_id)
      references public.topics(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_persona_project_fkey'
  ) then
    alter table public.prompts
      add constraint prompts_persona_project_fkey
      foreign key (persona_id, project_id)
      references public.personas(id, project_id)
      on delete set null (persona_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.run_items'::regclass
      and conname = 'run_items_run_project_fkey'
  ) then
    alter table public.run_items
      add constraint run_items_run_project_fkey
      foreign key (run_id, project_id)
      references public.measurement_runs(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.run_items'::regclass
      and conname = 'run_items_prompt_project_fkey'
  ) then
    alter table public.run_items
      add constraint run_items_prompt_project_fkey
      foreign key (prompt_id, project_id)
      references public.prompts(id, project_id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.run_items'::regclass
      and conname = 'run_items_persona_project_fkey'
  ) then
    alter table public.run_items
      add constraint run_items_persona_project_fkey
      foreign key (persona_id, project_id)
      references public.personas(id, project_id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ai_conversations'::regclass
      and conname = 'ai_conversations_run_item_project_fkey'
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_run_item_project_fkey
      foreign key (run_item_id, project_id)
      references public.run_items(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_domains'::regclass
      and conname = 'source_domains_owner_brand_project_fkey'
  ) then
    alter table public.source_domains
      add constraint source_domains_owner_brand_project_fkey
      foreign key (owner_brand_id, project_id)
      references public.brands(id, project_id)
      on delete set null (owner_brand_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.brand_mentions'::regclass
      and conname = 'brand_mentions_conversation_project_fkey'
  ) then
    alter table public.brand_mentions
      add constraint brand_mentions_conversation_project_fkey
      foreign key (conversation_id, project_id)
      references public.ai_conversations(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.brand_mentions'::regclass
      and conname = 'brand_mentions_brand_project_fkey'
  ) then
    alter table public.brand_mentions
      add constraint brand_mentions_brand_project_fkey
      foreign key (brand_id, project_id)
      references public.brands(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.citations'::regclass
      and conname = 'citations_conversation_project_fkey'
  ) then
    alter table public.citations
      add constraint citations_conversation_project_fkey
      foreign key (conversation_id, project_id)
      references public.ai_conversations(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.citations'::regclass
      and conname = 'citations_brand_project_fkey'
  ) then
    alter table public.citations
      add constraint citations_brand_project_fkey
      foreign key (brand_id, project_id)
      references public.brands(id, project_id)
      on delete set null (brand_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.citations'::regclass
      and conname = 'citations_source_domain_project_fkey'
  ) then
    alter table public.citations
      add constraint citations_source_domain_project_fkey
      foreign key (source_domain_id, project_id)
      references public.source_domains(id, project_id)
      on delete set null (source_domain_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.metric_snapshots'::regclass
      and conname = 'metric_snapshots_run_project_fkey'
  ) then
    alter table public.metric_snapshots
      add constraint metric_snapshots_run_project_fkey
      foreign key (run_id, project_id)
      references public.measurement_runs(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.metric_snapshots'::regclass
      and conname = 'metric_snapshots_brand_project_fkey'
  ) then
    alter table public.metric_snapshots
      add constraint metric_snapshots_brand_project_fkey
      foreign key (brand_id, project_id)
      references public.brands(id, project_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recommendations'::regclass
      and conname = 'recommendations_run_project_fkey'
  ) then
    alter table public.recommendations
      add constraint recommendations_run_project_fkey
      foreign key (run_id, project_id)
      references public.measurement_runs(id, project_id)
      on delete set null (run_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recommendations'::regclass
      and conname = 'recommendations_topic_project_fkey'
  ) then
    alter table public.recommendations
      add constraint recommendations_topic_project_fkey
      foreign key (related_topic_id, project_id)
      references public.topics(id, project_id)
      on delete set null (related_topic_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recommendations'::regclass
      and conname = 'recommendations_prompt_project_fkey'
  ) then
    alter table public.recommendations
      add constraint recommendations_prompt_project_fkey
      foreign key (related_prompt_id, project_id)
      references public.prompts(id, project_id)
      on delete set null (related_prompt_id);
  end if;
end;
$constraints$;

create index if not exists run_items_project_id_idx
  on public.run_items (project_id);
create index if not exists ai_conversations_project_id_idx
  on public.ai_conversations (project_id);
create index if not exists brand_mentions_project_id_idx
  on public.brand_mentions (project_id);
create index if not exists citations_project_id_idx
  on public.citations (project_id);
create index if not exists metric_snapshots_project_id_idx
  on public.metric_snapshots (project_id);

-- Compatibility trigger: legacy service writers may omit the new project_id,
-- but they may never choose or override it. The mandatory parent is authoritative.
create or replace function recora_private.assign_project_id_from_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  derived_project_id uuid;
begin
  if tg_table_schema <> 'public' then
    raise exception 'Issue 107 project derivation rejected unexpected schema %', tg_table_schema;
  end if;

  case tg_table_name
    when 'run_items' then
      select parent_row.project_id
      into derived_project_id
      from public.measurement_runs parent_row
      where parent_row.id = new.run_id;
    when 'ai_conversations' then
      select parent_row.project_id
      into derived_project_id
      from public.run_items parent_row
      where parent_row.id = new.run_item_id;
    when 'brand_mentions' then
      select parent_row.project_id
      into derived_project_id
      from public.ai_conversations parent_row
      where parent_row.id = new.conversation_id;
    when 'citations' then
      select parent_row.project_id
      into derived_project_id
      from public.ai_conversations parent_row
      where parent_row.id = new.conversation_id;
    when 'metric_snapshots' then
      select parent_row.project_id
      into derived_project_id
      from public.measurement_runs parent_row
      where parent_row.id = new.run_id;
    else
      raise exception 'Issue 107 project derivation rejected unsupported table %', tg_table_name;
  end case;

  if derived_project_id is null then
    raise exception using
      errcode = '23503',
      message = format(
        'Issue 107 project derivation failed: mandatory parent missing for public.%s',
        tg_table_name
      );
  end if;

  if new.project_id is not null
     and new.project_id is distinct from derived_project_id then
    raise exception using
      errcode = '23514',
      message = format(
        'Issue 107 project derivation rejected caller-supplied project substitution on public.%s',
        tg_table_name
      );
  end if;

  new.project_id := derived_project_id;
  return new;
end;
$$;

revoke all on function recora_private.assign_project_id_from_parent()
from public, anon, authenticated;

do $derivation_triggers$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.run_items'::regclass
      and tgname = 'recora_assign_project_id'
      and not tgisinternal
  ) then
    create trigger recora_assign_project_id
    before insert or update of run_id, project_id on public.run_items
    for each row execute function recora_private.assign_project_id_from_parent();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.ai_conversations'::regclass
      and tgname = 'recora_assign_project_id'
      and not tgisinternal
  ) then
    create trigger recora_assign_project_id
    before insert or update of run_item_id, project_id on public.ai_conversations
    for each row execute function recora_private.assign_project_id_from_parent();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.brand_mentions'::regclass
      and tgname = 'recora_assign_project_id'
      and not tgisinternal
  ) then
    create trigger recora_assign_project_id
    before insert or update of conversation_id, project_id on public.brand_mentions
    for each row execute function recora_private.assign_project_id_from_parent();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.citations'::regclass
      and tgname = 'recora_assign_project_id'
      and not tgisinternal
  ) then
    create trigger recora_assign_project_id
    before insert or update of conversation_id, project_id on public.citations
    for each row execute function recora_private.assign_project_id_from_parent();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.metric_snapshots'::regclass
      and tgname = 'recora_assign_project_id'
      and not tgisinternal
  ) then
    create trigger recora_assign_project_id
    before insert or update of run_id, project_id on public.metric_snapshots
    for each row execute function recora_private.assign_project_id_from_parent();
  end if;
end;
$derivation_triggers$;

-- metric_snapshots.scope_id is polymorphic, so it cannot use one physical FK.
-- Validate every non-null scope against the run-derived project instead.
create or replace function recora_private.enforce_metric_snapshot_scope_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  scope_is_valid boolean;
begin
  if new.scope_id is null then
    return new;
  end if;

  scope_is_valid := case new.scope_type::text
    when 'project' then new.scope_id = new.project_id
    when 'brand' then exists (
      select 1 from public.brands scoped_row
      where scoped_row.id = new.scope_id
        and scoped_row.project_id = new.project_id
    )
    when 'topic' then exists (
      select 1 from public.topics scoped_row
      where scoped_row.id = new.scope_id
        and scoped_row.project_id = new.project_id
    )
    when 'persona' then exists (
      select 1 from public.personas scoped_row
      where scoped_row.id = new.scope_id
        and scoped_row.project_id = new.project_id
    )
    when 'model' then exists (
      select 1 from public.ai_models scoped_row
      where scoped_row.id = new.scope_id
    )
    when 'prompt' then exists (
      select 1 from public.prompts scoped_row
      where scoped_row.id = new.scope_id
        and scoped_row.project_id = new.project_id
    )
    when 'source_domain' then exists (
      select 1 from public.source_domains scoped_row
      where scoped_row.id = new.scope_id
        and scoped_row.project_id = new.project_id
    )
    else false
  end;

  if not coalesce(scope_is_valid, false) then
    raise exception using
      errcode = '23514',
      message = 'Issue 107 metric scope rejected cross-project or missing scope reference';
  end if;

  return new;
end;
$$;

revoke all on function recora_private.enforce_metric_snapshot_scope_project()
from public, anon, authenticated;

do $metric_scope_trigger$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.metric_snapshots'::regclass
      and tgname = 'recora_enforce_metric_scope_project'
      and not tgisinternal
  ) then
    create constraint trigger recora_enforce_metric_scope_project
    after insert or update of project_id, scope_type, scope_id
    on public.metric_snapshots
    deferrable initially immediate
    for each row execute function recora_private.enforce_metric_snapshot_scope_project();
  end if;
end;
$metric_scope_trigger$;

-- Keep the recommendation publication predicate self-contained in the latest
-- boundary migration so policy replay cannot depend on an earlier definition.
create or replace function recora_private.is_customer_visible_recommendation(
  recommendation_status public.recora_recommendation_state,
  recommendation_metadata jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with tokens as (
    select
      lower(btrim(coalesce(recommendation_status::text, ''))) as status_token,
      lower(btrim(coalesce(recommendation_metadata->>'display_decision', ''))) as display_decision,
      lower(btrim(coalesce(recommendation_metadata->>'should_save_to_recommendations', ''))) as should_save,
      lower(btrim(coalesce(
        recommendation_metadata->>'quality_gate_decision',
        recommendation_metadata->>'gate_decision',
        recommendation_metadata->>'decision',
        ''
      ))) as quality_decision,
      lower(btrim(coalesce(
        recommendation_metadata->>'publication_state',
        recommendation_metadata->>'customer_visibility',
        recommendation_metadata->>'display_stage',
        ''
      ))) as publication_state
  )
  select
    not (
      status_token in ('dismiss', 'dismissed', 'reject', 'rejected', 'hide', 'hidden', 'suppress')
      or display_decision in ('hide', 'hidden', 'suppress')
      or quality_decision = 'suppress'
      or publication_state in ('hidden_internal', 'hide', 'hidden', 'suppress')
      or quality_decision = 'hold'
      or should_save = 'review_required'
      or status_token in ('hold', 'review_required')
      or should_save = 'candidate_only'
      or status_token = 'candidate_only'
      or publication_state in ('review_required', 'candidate_only', 'pre_quality_gate')
      or publication_state not in ('', 'customer_visible', 'published', 'client_visible')
    )
    and (
      publication_state in ('customer_visible', 'published', 'client_visible')
      or (quality_decision = 'auto_publish' and display_decision = 'show')
    )
  from tokens;
$$;

comment on function recora_private.is_customer_visible_recommendation(
  public.recora_recommendation_state,
  jsonb
) is
  'Returns true only for recommendation rows that are safe for customer-facing Data API reads.';

revoke all on function recora_private.is_customer_visible_recommendation(public.recora_recommendation_state, jsonb)
from public;

-- RLS helpers derive tenant access from the verified request role, database
-- ownership, and accepted active membership. The demo predicate is
-- intentionally anon-only: authenticated callers must satisfy their own
-- accepted active membership and a non-null identity. Missing, unknown, or
-- inconsistent role/identity claims fail closed. No organization identifier
-- supplied by the caller is trusted.
create or replace function recora_private.can_read_organization(
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
  select target_run_id is not null
    and exists (
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
  select target_run_item_id is not null
    and exists (
      select 1
      from public.run_items run_item_row
      where run_item_row.id = target_run_item_id
        and recora_private.can_read_project(run_item_row.project_id)
    );
$$;

create or replace function recora_private.can_read_conversation(
  target_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_conversation_id is not null
    and exists (
      select 1
      from public.ai_conversations conversation_row
      where conversation_row.id = target_conversation_id
        and recora_private.can_read_project(conversation_row.project_id)
    );
$$;

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
using (
  user_id = (select auth.uid())
  and recora_private.is_organization_member(organization_id)
);

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
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_ai_conversations_select" on public.ai_conversations;
create policy "recora_demo_or_member_ai_conversations_select"
on public.ai_conversations
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

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
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_citations_select" on public.citations;
create policy "recora_demo_or_member_citations_select"
on public.citations
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_metric_snapshots_select" on public.metric_snapshots;
create policy "recora_demo_or_member_metric_snapshots_select"
on public.metric_snapshots
for select
to anon, authenticated
using (recora_private.can_read_project(project_id));

drop policy if exists "recora_demo_or_member_recommendations_select" on public.recommendations;
create policy "recora_demo_or_member_recommendations_select"
on public.recommendations
for select
to anon, authenticated
using (
  recora_private.can_read_project(project_id)
  and recora_private.is_customer_visible_recommendation(status, metadata)
);

-- Explicit grants. Browser roles have no writes and no sequence access. The
-- authenticated role does not directly read raw measurement/provider tables;
-- Phase 7/8 must supply the customer-safe published read model.
grant usage on schema public to anon, authenticated;

revoke all on
  public.organizations,
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

revoke all on all sequences in schema public from anon, authenticated;

grant select on
  public.organizations,
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
to anon;

grant select on
  public.organizations,
  public.organization_members,
  public.projects,
  public.brands,
  public.personas,
  public.topics,
  public.ai_models
to authenticated;

grant select (
  id,
  project_id,
  type,
  priority,
  impact_score,
  effort_score,
  title,
  reason,
  target_url,
  related_topic_id,
  related_prompt_id,
  status,
  created_at,
  updated_at
) on public.recommendations to authenticated;

-- Private helpers are callable only where RLS or the accepted membership
-- contract requires them. recora_private is not an exposed Data API schema.
revoke all on schema recora_private from public;
grant usage on schema recora_private to anon, authenticated;
revoke all on all functions in schema recora_private
from public, anon, authenticated;

grant execute on function recora_private.is_demo_organization(uuid)
to anon, authenticated;
grant execute on function recora_private.is_organization_member(uuid)
to anon, authenticated;
grant execute on function recora_private.can_read_organization(uuid)
to anon, authenticated;
grant execute on function recora_private.can_read_project(uuid)
to anon, authenticated;
grant execute on function recora_private.can_read_run(uuid)
to anon, authenticated;
grant execute on function recora_private.can_read_run_item(uuid)
to anon, authenticated;
grant execute on function recora_private.can_read_conversation(uuid)
to anon, authenticated;
grant execute on function recora_private.is_customer_visible_recommendation(public.recora_recommendation_state, jsonb)
to anon, authenticated;
grant execute on function recora_private.resolve_unambiguous_organization_id()
to authenticated;

-- Operator/control objects remain server-only capabilities. This task does not
-- create operator identity or permission models (102-3E).
revoke all on schema recora_admin from public, anon, authenticated;
revoke all on all tables in schema recora_admin from public, anon, authenticated;
revoke all on all sequences in schema recora_admin from public, anon, authenticated;
revoke all on all functions in schema recora_admin from public, anon, authenticated;

revoke all on function public.recora_admin_plan_configs_readonly()
from public, anon, authenticated;
revoke all on function public.recora_admin_customer_ops_readonly()
from public, anon, authenticated;
revoke all on function public.set_updated_at()
from public, anon, authenticated;

do $migration_summary$
begin
  raise notice
    'Issue 107 composite tenant isolation complete: run_items=%, conversations=%, mentions=%, citations=%, snapshots=%',
    (select count(*) from public.run_items),
    (select count(*) from public.ai_conversations),
    (select count(*) from public.brand_mentions),
    (select count(*) from public.citations),
    (select count(*) from public.metric_snapshots);
end;
$migration_summary$;
