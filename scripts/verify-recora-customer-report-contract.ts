import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  RECORA_CUSTOMER_REPORT_EVIDENCE_UNITS,
  RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS,
  RECORA_CUSTOMER_REPORT_METRIC_KEYS,
  RECORA_CUSTOMER_REPORT_QUERY_KEYS,
  RECORA_CUSTOMER_REPORT_ROUTES,
  RECORA_CUSTOMER_REPORT_SENTIMENTS,
  assertRecoraCustomerReportFixtureUse,
  buildRecoraCustomerReportPath,
  calculateRecoraCustomerReportMetrics,
  validateRecoraCustomerReportCrossContract,
  validateRecoraCustomerReportEvidenceBundle,
  validateRecoraCustomerReportQuery,
  type RecoraCustomerReportEvidenceBundle
} from "../lib/recora/customer-report-contract";
import {
  RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
  RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE
} from "./fixtures/recora-customer-report-contract-fixtures";

validateRecoraCustomerReportCrossContract();

assert.equal(RECORA_CUSTOMER_REPORT_METRIC_KEYS.length, 5);
assert.equal(new Set(RECORA_CUSTOMER_REPORT_METRIC_KEYS).size, 5);
assert.equal(RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS.length, 5);
assert.equal(RECORA_CUSTOMER_REPORT_SENTIMENTS.length, 4);
assert.equal(RECORA_CUSTOMER_REPORT_EVIDENCE_UNITS.length, 6);
assert.equal(RECORA_CUSTOMER_REPORT_QUERY_KEYS.length, 18);

assert.deepEqual(
  RECORA_CUSTOMER_REPORT_ROUTES.map((route) => route.number),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
);
assert.deepEqual(
  RECORA_CUSTOMER_REPORT_ROUTES.map((route) => route.path),
  [
    "/dashboard/reports/{id}",
    "/dashboard/reports/{id}/trends",
    "/dashboard/reports/{id}/leaderboard",
    "/dashboard/reports/{id}/persona-topics",
    "/dashboard/reports/{id}/prompts",
    "/dashboard/reports/{id}/conversations",
    "/dashboard/reports/{id}/brand-perception",
    "/dashboard/reports/{id}/sources",
    "/dashboard/reports/{id}/recommendations",
    "/dashboard/reports/{id}/settings"
  ]
);
assert.equal(
  buildRecoraCustomerReportPath("sources", "report-kintai-cloud"),
  "/dashboard/reports/report-kintai-cloud/sources"
);

assert.equal(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.synthetic, true);
assert.equal(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.projectName, "勤怠クラウド");
assert.equal(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.modelCount, 4);
assert.equal(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.targetBrandCount, 20);
assertRecoraCustomerReportFixtureUse(true, "test");
assertRecoraCustomerReportFixtureUse(true, "design_preview");
assert.throws(
  () => assertRecoraCustomerReportFixtureUse(true, "production_measurement"),
  /synthetic fixture/
);
assert.throws(
  () => assertRecoraCustomerReportFixtureUse(true, "published_report"),
  /synthetic fixture/
);

const firstRun = calculateRecoraCustomerReportMetrics(
  RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.observations,
  RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING
);
const secondRun = calculateRecoraCustomerReportMetrics(
  RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.observations,
  RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING
);
assert.deepEqual(firstRun, secondRun);

for (const result of firstRun) {
  const expected = RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.expectedMetrics[result.key];
  assert.equal(result.status, "available", result.key);
  assert.equal(result.numerator, expected.numerator, `${result.key} numerator`);
  assert.equal(result.denominator, expected.denominator, `${result.key} denominator`);
  assert.equal(result.value, expected.value, `${result.key} value`);
}

const emptyResults = calculateRecoraCustomerReportMetrics(
  [],
  RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING
);
assert.equal(emptyResults.every((result) => result.status === "not_available"), true);
assert.equal(emptyResults.every((result) => result.value === null), true);

const sentimentTotal = Object.values(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.sentiment)
  .reduce((total, count) => total + count, 0);
assert.equal(sentimentTotal, 25);
assert.equal(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.sentiment.unclassified, 1);

validateRecoraCustomerReportEvidenceBundle(RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.evidence);
assert.equal(sumEvidence("citation_occurrence"), 148);
assert.equal(
  sumEvidence("normalized_source_url_page", ["owned", "external"]),
  64
);
assert.deepEqual(
  [
    findEvidence("question", "recommendation-display"),
    findEvidence("answer", "recommendation-display"),
    findEvidence("normalized_source_url_page", "recommendation-display")
  ],
  [7, 12, 4]
);

validateRecoraCustomerReportQuery(
  "metric=ai_visibility_rate&range=30d&compare=previous_period&model=gpt-5.6&date=2026-08-05&domain=example.com&prompt=prompt-alpha"
);
validateRecoraCustomerReportQuery("?guide_q=AI%E8%A1%A8%E7%A4%BA%E7%8E%87");
for (const query of [
  "return=%2Fdashboard",
  "promptId=prompt-alpha",
  "questionId=question-alpha",
  "brandId=brand-alpha",
  "modelId=model-alpha",
  "promptIds=prompt-alpha",
  "view=all-models",
  "provider=openai",
  "q=test",
  "sort=latest",
  "page=2"
]) {
  assert.throws(() => validateRecoraCustomerReportQuery(query), /unknown query key/);
}
assert.throws(
  () => validateRecoraCustomerReportQuery("metric=ai_visibility_rate&metric=cited_answer_rate"),
  /duplicate query key/
);
assert.throws(() => validateRecoraCustomerReportQuery("metric="), /empty query value/);
assert.throws(() => validateRecoraCustomerReportQuery("metric=legacy_metric"), /invalid enum value/);
assert.throws(() => validateRecoraCustomerReportQuery("date=2026%2"), /invalid percent encoding/);
assert.throws(
  () => validateRecoraCustomerReportQuery("evidenceRef=550e8400-e29b-41d4-a716-446655440000"),
  /internal id/
);
assert.throws(
  () => validateRecoraCustomerReportQuery("answer=measurement-run-77"),
  /internal value/
);
assert.throws(() => validateRecoraCustomerReportQuery("guide_q=user%40example.com"), /email/);
assert.throws(
  () => validateRecoraCustomerReportQuery("sourceUrlId=https%3A%2F%2Fexample.com%2Fdownload"),
  /URL is not allowed/
);

const baselineObservation = RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.observations[0];
assert.throws(
  () =>
    calculateRecoraCustomerReportMetrics(
      [baselineObservation, { ...baselineObservation, observationId: "duplicate-core-answer" }],
      RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING
    ),
  /duplicate core weight/
);
assert.throws(
  () => calculateRecoraCustomerReportMetrics([
    { ...baselineObservation, observationId: "branded-market-answer", brandScope: "branded" }
  ], RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING),
  /branded observation/
);
assert.throws(
  () => calculateRecoraCustomerReportMetrics([
    {
      ...baselineObservation,
      observationId: "mixed-citation-answer",
      metricEligibility: {
        ...baselineObservation.metricEligibility,
        forced_citation_validation: {
          state: "eligible",
          reason_codes: ["invalid_mixed_fixture"]
        }
      }
    }
  ], RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING),
  /natural and forced citation/
);
assert.throws(
  () => calculateRecoraCustomerReportMetrics([
    {
      ...baselineObservation,
      observationId: "missing-position-answer",
      targetBrandMentioned: true,
      targetBrandFirstPosition: null
    }
  ], RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING),
  /valid first position is required/
);
assert.throws(
  () => calculateRecoraCustomerReportMetrics([
    {
      ...baselineObservation,
      observationId: "fractional-count-answer",
      approvedTargetBrandMentionCount: 0.5
    }
  ], RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING),
  /non-negative integer/
);
assert.throws(
  () => calculateRecoraCustomerReportMetrics([
    {
      ...baselineObservation,
      observationId: "foreign-publication-answer",
      binding: {
        ...RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
        publicationVersionId: "publication-v2"
      }
    }
  ], RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING),
  /publicationVersionId mismatch/
);

const mismatchedEvidence: RecoraCustomerReportEvidenceBundle = {
  ...RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.evidence,
  items: [
    {
      ...RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.evidence.items[0],
      binding: {
        ...RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
        projectId: "project-other"
      }
    }
  ]
};
assert.throws(
  () => validateRecoraCustomerReportEvidenceBundle(mismatchedEvidence),
  /projectId mismatch/
);

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};
assert.match(
  packageJson.scripts["recora:customer-report-contract:check"] ?? "",
  /verify-recora-customer-report-contract\.ts/
);
assert.match(
  packageJson.scripts["recora:measurement-persona-compiler:check"] ?? "",
  /verify-recora-measurement-persona-compiler\.ts/
);
assert.match(
  packageJson.scripts["recora:preflight"] ?? "",
  /recora:customer-report-contract:check/
);
assert.match(
  packageJson.scripts["recora:preflight"] ?? "",
  /recora:measurement-persona-compiler:check/
);

const docsIndex = readFileSync("docs/README.md", "utf8");
assert.match(docsIndex, /recora-customer-ui-implementation-start-spec-v1\.md/);
const startSpec = readFileSync("docs/recora-customer-ui-implementation-start-spec-v1.md", "utf8");
assert.match(startSpec, /Issue #183/);
assert.match(startSpec, /synthetic/);
assert.match(startSpec, /current publication/);

const output = {
  contract: "PASS",
  fixture: RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.version,
  metrics: firstRun.map((result) => ({
    key: result.key,
    numerator: result.numerator,
    denominator: result.denominator,
    value: result.value,
    unit: result.unit
  })),
  sentimentTotal,
  routeCount: RECORA_CUSTOMER_REPORT_ROUTES.length,
  queryKeyCount: RECORA_CUSTOMER_REPORT_QUERY_KEYS.length
};

console.log(JSON.stringify(output));

function sumEvidence(unit: string, groups?: readonly string[]): number {
  return RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.evidence.items
    .filter((item) => item.unit === unit && (!groups || groups.includes(item.group)))
    .reduce((total, item) => total + item.count, 0);
}

function findEvidence(unit: string, group: string): number {
  const item = RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE.evidence.items.find(
    (candidate) => candidate.unit === unit && candidate.group === group
  );
  assert.ok(item, `${unit}/${group} evidence missing`);
  return item.count;
}
