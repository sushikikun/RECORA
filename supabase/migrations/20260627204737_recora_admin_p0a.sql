-- Recora admin DB P0-A.
-- Scope:
-- - Create the private recora_admin schema.
-- - Add P0-A operational tables only.
-- - Keep diagnosis results, raw AI answers, metric snapshots, and
--   recommendation bodies in existing public measurement tables.
-- - Do not create customer-facing read models, batch tables, report
--   publication tables, prompt change tables, or internal notes.

set search_path = public, extensions;

create schema if not exists recora_admin;

comment on schema recora_admin is
  'Private Recora admin schema for internal operational metadata. Not exposed to customer dashboards or public Data API schemas.';

revoke all on schema recora_admin from public;
revoke all on schema recora_admin from anon;
revoke all on schema recora_admin from authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_id_organization_id_unique'
  ) then
    alter table public.projects
      add constraint projects_id_organization_id_unique unique (id, organization_id);
  end if;
end;
$$;

create table recora_admin.plan_configs (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null,
  display_name text not null,
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_configs_plan_code_unique unique (plan_code),
  constraint plan_configs_plan_code_format check (plan_code ~ '^[a-z0-9]([a-z0-9_]*[a-z0-9])?$'),
  constraint plan_configs_display_name_not_blank check (btrim(display_name) <> ''),
  constraint plan_configs_status_check check (status in ('draft', 'active', 'archived')),
  constraint plan_configs_config_is_object check (jsonb_typeof(config) = 'object')
);

comment on table recora_admin.plan_configs is
  'Internal plan definitions. Mutable limits, visibility ranges, pricing, and feature entitlements belong in config, not fixed columns.';

comment on column recora_admin.plan_configs.config is
  'JSON object for mutable plan settings. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate copies, or recommendation bodies.';

create table recora_admin.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid,
  lifecycle_status text not null default 'lead',
  internal_owner text,
  priority text default 'normal',
  notes_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_profiles_organization_id_unique unique (organization_id),
  constraint customer_profiles_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict,
  constraint customer_profiles_organization_project_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint customer_profiles_lifecycle_status_check check (
    lifecycle_status in ('lead', 'free_diagnostic', 'trial', 'paid', 'paused', 'churned', 'rejected')
  ),
  constraint customer_profiles_priority_check check (
    priority is null or priority in ('low', 'normal', 'high', 'urgent')
  ),
  constraint customer_profiles_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table recora_admin.customer_profiles is
  'Internal customer lifecycle metadata that supplements public.organizations and public.projects. Does not store diagnosis result bodies.';

comment on column recora_admin.customer_profiles.metadata is
  'Internal operational metadata only. Must not store secrets, raw AI answers, aggregate copies, recommendation bodies, or unnecessary PII.';

create table recora_admin.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid,
  plan_config_id uuid not null,
  plan_code text not null,
  status text not null default 'free_diagnostic',
  billing_mode text not null default 'manual',
  current_period_start timestamptz,
  current_period_end timestamptz,
  entitlement_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_subscriptions_id_organization_id_unique unique (id, organization_id),
  constraint customer_subscriptions_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict,
  constraint customer_subscriptions_organization_project_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint customer_subscriptions_plan_config_id_fkey
    foreign key (plan_config_id) references recora_admin.plan_configs(id) on delete restrict,
  constraint customer_subscriptions_plan_code_format check (plan_code ~ '^[a-z0-9]([a-z0-9_]*[a-z0-9])?$'),
  constraint customer_subscriptions_status_check check (
    status in ('free_diagnostic', 'trialing', 'active', 'past_due', 'paused', 'canceled', 'suspended', 'ended')
  ),
  constraint customer_subscriptions_billing_mode_check check (billing_mode in ('manual', 'stripe', 'none')),
  constraint customer_subscriptions_period_order check (
    current_period_start is null
    or current_period_end is null
    or current_period_end >= current_period_start
  ),
  constraint customer_subscriptions_entitlement_config_is_object check (jsonb_typeof(entitlement_config) = 'object'),
  constraint customer_subscriptions_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table recora_admin.customer_subscriptions is
  'Internal customer plan assignment and subscription state. Stripe integration and billing implementation are out of scope for P0-A.';

comment on column recora_admin.customer_subscriptions.entitlement_config is
  'JSON object for mutable customer-specific entitlement settings. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate copies, or recommendation bodies.';

create table recora_admin.diagnostic_intakes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  project_id uuid,
  status text not null default 'submitted',
  intake_source text,
  requester_name text,
  requester_email text,
  company_name text,
  website_url text,
  intake_payload jsonb not null default '{}'::jsonb,
  diagnostic_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint diagnostic_intakes_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict,
  constraint diagnostic_intakes_project_requires_organization_check check (
    project_id is null or organization_id is not null
  ),
  constraint diagnostic_intakes_organization_project_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint diagnostic_intakes_status_check check (
    status in (
      'submitted',
      'setup_pending',
      'ready_to_measure',
      'measuring',
      'free_report_review',
      'free_report_ready',
      'converted_to_paid',
      'rejected',
      'failed'
    )
  ),
  constraint diagnostic_intakes_requester_email_format check (
    requester_email is null or position('@' in requester_email) > 1
  ),
  constraint diagnostic_intakes_website_url_format check (
    website_url is null or website_url ~* '^https?://'
  ),
  constraint diagnostic_intakes_intake_payload_is_object check (jsonb_typeof(intake_payload) = 'object'),
  constraint diagnostic_intakes_diagnostic_snapshot_is_object check (jsonb_typeof(diagnostic_snapshot) = 'object')
);

comment on table recora_admin.diagnostic_intakes is
  'Free diagnostic intake metadata. Raw diagnosis results, AI answers, aggregate metric values, and recommendation bodies remain in existing public measurement tables.';

comment on column recora_admin.diagnostic_intakes.intake_payload is
  'Supplemental intake payload only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate copies, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.diagnostic_intakes.diagnostic_snapshot is
  'Short operational snapshot only. Must not duplicate diagnosis result bodies, raw AI answers, aggregate metric values, or recommendation bodies.';

create table recora_admin.measurement_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  subscription_id uuid,
  schedule_type text not null default 'manual',
  status text not null default 'active',
  timezone text not null default 'Asia/Tokyo',
  cadence_config jsonb not null default '{}'::jsonb,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_schedules_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict,
  constraint measurement_schedules_organization_project_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint measurement_schedules_subscription_organization_fkey
    foreign key (subscription_id, organization_id) references recora_admin.customer_subscriptions(id, organization_id) on delete restrict,
  constraint measurement_schedules_schedule_type_check check (
    schedule_type in ('manual', 'free_diagnostic_once', 'weekly_1', 'weekly_2', 'custom')
  ),
  constraint measurement_schedules_status_check check (status in ('active', 'paused', 'canceled', 'ended')),
  constraint measurement_schedules_timezone_not_blank check (btrim(timezone) <> ''),
  constraint measurement_schedules_cadence_config_is_object check (jsonb_typeof(cadence_config) = 'object')
);

comment on table recora_admin.measurement_schedules is
  'Internal measurement scheduling metadata. Actual measurement runs are stored in public.measurement_runs; P0-A does not create or execute batches.';

comment on column recora_admin.measurement_schedules.cadence_config is
  'JSON object for mutable cadence settings. Must not store secrets, raw AI answers, aggregate copies, or recommendation bodies.';

create table recora_admin.operation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  project_id uuid,
  actor_type text not null default 'operator',
  actor_id text,
  event_type text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint operation_events_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict,
  constraint operation_events_project_requires_organization_check check (
    project_id is null or organization_id is not null
  ),
  constraint operation_events_organization_project_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint operation_events_actor_type_check check (
    actor_type in ('operator', 'script', 'worker', 'system', 'migration')
  ),
  constraint operation_events_event_type_not_blank check (btrim(event_type) <> ''),
  constraint operation_events_details_is_object check (jsonb_typeof(details) = 'object')
);

comment on table recora_admin.operation_events is
  'Append-only internal operation log. No updated_at column is created because events should be inserted, not mutated.';

comment on column recora_admin.operation_events.details is
  'JSON object for operational details only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate copies, recommendation bodies, or unnecessary PII.';

create trigger set_recora_admin_plan_configs_updated_at
before update on recora_admin.plan_configs
for each row execute function public.set_updated_at();

create trigger set_recora_admin_customer_profiles_updated_at
before update on recora_admin.customer_profiles
for each row execute function public.set_updated_at();

create trigger set_recora_admin_customer_subscriptions_updated_at
before update on recora_admin.customer_subscriptions
for each row execute function public.set_updated_at();

create trigger set_recora_admin_diagnostic_intakes_updated_at
before update on recora_admin.diagnostic_intakes
for each row execute function public.set_updated_at();

create trigger set_recora_admin_measurement_schedules_updated_at
before update on recora_admin.measurement_schedules
for each row execute function public.set_updated_at();

create index plan_configs_status_idx
on recora_admin.plan_configs (status);

create index customer_profiles_project_id_idx
on recora_admin.customer_profiles (project_id)
where project_id is not null;

create index customer_profiles_lifecycle_status_idx
on recora_admin.customer_profiles (lifecycle_status);

create index customer_subscriptions_organization_id_idx
on recora_admin.customer_subscriptions (organization_id);

create index customer_subscriptions_project_id_idx
on recora_admin.customer_subscriptions (project_id)
where project_id is not null;

create index customer_subscriptions_plan_config_id_idx
on recora_admin.customer_subscriptions (plan_config_id);

create index customer_subscriptions_status_idx
on recora_admin.customer_subscriptions (status);

create index diagnostic_intakes_organization_id_idx
on recora_admin.diagnostic_intakes (organization_id)
where organization_id is not null;

create index diagnostic_intakes_project_id_idx
on recora_admin.diagnostic_intakes (project_id)
where project_id is not null;

create index diagnostic_intakes_status_idx
on recora_admin.diagnostic_intakes (status);

create index diagnostic_intakes_submitted_at_idx
on recora_admin.diagnostic_intakes (submitted_at desc)
where submitted_at is not null;

create index measurement_schedules_organization_id_idx
on recora_admin.measurement_schedules (organization_id);

create index measurement_schedules_project_id_idx
on recora_admin.measurement_schedules (project_id);

create index measurement_schedules_subscription_id_idx
on recora_admin.measurement_schedules (subscription_id)
where subscription_id is not null;

create index measurement_schedules_status_idx
on recora_admin.measurement_schedules (status);

create index measurement_schedules_next_run_at_idx
on recora_admin.measurement_schedules (next_run_at)
where status = 'active' and next_run_at is not null;

create index operation_events_organization_id_idx
on recora_admin.operation_events (organization_id)
where organization_id is not null;

create index operation_events_project_id_idx
on recora_admin.operation_events (project_id)
where project_id is not null;

create index operation_events_event_type_idx
on recora_admin.operation_events (event_type);

create index operation_events_target_idx
on recora_admin.operation_events (target_type, target_id)
where target_type is not null and target_id is not null;

create index operation_events_created_at_idx
on recora_admin.operation_events (created_at desc);

alter table recora_admin.plan_configs enable row level security;
alter table recora_admin.customer_profiles enable row level security;
alter table recora_admin.customer_subscriptions enable row level security;
alter table recora_admin.diagnostic_intakes enable row level security;
alter table recora_admin.measurement_schedules enable row level security;
alter table recora_admin.operation_events enable row level security;

revoke all on all tables in schema recora_admin from public;
revoke all on all tables in schema recora_admin from anon;
revoke all on all tables in schema recora_admin from authenticated;
revoke all on all sequences in schema recora_admin from public;
revoke all on all sequences in schema recora_admin from anon;
revoke all on all sequences in schema recora_admin from authenticated;

grant usage on schema recora_admin to service_role;
grant select on all tables in schema recora_admin to service_role;
