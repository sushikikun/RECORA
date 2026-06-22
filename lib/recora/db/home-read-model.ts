import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import {
  isCustomerVisibleRecommendation,
  isValidObservation
} from "@/lib/recora/report-eligibility";
import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRunWithMetricSnapshots,
  getRecoraBrands,
  getRecoraMetricSnapshotsOrEmpty,
  getRecoraProject
} from "./dashboard";
import {
  getMetadataRecord,
  getMetadataString,
  isDisplayableCitation,
  isDisplayableRecommendation,
  isOpenAiAggregateRun,
  isOpenAiMeasuredConversation,
  isSeedMeasurementRunId
} from "./display-filters";
import type {
  RecoraAiConversationRow,
  RecoraBrandMentionRow,
  RecoraBrandRow,
  RecoraCumulativeSourceDomainRank,
  RecoraCitationRow,
  RecoraCumulativeHomeSummary,
  RecoraHomeDataCautionFlag,
  RecoraHomeReadModelDbData,
  RecoraLatestAggregateSummary,
  RecoraMeasurementRunRow,
  RecoraRecommendationRow,
  RecoraRunItemRow,
  RecoraTrendHomePoint,
  RecoraTrendHomeSummary
} from "./types";

const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";
const RUN_ITEM_COLUMNS =
  "id, run_id, prompt_id, persona_id, model_id, status, error_message, latency_ms, captured_at, created_at, updated_at";
const AI_CONVERSATION_COLUMNS =
  "id, run_item_id, raw_answer, answer_summary, answer_hash, prompt_text_snapshot, model_snapshot, captured_at, created_at, updated_at, provider, model_requested, model_returned, response_id, web_search_enabled, citation_status, measured_at, response_time_ms";
const BRAND_MENTION_COLUMNS =
  "id, conversation_id, brand_id, mentioned, position, recommendation_status, sentiment, answer_score, mention_text, created_at, updated_at";
const CITATION_COLUMNS =
  "id, conversation_id, brand_id, source_domain_id, url, domain, title, source_type, supports_claim, occurrence_count, created_at, updated_at, canonical_url, start_index, end_index, cited_text, brand_related";
const RECOMMENDATION_COLUMNS =
  "id, project_id, run_id, type, priority, impact_score, effort_score, title, reason, target_url, related_topic_id, related_prompt_id, status, metadata, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

type RunClassification = {
  measurementRuns: RecoraMeasurementRunRow[];
  excludedSeedCount: number;
  excludedAggregateCount: number;
  excludedNonMeasurementCount: number;
};

type ValidObservationRecord = {
  run: RecoraMeasurementRunRow;
  runItem: RecoraRunItemRow;
  conversations: RecoraAiConversationRow[];
};

type ObservationModel = {
  validObservations: ValidObservationRecord[];
  validConversations: RecoraAiConversationRow[];
  validConversationIds: string[];
  excludedRunItemCount: number;
  citationStatusIssueCount: number;
};

type HomeCountInput = {
  runs: RecoraMeasurementRunRow[];
  observations: ValidObservationRecord[];
  conversations: RecoraAiConversationRow[];
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
  primaryBrand: RecoraBrandRow | null;
};

type HomeCounts = {
  completedMeasurementCount: number;
  validObservationCount: number;
  aiConversationCount: number;
  brandDisplayObservationCount: number;
  citationOccurrenceCount: number;
  citationUrlCount: number;
  sourceDomainCount: number;
};

export async function getRecoraHomeReadModelData(
  projectSlug = getDefaultRecoraProjectSlug()
): Promise<RecoraHomeReadModelDbData> {
  noStore();

  const supabase = createRecoraSupabaseClient();
  const project = await getRecoraProject(projectSlug, supabase);

  if (!project) {
    return emptyHomeReadModelData();
  }

  const [brands, latestAggregateRun, completedOpenAiRuns] = await Promise.all([
    getRecoraBrands(project.id, supabase),
    getLatestRunWithMetricSnapshots(project.id, supabase),
    getCompletedOpenAiRuns(project.id, supabase)
  ]);
  const latestAggregateSnapshots = latestAggregateRun
    ? await getRecoraMetricSnapshotsOrEmpty(latestAggregateRun.id, supabase, "home_read_model_metric_snapshots")
    : [];
  const runClassification = classifyMeasurementRuns(completedOpenAiRuns);
  const measurementRunIds = new Set(runClassification.measurementRuns.map((run) => run.id));
  const recommendations = await getHomeRecommendationCandidates(project.id, measurementRunIds, supabase);
  const runItems = await getRunItemsForRuns(runClassification.measurementRuns.map((run) => run.id), supabase);
  const conversations = await getAiConversations(runItems.map((item) => item.id), supabase);
  const observationModel = buildObservationModel(runClassification.measurementRuns, runItems, conversations);
  const [brandMentions, citations] = await Promise.all([
    getBrandMentions(observationModel.validConversationIds, supabase),
    getCitations(observationModel.validConversationIds, supabase)
  ]);
  const primaryBrand = getPrimaryBrand(brands);

  const cumulativeHomeSummary = buildCumulativeHomeSummary({
    runClassification,
    observationModel,
    recommendations,
    primaryBrand,
    counts: buildHomeCounts({
      runs: runClassification.measurementRuns,
      observations: observationModel.validObservations,
      conversations: observationModel.validConversations,
      brandMentions,
      citations,
      primaryBrand
    }),
    citations
  });
  const trendHomeSummary = buildTrendHomeSummary({
    runs: runClassification.measurementRuns,
    observationModel,
    brandMentions,
    citations,
    primaryBrand
  });

  return {
    project,
    brands,
    latestAggregateSummary: buildLatestAggregateSummary(latestAggregateRun, latestAggregateSnapshots.length),
    cumulativeHomeSummary,
    trendHomeSummary
  };
}

function emptyHomeReadModelData(): RecoraHomeReadModelDbData {
  return {
    project: null,
    brands: [],
    latestAggregateSummary: null,
    cumulativeHomeSummary: null,
    trendHomeSummary: null
  };
}

function buildLatestAggregateSummary(
  latestAggregateRun: RecoraMeasurementRunRow | null,
  metricSnapshotCount: number
): RecoraLatestAggregateSummary | null {
  if (!latestAggregateRun) return null;

  return {
    periodStart: latestAggregateRun.period_start,
    periodEnd: latestAggregateRun.period_end,
    completedAt: latestAggregateRun.completed_at,
    metricSnapshotCount,
    dataCautionFlags: [
      {
        code: "latest_aggregate_not_cumulative",
        severity: "info",
        message: "latestAggregateSummary is the latest aggregate snapshot and must not be displayed as cumulative."
      }
    ]
  };
}

function buildCumulativeHomeSummary({
  runClassification,
  observationModel,
  recommendations,
  primaryBrand,
  counts,
  citations
}: {
  runClassification: RunClassification;
  observationModel: ObservationModel;
  recommendations: RecoraRecommendationRow[];
  primaryBrand: RecoraBrandRow | null;
  counts: HomeCounts;
  citations: RecoraCitationRow[];
}): RecoraCumulativeHomeSummary {
  return {
    aggregationPeriod: getAggregationPeriod(runClassification.measurementRuns),
    ...counts,
    sourceDomainRanking: buildSourceDomainRanking(citations),
    recommendationCandidateCount: recommendations.length,
    dataCautionFlags: buildCumulativeCautionFlags({
      runClassification,
      observationModel,
      primaryBrand,
      validObservationCount: counts.validObservationCount
    })
  };
}

function buildTrendHomeSummary({
  runs,
  observationModel,
  brandMentions,
  citations,
  primaryBrand
}: {
  runs: RecoraMeasurementRunRow[];
  observationModel: ObservationModel;
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
  primaryBrand: RecoraBrandRow | null;
}): RecoraTrendHomeSummary {
  const buckets = new Map<string, RecoraMeasurementRunRow[]>();

  for (const run of runs) {
    const key = getRunPeriodKey(run);
    buckets.set(key, [...(buckets.get(key) ?? []), run]);
  }

  const points = Array.from(buckets.values())
    .map((bucketRuns) => buildTrendPoint({
      runs: bucketRuns,
      observationModel,
      brandMentions,
      citations,
      primaryBrand
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart) || a.periodEnd.localeCompare(b.periodEnd));

  return {
    points,
    dataCautionFlags: dedupeCautionFlags([
      {
        code: "trend_comparability_needs_verification",
        severity: "needs_verification",
        message: "Trend points are count-only and do not yet verify matched prompt, persona, model, and sample conditions."
      },
      {
        code: "no_ai_visibility_or_competitive_gap_trend_p0",
        severity: "info",
        message: "AI visibility and competitive gap trends are excluded from P0 until comparability rules are implemented."
      },
      ...points.flatMap((point) => point.dataCautionFlags)
    ])
  };
}

function buildTrendPoint({
  runs,
  observationModel,
  brandMentions,
  citations,
  primaryBrand
}: {
  runs: RecoraMeasurementRunRow[];
  observationModel: ObservationModel;
  brandMentions: RecoraBrandMentionRow[];
  citations: RecoraCitationRow[];
  primaryBrand: RecoraBrandRow | null;
}): RecoraTrendHomePoint {
  const runIds = new Set(runs.map((run) => run.id));
  const observations = observationModel.validObservations.filter((item) => runIds.has(item.run.id));
  const conversations = observations.flatMap((item) => item.conversations);
  const conversationIds = new Set(conversations.map((item) => item.id));
  const counts = buildHomeCounts({
    runs,
    observations,
    conversations,
    brandMentions: brandMentions.filter((item) => conversationIds.has(item.conversation_id)),
    citations: citations.filter((item) => conversationIds.has(item.conversation_id)),
    primaryBrand
  });

  return {
    periodStart: minString(runs.map((run) => run.period_start)) ?? "",
    periodEnd: maxString(runs.map((run) => run.period_end)) ?? "",
    ...counts,
    dataCautionFlags: buildPointCautionFlags(counts.validObservationCount)
  };
}

function buildHomeCounts({
  runs,
  observations,
  conversations,
  brandMentions,
  citations,
  primaryBrand
}: HomeCountInput): HomeCounts {
  const conversationIdsWithPrimaryMention = getConversationIdsWithPrimaryMention(brandMentions, primaryBrand);
  const displayableCitations = citations.filter(isDisplayableCitation);

  return {
    completedMeasurementCount: runs.length,
    validObservationCount: observations.length,
    aiConversationCount: conversations.length,
    brandDisplayObservationCount: observations.filter((observation) =>
      observation.conversations.some((conversation) => conversationIdsWithPrimaryMention.has(conversation.id))
    ).length,
    citationOccurrenceCount: displayableCitations.reduce(
      (total, citation) => total + Math.max(1, citation.occurrence_count ?? 1),
      0
    ),
    citationUrlCount: uniqueValues(displayableCitations.map(getCitationUrlKey)).length,
    sourceDomainCount: uniqueValues(displayableCitations.map((citation) => citation.domain)).length
  };
}

function buildSourceDomainRanking(citations: RecoraCitationRow[]): RecoraCumulativeSourceDomainRank[] {
  const rows = new Map<string, {
    domain: string;
    sourceType: RecoraCitationRow["source_type"];
    occurrenceCount: number;
    citationRowCount: number;
    citationUrlKeys: Set<string>;
  }>();

  for (const citation of citations.filter(isDisplayableCitation)) {
    const domain = citation.domain.trim();
    if (!domain) continue;

    const key = domain.toLowerCase();
    const current = rows.get(key) ?? {
      domain,
      sourceType: citation.source_type,
      occurrenceCount: 0,
      citationRowCount: 0,
      citationUrlKeys: new Set<string>()
    };
    const urlKey = getCitationUrlKey(citation);

    current.occurrenceCount += Math.max(1, citation.occurrence_count ?? 1);
    current.citationRowCount += 1;
    if (urlKey) current.citationUrlKeys.add(urlKey);
    rows.set(key, current);
  }

  return Array.from(rows.values())
    .map((row) => ({
      domain: row.domain,
      sourceType: row.sourceType,
      occurrenceCount: row.occurrenceCount,
      citationUrlCount: row.citationUrlKeys.size,
      citationRowCount: row.citationRowCount
    }))
    .sort((a, b) =>
      b.occurrenceCount - a.occurrenceCount ||
      b.citationUrlCount - a.citationUrlCount ||
      a.domain.localeCompare(b.domain)
    )
    .slice(0, 5);
}

function buildCumulativeCautionFlags({
  runClassification,
  observationModel,
  primaryBrand,
  validObservationCount
}: {
  runClassification: RunClassification;
  observationModel: ObservationModel;
  primaryBrand: RecoraBrandRow | null;
  validObservationCount: number;
}) {
  const flags: RecoraHomeDataCautionFlag[] = [
    {
      code: "citation_count_not_source_to_claim_support",
      severity: "info",
      message: "Citation counts are URL or occurrence counts; they are not source-to-claim support verification."
    },
    {
      code: "recommendation_count_not_approved_actions",
      severity: "info",
      message: "Recommendation candidate counts are not approved action counts."
    },
    {
      code: "parse_status_needs_verification",
      severity: "needs_verification",
      message: "Current P0 valid observation checks cannot verify a dedicated parse status column."
    },
    {
      code: "provider_error_needs_verification",
      severity: "needs_verification",
      message: "Current P0 valid observation checks use run item error_message because a dedicated provider error column is unavailable."
    }
  ];

  if (runClassification.excludedSeedCount > 0) {
    flags.push({
      code: "seed_measurements_excluded",
      severity: "info",
      message: "Seed measurement runs are excluded and must not be treated as organic discovery."
    });
  }

  if (runClassification.excludedAggregateCount > 0) {
    flags.push({
      code: "aggregate_runs_excluded_from_cumulative",
      severity: "info",
      message: "Aggregate runs are excluded from cumulative home counts."
    });
  }

  if (runClassification.excludedNonMeasurementCount > 0) {
    flags.push({
      code: "non_measurement_run_kind_excluded",
      severity: "needs_verification",
      message: "Completed OpenAI runs without measurement run_kind are excluded from P0 cumulative counts."
    });
  }

  if (observationModel.excludedRunItemCount > 0) {
    flags.push({
      code: "unsafe_run_items_excluded",
      severity: "warning",
      message: "Run items without a successful completed observation or with an error message are excluded."
    });
  }

  if (observationModel.citationStatusIssueCount > 0) {
    flags.push({
      code: "citation_status_not_evidence_quality",
      severity: "warning",
      message: "Partial or error citation status is not evidence quality and is not counted as support verification."
    });
  }

  if (!primaryBrand) {
    flags.push({
      code: "primary_brand_missing",
      severity: "needs_verification",
      message: "Primary brand display observations cannot be counted without a primary brand."
    });
  }

  return dedupeCautionFlags([...flags, ...buildPointCautionFlags(validObservationCount)]);
}

function buildPointCautionFlags(validObservationCount: number) {
  const flags: RecoraHomeDataCautionFlag[] = [];

  if (validObservationCount > 0 && validObservationCount < 20) {
    flags.push({
      code: "small_sample_caution",
      severity: "warning",
      message: "Observation count is small; compare trends with caution."
    });
  }

  return flags;
}

function buildObservationModel(
  runs: RecoraMeasurementRunRow[],
  runItems: RecoraRunItemRow[],
  conversations: RecoraAiConversationRow[]
): ObservationModel {
  const runById = new Map(runs.map((run) => [run.id, run]));
  const conversationsByRunItemId = groupBy(conversations.filter(isOpenAiMeasuredConversation), "run_item_id");
  const validObservations: ValidObservationRecord[] = [];
  let excludedRunItemCount = 0;

  for (const runItem of runItems) {
    const run = runById.get(runItem.run_id);
    const itemConversations = conversationsByRunItemId.get(runItem.id) ?? [];
    const firstConversation = itemConversations[0] ?? null;

    // NEEDS_VERIFICATION: parse_status and provider_error are not dedicated P0 columns in the current DB.
    const valid = isValidObservation({
      status: runItem.status,
      ai_conversation_id: firstConversation?.id ?? null,
      parse_status: null,
      provider_error: runItem.error_message
    });

    if (!run || !valid) {
      excludedRunItemCount += 1;
      continue;
    }

    validObservations.push({
      run,
      runItem,
      conversations: itemConversations
    });
  }

  const validConversations = validObservations.flatMap((observation) => observation.conversations);

  return {
    validObservations,
    validConversations,
    validConversationIds: uniqueValues(validConversations.map((conversation) => conversation.id)),
    excludedRunItemCount,
    citationStatusIssueCount: validConversations.filter((conversation) =>
      ["partial", "error"].includes(conversation.citation_status)
    ).length
  };
}

function classifyMeasurementRuns(runs: RecoraMeasurementRunRow[]): RunClassification {
  const measurementRuns: RecoraMeasurementRunRow[] = [];
  let excludedSeedCount = 0;
  let excludedAggregateCount = 0;
  let excludedNonMeasurementCount = 0;

  for (const run of runs) {
    const metadata = getMetadataRecord(run.metadata);

    if (isSeedMeasurementRunId(run.id)) {
      excludedSeedCount += 1;
      continue;
    }

    if (isOpenAiAggregateRun(run)) {
      excludedAggregateCount += 1;
      continue;
    }

    if (getMetadataString(metadata, "run_kind") !== "measurement") {
      excludedNonMeasurementCount += 1;
      continue;
    }

    measurementRuns.push(run);
  }

  return {
    measurementRuns,
    excludedSeedCount,
    excludedAggregateCount,
    excludedNonMeasurementCount
  };
}

function getAggregationPeriod(runs: RecoraMeasurementRunRow[]) {
  return {
    start: minString(runs.map((run) => run.period_start)),
    end: maxString(runs.map((run) => run.period_end))
  };
}

function getPrimaryBrand(brands: RecoraBrandRow[]) {
  return (
    brands.find((brand) => brand.brand_type === "primary" && brand.is_active) ??
    brands.find((brand) => brand.brand_type === "primary") ??
    null
  );
}

function getConversationIdsWithPrimaryMention(
  brandMentions: RecoraBrandMentionRow[],
  primaryBrand: RecoraBrandRow | null
) {
  if (!primaryBrand) return new Set<string>();

  return new Set(
    brandMentions
      .filter((mention) => mention.brand_id === primaryBrand.id && mention.mentioned)
      .map((mention) => mention.conversation_id)
  );
}

function getCitationUrlKey(citation: RecoraCitationRow) {
  return citation.canonical_url || citation.url;
}

async function getCompletedOpenAiRuns(projectId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("project_id", projectId)
    .eq("status", "completed")
    .eq("metadata->>data_source", "openai_measurement")
    .order("period_start", { ascending: true })
    .order("completed_at", { ascending: true });

  throwIfSupabaseError("measurement_runs", error);
  return (data ?? []) as RecoraMeasurementRunRow[];
}

async function getRunItemsForRuns(runIds: string[], supabase: RecoraSupabaseClient) {
  if (runIds.length === 0) return [];

  const { data, error } = await supabase
    .from("run_items")
    .select(RUN_ITEM_COLUMNS)
    .in("run_id", runIds);

  throwIfSupabaseError("run_items", error);
  return (data ?? []) as RecoraRunItemRow[];
}

async function getAiConversations(runItemIds: string[], supabase: RecoraSupabaseClient) {
  if (runItemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select(AI_CONVERSATION_COLUMNS)
    .in("run_item_id", runItemIds);

  throwIfSupabaseError("ai_conversations", error);
  return (data ?? []) as RecoraAiConversationRow[];
}

async function getBrandMentions(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("brand_mentions")
    .select(BRAND_MENTION_COLUMNS)
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("brand_mentions", error);
  return (data ?? []) as RecoraBrandMentionRow[];
}

async function getCitations(conversationIds: string[], supabase: RecoraSupabaseClient) {
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from("citations")
    .select(CITATION_COLUMNS)
    .in("conversation_id", conversationIds);

  throwIfSupabaseError("citations", error);
  return ((data ?? []) as RecoraCitationRow[]).filter(isDisplayableCitation);
}

async function getHomeRecommendationCandidates(
  projectId: string,
  measurementRunIds: Set<string>,
  supabase: RecoraSupabaseClient
) {
  const { data, error } = await supabase
    .from("recommendations")
    .select(RECOMMENDATION_COLUMNS)
    .eq("project_id", projectId)
    .eq("metadata->>source", "recommendation_candidate_generator")
    .eq("metadata->>data_source", "openai_measurement")
    .order("created_at", { ascending: false });

  throwIfSupabaseError("recommendations", error);
  return ((data ?? []) as RecoraRecommendationRow[])
    .filter((item) => isRecommendationFromMeasurementRun(item, measurementRunIds))
    .filter(isDisplayableRecommendation)
    .filter(isCustomerVisibleHomeRecommendation);
}

function isCustomerVisibleHomeRecommendation(recommendation: RecoraRecommendationRow) {
  return isCustomerVisibleRecommendation({
    status: recommendation.status,
    metadata: getMetadataRecord(recommendation.metadata)
  });
}

function isRecommendationFromMeasurementRun(
  recommendation: RecoraRecommendationRow,
  measurementRunIds: Set<string>
) {
  const metadata = getMetadataRecord(recommendation.metadata);
  const measurementRunId = getMetadataString(metadata, "measurement_run_id") ?? recommendation.run_id;

  return Boolean(measurementRunId && measurementRunIds.has(measurementRunId));
}

function getRunPeriodKey(run: RecoraMeasurementRunRow) {
  return `${run.period_start}__${run.period_end}`;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function minString(values: string[]) {
  return values.length > 0 ? values.reduce((min, value) => value < min ? value : min) : null;
}

function maxString(values: string[]) {
  return values.length > 0 ? values.reduce((max, value) => value > max ? value : max) : null;
}

function groupBy<T, K extends keyof T>(items: T[], key: K) {
  const groups = new Map<T[K], T[]>();

  for (const item of items) {
    const value = item[key];
    groups.set(value, [...(groups.get(value) ?? []), item]);
  }

  return groups;
}

function dedupeCautionFlags(flags: RecoraHomeDataCautionFlag[]) {
  return Array.from(new Map(flags.map((flag) => [flag.code, flag])).values());
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora home read model ${context}: ${error.message}`);
}
