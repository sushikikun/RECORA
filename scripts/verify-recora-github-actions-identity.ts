import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

type PullRequestPayloadOptions = {
  baseRef?: string;
  baseSha: string;
  headRef?: string;
  headSha: string;
  repositoryName?: string;
};

type Scenario = {
  name: string;
  payload: PullRequestPayloadOptions;
  expectedStatus: number;
  expectedText: string;
};

const OFFICIAL_REPOSITORY = "sushikikun/RECORA";
const repoRoot = path.resolve(process.cwd());
const devChecksScript = path.join(repoRoot, "scripts", "recora-dev-checks.ts");
const tsxLoader = path.join(repoRoot, "node_modules", "tsx", "dist", "loader.mjs");
const tsxLoaderImportSpecifier = pathToFileURL(tsxLoader).href;
const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "recora-github-actions-identity-"));
const checkoutRoot = path.join(sandboxRoot, "checkout");
const eventPath = path.join(sandboxRoot, "event.json");

try {
  fs.mkdirSync(checkoutRoot, { recursive: true });
  initializeRepository(checkoutRoot);
  const commits = createPullRequestMerge(checkoutRoot);

  const scenarios: Scenario[] = [
    {
      name: "accepts a verified merge commit when the event base SHA is stale",
      payload: {
        baseSha: commits.staleBase,
        headSha: commits.head
      },
      expectedStatus: 0,
      expectedText: "official GitHub Actions checkout"
    },
    {
      name: "rejects a merge commit whose head parent differs from the event head SHA",
      payload: {
        baseSha: commits.staleBase,
        headSha: commits.staleBase
      },
      expectedStatus: 1,
      expectedText: "pull request head commit does not match the checked-out merge commit"
    },
    {
      name: "rejects a pull request that does not target master",
      payload: {
        baseRef: "develop",
        baseSha: commits.staleBase,
        headSha: commits.head
      },
      expectedStatus: 1,
      expectedText: "pull request base branch is not master"
    },
    {
      name: "rejects a pull request from a different repository",
      payload: {
        baseSha: commits.staleBase,
        headSha: commits.head,
        repositoryName: "someone/RECORA"
      },
      expectedStatus: 1,
      expectedText: "GitHub event repository is not the official non-fork Recora repository"
    }
  ];

  let failures = 0;
  for (const scenario of scenarios) {
    const result = runScenario(checkoutRoot, eventPath, commits.merge, scenario);
    if (result.status === scenario.expectedStatus && result.output.includes(scenario.expectedText)) {
      console.log(`[PASS] ${scenario.name}`);
      continue;
    }

    failures += 1;
    console.error(`[FAIL] ${scenario.name}`);
    console.error(`expected status=${scenario.expectedStatus} and text=${JSON.stringify(scenario.expectedText)}`);
    console.error(`actual status=${result.status}`);
    console.error(result.output.trim());
  }

  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log(`[PASS] GitHub Actions identity regression scenarios: ${scenarios.length}/${scenarios.length}`);
  }
} finally {
  fs.rmSync(sandboxRoot, { recursive: true, force: true });
}

function initializeRepository(targetRoot: string) {
  runGit(targetRoot, ["init", "--initial-branch=master"]);
  runGit(targetRoot, ["config", "user.name", "Recora CI Fixture"]);
  runGit(targetRoot, ["config", "user.email", "recora-ci-fixture@example.invalid"]);
  runGit(targetRoot, ["remote", "add", "origin", "https://github.com/sushikikun/RECORA.git"]);

  fs.writeFileSync(
    path.join(targetRoot, "package.json"),
    JSON.stringify({ name: "recora-dashboard", private: true }, null, 2)
  );
  for (const relativePath of [
    "app",
    "components/recora",
    "lib/recora",
    "lib/supabase",
    "supabase",
    ".agents/skills"
  ]) {
    fs.mkdirSync(path.join(targetRoot, relativePath), { recursive: true });
  }
  runGit(targetRoot, ["add", "package.json"]);
  runGit(targetRoot, ["commit", "-m", "fixture: initial base"]);
}

function createPullRequestMerge(targetRoot: string) {
  const staleBase = gitStdout(targetRoot, ["rev-parse", "HEAD"]);

  runGit(targetRoot, ["switch", "-c", "feature/identity-check"]);
  fs.writeFileSync(path.join(targetRoot, "feature.txt"), "feature\n");
  runGit(targetRoot, ["add", "feature.txt"]);
  runGit(targetRoot, ["commit", "-m", "fixture: feature head"]);
  const head = gitStdout(targetRoot, ["rev-parse", "HEAD"]);

  runGit(targetRoot, ["switch", "master"]);
  fs.writeFileSync(path.join(targetRoot, "master.txt"), "master advanced\n");
  runGit(targetRoot, ["add", "master.txt"]);
  runGit(targetRoot, ["commit", "-m", "fixture: current master"]);
  runGit(targetRoot, ["merge", "--no-ff", "feature/identity-check", "-m", "fixture: pull request merge"]);
  const merge = gitStdout(targetRoot, ["rev-parse", "HEAD"]);

  return { staleBase, head, merge };
}

function runScenario(
  targetRoot: string,
  targetEventPath: string,
  mergeSha: string,
  scenario: Scenario
) {
  const baseRef = scenario.payload.baseRef ?? "master";
  const headRef = scenario.payload.headRef ?? "feature/identity-check";
  const repositoryName = scenario.payload.repositoryName ?? OFFICIAL_REPOSITORY;
  const payload = {
    number: 71,
    repository: {
      full_name: repositoryName,
      fork: false
    },
    pull_request: {
      base: {
        ref: baseRef,
        sha: scenario.payload.baseSha,
        repo: {
          full_name: repositoryName,
          fork: false
        }
      },
      head: {
        ref: headRef,
        sha: scenario.payload.headSha,
        repo: {
          full_name: repositoryName,
          fork: false
        }
      }
    }
  };
  fs.writeFileSync(targetEventPath, JSON.stringify(payload));

  const result = spawnSync(process.execPath, ["--import", tsxLoaderImportSpecifier, devChecksScript, "whereami"], {
    cwd: targetRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      USERPROFILE: "",
      GITHUB_ACTIONS: "true",
      GITHUB_REPOSITORY: OFFICIAL_REPOSITORY,
      GITHUB_WORKSPACE: targetRoot,
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_SHA: mergeSha,
      GITHUB_REF: "refs/pull/71/merge",
      GITHUB_BASE_REF: baseRef,
      GITHUB_HEAD_REF: headRef,
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_EVENT_PATH: targetEventPath
    }
  });

  return {
    status: result.status,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  };
}

function runGit(targetRoot: string, args: string[]) {
  const result = spawnSync("git", args, {
    cwd: targetRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr?.trim() || result.stdout?.trim() || result.status}`
    );
  }
}

function gitStdout(targetRoot: string, args: string[]) {
  const result = spawnSync("git", args, {
    cwd: targetRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr?.trim() || result.stdout?.trim() || result.status}`
    );
  }
  return result.stdout.trim();
}
