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
