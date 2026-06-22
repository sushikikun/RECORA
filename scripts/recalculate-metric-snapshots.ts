import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import {
  assertRecoraDbWriteAllowed,
  createRecoraDbWriteGuardCliOptions,
  parseRecoraDbWriteGuardArg
} from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = process.env.RECORA_DEFAULT_PROJECT_SLUG ?? "recora-kenzai-q2";
const RECORA_NOTE =
  "Recora-defined observation metrics. These are not official evaluations from OpenAI or any AI platform.";
const METRIC_VERSION = "recora_metric_snapshots_v0.1";
const CALCULATION_METHOD = "openai_measurement_run_v0_1";

type Row = Record<string, string | null>;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
type SearchModeOption = "combined" | "no-search" | "web-search" | "both";
type RecommendationStatus = "strongly_recommended" | "recommended" | "listed" | "neutral" | "absent" | "discouraged";
type BrandType = "primary" | "competitor";
type SourceType = "owned" | "competitor" | "media" | "review" | "technical" | "unknown";
type BrandRelatedness = "unknown" | "target_brand" | "competitor" | "unknown_competitor" | "category" | "general" | "unrelated";
type PgMessage = { type: string; payload: Buffer };

type Options = {
  projectSlug: string;
  latestCompletedOpenaiRun: boolean;
  sourceRunId: string | null;
  searchMode: SearchModeOption;
  outputJson: string | null;
  apply: boolean;
  allowNonLocalDb: boolean;
  confirmNonLocalDbWrite: string | null;
};

type ProjectRow = Row & {
  id: string;
  slug: string;
  name: string;
  language: string;
  region: string;
};

type BrandRow = Row & {
  id: string;
  name: string;
  brand_type: BrandType;
  reading: string | null;
  aliases: string | null;
};

type SourceRunRow = Row & {
  id: string;
  project_id: string;
  status: string;
  period_start: string;
  period_end: string;
  region: string;
  language: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  conversation_count: string;
  failed_item_count: string;
};

type ConversationRow = Row & {
  id: string;
  run_item_id: string;
  prompt_id: string;
  prompt_text: string | null;
  prompt_intent: string | null;
  web_search_enabled: string;
  citation_status: string;
  measured_at: string | null;
};

type BrandMentionRow = Row & {
  id: string;
  conversation_id: string;
  brand_id: string;
  mentioned: string;
  position: string | null;
  recommendation_status: RecommendationStatus;
  sentiment: string;
  mention_count: string | null;
};

type CitationRow = Row & {
  id: string;
  conversation_id: string;
  brand_id: string | null;
  source_domain_id: string | null;
  domain: string;
  source_type: SourceType;
  supports_claim: string | null;
  occurrence_count: string;
  brand_related: BrandRelatedness;
  domain_source_type: SourceType | null;
};

type Counts = {
  recommendations: number;
  metricSnapshots: number;
};

type ExistingAggregateRun = {
  id: string;
  completed_at: string | null;
  snapshot_count: number;
  metadata: JsonValue;
};

type BrandMetric = {
  brand_id: string;
  brand_name: string;
  brand_type: BrandType;
  conversation_count: number;
  present_count: number;
  absent_count: number;
  visibility_rate: number;
  mention_count: number;
  recommended_count: number;
  listed_count: number;
  share_of_voice: number;
  average_estimated_answer_rank: number | null;
  citation_count: number;
  no_search_visibility_rate: number | null;
  web_search_visibility_rate: number | null;
};

type ProjectMetrics = {
  total_conversations: number;
  total_prompts: number;
  no_search_conversations: number;
  web_search_conversations: number;
  target_brand_id: string | null;
  target_brand_name: string | null;
  target_brand_visibility_rate: number;
  target_brand_mention_count: number;
  target_brand_recommended_count: number;
  total_citation_count: number;
  citation_coverage: number | null;
  unique_cited_domains: number;
  measurement_sample_size: number;
  competitive_gap: number | null;
  no_search_visibility_rate: number | null;
  web_search_visibility_rate: number | null;
};

type PlannedSnapshot = {
  scope_type: "project" | "brand";
  scope_id: string;
  brand_id: string | null;
  ai_visibility: number;
  ai_mention_count: number;
  citation_count: number;
  share_of_voice: number;
  competitive_gap: number | null;
  average_position: number | null;
  metadata: Record<string, JsonValue | undefined>;
};

async function main() {
  await loadEnvLocal();
  const options = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  assertRecoraDbWriteAllowed({
    databaseUrl,
    operation: "recalculate-metric-snapshots --apply",
    projectSlug: options.projectSlug,
    isWrite: options.apply,
    allowNonLocalDb: options.allowNonLocalDb,
    confirmNonLocalDbWrite: options.confirmNonLocalDbWrite
  });
  const db = new LocalPostgresClient(databaseUrl);

  await db.connect();
  try {
    const before = await getCounts(db);
    const project = await getProject(db, options.projectSlug);
    const sourceRun = options.sourceRunId
      ? await getSourceRunById(db, project.id, options.sourceRunId)
      : await getLatestCompletedOpenAiRun(db, project.id);

    if (!sourceRun) {
      throw new Error("No completed OpenAI measurement run was found for the selected project.");
    }

    const brands = await getBrands(db, project.id);
    const allConversations = await getConversations(db, sourceRun.id);
    const metricEligibleConversations = filterMetricEligibleConversations(allConversations, brands);
    const selectedConversations = filterConversations(metricEligibleConversations, options.searchMode);
    const selectedConversationIds = selectedConversations.map((conversation) => conversation.id);
    const brandMentions = await getBrandMentions(db, selectedConversationIds);
    const citations = await getCitations(db, selectedConversationIds);
    const sourceDomainCount = unique(citations.map((citation) => citation.source_domain_id).filter(isPresent)).length;
    const computedBrandMetrics = computeBrandMetrics(brands, selectedConversations, metricEligibleConversations, brandMentions, citations);
    const computedProjectMetrics = computeProjectMetrics(project, brands, selectedConversations, citations, computedBrandMetrics);
    const sampleSizeNote = buildSampleSizeNote(selectedConversations.length);
    const confidenceNote = buildConfidenceNote(selectedConversations.length);
    const excludedBrandedPromptObservationCount = Math.max(0, allConversations.length - metricEligibleConversations.length);
    const plannedAggregateRun = buildPlannedAggregateRun(
      project,
      sourceRun,
      options.searchMode,
      sampleSizeNote,
      excludedBrandedPromptObservationCount
    );
    const plannedSnapshots = buildPlannedSnapshots({
      project,
      brands,
      sourceRun,
      searchMode: options.searchMode,
      projectMetrics: computedProjectMetrics,
      brandMetrics: computedBrandMetrics,
      sampleSize: selectedConversations.length,
      confidenceNote,
      excludedBrandedPromptObservationCount
    });
    const schemaCapabilities = getSchemaCapabilities();
    const existingAggregate = await findExistingAggregateRun(db, project.id, sourceRun.id, options.searchMode);
    const plannedSnapshotActions = buildPlannedSnapshotActions(plannedSnapshots, existingAggregate);
    const writableSnapshots = existingAggregate
      ? plannedSnapshots.filter((snapshot) => snapshot.scope_type === "project")
      : plannedSnapshots;
    const databaseWriteAllowed = options.apply;
    const applyWarning = existingAggregate
      ? "An aggregate run for this source_run_id and search_mode already exists. Apply would update the existing aggregate project snapshot instead of inserting a duplicate."
      : null;
    let aggregateRunId: string | null = null;
    let aggregateRunCreated = false;
    let writtenSnapshots = 0;

    if (databaseWriteAllowed) {
      await db.query("begin");
      try {
        if (existingAggregate) {
          aggregateRunId = existingAggregate.id;
        } else {
          aggregateRunId = await insertAggregateRun(db, plannedAggregateRun);
          aggregateRunCreated = true;
        }
        for (const snapshot of writableSnapshots) {
          await insertMetricSnapshot(db, aggregateRunId, snapshot);
          writtenSnapshots += 1;
        }
        await db.query("commit");
      } catch (error) {
        await db.query("rollback");
        throw error;
      }
    }

    const after = await getCounts(db);
    const output = {
      mode: databaseWriteAllowed ? "apply" : "dry-run",
      projectSlug: project.slug,
      selectedSourceRunId: sourceRun.id,
      selectedSourceRunStatus: sourceRun.status,
      sourceRunCompletedAt: sourceRun.completed_at,
      searchMode: options.searchMode,
      conversationCount: selectedConversations.length,
      excludedBrandedPromptObservationCount,
      brandMentionCount: brandMentions.length,
      citationCount: citations.length,
      sourceDomainCount,
      plannedAggregateRun,
      plannedAggregateRunMetadata: plannedAggregateRun.metadata,
      existingAggregate,
      plannedAggregateRunCreated: aggregateRunCreated,
      aggregateRunId,
      plannedProjectSnapshots: plannedSnapshots.filter((snapshot) => snapshot.scope_type === "project").length,
      plannedBrandSnapshots: plannedSnapshots.filter((snapshot) => snapshot.scope_type === "brand").length,
      plannedSnapshotCount: plannedSnapshots.length,
      plannedSnapshotActions,
      insertedSnapshotCount: aggregateRunCreated ? writtenSnapshots : 0,
      updatedSnapshotCount: existingAggregate && databaseWriteAllowed ? writtenSnapshots : 0,
      writtenSnapshotCount: writtenSnapshots,
      computedProjectMetrics,
      computedBrandMetrics,
      plannedMetricSnapshotMetadata: plannedSnapshots.map((snapshot) => ({
        scope_type: snapshot.scope_type,
        scope_id: snapshot.scope_id,
        brand_id: snapshot.brand_id,
        metadata: snapshot.metadata
      })),
      plannedSnapshots,
      databaseWriteAllowed,
      databaseWritePerformed: writtenSnapshots > 0,
      applyWarning,
      recommendationsBefore: before.recommendations,
      recommendationsAfter: after.recommendations,
      metricSnapshotsBefore: before.metricSnapshots,
      metricSnapshotsAfter: after.metricSnapshots,
      recommendationsUnchanged: before.recommendations === after.recommendations,
      metricSnapshotsUnchanged: before.metricSnapshots === after.metricSnapshots,
      seedMetricSnapshotsUntouched: !options.apply && before.metricSnapshots === after.metricSnapshots,
      schemaCapabilities,
      sampleSizeNote,
      confidenceNote,
      note: RECORA_NOTE
    };

    if (options.outputJson) {
      const outputPath = path.resolve(process.cwd(), options.outputJson);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    }

    console.log(JSON.stringify(output, null, 2));
  } finally {
    db.end();
  }
}

function parseArgs(args: string[]): Options {
  const guardOptions = createRecoraDbWriteGuardCliOptions();
  const options: Options = {
    projectSlug: DEFAULT_PROJECT_SLUG,
    latestCompletedOpenaiRun: true,
    sourceRunId: null,
    searchMode: "combined",
    outputJson: null,
    apply: false,
    allowNonLocalDb: guardOptions.allowNonLocalDb,
    confirmNonLocalDbWrite: guardOptions.confirmNonLocalDbWrite
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    const guardConsumed = parseRecoraDbWriteGuardArg(args, index, options);
    if (guardConsumed > 0) {
      index += guardConsumed - 1;
      continue;
    }

    if (arg === "--project-slug" && next) {
      options.projectSlug = next;
      index += 1;
      continue;
    }
    if (arg === "--latest-completed-openai-run") {
      options.latestCompletedOpenaiRun = true;
      options.sourceRunId = null;
      continue;
    }
    if (arg === "--source-run-id" && next) {
      options.sourceRunId = next;
      options.latestCompletedOpenaiRun = false;
      index += 1;
      continue;
    }
    if (arg === "--search-mode" && next) {
      if (!isSearchModeOption(next)) throw new Error("--search-mode must be combined, no-search, web-search, or both.");
      options.searchMode = next;
      index += 1;
      continue;
    }
    if (arg === "--output-json" && next) {
      options.outputJson = next;
      index += 1;
      continue;
    }
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function isSearchModeOption(value: string): value is SearchModeOption {
  return value === "combined" || value === "no-search" || value === "web-search" || value === "both";
}

async function getProject(db: LocalPostgresClient, slug: string): Promise<ProjectRow> {
  const rows = await db.query<ProjectRow>(`
    select id::text as id, slug, name, language, region
    from public.projects
    where slug = ${lit(slug)}
    limit 1
  `);
  if (!rows[0]) throw new Error(`Project not found: ${slug}`);
  return rows[0];
}

async function getLatestCompletedOpenAiRun(db: LocalPostgresClient, projectId: string): Promise<SourceRunRow | null> {
  const rows = await db.query<SourceRunRow>(`
    select
      mr.id::text as id,
      mr.project_id::text as project_id,
      mr.status::text as status,
      mr.period_start::text as period_start,
      mr.period_end::text as period_end,
      mr.region,
      mr.language,
      mr.started_at::text as started_at,
      mr.completed_at::text as completed_at,
      mr.created_at::text as created_at,
      count(ac.id)::text as conversation_count,
      count(distinct ri.id) filter (where ri.status = 'failed')::text as failed_item_count
    from public.measurement_runs mr
    left join public.run_items ri on ri.run_id = mr.id
    left join public.ai_conversations ac on ac.run_item_id = ri.id and ac.provider = 'openai'
    where mr.project_id = ${uuid(projectId)}
      and mr.status = 'completed'
      and mr.metadata->>'data_source' = 'openai_measurement'
      and coalesce(mr.metadata->>'run_kind', 'measurement') <> 'aggregate'
    group by mr.id
    having count(ac.id) > 0
      and count(distinct ri.id) filter (where ri.status = 'failed') = 0
    order by coalesce(mr.completed_at, mr.created_at) desc, mr.created_at desc
    limit 1
  `);
  return rows[0] ?? null;
}

async function getSourceRunById(db: LocalPostgresClient, projectId: string, sourceRunId: string): Promise<SourceRunRow> {
  const rows = await db.query<SourceRunRow>(`
    select
      mr.id::text as id,
      mr.project_id::text as project_id,
      mr.status::text as status,
      mr.period_start::text as period_start,
      mr.period_end::text as period_end,
      mr.region,
      mr.language,
      mr.started_at::text as started_at,
      mr.completed_at::text as completed_at,
      mr.created_at::text as created_at,
      count(ac.id)::text as conversation_count,
      count(distinct ri.id) filter (where ri.status = 'failed')::text as failed_item_count
    from public.measurement_runs mr
    left join public.run_items ri on ri.run_id = mr.id
    left join public.ai_conversations ac on ac.run_item_id = ri.id and ac.provider = 'openai'
    where mr.project_id = ${uuid(projectId)}
      and mr.id = ${uuid(sourceRunId)}
      and mr.metadata->>'data_source' = 'openai_measurement'
      and coalesce(mr.metadata->>'run_kind', 'measurement') <> 'aggregate'
    group by mr.id
    limit 1
  `);
  const run = rows[0];
  if (!run) throw new Error(`Source run not found: ${sourceRunId}`);
  if (run.status !== "completed") throw new Error(`Source run must be completed. Current status: ${run.status}`);
  if (Number(run.conversation_count) === 0) throw new Error("Source run has no OpenAI conversations.");
  if (Number(run.failed_item_count) > 0) throw new Error("Source run has failed run items. Fix or rerun measurement before aggregating.");
  return run;
}

async function getBrands(db: LocalPostgresClient, projectId: string): Promise<BrandRow[]> {
  return db.query<BrandRow>(`
    select id::text as id, name, reading, aliases::text as aliases, brand_type::text as brand_type
    from public.brands
    where project_id = ${uuid(projectId)}
      and is_active = true
    order by brand_type asc, name asc
  `);
}

async function getConversations(db: LocalPostgresClient, runId: string): Promise<ConversationRow[]> {
  return db.query<ConversationRow>(`
    select
      ac.id::text as id,
      ac.run_item_id::text as run_item_id,
      ri.prompt_id::text as prompt_id,
      p.text as prompt_text,
      p.intent as prompt_intent,
      ac.web_search_enabled::text as web_search_enabled,
      ac.citation_status::text as citation_status,
      ac.measured_at::text as measured_at
    from public.run_items ri
    join public.ai_conversations ac on ac.run_item_id = ri.id
    left join public.prompts p on p.id = ri.prompt_id
    where ri.run_id = ${uuid(runId)}
      and ac.provider = 'openai'
    order by coalesce(ac.measured_at, ac.captured_at) asc, ac.created_at asc
  `);
}

async function getBrandMentions(db: LocalPostgresClient, conversationIds: string[]): Promise<BrandMentionRow[]> {
  if (conversationIds.length === 0) return [];
  return db.query<BrandMentionRow>(`
    select
      id::text as id,
      conversation_id::text as conversation_id,
      brand_id::text as brand_id,
      mentioned::text as mentioned,
      position::text as position,
      recommendation_status::text as recommendation_status,
      sentiment::text as sentiment,
      mention_count::text as mention_count
    from public.brand_mentions
    where conversation_id in (${uuidList(conversationIds)})
  `);
}

async function getCitations(db: LocalPostgresClient, conversationIds: string[]): Promise<CitationRow[]> {
  if (conversationIds.length === 0) return [];
  return db.query<CitationRow>(`
    select
      c.id::text as id,
      c.conversation_id::text as conversation_id,
      c.brand_id::text as brand_id,
      c.source_domain_id::text as source_domain_id,
      c.domain,
      c.source_type::text as source_type,
      c.supports_claim::text as supports_claim,
      c.occurrence_count::text as occurrence_count,
      c.brand_related::text as brand_related,
      sd.source_type::text as domain_source_type
    from public.citations c
    left join public.source_domains sd on sd.id = c.source_domain_id
    where c.conversation_id in (${uuidList(conversationIds)})
  `);
}

async function getCounts(db: LocalPostgresClient): Promise<Counts> {
  const rows = await db.query<{ recommendations: string; metric_snapshots: string }>(`
    select
      (select count(*) from public.recommendations)::text as recommendations,
      (select count(*) from public.metric_snapshots)::text as metric_snapshots
  `);
  return {
    recommendations: Number(rows[0]?.recommendations ?? 0),
    metricSnapshots: Number(rows[0]?.metric_snapshots ?? 0)
  };
}

function filterConversations(conversations: ConversationRow[], searchMode: SearchModeOption) {
  if (searchMode === "no-search") return conversations.filter((conversation) => !toBoolean(conversation.web_search_enabled));
  if (searchMode === "web-search") return conversations.filter((conversation) => toBoolean(conversation.web_search_enabled));
  return conversations;
}

function filterMetricEligibleConversations(conversations: ConversationRow[], brands: BrandRow[]) {
  const primaryBrand = brands.find((brand) => brand.brand_type === "primary") ?? null;
  if (!primaryBrand) return [];

  const brandPromptTokens = getBrandPromptTokens(primaryBrand);
  if (brandPromptTokens.length === 0) return [];

  return conversations.filter((conversation) => !isBrandedPromptConversation(conversation, brandPromptTokens));
}

function isBrandedPromptConversation(conversation: ConversationRow, brandPromptTokens: string[]) {
  const promptText = [conversation.prompt_text, conversation.prompt_intent].filter(Boolean).join("\n");
  const haystack = normalizeBrandPromptText(promptText);
  if (!haystack) return true;

  return brandPromptTokens.some((token) => haystack.includes(token));
}

function getBrandPromptTokens(brand: BrandRow) {
  return unique(
    [brand.name, brand.reading ?? "", ...parseJsonStringArray(brand.aliases)]
      .map((value) => normalizeBrandPromptText(value))
      .filter((value) => value.length >= 2)
  ).sort((left, right) => right.length - left.length);
}

function computeBrandMetrics(
  brands: BrandRow[],
  selectedConversations: ConversationRow[],
  allConversations: ConversationRow[],
  brandMentions: BrandMentionRow[],
  citations: CitationRow[]
): BrandMetric[] {
  const selectedConversationIds = new Set(selectedConversations.map((conversation) => conversation.id));
  const selectedMentionRows = brandMentions.filter((mention) => selectedConversationIds.has(mention.conversation_id));
  const totalMentionCount = selectedMentionRows.reduce((sum, mention) => sum + Math.max(0, toNumber(mention.mention_count)), 0);

  return brands.map((brand) => {
    const mentions = selectedMentionRows.filter((mention) => mention.brand_id === brand.id);
    const presentMentions = mentions.filter((mention) => toBoolean(mention.mentioned));
    const mentionCount = mentions.reduce((sum, mention) => sum + Math.max(0, toNumber(mention.mention_count)), 0);
    const recommendedCount = mentions.filter((mention) => isRecommended(mention.recommendation_status)).length;
    const listedCount = mentions.filter((mention) => mention.recommendation_status === "listed" || mention.recommendation_status === "neutral").length;
    const positions = presentMentions.map((mention) => toNullableNumber(mention.position)).filter(isNumber);
    const citationCount = citations.filter((citation) => citation.brand_id === brand.id).length;

    return {
      brand_id: brand.id,
      brand_name: brand.name,
      brand_type: brand.brand_type,
      conversation_count: selectedConversations.length,
      present_count: presentMentions.length,
      absent_count: Math.max(0, selectedConversations.length - presentMentions.length),
      visibility_rate: percent(presentMentions.length, selectedConversations.length),
      mention_count: mentionCount,
      recommended_count: recommendedCount,
      listed_count: listedCount,
      share_of_voice: totalMentionCount > 0 ? round2((mentionCount / totalMentionCount) * 100) : 0,
      average_estimated_answer_rank: positions.length > 0 ? round2(average(positions)) : null,
      citation_count: citationCount,
      no_search_visibility_rate: computeVisibilityForMode(brand.id, allConversations, selectedMentionRows, false),
      web_search_visibility_rate: computeVisibilityForMode(brand.id, allConversations, selectedMentionRows, true)
    };
  });
}

function computeVisibilityForMode(brandId: string, conversations: ConversationRow[], mentions: BrandMentionRow[], webSearchEnabled: boolean) {
  const modeConversations = conversations.filter((conversation) => toBoolean(conversation.web_search_enabled) === webSearchEnabled);
  if (modeConversations.length === 0) return null;
  const modeConversationIds = new Set(modeConversations.map((conversation) => conversation.id));
  const presentCount = mentions.filter((mention) => mention.brand_id === brandId && modeConversationIds.has(mention.conversation_id) && toBoolean(mention.mentioned)).length;
  return percent(presentCount, modeConversations.length);
}

function computeProjectMetrics(
  project: ProjectRow,
  brands: BrandRow[],
  conversations: ConversationRow[],
  citations: CitationRow[],
  brandMetrics: BrandMetric[]
): ProjectMetrics {
  const targetBrand = brands.find((brand) => brand.brand_type === "primary") ?? brands[0] ?? null;
  const targetMetric = targetBrand ? brandMetrics.find((metric) => metric.brand_id === targetBrand.id) ?? null : null;
  const competitorMetrics = brandMetrics.filter((metric) => metric.brand_type === "competitor");
  const topCompetitorVisibility = competitorMetrics.length > 0 ? Math.max(...competitorMetrics.map((metric) => metric.visibility_rate)) : null;
  const webSearchConversationIds = new Set(conversations.filter((conversation) => toBoolean(conversation.web_search_enabled)).map((conversation) => conversation.id));
  const webSearchConversations = webSearchConversationIds.size;
  const citedWebSearchConversationCount = unique(citations.filter((citation) => webSearchConversationIds.has(citation.conversation_id)).map((citation) => citation.conversation_id)).length;

  return {
    total_conversations: conversations.length,
    total_prompts: unique(conversations.map((conversation) => conversation.prompt_id)).length,
    no_search_conversations: conversations.filter((conversation) => !toBoolean(conversation.web_search_enabled)).length,
    web_search_conversations: webSearchConversations,
    target_brand_id: targetBrand?.id ?? null,
    target_brand_name: targetBrand?.name ?? null,
    target_brand_visibility_rate: targetMetric?.visibility_rate ?? 0,
    target_brand_mention_count: targetMetric?.mention_count ?? 0,
    target_brand_recommended_count: targetMetric?.recommended_count ?? 0,
    total_citation_count: citations.length,
    citation_coverage: webSearchConversations > 0 ? percent(citedWebSearchConversationCount, webSearchConversations) : null,
    unique_cited_domains: unique(citations.map((citation) => citation.domain).filter(Boolean)).length,
    measurement_sample_size: conversations.length,
    competitive_gap:
      targetMetric && topCompetitorVisibility !== null ? round2(targetMetric.visibility_rate - topCompetitorVisibility) : null,
    no_search_visibility_rate: targetMetric?.no_search_visibility_rate ?? null,
    web_search_visibility_rate: targetMetric?.web_search_visibility_rate ?? null
  };
}

function buildPlannedSnapshots(input: {
  project: ProjectRow;
  brands: BrandRow[];
  sourceRun: SourceRunRow;
  searchMode: SearchModeOption;
  projectMetrics: ProjectMetrics;
  brandMetrics: BrandMetric[];
  sampleSize: number;
  confidenceNote: string;
  excludedBrandedPromptObservationCount: number;
}): PlannedSnapshot[] {
  const {
    project,
    brands,
    sourceRun,
    searchMode,
    projectMetrics,
    brandMetrics,
    sampleSize,
    confidenceNote,
    excludedBrandedPromptObservationCount
  } = input;
  const targetBrand = brands.find((brand) => brand.id === projectMetrics.target_brand_id) ?? null;
  const targetMetric = targetBrand ? brandMetrics.find((metric) => metric.brand_id === targetBrand.id) ?? null : null;
  const projectSnapshot: PlannedSnapshot = {
    scope_type: "project",
    scope_id: project.id,
    brand_id: targetBrand?.id ?? null,
    ai_visibility: projectMetrics.target_brand_visibility_rate,
    ai_mention_count: projectMetrics.target_brand_mention_count,
    citation_count: projectMetrics.total_citation_count,
    share_of_voice: targetMetric?.share_of_voice ?? 0,
    competitive_gap: projectMetrics.competitive_gap,
    average_position: targetMetric?.average_estimated_answer_rank ?? null,
    metadata: buildMetricSnapshotMetadata({
      sourceRun,
      searchMode,
      sampleSize,
      confidenceNote,
      scopeType: "project",
      scopeId: project.id,
      brandId: targetBrand?.id ?? null,
      projectMetrics,
      brandMetric: targetMetric ?? null,
      excludedBrandedPromptObservationCount
    })
  };
  const brandSnapshots = brandMetrics.map<PlannedSnapshot>((metric) => ({
    scope_type: "brand",
    scope_id: metric.brand_id,
    brand_id: metric.brand_id,
    ai_visibility: metric.visibility_rate,
    ai_mention_count: metric.mention_count,
    citation_count: metric.citation_count,
    share_of_voice: metric.share_of_voice,
    competitive_gap: metric.brand_type === "primary" ? projectMetrics.competitive_gap : null,
    average_position: metric.average_estimated_answer_rank,
    metadata: buildMetricSnapshotMetadata({
      sourceRun,
      searchMode,
      sampleSize,
      confidenceNote,
      scopeType: "brand",
      scopeId: metric.brand_id,
      brandId: metric.brand_id,
      projectMetrics,
      brandMetric: metric,
      excludedBrandedPromptObservationCount
    })
  }));
  return [projectSnapshot, ...brandSnapshots];
}

function buildPlannedAggregateRun(
  project: ProjectRow,
  sourceRun: SourceRunRow,
  searchMode: SearchModeOption,
  sampleSizeNote: string,
  excludedBrandedPromptObservationCount: number
) {
  const now = new Date().toISOString();
  return {
    project_id: project.id,
    status: "completed",
    period_start: sourceRun.period_start,
    period_end: sourceRun.period_end,
    region: sourceRun.region || project.region || "JP",
    language: sourceRun.language || project.language || "ja",
    started_at: now,
    completed_at: now,
    source_run_id: sourceRun.id,
    data_source: "openai_measurement",
    search_mode: searchMode,
    metadata: buildAggregateRunMetadata(sourceRun, searchMode, sampleSizeNote, excludedBrandedPromptObservationCount)
  };
}

function buildAggregateRunMetadata(
  sourceRun: SourceRunRow,
  searchMode: SearchModeOption,
  sampleSizeNote: string,
  excludedBrandedPromptObservationCount: number
): Record<string, JsonValue> {
  return {
    run_kind: "aggregate",
    source_run_id: sourceRun.id,
    data_source: "openai_measurement",
    calculation_method: CALCULATION_METHOD,
    search_mode: searchMode,
    metric_prompt_scope: "non_branded_prompt_only",
    excluded_branded_prompt_observation_count: excludedBrandedPromptObservationCount,
    sample_size_note: sampleSizeNote,
    metric_version: METRIC_VERSION,
    recora_metric_notice: RECORA_NOTE
  };
}

function buildMetricSnapshotMetadata(input: {
  sourceRun: SourceRunRow;
  searchMode: SearchModeOption;
  sampleSize: number;
  confidenceNote: string;
  scopeType: "project" | "brand";
  scopeId: string;
  brandId: string | null;
  projectMetrics: ProjectMetrics;
  brandMetric: BrandMetric | null;
  excludedBrandedPromptObservationCount: number;
}): Record<string, JsonValue | undefined> {
  const {
    sourceRun,
    searchMode,
    sampleSize,
    confidenceNote,
    scopeType,
    scopeId,
    brandId,
    projectMetrics,
    brandMetric,
    excludedBrandedPromptObservationCount
  } = input;
  const projectCitationMetadata =
    scopeType === "project"
      ? {
          total_citation_count: projectMetrics.total_citation_count,
          unique_cited_domains: projectMetrics.unique_cited_domains,
          citation_coverage: projectMetrics.citation_coverage
        }
      : {};
  return {
    source_run_id: sourceRun.id,
    aggregate_run_kind: "aggregate",
    data_source: "openai_measurement",
    search_mode: searchMode,
    metric_version: METRIC_VERSION,
    calculation_method: CALCULATION_METHOD,
    metric_prompt_scope: "non_branded_prompt_only",
    excluded_branded_prompt_observation_count: excludedBrandedPromptObservationCount,
    sample_size: sampleSize,
    scope_type: scopeType,
    scope_id: scopeId,
    brand_id: brandId,
    ...projectCitationMetadata,
    no_search_breakdown: buildSearchModeBreakdown(projectMetrics, brandMetric, "no-search"),
    web_search_breakdown: buildSearchModeBreakdown(projectMetrics, brandMetric, "web-search"),
    confidence_note: confidenceNote,
    recora_metric_notice: RECORA_NOTE
  };
}

function buildPlannedSnapshotActions(plannedSnapshots: PlannedSnapshot[], existingAggregate: ExistingAggregateRun | null) {
  return plannedSnapshots.map((snapshot) => {
    const action = existingAggregate
      ? snapshot.scope_type === "project"
        ? "would_update_project_snapshot"
        : "would_leave_existing_brand_snapshot_unchanged"
      : snapshot.scope_type === "project"
        ? "would_insert_project_snapshot"
        : "would_insert_brand_snapshot";

    return {
      scope_type: snapshot.scope_type,
      scope_id: snapshot.scope_id,
      brand_id: snapshot.brand_id,
      action,
      citation_count: snapshot.citation_count,
      existing_aggregate_run_id: existingAggregate?.id ?? null
    };
  });
}

function buildSearchModeBreakdown(projectMetrics: ProjectMetrics, brandMetric: BrandMetric | null, mode: "no-search" | "web-search") {
  const isWebSearch = mode === "web-search";
  return {
    search_mode: mode,
    conversation_count: isWebSearch ? projectMetrics.web_search_conversations : projectMetrics.no_search_conversations,
    visibility_rate: isWebSearch
      ? brandMetric?.web_search_visibility_rate ?? projectMetrics.web_search_visibility_rate
      : brandMetric?.no_search_visibility_rate ?? projectMetrics.no_search_visibility_rate,
    citation_coverage: isWebSearch ? projectMetrics.citation_coverage : null,
    citation_status: isWebSearch ? "measured_when_available" : "not_applicable"
  };
}

function getSchemaCapabilities() {
  return {
    measurement_runs_metadata: "available",
    metric_snapshots_metadata: "available",
    metric_snapshots_search_mode_column: "not_available_metadata_only",
    persisted_source_run_id: "available_in_metadata",
    duplicate_prevention:
      "Uses measurement_runs.metadata source_run_id, run_kind, data_source, and search_mode. Seed snapshots with empty metadata are not matched.",
    safe_apply_policy: "Dry-run is the default. Apply is supported but was not run in this verification."
  };
}

function buildSampleSizeNote(sampleSize: number) {
  if (sampleSize < 10) return `sample_size=${sampleSize}. Treat confidence as low and do not present this as a strong conclusion.`;
  return `sample_size=${sampleSize}. Still treat metrics as Recora observations, not official AI platform evaluations.`;
}

function buildConfidenceNote(sampleSize: number) {
  if (sampleSize < 10) return "low: fewer than 10 observations. Treat as a small Recora observation sample, not a strong trend.";
  return "medium: enough observations for a Recora run-level summary, but still not an official AI platform evaluation.";
}

async function findExistingAggregateRun(
  db: LocalPostgresClient,
  projectId: string,
  sourceRunId: string,
  searchMode: SearchModeOption
): Promise<ExistingAggregateRun | null> {
  const rows = await db.query<{ id: string; completed_at: string | null; snapshot_count: string; metadata: string | null }>(`
    select mr.id::text as id
      , mr.completed_at::text as completed_at
      , count(ms.id)::text as snapshot_count
      , mr.metadata::text as metadata
    from public.measurement_runs mr
    left join public.metric_snapshots ms on ms.run_id = mr.id
    where mr.project_id = ${uuid(projectId)}
      and mr.status = 'completed'
      and mr.metadata->>'run_kind' = 'aggregate'
      and mr.metadata->>'source_run_id' = ${lit(sourceRunId)}
      and mr.metadata->>'data_source' = 'openai_measurement'
      and mr.metadata->>'search_mode' = ${lit(searchMode)}
      and not exists (
        select 1 from public.run_items ri where ri.run_id = mr.id
      )
    group by mr.id
    order by coalesce(mr.completed_at, mr.created_at) desc
    limit 1
  `);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    completed_at: row.completed_at,
    snapshot_count: Number(row.snapshot_count ?? 0),
    metadata: parseJsonValue(row.metadata)
  };
}

async function insertAggregateRun(db: LocalPostgresClient, planned: ReturnType<typeof buildPlannedAggregateRun>) {
  const rows = await db.query<{ id: string }>(`
    insert into public.measurement_runs (
      project_id, status, period_start, period_end, region, language, started_at, completed_at, metadata
    )
    values (
      ${uuid(planned.project_id)},
      'completed',
      ${lit(planned.period_start)}::date,
      ${lit(planned.period_end)}::date,
      ${lit(planned.region)},
      ${lit(planned.language)},
      ${ts(planned.started_at)},
      ${ts(planned.completed_at)},
      ${jsonb(planned.metadata)}
    )
    returning id::text as id
  `);
  if (!rows[0]) throw new Error("Failed to create aggregate measurement run.");
  return rows[0].id;
}

async function insertMetricSnapshot(db: LocalPostgresClient, runId: string, snapshot: PlannedSnapshot) {
  await db.query(`
    insert into public.metric_snapshots (
      run_id,
      scope_type,
      scope_id,
      brand_id,
      ai_visibility,
      ai_mention_count,
      citation_count,
      share_of_voice,
      competitive_gap,
      average_position,
      calculated_at,
      metadata
    )
    values (
      ${uuid(runId)},
      ${lit(snapshot.scope_type)}::public.recora_metric_scope_type,
      ${uuid(snapshot.scope_id)},
      ${nullableUuid(snapshot.brand_id)},
      ${num(snapshot.ai_visibility)},
      ${num(Math.round(snapshot.ai_mention_count))},
      ${num(Math.round(snapshot.citation_count))},
      ${num(snapshot.share_of_voice)},
      ${nullableNum(snapshot.competitive_gap)},
      ${nullableNum(snapshot.average_position)},
      now(),
      ${jsonb(snapshot.metadata)}
    )
    on conflict (
      run_id,
      scope_type,
      coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(brand_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    do update set
      ai_visibility = excluded.ai_visibility,
      ai_mention_count = excluded.ai_mention_count,
      citation_count = excluded.citation_count,
      share_of_voice = excluded.share_of_voice,
      competitive_gap = excluded.competitive_gap,
      average_position = excluded.average_position,
      calculated_at = excluded.calculated_at,
      metadata = excluded.metadata
  `);
}

async function loadEnvLocal() {
  try {
    const envText = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^[ '"]|[ '"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function isRecommended(value: RecommendationStatus) {
  return value === "recommended" || value === "strongly_recommended";
}

function toBoolean(value: string | null) {
  return value === "true" || value === "t";
}

function toNumber(value: string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: string | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return round2((part / total) * 100);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "";
}

function isNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseJsonValue(value: string | null): JsonValue {
  if (!value) return {};
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return {};
  }
}

function parseJsonStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    return flattenStringValues(JSON.parse(value));
  } catch {
    return [value];
  }
}

function flattenStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenStringValues);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(flattenStringValues);
  }
  return [];
}

function normalizeBrandPromptText(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function num(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function nullableNum(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "null";
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

function nullableUuid(value: string | null | undefined) {
  return value ? uuid(value) : "null";
}

function uuidList(values: string[]) {
  return values.map(uuid).join(", ");
}

function ts(value: string | null | undefined) {
  return value ? `${lit(value)}::timestamptz` : "null";
}

function jsonb(value: unknown) {
  return `${lit(JSON.stringify(value))}::jsonb`;
}

class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) {
    this.url = new URL(databaseUrl);
  }

  async connect() {
    const socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port || 5432) });
    this.socket = socket;
    socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      for (const waiter of this.waiters.splice(0)) waiter();
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    this.sendStartup();
    await this.authenticate();
  }

  end() {
    if (!this.socket || this.socket.destroyed) return;
    this.sendMessage("X", Buffer.alloc(0));
    this.socket.end();
  }

  async query<T extends Row = Row>(queryText: string): Promise<T[]> {
    this.sendMessage("Q", Buffer.from(`${queryText}\0`, "utf8"));
    const fields: string[] = [];
    const rows: T[] = [];
    while (true) {
      const message = await this.readMessage();
      if (message.type === "T") fields.splice(0, fields.length, ...parseRowDescription(message.payload));
      else if (message.type === "D") rows.push(parseDataRow<T>(message.payload, fields));
      else if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      else if (message.type === "Z") return rows;
    }
  }

  private sendStartup() {
    const params = Buffer.from(`user\0${this.user}\0database\0${this.database}\0client_encoding\0UTF8\0\0`, "utf8");
    const protocol = Buffer.alloc(4);
    protocol.writeInt32BE(196608, 0);
    this.sendRaw(Buffer.concat([int32(8 + params.length), protocol, params]));
  }

  private async authenticate() {
    while (true) {
      const message = await this.readMessage();
      if (message.type === "R") {
        const code = message.payload.readInt32BE(0);
        if (code === 0 || code === 11 || code === 12) continue;
        if (code === 3) {
          this.sendPassword(this.password);
          continue;
        }
        if (code === 5) {
          this.sendPassword(buildMd5Password(this.user, this.password, message.payload.subarray(4, 8)));
          continue;
        }
        if (code === 10) {
          await this.handleScram(message.payload.subarray(4));
          continue;
        }
        throw new Error(`Unsupported PostgreSQL authentication request: ${code}`);
      }
      if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      if (message.type === "Z") return;
    }
  }

  private async handleScram(payload: Buffer) {
    const mechanisms = payload.toString("utf8").split("\0").filter(Boolean);
    if (!mechanisms.includes("SCRAM-SHA-256")) throw new Error(`Unsupported SASL mechanisms: ${mechanisms.join(", ")}`);

    const clientNonce = randomBytes(18).toString("base64url");
    const clientFirstBare = `n=*,r=${clientNonce}`;
    this.sendSaslInitial("SCRAM-SHA-256", `n,,${clientFirstBare}`);

    const serverFirstMessage = await this.readMessage();
    if (serverFirstMessage.type === "E") throw new Error(parseErrorResponse(serverFirstMessage.payload));
    if (serverFirstMessage.type !== "R" || serverFirstMessage.payload.readInt32BE(0) !== 11) {
      throw new Error("Unexpected PostgreSQL SASL first response.");
    }

    const serverFirst = serverFirstMessage.payload.subarray(4).toString("utf8");
    const attributes = parseScramAttributes(serverFirst);
    const serverNonce = attributes.r;
    const salt = attributes.s ? Buffer.from(attributes.s, "base64") : null;
    const iterations = Number(attributes.i);
    if (!serverNonce || !serverNonce.startsWith(clientNonce) || !salt || !Number.isFinite(iterations)) {
      throw new Error("Invalid PostgreSQL SCRAM challenge.");
    }

    const clientFinalWithoutProof = `c=biws,r=${serverNonce}`;
    const authMessage = `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(`${clientFinalWithoutProof},p=${xorBuffers(clientKey, signature).toString("base64")}`);
  }

  private sendPassword(password: string) {
    this.sendMessage("p", Buffer.from(`${password}\0`, "utf8"));
  }

  private sendSaslInitial(mechanism: string, response: string) {
    const mechanismBuffer = Buffer.from(`${mechanism}\0`, "utf8");
    const responseBuffer = Buffer.from(response, "utf8");
    this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer]));
  }

  private sendSaslResponse(response: string) {
    this.sendMessage("p", Buffer.from(response, "utf8"));
  }

  private sendMessage(type: string, payload: Buffer) {
    this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload]));
  }

  private sendRaw(payload: Buffer) {
    if (!this.socket || this.socket.destroyed) throw new Error("PostgreSQL socket is not connected.");
    this.socket.write(payload);
  }

  private async readMessage(): Promise<PgMessage> {
    await this.waitForBytes(5);
    const type = this.buffer.subarray(0, 1).toString("utf8");
    const length = this.buffer.readInt32BE(1);
    const totalLength = length + 1;
    await this.waitForBytes(totalLength);
    const payload = this.buffer.subarray(5, totalLength);
    this.buffer = this.buffer.subarray(totalLength);
    return { type, payload };
  }

  private async waitForBytes(size: number) {
    while (this.buffer.length < size) {
      await new Promise<void>((resolve, reject) => {
        const socket = this.socket;
        if (!socket) {
          reject(new Error("PostgreSQL socket is not connected."));
          return;
        }
        const cleanup = () => {
          socket.off("error", onError);
          socket.off("close", onClose);
          const index = this.waiters.indexOf(onData);
          if (index >= 0) this.waiters.splice(index, 1);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onClose = () => {
          cleanup();
          reject(new Error("PostgreSQL socket closed before response was complete."));
        };
        const onData = () => {
          cleanup();
          resolve();
        };
        this.waiters.push(onData);
        socket.once("error", onError);
        socket.once("close", onClose);
      });
    }
  }

  private get user() {
    return decodeURIComponent(this.url.username || "postgres");
  }

  private get password() {
    return decodeURIComponent(this.url.password || "");
  }

  private get database() {
    return decodeURIComponent(this.url.pathname.replace(/^\//, "") || "postgres");
  }
}

function int32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function parseRowDescription(payload: Buffer) {
  const fieldCount = payload.readInt16BE(0);
  const names: string[] = [];
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const end = payload.indexOf(0, offset);
    names.push(payload.subarray(offset, end).toString("utf8"));
    offset = end + 19;
  }
  return names;
}

function parseDataRow<T extends Row>(payload: Buffer, fields: string[]) {
  const row: Row = {};
  const fieldCount = payload.readInt16BE(0);
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const length = payload.readInt32BE(offset);
    offset += 4;
    if (length === -1) {
      row[fields[index] ?? `column_${index}`] = null;
      continue;
    }
    row[fields[index] ?? `column_${index}`] = payload.subarray(offset, offset + length).toString("utf8");
    offset += length;
  }
  return row as T;
}

function parseErrorResponse(payload: Buffer) {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length && payload[offset] !== 0) {
    const code = String.fromCharCode(payload[offset]);
    offset += 1;
    const end = payload.indexOf(0, offset);
    fields[code] = payload.subarray(offset, end).toString("utf8");
    offset = end + 1;
  }
  return fields.M || "PostgreSQL returned an error.";
}

function parseScramAttributes(value: string) {
  const attributes: Record<string, string> = {};
  for (const part of value.split(",")) attributes[part.slice(0, 1)] = part.slice(2);
  return attributes;
}

function buildMd5Password(user: string, password: string, salt: Buffer) {
  const inner = createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function xorBuffers(left: Buffer, right: Buffer) {
  const result = Buffer.alloc(Math.min(left.length, right.length));
  for (let index = 0; index < result.length; index += 1) result[index] = left[index] ^ right[index];
  return result;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
