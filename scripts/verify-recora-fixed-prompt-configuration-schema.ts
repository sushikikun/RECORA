import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const expectedContainer = "supabase_db_recora-fixed-prompt-unit-a";
const args = new Set(process.argv.slice(2));
const staticOnly = args.has("--static");

const migrationDir = path.join(repoRoot, "supabase", "migrations");
const migrationFiles = fs
  .readdirSync(migrationDir)
  .filter((file) => file.endsWith("_recora_fixed_prompt_configuration_schema.sql"));

assert.deepEqual(migrationFiles, ["20260804000427_recora_fixed_prompt_configuration_schema.sql"]);

const migrationPath = path.join(migrationDir, migrationFiles[0]);
const migrationSql = fs.readFileSync(migrationPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const dbTypes = fs.readFileSync(path.join(repoRoot, "lib", "recora", "db", "types.ts"), "utf8");
const physicalSpec = fs.readFileSync(
  path.join(repoRoot, "docs", "architecture", "measurement-design", "recora_fixed_prompt_configuration_schema_v1.md"),
  "utf8",
);

const projectColumns = [
  "prompt_configuration_finalized_at",
  "prompt_configuration_hash",
  "prompt_configuration_contract_version",
  "prompt_configuration_count",
] as const;

const promptColumns = [
  "intent_key",
  "panel_role",
  "response_shape",
  "candidate_mention_opportunity",
  "ranking_opportunity",
  "metric_eligibility",
] as const;

const metricKeys = [
  "visibility",
  "ranking",
  "sov",
  "sentiment",
  "brand_perception",
  "natural_citation_observation",
  "forced_citation_validation",
  "risk_check",
  "recommendation_input",
] as const;

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "--interactive",
      expectedContainer,
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
      maxBuffer: 30 * 1024 * 1024,
      timeout: 120_000,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.error) {
    throw result.error;
  }

  if (expectedError) {
    assert.notEqual(
      result.status,
      0,
      `Expected local SQL to fail with ${expectedError}, but it succeeded.`,
    );
    assert.match(sanitize(output), expectedError);
    return output;
  }

  assert.equal(result.status, 0, `Local SQL failed:\n${sanitize(output)}`);
  return output;
}

function inspectContainer(): void {
  const result = spawnSync("docker", ["inspect", "--format", "{{.Name}}", expectedContainer], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    timeout: 30_000,
  });

  assert.equal(result.status, 0, `Expected local container ${expectedContainer} to exist.`);
  assert.equal(result.stdout.trim(), `/${expectedContainer}`);
}

function assertStaticContract(): void {
  assert.doesNotMatch(migrationSql, /\bcreate\s+table\b/i);
  assert.doesNotMatch(migrationSql, /\bsecurity\s+definer\b/i);
  assert.doesNotMatch(migrationSql, /\bgrant\s+execute\b/i);
  assert.doesNotMatch(migrationSql, /\bdisable\s+row\s+level\s+security\b/i);
  assert.doesNotMatch(migrationSql, /\bdb\s+push\b/i);
  assert.match(migrationSql, /set search_path = public, extensions;/);
  assert.match(migrationSql, /set search_path = ''/);

  for (const column of projectColumns) {
    assert.match(migrationSql, new RegExp(`add column if not exists ${column}`, "i"));
    assert.match(dbTypes, new RegExp(`${column}\\??:`, "i"));
    assert.match(physicalSpec, new RegExp(column));
  }

  for (const column of promptColumns) {
    assert.match(migrationSql, new RegExp(`add column if not exists ${column}`, "i"));
    assert.match(dbTypes, new RegExp(`${column}\\??:`, "i"));
    assert.match(physicalSpec, new RegExp(column));
  }

  for (const key of metricKeys) {
    assert.match(migrationSql, new RegExp(`'${key}'`));
    assert.match(physicalSpec, new RegExp(key));
  }

  assert.match(migrationSql, /projects_prompt_config_consistency_check/);
  assert.match(migrationSql, /projects_prompt_config_hash_check/);
  assert.match(migrationSql, /projects_prompt_config_count_check/);
  assert.doesNotMatch(migrationSql, /prompts_metric_eligibility_shape_check/);
  assert.doesNotMatch(migrationSql, /is_fixed_prompt_metric_eligibility\(metric_eligibility\)/);
  assert.match(migrationSql, /recora_private\.validate_prompt_metric_eligibility\(\)/);
  assert.match(migrationSql, /recora_prompts_metric_eligibility_shape_guard/);
  assert.match(migrationSql, /before insert or update of metric_eligibility on public\.prompts/);
  assert.match(migrationSql, /recora_prompts_finalized_project_guard/);
  assert.match(migrationSql, /recora_projects_finalized_config_guard/);
  assert.match(migrationSql, /revoke all on function recora_private\.validate_prompt_metric_eligibility\(\)\s+from public, anon, authenticated, service_role;/i);
  assert.match(migrationSql, /revoke all on function recora_private\.reject_finalized_prompt_mutation\(\)\s+from public, anon, authenticated, service_role;/i);
  assert.match(migrationSql, /revoke all on function recora_private\.reject_finalized_project_config_update\(\)\s+from public, anon, authenticated, service_role;/i);
  assert.match(migrationSql, /grant select on table public\.projects to service_role;/i);
  assert.match(migrationSql, /grant select, insert, update, delete on table public\.prompts to service_role;/i);
  assert.match(migrationSql, /revoke insert, update, delete, truncate, references on table public\.projects, public\.prompts\s+from public, anon, authenticated;/i);
  assert.match(migrationSql, /prompt_configuration_hash ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(migrationSql, /intent_key ~ '\^\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*\$'/);
  assert.match(migrationSql, /\^\[a-z\]\[a-z0-9\]\*\(\?:_\[a-z0-9\]\+\)\*\$/);

  const identifiers = Array.from(
    migrationSql.matchAll(/\b(?:constraint|trigger|function|index)\s+([a-z_][a-z0-9_.]*)/gi),
    (match) => match[1].split(".").at(-1) ?? match[1],
  );
  for (const identifier of identifiers) {
    assert.ok(identifier.length <= 63, `PostgreSQL identifier exceeds 63 bytes: ${identifier}`);
  }

  assert.equal(packageJson.scripts["recora:fixed-prompt-schema:check"], "tsx scripts/verify-recora-fixed-prompt-configuration-schema.ts");
  assert.equal(
    packageJson.scripts["recora:fixed-prompt-schema:static-check"],
    "tsx scripts/verify-recora-fixed-prompt-configuration-schema.ts --static",
  );
  assert.match(packageJson.scripts["recora:preflight"], /recora:fixed-prompt-schema:static-check/);
  assert.match(physicalSpec, /No new application table/);
  assert.match(physicalSpec, /Human review/);
}

function metricEligibilityJson(overrides: Record<string, unknown> = {}): string {
  const value = Object.fromEntries(
    metricKeys.map((key) => [
      key,
      {
        state: key === "sentiment" || key === "brand_perception" ? "excluded" : "eligible",
        reason_codes: [`${key}_structure_valid`],
      },
    ]),
  );

  return JSON.stringify({ ...value, ...overrides });
}

function jsonbLiteral(value: string): string {
  return `$metric$${value}$metric$::jsonb`;
}

const ids = {
  org: "10000000-0000-4000-8000-000000000148",
  unfinalizedProject: "10000000-0000-4000-8000-000000001148",
  finalizedProject: "10000000-0000-4000-8000-000000002148",
  cascadeProject: "10000000-0000-4000-8000-000000003148",
  topicUnfinalized: "10000000-0000-4000-8000-000000011148",
  topicFinalized: "10000000-0000-4000-8000-000000012148",
  topicCascade: "10000000-0000-4000-8000-000000013148",
  personaUnfinalized: "10000000-0000-4000-8000-000000021148",
  personaFinalized: "10000000-0000-4000-8000-000000022148",
  personaCascade: "10000000-0000-4000-8000-000000023148",
  promptUnfinalized: "10000000-0000-4000-8000-000000031148",
  promptFinalized: "10000000-0000-4000-8000-000000032148",
  promptCascade: "10000000-0000-4000-8000-000000033148",
};

const validHash = "a".repeat(64);
const validMetricEligibility = jsonbLiteral(metricEligibilityJson());

function commonFixtureSql(): string {
  return `
insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
values ('${ids.org}', 'issue-148-fixed-prompt-org', 'Issue 148 Fixed Prompt Org', 'client', 'local', false, true);

insert into public.projects (id, organization_id, slug, name)
values
  ('${ids.unfinalizedProject}', '${ids.org}', 'issue-148-unfinalized', 'Issue 148 Unfinalized'),
  ('${ids.finalizedProject}', '${ids.org}', 'issue-148-finalized', 'Issue 148 Finalized'),
  ('${ids.cascadeProject}', '${ids.org}', 'issue-148-cascade', 'Issue 148 Cascade');

insert into public.topics (id, project_id, name)
values
  ('${ids.topicUnfinalized}', '${ids.unfinalizedProject}', 'Unfinalized Topic'),
  ('${ids.topicFinalized}', '${ids.finalizedProject}', 'Finalized Topic'),
  ('${ids.topicCascade}', '${ids.cascadeProject}', 'Cascade Topic');

insert into public.personas (id, project_id, name)
values
  ('${ids.personaUnfinalized}', '${ids.unfinalizedProject}', 'Unfinalized Persona'),
  ('${ids.personaFinalized}', '${ids.finalizedProject}', 'Finalized Persona'),
  ('${ids.personaCascade}', '${ids.cascadeProject}', 'Cascade Persona');
`;
}

function promptValueTail(projectId: string, topicId: string, personaId: string, text: string): string {
  return `'${projectId}', '${topicId}', '${personaId}', '${text}', 'smb-attendance-tool-shortlist', 'core', 'ranked_recommendation', 'direct', 'direct', ${validMetricEligibility}`;
}

function assertDbCatalog(): void {
  queryLocal(`
do $verify$
declare
  missing_column_count bigint;
  missing_constraint_count bigint;
  missing_trigger_count bigint;
  unexpected_browser_write_grant_count bigint;
  missing_service_role_table_grant_count bigint;
  unexpected_helper_execute_grant_count bigint;
  security_definer_helper_count bigint;
  function_backed_metric_check_count bigint;
  project_rls boolean;
  prompt_rls boolean;
begin
  select count(*)
  into missing_column_count
  from (
    values
      ('projects', 'prompt_configuration_finalized_at'),
      ('projects', 'prompt_configuration_hash'),
      ('projects', 'prompt_configuration_contract_version'),
      ('projects', 'prompt_configuration_count'),
      ('prompts', 'intent_key'),
      ('prompts', 'panel_role'),
      ('prompts', 'response_shape'),
      ('prompts', 'candidate_mention_opportunity'),
      ('prompts', 'ranking_opportunity'),
      ('prompts', 'metric_eligibility')
  ) expected(table_name, column_name)
  where not exists (
    select 1
    from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = expected.table_name
      and column_row.column_name = expected.column_name
      and column_row.is_nullable = 'YES'
  );

  if missing_column_count <> 0 then
    raise exception 'Issue 148 catalog failed: % nullable columns missing', missing_column_count;
  end if;

  select count(*)
  into missing_constraint_count
  from (
    values
      ('projects_prompt_config_consistency_check'),
      ('projects_prompt_config_hash_check'),
      ('projects_prompt_config_version_check'),
      ('projects_prompt_config_count_check'),
      ('prompts_intent_key_check'),
      ('prompts_panel_role_check'),
      ('prompts_response_shape_check'),
      ('prompts_candidate_mention_opportunity_check'),
      ('prompts_ranking_opportunity_check'),
      ('prompts_topic_project_fkey'),
      ('prompts_persona_project_fkey')
  ) expected(conname)
  where not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.connamespace = 'public'::regnamespace
      and constraint_row.conname = expected.conname
  );

  if missing_constraint_count <> 0 then
    raise exception 'Issue 148 catalog failed: % constraints missing', missing_constraint_count;
  end if;

  select count(*)
  into missing_trigger_count
  from (
    values
      ('public.prompts'::regclass, 'recora_prompts_finalized_project_guard'),
      ('public.prompts'::regclass, 'recora_prompts_metric_eligibility_shape_guard'),
      ('public.projects'::regclass, 'recora_projects_finalized_config_guard')
  ) expected(table_oid, trigger_name)
  where not exists (
    select 1
    from pg_trigger trigger_row
    where trigger_row.tgrelid = expected.table_oid
      and trigger_row.tgname = expected.trigger_name
      and not trigger_row.tgisinternal
  );

  if missing_trigger_count <> 0 then
    raise exception 'Issue 148 catalog failed: % triggers missing', missing_trigger_count;
  end if;

  select relrowsecurity into project_rls from pg_class where oid = 'public.projects'::regclass;
  select relrowsecurity into prompt_rls from pg_class where oid = 'public.prompts'::regclass;
  if project_rls is not true or prompt_rls is not true then
    raise exception 'Issue 148 catalog failed: projects/prompts RLS must remain enabled';
  end if;

  select count(*)
  into unexpected_browser_write_grant_count
  from information_schema.role_table_grants grant_row
  where grant_row.table_schema = 'public'
    and grant_row.table_name in ('projects', 'prompts')
    and grant_row.grantee in ('anon', 'authenticated')
    and grant_row.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

  if unexpected_browser_write_grant_count <> 0 then
    raise exception 'Issue 148 catalog failed: browser write grants were introduced';
  end if;

  select count(*)
  into missing_service_role_table_grant_count
  from (
    values
      ('service_role', 'public.projects', 'SELECT'),
      ('service_role', 'public.prompts', 'SELECT'),
      ('service_role', 'public.prompts', 'INSERT'),
      ('service_role', 'public.prompts', 'UPDATE'),
      ('service_role', 'public.prompts', 'DELETE')
  ) expected(role_name, relation_name, privilege_name)
  where not has_table_privilege(expected.role_name, expected.relation_name, expected.privilege_name);

  if missing_service_role_table_grant_count <> 0 then
    raise exception 'Issue 148 catalog failed: service_role prompt mutation grants are missing';
  end if;

  select count(*)
  into function_backed_metric_check_count
  from pg_constraint constraint_row
  where constraint_row.connamespace = 'public'::regnamespace
    and (
      constraint_row.conname = 'prompts_metric_eligibility_shape_check'
      or pg_get_constraintdef(constraint_row.oid) ~ 'is_fixed_prompt_metric_eligibility'
    );

  if function_backed_metric_check_count <> 0 then
    raise exception 'Issue 148 catalog failed: metric_eligibility must not use a function-backed CHECK';
  end if;

  if to_regprocedure('recora_private.is_fixed_prompt_metric_eligibility(jsonb)') is not null then
    raise exception 'Issue 148 catalog failed: obsolete metric eligibility CHECK helper still exists';
  end if;

  select count(*)
  into unexpected_helper_execute_grant_count
  from (
    values
      ('anon', 'recora_private.validate_prompt_metric_eligibility()'),
      ('authenticated', 'recora_private.validate_prompt_metric_eligibility()'),
      ('service_role', 'recora_private.validate_prompt_metric_eligibility()'),
      ('anon', 'recora_private.reject_finalized_prompt_mutation()'),
      ('authenticated', 'recora_private.reject_finalized_prompt_mutation()'),
      ('service_role', 'recora_private.reject_finalized_prompt_mutation()'),
      ('anon', 'recora_private.reject_finalized_project_config_update()'),
      ('authenticated', 'recora_private.reject_finalized_project_config_update()'),
      ('service_role', 'recora_private.reject_finalized_project_config_update()')
  ) expected(role_name, signature)
  where to_regprocedure(expected.signature) is not null
    and has_function_privilege(expected.role_name, expected.signature, 'EXECUTE');

  if unexpected_helper_execute_grant_count <> 0 then
    raise exception 'Issue 148 catalog failed: helper direct execute privilege exists';
  end if;

  select count(*)
  into security_definer_helper_count
  from pg_proc proc
  join pg_namespace namespace on namespace.oid = proc.pronamespace
  where namespace.nspname = 'recora_private'
    and proc.proname in (
      'validate_prompt_metric_eligibility',
      'reject_finalized_prompt_mutation',
      'reject_finalized_project_config_update'
    )
    and proc.prosecdef;

  if security_definer_helper_count <> 0 then
    raise exception 'Issue 148 catalog failed: helper must not be SECURITY DEFINER';
  end if;
end;
$verify$;
`);
}

function assertServiceRoleRuntime(): void {
  queryLocal(`
begin;
${commonFixtureSql()}
set local role service_role;
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '10000000-0000-4000-8000-000000041148',
  ${promptValueTail(ids.unfinalizedProject, ids.topicUnfinalized, ids.personaUnfinalized, "Service role valid metric eligibility")}
);
rollback;
`);
  console.log("PASS service_role valid metric_eligibility insert");

  queryLocal(
    `
begin;
${commonFixtureSql()}
set local role service_role;
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  metric_eligibility
) values (
  '10000000-0000-4000-8000-000000042148',
  '${ids.unfinalizedProject}',
  '${ids.topicUnfinalized}',
  '${ids.personaUnfinalized}',
  'Service role malformed metric eligibility',
  ${jsonbLiteral(metricEligibilityJson({ recommendation_input: undefined }))}
);
rollback;
`,
    /invalid fixed prompt metric_eligibility structure/i,
  );
  console.log("PASS service_role malformed metric_eligibility blocked");

  const finalizedPromptFixture = `
${commonFixtureSql()}
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '${ids.promptFinalized}',
  ${promptValueTail(ids.finalizedProject, ids.topicFinalized, ids.personaFinalized, "Service role finalized prompt fixture")}
);
update public.projects
set
  prompt_configuration_finalized_at = now(),
  prompt_configuration_hash = '${validHash}',
  prompt_configuration_contract_version = 'recora_fixed_prompt_configuration_schema_v1',
  prompt_configuration_count = 1
where id = '${ids.finalizedProject}';
`;

  const finalizedCases: readonly [string, string][] = [
    [
      "service_role finalized prompt insert",
      `insert into public.prompts (
         id, project_id, topic_id, persona_id, text
       ) values (
         '10000000-0000-4000-8000-000000043148',
         '${ids.finalizedProject}',
         '${ids.topicFinalized}',
         '${ids.personaFinalized}',
         'Service role blocked finalized insert'
       )`,
    ],
    [
      "service_role finalized prompt update",
      `update public.prompts set text = 'Service role blocked finalized update' where id = '${ids.promptFinalized}'`,
    ],
    [
      "service_role finalized prompt delete",
      `delete from public.prompts where id = '${ids.promptFinalized}'`,
    ],
  ];

  for (const [name, statement] of finalizedCases) {
    queryLocal(
      `
begin;
${finalizedPromptFixture}
set local role service_role;
${statement};
rollback;
`,
      /fixed prompt configuration is finalized/i,
    );
    console.log(`PASS ${name}`);
  }
}
function assertDbFixtures(): void {
  queryLocal(`
begin;
${commonFixtureSql()}

insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text
) values (
  '${ids.promptUnfinalized}',
  '${ids.unfinalizedProject}',
  '${ids.topicUnfinalized}',
  '${ids.personaUnfinalized}',
  'Legacy nullable prompt remains valid'
);

update public.prompts
set text = 'Legacy nullable prompt update remains valid'
where id = '${ids.promptUnfinalized}';

delete from public.prompts
where id = '${ids.promptUnfinalized}';

insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '${ids.promptFinalized}',
  ${promptValueTail(ids.finalizedProject, ids.topicFinalized, ids.personaFinalized, "Finalized prompt fixture")}
);

insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '${ids.promptCascade}',
  ${promptValueTail(ids.cascadeProject, ids.topicCascade, ids.personaCascade, "Cascade prompt fixture")}
);

update public.projects
set
  prompt_configuration_finalized_at = now(),
  prompt_configuration_hash = '${validHash}',
  prompt_configuration_contract_version = 'recora_fixed_prompt_configuration_schema_v1',
  prompt_configuration_count = 1
where id in ('${ids.finalizedProject}', '${ids.cascadeProject}');

delete from public.projects where id = '${ids.cascadeProject}';

do $inner$
begin
  if exists (select 1 from public.prompts where id = '${ids.promptCascade}') then
    raise exception 'Project deletion cascade did not remove finalized prompt fixture';
  end if;
end;
$inner$;

rollback;
`);

  const invalidCases: readonly [string, string, RegExp][] = [
    [
      "partial project finalization",
      `insert into public.projects (id, organization_id, slug, name, prompt_configuration_hash)
       values ('10000000-0000-4000-8000-000000101148', '${ids.org}', 'partial-finalization', 'Partial', '${validHash}')`,
      /projects_prompt_config_consistency_check|violates check constraint/i,
    ],
    [
      "malformed hash",
      `insert into public.projects (
         id, organization_id, slug, name, prompt_configuration_finalized_at,
         prompt_configuration_hash, prompt_configuration_contract_version, prompt_configuration_count
       ) values (
         '10000000-0000-4000-8000-000000102148', '${ids.org}', 'malformed-hash', 'Malformed',
         now(), 'ABC', 'recora_fixed_prompt_configuration_schema_v1', 1
       )`,
      /projects_prompt_config_hash_check|violates check constraint/i,
    ],
    [
      "zero count",
      `insert into public.projects (
         id, organization_id, slug, name, prompt_configuration_finalized_at,
         prompt_configuration_hash, prompt_configuration_contract_version, prompt_configuration_count
       ) values (
         '10000000-0000-4000-8000-000000103148', '${ids.org}', 'zero-count', 'Zero',
         now(), '${validHash}', 'recora_fixed_prompt_configuration_schema_v1', 0
       )`,
      /projects_prompt_config_count_check|violates check constraint/i,
    ],
    [
      "empty contract version",
      `insert into public.projects (
         id, organization_id, slug, name, prompt_configuration_finalized_at,
         prompt_configuration_hash, prompt_configuration_contract_version, prompt_configuration_count
       ) values (
         '10000000-0000-4000-8000-000000104148', '${ids.org}', 'empty-version', 'Empty',
         now(), '${validHash}', ' ', 1
       )`,
      /projects_prompt_config_version_check|violates check constraint/i,
    ],
    [
      "invalid intent key",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, intent_key
       ) values ('${ids.unfinalizedProject}', '${ids.topicUnfinalized}', '${ids.personaUnfinalized}', 'Invalid intent key', 'Bad_Key')`,
      /prompts_intent_key_check|violates check constraint/i,
    ],
    [
      "invalid panel role",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, panel_role
       ) values ('${ids.unfinalizedProject}', '${ids.topicUnfinalized}', '${ids.personaUnfinalized}', 'Invalid panel role', 'seasonal')`,
      /prompts_panel_role_check|violates check constraint/i,
    ],
    [
      "invalid response shape",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, response_shape
       ) values ('${ids.unfinalizedProject}', '${ids.topicUnfinalized}', '${ids.personaUnfinalized}', 'Invalid response shape', 'freeform')`,
      /prompts_response_shape_check|violates check constraint/i,
    ],
    [
      "invalid opportunity",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, candidate_mention_opportunity
       ) values ('${ids.unfinalizedProject}', '${ids.topicUnfinalized}', '${ids.personaUnfinalized}', 'Invalid opportunity', 'maybe')`,
      /prompts_candidate_mention_opportunity_check|violates check constraint/i,
    ],
    [
      "missing metric key",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Missing metric key',
         ${jsonbLiteral(metricEligibilityJson({ recommendation_input: undefined }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "extra metric key",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Extra metric key',
         ${jsonbLiteral(metricEligibilityJson({ unsupported: { state: "eligible", reason_codes: ["extra_key"] } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "invalid metric state",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Invalid metric state',
         ${jsonbLiteral(metricEligibilityJson({ visibility: { state: "maybe", reason_codes: ["bad_state"] } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "empty reason codes",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Empty reason codes',
         ${jsonbLiteral(metricEligibilityJson({ visibility: { state: "eligible", reason_codes: [] } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "non-array reason codes",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Non-array reason codes',
         ${jsonbLiteral(metricEligibilityJson({ visibility: { state: "eligible", reason_codes: "bad_reason" } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "empty reason",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Empty reason',
         ${jsonbLiteral(metricEligibilityJson({ visibility: { state: "eligible", reason_codes: [""] } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "non-string reason",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Non-string reason',
         ${jsonbLiteral(metricEligibilityJson({ visibility: { state: "eligible", reason_codes: [123] } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "invalid reason code",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text, metric_eligibility
       ) values (
         '${ids.unfinalizedProject}',
         '${ids.topicUnfinalized}',
         '${ids.personaUnfinalized}',
         'Invalid reason code',
         ${jsonbLiteral(metricEligibilityJson({ visibility: { state: "eligible", reason_codes: ["Bad-Reason"] } }))}
       )`,
      /invalid fixed prompt metric_eligibility structure/i,
    ],
    [
      "finalized prompt insert",
      `insert into public.prompts (
         project_id, topic_id, persona_id, text
       ) values ('${ids.finalizedProject}', '${ids.topicFinalized}', '${ids.personaFinalized}', 'Blocked insert')`,
      /fixed prompt configuration is finalized/i,
    ],
    [
      "finalized prompt update",
      `update public.prompts set text = 'Blocked update' where id = '${ids.promptFinalized}'`,
      /fixed prompt configuration is finalized/i,
    ],
    [
      "finalized prompt delete",
      `delete from public.prompts where id = '${ids.promptFinalized}'`,
      /fixed prompt configuration is finalized/i,
    ],
    [
      "finalized project config rewrite",
      `update public.projects set prompt_configuration_hash = '${"b".repeat(64)}' where id = '${ids.finalizedProject}'`,
      /fixed prompt configuration fields are immutable once finalized/i,
    ],
  ];

  for (const [name, statement, expectedError] of invalidCases) {
    queryLocal(
      `
begin;
${commonFixtureSql()}
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '${ids.promptFinalized}',
  ${promptValueTail(ids.finalizedProject, ids.topicFinalized, ids.personaFinalized, "Finalized prompt fixture")}
);
update public.projects
set
  prompt_configuration_finalized_at = now(),
  prompt_configuration_hash = '${validHash}',
  prompt_configuration_contract_version = 'recora_fixed_prompt_configuration_schema_v1',
  prompt_configuration_count = 1
where id = '${ids.finalizedProject}';
${statement};
rollback;
`,
      expectedError,
    );
    console.log(`PASS ${name}`);
  }
}

assertStaticContract();

if (!staticOnly) {
  inspectContainer();
  assertDbCatalog();
  assertDbFixtures();
  assertServiceRoleRuntime();
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      mode: staticOnly ? "static" : "static-and-local-db",
      migration: path.relative(repoRoot, migrationPath),
      expectedContainer,
      projectColumns,
      promptColumns,
      metricKeys,
    },
    null,
    2,
  ),
);
