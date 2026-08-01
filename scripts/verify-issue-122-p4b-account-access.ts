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
const acceptFunctionSql = extractSqlFunction(migrationSql, "public.recora_p4b_invitation_accept");
const acceptWrapperSource = extractSourceFunction(moduleSource, "acceptPhase4Invitation");
assert.match(acceptFunctionSql, /auth\.uid\(\)/, "accept RPC must use auth.uid().");
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
  operator_id uuid := '12230000-0000-4000-8000-000000000001';
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
  command_row record;
  replay_row record;
  access_row record;
  invitation_one uuid;
  invitation_two uuid;
  invitation_resend_old uuid;
  invitation_revoked uuid;
  invitation_expired uuid;
  invitation_accept uuid;
  membership_one uuid;
  episode_one uuid;
  membership_two uuid;
  episode_two uuid;
  direct_command uuid;
  manual_receipt_mismatch_count integer;
  private_relation text;
  p4b_function record;
begin
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values
    (operator_user,'issue-122-operator@example.invalid',now(),now(),now()),
    (customer_user,'issue-122-customer@example.invalid',now(),now(),now()),
    (other_user,'issue-122-other@example.invalid',now(),now(),now()),
    (unconfirmed_user,'issue-122-unconfirmed@example.invalid',null,now(),now());

  insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values
    (org_a,'issue-122-organization-a','Issue 122 Organization A','client','local',false,false),
    (org_b,'issue-122-organization-b','Issue 122 Organization B','client','local',false,false);
  insert into public.projects(id,organization_id,slug,name) values(project_a,org_a,'issue-122-project-a','Issue 122 Project A'),(project_b,org_b,'issue-122-project-b','Issue 122 Project B');

  insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values(operator_id,operator_user,'active','issue122 operator fixture');
  insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values
    (operator_id,'account.invitation.create',org_a,null),
    (operator_id,'account.invitation.resend',org_a,null),
    (operator_id,'account.invitation.revoke',org_a,null),
    (operator_id,'account.membership.suspend',org_a,null),
    (operator_id,'account.membership.reactivate',org_a,null),
    (operator_id,'account.membership.revoke',org_a,null);

  insert into recora_private.data_lifecycle_current(organization_id,project_id,state,last_request_id,last_correlation_id) values
    (org_a,null,'active','12240000-0000-4000-8000-000000000001','12250000-0000-4000-8000-000000000001'),
    (org_b,null,'active','12240000-0000-4000-8000-000000000002','12250000-0000-4000-8000-000000000002');

  insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document) values(
    '12260000-0000-4000-8000-000000000001','issue122.policy',1,now()-interval '1 day','{"capabilities":{"report.view":true,"export.data":false},"limits":{"projects":1}}'::jsonb
  );
  insert into recora_private.entitlement_snapshots(id,organization_id,project_id,source_contract_reference,plan_policy_version_id,entitlement_schema_version,resolved_document,effective_from,resolver_version,idempotency_key) values(
    '12270000-0000-4000-8000-000000000001',org_a,null,'issue122.contract','12260000-0000-4000-8000-000000000001',1,'{"capabilities":{"report.view":true,"export.data":false},"limits":{"projects":1}}'::jsonb,now()-interval '1 hour','issue122.verifier','issue122.snapshot'
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
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000012','12250000-0000-4000-8000-000000000012','issue122.create.one');
  if replay_row.outcome <> 'replayed' or replay_row.command_receipt_id <> command_row.command_receipt_id then raise exception 'create replay failed'; end if;
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
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'permission_denied' then raise exception 'operator permission negative failed'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_b,'viewer',now()+interval '7 days','issue122.resend.create','12240000-0000-4000-8000-000000000021','12250000-0000-4000-8000-000000000021','issue122.resend.create');
  invitation_resend_old := command_row.invitation_id;
  select * into command_row from public.recora_p4b_invitation_resend(operator_user,invitation_resend_old,hash_b,now()+interval '8 days','issue122.resend','12240000-0000-4000-8000-000000000022','12250000-0000-4000-8000-000000000022','issue122.resend');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'pending' or command_row.invitation_id = invitation_resend_old then raise exception 'invitation resend failed'; end if;
  invitation_two := command_row.invitation_id;
  if (select state from recora_private.p4_invitations where id = invitation_resend_old) <> 'revoked'::recora_private.p4_invitation_state then raise exception 'old invitation was not invalidated on resend'; end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_resend_old,'12240000-0000-4000-8000-000000000023','12250000-0000-4000-8000-000000000023','issue122.accept.superseded');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'invitation_unavailable' then raise exception 'invalidated invitation accept was not rejected'; end if;
  select * into replay_row from public.recora_p4b_invitation_resend(operator_user,invitation_two,hash_c,now()+interval '8 days','issue122.resend.bad','12240000-0000-4000-8000-000000000024','12250000-0000-4000-8000-000000000024','issue122.resend.bad');
  if replay_row.reason_code <> 'recipient_mismatch' then raise exception 'resend recipient mismatch negative failed'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_c,'member',now()+interval '7 days','issue122.revoke.create','12240000-0000-4000-8000-000000000031','12250000-0000-4000-8000-000000000031','issue122.revoke.create');
  invitation_revoked := command_row.invitation_id;
  select * into command_row from public.recora_p4b_invitation_revoke(operator_user,invitation_revoked,'issue122.revoke','12240000-0000-4000-8000-000000000032','12250000-0000-4000-8000-000000000032','issue122.revoke');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'revoked' then raise exception 'invitation revoke failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_revoked,'12240000-0000-4000-8000-000000000033','12250000-0000-4000-8000-000000000033','issue122.accept.revoked');
  if replay_row.reason_code <> 'invitation_unavailable' then raise exception 'revoked invitation accept was not rejected'; end if;

  select command_receipt_id into direct_command from public.recora_p4_record_command_receipt(org_a,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'p4b.account','invite.expired',9001,repeat('1',64),'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041','issue122.expired.fixture');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
  values(org_a,hash_d,direct_command,direct_command,'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041',now()-interval '1 hour',now()-interval '2 hours') returning id into invitation_expired;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(invitation_expired,org_a,1,'pending',direct_command,'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041');
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
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into command_row from public.recora_p4b_invitation_accept(invitation_accept,'12240000-0000-4000-8000-000000000054','12250000-0000-4000-8000-000000000054','issue122.accept');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'accepted' or command_row.membership_status <> 'active' or command_row.membership_episode_state <> 'active' then raise exception 'invitation accept activation failed'; end if;
  membership_one := command_row.membership_id; episode_one := command_row.membership_episode_id;
  if (select count(*) from recora_private.p4_membership_episode_events where episode_id = episode_one) <> 2 then raise exception 'membership activation events missing'; end if;
  if not exists(select 1 from recora_private.p4_command_receipts where id=command_row.command_receipt_id and source_kind='customer_session'::recora_private.p4_source_kind and customer_auth_user_id=customer_user and operator_audit_event_id is null and operator_command_receipt_id is null) then raise exception 'customer-session command receipt actor evidence missing'; end if;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,'12240000-0000-4000-8000-000000000055','12250000-0000-4000-8000-000000000055','issue122.accept');
  if replay_row.outcome <> 'replayed' or replay_row.membership_id <> membership_one then raise exception 'accept replay failed'; end if;

  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,null,'report.view');
  if not access_row.customer_access_allowed or access_row.reason_code <> 'ok' or access_row.membership_role <> 'member' or access_row.entitlement_capabilities ? 'snapshot_id' then raise exception 'derived access positive/customer-safe DTO failed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,project_a,'report.view');
  if not access_row.customer_access_allowed or access_row.reason_code <> 'ok' then raise exception 'explicit project scope did not inherit organization entitlement'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,project_b,'report.view');
  if access_row.customer_access_allowed or access_row.reason_code <> 'invalid_scope' then raise exception 'cross-project explicit scope did not fail closed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,null,'export.data');
  if access_row.customer_access_allowed or access_row.reason_code <> 'capability_unavailable' then raise exception 'capability negative failed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_b,null,'report.view');
  if access_row.customer_access_allowed or access_row.reason_code <> 'membership_required' then raise exception 'cross-tenant derived access failed'; end if;

  select * into command_row from public.recora_p4b_membership_suspend(operator_user,membership_one,'issue122.suspend','12240000-0000-4000-8000-000000000061','12250000-0000-4000-8000-000000000061','issue122.suspend');
  if command_row.outcome <> 'accepted' or command_row.membership_status <> 'suspended' then raise exception 'membership suspend failed'; end if;
  select * into access_row from public.recora_p4b_resolve_customer_access(customer_user,org_a,null,'report.view');
  if access_row.customer_access_allowed or access_row.reason_code <> 'membership_required' then raise exception 'suspended membership retained access'; end if;
  select * into command_row from public.recora_p4b_membership_reactivate(operator_user,membership_one,'issue122.reactivate','12240000-0000-4000-8000-000000000062','12250000-0000-4000-8000-000000000062','issue122.reactivate');
  if command_row.outcome <> 'accepted' or command_row.membership_status <> 'active' then raise exception 'membership reactivate failed'; end if;
  select * into command_row from public.recora_p4b_membership_revoke(operator_user,membership_one,'issue122.member.revoke','12240000-0000-4000-8000-000000000063','12250000-0000-4000-8000-000000000063','issue122.member.revoke');
  if command_row.outcome <> 'accepted' or command_row.membership_status <> 'revoked' or command_row.membership_episode_state <> 'revoked' then raise exception 'membership revoke failed'; end if;
  if (select user_id from public.organization_members where id = membership_one) is not null then raise exception 'revoked membership user identity was not freed'; end if;
  select * into replay_row from public.recora_p4b_membership_reactivate(operator_user,membership_one,'issue122.bad.reactivate','12240000-0000-4000-8000-000000000064','12250000-0000-4000-8000-000000000064','issue122.bad.reactivate');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'membership_not_suspended' then raise exception 'direct revoked reactivation was not rejected'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_e,'member',now()+interval '7 days','issue122.rejoin.create','12240000-0000-4000-8000-000000000071','12250000-0000-4000-8000-000000000071','issue122.rejoin.create');
  invitation_two := command_row.invitation_id;
  perform set_config('request.jwt.claim.sub', customer_user::text, true);
  select * into command_row from public.recora_p4b_invitation_accept(invitation_two,'12240000-0000-4000-8000-000000000072','12250000-0000-4000-8000-000000000072','issue122.rejoin.accept');
  membership_two := command_row.membership_id; episode_two := command_row.membership_episode_id;
  if command_row.outcome <> 'accepted' or membership_two = membership_one or episode_two = episode_one then raise exception 'revoked relation did not require new invitation/episode'; end if;

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
  const { acceptPhase4Invitation, createPhase4Invitation, resolvePhase4CustomerAccess } = await loadPhase4AccountAccessModule();
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
  const validCommand = validCommandRow();
  await assert.rejects(() => createPhase4Invitation(transportReturning({ ...validCommand }), commandInput), /invalid response/, "non-array command row must fail");
  await assert.rejects(() => createPhase4Invitation(transportReturning([validCommand, validCommand]), commandInput), /invalid response/, "extra command row must fail");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, extra_key: true }]), commandInput), /invalid response/, "extra command key must fail");
  await assert.rejects(() => createPhase4Invitation(transportReturning([new Proxy(validCommand, { ownKeys: () => { throw new Error("proxy"); } })]), commandInput), /invalid response/, "proxy command row must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([Object.create(Object.prototype, { ...Object.getOwnPropertyDescriptors(validCommand), outcome: { get: () => "accepted", enumerable: true } })]), commandInput), /invalid response/, "accessor command row must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, outcome: "unknown" }]), commandInput), /invalid response/, "unknown outcome must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, reason_code: "unknown" }]), commandInput), /invalid response/, "unknown command reason must fail closed");
  await assert.rejects(() => createPhase4Invitation(transportReturning([{ ...validCommand, audit_event_id: null }]), commandInput), /invalid response/, "operator evidence mismatch must fail closed");

  const captured: Array<{ functionName: string; args: Record<string, unknown> }> = [];
  await acceptPhase4Invitation({ rpc: async <TData = unknown>(functionName: string, args: Record<string, unknown>) => { captured.push({ functionName, args }); return { data: [validCommand] as TData, error: null }; } }, { invitationId: randomUUID(), requestId: randomUUID(), correlationId: randomUUID(), idempotencyKey: "issue122.accept.dto" });
  const capturedCall = captured[0];
  assert.ok(capturedCall);
  assert.equal(capturedCall.functionName, "recora_p4b_invitation_accept");
  assert.deepEqual(Object.keys(capturedCall.args).sort(), ["p_correlation_id", "p_idempotency_key", "p_invitation_id", "p_request_id"]);

  const accessInput = { verifiedAuthUserId: randomUUID(), organizationId: randomUUID(), requiredCapability: "report.view" };
  const validAccess = validAccessRow();
  assert.equal((await resolvePhase4CustomerAccess(transportReturning([validAccess]), accessInput)).customerAccessAllowed, true);
  for (const [label, data] of [
    ["malformed access row", { ...validAccess }],
    ["extra access row", [validAccess, validAccess]],
    ["extra access key", [{ ...validAccess, private_id: randomUUID() }]],
    ["proxy access row", [new Proxy(validAccess, { ownKeys: () => { throw new Error("proxy"); } })]],
    ["accessor access row", [Object.create(Object.prototype, { ...Object.getOwnPropertyDescriptors(validAccess), reason_code: { get: () => "ok", enumerable: true } })]],
    ["unknown access reason", [{ ...validAccess, reason_code: "unknown" }]],
    ["forbidden capability", [{ ...validAccess, entitlement_capabilities: { "report.view": true, "billing.admin": true } }]],
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

function validCommandRow() {
  return {
    command_receipt_id: randomUUID(),
    outcome: "accepted",
    reason_code: "ok",
    invitation_id: randomUUID(),
    invitation_state: "pending",
    membership_id: null,
    membership_status: null,
    membership_episode_id: null,
    membership_episode_state: null,
    audit_event_id: randomUUID(),
    operator_command_receipt_id: randomUUID(),
  };
}

function validAccessRow() {
  return {
    customer_access_allowed: true,
    reason_code: "ok",
    membership_role: "member",
    entitlement_capabilities: { "report.view": true, "export.data": false },
    entitlement_limits: { projects: 1 },
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
