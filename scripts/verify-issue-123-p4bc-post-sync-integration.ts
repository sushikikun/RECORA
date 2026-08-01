import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type Result = { stdout: string; stderr: string; status: number | null };
type Stack = { label: string; workdir: string; container: string };

const root = process.cwd();
const supabase = path.join(root, "node_modules", "supabase", "dist", "supabase.js");
const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const base = process.env.RECORA_PHASE4_BASE_REF ?? "origin/master";
const p4b = "20260731203135_p4b_account_invitation_membership_rpcs.sql";
const p4c = "20260731210957_p4c_contract_billing_entitlement_rpc.sql";
const p4bPath = path.join(root, "supabase", "migrations", p4b);
const p4cPath = path.join(root, "supabase", "migrations", p4c);
const allowed = new Set([
  "docs/exec-plans/active/issue-123-p4c-contract-billing-entitlement.md",
  "lib/recora/phase4-contract-billing-entitlement.ts",
  "scripts/verify-issue-123-p4bc-post-sync-integration.ts",
  "scripts/verify-issue-123-p4c-contract-billing-entitlement.ts",
  "supabase/migrations/20260731210957_p4c_contract_billing_entitlement_rpc.sql",
]);

for (const file of [supabase, tsx, p4bPath, p4cPath]) assert.ok(fs.existsSync(file), `Missing required file: ${file}`);
assert.ok(p4b < p4c, "P4-B migration must sort before P4-C.");
const p4bSql = fs.readFileSync(p4bPath, "utf8");
const p4cSql = fs.readFileSync(p4cPath, "utf8");
assert.match(p4bSql, /add value if not exists 'customer_session'/i);
assert.match(p4bSql, /customer_auth_user_id uuid references auth\.users\(id\) on delete restrict/i);
assert.match(p4bSql, /p4_command_receipt_actor_shape/i);
assert.match(p4cSql, /public\.recora_p4c_apply_contract_billing_entitlement_command/i);
assert.doesNotMatch(p4cSql, /create\s+(table|type|schema)|alter\s+table|create\s+policy|alter\s+policy/i);

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
function stack(label: string, workdirKey: string, containerKey: string, expected: string): Stack {
  const workdir = env(workdirKey);
  const container = env(containerKey);
  assert.ok(path.isAbsolute(workdir) && /(?:^|[\\/])tmp(?:[\\/]|$)/i.test(workdir), `${workdirKey} must be an absolute temporary path.`);
  assert.equal(container, expected, `${containerKey} must equal ${expected}.`);
  assert.ok(fs.existsSync(path.join(workdir, "supabase", "config.toml")), `${label} config is missing.`);
  return { label, workdir, container };
}
const i123 = stack("Issue #123", "RECORA_ISSUE_123_SUPABASE_WORKDIR", "RECORA_ISSUE_123_DB_CONTAINER", "supabase_db_recoraissue123");
const i122 = stack("Issue #122", "RECORA_ISSUE_122_SUPABASE_WORKDIR", "RECORA_ISSUE_122_DB_CONTAINER", "supabase_db_recoraissue122p4b");
const i121 = stack("Issue #121", "RECORA_ISSUE_121_SUPABASE_WORKDIR", "RECORA_ISSUE_121_DB_CONTAINER", "supabase_db_recoraissue121");
const i117 = stack("Issue #117", "RECORA_ISSUE_117_SUPABASE_WORKDIR", "RECORA_ISSUE_117_DB_CONTAINER", "supabase_db_recoraissue117");

function clean(text: string): string {
  return text.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]").replace(/(?:service_role|anon)_key\s*[:=]\s*[^\s]+/gi, "[redacted-key]");
}
function run(command: string, args: string[], options: { input?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}): Result {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...options.env },
    input: options.input,
    maxBuffer: 96 * 1024 * 1024,
    timeout: options.timeout ?? 300_000,
  });
  if (result.error) throw result.error;
  return { stdout: `${result.stdout ?? ""}`, stderr: `${result.stderr ?? ""}`, status: result.status };
}
function pass(name: string, result: Result): string {
  const output = clean(`${result.stdout}\n${result.stderr}`);
  assert.equal(result.status, 0, `${name} failed (${result.status}):\n${output}`);
  console.log(`${name}: PASS`);
  return output;
}
function hash(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function sync(s: Stack): void {
  const dir = path.join(s.workdir, "supabase", "migrations");
  assert.ok(fs.existsSync(dir), `${s.label} migration directory is missing.`);
  for (const source of [p4bPath, p4cPath]) {
    const destination = path.join(dir, path.basename(source));
    fs.copyFileSync(source, destination);
    assert.equal(hash(destination), hash(source), `${s.label} migration copy differs: ${path.basename(source)}`);
  }
  const files = fs.readdirSync(dir).sort();
  const phase4 = files.filter((file: string) => file.includes("p4b_account_invitation_membership_rpcs") || file.includes("p4c_contract_billing_entitlement_rpc"));
  assert.deepEqual(phase4, [p4b, p4c], `${s.label} contains a missing or stale P4-B/P4-C migration.`);
  assert.ok(files.indexOf(p4b) < files.indexOf(p4c), `${s.label} migration order is invalid.`);
  console.log(`${s.label} migrations: ${p4b}=${hash(p4bPath)} ${p4c}=${hash(p4cPath)}`);
}
function sb(s: Stack, name: string, args: string[]): string {
  return pass(`${s.label} ${name}`, run(process.execPath, [supabase, "--workdir", s.workdir, ...args], { timeout: 720_000 }));
}
function verifier(name: string, file: string, environment: NodeJS.ProcessEnv): string {
  return pass(name, run(process.execPath, [tsx, path.join(root, file)], { env: environment, timeout: 1_200_000 }));
}
function sql(s: Stack, name: string, input: string): string {
  return pass(`${s.label} ${name}`, run("docker", ["exec", "--interactive", s.container, "psql", "--username", "postgres", "--dbname", "postgres", "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--quiet"], { input, timeout: 300_000 }));
}
function lines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
function git(args: string[]): string {
  return pass(`git ${args.join(" ")}`, run("git", args, { timeout: 180_000 }));
}
function scope(): void {
  git(["merge-base", "--is-ancestor", base, "HEAD"]);
  const files = new Set<string>();
  for (const args of [["diff", "--name-only", `${base}...HEAD`], ["diff", "--name-only"], ["diff", "--cached", "--name-only"], ["ls-files", "--others", "--exclude-standard"]]) {
    for (const file of lines(git(args))) files.add(file.replace(/\\/g, "/"));
  }
  assert.deepEqual([...files].sort(), [...allowed].sort(), "PR #126 must contain exactly the approved five files.");
  const diff = `${git(["diff", "--no-ext-diff", "--unified=0", `${base}...HEAD`])}\n${git(["diff", "--no-ext-diff", "--unified=0"])}`;
  for (const pattern of [/postgres(?:ql)?:\/\/[^\s]+/i, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, /\bsk-[A-Za-z0-9_-]{20,}\b/, /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i]) {
    assert.doesNotMatch(diff, pattern, `PR diff contains a secret or DB URL: ${pattern}`);
  }
  git(["diff", "--check"]);
}

const actorProof = `
begin;
do $proof$
declare
  c text; n integer; op_user uuid := '12390000-0000-4000-8000-000000000001'; customer uuid := '12390000-0000-4000-8000-000000000002';
  op_id uuid := '12390000-0000-4000-8000-000000000003'; org uuid := '12390000-0000-4000-8000-000000000004'; project uuid := '12390000-0000-4000-8000-000000000005';
  request uuid := '12390000-0000-4000-8000-000000000006'; correlation uuid := '12390000-0000-4000-8000-000000000007'; audit uuid; receipt uuid; outcome text; failure text;
  test record; rejected boolean; seq bigint := 0;
begin
  if not exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid join pg_namespace ns on ns.oid=t.typnamespace where ns.nspname='recora_private' and t.typname='p4_source_kind' and e.enumlabel='customer_session') then raise exception 'customer_session missing'; end if;
  if not exists(select 1 from pg_attribute a where a.attrelid='recora_private.p4_command_receipts'::regclass and a.attname='customer_auth_user_id' and a.atttypid='uuid'::regtype and not a.attisdropped) then raise exception 'customer_auth_user_id missing'; end if;
  if not exists(select 1 from pg_constraint fk join pg_attribute la on la.attrelid=fk.conrelid and la.attnum=any(fk.conkey) join pg_attribute ra on ra.attrelid=fk.confrelid and ra.attnum=any(fk.confkey) where fk.conrelid='recora_private.p4_command_receipts'::regclass and fk.contype='f' and fk.confrelid='auth.users'::regclass and fk.confdeltype='r' and la.attname='customer_auth_user_id' and ra.attname='id') then raise exception 'customer Auth FK missing'; end if;
  select count(*),min(pg_get_constraintdef(oid)) into n,c from pg_constraint where conrelid='recora_private.p4_command_receipts'::regclass and conname='p4_command_receipt_actor_shape' and contype='c';
  if n<>1 or c is null or lower(c) not like '%manual%' or lower(c) not like '%customer_session%' or lower(c) not like '%provider_fixture%' or lower(c) not like '%customer_auth_user_id%' or lower(c) not like '%operator_audit_event_id%' or lower(c) not like '%operator_command_receipt_id%' then raise exception 'replacement actor constraint invalid: %',c; end if;

  insert into auth.users(id,email,created_at,updated_at) values(op_user,'post-sync-operator@example.invalid',now(),now()),(customer,'post-sync-customer@example.invalid',now(),now());
  insert into public.organizations(id,slug,name,organization_type,data_environment,is_internal,is_demo) values(org,'post-sync-actor','Post Sync Actor','client','local',false,false);
  insert into public.projects(id,organization_id,slug,name) values(project,org,'post-sync-actor','Post Sync Actor');
  insert into recora_operator.operator_identities(id,auth_user_id,status,display_label) values(op_id,op_user,'active','post-sync actor proof');
  insert into recora_operator.operator_action_grants(operator_id,permission,organization_id,project_id) values(op_id,'p4c.contract.billing.apply',org,project);
  select p.audit_event_id,p.outcome::text,p.failure_reason_code into audit,outcome,failure from public.recora_operator_execute_authorized_command_receipt(op_user,'p4c.contract.billing.apply',org,project,'p4c.contract.billing.apply','project',project,'post sync actor proof',request,correlation,'{}','{}') p;
  if outcome is distinct from 'success' or failure is not null then raise exception 'operator evidence setup failed'; end if;
  select id into strict receipt from recora_operator.operator_command_receipts where audit_event_id=audit;

  for test in select * from (values
    ('provider_fixture',null::uuid,null::uuid,null::uuid,'provider.none','12390000-0000-4000-8000-000000000011'::uuid,'12390000-0000-4000-8000-000000000012'::uuid),
    ('provider_fixture',audit,receipt,null::uuid,'provider.pair',request,correlation),
    ('manual',audit,receipt,null::uuid,'manual.pair',request,correlation),
    ('customer_session',null::uuid,null::uuid,customer,'customer.actor','12390000-0000-4000-8000-000000000013'::uuid,'12390000-0000-4000-8000-000000000014'::uuid)
  ) v(kind,audit_id,receipt_id,customer_id,reference,request_id,correlation_id) loop
    seq:=seq+1;
    execute 'insert into recora_private.p4_command_receipts(organization_id,project_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,operator_audit_event_id,operator_command_receipt_id,customer_auth_user_id) values($1,$2,$3,$4::recora_private.p4_source_kind,$5,$6,$7,repeat(''a'',64),$8,$9,$10,$11,$12,$13)'
    using org,project,'integration.actor.valid.'||seq,test.kind,'integration.actor',test.reference,seq,test.request_id,test.correlation_id,'integration.valid.'||seq,test.audit_id,test.receipt_id,test.customer_id;
  end loop;

  for test in select * from (values
    ('provider_fixture',audit,null::uuid,null::uuid,'provider.half'),
    ('manual',audit,null::uuid,null::uuid,'manual.half'),
    ('provider_fixture',null::uuid,null::uuid,customer,'provider.customer'),
    ('manual',audit,receipt,customer,'manual.customer'),
    ('customer_session',audit,receipt,customer,'customer.operator'),
    ('customer_session',null::uuid,null::uuid,null::uuid,'customer.missing')
  ) v(kind,audit_id,receipt_id,customer_id,reference) loop
    seq:=seq+1; rejected:=false;
    begin
      execute 'insert into recora_private.p4_command_receipts(organization_id,project_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,operator_audit_event_id,operator_command_receipt_id,customer_auth_user_id) values($1,$2,$3,$4::recora_private.p4_source_kind,$5,$6,$7,repeat(''b'',64),$8,$9,$10,$11,$12,$13)'
      using org,project,'integration.actor.invalid.'||seq,test.kind,'integration.actor',test.reference,seq,request,correlation,'integration.invalid.'||seq,test.audit_id,test.receipt_id,test.customer_id;
    exception when check_violation then rejected:=true; end;
    if not rejected then raise exception 'invalid actor case accepted: %',test.reference; end if;
  end loop;
end;$proof$;
rollback;`;

function appChecks(): void {
  for (const [name, args, timeout] of [
    ["preflight", ["run", "recora:preflight:full"], 900_000],
    ["typecheck", ["run", "typecheck"], 900_000],
    ["lint", ["run", "lint"], 900_000],
    ["build", ["run", "build"], 1_200_000],
    ["dashboard", ["run", "recora:dashboard-read-model:check"], 900_000],
  ] as const) pass(`npm ${name}`, run(npm, [...args], { timeout }));
  const result = run(npm, ["run", "recora:commit-check"], { timeout: 1_200_000 });
  if (result.status === 0) return console.log("npm commit-check: PASS");
  const output = clean(`${result.stdout}\n${result.stderr}`);
  assert.match(output, /supabase migrations:\s*migration commits are not auto-allowed yet/i, `Unexpected commit-check failure:\n${output}`);
  assert.doesNotMatch(output, /(?:typecheck|preflight|lint|build|dashboard(?:-read-model)?)[^\n]*(?:fail|error)|(?:error TS\d+|ESLint.*(?:error|failed))/i, `Additional commit-check failure:\n${output}`);
  console.log("npm commit-check: expected OWNER-authorized migration gate only");
}

function main(): void {
  scope();
  for (const s of [i123,i122,i121,i117]) sync(s);
  sb(i123,"migration-only reset",["db","reset","--local","--yes","--no-seed"]);
  sb(i123,"seeded reset",["db","reset","--local","--yes"]);
  sb(i123,"seeded replay reset",["db","reset","--local","--yes"]);
  sql(i123,"combined actor proof",actorProof);
  verifier("Issue #123 verifier","scripts/verify-issue-123-p4c-contract-billing-entitlement.ts",{RECORA_ISSUE_123_DB_CONTAINER:i123.container,RECORA_ISSUE_123_SUPABASE_WORKDIR:i123.workdir});
  sb(i122,"combined reset",["db","reset","--local","--yes"]);
  verifier("Issue #122 verifier","scripts/verify-issue-122-p4b-account-access.ts",{RECORA_ISSUE_122_DB_CONTAINER:i122.container});
  sb(i121,"combined reset",["db","reset","--local","--yes"]);
  verifier("Issue #121 verifier","scripts/verify-issue-121-p4a-common-contract-state-events.ts",{RECORA_ISSUE_121_DB_CONTAINER:i121.container});
  sb(i117,"combined reset",["db","reset","--local","--yes"]);
  verifier("Issue #117 verifier","scripts/verify-issue-117-phase3-integration-security.ts",{RECORA_ISSUE_117_DB_CONTAINER:i117.container,RECORA_ISSUE_117_SUPABASE_WORKDIR:i117.workdir});
  sb(i123,"DB advisors",["db","advisors","--local"]);
  sb(i123,"DB lint",["db","lint","--local"]);
  appChecks(); scope();
  console.log("Issue #123 P4-B/P4-C post-sync integration verifier passed.");
}
try { main(); } catch (error) { console.error(error); process.exit(1); }
