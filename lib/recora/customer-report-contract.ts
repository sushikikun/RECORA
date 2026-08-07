import {
  RECORA_FIXED_PROMPT_METRIC_KEYS,
  RECORA_FIXED_PROMPT_PANEL_ROLES
} from "./fixed-prompt-materialization";
import {
  RECORA_PROMPT_METRIC_KEYS,
  RECORA_PROMPT_PANEL_ROLES,
  RECORA_VALID_RESPONSE_STATUSES
} from "./prompt-measurement-contract";
import type {
  RecoraFixedPromptMetricEligibility,
  RecoraFixedPromptMetricKey,
  RecoraFixedPromptPanelRole
} from "./db/types";

export const RECORA_CUSTOMER_REPORT_CONTRACT_VERSION =
  "recora_customer_report_contract_v3" as const;

export const RECORA_CUSTOMER_REPORT_METRIC_KEYS = [
  "ai_visibility_rate",
  "ai_share_of_voice",
  "average_first_position",
  "owned_site_reference_rate",
  "cited_answer_rate"
] as const;

export const RECORA_CUSTOMER_REPORT_SENTIMENTS = [
  "positive",
  "neutral",
  "negative",
  "unclassified"
] as const;

export const RECORA_CUSTOMER_REPORT_BRAND_SCOPES = [
  "non_branded",
  "branded",
  "named_comparison"
] as const;

export const RECORA_CUSTOMER_REPORT_ANSWER_EXCLUSION_REASONS = [
  "empty_answer",
  "refusal",
  "provider_error",
  "timeout",
  "invalid_payload",
  "cancelled"
] as const;

export const RECORA_CUSTOMER_REPORT_EVIDENCE_UNITS = [
  "answer",
  "question",
  "citation_occurrence",
  "normalized_source_url_page",
  "registrable_domain",
  "source_to_claim_correspondence_check"
] as const;

export const RECORA_CUSTOMER_REPORT_ROUTES = [
  { number: 1, key: "overview", path: "/dashboard/reports/{id}" },
  { number: 2, key: "trends", path: "/dashboard/reports/{id}/trends" },
  { number: 3, key: "leaderboard", path: "/dashboard/reports/{id}/leaderboard" },
  { number: 4, key: "persona_topics", path: "/dashboard/reports/{id}/persona-topics" },
  { number: 5, key: "prompts", path: "/dashboard/reports/{id}/prompts" },
  { number: 6, key: "conversations", path: "/dashboard/reports/{id}/conversations" },
  { number: 7, key: "brand_perception", path: "/dashboard/reports/{id}/brand-perception" },
  { number: 8, key: "sources", path: "/dashboard/reports/{id}/sources" },
  { number: 9, key: "recommendations", path: "/dashboard/reports/{id}/recommendations" },
  { number: 10, key: "settings", path: "/dashboard/reports/{id}/settings" }
] as const;

export const RECORA_CUSTOMER_REPORT_QUERY_KEYS = [
  "metric",
  "range",
  "compare",
  "questionGap",
  "persona",
  "topic",
  "prompt",
  "model",
  "date",
  "answer",
  "expression",
  "sentiment",
  "owner",
  "domain",
  "sourceUrlId",
  "recommendation",
  "evidenceRef",
  "guide_q"
] as const;

export type RecoraCustomerReportMetricKey =
  typeof RECORA_CUSTOMER_REPORT_METRIC_KEYS[number];
export type RecoraCustomerReportSentiment =
  typeof RECORA_CUSTOMER_REPORT_SENTIMENTS[number];
export type RecoraCustomerReportBrandScope =
  typeof RECORA_CUSTOMER_REPORT_BRAND_SCOPES[number];
export type RecoraCustomerReportAnswerExclusionReason =
  typeof RECORA_CUSTOMER_REPORT_ANSWER_EXCLUSION_REASONS[number];
export type RecoraCustomerReportEvidenceUnit =
  typeof RECORA_CUSTOMER_REPORT_EVIDENCE_UNITS[number];
export type RecoraCustomerReportRouteKey =
  typeof RECORA_CUSTOMER_REPORT_ROUTES[number]["key"];
export type RecoraCustomerReportQueryKey =
  typeof RECORA_CUSTOMER_REPORT_QUERY_KEYS[number];

export type RecoraCustomerReportBinding = {
  organizationId: string;
  projectId: string;
  measurementDesignVersionId: string;
  promptConfigurationVersion: string;
  publicationVersionId: string;
};

export type RecoraCustomerReportMetricDefinition = {
  key: RecoraCustomerReportMetricKey;
  label: string;
  numerator: string;
  denominator: string;
  sourceMetricEligibility: Extract<
    RecoraFixedPromptMetricKey,
    "visibility" | "ranking" | "sov" | "natural_citation_observation"
  >;
  aggregationUnit: "answer" | "mention";
  valueKind: "rate" | "average";
  roundingDecimals: 1;
  zeroDenominator: "not_available";
  headlinePanelRole: "core";
};

export const RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS = [
  {
    key: "ai_visibility_rate",
    label: "AI表示率",
    numerator: "自社掲載有効回答数",
    denominator: "対象有効回答数",
    sourceMetricEligibility: "visibility",
    aggregationUnit: "answer",
    valueKind: "rate",
    roundingDecimals: 1,
    zeroDenominator: "not_available",
    headlinePanelRole: "core"
  },
  {
    key: "ai_share_of_voice",
    label: "AI内シェア",
    numerator: "自社ブランド言及数",
    denominator: "承認済み対象ブランド総言及数",
    sourceMetricEligibility: "sov",
    aggregationUnit: "mention",
    valueKind: "rate",
    roundingDecimals: 1,
    zeroDenominator: "not_available",
    headlinePanelRole: "core"
  },
  {
    key: "average_first_position",
    label: "平均掲載位置",
    numerator: "自社掲載回答の初出位置合計",
    denominator: "自社掲載回答数",
    sourceMetricEligibility: "ranking",
    aggregationUnit: "answer",
    valueKind: "average",
    roundingDecimals: 1,
    zeroDenominator: "not_available",
    headlinePanelRole: "core"
  },
  {
    key: "owned_site_reference_rate",
    label: "自社サイト参照率",
    numerator: "自社承認domain URLを含む有効回答数",
    denominator: "対象有効回答数",
    sourceMetricEligibility: "natural_citation_observation",
    aggregationUnit: "answer",
    valueKind: "rate",
    roundingDecimals: 1,
    zeroDenominator: "not_available",
    headlinePanelRole: "core"
  },
  {
    key: "cited_answer_rate",
    label: "引用付き回答率",
    numerator: "参照URLを含む有効回答数",
    denominator: "対象有効回答数",
    sourceMetricEligibility: "natural_citation_observation",
    aggregationUnit: "answer",
    valueKind: "rate",
    roundingDecimals: 1,
    zeroDenominator: "not_available",
    headlinePanelRole: "core"
  }
] as const satisfies readonly RecoraCustomerReportMetricDefinition[];

export type RecoraCustomerReportObservation = {
  observationId: string;
  binding: RecoraCustomerReportBinding;
  promptConfigurationStatus: "draft" | "finalized";
  measurementDesignStatus: "draft" | "ready";
  intentKey: string;
  modelKey: string;
  panelRole: RecoraFixedPromptPanelRole;
  brandScope: RecoraCustomerReportBrandScope;
  metricEligibility: RecoraFixedPromptMetricEligibility;
  answerStatus: typeof RECORA_VALID_RESPONSE_STATUSES[number];
  answerExclusionReason: RecoraCustomerReportAnswerExclusionReason | null;
  sentiment: RecoraCustomerReportSentiment | null;
  targetBrandMentioned: boolean;
  targetBrandFirstPosition: number | null;
  approvedTargetBrandMentionCount: number;
  approvedTargetBrandTotalMentionCount: number;
  approvedOwnedUrlCount: number;
  referenceUrlCount: number;
  compatibilityPromptType?: string | null;
  compatibilityMeasurementPurpose?: string | null;
};

export type RecoraCustomerReportMetricResult = {
  key: RecoraCustomerReportMetricKey;
  status: "available" | "not_available";
  numerator: number;
  denominator: number;
  value: number | null;
  unit: "percent" | "position";
};

export type RecoraCustomerReportSentimentResult = {
  status: "available" | "not_available";
  denominator: number;
  counts: Record<RecoraCustomerReportSentiment, number>;
};

export type RecoraCustomerReportEvidenceCount = {
  binding: RecoraCustomerReportBinding;
  unit: RecoraCustomerReportEvidenceUnit;
  count: number;
  group: string;
};

export type RecoraCustomerReportEvidenceBundle = {
  binding: RecoraCustomerReportBinding;
  items: readonly RecoraCustomerReportEvidenceCount[];
};

export type RecoraCustomerReportFixtureUse =
  | "test"
  | "design_preview"
  | "production_measurement"
  | "published_report";

const CUSTOMER_METRIC_DEFINITION_BY_KEY = new Map<
  RecoraCustomerReportMetricKey,
  RecoraCustomerReportMetricDefinition
>(RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS.map((definition) => [definition.key, definition]));

const SAFE_REFERENCE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SAFE_MODEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const QUERY_ENUMS: Partial<Record<RecoraCustomerReportQueryKey, readonly string[]>> = {
  metric: RECORA_CUSTOMER_REPORT_METRIC_KEYS,
  range: ["7d", "30d", "90d", "custom"],
  compare: ["none", "previous_period", "previous_year"],
  questionGap: ["all", "won", "lost", "unanswered"],
  sentiment: RECORA_CUSTOMER_REPORT_SENTIMENTS,
  owner: ["owned", "competitor", "third_party", "unknown"]
};

const QUERY_MAX_LENGTH: Record<RecoraCustomerReportQueryKey, number> = {
  metric: 40,
  range: 20,
  compare: 24,
  questionGap: 20,
  persona: 80,
  topic: 80,
  prompt: 80,
  model: 80,
  date: 10,
  answer: 80,
  expression: 120,
  sentiment: 20,
  owner: 20,
  domain: 253,
  sourceUrlId: 80,
  recommendation: 80,
  evidenceRef: 80,
  guide_q: 120
};

export function calculateRecoraCustomerReportMetrics(
  observations: readonly RecoraCustomerReportObservation[],
  binding: RecoraCustomerReportBinding
): readonly RecoraCustomerReportMetricResult[] {
  validateBinding(binding, "report");
  observations.forEach((observation) =>
    validateRecoraCustomerReportObservationInput(observation, binding)
  );

  return RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS.map((definition) => {
    const eligible = observations.filter((observation) =>
      isHeadlineEligible(observation, definition.sourceMetricEligibility)
    );
    assertUniqueCoreWeight(eligible, definition.sourceMetricEligibility);

    if (definition.key === "ai_visibility_rate") {
      return metricResult(definition, countTrue(eligible, "targetBrandMentioned"), eligible.length);
    }
    if (definition.key === "ai_share_of_voice") {
      return metricResult(
        definition,
        sum(eligible, "approvedTargetBrandMentionCount"),
        sum(eligible, "approvedTargetBrandTotalMentionCount")
      );
    }
    if (definition.key === "average_first_position") {
      const mentioned = eligible.filter((observation) => observation.targetBrandMentioned);
      return metricResult(
        definition,
        mentioned.reduce((total, observation) => total + requireFirstPosition(observation), 0),
        mentioned.length
      );
    }
    if (definition.key === "owned_site_reference_rate") {
      return metricResult(
        definition,
        eligible.filter((observation) => observation.approvedOwnedUrlCount > 0).length,
        eligible.length
      );
    }
    return metricResult(
      definition,
      eligible.filter((observation) => observation.referenceUrlCount > 0).length,
      eligible.length
    );
  });
}

export function calculateRecoraCustomerReportSentiment(
  observations: readonly RecoraCustomerReportObservation[],
  binding: RecoraCustomerReportBinding
): RecoraCustomerReportSentimentResult {
  validateBinding(binding, "report");
  observations.forEach((observation) =>
    validateRecoraCustomerReportObservationInput(observation, binding)
  );
  const eligible = observations.filter(isSentimentEligible);
  assertUniqueCoreWeight(eligible, "sentiment");

  const counts = RECORA_CUSTOMER_REPORT_SENTIMENTS.reduce(
    (result, sentiment) => ({ ...result, [sentiment]: 0 }),
    {} as Record<RecoraCustomerReportSentiment, number>
  );
  for (const observation of eligible) {
    if (observation.sentiment === null) {
      throw new Error(`eligible sentiment is missing: ${observation.observationId}`);
    }
    counts[observation.sentiment] += 1;
  }

  return {
    status: eligible.length === 0 ? "not_available" : "available",
    denominator: eligible.length,
    counts
  };
}

export function validateRecoraCustomerReportCrossContract(): void {
  const expectedMetricKeys = [
    "visibility",
    "ranking",
    "sov",
    "sentiment",
    "brand_perception",
    "natural_citation_observation",
    "forced_citation_validation",
    "risk_check",
    "recommendation_input"
  ];
  assertSameStringSet(RECORA_FIXED_PROMPT_METRIC_KEYS, expectedMetricKeys, "fixed prompt metric keys");
  assertSameStringSet(
    RECORA_PROMPT_METRIC_KEYS.map(camelToSnakeCase),
    expectedMetricKeys,
    "prompt measurement metric keys"
  );
  assertSameStringSet(
    RECORA_FIXED_PROMPT_PANEL_ROLES,
    ["core", "robustness", "diagnostic"],
    "fixed prompt panel roles"
  );
  for (const role of RECORA_FIXED_PROMPT_PANEL_ROLES) {
    if (!RECORA_PROMPT_PANEL_ROLES.includes(role)) {
      throw new Error(`fixed prompt panel role is missing from prompt contract: ${role}`);
    }
  }
  assertUnique(RECORA_CUSTOMER_REPORT_METRIC_KEYS, "customer metric keys");
  assertUnique(RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS.map((item) => item.label), "customer metric labels");
  assertUnique(RECORA_CUSTOMER_REPORT_QUERY_KEYS, "query keys");
  assertUnique(RECORA_CUSTOMER_REPORT_ROUTES.map((route) => route.path), "route paths");
  assertSameStringSet(
    RECORA_CUSTOMER_REPORT_BRAND_SCOPES,
    ["non_branded", "branded", "named_comparison"],
    "customer report brand scopes"
  );
  assertSameStringSet(
    RECORA_CUSTOMER_REPORT_SENTIMENTS,
    ["positive", "neutral", "negative", "unclassified"],
    "customer report sentiments"
  );
  assertSameStringSet(
    RECORA_CUSTOMER_REPORT_ANSWER_EXCLUSION_REASONS,
    RECORA_VALID_RESPONSE_STATUSES.filter((status) => status !== "valid_answer"),
    "answer exclusion reasons"
  );

  for (const definition of RECORA_CUSTOMER_REPORT_METRIC_DEFINITIONS) {
    if (!RECORA_FIXED_PROMPT_METRIC_KEYS.includes(definition.sourceMetricEligibility)) {
      throw new Error(`unknown metric eligibility: ${definition.sourceMetricEligibility}`);
    }
    if (definition.zeroDenominator !== "not_available") {
      throw new Error(`unsafe zero denominator rule: ${definition.key}`);
    }
  }
}

export function validateRecoraCustomerReportEvidenceBundle(
  bundle: RecoraCustomerReportEvidenceBundle
): void {
  validateBinding(bundle.binding, "evidence bundle");
  if (bundle.items.length === 0) throw new Error("evidence bundle is empty");
  for (const item of bundle.items) {
    assertBindingMatches(item.binding, bundle.binding, "evidence item");
    assertNonNegativeInteger(item.count, `evidence ${item.unit} count`);
    if (!RECORA_CUSTOMER_REPORT_EVIDENCE_UNITS.includes(item.unit)) {
      throw new Error(`unknown evidence unit: ${item.unit}`);
    }
    if (!hasText(item.group)) throw new Error("evidence group is empty");
  }
}

export function assertRecoraCustomerReportFixtureUse(
  synthetic: boolean,
  use: RecoraCustomerReportFixtureUse
): void {
  if (synthetic && (use === "production_measurement" || use === "published_report")) {
    throw new Error(`synthetic fixture cannot be used for ${use}`);
  }
}

export function validateRecoraCustomerReportQuery(rawQuery: string): void {
  if (rawQuery.startsWith("?")) rawQuery = rawQuery.slice(1);
  if (!hasText(rawQuery)) return;
  if (/%(?![0-9a-f]{2})/i.test(rawQuery)) throw new Error("invalid percent encoding");
  try {
    decodeURIComponent(rawQuery.replace(/\+/g, "%20"));
  } catch {
    throw new Error("invalid percent encoding");
  }

  const params = new URLSearchParams(rawQuery);
  const counts = new Map<string, number>();
  params.forEach((value, key) => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    validateQueryEntry(key, value);
  });
  counts.forEach((count, key) => {
    if (count !== 1) throw new Error(`duplicate query key: ${key}`);
  });
}

export function buildRecoraCustomerReportPath(
  routeKey: RecoraCustomerReportRouteKey,
  reportReference: string
): string {
  validateCustomerSafeReference(reportReference, "report reference");
  const route = RECORA_CUSTOMER_REPORT_ROUTES.find((candidate) => candidate.key === routeKey);
  if (!route) throw new Error(`unknown route: ${routeKey}`);
  return route.path.replace("{id}", reportReference);
}

export function validateRecoraCustomerReportObservationInput(
  observation: RecoraCustomerReportObservation,
  binding: RecoraCustomerReportBinding = observation.binding
): void {
  validateCustomerSafeReference(observation.observationId, "observation id");
  validateCustomerSafeReference(observation.intentKey, "intent key");
  if (!SAFE_MODEL_PATTERN.test(observation.modelKey)) throw new Error("model key is invalid");
  assertBindingMatches(observation.binding, binding, `observation ${observation.observationId}`);
  if (!RECORA_VALID_RESPONSE_STATUSES.includes(observation.answerStatus)) {
    throw new Error(`unknown answer status: ${String(observation.answerStatus)}`);
  }
  if (!RECORA_CUSTOMER_REPORT_BRAND_SCOPES.includes(observation.brandScope)) {
    throw new Error(`unknown brand scope: ${String(observation.brandScope)}`);
  }
  if (
    observation.answerExclusionReason !== null &&
    !RECORA_CUSTOMER_REPORT_ANSWER_EXCLUSION_REASONS.includes(observation.answerExclusionReason)
  ) {
    throw new Error(`unknown answer exclusion reason: ${String(observation.answerExclusionReason)}`);
  }
  if (observation.answerStatus === "valid_answer") {
    if (observation.answerExclusionReason !== null) {
      throw new Error("valid answer cannot have an exclusion reason");
    }
  } else if (observation.answerExclusionReason !== observation.answerStatus) {
    throw new Error(`answer exclusion reason mismatch: ${observation.observationId}`);
  }

  const eligibilityKeys = Object.keys(observation.metricEligibility);
  assertSameStringSet(eligibilityKeys, RECORA_FIXED_PROMPT_METRIC_KEYS, "observation eligibility keys");
  for (const key of RECORA_FIXED_PROMPT_METRIC_KEYS) {
    const entry = observation.metricEligibility[key];
    if (entry.state !== "eligible" && entry.state !== "excluded") {
      throw new Error(`invalid eligibility state: ${key}`);
    }
    if (!Array.isArray(entry.reason_codes) || entry.reason_codes.length === 0) {
      throw new Error(`eligibility reason is missing: ${key}`);
    }
  }
  if (
    observation.metricEligibility.natural_citation_observation.state === "eligible" &&
    observation.metricEligibility.forced_citation_validation.state === "eligible"
  ) {
    throw new Error("natural and forced citation eligibility must be separate");
  }
  if (
    observation.brandScope === "branded" &&
    ["visibility", "ranking", "sov"].some(
      (key) => observation.metricEligibility[key as "visibility" | "ranking" | "sov"].state === "eligible"
    )
  ) {
    throw new Error("branded observation cannot enter market metrics");
  }
  if (
    observation.metricEligibility.sentiment.state === "eligible" &&
    observation.brandScope !== "branded"
  ) {
    throw new Error("sentiment eligibility requires branded scope");
  }
  if (observation.sentiment !== null) {
    if (!RECORA_CUSTOMER_REPORT_SENTIMENTS.includes(observation.sentiment)) {
      throw new Error(`unknown sentiment: ${String(observation.sentiment)}`);
    }
    if (observation.metricEligibility.sentiment.state !== "eligible") {
      throw new Error("sentiment value requires sentiment eligibility");
    }
  }
  if (isSentimentEligible(observation) && observation.sentiment === null) {
    throw new Error(`eligible sentiment is missing: ${observation.observationId}`);
  }

  assertNonNegativeInteger(observation.approvedTargetBrandMentionCount, "target brand mention count");
  assertNonNegativeInteger(observation.approvedTargetBrandTotalMentionCount, "total target brand mention count");
  assertNonNegativeInteger(observation.approvedOwnedUrlCount, "owned URL count");
  assertNonNegativeInteger(observation.referenceUrlCount, "reference URL count");
  if (observation.approvedTargetBrandMentionCount > observation.approvedTargetBrandTotalMentionCount) {
    throw new Error("target brand mentions exceed total approved mentions");
  }
  if (observation.approvedOwnedUrlCount > observation.referenceUrlCount) {
    throw new Error("owned URL count exceeds reference URL count");
  }
  if (observation.targetBrandMentioned) {
    requireFirstPosition(observation);
  } else if (observation.targetBrandFirstPosition !== null) {
    throw new Error("absent brand cannot have a first position");
  }
  if (!observation.targetBrandMentioned && observation.approvedTargetBrandMentionCount !== 0) {
    throw new Error("absent brand cannot have approved mentions");
  }
}

function isHeadlineEligible(
  observation: RecoraCustomerReportObservation,
  sourceMetricEligibility: RecoraCustomerReportMetricDefinition["sourceMetricEligibility"]
): boolean {
  return (
    observation.promptConfigurationStatus === "finalized" &&
    observation.measurementDesignStatus === "ready" &&
    observation.answerStatus === "valid_answer" &&
    observation.panelRole === "core" &&
    observation.metricEligibility[sourceMetricEligibility].state === "eligible"
  );
}

function isSentimentEligible(observation: RecoraCustomerReportObservation): boolean {
  return (
    observation.promptConfigurationStatus === "finalized" &&
    observation.measurementDesignStatus === "ready" &&
    observation.answerStatus === "valid_answer" &&
    observation.panelRole === "core" &&
    observation.brandScope === "branded" &&
    observation.metricEligibility.sentiment.state === "eligible"
  );
}

function assertUniqueCoreWeight(
  observations: readonly RecoraCustomerReportObservation[],
  eligibility: RecoraCustomerReportMetricDefinition["sourceMetricEligibility"] | "sentiment"
): void {
  const seen = new Set<string>();
  for (const observation of observations) {
    const key = `${observation.intentKey}\u0000${observation.modelKey}`;
    if (seen.has(key)) throw new Error(`duplicate core weight for ${eligibility}: ${observation.intentKey}`);
    seen.add(key);
  }
}

function metricResult(
  definition: RecoraCustomerReportMetricDefinition,
  numerator: number,
  denominator: number
): RecoraCustomerReportMetricResult {
  assertNonNegativeFinite(numerator, `${definition.key} numerator`);
  assertNonNegativeFinite(denominator, `${definition.key} denominator`);
  if (denominator === 0) {
    return {
      key: definition.key,
      status: "not_available",
      numerator,
      denominator,
      value: null,
      unit: definition.valueKind === "rate" ? "percent" : "position"
    };
  }
  const raw = definition.valueKind === "rate" ? (numerator / denominator) * 100 : numerator / denominator;
  return {
    key: definition.key,
    status: "available",
    numerator,
    denominator,
    value: round(raw, definition.roundingDecimals),
    unit: definition.valueKind === "rate" ? "percent" : "position"
  };
}

function validateQueryEntry(key: string, value: string): void {
  if (!RECORA_CUSTOMER_REPORT_QUERY_KEYS.includes(key as RecoraCustomerReportQueryKey)) {
    throw new Error(`unknown query key: ${key}`);
  }
  const typedKey = key as RecoraCustomerReportQueryKey;
  if (!hasText(value)) throw new Error(`empty query value: ${key}`);
  if (value.length > QUERY_MAX_LENGTH[typedKey]) throw new Error(`query value too long: ${key}`);
  if (UUID_PATTERN.test(value)) throw new Error(`internal id is not customer-safe: ${key}`);
  if (/\b(?:run|generation|aggregate|measurement)[_-]?[0-9a-z]+\b/i.test(value)) {
    throw new Error(`internal value is not customer-safe: ${key}`);
  }
  if (/@/.test(value)) throw new Error(`email is not allowed in query: ${key}`);
  if (/^https?:\/\//i.test(value)) throw new Error(`URL is not allowed in query: ${key}`);

  const allowed = QUERY_ENUMS[typedKey];
  if (allowed && !allowed.includes(value)) throw new Error(`invalid enum value: ${key}`);
  if (typedKey === "date" && !isIsoCalendarDate(value)) throw new Error("invalid date value");
  if (typedKey === "domain" && !DOMAIN_PATTERN.test(value)) throw new Error("invalid domain value");
  if (typedKey === "model" && !SAFE_MODEL_PATTERN.test(value)) throw new Error("invalid model value");
  if (["persona", "topic", "prompt", "answer", "sourceUrlId", "recommendation", "evidenceRef"].includes(typedKey)) {
    validateCustomerSafeReference(value, `${typedKey} query value`);
  }
}

function validateBinding(binding: RecoraCustomerReportBinding, label: string): void {
  validateCustomerSafeReference(binding.organizationId, `${label} organization`);
  validateCustomerSafeReference(binding.projectId, `${label} project`);
  validateCustomerSafeReference(binding.measurementDesignVersionId, `${label} measurement design`);
  validateCustomerSafeReference(binding.promptConfigurationVersion, `${label} prompt configuration`);
  validateCustomerSafeReference(binding.publicationVersionId, `${label} publication version`);
}

function assertBindingMatches(
  actual: RecoraCustomerReportBinding,
  expected: RecoraCustomerReportBinding,
  label: string
): void {
  validateBinding(actual, label);
  for (const key of Object.keys(expected) as (keyof RecoraCustomerReportBinding)[]) {
    if (actual[key] !== expected[key]) throw new Error(`${label} ${key} mismatch`);
  }
}

function validateCustomerSafeReference(value: string, label: string): void {
  if (!SAFE_REFERENCE_PATTERN.test(value) || value.length > 80 || UUID_PATTERN.test(value)) {
    throw new Error(`${label} is not customer-safe`);
  }
}

function requireFirstPosition(observation: RecoraCustomerReportObservation): number {
  const position = observation.targetBrandFirstPosition;
  if (!Number.isInteger(position) || position == null || position <= 0) {
    throw new Error(`valid first position is required: ${observation.observationId}`);
  }
  return position;
}

function countTrue(
  values: readonly RecoraCustomerReportObservation[],
  key: "targetBrandMentioned"
): number {
  return values.filter((value) => value[key]).length;
}

function sum(
  values: readonly RecoraCustomerReportObservation[],
  key: "approvedTargetBrandMentionCount" | "approvedTargetBrandTotalMentionCount"
): number {
  return values.reduce((total, value) => total + value[key], 0);
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative and finite`);
}

function assertSameStringSet(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): void {
  assertUnique(actual, label);
  assertUnique(expected, `${label} expected`);
  const left = Array.from(actual).sort();
  const right = Array.from(expected).sort();
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
    throw new Error(`${label} mismatch`);
  }
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`);
}

function camelToSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`);
}

function round(value: number, decimals: number): number {
  const multiplier = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function isIsoCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  return day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function getRecoraCustomerReportMetricDefinition(
  key: RecoraCustomerReportMetricKey
): RecoraCustomerReportMetricDefinition {
  const definition = CUSTOMER_METRIC_DEFINITION_BY_KEY.get(key);
  if (!definition) throw new Error(`unknown customer metric: ${key}`);
  return definition;
}
