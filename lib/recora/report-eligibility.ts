export type RecoraRunLike = {
  id?: string | number | null;
  status?: string | null;
  run_kind?: string | null;
  metadata?: Record<string, unknown> | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export type RecoraObservationLike = {
  status?: string | null;
  ai_conversation_id?: string | number | null;
  parse_status?: string | null;
  provider_error?: string | null;
};

export type SupportsClaimValue = boolean | null | undefined;
export type ClientSafeSupportStatus = "supported" | "insufficient" | "unreviewed";
export type ClientSafeCandidateStatus = "confirmed_candidate" | "needs_review" | "hidden_internal";

export type ClientSafeSupportLabel = {
  status: ClientSafeSupportStatus;
  label: string;
};

export type ClientSafeCandidateStatusLabel = {
  status: ClientSafeCandidateStatus;
  label: string;
  caution: string;
};

export type RecoraReportReadyCustomerStatus = "customer_ready" | "not_ready";
export type RecoraReportReadyAdminStatus = "admin_diagnostic";
export type RecoraReportReadyReasonSeverity = "blocking" | "diagnostic";

export type RecoraReportReadyReason = {
  code: string;
  severity: RecoraReportReadyReasonSeverity;
  message: string;
};

export type RecoraReportDataOriginStatus = "customer_data" | "demo_or_local" | "unknown";

export type RecoraReportReadyGateInput = {
  projectSlug?: string | null;
  projectExists: boolean;
  run?: RecoraRunLike | null;
  metricSnapshotCount?: number | null;
  validObservationCount?: number | null;
  hasPlaceholderEvidence?: boolean;
  dataOriginStatus?: RecoraReportDataOriginStatus | null;
  sourceMeasurementRunId?: string | null;
  measurementProfileId?: string | null;
  promptSetVersion?: string | null;
  customerVisibleRecommendationCount?: number | null;
  internalRecommendationCandidateCount?: number | null;
};

export type RecoraReportReadyGateResult = {
  status: RecoraReportReadyCustomerStatus;
  customer: {
    status: RecoraReportReadyCustomerStatus;
    label: string;
    message: string;
  };
  adminDiagnostic: {
    status: RecoraReportReadyAdminStatus;
    projectSlug: string | null;
    blockingReasons: RecoraReportReadyReason[];
    diagnosticNotes: RecoraReportReadyReason[];
    sourceMeasurementRunId: string | null;
    measurementProfileId: string | null;
    promptSetVersion: string | null;
    dataOriginStatus: RecoraReportDataOriginStatus;
    metricSnapshotCount: number;
    validObservationCount: number;
    customerVisibleRecommendationCount: number | null;
    internalRecommendationCandidateCount: number | null;
  };
};

export type RecoraRecommendationPublicationState =
  | "customer_visible"
  | "review_required"
  | "pre_quality_gate"
  | "candidate_only"
  | "hidden_internal";

export type RecoraRecommendationPublicationInput = {
  status?: string | null;
  displayDecision?: string | null;
  metadata?: Record<string, unknown> | null;
};

const RECORA_SEED_MEASUREMENT_RUN_ID = "70000000-0000-4000-8000-000000000001";

export function getMetadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

export function isOpenAiMeasurementRun(run: RecoraRunLike) {
  return getMetadataString(run.metadata, "data_source") === "openai_measurement";
}

export function isAggregateRun(run: RecoraRunLike) {
  return run.run_kind === "aggregate" || getMetadataString(run.metadata, "run_kind") === "aggregate";
}

export function isCompletedRun(run: RecoraRunLike) {
  return run.status === "completed";
}

export function isEligibleTemporaryReportView(run: RecoraRunLike) {
  // P0 temporary report view eligibility is a necessary condition only; it is not formal report approval.
  return isOpenAiMeasurementRun(run) && isAggregateRun(run) && isCompletedRun(run);
}

export function evaluateRecoraReportReadyGate(input: RecoraReportReadyGateInput): RecoraReportReadyGateResult {
  const run = input.run ?? null;
  const metadata = run?.metadata ?? null;
  const projectSlug = normalizeNullableText(input.projectSlug);
  const metricSnapshotCount = normalizeCount(input.metricSnapshotCount);
  const validObservationCount = normalizeCount(input.validObservationCount);
  const sourceMeasurementRunId =
    normalizeNullableText(input.sourceMeasurementRunId) ?? getMetadataString(metadata, "source_run_id");
  const measurementProfileId =
    normalizeNullableText(input.measurementProfileId) ??
    getMetadataString(metadata, "measurement_profile_id") ??
    getMetadataString(metadata, "source_measurement_profile_id");
  const promptSetVersion =
    normalizeNullableText(input.promptSetVersion) ??
    getMetadataString(metadata, "prompt_set_version") ??
    getMetadataString(metadata, "source_prompt_set_version");
  const dataOriginStatus = input.dataOriginStatus ?? "unknown";
  const customerVisibleRecommendationCount = normalizeNullableCount(input.customerVisibleRecommendationCount);
  const internalRecommendationCandidateCount = normalizeNullableCount(input.internalRecommendationCandidateCount);
  const blockingReasons: RecoraReportReadyReason[] = [];
  const diagnosticNotes: RecoraReportReadyReason[] = [];

  if (!input.projectExists) {
    blockingReasons.push(createReportReadyReason("project_not_found", "blocking", "Project slug was not found."));
  }

  if (!run) {
    blockingReasons.push(createReportReadyReason("report_run_not_found", "blocking", "No completed reporting run was found."));
  } else {
    if (String(run.id ?? "") === RECORA_SEED_MEASUREMENT_RUN_ID) {
      blockingReasons.push(createReportReadyReason("seed_measurement_run", "blocking", "Seed measurement run cannot be used as customer report evidence."));
    }
    if (!isCompletedRun(run)) {
      blockingReasons.push(createReportReadyReason("report_run_not_completed", "blocking", "The latest reporting run is not completed."));
    }
    if (!isOpenAiMeasurementRun(run)) {
      blockingReasons.push(createReportReadyReason("report_run_not_openai_measurement", "blocking", "The reporting run is not marked as OpenAI measurement data."));
    }
    if (!isAggregateRun(run)) {
      blockingReasons.push(createReportReadyReason("report_run_not_aggregate", "blocking", "The reporting run is not an aggregate run."));
    }
  }

  if (!sourceMeasurementRunId) {
    blockingReasons.push(createReportReadyReason("source_measurement_run_missing", "blocking", "The aggregate run is not linked to a source measurement run."));
  } else if (sourceMeasurementRunId === RECORA_SEED_MEASUREMENT_RUN_ID) {
    blockingReasons.push(createReportReadyReason("seed_source_measurement_run", "blocking", "Seed source measurement run cannot be used as customer report evidence."));
  }

  if (metricSnapshotCount <= 0) {
    blockingReasons.push(createReportReadyReason("metric_snapshots_missing", "blocking", "Metric snapshots are missing for the report run."));
  }

  if (validObservationCount <= 0) {
    blockingReasons.push(createReportReadyReason("valid_observations_missing", "blocking", "No valid measured observations are available for the report."));
  }

  if (input.hasPlaceholderEvidence === undefined || dataOriginStatus === "unknown") {
    blockingReasons.push(createReportReadyReason("data_origin_unknown", "blocking", "Report data origin is unknown."));
  } else if (input.hasPlaceholderEvidence || dataOriginStatus === "demo_or_local") {
    blockingReasons.push(createReportReadyReason("placeholder_evidence_detected", "blocking", "Placeholder, seed, example, demo, or local-only evidence may be mixed into the customer report."));
  }

  if (!measurementProfileId && !promptSetVersion) {
    if (sourceMeasurementRunId) {
      diagnosticNotes.push(createReportReadyReason("measurement_profile_legacy_source_only", "diagnostic", "The source measurement run is known, but measurement profile or prompt set version is not explicit on the aggregate metadata."));
    } else {
      blockingReasons.push(createReportReadyReason("measurement_profile_unknown", "blocking", "Measurement profile or prompt set version cannot be identified."));
    }
  }

  if ((internalRecommendationCandidateCount ?? 0) > 0 && (customerVisibleRecommendationCount ?? 0) === 0) {
    diagnosticNotes.push(createReportReadyReason("recommendations_not_customer_visible", "diagnostic", "Recommendation candidates exist, but none are marked customer-visible."));
  }

  const status: RecoraReportReadyCustomerStatus = blockingReasons.length > 0 ? "not_ready" : "customer_ready";

  return {
    status,
    customer: {
      status,
      label: status === "customer_ready" ? "Report ready" : "Report preparation in progress",
      message: status === "customer_ready"
        ? "This report passed the Phase 1 customer display gate."
        : "This report is not ready for customer display yet."
    },
    adminDiagnostic: {
      status: "admin_diagnostic",
      projectSlug,
      blockingReasons,
      diagnosticNotes,
      sourceMeasurementRunId,
      measurementProfileId,
      promptSetVersion,
      dataOriginStatus,
      metricSnapshotCount,
      validObservationCount,
      customerVisibleRecommendationCount,
      internalRecommendationCandidateCount
    }
  };
}

export function getRecommendationPublicationState(
  input: RecoraRecommendationPublicationInput
): RecoraRecommendationPublicationState {
  const metadata = input.metadata ?? {};
  const status = normalizeToken(input.status);
  const displayDecision = normalizeToken(input.displayDecision ?? getMetadataString(metadata, "display_decision"));
  const shouldSave = normalizeToken(getMetadataString(metadata, "should_save_to_recommendations"));
  const qualityDecision = normalizeToken(
    getMetadataString(metadata, "quality_gate_decision") ??
    getMetadataString(metadata, "gate_decision") ??
    getMetadataString(metadata, "decision")
  );
  const publicationState = normalizeToken(
    getMetadataString(metadata, "publication_state") ??
    getMetadataString(metadata, "customer_visibility") ??
    getMetadataString(metadata, "display_stage")
  );

  if (
    ["dismiss", "dismissed", "reject", "rejected", "hide", "hidden", "suppress"].includes(status) ||
    ["hide", "hidden", "suppress"].includes(displayDecision) ||
    qualityDecision === "suppress" ||
    ["hidden_internal", "hide", "hidden", "suppress"].includes(publicationState)
  ) {
    return "hidden_internal";
  }

  if (
    qualityDecision === "hold" ||
    shouldSave === "review_required" ||
    status === "hold" ||
    status === "review_required" ||
    publicationState === "review_required"
  ) {
    return "review_required";
  }

  if (shouldSave === "candidate_only" || status === "candidate_only" || publicationState === "candidate_only") {
    return "candidate_only";
  }

  if (publicationState === "pre_quality_gate") {
    return "pre_quality_gate";
  }

  if (["customer_visible", "published", "client_visible"].includes(publicationState)) {
    return "customer_visible";
  }

  if (publicationState) {
    return "review_required";
  }

  if (qualityDecision === "auto_publish" && displayDecision === "show") {
    return "customer_visible";
  }

  if (displayDecision === "show" || !qualityDecision) {
    return "pre_quality_gate";
  }

  return "review_required";
}

export function isCustomerVisibleRecommendation(input: RecoraRecommendationPublicationInput) {
  return getRecommendationPublicationState(input) === "customer_visible";
}

export function isValidObservation(observation: RecoraObservationLike) {
  // valid observation は「観測できた回答」だけを表す。
  // failed / partial / timeout / parse error は absence や trend の母数に混ぜない。
  if (!hasConversationId(observation.ai_conversation_id)) return false;
  if (isUnsafeStatus(observation.status)) return false;
  if (!isSuccessfulStatus(observation.status)) return false;
  if (!isValidParseStatus(observation.parse_status)) return false;
  if (hasProviderError(observation.provider_error)) return false;

  return true;
}

export function getSupportsClaimLabel(value: SupportsClaimValue): ClientSafeSupportLabel {
  if (value === true) {
    return { status: "supported", label: "根拠として確認" };
  }

  if (value === false) {
    return { status: "insufficient", label: "根拠不十分" };
  }

  return { status: "unreviewed", label: "根拠確認は未確認" };
}

export function getClientSafeCandidateStatusLabel(
  status: string | null | undefined,
  displayDecision?: string | null
): ClientSafeCandidateStatusLabel {
  const normalizedStatus = normalizeToken(status);
  const normalizedDecision = normalizeToken(displayDecision);

  if (["rejected", "hidden", "suppress"].includes(normalizedStatus) || ["hide", "hidden", "suppress"].includes(normalizedDecision)) {
    return {
      status: "hidden_internal",
      label: "内部非表示",
      caution: "顧客向けには表示しません。"
    };
  }

  if (["approved", "confirmed"].includes(normalizedStatus)) {
    return {
      status: "confirmed_candidate",
      label: "改善候補",
      caution: "確認済みの改善候補です。ただし成果を保証するものではありません。"
    };
  }

  if (["review_required", "machine_generated", "open"].includes(normalizedStatus) || normalizedDecision === "show") {
    return {
      status: "needs_review",
      label: "確認中",
      caution: "表示候補であり、推奨施策として確定または承認済みではありません。根拠確認が必要です。"
    };
  }

  return {
    status: "needs_review",
    label: "確認中",
    caution: "状態を確認中です。顧客向けには確定施策として表示しません。"
  };
}

export function getTemporaryReportViewCaution(run: RecoraRunLike) {
  const cautions = [
    "これは正式なreport entityではなく、UI表示用の暫定report viewです。",
    "completed aggregateは必要条件であり、顧客向けreportとして十分条件ではありません。",
    "seedを含む測定はorganic discoveryの証拠として扱いません。",
    "failed / partial / parse error はabsenceやtrendに混ぜません。"
  ];

  if (!isEligibleTemporaryReportView(run)) {
    cautions.unshift("このrunはP0の暫定report view条件を満たしていません。");
  }

  return cautions;
}

function hasConversationId(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" && value.trim().length > 0;
}

function isUnsafeStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  return ["failed", "partial", "cancelled", "canceled", "error", "timeout"].includes(normalized);
}

function isSuccessfulStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  return ["completed", "success", "succeeded", "ok"].includes(normalized);
}

function isUnsafeParseStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  return ["failed", "partial", "error", "timeout"].includes(normalized);
}

function isValidParseStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (!normalized) return true;
  if (isUnsafeParseStatus(value)) return false;
  return ["completed", "success", "succeeded", "ok", "parsed"].includes(normalized);
}

function hasProviderError(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeToken(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createReportReadyReason(
  code: string,
  severity: RecoraReportReadyReasonSeverity,
  message: string
): RecoraReportReadyReason {
  return { code, severity, message };
}

function normalizeCount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeNullableCount(value: number | null | undefined) {
  return value === null || value === undefined ? null : normalizeCount(value);
}

function normalizeNullableText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
