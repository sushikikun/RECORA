import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const expectedContainer = "supabase_db_recora-issue-113";
const dbContainerValue = process.env.RECORA_ISSUE_113_DB_CONTAINER;
const migrationPath = path.join(repoRoot, "supabase", "migrations", "20260730130000_recora_retention_deletion_state.sql");
const resolverPath = path.join(repoRoot, "lib", "recora", "data-lifecycle.ts");

assert.equal(dbContainerValue, expectedContainer, "Issue #113 verifier requires its dedicated local database container.");
if (!dbContainerValue) throw new Error("Issue #113 container guard failed.");
const dbContainer: string = dbContainerValue;

const migrationSql = fs.readFileSync(migrationPath, "utf8");
const resolverSource = fs.readFileSync(resolverPath, "utf8");

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = spawnSync(
    "docker",
    ["exec", "--interactive", dbContainer, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" }, input: sql, maxBuffer: 10 * 1024 * 1024, timeout: 60_000 }
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.error) throw result.error;
  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected local SQL to fail with ${expectedError}, but it succeeded.`);
    assert.match(sanitize(output), expectedError);
    return output;
  }
  assert.equal(result.status, 0, `Local SQL failed:\n${sanitize(output)}`);
  return output;
}

assert.match(migrationSql, /create table if not exists recora_private\.data_lifecycle_current/i);
assert.match(migrationSql, /create table if not exists recora_private\.data_lifecycle_events/i);
assert.match(migrationSql, /create table if not exists recora_private\.deletion_manifests/i);
assert.match(migrationSql, /create table if not exists recora_private\.deletion_attempts/i);
assert.match(migrationSql, /create table if not exists recora_private\.data_lifecycle_decision_evidence/i);
assert.match(migrationSql, /compute_deletion_manifest_hash/i);
assert.match(migrationSql, /if p_summary is null then return false/i);
assert.match(migrationSql, /exception when others then\s+return false/i);
assert.match(migrationSql, /retention_deadline_at is not null and retention_deadline_at > retention_started_at/i);
assert.match(migrationSql, /manifest_version is not null and manifest_version > 0/i);
assert.match(migrationSql, /attempt_outcome is not null and attempt_outcome in \('success', 'failed'\)/i);
assert.match(migrationSql, /attempt_failure_reason_code is not null and recora_private\.is_safe_lifecycle_reference\(attempt_failure_reason_code\)/i);
assert.match(migrationSql, /data_lifecycle_decision_evidence_shape check/i);
assert.match(migrationSql, /\) is true/i);
assert.match(migrationSql, /event_row\.next_state is distinct from 'retained'/i);
assert.match(migrationSql, /attempt_row\.outcome is distinct from new\.attempt_outcome/i);
assert.match(migrationSql, /'active', 'access_suspended', 'retained', 'deletion_scheduled'/i);
assert.match(migrationSql, /data_lifecycle\.transition/i);
assert.match(migrationSql, /security definer\s+set search_path = ''/i);
assert.match(migrationSql, /grant execute on function public\.recora_resolve_data_lifecycle_access/i);
assert.doesNotMatch(migrationSql, /delete\s+from\s+(?!recora_private\.deletion_)/i);
assert.match(resolverSource, /import "server-only"/);
assert.match(resolverSource, /resolveDataLifecycleAccess/);
assert.match(resolverSource, /createRecoraSupabaseServerClient/);
assert.match(resolverSource, /auth\.getUser\(\)/);
assert.match(resolverSource, /transitionDataLifecycle/);
assert.match(resolverSource, /setDataLifecycleLegalHold/);
assert.doesNotMatch(resolverSource, /authUserId:\s*string/);

queryLocal(`
do $verify$
begin
  if current_database() <> 'postgres' then raise exception 'Issue 113 requires isolated local database'; end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'recora_private' and c.relname = 'data_lifecycle_current' and c.relrowsecurity) then raise exception 'lifecycle current RLS missing'; end if;
  if has_table_privilege('anon', 'recora_private.data_lifecycle_current', 'SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated', 'recora_private.deletion_manifests', 'SELECT,INSERT,UPDATE,DELETE')
  then raise exception 'private lifecycle tables exposed'; end if;
  if has_function_privilege('anon', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_resolve_data_lifecycle_access(uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_transition_data_lifecycle(uuid,uuid,uuid,text,bigint,text,text,uuid,uuid,text,text,timestamptz,timestamptz,boolean,timestamptz,text,smallint,text,jsonb,timestamptz,timestamptz,text,text)', 'EXECUTE')
  then raise exception 'lifecycle RPC privilege boundary invalid'; end if;
end;
$verify$;
`);

queryLocal(`${migrationSql}\n${migrationSql}`);

queryLocal(`
begin;
insert into auth.users (id, email, created_at, updated_at) values
  ('11300000-0000-4000-8000-000000000001', 'issue-113-owner@example.invalid', now(), now()),
  ('11300000-0000-4000-8000-000000000002', 'issue-113-permissionless@example.invalid', now(), now()),
  ('11300000-0000-4000-8000-000000000003', 'issue-113-customer@example.invalid', now(), now());
insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo) values
  ('11310000-0000-4000-8000-000000000001', 'issue-113-organization-a', 'Issue 113 Organization A', 'client', 'local', false, false),
  ('11310000-0000-4000-8000-000000000002', 'issue-113-organization-b', 'Issue 113 Organization B', 'client', 'local', false, false);
insert into public.projects (id, organization_id, slug, name) values
  ('11320000-0000-4000-8000-000000000001', '11310000-0000-4000-8000-000000000001', 'issue-113-project-a', 'Issue 113 Project A'),
  ('11320000-0000-4000-8000-000000000002', '11310000-0000-4000-8000-000000000002', 'issue-113-project-b', 'Issue 113 Project B');
insert into public.organization_members (organization_id, user_id, email, role, invited_at, accepted_at, membership_status) values
  ('11310000-0000-4000-8000-000000000001', '11300000-0000-4000-8000-000000000003', 'issue-113-customer@example.invalid', 'member', now(), now(), 'active');
insert into recora_operator.operator_identities (id, auth_user_id, status, display_label) values
  ('11330000-0000-4000-8000-000000000001', '11300000-0000-4000-8000-000000000001', 'active', 'Issue 113 active operator'),
  ('11330000-0000-4000-8000-000000000002', '11300000-0000-4000-8000-000000000002', 'active', 'Issue 113 permissionless operator');
insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id) values
  ('11330000-0000-4000-8000-000000000001', 'data_lifecycle.transition', '11310000-0000-4000-8000-000000000001', null);

do $verify$
declare r record; payload jsonb;
begin
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001',
    p_project_id=>null, p_expected_state=>null, p_expected_version=>0, p_next_state=>'active', p_reason=>'issue_113_initialize',
    p_request_id=>'11340000-0000-4000-8000-000000000001', p_correlation_id=>'11350000-0000-4000-8000-000000000001');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 1 then raise exception 'initial active lifecycle failed'; end if;
  select to_jsonb(x) into payload from public.recora_resolve_data_lifecycle_access('11310000-0000-4000-8000-000000000001', null) x;
  if payload <> '{"reason_code":"active","restore_eligible":false,"new_measurement_allowed":true,"customer_access_allowed":true}'::jsonb then raise exception 'active resolver contract incorrect'; end if;
  if payload ? 'billing' or payload ? 'contract' or payload ? 'audit' or payload ? 'email' then raise exception 'resolver leaked non-lifecycle detail'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'active', p_expected_version=>1, p_next_state=>'retained', p_reason=>'issue_113_illegal_skip',
    p_request_id=>'11340000-0000-4000-8000-000000000002', p_correlation_id=>'11350000-0000-4000-8000-000000000002');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'transition_not_allowed' then raise exception 'illegal skip accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'active', p_expected_version=>1, p_next_state=>'access_suspended', p_reason=>'issue_113_suspend',
    p_request_id=>'11340000-0000-4000-8000-000000000003', p_correlation_id=>'11350000-0000-4000-8000-000000000003');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 2 then raise exception 'suspend failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'active', p_expected_version=>1, p_next_state=>'access_suspended', p_reason=>'issue_113_stale',
    p_request_id=>'11340000-0000-4000-8000-000000000004', p_correlation_id=>'11350000-0000-4000-8000-000000000004');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'state_conflict' then raise exception 'stale transition did not fail closed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'access_suspended', p_expected_version=>2, p_next_state=>'retained', p_reason=>'issue_113_bad_deadline',
    p_request_id=>'11340000-0000-4000-8000-000000000005', p_correlation_id=>'11350000-0000-4000-8000-000000000005',
    p_retention_policy_reference=>'retention_policy_v1', p_retention_policy_version_reference=>'retention_policy_version_v1',
    p_retention_started_at=>now(), p_retention_deadline_at=>now()-interval '1 second', p_restore_eligible=>false);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'retention_payload_invalid' then raise exception 'past deadline accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'access_suspended', p_expected_version=>2, p_next_state=>'retained', p_reason=>'issue_113_retain',
    p_request_id=>'11340000-0000-4000-8000-000000000006', p_correlation_id=>'11350000-0000-4000-8000-000000000006',
    p_retention_policy_reference=>'retention_policy_v1', p_retention_policy_version_reference=>'retention_policy_version_v1',
    p_retention_started_at=>now(), p_retention_deadline_at=>now()+interval '2 days', p_restore_eligible=>true, p_restore_deadline_at=>now()+interval '1 day');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 3 then raise exception 'retain failed'; end if;
  if (select customer_access_allowed or new_measurement_allowed or not restore_eligible from public.recora_resolve_data_lifecycle_access('11310000-0000-4000-8000-000000000001', null)) then raise exception 'retained resolver allowance incorrect'; end if;
  select * into r from public.recora_set_data_lifecycle_legal_hold(
    '11300000-0000-4000-8000-000000000001','11310000-0000-4000-8000-000000000001',null,3,'apply','issue_113_hold','hold_reason_v1',
    '11340000-0000-4000-8000-000000000007','11350000-0000-4000-8000-000000000007');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 4 then raise exception 'legal hold apply failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'retained', p_expected_version=>4, p_next_state=>'deletion_scheduled', p_reason=>'issue_113_hold_block',
    p_request_id=>'11340000-0000-4000-8000-000000000008', p_correlation_id=>'11350000-0000-4000-8000-000000000008');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'legal_hold_active' then raise exception 'legal hold did not block scheduling'; end if;
  select * into r from public.recora_set_data_lifecycle_legal_hold(
    '11300000-0000-4000-8000-000000000001','11310000-0000-4000-8000-000000000001',null,4,'release','issue_113_release',null,
    '11340000-0000-4000-8000-000000000009','11350000-0000-4000-8000-000000000009');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 5 then raise exception 'legal hold release failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'retained', p_expected_version=>5, p_next_state=>'deletion_scheduled', p_reason=>'issue_113_schedule',
    p_request_id=>'11340000-0000-4000-8000-000000000010', p_correlation_id=>'11350000-0000-4000-8000-000000000010',
    p_manifest_identifier=>'manifest_issue_113_v1', p_manifest_version=>1::smallint,
    p_manifest_summary=>jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',0))),
    p_manifest_hash=>recora_private.compute_deletion_manifest_hash('manifest_issue_113_v1',1::smallint,'11310000-0000-4000-8000-000000000001',null,jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',0)))));
  if r.outcome::text <> 'success' or r.lifecycle_version <> 6 then raise exception 'schedule failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'deletion_scheduled', p_expected_version=>6, p_next_state=>'deleting', p_reason=>'issue_113_start',
    p_request_id=>'11340000-0000-4000-8000-000000000011', p_correlation_id=>'11350000-0000-4000-8000-000000000011');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 7 then raise exception 'selected manifest did not start deleting'; end if;
  -- Manifest creation now occurs at deletion_scheduled; start consumes the explicit current selection.
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'deleting', p_expected_version=>7, p_next_state=>'deleted', p_reason=>'issue_113_missing_attempt',
    p_request_id=>'11340000-0000-4000-8000-000000000013', p_correlation_id=>'11350000-0000-4000-8000-000000000013');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'attempt_payload_invalid' then raise exception 'deleted without success attempt accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'deleting', p_expected_version=>7, p_next_state=>'deletion_failed', p_reason=>'issue_113_attempt_failed',
    p_request_id=>'11340000-0000-4000-8000-000000000014', p_correlation_id=>'11350000-0000-4000-8000-000000000014',
    p_attempt_started_at=>now()-interval '2 minutes', p_attempt_finished_at=>now()-interval '1 minute', p_attempt_outcome=>'failed', p_attempt_failure_reason_code=>'retryable_timeout');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 8 then raise exception 'failed attempt history missing'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'deletion_failed', p_expected_version=>8, p_next_state=>'deleting', p_reason=>'issue_113_retry',
    p_request_id=>'11340000-0000-4000-8000-000000000015', p_correlation_id=>'11350000-0000-4000-8000-000000000015',
    p_manifest_identifier=>'manifest_issue_113_v2', p_manifest_version=>2::smallint,
    p_manifest_summary=>jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',1))),
    p_manifest_hash=>recora_private.compute_deletion_manifest_hash('manifest_issue_113_v2',2::smallint,'11310000-0000-4000-8000-000000000001',null,jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',1)))));
  if r.outcome::text <> 'success' or r.lifecycle_version <> 9 then raise exception 'retry transition failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>'deleting', p_expected_version=>9, p_next_state=>'deleted', p_reason=>'issue_113_attempt_success',
    p_request_id=>'11340000-0000-4000-8000-000000000016', p_correlation_id=>'11350000-0000-4000-8000-000000000016',
    p_attempt_started_at=>now()-interval '1 minute', p_attempt_finished_at=>now(), p_attempt_outcome=>'success');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 10 then raise exception 'success attempt did not permit deleted'; end if;
  if (select count(*) from recora_private.deletion_attempts) <> 2 then raise exception 'retry attempt history lost'; end if;
  begin update recora_private.data_lifecycle_events set reason='mutation' where lifecycle_id=r.lifecycle_id; raise exception 'event mutation accepted'; exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;
  begin delete from recora_private.deletion_manifests where lifecycle_id=r.lifecycle_id; raise exception 'manifest mutation accepted'; exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;
  begin update recora_private.deletion_attempts set outcome='failed' where manifest_id in (select id from recora_private.deletion_manifests where lifecycle_id=r.lifecycle_id); raise exception 'attempt mutation accepted'; exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000002', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>null, p_expected_version=>0, p_next_state=>'active', p_reason=>'issue_113_permission',
    p_request_id=>'11340000-0000-4000-8000-000000000017', p_correlation_id=>'11350000-0000-4000-8000-000000000017');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'permission_denied' then raise exception 'permissionless operator accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000002', p_project_id=>'11320000-0000-4000-8000-000000000001',
    p_expected_state=>null, p_expected_version=>0, p_next_state=>'active', p_reason=>'issue_113_cross_tenant',
    p_request_id=>'11340000-0000-4000-8000-000000000018', p_correlation_id=>'11350000-0000-4000-8000-000000000018');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'target_scope_mismatch' then raise exception 'cross-tenant project accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000003', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>null, p_expected_version=>0, p_next_state=>'active', p_reason=>'issue_113_customer',
    p_request_id=>'11340000-0000-4000-8000-000000000019', p_correlation_id=>'11350000-0000-4000-8000-000000000019');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'operator_not_registered' then raise exception 'customer accepted as operator'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>null, p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>null,
    p_expected_state=>null, p_expected_version=>0, p_next_state=>'active', p_reason=>'issue_113_anonymous',
    p_request_id=>'11340000-0000-4000-8000-000000000020', p_correlation_id=>'11350000-0000-4000-8000-000000000020');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'operator_identity_required' then raise exception 'anonymous command accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>'11320000-0000-4000-8000-000000000001',
    p_expected_state=>null, p_expected_version=>0, p_next_state=>'active', p_reason=>'issue_113_project_initialize',
    p_request_id=>'11340000-0000-4000-8000-000000000021', p_correlation_id=>'11350000-0000-4000-8000-000000000021');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 1 then raise exception 'project lifecycle initialize failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>'11320000-0000-4000-8000-000000000001',
    p_expected_state=>'active', p_expected_version=>1, p_next_state=>'access_suspended', p_reason=>'issue_113_project_suspend',
    p_request_id=>'11340000-0000-4000-8000-000000000022', p_correlation_id=>'11350000-0000-4000-8000-000000000022');
  if r.outcome::text <> 'success' then raise exception 'project suspend failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>'11320000-0000-4000-8000-000000000001',
    p_expected_state=>'access_suspended', p_expected_version=>2, p_next_state=>'retained', p_reason=>'issue_113_project_retain',
    p_request_id=>'11340000-0000-4000-8000-000000000023', p_correlation_id=>'11350000-0000-4000-8000-000000000023',
    p_retention_policy_reference=>'retention_policy_project_v1', p_retention_policy_version_reference=>'retention_policy_project_version_v1',
    p_retention_started_at=>now(), p_retention_deadline_at=>now()+interval '2 days', p_restore_eligible=>true,
    p_restore_deadline_at=>clock_timestamp()+interval '20 milliseconds');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 3 then raise exception 'project retained fixture failed'; end if;
  perform pg_sleep(0.05);
  if (select restore_eligible from public.recora_resolve_data_lifecycle_access('11310000-0000-4000-8000-000000000001','11320000-0000-4000-8000-000000000001')) then raise exception 'expired restore deadline remained eligible'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000001', p_organization_id=>'11310000-0000-4000-8000-000000000001', p_project_id=>'11320000-0000-4000-8000-000000000001',
    p_expected_state=>'retained', p_expected_version=>3, p_next_state=>'active', p_reason=>'issue_113_expired_restore',
    p_request_id=>'11340000-0000-4000-8000-000000000024', p_correlation_id=>'11350000-0000-4000-8000-000000000024');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'restore_not_eligible' then raise exception 'expired restore accepted'; end if;
end;
$verify$;
rollback;
`);

queryLocal(`begin; set local role authenticated; select * from public.recora_transition_data_lifecycle(null,null,null,null,0,'active','bypass',gen_random_uuid(),gen_random_uuid());`, /permission denied/i);
queryLocal(`begin; set local role anon; select * from public.recora_resolve_data_lifecycle_access(null, null);`, /permission denied/i);

queryLocal(`
begin;
insert into auth.users (id, email, created_at, updated_at)
values ('11300000-0000-4000-8000-000000000004', 'issue-113-owner-expanded@example.invalid', now(), now());
insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
values ('11310000-0000-4000-8000-000000000003', 'issue-113-expanded', 'Issue 113 Expanded', 'client', 'local', false, false);
insert into recora_operator.operator_identities (id, auth_user_id, status, display_label)
values ('11330000-0000-4000-8000-000000000003', '11300000-0000-4000-8000-000000000004', 'active', 'Issue 113 expanded operator');
insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id)
values ('11330000-0000-4000-8000-000000000003', 'data_lifecycle.transition', '11310000-0000-4000-8000-000000000003', null);

do $verify$
declare
  r record; lifecycle_scope_id uuid; before_evidence jsonb; after_evidence jsonb;
  summary jsonb := jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',0)));
  tampered jsonb := jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',1)));
  h1 text; h2 text; h3 text; manifest_count integer; lifecycle_version_before bigint; evidence_count integer; attempt_count integer; event_count integer;
  invalid_summary jsonb; manifest_v2_id uuid; manifest_v3_id uuid; failed_attempt_id uuid; success_attempt_id uuid; event_id uuid;
begin
  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,null,0,'active','issue_113_expanded_init',
    '11341000-0000-4000-8000-000000000001','11351000-0000-4000-8000-000000000001');
  if r.outcome::text <> 'success' or r.lifecycle_version <> 1 then raise exception 'expanded init failed'; end if;
  lifecycle_scope_id := r.lifecycle_id;

  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,'active',1,null,'issue_113_null_next',
    '11341000-0000-4000-8000-000000000002','11351000-0000-4000-8000-000000000002');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'next_state_invalid'
    or (select version from recora_private.data_lifecycle_current where id=lifecycle_scope_id) <> 1
  then raise exception 'NULL next state was not fail-closed'; end if;

  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,'active',1,'access_suspended','issue_113_suspend',
    '11341000-0000-4000-8000-000000000003','11351000-0000-4000-8000-000000000003');
  if r.lifecycle_version <> 2 then raise exception 'suspend failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'access_suspended',p_expected_version=>2,p_next_state=>'retained',p_reason=>'issue_113_partial_retention',
    p_request_id=>'11341000-0000-4000-8000-000000000004',p_correlation_id=>'11351000-0000-4000-8000-000000000004',
    p_retention_policy_reference=>'policy_v1',p_retention_started_at=>now(),p_retention_deadline_at=>now()+interval '2 days',p_restore_eligible=>false);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'retention_payload_invalid' then raise exception 'partial retention accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'access_suspended',p_expected_version=>2,p_next_state=>'retained',p_reason=>'issue_113_invalid_restore',
    p_request_id=>'11341000-0000-4000-8000-000000000005',p_correlation_id=>'11351000-0000-4000-8000-000000000005',
    p_retention_policy_reference=>'policy_v1',p_retention_policy_version_reference=>'policy_version_v1',p_retention_started_at=>now(),p_retention_deadline_at=>now()+interval '2 days',p_restore_eligible=>true);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'retention_payload_invalid' then raise exception 'invalid restore pair accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'access_suspended',p_expected_version=>2,p_next_state=>'retained',p_reason=>'issue_113_retain_v1',
    p_request_id=>'11341000-0000-4000-8000-000000000006',p_correlation_id=>'11351000-0000-4000-8000-000000000006',
    p_retention_policy_reference=>'policy_v1',p_retention_policy_version_reference=>'policy_version_v1',p_retention_started_at=>now(),p_retention_deadline_at=>now()+interval '2 days',p_restore_eligible=>true,p_restore_deadline_at=>now()+interval '1 day');
  if r.lifecycle_version <> 3 then raise exception 'retain v1 failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,'retained',3,'active','issue_113_restore',
    '11341000-0000-4000-8000-000000000007','11351000-0000-4000-8000-000000000007');
  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,'active',4,'access_suspended','issue_113_resuspend',
    '11341000-0000-4000-8000-000000000008','11351000-0000-4000-8000-000000000008');
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'access_suspended',p_expected_version=>5,p_next_state=>'retained',p_reason=>'issue_113_retain_v2',
    p_request_id=>'11341000-0000-4000-8000-000000000009',p_correlation_id=>'11351000-0000-4000-8000-000000000009',
    p_retention_policy_reference=>'policy_v2',p_retention_policy_version_reference=>'policy_version_v2',p_retention_started_at=>now(),p_retention_deadline_at=>now()+interval '3 days',p_restore_eligible=>false);
  if r.lifecycle_version <> 6 or (select count(*) from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id and decision_kind='retention') <> 2
    or not exists (select 1 from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id and retention_policy_reference='policy_v1')
    or not exists (select 1 from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id and retention_policy_reference='policy_v2')
  then raise exception 'retain/restore/re-retain evidence missing'; end if;

  select * into r from public.recora_set_data_lifecycle_legal_hold(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,6,'apply','issue_113_hold_apply_v1','hold_reason_v1',
    '11341000-0000-4000-8000-000000000010','11351000-0000-4000-8000-000000000010');
  select * into r from public.recora_set_data_lifecycle_legal_hold(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,7,'release','issue_113_hold_release_v1',null,
    '11341000-0000-4000-8000-000000000011','11351000-0000-4000-8000-000000000011');
  select * into r from public.recora_set_data_lifecycle_legal_hold(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,8,'apply','issue_113_hold_apply_v2','hold_reason_v2',
    '11341000-0000-4000-8000-000000000012','11351000-0000-4000-8000-000000000012');
  select * into r from public.recora_set_data_lifecycle_legal_hold(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,9,'release','issue_113_hold_release_v2',null,
    '11341000-0000-4000-8000-000000000013','11351000-0000-4000-8000-000000000013');
  if r.lifecycle_version <> 10 or (select count(*) from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id and decision_kind='legal_hold') <> 4
    or not exists (select 1 from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id and legal_hold_reason_reference='hold_reason_v1')
    or not exists (select 1 from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id and legal_hold_reason_reference='hold_reason_v2')
  then raise exception 'legal hold decision evidence missing'; end if;

  h1 := recora_private.compute_deletion_manifest_hash('owner_manifest_v1',1::smallint,'11310000-0000-4000-8000-000000000003',null,summary);
  h2 := recora_private.compute_deletion_manifest_hash('owner_manifest_v2',2::smallint,'11310000-0000-4000-8000-000000000003',null,summary);
  h3 := recora_private.compute_deletion_manifest_hash('owner_manifest_v3',3::smallint,'11310000-0000-4000-8000-000000000003',null,summary);
  select count(*) into manifest_count from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id;
  select version into lifecycle_version_before from recora_private.data_lifecycle_current where id=lifecycle_scope_id;
  select count(*) into evidence_count from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id;
  select count(*) into attempt_count from recora_private.deletion_attempts where manifest_id in (select id from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id);
  select count(*) into event_count from recora_private.data_lifecycle_events where lifecycle_id=lifecycle_scope_id;
  for invalid_summary in
    select invalid.summary from (values
      (null::jsonb), ('{}'::jsonb), ('[]'::jsonb), (to_jsonb('summary'::text)), (to_jsonb(1)), (to_jsonb(true::boolean)),
      (jsonb_build_object('schema_version',1,'categories',null)),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_object('unexpected',true))),
      (jsonb_build_object('schema_version',1,'categories',to_jsonb('wrong'::text))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(null))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(to_jsonb('wrong'::text)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(to_jsonb(1)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_array('nested')))),
      (jsonb_build_object('schema_version',1,'categories',summary->'categories','unexpected',true)),
      (jsonb_build_object('schema_version',1)),
      (jsonb_build_object('categories',summary->'categories')),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',0,'unexpected',true)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence')))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('count',0)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',-1)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',0.5)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',1000000000)))),
      (jsonb_build_object('schema_version',1,'categories',jsonb_build_array(jsonb_build_object('category','measurement_evidence','count',0),jsonb_build_object('category','measurement_evidence','count',1))))
    ) as invalid(summary)
  loop
    if recora_private.is_valid_deletion_manifest_summary(invalid_summary) is not false then raise exception 'invalid manifest summary validator accepted'; end if;
    select * into r from public.recora_transition_data_lifecycle(
      p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
      p_expected_state=>'retained',p_expected_version=>lifecycle_version_before,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_bad_summary',
      p_request_id=>gen_random_uuid(),p_correlation_id=>gen_random_uuid(),p_manifest_identifier=>'owner_manifest_invalid',p_manifest_version=>1::smallint,
      p_manifest_hash=>repeat('0',64),p_manifest_summary=>invalid_summary);
    if r.outcome::text <> 'denied' or r.failure_reason_code <> 'manifest_payload_invalid'
      or (select count(*) from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id) <> manifest_count
      or (select version from recora_private.data_lifecycle_current where id=lifecycle_scope_id) <> lifecycle_version_before
      or (select count(*) from recora_private.deletion_attempts where manifest_id in (select id from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id)) <> attempt_count
      or (select count(*) from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id) <> evidence_count
      or (select count(*) from recora_private.data_lifecycle_events where lifecycle_id=lifecycle_scope_id) <> event_count
    then raise exception 'invalid manifest summary did not fail closed'; end if;
  end loop;
  select * into r from public.recora_transition_data_lifecycle(    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'retained',p_expected_version=>10,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_partial_manifest',
    p_request_id=>'11341000-0000-4000-8000-000000000014',p_correlation_id=>'11351000-0000-4000-8000-000000000014',p_manifest_identifier=>'owner_manifest_partial');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'manifest_payload_invalid' or (select count(*) from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id) <> manifest_count then raise exception 'partial manifest accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'retained',p_expected_version=>10,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_hash_mismatch',
    p_request_id=>'11341000-0000-4000-8000-000000000015',p_correlation_id=>'11351000-0000-4000-8000-000000000015',
    p_manifest_identifier=>'owner_manifest_v1',p_manifest_version=>1::smallint,p_manifest_hash=>h1,p_manifest_summary=>tampered);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'manifest_hash_mismatch' then raise exception 'hash mismatch accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'retained',p_expected_version=>10,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_bad_version',
    p_request_id=>'11341000-0000-4000-8000-000000000016',p_correlation_id=>'11351000-0000-4000-8000-000000000016',
    p_manifest_identifier=>'owner_manifest_v2',p_manifest_version=>2::smallint,p_manifest_hash=>h2,p_manifest_summary=>summary);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'manifest_version_invalid' then raise exception 'forward version accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'retained',p_expected_version=>10,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_schedule_v1',
    p_request_id=>'11341000-0000-4000-8000-000000000017',p_correlation_id=>'11351000-0000-4000-8000-000000000017',
    p_manifest_identifier=>'owner_manifest_v1',p_manifest_version=>1::smallint,p_manifest_hash=>h1,p_manifest_summary=>summary);
  if r.lifecycle_version <> 11 then raise exception 'manifest v1 schedule failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,'deletion_scheduled',11,'retained','issue_113_unschedule',
    '11341000-0000-4000-8000-000000000018','11351000-0000-4000-8000-000000000018');
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'retained',p_expected_version=>12,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_duplicate_version',
    p_request_id=>'11341000-0000-4000-8000-000000000019',p_correlation_id=>'11351000-0000-4000-8000-000000000019',
    p_manifest_identifier=>'owner_manifest_v1_reused',p_manifest_version=>1::smallint,p_manifest_hash=>recora_private.compute_deletion_manifest_hash('owner_manifest_v1_reused',1::smallint,'11310000-0000-4000-8000-000000000003',null,summary),p_manifest_summary=>summary);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'manifest_version_invalid' then raise exception 'duplicate/reverse version accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'retained',p_expected_version=>12,p_next_state=>'deletion_scheduled',p_reason=>'issue_113_schedule_v2',
    p_request_id=>'11341000-0000-4000-8000-000000000020',p_correlation_id=>'11351000-0000-4000-8000-000000000020',
    p_manifest_identifier=>'owner_manifest_v2',p_manifest_version=>2::smallint,p_manifest_hash=>h2,p_manifest_summary=>summary);
  select * into r from public.recora_transition_data_lifecycle(
    '11300000-0000-4000-8000-000000000004','11310000-0000-4000-8000-000000000003',null,'deletion_scheduled',13,'deleting','issue_113_start_v2',
    '11341000-0000-4000-8000-000000000021','11351000-0000-4000-8000-000000000021');
  if r.lifecycle_version <> 14 then raise exception 'selected v2 start failed'; end if;

  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deleting',p_expected_version=>14,p_next_state=>'deletion_failed',p_reason=>'issue_113_null_attempt',
    p_request_id=>'11341000-0000-4000-8000-000000000022',p_correlation_id=>'11351000-0000-4000-8000-000000000022',p_attempt_started_at=>now()-interval '2 minutes',p_attempt_finished_at=>now()-interval '1 minute');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'attempt_payload_invalid' then raise exception 'NULL attempt outcome accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deleting',p_expected_version=>14,p_next_state=>'deleted',p_reason=>'issue_113_outcome_only',
    p_request_id=>'11341000-0000-4000-8000-000000000023',p_correlation_id=>'11351000-0000-4000-8000-000000000023',p_attempt_outcome=>'success');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'attempt_payload_invalid' then raise exception 'partial attempt accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deleting',p_expected_version=>14,p_next_state=>'deleted',p_reason=>'issue_113_success_failure',
    p_request_id=>'11341000-0000-4000-8000-000000000024',p_correlation_id=>'11351000-0000-4000-8000-000000000024',p_attempt_started_at=>now()-interval '2 minutes',p_attempt_finished_at=>now()-interval '1 minute',p_attempt_outcome=>'success',p_attempt_failure_reason_code=>'not_allowed');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'attempt_payload_invalid' then raise exception 'success/failure mismatch accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deleting',p_expected_version=>14,p_next_state=>'deletion_failed',p_reason=>'issue_113_failed_no_code',
    p_request_id=>'11341000-0000-4000-8000-000000000025',p_correlation_id=>'11351000-0000-4000-8000-000000000025',p_attempt_started_at=>now()-interval '2 minutes',p_attempt_finished_at=>now()-interval '1 minute',p_attempt_outcome=>'failed');
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'attempt_payload_invalid' then raise exception 'failed without code accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deleting',p_expected_version=>14,p_next_state=>'deletion_failed',p_reason=>'issue_113_failed_v2',
    p_request_id=>'11341000-0000-4000-8000-000000000026',p_correlation_id=>'11351000-0000-4000-8000-000000000026',p_attempt_started_at=>now()-interval '2 minutes',p_attempt_finished_at=>now()-interval '1 minute',p_attempt_outcome=>'failed',p_attempt_failure_reason_code=>'retryable_timeout');
  if r.lifecycle_version <> 15 then raise exception 'valid v2 attempt failed'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deletion_failed',p_expected_version=>15,p_next_state=>'deleting',p_reason=>'issue_113_stale_retry',
    p_request_id=>'11341000-0000-4000-8000-000000000027',p_correlation_id=>'11351000-0000-4000-8000-000000000027',
    p_manifest_identifier=>'owner_manifest_v2_reused',p_manifest_version=>2::smallint,p_manifest_hash=>recora_private.compute_deletion_manifest_hash('owner_manifest_v2_reused',2::smallint,'11310000-0000-4000-8000-000000000003',null,summary),p_manifest_summary=>summary);
  if r.outcome::text <> 'denied' or r.failure_reason_code <> 'manifest_version_invalid' then raise exception 'stale manifest reuse accepted'; end if;
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deletion_failed',p_expected_version=>15,p_next_state=>'deleting',p_reason=>'issue_113_retry_v3',
    p_request_id=>'11341000-0000-4000-8000-000000000028',p_correlation_id=>'11351000-0000-4000-8000-000000000028',
    p_manifest_identifier=>'owner_manifest_v3',p_manifest_version=>3::smallint,p_manifest_hash=>h3,p_manifest_summary=>summary);
  select * into r from public.recora_transition_data_lifecycle(
    p_auth_user_id=>'11300000-0000-4000-8000-000000000004',p_organization_id=>'11310000-0000-4000-8000-000000000003',p_project_id=>null,
    p_expected_state=>'deleting',p_expected_version=>16,p_next_state=>'deleted',p_reason=>'issue_113_success_v3',
    p_request_id=>'11341000-0000-4000-8000-000000000029',p_correlation_id=>'11351000-0000-4000-8000-000000000029',p_attempt_started_at=>now()-interval '1 minute',p_attempt_finished_at=>now(),p_attempt_outcome=>'success');
  if r.lifecycle_version <> 17
    or not exists (select 1 from recora_private.data_lifecycle_decision_evidence evidence join recora_private.deletion_attempts attempt on attempt.id=evidence.attempt_id join recora_private.deletion_manifests manifest on manifest.id=evidence.manifest_id where evidence.lifecycle_id=lifecycle_scope_id and evidence.lifecycle_version=17 and manifest.manifest_version=3 and attempt.manifest_id=manifest.id)
    or (select count(*) from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id) <> 3
  then raise exception 'selected manifest/attempt history invalid'; end if;

  select count(*) into evidence_count from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id;
  select count(*) into event_count from recora_private.data_lifecycle_events where lifecycle_id=lifecycle_scope_id;
  select id into manifest_v2_id from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id and manifest_version=2;
  select id into manifest_v3_id from recora_private.deletion_manifests where lifecycle_id=lifecycle_scope_id and manifest_version=3;
  select attempt.id into failed_attempt_id from recora_private.deletion_attempts attempt join recora_private.deletion_manifests manifest on manifest.id=attempt.manifest_id where manifest.lifecycle_id=lifecycle_scope_id and attempt.outcome='failed' order by attempt.attempt_number desc limit 1;
  select attempt.id into success_attempt_id from recora_private.deletion_attempts attempt join recora_private.deletion_manifests manifest on manifest.id=attempt.manifest_id where manifest.lifecycle_id=lifecycle_scope_id and attempt.outcome='success' order by attempt.attempt_number desc limit 1;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','access_suspended','retained',101,'11330000-0000-4000-8000-000000000003','issue_113_evidence_retention',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,retention_policy_reference,retention_policy_version_reference,retention_started_at,retention_deadline_at,restore_eligible)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,101,event_id,'retention','policy_v2','policy_version_v2',now(),null,false);
    raise exception 'retention deadline NULL decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','retained','deletion_scheduled',102,'11330000-0000-4000-8000-000000000003','issue_113_evidence_manifest_null',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,102,event_id,'deletion_scheduled',manifest_v3_id,null);
    raise exception 'manifest ID with NULL version decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deleted',103,'11330000-0000-4000-8000-000000000003','issue_113_evidence_attempt_null',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,103,event_id,'deletion_attempt',manifest_v3_id,3,success_attempt_id,null);
    raise exception 'attempt ID with NULL outcome decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deletion_failed',104,'11330000-0000-4000-8000-000000000003','issue_113_evidence_failure_null',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome,attempt_failure_reason_code)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,104,event_id,'deletion_attempt',manifest_v2_id,2,failed_attempt_id,'failed',null);
    raise exception 'failed outcome with NULL failure code decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','retained','deleting',105,'11330000-0000-4000-8000-000000000003','issue_113_evidence_event_mismatch',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,retention_policy_reference,retention_policy_version_reference,retention_started_at,retention_deadline_at,restore_eligible)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,105,event_id,'retention','policy_v2','policy_version_v2',now(),now()+interval '2 days',false);
    raise exception 'decision kind event mismatch accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','retained','deletion_scheduled',106,'11330000-0000-4000-8000-000000000003','issue_113_evidence_manifest_version',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,106,event_id,'deletion_scheduled',manifest_v3_id,2);
    raise exception 'manifest version mismatch decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deleted',107,'11330000-0000-4000-8000-000000000003','issue_113_evidence_attempt_outcome',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome,attempt_failure_reason_code)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,107,event_id,'deletion_attempt',manifest_v2_id,2,failed_attempt_id,'success',null);
    raise exception 'attempt outcome mismatch decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  if (select count(*) from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id) <> evidence_count then raise exception 'invalid decision evidence left residue'; end if;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deleted',108,'11330000-0000-4000-8000-000000000003','issue_113_evidence_attempt_manifest_null',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,108,event_id,'deletion_attempt',manifest_v3_id,null,success_attempt_id,'success');
    raise exception 'attempt manifest version NULL decision evidence accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','active','retained',109,'11330000-0000-4000-8000-000000000003','issue_113_evidence_legal_event_kind',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,legal_hold_action,legal_hold_reason_reference)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,109,event_id,'legal_hold','apply','hold_reason_v2');
    raise exception 'legal hold event kind mismatch accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deletion_failed',110,'11330000-0000-4000-8000-000000000003','issue_113_evidence_success_failed',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,110,event_id,'deletion_attempt',manifest_v3_id,3,success_attempt_id,'success');
    raise exception 'success attempt linked to deletion failed accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deleted',111,'11330000-0000-4000-8000-000000000003','issue_113_evidence_failed_deleted',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome,attempt_failure_reason_code)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,111,event_id,'deletion_attempt',manifest_v2_id,2,failed_attempt_id,'failed','retryable_timeout');
    raise exception 'failed attempt linked to deleted accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deletion_failed',112,'11330000-0000-4000-8000-000000000003','issue_113_evidence_attempt_manifest_link',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome,attempt_failure_reason_code)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,112,event_id,'deletion_attempt',manifest_v3_id,3,failed_attempt_id,'failed','retryable_timeout');
    raise exception 'attempt manifest linkage mismatch accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;
  begin
    insert into recora_private.data_lifecycle_events (lifecycle_id,organization_id,project_id,event_kind,previous_state,next_state,version,actor_operator_id,reason,request_id,correlation_id)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,'state_transition','deleting','deleted',113,'11330000-0000-4000-8000-000000000003','issue_113_evidence_lifecycle_version',gen_random_uuid(),gen_random_uuid()) returning id into event_id;
    insert into recora_private.data_lifecycle_decision_evidence (lifecycle_id,organization_id,project_id,lifecycle_version,event_id,decision_kind,manifest_id,manifest_version,attempt_id,attempt_outcome)
    values (lifecycle_scope_id,'11310000-0000-4000-8000-000000000003',null,114,event_id,'deletion_attempt',manifest_v3_id,3,success_attempt_id,'success');
    raise exception 'lifecycle version linkage mismatch accepted';
  exception when others then if sqlerrm ~ 'accepted$' then raise; end if; end;

  if (select count(*) from recora_private.data_lifecycle_decision_evidence where lifecycle_id=lifecycle_scope_id) <> evidence_count
    or (select count(*) from recora_private.data_lifecycle_events where lifecycle_id=lifecycle_scope_id) <> event_count
  then raise exception 'invalid decision evidence left residue'; end if;
  select jsonb_agg(to_jsonb(evidence) order by evidence.lifecycle_version) into before_evidence from recora_private.data_lifecycle_decision_evidence evidence where lifecycle_id=lifecycle_scope_id;
  update recora_private.data_lifecycle_current set last_correlation_id=gen_random_uuid() where id=lifecycle_scope_id;
  select jsonb_agg(to_jsonb(evidence) order by evidence.lifecycle_version) into after_evidence from recora_private.data_lifecycle_decision_evidence evidence where lifecycle_id=lifecycle_scope_id;
  if before_evidence is distinct from after_evidence then raise exception 'current update mutated decision evidence'; end if;
  begin update recora_private.data_lifecycle_decision_evidence set decision_kind='retention' where lifecycle_id=lifecycle_scope_id;
    raise exception 'decision evidence mutation accepted';
  exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;
end;
$verify$;
rollback;
`);

console.log(JSON.stringify({ status: "ok", database: "isolated-local-only", container: dbContainer, migration: path.relative(repoRoot, migrationPath), cases: { stateChain: "validated", holdsAndRestore: "validated", manifestAndAttempts: "append-only", access: "fail-closed", scopeAndRoles: "rejected", replay: "idempotent" } }, null, 2));