import assert from "node:assert/strict";

import { buildRecoraReportViewModel } from "../lib/recora/report-tabs-view-model";
import type {
  Json,
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraPersonaRow,
  RecoraProjectRow,
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRunItemRow,
  RecoraSourceDomainRow,
  RecoraTopicRow
} from "../lib/recora/db/types";

const now = "2026-07-01T00:00:00.000Z";

type PromptWithReportMetadata = RecoraPromptRow & {
  prompt_type?: string;
  measurement_purpose?: string;
  use_case?: string;
  funnel_stage?: string;
  category?: string;
};

const project: RecoraProjectRow = {
  id: "project-1",
  organization_id: "org-1",
  slug: "recora-demo",
  name: "Recora Demo",
  workspace_name: "Recora",
  language: "ja",
  region: "JP",
  default_period: "2026-07",
  created_at: now,
  updated_at: now
};

const currentRun: RecoraMeasurementRunRow = {
  id: "run-1",
  project_id: project.id,
  status: "completed",
  period_start: "2026-06-01",
  period_end: "2026-06-30",
  comparison_start: null,
  comparison_end: null,
  region: "JP",
  language: "ja",
  started_at: now,
  completed_at: now,
  metadata: { run_kind: "measurement", data_source: "openai_measurement" },
  created_at: now,
  updated_at: now
};

const aggregateRun: RecoraMeasurementRunRow = {
  ...currentRun,
  id: "aggregate-1",
  metadata: { run_kind: "aggregate", data_source: "openai_measurement", source_run_id: currentRun.id }
};

const brands: RecoraBrandRow[] = [
  brand("brand-recora", "Recora", "primary", "recora.test"),
  brand("brand-alpha", "Alpha Search", "competitor", "alpha.test")
];

const personas: RecoraPersonaRow[] = [
  {
    id: "persona-marketing",
    project_id: project.id,
    name: "Marketing leader",
    segment: "B2B SaaS",
    weight: 1,
    jobs: ["Compare tools"],
    pain_points: ["Unclear AI visibility"],
    is_active: true,
    created_at: now,
    updated_at: now
  }
];

const topics: RecoraTopicRow[] = [
  {
    id: "topic-ai-search",
    project_id: project.id,
    name: "AI search diagnostics",
    intent: "comparison",
    priority: "high",
    weight: 1,
    is_active: true,
    created_at: now,
    updated_at: now
  }
];

const promptsWithMetadata: PromptWithReportMetadata[] = [
  prompt("prompt-1", {
    prompt_type: "non_branded",
    measurement_purpose: "visibility",
    use_case: "tool_comparison",
    funnel_stage: "comparison",
    category: "ai_search"
  }),
  prompt("prompt-2", {
    prompt_type: "non_branded",
    measurement_purpose: "sov",
    use_case: "tool_comparison",
    funnel_stage: "comparison",
    category: "ai_search"
  })
];

const promptsWithoutMetadata: RecoraPromptRow[] = promptsWithMetadata.map((item) => ({
  id: item.id,
  project_id: item.project_id,
  topic_id: item.topic_id,
  persona_id: item.persona_id,
  text: item.text,
  intent: item.intent,
  buyer_stage: item.buyer_stage,
  priority: item.priority,
  is_active: item.is_active,
  created_at: item.created_at,
  updated_at: item.updated_at
}));

const runItems: RecoraRunItemRow[] = [
  runItem("run-item-1", "prompt-1"),
  runItem("run-item-2", "prompt-1"),
  runItem("run-item-3", "prompt-2")
];

const conversations: RecoraAiConversationRow[] = [
  conversation("conversation-1", "run-item-1", "Recora appears with Alpha Search."),
  conversation("conversation-2", "run-item-2", "Alpha Search appears first."),
  conversation("conversation-3", "run-item-3", "Recora and Alpha Search both appear.")
];

const brandMentions: RecoraBrandMentionRow[] = [
  mention("mention-1", "conversation-1", "brand-recora", true, 1, "Recora appears first."),
  mention("mention-2", "conversation-1", "brand-alpha", true, 2, "Alpha Search appears second."),
  mention("mention-3", "conversation-2", "brand-recora", false, null, null),
  mention("mention-4", "conversation-2", "brand-alpha", true, 1, "Alpha Search appears first."),
  mention("mention-5", "conversation-3", "brand-recora", true, 2, "Recora appears with Alpha Search."),
  mention("mention-6", "conversation-3", "brand-alpha", true, 1, "Alpha Search appears first.")
];

const sourceDomains: RecoraSourceDomainRow[] = [
  {
    id: "source-domain-recora",
    project_id: project.id,
    domain: "recora.test",
    source_type: "owned",
    owner_brand_id: "brand-recora",
    trust_label: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "source-domain-alpha",
    project_id: project.id,
    domain: "alpha.test",
    source_type: "competitor",
    owner_brand_id: "brand-alpha",
    trust_label: null,
    created_at: now,
    updated_at: now
  }
];

const citations: RecoraCitationRow[] = [
  citation({
    id: "citation-1",
    conversationId: "conversation-1",
    brandId: "brand-recora",
    sourceDomainId: "source-domain-recora",
    url: "https://recora.test/report",
    domain: "recora.test",
    sourceType: "owned",
    brandRelated: "target_brand",
    sourceFreshnessStatus: "fresh",
    occurrenceCount: 2
  }),
  citation({
    id: "citation-2",
    conversationId: "conversation-2",
    brandId: "brand-alpha",
    sourceDomainId: "source-domain-alpha",
    url: "https://alpha.test/report",
    domain: "alpha.test",
    sourceType: "competitor",
    brandRelated: "competitor",
    sourceFreshnessStatus: "not_checked",
    occurrenceCount: 1
  })
];

const metricSnapshots: RecoraMetricSnapshotRow[] = [
  metricSnapshot("snapshot-recora", "brand-recora", 67, 55, 1.5, 2),
  metricSnapshot("snapshot-alpha", "brand-alpha", 100, 45, 1.25, 1)
];

const recommendations: RecoraRecommendationRow[] = [
  recommendation("recommendation-1", "Improve comparison page evidence", {
    candidate_id: "candidate-1",
    quality_gate_decision: "hold",
    quality_score: 72,
    confidence: "medium"
  })
];

const modelWithoutMetadata = buildRecoraReportViewModel({
  project,
  currentRun,
  aggregateRun,
  brands,
  personas,
  topics,
  prompts: promptsWithoutMetadata,
  runItems,
  conversations,
  brandMentions,
  citations,
  sourceDomains,
  metricSnapshots,
  recommendations,
  generatedAt: null
});

assert.equal(modelWithoutMetadata.availability.prompt_type.status, "needs_metadata");
assert.equal(modelWithoutMetadata.availability.measurement_purpose.status, "needs_metadata");
assert.equal(modelWithoutMetadata.tabs.prompts.promptRows[0]?.status, "needs_metadata");
assert.equal(modelWithoutMetadata.tabs.personaTopics.useCaseRows.value, null);
assert.equal(modelWithoutMetadata.tabs.personaTopics.useCaseRows.availability.status, "needs_metadata");

const model = buildRecoraReportViewModel({
  project,
  currentRun,
  aggregateRun,
  brands,
  personas,
  topics,
  prompts: promptsWithMetadata,
  runItems,
  conversations,
  brandMentions,
  citations,
  sourceDomains,
  metricSnapshots,
  recommendations,
  generatedAt: null
});

assert.equal(model.schemaVersion, "report-tabs-read-model-v1");
assert.equal(model.availability.prompt_type.status, "available");
assert.equal(model.availability.measurement_purpose.status, "available");
assert.equal(model.availability.persona_metadata.status, "available");
assert.equal(model.availability.use_case_metadata.status, "available");
assert.equal(model.availability.funnel_stage_metadata.status, "available");
assert.equal(model.availability.topic_metadata.status, "available");
assert.equal(model.availability.sentiment_labels.status, "available");
assert.equal(model.availability.narrative_labels.status, "needs_extraction");
assert.equal(model.availability.caveat_labels.status, "needs_extraction");
assert.equal(model.availability.position_labels.status, "available");
assert.equal(model.availability.source_owner_type.status, "needs_metadata");
assert.equal(model.availability.source_freshness.status, "partial");
assert.equal(model.availability.ai_readiness.status, "future");
assert.equal(model.availability.blocked_ai_crawlers.status, "future");

assert.equal(model.runSummary.validObservationCount, 3);
assert.equal(model.primaryBrand?.name, "Recora");
assert.equal(model.competitors.length, 1);
assert.equal(model.tabs.overview.metrics.aiPresenceRate.value, 67);
assert.equal(model.tabs.brandCompetitors.rankingRows[0]?.brand.name, "Recora");

const promptOne = model.tabs.prompts.promptRows.find((row) => row.promptId === "prompt-1");
assert.ok(promptOne);
assert.equal(promptOne.status, "ready_for_metrics");
assert.equal(promptOne.metricEligibility.visibility, true);
assert.equal(promptOne.aiPresenceRate.value, 50);
assert.equal(promptOne.promptType.value, "non_branded");
assert.equal(promptOne.measurementPurpose.value, "visibility");

const useCaseRows = model.tabs.personaTopics.useCaseRows.value;
assert.ok(useCaseRows);
assert.equal(useCaseRows[0]?.label, "tool_comparison");

const answerOne = model.tabs.answers.answerRows.find((row) => row.conversationId === "conversation-1");
assert.ok(answerOne);
assert.equal(answerOne.targetBrandPosition.value, "top");
assert.equal(answerOne.targetBrandSentiment.value, "positive");
assert.equal(answerOne.narrative.availability.status, "needs_extraction");

const recoraDomain = model.tabs.citations.domainRows.find((row) => row.domain === "recora.test");
assert.ok(recoraDomain);
assert.equal(recoraDomain.ownerType.value, "owned");
assert.equal(recoraDomain.ownerType.availability.status, "needs_metadata");

assert.equal(model.tabs.recommendations.recommendationRows.length, 1);
assert.equal(model.tabs.recommendations.reviewQueue.availability.status, "future");
assert.equal(model.tabs.recommendations.pageBriefs.availability.status, "future");
assert.equal(model.tabs.recommendations.actionPlan.availability.status, "future");

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    missingPromptScopeReturnsNeedsMetadata: true,
    explicitPromptScopeEnablesPromptMetrics: true,
    personaUseCaseFunnelTopicMetadataSeparated: true,
    answerExtractionGapsRemainNeedsExtraction: true,
    sourceOwnerTypeRequiresMetadata: true,
    sourceFreshnessPartialWhenSomeUnchecked: true,
    futureTechnicalAndWorkflowFieldsNotFabricated: true
  },
  overviewMetrics: model.tabs.overview.metrics,
  promptOne: {
    aiPresenceRate: promptOne.aiPresenceRate.value,
    promptType: promptOne.promptType.value,
    measurementPurpose: promptOne.measurementPurpose.value
  }
}, null, 2));

function brand(
  id: string,
  name: string,
  brandType: RecoraBrandRow["brand_type"],
  domain: string
): RecoraBrandRow {
  return {
    id,
    project_id: project.id,
    brand_type: brandType,
    name,
    reading: null,
    domain,
    aliases: [],
    category: "AI search",
    description: null,
    is_active: true,
    created_at: now,
    updated_at: now
  };
}

function prompt(id: string, metadata: Partial<PromptWithReportMetadata>): PromptWithReportMetadata {
  return {
    id,
    project_id: project.id,
    topic_id: "topic-ai-search",
    persona_id: "persona-marketing",
    text: `${id} AI search visibility question`,
    intent: "comparison",
    buyer_stage: "comparison",
    priority: "high",
    is_active: true,
    created_at: now,
    updated_at: now,
    ...metadata
  };
}

function runItem(id: string, promptId: string): RecoraRunItemRow {
  return {
    id,
    run_id: currentRun.id,
    prompt_id: promptId,
    persona_id: "persona-marketing",
    model_id: "model-1",
    status: "completed",
    error_message: null,
    latency_ms: 1200,
    captured_at: now,
    created_at: now,
    updated_at: now
  };
}

function conversation(id: string, runItemId: string, rawAnswer: string): RecoraAiConversationRow {
  return {
    id,
    run_item_id: runItemId,
    raw_answer: rawAnswer,
    answer_summary: rawAnswer,
    answer_hash: id,
    prompt_text_snapshot: rawAnswer,
    model_snapshot: "gpt-test",
    captured_at: now,
    created_at: now,
    updated_at: now,
    provider: "openai",
    model_requested: "gpt-test",
    model_returned: "gpt-test",
    response_id: `response-${id}`,
    raw_response: null,
    usage: null,
    web_search_enabled: true,
    citation_status: "available",
    measured_at: now,
    response_time_ms: 1200
  };
}

function mention(
  id: string,
  conversationId: string,
  brandId: string,
  mentioned: boolean,
  position: number | null,
  snippet: string | null
): RecoraBrandMentionRow {
  return {
    id,
    conversation_id: conversationId,
    brand_id: brandId,
    mentioned,
    position,
    recommendation_status: mentioned ? "listed" : "absent",
    sentiment: mentioned ? "positive" : "unclear",
    answer_score: mentioned ? 2 : 0,
    mention_text: snippet,
    mention_count: mentioned ? 1 : 0,
    first_mention_index: position === null ? null : position * 10,
    evidence_snippet: snippet,
    confidence: mentioned ? "high" : "medium",
    matched_alias: mentioned ? brands.find((item) => item.id === brandId)?.name ?? null : null,
    created_at: now,
    updated_at: now
  };
}

function citation(input: {
  id: string;
  conversationId: string;
  brandId: string | null;
  sourceDomainId: string;
  url: string;
  domain: string;
  sourceType: RecoraCitationRow["source_type"];
  brandRelated: RecoraCitationRow["brand_related"];
  sourceFreshnessStatus: RecoraCitationRow["source_freshness_status"];
  occurrenceCount: number;
}): RecoraCitationRow {
  return {
    id: input.id,
    conversation_id: input.conversationId,
    brand_id: input.brandId,
    source_domain_id: input.sourceDomainId,
    url: input.url,
    domain: input.domain,
    title: input.domain,
    source_type: input.sourceType,
    supports_claim: true,
    occurrence_count: input.occurrenceCount,
    created_at: now,
    updated_at: now,
    canonical_url: input.url,
    start_index: null,
    end_index: null,
    cited_text: "Observed answer claim.",
    raw_citation: { fixture: true },
    brand_related: input.brandRelated,
    source_to_claim_status: "supported",
    claim_text: "Observed answer claim.",
    source_to_claim_note: null,
    source_retrieved_at: input.sourceFreshnessStatus === "not_checked" ? null : now,
    source_published_at: input.sourceFreshnessStatus === "not_checked" ? null : "2026-06-15",
    source_last_modified_at: null,
    source_freshness_status: input.sourceFreshnessStatus,
    source_freshness_days: input.sourceFreshnessStatus === "not_checked" ? null : 16
  };
}

function metricSnapshot(
  id: string,
  brandId: string,
  aiVisibility: number,
  shareOfVoice: number,
  averagePosition: number,
  citationCount: number
): RecoraMetricSnapshotRow {
  return {
    id,
    run_id: aggregateRun.id,
    scope_type: "brand",
    scope_id: brandId,
    brand_id: brandId,
    ai_visibility: aiVisibility,
    ai_mention_count: aiVisibility > 0 ? 2 : 0,
    citation_count: citationCount,
    share_of_voice: shareOfVoice,
    competitive_gap: null,
    average_position: averagePosition,
    calculated_at: now,
    metadata: { sample_size: 3 },
    created_at: now,
    updated_at: now
  };
}

function recommendation(
  id: string,
  title: string,
  metadata: Record<string, Json>
): RecoraRecommendationRow {
  return {
    id,
    project_id: project.id,
    run_id: currentRun.id,
    type: "content",
    priority: "high",
    impact_score: typeof metadata.quality_score === "number" ? metadata.quality_score : 50,
    effort_score: 3,
    title,
    reason: "Observed comparison gap.",
    target_url: "https://recora.test/comparison",
    related_topic_id: "topic-ai-search",
    related_prompt_id: "prompt-1",
    status: "open",
    metadata: {
      source: "recommendation_candidate_generator",
      measurement_run_id: currentRun.id,
      data_source: "openai_measurement",
      ...metadata
    },
    created_at: now,
    updated_at: now
  };
}
