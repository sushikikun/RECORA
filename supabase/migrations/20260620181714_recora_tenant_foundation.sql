-- Recora tenant foundation.
-- This migration creates the minimum organization root needed before RLS
-- policies can safely enforce tenant boundaries. RLS policies are intentionally
-- left for a follow-up migration so existing dashboard reads and local scripts
-- do not break before the policy model is wired through the app.

set search_path = public, extensions;

create type public.recora_organization_member_role as enum (
  'owner',
  'admin',
  'member',
  'viewer'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  organization_type text not null default 'client',
  data_environment text not null default 'production',
  is_internal boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  constraint organizations_type_check check (organization_type in ('internal', 'client', 'partner')),
  constraint organizations_data_environment_check check (data_environment in ('local', 'demo', 'production'))
);

comment on table public.organizations is
  'Tenant root for Recora workspaces and projects. RLS policies should authorize via organization membership.';

comment on column public.organizations.is_demo is
  'Marks demo data. Demo organizations must not be mixed with real client data.';

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role public.recora_organization_member_role not null default 'member',
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_identity_check check (user_id is not null or email is not null),
  constraint organization_members_email_format check (email is null or position('@' in email) > 1)
);

comment on table public.organization_members is
  'Organization membership root for future RLS policies. Authorization should use user_id from auth.uid(), not user-editable metadata.';

insert into public.organizations (
  id,
  slug,
  name,
  organization_type,
  data_environment,
  is_internal,
  is_demo
) values (
  '00000000-0000-4000-8000-000000000001',
  'recora-internal-demo',
  'Recora Internal Demo',
  'internal',
  'demo',
  true,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  organization_type = excluded.organization_type,
  data_environment = excluded.data_environment,
  is_internal = excluded.is_internal,
  is_demo = excluded.is_demo;

alter table public.projects
  add column organization_id uuid;

update public.projects
set organization_id = (
  select id
  from public.organizations
  where slug = 'recora-internal-demo'
)
where organization_id is null;

alter table public.projects
  alter column organization_id set not null,
  add constraint projects_organization_id_fkey
    foreign key (organization_id) references public.organizations(id) on delete restrict;

comment on column public.projects.organization_id is
  'Tenant organization that owns this Recora project. workspace_name remains a display label and is not a security boundary.';

create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger set_organization_members_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

create index organizations_data_environment_idx
on public.organizations (data_environment);

create index organizations_demo_idx
on public.organizations (is_demo);

create index organization_members_organization_id_idx
on public.organization_members (organization_id);

create index organization_members_user_id_idx
on public.organization_members (user_id)
where user_id is not null;

create index organization_members_email_idx
on public.organization_members (lower(email))
where email is not null;

create unique index organization_members_unique_user_idx
on public.organization_members (organization_id, user_id)
where user_id is not null;

create unique index organization_members_unique_email_idx
on public.organization_members (organization_id, lower(email))
where email is not null;

create index projects_organization_id_idx
on public.projects (organization_id);

create unique index projects_organization_slug_unique_idx
on public.projects (organization_id, slug);

-- RLS follow-up:
-- Enable row level security after dashboard reads and CLI/job access are split
-- between authenticated anon/session clients and service-role-only job clients.
