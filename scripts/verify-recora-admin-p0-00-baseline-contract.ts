import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const expectedRepositoryBaseline = "2c2a6fba70b75e858abc71a7447840bf32f3507d";
const expectedCanonicalManifestSha256 = "f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a";
const expectedPhysicalManifestSha256 = "d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a";
const expectedSchemaVersion = "recora_admin_p0_design_v1_3";
const expectedCanonicalPackageId = "RECORA-ADMIN-P0-CANONICAL";
const expectedCanonicalVersion = "1.0";
const expectedMigrationStem = "recora_admin_p0_00_baseline_contract";
const expectedDbContainerPattern = /^supabase_db_recora-admin-p0-m\d{2}$/;

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
const migrationPath = findSingleMigration(expectedMigrationStem);

const canonicalManifestRepoPath = toRepoPath(path.relative(repoRoot, canonicalManifestPath));
const physicalManifestRepoPath = toRepoPath(path.relative(repoRoot, physicalManifestPath));
assertGitTracked(canonicalManifestRepoPath);
assertGitTracked(physicalManifestRepoPath);
assertGitClean(canonicalManifestRepoPath, "Canonical manifest must be unchanged and unstaged.");
assertGitClean(physicalManifestRepoPath, "Physical schema manifest must be unchanged and unstaged.");
const canonicalManifestBytes = readHeadBlob(canonicalManifestRepoPath);
const physicalManifestBytes = readHeadBlob(physicalManifestRepoPath);
const migrationSql = fs.readFileSync(migrationPath, "utf8");
const executableMigrationSql = stripSqlComments(migrationSql);
const normalizedMigrationSql = normalizeSql(executableMigrationSql);

assert.equal(sha256(canonicalManifestBytes), expectedCanonicalManifestSha256);
assert.equal(sha256(physicalManifestBytes), expectedPhysicalManifestSha256);

const canonicalManifest = JSON.parse(canonicalManifestBytes.toString("utf8")) as {
  package_id?: unknown;
  version?: unknown;
  status?: unknown;
};
assert.equal(canonicalManifest.package_id, expectedCanonicalPackageId);
assert.equal(canonicalManifest.version, expectedCanonicalVersion);
assert.equal(canonicalManifest.status, "formal");

const physicalManifest = JSON.parse(physicalManifestBytes.toString("utf8")) as {
  package_id?: unknown;
  version?: unknown;
  repository_baseline?: { repository?: unknown; branch?: unknown; commit?: unknown };
  canonical_package?: { package_id?: unknown; version?: unknown; manifest_sha256?: unknown };
  migrations?: Array<{ sequence?: unknown; migration_stem?: unknown; depends_on?: unknown }>;
};
assert.equal(physicalManifest.package_id, "RECORA-ADMIN-P0-DATABASE");
assert.equal(physicalManifest.version, "1.3");
assert.equal(physicalManifest.repository_baseline?.repository, "sushikikun/RECORA");
assert.equal(physicalManifest.repository_baseline?.branch, "master");
assert.equal(physicalManifest.repository_baseline?.commit, expectedRepositoryBaseline);
assert.equal(physicalManifest.canonical_package?.package_id, expectedCanonicalPackageId);
assert.equal(physicalManifest.canonical_package?.version, expectedCanonicalVersion);
assert.equal(
  physicalManifest.canonical_package?.manifest_sha256,
  expectedCanonicalManifestSha256,
);

const migrations = physicalManifest.migrations;
if (!Array.isArray(migrations)) {
  throw new Error("Physical manifest migrations are required.");
}
assert.equal(migrations.length, 24);
for (let sequence = 0; sequence < migrations.length; sequence += 1) {
  const migration: NonNullable<typeof physicalManifest.migrations>[number] = migrations[sequence]!;
  assert.equal(migration.sequence, sequence, `Migration sequence ${sequence} is not contiguous.`);
  assert.equal(typeof migration.migration_stem, "string");
  assert.ok(Array.isArray(migration.depends_on));
  if (sequence === 0) {
    assert.equal(migration.migration_stem, expectedMigrationStem);
    assert.deepEqual(migration.depends_on, []);
  } else {
    assert.ok(
      (migration.depends_on as unknown[]).every(
        (dependency) => typeof dependency === "number" && dependency < sequence,
      ),
      `Migration ${sequence} has a non-preceding dependency.`,
    );
  }
}

const staticOnly = process.env.RECORA_ADMIN_P0_STATIC_ONLY === "1";
if (!staticOnly) verifyRepositoryBaseline();
verifyMigrationSource();
if (!staticOnly) verifyLocalDatabase();

console.log(
  JSON.stringify(
    {
      status: "ok",
      baseline: {
        repositoryCommit: expectedRepositoryBaseline,
        canonicalManifestSha256: expectedCanonicalManifestSha256,
        physicalManifestSha256: expectedPhysicalManifestSha256,
        schemaVersion: expectedSchemaVersion,
      },
      migration: path.relative(repoRoot, migrationPath).replaceAll("\\", "/"),
      checkedCases: {
        manifestHashesPinned: true,
        orderedMigrationSetValidated: true,
        inventoryPrecedesWrites: true,
        legacyConversionAbsent: true,
        repositoryBaselineValidated: !staticOnly,
        privateRlsAndGrantsValidated: !staticOnly,
        schemaPinValidated: !staticOnly,
        replayValidated: !staticOnly,
        appendOnlyValidated: !staticOnly,
        p4BAccountAccessBaselineValidated: !staticOnly,
        trackedManifestGitBlobsValidated: true,
      },
    },
    null,
    2,
  ),
);

function verifyRepositoryBaseline(): void {
  const mode = process.env.RECORA_ADMIN_P0_BASELINE_MODE ?? "ancestor";
  assert.ok(
    mode === "ancestor" || mode === "exact",
    "RECORA_ADMIN_P0_BASELINE_MODE must be ancestor or exact.",
  );

  const head = run("git", ["rev-parse", "HEAD"]).trim();
  assert.match(head, /^[0-9a-f]{40}$/);

  const ancestorCheck = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", expectedRepositoryBaseline, "HEAD"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
  );
  assert.equal(
    ancestorCheck.status,
    0,
    `Expected repository baseline ${expectedRepositoryBaseline} is not an ancestor of HEAD ${head}.`,
  );

  if (mode === "exact") {
    assert.equal(
      head,
      expectedRepositoryBaseline,
      "Exact baseline mode must run before the implementation commit is created.",
    );
    const originMaster = run("git", ["rev-parse", "origin/master"]).trim();
    assert.equal(
      originMaster,
      expectedRepositoryBaseline,
      "origin/master changed after the approved M00 inventory; rebase review is required.",
    );
  }
}

function verifyMigrationSource(): void {
  const inventoryIndex = normalizedMigrationSql.indexOf(
    "do $admin_p0_baseline_inventory$",
  );
  const createIndex = normalizedMigrationSql.indexOf(
    "create table if not exists recora_private.admin_p0_schema_versions",
  );
  assert.ok(inventoryIndex >= 0, "M00 inventory block is required.");
  assert.ok(createIndex > inventoryIndex, "M00 inventory must precede the first persistent write.");

  assert.match(
    normalizedMigrationSql,
    /create table if not exists recora_private\.admin_p0_schema_versions/,
  );
  for (const column of [
    "schema_version text not null",
    "canonical_package_id text not null",
    "canonical_version text not null",
    "canonical_manifest_sha256 text not null",
    "repository_baseline_commit text not null",
    "applied_at timestamptz not null default now()",
    "migration_set_digest text not null",
  ]) {
    assert.ok(normalizedMigrationSql.includes(column), `M00 column contract is missing: ${column}`);
  }

  assert.ok(normalizedMigrationSql.includes(expectedSchemaVersion));
  assert.ok(normalizedMigrationSql.includes(expectedCanonicalPackageId.toLowerCase()));
  assert.ok(normalizedMigrationSql.includes(expectedCanonicalVersion));
  assert.ok(normalizedMigrationSql.includes(expectedCanonicalManifestSha256));
  assert.ok(normalizedMigrationSql.includes(expectedPhysicalManifestSha256));
  assert.ok(normalizedMigrationSql.includes(expectedRepositoryBaseline));

  assert.match(
    normalizedMigrationSql,
    /alter table recora_private\.admin_p0_schema_versions enable row level security/,
  );
  assert.match(
    normalizedMigrationSql,
    /revoke all on table recora_private\.admin_p0_schema_versions from public, anon, authenticated/,
  );
  assert.match(
    normalizedMigrationSql,
    /before update or delete on recora_private\.admin_p0_schema_versions/,
  );
  assert.match(
    normalizedMigrationSql,
    /execute function recora_private\.p4_reject_history_mutation\(\)/,
  );
  assert.match(normalizedMigrationSql, /on conflict \(schema_version\) do nothing/);
  for (const requiredP4BToken of [
    "customer_session",
    "customer_auth_user_id",
    "p4_command_receipt_actor_shape",
    "p4_single_pending_invitation_per_recipient",
    "p4b_try_p4_command_replay",
    "recora_p4b_invitation_create",
    "recora_p4b_invitation_accept",
    "recora_p4b_membership_revoke",
    "recora_p4b_resolve_customer_access",
    "invitation expiry must remain in p4 invitation authority",
  ]) {
    assert.ok(
      normalizedMigrationSql.includes(requiredP4BToken),
      `M00 P4-B baseline contract is missing: ${requiredP4BToken}`,
    );
  }

  assert.doesNotMatch(
    executableMigrationSql,
    /\b(?:insert\s+into|update|delete\s+from)\s+(?:public|recora_admin)\./i,
    "M00 must not convert or mutate public/legacy operational rows.",
  );
  assert.doesNotMatch(
    executableMigrationSql,
    /\balter\s+table\s+(?:public|recora_admin)\./i,
    "M00 must not alter public or legacy schemas.",
  );
  assert.doesNotMatch(executableMigrationSql, /\bcreate\s+policy\b/i);
  assert.doesNotMatch(
    executableMigrationSql,
    /\bgrant\s+(?:select|insert|update|delete|all)[\s\S]{0,160}\bto\s+(?:anon|authenticated)\b/i,
  );
  assert.doesNotMatch(
    executableMigrationSql,
    /\b(drop\s+(?:table|schema)|truncate\s+table)\b/i,
  );
}

function verifyLocalDatabase(): void {
  const configuredContainer = process.env.RECORA_ADMIN_P0_DB_CONTAINER;
  assert.equal(typeof configuredContainer, "string", "RECORA_ADMIN_P0_DB_CONTAINER is required.");
  if (typeof configuredContainer !== "string") throw new Error("RECORA_ADMIN_P0_DB_CONTAINER is required.");
  assert.match(
    configuredContainer,
    expectedDbContainerPattern,
    "M00 verifier accepts only dedicated Recora Admin P0 migration containers such as supabase_db_recora-admin-p0-m00 or m01.",
  );

  run("docker", ["inspect", configuredContainer]);

  queryLocal(`
do $verify$
declare
  pinned_count bigint;
  pinned_row recora_private.admin_p0_schema_versions%rowtype;
begin
  if current_database() <> 'postgres' then
    raise exception 'M00 verifier refused unexpected database %', current_database();
  end if;

  if to_regclass('recora_private.admin_p0_schema_versions') is null then
    raise exception 'M00 schema-version table is missing';
  end if;

  select count(*)
  into pinned_count
  from recora_private.admin_p0_schema_versions
  where schema_version = '${expectedSchemaVersion}';

  if pinned_count <> 1 then
    raise exception 'M00 expected exactly one pinned design row, found %', pinned_count;
  end if;

  select * into pinned_row
  from recora_private.admin_p0_schema_versions
  where schema_version = '${expectedSchemaVersion}';

  if pinned_row.canonical_package_id <> '${expectedCanonicalPackageId}'
    or pinned_row.canonical_version <> '${expectedCanonicalVersion}'
    or pinned_row.canonical_manifest_sha256 <> '${expectedCanonicalManifestSha256}'
    or pinned_row.repository_baseline_commit <> '${expectedRepositoryBaseline}'
    or pinned_row.migration_set_digest <> '${expectedPhysicalManifestSha256}' then
    raise exception 'M00 pinned design row does not match approved constants';
  end if;

  if not exists (
    select 1
    from pg_class relation_row
    join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'recora_private'
      and relation_row.relname = 'admin_p0_schema_versions'
      and relation_row.relrowsecurity is true
  ) then
    raise exception 'M00 schema-version table must have RLS enabled';
  end if;

  if has_table_privilege('anon', 'recora_private.admin_p0_schema_versions', 'SELECT')
    or has_table_privilege('authenticated', 'recora_private.admin_p0_schema_versions', 'SELECT') then
    raise exception 'M00 schema-version table is browser-readable';
  end if;

  if not has_table_privilege('service_role', 'recora_private.admin_p0_schema_versions', 'SELECT')
    or has_table_privilege('service_role', 'recora_private.admin_p0_schema_versions', 'INSERT')
    or has_table_privilege('service_role', 'recora_private.admin_p0_schema_versions', 'UPDATE')
    or has_table_privilege('service_role', 'recora_private.admin_p0_schema_versions', 'DELETE') then
    raise exception 'M00 service_role privileges do not match the read-only contract';
  end if;

  if not exists (
    select 1
    from pg_trigger trigger_row
    where trigger_row.tgrelid = 'recora_private.admin_p0_schema_versions'::regclass
      and trigger_row.tgname = 'admin_p0_schema_versions_append_only'
      and trigger_row.tgenabled <> 'D'
      and trigger_row.tgisinternal is false
  ) then
    raise exception 'M00 append-only trigger is missing or disabled';
  end if;
end;
$verify$;
`);

  queryLocal(`
begin;
${migrationSql}
${migrationSql}
do $replay_count$
begin
  if (
    select count(*)
    from recora_private.admin_p0_schema_versions
    where schema_version = '${expectedSchemaVersion}'
  ) <> 1 then
    raise exception 'M00 replay created an unexpected row count';
  end if;
end;
$replay_count$;
rollback;
`);

  queryLocal(
    `update recora_private.admin_p0_schema_versions\nset canonical_version = canonical_version\nwhere schema_version = '${expectedSchemaVersion}';`,
    /append-only/i,
  );
  queryLocal(
    `delete from recora_private.admin_p0_schema_versions\nwhere schema_version = '${expectedSchemaVersion}';`,
    /append-only/i,
  );
  queryLocal(
    `insert into recora_private.admin_p0_schema_versions (\n      schema_version, canonical_package_id, canonical_version,\n      canonical_manifest_sha256, repository_baseline_commit, migration_set_digest\n    ) values (\n      '${expectedSchemaVersion}', '${expectedCanonicalPackageId}', 'conflict',\n      '${expectedCanonicalManifestSha256}', '${expectedRepositoryBaseline}', '${expectedPhysicalManifestSha256}'\n    );`,
    /duplicate key value violates unique constraint/i,
  );
}

function findSingleMigration(stem: string): string {
  const migrationDir = path.join(repoRoot, "supabase", "migrations");
  const matches = fs
    .readdirSync(migrationDir)
    .filter((fileName: string) => fileName.endsWith(`_${stem}.sql`));
  assert.equal(
    matches.length,
    1,
    `Expected exactly one migration ending in _${stem}.sql, found ${matches.length}.`,
  );
  return path.join(migrationDir, matches[0]);
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "--interactive",
      configuredDbContainer(),
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
  if (result.error) throw result.error;

  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected SQL failure ${expectedError}, but SQL succeeded.`);
    assert.match(sanitize(output), expectedError);
    return output;
  }

  assert.equal(result.status, 0, `Local SQL failed:\n${sanitize(output)}`);
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
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed:\n${sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}`,
  );
  return result.stdout ?? "";
}

function configuredDbContainer(): string {
  const value = process.env.RECORA_ADMIN_P0_DB_CONTAINER;
  assert.equal(typeof value, "string", "RECORA_ADMIN_P0_DB_CONTAINER is required.");
  if (typeof value !== "string") throw new Error("RECORA_ADMIN_P0_DB_CONTAINER is required.");
  assert.match(value, expectedDbContainerPattern);
  return value;
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

function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function sanitize(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]");
}
