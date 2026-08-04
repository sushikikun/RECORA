import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const expectedBaseline = "ed37aa85f2996b33429e34c86918d047be36e6b8";
const expectedContainer = "supabase_db_recora-admin-p0-m02";
const expectedM00Stem = "recora_admin_p0_00_baseline_contract";
const expectedM01Stem = "recora_admin_p0_01_common_infrastructure";
const expectedM02Stem = "recora_admin_p0_02_operator_rbac_audit";
const expectedCanonicalHash = "f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a";
const expectedPhysicalHash = "d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a";
const migrationDirectory = path.join(repoRoot, "supabase", "migrations");
const canonicalPath = "docs/architecture/recora-admin-p0/canonical/recora_admin_p0_canonical_manifest_v1.json";
const physicalPath = "docs/architecture/recora-admin-p0/database/recora_admin_p0_physical_schema_manifest_v1_3.json";
const expectedRelations = [
  "recora_operator.admin_accounts",
  "recora_operator.admin_identity_security_projections",
  "recora_operator.admin_roles",
  "recora_operator.admin_capabilities",
  "recora_operator.admin_role_capabilities",
  "recora_operator.admin_role_assignments",
  "recora_operator.admin_scope_assignments",
  "recora_audit.operator_event_scopes",
];

assertGitTracked(canonicalPath);
assertGitTracked(physicalPath);
assertGitClean(canonicalPath, "Canonical manifest must be unchanged and unstaged.");
assertGitClean(physicalPath, "Physical schema manifest must be unchanged and unstaged.");
assert.equal(sha256(readHeadBlob(canonicalPath)), expectedCanonicalHash);
assert.equal(sha256(readHeadBlob(physicalPath)), expectedPhysicalHash);

const m00Path = findMigration(expectedM00Stem);
const m01Path = findMigration(expectedM01Stem);
const m02Path = findMigration(expectedM02Stem);
assert.ok(migrationTimestamp(m00Path) < migrationTimestamp(m01Path));
assert.ok(migrationTimestamp(m01Path) < migrationTimestamp(m02Path));

const migrationSql = fs.readFileSync(m02Path, "utf8");
const executableMigrationSql = stripSqlLineComments(migrationSql);
const normalizedMigrationSql = normalizeSql(executableMigrationSql);
verifyMigrationSource();

const staticOnly = process.env.RECORA_ADMIN_P0_STATIC_ONLY === "1";
if (!staticOnly) {
  verifyRepositoryBaseline();
  verifyLocalDatabase();
}

console.log(JSON.stringify({
  status: "ok",
  baseline: expectedBaseline,
  migration: toRepoPath(path.relative(repoRoot, m02Path)),
  checkedCases: {
    sourceInventoryAndIdentifierLengthsValidated: true,
    m03CatalogSeedAbsent: true,
    manifestGitBlobsValidated: true,
    databaseRlsAndAclValidated: !staticOnly,
    normalResetCatalogEmptyValidated: !staticOnly,
    accountMfaRoleScopeValidated: !staticOnly,
    lastAdminAndSelfEscalationValidated: !staticOnly,
    humanReceiptAndAuditValidated: !staticOnly,
    migrationReplayValidated: !staticOnly,
  },
}, null, 2));

function verifyMigrationSource(): void {
  assertPostgresIdentifierLengths(executableMigrationSql);
  const createdTables = Array.from(
    normalizedMigrationSql.matchAll(/create table if not exists ([a-z0-9_.]+)/g),
  ).map((match: RegExpMatchArray) => match[1]);
  assert.deepEqual(createdTables, expectedRelations);

  for (const required of [
    "admin_p0_m02_inventory",
    "admin_command_receipts_admin_account_fkey",
    "operator_events_actor_shape_check",
    "operator_events_corrects_event_fkey",
    "admin_p0_assert_last_platform_admin",
    "self_privilege_escalation_forbidden",
    "admin_p0_validate_command_receipt_insert",
    "admin_p0_scope_covers_receipt",
    "operator_event_scopes_append_only",
    "fresh w3 step-up evidence",
    "revoke all on schema recora_operator from public, anon, authenticated, service_role",
    "revoke all on schema recora_audit from public, anon, authenticated, service_role",
  ]) {
    assert.ok(normalizedMigrationSql.includes(required), "M02 contract is missing: " + required);
  }

  assert.doesNotMatch(
    executableMigrationSql,
    /\binsert\s+into\s+recora_operator\.(?:admin_roles|admin_capabilities|admin_role_capabilities)\b/i,
    "M02 must not seed M03 catalogs.",
  );
  assert.doesNotMatch(executableMigrationSql, /\bsecurity\s+definer\b/i);
  assert.doesNotMatch(executableMigrationSql, /\b(?:insert\s+into|update|delete\s+from)\s+(?:public|recora_admin)\./i);
  assert.doesNotMatch(executableMigrationSql, /\balter\s+table\s+recora_admin\./i);
  assert.doesNotMatch(
    executableMigrationSql,
    /\bgrant\s+(?:usage|select|insert|update|delete|execute|all)[\s\S]{0,180}\bto\s+(?:anon|authenticated|service_role)\b/i,
  );
  assert.doesNotMatch(
    executableMigrationSql,
    /scoped admin command receipt requires matching legacy operator receipt/i,
  );
  assert.match(
    normalizedMigrationSql,
    /if new\.operator_command_receipt_id is not null then/,
    "M02 must validate a supplied legacy operator receipt bridge.",
  );
  assert.doesNotMatch(executableMigrationSql, /\b(drop\s+(?:table|schema)|truncate\s+table)\b/i);
}

function verifyRepositoryBaseline(): void {
  const mode = process.env.RECORA_ADMIN_P0_BASELINE_MODE ?? "ancestor";
  assert.ok(mode === "ancestor" || mode === "exact", "Unknown M02 baseline mode: " + mode);
  const head = run("git", ["rev-parse", "HEAD"]).trim();
  const ancestor = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", expectedBaseline, "HEAD"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
  );
  assert.equal(ancestor.status, 0, "M02 baseline is not an ancestor of HEAD " + head);
  if (mode === "exact") {
    assert.equal(head, expectedBaseline);
    const approvedBaseRef = process.env.RECORA_ADMIN_P0_APPROVED_BASE_REF ?? "origin/master";
    const approvedBase = run("git", ["rev-parse", approvedBaseRef]).trim();
    assert.equal(approvedBase, expectedBaseline);
  }
}

function verifyLocalDatabase(): void {
  assert.equal(process.env.RECORA_ADMIN_P0_DB_CONTAINER, expectedContainer);
  run("docker", ["inspect", expectedContainer]);

  queryLocal([
    "do $m02_structural$",
    "declare relation_name text;",
    "begin",
    "  foreach relation_name in array array[",
    "    'recora_operator.admin_accounts',",
    "    'recora_operator.admin_identity_security_projections',",
    "    'recora_operator.admin_roles',",
    "    'recora_operator.admin_capabilities',",
    "    'recora_operator.admin_role_capabilities',",
    "    'recora_operator.admin_role_assignments',",
    "    'recora_operator.admin_scope_assignments',",
    "    'recora_audit.operator_event_scopes'",
    "  ] loop",
    "    if to_regclass(relation_name) is null then raise exception 'M02 relation missing: %', relation_name; end if;",
    "    if not exists (select 1 from pg_class where oid = to_regclass(relation_name) and relrowsecurity) then",
    "      raise exception 'M02 RLS missing: %', relation_name;",
    "    end if;",
    "    if has_table_privilege('anon', relation_name, 'SELECT')",
    "      or has_table_privilege('authenticated', relation_name, 'SELECT')",
    "      or has_table_privilege('service_role', relation_name, 'SELECT')",
    "      or has_table_privilege('service_role', relation_name, 'INSERT')",
    "      or has_table_privilege('service_role', relation_name, 'UPDATE')",
    "      or has_table_privilege('service_role', relation_name, 'DELETE') then",
    "      raise exception 'M02 protected privilege remains: %', relation_name;",
    "    end if;",
    "  end loop;",
    "  if not exists (select 1 from pg_constraint where conrelid = 'recora_private.admin_command_receipts'::regclass",
    "    and conname = 'admin_command_receipts_admin_account_fkey' and convalidated) then",
    "    raise exception 'M02 admin receipt account FK missing';",
    "  end if;",
    "  if exists (select 1 from information_schema.columns",
    "    where table_schema in ('recora_operator', 'recora_audit')",
    "      and table_name in ('admin_accounts', 'admin_identity_security_projections')",
    "      and column_name ~* '(password|secret|token|session|credential)') then",
    "    raise exception 'M02 account projection stores credential material';",
    "  end if;",
    "  if exists (select 1 from pg_proc function_row join pg_namespace namespace_row",
    "    on namespace_row.oid = function_row.pronamespace",
    "    where namespace_row.nspname in ('recora_operator', 'recora_audit', 'recora_private')",
    "      and function_row.proname like 'admin_p0_%' and function_row.prosecdef) then",
    "    raise exception 'M02 helper uses SECURITY DEFINER';",
    "  end if;",
    "end;",
    "$m02_structural$;",
  ].join("\n"));

  queryLocal([
    "do $catalog$",
    "begin",
    "  if (select count(*) from recora_operator.admin_roles) <> 0",
    "    or (select count(*) from recora_operator.admin_capabilities) <> 0",
    "    or (select count(*) from recora_operator.admin_role_capabilities) <> 0 then",
    "    raise exception 'M02 normal reset must leave M03 catalog empty';",
    "  end if;",
    "end;",
    "$catalog$;",
  ].join("\n"));

  for (const protectedRole of ["anon", "authenticated", "service_role"]) {
    queryLocal(
      ["begin;", "set local role " + protectedRole + ";", "select * from recora_operator.admin_roles;", "rollback;"].join("\n"),
      /permission denied for schema recora_operator|permission denied for table admin_roles/i,
    );
    queryLocal(
      [
        "begin;",
        "set local role " + protectedRole + ";",
        "select recora_operator.admin_p0_assert_privilege_change(gen_random_uuid(), gen_random_uuid());",
        "rollback;",
      ].join("\n"),
      /permission denied for schema recora_operator|permission denied for function admin_p0_assert_privilege_change/i,
    );
  }

  queryLocal([
    "begin;",
    "insert into recora_private.admin_command_receipts (",
    "  actor_type, admin_account_id, command_name, target_type, target_id,",
    "  idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code, audit_event_id",
    ") values (",
    "  'admin', gen_random_uuid(), 'VerifyM02CatalogEmpty', 'global', gen_random_uuid(),",
    "  'm02-catalog-empty', '" + "a".repeat(64) + "', gen_random_uuid(), gen_random_uuid(), 'denied', 'm02_not_ready', gen_random_uuid()",
    ");",
    "rollback;",
  ].join("\n"), /disabled until M02/i);

  queryLocal(fixtureSql([
    globalReceiptSql(),
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    scopedReceiptWithoutLegacyBridgeSql(),
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    scopedReceiptSql(),
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    "update recora_operator.admin_identity_security_projections",
    "set observed_at = observed_at - interval '1 second', row_version = 2",
    "where admin_account_id = '82000000-0000-4000-8000-000000000010';",
    "rollback;",
  ]), /stale identity security projection/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_accounts",
    "set status = 'suspended', suspended_at = now(), row_version = 2",
    "where id = '82000000-0000-4000-8000-000000000009';",
    "rollback;",
  ]), /LAST_PLATFORM_ADMIN_PROTECTED/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_role_assignments",
    "set status = 'revoked', revoked_at = now(), revoked_reason_code = 'fixture_revoke', row_version = 2",
    "where id = '82000000-0000-4000-8000-000000000016';",
    "rollback;",
  ]), /LAST_PLATFORM_ADMIN_PROTECTED/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_scope_assignments",
    "set status = 'revoked', revoked_at = now(), revoked_reason_code = 'fixture_revoke', row_version = 2",
    "where id = '82000000-0000-4000-8000-000000000017';",
    "rollback;",
  ]), /LAST_PLATFORM_ADMIN_PROTECTED/i);

  queryLocal(fixtureSql([
    "select recora_operator.admin_p0_assert_privilege_change(",
    "  '82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000009'",
    ");",
    "rollback;",
  ]), /SELF_PRIVILEGE_ESCALATION_FORBIDDEN/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_identity_security_projections",
    "set mfa_state = 'not_enrolled', observed_at = now() + interval '1 second', row_version = 2",
    "where admin_account_id = '82000000-0000-4000-8000-000000000010';",
    secondaryReceiptSql("m02_no_mfa", "admin.fixture.scoped", "W2", "mfa", "null"),
    "rollback;",
  ]), /requires enrolled MFA/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_accounts",
    "set status = 'suspended', suspended_at = now(), row_version = 2",
    "where id = '82000000-0000-4000-8000-000000000010';",
    secondaryReceiptSql("m02_inactive_admin", "admin.fixture.scoped", "W2", "mfa", "null"),
    "rollback;",
  ]), /requires an active admin account/i);

  queryLocal(fixtureSql([
    "update recora_operator.operator_identities",
    "set status = 'suspended'::recora_operator.operator_status",
    "where id = '82000000-0000-4000-8000-000000000008';",
    secondaryReceiptSql("m02_inactive_operator", "admin.fixture.scoped", "W2", "mfa", "null"),
    "rollback;",
  ]), /requires an active operator identity/i);

  queryLocal(fixtureSql([
    secondaryReceiptSql("m02_scope_mismatch", "admin.fixture.scoped", "W2", "mfa", "null", "82000000-0000-4000-8000-000000000002", "82000000-0000-4000-8000-000000000004"),
    "rollback;",
  ]), /role or scope is not effective/i);

  queryLocal(fixtureSql([
    secondaryReceiptSql("m02_capability_mismatch", "admin.fixture.other", "W2", "mfa", "null"),
    "rollback;",
  ]), /capability is not granted/i);

  queryLocal(fixtureSql([
    secondaryReceiptSql("m02_w3_missing", "admin.fixture.scoped", "W3", "mfa", "null"),
    "rollback;",
  ]), /fresh W3 step-up evidence/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome",
    ") values (",
    "  '82000000-0000-4000-8000-000000000028', '82000000-0000-4000-8000-000000000007',",
    "  'm02.correction', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb,",
    "  gen_random_uuid(), gen_random_uuid(), 'success'",
    ");",
    "update recora_audit.operator_events set reason = reason where id = '82000000-0000-4000-8000-000000000028';",
    "rollback;",
  ]), /append-only/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome, corrects_event_id",
    ") values (",
    "  '82000000-0000-4000-8000-000000000028', '82000000-0000-4000-8000-000000000007',",
    "  'm02.correction', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb,",
    "  gen_random_uuid(), gen_random_uuid(), 'success', '82000000-0000-4000-8000-000000000028'",
    ");",
    "rollback;",
  ]), /self-reference/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome",
    ") values (",
    "  '82000000-0000-4000-8000-000000000028', '82000000-0000-4000-8000-000000000007',",
    "  'm02.unsafe', 'global', '82000000-0000-4000-8000-000000000023', 'fixture',",
    "  jsonb_build_object('provider_payload', 'fixture'), '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success'",
    ");",
    "rollback;",
  ]), /before_summary_safe|safe/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome",
    ") values (",
    "  '82000000-0000-4000-8000-000000000029', '82000000-0000-4000-8000-000000000007',",
    "  'm02.scope', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb,",
    "  gen_random_uuid(), gen_random_uuid(), 'success'",
    ");",
    "insert into recora_audit.operator_event_scopes (audit_event_id, scope_type)",
    "values ('82000000-0000-4000-8000-000000000029', 'global');",
    "delete from recora_audit.operator_event_scopes where audit_event_id = '82000000-0000-4000-8000-000000000029';",
    "rollback;",
  ]), /append-only/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_accounts (id, email, display_name, status) values ('82000000-0000-4000-8000-000000000034', 'm02-invited@example.invalid', 'M02 Invited', 'invited');",
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_accounts (id, email, display_name, status, activated_at) values ('82000000-0000-4000-8000-000000000034', 'm02-no-identity@example.invalid', 'M02 No Identity', 'active', now());",
    "rollback;",
  ]), /active admin accounts require an active operator identity/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_accounts set status = 'suspended', suspended_at = now(), row_version = 2 where id = '82000000-0000-4000-8000-000000000010';",
    "update recora_operator.admin_accounts set status = 'deactivated', deactivated_at = now(), row_version = 3 where id = '82000000-0000-4000-8000-000000000010';",
    "update recora_operator.admin_accounts set status = 'active', activated_at = now(), row_version = 4 where id = '82000000-0000-4000-8000-000000000010';",
    "rollback;",
  ]), /deactivated admin accounts are terminal/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_accounts (id, email, display_name, status) values ('82000000-0000-4000-8000-000000000034', ' M02-PRIMARY@EXAMPLE.INVALID ', 'Duplicate email', 'invited');",
    "rollback;",
  ]), /admin_accounts_live_email_unique/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_accounts (id, email, display_name, status) values ('82000000-0000-4000-8000-000000000034', 'm02-mfa-state@example.invalid', 'M02 MFA State', 'invited');",
    "insert into recora_operator.admin_identity_security_projections (admin_account_id, mfa_state, observed_at, source_version) values ('82000000-0000-4000-8000-000000000034', 'unknown', now(), 'fixture-1');",
    "update recora_operator.admin_identity_security_projections set mfa_state = 'not_enrolled', observed_at = observed_at + interval '1 second', row_version = 2 where admin_account_id = '82000000-0000-4000-8000-000000000034';",
    "update recora_operator.admin_identity_security_projections set mfa_state = 'enrolled', observed_at = observed_at + interval '1 second', row_version = 3 where admin_account_id = '82000000-0000-4000-8000-000000000034';",
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    "update recora_operator.admin_identity_security_projections set mfa_state = 'not_enrolled', observed_at = observed_at + interval '1 second', row_version = 2 where admin_account_id = '82000000-0000-4000-8000-000000000009';",
    "rollback;",
  ]), /LAST_PLATFORM_ADMIN_PROTECTED/i);

  queryLocal(fixtureSql([
    "update recora_operator.operator_identities set status = 'suspended'::recora_operator.operator_status where id = '82000000-0000-4000-8000-000000000007';",
    "rollback;",
  ]), /LAST_PLATFORM_ADMIN_PROTECTED/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_role_assignments set status = 'revoked', revoked_at = now(), revoked_reason_code = 'fixture_revoke', row_version = 2 where id = '82000000-0000-4000-8000-000000000018';",
    "update recora_operator.admin_role_assignments set status = 'active', revoked_at = null, revoked_reason_code = null, row_version = 3 where id = '82000000-0000-4000-8000-000000000018';",
    "rollback;",
  ]), /revoked or expired role assignments are terminal/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_scope_assignments set status = 'revoked', revoked_at = now(), revoked_reason_code = 'fixture_revoke', row_version = 2 where id = '82000000-0000-4000-8000-000000000019';",
    "update recora_operator.admin_scope_assignments set status = 'active', revoked_at = null, revoked_reason_code = null, row_version = 3 where id = '82000000-0000-4000-8000-000000000019';",
    "rollback;",
  ]), /revoked or expired scope assignments are terminal/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000011', '82000000-0000-4000-8000-000000000009');",
    "rollback;",
  ]), /admin_role_assignments_active_unique/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000018', 'customer', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000009');",
    "rollback;",
  ]), /admin_scope_assignments_active_unique/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_roles (id, role_code, display_name, description) values ('82000000-0000-4000-8000-000000000034', 'shape_fixture', 'Shape fixture', 'fixture role');",
    "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000035', '82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000009');",
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000036', '82000000-0000-4000-8000-000000000035', 'global', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000009');",
    "rollback;",
  ]), /admin_scope_assignments_shape_check/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000018', 'customer', '82000000-0000-4000-8000-000000000009');",
    "rollback;",
  ]), /admin_scope_assignments_shape_check/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, project_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000018', 'project', '82000000-0000-4000-8000-000000000002', '82000000-0000-4000-8000-000000000003', '82000000-0000-4000-8000-000000000009');",
    "rollback;",
  ]), /admin_scope_assignments_project_fkey/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_roles (id, role_code, display_name, description) values ('82000000-0000-4000-8000-000000000034', 'project_fixture', 'Project fixture', 'fixture role');",
    "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000035', '82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000009');",
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, project_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000036', '82000000-0000-4000-8000-000000000035', 'project', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003', '82000000-0000-4000-8000-000000000009');",
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000018', 'global', '82000000-0000-4000-8000-000000000009');",
    "rollback;",
  ]), /global scope cannot coexist with customer or project scope/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000012', '82000000-0000-4000-8000-000000000009');",
    "set constraints all immediate;",
    "rollback;",
  ]), /active role assignments require an active scope/i);

  queryLocal(fixtureSql([
    "insert into recora_operator.admin_roles (id, role_code, display_name, description) values ('82000000-0000-4000-8000-000000000034', 'system_operator', 'System operator', 'fixture role');",
    "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000035', '82000000-0000-4000-8000-000000000010', '82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000009');",
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000036', '82000000-0000-4000-8000-000000000035', 'customer', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000009');",
    "set constraints all immediate;",
    "rollback;",
  ]), /platform_admin and system_operator require global scope/i);

  queryLocal(fixtureSql([
    "insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ('82000000-0000-4000-8000-000000000034', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm02-missing-mfa@example.invalid', 'fixture', now(), '{}'::jsonb, '{}'::jsonb, now(), now());",
    "insert into recora_operator.operator_identities (id, auth_user_id, status, display_label) values ('82000000-0000-4000-8000-000000000035', '82000000-0000-4000-8000-000000000034', 'active', 'm02-missing-mfa');",
    "insert into recora_operator.admin_accounts (id, email, display_name, status, operator_identity_id, activated_at) values ('82000000-0000-4000-8000-000000000036', 'm02-missing-mfa@example.invalid', 'M02 Missing MFA', 'active', '82000000-0000-4000-8000-000000000035', now());",
    "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000037', '82000000-0000-4000-8000-000000000036', '82000000-0000-4000-8000-000000000012', '82000000-0000-4000-8000-000000000009');",
    "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, assigned_by_admin_account_id) values ('82000000-0000-4000-8000-000000000038', '82000000-0000-4000-8000-000000000037', 'customer', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000009');",
    replaceFixtureSql(
      replaceFixtureSql(
        replaceFixtureSql(
          replaceFixtureSql(
            secondaryReceiptSql("m02_missing_mfa", "admin.fixture.scoped", "W2", "mfa", "null"),
            "'82000000-0000-4000-8000-000000000010'",
            "'82000000-0000-4000-8000-000000000036'",
          ),
          "'82000000-0000-4000-8000-000000000008'",
          "'82000000-0000-4000-8000-000000000035'",
        ),
        "'82000000-0000-4000-8000-000000000018'",
        "'82000000-0000-4000-8000-000000000037'",
      ),
      "'82000000-0000-4000-8000-000000000019'",
      "'82000000-0000-4000-8000-000000000038'",
    ),
    "rollback;",
  ]), /admin command receipt requires enrolled MFA/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_role_assignments set status = 'revoked', revoked_at = now(), revoked_reason_code = 'fixture_revoke', row_version = 2 where id = '82000000-0000-4000-8000-000000000018';",
    secondaryReceiptSql("m02_revoked_role", "admin.fixture.scoped", "W2", "mfa", "null"),
    "rollback;",
  ]), /role or scope is not effective/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_role_assignments set status = 'expired', expires_at = now() - interval '1 second', row_version = 2 where id = '82000000-0000-4000-8000-000000000018';",
    secondaryReceiptSql("m02_expired_role", "admin.fixture.scoped", "W2", "mfa", "null"),
    "rollback;",
  ]), /role or scope is not effective/i);

  queryLocal(fixtureSql([
    "update recora_operator.admin_scope_assignments set status = 'expired', expires_at = now() - interval '1 second', row_version = 2 where id = '82000000-0000-4000-8000-000000000019';",
    secondaryReceiptSql("m02_expired_scope", "admin.fixture.scoped", "W2", "mfa", "null"),
    "rollback;",
  ]), /role or scope is not effective/i);

  queryLocal(fixtureSql([
    replaceFixtureSql(
      secondaryReceiptSql("m02_audit_actor_mismatch", "admin.fixture.scoped", "W2", "mfa", "null"),
      "'82000000-0000-4000-8000-000000000008', '82000000-0000-4000-8000-000000000001'",
      "'82000000-0000-4000-8000-000000000007', '82000000-0000-4000-8000-000000000001'",
    ),
    "rollback;",
  ]), /audit authorization evidence mismatch/i);

  queryLocal(fixtureSql([
    replaceFixtureSql(
      secondaryReceiptSql("m02_audit_target_mismatch", "admin.fixture.scoped", "W2", "mfa", "null"),
      "'verifym02secondarycommand', 'project', '82000000-0000-4000-8000-000000000003', 'fixture'",
      "'verifym02secondarycommand', 'project', '82000000-0000-4000-8000-000000000004', 'fixture'",
    ),
    "rollback;",
  ]), /audit causal mismatch/i);

  queryLocal(fixtureSql([
    replaceFixtureSql(
      secondaryReceiptSql("m02_audit_request_mismatch", "admin.fixture.scoped", "W2", "mfa", "null"),
      "'82000000-0000-4000-8000-000000000031', '82000000-0000-4000-8000-000000000032', 'success', 'admin'",
      "'82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000032', 'success', 'admin'",
    ),
    "rollback;",
  ]), /audit causal mismatch/i);

  queryLocal(fixtureSql([
    replaceFixtureSql(
      secondaryReceiptSql("m02_audit_correlation_mismatch", "admin.fixture.scoped", "W2", "mfa", "null"),
      "'82000000-0000-4000-8000-000000000031', '82000000-0000-4000-8000-000000000032', 'success', 'admin'",
      "'82000000-0000-4000-8000-000000000031', '82000000-0000-4000-8000-000000000034', 'success', 'admin'",
    ),
    "rollback;",
  ]), /audit causal mismatch/i);

  queryLocal(fixtureSql([
    replaceFixtureSql(
      replaceFixtureSql(
        secondaryReceiptSql("m02_audit_outcome_mismatch", "admin.fixture.scoped", "W2", "mfa", "null"),
        "outcome,\n  actor_type, risk_class",
        "outcome, failure_reason_code,\n  actor_type, risk_class",
      ),
      "'success', 'admin', 'W2'",
      "'denied', 'm02_fixture_denied', 'admin', 'W2'",
    ),
    "rollback;",
  ]), /audit outcome mismatch/i);

  queryLocal(fixtureSql([
    replaceFixtureSql(
      secondaryReceiptSql("m02_legacy_bridge_mismatch", "admin.fixture.scoped", "W2", "mfa", "null"),
      "'82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003', 'verifym02secondarycommand', 'project'",
      "'82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003', 'wronglegacyaction', 'project'",
    ),
    "rollback;",
  ]), /legacy operator receipt mismatch/i);

  queryLocal([
    "begin;",
    "insert into recora_private.admin_command_receipts (actor_type, admin_account_id, command_name, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code) values ('system', gen_random_uuid(), 'VerifyM02System', 'global', gen_random_uuid(), 'm02-system-contamination', '" + "d".repeat(64) + "', gen_random_uuid(), gen_random_uuid(), 'accepted', 'ok');",
    "rollback;",
  ].join("\n"), /admin_command_receipts_actor_exactly_one_check/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000007', 'm02.correction.source', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success');",
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome, corrects_event_id) values ('82000000-0000-4000-8000-000000000035', '82000000-0000-4000-8000-000000000007', 'm02.correction.followup', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success', '82000000-0000-4000-8000-000000000034');",
    "set constraints all immediate;",
    "rollback;",
  ]));

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome, corrects_event_id) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000007', 'm02.cycle.first', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success', '82000000-0000-4000-8000-000000000035');",
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome, corrects_event_id) values ('82000000-0000-4000-8000-000000000035', '82000000-0000-4000-8000-000000000007', 'm02.cycle.second', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success', '82000000-0000-4000-8000-000000000034');",
    "rollback;",
  ]), /cycle/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000007', 'm02.scope.duplicate', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success');",
    "insert into recora_audit.operator_event_scopes (audit_event_id, scope_type) values ('82000000-0000-4000-8000-000000000034', 'global');",
    "insert into recora_audit.operator_event_scopes (audit_event_id, scope_type) values ('82000000-0000-4000-8000-000000000034', 'global');",
    "rollback;",
  ]), /duplicate key/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000007', 'm02.scope.project', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', '{}'::jsonb, '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success');",
    "insert into recora_audit.operator_event_scopes (audit_event_id, scope_type, organization_id, project_id) values ('82000000-0000-4000-8000-000000000034', 'project', '82000000-0000-4000-8000-000000000002', '82000000-0000-4000-8000-000000000003');",
    "rollback;",
  ]), /operator_event_scopes_project_fkey/i);

  queryLocal(fixtureSql([
    "insert into recora_audit.operator_events (id, actor_operator_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome) values ('82000000-0000-4000-8000-000000000034', '82000000-0000-4000-8000-000000000007', 'm02.unsafe.summary', 'global', '82000000-0000-4000-8000-000000000023', 'fixture', jsonb_build_object('provider_payload', 'fixture', 'raw_request', 'fixture', 'raw_response', 'fixture', 'secret', 'fixture', 'email', 'fixture@example.invalid'), '{}'::jsonb, gen_random_uuid(), gen_random_uuid(), 'success');",
    "rollback;",
  ]), /before_summary_safe|safe/i);

  queryLocal(["begin;", migrationSql, migrationSql, "rollback;"].join("\n"));
}

function fixtureSql(tail: string[]): string {
  return fixturePrelude().concat(tail).join("\n");
}

function fixturePrelude(): string[] {
  return [
  "begin;",
  "insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo) values",
  "  ('82000000-0000-4000-8000-000000000001', 'm02-fixture-one', 'M02 Fixture One', 'internal', 'demo', true, true),",
  "  ('82000000-0000-4000-8000-000000000002', 'm02-fixture-two', 'M02 Fixture Two', 'internal', 'demo', true, true);",
  "insert into public.projects (id, organization_id, slug, name, language, region) values",
  "  ('82000000-0000-4000-8000-000000000003', '82000000-0000-4000-8000-000000000001', 'm02-project-one', 'M02 Project One', 'ja', 'JP'),",
  "  ('82000000-0000-4000-8000-000000000004', '82000000-0000-4000-8000-000000000002', 'm02-project-two', 'M02 Project Two', 'ja', 'JP');",
  "insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values",
  "  ('82000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm02-primary@example.invalid', 'fixture', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),",
  "  ('82000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm02-secondary@example.invalid', 'fixture', now(), '{}'::jsonb, '{}'::jsonb, now(), now());",
  "insert into recora_operator.operator_identities (id, auth_user_id, status, display_label) values",
  "  ('82000000-0000-4000-8000-000000000007', '82000000-0000-4000-8000-000000000005', 'active', 'm02-primary'),",
  "  ('82000000-0000-4000-8000-000000000008', '82000000-0000-4000-8000-000000000006', 'active', 'm02-secondary');",
  "insert into recora_operator.admin_accounts (id, email, display_name, status, operator_identity_id, activated_at) values",
  "  ('82000000-0000-4000-8000-000000000009', 'm02-primary@example.invalid', 'M02 Primary', 'active', '82000000-0000-4000-8000-000000000007', now()),",
  "  ('82000000-0000-4000-8000-000000000010', 'm02-secondary@example.invalid', 'M02 Secondary', 'active', '82000000-0000-4000-8000-000000000008', now());",
  "insert into recora_operator.admin_identity_security_projections (admin_account_id, mfa_state, observed_at, source_version) values",
  "  ('82000000-0000-4000-8000-000000000009', 'enrolled', now(), 'fixture-1'),",
  "  ('82000000-0000-4000-8000-000000000010', 'enrolled', now(), 'fixture-1');",
  "insert into recora_operator.admin_roles (id, role_code, display_name, description, is_system_defined, is_editable) values",
  "  ('82000000-0000-4000-8000-000000000011', 'platform_admin', 'Platform admin', 'fixture role', true, false),",
  "  ('82000000-0000-4000-8000-000000000012', 'scoped_operator', 'Scoped operator', 'fixture role', true, false);",
  "insert into recora_operator.admin_capabilities (id, capability_code, domain_code, sensitivity) values",
  "  ('82000000-0000-4000-8000-000000000013', 'admin.fixture.execute', 'admin', 'W2'),",
  "  ('82000000-0000-4000-8000-000000000014', 'admin.fixture.scoped', 'admin', 'W2'),",
  "  ('82000000-0000-4000-8000-000000000015', 'admin.fixture.other', 'admin', 'W2');",
  "insert into recora_operator.admin_role_capabilities (role_id, capability_id) values",
  "  ('82000000-0000-4000-8000-000000000011', '82000000-0000-4000-8000-000000000013'),",
  "  ('82000000-0000-4000-8000-000000000012', '82000000-0000-4000-8000-000000000014');",
  "insert into recora_operator.admin_role_assignments (id, admin_account_id, role_id, assigned_by_admin_account_id) values",
  "  ('82000000-0000-4000-8000-000000000016', '82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000011', '82000000-0000-4000-8000-000000000009'),",
  "  ('82000000-0000-4000-8000-000000000018', '82000000-0000-4000-8000-000000000010', '82000000-0000-4000-8000-000000000012', '82000000-0000-4000-8000-000000000009');",
  "insert into recora_operator.admin_scope_assignments (id, role_assignment_id, scope_type, organization_id, assigned_by_admin_account_id) values",
  "  ('82000000-0000-4000-8000-000000000017', '82000000-0000-4000-8000-000000000016', 'global', null, '82000000-0000-4000-8000-000000000009'),",
  "  ('82000000-0000-4000-8000-000000000019', '82000000-0000-4000-8000-000000000018', 'customer', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000009');",
  ];
}

function globalReceiptSql(): string {
  return [
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, action, target_type, target_id, permission_used, reason, before_summary, after_summary, request_id, correlation_id, outcome,",
    "  actor_type, risk_class, operation_outcome, idempotency_key, admin_account_id, capability_code, role_assignment_id, scope_assignment_id, auth_assurance, step_up_verified",
    ") values (",
    "  '82000000-0000-4000-8000-000000000020', '82000000-0000-4000-8000-000000000007', 'verifym02globalcommand', 'global', '82000000-0000-4000-8000-000000000023',",
    "  'admin.fixture.execute', 'fixture', '{}'::jsonb, '{}'::jsonb, '82000000-0000-4000-8000-000000000024', '82000000-0000-4000-8000-000000000025', 'success',",
    "  'admin', 'W3', 'accepted', 'm02-global-key', '82000000-0000-4000-8000-000000000009', 'admin.fixture.execute',",
    "  '82000000-0000-4000-8000-000000000016', '82000000-0000-4000-8000-000000000017', 'step_up', now()",
    ");",
    "insert into recora_private.admin_command_receipts (",
    "  actor_type, admin_account_id, command_name, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code, audit_event_id",
    ") values (",
    "  'admin', '82000000-0000-4000-8000-000000000009', 'VerifyM02GlobalCommand', 'global', '82000000-0000-4000-8000-000000000023',",
    "  'm02-global-key', '" + "a".repeat(64) + "', '82000000-0000-4000-8000-000000000024', '82000000-0000-4000-8000-000000000025', 'accepted', 'ok', '82000000-0000-4000-8000-000000000020'",
    ");",
  ].join("\n");
}

function scopedReceiptSql(): string {
  return [
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, organization_id, project_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome,",
    "  actor_type, risk_class, operation_outcome, idempotency_key, admin_account_id, capability_code, role_assignment_id, scope_assignment_id, auth_assurance",
    ") values (",
    "  '82000000-0000-4000-8000-000000000021', '82000000-0000-4000-8000-000000000007', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003',",
    "  'verifym02scopedcommand', 'project', '82000000-0000-4000-8000-000000000003', 'fixture', '{}'::jsonb, '{}'::jsonb,",
    "  '82000000-0000-4000-8000-000000000026', '82000000-0000-4000-8000-000000000027', 'success', 'admin', 'W2', 'accepted', 'm02-scoped-key',",
    "  '82000000-0000-4000-8000-000000000009', 'admin.fixture.execute', '82000000-0000-4000-8000-000000000016', '82000000-0000-4000-8000-000000000017', 'mfa'",
    ");",
    "insert into recora_operator.operator_command_receipts (id, audit_event_id, operator_id, organization_id, project_id, action, target_type, target_id, request_id, correlation_id) values (",
    "  '82000000-0000-4000-8000-000000000022', '82000000-0000-4000-8000-000000000021', '82000000-0000-4000-8000-000000000007',",
    "  '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003', 'verifym02scopedcommand', 'project', '82000000-0000-4000-8000-000000000003',",
    "  '82000000-0000-4000-8000-000000000026', '82000000-0000-4000-8000-000000000027'",
    ");",
    "insert into recora_private.admin_command_receipts (",
    "  actor_type, admin_account_id, command_name, organization_id, project_id, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code, audit_event_id, operator_command_receipt_id",
    ") values (",
    "  'admin', '82000000-0000-4000-8000-000000000009', 'VerifyM02ScopedCommand', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003',",
    "  'project', '82000000-0000-4000-8000-000000000003', 'm02-scoped-key', '" + "b".repeat(64) + "', '82000000-0000-4000-8000-000000000026',",
    "  '82000000-0000-4000-8000-000000000027', 'accepted', 'ok', '82000000-0000-4000-8000-000000000021', '82000000-0000-4000-8000-000000000022'",
    ");",
  ].join("\n");
}

function scopedReceiptWithoutLegacyBridgeSql(): string {
  return [
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, organization_id, project_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome,",
    "  actor_type, risk_class, operation_outcome, idempotency_key, admin_account_id, capability_code, role_assignment_id, scope_assignment_id, auth_assurance",
    ") values (",
    "  '82000000-0000-4000-8000-000000000021', '82000000-0000-4000-8000-000000000007', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003',",
    "  'verifym02scopedcommand', 'project', '82000000-0000-4000-8000-000000000003', 'fixture', '{}'::jsonb, '{}'::jsonb,",
    "  '82000000-0000-4000-8000-000000000026', '82000000-0000-4000-8000-000000000027', 'success', 'admin', 'W2', 'accepted', 'm02-scoped-key',",
    "  '82000000-0000-4000-8000-000000000009', 'admin.fixture.execute', '82000000-0000-4000-8000-000000000016', '82000000-0000-4000-8000-000000000017', 'mfa'",
    ");",
    "insert into recora_private.admin_command_receipts (",
    "  actor_type, admin_account_id, command_name, organization_id, project_id, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code, audit_event_id",
    ") values (",
    "  'admin', '82000000-0000-4000-8000-000000000009', 'VerifyM02ScopedCommand', '82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000003',",
    "  'project', '82000000-0000-4000-8000-000000000003', 'm02-scoped-key', '" + "b".repeat(64) + "', '82000000-0000-4000-8000-000000000026',",
    "  '82000000-0000-4000-8000-000000000027', 'accepted', 'ok', '82000000-0000-4000-8000-000000000021'",
    ");",
  ].join("\n");
}

function secondaryReceiptSql(
  key: string,
  capability: string,
  risk: string,
  assurance: string,
  stepUp: string,
  organizationId = "82000000-0000-4000-8000-000000000001",
  projectId = "82000000-0000-4000-8000-000000000003",
): string {
  return [
    "insert into recora_audit.operator_events (",
    "  id, actor_operator_id, organization_id, project_id, action, target_type, target_id, reason, before_summary, after_summary, request_id, correlation_id, outcome,",
    "  actor_type, risk_class, operation_outcome, idempotency_key, admin_account_id, capability_code, role_assignment_id, scope_assignment_id, auth_assurance, step_up_verified",
    ") values (",
    "  '82000000-0000-4000-8000-000000000030', '82000000-0000-4000-8000-000000000008', '" + organizationId + "', '" + projectId + "',",
    "  'verifym02secondarycommand', 'project', '" + projectId + "', 'fixture', '{}'::jsonb, '{}'::jsonb,",
    "  '82000000-0000-4000-8000-000000000031', '82000000-0000-4000-8000-000000000032', 'success', 'admin', '" + risk + "', 'accepted', '" + key + "',",
    "  '82000000-0000-4000-8000-000000000010', '" + capability + "', '82000000-0000-4000-8000-000000000018',",
    "  '82000000-0000-4000-8000-000000000019', '" + assurance + "', " + stepUp,
    ");",
    "insert into recora_operator.operator_command_receipts (id, audit_event_id, operator_id, organization_id, project_id, action, target_type, target_id, request_id, correlation_id) values (",
    "  '82000000-0000-4000-8000-000000000033', '82000000-0000-4000-8000-000000000030', '82000000-0000-4000-8000-000000000008',",
    "  '" + organizationId + "', '" + projectId + "', 'verifym02secondarycommand', 'project', '" + projectId + "',",
    "  '82000000-0000-4000-8000-000000000031', '82000000-0000-4000-8000-000000000032'",
    ");",
    "insert into recora_private.admin_command_receipts (",
    "  actor_type, admin_account_id, command_name, organization_id, project_id, target_type, target_id, idempotency_key, request_fingerprint, request_id, correlation_id, outcome, stable_reason_code, audit_event_id, operator_command_receipt_id",
    ") values (",
    "  'admin', '82000000-0000-4000-8000-000000000010', 'VerifyM02SecondaryCommand', '" + organizationId + "', '" + projectId + "',",
    "  'project', '" + projectId + "', '" + key + "', '" + "c".repeat(64) + "', '82000000-0000-4000-8000-000000000031',",
    "  '82000000-0000-4000-8000-000000000032', 'accepted', 'ok', '82000000-0000-4000-8000-000000000030', '82000000-0000-4000-8000-000000000033'",
    ");",
  ].join("\n");
}

function replaceFixtureSql(sql: string, source: string, replacement: string): string {
  assert.ok(sql.includes(source), "Fixture SQL replacement source missing.");
  return sql.replaceAll(source, replacement);
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

function toRepoPath(value: string): string {
  return value.split(path.sep).join("/");
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertGitTracked(repoPath: string): void {
  assert.ok(gitSucceeds(["ls-files", "--error-unmatch", "--", repoPath]));
}

function assertGitClean(repoPath: string, message: string): void {
  assert.ok(gitSucceeds(["diff", "--quiet", "--", repoPath]), message);
  assert.ok(gitSucceeds(["diff", "--cached", "--quiet", "--", repoPath]), message);
}

function gitSucceeds(args: string[]): boolean {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error("git failed: " + sanitize((result.stdout ?? "") + "\n" + (result.stderr ?? "")));
}

function readHeadBlob(repoPath: string): Buffer {
  const result = spawnSync("git", ["cat-file", "blob", "HEAD:" + repoPath], {
    cwd: repoRoot,
    encoding: null,
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0);
  return result.stdout;
}

function sanitize(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-db-url]")
    .replace(/(?:sk|sbp|eyJ)[A-Za-z0-9._-]{12,}/g, "[redacted-token]");
}
