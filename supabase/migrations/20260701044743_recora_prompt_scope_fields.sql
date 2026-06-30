-- Recora prompt scope local schema preparation.
--
-- Scope:
-- - Add nullable prompt scope fields to the prompt definition table.
-- - Keep this local migration additive and backward-compatible.
--
-- Important:
-- - No default values.
-- - No NOT NULL constraints.
-- - No row updates or backfill.
-- - No metric recalculation.
-- - Remote Supabase apply must be handled in a separate approved PR.

alter table public.prompts
  add column if not exists prompt_type text;

alter table public.prompts
  add column if not exists measurement_purpose text;

comment on column public.prompts.prompt_type is
  'Recora prompt scope type. Nullable during local schema preparation; remote apply and backfill are separate approved steps.';

comment on column public.prompts.measurement_purpose is
  'Recora measurement purpose. Nullable during local schema preparation; remote apply and backfill are separate approved steps.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_prompt_type_check'
  ) then
    alter table public.prompts
      add constraint prompts_prompt_type_check
      check (
        prompt_type is null
        or prompt_type in (
          'non_branded',
          'branded',
          'comparison_generic',
          'comparison_named',
          'competitor_named',
          'citation_check'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_measurement_purpose_check'
  ) then
    alter table public.prompts
      add constraint prompts_measurement_purpose_check
      check (
        measurement_purpose is null
        or measurement_purpose in (
          'visibility',
          'ranking',
          'sov',
          'sentiment',
          'brand_perception',
          'citation_validation',
          'recommendation_input'
        )
      );
  end if;
end;
$$;
