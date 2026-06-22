import { spawnSync } from "node:child_process";

const rawInput = await readStdin();
const event = parseJson(rawInput);
const cwd = typeof event.cwd === "string" && event.cwd ? event.cwd : process.cwd();

const checks = [
  ["Latest commit", "git", ["log", "-1", "--oneline"]],
  ["Working tree", "git", ["status", "--short"]]
];

const sections = checks.map(([label, command, args]) => {
  const result = run(command, args, cwd, 30000);
  const body = result.text || (result.ok ? "(no output)" : "(command failed without output)");
  return `## ${label}\n${body}`;
});

const additionalContext = [
  "Recora session checkpoint. Read AGENTS.md before editing and preserve unrelated working-tree changes.",
  ...sections,
  [
    "## Manual validation commands",
    "Hooks do not run repository-controlled package scripts automatically.",
    "Run these manually when the task scope calls for them:",
    "- npm run recora:human-check",
    "- npm run recora:preflight:full",
    "- git diff --check"
  ].join("\n")
].join("\n\n").slice(0, 12000);

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext
  }
}));

function run(command, args, workingDirectory, timeout) {
  const result = spawnSync(command, args, {
    cwd: workingDirectory,
    encoding: "utf8",
    windowsHide: true,
    timeout
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  const errorText = result.error ? `${result.error.name}: ${result.error.message}` : "";
  return {
    ok: result.status === 0 && !result.error,
    text: [output, errorText].filter(Boolean).join("\n").slice(0, 8000)
  };
}

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

async function readStdin() {
  if (process.stdin.isTTY) return "";
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
