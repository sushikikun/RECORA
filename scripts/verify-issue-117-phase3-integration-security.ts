import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type CommandResult = {
  stdout: string;
  stderr: string;
  status: number | null;
};

type ChildCase = {
  id: "3A" | "3B" | "3C" | "3D" | "3E" | "3F";
  source: string;
  expectedContainer: string;
  environment?: Record<string, string>;
};

const repoRoot = process.cwd();
const expectedContainer = "supabase_db_recoraissue117";
const dbContainer = process.env.RECORA_ISSUE_117_DB_CONTAINER;
const supabaseWorkdir = process.env.RECORA_ISSUE_117_SUPABASE_WORKDIR;
const supabaseCli = path.join(repoRoot, "node_modules", "supabase", "dist", "supabase.js");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const temporaryRoot = path.join(os.tmpdir(), "recora-issue-117-phase3-integration");
const recoraDbTypesPath = path.join(repoRoot, "lib", "recora", "db", "types.ts");

assert.equal(
  dbContainer,
  expectedContainer,
  "Issue #117 requires RECORA_ISSUE_117_DB_CONTAINER=supabase_db_recoraissue117; another task container is not permitted."
);
assert.ok(supabaseWorkdir, "Issue #117 requires RECORA_ISSUE_117_SUPABASE_WORKDIR for its isolated local stack.");
assert.ok(path.isAbsolute(supabaseWorkdir), "Issue #117 Supabase workdir must be an absolute temporary path.");
assert.match(supabaseWorkdir, /(?:^|[\\/])tmp(?:[\\/]|$)/i, "Issue #117 Supabase workdir must be under a temporary path.");
assert.ok(fs.existsSync(path.join(supabaseWorkdir, "supabase", "config.toml")), "Issue #117 isolated local config is missing.");
assert.ok(fs.existsSync(supabaseCli), "Local Supabase CLI dependency is missing.");
assert.ok(fs.existsSync(tsxCli), "Local tsx dependency is missing.");
const recoraDbTypesSource = fs.readFileSync(recoraDbTypesPath, "utf8");
const lifecycleRlsMigrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260730163156_recora_authoritative_lifecycle_rls_access.sql",
);
const lifecycleRlsMigrationSql = fs.readFileSync(lifecycleRlsMigrationPath, "utf8");
assert.match(recoraDbTypesSource, /export type RecoraOrganizationMembershipStatus\s*=\s*\| "invited"\s*\| "active"\s*\| "suspended"\s*\| "revoked"/);
assert.match(recoraDbTypesSource, /export type RecoraOrganizationRow[\s\S]*?is_demo: boolean/);
assert.match(recoraDbTypesSource, /export type RecoraOrganizationMemberRow[\s\S]*?membership_status: RecoraOrganizationMembershipStatus/);
assert.match(recoraDbTypesSource, /export type RecoraProjectRow[\s\S]*?organization_id: string/);

const classificationForbiddenKeys = [
  "rawProviderEnvelope",
  "internalMetadata",
  "internalError",
  "retryControl",
  "cost",
  "audit",
  "operatorNote",
  "billing",
  "otherTenant"
] as const;

const customerInformationClassificationFixture = {
  overview: { customerSafeCandidates: ["organizationSummary"], forbidden: classificationForbiddenKeys },
  "brand / competitor": { customerSafeCandidates: ["brand", "competitor"], forbidden: classificationForbiddenKeys },
  "persona / topic": { customerSafeCandidates: ["persona", "topic"], forbidden: classificationForbiddenKeys },
  prompt: { customerSafeCandidates: ["prompt"], forbidden: classificationForbiddenKeys },
  "AI answer / detail": { customerSafeCandidates: ["answerBody", "answerExcerpt"], forbidden: classificationForbiddenKeys },
  "citation / source": { customerSafeCandidates: ["citation", "source"], forbidden: classificationForbiddenKeys },
  "brand perception": { customerSafeCandidates: ["perception"], forbidden: classificationForbiddenKeys },
  trend: { customerSafeCandidates: ["trend"], forbidden: classificationForbiddenKeys },
  recommendation: { customerSafeCandidates: ["recommendation"], forbidden: classificationForbiddenKeys },
  settings: { customerSafeCandidates: ["settings"], forbidden: classificationForbiddenKeys }
} as const;

assert.deepEqual(Object.keys(customerInformationClassificationFixture).sort(), [
  "overview",
  "brand / competitor",
  "persona / topic",
  "prompt",
  "AI answer / detail",
  "citation / source",
  "brand perception",
  "trend",
  "recommendation",
  "settings"
].sort());
for (const classification of Object.values(customerInformationClassificationFixture)) {
  assert.deepEqual(Object.keys(classification).sort(), ["customerSafeCandidates", "forbidden"]);
  assert.deepEqual(classification.forbidden, classificationForbiddenKeys);
}
assert.deepEqual(customerInformationClassificationFixture["AI answer / detail"].customerSafeCandidates, ["answerBody", "answerExcerpt"]);
assert.deepEqual(customerInformationClassificationFixture["citation / source"].customerSafeCandidates, ["citation", "source"]);

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
}

function run(executable: string, args: string[], options: { input?: string; env?: NodeJS.ProcessEnv | Record<string, string>; timeout?: number } = {}): CommandResult {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...options.env },
    input: options.input,
    maxBuffer: 30 * 1024 * 1024,
    timeout: options.timeout ?? 180_000
  });
  const stdout = `${result.stdout ?? ""}`;
  const stderr = `${result.stderr ?? ""}`;
  if (result.error) throw result.error;
  return { stdout, stderr, status: result.status };
}

function requireSuccess(name: string, result: CommandResult): string {
  const output = sanitize(`${result.stdout}\n${result.stderr}`);
  assert.equal(result.status, 0, `${name} failed with local exit status ${result.status}:\n${output}`);
  return output;
}

function runSupabase(name: string, args: string[]): string {
  return requireSuccess(name, run(process.execPath, [supabaseCli, "--workdir", supabaseWorkdir!, ...args]));
}

function queryLocal(sql: string): string {
  return requireSuccess(
    "Issue #117 local matrix SQL",
    run(
      "docker",
      [
        "exec",
        "--interactive",
        dbContainer!,
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
      { input: sql, timeout: 120_000 }
    )
  );
}

function parseMachineJson(name: string, output: string): Record<string, unknown> {
  const start = output.indexOf("{");
  assert.notEqual(start, -1, `${name} did not emit machine JSON.`);
  const parsed = JSON.parse(output.slice(start)) as Record<string, unknown>;
  assert.equal(parsed.status, "ok", `${name} JSON did not report status=ok.`);
  return parsed;
}

function prepareTemporaryChild(caseDefinition: ChildCase): string {
  const sourcePath = path.join(repoRoot, caseDefinition.source);
  const original = fs.readFileSync(sourcePath, "utf8");
  assert.ok(original.includes(caseDefinition.expectedContainer), `${caseDefinition.id} container guard was not found in its source.`);
  const transformed = original.replaceAll(caseDefinition.expectedContainer, dbContainer!);
  const scriptsDirectory = path.join(temporaryRoot, "scripts");
  const libLink = path.join(temporaryRoot, "lib");
  const serverOnlyDirectory = path.join(temporaryRoot, "node_modules", "server-only");
  fs.mkdirSync(scriptsDirectory, { recursive: true });
  fs.mkdirSync(serverOnlyDirectory, { recursive: true });
  fs.writeFileSync(path.join(serverOnlyDirectory, "index.js"), "module.exports = {};\n", "utf8");
  if (!fs.existsSync(libLink)) {
    fs.symlinkSync(path.join(repoRoot, "lib"), libLink, "junction");
  }
  const temporarySource = path.join(scriptsDirectory, path.basename(caseDefinition.source));
  fs.writeFileSync(temporarySource, transformed, "utf8");
  return temporarySource;
}

function runChild(caseDefinition: ChildCase): Record<string, unknown> {
  const temporarySource = prepareTemporaryChild(caseDefinition);
  const output = requireSuccess(
    `Issue #117 ${caseDefinition.id} child verifier`,
    run(process.execPath, [tsxCli, temporarySource], {
      env: { ...caseDefinition.environment, NODE_PATH: path.join(temporaryRoot, "node_modules") },
      timeout: 240_000
    })
  );
  return parseMachineJson(`Issue #117 ${caseDefinition.id} child verifier`, output);
}

function runIssue114Verifier(): Record<string, unknown> {
  const serverOnlyDirectory = path.join(temporaryRoot, "node_modules", "server-only");
  fs.mkdirSync(serverOnlyDirectory, { recursive: true });
  fs.writeFileSync(path.join(serverOnlyDirectory, "index.js"), "module.exports = {};\n", "utf8");
  const output = requireSuccess(
    "Issue #117 3G child verifier",
    run(process.execPath, [tsxCli, path.join(repoRoot, "scripts", "verify-issue-114-external-ai-payload-safety.ts")], {
      env: { NODE_PATH: path.join(temporaryRoot, "node_modules") }
    })
  );
  return parseMachineJson("Issue #117 3G child verifier", output);
}

const childCases: ChildCase[] = [
  { id: "3A", source: "scripts/verify-issue-80-local-supabase-bootstrap.ts", expectedContainer: "supabase_db_recora" },
  { id: "3B", source: "scripts/verify-issue-105-tenant-ownership-membership.ts", expectedContainer: "supabase_db_recora" },
  { id: "3C", source: "scripts/verify-issue-107-composite-tenant-isolation.ts", expectedContainer: "supabase_db_recora-issue-107" },
  {
    id: "3D",
    source: "scripts/verify-issue-108-plan-entitlement-history.ts",
    expectedContainer: "supabase_db_recora-issue-108-v2",
    environment: { RECORA_ISSUE_108_DB_CONTAINER: expectedContainer }
  },
  { id: "3E", source: "scripts/verify-issue-109-operator-authorization-audit.ts", expectedContainer: "supabase_db_recora-issue-109" },
  {
    id: "3F",
    source: "scripts/verify-issue-113-retention-deletion-state.ts",
    expectedContainer: "supabase_db_recora-issue-113",
    environment: { RECORA_ISSUE_113_DB_CONTAINER: expectedContainer }
  }
];

runSupabase("Issue #117 migration-only reset", ["db", "reset", "--local", "--no-seed"]);
queryLocal(`
do $migration_only$
begin
  if current_database() <> 'postgres' then raise exception 'unexpected local database'; end if;
  if not exists (select 1 from public.organizations where slug = 'recora-internal-demo' and is_demo is true)
    or exists (select 1 from public.organizations where slug <> 'recora-internal-demo')
    or exists (select 1 from public.projects) then
    raise exception 'migration-only reset tenant fixture is not the approved 3A demo-only baseline';
  end if;
  if not exists (
    select 1
    from recora_private.data_lifecycle_current lifecycle_row
    join public.organizations organization_row on organization_row.id = lifecycle_row.organization_id
    where organization_row.slug = 'recora-internal-demo'
      and lifecycle_row.project_id is null
      and lifecycle_row.state = 'active'::recora_private.data_lifecycle_state
  ) or exists (
    select 1
    from recora_private.data_lifecycle_events event_row
    join public.organizations organization_row on organization_row.id = event_row.organization_id
    where organization_row.slug = 'recora-internal-demo'
  ) then
    raise exception 'lifecycle bootstrap must be active and must not create a fake lifecycle event';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_private' and c.relname = 'entitlement_snapshots')
    or not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_audit' and c.relname = 'operator_events')
    or not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_private' and c.relname = 'data_lifecycle_current') then
    raise exception 'migration-only replay is missing a Phase 3 foundation relation';
  end if;
end;
$migration_only$;
`);

runSupabase("Issue #117 seeded reset", ["db", "reset", "--local"]);
const seededDemoFixtureCheckSql = `
begin;
do $seeded_demo_lifecycle$
begin
  if (select count(*)
      from recora_private.data_lifecycle_current lifecycle_row
      where lifecycle_row.organization_id = '00000000-0000-4000-8000-000000000001'
        and lifecycle_row.project_id is null
        and lifecycle_row.state = 'active'::recora_private.data_lifecycle_state) <> 1 then
    raise exception 'seeded demo requires exactly one explicit active organization lifecycle row';
  end if;

  if exists (
    select 1
    from recora_private.data_lifecycle_events event_row
    where event_row.organization_id = '00000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'seeded demo lifecycle fixture must not create a lifecycle event';
  end if;
end;
$seeded_demo_lifecycle$;

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
do $seeded_demo_anon_read$
begin
  if (select count(*) from public.organizations where id = '00000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.projects where id = '10000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.brands where project_id = '10000000-0000-4000-8000-000000000001') = 0
    or not recora_private.can_read_organization('00000000-0000-4000-8000-000000000001')
    or not recora_private.can_read_project('10000000-0000-4000-8000-000000000001')
    or exists (select 1 from public.organizations where is_demo is false) then
    raise exception 'seeded demo lifecycle/RLS boundary failed';
  end if;
end;
$seeded_demo_anon_read$;
commit;
`;
queryLocal(seededDemoFixtureCheckSql);
runSupabase("Issue #117 seeded reset idempotency", ["db", "reset", "--local"]);
queryLocal(seededDemoFixtureCheckSql);
const migrationList = runSupabase("Issue #117 local migration list", ["migration", "list", "--local"]);
assert.match(migrationList, /20260730163156/, "Issue #117 local migration list is missing the authoritative lifecycle/RLS migration.");

const advisors = runSupabase("Issue #117 local security/performance advisors", ["db", "advisors", "--local"]);
assert.doesNotMatch(advisors, /\b(?:warn|error)\b/i, "Issue #117 local advisors reported a warning or error.");

queryLocal(`
do $phase3_catalog_type_drift$
declare
  missing_relations text;
  missing_columns text;
  missing_constraints text;
  missing_policies text;
begin
  select string_agg(format('%I.%I', expected.schema_name, expected.relation_name), ', ' order by expected.schema_name, expected.relation_name)
  into missing_relations
  from (
    values
      ('public', 'organizations'),
      ('public', 'organization_members'),
      ('public', 'projects'),
      ('public', 'brands'),
      ('public', 'personas'),
      ('public', 'topics'),
      ('public', 'prompts'),
      ('public', 'measurement_runs'),
      ('public', 'run_items'),
      ('public', 'ai_conversations'),
      ('public', 'source_domains'),
      ('public', 'brand_mentions'),
      ('public', 'citations'),
      ('public', 'metric_snapshots'),
      ('public', 'recommendations'),
      ('recora_private', 'plan_policy_versions'),
      ('recora_private', 'entitlement_snapshots'),
      ('recora_private', 'current_entitlement_snapshots'),
      ('recora_operator', 'operator_identities'),
      ('recora_operator', 'operator_action_grants'),
      ('recora_operator', 'operator_command_receipts'),
      ('recora_audit', 'operator_events'),
      ('recora_private', 'data_lifecycle_current'),
      ('recora_private', 'data_lifecycle_events'),
      ('recora_private', 'data_lifecycle_decision_evidence'),
      ('recora_private', 'deletion_manifests'),
      ('recora_private', 'deletion_attempts')
  ) expected(schema_name, relation_name)
  where not exists (
    select 1
    from pg_class relation_row
    join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = expected.schema_name
      and relation_row.relname = expected.relation_name
      and relation_row.relkind = 'r'
  );
  if missing_relations is not null then
    raise exception 'Phase 3 catalog relation drift: %', missing_relations;
  end if;

  select string_agg(format('%I.%I.%I', expected.schema_name, expected.relation_name, expected.column_name), ', ' order by expected.schema_name, expected.relation_name, expected.column_name)
  into missing_columns
  from (
    values
      ('public', 'organizations', 'is_demo', 'bool'),
      ('public', 'organization_members', 'membership_status', 'recora_organization_membership_status'),
      ('public', 'projects', 'organization_id', 'uuid'),
      ('public', 'prompts', 'project_id', 'uuid'),
      ('public', 'run_items', 'project_id', 'uuid'),
      ('public', 'ai_conversations', 'project_id', 'uuid'),
      ('public', 'citations', 'project_id', 'uuid'),
      ('public', 'metric_snapshots', 'project_id', 'uuid'),
      ('recora_private', 'plan_policy_versions', 'policy_document', 'jsonb'),
      ('recora_private', 'entitlement_snapshots', 'resolved_document', 'jsonb'),
      ('recora_private', 'current_entitlement_snapshots', 'snapshot_id', 'uuid'),
      ('recora_operator', 'operator_identities', 'status', 'operator_status'),
      ('recora_operator', 'operator_action_grants', 'permission', 'text'),
      ('recora_audit', 'operator_events', 'outcome', 'operator_audit_outcome'),
      ('recora_private', 'data_lifecycle_current', 'state', 'data_lifecycle_state'),
      ('recora_private', 'data_lifecycle_events', 'next_state', 'data_lifecycle_state'),
      ('recora_private', 'data_lifecycle_decision_evidence', 'lifecycle_version', 'int8'),
      ('recora_private', 'deletion_manifests', 'manifest_hash', 'text'),
      ('recora_private', 'deletion_attempts', 'attempt_number', 'int4')
  ) expected(schema_name, relation_name, column_name, expected_udt)
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = expected.schema_name
      and column_row.table_name = expected.relation_name
      and column_row.column_name = expected.column_name
      and column_row.udt_name = expected.expected_udt
  );
  if missing_columns is not null then
    raise exception 'Phase 3 catalog column/type drift: %', missing_columns;
  end if;

  select string_agg(expected.constraint_name, ', ' order by expected.constraint_name)
  into missing_constraints
  from (
    values
      ('public', 'projects_id_organization_id_unique'),
      ('public', 'prompts_topic_project_fkey'),
      ('public', 'ai_conversations_run_item_project_fkey'),
      ('public', 'citations_conversation_project_fkey'),
      ('recora_private', 'entitlement_snapshots_id_organization_project_id_unique'),
      ('recora_private', 'current_entitlement_snapshots_organization_project_fkey'),
      ('recora_operator', 'operator_action_grants_project_scope_fkey'),
      ('recora_audit', 'operator_events_project_scope_fkey'),
      ('recora_private', 'data_lifecycle_current_project_scope_fkey'),
      ('recora_private', 'data_lifecycle_events_scope_version_unique'),
      ('recora_private', 'data_lifecycle_decision_evidence_version_unique'),
      ('recora_private', 'deletion_manifests_scope_version_unique'),
      ('recora_private', 'deletion_attempts_manifest_number_unique')
  ) expected(schema_name, constraint_name)
  where not exists (
    select 1
    from pg_constraint constraint_row
    join pg_namespace namespace_row on namespace_row.oid = constraint_row.connamespace
    where namespace_row.nspname = expected.schema_name
      and constraint_row.conname = expected.constraint_name
  );
  if missing_constraints is not null then
    raise exception 'Phase 3 catalog constraint drift: %', missing_constraints;
  end if;

  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into missing_policies
  from (
    values
      ('organizations'), ('organization_members'), ('projects'), ('brands'), ('personas'), ('topics'),
      ('prompts'), ('ai_models'), ('measurement_runs'), ('run_items'), ('ai_conversations'),
      ('source_domains'), ('brand_mentions'), ('citations'), ('metric_snapshots'), ('recommendations')
  ) expected(table_name)
  where not exists (
    select 1
    from pg_class relation_row
    where relation_row.oid = format('public.%I', expected.table_name)::regclass
      and relation_row.relrowsecurity
  ) or not exists (
    select 1
    from pg_policies policy_row
    where policy_row.schemaname = 'public'
      and policy_row.tablename = expected.table_name
      and policy_row.cmd = 'SELECT'
  );
  if missing_policies is not null then
    raise exception 'Phase 3 catalog RLS/policy drift: %', missing_policies;
  end if;

  if not exists (
    select 1
    from pg_policy policy_row
    join pg_class relation_row on relation_row.oid = policy_row.polrelid
    join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'public'
      and relation_row.relname = 'organization_members'
      and policy_row.polname = 'recora_member_organization_members_select'
      and position('user_id' in pg_get_expr(policy_row.polqual, policy_row.polrelid)) > 0
      and position('recora_private.can_read_organization(organization_id)' in pg_get_expr(policy_row.polqual, policy_row.polrelid)) > 0
  ) then
    raise exception 'organization_members lifecycle-aware select policy drift';
  end if;
  if (select array_agg(enumlabel::text order by enumsortorder)
      from pg_enum where enumtypid = 'public.recora_organization_membership_status'::regtype)
      is distinct from array['invited','active','suspended','revoked'] then
    raise exception 'membership lifecycle enum type drift';
  end if;
  if (select array_agg(enumlabel::text order by enumsortorder)
      from pg_enum where enumtypid = 'recora_private.data_lifecycle_state'::regtype)
      is distinct from array['active','access_suspended','retained','deletion_scheduled','deleting','deleted','deletion_failed'] then
    raise exception 'data lifecycle enum type drift';
  end if;
  if (select array_agg(enumlabel::text order by enumsortorder)
      from pg_enum where enumtypid = 'recora_operator.operator_status'::regtype)
      is distinct from array['active','suspended','revoked'] then
    raise exception 'operator status enum type drift';
  end if;
  if (select array_agg(enumlabel::text order by enumsortorder)
      from pg_enum where enumtypid = 'recora_audit.operator_audit_outcome'::regtype)
      is distinct from array['success','denied','failed'] then
    raise exception 'operator audit outcome enum type drift';
  end if;

  if to_regprocedure('public.recora_resolve_current_entitlement_snapshot(uuid,uuid)') is null
    or to_regprocedure('public.recora_validate_entitlement_snapshot_reference(uuid,uuid,uuid)') is null
    or to_regprocedure('public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)') is null
    or to_regprocedure('public.recora_resolve_data_lifecycle_access(uuid,uuid)') is null
    or to_regprocedure('public.recora_set_data_lifecycle_legal_hold(uuid,uuid,uuid,bigint,text,text,text,uuid,uuid)') is null
    or to_regprocedure('public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)') is null
    or to_regprocedure('recora_private.resolve_data_lifecycle_access(uuid,uuid)') is null
    or to_regprocedure('recora_private.is_customer_lifecycle_access_allowed(uuid,uuid)') is null
    or to_regprocedure('recora_private.can_read_organization_identity(uuid)') is null then
    raise exception 'Phase 3 function signature drift';
  end if;

  if not has_function_privilege('service_role', 'public.recora_resolve_current_entitlement_snapshot(uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_validate_entitlement_snapshot_reference(uuid,uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_resolve_data_lifecycle_access(uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_set_data_lifecycle_legal_hold(uuid,uuid,uuid,bigint,text,text,text,uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE') then
    raise exception 'Phase 3 service-role function grant drift';
  end if;

  if has_function_privilege('anon', 'public.recora_resolve_current_entitlement_snapshot(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_validate_entitlement_snapshot_reference(uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_resolve_data_lifecycle_access(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_set_data_lifecycle_legal_hold(uuid,uuid,uuid,bigint,text,text,text,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE') then
    raise exception 'browser role can execute a privileged Phase 3 RPC';
  end if;

  if not has_function_privilege('anon', 'recora_private.can_read_organization(uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'recora_private.can_read_project(uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'recora_private.resolve_data_lifecycle_access(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'recora_private.is_customer_lifecycle_access_allowed(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'recora_private.can_read_organization_identity(uuid)', 'EXECUTE') then
    raise exception 'authoritative lifecycle helper grant boundary drift';
  end if;
end;
$phase3_catalog_type_drift$;
`);

const childResults = Object.fromEntries(childCases.map((caseDefinition) => [caseDefinition.id, runChild(caseDefinition)]));
const payloadResult = runIssue114Verifier();

// 3F deliberately replays its historical migration as part of its isolated
// contract. Restore the current additive lifecycle migration before the final
// cross-component inventory and matrix assert the latest-master schema.
queryLocal(lifecycleRlsMigrationSql);

queryLocal(`
do $phase3_full_inventory$
declare
  unclassified_public text;
  unsafe_rls text;
  unsafe_browser_write text;
  unsafe_sequence_write text;
  unsafe_private_grant text;
  unsafe_definer_path text;
  unsafe_public_execute text;
  unsafe_browser_execute text;
  unsafe_customer_view text;
  unsafe_p4b_function_grant text;
begin
  select string_agg(format('%I.%I', namespace_row.nspname, relation_row.relname), ', ' order by namespace_row.nspname, relation_row.relname)
  into unclassified_public
  from pg_class relation_row
  join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
  where namespace_row.nspname = 'public'
    and relation_row.relkind in ('r', 'v', 'm', 'S')
    and relation_row.relname <> all (array[
      'organizations', 'organization_members', 'projects', 'brands', 'personas', 'topics', 'prompts',
      'ai_models', 'measurement_runs', 'run_items', 'ai_conversations', 'source_domains', 'brand_mentions',
      'citations', 'metric_snapshots', 'recommendations'
    ]);
  if unclassified_public is not null then
    raise exception 'unclassified public Phase 3 relation(s): %', unclassified_public;
  end if;

  select string_agg(relation_row.relname, ', ' order by relation_row.relname)
  into unsafe_rls
  from pg_class relation_row
  join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
  where namespace_row.nspname = 'public'
    and relation_row.relkind = 'r'
    and relation_row.relname = any (array[
      'organizations', 'organization_members', 'projects', 'brands', 'personas', 'topics', 'prompts',
      'ai_models', 'measurement_runs', 'run_items', 'ai_conversations', 'source_domains', 'brand_mentions',
      'citations', 'metric_snapshots', 'recommendations'
    ])
    and (
      not relation_row.relrowsecurity
      or not exists (
        select 1 from pg_policies policy_row
        where policy_row.schemaname = 'public'
          and policy_row.tablename = relation_row.relname
          and policy_row.cmd = 'SELECT'
      )
    );
  if unsafe_rls is not null then
    raise exception 'customer tenant RLS/policy missing: %', unsafe_rls;
  end if;

  select string_agg(format('%I.%I', namespace_row.nspname, relation_row.relname), ', ' order by namespace_row.nspname, relation_row.relname)
  into unsafe_browser_write
  from pg_class relation_row
  join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
  where namespace_row.nspname = 'public'
    and relation_row.relkind in ('r', 'v', 'm')
    and relation_row.relname = any (array[
      'organizations', 'organization_members', 'projects', 'brands', 'personas', 'topics', 'prompts',
      'ai_models', 'measurement_runs', 'run_items', 'ai_conversations', 'source_domains', 'brand_mentions',
      'citations', 'metric_snapshots', 'recommendations'
    ])
    and (
      has_table_privilege('anon', relation_row.oid, 'INSERT,UPDATE,DELETE')
      or has_table_privilege('authenticated', relation_row.oid, 'INSERT,UPDATE,DELETE')
    );
  if unsafe_browser_write is not null then
    raise exception 'browser write privilege on public relation(s): %', unsafe_browser_write;
  end if;

  select string_agg(format('%I.%I', namespace_row.nspname, relation_row.relname), ', ' order by namespace_row.nspname, relation_row.relname)
  into unsafe_sequence_write
  from pg_class relation_row
  join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
  where namespace_row.nspname in ('public', 'recora_private', 'recora_operator', 'recora_audit')
    and relation_row.relkind = 'S'
    and (
      has_sequence_privilege('anon', relation_row.oid, 'USAGE,UPDATE')
      or has_sequence_privilege('authenticated', relation_row.oid, 'USAGE,UPDATE')
    );
  if unsafe_sequence_write is not null then
    raise exception 'browser sequence usage/update privilege: %', unsafe_sequence_write;
  end if;

  select string_agg(format('%I.%I', namespace_row.nspname, relation_row.relname), ', ' order by namespace_row.nspname, relation_row.relname)
  into unsafe_private_grant
  from pg_class relation_row
  join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
  where namespace_row.nspname in ('recora_private', 'recora_operator', 'recora_audit')
    and relation_row.relkind in ('r', 'v', 'm', 'S')
    and (
      has_table_privilege('anon', relation_row.oid, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('authenticated', relation_row.oid, 'SELECT,INSERT,UPDATE,DELETE')
      or (relation_row.relkind = 'S' and (
        has_sequence_privilege('anon', relation_row.oid, 'USAGE,UPDATE')
        or has_sequence_privilege('authenticated', relation_row.oid, 'USAGE,UPDATE')
      ))
    );
  if unsafe_private_grant is not null then
    raise exception 'browser role grant on private relation(s): %', unsafe_private_grant;
  end if;

  select string_agg(format('%I.%I(%s)', namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid)), ', ' order by namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid))
  into unsafe_definer_path
  from pg_proc function_row
  join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname in ('public', 'recora_private', 'recora_operator', 'recora_audit')
    and function_row.prosecdef
    and not (
      function_row.proconfig is not null
      and 'search_path=""' = any(function_row.proconfig)
    );
  if unsafe_definer_path is not null then
    raise exception 'security definer function(s) lack fixed empty search_path: %', unsafe_definer_path;
  end if;

  select string_agg(format('%I.%I(%s)', namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid)), ', ' order by namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid))
  into unsafe_public_execute
  from pg_proc function_row
  join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname in ('public', 'recora_private', 'recora_operator', 'recora_audit')
    and has_function_privilege('public', function_row.oid, 'EXECUTE');
  if unsafe_public_execute is not null then
    raise exception 'default PUBLIC EXECUTE on Phase 3 function(s): %', unsafe_public_execute;
  end if;

  with allowed(signature) as (
    values
      ('recora_private.can_read_conversation(uuid)'),
      ('recora_private.can_read_organization(uuid)'),
      ('recora_private.can_read_project(uuid)'),
      ('recora_private.can_read_run(uuid)'),
      ('recora_private.can_read_run_item(uuid)'),
      ('recora_private.is_customer_visible_recommendation(public.recora_recommendation_state,jsonb)'),
      ('recora_private.is_demo_organization(uuid)'),
      ('recora_private.is_organization_member(uuid)'),
      ('recora_private.resolve_unambiguous_organization_id()'),
      ('public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)')
  )
  select string_agg(format('%I.%I(%s)', namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid)), ', ' order by namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid))
  into unsafe_browser_execute
  from pg_proc function_row
  join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname in ('public', 'recora_private', 'recora_operator', 'recora_audit')
    and (
      has_function_privilege('anon', function_row.oid, 'EXECUTE')
      or has_function_privilege('authenticated', function_row.oid, 'EXECUTE')
    )
    and not exists (
      select 1 from allowed
      where to_regprocedure(allowed.signature) = function_row.oid
    );
  if unsafe_browser_execute is not null then
    raise exception 'browser EXECUTE outside signature allowlist: %', unsafe_browser_execute;
  end if;

  if to_regprocedure('public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)') is null then
    raise exception 'P4-B authenticated invitation accept RPC signature missing';
  end if;
  if has_function_privilege('anon', 'public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)', 'EXECUTE') then
    raise exception 'P4-B accept RPC grant boundary drift';
  end if;

  select string_agg(format('%I.%I(%s)', namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid)), ', ' order by namespace_row.nspname, function_row.proname,
    pg_get_function_identity_arguments(function_row.oid))
  into unsafe_p4b_function_grant
  from pg_proc function_row
  join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname = 'public'
    and function_row.proname like 'recora_p4b_%'
    and function_row.oid <> 'public.recora_p4b_invitation_accept(uuid,uuid,uuid,text)'::regprocedure
    and (
      has_function_privilege('anon', function_row.oid, 'EXECUTE')
      or has_function_privilege('authenticated', function_row.oid, 'EXECUTE')
      or not has_function_privilege('service_role', function_row.oid, 'EXECUTE')
    );
  if unsafe_p4b_function_grant is not null then
    raise exception 'P4-B service-role RPC grant boundary drift: %', unsafe_p4b_function_grant;
  end if;
  select string_agg(format('%I.%I', namespace_row.nspname, relation_row.relname), ', ' order by namespace_row.nspname, relation_row.relname)
  into unsafe_customer_view
  from pg_class relation_row
  join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
  where namespace_row.nspname = 'public'
    and relation_row.relkind = 'v'
    and relation_row.relname = any (array[
      'organizations', 'organization_members', 'projects', 'brands', 'personas', 'topics', 'prompts',
      'ai_models', 'measurement_runs', 'run_items', 'ai_conversations', 'source_domains', 'brand_mentions',
      'citations', 'metric_snapshots', 'recommendations'
    ])
    and not coalesce(relation_row.reloptions, array[]::text[]) @> array['security_invoker=true'];
  if unsafe_customer_view is not null then
    raise exception 'customer view(s) lack security_invoker: %', unsafe_customer_view;
  end if;

  if has_function_privilege('anon', 'public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_resolve_data_lifecycle_access(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_resolve_data_lifecycle_access(uuid,uuid)', 'EXECUTE')
    or has_schema_privilege('anon', 'recora_operator', 'USAGE')
    or has_schema_privilege('authenticated', 'recora_audit', 'USAGE') then
    raise exception 'customer role can reach a service-role/operator/audit capability';
  end if;
end;
$phase3_full_inventory$;
`);

queryLocal(`
begin;

insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
values
  ('11710000-0000-4000-8000-000000000001', 'issue-117-lifecycle-a', 'Issue 117 Lifecycle A', 'client', 'local', false, false),
  ('11710000-0000-4000-8000-000000000002', 'issue-117-lifecycle-b', 'Issue 117 Lifecycle B', 'client', 'local', false, false),
  ('11710000-0000-4000-8000-000000000003', 'issue-117-lifecycle-demo', 'Issue 117 Lifecycle Demo', 'internal', 'local', true, true),
  ('11710000-0000-4000-8000-000000000004', 'issue-117-lifecycle-missing', 'Issue 117 Lifecycle Missing', 'client', 'local', false, false),
  ('11710000-0000-4000-8000-000000000005', 'issue-117-lifecycle-demo-missing', 'Issue 117 Lifecycle Demo Missing', 'internal', 'local', true, true);

insert into auth.users (id, email, created_at, updated_at)
values
  ('11700000-0000-4000-8000-000000000001', 'issue-117-active-a@example.invalid', now(), now()),
  ('11700000-0000-4000-8000-000000000002', 'issue-117-active-b@example.invalid', now(), now()),
  ('11700000-0000-4000-8000-000000000003', 'issue-117-missing@example.invalid', now(), now());

insert into public.organization_members (organization_id, user_id, email, role, invited_at, accepted_at, membership_status)
values
  ('11710000-0000-4000-8000-000000000001', '11700000-0000-4000-8000-000000000001', 'issue-117-active-a@example.invalid', 'member', now(), now(), 'active'),
  ('11710000-0000-4000-8000-000000000002', '11700000-0000-4000-8000-000000000002', 'issue-117-active-b@example.invalid', 'member', now(), now(), 'active'),
  ('11710000-0000-4000-8000-000000000004', '11700000-0000-4000-8000-000000000003', 'issue-117-missing@example.invalid', 'member', now(), now(), 'active');

insert into public.projects (id, organization_id, slug, name)
values
  ('11720000-0000-4000-8000-000000000001', '11710000-0000-4000-8000-000000000001', 'issue-117-lifecycle-project-a', 'Issue 117 Lifecycle Project A'),
  ('11720000-0000-4000-8000-000000000002', '11710000-0000-4000-8000-000000000002', 'issue-117-lifecycle-project-b', 'Issue 117 Lifecycle Project B'),
  ('11720000-0000-4000-8000-000000000003', '11710000-0000-4000-8000-000000000003', 'issue-117-lifecycle-project-demo', 'Issue 117 Lifecycle Project Demo'),
  ('11720000-0000-4000-8000-000000000004', '11710000-0000-4000-8000-000000000004', 'issue-117-lifecycle-project-missing', 'Issue 117 Lifecycle Project Missing'),
  ('11720000-0000-4000-8000-000000000005', '11710000-0000-4000-8000-000000000005', 'issue-117-lifecycle-project-demo-missing', 'Issue 117 Lifecycle Project Demo Missing');

insert into public.brands (id, project_id, brand_type, name)
values
  ('11730000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', 'primary', 'Issue 117 Lifecycle Brand A'),
  ('11730000-0000-4000-8000-000000000002', '11720000-0000-4000-8000-000000000002', 'primary', 'Issue 117 Lifecycle Brand B'),
  ('11730000-0000-4000-8000-000000000003', '11720000-0000-4000-8000-000000000003', 'primary', 'Issue 117 Lifecycle Brand Demo');

insert into recora_private.data_lifecycle_current (organization_id, project_id, state)
values
  ('11710000-0000-4000-8000-000000000001', null, 'active'),
  ('11710000-0000-4000-8000-000000000002', null, 'active'),
  ('11710000-0000-4000-8000-000000000003', null, 'active');

create function pg_temp.assert_customer_scope_active() returns void language plpgsql as $$
begin
  if (select count(*) from public.organizations where id = '11710000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.projects where id = '11720000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.brands where id = '11730000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000001' and user_id = (select auth.uid())) <> 1
    or exists (select 1 from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000001' and user_id <> (select auth.uid()))
    or exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000002')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000002')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000002')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000002')
    or has_table_privilege(current_user, 'public.projects', 'INSERT,UPDATE,DELETE')
    or has_table_privilege(current_user, 'recora_private.data_lifecycle_current', 'SELECT')
    or has_schema_privilege(current_user, 'recora_operator', 'USAGE') then
    raise exception 'active customer scope/access boundary failed';
  end if;
end;
$$;

create function pg_temp.assert_customer_scope_denied(p_state text) returns void language plpgsql as $$
begin
  if exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000001')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000001')
    or exists (select 1 from public.projects where slug = 'issue-117-lifecycle-project-a')
    or exists (select 1 from public.projects where slug ilike '%lifecycle-project-a%')
    or (select count(*) from public.projects where slug like 'issue-117-lifecycle-project-%') <> 0
    or exists (
      select 1 from (
        select id from public.projects where slug like 'issue-117-lifecycle-project-%' order by slug limit 2 offset 0
      ) page_row where page_row.id = '11720000-0000-4000-8000-000000000001'
    )
    or exists (
      select 1 from public.brands brand_row
      join public.projects project_row on project_row.id = brand_row.project_id
      join public.organizations organization_row on organization_row.id = project_row.organization_id
      where brand_row.id = '11730000-0000-4000-8000-000000000001'
    )
    or exists (select 1 from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000001')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000001') then
    raise exception 'customer RLS/Data API lifecycle denial failed for %', p_state;
  end if;
end;
$$;

create function pg_temp.assert_demo_active() returns void language plpgsql as $$
begin
  if (select count(*) from public.organizations where id = '11710000-0000-4000-8000-000000000003') <> 1
    or (select count(*) from public.projects where id = '11720000-0000-4000-8000-000000000003') <> 1
    or not recora_private.can_read_organization('11710000-0000-4000-8000-000000000003')
    or not recora_private.can_read_project('11720000-0000-4000-8000-000000000003')
    or exists (select 1 from public.organizations where is_demo is false) then
    raise exception 'active anon demo/local boundary failed';
  end if;
end;
$$;

create function pg_temp.assert_organization_hard_ceiling_denied() returns void language plpgsql as $$
begin
  if exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000001')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000001')
    or exists (select 1 from public.brands where id = '11730000-0000-4000-8000-000000000001')
    or exists (select 1 from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000001')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000001') then
    raise exception 'organization lifecycle hard ceiling was bypassed by an active project';
  end if;
end;
$$;

create function pg_temp.assert_project_scope_denied() returns void language plpgsql as $$
begin
  if (select count(*) from public.organizations where id = '11710000-0000-4000-8000-000000000001') <> 1
    or not recora_private.can_read_organization('11710000-0000-4000-8000-000000000001')
    or (select count(*) from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000001' and user_id = (select auth.uid())) <> 1
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000001')
    or exists (select 1 from public.projects where slug = 'issue-117-lifecycle-project-a')
    or exists (select 1 from public.brands where id = '11730000-0000-4000-8000-000000000001')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000001') then
    raise exception 'project-specific restrictive lifecycle differs from RLS';
  end if;
end;
$$;

create function pg_temp.assert_resolver_access(
  p_organization_id uuid,
  p_project_id uuid,
  p_expected_allowed boolean,
  p_expected_reason text
) returns void language plpgsql as $$
declare resolution record;
begin
  select * into resolution
  from public.recora_resolve_data_lifecycle_access(p_organization_id, p_project_id);
  if not found
    or resolution.customer_access_allowed is distinct from p_expected_allowed
    or resolution.new_measurement_allowed is distinct from p_expected_allowed
    or resolution.reason_code is distinct from p_expected_reason then
    raise exception 'authoritative resolver mismatch for %, expected allowed=% reason=%',
      p_organization_id, p_expected_allowed, p_expected_reason;
  end if;
end;
$$;

create function pg_temp.assert_missing_customer_scope() returns void language plpgsql as $$
begin
  if exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000004')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000004')
    or exists (select 1 from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000004')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000004')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000004') then
    raise exception 'missing lifecycle customer scope was not fail closed';
  end if;
end;
$$;

create function pg_temp.assert_ambiguous_fallback_scope_denied() returns void language plpgsql as $$
begin
  if exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000002')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000002')
    or exists (select 1 from public.organization_members where organization_id = '11710000-0000-4000-8000-000000000002')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000002')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000002') then
    raise exception 'ambiguous organization fallback scope was readable';
  end if;
end;
$$;

create function pg_temp.assert_anon_demo_denied() returns void language plpgsql as $$
begin
  if exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000003')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000003')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000003')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000003')
    or exists (select 1 from public.organizations where id = '11710000-0000-4000-8000-000000000005')
    or exists (select 1 from public.projects where id = '11720000-0000-4000-8000-000000000005')
    or recora_private.can_read_organization('11710000-0000-4000-8000-000000000005')
    or recora_private.can_read_project('11720000-0000-4000-8000-000000000005') then
    raise exception 'anon non-active or missing demo scope was readable';
  end if;
end;
$$;

select pg_temp.assert_resolver_access(
  '11710000-0000-4000-8000-000000000001',
  '11720000-0000-4000-8000-000000000001',
  true,
  'active'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000001', true);
select pg_temp.assert_customer_scope_active();
reset role;

update recora_private.data_lifecycle_current set state = 'access_suspended'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'access_suspended');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000001', true);
select pg_temp.assert_customer_scope_denied('access_suspended');
reset role;

update recora_private.data_lifecycle_current set state = 'retained'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'retained');
set local role authenticated;
select pg_temp.assert_customer_scope_denied('retained');
reset role;

update recora_private.data_lifecycle_current set state = 'deletion_scheduled'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'deletion_scheduled');
set local role authenticated;
select pg_temp.assert_customer_scope_denied('deletion_scheduled');
reset role;

update recora_private.data_lifecycle_current set state = 'deleting'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'deleting');
set local role authenticated;
select pg_temp.assert_customer_scope_denied('deleting');
reset role;

update recora_private.data_lifecycle_current set state = 'deleted'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'deleted');
set local role authenticated;
select pg_temp.assert_customer_scope_denied('deleted');
reset role;

update recora_private.data_lifecycle_current set state = 'deletion_failed'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'deletion_failed');
set local role authenticated;
select pg_temp.assert_customer_scope_denied('deletion_failed');
reset role;

update recora_private.data_lifecycle_current set state = 'active'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
set local role authenticated;
select pg_temp.assert_customer_scope_active();
reset role;

select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000004', '11720000-0000-4000-8000-000000000004', false, 'no_lifecycle_state');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000003', true);
select pg_temp.assert_missing_customer_scope();
reset role;

insert into recora_private.data_lifecycle_current (organization_id, project_id, state)
values ('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', 'access_suspended');
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'access_suspended');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000001', true);
select pg_temp.assert_project_scope_denied();
reset role;

update recora_private.data_lifecycle_current set state = 'active'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id = '11720000-0000-4000-8000-000000000001';
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', true, 'active');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000001', true);
select pg_temp.assert_customer_scope_active();
reset role;

update recora_private.data_lifecycle_current set state = 'access_suspended'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'access_suspended');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000001', true);
select pg_temp.assert_organization_hard_ceiling_denied();
reset role;

update recora_private.data_lifecycle_current set state = 'active'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id is null;
update recora_private.data_lifecycle_current set state = 'access_suspended'
where organization_id = '11710000-0000-4000-8000-000000000001' and project_id = '11720000-0000-4000-8000-000000000001';
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000001', '11720000-0000-4000-8000-000000000001', false, 'access_suspended');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000001', true);
select pg_temp.assert_project_scope_denied();
reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_demo_active();
reset role;

update recora_private.data_lifecycle_current set state = 'access_suspended'
where organization_id = '11710000-0000-4000-8000-000000000003' and project_id is null;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_anon_demo_denied();
reset role;

drop index recora_private.data_lifecycle_current_organization_scope_unique;
insert into recora_private.data_lifecycle_current (organization_id, project_id, state)
values ('11710000-0000-4000-8000-000000000002', null, 'active');
select pg_temp.assert_resolver_access('11710000-0000-4000-8000-000000000002', '11720000-0000-4000-8000-000000000002', false, 'ambiguous_lifecycle_state');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11700000-0000-4000-8000-000000000002', true);
select pg_temp.assert_ambiguous_fallback_scope_denied();
reset role;

rollback;
`);
console.log(
  JSON.stringify(
    {
      status: "ok",
      scope: "issue-117-phase3-integration-security",
      database: "isolated-local-only",
      container: dbContainer,
      resets: { migrationOnly: "passed", seeded: "passed", seededIdempotency: "passed", standardDemoLifecycleAnonRead: "passed" },
      contracts: { ...childResults, "3G": payloadResult },
      matrix: {
        identityMembershipLifecycle: "direct-authoritative-lifecycle-RLS-and-organization-members-active-nonactive-missing-ambiguous-recovery-and-anon-demo",
        compositeIntegrity: "passed-by-3C",
        entitlementHistoryPayload: "passed-by-3D-3G",
        operatorAuditLifecycle: "passed-by-3E-3F",
        grantsFunctionsSchema: "full-public-private-table-view-sequence-policy-function-and-security-definer-inventory",
        customerInformationBoundary: "PR-71-ten-area-exact-key-classification-fixture",
        lifecycleRlsAuthority: "shared-private-resolution-with-organization-hard-ceiling-and-project-restrictive-override",
        catalogTypeDrift: "3C-through-3H-relations-columns-constraints-enums-signatures-and-grants",
        classificationFixture: customerInformationClassificationFixture
      },
      networkCalls: "absent",
      externalAiCalls: "absent",
      remoteDatabaseCalls: "absent"
    },
    null,
    2
  )
);
