import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260701073553_recora_internal_demo_subscription.sql",
);

const migrationSql = fs.readFileSync(migrationPath, "utf8");

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
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

  assert.equal(
    result.status,
    0,
    `Local SQL failed:\n${sanitize(output)}`,
  );
  return output;
}

assert.doesNotMatch(migrationSql, /target_project_id\s+constant\s+uuid/i);
assert.doesNotMatch(migrationSql, /target_organization_id\s+constant\s+uuid/i);
assert.match(migrationSql, /target_organization_slug constant text := 'recora-internal-demo'/);
assert.match(migrationSql, /target_project_slug constant text := 'mieruca-seo-demo'/);
assert.match(migrationSql, /raise notice 'Project % not found;/);
assert.match(migrationSql, /if target_project_id is null then[\s\S]*?return;/);
assert.match(migrationSql, /Project % does not belong to organization %/);
assert.match(migrationSql, /tenant foundation is incomplete/);
assert.doesNotMatch(migrationSql, /insert\s+into\s+public\.projects/i);
assert.doesNotMatch(migrationSql, /alter\s+table|create\s+policy|drop\s+policy|disable\s+row\s+level\s+security/i);
assert.match(migrationSql, /on conflict \(organization_id\) do update/);

const organizationLookupIndex = migrationSql.indexOf("from public.organizations");
const projectLookupIndex = migrationSql.indexOf("from public.projects");
const ownershipCheckIndex = migrationSql.indexOf(
  "if project_organization_id is distinct from target_organization_id then",
);
const planLookupIndex = migrationSql.indexOf("select plan_configs.id");
assert.ok(organizationLookupIndex >= 0);
assert.ok(projectLookupIndex > organizationLookupIndex);
assert.ok(ownershipCheckIndex > projectLookupIndex);
assert.ok(planLookupIndex > ownershipCheckIndex);

queryLocal(`
do $verify$
begin
  if not exists (
    select 1 from public.organizations where slug = 'recora-internal-demo'
  ) then
    raise exception 'Issue 80 prerequisite failed: tenant organization missing';
  end if;
  if exists (
    select 1 from public.projects where slug = 'mieruca-seo-demo'
  ) then
    raise exception 'Issue 80 prerequisite failed: target project already exists';
  end if;
  if exists (
    select 1
    from recora_admin.customer_profiles cp
    join public.organizations o on o.id = cp.organization_id
    where o.slug = 'recora-internal-demo'
  ) then
    raise exception 'Issue 80 prerequisite failed: target customer profile already exists';
  end if;
  if exists (
    select 1
    from recora_admin.customer_subscriptions cs
    join public.organizations o on o.id = cs.organization_id
    where o.slug = 'recora-internal-demo'
  ) then
    raise exception 'Issue 80 prerequisite failed: target subscription already exists';
  end if;
end;
$verify$;
`);

const caseAOutput = queryLocal(`
begin;
update recora_admin.plan_configs
set status = 'archived'
where plan_code = 'monitor_standard';
${migrationSql}
do $verify$
begin
  if exists (select 1 from public.projects where slug = 'mieruca-seo-demo') then
    raise exception 'Case A failed: migration created target project';
  end if;
  if exists (
    select 1
    from recora_admin.customer_profiles cp
    join public.organizations o on o.id = cp.organization_id
    where o.slug = 'recora-internal-demo'
  ) then
    raise exception 'Case A failed: migration created customer profile';
  end if;
  if exists (
    select 1
    from recora_admin.customer_subscriptions cs
    join public.organizations o on o.id = cs.organization_id
    where o.slug = 'recora-internal-demo'
  ) then
    raise exception 'Case A failed: migration created subscription';
  end if;
end;
$verify$;
rollback;
`);
assert.match(caseAOutput, /NOTICE:[\s\S]*Project mieruca-seo-demo not found/i);

queryLocal(`
begin;
insert into public.projects (organization_id, slug, name)
select id, 'mieruca-seo-demo', 'Issue 80 correct-organization fixture'
from public.organizations
where slug = 'recora-internal-demo';
${migrationSql}
${migrationSql}
do $verify$
begin
  if (
    select count(*)
    from recora_admin.customer_profiles cp
    join public.organizations o on o.id = cp.organization_id
    join public.projects p on p.id = cp.project_id
    where o.slug = 'recora-internal-demo'
      and p.slug = 'mieruca-seo-demo'
      and cp.lifecycle_status = 'paid'
      and cp.priority = 'normal'
      and cp.metadata @> '{"source":"internal_demo_setup"}'::jsonb
  ) <> 1 then
    raise exception 'Case B failed: expected exactly one customer profile';
  end if;

  if (
    select count(*)
    from recora_admin.customer_subscriptions cs
    join public.organizations o on o.id = cs.organization_id
    join public.projects p on p.id = cs.project_id
    join recora_admin.plan_configs pc on pc.id = cs.plan_config_id
    where o.slug = 'recora-internal-demo'
      and p.slug = 'mieruca-seo-demo'
      and cs.plan_code = 'monitor_standard'
      and pc.plan_code = 'monitor_standard'
      and cs.status = 'active'
      and cs.billing_mode = 'manual'
      and cs.metadata @> '{"source":"internal_demo_setup"}'::jsonb
  ) <> 1 then
    raise exception 'Case B failed: expected exactly one active subscription';
  end if;
end;
$verify$;
rollback;
`);

queryLocal(
  `
begin;
update recora_admin.plan_configs
set status = 'archived'
where plan_code = 'monitor_standard';
insert into public.organizations (
  slug,
  name,
  organization_type,
  data_environment,
  is_internal,
  is_demo
) values (
  'issue-80-other-organization',
  'Issue 80 Other Organization',
  'client',
  'local',
  false,
  true
);
insert into public.projects (organization_id, slug, name)
select id, 'mieruca-seo-demo', 'Issue 80 wrong-organization fixture'
from public.organizations
where slug = 'issue-80-other-organization';
${migrationSql}
rollback;
`,
  /Project .* does not belong to organization/i,
);

queryLocal(`
do $verify$
begin
  if exists (select 1 from public.projects where slug = 'mieruca-seo-demo') then
    raise exception 'Case C failed: rejected fixture was not rolled back';
  end if;
  if exists (select 1 from public.organizations where slug = 'issue-80-other-organization') then
    raise exception 'Case C failed: other organization fixture was not rolled back';
  end if;
  if exists (
    select 1
    from recora_admin.customer_profiles cp
    join public.organizations o on o.id = cp.organization_id
    where o.slug = 'recora-internal-demo'
  ) then
    raise exception 'Case C failed: customer profile was created';
  end if;
  if exists (
    select 1
    from recora_admin.customer_subscriptions cs
    join public.organizations o on o.id = cs.organization_id
    where o.slug = 'recora-internal-demo'
  ) then
    raise exception 'Case C failed: subscription was created';
  end if;
end;
$verify$;
`);

queryLocal(
  `
begin;
update recora_admin.plan_configs
set status = 'archived'
where plan_code = 'monitor_standard';
update public.organizations
set slug = 'issue-80-hidden-recora-internal-demo'
where slug = 'recora-internal-demo';
${migrationSql}
rollback;
`,
  /Organization recora-internal-demo not found; Recora tenant foundation is incomplete/i,
);

queryLocal(`
do $verify$
begin
  if not exists (select 1 from public.organizations where slug = 'recora-internal-demo') then
    raise exception 'Organization failure fixture was not rolled back';
  end if;
  if not exists (
    select 1
    from recora_admin.plan_configs
    where plan_code = 'monitor_standard' and status = 'active'
  ) then
    raise exception 'Plan fixture was not rolled back';
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
        missingProject: "accepted-with-notice-no-profile-no-subscription",
        correctOrganization: "profile-and-subscription-upserted-idempotently",
        wrongOrganization: "rejected-before-write",
        missingOrganization: "rejected-as-tenant-foundation-error",
      },
    },
    null,
    2,
  ),
);
