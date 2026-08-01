import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { Phase4AccountAccessRpcTransport } from "../lib/recora/phase4-account-access";

type Phase4AccountAccessModule = typeof import("../lib/recora/phase4-account-access");

const repoRoot = process.cwd();
const dbContainer = process.env.RECORA_ISSUE_122_DB_CONTAINER;
const expectedContainer = "supabase_db_recoraissue122p4b";
const migrationPath = path.join(repoRoot, "supabase", "migrations", "20260731203135_p4b_account_invitation_membership_rpcs.sql");
const tsModulePath = path.join(repoRoot, "lib", "recora", "phase4-account-access.ts");
const configPath = path.join(repoRoot, "supabase", "config.toml");

assert.equal(dbContainer, expectedContainer, "Issue #122 requires only its isolated local DB container.");
assert.ok(fs.existsSync(migrationPath), "P4-B migration is missing.");
assert.ok(fs.existsSync(tsModulePath), "P4-B server-only module is missing.");

const migrationSql = fs.readFileSync(migrationPath, "utf8");
const moduleSource = fs.readFileSync(tsModulePath, "utf8");
const configSource = fs.readFileSync(configPath, "utf8");

for (const forbidden of [
  /create\s+table/i,
  /create\s+type/i,
  /create\s+(unique\s+)?index/i,
  /create\s+policy/i,
  /enable\s+row\s+level\s+security/i,
  /auth\.admin/i,
  /send(email|_email)|send_email|smtp|mailgun|postmark|resend\.emails/i,
]) {
  assert.doesNotMatch(migrationSql, forbidden, `migration contains forbidden pattern ${forbidden}`);
}

assert.match(migrationSql, /alter type recora_private\.p4_source_kind add value if not exists 'customer_session'/i, "customer_session source kind migration is missing.");
assert.equal(migrationSql.match(/alter\s+table/gi)?.length ?? 0, 1, "only the approved P4-B actor-evidence ALTER TABLE is allowed.");
assert.match(migrationSql, /alter table recora_private\.p4_command_receipts[\s\S]*customer_auth_user_id uuid references auth\.users\(id\)[\s\S]*p4_command_receipt_actor_shape/i, "customer auth actor evidence column/shape constraint is missing.");
assert.doesNotMatch(configSource, /schemas\s*=\s*\[[^\]]*recora_private/i, "recora_private must not be exposed through the Data API config.");
assert.match(moduleSource, /import "server-only";/, "P4-B module must be server-only.");
assert.doesNotMatch(moduleSource, /process\.env|createRecoraSupabaseServiceRoleClient|from\(|recora_private/i, "P4-B module must use injected RPC transport and no direct SQL/private-table access.");
assert.match(moduleSource, /Phase4CustomerAccessDto/, "customer-safe DTO type is missing.");
const domainDenialFunctionSql = extractSqlFunction(migrationSql, "recora_private.p4b_record_operator_domain_denial");
const acceptFunctionSql = extractSqlFunction(migrationSql, "public.recora_p4b_invitation_accept");
const customerSessionFunctionSql = extractSqlFunction(migrationSql, "recora_private.p4b_record_customer_session_p4_command");
const authEmailFunctionSql = extractSqlFunction(migrationSql, "recora_private.p4b_confirmed_auth_email_hash");
const acceptWrapperSource = extractSourceFunction(moduleSource, "acceptPhase4Invitation");
assert.match(acceptFunctionSql, /auth\.uid\(\)/, "accept RPC must use auth.uid().");
assert.match(acceptFunctionSql, /p4b_confirmed_auth_email_hash/, "accept RPC must delegate recipient verification to the DB email-binding helper.");
assert.match(customerSessionFunctionSql, /p4_assert_legacy_inventory\(\)/, "customer-session receipt helper must enforce the P4-A legacy inventory gate.");
assert.match(domainDenialFunctionSql, /p4b_authorize_operator/);
assert.match(domainDenialFunctionSql, /p4b_record_operator_denial/);
assert.match(migrationSql, /p4b_record_operator_domain_denial\(uuid, uuid, text, text, text, uuid, text, text, uuid, uuid, jsonb, jsonb\) from public, anon, authenticated, service_role/i, "domain denial helper must be private to the migration.");
assert.match(migrationSql, /operator_receipt_conflict[\s\S]*'failed'::recora_audit\.operator_audit_outcome/i, "operator receipt failures must retain failed audit evidence.");
assert.match(authEmailFunctionSql, /email_confirmed_at is not null/i, "accept RPC helper must require email_confirmed_at.");
assert.doesNotMatch(authEmailFunctionSql, /user_row\.confirmed_at is not null/i, "accept RPC helper must not trust confirmed_at.");
assert.doesNotMatch(acceptFunctionSql, /p_verified_auth_user_id|p_recipient_binding_hash/, "accept RPC must not take claimed user id or binding hash.");
assert.doesNotMatch(acceptWrapperSource, /verifiedAuthUserId|recipientBindingHash|p_verified_auth_user_id|p_recipient_binding_hash/, "accept wrapper must not accept claimed user id or binding hash.");

for (const functionName of [
  "recora_p4b_invitation_create",
  "recora_p4b_invitation_resend",
  "recora_p4b_invitation_revoke",
  "recora_p4b_membership_suspend",
  "recora_p4b_membership_reactivate",
  "recora_p4b_membership_revoke",
  "recora_p4b_resolve_customer_access",
]) {
  assert.match(migrationSql, new RegExp(`create or replace function public\\.${functionName}`), `${functionName} is missing.`);
  assert.match(migrationSql, new RegExp(`public\\.${functionName}[\\s\\S]*security definer[\\s\\S]*set search_path = ''`, "i"), `${functionName} must be SECURITY DEFINER with empty search_path.`);
  assert.match(migrationSql, new RegExp(`revoke all on function public\\.${functionName}[\\s\\S]*from public, anon, authenticated`, "i"), `${functionName} must revoke browser execution.`);
  assert.match(migrationSql, new RegExp(`grant execute on function public\\.${functionName}[\\s\\S]*to service_role`, "i"), `${functionName} must grant service_role execution.`);
}
assert.match(migrationSql, /create or replace function public\.recora_p4b_invitation_accept\(\s*p_invitation_id uuid,\s*p_request_id uuid,\s*p_correlation_id uuid,\s*p_idempotency_key text\s*\)/i, "accept RPC must expose only invitation/request/correlation/idempotency arguments.");
assert.match(migrationSql, /revoke all on function public\.recora_p4b_invitation_accept\(uuid, uuid, uuid, text\) from public, anon, service_role/i, "accept RPC must revoke anon/service_role execution.");
assert.match(migrationSql, /grant execute on function public\.recora_p4b_invitation_accept\(uuid, uuid, uuid, text\) to authenticated/i, "accept RPC must grant authenticated execution.");
assert.doesNotMatch(migrationSql, /grant execute on function public\.recora_p4b_invitation_accept\(uuid, uuid, uuid, text\) to service_role/i, "accept RPC must not grant service_role execution.");
function runSql(sql: string): string {
  const result = spawnSync(
    "docker",
    ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet"],
    { input: sql, encoding: "utf8", timeout: 120_000, maxBuffer: 16 * 1024 * 1024 },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function runSqlExpectError(sql: string, expected: RegExp): void {
  const result = spawnSync(
    "docker",
    ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet"],
    { input: sql, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024 },
  );
  assert.notEqual(result.status, 0, "expected SQL to fail");
  assert.match(`${result.stdout}\n${result.stderr}`, expected);
}

runSql(`
begin;
do $verify$
declare
  operator_user uuid := '12200000-0000-4000-8000-000000000001';
  customer_user uuid := '12200000-0000-4000-8000-000000000002';
  other_user uuid := '12200000-0000-4000-8000-000000000003';
  unconfirmed_user uuid := '12200000-0000-4000-8000-000000000004';
  confirmed_only_user uuid := '12200000-0000-4000-8000-000000000005';
  replay_operator_user uuid := '12200000-0000-4000-8000-000000000006';
  temporal_user_one uuid := '12200000-0000-4000-8000-000000000007';
  temporal_user_two uuid := '12200000-0000-4000-8000-000000000008';
  operator_id uuid := '12230000-0000-4000-8000-000000000001';
  replay_operator_id uuid := '12230000-0000-4000-8000-000000000002';
  org_a uuid := '12210000-0000-4000-8000-000000000001';
  org_b uuid := '12210000-0000-4000-8000-000000000002';
  project_a uuid := '12220000-0000-4000-8000-000000000001';
  project_b uuid := '12220000-0000-4000-8000-000000000002';
  hash_a text := repeat('a', 64);
  hash_b text := repeat('b', 64);
  hash_c text := repeat('c', 64);
  hash_d text := repeat('d', 64);
  hash_e text := pg_catalog.encode(extensions.digest(pg_catalog.convert_to('issue-122-customer@example.invalid', 'utf8'), 'sha256'), 'hex');
  hash_f text := pg_catalog.encode(extensions.digest(pg_catalog.convert_to('issue-122-other@example.invalid', 'utf8'), 'sha256'), 'hex');
  hash_unconfirmed text := pg_catalog.encode(extensions.digest(pg_catalog.convert_to('issue-122-unconfirmed@example.invalid', 'utf8'), 'sha256'), 'hex');
  hash_confirmed_only text := pg_catalog.encode(extensions.digest(pg_catalog.convert_to('issue-122-confirmed-only@example.invalid', 'utf8'), 'sha256'), 'hex');
  hash_temporal_one text := pg_catalog.encode(extensions.digest(pg_catalog.convert_to('issue-122-temporal-one@example.invalid', 'utf8'), 'sha256'), 'hex');
  hash_temporal_two text := pg_catalog.encode(extensions.digest(pg_catalog.convert_to('issue-122-temporal-two@example.invalid', 'utf8'), 'sha256'), 'hex');
  command_row record;
  replay_row record;
  access_row record;
  invitation_one uuid;
  invitation_two uuid;
  invitation_resend_old uuid;
  invitation_revoked uuid;
  invitation_expired uuid;
  invitation_cross_tenant uuid;
  invitation_accept uuid;
  invitation_confirmed_only uuid;
  invitation_temporal_one uuid;
  invitation_temporal_two uuid;
  invitation_temporal_resend_new uuid;
  invitation_legacy uuid;
  membership_one uuid;
  episode_one uuid;
  membership_two uuid;
  episode_two uuid;
  provider_audit_event_id uuid;
  provider_operator_receipt_id uuid;
  provider_command_receipt_id uuid;
  before_receipt_count bigint;
  before_membership_count bigint;
  before_episode_count bigint;
  before_invitation_count bigint;
  before_invitation_event_count bigint;
  before_episode_event_count bigint;
  before_audit_event_count bigint;
  before_operator_receipt_count bigint;
  legacy_plan_config uuid := '12280000-0000-4000-8000-000000000001';
  legacy_subscription_one uuid := '12290000-0000-4000-8000-000000000001';
  legacy_subscription_two uuid := '12290000-0000-4000-8000-000000000002';
  direct_command uuid;
  initial_create_command_receipt_id uuid;
  manual_receipt_mismatch_count integer;
  private_relation text;
  p4b_function record;
begin
  insert into auth.users(id,email,email_confirmed_at,phone_confirmed_at,created_at,updated_at) values
    (operator_user,'issue-122-operator@example.invalid',now(),null,now(),now()),
    (customer_user,'issue-122-customer@example.invalid',now(),null,now(),now()),
    (other_user,'issue-122-other@example.invalid',now(),null,now(),now()),
    (unconfirmed_user,'issue-122-unconfirmed@example.invalid',null,null,now(),now()),
    (confirmed_only_user,'issue-122-confirmed-only@example.invalid',null,now(),now(),now()),
    (replay_operator_user,'issue-122-replay-operator@example.invalid',now(),null,now(),now()),
    (temporal_user_one,'issue-122-temporal-one@example.invalid',now(),null,now(),now()),
    (temporal_user_two,'issue-122-temporal-two@example.invalid',now(),null,now(),now());
  insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values
    (org_a,'issue-122-organization-a','Issue 122 Organization A','client','local',false,false),
    (org_b,'issue-122-organization-b','Issue 122 Organization B','client','local',false,false);
  insert into public.projects(id,organization_id,slug,name) values(project_a,org_a,'issue-122-project-a','Issue 122 Project A'),(project_b,org_b,'issue-122-project-b','Issue 122 Project B');

  insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values(operator_id,operator_user,'active','issue122 operator fixture');
  insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values(replay_operator_id,replay_operator_user,'active','issue122 replay operator fixture');
  insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values
    (operator_id,'account.invitation.create',org_a,null),
    (operator_id,'account.invitation.resend',org_a,null),
    (operator_id,'account.invitation.revoke',org_a,null),
    (operator_id,'account.membership.suspend',org_a,null),
    (operator_id,'account.membership.reactivate',org_a,null),
    (operator_id,'account.membership.revoke',org_a,null);
  insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values(replay_operator_id,'account.invitation.create',org_a,null);

  insert into recora_private.data_lifecycle_current(organization_id,project_id,state,last_request_id,last_correlation_id) values
    (org_a,null,'active','12240000-0000-4000-8000-000000000001','12250000-0000-4000-8000-000000000001'),
    (org_b,null,'active','12240000-0000-4000-8000-000000000002','12250000-0000-4000-8000-000000000002');

  insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document) values(
    '12260000-0000-4000-8000-000000000001','issue122.policy',1,now()-interval '1 day','{"capabilities":{"measurement":true,"analysis":false,"prompts":true},"limits":{}}'::jsonb
  );
  insert into recora_private.entitlement_snapshots(id,organization_id,project_id,source_contract_reference,plan_policy_version_id,entitlement_schema_version,resolved_document,effective_from,resolver_version,idempotency_key) values(
    '12270000-0000-4000-8000-000000000001',org_a,null,'issue122.contract','12260000-0000-4000-8000-000000000001',1,'{"capabilities":{"measurement":true,"analysis":false,"prompts":true},"limits":{}}'::jsonb,now()-interval '1 hour','issue122.verifier','issue122.snapshot'
  );
  insert into recora_private.current_entitlement_snapshots(organization_id,project_id,snapshot_id) values(org_a,null,'12270000-0000-4000-8000-000000000001');

  for p4b_function in
    select p.oid, n.nspname, p.proname, p.prosecdef, p.proconfig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'public' and p.proname like 'recora_p4b_%')
      or (n.nspname = 'recora_private' and p.proname like 'p4b_%')
  loop
    if not p4b_function.prosecdef then raise exception 'P4-B function is not security definer: %.%', p4b_function.nspname, p4b_function.proname; end if;
    if not (p4b_function.proconfig @> array['search_path='] or p4b_function.proconfig @> array['search_path=""']) then raise exception 'P4-B function has unsafe search_path: %.%', p4b_function.nspname, p4b_function.proname; end if;
    if p4b_function.nspname = 'recora_private' and (has_function_privilege('anon',p4b_function.oid,'execute') or has_function_privilege('authenticated',p4b_function.oid,'execute') or has_function_privilege('service_role',p4b_function.oid,'execute')) then raise exception 'P4-B private helper execution exposed: %.%', p4b_function.nspname, p4b_function.proname; end if;
    if p4b_function.nspname = 'public' and p4b_function.proname = 'recora_p4b_invitation_accept' then
      if has_function_privilege('anon',p4b_function.oid,'execute') or has_function_privilege('service_role',p4b_function.oid,'execute') or not has_function_privilege('authenticated',p4b_function.oid,'execute') then raise exception 'accept RPC grants are not authenticated-only'; end if;
    elsif p4b_function.nspname = 'public' then
      if has_function_privilege('anon',p4b_function.oid,'execute') or has_function_privilege('authenticated',p4b_function.oid,'execute') or not has_function_privilege('service_role',p4b_function.oid,'execute') then raise exception 'service-role-only grant mismatch: %', p4b_function.proname; end if;
    end if;
  end loop;

  foreach private_relation in array array['p4_command_receipts','p4_invitations','p4_invitation_events','p4_membership_episodes','p4_membership_episode_events','p4_command_conflicts'] loop
    if has_table_privilege('anon',format('recora_private.%I', private_relation),'select')
      or has_table_privilege('authenticated',format('recora_private.%I', private_relation),'insert') then
      raise exception 'P4-B private relation exposed to browser role: %', private_relation;
    end if;
  end loop;
  begin
    insert into recora_private.p4_command_receipts(organization_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key)
    values(org_a,'invitation.lifecycle','customer_session','p4b.account','shape.customer',9101,repeat('1',64),'12240000-0000-4000-8000-000000000091','12250000-0000-4000-8000-000000000091','shape.customer');
    raise exception 'customer_session without auth actor was accepted';
  exception when check_violation then null; end;
  begin
    insert into recora_private.p4_command_receipts(organization_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,customer_auth_user_id)
    values(org_a,'invitation.lifecycle','provider_fixture','p4b.account','shape.provider',9102,repeat('2',64),'12240000-0000-4000-8000-000000000092','12250000-0000-4000-8000-000000000092','shape.provider',customer_user);
    raise exception 'provider_fixture with customer actor was accepted';
  exception when check_violation then null; end;
  begin
    insert into recora_private.p4_command_receipts(organization_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,customer_auth_user_id)
    values(org_a,'invitation.lifecycle','manual','p4b.account','shape.manual',9103,repeat('3',64),'12240000-0000-4000-8000-000000000093','12250000-0000-4000-8000-000000000093','shape.manual',customer_user);
    raise exception 'manual command with customer actor/no operator evidence was accepted';
  exception when check_violation then null; end;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000011','12250000-0000-4000-8000-000000000011','issue122.create.one');
  if command_row.outcome <> 'accepted' or command_row.reason_code <> 'ok' or command_row.invitation_state <> 'pending' or command_row.audit_event_id is null or command_row.operator_command_receipt_id is null then raise exception 'invitation create failed'; end if;
  invitation_one := command_row.invitation_id;
  initial_create_command_receipt_id := command_row.command_receipt_id;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_membership_count from public.organization_members;
  select count(*) into before_episode_count from recora_private.p4_membership_episodes;
  select count(*) into before_episode_event_count from recora_private.p4_membership_episode_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create.pending',
    '12240000-0000-4000-8000-000000000105','12250000-0000-4000-8000-000000000105','issue122.create.pending'
  );
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'pending_invitation_exists'
    or replay_row.invitation_id <> invitation_one
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from public.organization_members) <> before_membership_count
    or (select count(*) from recora_private.p4_membership_episodes) <> before_episode_count
    or (select count(*) from recora_private.p4_membership_episode_events) <> before_episode_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_a
        and event_row.action = 'account.invitation.create'
        and event_row.target_type = 'invitation'
        and event_row.target_id = invitation_one
        and event_row.permission_used = 'account.invitation.create'
        and event_row.reason = 'issue122.create.pending'
        and event_row.request_id = '12240000-0000-4000-8000-000000000105'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000105'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'pending_invitation_exists'
    ) then
    raise exception 'pending invitation rejection did not retain exact denial audit without mutation';
  end if;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create.pending',
    '12240000-0000-4000-8000-000000000106','12250000-0000-4000-8000-000000000106','issue122.create.pending'
  );
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'pending_invitation_exists'
    or replay_row.invitation_id <> invitation_one
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.target_id = invitation_one
        and event_row.reason = 'issue122.create.pending'
        and event_row.request_id = '12240000-0000-4000-8000-000000000106'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000106'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'pending_invitation_exists'
    ) then
    raise exception 'pending invitation rejection replay was not stable and mutation-free';
  end if;
  insert into recora_audit.operator_events(
    actor_operator_id,organization_id,project_id,action,target_type,target_id,permission_used,
    reason,before_summary,after_summary,request_id,correlation_id,outcome,failure_reason_code
  ) values(
    operator_id,org_a,null,'account.fixture.apply','invitation',invitation_one,'account.invitation.create',
    'fixture','{}'::jsonb,'{}'::jsonb,'12240000-0000-4000-8000-000000000101','12250000-0000-4000-8000-000000000101',
    'success'::recora_audit.operator_audit_outcome,null
  ) returning id into provider_audit_event_id;
  insert into recora_operator.operator_command_receipts(
    audit_event_id,operator_id,organization_id,project_id,action,target_type,target_id,request_id,correlation_id
  ) values(
    provider_audit_event_id,operator_id,org_a,null,'account.fixture.apply','invitation',invitation_one,
    '12240000-0000-4000-8000-000000000101','12250000-0000-4000-8000-000000000101'
  ) returning id into provider_operator_receipt_id;
  select command_receipt_id into provider_command_receipt_id
  from public.recora_p4_record_command_receipt(
    org_a,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'p4b.account',
    'fixture.compatible',9104,repeat('4',64),'12240000-0000-4000-8000-000000000101',
    '12250000-0000-4000-8000-000000000101','fixture.compatible',provider_audit_event_id,provider_operator_receipt_id
  );
  if provider_command_receipt_id is null
    or not exists(
      select 1 from recora_private.p4_command_receipts receipt_row
      where receipt_row.id = provider_command_receipt_id
        and receipt_row.source_kind = 'provider_fixture'::recora_private.p4_source_kind
        and receipt_row.customer_auth_user_id is null
        and receipt_row.operator_audit_event_id = provider_audit_event_id
        and receipt_row.operator_command_receipt_id = provider_operator_receipt_id
    ) then
    raise exception 'provider fixture paired operator evidence compatibility failed';
  end if;
  begin
    insert into recora_private.p4_command_receipts(
      organization_id,command_type,source_kind,source_namespace,source_reference,source_sequence,
      payload_fingerprint,request_id,correlation_id,idempotency_key,operator_audit_event_id
    ) values(
      org_a,'invitation.lifecycle','provider_fixture','p4b.account','shape.provider.half.audit',9105,
      repeat('5',64),'12240000-0000-4000-8000-000000000102','12250000-0000-4000-8000-000000000102',
      'shape.provider.half.audit',provider_audit_event_id
    );
    raise exception 'provider fixture audit-only evidence was accepted';
  exception when check_violation then null; end;
  begin
    insert into recora_private.p4_command_receipts(
      organization_id,command_type,source_kind,source_namespace,source_reference,source_sequence,
      payload_fingerprint,request_id,correlation_id,idempotency_key,operator_command_receipt_id
    ) values(
      org_a,'invitation.lifecycle','provider_fixture','p4b.account','shape.provider.half.receipt',9106,
      repeat('6',64),'12240000-0000-4000-8000-000000000101','12250000-0000-4000-8000-000000000101',
      'shape.provider.half.receipt',provider_operator_receipt_id
    );
    raise exception 'provider fixture receipt-only evidence was accepted';
  exception when others then
    if sqlstate not in ('23514','P0001') then raise; end if;
  end;
  insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id)
  values(operator_id,'p4c.contract.billing.apply',org_a,project_a);
  select * into command_row
  from public.recora_operator_execute_authorized_command_receipt(
    operator_user,'p4c.contract.billing.apply',org_a,project_a,'p4c.contract.billing.apply','project',project_a,
    'issue 122 p4c compatibility evidence','12240000-0000-4000-8000-000000000104','12250000-0000-4000-8000-000000000104',
    '{}'::jsonb,
    pg_catalog.jsonb_build_object(
      'policy',pg_catalog.jsonb_build_object(
        'key','issue122.compat.policy',
        'hash_chars',pg_catalog.to_jsonb(pg_catalog.string_to_array(repeat('7',64),null)),
        'schema_version',1
      ),
      'command',pg_catalog.jsonb_build_object(
        'source_kind','provider_fixture','source_namespace','fixture.p4c','source_reference','p4c.compatibility',
        'source_sequence',9201,'contract_reference','contract.compatibility','next_contract_state','draft',
        'payment_fact_kind','payment_unknown','payment_chain_key','chain.compatibility',
        'corrects_payment_fact_id_chars',null
      )
    )
  );
  if command_row.outcome <> 'success' or command_row.audit_event_id is null then raise exception 'P4-C provider fixture operator evidence could not be installed'; end if;
  provider_audit_event_id := command_row.audit_event_id;
  select id into provider_operator_receipt_id
  from recora_operator.operator_command_receipts
  where audit_event_id = provider_audit_event_id;
  select command_receipt_id into provider_command_receipt_id
  from public.recora_p4_record_command_receipt(
    org_a,project_a,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4c','p4c.compatibility',9201,
    repeat('7',64),'12240000-0000-4000-8000-000000000104','12250000-0000-4000-8000-000000000104','p4c.compatibility',
    provider_audit_event_id,provider_operator_receipt_id
  );
  if provider_command_receipt_id is null
    or not exists(
      select 1 from recora_private.p4_command_receipts receipt_row
      where receipt_row.id = provider_command_receipt_id
        and receipt_row.organization_id = org_a
        and receipt_row.project_id = project_a
        and receipt_row.source_kind = 'provider_fixture'::recora_private.p4_source_kind
        and receipt_row.customer_auth_user_id is null
        and receipt_row.operator_audit_event_id = provider_audit_event_id
        and receipt_row.operator_command_receipt_id = provider_operator_receipt_id
    ) then
    raise exception 'P4-C provider fixture receipt pattern was not compatible with P4-B actor shape';
  end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000012','12250000-0000-4000-8000-000000000012','issue122.create.one');
  if replay_row.outcome <> 'replayed' or replay_row.command_receipt_id <> initial_create_command_receipt_id then raise exception 'create replay failed'; end if;
  select * into replay_row
  from public.recora_p4b_invitation_create(
    replay_operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create',
    '12240000-0000-4000-8000-000000000018','12250000-0000-4000-8000-000000000018','issue122.create.one'
  );
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'operator_authorization_denied'
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.target_type = 'invitation'
        and event_row.target_id = invitation_one
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
    ) then
    raise exception 'different operator replay was not denied with original invitation target';
  end if;
  update recora_operator.operator_action_grants grant_row
  set revoked_at=now(),revoked_reason_code='issue122.replay.revoked'
  where grant_row.operator_id = replay_operator_id
    and permission = 'account.invitation.create'
    and organization_id = org_a
    and revoked_at is null;
  select * into replay_row
  from public.recora_p4b_invitation_create(
    replay_operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create',
    '12240000-0000-4000-8000-000000000019','12250000-0000-4000-8000-000000000019','issue122.create.one'
  );
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'permission_denied'
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null then
    raise exception 'revoked replay operator grant was not revalidated';
  end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_b,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000013','12250000-0000-4000-8000-000000000013','issue122.create.one');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'idempotency_conflict' then raise exception 'create idempotency conflict failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,repeat('9',64),'owner',now()+interval '7 days','issue122.owner','12240000-0000-4000-8000-000000000014','12250000-0000-4000-8000-000000000014','issue122.owner');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'invalid_reference' then raise exception 'owner role escalation was not rejected'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,repeat('8',64),'admin',now()+interval '7 days','issue122.admin.neg','12240000-0000-4000-8000-000000000016','12250000-0000-4000-8000-000000000016','issue122.admin.neg');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'permission_denied' then raise exception 'generic create permission granted admin role'; end if;
  insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values(operator_id,'account.invitation.create.admin',org_a,null);
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,repeat('7',64),'admin',now()+interval '7 days','issue122.admin.pos','12240000-0000-4000-8000-000000000017','12250000-0000-4000-8000-000000000017','issue122.admin.pos');
  if replay_row.outcome <> 'accepted' or replay_row.invitation_state <> 'pending' then raise exception 'explicit admin create permission failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_b,hash_b,'member',now()+interval '7 days','issue122.cross','12240000-0000-4000-8000-000000000015','12250000-0000-4000-8000-000000000015','issue122.cross');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'permission_denied' or replay_row.audit_event_id is null or replay_row.operator_command_receipt_id is not null or not exists(select 1 from recora_audit.operator_events event_row where event_row.id = replay_row.audit_event_id and event_row.target_type = 'invitation' and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome) then raise exception 'operator permission negative failed'; end if;
  select command_receipt_id into direct_command
  from public.recora_p4_record_command_receipt(
    org_b,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'issue122.cross.tenant',
    'cross.tenant.fixture',9107,repeat('a',64),'12240000-0000-4000-8000-000000000107','12250000-0000-4000-8000-000000000107','issue122.cross.tenant.fixture'
  );
  invitation_cross_tenant := extensions.gen_random_uuid();
  insert into recora_private.p4_invitations(id,organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
  values(invitation_cross_tenant,org_b,hash_f,direct_command,direct_command,'12240000-0000-4000-8000-000000000107','12250000-0000-4000-8000-000000000107',now()+interval '7 days',now());
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(invitation_cross_tenant,org_b,1,'pending',direct_command,'12240000-0000-4000-8000-000000000107','12250000-0000-4000-8000-000000000107');
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_invitation_revoke(operator_user,invitation_cross_tenant,'issue122.cross.tenant','12240000-0000-4000-8000-000000000108','12250000-0000-4000-8000-000000000108','issue122.cross.tenant');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'permission_denied'
    or replay_row.invitation_id <> invitation_cross_tenant
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_b
        and event_row.action = 'account.invitation.revoke'
        and event_row.target_type = 'invitation'
        and event_row.target_id = invitation_cross_tenant
        and event_row.permission_used = 'account.invitation.revoke'
        and event_row.reason = 'issue122.cross.tenant'
        and event_row.request_id = '12240000-0000-4000-8000-000000000108'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000108'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'permission_denied'
    ) then
    raise exception 'cross-tenant invitation rejection did not retain exact denial audit without mutation';
  end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_b,'viewer',now()+interval '7 days','issue122.resend.create','12240000-0000-4000-8000-000000000021','12250000-0000-4000-8000-000000000021','issue122.resend.create');
  invitation_resend_old := command_row.invitation_id;
  select * into command_row from public.recora_p4b_invitation_resend(operator_user,invitation_resend_old,hash_b,now()+interval '8 days','issue122.resend','12240000-0000-4000-8000-000000000022','12250000-0000-4000-8000-000000000022','issue122.resend');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'pending' or command_row.invitation_id = invitation_resend_old then raise exception 'invitation resend failed'; end if;
  invitation_two := command_row.invitation_id;
  if not exists(select 1 from recora_private.p4_invitations where id = invitation_resend_old and state = 'superseded'::recora_private.p4_invitation_state and superseded_by_invitation_id = invitation_two) then raise exception 'old invitation was not superseded on resend'; end if;
  if not exists(select 1 from recora_private.p4_invitation_events where invitation_id = invitation_resend_old and previous_state = 'pending'::recora_private.p4_invitation_state and next_state = 'superseded'::recora_private.p4_invitation_state) then raise exception 'superseded resend event missing'; end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_resend_old,'12240000-0000-4000-8000-000000000023','12250000-0000-4000-8000-000000000023','issue122.accept.superseded');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'invitation_unavailable' then raise exception 'superseded invitation accept was not rejected'; end if;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_invitation_resend(operator_user,invitation_two,hash_c,now()+interval '8 days','issue122.resend.bad','12240000-0000-4000-8000-000000000024','12250000-0000-4000-8000-000000000024','issue122.resend.bad');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'recipient_mismatch'
    or replay_row.invitation_id <> invitation_two
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_a
        and event_row.action = 'account.invitation.resend'
        and event_row.target_type = 'invitation'
        and event_row.target_id = invitation_two
        and event_row.permission_used = 'account.invitation.resend'
        and event_row.reason = 'issue122.resend.bad'
        and event_row.request_id = '12240000-0000-4000-8000-000000000024'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000024'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'recipient_mismatch'
    ) then
    raise exception 'resend recipient rejection did not retain exact denial audit without mutation';
  end if;

  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_invitation_resend(operator_user,invitation_two,hash_b,now()-interval '1 day','issue122.resend.expired','12240000-0000-4000-8000-000000000025','12250000-0000-4000-8000-000000000025','issue122.resend.expired');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'invalid_reference'
    or replay_row.invitation_id <> invitation_two
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.target_id = invitation_two
        and event_row.reason = 'issue122.resend.expired'
        and event_row.request_id = '12240000-0000-4000-8000-000000000025'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000025'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'invalid_reference'
    ) then
    raise exception 'resend expiry rejection did not retain exact denial audit without mutation';
  end if;

  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_invitation_resend(operator_user,invitation_resend_old,hash_b,now()+interval '8 days','issue122.resend.state','12240000-0000-4000-8000-000000000026','12250000-0000-4000-8000-000000000026','issue122.resend.state');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'invitation_not_pending'
    or replay_row.invitation_id <> invitation_resend_old
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.target_id = invitation_resend_old
        and event_row.reason = 'issue122.resend.state'
        and event_row.request_id = '12240000-0000-4000-8000-000000000026'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000026'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'invitation_not_pending'
    ) then
    raise exception 'resend state rejection did not retain exact denial audit without mutation';
  end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_c,'member',now()+interval '7 days','issue122.revoke.create','12240000-0000-4000-8000-000000000031','12250000-0000-4000-8000-000000000031','issue122.revoke.create');
  invitation_revoked := command_row.invitation_id;
  select * into command_row from public.recora_p4b_invitation_revoke(operator_user,invitation_revoked,'issue122.revoke','12240000-0000-4000-8000-000000000032','12250000-0000-4000-8000-000000000032','issue122.revoke');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'revoked' then raise exception 'invitation revoke failed'; end if;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_invitation_revoke(operator_user,invitation_revoked,'issue122.revoke.state','12240000-0000-4000-8000-000000000034','12250000-0000-4000-8000-000000000034','issue122.revoke.state');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'invitation_not_pending'
    or replay_row.invitation_id <> invitation_revoked
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_a
        and event_row.action = 'account.invitation.revoke'
        and event_row.target_type = 'invitation'
        and event_row.target_id = invitation_revoked
        and event_row.permission_used = 'account.invitation.revoke'
        and event_row.reason = 'issue122.revoke.state'
        and event_row.request_id = '12240000-0000-4000-8000-000000000034'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000034'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'invitation_not_pending'
    ) then
    raise exception 'revoke state rejection did not retain exact denial audit without mutation';
  end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_revoked,'12240000-0000-4000-8000-000000000033','12250000-0000-4000-8000-000000000033','issue122.accept.revoked');
  if replay_row.reason_code <> 'invitation_unavailable' then raise exception 'revoked invitation accept was not rejected'; end if;

  select command_receipt_id into direct_command from public.recora_p4_record_command_receipt(org_a,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'p4b.account','invite.expired',9001,repeat('1',64),'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041','issue122.expired.fixture');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
  values(org_a,hash_d,direct_command,direct_command,'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041',now()-interval '1 hour',now()-interval '2 hours') returning id into invitation_expired;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(invitation_expired,org_a,1,'pending',direct_command,'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041');
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_invitation_count from recora_private.p4_invitations;
  select count(*) into before_invitation_event_count from recora_private.p4_invitation_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_invitation_revoke(operator_user,invitation_expired,'issue122.revoke.expired','12240000-0000-4000-8000-000000000043','12250000-0000-4000-8000-000000000043','issue122.revoke.expired');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'invitation_expired'
    or replay_row.invitation_id <> invitation_expired
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from recora_private.p4_invitations) <> before_invitation_count
    or (select count(*) from recora_private.p4_invitation_events) <> before_invitation_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.target_id = invitation_expired
        and event_row.reason = 'issue122.revoke.expired'
        and event_row.request_id = '12240000-0000-4000-8000-000000000043'
        and event_row.correlation_id = '12250000-0000-4000-8000-000000000043'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'invitation_expired'
    ) then
    raise exception 'revoke expiry rejection did not retain exact denial audit without mutation';
  end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_expired,'12240000-0000-4000-8000-000000000042','12250000-0000-4000-8000-000000000042','issue122.accept.expired');
  if replay_row.reason_code <> 'invitation_unavailable' then raise exception 'expired invitation accept was not rejected'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_d,'member',now()+interval '7 days','issue122.expired.reinvite','12240000-0000-4000-8000-000000000044','12250000-0000-4000-8000-000000000044','issue122.expired.reinvite');
  if replay_row.outcome <> 'accepted' or replay_row.invitation_id = invitation_expired or (select state from recora_private.p4_invitations where id=invitation_expired) <> 'expired'::recora_private.p4_invitation_state or not exists(select 1 from recora_private.p4_invitation_events where invitation_id=invitation_expired and next_state='expired') then raise exception 'expired pending reinvite did not finalize old row and create new id'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_e,'member',now()+interval '7 days','issue122.accept.create','12240000-0000-4000-8000-000000000051','12250000-0000-4000-8000-000000000051','issue122.accept.create');
  invitation_accept := command_row.invitation_id;
  perform set_config('request.jwt.claim.sub', other_user::text, true);
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,'12240000-0000-4000-8000-000000000052','12250000-0000-4000-8000-000000000052','issue122.accept.mismatch');
  if replay_row.reason_code <> 'invitation_unavailable' then raise exception 'recipient mismatch negative failed'; end if;
  perform set_config('request.jwt.claim.sub', '12200000-0000-4000-8000-000000009999', true);
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,'12240000-0000-4000-8000-000000000053','12250000-0000-4000-8000-000000000053','issue122.accept.identity');
  if replay_row.reason_code <> 'identity_unverified' then raise exception 'unverified identity negative failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_unconfirmed,'member',now()+interval '7 days','issue122.unconfirmed.create','12240000-0000-4000-8000-000000000056','12250000-0000-4000-8000-000000000056','issue122.unconfirmed.create');
  perform set_config('request.jwt.claim.sub', unconfirmed_user::text, true);
  select * into replay_row from public.recora_p4b_invitation_accept(replay_row.invitation_id,'12240000-0000-4000-8000-000000000057','12250000-0000-4000-8000-000000000057','issue122.unconfirmed.accept');
  if replay_row.reason_code <> 'identity_unverified' then raise exception 'matching but unconfirmed Auth email was not rejected'; end if;
  select * into command_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_confirmed_only,'member',now()+interval '7 days','issue122.confirmed-only.create',
    '12240000-0000-4000-8000-000000000058','12250000-0000-4000-8000-000000000058','issue122.confirmed-only.create'
  );
  invitation_confirmed_only := command_row.invitation_id;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_membership_count from public.organization_members;
  select count(*) into before_episode_count from recora_private.p4_membership_episodes;
  perform set_config('request.jwt.claim.sub', confirmed_only_user::text, true);
  select * into replay_row
  from public.recora_p4b_invitation_accept(
    invitation_confirmed_only,'12240000-0000-4000-8000-000000000059','12250000-0000-4000-8000-000000000059','issue122.confirmed-only.accept'
  );
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'identity_unverified'
    or (select state from recora_private.p4_invitations where id = invitation_confirmed_only) <> 'pending'::recora_private.p4_invitation_state
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from public.organization_members) <> before_membership_count
    or (select count(*) from recora_private.p4_membership_episodes) <> before_episode_count then
    raise exception 'confirmed_at-only Auth identity was not rejected without mutation';
  end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into command_row from public.recora_p4b_invitation_accept(invitation_accept,'12240000-0000-4000-8000-000000000054','12250000-0000-4000-8000-000000000054','issue122.accept');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'accepted' or command_row.membership_status <> 'active' or command_row.membership_episode_state <> 'active' then raise exception 'invitation accept activation failed'; end if;
  membership_one := command_row.membership_id; episode_one := command_row.membership_episode_id;
  if (select count(*) from recora_private.p4_membership_episode_events where episode_id = episode_one) <> 2 then raise exception 'membership activation events missing'; end if;
  if not exists(select 1 from recora_private.p4_command_receipts where id=command_row.command_receipt_id and source_kind='customer_session'::recora_private.p4_source_kind and customer_auth_user_id=customer_user and operator_audit_event_id is null and operator_command_receipt_id is null) then raise exception 'customer-session command receipt actor evidence missing'; end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,'12240000-0000-4000-8000-000000000055','12250000-0000-4000-8000-000000000055','issue122.accept');
  if replay_row.outcome <> 'replayed' or replay_row.membership_id <> membership_one then raise exception 'accept replay failed'; end if;

  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,null,'measurement');
  if not access_row.customer_access_allowed or access_row.reason_code <> 'ok' or access_row.membership_role <> 'member' or access_row.entitlement_capabilities ? 'snapshot_id' then raise exception 'derived access positive/customer-safe DTO failed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,project_a,'measurement');
  if not access_row.customer_access_allowed or access_row.reason_code <> 'ok' then raise exception 'explicit project scope did not inherit organization entitlement'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,project_b,'measurement');
  if access_row.customer_access_allowed or access_row.reason_code <> 'invalid_scope' then raise exception 'cross-project explicit scope did not fail closed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,null,'analysis');
  if access_row.customer_access_allowed or access_row.reason_code <> 'capability_unavailable' then raise exception 'capability negative failed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_b,null,'measurement');
  if access_row.customer_access_allowed or access_row.reason_code <> 'membership_required' then raise exception 'cross-tenant derived access failed'; end if;

  select * into command_row from public.recora_p4b_membership_suspend(operator_user,membership_one,'issue122.suspend','12240000-0000-4000-8000-000000000061','12250000-0000-4000-8000-000000000061','issue122.suspend');
  if command_row.outcome <> 'accepted' or command_row.membership_status <> 'suspended' then raise exception 'membership suspend failed'; end if;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_membership_count from public.organization_members;
  select count(*) into before_episode_count from recora_private.p4_membership_episodes;
  select count(*) into before_episode_event_count from recora_private.p4_membership_episode_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_membership_suspend(operator_user,membership_one,'issue122.suspend.state','12240000-0000-0000-0000-000000000066','12250000-0000-0000-0000-000000000066','issue122.suspend.state');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'membership_not_active'
    or replay_row.membership_id <> membership_one
    or replay_row.membership_status <> 'suspended'
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from public.organization_members) <> before_membership_count
    or (select count(*) from recora_private.p4_membership_episodes) <> before_episode_count
    or (select count(*) from recora_private.p4_membership_episode_events) <> before_episode_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_a
        and event_row.action = 'account.membership.suspend'
        and event_row.target_type = 'membership'
        and event_row.target_id = membership_one
        and event_row.permission_used = 'account.membership.suspend'
        and event_row.reason = 'issue122.suspend.state'
        and event_row.request_id = '12240000-0000-0000-0000-000000000066'
        and event_row.correlation_id = '12250000-0000-0000-0000-000000000066'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'membership_not_active'
    ) then
    raise exception 'suspend state rejection did not retain exact denial audit without mutation';
  end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,null,'measurement');
  if access_row.customer_access_allowed or access_row.reason_code <> 'membership_required' then raise exception 'suspended membership retained access'; end if;
  select * into command_row from public.recora_p4b_membership_reactivate(operator_user,membership_one,'issue122.reactivate','12240000-0000-4000-8000-000000000062','12250000-0000-4000-8000-000000000062','issue122.reactivate');
  if command_row.outcome <> 'accepted' or command_row.membership_status <> 'active' then raise exception 'membership reactivate failed'; end if;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_membership_count from public.organization_members;
  select count(*) into before_episode_count from recora_private.p4_membership_episodes;
  select count(*) into before_episode_event_count from recora_private.p4_membership_episode_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_membership_reactivate(operator_user,membership_one,'issue122.reactivate.state','12240000-0000-0000-0000-000000000067','12250000-0000-0000-0000-000000000067','issue122.reactivate.state');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'membership_not_suspended'
    or replay_row.membership_id <> membership_one
    or replay_row.membership_status <> 'active'
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from public.organization_members) <> before_membership_count
    or (select count(*) from recora_private.p4_membership_episodes) <> before_episode_count
    or (select count(*) from recora_private.p4_membership_episode_events) <> before_episode_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_a
        and event_row.action = 'account.membership.reactivate'
        and event_row.target_type = 'membership'
        and event_row.target_id = membership_one
        and event_row.permission_used = 'account.membership.reactivate'
        and event_row.reason = 'issue122.reactivate.state'
        and event_row.request_id = '12240000-0000-0000-0000-000000000067'
        and event_row.correlation_id = '12250000-0000-0000-0000-000000000067'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'membership_not_suspended'
    ) then
    raise exception 'reactivate state rejection did not retain exact denial audit without mutation';
  end if;
  select * into replay_row
  from public.recora_p4b_membership_suspend(
    operator_user,membership_one,'issue122.suspend',
    '12240000-0000-4000-8000-000000000065','12250000-0000-4000-8000-000000000065','issue122.suspend'
  );
  if replay_row.outcome <> 'replayed'
    or replay_row.membership_id <> membership_one
    or replay_row.membership_status <> 'suspended'
    or replay_row.membership_episode_state <> 'active'
    or (select membership_status from public.organization_members where id = membership_one) <> 'active'::public.recora_organization_membership_status then
    raise exception 'suspend replay after reactivate was not immutable';
  end if;
  select * into command_row from public.recora_p4b_membership_revoke(operator_user,membership_one,'issue122.member.revoke','12240000-0000-4000-8000-000000000063','12250000-0000-4000-8000-000000000063','issue122.member.revoke');
  if command_row.outcome <> 'accepted' or command_row.membership_status <> 'revoked' or command_row.membership_episode_state <> 'revoked' then raise exception 'membership revoke failed'; end if;
  if (select user_id from public.organization_members where id = membership_one) is not null then raise exception 'revoked membership user identity was not freed'; end if;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_membership_count from public.organization_members;
  select count(*) into before_episode_count from recora_private.p4_membership_episodes;
  select count(*) into before_episode_event_count from recora_private.p4_membership_episode_events;
  select count(*) into before_operator_receipt_count from recora_operator.operator_command_receipts;
  select count(*) into before_audit_event_count from recora_audit.operator_events;
  select * into replay_row from public.recora_p4b_membership_revoke(operator_user,membership_one,'issue122.member.revoke.state','12240000-0000-0000-0000-000000000068','12250000-0000-0000-0000-000000000068','issue122.member.revoke.state');
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'membership_not_revocable'
    or replay_row.membership_id <> membership_one
    or replay_row.membership_status <> 'revoked'
    or replay_row.membership_episode_state <> 'revoked'
    or replay_row.command_receipt_id is not null
    or replay_row.operator_command_receipt_id is not null
    or replay_row.audit_event_id is null
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from public.organization_members) <> before_membership_count
    or (select count(*) from recora_private.p4_membership_episodes) <> before_episode_count
    or (select count(*) from recora_private.p4_membership_episode_events) <> before_episode_event_count
    or (select count(*) from recora_operator.operator_command_receipts) <> before_operator_receipt_count
    or (select count(*) from recora_audit.operator_events) <> before_audit_event_count + 1
    or not exists(
      select 1 from recora_audit.operator_events event_row
      where event_row.id = replay_row.audit_event_id
        and event_row.actor_operator_id = operator_id
        and event_row.organization_id = org_a
        and event_row.action = 'account.membership.revoke'
        and event_row.target_type = 'membership'
        and event_row.target_id = membership_one
        and event_row.permission_used = 'account.membership.revoke'
        and event_row.reason = 'issue122.member.revoke.state'
        and event_row.request_id = '12240000-0000-0000-0000-000000000068'
        and event_row.correlation_id = '12250000-0000-0000-0000-000000000068'
        and event_row.outcome = 'denied'::recora_audit.operator_audit_outcome
        and event_row.failure_reason_code = 'membership_not_revocable'
    ) then
    raise exception 'revoke membership state rejection did not retain exact denial audit without mutation';
  end if;
  select * into replay_row from public.recora_p4b_membership_reactivate(operator_user,membership_one,'issue122.bad.reactivate','12240000-0000-4000-8000-000000000064','12250000-0000-4000-8000-000000000064','issue122.bad.reactivate');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'membership_not_suspended' then raise exception 'direct revoked reactivation was not rejected'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_e,'member',now()+interval '7 days','issue122.rejoin.create','12240000-0000-4000-8000-000000000071','12250000-0000-4000-8000-000000000071','issue122.rejoin.create');
  invitation_two := command_row.invitation_id;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into command_row from public.recora_p4b_invitation_accept(invitation_two,'12240000-0000-4000-8000-000000000072','12250000-0000-4000-8000-000000000072','issue122.rejoin.accept');
  membership_two := command_row.membership_id; episode_two := command_row.membership_episode_id;
  if command_row.outcome <> 'accepted' or membership_two = membership_one or episode_two = episode_one then raise exception 'revoked relation did not require new invitation/episode'; end if;

  select * into replay_row
  from public.recora_p4b_invitation_accept(
    invitation_accept,'12240000-0000-4000-8000-000000000073','12250000-0000-4000-8000-000000000073','issue122.accept'
  );
  if replay_row.outcome <> 'replayed'
    or replay_row.invitation_id <> invitation_accept
    or replay_row.invitation_state <> 'accepted'
    or replay_row.membership_id <> membership_one
    or replay_row.membership_status <> 'active'
    or replay_row.membership_episode_id <> episode_one
    or replay_row.membership_episode_state <> 'active'
    or (select membership_status from public.organization_members where id = membership_two) <> 'active'::public.recora_organization_membership_status then
    raise exception 'accept replay after revoke/rejoin was not immutable';
  end if;

  select * into command_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_temporal_one,'member',now()+interval '7 days','issue122.temporal.create',
    '12240000-0000-4000-8000-000000000074','12250000-0000-4000-8000-000000000074','issue122.temporal.create'
  );
  invitation_temporal_one := command_row.invitation_id;
  perform set_config('request.jwt.claim.sub', temporal_user_one::text, true);
  select * into command_row
  from public.recora_p4b_invitation_accept(
    invitation_temporal_one,'12240000-0000-4000-8000-000000000075','12250000-0000-4000-8000-000000000075','issue122.temporal.accept.one'
  );
  if command_row.outcome <> 'accepted' then raise exception 'temporal create invitation accept failed'; end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into replay_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_temporal_one,'member',now()+interval '7 days','issue122.temporal.create',
    '12240000-0000-4000-8000-000000000076','12250000-0000-4000-8000-000000000076','issue122.temporal.create'
  );
  if replay_row.outcome <> 'replayed'
    or replay_row.invitation_id <> invitation_temporal_one
    or replay_row.invitation_state <> 'pending'
    or (select state from recora_private.p4_invitations where id = invitation_temporal_one) <> 'accepted'::recora_private.p4_invitation_state then
    raise exception 'create replay after accept was not immutable';
  end if;

  select * into command_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_temporal_two,'viewer',now()+interval '7 days','issue122.temporal.resend.create',
    '12240000-0000-4000-8000-000000000077','12250000-0000-4000-8000-000000000077','issue122.temporal.resend.create'
  );
  invitation_temporal_two := command_row.invitation_id;
  select * into command_row
  from public.recora_p4b_invitation_resend(
    operator_user,invitation_temporal_two,hash_temporal_two,now()+interval '8 days','issue122.temporal.resend',
    '12240000-0000-4000-8000-000000000078','12250000-0000-4000-8000-000000000078','issue122.temporal.resend'
  );
  invitation_temporal_resend_new := command_row.invitation_id;
  if command_row.outcome <> 'accepted' or invitation_temporal_resend_new = invitation_temporal_two then raise exception 'temporal resend setup failed'; end if;
  perform set_config('request.jwt.claim.sub', temporal_user_two::text, true);
  select * into command_row
  from public.recora_p4b_invitation_accept(
    invitation_temporal_resend_new,'12240000-0000-4000-8000-000000000079','12250000-0000-4000-8000-000000000079','issue122.temporal.accept.two'
  );
  if command_row.outcome <> 'accepted' then raise exception 'temporal resend replacement accept failed'; end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into replay_row
  from public.recora_p4b_invitation_resend(
    operator_user,invitation_temporal_two,hash_temporal_two,now()+interval '8 days','issue122.temporal.resend',
    '12240000-0000-4000-8000-000000000080','12250000-0000-4000-8000-000000000080','issue122.temporal.resend'
  );
  if replay_row.outcome <> 'replayed'
    or replay_row.invitation_id <> invitation_temporal_resend_new
    or replay_row.invitation_state <> 'pending'
    or (select state from recora_private.p4_invitations where id = invitation_temporal_two) <> 'superseded'::recora_private.p4_invitation_state
    or (select state from recora_private.p4_invitations where id = invitation_temporal_resend_new) <> 'accepted'::recora_private.p4_invitation_state then
    raise exception 'resend replay after replacement accept was not immutable';
  end if;

  select * into command_row
  from public.recora_p4b_invitation_create(
    operator_user,org_a,hash_f,'member',now()+interval '7 days','issue122.legacy.create',
    '12240000-0000-4000-8000-000000000081','12250000-0000-4000-8000-000000000081','issue122.legacy.create'
  );
  invitation_legacy := command_row.invitation_id;
  select count(*) into before_receipt_count from recora_private.p4_command_receipts;
  select count(*) into before_membership_count from public.organization_members;
  select count(*) into before_episode_count from recora_private.p4_membership_episodes;
  insert into recora_admin.plan_configs(id,plan_code,display_name,status,config)
  values(legacy_plan_config,'issue122_legacy_plan','Issue 122 legacy plan','active','{}'::jsonb);
  insert into recora_admin.customer_subscriptions(
    id,organization_id,project_id,plan_config_id,plan_code,status,billing_mode,entitlement_config,metadata
  ) values
    (legacy_subscription_one,org_a,null,legacy_plan_config,'issue122_legacy_plan','active','manual','{}'::jsonb,'{}'::jsonb),
    (legacy_subscription_two,org_a,null,legacy_plan_config,'issue122_legacy_plan','paused','manual','{}'::jsonb,'{}'::jsonb);
  perform set_config('request.jwt.claim.sub', other_user::text, true);
  select * into replay_row
  from public.recora_p4b_invitation_accept(
    invitation_legacy,'12240000-0000-4000-8000-000000000082','12250000-0000-4000-8000-000000000082','issue122.legacy.accept'
  );
  if replay_row.outcome <> 'rejected'
    or replay_row.reason_code <> 'invalid_legacy_inventory'
    or (select state from recora_private.p4_invitations where id = invitation_legacy) <> 'pending'::recora_private.p4_invitation_state
    or (select count(*) from recora_private.p4_command_receipts) <> before_receipt_count
    or (select count(*) from public.organization_members) <> before_membership_count
    or (select count(*) from recora_private.p4_membership_episodes) <> before_episode_count then
    raise exception 'corrupt legacy inventory did not fail closed without account mutation';
  end if;
  delete from recora_admin.customer_subscriptions where id in (legacy_subscription_one,legacy_subscription_two);
  delete from recora_admin.plan_configs where id = legacy_plan_config;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);

  select pg_catalog.count(*) into manual_receipt_mismatch_count
  from recora_private.p4_command_receipts p4_row
  left join recora_operator.operator_command_receipts receipt_row on receipt_row.id = p4_row.operator_command_receipt_id
  left join recora_audit.operator_events event_row on event_row.id = p4_row.operator_audit_event_id
  where p4_row.source_kind = 'manual'::recora_private.p4_source_kind
    and p4_row.source_namespace = 'p4b.account'
    and (receipt_row.id is null or event_row.id is null or receipt_row.audit_event_id is distinct from event_row.id or event_row.outcome <> 'success'::recora_audit.operator_audit_outcome);
  if manual_receipt_mismatch_count <> 0 then raise exception 'operator audit/P4 receipt mismatch'; end if;
  select pg_catalog.count(*) into manual_receipt_mismatch_count
  from recora_private.p4_command_receipts p4_row
  join recora_operator.operator_command_receipts receipt_row on receipt_row.id = p4_row.operator_command_receipt_id
  left join recora_private.p4_invitations invitation_row on invitation_row.id = receipt_row.target_id and invitation_row.organization_id = p4_row.organization_id
  left join public.organization_members member_row on member_row.id = receipt_row.target_id and member_row.organization_id = p4_row.organization_id
  where p4_row.source_kind = 'manual'::recora_private.p4_source_kind
    and p4_row.source_namespace = 'p4b.account'
    and ((receipt_row.target_type = 'invitation' and invitation_row.id is null) or (receipt_row.target_type = 'membership' and member_row.id is null) or receipt_row.target_type not in ('invitation','membership'));
  if manual_receipt_mismatch_count <> 0 then raise exception 'operator audit target was not tied to invitation/membership id'; end if;

  if exists(select 1 from recora_private.p4_command_receipts where source_kind = 'customer_session'::recora_private.p4_source_kind and (customer_auth_user_id is null or operator_audit_event_id is not null or operator_command_receipt_id is not null)) then raise exception 'customer-session actor shape mismatch'; end if;
end;
$verify$;
rollback;
`);

runSqlExpectError(`begin; set local role anon; select * from public.recora_p4b_invitation_accept(null,null,null,null);`, /permission denied/i);
runSqlExpectError(`begin; set local role service_role; select * from public.recora_p4b_invitation_accept(null,null,null,null);`, /permission denied/i);
runSqlExpectError(`select * from public.recora_p4b_invitation_accept(null::uuid,null::uuid,null::text,null::uuid,null::uuid,null::text);`, /function public\.recora_p4b_invitation_accept/i);

function runConcurrentSql(sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--tuples-only", "--no-align"], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error(`${stdout}\n${stderr}`)));
    child.stdin.end(sql);
  });
}

async function verifySameInviteConcurrentAccept() {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const operatorUser = randomUUID();
  const customerUser = randomUUID();
  const operatorId = randomUUID();
  const orgId = randomUUID();
  const email = `issue-122-same-${suffix}@example.invalid`;
  const hash = emailHash(email);
  const setup = `
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values('${operatorUser}','issue-122-same-operator-${suffix}@example.invalid',now(),now(),now()),('${customerUser}','${email}',now(),now(),now());
insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values('${orgId}','issue-122-same-${suffix}','Issue 122 Same ${suffix}','client','local',false,false);
insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values('${operatorId}','${operatorUser}','active','issue122 same fixture');
insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values('${operatorId}','account.invitation.create','${orgId}',null);
select invitation_id from public.recora_p4b_invitation_create('${operatorUser}','${orgId}','${hash}','member',now()+interval '7 days','issue122.same.create','${randomUUID()}','${randomUUID()}','issue122.same.create.${suffix}');`;
  const invitationId = parseUuidLines(runSql(setup)).at(-1);
  assert.ok(invitationId, "same-invite concurrency invitation id missing");

  const command = () => `
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','${customerUser}',true);
select outcome || '|' || reason_code || '|' || coalesce(command_receipt_id::text,'') || '|' || coalesce(membership_id::text,'') from public.recora_p4b_invitation_accept('${invitationId}','${randomUUID()}','${randomUUID()}','issue122.same.accept.${suffix}');
commit;
`;
  const rows = (await Promise.all([runConcurrentSql(command()), runConcurrentSql(command())])).map(parsePipeRow);
  assert.deepEqual(new Set(rows.map(([outcome]) => outcome)), new Set(["accepted", "replayed"]), "same invite concurrent accept did not converge");
  assert.equal(new Set(rows.map(([, , receipt]) => receipt)).size, 1, "same invite concurrent accept created multiple command receipts");
  assert.equal(new Set(rows.map(([, , , membership]) => membership)).size, 1, "same invite concurrent accept created multiple memberships");
}

async function verifyDifferentUserConcurrentEpisodeNumbers() {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const operatorUser = randomUUID();
  const operatorId = randomUUID();
  const customerOne = randomUUID();
  const customerTwo = randomUUID();
  const orgId = randomUUID();
  const emailOne = `issue-122-episode-one-${suffix}@example.invalid`;
  const emailTwo = `issue-122-episode-two-${suffix}@example.invalid`;
  const setup = `
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values('${operatorUser}','issue-122-episode-operator-${suffix}@example.invalid',now(),now(),now()),('${customerOne}','${emailOne}',now(),now(),now()),('${customerTwo}','${emailTwo}',now(),now(),now());
insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values('${orgId}','issue-122-episode-${suffix}','Issue 122 Episode ${suffix}','client','local',false,false);
insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values('${operatorId}','${operatorUser}','active','issue122 episode fixture');
insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values('${operatorId}','account.invitation.create','${orgId}',null);
select invitation_id from public.recora_p4b_invitation_create('${operatorUser}','${orgId}','${emailHash(emailOne)}','member',now()+interval '7 days','issue122.episode.one','${randomUUID()}','${randomUUID()}','issue122.episode.one.${suffix}');
select invitation_id from public.recora_p4b_invitation_create('${operatorUser}','${orgId}','${emailHash(emailTwo)}','viewer',now()+interval '7 days','issue122.episode.two','${randomUUID()}','${randomUUID()}','issue122.episode.two.${suffix}');`;
  const invitations = parseUuidLines(runSql(setup));
  assert.equal(invitations.length, 2, "different-user concurrency invitation ids missing");
  const accept = (userId: string, invitationId: string, key: string) => `
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','${userId}',true);
select outcome || '|' || reason_code || '|' || coalesce(membership_episode_id::text,'') from public.recora_p4b_invitation_accept('${invitationId}','${randomUUID()}','${randomUUID()}','${key}');
commit;
`;
  const rows = (await Promise.all([
    runConcurrentSql(accept(customerOne, invitations[0]!, `issue122.episode.accept.one.${suffix}`)),
    runConcurrentSql(accept(customerTwo, invitations[1]!, `issue122.episode.accept.two.${suffix}`)),
  ])).map(parsePipeRow);
  assert.deepEqual(rows.map(([outcome]) => outcome).sort(), ["accepted", "accepted"], "different-user concurrent accepts did not both succeed");
  const episodeNumbers = runSql(`select episode_number::text from recora_private.p4_membership_episodes where organization_id='${orgId}' order by episode_number;`).trim().split(/\s+/).filter((value) => /^\d+$/.test(value));
  assert.deepEqual(episodeNumbers, ["1", "2"], "different-user concurrent accepts collided on episode_number");
}

async function verifyTypeScriptDtos() {
  const {
    acceptPhase4Invitation,
    createPhase4Invitation,
    reactivatePhase4Membership,
    resendPhase4Invitation,
    resolvePhase4CustomerAccess,
    revokePhase4Invitation,
    revokePhase4Membership,
    suspendPhase4Membership,
  } = await loadPhase4AccountAccessModule();
  const commandInput = {
    operatorAuthUserId: randomUUID(),
    organizationId: randomUUID(),
    recipientBindingHash: "a".repeat(64),
    intendedRole: "member" as const,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    reason: "issue122.dto",
    requestId: randomUUID(),
    correlationId: randomUUID(),
    idempotencyKey: "issue122.dto",
  };
  const resendInput = { ...commandInput, invitationId: randomUUID() };
  const revokeInput = {
    operatorAuthUserId: commandInput.operatorAuthUserId,
    invitationId: randomUUID(),
    reason: commandInput.reason,
    requestId: randomUUID(),
    correlationId: randomUUID(),
    idempotencyKey: "issue122.revoke.dto",
  };
  const membershipInput = {
    operatorAuthUserId: commandInput.operatorAuthUserId,
    membershipId: randomUUID(),
    reason: commandInput.reason,
    requestId: randomUUID(),
    correlationId: randomUUID(),
    idempotencyKey: "issue122.membership.dto",
  };
  const validCommand = validOperatorInvitationCommandRow("pending");
  assert.equal((await createPhase4Invitation(transportReturning([validCommand]), commandInput)).invitation?.state, "pending");
  assert.equal((await resendPhase4Invitation(transportReturning([validOperatorInvitationCommandRow("pending")]), resendInput)).invitation?.state, "pending");
  assert.equal((await revokePhase4Invitation(transportReturning([validOperatorInvitationCommandRow("revoked")]), revokeInput)).invitation?.state, "revoked");
  assert.equal((await suspendPhase4Membership(transportReturning([validOperatorMembershipCommandRow("suspended", "active")]), membershipInput)).membership?.status, "suspended");
  assert.equal((await reactivatePhase4Membership(transportReturning([validOperatorMembershipCommandRow("active", "active")]), membershipInput)).membership?.status, "active");
  assert.equal((await revokePhase4Membership(transportReturning([validOperatorMembershipCommandRow("revoked", "revoked")]), membershipInput)).membershipEpisode?.state, "revoked");
  const denied = await createPhase4Invitation(transportReturning([operatorPermissionDeniedCommandRow()]), commandInput);
  assert.equal(denied.outcome, "rejected");
  assert.equal(denied.reasonCode, "permission_denied");
  assert.ok(denied.auditEventId);
  assert.equal(denied.operatorCommandReceiptId, null);

  await assert.rejects(() => createPhase4Invitation(transportReturning({ ...validCommand }), commandInput), /invalid response/, "non-array command row must fail");
  await assert.rejects(() => createPhase4Invitation(transportReturning([validCommand, validCommand]), commandInput), /invalid response/, "extra command row must fail");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, extra_key: true }]), commandInput), /invalid response/, "extra command key must fail");
  await assert.rejects(() => createPhase4Invitation(transportReturning([new Proxy(validCommand, { ownKeys: () => { throw new Error("proxy"); } })]), commandInput), /invalid response/, "proxy command row must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([Object.create(Object.prototype, { ...Object.getOwnPropertyDescriptors(validCommand), outcome: { get: () => "accepted", enumerable: true } })]), commandInput), /invalid response/, "accessor command row must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, outcome: "unknown" }]), commandInput), /invalid response/, "unknown outcome must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, reason_code: "unknown" }]), commandInput), /invalid response/, "unknown command reason must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, audit_event_id: null }]), commandInput), /invalid response/, "operator evidence mismatch must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, audit_event_id: null, operator_command_receipt_id: null }]), commandInput), /invalid response/, "operator success without evidence must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, invitation_state: "accepted" }]), commandInput), /invalid response/, "create success with wrong invitation state must fail closed");
  await assert.rejects(() => revokePhase4Invitation(transportReturning([validOperatorInvitationCommandRow("pending")]), revokeInput), /invalid response/, "revoke success with pending invitation state must fail closed");
  await assert.rejects(() => suspendPhase4Membership(transportReturning([validOperatorMembershipCommandRow("active", "active")]), membershipInput), /invalid response/, "suspend success with active membership status must fail closed");
  await assert.rejects(() => suspendPhase4Membership(transportReturning([{ ...validOperatorMembershipCommandRow("suspended", "active"), invitation_id: randomUUID(), invitation_state: "accepted" }]), membershipInput), /invalid response/, "membership RPC with invitation fields must fail closed");

  const validCustomerAccept = validCustomerAcceptCommandRow();
  const accepted = await acceptPhase4Invitation(transportReturning([validCustomerAccept]), { invitationId: randomUUID(), requestId: randomUUID(), correlationId: randomUUID(), idempotencyKey: "issue122.accept.dto" });
  assert.equal(accepted.invitation?.state, "accepted");
  assert.equal(accepted.membership?.status, "active");
  assert.equal(accepted.membershipEpisode?.state, "active");
  assert.equal(accepted.auditEventId, null);
  await assert.rejects(() => acceptPhase4Invitation(transportReturning([{ ...validCustomerAccept, audit_event_id: randomUUID() }]), { invitationId: randomUUID(), requestId: randomUUID(), correlationId: randomUUID(), idempotencyKey: "issue122.accept.audit.dto" }), /invalid response/, "customer accept with operator audit evidence must fail closed");
  await assert.rejects(() => acceptPhase4Invitation(transportReturning([{ ...validCustomerAccept, membership_status: "suspended" }]), { invitationId: randomUUID(), requestId: randomUUID(), correlationId: randomUUID(), idempotencyKey: "issue122.accept.shape.dto" }), /invalid response/, "customer accept with wrong membership state must fail closed");

  const captured: Array<{ functionName: string; args: Record<string, unknown> }> = [];
  await acceptPhase4Invitation({ rpc: async <TData = unknown>(functionName: string, args: Record<string, unknown>) => { captured.push({ functionName, args }); return { data: [validCustomerAccept] as TData, error: null }; } }, { invitationId: randomUUID(), requestId: randomUUID(), correlationId: randomUUID(), idempotencyKey: "issue122.accept.dto" });
  const capturedCall = captured[0];
  assert.ok(capturedCall);
  assert.equal(capturedCall.functionName, "recora_p4b_invitation_accept");
  assert.deepEqual(Object.keys(capturedCall.args).sort(), ["p_correlation_id", "p_idempotency_key", "p_invitation_id", "p_request_id"]);

  const accessInput = { verifiedAuthUserId: randomUUID(), organizationId: randomUUID(), requiredCapability: "measurement" };
  const validAccess = validAccessRow();
  const p4cSafeAccess = await resolvePhase4CustomerAccess(transportReturning([validAccess]), accessInput);
  assert.equal(p4cSafeAccess.customerAccessAllowed, true, "P4-C-shaped safe entitlement must resolve access");
  assert.equal(p4cSafeAccess.reasonCode, "ok");
  assert.equal(p4cSafeAccess.entitlement.capabilityAllowed, true);
  assert.deepEqual(Object.keys(p4cSafeAccess.entitlement), ["capabilityAllowed"], "customer DTO must expose only the minimal entitlement projection");
  const p4cUnavailableCapability = await resolvePhase4CustomerAccess(
    transportReturning([{ ...validAccess, customer_access_allowed: false, reason_code: "capability_unavailable" }]),
    { ...accessInput, requiredCapability: "analysis" },
  );
  assert.equal(p4cUnavailableCapability.customerAccessAllowed, false);
  assert.equal(p4cUnavailableCapability.reasonCode, "capability_unavailable");
  assert.equal(p4cUnavailableCapability.entitlement.capabilityAllowed, false);
  assert.equal(
    (await resolvePhase4CustomerAccess(transportReturning([validAccess]), { ...accessInput, requiredCapability: "billing.admin" })).reasonCode,
    "resolver_unavailable",
    "reserved entitlement namespaces must fail closed",
  );
  for (const [label, data] of [
    ["malformed access row", { ...validAccess }],
    ["extra access row", [validAccess, validAccess]],
    ["extra access key", [{ ...validAccess, private_id: randomUUID() }]],
    ["proxy access row", [new Proxy(validAccess, { ownKeys: () => { throw new Error("proxy"); } })]],
    ["accessor access row", [Object.create(Object.prototype, { ...Object.getOwnPropertyDescriptors(validAccess), reason_code: { get: () => "ok", enumerable: true } })]],
    ["unknown access reason", [{ ...validAccess, reason_code: "unknown" }]],
    ["forbidden capability", [{ ...validAccess, entitlement_capabilities: { "measurement": true, "billing.admin": true } }]],
    ["evidence mismatch", [{ ...validAccess, lifecycle_reason_code: "retained" }]],
  ] as const) {
    const result = await resolvePhase4CustomerAccess(transportReturning(data), accessInput);
    assert.equal(result.customerAccessAllowed, false, label);
    assert.equal(result.reasonCode, "resolver_unavailable", label);
  }
}
Promise.resolve()
  .then(verifySameInviteConcurrentAccept)
  .then(verifyDifferentUserConcurrentEpisodeNumbers)
  .then(verifyTypeScriptDtos)
  .then(() => {
    console.log(JSON.stringify({ status: "ok", issue: 122, verifier: "p4b-account-access" }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

async function loadPhase4AccountAccessModule(): Promise<Phase4AccountAccessModule> {
  ensureServerOnlyRuntimeStub();
  return import("../lib/recora/phase4-account-access");
}

function ensureServerOnlyRuntimeStub(): void {
  const stubDir = path.join(repoRoot, "node_modules", "server-only");
  if (fs.existsSync(path.join(stubDir, "index.js"))) return;
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(path.join(stubDir, "index.js"), "module.exports = {};\n");
}
function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function transportReturning(data: unknown): Phase4AccountAccessRpcTransport {
  return { rpc: async <TData = unknown>() => ({ data: data as TData, error: null }) };
}

function validOperatorInvitationCommandRow(invitationState: "pending" | "revoked") {
  return {
    command_receipt_id: randomUUID(),
    outcome: "accepted",
    reason_code: "ok",
    invitation_id: randomUUID(),
    invitation_state: invitationState,
    membership_id: null,
    membership_status: null,
    membership_episode_id: null,
    membership_episode_state: null,
    audit_event_id: randomUUID(),
    operator_command_receipt_id: randomUUID(),
  };
}

function validCustomerAcceptCommandRow() {
  return {
    command_receipt_id: randomUUID(),
    outcome: "accepted",
    reason_code: "ok",
    invitation_id: randomUUID(),
    invitation_state: "accepted",
    membership_id: randomUUID(),
    membership_status: "active",
    membership_episode_id: randomUUID(),
    membership_episode_state: "active",
    audit_event_id: null,
    operator_command_receipt_id: null,
  };
}

function validOperatorMembershipCommandRow(membershipStatus: "active" | "suspended" | "revoked", episodeState: "active" | "revoked") {
  return {
    command_receipt_id: randomUUID(),
    outcome: "accepted",
    reason_code: "ok",
    invitation_id: null,
    invitation_state: null,
    membership_id: randomUUID(),
    membership_status: membershipStatus,
    membership_episode_id: randomUUID(),
    membership_episode_state: episodeState,
    audit_event_id: randomUUID(),
    operator_command_receipt_id: randomUUID(),
  };
}

function operatorPermissionDeniedCommandRow() {
  return {
    command_receipt_id: null,
    outcome: "rejected",
    reason_code: "permission_denied",
    invitation_id: null,
    invitation_state: null,
    membership_id: null,
    membership_status: null,
    membership_episode_id: null,
    membership_episode_state: null,
    audit_event_id: randomUUID(),
    operator_command_receipt_id: null,
  };
}
function validAccessRow() {
  return {
    customer_access_allowed: true,
    reason_code: "ok",
    membership_role: "member",
    entitlement_capabilities: { "measurement": true, "analysis": false, "prompts": true },
    entitlement_limits: {},
    lifecycle_reason_code: "active",
    entitlement_reason_code: "ok",
    checkpoint_reason_code: "ok",
  };
}

function parsePipeRow(output: string): string[] {
  const row = output.trim().split(/\r?\n/).filter((value) => value.includes("|")).at(-1);
  assert.ok(row, `no pipe row in output: ${output}`);
  return row.split("|");
}

function parseUuidLines(output: string): string[] {
  return output.split(/\s+/).filter((value) => /^[0-9a-f-]{36}$/i.test(value));
}

function extractSqlFunction(source: string, qualifiedName: string): string {
  const escaped = qualifiedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`create or replace function ${escaped}[\\s\\S]*?\\n\\$\\$;`, "i"));
  assert.ok(match, `${qualifiedName} body missing`);
  return match[0];
}

function extractSourceFunction(source: string, functionName: string): string {
  const start = source.indexOf(`export async function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} wrapper missing`);
  const next = source.indexOf("export async function", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}
