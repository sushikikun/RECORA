import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";


type CommandResult = {
  stdout: string;
  stderr: string;
  status: number | null;
};

const repoRoot = process.cwd();
const expectedContainer = "supabase_db_recoraissue123";
const dbContainer = process.env.RECORA_ISSUE_123_DB_CONTAINER;
const supabaseWorkdir = process.env.RECORA_ISSUE_123_SUPABASE_WORKDIR;
const supabaseCli = path.join(repoRoot, "node_modules", "supabase", "dist", "supabase.js");
const p4aMigrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260730200448_p4a_phase4_common_contract_state_events.sql"
);
const p4cModulePath = path.join(repoRoot, "lib", "recora", "phase4-contract-billing-entitlement.ts");

assert.equal(
  dbContainer,
  expectedContainer,
  "Issue #123 requires RECORA_ISSUE_123_DB_CONTAINER=supabase_db_recoraissue123; another task container is not permitted."
);
assert.ok(supabaseWorkdir, "Issue #123 requires RECORA_ISSUE_123_SUPABASE_WORKDIR for its isolated local stack.");
assert.ok(path.isAbsolute(supabaseWorkdir), "Issue #123 Supabase workdir must be absolute.");
assert.match(supabaseWorkdir, /(?:^|[\\/])tmp(?:[\\/]|$)/i, "Issue #123 Supabase workdir must be under a temporary path.");
assert.ok(fs.existsSync(path.join(supabaseWorkdir, "supabase", "config.toml")), "Issue #123 isolated Supabase config is missing.");
assert.ok(fs.existsSync(supabaseCli), "Local Supabase CLI dependency is missing.");

const shimNodeModules = path.join(supabaseWorkdir, "node_modules");
const serverOnlyShim = path.join(shimNodeModules, "server-only");
fs.mkdirSync(serverOnlyShim, { recursive: true });
fs.writeFileSync(path.join(serverOnlyShim, "index.js"), "module.exports = {};\n", "utf8");
process.env.NODE_PATH = [shimNodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
const requireFromVerifier = createRequire(path.join(repoRoot, "scripts", "verify-issue-123-p4c-contract-billing-entitlement.ts"));
const nodeModule = requireFromVerifier("node:module") as { Module?: { _initPaths?: () => void } };
nodeModule.Module?._initPaths?.();

const {
  assertCustomerSafeContractResult,
  createCustomerSafeContractResult,
  isProviderNeutralBillingEnvelope,
  phase4ContractBillingIntegrationSchemaVersion,
  planPhase4ContractBillingEffects
} = requireFromVerifier("../lib/recora/phase4-contract-billing-entitlement") as typeof import("../lib/recora/phase4-contract-billing-entitlement");

const p4aMigration = fs.readFileSync(p4aMigrationPath, "utf8");
const p4cModule = fs.readFileSync(p4cModulePath, "utf8");

assert.match(p4cModule, /import "server-only"/);
assert.match(p4cModule, /isProviderNeutralBillingEnvelope/);
assert.match(p4cModule, /createCustomerSafeContractResult/);
assert.match(p4cModule, /forbiddenCustomerSafeKeys/);
assert.match(p4aMigration, /p4_contract_projections/);
assert.match(p4aMigration, /p4_billing_receipts/);
assert.match(p4aMigration, /p4_normalized_payment_facts/);
assert.match(p4aMigration, /p4_downstream_checkpoints/);
assert.match(p4aMigration, /p4_durable_outbox/);
assert.match(p4aMigration, /public\.recora_p4_record_command_receipt/);

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
}

function run(
  executable: string,
  args: string[],
  options: { input?: string; timeout?: number; env?: NodeJS.ProcessEnv | Record<string, string> } = {}
): CommandResult {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...options.env },
    input: options.input,
    maxBuffer: 40 * 1024 * 1024,
    timeout: options.timeout ?? 180_000
  });
  if (result.error) throw result.error;
  return { stdout: `${result.stdout ?? ""}`, stderr: `${result.stderr ?? ""}`, status: result.status };
}

function requireSuccess(name: string, result: CommandResult): string {
  const output = sanitize(`${result.stdout}\n${result.stderr}`);
  assert.equal(result.status, 0, `${name} failed with exit status ${result.status}:\n${output}`);
  return output;
}

function runSupabase(name: string, args: string[]): string {
  return requireSuccess(name, run(process.execPath, [supabaseCli, "--workdir", supabaseWorkdir!, ...args], { timeout: 360_000 }));
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = run(
    "docker",
    [
      "exec",
      "--interactive",
      dbContainer!,
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--quiet"
    ],
    { input: sql, timeout: 180_000 }
  );
  const output = sanitize(`${result.stdout}\n${result.stderr}`);
  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected ${expectedError}, but SQL succeeded.`);
    assert.match(output, expectedError);
    return output;
  }
  assert.equal(result.status, 0, `Local SQL failed:\n${output}`);
  return output;
}

function verifyEnvelopeContract() {
  const validEnvelope = {
    schemaVersion: phase4ContractBillingIntegrationSchemaVersion,
    organizationId: "12310000-0000-4000-8000-000000000001",
    projectId: "12320000-0000-4000-8000-000000000001",
    sourceKind: "provider_fixture",
    sourceNamespace: "fixture.p4c",
    sourceReference: "receipt.activate",
    sourceSequence: 123,
    payloadFingerprint: "a".repeat(64),
    idempotencyKey: "p4c.activate",
    requestId: "12340000-0000-4000-8000-000000000001",
    correlationId: "12350000-0000-4000-8000-000000000001",
    receipt: { eventSequence: 1, previousState: null, nextState: "received" },
    paymentFact: { factKind: "payment_succeeded", paymentChainKey: "payment.chain.activate", correctsFactId: null },
    contract: { contractReference: "contract.p4c", eventSequence: 3, previousState: "pending_activation", nextState: "active" },
    entitlement: {
      planPolicyVersionId: "12330000-0000-4000-8000-000000000002",
      entitlementSchemaVersion: 1,
      resolvedDocument: { capabilities: { measurement: true }, limits: { prompts: 12 } },
      effectiveFrom: "2026-08-01T00:00:00.000Z",
      effectiveUntil: null,
      resolverVersion: "p4c.fixture",
      idempotencyKey: "p4c.entitlement.activate"
    },
    lifecycleCheckpoint: {
      requiredEffect: "lifecycle.suspend",
      blocksCustomerAccess: true,
      phase3LifecycleId: "12360000-0000-4000-8000-000000000001",
      expectedLifecycleVersion: 1
    }
  };

  assert.equal(isProviderNeutralBillingEnvelope(validEnvelope), true);
  assert.equal(isProviderNeutralBillingEnvelope({ ...validEnvelope, rawPayload: {} }), false);
  assert.equal(isProviderNeutralBillingEnvelope({ ...validEnvelope, sourceNamespace: "fixture.secret" }), false);
  assert.equal(isProviderNeutralBillingEnvelope({ ...validEnvelope, payloadFingerprint: "z".repeat(64) }), false);
  assert.equal(
    isProviderNeutralBillingEnvelope({ ...validEnvelope, paymentFact: { ...validEnvelope.paymentFact, correctsFactId: validEnvelope.requestId, factKind: "payment_succeeded" } }),
    false
  );
  const symbolEnvelope = { ...validEnvelope };
  Object.defineProperty(symbolEnvelope, Symbol("internal"), { value: true, enumerable: true });
  assert.equal(isProviderNeutralBillingEnvelope(symbolEnvelope), false);
  const accessorEnvelope = { ...validEnvelope };
  Object.defineProperty(accessorEnvelope, "sourceReference", { get: () => "receipt.activate", enumerable: true });
  assert.equal(isProviderNeutralBillingEnvelope(accessorEnvelope), false);
  const proxyEnvelope = new Proxy(validEnvelope, {
    ownKeys() {
      throw new Error("proxy trap");
    }
  });
  assert.equal(isProviderNeutralBillingEnvelope(proxyEnvelope), false);

  const plan = planPhase4ContractBillingEffects(validEnvelope, {
    latestSourceSequence: 122,
    currentContractState: "pending_activation",
    existingReceipt: null
  });
  assert.equal(plan.ok, true);
  if (!plan.ok) throw new Error("valid P4-C plan was rejected");
  assert.equal(plan.commandFixtures.receipt.commandType, "billing.receipt");
  assert.equal(plan.commandFixtures.paymentFact.commandType, "billing.payment_fact");
  assert.equal(plan.commandFixtures.contractProjection.sourceReference, "contract.p4c");
  assert.equal(plan.commandFixtures.lifecycleCheckpoint?.commandType, "lifecycle.checkpoint");
  assert.equal(
    planPhase4ContractBillingEffects(validEnvelope, {
      latestSourceSequence: 123,
      currentContractState: "pending_activation",
      existingReceipt: null
    }).ok,
    false
  );
  const duplicatePlan = planPhase4ContractBillingEffects(validEnvelope, {
    latestSourceSequence: 123,
    currentContractState: "active",
    existingReceipt: {
      sourceNamespace: "fixture.p4c",
      sourceReference: "receipt.activate",
      sourceSequence: 123,
      payloadFingerprint: "a".repeat(64)
    }
  });
  assert.equal(duplicatePlan.ok, true);
  if (!duplicatePlan.ok) throw new Error("duplicate P4-C fixture did not replay safely");
  assert.equal(duplicatePlan.receiptState, "ignored_duplicate");

  const safe = createCustomerSafeContractResult({
    entitlement: validEnvelope.entitlement,
    checkpointGate: { customer_access_allowed: true, reason_code: "ok" }
  });
  assertCustomerSafeContractResult(safe);
  assert.equal(safe.customerAccessAllowed, true);
  assert.deepEqual(Object.keys(safe).sort(), [
    "capabilities",
    "customerAccessAllowed",
    "effectiveFrom",
    "effectiveUntil",
    "limits",
    "reasonCode",
    "schemaVersion"
  ]);
  assert.equal(JSON.stringify(safe).match(/provider|billing|receipt|payment|audit|payload|pointer|snapshot_id|policy/i), null);
}

verifyEnvelopeContract();

runSupabase("Issue #123 migration-only reset", ["db", "reset", "--local", "--no-seed"]);
runSupabase("Issue #123 seeded reset", ["db", "reset", "--local"]);

queryLocal(`
do $catalog$
begin
  if current_database() <> 'postgres' then raise exception 'Issue 123 requires isolated local postgres'; end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='recora_private' and c.relname='p4_contract_projections' and c.relrowsecurity) then raise exception 'P4-A contract projection RLS missing'; end if;
  if has_table_privilege('anon','recora_private.p4_billing_receipts','select') or has_table_privilege('authenticated','recora_private.p4_normalized_payment_facts','select') then raise exception 'P4-C private billing data exposed'; end if;
  if not has_function_privilege('service_role','public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)','execute')
    or has_function_privilege('anon','public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)','execute') then raise exception 'P4-A command receipt grant boundary invalid'; end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='recora_private' and c.relname='current_entitlement_snapshots') then raise exception 'Phase 3 entitlement pointer missing'; end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='recora_private' and c.relname='data_lifecycle_current') then raise exception 'Phase 3 lifecycle current missing'; end if;
end;
$catalog$;
`);

queryLocal(`
begin;
do $p4c$
declare
  org_id uuid := '12310000-0000-4000-8000-000000000001';
  other_org_id uuid := '12310000-0000-4000-8000-000000000002';
  project_id uuid := '12320000-0000-4000-8000-000000000001';
  other_project_id uuid := '12320000-0000-4000-8000-000000000002';
  policy_v1 uuid := '12330000-0000-4000-8000-000000000001';
  policy_v2 uuid := '12330000-0000-4000-8000-000000000002';
  old_snapshot uuid := '12331000-0000-4000-8000-000000000001';
  new_snapshot uuid := '12331000-0000-4000-8000-000000000002';
  old_hash text;
  old_hash_after text;
  lifecycle_id uuid;
  contract_id uuid;
  billing_id uuid;
  fact_id uuid;
  corrected_fact_id uuid;
  r_contract_draft uuid;
  r_contract_pending uuid;
  r_contract_active uuid;
  r_receipt uuid;
  r_payment uuid;
  r_correction_receipt uuid;
  r_correction_payment uuid;
  r_checkpoint uuid;
  r_checkpoint_exhausted uuid;
  r_checkpoint_recovery uuid;
  r_cross uuid;
  replay_id uuid;
  command_outcome text;
  command_reason text;
  checkpoint_id uuid;
  outbox_id uuid;
  exhausted_checkpoint_id uuid;
  exhausted_outbox_id uuid;
  recovery_checkpoint_id uuid;
  recovery_outbox_id uuid;
  gate record;
  before_receipts integer;
  after_receipts integer;
begin
  insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo)
  values
    (org_id,'issue-123-p4c-org-a','Issue 123 P4C Org A','client','local',false,false),
    (other_org_id,'issue-123-p4c-org-b','Issue 123 P4C Org B','client','local',false,false);
  insert into public.projects(id,organization_id,slug,name)
  values
    (project_id,org_id,'issue-123-p4c-project-a','Issue 123 P4C Project A'),
    (other_project_id,other_org_id,'issue-123-p4c-project-b','Issue 123 P4C Project B');
  insert into recora_private.data_lifecycle_current(organization_id,project_id,state)
  values (org_id,null,'active'),(org_id,project_id,'active');
  select id into lifecycle_id from recora_private.data_lifecycle_current dlc where dlc.organization_id=org_id and dlc.project_id='12320000-0000-4000-8000-000000000001'::uuid;

  insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document)
  values (policy_v1,'issue_123_p4c_policy',1,now()-interval '2 days','{"capabilities":{"measurement":true},"limits":{"prompts":6}}'::jsonb);
  insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document,supersedes_policy_version_id)
  values (policy_v2,'issue_123_p4c_policy',1,now()-interval '1 day','{"capabilities":{"measurement":true,"analysis":true},"limits":{"prompts":12}}'::jsonb,policy_v1);
  insert into recora_private.entitlement_snapshots(id,organization_id,project_id,source_contract_reference,plan_policy_version_id,entitlement_schema_version,resolved_document,effective_from,resolver_version,idempotency_key)
  values (old_snapshot,org_id,project_id,'contract.p4c',policy_v1,1,'{"capabilities":{"measurement":true},"limits":{"prompts":6}}'::jsonb,now()-interval '2 days','p4c.fixture','p4c.entitlement.old');
  insert into recora_private.current_entitlement_snapshots(organization_id,project_id,snapshot_id)
  values (org_id,project_id,old_snapshot);
  select document_hash into old_hash from recora_private.entitlement_snapshots where id=old_snapshot;

  select command_receipt_id,outcome::text,stable_reason::text into r_contract_draft,command_outcome,command_reason
  from public.recora_p4_record_command_receipt(org_id,project_id,'contract.projection','provider_fixture','fixture.p4c','contract.p4c',121,repeat('1',64),'12340000-0000-4000-8000-000000000121','12350000-0000-4000-8000-000000000121','p4c.contract.draft');
  if command_outcome <> 'accepted' or command_reason <> 'ok' then raise exception 'P4-C draft command not accepted'; end if;
  insert into recora_private.p4_contract_projections(organization_id,project_id,contract_reference,source_namespace,latest_source_sequence,last_command_receipt_id)
  values(org_id,project_id,'contract.p4c','fixture.p4c',121,r_contract_draft) returning id into contract_id;
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,next_state,command_receipt_id,request_id,correlation_id)
  values(contract_id,org_id,1,'fixture.p4c','contract.p4c',121,repeat('1',64),'draft',r_contract_draft,'12340000-0000-4000-8000-000000000121','12350000-0000-4000-8000-000000000121');

  select command_receipt_id into r_contract_pending
  from public.recora_p4_record_command_receipt(org_id,project_id,'contract.projection','provider_fixture','fixture.p4c','contract.p4c',122,repeat('2',64),'12340000-0000-4000-8000-000000000122','12350000-0000-4000-8000-000000000122','p4c.contract.pending');
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(contract_id,org_id,2,'fixture.p4c','contract.p4c',122,repeat('2',64),'draft','pending_activation',r_contract_pending,'12340000-0000-4000-8000-000000000122','12350000-0000-4000-8000-000000000122');
  update recora_private.p4_contract_projections set state='pending_activation',latest_source_sequence=122,last_command_receipt_id=r_contract_pending where id=contract_id;

  select command_receipt_id into r_receipt
  from public.recora_p4_record_command_receipt(org_id,project_id,'billing.receipt','provider_fixture','fixture.p4c','receipt.activate',123,repeat('3',64),'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123','p4c.receipt.activate');
  insert into recora_private.p4_billing_receipts(organization_id,project_id,contract_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id)
  values(org_id,project_id,contract_id,'provider_fixture','fixture.p4c','receipt.activate',123,repeat('3',64),r_receipt,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123') returning id into billing_id;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,1,'received',r_receipt,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,2,'received','validated',r_receipt,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
  update recora_private.p4_billing_receipts set processing_state='validated' where id=billing_id;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,3,'validated','applying',r_receipt,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
  update recora_private.p4_billing_receipts set processing_state='applying' where id=billing_id;

  select command_receipt_id into r_payment
  from public.recora_p4_record_command_receipt(org_id,project_id,'billing.payment_fact','provider_fixture','fixture.p4c','receipt.activate',123,repeat('3',64),'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123','p4c.payment.activate');
  insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,project_id,contract_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,project_id,contract_id,'fixture.p4c','receipt.activate',123,'payment.chain.activate','payment_succeeded',r_payment,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123') returning id into fact_id;

  insert into recora_private.entitlement_snapshots(id,organization_id,project_id,source_contract_reference,plan_policy_version_id,entitlement_schema_version,resolved_document,effective_from,resolver_version,idempotency_key)
  values(new_snapshot,org_id,project_id,'contract.p4c',policy_v2,1,'{"capabilities":{"measurement":true,"analysis":true},"limits":{"prompts":12}}'::jsonb,now()-interval '1 day','p4c.fixture','p4c.entitlement.activate');
  update recora_private.current_entitlement_snapshots set snapshot_id=new_snapshot where organization_id=org_id and current_entitlement_snapshots.project_id='12320000-0000-4000-8000-000000000001'::uuid;
  select command_receipt_id into r_contract_active
  from public.recora_p4_record_command_receipt(org_id,project_id,'contract.projection','provider_fixture','fixture.p4c','contract.p4c',123,repeat('3',64),'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123','p4c.contract.active');
  insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,plan_policy_version_id,entitlement_snapshot_id,command_receipt_id,request_id,correlation_id)
  values(contract_id,org_id,3,'fixture.p4c','contract.p4c',123,repeat('3',64),'pending_activation','active',policy_v2,new_snapshot,r_contract_active,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
  update recora_private.p4_contract_projections set state='active',latest_source_sequence=123,plan_policy_version_id=policy_v2,entitlement_snapshot_id=new_snapshot,last_command_receipt_id=r_contract_active where id=contract_id;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(billing_id,org_id,4,'applying','applied',r_receipt,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
  update recora_private.p4_billing_receipts set processing_state='applied' where id=billing_id;
  set constraints all immediate;
  set constraints all deferred;

  select document_hash into old_hash_after from recora_private.entitlement_snapshots where id=old_snapshot;
  if old_hash_after is distinct from old_hash then raise exception 'P4-C changed an immutable historical entitlement snapshot'; end if;
  if (select snapshot_id from recora_private.current_entitlement_snapshots ces where ces.organization_id=org_id and ces.project_id='12320000-0000-4000-8000-000000000001'::uuid) <> new_snapshot then raise exception 'P4-C current pointer did not switch'; end if;
  if (select reason_code from public.recora_resolve_current_entitlement_snapshot(org_id,project_id)) <> 'ok' then raise exception 'P4-C entitlement resolver failed after pointer switch'; end if;
  if (select count(*) from recora_private.p4_normalized_payment_facts where receipt_id=billing_id) <> 1 then raise exception 'P4-C payment fact append count invalid'; end if;

  select command_receipt_id,outcome::text,stable_reason::text into replay_id,command_outcome,command_reason
  from public.recora_p4_record_command_receipt(org_id,project_id,'billing.receipt','provider_fixture','fixture.p4c','receipt.activate',123,repeat('3',64),'12340000-0000-4000-8000-000000000124','12350000-0000-4000-8000-000000000124','p4c.receipt.activate');
  if replay_id <> r_receipt or command_outcome <> 'replayed' or command_reason <> 'duplicate_command' then raise exception 'P4-C duplicate receipt did not replay'; end if;
  select outcome::text,stable_reason::text into command_outcome,command_reason
  from public.recora_p4_record_command_receipt(org_id,project_id,'billing.receipt','provider_fixture','fixture.p4c','receipt.activate.conflict',124,repeat('4',64),'12340000-0000-4000-8000-000000000125','12350000-0000-4000-8000-000000000125','p4c.receipt.activate');
  if command_outcome <> 'rejected' or command_reason <> 'idempotency_conflict' then raise exception 'P4-C contradictory fingerprint/idempotency was not rejected'; end if;
  begin
    insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(contract_id,org_id,4,'fixture.p4c','contract.p4c',122,repeat('2',64),'active','paused',r_contract_pending,'12340000-0000-4000-8000-000000000122','12350000-0000-4000-8000-000000000122');
    raise exception 'P4-C out-of-order contract event accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 contract source ordering conflict|P4 event predecessor mismatch|P4 domain command type or scope mismatch' then raise; end if;
  end;
  begin
    insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,project_id,contract_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,command_receipt_id,request_id,correlation_id)
    values(billing_id,org_id,project_id,contract_id,'fixture.p4c','receipt.activate',123,'payment.chain.activate','payment_failed',r_payment,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
    raise exception 'P4-C contradictory payment fact accepted';
  exception when unique_violation then
    if sqlerrm !~ 'p4_one_normalized_payment_fact_per_receipt' then raise; end if;
  end;

  select command_receipt_id into r_correction_receipt
  from public.recora_p4_record_command_receipt(org_id,project_id,'billing.receipt','provider_fixture','fixture.p4c','receipt.correction',124,repeat('5',64),'12340000-0000-4000-8000-000000000126','12350000-0000-4000-8000-000000000126','p4c.receipt.correction');
  insert into recora_private.p4_billing_receipts(organization_id,project_id,contract_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id)
  values(org_id,project_id,contract_id,'provider_fixture','fixture.p4c','receipt.correction',124,repeat('5',64),r_correction_receipt,'12340000-0000-4000-8000-000000000126','12350000-0000-4000-8000-000000000126') returning id into corrected_fact_id;
  insert into recora_private.p4_billing_receipt_events(receipt_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(corrected_fact_id,org_id,1,'received',r_correction_receipt,'12340000-0000-4000-8000-000000000126','12350000-0000-4000-8000-000000000126');
  select command_receipt_id into r_correction_payment
  from public.recora_p4_record_command_receipt(org_id,project_id,'billing.payment_fact','provider_fixture','fixture.p4c','receipt.correction',124,repeat('5',64),'12340000-0000-4000-8000-000000000126','12350000-0000-4000-8000-000000000126','p4c.payment.correction');
  insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,project_id,contract_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,corrects_fact_id,command_receipt_id,request_id,correlation_id)
  values(corrected_fact_id,org_id,project_id,contract_id,'fixture.p4c','receipt.correction',124,'payment.chain.activate','payment_reversed',fact_id,r_correction_payment,'12340000-0000-4000-8000-000000000126','12350000-0000-4000-8000-000000000126') returning id into corrected_fact_id;
  begin
    insert into recora_private.p4_normalized_payment_facts(receipt_id,organization_id,project_id,contract_id,source_namespace,source_reference,source_sequence,payment_chain_key,fact_kind,corrects_fact_id,command_receipt_id,request_id,correlation_id)
    values(billing_id,org_id,project_id,contract_id,'fixture.p4c','receipt.activate',123,'payment.chain.activate','payment_reversed',corrected_fact_id,r_payment,'12340000-0000-4000-8000-000000000123','12350000-0000-4000-8000-000000000123');
    raise exception 'P4-C correction-of-correction accepted';
  exception when unique_violation or raise_exception then
    if sqlerrm !~ 'p4_one_normalized_payment_fact_per_receipt|P4 payment correction lineage mismatch|P4 payment command lineage mismatch' then raise; end if;
  end;

  select command_receipt_id into r_cross
  from public.recora_p4_record_command_receipt(other_org_id,other_project_id,'contract.projection','provider_fixture','fixture.p4c','contract.p4c',125,repeat('6',64),'12340000-0000-4000-8000-000000000127','12350000-0000-4000-8000-000000000127','p4c.cross.contract');
  begin
    insert into recora_private.p4_contract_events(contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(contract_id,org_id,4,'fixture.p4c','contract.p4c',125,repeat('6',64),'active','paused',r_cross,'12340000-0000-4000-8000-000000000127','12350000-0000-4000-8000-000000000127');
    raise exception 'P4-C cross-tenant/project contract event accepted';
  exception when raise_exception then
    if sqlerrm !~ 'P4 domain command type or scope mismatch' then raise; end if;
  end;

  select count(*) into before_receipts from recora_private.p4_billing_receipts;
  begin
    select command_receipt_id into r_cross
    from public.recora_p4_record_command_receipt(org_id,project_id,'billing.receipt','provider_fixture','fixture.p4c','receipt.partial',130,repeat('7',64),'12340000-0000-4000-8000-000000000130','12350000-0000-4000-8000-000000000130','p4c.partial');
    insert into recora_private.p4_billing_receipts(organization_id,project_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,last_command_receipt_id,request_id,correlation_id)
    values(org_id,project_id,'provider_fixture','fixture.p4c','receipt.partial',130,repeat('7',64),r_cross,'12340000-0000-4000-8000-000000000130','12350000-0000-4000-8000-000000000130');
    set constraints all immediate;
    raise exception 'P4-C partial failure accepted without receipt event';
  exception when raise_exception then
    if sqlerrm !~ 'P4 billing receipt requires matching event' then raise; end if;
    set constraints all deferred;
  end;
  select count(*) into after_receipts from recora_private.p4_billing_receipts;
  if after_receipts <> before_receipts then raise exception 'P4-C partial failure left receipt residue'; end if;

  select command_receipt_id into r_checkpoint
  from public.recora_p4_record_command_receipt(org_id,project_id,'lifecycle.checkpoint','provider_fixture','fixture.p4c','checkpoint.suspend',140,repeat('8',64),'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140','p4c.checkpoint.suspend');
  insert into recora_private.p4_downstream_checkpoints(organization_id,project_id,command_receipt_id,required_effect,phase3_lifecycle_id,expected_lifecycle_version,blocks_customer_access,state,stable_reason)
  values(org_id,project_id,r_checkpoint,'lifecycle.suspend',lifecycle_id,1,true,'pending','checkpoint_pending') returning id into checkpoint_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(checkpoint_id,org_id,1,'pending',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,project_id,effect_kind,ordering_key,idempotency_key)
  values(checkpoint_id,r_checkpoint,org_id,project_id,'lifecycle.suspend',140,'p4c.outbox.suspend') returning id into outbox_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(outbox_id,org_id,1,'pending',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,project_id);
  if gate.customer_access_allowed or gate.reason_code <> 'checkpoint_pending' then raise exception 'P4-C pending checkpoint did not fail closed'; end if;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(checkpoint_id,org_id,2,'pending','applying',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  update recora_private.p4_downstream_checkpoints set state='applying' where id=checkpoint_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(outbox_id,org_id,2,'pending','failed',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  update recora_private.p4_durable_outbox set state='failed',stable_reason='checkpoint_failed',attempt_count=1,next_attempt_at=now()+interval '1 minute' where id=outbox_id;
  update recora_private.p4_durable_outbox set state='pending',stable_reason='checkpoint_pending',next_attempt_at=null where id=outbox_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(outbox_id,org_id,3,'failed','pending',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(outbox_id,org_id,4,'pending','delivered',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  update recora_private.p4_durable_outbox set state='delivered',stable_reason='ok',resolved_at=now() where id=outbox_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(checkpoint_id,org_id,3,'applying','completed',r_checkpoint,'12340000-0000-4000-8000-000000000140','12350000-0000-4000-8000-000000000140');
  update recora_private.p4_downstream_checkpoints set state='completed',stable_reason='ok' where id=checkpoint_id;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,project_id);
  if not gate.customer_access_allowed or gate.reason_code <> 'ok' then raise exception 'P4-C completed checkpoint did not recover access'; end if;

  select command_receipt_id into r_checkpoint_exhausted
  from public.recora_p4_record_command_receipt(org_id,project_id,'lifecycle.checkpoint','provider_fixture','fixture.p4c','checkpoint.exhausted',150,repeat('9',64),'12340000-0000-4000-8000-000000000150','12350000-0000-4000-8000-000000000150','p4c.checkpoint.exhausted');
  insert into recora_private.p4_downstream_checkpoints(organization_id,project_id,command_receipt_id,required_effect,phase3_lifecycle_id,expected_lifecycle_version,blocks_customer_access,state,stable_reason)
  values(org_id,project_id,r_checkpoint_exhausted,'lifecycle.suspend',lifecycle_id,1,true,'pending','checkpoint_pending') returning id into exhausted_checkpoint_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(exhausted_checkpoint_id,org_id,1,'pending',r_checkpoint_exhausted,'12340000-0000-4000-8000-000000000150','12350000-0000-4000-8000-000000000150');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,project_id,effect_kind,ordering_key,idempotency_key)
  values(exhausted_checkpoint_id,r_checkpoint_exhausted,org_id,project_id,'lifecycle.suspend',150,'p4c.outbox.exhausted') returning id into exhausted_outbox_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(exhausted_outbox_id,org_id,1,'pending',r_checkpoint_exhausted,'12340000-0000-4000-8000-000000000150','12350000-0000-4000-8000-000000000150');
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(exhausted_outbox_id,org_id,2,'pending','reconciliation_required',r_checkpoint_exhausted,'12340000-0000-4000-8000-000000000150','12350000-0000-4000-8000-000000000150');
  update recora_private.p4_durable_outbox set state='reconciliation_required',stable_reason='reconciliation_required',exhausted_at=now() where id=exhausted_outbox_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(exhausted_checkpoint_id,org_id,2,'pending','reconciliation_required',r_checkpoint_exhausted,'12340000-0000-4000-8000-000000000150','12350000-0000-4000-8000-000000000150');
  update recora_private.p4_downstream_checkpoints set state='reconciliation_required',stable_reason='reconciliation_required' where id=exhausted_checkpoint_id;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,project_id);
  if gate.customer_access_allowed or gate.reason_code <> 'reconciliation_required' then raise exception 'P4-C retry exhaustion did not fail closed'; end if;

  select command_receipt_id into r_checkpoint_recovery
  from public.recora_p4_record_command_receipt(org_id,project_id,'lifecycle.checkpoint','provider_fixture','fixture.p4c','checkpoint.recovery',151,repeat('a',64),'12340000-0000-4000-8000-000000000151','12350000-0000-4000-8000-000000000151','p4c.checkpoint.recovery');
  insert into recora_private.p4_downstream_checkpoints(organization_id,project_id,command_receipt_id,required_effect,phase3_lifecycle_id,expected_lifecycle_version,blocks_customer_access,state,stable_reason,correction_of_checkpoint_id)
  values(org_id,project_id,r_checkpoint_recovery,'lifecycle.suspend',lifecycle_id,1,true,'pending','checkpoint_pending',exhausted_checkpoint_id) returning id into recovery_checkpoint_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(recovery_checkpoint_id,org_id,1,'pending',r_checkpoint_recovery,'12340000-0000-4000-8000-000000000151','12350000-0000-4000-8000-000000000151');
  insert into recora_private.p4_durable_outbox(checkpoint_id,command_receipt_id,organization_id,project_id,effect_kind,ordering_key,idempotency_key,correction_of_outbox_id)
  values(recovery_checkpoint_id,r_checkpoint_recovery,org_id,project_id,'lifecycle.suspend',151,'p4c.outbox.recovery',exhausted_outbox_id) returning id into recovery_outbox_id;
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,next_state,command_receipt_id,request_id,correlation_id)
  values(recovery_outbox_id,org_id,1,'pending',r_checkpoint_recovery,'12340000-0000-4000-8000-000000000151','12350000-0000-4000-8000-000000000151');
  insert into recora_private.p4_outbox_events(outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(recovery_outbox_id,org_id,2,'pending','delivered',r_checkpoint_recovery,'12340000-0000-4000-8000-000000000151','12350000-0000-4000-8000-000000000151');
  update recora_private.p4_durable_outbox set state='delivered',stable_reason='ok',resolved_at=now() where id=recovery_outbox_id;
  update recora_private.p4_durable_outbox set superseded_by_outbox_id=recovery_outbox_id where id=exhausted_outbox_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(recovery_checkpoint_id,org_id,2,'pending','applying',r_checkpoint_recovery,'12340000-0000-4000-8000-000000000151','12350000-0000-4000-8000-000000000151');
  update recora_private.p4_downstream_checkpoints set state='applying' where id=recovery_checkpoint_id;
  insert into recora_private.p4_checkpoint_events(checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(recovery_checkpoint_id,org_id,3,'applying','completed',r_checkpoint_recovery,'12340000-0000-4000-8000-000000000151','12350000-0000-4000-8000-000000000151');
  update recora_private.p4_downstream_checkpoints set state='completed',stable_reason='ok' where id=recovery_checkpoint_id;
  update recora_private.p4_downstream_checkpoints set superseded_by_checkpoint_id=recovery_checkpoint_id where id=exhausted_checkpoint_id;
  set constraints all immediate;
  set constraints all deferred;
  select * into gate from public.recora_p4_resolve_checkpoint_gate(org_id,project_id);
  if not gate.customer_access_allowed or gate.reason_code <> 'ok' then raise exception 'P4-C checkpoint correction did not recover access'; end if;
end;
$p4c$;
rollback;
`);

function runConcurrentSql(sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "--interactive",
        dbContainer!,
        "psql",
        "--username",
        "postgres",
        "--dbname",
        "postgres",
        "--no-psqlrc",
        "--set",
        "ON_ERROR_STOP=1",
        "--tuples-only",
        "--no-align"
      ],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(sanitize(`${stdout}\n${stderr}`)));
    });
    child.stdin.end(sql);
  });
}

async function verifyConcurrentReplay() {
  queryLocal(`
insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo)
values('12310000-0000-4000-8000-000000000003','issue-123-p4c-concurrent','Issue 123 P4C Concurrent','client','local',false,false)
on conflict (id) do nothing;
`);
  const command = (requestId: string, correlationId: string) => `
select command_receipt_id::text || '|' || outcome::text || '|' || stable_reason::text
from public.recora_p4_record_command_receipt(
  '12310000-0000-4000-8000-000000000003'::uuid,
  null,
  'billing.receipt',
  'provider_fixture'::recora_private.p4_source_kind,
  'fixture.p4c',
  'receipt.concurrent',
  999,
  repeat('b',64),
  '${requestId}'::uuid,
  '${correlationId}'::uuid,
  'p4c.concurrent.receipt'
);`;
  const outputs = await Promise.all([
    runConcurrentSql(command("12340000-0000-4000-8000-000000000901", "12350000-0000-4000-8000-000000000901")),
    runConcurrentSql(command("12340000-0000-4000-8000-000000000902", "12350000-0000-4000-8000-000000000902"))
  ]);
  const rows = outputs.map((output) => output.trim().split(/\r?\n/).filter(Boolean).at(-1)!.split("|"));
  assert.equal(new Set(rows.map(([id]) => id)).size, 1, "P4-C concurrent replay created more than one command receipt");
  assert.deepEqual(new Set(rows.map(([, outcome]) => outcome)), new Set(["accepted", "replayed"]));
  assert.ok(rows.every(([, , reason]) => reason === "ok" || reason === "duplicate_command"));
}

verifyConcurrentReplay()
  .then(() => {
    const denied = createCustomerSafeContractResult({
      entitlement: null,
      checkpointGate: { customer_access_allowed: false, reason_code: "reconciliation_required" }
    });
    assertCustomerSafeContractResult(denied);
    assert.equal(denied.customerAccessAllowed, false);
    console.log(
      JSON.stringify(
        {
          status: "ok",
          scope: "issue-123-p4c-contract-billing-entitlement",
          database: "isolated-local-only",
          container: dbContainer,
          workdir: "temporary-local-supabase",
          cases: {
            providerNeutralEnvelope: "exact-validation",
            receiptAndDedupe: "validated-duplicate-conflict-ordering",
            paymentFact: "append-only-correction-lineage-and-contradiction-negative",
            contractProjection: "deterministic-state-source-and-event-alignment",
            entitlement: "immutable-snapshot-and-same-scope-pointer-switch",
            atomicity: "partial-failure-rolled-back",
            checkpointOutbox: "fail-closed-retry-exhaustion-correction-recovery",
            scope: "cross-tenant-project-rejected",
            concurrentReplay: "accepted-and-replayed-on-one-receipt",
            customerSafeResult: "no-provider-billing-audit-payload-pointer-internals"
          },
          remoteDatabaseCalls: "absent",
          providerCalls: "absent",
          webhookCalls: "absent"
        },
        null,
        2
      )
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
