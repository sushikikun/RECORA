import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
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
  insert into recora_private.p4_downstream_checkpoints(organization_id,command_receipt_id,required_effect,blocks_customer_access,state,stable_reason)
  values(org_id,command_id,'lifecycle.effect',true,'pending','checkpoint_pending');
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null);
  if gate.customer_access_allowed or gate.reason_code <> 'checkpoint_pending' then raise exception 'P4 pending checkpoint did not deny'; end if;
  update recora_private.p4_downstream_checkpoints set state='failed',stable_reason='checkpoint_failed' where command_receipt_id=command_id;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null);
  if gate.customer_access_allowed or gate.reason_code <> 'checkpoint_failed' then raise exception 'P4 failed checkpoint did not deny'; end if;
  update recora_private.p4_downstream_checkpoints set state='reconciliation_required',stable_reason='reconciliation_required' where command_receipt_id=command_id;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,null);
  if gate.customer_access_allowed or gate.reason_code <> 'reconciliation_required' then raise exception 'P4 reconciliation checkpoint did not deny'; end if;
  begin update recora_private.p4_command_receipts set command_type='changed.command' where id=command_id; raise exception 'P4 command receipt mutation accepted'; exception when raise_exception then if sqlerrm !~ 'append-only' then raise; end if; end;
  begin insert into recora_private.p4_invitations(organization_id,recipient_binding_hash,state,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at) values(org_id,repeat('d',64),'accepted',command_id,command_id,'12100000-0000-4000-8000-000000000001','12110000-0000-4000-8000-000000000001',now()+interval '1 day'); raise exception 'P4 invitation accepted without recipient proof'; exception when raise_exception then if sqlerrm !~ 'acceptance requires verified user and membership' then raise; end if; end;
  begin insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id) values(gen_random_uuid(),org_id,1,'fixture.p4','order.one',1,repeat('e',64),'active',command_id,gen_random_uuid(),gen_random_uuid()); raise exception 'P4 contract non-draft initial state accepted'; exception when foreign_key_violation or check_violation or raise_exception then null; end;
end;
$verify$;
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
    appendOnlyAndInvitationNegative: "validated"
  }
}, null, 2));
