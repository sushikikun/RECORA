import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { normalizeEntitlementDocument } from "../lib/recora/entitlement-snapshots";

const repoRoot = process.cwd();
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260729163300_recora_plan_entitlement_history.sql"
);
const resolverPath = path.join(repoRoot, "lib", "recora", "entitlement-snapshots.ts");
const expectedDbContainer = "supabase_db_recora-issue-108-v2";
const dbContainerValue = process.env.RECORA_ISSUE_108_DB_CONTAINER;

assert.equal(
  dbContainerValue,
  expectedDbContainer,
  "Issue #108 verifier requires RECORA_ISSUE_108_DB_CONTAINER=supabase_db_recora-issue-108-v2 and will not default to another task container."
);
if (dbContainerValue !== expectedDbContainer) {
  throw new Error("Issue #108 verifier container guard failed.");
}
const dbContainer = dbContainerValue;

const migrationSql = fs.readFileSync(migrationPath, "utf8");
const resolverSource = fs.readFileSync(resolverPath, "utf8");

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
}

function queryLocal(sql: string): string {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "--interactive",
      dbContainer,
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--quiet"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
      input: sql,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60_000
    }
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Local SQL failed:\n${sanitize(output)}`);
  return output;
}

assert.match(migrationSql, /create table if not exists recora_private\.plan_policy_versions/i);
assert.match(migrationSql, /create table if not exists recora_private\.entitlement_snapshots/i);
assert.match(migrationSql, /create table if not exists recora_private\.current_entitlement_snapshots/i);
assert.match(migrationSql, /unique \(scope_key, idempotency_key\)/i);
assert.match(migrationSql, /before update or delete on recora_private\.plan_policy_versions/i);
assert.match(migrationSql, /before update or delete on recora_private\.entitlement_snapshots/i);
assert.match(migrationSql, /security definer\s+set search_path = ''/i);
assert.match(migrationSql, /grant execute on function public\.recora_resolve_current_entitlement_snapshot/i);
assert.doesNotMatch(migrationSql, /insert into recora_admin\.(plan_configs|customer_subscriptions)/i);
assert.match(resolverSource, /import "server-only"/);
assert.match(resolverSource, /resolveCurrentEntitlementSnapshot/);
assert.match(resolverSource, /validateEntitlementSnapshotReference/);
assert.doesNotMatch(resolverSource, /billing|payment|subscription|contract/i);
assert.match(migrationSql, /return false;/i);
assert.match(migrationSql, /single_root_per_policy/i);
assert.match(migrationSql, /single_successor_per_policy/i);
assert.match(migrationSql, /from public, anon, authenticated/i);

const validDocument = {
  capabilities: { design: true, "execution.v2": false },
  limits: { prompts: 1, "projects.max": 0 }
};
assert.deepEqual(normalizeEntitlementDocument(validDocument), validDocument);
for (const invalidDocument of [
  null,
  {},
  { capabilities: {} },
  { limits: {} },
  { capabilities: null, limits: {} },
  { capabilities: {}, limits: null },
  [],
  "entitlement",
  1,
  { capabilities: { design: "true" }, limits: {} },
  { capabilities: { "unsafe key": true }, limits: {} },
  { capabilities: {}, limits: { prompts: "1" } },
  { capabilities: {}, limits: { prompts: -1 } },
  { capabilities: {}, limits: { prompts: Number.POSITIVE_INFINITY } },
  { capabilities: {}, limits: { "unsafe key": 1 } },
  { capabilities: {}, limits: {}, billing: {} },
  { capabilities: {}, limits: {}, payment: {} },
  { capabilities: {}, limits: {}, subscription: {} },
  { capabilities: {}, limits: {}, contract: {} }
]) {
  assert.equal(normalizeEntitlementDocument(invalidDocument), null);
}

queryLocal(`
do $verify$
declare
  function_signature text;
begin
  if current_database() <> 'postgres' then
    raise exception 'Issue 108 prerequisite failed: unexpected local database';
  end if;

  if not exists (
    select 1
    from pg_class table_row
    join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
    where namespace_row.nspname = 'recora_private'
      and table_row.relname = 'entitlement_snapshots'
      and table_row.relrowsecurity is true
  ) then
    raise exception 'Issue 108 prerequisite failed: entitlement snapshot RLS is missing';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.proname = 'recora_resolve_current_entitlement_snapshot'
      and function_row.prosecdef is true
      and function_row.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Issue 108 prerequisite failed: resolver is not hardened';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.recora_resolve_current_entitlement_snapshot(uuid, uuid)',
    'EXECUTE'
  ) then
    raise exception 'Issue 108 prerequisite failed: service-role resolver grant is missing';
  end if;

  if has_function_privilege(
    'anon',
    'public.recora_resolve_current_entitlement_snapshot(uuid, uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.recora_resolve_current_entitlement_snapshot(uuid, uuid)',
    'EXECUTE'
  ) then
    raise exception 'Issue 108 prerequisite failed: browser resolver grant is too broad';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.recora_validate_entitlement_snapshot_reference(uuid, uuid, uuid)',
    'EXECUTE'
  ) then
    raise exception 'Issue 108 prerequisite failed: service-role reference validator grant is missing';
  end if;

  if has_function_privilege(
    'anon',
    'public.recora_validate_entitlement_snapshot_reference(uuid, uuid, uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.recora_validate_entitlement_snapshot_reference(uuid, uuid, uuid)',
    'EXECUTE'
  ) then
    raise exception 'Issue 108 prerequisite failed: browser reference-validator grant is too broad';
  end if;

  for function_signature in
    select unnest(array[
      'recora_private.is_valid_entitlement_document(jsonb)',
      'recora_private.reject_entitlement_history_mutation()',
      'recora_private.validate_plan_policy_version_insert()',
      'recora_private.validate_entitlement_snapshot_insert()',
      'recora_private.validate_current_entitlement_snapshot_pointer()'
    ])
  loop
    if has_function_privilege('anon', function_signature, 'EXECUTE')
      or has_function_privilege('authenticated', function_signature, 'EXECUTE') then
      raise exception 'Issue 108 prerequisite failed: private helper grant is too broad for %', function_signature;
    end if;
  end loop;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'membership_status'
      and is_nullable = 'NO'
  ) then
    raise exception 'Issue 108 102-3B regression: accepted-membership column is unavailable';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = 'resolve_unambiguous_organization_id'
      and function_row.prosecdef is true
  ) then
    raise exception 'Issue 108 102-3B regression: unambiguous tenant resolver is unavailable';
  end if;

  if to_regclass('recora_admin.customer_subscriptions') is null
    or to_regclass('public.projects') is null then
    raise exception 'Issue 108 102-3A regression: baseline replay objects are unavailable';
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
    from pg_trigger trigger_row
    join pg_class table_row on table_row.oid = trigger_row.tgrelid
    join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
    where namespace_row.nspname = 'recora_private'
      and table_row.relname = 'entitlement_snapshots'
      and trigger_row.tgname = 'reject_entitlement_snapshot_mutation'
      and not trigger_row.tgisinternal
  ) <> 1 then
    raise exception 'Issue 108 migration idempotency failed: immutable snapshot trigger is duplicated';
  end if;
end;
$verify$;
rollback;
`);

queryLocal(`
begin;

insert into public.organizations (
  id, slug, name, organization_type, data_environment, is_internal, is_demo
) values
  ('10810000-0000-4000-8000-000000000001', 'issue-108-organization-a', 'Issue 108 Organization A', 'client', 'local', false, false),
  ('10810000-0000-4000-8000-000000000002', 'issue-108-organization-b', 'Issue 108 Organization B', 'client', 'local', false, false),
  ('10810000-0000-4000-8000-000000000003', 'issue-108-organization-c', 'Issue 108 Organization C', 'client', 'local', false, false),
  ('10810000-0000-4000-8000-000000000004', 'issue-108-organization-d', 'Issue 108 Organization D', 'client', 'local', false, false);

insert into public.projects (id, organization_id, slug, name) values
  ('10820000-0000-4000-8000-000000000001', '10810000-0000-4000-8000-000000000001', 'issue-108-project-a', 'Issue 108 Project A'),
  ('10820000-0000-4000-8000-000000000002', '10810000-0000-4000-8000-000000000002', 'issue-108-project-b', 'Issue 108 Project B');

insert into recora_private.plan_policy_versions (
  id, policy_key, policy_schema_version, effective_from, policy_document
) values (
  '10830000-0000-4000-8000-000000000001',
  'issue_108_policy',
  1,
  now() - interval '2 days',
  '{"capabilities":{"design":true,"execution":false},"limits":{"prompts":1}}'::jsonb
);

insert into recora_private.plan_policy_versions (
  id, policy_key, policy_schema_version, effective_from, policy_document, supersedes_policy_version_id
) values (
  '10830000-0000-4000-8000-000000000002',
  'issue_108_policy',
  1,
  now() - interval '1 day',
  '{"capabilities":{"design":true,"execution":true},"limits":{"prompts":2}}'::jsonb,
  '10830000-0000-4000-8000-000000000001'
);

insert into recora_private.entitlement_snapshots (
  id, organization_id, project_id, source_contract_reference, plan_policy_version_id,
  entitlement_schema_version, resolved_document, effective_from, effective_until,
  resolver_version, idempotency_key
) values
  (
    '10840000-0000-4000-8000-000000000001',
    '10810000-0000-4000-8000-000000000001',
    null,
    'opaque:issue-108:a1',
    '10830000-0000-4000-8000-000000000001',
    1,
    '{"capabilities":{"design":true,"execution":false},"limits":{"prompts":1}}'::jsonb,
    now() - interval '2 days',
    null,
    'issue-108-fixture',
    'issue-108-a1'
  ),
  (
    '10840000-0000-4000-8000-000000000002',
    '10810000-0000-4000-8000-000000000001',
    null,
    'opaque:issue-108:a2',
    '10830000-0000-4000-8000-000000000002',
    1,
    '{"capabilities":{"design":true,"execution":true},"limits":{"prompts":2}}'::jsonb,
    now() - interval '1 day',
    null,
    'issue-108-fixture',
    'issue-108-a2'
  ),
  (
    '10840000-0000-4000-8000-000000000003',
    '10810000-0000-4000-8000-000000000002',
    null,
    'opaque:issue-108:b1',
    '10830000-0000-4000-8000-000000000001',
    1,
    '{"capabilities":{"design":true,"execution":false},"limits":{"prompts":1}}'::jsonb,
    now() - interval '2 days',
    null,
    'issue-108-fixture',
    'issue-108-b1'
  ),
  (
    '10840000-0000-4000-8000-000000000004',
    '10810000-0000-4000-8000-000000000001',
    '10820000-0000-4000-8000-000000000001',
    'opaque:issue-108:a-project',
    '10830000-0000-4000-8000-000000000002',
    1,
    '{"capabilities":{"design":true,"execution":true},"limits":{"prompts":3}}'::jsonb,
    now() - interval '1 day',
    null,
    'issue-108-fixture',
    'issue-108-a-project'
  ),
  (
    '10840000-0000-4000-8000-000000000005',
    '10810000-0000-4000-8000-000000000003',
    null,
    'opaque:issue-108:expired',
    '10830000-0000-4000-8000-000000000001',
    1,
    '{"capabilities":{"design":false,"execution":false},"limits":{"prompts":0}}'::jsonb,
    now() - interval '3 days',
    now() - interval '1 day',
    'issue-108-fixture',
    'issue-108-expired'
  );

insert into recora_private.current_entitlement_snapshots (
  organization_id, project_id, snapshot_id
) values
  ('10810000-0000-4000-8000-000000000001', null, '10840000-0000-4000-8000-000000000001'),
  ('10810000-0000-4000-8000-000000000002', null, '10840000-0000-4000-8000-000000000003'),
  ('10810000-0000-4000-8000-000000000001', '10820000-0000-4000-8000-000000000001', '10840000-0000-4000-8000-000000000004'),
  ('10810000-0000-4000-8000-000000000003', null, '10840000-0000-4000-8000-000000000005');

do $verify$
declare
  a1_hash text;
  a1_hash_after text;
  v1_hash text;
  v1_document jsonb;
  v1_effective_from timestamptz;
  v2_hash text;
  v2_document jsonb;
  v2_effective_from timestamptz;
  invalid_document jsonb;
  invalid_label text;
  invalid_reference text;
  invalid_reference_label text;
  rpc_json jsonb;
begin
  select document_hash
  into a1_hash
  from recora_private.entitlement_snapshots
  where id = '10840000-0000-4000-8000-000000000001';

  if (
    select reason_code
    from public.recora_resolve_current_entitlement_snapshot(
      '10810000-0000-4000-8000-000000000001', null
    )
  ) <> 'ok' then
    raise exception 'Issue 108 resolver failed to resolve organization A current snapshot';
  end if;

  if (
    select snapshot_id
    from public.recora_resolve_current_entitlement_snapshot(
      '10810000-0000-4000-8000-000000000001',
      '10820000-0000-4000-8000-000000000001'
    )
  ) <> '10840000-0000-4000-8000-000000000004'::uuid then
    raise exception 'Issue 108 resolver did not prefer the project snapshot';
  end if;

  select to_jsonb(resolver_row)
  into rpc_json
  from public.recora_resolve_current_entitlement_snapshot(
    '10810000-0000-4000-8000-000000000001', null
  ) resolver_row;

  if rpc_json ?| array[
    'source_contract_reference', 'exception_source_reference', 'exception_reason_reference',
    'plan_policy_version_id', 'policy_document', 'contract', 'billing_mode', 'payment', 'subscription'
  ] then
    raise exception 'Issue 108 resolver exposed a prohibited internal field';
  end if;

  for invalid_label, invalid_document in
    select invalid_documents.label, invalid_documents.document
    from (values
      ('empty'::text, '{}'::jsonb),
      ('missing_capabilities', '{"limits":{}}'::jsonb),
      ('missing_limits', '{"capabilities":{}}'::jsonb),
      ('null_capabilities', '{"capabilities":null,"limits":{}}'::jsonb),
      ('null_limits', '{"capabilities":{},"limits":null}'::jsonb),
      ('array', '[]'::jsonb),
      ('string', '"entitlement"'::jsonb),
      ('scalar', '1'::jsonb),
      ('capability_not_boolean', '{"capabilities":{"design":"true"},"limits":{}}'::jsonb),
      ('capability_unsafe_key', '{"capabilities":{"unsafe key":true},"limits":{}}'::jsonb),
      ('limit_not_number', '{"capabilities":{},"limits":{"prompts":"1"}}'::jsonb),
      ('limit_negative', '{"capabilities":{},"limits":{"prompts":-1}}'::jsonb),
      ('limit_unsafe_key', '{"capabilities":{},"limits":{"unsafe key":1}}'::jsonb),
      ('top_level_billing', '{"capabilities":{},"limits":{},"billing":{}}'::jsonb),
      ('top_level_payment', '{"capabilities":{},"limits":{},"payment":{}}'::jsonb),
      ('top_level_subscription', '{"capabilities":{},"limits":{},"subscription":{}}'::jsonb),
      ('top_level_contract', '{"capabilities":{},"limits":{},"contract":{}}'::jsonb)
    ) as invalid_documents(label, document)
  loop
    if recora_private.is_valid_entitlement_document(invalid_document) then
      raise exception 'Issue 108 invalid entitlement document was accepted by validator: %', invalid_label;
    end if;

    begin
      insert into recora_private.plan_policy_versions (
        id, policy_key, policy_schema_version, effective_from, policy_document
      ) values (
        gen_random_uuid(),
        'issue_108_invalid_' || invalid_label,
        1,
        now() + interval '10 days',
        invalid_document
      );
      raise exception 'Issue 108 invalid entitlement document passed a table constraint: %', invalid_label;
    exception when check_violation then
      null;
    end;
  end loop;

  for invalid_reference_label, invalid_reference in
    select invalid_references.label, invalid_references.reference
    from (values
      ('source_malformed'::text, 'free form reference'::text),
      ('source_overlong', repeat('a', 129))
    ) as invalid_references(label, reference)
  loop
    begin
      insert into recora_private.entitlement_snapshots (
        id, organization_id, source_contract_reference, plan_policy_version_id,
        entitlement_schema_version, resolved_document, effective_from, resolver_version, idempotency_key
      ) values (
        gen_random_uuid(),
        '10810000-0000-4000-8000-000000000001',
        invalid_reference,
        '10830000-0000-4000-8000-000000000001',
        1,
        '{"capabilities":{},"limits":{}}'::jsonb,
        now() + interval '10 days',
        'issue-108-fixture',
        'issue-108-' || invalid_reference_label
      );
      raise exception 'Issue 108 malformed opaque source reference unexpectedly succeeded: %', invalid_reference_label;
    exception when check_violation then
      null;
    end;
  end loop;

  begin
    insert into recora_private.entitlement_snapshots (
      id, organization_id, source_contract_reference, plan_policy_version_id,
      entitlement_schema_version, resolved_document, effective_from, resolver_version,
      exception_source_reference, idempotency_key
    ) values (
      gen_random_uuid(), '10810000-0000-4000-8000-000000000001', 'opaque:issue-108:exception',
      '10830000-0000-4000-8000-000000000001', 1, '{"capabilities":{},"limits":{}}'::jsonb,
      now() + interval '10 days', 'issue-108-fixture', 'exception:source', 'issue-108-exception-source-only'
    );
    raise exception 'Issue 108 exception source without reason unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  begin
    insert into recora_private.entitlement_snapshots (
      id, organization_id, source_contract_reference, plan_policy_version_id,
      entitlement_schema_version, resolved_document, effective_from, resolver_version,
      exception_reason_reference, idempotency_key
    ) values (
      gen_random_uuid(), '10810000-0000-4000-8000-000000000001', 'opaque:issue-108:exception',
      '10830000-0000-4000-8000-000000000001', 1, '{"capabilities":{},"limits":{}}'::jsonb,
      now() + interval '10 days', 'issue-108-fixture', 'exception:reason', 'issue-108-exception-reason-only'
    );
    raise exception 'Issue 108 exception reason without source unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  begin
    insert into recora_private.entitlement_snapshots (
      id, organization_id, source_contract_reference, plan_policy_version_id,
      entitlement_schema_version, resolved_document, effective_from, resolver_version,
      exception_source_reference, exception_reason_reference, idempotency_key
    ) values (
      gen_random_uuid(), '10810000-0000-4000-8000-000000000001', 'opaque:issue-108:exception',
      '10830000-0000-4000-8000-000000000001', 1, '{"capabilities":{},"limits":{}}'::jsonb,
      now() + interval '10 days', 'issue-108-fixture', 'free form source', 'exception:reason', 'issue-108-exception-malformed'
    );
    raise exception 'Issue 108 malformed opaque exception reference unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  begin
    insert into recora_private.entitlement_snapshots (
      id, organization_id, source_contract_reference, plan_policy_version_id,
      entitlement_schema_version, resolved_document, effective_from, resolver_version,
      exception_source_reference, exception_reason_reference, idempotency_key
    ) values (
      gen_random_uuid(), '10810000-0000-4000-8000-000000000001', 'opaque:issue-108:exception',
      '10830000-0000-4000-8000-000000000001', 1, '{"capabilities":{},"limits":{}}'::jsonb,
      now() + interval '10 days', 'issue-108-fixture', 'exception:source', repeat('r', 129), 'issue-108-exception-overlong'
    );
    raise exception 'Issue 108 overlong opaque exception reference unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  select policy_hash, policy_document, effective_from
  into v1_hash, v1_document, v1_effective_from
  from recora_private.plan_policy_versions
  where id = '10830000-0000-4000-8000-000000000001';
  select policy_hash, policy_document, effective_from
  into v2_hash, v2_document, v2_effective_from
  from recora_private.plan_policy_versions
  where id = '10830000-0000-4000-8000-000000000002';

  begin
    insert into recora_private.plan_policy_versions (
      id, policy_key, policy_schema_version, effective_from, policy_document, supersedes_policy_version_id
    ) values (
      '10830000-0000-4000-8000-000000000003', 'issue_108_policy', 1, now() - interval '1 day',
      '{"capabilities":{"design":true},"limits":{"prompts":3}}'::jsonb,
      '10830000-0000-4000-8000-000000000002'
    );
    raise exception 'Issue 108 same-time successor unexpectedly succeeded';
  exception when raise_exception then
    if position('strictly forward' in sqlerrm) = 0 then raise; end if;
  end;

  begin
    insert into recora_private.plan_policy_versions (
      id, policy_key, policy_schema_version, effective_from, policy_document, supersedes_policy_version_id
    ) values (
      '10830000-0000-4000-8000-000000000004', 'issue_108_policy', 1, now() - interval '2 days',
      '{"capabilities":{"design":true},"limits":{"prompts":4}}'::jsonb,
      '10830000-0000-4000-8000-000000000002'
    );
    raise exception 'Issue 108 backward successor unexpectedly succeeded';
  exception when raise_exception then
    if position('strictly forward' in sqlerrm) = 0 then raise; end if;
  end;

  begin
    insert into recora_private.plan_policy_versions (
      id, policy_key, policy_schema_version, effective_from, policy_document, supersedes_policy_version_id
    ) values (
      '10830000-0000-4000-8000-000000000005', 'issue_108_other_policy', 1, now(),
      '{"capabilities":{"design":true},"limits":{"prompts":5}}'::jsonb,
      '10830000-0000-4000-8000-000000000002'
    );
    raise exception 'Issue 108 cross-policy successor unexpectedly succeeded';
  exception when raise_exception then
    if position('policy family' in sqlerrm) = 0 then raise; end if;
  end;

  begin
    insert into recora_private.plan_policy_versions (
      id, policy_key, policy_schema_version, effective_from, policy_document
    ) values (
      '10830000-0000-4000-8000-000000000006', 'issue_108_policy', 1, now(),
      '{"capabilities":{"design":true},"limits":{"prompts":6}}'::jsonb
    );
    raise exception 'Issue 108 second policy root unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;

  insert into recora_private.plan_policy_versions (
    id, policy_key, policy_schema_version, effective_from, policy_document, supersedes_policy_version_id
  ) values (
    '10830000-0000-4000-8000-000000000007', 'issue_108_policy', 1, now(),
    '{"capabilities":{"design":true},"limits":{"prompts":7}}'::jsonb,
    '10830000-0000-4000-8000-000000000002'
  );

  begin
    insert into recora_private.plan_policy_versions (
      id, policy_key, policy_schema_version, effective_from, policy_document, supersedes_policy_version_id
    ) values (
      '10830000-0000-4000-8000-000000000008', 'issue_108_policy', 1, now() + interval '1 day',
      '{"capabilities":{"design":true},"limits":{"prompts":8}}'::jsonb,
      '10830000-0000-4000-8000-000000000002'
    );
    raise exception 'Issue 108 second successor unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;

  if not exists (
    select 1 from recora_private.plan_policy_versions
    where id = '10830000-0000-4000-8000-000000000001'
      and policy_hash = v1_hash
      and policy_document = v1_document
      and effective_from = v1_effective_from
  ) or not exists (
    select 1 from recora_private.plan_policy_versions
    where id = '10830000-0000-4000-8000-000000000002'
      and policy_hash = v2_hash
      and policy_document = v2_document
      and effective_from = v2_effective_from
  ) then
    raise exception 'Issue 108 later successor changed an earlier policy row';
  end if;

  begin
    update recora_private.plan_policy_versions
    set policy_key = 'mutated'
    where id = '10830000-0000-4000-8000-000000000001';
    raise exception 'Issue 108 policy mutation unexpectedly succeeded';
  exception when others then
    if position('append-only' in sqlerrm) = 0 then raise; end if;
  end;

  begin
    update recora_private.entitlement_snapshots
    set resolved_document = '{"capabilities":{"design":false},"limits":{"prompts":0}}'::jsonb
    where id = '10840000-0000-4000-8000-000000000001';
    raise exception 'Issue 108 snapshot mutation unexpectedly succeeded';
  exception when others then
    if position('append-only' in sqlerrm) = 0 then raise; end if;
  end;

  update recora_private.current_entitlement_snapshots
  set snapshot_id = '10840000-0000-4000-8000-000000000002'
  where organization_id = '10810000-0000-4000-8000-000000000001'
    and project_id is null;

  select document_hash
  into a1_hash_after
  from recora_private.entitlement_snapshots
  where id = '10840000-0000-4000-8000-000000000001';

  if a1_hash_after is distinct from a1_hash then
    raise exception 'Issue 108 current-pointer switch changed historical A1 hash';
  end if;

  if public.recora_validate_entitlement_snapshot_reference(
    '10810000-0000-4000-8000-000000000001',
    null,
    '10840000-0000-4000-8000-000000000001'
  ) <> 'ok' then
    raise exception 'Issue 108 historical A1 reference was not accepted';
  end if;

  if public.recora_validate_entitlement_snapshot_reference(
    '10810000-0000-4000-8000-000000000002',
    null,
    '10840000-0000-4000-8000-000000000001'
  ) <> 'invalid_reference' then
    raise exception 'Issue 108 cross-tenant A1 reference did not fail closed';
  end if;

  if public.recora_validate_entitlement_snapshot_reference(
    '10810000-0000-4000-8000-000000000001',
    '10820000-0000-4000-8000-000000000002',
    '10840000-0000-4000-8000-000000000001'
  ) <> 'invalid_scope' then
    raise exception 'Issue 108 cross-tenant project scope did not fail closed';
  end if;

  if (
    select reason_code
    from public.recora_resolve_current_entitlement_snapshot(
      '10810000-0000-4000-8000-000000000004', null
    )
  ) <> 'no_snapshot' then
    raise exception 'Issue 108 missing snapshot did not fail closed';
  end if;

  if (
    select reason_code
    from public.recora_resolve_current_entitlement_snapshot(
      '10810000-0000-4000-8000-000000000003', null
    )
  ) <> 'expired_snapshot' then
    raise exception 'Issue 108 expired snapshot did not fail closed';
  end if;

  if (
    select reason_code
    from public.recora_resolve_current_entitlement_snapshot(
      '10810000-0000-4000-8000-000000000001',
      '10820000-0000-4000-8000-000000000002'
    )
  ) <> 'invalid_scope' then
    raise exception 'Issue 108 invalid project scope did not fail closed';
  end if;

  begin
    insert into recora_private.current_entitlement_snapshots (
      organization_id, project_id, snapshot_id
    ) values (
      '10810000-0000-4000-8000-000000000002',
      null,
      '10840000-0000-4000-8000-000000000001'
    );
    raise exception 'Issue 108 cross-tenant pointer unexpectedly succeeded';
  exception when foreign_key_violation or raise_exception then
    null;
  end;

  begin
    insert into recora_private.entitlement_snapshots (
      id, organization_id, project_id, source_contract_reference, plan_policy_version_id,
      entitlement_schema_version, resolved_document, effective_from, resolver_version, idempotency_key
    ) values (
      '10840000-0000-4000-8000-000000000006',
      '10810000-0000-4000-8000-000000000001',
      '10820000-0000-4000-8000-000000000002',
      'opaque:issue-108:cross-project',
      '10830000-0000-4000-8000-000000000001',
      1,
      '{"capabilities":{"design":true},"limits":{"prompts":1}}'::jsonb,
      now(),
      'issue-108-fixture',
      'issue-108-cross-project'
    );
    raise exception 'Issue 108 cross-tenant project snapshot unexpectedly succeeded';
  exception when foreign_key_violation or raise_exception then
    null;
  end;

  begin
    insert into recora_private.entitlement_snapshots (
      id, organization_id, source_contract_reference, plan_policy_version_id,
      entitlement_schema_version, resolved_document, effective_from, resolver_version, idempotency_key
    ) values (
      '10840000-0000-4000-8000-000000000007',
      '10810000-0000-4000-8000-000000000001',
      'opaque:issue-108:duplicate',
      '10830000-0000-4000-8000-000000000001',
      1,
      '{"capabilities":{"design":true},"limits":{"prompts":1}}'::jsonb,
      now(),
      'issue-108-fixture',
      'issue-108-a1'
    );
    raise exception 'Issue 108 duplicate idempotency request unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;

  drop index recora_private.current_entitlement_snapshots_organization_scope_unique;
  insert into recora_private.current_entitlement_snapshots (
    organization_id, project_id, snapshot_id
  ) values (
    '10810000-0000-4000-8000-000000000001',
    null,
    '10840000-0000-4000-8000-000000000001'
  );

  if (
    select reason_code
    from public.recora_resolve_current_entitlement_snapshot(
      '10810000-0000-4000-8000-000000000001', null
    )
  ) <> 'ambiguous_snapshot' then
    raise exception 'Issue 108 ambiguous current pointer did not fail closed';
  end if;
end;
$verify$;

rollback;
`);

console.log(
  JSON.stringify({
    status: "ok",
    database: "isolated-local-only",
    container: dbContainer,
    migration: path.relative(repoRoot, migrationPath),
    cases: {
      v1ToV2: "immutable",
      currentPointerA1ToA2: "historical-hash-preserved",
      projectScope: "preferred-and-tenant-bound",
      crossTenantReference: "rejected",
      duplicateRequest: "bounded",
      missingExpiredAmbiguousInvalid: "fail-closed",
      resolverResponse: "billing-safe"
    }
  })
);