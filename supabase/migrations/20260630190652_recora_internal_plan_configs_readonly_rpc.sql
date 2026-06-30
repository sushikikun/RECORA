-- Read-only plan config RPC for /internal/plans.
-- Scope:
-- - Do not expose the private recora_admin schema through Data API settings.
-- - Return only the five current pricing plan definitions needed by /internal/plans.
-- - Keep execution limited to service_role. anon/authenticated must not call this.

set search_path = public, extensions;

create or replace function public.recora_admin_plan_configs_readonly()
returns table (
  plan_code text,
  display_name text,
  status text,
  config jsonb
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select
    plan_configs.plan_code,
    plan_configs.display_name,
    plan_configs.status,
    plan_configs.config
  from recora_admin.plan_configs
  where plan_configs.plan_code in (
    'free_preview',
    'trial_audit',
    'monitor_basic',
    'monitor_standard',
    'monitor_growth'
  )
  order by array_position(
    array[
      'free_preview',
      'trial_audit',
      'monitor_basic',
      'monitor_standard',
      'monitor_growth'
    ]::text[],
    plan_configs.plan_code
  );
$$;

comment on function public.recora_admin_plan_configs_readonly() is
  '/internal/plans read-only RPC. Returns only current public-facing plan metadata for internal admins; does not expose recora_admin tables, secrets, raw AI answers, aggregate copies, or recommendation bodies.';

revoke all on function public.recora_admin_plan_configs_readonly() from public;
revoke all on function public.recora_admin_plan_configs_readonly() from anon;
revoke all on function public.recora_admin_plan_configs_readonly() from authenticated;
grant execute on function public.recora_admin_plan_configs_readonly() to service_role;
