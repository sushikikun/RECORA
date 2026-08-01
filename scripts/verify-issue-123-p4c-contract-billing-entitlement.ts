import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type {
  Phase4ProviderNeutralBillingCommand,
  Phase4ConfirmLifecycleCheckpointCommand,
  Phase4ReconcileLifecycleCheckpointCommand,
  Phase4RecordLifecycleCheckpointAttemptCommand,
  Phase4CustomerSafeContractResult
} from "../lib/recora/phase4-contract-billing-entitlement";
type CommandResult = { stdout: string; stderr: string; status: number | null };
type OperatorEvidence = { auditEventId: string; commandReceiptId: string; outcome: string; failure: string | null };

const repoRoot = process.cwd();
const expectedContainer = "supabase_db_recoraissue123";
const dbContainer = process.env.RECORA_ISSUE_123_DB_CONTAINER;
const supabaseWorkdir = process.env.RECORA_ISSUE_123_SUPABASE_WORKDIR;
const supabaseCli = path.join(repoRoot, "node_modules", "supabase", "dist", "supabase.js");
const p4cMigrationName = "20260731210957_p4c_contract_billing_entitlement_rpc.sql";
const p4cMigrationPath = path.join(repoRoot, "supabase", "migrations", p4cMigrationName);
const p4cModulePath = path.join(repoRoot, "lib", "recora", "phase4-contract-billing-entitlement.ts");

assert.equal(dbContainer, expectedContainer, "Issue #123 requires RECORA_ISSUE_123_DB_CONTAINER=supabase_db_recoraissue123.");
assert.ok(supabaseWorkdir, "Issue #123 requires RECORA_ISSUE_123_SUPABASE_WORKDIR for the isolated local stack.");
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

const p4c = requireFromVerifier("../lib/recora/phase4-contract-billing-entitlement") as typeof import("../lib/recora/phase4-contract-billing-entitlement");
const migrationSql = fs.readFileSync(p4cMigrationPath, "utf8");
const moduleSqlBoundary = fs.readFileSync(p4cModulePath, "utf8");

assert.match(migrationSql, /public\.recora_p4c_apply_contract_billing_entitlement_command/i);
assert.match(migrationSql, /public\.recora_p4c_confirm_lifecycle_checkpoint_command/i);
assert.match(migrationSql, /public\.recora_p4c_reconcile_lifecycle_checkpoint_command/i);
assert.match(migrationSql, /public\.recora_p4c_record_lifecycle_checkpoint_attempt_command/i);
assert.match(migrationSql, /security definer\s+set search_path = ''/i);
assert.match(migrationSql, /extensions\.digest/i);
assert.match(migrationSql, /grant execute on function public\.recora_p4c_apply_contract_billing_entitlement_command[\s\S]*to service_role/i);
assert.match(migrationSql, /grant execute on function public\.recora_p4c_record_lifecycle_checkpoint_attempt_command[\s\S]*to service_role/i);
assert.match(migrationSql, /revoke all on function public\.recora_p4c_apply_contract_billing_entitlement_command[\s\S]*from public, anon, authenticated/i);
assert.match(migrationSql, /revoke all on function public\.recora_p4c_record_lifecycle_checkpoint_attempt_command[\s\S]*from public, anon, authenticated/i);
assert.doesNotMatch(migrationSql, /create\s+(table|type|schema)|alter\s+table|drop\s+table|create\s+policy|alter\s+policy/i);
assert.doesNotMatch(migrationSql, /grant\s+.*recora_private\..*to\s+(anon|authenticated|public)/i);
const applyRpcHeader = migrationSql.match(/create or replace function public\.recora_p4c_apply_contract_billing_entitlement_command[\s\S]*?\)\s*returns table/i)?.[0] ?? "";
assert.doesNotMatch(applyRpcHeader, /p_authoritative_plan_policy_key|p_payload_fingerprint|p_downstream_effect_result/i);
assert.match(moduleSqlBoundary, /import "server-only"/);
assert.match(moduleSqlBoundary, /recora_p4c_apply_contract_billing_entitlement_command/);
assert.match(moduleSqlBoundary, /executePhase4ConfirmLifecycleCheckpointCommand/);
assert.match(moduleSqlBoundary, /executePhase4ReconcileLifecycleCheckpointCommand/);
assert.match(moduleSqlBoundary, /executePhase4RecordLifecycleCheckpointAttemptCommand/);
assert.doesNotMatch(moduleSqlBoundary, /from\s+["'](?:postgres|pg|drizzle-orm|kysely|slonik)["']/i);
const commandTypeBoundary = moduleSqlBoundary.match(/export type Phase4ProviderNeutralBillingCommand = \{[\s\S]*?\};/)?.[0] ?? "";
const runtimeRpcBoundary = moduleSqlBoundary.match(/client\.rpc\("recora_p4c_apply_contract_billing_entitlement_command", \{[\s\S]*?\}\);/)?.[0] ?? "";
assert.ok(commandTypeBoundary, "P4-C command type boundary was not found.");
assert.ok(runtimeRpcBoundary, "P4-C runtime RPC boundary was not found.");
assert.doesNotMatch(`${commandTypeBoundary}\n${runtimeRpcBoundary}`, /authoritativePlanPolicyKey|payloadFingerprint|downstreamEffectResult|blocksCustomerAccess:\s*boolean|resolvedDocument:\s*|currentContractState:\s*|existingReceipt:\s*|latestSourceSequence:\s*/);

const tempMigrationPath = path.join(supabaseWorkdir, "supabase", "migrations", p4cMigrationName);
fs.copyFileSync(p4cMigrationPath, tempMigrationPath);

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]");
}

function run(executable: string, args: string[], options: { input?: string; timeout?: number; env?: NodeJS.ProcessEnv | Record<string, string> } = {}): CommandResult {
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...options.env },
    input: options.input,
    maxBuffer: 80 * 1024 * 1024,
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
  const result = run("docker", ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet"], { input: sql, timeout: 180_000 });
  const output = sanitize(`${result.stdout}\n${result.stderr}`);
  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected ${expectedError}, but SQL succeeded.`);
    assert.match(output, expectedError);
    return output;
  }
  assert.equal(result.status, 0, `Local SQL failed:\n${output}`);
  return output;
}

function queryValue(sql: string): string {
  const result = run("docker", ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet", "--tuples-only", "--no-align"], { input: sql, timeout: 180_000 });
  const output = sanitize(`${result.stdout}\n${result.stderr}`);
  assert.equal(result.status, 0, `Local SQL value query failed:\n${output}`);
  const lines = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  assert.ok(lines.length > 0, "Local SQL value query returned no rows.");
  return lines[lines.length - 1];
}

function queryJson<T>(sql: string): T {
  return JSON.parse(queryValue(sql)) as T;
}
function sqlText(value: string | null): string {
  if (value === null) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlUuid(value: string | null): string {
  return value === null ? "null::uuid" : `${sqlText(value)}::uuid`;
}

function sqlJson(value: unknown): string {
  return `${sqlText(JSON.stringify(value))}::jsonb`;
}

function collectRpcRowsSql(rpcExpression: string): string {
  return `
begin;
set local role service_role;
select coalesce(jsonb_agg(to_jsonb(result_row)), '[]'::jsonb)::text
from ${rpcExpression} result_row;
commit;
`;
}

function callP4cRpcSql(args: Record<string, unknown>): string {
  return collectRpcRowsSql(`public.recora_p4c_apply_contract_billing_entitlement_command(
  ${sqlUuid(args.p_organization_id as string)},
  ${sqlUuid(args.p_project_id as string | null)},
  ${sqlText(args.p_source_kind as string)},
  ${sqlText(args.p_source_namespace as string)},
  ${sqlText(args.p_source_reference as string)},
  ${(args.p_source_sequence as number).toString()}::bigint,
  ${sqlText(args.p_contract_reference as string)},
  ${sqlText(args.p_next_contract_state as string)},
  ${sqlText(args.p_payment_fact_kind as string)},
  ${sqlText(args.p_payment_chain_key as string)},
  ${sqlText(args.p_idempotency_key as string)},
  ${sqlUuid(args.p_request_id as string)},
  ${sqlUuid(args.p_correlation_id as string)},
  ${sqlUuid(args.p_operator_audit_event_id as string)},
  ${sqlUuid(args.p_operator_command_receipt_id as string)},
  ${sqlUuid(args.p_corrects_payment_fact_id as string | null)}
)`);
}

function callP4cRpc(args: Record<string, unknown>): unknown[] {
  return queryJson<unknown[]>(callP4cRpcSql(args));
}

function callConfirmRpcSql(args: Record<string, unknown>): string {
  return collectRpcRowsSql(`public.recora_p4c_confirm_lifecycle_checkpoint_command(
  ${sqlUuid(args.p_organization_id as string)},
  ${sqlUuid(args.p_project_id as string | null)},
  ${sqlUuid(args.p_checkpoint_id as string)},
  ${sqlUuid(args.p_phase3_lifecycle_event_id as string)},
  ${sqlText(args.p_idempotency_key as string)},
  ${sqlUuid(args.p_request_id as string)},
  ${sqlUuid(args.p_correlation_id as string)},
  ${sqlUuid(args.p_operator_audit_event_id as string)},
  ${sqlUuid(args.p_operator_command_receipt_id as string)}
)`);
}

function callConfirmRpc(args: Record<string, unknown>): unknown[] {
  return queryJson<unknown[]>(callConfirmRpcSql(args));
}

function callReconcileRpcSql(args: Record<string, unknown>): string {
  return collectRpcRowsSql(`public.recora_p4c_reconcile_lifecycle_checkpoint_command(
  ${sqlUuid(args.p_organization_id as string)},
  ${sqlUuid(args.p_project_id as string | null)},
  ${sqlUuid(args.p_checkpoint_id as string)},
  ${sqlUuid(args.p_phase3_lifecycle_audit_event_id as string)},
  ${sqlText(args.p_idempotency_key as string)},
  ${sqlUuid(args.p_request_id as string)},
  ${sqlUuid(args.p_correlation_id as string)},
  ${sqlUuid(args.p_operator_audit_event_id as string)},
  ${sqlUuid(args.p_operator_command_receipt_id as string)}
)`);
}

function callReconcileRpc(args: Record<string, unknown>): unknown[] {
  return queryJson<unknown[]>(callReconcileRpcSql(args));
}
function callAttemptRpcSql(args: Record<string, unknown>): string {
  return collectRpcRowsSql(`public.recora_p4c_record_lifecycle_checkpoint_attempt_command(
  ${sqlUuid(args.p_organization_id as string)},
  ${sqlUuid(args.p_project_id as string | null)},
  ${sqlUuid(args.p_checkpoint_id as string)},
  ${sqlText(args.p_attempt_outcome as string)},
  ${sqlText(args.p_idempotency_key as string)},
  ${sqlUuid(args.p_request_id as string)},
  ${sqlUuid(args.p_correlation_id as string)},
  ${sqlUuid(args.p_operator_audit_event_id as string)},
  ${sqlUuid(args.p_operator_command_receipt_id as string)}
)`);
}

function callAttemptRpc(args: Record<string, unknown>): unknown[] {
  return queryJson<unknown[]>(callAttemptRpcSql(args));
}
function callRpcSqlProcess(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "--interactive", dbContainer!, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet", "--tuples-only", "--no-align"], {
      cwd: repoRoot,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (status) => {
      const output = sanitize(`${stdout}\n${stderr}`);
      if (status !== 0) {
        reject(new Error(`concurrent RPC failed with ${status}:\n${output}`));
        return;
      }
      const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      try {
        resolve(JSON.parse(lines[lines.length - 1]) as unknown[]);
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(sql);
  });
}

function callP4cRpcProcess(command: Phase4ProviderNeutralBillingCommand): Promise<unknown[]> {
  return callRpcSqlProcess(callP4cRpcSql(commandToRpcArgs(command)));
}

function callConfirmRpcProcess(command: Phase4ConfirmLifecycleCheckpointCommand): Promise<unknown[]> {
  return callRpcSqlProcess(callConfirmRpcSql(confirmCommandToRpcArgs(command)));
}

function callReconcileRpcProcess(command: Phase4ReconcileLifecycleCheckpointCommand): Promise<unknown[]> {
  return callRpcSqlProcess(callReconcileRpcSql(reconcileCommandToRpcArgs(command)));
}
function callAttemptRpcProcess(command: Phase4RecordLifecycleCheckpointAttemptCommand): Promise<unknown[]> {
  return callRpcSqlProcess(callAttemptRpcSql(attemptCommandToRpcArgs(command)));
}
function commandToRpcArgs(command: Phase4ProviderNeutralBillingCommand): Record<string, unknown> {
  return {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_source_kind: command.sourceKind,
    p_source_namespace: command.sourceNamespace,
    p_source_reference: command.sourceReference,
    p_source_sequence: command.sourceSequence,
    p_contract_reference: command.contractReference,
    p_next_contract_state: command.nextContractState,
    p_payment_fact_kind: command.paymentFactKind,
    p_payment_chain_key: command.paymentChainKey,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId,
    p_corrects_payment_fact_id: command.correctsPaymentFactId
  };
}

function confirmCommandToRpcArgs(command: Phase4ConfirmLifecycleCheckpointCommand): Record<string, unknown> {
  return {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_checkpoint_id: command.checkpointId,
    p_phase3_lifecycle_event_id: command.phase3LifecycleEventId,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId
  };
}

function reconcileCommandToRpcArgs(command: Phase4ReconcileLifecycleCheckpointCommand): Record<string, unknown> {
  return {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_checkpoint_id: command.checkpointId,
    p_phase3_lifecycle_audit_event_id: command.phase3LifecycleAuditEventId,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId
  };
}

function attemptCommandToRpcArgs(command: Phase4RecordLifecycleCheckpointAttemptCommand): Record<string, unknown> {
  return {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_checkpoint_id: command.checkpointId,
    p_attempt_outcome: command.attemptOutcome,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId
  };
}
const rpcClient = {
  async rpc(name: string, args: Record<string, unknown>) {
    try {
      if (name === "recora_p4c_apply_contract_billing_entitlement_command") return { data: callP4cRpc(args), error: null };
      if (name === "recora_p4c_confirm_lifecycle_checkpoint_command") return { data: callConfirmRpc(args), error: null };
      if (name === "recora_p4c_reconcile_lifecycle_checkpoint_command") return { data: callReconcileRpc(args), error: null };
      if (name === "recora_p4c_record_lifecycle_checkpoint_attempt_command") return { data: callAttemptRpc(args), error: null };
      throw new Error(`Unexpected RPC ${name}`);
    } catch (error) {
      return { data: null, error };
    }
  }
};

const ORG_A = "12310000-0000-4000-8000-000000000001";
const PROJECT_A = "12320000-0000-4000-8000-000000000001";
const ORG_B = "12310000-0000-4000-8000-000000000002";
const PROJECT_B = "12320000-0000-4000-8000-000000000002";
const ORG_C = "12310000-0000-4000-8000-000000000003";
const PROJECT_C = "12320000-0000-4000-8000-000000000003";
const OPERATOR_USER = "12300000-0000-4000-8000-000000000001";
const OPERATOR_ID = "12330000-0000-4000-8000-000000000001";
const WEAK_POLICY_ID = "12360000-0000-4000-8000-000000000001";
const STRONG_POLICY_ID = "12360000-0000-4000-8000-000000000002";
const FUTURE_POLICY_ID = "12360000-0000-4000-8000-000000000003";
const EXPIRED_POLICY_ID = "12360000-0000-4000-8000-000000000004";
const TRANSITIVE_POLICY_ROOT_ID = "12360000-0000-4000-8000-000000000005";
const TRANSITIVE_POLICY_MID_ID = "12360000-0000-4000-8000-000000000006";
const TRANSITIVE_POLICY_HEAD_ID = "12360000-0000-4000-8000-000000000007";
const POLICY_KEY = "issue.123.p4c.policy";
const FUTURE_POLICY_KEY = "issue.123.p4c.future.policy";
const EXPIRED_POLICY_KEY = "issue.123.p4c.expired.policy";
const TRANSITIVE_POLICY_KEY = "issue.123.p4c.transitive.policy";

function requestId(sequence: number): string {
  return `12340000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
}

function correlationId(sequence: number): string {
  return `12350000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
}

function setupSql(): string {
  return `
begin;
insert into auth.users (id, email, created_at, updated_at)
values (${sqlUuid(OPERATOR_USER)}, 'issue-123-p4c-operator@example.invalid', now(), now());
insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values
  (${sqlUuid(ORG_A)},'issue-123-p4c-org-a','Issue 123 P4C Org A','client','local',false,false),
  (${sqlUuid(ORG_B)},'issue-123-p4c-org-b','Issue 123 P4C Org B','client','local',false,false),
  (${sqlUuid(ORG_C)},'issue-123-p4c-org-c','Issue 123 P4C Org C','client','local',false,false);
insert into public.projects(id,organization_id,slug,name) values
  (${sqlUuid(PROJECT_A)},${sqlUuid(ORG_A)},'issue-123-p4c-project-a','Issue 123 P4C Project A'),
  (${sqlUuid(PROJECT_B)},${sqlUuid(ORG_B)},'issue-123-p4c-project-b','Issue 123 P4C Project B'),
  (${sqlUuid(PROJECT_C)},${sqlUuid(ORG_C)},'issue-123-p4c-project-c','Issue 123 P4C Project C');
insert into recora_operator.operator_identities (id, auth_user_id, status, display_label)
values (${sqlUuid(OPERATOR_ID)}, ${sqlUuid(OPERATOR_USER)}, 'active', 'Issue 123 P4C operator fixture');
insert into recora_operator.operator_action_grants (operator_id, permission, organization_id, project_id) values
  (${sqlUuid(OPERATOR_ID)}, 'p4c.contract.billing.apply', ${sqlUuid(ORG_A)}, ${sqlUuid(PROJECT_A)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.contract.billing.apply', ${sqlUuid(ORG_B)}, ${sqlUuid(PROJECT_B)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.contract.billing.apply', ${sqlUuid(ORG_C)}, ${sqlUuid(PROJECT_C)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.confirm', ${sqlUuid(ORG_A)}, ${sqlUuid(PROJECT_A)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.confirm', ${sqlUuid(ORG_B)}, ${sqlUuid(PROJECT_B)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.confirm', ${sqlUuid(ORG_C)}, ${sqlUuid(PROJECT_C)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.reconcile', ${sqlUuid(ORG_A)}, ${sqlUuid(PROJECT_A)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.reconcile', ${sqlUuid(ORG_B)}, ${sqlUuid(PROJECT_B)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.reconcile', ${sqlUuid(ORG_C)}, ${sqlUuid(PROJECT_C)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.attempt', ${sqlUuid(ORG_A)}, ${sqlUuid(PROJECT_A)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.attempt', ${sqlUuid(ORG_B)}, ${sqlUuid(PROJECT_B)}),
  (${sqlUuid(OPERATOR_ID)}, 'p4c.lifecycle.checkpoint.attempt', ${sqlUuid(ORG_C)}, ${sqlUuid(PROJECT_C)}),
  (${sqlUuid(OPERATOR_ID)}, 'data_lifecycle.transition', ${sqlUuid(ORG_A)}, ${sqlUuid(PROJECT_A)}),
  (${sqlUuid(OPERATOR_ID)}, 'data_lifecycle.transition', ${sqlUuid(ORG_B)}, ${sqlUuid(PROJECT_B)}),
  (${sqlUuid(OPERATOR_ID)}, 'data_lifecycle.transition', ${sqlUuid(ORG_C)}, ${sqlUuid(PROJECT_C)});
insert into recora_private.data_lifecycle_current(organization_id,project_id,state) values
  (${sqlUuid(ORG_A)},null,'active'),
  (${sqlUuid(ORG_A)},${sqlUuid(PROJECT_A)},'active'),
  (${sqlUuid(ORG_B)},null,'active'),
  (${sqlUuid(ORG_B)},${sqlUuid(PROJECT_B)},'active'),
  (${sqlUuid(ORG_C)},null,'active'),
  (${sqlUuid(ORG_C)},${sqlUuid(PROJECT_C)},'active');
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document)
values (${sqlUuid(WEAK_POLICY_ID)}, ${sqlText(POLICY_KEY)}, 1, now() - interval '2 days', ${sqlJson({ capabilities: { measurement: true }, limits: { prompts: 6 } })});
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document,supersedes_policy_version_id)
values (${sqlUuid(STRONG_POLICY_ID)}, ${sqlText(POLICY_KEY)}, 1, now() - interval '1 day', ${sqlJson({ capabilities: { measurement: true, analysis: true }, limits: { prompts: 12 } })}, ${sqlUuid(WEAK_POLICY_ID)});
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document)
values (${sqlUuid(FUTURE_POLICY_ID)}, ${sqlText(FUTURE_POLICY_KEY)}, 1, now() + interval '2 days', ${sqlJson({ capabilities: { measurement: true, future: true }, limits: { prompts: 99 } })});
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,effective_until,policy_document)
values (${sqlUuid(EXPIRED_POLICY_ID)}, ${sqlText(EXPIRED_POLICY_KEY)}, 1, now() - interval '4 days', now() - interval '2 days', ${sqlJson({ capabilities: { measurement: true, expired: true }, limits: { prompts: 1 } })});
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document)
values (${sqlUuid(TRANSITIVE_POLICY_ROOT_ID)}, ${sqlText(TRANSITIVE_POLICY_KEY)}, 1, now() - interval '5 days', ${sqlJson({ capabilities: { measurement: true }, limits: { prompts: 2 } })});
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,effective_until,policy_document,supersedes_policy_version_id)
values (${sqlUuid(TRANSITIVE_POLICY_MID_ID)}, ${sqlText(TRANSITIVE_POLICY_KEY)}, 1, now() - interval '4 days', now() - interval '3 days', ${sqlJson({ capabilities: { measurement: true }, limits: { prompts: 4 } })}, ${sqlUuid(TRANSITIVE_POLICY_ROOT_ID)});
insert into recora_private.plan_policy_versions(id,policy_key,policy_schema_version,effective_from,policy_document,supersedes_policy_version_id)
values (${sqlUuid(TRANSITIVE_POLICY_HEAD_ID)}, ${sqlText(TRANSITIVE_POLICY_KEY)}, 1, now() - interval '1 day', ${sqlJson({ capabilities: { measurement: true }, limits: { prompts: 24 } })}, ${sqlUuid(TRANSITIVE_POLICY_MID_ID)});
commit;
`;
}
function readPolicySummary(policyId = STRONG_POLICY_ID): { key: string; hash_chars: string[]; schema_version: number } {
  const row = queryJson<{ key: string; hash: string; schema_version: number }>(`
select jsonb_build_object('key', policy_key, 'hash', policy_hash, 'schema_version', policy_schema_version)::text
from recora_private.plan_policy_versions
where id = ${sqlUuid(policyId)};
`);
  return { key: row.key, hash_chars: row.hash.split(""), schema_version: row.schema_version };
}

type PolicySummary = { key: string; hash_chars: string[]; schema_version: number };
type ApplyCommandEvidenceSummary = {
  source_kind: Phase4ProviderNeutralBillingCommand["sourceKind"];
  source_namespace: string;
  source_reference: string;
  source_sequence: number;
  contract_reference: string;
  next_contract_state: Phase4ProviderNeutralBillingCommand["nextContractState"];
  payment_fact_kind: Phase4ProviderNeutralBillingCommand["paymentFactKind"];
  payment_chain_key: string;
  corrects_payment_fact_id_chars: string[] | null;
};

function createOperatorEvidence(
  orgId: string,
  projectId: string | null,
  sequence: number,
  input: { action?: string; afterSummary: unknown } = { afterSummary: { state: "approved" } }
): OperatorEvidence {
  const action = input.action ?? "p4c.contract.billing.apply";
  const request = requestId(sequence);
  const correlation = correlationId(sequence);
  const targetType = projectId === null ? "organization" : "project";
  const targetId = projectId ?? orgId;
  const audit = queryJson<{ auditEventId: string; outcome: string; failure: string | null }>(`
begin;
set local role service_role;
select jsonb_build_object(
  'auditEventId', audit.audit_event_id,
  'outcome', audit.outcome,
  'failure', audit.failure_reason_code
)::text
from public.recora_operator_execute_authorized_command_receipt(
  ${sqlUuid(OPERATOR_USER)},
  ${sqlText(action)},
  ${sqlUuid(orgId)},
  ${sqlUuid(projectId)},
  ${sqlText(action)},
  ${sqlText(targetType)},
  ${sqlUuid(targetId)},
  'issue 123 p4c rpc evidence',
  ${sqlUuid(request)},
  ${sqlUuid(correlation)},
  ${sqlJson({ state: "before" })},
  ${sqlJson(input.afterSummary)}
) audit;
commit;
`);
  assert.equal(audit.outcome, "success", `operator evidence was not authorized: ${audit.failure}`);
  const commandReceiptId = queryValue(`
select id::text
from recora_operator.operator_command_receipts
where audit_event_id = ${sqlUuid(audit.auditEventId)};
`);
  return { ...audit, commandReceiptId };
}

function uuidChars(value: string | null): string[] | null {
  return value === null ? null : value.split("");
}

function applyCommandEvidenceSummary(input: ApplyCommandEvidenceSummary): ApplyCommandEvidenceSummary {
  return {
    source_kind: input.source_kind,
    source_namespace: input.source_namespace,
    source_reference: input.source_reference,
    source_sequence: input.source_sequence,
    contract_reference: input.contract_reference,
    next_contract_state: input.next_contract_state,
    payment_fact_kind: input.payment_fact_kind,
    payment_chain_key: input.payment_chain_key,
    corrects_payment_fact_id_chars: input.corrects_payment_fact_id_chars
  };
}

function makeCommand(input: {
  orgId?: string;
  projectId?: string | null;
  sequence: number;
  requestSequence?: number;
  sourceReference: string;
  idempotencyKey: string;
  sourceNamespace?: string;
  contractReference?: string;
  nextContractState: Phase4ProviderNeutralBillingCommand["nextContractState"];
  paymentFactKind?: Phase4ProviderNeutralBillingCommand["paymentFactKind"];
  paymentChainKey?: string;
  policyId?: string;
  policySummary?: PolicySummary;
  afterSummary?: unknown;
  correctsPaymentFactId?: string | null;
}): Phase4ProviderNeutralBillingCommand {
  const orgId = input.orgId ?? ORG_A;
  const projectId = input.projectId === undefined ? PROJECT_A : input.projectId;
  const sourceNamespace = input.sourceNamespace ?? "fixture.p4c";
  const contractReference = input.contractReference ?? "contract.p4c";
  const paymentFactKind = input.paymentFactKind ?? "payment_unknown";
  const paymentChainKey = input.paymentChainKey ?? "chain.primary";
  const correctsPaymentFactId = input.correctsPaymentFactId ?? null;
  const evidenceSequence = input.requestSequence ?? input.sequence;
  const commandSummary = applyCommandEvidenceSummary({
    source_kind: "provider_fixture",
    source_namespace: sourceNamespace,
    source_reference: input.sourceReference,
    source_sequence: input.sequence,
    contract_reference: contractReference,
    next_contract_state: input.nextContractState,
    payment_fact_kind: paymentFactKind,
    payment_chain_key: paymentChainKey,
    corrects_payment_fact_id_chars: uuidChars(correctsPaymentFactId)
  });
  const afterSummary = input.afterSummary ?? { policy: input.policySummary ?? readPolicySummary(input.policyId), command: commandSummary };
  const evidence = createOperatorEvidence(orgId, projectId, evidenceSequence, { afterSummary });
  return {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: orgId,
    projectId,
    sourceKind: "provider_fixture",
    sourceNamespace,
    sourceReference: input.sourceReference,
    sourceSequence: input.sequence,
    contractReference,
    nextContractState: input.nextContractState,
    paymentFactKind,
    paymentChainKey,
    idempotencyKey: input.idempotencyKey,
    requestId: requestId(evidenceSequence),
    correlationId: correlationId(evidenceSequence),
    operatorEvidence: { auditEventId: evidence.auditEventId, commandReceiptId: evidence.commandReceiptId },
    correctsPaymentFactId
  };
}

function checkpointReason(checkpointId: string): string {
  const encoded = checkpointId.replace(/[0-9-]/g, (char) => {
    if (char === "-") return "z";
    return String.fromCharCode("a".charCodeAt(0) + Number(char));
  });
  return `p4c.checkpoint.${encoded}`;
}

function confirmOperatorSummary(checkpointId: string, lifecycleEventId: string): Record<string, unknown> {
  return {
    checkpoint: {
      checkpoint_id_chars: uuidChars(checkpointId),
      phase3_lifecycle_event_id_chars: uuidChars(lifecycleEventId),
      required_effect: "lifecycle.suspend"
    }
  };
}

function reconcileOperatorSummary(checkpointId: string, auditEventId: string): Record<string, unknown> {
  return {
    checkpoint: {
      checkpoint_id_chars: uuidChars(checkpointId),
      phase3_lifecycle_audit_event_id_chars: uuidChars(auditEventId),
      required_effect: "lifecycle.suspend"
    }
  };
}

function attemptOperatorSummary(checkpointId: string, attemptOutcome: Phase4RecordLifecycleCheckpointAttemptCommand["attemptOutcome"]): Record<string, unknown> {
  return {
    checkpoint: {
      checkpoint_id_chars: uuidChars(checkpointId),
      attempt_outcome: attemptOutcome,
      required_effect: "lifecycle.suspend"
    }
  };
}
function makeConfirmCommand(input: {
  orgId: string;
  projectId: string | null;
  checkpointId: string;
  phase3LifecycleEventId: string;
  sequence: number;
  idempotencyKey: string;
  afterSummary?: unknown;
}): Phase4ConfirmLifecycleCheckpointCommand {
  const evidence = createOperatorEvidence(input.orgId, input.projectId, input.sequence, {
    action: "p4c.lifecycle.checkpoint.confirm",
    afterSummary: input.afterSummary ?? confirmOperatorSummary(input.checkpointId, input.phase3LifecycleEventId)
  });
  return {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: input.orgId,
    projectId: input.projectId,
    checkpointId: input.checkpointId,
    phase3LifecycleEventId: input.phase3LifecycleEventId,
    idempotencyKey: input.idempotencyKey,
    requestId: requestId(input.sequence),
    correlationId: correlationId(input.sequence),
    operatorEvidence: { auditEventId: evidence.auditEventId, commandReceiptId: evidence.commandReceiptId }
  };
}

function makeReconcileCommand(input: {
  orgId: string;
  projectId: string | null;
  checkpointId: string;
  phase3LifecycleAuditEventId: string;
  sequence: number;
  idempotencyKey: string;
  afterSummary?: unknown;
}): Phase4ReconcileLifecycleCheckpointCommand {
  const evidence = createOperatorEvidence(input.orgId, input.projectId, input.sequence, {
    action: "p4c.lifecycle.checkpoint.reconcile",
    afterSummary: input.afterSummary ?? reconcileOperatorSummary(input.checkpointId, input.phase3LifecycleAuditEventId)
  });
  return {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: input.orgId,
    projectId: input.projectId,
    checkpointId: input.checkpointId,
    phase3LifecycleAuditEventId: input.phase3LifecycleAuditEventId,
    idempotencyKey: input.idempotencyKey,
    requestId: requestId(input.sequence),
    correlationId: correlationId(input.sequence),
    operatorEvidence: { auditEventId: evidence.auditEventId, commandReceiptId: evidence.commandReceiptId }
  };
}
function makeAttemptCommand(input: {
  orgId: string;
  projectId: string | null;
  checkpointId: string;
  attemptOutcome: Phase4RecordLifecycleCheckpointAttemptCommand["attemptOutcome"];
  sequence: number;
  idempotencyKey: string;
  afterSummary?: unknown;
}): Phase4RecordLifecycleCheckpointAttemptCommand {
  const evidence = createOperatorEvidence(input.orgId, input.projectId, input.sequence, {
    action: "p4c.lifecycle.checkpoint.attempt",
    afterSummary: input.afterSummary ?? attemptOperatorSummary(input.checkpointId, input.attemptOutcome)
  });
  return {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: input.orgId,
    projectId: input.projectId,
    checkpointId: input.checkpointId,
    attemptOutcome: input.attemptOutcome,
    idempotencyKey: input.idempotencyKey,
    requestId: requestId(input.sequence),
    correlationId: correlationId(input.sequence),
    operatorEvidence: { auditEventId: evidence.auditEventId, commandReceiptId: evidence.commandReceiptId }
  };
}
async function execute(command: Phase4ProviderNeutralBillingCommand): Promise<Phase4CustomerSafeContractResult> {
  return p4c.executePhase4ContractBillingCommand(rpcClient, command);
}

const rpcResultKeys = [
  "schema_version",
  "outcome",
  "stable_reason",
  "customer_access_allowed",
  "reason_code",
  "effective_from",
  "effective_until",
  "capabilities",
  "limits"
];

function normalizeProcessResult(rows: unknown[]): Phase4CustomerSafeContractResult {
  assert.equal(rows.length, 1, "RPC process result must contain exactly one row.");
  const row = rows[0];
  assert.equal(row !== null && typeof row === "object" && !Array.isArray(row), true, "RPC process row must be an object.");
  const record = row as Record<string, unknown>;
  assert.deepEqual(Object.keys(record).sort(), [...rpcResultKeys].sort(), "RPC process row keys must be exact.");
  assert.equal(record.schema_version, p4c.phase4ContractBillingIntegrationSchemaVersion);
  assert.equal(typeof record.outcome, "string");
  assert.equal(typeof record.stable_reason, "string");
  assert.equal(typeof record.customer_access_allowed, "boolean");
  assert.equal(typeof record.reason_code, "string");
  const result: Phase4CustomerSafeContractResult = {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    outcome: record.outcome as Phase4CustomerSafeContractResult["outcome"],
    stableReason: record.stable_reason as Phase4CustomerSafeContractResult["stableReason"],
    customerAccessAllowed: record.customer_access_allowed as boolean,
    reasonCode: record.reason_code as Phase4CustomerSafeContractResult["reasonCode"],
    effectiveFrom: record.effective_from === null ? null : String(record.effective_from),
    effectiveUntil: record.effective_until === null ? null : String(record.effective_until),
    capabilities: record.capabilities as Record<string, boolean>,
    limits: record.limits as Record<string, number>
  };
  p4c.assertCustomerSafeContractResult(result);
  return result;
}
function countValue(sql: string): number {
  return Number(queryValue(sql));
}

function domainCounts(orgId: string, contractReference = "contract.p4c"): Record<string, number> {
  return queryJson<Record<string, number>>(`
select jsonb_build_object(
  'commandReceipts', (select count(*) from recora_private.p4_command_receipts where organization_id = ${sqlUuid(orgId)}),
  'billingReceipts', (select count(*) from recora_private.p4_billing_receipts where organization_id = ${sqlUuid(orgId)}),
  'paymentFacts', (select count(*) from recora_private.p4_normalized_payment_facts where organization_id = ${sqlUuid(orgId)}),
  'contractEvents', (select count(*) from recora_private.p4_contract_events where organization_id = ${sqlUuid(orgId)}),
  'snapshots', (select count(*) from recora_private.entitlement_snapshots where organization_id = ${sqlUuid(orgId)}),
  'checkpoints', (select count(*) from recora_private.p4_downstream_checkpoints where organization_id = ${sqlUuid(orgId)}),
  'outbox', (select count(*) from recora_private.p4_durable_outbox where organization_id = ${sqlUuid(orgId)}),
  'projectionVersion', coalesce((select version from recora_private.p4_contract_projections where organization_id = ${sqlUuid(orgId)} and contract_reference = ${sqlText(contractReference)}), 0)
)::text;
`);
}

function assertNoDomainChange(before: Record<string, number>, after: Record<string, number>, keys: string[]): void {
  for (const key of keys) assert.equal(after[key], before[key], `${key} changed unexpectedly`);
}

async function seedActiveContract(
  orgId: string,
  projectId: string,
  baseSequence: number,
  contractReference: string,
  policyId = STRONG_POLICY_ID
): Promise<Phase4CustomerSafeContractResult> {
  const draftResult = await execute(makeCommand({ orgId, projectId, sequence: baseSequence, contractReference, sourceReference: `${contractReference}.receipt.draft`, idempotencyKey: `${contractReference}.draft`, nextContractState: "draft", policyId }));
  assert.equal(draftResult.outcome, "applied");
  assert.equal(draftResult.customerAccessAllowed, draftResult.reasonCode === "ok");
  const pendingResult = await execute(makeCommand({ orgId, projectId, sequence: baseSequence + 1, contractReference, sourceReference: `${contractReference}.receipt.pending`, idempotencyKey: `${contractReference}.pending`, nextContractState: "pending_activation", policyId }));
  assert.equal(pendingResult.outcome, "applied");
  assert.equal(pendingResult.customerAccessAllowed, pendingResult.reasonCode === "ok");
  return execute(makeCommand({ orgId, projectId, sequence: baseSequence + 2, contractReference, sourceReference: `${contractReference}.receipt.activate`, idempotencyKey: `${contractReference}.activate`, nextContractState: "active", paymentFactKind: "payment_succeeded", policyId }));
}

type LifecycleTransitionResult = { lifecycleId: string | null; lifecycleVersion: number | null; outcome: string; failure: string | null };

function currentLifecycle(orgId: string, projectId: string): { id: string; state: string; version: number } {
  return queryJson<{ id: string; state: string; version: number }>(`
select jsonb_build_object('id', id::text, 'state', state::text, 'version', version)::text
from recora_private.data_lifecycle_current
where organization_id = ${sqlUuid(orgId)} and project_id is not distinct from ${sqlUuid(projectId)};
`);
}

function transitionLifecycle(input: { orgId: string; projectId: string; expectedState: string; expectedVersion: number; nextState: string; sequence: number; reason?: string }): LifecycleTransitionResult {
  const request = requestId(input.sequence);
  const correlation = correlationId(input.sequence);
  return queryJson<LifecycleTransitionResult>(`
begin;
set local role service_role;
select jsonb_build_object(
  'lifecycleId', lifecycle_id::text,
  'lifecycleVersion', lifecycle_version,
  'outcome', outcome::text,
  'failure', failure_reason_code
)::text
from public.recora_transition_data_lifecycle(
  ${sqlUuid(OPERATOR_USER)},
  ${sqlUuid(input.orgId)},
  ${sqlUuid(input.projectId)},
  ${sqlText(input.expectedState)},
  ${input.expectedVersion.toString()}::bigint,
  ${sqlText(input.nextState)},
  ${sqlText(input.reason ?? "issue 123 p4c lifecycle evidence")},
  ${sqlUuid(request)},
  ${sqlUuid(correlation)}
);
commit;
`);
}

function lifecycleEventIdForRequest(request: string): string {
  return queryValue(`
select id::text
from recora_private.data_lifecycle_events
where request_id = ${sqlUuid(request)};
`);
}

function operatorAuditEventIdForRequest(request: string): string {
  return queryValue(`
select id::text
from recora_audit.operator_events
where request_id = ${sqlUuid(request)};
`);
}

function latestOpenCheckpointId(orgId: string, projectId: string): string {
  return queryValue(`
select id::text
from recora_private.p4_downstream_checkpoints
where organization_id = ${sqlUuid(orgId)}
  and project_id is not distinct from ${sqlUuid(projectId)}
  and blocks_customer_access
  and superseded_by_checkpoint_id is null
order by created_at desc
limit 1;
`);
}

type CheckpointAttemptState = { checkpointState: string; outboxState: string; attemptCount: number; nextAttemptAt: string | null; exhaustedAt: string | null; checkpointSupersededBy: string | null; outboxSupersededBy: string | null };

function checkpointAttemptState(checkpointId: string): CheckpointAttemptState {
  return queryJson<CheckpointAttemptState>(`
select jsonb_build_object(
  'checkpointState', checkpoint_row.state::text,
  'outboxState', outbox_row.state::text,
  'attemptCount', outbox_row.attempt_count,
  'nextAttemptAt', outbox_row.next_attempt_at,
  'exhaustedAt', outbox_row.exhausted_at,
  'checkpointSupersededBy', checkpoint_row.superseded_by_checkpoint_id::text,
  'outboxSupersededBy', outbox_row.superseded_by_outbox_id::text
)::text
from recora_private.p4_downstream_checkpoints checkpoint_row
join recora_private.p4_durable_outbox outbox_row on outbox_row.checkpoint_id = checkpoint_row.id
where checkpoint_row.id = ${sqlUuid(checkpointId)}
order by outbox_row.created_at desc
limit 1;
`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function expectMalformedRpcRowsRejectedWith(
  executor: (client: { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }, value: unknown) => Promise<Phase4CustomerSafeContractResult>,
  command: unknown,
  rows: unknown[],
  label: string
): Promise<void> {
  await assert.rejects(
    () => executor({ async rpc() { return { data: rows, error: null }; } }, command),
    /P4-C .*RPC|P4-C RPC/,
    label
  );
}

async function expectMalformedRpcRowsRejected(command: Phase4ProviderNeutralBillingCommand, rows: unknown[], label: string): Promise<void> {
  await expectMalformedRpcRowsRejectedWith(p4c.executePhase4ContractBillingCommand, command, rows, label);
}

async function main(): Promise<void> {
  runSupabase("issue-123 isolated db reset", ["db", "reset", "--local", "--yes"]);
  queryLocal(setupSql());

  queryLocal(`
do $verify$
begin
  if to_regprocedure('public.recora_p4c_apply_contract_billing_entitlement_command(uuid,uuid,recora_private.p4_source_kind,text,text,bigint,text,recora_private.p4_contract_state,recora_private.p4_payment_fact_kind,text,text,uuid,uuid,uuid,uuid,uuid)') is null then
    raise exception 'Issue 123 P4-C RPC is missing';
  end if;
  if to_regprocedure('public.recora_p4c_confirm_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)') is null then
    raise exception 'Issue 123 P4-C confirm RPC is missing';
  end if;
  if to_regprocedure('public.recora_p4c_reconcile_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)') is null then
    raise exception 'Issue 123 P4-C reconcile RPC is missing';
  end if;
  if to_regprocedure('public.recora_p4c_record_lifecycle_checkpoint_attempt_command(uuid,uuid,uuid,text,text,uuid,uuid,uuid,uuid)') is null then
    raise exception 'Issue 123 P4-C attempt RPC is missing';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'recora_p4c_apply_contract_billing_entitlement_command'
      and p.prosecdef is true and p.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Issue 123 P4-C RPC is not hardened';
  end if;
  if has_function_privilege('anon', 'public.recora_p4c_apply_contract_billing_entitlement_command(uuid,uuid,recora_private.p4_source_kind,text,text,bigint,text,recora_private.p4_contract_state,recora_private.p4_payment_fact_kind,text,text,uuid,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_p4c_apply_contract_billing_entitlement_command(uuid,uuid,recora_private.p4_source_kind,text,text,bigint,text,recora_private.p4_contract_state,recora_private.p4_payment_fact_kind,text,text,uuid,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_p4c_confirm_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_p4c_confirm_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_p4c_reconcile_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_p4c_reconcile_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.recora_p4c_record_lifecycle_checkpoint_attempt_command(uuid,uuid,uuid,text,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.recora_p4c_record_lifecycle_checkpoint_attempt_command(uuid,uuid,uuid,text,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
  then
    raise exception 'Issue 123 P4-C RPC is executable by a browser role';
  end if;
  if not has_function_privilege('service_role', 'public.recora_p4c_apply_contract_billing_entitlement_command(uuid,uuid,recora_private.p4_source_kind,text,text,bigint,text,recora_private.p4_contract_state,recora_private.p4_payment_fact_kind,text,text,uuid,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_p4c_confirm_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_p4c_reconcile_lifecycle_checkpoint_command(uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.recora_p4c_record_lifecycle_checkpoint_attempt_command(uuid,uuid,uuid,text,text,uuid,uuid,uuid,uuid)', 'EXECUTE') then
    raise exception 'Issue 123 P4-C service_role grant missing';
  end if;
  if has_function_privilege('anon', 'recora_private.p4c_payload_fingerprint(jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'recora_private.p4c_payload_fingerprint(jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'recora_private.p4c_customer_safe_contract_result(uuid,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'recora_private.p4c_customer_safe_contract_result(uuid,uuid)', 'EXECUTE') then
    raise exception 'Issue 123 P4-C helper is executable by a browser role';
  end if;
end;
$verify$;
`);

  queryLocal(`
begin;
set local role anon;
select * from public.recora_p4c_apply_contract_billing_entitlement_command(${sqlUuid(ORG_A)},${sqlUuid(PROJECT_A)},'provider_fixture'::recora_private.p4_source_kind,'fixture.p4c','receipt.denied',1,'contract.denied','draft'::recora_private.p4_contract_state,'payment_unknown'::recora_private.p4_payment_fact_kind,'chain.denied','p4c.denied',${sqlUuid(requestId(1))},${sqlUuid(correlationId(1))},${sqlUuid(OPERATOR_ID)},${sqlUuid(OPERATOR_ID)},null);
rollback;
`, /permission denied/i);
  queryLocal(`
begin;
set local role authenticated;
select * from public.recora_p4c_apply_contract_billing_entitlement_command(${sqlUuid(ORG_A)},${sqlUuid(PROJECT_A)},'provider_fixture'::recora_private.p4_source_kind,'fixture.p4c','receipt.denied.auth',2,'contract.denied','draft'::recora_private.p4_contract_state,'payment_unknown'::recora_private.p4_payment_fact_kind,'chain.denied','p4c.denied.auth',${sqlUuid(requestId(2))},${sqlUuid(correlationId(2))},${sqlUuid(OPERATOR_ID)},${sqlUuid(OPERATOR_ID)},null);
rollback;
`, /permission denied/i);
  const draft = makeCommand({ sequence: 101, sourceReference: "receipt.draft", idempotencyKey: "p4c.draft", nextContractState: "draft" });
  const pending = makeCommand({ sequence: 102, sourceReference: "receipt.pending", idempotencyKey: "p4c.pending", nextContractState: "pending_activation" });
  const active = makeCommand({ sequence: 103, sourceReference: "receipt.activate", idempotencyKey: "p4c.activate", nextContractState: "active", paymentFactKind: "payment_succeeded" });

  for (const forbiddenKey of ["capabilities", "limits", "resolvedDocument", "blocksCustomerAccess", "currentContractState", "latestSourceSequence", "existingReceipt", "authoritativePlanPolicyKey", "payloadFingerprint", "downstreamEffectResult"]) {
    assert.equal(p4c.isProviderNeutralBillingEnvelope({ ...active, [forbiddenKey]: forbiddenKey === "downstreamEffectResult" ? "completed" : {} }), false, `${forbiddenKey} must not be provider fixture authority`);
  }
  assert.deepEqual(p4c.createCanonicalPhase4ContractBillingPayload(active), {
    schemaVersion: 1,
    organizationId: ORG_A,
    projectId: PROJECT_A,
    sourceKind: "provider_fixture",
    sourceNamespace: "fixture.p4c",
    sourceReference: "receipt.activate",
    sourceSequence: 103,
    contractReference: "contract.p4c",
    nextContractState: "active",
    paymentFactKind: "payment_succeeded",
    paymentChainKey: "chain.primary",
    correctsPaymentFactId: null
  });
  assert.equal(p4c.planPhase4ContractBillingEffects(active).customerSafeResult.customerAccessAllowed, false);

  const goodRpcRow = {
    schema_version: 1,
    outcome: "applied",
    stable_reason: "ok",
    customer_access_allowed: true,
    reason_code: "ok",
    effective_from: null,
    effective_until: null,
    capabilities: { measurement: true },
    limits: { prompts: 1 }
  };
  const confirmShapeCommand: Phase4ConfirmLifecycleCheckpointCommand = {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: ORG_A,
    projectId: PROJECT_A,
    checkpointId: "12370000-0000-4000-8000-000000000001",
    phase3LifecycleEventId: "12370000-0000-4000-8000-000000000002",
    idempotencyKey: "p4c.confirm.shape",
    requestId: requestId(81),
    correlationId: correlationId(81),
    operatorEvidence: { auditEventId: OPERATOR_ID, commandReceiptId: OPERATOR_ID }
  };
  const reconcileShapeCommand: Phase4ReconcileLifecycleCheckpointCommand = {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: ORG_A,
    projectId: PROJECT_A,
    checkpointId: "12370000-0000-4000-8000-000000000003",
    phase3LifecycleAuditEventId: "12370000-0000-4000-8000-000000000004",
    idempotencyKey: "p4c.reconcile.shape",
    requestId: requestId(82),
    correlationId: correlationId(82),
    operatorEvidence: { auditEventId: OPERATOR_ID, commandReceiptId: OPERATOR_ID }
  };
  const attemptShapeCommand: Phase4RecordLifecycleCheckpointAttemptCommand = {
    schemaVersion: p4c.phase4ContractBillingIntegrationSchemaVersion,
    organizationId: ORG_A,
    projectId: PROJECT_A,
    checkpointId: "12370000-0000-4000-8000-000000000005",
    attemptOutcome: "failed_retryable",
    idempotencyKey: "p4c.attempt.shape",
    requestId: requestId(83),
    correlationId: correlationId(83),
    operatorEvidence: { auditEventId: OPERATOR_ID, commandReceiptId: OPERATOR_ID }
  };
  const accessorRow = { ...goodRpcRow };
  Object.defineProperty(accessorRow, "outcome", { enumerable: true, get() { return "applied"; } });
  const proxyRow = new Proxy(goodRpcRow, { ownKeys() { throw new Error("proxy trap"); } });
  const malformedRowCases: Array<[unknown[], string]> = [
    [[], "empty RPC result must fail closed"],
    [[goodRpcRow, goodRpcRow], "extra RPC row must fail closed"],
    [[{ ...goodRpcRow, extra_key: true }], "extra RPC key must fail closed"],
    [[{ ...goodRpcRow, customer_access_allowed: "false" }], "string false must fail closed"],
    [[accessorRow], "accessor RPC row must fail closed"],
    [[proxyRow], "Proxy RPC row must fail closed"],
    [[{ ...goodRpcRow, outcome: "accepted" }], "unknown outcome must fail closed"],
    [[{ ...goodRpcRow, stable_reason: "unknown_reason" }], "unknown stable reason must fail closed"],
    [[{ ...goodRpcRow, reason_code: "unknown_reason" }], "unknown customer reason must fail closed"],
    [[{ ...goodRpcRow, capabilities: { provider: true } }], "forbidden capability key must fail closed"]
  ];
  const malformedBoundaries: Array<[string, (client: { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }, value: unknown) => Promise<Phase4CustomerSafeContractResult>, unknown]> = [
    ["apply", p4c.executePhase4ContractBillingCommand, active],
    ["confirm", p4c.executePhase4ConfirmLifecycleCheckpointCommand, confirmShapeCommand],
    ["reconcile", p4c.executePhase4ReconcileLifecycleCheckpointCommand, reconcileShapeCommand],
    ["attempt", p4c.executePhase4RecordLifecycleCheckpointAttemptCommand, attemptShapeCommand]
  ];
  for (const [boundary, executor, command] of malformedBoundaries) {
    for (const [rows, label] of malformedRowCases) {
      await expectMalformedRpcRowsRejectedWith(executor, command, rows, `${boundary}: ${label}`);
    }
  }

  assert.equal((await execute(draft)).customerAccessAllowed, false);
  assert.equal((await execute(pending)).customerAccessAllowed, false);
  const activated = await execute(active);
  assert.equal(activated.outcome, "applied");
  assert.equal(activated.customerAccessAllowed, true);
  assert.deepEqual(activated.capabilities, { analysis: true, measurement: true });
  assert.deepEqual(activated.limits, { prompts: 12 });

  const replay = await execute(active);
  assert.equal(replay.outcome, "replayed");
  assert.equal(replay.customerAccessAllowed, true);

  const snapshotEvidence = queryJson<{ document: { capabilities: Record<string, boolean>; limits: Record<string, number> }; pointer_count: number }>(`
select jsonb_build_object(
  'document', snapshot_row.resolved_document,
  'pointer_count', (select count(*) from recora_private.current_entitlement_snapshots pointer where pointer.organization_id = ${sqlUuid(ORG_A)} and pointer.project_id = ${sqlUuid(PROJECT_A)})
)::text
from recora_private.entitlement_snapshots snapshot_row
join recora_private.current_entitlement_snapshots pointer on pointer.snapshot_id = snapshot_row.id
where pointer.organization_id = ${sqlUuid(ORG_A)} and pointer.project_id = ${sqlUuid(PROJECT_A)};
`);
  assert.deepEqual(snapshotEvidence.document, { capabilities: { analysis: true, measurement: true }, limits: { prompts: 12 } });
  assert.equal(snapshotEvidence.pointer_count, 1);

  const wrongTenantBefore = domainCounts(ORG_A);
  const wrongTenant = { ...makeCommand({ sequence: 110, sourceReference: "receipt.wrongtenant", idempotencyKey: "p4c.wrongtenant", nextContractState: "paused", paymentFactKind: "payment_failed" }), projectId: PROJECT_B };
  const wrongTenantResult = await execute(wrongTenant);
  assert.equal(wrongTenantResult.outcome, "rejected");
  assert.equal(wrongTenantResult.reasonCode, "invalid_scope");
  assertNoDomainChange(wrongTenantBefore, domainCounts(ORG_A), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox"]);

  const staleBefore = domainCounts(ORG_A);
  const stale = makeCommand({ sequence: 102, requestSequence: 112, sourceReference: "receipt.stale", idempotencyKey: "p4c.stale", nextContractState: "paused", paymentFactKind: "payment_failed" });
  const staleResult = await execute(stale);
  const staleRetry = await execute(stale);
  assert.equal(staleResult.outcome, "rejected");
  assert.equal(staleResult.stableReason, "ordering_conflict");
  assert.equal(staleRetry.outcome, "rejected");
  assert.equal(staleRetry.stableReason, "ordering_conflict");
  assertNoDomainChange(staleBefore, domainCounts(ORG_A), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);

  const invalidTransitionBefore = domainCounts(ORG_A);
  const invalidTransition = makeCommand({ sequence: 113, sourceReference: "receipt.invalid.transition", idempotencyKey: "p4c.invalid.transition", nextContractState: "draft", paymentFactKind: "payment_unknown" });
  const invalidTransitionResult = await execute(invalidTransition);
  const invalidTransitionRetry = await execute(invalidTransition);
  assert.equal(invalidTransitionResult.outcome, "rejected");
  assert.equal(invalidTransitionResult.stableReason, "reconciliation_required");
  assert.equal(invalidTransitionRetry.outcome, "rejected");
  assert.equal(invalidTransitionRetry.stableReason, "reconciliation_required");
  assertNoDomainChange(invalidTransitionBefore, domainCounts(ORG_A), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);

  const invalidPolicyBefore = domainCounts(ORG_A);
  const invalidPolicy = makeCommand({ sequence: 114, sourceReference: "receipt.invalid.policy", idempotencyKey: "p4c.invalid.policy", nextContractState: "paused", paymentFactKind: "payment_failed", afterSummary: { policy: { key: POLICY_KEY, hash_chars: "0".repeat(64).split(""), schema_version: 1 } } });
  const invalidPolicyResult = await execute(invalidPolicy);
  assert.equal(invalidPolicyResult.outcome, "rejected");
  assert.equal(invalidPolicyResult.stableReason, "invalid_reference");
  assertNoDomainChange(invalidPolicyBefore, domainCounts(ORG_A), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);

  const activePaymentFactId = queryValue(`
select id::text
from recora_private.p4_normalized_payment_facts
where organization_id = ${sqlUuid(ORG_A)}
  and project_id is not distinct from ${sqlUuid(PROJECT_A)}
  and source_reference = 'receipt.activate'
  and fact_kind = 'payment_succeeded';
`);
  for (const correctionNegative of [
    makeCommand({ sequence: 117, sourceReference: "receipt.reversed.missing", idempotencyKey: "p4c.reversed.missing", nextContractState: "paused", paymentFactKind: "payment_reversed" }),
    makeCommand({ sequence: 118, sourceReference: "receipt.disputed.missing", idempotencyKey: "p4c.disputed.missing", nextContractState: "paused", paymentFactKind: "payment_disputed" }),
    makeCommand({ sequence: 119, sourceReference: "receipt.normal.corrects", idempotencyKey: "p4c.normal.corrects", nextContractState: "paused", paymentFactKind: "payment_failed", correctsPaymentFactId: activePaymentFactId })
  ]) {
    const correctionNegativeResult = await execute(correctionNegative);
    assert.equal(correctionNegativeResult.outcome, "rejected");
    assert.equal(correctionNegativeResult.stableReason, "invalid_reference");
  }

  const conflictBefore = domainCounts(ORG_A);
  const duplicateSource = makeCommand({ sequence: 103, requestSequence: 115, sourceReference: "receipt.activate", idempotencyKey: "p4c.activate.other", nextContractState: "active", paymentFactKind: "payment_succeeded" });
  const duplicateSourceResult = await execute(duplicateSource);
  assert.equal(duplicateSourceResult.outcome, "rejected");
  assert.equal(duplicateSourceResult.stableReason, "idempotency_conflict");

  const conflictingCanonical = makeCommand({ sequence: 104, requestSequence: 116, sourceReference: "receipt.activate.conflict", idempotencyKey: "p4c.activate", nextContractState: "paused", paymentFactKind: "payment_failed" });
  const conflictResult = await execute(conflictingCanonical);
  assert.equal(conflictResult.outcome, "rejected");
  assert.equal(conflictResult.stableReason, "idempotency_conflict");
  assert.equal(conflictResult.customerAccessAllowed, false);
  assert.equal(countValue(`select count(*) from recora_private.p4_command_conflicts where organization_id = ${sqlUuid(ORG_A)}`), 2);
  assertNoDomainChange(conflictBefore, domainCounts(ORG_A), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);

  const concurrentDraft = makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 301, contractReference: "contract.concurrent", sourceReference: "receipt.concurrent.draft", idempotencyKey: "p4c.concurrent.draft", nextContractState: "draft" });
  const identicalRows = await Promise.all([callP4cRpcProcess(concurrentDraft), callP4cRpcProcess(concurrentDraft)]);
  const identicalResults = identicalRows.map(normalizeProcessResult);
  assert.deepEqual(identicalResults.map((result) => result.outcome).sort(), ["applied", "replayed"]);
  assert.equal(countValue(`select count(*) from recora_private.p4_billing_receipts where organization_id = ${sqlUuid(ORG_B)} and contract_id = (select id from recora_private.p4_contract_projections where organization_id = ${sqlUuid(ORG_B)} and contract_reference = 'contract.concurrent')`), 1);

  const concurrentA = makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 302, contractReference: "contract.concurrent", sourceReference: "receipt.concurrent.pending", idempotencyKey: "p4c.concurrent.conflict", nextContractState: "pending_activation" });
  const concurrentB = makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 302, requestSequence: 303, contractReference: "contract.concurrent", sourceReference: "receipt.concurrent.cancel", idempotencyKey: "p4c.concurrent.conflict", nextContractState: "canceled" });
  const conflictRows = await Promise.all([callP4cRpcProcess(concurrentA), callP4cRpcProcess(concurrentB)]);
  const conflictResults = conflictRows.map(normalizeProcessResult);
  assert.equal(conflictResults.filter((result) => result.outcome === "rejected" && result.stableReason === "idempotency_conflict").length, 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_command_conflicts where organization_id = ${sqlUuid(ORG_B)}`), 1);

  const supersededPolicy = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 330, contractReference: "contract.superseded", sourceReference: "receipt.superseded.policy", idempotencyKey: "p4c.superseded.policy", nextContractState: "draft", policyId: WEAK_POLICY_ID }));
  assert.equal(supersededPolicy.outcome, "rejected");
  assert.equal(supersededPolicy.stableReason, "invalid_reference");
  const futurePolicy = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 331, contractReference: "contract.future", sourceReference: "receipt.future.policy", idempotencyKey: "p4c.future.policy", nextContractState: "draft", policyId: FUTURE_POLICY_ID }));
  assert.equal(futurePolicy.outcome, "rejected");
  assert.equal(futurePolicy.stableReason, "invalid_reference");
  const expiredPolicy = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 332, contractReference: "contract.expired", sourceReference: "receipt.expired.policy", idempotencyKey: "p4c.expired.policy", nextContractState: "draft", policyId: EXPIRED_POLICY_ID }));
  assert.equal(expiredPolicy.outcome, "rejected");
  assert.equal(expiredPolicy.stableReason, "invalid_reference");
  const transitiveRootPolicy = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 333, contractReference: "contract.transitive.root", sourceReference: "receipt.transitive.root.policy", idempotencyKey: "p4c.transitive.root.policy", nextContractState: "draft", policyId: TRANSITIVE_POLICY_ROOT_ID }));
  assert.equal(transitiveRootPolicy.outcome, "rejected");
  assert.equal(transitiveRootPolicy.stableReason, "invalid_reference");
  const transitiveHeadPolicy = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 334, contractReference: "contract.transitive.head", sourceReference: "receipt.transitive.head.policy", idempotencyKey: "p4c.transitive.head.policy", nextContractState: "draft", policyId: TRANSITIVE_POLICY_HEAD_ID }));
  assert.equal(transitiveHeadPolicy.outcome, "applied");
  const transitiveHeadPending = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 335, contractReference: "contract.transitive.head", sourceReference: "receipt.transitive.head.pending", idempotencyKey: "p4c.transitive.head.pending", nextContractState: "pending_activation", policyId: TRANSITIVE_POLICY_HEAD_ID }));
  assert.equal(transitiveHeadPending.outcome, "applied");
  const transitiveHeadActivation = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 336, contractReference: "contract.transitive.head", sourceReference: "receipt.transitive.head.activate", idempotencyKey: "p4c.transitive.head.activate", nextContractState: "active", paymentFactKind: "payment_succeeded", policyId: TRANSITIVE_POLICY_HEAD_ID }));
  assert.equal(transitiveHeadActivation.outcome, "applied");
  assert.equal(transitiveHeadActivation.customerAccessAllowed, true);
  assert.deepEqual(transitiveHeadActivation.limits, { prompts: 24 });
  assert.equal(p4c.isProviderNeutralBillingEnvelope({ ...makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 337, contractReference: "contract.rejected.caller.policy", sourceReference: "receipt.rejected.caller.policy", idempotencyKey: "p4c.rejected.caller.policy", nextContractState: "draft", policyId: WEAK_POLICY_ID }), authoritativePlanPolicyKey: POLICY_KEY }), false);

  await seedActiveContract(ORG_B, PROJECT_B, 340, "contract.compensate");
  const compensationPause = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 343, contractReference: "contract.compensate", sourceReference: "receipt.comp.pause", idempotencyKey: "p4c.comp.pause", nextContractState: "paused", paymentFactKind: "payment_failed" }));
  assert.equal(compensationPause.outcome, "reconciliation_required");
  assert.equal(compensationPause.stableReason, "checkpoint_pending");
  const compensationCheckpointId = latestOpenCheckpointId(ORG_B, PROJECT_B);
  assert.equal(queryValue(`select processing_state::text from recora_private.p4_billing_receipts where organization_id = ${sqlUuid(ORG_B)} and source_reference = 'receipt.comp.pause';`), "applied");
  const compensationRecover = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 344, contractReference: "contract.compensate", sourceReference: "receipt.comp.recover", idempotencyKey: "p4c.comp.recover", nextContractState: "active", paymentFactKind: "payment_succeeded" }));
  assert.equal(compensationRecover.outcome, "applied");
  assert.equal(compensationRecover.customerAccessAllowed, true);
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where id = ${sqlUuid(compensationCheckpointId)} and superseded_by_checkpoint_id is not null`), 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where correction_of_checkpoint_id = ${sqlUuid(compensationCheckpointId)} and state = 'completed'`), 1);
  await seedActiveContract(ORG_B, PROJECT_B, 500, "contract.attempt");
  const attemptPause = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 503, contractReference: "contract.attempt", sourceReference: "receipt.attempt.pause", idempotencyKey: "p4c.attempt.pause", nextContractState: "paused", paymentFactKind: "payment_failed" }));
  assert.equal(attemptPause.outcome, "reconciliation_required");
  assert.equal(attemptPause.stableReason, "checkpoint_pending");
  const attemptCheckpointId = latestOpenCheckpointId(ORG_B, PROJECT_B);
  const beforeAttemptMutation = domainCounts(ORG_B, "contract.attempt");
  const failAttempt = makeAttemptCommand({ orgId: ORG_B, projectId: PROJECT_B, checkpointId: attemptCheckpointId, attemptOutcome: "failed_retryable", sequence: 510, idempotencyKey: "p4c.attempt.fail.one" });
  const concurrentFailRows = await Promise.all([callAttemptRpcProcess(failAttempt), callAttemptRpcProcess(failAttempt)]);
  const concurrentFailResults = concurrentFailRows.map(normalizeProcessResult);
  assert.deepEqual(concurrentFailResults.map((result) => result.outcome).sort(), ["reconciliation_required", "replayed"].sort());
  assert.equal(concurrentFailResults.filter((result) => result.stableReason === "checkpoint_failed").length, 1);
  assert.equal(concurrentFailResults.filter((result) => result.stableReason === "duplicate_command").length, 1);  const tooSoonRetry = makeAttemptCommand({ orgId: ORG_B, projectId: PROJECT_B, checkpointId: attemptCheckpointId, attemptOutcome: "retry_pending", sequence: 511, idempotencyKey: "p4c.attempt.retry.too-soon" });
  const tooSoonRetryResult = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, tooSoonRetry);
  assert.equal(tooSoonRetryResult.outcome, "rejected");
  assert.equal(tooSoonRetryResult.stableReason, "invalid_reference");
  assert.equal(countValue(`select count(*) from recora_private.p4_command_receipts where organization_id = ${sqlUuid(ORG_B)} and idempotency_key = 'p4c.attempt.retry.too-soon.checkpoint.attempt';`), 0);
  let attemptState = checkpointAttemptState(attemptCheckpointId);
  assert.equal(attemptState.checkpointState, "failed");
  assert.equal(attemptState.outboxState, "failed");
  assert.equal(attemptState.attemptCount, 1);
  assert.notEqual(attemptState.nextAttemptAt, null);
  assert.equal(attemptState.exhaustedAt, null);
  assertNoDomainChange(beforeAttemptMutation, domainCounts(ORG_B, "contract.attempt"), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);
  const failReplay = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, failAttempt);
  assert.equal(failReplay.outcome, "replayed");
  assert.equal(checkpointAttemptState(attemptCheckpointId).attemptCount, 1);

  const failConflict = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, makeAttemptCommand({ orgId: ORG_B, projectId: PROJECT_B, checkpointId: attemptCheckpointId, attemptOutcome: "exhausted", sequence: 512, idempotencyKey: "p4c.attempt.fail.one" }));
  assert.equal(failConflict.outcome, "rejected");
  assert.equal(failConflict.stableReason, "idempotency_conflict");
  await delay(5200);
  const retryResult = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, tooSoonRetry);
  assert.equal(retryResult.outcome, "reconciliation_required");
  assert.equal(retryResult.stableReason, "checkpoint_pending");
  attemptState = checkpointAttemptState(attemptCheckpointId);
  assert.equal(attemptState.checkpointState, "pending");
  assert.equal(attemptState.outboxState, "pending");
  assert.equal(attemptState.attemptCount, 1);
  assert.equal(attemptState.nextAttemptAt, null);
  const retryReplay = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, tooSoonRetry);
  assert.equal(retryReplay.outcome, "replayed");
  const failAttemptTwo = makeAttemptCommand({ orgId: ORG_B, projectId: PROJECT_B, checkpointId: attemptCheckpointId, attemptOutcome: "failed_retryable", sequence: 513, idempotencyKey: "p4c.attempt.fail.two" });
  const failTwoResult = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, failAttemptTwo);
  assert.equal(failTwoResult.outcome, "reconciliation_required");
  assert.equal(failTwoResult.stableReason, "checkpoint_failed");
  attemptState = checkpointAttemptState(attemptCheckpointId);
  assert.equal(attemptState.checkpointState, "failed");
  assert.equal(attemptState.outboxState, "failed");
  assert.equal(attemptState.attemptCount, 2);
  const exhaustedAttempt = makeAttemptCommand({ orgId: ORG_B, projectId: PROJECT_B, checkpointId: attemptCheckpointId, attemptOutcome: "exhausted", sequence: 514, idempotencyKey: "p4c.attempt.exhausted" });
  const exhaustedResult = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, exhaustedAttempt);
  assert.equal(exhaustedResult.outcome, "reconciliation_required");
  assert.equal(exhaustedResult.stableReason, "reconciliation_required");
  attemptState = checkpointAttemptState(attemptCheckpointId);
  assert.equal(attemptState.checkpointState, "reconciliation_required");
  assert.equal(attemptState.outboxState, "reconciliation_required");
  assert.equal(attemptState.attemptCount, 2);
  assert.notEqual(attemptState.exhaustedAt, null);
  assert.equal(attemptState.nextAttemptAt, null);
  const exhaustedReplay = await p4c.executePhase4RecordLifecycleCheckpointAttemptCommand(rpcClient, exhaustedAttempt);
  assert.equal(exhaustedReplay.outcome, "replayed");
  assertNoDomainChange(beforeAttemptMutation, domainCounts(ORG_B, "contract.attempt"), ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);
  const lifecycleBeforeExhaustedConfirm = currentLifecycle(ORG_B, PROJECT_B);
  const exhaustedSuspend = transitionLifecycle({ orgId: ORG_B, projectId: PROJECT_B, expectedState: lifecycleBeforeExhaustedConfirm.state, expectedVersion: lifecycleBeforeExhaustedConfirm.version, nextState: "access_suspended", sequence: 515, reason: checkpointReason(attemptCheckpointId) });
  assert.equal(exhaustedSuspend.outcome, "success");
  const exhaustedConfirm = makeConfirmCommand({ orgId: ORG_B, projectId: PROJECT_B, checkpointId: attemptCheckpointId, phase3LifecycleEventId: lifecycleEventIdForRequest(requestId(515)), sequence: 516, idempotencyKey: "p4c.confirm.exhausted" });
  const exhaustedConfirmResult = await p4c.executePhase4ConfirmLifecycleCheckpointCommand(rpcClient, exhaustedConfirm);
  assert.equal(exhaustedConfirmResult.outcome, "applied");
  assert.equal(exhaustedConfirmResult.reasonCode, "lifecycle_access_suspended");
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where id = ${sqlUuid(attemptCheckpointId)} and superseded_by_checkpoint_id is not null`), 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where correction_of_checkpoint_id = ${sqlUuid(attemptCheckpointId)} and state = 'completed'`), 1);
  const lifecycleBeforeAttemptRecovery = currentLifecycle(ORG_B, PROJECT_B);
  const attemptLifecycleRecovered = transitionLifecycle({ orgId: ORG_B, projectId: PROJECT_B, expectedState: lifecycleBeforeAttemptRecovery.state, expectedVersion: lifecycleBeforeAttemptRecovery.version, nextState: "active", sequence: 517 });
  assert.equal(attemptLifecycleRecovered.outcome, "success");
  const attemptAccessRecovered = await execute(makeCommand({ orgId: ORG_B, projectId: PROJECT_B, sequence: 518, contractReference: "contract.attempt", sourceReference: "receipt.attempt.recover", idempotencyKey: "p4c.attempt.recover", nextContractState: "active", paymentFactKind: "payment_succeeded" }));
  assert.equal(attemptAccessRecovered.outcome, "applied");
  assert.equal(attemptAccessRecovered.customerAccessAllowed, true);
  assert.equal(attemptAccessRecovered.reasonCode, "ok");

  await seedActiveContract(ORG_C, PROJECT_C, 401, "contract.pending");
  const pendingCheckpoint = makeCommand({ orgId: ORG_C, projectId: PROJECT_C, sequence: 404, contractReference: "contract.pending", sourceReference: "receipt.pending.pause", idempotencyKey: "p4c.pending.pause", nextContractState: "paused", paymentFactKind: "payment_failed" });
  const pendingCheckpointResult = await execute(pendingCheckpoint);
  assert.equal(pendingCheckpointResult.outcome, "reconciliation_required");
  assert.equal(pendingCheckpointResult.stableReason, "checkpoint_pending");
  assert.equal(pendingCheckpointResult.customerAccessAllowed, false);
  assert.equal(pendingCheckpointResult.reasonCode, "checkpoint_pending");
  const pendingCheckpointId = latestOpenCheckpointId(ORG_C, PROJECT_C);
  assert.equal(countValue(`select count(*) from recora_private.p4_durable_outbox where organization_id = ${sqlUuid(ORG_C)} and project_id = ${sqlUuid(PROJECT_C)} and state = 'pending' and correction_of_outbox_id is null`), 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_durable_outbox where organization_id = ${sqlUuid(ORG_C)} and project_id = ${sqlUuid(PROJECT_C)} and state = 'delivered'`), 0);
  assert.equal(queryValue(`select processing_state::text from recora_private.p4_billing_receipts where organization_id = ${sqlUuid(ORG_C)} and project_id is not distinct from ${sqlUuid(PROJECT_C)} and source_reference = 'receipt.pending.pause';`), "applied");

  const lifecycleBeforeSuspend = currentLifecycle(ORG_C, PROJECT_C);
  const suspended = transitionLifecycle({ orgId: ORG_C, projectId: PROJECT_C, expectedState: lifecycleBeforeSuspend.state, expectedVersion: lifecycleBeforeSuspend.version, nextState: "access_suspended", sequence: 450, reason: checkpointReason(pendingCheckpointId) });
  assert.equal(suspended.outcome, "success");
  const suspendEventId = lifecycleEventIdForRequest(requestId(450));
  const confirmCommand = makeConfirmCommand({
    orgId: ORG_C,
    projectId: PROJECT_C,
    checkpointId: pendingCheckpointId,
    phase3LifecycleEventId: suspendEventId,
    sequence: 451,
    idempotencyKey: "p4c.confirm.suspend"
  });
  const confirmResult = await p4c.executePhase4ConfirmLifecycleCheckpointCommand(rpcClient, confirmCommand);
  assert.equal(confirmResult.outcome, "applied");
  assert.equal(confirmResult.customerAccessAllowed, false);
  assert.equal(confirmResult.reasonCode, "lifecycle_access_suspended");
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where id = ${sqlUuid(pendingCheckpointId)} and superseded_by_checkpoint_id is not null`), 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where correction_of_checkpoint_id = ${sqlUuid(pendingCheckpointId)} and state = 'completed'`), 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_durable_outbox where correction_of_outbox_id is not null and organization_id = ${sqlUuid(ORG_C)} and project_id = ${sqlUuid(PROJECT_C)} and state = 'delivered'`), 1);

  const lifecycleBeforeRecovery = currentLifecycle(ORG_C, PROJECT_C);
  const lifecycleRecovered = transitionLifecycle({ orgId: ORG_C, projectId: PROJECT_C, expectedState: lifecycleBeforeRecovery.state, expectedVersion: lifecycleBeforeRecovery.version, nextState: "active", sequence: 452 });
  assert.equal(lifecycleRecovered.outcome, "success");
  const recovery = makeCommand({ orgId: ORG_C, projectId: PROJECT_C, sequence: 405, contractReference: "contract.pending", sourceReference: "receipt.pending.recover", idempotencyKey: "p4c.pending.recover", nextContractState: "active", paymentFactKind: "payment_succeeded" });
  const recoveryResult = await execute(recovery);
  assert.equal(recoveryResult.outcome, "applied");
  assert.equal(recoveryResult.customerAccessAllowed, true);
  assert.equal(recoveryResult.reasonCode, "ok");
  const confirmReplayAfterSupersession = await p4c.executePhase4ConfirmLifecycleCheckpointCommand(rpcClient, confirmCommand);
  assert.equal(confirmReplayAfterSupersession.outcome, "replayed");
  assert.equal(confirmReplayAfterSupersession.stableReason, "duplicate_command");
  assert.equal(confirmReplayAfterSupersession.reasonCode, "ok");
  const lifecycleBeforeConfirmConflict = currentLifecycle(ORG_C, PROJECT_C);
  const secondSuspend = transitionLifecycle({ orgId: ORG_C, projectId: PROJECT_C, expectedState: lifecycleBeforeConfirmConflict.state, expectedVersion: lifecycleBeforeConfirmConflict.version, nextState: "access_suspended", sequence: 453, reason: checkpointReason(pendingCheckpointId) });
  assert.equal(secondSuspend.outcome, "success");
  const confirmConflictCommand = makeConfirmCommand({ orgId: ORG_C, projectId: PROJECT_C, checkpointId: pendingCheckpointId, phase3LifecycleEventId: lifecycleEventIdForRequest(requestId(453)), sequence: 454, idempotencyKey: "p4c.confirm.suspend" });
  const confirmConflict = await p4c.executePhase4ConfirmLifecycleCheckpointCommand(rpcClient, confirmConflictCommand);
  assert.equal(confirmConflict.outcome, "rejected");
  assert.equal(confirmConflict.stableReason, "idempotency_conflict");

  const pauseResult = await execute(makeCommand({ sequence: 105, sourceReference: "receipt.pause.pending", idempotencyKey: "p4c.pause.pending", nextContractState: "paused", paymentFactKind: "payment_failed" }));
  assert.equal(pauseResult.outcome, "reconciliation_required");
  assert.equal(pauseResult.stableReason, "checkpoint_pending");
  const reconcileCheckpointId = latestOpenCheckpointId(ORG_A, PROJECT_A);
  const lifecycleBeforeDenied = currentLifecycle(ORG_A, PROJECT_A);
  const deniedLifecycle = transitionLifecycle({ orgId: ORG_A, projectId: PROJECT_A, expectedState: lifecycleBeforeDenied.state, expectedVersion: lifecycleBeforeDenied.version + 99, nextState: "access_suspended", sequence: 160, reason: checkpointReason(reconcileCheckpointId) });
  assert.equal(deniedLifecycle.outcome, "denied");
  const deniedAuditEventId = operatorAuditEventIdForRequest(requestId(160));
  const reconcileCommand = makeReconcileCommand({
    orgId: ORG_A,
    projectId: PROJECT_A,
    checkpointId: reconcileCheckpointId,
    phase3LifecycleAuditEventId: deniedAuditEventId,
    sequence: 161,
    idempotencyKey: "p4c.reconcile.denied"
  });
  const reconcileResult = await p4c.executePhase4ReconcileLifecycleCheckpointCommand(rpcClient, reconcileCommand);
  assert.equal(reconcileResult.outcome, "reconciliation_required");
  assert.equal(reconcileResult.stableReason, "reconciliation_required");
  assert.equal(reconcileResult.customerAccessAllowed, false);
  assert.equal(reconcileResult.reasonCode, "reconciliation_required");
  const reconcileReplay = await p4c.executePhase4ReconcileLifecycleCheckpointCommand(rpcClient, reconcileCommand);
  assert.equal(reconcileReplay.outcome, "replayed");
  assert.equal(reconcileReplay.stableReason, "duplicate_command");
  const secondDeniedLifecycle = transitionLifecycle({ orgId: ORG_A, projectId: PROJECT_A, expectedState: lifecycleBeforeDenied.state, expectedVersion: lifecycleBeforeDenied.version + 98, nextState: "access_suspended", sequence: 163, reason: checkpointReason(reconcileCheckpointId) });
  assert.equal(secondDeniedLifecycle.outcome, "denied");
  const reconcileConflictCommand = makeReconcileCommand({ orgId: ORG_A, projectId: PROJECT_A, checkpointId: reconcileCheckpointId, phase3LifecycleAuditEventId: operatorAuditEventIdForRequest(requestId(163)), sequence: 164, idempotencyKey: "p4c.reconcile.denied" });
  const reconcileConflict = await p4c.executePhase4ReconcileLifecycleCheckpointCommand(rpcClient, reconcileConflictCommand);
  assert.equal(reconcileConflict.outcome, "rejected");
  assert.equal(reconcileConflict.stableReason, "idempotency_conflict");

  const rollbackBefore = domainCounts(ORG_A);
  const rollbackFailure = makeCommand({ sequence: 171, requestSequence: 162, sourceReference: "receipt.rollback", idempotencyKey: "p4c.rollback", nextContractState: "active", paymentFactKind: "payment_reversed", correctsPaymentFactId: "12399999-0000-4000-8000-000000000999" });
  const rollbackResult = await execute(rollbackFailure);
  assert.equal(rollbackResult.outcome, "rejected");
  assert.equal(rollbackResult.stableReason, "invalid_reference");
  assert.equal(rollbackResult.customerAccessAllowed, false);
  const rollbackAfterFirstFailure = domainCounts(ORG_A);
  assertNoDomainChange(rollbackBefore, rollbackAfterFirstFailure, ["billingReceipts", "paymentFacts", "contractEvents", "snapshots", "checkpoints", "outbox", "projectionVersion"]);
  assert.equal(rollbackAfterFirstFailure.commandReceipts, rollbackBefore.commandReceipts + 1);
  const rollbackRetry = await execute(rollbackFailure);
  assert.equal(rollbackRetry.outcome, "rejected");
  assert.equal(rollbackRetry.stableReason, "invalid_reference");
  assert.deepEqual(domainCounts(ORG_A), rollbackAfterFirstFailure);
  const lifecycleBeforeReconciledConfirm = currentLifecycle(ORG_A, PROJECT_A);
  const reconciledSuspend = transitionLifecycle({ orgId: ORG_A, projectId: PROJECT_A, expectedState: lifecycleBeforeReconciledConfirm.state, expectedVersion: lifecycleBeforeReconciledConfirm.version, nextState: "access_suspended", sequence: 165, reason: checkpointReason(reconcileCheckpointId) });
  assert.equal(reconciledSuspend.outcome, "success");
  const reconciledConfirmCommand = makeConfirmCommand({ orgId: ORG_A, projectId: PROJECT_A, checkpointId: reconcileCheckpointId, phase3LifecycleEventId: lifecycleEventIdForRequest(requestId(165)), sequence: 166, idempotencyKey: "p4c.confirm.reconciled" });
  const reconciledConfirmRows = await Promise.all([callConfirmRpcProcess(reconciledConfirmCommand), callConfirmRpcProcess(reconciledConfirmCommand)]);
  const reconciledConfirmResults = reconciledConfirmRows.map(normalizeProcessResult);
  assert.deepEqual(reconciledConfirmResults.map((result) => result.outcome).sort(), ["applied", "replayed"].sort());
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where id = ${sqlUuid(reconcileCheckpointId)} and superseded_by_checkpoint_id is not null`), 1);
  assert.equal(countValue(`select count(*) from recora_private.p4_downstream_checkpoints where correction_of_checkpoint_id = ${sqlUuid(reconcileCheckpointId)} and state = 'completed'`), 1);
  const reconciledConfirmReplay = await p4c.executePhase4ConfirmLifecycleCheckpointCommand(rpcClient, reconciledConfirmCommand);
  assert.equal(reconciledConfirmReplay.outcome, "replayed");
  assert.equal(reconciledConfirmReplay.stableReason, "duplicate_command");
  const lifecycleBeforeReconciledAccessRecovery = currentLifecycle(ORG_A, PROJECT_A);
  const reconciledLifecycleRecovered = transitionLifecycle({ orgId: ORG_A, projectId: PROJECT_A, expectedState: lifecycleBeforeReconciledAccessRecovery.state, expectedVersion: lifecycleBeforeReconciledAccessRecovery.version, nextState: "active", sequence: 167 });
  assert.equal(reconciledLifecycleRecovered.outcome, "success");
  const reconciledAccessRecovered = await execute(makeCommand({ sequence: 170, sourceReference: "receipt.reconcile.recover", idempotencyKey: "p4c.reconcile.recover", nextContractState: "active", paymentFactKind: "payment_succeeded" }));
  assert.equal(reconciledAccessRecovered.outcome, "applied");
  assert.equal(reconciledAccessRecovered.customerAccessAllowed, true);
  assert.equal(reconciledAccessRecovered.reasonCode, "ok");
  queryLocal(`
do $verify$
begin
  if exists (
    select 1 from recora_private.p4_billing_receipts receipt_row
    left join recora_private.p4_normalized_payment_facts fact_row on fact_row.receipt_id = receipt_row.id
    where receipt_row.organization_id in (${sqlUuid(ORG_A)}, ${sqlUuid(ORG_B)}, ${sqlUuid(ORG_C)})
      and receipt_row.processing_state in ('applied','reconciliation_required')
      and fact_row.id is null
  ) then
    raise exception 'Issue 123 P4-C receipt finished without normalized payment fact';
  end if;
  if exists (
    select 1 from recora_private.p4_contract_projections projection_row
    left join recora_private.p4_contract_events event_row on event_row.command_receipt_id = projection_row.last_command_receipt_id and event_row.next_state = projection_row.state
    where projection_row.organization_id in (${sqlUuid(ORG_A)}, ${sqlUuid(ORG_B)}, ${sqlUuid(ORG_C)})
      and event_row.id is null
  ) then
    raise exception 'Issue 123 P4-C projection pointer lacks matching event';
  end if;
  if exists (
    select 1 from recora_private.p4_downstream_checkpoints checkpoint_row
    where checkpoint_row.organization_id in (${sqlUuid(ORG_A)}, ${sqlUuid(ORG_B)}, ${sqlUuid(ORG_C)})
      and checkpoint_row.blocks_customer_access is not true
  ) then
    raise exception 'Issue 123 P4-C checkpoint block flag was fixture-controlled or unset';
  end if;
end;
$verify$;
`);

  console.log("Issue #123 P4-C RPC verifier passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
