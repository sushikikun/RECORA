import type {
  RecoraCustomerReportBinding,
  RecoraCustomerReportEvidenceBundle,
  RecoraCustomerReportMetricKey,
  RecoraCustomerReportObservation,
  RecoraCustomerReportSentiment
} from "../../lib/recora/customer-report-contract";
import type { RecoraFixedPromptMetricEligibility } from "../../lib/recora/db/types";

export const RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE_VERSION =
  "recora_customer_report_synthetic_fixture_v3" as const;

export const RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING: RecoraCustomerReportBinding = {
  organizationId: "org-kintai-cloud",
  projectId: "project-kintai-cloud",
  measurementDesignVersionId: "measurement-design-v1",
  promptConfigurationVersion: "prompt-config-v1",
  publicationVersionId: "publication-v1"
};

export const RECORA_CUSTOMER_REPORT_SYNTHETIC_OBSERVATIONS = [
  ...createCoreObservations(),
  ...createSentimentObservations(),
  createExcludedSentimentObservation(),
  createExcludedObservation("robustness-answer", "robustness", "valid_answer"),
  createExcludedObservation("diagnostic-answer", "diagnostic", "valid_answer"),
  createExcludedObservation("provider-error-answer", "core", "provider_error"),
  createExcludedObservation("refusal-answer", "core", "refusal"),
  {
    ...createExcludedObservation("draft-prompt-answer", "core", "valid_answer"),
    promptConfigurationStatus: "draft"
  },
  {
    ...createExcludedObservation("draft-design-answer", "core", "valid_answer"),
    measurementDesignStatus: "draft"
  },
  createForcedCitationObservation()
] as const satisfies readonly RecoraCustomerReportObservation[];

export const RECORA_CUSTOMER_REPORT_SYNTHETIC_EXPECTED_SENTIMENT = {
  positive: 18,
  neutral: 4,
  negative: 2,
  unclassified: 1
} as const satisfies Record<RecoraCustomerReportSentiment, number>;

export const RECORA_CUSTOMER_REPORT_SYNTHETIC_EVIDENCE: RecoraCustomerReportEvidenceBundle = {
  binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
  items: [
    evidence("citation_occurrence", "owned", 24),
    evidence("citation_occurrence", "competitor", 41),
    evidence("citation_occurrence", "third-party", 78),
    evidence("citation_occurrence", "unknown", 5),
    evidence("normalized_source_url_page", "owned", 16),
    evidence("normalized_source_url_page", "external", 48),
    evidence("question", "recommendation-display", 7),
    evidence("answer", "recommendation-display", 12),
    evidence("normalized_source_url_page", "recommendation-display", 4)
  ]
};

export const RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE = {
  version: RECORA_CUSTOMER_REPORT_SYNTHETIC_FIXTURE_VERSION,
  synthetic: true,
  projectName: "勤怠クラウド",
  period: {
    start: "2026-07-07",
    end: "2026-08-05",
    measuredAt: "2026-08-05"
  },
  modelCount: 4,
  targetBrandCount: 20,
  binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
  observations: RECORA_CUSTOMER_REPORT_SYNTHETIC_OBSERVATIONS,
  expectedSentiment: RECORA_CUSTOMER_REPORT_SYNTHETIC_EXPECTED_SENTIMENT,
  evidence: RECORA_CUSTOMER_REPORT_SYNTHETIC_EVIDENCE,
  expectedMetrics: {
    ai_visibility_rate: { numerator: 57, denominator: 100, value: 57 },
    ai_share_of_voice: { numerator: 57, denominator: 190, value: 30 },
    average_first_position: { numerator: 168, denominator: 57, value: 2.9 },
    owned_site_reference_rate: { numerator: 18, denominator: 100, value: 18 },
    cited_answer_rate: { numerator: 76, denominator: 100, value: 76 }
  } satisfies Record<
    RecoraCustomerReportMetricKey,
    { numerator: number; denominator: number; value: number }
  >
} as const;

function createCoreObservations(): RecoraCustomerReportObservation[] {
  return Array.from({ length: 100 }, (_, index) => {
    const ordinal = index + 1;
    const mentioned = index < 57;
    return {
      observationId: `core-answer-${String(ordinal).padStart(3, "0")}`,
      binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
      promptConfigurationStatus: "finalized",
      measurementDesignStatus: "ready",
      intentKey: `market-intent-${String(ordinal).padStart(3, "0")}`,
      modelKey: `model-${(index % 4) + 1}`,
      panelRole: "core",
      brandScope: "non_branded",
      metricEligibility: eligibility({
        visibility: "eligible",
        ranking: "eligible",
        sov: "eligible",
        natural_citation_observation: "eligible"
      }),
      answerStatus: "valid_answer",
      answerExclusionReason: null,
      sentiment: null,
      targetBrandMentioned: mentioned,
      targetBrandFirstPosition: mentioned ? (index < 54 ? 3 : 2) : null,
      approvedTargetBrandMentionCount: mentioned ? 1 : 0,
      approvedTargetBrandTotalMentionCount: index < 90 ? 2 : 1,
      approvedOwnedUrlCount: index < 18 ? 1 : 0,
      referenceUrlCount: index < 76 ? 1 : 0,
      compatibilityPromptType: "non_branded",
      compatibilityMeasurementPurpose: "visibility"
    };
  });
}

function createSentimentObservations(): RecoraCustomerReportObservation[] {
  return Array.from({ length: 25 }, (_, index) => {
    const ordinal = index + 1;
    const sentiment: RecoraCustomerReportSentiment =
      index < 18 ? "positive" : index < 22 ? "neutral" : index < 24 ? "negative" : "unclassified";
    return {
      observationId: `sentiment-answer-${String(ordinal).padStart(2, "0")}`,
      binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
      promptConfigurationStatus: "finalized",
      measurementDesignStatus: "ready",
      intentKey: `sentiment-intent-${String(ordinal).padStart(2, "0")}`,
      modelKey: `model-${(index % 4) + 1}`,
      panelRole: "core",
      brandScope: "branded",
      metricEligibility: eligibility({
        sentiment: "eligible",
        brand_perception: "eligible"
      }),
      answerStatus: "valid_answer",
      answerExclusionReason: null,
      sentiment,
      targetBrandMentioned: true,
      targetBrandFirstPosition: 1,
      approvedTargetBrandMentionCount: 1,
      approvedTargetBrandTotalMentionCount: 1,
      approvedOwnedUrlCount: 0,
      referenceUrlCount: 0,
      compatibilityPromptType: "branded",
      compatibilityMeasurementPurpose: "sentiment"
    };
  });
}

function createExcludedSentimentObservation(): RecoraCustomerReportObservation {
  return {
    ...createSentimentObservations()[0],
    observationId: "sentiment-provider-error-answer",
    intentKey: "sentiment-provider-error-intent",
    answerStatus: "provider_error",
    answerExclusionReason: "provider_error",
    sentiment: null,
    targetBrandMentioned: false,
    targetBrandFirstPosition: null,
    approvedTargetBrandMentionCount: 0,
    approvedTargetBrandTotalMentionCount: 0
  };
}

function createExcludedObservation(
  observationId: string,
  panelRole: "core" | "robustness" | "diagnostic",
  answerStatus: RecoraCustomerReportObservation["answerStatus"]
): RecoraCustomerReportObservation {
  return {
    observationId,
    binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
    promptConfigurationStatus: "finalized",
    measurementDesignStatus: "ready",
    intentKey: `${panelRole}-control-intent`,
    modelKey: "model-1",
    panelRole,
    brandScope: "non_branded",
    metricEligibility: eligibility({
      visibility: "eligible",
      ranking: "eligible",
      sov: "eligible",
      natural_citation_observation: "eligible"
    }),
    answerStatus,
    answerExclusionReason: answerStatus === "valid_answer" ? null : answerStatus,
    sentiment: null,
    targetBrandMentioned: true,
    targetBrandFirstPosition: 1,
    approvedTargetBrandMentionCount: 20,
    approvedTargetBrandTotalMentionCount: 20,
    approvedOwnedUrlCount: 5,
    referenceUrlCount: 5,
    compatibilityPromptType: "non_branded",
    compatibilityMeasurementPurpose: "ranking"
  };
}

function createForcedCitationObservation(): RecoraCustomerReportObservation {
  return {
    observationId: "forced-citation-answer",
    binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
    promptConfigurationStatus: "finalized",
    measurementDesignStatus: "ready",
    intentKey: "forced-citation-control-intent",
    modelKey: "model-1",
    panelRole: "core",
    brandScope: "named_comparison",
    metricEligibility: eligibility({ forced_citation_validation: "eligible" }),
    answerStatus: "valid_answer",
    answerExclusionReason: null,
    sentiment: null,
    targetBrandMentioned: false,
    targetBrandFirstPosition: null,
    approvedTargetBrandMentionCount: 0,
    approvedTargetBrandTotalMentionCount: 0,
    approvedOwnedUrlCount: 4,
    referenceUrlCount: 4,
    compatibilityPromptType: "citation_check",
    compatibilityMeasurementPurpose: "citation_validation"
  };
}

function eligibility(
  states: Partial<Record<keyof RecoraFixedPromptMetricEligibility, "eligible" | "excluded">>
): RecoraFixedPromptMetricEligibility {
  const entry = (key: keyof RecoraFixedPromptMetricEligibility) => ({
    state: states[key] ?? "excluded",
    reason_codes: [states[key] === "eligible" ? `fixture_${key}_eligible` : `fixture_${key}_excluded`]
  });
  return {
    visibility: entry("visibility"),
    ranking: entry("ranking"),
    sov: entry("sov"),
    sentiment: entry("sentiment"),
    brand_perception: entry("brand_perception"),
    natural_citation_observation: entry("natural_citation_observation"),
    forced_citation_validation: entry("forced_citation_validation"),
    risk_check: entry("risk_check"),
    recommendation_input: entry("recommendation_input")
  };
}

function evidence(
  unit: RecoraCustomerReportEvidenceBundle["items"][number]["unit"],
  group: string,
  count: number
): RecoraCustomerReportEvidenceBundle["items"][number] {
  return {
    binding: RECORA_CUSTOMER_REPORT_SYNTHETIC_BINDING,
    unit,
    group,
    count
  };
}
