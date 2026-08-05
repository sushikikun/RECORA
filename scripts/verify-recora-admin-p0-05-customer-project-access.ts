import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const initialImplementationBaseline = "bd78e3effb5c5866af5dd1233f7d6984a4aaae9f";
const expectedBaseline = "a9a2760565bdddd9105fc039e792148c3b83b704";
const expectedM04Merge = "dc79c17caafc984daf1cc7546821a3401ba94d4c";
const requestedContainer = "supabase_db_recora-admin-p0-m05-customer-project-access";
const expectedContainer = "supabase_db_recora-admin-p0-m05-customer-project-acc";
const staticOnly = process.env.RECORA_ADMIN_P0_STATIC_ONLY === "1";
const migrationDirectory = path.join(repoRoot, "supabase", "migrations");
const m05Stem = "recora_admin_p0_05_customer_project_access";
const m04Stem = "recora_admin_p0_04_customer_project_inquiry";
const m05SpecPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_m05_customer_project_access_spec_v1.md";
const m05VerifierPath = "scripts/verify-recora-admin-p0-05-customer-project-access.ts";
const m04VerifierPath = "scripts/verify-recora-admin-p0-04-customer-project-inquiry.ts";
const allowedPaths = [m05VerifierPath, m04VerifierPath, m05SpecPath, "package.json"] as const;
const projectScopedRelations = [
  { relation: "projects", projectColumn: "id" },
  { relation: "prompts", projectColumn: "project_id" },
  { relation: "measurement_runs", projectColumn: "project_id" },
  { relation: "ai_conversations", projectColumn: "project_id" },
  { relation: "citations", projectColumn: "project_id" },
  { relation: "metric_snapshots", projectColumn: "project_id" },
  { relation: "recommendations", projectColumn: "project_id" },
] as const;

const m05Path = findMigration(m05Stem);
const m04Path = findMigration(m04Stem);
const m05RepoPath = toRepoPath(path.relative(repoRoot, m05Path));

async function main(): Promise<void> {
  verifySourceContract();
  verifyPackageContract();
  verifySpecification();
  verifyChangedScope();
  if (!staticOnly) {
    verifyRepositoryBaseline();
    await verifyLocalDatabase();
  }

  console.log(JSON.stringify({
    status: "ok",
    initialImplementationBaseline,
    postSyncComparisonBaseline: expectedBaseline,
    migration: m05RepoPath,
    containers: { requested: requestedContainer, actual: expectedContainer },
    staticOnly,
    checkedCases: {
      sourceAndScope: true,
      m04Compatibility: true,
      grantLifecycleAndRls: !staticOnly,
      receiptCrossColumnAndConcurrency: !staticOnly,
      authenticatedProjectTableMatrix: !staticOnly,
      migrationListAndAdvisors: !staticOnly,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

function verifySourceContract(): void {
  const sql = fs.readFileSync(m05Path, "utf8");
  const source = stripSqlLineComments(sql);
  const normalized = normalizeSql(source);
  assertPostgresIdentifierLengths(sql);
  assert.match(path.basename(m05Path), /^\d{14}_recora_admin_p0_05_customer_project_access\.sql$/);
  assert.ok(migrationTimestamp(m04Path) < migrationTimestamp(m05Path), "M05 must follow M04.");
  const createdTables = Array.from(
    normalized.matchAll(/create table(?: if not exists)? ([a-z0-9_.]+)/g),
  ).map((match) => match[1]);
  assert.deepEqual(createdTables, ["recora_private.customer_project_access_grants"]);
  for (const required of [
    "begin;", "commit;", "recora_private.admin_p0_schema_versions", "auth.users",
    "recora_private.resolve_data_lifecycle_access(uuid,uuid)",
    "recora_private.can_read_project(uuid)",
    "organization_members_id_organization_id_unique", "customer_project_access_grants",
    "customer_project_access_grants_active_user_project_key",
    "customer_project_access_grants_active_member_project_key",
    "customer_project_access_grants_transition_guard",
    "admin_p0_validate_customer_project_access_grant", "has_active_customer_project_access",
    "security invoker", "security definer", "set search_path = ''", "enable row level security",
    "revoke all on table recora_private.customer_project_access_grants",
    "revoke all on function recora_private.has_active_customer_project_access",
    "membership_status = 'active'::public.recora_organization_membership_status", "candidate_count = 1",
    "for update", "order by candidate.receipt_id",
    "issued command receipt may be used only once across grant history",
    "revoked command receipt may be used only once across grant history",
  ]) {
    assert.ok(normalized.includes(required), "Missing M05 source contract: " + required);
  }
  for (const forbidden of [
    /\bdrop\b/i, /\btruncate\b/i, /\bseed\b/i, /\bbackfill\b/i,
    /\bcreate\s+(?:or\s+replace\s+)?function\s+public\./i,
    /\bservice_role\b[\s\S]{0,160}\b(?:actor|admin)\b/i,
  ]) assert.doesNotMatch(source, forbidden);
  const grantStatements = Array.from(source.matchAll(/^\s*grant\s+[\s\S]*?;/gim))
    .map((match) => normalizeSql(match[0]));
  assert.deepEqual(grantStatements, [
    "grant select on table public.prompts, public.measurement_runs, public.ai_conversations, public.citations, public.metric_snapshots, public.recommendations to authenticated;",
  ], "M05 may add only the authenticated Project-scoped read grants required for RLS evaluation.");
  assert.doesNotMatch(normalized, /revoke all on function recora_private\.can_read_project/i);

  const table = extractCreateTableDefinition(sql, "recora_private.customer_project_access_grants");
  assertExactColumns(table, [
    "id", "organization_id", "project_id", "organization_member_id", "customer_auth_user_id",
    "status", "issued_command_receipt_id", "revoked_command_receipt_id", "granted_at", "revoked_at",
    "row_version", "created_at", "updated_at",
  ]);
  for (const required of [
    "foreign key (project_id, organization_id)", "references public.projects(id, organization_id) on delete restrict",
    "foreign key (organization_member_id, organization_id)",
    "references public.organization_members(id, organization_id) on delete restrict",
    "references auth.users(id) on delete restrict", "references recora_private.admin_command_receipts(id) on delete restrict",
    "check (status in ('active', 'revoked'))", "unique (issued_command_receipt_id)", "unique (revoked_command_receipt_id)",
  ]) assert.ok(normalizeSql(table).includes(required), "M05 table contract missing: " + required);
  assert.ok(normalized.includes("and recora_private.has_active_customer_project_access( project_row.id, (select auth.uid()) )"));
}
function verifyPackageContract(): void {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  assert.equal(scripts["recora:admin-p0:m05:check"], "tsx scripts/verify-recora-admin-p0-05-customer-project-access.ts");
  assert.match(scripts["recora:admin-p0:m05:static-check"] ?? "", /verify-recora-admin-p0-05-customer-project-access\.ts/);
  assert.ok((scripts["recora:preflight"] ?? "").includes(
    "recora:admin-p0:m04:static-check && npm run recora:admin-p0:m05:static-check && npm run recora:project-setup-draft:check",
  ));
}

function verifySpecification(): void {
  const spec = fs.readFileSync(path.join(repoRoot, m05SpecPath), "utf8");
  for (const section of [
    "Authority", "Scope", "Existing Foundations", "Exact Relation", "Grant Episodes",
    "Customer Read Boundary", "Security And ACL", "No Backfill Or Seed",
    "M04 Verifier Compatibility", "Validation", "Out Of Scope",
  ]) assert.ok(spec.includes(section), "M05 spec is missing: " + section);
}

function verifyChangedScope(): void {
  const unchanged = [
    "package-lock.json", "tsconfig.json", "supabase/seed.sql",
    "docs/architecture/recora-admin-p0/canonical/recora_admin_p0_canonical_manifest_v1.json",
    "docs/architecture/recora-admin-p0/database/recora_admin_p0_physical_schema_manifest_v1_3.json",
    "supabase/migrations/20260803175338_recora_admin_p0_01_common_infrastructure.sql",
    "supabase/migrations/20260803221512_recora_admin_p0_02_operator_rbac_audit.sql",
    "supabase/migrations/20260804141207_recora_admin_p0_03_static_catalogs.sql",
    m04Path ? toRepoPath(path.relative(repoRoot, m04Path)) : "",
  ];
  for (const filePath of unchanged) assertGitClean(filePath, "M05 must not modify " + filePath);

  const changed = new Set<string>();
  for (const args of [
    ["diff", "--name-only", expectedBaseline + "...HEAD"],
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) for (const item of lines(run("git", args))) changed.add(item);
  changed.add(m05RepoPath);
  const allowed = new Set([...allowedPaths, m05RepoPath]);
  assert.deepEqual(Array.from(changed).sort(), Array.from(allowed).sort(), "M05 changed-file scope must be exactly five files.");
}

function verifyRepositoryBaseline(): void {
  const head = run("git", ["rev-parse", "HEAD"]).trim();
  for (const ancestor of [initialImplementationBaseline, expectedBaseline, expectedM04Merge]) {
    const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, "HEAD"], {
      cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" },
    });
    assert.equal(result.status, 0, "Required M05 ancestor missing from " + head + ": " + ancestor);
  }
}

function extractCreateTableDefinition(sql: string, relationName: string): string {
  const expression = new RegExp(
    "create table " + escapeRegExp(relationName) + " \\(([\\s\\S]*?\\n\\);)", "i",
  );
  const match = sql.match(expression);
  assert.ok(match, "Missing table definition: " + relationName);
  return match[0];
}

function assertExactColumns(definition: string, expected: string[]): void {
  const actual = Array.from(
    definition.matchAll(/^\s{2}([a-z_][a-z0-9_]*)\s+(?:uuid|text|bigint|timestamptz)\b/gm),
  ).map((match) => match[1]);
  assert.deepEqual(actual, expected, "M05 grant table columns differ from the approved contract.");
}

function findMigration(stem: string): string {
  const matches = fs.readdirSync(migrationDirectory)
    .filter((name) => name.endsWith("_" + stem + ".sql"))
    .map((name) => path.join(migrationDirectory, name));
  assert.equal(matches.length, 1, "Expected exactly one migration for " + stem);
  return matches[0];
}

function migrationTimestamp(filePath: string): string {
  const timestamp = path.basename(filePath).split("_")[0];
  assert.match(timestamp, /^\d{14}$/);
  return timestamp;
}

function assertGitClean(filePath: string, message: string): void {
  const result = spawnSync("git", ["diff", "--quiet", "--", filePath], {
    cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" },
  });
  assert.equal(result.status, 0, message);
}

function assertPostgresIdentifierLengths(sql: string): void {
  const patterns = [
    /\bconstraint\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+(?:unique\s+)?index\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+trigger\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+or\s+replace\s+function\s+(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)/gi,
  ];
  for (const pattern of patterns) {
    Array.from(sql.matchAll(pattern)).forEach((match) => assert.ok(Buffer.byteLength(match[1], "utf8") <= 63, "Postgres identifier is too long: " + match[1]));
  }
}
async function verifyLocalDatabase(): Promise<void> {
  assert.equal(process.env.RECORA_ADMIN_P0_DB_CONTAINER, expectedContainer);
  run("docker", ["inspect", expectedContainer]);
  verifyFormalM05DatabaseContract();

  for (const role of ["anon", "authenticated", "service_role"]) {
    queryLocal(["begin;", "set local role " + role + ";", "select * from recora_private.customer_project_access_grants;", "rollback;"].join("\n"), /permission denied/i);
    queryLocal(["begin;", "set local role " + role + ";", "select recora_private.has_active_customer_project_access(null, null);", "rollback;"].join("\n"), /permission denied/i);
  }

  verifyAccessMatrixFixtures();
  verifyNegativeGrantFixtures();
  await verifyReceiptCrossColumnConcurrencyFixture();

  const supabaseWorkdir = process.env.RECORA_ADMIN_P0_SUPABASE_WORKDIR;
  assert.ok(supabaseWorkdir, "RECORA_ADMIN_P0_SUPABASE_WORKDIR is required.");
  assert.ok(path.isAbsolute(supabaseWorkdir), "RECORA_ADMIN_P0_SUPABASE_WORKDIR must be absolute.");
  runSupabaseCli(["--workdir", supabaseWorkdir, "migration", "list", "--local"]);
  runSupabaseCli(["--workdir", supabaseWorkdir, "db", "advisors", "--local", "--type", "security", "--fail-on", "warn"]);
  runSupabaseCli(["--workdir", supabaseWorkdir, "db", "advisors", "--local", "--type", "performance", "--fail-on", "warn"]);
}

function verifyFormalM05DatabaseContract(): void {
  queryLocal([
    "do $m05_contract$",
    "declare relation_name text;",
    "begin",
    "  if (select array_agg(column_name::text order by ordinal_position) from information_schema.columns",
    "      where table_schema = 'recora_private' and table_name = 'customer_project_access_grants')",
    "      is distinct from array['id','organization_id','project_id','organization_member_id','customer_auth_user_id','status','issued_command_receipt_id','revoked_command_receipt_id','granted_at','revoked_at','row_version','created_at','updated_at']::text[] then",
    "    raise exception 'M05 grant table exact column inventory mismatch';",
    "  end if;",
    "  if not exists (select 1 from pg_class where oid = 'recora_private.customer_project_access_grants'::regclass and relrowsecurity) then",
    "    raise exception 'M05 private grant RLS is missing';",
    "  end if;",
    "  if not exists (select 1 from pg_constraint where conrelid = 'recora_private.customer_project_access_grants'::regclass and conname = 'customer_project_access_grants_project_scope_fkey' and confrelid = 'public.projects'::regclass and confdeltype = 'r' and convalidated)",
    "    or not exists (select 1 from pg_constraint where conrelid = 'recora_private.customer_project_access_grants'::regclass and conname = 'customer_project_access_grants_member_scope_fkey' and confrelid = 'public.organization_members'::regclass and confdeltype = 'r' and convalidated)",
    "    or not exists (select 1 from pg_constraint where conrelid = 'recora_private.customer_project_access_grants'::regclass and conname = 'customer_project_access_grants_issued_receipt_fkey' and confrelid = 'recora_private.admin_command_receipts'::regclass and confdeltype = 'r' and convalidated)",
    "    or not exists (select 1 from pg_constraint where conrelid = 'recora_private.customer_project_access_grants'::regclass and conname = 'customer_project_access_grants_revoked_receipt_fkey' and confrelid = 'recora_private.admin_command_receipts'::regclass and confdeltype = 'r' and convalidated) then",
    "    raise exception 'M05 causal or tenant foreign key mismatch';",
    "  end if;",
    "  if not exists (select 1 from pg_index index_row join pg_class index_class on index_class.oid = index_row.indexrelid where index_row.indrelid = 'recora_private.customer_project_access_grants'::regclass and index_class.relname = 'customer_project_access_grants_active_user_project_key' and index_row.indpred is not null)",
    "    or not exists (select 1 from pg_index index_row join pg_class index_class on index_class.oid = index_row.indexrelid where index_row.indrelid = 'recora_private.customer_project_access_grants'::regclass and index_class.relname = 'customer_project_access_grants_active_member_project_key' and index_row.indpred is not null) then",
    "    raise exception 'M05 active grant uniqueness index is missing';",
    "  end if;",
    "  if not exists (select 1 from pg_trigger trigger_row join pg_proc function_row on function_row.oid = trigger_row.tgfoid where trigger_row.tgrelid = 'recora_private.customer_project_access_grants'::regclass and trigger_row.tgname = 'customer_project_access_grants_transition_guard' and function_row.proname = 'admin_p0_validate_customer_project_access_grant') then",
    "    raise exception 'M05 transition guard is missing';",
    "  end if;",
    "  if not exists (select 1 from pg_proc function_row join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace where namespace_row.nspname = 'recora_private' and function_row.proname = 'admin_p0_validate_customer_project_access_grant' and function_row.prosecdef is not true and pg_get_functiondef(function_row.oid) ilike '%for update%' and pg_get_functiondef(function_row.oid) ilike '%order by candidate.receipt_id%' and pg_get_functiondef(function_row.oid) ilike '%issued command receipt may be used only once across grant history%' and pg_get_functiondef(function_row.oid) ilike '%revoked command receipt may be used only once across grant history%') then",
    "    raise exception 'M05 receipt global-use locking contract is missing';",
    "  end if;",
    "  if not exists (select 1 from pg_proc function_row join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace where namespace_row.nspname = 'recora_private' and function_row.proname = 'has_active_customer_project_access' and function_row.prosecdef and pg_get_functiondef(function_row.oid) like '%SET search_path TO ''''%') then",
    "    raise exception 'M05 helper security definer/search_path contract mismatch';",
    "  end if;",
    "  if has_table_privilege('public', 'recora_private.customer_project_access_grants', 'select') or has_table_privilege('anon', 'recora_private.customer_project_access_grants', 'select') or has_table_privilege('authenticated', 'recora_private.customer_project_access_grants', 'select') or has_table_privilege('service_role', 'recora_private.customer_project_access_grants', 'select') or has_function_privilege('authenticated', 'recora_private.has_active_customer_project_access(uuid,uuid)', 'execute') then",
    "    raise exception 'M05 direct private grant access is present';",
    "  end if;",
    "  if not has_function_privilege('authenticated', 'recora_private.can_read_project(uuid)', 'execute') then",
    "    raise exception 'M05 changed established can_read_project ACL';",
    "  end if;",
    "  if (select count(*) from recora_operator.admin_roles) <> 8 or (select count(*) from recora_operator.admin_capabilities) <> 64 or (select count(*) from recora_operator.admin_role_capabilities) <> 185 or (select count(*) from recora_private.admin_notification_categories) <> 8 then",
    "    raise exception 'M05 changed M01-M03 catalog inventory';",
    "  end if;",
    "  if (select count(*) from pg_class class_row join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace where namespace_row.nspname = 'recora_private' and class_row.relname in ('admin_customer_profiles','admin_project_states','admin_customer_inquiries','admin_customer_inquiry_notes')) <> 4 then",
    "    raise exception 'M05 changed M04 private relation inventory';",
    "  end if;",
    "  foreach relation_name in array array['projects','prompts','measurement_runs','ai_conversations','citations','metric_snapshots','recommendations'] loop",
    "    if not has_table_privilege('authenticated', format('public.%I', relation_name), 'select') then",
    "      raise exception 'M05 authenticated SELECT prerequisite is missing for %', relation_name;",
    "    end if;",
    "    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = relation_name and qual like '%can_read_project%') then",
    "      raise exception 'M05 expected Project RLS policy is missing for %', relation_name;",
    "    end if;",
    "  end loop;",
    "end;",
    "$m05_contract$;",
  ].join("\n"));
}
function fixtureBase(): string[] {
  return [
    "begin;",
    "insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo) values",
    "  ('50010000-0000-4000-8000-000000000001', 'm05-org-a', 'M05 Organization A', 'client', 'production', false, false),",
    "  ('50010000-0000-4000-8000-000000000002', 'm05-org-b', 'M05 Organization B', 'client', 'production', false, false),",
    "  ('50010000-0000-4000-8000-000000000003', 'm05-org-missing', 'M05 Missing Lifecycle', 'client', 'production', false, false),",
    "  ('50010000-0000-4000-8000-000000000004', 'm05-org-demo', 'M05 Demo Organization', 'internal', 'local', true, true);",
    "insert into auth.users (id, email, created_at, updated_at) values",
    "  ('50000000-0000-4000-8000-000000000001', 'm05-user-a@example.invalid', now(), now()),",
    "  ('50000000-0000-4000-8000-000000000002', 'm05-user-b@example.invalid', now(), now()),",
    "  ('50000000-0000-4000-8000-000000000003', 'm05-user-no-grant@example.invalid', now(), now()),",
    "  ('50000000-0000-4000-8000-000000000004', 'm05-user-missing@example.invalid', now(), now()),",
    "  ('50000000-0000-4000-8000-000000000005', 'm05-user-invited@example.invalid', now(), now()),",
    "  ('50000000-0000-4000-8000-000000000006', 'm05-user-suspended@example.invalid', now(), now());",
    "insert into public.organization_members (id, organization_id, user_id, email, role, invited_at, accepted_at, membership_status) values",
    "  ('50030000-0000-4000-8000-000000000001', '50010000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'm05-user-a@example.invalid', 'member', now(), now(), 'active'),",
    "  ('50030000-0000-4000-8000-000000000002', '50010000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'm05-user-b@example.invalid', 'member', now(), now(), 'active'),",
    "  ('50030000-0000-4000-8000-000000000003', '50010000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000003', 'm05-user-no-grant@example.invalid', 'member', now(), now(), 'active'),",
    "  ('50030000-0000-4000-8000-000000000004', '50010000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000004', 'm05-user-missing@example.invalid', 'member', now(), now(), 'active'),",
    "  ('50030000-0000-4000-8000-000000000005', '50010000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000005', 'm05-user-invited@example.invalid', 'member', now(), null, 'invited'),",
    "  ('50030000-0000-4000-8000-000000000006', '50010000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000006', 'm05-user-suspended@example.invalid', 'member', now(), now(), 'suspended');",
    "insert into public.projects (id, organization_id, slug, name) values",
    "  ('50020000-0000-4000-8000-000000000001', '50010000-0000-4000-8000-000000000001', 'm05-project-a', 'M05 Project A'),",
    "  ('50020000-0000-4000-8000-000000000002', '50010000-0000-4000-8000-000000000001', 'm05-project-b', 'M05 Project B'),",
    "  ('50020000-0000-4000-8000-000000000003', '50010000-0000-4000-8000-000000000002', 'm05-project-c', 'M05 Project C'),",
    "  ('50020000-0000-4000-8000-000000000004', '50010000-0000-4000-8000-000000000003', 'm05-project-missing', 'M05 Project Missing'),",
    "  ('50020000-0000-4000-8000-000000000005', '50010000-0000-4000-8000-000000000004', 'm05-project-demo', 'M05 Project Demo');",
    "insert into recora_private.data_lifecycle_current (organization_id, project_id, state) values",
    "  ('50010000-0000-4000-8000-000000000001', null, 'active'),",
    "  ('50010000-0000-4000-8000-000000000002', null, 'active'),",
    "  ('50010000-0000-4000-8000-000000000004', null, 'active');",
  ];
}

function fixtureReceiptsAndGrants(): string[] {
  return [
    "insert into recora_private.admin_command_receipts (id, actor_type, system_component_code, command_name, organization_id, project_id, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code) values",
    "  ('50040000-0000-4000-8000-000000000001', 'system', 'm05.fixture', 'GrantProjectAccess', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'customer.project_access', '50030000-0000-4000-8000-000000000001', 'm05.grant.a.001', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '50041000-0000-4000-8000-000000000001', '50042000-0000-4000-8000-000000000001', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000002', 'system', 'm05.fixture', 'RevokeProjectAccess', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'customer.project_access', '50030000-0000-4000-8000-000000000001', 'm05.revoke.a.001', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '50041000-0000-4000-8000-000000000002', '50042000-0000-4000-8000-000000000002', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000003', 'system', 'm05.fixture', 'GrantProjectAccess', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'customer.project_access', '50030000-0000-4000-8000-000000000001', 'm05.regrant.a.001', 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', '50041000-0000-4000-8000-000000000003', '50042000-0000-4000-8000-000000000003', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000004', 'system', 'm05.fixture', 'GrantProjectAccess', '50010000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000003', 'customer.project_access', '50030000-0000-4000-8000-000000000002', 'm05.grant.c.001', 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', '50041000-0000-4000-8000-000000000004', '50042000-0000-4000-8000-000000000004', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000005', 'system', 'm05.fixture', 'GrantProjectAccess', '50010000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000004', 'customer.project_access', '50030000-0000-4000-8000-000000000004', 'm05.grant.missing.001', 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '50041000-0000-4000-8000-000000000005', '50042000-0000-4000-8000-000000000005', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000006', 'system', 'm05.fixture', 'GrantProjectAccess', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000002', 'customer.project_access', '50030000-0000-4000-8000-000000000001', 'm05.wrong.scope.001', 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '50041000-0000-4000-8000-000000000006', '50042000-0000-4000-8000-000000000006', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000007', 'system', 'm05.fixture', 'GrantProjectAccess', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000002', 'customer.project_access', '50030000-0000-4000-8000-000000000001', 'm05.grant.b.001', '1111111111111111111111111111111111111111111111111111111111111111', '50041000-0000-4000-8000-000000000007', '50042000-0000-4000-8000-000000000007', 'committed', 'm05.fixture.committed'),",
    "  ('50040000-0000-4000-8000-000000000008', 'system', 'm05.fixture', 'RevokeProjectAccess', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000002', 'customer.project_access', '50030000-0000-4000-8000-000000000001', 'm05.revoke.b.001', '2222222222222222222222222222222222222222222222222222222222222222', '50041000-0000-4000-8000-000000000008', '50042000-0000-4000-8000-000000000008', 'committed', 'm05.fixture.committed');",
    "insert into recora_private.customer_project_access_grants (id, organization_id, project_id, organization_member_id, customer_auth_user_id, issued_command_receipt_id) values",
    "  ('50050000-0000-4000-8000-000000000001', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '50040000-0000-4000-8000-000000000001'),",
    "  ('50050000-0000-4000-8000-000000000002', '50010000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000003', '50030000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', '50040000-0000-4000-8000-000000000004'),",
    "  ('50050000-0000-4000-8000-000000000003', '50010000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000004', '50030000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000004', '50040000-0000-4000-8000-000000000005');",
  ];
}

function fixturePublicProjectData(): string[] {
  return [
    "insert into public.brands (id, project_id, brand_type, name) values",
    "  ('50060000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'primary', 'M05 Brand A'),",
    "  ('50060000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', 'primary', 'M05 Brand B'),",
    "  ('50060000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', 'primary', 'M05 Brand C');",
    "insert into public.personas (id, project_id, name) values",
    "  ('50070000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'M05 Persona A'),",
    "  ('50070000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', 'M05 Persona B'),",
    "  ('50070000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', 'M05 Persona C');",
    "insert into public.topics (id, project_id, name) values",
    "  ('50080000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'M05 Topic A'),",
    "  ('50080000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', 'M05 Topic B'),",
    "  ('50080000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', 'M05 Topic C');",
    "insert into public.prompts (id, project_id, topic_id, persona_id, text) values",
    "  ('50090000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50080000-0000-4000-8000-000000000001', '50070000-0000-4000-8000-000000000001', 'M05 Prompt A'),",
    "  ('50090000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', '50080000-0000-4000-8000-000000000002', '50070000-0000-4000-8000-000000000002', 'M05 Prompt B'),",
    "  ('50090000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', '50080000-0000-4000-8000-000000000003', '50070000-0000-4000-8000-000000000003', 'M05 Prompt C');",
    "insert into public.ai_models (id, provider, model_name, display_name) values ('500a0000-0000-4000-8000-000000000001', 'm05-fixture', 'm05-model', 'M05 Model');",
    "insert into public.measurement_runs (id, project_id, status, period_start, period_end) values",
    "  ('500b0000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'completed', current_date, current_date),",
    "  ('500b0000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', 'completed', current_date, current_date),",
    "  ('500b0000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', 'completed', current_date, current_date);",
    "insert into public.run_items (id, run_id, prompt_id, persona_id, model_id, status) values",
    "  ('500c0000-0000-4000-8000-000000000001', '500b0000-0000-4000-8000-000000000001', '50090000-0000-4000-8000-000000000001', '50070000-0000-4000-8000-000000000001', '500a0000-0000-4000-8000-000000000001', 'completed'),",
    "  ('500c0000-0000-4000-8000-000000000002', '500b0000-0000-4000-8000-000000000002', '50090000-0000-4000-8000-000000000002', '50070000-0000-4000-8000-000000000002', '500a0000-0000-4000-8000-000000000001', 'completed'),",
    "  ('500c0000-0000-4000-8000-000000000003', '500b0000-0000-4000-8000-000000000003', '50090000-0000-4000-8000-000000000003', '50070000-0000-4000-8000-000000000003', '500a0000-0000-4000-8000-000000000001', 'completed');",
  ];
}
function fixtureDerivedProjectData(): string[] {
  return [
    "insert into public.ai_conversations (id, run_item_id, raw_answer, answer_hash, prompt_text_snapshot, model_snapshot) values",
    "  ('500d0000-0000-4000-8000-000000000001', '500c0000-0000-4000-8000-000000000001', 'M05 Answer A', 'm05-answer-a', 'M05 Prompt A', 'M05 Model'),",
    "  ('500d0000-0000-4000-8000-000000000002', '500c0000-0000-4000-8000-000000000002', 'M05 Answer B', 'm05-answer-b', 'M05 Prompt B', 'M05 Model'),",
    "  ('500d0000-0000-4000-8000-000000000003', '500c0000-0000-4000-8000-000000000003', 'M05 Answer C', 'm05-answer-c', 'M05 Prompt C', 'M05 Model');",
    "insert into public.source_domains (id, project_id, domain, owner_brand_id) values",
    "  ('500e0000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', 'm05-a.example', '50060000-0000-4000-8000-000000000001'),",
    "  ('500e0000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', 'm05-b.example', '50060000-0000-4000-8000-000000000002'),",
    "  ('500e0000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', 'm05-c.example', '50060000-0000-4000-8000-000000000003');",
    "insert into public.citations (id, conversation_id, brand_id, source_domain_id, domain) values",
    "  ('500f0000-0000-4000-8000-000000000001', '500d0000-0000-4000-8000-000000000001', '50060000-0000-4000-8000-000000000001', '500e0000-0000-4000-8000-000000000001', 'm05-a.example'),",
    "  ('500f0000-0000-4000-8000-000000000002', '500d0000-0000-4000-8000-000000000002', '50060000-0000-4000-8000-000000000002', '500e0000-0000-4000-8000-000000000002', 'm05-b.example'),",
    "  ('500f0000-0000-4000-8000-000000000003', '500d0000-0000-4000-8000-000000000003', '50060000-0000-4000-8000-000000000003', '500e0000-0000-4000-8000-000000000003', 'm05-c.example');",
    "insert into public.metric_snapshots (id, run_id, scope_type, scope_id, brand_id) values",
    "  ('50100000-0000-4000-8000-000000000001', '500b0000-0000-4000-8000-000000000001', 'project', '50020000-0000-4000-8000-000000000001', '50060000-0000-4000-8000-000000000001'),",
    "  ('50100000-0000-4000-8000-000000000002', '500b0000-0000-4000-8000-000000000002', 'project', '50020000-0000-4000-8000-000000000002', '50060000-0000-4000-8000-000000000002'),",
    "  ('50100000-0000-4000-8000-000000000003', '500b0000-0000-4000-8000-000000000003', 'project', '50020000-0000-4000-8000-000000000003', '50060000-0000-4000-8000-000000000003');",
    "insert into public.recommendations (id, project_id, run_id, type, title, related_topic_id, related_prompt_id, metadata) values",
    "  ('50110000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '500b0000-0000-4000-8000-000000000001', 'content', 'M05 Recommendation A', '50080000-0000-4000-8000-000000000001', '50090000-0000-4000-8000-000000000001', '{\"publication_state\":\"customer_visible\"}'),",
    "  ('50110000-0000-4000-8000-000000000002', '50020000-0000-4000-8000-000000000002', '500b0000-0000-4000-8000-000000000002', 'content', 'M05 Recommendation B', '50080000-0000-4000-8000-000000000002', '50090000-0000-4000-8000-000000000002', '{\"publication_state\":\"customer_visible\"}'),",
    "  ('50110000-0000-4000-8000-000000000003', '50020000-0000-4000-8000-000000000003', '500b0000-0000-4000-8000-000000000003', 'content', 'M05 Recommendation C', '50080000-0000-4000-8000-000000000003', '50090000-0000-4000-8000-000000000003', '{\"publication_state\":\"customer_visible\"}');",
  ];
}
function authenticatedMatrix(
  userId: string,
  allowedProjectIds: string[],
  deniedProjectIds: string[],
  scenario: string,
): string[] {
  const helperChecks: string[] = [];
  const browserChecks: string[] = [];
  for (const allowedProjectId of allowedProjectIds) {
    helperChecks.push("  if not recora_private.can_read_project('" + allowedProjectId + "') then raise exception 'M05 " + scenario + " helper access is denied for an allowed Project'; end if;");
    for (const { relation, projectColumn } of projectScopedRelations) {
      browserChecks.push("  if (select count(*) from public." + relation + " where " + projectColumn + " = '" + allowedProjectId + "') <> 1 then raise exception 'M05 " + scenario + " " + relation + " row is not visible for an allowed Project'; end if;");
    }
  }
  for (const deniedProjectId of deniedProjectIds) {
    helperChecks.push("  if recora_private.can_read_project('" + deniedProjectId + "') then raise exception 'M05 " + scenario + " helper access is visible for a denied Project'; end if;");
    for (const { relation, projectColumn } of projectScopedRelations) {
      browserChecks.push("  if exists (select 1 from public." + relation + " where " + projectColumn + " = '" + deniedProjectId + "') then raise exception 'M05 " + scenario + " " + relation + " row is visible for a denied Project'; end if;");
    }
  }
  return [
    "select set_config('request.jwt.claim.role', 'authenticated', true);",
    "select set_config('request.jwt.claim.sub', '" + userId + "', true);",
    "do $m05_authenticated_helper_matrix$ begin",
    ...helperChecks,
    "end; $m05_authenticated_helper_matrix$;",
    "set local role authenticated;",
    "do $m05_authenticated_browser_matrix$ begin",
    ...browserChecks,
    "end; $m05_authenticated_browser_matrix$;",
    "reset role;",
  ];
}

function verifyAccessMatrixFixtures(): void {
  const base = [...fixtureBase(), ...fixtureReceiptsAndGrants()];
  const full = [...base, ...fixturePublicProjectData(), ...fixtureDerivedProjectData()];
  const userA = "50000000-0000-4000-8000-000000000001";
  const userB = "50000000-0000-4000-8000-000000000002";
  const userWithoutGrant = "50000000-0000-4000-8000-000000000003";
  const userMissingLifecycle = "50000000-0000-4000-8000-000000000004";
  const projectA = "50020000-0000-4000-8000-000000000001";
  const projectB = "50020000-0000-4000-8000-000000000002";
  const projectC = "50020000-0000-4000-8000-000000000003";
  const projectMissingLifecycle = "50020000-0000-4000-8000-000000000004";

  queryLocal([
    ...full,
    ...authenticatedMatrix(userA, [projectA], [projectB, projectC], "same-organization Project A only"),
    ...authenticatedMatrix(userB, [projectC], [projectA, projectB], "different-organization Project C only"),
    ...authenticatedMatrix(userWithoutGrant, [], [projectA, projectB, projectC], "membership without explicit grant"),
    ...authenticatedMatrix(userMissingLifecycle, [], [projectMissingLifecycle], "missing lifecycle"),
    "set local role anon;",
    "select set_config('request.jwt.claim.role', 'anon', true);",
    "select set_config('request.jwt.claim.sub', '', true);",
    "do $m05_anon_demo$ begin if not exists (select 1 from public.projects where id = '50020000-0000-4000-8000-000000000005') or exists (select 1 from public.projects where id = '" + projectA + "') then raise exception 'M05 changed anonymous demo boundary'; end if; end; $m05_anon_demo$;",
    "reset role;",
    "insert into recora_private.customer_project_access_grants (id, organization_id, project_id, organization_member_id, customer_auth_user_id, issued_command_receipt_id) values ('50050000-0000-4000-8000-000000000006', '50010000-0000-4000-8000-000000000001', '" + projectB + "', '50030000-0000-4000-8000-000000000001', '" + userA + "', '50040000-0000-4000-8000-000000000007');",
    ...authenticatedMatrix(userA, [projectA, projectB], [projectC], "same account Project A and B"),
    "update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '50040000-0000-4000-8000-000000000008', revoked_at = now(), row_version = 2 where id = '50050000-0000-4000-8000-000000000006';",
    ...authenticatedMatrix(userA, [projectA], [projectB, projectC], "Project B revoked only"),
    "update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '50040000-0000-4000-8000-000000000002', revoked_at = now(), row_version = 2 where id = '50050000-0000-4000-8000-000000000001';",
    "do $m05_revocation$ begin if (select row_version from recora_private.customer_project_access_grants where id = '50050000-0000-4000-8000-000000000001') <> 2 then raise exception 'M05 revoke did not advance row version'; end if; end; $m05_revocation$;",
    ...authenticatedMatrix(userA, [], [projectA, projectB, projectC], "all explicit grants revoked"),
    "insert into recora_private.customer_project_access_grants (id, organization_id, project_id, organization_member_id, customer_auth_user_id, issued_command_receipt_id) values ('50050000-0000-4000-8000-000000000004', '50010000-0000-4000-8000-000000000001', '" + projectA + "', '50030000-0000-4000-8000-000000000001', '" + userA + "', '50040000-0000-4000-8000-000000000003');",
    ...authenticatedMatrix(userA, [projectA], [projectB, projectC], "Project A regrant"),
    "update public.organization_members set membership_status = 'suspended' where id = '50030000-0000-4000-8000-000000000001';",
    ...authenticatedMatrix(userA, [], [projectA, projectB, projectC], "active grant with suspended membership"),
    "update public.organization_members set membership_status = 'revoked' where id = '50030000-0000-4000-8000-000000000001';",
    ...authenticatedMatrix(userA, [], [projectA, projectB, projectC], "active grant with terminal membership"),
    "rollback;",
  ].join("\n"));
}
function verifyNegativeGrantFixtures(): void {
  const base = [...fixtureBase(), ...fixtureReceiptsAndGrants()];
  const invalidGrantPrefix = "insert into recora_private.customer_project_access_grants (id, organization_id, project_id, organization_member_id, customer_auth_user_id, issued_command_receipt_id) values ";

  queryLocal([...base,
    invalidGrantPrefix + "('50050000-0000-4000-8000-000000000010', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000005', '50040000-0000-4000-8000-000000000001');",
  ].join("\n"), /accepted active membership/i);

  queryLocal([...base,
    invalidGrantPrefix + "('50050000-0000-4000-8000-000000000011', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000006', '50000000-0000-4000-8000-000000000006', '50040000-0000-4000-8000-000000000001');",
  ].join("\n"), /accepted active membership/i);

  queryLocal([...base,
    invalidGrantPrefix + "('50050000-0000-4000-8000-000000000012', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '50040000-0000-4000-8000-000000000006');",
  ].join("\n"), /matching Project scope/i);

  queryLocal([...base,
    invalidGrantPrefix + "('50050000-0000-4000-8000-000000000013', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '50040000-0000-4000-8000-000000000003');",
  ].join("\n"), /duplicate key/i);

  queryLocal([...base,
    "update recora_private.customer_project_access_grants set customer_auth_user_id = '50000000-0000-4000-8000-000000000002' where id = '50050000-0000-4000-8000-000000000001';",
  ].join("\n"), /immutable/i);

  queryLocal([...base,
    "update recora_private.customer_project_access_grants set status = 'revoked' where id = '50050000-0000-4000-8000-000000000001';",
  ].join("\n"), /active to revoked transition/i);

  queryLocal([...base,
    "update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '50040000-0000-4000-8000-000000000002', revoked_at = now(), row_version = 2 where id = '50050000-0000-4000-8000-000000000001';",
    "delete from recora_private.customer_project_access_grants where id = '50050000-0000-4000-8000-000000000001';",
  ].join("\n"), /retained|delete is not allowed/i);

  queryLocal([...base,
    "update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '50040000-0000-4000-8000-000000000002', revoked_at = now(), row_version = 2 where id = '50050000-0000-4000-8000-000000000001';",
    "update recora_private.customer_project_access_grants set revoked_at = now() + interval '1 minute', row_version = 3 where id = '50050000-0000-4000-8000-000000000001';",
  ].join("\n"), /terminal/i);

  queryLocal([...base,
    invalidGrantPrefix + "('50050000-0000-4000-8000-000000000014', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003', '50040000-0000-4000-8000-000000000003');",
    "update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '50040000-0000-4000-8000-000000000001', revoked_at = now(), row_version = 2 where id = '50050000-0000-4000-8000-000000000014';",
  ].join("\n"), /revoked command receipt may be used only once across grant history/i);

  queryLocal([...base,
    "update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '50040000-0000-4000-8000-000000000002', revoked_at = now(), row_version = 2 where id = '50050000-0000-4000-8000-000000000001';",
    invalidGrantPrefix + "('50050000-0000-4000-8000-000000000015', '50010000-0000-4000-8000-000000000001', '50020000-0000-4000-8000-000000000001', '50030000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003', '50040000-0000-4000-8000-000000000002');",
  ].join("\n"), /issued command receipt may be used only once across grant history/i);

  queryLocal([...base,
    "drop index recora_private.data_lifecycle_current_organization_scope_unique;",
    "insert into recora_private.data_lifecycle_current (organization_id, project_id, state) values ('50010000-0000-4000-8000-000000000001', null, 'active');",
    "set local role authenticated;",
    "select set_config('request.jwt.claim.role', 'authenticated', true);",
    "select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true);",
    "do $m05_ambiguous$ begin if exists (select 1 from public.projects where id = '50020000-0000-4000-8000-000000000001') then raise exception 'M05 ambiguous lifecycle did not fail closed'; end if; end; $m05_ambiguous$;",
    "rollback;",
  ].join("\n"));
}
function runConcurrentSql(sql: string): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec", "--interactive", expectedContainer,
        "psql", "--username", "postgres", "--dbname", "postgres",
        "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet",
      ],
      { cwd: repoRoot, env: { ...process.env, NO_COLOR: "1" }, stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output: sanitize(stdout + "\n" + stderr) }));
    child.stdin.end(sql);
  });
}

async function verifyReceiptCrossColumnConcurrencyFixture(): Promise<void> {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const organizationId = randomUUID();
  const projectId = randomUUID();
  const customerOne = randomUUID();
  const customerTwo = randomUUID();
  const memberOne = randomUUID();
  const memberTwo = randomUUID();
  const existingGrantId = randomUUID();
  const issueGrantId = randomUUID();
  const initialReceiptId = randomUUID();
  const sharedReceiptId = randomUUID();
  const initialFingerprint = randomUUID().replace(/-/g, "").repeat(2);
  const sharedFingerprint = randomUUID().replace(/-/g, "").repeat(2);

  // Cross-session visibility requires committed setup; these unique rows exist
  // only in the dedicated local M05 stack and are removed by the seeded reset.
  queryLocal([
    `insert into auth.users (id, email, created_at, updated_at) values ('${customerOne}', 'm05-concurrency-one-${suffix}@example.invalid', now(), now()), ('${customerTwo}', 'm05-concurrency-two-${suffix}@example.invalid', now(), now());`,
    `insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo) values ('${organizationId}', 'm05-concurrency-${suffix}', 'M05 concurrency ${suffix}', 'client', 'local', false, false);`,
    `insert into public.organization_members (id, organization_id, user_id, email, role, invited_at, accepted_at, membership_status) values ('${memberOne}', '${organizationId}', '${customerOne}', 'm05-concurrency-one-${suffix}@example.invalid', 'member', now(), now(), 'active'), ('${memberTwo}', '${organizationId}', '${customerTwo}', 'm05-concurrency-two-${suffix}@example.invalid', 'member', now(), now(), 'active');`,
    `insert into public.projects (id, organization_id, slug, name) values ('${projectId}', '${organizationId}', 'm05-concurrency-${suffix}', 'M05 concurrency ${suffix}');`,
    `insert into recora_private.admin_command_receipts (id, actor_type, system_component_code, command_name, organization_id, project_id, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code) values ('${initialReceiptId}', 'system', 'm05.fixture', 'GrantProjectAccess', '${organizationId}', '${projectId}', 'customer.project_access', '${memberOne}', 'm05.concurrency.initial.${suffix}', '${initialFingerprint}', '${randomUUID()}', '${randomUUID()}', 'committed', 'm05.fixture.committed'), ('${sharedReceiptId}', 'system', 'm05.fixture', 'CustomerProjectAccessTransition', '${organizationId}', '${projectId}', 'customer.project_access', '${memberTwo}', 'm05.concurrency.shared.${suffix}', '${sharedFingerprint}', '${randomUUID()}', '${randomUUID()}', 'committed', 'm05.fixture.committed');`,
    `insert into recora_private.customer_project_access_grants (id, organization_id, project_id, organization_member_id, customer_auth_user_id, issued_command_receipt_id) values ('${existingGrantId}', '${organizationId}', '${projectId}', '${memberOne}', '${customerOne}', '${initialReceiptId}');`,
  ].join("\n"));

  const issue = [
    "begin;",
    `insert into recora_private.customer_project_access_grants (id, organization_id, project_id, organization_member_id, customer_auth_user_id, issued_command_receipt_id) values ('${issueGrantId}', '${organizationId}', '${projectId}', '${memberTwo}', '${customerTwo}', '${sharedReceiptId}');`,
    "select pg_catalog.pg_sleep(0.75);",
    "commit;",
  ].join("\n");
  const revoke = [
    "begin;",
    `update recora_private.customer_project_access_grants set status = 'revoked', revoked_command_receipt_id = '${sharedReceiptId}', revoked_at = now(), row_version = 2 where id = '${existingGrantId}';`,
    "select pg_catalog.pg_sleep(0.75);",
    "commit;",
  ].join("\n");
  const results = await Promise.all([runConcurrentSql(issue), runConcurrentSql(revoke)]);
  const committed = results.filter((result) => result.code === 0);
  const rejected = results.filter((result) => result.code !== 0);
  assert.equal(committed.length, 1, "M05 concurrent cross-column receipt use must commit exactly one transition.");
  assert.equal(rejected.length, 1, "M05 concurrent cross-column receipt use must reject exactly one transition.");
  assert.doesNotMatch(rejected[0]!.output, /deadlock detected/i);
  assert.match(rejected[0]!.output, /may be used only once across grant history/i);
  queryLocal([
    "do $m05_cross_column_concurrency$",
    "begin",
    `  if (select count(*) from recora_private.customer_project_access_grants where issued_command_receipt_id = '${sharedReceiptId}' or revoked_command_receipt_id = '${sharedReceiptId}') <> 1 then`,
    "    raise exception 'M05 concurrent receipt use did not converge to one global history reference';",
    "  end if;",
    "end;",
    "$m05_cross_column_concurrency$;",
  ].join("\n"));
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = spawnSync(
    "docker",
    [
      "exec", "--interactive", expectedContainer,
      "psql", "--username", "postgres", "--dbname", "postgres",
      "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet",
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
  const output = sanitize((result.stdout ?? "") + "\n" + (result.stderr ?? ""));
  if (result.error) throw result.error;
  if (expectedError) {
    assert.notEqual(result.status, 0, "Expected SQL failure " + expectedError + ", but it succeeded.");
    assert.match(output, expectedError);
    return output;
  }
  assert.equal(result.status, 0, "Local SQL failed:\n" + output);
  return result.stdout ?? "";
}

function runSupabaseCli(args: string[]): string {
  const npxArgs = ["--no-install", "supabase", ...args];
  if (process.platform !== "win32") return run("npx", npxArgs);
  const npxCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
  assert.ok(fs.existsSync(npxCli), "Windows npx CLI entrypoint is missing.");
  return run(process.execPath, [npxCli, ...npxArgs]);
}

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    command + " " + args.join(" ") + " failed:\n" + sanitize((result.stdout ?? "") + "\n" + (result.stderr ?? "")),
  );
  return result.stdout ?? "";
}

function stripSqlLineComments(sql: string): string {
  return sql.replace(/^\s*--.*$/gm, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function sanitize(value: string): string {
  return value.replace(/(?:postgres(?:ql)?:\/\/)[^\s'"]+/gi, "[redacted-db-url]");
}

function toRepoPath(value: string): string {
  return value.split(path.sep).join("/");
}