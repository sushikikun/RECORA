import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type Role = {
  id: string;
  role_code: string;
  display_name: string;
  description: string;
  allowed_scope_types: string[];
};

type Capability = {
  id: string;
  capability_code: string;
  domain_code: string;
  sensitivity: "W1" | "W2" | "W3";
};

type RoleCapability = {
  role_code: string;
  capability_code: string;
};

type NotificationCategory = {
  id: string;
  category_code: string;
  display_name: string;
};

type CatalogManifest = {
  package_id: string;
  version: string;
  implementation_baseline: string;
  canonical_manifest_sha256: string;
  physical_manifest_sha256: string;
  roles: Role[];
  capabilities: Capability[];
  role_capabilities: RoleCapability[];
  notification_categories: NotificationCategory[];
  semantic_sha256: string;
};

const repoRoot = process.cwd();
const expectedBaseline = "dc5cad4e3a2946b6993716b1d66bc0ef5c5ed8f3";
const expectedContainer = "supabase_db_recora-admin-p0-m03";
const expectedM00Stem = "recora_admin_p0_00_baseline_contract";
const expectedM01Stem = "recora_admin_p0_01_common_infrastructure";
const expectedM02Stem = "recora_admin_p0_02_operator_rbac_audit";
const expectedM03Stem = "recora_admin_p0_03_static_catalogs";
const expectedCanonicalHash = "f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a";
const expectedPhysicalHash = "d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a";
const expectedSemanticHash = "ae383267eb2758a5cf8e867ee198bcf00686a16375c92eb179f81858b553cfab";
const migrationDirectory = path.join(repoRoot, "supabase", "migrations");
const canonicalPath = "docs/architecture/recora-admin-p0/canonical/recora_admin_p0_canonical_manifest_v1.json";
const physicalPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_physical_schema_manifest_v1_3.json";
const manifestPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_m03_static_catalogs_manifest_v1.json";
const specPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_m03_static_catalogs_spec_v1.md";
const expectedRoleCounts: Record<string, number> = {
  platform_admin: 64,
  customer_operator: 21,
  measurement_operator: 16,
  quality_reviewer: 12,
  publication_operator: 13,
  system_operator: 24,
  cost_analyst: 7,
  auditor: 28,
};
const expectedDomainCounts: Record<string, number> = {
  operations_home: 1,
  customer_management: 18,
  measurement_management: 6,
  quality_exception_review: 5,
  publication_management: 6,
  operations_incident_audit: 12,
  usage_cost: 3,
  settings: 13,
};
const expectedSensitivityCounts: Record<string, number> = {
  W1: 39,
  W2: 10,
  W3: 15,
};

assertGitTracked(canonicalPath);
assertGitTracked(physicalPath);
assertGitClean(canonicalPath, "Canonical manifest must be unchanged and unstaged.");
assertGitClean(physicalPath, "Physical schema manifest must be unchanged and unstaged.");
assertGitClean("package-lock.json", "package-lock.json must be unchanged and unstaged.");
assertGitClean("tsconfig.json", "tsconfig.json must be unchanged and unstaged.");
assertGitClean("supabase/seed.sql", "Seed must be unchanged and unstaged.");
assert.equal(sha256(readHeadBlob(canonicalPath)), expectedCanonicalHash);
assert.equal(sha256(readHeadBlob(physicalPath)), expectedPhysicalHash);

const manifest = readManifest();
verifyManifest(manifest);

const m00Path = findMigration(expectedM00Stem);
const m01Path = findMigration(expectedM01Stem);
const m02Path = findMigration(expectedM02Stem);
const m03Path = findMigration(expectedM03Stem);
assert.ok(migrationTimestamp(m00Path) < migrationTimestamp(m01Path));
assert.ok(migrationTimestamp(m01Path) < migrationTimestamp(m02Path));
assert.ok(migrationTimestamp(m02Path) < migrationTimestamp(m03Path));
for (const migrationPath of [m00Path, m01Path, m02Path]) {
  assertGitClean(toRepoPath(path.relative(repoRoot, migrationPath)), "Existing migration must be unchanged.");
}

const migrationSql = fs.readFileSync(m03Path, "utf8");
const executableMigrationSql = stripSqlLineComments(migrationSql);
const normalizedMigrationSql = normalizeSql(executableMigrationSql);
verifyMigrationSource();
verifyM02Compatibility();
verifyPackageScripts();

const staticOnly = process.env.RECORA_ADMIN_P0_STATIC_ONLY === "1";
if (!staticOnly) {
  verifyRepositoryBaseline();
  verifyLocalDatabase();
}

console.log(JSON.stringify({
  status: "ok",
  baseline: expectedBaseline,
  migration: toRepoPath(path.relative(repoRoot, m03Path)),
  manifest: manifestPath,
  semanticSha256: expectedSemanticHash,
  counts: {
    roles: manifest.roles.length,
    capabilities: manifest.capabilities.length,
    roleCapabilities: manifest.role_capabilities.length,
    notificationCategories: manifest.notification_categories.length,
  },
  checkedCases: {
    manifestAndStaticCatalogValidated: true,
    m02CompatibilityValidated: true,
    databaseRowsAndAclValidated: !staticOnly,
    immutableCatalogValidated: !staticOnly,
    negativeFixturesValidated: !staticOnly,
    migrationReplayAndLocalAdvisorsValidated: !staticOnly,
  },
}, null, 2));

function verifyManifest(value: CatalogManifest): void {
  assert.deepEqual(Object.keys(value), [
    "package_id",
    "version",
    "implementation_baseline",
    "canonical_manifest_sha256",
    "physical_manifest_sha256",
    "roles",
    "capabilities",
    "role_capabilities",
    "notification_categories",
    "semantic_sha256",
  ]);
  assert.equal(value.package_id, "RECORA-ADMIN-P0-M03-STATIC-CATALOGS");
  assert.equal(value.version, "1.0");
  assert.equal(value.implementation_baseline, expectedBaseline);
  assert.equal(value.canonical_manifest_sha256, expectedCanonicalHash);
  assert.equal(value.physical_manifest_sha256, expectedPhysicalHash);
  assert.equal(value.semantic_sha256, expectedSemanticHash);

  const semanticPayload = {
    package_id: value.package_id,
    version: value.version,
    implementation_baseline: value.implementation_baseline,
    canonical_manifest_sha256: value.canonical_manifest_sha256,
    physical_manifest_sha256: value.physical_manifest_sha256,
    roles: value.roles,
    capabilities: value.capabilities,
    role_capabilities: value.role_capabilities,
    notification_categories: value.notification_categories,
  };
  assert.equal(sha256(JSON.stringify(semanticPayload)), value.semantic_sha256);

  assert.equal(value.roles.length, 8);
  assert.equal(value.capabilities.length, 64);
  assert.equal(value.role_capabilities.length, 185);
  assert.equal(value.notification_categories.length, 8);
  assertUnique(value.roles, (entry) => entry.id, "role UUID");
  assertUnique(value.roles, (entry) => entry.role_code, "role code");
  assertUnique(value.capabilities, (entry) => entry.id, "capability UUID");
  assertUnique(value.capabilities, (entry) => entry.capability_code, "capability code");
  assertUnique(value.role_capabilities, (entry) => entry.role_code + ":" + entry.capability_code, "role capability map");
  assertUnique(value.notification_categories, (entry) => entry.id, "notification category UUID");
  assertUnique(value.notification_categories, (entry) => entry.category_code, "notification category code");

  const roleCodes = new Set(value.roles.map((entry) => entry.role_code));
  const capabilityCodes = new Set(value.capabilities.map((entry) => entry.capability_code));
  for (const role of value.roles) {
    assert.match(role.id, /^83000000-0000-4000-8000-00000000000[1-8]$/);
    assert.match(role.role_code, /^[a-z][a-z0-9_]{1,63}$/);
    assert.ok(role.display_name.trim().length > 0);
    assert.ok(role.description.trim().length > 0);
    assert.ok(role.allowed_scope_types.length > 0);
    assert.ok(role.allowed_scope_types.every((scope) => ["global", "customer", "project"].includes(scope)));
  }
  for (const capability of value.capabilities) {
    assert.match(capability.id, /^83000000-0000-4000-8100-0000000000[0-9]{2}$/);
    assert.match(capability.capability_code, /^[a-z][a-z0-9_.:-]{1,127}$/);
    assert.match(capability.domain_code, /^[a-z][a-z0-9_.:-]{1,63}$/);
    assert.ok(["W1", "W2", "W3"].includes(capability.sensitivity));
  }
  for (const category of value.notification_categories) {
    assert.match(category.id, /^83000000-0000-4000-8200-00000000000[1-8]$/);
    assert.match(category.category_code, /^[a-z][a-z0-9_]{1,63}$/);
    assert.ok(Buffer.byteLength(category.category_code, "utf8") <= 63);
    assert.ok(category.display_name.trim().length > 0);
  }
  for (const mapping of value.role_capabilities) {
    assert.ok(roleCodes.has(mapping.role_code), "Unknown role in catalog map: " + mapping.role_code);
    assert.ok(capabilityCodes.has(mapping.capability_code), "Unknown capability in catalog map: " + mapping.capability_code);
  }

  const roleCounts = countBy(value.role_capabilities, (entry) => entry.role_code);
  assert.deepEqual(roleCounts, expectedRoleCounts);
  const domainCounts = countBy(value.capabilities, (entry) => entry.domain_code);
  assert.deepEqual(domainCounts, expectedDomainCounts);
  const sensitivityCounts = countBy(value.capabilities, (entry) => entry.sensitivity);
  assert.deepEqual(sensitivityCounts, expectedSensitivityCounts);

  const platformCapabilities = new Set(value.role_capabilities
    .filter((entry) => entry.role_code === "platform_admin")
    .map((entry) => entry.capability_code));
  assert.deepEqual(Array.from(platformCapabilities).sort(), Array.from(capabilityCodes).sort());

  const auditorCapabilities = value.role_capabilities
    .filter((entry) => entry.role_code === "auditor")
    .map((entry) => entry.capability_code);
  assert.ok(auditorCapabilities.every((code) => code.includes(".read")));

  const systemCapabilities = new Set(value.role_capabilities
    .filter((entry) => entry.role_code === "system_operator")
    .map((entry) => entry.capability_code));
  for (const deniedCode of [
    "customer.create",
    "customer.manage",
    "customer.access.manage",
    "customer_user.manage",
    "contract.manage",
    "project.manage",
    "project.configuration.manage",
    "project.setup.correct",
    "project.automation.manage",
    "usage_cost.export",
  ]) {
    assert.ok(!systemCapabilities.has(deniedCode), "system_operator must not include " + deniedCode);
  }
}

function verifyMigrationSource(): void {
  assertPostgresIdentifierLengths(executableMigrationSql);
  const createdTables = Array.from(
    normalizedMigrationSql.matchAll(/create table if not exists ([a-z0-9_.]+)/g),
  ).map((match: RegExpMatchArray) => match[1]);
  assert.deepEqual(createdTables, ["recora_private.admin_notification_categories"]);

  for (const required of [
    "m03_catalog_semantic_sha256",
    expectedSemanticHash,
    "recora_private.admin_notification_categories",
    "admin_notification_categories_prevent_mutation",
    "revoke all on schema recora_private from public, anon, authenticated, service_role",
    "partial or unexpected catalog inventory",
    "catalog contents differ from the approved static catalog",
  ]) {
    assert.ok(normalizedMigrationSql.includes(required), "M03 migration contract is missing: " + required);
  }
  assert.doesNotMatch(executableMigrationSql, /\bsecurity\s+definer\b/i);
  assert.doesNotMatch(executableMigrationSql, /\bon\s+conflict\b/i);
  assert.doesNotMatch(executableMigrationSql, /\b(?:create table|insert into|update|delete from)\s+(?:public|auth|recora_admin)\./i);
  assert.doesNotMatch(executableMigrationSql, /\b(?:admin_accounts|admin_role_assignments|admin_scope_assignments|admin_notification_destinations|admin_notification_subscriptions)\b/i);
  assert.doesNotMatch(executableMigrationSql, /\b(drop\s+(?:table|schema)|truncate\s+table)\b/i);
}

function verifyM02Compatibility(): void {
  const m02Verifier = fs.readFileSync(path.join(repoRoot, "scripts", "verify-recora-admin-p0-02-operator-rbac-audit.ts"), "utf8");
  for (const required of [
    "const expectedM03Stem = \"recora_admin_p0_03_static_catalogs\";",
    "function verifyM03CatalogState(): void",
    "M03 catalog state does not match the approved manifest",
    "postM03CatalogExactValidated",
  ]) {
    assert.ok(m02Verifier.includes(required), "M02 verifier M03 compatibility is missing: " + required);
  }
}

function verifyPackageScripts(): void {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  assert.equal(scripts["recora:admin-p0:m03:check"], "tsx scripts/verify-recora-admin-p0-03-static-catalogs.ts");
  assert.ok(typeof scripts["recora:admin-p0:m03:static-check"] === "string");
  assert.match(scripts["recora:admin-p0:m03:static-check"] ?? "", /verify-recora-admin-p0-03-static-catalogs\.ts/);
  const preflight = scripts["recora:preflight"] ?? "";
  assert.ok(preflight.includes("recora:github-actions-identity:check"));
  assert.ok(preflight.includes("recora:prompt-measurement-contract:check"));
  assert.ok(preflight.includes("recora:admin-p0:canonical:check"));
  assert.ok(preflight.includes("recora:admin-p0:m00:static-check"));
  assert.ok(preflight.includes("recora:admin-p0:m01:static-check"));
  assert.ok(preflight.includes("recora:admin-p0:m02:static-check && npm run recora:admin-p0:m03:static-check"));
}

function verifyRepositoryBaseline(): void {
  const mode = process.env.RECORA_ADMIN_P0_BASELINE_MODE ?? "ancestor";
  assert.ok(mode === "ancestor" || mode === "exact", "Unknown M03 baseline mode: " + mode);
  const head = run("git", ["rev-parse", "HEAD"]).trim();
  const ancestor = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", expectedBaseline, "HEAD"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
  );
  assert.equal(ancestor.status, 0, "M03 baseline is not an ancestor of HEAD " + head);
  if (mode === "exact") {
    assert.equal(head, expectedBaseline);
    const approvedBaseRef = process.env.RECORA_ADMIN_P0_APPROVED_BASE_REF ?? "origin/master";
    assert.equal(run("git", ["rev-parse", approvedBaseRef]).trim(), expectedBaseline);
  }
}

function verifyLocalDatabase(): void {
  assert.equal(process.env.RECORA_ADMIN_P0_DB_CONTAINER, expectedContainer);
  run("docker", ["inspect", expectedContainer]);

  queryLocal([
    "do $m03_schema$",
    "begin",
    "  if to_regclass('recora_private.admin_notification_categories') is null then",
    "    raise exception 'M03 notification category table is missing';",
    "  end if;",
    "  if (select count(*) from information_schema.columns",
    "      where table_schema = 'recora_private' and table_name = 'admin_notification_categories') <> 4 then",
    "    raise exception 'M03 notification category column count mismatch';",
    "  end if;",
    "  if (select count(*) from information_schema.columns",
    "      where table_schema = 'recora_private' and table_name = 'admin_notification_categories'",
    "        and ((column_name = 'id' and udt_name = 'uuid' and is_nullable = 'NO')",
    "          or (column_name = 'category_code' and udt_name = 'text' and is_nullable = 'NO')",
    "          or (column_name = 'display_name' and udt_name = 'text' and is_nullable = 'NO')",
    "          or (column_name = 'created_at' and udt_name = 'timestamptz' and is_nullable = 'NO'))) <> 4 then",
    "    raise exception 'M03 notification category shape mismatch';",
    "  end if;",
    "  if not exists (select 1 from pg_class where oid = 'recora_private.admin_notification_categories'::regclass and relrowsecurity) then",
    "    raise exception 'M03 notification category RLS missing';",
    "  end if;",
    "  if not exists (select 1 from pg_trigger where tgrelid = 'recora_private.admin_notification_categories'::regclass",
    "      and tgname = 'admin_notification_categories_prevent_mutation' and tgenabled = 'O') then",
    "    raise exception 'M03 notification category immutability trigger missing';",
    "  end if;",
    "  if to_regclass('recora_private.admin_notification_destinations') is not null",
    "    or to_regclass('recora_private.admin_notification_subscriptions') is not null then",
    "    raise exception 'M03 created notification destination or subscription objects';",
    "  end if;",
    "  if (select count(*) from recora_operator.admin_accounts) <> 0",
    "    or (select count(*) from recora_operator.admin_role_assignments) <> 0",
    "    or (select count(*) from recora_operator.admin_scope_assignments) <> 0 then",
    "    raise exception 'M03 created forbidden account or assignment rows';",
    "  end if;",
    "end;",
    "$m03_schema$;",
  ].join("\n"));

  queryLocal(catalogAssertionsSql());

  for (const protectedRole of ["anon", "authenticated", "service_role"]) {
    queryLocal(
      ["begin;", "set local role " + protectedRole + ";", "select * from recora_operator.admin_roles;", "rollback;"].join("\n"),
      /permission denied/i,
    );
    for (const statement of [
      "select * from recora_private.admin_notification_categories;",
      "insert into recora_private.admin_notification_categories (id, category_code, display_name) values (gen_random_uuid(), 'm03_protected_fixture', 'Protected fixture');",
      "update recora_private.admin_notification_categories set display_name = 'Changed' where category_code = 'daily_summary';",
      "delete from recora_private.admin_notification_categories where category_code = 'daily_summary';",
    ]) {
      queryLocal(["begin;", "set local role " + protectedRole + ";", statement, "rollback;"].join("\n"), /permission denied/i);
    }
  }

  queryLocal([
    "begin;",
    "update recora_operator.admin_roles set display_name = display_name where role_code = 'auditor';",
    "rollback;",
  ].join("\n"), /immutable/i);
  queryLocal([
    "begin;",
    "delete from recora_operator.admin_capabilities where capability_code = 'measurement.read';",
    "rollback;",
  ].join("\n"), /immutable/i);
  queryLocal([
    "begin;",
    "update recora_private.admin_notification_categories set display_name = display_name where category_code = 'daily_summary';",
    "rollback;",
  ].join("\n"), /immutable/i);
  queryLocal([
    "begin;",
    "delete from recora_private.admin_notification_categories where category_code = 'daily_summary';",
    "rollback;",
  ].join("\n"), /immutable/i);

  queryLocal([
    "begin;",
    "insert into recora_operator.admin_roles (id, role_code, display_name, description) values",
    "  ('83000000-0000-4000-8000-000000000099', 'm03_extra_role', 'Extra role', 'must be rejected on replay');",
    migrationSql,
    "rollback;",
  ].join("\n"), /partial or unexpected catalog inventory|catalog contents differ/i);

  queryLocal([
    "begin;",
    "truncate table recora_private.admin_notification_categories;",
    migrationSql,
    "rollback;",
  ].join("\n"), /partial or unexpected catalog inventory|catalog contents differ/i);

  queryLocal([
    "begin;",
    "alter table recora_operator.admin_capabilities disable trigger admin_capabilities_prevent_mutation;",
    "update recora_operator.admin_capabilities set domain_code = 'settings' where capability_code = 'measurement.read';",
    "alter table recora_operator.admin_capabilities enable trigger admin_capabilities_prevent_mutation;",
    migrationSql,
    "rollback;",
  ].join("\n"), /catalog contents differ/i);

  queryLocal([
    "begin;",
    "alter table recora_operator.admin_role_capabilities disable trigger admin_role_capabilities_prevent_mutation;",
    "delete from recora_operator.admin_role_capabilities where role_id = '83000000-0000-4000-8000-000000000002'",
    "  and capability_id = '83000000-0000-4000-8100-000000000001';",
    "alter table recora_operator.admin_role_capabilities enable trigger admin_role_capabilities_prevent_mutation;",
    migrationSql,
    "rollback;",
  ].join("\n"), /partial or unexpected catalog inventory|catalog contents differ/i);

  queryLocal([
    "begin;",
    "insert into recora_operator.admin_role_capabilities (role_id, capability_id) values",
    "  ('83000000-0000-4000-8000-000000000006', '83000000-0000-4000-8100-000000000005');",
    migrationSql,
    "rollback;",
  ].join("\n"), /partial or unexpected catalog inventory|catalog contents differ/i);

  queryLocal([
    "begin;",
    "alter table recora_private.admin_notification_categories disable trigger admin_notification_categories_prevent_mutation;",
    "update recora_private.admin_notification_categories set display_name = 'Mismatch' where category_code = 'daily_summary';",
    "alter table recora_private.admin_notification_categories enable trigger admin_notification_categories_prevent_mutation;",
    migrationSql,
    "rollback;",
  ].join("\n"), /catalog contents differ/i);

  queryLocal([
    "begin;",
    "insert into recora_private.admin_notification_categories (id, category_code, display_name) values",
    "  ('83000000-0000-4000-8200-000000000099', 'daily_summary', 'Duplicate code');",
    "rollback;",
  ].join("\n"), /duplicate key/i);

  queryLocal(["begin;", migrationSql, migrationSql, "rollback;"].join("\n"));

  const supabaseWorkdir = process.env.RECORA_ADMIN_P0_SUPABASE_WORKDIR;
  assert.ok(supabaseWorkdir, "RECORA_ADMIN_P0_SUPABASE_WORKDIR is required for local M03 verification.");
  assert.ok(path.isAbsolute(supabaseWorkdir), "RECORA_ADMIN_P0_SUPABASE_WORKDIR must be absolute.");
  runSupabaseCli(["--workdir", supabaseWorkdir, "migration", "list", "--local"]);
  runSupabaseCli(["--workdir", supabaseWorkdir, "db", "advisors", "--local", "--type", "security", "--fail-on", "warn"]);
  runSupabaseCli(["--workdir", supabaseWorkdir, "db", "advisors", "--local", "--type", "performance", "--fail-on", "warn"]);
}

function catalogAssertionsSql(): string {
  const roles = sqlJson(manifest.roles, "m03_roles");
  const capabilities = sqlJson(manifest.capabilities, "m03_capabilities");
  const mappings = sqlJson(manifest.role_capabilities, "m03_role_capabilities");
  const categories = sqlJson(manifest.notification_categories, "m03_categories");
  return [
    "do $m03_catalog_rows$",
    "declare",
    "  expected_roles jsonb := " + roles + ";",
    "  expected_capabilities jsonb := " + capabilities + ";",
    "  expected_mappings jsonb := " + mappings + ";",
    "  expected_categories jsonb := " + categories + ";",
    "begin",
    "  if (select count(*) from recora_operator.admin_roles) <> jsonb_array_length(expected_roles)",
    "    or (select count(*) from recora_operator.admin_capabilities) <> jsonb_array_length(expected_capabilities)",
    "    or (select count(*) from recora_operator.admin_role_capabilities) <> jsonb_array_length(expected_mappings)",
    "    or (select count(*) from recora_private.admin_notification_categories) <> jsonb_array_length(expected_categories) then",
    "    raise exception 'M03 catalog count mismatch';",
    "  end if;",
    "  if exists (",
    "    ((select id, role_code, display_name, description, is_system_defined, is_editable from recora_operator.admin_roles)",
    "      except (select id, role_code, display_name, description, true, false from jsonb_to_recordset(expected_roles) as expected(id uuid, role_code text, display_name text, description text, allowed_scope_types jsonb)))",
    "  )",
    "  or exists (",
    "    ((select id, role_code, display_name, description, true, false from jsonb_to_recordset(expected_roles) as expected(id uuid, role_code text, display_name text, description text, allowed_scope_types jsonb))",
    "      except (select id, role_code, display_name, description, is_system_defined, is_editable from recora_operator.admin_roles))",
    "  )",
    "  or exists (",
    "    ((select id, capability_code, domain_code, sensitivity from recora_operator.admin_capabilities)",
    "      except (select id, capability_code, domain_code, sensitivity from jsonb_to_recordset(expected_capabilities) as expected(id uuid, capability_code text, domain_code text, sensitivity text)))",
    "  )",
    "  or exists (",
    "    ((select id, capability_code, domain_code, sensitivity from jsonb_to_recordset(expected_capabilities) as expected(id uuid, capability_code text, domain_code text, sensitivity text))",
    "      except (select id, capability_code, domain_code, sensitivity from recora_operator.admin_capabilities))",
    "  )",
    "  or exists (",
    "    ((select role_row.role_code, capability_row.capability_code from recora_operator.admin_role_capabilities map_row join recora_operator.admin_roles role_row on role_row.id = map_row.role_id join recora_operator.admin_capabilities capability_row on capability_row.id = map_row.capability_id)",
    "      except (select role_code, capability_code from jsonb_to_recordset(expected_mappings) as expected(role_code text, capability_code text)))",
    "  )",
    "  or exists (",
    "    ((select role_code, capability_code from jsonb_to_recordset(expected_mappings) as expected(role_code text, capability_code text))",
    "      except (select role_row.role_code, capability_row.capability_code from recora_operator.admin_role_capabilities map_row join recora_operator.admin_roles role_row on role_row.id = map_row.role_id join recora_operator.admin_capabilities capability_row on capability_row.id = map_row.capability_id))",
    "  )",
    "  or exists (",
    "    ((select id, category_code, display_name from recora_private.admin_notification_categories)",
    "      except (select id, category_code, display_name from jsonb_to_recordset(expected_categories) as expected(id uuid, category_code text, display_name text)))",
    "  )",
    "  or exists (",
    "    ((select id, category_code, display_name from jsonb_to_recordset(expected_categories) as expected(id uuid, category_code text, display_name text))",
    "      except (select id, category_code, display_name from recora_private.admin_notification_categories))",
    "  ) then",
    "    raise exception 'M03 catalog state does not match the approved manifest';",
    "  end if;",
    "end;",
    "$m03_catalog_rows$;",
  ].join("\n");
}

function readManifest(): CatalogManifest {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, manifestPath), "utf8")) as CatalogManifest;
}

function sqlJson(value: unknown, tag: string): string {
  return "$" + tag + "$" + JSON.stringify(value) + "$" + tag + "$::jsonb";
}

function assertUnique<T>(items: T[], key: (item: T) => string, label: string): void {
  const values = items.map(key);
  assert.equal(new Set(values).size, values.length, "Duplicate " + label);
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return counts;
}

function assertGitTracked(filePath: string): void {
  const result = spawnSync("git", ["ls-files", "--error-unmatch", "--", filePath], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  assert.equal(result.status, 0, "Expected tracked file: " + filePath);
}

function assertGitClean(filePath: string, message: string): void {
  const result = spawnSync("git", ["diff", "--quiet", "--", filePath], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  assert.equal(result.status, 0, message);
}

function readHeadBlob(filePath: string): string {
  return run("git", ["show", "HEAD:" + filePath]);
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function findMigration(stem: string): string {
  const matches = fs.readdirSync(migrationDirectory)
    .filter((fileName) => fileName.endsWith("_" + stem + ".sql"))
    .map((fileName) => path.join(migrationDirectory, fileName));
  assert.equal(matches.length, 1, "Expected exactly one migration for " + stem);
  return matches[0];
}

function migrationTimestamp(filePath: string): string {
  const value = path.basename(filePath).split("_")[0];
  assert.match(value, /^\d{14}$/);
  return value;
}

function assertPostgresIdentifierLengths(sql: string): void {
  const patterns = [
    /\bconstraint\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+(?:unique\s+)?index(?:\s+if\s+not\s+exists)?\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+(?:constraint\s+)?trigger\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+or\s+replace\s+function\s+(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)/gi,
  ];
  const oversized: string[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sql)) !== null) {
      if (match[1] && Buffer.byteLength(match[1], "utf8") > 63) oversized.push(match[1]);
    }
  }
  assert.deepEqual(oversized, []);
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
  return output;
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
  assert.equal(result.status, 0, command + " " + args.join(" ") + " failed:\n" + sanitize((result.stdout ?? "") + "\n" + (result.stderr ?? "")));
  return result.stdout ?? "";
}

function stripSqlLineComments(sql: string): string {
  return sql.replace(/^\s*--.*$/gm, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function sanitize(value: string): string {
  return value.replace(/(?:postgres(?:ql)?:\/\/)[^\s'"]+/gi, "[redacted-db-url]");
}

function toRepoPath(value: string): string {
  return value.split(path.sep).join("/");
}
