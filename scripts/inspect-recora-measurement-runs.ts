import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import net from "node:net";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_LIMIT = 5;
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type Row = Record<string, string | null>;
type PgMessage = { type: string; payload: Buffer };

type Options = {
  projectSlug: string;
  measurementRunId: string | null;
  limit: number;
};

type ProjectRow = Row & {
  id: string;
  slug: string;
  name: string;
};

type MeasurementRunInspectionRow = Row & {
  id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  run_kind: string | null;
  data_source: string | null;
  prompt_count: string | null;
  expected_run_items: string | null;
  search_mode: string | null;
  source_run_id: string | null;
  run_item_count: string;
  completed_item_count: string;
  failed_item_count: string;
  skipped_item_count: string;
  conversation_count: string;
  brand_mention_count: string;
  citation_count: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const databaseTarget = parseDatabaseTarget(databaseUrl);
  const db = new LocalPostgresClient(databaseUrl);

  await db.connect();
  try {
    await db.query("begin read only");
    try {
      const project = await getProject(db, options.projectSlug);
      const runs = await getMeasurementRuns(db, project.id, options);
      await db.query("commit");
      console.log(
        JSON.stringify(
          {
            projectSlug: project.slug,
            databaseTarget: databaseTarget.isLocal ? "local" : "non-local",
            limit: options.limit,
            measurementRunId: options.measurementRunId,
            runCount: runs.length,
            runs: runs.map(formatRun),
            note:
              "Read-only inspection via RECORA_DATABASE_URL. No REST API secret key is printed or required by this script."
          },
          null,
          2
        )
      );
    } catch (error) {
      await db.query("rollback");
      throw error;
    }
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    projectSlug: "",
    measurementRunId: null,
    limit: DEFAULT_LIMIT
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--project-slug" && next) {
      options.projectSlug = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--project-slug=")) {
      options.projectSlug = arg.slice("--project-slug=".length);
      continue;
    }
    if (arg === "--measurement-run-id" && next) {
      options.measurementRunId = next;
      index += 1;
      continue;
    }
    if (arg.startsWith("--measurement-run-id=")) {
      options.measurementRunId = arg.slice("--measurement-run-id=".length);
      continue;
    }
    if (arg === "--limit" && next) {
      options.limit = parsePositiveInteger(next, "--limit");
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = parsePositiveInteger(arg.slice("--limit=".length), "--limit");
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (!options.projectSlug) throw new Error("--project-slug is required.");
  return options;
}

async function getProject(db: LocalPostgresClient, slug: string) {
  const rows = await db.query<ProjectRow>(`
    select id::text as id, slug, name
    from public.projects
    where slug = ${lit(slug)}
    limit 1
  `);
  if (!rows[0]) throw new Error(`Project not found: ${slug}`);
  return rows[0];
}

async function getMeasurementRuns(db: LocalPostgresClient, projectId: string, options: Options) {
  const runFilter = options.measurementRunId ? `and mr.id = ${uuid(options.measurementRunId)}` : "";
  return db.query<MeasurementRunInspectionRow>(`
    with target_runs as (
      select
        mr.id,
        mr.status,
        mr.started_at,
        mr.completed_at,
        mr.created_at,
        mr.metadata
      from public.measurement_runs mr
      where mr.project_id = ${uuid(projectId)}
        ${runFilter}
      order by mr.created_at desc
      limit ${num(options.measurementRunId ? 1 : options.limit)}
    ),
    item_counts as (
      select
        ri.run_id,
        count(*)::text as run_item_count,
        count(*) filter (where ri.status = 'completed')::text as completed_item_count,
        count(*) filter (where ri.status = 'failed')::text as failed_item_count,
        count(*) filter (where ri.status = 'skipped')::text as skipped_item_count
      from public.run_items ri
      join target_runs tr on tr.id = ri.run_id
      group by ri.run_id
    ),
    conversation_counts as (
      select
        ri.run_id,
        count(ac.id)::text as conversation_count
      from public.run_items ri
      join target_runs tr on tr.id = ri.run_id
      left join public.ai_conversations ac on ac.run_item_id = ri.id
      group by ri.run_id
    ),
    mention_counts as (
      select
        ri.run_id,
        count(bm.id)::text as brand_mention_count
      from public.run_items ri
      join target_runs tr on tr.id = ri.run_id
      left join public.ai_conversations ac on ac.run_item_id = ri.id
      left join public.brand_mentions bm on bm.conversation_id = ac.id
      group by ri.run_id
    ),
    citation_counts as (
      select
        ri.run_id,
        count(c.id)::text as citation_count
      from public.run_items ri
      join target_runs tr on tr.id = ri.run_id
      left join public.ai_conversations ac on ac.run_item_id = ri.id
      left join public.citations c on c.conversation_id = ac.id
      group by ri.run_id
    )
    select
      tr.id::text as id,
      tr.status::text as status,
      tr.started_at::text as started_at,
      tr.completed_at::text as completed_at,
      tr.created_at::text as created_at,
      tr.metadata->>'run_kind' as run_kind,
      tr.metadata->>'data_source' as data_source,
      tr.metadata->>'prompt_count' as prompt_count,
      tr.metadata->>'expected_run_items' as expected_run_items,
      tr.metadata->>'search_mode' as search_mode,
      tr.metadata->>'source_run_id' as source_run_id,
      coalesce(ic.run_item_count, '0') as run_item_count,
      coalesce(ic.completed_item_count, '0') as completed_item_count,
      coalesce(ic.failed_item_count, '0') as failed_item_count,
      coalesce(ic.skipped_item_count, '0') as skipped_item_count,
      coalesce(cc.conversation_count, '0') as conversation_count,
      coalesce(mc.brand_mention_count, '0') as brand_mention_count,
      coalesce(ct.citation_count, '0') as citation_count
    from target_runs tr
    left join item_counts ic on ic.run_id = tr.id
    left join conversation_counts cc on cc.run_id = tr.id
    left join mention_counts mc on mc.run_id = tr.id
    left join citation_counts ct on ct.run_id = tr.id
    order by tr.created_at desc
  `);
}

function formatRun(row: MeasurementRunInspectionRow) {
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    metadata: {
      runKind: row.run_kind,
      dataSource: row.data_source,
      promptCount: toNumberOrNull(row.prompt_count),
      expectedRunItems: toNumberOrNull(row.expected_run_items),
      searchMode: row.search_mode,
      sourceRunId: row.source_run_id
    },
    counts: {
      runItems: toNumber(row.run_item_count),
      completedItems: toNumber(row.completed_item_count),
      failedItems: toNumber(row.failed_item_count),
      skippedItems: toNumber(row.skipped_item_count),
      aiConversations: toNumber(row.conversation_count),
      brandMentions: toNumber(row.brand_mention_count),
      citations: toNumber(row.citation_count)
    }
  };
}

function parseDatabaseTarget(databaseUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("RECORA_DATABASE_URL is not a valid Postgres connection URL.");
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("RECORA_DATABASE_URL must use the postgres or postgresql protocol.");
  }
  return {
    isLocal: LOCAL_DATABASE_HOSTS.has(parsed.hostname)
  };
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function toNumber(value: string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumberOrNull(value: string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

function num(value: number) {
  return Number.isFinite(value) ? String(Math.trunc(value)) : "0";
}

class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) {
    this.url = new URL(databaseUrl);
  }

  async connect() {
    const socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port || 5432) });
    this.socket = socket;
    socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      for (const waiter of this.waiters.splice(0)) waiter();
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    this.sendStartup();
    await this.authenticate();
  }

  end() {
    if (!this.socket || this.socket.destroyed) return;
    this.sendMessage("X", Buffer.alloc(0));
    this.socket.end();
  }

  async query<T extends Row = Row>(queryText: string): Promise<T[]> {
    this.sendMessage("Q", Buffer.from(`${queryText}\0`, "utf8"));
    const fields: string[] = [];
    const rows: T[] = [];
    while (true) {
      const message = await this.readMessage();
      if (message.type === "T") fields.splice(0, fields.length, ...parseRowDescription(message.payload));
      else if (message.type === "D") rows.push(parseDataRow<T>(message.payload, fields));
      else if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      else if (message.type === "Z") return rows;
    }
  }

  private sendStartup() {
    const params = Buffer.from(`user\0${this.user}\0database\0${this.database}\0client_encoding\0UTF8\0\0`, "utf8");
    const protocol = Buffer.alloc(4);
    protocol.writeInt32BE(196608, 0);
    this.sendRaw(Buffer.concat([int32(8 + params.length), protocol, params]));
  }

  private async authenticate() {
    while (true) {
      const message = await this.readMessage();
      if (message.type === "R") {
        const code = message.payload.readInt32BE(0);
        if (code === 0 || code === 11 || code === 12) continue;
        if (code === 3) {
          this.sendPassword(this.password);
          continue;
        }
        if (code === 5) {
          this.sendPassword(buildMd5Password(this.user, this.password, message.payload.subarray(4, 8)));
          continue;
        }
        if (code === 10) {
          await this.handleScram(message.payload.subarray(4));
          continue;
        }
        throw new Error(`Unsupported PostgreSQL authentication request: ${code}`);
      }
      if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      if (message.type === "Z") return;
    }
  }

  private async handleScram(payload: Buffer) {
    const mechanisms = payload.toString("utf8").split("\0").filter(Boolean);
    if (!mechanisms.includes("SCRAM-SHA-256")) throw new Error(`Unsupported SASL mechanisms: ${mechanisms.join(", ")}`);

    const clientNonce = randomBytes(18).toString("base64url");
    const clientFirstBare = `n=*,r=${clientNonce}`;
    this.sendSaslInitial("SCRAM-SHA-256", `n,,${clientFirstBare}`);

    const serverFirstMessage = await this.readMessage();
    if (serverFirstMessage.type === "E") throw new Error(parseErrorResponse(serverFirstMessage.payload));
    if (serverFirstMessage.type !== "R" || serverFirstMessage.payload.readInt32BE(0) !== 11) {
      throw new Error("Unexpected PostgreSQL SASL first response.");
    }

    const serverFirst = serverFirstMessage.payload.subarray(4).toString("utf8");
    const attributes = parseScramAttributes(serverFirst);
    const serverNonce = attributes.r;
    const salt = attributes.s ? Buffer.from(attributes.s, "base64") : null;
    const iterations = Number(attributes.i);
    if (!serverNonce || !serverNonce.startsWith(clientNonce) || !salt || !Number.isFinite(iterations)) {
      throw new Error("Invalid PostgreSQL SCRAM challenge.");
    }

    const clientFinalWithoutProof = `c=biws,r=${serverNonce}`;
    const authMessage = `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(`${clientFinalWithoutProof},p=${xorBuffers(clientKey, signature).toString("base64")}`);
  }

  private sendPassword(password: string) {
    this.sendMessage("p", Buffer.from(`${password}\0`, "utf8"));
  }

  private sendSaslInitial(mechanism: string, response: string) {
    const mechanismBuffer = Buffer.from(`${mechanism}\0`, "utf8");
    const responseBuffer = Buffer.from(response, "utf8");
    this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer]));
  }

  private sendSaslResponse(response: string) {
    this.sendMessage("p", Buffer.from(response, "utf8"));
  }

  private sendMessage(type: string, payload: Buffer) {
    this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload]));
  }

  private sendRaw(payload: Buffer) {
    if (!this.socket || this.socket.destroyed) throw new Error("PostgreSQL socket is not connected.");
    this.socket.write(payload);
  }

  private async readMessage(): Promise<PgMessage> {
    await this.waitForBytes(5);
    const type = this.buffer.subarray(0, 1).toString("utf8");
    const length = this.buffer.readInt32BE(1);
    const totalLength = length + 1;
    await this.waitForBytes(totalLength);
    const payload = this.buffer.subarray(5, totalLength);
    this.buffer = this.buffer.subarray(totalLength);
    return { type, payload };
  }

  private async waitForBytes(size: number) {
    while (this.buffer.length < size) {
      await new Promise<void>((resolve, reject) => {
        const socket = this.socket;
        if (!socket) {
          reject(new Error("PostgreSQL socket is not connected."));
          return;
        }
        const cleanup = () => {
          socket.off("error", onError);
          socket.off("close", onClose);
          const index = this.waiters.indexOf(onData);
          if (index >= 0) this.waiters.splice(index, 1);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onClose = () => {
          cleanup();
          reject(new Error("PostgreSQL socket closed before response was complete."));
        };
        const onData = () => {
          cleanup();
          resolve();
        };
        this.waiters.push(onData);
        socket.once("error", onError);
        socket.once("close", onClose);
      });
    }
  }

  private get user() {
    return decodeURIComponent(this.url.username || "postgres");
  }

  private get password() {
    return decodeURIComponent(this.url.password || "");
  }

  private get database() {
    return decodeURIComponent(this.url.pathname.replace(/^\//, "") || "postgres");
  }
}

function int32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function parseRowDescription(payload: Buffer) {
  const fieldCount = payload.readInt16BE(0);
  const names: string[] = [];
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const end = payload.indexOf(0, offset);
    names.push(payload.subarray(offset, end).toString("utf8"));
    offset = end + 19;
  }
  return names;
}

function parseDataRow<T extends Row>(payload: Buffer, fields: string[]) {
  const row: Row = {};
  const fieldCount = payload.readInt16BE(0);
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const length = payload.readInt32BE(offset);
    offset += 4;
    if (length === -1) {
      row[fields[index] ?? `column_${index}`] = null;
      continue;
    }
    row[fields[index] ?? `column_${index}`] = payload.subarray(offset, offset + length).toString("utf8");
    offset += length;
  }
  return row as T;
}

function parseErrorResponse(payload: Buffer) {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length && payload[offset] !== 0) {
    const code = String.fromCharCode(payload[offset]);
    offset += 1;
    const end = payload.indexOf(0, offset);
    fields[code] = payload.subarray(offset, end).toString("utf8");
    offset = end + 1;
  }
  return fields.M || "PostgreSQL returned an error.";
}

function parseScramAttributes(value: string) {
  const attributes: Record<string, string> = {};
  for (const part of value.split(",")) attributes[part.slice(0, 1)] = part.slice(2);
  return attributes;
}

function buildMd5Password(user: string, password: string, salt: Buffer) {
  const inner = createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function xorBuffers(left: Buffer, right: Buffer) {
  const result = Buffer.alloc(Math.min(left.length, right.length));
  for (let index = 0; index < result.length; index += 1) result[index] = left[index] ^ right[index];
  return result;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
