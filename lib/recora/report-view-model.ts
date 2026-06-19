import {
  getClientSafeCandidateStatusLabel,
  getSupportsClaimLabel,
  getTemporaryReportViewCaution,
  isEligibleTemporaryReportView,
  isValidObservation
} from "./report-eligibility";
import type { RecoraObservationLike, RecoraRunLike } from "./report-eligibility";

export type TemporaryReportMetricInput = {
  aiVisibility?: number | null;
  mentionCount?: number | null;
  citationCount?: number | null;
  sourceDomainCount?: number | null;
  shareOfVoice?: number | null;
  competitiveGap?: number | null;
};

export type TemporaryReportCandidateInput = {
  id?: string | number | null;
  title?: string | null;
  status?: string | null;
  displayDecision?: string | null;
  priority?: string | null;
  confidence?: string | null;
  caution?: string | null;
};

export type TemporaryReportSourceInput = {
  url?: string | null;
  domain?: string | null;
  title?: string | null;
  supportsClaim?: boolean | null;
};

export type CreateTemporaryReportViewModelInput = {
  run: RecoraRunLike | null | undefined;
  observations?: RecoraObservationLike[];
  metrics?: TemporaryReportMetricInput | null;
  candidates?: TemporaryReportCandidateInput[];
  sources?: TemporaryReportSourceInput[];
};

export type ClientSafeMetric = {
  label: string;
  value: number | null;
  caution?: string;
};

export type TemporaryReportMetricsViewModel = {
  aiVisibility: ClientSafeMetric;
  mentionCount: ClientSafeMetric;
  citationCount: ClientSafeMetric;
  sourceDomainCount: ClientSafeMetric;
  shareOfVoice: ClientSafeMetric;
  competitiveGap: ClientSafeMetric;
};

export type TemporaryReportCandidateViewModel = {
  title: string | null;
  priority: string | null;
  confidence: string | null;
  status: "confirmed_candidate" | "needs_review" | "hidden_internal";
  statusLabel: string;
  statusCaution: string;
  caution: string | null;
};

export type TemporaryReportSourceViewModel = {
  url: string | null;
  domain: string | null;
  title: string | null;
  supportStatus: "supported" | "insufficient" | "unreviewed";
  supportLabel: string;
};

export type TemporaryReportClientDisplayReadiness = {
  status: "blocked" | "ready_with_caution";
  label: string;
  blockingReasons: string[];
};

export type TemporaryReportViewModel = {
  runPrerequisitesMet: boolean;
  clientDisplayReadiness: TemporaryReportClientDisplayReadiness;
  statusLabel: string;
  cautions: string[];
  validObservationCount: number;
  invalidObservationCount: number;
  metrics: TemporaryReportMetricsViewModel;
  candidates: TemporaryReportCandidateViewModel[];
  sources: TemporaryReportSourceViewModel[];
};

export function createTemporaryReportViewModel(
  input: CreateTemporaryReportViewModelInput
): TemporaryReportViewModel {
  const run = input.run ?? {};
  const observations = input.observations ?? [];
  const validObservationCount = observations.filter(isValidObservation).length;
  const invalidObservationCount = observations.length - validObservationCount;
  const runPrerequisitesMet = isEligibleTemporaryReportView(run);
  const blockingReasons = createBlockingReasons(runPrerequisitesMet, validObservationCount);
  const clientDisplayReadiness = createClientDisplayReadiness(blockingReasons);

  return {
    runPrerequisitesMet,
    clientDisplayReadiness,
    statusLabel: clientDisplayReadiness.label,
    cautions: createCautions(run, invalidObservationCount),
    validObservationCount,
    invalidObservationCount,
    metrics: createMetricsViewModel(input.metrics ?? null),
    candidates: (input.candidates ?? []).map(createCandidateViewModel),
    sources: (input.sources ?? []).map(createSourceViewModel)
  };
}

function createBlockingReasons(runPrerequisitesMet: boolean, validObservationCount: number) {
  const blockingReasons: string[] = [];

  if (!runPrerequisitesMet) {
    blockingReasons.push("暫定report viewの必要条件を満たしていません");
  }

  if (validObservationCount === 0) {
    blockingReasons.push("有効観測がありません");
  }

  return blockingReasons;
}

function createClientDisplayReadiness(
  blockingReasons: string[]
): TemporaryReportClientDisplayReadiness {
  if (blockingReasons.length > 0) {
    return {
      status: "blocked",
      label: "表示条件未達",
      blockingReasons
    };
  }

  return {
    status: "ready_with_caution",
    label: "暫定report view（注意付き）",
    blockingReasons
  };
}

function createCautions(run: RecoraRunLike, invalidObservationCount: number) {
  const cautions = [
    ...getTemporaryReportViewCaution(run),
    "citation countは根拠確認済み数ではありません。",
    "candidate（改善候補）は承認済み施策ではありません。"
  ];

  if (invalidObservationCount > 0) {
    cautions.push("失敗・途中・parse errorは集計母数から除外しています。");
  }

  return cautions;
}

function createMetricsViewModel(metrics: TemporaryReportMetricInput | null): TemporaryReportMetricsViewModel {
  return {
    aiVisibility: {
      label: "AI可視性（RECORA独自の観測指標）",
      value: metrics?.aiVisibility ?? null,
      caution: "AIプラットフォーム公式評価ではなく、RECORA独自の観測値です。"
    },
    mentionCount: {
      label: "表示・言及観測数",
      value: metrics?.mentionCount ?? null
    },
    citationCount: {
      label: "参照として出現した数",
      value: metrics?.citationCount ?? null,
      caution: "URLの出現数であり、根拠確認済み件数ではありません。"
    },
    sourceDomainCount: {
      label: "参照ドメイン数",
      value: metrics?.sourceDomainCount ?? null
    },
    shareOfVoice: {
      label: "AI回答内シェア（観測値）",
      value: metrics?.shareOfVoice ?? null,
      caution: "同一条件の観測範囲内でのみ比較します。"
    },
    competitiveGap: {
      label: "観測上の差分",
      value: metrics?.competitiveGap ?? null,
      caution: "勝ち負けではなく、同一条件での観測差分です。"
    }
  };
}

function createCandidateViewModel(candidate: TemporaryReportCandidateInput): TemporaryReportCandidateViewModel {
  const status = getClientSafeCandidateStatusLabel(candidate.status, candidate.displayDecision);

  return {
    title: normalizeText(candidate.title),
    priority: normalizeText(candidate.priority),
    confidence: normalizeText(candidate.confidence),
    status: status.status,
    statusLabel: status.label,
    statusCaution: status.caution,
    caution: normalizeText(candidate.caution)
  };
}

function createSourceViewModel(source: TemporaryReportSourceInput): TemporaryReportSourceViewModel {
  const supportsClaim = getSupportsClaimLabel(source.supportsClaim);

  return {
    url: normalizeText(source.url),
    domain: normalizeText(source.domain),
    title: normalizeText(source.title),
    supportStatus: supportsClaim.status,
    supportLabel: supportsClaim.label
  };
}

function normalizeText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
