import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import * as ts from "typescript";

const repoRoot = process.cwd();
const dbContainer = process.env.RECORA_ISSUE_121_DB_CONTAINER;
const expectedContainer = "supabase_db_recoraissue121";
const migrationPath = path.join(repoRoot, "supabase", "migrations", "20260730200448_p4a_phase4_common_contract_state_events.sql");

assert.equal(dbContainer, expectedContainer, "Issue #121 requires only its isolated local DB container.");
assert.ok(fs.existsSync(migrationPath), "P4-A migration is missing.");

function runSql(sql: string) {
  const result = spawnSync(
    "docker",
    ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet"],
    { input: sql, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024 }
  );
  assert.equal(result.status, 0, `${result.stdout}
${result.stderr}`);
}

const migration = fs.readFileSync(migrationPath, "utf8");
for (const required of [
  "p4_business_lifecycle_current",
  "p4_invitations",
  "p4_contract_projections",
  "p4_billing_receipts",
  "p4_normalized_payment_facts",
  "p4_downstream_checkpoints",
  "p4_durable_outbox",
  "recora_p4_record_command_receipt",
  "recora_p4_resolve_checkpoint_gate",
  "set search_path=''"
]) {
  assert.match(migration, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `migration lacks ${required}`);
}
assert.match(migration, /payload_fingerprint/, "P4-A must persist only the payload fingerprint boundary.");

runSql(`
begin;
do $verify$
declare
  org_id uuid := '00000000-0000-4000-8000-000000000001';
  command_id uuid;
  checkpoint_command_id uuid;
  replay_id uuid;
  command_outcome recora_private.p4_command_outcome;
  command_reason recora_private.p4_reason;
  gate record;
  relation_name text;
begin
  if current_database() <> 'postgres' then raise exception 'Issue 121 requires isolated local postgres'; end if;
  foreach relation_name in array array[
    'p4_command_receipts','p4_business_lifecycle_episodes','p4_business_lifecycle_current','p4_business_lifecycle_events',
    'p4_invitations','p4_invitation_events','p4_contract_projections','p4_contract_events','p4_billing_receipts',
    'p4_billing_receipt_events','p4_normalized_payment_facts','p4_downstream_checkpoints','p4_durable_outbox','p4_membership_episodes','p4_membership_episode_events','p4_checkpoint_events','p4_outbox_events','p4_command_conflicts'
  ] loop
    if not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='recora_private' and c.relname=relation_name and c.relrowsecurity) then
      raise exception 'P4 RLS missing on %', relation_name;
    end if;
    if has_table_privilege('anon',format('recora_private.%I',relation_name),'select') or has_table_privilege('authenticated',format('recora_private.%I',relation_name),'select') then
      raise exception 'P4 private relation exposed to browser role: %', relation_name;
    end if;
  end loop;
  if not has_schema_privilege('anon','recora_private','usage') or not has_function_privilege('anon','recora_private.can_read_organization(uuid)','execute') or not has_function_privilege('authenticated','recora_private.can_read_project(uuid)','execute') then raise exception 'Phase 3 helper grant changed'; end if;
  if has_function_privilege('anon','public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)','execute')
    or has_function_privilege('authenticated','public.recora_p4_resolve_checkpoint_gate(uuid,uuid)','execute')
    or not has_function_privilege('service_role','public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)','execute') then
    raise exception 'P4 RPC grant boundary invalid';
  end if;
  select command_receipt_id,outcome,stable_reason into command_id,command_outcome,command_reason
  from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','fixture.event',1,repeat('a',64),'12100000-0000-4000-8000-000000000001','12110000-0000-4000-8000-000000000001','fixture.command');
  if command_id is null or command_outcome <> 'accepted' or command_reason <> 'ok' then raise exception 'P4 positive command receipt failed'; end if;
  select command_receipt_id,outcome,stable_reason into replay_id,command_outcome,command_reason
  from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','fixture.event',1,repeat('a',64),'12100000-0000-4000-8000-000000000001','12110000-0000-4000-8000-000000000001','fixture.command');
  if replay_id <> command_id or command_outcome <> 'replayed' or command_reason <> 'duplicate_command' then raise exception 'P4 idempotent replay failed'; end if;
  select outcome,stable_reason into command_outcome,command_reason
  from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','fixture.conflict',2,repeat('b',64),'12100000-0000-4000-8000-000000000002','12110000-0000-4000-8000-000000000002','fixture.command');
  if command_outcome <> 'rejected' or command_reason <> 'idempotency_conflict' then raise exception 'P4 contradictory idempotency was accepted'; end if;
  select outcome into command_outcome from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','unsafe.payload',3,repeat('c',64),'12100000-0000-4000-8000-000000000003','12110000-0000-4000-8000-000000000003','fixture.payload');
  if command_outcome <> 'rejected' then raise exception 'P4 unsafe payload-shaped source was accepted'; end if;
  select command_receipt_id into checkpoint_command_id
  from public.recora_p4_record_command_receipt(org_id,null,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','checkpoint.basic',4,repeat('d',64),'12100000-0000-4000-8000-000000000004','12110000-0000-4000-8000-000000000004','checkpoint.basic');
  insert into recora_private.p4_downstream_checkpoints(organization_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason)
  values(org_id,checkpoint_command_id,'lifecycle.effect',true,'pending','checkpoint_pending');
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null);
  if gate.customer_access_allowed or gate.reason_code <> 'checkpoint_pending' then raise exception 'P4 pending checkpoint did not deny'; end if;
  update recora_private.p4_downstream_checkpoints set state='failed',stable_reason='checkpoint_failed' where command_receipt_id=checkpoint_command_id;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null);
  if gate.customer_access_allowed or gate.reason_code <> 'checkpoint_failed' then raise exception 'P4 failed checkpoint did not deny'; end if;
  update recora_private.p4_downstream_checkpoints set state='reconciliation_required',stable_reason='reconciliation_required' where command_receipt_id=checkpoint_command_id;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null);
  if gate.customer_access_allowed or gate.reason_code <> 'reconciliation_required' then raise exception 'P4 reconciliation checkpoint did not deny'; end if;
  begin update recora_private.p4_command_receipts set command_type='changed.command' where id=command_id; raise exception 'P4 command receipt mutation accepted'; exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;
  begin insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,state,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('d',64),'accepted',command_id,command_id,'12100000-0000-4000-8000-000000000001','12110000-0000-4000-8000-000000000001',now()+interval '1 day'); raise exception 'P4 invitation accepted without recipient proof'; exception when check_violation then if sqlerrm !~ 'p4_invitation_state_shape' then raise; end if; when raise_exception then if sqlerrm !~ 'acceptance requires verified user and membership|P4 current initial state invalid|P4 domain command type or scope mismatch' then raise; end if; end;
  begin insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id) values(gen_random_uuid(),org_id,1,'fixture.p4','order.one',1,repeat('e',64),'active',command_id,gen_random_uuid(),gen_random_uuid()); raise exception 'P4 contract non-draft initial state accepted'; exception when foreign_key_violation or check_violation or raise_exception then null; end;
end;
$verify$;
rollback;
`);

runSql(`
begin;
do $owner_matrix$
declare org_id uuid := '00000000-0000-4000-8000-000000000001'; project_id uuid := '10000000-0000-4000-8000-000000000001'; command_one uuid; command_two uuid; checkpoint_command uuid; old_invitation uuid; new_invitation uuid; gate record;
begin
  select command_receipt_id into command_one from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','invite.one',10,repeat('1',64),'12100000-0000-4000-8000-000000000010','12110000-0000-4000-8000-000000000010','invite.one');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('2',64),command_one,command_one,'12100000-0000-4000-8000-000000000010','12110000-0000-4000-8000-000000000010',now()+interval '1 day') returning id into old_invitation;
  select command_receipt_id into command_two from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','invite.two',11,repeat('3',64),'12100000-0000-4000-8000-000000000011','12110000-0000-4000-8000-000000000011','invite.two');
  update recora_private.p4_invitations set state='superseded',terminal_at=now(),last_command_receipt_id=command_two,request_id='12100000-0000-4000-8000-000000000011',correlation_id='12110000-0000-4000-8000-000000000011' where id=old_invitation;
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('2',64),command_two,command_two,'12100000-0000-4000-8000-000000000011','12110000-0000-4000-8000-000000000011',now()+interval '1 day') returning id into new_invitation;
  update recora_private.p4_invitations set superseded_by_invitation_id=new_invitation where id=old_invitation;
  select command_receipt_id into checkpoint_command from public.recora_p4_record_command_receipt(org_id,null,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','checkpoint.owner',12,repeat('4',64),'12100000-0000-4000-8000-000000000012','12110000-0000-4000-8000-000000000012','checkpoint.owner');
  insert into recora_private.p4_downstream_checkpoints(organization_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason) values(org_id,checkpoint_command,'lifecycle.effect',true,'pending','checkpoint_pending');
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,project_id);if gate.customer_access_allowed or gate.reason_code<>'checkpoint_pending' then raise exception 'organization checkpoint did not hard-ceiling project access';end if;
  update recora_private.p4_downstream_checkpoints set state='failed',stable_reason='checkpoint_failed' where command_receipt_id=checkpoint_command;
  update recora_private.p4_downstream_checkpoints set state='pending',stable_reason='checkpoint_pending' where command_receipt_id=checkpoint_command;
  update recora_private.p4_downstream_checkpoints set state='applying',stable_reason='checkpoint_pending' where command_receipt_id=checkpoint_command;
  update recora_private.p4_downstream_checkpoints set state='completed',stable_reason='ok' where command_receipt_id=checkpoint_command;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,project_id);if not gate.customer_access_allowed or gate.reason_code<>'ok' then raise exception 'completed correction did not restore project access';end if;
end;
$owner_matrix$;
rollback;
`);
console.log(JSON.stringify({
  status: "ok",
  database: "isolated-local-only",
  container: dbContainer,
  migration: path.relative(repoRoot, migrationPath),
  cases: {
    privateRlsAndGrants: "validated",
    providerPayloadBoundary: "validated",
    idempotencyAndConflict: "validated",
    checkpointFailClosed: "validated",
    appendOnlyAndInvitationNegative: "validated",
    invitationSupersessionAndOrganizationHardCeiling: "validated",
    checkpointRetryAndRecovery: "validated"
  }
}, null, 2));

// OWNER 5145421314: exercise actual P4-A rows, then force deferred projection
// checks. Each row is rolled back, so the seeded fixture remains unchanged.
runSql(`
begin;
do $full_p4_matrix$
declare
  org_id uuid := '00000000-0000-4000-8000-000000000001';
  r_business uuid; r_invite uuid; r_contract_one uuid; r_contract_two uuid; r_receipt_one uuid; r_receipt_two uuid; r_payment_one uuid; r_payment_two uuid; r_checkpoint_one uuid; r_checkpoint_two uuid;
  business_id uuid; invite_id uuid; episode_id uuid; contract_id uuid; billing_one uuid; billing_two uuid; checkpoint_old uuid; checkpoint_new uuid; outbox_old uuid; outbox_new uuid; fact_one uuid;
  gate record;
begin
  select command_receipt_id into r_business from public.recora_p4_record_command_receipt(org_id,null,'business.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','business.one',101,repeat('1',64),'12100000-0000-4000-8000-000000000101','12110000-0000-4000-8000-000000000101','business.one');
  insert into recora_private.p4_business_lifecycle_episodes(organization_id,episode_number,start_command_receipt_id,request_id,correlation_id) values(org_id,101,r_business,'12100000-0000-4000-8000-000000000101','12110000-0000-4000-8000-000000000101') returning id into business_id;
  insert into recora_private.p4_business_lifecycle_current(organization_id,episode_id,state,last_command_receipt_id) values(org_id,business_id,'lead',r_business);
  insert into recora_private.p4_business_lifecycle_events(episode_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(business_id,org_id,1,'lead',r_business,'12100000-0000-4000-8000-000000000101','12110000-0000-4000-8000-000000000101');

  select command_receipt_id into r_invite from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','invite.current',102,repeat('2',64),'12100000-0000-4000-8000-000000000102','12110000-0000-4000-8000-000000000102','invite.current');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('3',64),r_invite,r_invite,'12100000-0000-4000-8000-000000000102','12110000-0000-4000-8000-000000000102',now()+interval '1 day') returning id into invite_id;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(invite_id,org_id,1,'pending',r_invite,'12100000-0000-4000-8000-000000000102','12110000-0000-4000-8000-000000000102');
  insert into recora_private.p4_membership_episodes(organization_id,invitation_id,intended_role,episode_number,command_receipt_id,request_id,correlation_id) values(org_id,invite_id,'member',101,r_invite,'12100000-0000-4000-8000-000000000102','12110000-0000-4000-8000-000000000102') returning id into episode_id;
  insert into recora_private.p4_membership_episode_events(episode_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(episode_id,org_id,1,'invited',r_invite,'12100000-0000-4000-8000-000000000102','12110000-0000-4000-8000-000000000102');

  select command_receipt_id into r_contract_one from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','contract.current',103,repeat('4',64),'12100000-0000-4000-8000-000000000103','12110000-0000-4000-8000-000000000103','contract.current.one');
  insert into recora_private.p4_contract_projections(organization_id,contract_reference,source_namespace,latest_source_sequence,last_command_receipt_id) values(org_id,'contract.current','fixture.p4',103,r_contract_one) returning id into contract_id;
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id) values(contract_id,org_id,1,'fixture.p4','contract.current',103,repeat('4',64),'draft',r_contract_one,'12100000-0000-4000-8000-000000000103','12110000-0000-4000-8000-000000000103');
  select command_receipt_id into r_contract_two from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','contract.current',104,repeat('5',64),'12100000-0000-4000-8000-000000000104','12110000-0000-4000-8000-000000000104','contract.current.two');
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(contract_id,org_id,2,'fixture.p4','contract.current',104,repeat('5',64),'draft','pending_activation',r_contract_two,'12100000-0000-4000-8000-000000000104','12110000-0000-4000-8000-000000000104');
  update recora_private.p4_contract_projections set state='pending_activation',latest_source_sequence=104,last_command_receipt_id=r_contract_two where id=contract_id;

  select command_receipt_id into r_receipt_one from public.recora_p4_record_command_receipt(org_id,null,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','receipt.current',105,repeat('6',64),'12100000-0000-4000-8000-000000000105','12110000-0000-4000-8000-000000000105','receipt.current.one');
  insert into recora_private.p4_billing_receipts(organization_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id) values(org_id,'provider_fixture','fixture.p4','receipt.current',105,repeat('6',64),r_receipt_one,'12100000-0000-4000-8000-000000000105','12110000-0000-4000-8000-000000000105') returning id into billing_one;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(billing_one,org_id,1,'received',r_receipt_one,'12100000-0000-4000-8000-000000000105','12110000-0000-4000-8000-000000000105');

  select command_receipt_id into r_checkpoint_one from public.recora_p4_record_command_receipt(org_id,null,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','checkpoint.old',106,repeat('7',64),'12100000-0000-4000-8000-000000000106','12110000-0000-4000-8000-000000000106','checkpoint.old');
  insert into recora_private.p4_downstream_checkpoints(organization_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason) values(org_id,r_checkpoint_one,'lifecycle.effect',true,'pending','checkpoint_pending') returning id into checkpoint_old;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(checkpoint_old,org_id,1,'pending',r_checkpoint_one,'12100000-0000-4000-8000-000000000106','12110000-0000-4000-8000-000000000106');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,effect_kind,ordering_key,idempotency_key) values(checkpoint_old,r_checkpoint_one,org_id,'lifecycle.effect',106,'outbox.old') returning id into outbox_old;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(outbox_old,org_id,1,'pending',r_checkpoint_one,'12100000-0000-4000-8000-000000000106','12110000-0000-4000-8000-000000000106');
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null); if gate.customer_access_allowed or gate.reason_code<>'checkpoint_pending' then raise exception 'P4 pending checkpoint gate failed'; end if;
  update recora_private.p4_downstream_checkpoints set state='failed',stable_reason='checkpoint_failed' where id=checkpoint_old;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(checkpoint_old,org_id,2,'pending','failed',r_checkpoint_one,'12100000-0000-4000-8000-000000000106','12110000-0000-4000-8000-000000000106');
  update recora_private.p4_durable_outbox set state='failed',stable_reason='checkpoint_failed',attempt_count=1,next_attempt_at=now()+interval '1 minute' where id=outbox_old;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(outbox_old,org_id,2,'pending','failed',r_checkpoint_one,'12100000-0000-4000-8000-000000000106','12110000-0000-4000-8000-000000000106');

  select command_receipt_id into r_checkpoint_two from public.recora_p4_record_command_receipt(org_id,null,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','checkpoint.new',107,repeat('8',64),'12100000-0000-4000-8000-000000000107','12110000-0000-4000-8000-000000000107','checkpoint.new');
  insert into recora_private.p4_downstream_checkpoints(organization_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason,correction_of_checkpoint_id) values(org_id,r_checkpoint_two,'lifecycle.effect',true,'pending','checkpoint_pending',checkpoint_old) returning id into checkpoint_new;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(checkpoint_new,org_id,1,'pending',r_checkpoint_two,'12100000-0000-4000-8000-000000000107','12110000-0000-4000-8000-000000000107');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,effect_kind,ordering_key,idempotency_key,correction_of_outbox_id) values(checkpoint_new,r_checkpoint_two,org_id,'lifecycle.effect',107,'outbox.new',outbox_old) returning id into outbox_new;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(outbox_new,org_id,1,'pending',r_checkpoint_two,'12100000-0000-4000-8000-000000000107','12110000-0000-4000-8000-000000000107');
  update recora_private.p4_downstream_checkpoints set state='applying' where id=checkpoint_new;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(checkpoint_new,org_id,2,'pending','applying',r_checkpoint_two,'12100000-0000-4000-8000-000000000107','12110000-0000-4000-8000-000000000107');
  update recora_private.p4_downstream_checkpoints set state='completed',stable_reason='ok' where id=checkpoint_new;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(checkpoint_new,org_id,3,'applying','completed',r_checkpoint_two,'12100000-0000-4000-8000-000000000107','12110000-0000-4000-8000-000000000107');
  update recora_private.p4_durable_outbox set state='delivered',stable_reason='ok',resolved_at=now() where id=outbox_new;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(outbox_new,org_id,2,'pending','delivered',r_checkpoint_two,'12100000-0000-4000-8000-000000000107','12110000-0000-4000-8000-000000000107');
  update recora_private.p4_downstream_checkpoints set superseded_by_checkpoint_id=checkpoint_new where id=checkpoint_old;
  update recora_private.p4_durable_outbox set superseded_by_outbox_id=outbox_new where id=outbox_old;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null); if not gate.customer_access_allowed or gate.reason_code<>'ok' then raise exception 'P4 correction did not restore checkpoint gate'; end if;

  select command_receipt_id into r_payment_one from public.recora_p4_record_command_receipt(org_id,null,'billing.payment_fact','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','receipt.current',105,repeat('6',64),'12100000-0000-4000-8000-000000000105','12110000-0000-4000-8000-000000000105','payment.current.one');
  insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,command_receipt_id,request_id,correlation_id) values(billing_one,org_id,'fixture.p4','receipt.current',105,'payment.chain','payment_succeeded',r_payment_one,'12100000-0000-4000-8000-000000000105','12110000-0000-4000-8000-000000000105') returning id into fact_one;
  select command_receipt_id into r_receipt_two from public.recora_p4_record_command_receipt(org_id,null,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','receipt.correction',108,repeat('9',64),'12100000-0000-4000-8000-000000000108','12110000-0000-4000-8000-000000000108','receipt.current.two');
  insert into recora_private.p4_billing_receipts(organization_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id) values(org_id,'provider_fixture','fixture.p4','receipt.correction',108,repeat('9',64),r_receipt_two,'12100000-0000-4000-8000-000000000108','12110000-0000-4000-8000-000000000108') returning id into billing_two;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(billing_two,org_id,1,'received',r_receipt_two,'12100000-0000-4000-8000-000000000108','12110000-0000-4000-8000-000000000108');
  select command_receipt_id into r_payment_two from public.recora_p4_record_command_receipt(org_id,null,'billing.payment_fact','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','receipt.correction',108,repeat('9',64),'12100000-0000-4000-8000-000000000108','12110000-0000-4000-8000-000000000108','payment.current.two');
  insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,corrects_fact_id,command_receipt_id,request_id,correlation_id) values(billing_two,org_id,'fixture.p4','receipt.correction',108,'payment.chain','payment_reversed',fact_one,r_payment_two,'12100000-0000-4000-8000-000000000108','12110000-0000-4000-8000-000000000108');
end;
$full_p4_matrix$;
set constraints all immediate;
rollback;
`);

runSql(`
begin;
do $p4_negative_matrix$
declare org_id uuid := '00000000-0000-4000-8000-000000000001'; receipt_id uuid; contract_id uuid;
begin
  select command_receipt_id into receipt_id from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','contract.negative',201,repeat('a',64),'12100000-0000-4000-8000-000000000201','12110000-0000-4000-8000-000000000201','contract.negative');
  insert into recora_private.p4_contract_projections(organization_id,contract_reference,source_namespace,latest_source_sequence,last_command_receipt_id) values(org_id,'contract.negative','fixture.p4',201,receipt_id) returning id into contract_id;
  begin set constraints all immediate; raise exception 'P4 missing contract event accepted'; exception when raise_exception then if sqlerrm !~ 'P4 contract projection requires matching event' then raise; end if; end;
  set constraints all deferred;
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id) values(contract_id,org_id,1,'fixture.p4','contract.negative',201,repeat('a',64),'draft',receipt_id,'12100000-0000-4000-8000-000000000201','12110000-0000-4000-8000-000000000201');
  begin update recora_private.p4_contract_projections set state='ended' where id=contract_id; raise exception 'P4 forbidden contract transition accepted'; exception when raise_exception then if sqlerrm !~ 'P4 current transition invalid' then raise; end if; end;
end;
$p4_negative_matrix$;
rollback;
`);
runSql(`
do $p4_catalog_final$
declare relation_name text; trigger_name text;
begin
  foreach relation_name in array array['p4_command_receipts','p4_business_lifecycle_episodes','p4_business_lifecycle_current','p4_business_lifecycle_events','p4_invitations','p4_invitation_events','p4_contract_projections','p4_contract_events','p4_billing_receipts','p4_billing_receipt_events','p4_normalized_payment_facts','p4_downstream_checkpoints','p4_durable_outbox','p4_membership_episodes','p4_membership_episode_events','p4_checkpoint_events','p4_outbox_events','p4_command_conflicts'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='recora_private' and c.relname=relation_name and c.relrowsecurity) then raise exception 'P4 catalog RLS absent: %',relation_name; end if;
  end loop;
  foreach trigger_name in array array['p4_business_current_event_alignment','p4_invitation_current_event_alignment','p4_contract_current_event_alignment','p4_receipt_current_event_alignment','p4_checkpoint_current_event_alignment','p4_outbox_current_event_alignment','p4_membership_episode_event_alignment','p4_checkpoint_correction_chain','p4_outbox_correction_chain'] loop
    if not exists(select 1 from pg_trigger where tgname=trigger_name and not tgisinternal) then raise exception 'P4 catalog trigger absent: %',trigger_name; end if;
  end loop;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='recora_private' and p.proname like 'p4!_%' escape '!' and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute') or coalesce(array_to_string(p.proconfig,','),'') not like '%search_path=%')) then raise exception 'P4 private function execution or search path boundary invalid'; end if;
  if not has_schema_privilege('anon','recora_private','usage') or not has_function_privilege('anon','recora_private.can_read_organization(uuid)','execute') or not has_function_privilege('authenticated','recora_private.can_read_project(uuid)','execute') then raise exception 'Phase 3 helper grant changed'; end if;
end;
$p4_catalog_final$;
`);

type Phase4Runtime = {
  isPhase4CommandFixture(value: unknown): boolean;
  normalizePhase4CommandResult(value: unknown): { commandReceiptId: string | null; outcome: string; stableReason: string };
  checkpointGateAllowsAccess(value: unknown): boolean;
};
function loadPhase4Runtime(): Phase4Runtime {
  const sourcePath = path.join(repoRoot, "lib", "recora", "phase4-command-contract.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (specifier: string) => {
      if (specifier === "server-only") return {};
      throw new Error(`unexpected runtime dependency: ${specifier}`);
    },
    Object, Array, Set, Number, RegExp, Symbol
  });
  return module.exports as unknown as Phase4Runtime;
}
const runtime = loadPhase4Runtime();
const validFixture = {
  schemaVersion: 1, commandType: "contract.projection", sourceKind: "provider_fixture", sourceNamespace: "fixture.p4", sourceReference: "contract.runtime", sourceSequence: 1, payloadFingerprint: "a".repeat(64), idempotencyKey: "runtime.command", requestId: "12100000-0000-4000-8000-000000000301", correlationId: "12110000-0000-4000-8000-000000000301"
};
assert.equal(runtime.isPhase4CommandFixture(validFixture), true, "exact P4 fixture was rejected");
assert.equal(runtime.isPhase4CommandFixture({ ...validFixture, unexpected: true }), false, "unknown P4 fixture field was accepted");
const accessorFixture = Object.defineProperty({ ...validFixture }, "sourceReference", { enumerable: true, get: () => "contract.runtime" });
assert.equal(runtime.isPhase4CommandFixture(accessorFixture), false, "accessor P4 fixture was accepted");
assert.equal(runtime.isPhase4CommandFixture(Object.assign(Object.create(null), validFixture)), false, "null-prototype P4 fixture was accepted");
assert.doesNotThrow(() => runtime.isPhase4CommandFixture(new Proxy({}, { ownKeys: () => { throw new Error("proxy"); } })), "Proxy fixture threw instead of denying");
const acceptedRuntimeResult = runtime.normalizePhase4CommandResult({ command_receipt_id: "12100000-0000-4000-8000-000000000302", outcome: "accepted", stable_reason: "ok" });
assert.equal(acceptedRuntimeResult.commandReceiptId, "12100000-0000-4000-8000-000000000302");
assert.equal(acceptedRuntimeResult.outcome, "accepted");
assert.equal(acceptedRuntimeResult.stableReason, "ok");
assert.equal(runtime.normalizePhase4CommandResult({ command_receipt_id: null, outcome: "accepted", stable_reason: "ok" }).stableReason, "command_unavailable", "accepted result without receipt was accepted");
assert.equal(runtime.normalizePhase4CommandResult({ commandReceiptId: "12100000-0000-4000-0000-000000000302", outcome: "accepted", stableReason: "ok" }).stableReason, "command_unavailable", "camel RPC shape was accepted");
assert.equal(runtime.checkpointGateAllowsAccess({ customer_access_allowed: true, reason_code: "ok" }), true, "exact checkpoint gate allow was denied");
assert.equal(runtime.checkpointGateAllowsAccess({ customer_access_allowed: true, reasonCode: "ok" }), false, "mixed checkpoint gate shape was accepted");
assert.equal(runtime.checkpointGateAllowsAccess({ customer_access_allowed: true, reason_code: "ok", extra: true }), false, "checkpoint gate extra field was accepted");
assert.doesNotThrow(() => runtime.checkpointGateAllowsAccess(new Proxy({}, { getPrototypeOf: () => { throw new Error("proxy"); } })), "Proxy gate result threw instead of denying");
console.log(JSON.stringify({ status: "ok", matrix: "full-p4a-real-data", typescriptBoundary: "fail-closed" }, null, 2));
runSql(`
begin;
do $membership_negative$
declare org_id uuid := '00000000-0000-4000-8000-000000000001'; receipt_id uuid; invitation_id uuid;
begin
  select command_receipt_id into receipt_id from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','invite.membership.negative',301,repeat('b',64),'12100000-0000-4000-8000-000000000311','12110000-0000-4000-8000-000000000311','invite.membership.negative');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('c',64),receipt_id,receipt_id,'12100000-0000-4000-8000-000000000311','12110000-0000-4000-8000-000000000311',now()+interval '1 day') returning id into invitation_id;
  create temporary table p4_membership_episode_probe(organization_id uuid,invitation_id uuid,membership_id uuid,accepted_user_id uuid,intended_role public.recora_organization_member_role,episode_number bigint,state recora_private.p4_membership_episode_state,command_receipt_id uuid,request_id uuid,correlation_id uuid) on commit drop;
  create trigger p4_membership_episode_probe_integrity before insert or update on p4_membership_episode_probe for each row execute function recora_private.p4_validate_membership_episode();
  begin
    insert into p4_membership_episode_probe values(org_id,invitation_id,gen_random_uuid(),gen_random_uuid(),'member',301,'active',receipt_id,'12100000-0000-4000-8000-000000000311','12110000-0000-4000-8000-000000000311');
    raise exception 'P4 pending invitation active episode accepted';
  exception when raise_exception then if sqlerrm !~ 'P4 membership episode must start invited|P4 membership episode acceptance mismatch' then raise; end if; end;
end;
$membership_negative$;
rollback;
`);
runSql(`
begin;
do $owner_5146069373_matrix$
declare
  org_id uuid := '00000000-0000-4000-8000-000000000001';
  wrong_id uuid; business_start uuid; business_close uuid; business_renew uuid; invitation_command uuid; contract_command uuid; billing_command uuid; payment_command uuid; checkpoint_command uuid;
  episode_one uuid; episode_two uuid; business_current uuid; invitation_id uuid; contract_id uuid; billing_id uuid; checkpoint_id uuid; outbox_id uuid;
begin
  select command_receipt_id into wrong_id from public.recora_p4_record_command_receipt(org_id,null,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','wrong.command',501,repeat('a',64),'12100000-0000-4000-8000-000000000501','12110000-0000-4000-8000-000000000501','wrong.command');
  begin insert into recora_private.p4_business_lifecycle_episodes(organization_id,episode_number,start_command_receipt_id,request_id,correlation_id) values(org_id,501,wrong_id,'12100000-0000-4000-8000-000000000501','12110000-0000-4000-8000-000000000501'); raise exception 'wrong command type accepted'; exception when raise_exception then if sqlerrm !~ 'P4 domain command type or scope mismatch|P4 business episode command binding mismatch' then raise; end if; end;
  select command_receipt_id into contract_command from public.recora_p4_record_command_receipt(org_id,null,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','contract.actual',502,repeat('b',64),'12100000-0000-4000-8000-000000000502','12110000-0000-4000-8000-000000000502','wrong.contract.source');
  begin insert into recora_private.p4_contract_projections(organization_id,contract_reference,source_namespace,latest_source_sequence,last_command_receipt_id) values(org_id,'contract.other','fixture.p4',502,contract_command); raise exception 'wrong contract source accepted'; exception when raise_exception then if sqlerrm !~ 'P4 contract command source semantic identity mismatch' then raise; end if; end;
  select command_receipt_id into billing_command from public.recora_p4_record_command_receipt(org_id,null,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','billing.actual',503,repeat('c',64),'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503','wrong.billing.fingerprint');
  begin insert into recora_private.p4_billing_receipts(organization_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id) values(org_id,'provider_fixture','fixture.p4','billing.actual',503,repeat('d',64),billing_command,'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503'); raise exception 'wrong billing fingerprint accepted'; exception when raise_exception then if sqlerrm !~ 'P4 billing receipt command source semantic identity mismatch' then raise; end if; end;

  select command_receipt_id into business_start from public.recora_p4_record_command_receipt(org_id,null,'business.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','business.episode.one',510,repeat('1',64),'12100000-0000-4000-8000-000000000510','12110000-0000-4000-8000-000000000510','business.episode.one');
  insert into recora_private.p4_business_lifecycle_episodes(organization_id,episode_number,start_command_receipt_id,request_id,correlation_id) values(org_id,510,business_start,'12100000-0000-4000-8000-000000000510','12110000-0000-4000-8000-000000000510') returning id into episode_one;
  insert into recora_private.p4_business_lifecycle_current(organization_id,episode_id,state,last_command_receipt_id) values(org_id,episode_one,'lead',business_start) returning id into business_current;
  insert into recora_private.p4_business_lifecycle_events(episode_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(episode_one,org_id,1,'lead',business_start,'12100000-0000-4000-8000-000000000510','12110000-0000-4000-8000-000000000510');
  select command_receipt_id into business_close from public.recora_p4_record_command_receipt(org_id,null,'business.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','business.episode.close',511,repeat('2',64),'12100000-0000-4000-8000-000000000511','12110000-0000-4000-8000-000000000511','business.episode.close');
  update recora_private.p4_business_lifecycle_current set state='rejected',last_command_receipt_id=business_close where id=business_current;
  insert into recora_private.p4_business_lifecycle_events(episode_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id) values(episode_one,org_id,2,'lead','rejected',business_close,'12100000-0000-4000-8000-000000000511','12110000-0000-4000-8000-000000000511');
  begin update recora_private.p4_business_lifecycle_current set state='lead' where id=business_current; raise exception 'terminal episode revival accepted'; exception when raise_exception then if sqlerrm !~ 'P4 current transition invalid' then raise; end if; end;
  select command_receipt_id into business_renew from public.recora_p4_record_command_receipt(org_id,null,'business.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','business.episode.two',512,repeat('3',64),'12100000-0000-4000-8000-000000000512','12110000-0000-4000-8000-000000000512','business.episode.two');
  insert into recora_private.p4_business_lifecycle_episodes(organization_id,episode_number,start_command_receipt_id,request_id,correlation_id) values(org_id,511,business_renew,'12100000-0000-4000-8000-000000000512','12110000-0000-4000-8000-000000000512') returning id into episode_two;
  insert into recora_private.p4_business_lifecycle_events(episode_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(episode_two,org_id,1,'lead',business_renew,'12100000-0000-4000-8000-000000000512','12110000-0000-4000-8000-000000000512');
  update recora_private.p4_business_lifecycle_current set episode_id=episode_two,state='lead',last_command_receipt_id=business_renew where id=business_current;
  if not exists(select 1 from recora_private.p4_business_lifecycle_events where episode_id=episode_one and event_sequence=2 and next_state='rejected') or not exists(select 1 from recora_private.p4_business_lifecycle_current where id=business_current and episode_id=episode_two and state='lead') then raise exception 'business renewal did not retain history and switch pointer'; end if;
  begin delete from recora_private.p4_business_lifecycle_current where id=business_current; raise exception 'business current delete accepted'; exception when raise_exception then if sqlerrm !~ 'P4 authoritative row may not be deleted' then raise; end if; end;
  begin delete from recora_private.p4_business_lifecycle_episodes where id=episode_one; raise exception 'old business episode delete accepted'; exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;

  select command_receipt_id into invitation_command from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','delete.invitation',520,repeat('4',64),'12100000-0000-4000-8000-000000000520','12110000-0000-4000-8000-000000000520','delete.invitation');
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('5',64),invitation_command,invitation_command,'12100000-0000-4000-8000-000000000520','12110000-0000-4000-8000-000000000520',now()+interval '1 day') returning id into invitation_id;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(invitation_id,org_id,1,'pending',invitation_command,'12100000-0000-4000-8000-000000000520','12110000-0000-4000-8000-000000000520');
  begin delete from recora_private.p4_invitations where id=invitation_id; raise exception 'invitation delete accepted'; exception when raise_exception then if sqlerrm !~ 'P4 authoritative row may not be deleted' then raise; end if; end;

  insert into recora_private.p4_contract_projections(organization_id,contract_reference,source_namespace,latest_source_sequence,last_command_receipt_id) values(org_id,'contract.actual','fixture.p4',502,contract_command) returning id into contract_id;
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id) values(contract_id,org_id,1,'fixture.p4','contract.actual',502,repeat('b',64),'draft',contract_command,'12100000-0000-4000-8000-000000000502','12110000-0000-4000-8000-000000000502');
  begin delete from recora_private.p4_contract_projections where id=contract_id; raise exception 'contract projection delete accepted'; exception when raise_exception then if sqlerrm !~ 'P4 authoritative row may not be deleted' then raise; end if; end;

  insert into recora_private.p4_billing_receipts(organization_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id) values(org_id,'provider_fixture','fixture.p4','billing.actual',503,repeat('c',64),billing_command,'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503') returning id into billing_id;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(billing_id,org_id,1,'received',billing_command,'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503');
  select command_receipt_id into payment_command from public.recora_p4_record_command_receipt(org_id,null,'billing.payment_fact','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','billing.actual',503,repeat('c',64),'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503','payment.unique');
  insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,command_receipt_id,request_id,correlation_id) values(billing_id,org_id,'fixture.p4','billing.actual',503,'payment.unique','payment_succeeded',payment_command,'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503');
  begin insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,command_receipt_id,request_id,correlation_id) values(billing_id,org_id,'fixture.p4','billing.actual',503,'payment.unique','payment_failed',payment_command,'12100000-0000-4000-8000-000000000503','12110000-0000-4000-8000-000000000503'); raise exception 'contradictory payment facts accepted'; exception when unique_violation then if sqlerrm !~ 'p4_one_normalized_payment_fact_per_receipt' then raise; end if; when raise_exception then raise; end;
  begin delete from recora_private.p4_billing_receipts where id=billing_id; raise exception 'billing receipt delete accepted'; exception when raise_exception then if sqlerrm !~ 'P4 authoritative row may not be deleted' then raise; end if; end;

  select command_receipt_id into checkpoint_command from public.recora_p4_record_command_receipt(org_id,null,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','delete.checkpoint',530,repeat('6',64),'12100000-0000-4000-8000-000000000530','12110000-0000-4000-8000-000000000530','delete.checkpoint');
  insert into recora_private.p4_downstream_checkpoints(organization_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason) values(org_id,checkpoint_command,'lifecycle.delete',true,'pending','checkpoint_pending') returning id into checkpoint_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(checkpoint_id,org_id,1,'pending',checkpoint_command,'12100000-0000-4000-8000-000000000530','12110000-0000-4000-8000-000000000530');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,effect_kind,ordering_key,idempotency_key) values(checkpoint_id,checkpoint_command,org_id,'lifecycle.delete',530,'outbox.delete') returning id into outbox_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id) values(outbox_id,org_id,1,'pending',checkpoint_command,'12100000-0000-4000-8000-000000000530','12110000-0000-4000-8000-000000000530');
  begin delete from recora_private.p4_downstream_checkpoints where id=checkpoint_id; raise exception 'checkpoint delete accepted'; exception when raise_exception then if sqlerrm !~ 'P4 authoritative row may not be deleted' then raise; end if; end;
  begin delete from recora_private.p4_durable_outbox where id=outbox_id; raise exception 'outbox delete accepted'; exception when raise_exception then if sqlerrm !~ 'P4 authoritative row may not be deleted' then raise; end if; end;
end;
$owner_5146069373_matrix$;
set constraints all immediate;
rollback;
`);
console.log(JSON.stringify({ status: 'ok', owner5146069373: 'command-source-payment-delete-renewal-validated' }, null, 2));
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

async function verifyConcurrentIdempotency() {
  const command = (requestId: string, correlationId: string) => `
select command_receipt_id::text || '|' || outcome::text || '|' || stable_reason::text
from public.recora_p4_record_command_receipt(
  '00000000-0000-4000-8000-000000000001'::uuid,null,'contract.projection',
  'provider_fixture'::recora_private.p4_source_kind,'fixture.p4','concurrent.command',700,repeat('7',64),
  '${requestId}'::uuid,'${correlationId}'::uuid,'concurrent.idempotency');`;
  const outputs = await Promise.all([
    runConcurrentSql(command('12100000-0000-4000-8000-000000000701', '12110000-0000-4000-8000-000000000701')),
    runConcurrentSql(command('12100000-0000-4000-8000-000000000702', '12110000-0000-4000-8000-000000000702'))
  ]);
  const rows = outputs.map((output) => output.trim().split(/\r?\n/).filter(Boolean).at(-1)!.split("|"));
  assert.equal(new Set(rows.map(([id]) => id)).size, 1, "concurrent semantic retries created more than one receipt");
  assert.deepEqual(new Set(rows.map(([, outcome]) => outcome)), new Set(["accepted", "replayed"]), "concurrent semantic retries were not accepted/replayed exactly once");
  assert.ok(rows.every(([, , reason]) => reason === "ok" || reason === "duplicate_command"), "concurrent retry reason was unstable");
  console.log(JSON.stringify({ status: "ok", concurrentIdempotency: "accepted-and-replayed-on-one-receipt" }, null, 2));
}

runSql(`
begin;
do $owner_5146470423_project_scope_matrix$
declare
  org_id uuid := '00000000-0000-4000-8000-000000000001';
  project_a uuid := '10000000-0000-4000-8000-000000000001';
  project_b uuid := '12120000-0000-4000-8000-000000000801';
  contract_ok uuid;
  contract_cross uuid;
  billing_ok uuid;
  billing_payment uuid;
  billing_cross uuid;
  checkpoint_ok uuid;
  checkpoint_cross uuid;
  invitation_issuer uuid;
  invitation_other uuid;
  invitation_id uuid;
  contract_id uuid;
  billing_id uuid;
  checkpoint_id uuid;
  outbox_id uuid;
begin
  insert into public.projects(id,organization_id,slug,name)
  values(project_b,org_id,'issue-121-project-scope-b','Issue 121 Project Scope B');

  select command_receipt_id into contract_ok
  from public.recora_p4_record_command_receipt(org_id,project_a,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.contract',801,repeat('1',64),'12100000-0000-4000-8000-000000000801','12110000-0000-4000-8000-000000000801','project.contract.ok');
  insert into recora_private.p4_contract_projections(organization_id,project_id,contract_reference,source_namespace,latest_source_sequence,last_command_receipt_id)
  values(org_id,project_a,'project.contract','fixture.p4',801,contract_ok) returning id into contract_id;
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id)
  values(contract_id,org_id,1,'fixture.p4','project.contract',801,repeat('1',64),'draft',contract_ok,'12100000-0000-4000-8000-000000000801','12110000-0000-4000-8000-000000000801');

  select command_receipt_id into contract_cross
  from public.recora_p4_record_command_receipt(org_id,project_b,'contract.projection','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.contract',802,repeat('2',64),'12100000-0000-4000-8000-000000000802','12110000-0000-4000-8000-000000000802','project.contract.cross');
  begin
    insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(contract_id,org_id,2,'fixture.p4','project.contract',802,repeat('2',64),'draft','pending_activation',contract_cross,'12100000-0000-4000-8000-000000000802','12110000-0000-4000-8000-000000000802');
    raise exception 'cross-project contract event accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 domain command type or scope mismatch' then raise; end if;
  end;
  begin
    insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id)
    values(gen_random_uuid(),org_id,1,'fixture.p4','project.contract',803,repeat('3',64),'draft',contract_ok,'12100000-0000-4000-8000-000000000801','12110000-0000-4000-8000-000000000801');
    raise exception 'missing contract parent accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 child event parent scope mismatch' then raise; end if;
  end;

  select command_receipt_id into billing_ok
  from public.recora_p4_record_command_receipt(org_id,project_a,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.billing',810,repeat('4',64),'12100000-0000-4000-8000-000000000810','12110000-0000-4000-8000-000000000810','project.billing.ok');
  insert into recora_private.p4_billing_receipts(organization_id,project_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id)
  values(org_id,project_a,'provider_fixture','fixture.p4','project.billing',810,repeat('4',64),billing_ok,'12100000-0000-4000-8000-000000000810','12110000-0000-4000-8000-000000000810') returning id into billing_id;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,1,'received',billing_ok,'12100000-0000-4000-8000-000000000810','12110000-0000-4000-8000-000000000810');
  select command_receipt_id into billing_payment
  from public.recora_p4_record_command_receipt(org_id,project_a,'billing.payment_fact','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.billing',810,repeat('4',64),'12100000-0000-4000-8000-000000000810','12110000-0000-4000-8000-000000000810','project.billing.payment');
  insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,project_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,project_a,'fixture.p4','project.billing',810,'project.billing.chain','payment_succeeded',billing_payment,'12100000-0000-4000-8000-000000000810','12110000-0000-4000-8000-000000000810');

  select command_receipt_id into billing_cross
  from public.recora_p4_record_command_receipt(org_id,project_b,'billing.receipt','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.billing',810,repeat('4',64),'12100000-0000-4000-8000-000000000811','12110000-0000-4000-8000-000000000811','project.billing.cross');
  begin
    insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(billing_id,org_id,2,'received','validated',billing_cross,'12100000-0000-4000-8000-000000000811','12110000-0000-4000-8000-000000000811');
    raise exception 'cross-project billing event accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 domain command type or scope mismatch' then raise; end if;
  end;
  begin
    insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
    values(gen_random_uuid(),org_id,1,'received',billing_ok,'12100000-0000-4000-8000-000000000810','12110000-0000-4000-8000-000000000810');
    raise exception 'missing billing parent accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 child event parent scope mismatch' then raise; end if;
  end;

  select command_receipt_id into checkpoint_ok
  from public.recora_p4_record_command_receipt(org_id,project_a,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.checkpoint',820,repeat('5',64),'12100000-0000-4000-8000-000000000820','12110000-0000-4000-8000-000000000820','project.checkpoint.ok');
  insert into recora_private.p4_downstream_checkpoints(organization_id,project_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason)
  values(org_id,project_a,checkpoint_ok,'project.checkpoint',true,'pending','checkpoint_pending') returning id into checkpoint_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(checkpoint_id,org_id,1,'pending',checkpoint_ok,'12100000-0000-4000-8000-000000000820','12110000-0000-4000-8000-000000000820');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,project_id,effect_kind,ordering_key,idempotency_key)
  values(checkpoint_id,checkpoint_ok,org_id,project_a,'project.checkpoint',820,'project.outbox') returning id into outbox_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(outbox_id,org_id,1,'pending',checkpoint_ok,'12100000-0000-4000-8000-000000000820','12110000-0000-4000-8000-000000000820');

  select command_receipt_id into checkpoint_cross
  from public.recora_p4_record_command_receipt(org_id,project_b,'lifecycle.checkpoint','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.checkpoint.cross',821,repeat('6',64),'12100000-0000-4000-8000-000000000821','12110000-0000-4000-8000-000000000821','project.checkpoint.cross');
  begin
    insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(checkpoint_id,org_id,2,'pending','applying',checkpoint_cross,'12100000-0000-4000-8000-000000000821','12110000-0000-4000-8000-000000000821');
    raise exception 'cross-project checkpoint event accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 domain command type or scope mismatch' then raise; end if;
  end;
  begin
    insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(outbox_id,org_id,2,'pending','delivered',checkpoint_cross,'12100000-0000-4000-8000-000000000821','12110000-0000-4000-8000-000000000821');
    raise exception 'cross-project outbox event accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 domain command type or scope mismatch' then raise; end if;
  end;
  begin
    insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
    values(gen_random_uuid(),org_id,1,'pending',checkpoint_ok,'12100000-0000-4000-8000-000000000820','12110000-0000-4000-8000-000000000820');
    raise exception 'missing checkpoint parent accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 child event parent scope mismatch' then raise; end if;
  end;
  begin
    insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
    values(gen_random_uuid(),org_id,1,'pending',checkpoint_ok,'12100000-0000-4000-8000-000000000820','12110000-0000-4000-8000-000000000820');
    raise exception 'missing outbox parent accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 child event parent scope mismatch' then raise; end if;
  end;

  select command_receipt_id into invitation_issuer
  from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.invitation',830,repeat('7',64),'12100000-0000-4000-8000-000000000830','12110000-0000-4000-8000-000000000830','project.invitation.issuer');
  select command_receipt_id into invitation_other
  from public.recora_p4_record_command_receipt(org_id,null,'invitation.lifecycle','provider_fixture'::recora_private.p4_source_kind,'fixture.p4','project.invitation.other',831,repeat('8',64),'12100000-0000-4000-8000-000000000831','12110000-0000-4000-8000-000000000831','project.invitation.other');
  begin
    insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at)
    values(org_id,repeat('9',64),invitation_issuer,invitation_other,'12100000-0000-4000-8000-000000000831','12110000-0000-4000-8000-000000000831',now()+interval '1 day');
    raise exception 'pending invitation issuer mismatch accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 pending invitation issuer must equal initial receipt' then raise; end if;
  end;
  insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at)
  values(org_id,repeat('a',64),invitation_issuer,invitation_issuer,'12100000-0000-4000-8000-000000000830','12110000-0000-4000-8000-000000000830',now()+interval '1 day') returning id into invitation_id;
  begin
    insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
    values(invitation_id,org_id,1,'pending',invitation_other,'12100000-0000-4000-8000-000000000831','12110000-0000-4000-8000-000000000831');
    raise exception 'initial invitation event receipt mismatch accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 invitation initial event receipt mismatch' then raise; end if;
  end;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(invitation_id,org_id,1,'pending',invitation_issuer,'12100000-0000-4000-8000-000000000830','12110000-0000-4000-8000-000000000830');
end;
$owner_5146470423_project_scope_matrix$;
set constraints all immediate;
rollback;
`);
console.log(JSON.stringify({ status: 'ok', owner5146470423: 'parent-project-scope-and-invitation-initial-receipt-validated' }, null, 2));

verifyConcurrentIdempotency().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});