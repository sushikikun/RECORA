-- Recora fixed prompt configuration Unit A.
--
-- Scope:
-- - Add nullable fixed-prompt configuration fields to existing projects/prompts.
-- - Enforce structural JSON/scalar contracts and finalized mutation guards.
-- - Do not create application tables, backfill existing rows, materialize prompts,
--   alter seeds, or expose new browser write paths.

set search_path = public, extensions;

alter table public.projects
  add column if not exists prompt_configuration_finalized_at timestamptz,
  add column if not exists prompt_configuration_hash text,
  add column if not exists prompt_configuration_contract_version text,
  add column if not exists prompt_configuration_count integer;

comment on column public.projects.prompt_configuration_finalized_at is
  'Timestamp when the project fixed Prompt configuration is finalized for normal measurement. Nullable for legacy and pre-finalization projects.';

comment on column public.projects.prompt_configuration_hash is
  'Deterministic lowercase SHA-256 hex hash for the finalized fixed Prompt configuration. Nullable until finalization.';

comment on column public.projects.prompt_configuration_contract_version is
  'Contract version that defines the fixed Prompt configuration hash and validation policy. Nullable until finalization.';

comment on column public.projects.prompt_configuration_count is
  'Number of prompts included in the finalized fixed Prompt configuration. Nullable until finalization.';

alter table public.prompts
  add column if not exists intent_key text,
  add column if not exists panel_role text,
  add column if not exists response_shape text,
  add column if not exists candidate_mention_opportunity text,
  add column if not exists ranking_opportunity text,
  add column if not exists metric_eligibility jsonb;

comment on column public.prompts.intent_key is
  'Stable lowercase kebab-case key for grouping Prompt paraphrases that represent the same buyer need. Nullable before project finalization.';

comment on column public.prompts.panel_role is
  'Fixed Prompt panel role. Unit A permits core, robustness, or diagnostic. Nullable before project finalization.';

comment on column public.prompts.response_shape is
  'Expected response shape for fixed Prompt metric eligibility. Nullable before project finalization.';

comment on column public.prompts.candidate_mention_opportunity is
  'Whether the Prompt naturally gives a candidate/brand a mention opportunity. Nullable before project finalization.';

comment on column public.prompts.ranking_opportunity is
  'Whether the Prompt naturally gives candidates a ranking/comparable-set opportunity. Nullable before project finalization.';

comment on column public.prompts.metric_eligibility is
  'Fixed nine-key metric eligibility object. Unit A enforces only the structural contract; semantic consistency belongs to finalization validation.';

create or replace function recora_private.validate_prompt_metric_eligibility()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  document jsonb := new.metric_eligibility;
  required_keys text[] := array[
    'visibility',
    'ranking',
    'sov',
    'sentiment',
    'brand_perception',
    'natural_citation_observation',
    'forced_citation_validation',
    'risk_check',
    'recommendation_input'
  ];
  metric_key text;
  metric_value jsonb;
  reason_codes jsonb;
  reason_value jsonb;
  child_key text;
  top_level_key_count integer;
begin
  if document is null then
    return new;
  end if;

  if jsonb_typeof(document) <> 'object' then
    raise exception
      using
        errcode = '23514',
        message = 'invalid fixed prompt metric_eligibility structure';
  end if;

  select count(*)
  into top_level_key_count
  from jsonb_object_keys(document);

  if top_level_key_count <> array_length(required_keys, 1) then
    raise exception
      using
        errcode = '23514',
        message = 'invalid fixed prompt metric_eligibility structure';
  end if;

  foreach metric_key in array required_keys loop
    if not (document ? metric_key) then
      raise exception
        using
          errcode = '23514',
          message = 'invalid fixed prompt metric_eligibility structure';
    end if;

    metric_value := document -> metric_key;
    if jsonb_typeof(metric_value) <> 'object' then
      raise exception
        using
          errcode = '23514',
          message = 'invalid fixed prompt metric_eligibility structure';
    end if;

    if not (metric_value ? 'state') or not (metric_value ? 'reason_codes') then
      raise exception
        using
          errcode = '23514',
          message = 'invalid fixed prompt metric_eligibility structure';
    end if;

    for child_key in
      select jsonb_object_keys(metric_value)
    loop
      if child_key not in ('state', 'reason_codes') then
        raise exception
          using
            errcode = '23514',
            message = 'invalid fixed prompt metric_eligibility structure';
      end if;
    end loop;

    if metric_value ->> 'state' not in ('eligible', 'excluded') then
      raise exception
        using
          errcode = '23514',
          message = 'invalid fixed prompt metric_eligibility structure';
    end if;

    reason_codes := metric_value -> 'reason_codes';
    if jsonb_typeof(reason_codes) <> 'array' or jsonb_array_length(reason_codes) < 1 then
      raise exception
        using
          errcode = '23514',
          message = 'invalid fixed prompt metric_eligibility structure';
    end if;

    for reason_value in
      select value from jsonb_array_elements(reason_codes) as reason(value)
    loop
      if jsonb_typeof(reason_value) <> 'string' then
        raise exception
          using
            errcode = '23514',
            message = 'invalid fixed prompt metric_eligibility structure';
      end if;

      if btrim(reason_value #>> '{}') = '' then
        raise exception
          using
            errcode = '23514',
            message = 'invalid fixed prompt metric_eligibility structure';
      end if;

      if (reason_value #>> '{}') !~ '^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$' then
        raise exception
          using
            errcode = '23514',
            message = 'invalid fixed prompt metric_eligibility structure';
      end if;
    end loop;
  end loop;

  return new;
end;
$$;

create or replace function recora_private.reject_finalized_prompt_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  finalized_project_id uuid;
begin
  if tg_op = 'DELETE' then
    -- Parent project deletion removes the project row before the child prompt
    -- cascade reaches this trigger. Allow that retention/deletion path while
    -- still blocking ordinary direct Prompt DELETE on finalized projects.
    if not exists (
      select 1 from public.projects project_row where project_row.id = old.project_id
    ) then
      return old;
    end if;

    select project_row.id
    into finalized_project_id
    from public.projects project_row
    where project_row.id = old.project_id
      and project_row.prompt_configuration_finalized_at is not null
    limit 1;
  elsif tg_op = 'INSERT' then
    select project_row.id
    into finalized_project_id
    from public.projects project_row
    where project_row.id = new.project_id
      and project_row.prompt_configuration_finalized_at is not null
    limit 1;
  else
    select project_row.id
    into finalized_project_id
    from public.projects project_row
    where project_row.id in (old.project_id, new.project_id)
      and project_row.prompt_configuration_finalized_at is not null
    limit 1;
  end if;

  if finalized_project_id is not null then
    raise exception
      using
        errcode = '23514',
        message = 'fixed prompt configuration is finalized for project ' || finalized_project_id::text;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function recora_private.reject_finalized_project_config_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.prompt_configuration_finalized_at is not null
    and (
      new.prompt_configuration_finalized_at is distinct from old.prompt_configuration_finalized_at
      or new.prompt_configuration_hash is distinct from old.prompt_configuration_hash
      or new.prompt_configuration_contract_version is distinct from old.prompt_configuration_contract_version
      or new.prompt_configuration_count is distinct from old.prompt_configuration_count
    )
  then
    raise exception
      using
        errcode = '23514',
        message = 'fixed prompt configuration fields are immutable once finalized';
  end if;

  return new;
end;
$$;

revoke all on function recora_private.validate_prompt_metric_eligibility()
  from public, anon, authenticated, service_role;
revoke all on function recora_private.reject_finalized_prompt_mutation()
  from public, anon, authenticated, service_role;
revoke all on function recora_private.reject_finalized_project_config_update()
  from public, anon, authenticated, service_role;

grant select on table public.projects to service_role;
grant select, insert, update, delete on table public.prompts to service_role;
revoke insert, update, delete, truncate, references on table public.projects, public.prompts
  from public, anon, authenticated;

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_prompt_config_consistency_check'
  ) then
    alter table public.projects
      add constraint projects_prompt_config_consistency_check
      check (
        (
          prompt_configuration_finalized_at is null
          and prompt_configuration_hash is null
          and prompt_configuration_contract_version is null
          and prompt_configuration_count is null
        )
        or (
          prompt_configuration_finalized_at is not null
          and prompt_configuration_hash is not null
          and prompt_configuration_contract_version is not null
          and prompt_configuration_count is not null
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_prompt_config_hash_check'
  ) then
    alter table public.projects
      add constraint projects_prompt_config_hash_check
      check (
        prompt_configuration_hash is null
        or prompt_configuration_hash ~ '^[0-9a-f]{64}$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_prompt_config_version_check'
  ) then
    alter table public.projects
      add constraint projects_prompt_config_version_check
      check (
        prompt_configuration_contract_version is null
        or btrim(prompt_configuration_contract_version) <> ''
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_prompt_config_count_check'
  ) then
    alter table public.projects
      add constraint projects_prompt_config_count_check
      check (
        prompt_configuration_count is null
        or prompt_configuration_count >= 1
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_intent_key_check'
  ) then
    alter table public.prompts
      add constraint prompts_intent_key_check
      check (
        intent_key is null
        or intent_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_panel_role_check'
  ) then
    alter table public.prompts
      add constraint prompts_panel_role_check
      check (
        panel_role is null
        or panel_role in ('core', 'robustness', 'diagnostic')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_response_shape_check'
  ) then
    alter table public.prompts
      add constraint prompts_response_shape_check
      check (
        response_shape is null
        or response_shape in (
          'candidate_list',
          'ranked_recommendation',
          'comparative_set',
          'evaluation_criteria',
          'explanatory_answer',
          'evidence_answer',
          'branded_sentiment_answer'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_candidate_mention_opportunity_check'
  ) then
    alter table public.prompts
      add constraint prompts_candidate_mention_opportunity_check
      check (
        candidate_mention_opportunity is null
        or candidate_mention_opportunity in ('direct', 'likely', 'weak', 'none')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_ranking_opportunity_check'
  ) then
    alter table public.prompts
      add constraint prompts_ranking_opportunity_check
      check (
        ranking_opportunity is null
        or ranking_opportunity in ('direct', 'comparable_set', 'weak', 'none')
      );
  end if;
end;
$constraints$;

drop trigger if exists recora_projects_finalized_config_guard on public.projects;
create trigger recora_projects_finalized_config_guard
before update on public.projects
for each row execute function recora_private.reject_finalized_project_config_update();

drop trigger if exists recora_prompts_finalized_project_guard on public.prompts;
create trigger recora_prompts_finalized_project_guard
before insert or update or delete on public.prompts
for each row execute function recora_private.reject_finalized_prompt_mutation();

drop trigger if exists recora_prompts_metric_eligibility_shape_guard on public.prompts;
create trigger recora_prompts_metric_eligibility_shape_guard
before insert or update of metric_eligibility on public.prompts
for each row execute function recora_private.validate_prompt_metric_eligibility();
