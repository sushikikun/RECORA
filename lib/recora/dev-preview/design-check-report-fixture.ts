import type {
  Json,
  RecoraAiConversationRow,
  RecoraAiModelRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCitationRow,
  RecoraConversationsDbData,
  RecoraDashboardDbData,
  RecoraLeaderboardDbData,
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraPersonaRow,
  RecoraProjectRow,
  RecoraPromptRow,
  RecoraRecommendationRow,
  RecoraRecommendationsDbData,
  RecoraRunItemRow,
  RecoraRunsDbData,
  RecoraSourceDomainRow,
  RecoraSourcesDbData,
  RecoraTopicRow
} from "@/lib/recora/db";
import { DESIGN_CHECK_REPORT_SLUG } from "@/lib/recora/dev-preview/design-preview-access";
import type { RecoraReportReadyGateResult } from "@/lib/recora/report-eligibility";

export { DESIGN_CHECK_REPORT_SLUG };

export const designCheckReportSummary = {
  reportName: "確認用レポート",
  projectName: "Recora",
  period: "2026-05-01 - 2026-05-31",
  lastUpdated: "2026-05-31 14:30",
  status: "表示確認用",
  aiVisibility: 57,
  validObservations: 1200,
  averageRank: 2.4,
  mentionRate: 36,
  ownedCitationRate: 24,
  citedAnswerCount: 428,
  issuesToReview: 3
} as const;

const projectId = "design-check-project";
const organizationId = "design-check-organization";
const aggregateRunId = "design-check-aggregate-run";
const sourceRunId = "design-check-source-run";
const createdAt = "2026-05-01T00:00:00.000+09:00";
const updatedAt = "2026-05-31T14:30:00.000+09:00";
const completedAt = "2026-05-31T14:30:00.000+09:00";

const project: RecoraProjectRow = {
  id: projectId,
  organization_id: organizationId,
  slug: DESIGN_CHECK_REPORT_SLUG,
  name: designCheckReportSummary.projectName,
  workspace_name: "Recora local design preview",
  language: "ja",
  region: "JP",
  default_period: designCheckReportSummary.period,
  created_at: createdAt,
  updated_at: updatedAt
};

const aggregateRun: RecoraMeasurementRunRow = {
  id: aggregateRunId,
  project_id: projectId,
  status: "completed",
  period_start: "2026-05-01",
  period_end: "2026-05-31",
  comparison_start: null,
  comparison_end: null,
  region: "JP",
  language: "ja",
  started_at: "2026-05-31T13:50:00.000+09:00",
  completed_at: completedAt,
  metadata: {
    run_kind: "aggregate",
    data_source: "local_design_preview",
    source_run_id: sourceRunId,
    measurement_profile_id: "design-check-local",
    prompt_set_version: "design-check-2026-05"
  },
  created_at: createdAt,
  updated_at: updatedAt
};

const sourceRun: RecoraMeasurementRunRow = {
  ...aggregateRun,
  id: sourceRunId,
  started_at: "2026-05-31T09:10:00.000+09:00",
  completed_at: "2026-05-31T10:58:00.000+09:00",
  metadata: {
    run_kind: "measurement",
    data_source: "local_design_preview",
    measurement_profile_id: "design-check-local",
    prompt_set_version: "design-check-2026-05",
    prompt_count: 120,
    expected_run_items: designCheckReportSummary.validObservations,
    search_mode: "combined"
  }
};

const brands: RecoraBrandRow[] = [
  createBrand("brand-recora", "primary", "Recora", "recora.example", "AI検索可視化"),
  createBrand("brand-competitor-a", "competitor", "Competitor A", "competitor-a.example", "AI検索可視化"),
  createBrand("brand-competitor-b", "competitor", "Competitor B", "competitor-b.example", "AI検索可視化"),
  createBrand("brand-competitor-c", "competitor", "Competitor C", "competitor-c.example", "AI検索可視化")
];

const topics: RecoraTopicRow[] = [
  createTopic("topic-comparison", "比較・検討", "比較", "high", 1),
  createTopic("topic-problem", "課題解決", "情報収集", "high", 0.9),
  createTopic("topic-implementation", "導入方法", "導入検討", "medium", 0.7),
  createTopic("topic-price", "料金・費用", "費用確認", "medium", 0.6),
  createTopic("topic-trust", "評判・信頼性", "信頼確認", "medium", 0.6)
];

const personas: RecoraPersonaRow[] = [
  createPersona("persona-marketing", "マーケティング責任者", "BtoB SaaS"),
  createPersona("persona-growth", "事業成長担当", "Growth"),
  createPersona("persona-executive", "経営企画", "Executive")
];

const prompts: RecoraPromptRow[] = [
  createPrompt("prompt-comparison", topics[0].id, personas[0].id, "BtoB SaaSのAI検索対策ツールを比較するときの観点は何ですか", "比較", "consideration", "high"),
  createPrompt("prompt-problem", topics[1].id, personas[1].id, "AI回答で競合より自社が出にくい理由を調べる方法はありますか", "課題解決", "awareness", "high"),
  createPrompt("prompt-implementation", topics[2].id, personas[0].id, "AI検索レポートを社内共有するにはどんな情報が必要ですか", "導入方法", "consideration", "medium"),
  createPrompt("prompt-price", topics[3].id, personas[2].id, "AI検索分析ツールの費用対効果を確認するときの指標は何ですか", "料金・費用", "decision", "medium"),
  createPrompt("prompt-trust", topics[4].id, personas[2].id, "AI検索対策サービスの信頼性を見るにはどの情報を確認すべきですか", "評判・信頼性", "decision", "medium")
];

const aiModels: RecoraAiModelRow[] = [
  createAiModel("model-chatgpt", "openai", "gpt-4o-search-preview", "ChatGPT"),
  createAiModel("model-perplexity", "perplexity", "sonar", "Perplexity"),
  createAiModel("model-gemini", "google", "gemini-2.0-flash", "Gemini"),
  createAiModel("model-claude", "anthropic", "claude-3-5-sonnet", "Claude"),
  createAiModel("model-aio", "google", "ai-overviews", "Google AI Overviews")
];

const runItems = Array.from({ length: 100 }, (_, index) => createRunItem(index));
const conversations = runItems.map((runItem, index) => createConversation(runItem, index));
const brandMentions = conversations.flatMap((conversation, index) => createBrandMentions(conversation.id, index));
const sourceDomains: RecoraSourceDomainRow[] = [
  createSourceDomain("source-recora", "recora.example", "owned", brands[0].id, "自社サイト"),
  createSourceDomain("source-industry", "industry-review.example", "media", null, "第三者メディア"),
  createSourceDomain("source-competitor-a", "competitor-a.example", "competitor", brands[1].id, "競合サイト"),
  createSourceDomain("source-public", "public-data.example", "technical", null, "公的・専門資料"),
  createSourceDomain("source-guide", "saas-guide.example", "media", null, "その他")
];
const citations: RecoraCitationRow[] = [
  createCitation("citation-recora", conversations[0].id, brands[0].id, sourceDomains[0], 103, "https://recora.example/resources/ai-search-report"),
  createCitation("citation-industry", conversations[1].id, null, sourceDomains[1], 163, "https://industry-review.example/ai-search-tools"),
  createCitation("citation-competitor", conversations[2].id, brands[1].id, sourceDomains[2], 77, "https://competitor-a.example/compare"),
  createCitation("citation-public", conversations[3].id, null, sourceDomains[3], 60, "https://public-data.example/search-behavior"),
  createCitation("citation-guide", conversations[4].id, null, sourceDomains[4], 25, "https://saas-guide.example/marketing-ai-search")
];

const metricSnapshots: RecoraMetricSnapshotRow[] = [
  createMetricSnapshot("snapshot-project", "project", null, null, 57, 432, 428, 36, -7, 2.4),
  createMetricSnapshot("snapshot-recora", "brand", brands[0].id, brands[0].id, 57, 432, 103, 36, -7, 2.4),
  createMetricSnapshot("snapshot-competitor-a", "brand", brands[1].id, brands[1].id, 64, 504, 77, 42, 7, 1.8),
  createMetricSnapshot("snapshot-competitor-b", "brand", brands[2].id, brands[2].id, 49, 372, 48, 31, -8, 3.1),
  createMetricSnapshot("snapshot-competitor-c", "brand", brands[3].id, brands[3].id, 38, 264, 36, 22, -19, 4.2),
  createMetricSnapshot("snapshot-model-chatgpt", "model", "ChatGPT", brands[0].id, 62, 150, 88, 29, null, 2.1),
  createMetricSnapshot("snapshot-model-perplexity", "model", "Perplexity", brands[0].id, 58, 139, 92, 31, null, 2.2),
  createMetricSnapshot("snapshot-model-gemini", "model", "Gemini", brands[0].id, 51, 122, 66, 22, null, 2.7),
  createMetricSnapshot("snapshot-model-claude", "model", "Claude", brands[0].id, 44, 106, 54, 18, null, 3.0),
  createMetricSnapshot("snapshot-model-aio", "model", "Google AI Overviews", brands[0].id, 39, 94, 45, 15, null, 3.3)
];

const recommendations: RecoraRecommendationRow[] = [
  createRecommendation(
    "recommendation-comparison-source",
    "content",
    "high",
    "比較・検討系プロンプトで参照される根拠ページを補強する",
    "比較・検討カテゴリで自社サイト引用率が24%に留まっています。",
    prompts[0].id,
    topics[0].id,
    "比較ページに選定基準、測定条件、競合比較表を追加する"
  ),
  createRecommendation(
    "recommendation-implementation-page",
    "prompt",
    "medium",
    "導入方法ページに運用手順と測定条件を追加する",
    "導入方法カテゴリのAI表示率が48%で、比較・検討より低く出ています。",
    prompts[2].id,
    topics[2].id,
    "社内共有用の確認項目と運用手順を追記する"
  ),
  createRecommendation(
    "recommendation-third-party-check",
    "source",
    "medium",
    "第三者メディアでの説明差分を確認する",
    "第三者メディア参照が38%で、回答文脈に影響しています。",
    prompts[4].id,
    topics[4].id,
    "第三者記事の表現と自社ページの説明差分を棚卸しする"
  )
];

export function getDesignCheckDashboardData(): RecoraDashboardDbData {
  return {
    project,
    latestRun: aggregateRun,
    brands,
    metricSnapshots,
    recommendations,
    counts: {
      aiConversations: designCheckReportSummary.validObservations,
      validObservations: designCheckReportSummary.validObservations,
      citations: designCheckReportSummary.citedAnswerCount
    },
    reportReadyGate: createDesignCheckReadyGate()
  };
}

export function getDesignCheckLeaderboardData(): RecoraLeaderboardDbData {
  return {
    project,
    latestRun: aggregateRun,
    brands,
    metricSnapshots,
    runItems,
    conversations,
    brandMentions,
    citations,
    personas,
    prompts,
    topics
  };
}

export function getDesignCheckReportOverviewData() {
  return {
    dashboardData: getDesignCheckDashboardData(),
    leaderboardData: getDesignCheckLeaderboardData()
  };
}

export function getDesignCheckConversationsData(): RecoraConversationsDbData {
  return {
    project,
    latestRun: aggregateRun,
    brands,
    runItems,
    prompts,
    personas,
    topics,
    aiModels,
    conversations,
    brandMentions,
    citations
  };
}

export function getDesignCheckSourcesData(): RecoraSourcesDbData {
  return {
    project,
    latestRun: aggregateRun,
    sourceDomains,
    conversations,
    citations
  };
}

export function getDesignCheckRecommendationsData(): RecoraRecommendationsDbData {
  return {
    project,
    latestRun: aggregateRun,
    brands,
    recommendations,
    preQualityGateCandidateCount: designCheckReportSummary.issuesToReview,
    topics,
    prompts
  };
}

export function getDesignCheckRunsData(): RecoraRunsDbData {
  return {
    project,
    runs: [
      createRunHistoryItem(aggregateRun.id, "aggregate", "completed", aggregateRun.started_at, aggregateRun.completed_at, sourceRunId, 120, 1200, 1200, 432, 428, metricSnapshots.length, metricSnapshots.length, true),
      createRunHistoryItem(sourceRun.id, "measurement", "completed", sourceRun.started_at, sourceRun.completed_at, null, 120, 1200, 1200, 432, 428, 0, metricSnapshots.length, true),
      createRunHistoryItem("design-check-source-run-previous", "measurement", "completed", "2026-05-24T09:00:00.000+09:00", "2026-05-24T10:44:00.000+09:00", null, 120, 1200, 1140, 398, 386, 0, 0, true)
    ]
  };
}

function createDesignCheckReadyGate(): RecoraReportReadyGateResult {
  return {
    status: "customer_ready",
    customer: {
      status: "customer_ready",
      label: "Local design preview",
      message: "Development-only design-check report fixture."
    },
    adminDiagnostic: {
      status: "admin_diagnostic",
      projectSlug: DESIGN_CHECK_REPORT_SLUG,
      blockingReasons: [],
      diagnosticNotes: [
        {
          code: "local_design_preview_fixture",
          severity: "diagnostic",
          message: "This data is generated only for localhost design review."
        }
      ],
      sourceMeasurementRunId: sourceRunId,
      measurementProfileId: "design-check-local",
      promptSetVersion: "design-check-2026-05",
      dataOriginStatus: "demo_or_local",
      metricSnapshotCount: metricSnapshots.length,
      validObservationCount: designCheckReportSummary.validObservations,
      customerVisibleRecommendationCount: recommendations.length,
      internalRecommendationCandidateCount: designCheckReportSummary.issuesToReview
    }
  };
}

function createBrand(id: string, brandType: RecoraBrandRow["brand_type"], name: string, domain: string, category: string): RecoraBrandRow {
  return {
    id,
    project_id: projectId,
    brand_type: brandType,
    name,
    reading: null,
    domain,
    aliases: [name],
    category,
    description: `${name} local design preview brand.`,
    is_active: true,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createTopic(id: string, name: string, intent: string, priority: RecoraTopicRow["priority"], weight: number): RecoraTopicRow {
  return {
    id,
    project_id: projectId,
    name,
    intent,
    priority,
    weight,
    is_active: true,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createPersona(id: string, name: string, segment: string): RecoraPersonaRow {
  return {
    id,
    project_id: projectId,
    name,
    segment,
    weight: 1,
    jobs: ["AI検索上の見え方を確認する"],
    pain_points: ["競合との差分と引用元の根拠を説明しにくい"],
    is_active: true,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createPrompt(
  id: string,
  topicId: string,
  personaId: string,
  text: string,
  intent: string,
  buyerStage: string,
  priority: RecoraPromptRow["priority"]
): RecoraPromptRow {
  return {
    id,
    project_id: projectId,
    topic_id: topicId,
    persona_id: personaId,
    text,
    intent,
    buyer_stage: buyerStage,
    priority,
    is_active: true,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createAiModel(id: string, provider: string, modelName: string, displayName: string): RecoraAiModelRow {
  return {
    id,
    provider,
    model_name: modelName,
    display_name: displayName,
    is_active: true,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createRunItem(index: number): RecoraRunItemRow {
  const prompt = prompts[index % prompts.length];
  const persona = personas[index % personas.length];
  const model = aiModels[index % aiModels.length];

  return {
    id: `design-check-run-item-${String(index + 1).padStart(3, "0")}`,
    run_id: sourceRunId,
    prompt_id: prompt.id,
    persona_id: persona.id,
    model_id: model.id,
    status: "completed",
    error_message: null,
    latency_ms: 1100 + index * 7,
    captured_at: addMinutes("2026-05-31T10:00:00.000+09:00", index),
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createConversation(runItem: RecoraRunItemRow, index: number): RecoraAiConversationRow {
  const prompt = prompts.find((item) => item.id === runItem.prompt_id) ?? prompts[0];
  const model = aiModels.find((item) => item.id === runItem.model_id) ?? aiModels[0];

  return {
    id: `design-check-conversation-${String(index + 1).padStart(3, "0")}`,
    run_item_id: runItem.id,
    raw_answer: "AI検索対策では、表示有無、平均表示位置、言及文脈、引用元、競合との同時出現を同じ条件で確認します。",
    answer_summary: `${prompt.intent ?? "確認"}領域では、表示率と引用元の差分をあわせて確認します。`,
    answer_hash: `design-check-answer-${index + 1}`,
    prompt_text_snapshot: prompt.text,
    model_snapshot: model.display_name,
    captured_at: runItem.captured_at ?? updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    provider: model.provider === "perplexity" ? "perplexity" : model.provider === "anthropic" ? "anthropic" : "openai",
    model_requested: model.model_name,
    model_returned: model.display_name,
    response_id: `local-design-response-${index + 1}`,
    raw_response: null,
    usage: null,
    web_search_enabled: index % 3 !== 0,
    citation_status: index % 4 === 0 ? "partial" : "available",
    measured_at: runItem.captured_at ?? updatedAt,
    response_time_ms: 900 + index * 4
  };
}

function createBrandMentions(conversationId: string, index: number): RecoraBrandMentionRow[] {
  const rows: RecoraBrandMentionRow[] = [];
  const visibleLimits = [
    { brand: brands[0], limit: 57, position: index < 34 ? 2 : 3, sentiment: index % 8 === 0 ? "neutral" : "positive" },
    { brand: brands[1], limit: 64, position: index < 13 ? 1 : 2, sentiment: "neutral" },
    { brand: brands[2], limit: 49, position: index < 44 ? 3 : 4, sentiment: "neutral" },
    { brand: brands[3], limit: 38, position: index < 31 ? 4 : 5, sentiment: "neutral" }
  ] as const;

  for (const item of visibleLimits) {
    if (index >= item.limit) continue;
    rows.push({
      id: `mention-${conversationId}-${item.brand.id}`,
      conversation_id: conversationId,
      brand_id: item.brand.id,
      mentioned: true,
      position: item.position,
      recommendation_status: item.brand.brand_type === "primary" ? "recommended" : "listed",
      sentiment: item.sentiment,
      answer_score: item.brand.brand_type === "primary" ? 78 : 68,
      mention_text: item.brand.name,
      mention_count: 1,
      first_mention_index: 120 + index,
      evidence_snippet: `${item.brand.name} is referenced in this local design-check answer.`,
      confidence: "high",
      matched_alias: item.brand.name,
      created_at: createdAt,
      updated_at: updatedAt
    });
  }

  return rows;
}

function createSourceDomain(
  id: string,
  domain: string,
  sourceType: RecoraSourceDomainRow["source_type"],
  ownerBrandId: string | null,
  trustLabel: string
): RecoraSourceDomainRow {
  return {
    id,
    project_id: projectId,
    domain,
    source_type: sourceType,
    owner_brand_id: ownerBrandId,
    trust_label: trustLabel,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createCitation(
  id: string,
  conversationId: string,
  brandId: string | null,
  sourceDomain: RecoraSourceDomainRow,
  occurrenceCount: number,
  url: string
): RecoraCitationRow {
  return {
    id,
    conversation_id: conversationId,
    brand_id: brandId,
    source_domain_id: sourceDomain.id,
    url,
    domain: sourceDomain.domain,
    title: sourceDomain.trust_label,
    source_type: sourceDomain.source_type,
    supports_claim: sourceDomain.source_type !== "competitor",
    occurrence_count: occurrenceCount,
    created_at: createdAt,
    updated_at: updatedAt,
    canonical_url: url,
    start_index: null,
    end_index: null,
    cited_text: "Local design-check citation excerpt.",
    raw_citation: null,
    brand_related: sourceDomain.source_type === "owned" ? "target_brand" : sourceDomain.source_type === "competitor" ? "competitor" : "category",
    source_to_claim_status: sourceDomain.source_type === "competitor" ? "not_reviewed" : "supported",
    claim_text: "回答内の説明を支える参照元として確認します。",
    source_to_claim_note: "Local design preview only.",
    source_retrieved_at: updatedAt,
    source_published_at: null,
    source_last_modified_at: null,
    source_freshness_status: "not_checked",
    source_freshness_days: null
  };
}

function createMetricSnapshot(
  id: string,
  scopeType: RecoraMetricSnapshotRow["scope_type"],
  scopeId: string | null,
  brandId: string | null,
  aiVisibility: number,
  aiMentionCount: number,
  citationCount: number,
  shareOfVoice: number,
  competitiveGap: number | null,
  averagePosition: number | null
): RecoraMetricSnapshotRow {
  return {
    id,
    run_id: aggregateRunId,
    scope_type: scopeType,
    scope_id: scopeId,
    brand_id: brandId,
    ai_visibility: aiVisibility,
    ai_mention_count: aiMentionCount,
    citation_count: citationCount,
    share_of_voice: shareOfVoice,
    competitive_gap: competitiveGap,
    average_position: averagePosition,
    calculated_at: completedAt,
    metadata: {
      source: "local_design_preview"
    },
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function createRecommendation(
  id: string,
  type: RecoraRecommendationRow["type"],
  priority: RecoraRecommendationRow["priority"],
  title: string,
  reason: string,
  promptId: string,
  topicId: string,
  action: string
): RecoraRecommendationRow {
  const metadata: Json = {
    source: "recommendation_candidate_generator",
    data_source: "local_design_preview",
    measurement_run_id: sourceRunId,
    measurement_profile_id: "design-check-local",
    quality_gate_decision: "auto_publish",
    display_decision: "show",
    publication_state: "customer_visible",
    confidence: priority === "high" ? "high" : "medium",
    expected_impact: priority === "high" ? "+7pt" : "+4pt",
    suggested_next_action: action,
    display_category: type === "source" ? "参照元" : type === "prompt" ? "プロンプト" : "コンテンツ",
    evidence: {
      observation_count: designCheckReportSummary.validObservations,
      prompt_count: 120,
      focused_observation_count: 280,
      focused_observation_label: "比較・検討",
      citation_count: designCheckReportSummary.citedAnswerCount,
      unique_domain_count: sourceDomains.length,
      matched_clue_count: 14
    },
    customer_facing_caution: "ローカル確認用の表示例です。",
    recora_metric_notice: "AI表示率、引用元、言及シェアを同じ観測条件で確認します。"
  };

  return {
    id,
    project_id: projectId,
    run_id: aggregateRunId,
    type,
    priority,
    impact_score: priority === "high" ? 84 : 68,
    effort_score: priority === "high" ? 42 : 56,
    title,
    reason,
    target_url: "https://recora.example/design-check",
    related_topic_id: topicId,
    related_prompt_id: promptId,
    status: priority === "high" ? "open" : "planned",
    metadata,
    created_at: updatedAt,
    updated_at: updatedAt
  };
}

function createRunHistoryItem(
  id: string,
  kind: RecoraRunsDbData["runs"][number]["kind"],
  status: RecoraRunsDbData["runs"][number]["status"],
  startedAt: string | null,
  completedAt: string | null,
  sourceRunIdValue: string | null,
  promptCount: number,
  runItemCount: number,
  aiConversationCount: number,
  brandMentionCount: number,
  citationCount: number,
  metricSnapshotCount: number,
  aggregateSnapshotCount: number,
  isAggregated: boolean
): RecoraRunsDbData["runs"][number] {
  return {
    id,
    status,
    kind,
    startedAt,
    completedAt,
    createdAt: startedAt ?? createdAt,
    sourceRunId: sourceRunIdValue,
    searchMode: "combined",
    measurementProfileId: "design-check-local",
    measurementProfileLabel: "LOCAL DESIGN PREVIEW",
    measurementProfilePromptCount: promptCount,
    measurementProfileExpectedRunItems: runItemCount,
    promptCount,
    runItemCount,
    aiConversationCount,
    brandMentionCount,
    citationCount,
    metricSnapshotCount,
    aggregateSnapshotCount,
    isAggregated
  };
}

function addMinutes(value: string, minutes: number) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}
