-- Register the Recora Internal Demo as an internal managed customer.
-- Scope:
-- - Adds or updates the organization-scoped customer profile.
-- - Adds or updates the Monitor Standard subscription for the demo project.
-- - Does not create billing, Stripe linkage, measurement schedules, batches,
--   report publication settings, customer dashboard data, or OpenAI execution.

do $$
declare
  target_organization_id constant uuid := '00000000-0000-4000-8000-000000000001'::uuid;
  target_project_id constant uuid := '3225192b-90c8-4f22-9ef5-3cea64366303'::uuid;
  target_plan_code constant text := 'monitor_standard';
  target_plan_config_id uuid;
  existing_subscription_id uuid;
begin
  select plan_configs.id
    into target_plan_config_id
  from recora_admin.plan_configs
  where plan_configs.plan_code = target_plan_code
    and plan_configs.status = 'active';

  if target_plan_config_id is null then
    raise exception 'Active plan_config not found for %', target_plan_code;
  end if;

  if not exists (
    select 1
    from public.projects
    where projects.id = target_project_id
      and projects.organization_id = target_organization_id
  ) then
    raise exception 'Project % does not belong to organization %', target_project_id, target_organization_id;
  end if;

  insert into recora_admin.customer_profiles (
    organization_id,
    project_id,
    lifecycle_status,
    internal_owner,
    priority,
    notes_summary,
    metadata
  )
  values (
    target_organization_id,
    target_project_id,
    'paid',
    null,
    'normal',
    null,
    '{"source": "internal_demo_setup"}'::jsonb
  )
  on conflict (organization_id) do update
    set
      project_id = excluded.project_id,
      lifecycle_status = excluded.lifecycle_status,
      internal_owner = coalesce(recora_admin.customer_profiles.internal_owner, excluded.internal_owner),
      priority = excluded.priority,
      notes_summary = coalesce(recora_admin.customer_profiles.notes_summary, excluded.notes_summary),
      metadata = coalesce(recora_admin.customer_profiles.metadata, '{}'::jsonb) || excluded.metadata;

  select customer_subscriptions.id
    into existing_subscription_id
  from recora_admin.customer_subscriptions
  where customer_subscriptions.organization_id = target_organization_id
    and customer_subscriptions.project_id = target_project_id
    and customer_subscriptions.plan_code = target_plan_code
  order by customer_subscriptions.created_at asc
  limit 1;

  if existing_subscription_id is null then
    insert into recora_admin.customer_subscriptions (
      organization_id,
      project_id,
      plan_config_id,
      plan_code,
      status,
      billing_mode,
      current_period_start,
      current_period_end,
      entitlement_config,
      metadata
    )
    values (
      target_organization_id,
      target_project_id,
      target_plan_config_id,
      target_plan_code,
      'active',
      'manual',
      '2026-07-01 00:00:00+09'::timestamptz,
      null,
      '{}'::jsonb,
      '{
        "source": "internal_demo_setup",
        "note": "Recora internal demo subscription for Mieruca SEO AI search analysis demo"
      }'::jsonb
    );
  else
    update recora_admin.customer_subscriptions
      set
        plan_config_id = target_plan_config_id,
        plan_code = target_plan_code,
        status = 'active',
        billing_mode = 'manual',
        current_period_start = '2026-07-01 00:00:00+09'::timestamptz,
        current_period_end = null,
        entitlement_config = '{}'::jsonb,
        metadata = coalesce(recora_admin.customer_subscriptions.metadata, '{}'::jsonb) || '{
          "source": "internal_demo_setup",
          "note": "Recora internal demo subscription for Mieruca SEO AI search analysis demo"
        }'::jsonb
    where customer_subscriptions.id = existing_subscription_id;
  end if;
end;
$$;
