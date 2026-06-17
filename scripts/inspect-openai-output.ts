import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";

const MODEL = "gpt-4.1-mini";
const OUTPUT_DIR = path.join(process.cwd(), "output", "openai-inspection");
const PROMPT =
  "高級ホテルのロビー内装に適した、デザイン性の高いタイルブランドはどこですか？候補を比較しながら、理由も説明してください。";
const TARGET_BRAND = "レコラ建材";
const TARGET_ALIASES = ["レコラ建材", "レコラ", "Recora Kenzai", "Recora"];
const COMPETITORS = ["タイルワークス", "クラフト建材", "マテリアルラボ", "住空間タイル"];

type CitationStatus = "available" | "none_returned" | "not_requested";
type RecommendationStatus =
  | "strongly_recommended"
  | "recommended"
  | "compared"
  | "listed"
  | "neutral_mention"
  | "discouraged"
  | "absent";
type Sentiment = "positive" | "neutral" | "negative" | "unclear";

type CitationCandidate = {
  url: string;
  title: string | null;
  startIndex: number | null;
  endIndex: number | null;
  sourceType: "url_citation" | "web_search_source";
  raw: unknown;
};

type BrandAnalysis = {
  brandName: string;
  mentioned: boolean;
  mentionCount: number;
  firstMentionIndex: number | null;
  estimatedAnswerRank: number | null;
  recommendationStatus: RecommendationStatus;
  sentiment: Sentiment;
  evidenceSnippet: string | null;
};

type InspectionVariant = {
  label: "openai-no-search" | "openai-web-search";
  useWebSearch: boolean;
};

const variants: InspectionVariant[] = [
  { label: "openai-no-search", useWebSearch: false },
  { label: "openai-web-search", useWebSearch: true }
];

async function main() {
  await loadEnvLocal();

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local before running this script.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const variant of variants) {
    await inspectVariant(client, variant);
  }

  console.log(`Saved OpenAI inspection files to ${OUTPUT_DIR}`);
}

async function inspectVariant(client: OpenAI, variant: InspectionVariant) {
  const requestedAt = new Date().toISOString();
  const requestSummary = {
    model: MODEL,
    prompt: PROMPT,
    targetBrand: TARGET_BRAND,
    targetAliases: TARGET_ALIASES,
    competitors: COMPETITORS,
    webSearchEnabled: variant.useWebSearch,
    store: false,
    requestedAt
  };

  const request = {
    model: MODEL,
    input: PROMPT,
    store: false,
    ...(variant.useWebSearch
      ? {
          tools: [{ type: "web_search" as const }],
          include: ["web_search_call.action.sources" as const]
        }
      : {})
  };

  const started = Date.now();
  const response = await client.responses.create(request);
  const completedAt = new Date().toISOString();
  const responseTimeMs = Date.now() - started;
  const responseRecord = response as unknown as Record<string, unknown>;
  const outputText = extractOutputText(responseRecord);
  const citations = extractCitations(responseRecord);
  const analysis = analyzeOutput({
    outputText,
    citations,
    citationStatus: getCitationStatus(variant.useWebSearch, citations),
    responseRecord,
    requestSummary,
    completedAt,
    responseTimeMs
  });

  const rawPayload = {
    note: "API keys and environment variables are intentionally excluded. This is one observation, not a conclusion.",
    request: requestSummary,
    responseTimeMs,
    response
  };

  await writeJson(`${variant.label}-raw.json`, rawPayload);
  await fs.writeFile(path.join(OUTPUT_DIR, `${variant.label}-text.txt`), outputText, "utf8");
  await writeJson(`${variant.label}-analysis.json`, analysis);
  await fs.writeFile(path.join(OUTPUT_DIR, `${variant.label}-summary.md`), buildSummaryMarkdown(variant, analysis), "utf8");
}

function analyzeOutput(input: {
  outputText: string;
  citations: CitationCandidate[];
  citationStatus: CitationStatus;
  responseRecord: Record<string, unknown>;
  requestSummary: Record<string, unknown>;
  completedAt: string;
  responseTimeMs: number;
}) {
  const targetBrand = analyzeBrand(TARGET_BRAND, TARGET_ALIASES, input.outputText);
  const competitorMentions = COMPETITORS.map((competitor) => analyzeBrand(competitor, [competitor], input.outputText));
  const allMentionedBrands = [targetBrand, ...competitorMentions]
    .filter((brand) => brand.firstMentionIndex !== null)
    .sort((a, b) => Number(a.firstMentionIndex) - Number(b.firstMentionIndex));

  const rankMap = new Map<string, number>();
  allMentionedBrands.forEach((brand, index) => rankMap.set(brand.brandName, index + 1));

  const rankedTarget = { ...targetBrand, estimatedAnswerRank: rankMap.get(targetBrand.brandName) ?? null };
  const rankedCompetitors = competitorMentions.map((competitor) => ({
    ...competitor,
    estimatedAnswerRank: rankMap.get(competitor.brandName) ?? null
  }));

  const citedDomains = Array.from(new Set(input.citations.map((citation) => safeHostname(citation.url)).filter(Boolean)));
  const topCompetitor = rankedCompetitors
    .filter((competitor) => competitor.mentioned)
    .sort((a, b) => {
      const rankA = a.estimatedAnswerRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.estimatedAnswerRank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    })[0]?.brandName ?? null;

  return {
    inspectedAt: input.completedAt,
    observationPolicy: "single_observation_only",
    modelRequested: input.requestSummary.model,
    modelReturned: readString(input.responseRecord, "model"),
    responseId: readString(input.responseRecord, "id"),
    status: readString(input.responseRecord, "status"),
    responseTimeMs: input.responseTimeMs,
    prompt: PROMPT,
    targetBrand: TARGET_BRAND,
    targetBrandMentioned: rankedTarget.mentioned,
    competitorMentions: rankedCompetitors,
    mentionCount: rankedTarget.mentionCount,
    firstMentionIndex: rankedTarget.firstMentionIndex,
    estimatedAnswerRank: rankedTarget.estimatedAnswerRank,
    recommendationStatus: rankedTarget.recommendationStatus,
    sentiment: rankedTarget.sentiment,
    evidenceSnippet: rankedTarget.evidenceSnippet,
    citations: input.citations.map((citation) => ({
      url: citation.url,
      domain: safeHostname(citation.url),
      title: citation.title,
      startIndex: citation.startIndex,
      endIndex: citation.endIndex,
      sourceType: citation.sourceType
    })),
    citationStatus: input.citationStatus,
    missingCitationSignal: input.citations.length === 0,
    usage: input.responseRecord.usage ?? null,
    suggestedDbMapping: {
      ai_conversations: {
        provider: "openai",
        model_requested: MODEL,
        model_returned: readString(input.responseRecord, "model"),
        response_id: readString(input.responseRecord, "id"),
        prompt_text: PROMPT,
        output_text: "openai-response-text.txt content",
        raw_response: "openai-response-raw.json response object",
        status: readString(input.responseRecord, "status"),
        usage: input.responseRecord.usage ?? null,
        target_brand_mentioned: rankedTarget.mentioned,
        target_brand_rank: rankedTarget.estimatedAnswerRank,
        recommendation_status: rankedTarget.recommendationStatus,
        citation_status: input.citationStatus,
        measured_at: input.completedAt
      },
      brand_mentions: [rankedTarget, ...rankedCompetitors].map((brand) => ({
        brand_name: brand.brandName,
        brand_type: brand.brandName === TARGET_BRAND ? "target" : "competitor",
        mentioned: brand.mentioned,
        mention_count: brand.mentionCount,
        first_mention_index: brand.firstMentionIndex,
        answer_rank: brand.estimatedAnswerRank,
        recommendation_status: brand.recommendationStatus,
        sentiment: brand.sentiment,
        evidence_snippet: brand.evidenceSnippet,
        extraction_method: "deterministic_text_parser_v0.1"
      })),
      citations: input.citations.map((citation) => ({
        url: citation.url,
        domain: safeHostname(citation.url),
        title: citation.title,
        start_index: citation.startIndex,
        end_index: citation.endIndex,
        source_kind: citation.sourceType,
        raw_citation: "citation raw object"
      })),
      metric_snapshots: {
        target_mention_observation: rankedTarget.mentioned ? 1 : 0,
        target_rank_observation: rankedTarget.estimatedAnswerRank,
        competitor_mentions_observation: rankedCompetitors.filter((competitor) => competitor.mentioned).length,
        citation_count_observation: input.citations.length,
        cited_domain_count_observation: citedDomains.length,
        missing_citation_signal: input.citations.length === 0
      },
      recommendations: buildRecommendationSignals(rankedTarget, rankedCompetitors, input.citations, topCompetitor)
    }
  };
}

function analyzeBrand(brandName: string, aliases: string[], text: string): BrandAnalysis {
  const normalizedText = normalizeForMatching(text);
  const normalizedAliases = aliases.map(normalizeForMatching);
  const firstMentionIndex = findFirstIndex(normalizedText, normalizedAliases);
  const mentionCount = normalizedAliases.reduce((total, alias) => total + countOccurrences(normalizedText, alias), 0);
  const evidenceSnippet = firstMentionIndex === null ? null : buildSnippet(text, firstMentionIndex);
  const recommendationStatus = classifyRecommendationStatus(mentionCount > 0, evidenceSnippet, text);
  const sentiment = classifySentiment(recommendationStatus, evidenceSnippet);

  return {
    brandName,
    mentioned: mentionCount > 0,
    mentionCount,
    firstMentionIndex,
    estimatedAnswerRank: null,
    recommendationStatus,
    sentiment,
    evidenceSnippet
  };
}

function classifyRecommendationStatus(
  mentioned: boolean,
  snippet: string | null,
  fullText: string
): RecommendationStatus {
  if (!mentioned) return "absent";

  const targetText = normalizeForMatching(`${snippet ?? ""}\n${fullText}`);
  if (containsAny(targetText, ["不向き", "避け", "おすすめしません", "推奨しません", "弱い", "課題", "注意が必要"])) {
    return "discouraged";
  }
  if (containsAny(targetText, ["最もおすすめ", "もっともおすすめ", "第一候補", "最有力", "筆頭", "最適", "特におすすめ"])) {
    return "strongly_recommended";
  }
  if (containsAny(targetText, ["おすすめ", "推奨", "適して", "向いて", "有力", "候補"])) {
    return "recommended";
  }
  if (containsAny(targetText, ["比較", "一方", "対して", "違い", "vs"])) {
    return "compared";
  }
  return "listed";
}

function classifySentiment(status: RecommendationStatus, snippet: string | null): Sentiment {
  if (status === "absent") return "unclear";
  if (status === "discouraged") return "negative";
  if (status === "strongly_recommended" || status === "recommended") return "positive";
  const text = normalizeForMatching(snippet ?? "");
  if (containsAny(text, ["高級感", "デザイン性", "適して", "強み", "評価", "おすすめ"])) return "positive";
  if (containsAny(text, ["課題", "弱い", "注意", "不向き"])) return "negative";
  return "neutral";
}

function buildRecommendationSignals(
  targetBrand: BrandAnalysis,
  competitors: BrandAnalysis[],
  citations: CitationCandidate[],
  topCompetitor: string | null
) {
  const signals: Array<Record<string, unknown>> = [];

  if (!targetBrand.mentioned) {
    signals.push({
      signal: "target_brand_absent",
      priority: "P1",
      suggested_action: "Create or strengthen pages that explain why レコラ建材 fits this buyer scenario.",
      source: "Recora独自指標"
    });
  }

  if (targetBrand.mentioned && targetBrand.recommendationStatus === "listed") {
    signals.push({
      signal: "target_listed_without_recommendation",
      priority: "P1",
      suggested_action: "Add clearer differentiators, project examples, and buyer criteria evidence.",
      source: "Recora独自指標"
    });
  }

  if (topCompetitor && (!targetBrand.estimatedAnswerRank || targetBrand.estimatedAnswerRank > 1)) {
    signals.push({
      signal: "competitor_mentions_ahead",
      priority: "P1",
      top_competitor: topCompetitor,
      suggested_action: "Compare competitor positioning and publish citation-ready comparison evidence.",
      source: "Recora独自指標"
    });
  }

  if (citations.length === 0) {
    signals.push({
      signal: "missing_citation_signal",
      priority: "P1",
      suggested_action: "Treat this answer as uncited. Run web_search mode and prepare source-ready pages before using citation metrics.",
      source: "Recora独自指標"
    });
  }

  if (competitors.some((competitor) => competitor.mentioned) && !targetBrand.mentioned) {
    signals.push({
      signal: "competitor_visible_target_absent",
      priority: "P1",
      suggested_action: "Prioritize content that maps high-end hotel lobby tile selection criteria to レコラ建材.",
      source: "Recora独自指標"
    });
  }

  return signals;
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;

  const output = Array.isArray(response.output) ? response.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item)) continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const contentItem of content) {
      if (isRecord(contentItem) && typeof contentItem.text === "string") {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("\n\n");
}

function extractCitations(response: Record<string, unknown>) {
  const citations: CitationCandidate[] = [];
  walkJson(response, (node) => {
    if (!isRecord(node)) return;

    const type = readString(node, "type");
    if (type === "url_citation") {
      const nested = isRecord(node.url_citation) ? node.url_citation : node;
      const url = readString(nested, "url");
      if (url) {
        citations.push({
          url,
          title: readString(nested, "title"),
          startIndex: readNumber(nested, "start_index"),
          endIndex: readNumber(nested, "end_index"),
          sourceType: "url_citation",
          raw: node
        });
      }
    }

    const url = readString(node, "url");
    if (url && (readString(node, "source") || readString(node, "title")) && type !== "url_citation") {
      citations.push({
        url,
        title: readString(node, "title"),
        startIndex: null,
        endIndex: null,
        sourceType: "web_search_source",
        raw: node
      });
    }
  });

  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = `${citation.sourceType}:${citation.url}:${citation.startIndex ?? ""}:${citation.endIndex ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCitationStatus(useWebSearch: boolean, citations: CitationCandidate[]): CitationStatus {
  if (!useWebSearch) return "not_requested";
  return citations.length > 0 ? "available" : "none_returned";
}

function buildSummaryMarkdown(variant: InspectionVariant, analysis: ReturnType<typeof analyzeOutput>) {
  const competitors = analysis.competitorMentions
    .map((competitor) => {
      const rank = competitor.estimatedAnswerRank ?? "-";
      return `| ${competitor.brandName} | ${competitor.mentioned ? "yes" : "no"} | ${competitor.mentionCount} | ${rank} | ${competitor.recommendationStatus} |`;
    })
    .join("\n");

  const citations = analysis.citations.length
    ? analysis.citations.map((citation, index) => `${index + 1}. ${citation.title ?? "(no title)"} - ${citation.url}`).join("\n")
    : "No citation URLs were returned for this observation.";

  return `# OpenAI Inspection Summary: ${variant.label}

This file is a local Recora inspection artifact. It is one observation, not a conclusion.

## Request

- Model: ${MODEL}
- Web search: ${variant.useWebSearch ? "enabled" : "disabled"}
- Target brand: ${TARGET_BRAND}
- Prompt: ${PROMPT}

## Target Brand

- Mentioned: ${analysis.targetBrandMentioned ? "yes" : "no"}
- Mention count: ${analysis.mentionCount}
- First mention index: ${analysis.firstMentionIndex ?? "-"}
- Estimated answer rank: ${analysis.estimatedAnswerRank ?? "-"}
- Recommendation status: ${analysis.recommendationStatus}
- Sentiment: ${analysis.sentiment}
- Citation status: ${analysis.citationStatus}

## Competitors

| Brand | Mentioned | Count | Estimated rank | Status |
|---|---:|---:|---:|---|
${competitors}

## Evidence Snippet

${analysis.evidenceSnippet ?? "No target brand snippet was found."}

## Citations

${citations}

## Suggested DB Mapping

- ai_conversations: request/response metadata, output_text, raw_response, usage, citation_status
- brand_mentions: target and competitor mention rows
- citations: URL rows only when URLs are returned
- metric_snapshots: aggregate only after multiple observations
- recommendations: generated from missing/weak mention, rank, competitor, and citation signals
`;
}

async function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function writeJson(fileName: string, value: unknown) {
  await fs.writeFile(path.join(OUTPUT_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function findFirstIndex(text: string, needles: string[]) {
  const positions = needles.map((needle) => text.indexOf(needle)).filter((index) => index >= 0);
  if (!positions.length) return null;
  return Math.min(...positions);
}

function buildSnippet(text: string, index: number) {
  const start = Math.max(0, index - 120);
  const end = Math.min(text.length, index + 220);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function containsAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(normalizeForMatching(needle)));
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function walkJson(value: unknown, visitor: (value: unknown) => void) {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, visitor);
    return;
  }
  if (isRecord(value)) {
    for (const item of Object.values(value)) walkJson(item, visitor);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : null;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
