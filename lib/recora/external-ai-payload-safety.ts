import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

import type { EntitlementResolution } from "@/lib/recora/entitlement-snapshots";

const ENTITY_TYPES = ["product", "service", "store", "company", "brand"] as const;
const MAX_DEPTH = 6;
const MAX_OBJECT_KEYS = 48;
const MAX_ARRAY_ITEMS = 32;
const MAX_RAW_NODES = 256;
const MAX_RAW_TOTAL_OBJECT_KEYS = 96;
const MAX_RAW_TOTAL_ARRAY_ITEMS = 80;
const MAX_RAW_TOTAL_STRING_BYTES = 64 * 1024;
const MAX_UNTRUSTED_STRING_BYTES = 64 * 1024;
const MAX_ENTITY_NAME_BYTES = 256;
const MAX_ENTITY_ALIAS_BYTES = 128;
const MAX_ENTITY_ALIASES = 16;
const MAX_ENTITY_CATEGORY_BYTES = 128;
const MAX_ENTITY_DESCRIPTION_BYTES = 1_024;
const MAX_LOCALE_BYTES = 64;
const MAX_IDENTIFIER_BYTES = 128;
const MAX_PUBLIC_PAGES = 8;

const SENSITIVE_KEY = /(?:api[_-]?key|secret|token|password|credential|authorization|cookie|session|jwt|auth(?:[_-]?claims?)?|email|phone|billing|payment|subscription|contract|quota|operator|audit|support|internal|tenant|organization|project|snapshot|database|provider|request|response|metadata|note|private)/i;
const SENSITIVE_VALUE = /(?:postgres(?:ql)?:\/\/|-----begin\s+[a-z ]*private\s+key-----|\beyj[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}\b|\b(?:access|refresh)[_ -]?token\b|\b(?:authorization|cookie|session|auth[_ -]?claims?)\b|\b(?:api[_ -]?key|secret|password|credential|token)\b\s*(?:[:=]|\bis\b)|\bsk(?:-proj)?-[a-z0-9_-]{12,}\b|\bghp_[a-z0-9]{12,}\b|\bgithub_pat_[a-z0-9_]{12,}\b|\bakia[0-9a-z]{16}\b|\bxox[baprs]-[a-z0-9-]{12,}\b|\baiza[a-z0-9_-]{16,}\b|\bsk_live_[a-z0-9]{12,}\b|\bbearer\s+[a-z0-9._~+/=-]{8,}|\b(?:contract|billing|payment|subscription|negotiation|operator|audit|support|internal\s+note|raw\s+(?:provider\s+)?(?:request|response))\b|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:^|[^0-9])(?:\+?81[ .()\-]?)?0[0-9]{1,4}[ .()\-][0-9]{1,4}[ .()\-][0-9]{3,4}(?:$|[^0-9])|(?:^|[^0-9])\+[1-9][0-9]{0,2}[ .()\-][0-9]{1,4}[ .()\-][0-9]{2,4}[ .()\-][0-9]{3,4}(?:$|[^0-9])|\b[2-9][0-9]{9}\b)/i;
const OPAQUE_IDENTIFIER = /^[a-z0-9][a-z0-9._:-]{0,127}$/i;
const ENTITLEMENT_NAME = /^[a-z][a-z0-9_.-]*$/;
const ENTITLEMENT_FAILURE_REASONS = new Set([
  "invalid_scope",
  "no_snapshot",
  "expired_snapshot",
  "ambiguous_snapshot",
  "invalid_reference",
  "resolver_unavailable",
]);
const RESERVED_PUBLIC_HOST_SUFFIXES = new Set([
  "localhost",
  "local",
  "internal",
  "lan",
  "home",
  "test",
  "invalid",
]);

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

type RawTraversalBudget = {
  nodes: number;
  objectKeys: number;
  arrayItems: number;
  stringBytes: number;
};

/**
 * Validates unknown internal context and request input, then returns the sole DTO
 * that may cross a provider boundary. The context is never serialized into it.
 */
export function buildProviderSafePayload(
  context: ExternalAiExecutionContext,
  input: unknown,
): ProviderSafePayloadBuildResult {
  try {
    const trustedContext = parseTrustedContext(context as unknown);
    const policy = resolvePayloadPolicy(trustedContext);
    assertRawStructure(input, { nodes: 0, objectKeys: 0, arrayItems: 0, stringBytes: 0 }, 0);

    const parsed = parseInput(input);
    if (
      parsed.organizationId !== trustedContext.organizationId ||
      parsed.projectId !== trustedContext.projectId
    ) {
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

    const payload = createProviderSafePayload({
      schemaVersion: trustedContext.payloadPolicy.schemaVersion,
      policyVersion: trustedContext.payloadPolicy.policyVersion,
      requestId: trustedContext.requestId,
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
  } catch (error) {
    if (error instanceof ExternalAiPayloadSafetyError) throw error;
    return reject("invalid_internal_context");
  }
}

/** Runtime gate for Phase 6 adapters; a cast of an unbranded object is rejected. */
export function assertProviderSafePayload(payload: unknown): asserts payload is ProviderSafePayload {
  if (!hasRuntimePayloadBrand(payload)) reject("invalid_payload");
}

export function canonicalizeProviderSafePayload(payload: ProviderSafePayload): string {
  assertProviderSafePayload(payload);
  return canonicalizeJson(payload as unknown as JsonValue);
}

function parseTrustedContext(value: unknown): ExternalAiExecutionContext {
  const record = expectInternalRecord(value);
  assertExactKeys(
    record,
    [
      "organizationId",
      "projectId",
      "entitlementResolution",
      "requestId",
      "correlationId",
      "payloadPolicy",
      "publicClassificationEvidence",
    ],
    "invalid_internal_context",
  );

  const organizationId = readInternalIdentifier(record.organizationId);
  const projectId = record.projectId === null ? null : readInternalIdentifier(record.projectId);
  const payloadPolicy = parsePayloadPolicy(record.payloadPolicy);
  const evidence = parseClassificationEvidence(record.publicClassificationEvidence);
  if (
    evidence.organizationId !== organizationId ||
    evidence.projectId !== projectId ||
    evidence.classification !== "public"
  ) {
    reject("invalid_internal_context");
  }

  return {
    organizationId,
    projectId,
    entitlementResolution: parseEntitlementResolution(record.entitlementResolution),
    requestId: readInternalIdentifier(record.requestId),
    correlationId: readInternalIdentifier(record.correlationId),
    payloadPolicy,
    publicClassificationEvidence: evidence,
  };
}

function parsePayloadPolicy(value: unknown): ExternalAiExecutionContext["payloadPolicy"] {
  const record = expectInternalRecord(value);
  assertExactKeys(record, ["schemaVersion", "policyVersion"], "invalid_internal_context");
  if (
    typeof record.schemaVersion !== "number" ||
    !Number.isSafeInteger(record.schemaVersion) ||
    record.schemaVersion <= 0
  ) {
    reject("invalid_internal_context");
  }
  return {
    schemaVersion: record.schemaVersion,
    policyVersion: readInternalIdentifier(record.policyVersion),
  };
}

function parseClassificationEvidence(
  value: unknown,
): ExternalAiExecutionContext["publicClassificationEvidence"] {
  const record = expectInternalRecord(value);
  assertExactKeys(record, ["organizationId", "projectId", "classification"], "invalid_internal_context");
  if (record.classification !== "public") reject("invalid_internal_context");
  return {
    organizationId: readInternalIdentifier(record.organizationId),
    projectId: record.projectId === null ? null : readInternalIdentifier(record.projectId),
    classification: "public",
  };
}

function parseEntitlementResolution(value: unknown): EntitlementResolution {
  const record = expectInternalRecord(value);
  if (record.ok === false) {
    assertExactKeys(record, ["ok", "reasonCode"], "invalid_internal_context");
    if (typeof record.reasonCode !== "string" || !ENTITLEMENT_FAILURE_REASONS.has(record.reasonCode)) {
      reject("invalid_internal_context");
    }
    return { ok: false, reasonCode: record.reasonCode as Exclude<EntitlementResolution["reasonCode"], "ok"> };
  }
  if (record.ok !== true) reject("invalid_internal_context");
  assertExactKeys(record, ["ok", "reasonCode", "snapshot"], "invalid_internal_context");
  if (record.reasonCode !== "ok") reject("invalid_internal_context");
  return {
    ok: true,
    reasonCode: "ok",
    snapshot: parseEntitlementSnapshot(record.snapshot),
  };
}

function parseEntitlementSnapshot(value: unknown): Extract<EntitlementResolution, { ok: true }> ["snapshot"] {
  const record = expectInternalRecord(value);
  assertExactKeys(
    record,
    [
      "snapshotId",
      "schemaVersion",
      "capabilities",
      "limits",
      "resolverVersion",
      "hash",
      "effectiveFrom",
      "effectiveUntil",
    ],
    "invalid_internal_context",
  );
  if (
    typeof record.schemaVersion !== "number" ||
    !Number.isSafeInteger(record.schemaVersion) ||
    record.schemaVersion <= 0
  ) {
    reject("invalid_internal_context");
  }
  if (typeof record.hash !== "string" || !/^[a-f0-9]{64}$/i.test(record.hash)) {
    reject("invalid_internal_context");
  }
  return {
    snapshotId: readInternalIdentifier(record.snapshotId),
    schemaVersion: record.schemaVersion,
    capabilities: parseCapabilityRecord(record.capabilities),
    limits: parseLimitRecord(record.limits),
    resolverVersion: readInternalIdentifier(record.resolverVersion),
    hash: record.hash.toLowerCase(),
    effectiveFrom: readInternalTimestamp(record.effectiveFrom),
    effectiveUntil: record.effectiveUntil === null ? null : readInternalTimestamp(record.effectiveUntil),
  };
}

function parseCapabilityRecord(value: unknown): Record<string, boolean> {
  const record = expectInternalRecord(value);
  const entries = Object.entries(record);
  if (
    entries.length > MAX_OBJECT_KEYS ||
    entries.some(([name, entry]) => !ENTITLEMENT_NAME.test(name) || typeof entry !== "boolean")
  ) {
    reject("invalid_internal_context");
  }
  return Object.fromEntries(entries) as Record<string, boolean>;
}

function parseLimitRecord(value: unknown): Record<string, number> {
  const record = expectInternalRecord(value);
  const entries = Object.entries(record);
  if (
    entries.length > MAX_OBJECT_KEYS ||
    entries.some(
      ([name, entry]) =>
        !ENTITLEMENT_NAME.test(name) ||
        typeof entry !== "number" ||
        !Number.isSafeInteger(entry) ||
        entry < 0,
    )
  ) {
    reject("invalid_internal_context");
  }
  return Object.fromEntries(entries) as Record<string, number>;
}

function readInternalTimestamp(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || Number.isNaN(Date.parse(value))) {
    reject("invalid_internal_context");
  }
  return value;
}

function readInternalIdentifier(value: unknown): string {
  if (!isOpaqueIdentifier(value)) reject("invalid_internal_context");
  return value;
}

function resolvePayloadPolicy(context: ExternalAiExecutionContext): PayloadPolicyLimits {
  const resolution = context.entitlementResolution;
  if (!resolution.ok) reject("entitlement_unavailable");

  const readLimit = (name: string, allowsZero: boolean) => {
    const value = resolution.snapshot.limits[name];
    if (!Number.isSafeInteger(value) || value < 0 || (!allowsZero && value === 0)) {
      reject("limit_unavailable");
    }
    return value;
  };

  if (resolution.snapshot.capabilities["external_ai.execute"] !== true) {
    reject("capability_unavailable");
  }

  return {
    promptBytes: readLimit("external_ai.prompt_bytes", false),
    pageTextBytes: readLimit("external_ai.page_text_bytes", false),
    totalPayloadBytes: readLimit("external_ai.total_payload_bytes", false),
    competitorCount: readLimit("external_ai.competitor_count", true),
    webSearchAllowed: resolution.snapshot.capabilities["external_ai.web_search"] === true,
    publicPageTextAllowed: resolution.snapshot.capabilities["external_ai.public_page_text"] === true,
  };
}

function parseInput(input: unknown): ParsedInput {
  const record = expectPayloadRecord(input);
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
  const record = expectPayloadRecord(value);
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
  const record = expectPayloadRecord(value);
  assertAllowedKeys(record, ["entityType", "name", "domain", "url", "aliases", "category", "description"]);
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
    const record = expectPayloadRecord(entry);
    assertExactKeys(record, ["sourceUrl", "publicHost", "classification", "retrievedAt", "contentVersion", "text"]);
    if (record.classification !== "public") reject("invalid_payload");
    const sourceUrl = normalizePublicHttpsUrl(readSafeString(record.sourceUrl, 2_048));
    const publicHost = normalizePublicHost(readSafeString(record.publicHost, 253));
    if (new URL(sourceUrl).hostname !== publicHost) reject("unsafe_url");

    return {
      sourceUrl,
      publicHost,
      classification: "public" as const,
      retrievedAt: readPublicTimestamp(record.retrievedAt),
      contentVersion: readSafeString(record.contentVersion, MAX_IDENTIFIER_BYTES),
      text: readPlainText(record.text, MAX_UNTRUSTED_STRING_BYTES),
    };
  });
}

function readPublicTimestamp(value: unknown): string {
  const result = readSafeString(value, MAX_IDENTIFIER_BYTES);
  if (Number.isNaN(Date.parse(result))) reject("invalid_payload");
  return result;
}

function readPlainText(value: unknown, maxBytes: number): string {
  const result = readSafeString(value, maxBytes);
  if (/<\/?[a-z][^>]*>/i.test(result) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) {
    reject("unsafe_content");
  }
  return result;
}

function readLocale(value: unknown): string {
  const result = readSafeString(value, MAX_LOCALE_BYTES);
  if (!/^[a-z0-9-]+$/i.test(result)) reject("invalid_payload");
  return result;
}

function readOpaqueIdentifier(value: unknown): string {
  const result = readSafeString(value, MAX_IDENTIFIER_BYTES);
  if (!isOpaqueIdentifier(result)) reject("invalid_payload");
  return result;
}

function readSafeString(value: unknown, maxBytes: number): string {
  if (typeof value !== "string") reject("invalid_payload");
  if (Buffer.byteLength(value, "utf8") > maxBytes) reject("limit_exceeded");
  const normalized = value.trim();
  if (!normalized) reject("invalid_payload");
  if (hasSensitiveValue(normalized)) reject("unsafe_content");
  return normalized;
}

function normalizePublicHttpsUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return reject("unsafe_url");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
    reject("unsafe_url");
  }
  normalizePublicHost(parsed.hostname);
  parsed.searchParams.forEach((entry, name) => {
    if (SENSITIVE_KEY.test(name) || SENSITIVE_KEY.test(entry) || hasSensitiveValue(name) || hasSensitiveValue(entry)) {
      reject("unsafe_content");
    }
  });
  parsed.hash = "";
  return parsed.toString();
}

function normalizePublicHost(value: string): string {
  const host = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !host ||
    host.endsWith(".") ||
    host.length > 253 ||
    isIP(host) !== 0 ||
    !/^[a-z0-9.-]+$/.test(host)
  ) {
    reject("unsafe_url");
  }
  const labels = host.split(".");
  if (
    labels.length < 2 ||
    labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
    RESERVED_PUBLIC_HOST_SUFFIXES.has(labels.at(-1)!)
  ) {
    reject("unsafe_url");
  }
  return host;
}

function assertRawStructure(value: unknown, budget: RawTraversalBudget, depth: number): void {
  budget.nodes += 1;
  if (depth > MAX_DEPTH || budget.nodes > MAX_RAW_NODES) reject("limit_exceeded");
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value, "utf8");
    budget.stringBytes += bytes;
    if (bytes > MAX_UNTRUSTED_STRING_BYTES || budget.stringBytes > MAX_RAW_TOTAL_STRING_BYTES) {
      reject("limit_exceeded");
    }
    if (hasSensitiveValue(value)) reject("unsafe_content");
    return;
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) reject("invalid_payload");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS || Object.keys(value).length !== value.length || Object.getOwnPropertySymbols(value).length > 0) {
      reject("limit_exceeded");
    }
    budget.arrayItems += value.length;
    if (budget.arrayItems > MAX_RAW_TOTAL_ARRAY_ITEMS) reject("limit_exceeded");
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) reject("invalid_payload");
      assertRawStructure(descriptor.value, budget, depth + 1);
    }
    return;
  }
  if (!isPlainRecord(value)) reject("invalid_payload");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors);
  if (Object.getOwnPropertySymbols(value).length > 0 || keys.length !== Object.keys(value).length) {
    reject("invalid_payload");
  }
  budget.objectKeys += keys.length;
  if (budget.objectKeys > MAX_RAW_TOTAL_OBJECT_KEYS) reject("limit_exceeded");
  for (const key of keys) {
    const descriptor = descriptors[key];
    const isExpectedInternalLocator = depth === 0 && (key === "organizationId" || key === "projectId");
    if (
      !descriptor ||
      !descriptor.enumerable ||
      !("value" in descriptor) ||
      (SENSITIVE_KEY.test(key) && !isExpectedInternalLocator)
    ) {
      reject("unsafe_content");
    }
    assertRawStructure(descriptor.value, budget, depth + 1);
  }
}

function expectPayloadRecord(value: unknown): Record<string, unknown> {
  return readDataRecord(value, "invalid_payload");
}

function expectInternalRecord(value: unknown): Record<string, unknown> {
  return readDataRecord(value, "invalid_internal_context");
}

function readDataRecord(value: unknown, code: ProviderPayloadSafetyReason): Record<string, unknown> {
  if (!isPlainRecord(value)) reject(code);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (
    Object.getOwnPropertySymbols(value).length > 0 ||
    Object.keys(descriptors).some((key) => {
      const descriptor = descriptors[key];
      return !descriptor || !descriptor.enumerable || !("value" in descriptor);
    })
  ) {
    reject(code);
  }
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertExactKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  code: ProviderPayloadSafetyReason = "invalid_payload",
) {
  const keys = Object.keys(record);
  if (keys.length !== allowedKeys.length || keys.some((key) => !allowedKeys.includes(key))) reject(code);
}

function assertAllowedKeys(record: Record<string, unknown>, allowedKeys: readonly string[]): void {
  if (Object.keys(record).some((key) => !allowedKeys.includes(key))) reject("invalid_payload");
}

function assertByteLimit(value: string, limit: number): void {
  if (Buffer.byteLength(value, "utf8") > limit) reject("limit_exceeded");
}

function isOpaqueIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Buffer.byteLength(value, "utf8") <= MAX_IDENTIFIER_BYTES &&
    OPAQUE_IDENTIFIER.test(value) &&
    !hasSensitiveValue(value)
  );
}

function hasSensitiveValue(value: string): boolean {
  return SENSITIVE_VALUE.test(value);
}

function createProviderSafePayload(
  payload: Omit<ProviderSafePayload, typeof providerSafePayloadBrand>,
): ProviderSafePayload {
  const branded = payload as unknown as ProviderSafePayload;
  Object.defineProperty(branded, providerSafePayloadBrand, {
    value: true,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  return deepFreeze(branded);
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && "value" in descriptor) deepFreeze(descriptor.value);
  }
  return Object.freeze(value);
}

function hasRuntimePayloadBrand(value: unknown): value is ProviderSafePayload {
  if (!isPlainRecord(value) || !Object.isFrozen(value)) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, providerSafePayloadBrand);
  return (
    descriptor?.value === true &&
    descriptor.enumerable === false &&
    descriptor.writable === false &&
    descriptor.configurable === false &&
    isDeeplyFrozenJson(value, true, new Set<object>())
  );
}

function isDeeplyFrozenJson(value: unknown, allowBrand: boolean, seen: Set<object>): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || !Object.isFrozen(value) || seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length > 0 || Object.keys(value).length !== value.length) return false;
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor) || !isDeeplyFrozenJson(descriptor.value, false, seen)) {
        return false;
      }
    }
    return true;
  }

  if (!isPlainRecord(value)) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Object.keys(descriptors)) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor) || !isDeeplyFrozenJson(descriptor.value, false, seen)) {
      return false;
    }
  }
  for (const symbol of Object.getOwnPropertySymbols(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, symbol);
    if (
      !allowBrand ||
      symbol !== providerSafePayloadBrand ||
      descriptor?.value !== true ||
      descriptor.enumerable !== false ||
      descriptor.writable !== false ||
      descriptor.configurable !== false
    ) {
      return false;
    }
  }
  return true;
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
