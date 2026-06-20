import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";
import {
  getExpectedRunItems,
  getMeasurementProfile,
  getMeasurementProfileIds,
  isMeasurementProfileId,
  type MeasurementProfile,
  type MeasurementProfileId
} from "../lib/recora/measurement-profiles";
import {
  assertRecoraDbWriteAllowed,
  createRecoraDbWriteGuardCliOptions,
  parseRecoraDbWriteGuardArg
} from "./recora-db-write-guard";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = "recora-kenzai-q2";
const DEFAULT_PROMPT_LIMIT = 1;
const DEFAULT_SEARCH_MODE: SearchModeOption = "both";
const OPENAI_MODEL = process.env.RECORA_OPENAI_MODEL?.trim() || "gpt-4.1-mini";
const PROVIDER = "openai";
const AI_MODEL_PROVIDER = "OpenAI";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
type Row = Record<string, string | null>;
type SearchMode = "no-search" | "web-search";
type SearchModeOption = SearchMode | "both";
type RunStatus = "completed" | "failed";
type RunItemStatus = "completed" | "failed" | "skipped";
type CitationStatus = "not_requested" | "unavailable" | "available" | "error";
type RecommendationStatus = "strongly_recommended" | "recommended" | "listed" | "neutral" | "absent" | "discouraged";
type Sentiment = "positive" | "neutral" | "negative" | "unclear";
type ExtractionConfidence = "low" | "medium" | "high";
type SourceType = "owned" | "competitor" | "media" | "review" | "technical" | "unknown";
type BrandRelatedness = "target_brand" | "competitor" | "general" | "unknown";

type CliOptions = {
  projectSlug: string;
  promptLimit: number;
  promptLimitProvided: boolean;
  profileId: MeasurementProfileId | null;
  searchMode: SearchModeOption;
  allowNonLocalDb: boolean;
  confirmNonLocalDbWrite: string | null;
};

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  language: string;
  region: string;
};

type PromptRow = {
  id: string;
  text: string;
  persona_id: string | null;
  topic_id: string;
};

type PersonaRow = {
  id: string;
  name: string;
};

type BrandRow = {
  id: string;
  name: string;
  reading: string | null;
  brand_type: "primary" | "competitor";
  domain: string | null;
  aliases: string;
};

type AiModelRow = {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
};

type SourceDomainRow = {
  id: string;
  domain: string;
};

type RunItemRow = {
  id: string;
};

type CitationCandidate = {
  url: string;
  canonicalUrl: string;
  domain: string;
  title: string | null;
  startIndex: number | null;
  endIndex: number | null;
  sourceType: SourceType;
  occurrenceCount: number;
  raw: JsonValue;
};

type BrandAnalysis = {
  brand: BrandRow;
  mentioned: boolean;
  mentionCount: number;
  firstMentionIndex: number | null;
  estimatedAnswerRank: number | null;
  matchedAlias: string | null;
  recommendationStatus: RecommendationStatus;
  sentiment: Sentiment;
  evidenceSnippet: string | null;
  confidence: ExtractionConfidence;
};

type MeasurementResponse = {
  responseId: string;
  responseRecord: JsonValue;
  responseRecordObject: Record<string, JsonValue | undefined>;
  outputText: string;
  citations: CitationCandidate[];
  citationStatus: CitationStatus;
  modelReturned: string | null;
  usage: JsonValue | null;
  measuredAt: string;
  responseTimeMs: number;
};

type ItemResult = {
  promptId: string;
  searchMode: SearchMode;
  runItemId: string | null;
  responseId: string | null;
  status: "inserted" | "skipped_duplicate" | "failed";
  aiConversations: number;
  brandMentions: number;
  citations: number;
  sourceDomains: number;
  errorMessage?: string;
};

type Totals = {
  runItemsCreated: number;
  aiConversationsInserted: number;
  brandMentionsInserted: number;
  citationsInserted: number;
  sourceDomainsUpserted: number;
  failedItems: number;
  skippedDuplicates: number;
};

type PgMessage = { type: string; payload: Buffer };

async function main() {
  await loadEnvLocal();

  const options = parseArgs(process.argv.slice(2));
  const measurementProfile = options.profileId ? getMeasurementProfile(options.profileId) : null;

  const databaseUrl = process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  assertRecoraDbWriteAllowed({
    databaseUrl,
    operation: "run-openai-measurement",
    projectSlug: options.projectSlug,
    isWrite: true,
    allowNonLocalDb: options.allowNonLocalDb,
    confirmNonLocalDbWrite: options.confirmNonLocalDbWrite
  });

  const db = new LocalPostgresClient(databaseUrl);
  const startedAt = new Date().toISOString();

  await db.connect();
  try {
    const beforeCounts = await getGuardrailCounts(db);
    const project = await getProject(db, options.projectSlug);
    const prompts = measurementProfile
      ? await getPromptsByProfile(db, project.id, measurementProfile)
      : await getPrompts(db, project.id, options.promptLimit);
    const brands = await getBrands(db, project.id);
    const searchModes = expandSearchMode(options.searchMode);
    const selectedPromptIds = prompts.map((prompt) => prompt.id);
    const expectedRunItems = getExpectedRunItems({ promptCount: prompts.length }, options.searchMode);

    validateMeasurementInput(prompts, brands);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing. Add it to .env.local before running this script.");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const run = await insertMeasurementRun(
      db,
      project,
      startedAt,
      buildMeasurementRunMetadata({
        profile: measurementProfile,
        selectedPromptIds,
        promptCount: prompts.length,
        expectedRunItems,
        searchMode: options.searchMode
      })
    );
    const results: ItemResult[] = [];

    for (const prompt of prompts) {
      const persona = await getPersonaForPrompt(db, project.id, prompt);
      for (const searchMode of searchModes) {
        results.push(await runMeasurementItem({ db, openai, project, prompt, persona, brands, runId: run.id, searchMode }));
      }
    }

    const totals = summarizeResults(results);
    const runStatus: RunStatus = totals.aiConversationsInserted > 0 || totals.skippedDuplicates > 0 ? "completed" : "failed";
    const completedAt = new Date().toISOString();
    await updateMeasurementRun(db, run.id, runStatus, completedAt);
    const afterCounts = await getGuardrailCounts(db);

    printSummary({
      options,
      projectSlug: project.slug,
      measurementRunId: run.id,
      startedAt,
      completedAt,
      runStatus,
      results,
      totals,
      profile: measurementProfile,
      selectedPromptIds,
      expectedRunItems,
      guardrails: buildGuardrails(beforeCounts, afterCounts),
      dashboardUrls: [
        `/dashboard/reports/${project.slug}/conversations`,
        `/dashboard/reports/${project.slug}/sources`
      ]
    });
  } finally {
    db.end();
  }
}

async function runMeasurementItem(input: {
  db: LocalPostgresClient;
  openai: OpenAI;
  project: ProjectRow;
  prompt: PromptRow;
  persona: PersonaRow;
  brands: BrandRow[];
  runId: string;
  searchMode: SearchMode;
}): Promise<ItemResult> {
  const { db, openai, project, prompt, persona, brands, runId, searchMode } = input;
  const model = await getOrCreateOpenAiModel(db, searchMode);
  const runItem = await insertRunItem(db, runId, prompt.id, persona.id, model.id);

  try {
    const measured = await callOpenAi(openai, prompt.text, searchMode, brands);

    await db.query("begin");
    try {
      const existingConversation = await findExistingConversation(db, measured.responseId);
      if (existingConversation) {
        await updateRunItem(db, runItem.id, "skipped", measured.measuredAt, measured.responseTimeMs, "Duplicate provider response_id skipped.");
        await db.query("commit");
        return {
          promptId: prompt.id,
          searchMode,
          runItemId: runItem.id,
          responseId: measured.responseId,
          status: "skipped_duplicate",
          aiConversations: 0,
          brandMentions: 0,
          citations: 0,
          sourceDomains: 0
        };
      }

      const conversation = await insertConversation({
        db,
        runItemId: runItem.id,
        prompt,
        searchMode,
        measured
      });
      const brandAnalyses = analyzeBrands(brands, measured.outputText);
      const brandMentions = await insertBrandMentions(db, conversation.id, brandAnalyses);
      const citationResult =
        searchMode === "web-search"
          ? await insertCitations(db, conversation.id, project.id, brands, measured.outputText, measured.citations)
          : { citationsCreated: 0, sourceDomainsUpserted: 0 };

      await updateRunItem(db, runItem.id, "completed", measured.measuredAt, measured.responseTimeMs, null);
      await db.query("commit");

      return {
        promptId: prompt.id,
        searchMode,
        runItemId: runItem.id,
        responseId: measured.responseId,
        status: "inserted",
        aiConversations: 1,
        brandMentions,
        citations: citationResult.citationsCreated,
        sourceDomains: citationResult.sourceDomainsUpserted
      };
    } catch (error) {
      await db.query("rollback");
      throw error;
    }
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    await updateRunItem(db, runItem.id, "failed", new Date().toISOString(), null, message);
    return {
      promptId: prompt.id,
      searchMode,
      runItemId: runItem.id,
      responseId: null,
      status: "failed",
      aiConversations: 0,
      brandMentions: 0,
      citations: 0,
      sourceDomains: 0,
      errorMessage: message
    };
  }
}

async function callOpenAi(openai: OpenAI, promptText: string, searchMode: SearchMode, brands: BrandRow[]): Promise<MeasurementResponse> {
  const request = {
    model: OPENAI_MODEL,
    input: promptText,
    store: false,
    ...(searchMode === "web-search"
      ? {
          tools: [{ type: "web_search" as const }],
          include: ["web_search_call.action.sources" as const]
        }
      : {})
  };

  const started = Date.now();
  const response = await openai.responses.create(request);
  const measuredAt = new Date().toISOString();
  const responseTimeMs = Date.now() - started;
  const responseRecord = toJsonValue(response);
  const responseRecordObject = isRecord(responseRecord) ? responseRecord : {};
  const outputText = extractOutputText(responseRecordObject);
  const citations = extractCitations(responseRecordObject, brands);
  const responseId = readString(responseRecordObject, "id") || `${searchMode}-${createHashValue(`${promptText}\n${outputText}\n${measuredAt}`)}`;
  const usage = isJsonValue(responseRecordObject.usage) ? responseRecordObject.usage : null;

  return {
    responseId,
    responseRecord,
    responseRecordObject,
    outputText,
    citations,
    citationStatus: getCitationStatus(searchMode, citations),
    modelReturned: readString(responseRecordObject, "model"),
    usage,
    measuredAt,
    responseTimeMs
  };
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

async function getPrompts(db: LocalPostgresClient, projectId: string, limit: number): Promise<PromptRow[]> {
  return db.query<PromptRow>(`
    select id::text as id, text, persona_id::text as persona_id, topic_id::text as topic_id
    from public.prompts
    where project_id = ${uuid(projectId)}
      and is_active = true
    order by
      case priority when 'high' then 1 when 'medium' then 2 else 3 end,
      created_at asc
    limit ${num(Math.max(1, Math.floor(limit)))}
  `);
}

async function getPromptsByProfile(
  db: LocalPostgresClient,
  projectId: string,
  profile: MeasurementProfile
): Promise<PromptRow[]> {
  const rows = await db.query<PromptRow>(`
    select id::text as id, text, persona_id::text as persona_id, topic_id::text as topic_id
    from public.prompts
    where project_id = ${uuid(projectId)}
      and is_active = true
      and id in (${profile.promptIds.map((promptId) => uuid(promptId)).join(", ")})
  `);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const missingPromptIds = profile.promptIds.filter((promptId) => !rowsById.has(promptId));

  if (missingPromptIds.length > 0) {
    throw new Error(
      `Measurement profile ${profile.id} has missing or inactive prompts: ${missingPromptIds.join(", ")}`
    );
  }

  return profile.promptIds.map((promptId) => rowsById.get(promptId)!);
}

async function getPersonaForPrompt(db: LocalPostgresClient, projectId: string, prompt: PromptRow): Promise<PersonaRow> {
  if (prompt.persona_id) {
    const rows = await db.query<PersonaRow>(`
      select id::text as id, name
      from public.personas
      where id = ${uuid(prompt.persona_id)}
        and is_active = true
      limit 1
    `);
    if (rows[0]) return rows[0];
  }

  const rows = await db.query<PersonaRow>(`
    select id::text as id, name
    from public.personas
    where project_id = ${uuid(projectId)}
      and is_active = true
    order by created_at asc
    limit 1
  `);
  if (!rows[0]) throw new Error("No active persona found for the target project.");
  return rows[0];
}

async function getBrands(db: LocalPostgresClient, projectId: string): Promise<BrandRow[]> {
  return db.query<BrandRow>(`
    select id::text as id, name, reading, brand_type, domain, aliases::text as aliases
    from public.brands
    where project_id = ${uuid(projectId)}
      and is_active = true
    order by brand_type asc, name asc
  `);
}

async function getOrCreateOpenAiModel(db: LocalPostgresClient, searchMode: SearchMode): Promise<AiModelRow> {
  const modelName = getAiModelRowName(searchMode);
  const displayName = searchMode === "web-search" ? `${OPENAI_MODEL} (web search)` : OPENAI_MODEL;
  const rows = await db.query<AiModelRow>(`
    insert into public.ai_models (provider, model_name, display_name, is_active)
    values (${lit(AI_MODEL_PROVIDER)}, ${lit(modelName)}, ${lit(displayName)}, true)
    on conflict (provider, model_name)
    do update set display_name = excluded.display_name, is_active = true
    returning id::text as id, provider, model_name, display_name
  `);
  return single(rows, `get or create OpenAI model ${modelName}`);
}

async function insertMeasurementRun(
  db: LocalPostgresClient,
  project: ProjectRow,
  startedAt: string,
  metadata: JsonValue
) {
  const date = toDateOnly(startedAt);
  const rows = await db.query<{ id: string }>(`
    insert into public.measurement_runs (
      project_id, status, period_start, period_end, region, language, started_at, metadata
    )
    values (
      ${uuid(project.id)},
      'running',
      ${lit(date)}::date,
      ${lit(date)}::date,
      ${lit(project.region || "JP")},
      ${lit(project.language || "ja")},
      ${ts(startedAt)},
      ${jsonb(metadata)}
    )
    returning id::text as id
  `);
  return single(rows, "insert measurement run");
}

async function updateMeasurementRun(db: LocalPostgresClient, runId: string, status: RunStatus, completedAt: string) {
  await db.query(`
    update public.measurement_runs
    set status = ${lit(status)}, completed_at = ${ts(completedAt)}
    where id = ${uuid(runId)}
  `);
}

async function insertRunItem(db: LocalPostgresClient, runId: string, promptId: string, personaId: string, modelId: string): Promise<RunItemRow> {
  const rows = await db.query<RunItemRow>(`
    insert into public.run_items (run_id, prompt_id, persona_id, model_id, status)
    values (${uuid(runId)}, ${uuid(promptId)}, ${uuid(personaId)}, ${uuid(modelId)}, 'queued')
    returning id::text as id
  `);
  return single(rows, "insert run item");
}

async function updateRunItem(
  db: LocalPostgresClient,
  runItemId: string,
  status: RunItemStatus,
  capturedAt: string,
  latencyMs: number | null,
  errorMessage: string | null
) {
  await db.query(`
    update public.run_items
    set status = ${lit(status)},
        captured_at = ${ts(capturedAt)},
        latency_ms = ${nullableNum(latencyMs)},
        error_message = ${nullable(errorMessage)}
    where id = ${uuid(runItemId)}
  `);
}

async function findExistingConversation(db: LocalPostgresClient, responseId: string) {
  const rows = await db.query<{ id: string }>(`
    select id::text as id
    from public.ai_conversations
    where provider = ${lit(PROVIDER)}
      and response_id = ${lit(responseId)}
    limit 1
  `);
  return rows[0] ?? null;
}

async function insertConversation(input: {
  db: LocalPostgresClient;
  runItemId: string;
  prompt: PromptRow;
  searchMode: SearchMode;
  measured: MeasurementResponse;
}) {
  const { db, runItemId, prompt, searchMode, measured } = input;
  const rawAnswer = measured.outputText || "";
  const modelReturned = measured.modelReturned || OPENAI_MODEL;
  const rows = await db.query<{ id: string }>(`
    insert into public.ai_conversations (
      run_item_id,
      raw_answer,
      answer_summary,
      answer_hash,
      prompt_text_snapshot,
      model_snapshot,
      captured_at,
      provider,
      model_requested,
      model_returned,
      response_id,
      raw_response,
      usage,
      web_search_enabled,
      citation_status,
      measured_at,
      response_time_ms
    )
    values (
      ${uuid(runItemId)},
      ${lit(rawAnswer)},
      ${nullable(buildAnswerSummary(rawAnswer))},
      ${lit(createHashValue(rawAnswer))},
      ${lit(prompt.text)},
      ${lit(modelReturned)},
      ${ts(measured.measuredAt)},
      ${lit(PROVIDER)},
      ${lit(OPENAI_MODEL)},
      ${lit(modelReturned)},
      ${lit(measured.responseId)},
      ${jsonb(measured.responseRecord)},
      ${jsonb(measured.usage)},
      ${bool(searchMode === "web-search")},
      ${lit(measured.citationStatus)},
      ${ts(measured.measuredAt)},
      ${num(Math.max(0, Math.round(measured.responseTimeMs)))}
    )
    returning id::text as id
  `);
  return single(rows, "insert AI conversation");
}

async function insertBrandMentions(db: LocalPostgresClient, conversationId: string, analyses: BrandAnalysis[]) {
  for (const analysis of analyses) {
    await db.query(`
      insert into public.brand_mentions (
        conversation_id,
        brand_id,
        mentioned,
        position,
        recommendation_status,
        sentiment,
        answer_score,
        mention_text,
        mention_count,
        first_mention_index,
        evidence_snippet,
        confidence,
        matched_alias
      )
      values (
        ${uuid(conversationId)},
        ${uuid(analysis.brand.id)},
        ${bool(analysis.mentioned)},
        ${nullableNum(analysis.estimatedAnswerRank)},
        ${lit(analysis.recommendationStatus)},
        ${lit(analysis.sentiment)},
        ${num(scoreRecommendation(analysis.recommendationStatus, analysis.mentioned))},
        ${nullable(analysis.evidenceSnippet)},
        ${num(analysis.mentionCount)},
        ${nullableNum(analysis.firstMentionIndex)},
        ${nullable(analysis.evidenceSnippet)},
        ${lit(analysis.confidence)},
        ${nullable(analysis.matchedAlias)}
      )
    `);
  }
  return analyses.length;
}

async function insertCitations(
  db: LocalPostgresClient,
  conversationId: string,
  projectId: string,
  brands: BrandRow[],
  outputText: string,
  citations: CitationCandidate[]
) {
  let citationsCreated = 0;
  let sourceDomainsUpserted = 0;

  for (const citation of citations) {
    const sourceDomain = await getOrCreateSourceDomain(db, projectId, brands, citation.domain, citation.sourceType);
    sourceDomainsUpserted += sourceDomain.created ? 1 : 0;
    const relatedBrand = findBrandByDomain(brands, citation.domain);

    await db.query(`
      insert into public.citations (
        conversation_id,
        brand_id,
        source_domain_id,
        url,
        domain,
        title,
        source_type,
        supports_claim,
        occurrence_count,
        canonical_url,
        start_index,
        end_index,
        cited_text,
        raw_citation,
        brand_related
      )
      values (
        ${uuid(conversationId)},
        ${nullableUuid(relatedBrand?.id ?? null)},
        ${uuid(sourceDomain.row.id)},
        ${lit(citation.url)},
        ${lit(citation.domain)},
        ${nullable(citation.title)},
        ${lit(citation.sourceType)},
        null,
        ${num(citation.occurrenceCount)},
        ${lit(citation.canonicalUrl)},
        ${nullableNum(citation.startIndex)},
        ${nullableNum(citation.endIndex)},
        ${nullable(getCitedText(outputText, citation.startIndex, citation.endIndex))},
        ${jsonb(citation.raw)},
        ${lit(classifyBrandRelatedness(relatedBrand))}
      )
    `);
    citationsCreated += 1;
  }

  return { citationsCreated, sourceDomainsUpserted };
}

async function getOrCreateSourceDomain(
  db: LocalPostgresClient,
  projectId: string,
  brands: BrandRow[],
  domain: string,
  sourceType: SourceType
): Promise<{ row: SourceDomainRow; created: boolean }> {
  const existing = await findSourceDomain(db, projectId, domain);
  if (existing) return { row: existing, created: false };

  const ownerBrand = findBrandByDomain(brands, domain);
  const rows = await db.query<SourceDomainRow>(`
    insert into public.source_domains (
      project_id,
      domain,
      source_type,
      owner_brand_id,
      trust_label
    )
    values (
      ${uuid(projectId)},
      ${lit(domain)},
      ${lit(sourceType)},
      ${nullableUuid(ownerBrand?.id ?? null)},
      'OpenAI web_search observation'
    )
    on conflict (project_id, domain)
    do update set
      source_type = case
        when public.source_domains.source_type = 'unknown' then excluded.source_type
        else public.source_domains.source_type
      end,
      owner_brand_id = coalesce(public.source_domains.owner_brand_id, excluded.owner_brand_id),
      trust_label = coalesce(public.source_domains.trust_label, excluded.trust_label)
    returning id::text as id, domain
  `);
  return { row: single(rows, `upsert source domain ${domain}`), created: true };
}

async function findSourceDomain(db: LocalPostgresClient, projectId: string, domain: string) {
  const rows = await db.query<SourceDomainRow>(`
    select id::text as id, domain
    from public.source_domains
    where project_id = ${uuid(projectId)}
      and domain = ${lit(domain)}
    limit 1
  `);
  return rows[0] ?? null;
}

async function getGuardrailCounts(db: LocalPostgresClient) {
  const rows = await db.query<{ metric_snapshots: string; recommendations: string }>(`
    select
      (select count(*)::text from public.metric_snapshots) as metric_snapshots,
      (select count(*)::text from public.recommendations) as recommendations
  `);
  const row = single(rows, "read guardrail counts");
  return {
    metricSnapshots: Number(row.metric_snapshots),
    recommendations: Number(row.recommendations)
  };
}

function analyzeBrands(brands: BrandRow[], text: string): BrandAnalysis[] {
  const baseAnalyses = brands.map((brand) => analyzeBrand(brand, text));
  const ranked = baseAnalyses
    .filter((analysis) => analysis.firstMentionIndex !== null)
    .sort((left, right) => Number(left.firstMentionIndex) - Number(right.firstMentionIndex));
  const rankByBrandId = new Map<string, number>();
  ranked.forEach((analysis, index) => rankByBrandId.set(analysis.brand.id, index + 1));

  return baseAnalyses.map((analysis) => ({
    ...analysis,
    estimatedAnswerRank: rankByBrandId.get(analysis.brand.id) ?? null
  }));
}

function analyzeBrand(brand: BrandRow, text: string): BrandAnalysis {
  const aliases = getBrandAliases(brand);
  const normalizedText = normalizeForMatching(text);
  let firstMentionIndex: number | null = null;
  let matchedAlias: string | null = null;
  let mentionCount = 0;

  for (const alias of aliases) {
    const normalizedAlias = normalizeForMatching(alias);
    const aliasFirstIndex = normalizedText.indexOf(normalizedAlias);
    const aliasCount = countOccurrences(normalizedText, normalizedAlias);
    mentionCount += aliasCount;
    if (aliasFirstIndex >= 0 && (firstMentionIndex === null || aliasFirstIndex < firstMentionIndex)) {
      firstMentionIndex = aliasFirstIndex;
      matchedAlias = alias;
    }
  }

  const mentioned = mentionCount > 0;
  const evidenceSnippet = mentioned ? buildSnippet(text, firstMentionIndex ?? 0) : "Target brand or competitor alias was not detected in this answer.";
  const recommendationStatus = classifyRecommendationStatus(mentioned, evidenceSnippet, text);

  return {
    brand,
    mentioned,
    mentionCount,
    firstMentionIndex,
    estimatedAnswerRank: null,
    matchedAlias,
    recommendationStatus,
    sentiment: classifySentiment(recommendationStatus, evidenceSnippet),
    evidenceSnippet,
    confidence: mentioned ? "high" : "medium"
  };
}

function getBrandAliases(brand: BrandRow) {
  const aliases = new Set<string>();
  aliases.add(brand.name);
  if (brand.reading) aliases.add(brand.reading);
  for (const alias of parseJsonArray(brand.aliases)) aliases.add(alias);
  return Array.from(aliases)
    .map((alias) => alias.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
}

function classifyRecommendationStatus(mentioned: boolean, snippet: string | null, fullText: string): RecommendationStatus {
  if (!mentioned) return "absent";

  const text = normalizeForMatching(`${snippet ?? ""}\n${fullText}`);
  if (containsAny(text, ["not recommended", "avoid", "poor fit", "weakness", "risk", "注意", "不向き", "避け"])) {
    return "discouraged";
  }
  if (containsAny(text, ["best", "top choice", "most suitable", "strongly recommend", "最適", "第一候補", "最もおすすめ"])) {
    return "strongly_recommended";
  }
  if (containsAny(text, ["recommend", "suitable", "good fit", "candidate", "おすすめ", "適して", "候補"])) {
    return "recommended";
  }
  if (containsAny(text, ["compare", "comparison", "versus", "比較", "一方"])) {
    return "listed";
  }
  return "neutral";
}

function classifySentiment(status: RecommendationStatus, snippet: string | null): Sentiment {
  if (status === "absent") return "unclear";
  if (status === "discouraged") return "negative";
  if (status === "strongly_recommended" || status === "recommended") return "positive";

  const text = normalizeForMatching(snippet ?? "");
  if (containsAny(text, ["suitable", "good", "strong", "recommended", "適して", "強み", "評価"])) return "positive";
  if (containsAny(text, ["risk", "weak", "issue", "注意", "課題", "弱い"])) return "negative";
  return "neutral";
}

function extractOutputText(response: Record<string, JsonValue | undefined>) {
  if (typeof response.output_text === "string") return response.output_text;

  const output = Array.isArray(response.output) ? response.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item)) continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const contentItem of content) {
      if (isRecord(contentItem) && typeof contentItem.text === "string") parts.push(contentItem.text);
    }
  }

  return parts.join("\n\n");
}

function extractCitations(response: Record<string, JsonValue | undefined>, brands: BrandRow[]): CitationCandidate[] {
  const candidates: CitationCandidate[] = [];

  walkJson(response, (node) => {
    if (!isRecord(node)) return;

    const type = readString(node, "type");
    if (type === "url_citation") {
      const nested = isRecord(node.url_citation) ? node.url_citation : node;
      const url = readString(nested, "url");
      if (url) candidates.push(buildCitationCandidate(url, nested, type, brands));
      return;
    }

    const url = readString(node, "url");
    if (url && (readString(node, "title") || readString(node, "source") || readString(node, "snippet"))) {
      candidates.push(buildCitationCandidate(url, node, "web_search_source", brands));
    }
  });

  const grouped = new Map<string, CitationCandidate>();
  for (const candidate of candidates) {
    const existing = grouped.get(candidate.canonicalUrl);
    if (!existing) {
      grouped.set(candidate.canonicalUrl, candidate);
      continue;
    }

    grouped.set(candidate.canonicalUrl, {
      ...existing,
      occurrenceCount: existing.occurrenceCount + 1,
      raw: {
        type: "deduplicated_citation",
        occurrence_count: existing.occurrenceCount + 1,
        first: existing.raw,
        latest: candidate.raw
      }
    });
  }

  return Array.from(grouped.values());
}

function buildCitationCandidate(
  url: string,
  rawNode: Record<string, JsonValue | undefined>,
  sourceKind: string,
  brands: BrandRow[]
): CitationCandidate {
  const canonicalUrl = canonicalizeUrl(url);
  const domain = safeHostname(canonicalUrl || url);

  return {
    url,
    canonicalUrl,
    domain,
    title: readString(rawNode, "title"),
    startIndex: readNumber(rawNode, "start_index"),
    endIndex: readNumber(rawNode, "end_index"),
    sourceType: classifySourceType(domain, url, brands),
    occurrenceCount: 1,
    raw: {
      type: "openai_citation",
      source_kind: sourceKind,
      url,
      canonical_url: canonicalUrl,
      title: readString(rawNode, "title"),
      start_index: readNumber(rawNode, "start_index"),
      end_index: readNumber(rawNode, "end_index"),
      raw: rawNode
    }
  };
}

function classifySourceType(domain: string, url: string, brands: BrandRow[]): SourceType {
  const relatedBrand = findBrandByDomain(brands, domain);
  if (relatedBrand?.brand_type === "primary") return "owned";
  if (relatedBrand?.brand_type === "competitor") return "competitor";

  const value = normalizeForMatching(`${domain} ${url}`);
  if (containsAny(value, ["review", "ranking", "compare", "comparison", "口コミ", "比較", "ランキング"])) return "review";
  if (containsAny(value, ["news", "media", "magazine", "journal", "blog", "記事"])) return "media";
  if (containsAny(value, ["docs", "documentation", "spec", "schema", "technical", "施工", "仕様"])) return "technical";
  return "unknown";
}

function getCitationStatus(searchMode: SearchMode, citations: CitationCandidate[]): CitationStatus {
  if (searchMode === "no-search") return "not_requested";
  return citations.length > 0 ? "available" : "unavailable";
}

function findBrandByDomain(brands: BrandRow[], domain: string) {
  const normalizedDomain = normalizeDomain(domain);
  return brands.find((brand) => brand.domain && normalizeDomain(brand.domain) === normalizedDomain) ?? null;
}

function classifyBrandRelatedness(brand: BrandRow | null): BrandRelatedness {
  if (!brand) return "general";
  return brand.brand_type === "primary" ? "target_brand" : "competitor";
}

function validateMeasurementInput(prompts: PromptRow[], brands: BrandRow[]) {
  if (prompts.length === 0) throw new Error("No active prompts found for the target project.");
  if (brands.length === 0) throw new Error("No active brands found for the target project.");
  if (!brands.some((brand) => brand.brand_type === "primary")) throw new Error("No primary brand found for the target project.");
}

function buildMeasurementRunMetadata(input: {
  profile: MeasurementProfile | null;
  selectedPromptIds: string[];
  promptCount: number;
  expectedRunItems: number;
  searchMode: SearchModeOption;
}) {
  const profileMetadata = input.profile
    ? {
        measurement_profile_id: input.profile.id,
        measurement_profile_label: input.profile.label
      }
    : {};

  return toJsonValue({
    run_kind: "measurement",
    data_source: "openai_measurement",
    selected_prompt_ids: input.selectedPromptIds,
    prompt_count: input.promptCount,
    expected_run_items: input.expectedRunItems,
    search_mode: input.searchMode,
    ...profileMetadata
  });
}

function parseArgs(args: string[]): CliOptions {
  const guardOptions = createRecoraDbWriteGuardCliOptions();
  const options: CliOptions = {
    projectSlug: DEFAULT_PROJECT_SLUG,
    promptLimit: DEFAULT_PROMPT_LIMIT,
    promptLimitProvided: false,
    profileId: null,
    searchMode: DEFAULT_SEARCH_MODE,
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
    if (arg === "--prompt-limit" && next) {
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--prompt-limit must be a positive integer.");
      options.promptLimit = parsed;
      options.promptLimitProvided = true;
      index += 1;
      continue;
    }
    if (arg === "--profile" && next) {
      if (!isMeasurementProfileId(next)) {
        throw new Error(`--profile must be one of: ${getMeasurementProfileIds().join(", ")}.`);
      }
      options.profileId = next;
      index += 1;
      continue;
    }
    if (arg === "--search-mode" && next) {
      if (!isSearchModeOption(next)) throw new Error("--search-mode must be no-search, web-search, or both.");
      options.searchMode = next;
      index += 1;
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (options.profileId && options.promptLimitProvided) {
    throw new Error("--profile and --prompt-limit cannot be used together.");
  }

  return options;
}

function isSearchModeOption(value: string): value is SearchModeOption {
  return value === "no-search" || value === "web-search" || value === "both";
}

function expandSearchMode(value: SearchModeOption): SearchMode[] {
  return value === "both" ? ["no-search", "web-search"] : [value];
}

function getAiModelRowName(searchMode: SearchMode) {
  return searchMode === "web-search" ? `${OPENAI_MODEL}:web-search` : OPENAI_MODEL;
}

function summarizeResults(results: ItemResult[]): Totals {
  return results.reduce<Totals>(
    (totals, result) => ({
      runItemsCreated: totals.runItemsCreated + (result.runItemId ? 1 : 0),
      aiConversationsInserted: totals.aiConversationsInserted + result.aiConversations,
      brandMentionsInserted: totals.brandMentionsInserted + result.brandMentions,
      citationsInserted: totals.citationsInserted + result.citations,
      sourceDomainsUpserted: totals.sourceDomainsUpserted + result.sourceDomains,
      failedItems: totals.failedItems + (result.status === "failed" ? 1 : 0),
      skippedDuplicates: totals.skippedDuplicates + (result.status === "skipped_duplicate" ? 1 : 0)
    }),
    {
      runItemsCreated: 0,
      aiConversationsInserted: 0,
      brandMentionsInserted: 0,
      citationsInserted: 0,
      sourceDomainsUpserted: 0,
      failedItems: 0,
      skippedDuplicates: 0
    }
  );
}

function buildGuardrails(
  beforeCounts: { metricSnapshots: number; recommendations: number },
  afterCounts: { metricSnapshots: number; recommendations: number }
) {
  return {
    metricSnapshotsBefore: beforeCounts.metricSnapshots,
    metricSnapshotsAfter: afterCounts.metricSnapshots,
    metricSnapshotsChanged: beforeCounts.metricSnapshots !== afterCounts.metricSnapshots,
    recommendationsBefore: beforeCounts.recommendations,
    recommendationsAfter: afterCounts.recommendations,
    recommendationsChanged: beforeCounts.recommendations !== afterCounts.recommendations
  };
}

function printSummary(summary: {
  options: CliOptions;
  projectSlug: string;
  measurementRunId: string;
  startedAt: string;
  completedAt: string;
  runStatus: RunStatus;
  results: ItemResult[];
  totals: Totals;
  profile: MeasurementProfile | null;
  selectedPromptIds: string[];
  expectedRunItems: number;
  guardrails: ReturnType<typeof buildGuardrails>;
  dashboardUrls: string[];
}) {
  console.log(
    JSON.stringify(
      {
        projectSlug: summary.projectSlug,
        measurementRunId: summary.measurementRunId,
        openaiModel: OPENAI_MODEL,
        searchMode: summary.options.searchMode,
        promptLimit: summary.profile ? null : summary.options.promptLimit,
        promptCount: summary.selectedPromptIds.length,
        expectedRunItems: summary.expectedRunItems,
        selectedPromptIds: summary.selectedPromptIds,
        profile: summary.profile
          ? {
              id: summary.profile.id,
              label: summary.profile.label,
              promptCount: summary.profile.promptCount,
              defaultSearchMode: summary.profile.defaultSearchMode,
              expectedRunItems: summary.expectedRunItems,
              promptIds: summary.profile.promptIds
            }
          : null,
        startedAt: summary.startedAt,
        completedAt: summary.completedAt,
        runStatus: summary.runStatus,
        runStatusNote:
          "The current schema supports completed/failed/running/draft only. Partial success is represented in item counts.",
        totals: summary.totals,
        items: summary.results,
        guardrails: summary.guardrails,
        dashboardUrls: summary.dashboardUrls,
        note:
          "OpenAI answers are Recora observations, not official AI platform evaluations. metric_snapshots and recommendations are not created by this script."
      },
      null,
      2
    )
  );
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

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function isJsonValue(value: unknown): value is JsonValue {
  return value === null || ["string", "number", "boolean"].includes(typeof value) || Array.isArray(value) || isRecord(value);
}

function normalizeForMatching(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

function countOccurrences(text: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let index = 0;
  while (index <= text.length) {
    const found = text.indexOf(needle, index);
    if (found === -1) break;
    count += 1;
    index = found + needle.length;
  }
  return count;
}

function buildSnippet(text: string, index: number) {
  const start = Math.max(0, index - 120);
  const end = Math.min(text.length, index + 220);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function containsAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(normalizeForMatching(needle)));
}

function canonicalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of Array.from(parsed.searchParams.keys())) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith("utm_") || ["gclid", "fbclid", "msclkid"].includes(normalizedKey)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
}

function getCitedText(text: string, startIndex: number | null, endIndex: number | null) {
  if (typeof startIndex !== "number" || typeof endIndex !== "number") return null;
  if (startIndex < 0 || endIndex < startIndex || startIndex >= text.length) return null;
  return text.slice(startIndex, Math.min(endIndex, text.length));
}

function buildAnswerSummary(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 240) || null;
}

function scoreRecommendation(status: RecommendationStatus, mentioned: boolean) {
  if (status === "strongly_recommended") return 5;
  if (status === "recommended") return 4;
  if (status === "listed") return 2;
  if (status === "neutral") return mentioned ? 1 : 0;
  return 0;
}

function sanitizeErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]")
    .slice(0, 600);
}

function walkJson(value: unknown, visitor: (value: JsonValue) => void) {
  if (!isJsonValue(value)) return;
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, visitor);
    return;
  }
  if (isRecord(value)) {
    for (const item of Object.values(value)) walkJson(item, visitor);
  }
}

function isRecord(value: unknown): value is Record<string, JsonValue | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, JsonValue | undefined>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function readNumber(record: Record<string, JsonValue | undefined>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : null;
}

function single<T>(rows: T[], context: string) {
  if (!rows[0]) throw new Error(`${context}: no row returned`);
  return rows[0];
}

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function nullable(value: string | null | undefined) {
  return value ? lit(value) : "null";
}

function num(value: number) {
  return Number.isFinite(value) ? String(value) : "null";
}

function nullableNum(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "null";
}

function bool(value: boolean) {
  return value ? "true" : "false";
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

function nullableUuid(value: string | null | undefined) {
  return value ? uuid(value) : "null";
}

function ts(value: string | null | undefined) {
  return value ? `${lit(value)}::timestamptz` : "null";
}

function jsonb(value: JsonValue | undefined) {
  return value === undefined || value === null ? "null" : `${lit(JSON.stringify(value))}::jsonb`;
}

function createHashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function toDateOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
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
  console.error(sanitizeErrorMessage(error));
  process.exitCode = 1;
});
