import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const expectedImplementationBaseline = "49fd9007a4e93f80285660cf1f9e98c115d60a30";
const expectedM00PinnedRepositoryBaseline = "2c2a6fba70b75e858abc71a7447840bf32f3507d";
const expectedSchemaVersion = "recora_admin_p0_design_v1_3";
const expectedCanonicalManifestSha256 = "f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a";
const expectedPhysicalManifestSha256 = "d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a";
const expectedM00Stem = "recora_admin_p0_00_baseline_contract";
const expectedM01Stem = "recora_admin_p0_01_common_infrastructure";
const expectedDbContainer = "supabase_db_recora-admin-p0-m01";

const canonicalManifestPath = path.join(
  repoRoot,
  "docs",
  "architecture",
  "recora-admin-p0",
  "canonical",
  "recora_admin_p0_canonical_manifest_v1.json",
);
const physicalManifestPath = path.join(
  repoRoot,
  "docs",
  "architecture",
  "recora-admin-p0",
  "database",
  "recora_admin_p0_physical_schema_manifest_v1_3.json",
);
const migrationDirectory = path.join(repoRoot, "supabase", "migrations");
const canonicalManifestRepoPath = toRepoPath(path.relative(repoRoot, canonicalManifestPath));
const physicalManifestRepoPath = toRepoPath(path.relative(repoRoot, physicalManifestPath));

assertGitTracked(canonicalManifestRepoPath);
assertGitTracked(physicalManifestRepoPath);
assertGitClean(canonicalManifestRepoPath, "Canonical manifest must be unchanged and unstaged.");
assertGitClean(physicalManifestRepoPath, "Physical schema manifest must be unchanged and unstaged.");

const canonicalBytes = readHeadBlob(canonicalManifestRepoPath);
const physicalBytes = readHeadBlob(physicalManifestRepoPath);
assert.equal(sha256(canonicalBytes), expectedCanonicalManifestSha256);
assert.equal(sha256(physicalBytes), expectedPhysicalManifestSha256);

const physicalManifest = JSON.parse(physicalBytes.toString("utf8")) as {
  version?: unknown;
  repository_baseline?: { commit?: unknown };
  migrations?: Array<{
    sequence?: unknown;
    migration_stem?: unknown;
    depends_on?: unknown;
    creates?: unknown;
  }>;
};
assert.equal(physicalManifest.version, "1.3");
assert.equal(
  physicalManifest.repository_baseline?.commit,
  expectedM00PinnedRepositoryBaseline,
  "The physical manifest intentionally retains the M00-reviewed repository evidence baseline.",
);
const physicalMigrations = physicalManifest.migrations;
assert.ok(Array.isArray(physicalMigrations));
if (!Array.isArray(physicalMigrations)) throw new Error("Physical manifest migrations are required.");
assert.equal(physicalMigrations[0]?.migration_stem, expectedM00Stem);
assert.equal(physicalMigrations[1]?.migration_stem, expectedM01Stem);
assert.deepEqual(physicalMigrations[1]?.depends_on, [0]);
assert.deepEqual(physicalMigrations[1]?.creates, [
  "recora_private.admin_command_receipts",
  "recora_private.admin_outbox_messages",
  "recora_private.admin_read_refreshes",
  "admin_read schema",
]);

const m00MigrationPath = findMigration(expectedM00Stem);
const m01MigrationPath = findMigration(expectedM01Stem);
assert.ok(
  migrationTimestamp(m00MigrationPath) < migrationTimestamp(m01MigrationPath),
  "M01 migration must sort after M00.",
);

const migrationSql = fs.readFileSync(m01MigrationPath, "utf8");
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
  baseline: {
    implementationRepositoryCommit: expectedImplementationBaseline,
    m00PinnedRepositoryCommit: expectedM00PinnedRepositoryBaseline,
    schemaVersion: expectedSchemaVersion,
    canonicalManifestSha256: expectedCanonicalManifestSha256,
    physicalManifestSha256: expectedPhysicalManifestSha256,
  },
  migrations: {
    m00: relative(m00MigrationPath),
    m01: relative(m01MigrationPath),
  },
  checkedCases: {
    manifestsPinned: true,
    migrationOrderValidated: true,
    m00GateValidated: true,
    privateSchemaBoundaryValidated: !staticOnly,
    commandReceiptReplayAndConflictValidated: !staticOnly,
    commandReceiptAppendOnlyValidated: !staticOnly,
    outboxPayloadAndTransitionsValidated: !staticOnly,
    outboxPhoneLikeReferenceRejected: !staticOnly,
    readRefreshTransitionsValidated: !staticOnly,
    migrationReplayValidated: !staticOnly,
    trackedManifestGitBlobsValidated: true,
    m00RegressionCompatibilityValidated: true,
    postDdlColumnConstraintTriggerContractValidated: !staticOnly,
    privateHelpersSecurityInvokerValidated: !staticOnly,
    privateHelperRoleExecutionDenied: !staticOnly,
  },
}, null, 2));

function verifyMigrationSource(): void {
  assertPostgresIdentifierLengths(executableMigrationSql);
  const inventoryIndex = normalizedMigrationSql.indexOf("do $admin_p0_m01_inventory$");
  const firstWriteIndex = normalizedMigrationSql.indexOf("create schema if not exists admin_read");
  assert.ok(inventoryIndex >= 0, "M01 inventory block is required.");
  assert.ok(firstWriteIndex > inventoryIndex, "M01 inventory must precede persistent DDL.");

  assert.ok(normalizedMigrationSql.includes(expectedSchemaVersion));
  assert.ok(normalizedMigrationSql.includes(expectedCanonicalManifestSha256));
  assert.ok(normalizedMigrationSql.includes(expectedPhysicalManifestSha256));
  assert.match(normalizedMigrationSql, /create schema if not exists admin_read/);

  const createdTables = Array.from(
    normalizedMigrationSql.matchAll(/create table if not exists ([a-z0-9_.]+)/g),
  ).map((match: RegExpMatchArray) => match[1]);
  assert.deepEqual(createdTables, [
    "recora_private.admin_command_receipts",
    "recora_private.admin_outbox_messages",
    "recora_private.admin_read_refreshes",
  ]);

  for (const required of [
    "request_fingerprint text not null",
    "admin_command_receipts_actor_scope_idempotency_unique",
    "admin_p0_resolve_command_receipt_replay",
    "idempotency_conflict",
    "p0 admin command receipt insertion is disabled until m02 authorization convergence",
    "admin_outbox_messages requires an accepted asynchronous command receipt",
    "recora_audit.is_safe_audit_summary(payload_reference)",
    "admin_outbox_messages_validate_transition",
    "admin_read_refreshes_one_running_per_model_unique",
    "admin_read_refreshes_validate_transition",
    "admin_command_receipts_denied_failed_no_success_receipt_check",
  ]) {
    assert.ok(normalizedMigrationSql.includes(required), `M01 contract is missing: ${required}`);
  }

  assert.match(
    normalizedMigrationSql,
    /request_fingerprint ~ '\^\[0-9a-f\]\{64\}\$'/,
  );
  assert.match(
    normalizedMigrationSql,
    /revoke all on schema admin_read from public, anon, authenticated, service_role/,
  );
  for (const table of [
    "admin_command_receipts",
    "admin_outbox_messages",
    "admin_read_refreshes",
  ]) {
    assert.match(
      normalizedMigrationSql,
      new RegExp(`alter table recora_private\\.${table} enable row level security`),
    );
    assert.match(
      normalizedMigrationSql,
      new RegExp(`revoke all on table recora_private\\.${table} from public, anon, authenticated, service_role`),
    );
  }

  assert.doesNotMatch(
    executableMigrationSql,
    /\b(?:insert\s+into|update|delete\s+from)\s+(?:public|recora_admin)\./i,
    "M01 must not convert public or legacy operational rows.",
  );
  assert.doesNotMatch(
    executableMigrationSql,
    /\balter\s+table\s+(?:public|recora_admin)\./i,
    "M01 must not alter public or legacy tables.",
  );
  assert.doesNotMatch(
    executableMigrationSql,
    /\bgrant\s+(?:usage|select|insert|update|delete|execute|all)[\s\S]{0,180}\bto\s+(?:anon|authenticated|service_role)\b/i,
    "M01 must not grant direct browser or service-role access.",
  );
  assert.doesNotMatch(
    executableMigrationSql,
    /\bsecurity\s+definer\b/i,
    "M01 helpers must remain SECURITY INVOKER and private.",
  );
  assert.match(
    normalizedMigrationSql,
    /aclexplode\( coalesce\(function_row\.proacl, acldefault\('f', function_row\.proowner\)\) \)/,
    "M01 post-DDL verification must inspect explicit function ACLs.",
  );
  assert.doesNotMatch(
    normalizedMigrationSql,
    /has_function_privilege\(/,
    "M01 must not use effective privilege checks that misclassify protected local roles.",
  );
  assert.doesNotMatch(executableMigrationSql, /\b(drop\s+(?:table|schema)|truncate\s+table)\b/i);
}

function assertPostgresIdentifierLengths(sql: string): void {
  const identifierPatterns = [
    /\bconstraint\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+(?:unique\s+)?index(?:\s+if\s+not\s+exists)?\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+trigger\s+([a-z_][a-z0-9_]*)/gi,
    /\bcreate\s+or\s+replace\s+function\s+(?:[a-z_][a-z0-9_]*\.)?([a-z_][a-z0-9_]*)/gi,
  ];

  const oversized: string[] = [];
  for (const pattern of identifierPatterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sql)) !== null) {
      const identifier = match[1];
      if (identifier && Buffer.byteLength(identifier, "utf8") > 63) {
        oversized.push(identifier);
      }
    }
  }

  assert.deepEqual(
    oversized,
    [],
    `PostgreSQL identifiers must be 63 bytes or fewer: ${oversized.join(", ")}`,
  );
}

function verifyRepositoryBaseline(): void {
  const mode = process.env.RECORA_ADMIN_P0_BASELINE_MODE ?? "ancestor";
  assert.ok(
    mode === "ancestor" || mode === "exact",
    "RECORA_ADMIN_P0_BASELINE_MODE must be ancestor or exact.",
  );

  const head = run("git", ["rev-parse", "HEAD"]).trim();
  const originMaster = run("git", ["rev-parse", "origin/master"]).trim();
  assert.match(head, /^[0-9a-f]{40}$/);
  assert.equal(
    originMaster,
    expectedImplementationBaseline,
    "origin/master changed after the approved M01 rebase review.",
  );

  const ancestor = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", expectedImplementationBaseline, "HEAD"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
  );
  assert.equal(
    ancestor.status,
    0,
    `Approved M01 baseline ${expectedImplementationBaseline} is not an ancestor of HEAD ${head}.`,
  );

  if (mode === "exact") {
    assert.equal(
      head,
      expectedImplementationBaseline,
      "Exact baseline mode must run before the M01 implementation commit is created.",
    );
  }
}

function verifyLocalDatabase(): void {
  assert.equal(
    process.env.RECORA_ADMIN_P0_DB_CONTAINER,
    expectedDbContainer,
    `Set RECORA_ADMIN_P0_DB_CONTAINER=${expectedDbContainer}; no other database is accepted.`,
  );
  run("docker", ["inspect", expectedDbContainer]);

  queryLocal(`
do $verify$
declare
  relation_name text;
begin
  if current_database() <> 'postgres' then
    raise exception 'M01 verifier refused unexpected database %', current_database();
  end if;

  if not exists (
    select 1 from recora_private.admin_p0_schema_versions
    where schema_version = '${expectedSchemaVersion}'
      and canonical_manifest_sha256 = '${expectedCanonicalManifestSha256}'
      and repository_baseline_commit = '${expectedM00PinnedRepositoryBaseline}'
      and migration_set_digest = '${expectedPhysicalManifestSha256}'
  ) then
    raise exception 'M01 verifier requires the approved M00 schema pin';
  end if;

  foreach relation_name in array array[
    'recora_private.admin_command_receipts',
    'recora_private.admin_outbox_messages',
    'recora_private.admin_read_refreshes'
  ] loop
    if to_regclass(relation_name) is null then
      raise exception 'M01 relation missing: %', relation_name;
    end if;
    if not exists (
      select 1 from pg_class where oid = to_regclass(relation_name) and relrowsecurity
    ) then
      raise exception 'M01 RLS missing: %', relation_name;
    end if;
    if has_table_privilege('anon', relation_name, 'SELECT')
      or has_table_privilege('authenticated', relation_name, 'SELECT')
      or has_table_privilege('service_role', relation_name, 'SELECT')
      or has_table_privilege('service_role', relation_name, 'INSERT')
      or has_table_privilege('service_role', relation_name, 'UPDATE')
      or has_table_privilege('service_role', relation_name, 'DELETE') then
      raise exception 'M01 direct role privilege remains: %', relation_name;
    end if;
  end loop;

  if has_schema_privilege('anon', 'admin_read', 'USAGE')
    or has_schema_privilege('authenticated', 'admin_read', 'USAGE')
    or has_schema_privilege('service_role', 'admin_read', 'USAGE') then
    raise exception 'M01 admin_read schema is directly accessible';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = any(array[
        'admin_p0_resolve_command_receipt_replay',
        'admin_p0_validate_command_receipt_insert',
        'admin_p0_validate_outbox_transition',
        'admin_p0_validate_read_refresh_transition'
      ])
      and function_row.prosecdef is true
  ) then
    raise exception 'M01 private helper function has prosecdef enabled';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    cross join lateral aclexplode(
      coalesce(function_row.proacl, acldefault('f', function_row.proowner))
    ) privilege_row
    left join pg_roles granted_role on granted_role.oid = privilege_row.grantee
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = any(array[
        'admin_p0_resolve_command_receipt_replay',
        'admin_p0_validate_command_receipt_insert',
        'admin_p0_validate_outbox_transition',
        'admin_p0_validate_read_refresh_transition'
      ])
      and privilege_row.privilege_type = 'EXECUTE'
      and (
        privilege_row.grantee = 0
        or exists (
          select 1
          from pg_roles protected_role
          where protected_role.rolname = any(array['anon', 'authenticated', 'service_role'])
            and granted_role.oid is not null
            and (
              protected_role.oid = granted_role.oid
              or pg_has_role(protected_role.oid, granted_role.oid, 'USAGE')
            )
        )
      )
  ) then
    raise exception 'M01 private helper function has an executable ACL grant for a protected role';
  end if;
end;
$verify$;
`);

  const fixtureIds = {
    receipt: "71000000-0000-4000-8000-000000000001",
    outbox: "71000000-0000-4000-8000-000000000002",
    aggregate: "71000000-0000-4000-8000-000000000003",
    refresh: "71000000-0000-4000-8000-000000000004",
    request: "71000000-0000-4000-8000-000000000005",
    correlation: "71000000-0000-4000-8000-000000000006",
  };
  const fingerprintA = "a".repeat(64);
  const fingerprintB = "b".repeat(64);

  for (const protectedRole of ["anon", "authenticated", "service_role"] as const) {
    queryLocal(`
begin;
set local role ${protectedRole};
select *
from recora_private.admin_p0_resolve_command_receipt_replay(
  'system', null, 'm01.verifier', null, null,
  'VerifyM01RoleBoundary', 'm01-role-boundary', '${fingerprintA}'
);
rollback;
`, /permission denied for (schema recora_private|function admin_p0_resolve_command_receipt_replay)/i);
  }

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01SystemCommand', 'global',
  'm01-verifier-idempotency', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);

do $receipt_assert$
declare
  result_row record;
begin
  select * into result_row
  from recora_private.admin_p0_resolve_command_receipt_replay(
    'system', null, 'm01.verifier', null, null,
    'VerifyM01SystemCommand', 'm01-verifier-idempotency', '${fingerprintA}'
  );
  if result_row.receipt_id is distinct from '${fixtureIds.receipt}'::uuid
    or result_row.replayable is not true
    or result_row.reason_code <> 'idempotent_replay' then
    raise exception 'M01 matching fingerprint replay failed';
  end if;

  select * into result_row
  from recora_private.admin_p0_resolve_command_receipt_replay(
    'system', null, 'm01.verifier', null, null,
    'VerifyM01SystemCommand', 'm01-verifier-idempotency', '${fingerprintB}'
  );
  if result_row.replayable is not false or result_row.reason_code <> 'idempotency_conflict' then
    raise exception 'M01 fingerprint conflict was not rejected';
  end if;
end;
$receipt_assert$;

insert into recora_private.admin_outbox_messages (
  id, command_receipt_id, message_type, aggregate_type, aggregate_id,
  payload_reference
) values (
  '${fixtureIds.outbox}', '${fixtureIds.receipt}', 'measurement.requested',
  'measurement_cycle', '${fixtureIds.aggregate}',
  jsonb_build_object('reference_code', 'm01_cycle_fixture', 'operation_code', 'verify_m01')
);

update recora_private.admin_outbox_messages
set status = 'processing', locked_at = now(), attempt_count = 1, row_version = 2
where id = '${fixtureIds.outbox}';

update recora_private.admin_outbox_messages
set status = 'delivered', delivered_at = now(), row_version = 3
where id = '${fixtureIds.outbox}';

insert into recora_private.admin_read_refreshes (
  id, read_model_code, source_watermark, correlation_id
) values (
  '${fixtureIds.refresh}', 'UsageCostDailySummary',
  jsonb_build_object('watermark_code', 'm01_fixture'), '${fixtureIds.correlation}'
);

update recora_private.admin_read_refreshes
set status = 'completed', completed_at = now(), row_count = 0, row_version = 2
where id = '${fixtureIds.refresh}';

rollback;
`);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  'system', 'm01.verifier', 'VerifyM01Duplicate', 'global',
  'duplicate-key', '${fingerprintA}', gen_random_uuid(), gen_random_uuid(), 'accepted', 'ok'
);
insert into recora_private.admin_command_receipts (
  actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  'system', 'm01.verifier', 'VerifyM01Duplicate', 'global',
  'duplicate-key', '${fingerprintA}', gen_random_uuid(), gen_random_uuid(), 'accepted', 'ok'
);
rollback;
`, /admin_command_receipts_actor_scope_idempotency_unique|duplicate key/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01Immutable', 'global',
  'immutable-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
update recora_private.admin_command_receipts
set stable_reason_code = stable_reason_code
where id = '${fixtureIds.receipt}';
rollback;
`, /append-only/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01UnsafePayload', 'global',
  'unsafe-payload-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  command_receipt_id, message_type, aggregate_type, aggregate_id, payload_reference
) values (
  '${fixtureIds.receipt}', 'measurement.requested', 'measurement_cycle', '${fixtureIds.aggregate}',
  jsonb_build_object('provider_payload', 'raw-response')
);
rollback;
`, /payload|check constraint|safe/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01PhoneLikeReference', 'global',
  'phone-like-reference-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  command_receipt_id, message_type, aggregate_type, aggregate_id, payload_reference
) values (
  '${fixtureIds.receipt}', 'measurement.requested', 'measurement_cycle', '${fixtureIds.aggregate}',
  jsonb_build_object('reference_code', '${fixtureIds.aggregate}')
);
rollback;
`, /payload|check constraint|safe/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01BadTransition', 'global',
  'bad-transition-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  id, command_receipt_id, message_type, aggregate_type, aggregate_id, payload_reference
) values (
  '${fixtureIds.outbox}', '${fixtureIds.receipt}', 'measurement.requested',
  'measurement_cycle', '${fixtureIds.aggregate}', '{}'::jsonb
);
update recora_private.admin_outbox_messages
set status = 'delivered', delivered_at = now(), row_version = 2
where id = '${fixtureIds.outbox}';
rollback;
`, /transition is not allowed/i);

  queryLocal(`
begin;
insert into recora_private.admin_read_refreshes (
  id, read_model_code, source_watermark, correlation_id
) values (
  '${fixtureIds.refresh}', 'UsageCostDailySummary', '{}'::jsonb, '${fixtureIds.correlation}'
);
insert into recora_private.admin_read_refreshes (
  read_model_code, source_watermark, correlation_id
) values (
  'UsageCostDailySummary', '{}'::jsonb, gen_random_uuid()
);
rollback;
`, /admin_read_refreshes_one_running_per_model_unique|duplicate key/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  actor_type, admin_account_id, command_name, target_type, target_id,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code, audit_event_id
) values (
  'admin', gen_random_uuid(), 'VerifyM01AdminDisabled', 'admin_account', gen_random_uuid(),
  'admin-disabled-key', '${fingerprintA}', gen_random_uuid(), gen_random_uuid(),
  'denied', 'm02_not_ready', gen_random_uuid()
);
rollback;
`, /disabled until M02/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01DeniedOutbox', 'global',
  'denied-outbox-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'denied', 'scope_denied'
);
insert into recora_private.admin_outbox_messages (
  command_receipt_id, message_type, aggregate_type, aggregate_id, payload_reference
) values (
  '${fixtureIds.receipt}', 'measurement.requested', 'measurement_cycle', '${fixtureIds.aggregate}', '{}'::jsonb
);
rollback;
`, /requires an accepted asynchronous command receipt/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01InitialOutboxError', 'global',
  'initial-error-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  command_receipt_id, message_type, aggregate_type, aggregate_id,
  payload_reference, last_error_code
) values (
  '${fixtureIds.receipt}', 'measurement.requested', 'measurement_cycle', '${fixtureIds.aggregate}',
  '{}'::jsonb, 'unexpected_initial_error'
);
rollback;
`, /must be inserted as a new pending row|check constraint/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01DeleteReceipt', 'global',
  'delete-receipt-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
delete from recora_private.admin_command_receipts where id = '${fixtureIds.receipt}';
rollback;
`, /append-only/i);

  queryLocal(`
begin;
insert into recora_private.admin_read_refreshes (
  id, read_model_code, source_watermark, correlation_id
) values (
  '${fixtureIds.refresh}', 'UsageCostDailySummary', '{}'::jsonb, '${fixtureIds.correlation}'
);
update recora_private.admin_read_refreshes
set status = 'completed', completed_at = now(), row_count = 0, row_version = 2
where id = '${fixtureIds.refresh}';
update recora_private.admin_read_refreshes
set row_count = 1, row_version = 3
where id = '${fixtureIds.refresh}';
rollback;
`, /terminal row is immutable/i);

  queryLocal(`
begin;
insert into recora_private.admin_read_refreshes (
  read_model_code, status, source_watermark, completed_at, row_count,
  row_version, correlation_id
) values (
  'UsageCostDailySummary', 'completed', '{}'::jsonb, now(), 0, 1, gen_random_uuid()
);
rollback;
`, /must be inserted as a new running row|check constraint/i);

  queryLocal(`
begin;
insert into public.organizations (
  id, slug, name, organization_type, data_environment, is_internal, is_demo
) values (
  '72000000-0000-4000-8000-000000000001', 'm01-scope-fixture', 'M01 Scope Fixture',
  'internal', 'demo', true, true
);
insert into public.projects (
  id, organization_id, slug, name, language, region
) values (
  '72000000-0000-4000-8000-000000000002', '72000000-0000-4000-8000-000000000001',
  'm01-scope-project', 'M01 Scope Project', 'ja', 'JP'
);
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, organization_id, project_id,
  target_type, target_id, idempotency_key, request_fingerprint,
  request_id, correlation_id, outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01ScopeMismatch',
  '72000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000002',
  'project', '72000000-0000-4000-8000-000000000002', 'scope-mismatch-key', '${fingerprintA}',
  '${fixtureIds.request}', '${fixtureIds.correlation}', 'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  command_receipt_id, message_type, organization_id, aggregate_type, aggregate_id, payload_reference
) values (
  '${fixtureIds.receipt}', 'measurement.requested', '72000000-0000-4000-8000-000000000001',
  'measurement_cycle', '${fixtureIds.aggregate}', '{}'::jsonb
);
rollback;
`, /command receipt scope mismatch/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01TerminalOutbox', 'global',
  'terminal-outbox-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  id, command_receipt_id, message_type, aggregate_type, aggregate_id, payload_reference
) values (
  '${fixtureIds.outbox}', '${fixtureIds.receipt}', 'measurement.requested',
  'measurement_cycle', '${fixtureIds.aggregate}', '{}'::jsonb
);
update recora_private.admin_outbox_messages
set status = 'processing', locked_at = now(), attempt_count = 1, row_version = 2
where id = '${fixtureIds.outbox}';
update recora_private.admin_outbox_messages
set status = 'delivered', delivered_at = now(), row_version = 3
where id = '${fixtureIds.outbox}';
update recora_private.admin_outbox_messages
set row_version = 4
where id = '${fixtureIds.outbox}';
rollback;
`, /terminal row is immutable/i);

  queryLocal(`
begin;
insert into recora_private.admin_command_receipts (
  id, actor_type, system_component_code, command_name, target_type,
  idempotency_key, request_fingerprint, request_id, correlation_id,
  outcome, stable_reason_code
) values (
  '${fixtureIds.receipt}', 'system', 'm01.verifier', 'VerifyM01Availability', 'global',
  'availability-key', '${fingerprintA}', '${fixtureIds.request}', '${fixtureIds.correlation}',
  'accepted', 'ok'
);
insert into recora_private.admin_outbox_messages (
  command_receipt_id, message_type, aggregate_type, aggregate_id,
  payload_reference, created_at, available_at
) values (
  '${fixtureIds.receipt}', 'measurement.requested', 'measurement_cycle', '${fixtureIds.aggregate}',
  '{}'::jsonb, now(), now() - interval '1 second'
);
rollback;
`, /available_after_created|check constraint/i);

  queryLocal(`
begin;
insert into recora_private.admin_read_refreshes (
  id, read_model_code, source_watermark, correlation_id
) values (
  '${fixtureIds.refresh}', 'UsageCostDailySummary', '{}'::jsonb, '${fixtureIds.correlation}'
);
update recora_private.admin_read_refreshes
set status = 'completed', completed_at = started_at - interval '1 second', row_count = 0, row_version = 2
where id = '${fixtureIds.refresh}';
rollback;
`, /completed_after_started|check constraint/i);

  queryLocal(`
begin;
${migrationSql}
${migrationSql}
rollback;
`);
}

function findMigration(stem: string): string {
  const matches = fs.readdirSync(migrationDirectory)
    .filter((fileName: string) => fileName.endsWith(`_${stem}.sql`))
    .map((fileName: string) => path.join(migrationDirectory, fileName));
  assert.equal(matches.length, 1, `Expected exactly one migration for ${stem}.`);
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
      "exec", "--interactive", expectedDbContainer,
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
  const output = sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  if (result.error) throw result.error;
  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected SQL failure ${expectedError}, but it succeeded.`);
    assert.match(output, expectedError);
    return output;
  }
  assert.equal(result.status, 0, `Local SQL failed:\n${output}`);
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
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed:\n${sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}`);
  return result.stdout ?? "";
}


function assertGitTracked(repoPath: string): void {
  assert.ok(
    gitSucceeds(["ls-files", "--error-unmatch", "--", repoPath]),
    `Expected tracked repository file: ${repoPath}`,
  );
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
  throw new Error(`git ${args.join(" ")} failed: ${sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}`);
}

function readHeadBlob(repoPath: string): Buffer {
  return runGitBytes(["cat-file", "blob", `HEAD:${repoPath}`]);
}

function runGitBytes(args: string[]): Buffer {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: null,
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} failed: ${sanitize(Buffer.concat([
      Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.alloc(0),
      Buffer.from("\n"),
      Buffer.isBuffer(result.stderr) ? result.stderr : Buffer.alloc(0),
    ]).toString("utf8"))}`,
  );
  return Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? "");
}

function toRepoPath(value: string): string {
  return value.replaceAll("\\", "/");
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function stripSqlLineComments(sql: string): string {
  return sql.split(/\r?\n/).filter((line) => !line.trimStart().startsWith("--")).join("\n");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function sanitize(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]");
}

function relative(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}
