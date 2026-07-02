import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import {
  buildPageEvidenceSnapshotFromFetchResult,
  createPageEvidenceSnapshotFromHtml,
  fetchPageEvidenceUrl,
  normalizePageEvidenceUrl,
  type PageFetchResult
} from "../lib/recora/page-evidence";

async function main() {
  const fixtureDir = path.join(process.cwd(), "fixtures", "page-evidence");
  const normalHtml = await fs.readFile(path.join(fixtureDir, "normal.html"), "utf8");
  const noindexHtml = await fs.readFile(path.join(fixtureDir, "noindex-nosnippet.html"), "utf8");
  const canonicalHtml = await fs.readFile(path.join(fixtureDir, "canonical-conflict.html"), "utf8");
  const brokenJsonLdHtml = await fs.readFile(path.join(fixtureDir, "broken-jsonld.html"), "utf8");
  const noisyHtml = await fs.readFile(path.join(fixtureDir, "nav-footer-noise.html"), "utf8");

  const normalized = normalizePageEvidenceUrl("https://Example.com/service#section");
  assert.equal(normalized.ok, true);
  assert.equal(normalized.url, "https://example.com/service");
  assert.ok(normalized.warnings.some((warning) => warning.code === "hash_fragment_removed"));
  assert.equal(normalizePageEvidenceUrl("ftp://example.com/file").ok, false);

  const normal = createPageEvidenceSnapshotFromHtml({
    url: "https://example.com/service",
    sourceType: "owned_page",
    html: normalHtml,
    fetchedAt: "2026-06-28T00:00:00.000Z"
  });
  assert.equal(normal.fetch_status, "ok");
  assert.equal(normal.title, "Recora AI Search Visibility Diagnosis");
  assert.equal(normal.h1, "AI search visibility diagnosis for B2B teams");
  assert.equal(normal.canonical_url, "https://example.com/service");
  assert.ok(normal.json_ld_types.includes("SoftwareApplication"));
  assert.ok(normal.json_ld_types.includes("FAQPage"));
  assert.ok(normal.text_blocks.some((block) => block.heading_path.includes("What the report includes")));
  assert.ok(normal.text_blocks.some((block) => block.text.includes("citation readiness")));

  const noindex = createPageEvidenceSnapshotFromHtml({
    url: "https://example.com/private",
    sourceType: "owned_page",
    html: noindexHtml
  });
  assert.equal(noindex.has_noindex, true);
  assert.equal(noindex.has_nofollow, true);
  assert.equal(noindex.has_nosnippet, true);
  assert.equal(noindex.data_nosnippet_count, 2);

  const canonical = createPageEvidenceSnapshotFromHtml({
    url: "https://example.com/campaign",
    sourceType: "owned_page",
    html: canonicalHtml
  });
  assert.equal(canonical.canonical_url, "https://example.com/service");

  const brokenJsonLd = createPageEvidenceSnapshotFromHtml({
    url: "https://example.com/broken-jsonld",
    sourceType: "third_party_source",
    html: brokenJsonLdHtml
  });
  assert.equal(brokenJsonLd.schema_warnings.length, 1);
  assert.equal(brokenJsonLd.schema_warnings[0].code, "json_ld_parse_failed");

  const noisy = createPageEvidenceSnapshotFromHtml({
    url: "https://example.com/noisy",
    sourceType: "competitor_page",
    html: noisyHtml
  });
  const noisyText = noisy.text_blocks.map((block) => block.text).join(" ");
  assert.equal(noisyText.includes("Global navigation should not become evidence"), false);
  assert.equal(noisyText.includes("Footer links should not become evidence"), false);
  assert.equal(noisyText.includes("Real comparison evidence stays in the body"), true);

  const httpError = buildPageEvidenceSnapshotFromFetchResult(createFetchResult({
    fetch_status: "http_error",
    http_status: 404,
    fetch_error: "HTTP status 404"
  }), "third_party_source");
  assert.equal(httpError.fetch_status, "http_error");
  assert.equal(httpError.http_status, 404);
  assert.deepEqual(httpError.text_blocks, []);

  const timeout = await fetchPageEvidenceUrl({
    url: "https://example.com/timeout",
    sourceType: "unknown_source",
    options: {
      timeoutMs: 1,
      fetchImpl: timeoutFetch
    }
  });
  assert.equal(timeout.fetch_status, "timeout");
  const timeoutSnapshot = buildPageEvidenceSnapshotFromFetchResult(timeout, "unknown_source");
  assert.equal(timeoutSnapshot.fetch_status, "timeout");
  assert.deepEqual(timeoutSnapshot.text_blocks, []);

  await runCliFixtureCheck();

  console.log(JSON.stringify({
    status: "ok",
    checkedCases: {
      urlNormalization: true,
      metaRobotsNoindex: true,
      canonicalExtraction: true,
      dataNosnippetCount: true,
      jsonLdTypes: true,
      brokenJsonLdWarning: true,
      headingPathTextBlocks: true,
      noiseExclusion: true,
      fetchFailureSnapshot: true,
      localJsonOutput: true
    }
  }, null, 2));
}

function createFetchResult(overrides: Partial<PageFetchResult>): PageFetchResult {
  return {
    requested_url: "https://example.com/not-found",
    final_url: "https://example.com/not-found",
    http_status: null,
    redirect_count: 0,
    content_type: "text/html",
    content_length: null,
    fetched_at: "2026-06-28T00:00:00.000Z",
    fetch_status: "fetch_failed",
    fetch_error: "failed",
    raw_html_hash: null,
    content_hash: "fixture-content-hash",
    html: null,
    cache_key: "fixture-cache-key",
    ...overrides
  };
}

const timeoutFetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
  return new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    signal?.addEventListener("abort", () => reject(abortError()), { once: true });
  });
}) as typeof fetch;

function abortError() {
  const error = new Error("aborted");
  error.name = "AbortError";
  return error;
}

async function runCliFixtureCheck() {
  const tsxCliPath = resolveTsxCliPath();

  const outputPath = path.join(process.cwd(), ".tmp", "page-evidence-test", "snapshots.json");
  const result = spawnSync(process.execPath, [
    tsxCliPath,
    "scripts/inspect-recora-page-evidence.ts",
    "--input",
    path.join("fixtures", "page-evidence", "input.json"),
    "--output",
    outputPath,
    "--from-fixture"
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const output = JSON.parse(await fs.readFile(outputPath, "utf8")) as unknown;
  assert.ok(isRecord(output));
  assert.equal(output.snapshot_count, 2);
  assert.equal(output.safety && isRecord(output.safety) ? output.safety.database_write_performed : null, false);
}

function resolveTsxCliPath() {
  const candidates = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs")
  ];
  for (const searchPath of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!searchPath) continue;
    candidates.push(path.resolve(searchPath, "..", "tsx", "dist", "cli.mjs"));
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("tsx CLI must exist for fixture CLI check.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
