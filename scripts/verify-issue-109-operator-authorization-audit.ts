import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const localContainer = "supabase_db_recora-issue-109";
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260730121500_recora_operator_authorization_audit.sql",
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
      localContainer,
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

  if (result.error) throw result.error;

  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected local SQL to fail with ${expectedError}, but it succeeded.`);
    assert.match(sanitize(output), expectedError);
    return output;
  }

  assert.equal(result.status, 0, `Local SQL failed:\n${sanitize(output)}`);
  return output;
}

assert.match(migrationSql, /create schema if not exists recora_operator/i);
assert.match(migrationSql, /create schema if not exists recora_audit/i);
assert.match(migrationSql, /auth_user_id uuid not null unique references auth\.users\(id\)/i);
assert.match(migrationSql, /'active',\s*'suspended',\s*'revoked'/i);
assert.match(migrationSql, /operator_action_grants_project_scope_fkey/i);
assert.match(migrationSql, /create unique index operator_action_grants_effective_scope_unique[\s\S]*where revoked_at is null/i);
assert.match(migrationSql, /is_safe_audit_reason/i);
assert.match(migrationSql, /target_organization_not_found/i);
assert.match(migrationSql, /target_project_not_found/i);
assert.doesNotMatch(migrationSql, /p_simulate_failure|simulate_failure|simulated operator command failure/i);
assert.match(migrationSql, /recora_audit\.operator_events/i);
assert.match(migrationSql, /before update or delete on recora_audit\.operator_events/i);
assert.match(migrationSql, /security definer\s+set search_path = ''/i);
assert.match(migrationSql, /grant execute on function public\.recora_operator_execute_authorized_command_receipt[\s\S]*to service_role/i);
assert.match(migrationSql, /revoke all on function public\.recora_operator_execute_authorized_command_receipt[\s\S]*from public, anon, authenticated/i);
assert.doesNotMatch(migrationSql, /insert\s+into\s+recora_operator\.operator_identities/i);
assert.doesNotMatch(migrationSql, /@(?:example|gmail)/i);

queryLocal(`
do $verify$
begin
  if current_database() <> 'postgres' then
    raise exception 'Issue 109 verifier requires the isolated local database';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.proname = 'recora_operator_execute_authorized_command_receipt'
      and function_row.prosecdef is true
      and function_row.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Issue 109 command boundary is missing or unhardened';
  end if;

  if has_function_privilege('anon', 'public.recora_operator_execute_authorized_command_receipt(uuid, text, uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb, jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_operator_execute_authorized_command_receipt(uuid, text, uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb, jsonb)', 'EXECUTE')
  then
    raise exception 'Issue 109 command boundary is reachable by a customer role';
  end if;

  if not has_function_privilege('service_role', 'public.recora_operator_execute_authorized_command_receipt(uuid, text, uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb, jsonb)', 'EXECUTE') then
    raise exception 'Issue 109 service-role command grant is missing';
  end if;

  if has_table_privilege('anon', 'recora_audit.operator_events', 'SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated', 'recora_audit.operator_events', 'SELECT,INSERT,UPDATE,DELETE')
  then
    raise exception 'Issue 109 audit table is reachable by a customer role';
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
  if (select count(*) from pg_namespace where nspname in ('recora_operator', 'recora_audit')) <> 2 then
    raise exception 'Issue 109 migration replay duplicated a private schema';
  end if;

  if (select count(*) from pg_proc function_row join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace where namespace_row.nspname = 'public' and function_row.proname = 'recora_operator_execute_authorized_command_receipt') <> 1 then
    raise exception 'Issue 109 migration replay duplicated the command boundary';
  end if;
end;
$verify$;
rollback;
`);

queryLocal(`
begin;

insert into auth.users (id, email, created_at, updated_at)
values
  ('10900000-0000-4000-8000-000000000001', 'issue-109-owner@example.invalid', now(), now()),
  ('10900000-0000-4000-8000-000000000002', 'issue-109-scoped@example.invalid', now(), now()),
  ('10900000-0000-4000-8000-000000000003', 'issue-109-suspended@example.invalid', now(), now()),
  ('10900000-0000-4000-8000-000000000004', 'issue-109-revoked@example.invalid', now(), now()),
  ('10900000-0000-4000-8000-000000000005', 'issue-109-customer@example.invalid', now(), now());

insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
values
  ('10910000-0000-4000-8000-000000000001', 'issue-109-organization-a', 'Issue 109 Organization A', 'client', 'local', false, false),
  ('10910000-0000-4000-8000-000000000002', 'issue-109-organization-b', 'Issue 109 Organization B', 'client', 'local', false, false);

insert into public.projects (id, organization_id, slug, name)
values
  ('10920000-0000-4000-8000-000000000001', '10910000-0000-4000-8000-000000000001', 'issue-109-project-a', 'Issue 109 Project A'),
  ('10920000-0000-4000-8000-000000000002', '10910000-0000-4000-8000-000000000002', 'issue-109-project-b', 'Issue 109 Project B');

insert into public.organization_members (organization_id, user_id, email, role, invited_at, accepted_at, membership_status)
values (
  '10910000-0000-4000-8000-000000000001',
  '10900000-0000-4000-8000-000000000005',
  'issue-109-customer@example.invalid',
  'member',
  now(),
  now(),
  'active'
);

insert into recora_operator.operator_identities (id, auth_user_id, status, display_label)
values
  ('10930000-0000-4000-8000-000000000001', '10900000-0000-4000-8000-000000000001', 'active', 'Issue 109 owner fixture'),
  ('10930000-0000-4000-8000-000000000002', '10900000-0000-4000-8000-000000000002', 'active', 'Issue 109 scoped fixture'),
  ('10930000-0000-4000-8000-000000000003', '10900000-0000-4000-8000-000000000003', 'suspended', 'Issue 109 suspended fixture'),
  ('10930000-0000-4000-8000-000000000004', '10900000-0000-4000-8000-000000000004', 'revoked', 'Issue 109 revoked fixture');

insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id)
values
  ('10930000-0000-4000-8000-000000000001', 'operator.audit.foundation', '10910000-0000-4000-8000-000000000001', null),
  ('10930000-0000-4000-8000-000000000001', 'operator.audit.foundation', null, null),
  ('10930000-0000-4000-8000-000000000002', 'operator.audit.foundation', '10910000-0000-4000-8000-000000000001', '10920000-0000-4000-8000-000000000001');

do $verify$
declare
  result_row record;
  regrant_id uuid;
begin
  insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id)
  values ('10930000-0000-4000-8000-000000000001', 'operator.audit.regrant', '10910000-0000-4000-8000-000000000001', null)
  returning id into regrant_id;

  begin
    insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id)
    values ('10930000-0000-4000-8000-000000000001', 'operator.audit.regrant', '10910000-0000-4000-8000-000000000001', null);
    raise exception 'Issue 109 active duplicate grant was accepted';
  exception
    when unique_violation then
      null;
  end;

  update recora_operator.operator_action_grants
  set revoked_at = now(), revoked_reason_code = 'issue_109_regrant_test'
  where id = regrant_id;

  insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id)
  values ('10930000-0000-4000-8000-000000000001', 'operator.audit.regrant', '10910000-0000-4000-8000-000000000001', null);

  if (select count(*) from recora_operator.operator_action_grants where operator_id = '10930000-0000-4000-8000-000000000001' and permission = 'operator.audit.regrant') <> 2
    or (select count(*) from recora_operator.operator_action_grants where operator_id = '10930000-0000-4000-8000-000000000001' and permission = 'operator.audit.regrant' and revoked_at is null) <> 1 then
    raise exception 'Issue 109 revoked grant history or regrant uniqueness is incorrect';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify owner tenant command',
    '10940000-0000-4000-8000-000000000001',
    '10950000-0000-4000-8000-000000000001',
    '{"status":"before"}'::jsonb,
    '{"status":"after"}'::jsonb
  );
  if result_row.outcome <> 'success' or result_row.failure_reason_code is not null then
    raise exception 'Issue 109 active owner was not authorized';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000002',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    '10920000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    'project',
    '10920000-0000-4000-8000-000000000001',
    'verify scoped project command',
    '10940000-0000-4000-8000-000000000002',
    '10950000-0000-4000-8000-000000000002'
  );
  if result_row.outcome <> 'success' then
    raise exception 'Issue 109 scoped operator was not authorized';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000002',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000002',
    '10920000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    'project',
    '10920000-0000-4000-8000-000000000001',
    'verify mismatched project ownership',
    '10940000-0000-4000-8000-000000000003',
    '10950000-0000-4000-8000-000000000003'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'target_scope_mismatch' then
    raise exception 'Issue 109 wrong tenant/project was not denied';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000099',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000099',
    'verify nonexistent organization with global grant',
    '10940000-0000-4000-8000-000000000014',
    '10950000-0000-4000-8000-000000000014'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'target_organization_not_found' then
    raise exception 'Issue 109 nonexistent organization was not stably denied';
  end if;
  if (select count(*) from recora_audit.operator_events where request_id = '10940000-0000-4000-8000-000000000014' and outcome = 'denied' and organization_id is null) <> 1 then
    raise exception 'Issue 109 nonexistent organization denial was not audited safely';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000005',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000099',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000099',
    'verify unregistered operator nonexistent organization',
    '10940000-0000-4000-8000-000000000015',
    '10950000-0000-4000-8000-000000000015'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'operator_not_registered' then
    raise exception 'Issue 109 unregistered operator was not stably denied';
  end if;
  if (select count(*) from recora_audit.operator_events where request_id = '10940000-0000-4000-8000-000000000015' and outcome = 'denied' and organization_id is null) <> 1 then
    raise exception 'Issue 109 unregistered denial was not audited safely';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    '10920000-0000-4000-8000-000000000099',
    'operator.audit.foundation',
    'project',
    '10920000-0000-4000-8000-000000000099',
    'verify nonexistent project',
    '10940000-0000-4000-8000-000000000016',
    '10950000-0000-4000-8000-000000000016'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'target_project_not_found' then
    raise exception 'Issue 109 nonexistent project was not stably denied';
  end if;
  if (select count(*) from recora_audit.operator_events where request_id = '10940000-0000-4000-8000-000000000016' and outcome = 'denied' and organization_id = '10910000-0000-4000-8000-000000000001' and project_id is null) <> 1 then
    raise exception 'Issue 109 nonexistent project denial was not audited with only authoritative org';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.restricted.action',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.restricted.action',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify missing permission',
    '10940000-0000-4000-8000-000000000004',
    '10950000-0000-4000-8000-000000000004'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'permission_denied' then
    raise exception 'Issue 109 missing permission was not denied';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    '',
    '10940000-0000-4000-8000-000000000005',
    '10950000-0000-4000-8000-000000000005'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'reason_required' then
    raise exception 'Issue 109 empty reason was not denied';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000003',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify suspended operator',
    '10940000-0000-4000-8000-000000000006',
    '10950000-0000-4000-8000-000000000006'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'operator_not_active' then
    raise exception 'Issue 109 suspended operator was not denied';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000004',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify revoked operator',
    '10940000-0000-4000-8000-000000000007',
    '10950000-0000-4000-8000-000000000007'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'operator_not_active' then
    raise exception 'Issue 109 revoked operator was not denied';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000005',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify customer member is not an operator',
    '10940000-0000-4000-8000-000000000013',
    '10950000-0000-4000-8000-000000000013'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'operator_not_registered' then
    raise exception 'Issue 109 customer member was not denied';
  end if;
  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    null,
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify server capability is not an actor',
    '10940000-0000-4000-8000-000000000008',
    '10950000-0000-4000-8000-000000000008'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'operator_identity_required' then
    raise exception 'Issue 109 unverified service capability was not denied';
  end if;

  create or replace function recora_operator.issue_109_verifier_failure()
  returns trigger
  language plpgsql
  set search_path = ''
  as $failure$
  begin
    raise exception 'Issue 109 verifier-triggered command failure';
  end;
  $failure$;

  create trigger issue_109_verifier_failure
  after insert on recora_operator.operator_command_receipts
  for each row execute function recora_operator.issue_109_verifier_failure();

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify atomic failure receipt rollback',
    '10940000-0000-4000-8000-000000000009',
    '10950000-0000-4000-8000-000000000009',
    '{}'::jsonb,
    '{}'::jsonb
  );
  if result_row.outcome <> 'failed' or result_row.failure_reason_code <> 'command_execution_failed' then
    raise exception 'Issue 109 failed command was not audited';
  end if;

  if exists (select 1 from recora_operator.operator_command_receipts where request_id = '10940000-0000-4000-8000-000000000009') then
    raise exception 'Issue 109 failed command left a receipt instead of rolling it back';
  end if;

  if (select count(*) from recora_audit.operator_events where request_id = '10940000-0000-4000-8000-000000000009' and outcome = 'failed') <> 1 then
    raise exception 'Issue 109 failed command audit event is missing';
  end if;

  drop trigger issue_109_verifier_failure on recora_operator.operator_command_receipts;
  drop function recora_operator.issue_109_verifier_failure();

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify unsafe summary is blocked',
    '10940000-0000-4000-8000-000000000010',
    '10950000-0000-4000-8000-000000000010',
    '{"api_key":"not-allowed"}'::jsonb,
    '{}'::jsonb
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'summary_unsafe' then
    raise exception 'Issue 109 unsafe audit summary was not rejected';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'contact email@example.invalid',
    '10940000-0000-4000-8000-000000000017',
    '10950000-0000-4000-8000-000000000017'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'reason_unsafe' then
    raise exception 'Issue 109 PII reason was not rejected';
  end if;
  if exists (select 1 from recora_audit.operator_events where request_id = '10940000-0000-4000-8000-000000000017' and reason is not null) then
    raise exception 'Issue 109 unsafe reason was retained';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'credential sk-1234567890abcdef ghp_1234567890abcdef eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.signature',
    '10940000-0000-4000-8000-000000000018',
    '10950000-0000-4000-8000-000000000018'
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'reason_unsafe' then
    raise exception 'Issue 109 representative token reason was not rejected';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify nested summary values are blocked',
    '10940000-0000-4000-8000-000000000019',
    '10950000-0000-4000-8000-000000000019',
    '{"safe":{"items":[{"value":"provider payload"}]}}'::jsonb,
    '{}'::jsonb
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'summary_unsafe' then
    raise exception 'Issue 109 nested summary value was not rejected';
  end if;

  select * into result_row
  from public.recora_operator_execute_authorized_command_receipt(
    '10900000-0000-4000-8000-000000000001',
    'operator.audit.foundation',
    '10910000-0000-4000-8000-000000000001',
    null,
    'operator.audit.foundation',
    'organization',
    '10910000-0000-4000-8000-000000000001',
    'verify array and bounded summary',
    '10940000-0000-4000-8000-000000000020',
    '10950000-0000-4000-8000-000000000020',
    '{"items":["safe",{"session":"blocked"}]}'::jsonb,
    jsonb_build_object('status', repeat('x', 513))
  );
  if result_row.outcome <> 'denied' or result_row.failure_reason_code <> 'summary_unsafe' then
    raise exception 'Issue 109 nested array or bounded summary was not rejected';
  end if;

  if exists (
    select 1
    from recora_audit.operator_events
    where before_summary::text ~* '(api_key|secret|token|password|credential|postgres(?:ql)?://)'
      or after_summary::text ~* '(api_key|secret|token|password|credential|postgres(?:ql)?://)'
  ) then
    raise exception 'Issue 109 audit event retained a sensitive summary';
  end if;

  if exists (
    select 1
    from recora_audit.operator_events
    where request_id = '10940000-0000-4000-8000-000000000008'
      and actor_operator_id is not null
  ) then
    raise exception 'Issue 109 service capability denial was recorded as an operator actor';
  end if;

  if (select count(*) from recora_audit.operator_events where outcome = 'success') < 2
    or (select count(*) from recora_audit.operator_events where outcome = 'denied') < 6
    or (select count(*) from recora_audit.operator_events where outcome = 'failed') < 1 then
    raise exception 'Issue 109 did not preserve success, denied, and failed audit evidence';
  end if;
end;
$verify$;

rollback;
`);

queryLocal(
  `
begin;
insert into recora_audit.operator_events (
  action, target_type, target_id, request_id, correlation_id, outcome
) values (
  'operator.audit.fixture', 'organization', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'success'
);update recora_audit.operator_events
set reason = 'mutation attempt'
where id = (select id from recora_audit.operator_events limit 1);
`,
  /append-only/i,
);

queryLocal(
  `
begin;
insert into recora_audit.operator_events (
  action, target_type, target_id, request_id, correlation_id, outcome
) values (
  'operator.audit.fixture', 'organization', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'success'
);delete from recora_audit.operator_events
where id = (select id from recora_audit.operator_events limit 1);
`,
  /append-only/i,
);

queryLocal(
  `
begin;
set local role authenticated;
select * from public.recora_operator_execute_authorized_command_receipt(
  null,
  'operator.audit.foundation',
  '00000000-0000-4000-8000-000000000001',
  null,
  'operator.audit.foundation',
  'organization',
  '00000000-0000-4000-8000-000000000001',
  'customer bypass attempt',
  '10940000-0000-4000-8000-000000000011',
  '10950000-0000-4000-8000-000000000011'
);
`,
  /permission denied/i,
);

queryLocal(
  `
begin;
set local role anon;
select * from public.recora_operator_execute_authorized_command_receipt(
  null,
  'operator.audit.foundation',
  '00000000-0000-4000-8000-000000000001',
  null,
  'operator.audit.foundation',
  'organization',
  '00000000-0000-4000-8000-000000000001',
  'anonymous bypass attempt',
  '10940000-0000-4000-8000-000000000012',
  '10950000-0000-4000-8000-000000000012'
);
`,
  /permission denied/i,
);

queryLocal(`
do $verify$
begin
  if exists (select 1 from recora_operator.operator_identities where auth_user_id::text like '10900000-%')
    or exists (select 1 from public.organizations where slug like 'issue-109-%')
    or exists (select 1 from auth.users where id::text like '10900000-%') then
    raise exception 'Issue 109 fixtures were not rolled back';
  end if;
end;
$verify$;
`);

console.log(
  JSON.stringify(
    {
      status: "ok",
      database: "isolated-local-only",
      container: localContainer,
      migration: path.relative(repoRoot, migrationPath),
      cases: {
        activeOwner: "authorized",
        scopedOperator: "authorized",
        missingPermission: "denied",
        wrongTenantProject: "denied",
        emptyReason: "denied",
        suspendedAndRevoked: "denied",
        customerAndAnonymous: "rpc-execute-denied",
        serviceRoleActor: "identity-required-not-recorded",
        auditOutcomes: "success-denied-failed",
        auditImmutability: "update-delete-rejected",
        atomicity: "failed-receipt-rolled-back-and-audited",
        sensitiveSummary: "rejected-without-retention",
        migrationReapply: "idempotent",
        fixtures: "rolled-back",
      },
    },
    null,
    2,
  ),
);
