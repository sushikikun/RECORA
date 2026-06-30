import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  RECORA_MEASUREMENT_PURPOSES,
  RECORA_MEASUREMENT_PURPOSE_LABELS,
  RECORA_PROMPT_TYPES,
  RECORA_PROMPT_TYPE_LABELS,
  isBrandPerceptionEligiblePromptScope,
  isCitationValidationPromptScope,
  isRankingEligiblePromptScope,
  isSentimentEligiblePromptScope,
  isSovEligiblePromptScope,
  isVisibilityEligiblePromptScope,
  type RecoraMeasurementPurpose,
  type RecoraPromptScope,
  type RecoraPromptScopeStatus,
  type RecoraPromptType
} from "../lib/recora/prompt-scope";

for (const promptType of RECORA_PROMPT_TYPES) {
  assert.equal(typeof RECORA_PROMPT_TYPE_LABELS[promptType], "string", `${promptType} needs a display label`);
  assert.ok(RECORA_PROMPT_TYPE_LABELS[promptType].length > 0, `${promptType} label must not be empty`);
}

for (const purpose of RECORA_MEASUREMENT_PURPOSES) {
  assert.equal(typeof RECORA_MEASUREMENT_PURPOSE_LABELS[purpose], "string", `${purpose} needs a display label`);
  assert.ok(RECORA_MEASUREMENT_PURPOSE_LABELS[purpose].length > 0, `${purpose} label must not be empty`);
}

assert.equal(isVisibilityEligiblePromptScope(scope("non_branded", "visibility")), true);
assert.equal(isRankingEligiblePromptScope(scope("non_branded", "ranking")), true);
assert.equal(isSovEligiblePromptScope(scope("non_branded", "sov")), true);
assert.equal(isSentimentEligiblePromptScope(scope("branded", "sentiment")), true);
assert.equal(isBrandPerceptionEligiblePromptScope(scope("branded", "brand_perception")), true);

assert.equal(isRankingEligiblePromptScope(scope("citation_check", "citation_validation")), false);
assert.equal(isSovEligiblePromptScope(scope("citation_check", "citation_validation")), false);
assert.equal(isCitationValidationPromptScope(scope("citation_check", "citation_validation")), true);

for (const promptType of ["comparison_named", "competitor_named"] as const) {
  assert.equal(isVisibilityEligiblePromptScope(scope(promptType, "visibility")), false);
  assert.equal(isRankingEligiblePromptScope(scope(promptType, "ranking")), false);
  assert.equal(isSovEligiblePromptScope(scope(promptType, "sov")), false);
}

assert.equal(isVisibilityEligiblePromptScope(scope("comparison_generic", "visibility")), false);
assert.equal(isRankingEligiblePromptScope(scope("comparison_generic", "ranking")), false);
assert.equal(isSovEligiblePromptScope(scope("comparison_generic", "sov")), false);

assert.equal(isVisibilityEligiblePromptScope(scope(null, null, "missing")), false);
assert.equal(isRankingEligiblePromptScope(scope(null, null, "missing")), false);
assert.equal(isSovEligiblePromptScope(scope(null, null, "missing")), false);
assert.equal(isVisibilityEligiblePromptScope(scope("non_branded", "visibility", "inferred")), false);

const migrationSql = readPromptScopeMigrationSql();
const executableMigrationSql = stripSqlLineComments(migrationSql);
const normalizedMigrationSql = normalizeSql(executableMigrationSql);

assert.ok(
  normalizedMigrationSql.includes("alter table public.prompts"),
  "prompt scope migration must target public.prompts"
);
assert.ok(
  normalizedMigrationSql.includes("add column if not exists prompt_type text"),
  "prompt scope migration must add nullable prompt_type text"
);
assert.ok(
  normalizedMigrationSql.includes("add column if not exists measurement_purpose text"),
  "prompt scope migration must add nullable measurement_purpose text"
);
assert.ok(
  normalizedMigrationSql.includes("prompts_prompt_type_check"),
  "prompt scope migration must add a prompt_type check constraint"
);
assert.ok(
  normalizedMigrationSql.includes("prompts_measurement_purpose_check"),
  "prompt scope migration must add a measurement_purpose check constraint"
);

for (const promptType of RECORA_PROMPT_TYPES) {
  assert.ok(migrationSql.includes(`'${promptType}'`), `${promptType} must be allowed by the prompt_type migration constraint`);
}

for (const purpose of RECORA_MEASUREMENT_PURPOSES) {
  assert.ok(migrationSql.includes(`'${purpose}'`), `${purpose} must be allowed by the measurement_purpose migration constraint`);
}

for (const tableName of ["ai_conversations", "brand_mentions", "citations", "metric_snapshots", "recommendations"]) {
  assert.equal(
    new RegExp(`\\balter\\s+table\\s+public\\.${tableName}\\b`, "i").test(executableMigrationSql),
    false,
    `prompt scope migration must not alter downstream table public.${tableName}`
  );
}

assert.equal(/\bupdate\s+public\.prompts\b/i.test(executableMigrationSql), false, "prompt scope migration must not backfill rows");
assert.equal(/\bnot\s+null\b/i.test(executableMigrationSql), false, "prompt scope fields must remain nullable");
assert.equal(/\bdefault\b/i.test(executableMigrationSql), false, "prompt scope fields must not use defaults");

console.log(JSON.stringify({
  status: "ok",
  checkedCases: {
    promptTypeLabels: RECORA_PROMPT_TYPES.length,
    measurementPurposeLabels: RECORA_MEASUREMENT_PURPOSES.length,
    nonBrandedVisibilityEligible: true,
    nonBrandedRankingEligible: true,
    nonBrandedSovEligible: true,
    brandedSentimentEligible: true,
    brandedBrandPerceptionEligible: true,
    citationCheckExcludedFromRankingAndSov: true,
    namedComparisonExcludedFromMarketMetrics: true,
    missingAndInferredScopeExcludedFromMarketMetrics: true,
    migrationAllowedValuesAligned: true,
    migrationRemainsLocalAdditive: true
  }
}, null, 2));

function scope(
  promptType: RecoraPromptType | null,
  measurementPurpose: RecoraMeasurementPurpose | null,
  status: RecoraPromptScopeStatus = "explicit"
): RecoraPromptScope {
  return {
    promptType,
    measurementPurpose,
    status
  };
}

function readPromptScopeMigrationSql(): string {
  const migrationDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFileName = fs.readdirSync(migrationDir)
    .find((fileName) => fileName.endsWith("_recora_prompt_scope_fields.sql"));

  assert.ok(migrationFileName, "prompt scope migration file is required");

  return fs.readFileSync(path.join(migrationDir, migrationFileName), "utf8");
}

function stripSqlLineComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}
