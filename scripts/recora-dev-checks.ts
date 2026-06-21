import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type Mode = "whereami" | "human-check" | "before-codex" | "doctor" | "dashboard-read-model-check";
type Level = "PASS" | "WARN" | "FAIL" | "INFO";

type CommandResult = {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
  error: string | null;
};

type PackageInfo = {
  exists: boolean;
  name: string | null;
  scripts: Record<string, string>;
  parseError: string | null;
};

type StatusItem = {
  code: string;
  pathText: string;
  isSensitive: boolean;
};

type GitStatusSummary = {
  items: StatusItem[];
  total: number;
  modified: number;
  untracked: number;
  deleted: number;
  renamed: number;
  staged: number;
  hiddenSensitive: number;
  visiblePaths: string[];
};

type Context = {
  currentDir: string;
  expectedRoot: string | null;
  repoRoot: string | null;
  gitRootError: string | null;
  branch: string | null;
  latestCommit: string | null;
  gitStatus: GitStatusSummary | null;
  packageInfo: PackageInfo;
  npmVersion: string | null;
};

type Row = {
  level: Level;
  label: string;
  value: string;
};

type MigrationAnalysis = {
  dirExists: boolean;
  files: string[];
  invalidNames: string[];
  duplicatePrefixes: string[];
  namingKinds: string[];
  tables: Set<string>;
  views: Set<string>;
  functions: Set<string>;
  columnsByTable: Map<string, Set<string>>;
  rlsEnabledTables: Set<string>;
};

type DashboardCodeAnalysis = {
  files: string[];
  tableRefs: Map<string, Set<string>>;
  rpcRefs: Map<string, Set<string>>;
  selectedColumnsByTable: Map<string, Set<string>>;
  staticDataFindings: string[];
};

const LOCK_FILES = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"];

const RECORA_SIGNAL_PATHS = [
  "package.json",
  "app",
  "components/recora",
  "lib/recora",
  "lib/supabase",
  "supabase",
  ".agents/skills"
];

const CORE_SNAPSHOT_PATHS = ["app", "components", "lib", "supabase", ".agents/skills"];

const DOCTOR_CORE_PATHS = ["app", "components", "lib", "supabase", ".agents/skills"];

const DOCTOR_REQUIRED_SCRIPTS = [
  "dev",
  "build",
  "lint",
  "typecheck",
  "recora:whereami",
  "recora:human-check",
  "recora:before-codex",
  "recora:doctor",
  "recora:dashboard-read-model:check"
];

const SUPABASE_TYPE_CANDIDATES = [
  "lib/database.types.ts",
  "lib/supabase/types.ts",
  "types/supabase.ts",
  "supabase/types.ts",
  "database.types.ts",
  "lib/recora/db/types.ts"
];

const DASHBOARD_PATHS = [
  "app/dashboard",
  "app/dashboard/page.tsx",
  "app/dashboard/reports/page.tsx",
  "app/dashboard/reports/[id]/page.tsx",
  "components/recora/dashboard-shell.tsx",
  "components/recora/report-pages.tsx",
  "lib/recora/db/dashboard.ts"
];

const DASHBOARD_SCAN_ROOTS = [
  "app/dashboard",
  "app/(dashboard)",
  "components/dashboard",
  "components/recora",
  "lib/dashboard",
  "lib/recora/db"
];

const DASHBOARD_EXTRA_SCAN_FILES = [
  "lib/recora/report-view-model.ts",
  "lib/recora/measurement-analysis-read-model.ts",
  "lib/recora/sample-data.ts"
];

const SCOPE_COLUMN_CANDIDATES = ["tenant_id", "organization_id", "workspace_id", "project_id"];

const IMPORTANT_PREFIXES = ["app/", "components/", "lib/", "supabase/"];
const IMPORTANT_FILES = new Set(["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"]);

class Report {
  private readonly rows: Row[] = [];

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
    console.error(
      "Usage: tsx scripts/recora-dev-checks.ts <whereami|human-check|before-codex|doctor|dashboard-read-model-check>"
    );
    process.exitCode = 1;
    return;
  }

  const context = collectContext();
  const report = new Report(titleForMode(mode));

  if (mode === "whereami") {
    buildWhereamiReport(report, context);
  } else if (mode === "human-check") {
    buildHumanCheckReport(report, context);
  } else if (mode === "before-codex") {
    buildBeforeCodexReport(report, context);
  } else if (mode === "doctor") {
    buildDoctorReport(report, context);
  } else {
    buildDashboardReadModelCheckReport(report, context);
  }

  report.print();
  process.exitCode = report.hasFail() ? 1 : 0;
}

function parseMode(value: string | undefined): Mode | null {
  if (
    value === "whereami" ||
    value === "human-check" ||
    value === "before-codex" ||
    value === "doctor" ||
    value === "dashboard-read-model-check"
  ) {
    return value;
  }
  return null;
}

function titleForMode(mode: Mode) {
  if (mode === "whereami") return "Recora whereami";
  if (mode === "human-check") return "Recora human-check snapshot";
  if (mode === "before-codex") return "Recora before-codex safety check";
  if (mode === "doctor") return "Recora doctor";
  return "Recora dashboard read model check";
}

function collectContext(): Context {
  const currentDir = path.resolve(process.cwd());
  const userProfile = process.env.USERPROFILE?.trim() || null;
  const expectedRoot = userProfile ? path.resolve(userProfile, "work", "recora") : null;
  const gitRoot = runCommand("git", ["rev-parse", "--show-toplevel"], currentDir);
  const repoRoot = gitRoot.ok && gitRoot.stdout.trim() ? path.resolve(gitRoot.stdout.trim()) : null;
  const commandRoot = repoRoot ?? currentDir;
  const branch = repoRoot ? commandStdout("git", ["branch", "--show-current"], commandRoot) : null;
  const latestCommit = repoRoot ? commandStdout("git", ["rev-parse", "--short", "HEAD"], commandRoot) : null;
  const status = repoRoot ? runCommand("git", ["status", "--short"], commandRoot) : null;

  return {
    currentDir,
    expectedRoot,
    repoRoot,
    gitRootError: gitRoot.ok ? null : formatCommandFailure(gitRoot),
    branch: branch || (repoRoot ? "detached or unknown" : null),
    latestCommit,
    gitStatus: status && status.ok ? parseGitStatus(status.stdout) : null,
    packageInfo: readPackageInfo(commandRoot),
    npmVersion: readNpmVersion(commandRoot)
  };
}

function buildWhereamiReport(report: Report, context: Context) {
  const root = context.repoRoot ?? context.currentDir;

  report.add("INFO", "current directory", context.currentDir);
  addExpectedRootChecks(report, context, false);
  addOneDriveCheck(report, context);
  addPackageCheck(report, context.packageInfo);
  addRecoraSignalCheck(report, root, context.packageInfo);
  addGitInfo(report, context);
  addRuntimeInfo(report, context);
  addEnvLocalPresence(report, root);
}

function buildHumanCheckReport(report: Report, context: Context) {
  const root = context.repoRoot ?? context.currentDir;

  report.add("INFO", "current directory", context.currentDir);
  addExpectedRootChecks(report, context, false);
  addOneDriveCheck(report, context);
  addGitInfo(report, context);
  addStatusCounts(report, context.gitStatus);
  addPackageCheck(report, context.packageInfo);
  addPathPresence(report, root, "core paths", CORE_SNAPSHOT_PATHS, "FAIL");
  addEnvLocalPresence(report, root);
  addRuntimeInfo(report, context);
  addDashboardOverview(report, root);
  addMigrationCount(report, root);
  report.add(
    "INFO",
    "next step",
    "\u3053\u306e\u51fa\u529b\u3092ChatGPT/Codex\u306b\u8cbc\u3063\u3066\u304f\u3060\u3055\u3044"
  );
}

function buildBeforeCodexReport(report: Report, context: Context) {
  const root = context.repoRoot ?? context.currentDir;

  report.add("INFO", "current directory", context.currentDir);
  addExpectedRootChecks(report, context, true);
  addOneDriveCheck(report, context);
  addPackageCheck(report, context.packageInfo);
  addGitInfo(report, context);
  addDirtyWorktreeCheck(report, context.gitStatus);
  addLockFileCheck(report, root);
  addDiffCheck(report, context.repoRoot);
  addImportantChangeOverview(report, context.gitStatus);
  addRecommendedActions(report, context);
}

function buildDoctorReport(report: Report, context: Context) {
  const root = context.repoRoot ?? context.currentDir;
  const migrationAnalysis = analyzeMigrations(root);

  report.add("INFO", "current directory", context.currentDir);
  addExpectedRootChecks(report, context, false);
  addOneDriveCheck(report, context);
  addPackageCheck(report, context.packageInfo);
  addPackageScriptCheck(report, context.packageInfo, DOCTOR_REQUIRED_SCRIPTS);
  addPathPresence(report, root, "core paths", DOCTOR_CORE_PATHS, "FAIL");
  addEnvLocalPresence(report, root);
  addMigrationStructureCheck(report, migrationAnalysis);
  addSupabaseTypeFileCheck(report, root);
  addDashboardRouteOverview(report, root);
  addLockFileCheck(report, root);
  addRuntimeInfo(report, context);
  addReportSummary(report, "Summary");
  addDoctorRecommendedActions(report, migrationAnalysis);
}

function buildDashboardReadModelCheckReport(report: Report, context: Context) {
  const root = context.repoRoot ?? context.currentDir;
  const migrationAnalysis = analyzeMigrations(root);
  const dashboardAnalysis = analyzeDashboardCode(root);

  report.add("INFO", "current directory", context.currentDir);
  addExpectedRootChecks(report, context, false);
  addDashboardScanOverview(report, dashboardAnalysis);
  addDashboardSupabaseReferenceCheck(report, dashboardAnalysis, migrationAnalysis);
  addDashboardSelectedColumnCheck(report, dashboardAnalysis, migrationAnalysis);
  addDashboardScopeColumnCheck(report, dashboardAnalysis, migrationAnalysis);
  addDashboardRlsCheck(report, dashboardAnalysis, migrationAnalysis);
  addDashboardStaticDataCheck(report, dashboardAnalysis);
  addDashboardReadModelSummary(report, dashboardAnalysis, migrationAnalysis);
  addReportSummary(report, "Dashboard Read Model Summary");
  addDashboardRecommendedActions(report, dashboardAnalysis, migrationAnalysis);
}

function addExpectedRootChecks(report: Report, context: Context, strictRepoRoot: boolean) {
  if (!context.expectedRoot) {
    report.add("WARN", "expected Recora root", "USERPROFILE is not set, so expected path cannot be built.");
    return;
  }

  report.add("INFO", "expected Recora root", context.expectedRoot);

  const currentInsideExpected = isInsideOrSamePath(context.currentDir, context.expectedRoot);
  report.add(
    currentInsideExpected ? "PASS" : "WARN",
    "current path check",
    currentInsideExpected ? "inside expected Recora workspace" : "outside $env:USERPROFILE\\work\\recora"
  );

  if (!context.repoRoot) {
    report.add("FAIL", "git repo root", context.gitRootError ?? "not a git repository");
    return;
  }

  report.add("INFO", "git repo root", context.repoRoot);

  const rootMatchesExpected = samePath(context.repoRoot, context.expectedRoot);
  const level: Level = rootMatchesExpected ? "PASS" : strictRepoRoot ? "FAIL" : "FAIL";
  report.add(
    level,
    "repo root check",
    rootMatchesExpected ? "matches $env:USERPROFILE\\work\\recora" : "does not match expected Recora root"
  );
}

function addOneDriveCheck(report: Report, context: Context) {
  const paths = [context.currentDir, context.repoRoot ?? ""].filter(Boolean);
  const inOneDrive = paths.some(isOneDrivePath);
  report.add(
    inOneDrive ? "WARN" : "PASS",
    "OneDrive path check",
    inOneDrive ? "working under OneDrive can cause sync/lock surprises" : "not under OneDrive"
  );
}

function addPackageCheck(report: Report, packageInfo: PackageInfo) {
  if (!packageInfo.exists) {
    report.add("FAIL", "package.json", "missing");
    return;
  }

  if (packageInfo.parseError) {
    report.add("FAIL", "package.json", `present but unreadable JSON: ${packageInfo.parseError}`);
    return;
  }

  report.add("PASS", "package.json", packageInfo.name ? `present (name=${packageInfo.name})` : "present");
}

function addPackageScriptCheck(report: Report, packageInfo: PackageInfo, requiredScripts: string[]) {
  if (!packageInfo.exists || packageInfo.parseError) {
    report.add("FAIL", "npm scripts", "cannot inspect scripts without readable package.json");
    return;
  }

  const missing = requiredScripts.filter((scriptName) => !packageInfo.scripts[scriptName]);
  report.add(
    missing.length === 0 ? "PASS" : "FAIL",
    "npm scripts",
    missing.length === 0
      ? `${requiredScripts.length}/${requiredScripts.length} required scripts present`
      : `missing: ${missing.join(", ")}`
  );
}

function addRecoraSignalCheck(report: Report, root: string, packageInfo: PackageInfo) {
  const pathSignals = RECORA_SIGNAL_PATHS.map((relativePath) => ({
    label: relativePath,
    exists: existsRelative(root, relativePath)
  }));
  const packageNameSignal = {
    label: "package name includes recora",
    exists: packageInfo.name?.toLowerCase().includes("recora") ?? false
  };
  const signals = [packageNameSignal, ...pathSignals];
  const missing = signals.filter((signal) => !signal.exists).map((signal) => signal.label);

  report.add(
    missing.length === 0 ? "PASS" : "FAIL",
    "Recora repo signals",
    missing.length === 0 ? "all expected signals present" : `missing: ${missing.join(", ")}`
  );
}

function addGitInfo(report: Report, context: Context) {
  if (!context.repoRoot) {
    report.add("FAIL", "git status", "cannot read git status outside a git repo");
    return;
  }

  report.add("INFO", "branch", context.branch ?? "unknown");
  report.add("INFO", "latest commit", context.latestCommit ?? "unknown");

  if (!context.gitStatus) {
    report.add("FAIL", "git status summary", "unavailable");
    return;
  }

  report.add(context.gitStatus.total === 0 ? "PASS" : "WARN", "git status summary", formatStatusSummary(context.gitStatus));
  addVisibleStatusPaths(report, context.gitStatus);
}

function addStatusCounts(report: Report, status: GitStatusSummary | null) {
  if (!status) {
    report.add("FAIL", "modified/untracked count", "unavailable");
    return;
  }

  report.add(
    status.total === 0 ? "PASS" : "WARN",
    "modified/untracked count",
    `modified=${status.modified}; untracked=${status.untracked}; total=${status.total}`
  );
}

function addRuntimeInfo(report: Report, context: Context) {
  report.add("INFO", "Node version", process.version);
  report.add(context.npmVersion ? "INFO" : "WARN", "npm version", context.npmVersion ?? "unavailable");
}

function addEnvLocalPresence(report: Report, root: string) {
  report.add(existsRelative(root, ".env.local") ? "PASS" : "WARN", ".env.local", existsRelative(root, ".env.local") ? "present" : "missing");
}

function addPathPresence(report: Report, root: string, label: string, relativePaths: string[], missingLevel: Level) {
  const entries = relativePaths.map((relativePath) => ({
    label: relativePath,
    exists: existsRelative(root, relativePath)
  }));
  const missing = entries.filter((entry) => !entry.exists).map((entry) => entry.label);
  const presentCount = entries.length - missing.length;

  report.add(
    missing.length === 0 ? "PASS" : missingLevel,
    label,
    `${presentCount}/${entries.length} present${missing.length > 0 ? `; missing: ${missing.join(", ")}` : ""}`
  );
}

function addDashboardOverview(report: Report, root: string) {
  const entries = DASHBOARD_PATHS.map((relativePath) => ({
    label: relativePath,
    exists: existsRelative(root, relativePath)
  }));
  const missing = entries.filter((entry) => !entry.exists).map((entry) => entry.label);
  const presentCount = entries.length - missing.length;

  report.add(
    missing.length === 0 ? "PASS" : "WARN",
    "dashboard files",
    `${presentCount}/${entries.length} present${missing.length > 0 ? `; missing: ${missing.join(", ")}` : ""}`
  );
}

function addMigrationCount(report: Report, root: string) {
  const migrationsDir = path.join(root, "supabase", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    report.add("WARN", "supabase migrations", "directory missing");
    return;
  }

  const count = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql")).length;
  report.add("INFO", "supabase migrations", `${count} sql files`);
}

function addMigrationStructureCheck(report: Report, analysis: MigrationAnalysis) {
  if (!analysis.dirExists) {
    report.add("FAIL", "supabase migrations", "directory missing");
    return;
  }

  report.add(
    analysis.files.length > 0 ? "PASS" : "FAIL",
    "supabase migrations",
    analysis.files.length > 0
      ? `${analysis.files.length} sql files; first=${analysis.files[0]}; last=${analysis.files[analysis.files.length - 1]}`
      : "no sql files"
  );
  report.add(
    analysis.invalidNames.length === 0 ? "PASS" : "WARN",
    "migration names",
    analysis.invalidNames.length === 0 ? "all names use numeric sortable prefixes" : `invalid: ${analysis.invalidNames.join(", ")}`
  );
  report.add(
    analysis.duplicatePrefixes.length === 0 ? "PASS" : "FAIL",
    "migration prefix uniqueness",
    analysis.duplicatePrefixes.length === 0 ? "no duplicate numeric prefixes" : `duplicates: ${analysis.duplicatePrefixes.join(", ")}`
  );
  report.add(
    analysis.namingKinds.length <= 1 ? "PASS" : "WARN",
    "migration naming style",
    analysis.namingKinds.length <= 1 ? analysis.namingKinds[0] ?? "none" : `mixed styles: ${analysis.namingKinds.join(", ")}`
  );
  report.add(
    "INFO",
    "migration SQL objects",
    `tables=${analysis.tables.size}; views=${analysis.views.size}; functions=${analysis.functions.size}; rls=${analysis.rlsEnabledTables.size}`
  );
}

function addSupabaseTypeFileCheck(report: Report, root: string) {
  const present = SUPABASE_TYPE_CANDIDATES.filter((relativePath) => existsRelative(root, relativePath));
  report.add(
    present.length > 0 ? "PASS" : "WARN",
    "Supabase type files",
    present.length > 0 ? present.join(", ") : "no obvious Supabase/DB type file found"
  );
}

function addDashboardRouteOverview(report: Report, root: string) {
  const entries = DASHBOARD_PATHS.map((relativePath) => ({
    label: relativePath,
    exists: existsRelative(root, relativePath)
  }));
  const missing = entries.filter((entry) => !entry.exists).map((entry) => entry.label);
  const discovered = discoverDashboardFiles(root);

  report.add(
    missing.length === 0 ? "PASS" : "WARN",
    "dashboard routes/files",
    `${entries.length - missing.length}/${entries.length} expected present; discovered=${discovered.length}${
      missing.length > 0 ? `; missing: ${missing.join(", ")}` : ""
    }`
  );
}

function addReportSummary(report: Report, label: string) {
  const counts = report.levelCounts();
  report.add("INFO", label, `PASS=${counts.PASS}; WARN=${counts.WARN}; FAIL=${counts.FAIL}; INFO=${counts.INFO}`);
}

function addDoctorRecommendedActions(report: Report, analysis: MigrationAnalysis) {
  const counts = report.levelCounts();
  const actions: string[] = [];

  if (counts.FAIL > 0) {
    actions.push("Fix FAIL rows before relying on this workspace.");
  }
  if (analysis.namingKinds.length > 1) {
    actions.push("Consider standardizing future migration filenames on one sortable convention.");
  }
  if (counts.WARN > 0 && counts.FAIL === 0) {
    actions.push("Review WARN rows, then continue if they are expected for local development.");
  }
  if (actions.length === 0) {
    actions.push("No blocking development environment issues found.");
  }

  report.add("INFO", "Recommended next actions", actions.join(" "));
}

function addDirtyWorktreeCheck(report: Report, status: GitStatusSummary | null) {
  if (!status) {
    report.add("FAIL", "uncommitted changes", "unavailable");
    return;
  }

  report.add(
    status.total === 0 ? "PASS" : "WARN",
    "uncommitted changes",
    status.total === 0 ? "none" : `${status.total} changed files before Codex work`
  );
}

function addLockFileCheck(report: Report, root: string) {
  const presentLocks = LOCK_FILES.filter((fileName) => existsRelative(root, fileName));
  report.add(
    presentLocks.length > 1 ? "WARN" : "PASS",
    "package lock files",
    presentLocks.length > 0 ? presentLocks.join(", ") : "none found"
  );
}

function addDiffCheck(report: Report, repoRoot: string | null) {
  if (!repoRoot) {
    report.add("FAIL", "git diff --check", "cannot run outside a git repo");
    return;
  }

  const result = runCommand("git", ["diff", "--check"], repoRoot);
  const output = sanitizeCommandOutput(`${result.stdout}\n${result.stderr}`);
  if (result.ok) {
    report.add(output ? "WARN" : "PASS", "git diff --check", output ? `passed with warnings: ${output}` : "clean");
    return;
  }

  report.add("FAIL", "git diff --check", output || formatCommandFailure(result));
}

function addImportantChangeOverview(report: Report, status: GitStatusSummary | null) {
  if (!status) {
    report.add("FAIL", "important area changes", "unavailable");
    return;
  }

  const important = status.items.filter((item) => !item.isSensitive && isImportantChangePath(item.pathText));
  if (important.length === 0) {
    report.add("PASS", "important area changes", "none in app/components/lib/supabase/package files");
    return;
  }

  report.add("WARN", "important area changes", summarizePaths(important.map((item) => item.pathText), 20));
}

function addRecommendedActions(report: Report, context: Context) {
  const actions: string[] = [];
  const status = context.gitStatus;

  if (!context.repoRoot || (context.expectedRoot && !samePath(context.repoRoot, context.expectedRoot))) {
    actions.push("Move to $env:USERPROFILE\\work\\recora before giving Codex a task.");
  }
  if (status && status.total > 0) {
    actions.push("Review or commit/stash existing changes, or tell Codex exactly which files it may edit.");
  }
  if (status && status.items.some((item) => item.isSensitive)) {
    actions.push("Env/secret paths were hidden; verify them manually without pasting values.");
  }
  if (actions.length === 0) {
    actions.push("Ready for Codex. Include this safety output with the next task if useful.");
  }

  report.add("INFO", "recommended next actions", actions.join(" "));
}

function addDashboardScanOverview(report: Report, analysis: DashboardCodeAnalysis) {
  const roots = DASHBOARD_SCAN_ROOTS.join(", ");
  report.add(analysis.files.length > 0 ? "PASS" : "FAIL", "dashboard scan files", `${analysis.files.length} files`);
  report.add("INFO", "dashboard scan roots", roots);
}

function addDashboardSupabaseReferenceCheck(
  report: Report,
  dashboardAnalysis: DashboardCodeAnalysis,
  migrationAnalysis: MigrationAnalysis
) {
  const tableRefs = sortedMapKeys(dashboardAnalysis.tableRefs);
  const rpcRefs = sortedMapKeys(dashboardAnalysis.rpcRefs);
  const knownReadObjects = new Set(Array.from(migrationAnalysis.tables).concat(Array.from(migrationAnalysis.views)));
  const missingTables = tableRefs.filter((name) => !knownReadObjects.has(name));
  const missingRpcs = rpcRefs.filter((name) => !migrationAnalysis.functions.has(name));

  report.add(
    tableRefs.length > 0 ? (missingTables.length === 0 ? "PASS" : "FAIL") : "WARN",
    "dashboard table/view refs",
    tableRefs.length === 0
      ? "no static supabase.from() refs found"
      : missingTables.length === 0
        ? `${tableRefs.length} refs found in migrations: ${tableRefs.join(", ")}`
        : `missing in migrations: ${missingTables.join(", ")}`
  );

  report.add(
    missingRpcs.length === 0 ? "PASS" : "WARN",
    "dashboard rpc refs",
    rpcRefs.length === 0
      ? "no static supabase.rpc() refs found"
      : missingRpcs.length === 0
        ? `${rpcRefs.length} refs found in migrations: ${rpcRefs.join(", ")}`
        : `missing in migrations: ${missingRpcs.join(", ")}`
  );
}

function addDashboardSelectedColumnCheck(
  report: Report,
  dashboardAnalysis: DashboardCodeAnalysis,
  migrationAnalysis: MigrationAnalysis
) {
  const missingColumns: string[] = [];
  let checkedColumnCount = 0;

  for (const [tableName, selectedColumns] of Array.from(dashboardAnalysis.selectedColumnsByTable.entries())) {
    const knownColumns = migrationAnalysis.columnsByTable.get(tableName);
    if (!knownColumns) continue;

    for (const columnName of Array.from(selectedColumns)) {
      checkedColumnCount += 1;
      if (!knownColumns.has(columnName)) {
        missingColumns.push(`${tableName}.${columnName}`);
      }
    }
  }

  report.add(
    checkedColumnCount > 0 ? (missingColumns.length === 0 ? "PASS" : "FAIL") : "WARN",
    "selected columns",
    checkedColumnCount === 0
      ? "no static select column lists found"
      : missingColumns.length === 0
        ? `${checkedColumnCount} selected columns found in migrations`
        : `missing columns: ${summarizePaths(missingColumns, 20)}`
  );
}

function addDashboardScopeColumnCheck(
  report: Report,
  dashboardAnalysis: DashboardCodeAnalysis,
  migrationAnalysis: MigrationAnalysis
) {
  const tableRefs = sortedMapKeys(dashboardAnalysis.tableRefs).filter((name) => migrationAnalysis.tables.has(name));
  const directScoped = tableRefs.filter((tableName) => {
    const columns = migrationAnalysis.columnsByTable.get(tableName);
    return columns ? SCOPE_COLUMN_CANDIDATES.some((columnName) => columns.has(columnName)) : false;
  });
  const indirectOrChild = tableRefs.filter((tableName) => !directScoped.includes(tableName));

  report.add(
    directScoped.length > 0 ? "PASS" : "WARN",
    "scope columns",
    directScoped.length > 0
      ? `direct scope on ${directScoped.length}/${tableRefs.length}: ${directScoped.join(", ")}`
      : `no direct ${SCOPE_COLUMN_CANDIDATES.join("/")} columns on dashboard refs`
  );

  if (indirectOrChild.length > 0) {
    report.add("INFO", "indirect scoped refs", summarizePaths(indirectOrChild, 20));
  }
}

function addDashboardRlsCheck(report: Report, dashboardAnalysis: DashboardCodeAnalysis, migrationAnalysis: MigrationAnalysis) {
  const tableRefs = sortedMapKeys(dashboardAnalysis.tableRefs).filter((name) => migrationAnalysis.tables.has(name));
  const missingRls = tableRefs.filter((name) => !migrationAnalysis.rlsEnabledTables.has(name));

  report.add(
    tableRefs.length > 0 ? (missingRls.length === 0 ? "PASS" : "FAIL") : "WARN",
    "RLS enabled",
    tableRefs.length === 0
      ? "no dashboard table refs to check"
      : missingRls.length === 0
        ? `${tableRefs.length}/${tableRefs.length} dashboard tables enable RLS`
        : `missing RLS: ${missingRls.join(", ")}`
  );
}

function addDashboardStaticDataCheck(report: Report, analysis: DashboardCodeAnalysis) {
  report.add(
    analysis.staticDataFindings.length === 0 ? "PASS" : "WARN",
    "mock/static data refs",
    analysis.staticDataFindings.length === 0
      ? "none found in scanned dashboard files"
      : summarizePaths(analysis.staticDataFindings, 20)
  );
}

function addDashboardReadModelSummary(
  report: Report,
  dashboardAnalysis: DashboardCodeAnalysis,
  migrationAnalysis: MigrationAnalysis
) {
  report.add(
    "INFO",
    "read model objects",
    `tableRefs=${dashboardAnalysis.tableRefs.size}; rpcRefs=${dashboardAnalysis.rpcRefs.size}; migrationTables=${migrationAnalysis.tables.size}; migrationViews=${migrationAnalysis.views.size}; rlsTables=${migrationAnalysis.rlsEnabledTables.size}`
  );
}

function addDashboardRecommendedActions(
  report: Report,
  dashboardAnalysis: DashboardCodeAnalysis,
  migrationAnalysis: MigrationAnalysis
) {
  const counts = report.levelCounts();
  const tableRefs = sortedMapKeys(dashboardAnalysis.tableRefs);
  const knownReadObjects = new Set(Array.from(migrationAnalysis.tables).concat(Array.from(migrationAnalysis.views)));
  const missingTables = tableRefs.filter((name) => !knownReadObjects.has(name));
  const actions: string[] = [];

  if (missingTables.length > 0) {
    actions.push("Add or rename migrations for missing dashboard read objects, or update the dashboard references.");
  }
  if (counts.FAIL > 0) {
    actions.push("Resolve FAIL rows before trusting the dashboard read model.");
  }
  if (dashboardAnalysis.staticDataFindings.length > 0) {
    actions.push("Review mock/static data references and confirm they are intentional fallbacks.");
  }
  if (counts.WARN > 0 && counts.FAIL === 0) {
    actions.push("Review WARN rows, then continue if they are expected.");
  }
  if (actions.length === 0) {
    actions.push("Dashboard read model references align with the migration snapshot.");
  }

  report.add("INFO", "Recommended next actions", actions.join(" "));
}

function analyzeMigrations(root: string): MigrationAnalysis {
  const migrationsDir = path.join(root, "supabase", "migrations");
  const empty: MigrationAnalysis = {
    dirExists: false,
    files: [],
    invalidNames: [],
    duplicatePrefixes: [],
    namingKinds: [],
    tables: new Set<string>(),
    views: new Set<string>(),
    functions: new Set<string>(),
    columnsByTable: new Map<string, Set<string>>(),
    rlsEnabledTables: new Set<string>()
  };

  if (!fs.existsSync(migrationsDir)) return empty;

  const files = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const analysis: MigrationAnalysis = { ...empty, dirExists: true, files };
  const prefixes = new Map<string, number>();
  const namingKinds = new Set<string>();

  for (const fileName of files) {
    const prefix = fileName.split("_")[0] ?? "";
    if (/^\d{14}$/.test(prefix)) {
      namingKinds.add("timestamp");
    } else if (/^\d{4}$/.test(prefix)) {
      namingKinds.add("sequence");
    } else {
      analysis.invalidNames.push(fileName);
    }
    prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1);

    const sql = fs.readFileSync(path.join(migrationsDir, fileName), "utf8");
    collectSqlObjects(sql, analysis);
  }

  analysis.duplicatePrefixes = Array.from(prefixes.entries())
    .filter(([, count]) => count > 1)
    .map(([prefix]) => prefix)
    .sort((left, right) => left.localeCompare(right));
  analysis.namingKinds = Array.from(namingKinds).sort((left, right) => left.localeCompare(right));

  return analysis;
}

function collectSqlObjects(sql: string, analysis: MigrationAnalysis) {
  for (const match of Array.from(
    sql.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?("?[\w]+"?)\s*\(([\s\S]*?)\);/gi)
  )) {
    const tableName = normalizeSqlIdentifier(match[1] ?? "");
    if (!tableName) continue;
    analysis.tables.add(tableName);
    const columns = getColumnsForTable(analysis, tableName);
    for (const columnName of parseCreateTableColumns(match[2] ?? "")) {
      columns.add(columnName);
    }
  }

  for (const match of Array.from(
    sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?("?[\w]+"?)\s+([\s\S]*?);/gi)
  )) {
    const tableName = normalizeSqlIdentifier(match[1] ?? "");
    if (!tableName) continue;
    const body = match[2] ?? "";
    const columns = getColumnsForTable(analysis, tableName);
    for (const columnMatch of Array.from(body.matchAll(/add\s+column(?:\s+if\s+not\s+exists)?\s+"?([a-zA-Z_][\w]*)"?/gi))) {
      columns.add(columnMatch[1]);
    }
  }

  for (const match of Array.from(
    sql.matchAll(/create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\s+(?:public\.)?("?[\w]+"?)/gi)
  )) {
    const viewName = normalizeSqlIdentifier(match[1] ?? "");
    if (viewName) analysis.views.add(viewName);
  }

  for (const match of Array.from(sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:(\w+)\.)?("?[\w]+"?)\s*\(/gi))) {
    const schemaName = match[1] ?? "public";
    const functionName = normalizeSqlIdentifier(match[2] ?? "");
    if (!functionName) continue;
    analysis.functions.add(functionName);
    analysis.functions.add(`${schemaName}.${functionName}`);
  }

  for (const match of Array.from(
    sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?("?[\w]+"?)\s+enable\s+row\s+level\s+security/gi)
  )) {
    const tableName = normalizeSqlIdentifier(match[1] ?? "");
    if (tableName) analysis.rlsEnabledTables.add(tableName);
  }
}

function analyzeDashboardCode(root: string): DashboardCodeAnalysis {
  const files = discoverDashboardFiles(root);
  const tableRefs = new Map<string, Set<string>>();
  const rpcRefs = new Map<string, Set<string>>();
  const selectedColumnsByTable = new Map<string, Set<string>>();
  const staticDataFindings: string[] = [];

  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    const constants = extractStringConstants(source);

    for (const match of Array.from(source.matchAll(/\.from\(\s*["'`]([a-zA-Z_][\w]*)["'`]\s*\)/g))) {
      const tableName = match[1];
      addMapSetValue(tableRefs, tableName, relativePath);
      const selectText = findSelectTextAfter(source, match.index ?? 0, constants);
      if (selectText) {
        for (const columnName of Array.from(parseSelectColumns(selectText))) {
          addMapSetValue(selectedColumnsByTable, tableName, columnName);
        }
      }
    }

    for (const match of Array.from(source.matchAll(/\.rpc\(\s*["'`]([a-zA-Z_][\w.]*)["'`]\s*\)/g))) {
      addMapSetValue(rpcRefs, match[1], relativePath);
    }

    const staticHits = findStaticDataFindings(relativePath, source);
    staticDataFindings.push(...staticHits);
  }

  return {
    files,
    tableRefs,
    rpcRefs,
    selectedColumnsByTable,
    staticDataFindings: uniqueSorted(staticDataFindings)
  };
}

function discoverDashboardFiles(root: string) {
  const paths = new Set<string>();
  for (const scanRoot of DASHBOARD_SCAN_ROOTS) {
    const absoluteRoot = path.join(root, scanRoot);
    if (fs.existsSync(absoluteRoot)) {
      for (const filePath of listCodeFiles(absoluteRoot)) {
        paths.add(toRelativePath(root, filePath));
      }
    }
  }

  for (const relativePath of DASHBOARD_EXTRA_SCAN_FILES) {
    if (existsRelative(root, relativePath)) {
      paths.add(relativePath);
    }
  }

  return Array.from(paths).sort((left, right) => left.localeCompare(right));
}

function listCodeFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...listCodeFiles(entryPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      result.push(entryPath);
    }
  }
  return result;
}

function extractStringConstants(source: string) {
  const constants = new Map<string, string>();
  for (const match of Array.from(source.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*(["'`])([\s\S]*?)\2\s*;/g))) {
    constants.set(match[1], match[3] ?? "");
  }
  return constants;
}

function findSelectTextAfter(source: string, fromIndex: number, constants: Map<string, string>) {
  const windowText = source.slice(fromIndex, fromIndex + 900);
  const match = windowText.match(/\.select\(\s*(?:([A-Z][A-Z0-9_]*)|(["'`])([\s\S]*?)\2)/);
  if (!match) return null;
  if (match[1]) return constants.get(match[1]) ?? null;
  return match[3] ?? null;
}

function parseSelectColumns(selectText: string) {
  const columns = new Set<string>();
  for (const rawPart of selectText.replace(/\s+/g, " ").split(",")) {
    const part = rawPart.trim();
    if (!part || part === "*" || part.includes("(")) continue;
    const columnName = part.includes(":") ? part.split(":").pop() ?? "" : part;
    const normalized = columnName.trim().replace(/!inner/g, "");
    if (/^[a-zA-Z_][\w]*$/.test(normalized)) {
      columns.add(normalized);
    }
  }
  return columns;
}

function parseCreateTableColumns(body: string) {
  const columns: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    const cleaned = line.replace(/--.*$/, "").trim().replace(/,$/, "");
    if (!cleaned) continue;
    if (/^(constraint|primary|foreign|unique|check|exclude)\b/i.test(cleaned)) continue;
    const match = cleaned.match(/^"?([a-zA-Z_][\w]*)"?\s+/);
    if (match) columns.push(match[1]);
  }
  return columns;
}

function findStaticDataFindings(relativePath: string, source: string) {
  const findings: string[] = [];
  const lowerSource = source.toLowerCase();
  const checks = [
    { pattern: "sample-data", label: "sample-data" },
    { pattern: "mock", label: "mock" },
    { pattern: "static", label: "static" },
    { pattern: "placeholder", label: "placeholder" }
  ];

  for (const check of checks) {
    if (lowerSource.includes(check.pattern)) {
      findings.push(`${relativePath} (${check.label})`);
    }
  }

  return findings;
}

function getColumnsForTable(analysis: MigrationAnalysis, tableName: string) {
  let columns = analysis.columnsByTable.get(tableName);
  if (!columns) {
    columns = new Set<string>();
    analysis.columnsByTable.set(tableName, columns);
  }
  return columns;
}

function addMapSetValue(map: Map<string, Set<string>>, key: string, value: string) {
  const normalizedKey = key.trim();
  if (!normalizedKey) return;
  let values = map.get(normalizedKey);
  if (!values) {
    values = new Set<string>();
    map.set(normalizedKey, values);
  }
  values.add(value);
}

function sortedMapKeys(map: Map<string, Set<string>>) {
  return Array.from(map.keys()).sort((left, right) => left.localeCompare(right));
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function normalizeSqlIdentifier(value: string) {
  return value.trim().replace(/^"|"$/g, "");
}

function toRelativePath(root: string, filePath: string) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function readPackageInfo(root: string): PackageInfo {
  const packagePath = path.join(root, "package.json");
  if (!fs.existsSync(packagePath)) return { exists: false, name: null, scripts: {}, parseError: null };

  try {
    const parsed = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { name?: unknown; scripts?: unknown };
    return {
      exists: true,
      name: typeof parsed.name === "string" ? parsed.name : null,
      scripts: readStringRecord(parsed.scripts),
      parseError: null
    };
  } catch (error) {
    return {
      exists: true,
      name: null,
      scripts: {},
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") {
      result[key] = item;
    }
  }
  return result;
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

function commandStdout(command: string, args: string[], cwd: string) {
  const result = runCommand(command, args, cwd);
  return result.ok ? result.stdout.trim() : null;
}

function formatCommandFailure(result: CommandResult) {
  return result.stderr.trim() || result.error || result.stdout.trim() || `exit code ${result.status ?? "unknown"}`;
}

function readNpmVersion(cwd: string) {
  const fromUserAgent = parseNpmUserAgent(process.env.npm_config_user_agent);
  if (fromUserAgent) return fromUserAgent;

  const direct = commandStdout("npm", ["--version"], cwd);
  if (direct) return direct;

  if (process.platform === "win32") {
    return commandStdout("cmd.exe", ["/d", "/s", "/c", "npm --version"], cwd);
  }

  return null;
}

function parseNpmUserAgent(userAgent: string | undefined) {
  const match = userAgent?.match(/\bnpm\/([^\s]+)/);
  return match ? match[1] : null;
}

function parseGitStatus(output: string): GitStatusSummary {
  const items = output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const code = line.slice(0, 2);
      const pathText = normalizeGitPathText(line.length > 3 ? line.slice(3).trim() : line.trim());
      return {
        code,
        pathText,
        isSensitive: isSensitivePath(pathText)
      };
    });

  return {
    items,
    total: items.length,
    modified: items.filter((item) => item.code.includes("M")).length,
    untracked: items.filter((item) => item.code === "??").length,
    deleted: items.filter((item) => item.code.includes("D")).length,
    renamed: items.filter((item) => item.code.includes("R")).length,
    staged: items.filter((item) => item.code[0] !== " " && item.code[0] !== "?").length,
    hiddenSensitive: items.filter((item) => item.isSensitive).length,
    visiblePaths: items.filter((item) => !item.isSensitive).map((item) => item.pathText)
  };
}

function formatStatusSummary(status: GitStatusSummary) {
  if (status.total === 0) return "clean";

  const parts = [
    `changed=${status.total}`,
    `modified=${status.modified}`,
    `untracked=${status.untracked}`,
    `deleted=${status.deleted}`,
    `renamed=${status.renamed}`,
    `staged=${status.staged}`
  ];

  if (status.hiddenSensitive > 0) {
    parts.push(`env/secret paths hidden=${status.hiddenSensitive}`);
  }

  return parts.join("; ");
}

function addVisibleStatusPaths(report: Report, status: GitStatusSummary) {
  if (status.total === 0) return;
  const summarized = summarizePaths(status.visiblePaths, 12);
  report.add("INFO", "changed files (visible)", summarized || "only env/secret paths changed; hidden");
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

function isImportantChangePath(value: string) {
  const normalized = normalizeGitPathText(value).toLowerCase();
  if (IMPORTANT_FILES.has(normalized)) return true;
  return IMPORTANT_PREFIXES.some((prefix) => normalized.startsWith(prefix) || normalized.includes(` -> ${prefix}`));
}

function isSensitivePath(value: string) {
  const normalized = normalizeGitPathText(value).toLowerCase();
  const chunks = normalized.split(/\/|\s+->\s+|\s+/).filter(Boolean);
  return chunks.some((chunk) => {
    const fileName = chunk.split("/").pop() ?? chunk;
    return (
      fileName === ".env" ||
      fileName === ".env.local" ||
      fileName.startsWith(".env.") ||
      fileName.includes("secret") ||
      fileName.includes("api_key") ||
      fileName.includes("apikey")
    );
  });
}

function existsRelative(root: string, relativePath: string) {
  return fs.existsSync(path.join(root, relativePath));
}

function isInsideOrSamePath(candidate: string, parent: string) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function samePath(left: string, right: string) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function isOneDrivePath(value: string) {
  return path
    .resolve(value)
    .split(path.sep)
    .some((segment) => segment.toLowerCase().startsWith("onedrive"));
}

function stripAnsi(value: string) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

main();
