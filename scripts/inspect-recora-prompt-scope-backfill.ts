import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

import {
  RECORA_MEASUREMENT_PURPOSES,
  RECORA_PROMPT_TYPES,
  type RecoraMeasurementPurpose,
  type RecoraPromptType
} from "../lib/recora/prompt-scope";

const DEFAULT_LIMIT = 10000;
const DEFAULT_SAMPLE_LIMIT = 5;
const PREVIEW_LENGTH = 120;

const PROMPT_TYPE_SET = new Set<string>(RECORA_PROMPT_TYPES);
const MEASUREMENT_PURPOSE_SET = new Set<string>(RECORA_MEASUREMENT_PURPOSES);

type BackfillCategory =
  | "already_explicit"
  | "safe_explicit_candidate"
  | "inferred_candidate"
  | "manual_review"
  | "leave_null"
  | "invalid_existing_value"
  | "missing_required_context";

type Options = {
  limit: number;
  sampleLimit: number;
  mode: "linked" | "local";
};

type PromptRow = {
  total_available?: number | string | null;
  id: string;
  project_id: string;
  project_slug: string | null;
  text: string | null;
  intent: string | null;
  buyer_stage: string | null;
  prompt_type: string | null;
  measurement_purpose: string | null;
  topic_name: string | null;
  topic_intent: string | null;
  persona_name: string | null;
  persona_segment: string | null;
  primary_brand_name: string | null;
  primary_brand_domain: string | null;
  primary_brand_aliases: unknown;
  competitor_brands: unknown;
};

type CandidateScope = {
  promptType: RecoraPromptType | null;
  measurementPurpose: RecoraMeasurementPurpose | null;
};

type Classification = {
  category: BackfillCategory;
  reasonCodes: string[];
  candidate: CandidateScope;
};

type Sample = {
  id: string;
  projectSlug: string | null;
  reasonCodes: string[];
  existingPromptType: string | null;
  existingMeasurementPurpose: string | null;
  candidatePromptType: RecoraPromptType | null;
  candidateMeasurementPurpose: RecoraMeasurementPurpose | null;
  intent: string | null;
  topicName: string | null;
  promptPreview: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = queryPromptRows(options);
  const result = summarizeRows(rows, options);
  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    limit: DEFAULT_LIMIT,
    sampleLimit: DEFAULT_SAMPLE_LIMIT,
    mode: "linked"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--limit" && next) {
      options.limit = parsePositiveInteger(next, "--limit");
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = parsePositiveInteger(arg.slice("--limit=".length), "--limit");
      continue;
    }
    if (arg === "--sample-limit" && next) {
      options.sampleLimit = parsePositiveInteger(next, "--sample-limit");
      index += 1;
      continue;
    }
    if (arg.startsWith("--sample-limit=")) {
      options.sampleLimit = parsePositiveInteger(arg.slice("--sample-limit=".length), "--sample-limit");
      continue;
    }
    if (arg === "--local") {
      options.mode = "local";
      continue;
    }
    if (arg === "--linked") {
      options.mode = "linked";
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function queryPromptRows(options: Options): PromptRow[] {
  const sql = buildPromptQuery(options.limit);
  assertReadOnlySql(sql);

  const targetFlag = options.mode === "local" ? "--local" : "--linked";
  const supabaseCliPath = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
  if (!existsSync(supabaseCliPath)) {
    throw new Error("Supabase CLI dependency is not installed. Run npm install before this dry-run.");
  }
  const tempDir = mkdtempSync(path.join(tmpdir(), "recora-prompt-scope-backfill-"));
  const sqlPath = path.join(tempDir, "readonly-inspection.sql");
  writeFileSync(sqlPath, sql, "utf8");

  const completed = spawnSync(process.execPath, [supabaseCliPath, "db", "query", targetFlag, "--output-format", "json", "--file", sqlPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });

  rmSync(tempDir, { force: true, recursive: true });

  if (completed.error) throw completed.error;
  if (completed.status !== 0) {
    throw new Error(
      [
        "Supabase read-only query failed.",
        `exitCode=${completed.status ?? "unknown"}`,
        sanitizeCliOutput(completed.stderr || completed.stdout)
      ].join("\n")
    );
  }

  const json = parseSupabaseJson(completed.stdout);
  if (!Array.isArray(json.rows)) {
    throw new Error("Supabase CLI JSON output did not contain a rows array.");
  }
  return json.rows as PromptRow[];
}

function buildPromptQuery(limit: number) {
  return `
    select
      count(*) over()::int as total_available,
      p.id::text as id,
      p.project_id::text as project_id,
      pr.slug::text as project_slug,
      p.text::text as text,
      p.intent::text as intent,
      p.buyer_stage::text as buyer_stage,
      p.prompt_type::text as prompt_type,
      p.measurement_purpose::text as measurement_purpose,
      t.name::text as topic_name,
      t.intent::text as topic_intent,
      pe.name::text as persona_name,
      pe.segment::text as persona_segment,
      primary_brand.name::text as primary_brand_name,
      primary_brand.domain::text as primary_brand_domain,
      primary_brand.aliases as primary_brand_aliases,
      coalesce(competitor_brands.competitors, '[]'::jsonb) as competitor_brands
    from public.prompts p
    join public.projects pr on pr.id = p.project_id
    left join public.topics t on t.id = p.topic_id
    left join public.personas pe on pe.id = p.persona_id
    left join lateral (
      select b.name, b.domain, b.aliases
      from public.brands b
      where b.project_id = p.project_id
        and b.brand_type = 'primary'
        and coalesce(b.is_active, true)
      order by b.created_at asc, b.name asc
      limit 1
    ) primary_brand on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', b.name, 'domain', b.domain, 'aliases', b.aliases)
        order by b.name
      ) as competitors
      from public.brands b
      where b.project_id = p.project_id
        and b.brand_type = 'competitor'
        and coalesce(b.is_active, true)
    ) competitor_brands on true
    order by p.created_at asc, p.id asc
    limit ${formatSqlInteger(limit)}
  `;
}

function assertReadOnlySql(sql: string) {
  const normalized = sql.replace(/\s+/g, " ").toLowerCase();
  const prohibited = [
    " insert ",
    " update ",
    " delete ",
    " drop ",
    " truncate ",
    " alter ",
    " create ",
    " grant ",
    " revoke ",
    " repair ",
    " reset "
  ];
  const matched = prohibited.find((keyword) => normalized.includes(keyword));
  if (matched) throw new Error(`Dry-run SQL is not read-only: matched ${matched.trim()}.`);
}

function summarizeRows(rows: PromptRow[], options: Options) {
  const totalAvailable = rows.length > 0 ? toNumber(rows[0].total_available, rows.length) : 0;
  const byCategory = initCategoryCounts();
  const existingPromptTypeCounts = new Map<string, number>();
  const existingMeasurementPurposeCounts = new Map<string, number>();
  const reasonCounts = {
    safeExplicitCandidate: new Map<string, number>(),
    inferredCandidate: new Map<string, number>(),
    manualReview: new Map<string, number>()
  };
  const samples = initSamples();

  for (const row of rows) {
    const classification = classifyPrompt(row);
    byCategory[classification.category] += 1;
    increment(existingPromptTypeCounts, countKey(row.prompt_type));
    increment(existingMeasurementPurposeCounts, countKey(row.measurement_purpose));

    if (classification.category === "safe_explicit_candidate") {
      incrementReasons(reasonCounts.safeExplicitCandidate, classification.reasonCodes);
    }
    if (classification.category === "inferred_candidate") {
      incrementReasons(reasonCounts.inferredCandidate, classification.reasonCodes);
    }
    if (classification.category === "manual_review") {
      incrementReasons(reasonCounts.manualReview, classification.reasonCodes);
    }

    const categorySamples = samples[classification.category];
    if (categorySamples.length < options.sampleLimit) {
      categorySamples.push(formatSample(row, classification));
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: options.mode === "local" ? "supabase db query --local" : "supabase db query --linked",
    readOnly: true,
    writesExecuted: false,
    updateSqlGenerated: false,
    limit: options.limit,
    totalPrompts: totalAvailable,
    fetchedPrompts: rows.length,
    truncated: totalAvailable > rows.length,
    counts: {
      byCategory,
      existingPromptTypes: mapToSortedObject(existingPromptTypeCounts),
      existingMeasurementPurposes: mapToSortedObject(existingMeasurementPurposeCounts),
      reasons: {
        safeExplicitCandidate: mapToSortedObject(reasonCounts.safeExplicitCandidate),
        inferredCandidate: mapToSortedObject(reasonCounts.inferredCandidate),
        manualReview: mapToSortedObject(reasonCounts.manualReview)
      }
    },
    samples,
    notes: [
      "This script performs SELECT-only inspection through the Supabase CLI.",
      "safe_explicit_candidate requires trusted existing metadata, not prompt-text inference alone.",
      "inferred_candidate is review-only and must not be treated as official market-metric scope.",
      "No UPDATE, INSERT, DELETE, migration, seed, repair, reset, or backfill apply is executed."
    ]
  };
}

function classifyPrompt(row: PromptRow): Classification {
  const existingPromptType = normalizeNullableValue(row.prompt_type);
  const existingMeasurementPurpose = normalizeNullableValue(row.measurement_purpose);
  const invalidReasons = [
    existingPromptType && !PROMPT_TYPE_SET.has(existingPromptType) ? "invalid_prompt_type" : null,
    existingMeasurementPurpose && !MEASUREMENT_PURPOSE_SET.has(existingMeasurementPurpose)
      ? "invalid_measurement_purpose"
      : null
  ].filter(Boolean) as string[];

  if (invalidReasons.length > 0) {
    return {
      category: "invalid_existing_value",
      reasonCodes: invalidReasons,
      candidate: { promptType: null, measurementPurpose: null }
    };
  }

  if (existingPromptType && existingMeasurementPurpose) {
    return {
      category: "already_explicit",
      reasonCodes: ["existing_values_valid"],
      candidate: {
        promptType: existingPromptType as RecoraPromptType,
        measurementPurpose: existingMeasurementPurpose as RecoraMeasurementPurpose
      }
    };
  }

  if (existingPromptType || existingMeasurementPurpose) {
    return {
      category: "manual_review",
      reasonCodes: ["partial_existing_scope"],
      candidate: {
        promptType: castPromptType(existingPromptType),
        measurementPurpose: castMeasurementPurpose(existingMeasurementPurpose)
      }
    };
  }

  const brandTerms = buildBrandTerms(row.primary_brand_name, row.primary_brand_domain, row.primary_brand_aliases);
  const competitorTerms = buildCompetitorTerms(row.competitor_brands);
  const text = row.text ?? "";
  const metadataCandidate = inferFromTrustedMetadata(row);
  const brandMentioned = containsAnyTerm(text, brandTerms);
  const competitorMentioned = containsAnyTerm(text, competitorTerms);
  const comparisonSignal = containsComparisonSignal(text);

  if (metadataCandidate.promptType || metadataCandidate.measurementPurpose) {
    const conflictReasons = findCandidateConflicts(metadataCandidate, {
      brandMentioned,
      competitorMentioned,
      comparisonSignal
    });
    if (conflictReasons.length > 0) {
      return {
        category: "manual_review",
        reasonCodes: ["trusted_metadata_text_conflict", ...conflictReasons],
        candidate: metadataCandidate
      };
    }
    if (metadataCandidate.promptType && metadataCandidate.measurementPurpose) {
      return {
        category: "safe_explicit_candidate",
        reasonCodes: ["trusted_metadata_pair"],
        candidate: metadataCandidate
      };
    }
    return {
      category: "manual_review",
      reasonCodes: ["trusted_metadata_partial"],
      candidate: metadataCandidate
    };
  }

  if (brandTerms.length === 0) {
    return {
      category: "missing_required_context",
      reasonCodes: ["missing_primary_brand_context"],
      candidate: { promptType: null, measurementPurpose: null }
    };
  }

  if (!text.trim()) {
    return {
      category: "leave_null",
      reasonCodes: ["no_prompt_text"],
      candidate: { promptType: null, measurementPurpose: null }
    };
  }

  if (competitorMentioned) {
    return {
      category: "manual_review",
      reasonCodes: ["known_competitor_mentioned"],
      candidate: { promptType: "competitor_named", measurementPurpose: null }
    };
  }

  if (comparisonSignal && brandMentioned) {
    return {
      category: "manual_review",
      reasonCodes: ["brand_comparison_signal"],
      candidate: { promptType: "comparison_named", measurementPurpose: null }
    };
  }

  if (comparisonSignal) {
    return {
      category: "manual_review",
      reasonCodes: ["comparison_ambiguous"],
      candidate: { promptType: "comparison_generic", measurementPurpose: null }
    };
  }

  if (containsCitationSignal(text)) {
    return {
      category: "inferred_candidate",
      reasonCodes: ["citation_signal_text_only"],
      candidate: { promptType: "citation_check", measurementPurpose: "citation_validation" }
    };
  }

  if (brandMentioned && containsBrandPerceptionSignal(text)) {
    return {
      category: "inferred_candidate",
      reasonCodes: ["brand_perception_signal_text_only"],
      candidate: { promptType: "branded", measurementPurpose: "brand_perception" }
    };
  }

  if (brandMentioned && containsSentimentSignal(text)) {
    return {
      category: "inferred_candidate",
      reasonCodes: ["sentiment_signal_text_only"],
      candidate: { promptType: "branded", measurementPurpose: "sentiment" }
    };
  }

  if (brandMentioned) {
    return {
      category: "inferred_candidate",
      reasonCodes: ["brand_signal_text_only"],
      candidate: { promptType: "branded", measurementPurpose: null }
    };
  }

  const marketPurpose = inferMarketPurposeFromText(text);
  if (marketPurpose) {
    return {
      category: "inferred_candidate",
      reasonCodes: ["market_metric_signal_text_only"],
      candidate: { promptType: "non_branded", measurementPurpose: marketPurpose }
    };
  }

  return {
    category: "leave_null",
    reasonCodes: ["insufficient_evidence"],
    candidate: { promptType: null, measurementPurpose: null }
  };
}

function inferFromTrustedMetadata(row: PromptRow): CandidateScope {
  const metadataValues = [row.intent, row.topic_intent, row.buyer_stage]
    .map(normalizeMetadataValue)
    .filter(Boolean);
  const joined = metadataValues.join(" ");

  let promptType: RecoraPromptType | null = null;
  let measurementPurpose: RecoraMeasurementPurpose | null = null;

  if (hasMetadataToken(joined, "citation_check") || hasMetadataToken(joined, "citation")) {
    promptType = "citation_check";
    measurementPurpose = measurementPurpose ?? "citation_validation";
  }
  if (hasMetadataToken(joined, "competitor_named")) promptType = "competitor_named";
  if (hasMetadataToken(joined, "comparison_named")) promptType = "comparison_named";
  if (hasMetadataToken(joined, "comparison_generic")) promptType = "comparison_generic";
  if (hasMetadataToken(joined, "non_branded") || hasMetadataToken(joined, "nonbranded")) {
    promptType = "non_branded";
  }
  if (hasMetadataToken(joined, "branded") && !hasMetadataToken(joined, "non_branded")) {
    promptType = "branded";
  }

  if (hasMetadataToken(joined, "citation_validation")) measurementPurpose = "citation_validation";
  if (hasMetadataToken(joined, "visibility")) measurementPurpose = "visibility";
  if (hasMetadataToken(joined, "ranking")) measurementPurpose = "ranking";
  if (hasMetadataToken(joined, "sov") || joined.includes("share_of_voice")) measurementPurpose = "sov";
  if (hasMetadataToken(joined, "sentiment")) {
    measurementPurpose = "sentiment";
    promptType = promptType ?? "branded";
  }
  if (hasMetadataToken(joined, "brand_perception") || joined.includes("brand_reputation")) {
    measurementPurpose = "brand_perception";
    promptType = promptType ?? "branded";
  }
  if (hasMetadataToken(joined, "recommendation_input")) measurementPurpose = "recommendation_input";

  return { promptType, measurementPurpose };
}

function findCandidateConflicts(
  candidate: CandidateScope,
  signals: { brandMentioned: boolean; competitorMentioned: boolean; comparisonSignal: boolean }
) {
  const reasons: string[] = [];
  if (candidate.promptType === "non_branded" && signals.brandMentioned) reasons.push("target_brand_mentioned");
  if (candidate.promptType === "non_branded" && signals.competitorMentioned) reasons.push("known_competitor_mentioned");
  if (candidate.promptType === "non_branded" && signals.comparisonSignal) reasons.push("comparison_signal_present");
  if (candidate.promptType === "branded" && signals.competitorMentioned) reasons.push("known_competitor_mentioned");
  return reasons;
}

function buildBrandTerms(name: string | null, domain: string | null, aliases: unknown) {
  return normalizeTerms([name, domain, ...flattenAliasValues(aliases)]);
}

function buildCompetitorTerms(competitorBrands: unknown) {
  if (!Array.isArray(competitorBrands)) return [];
  const terms: Array<string | null> = [];
  for (const brand of competitorBrands) {
    if (!brand || typeof brand !== "object") continue;
    const record = brand as Record<string, unknown>;
    terms.push(
      valueToString(record.name),
      valueToString(record.domain),
      ...flattenAliasValues(record.aliases)
    );
  }
  return normalizeTerms(terms);
}

function flattenAliasValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenAliasValues);
  if (!value || typeof value !== "object") return [];
  return Object.values(value as Record<string, unknown>).flatMap(flattenAliasValues);
}

function normalizeTerms(values: Array<string | null>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim() ?? "")
        .filter(Boolean)
        .flatMap((value) => [value, stripDomainPrefix(value)])
        .map((value) => value.toLowerCase())
        .filter((value) => value.length >= 2 && !GENERIC_BRAND_TERMS.has(value))
    )
  );
}

const GENERIC_BRAND_TERMS = new Set(["ai", "seo", "web", "app", "www", "com", "jp", "co", "inc", "corp"]);

function stripDomainPrefix(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
}

function containsAnyTerm(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function containsComparisonSignal(text: string) {
  return /(\bvs\b|\bversus\b|\bcompare\b|\bcomparison\b|\balternative\b|\bcompetitor\b|比較|違い|代替|競合|どちら)/i.test(text);
}

function containsCitationSignal(text: string) {
  return /(\bcitation\b|\bcite\b|\bsource\b|\breference\b|\burl\b|引用|出典|参照|根拠|情報源)/i.test(text);
}

function containsSentimentSignal(text: string) {
  return /(\bsentiment\b|\breview\b|\breputation\b|\btone\b|評判|口コミ|感情|評価|印象)/i.test(text);
}

function containsBrandPerceptionSignal(text: string) {
  return /(\bbrand perception\b|\bperception\b|\breputation\b|\btrusted\b|印象|認知|信頼|評価)/i.test(text);
}

function inferMarketPurposeFromText(text: string): RecoraMeasurementPurpose | null {
  if (/(\bsov\b|\bshare of voice\b|シェア|Share of Voice)/i.test(text)) return "sov";
  if (/(\brank\b|\branking\b|順位|ランキング|おすすめ順)/i.test(text)) return "ranking";
  if (/(\bvisibility\b|\bvisible\b|\bmention\b|可視性|表示|言及|おすすめ)/i.test(text)) return "visibility";
  return null;
}

function formatSample(row: PromptRow, classification: Classification): Sample {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    reasonCodes: classification.reasonCodes,
    existingPromptType: normalizeNullableValue(row.prompt_type),
    existingMeasurementPurpose: normalizeNullableValue(row.measurement_purpose),
    candidatePromptType: classification.candidate.promptType,
    candidateMeasurementPurpose: classification.candidate.measurementPurpose,
    intent: row.intent,
    topicName: row.topic_name,
    promptPreview: truncatePreview(row.text ?? "")
  };
}

function initCategoryCounts(): Record<BackfillCategory, number> {
  return {
    already_explicit: 0,
    safe_explicit_candidate: 0,
    inferred_candidate: 0,
    manual_review: 0,
    leave_null: 0,
    invalid_existing_value: 0,
    missing_required_context: 0
  };
}

function initSamples(): Record<BackfillCategory, Sample[]> {
  return {
    already_explicit: [],
    safe_explicit_candidate: [],
    inferred_candidate: [],
    manual_review: [],
    leave_null: [],
    invalid_existing_value: [],
    missing_required_context: []
  };
}

function mapToSortedObject(map: Map<string, number>) {
  return Object.fromEntries(Array.from(map.entries()).sort(([left], [right]) => left.localeCompare(right)));
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function incrementReasons(map: Map<string, number>, reasons: string[]) {
  for (const reason of reasons) increment(map, reason);
}

function countKey(value: string | null) {
  return normalizeNullableValue(value) ?? "null";
}

function normalizeNullableValue(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function castPromptType(value: string | null): RecoraPromptType | null {
  return value && PROMPT_TYPE_SET.has(value) ? (value as RecoraPromptType) : null;
}

function castMeasurementPurpose(value: string | null): RecoraMeasurementPurpose | null {
  return value && MEASUREMENT_PURPOSE_SET.has(value) ? (value as RecoraMeasurementPurpose) : null;
}

function normalizeMetadataValue(value: string | null) {
  return value?.trim().toLowerCase().replace(/[-\s]+/g, "_") ?? "";
}

function hasMetadataToken(value: string, token: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i").test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function truncatePreview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, PREVIEW_LENGTH - 3)}...`;
}

function valueToString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function formatSqlInteger(value: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("SQL limit must be a positive integer.");
  return String(parsed);
}

function toNumber(value: string | number | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSupabaseJson(stdout: string): { rows?: unknown[] } {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error(`Unable to parse Supabase CLI JSON output.\n${sanitizeCliOutput(stdout)}`);
  }
  try {
    return JSON.parse(stdout.slice(start, end + 1)) as { rows?: unknown[] };
  } catch (error) {
    throw new Error(`Unable to parse Supabase CLI JSON output: ${(error as Error).message}`);
  }
}

function sanitizeCliOutput(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"]+/gi, "[hidden-postgres-url]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[hidden-token]")
    .replace(/[a-f0-9]{40,}/gi, "[hidden-token]")
    .trim();
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
