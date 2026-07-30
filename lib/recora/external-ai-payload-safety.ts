import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

import type { EntitlementResolution } from "@/lib/recora/entitlement-snapshots";

const ENTITY_TYPES = ["product", "service", "store", "company", "brand"] as const;
const MAX_DEPTH = 6;
const MAX_OBJECT_KEYS = 48;
const MAX_ARRAY_ITEMS = 32;
const MAX_UNTRUSTED_STRING_BYTES = 64 * 1024;
const MAX_ENTITY_NAME_BYTES = 256;
const MAX_ENTITY_ALIAS_BYTES = 128;
const MAX_ENTITY_ALIASES = 16;
const MAX_ENTITY_CATEGORY_BYTES = 128;
const MAX_ENTITY_DESCRIPTION_BYTES = 1_024;
const MAX_LOCALE_BYTES = 64;
const MAX_IDENTIFIER_BYTES = 128;
const MAX_PUBLIC_PAGES = 8;

const SENSITIVE_KEY = /(?:secret|token|password|credential|authorization|cookie|session|jwt|auth(?:[_-]?claims?)?|email|phone|billing|payment|subscription|contract|quota|operator|audit|support|internal|tenant|organization|project|snapshot|database|provider|request|response|metadata|note|private)/i;
const SENSITIVE_VALUE = /(?:postgres(?:ql)?:\/\/|-----begin\s+[a-z ]*private\s+key-----|\beyj[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}\b|\b(?:access|refresh)[_ -]?token\b|\b(?:authorization|cookie|session|auth[_ -]?claims?)\b|\b(?:contract|billing|payment|subscription|negotiation|operator|audit|support|internal\s+note|raw\s+(?:provider\s+)?(?:request|response))\b|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:^|[^0-9])(?:\+?[1-9][0-9]{0,2}[ .()\-])?[0-9]{2,4}[ .()\-][0-9]{2,4}[ .()\-][0-9]{3,4}(?:[^0-9]|$)|\b[2-9][0-9]{9}\b)/i;

const providerSafePayloadBrand: unique symbol = Symbol("providerSafePayload");

export type PublicEntityType = (typeof ENTITY_TYPES)[number];

export type PublicEntity = Readonly<{
  entityType: PublicEntityType;
  name: string;
  domain?: string;
  url?: string;
  aliases: readonly string[];
  category?: string;
  description?: string;
}>;

export type ProviderSafePageText = Readonly<{
  sourceUrl: string;
  publicHost: string;
  classification: "public";
  retrievedAt: string;
  contentVersion: string;
  text: string;
}>;

export type ProviderSafePayload = Readonly<{
  schemaVersion: number;
  policyVersion: string;
  requestId: string;
  question: string;
  analysisTarget: PublicEntity;
  competitors: readonly PublicEntity[];
  locale: string;
  language: string;
  toolConfig: Readonly<{
    webSearch: boolean;
    publicPageText: boolean;
  }>;
  pageText: readonly ProviderSafePageText[];
  readonly [providerSafePayloadBrand]: true;
}>;

export type ProviderSafePayloadBuildResult = Readonly<{
  payload: ProviderSafePayload;
  payloadHash: string;
}>;

export interface ProviderSafePayloadAdapter<TOutput> {
  execute(payload: ProviderSafePayload): Promise<TOutput>;
}

export type ExternalAiExecutionContext = Readonly<{
  organizationId: string;
  projectId: string | null;
  entitlementResolution: EntitlementResolution;
  requestId: string;
  correlationId: string;
  payloadPolicy: Readonly<{
    schemaVersion: number;
    policyVersion: string;
  }>;
  publicClassificationEvidence: Readonly<{
    organizationId: string;
    projectId: string | null;
    classification: "public";
  }>;
}>;

export type ProviderPayloadSafetyReason =
  | "invalid_internal_context"
  | "tenant_scope_mismatch"
  | "entitlement_unavailable"
  | "capability_unavailable"
  | "limit_unavailable"
  | "invalid_payload"
  | "unsafe_content"
  | "unsafe_url"
  | "limit_exceeded";

export class ExternalAiPayloadSafetyError extends Error {
  readonly code: ProviderPayloadSafetyReason;

  constructor(code: ProviderPayloadSafetyReason) {
    super("External AI payload is not allowed.");
    this.name = "ExternalAiPayloadSafetyError";
    this.code = code;
  }
}

type PayloadPolicyLimits = Readonly<{
  promptBytes: number;
  pageTextBytes: number;
  totalPayloadBytes: number;
  competitorCount: number;
  webSearchAllowed: boolean;
  publicPageTextAllowed: boolean;
}>;

type ParsedInput = Readonly<{
  organizationId: string;
  projectId: string | null;
  question: string;
  analysisTarget: PublicEntity;
  competitors: readonly PublicEntity[];
  locale: string;
  language: string;
  toolConfig: Readonly<{ webSearch: boolean; publicPageText: boolean }>;
  pageText: readonly ProviderSafePageText[];
}>;

/**
 * Validates an unknown internal request and returns the sole type that may cross a
 * provider boundary. The context stays server-side and is never serialized into
 * the returned payload.
 */
export function buildProviderSafePayload(
  context: ExternalAiExecutionContext,
  input: unknown,
): ProviderSafePayloadBuildResult {
  const policy = resolvePayloadPolicy(context);
  assertTrustedContext(context);
  assertRawStructure(input, { depth: 0, objectKeys: 0 });

  const parsed = parseInput(input);
  if (parsed.organizationId !== context.organizationId || parsed.projectId !== context.projectId) {
    reject("tenant_scope_mismatch");
  }

  assertByteLimit(parsed.question, policy.promptBytes);
  if (parsed.competitors.length > policy.competitorCount) reject("limit_exceeded");
  if (parsed.toolConfig.webSearch && !policy.webSearchAllowed) reject("capability_unavailable");
  if (parsed.toolConfig.publicPageText && !policy.publicPageTextAllowed) {
    reject("capability_unavailable");
  }
  if (!parsed.toolConfig.publicPageText && parsed.pageText.length > 0) reject("invalid_payload");

  for (const page of parsed.pageText) assertByteLimit(page.text, policy.pageTextBytes);

  const payload = asProviderSafePayload({
    schemaVersion: context.payloadPolicy.schemaVersion,
    policyVersion: context.payloadPolicy.policyVersion,
    requestId: context.requestId,
    question: parsed.question,
    analysisTarget: parsed.analysisTarget,
    competitors: parsed.competitors,
    locale: parsed.locale,
    language: parsed.language,
    toolConfig: parsed.toolConfig,
    pageText: parsed.pageText,
  });
  const canonical = canonicalizeProviderSafePayload(payload);
  if (Buffer.byteLength(canonical, "utf8") > policy.totalPayloadBytes) reject("limit_exceeded");

  return {
    payload,
    payloadHash: createHash("sha256").update(canonical, "utf8").digest("hex"),
  };
}

export function canonicalizeProviderSafePayload(payload: ProviderSafePayload): string {
  return canonicalizeJson(payload as unknown as JsonValue);
}

function resolvePayloadPolicy(context: ExternalAiExecutionContext): PayloadPolicyLimits {
  const resolution = context.entitlementResolution;
  if (!resolution.ok) reject("entitlement_unavailable");

  const snapshot = resolution.snapshot;
  if (
    !isOpaqueIdentifier(snapshot.snapshotId) ||
    !Number.isInteger(snapshot.schemaVersion) ||
    snapshot.schemaVersion <= 0 ||
    !isOpaqueIdentifier(snapshot.resolverVersion) ||
    !isOpaqueIdentifier(snapshot.hash)
  ) {
    reject("invalid_internal_context");
  }

  const readLimit = (name: string, allowsZero: boolean) => {
    const value = snapshot.limits[name];
    if (!Number.isSafeInteger(value) || value === undefined || value < 0 || (!allowsZero && value === 0)) {
      reject("limit_unavailable");
    }
    return value;
  };

  if (snapshot.capabilities["external_ai.execute"] !== true) reject("capability_unavailable");

  return {
    promptBytes: readLimit("external_ai.prompt_bytes", false),
    pageTextBytes: readLimit("external_ai.page_text_bytes", false),
    totalPayloadBytes: readLimit("external_ai.total_payload_bytes", false),
    competitorCount: readLimit("external_ai.competitor_count", true),
    webSearchAllowed: snapshot.capabilities["external_ai.web_search"] === true,
    publicPageTextAllowed: snapshot.capabilities["external_ai.public_page_text"] === true,
  };
}

function assertTrustedContext(context: ExternalAiExecutionContext) {
  if (
    !isOpaqueIdentifier(context.organizationId) ||
    (context.projectId !== null && !isOpaqueIdentifier(context.projectId)) ||
    !isOpaqueIdentifier(context.requestId) ||
    !isOpaqueIdentifier(context.correlationId) ||
    !Number.isInteger(context.payloadPolicy.schemaVersion) ||
    context.payloadPolicy.schemaVersion <= 0 ||
    !isOpaqueIdentifier(context.payloadPolicy.policyVersion) ||
    context.publicClassificationEvidence.classification !== "public" ||
    context.publicClassificationEvidence.organizationId !== context.organizationId ||
    context.publicClassificationEvidence.projectId !== context.projectId
  ) {
    reject("invalid_internal_context");
  }
}

function parseInput(input: unknown): ParsedInput {
  const record = expectRecord(input);
  assertExactKeys(record, [
    "organizationId",
    "projectId",
    "question",
    "analysisTarget",
    "competitors",
    "locale",
    "language",
    "toolConfig",
    "pageText",
  ]);

  const toolConfig = parseToolConfig(record.toolConfig);
  const pageText = parsePageText(record.pageText);
  if (pageText.length > MAX_PUBLIC_PAGES) reject("limit_exceeded");

  return {
    organizationId: readOpaqueIdentifier(record.organizationId),
    projectId: record.projectId === null ? null : readOpaqueIdentifier(record.projectId),
    question: readSafeString(record.question, MAX_UNTRUSTED_STRING_BYTES),
    analysisTarget: parsePublicEntity(record.analysisTarget),
    competitors: parseEntityArray(record.competitors),
    locale: readLocale(record.locale),
    language: readLocale(record.language),
    toolConfig,
    pageText,
  };
}

function parseToolConfig(value: unknown) {
  const record = expectRecord(value);
  assertExactKeys(record, ["webSearch", "publicPageText"]);
  if (typeof record.webSearch !== "boolean" || typeof record.publicPageText !== "boolean") {
    reject("invalid_payload");
  }
  return { webSearch: record.webSearch, publicPageText: record.publicPageText };
}

function parseEntityArray(value: unknown): readonly PublicEntity[] {
  if (!Array.isArray(value) || value.length > MAX_ARRAY_ITEMS) reject("invalid_payload");
  return value.map((entry) => parsePublicEntity(entry));
}

function parsePublicEntity(value: unknown): PublicEntity {
  const record = expectRecord(value);
  assertExactKeys(record, ["entityType", "name", "domain", "url", "aliases", "category", "description"]);
  if (!ENTITY_TYPES.includes(record.entityType as PublicEntityType)) reject("invalid_payload");

  const domain = record.domain === undefined ? undefined : normalizePublicHost(readSafeString(record.domain, 253));
  const url = record.url === undefined ? undefined : normalizePublicHttpsUrl(readSafeString(record.url, 2_048));
  if (domain && url && new URL(url).hostname !== domain) reject("unsafe_url");

  return {
    entityType: record.entityType as PublicEntityType,
    name: readSafeString(record.name, MAX_ENTITY_NAME_BYTES),
    ...(domain ? { domain } : {}),
    ...(url ? { url } : {}),
    aliases: parseAliases(record.aliases),
    ...(record.category === undefined
      ? {}
      : { category: readSafeString(record.category, MAX_ENTITY_CATEGORY_BYTES) }),
    ...(record.description === undefined
      ? {}
      : { description: readSafeString(record.description, MAX_ENTITY_DESCRIPTION_BYTES) }),
  };
}

function parseAliases(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length > MAX_ENTITY_ALIASES) reject("invalid_payload");
  return value.map((entry) => readSafeString(entry, MAX_ENTITY_ALIAS_BYTES));
}

function parsePageText(value: unknown): readonly ProviderSafePageText[] {
  if (!Array.isArray(value) || value.length > MAX_ARRAY_ITEMS) reject("invalid_payload");
  return value.map((entry) => {
    const record = expectRecord(entry);
    assertExactKeys(record, ["sourceUrl", "publicHost", "classification", "retrievedAt", "contentVersion", "text"]);
    if (record.classification !== "public") reject("invalid_payload");
    const sourceUrl = normalizePublicHttpsUrl(readSafeString(record.sourceUrl, 2_048));
    const publicHost = normalizePublicHost(readSafeString(record.publicHost, 253));
    if (new URL(sourceUrl).hostname !== publicHost) reject("unsafe_url");
    const retrievedAt = readSafeString(record.retrievedAt, MAX_IDENTIFIER_BYTES);
    if (Number.isNaN(Date.parse(retrievedAt))) reject("invalid_payload");

    return {
      sourceUrl,
      publicHost,
      classification: "public" as const,
      retrievedAt,
      contentVersion: readSafeString(record.contentVersion, MAX_IDENTIFIER_BYTES),
      text: readSafeString(record.text, MAX_UNTRUSTED_STRING_BYTES),
    };
  });
}

function readLocale(value: unknown) {
  const result = readSafeString(value, MAX_LOCALE_BYTES);
  if (!/^[a-z0-9-]+$/i.test(result)) reject("invalid_payload");
  return result;
}

function readOpaqueIdentifier(value: unknown) {
  const result = readSafeString(value, MAX_IDENTIFIER_BYTES);
  if (!isOpaqueIdentifier(result)) reject("invalid_payload");
  return result;
}

function readSafeString(value: unknown, maxBytes: number) {
  if (typeof value !== "string") reject("invalid_payload");
  const normalized = value.trim();
  if (!normalized || Buffer.byteLength(normalized, "utf8") > maxBytes) reject("limit_exceeded");
  if (SENSITIVE_VALUE.test(normalized)) reject("unsafe_content");
  return normalized;
}

function normalizePublicHttpsUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return reject("unsafe_url");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
    reject("unsafe_url");
  }
  parsed.hash = "";
  normalizePublicHost(parsed.hostname);
  return parsed.toString();
}

function normalizePublicHost(value: string) {
  const host = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    reject("unsafe_url");
  }
  if (isPrivateOrLoopbackIpLiteral(host)) reject("unsafe_url");
  if (!/^[a-z0-9.-]+$/i.test(host) && isIP(host) === 0) reject("unsafe_url");
  return host;
}

function isPrivateOrLoopbackIpLiteral(host: string) {
  const family = isIP(host);
  if (family === 4) {
    const [first, second] = host.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19))
    );
  }
  if (family === 6) {
    const normalized = host.toLowerCase();
    return normalized === "::" || normalized === "::1" || /^f[cd]/.test(normalized) || /^fe[89ab]/.test(normalized);
  }
  return false;
}

function assertRawStructure(value: unknown, state: { depth: number; objectKeys: number }): void {
  if (state.depth > MAX_DEPTH) reject("limit_exceeded");
  if (typeof value === "string") {
    if (Buffer.byteLength(value, "utf8") > MAX_UNTRUSTED_STRING_BYTES || SENSITIVE_VALUE.test(value)) {
      reject("unsafe_content");
    }
    return;
  }
  if (value === null || typeof value === "boolean" || typeof value === "number") return;
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS || Object.keys(value).length !== value.length) reject("limit_exceeded");
    for (const entry of value) assertRawStructure(entry, { ...state, depth: state.depth + 1 });
    return;
  }
  if (!isPlainRecord(value)) reject("invalid_payload");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors);
  if (Object.getOwnPropertySymbols(value).length > 0 || keys.length !== Object.keys(value).length) reject("invalid_payload");
  state.objectKeys += keys.length;
  if (state.objectKeys > MAX_OBJECT_KEYS) reject("limit_exceeded");
  for (const key of keys) {
    const descriptor = descriptors[key];
    const isExpectedInternalLocator =
      state.depth === 0 && (key === "organizationId" || key === "projectId");
    if (
      !descriptor ||
      !descriptor.enumerable ||
      !("value" in descriptor) ||
      (SENSITIVE_KEY.test(key) && !isExpectedInternalLocator)
    ) {
      reject("unsafe_content");
    }
    assertRawStructure(descriptor.value, { ...state, depth: state.depth + 1 });
  }
}

function expectRecord(value: unknown): Record<string, unknown> {
  if (!isPlainRecord(value)) reject("invalid_payload");
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertExactKeys(record: Record<string, unknown>, allowedKeys: readonly string[]) {
  const keys = Object.keys(record);
  if (keys.some((key) => !allowedKeys.includes(key))) reject("invalid_payload");
}

function assertByteLimit(value: string, limit: number) {
  if (Buffer.byteLength(value, "utf8") > limit) reject("limit_exceeded");
}

function isOpaqueIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    Buffer.byteLength(value, "utf8") <= MAX_IDENTIFIER_BYTES &&
    !SENSITIVE_VALUE.test(value)
  );
}

function asProviderSafePayload(
  payload: Omit<ProviderSafePayload, typeof providerSafePayloadBrand>,
): ProviderSafePayload {
  return payload as ProviderSafePayload;
}

type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };

function canonicalizeJson(value: JsonValue): string {
  if (value === null || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(",")}]`;
  const record = value as { readonly [key: string]: JsonValue };
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(record[key]!)}`)
    .join(",")}}`;
}

function reject(code: ProviderPayloadSafetyReason): never {
  throw new ExternalAiPayloadSafetyError(code);
}
