import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
  /alter\s+table/i,
  /create\s+type/i,
  /create\s+(unique\s+)?index/i,
  /create\s+policy/i,
  /enable\s+row\s+level\s+security/i,
  /grant\s+execute[\s\S]*\b(?:anon|authenticated)\b/i,
  /auth\.admin/i,
  /send(email|_email)|send_email|smtp|mailgun|postmark|resend\.emails/i,
]) {
  assert.doesNotMatch(migrationSql, forbidden, `migration contains forbidden pattern ${forbidden}`);
}

assert.doesNotMatch(configSource, /schemas\s*=\s*\[[^\]]*recora_private/i, "recora_private must not be exposed through the Data API config.");
assert.match(moduleSource, /import "server-only";/, "P4-B module must be server-only.");
assert.doesNotMatch(moduleSource, /process\.env|createRecoraSupabaseServiceRoleClient|from\(|recora_private/i, "P4-B module must use injected RPC transport and no direct SQL/private-table access.");
assert.match(moduleSource, /Phase4CustomerAccessDto/, "customer-safe DTO type is missing.");

for (const functionName of [
  "recora_p4b_invitation_create",
  "recora_p4b_invitation_resend",
  "recora_p4b_invitation_revoke",
  "recora_p4b_invitation_accept",
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
  operator_id uuid := '12230000-0000-4000-8000-000000000001';
  org_a uuid := '12210000-0000-4000-8000-000000000001';
  org_b uuid := '12210000-0000-4000-8000-000000000002';
  project_a uuid := '12220000-0000-4000-8000-000000000001';
  project_b uuid := '12220000-0000-4000-8000-000000000002';
  hash_a text := repeat('a', 64);
  hash_b text := repeat('b', 64);
  hash_c text := repeat('c', 64);
  hash_d text := repeat('d', 64);
  hash_e text := repeat('e', 64);
  hash_f text := repeat('f', 64);
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
  insert into auth.users(id,email,created_at,updated_at) values
    (operator_user,'issue-122-operator@example.invalid',now(),now()),
    (customer_user,'issue-122-customer@example.invalid',now(),now()),
    (other_user,'issue-122-other@example.invalid',now(),now());

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
    if has_function_privilege('anon',p4b_function.oid,'execute') or has_function_privilege('authenticated',p4b_function.oid,'execute') then raise exception 'P4-B browser execution exposed: %.%', p4b_function.nspname, p4b_function.proname; end if;
    if p4b_function.nspname = 'public' and not has_function_privilege('service_role',p4b_function.oid,'execute') then raise exception 'P4-B service_role grant missing: %', p4b_function.proname; end if;
  end loop;

  foreach private_relation in array array['p4_command_receipts','p4_invitations','p4_invitation_events','p4_membership_episodes','p4_membership_episode_events','p4_command_conflicts'] loop
    if has_table_privilege('anon',format('recora_private.%I', private_relation),'select')
      or has_table_privilege('authenticated',format('recora_private.%I', private_relation),'insert') then
      raise exception 'P4-B private relation exposed to browser role: %', private_relation;
    end if;
  end loop;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000011','12250000-0000-4000-8000-000000000011','issue122.create.one');
  if command_row.outcome <> 'accepted' or command_row.reason_code <> 'ok' or command_row.invitation_state <> 'pending' or command_row.audit_event_id is null or command_row.operator_command_receipt_id is null then raise exception 'invitation create failed'; end if;
  invitation_one := command_row.invitation_id;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_a,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000012','12250000-0000-4000-8000-000000000012','issue122.create.one');
  if replay_row.outcome <> 'replayed' or replay_row.command_receipt_id <> command_row.command_receipt_id then raise exception 'create replay failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_b,'member',now()+interval '7 days','issue122.create','12240000-0000-4000-8000-000000000013','12250000-0000-4000-8000-000000000013','issue122.create.one');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'idempotency_conflict' then raise exception 'create idempotency conflict failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_a,repeat('9',64),'owner',now()+interval '7 days','issue122.owner','12240000-0000-4000-8000-000000000014','12250000-0000-4000-8000-000000000014','issue122.owner');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'invalid_reference' then raise exception 'owner role escalation was not rejected'; end if;
  select * into replay_row from public.recora_p4b_invitation_create(operator_user,org_b,hash_b,'member',now()+interval '7 days','issue122.cross','12240000-0000-4000-8000-000000000015','12250000-0000-4000-8000-000000000015','issue122.cross');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'permission_denied' then raise exception 'operator permission negative failed'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_b,'viewer',now()+interval '7 days','issue122.resend.create','12240000-0000-4000-8000-000000000021','12250000-0000-4000-8000-000000000021','issue122.resend.create');
  invitation_resend_old := command_row.invitation_id;
  select * into command_row from public.recora_p4b_invitation_resend(operator_user,invitation_resend_old,hash_b,now()+interval '8 days','issue122.resend','12240000-0000-4000-8000-000000000022','12250000-0000-4000-8000-000000000022','issue122.resend');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'pending' or command_row.invitation_id = invitation_resend_old then raise exception 'invitation resend failed'; end if;
  invitation_two := command_row.invitation_id;
  if (select state from recora_private.p4_invitations where id = invitation_resend_old) <> 'superseded'::recora_private.p4_invitation_state then raise exception 'old invitation was not superseded'; end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_resend_old,customer_user,hash_b,'12240000-0000-4000-8000-000000000023','12250000-0000-4000-8000-000000000023','issue122.accept.superseded');
  if replay_row.outcome <> 'rejected' or replay_row.reason_code <> 'invitation_not_pending' then raise exception 'superseded invitation accept was not rejected'; end if;
  select * into replay_row from public.recora_p4b_invitation_resend(operator_user,invitation_two,hash_c,now()+interval '8 days','issue122.resend.bad','12240000-0000-4000-8000-000000000024','12250000-0000-4000-8000-000000000024','issue122.resend.bad');
  if replay_row.reason_code <> 'recipient_mismatch' then raise exception 'resend recipient mismatch negative failed'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_c,'member',now()+interval '7 days','issue122.revoke.create','12240000-0000-4000-8000-000000000031','12250000-0000-4000-8000-000000000031','issue122.revoke.create');
  invitation_revoked := command_row.invitation_id;
  select * into command_row from public.recora_p4b_invitation_revoke(operator_user,invitation_revoked,'issue122.revoke','12240000-0000-4000-8000-000000000032','12250000-0000-4000-8000-000000000032','issue122.revoke');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'revoked' then raise exception 'invitation revoke failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_revoked,customer_user,hash_c,'12240000-0000-4000-8000-000000000033','12250000-0000-4000-8000-000000000033','issue122.accept.revoked');
  if replay_row.reason_code <> 'invitation_not_pending' then raise exception 'revoked invitation accept was not rejected'; end if;

  select command_receipt_id into direct_command from public.recora_p4_record_command_receipt(org_a,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'p4b.account','invite.expired',9001,repeat('1',64),'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041','issue122.expired.fixture');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
  values(org_a,hash_d,direct_command,direct_command,'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041',now()-interval '1 hour',now()-interval '2 hours') returning id into invitation_expired;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(invitation_expired,org_a,1,'pending',direct_command,'12240000-0000-4000-8000-000000000041','12250000-0000-4000-8000-000000000041');
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_expired,customer_user,hash_d,'12240000-0000-4000-8000-000000000042','12250000-0000-4000-8000-000000000042','issue122.accept.expired');
  if replay_row.reason_code <> 'invitation_expired' then raise exception 'expired invitation accept was not rejected'; end if;

  select * into command_row from public.recora_p4b_invitation_create(operator_user,org_a,hash_e,'member',now()+interval '7 days','issue122.accept.create','12240000-0000-4000-8000-000000000051','12250000-0000-4000-8000-000000000051','issue122.accept.create');
  invitation_accept := command_row.invitation_id;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,other_user,hash_f,'12240000-0000-4000-8000-000000000052','12250000-0000-4000-8000-000000000052','issue122.accept.mismatch');
  if replay_row.reason_code <> 'recipient_mismatch' then raise exception 'recipient mismatch negative failed'; end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,'12200000-0000-4000-8000-000000009999',hash_e,'12240000-0000-4000-8000-000000000053','12250000-0000-4000-8000-000000000053','issue122.accept.identity');
  if replay_row.reason_code <> 'identity_unverified' then raise exception 'unverified identity negative failed'; end if;
  select * into command_row from public.recora_p4b_invitation_accept(invitation_accept,customer_user,hash_e,'12240000-0000-4000-8000-000000000054','12250000-0000-4000-8000-000000000054','issue122.accept');
  if command_row.outcome <> 'accepted' or command_row.invitation_state <> 'accepted' or command_row.membership_status <> 'active' or command_row.membership_episode_state <> 'active' then raise exception 'invitation accept activation failed'; end if;
  membership_one := command_row.membership_id; episode_one := command_row.membership_episode_id;
  if (select count(*) from recora_private.p4_membership_episode_events where episode_id = episode_one) <> 2 then raise exception 'membership activation events missing'; end if;
  select * into replay_row from public.recora_p4b_invitation_accept(invitation_accept,customer_user,hash_e,'12240000-0000-4000-8000-000000000055','12250000-0000-4000-8000-000000000055','issue122.accept');
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
  select * into command_row from public.recora_p4b_invitation_accept(invitation_two,customer_user,hash_e,'12240000-0000-4000-8000-000000000072','12250000-0000-4000-8000-000000000072','issue122.rejoin.accept');
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
end;
$verify$;
rollback;
`);

runSqlExpectError(`begin; set local role anon; select * from public.recora_p4b_invitation_accept(null,null,null,null,null,null);`, /permission denied/i);

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

async function verifyConcurrentAccept() {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const operatorUser = randomUUID();
  const customerUser = randomUUID();
  const operatorId = randomUUID();
  const orgId = randomUUID();
  const hash = "1".repeat(64);
  const invitationRequest = randomUUID();
  const invitationCorrelation = randomUUID();
  const acceptRequestOne = randomUUID();
  const acceptCorrelationOne = randomUUID();
  const acceptRequestTwo = randomUUID();
  const acceptCorrelationTwo = randomUUID();
  const setup = `
insert into auth.users(id,email,created_at,updated_at) values('${operatorUser}','issue-122-concurrent-operator-${suffix}@example.invalid',now(),now()),('${customerUser}','issue-122-concurrent-customer-${suffix}@example.invalid',now(),now());
insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values('${orgId}','issue-122-concurrent-${suffix}','Issue 122 Concurrent ${suffix}','client','local',false,false);
insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values('${operatorId}','${operatorUser}','active','issue122 concurrent fixture');
insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values('${operatorId}','account.invitation.create','${orgId}',null);
select invitation_id from public.recora_p4b_invitation_create('${operatorUser}','${orgId}','${hash}','member',now()+interval '7 days','issue122.concurrent.create','${invitationRequest}','${invitationCorrelation}','issue122.concurrent.create.${suffix}');`;
  const setupOutput = runSql(setup);
  const invitationId = setupOutput.trim().split(/\s+/).filter((value) => /^[0-9a-f-]{36}$/.test(value)).at(-1);
  assert.ok(invitationId, `could not parse concurrent invitation id from ${setupOutput}`);

  const command = (requestId: string, correlationId: string) => `select outcome || '|' || reason_code || '|' || coalesce(command_receipt_id::text,'') || '|' || coalesce(membership_id::text,'') from public.recora_p4b_invitation_accept('${invitationId}','${customerUser}','${hash}','${requestId}','${correlationId}','issue122.concurrent.accept.${suffix}');`;
  const outputs = await Promise.all([
    runConcurrentSql(command(acceptRequestOne, acceptCorrelationOne)),
    runConcurrentSql(command(acceptRequestTwo, acceptCorrelationTwo)),
  ]);
  const rows = outputs.map((output) => output.trim().split(/\r?\n/).filter(Boolean).at(-1)!.split("|"));
  assert.deepEqual(new Set(rows.map(([outcome]) => outcome)), new Set(["accepted", "replayed"]), "concurrent accept did not converge to accepted/replayed");
  assert.equal(new Set(rows.map(([, , commandReceiptId]) => commandReceiptId)).size, 1, "concurrent accept created multiple command receipts");
  assert.equal(new Set(rows.map(([, , , membershipId]) => membershipId)).size, 1, "concurrent accept created multiple memberships");
}

verifyConcurrentAccept()
  .then(() => {
    console.log(JSON.stringify({ status: "ok", issue: 122, verifier: "p4b-account-access" }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });