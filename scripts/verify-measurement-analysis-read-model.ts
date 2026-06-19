import assert from "node:assert/strict";

import { createRecoraMeasurementAnalysisReadModel } from "../lib/recora/measurement-analysis-read-model";
import type {
  Json,
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRunItemRow,
  RecoraTopicRow
} from "../lib/recora/db/types";

const now = "2026-06-20T00:00:00.000Z";

const brands: RecoraBrandRow[] = [
  brand("brand-recora", "Recora", "primary", "recora.test"),
  brand("brand-alpha", "Alpha Search", "competitor", "alpha.test"),
  brand("brand-beta", "Beta Answers", "competitor", "beta.test"),
  brand("brand-gamma", "Gamma Finder", "competitor", "gamma.test")
];

const topics: RecoraTopicRow[] = [
  topic("topic-ai-seo", "AI SEO diagnostics"),
  topic("topic-citations", "Citation readiness")
];

const prompts: RecoraPromptRow[] = [
  prompt("prompt-1", "topic-ai-seo", "Best AI SEO diagnostic tools"),
  prompt("prompt-2", "topic-citations", "Which services explain AI answer citations?"),
  prompt("prompt-3", "topic-citations", "Compare source readiness tools")
];

const runItems: RecoraRunItemRow[] = [
  runItem("run-item-1", "prompt-1"),
  runItem("run-item-2", "prompt-2"),
  runItem("run-item-3", "prompt-3")
];

const conversations: RecoraAiConversationRow[] = [
  conversation("conversation-1", "run-item-1", "Recora and Alpha Search are both mentioned."),
  conversation("conversation-2", "run-item-2", "Alpha Search and Beta Answers are cited more strongly."),
  conversation("conversation-3", "run-item-3", "Recora appears with Gamma Finder.")
];

const brandMentions: RecoraBrandMentionRow[] = [
  mention("mention-1", "conversation-1", "brand-recora", true, 2, 1, "Recora is mentioned after Alpha Search."),
  mention("mention-2", "conversation-1", "brand-alpha", true, 1, 1, "Alpha Search appears first."),
  mention("mention-3", "conversation-1", "brand-beta", false, null, 0, null),
  mention("mention-4", "conversation-1", "brand-gamma", false, null, 0, null),
  mention("mention-5", "conversation-2", "brand-recora", false, null, 0, null),
  mention("mention-6", "conversation-2", "brand-alpha", true, 1, 1, "Alpha Search is recommended."),
  mention("mention-7", "conversation-2", "brand-beta", true, 2, 1, "Beta Answers is listed."),
  mention("mention-8", "conversation-2", "brand-gamma", false, null, 0, null),
  mention("mention-9", "conversation-3", "brand-recora", true, 1, 2, "Recora is the strongest citation-readiness fit."),
  mention("mention-10", "conversation-3", "brand-alpha", false, null, 0, null),
  mention("mention-11", "conversation-3", "brand-beta", false, null, 0, null),
  mention("mention-12", "conversation-3", "brand-gamma", true, 2, 1, "Gamma Finder appears as an alternative.")
];

const previousBrandMentions: RecoraBrandMentionRow[] = [
  mention("previous-1", "previous-conversation-1", "brand-recora", true, 1, 1, "Recora was present previously."),
  mention("previous-2", "previous-conversation-1", "brand-alpha", true, 2, 1, "Alpha Search was present previously."),
  mention("previous-3", "previous-conversation-1", "brand-beta", true, 3, 1, "Beta Answers was present previously.")
];

const citations: RecoraCitationRow[] = [
  citation({
    id: "citation-1",
    conversationId: "conversation-1",
    brandId: "brand-recora",
    sourceDomainId: "source-domain-1",
    url: "https://recora.test/docs/ai-search",
    domain: "recora.test",
    sourceType: "owned",
    occurrenceCount: 2,
    brandRelated: "target_brand",
    sourceToClaimStatus: "supported",
    sourceFreshnessStatus: "fresh",
    sourcePublishedAt: "2026-06-01",
    sourceFreshnessDays: 19
  }),
  citation({
    id: "citation-2",
    conversationId: "conversation-2",
    brandId: "brand-alpha",
    sourceDomainId: "source-domain-2",
    url: "https://alpha.test/report",
    domain: "alpha.test",
    sourceType: "competitor",
    occurrenceCount: 1,
    brandRelated: "competitor",
    sourceToClaimStatus: "unknown",
    sourceFreshnessStatus: "not_checked"
  }),
  citation({
    id: "citation-3",
    conversationId: "conversation-3",
    brandId: null,
    sourceDomainId: "source-domain-3",
    url: "https://reviewhub.test/ai-seo-tools",
    domain: "reviewhub.test",
    sourceType: "review",
    occurrenceCount: 1,
    brandRelated: "category",
    sourceToClaimStatus: "partially_supported",
    sourceFreshnessStatus: "recent",
    sourcePublishedAt: "2026-05-20",
    sourceFreshnessDays: 31
  })
];

const recommendations: RecoraRecommendationRow[] = [
  recommendation("rec-1", "candidate-pre", "Add source-ready proof for citation checks", {}),
  recommendation("rec-2", "candidate-hold", "Review Alpha Search citation gap", {
    quality_gate_decision: "hold",
    quality_score: 68,
    confidence: "medium",
    blocking_reason: "source_to_claim_status_unknown"
  }),
  recommendation("rec-3", "candidate-suppress", "Guarantee AI citation lift", {
    quality_gate_decision: "suppress",
    quality_score: 20,
    confidence: "high",
    blocking_reason: "guarantee_language"
  })
];

const model = createRecoraMeasurementAnalysisReadModel({
  brands,
  runItems,
  conversations,
  brandMentions,
  citations,
  recommendations,
  previousBrandMentions,
  prompts,
  topics
});

const recora = model.brandComparison.find((row) => row.brandId === "brand-recora");
assert.ok(recora);
assert.equal(recora.displayRate, 66.67);
assert.equal(recora.averagePosition, 1.5);
assert.equal(recora.mentionCount, 3);
assert.ok(recora.mentionContexts.some((context) => context.snippet?.includes("strongest")));
assert.deepEqual(recora.coMentionedCompetitors.map((item) => item.name).sort(), ["Alpha Search", "Gamma Finder"]);

const gamma = model.brandComparison.find((row) => row.brandId === "brand-gamma");
assert.equal(gamma?.newAppearanceStatus, "new_candidate");

const recoraSource = model.sources.citationSources.find((source) => source.domain === "recora.test");
assert.equal(recoraSource?.occurrenceCount, 2);
assert.equal(recoraSource?.sourceType, "owned");
assert.equal(recoraSource?.sourceFreshness.status, "fresh");
assert.equal(recoraSource?.sourceToClaim.status, "supported");

const alphaSource = model.sources.citationSources.find((source) => source.domain === "alpha.test");
assert.equal(alphaSource?.sourceFreshness.needsVerification, true);
assert.equal(alphaSource?.sourceToClaim.needsReviewBeforePublication, true);

assert.ok(model.reportOverview.largeTopicGaps.length > 0);
assert.equal(model.reportOverview.preQualityGateCandidateCount, 1);
assert.equal(model.recommendationQualityGate.summary.preQualityGateCandidateCount, 1);
assert.equal(model.recommendationQualityGate.summary.holdCount, 1);
assert.equal(model.recommendationQualityGate.summary.suppressCount, 1);
assert.ok(model.reportOverview.weakOwnedSourceCategories.some((category) => category.sourceType === "competitor"));
assert.ok(model.reportOverview.needsVerification.includes("recommendation_candidates_require_quality_gate_review"));

console.log(JSON.stringify({
  status: "ok",
  generated: {
    brandDisplayRate: recora.displayRate,
    averagePosition: recora.averagePosition,
    mentionContextCount: recora.mentionContexts.length,
    coMentionedCompetitors: recora.coMentionedCompetitors.map((item) => item.name),
    newAppearanceCandidate: gamma?.name,
    citationSourceDomain: recoraSource?.domain,
    sourceType: recoraSource?.sourceType,
    sourceFreshness: recoraSource?.sourceFreshness.status,
    sourceToClaimStatus: recoraSource?.sourceToClaim.status,
    preQualityGateCandidateCount: model.recommendationQualityGate.summary.preQualityGateCandidateCount,
    holdCount: model.recommendationQualityGate.summary.holdCount,
    suppressCount: model.recommendationQualityGate.summary.suppressCount
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
    project_id: "project-1",
    brand_type: brandType,
    name,
    reading: null,
    domain,
    aliases: [],
    category: null,
    description: null,
    is_active: true,
    created_at: now,
    updated_at: now
  };
}

function topic(id: string, name: string): RecoraTopicRow {
  return {
    id,
    project_id: "project-1",
    name,
    intent: null,
    priority: "high",
    weight: 1,
    is_active: true,
    created_at: now,
    updated_at: now
  };
}

function prompt(id: string, topicId: string, text: string): RecoraPromptRow {
  return {
    id,
    project_id: "project-1",
    topic_id: topicId,
    persona_id: null,
    text,
    intent: "discovery",
    buyer_stage: "comparison",
    priority: "high",
    is_active: true,
    created_at: now,
    updated_at: now
  };
}

function runItem(id: string, promptId: string): RecoraRunItemRow {
  return {
    id,
    run_id: "run-current",
    prompt_id: promptId,
    persona_id: "persona-1",
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
  mentionCount: number,
  snippet: string | null
): RecoraBrandMentionRow {
  return {
    id,
    conversation_id: conversationId,
    brand_id: brandId,
    mentioned,
    position,
    recommendation_status: mentioned ? "listed" : "absent",
    sentiment: mentioned ? "neutral" : "unclear",
    answer_score: mentioned ? 2 : 0,
    mention_text: snippet,
    mention_count: mentionCount,
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
  occurrenceCount: number;
  brandRelated: RecoraCitationRow["brand_related"];
  sourceToClaimStatus: RecoraCitationRow["source_to_claim_status"];
  sourceFreshnessStatus: RecoraCitationRow["source_freshness_status"];
  sourcePublishedAt?: string;
  sourceFreshnessDays?: number;
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
    supports_claim: input.sourceToClaimStatus === "supported" ? true : null,
    occurrence_count: input.occurrenceCount,
    created_at: now,
    updated_at: now,
    canonical_url: input.url,
    start_index: null,
    end_index: null,
    cited_text: "Observed answer claim.",
    raw_citation: { fixture: true },
    brand_related: input.brandRelated,
    source_to_claim_status: input.sourceToClaimStatus,
    claim_text: "Observed answer claim.",
    source_to_claim_note: null,
    source_retrieved_at: input.sourceFreshnessStatus === "not_checked" ? null : now,
    source_published_at: input.sourcePublishedAt ?? null,
    source_last_modified_at: null,
    source_freshness_status: input.sourceFreshnessStatus,
    source_freshness_days: input.sourceFreshnessDays ?? null
  };
}

function recommendation(
  id: string,
  candidateId: string,
  title: string,
  metadata: Record<string, Json>
): RecoraRecommendationRow {
  return {
    id,
    project_id: "project-1",
    run_id: "run-current",
    type: "content",
    priority: "high",
    impact_score: typeof metadata.quality_score === "number" ? metadata.quality_score : 50,
    effort_score: null,
    title,
    reason: null,
    target_url: null,
    related_topic_id: null,
    related_prompt_id: null,
    status: "open",
    metadata: {
      source: "recommendation_candidate_generator",
      measurement_run_id: "run-current",
      data_source: "openai_measurement",
      candidate_id: candidateId,
      ...metadata
    },
    created_at: now,
    updated_at: now
  };
}
