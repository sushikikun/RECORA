import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260729151417_tenant_ownership_accepted_membership.sql",
);
const seedPath = path.join(repoRoot, "supabase", "seed.sql");

const migrationSql = fs.readFileSync(migrationPath, "utf8");
const seedSql = fs.readFileSync(seedPath, "utf8");

function sanitize(value: string): string {
  return value.replace(
    /postgres(?:ql)?:\/\/[^\s]+/gi,
    "[redacted-local-db-url]",
  );
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "--interactive",
      "supabase_db_recora",
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--quiet",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
      input: sql,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60_000,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.error) {
    throw result.error;
  }

  if (expectedError) {
    assert.notEqual(
      result.status,
      0,
      `Expected local SQL to fail with ${expectedError}, but it succeeded.`,
    );
    assert.match(sanitize(output), expectedError);
    return output;
  }

  assert.equal(result.status, 0, `Local SQL failed:\n${sanitize(output)}`);
  return output;
}

assert.match(
  migrationSql,
  /create type public\.recora_organization_membership_status as enum \(\s*'invited',\s*'active',\s*'suspended',\s*'revoked'/,
);
assert.match(
  migrationSql,
  /add column if not exists membership_status\s+public\.recora_organization_membership_status/i,
);
assert.match(
  migrationSql,
  /when accepted_at is not null then 'active'::public\.recora_organization_membership_status/i,
);
assert.match(
  migrationSql,
  /membership_status =\s*'active'::public\.recora_organization_membership_status/,
);
assert.match(migrationSql, /member_row\.accepted_at is not null/i);
assert.match(
  migrationSql,
  /create or replace function recora_private\.resolve_unambiguous_organization_id\(\)/i,
);
assert.match(migrationSql, /when count\(\*\) = 1 then/i);
assert.match(migrationSql, /security definer\s+set search_path = ''/i);
assert.match(
  migrationSql,
  /projects_id_organization_id_unique[\s\S]*unique \(id, organization_id\)/i,
);
assert.match(
  migrationSql,
  /Issue 105 inventory failed:[\s\S]*unknown organization ownership/i,
);
assert.doesNotMatch(
  migrationSql,
  /update\s+public\.projects\s+set\s+organization_id/i,
);
assert.doesNotMatch(migrationSql, /insert\s+into\s+public\.projects/i);
assert.doesNotMatch(migrationSql, /insert\s+into\s+public\.organizations/i);
assert.doesNotMatch(
  migrationSql,
  /disable\s+row\s+level\s+security|drop\s+policy|create\s+policy/i,
);

assert.match(
  seedSql,
  /insert into public\.projects \(\s*id,\s*organization_id,\s*slug,/,
);
assert.match(
  seedSql,
  /'10000000-0000-4000-8000-000000000001',\s*'00000000-0000-4000-8000-000000000001',\s*'recora-kenzai-q2'/,
);

queryLocal(`
do $verify$
declare
  enum_values text[];
begin
  if current_database() <> 'postgres' then
    raise exception 'Issue 105 prerequisite failed: unexpected local database';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'membership_status'
      and is_nullable = 'NO'
  ) then
    raise exception 'Issue 105 prerequisite failed: membership_status is missing or nullable';
  end if;

  select array_agg(enum_value.enumlabel order by enum_value.enumsortorder)
  into enum_values
  from pg_enum enum_value
  join pg_type type_row on type_row.oid = enum_value.enumtypid
  join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
  where namespace_row.nspname = 'public'
    and type_row.typname = 'recora_organization_membership_status';

  if enum_values is distinct from array['invited', 'active', 'suspended', 'revoked'] then
    raise exception 'Issue 105 prerequisite failed: unexpected membership status enum';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname = 'projects_id_organization_id_unique'
  ) then
    raise exception 'Issue 105 prerequisite failed: project tenant candidate key missing';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_status_consistency_check'
  ) then
    raise exception 'Issue 105 prerequisite failed: membership status constraint missing';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = 'is_organization_member'
      and function_row.prosecdef is true
      and function_row.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Issue 105 prerequisite failed: effective membership predicate is not hardened';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = 'resolve_unambiguous_organization_id'
      and function_row.prosecdef is true
      and function_row.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Issue 105 prerequisite failed: implicit tenant resolver is not hardened';
  end if;

  if not has_function_privilege(
    'authenticated',
    'recora_private.resolve_unambiguous_organization_id()',
    'EXECUTE'
  ) then
    raise exception 'Issue 105 prerequisite failed: authenticated resolver grant missing';
  end if;

  if has_function_privilege(
    'anon',
    'recora_private.resolve_unambiguous_organization_id()',
    'EXECUTE'
  ) then
    raise exception 'Issue 105 prerequisite failed: anonymous resolver grant is too broad';
  end if;
end;
$verify$;
`);

queryLocal(`
begin;
${migrationSql}
${migrationSql}
do $verify$
begin
  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'membership_status'
  ) <> 1 then
    raise exception 'Issue 105 idempotency failed: membership_status duplicated';
  end if;

  if (
    select count(*)
    from pg_proc function_row
    join pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = 'resolve_unambiguous_organization_id'
  ) <> 1 then
    raise exception 'Issue 105 idempotency failed: resolver duplicated';
  end if;
end;
$verify$;
rollback;
`);

queryLocal(`
begin;

insert into auth.users (id, email, created_at, updated_at)
values
  ('10500000-0000-4000-8000-000000000001', 'issue-105-active@example.invalid', now(), now()),
  ('10500000-0000-4000-8000-000000000002', 'issue-105-invited@example.invalid', now(), now()),
  ('10500000-0000-4000-8000-000000000003', 'issue-105-suspended@example.invalid', now(), now()),
  ('10500000-0000-4000-8000-000000000004', 'issue-105-revoked@example.invalid', now(), now()),
  ('10500000-0000-4000-8000-000000000005', 'issue-105-ambiguous@example.invalid', now(), now()),
  ('10500000-0000-4000-8000-000000000006', 'issue-105-no-membership@example.invalid', now(), now());

insert into public.organizations (
  id,
  slug,
  name,
  organization_type,
  data_environment,
  is_internal,
  is_demo
) values
  (
    '10510000-0000-4000-8000-000000000001',
    'issue-105-organization-a',
    'Issue 105 Organization A',
    'client',
    'local',
    false,
    false
  ),
  (
    '10510000-0000-4000-8000-000000000002',
    'issue-105-organization-b',
    'Issue 105 Organization B',
    'client',
    'local',
    false,
    false
  );

insert into public.projects (id, organization_id, slug, name)
values
  (
    '10520000-0000-4000-8000-000000000001',
    '10510000-0000-4000-8000-000000000001',
    'issue-105-project-a',
    'Issue 105 Project A'
  ),
  (
    '10520000-0000-4000-8000-000000000002',
    '10510000-0000-4000-8000-000000000002',
    'issue-105-project-b',
    'Issue 105 Project B'
  );

insert into public.organization_members (
  organization_id,
  user_id,
  email,
  role,
  invited_at,
  accepted_at,
  membership_status
) values
  (
    '10510000-0000-4000-8000-000000000001',
    '10500000-0000-4000-8000-000000000001',
    'issue-105-active@example.invalid',
    'member',
    now(),
    now(),
    'active'
  ),
  (
    '10510000-0000-4000-8000-000000000001',
    '10500000-0000-4000-8000-000000000002',
    'issue-105-invited@example.invalid',
    'member',
    now(),
    null,
    'invited'
  ),
  (
    '10510000-0000-4000-8000-000000000001',
    '10500000-0000-4000-8000-000000000003',
    'issue-105-suspended@example.invalid',
    'member',
    now(),
    now(),
    'suspended'
  ),
  (
    '10510000-0000-4000-8000-000000000001',
    '10500000-0000-4000-8000-000000000004',
    'issue-105-revoked@example.invalid',
    'member',
    now(),
    now(),
    'revoked'
  ),
  (
    '10510000-0000-4000-8000-000000000001',
    '10500000-0000-4000-8000-000000000005',
    'issue-105-ambiguous@example.invalid',
    'member',
    now(),
    now(),
    'active'
  ),
  (
    '10510000-0000-4000-8000-000000000002',
    '10500000-0000-4000-8000-000000000005',
    'issue-105-ambiguous@example.invalid',
    'member',
    now(),
    now(),
    'active'
  );

do $verify$
begin
  if (
    select count(*)
    from public.projects
    where id = '10520000-0000-4000-8000-000000000001'
      and organization_id = '10510000-0000-4000-8000-000000000001'
  ) <> 1 then
    raise exception 'Issue 105 ownership failed: project A is not owned by organization A';
  end if;

  if exists (
    select 1
    from public.projects
    where id = '10520000-0000-4000-8000-000000000001'
      and organization_id = '10510000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Issue 105 ownership failed: project A also belongs to organization B';
  end if;

  if recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Issue 105 anonymous actor failed closed check';
  end if;

  if recora_private.resolve_unambiguous_organization_id() is not null then
    raise exception 'Issue 105 anonymous implicit context failed closed check';
  end if;
end;
$verify$;

select set_config(
  'request.jwt.claim.sub',
  '10500000-0000-4000-8000-000000000001',
  true
);
do $verify$
begin
  if not recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Issue 105 active accepted membership was rejected';
  end if;
  if recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Issue 105 cross-tenant membership was accepted';
  end if;
  if recora_private.resolve_unambiguous_organization_id() is distinct from
    '10510000-0000-4000-8000-000000000001'::uuid
  then
    raise exception 'Issue 105 single active tenant was not resolved';
  end if;
end;
$verify$;

select set_config(
  'request.jwt.claim.sub',
  '10500000-0000-4000-8000-000000000002',
  true
);
do $verify$
begin
  if recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Issue 105 invited membership was accepted';
  end if;
end;
$verify$;

select set_config(
  'request.jwt.claim.sub',
  '10500000-0000-4000-8000-000000000003',
  true
);
do $verify$
begin
  if recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Issue 105 suspended membership was accepted';
  end if;
end;
$verify$;

select set_config(
  'request.jwt.claim.sub',
  '10500000-0000-4000-8000-000000000004',
  true
);
do $verify$
begin
  if recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Issue 105 revoked membership was accepted';
  end if;
end;
$verify$;

select set_config(
  'request.jwt.claim.sub',
  '10500000-0000-4000-8000-000000000005',
  true
);
do $verify$
begin
  if not recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000001'
  ) or not recora_private.is_organization_member(
    '10510000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Issue 105 explicit membership rejected a valid multi-tenant actor';
  end if;
  if recora_private.resolve_unambiguous_organization_id() is not null then
    raise exception 'Issue 105 ambiguous implicit tenant context did not fail closed';
  end if;
end;
$verify$;

select set_config(
  'request.jwt.claim.sub',
  '10500000-0000-4000-8000-000000000006',
  true
);
do $verify$
begin
  if recora_private.resolve_unambiguous_organization_id() is not null then
    raise exception 'Issue 105 missing implicit tenant context did not fail closed';
  end if;
end;
$verify$;

rollback;
`);

queryLocal(
  `
begin;
insert into public.projects (slug, name)
values ('issue-105-missing-ownership', 'Issue 105 Missing Ownership');
`,
  /null value in column "organization_id"[\s\S]*violates not-null constraint/i,
);

queryLocal(
  `
begin;
insert into auth.users (id, email, created_at, updated_at)
values (
  '10500000-0000-4000-8000-000000000007',
  'issue-105-invalid-active@example.invalid',
  now(),
  now()
);
insert into public.organization_members (
  organization_id,
  user_id,
  email,
  accepted_at,
  membership_status
)
select
  id,
  '10500000-0000-4000-8000-000000000007',
  'issue-105-invalid-active@example.invalid',
  null,
  'active'
from public.organizations
where slug = 'recora-internal-demo';
`,
  /organization_members_status_consistency_check/i,
);

queryLocal(
  `
begin;
alter table public.projects alter column organization_id drop not null;
insert into public.projects (slug, name)
values ('issue-105-inventory-unknown', 'Issue 105 Inventory Unknown');
${migrationSql}
`,
  /Issue 105 inventory failed: 1 project row\(s\) have unknown organization ownership/i,
);

queryLocal(`
do $verify$
begin
  if exists (
    select 1
    from public.projects
    where slug like 'issue-105-%'
  ) then
    raise exception 'Issue 105 fixture project was not rolled back';
  end if;

  if exists (
    select 1
    from public.organizations
    where slug like 'issue-105-%'
  ) then
    raise exception 'Issue 105 fixture organization was not rolled back';
  end if;

  if exists (
    select 1
    from auth.users
    where id::text like '10500000-%'
  ) then
    raise exception 'Issue 105 auth fixture was not rolled back';
  end if;

  if (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'organization_id'
  ) <> 'NO' then
    raise exception 'Issue 105 inventory fixture left project ownership nullable';
  end if;
end;
$verify$;
`);

console.log(
  JSON.stringify(
    {
      status: "ok",
      database: "local-only",
      migration: path.relative(repoRoot, migrationPath),
      cases: {
        ownershipAandB: "explicit-and-isolated",
        missingOwnership: "rejected-without-demo-remap",
        acceptedActive: "accepted",
        invitedUnaccepted: "rejected",
        suspended: "rejected",
        revoked: "rejected",
        crossTenant: "rejected",
        anonymous: "rejected",
        missingImplicitContext: "null",
        ambiguousImplicitContext: "null",
        migrationReapply: "idempotent",
        unsafeInventory: "rejected-before-migration-write",
        fixtureCleanup: "rolled-back",
      },
    },
    null,
    2,
  ),
);
