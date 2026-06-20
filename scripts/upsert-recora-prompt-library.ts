import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import net from "node:net";
import process from "node:process";
import {
  assertRecoraDbWriteAllowed,
  createRecoraDbWriteGuardCliOptions,
  parseRecoraDbWriteGuardArg
} from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PROJECT_SLUG = "recora-kenzai-q2";

type Row = Record<string, string | null>;
type Priority = "high" | "medium" | "low";

type TopicSeed = {
  id: string;
  name: string;
  intent: string;
  priority: Priority;
  weight: number;
};

type PromptSeed = {
  id: string;
  topicName: string;
  personaName: string;
  text: string;
  intent: string;
  buyerStage: string;
  priority: Priority;
};

type ProjectRow = {
  id: string;
  slug: string;
};

type NamedRow = {
  id: string;
  name: string;
};

type PromptRow = {
  id: string;
  text: string;
};

type CountRow = {
  topics: string;
  prompts: string;
  metric_snapshots: string;
  recommendations: string;
};
type Options = {
  apply: boolean;
  dryRun: boolean;
  allowNonLocalDb: boolean;
  confirmNonLocalDbWrite: string | null;
};

type Plan = {
  project: ProjectRow;
  existingTopics: Map<string, NamedRow>;
  existingPersonas: Map<string, NamedRow>;
  existingPrompts: Map<string, PromptRow>;
  topicInserts: TopicSeed[];
  promptInserts: Array<PromptSeed & { topicId: string; personaId: string }>;
  missingPersonas: string[];
  missingTopics: string[];
};

const topicSeeds: TopicSeed[] = [
  {
    id: "40000000-0000-4000-8000-000000000006",
    name: "実績・信頼性",
    intent: "導入事例、採用実績、公式情報、第三者評価を確認する",
    priority: "high",
    weight: 1.1
  }
];

const promptSeeds: PromptSeed[] = [
  {
    id: "50000000-0000-4000-8000-000000000007",
    topicName: "デザインの差別化",
    personaName: "設計事務所",
    text: "レコラ建材はどのような内装案件に向いていますか？強みと注意点を整理してください。",
    intent: "ブランド理解",
    buyerStage: "選定",
    priority: "high"
  },
  {
    id: "50000000-0000-4000-8000-000000000008",
    topicName: "デザインの差別化",
    personaName: "ホテル開発担当者",
    text: "レコラ建材、タイルワークス、マテリアルラボを高級ホテルのロビー内装で比較してください。",
    intent: "競合比較",
    buyerStage: "比較",
    priority: "high"
  },
  {
    id: "50000000-0000-4000-8000-000000000009",
    topicName: "施工互換性",
    personaName: "工務店",
    text: "レコラ建材の施工条件や互換性を確認できる情報源はありますか？",
    intent: "根拠確認",
    buyerStage: "導入前確認",
    priority: "high"
  },
  {
    id: "50000000-0000-4000-8000-000000000010",
    topicName: "実績・信頼性",
    personaName: "設計事務所",
    text: "レコラ建材の導入事例や採用実績を確認できる信頼できる情報源を教えてください。",
    intent: "事例確認",
    buyerStage: "稟議",
    priority: "high"
  },
  {
    id: "50000000-0000-4000-8000-000000000011",
    topicName: "デザインの差別化",
    personaName: "設計事務所",
    text: "タイルワークスの代替候補として検討できる内装タイルブランドはありますか？",
    intent: "代替検討",
    buyerStage: "比較",
    priority: "medium"
  },
  {
    id: "50000000-0000-4000-8000-000000000012",
    topicName: "長期耐久性",
    personaName: "ホテル開発担当者",
    text: "レコラ建材をホテルや商業施設で使う場合に、事前に確認すべきリスクや不向きな条件はありますか？",
    intent: "リスク確認",
    buyerStage: "導入前確認",
    priority: "medium"
  }
];

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.apply) {
    console.log("Mode: apply");
  } else {
    console.log("Mode: dry-run (no DB writes)");
  }
  console.log(`Project slug: ${PROJECT_SLUG}`);
  console.log("Database URL: RECORA_DATABASE_URL or local default (value hidden)");

  const databaseUrl = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  assertRecoraDbWriteAllowed({
    databaseUrl,
    operation: "upsert-recora-prompt-library --apply",
    projectSlug: PROJECT_SLUG,
    isWrite: options.apply,
    allowNonLocalDb: options.allowNonLocalDb,
    confirmNonLocalDbWrite: options.confirmNonLocalDbWrite
  });
  const db = new LocalPostgresClient(databaseUrl);

  try {
    await db.connect();
  } catch (error) {
    if (options.apply) {
      throw error;
    }
    console.log("DB connection: unavailable");
    console.log("No writes attempted. Start local Postgres or set RECORA_DATABASE_URL to compute DB-specific skips.");
    printOfflinePlan();
    return;
  }

  try {
    const beforeCounts = await getCounts(db);
    const plan = await buildPlan(db);

    printPlan(plan, beforeCounts);

    if (!options.apply) {
      const afterCounts = await getCounts(db);
      console.log("Dry-run DB writes: 0");
      console.log(`Counts unchanged: ${sameCounts(beforeCounts, afterCounts) ? "yes" : "no"}`);
      console.log(`Expected prompt total after apply: ${Number(beforeCounts.prompts) + plan.promptInserts.length}`);
      return;
    }

    await applyPlan(db, plan);

    const afterCounts = await getCounts(db);
    console.log("Apply complete.");
    console.log(`Topics: ${beforeCounts.topics} -> ${afterCounts.topics}`);
    console.log(`Prompts: ${beforeCounts.prompts} -> ${afterCounts.prompts}`);
    console.log(`metric_snapshots unchanged: ${beforeCounts.metric_snapshots === afterCounts.metric_snapshots ? "yes" : "no"}`);
    console.log(`recommendations unchanged: ${beforeCounts.recommendations === afterCounts.recommendations ? "yes" : "no"}`);
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const guardOptions = createRecoraDbWriteGuardCliOptions();
  const options: Options = {
    apply: false,
    dryRun: true,
    allowNonLocalDb: guardOptions.allowNonLocalDb,
    confirmNonLocalDbWrite: guardOptions.confirmNonLocalDbWrite
  };
  let applyRequested = false;
  let dryRunRequested = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const guardConsumed = parseRecoraDbWriteGuardArg(args, index, options);
    if (guardConsumed > 0) {
      index += guardConsumed - 1;
      continue;
    }

    if (arg === "--apply") {
      applyRequested = true;
      options.apply = true;
      options.dryRun = false;
      continue;
    }

    if (arg === "--dry-run") {
      dryRunRequested = true;
      options.apply = false;
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (applyRequested && dryRunRequested) throw new Error("--apply and --dry-run cannot be used together.");
  return options;
}

async function buildPlan(db: LocalPostgresClient): Promise<Plan> {
  const project = await getProject(db);
  const topics = await getTopics(db, project.id);
  const personas = await getPersonas(db, project.id);
  const prompts = await getPromptsByText(db, project.id);

  const existingTopics = new Map(topics.map((topic) => [topic.name, topic]));
  const existingPersonas = new Map(personas.map((persona) => [persona.name, persona]));
  const existingPrompts = new Map(prompts.map((prompt) => [prompt.text, prompt]));
  const topicInserts = topicSeeds.filter((topic) => !existingTopics.has(topic.name));
  const topicIdByName = new Map(existingTopics);

  for (const topic of topicInserts) {
    topicIdByName.set(topic.name, { id: topic.id, name: topic.name });
  }

  const promptInserts: Plan["promptInserts"] = [];
  const missingTopics = new Set<string>();
  const missingPersonas = new Set<string>();

  for (const prompt of promptSeeds) {
    if (existingPrompts.has(prompt.text)) continue;

    const topic = topicIdByName.get(prompt.topicName);
    const persona = existingPersonas.get(prompt.personaName);
    if (!topic) {
      missingTopics.add(prompt.topicName);
      continue;
    }
    if (!persona) {
      missingPersonas.add(prompt.personaName);
      continue;
    }

    promptInserts.push({
      ...prompt,
      topicId: topic.id,
      personaId: persona.id
    });
  }

  return {
    project,
    existingTopics,
    existingPersonas,
    existingPrompts,
    topicInserts,
    promptInserts,
    missingPersonas: Array.from(missingPersonas),
    missingTopics: Array.from(missingTopics)
  };
}

async function applyPlan(db: LocalPostgresClient, plan: Plan) {
  if (plan.missingTopics.length > 0 || plan.missingPersonas.length > 0) {
    throw new Error("Cannot apply while referenced topics or personas are missing.");
  }

  await db.query("begin");
  try {
    for (const topic of plan.topicInserts) {
      await db.query(`
        insert into public.topics (id, project_id, name, intent, priority, weight)
        values (${uuid(topic.id)}, ${uuid(plan.project.id)}, ${lit(topic.name)}, ${lit(topic.intent)}, ${lit(topic.priority)}, ${num(topic.weight)})
      `);
    }

    for (const prompt of plan.promptInserts) {
      await db.query(`
        insert into public.prompts (id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority)
        values (
          ${uuid(prompt.id)},
          ${uuid(plan.project.id)},
          ${uuid(prompt.topicId)},
          ${uuid(prompt.personaId)},
          ${lit(prompt.text)},
          ${lit(prompt.intent)},
          ${lit(prompt.buyerStage)},
          ${lit(prompt.priority)}
        )
      `);
    }

    await db.query("commit");
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  }
}

function printPlan(plan: Plan, counts: CountRow) {
  console.log(`Existing topics: ${counts.topics}`);
  console.log(`Existing prompts: ${counts.prompts}`);
  console.log(`Planned topic inserts: ${plan.topicInserts.length}`);
  console.log(`Planned prompt inserts: ${plan.promptInserts.length}`);
  console.log(`Existing topic skips: ${topicSeeds.length - plan.topicInserts.length}`);
  console.log(`Existing prompt skips: ${promptSeeds.length - plan.promptInserts.length}`);
  console.log(`Missing referenced topics: ${plan.missingTopics.length}`);
  console.log(`Missing referenced personas: ${plan.missingPersonas.length}`);
  console.log("Planned topics:");
  for (const topic of plan.topicInserts) {
    console.log(`- ${topic.name} (${topic.priority})`);
  }
  console.log("Planned prompts:");
  for (const prompt of plan.promptInserts) {
    console.log(`- [${prompt.priority}] ${prompt.text}`);
  }
  if (plan.missingTopics.length > 0) {
    console.log(`Missing topics: ${plan.missingTopics.join(", ")}`);
  }
  if (plan.missingPersonas.length > 0) {
    console.log(`Missing personas: ${plan.missingPersonas.join(", ")}`);
  }
  console.log("metric_snapshots touched: no");
  console.log("recommendations touched: no");
}

function printOfflinePlan() {
  console.log(`Planned topic candidates: ${topicSeeds.length}`);
  console.log(`Planned prompt candidates: ${promptSeeds.length}`);
  console.log("Existing skips: unknown (DB unavailable)");
  console.log("DB counts unchanged: yes (no connection, no writes attempted)");
  console.log("Planned topics:");
  for (const topic of topicSeeds) {
    console.log(`- ${topic.name} (${topic.priority})`);
  }
  console.log("Planned prompts:");
  for (const prompt of promptSeeds) {
    console.log(`- [${prompt.priority}] ${prompt.text}`);
  }
  console.log("metric_snapshots touched: no");
  console.log("recommendations touched: no");
}

async function getProject(db: LocalPostgresClient) {
  const rows = await db.query<ProjectRow>(`
    select id::text as id, slug
    from public.projects
    where slug = ${lit(PROJECT_SLUG)}
    limit 1
  `);
  if (!rows[0]) throw new Error(`Project not found: ${PROJECT_SLUG}`);
  return rows[0];
}

async function getTopics(db: LocalPostgresClient, projectId: string) {
  return db.query<NamedRow>(`
    select id::text as id, name
    from public.topics
    where project_id = ${uuid(projectId)}
      and name in (${topicSeeds.map((topic) => lit(topic.name)).join(", ")}, ${promptSeeds.map((prompt) => lit(prompt.topicName)).join(", ")})
  `);
}

async function getPersonas(db: LocalPostgresClient, projectId: string) {
  return db.query<NamedRow>(`
    select id::text as id, name
    from public.personas
    where project_id = ${uuid(projectId)}
      and name in (${Array.from(new Set(promptSeeds.map((prompt) => prompt.personaName))).map(lit).join(", ")})
  `);
}

async function getPromptsByText(db: LocalPostgresClient, projectId: string) {
  return db.query<PromptRow>(`
    select id::text as id, text
    from public.prompts
    where project_id = ${uuid(projectId)}
      and text in (${promptSeeds.map((prompt) => lit(prompt.text)).join(", ")})
  `);
}

async function getCounts(db: LocalPostgresClient) {
  const rows = await db.query<CountRow>(`
    select
      (select count(*)::text from public.topics where project_id = (select id from public.projects where slug = ${lit(PROJECT_SLUG)})) as topics,
      (select count(*)::text from public.prompts where project_id = (select id from public.projects where slug = ${lit(PROJECT_SLUG)})) as prompts,
      (select count(*)::text from public.metric_snapshots) as metric_snapshots,
      (select count(*)::text from public.recommendations) as recommendations
  `);
  if (!rows[0]) throw new Error("Failed to load table counts.");
  return rows[0];
}

function sameCounts(left: CountRow, right: CountRow) {
  return (
    left.topics === right.topics &&
    left.prompts === right.prompts &&
    left.metric_snapshots === right.metric_snapshots &&
    left.recommendations === right.recommendations
  );
}

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function num(value: number) {
  return Number.isFinite(value) ? String(value) : "null";
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

type PgMessage = {
  type: string;
  payload: Buffer;
};

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
  const parts = payload.toString("utf8").split("\0").filter(Boolean);
  const fields = new Map(parts.map((part) => [part[0], part.slice(1)]));
  return fields.get("M") ?? "Unknown PostgreSQL error";
}

function buildMd5Password(user: string, password: string, salt: Buffer) {
  const inner = createHash("md5").update(password + user).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function parseScramAttributes(value: string) {
  return Object.fromEntries(
    value.split(",").map((part) => [part.slice(0, 1), part.slice(2)])
  ) as Record<string, string | undefined>;
}

function xorBuffers(left: Buffer, right: Buffer) {
  const result = Buffer.alloc(left.length);
  for (let index = 0; index < left.length; index += 1) {
    result[index] = left[index] ^ right[index];
  }
  return result;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
