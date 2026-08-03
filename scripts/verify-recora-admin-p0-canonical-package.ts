import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const canonicalDir = path.join(
  repoRoot,
  "docs",
  "architecture",
  "recora-admin-p0",
  "canonical",
);
const manifestFile = "recora_admin_p0_canonical_manifest_v1.json";
const manifestPath = path.join(canonicalDir, manifestFile);
const manifestRepoPath = toRepoPath(path.relative(repoRoot, manifestPath));
const expectedManifestSha256 =
  "f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a";
const expectedDocuments = [
  "recora_admin_p0_state_model_v2_1.md",
  "recora_admin_p0_read_model_spec_v2_0.md",
  "recora_admin_p0_permissions_audit_spec_v2_0.md",
  "recora_admin_p0_common_layout_spec_v1_1.md",
  "recora_admin_p0_operations_home_spec_v1_1.md",
  "recora_admin_p0_customer_management_spec_v1_1.md",
  "recora_admin_p0_measurement_management_spec_v1_1.md",
  "recora_admin_p0_quality_exception_spec_v1_1.md",
  "recora_admin_p0_publication_management_spec_v1_1.md",
  "recora_admin_p0_operations_incident_audit_spec_v1_1.md",
  "recora_admin_p0_usage_cost_spec_v1_1.md",
  "recora_admin_p0_settings_spec_v1_1.md",
  "recora_admin_p0_final_integration_review_v1.md",
] as const;

type ByteSource = "head" | "index" | "worktree";
type DocumentResult = {
  file: string;
  bytes: number;
  sha256: string;
  source: ByteSource;
};

assert.ok(fs.existsSync(manifestPath), "Canonical manifest is missing from the worktree.");
assertGitTracked(manifestRepoPath);
assertGitClean(manifestRepoPath, "Canonical manifest must remain unchanged and unstaged.");

// Hash the exact repository blob, not the OS-dependent working-tree representation.
// This makes the check stable when Windows core.autocrlf renders a clean tracked file as CRLF.
const manifestBytes = readHeadBlob(manifestRepoPath);
assert.equal(
  sha256(manifestBytes),
  expectedManifestSha256,
  "Canonical manifest Git-blob SHA-256 does not match the M00-pinned value.",
);

const manifest = JSON.parse(manifestBytes.toString("utf8")) as {
  package_id?: unknown;
  version?: unknown;
  status?: unknown;
  documents?: Array<{ file?: unknown; sha256?: unknown }>;
  implementation_rule?: unknown;
};

assert.equal(manifest.package_id, "RECORA-ADMIN-P0-CANONICAL");
assert.equal(manifest.version, "1.0");
assert.equal(manifest.status, "formal");
assert.equal(
  manifest.implementation_rule,
  "Only documents listed here are formal implementation inputs.",
);
const manifestDocuments = manifest.documents;
assert.ok(Array.isArray(manifestDocuments), "Canonical manifest documents are required.");
assert.equal(manifestDocuments.length, expectedDocuments.length);

const expectedSet = new Set<string>(expectedDocuments);
const markdownFiles = fs
  .readdirSync(canonicalDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(
  markdownFiles,
  Array.from(expectedSet).sort(),
  "Canonical directory must contain exactly the 13 formal Markdown documents.",
);

const seen = new Set<string>();
const results: DocumentResult[] = [];

for (const entry of manifestDocuments) {
  const fileValue = entry.file;
  const hashValue = entry.sha256;
  assert.equal(typeof fileValue, "string");
  assert.equal(typeof hashValue, "string");
  if (typeof fileValue !== "string" || typeof hashValue !== "string") {
    throw new Error("Canonical manifest document entries must use string file and sha256 values.");
  }

  const file = fileValue;
  const expectedHash = hashValue;

  assert.equal(path.basename(file), file, `Canonical document path must be a basename: ${file}`);
  assert.ok(expectedSet.has(file), `Unexpected canonical document: ${file}`);
  assert.ok(!seen.has(file), `Duplicate canonical document: ${file}`);
  assert.match(expectedHash, /^[0-9a-f]{64}$/);
  seen.add(file);

  const documentPath = path.join(canonicalDir, file);
  const documentRepoPath = toRepoPath(path.relative(repoRoot, documentPath));
  assert.ok(fs.existsSync(documentPath), `Canonical document is missing: ${file}`);

  const { bytes, source } = readCandidateBytes(documentRepoPath, documentPath);
  const actualHash = sha256(bytes);
  assert.equal(actualHash, expectedHash, `Canonical document hash mismatch: ${file}`);
  assert.equal(
    bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
    false,
    `BOM is forbidden: ${file}`,
  );

  const text = bytes.toString("utf8");
  const trailingWhitespaceLine = text
    .split(/\n/)
    .findIndex((line) => /[ \t]\r?$/.test(line));
  assert.equal(
    trailingWhitespaceLine,
    -1,
    `Trailing whitespace found in ${file} line ${trailingWhitespaceLine + 1}`,
  );

  results.push({ file, bytes: bytes.length, sha256: actualHash, source });
}

assert.deepEqual(Array.from(seen).sort(), Array.from(expectedSet).sort());

console.log(
  JSON.stringify(
    {
      status: "ok",
      packageId: manifest.package_id,
      version: manifest.version,
      manifestSha256: expectedManifestSha256,
      manifestSource: "head",
      documents: results,
    },
    null,
    2,
  ),
);

function readCandidateBytes(
  repoPath: string,
  worktreePath: string,
): { bytes: Buffer; source: ByteSource } {
  if (!gitSucceeds(["ls-files", "--error-unmatch", "--", repoPath])) {
    // New files are intentionally verified from the exact bytes copied from the bundle.
    return { bytes: fs.readFileSync(worktreePath), source: "worktree" };
  }

  const stagedChanged = !gitSucceeds(["diff", "--cached", "--quiet", "--", repoPath]);
  const worktreeChanged = !gitSucceeds(["diff", "--quiet", "--", repoPath]);

  assert.equal(
    stagedChanged && worktreeChanged,
    false,
    `Canonical document has both staged and unstaged changes: ${repoPath}`,
  );

  if (stagedChanged) {
    return { bytes: runGitBytes(["show", `:${repoPath}`]), source: "index" };
  }
  if (worktreeChanged) {
    return { bytes: fs.readFileSync(worktreePath), source: "worktree" };
  }
  return { bytes: readHeadBlob(repoPath), source: "head" };
}

function readHeadBlob(repoPath: string): Buffer {
  return runGitBytes(["cat-file", "blob", `HEAD:${repoPath}`]);
}

function assertGitTracked(repoPath: string): void {
  assert.ok(
    gitSucceeds(["ls-files", "--error-unmatch", "--", repoPath]),
    `Expected tracked repository file: ${repoPath}`,
  );
}

function assertGitClean(repoPath: string, message: string): void {
  assert.ok(gitSucceeds(["diff", "--quiet", "--", repoPath]), message);
  assert.ok(gitSucceeds(["diff", "--cached", "--quiet", "--", repoPath]), message);
}

function gitSucceeds(args: string[]): boolean {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`git ${args.join(" ")} failed: ${sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}`);
}

function runGitBytes(args: string[]): Buffer {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: null,
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} failed: ${sanitize(Buffer.concat([
      Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.alloc(0),
      Buffer.from("\n"),
      Buffer.isBuffer(result.stderr) ? result.stderr : Buffer.alloc(0),
    ]).toString("utf8"))}`,
  );
  return Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? "");
}

function toRepoPath(value: string): string {
  return value.replaceAll("\\", "/");
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function sanitize(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-local-db-url]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]");
}
