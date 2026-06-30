-- Read-only customer operations RPC for /internal/customer-ops.
-- Scope:
-- - Do not expose the private recora_admin schema through Data API settings.
-- - Return only compact operational state needed by the internal customer ops page.
-- - Keep execution limited to service_role. anon/authenticated must not call this.
-- - Do not return internal note bodies, prompt bodies, raw AI answers, aggregate
--   metric values, recommendation bodies, secrets, tokens, API keys, or DB URLs.

set search_path = public, extensions;

create or replace function public.recora_admin_customer_ops_readonly()
returns table (
  organization_id uuid,
  organization_name text,
  project_id uuid,
  project_name text,
  customer_lifecycle_status text,
  internal_owner text,
  priority text,
  subscription_id uuid,
  subscription_status text,
  plan_code text,
  plan_display_name text,
  billing_mode text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  price_jpy integer,
  billing_type text,
  question_limit integer,
  model_limit integer,
  run_mode text,
  cadence text,
  recommendations_enabled boolean,
  customer_recommendations_visible boolean,
  schedule_id uuid,
  schedule_type text,
  schedule_status text,
  next_run_at timestamptz,
  last_run_at timestamptz,
  latest_batch_status text,
  latest_batch_queued_at timestamptz,
  latest_report_review_status text,
  latest_report_review_updated_at timestamptz
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with customer_base as (
    select
      customer_profiles.organization_id,
      organizations.name as organization_name,
      customer_profiles.project_id as preferred_project_id,
      customer_profiles.lifecycle_status,
      customer_profiles.internal_owner,
      customer_profiles.priority,
      customer_profiles.updated_at
    from recora_admin.customer_profiles
    join public.organizations
      on organizations.id = customer_profiles.organization_id
  ),
  customer_with_project as (
    select
      customer_base.organization_id,
      customer_base.organization_name,
      coalesce(preferred_project.id, first_project.id) as project_id,
      coalesce(preferred_project.name, first_project.name) as project_name,
      customer_base.lifecycle_status,
      customer_base.internal_owner,
      customer_base.priority,
      customer_base.updated_at
    from customer_base
    left join public.projects as preferred_project
      on preferred_project.id = customer_base.preferred_project_id
     and preferred_project.organization_id = customer_base.organization_id
    left join lateral (
      select
        projects.id,
        projects.name
      from public.projects
      where projects.organization_id = customer_base.organization_id
      order by projects.created_at asc, projects.name asc
      limit 1
    ) as first_project on true
  )
  select
    customer.organization_id,
    customer.organization_name,
    customer.project_id,
    customer.project_name,
    customer.lifecycle_status as customer_lifecycle_status,
    customer.internal_owner,
    customer.priority,
    subscription.id as subscription_id,
    subscription.status as subscription_status,
    subscription.plan_code,
    plan_configs.display_name as plan_display_name,
    subscription.billing_mode,
    subscription.current_period_start,
    subscription.current_period_end,
    case
      when plan_configs.config->>'price_jpy' ~ '^[0-9]+$'
        then (plan_configs.config->>'price_jpy')::integer
      else null
    end as price_jpy,
    plan_configs.config->>'billing_type' as billing_type,
    case
      when plan_configs.config->>'question_limit' ~ '^[0-9]+$'
        then (plan_configs.config->>'question_limit')::integer
      else null
    end as question_limit,
    case
      when plan_configs.config->>'model_limit' ~ '^[0-9]+$'
        then (plan_configs.config->>'model_limit')::integer
      else null
    end as model_limit,
    plan_configs.config->>'run_mode' as run_mode,
    plan_configs.config->>'cadence' as cadence,
    case
      when lower(plan_configs.config->>'recommendations_enabled') in ('true', 'false')
        then (plan_configs.config->>'recommendations_enabled')::boolean
      else null
    end as recommendations_enabled,
    case
      when lower(plan_configs.config->>'customer_recommendations_visible') in ('true', 'false')
        then (plan_configs.config->>'customer_recommendations_visible')::boolean
      else null
    end as customer_recommendations_visible,
    schedule.id as schedule_id,
    schedule.schedule_type,
    schedule.status as schedule_status,
    schedule.next_run_at,
    schedule.last_run_at,
    latest_batch.status as latest_batch_status,
    latest_batch.queued_at as latest_batch_queued_at,
    latest_report.status as latest_report_review_status,
    latest_report.updated_at as latest_report_review_updated_at
  from customer_with_project as customer
  left join lateral (
    select
      customer_subscriptions.*
    from recora_admin.customer_subscriptions
    where customer_subscriptions.organization_id = customer.organization_id
      and (
        customer.project_id is null
        or customer_subscriptions.project_id is null
        or customer_subscriptions.project_id = customer.project_id
      )
    order by
      case
        when customer_subscriptions.status in ('active', 'trialing', 'free_diagnostic') then 0
        else 1
      end,
      customer_subscriptions.updated_at desc,
      customer_subscriptions.created_at desc
    limit 1
  ) as subscription on true
  left join recora_admin.plan_configs
    on plan_configs.id = subscription.plan_config_id
  left join lateral (
    select
      measurement_schedules.*
    from recora_admin.measurement_schedules
    where measurement_schedules.organization_id = customer.organization_id
      and (
        customer.project_id is null
        or measurement_schedules.project_id = customer.project_id
      )
      and (
        subscription.id is null
        or measurement_schedules.subscription_id is null
        or measurement_schedules.subscription_id = subscription.id
      )
    order by
      case when measurement_schedules.status = 'active' then 0 else 1 end,
      measurement_schedules.next_run_at nulls last,
      measurement_schedules.updated_at desc
    limit 1
  ) as schedule on true
  left join lateral (
    select
      coalesce(measurement_batches.status, measurement_batch_items.status) as status,
      coalesce(measurement_batches.queued_at, measurement_batch_items.queued_at) as queued_at
    from recora_admin.measurement_batch_items
    left join recora_admin.measurement_batches
      on measurement_batches.id = measurement_batch_items.batch_id
    where measurement_batch_items.organization_id = customer.organization_id
      and (
        customer.project_id is null
        or measurement_batch_items.project_id = customer.project_id
      )
    order by measurement_batch_items.queued_at desc, measurement_batch_items.created_at desc
    limit 1
  ) as latest_batch on true
  left join lateral (
    select
      report_publication_reviews.status,
      report_publication_reviews.updated_at
    from recora_admin.report_publication_reviews
    where report_publication_reviews.organization_id = customer.organization_id
      and (
        customer.project_id is null
        or report_publication_reviews.project_id = customer.project_id
      )
    order by report_publication_reviews.updated_at desc, report_publication_reviews.created_at desc
    limit 1
  ) as latest_report on true
  order by
    case customer.priority
      when 'urgent' then 0
      when 'high' then 1
      when 'normal' then 2
      when 'low' then 3
      else 4
    end,
    customer.organization_name asc;
$$;

comment on function public.recora_admin_customer_ops_readonly() is
  '/internal/customer-ops read-only RPC. Returns compact customer, subscription, schedule, batch, and report-review metadata for internal operators; does not expose recora_admin tables, internal note bodies, secrets, raw AI answers, aggregate values, prompt bodies, or recommendation bodies.';

revoke all on function public.recora_admin_customer_ops_readonly() from public;
revoke all on function public.recora_admin_customer_ops_readonly() from anon;
revoke all on function public.recora_admin_customer_ops_readonly() from authenticated;
grant execute on function public.recora_admin_customer_ops_readonly() to service_role;
