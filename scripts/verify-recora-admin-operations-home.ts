import assert from "node:assert/strict";

import { createAdminOperationsHomeSnapshot } from "../lib/recora/admin-operations-home";
import type { RecoraAdminOperationProjectSummary } from "../lib/recora/db/admin-operations";

function project(
  overrides: Partial<RecoraAdminOperationProjectSummary> = {}
): RecoraAdminOperationProjectSummary {
  return {
    projectSlug: "project-a",
    projectName: "Project A",
    brandName: "Brand A",
    targetUrl: "https://example.com",
    dataBoundaryLabel: "customer",
    latestMeasurementAt: "2026-08-05T10:00:00.000Z",
    latestMeasurementRunId: "measurement-run-a",
    measurementStatus: "設定済み",
    aggregateStatus: "設定済み",
    recommendationStatus: "未設定",
    reportUrl: "/dashboard/reports/project-a",
    reportReadyStatus: "not_ready",
    reportReadyStatusLabel: "レポート準備中",
    reportReadyBlockingReasons: [],
    reportReadyDiagnosticNotes: [],
    currentRemainingIssues: [],
    currentAggregateRunId: "aggregate-run-a",
    currentSourceMeasurementRunId: "measurement-run-a",
    currentMetricSnapshotCount: 1,
    currentValidObservationCount: 1,
    customerVisibleRecommendationCount: 0,
    completedMeasurementRuns: [{
      id: "measurement-run-a",
      label: "run a",
      completedAt: "2026-08-05T10:00:00.000Z",
      aiConversationCount: 1,
      promptCount: 1,
      searchMode: "combined",
      measurementProfileId: "profile-a"
    }],
    ...overrides
  };
}

const sameCodeA = createAdminOperationsHomeSnapshot({
  projects: [project({ currentRemainingIssues: [{ code: "placeholder_evidence_detected", message: "仮データを確認してください。" }] })]
});
const sameCodeB = createAdminOperationsHomeSnapshot({
  projects: [project({ currentRemainingIssues: [{ code: "placeholder_evidence_detected", message: "公開の失敗という語を含む別文面です。" }] })]
});
assert.equal(sameCodeA.humanAttention.items[0]?.navigationDomain, "quality");
assert.equal(sameCodeB.humanAttention.items[0]?.navigationDomain, "quality");
assert.equal(sameCodeA.humanAttention.items[0]?.attentionLevel, sameCodeB.humanAttention.items[0]?.attentionLevel);

const unknown = createAdminOperationsHomeSnapshot({
  projects: [project({ currentRemainingIssues: [{ code: "future_unknown_reason", message: "測定が失敗しています。" }] })]
});
assert.equal(unknown.humanAttention.items.length, 0);
assert.equal(unknown.operationalSignals.length, 0);
assert.equal(unknown.adapterWarnings.unclassifiedReasons.length, 1);

const recommendation = createAdminOperationsHomeSnapshot({
  projects: [project({ currentRemainingIssues: [{ code: "recommendations_not_customer_visible", message: "改善案がありません。" }] })]
});
assert.equal(recommendation.humanAttention.items.length, 0);
assert.equal(recommendation.operationalSignals.length, 0);
assert.equal(recommendation.adapterWarnings.ignoredReasonCount, 1);

const notReadyOnly = createAdminOperationsHomeSnapshot({ projects: [project()] });
assert.equal(notReadyOnly.operationalVerdict.humanAttentionCount, 0);
assert.equal(notReadyOnly.operationalVerdict.operationalSignalCount, 0);
assert.equal(notReadyOnly.publicationStatus.notReadyProjectCount, 1);
assert.equal(notReadyOnly.publicationStatus.notReadyIsHumanAttention, false);

const measurementFailure = createAdminOperationsHomeSnapshot({
  projects: [project({ measurementStatus: "失敗" })]
});
assert.equal(measurementFailure.humanAttention.items.length, 0);
assert.equal(measurementFailure.operationalSignals[0]?.reasonCode, "measurement_status_failed");
assert.match(measurementFailure.operationalSignals[0]?.relatedRoute ?? "", /^\/internal\/measurements\?/);

const pipelineSignal = createAdminOperationsHomeSnapshot({
  projects: [project({ currentRemainingIssues: [{ code: "report_run_not_found", message: "任意の文面" }] })]
});
assert.equal(pipelineSignal.humanAttention.items.length, 0);
assert.equal(pipelineSignal.operationalSignals[0]?.domain, "measurement");

const qualityRoute = sameCodeA.humanAttention.items[0]?.relatedRoute ?? "";
assert.match(qualityRoute, /^\/internal\/quality\?/);
assert.match(qualityRoute, /reason=placeholder_evidence_detected/);

const normalProject = project({
  projectSlug: "normal-project",
  projectName: "Normal Project",
  brandName: "Normal Brand",
  reportReadyStatus: "customer_ready",
  reportReadyStatusLabel: "公開可能"
});
const affectedOnly = createAdminOperationsHomeSnapshot({
  projects: [normalProject, project({ measurementStatus: "失敗" })]
});
assert.deepEqual(affectedOnly.affectedProjects.map((item) => item.projectSlug), ["project-a"]);

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    messageIndependentClassification: true,
    unknownReasonFailsClosed: true,
    optionalRecommendationExcluded: true,
    notReadyAloneIsNotAttention: true,
    measurementFailureIsSignalNotAttention: true,
    pipelineReasonIsSignal: true,
    domainRouteIsExplicit: true,
    affectedProjectsExcludeNormalRows: true
  }
}, null, 2));
