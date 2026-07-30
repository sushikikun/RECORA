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

type SuccessfulEntitlementSnapshot = Extract<EntitlementResolution, { ok: true }> ["snapshot"];

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
      domain: "example.com",
      url: "https://example.com/",
      aliases: ["Example"],
      category: "analytics",
      description: "Public product description.",
    },
    competitors: [
      {
        entityType: "company",
        name: "Competitor One",
        domain: "example.org",
        aliases: [],
      },
    ],
    locale: "ja-JP",
    language: "ja",
    toolConfig: { webSearch: false, publicPageText: false },
    pageText: [],
  };
}

function page(overrides: Record<string, unknown> = {}) {
  return {
    sourceUrl: "https://example.com/public-page",
    publicHost: "example.com",
    classification: "public",
    retrievedAt: "2026-07-30T00:00:00.000Z",
    contentVersion: "public-v1",
    text: "Public page text.",
    ...overrides,
  };
}

function publicPageInput(overrides: Record<string, unknown> = {}) {
  return {
    ...input(),
    toolConfig: { webSearch: false, publicPageText: true },
    pageText: [page(overrides)],
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

function malformedSuccessfulResolution(snapshotOverrides: Record<string, unknown>): EntitlementResolution {
  const accepted = resolution();
  assert.equal(accepted.ok, true);
  return {
    ok: true,
    reasonCode: "ok",
    snapshot: { ...accepted.snapshot, ...snapshotOverrides } as unknown as SuccessfulEntitlementSnapshot,
  };
}

for (const entityType of ["product", "service", "store", "company", "brand"] as const) {
  const result = buildProviderSafePayload(context(), input(entityType));
  assert.equal(result.payload.analysisTarget.entityType, entityType);
}

const first = buildProviderSafePayload(context(), input());
const second = buildProviderSafePayload(context(), input());
const canonical = canonicalizeProviderSafePayload(first.payload);
assert.equal(first.payloadHash, second.payloadHash);
assert.equal(canonical, canonicalizeProviderSafePayload(second.payload));
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
assert.equal(Object.getOwnPropertySymbols(first.payload).length, 1);
assert.equal(Object.getOwnPropertyDescriptor(first.payload, Object.getOwnPropertySymbols(first.payload)[0]!)?.enumerable, false);
assert.equal(Object.isFrozen(first.payload), true);
assert.equal(Object.isFrozen(first.payload.analysisTarget), true);
assert.equal(Object.isFrozen(first.payload.analysisTarget.aliases), true);
assert.equal(Object.isFrozen(first.payload.toolConfig), true);
assert.equal(Object.isFrozen(first.payload.competitors), true);
assert.equal(Object.isFrozen(first.payload.pageText), true);
assert.throws(() => {
  (first.payload as unknown as { question: string }).question = "mutated";
}, TypeError);
assert.throws(() => {
  (first.payload.analysisTarget.aliases as unknown as string[]).push("mutated");
}, TypeError);
assert.equal(canonicalizeProviderSafePayload(first.payload), canonical);
expectDenied(
  () => canonicalizeProviderSafePayload({ ...first.payload } as typeof first.payload),
  "invalid_payload",
);

const adapter: ProviderSafePayloadAdapter<string> = {
  async execute(payload) {
    return payload.requestId;
  },
};
void adapter.execute(first.payload);

for (const malformedContext of [
  null,
  undefined,
  {},
  { ...context(), entitlementResolution: undefined },
  { ...context(), payloadPolicy: { schemaVersion: 1 } },
  { ...context(), publicClassificationEvidence: undefined },
]) {
  expectDenied(
    () => buildProviderSafePayload(malformedContext as ExternalAiExecutionContext, input()),
    "invalid_internal_context",
  );
}

const { entitlementResolution: _resolution, ...withoutResolution } = context();
expectDenied(
  () => buildProviderSafePayload(withoutResolution as ExternalAiExecutionContext, input()),
  "invalid_internal_context",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ entitlementResolution: malformedSuccessfulResolution({ capabilities: [] }) }),
      input(),
    ),
  "invalid_internal_context",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ entitlementResolution: malformedSuccessfulResolution({ limits: "unavailable" }) }),
      input(),
    ),
  "invalid_internal_context",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ entitlementResolution: malformedSuccessfulResolution({ hash: "not-a-hash" }) }),
      input(),
    ),
  "invalid_internal_context",
);
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
  () => buildProviderSafePayload(context({ requestId: "request 114 a" }), input()),
  "invalid_internal_context",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ payloadPolicy: { schemaVersion: 1, policyVersion: "payload policy 114" } }),
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
      context({ entitlementResolution: resolution({ capabilities: { "external_ai.execute": false } }) }),
      input(),
    ),
  "capability_unavailable",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ entitlementResolution: resolution({ limits: { "external_ai.prompt_bytes": 0 } }) }),
      input(),
    ),
  "limit_unavailable",
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ entitlementResolution: resolution({ capabilities: { "external_ai.web_search": false } }) }),
      { ...input(), toolConfig: { webSearch: true, publicPageText: false } },
    ),
  "capability_unavailable",
);

expectDenied(
  () => buildProviderSafePayload(context(), { ...input(), organizationId: "organization-114-b" }),
  "tenant_scope_mismatch",
);
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

const secretLikeValues = [
  ["sk", "-", "abcdefghijklmnop"].join(""),
  ["sk", "-proj", "-", "abcdefghijklmnop"].join(""),
  ["gh", "p_", "abcdefghijklmnop"].join(""),
  ["github", "_pat_", "abcdefghijklmnop"].join(""),
  ["AK", "IA", "ABCDEFGHIJKLMNOP"].join(""),
  ["xo", "xb-", "abcdefghijklmnop"].join(""),
  ["AI", "za", "abcdefghijklmnop"].join(""),
  ["sk", "_live_", "abcdefghijklmnop"].join(""),
  ["Bearer", " ", "abcdefghijklmnop"].join(""),
  ["api", "_key", "=value"].join(""),
  ["secret", ":value"].join(""),
  ["password", "=value"].join(""),
  ["credential", ":value"].join(""),
  ["token", "=value"].join(""),
  ["person", "@", "example", ".com"].join(""),
  ["090", "-1234", "-5678"].join(""),
  ["+1", " 202", " 555", " 0198"].join(""),
  ["eyJhbGciOiJub25l", "payload", "signature"].join("."),
  ["post", "gres", "://host/db"].join(""),
  ["-----BE", "GIN PRIVATE ", "KEY-----"].join(""),
];
for (const unsafeValue of secretLikeValues) {
  expectDenied(() => buildProviderSafePayload(context(), { ...input(), question: unsafeValue }), "unsafe_content");
  expectDenied(() =>
    buildProviderSafePayload(context(), {
      ...input(),
      analysisTarget: { ...input().analysisTarget, name: unsafeValue },
    }),
  );
  expectDenied(() =>
    buildProviderSafePayload(context(), {
      ...input(),
      analysisTarget: { ...input().analysisTarget, aliases: [unsafeValue] },
    }),
  );
  expectDenied(() =>
    buildProviderSafePayload(context(), {
      ...input(),
      analysisTarget: { ...input().analysisTarget, description: unsafeValue },
    }),
  );
  expectDenied(() => buildProviderSafePayload(context(), publicPageInput({ text: unsafeValue })));
}

const unsafeQuery = ["api", "_key", "=opaque"].join("");
expectDenied(() =>
  buildProviderSafePayload(
    context(),
    publicPageInput({ sourceUrl: `https://example.com/public?${unsafeQuery}` }),
  ),
);

expectDenied(() => buildProviderSafePayload(context(), { ...input(), question: "x".repeat(513) }), "limit_exceeded");
expectDenied(
  () => buildProviderSafePayload(context(), publicPageInput({ text: "x".repeat(513) })),
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
    pageText: Array.from({ length: 9 }, () => page()),
  }),
);
expectDenied(
  () =>
    buildProviderSafePayload(
      context({ entitlementResolution: resolution({ limits: { "external_ai.total_payload_bytes": 64 } }) }),
      input(),
    ),
  "limit_exceeded",
);

const wide: Record<string, string> = {};
for (let index = 0; index < 97; index += 1) wide[`field${index}`] = "x";
expectDenied(() => buildProviderSafePayload(context(), { ...input(), extra: wide }), "limit_exceeded");
let deep: unknown = "x";
for (let index = 0; index < 7; index += 1) deep = { next: deep };
expectDenied(() => buildProviderSafePayload(context(), { ...input(), extra: deep }), "limit_exceeded");
const aliases = Array.from({ length: 16 }, (_, index) => `Alias ${index}`);
expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    analysisTarget: { ...input().analysisTarget, aliases },
    competitors: Array.from({ length: 4 }, (_, index) => ({
      entityType: "brand",
      name: `Competitor ${index}`,
      aliases,
    })),
  }),
  "limit_exceeded",
);
expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    extra: Array.from({ length: 20 }, () => "x".repeat(4_096)),
  }),
  "limit_exceeded",
);

for (const unsafePageUrl of [
  "http://example.com/plain",
  "https://user:pass@example.com/private",
  "https://127.0.0.1/private",
  "https://[::ffff:127.0.0.1]/private",
  "https://224.0.0.1/private",
  "https://service.local/private",
  "https://service.internal/private",
  "https://service.lan/private",
  "https://service.home/private",
  "https://service.test/private",
  "https://service.invalid/private",
  "https://single-label/private",
  "https://example.com./private",
]) {
  expectDenied(() => buildProviderSafePayload(context(), publicPageInput({ sourceUrl: unsafePageUrl })));
}

for (const unsafeText of [
  "<p>HTML tag</p>",
  "<script>unsafe()</script>",
  ["plain", "\u0000", "text"].join(""),
  ["plain", "\u0007", "text"].join(""),
]) {
  expectDenied(() => buildProviderSafePayload(context(), publicPageInput({ text: unsafeText })), "unsafe_content");
}

const visiblePrompt = "never include this prompt in an error";
const visiblePage = "never include this page text in an error";
const safeError = expectDenied(() =>
  buildProviderSafePayload(context(), {
    ...input(),
    question: [["person", "@", "example", ".com"].join(""), visiblePrompt].join(" "),
    toolConfig: { webSearch: false, publicPageText: true },
    pageText: [page({ text: visiblePage })],
  }),
);
assert.equal(safeError.message.includes(visiblePrompt), false);
assert.equal(safeError.message.includes(visiblePage), false);
assert.equal(safeError.message.includes("person@example.com"), false);

assert.match(moduleSource, /execute\(payload: ProviderSafePayload\): Promise<TOutput>/);
assert.doesNotMatch(moduleSource, /execute\(payload: unknown\)/);
assert.doesNotMatch(moduleSource, /from\s+["']openai["']|new\s+OpenAI|\.responses\.create\(/);
assert.doesNotMatch(moduleSource, /\bfetch\s*\(|\blookup\s*\(|process\.env|console\./);
assert.doesNotMatch(moduleSource, /createRecoraSupabase|\.from\s*\(|\.rpc\s*\(/);
assert.doesNotMatch(moduleSource, /\.env/);

console.log(
  JSON.stringify(
    {
      status: "ok",
      scope: "issue-114-external-ai-payload-safety",
      providerCalls: "absent",
      databaseCalls: "absent",
      networkCalls: "absent",
      cases: ["allowlist", "context", "privacy", "raw-budget", "url", "plain-text", "runtime-brand"],
    },
    null,
    2,
  ),
);
