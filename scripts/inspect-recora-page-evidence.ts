import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  createPageEvidenceSnapshot,
  createPageEvidenceSnapshotFromHtml,
  parsePageSourceType,
  type PageEvidenceInputItem
} from "../lib/recora/page-evidence";

type Options = {
  inputPath: string | null;
  outputPath: string | null;
  fromFixture: boolean;
  maxBytes: number;
  timeoutMs: number;
};

const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_TIMEOUT_MS = 10_000;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.inputPath) throw new Error("--input <path> is required.");
  if (!options.outputPath) throw new Error("--output <path> is required.");

  const inputPath = path.resolve(options.inputPath);
  const outputPath = path.resolve(options.outputPath);
  const input = await readInput(inputPath);
  const snapshots = [];

  for (const item of input) {
    const sourceType = parsePageSourceType(item.source_type);
    if (item.html_fixture_path) {
      const htmlPath = path.resolve(path.dirname(inputPath), item.html_fixture_path);
      const html = await fs.readFile(htmlPath, "utf8");
      snapshots.push(createPageEvidenceSnapshotFromHtml({
        url: item.url,
        sourceType,
        html
      }));
      continue;
    }

    if (options.fromFixture) {
      throw new Error(`--from-fixture requires html_fixture_path for ${item.url}`);
    }

    snapshots.push(await createPageEvidenceSnapshot({
      url: item.url,
      sourceType,
      fetchOptions: {
        maxBytes: options.maxBytes,
        timeoutMs: options.timeoutMs
      }
    }));
  }

  const output = {
    schema_version: "page_evidence_snapshot_cli_v1",
    generated_at: new Date().toISOString(),
    input_path: relativeForDisplay(inputPath),
    from_fixture: options.fromFixture,
    snapshot_count: snapshots.length,
    snapshots,
    safety: {
      database_write_performed: false,
      openai_api_called: false,
      external_url_search_performed: false,
      remote_migration_performed: false
    }
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    status: "ok",
    outputPath: relativeForDisplay(outputPath),
    snapshotCount: snapshots.length
  }, null, 2));
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    inputPath: null,
    outputPath: null,
    fromFixture: false,
    maxBytes: DEFAULT_MAX_BYTES,
    timeoutMs: DEFAULT_TIMEOUT_MS
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--input" && next) {
      options.inputPath = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.slice("--input=".length);
      continue;
    }
    if (arg === "--output" && next) {
      options.outputPath = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length);
      continue;
    }
    if (arg === "--from-fixture") {
      options.fromFixture = true;
      continue;
    }
    if (arg === "--max-bytes" && next) {
      options.maxBytes = parsePositiveInteger(next, "--max-bytes");
      index += 1;
      continue;
    }
    if (arg.startsWith("--max-bytes=")) {
      options.maxBytes = parsePositiveInteger(arg.slice("--max-bytes=".length), "--max-bytes");
      continue;
    }
    if (arg === "--timeout-ms" && next) {
      options.timeoutMs = parsePositiveInteger(next, "--timeout-ms");
      index += 1;
      continue;
    }
    if (arg.startsWith("--timeout-ms=")) {
      options.timeoutMs = parsePositiveInteger(arg.slice("--timeout-ms=".length), "--timeout-ms");
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

async function readInput(inputPath: string): Promise<PageEvidenceInputItem[]> {
  const parsed = JSON.parse(await fs.readFile(inputPath, "utf8")) as unknown;
  const items = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.pages)
      ? parsed.pages
      : null;
  if (!items) throw new Error("Input JSON must be an array or an object with a pages array.");
  return items.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Input item ${index} must be an object.`);
    if (typeof item.url !== "string" || !item.url.trim()) throw new Error(`Input item ${index} is missing url.`);
    return {
      url: item.url,
      source_type: parsePageSourceType(item.source_type),
      html_fixture_path: typeof item.html_fixture_path === "string" ? item.html_fixture_path : undefined
    };
  });
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function relativeForDisplay(value: string) {
  const relative = path.relative(process.cwd(), value);
  return relative && !relative.startsWith("..") ? relative.replace(/\\/g, "/") : value.replace(/\\/g, "/");
}

function printHelp() {
  console.log(`Usage:
  npm run recora:page-evidence:inspect -- --input fixtures/page-evidence/input.json --output .tmp/page-evidence/snapshots.json --from-fixture

Options:
  --input <path>       JSON array or { "pages": [...] } input.
  --output <path>      Local JSON output path.
  --from-fixture       Require html_fixture_path and skip URL fetches.
  --max-bytes <n>      HTML max byte limit for live fetches. Default: ${DEFAULT_MAX_BYTES}.
  --timeout-ms <n>     Fetch timeout for live fetches. Default: ${DEFAULT_TIMEOUT_MS}.
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
