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
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_private' and c.relname = 'entitlement_snapshots')
    or not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_audit' and c.relname = 'operator_events')
    or not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_private' and c.relname = 'data_lifecycle_current') then
    raise exception 'migration-only replay is missing a Phase 3 foundation relation';
  end if;
end;
$migration_only$;
`);

runSupabase("Issue #117 seeded reset", ["db", "reset", "--local"]);
const migrationList = runSupabase("Issue #117 local migration list", ["migration", "list", "--local"]);
assert.match(migrationList, /20260730130000/, "Issue #117 local migration list is missing the latest Phase 3 migration.");

const advisors = runSupabase("Issue #117 local security/performance advisors", ["db", "advisors", "--local"]);
assert.doesNotMatch(advisors, /\b(?:warn|error)\b/i, "Issue #117 local advisors reported a warning or error.");

queryLocal(`
do $schema_type_drift$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organization_members'
      and column_name = 'membership_status' and udt_name = 'recora_organization_membership_status'
  ) then raise exception 'organization_members.membership_status type drift'; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations'
      and column_name = 'is_demo' and data_type = 'boolean'
  ) then raise exception 'organizations.is_demo type drift'; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects'
      and column_name = 'organization_id' and data_type = 'uuid'
  ) then raise exception 'projects.organization_id type drift'; end if;
  if (select array_agg(enumlabel::text order by enumsortorder) from pg_enum where enumtypid = 'public.recora_organization_membership_status'::regtype)
    is distinct from array['invited','active','suspended','revoked'] then
    raise exception 'membership lifecycle enum type drift';
  end if;
end;
$schema_type_drift$;
`);

const childResults = Object.fromEntries(childCases.map((caseDefinition) => [caseDefinition.id, runChild(caseDefinition)]));
const payloadResult = runIssue114Verifier();

queryLocal(`
do $cross_component_matrix$
declare unsafe_rls text; unsafe_private_grant text; unsafe_definer_grant text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into unsafe_rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname = any (array['organizations','organization_members','projects','brands','personas','topics','prompts','measurement_runs','run_items','ai_conversations','source_domains','brand_mentions','citations','metric_snapshots','recommendations'])
    and not c.relrowsecurity;
  if unsafe_rls is not null then raise exception 'customer tenant RLS missing: %', unsafe_rls; end if;

  select string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by n.nspname, c.relname) into unsafe_private_grant
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('recora_private', 'recora_operator', 'recora_audit') and c.relkind in ('r','v','m','S')
    and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE'));
  if unsafe_private_grant is not null then raise exception 'browser role grant on internal relation(s): %', unsafe_private_grant; end if;

  select string_agg(format('%I.%I', n.nspname, p.proname), ', ' order by n.nspname, p.proname) into unsafe_definer_grant
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prosecdef and n.nspname in ('public', 'recora_private', 'recora_operator', 'recora_audit')
    and has_function_privilege('public', p.oid, 'EXECUTE');
  if unsafe_definer_grant is not null then raise exception 'PUBLIC execute on security definer function(s): %', unsafe_definer_grant; end if;

  if has_function_privilege('anon', 'public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_operator_execute_authorized_command_receipt(uuid,text,uuid,uuid,text,text,uuid,text,uuid,uuid,jsonb,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE') then
    raise exception 'customer role can execute a service-only operator or lifecycle RPC';
  end if;
end;
$cross_component_matrix$;

begin;
set local role anon;
do $anon_matrix$
begin
  if exists (select 1 from public.organizations where is_demo is false)
    or exists (select 1 from public.projects project_row join public.organizations organization_row on organization_row.id = project_row.organization_id where organization_row.is_demo is false) then
    raise exception 'anonymous actor can enumerate non-demo tenant rows';
  end if;
end;
$anon_matrix$;
rollback;
`);

console.log(
  JSON.stringify(
    {
      status: "ok",
      scope: "issue-117-phase3-integration-security",
      database: "isolated-local-only",
      container: dbContainer,
      resets: { migrationOnly: "passed", seeded: "passed" },
      contracts: { ...childResults, "3G": payloadResult },
      matrix: {
        identityMembershipLifecycle: "passed-by-3B-3C-3F-and-anon-check",
        compositeIntegrity: "passed-by-3C",
        entitlementHistoryPayload: "passed-by-3D-3G",
        operatorAuditLifecycle: "passed-by-3E-3F",
        grantsFunctionsSchema: "passed-by-inventory",
        customerInformationBoundary: "passed-by-3C-3G-and-private-grant-inventory"
      },
      networkCalls: "absent",
      externalAiCalls: "absent",
      remoteDatabaseCalls: "absent"
    },
    null,
    2
  )
);
