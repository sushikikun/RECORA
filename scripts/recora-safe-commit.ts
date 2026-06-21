import { spawnSync, type StdioOptions } from "node:child_process";
import path from "node:path";
import process from "node:process";

type Mode = "commit-check" | "safe-commit";
type Level = "PASS" | "WARN" | "FAIL" | "INFO";
type Category = "tooling" | "app" | "ui" | "logic" | "db" | "migration" | "env" | "generated" | "other";

type CommandResult = {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
  error: string | null;
};

type StatusItem = {
  code: string;
  pathText: string;
  paths: string[];
  category: Category;
  staged: boolean;
  deleted: boolean;
  lockFile: boolean;
  dangerous: boolean;
};

type SafetyResult = {
  report: Report;
  statusItems: StatusItem[];
  addTargets: string[];
  fail: boolean;
};

type SafeCommitOptions = {
  message: string | null;
};

const MANY_FILES_THRESHOLD = 25;
const MASS_DELETION_FAIL_THRESHOLD = 10;
const SHORT_MESSAGE_THRESHOLD = 10;
const LOCK_FILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"]);

class Report {
  private readonly rows: { level: Level; label: string; value: string }[] = [];

  constructor(private readonly title: string) {}

  add(level: Level, label: string, value: string) {
    this.rows.push({ level, label, value });
  }

  hasFail() {
    return this.rows.some((row) => row.level === "FAIL");
  }

  levelCounts() {
    const counts: Record<Level, number> = { PASS: 0, WARN: 0, FAIL: 0, INFO: 0 };
    for (const row of this.rows) {
      counts[row.level] += 1;
    }
    return counts;
  }

  print() {
    console.log("");
    console.log(`=== ${this.title} ===`);
    for (const row of this.rows) {
      console.log(`${`[${row.level}]`.padEnd(7)} ${row.label.padEnd(30)} ${row.value}`);
    }
    console.log("");
  }
}

function main() {
  const mode = parseMode(process.argv[2]);
  if (!mode) {
    console.error("Usage: tsx scripts/recora-safe-commit.ts <commit-check|safe-commit> [--message \"commit message\"]");
    process.exitCode = 1;
    return;
  }

  if (mode === "commit-check") {
    const result = runCommitSafetyCheck("Recora commit-check");
    result.report.print();
    process.exitCode = result.fail ? 1 : 0;
    return;
  }

  runSafeCommit();
}

function runSafeCommit() {
  const options = parseSafeCommitOptions(process.argv.slice(3));
  const result = runCommitSafetyCheck("Recora safe-commit safety check");
  const report = result.report;

  if (!options.message) {
    report.add("FAIL", "commit message", "missing; use --message \"commit message\"");
  } else if (options.message.trim().length < SHORT_MESSAGE_THRESHOLD) {
    report.add("WARN", "commit message", `shorter than ${SHORT_MESSAGE_THRESHOLD} characters`);
  } else {
    report.add("PASS", "commit message", "present");
  }

  if (result.addTargets.length === 0) {
    report.add("FAIL", "add targets", "no safe changed files to commit");
  } else {
    report.add("INFO", "add targets", summarizePaths(result.addTargets, 30));
  }

  if (report.hasFail()) {
    report.add("INFO", "commit", "skipped because safety check failed");
    report.add("INFO", "push", "not run");
    report.print();
    process.exitCode = 1;
    return;
  }

  report.add("INFO", "git add targets", summarizePaths(result.addTargets, 30));
  const addResult = runCommand("git", ["add", "--"].concat(result.addTargets), process.cwd());
  if (!addResult.ok) {
    report.add("FAIL", "git add", formatCommandFailure(addResult));
    report.add("INFO", "push", "not run");
    report.print();
    process.exitCode = 1;
    return;
  }
  report.add("PASS", "git add", "safe target list staged");

  const commitResult = runCommand("git", ["commit", "-m", options.message ?? ""], process.cwd());
  if (!commitResult.ok) {
    report.add("FAIL", "git commit", sanitizeCommandOutput(`${commitResult.stdout}\n${commitResult.stderr}`) || formatCommandFailure(commitResult));
    report.add("INFO", "push", "not run");
    report.print();
    process.exitCode = 1;
    return;
  }

  const hash = commandStdout("git", ["rev-parse", "--short", "HEAD"], process.cwd()) ?? "unknown";
  const status = commandStdout("git", ["status", "--short"], process.cwd()) ?? "";
  report.add("PASS", "git commit", "created commit");
  report.add("INFO", "commit hash", hash);
  report.add("INFO", "post-commit status", status.trim() || "clean");
  report.add("INFO", "push", "not run");
  report.print();
  process.exitCode = 0;
}

function runCommitSafetyCheck(title: string): SafetyResult {
  const report = new Report(title);
  const statusResult = runCommand("git", ["status", "--short", "--porcelain=v1", "-uall"], process.cwd());
  const diffCheck = runCommand("git", ["diff", "--check"], process.cwd());

  report.add("INFO", "current directory", path.resolve(process.cwd()));
  if (!statusResult.ok) {
    report.add("FAIL", "git status --short", formatCommandFailure(statusResult));
  }

  const statusItems = statusResult.ok ? parseGitStatus(statusResult.stdout) : [];
  addStatusOverview(report, statusItems);
  addChangeClassification(report, statusItems);
  addDangerChecks(report, statusItems);
  addDiffCheck(report, diffCheck);
  addPreflightFull(report);
  addCommitSafetySummary(report);
  addRecommendedActions(report, statusItems);

  const addTargets = buildAddTargets(statusItems);
  return {
    report,
    statusItems,
    addTargets,
    fail: report.hasFail()
  };
}

function parseMode(value: string | undefined): Mode | null {
  if (value === "commit-check" || value === "safe-commit") return value;
  return null;
}

function parseSafeCommitOptions(args: string[]): SafeCommitOptions {
  let message: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--message") {
      const value = args[index + 1];
      if (value && !value.startsWith("--")) {
        message = value;
        index += 1;
      }
    } else if (arg.startsWith("--message=")) {
      message = arg.slice("--message=".length);
    }
  }

  return { message: message?.trim() ? message.trim() : null };
}

function addStatusOverview(report: Report, items: StatusItem[]) {
  const staged = items.filter((item) => item.staged).length;
  const deleted = items.filter((item) => item.deleted).length;
  report.add(items.length > 0 ? "INFO" : "WARN", "changed files", `${items.length} total; staged=${staged}; deleted=${deleted}`);
  if (items.length > MANY_FILES_THRESHOLD) {
    report.add("WARN", "change volume", `${items.length} files exceeds ${MANY_FILES_THRESHOLD}`);
  } else {
    report.add("PASS", "change volume", `${items.length} files`);
  }

  if (deleted >= MASS_DELETION_FAIL_THRESHOLD) {
    report.add("FAIL", "deletion volume", `${deleted} deleted files; mass deletion requires manual review`);
  } else if (deleted > 0) {
    report.add("WARN", "deletion volume", `${deleted} deleted files`);
  } else {
    report.add("PASS", "deletion volume", "no deleted files");
  }
}

function addChangeClassification(report: Report, items: StatusItem[]) {
  const categories: Category[] = ["tooling", "app", "ui", "logic", "db", "migration", "env", "generated", "other"];
  for (const category of categories) {
    const categoryItems = items.filter((item) => item.category === category);
    if (categoryItems.length === 0) continue;
    const value =
      category === "env"
        ? `${categoryItems.length} hidden env/secret path(s)`
        : summarizePaths(categoryItems.map((item) => item.pathText), 20);
    report.add(category === "env" || category === "generated" ? "FAIL" : "INFO", `${category} changes`, value);
  }
}

function addDangerChecks(report: Report, items: StatusItem[]) {
  const dangerous = items.filter((item) => item.dangerous);
  const stagedDangerous = dangerous.filter((item) => item.staged);
  const migrations = items.filter((item) => item.category === "migration");
  const lockFiles = items.filter((item) => item.lockFile);

  report.add(dangerous.length === 0 ? "PASS" : "FAIL", "env/secrets/generated", dangerous.length === 0 ? "none" : `${dangerous.length} blocked path(s)`);
  report.add(
    stagedDangerous.length === 0 ? "PASS" : "FAIL",
    "staged dangerous files",
    stagedDangerous.length === 0 ? "none" : `${stagedDangerous.length} dangerous staged path(s)`
  );
  report.add(
    migrations.length === 0 ? "PASS" : "FAIL",
    "supabase migrations",
    migrations.length === 0 ? "none changed" : "migration commits are not auto-allowed yet"
  );
  report.add(
    lockFiles.length === 0 ? "PASS" : "WARN",
    "lock file changes",
    lockFiles.length === 0 ? "none" : summarizePaths(lockFiles.map((item) => item.pathText), 10)
  );
}

function addDiffCheck(report: Report, result: CommandResult) {
  const output = sanitizeCommandOutput(`${result.stdout}\n${result.stderr}`);
  if (result.ok) {
    report.add(output ? "WARN" : "PASS", "git diff --check", output ? `passed with warnings: ${output}` : "clean");
    return;
  }

  report.add("FAIL", "git diff --check", output || formatCommandFailure(result));
}

function addPreflightFull(report: Report) {
  report.add("INFO", "preflight:full", "running npm run recora:preflight:full");
  const result = runNpmScript("recora:preflight:full", "inherit");
  report.add(result.ok ? "PASS" : "FAIL", "preflight:full result", result.ok ? "passed" : formatCommandFailure(result));
}

function addCommitSafetySummary(report: Report) {
  const counts = report.levelCounts();
  report.add("INFO", "Commit Safety Summary", `PASS=${counts.PASS}; WARN=${counts.WARN}; FAIL=${counts.FAIL}; INFO=${counts.INFO}`);
}

function addRecommendedActions(report: Report, items: StatusItem[]) {
  const actions: string[] = [];
  if (report.hasFail()) {
    actions.push("Do not commit automatically until FAIL rows are resolved.");
  }
  if (items.some((item) => item.category === "migration")) {
    actions.push("Supabase migration commits need a future explicit allow flow.");
  }
  if (items.some((item) => item.deleted)) {
    actions.push("Review deleted files carefully before committing.");
  }
  if (items.some((item) => item.category === "env" || item.category === "generated")) {
    actions.push("Remove env/secret/generated paths from the change set.");
  }
  if (actions.length === 0) {
    actions.push("Safe to commit with recora:safe-commit if the message is intentional.");
  }
  actions.push("git push is never run by this command.");
  report.add("INFO", "Recommended next actions", actions.join(" "));
}

function parseGitStatus(output: string) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map(parseGitStatusLine);
}

function parseGitStatusLine(line: string): StatusItem {
  const code = line.slice(0, 2);
  const rawPath = line.length > 3 ? line.slice(3).trim() : line.trim();
  const paths = rawPath.split(" -> ").map(normalizeGitPathText).filter(Boolean);
  const displayPath = paths.some(isSensitivePath) ? "[env/secret path hidden]" : normalizeGitPathText(rawPath);
  const category = classifyPaths(paths);
  const staged = code[0] !== " " && code[0] !== "?";
  const deleted = code.includes("D");
  const lockFile = paths.some((itemPath) => LOCK_FILES.has(itemPath.toLowerCase()));
  const dangerous = category === "env" || category === "generated";

  return {
    code,
    pathText: displayPath,
    paths,
    category,
    staged,
    deleted,
    lockFile,
    dangerous
  };
}

function classifyPaths(paths: string[]): Category {
  if (paths.some(isSensitivePath)) return "env";
  if (paths.some(isGeneratedPath)) return "generated";
  if (paths.some((itemPath) => itemPath.toLowerCase().startsWith("supabase/migrations/"))) return "migration";
  if (paths.some((itemPath) => itemPath.toLowerCase().startsWith("supabase/"))) return "db";
  if (paths.some((itemPath) => itemPath.toLowerCase().startsWith("app/"))) return "app";
  if (paths.some((itemPath) => itemPath.toLowerCase().startsWith("components/"))) return "ui";
  if (paths.some((itemPath) => itemPath.toLowerCase().startsWith("lib/"))) return "logic";
  if (paths.some(isToolingPath)) return "tooling";
  return "other";
}

function isToolingPath(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized === "package.json" ||
    LOCK_FILES.has(normalized) ||
    normalized.startsWith("scripts/") ||
    normalized.startsWith(".agents/")
  );
}

function isGeneratedPath(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.startsWith(".next/") ||
    normalized.startsWith("node_modules/") ||
    normalized.startsWith("dist/") ||
    normalized.startsWith("build/")
  );
}

function isSensitivePath(value: string) {
  const normalized = value.toLowerCase();
  const fileName = normalized.split("/").pop() ?? normalized;
  return (
    fileName === ".env" ||
    fileName === ".env.local" ||
    fileName.startsWith(".env.") ||
    fileName.endsWith(".pem") ||
    normalized.includes("secret") ||
    normalized.includes("key")
  );
}

function buildAddTargets(items: StatusItem[]) {
  const targets = new Set<string>();
  for (const item of items) {
    if (item.dangerous || item.category === "migration" || item.category === "generated" || item.category === "env") continue;
    for (const itemPath of item.paths) {
      targets.add(itemPath);
    }
  }
  return Array.from(targets).sort((left, right) => left.localeCompare(right));
}

function runCommand(command: string, args: string[], cwd: string): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: stripAnsi(result.stdout ?? ""),
    stderr: stripAnsi(result.stderr ?? ""),
    error: result.error ? result.error.message : null
  };
}

function runNpmScript(scriptName: string, stdio: StdioOptions): CommandResult {
  if (process.platform === "win32") {
    const result = spawnSync("cmd.exe", ["/d", "/s", "/c", `npm run ${scriptName}`], {
      cwd: process.cwd(),
      encoding: stdio === "inherit" ? undefined : "utf8",
      stdio,
      windowsHide: true
    });
    return {
      ok: result.status === 0,
      status: result.status,
      stdout: typeof result.stdout === "string" ? stripAnsi(result.stdout) : "",
      stderr: typeof result.stderr === "string" ? stripAnsi(result.stderr) : "",
      error: result.error ? result.error.message : null
    };
  }

  const result = spawnSync("npm", ["run", scriptName], {
    cwd: process.cwd(),
    encoding: stdio === "inherit" ? undefined : "utf8",
    stdio,
    windowsHide: true
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: typeof result.stdout === "string" ? stripAnsi(result.stdout) : "",
    stderr: typeof result.stderr === "string" ? stripAnsi(result.stderr) : "",
    error: result.error ? result.error.message : null
  };
}

function commandStdout(command: string, args: string[], cwd: string) {
  const result = runCommand(command, args, cwd);
  return result.ok ? result.stdout.trim() : null;
}

function formatCommandFailure(result: CommandResult) {
  return result.stderr.trim() || result.error || result.stdout.trim() || `exit code ${result.status ?? "unknown"}`;
}

function summarizePaths(paths: string[], limit: number) {
  const visible = paths.slice(0, limit);
  const remaining = paths.length - visible.length;
  const suffix = remaining > 0 ? `; +${remaining} more` : "";
  return `${visible.join("; ")}${suffix}`;
}

function sanitizeCommandOutput(output: string) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (isSensitivePath(line) ? "[env/secret path hidden]" : line))
    .slice(0, 10)
    .join(" | ");
}

function normalizeGitPathText(value: string) {
  return value.replace(/^"|"$/g, "").replace(/\\/g, "/");
}

function stripAnsi(value: string) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

main();
