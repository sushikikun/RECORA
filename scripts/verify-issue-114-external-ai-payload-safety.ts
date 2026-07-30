import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildProviderSafePayload,
  canonicalizeProviderSafePayload,
  ExternalAiPayloadSafetyError,
  type ExternalAiExecutionContext,
  type ProviderSafePayloadAdapter,
} from "../lib/recora/external-ai-payload-safety";
import type { EntitlementResolution } from "../lib/recora/entitlement-snapshots";

const repoRoot = process.cwd();
const modulePath = path.join(repoRoot, "lib", "recora", "external-ai-payload-safety.ts");
const moduleSource = fs.readFileSync(modulePath, "utf8");

type SuccessfulEntitlementSnapshot = Extract<EntitlementResolution, { ok: true }>["snapshot"];

function resolution(overrides: Partial<SuccessfulEntitlementSnapshot> = {}): EntitlementResolution {
  const { capabilities, limits, ...snapshotOverrides } = overrides;
  return {
    ok: true,
    reasonCode: "ok",
    snapshot: {
      snapshotId: "snapshot-114-a",
      schemaVersion: 1,
      capabilities: {
        "external_ai.execute": true,
        "external_ai.web_search": true,
        "external_ai.public_page_text": true,
        ...capabilities,
      },
      limits: {
        "external_ai.prompt_bytes": 512,
        "external_ai.page_text_bytes": 512,
        "external_ai.total_payload_bytes": 4_096,
        "external_ai.competitor_count": 4,
        ...limits,
      },
      resolverVersion: "resolver-114-v1",
      hash: "a".repeat(64),
      effectiveFrom: "2026-07-30T00:00:00.000Z",
      effectiveUntil: null,
      ...snapshotOverrides,
    },
  };
}

function context(overrides: Partial<ExternalAiExecutionContext> = {}): ExternalAiExecutionContext {
  return {
    organizationId: "organization-114-a",
    projectId: "project-114-a",
    entitlementResolution: resolution(),
    requestId: "request-114-a",
    correlationId: "correlation-114-a",
    payloadPolicy: { schemaVersion: 1, policyVersion: "payload-policy-114-v1" },
    publicClassificationEvidence: {
      organizationId: "organization-114-a",
      projectId: "project-114-a",
      classification: "public",
    },
    ...overrides,
  };
}

function input(entityType: "product" | "service" | "store" | "company" | "brand" = "brand") {
  return {
    organizationId: "organization-114-a",
    projectId: "project-114-a",
    question: "Which public options are suitable for a market comparison?",
    analysisTarget: {
      entityType,
      name: "Example Brand",
      domain: "example.test",
      url: "https://example.test/",
      aliases: ["Example"],
      category: "analytics",
      description: "Public product description.",
    },
    competitors: [
      {
        entityType: "company",
        name: "Competitor One",
        domain: "competitor.test",
        aliases: [],
      },
    ],
    locale: "ja-JP",
    language: "ja",
    toolConfig: { webSearch: false, publicPageText: false },
    pageText: [],
  };
}

function expectDenied(action: () => unknown, expectedCode?: ExternalAiPayloadSafetyError["code"]) {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ExternalAiPayloadSafetyError);
  const error = caught;
  assert.equal(error.message, "External AI payload is not allowed.");
  if (expectedCode) assert.equal(error.code, expectedCode);
  return error;
}

for (const entityType of ["product", "service", "store", "company", "brand"] as const) {
  const result = buildProviderSafePayload(context(), input(entityType));
  assert.equal(result.payload.analysisTarget.entityType, entityType);
}

const first = buildProviderSafePayload(context(), input());
const second = buildProviderSafePayload(context(), input());
assert.equal(first.payloadHash, second.payloadHash);
assert.equal(canonicalizeProviderSafePayload(first.payload), canonicalizeProviderSafePayload(second.payload));
assert.deepEqual(Object.keys(first.payload).sort(), [
  "analysisTarget",
  "competitors",
  "language",
  "locale",
  "pageText",
  "policyVersion",
  "question",
  "requestId",
  "schemaVersion",
  "toolConfig",
]);
assert.equal(JSON.stringify(first.payload).includes("organization-114-a"), false);
assert.equal(JSON.stringify(first.payload).includes("project-114-a"), false);
assert.equal(JSON.stringify(first.payload).includes("snapshot-114-a"), false);
assert.equal(JSON.stringify(first.payload).includes("billing"), false);

const adapter: ProviderSafePayloadAdapter<string> = {
  async execute(payload) {
    return payload.requestId;
  },
};
void adapter.execute(first.payload);

expectDenied(() => buildProviderSafePayload(context(), { ...input(), unknownField: true }));
expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    analysisTarget: { ...input().analysisTarget, databaseId: "row-114" },
  }),
);
expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    analysisTarget: { ...input().analysisTarget, aliases: [{ internalNote: "not-public" }] },
  }),
);

for (const unsafeValue of [
  ["person", "@", "example", ".test"].join(""),
  ["+1", " 202", " 555", " 0198"].join(""),
  ["eyJhbGciOiJub25l", "payload", "signature"].join("."),
  ["access", "_token", "=value"].join(""),
  ["post", "gres", "://host/db"].join(""),
  ["-----BE", "GIN PRIVATE ", "KEY-----"].join(""),
  "billing detail",
  "operator support note",
]) {
  expectDenied(() => buildProviderSafePayload(context(), { ...input(), question: unsafeValue }));
}

expectDenied(() => buildProviderSafePayload(context(), { ...input(), organizationId: "organization-114-b" }), "tenant_scope_mismatch");
expectDenied(
  () =>
    buildProviderSafePayload(
      context({
        publicClassificationEvidence: {
          organizationId: "organization-114-b",
          projectId: "project-114-a",
          classification: "public",
        },
      }),
      input(),
    ),
  "invalid_internal_context",
);
expectDenied(
  () => buildProviderSafePayload(context({ entitlementResolution: { ok: false, reasonCode: "no_snapshot" } }), input()),
  "entitlement_unavailable",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({
        entitlementResolution: resolution({
          capabilities: { "external_ai.execute": false },
        }),
      }),
      input(),
    ),
  "capability_unavailable",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({
        entitlementResolution: resolution({
          limits: { "external_ai.prompt_bytes": Number.NaN },
        }),
      }),
      input(),
    ),
  "limit_unavailable",
);

expectDenied(
  () =>
    buildProviderSafePayload(
      context({
        entitlementResolution: resolution({
          capabilities: {
            "external_ai.execute": true,
            "external_ai.web_search": false,
            "external_ai.public_page_text": false,
          },
        }),
      }),
      {
        ...input(),
        toolConfig: { webSearch: true, publicPageText: false },
      },
    ),
  "capability_unavailable",
);

const page = {
  sourceUrl: "https://example.test/public-page",
  publicHost: "example.test",
  classification: "public",
  retrievedAt: "2026-07-30T00:00:00.000Z",
  contentVersion: "public-v1",
  text: "Public page text.",
};
expectDenied(() => buildProviderSafePayload(context(), { ...input(), pageText: [page] }));
expectDenied(() => buildProviderSafePayload(context(), { ...input(), question: "x".repeat(513) }), "limit_exceeded");
expectDenied(
  () =>
    buildProviderSafePayload(context(), {
      ...input(),
      toolConfig: { webSearch: false, publicPageText: true },
      pageText: [{ ...page, text: "x".repeat(513) }],
    }),
  "limit_exceeded",
);
expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    competitors: Array.from({ length: 5 }, (_, index) => ({
      entityType: "brand",
      name: `Competitor ${index}`,
      aliases: [],
    })),
  }),
);
expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    toolConfig: { webSearch: false, publicPageText: true },
    pageText: Array.from({ length: 9 }, () => page),
  }),
);
expectDenied(() =>
  buildProviderSafePayload(
    context({ entitlementResolution: resolution({ limits: { "external_ai.total_payload_bytes": 64 } }) }),
    input(),
  ),
  "limit_exceeded",
);

for (const unsafePage of [
  { ...page, sourceUrl: "http://example.test/plain", publicHost: "example.test" },
  { ...page, sourceUrl: "https://user:pass@example.test/private", publicHost: "example.test" },
  { ...page, sourceUrl: "https://127.0.0.1/private", publicHost: "127.0.0.1" },
  { ...page, sourceUrl: "https://service.local/private", publicHost: "service.local" },
]) {
  expectDenied(() =>
    buildProviderSafePayload(context(), {
      ...input(),
      toolConfig: { webSearch: false, publicPageText: true },
      pageText: [unsafePage],
    }),
  );
}

const visiblePrompt = "never include this prompt in an error";
const visiblePage = "never include this page text in an error";
const safeError = expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    question: ["person", "@", "example", ".test", " ", visiblePrompt].join(""),
    toolConfig: { webSearch: false, publicPageText: true },
    pageText: [{ ...page, text: visiblePage }],
  }),
);
assert.equal(safeError.message.includes(visiblePrompt), false);
assert.equal(safeError.message.includes(visiblePage), false);
assert.equal(safeError.message.includes("person@example.test"), false);

assert.match(moduleSource, /execute\(payload: ProviderSafePayload\): Promise<TOutput>/);
assert.doesNotMatch(moduleSource, /execute\(payload: unknown\)/);
assert.doesNotMatch(moduleSource, /from\s+["']openai["']|new\s+OpenAI|\.responses\.create\(/);
assert.doesNotMatch(moduleSource, /\bfetch\s*\(|\blookup\s*\(|process\.env|console\./);
assert.doesNotMatch(moduleSource, /createRecoraSupabase|\.from\s*\(|\.rpc\s*\(/);

console.log(
  JSON.stringify(
    {
      status: "ok",
      scope: "issue-114-external-ai-payload-safety",
      providerCalls: "absent",
      databaseCalls: "absent",
      networkCalls: "absent",
      cases: ["allowlist", "entitlement", "privacy", "size", "url", "adapter"],
    },
    null,
    2,
  ),
);
