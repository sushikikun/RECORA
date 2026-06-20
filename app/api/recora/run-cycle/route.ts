import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_MEASUREMENT_PROFILE_ID,
  getMeasurementProfile,
  getMeasurementProfileIds,
  isMeasurementProfileId,
  type MeasurementProfileId
} from "@/lib/recora/measurement-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PROJECT_SLUG = "mieruca-seo-demo";
const DEFAULT_PROMPT_LIMIT = 1;
const DEFAULT_SEARCH_MODE = "both";
const MAX_PROMPT_LIMIT = 3;
const EXECUTION_TIMEOUT_MS = 180_000;

type RequestMode = "dry-run" | "execute";
type SearchMode = "no-search" | "web-search" | "both";
type JsonRecord = Record<string, unknown>;
type NormalizedInput = {
  projectSlug: string;
  promptLimit: number | null;
  profileId: MeasurementProfileId | null;
  searchMode: SearchMode;
  mode: RequestMode;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = normalizeInput(body);
    const command = buildCycleCommand(input);
    const result = await runCycleCommand(command);

    return Response.json({
      ok: true,
      smallScaleExecution: input.mode === "execute",
      command: command.displayCommand,
      result
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: sanitizeError(error)
      },
      { status: 400 }
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function normalizeInput(body: unknown) {
  const record = isRecord(body) ? body : {};
  const projectSlug = getString(record.projectSlug) ?? DEFAULT_PROJECT_SLUG;
  const hasPromptLimit = record.promptLimit !== undefined && record.promptLimit !== null;
  const rawProfileId = getString(record.profileId);
  let profileId: MeasurementProfileId | null = null;

  if (rawProfileId) {
    if (!isMeasurementProfileId(rawProfileId)) {
      throw new Error(`Unknown measurement profile: ${rawProfileId}. Allowed profiles: ${getMeasurementProfileIds().join(", ")}.`);
    }
    if (hasPromptLimit) {
      throw new Error("profileId and promptLimit cannot be used together.");
    }
    profileId = rawProfileId;
  } else if (!hasPromptLimit) {
    profileId = DEFAULT_MEASUREMENT_PROFILE_ID;
  }

  const promptLimit = profileId ? null : clampPromptLimit(getNumber(record.promptLimit) ?? DEFAULT_PROMPT_LIMIT);
  const searchMode = normalizeSearchMode(getString(record.searchMode));
  const mode = normalizeMode(getString(record.mode));

  return {
    projectSlug,
    promptLimit,
    profileId,
    searchMode,
    mode
  } satisfies NormalizedInput;
}

function buildCycleCommand(input: NormalizedInput) {
  const tsxCliPath = resolveTsxCliPath();
  const promptSelectionArgs = input.profileId
    ? ["--profile", getMeasurementProfile(input.profileId)?.id ?? input.profileId]
    : ["--prompt-limit", String(input.promptLimit ?? DEFAULT_PROMPT_LIMIT)];
  const args = [
    tsxCliPath,
    "scripts/run-recora-cycle.ts",
    "--project-slug",
    input.projectSlug,
    ...promptSelectionArgs,
    "--search-mode",
    input.searchMode
  ];

  if (input.mode === "execute") {
    args.push("--execute", "--apply-aggregate");
  }

  return {
    executable: process.execPath,
    args,
    displayCommand: ["node", relativeForDisplay(tsxCliPath), "scripts/run-recora-cycle.ts", ...args.slice(2)]
  };
}

async function runCycleCommand(command: ReturnType<typeof buildCycleCommand>) {
  return new Promise<JsonRecord>((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      windowsHide: true
    });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`run-recora-cycle timed out after ${EXECUTION_TIMEOUT_MS / 1000} seconds.`));
    }, EXECUTION_TIMEOUT_MS);
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`run-recora-cycle failed with exit code ${code}. ${summarizeText(stderr)}`));
        return;
      }

      try {
        resolve(parseJsonFromStdout(stdout));
      } catch (error) {
        reject(new Error(`run-recora-cycle returned unreadable JSON. stdoutTail=${summarizeText(stdout.slice(-1000))}`));
      }
    });
  });
}

function parseJsonFromStdout(stdout: string): JsonRecord {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("stdout was empty.");

  try {
    return asRequiredRecord(JSON.parse(trimmed));
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object found in stdout.");
    return asRequiredRecord(JSON.parse(trimmed.slice(start, end + 1)));
  }
}

function resolveTsxCliPath() {
  const tsxCliPath = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsxCliPath)) {
    throw new Error("Local tsx runner was not found. Run npm install before using the measurement UI.");
  }
  return tsxCliPath;
}

function relativeForDisplay(value: string) {
  const relative = path.relative(process.cwd(), value);
  return relative && !relative.startsWith("..") ? relative.replace(/\\/g, "/") : value.replace(/\\/g, "/");
}

function normalizeMode(value: string | null): RequestMode {
  return value === "execute" ? "execute" : "dry-run";
}

function normalizeSearchMode(value: string | null): SearchMode {
  if (value === "no-search" || value === "web-search" || value === "both") return value;
  return DEFAULT_SEARCH_MODE;
}

function clampPromptLimit(value: number) {
  return Math.max(1, Math.min(MAX_PROMPT_LIMIT, Math.floor(value)));
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRequiredRecord(value: unknown): JsonRecord {
  if (!isRecord(value)) throw new Error("Parsed JSON was not an object.");
  return value;
}

function summarizeText(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 500 ? `${cleaned.slice(0, 500)}...` : cleaned;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown run-cycle error.";
  return message
    .replace(/OPENAI_API_KEY=[^\s]+/g, "OPENAI_API_KEY=[redacted]")
    .replace(/SUPABASE_SERVICE_ROLE_KEY=[^\s]+/g, "SUPABASE_SERVICE_ROLE_KEY=[redacted]")
    .replace(/SUPABASE_ANON_KEY=[^\s]+/g, "SUPABASE_ANON_KEY=[redacted]")
    .replace(/RECORA_DATABASE_URL=[^\s]+/g, "RECORA_DATABASE_URL=[redacted]");
}
