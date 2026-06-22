import { spawnSync } from "node:child_process";

const input = await readInput();
const event = parse(input);

if (event.stop_hook_active) {
  emit({ continue: true });
}

const cwd = typeof event.cwd === "string" && event.cwd ? event.cwd : process.cwd();
const status = run("git", ["status", "--short"], cwd, 30000);

if (!status.ok) {
  emit({
    decision: "block",
    reason: `Unable to inspect the Recora working tree.\n\n${status.output}`
  });
}

if (!status.output.trim()) {
  emit({
    continue: true,
    systemMessage: manualValidationMessage("Recora working tree is clean.")
  });
}

const results = [
  ["git diff --check", run("git", ["diff", "--check"], cwd, 30000)]
];

const failures = results.filter(([, result]) => !result.ok);

if (failures.length) {
  const details = failures
    .map(([name, result]) => `## ${name}\n${result.output}`)
    .join("\n\n");

  emit({
    decision: "block",
    reason: `Recora git inspection failed. Resolve the failures and rerun validation.\n\n${details}`.slice(0, 8000)
  });
}

emit({
  continue: true,
  systemMessage: manualValidationMessage("Recora git inspection passed.")
});

function run(command, args, cwd, timeout) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout
  });

  const output = [
    `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
    result.error?.message ?? ""
  ]
    .filter(Boolean)
    .join("\n")
    .slice(-6000);

  return {
    ok: result.status === 0 && !result.error,
    output
  };
}

function emit(value) {
  console.log(JSON.stringify(value));
  process.exit(0);
}

function manualValidationMessage(prefix) {
  return [
    prefix,
    "Hooks do not run repository-controlled package scripts automatically.",
    "Run required package-script validation manually, including:",
    "- npm run recora:preflight:full",
    "- git diff --check"
  ].join("\n");
}

function parse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

async function readInput() {
  if (process.stdin.isTTY) return "";
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
