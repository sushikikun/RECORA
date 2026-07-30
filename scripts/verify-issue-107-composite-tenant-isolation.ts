import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const containerName = "supabase_db_recora-issue-107";
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260729164230_composite_tenant_isolation.sql",
);
const migrationSql = fs.readFileSync(migrationPath, "utf8");

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
      containerName,
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
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120_000,
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
      `Expected isolated local SQL to fail with ${expectedError}, but it succeeded.`,
    );
    assert.match(sanitize(output), expectedError);
    return output;
  }

  assert.equal(
    result.status,
    0,
    `Isolated local SQL failed:\n${sanitize(output)}`,
  );
  return output;
}

const containerInspection = spawnSync(
  "docker",
  ["inspect", "--format", "{{.Name}}", containerName],
  {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    timeout: 30_000,
  },
);
assert.equal(containerInspection.status, 0);
assert.equal(containerInspection.stdout.trim(), `/${containerName}`);

assert.match(
  migrationSql,
  /Issue 107 pre-write inventory passed:[\s\S]*cross-project relations=0/,
);
assert.match(
  migrationSql,
  /add column if not exists project_id uuid/g,
);
assert.match(
  migrationSql,
  /create or replace function recora_private\.assign_project_id_from_parent\(\)[\s\S]*security definer[\s\S]*set search_path = ''/i,
);
assert.match(
  migrationSql,
  /project derivation rejected caller-supplied project substitution/i,
);
assert.match(
  migrationSql,
  /create constraint trigger recora_enforce_metric_scope_project/i,
);
assert.match(
  migrationSql,
  /foreign key \(topic_id, project_id\)[\s\S]*references public\.topics\(id, project_id\)/i,
);
assert.match(
  migrationSql,
  /foreign key \(conversation_id, project_id\)[\s\S]*references public\.ai_conversations\(id, project_id\)/i,
);
assert.match(
  migrationSql,
  /revoke all on all tables in schema recora_admin from public, anon, authenticated/i,
);
assert.match(
  migrationSql,
  /grant select \([\s\S]*title,[\s\S]*\) on public\.recommendations to authenticated/i,
);
assert.doesNotMatch(
  migrationSql,
  /grant select on public\.ai_conversations to authenticated/i,
);
assert.doesNotMatch(
  migrationSql,
  /disable\s+row\s+level\s+security|alter\s+table\s+public\.[a-z_]+\s+no\s+force\s+row\s+level\s+security/i,
);
assert.doesNotMatch(
  migrationSql,
  /insert\s+into\s+public\.organizations|insert\s+into\s+public\.projects|update\s+public\.projects\s+set\s+organization_id/i,
);

queryLocal(`
do $verify$
declare
  missing_column_count bigint;
  missing_constraint_count bigint;
  invalid_policy_count bigint;
  unexpected_write_policy_count bigint;
  insecure_definer_count bigint;
begin
  if current_database() <> 'postgres' then
    raise exception 'Issue 107 prerequisite failed: unexpected database';
  end if;

  select count(*)
  into missing_column_count
  from (
    values
      ('run_items'),
      ('ai_conversations'),
      ('brand_mentions'),
      ('citations'),
      ('metric_snapshots')
  ) expected(table_name)
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = expected.table_name
      and column_row.column_name = 'project_id'
      and column_row.is_nullable = 'NO'
  );

  if missing_column_count > 0 then
    raise exception 'Issue 107 schema failed: % required project_id column(s) missing or nullable',
      missing_column_count;
  end if;

  select count(*)
  into missing_constraint_count
  from (
    values
      ('brands_id_project_id_unique'),
      ('personas_id_project_id_unique'),
      ('topics_id_project_id_unique'),
      ('run_items_id_project_id_unique'),
      ('ai_conversations_id_project_id_unique'),
      ('source_domains_id_project_id_unique'),
      ('prompts_topic_project_fkey'),
      ('prompts_persona_project_fkey'),
      ('run_items_run_project_fkey'),
      ('run_items_prompt_project_fkey'),
      ('run_items_persona_project_fkey'),
      ('ai_conversations_run_item_project_fkey'),
      ('source_domains_owner_brand_project_fkey'),
      ('brand_mentions_conversation_project_fkey'),
      ('brand_mentions_brand_project_fkey'),
      ('citations_conversation_project_fkey'),
      ('citations_brand_project_fkey'),
      ('citations_source_domain_project_fkey'),
      ('metric_snapshots_run_project_fkey'),
      ('metric_snapshots_brand_project_fkey'),
      ('recommendations_run_project_fkey'),
      ('recommendations_topic_project_fkey'),
      ('recommendations_prompt_project_fkey')
  ) expected(constraint_name)
  where not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conname = expected.constraint_name
      and constraint_row.connamespace = 'public'::regnamespace
  );

  if missing_constraint_count > 0 then
    raise exception 'Issue 107 schema failed: % composite constraint(s) missing',
      missing_constraint_count;
  end if;

  select count(*)
  into invalid_policy_count
  from pg_class table_row
  join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
  where namespace_row.nspname = 'public'
    and table_row.relkind = 'r'
    and table_row.relname in (
      'organizations',
      'organization_members',
      'projects',
      'brands',
      'personas',
      'topics',
      'prompts',
      'ai_models',
      'measurement_runs',
      'run_items',
      'ai_conversations',
      'source_domains',
      'brand_mentions',
      'citations',
      'metric_snapshots',
      'recommendations'
    )
    and (
      not table_row.relrowsecurity
      or not exists (
        select 1
        from pg_policies policy_row
        where policy_row.schemaname = 'public'
          and policy_row.tablename = table_row.relname
          and policy_row.cmd = 'SELECT'
      )
    );

  if invalid_policy_count > 0 then
    raise exception 'Issue 107 RLS failed: % exposed table(s) lack RLS or SELECT policy',
      invalid_policy_count;
  end if;

  select count(*)
  into unexpected_write_policy_count
  from pg_policies
  where schemaname = 'public'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL');

  if unexpected_write_policy_count > 0 then
    raise exception 'Issue 107 RLS failed: browser write policy was introduced';
  end if;

  select count(*)
  into insecure_definer_count
  from pg_proc function_row
  join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname = 'recora_private'
    and function_row.prosecdef
    and not (
      function_row.proconfig is not null
      and 'search_path=""' = any(function_row.proconfig)
    );

  if insecure_definer_count > 0 then
    raise exception 'Issue 107 function boundary failed: % security-definer function(s) lack fixed empty search_path',
      insecure_definer_count;
  end if;

  if has_table_privilege('authenticated', 'public.ai_conversations', 'select')
     or has_table_privilege('authenticated', 'public.run_items', 'select')
     or has_table_privilege('authenticated', 'public.citations', 'select')
     or has_table_privilege('authenticated', 'public.metric_snapshots', 'select') then
    raise exception 'Issue 107 grant boundary failed: authenticated can directly read raw measurement data';
  end if;

  if not has_column_privilege(
    'authenticated',
    'public.recommendations',
    'title',
    'select'
  ) then
    raise exception 'Issue 107 grant boundary failed: customer-safe recommendation title is unavailable';
  end if;

  if has_column_privilege(
    'authenticated',
    'public.recommendations',
    'metadata',
    'select'
  ) then
    raise exception 'Issue 107 grant boundary failed: internal recommendation metadata is exposed';
  end if;

  if has_schema_privilege('authenticated', 'recora_admin', 'usage')
     or has_schema_privilege('anon', 'recora_admin', 'usage')
     or has_function_privilege(
       'authenticated',
       'public.recora_admin_customer_ops_readonly()',
       'execute'
     ) then
    raise exception 'Issue 107 operator boundary failed: customer browser role reaches recora_admin';
  end if;

  if has_function_privilege(
    'authenticated',
    'recora_private.assign_project_id_from_parent()',
    'execute'
  ) or has_function_privilege(
    'anon',
    'recora_private.enforce_metric_snapshot_scope_project()',
    'execute'
  ) then
    raise exception 'Issue 107 private function boundary failed: trigger helper is browser-executable';
  end if;
end;
$verify$;
`);

queryLocal(`
begin;

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
    '10710000-0000-4000-8000-000000000001',
    'issue-107-tenant-a',
    'Issue 107 Tenant A',
    'client',
    'production',
    false,
    false
  ),
  (
    '10710000-0000-4000-8000-000000000002',
    'issue-107-tenant-b',
    'Issue 107 Tenant B',
    'client',
    'production',
    false,
    false
  ),
  (
    '10710000-0000-4000-8000-000000000003',
    'issue-107-demo-local',
    'Issue 107 Demo Local',
    'internal',
    'local',
    true,
    true
  ),
  (
    '10710000-0000-4000-8000-000000000004',
    'issue-107-nondemo-production',
    'Issue 107 Non-demo Production',
    'client',
    'production',
    false,
    false
  );

insert into auth.users (id, email, created_at, updated_at) values
  (
    '10700000-0000-4000-8000-000000000001',
    'issue-107-active-a@example.invalid',
    now(),
    now()
  ),
  (
    '10700000-0000-4000-8000-000000000002',
    'issue-107-active-b@example.invalid',
    now(),
    now()
  ),
  (
    '10700000-0000-4000-8000-000000000003',
    'issue-107-invited@example.invalid',
    now(),
    now()
  ),
  (
    '10700000-0000-4000-8000-000000000004',
    'issue-107-suspended@example.invalid',
    now(),
    now()
  ),
  (
    '10700000-0000-4000-8000-000000000005',
    'issue-107-revoked@example.invalid',
    now(),
    now()
  ),
  (
    '10700000-0000-4000-8000-000000000006',
    'issue-107-no-membership@example.invalid',
    now(),
    now()
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
    '10710000-0000-4000-8000-000000000001',
    '10700000-0000-4000-8000-000000000001',
    'issue-107-active-a@example.invalid',
    'member',
    now(),
    now(),
    'active'
  ),
  (
    '10710000-0000-4000-8000-000000000002',
    '10700000-0000-4000-8000-000000000002',
    'issue-107-active-b@example.invalid',
    'member',
    now(),
    now(),
    'active'
  ),
  (
    '10710000-0000-4000-8000-000000000001',
    '10700000-0000-4000-8000-000000000003',
    'issue-107-invited@example.invalid',
    'member',
    now(),
    null,
    'invited'
  ),
  (
    '10710000-0000-4000-8000-000000000001',
    '10700000-0000-4000-8000-000000000004',
    'issue-107-suspended@example.invalid',
    'member',
    now(),
    now(),
    'suspended'
  ),
  (
    '10710000-0000-4000-8000-000000000001',
    '10700000-0000-4000-8000-000000000005',
    'issue-107-revoked@example.invalid',
    'member',
    now(),
    now(),
    'revoked'
  );

insert into public.projects (id, organization_id, slug, name) values
  (
    '10720000-0000-4000-8000-000000000001',
    '10710000-0000-4000-8000-000000000001',
    'issue-107-project-a',
    'Issue 107 Project A'
  ),
  (
    '10720000-0000-4000-8000-000000000002',
    '10710000-0000-4000-8000-000000000002',
    'issue-107-project-b',
    'Issue 107 Project B'
  ),
  (
    '10720000-0000-4000-8000-000000000003',
    '10710000-0000-4000-8000-000000000003',
    'issue-107-project-demo',
    'Issue 107 Project Demo'
  ),
  (
    '10720000-0000-4000-8000-000000000004',
    '10710000-0000-4000-8000-000000000004',
    'issue-107-project-nondemo',
    'Issue 107 Project Non-demo'
  );

insert into public.brands (id, project_id, brand_type, name) values
  (
    '10730000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    'primary',
    'Issue 107 Brand A'
  ),
  (
    '10730000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    'primary',
    'Issue 107 Brand B'
  ),
  (
    '10730000-0000-4000-8000-000000000003',
    '10720000-0000-4000-8000-000000000003',
    'primary',
    'Issue 107 Brand Demo'
  ),
  (
    '10730000-0000-4000-8000-000000000004',
    '10720000-0000-4000-8000-000000000004',
    'primary',
    'Issue 107 Brand Non-demo'
  );

insert into public.personas (id, project_id, name) values
  (
    '10740000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    'Issue 107 Persona A'
  ),
  (
    '10740000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    'Issue 107 Persona B'
  ),
  (
    '10740000-0000-4000-8000-000000000003',
    '10720000-0000-4000-8000-000000000003',
    'Issue 107 Persona Demo'
  ),
  (
    '10740000-0000-4000-8000-000000000004',
    '10720000-0000-4000-8000-000000000004',
    'Issue 107 Persona Non-demo'
  );

insert into public.topics (id, project_id, name) values
  (
    '10750000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    'Issue 107 Topic A'
  ),
  (
    '10750000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    'Issue 107 Topic B'
  ),
  (
    '10750000-0000-4000-8000-000000000003',
    '10720000-0000-4000-8000-000000000003',
    'Issue 107 Topic Demo'
  ),
  (
    '10750000-0000-4000-8000-000000000004',
    '10720000-0000-4000-8000-000000000004',
    'Issue 107 Topic Non-demo'
  );

insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text
) values
  (
    '10760000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    '10750000-0000-4000-8000-000000000001',
    '10740000-0000-4000-8000-000000000001',
    'Issue 107 Prompt A'
  ),
  (
    '10760000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    '10750000-0000-4000-8000-000000000002',
    '10740000-0000-4000-8000-000000000002',
    'Issue 107 Prompt B'
  ),
  (
    '10760000-0000-4000-8000-000000000003',
    '10720000-0000-4000-8000-000000000003',
    '10750000-0000-4000-8000-000000000003',
    '10740000-0000-4000-8000-000000000003',
    'Issue 107 Prompt Demo'
  ),
  (
    '10760000-0000-4000-8000-000000000004',
    '10720000-0000-4000-8000-000000000004',
    '10750000-0000-4000-8000-000000000004',
    '10740000-0000-4000-8000-000000000004',
    'Issue 107 Prompt Non-demo'
  );

insert into public.ai_models (
  id,
  provider,
  model_name,
  display_name
) values (
  '10770000-0000-4000-8000-000000000001',
  'issue-107-provider',
  'issue-107-model',
  'Issue 107 Model'
);

insert into public.measurement_runs (
  id,
  project_id,
  status,
  period_start,
  period_end
) values
  (
    '10780000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    'completed',
    current_date,
    current_date
  ),
  (
    '10780000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    'completed',
    current_date,
    current_date
  ),
  (
    '10780000-0000-4000-8000-000000000003',
    '10720000-0000-4000-8000-000000000003',
    'completed',
    current_date,
    current_date
  ),
  (
    '10780000-0000-4000-8000-000000000004',
    '10720000-0000-4000-8000-000000000004',
    'completed',
    current_date,
    current_date
  );

-- Legacy shape intentionally omits project_id. The trigger must derive it.
insert into public.run_items (
  id,
  run_id,
  prompt_id,
  persona_id,
  model_id,
  status
) values
  (
    '10790000-0000-4000-8000-000000000001',
    '10780000-0000-4000-8000-000000000001',
    '10760000-0000-4000-8000-000000000001',
    '10740000-0000-4000-8000-000000000001',
    '10770000-0000-4000-8000-000000000001',
    'completed'
  ),
  (
    '10790000-0000-4000-8000-000000000002',
    '10780000-0000-4000-8000-000000000002',
    '10760000-0000-4000-8000-000000000002',
    '10740000-0000-4000-8000-000000000002',
    '10770000-0000-4000-8000-000000000001',
    'completed'
  ),
  (
    '10790000-0000-4000-8000-000000000003',
    '10780000-0000-4000-8000-000000000003',
    '10760000-0000-4000-8000-000000000003',
    '10740000-0000-4000-8000-000000000003',
    '10770000-0000-4000-8000-000000000001',
    'completed'
  ),
  (
    '10790000-0000-4000-8000-000000000004',
    '10780000-0000-4000-8000-000000000004',
    '10760000-0000-4000-8000-000000000004',
    '10740000-0000-4000-8000-000000000004',
    '10770000-0000-4000-8000-000000000001',
    'completed'
  );

insert into public.ai_conversations (
  id,
  run_item_id,
  raw_answer,
  answer_hash,
  prompt_text_snapshot,
  model_snapshot
) values
  (
    '107a0000-0000-4000-8000-000000000001',
    '10790000-0000-4000-8000-000000000001',
    'Issue 107 Answer A',
    'issue-107-answer-a',
    'Issue 107 Prompt A',
    'Issue 107 Model'
  ),
  (
    '107a0000-0000-4000-8000-000000000002',
    '10790000-0000-4000-8000-000000000002',
    'Issue 107 Answer B',
    'issue-107-answer-b',
    'Issue 107 Prompt B',
    'Issue 107 Model'
  ),
  (
    '107a0000-0000-4000-8000-000000000003',
    '10790000-0000-4000-8000-000000000003',
    'Issue 107 Answer Demo',
    'issue-107-answer-demo',
    'Issue 107 Prompt Demo',
    'Issue 107 Model'
  ),
  (
    '107a0000-0000-4000-8000-000000000004',
    '10790000-0000-4000-8000-000000000004',
    'Issue 107 Answer Non-demo',
    'issue-107-answer-nondemo',
    'Issue 107 Prompt Non-demo',
    'Issue 107 Model'
  );

insert into public.source_domains (
  id,
  project_id,
  domain,
  owner_brand_id
) values
  (
    '107b0000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    'issue-107-a.example',
    '10730000-0000-4000-8000-000000000001'
  ),
  (
    '107b0000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    'issue-107-b.example',
    '10730000-0000-4000-8000-000000000002'
  );

insert into public.brand_mentions (
  id,
  conversation_id,
  brand_id,
  mentioned
) values
  (
    '107c0000-0000-4000-8000-000000000001',
    '107a0000-0000-4000-8000-000000000001',
    '10730000-0000-4000-8000-000000000001',
    true
  ),
  (
    '107c0000-0000-4000-8000-000000000002',
    '107a0000-0000-4000-8000-000000000002',
    '10730000-0000-4000-8000-000000000002',
    true
  );

insert into public.citations (
  id,
  conversation_id,
  brand_id,
  source_domain_id,
  domain
) values
  (
    '107d0000-0000-4000-8000-000000000001',
    '107a0000-0000-4000-8000-000000000001',
    '10730000-0000-4000-8000-000000000001',
    '107b0000-0000-4000-8000-000000000001',
    'issue-107-a.example'
  ),
  (
    '107d0000-0000-4000-8000-000000000002',
    '107a0000-0000-4000-8000-000000000002',
    '10730000-0000-4000-8000-000000000002',
    '107b0000-0000-4000-8000-000000000002',
    'issue-107-b.example'
  );

insert into public.metric_snapshots (
  id,
  run_id,
  scope_type,
  scope_id,
  brand_id
) values
  (
    '107e0000-0000-4000-8000-000000000001',
    '10780000-0000-4000-8000-000000000001',
    'project',
    '10720000-0000-4000-8000-000000000001',
    '10730000-0000-4000-8000-000000000001'
  ),
  (
    '107e0000-0000-4000-8000-000000000002',
    '10780000-0000-4000-8000-000000000002',
    'project',
    '10720000-0000-4000-8000-000000000002',
    '10730000-0000-4000-8000-000000000002'
  );

insert into public.recommendations (
  id,
  project_id,
  run_id,
  type,
  title,
  related_topic_id,
  related_prompt_id,
  metadata
) values
  (
    '107f0000-0000-4000-8000-000000000001',
    '10720000-0000-4000-8000-000000000001',
    '10780000-0000-4000-8000-000000000001',
    'content',
    'Issue 107 Recommendation A',
    '10750000-0000-4000-8000-000000000001',
    '10760000-0000-4000-8000-000000000001',
    '{"publication_state":"customer_visible"}'
  ),
  (
    '107f0000-0000-4000-8000-000000000002',
    '10720000-0000-4000-8000-000000000002',
    '10780000-0000-4000-8000-000000000002',
    'content',
    'Issue 107 Recommendation B',
    '10750000-0000-4000-8000-000000000002',
    '10760000-0000-4000-8000-000000000002',
    '{"publication_state":"customer_visible"}'
  );

do $verify_derivation_and_integrity$
begin
  if exists (
    select 1
    from public.run_items row_item
    join public.measurement_runs parent_row on parent_row.id = row_item.run_id
    where row_item.id::text like '1079%'
      and row_item.project_id is distinct from parent_row.project_id
  ) or exists (
    select 1
    from public.ai_conversations row_item
    join public.run_items parent_row on parent_row.id = row_item.run_item_id
    where row_item.id::text like '107a%'
      and row_item.project_id is distinct from parent_row.project_id
  ) or exists (
    select 1
    from public.citations row_item
    join public.ai_conversations parent_row on parent_row.id = row_item.conversation_id
    where row_item.id::text like '107d%'
      and row_item.project_id is distinct from parent_row.project_id
  ) then
    raise exception 'Issue 107 compatibility failed: mandatory-parent project derivation mismatch';
  end if;

  begin
    insert into public.prompts (
      project_id,
      topic_id,
      persona_id,
      text
    ) values (
      '10720000-0000-4000-8000-000000000001',
      '10750000-0000-4000-8000-000000000002',
      '10740000-0000-4000-8000-000000000001',
      'Issue 107 cross-project prompt'
    );
    raise exception 'Issue 107 integrity failed: cross-project prompt was accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.run_items (
      run_id,
      project_id,
      prompt_id,
      persona_id,
      model_id
    ) values (
      '10780000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10760000-0000-4000-8000-000000000001',
      '10740000-0000-4000-8000-000000000001',
      '10770000-0000-4000-8000-000000000001'
    );
    raise exception 'Issue 107 integrity failed: caller-supplied project substitution was accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.brand_mentions (
      conversation_id,
      brand_id
    ) values (
      '107a0000-0000-4000-8000-000000000001',
      '10730000-0000-4000-8000-000000000002'
    );
    raise exception 'Issue 107 integrity failed: cross-project brand mention was accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.citations (
      conversation_id,
      source_domain_id,
      domain
    ) values (
      '107a0000-0000-4000-8000-000000000001',
      '107b0000-0000-4000-8000-000000000002',
      'issue-107-cross.example'
    );
    raise exception 'Issue 107 integrity failed: cross-project citation was accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.metric_snapshots (
      run_id,
      scope_type,
      scope_id
    ) values (
      '10780000-0000-4000-8000-000000000001',
      'project',
      '10720000-0000-4000-8000-000000000002'
    );
    raise exception 'Issue 107 integrity failed: cross-project metric scope was accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.recommendations (
      project_id,
      run_id,
      type,
      title
    ) values (
      '10720000-0000-4000-8000-000000000001',
      '10780000-0000-4000-8000-000000000002',
      'content',
      'Issue 107 cross-project recommendation'
    );
    raise exception 'Issue 107 integrity failed: cross-project recommendation was accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    update public.run_items
    set run_id = '10780000-0000-4000-8000-000000000002'
    where id = '10790000-0000-4000-8000-000000000001';
    raise exception 'Issue 107 integrity failed: cross-project reparent was accepted';
  exception when check_violation then
    null;
  end;
end;
$verify_derivation_and_integrity$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '10700000-0000-4000-8000-000000000001',
  true
);

do $verify_active_a$
begin
  if (
    select count(*) from public.projects
    where id = '10720000-0000-4000-8000-000000000001'
  ) <> 1 then
    raise exception 'Issue 107 RLS failed: active A cannot read own project';
  end if;

  if exists (
    select 1 from public.projects
    where id = '10720000-0000-4000-8000-000000000002'
       or slug = 'issue-107-project-b'
  ) then
    raise exception 'Issue 107 RLS failed: active A can read B by UUID or slug';
  end if;

  if exists (
    select 1 from public.projects
    where slug ilike '%project-b%'
  ) then
    raise exception 'Issue 107 RLS failed: search leaks tenant B';
  end if;

  if (
    select count(*) from public.projects
    where slug like 'issue-107-project-%'
  ) <> 1 or exists (
    select 1 from public.projects
    where id = '10720000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: authenticated active A must see only A';
  end if;

  if exists (
    select 1 from public.projects
    where organization_id = '10710000-0000-4000-8000-000000000002'
  ) or recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000003'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: organization filter leaks tenant B';
  end if;

  if exists (
    select 1
    from (
      select id
      from public.projects
      where slug like 'issue-107-project-%'
      order by slug
      limit 2 offset 0
    ) page_row
    where page_row.id = '10720000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Issue 107 RLS failed: pagination leaks tenant B';
  end if;

  if (
    select count(*)
    from public.brands brand_row
    join public.projects project_row on project_row.id = brand_row.project_id
    join public.organizations organization_row
      on organization_row.id = project_row.organization_id
    where brand_row.id = '10730000-0000-4000-8000-000000000001'
      and organization_row.id = '10710000-0000-4000-8000-000000000001'
  ) <> 1 then
    raise exception 'Issue 107 RLS failed: own embedded/JOIN chain is unavailable';
  end if;

  if exists (
    select 1
    from public.brands brand_row
    join public.projects project_row on project_row.id = brand_row.project_id
    join public.organizations organization_row
      on organization_row.id = project_row.organization_id
    where brand_row.id = '10730000-0000-4000-8000-000000000002'
       or organization_row.id = '10710000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Issue 107 RLS failed: embedded/JOIN chain leaks tenant B';
  end if;

  if (
    select count(*) from public.organization_members
  ) <> 1 or exists (
    select 1 from public.organization_members
    where user_id <> (select auth.uid())
  ) then
    raise exception 'Issue 107 RLS failed: membership policy exposes another member';
  end if;

  if recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000002'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Issue 107 RPC failed: caller-supplied tenant substitution succeeded';
  end if;

  if recora_private.resolve_unambiguous_organization_id() is distinct from
    '10710000-0000-4000-8000-000000000001'::uuid then
    raise exception 'Issue 107 RPC failed: active A organization contract is ambiguous';
  end if;

  if (
    select count(*) from public.recommendations
    where title = 'Issue 107 Recommendation A'
  ) <> 1 or exists (
    select 1 from public.recommendations
    where title = 'Issue 107 Recommendation B'
  ) then
    raise exception 'Issue 107 safe recommendation boundary failed';
  end if;

  begin
    perform 1 from public.ai_conversations limit 1;
    raise exception 'Issue 107 raw boundary failed: authenticated read raw conversations';
  exception when insufficient_privilege then
    null;
  end;

  if has_schema_privilege(current_user, 'recora_admin', 'usage') then
    raise exception 'Issue 107 operator boundary failed for active customer';
  end if;

  begin
    insert into public.projects (organization_id, slug, name) values (
      '10710000-0000-4000-8000-000000000002',
      'issue-107-browser-create',
      'Issue 107 Browser Create'
    );
    raise exception 'Issue 107 write boundary failed: cross-tenant create succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.projects
    set organization_id = '10710000-0000-4000-8000-000000000002'
    where id = '10720000-0000-4000-8000-000000000001';
    raise exception 'Issue 107 write boundary failed: reparent succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.projects
    set name = 'Issue 107 Browser Update'
    where id = '10720000-0000-4000-8000-000000000002';
    raise exception 'Issue 107 write boundary failed: cross-tenant update succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    delete from public.projects
    where id = '10720000-0000-4000-8000-000000000002';
    raise exception 'Issue 107 write boundary failed: cross-tenant delete succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$verify_active_a$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '10700000-0000-4000-8000-000000000002',
  true
);
do $verify_active_b$
begin
  if (
    select count(*) from public.projects
    where id = '10720000-0000-4000-8000-000000000002'
  ) <> 1 or exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000003'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: authenticated active B must see only B';
  end if;
end;
$verify_active_b$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '10700000-0000-4000-8000-000000000003',
  true
);
do $verify_invited$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000003'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: invited membership was accepted';
  end if;
end;
$verify_invited$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '10700000-0000-4000-8000-000000000004',
  true
);
do $verify_suspended$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000003'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: suspended membership was accepted';
  end if;
end;
$verify_suspended$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '10700000-0000-4000-8000-000000000005',
  true
);
do $verify_revoked$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000003'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: revoked membership was accepted';
  end if;
end;
$verify_revoked$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '10700000-0000-4000-8000-000000000006',
  true
);
do $verify_missing$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003',
      '10720000-0000-4000-8000-000000000004'
    )
  ) or recora_private.can_read_project(
    '10720000-0000-4000-8000-000000000003'
  ) or recora_private.can_read_organization(
    '10710000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Issue 107 RLS failed: actor without active membership read a tenant';
  end if;
end;
$verify_missing$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '', true);

do $verify_authenticated_missing_identity$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project('10720000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000002')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000003')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000001')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000002')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000003') then
    raise exception 'Issue 107 request identity failed: authenticated role without sub was allowed';
  end if;
end;
$verify_authenticated_missing_identity$;

select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claim.sub', '10700000-0000-4000-8000-000000000001', true);

do $verify_missing_role$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project('10720000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000002')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000003')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000001')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000002')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000003') then
    raise exception 'Issue 107 request role failed: missing role claim was allowed';
  end if;
end;
$verify_missing_role$;

select set_config('request.jwt.claim.role', 'unknown', true);

do $verify_unknown_role$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project('10720000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000002')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000003')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000001')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000002')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000003') then
    raise exception 'Issue 107 request role failed: unknown role claim was allowed';
  end if;
end;
$verify_unknown_role$;
reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.sub', '10700000-0000-4000-8000-000000000001', true);

do $verify_anon_identity_mismatch$
begin
  if exists (
    select 1 from public.projects
    where id in (
      '10720000-0000-4000-8000-000000000001',
      '10720000-0000-4000-8000-000000000002',
      '10720000-0000-4000-8000-000000000003'
    )
  ) or recora_private.can_read_project('10720000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000002')
    or recora_private.can_read_project('10720000-0000-4000-8000-000000000003')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000001')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000002')
    or recora_private.can_read_organization('10710000-0000-4000-8000-000000000003') then
    raise exception 'Issue 107 anon identity failed: anon role with sub was allowed';
  end if;
end;
$verify_anon_identity_mismatch$;

select set_config('request.jwt.claim.sub', '', true);

do $verify_anon$
begin
  if (
    select count(*) from public.projects
    where slug like 'issue-107-project-%'
  ) <> 1 or (
    select id from public.projects
    where slug like 'issue-107-project-%'
  ) <> '10720000-0000-4000-8000-000000000003'::uuid
    or not recora_private.can_read_project(
      '10720000-0000-4000-8000-000000000003'
    )
    or not recora_private.can_read_organization(
      '10710000-0000-4000-8000-000000000003'
    )
    or recora_private.can_read_project(
      '10720000-0000-4000-8000-000000000001'
    )
    or recora_private.can_read_organization(
      '10710000-0000-4000-8000-000000000001'
    ) then
    raise exception 'Issue 107 anon boundary failed: only local/demo project should be visible';
  end if;

  if (
    select count(*) from public.ai_conversations
    where id = '107a0000-0000-4000-8000-000000000003'
  ) <> 1 or exists (
    select 1 from public.ai_conversations
    where id in (
      '107a0000-0000-4000-8000-000000000001',
      '107a0000-0000-4000-8000-000000000002',
      '107a0000-0000-4000-8000-000000000004'
    )
  ) then
    raise exception 'Issue 107 anon boundary failed: raw legacy demo path leaked non-demo evidence';
  end if;

  if has_schema_privilege(current_user, 'recora_admin', 'usage') then
    raise exception 'Issue 107 anon boundary failed: recora_admin is reachable';
  end if;

  if has_table_privilege(current_user, 'public.projects', 'insert')
     or has_table_privilege(current_user, 'public.projects', 'update')
     or has_table_privilege(current_user, 'public.projects', 'delete') then
    raise exception 'Issue 107 anon boundary failed: write privilege exists';
  end if;
end;
$verify_anon$;

reset role;
rollback;
`);

queryLocal(`
${migrationSql}
${migrationSql}
`);

queryLocal(
  `
begin;
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
    '10791000-0000-4000-8000-000000000001',
    'issue-107-inventory-a',
    'Issue 107 Inventory A',
    'client',
    'local',
    false,
    false
  ),
  (
    '10791000-0000-4000-8000-000000000002',
    'issue-107-inventory-b',
    'Issue 107 Inventory B',
    'client',
    'local',
    false,
    false
  );
insert into public.projects (id, organization_id, slug, name) values
  (
    '10792000-0000-4000-8000-000000000001',
    '10791000-0000-4000-8000-000000000001',
    'issue-107-inventory-project-a',
    'Issue 107 Inventory Project A'
  ),
  (
    '10792000-0000-4000-8000-000000000002',
    '10791000-0000-4000-8000-000000000002',
    'issue-107-inventory-project-b',
    'Issue 107 Inventory Project B'
  );
insert into public.personas (id, project_id, name) values (
  '10794000-0000-4000-8000-000000000001',
  '10792000-0000-4000-8000-000000000001',
  'Issue 107 Inventory Persona A'
);
insert into public.topics (id, project_id, name) values (
  '10795000-0000-4000-8000-000000000002',
  '10792000-0000-4000-8000-000000000002',
  'Issue 107 Inventory Topic B'
);
alter table public.prompts drop constraint prompts_topic_project_fkey;
insert into public.prompts (
  project_id,
  topic_id,
  persona_id,
  text
) values (
  '10792000-0000-4000-8000-000000000001',
  '10795000-0000-4000-8000-000000000002',
  '10794000-0000-4000-8000-000000000001',
  'Issue 107 unsafe inventory prompt'
);
${migrationSql}
`,
  /Issue 107 inventory failed: 1 cross-project relation\(s\) found/i,
);

queryLocal(`
do $verify_cleanup$
begin
  if exists (
    select 1 from public.organizations
    where slug like 'issue-107-%'
  ) or exists (
    select 1 from public.projects
    where slug like 'issue-107-%'
  ) or exists (
    select 1 from auth.users
    where id::text like '10700000-%'
  ) then
    raise exception 'Issue 107 fixture cleanup failed';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_topic_project_fkey'
  ) then
    raise exception 'Issue 107 unsafe inventory rollback did not restore composite FK';
  end if;
end;
$verify_cleanup$;
`);

console.log(
  JSON.stringify(
    {
      status: "ok",
      database: "isolated-local-only",
      container: containerName,
      migration: path.relative(repoRoot, migrationPath),
      cases: {
        compositeCandidateKeys: "present",
        mandatoryParentProjectDerivation: "compatible-and-fail-closed",
        crossProjectCreateAndReparent: "rejected",
        metricScopeSubstitution: "rejected",
        activeMembershipAandB: "own-tenant-only",
        invitedSuspendedRevokedMissing: "rejected",
        uuidSlugListSearchFilterCountPagination: "no-cross-tenant-leakage",
        embeddedJoinMultiHop: "no-cross-tenant-leakage",
        rpcTenantSubstitution: "rejected",
        browserWrites: "not-granted",
        rawMeasurementForCustomer: "not-granted",
        customerSafeRecommendationColumns: "allowed-without-metadata",
        operatorAdminBoundary: "server-only",
        anonymousDemo: "local-demo-only",
        migrationReapply: "idempotent",
        unsafeInventory: "rejected-before-persistent-write",
        fixtureCleanup: "rolled-back",
      },
    },
    null,
    2,
  ),
);
