import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const expectedBaseline = "269f8bc3c2c1e56e16ade6ab6cbc5b64c7817e7c";
const expectedM03Merge = "8d5d2a7cac4bbe13d07fe42bfbd855458bc80495";
const expectedContainer = "supabase_db_recora-admin-p0-m04";
const expectedCanonicalHash = "f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a";
const expectedPhysicalHash = "d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a";
const migrationDirectory = path.join(repoRoot, "supabase", "migrations");
const canonicalPath = "docs/architecture/recora-admin-p0/canonical/recora_admin_p0_canonical_manifest_v1.json";
const physicalPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_physical_schema_manifest_v1_3.json";
const specPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_m04_customer_project_inquiry_spec_v1.md";
const m00Stem = "recora_admin_p0_00_baseline_contract";
const m01Stem = "recora_admin_p0_01_common_infrastructure";
const m02Stem = "recora_admin_p0_02_operator_rbac_audit";
const m03Stem = "recora_admin_p0_03_static_catalogs";
const m04Stem = "recora_admin_p0_04_customer_project_inquiry";
const staticOnly = process.env.RECORA_ADMIN_P0_STATIC_ONLY === "1";

assertGitTracked(canonicalPath);
assertGitTracked(physicalPath);
for (const immutablePath of [
  canonicalPath,
  physicalPath,
  "package-lock.json",
  "tsconfig.json",
  "supabase/seed.sql",
  "scripts/verify-recora-admin-p0-00-baseline-contract.ts",
  "scripts/verify-recora-admin-p0-01-common-infrastructure.ts",
  "scripts/verify-recora-admin-p0-02-operator-rbac-audit.ts",
  "scripts/verify-recora-admin-p0-03-static-catalogs.ts",
]) {
  assertGitClean(immutablePath, "M04 must not modify " + immutablePath);
}
assert.equal(sha256(readHeadBlob(canonicalPath)), expectedCanonicalHash);
assert.equal(sha256(readHeadBlob(physicalPath)), expectedPhysicalHash);

const m00Path = findMigration(m00Stem);
const m01Path = findMigration(m01Stem);
const m02Path = findMigration(m02Stem);
const m03Path = findMigration(m03Stem);
const m04Path = findMigration(m04Stem);
assert.ok(migrationTimestamp(m00Path) < migrationTimestamp(m01Path));
assert.ok(migrationTimestamp(m01Path) < migrationTimestamp(m02Path));
assert.ok(migrationTimestamp(m02Path) < migrationTimestamp(m03Path));
assert.ok(migrationTimestamp(m03Path) < migrationTimestamp(m04Path));
for (const migrationPath of [m00Path, m01Path, m02Path, m03Path]) {
  assertGitClean(toRepoPath(path.relative(repoRoot, migrationPath)), "M04 must not modify an existing migration.");
}

const migrationSql = fs.readFileSync(m04Path, "utf8");
const executableMigrationSql = stripSqlLineComments(migrationSql);
const normalizedMigrationSql = normalizeSql(executableMigrationSql);
verifyMigrationSource();
verifyPackageScripts();
verifySpecification();

if (!staticOnly) {
  verifyRepositoryBaseline();
  verifyLocalDatabase();
}

console.log(JSON.stringify({
  status: "ok",
  baseline: expectedBaseline,
  migration: toRepoPath(path.relative(repoRoot, m04Path)),
  staticOnly,
  checkedCases: {
    authorityAndSource: true,
    m00M03AndP4bCompatibility: true,
    publicExtensions: true,
    privateRlsAndAcl: !staticOnly,
    positiveAndNegativeFixtures: !staticOnly,
    migrationReplayAndAdvisors: !staticOnly,
  },
}, null, 2));

function verifyMigrationSource(): void {
  assertPostgresIdentifierLengths(executableMigrationSql);

  const createdTables = Array.from(
    normalizedMigrationSql.matchAll(/create table if not exists ([a-z0-9_.]+)/g),
  ).map((match) => match[1]);
  assert.deepEqual(createdTables, [
    "recora_private.admin_customer_profiles",
    "recora_private.admin_project_states",
    "recora_private.admin_customer_inquiries",
    "recora_private.admin_customer_inquiry_notes",
  ]);

  for (const required of [
    "admin_p0_schema_versions",
    expectedCanonicalHash,
    expectedPhysicalHash,
    "customer_session",
    "customer_auth_user_id",
    "p4_command_receipt_actor_shape",
    "recora_p4b_resolve_customer_access",
    "projects_id_organization_id_unique",
    "orphan public project",
    "cross-tenant project",
    "non-revoked normalized membership email",
    "admin_customer_profiles",
    "admin_project_states",
    "admin_customer_inquiries",
    "admin_customer_inquiry_notes",
    "normalized_email text generated always",
    "row_version bigint not null default 1",
    "blocked_by_system",
    "setup_in_progress",
    "paused_by_admin",
    "notification_state",
    "same-transaction resolution note",
    "same-transaction reopen reason",
    "admin_customer_inquiry_notes_append_only",
    "enable row level security",
    "security invoker",
  ]) {
    assert.ok(normalizedMigrationSql.includes(required), "Missing M04 migration contract: " + required);
  }

  for (const functionName of [
    "admin_p0_guard_organization_write",
    "admin_p0_guard_project_write",
    "admin_p0_guard_member_write",
    "admin_p0_guard_customer_profile",
    "admin_p0_guard_project_state",
    "admin_p0_guard_customer_inquiry",
    "admin_p0_validate_inquiry_note",
    "admin_p0_validate_inquiry_note_contract",
  ]) {
    const declaration = [
      "create or replace function recora_private." + functionName + "()",
      "returns trigger",
      "language plpgsql",
      "security invoker",
    ].join("\n");
    assert.ok(
      executableMigrationSql.includes(declaration),
      "M04 private helper must be SECURITY INVOKER: " + functionName,
    );
  }
  assert.doesNotMatch(executableMigrationSql, /\bsecurity\s+definer\b/i);
  assert.doesNotMatch(executableMigrationSql, /\b(?:drop|truncate)\b/i);
  assert.doesNotMatch(executableMigrationSql, /\bgrant\s+/i);
  assert.doesNotMatch(executableMigrationSql, /\b(?:insert\s+into|update|delete\s+from)\s+recora_admin\./i);
  assert.doesNotMatch(executableMigrationSql, /\badd\s+column\b[\s\S]{0,120}\b(?:invitation_expires_at|token)\b/i);
  assert.doesNotMatch(executableMigrationSql, /\b(?:audit|outbox)[\s\S]{0,80}\b(?:body|email)\b/i);

  assert.ok(normalizedMigrationSql.includes(
    "where membership_status <> 'revoked'::public.recora_organization_membership_status",
  ));
  assert.ok(normalizedMigrationSql.includes(
    "foreign key (project_id, organization_id) references public.projects(id, organization_id)",
  ));
}

function verifyPackageScripts(): void {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};
  assert.equal(scripts["recora:admin-p0:m04:check"], "tsx scripts/verify-recora-admin-p0-04-customer-project-inquiry.ts");
  assert.ok(typeof scripts["recora:admin-p0:m04:static-check"] === "string");
  assert.match(
    scripts["recora:admin-p0:m04:static-check"] ?? "",
    /verify-recora-admin-p0-04-customer-project-inquiry\.ts/,
  );
  const preflight = scripts["recora:preflight"] ?? "";
  assert.ok(preflight.includes("recora:admin-p0:m03:static-check && npm run recora:admin-p0:m04:static-check"));
  assert.ok(preflight.includes("recora:admin-p0:m04:static-check && npm run recora:project-setup-draft:check"));
}

function verifySpecification(): void {
  const specAbsolutePath = path.join(repoRoot, specPath);
  assert.ok(fs.existsSync(specAbsolutePath), "M04 specification is missing.");
  const spec = fs.readFileSync(specAbsolutePath, "utf8");
  for (const required of [
    "Scope",
    "Authority",
    "Public Extensions",
    "Tenant Ownership",
    "P4-B",
    "Inquiry",
    "Row Version",
    "Security",
    "No Backfill",
    "Validation",
    "Out of Scope",
  ]) {
    assert.ok(spec.includes(required), "M04 specification is missing section: " + required);
  }
}

function verifyRepositoryBaseline(): void {
  const mode = process.env.RECORA_ADMIN_P0_BASELINE_MODE ?? "ancestor";
  assert.ok(mode === "ancestor" || mode === "exact", "Unknown M04 baseline mode: " + mode);
  const head = run("git", ["rev-parse", "HEAD"]).trim();
  for (const requiredAncestor of [expectedBaseline, expectedM03Merge]) {
    const result = spawnSync("git", ["merge-base", "--is-ancestor", requiredAncestor, "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    });
    assert.equal(result.status, 0, "Required M04 ancestor is missing from HEAD " + head + ": " + requiredAncestor);
  }
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
    "do $m04_schema$",
    "declare relation_name text; function_name text;",
    "begin",
    "  if (select count(*) from pg_class class_row join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace",
    "      where namespace_row.nspname = 'recora_private' and class_row.relname in",
    "      ('admin_customer_profiles','admin_project_states','admin_customer_inquiries','admin_customer_inquiry_notes')) <> 4 then",
    "    raise exception 'M04 private relation inventory mismatch';",
    "  end if;",
    "  if (select count(*) from information_schema.columns",
    "      where table_schema = 'public' and column_name = 'row_version'",
    "        and table_name in ('organizations','projects','organization_members')",
    "        and udt_name = 'int8' and is_nullable = 'NO') <> 3 then",
    "    raise exception 'M04 public row_version shape mismatch';",
    "  end if;",
    "  if not exists (select 1 from information_schema.columns",
    "      where table_schema = 'public' and table_name = 'organization_members'",
    "        and column_name = 'normalized_email' and udt_name = 'text' and is_generated = 'ALWAYS') then",
    "    raise exception 'M04 normalized membership email column is missing';",
    "  end if;",
    "  if not exists (select 1 from pg_index index_row join pg_class index_class on index_class.oid = index_row.indexrelid",
    "      where index_row.indrelid = 'public.organization_members'::regclass",
    "        and index_class.relname = 'organization_members_nonrevoked_email_key') then",
    "    raise exception 'M04 non-revoked membership email index is missing';",
    "  end if;",
    "  foreach relation_name in array array[",
    "    'recora_private.admin_customer_profiles',",
    "    'recora_private.admin_project_states',",
    "    'recora_private.admin_customer_inquiries',",
    "    'recora_private.admin_customer_inquiry_notes'",
    "  ] loop",
    "    if not exists (select 1 from pg_class where oid = to_regclass(relation_name) and relrowsecurity) then",
    "      raise exception 'M04 RLS is missing for %', relation_name;",
    "    end if;",
    "    if has_table_privilege('public', relation_name, 'select')",
    "      or has_table_privilege('anon', relation_name, 'select')",
    "      or has_table_privilege('authenticated', relation_name, 'select')",
    "      or has_table_privilege('service_role', relation_name, 'select')",
    "      or has_table_privilege('service_role', relation_name, 'insert')",
    "      or has_table_privilege('service_role', relation_name, 'update')",
    "      or has_table_privilege('service_role', relation_name, 'delete') then",
    "      raise exception 'M04 direct private table privilege found for %', relation_name;",
    "    end if;",
    "  end loop;",
    "  foreach function_name in array array[",
    "    'admin_p0_guard_organization_write',",
    "    'admin_p0_guard_project_write',",
    "    'admin_p0_guard_member_write',",
    "    'admin_p0_guard_customer_profile',",
    "    'admin_p0_guard_project_state',",
    "    'admin_p0_guard_customer_inquiry',",
    "    'admin_p0_validate_inquiry_note',",
    "    'admin_p0_validate_inquiry_note_contract'",
    "  ] loop",
    "    if exists (select 1 from pg_proc function_row join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace",
    "        where namespace_row.nspname = 'recora_private' and function_row.proname = function_name and function_row.prosecdef) then",
    "      raise exception 'M04 private helper is SECURITY DEFINER: %', function_name;",
    "    end if;",
    "  end loop;",
    "  if (select count(*) from recora_operator.admin_roles) <> 8",
    "    or (select count(*) from recora_operator.admin_capabilities) <> 64",
    "    or (select count(*) from recora_operator.admin_role_capabilities) <> 185",
    "    or (select count(*) from recora_private.admin_notification_categories) <> 8 then",
    "    raise exception 'M04 changed M03 catalog inventory';",
    "  end if;",
    "end;",
    "$m04_schema$;",
  ].join("\n"));

  for (const protectedRole of ["anon", "authenticated", "service_role"]) {
    for (const relationName of [
      "recora_private.admin_customer_profiles",
      "recora_private.admin_project_states",
      "recora_private.admin_customer_inquiries",
      "recora_private.admin_customer_inquiry_notes",
    ]) {
      queryLocal(
        ["begin;", "set local role " + protectedRole + ";", "select * from " + relationName + ";", "rollback;"].join("\n"),
        /permission denied/i,
      );
    }
  }

  const fixture = [
    "begin;",
    "insert into public.organizations (id, slug, name) values",
    "  ('94000000-0000-4000-8000-000000000001', 'm04-fixture-a', 'Fixture A'),",
    "  ('94000000-0000-4000-8000-000000000002', 'm04-fixture-b', 'Fixture B');",
    "insert into public.projects (id, organization_id, slug, name) values",
    "  ('94000000-0000-4000-8100-000000000001', '94000000-0000-4000-8000-000000000001', 'm04-fixture-project-a', 'Fixture Project A'),",
    "  ('94000000-0000-4000-8100-000000000002', '94000000-0000-4000-8000-000000000002', 'm04-fixture-project-b', 'Fixture Project B');",
  ];

  queryLocal([
    ...fixture,
    "update public.organizations set name = 'Fixture A updated' where id = '94000000-0000-4000-8000-000000000001';",
    "do $m04_row_version$ begin",
    "  if (select row_version from public.organizations where id = '94000000-0000-4000-8000-000000000001') <> 2 then",
    "    raise exception 'M04 organization row version did not advance';",
    "  end if;",
    "end; $m04_row_version$;",
    "insert into recora_private.admin_customer_profiles (id, organization_id, access_control) values",
    "  ('94000000-0000-4000-8200-000000000001', '94000000-0000-4000-8000-000000000001', 'enabled');",
    "insert into recora_private.admin_project_states (id, project_id, organization_id) values",
    "  ('94000000-0000-4000-8300-000000000001', '94000000-0000-4000-8100-000000000001', '94000000-0000-4000-8000-000000000001');",
    "insert into recora_private.admin_customer_inquiries (id, organization_id, project_id, subject, body, received_at) values",
    "  ('94000000-0000-4000-8400-000000000001', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'Fixture inquiry', 'Fixture body', now());",
    "update recora_private.admin_customer_inquiries set notification_state = 'failed'",
    "  where id = '94000000-0000-4000-8400-000000000001';",
    "do $m04_notification$ begin",
    "  if (select status from recora_private.admin_customer_inquiries where id = '94000000-0000-4000-8400-000000000001') <> 'new' then",
    "    raise exception 'M04 notification changed inquiry status';",
    "  end if;",
    "end; $m04_notification$;",
    "insert into recora_private.admin_customer_inquiry_notes (id, inquiry_id, organization_id, project_id, note_type, body) values",
    "  ('94000000-0000-4000-8500-000000000001', '94000000-0000-4000-8400-000000000001', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'resolution', 'Resolved in fixture');",
    "update recora_private.admin_customer_inquiries set status = 'resolved', resolved_at = now(),",
    "  resolution_note_id = '94000000-0000-4000-8500-000000000001'",
    "  where id = '94000000-0000-4000-8400-000000000001';",
    "set constraints all immediate;",
    "insert into recora_private.admin_customer_inquiry_notes (id, inquiry_id, organization_id, project_id, note_type, body) values",
    "  ('94000000-0000-4000-8500-000000000002', '94000000-0000-4000-8400-000000000001', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'reopen_reason', 'Reopened in fixture');",
    "update recora_private.admin_customer_inquiries set status = 'in_progress', resolved_at = null, resolution_note_id = null,",
    "  reopen_reason_note_id = '94000000-0000-4000-8500-000000000002'",
    "  where id = '94000000-0000-4000-8400-000000000001';",
    "rollback;",
  ].join("\n"));

  queryLocal([...fixture,
    "update public.organizations set row_version = 3 where id = '94000000-0000-4000-8000-000000000001';",
  ].join("\n"), /row_version must advance by exactly one/i);

  queryLocal([...fixture,
    "delete from public.organizations where id = '94000000-0000-4000-8000-000000000001';",
  ].join("\n"), /physical deletion is prohibited/i);

  queryLocal([...fixture,
    "insert into recora_private.admin_project_states (id, project_id, organization_id) values",
    "  ('94000000-0000-4000-8300-000000000099', '94000000-0000-4000-8100-000000000002', '94000000-0000-4000-8000-000000000001');",
  ].join("\n"), /foreign key/i);

  queryLocal([...fixture,
    "insert into recora_private.admin_customer_profiles (id, organization_id, access_control, blocked_incident_id) values",
    "  ('94000000-0000-4000-8200-000000000002', '94000000-0000-4000-8000-000000000001', 'blocked_by_system', '94000000-0000-4000-8600-000000000001');",
    "update recora_private.admin_customer_profiles set access_control = 'enabled', blocked_incident_id = null",
    "  where id = '94000000-0000-4000-8200-000000000002';",
  ].join("\n"), /ordinarily unblocked/i);

  queryLocal([...fixture,
    "insert into recora_private.admin_project_states (id, project_id, organization_id) values",
    "  ('94000000-0000-4000-8300-000000000002', '94000000-0000-4000-8100-000000000001', '94000000-0000-4000-8000-000000000001');",
    "update recora_private.admin_project_states set lifecycle_state = 'closed' where id = '94000000-0000-4000-8300-000000000002';",
    "update recora_private.admin_project_states set lifecycle_state = 'active' where id = '94000000-0000-4000-8300-000000000002';",
  ].join("\n"), /closed project state is terminal/i);
  queryLocal([...fixture,
    "insert into recora_private.admin_customer_inquiries (id, organization_id, project_id, subject, body, received_at) values",
    "  ('94000000-0000-4000-8400-000000000002', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'Immutable inquiry', 'Immutable body', now());",
    "update recora_private.admin_customer_inquiries set subject = 'Changed'",
    "  where id = '94000000-0000-4000-8400-000000000002';",
  ].join("\n"), /incoming scope and content are immutable/i);

  queryLocal([...fixture,
    "insert into recora_private.admin_customer_inquiries (id, organization_id, project_id, subject, body, received_at) values",
    "  ('94000000-0000-4000-8400-000000000003', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'Resolve missing note', 'Fixture body', now());",
    "update recora_private.admin_customer_inquiries set status = 'resolved', resolved_at = now()",
    "  where id = '94000000-0000-4000-8400-000000000003';",
    "set constraints all immediate;",
  ].join("\n"), /resolution requires a same-transaction resolution note/i);

  queryLocal([...fixture,
    "insert into recora_private.admin_customer_inquiries (id, organization_id, project_id, subject, body, received_at) values",
    "  ('94000000-0000-4000-8400-000000000004', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'Reopen missing note', 'Fixture body', now());",
    "insert into recora_private.admin_customer_inquiry_notes (id, inquiry_id, organization_id, project_id, note_type, body) values",
    "  ('94000000-0000-4000-8500-000000000003', '94000000-0000-4000-8400-000000000004', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'resolution', 'Resolution note');",
    "update recora_private.admin_customer_inquiries set status = 'resolved', resolved_at = now(),",
    "  resolution_note_id = '94000000-0000-4000-8500-000000000003'",
    "  where id = '94000000-0000-4000-8400-000000000004';",
    "set constraints all immediate;",
    "update recora_private.admin_customer_inquiries set status = 'in_progress', resolved_at = null, resolution_note_id = null",
    "  where id = '94000000-0000-4000-8400-000000000004';",
  ].join("\n"), /reopening requires a same-transaction reopen reason/i);

  queryLocal([...fixture,
    "insert into recora_private.admin_customer_inquiries (id, organization_id, project_id, subject, body, received_at) values",
    "  ('94000000-0000-4000-8400-000000000005', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'Note scope', 'Fixture body', now());",
    "insert into recora_private.admin_customer_inquiry_notes (id, inquiry_id, organization_id, project_id, note_type, body) values",
    "  ('94000000-0000-4000-8500-000000000004', '94000000-0000-4000-8400-000000000005', '94000000-0000-4000-8000-000000000002', '94000000-0000-4000-8100-000000000002', 'internal', 'Wrong scope');",
  ].join("\n"), /scope does not match/i);

  for (const statement of [
    "update recora_private.admin_customer_inquiry_notes set body = 'Changed' where id = '94000000-0000-4000-8500-000000000005';",
    "delete from recora_private.admin_customer_inquiry_notes where id = '94000000-0000-4000-8500-000000000005';",
  ]) {
    queryLocal([...fixture,
      "insert into recora_private.admin_customer_inquiries (id, organization_id, project_id, subject, body, received_at) values",
      "  ('94000000-0000-4000-8400-000000000006', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'Append only note', 'Fixture body', now());",
      "insert into recora_private.admin_customer_inquiry_notes (id, inquiry_id, organization_id, project_id, note_type, body) values",
      "  ('94000000-0000-4000-8500-000000000005', '94000000-0000-4000-8400-000000000006', '94000000-0000-4000-8000-000000000001', '94000000-0000-4000-8100-000000000001', 'internal', 'Append only');",
      statement,
    ].join("\n"), /append|immutable/i);
  }

  queryLocal([...fixture,
    "insert into public.organization_members (id, organization_id, email, membership_status) values",
    "  ('94000000-0000-4000-8700-000000000001', '94000000-0000-4000-8000-000000000001', 'Fixture@Example.invalid', 'invited');",
    "insert into public.organization_members (id, organization_id, email, membership_status) values",
    "  ('94000000-0000-4000-8700-000000000002', '94000000-0000-4000-8000-000000000001', 'fixture@example.invalid', 'invited');",
  ].join("\n"), /duplicate key/i);

  queryLocal([...fixture,
    "insert into public.organization_members (id, organization_id, email, membership_status) values",
    "  ('94000000-0000-4000-8700-000000000003', '94000000-0000-4000-8000-000000000001', 'revoked@example.invalid', 'revoked');",
    "update public.organization_members set membership_status = 'invited'",
    "  where id = '94000000-0000-4000-8700-000000000003';",
  ].join("\n"), /revoked membership is terminal/i);

  queryLocal([
    "begin;",
    migrationSql,
    migrationSql,
    "rollback;",
  ].join("\n"));

  queryLocal([
    "do $m04_no_residual_fixture$",
    "begin",
    "  if (select count(*) from recora_private.admin_customer_profiles) <> 0",
    "    or (select count(*) from recora_private.admin_project_states) <> 0",
    "    or (select count(*) from recora_private.admin_customer_inquiries) <> 0",
    "    or (select count(*) from recora_private.admin_customer_inquiry_notes) <> 0 then",
    "    raise exception 'M04 verifier fixture rows escaped rollback';",
    "  end if;",
    "end;",
    "$m04_no_residual_fixture$;",
  ].join("\n"));

  const supabaseWorkdir = process.env.RECORA_ADMIN_P0_SUPABASE_WORKDIR;
  assert.ok(supabaseWorkdir, "RECORA_ADMIN_P0_SUPABASE_WORKDIR is required for local M04 verification.");
  assert.ok(path.isAbsolute(supabaseWorkdir), "RECORA_ADMIN_P0_SUPABASE_WORKDIR must be absolute.");
  runSupabaseCli(["--workdir", supabaseWorkdir, "migration", "list", "--local"]);
  runSupabaseCli(["--workdir", supabaseWorkdir, "db", "advisors", "--local", "--type", "security", "--fail-on", "warn"]);
  runSupabaseCli(["--workdir", supabaseWorkdir, "db", "advisors", "--local", "--type", "performance", "--fail-on", "warn"]);
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

function sanitize(value: string): string {
  return value.replace(/(?:postgres(?:ql)?:\/\/)[^\s'"]+/gi, "[redacted-db-url]");
}

function toRepoPath(value: string): string {
  return value.split(path.sep).join("/");
}