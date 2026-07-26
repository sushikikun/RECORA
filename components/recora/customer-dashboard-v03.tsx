"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Filter,
  Search,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DataRichBadge,
  DataRichInlineBar,
  DataRichKpiStrip,
  DataRichPageHeader,
  DataRichPanel,
  DataRichPrimaryAction,
  DataRichSectionIndex,
  DataRichStackedBar,
  DataRichTableWrap,
  DataRichToolbar
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  AnswerDetailAdvancedPanels,
  getAnswerPreviewText,
  BrandAdvancedPanels,
  CitationAdvancedPanels,
  ClaimDetailContent,
  PersonaDetailContent,
  PersonaTopicAdvancedPanels,
  PromptDetailAdvancedPanels,
  RecommendationAdvancedPanels,
  RecommendationDetailContent,
  SourceDomainDetailContent,
  SourcePageDetailContent,
  TopicDetailContent,
  TrendAnalysisContent,
  TrendChangesDetailContent
} from "@/components/recora/customer-dashboard-v03-analysis";
import { MetricLineChart } from "@/components/recora/customer-dashboard-v03-analysis-visuals";
import { buildCustomerPageKpiDetail } from "@/components/recora/customer-dashboard-v03-page-details";
import type {
  CustomerAnswerModelBreakdown,
  CustomerSentimentCounts,
  CustomerSentimentSummary
} from "@/components/recora/customer-dashboard-v03-page-details";
import {
  resolveSourceDomainDisplayName,
  resolveSourcePageDisplayName
} from "@/components/recora/customer-analysis/source-details";
import { ReportHelpTooltip } from "@/components/recora/report-ui/report-help-tooltip";
import {
  ReportDetailButton,
  ReportDetailDrawer,
  ReportDetailScopeProvider,
  openReportDetail,
  useReportDetailController,
  type ReportDetailPayload
} from "@/components/recora/report-ui/report-detail-drawer";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type RecoraCustomerDashboardV03PageId =
  | "overview"
  | "trends"
  | "trendChanges"
  | "personaDetail"
  | "topicDetail"
  | "sourceDomainDetail"
  | "citationGapDetail"
  | "sourcePageDetail"
  | "claimDetail"
  | "recommendationDetail"
  | "brandCompetitors"
  | "brandComparison"
  | "brandMarket"
  | "brandRanking"
  | "brandCompetitorDetail"
  | "personaTopics"
  | "prompts"
  | "promptDetail"
  | "answers"
  | "answerDetail"
  | "citations"
  | "brandPerception"
  | "recommendations"
  | "settings";

type RecoraCustomerDashboardV03Props = {
  page: RecoraCustomerDashboardV03PageId;
  projectSlug?: string;
  projectName?: string;
  competitorName?: string;
  detailId?: string;
};

type PageContext = {
  projectSlug: string;
  reportBase: string;
  projectName: string;
  competitorName: string;
  detailId?: string;
  range: ReportRange;
  provider: ReportProvider;
  onRange: (range: ReportRange) => void;
  onProvider: (provider: ReportProvider) => void;
};

const reportRanges = ["7日", "30日", "90日", "180日", "365日"] as const;
type ReportRange = (typeof reportRanges)[number];

const reportProviders = ["全モデル", "GPT", "Gemini", "Perplexity", "Google AI Mode"] as const;
type ReportProvider = (typeof reportProviders)[number];

const reportSectionMeta: Record<string, { number: string; label: string }> = {
  "ダッシュボード概要": { number: "01", label: "CUSTOMER REPORT" },
  "ブランド・競合": { number: "02", label: "CUSTOMER REPORT" },
  "ペルソナ・トピック": { number: "03", label: "CUSTOMER REPORT" },
  "プロンプト": { number: "04", label: "CUSTOMER REPORT" },
  "AI回答": { number: "05", label: "CUSTOMER REPORT" },
  "引用・参照元": { number: "06", label: "CUSTOMER REPORT" },
  "ブランド認識・感情": { number: "07", label: "CUSTOMER REPORT" },
  "推移・変化": { number: "08", label: "CUSTOMER REPORT" },
  "改善提案・施策": { number: "09", label: "CUSTOMER REPORT" },
  "設定・連携": { number: "10", label: "CUSTOMER REPORT" }
};

const dashboardQuestionCount = 128;
const dashboardPlan = {
  name: "Professional",
  modelCount: 4 as 1 | 2 | 3 | 4
};
const dashboardModelCount = dashboardPlan.modelCount;

function observationScope(period: string, days: number, missingWithFourModels: number) {
  const expected = dashboardQuestionCount * dashboardModelCount * days;
  const missing = Math.round(missingWithFourModels * dashboardModelCount / 4);
  const valid = Math.max(0, expected - missing);
  return {
    period,
    validObservations: `${valid.toLocaleString("ja-JP")}件`,
    expectedObservations: `${expected.toLocaleString("ja-JP")}件`,
    missingObservations: `${missing.toLocaleString("ja-JP")}件`,
    successRate: `${(valid / Math.max(1, expected) * 100).toFixed(1)}%`
  };
}

const rangeScope: Record<ReportRange, {
  period: string;
  validObservations: string;
  expectedObservations: string;
  missingObservations: string;
  successRate: string;
}> = {
  "7日": observationScope("2026-06-30 - 2026-07-06", 7, 90),
  "30日": observationScope("2026-06-07 - 2026-07-06", 30, 384),
  "90日": observationScope("2026-04-08 - 2026-07-06", 90, 1_152),
  "180日": observationScope("2026-01-08 - 2026-07-06", 180, 2_304),
  "365日": observationScope("2025-07-07 - 2026-07-06", 365, 4_800)
};

const latestObservationScope = observationScope("2026-07-06", 1, 13);
const latestScope = {
  measurementDate: latestObservationScope.period,
  validObservations: latestObservationScope.validObservations,
  expectedObservations: latestObservationScope.expectedObservations,
  missingObservations: latestObservationScope.missingObservations,
  successRate: latestObservationScope.successRate
};

const dashboardScope = {
  period: "2026-06-01 - 2026-06-30",
  observations: "1,248件",
  confidence: "高",
  plan: dashboardPlan.name,
  updatedAt: "2026-07-06 09:30",
  questionCount: dashboardQuestionCount,
  modelCount: dashboardModelCount,
  frequency: "毎日1回",
  regionLanguage: "日本・日本語"
};

const kpis = {
  visibilityScore: 68,
  aiPresenceRate: 57,
  sov: 24,
  averagePosition: 2.8,
  ownCitationRate: 31,
  brandRank: 3
};

type PageTakeaway = {
  title: string;
  description: string;
  facts: { label: string; value: string; tone?: "default" | "green" | "amber" }[];
};

const trendTakeawayByRange: Record<ReportRange, { aiPresence: number; citation: number; citationDelta: number }> = {
  "7日": { aiPresence: 58, citation: 32, citationDelta: 1 },
  "30日": { aiPresence: 57, citation: 31, citationDelta: 4 },
  "90日": { aiPresence: 55, citation: 29, citationDelta: 6 },
  "180日": { aiPresence: 52, citation: 27, citationDelta: 8 },
  "365日": { aiPresence: 48, citation: 23, citationDelta: 10 }
};

function resolvePageTakeaway(eyebrow: string, title: string, range: ReportRange): PageTakeaway | null {
  if (title.includes(" vs ")) {
    return { title: "RecoraはAI表示率で17pt差。主要比較軸は2勝8敗です。", description: "自社と選択競合の差を、ペルソナ・トピック・モデル・引用元へ分解して確認します。", facts: [{ label: "Recora", value: "57%", tone: "green" }, { label: "Trailbase", value: "74%" }, { label: "直接対決", value: "2勝 / 8敗", tone: "amber" }] };
  }
  if (title.includes("ペルソナ詳細")) {
    return { title: "マーケ責任者ではAI表示率69%。公式サイト引用率は37%です。", description: "このペルソナで選ばれる話題と、競合が先行する根拠を同じ画面で確認します。", facts: [{ label: "AI表示率", value: "69%", tone: "green" }, { label: "公式サイト引用率", value: "37%" }, { label: "最多引用元", value: "marketing-ai.jp" }] };
  }
  if (title.includes("トピック詳細")) {
    return { title: "競合比較トピックはRecora 57%、Trailbase 78%です。", description: "21ptの差を、ペルソナ・モデル・引用元・直接対決へ分解します。", facts: [{ label: "Recora", value: "57%", tone: "green" }, { label: "Trailbase", value: "78%" }, { label: "差", value: "-21pt", tone: "amber" }] };
  }
  if (title.includes("プロンプト詳細")) {
    return { title: "この質問ではRecoraが2番目、Trailbaseが先行しています。", description: "モデル別結果、最新回答、引用URL、回答内の主張を省略せず確認します。", facts: [{ label: "AI表示率", value: "58%", tone: "green" }, { label: "平均掲載位置", value: "2.7位" }, { label: "先行競合", value: "Trailbase", tone: "amber" }] };
  }
  if (title.includes("AI回答詳細")) {
    return { title: "Recoraは2位。引用3件は回答内容と一致しています。", description: "競合先行の文脈、引用URL、ブランドの役割、回答内の主張と根拠の対応を確認します。", facts: [{ label: "掲載位置", value: "2位", tone: "green" }, { label: "引用", value: "3件" }, { label: "検証", value: "引用一致" }] };
  }
  if (title.includes("引用ドメイン詳細")) {
    return { title: "marketing-ai.jpは76回答をカバーし、前期間から22回答増えています。", description: "どのモデル・ペルソナ・引用ページで使われたかを確認します。", facts: [{ label: "回答カバー", value: "76回答", tone: "green" }, { label: "前期間差", value: "+22回答" }, { label: "引用", value: "104回 / 8URL" }] };
  }
  if (title.includes("引用URL詳細")) {
    return { title: "このURLは34回答をカバーし、7回答では自社名が掲載されていません。", description: "引用された回答と、自社ページが選ばれなかった観測を分けて確認します。", facts: [{ label: "回答カバー", value: "34回答", tone: "green" }, { label: "前期間差", value: "+11回答" }, { label: "引用のみ", value: "7回答", tone: "amber" }] };
  }
  if (title.includes("主張・公式事実差分詳細")) {
    return { title: "古い料金情報が6回答・2モデルで14日継続しています。", description: "AIの主張、公式事実、引用元、影響範囲を分けて確認します。", facts: [{ label: "重大度", value: "高", tone: "amber" }, { label: "影響回答", value: "6回答" }, { label: "継続", value: "14日" }] };
  }
  if (title === "改善提案詳細") {
    return { title: scopeModelCountText("42観測・3モデルで14日継続した根拠を持つ高優先度候補です。"), description: "何を直すか、影響範囲、実施内容、確認方法をこの詳細内だけで確認します。", facts: [{ label: "優先度", value: "高", tone: "amber" }, { label: "影響", value: scopeModelCountText("42観測 / 3モデル") }, { label: "対象", value: "/compare" }] };
  }

  const promptUnlistedTotal = promptRows.filter((row) => promptMatchesView(row, "自社未掲載")).length;
  const promptCompetitorAheadTotal = promptRows.filter((row) => promptMatchesView(row, "競合先行")).length;
  const recommendationHighTotal = improvementRows.filter((row) => row.priority === "高").length;
  const validAnswerTotal = answerRows.filter((row) => row.retrievalStatus === "取得済み").length;
  const listedAnswerTotal = answerRows.filter((row) => row.retrievalStatus === "取得済み" && row.listed === "掲載あり").length;
  const unlistedAnswerTotal = validAnswerTotal - listedAnswerTotal;
  const verificationAttentionTotal = answerRows.filter((row) => row.retrievalStatus === "取得済み" && row.verification === "要確認").length;

  const takeaways: Record<string, PageTakeaway> = {
    "ブランド・競合": { title: "自社は3位。首位TrailbaseまではAI表示率17pt差です。", description: "ランキングだけでなく、AI内シェア・モデル・ペルソナ・トピックへ差を分解します。", facts: [{ label: "自社順位", value: "3位", tone: "green" }, { label: "AI表示率", value: "57%" }, { label: "首位との差", value: "-17pt", tone: "amber" }] },
    "ペルソナ・トピック": { title: "最も強い組み合わせは、マーケ責任者 × 競合比較です。", description: "最も弱い組み合わせまで同じ質問集合・モデル条件で確認します。", facts: [{ label: "最も強い", value: "69%", tone: "green" }, { label: "最も弱い", value: "26%", tone: "amber" }, { label: "固定質問", value: "128件" }] },
    "プロンプト": { title: "固定質問" + promptRows.length + "件を30日集計で比較します。", description: "掲載状況・競合先行・自社引用を確認し、気になる質問から1件分析へ進みます。", facts: [{ label: "質問集合", value: promptRows.length + "件" }, { label: "自社未掲載", value: promptUnlistedTotal + "件", tone: "amber" }, { label: "競合先行", value: promptCompetitorAheadTotal + "件" }] },
    "AI回答": { title: `有効回答${validAnswerTotal}件のうち、掲載${listedAnswerTotal}件・未掲載${unlistedAnswerTotal}件です。`, description: "掲載有無、推薦順、競合先行、引用と回答内の主張の一致を分けて確認します。", facts: [{ label: "掲載", value: `${listedAnswerTotal}件`, tone: "green" }, { label: "未掲載", value: `${unlistedAnswerTotal}件`, tone: "amber" }, { label: "検証注意", value: `${verificationAttentionTotal}件` }] },
    "引用・参照元": { title: "総引用136件。最多引用元はrecora.jpの42件です。", description: "自社引用、第三者ソース、競合だけが使われる引用元を分けて確認します。", facts: [{ label: "総引用", value: "136件" }, { label: "公式サイト引用率", value: "31%", tone: "green" }, { label: "最多ドメイン", value: "recora.jp / 42件" }] },
    "ブランド認識・感情": { title: "感情リスクは6件。古い料金情報の継続が確認対象です。", description: "全有効回答を分母にした感情傾向と、ブランド質問だけの内訳を分けて確認します。", facts: [{ label: "ポジティブ", value: "62%", tone: "green" }, { label: "ネガティブ", value: "7%" }, { label: "リスク", value: "6件", tone: "amber" }] },
    "改善提案・施策": { title: `${improvementRows.length}件の候補のうち、${recommendationHighTotal}件が高優先度です。`, description: "このページ内だけで、観測根拠・対象・影響範囲・確認方法を確認します。", facts: [{ label: "候補", value: `${improvementRows.length}件` }, { label: "高優先度", value: `${recommendationHighTotal}件`, tone: "amber" }, { label: "最上位の影響", value: scopeModelCountText("42観測 / 3モデル") }] },
    "設定・連携": { title: `Professionalプランで、${activeModels.length}モデル・最大200プロンプトを利用できます。`, description: "プロジェクト、出力、プラン、ガイドをこのページにまとめています。", facts: [{ label: "プラン", value: "Professional", tone: "green" }, { label: "AIモデル", value: `${activeModels.length}モデル` }, { label: "上限", value: "200プロンプト" }] }
  };

  if (eyebrow === "推移・変化") {
    const trend = trendTakeawayByRange[range];
    return { title: `${range}では公式サイト引用率が前期間比+${trend.citationDelta}ptです。`, description: "AI表示率・AI内シェア・掲載位置・ランキング・引用を、同じ期間とモデル条件で比較します。", facts: [{ label: "AI表示率", value: `${trend.aiPresence}%`, tone: "green" }, { label: "公式サイト引用率", value: `${trend.citation}%` }, { label: "前期間差", value: `+${trend.citationDelta}pt` }] };
  }

  return takeaways[eyebrow] ?? null;
}

const visibilityTrend = [44, 47, 49, 51, 50, 54, 56, 57];

const overviewScoreTrend = [
  { date: "06/30", value: 61 },
  { date: "07/01", value: 62 },
  { date: "07/02", value: 63 },
  { date: "07/03", value: 62 },
  { date: "07/04", value: 65 },
  { date: "07/05", value: 66 },
  { date: "07/06", value: 68 }
];

const competitors = [
  { id: "recora", name: "Recora", logoUrl: "/brand/recora-mark.svg", aiPresence: 57, sov: 24, rank: 3, averagePosition: 2.8, citationRate: 31, delta: 3, isPrimary: true },
  { id: "trailbase", name: "Trailbase", logoUrl: null, aiPresence: 74, sov: 34, rank: 1, averagePosition: 1.7, citationRate: 45, delta: 4, isPrimary: false },
  { id: "signalnest", name: "SignalNest", logoUrl: null, aiPresence: 63, sov: 27, rank: 2, averagePosition: 2.2, citationRate: 36, delta: 1, isPrimary: false },
  { id: "mentionmap", name: "MentionMap", logoUrl: null, aiPresence: 48, sov: 18, rank: 4, averagePosition: 3.4, citationRate: 22, delta: -2, isPrimary: false },
  { id: "ranklens", name: "RankLens", logoUrl: null, aiPresence: 42, sov: 15, rank: 5, averagePosition: 3.9, citationRate: 18, delta: 0, isPrimary: false },
  { id: "answergrid", name: "AnswerGrid", logoUrl: null, aiPresence: 39, sov: 13, rank: 6, averagePosition: 4.1, citationRate: 17, delta: 2, isPrimary: false },
  { id: "queryscope", name: "QueryScope", logoUrl: null, aiPresence: 37, sov: 12, rank: 7, averagePosition: 4.3, citationRate: 16, delta: -1, isPrimary: false },
  { id: "sourcepilot", name: "SourcePilot", logoUrl: null, aiPresence: 35, sov: 11, rank: 8, averagePosition: 4.5, citationRate: 24, delta: 1, isPrimary: false },
  { id: "promptatlas", name: "PromptAtlas", logoUrl: null, aiPresence: 33, sov: 10, rank: 9, averagePosition: 4.7, citationRate: 15, delta: 0, isPrimary: false },
  { id: "visiblenote", name: "VisibleNote", logoUrl: null, aiPresence: 31, sov: 9, rank: 10, averagePosition: 4.8, citationRate: 14, delta: -2, isPrimary: false },
  { id: "modelwatch", name: "ModelWatch", logoUrl: null, aiPresence: 29, sov: 8, rank: 11, averagePosition: 5.0, citationRate: 13, delta: 1, isPrimary: false },
  { id: "citemeter", name: "CiteMeter", logoUrl: null, aiPresence: 27, sov: 7, rank: 12, averagePosition: 5.2, citationRate: 21, delta: 3, isPrimary: false },
  { id: "answerpath", name: "AnswerPath", logoUrl: null, aiPresence: 25, sov: 6, rank: 13, averagePosition: 5.3, citationRate: 12, delta: -1, isPrimary: false },
  { id: "searchsignal", name: "SearchSignal", logoUrl: null, aiPresence: 23, sov: 6, rank: 14, averagePosition: 5.5, citationRate: 11, delta: 0, isPrimary: false },
  { id: "referencelab", name: "ReferenceLab", logoUrl: null, aiPresence: 21, sov: 5, rank: 15, averagePosition: 5.7, citationRate: 19, delta: 2, isPrimary: false },
  { id: "generank", name: "GeneRank", logoUrl: null, aiPresence: 19, sov: 5, rank: 16, averagePosition: 5.9, citationRate: 10, delta: -1, isPrimary: false },
  { id: "aipresence", name: "AI Presence", logoUrl: null, aiPresence: 17, sov: 4, rank: 17, averagePosition: 6.1, citationRate: 9, delta: 1, isPrimary: false },
  { id: "mentiontrail", name: "MentionTrail", logoUrl: null, aiPresence: 15, sov: 4, rank: 18, averagePosition: 6.3, citationRate: 8, delta: -2, isPrimary: false },
  { id: "answerindex", name: "AnswerIndex", logoUrl: null, aiPresence: 13, sov: 3, rank: 19, averagePosition: 6.5, citationRate: 8, delta: 0, isPrimary: false },
  { id: "citationmap", name: "CitationMap", logoUrl: null, aiPresence: 11, sov: 3, rank: 20, averagePosition: 6.7, citationRate: 16, delta: 1, isPrimary: false }
];

const rankingCompetitors: typeof competitors = [
  ...competitors,
  ...Array.from({ length: 80 }, (_, index) => {
    const rank = index + 21;
    const aiPresence = Math.max(1, Math.round((10.5 - index * 0.11) * 10) / 10);
    return {
      id: "market-brand-" + String(rank).padStart(3, "0"),
      name: "Market Brand " + String(rank).padStart(3, "0"),
      logoUrl: null,
      aiPresence,
      sov: Math.max(1, Math.round(aiPresence * 0.25)),
      rank,
      averagePosition: Math.round((6.8 + index * 0.035) * 10) / 10,
      citationRate: Math.max(1, Math.round(aiPresence * 0.8)),
      delta: 0,
      isPrimary: false
    };
  })
];

const models = [
  { name: "GPT", logoUrl: "/recora/model-logos/openai-blossom.svg", aiPresence: 62, sov: 27, citationRate: 35, averagePosition: 2.4, verdict: "強い" },
  { name: "Gemini", logoUrl: "/recora/model-logos/gemini.svg", aiPresence: 54, sov: 21, citationRate: 28, averagePosition: 3.1, verdict: "弱い" },
  { name: "Perplexity", logoUrl: "/recora/model-logos/perplexity.svg", aiPresence: 59, sov: 25, citationRate: 39, averagePosition: 2.7, verdict: "強い" },
  { name: "Google AI Mode", logoUrl: "/recora/model-logos/google-ai-mode.webp", aiPresence: 66, sov: 29, citationRate: 42, averagePosition: 2.1, verdict: "強い" }
];

const activeModels = models.slice(0, dashboardScope.modelCount);
const activeModelNameSet = new Set(activeModels.map((model) => model.name));
function clampActiveModelCount(count: number) {
  return Math.min(count, activeModels.length);
}
function scopeModelCountText(value: string) {
  return value.replace(/(\d+)モデル/g, (_, count: string) => `${clampActiveModelCount(Number(count))}モデル`);
}
function filterRowsToActiveModels(rows: string[][], modelColumnIndex: number) {
  return rows.filter((row) => activeModelNameSet.has(row[modelColumnIndex]));
}
function filterItemsToActiveModels<T extends { meta: string }>(items: T[]) {
  return items.filter((item) => activeModels.some((model) => item.meta.includes(` / ${model.name} /`)));
}
function centeredActiveModelOffsets(source: number[]) {
  const selected = source.slice(0, activeModels.length);
  if (selected.length <= 1) return selected.map(() => 0);
  const average = selected.reduce((sum, value) => sum + value, 0) / selected.length;
  const centered = selected.map((value, index) => index === selected.length - 1 ? 0 : Math.round(value - average));
  centered[centered.length - 1] = -centered.slice(0, -1).reduce((sum, value) => sum + value, 0);
  return centered;
}
const activeModelVisibilityOffsets = centeredActiveModelOffsets([4, -3, 1, 6]);
const activeRivalVisibilityOffsets = centeredActiveModelOffsets([2, 1, -2, 3]);

function activeModelLabel(modelNames: readonly string[]) {
  return modelNames.filter((modelName) => activeModels.some((model) => model.name === modelName)).join(" / ") || "対象外";
}
const activeReportProviders = reportProviders.filter(
  (provider) => provider === "全モデル" || activeModels.some((model) => model.name === provider)
);

type SentimentCategory = "positive" | "neutral" | "negative";

type CanonicalSentimentModelSeed = {
  modelName: string;
  all: CustomerSentimentCounts;
  branded: CustomerSentimentCounts;
};

const sentimentCategories: readonly SentimentCategory[] = ["positive", "neutral", "negative"];

const canonicalSentimentByModel: readonly CanonicalSentimentModelSeed[] = [
  {
    modelName: "GPT",
    all: { valid: 3_744, positive: 2_434, neutral: 973, negative: 337 },
    branded: { valid: 592, positive: 361, neutral: 178, negative: 53 }
  },
  {
    modelName: "Gemini",
    all: { valid: 3_744, positive: 2_059, neutral: 1_273, negative: 412 },
    branded: { valid: 580, positive: 290, neutral: 203, negative: 87 }
  },
  {
    modelName: "Perplexity",
    all: { valid: 3_744, positive: 2_546, neutral: 1_011, negative: 187 },
    branded: { valid: 588, positive: 376, neutral: 171, negative: 41 }
  },
  {
    modelName: "Google AI Mode",
    all: { valid: 3_744, positive: 2_247, neutral: 1_385, negative: 112 },
    branded: { valid: 580, positive: 331, neutral: 197, negative: 52 }
  }
];

function allocateIntegerByWeights(total: number, weights: readonly number[]) {
  const safeTotal = Math.max(0, Math.round(total));
  if (!weights.length) return [];
  const safeWeights = weights.map((weight) => Math.max(0, weight));
  const weightTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
  if (safeTotal === 0 || weightTotal === 0) return weights.map(() => 0);

  const raw = safeWeights.map((weight) => safeTotal * weight / weightTotal);
  const allocated = raw.map((value) => Math.floor(value));
  let remainder = safeTotal - allocated.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - allocated[index] }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  for (let index = 0; index < remainder; index += 1) {
    allocated[order[index % order.length].index] += 1;
  }
  return allocated;
}

function scaleSentimentCounts(base: CustomerSentimentCounts, days: number): CustomerSentimentCounts {
  const valid = Math.max(0, Math.round(base.valid * days / 30));
  const [positive, neutral, negative] = allocateIntegerByWeights(
    valid,
    sentimentCategories.map((category) => base[category])
  );
  return { valid, positive, neutral, negative };
}

function sumSentimentCounts(rows: readonly CustomerSentimentCounts[]): CustomerSentimentCounts {
  return rows.reduce<CustomerSentimentCounts>(
    (total, row) => ({
      valid: total.valid + row.valid,
      positive: total.positive + row.positive,
      neutral: total.neutral + row.neutral,
      negative: total.negative + row.negative
    }),
    { valid: 0, positive: 0, neutral: 0, negative: 0 }
  );
}

function sentimentPercentages(counts: CustomerSentimentCounts) {
  if (counts.valid === 0) return { positive: 0, neutral: 0, negative: 0 };
  const [positive, neutral, negative] = allocateIntegerByWeights(
    100,
    sentimentCategories.map((category) => counts[category])
  );
  return { positive, neutral, negative };
}

function buildSentimentSummary(modelNames: readonly string[], range: ReportRange): CustomerSentimentSummary {
  const parsedDays = Number.parseInt(range, 10);
  const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 30;
  const byModel = canonicalSentimentByModel
    .filter((row) => modelNames.includes(row.modelName))
    .map((row) => ({
      modelName: row.modelName,
      all: scaleSentimentCounts(row.all, days),
      branded: scaleSentimentCounts(row.branded, days)
    }));

  return {
    days,
    all: sumSentimentCounts(byModel.map((row) => row.all)),
    branded: sumSentimentCounts(byModel.map((row) => row.branded)),
    byModel
  };
}

function buildSentimentTrend(counts: CustomerSentimentCounts) {
  const current = sentimentPercentages(counts);
  const positiveOffsets = [-4, -3, -3, -2, -2, -1, -1, 0];
  const negativeOffsets = [2, 2, 1, 1, 1, 0, 0, 0];
  const positive = positiveOffsets.map((offset) => Math.max(0, Math.min(100, current.positive + offset)));
  const negative = negativeOffsets.map((offset) => Math.max(0, Math.min(100, current.negative + offset)));
  const neutral = positive.map((value, index) => Math.max(0, 100 - value - negative[index]));
  return { positive, neutral, negative };
}

const personas = ["導入担当", "決裁者", "マーケ責任者", "編集担当", "代理店担当"];
const topics = ["料金", "競合比較", "引用元", "導入・運用", "改善施策", "ブランド印象"];
const personaNameById: Record<string, string> = {
  implementation: "導入担当",
  "decision-maker": "決裁者",
  "marketing-lead": "マーケ責任者",
  editor: "編集担当",
  agency: "代理店担当"
};
const topicNameById: Record<string, string> = {
  pricing: "料金",
  "competitor-comparison": "競合比較",
  sources: "引用元",
  operations: "導入・運用",
  improvements: "改善施策",
  perception: "ブランド印象"
};
const sourceDomainNameById: Record<string, string> = {
  "industry-report": "industry-report.example",
  "marketing-ai-jp": "marketing-ai.jp",
  "recora-jp": "recora.jp",
  "saas-review": "saas-review.example",
  "trailbase-io": "trailbase.io",
  community: "community.example",
  "old-media": "old-media.example"
};
const sourcePageNameById: Record<string, string> = {
  "marketing-ai-research": "marketing-ai.jp/research/ai-search-2026",
  "marketing-ai-compare": "marketing-ai.jp/compare/geo-tools",
  "marketing-ai-guide": "marketing-ai.jp/guide/llmo",
  "recora-features": "recora.jp/features",
  "recora-product": "recora.jp/products/ai-visibility-monitor",
  "trailbase-compare": "trailbase.io/compare/geo-tools",
  "saas-review-geo": "saas-review.example/geo"
};
const claimNameById: Record<string, string> = {
  "pricing-old": "料金が旧プランの金額で説明されている",
  "onboarding-missing": "導入期間の説明が欠落している",
  "competitor-confusion": "競合機能がRecoraの機能として説明されている",
  "model-count": "提供モデル数の説明"
};
const heatmapValues = [
  [48, 62, 35, 55, 58, 44],
  [52, 57, 28, 49, 46, 51],
  [64, 69, 42, 61, 67, 59],
  [46, 50, 31, 54, 60, 48],
  [40, 61, 26, 43, 56, 47]
];
const heatmapObservationCounts = [
  [48, 52, 44, 51, 49, 43],
  [41, 46, 28, 39, 42, 37],
  [56, 61, 53, 58, 60, 55],
  [38, 43, 31, 45, 47, 40],
  [35, 39, 24, 36, 41, 33]
];
function scaledHeatmapObservationCount(rowIndex: number, colIndex: number, range: ReportRange) {
  const days = Number.parseInt(range, 10);
  return Math.max(0, Math.round((heatmapObservationCounts[rowIndex]?.[colIndex] ?? 0) * days / 30 * activeModels.length / models.length));
}

const promptSeedRows = [
  {
    id: "p01",
    prompt: "GEO対策ツールのおすすめは？",
    type: "Non-brand",
    importance: "高",
    persona: "マーケ責任者",
    topic: "競合比較",
    phase: "比較検討",
    aiPresence: 58,
    sov: 24,
    averagePosition: "2.7位",
    citationRate: 18,
    sentiment: "中立",
    reason: "競合が先に推薦される回答が残っています。"
  },
  {
    id: "p02",
    prompt: "AI検索で自社が引用されるには何を整備すべき？",
    type: "Non-brand",
    importance: "高",
    persona: "編集担当",
    topic: "引用元",
    phase: "情報収集",
    aiPresence: 42,
    sov: 15,
    averagePosition: "3.8位",
    citationRate: 0,
    sentiment: "中立",
    reason: "自社公式ページの引用がありません。"
  },
  {
    id: "p03",
    prompt: "レコラの評判は？",
    type: "Branded",
    importance: "中",
    persona: "未指定",
    topic: "ブランド印象",
    phase: "未指定",
    aiPresence: 0,
    sov: 0,
    averagePosition: "—",
    citationRate: 24,
    sentiment: "ポジティブ",
    reason: "可視性KPIには含めず、ブランド認識監査で扱います。"
  },
  {
    id: "p04",
    prompt: "レコラとTrailbaseの違いは？",
    type: "Named comparison",
    importance: "中",
    persona: "未指定",
    topic: "競合比較",
    phase: "比較検討",
    aiPresence: 0,
    sov: 0,
    averagePosition: "—",
    citationRate: 16,
    sentiment: "注意",
    reason: "比較文脈で料金説明の補足が必要です。"
  }
];

const claimPromptOverrides = {
  p099: {
    prompt: "Recoraの料金と利用条件を教えてください。",
    persona: "決裁者",
    topic: "料金",
    phase: "比較検討",
    importance: "高",
    reason: "現在の料金と利用条件に対する回答差分を確認します。"
  },
  p100: {
    prompt: "Recoraは申し込みからどのくらいで利用開始できますか？",
    persona: "導入担当",
    topic: "導入・運用",
    phase: "導入判断",
    importance: "高",
    reason: "利用開始までの条件と期間の説明を確認します。"
  },
  p101: {
    prompt: "Recoraで計測できるAIモデル数を教えてください。",
    persona: "導入担当",
    topic: "導入・運用",
    phase: "情報収集",
    importance: "中",
    reason: "契約条件に応じた提供モデル数の説明を確認します。"
  },
  p118: {
    prompt: "Recoraと競合サービスの機能の違いを教えてください。",
    persona: "マーケ責任者",
    topic: "競合比較",
    phase: "比較検討",
    importance: "高",
    reason: "競合機能と自社機能の混同がないか確認します。"
  }
} as const;

const promptRows = Array.from({ length: dashboardScope.questionCount }, (_, index) => {
  const seed = promptSeedRows[index % promptSeedRows.length];
  if (index < promptSeedRows.length) return seed;

  const persona = personas[index % personas.length];
  const topic = topics[(index * 2) % topics.length];
  const phase = ["情報収集", "比較検討", "導入判断", "未指定"][index % 4];
  const generatedIndex = index - promptSeedRows.length;
  const promptType = generatedIndex < 94 ? "Non-brand" : generatedIndex < 113 ? "Branded" : "Named comparison";
  const isMarketMetricEligible = promptType === "Non-brand";
  return {
    ...seed,
    type: promptType,
    id: `p${String(index + 1).padStart(3, "0")}`,
    prompt: `${seed.prompt.replace(/？$/, "")}：${persona}が${topic}を確認する場合は？`,
    importance: index % 5 === 0 ? "高" : index % 3 === 0 ? "低" : "中",
    persona,
    topic,
    phase,
    aiPresence: isMarketMetricEligible ? Math.max(18, Math.min(82, seed.aiPresence + ((index % 9) - 4) * 3)) : 0,
    sov: isMarketMetricEligible ? Math.max(6, Math.min(46, seed.sov + ((index % 7) - 3) * 2)) : 0,
    averagePosition: isMarketMetricEligible ? `${(1.8 + (index % 8) * 0.35).toFixed(1)}位` : "—",
    citationRate: Math.max(0, Math.min(68, seed.citationRate + ((index % 11) - 5) * 2)),
    sentiment: index % 19 === 0 ? "注意" : seed.sentiment,
    reason: index % 7 === 0
      ? "競合先行と引用元の違いを確認します。"
      : index % 9 === 0
        ? "自社公式ページの引用がありません。"
        : seed.reason
  };
}).map((row, index) => {
  if (index < promptSeedRows.length) return row;
  // Keep the mock population aligned with the customer-facing summary:
  // 11 competitor-ahead, 9 no-citation, 6 sentiment-risk, 24 review items.
  const competitorAhead = index >= 4 && index <= 13;
  const citationMissing = index >= 12 && index <= 19;
  const sentimentRisk = index >= 20 && index <= 24;
  const adjustedRow = {
    ...row,
    citationRate: citationMissing ? 0 : Math.max(6, row.citationRate),
    sentiment: sentimentRisk
      ? promptSeedRows[3].sentiment
      : row.sentiment === promptSeedRows[3].sentiment ? promptSeedRows[0].sentiment : row.sentiment,
    reason: competitorAhead ? promptSeedRows[0].reason : citationMissing ? promptSeedRows[1].reason : sentimentRisk ? promptSeedRows[3].reason : "\u671F\u9593\u96C6\u8A08\u3092\u78BA\u8A8D\u3057\u307E\u3059\u3002"
  };
  return Object.assign(adjustedRow, claimPromptOverrides[row.id as keyof typeof claimPromptOverrides] ?? {});
});

type PromptView = "すべて" | "自社掲載あり" | "自社未掲載" | "競合先行" | "公式サイト引用あり";

type PromptFilterKey = "type" | "importance" | "persona" | "topic" | "phase" | "model";
type PromptFilters = Record<PromptFilterKey, string>;
type PromptSort = "質問順" | "AI表示率が低い" | "悪化幅が大きい" | "欠測率が高い";

const defaultPromptFilters: PromptFilters = {
  type: "すべて",
  importance: "すべて",
  persona: "すべて",
  topic: "すべて",
  phase: "すべて",
  model: "すべて"
};

const promptListStateKey = "recora:customer-report:prompt-list:v2";

const answerRows = promptRows.flatMap((prompt, promptIndex) => activeModels.map((model, modelIndex) => {
  const globalIndex = promptIndex * activeModels.length + modelIndex;
  const totalAnswers = dashboardScope.questionCount * activeModels.length;
  const missingCount = Math.min(Math.round(13 * activeModels.length / 4), totalAnswers);
  const validAnswerCount = totalAnswers - missingCount;
  const isMissing = globalIndex >= validAnswerCount;
  const listedTarget = Math.round(validAnswerCount * (219 / 499));
  const verificationTarget = Math.round(validAnswerCount * (17 / 499));
  const legacyId = promptIndex === 0 && modelIndex === 0
    ? "a01"
    : promptIndex === 1 && modelIndex === 1
      ? "a02"
      : promptIndex === 2 && modelIndex === 2
        ? "a03"
        : promptIndex === 3 && modelIndex === 3
          ? "a04"
          : null;
  const listed = !isMissing && ((globalIndex * 37) % Math.max(1, validAnswerCount)) < listedTarget;
  const positionNumber = ((promptIndex + modelIndex + 1) % 3) + 1;
  const competitorAhead = isMissing
    ? "判定不可"
    : !listed || positionNumber > 1
    ? ["Trailbase", "SignalNest", "MentionMap"][(promptIndex + modelIndex) % 3]
    : "なし";
  const legacyCitationCount: Record<string, number> = { a01: 3, a02: 1, a03: 2, a04: 4 };
  const generatedCitations = isMissing ? 0 : (promptIndex + modelIndex) % 5;
  const verification = isMissing
    ? "判定不可"
    : ((globalIndex * 53) % Math.max(1, validAnswerCount)) < verificationTarget
      ? "要確認"
      : (promptIndex + modelIndex) % 4 === 0
        ? "主張確認済み"
        : "引用一致";
  return {
    id: legacyId ?? `a-${prompt.id}-${modelIndex + 1}`,
    promptId: prompt.id,
    prompt: prompt.prompt,
    model: model.name,
    retrievalStatus: isMissing ? "計測失敗" : "取得済み",
    listed: isMissing ? "判定不可" : listed ? "掲載あり" : "未掲載",
    position: listed ? `${positionNumber}位` : "—",
    recommendationOrder: listed ? `${positionNumber}番目` : "—",
    competitorAhead,
    citations: legacyId ? legacyCitationCount[legacyId] : generatedCitations,
    verification
  };
}));

const answerCitationUrls = [
  "https://recora.jp/products/ai-visibility-monitor",
  "https://marketing-ai.jp/research/ai-search-2026",
  "https://trailbase.io/compare/geo-tools",
  "https://saas-review.example/ai-search"
];

const sourceBreakdown = [
  { key: "owned", label: "自社公式", value: 31, citations: 42, className: "bg-[#006B57]" },
  { key: "competitor", label: "競合公式", value: 23, citations: 31, className: "bg-[#475569]" },
  { key: "media", label: "第三者メディア", value: 18, citations: 24, className: "bg-[#2AAE9B]" },
  { key: "review", label: "レビューサイト", value: 12, citations: 17, className: "bg-[#B7791F]" },
  { key: "sns", label: "SNS/コミュニティ", value: 4, citations: 6, className: "bg-[#94A3B8]" },
  { key: "public", label: "公共機関・学術", value: 7, citations: 10, className: "bg-[#64748B]" },
  { key: "other", label: "その他", value: 5, citations: 6, className: "bg-[#CBD5E1]" }
];

const sourceDomainSeedRows = [
  { id: "recora-jp", domain: "recora.jp", type: "自社公式", citations: 42, share: 31, topic: "導入・運用" },
  { id: "trailbase-io", domain: "trailbase.io", type: "競合公式", citations: 31, share: 23, topic: "競合比較" },
  { id: "marketing-ai-jp", domain: "marketing-ai.jp", type: "第三者メディア", citations: 24, share: 18, topic: "改善施策" },
  { id: "saas-review", domain: "saas-review.example", type: "レビューサイト", citations: 15, share: 11, topic: "ブランド印象" }
];

const additionalSourceDomainNames = [
  "industry-report.example", "community.example", "product-guide.example", "market-data.example",
  "research-hub.example", "tool-review.example", "implementation-note.example", "buyer-guide.example",
  "ai-search-journal.example", "comparison-lab.example", "case-study.example", "knowledge-base.example",
  "technology-media.example", "business-review.example", "professional-forum.example", "reference-index.example",
  "analyst-note.example", "vendor-catalog.example", "buyer-community.example", "implementation-guide.example",
  "industry-forum.example", "product-directory.example", "market-watch.example", "expert-column.example"
];

const sourceDomains = [
  ...sourceDomainSeedRows,
  ...additionalSourceDomainNames.map((domain, index) => ({
    id: `source-domain-${index + 5}`,
    domain,
    type: ["第三者メディア", "SNS/コミュニティ", "レビューサイト", "その他"][index % 4],
    citations: 1,
    share: index < 17 ? 1 : 0,
    topic: topics[index % topics.length]
  }))
];

function formatSourceShare(share: number) {
  return share === 0 ? "<1%" : `${share}%`;
}

function distributeCount(total: number, index: number, parts: number) {
  return Math.floor(total / parts) + (index < total % parts ? 1 : 0);
}

const sourcePageSeedRows = [
  { id: "recora-product", url: "/products/ai-visibility-monitor", domain: "recora.jp", type: "自社公式", citations: 18, topic: "導入・運用", models: activeModelLabel(["GPT", "Perplexity", "Google AI Mode"]), insight: "製品定義は引用されているが比較軸が弱い" },
  { id: "trailbase-compare", url: "/compare/geo-tools", domain: "trailbase.io", type: "競合公式", citations: 15, topic: "競合比較", models: activeModelLabel(["GPT", "Gemini"]), insight: "競合だけが選定基準を明示" },
  { id: "marketing-ai-research", url: "/research/ai-search-2026", domain: "marketing-ai.jp", type: "第三者メディア", citations: 12, topic: "引用元", models: activeModelLabel(["Perplexity"]), insight: "第三者調査が引用元として使われる" }
];

const sourcePages = [
  ...sourcePageSeedRows,
  ...Array.from({ length: 27 }, (_, index) => {
    const domainRow = sourceDomains[(index + 3) % sourceDomains.length];
    const topic = topics[index % topics.length];
    return {
      id: `source-page-${index + 4}`,
      url: `/insights/${topic.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
      domain: domainRow.domain,
      type: domainRow.type,
      // Page and domain rankings share the same 136 citation occurrences:
      // the three seed pages total 45 and the generated pages total 91.
      citations: index < 10 ? 4 : 3,
      topic,
      models: activeModels.filter((_, modelIndex) => (modelIndex + index) % 3 !== 0).map((model) => model.name).join(" / ") || activeModels[0].name,
      insight: ["比較軸の説明が引用されている", "調査条件の明記が参照されている", "導入判断の補足情報として使われている"][index % 3]
    };
  })
];

type CitationGapRow = {
  id: string;
  prompt: string;
  model: string;
  competitor: string;
  url: string;
  affected: number;
  days: number;
  persona: string;
  topic: string;
};

const citationGapPromptSeeds = [
  { prompt: "GEO対策ツールの選定基準は？", competitor: "Trailbase", url: "https://trailbase.io/compare/geo-tools", persona: "マーケ責任者", topic: "競合比較" },
  { prompt: "AI検索対策サービスの評判を比較して", competitor: "SignalNest", url: "https://saas-review.example/ai-search", persona: "決裁者", topic: "第三者評価" },
  { prompt: "AI検索の市場データを教えて", competitor: "Trailbase", url: "https://marketing-ai.jp/research/ai-search-2026", persona: "編集担当", topic: "調査データ" },
  { prompt: "生成AIで自社ブランドを表示させる方法は？", competitor: "MentionMap", url: "https://mentionmap.example/guides/brand-visibility", persona: "マーケ責任者", topic: "AI表示改善" },
  { prompt: "GEOツールの導入効果を比較して", competitor: "RankLens", url: "https://ranklens.example/reports/geo-roi", persona: "決裁者", topic: "導入効果" },
  { prompt: "AI回答の引用元を分析できるサービスは？", competitor: "SourcePilot", url: "https://sourcepilot.example/features/citation-analysis", persona: "分析担当", topic: "引用分析" },
  { prompt: "AI検索で競合との差を測るには？", competitor: "AnswerGrid", url: "https://answergrid.example/compare/competitive-gap", persona: "マーケ責任者", topic: "競合比較" },
  { prompt: "LLMOとSEOを一緒に管理できるツールは？", competitor: "QueryScope", url: "https://queryscope.example/guides/seo-llmo", persona: "運用担当", topic: "統合運用" },
  { prompt: "AI検索モニタリングの費用相場は？", competitor: "PromptAtlas", url: "https://promptatlas.example/research/pricing", persona: "決裁者", topic: "料金" },
  { prompt: "ブランドのAI内シェアを確認する方法は？", competitor: "MentionMap", url: "https://mentionmap.example/metrics/share-of-voice", persona: "分析担当", topic: "AI内シェア" },
  { prompt: "ペルソナ別にAI表示率を比較できるサービスは？", competitor: "SignalNest", url: "https://signalnest.example/features/audience-insights", persona: "マーケ責任者", topic: "ペルソナ分析" },
  { prompt: "AI回答の変化を日次で追跡できるツールは？", competitor: "Trailbase", url: "https://trailbase.io/features/daily-monitoring", persona: "運用担当", topic: "推移分析" }
] as const;

const citationGapModelNames = ["GPT", "Gemini", "Perplexity", "Google AI Mode"] as const;

const citationGapRows: CitationGapRow[] = citationGapPromptSeeds.flatMap((seed, promptIndex) =>
  citationGapModelNames.map((model, modelIndex) => ({
    id: `cg${String(promptIndex * citationGapModelNames.length + modelIndex + 1).padStart(2, "0")}`,
    ...seed,
    model,
    affected: Math.max(2, 24 - promptIndex - modelIndex * 2),
    days: Math.max(2, 18 - promptIndex - modelIndex)
  }))
);

const activeCitationGapRows = citationGapRows.filter((row) => activeModels.some((model) => model.name === row.model));
const orderedActiveCitationGapRows = [...activeCitationGapRows].sort((left, right) =>
  right.affected - left.affected || right.days - left.days || left.prompt.localeCompare(right.prompt, "ja")
);

const claimRiskSeedRows = [
  { id: "pricing-old", promptId: "p099", claim: "料金が旧プランの金額で説明されている", severity: "高", type: "古い情報", days: 14, modelNames: ["GPT", "Gemini"], answers: 6 },
  { id: "onboarding-missing", promptId: "p100", claim: "導入期間の説明が欠落している", severity: "中", type: "情報欠落", days: 9, modelNames: ["Perplexity"], answers: 4 },
  { id: "competitor-confusion", promptId: "p118", claim: "競合機能がRecoraの機能として説明されている", severity: "高", type: "誤認", days: 5, modelNames: ["Gemini", "Google AI Mode"], answers: 3 },
  { id: "model-count", promptId: "p101", claim: "提供モデル数の説明が現在の契約条件と異なる", severity: "中", type: "条件差分", days: 3, modelNames: ["GPT"], answers: 2 }
] as const;
const claimRiskRows = claimRiskSeedRows.flatMap((row) => {
  const activeNames = row.modelNames.filter((name) => activeModels.some((model) => model.name === name));
  if (activeNames.length === 0) return [];
  return [{
    ...row,
    models: activeNames.join(" / "),
    answers: Math.max(1, Math.round(row.answers * activeNames.length / row.modelNames.length))
  }];
});

const improvementSeedRows = [
  { id: "r01", priority: "高", action: "競合比較ページに選定基準表を追加", target: "/compare/geo-tools", metric: "AI表示率 / 平均掲載位置", evidence: "比較検討プロンプトでTrailbaseが先行", impact: "影響42観測 / 3モデル / 14日継続", category: "既存ページ改善" },
  { id: "r02", priority: "高", action: "引用されやすい調査データページを新規作成", target: "新規ページ", metric: "公式サイト引用率", evidence: "自社未引用の高重要度プロンプトが残る", impact: "影響28観測 / 2モデル / 11日継続", category: "新規ページ作成" },
  { id: "r03", priority: "中", action: "料金と導入期間の説明を最新化", target: "/pricing", metric: "公式事実との差分", evidence: "Branded回答で古い説明が出る", impact: "影響6回答 / 2モデル / 14日継続", category: "既存ページ改善" }
];

const additionalImprovementActions = [
  ["比較ページに導入条件の一覧を追加", "/compare", "AI表示率", "導入条件を求める質問で競合が先行"],
  ["機能ページに対象ユーザー別の利用例を追加", "/features", "平均掲載位置", "利用場面の説明が第三者記事に置き換わる"],
  ["料金ページに更新日と適用条件を明記", "/pricing", "公式事実一致率", "料金条件の回答差分が継続"],
  ["導入ガイドに初期設定の手順を追加", "/guide", "公式サイト引用率", "導入手順で自社ページが引用されない"],
  ["競合比較ページに判断軸別FAQを追加", "/compare/geo-tools", "AI内シェア", "比較質問で選定理由が不足"],
  ["調査方法を説明するページを整備", "/research/methodology", "公式サイト引用率", "調査条件を第三者ソースへ依存"],
  ["事例ページに業種・規模の条件を追加", "/cases", "AI表示率", "導入事例の具体性で競合が先行"],
  ["製品概要のカテゴリ定義を統一", "/product", "ブランド認識", "モデル間で製品カテゴリの説明が揺れる"],
  ["サポート範囲と対応時間を明記", "/support", "公式事実一致率", "サポート条件の説明が欠落"],
  ["セキュリティ情報の一次資料を追加", "/security", "公式サイト引用率", "信頼性質問で第三者ページのみ引用"],
  ["業界メディアに専門家コメントの掲載を依頼", "業界メディア", "公式サイト引用率", "専門家評価を求める回答で自社への言及がない"],
  ["比較・レビューサイトの製品情報を最新化", "第三者比較サイト", "AI表示率", "第三者比較記事で旧情報が引用される"],
  ["顧客レビュー・パートナー導入事例の掲載を依頼", "顧客・連携パートナー", "公式サイト引用率", "利用実績の回答で第三者評価が不足"],
  ["自社・製品名の照合語を確認", "計測設定", "AI表示率", "別表記の回答で自社掲載判定が揺れる"],
  ["固定質問の分類と重要度を確認", "質問集合", "計測条件", "ペルソナ・トピック分類に確認事項が残る"]
] as const;

const improvementRows = [
  ...improvementSeedRows,
  ...additionalImprovementActions.map(([action, target, metric, evidence], index) => ({
    id: `r${String(index + 4).padStart(2, "0")}`,
    priority: index < 4 ? "高" : index < 10 ? "中" : "低",
    action,
    target,
    metric,
    evidence,
    impact: `影響${Math.max(5, 26 - index)}観測 / ${(index % 3) + 1}モデル / ${Math.max(3, 12 - Math.floor(index / 2))}日継続`,
    category: index < 7
      ? "既存ページ改善"
      : index < 10
        ? "新規ページ作成"
        : index < 13
          ? "第三者掲載・引用獲得"
          : "計測条件・定義確認"
  }))
].map((row) => ({ ...row, impact: scopeModelCountText(row.impact) }));

type ImprovementRow = (typeof improvementRows)[number];

function buildImprovementActionDetail(row: ImprovementRow, reportBase: string): ReportDetailPayload {
  const common = {
    value: `優先度 ${row.priority}`,
    detailHref: `${reportBase}/recommendations/${row.id}`,
    detailLabel: "施策の受入条件と観測を分析"
  };

  if (row.id === "r01") {
    return {
      ...common,
      kicker: "EXISTING PAGE CANDIDATE",
      title: row.action,
      summary: "既存の比較ページへ選定基準を追加する候補です。観測された競合先行と施策実施後の変化は分けて評価します。",
      sections: [
        {
          title: "この候補が扱うもの",
          description: "既存URLの内容・構造を直す候補であり、表示率や掲載位置の改善を保証するものではありません。",
          facts: [
            { label: "候補区分", value: "既存ページ改善" },
            { label: "対象URL", value: row.target },
            { label: "対象指標", value: row.metric },
            { label: "対象観測", value: scopeModelCountText("42観測 / 3モデル / 14日") }
          ]
        },
        {
          title: "現在と実施後に比較する内容",
          table: {
            columns: ["比較軸", "現在の観測", "実施後の確認"],
            rows: [
              ["選定基準", "競合ページ側で明示", "自社ページで読者別に明示"],
              ["平均掲載位置", "同一質問で競合が先行", "同一質問 × 同一モデルで前後比較"],
              ["引用URL", "trailbase.io が先行", "自社URLの引用回答を別集計"]
            ]
          }
        },
        {
          title: "候補に紐づく代表観測",
          table: {
            columns: ["観測ID", "観測日", "AIモデル", "固定質問", "観測結果"],
            rows: filterRowsToActiveModels([
              ["OBS-20260706-R01-001", "2026-07-06", "GPT", "Q-034", "Trailbase 1位 / Recora 3位"],
              ["OBS-20260705-R01-014", "2026-07-05", "Gemini", "Q-034", "Trailbase引用 / 自社引用なし"],
              ["OBS-20260704-R01-027", "2026-07-04", "Perplexity", "Q-071", "比較軸は競合URLを参照"]
            ], 2)
          }
        }
      ]
    };
  }

  if (row.id === "r02") {
    return {
      ...common,
      kicker: "NEW PAGE CANDIDATE",
      title: row.action,
      summary: "既存ページで受け止められていない調査データ需要に対して、新しいURLを検討する候補です。",
      sections: [
        {
          title: "この候補が扱うもの",
          description: "既存ページの改修ではなく、調査方法・数値・更新日を提示する独立ページの候補です。公開判断は重複意図の確認後に行います。",
          facts: [
            { label: "候補区分", value: "新規ページ" },
            { label: "候補URL", value: "/research" },
            { label: "対象指標", value: row.metric },
            { label: "対象観測", value: scopeModelCountText("28観測 / 2モデル / 11日") }
          ]
        },
        {
          title: "既存ページと新規ページ案の比較",
          table: {
            columns: ["確認軸", "既存ページ", "新規ページ案"],
            rows: [
              ["検索意図", "製品説明が中心", "AI検索の調査データ"],
              ["引用可能な情報", "一次データが不足", "調査方法・数値・更新日を明示"],
              ["公開前の確認", "—", "既存URLとの役割重複を確認"]
            ]
          }
        },
        {
          title: "候補に紐づく代表観測",
          table: {
            columns: ["観測ID", "観測日", "AIモデル", "固定質問", "観測結果"],
            rows: filterRowsToActiveModels([
              ["OBS-20260706-R02-003", "2026-07-06", "Perplexity", "Q-088", "第三者調査を引用 / 自社引用なし"],
              ["OBS-20260705-R02-011", "2026-07-05", "GPT", "Q-088", "自社に該当一次データなし"],
              ["OBS-20260703-R02-019", "2026-07-03", "Perplexity", "Q-102", "marketing-ai.jp を引用"]
            ], 2)
          }
        }
      ]
    };
  }

  if (row.id !== "r03") {
    return {
      ...common,
      kicker: "RECOMMENDATION CANDIDATE",
      title: row.action,
      summary: "複数の回答で繰り返し観測された不足を、対象ページと確認指標に結び付けた候補です。",
      sections: [
        { title: "候補の対象", facts: [{ label: "対象", value: row.target }, { label: "対象指標", value: row.metric }, { label: "観測された状況", value: row.evidence }, { label: "影響範囲", value: row.impact }] },
        { title: "実施前後に確認する内容", table: { columns: ["確認軸", "現在", "実施後"], rows: [["対象情報", row.evidence, row.action], ["比較条件", "同じ固定質問・同じAIモデル", "同じ条件で日次比較"], ["評価指標", row.metric, "率・件数・掲載位置を別々に確認"]] } }
      ]
    };
  }

  return {
    ...common,
    kicker: "OFFICIAL FACT UPDATE",
    title: row.action,
    summary: "AI回答に残る古い料金・導入期間の説明を、現在の公式事実と照合して更新する候補です。",
    sections: [
      {
        title: "この候補が扱うもの",
        description: "ブランド回答の事実差分を解消する既存ページ改善です。回答の変化は、更新後も同じ質問条件で別途観測します。",
        facts: [
          { label: "候補区分", value: "公式事実の更新" },
          { label: "対象URL", value: row.target },
          { label: "対象指標", value: row.metric },
          { label: "対象回答", value: scopeModelCountText("6回答 / 2モデル / 14日") }
        ]
      },
      {
        title: "観測された説明と公式事実の比較",
        table: {
          columns: ["確認軸", "AI回答", "公式事実"],
          rows: [
            ["料金", "旧プランの説明", "現行プランと更新日"],
            ["導入期間", "根拠を確認できない断定", "公式に確認できる範囲"],
            ["照合単位", "回答本文と引用URL", "公式事実台帳の項目"]
          ]
        }
      },
      {
        title: "差分が見つかった代表観測",
        table: {
          columns: ["観測ID", "観測日", "AIモデル", "固定質問", "差分"],
          rows: filterRowsToActiveModels([
            ["OBS-20260706-R03-002", "2026-07-06", "GPT", "Q-012", "旧料金プランを表示"],
            ["OBS-20260704-R03-004", "2026-07-04", "Gemini", "Q-013", "導入期間を断定"],
            ["OBS-20260629-R03-006", "2026-06-29", "GPT", "Q-012", "更新前URLを参照"]
          ], 2)
        }
      }
    ]
  };
}

function buildImprovementEvidenceDetail(row: ImprovementRow, reportBase: string): ReportDetailPayload {
  const details: Record<string, ReportDetailPayload> = {
    r01: {
      kicker: "COMPETITOR-AHEAD OBSERVATIONS",
      title: "比較検討プロンプトでの競合先行",
      value: "42観測",
      summary: "同じ固定質問とAIモデルで、TrailbaseがRecoraより先に掲載された観測だけを集約しています。",
      sections: [
        {
          title: "集計条件",
          facts: [
            { label: "対象", value: "競合先行の回答" },
            { label: "観測数", value: "42件" },
            { label: "AIモデル", value: `${clampActiveModelCount(3)}モデル` },
            { label: "継続", value: "14日" },
            { label: "比較単位", value: "観測日 × 固定質問 × AIモデル" }
          ]
        },
        {
          title: "モデル別内訳",
          table: {
            columns: ["AIモデル", "対象観測", "主な状態"],
            rows: filterRowsToActiveModels([
              ["GPT", "18件", "平均掲載位置で先行"],
              ["Gemini", "14件", "競合引用・自社未引用"],
              ["Perplexity", "10件", "比較軸で競合URLを参照"]
            ], 0)
          }
        },
        {
          title: "代表観測まで遡る",
          items: filterItemsToActiveModels([
            { title: "OBS-20260706-R01-001", meta: "2026-07-06 08:05 / GPT / Q-034", description: "「GEOツールの選定基準は？」でTrailbase 1位、Recora 3位。引用URL: trailbase.io/compare/geo-tools" },
            { title: "OBS-20260705-R01-014", meta: "2026-07-05 08:07 / Gemini / Q-034", description: "Trailbaseの比較ページを引用し、Recoraの自社URL引用はなし。" },
            { title: "OBS-20260704-R01-027", meta: "2026-07-04 08:11 / Perplexity / Q-071", description: "選定基準の説明で競合URLを使用。回答本文と引用箇所を保持。" }
          ])
        }
      ],
      detailHref: `${reportBase}/recommendations/r01`,
      detailLabel: "42観測と受入条件を分析"
    },
    r02: {
      kicker: "OWN-SOURCE CITATION GAP",
      title: "調査データ需要での自社未引用",
      value: "28観測",
      summary: "調査データを求める固定質問のうち、回答に自社URLが引用されなかった観測を集約しています。ブランド非掲載とは分けて判定します。",
      sections: [
        {
          title: "集計条件",
          facts: [
            { label: "対象", value: "自社URL未引用の回答" },
            { label: "観測数", value: "28件" },
            { label: "AIモデル", value: `${clampActiveModelCount(2)}モデル` },
            { label: "継続", value: "11日" },
            { label: "比較単位", value: "回答 × 引用URL" }
          ]
        },
        {
          title: "引用元の内訳",
          table: {
            columns: ["回答状態", "観測", "代表URL"],
            rows: [
              ["第三者調査を引用", "17件", "marketing-ai.jp/research/ai-search-2026"],
              ["競合調査を引用", "7件", "trailbase.io/research"],
              ["引用URLなし", "4件", "—"]
            ]
          }
        },
        {
          title: "代表観測まで遡る",
          items: filterItemsToActiveModels([
            { title: "OBS-20260706-R02-003", meta: "2026-07-06 08:14 / Perplexity / Q-088", description: "「AI検索の市場データは？」で第三者調査を引用。自社URLは引用されず。" },
            { title: "OBS-20260705-R02-011", meta: "2026-07-05 08:03 / GPT / Q-088", description: "調査数値を求める回答に、自社の該当一次データURLなし。" },
            { title: "OBS-20260703-R02-019", meta: "2026-07-03 08:16 / Perplexity / Q-102", description: "marketing-ai.jp/research/ai-search-2026 を引用。" }
          ])
        }
      ],
      detailHref: `${reportBase}/recommendations/r02`,
      detailLabel: "28観測とページ重複を分析"
    },
    r03: {
      kicker: "OFFICIAL FACT MISMATCH",
      title: "ブランド回答と公式事実の差分",
      value: "6回答",
      summary: "回答本文の料金・導入期間を公式事実台帳と照合し、不一致がある回答だけを集約しています。",
      sections: [
        {
          title: "照合条件",
          facts: [
            { label: "対象", value: "公式事実と不一致の回答" },
            { label: "回答数", value: "6件" },
            { label: "AIモデル", value: `${clampActiveModelCount(2)}モデル` },
            { label: "継続", value: "14日" },
            { label: "照合単位", value: "回答内の主張 × 公式事実項目" }
          ]
        },
        {
          title: "差分の内訳",
          table: {
            columns: ["差分区分", "回答", "確認元"],
            rows: [
              ["旧料金プラン", "3件", "公式料金ページ"],
              ["導入期間の断定", "2件", "公式導入案内"],
              ["更新前URL", "1件", "公式事実台帳"]
            ]
          }
        },
        {
          title: "代表観測まで遡る",
          items: filterItemsToActiveModels([
            { title: "OBS-20260706-R03-002", meta: "2026-07-06 08:02 / GPT / Q-012", description: "旧料金プランを回答。回答本文・引用URL・公式事実項目を照合可能。" },
            { title: "OBS-20260704-R03-004", meta: "2026-07-04 08:09 / Gemini / Q-013", description: "公式ページで確認できない導入期間を断定。" },
            { title: "OBS-20260629-R03-006", meta: "2026-06-29 08:04 / GPT / Q-012", description: "更新前の料金URLを参照。" }
          ])
        }
      ],
      detailHref: `${reportBase}/recommendations/r03`,
      detailLabel: "6回答と公式事実の照合を分析"
    }
  };

  return details[row.id] ?? {
    kicker: "OBSERVATION EVIDENCE",
    title: row.evidence,
    value: row.impact,
    summary: "候補の根拠になった質問・AIモデル・観測結果をまとめます。",
    sections: [
      { title: "根拠の範囲", facts: [{ label: "対象指標", value: row.metric }, { label: "対象ページ", value: row.target }, { label: "影響範囲", value: row.impact }] },
      { title: "代表的な回答", table: { columns: ["固定質問", "AIモデル", "観測結果"], rows: activeModels.slice(0, Math.min(2, improvementImpactParts(row.impact).modelCount)).map((model, index) => [index === 0 ? "対象情報を比較するときの判断軸は？" : "導入前に確認すべき条件は？", model.name, row.evidence]) } }
    ],
    detailHref: `${reportBase}/recommendations/${row.id}`,
    detailLabel: "候補の確認条件を分析"
  };
}

function improvementImpactParts(impact: string) {
  const affected = impact.match(/影響(\d+)(観測|回答)/);
  const modelCount = impact.match(/(\d+)モデル/);
  const continuation = impact.match(/(\d+)日継続/);
  return {
    count: Number(affected?.[1] ?? 0),
    unit: affected?.[2] ?? "観測",
    modelCount: Math.max(1, Math.min(Number(modelCount?.[1] ?? 1), activeModels.length)),
    days: Number(continuation?.[1] ?? 0)
  };
}

function buildImprovementImpactDetail(row: ImprovementRow, reportBase: string): ReportDetailPayload {
  const impact = improvementImpactParts(row.impact);
  const modelsForImpact = activeModels.slice(0, impact.modelCount);
  const baseCount = Math.floor(impact.count / modelsForImpact.length);
  const remainder = impact.count % modelsForImpact.length;
  const focusAreas = ["比較検討", "自社情報", "引用元", "料金・導入"];

  return {
    kicker: "影響範囲",
    title: `${row.action}の影響範囲`,
    value: `${impact.count}${impact.unit}`,
    summary: "この候補の根拠と同じ状態が、どのAIモデル・質問領域でどれだけ観測されたかを示します。施策による期待効果ではありません。",
    sections: [
      {
        title: "影響範囲の定義",
        facts: [
          { label: "対象指標", value: row.metric },
          { label: "対象ページ", value: row.target },
          { label: "対象観測", value: `${impact.count}${impact.unit}` },
          { label: "AIモデル", value: `${modelsForImpact.length}モデル` },
          { label: "継続", value: `${impact.days}日`, tone: impact.days >= 10 ? "amber" : undefined }
        ]
      },
      {
        title: "AIモデル別の内訳",
        table: {
          columns: ["AIモデル", "対象観測", "根拠が集中する領域"],
          rows: modelsForImpact.map((model, index) => [
            model.name,
            `${baseCount + (index < remainder ? 1 : 0)}${impact.unit}`,
            focusAreas[index % focusAreas.length]
          ])
        }
      },
      {
        title: "この範囲に含まれる状態",
        items: [
          { title: row.evidence, meta: row.category, description: "同じ判定条件に一致した観測だけを集計" },
          { title: `${impact.days}日継続`, meta: "日次観測", description: "一度だけの出現ではなく、期間内で繰り返し確認" }
        ]
      }
    ],
    detailHref: `${reportBase}/recommendations/${row.id}`,
    detailLabel: "施策の受入条件と観測を分析"
  };
}
function replaceCurrentQuery(updates: Record<string, string | null | undefined>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  });
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history.replaceState(window.history.state, "", next);
}

function useReturnHref(fallbackHref: string) {
  const [returnHref, setReturnHref] = useState(fallbackHref);
  useEffect(() => {
    const candidate = new URLSearchParams(window.location.search).get("return");
    if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") || /[\u0000-\u001F\u007F]/.test(candidate)) return;
    const resolved = new URL(candidate, window.location.origin);
    if (resolved.origin !== window.location.origin) return;
    setReturnHref(`${resolved.pathname}${resolved.search}${resolved.hash}`);
  }, []);
  return returnHref;
}

function returnLabelForHref(returnHref: string, fallbackLabel: string) {
  return returnHref.includes("/trends") ? "推移・変化へ戻る" : fallbackLabel;
}
function detailWithReturnHref(detail: ReportDetailPayload, returnHref: string): ReportDetailPayload {
  if (!detail.detailHref) return detail;
  const separator = detail.detailHref.includes("?") ? "&" : "?";
  return { ...detail, detailHref: `${detail.detailHref}${separator}return=${encodeURIComponent(returnHref)}` };
}

export function RecoraCustomerDashboardV03Page({
  page,
  projectSlug = "mieruca-seo-demo",
  projectName = "Recora",
  competitorName = "Trailbase",
  detailId
}: RecoraCustomerDashboardV03Props) {
  const [range, setRange] = useState<ReportRange>("30日");
  const [provider, setProvider] = useState<ReportProvider>("全モデル");
  const [queryStateReady, setQueryStateReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRange = params.get("range");
    const queryProvider = params.get("provider");
    if (reportRanges.includes(queryRange as ReportRange)) setRange(queryRange as ReportRange);
    if (activeReportProviders.includes(queryProvider as ReportProvider)) setProvider(queryProvider as ReportProvider);
    setQueryStateReady(true);
  }, []);

  useEffect(() => {
    if (!queryStateReady) return;
    replaceCurrentQuery({
      range: range === "30日" ? null : range,
      provider: provider === "全モデル" ? null : provider
    });
  }, [provider, queryStateReady, range]);
  const context: PageContext = {
    projectSlug,
    projectName,
    competitorName,
    detailId,
    reportBase: `/dashboard/reports/${projectSlug}`,
    range,
    provider,
    onRange: setRange,
    onProvider: setProvider
  };

  if (page === "brandCompetitors") return <BrandCompetitorsPageV2 context={context} />;
  if (page === "brandComparison") return <BrandComparisonPage context={context} />;
  if (page === "brandMarket") return <BrandMarketPage context={context} />;
  if (page === "brandRanking") return <BrandRankingPage context={context} />;
  if (page === "trends") return <TrendsPage context={context} />;
  if (page === "trendChanges") return <TrendChangesPage context={context} />;
  if (page === "brandCompetitorDetail") return <BrandCompetitorDetailPage context={context} />;
  if (page === "personaTopics") return <PersonaTopicsPage context={context} />;
  if (page === "prompts") return <PromptsPage context={context} />;
  if (page === "personaDetail") return <PersonaDetailPage context={context} />;
  if (page === "topicDetail") return <TopicDetailPage context={context} />;
  if (page === "promptDetail") return <PromptDetailPage context={context} />;
  if (page === "answers") return <AnswersPage context={context} />;
  if (page === "answerDetail") return <AnswerDetailPage context={context} />;
  if (page === "citations") return <CitationsPage context={context} />;
  if (page === "brandPerception") return <BrandPerceptionPage context={context} />;
  if (page === "recommendations") return <RecommendationsPage context={context} />;
  if (page === "sourceDomainDetail") return <SourceDomainDetailPage context={context} />;
  if (page === "citationGapDetail") return <CitationGapDetailPage context={context} />;
  if (page === "sourcePageDetail") return <SourcePageDetailPage context={context} />;
  if (page === "settings") return <SettingsPage context={context} />;
  if (page === "claimDetail") return <ClaimDetailPage context={context} />;
  if (page === "recommendationDetail") return <RecommendationDetailPage context={context} />;
  return <OverviewPage context={context} />;
}

function DashboardFrame({
  context,
  eyebrow,
  title,
  description,
  activeNote,
  scopeMode = "range",
  showMeasurementProfile = false,
  enableDetailDrawer = true,
  primaryContent,
  children,
  action,
  sectionIndexItems,
  sectionIndexLabel,
  sectionIndexSticky = false
}: {
  context: PageContext;
  eyebrow: string;
  title: string;
  description: string;
  activeNote?: string;
  scopeMode?: "range" | "latest" | "none";
  showMeasurementProfile?: boolean;
  enableDetailDrawer?: boolean;
  primaryContent?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  sectionIndexItems?: { id: string; label: string }[];
  sectionIndexLabel?: string;
  sectionIndexSticky?: boolean;
}) {
  const sectionMeta = reportSectionMeta[eyebrow] ?? { number: "", label: "CUSTOMER REPORT" };
  const scope = rangeScope[context.range];
  const [sectionLinks, setSectionLinks] = useState<{ id: string; label: string }[]>([]);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const { detail, close: closeDetail } = useReportDetailController();

  useEffect(() => {
    if (sectionIndexItems) return;
    const collectSections = () => {
      const frame = frameRef.current;
      if (!frame) return;
      const panels = Array.from(frame.querySelectorAll<HTMLElement>("[data-recora-panel]"));
      const nextLinks = panels.flatMap((panel, index) => {
        const heading = panel.querySelector<HTMLElement>("h2");
        const label = heading?.textContent?.trim();
        if (!label) return [];
        if (!panel.id) panel.id = `report-${sectionMeta.number || "detail"}-section-${index + 1}`;
        return [{ id: panel.id, label }];
      });
      setSectionLinks((current) => {
        const currentSignature = current.map((item) => `${item.id}:${item.label}`).join("|");
        const nextSignature = nextLinks.map((item) => `${item.id}:${item.label}`).join("|");
        return currentSignature === nextSignature ? current : nextLinks;
      });
    };

    const initialCheck = window.setTimeout(collectSections, 0);
    const hydrationCheck = window.setTimeout(collectSections, 250);
    const lateCheck = window.setTimeout(collectSections, 1000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearTimeout(hydrationCheck);
      window.clearTimeout(lateCheck);
    };
  }, [sectionIndexItems, sectionMeta.number, title]);
  const scopeValues = scopeMode === "latest"
    ? {
        periodLabel: "測定日",
        period: latestScope.measurementDate,
        validObservations: latestScope.validObservations,
        expectedObservations: latestScope.expectedObservations,
        missingObservations: latestScope.missingObservations,
        successRate: latestScope.successRate
      }
    : {
        periodLabel: "期間",
        period: scope.period,
        validObservations: scope.validObservations,
        expectedObservations: scope.expectedObservations,
        missingObservations: scope.missingObservations,
        successRate: scope.successRate
      };
  const headerScopeItems = scopeMode === "none" ? [] : [
    { key: "period", label: scopeMode === "latest" ? "測定日" : "期間", value: scopeMode === "latest" ? scopeValues.period : context.range },
    { key: "models", label: "AIモデル", value: `${activeModels.length}モデル` },
    { key: "valid", label: "有効観測", value: scopeValues.validObservations },
    { key: "missing", label: "欠測", value: scopeValues.missingObservations, tone: "amber" as const }
  ];

  return (
    <ReportDetailScopeProvider
      value={{
        periodLabel: scopeMode === "latest" ? "測定日" : "期間",
        period: scopeMode === "latest" ? scopeValues.period : context.range,
        modelCount: `${activeModels.length}モデル`,
        validObservations: scopeValues.validObservations,
        missingObservations: scopeValues.missingObservations
      }}
    >
      <div ref={frameRef} className={sectionIndexSticky ? "min-w-0 space-y-8 lg:space-y-10 md:[&_th]:!top-[214px]" : "min-w-0 space-y-8 lg:space-y-10"} data-recora-report-v5>
        <DataRichPageHeader
          eyebrow={`${sectionMeta.number}  ${sectionMeta.label}`}
          title={title}
          description={description}
          badge={activeNote}
          badgeTone={activeNote ? "amber" : "default"}
          action={action}
          scopeItems={headerScopeItems}
        />
        {primaryContent}
        {showMeasurementProfile ? (
          <DataRichToolbar
            compact
            items={[
              { label: "質問集合", value: `${dashboardScope.questionCount}件（固定）` },
              { label: "観測成功率", value: scopeValues.successRate, helper: `予定観測 ${scopeValues.expectedObservations}` },
              { label: "計測信頼度", value: dashboardScope.confidence },
              { label: "地域・言語", value: dashboardScope.regionLanguage },
              { label: "実行頻度", value: dashboardScope.frequency },
              { label: "プラン", value: dashboardScope.plan }
            ]}
          />
        ) : null}
        {!showMeasurementProfile ? (
          <div className={sectionIndexSticky ? "sticky top-16 z-30 bg-white/95 py-1 shadow-[0_10px_24px_-22px_rgba(11,56,45,0.55)] backdrop-blur supports-[backdrop-filter]:bg-white/90" : undefined}>
            <DataRichSectionIndex items={sectionIndexItems ?? sectionLinks} label={sectionIndexLabel} />
          </div>
        ) : null}
        {children}
        {enableDetailDrawer && detail ? <ReportDetailDrawer detail={detail} onClose={closeDetail} /> : null}
      </div>
    </ReportDetailScopeProvider>
  );
}

function TrendComparisonSummary({ range }: { range: ReportRange }) {
  const [comparisonBrandId, setComparisonBrandId] = useState("trailbase");
  const [urlReady, setUrlReady] = useState(false);
  const comparisonBrand = competitors.find((item) => item.id === comparisonBrandId) ?? competitors[1];

  useEffect(() => {
    const queryBrand = new URLSearchParams(window.location.search).get("trendCompare");
    if (competitors.some((item) => !item.isPrimary && item.id === queryBrand)) setComparisonBrandId(queryBrand ?? "trailbase");
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (urlReady) replaceCurrentQuery({ trendCompare: comparisonBrandId === "trailbase" ? null : comparisonBrandId });
  }, [comparisonBrandId, urlReady]);
  const startSelf = { aiPresence: 46, sov: 22, averagePosition: 3.2 };
  const startRival = {
    aiPresence: Math.max(0, comparisonBrand.aiPresence - 8),
    sov: Math.max(0, comparisonBrand.sov - 2),
    averagePosition: Number((comparisonBrand.averagePosition + 0.1).toFixed(1))
  };
  const rows = [
    {
      label: "AI表示率",
      startSelf: startSelf.aiPresence,
      startRival: startRival.aiPresence,
      latestSelf: competitors[0].aiPresence,
      latestRival: comparisonBrand.aiPresence,
      unit: "pt",
      valueUnit: "%",
      lowerIsBetter: false
    },
    {
      label: "AI内シェア",
      startSelf: startSelf.sov,
      startRival: startRival.sov,
      latestSelf: competitors[0].sov,
      latestRival: comparisonBrand.sov,
      unit: "pt",
      valueUnit: "%",
      lowerIsBetter: false
    },
    {
      label: "平均掲載位置",
      startSelf: startSelf.averagePosition,
      startRival: startRival.averagePosition,
      latestSelf: competitors[0].averagePosition,
      latestRival: comparisonBrand.averagePosition,
      unit: "位",
      valueUnit: "位",
      lowerIsBetter: true
    }
  ];

  return (
    <DataRichPanel
      title="競合差の変化"
      description={`各グラフの前に、${range}の期間開始から最新までに差が縮んだか広がったかを確認します。`}
      bodyClassName="p-0"
      variant="comparison"
    >
      <div className="flex min-w-0 flex-col gap-3 border-b border-[#DDE5E1] bg-[#F8FAF9] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[#344054]">比較する競合</p>
          <p className="mt-0.5 text-[12px] font-medium leading-5 text-[#667085]">期間変更は各グラフで行い、この表は現在の初期期間を要約します。</p>
        </div>
        <label className="min-w-0 sm:w-[260px]">
          <span className="sr-only">推移で比較する競合</span>
          <select value={comparisonBrandId} onChange={(event) => setComparisonBrandId(event.target.value)} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">
            {competitors.filter((item) => !item.isPrimary).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </label>
      </div>

      <div className="hidden lg:block" role="table" aria-label={`Recoraと${comparisonBrand.name}の差の変化`}>
        <div className="grid grid-cols-[170px_repeat(4,minmax(0,1fr))] border-b border-[#DDE5E1] bg-[#FBFCFB]" role="row">
          {["指標", "期間開始", "最新", "最新差", "差の変化"].map((label) => <div key={label} className="border-r border-[#E5EAE8] px-4 py-3 text-[12px] font-bold text-[#667085] last:border-r-0" role="columnheader">{label}</div>)}
        </div>
        {rows.map((row) => {
          const startGap = row.startSelf - row.startRival;
          const latestGap = row.latestSelf - row.latestRival;
          const rawGapChange = row.lowerIsBetter ? Math.abs(startGap) - Math.abs(latestGap) : latestGap - startGap;
          const improved = rawGapChange > 0;
          const decimals = row.valueUnit === "位" ? 1 : 0;
          const format = (value: number) => decimals ? value.toFixed(1) : String(value);
          return (
            <div key={row.label} className="grid grid-cols-[170px_repeat(4,minmax(0,1fr))] border-b border-[#E5EAE8] last:border-b-0" role="row">
              <div className="flex items-center px-4 py-3 text-[12px] font-bold text-[#101828]" role="rowheader">{row.label}</div>
              <div className="border-l border-[#E5EAE8] px-4 py-3 text-[13px] font-semibold leading-6 tabular-nums text-[#475467]" role="cell">Recora {format(row.startSelf)}{row.valueUnit}<br />{comparisonBrand.name} {format(row.startRival)}{row.valueUnit}</div>
              <div className="border-l border-[#E5EAE8] bg-[#F8FAF9] px-4 py-3 text-[13px] font-semibold leading-6 tabular-nums text-[#344054]" role="cell">Recora {format(row.latestSelf)}{row.valueUnit}<br />{comparisonBrand.name} {format(row.latestRival)}{row.valueUnit}</div>
              <div className="border-l border-[#E5EAE8] bg-[#F8FAF9] px-4 py-3 text-lg font-semibold tabular-nums text-[#101828]" role="cell">{latestGap > 0 ? "+" : ""}{format(latestGap)}{row.unit}</div>
              <div className={cn("border-l border-[#E5EAE8] px-4 py-3 text-[12px] font-bold tabular-nums", improved ? "text-[#067647]" : rawGapChange < 0 ? "text-[#A15C00]" : "text-[#667085]")} role="cell">
                {rawGapChange === 0 ? "変化なし" : `${Math.abs(rawGapChange).toFixed(decimals)}${row.unit} ${improved ? "縮小" : "拡大"}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="divide-y divide-[#DDE5E1] lg:hidden">
        {rows.map((row) => {
          const startGap = row.startSelf - row.startRival;
          const latestGap = row.latestSelf - row.latestRival;
          const rawGapChange = row.lowerIsBetter ? Math.abs(startGap) - Math.abs(latestGap) : latestGap - startGap;
          const decimals = row.valueUnit === "位" ? 1 : 0;
          return (
            <section key={row.label} className="px-4 py-4">
              <div className="flex items-baseline justify-between gap-3"><h3 className="text-[12px] font-bold text-[#101828]">{row.label}</h3><span className={cn("text-[11px] font-bold", rawGapChange > 0 ? "text-[#067647]" : rawGapChange < 0 ? "text-[#A15C00]" : "text-[#667085]")}>{rawGapChange === 0 ? "差は変化なし" : `差が${Math.abs(rawGapChange).toFixed(decimals)}${row.unit}${rawGapChange > 0 ? "縮小" : "拡大"}`}</span></div>
              <p className="mt-2 text-[11px] font-semibold leading-5 tabular-nums text-[#475467]">最新: Recora {row.latestSelf}{row.valueUnit} / {comparisonBrand.name} {row.latestRival}{row.valueUnit} / 差 {latestGap > 0 ? "+" : ""}{latestGap.toFixed(decimals)}{row.unit}</p>
            </section>
          );
        })}
      </div>
    </DataRichPanel>
  );
}

function OverviewContextStrip({ range }: { range: ReportRange }) {
  const totalObservedPrompts = dashboardQuestionCount * activeModels.length * 30;

  return (
    <section className="min-w-0 border-y border-[#C7D6CF] bg-white" aria-label="レポートの計測条件">
      <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1 border-b border-[#E2E9E6] px-4 py-2.5 text-[12px] font-semibold text-[#52625C] sm:px-6">
        <span>集計期間 <strong className="ml-1 font-bold tabular-nums text-[#17372E]">{range}</strong></span>
        <span>最終計測日 <strong className="ml-1 font-bold tabular-nums text-[#17372E]">2026/07/06</strong></span>
      </div>
      <dl className="divide-y divide-[#E2E9E6] lg:grid lg:grid-cols-[0.72fr_2fr_0.9fr] lg:divide-x lg:divide-y-0">
        <div className="min-w-0 px-4 py-4 sm:px-6">
          <dt className="text-[11px] font-bold tracking-[0.05em] text-[#65736E]">プラン</dt>
          <dd className="mt-1.5 text-[17px] font-semibold text-[#101828]">{dashboardScope.plan}</dd>
        </div>
        <div className="min-w-0 px-4 py-4 sm:px-6">
          <dt className="text-[11px] font-bold tracking-[0.05em] text-[#65736E]">計測中のAIモデル</dt>
          <dd className="mt-2 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
            {activeModels.map((model) => <ModelIdentity key={model.name} name={model.name} compact />)}
          </dd>
        </div>
        <div className="min-w-0 px-4 py-4 sm:px-6">
          <dt className="text-[11px] font-bold tracking-[0.05em] text-[#65736E]">総観測プロンプト数</dt>
          <dd className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.025em] text-[#101828]">
            {totalObservedPrompts.toLocaleString("ja-JP")}<span className="ml-1 text-[13px] font-bold text-[#52625C]">件</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function OverviewPrimarySummary() {
  const score = Math.max(0, Math.min(100, kpis.visibilityScore));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const chartWidth = 640;
  const chartTop = 20;
  const chartBottom = 150;
  const chartMin = 0;
  const chartMax = 70;
  const points = overviewScoreTrend.map((item, index) => {
    const x = (index / (overviewScoreTrend.length - 1)) * chartWidth;
    const y = chartBottom - ((item.value - chartMin) / (chartMax - chartMin)) * (chartBottom - chartTop);
    return { ...item, x, y };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `0,${chartBottom} ${linePoints} ${chartWidth},${chartBottom}`;
  const metrics = [
    { label: "AI表示率", value: `${kpis.aiPresenceRate}%`, delta: "前日比 +3pt", definition: "ブランド名を含まない質問で、自社がAI回答に表示された割合" },
    { label: "AI内シェア（SOV）", value: `${kpis.sov}%`, delta: "前日比 +2pt", definition: "比較対象ブランドの掲載量に占める自社の割合" },
    { label: "平均掲載位置", value: `${kpis.averagePosition}位`, delta: "前日比 0.2位改善", definition: "自社が表示された回答内での平均掲載順位" },
    { label: "公式サイト引用率", value: `${kpis.ownCitationRate}%`, delta: "前日比 +1pt", definition: "有効回答のうち自社の公式サイトが引用された割合" }
  ];

  return (
    <section className="min-w-0 border-y border-[#BFD2C9] bg-[#F4F8F6]" aria-label="総合スコアと主要KPI">
      <div className="grid min-w-0 lg:grid-cols-[minmax(410px,0.95fr)_minmax(0,1.55fr)]">
        <article className="min-w-0 px-5 py-7 sm:px-7 lg:border-r lg:border-[#CBD8D2] lg:py-8">
          <div className="flex min-w-0 flex-col items-start gap-6 sm:flex-row sm:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <div className="relative grid h-[164px] w-[164px] shrink-0 place-items-center" aria-label={`総合スコア ${score}点`}>
              <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#DCE7E2" strokeWidth="11" />
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#0B6B57" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
              </svg>
              <span className="relative flex flex-col items-center">
                <span className="text-[52px] font-semibold leading-none tracking-[-0.055em] tabular-nums text-[#0B382D]">{score}</span>
                <span className="mt-1 text-[12px] font-bold text-[#52625C]">/ 100</span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="whitespace-nowrap text-[20px] font-bold tracking-[-0.02em] text-[#101828]">総合スコア</h2>
                <ReportHelpTooltip text="AI表示率、AI内シェア、平均掲載位置、公式サイト引用率をまとめたRecora独自指標" label="総合スコアの定義" triggerLabel="定義" />
              </div>
              <p className="mt-3 text-[14px] font-bold tabular-nums text-[#08735B]">前日比 +2pt</p>
              <p className="mt-4 max-w-[30rem] text-[14px] font-medium leading-6 text-[#3F514A]">首位ブランドとのAI表示率差は17ptです。</p>
            </div>
          </div>
        </article>

        <article className="min-w-0 border-t border-[#CBD8D2] bg-white px-5 py-7 sm:px-7 lg:border-t-0 lg:py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828]">総合スコア推移</h2>
              <p className="mt-1 text-[12px] font-semibold text-[#65736E]">直近7日</p>
            </div>
            <p className="text-right text-[13px] font-bold tabular-nums text-[#08735B]">7日間 +7pt</p>
          </div>
          <div className="mt-5 min-w-0" role="img" aria-label="06月30日の61点から07月06日の68点までの総合スコア推移">
            <svg viewBox={`0 0 ${chartWidth} 174`} preserveAspectRatio="none" className="h-[174px] w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="overview-score-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B6B57" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0B6B57" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[chartTop, (chartTop + chartBottom) / 2, chartBottom].map((y) => <line key={y} x1="0" x2={chartWidth} y1={y} y2={y} stroke="#DCE5E1" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />)}
              <polygon points={areaPoints} fill="url(#overview-score-area)" />
              <polyline points={linePoints} fill="none" stroke="#0B6B57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {points.map((point, index) => <circle key={point.date} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5 : 3.5} fill="white" stroke="#0B6B57" strokeWidth={index === points.length - 1 ? 3 : 2} vectorEffect="non-scaling-stroke" />)}
            </svg>
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold tabular-nums text-[#65736E] sm:text-[11px]">
              {overviewScoreTrend.map((point) => <span key={point.date}>{point.date}</span>)}
            </div>
          </div>
        </article>
      </div>

      <div className="grid min-w-0 border-t border-[#CBD8D2] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <article key={metric.label} className={cn("min-w-0 bg-white px-5 py-5 sm:px-6", index > 0 && "border-t border-[#E1E8E5] sm:border-l", index === 1 && "sm:border-t-0", index >= 2 && "xl:border-t-0")}>
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="text-[12px] font-bold leading-5 text-[#52625C] sm:text-[13px]">{metric.label}</h3>
              <ReportHelpTooltip text={metric.definition} label={`${metric.label}の定義`} triggerLabel="定義" />
            </div>
            <p className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-[#101828] sm:text-[38px]">{metric.value}</p>
            <p className="mt-3 text-[12px] font-bold tabular-nums text-[#08735B]">{metric.delta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function OverviewBrandRankingTable() {
  const self = competitors.find((brand) => brand.isPrimary) ?? competitors[0];
  const topCompetitors = competitors.filter((brand) => !brand.isPrimary).sort((a, b) => b.aiPresence - a.aiPresence).slice(0, 5);
  const rows = [self, ...topCompetitors];

  return (
    <div className="min-w-0">
      <div className="hidden grid-cols-[64px_minmax(220px,1fr)_minmax(220px,0.9fr)] border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] sm:grid">
        <span className="px-5 py-3 text-center">順位</span>
        <span className="px-5 py-3">ブランド</span>
        <span className="px-5 py-3">AI表示率</span>
      </div>
      <div className="divide-y divide-[#E2E8E5]">
        {rows.map((row, index) => (
          <div key={row.id} className={cn("grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-x-3 px-4 py-4 sm:grid-cols-[44px_minmax(220px,1fr)_minmax(220px,0.9fr)] sm:px-5", row.isPrimary ? "bg-[#ECF6F1]" : "bg-white", index === 1 && "border-t-2 border-t-[#B8CCC3]")}>
            <span className="text-center text-[16px] font-semibold tabular-nums text-[#243A32]">{row.rank}</span>
            <span className="flex min-w-0 items-center gap-2.5">
              <EntityIdentity name={row.name} logoUrl={row.logoUrl} compact />
              {row.isPrimary ? <DataRichBadge tone="green">自社</DataRichBadge> : null}
            </span>
            <div className="col-start-2 mt-3 min-w-0 sm:col-start-auto sm:mt-0">
              <span className="mb-1.5 block text-[10px] font-bold text-[#65736E] sm:hidden">AI表示率</span>
              <DataRichInlineBar value={row.aiPresence} label={`${row.aiPresence}%`} fillClassName={row.isPrimary ? "bg-[#0B6B57]" : "bg-[#8AA89B]"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPage({ context }: { context: PageContext }) {
  return (
    <DashboardFrame
      context={context}
      enableDetailDrawer={false}
      eyebrow="ダッシュボード概要"
      title="ダッシュボード概要"
      description="AI検索上の現在地と、前日からの重要な変化を確認します。"
      scopeMode="none"
      primaryContent={(
        <div className="min-w-0 space-y-7">
          <OverviewContextStrip range={context.range} />
          <OverviewPrimarySummary />
        </div>
      )}
    >
      <DataRichPanel title="ブランドランキング" bodyClassName="p-0" variant="evidence">
        <OverviewBrandRankingTable />
      </DataRichPanel>

      <div className="min-w-0 space-y-7">
        <DataRichPanel title="AIモデル別比較" bodyClassName="p-0" variant="comparison">
          <OverviewModelSummaryTable />
        </DataRichPanel>
        <DataRichPanel title="重要な前日差" variant="trend">
          <ChangeLog reportBase={context.reportBase} />
        </DataRichPanel>
      </div>
    </DashboardFrame>
  );
}

function OverviewKpiSummary({
  reportBase,
  validObservations,
  missingObservations
}: {
  reportBase: string;
  validObservations: string;
  missingObservations: string;
}) {
  const score = Math.max(0, Math.min(100, kpis.visibilityScore));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const validCount = Number(validObservations.replace(/[^0-9]/g, "")) || 0;
  const missingCount = Number(missingObservations.replace(/[^0-9]/g, "")) || 0;
  const expectedCount = validCount + missingCount;
  const observationSuccessRate = expectedCount ? (validCount / expectedCount) * 100 : 0;

  const supportingMetrics: { label: string; value: string; helper: string; delta: string; progress: number | null; href: string; detail: ReportDetailPayload }[] = [
    {
      label: "AI表示率",
      value: `${kpis.aiPresenceRate}%`,
      helper: "Non-brand有効回答に自社が掲載された割合",
      delta: "前日比 +3pt",
      progress: kpis.aiPresenceRate,
      href: `${reportBase}/prompts`,
      detail: {
        title: "AI表示率",
        value: `${kpis.aiPresenceRate}%`,
        summary: "Non-brandの有効回答でRecoraが掲載された割合です。未掲載と計測失敗を分けて集計します。",
        sections: [
          { title: "比較", facts: [{ label: "前日", value: "54%" }, { label: "現在", value: "57%", tone: "green" }, { label: "差", value: "+3pt", tone: "green" }] },
          { title: "差に寄与した観測群", items: [
            { title: "マーケ責任者 × 競合比較", meta: "+5pt・matched 96件", description: "同じ質問・モデルで前日と比較できた観測群" },
            { title: "Google AI Mode", meta: "66%", description: "契約モデル内で最も高い観測値" },
            { title: "Gemini", meta: "54%", description: "Gemini群のAI表示率。未掲載回答は別集計" }
          ] },
          { title: "この差に含まれる観測", table: { columns: ["観測ID", "観測日時", "AIモデル", "プロンプトID", "判定"], rows: [["OBS-20260706-GAI-096", "2026/07/06 06:18", "Google AI Mode", "P-096", "掲載あり・1位"], ["OBS-20260706-GPT-042", "2026/07/06 06:04", "GPT", "P-042", "掲載あり・2位"], ["OBS-20260706-GEM-077", "2026/07/06 06:11", "Gemini", "P-077", "有効・未掲載"]] } }
        ],
        detailHref: `${reportBase}/prompts`,
        detailLabel: "該当プロンプトを全件で確認"
      }
    },
    {
      label: "AI内の存在感（AI内シェア）",
      value: `${kpis.sov}%`,
      helper: "AI回答内での自社の存在感",
      delta: "前日比 +2pt",
      progress: kpis.sov,
      href: `${reportBase}/leaderboard`,
      detail: {
        title: "AI内の存在感（AI内シェア）",
        value: `${kpis.sov}%`,
        summary: "同じNon-brand回答群で、比較対象ブランドの掲載量に占めるRecoraの存在感です。",
        sections: [
          { title: "比較", facts: [{ label: "前日", value: "22%" }, { label: "現在", value: "24%", tone: "green" }, { label: "首位", value: "Trailbase 34%" }] },
          { title: "ブランド別構成", table: { columns: ["ブランド", "AI内シェア", "AI表示率"], rows: [["Trailbase", "34%", "74%"], ["SignalNest", "27%", "63%"], ["Recora", "24%", "57%"], ["MentionMap", "18%", "48%"]] } },
          { title: "AI内シェアを構成した掲載観測", table: { columns: ["観測ID", "AIモデル", "プロンプトID", "掲載ブランド", "推薦順"], rows: [["OBS-20260706-GPT-042", "GPT", "P-042", "Trailbase / Recora", "1位 / 2位"], ["OBS-20260706-PPX-031", "Perplexity", "P-031", "Recora / SignalNest", "1位 / 2位"], ["OBS-20260706-GAI-096", "Google AI Mode", "P-096", "Recora / Trailbase", "1位 / 3位"]] } },
          { title: "読み方", facts: [{ label: "分母", value: "同じ観測群に出た全ブランド掲載回数" }, { label: "注意", value: "回答文の長さではなく、定義済みのブランド掲載回数で算出" }] }
        ],
        detailHref: `${reportBase}/leaderboard`,
        detailLabel: "ブランド比較を全件で確認"
      }
    },
    {
      label: "ブランドランキング",
      value: `${kpis.brandRank}位`,
      helper: "Non-brandのAI表示率順位",
      delta: "前日比 変動なし",
      progress: null,
      href: `${reportBase}/leaderboard`,
      detail: {
        title: "ブランドランキング",
        value: `${kpis.brandRank}位`,
        summary: "Non-brandのAI表示率で並べた市場内順位です。前日と同じ3位です。",
        sections: [
          { title: "上位との差", table: { columns: ["順位", "ブランド", "AI表示率", "自社との差"], rows: [["1位", "Trailbase", "74%", "-17pt"], ["2位", "SignalNest", "63%", "-6pt"], ["3位", "Recora", "57%", "—"]] } },
          { title: "差が大きい質問群", items: [{ title: "競合比較", meta: "Trailbaseが21pt先行" }, { title: "改善施策", meta: "Recoraが3pt先行" }, { title: "引用元", meta: "SignalNestが17pt先行" }] },
          { title: "順位差を確認できる観測", table: { columns: ["観測ID", "観測日時", "AIモデル", "プロンプトID", "掲載順"], rows: [["OBS-20260706-GPT-018", "2026/07/06 06:02", "GPT", "P-018", "Trailbase 1位 / Recora 3位"], ["OBS-20260706-GEM-053", "2026/07/06 06:08", "Gemini", "P-053", "SignalNest 1位 / Recora 未掲載"], ["OBS-20260706-PPX-104", "2026/07/06 06:23", "Perplexity", "P-104", "Recora 1位 / Trailbase 2位"]] } }
        ],
        detailHref: `${reportBase}/leaderboard`,
        detailLabel: "上位20ブランドを確認"
      }
    },
    {
      label: "公式サイト引用率",
      value: `${kpis.ownCitationRate}%`,
      helper: "有効回答のうち自社URLが引用された割合",
      delta: "前日比 —",
      progress: kpis.ownCitationRate,
      href: `${reportBase}/sources`,
      detail: {
        title: "公式サイト引用率",
        value: `${kpis.ownCitationRate}%`,
        summary: "有効回答のうち、Recoraの公式URLが引用された回答の割合です。ブランド掲載とは別に判定します。",
        sections: [
          { title: "回答の分岐", table: { columns: ["状態", "割合", "回答"], rows: [["ブランド掲載＋自社引用", "26%", "3,894件"], ["ブランド掲載のみ", "31%", "4,642件"], ["自社引用のみ", "5%", "749件"], ["どちらもなし", "38%", "5,691件"]] } },
          { title: "引用元上位", items: [{ title: "recora.jp", meta: "42回答" }, { title: "marketing-ai.jp", meta: "28回答" }, { title: "trailbase.io", meta: "34回答・競合側" }] },
          { title: "引用された観測とURL", table: { columns: ["観測ID", "AIモデル", "プロンプトID", "引用URL", "主張との整合"], rows: [["OBS-20260706-PPX-031", "Perplexity", "P-031", "recora.jp/features", "一致"], ["OBS-20260706-GPT-042", "GPT", "P-042", "recora.jp/guide", "要確認"], ["OBS-20260706-GAI-096", "Google AI Mode", "P-096", "marketing-ai.jp/research", "第三者引用"]] } }
        ],
        detailHref: `${reportBase}/sources`,
        detailLabel: "引用元とURLを全件で確認"
      }
    }
  ];
  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(310px,0.86fr)_minmax(0,2.14fr)]" aria-label="主要KPI">
      <article className="min-w-0 border-y border-[#BFD2C9] bg-[#F4FAF7] p-5 sm:p-7">
        <div className="flex min-w-0 items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-[13px] font-bold leading-5 text-[#344054]">総合AI可視性スコア</p>
              <ReportHelpTooltip text="主要指標を平均して算出するRecora独自の総合指標です" label="総合AI可視性スコアの定義" />
            </div>
            <div className="mt-2 -ml-1 px-1">
              <span className="flex items-baseline gap-2">
                <span className="text-[54px] font-semibold leading-none tracking-[-0.055em] tabular-nums text-[#0B382D] sm:text-[60px]">{score}</span>
                <span className="text-base font-semibold text-[#475467]">/ 100</span>
              </span>
            </div>
          </div>
          <div className="relative grid h-24 w-24 shrink-0 place-items-center sm:h-28 sm:w-28" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90 overflow-visible">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#E8EEEB" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#0B6B57"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
              />
            </svg>
            <span className="relative text-sm font-bold tabular-nums text-[#344054]">{score}</span>
          </div>
        </div>
        <div className="mt-5 border-t border-[#E1E7E4] pt-4">
          <p className="text-[13px] font-semibold text-[#344054]">主要指標をまとめたRecora独自の総合指標です</p>
          <p className="mt-1.5 text-[13px] font-medium leading-6 text-[#5D6B66]">
            有効観測 {validObservations} / 欠測 {missingObservations} / 欠測モデルなし
          </p>
          <div className="mt-3" aria-label={`観測成功率 ${observationSuccessRate.toFixed(1)}%`}>
            <div className="flex items-end justify-between gap-3">
              <p className="text-[11px] font-bold text-[#667085]">観測完全性</p>
              <p className="text-[18px] font-semibold tabular-nums text-[#0B382D]">{observationSuccessRate.toFixed(1)}%</p>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#F0DDBE]" aria-hidden="true">
              <span className="h-full bg-[#0B6B57]" style={{ width: `${observationSuccessRate}%` }} />
              <span className="h-full flex-1 bg-[#D69E4D]" />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-semibold leading-4 text-[#667085]">
              <div><dt>予定観測</dt><dd className="mt-0.5 text-[12px] font-bold tabular-nums text-[#344054]">{expectedCount.toLocaleString("ja-JP")}件</dd></div>
              <div><dt>有効観測</dt><dd className="mt-0.5 text-[12px] font-bold tabular-nums text-[#075E44]">{validObservations}</dd></div>
              <div><dt>欠測</dt><dd className="mt-0.5 text-[12px] font-bold tabular-nums text-[#A15C00]">{missingObservations}</dd></div>
            </dl>
            <p className="mt-2 text-[10px] font-semibold leading-4 text-[#667085]">欠測は未掲載に置き換えず、各指標の分母から除外します。</p>
          </div>
        </div>
      </article>

      <section className="grid min-w-0 grid-cols-2 gap-px overflow-hidden border-y border-[#D7E0DC] bg-[#D7E0DC]" aria-label="総合スコアを構成する主要指標">
        {supportingMetrics.map((item) => (
          <article key={item.label} className="min-w-0 bg-white px-4 py-5 sm:px-5 sm:py-6">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="break-words text-[12px] font-bold leading-5 text-[#5D6B66] sm:text-[13px]">{item.label}</p>
              <ReportHelpTooltip text={item.helper} label={`${item.label}の定義`} />
            </div>
            <Link href={item.href} className="mt-2 flex w-fit max-w-full justify-start rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2" aria-label={`${item.label}を確認`}>
              <span className="break-words text-[28px] font-semibold leading-tight tracking-[-0.025em] tabular-nums text-[#101828] [word-break:keep-all] sm:text-[32px]">{item.value}</span>
            </Link>
            <p className="mt-2 text-[12px] font-bold leading-5 tabular-nums text-[#075E44]">{item.delta}</p>
            {typeof item.progress === "number" ? (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EDF2F0]" aria-hidden="true">
                <div className="h-full rounded-full bg-[#0B6B57]" style={{ width: `${item.progress}%` }} />
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </section>
  );
}

function TrendsPage({ context }: { context: PageContext }) {
  return (
    <DashboardFrame
      context={context}
      eyebrow="推移・変化"
      title="推移・変化"
      description="主要指標の期間推移、モデル合意度、日次安定性、変化が大きかった対象を一ページで縦に確認します。"
      scopeMode="none"
    >
      <TrendAnalysisContent
        reportBase={context.reportBase}
        provider="全モデル"
        models={activeModels.map((model) => model.name)}
      />
    </DashboardFrame>
  );
}

function TrendChangesPage({ context }: { context: PageContext }) {
  const trendReturnHref = useReturnHref(context.reportBase + "/trends#trend-contribution");
  return (
    <DashboardFrame
      context={context}
      eyebrow="推移・変化"
      title="変化した対象"
      description="前期間から変化したモデル・ペルソナ・トピック・競合差を、主要指標ごとに比較します。"
      scopeMode="none"
      action={<DataRichPrimaryAction href={trendReturnHref} variant="secondary">推移・変化へ戻る</DataRichPrimaryAction>}
    >
      <TrendChangesDetailContent models={activeModels.map((model) => model.name)} />
    </DashboardFrame>
  );
}

function AnalysisTargetNotFound({
  context,
  section,
  backHref,
  backLabel
}: {
  context: PageContext;
  section: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <DashboardFrame
      context={context}
      eyebrow={section}
      title="分析対象が見つかりません"
      description="指定された対象は、現在のレポートデータに含まれていません。別の対象を一覧から選び直してください。"
      action={<DataRichPrimaryAction href={backHref} variant="secondary">{backLabel}</DataRichPrimaryAction>}
    >
      <DataRichPanel title="対象を選び直してください" description="存在しないIDを別データへ置き換えて表示しない設計です。">
        <p className="text-sm leading-6 text-[#475467]">一覧へ戻り、表示されている項目から分析対象を選択してください。</p>
      </DataRichPanel>
    </DashboardFrame>
  );
}

function PersonaDetailPage({ context }: { context: PageContext }) {
  const personaName = personaNameById[context.detailId ?? ""];
  if (!personaName) {
    return <AnalysisTargetNotFound context={context} section="ペルソナ・トピック" backHref={context.reportBase + "/persona-topics"} backLabel="ペルソナ・トピックへ戻る" />;
  }
  return (
    <DashboardFrame
      context={context}
      eyebrow="ペルソナ・トピック"
      title={personaName}
      description={`${personaName}に対する表示状況を、トピック・競合・AIモデル・期間変化から分析します。`}
      action={<DataRichPrimaryAction href={context.reportBase + "/persona-topics"} variant="secondary">ペルソナ・トピックへ戻る</DataRichPrimaryAction>}
    >
      <PersonaDetailContent reportBase={context.reportBase} personaName={personaName} models={activeModels.map((model) => model.name)} />
    </DashboardFrame>
  );
}

function TopicDetailPage({ context }: { context: PageContext }) {
  const topicReturnHref = useReturnHref(context.reportBase + "/persona-topics");
  const topicReturnLabel = returnLabelForHref(topicReturnHref, "ペルソナ・トピックへ戻る");
  const topicName = topicNameById[context.detailId ?? ""];
  if (!topicName) {
    return <AnalysisTargetNotFound context={context} section="ペルソナ・トピック" backHref={topicReturnHref} backLabel={topicReturnLabel} />;
  }
  return (
    <DashboardFrame
      context={context}
      eyebrow="ペルソナ・トピック"
      title={topicName}
      description={`${topicName}における表示状況を、ペルソナ・競合・AIモデル・期間変化から分析します。`}
      action={<DataRichPrimaryAction href={topicReturnHref} variant="secondary">{topicReturnLabel}</DataRichPrimaryAction>}
    >
      <TopicDetailContent reportBase={context.reportBase} topicName={topicName} models={activeModels.map((model) => model.name)} />
    </DashboardFrame>
  );
}

function CitationGapDetailPage({ context }: { context: PageContext }) {
  const sourceReturnHref = useReturnHref(context.reportBase + "/sources#citation-competition");
  return (
    <DashboardFrame
      context={context}
      eyebrow="引用・参照元"
      title="競合との引用差"
      description="競合だけが引用された質問とURLを、影響回答の多い順に比較します。"
      scopeMode="none"
      action={<DataRichPrimaryAction href={sourceReturnHref} variant="secondary">引用・参照元へ戻る</DataRichPrimaryAction>}
    >
      <DataRichPanel
        title="競合との引用差"
        description={`${orderedActiveCitationGapRows.length}件を、質問・AIモデル・先行競合・引用URL・影響回答・継続日数で比較します。`}
        bodyClassName="p-0"
        variant="evidence"
      >
        <CitationGapTable stickyHeader />
      </DataRichPanel>
    </DashboardFrame>
  );
}
function SourceDomainDetailPage({ context }: { context: PageContext }) {
  const sourceReturnHref = useReturnHref(context.reportBase + "/sources");
  const sourceReturnLabel = returnLabelForHref(sourceReturnHref, "引用・参照元へ戻る");
  const sourceDomainRow = sourceDomains.find((item) => item.id === context.detailId);
  const domainName = sourceDomainNameById[context.detailId ?? ""] ?? sourceDomainRow?.domain ?? resolveSourceDomainDisplayName(context.detailId);
  if (!domainName) {
    return <AnalysisTargetNotFound context={context} section="引用・参照元" backHref={sourceReturnHref} backLabel={sourceReturnLabel} />;
  }
  return (
    <DashboardFrame
      context={context}
      eyebrow="引用・参照元"
      title={domainName}
      description={`${domainName}が引用された回答、上位URL、モデル・ペルソナ・トピック差、期間変化を分析します。`}
      action={<DataRichPrimaryAction href={sourceReturnHref} variant="secondary">{sourceReturnLabel}</DataRichPrimaryAction>}
    >
      <SourceDomainDetailContent
        reportBase={context.reportBase}
        models={activeModels.map((model) => model.name)}
        domainId={context.detailId}
        domainName={domainName}
        metrics={{
          answerCoverage: sourceDomainRow?.citations,
          citationOccurrences: sourceDomainRow?.citations,
          urlCount: sourcePages.filter((page) => page.domain === domainName).length
        }}
      />
    </DashboardFrame>
  );
}

function SourcePageDetailPage({ context }: { context: PageContext }) {
  const sourceReturnHref = useReturnHref(context.reportBase + "/sources");
  const sourcePageRow = sourcePages.find((item) => item.id === context.detailId);
  const sourcePageName = sourcePageNameById[context.detailId ?? ""] ?? (sourcePageRow ? `${sourcePageRow.domain}${sourcePageRow.url}` : resolveSourcePageDisplayName(context.detailId));
  if (!sourcePageName) {
    return <AnalysisTargetNotFound context={context} section="引用・参照元" backHref={context.reportBase + "/sources"} backLabel="引用・参照元へ戻る" />;
  }
  return (
    <DashboardFrame
      context={context}
      eyebrow="引用・参照元"
      title={sourcePageName}
      description="このURLが引用された回答、対応する主張、モデル差、期間変化を分析します。"
      action={<DataRichPrimaryAction href={sourceReturnHref} variant="secondary">引用・参照元へ戻る</DataRichPrimaryAction>}
    >
      <SourcePageDetailContent
        reportBase={context.reportBase}
        sourcePageId={context.detailId}
        sourcePageName={sourcePageName}
        metrics={{
          answerCoverage: sourcePageRow?.citations,
          citationOccurrences: sourcePageRow?.citations
        }}
      />
    </DashboardFrame>
  );
}

function ClaimDetailPage({ context }: { context: PageContext }) {
  const claimReturnHref = useReturnHref(context.reportBase + "/brand-perception");
  const claimReturnLabel = returnLabelForHref(claimReturnHref, "ブランド認識・感情へ戻る");
  const claimRow = claimRiskRows.find((item) => item.id === context.detailId);
  if (!claimRow) {
    return <AnalysisTargetNotFound context={context} section="ブランド認識・感情" backHref={claimReturnHref} backLabel={claimReturnLabel} />;
  }
  const claimName = claimRow.claim;
  const claimPrompt = promptRows.find((prompt) => prompt.id === claimRow.promptId);
  const evidenceAnswers = answerRows
    .filter((answer) => answer.promptId === claimRow.promptId && claimRow.modelNames.some((modelName) => modelName === answer.model))
    .map((answer) => ({
      id: answer.id,
      promptId: answer.promptId,
      prompt: answer.prompt,
      model: answer.model,
      retrievalStatus: answer.retrievalStatus,
      listed: answer.listed,
      verification: answer.verification,
      citations: answer.citations,
      citationUrls: answerCitationUrls.slice(0, answer.citations),
      persona: claimPrompt?.persona ?? "未指定",
      topic: claimPrompt?.topic ?? "未指定",
      observedAt: "2026-07-06 06:00 JST"
    }));
  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド認識・感情"
      title={claimName}
      description="AIの主張が、どの回答・AIモデル・ペルソナ・トピックで出現したかを確認します。"
      action={<DataRichPrimaryAction href={claimReturnHref} variant="secondary">{claimReturnLabel}</DataRichPrimaryAction>}
    >
      <ClaimDetailContent
        reportBase={context.reportBase}
        models={activeModels.map((model) => model.name)}
        claimId={context.detailId}
        claimName={claimName}
        claimSummary={claimRow ? {
          id: claimRow.id,
          name: claimRow.claim,
          verdict: claimRow.type,
          severity: claimRow.severity,
          answers: claimRow.answers,
          models: claimRow.models,
          days: claimRow.days,
          evidenceAnswers
        } : undefined}
      />
    </DashboardFrame>
  );
}

function RecommendationDetailPage({ context }: { context: PageContext }) {
  const recommendationReturnHref = useReturnHref(context.reportBase + "/recommendations");
  const recommendation = improvementRows.find((item) => item.id === context.detailId);
  if (!recommendation) {
    return <AnalysisTargetNotFound context={context} section="改善提案・施策" backHref={recommendationReturnHref} backLabel="改善提案・施策へ戻る" />;
  }
  return (
    <DashboardFrame
      context={context}
      eyebrow="改善提案・施策"
      title={recommendation.action}
      description="改善内容、必要な理由、影響範囲、根拠、受入条件、実施後の確認方法を表示します。"
      scopeMode="none"
      action={<DataRichPrimaryAction href={recommendationReturnHref} variant="secondary">改善提案・施策へ戻る</DataRichPrimaryAction>}
    >
      <RecommendationDetailContent
        reportBase={context.reportBase}
        models={activeModels.map((model) => model.name)}
        recommendationId={context.detailId}
        recommendationName={recommendation.action}
        recommendation={{
          priority: recommendation.priority,
          target: recommendation.target,
          metric: recommendation.metric,
          evidence: recommendation.evidence,
          impact: recommendation.impact,
          category: recommendation.category
        }}
      />
    </DashboardFrame>
  );
}

function brandOverviewRows() {
  const self = competitors.find((brand) => brand.isPrimary) ?? competitors[0];
  const rivals = competitors
    .filter((brand) => !brand.isPrimary)
    .sort((a, b) => b.aiPresence - a.aiPresence)
    .slice(0, 5);
  return [self, ...rivals];
}

const marketPositionGroups = {
  self: { label: "自社", fill: "#075E44", tint: "#E7F3EE", ring: "#8FC8B3", text: "#075E44" },
  leader: { label: "先行", fill: "#315F7D", tint: "#EAF1F5", ring: "#A9C3D2", text: "#274E68" },
  close: { label: "接戦", fill: "#9A5B0B", tint: "#FBF1DF", ring: "#E4C48F", text: "#7A4708" },
  field: { label: "追随", fill: "#5F6F6A", tint: "#EEF2F0", ring: "#BBC6C2", text: "#46534F" }
} as const;

type MarketPositionGroup = keyof typeof marketPositionGroups;

function marketPositionGroupFor(
  brand: (typeof competitors)[number],
  self: (typeof competitors)[number]
): MarketPositionGroup {
  if (brand.isPrimary) return "self";
  if (brand.aiPresence > self.aiPresence + 5) return "leader";
  if (Math.abs(brand.aiPresence - self.aiPresence) <= 10) return "close";
  return "field";
}

function marketBubbleSize(aiPresence: number, isPrimary: boolean) {
  if (isPrimary) return 70;
  return Math.round(Math.max(52, Math.min(62, 47 + aiPresence * 0.2)));
}

const marketOverviewBubbleOffsets: Record<string, { x: number; y: number }> = {
  recora: { x: -1, y: 6 },
  trailbase: { x: 0, y: -3 },
  signalnest: { x: 1, y: -6 },
  mentionmap: { x: -2, y: -4 },
  ranklens: { x: 3, y: 3 },
  answergrid: { x: -3, y: 14 }
};


function BrandLogoMark({
  brand,
  size = "md"
}: {
  brand: (typeof competitors)[number];
  size?: "sm" | "md" | "lg";
}) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const identity = identityMarks[brand.name] ?? {
    mark: brand.name.trim().slice(0, 1).toUpperCase() || "?",
    surface: "bg-[#F2F4F7]",
    text: "text-[#475467]"
  };
  const imageFailed = Boolean(brand.logoUrl && failedLogoUrl === brand.logoUrl);
  const sizeClass = size === "lg" ? "h-12 w-12 rounded-xl text-[15px]" : size === "sm" ? "h-7 w-7 rounded-md text-[10px]" : "h-9 w-9 rounded-lg text-[12px]";

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border border-black/5 font-bold shadow-[0_2px_6px_rgba(16,24,40,0.10)]", sizeClass, identity.surface, identity.text)}
      aria-hidden="true"
    >
      {brand.logoUrl && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" className="h-full w-full object-contain p-1.5" onError={() => setFailedLogoUrl(brand.logoUrl)} />
      ) : (
        identity.mark
      )}
    </span>
  );
}

function formatCompetitorGap(
  selfValue: number,
  competitorValue: number,
  unit: "pt" | "位",
  lowerIsBetter = false
) {
  const gap = competitorValue - selfValue;
  if (Math.abs(gap) < 0.05) return "同じ";
  const competitorAhead = lowerIsBetter ? gap < 0 : gap > 0;
  const amount = Math.abs(gap).toFixed(unit === "位" ? 1 : 0);
  return (competitorAhead ? "競合が" : "自社が") + amount + unit + "上";
}

function BrandRankingOverviewSection({
  reportBase,
  selectedBrandId,
  onSelectBrand
}: {
  reportBase: string;
  selectedBrandId: string;
  onSelectBrand: (brandId: string) => void;
}) {
  const rows = brandOverviewRows();
  const self = rows[0];
  const selected = rows.find((brand) => brand.id === selectedBrandId) ?? rows[1];
  const metrics = [
    { label: "AI表示率", selfValue: self.aiPresence, competitorValue: selected.aiPresence, display: (value: number) => value + "%", gap: formatCompetitorGap(self.aiPresence, selected.aiPresence, "pt") },
    { label: "AI内シェア（SOV）", selfValue: self.sov, competitorValue: selected.sov, display: (value: number) => value + "%", gap: formatCompetitorGap(self.sov, selected.sov, "pt") },
    { label: "平均掲載位置", selfValue: self.averagePosition, competitorValue: selected.averagePosition, display: (value: number) => value.toFixed(1) + "位", gap: formatCompetitorGap(self.averagePosition, selected.averagePosition, "位", true) },
    { label: "公式サイト引用率", selfValue: self.citationRate, competitorValue: selected.citationRate, display: (value: number) => value + "%", gap: formatCompetitorGap(self.citationRate, selected.citationRate, "pt") }
  ];

  return (
    <DataRichPanel title="ブランドランキング" bodyClassName="p-0" variant="evidence">
      <div className="hidden grid-cols-[72px_minmax(220px,1fr)_minmax(240px,0.85fr)] border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] sm:grid">
        <span className="whitespace-nowrap px-5 py-3 text-center">順位</span>
        <span className="px-5 py-3">ブランド</span>
        <span className="px-5 py-3">AI表示率</span>
      </div>
      <div className="divide-y divide-[#E2E8E5]">
        {rows.map((brand, index) => {
          const selectedRow = !brand.isPrimary && brand.id === selected.id;
          const rowContent = (
            <>
              <span className="text-center text-[16px] font-semibold tabular-nums text-[#243A32]">{brand.rank}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                {brand.isPrimary ? <DataRichBadge tone="green">自社</DataRichBadge> : selectedRow ? <DataRichBadge tone="green">比較中</DataRichBadge> : null}
              </span>
              <span className="col-start-2 mt-2 min-w-0 sm:col-start-auto sm:mt-0">
                <DataRichInlineBar value={brand.aiPresence} label={brand.aiPresence + "%"} fillClassName={brand.isPrimary ? "bg-[#0B6B57]" : selectedRow ? "bg-[#344054]" : "bg-[#9CB1A8]"} />
              </span>
            </>
          );
          const rowClass = cn(
            "grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-x-3 px-4 py-3.5 text-left sm:grid-cols-[44px_minmax(220px,1fr)_minmax(240px,0.85fr)] sm:px-5",
            brand.isPrimary ? "bg-[#ECF6F1]" : selectedRow ? "bg-[#F5F8F7]" : "bg-white hover:bg-[#FAFCFB]",
            index === 1 && "border-t-2 border-t-[#B8CCC3]"
          );

          return brand.isPrimary ? (
            <div key={brand.id} className={rowClass}>{rowContent}</div>
          ) : (
            <button key={brand.id} type="button" className={cn(rowClass, "w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B6B57]")} aria-pressed={selectedRow} onClick={() => onSelectBrand(brand.id)}>
              {rowContent}
            </button>
          );
        })}
      </div>

      <section className="border-t border-[#BFCFC8] bg-[#F8FAF9]" aria-label={selected.name + "との比較"}>
        <div className="flex flex-col gap-4 border-b border-[#DDE5E1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <EntityIdentity name={self.name} logoUrl={self.logoUrl} />
            <span className="text-[13px] font-bold text-[#667085]">vs</span>
            <EntityIdentity name={selected.name} logoUrl={selected.logoUrl} />
          </div>
          <p className="text-[12px] font-semibold text-[#52625C]">選択した1社との差を同じ指標で比較</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={metric.label} className={cn("min-w-0 bg-white px-4 py-4 sm:px-5", index > 0 && "border-t border-[#E2E8E5] sm:border-l", index === 1 && "sm:border-t-0", index >= 2 && "xl:border-t-0")}>
              <p className="text-[11px] font-bold text-[#667085]">{metric.label}</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div><span className="block text-[10px] font-semibold text-[#667085]">自社</span><span className="mt-0.5 block text-[20px] font-semibold tabular-nums text-[#0B382D]">{metric.display(metric.selfValue)}</span></div>
                <div><span className="block text-[10px] font-semibold text-[#667085]">{selected.name}</span><span className="mt-0.5 block text-[20px] font-semibold tabular-nums text-[#101828]">{metric.display(metric.competitorValue)}</span></div>
              </div>
              <p className="mt-2 text-[11px] font-bold text-[#52625C]">{metric.gap}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-[#DDE5E1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <DataRichPrimaryAction href={reportBase + "/leaderboard/ranking"} variant="secondary">上位100社のランキングを見る</DataRichPrimaryAction>
          <DataRichPrimaryAction href={reportBase + "/leaderboard/" + selected.id + "?return=" + encodeURIComponent(reportBase + "/leaderboard")}>{selected.name}を詳しく比較</DataRichPrimaryAction>
        </div>
      </section>
    </DataRichPanel>
  );
}

function BrandMarketPositionSection({
  reportBase,
  selectedBrandId,
  onSelectBrand
}: {
  reportBase: string;
  selectedBrandId: string;
  onSelectBrand: (brandId: string) => void;
}) {
  const rows = brandOverviewRows();
  const self = rows[0];
  const selected = rows.find((brand) => brand.id === selectedBrandId) ?? self;
  const xFor = (value: number) => Math.max(8, Math.min(92, 8 + value * 0.84));
  const yFor = (value: number) => Math.max(8, Math.min(90, 8 + ((value - 1) / 6) * 82));
  const metrics = [
    { label: "AI表示率", value: selected.aiPresence + "%", gap: selected.isPrimary ? "自社基準" : formatCompetitorGap(self.aiPresence, selected.aiPresence, "pt") },
    { label: "AI内シェア（SOV）", value: selected.sov + "%", gap: selected.isPrimary ? "自社基準" : formatCompetitorGap(self.sov, selected.sov, "pt") },
    { label: "平均掲載位置", value: selected.averagePosition.toFixed(1) + "位", gap: selected.isPrimary ? "自社基準" : formatCompetitorGap(self.averagePosition, selected.averagePosition, "位", true) },
    { label: "公式サイト引用率", value: selected.citationRate + "%", gap: selected.isPrimary ? "自社基準" : formatCompetitorGap(self.citationRate, selected.citationRate, "pt") }
  ];

  return (
    <DataRichPanel
      title="市場内ポジション"
      description="円の大きさはAI表示率、色は自社との位置関係を示します。"
      bodyClassName="p-0"
      variant="comparison"
    >
      <div className="px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[11px] font-semibold text-[#5D6B66]">右ほどAI表示率が高く、上ほど平均掲載位置が上位</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="市場ポジションの色分け">
            {Object.entries(marketPositionGroups).map(([group, tone]) => (
              <span key={group} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#52625C]">
                <span className="h-3 w-3 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(16,24,40,0.10)]" style={{ backgroundColor: tone.fill }} aria-hidden="true" />
                {tone.label}
              </span>
            ))}
            <span className="border-l border-[#D5E1DB] pl-4 text-[10px] font-bold text-[#667085]">すべてのAI</span>
          </div>
        </div>

        <div className="relative h-[410px] min-w-0 overflow-hidden rounded-2xl border border-[#CFDCD6] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="absolute right-0 top-0 h-1/2 w-1/2 bg-[#F3F8F6]" aria-hidden="true" />
          {[20, 40, 60, 80].map((tick) => <span key={"x-" + tick} className="absolute bottom-0 top-0 border-l border-dashed border-[#DDE5E1]" style={{ left: tick + "%" }} aria-hidden="true" />)}
          {[20, 40, 60, 80].map((tick) => <span key={"y-" + tick} className="absolute left-0 right-0 border-t border-dashed border-[#DDE5E1]" style={{ top: tick + "%" }} aria-hidden="true" />)}
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-[#667085]">AI表示率</span>
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-[#667085]">平均掲載位置</span>

          {rows.map((brand) => {
            const active = brand.id === selected.id;
            const group = marketPositionGroupFor(brand, self);
            const tone = marketPositionGroups[group];
            const bubbleSize = marketBubbleSize(brand.aiPresence, brand.isPrimary);
            const offset = marketOverviewBubbleOffsets[brand.id] ?? { x: 0, y: 0 };
            return (
              <button
                key={brand.id}
                type="button"
                aria-label={brand.name + "、" + tone.label + "、AI表示率" + brand.aiPresence + "%を表示"}
                aria-pressed={active}
                className="group absolute z-10 flex w-[116px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B57] focus-visible:ring-offset-4"
                style={{ left: xFor(brand.aiPresence) + offset.x + "%", top: yFor(brand.averagePosition) + offset.y + "%" }}
                onClick={() => onSelectBrand(brand.id)}
              >
                <span
                  className="relative flex shrink-0 items-center justify-center rounded-full border-[3px] border-white transition-transform duration-150 group-hover:scale-[1.04] group-active:scale-[0.97]"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    backgroundColor: tone.fill,
                    boxShadow: active
                      ? "0 0 0 4px white, 0 0 0 8px " + tone.ring + ", 0 10px 24px rgba(16,24,40,0.18)"
                      : "0 0 0 1px rgba(16,24,40,0.08), 0 6px 16px rgba(16,24,40,0.14)"
                  }}
                  aria-hidden="true"
                >
                  <BrandLogoMark brand={brand} size={active ? "lg" : "md"} />
                  <span className="absolute -bottom-1 rounded-full border border-white bg-white px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums shadow-sm" style={{ color: tone.text }}>{brand.aiPresence}%</span>
                </span>
                <span className={cn("max-w-[116px] rounded-full bg-white/95 px-2.5 py-1 text-center text-[10px] font-bold leading-3 shadow-[0_1px_3px_rgba(16,24,40,0.10)]", active ? "text-[#075E44]" : "text-[#344054]")}>{brand.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="border-t border-[#D5E1DB] bg-white" aria-label="選択ブランドの市場位置">
        <div className="flex flex-col gap-3 border-b border-[#E2E8E5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <EntityIdentity name={selected.name} logoUrl={selected.logoUrl} />
          <p className="text-[13px] font-bold tabular-nums text-[#243A32]">{selected.rank}位</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={metric.label} className={cn("min-w-0 px-4 py-4 sm:px-6", index > 0 && "border-t border-[#E2E8E5] sm:border-l", index === 1 && "sm:border-t-0", index >= 2 && "xl:border-t-0")}>
              <p className="text-[11px] font-bold text-[#667085]">{metric.label}</p>
              <p className="mt-1 text-[22px] font-semibold tabular-nums text-[#101828]">{metric.value}</p>
              <p className="mt-1.5 text-[11px] font-bold text-[#52625C]">{metric.gap}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-[#DDE5E1] bg-[#FBFCFB] px-4 py-4 sm:px-6">
          <DataRichPrimaryAction href={reportBase + "/leaderboard/market"}>市場構造を詳しく見る</DataRichPrimaryAction>
        </div>
      </section>
    </DataRichPanel>
  );
}

function BrandModelHeatmap() {
  const brands = brandOverviewRows();
  const self = brands[0];
  const variations = [0, -2, 2, 1, -1, 3];
  const valueFor = (model: (typeof activeModels)[number], brand: (typeof competitors)[number], brandIndex: number) => {
    if (brand.isPrimary) return model.aiPresence;
    return Math.max(0, Math.min(100, Math.round(brand.aiPresence + (model.aiPresence - self.aiPresence) + variations[brandIndex])));
  };

  return (
    <DataRichPanel title="AIモデル×ブランド比較" bodyClassName="p-0" variant="analysis">
      <div className="hidden md:block">
        <div className="grid border-b border-[#DDE5E1] bg-[#F6F9F7]" style={{ gridTemplateColumns: "180px minmax(0,1fr)" }}>
          <span className="px-5 py-3 text-[11px] font-bold text-[#5D6B66]">AIモデル</span>
          <div className="grid" style={{ gridTemplateColumns: "repeat(" + brands.length + ", minmax(0,1fr))" }}>
            {brands.map((brand) => <span key={brand.id} className="flex min-w-0 flex-col items-center gap-1.5 border-l border-[#DDE5E1] px-2 py-3 text-center text-[10px] font-bold leading-4 text-[#344054]"><BrandLogoMark brand={brand} size="sm" /><span className="break-words">{brand.name}</span></span>)}
          </div>
        </div>
        <div className="divide-y divide-[#E2E8E5]">
          {activeModels.map((model) => {
            const values = brands.map((brand, brandIndex) => valueFor(model, brand, brandIndex));
            const rowMax = Math.max(...values);
            return (
              <div key={model.name} className="grid min-h-[76px]" style={{ gridTemplateColumns: "180px minmax(0,1fr)" }}>
                <div className="flex items-center px-5"><ModelIdentity name={model.name} /></div>
                <div className="grid" style={{ gridTemplateColumns: "repeat(" + brands.length + ", minmax(0,1fr))" }}>
                  {values.map((value, index) => (
                    <div key={brands[index].id} className={cn("flex items-center justify-center border-l border-[#E2E8E5] text-[16px] font-semibold tabular-nums", value === rowMax ? "font-bold text-[#075E44]" : "text-[#243A32]")} style={{ backgroundColor: "rgba(11,107,87," + (0.035 + value * 0.0018).toFixed(3) + ")" }}>{value}%</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-[#DDE5E1] md:hidden">
        {activeModels.map((model) => (
          <section key={model.name} className="px-4 py-4">
            <ModelIdentity name={model.name} />
            <div className="mt-3 divide-y divide-[#E2E8E5] border-y border-[#E2E8E5]">
              {brands.map((brand, brandIndex) => <div key={brand.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5"><EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact /><span className="font-semibold tabular-nums text-[#101828]">{valueFor(model, brand, brandIndex)}%</span></div>)}
            </div>
          </section>
        ))}
      </div>
      <p className="border-t border-[#DDE5E1] bg-[#FBFCFB] px-4 py-3 text-[11px] font-semibold text-[#667085] sm:px-5">色が濃いほど、そのAIモデルでのAI表示率が高いことを示します。</p>
    </DataRichPanel>
  );
}

function BrandCompetitorsPageV2({ context }: { context: PageContext }) {
  const [selectedBrandId, setSelectedBrandId] = useState("trailbase");
  const [selectedPositionBrandId, setSelectedPositionBrandId] = useState("recora");

  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド・競合"
      title="ブランド・競合"
      description="自社の市場順位、選択競合との差、市場内の位置、AIモデルごとの違いを確認します。"
      enableDetailDrawer={false}
      sectionIndexItems={[]}
    >
      <BrandRankingOverviewSection reportBase={context.reportBase} selectedBrandId={selectedBrandId} onSelectBrand={setSelectedBrandId} />
      <BrandMarketPositionSection reportBase={context.reportBase} selectedBrandId={selectedPositionBrandId} onSelectBrand={setSelectedPositionBrandId} />
      <BrandModelHeatmap />
    </DashboardFrame>
  );
}

function BrandRankingPage({ context }: { context: PageContext }) {
  const [provider, setProvider] = useState<ReportProvider>("全モデル");
  const providerModel = activeModels.find((model) => model.name === provider);
  const providerIndex = Math.max(0, activeModels.findIndex((model) => model.name === provider));
  const providerOffsets = [4, -3, 1, 6];
  const displayValueFor = (brand: (typeof rankingCompetitors)[number]) => {
    if (!providerModel) return brand.aiPresence;
    if (brand.isPrimary) return providerModel.aiPresence;
    const smallVariation = ((brand.rank + providerIndex * 2) % 5) - 2;
    return Math.max(0, Math.min(100, Math.round((brand.aiPresence + providerOffsets[providerIndex] + smallVariation) * 10) / 10));
  };
  const displayRows = rankingCompetitors
    .map((brand) => ({ brand, value: displayValueFor(brand) }))
    .sort((a, b) => b.value - a.value || a.brand.name.localeCompare(b.brand.name, "ja-JP"))
    .map((row, index) => ({ ...row, displayRank: index + 1 }));

  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド・競合"
      title="ブランドランキング 上位100社"
      description=""
      scopeMode="none"
      enableDetailDrawer={false}
      sectionIndexItems={[]}
      action={<DataRichPrimaryAction href={context.reportBase + "/leaderboard"} variant="secondary">ブランド・競合へ戻る</DataRichPrimaryAction>}
    >
      <section className="min-w-0 border-y border-[#C7D6CF] bg-white" aria-label="AIモデルを選択">
        <div className="sticky top-16 z-30 flex min-w-0 flex-wrap gap-2 border-b border-[#DDE5E1] bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
          <button type="button" onClick={() => setProvider("全モデル")} aria-pressed={provider === "全モデル"} className={cn("inline-flex min-h-10 items-center rounded-md border px-4 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B57]", provider === "全モデル" ? "border-[#0B6B57] bg-[#0B382D] text-white" : "border-[#D5E1DB] bg-white text-[#344054] hover:bg-[#F4F8F6]")}>すべてのAI</button>
          {activeModels.map((model) => (
            <button key={model.name} type="button" onClick={() => setProvider(model.name as ReportProvider)} aria-pressed={provider === model.name} className={cn("inline-flex min-h-10 items-center rounded-md border px-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B57]", provider === model.name ? "border-[#0B6B57] bg-[#E7F3ED]" : "border-[#D5E1DB] bg-white hover:bg-[#F4F8F6]")}>
              <ModelIdentity name={model.name} compact />
            </button>
          ))}
        </div>

        <div className="sticky top-[117px] z-20 hidden grid-cols-[72px_minmax(260px,1fr)_minmax(180px,0.55fr)] border-b border-[#DDE5E1] bg-[#F6F9F7]/95 text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] backdrop-blur sm:grid">
          <span className="px-5 py-3 text-center">順位</span>
          <span className="px-5 py-3">ブランド</span>
          <span className="px-5 py-3 text-right">AI表示率</span>
        </div>
        <div className="divide-y divide-[#E2E8E5]">
          {displayRows.map(({ brand, value, displayRank }) => (
            <Link
              key={brand.id}
              href={brand.isPrimary ? context.reportBase + "/leaderboard" : context.reportBase + "/leaderboard/" + brand.id + "?return=" + encodeURIComponent(context.reportBase + "/leaderboard/ranking")}
              className={cn("grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B6B57] sm:grid-cols-[52px_minmax(260px,1fr)_minmax(180px,0.55fr)] sm:px-5", brand.isPrimary ? "bg-[#ECF6F1] hover:bg-[#E3F1EA]" : "bg-white hover:bg-[#F7FAF8]")}
            >
              <span className="text-center text-[15px] font-semibold tabular-nums text-[#243A32]">{displayRank}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                {brand.isPrimary ? <DataRichBadge tone="green">自社</DataRichBadge> : null}
              </span>
              <span className={cn("text-right text-[16px] font-semibold tabular-nums sm:px-5", brand.isPrimary ? "text-[#075E44]" : "text-[#101828]")}>{value}%</span>
            </Link>
          ))}
        </div>
      </section>
    </DashboardFrame>
  );
}

function BrandCompetitorsPage({ context }: { context: PageContext }) {
  const [comparedBrandIds, setComparedBrandIds] = useState<string[]>(["trailbase", "signalnest"]);
  const [brandCompareUrlReady, setBrandCompareUrlReady] = useState(false);
  const comparedBrands = competitors.filter((item) => comparedBrandIds.includes(item.id));
  const brandReturnParams = new URLSearchParams();
  if (context.range !== "30日") brandReturnParams.set("range", context.range);
  if (context.provider !== "全モデル") brandReturnParams.set("provider", context.provider);
  if (comparedBrandIds.length) brandReturnParams.set("compare", comparedBrandIds.join(","));
  const brandReturnHref = `${context.reportBase}/leaderboard${brandReturnParams.size ? `?${brandReturnParams.toString()}` : ""}`;

  useEffect(() => {
    const queryIds = new URLSearchParams(window.location.search).get("compare")?.split(",")
      .filter((id) => competitors.some((item) => !item.isPrimary && item.id === id))
      .slice(0, 3);
    if (queryIds?.length) setComparedBrandIds(queryIds);
    setBrandCompareUrlReady(true);
  }, []);

  useEffect(() => {
    if (!brandCompareUrlReady) return;
    replaceCurrentQuery({ compare: comparedBrandIds.join(",") });
  }, [brandCompareUrlReady, comparedBrandIds]);

  const toggleComparedBrand = (brandId: string) => {
    setComparedBrandIds((current) => {
      if (current.includes(brandId)) return current.filter((id) => id !== brandId);
      if (current.length >= 3) return current;
      return [...current, brandId];
    });
  };

  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド・競合"
      title="ブランド・競合"
      description="自社と競合のAI表示状況、AI内シェア（SOV）、AIモデル別ランキング、詳細比較を確認します。"
    >
      <div className="space-y-8">
        <DataRichPanel title="市場・トピックポジション" description="自社が市場内で何番手かをNon-brandベースで表示します。" variant="summary">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="自社順位" value="3位" helper="上位20ブランド中" detail={brandRankingDetail(competitors[0], context.reportBase)} />
            <StatTile label="首位との差" value="-17pt" helper="AI表示率" tone="amber" detail={{
              kicker: "LEADER GAP",
              title: "首位TrailbaseとのAI表示率差",
              value: "-17pt",
              summary: "同じNon-brand質問集合で、Recoraと首位ブランドのAI表示率を比較した差です。",
              sections: [
                { title: "首位との差", facts: [{ label: "Recora", value: "57%" }, { label: "Trailbase", value: "74%" }, { label: "差", value: "-17pt", tone: "amber" }] },
                { title: "差が大きいトピック", table: { columns: ["トピック", "Recora", "Trailbase", "差"], rows: [["競合比較", "57%", "78%", "-21pt"], ["料金", "52%", "64%", "-12pt"], ["第三者評価", "43%", "67%", "-24pt"]] } },
                { title: "首位差を構成する代表観測", description: "同じ固定質問・同じ日・同じAIモデルで、RecoraとTrailbaseの掲載結果を比較します。", table: { columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "Recora", "Trailbase"], rows: [
                  ["OBS-20260706-LG-001", "2026/07/06 06:04", "GPT", "GEO対策ツールのおすすめは？", "2位", "1位"],
                  ["OBS-20260706-LG-002", "2026/07/06 06:11", "Gemini", "AI検索で自社が引用されるには何を整備すべき？", "未掲載", "掲載あり・1位"],
                  ["OBS-20260706-LG-003", "2026/07/06 06:18", "Google AI Mode", "導入しやすいGEO対策ツールを比較して", "3位", "1位"]
                ] } }
              ],
              detailHref: `${context.reportBase}/leaderboard/trailbase?return=${encodeURIComponent(brandReturnHref)}`,
              detailLabel: "Trailbaseとの全比較を確認"
            }} />
            <StatTile label="要約" value="比較軸が弱い" helper="比較検討・料金・第三者評価で競合先行" detail={{
              kicker: "COMPETITIVE POSITION",
              title: "競合が先行する判断軸",
              summary: "総合評価ではなく、競合が先行した回答を買い手の判断軸ごとにまとめた要約です。",
              sections: [
                { title: "先行された判断軸", table: { columns: ["判断軸", "競合勝ち", "自社勝ち"], rows: [["比較検討", "58回答", "32回答"], ["料金", "41回答", "27回答"], ["第三者評価", "36回答", "19回答"]] } },
                { title: "判断軸ごとの代表観測", description: "競合が先行した回答を、判断軸・買い手・質問まで分けて確認します。", table: { columns: ["観測ID", "観測日時", "判断軸", "ペルソナ", "AIモデル", "固定質問", "先行結果", "引用URL"], rows: [
                  ["OBS-20260706-CP-001", "2026/07/06 06:04", "比較検討", "マーケ責任者", "GPT", "GEO対策ツールのおすすめは？", "Trailbase 1位 / Recora 2位", "—"],
                  ["OBS-20260706-CP-002", "2026/07/06 06:11", "料金", "決裁者", "Gemini", "GEO対策ツールの料金と導入期間を比較して", "Trailbase掲載 / Recora未掲載", "https://trailbase.io/pricing"],
                  ["OBS-20260706-CP-003", "2026/07/06 06:18", "第三者評価", "導入担当", "Perplexity", "GEO対策ツールを第三者評価で比較して", "Trailbase 1位 / Recora 3位", "https://saas-review.example/ai-search"]
                ] } }
              ],
              detailHref: `${context.reportBase}/leaderboard/trailbase?return=${encodeURIComponent(brandReturnHref)}`,
              detailLabel: "判断軸別の全観測を確認"
            }} />
          </div>
        </DataRichPanel>
        <BrandComparisonLauncher
          reportBase={context.reportBase}
          selectedBrands={comparedBrands}
          selectedBrandIds={comparedBrandIds}
          onToggleBrand={toggleComparedBrand}
          returnHref={brandReturnHref}
        />
      </div>

      <BrandMarketLauncher reportBase={context.reportBase} returnHref={brandReturnHref} />

    </DashboardFrame>
  );
}

function BrandComparisonPage({ context }: { context: PageContext }) {
  const returnHref = useReturnHref(context.reportBase + "/leaderboard");
  const [comparedBrandIds, setComparedBrandIds] = useState<string[]>(["trailbase", "signalnest"]);
  const [urlReady, setUrlReady] = useState(false);
  const comparedBrands = competitors.filter((item) => comparedBrandIds.includes(item.id));

  useEffect(() => {
    const queryIds = new URLSearchParams(window.location.search).get("compare")?.split(",")
      .filter((id) => competitors.some((item) => !item.isPrimary && item.id === id))
      .slice(0, 3);
    if (queryIds?.length) setComparedBrandIds(queryIds);
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    replaceCurrentQuery({ compare: comparedBrandIds.join(",") || null });
  }, [comparedBrandIds, urlReady]);

  const toggleComparedBrand = (brandId: string) => {
    setComparedBrandIds((current) => {
      if (current.includes(brandId)) return current.filter((id) => id !== brandId);
      if (current.length >= 3) return current;
      return [...current, brandId];
    });
  };
  const comparisonParams = new URLSearchParams();
  if (comparedBrandIds.length) comparisonParams.set("compare", comparedBrandIds.join(","));
  comparisonParams.set("return", returnHref);
  const comparisonHref = `${context.reportBase}/leaderboard/compare?${comparisonParams.toString()}`;

  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド・競合"
      title="競合比較分析"
      description="自社を固定基準に、選択した競合を主要指標・期間・ペルソナ・トピック・AIモデルごとに比較します。"
      activeNote={`Recora + ${comparedBrands.length}社`}
      action={<DataRichPrimaryAction href={returnHref} variant="secondary">ブランド・競合へ戻る</DataRichPrimaryAction>}
    >
      <BrandComparisonWorkspace
        reportBase={context.reportBase}
        selectedBrands={comparedBrands}
        selectedBrandIds={comparedBrandIds}
        onToggleBrand={toggleComparedBrand}
        returnHref={comparisonHref}
      />

      <BrandComparisonPeriodTable selectedBrands={comparedBrands} reportBase={context.reportBase} returnHref={comparisonHref} />

      <BrandComparisonAxisTable
        axis="persona"
        title="ペルソナ別の競合差"
        description="同じペルソナのNon-brand質問に限定し、AI表示率と自社差を比較します。"
        labels={personas}
        selectedBrands={comparedBrands}
        reportBase={context.reportBase}
        returnHref={comparisonHref}
      />

      <BrandComparisonAxisTable
        axis="topic"
        title="トピック別の競合差"
        description="同じトピックのNon-brand質問に限定し、AI表示率と自社差を比較します。"
        labels={topics}
        selectedBrands={comparedBrands}
        reportBase={context.reportBase}
        returnHref={comparisonHref}
      />

      <DataRichPanel title="AIモデル別の競合比較" description={`${activeModels.map((model) => model.name).join(" / ")}でRecoraと選択中の競合を同じ列に固定して比較します。`} bodyClassName="p-0">
        <ModelRankingTable selectedBrands={comparedBrands} highlightedProvider={context.provider} />
      </DataRichPanel>

      <BrandComparisonProfileLinks selectedBrands={comparedBrands} reportBase={context.reportBase} returnHref={comparisonHref} />
    </DashboardFrame>
  );
}

function BrandMarketPositionMap() {
  const width = 820;
  const height = 390;
  const left = 64;
  const right = 28;
  const top = 28;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xFor = (value: number) => left + (Math.max(0, Math.min(80, value)) / 80) * plotWidth;
  const yFor = (value: number) => top + ((Math.max(1, Math.min(7, value)) - 1) / 6) * plotHeight;
  const self = competitors.find((item) => item.isPrimary) ?? competitors[0];
  const leader = competitors.find((item) => item.rank === 1) ?? competitors[0];
  const notableBrands = competitors.filter((item) => item.isPrimary || item.rank <= 4).sort((a, b) => a.rank - b.rank);

  return (
    <DataRichPanel title="市場内ポジション" description="AI表示率と平均掲載位置を別軸で組み合わせ、自社と上位競合の距離を確認します。" bodyClassName="p-0">
      <div className="min-w-0">
        <div className="min-w-0 px-3 py-5 sm:px-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <span className="text-[11px] font-semibold text-[#667085]">右ほどAI表示率が高く、上ほど平均掲載位置が上位</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="市場ポジションの色分け">
              {Object.entries(marketPositionGroups).map(([group, tone]) => (
                <span key={group} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#52625C]">
                  <span className="h-3 w-3 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(16,24,40,0.10)]" style={{ backgroundColor: tone.fill }} aria-hidden="true" />
                  {tone.label}
                </span>
              ))}
            </div>
          </div>
          <svg viewBox={"0 0 " + width + " " + height} className="h-auto w-full rounded-2xl border border-[#CFDCD6] bg-white" role="img" aria-label="20ブランドのAI表示率と平均掲載位置を色分けした円形分布">
            <rect x={left + plotWidth / 2} y={top} width={plotWidth / 2} height={plotHeight / 2} fill="#F3F8F6" />
            {[0, 20, 40, 60, 80].map((tick) => {
              const x = xFor(tick);
              return <g key={"x-" + tick}><line x1={x} x2={x} y1={top} y2={height - bottom} stroke="#E1E7E4" strokeWidth="1" strokeDasharray="4 5" /><text x={x} y={height - 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#667085">{tick}%</text></g>;
            })}
            {[1, 2, 3, 4, 5, 6, 7].map((tick) => {
              const y = yFor(tick);
              return <g key={"y-" + tick}><line x1={left} x2={width - right} y1={y} y2={y} stroke={tick % 2 === 1 ? "#D8E1DD" : "#EDF1EF"} strokeWidth="1" /><text x={left - 13} y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#667085">{tick}位</text></g>;
            })}
            <text x={left + plotWidth / 2} y={height - 2} textAnchor="middle" fontSize="12" fontWeight="700" fill="#344054">AI表示率</text>
            {competitors.map((brand) => {
              const x = xFor(brand.aiPresence);
              const y = yFor(brand.averagePosition);
              const group = marketPositionGroupFor(brand, self);
              const tone = marketPositionGroups[group];
              const emphasized = brand.isPrimary || brand.rank <= 4;
              const radius = brand.isPrimary ? 14 : Math.max(6.5, Math.min(11, 5.5 + brand.aiPresence * 0.075));
              return (
                <g key={brand.id}>
                  {brand.isPrimary ? <circle cx={x} cy={y} r={radius + 6} fill="none" stroke={tone.ring} strokeWidth="5" opacity="0.8" /> : null}
                  <circle cx={x} cy={y} r={radius} fill={tone.fill} fillOpacity={group === "field" ? 0.82 : 1} stroke="white" strokeWidth="2.5" />
                  {emphasized ? <text x={x + radius + 5} y={y - radius - 3} fontSize="11" fontWeight={brand.isPrimary ? "700" : "600"} fill={tone.text}>{brand.name}</text> : null}
                </g>
              );
            })}
          </svg>
        </div>
        <section className="border-t border-[#DDE5E1] bg-[#FBFCFB]" aria-label="市場ポジションの要約">
          <div className="border-b border-[#DDE5E1] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-bold text-[#667085]">現在の自社位置</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums text-[#0B382D]">{self.rank}位 / {competitors.length}社</p>
            <p className="mt-2 text-[12px] font-semibold leading-5 text-[#475467]">首位{leader.name}までAI表示率 {leader.aiPresence - self.aiPresence}pt、平均掲載位置 {(self.averagePosition - leader.averagePosition).toFixed(1)}位の差があります。</p>
          </div>
          <div className="grid border-t border-[#E5EAE8] md:grid-cols-2 xl:grid-cols-5">
            {notableBrands.map((brand) => {
              const identity = <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />;
              return (
                <div key={brand.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5", brand.isPrimary && "bg-[#F1F8F5]")}>
                  {identity}
                  <span className="text-right"><span className="block text-[13px] font-bold tabular-nums text-[#101828]">{brand.aiPresence}%</span><span className="block text-[10px] font-semibold tabular-nums text-[#667085]">平均 {brand.averagePosition}位</span></span>
                </div>
              );
            })}
          </div>
          <p className="border-t border-[#DDE5E1] px-4 py-3 text-[11px] font-semibold leading-5 text-[#667085] sm:px-5">全20社の正確な値とロゴは、直下の分布・ランキングで省略せず確認できます。</p>
        </section>
      </div>
    </DataRichPanel>
  );
}

function BrandMarketPage({ context }: { context: PageContext }) {
  const returnHref = useReturnHref(context.reportBase + "/leaderboard");

  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド・競合"
      title="市場構造分析"
      description="観測された全20ブランドを省略せず、AI表示率・ランキング・AI内シェア（SOV）・競合置換・判断軸のまとまりで分析します。"
      activeNote="観測ブランド 20社"
      action={<DataRichPrimaryAction href={returnHref} variant="secondary">ブランド・競合へ戻る</DataRichPrimaryAction>}
    >
      <BrandMarketPositionMap />

      <DataRichPanel title="全ブランドのAI表示率分布" description="観測された20ブランドをAI表示率順に並べ、市場内の分布と自社の位置を確認します。">
        <HorizontalBars metric="AI表示率" rows={competitors.map((item) => ({ label: item.name, value: item.aiPresence, helper: `${item.aiPresence}%` }))} />
      </DataRichPanel>

      <DataRichPanel title="ブランドランキング" description="AI表示率ランキングを上位20位まで省略せず確認します。" bodyClassName="p-0">
        <BrandRankingTable rows={competitors} reportBase={context.reportBase} />
      </DataRichPanel>

      <DataRichPanel title="全ブランドのAI内シェア分布" description="同じ観測群に登場したブランド掲載回数から、市場内の存在感を比較します。">
        <HorizontalBars metric="AI内シェア" rows={competitors.map((item) => ({ label: item.name, value: item.sov, helper: `${item.sov}%` }))} />
      </DataRichPanel>

      <BrandAdvancedPanels reportBase={context.reportBase} />
    </DashboardFrame>
  );
}

function BrandCompetitorDetailPage({ context }: { context: PageContext }) {
  const returnHref = useReturnHref(context.reportBase + "/leaderboard");
  const competitor = rankingCompetitors.find((item) => item.id === context.competitorName || item.name.toLowerCase() === context.competitorName.toLowerCase());
  if (!competitor) {
    return <AnalysisTargetNotFound context={context} section="ブランド・競合" backHref={returnHref} backLabel="ブランド・競合へ戻る" />;
  }
  const primary = competitors[0];

  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド・競合"
      title={`${primary.name} vs ${competitor.name}`}
      description="選択競合1社と自社の差を、ペルソナ・トピック・AIモデル・引用元へ分解して分析します。"
      activeNote={`${competitor.name}との比較`}
      action={<DataRichPrimaryAction href={returnHref} variant="secondary">ブランド・競合へ戻る</DataRichPrimaryAction>}
    >
      <DataRichKpiStrip layout="rows"
        columns="xl:grid-cols-6"
        items={[
          { label: "AI表示率", value: `${primary.aiPresence}% / ${competitor.aiPresence}%`, helper: "自社 / 競合", tone: "amber" },
          { label: "AI内シェア（SOV）", value: `${primary.sov}% / ${competitor.sov}%`, helper: "自社 / 競合" },
          { label: "ランキング順位", value: `${primary.rank}位 / ${competitor.rank}位`, helper: "Non-brandベース" },
          { label: "平均掲載位置", value: `${primary.averagePosition}位 / ${competitor.averagePosition}位`, helper: "順位付き表示のみ" },
          { label: "公式サイト引用率", value: `${primary.citationRate}% / ${competitor.citationRate}%`, helper: "自社 / 競合" },
          { label: "勝敗数", value: "2勝 / 9敗", helper: "ペルソナ5軸・トピック6軸" }
        ]}
      />

      <div className="space-y-3">
        <DataRichPanel title="ペルソナ別比較" description="ペルソナごとのAI表示率、AI内シェア（SOV）、平均掲載位置を比較します。" bodyClassName="p-0">
          <ComparisonTable comparisonType="persona" reportBase={context.reportBase} rivalName={competitor.name} rows={personas.map((persona, index) => ({
            label: persona,
            self: Math.max(34, 62 - index * 5),
            sovSelf: [26, 22, 34, 18, 24][index],
            sovRival: [33, 35, 32, 27, 30][index],
            rival: Math.max(45, 74 - index * 4),
            position: `${(2.4 + index * 0.2).toFixed(1)}位`,
            rivalPosition: [2.0, 2.2, 3.3, 2.6, 2.8][index].toFixed(1) + "位"
          }))} />
        </DataRichPanel>
        <DataRichPanel title="カテゴリ・トピック別比較" description="トピックごとのAI表示率、AI内シェア（SOV）、平均掲載位置を比較します。" bodyClassName="p-0">
          <ComparisonTable comparisonType="topic" reportBase={context.reportBase} rivalName={competitor.name} rows={topics.map((topic, index) => ({
            label: topic,
            self: Math.max(28, 58 - index * 4),
            sovSelf: [21, 24, 17, 27, 29, 23][index],
            sovRival: [28, 35, 31, 30, 26, 32][index],
            rival: Math.max(41, 70 - index * 3),
            position: `${(2.3 + index * 0.25).toFixed(1)}位`,
            rivalPosition: [2.0, 2.2, 2.4, 2.7, 3.7, 3.1][index].toFixed(1) + "位"
          }))} />
        </DataRichPanel>
      </div>

      <div className="space-y-3">
        <DataRichPanel title="AIモデル別比較" description="AIモデル別のAI表示率、AI内シェア（SOV）、公式サイト引用率、平均掲載位置を比較します。">
          <RivalModelComparisonTable rival={competitor} highlightedProvider={context.provider} />
        </DataRichPanel>
        <DataRichPanel title="引用・参照元比較" description="競合だけが引用されるURLを確認します。">
          <SimpleList items={sourcePages.map((page) => `${page.domain}${page.url} / ${page.insight}`)} />
        </DataRichPanel>
        <DataRichPanel title="感情・ブランド印象比較" description="Named comparisonを主に使います。">
          <SimpleList items={["Recora: 実務向け、根拠確認に強い", "Trailbase: 比較記事で先に推薦されやすい", "注意書き: 料金情報の古さを指摘"]} />
        </DataRichPanel>
      </div>

    </DashboardFrame>
  );
}

type PersonaTopicAxis = "persona" | "topic";

type PersonaTopicMetricRow = {
  label: string;
  aiPresence: number;
  sov: number;
  averagePosition: number;
  officialCitationRate: number;
  delta: number;
};

function personaTopicMetricRows(axis: PersonaTopicAxis): PersonaTopicMetricRow[] {
  const labels = axis === "persona" ? personas : topics;
  const aiPresence = axis === "persona"
    ? heatmapValues.map((values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length))
    : topics.map((_, topicIndex) => Math.round(heatmapValues.reduce((sum, values) => sum + values[topicIndex], 0) / heatmapValues.length));
  const sov = axis === "persona" ? [26, 22, 34, 18, 24] : [21, 24, 17, 27, 29, 23];
  const averagePosition = axis === "persona" ? [2.4, 3.0, 2.1, 3.2, 2.8] : [2.9, 2.2, 3.7, 2.6, 2.3, 2.7];
  const officialCitationRate = axis === "persona" ? [34, 27, 39, 22, 31] : [26, 32, 41, 35, 29, 24];
  const delta = axis === "persona" ? [4, -1, 3, 1, -2] : [2, 5, -1, 3, 1, 2];

  return labels.map((label, index) => ({
    label,
    aiPresence: aiPresence[index],
    sov: sov[index],
    averagePosition: averagePosition[index],
    officialCitationRate: officialCitationRate[index],
    delta: delta[index]
  }));
}

function personaTopicDetailId(axis: PersonaTopicAxis, label: string) {
  const source = axis === "persona" ? personaNameById : topicNameById;
  return Object.entries(source).find(([, name]) => name === label)?.[0] ?? "";
}

function movementLabel(delta: number) {
  if (delta > 0) return "改善 " + delta + "pt";
  if (delta < 0) return "悪化 " + Math.abs(delta) + "pt";
  return "変化なし";
}

function PersonaTopicSummaryRanking({
  axis,
  reportBase
}: {
  axis: PersonaTopicAxis;
  reportBase: string;
}) {
  const noun = axis === "persona" ? "ペルソナ" : "トピック";
  const path = axis === "persona" ? "personas" : "topics";
  const rows = personaTopicMetricRows(axis)
    .slice()
    .sort((left, right) => right.aiPresence - left.aiPresence || left.label.localeCompare(right.label, "ja-JP"));

  return (
    <DataRichPanel
      title={noun + "別AI表示率ランキング"}
      description={"AI表示率の高い順に並べ、AI内シェア・掲載位置・公式サイト引用率も同じ行で比較します。"}
      bodyClassName="p-0"
    >
      <div className="hidden grid-cols-[56px_minmax(170px,1fr)_100px_116px_116px_138px_96px_20px] items-center border-b border-[#DDE5E1] bg-[#F6F9F7] px-5 py-3 text-[11px] font-bold tracking-[0.03em] text-[#5D6B66] lg:grid">
        <span className="text-center">順位</span>
        <span>{noun}</span>
        <span className="text-right">AI表示率</span>
        <span className="text-right">AI内シェア</span>
        <span className="text-right">平均掲載位置</span>
        <span className="text-right">公式サイト引用率</span>
        <span className="text-right">前日比</span>
        <span />
      </div>
      <ol className="divide-y divide-[#E2E8E5]">
        {rows.map((row, index) => {
          const id = personaTopicDetailId(axis, row.label);
          return (
            <li key={row.label}>
              <Link
                href={reportBase + "/persona-topics/" + path + "/" + id}
                className="group block min-w-0 px-4 py-4 transition hover:bg-[#F5F9F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B6B57] sm:px-5"
                aria-label={row.label + "を詳しく分析"}
              >
                <span className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 lg:grid-cols-[56px_minmax(170px,1fr)_100px_116px_116px_138px_96px_20px]">
                  <span className="text-center text-[14px] font-semibold tabular-nums text-[#667085]">{index + 1}</span>
                  <span className="min-w-0 text-[14px] font-bold leading-5 text-[#101828]">{row.label}</span>
                  <span className="text-right text-[20px] font-semibold tabular-nums text-[#0B382D] lg:text-[15px]">{row.aiPresence}%</span>
                  <span className="col-span-2 col-start-2 mt-3 grid grid-cols-3 gap-2 lg:col-span-1 lg:col-start-4 lg:mt-0 lg:block lg:text-right">
                    <span className="rounded-md bg-[#F6F9F7] px-2 py-2 text-center lg:bg-transparent lg:p-0">
                      <span className="block text-[9px] font-bold text-[#667085] lg:hidden">AI内シェア</span>
                      <span className="text-[13px] font-semibold tabular-nums text-[#344054]">{row.sov}%</span>
                    </span>
                    <span className="rounded-md bg-[#F6F9F7] px-2 py-2 text-center lg:hidden">
                      <span className="block text-[9px] font-bold text-[#667085]">平均掲載位置</span>
                      <span className="text-[13px] font-semibold tabular-nums text-[#344054]">{row.averagePosition.toFixed(1)}位</span>
                    </span>
                    <span className="rounded-md bg-[#F6F9F7] px-2 py-2 text-center lg:hidden">
                      <span className="block text-[9px] font-bold text-[#667085]">公式サイト引用率</span>
                      <span className="text-[13px] font-semibold tabular-nums text-[#344054]">{row.officialCitationRate}%</span>
                    </span>
                  </span>
                  <span className="hidden text-right text-[13px] font-semibold tabular-nums text-[#344054] lg:block">{row.averagePosition.toFixed(1)}位</span>
                  <span className="hidden text-right text-[13px] font-semibold tabular-nums text-[#344054] lg:block">{row.officialCitationRate}%</span>
                  <span className={cn("col-start-3 row-start-2 mt-3 text-right text-[11px] font-bold tabular-nums lg:col-start-7 lg:row-start-1 lg:mt-0", row.delta < 0 ? "text-[#A15C00]" : row.delta > 0 ? "text-[#067647]" : "text-[#667085]")}>
                    {movementLabel(row.delta)}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 text-[#8A9893] transition group-hover:translate-x-0.5 group-hover:text-[#075E44] lg:block" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </DataRichPanel>
  );
}
function PersonaTopicSelfHeatmap({ reportBase }: { reportBase: string }) {
  const personaOrder = personaTopicMetricRows("persona").slice().sort((left, right) => right.aiPresence - left.aiPresence);
  const topicOrder = personaTopicMetricRows("topic").slice().sort((left, right) => right.aiPresence - left.aiPresence);
  const colors = ["#075E44", "#536878", "#B7791F", "#7A5C91"];

  const openCell = (persona: string, topic: string, rowIndex: number, columnIndex: number) => {
    const value = heatmapValues[rowIndex][columnIndex];
    const personaRank = personaOrder.findIndex((row) => row.label === persona) + 1;
    const topicRank = topicOrder.findIndex((row) => row.label === topic) + 1;
    const modelValues = activeModels.map((model, modelIndex) => ({
      model,
      value: Math.max(0, Math.min(100, value + activeModelVisibilityOffsets[modelIndex]))
    }));

    openReportDetail({
      kicker: "ペルソナ × トピック",
      title: persona + " × " + topic,
      value: "AI表示率 " + value + "%",
      summary: "この組み合わせの現在位置を、モデル差と期間変化に分けて確認します。",
      sections: [
        {
          title: "現在の位置",
          facts: [
            { label: "AI表示率", value: value + "%", tone: "green" },
            { label: "ペルソナ内順位", value: personaRank + "位" },
            { label: "トピック内順位", value: topicRank + "位" },
            { label: "前日比", value: movementLabel(((rowIndex + columnIndex) % 7) - 2) }
          ]
        },
        {
          title: "AIモデル別",
          facts: modelValues.map((row) => ({
            label: row.model.name,
            value: row.value + "%（全モデル " + (row.value - value > 0 ? "+" : "") + (row.value - value) + "pt）"
          }))
        },
        {
          title: "期間別",
          facts: [
            { label: "7日", value: Math.max(0, value - 2) + "%（30日比 -2pt）" },
            { label: "30日", value: value + "%" },
            { label: "90日", value: Math.max(0, value - 5) + "%（30日比 -5pt）" }
          ]
        }
      ],      detailHref: reportBase + "/persona-topics/personas/" + personaTopicDetailId("persona", persona),
      detailLabel: persona + "を全体で分析"
    });
  };

  const renderCell = (persona: string, topic: string, rowIndex: number, columnIndex: number, mobile = false) => {
    const value = heatmapValues[rowIndex][columnIndex];
    const rowAverage = personaTopicMetricRows("persona")[rowIndex].aiPresence;
    const difference = value - rowAverage;
    return (
      <button
        key={persona + "-" + topic}
        type="button"
        onClick={() => openCell(persona, topic, rowIndex, columnIndex)}
        aria-label={persona + "と" + topic + "のAI表示率を詳しく見る"}
        className={cn(
          "min-w-0 text-left transition hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B6B57]",
          mobile ? "rounded-md border border-[#DDE5E1] px-3 py-3" : "min-h-[92px] border-l border-[#DDE5E1] px-3 py-3"
        )}
        style={{ backgroundColor: heatmapColor(value) }}
      >
        {mobile ? <span className="block text-[11px] font-bold text-[#475467]">{topic}</span> : null}
        <span className={cn("block font-semibold tabular-nums text-[#0B382D]", mobile ? "mt-1 text-lg" : "text-xl")}>{value}%</span>
        <span className={cn("mt-1 block text-[10px] font-bold tabular-nums", difference < 0 ? "text-[#8A4B00]" : "text-[#067647]")}>
          ペルソナ平均{difference > 0 ? "+" : ""}{difference}pt
        </span>
      </button>
    );
  };

  return (
    <DataRichPanel
      title="ペルソナ×トピック"
      description="AI表示率の濃淡から、誰のどの話題に偏りがあるかを一画面で確認します。"
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#DDE5E1] bg-[#F8FAF9] px-4 py-3 text-[11px] font-semibold text-[#5D6B66] sm:px-5">
        <span>濃いほどAI表示率が高い</span>
        <span className="inline-flex items-center gap-1.5">
          {colors.map((color) => <span key={color} className="h-3 w-6 border border-black/5" style={{ backgroundColor: color, opacity: 0.18 }} aria-hidden="true" />)}
        </span>
        <span>セルを選ぶとモデル差・期間差を表示</span>
      </div>
      <div className="hidden min-w-0 lg:block" role="table" aria-label="ペルソナとトピック別のAI表示率">
        <div className="grid bg-[#F6F9F7]" style={{ gridTemplateColumns: "170px repeat(6,minmax(94px,1fr))" }} role="row">
          <div className="flex min-h-14 items-center px-4 text-[11px] font-bold text-[#667085]" role="columnheader">ペルソナ</div>
          {topics.map((topic) => <div key={topic} className="flex min-h-14 items-center border-l border-[#DDE5E1] px-3 text-[11px] font-bold leading-4 text-[#475467]" role="columnheader">{topic}</div>)}
        </div>
        {personas.map((persona, rowIndex) => (
          <div key={persona} className="grid border-t border-[#DDE5E1]" style={{ gridTemplateColumns: "170px repeat(6,minmax(94px,1fr))" }} role="row">
            <div className="flex min-h-[92px] items-center bg-white px-4 text-[12px] font-bold text-[#101828]" role="rowheader">{persona}</div>
            {topics.map((topic, columnIndex) => renderCell(persona, topic, rowIndex, columnIndex))}
          </div>
        ))}
      </div>
      <div className="space-y-2 p-3 lg:hidden">
        {personas.map((persona, rowIndex) => (
          <details key={persona} className="group overflow-hidden rounded-md border border-[#DDE5E1] bg-white" open={rowIndex === 0}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[12px] font-bold text-[#101828] [&::-webkit-details-marker]:hidden">
              <span>{persona}</span>
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" strokeWidth={1.8} aria-hidden="true" />
            </summary>
            <div className="space-y-2 border-t border-[#DDE5E1] p-3">
              {topics.map((topic, columnIndex) => renderCell(persona, topic, rowIndex, columnIndex, true))}
            </div>
          </details>
        ))}
      </div>
    </DataRichPanel>
  );
}
function PersonaTopicModelMatrix({ axis, reportBase }: { axis: PersonaTopicAxis; reportBase: string }) {
  const noun = axis === "persona" ? "ペルソナ" : "トピック";
  const path = axis === "persona" ? "personas" : "topics";
  const rows = personaTopicMetricRows(axis);
  const gridTemplateColumns = "minmax(190px,0.9fr) repeat(" + rows.length + ",minmax(92px,1fr))";
  const axisAdjustments = axis === "persona"
    ? [[4, 2, 1, 3, 0], [-3, -4, -2, -1, -2], [1, 4, 3, 0, 5], [3, 1, 5, 4, 2]]
    : [[4, 5, -1, 3, 0, 2], [-2, -3, -4, -1, 1, -2], [1, 2, 6, 0, 5, 3], [3, 4, 2, 5, 2, 6]];
  const valueFor = (rowIndex: number, modelIndex: number) =>
    Math.max(0, Math.min(100, rows[rowIndex].aiPresence + (axisAdjustments[modelIndex]?.[rowIndex] ?? 0)));

  const openCell = (rowIndex: number, modelIndex: number) => {
    const row = rows[rowIndex];
    const model = activeModels[modelIndex];
    const value = valueFor(rowIndex, modelIndex);
    openReportDetail({
      kicker: noun + " × AIモデル",
      title: row.label + " / " + model.name,
      value: "AI表示率 " + value + "%",
      summary: row.label + "を" + model.name + "で見たときの差を、同じ" + noun + "と同じAIモデルの両方向から比較します。",
      sections: [
        {
          title: "この組み合わせ",
          facts: [
            { label: noun, value: row.label },
            { label: "AIモデル", value: model.name },
            { label: "AI表示率", value: value + "%", tone: "green" },
            { label: "全モデル値", value: row.aiPresence + "%" },
            { label: "全モデルとの差", value: (value - row.aiPresence > 0 ? "+" : "") + (value - row.aiPresence) + "pt" }
          ]
        },
        {
          title: row.label + "のAIモデル別",
          facts: activeModels.map((candidate, candidateIndex) => ({
            label: candidate.name,
            value: valueFor(rowIndex, candidateIndex) + "%"
          }))
        },
        {
          title: model.name + "での位置",
          facts: [
            {
              label: "最も高い" + noun,
              value: rows.slice().sort((left, right) => valueFor(rows.indexOf(right), modelIndex) - valueFor(rows.indexOf(left), modelIndex))[0].label
            },
            {
              label: "最も低い" + noun,
              value: rows.slice().sort((left, right) => valueFor(rows.indexOf(left), modelIndex) - valueFor(rows.indexOf(right), modelIndex))[0].label
            }
          ]
        }
      ],      detailHref: reportBase + "/persona-topics/" + path + "/" + personaTopicDetailId(axis, row.label),
      detailLabel: row.label + "を全体で分析"
    });
  };

  return (
    <section className="min-w-0">
      <header className="border-b border-[#DDE5E1] px-4 py-4 sm:px-5">
        <h3 className="text-[15px] font-semibold text-[#101828]">{noun}別</h3>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-[#667085]">AIモデルを行にし、同じ{noun}を横方向に比較します。</p>
      </header>
      <div className="hidden min-w-0 lg:block" role="table" aria-label={"AIモデルと" + noun + "別のAI表示率"}>
        <div className="grid bg-[#F6F9F7]" style={{ gridTemplateColumns }} role="row">
          <span className="px-4 py-3 text-[11px] font-bold text-[#667085]" role="columnheader">AIモデル</span>
          {rows.map((row) => <span key={row.label} className="border-l border-[#DDE5E1] px-3 py-3 text-center text-[11px] font-bold leading-4 text-[#475467]" role="columnheader">{row.label}</span>)}
        </div>
        {activeModels.map((model, modelIndex) => (
          <div key={model.name} className="grid border-t border-[#DDE5E1]" style={{ gridTemplateColumns }} role="row">
            <div className="flex min-h-[68px] items-center px-4 py-3" role="rowheader"><ModelIdentity name={model.name} compact /></div>
            {rows.map((row, rowIndex) => {
              const value = valueFor(rowIndex, modelIndex);
              const columnMaximum = Math.max(...activeModels.map((_, candidateIndex) => valueFor(rowIndex, candidateIndex)));
              const isBest = activeModels.length > 1 && value === columnMaximum;
              return (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => openCell(rowIndex, modelIndex)}
                  className={cn("min-h-[68px] border-l border-[#DDE5E1] px-3 py-2 text-right transition hover:bg-[#EDF6F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B6B57]", isBest ? "bg-[#E5F3ED]" : "bg-white")}
                  aria-label={model.name + "の" + row.label + "を詳しく見る"}
                >
                  <span className={cn("text-[16px] font-semibold tabular-nums", isBest ? "text-[#075E44]" : "text-[#344054]")}>{value}%</span>
                  {isBest ? <span className="mt-0.5 block text-[9px] font-bold text-[#067647]">最高</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="divide-y divide-[#DDE5E1] lg:hidden">
        {activeModels.map((model, modelIndex) => (
          <section key={model.name} className="px-4 py-4 sm:px-5">
            <ModelIdentity name={model.name} />
            <div className="mt-3 space-y-1.5">
              {rows.map((row, rowIndex) => (
                <button key={row.label} type="button" onClick={() => openCell(rowIndex, modelIndex)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#DDE5E1] bg-[#F8FAF9] px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B57]">
                  <span className="text-[11px] font-bold text-[#5D6B66]">{row.label}</span>
                  <span className="text-[14px] font-semibold tabular-nums text-[#0B382D]">{valueFor(rowIndex, modelIndex)}%</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function PersonaTopicModelAnalysis({ reportBase }: { reportBase: string }) {
  return (
    <DataRichPanel
      title="AIモデル別比較"
      description={activeModels.length > 1 ? "契約中のAIモデルごとに、ペルソナとトピックの差を同じ尺度で確認します。" : "契約中のAIモデルで、ペルソナとトピックの値を確認します。"}
      bodyClassName="p-0"
    >
      <div className="divide-y divide-[#C7D6CF]">
        <PersonaTopicModelMatrix axis="persona" reportBase={reportBase} />
        <PersonaTopicModelMatrix axis="topic" reportBase={reportBase} />
      </div>
    </DataRichPanel>
  );
}
function personaTopicCompetitorValue(
  baseValue: number,
  axisIndex: number,
  competitor: (typeof competitors)[number]
) {
  const self = competitors.find((brand) => brand.isPrimary) ?? competitors[0];
  const competitorIndex = Math.max(0, competitors.findIndex((brand) => brand.id === competitor.id));
  const marketGap = (competitor.aiPresence - self.aiPresence) * 0.5;
  const variation = ((competitorIndex + 2) * (axisIndex + 3)) % 9 - 4;
  return Math.max(0, Math.min(100, Math.round(baseValue + marketGap + variation)));
}

function PersonaTopicCompetitorRows({
  axis,
  competitor
}: {
  axis: PersonaTopicAxis;
  competitor: (typeof competitors)[number];
}) {
  const noun = axis === "persona" ? "ペルソナ" : "トピック";
  const rows = personaTopicMetricRows(axis);

  const openRow = (row: PersonaTopicMetricRow, rowIndex: number) => {
    const competitorValue = personaTopicCompetitorValue(row.aiPresence, rowIndex, competitor);
    const gap = row.aiPresence - competitorValue;
    openReportDetail({
      kicker: noun + " × 競合",
      title: row.label + " / " + competitor.name,
      value: (gap > 0 ? "自社が " + gap + "pt上" : gap < 0 ? competitor.name + "が " + Math.abs(gap) + "pt上" : "同率"),
      summary: row.label + "での自社と競合の差を、AIモデル別と同じ軸内の順位で確認します。",
      sections: [
        {
          title: "現在の差",
          facts: [
            { label: noun, value: row.label },
            { label: "Recora", value: row.aiPresence + "%", tone: gap >= 0 ? "green" : "default" },
            { label: competitor.name, value: competitorValue + "%" },
            { label: "差", value: (gap > 0 ? "+" : "") + gap + "pt", tone: gap < 0 ? "amber" : "green" }
          ]
        },
        {
          title: "AIモデル別の差",
          facts: activeModels.map((model, modelIndex) => {
            const selfValue = Math.max(0, Math.min(100, row.aiPresence + activeModelVisibilityOffsets[modelIndex]));
            const rivalValue = Math.max(0, Math.min(100, competitorValue + activeRivalVisibilityOffsets[modelIndex]));
            const modelGap = selfValue - rivalValue;
            return {
              label: model.name,
              value: "自社 " + selfValue + "% / 競合 " + rivalValue + "% / " + (modelGap > 0 ? "+" : "") + modelGap + "pt"
            };
          })
        },
        {
          title: "差が大きい" + noun,
          facts: rows
            .map((candidate, candidateIndex) => {
              const rivalValue = personaTopicCompetitorValue(candidate.aiPresence, candidateIndex, competitor);
              return { label: candidate.label, value: candidate.aiPresence - rivalValue };
            })
            .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
            .slice(0, 3)
            .map((candidate) => ({
              label: candidate.label,
              value: candidate.value > 0 ? "自社 +" + candidate.value + "pt" : candidate.value < 0 ? "競合 +" + Math.abs(candidate.value) + "pt" : "同率"
            }))
        }
      ]
    });
  };

  return (
    <section className="min-w-0">
      <header className="border-b border-[#DDE5E1] px-4 py-4 sm:px-5">
        <h3 className="text-[15px] font-semibold text-[#101828]">{noun}別の差</h3>
        <p className="mt-1 text-[11px] font-semibold text-[#667085]">同じ{noun}でRecoraと{competitor.name}のAI表示率を比較します。</p>
      </header>
      <div className="divide-y divide-[#E2E8E5]">
        {rows.map((row, rowIndex) => {
          const competitorValue = personaTopicCompetitorValue(row.aiPresence, rowIndex, competitor);
          const gap = row.aiPresence - competitorValue;
          return (
            <button
              key={row.label}
              type="button"
              onClick={() => openRow(row, rowIndex)}
              className="grid min-h-[76px] w-full min-w-0 gap-3 px-4 py-3 text-left transition hover:bg-[#F7FAF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B6B57] sm:px-5 lg:grid-cols-[170px_minmax(0,1fr)_94px] lg:items-center"
            >
              <span className="text-[12px] font-bold text-[#344054]">{row.label}</span>
              <span className="space-y-2">
                <span className="grid grid-cols-[72px_minmax(0,1fr)_42px] items-center gap-2">
                  <span className="text-[10px] font-bold text-[#075E44]">Recora</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#EDF2F0]"><span className="block h-full rounded-full bg-[#0B6B57]" style={{ width: row.aiPresence + "%" }} /></span>
                  <span className="text-right text-[11px] font-bold tabular-nums text-[#0B382D]">{row.aiPresence}%</span>
                </span>
                <span className="grid grid-cols-[72px_minmax(0,1fr)_42px] items-center gap-2">
                  <span className="truncate text-[10px] font-bold text-[#667085]">{competitor.name}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#EDF2F0]"><span className="block h-full rounded-full bg-[#83938C]" style={{ width: competitorValue + "%" }} /></span>
                  <span className="text-right text-[11px] font-bold tabular-nums text-[#344054]">{competitorValue}%</span>
                </span>
              </span>
              <span className={cn("text-left text-[11px] font-bold tabular-nums lg:text-right", gap < 0 ? "text-[#A15C00]" : "text-[#067647]")}>
                {gap > 0 ? "自社 +" + gap + "pt" : gap < 0 ? "競合 +" + Math.abs(gap) + "pt" : "同率"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PersonaTopicRadar({
  title,
  labels,
  selfValues,
  competitorValues,
  competitorName
}: {
  title: string;
  labels: string[];
  selfValues: number[];
  competitorValues: number[];
  competitorName: string;
}) {
  const width = 720;
  const height = 390;
  const centerX = width / 2;
  const centerY = 190;
  const radius = 128;
  const angleFor = (index: number) => -Math.PI / 2 + index * Math.PI * 2 / labels.length;
  const pointFor = (value: number, index: number, extraRadius = 0) => {
    const angle = angleFor(index);
    const distance = radius * value / 100 + extraRadius;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance
    };
  };
  const polygon = (values: number[]) => values.map((value, index) => {
    const point = pointFor(value, index);
    return point.x + "," + point.y;
  }).join(" ");

  return (
    <section className="border-t border-[#DDE5E1] px-3 py-5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#101828]">{title}</h3>
        <div className="flex flex-wrap gap-4 text-[11px] font-bold text-[#667085]">
          <span className="inline-flex items-center gap-2"><span className="h-0.5 w-7 bg-[#0B6B57]" />Recora</span>
          <span className="inline-flex items-center gap-2"><span className="h-0.5 w-7 bg-[#6E7F78]" />{competitorName}</span>
        </div>
      </div>
      <svg viewBox={"0 0 " + width + " " + height} className="mx-auto mt-2 h-auto w-full max-w-[760px]" role="img" aria-label={title + "。Recoraと" + competitorName + "のAI表示率比較"}>
        {[25, 50, 75, 100].map((level) => <polygon key={level} points={polygon(labels.map(() => level))} fill="none" stroke={level === 100 ? "#C9D5D0" : "#E4EAE7"} strokeWidth="1" />)}
        {labels.map((label, index) => {
          const outer = pointFor(100, index);
          const labelPoint = pointFor(100, index, 44);
          const anchor = Math.abs(labelPoint.x - centerX) < 12 ? "middle" : labelPoint.x > centerX ? "start" : "end";
          return (
            <g key={label}>
              <line x1={centerX} y1={centerY} x2={outer.x} y2={outer.y} stroke="#E0E7E3" strokeWidth="1" />
              <text x={labelPoint.x} y={labelPoint.y + 4} textAnchor={anchor} fontSize="12" fontWeight="700" fill="#475467">{label}</text>
            </g>
          );
        })}
        <polygon points={polygon(competitorValues)} fill="rgba(110,127,120,0.10)" stroke="#6E7F78" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points={polygon(selfValues)} fill="rgba(11,107,87,0.16)" stroke="#0B6B57" strokeWidth="3" strokeLinejoin="round" />
        {selfValues.map((value, index) => {
          const point = pointFor(value, index);
          return <circle key={"self-" + index} cx={point.x} cy={point.y} r="4" fill="#0B6B57" stroke="white" strokeWidth="2" />;
        })}
        {competitorValues.map((value, index) => {
          const point = pointFor(value, index);
          return <circle key={"rival-" + index} cx={point.x} cy={point.y} r="3.5" fill="#6E7F78" stroke="white" strokeWidth="2" />;
        })}
      </svg>
    </section>
  );
}

function PersonaTopicCompetitorAnalysis() {
  const comparisonOptions = competitors.filter((brand) => !brand.isPrimary).slice(0, 10);
  const [competitorId, setCompetitorId] = useState(comparisonOptions[0]?.id ?? "");
  const competitor = comparisonOptions.find((brand) => brand.id === competitorId) ?? comparisonOptions[0];
  const personaRows = personaTopicMetricRows("persona");
  const topicRows = personaTopicMetricRows("topic");
  if (!competitor) return null;
  const personaCompetitorValues = personaRows.map((row, index) => personaTopicCompetitorValue(row.aiPresence, index, competitor));
  const topicCompetitorValues = topicRows.map((row, index) => personaTopicCompetitorValue(row.aiPresence, index, competitor));

  return (
    <DataRichPanel
      title="競合との比較"
      description="上位10社から1社を選び、ペルソナ・トピックごとの差を表と形の両方で確認します。"
      bodyClassName="p-0"
    >
      <div className="flex flex-col gap-3 border-b border-[#C7D6CF] bg-[#F8FAF9] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <p className="text-[11px] font-bold text-[#667085]">比較する競合</p>
          <div className="mt-2"><EntityIdentity name={competitor.name} logoUrl={competitor.logoUrl} /></div>
        </div>
        <label className="sm:w-[300px]">
          <span className="sr-only">比較する競合を選択</span>
          <select value={competitor.id} onChange={(event) => setCompetitorId(event.target.value)} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">
            {comparisonOptions.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </label>
      </div>
      <div className="divide-y divide-[#C7D6CF]">
        <PersonaTopicCompetitorRows axis="persona" competitor={competitor} />
        <PersonaTopicCompetitorRows axis="topic" competitor={competitor} />
      </div>
      <PersonaTopicRadar title="ペルソナの形で比較" labels={personas} selfValues={personaRows.map((row) => row.aiPresence)} competitorValues={personaCompetitorValues} competitorName={competitor.name} />
      <PersonaTopicRadar title="トピックの形で比較" labels={topics} selfValues={topicRows.map((row) => row.aiPresence)} competitorValues={topicCompetitorValues} competitorName={competitor.name} />
    </DataRichPanel>
  );
}
type PersonaTopicTrendRange = "7日" | "30日" | "90日";

function PersonaTopicTrendPanel({ axis }: { axis: PersonaTopicAxis }) {
  const [range, setRange] = useState<PersonaTopicTrendRange>("30日");
  const noun = axis === "persona" ? "ペルソナ" : "トピック";
  const rows = personaTopicMetricRows(axis);
  const labelsByRange: Record<PersonaTopicTrendRange, string[]> = {
    "7日": ["6/29", "6/30", "7/1", "7/2", "7/3", "7/4", "7/5", "7/6"],
    "30日": ["6/7", "6/11", "6/15", "6/19", "6/23", "6/27", "7/1", "7/6"],
    "90日": ["4/7", "4/20", "5/3", "5/16", "5/29", "6/11", "6/24", "7/6"]
  };
  const colors = ["#075E44", "#536878", "#B7791F", "#7A5C91", "#2F7E7A", "#9B5C36"];
  const rangeAdjustment = range === "7日" ? 1 : range === "90日" ? -3 : 0;
  const series = rows.map((row, rowIndex) => {
    const shape = [-8, -7, -5, -4, -3, -2, -1, 0];
    const values = shape.map((offset, pointIndex) => {
      const variation = ((rowIndex + 1) * (pointIndex + 2)) % 3 - 1;
      return Math.max(0, Math.min(100, row.aiPresence + offset + variation + rangeAdjustment));
    });
    values[values.length - 1] = row.aiPresence;
    return { name: row.label, values, color: colors[rowIndex] };
  });

  return (
    <DataRichPanel
      title={noun + "別AI表示率推移"}
      description={noun + "ごとのAI表示率が、選んだ期間でどう変化したかを比較します。"}
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-[#DDE5E1] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-semibold text-[#667085]">このグラフだけ期間が変わります。</p>
        <div className="inline-flex w-fit rounded-md border border-[#C7D2CC] bg-white p-1" aria-label={noun + "推移の期間"}>
          {(["7日", "30日", "90日"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => setRange(option)}
              className={cn("min-h-9 rounded px-3 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B57]", range === option ? "bg-[#0B382D] text-white" : "text-[#475467] hover:bg-[#F3F7F5]")}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="[&_details]:hidden sm:[&_details]:block">
      <MetricLineChart
        labels={labelsByRange[range]}
        unit="%"
        deltaUnit="pt"
        detailType={axis === "persona" ? "persona-performance" : "topic-performance"}
        series={series}
      />
      </div>
    </DataRichPanel>
  );
}
function PersonaTopicsPage({ context }: { context: PageContext }) {
  return (
    <DashboardFrame
      context={context}
      eyebrow="ペルソナ・トピック"
      title="ペルソナ・トピック"
      description="誰に、どの話題で、どのAIや競合との差が生まれているかを比較します。"
      sectionIndexLabel="分析項目"
    >
      <PersonaTopicSummaryRanking axis="persona" reportBase={context.reportBase} />
      <PersonaTopicSummaryRanking axis="topic" reportBase={context.reportBase} />
      <PersonaTopicSelfHeatmap reportBase={context.reportBase} />
      <PersonaTopicModelAnalysis reportBase={context.reportBase} />
      <PersonaTopicCompetitorAnalysis />
      <PersonaTopicTrendPanel axis="persona" />
      <PersonaTopicTrendPanel axis="topic" />
    </DashboardFrame>
  );
}
function PromptModelAggregate({ rows, highlightedModel }: { rows: PromptRow[]; highlightedModel: string | null }) {
  if (rows.length === 0) {
    return <FilterEmptyState title="集計できるプロンプトがありません" description="検索語または絞り込み条件を変更してください。" />;
  }

  const mean = (values: number[]) => values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const aggregates = activeModels.map((model) => {
    const modelRows = rows.flatMap((promptRow) => {
      const result = getPromptModelResults(promptRow, "30日").find((item) => item.model === model.name);
      return result ? [result] : [];
    });
    const positions = modelRows.map((item) => Number.parseFloat(item.position)).filter((value) => Number.isFinite(value));
    return {
      model: model.name,
      aiPresence: mean(modelRows.map((item) => item.aiPresence)),
      sov: mean(modelRows.map((item) => item.sov)),
      position: positions.length === 0 ? null : positions.reduce((sum, value) => sum + value, 0) / positions.length,
      citation: mean(modelRows.map((item) => item.citation))
    };
  });
  const comparisonEnabled = aggregates.length > 1;
  const best = {
    aiPresence: Math.max(...aggregates.map((item) => item.aiPresence)),
    sov: Math.max(...aggregates.map((item) => item.sov)),
    position: Math.min(...aggregates.map((item) => item.position ?? Number.POSITIVE_INFINITY)),
    citation: Math.max(...aggregates.map((item) => item.citation))
  };

  const metric = (label: string, value: string, bar: number | null, isBest: boolean, note?: string) => (
    <div className={cn("min-w-0 px-4 py-3.5", isBest && comparisonEnabled && "bg-[#EDF7F2]")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold text-[#667085] lg:hidden">{label}</span>
        <span className={cn("text-base font-semibold tabular-nums text-[#101828]", isBest && comparisonEnabled && "text-[#075E44]")}>{value}</span>
      </div>
      {bar !== null ? (
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#E7EEEB]">
          <span className={cn("block h-full rounded-full", isBest && comparisonEnabled ? "bg-[#075E44]" : "bg-[#7D9B8F]")} style={{ width: bar + "%" }} />
        </span>
      ) : null}
      {note ? <span className="mt-1 block text-[10px] font-semibold text-[#667085]">{note}</span> : null}
    </div>
  );

  return (
    <div className="min-w-0 bg-white">
      <div className="hidden grid-cols-[minmax(180px,1.2fr)_repeat(4,minmax(125px,1fr))] border-b border-[#D7E0DC] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid">
        {["AIモデル", "AI表示率", "AI内シェア", "平均掲載位置", "公式サイト引用率"].map((label) => (
          <div key={label} className="px-4 py-3">{label}</div>
        ))}
      </div>
      <div className="divide-y divide-[#DDE5E1]">
        {aggregates.map((item) => {
          const selected = highlightedModel === item.model;
          return (
            <div key={item.model} className={cn("grid min-w-0 lg:grid-cols-[minmax(180px,1.2fr)_repeat(4,minmax(125px,1fr))]", selected && "ring-2 ring-inset ring-[#0B6B57]")}>
              <div className={cn("flex min-h-[74px] items-center justify-between gap-3 px-4 py-3", selected ? "bg-[#E7F4ED]" : "bg-[#FBFCFB]")}>
                <ModelIdentity name={item.model} compact />
                {selected ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-[#E3EAE6] lg:contents">
                {metric("AI表示率", item.aiPresence + "%", item.aiPresence, item.aiPresence === best.aiPresence)}
                {metric("AI内シェア", item.sov + "%", item.sov, item.sov === best.sov)}
                {metric("平均掲載位置", item.position === null ? "—" : item.position.toFixed(1) + "位", null, item.position === best.position, "低いほど上位")}
                {metric("公式サイト引用率", item.citation + "%", item.citation, item.citation === best.citation)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PromptsPage({ context }: { context: PageContext }) {
  const [promptView, setPromptView] = useState<PromptView>("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [promptFilters, setPromptFilters] = useState<PromptFilters>(defaultPromptFilters);
  const [promptSort, setPromptSort] = useState<PromptSort>("質問順");
  const [pageSize, setPageSize] = useState<25 | 50>(50);
  const [page, setPage] = useState(1);
  const promptListHydrated = useRef(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasUrlState = ["pview", "pq", "ptype", "pimportance", "ppersona", "ptopic", "pphase", "pmodel", "psort", "ppage", "psize"].some((key) => params.has(key));
      const stored = window.sessionStorage.getItem(promptListStateKey);
      if (!stored && !hasUrlState) return;
      const storedState = JSON.parse(stored ?? "{}") as Partial<{ view: PromptView; search: string; filters: PromptFilters; sort: PromptSort; pageSize: number; page: number; scrollY: number }>;
      const parsed = (hasUrlState ? {
        view: params.get("pview") ?? undefined,
        search: params.get("pq") ?? "",
        filters: {
          type: params.get("ptype") ?? defaultPromptFilters.type,
          importance: params.get("pimportance") ?? defaultPromptFilters.importance,
          persona: params.get("ppersona") ?? defaultPromptFilters.persona,
          topic: params.get("ptopic") ?? defaultPromptFilters.topic,
          phase: params.get("pphase") ?? defaultPromptFilters.phase,
          model: params.get("pmodel") ?? defaultPromptFilters.model
        },
        sort: params.get("psort") ?? undefined,
        pageSize: Number(params.get("psize")),
        page: Number(params.get("ppage")),
        scrollY: storedState.scrollY
      } : storedState) as Partial<{ view: PromptView; search: string; filters: PromptFilters; sort: PromptSort; pageSize: number; page: number; scrollY: number }>;
      if (parsed.view && promptViewOptions.includes(parsed.view)) setPromptView(parsed.view);
      if (typeof parsed.search === "string") setSearchQuery(parsed.search);
      if (parsed.filters) setPromptFilters({ ...defaultPromptFilters, ...parsed.filters });
      if (parsed.sort && promptSortOptions.includes(parsed.sort)) setPromptSort(parsed.sort);
      setPageSize(parsed.pageSize === 25 ? 25 : 50);
      if (typeof parsed.page === "number" && parsed.page > 0) setPage(Math.floor(parsed.page));
      if (typeof parsed.scrollY === "number" && parsed.scrollY > 0) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => window.scrollTo({ top: parsed.scrollY, behavior: "auto" }));
        });
      }
    } catch {
      window.sessionStorage.removeItem(promptListStateKey);
    } finally {
      promptListHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!promptListHydrated.current) return;
    window.sessionStorage.setItem(promptListStateKey, JSON.stringify({ view: promptView, search: searchQuery, filters: promptFilters, sort: promptSort, pageSize, page, scrollY: window.scrollY }));
    replaceCurrentQuery({
      pview: promptView === "すべて" ? null : promptView,
      pq: searchQuery || null,
      ptype: promptFilters.type === "すべて" ? null : promptFilters.type,
      pimportance: promptFilters.importance === "すべて" ? null : promptFilters.importance,
      ppersona: promptFilters.persona === "すべて" ? null : promptFilters.persona,
      ptopic: promptFilters.topic === "すべて" ? null : promptFilters.topic,
      pphase: promptFilters.phase === "すべて" ? null : promptFilters.phase,
      pmodel: promptFilters.model === "すべて" ? null : promptFilters.model,
      psort: promptSort === "質問順" ? null : promptSort,
      psize: pageSize === 50 ? null : String(pageSize),
      ppage: page === 1 ? null : String(page)
    });
  }, [page, pageSize, promptFilters, promptSort, promptView, searchQuery]);
  useEffect(() => {
    let animationFrame = 0;
    const saveScrollPosition = () => {
      if (!promptListHydrated.current) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        try {
          const current = JSON.parse(window.sessionStorage.getItem(promptListStateKey) ?? "{}") as Record<string, unknown>;
          window.sessionStorage.setItem(promptListStateKey, JSON.stringify({ ...current, scrollY: window.scrollY }));
        } catch {
          window.sessionStorage.removeItem(promptListStateKey);
        }
      });
    };
    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("pagehide", saveScrollPosition);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      saveScrollPosition();
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("pagehide", saveScrollPosition);
    };
  }, []);


  const filteredPromptRows = promptRows.filter((row) => promptMatchesView(row, promptView)).filter((row) => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("ja-JP");
    if (normalizedQuery && ![row.prompt, row.reason, row.persona, row.topic, row.phase].join(" ").toLocaleLowerCase("ja-JP").includes(normalizedQuery)) return false;
    if (promptFilters.type !== "すべて" && row.type !== promptFilters.type) return false;
    if (promptFilters.importance !== "すべて" && row.importance !== promptFilters.importance) return false;
    if (promptFilters.persona !== "すべて" && row.persona !== promptFilters.persona) return false;
    if (promptFilters.topic !== "すべて" && row.topic !== promptFilters.topic) return false;
    if (promptFilters.phase !== "すべて" && row.phase !== promptFilters.phase) return false;
    return true;
  });

  const modelScopedResults = (row: PromptRow) => getPromptModelResults(row, "30日");
  const averageAiPresence = (row: PromptRow) => {
    const results = modelScopedResults(row);
    return results.length === 0 ? 0 : results.reduce((sum, item) => sum + item.aiPresence, 0) / results.length;
  };
  const sortedPromptRows = [...filteredPromptRows].sort((a, b) => {
    if (promptSort === "質問順") return a.prompt.localeCompare(b.prompt, "ja");
    if (promptSort === "AI表示率が低い") return averageAiPresence(a) - averageAiPresence(b);
    if (promptSort === "悪化幅が大きい") {
      const aDelta = Math.min(...modelScopedResults(a).map((item) => item.periodDelta));
      const bDelta = Math.min(...modelScopedResults(b).map((item) => item.periodDelta));
      return aDelta - bDelta;
    }
    const missingRate = (row: PromptRow) => {
      const results = modelScopedResults(row);
      const expected = results.reduce((sum, item) => sum + item.expectedObservations, 0);
      return expected === 0 ? 0 : results.reduce((sum, item) => sum + item.missingObservations, 0) / expected;
    };
    return missingRate(b) - missingRate(a);
  });

  const totalPages = Math.max(1, Math.ceil(sortedPromptRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visiblePromptRows = sortedPromptRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updatePromptFilter = (key: PromptFilterKey, value: string) => {
    setPromptFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const promptReturnParams = new URLSearchParams();
  if (promptView !== "すべて") promptReturnParams.set("pview", promptView);
  if (searchQuery) promptReturnParams.set("pq", searchQuery);
  Object.entries(promptFilters).forEach(([key, value]) => {
    if (value !== "すべて") promptReturnParams.set("p" + key, value);
  });
  if (promptSort !== "質問順") promptReturnParams.set("psort", promptSort);
  if (pageSize !== 50) promptReturnParams.set("psize", String(pageSize));
  if (safePage !== 1) promptReturnParams.set("ppage", String(safePage));
  const promptReturnHref = context.reportBase + "/prompts" + (promptReturnParams.size ? "?" + promptReturnParams.toString() : "");

  return (
    <DashboardFrame context={context} eyebrow="プロンプト" title="プロンプト" description="固定質問を30日集計で比較し、気になる質問から1件ごとの分析へ進みます。" scopeMode="none">
      <FilterAndViewBar
        activeView={promptView}
        onViewChange={(view) => { setPromptView(view); setPage(1); }}
        visibleCount={filteredPromptRows.length}
        searchQuery={searchQuery}
        onSearchQuery={(value) => { setSearchQuery(value); setPage(1); }}
        filters={promptFilters}
        onFilterChange={updatePromptFilter}
        sort={promptSort}
        onSortChange={(value) => { setPromptSort(value); setPage(1); }}
        onReset={() => { setPromptView("すべて"); setSearchQuery(""); setPromptFilters(defaultPromptFilters); setPromptSort("質問順"); setPage(1); }}
      />
      <DataRichPanel title="30日のモデル別プロンプト集計" description={"絞り込み後の" + filteredPromptRows.length + "件を、契約中のAIモデルごとに比較します。"} bodyClassName="p-0" variant="comparison">
        <PromptModelAggregate rows={filteredPromptRows} highlightedModel={promptFilters.model === "すべて" ? null : promptFilters.model} />
      </DataRichPanel>
      <DataRichPanel title="プロンプト一覧" description="質問の属性・30日集計・最新日のモデル状態を1レコードで確認し、そのまま分析へ進めます。" bodyClassName="p-0" variant="evidence">
        <PromptTable reportBase={context.reportBase} returnHref={promptReturnHref} range="30日" rows={visiblePromptRows} />
        <PromptPagination page={safePage} totalPages={totalPages} pageSize={pageSize} shown={visiblePromptRows.length} matched={filteredPromptRows.length} contractTotal={promptRows.length} onPage={setPage} onPageSize={(value) => { setPageSize(value); setPage(1); }} />
      </DataRichPanel>
    </DashboardFrame>
  );
}

function AnswerStatusSummary({
  expected,
  listed,
  unlisted,
  verificationAttention,
  reportBase,
  detailScope
}: {
  expected: number;
  listed: number;
  unlisted: number;
  verificationAttention: number;
  reportBase: string;
  detailScope: { questionCount: number; modelNames: string[]; answerModelBreakdown: CustomerAnswerModelBreakdown[] };
}) {
  const items: { label: string; value: number; tone: string; detail: ReportDetailPayload }[] = [
    { label: "予定回答", value: expected, tone: "text-[#101828]", detail: buildCustomerPageKpiDetail("answer-expected", reportBase, detailScope) },
    { label: "自社掲載あり", value: listed, tone: "text-[#075E44]", detail: buildCustomerPageKpiDetail("answer-listed", reportBase, detailScope) },
    { label: "自社未掲載", value: unlisted, tone: "text-[#9A5B13]", detail: buildCustomerPageKpiDetail("answer-unlisted", reportBase, detailScope) },
    { label: "検証注意", value: verificationAttention, tone: "text-[#B42318]", detail: buildCustomerPageKpiDetail("answer-verification", reportBase, detailScope) }
  ];

  return (
    <section aria-label="選択した観測日の回答状況" className="overflow-hidden border-y border-[#D7E0DC] bg-white">
      <div className="grid grid-cols-2 divide-x divide-y divide-[#E3EAE6] md:grid-cols-4 md:divide-y-0">
        {items.map((item) => (
          <ReportDetailButton key={item.label} detail={item.detail} showIcon={false} className="w-full rounded-none px-4 py-3.5 hover:bg-[#F5F8F6] md:px-5">
            <span className="flex w-full min-w-0 items-end justify-between gap-3">
              <span className="text-[11px] font-bold tracking-[0.02em] text-[#667085]">{item.label}</span>
              <span className={"text-xl font-semibold tabular-nums " + item.tone}>{item.value.toLocaleString("ja-JP")}<span className="ml-0.5 text-xs font-bold">件</span></span>
            </span>
          </ReportDetailButton>
        ))}
      </div>
    </section>
  );
}
const answerObservationDates = ["2026-07-06", "2026-07-05", "2026-07-04", "2026-07-03", "2026-07-02", "2026-07-01", "2026-06-30"] as const;

function AnswersPage({ context }: { context: PageContext }) {
  const validAnswerRows = answerRows.filter((row) => row.retrievalStatus === "取得済み");

  const listedAnswers = validAnswerRows.filter((row) => row.listed === "掲載あり").length;
  const validAnswers = validAnswerRows.length;
  const unlistedAnswers = validAnswers - listedAnswers;
  const verificationAttentionCount = validAnswerRows.filter((row) => row.verification === "要確認").length;
  const expectedAnswers = dashboardScope.questionCount * activeModels.length;
  const answerModelBreakdown: CustomerAnswerModelBreakdown[] = activeModels.map((model) => {
    const modelRows = answerRows.filter((row) => row.model === model.name);
    const validRows = modelRows.filter((row) => row.retrievalStatus === "取得済み");
    const listedRows = validRows.filter((row) => row.listed === "掲載あり");
    const firstUnlistedPrompt = validRows.find((row) => row.listed === "未掲載")?.promptId;
    const firstUnlistedTopic = promptRows.find((prompt) => prompt.id === firstUnlistedPrompt)?.topic;
    return {
      modelName: model.name,
      listed: listedRows.length,
      firstPosition: listedRows.filter((row) => row.position === "1位").length,
      secondToThirdPosition: listedRows.filter((row) => row.position === "2位" || row.position === "3位").length,
      bodyMention: listedRows.filter((row) => row.position === "—").length,
      unlisted: validRows.filter((row) => row.listed === "未掲載").length,
      missing: modelRows.filter((row) => row.retrievalStatus === "計測失敗").length,
      verificationAttention: validRows.filter((row) => row.verification === "要確認").length,
      unlistedTopic: firstUnlistedTopic ?? "複数トピック",
      leadingCompetitor: validRows.find((row) => row.competitorAhead !== "なし" && row.competitorAhead !== "判定不可")?.competitorAhead ?? "なし"
    };
  });
  const answerDetailScope = { questionCount: dashboardScope.questionCount, modelNames: activeModels.map((model) => model.name), answerModelBreakdown };
  const [answerSearch, setAnswerSearch] = useState("");
  const [answerModel, setAnswerModel] = useState("すべて");
  const [answerListing, setAnswerListing] = useState("すべて");
  const [answerVerification, setAnswerVerification] = useState("すべて");
  const [answerFocus, setAnswerFocus] = useState<"すべて" | "未掲載" | "競合先行" | "要確認">("すべて");
  const [answerPage, setAnswerPage] = useState(1);
  const [answerPageSize, setAnswerPageSize] = useState<10 | 25>(10);
  const [answerUrlReady, setAnswerUrlReady] = useState(false);
  const [answerDate, setAnswerDate] = useState<string>(answerObservationDates[0]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedModel = params.get("amodel") ?? "すべて";
    const availableModels = new Set(["すべて", ...activeModels.map((model) => model.name)]);
    setAnswerSearch(params.get("aq") ?? "");
    const requestedDate = params.get("adate");
    if (requestedDate && answerObservationDates.includes(requestedDate as typeof answerObservationDates[number])) setAnswerDate(requestedDate);
    setAnswerModel(availableModels.has(requestedModel) ? requestedModel : "すべて");
    setAnswerListing(params.get("alisting") ?? "すべて");
    setAnswerVerification(params.get("averification") ?? "すべて");
    const focus = params.get("afocus");
    if (["すべて", "未掲載", "競合先行", "要確認"].includes(focus ?? "")) setAnswerFocus(focus as typeof answerFocus);
    const queryPage = Number(params.get("apage"));
    const querySize = Number(params.get("asize"));
    if (queryPage > 0) setAnswerPage(Math.floor(queryPage));
    if (querySize === 25) setAnswerPageSize(25);
    setAnswerUrlReady(true);
  }, []);

  useEffect(() => {
    if (!answerUrlReady) return;
    replaceCurrentQuery({
      aq: answerSearch || null,
      amodel: answerModel === "すべて" ? null : answerModel,
      alisting: answerListing === "すべて" ? null : answerListing,
      averification: answerVerification === "すべて" ? null : answerVerification,
      afocus: answerFocus === "すべて" ? null : answerFocus,
      apage: answerPage === 1 ? null : String(answerPage),
      asize: answerPageSize === 10 ? null : String(answerPageSize),
      adate: answerDate === answerObservationDates[0] ? null : answerDate
    });
  }, [answerDate, answerFocus, answerListing, answerModel, answerPage, answerPageSize, answerSearch, answerUrlReady, answerVerification]);

  const answerRowsByPrompt = new Map<string, AnswerRow[]>();
  answerRows.forEach((row) => {
    const group = answerRowsByPrompt.get(row.promptId) ?? [];
    group.push(row);
    answerRowsByPrompt.set(row.promptId, group);
  });
  const matchingPrompts = promptRows.filter((prompt) => {
    if (answerSearch && !prompt.prompt.toLocaleLowerCase("ja-JP").includes(answerSearch.toLocaleLowerCase("ja-JP"))) return false;
    const allModelRows = answerRowsByPrompt.get(prompt.id) ?? [];
    const scopedRows = answerModel === "すべて" ? allModelRows : allModelRows.filter((row) => row.model === answerModel);
    return scopedRows.some((row) => {
      if (answerListing !== "すべて" && row.listed !== answerListing) return false;
      if (answerVerification !== "すべて" && row.verification !== answerVerification) return false;
      if (answerFocus === "未掲載" && row.listed !== "未掲載") return false;
      if (answerFocus === "競合先行" && (row.competitorAhead === "なし" || row.competitorAhead === "判定不可")) return false;
      if (answerFocus === "要確認" && row.verification !== "要確認") return false;
      return true;
    });
  });
  const answerTotalPages = Math.max(1, Math.ceil(matchingPrompts.length / answerPageSize));
  const safeAnswerPage = Math.min(answerPage, answerTotalPages);
  const visiblePromptIds = new Set(matchingPrompts.slice((safeAnswerPage - 1) * answerPageSize, safeAnswerPage * answerPageSize).map((prompt) => prompt.id));
  const visibleAnswerRows = answerRows.filter((row) => visiblePromptIds.has(row.promptId));
  const hasAnswerFilters = Boolean(answerSearch) || answerModel !== "すべて" || answerListing !== "すべて" || answerVerification !== "すべて" || answerFocus !== "すべて";

  useEffect(() => {
    if (answerPage > answerTotalPages) setAnswerPage(answerTotalPages);
  }, [answerPage, answerTotalPages]);

  const answerReturnParams = new URLSearchParams();
  if (answerSearch) answerReturnParams.set("aq", answerSearch);
  if (answerModel !== "すべて") answerReturnParams.set("amodel", answerModel);
  if (answerListing !== "すべて") answerReturnParams.set("alisting", answerListing);
  if (answerVerification !== "すべて") answerReturnParams.set("averification", answerVerification);
  if (answerFocus !== "すべて") answerReturnParams.set("afocus", answerFocus);
  if (safeAnswerPage !== 1) answerReturnParams.set("apage", String(safeAnswerPage));
  if (answerPageSize !== 10) answerReturnParams.set("asize", String(answerPageSize));
  if (answerDate !== answerObservationDates[0]) answerReturnParams.set("adate", answerDate);
  const answerReturnHref = `${context.reportBase}/conversations${answerReturnParams.size ? `?${answerReturnParams.toString()}` : ""}`;

  return (
    <DashboardFrame
      context={context}
      eyebrow="AI回答"
      title="AI回答"
      description="選択した観測日の質問ごとに、AIモデルの回答・自社掲載・引用・検証状態を横並びで比較します。"
      scopeMode="none"
    >
      <AnswerStatusSummary
        expected={expectedAnswers}
        listed={listedAnswers}
        unlisted={unlistedAnswers}
        verificationAttention={verificationAttentionCount}
        reportBase={context.reportBase}
        detailScope={answerDetailScope}
      />
      <section className="border border-[#DDE5E1] bg-[#F8FAF9] px-4 py-4" aria-label="AI回答の絞り込み">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#101828]">回答を探す</h2>
          <label className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] font-bold text-[#667085]">観測日</span>
            <span className="relative block">
              <select value={answerDate} onChange={(event) => { setAnswerDate(event.target.value); setAnswerPage(1); }} className="h-9 appearance-none rounded-md border border-[#C7D2CC] bg-white pl-3 pr-8 text-[12px] font-bold tabular-nums text-[#075E44] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2" aria-label="AI回答の観測日">
                {answerObservationDates.map((date) => <option key={date} value={date}>{date.replaceAll("-", "/")}{date === answerObservationDates[0] ? "（最新）" : ""}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
            </span>
          </label>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[#DDE5E1] pb-4" role="group" aria-label="保存済みの確認ビュー">
          <span className="mr-1 text-[12px] font-bold text-[#475467]">確認ビュー</span>
          {([
            { value: "すべて", label: "すべて" },
            { value: "未掲載", label: "未掲載" },
            { value: "競合先行", label: "競合先行" },
            { value: "要確認", label: "検証注意" }
          ] as const).map((focus) => (
            <button key={focus.value} type="button" aria-pressed={answerFocus === focus.value} onClick={() => { setAnswerFocus(focus.value); setAnswerPage(1); }} className={cn("min-h-10 rounded-md border px-3 text-[12px] font-bold transition", answerFocus === focus.value ? "border-[#0B6B57] bg-[#EAF6F0] text-[#075E44]" : "border-[#D7E0DC] bg-white text-[#475467] hover:border-[#9AB8AA]")}>{focus.label}</button>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.6fr)_repeat(3,minmax(150px,0.7fr))_auto] lg:items-end">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-bold text-[#667085]">質問文を検索</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
              <input
                value={answerSearch}
                onChange={(event) => { setAnswerSearch(event.target.value); setAnswerPage(1); }}
                placeholder="質問文を入力"
                className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none placeholder:font-medium placeholder:text-[#98A2B3] focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2"
              />
            </span>
          </label>
          {[
            { label: "強調するAIモデル", value: answerModel, onChange: setAnswerModel, options: ["すべて", ...activeModels.map((model) => model.name)] },
            { label: "自社掲載", value: answerListing, onChange: setAnswerListing, options: ["すべて", "掲載あり", "未掲載", "判定不可"] },
            { label: "検証結果", value: answerVerification, onChange: setAnswerVerification, options: ["すべて", "引用一致", "主張確認済み", "要確認", "判定不可"] }
          ].map((filter) => (
            <label key={filter.label} className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-bold text-[#667085]">{filter.label}</span>
              <span className="relative block">
                <select
                  value={filter.value}
                  onChange={(event) => { filter.onChange(event.target.value); setAnswerPage(1); }}
                  className="h-11 w-full appearance-none rounded-md border border-[#C7D2CC] bg-white px-3 pr-9 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2"
                >
                  {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
              </span>
            </label>
          ))}
          <button
            type="button"
            disabled={!hasAnswerFilters}
            onClick={() => {
              setAnswerSearch("");
              setAnswerModel("すべて");
              setAnswerListing("すべて");
              setAnswerVerification("すべて");
              setAnswerFocus("すべて");
              setAnswerPage(1);
            }}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-[#C7D2CC] bg-white px-3 text-xs font-bold text-[#475467] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            解除
          </button>
        </div>
      </section>
      <DataRichPanel title="質問ごとのAI回答比較" description={`条件一致${matchingPrompts.length}質問のうち${visiblePromptIds.size}質問を表示しています。AIモデルを選んでも、比較対象は同じ表に残します。`} bodyClassName="p-0" variant="comparison">
        {visibleAnswerRows.length ? (
          <>
            <AnswerTable rows={visibleAnswerRows} reportBase={context.reportBase} returnHref={answerReturnHref} observationDate={answerDate} highlightedProvider={answerModel === "すべて" ? "全モデル" : answerModel as ReportProvider} />
            <ResultPagination page={safeAnswerPage} totalPages={answerTotalPages} pageSize={answerPageSize} pageSizes={[10, 25]} shown={visiblePromptIds.size} matched={matchingPrompts.length} total={promptRows.length} unit="質問" onPage={setAnswerPage} onPageSize={(size) => { setAnswerPageSize(size === 25 ? 25 : 10); setAnswerPage(1); }} />
          </>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-bold text-[#344054]">条件に一致する回答がありません</p>
            <p className="mt-1 text-xs text-[#667085]">検索語か絞り込み条件を変更してください。</p>
          </div>
        )}
      </DataRichPanel>
    </DashboardFrame>
  );
}

function PromptCompetitorComparison({ row, range }: { row: PromptRow; range: ReportRange }) {
  const modelResults = getPromptModelResults(row, range);
  const mean = (values: number[]) => values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const positions = modelResults.map((item) => Number.parseFloat(item.position)).filter((value) => Number.isFinite(value));
  const own = {
    ...competitors[0],
    aiPresence: mean(modelResults.map((item) => item.aiPresence)),
    sov: mean(modelResults.map((item) => item.sov)),
    averagePosition: positions.length === 0 ? null : positions.reduce((sum, value) => sum + value, 0) / positions.length,
    citationRate: mean(modelResults.map((item) => item.citation))
  };
  const rangeOffset = range === "7日" ? -3 : range === "90日" ? 2 : 0;
  const seed = Number.parseInt(row.id.replace(/\D/g, ""), 10) || 1;
  const rivals = competitors.slice(1, 5).map((brand, index) => {
    const promptOffset = ((seed + index * 3) % 9) - 4;
    return {
      ...brand,
      aiPresence: Math.max(0, Math.min(100, brand.aiPresence + promptOffset + rangeOffset)),
      sov: Math.max(0, Math.min(100, brand.sov + Math.round(promptOffset / 2))),
      averagePosition: Math.max(1, brand.averagePosition - promptOffset * 0.05),
      citationRate: Math.max(0, Math.min(100, brand.citationRate + promptOffset))
    };
  });
  const comparisonRows = [own, ...rivals];

  return (
    <DataRichPanel title="競合との掲載比較" description={range + "の同じ質問について、Recoraと主要競合を同じ指標で比較します。"} bodyClassName="p-0" variant="comparison">
      <div className="hidden grid-cols-[minmax(180px,1.25fr)_repeat(5,minmax(110px,.8fr))] border-b border-[#D7E0DC] bg-[#F5F8F6] px-0 text-[11px] font-bold text-[#667085] lg:grid">
        {["ブランド", "AI表示率", "AI内シェア", "平均掲載位置", "公式サイト引用率", "Recoraとの差"].map((label) => <div key={label} className="px-4 py-3">{label}</div>)}
      </div>
      <div className="divide-y divide-[#DDE5E1]">
        {comparisonRows.map((brand) => {
          const gap = brand.aiPresence - own.aiPresence;
          return (
            <div key={brand.id} className={cn("grid min-w-0 lg:grid-cols-[minmax(180px,1.25fr)_repeat(5,minmax(110px,.8fr))]", brand.isPrimary && "bg-[#F1F8F5]")}>
              <div className="flex min-h-[66px] items-center px-4 py-3">
                <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
              </div>
              <dl className="grid grid-cols-2 gap-px bg-[#E3EAE6] lg:contents">
                {[
                  ["AI表示率", brand.aiPresence + "%"],
                  ["AI内シェア", brand.sov + "%"],
                  ["平均掲載位置", brand.averagePosition === null ? "—" : brand.averagePosition.toFixed(1) + "位"],
                  ["公式サイト引用率", brand.citationRate + "%"],
                  ["Recoraとの差", brand.isPrimary ? "基準" : (gap > 0 ? "+" : "") + gap + "pt"]
                ].map(([label, value], index) => (
                  <div key={label} className={cn("min-w-0 bg-white px-4 py-3 lg:bg-transparent", index === 4 && "col-span-2 lg:col-span-1", brand.isPrimary && "lg:bg-[#F1F8F5]")}>
                    <dt className="text-[10px] font-bold text-[#667085] lg:hidden">{label}</dt>
                    <dd className={cn("mt-1 text-[14px] font-semibold tabular-nums text-[#101828] lg:mt-0", label === "Recoraとの差" && !brand.isPrimary && gap < 0 && "text-[#075E44]", label === "Recoraとの差" && gap > 0 && "text-[#9A5B13]")}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </DataRichPanel>
  );
}

function PromptDetailPage({ context }: { context: PageContext }) {
  const promptReturnHref = useReturnHref(context.reportBase + "/prompts");
  const rowIndex = promptRows.findIndex((item) => item.id === context.detailId);
  const row = rowIndex >= 0 ? promptRows[rowIndex] : undefined;
  if (!row) {
    return <AnalysisTargetNotFound context={context} section="プロンプト" backHref={context.reportBase + "/prompts"} backLabel="プロンプト一覧へ戻る" />;
  }

  const previousRow = rowIndex > 0 ? promptRows[rowIndex - 1] : null;
  const nextRow = rowIndex < promptRows.length - 1 ? promptRows[rowIndex + 1] : null;
  const promptHref = (target: PromptRow) => context.reportBase + "/prompts/" + target.id + "?range=" + encodeURIComponent(context.range) + "&return=" + encodeURIComponent(promptReturnHref);
  const analysisRanges: ReportRange[] = ["7日", "30日", "90日"];
  const marketMetricEligible = row.type === "Non-brand";
  const latestObservations = getPromptLatestObservations(row);
  const periodModelResults = getPromptModelResults(row, context.range);
  const averagePeriodMetric = (key: "aiPresence" | "sov" | "citation") => Math.round(periodModelResults.reduce((sum, item) => sum + item[key], 0) / Math.max(1, periodModelResults.length));
  const positionValues = periodModelResults.map((item) => Number.parseFloat(item.position)).filter((value) => Number.isFinite(value));
  const periodAiPresence = averagePeriodMetric("aiPresence");
  const periodSov = averagePeriodMetric("sov");
  const periodCitation = averagePeriodMetric("citation");
  const periodAveragePosition = positionValues.length ? (positionValues.reduce((sum, value) => sum + value, 0) / positionValues.length).toFixed(1) + "位" : "対象外";
  const periodDelta = Math.round(periodModelResults.reduce((sum, item) => sum + item.periodDelta, 0) / Math.max(1, periodModelResults.length));

  return (
    <DashboardFrame
      context={context}
      eyebrow="プロンプト"
      title={row.prompt}
      description="この質問に対する期間変化・AIモデル差・競合差・最新日の回答を分析します。"
      scopeMode="none"
      sectionIndexItems={[]}
      action={(
        <div className="flex flex-wrap justify-end gap-2">
          {previousRow ? (
            <Link href={promptHref(previousRow)} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#C7D2CC] bg-white px-4 text-[12px] font-bold text-[#344054] transition hover:border-[#8EAA9E] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />前の質問
            </Link>
          ) : null}
          {nextRow ? (
            <Link href={promptHref(nextRow)} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#C7D2CC] bg-white px-4 text-[12px] font-bold text-[#344054] transition hover:border-[#8EAA9E] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              次の質問<ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          ) : null}
          <Link href={promptReturnHref} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#C7D2CC] bg-white px-4 text-[12px] font-bold text-[#344054] transition hover:border-[#8EAA9E] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />一覧へ戻る
          </Link>
        </div>
      )}
    >
      <section aria-label="プロンプトの属性" className="border-y border-[#D7E0DC] bg-[#F8FAF9] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-semibold text-[#667085]">
          <DataRichBadge tone={row.type === "Non-brand" ? "green" : "default"}>{row.type}</DataRichBadge>
          <PriorityBadge value={row.importance} />
          <span>ペルソナ: <strong className="text-[#344054]">{row.persona}</strong></span>
          <span>トピック: <strong className="text-[#344054]">{row.topic}</strong></span>
          <span>フェーズ: <strong className="text-[#344054]">{row.phase}</strong></span>
        </div>
      </section>

      <section aria-labelledby="prompt-period-summary" className="overflow-hidden border-y border-[#D7E0DC] bg-white">
        <div className="flex min-w-0 flex-col gap-4 border-b border-[#D7E0DC] bg-[#F5F8F6] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.08em] text-[#075E44]">PERIOD ANALYSIS</p>
            <h2 id="prompt-period-summary" className="mt-1 text-lg font-semibold text-[#101828]">{context.range}の集計</h2>
          </div>
          <div role="group" aria-label="このプロンプトの集計期間" className="flex flex-wrap gap-1.5">
            {analysisRanges.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={context.range === range}
                onClick={() => context.onRange(range)}
                className={cn("min-h-10 rounded-md border px-4 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-1", context.range === range ? "border-[#0B6B57] bg-[#0B382D] text-white" : "border-[#D7E0DC] bg-white text-[#475467] hover:border-[#9AB8AA]")}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 lg:grid-cols-[minmax(260px,1.15fr)_minmax(0,2fr)]">
          <div className="border-b border-[#D7E0DC] px-5 py-5 lg:border-b-0 lg:border-r">
            <p className="text-[12px] font-bold text-[#667085]">AI表示率</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-4xl font-semibold tabular-nums text-[#0B382D]">{marketMetricEligible ? periodAiPresence + "%" : "対象外"}</p>
              {marketMetricEligible ? <DataRichBadge tone={periodDelta < 0 ? "amber" : "green"}>{periodDelta > 0 ? "+" : ""}{periodDelta}pt</DataRichBadge> : null}
            </div>
            {marketMetricEligible ? <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7EEEB]"><div className="h-full rounded-full bg-[#0B6B57]" style={{ width: periodAiPresence + "%" }} /></div> : null}
            <p className="mt-3 text-[11px] font-medium leading-5 text-[#667085]">Non-brand質問の有効観測で、自社が回答に掲載された割合</p>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-[#E3EAE6] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: "AI内シェア", value: marketMetricEligible ? periodSov + "%" : "対象外", note: "回答内のブランド言及に占める割合" },
              { label: "平均掲載位置", value: marketMetricEligible ? periodAveragePosition : "対象外", note: "掲載された回答のみ。低いほど上位" },
              { label: "公式サイト引用率", value: periodCitation + "%", note: "自社公式URLが引用された有効回答の割合" }
            ].map((item) => (
              <div key={item.label} className="min-w-0 px-4 py-5">
                <dt className="text-[11px] font-bold text-[#667085]">{item.label}</dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums text-[#101828]">{item.value}</dd>
                <p className="mt-2 text-[11px] font-medium leading-5 text-[#667085]">{item.note}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <DataRichPanel title="AIモデル別比較" description={context.range + "の同じ質問を、契約中のAIモデルごとに比較します。"} bodyClassName="p-0" variant="comparison">
        <PromptModelResultTable row={row} range={context.range} highlightedProvider={context.provider} />
      </DataRichPanel>

      <PromptDetailAdvancedPanels reportBase={context.reportBase} prompt={row} activeModelNames={activeModels.map((model) => model.name)} section="trend" range={context.range} />
      <PromptCompetitorComparison row={row} range={context.range} />

      <DataRichPanel title={"最新日のAIモデル別観測（" + latestObservations.length + "モデル）"} description={latestScope.measurementDate + "に実行した同一プロンプトの結果です。上の期間切替には連動しません。"} bodyClassName="p-0">
        <PromptLatestObservationTable row={row} range={context.range} reportBase={context.reportBase} />
      </DataRichPanel>

      <PromptDetailAdvancedPanels reportBase={context.reportBase} prompt={row} activeModelNames={activeModels.map((model) => model.name)} section="evidence" range={context.range} />
    </DashboardFrame>
  );
}

function AnswerTwoModelComparison({ current, reportBase, observationDate }: { current: AnswerRow; reportBase: string; observationDate: string }) {
  const candidates = useMemo(() => answerRows.filter((item) => item.promptId === current.promptId && item.model !== current.model), [current.model, current.promptId]);
  const [comparisonModel, setComparisonModel] = useState(candidates[0]?.model ?? "");

  useEffect(() => {
    if (!candidates.some((item) => item.model === comparisonModel)) setComparisonModel(candidates[0]?.model ?? "");
  }, [candidates, comparisonModel]);

  if (candidates.length === 0) return null;
  const comparison = candidates.find((item) => item.model === comparisonModel) ?? candidates[0];
  const rows = [
    { label: "自社掲載", current: current.listed, comparison: comparison.listed },
    { label: "掲載位置", current: current.position, comparison: comparison.position },
    { label: "推薦順", current: current.recommendationOrder, comparison: comparison.recommendationOrder },
    { label: "先行競合", current: current.competitorAhead, comparison: comparison.competitorAhead },
    { label: "引用数", current: current.citations + "件", comparison: comparison.citations + "件" },
    { label: "検証結果", current: current.verification, comparison: comparison.verification }
  ];
  const comparisonHref = reportBase + "/conversations/" + comparison.id + "?date=" + encodeURIComponent(observationDate) + "&return=" + encodeURIComponent(reportBase + "/conversations?adate=" + observationDate);

  return (
    <DataRichPanel title="2モデル比較" description="同じ質問に対する2つのAI回答を、掲載状態・引用・回答内容で見比べます。" bodyClassName="p-0" variant="comparison">
      <div className="flex flex-col gap-3 border-b border-[#D7E0DC] bg-[#F8FAF9] px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#667085]">表示中のAIモデル</p>
          <div className="mt-2"><ModelIdentity name={current.model} compact /></div>
        </div>
        <label className="min-w-0 sm:w-[280px]">
          <span className="mb-1.5 block text-[11px] font-bold text-[#667085]">比較するAIモデル</span>
          <span className="relative block">
            <select value={comparison.model} onChange={(event) => setComparisonModel(event.target.value)} className="h-11 w-full appearance-none rounded-md border border-[#C7D2CC] bg-white px-3 pr-9 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              {candidates.map((item) => <option key={item.model} value={item.model}>{item.model}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
          </span>
        </label>
      </div>
      <div className="hidden grid-cols-[minmax(150px,.8fr)_repeat(2,minmax(0,1fr))] border-b border-[#D7E0DC] bg-[#F5F8F6] lg:grid">
        <div className="px-4 py-3 text-[11px] font-bold text-[#667085]">比較項目</div>
        <div className="border-l border-[#D7E0DC] px-4 py-3"><ModelIdentity name={current.model} compact /></div>
        <div className="border-l border-[#D7E0DC] px-4 py-3"><ModelIdentity name={comparison.model} compact /></div>
      </div>
      <div className="divide-y divide-[#E3EAE6]">
        {rows.map((item) => {
          const differs = item.current !== item.comparison;
          return (
            <div key={item.label} className="grid min-w-0 grid-cols-2 lg:grid-cols-[minmax(150px,.8fr)_repeat(2,minmax(0,1fr))]">
              <div className="col-span-2 bg-[#FBFCFB] px-4 py-2.5 text-[11px] font-bold text-[#667085] lg:col-span-1 lg:flex lg:min-h-14 lg:items-center">{item.label}</div>
              <div className={cn("min-w-0 border-t border-[#E3EAE6] px-4 py-3 text-[13px] font-semibold text-[#101828] lg:border-l lg:border-t-0", differs && "bg-[#FFFBF3]")}><span className="mb-1 block text-[10px] font-bold text-[#667085] lg:hidden">{current.model}</span>{item.current}</div>
              <div className={cn("min-w-0 border-l border-t border-[#E3EAE6] px-4 py-3 text-[13px] font-semibold text-[#101828] lg:border-t-0", differs && "bg-[#FFFBF3]")}><span className="mb-1 block text-[10px] font-bold text-[#667085] lg:hidden">{comparison.model}</span>{item.comparison}</div>
            </div>
          );
        })}
      </div>
      <div className="grid min-w-0 gap-px border-t border-[#D7E0DC] bg-[#D7E0DC] lg:grid-cols-2">
        {[
          { answer: current, label: "表示中", href: null },
          { answer: comparison, label: "比較対象", href: comparisonHref }
        ].map((item) => (
          <article key={item.answer.id} className="min-w-0 bg-white px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <ModelIdentity name={item.answer.model} compact />
              <DataRichBadge tone={item.href ? "default" : "green"}>{item.label}</DataRichBadge>
            </div>
            <p className="mt-3 text-[13px] font-medium leading-6 text-[#475467]">{getAnswerPreviewText(item.answer)}</p>
            {item.href ? (
              <Link href={item.href} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#9AB8AA] bg-white px-3 text-[12px] font-bold text-[#075E44] hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">比較する回答の全文を開く<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            ) : <p className="mt-3 text-[11px] font-bold text-[#075E44]">全文はこの下に表示</p>}
          </article>
        ))}
      </div>
    </DataRichPanel>
  );
}
function AnswerDetailPage({ context }: { context: PageContext }) {
  const answerReturnHref = useReturnHref(context.reportBase + "/conversations");
  const answerListHref = answerReturnHref.startsWith(`${context.reportBase}/prompts/`) ? `${context.reportBase}/conversations` : answerReturnHref;
  const [observationDate, setObservationDate] = useState<string>(answerObservationDates[0]);
  useEffect(() => {
    const requestedDate = new URLSearchParams(window.location.search).get("date");
    if (requestedDate && answerObservationDates.includes(requestedDate as typeof answerObservationDates[number])) setObservationDate(requestedDate);
  }, []);
  const row = answerRows.find((item) => item.id === context.detailId);
  if (!row) {
    return <AnalysisTargetNotFound context={context} section="AI回答" backHref={context.reportBase + "/conversations"} backLabel="AI回答へ戻る" />;
  }
  const prompt = promptRows.find((item) => item.prompt === row.prompt) ?? promptRows[0];
  const citationUrls = answerCitationUrls.slice(0, row.citations);
  const promptAnalysisHref = `${context.reportBase}/prompts/${prompt.id}?return=${encodeURIComponent(`${context.reportBase}/conversations/${row.id}`)}`;
  const listingSummary = row.retrievalStatus === "計測失敗"
    ? "回答を取得できなかったため、掲載有無は判定していません。"
    : row.listed === "掲載あり"
      ? "自社掲載あり。順位と引用元を確認してください。"
      : "自社が出るべき回答で未掲載です。";

  return (
    <DashboardFrame
      context={context}
      eyebrow="AI回答"
      title={row.prompt}
      description="この回答の全文、ブランドの登場位置と役割、引用元、主張の整合性を確認します。"
      activeNote={`${row.model}・${observationDate.replaceAll("-", "/")} 06:00`}
      scopeMode="none"
      action={(
        <div className="flex flex-wrap gap-2">
          <DataRichPrimaryAction href={promptAnalysisHref} variant="secondary">この質問の期間分析</DataRichPrimaryAction>
          <DataRichPrimaryAction href={answerListHref} variant="secondary">AI回答へ戻る</DataRichPrimaryAction>
        </div>
      )}
    >
      <DataRichKpiStrip layout="rows"
        columns="xl:grid-cols-6"
        items={[
          { label: "自社掲載", value: row.listed, helper: "選択した観測日", tone: row.listed === "掲載あり" ? "green" : row.listed === "判定不可" ? "red" : "amber" },
          { label: "掲載位置", value: row.position, helper: "順位付き表示または本文言及" },
          { label: "推薦順", value: row.recommendationOrder, helper: "AI回答内の推薦順" },
          { label: "競合先行", value: row.competitorAhead, helper: "自社より前に出た競合" },
          { label: "引用数", value: `${row.citations}件`, helper: "回答に付いた引用URL" },
          { label: "検証結果", value: row.verification, helper: "主張と引用元の照合" }
        ]}
      />

      <section className="border-y border-[#D8E1DD] bg-[#F8FAF9] px-4 py-4 sm:px-5" aria-label="この観測の要点">
        <p className="text-[12px] font-bold text-[#075E44]">この観測の要点</p>
        <p className="mt-1.5 text-[13px] font-semibold leading-6 text-[#344054]">{listingSummary}</p>
        <p className="mt-1 text-[12px] leading-5 text-[#667085]">
          競合先行: {row.competitorAhead} ／ 主張と根拠の整合: {row.verification}
        </p>
      </section>


      <AnswerTwoModelComparison current={row} reportBase={context.reportBase} observationDate={observationDate} />

      <AnswerDetailAdvancedPanels
        reportBase={context.reportBase}
        answer={row}
        promptContext={prompt}
        citationUrls={citationUrls}
      />
    </DashboardFrame>
  );
}

const citationSectionIndexItems = [
  { id: "citation-overview", label: "全体" },
  { id: "citation-models", label: "モデル" },
  { id: "citation-domains", label: "ドメイン" },
  { id: "citation-pages", label: "URL" },
  { id: "citation-audience", label: "ペルソナ・トピック" },
  { id: "citation-dynamics", label: "変化" },
  { id: "citation-competition", label: "競合差" },
  { id: "citation-source-state", label: "状態" }
];

function CitationChapter({
  id,
  number,
  title,
  description,
  children
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const headingId = `${id}-heading`;
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const syncOpenState = () => {
      const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
      const chapter = document.getElementById(id);
      const containsHashTarget = Boolean(hashTarget && chapter?.contains(hashTarget));
      setIsOpen(desktop.matches || number === "01" || containsHashTarget);
      if (!desktop.matches && containsHashTarget) {
        window.requestAnimationFrame(() => hashTarget?.scrollIntoView({ block: "start" }));
      }
    };
    syncOpenState();
    desktop.addEventListener("change", syncOpenState);
    window.addEventListener("hashchange", syncOpenState);
    return () => {
      desktop.removeEventListener("change", syncOpenState);
      window.removeEventListener("hashchange", syncOpenState);
    };
  }, [id, number]);

  return (
    <details
      id={id}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group scroll-mt-32 border-t-2 border-[#0B382D] pt-5 sm:scroll-mt-[224px]"
      aria-labelledby={headingId}
    >
      <summary
        className="cursor-pointer list-none [&::-webkit-details-marker]:hidden sm:cursor-default"
        onClick={(event) => { if (window.matchMedia("(min-width: 640px)").matches) event.preventDefault(); }}
      >
        <header className="grid min-w-0 gap-2 sm:grid-cols-[84px_minmax(0,1fr)] sm:gap-x-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold tracking-[0.12em] text-[#075E44]">CHAPTER {number}</p>
            <ChevronDown className="h-4 w-4 text-[#075E44] transition group-open:rotate-180 sm:hidden" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={headingId} className="text-xl font-semibold leading-8 text-[#101828] sm:text-2xl">{title}</h2>
            <p className="mt-1 max-w-3xl text-[13px] font-medium leading-6 text-[#667085]">{description}</p>
          </div>
        </header>
      </summary>
      <div className="mt-5 space-y-6 lg:space-y-8">{children}</div>
    </details>
  );
}

function CitationsPage({ context }: { context: PageContext }) {
  const citationDetailScope = { modelNames: activeModels.map((model) => model.name) };
  return (
    <DashboardFrame
      context={context}
      eyebrow="引用・参照元"
      title="引用・参照元"
      description="AI回答で引用されたドメイン・ページ・引用元内訳・引用ギャップを確認します。"
      sectionIndexItems={citationSectionIndexItems}
      sectionIndexLabel="引用分析の項目"
      sectionIndexSticky
    >
      <CitationChapter
        id="citation-overview"
        number="01"
        title="引用の全体像"
        description="引用量、ブランド掲載との関係、モデル差、所有区分を同じ母集団で確認します。"
      >
      <DataRichKpiStrip layout="rows"
        columns="xl:grid-cols-3"
        items={[
          { label: "総引用数", value: "136件", helper: "AI回答で参照として出現", detail: buildCustomerPageKpiDetail("citation-total", context.reportBase, citationDetailScope) },
          { label: "公式サイト引用率", value: "31%", helper: "自社公式URLが引用された有効回答の割合", tone: "green", progress: 31, detail: buildCustomerPageKpiDetail("citation-owned", context.reportBase, citationDetailScope) },
          { label: "引用元ドメイン数", value: "28件", helper: "ユニークドメイン", detail: buildCustomerPageKpiDetail("citation-domains", context.reportBase, citationDetailScope) }
        ]}
      />
      <CitationAdvancedPanels reportBase={context.reportBase} models={activeModels.map((model) => model.name)} section="branch" />
      <div id="citation-models" className="scroll-mt-32 sm:scroll-mt-[224px]">
      <DataRichPanel title="モデル別引用比較" description="同じ期間の公式サイト引用率と引用元ドメイン数をAIモデルごとに比較します。" bodyClassName="p-0" variant="comparison">
        <ModelMetricComparisonTable
          detailType="citation-footprint"
          highlightedProvider={context.provider}
          primaryLabel="公式サイト引用率"
          secondaryLabel="引用元ドメイン"
          detailLabel="最多引用元区分"
          layout="compareRows"
          rows={activeModels.map((model, index) => ({
            model: model.name,
            primary: `${model.citationRate}%`,
            secondary: `${[18, 15, 23, 26][index]}件`,
            detail: ["自社公式", "比較メディア", "第三者調査", "自社公式"][index]
          }))}
        />
      </DataRichPanel>
      </div>
      <DataRichPanel title="引用元内訳" description="自社・競合・第三者系を7つの所有区分に分け、引用全体の構成を確認します。" variant="summary">
        <DataRichStackedBar segments={sourceBreakdown} />
        <p className="mt-3 text-[12px] font-semibold leading-5 text-[#475467]">第三者系 46%：第三者メディア 18%・レビューサイト 12%・SNS/コミュニティ 4%・公共機関・学術 7%・その他 5%</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {sourceBreakdown.map((segment, index) => (
            <ReportDetailButton
              key={segment.key}
              detail={{
                kicker: "引用元の所有区分",
                title: segment.label,
                value: `${segment.value}%`,
                summary: `${segment.label}が引用全体のどの部分を占め、どのモデル・質問群で使われたかを確認します。`,
                sections: [
                  { title: "この区分の構成", facts: [
                    { label: "構成比", value: `${segment.value}%` },
                    { label: "引用数", value: `${segment.citations}件` },
                    { label: "前期間差", value: `${index % 2 === 0 ? "+" : "-"}${index + 1}pt`, tone: index % 2 === 0 ? "green" : "amber" },
                    { label: "最多AIモデル", value: activeModels[index % activeModels.length].name }
                  ] },
                  { title: "多く使われた質問群", items: [
                    { title: ["導入・運用", "競合比較", "市場動向", "第三者評価", "評判・口コミ", "公共・学術", "その他"][index], meta: `${12 - index}回答`, description: ["自社の機能・運用条件", "競合の選定基準", "調査データと市場背景", "製品評価と比較", "利用者の反応", "公的調査・学術情報", "補足情報"][index] },
                    { title: "モデル差", meta: activeModels[index % activeModels.length].name, description: "同じ質問で他モデルが選んだ引用元と比較" }
                  ] },
                  { title: "上位URL", table: { columns: ["URL", "引用回答", "主な内容"], rows: [
                    [["recora.jp/products/ai-visibility-monitor", "trailbase.io/compare/geo-tools", "marketing-ai.jp/research/ai-search-2026", "saas-review.example/geo-tools", "community.example/ai-search", "go.jp/research/ai-utilization", "industry-report.example/ai-search"][index], `${9 - Math.min(index, 5)}回答`, ["製品定義", "選定基準", "市場調査", "第三者評価", "利用者反応", "公的調査", "補足資料"][index]]
                  ] } }
                ]
              }}
              className="w-full justify-between border border-[#DCE5E1] bg-white px-3 py-2 text-sm font-bold text-[#344054]"
            >
              <span>{segment.label}</span>
              <span className="tabular-nums text-[#075E44]">{segment.value}%</span>
            </ReportDetailButton>
          ))}
        </div>
      </DataRichPanel>
      </CitationChapter>

      <CitationChapter
        id="citation-sources"
        number="02"
        title="どの情報源が使われているか"
        description="ドメイン、URL、ペルソナ、トピックの順に、参照先の広がりと偏りを確認します。"
      >
      <div className="space-y-3">
        <div id="citation-domains" className="scroll-mt-32 sm:scroll-mt-[224px]">
        <DataRichPanel title="参照元ドメインランキング" description="引用された回答数の多い順に、上位20ドメインを比較します。引用回数は別列で確認できます。" bodyClassName="p-0" variant="evidence">
          <SourceDomainTable reportBase={context.reportBase} />
        </DataRichPanel>
        </div>
        <div id="citation-pages" className="scroll-mt-32 sm:scroll-mt-[224px]">
        <DataRichPanel title="参照元ページランキング" description="引用された回答数の多い順に、上位20ページを比較します。引用回数は別列で確認できます。" bodyClassName="p-0" variant="evidence">
          <SourcePageTable reportBase={context.reportBase} />
        </DataRichPanel>
        </div>
      </div>
      <div id="citation-audience" className="scroll-mt-32 sm:scroll-mt-[224px]">
      <CitationAdvancedPanels reportBase={context.reportBase} models={activeModels.map((model) => model.name)} section="audience" />
      </div>
      </CitationChapter>

      <CitationChapter
        id="citation-dynamics"
        number="03"
        title="何が変わり、どこに偏っているか"
        description="前期間からの獲得・消失、集中度、モデル間の一致、引用元の置き換わりを確認します。"
      >
        <CitationAdvancedPanels reportBase={context.reportBase} models={activeModels.map((model) => model.name)} section="dynamics" />
        <div id="citation-source-state" className="scroll-mt-32 sm:scroll-mt-[224px]">
          <CitationAdvancedPanels reportBase={context.reportBase} models={activeModels.map((model) => model.name)} section="state" />
        </div>
      </CitationChapter>

      <CitationChapter
        id="citation-competition"
        number="04"
        title="競合差と個別の深掘り"
        description="競合だけが得た引用を特定し、ドメイン・URL単位の詳細へ進みます。"
      >
      <div className="space-y-3">
        <DataRichPanel title="引用ギャップ" description="競合だけが引用されている質問・URLを、影響回答の多い上位20件で比較します。" bodyClassName="p-0" variant="evidence">
          <CitationGapTable rows={orderedActiveCitationGapRows.slice(0, 20)} />
          <div className="flex flex-col gap-3 border-t border-[#D8E1DD] bg-[#F8FAF9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-[12px] font-semibold leading-5 text-[#667085]">すべての質問・AIモデル・先行競合を同じ列で比較できます。</p>
            <DataRichPrimaryAction href={`${context.reportBase}/sources/gaps?return=${encodeURIComponent(`${context.reportBase}/sources#citation-competition`)}`}>
              競合との引用差をすべて見る
            </DataRichPrimaryAction>
          </div>
        </DataRichPanel>
      </div>
      <CitationAdvancedPanels reportBase={context.reportBase} models={activeModels.map((model) => model.name)} section="competition" />
      </CitationChapter>
    </DashboardFrame>
  );
}

function BrandQuestionSentimentBreakdown({ summary }: { summary: CustomerSentimentSummary }) {
  const brandedRates = sentimentPercentages(summary.branded);
  const brandedDistribution = [
    { label: "ポジティブ", value: brandedRates.positive, color: "#0B6B57", text: "text-[#075E44]" },
    { label: "中立", value: brandedRates.neutral, color: "#94A3B8", text: "text-[#475467]" },
    { label: "ネガティブ", value: brandedRates.negative, color: "#B65F4A", text: "text-[#A44838]" }
  ];
  const noMentionRate = 32;
  const [allPositive, allNeutral, allNegative] = allocateIntegerByWeights(
    100 - noMentionRate,
    [summary.all.positive, summary.all.neutral, summary.all.negative]
  );
  const allDistribution = [
    { label: "ポジティブ", value: allPositive, color: "#0B6B57" },
    { label: "中立", value: allNeutral, color: "#94A3B8" },
    { label: "ネガティブ", value: allNegative, color: "#B65F4A" },
    { label: "自社言及なし", value: noMentionRate, color: "#D9E1DE" }
  ];

  return (
    <DataRichPanel
      title="感情の全体像"
      description="ブランド質問を主表示し、全回答は自社言及なしを含む構成で確認します。"
      bodyClassName="p-0"
      variant="summary"
    >
      <div className="border-b border-[#DDE5E1] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#075E44]">BRANDED QUESTIONS</p>
            <p className="mt-1 text-[15px] font-bold text-[#10231E]">ブランド質問の感情</p>
          </div>
          <span className="rounded-full bg-[#EAF5F0] px-3 py-1 text-[11px] font-bold text-[#075E44]">主表示</span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-2xl sm:gap-6">
          {brandedDistribution.map((item) => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                <span className="truncate text-[11px] font-bold text-[#667085] sm:text-xs">{item.label}</span>
              </div>
              <strong className={cn("mt-1 block text-[26px] font-semibold tracking-[-0.03em] tabular-nums sm:text-[32px]", item.text)}>{item.value}%</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#EEF2F0]" aria-label="ブランド質問の感情構成">
          {brandedDistribution.map((item) => (
            <span key={item.label} className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
          ))}
        </div>

        <div className="mt-6 border-t border-[#E4EAE7] pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] font-bold text-[#344054]">全回答</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-[#667085]">
              {allDistribution.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  {item.label} <strong className="tabular-nums text-[#344054]">{item.value}%</strong>
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EEF2F0]" aria-label="全回答の感情と自社言及なしの構成">
            {allDistribution.map((item) => (
              <span key={item.label} className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>AIモデル</TableHead>
              <TableHead className="text-right">有効回答</TableHead>
              <TableHead className="text-right">ポジティブ</TableHead>
              <TableHead className="text-right">中立</TableHead>
              <TableHead className="text-right">ネガティブ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.byModel.map((row) => {
              const values = row.branded;
              const rates = sentimentPercentages(values);
              return (
                <TableRow key={row.modelName}>
                  <TableCell><ModelIdentity name={row.modelName} compact /></TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{values.valid.toLocaleString("ja-JP")}件</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-[#075E44]">
                    {rates.positive}% <span className="ml-1 text-[10px] text-[#667085]">({values.positive.toLocaleString("ja-JP")}件)</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {rates.neutral}% <span className="ml-1 text-[10px] text-[#667085]">({values.neutral.toLocaleString("ja-JP")}件)</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-[#A44838]">
                    {rates.negative}% <span className="ml-1 text-[10px] text-[#667085]">({values.negative.toLocaleString("ja-JP")}件)</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-[#DDE5E1] md:hidden">
        {summary.byModel.map((row) => {
          const values = row.branded;
          const rates = sentimentPercentages(values);
          return (
            <div key={row.modelName} className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <ModelIdentity name={row.modelName} compact />
                <span className="text-xs font-semibold tabular-nums text-[#667085]">{values.valid.toLocaleString("ja-JP")}件</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="rounded-lg bg-[#EDF7F3] px-2 py-2 text-center font-semibold text-[#075E44]">肯定 {rates.positive}%<small className="mt-1 block text-[9px] text-[#667085]">{values.positive.toLocaleString("ja-JP")}件</small></span>
                <span className="rounded-lg bg-[#F3F5F4] px-2 py-2 text-center font-semibold text-[#475467]">中立 {rates.neutral}%<small className="mt-1 block text-[9px] text-[#667085]">{values.neutral.toLocaleString("ja-JP")}件</small></span>
                <span className="rounded-lg bg-[#FFF2EE] px-2 py-2 text-center font-semibold text-[#A44838]">否定 {rates.negative}%<small className="mt-1 block text-[9px] text-[#667085]">{values.negative.toLocaleString("ja-JP")}件</small></span>
              </div>
            </div>
          );
        })}
      </div>
    </DataRichPanel>
  );
}
function BrandSentimentAxisPanel({
  axis,
  summary
}: {
  axis: "persona" | "topic";
  summary: CustomerSentimentSummary;
}) {
  const noun = axis === "persona" ? "ペルソナ" : "トピック";
  const brandedSummary: CustomerSentimentSummary = { ...summary, all: summary.branded };
  const rows = buildSentimentAxisRows(axis, brandedSummary);
  const detailFor = (row: (typeof rows)[number], rowIndex: number): ReportDetailPayload => ({
    kicker: (axis === "persona" ? "PERSONA" : "TOPIC") + " × SENTIMENT",
    title: row.label + "の感情構成",
    value: "ポジティブ " + row.positive + "%",
    summary: "ブランド質問の回答を" + noun + "別に分け、この" + noun + "でどう語られているかを確認します。",
    sections: [
      {
        title: "感情内訳",
        facts: [
          { label: "ポジティブ", value: row.positive + "%（" + row.positiveCount.toLocaleString("ja-JP") + "件）", tone: "green" },
          { label: "中立", value: row.neutral + "%（" + row.neutralCount.toLocaleString("ja-JP") + "件）" },
          { label: "ネガティブ", value: row.negative + "%（" + row.negativeCount.toLocaleString("ja-JP") + "件）", tone: "amber" },
          { label: "有効回答", value: row.observations.toLocaleString("ja-JP") + "件" }
        ]
      },
      {
        title: "全" + noun + "との比較",
        table: {
          columns: [noun, "ポジティブ", "中立", "ネガティブ"],
          rows: rows.map((item) => [item.label, item.positive + "%", item.neutral + "%", item.negative + "%"])
        }
      },
      axis === "persona"
        ? {
            title: "このペルソナで多い話題",
            items: [
              { title: ["競合比較", "導入・運用", "料金", "引用元", "ブランド印象", "製品概要"][rowIndex % 6], meta: Math.max(8, 28 - rowIndex * 3) + "回答", description: "ポジティブ・中立・ネガティブの構成差を回答単位で確認" },
              { title: ["料金", "第三者評価", "競合比較", "導入事例", "運用支援", "未分類"][rowIndex % 6], meta: Math.max(5, 19 - rowIndex * 2) + "回答", description: "同じ話題で他のペルソナと語られ方が違う箇所" }
            ]
          }
        : {
            title: "このトピックで感情差が大きいペルソナ",
            items: [
              { title: ["決裁者", "導入担当", "代理店担当", "編集担当", "決裁者", "未指定"][rowIndex % 6], meta: "ネガティブ +" + [4, 3, 5, 2, 4, 3][rowIndex % 6] + "pt", description: "全ペルソナ平均よりネガティブの比率が高い層" },
              { title: ["マーケ責任者", "編集担当", "導入担当", "代理店担当", "マーケ責任者", "導入担当"][rowIndex % 6], meta: "ポジティブ +" + [6, 4, 3, 5, 4, 5][rowIndex % 6] + "pt", description: "同じトピックでも肯定的に語られやすい層" }
            ]
          }
    ]
  });

  return (
    <DataRichPanel
      title={noun + "別感情"}
      description={"ブランド質問の回答を" + noun + "別に分け、各行を100%として感情構成を比較します。"}
      bodyClassName="p-0"
      variant="comparison"
    >
      <div className="divide-y divide-[#E5EAE8]">
        {rows.map((row, rowIndex) => (
          <ReportDetailButton
            key={row.label}
            detail={detailFor(row, rowIndex)}
            showIcon={false}
            label={row.label + "の感情構成を詳しく見る"}
            className="!block w-full rounded-none px-4 py-3 text-left hover:bg-[#F8FAF9] focus-visible:ring-inset focus-visible:ring-offset-0 sm:px-5"
          >
            <span className="grid min-w-0 gap-2 md:grid-cols-[160px_minmax(0,1fr)_220px] md:items-center md:gap-4">
              <span className="block text-[12px] font-bold text-[#344054]">{row.label}</span>
              <span className="flex h-3 min-w-0 overflow-hidden rounded-full bg-[#EEF1F0]" aria-label={row.label + "の感情構成"}>
                <span className="bg-[#15735C]" style={{ width: row.positive + "%" }} />
                <span className="bg-[#98A2B3]" style={{ width: row.neutral + "%" }} />
                <span className="bg-[#B65F4A]" style={{ width: row.negative + "%" }} />
              </span>
              <span className="flex flex-wrap justify-between gap-2 text-[10px] font-bold tabular-nums text-[#667085]">
                <span className="text-[#075E44]">ポジ {row.positive}%</span>
                <span>中立 {row.neutral}%</span>
                <span className="text-[#A44838]">ネガ {row.negative}%</span>
              </span>
            </span>
          </ReportDetailButton>
        ))}
      </div>
    </DataRichPanel>
  );
}
function BrandPerceptionPage({ context }: { context: PageContext }) {
  const sentimentSummary = buildSentimentSummary(activeModels.map((model) => model.name), "30日");
  const [sentimentTrendRange, setSentimentTrendRange] = useState<"7日" | "30日" | "90日">("30日");
  const [claimTrendRange, setClaimTrendRange] = useState<"7日" | "30日" | "90日">("30日");
  const sentimentTrendSummary = buildSentimentSummary(activeModels.map((model) => model.name), sentimentTrendRange);
  const sentimentSeries = buildSentimentTrend(sentimentTrendSummary.branded);
  const sentimentTrendLabels = sentimentTrendRange === "7日"
    ? ["6/30", "7/1", "7/2", "7/3", "7/4", "7/5", "7/6"]
    : sentimentTrendRange === "90日"
      ? ["4/8", "4/20", "5/2", "5/14", "5/26", "6/7", "6/19", "7/6"]
      : ["6/7", "6/11", "6/15", "6/19", "6/23", "6/27", "7/1", "7/6"];
  const claimTrendLabels = claimTrendRange === "7日"
    ? ["6/30", "7/1", "7/2", "7/3", "7/4", "7/5", "7/6"]
    : claimTrendRange === "90日"
      ? ["4/8", "4/20", "5/2", "5/14", "5/26", "6/7", "6/19", "7/6"]
      : ["6/7", "6/11", "6/15", "6/19", "6/23", "6/27", "7/1", "7/6"];
  const claimTrendSeries = claimTrendRange === "7日"
    ? [[4, 4, 5, 5, 6, 6, 6], [2, 2, 2, 3, 3, 3, 3], [1, 1, 1, 1, 2, 2, 2]]
    : claimTrendRange === "90日"
      ? [[2, 2, 3, 3, 4, 5, 5, 6], [1, 1, 2, 2, 2, 3, 3, 3], [0, 1, 1, 1, 1, 1, 2, 2]]
      : [[3, 3, 4, 4, 5, 5, 6, 6], [2, 2, 2, 2, 3, 3, 3, 3], [1, 1, 1, 1, 1, 2, 2, 2]];
  const narrativeGroups: Array<{ label: string; phrases: string[]; detail: ReportDetailPayload }> = [
    {
      label: "よく使われる表現",
      phrases: ["AI検索可視性", "競合比較", "引用元監査"],
      detail: {
        kicker: "BRAND LANGUAGE",
        title: "よく使われる表現",
        value: "AI検索可視性",
        summary: "ブランド質問の回答で繰り返される表現と、どの文脈で使われるかを確認します。",
        sections: [
          {
            title: "表現別の回答数",
            table: {
              columns: ["表現", "回答", "前期間差"],
              rows: [["AI検索可視性", "64件", "+9件"], ["競合比較", "52件", "+6件"], ["引用元監査", "47件", "+4件"]]
            }
          },
          {
            title: "多い条件",
            items: [
              { title: "マーケ責任者", meta: "28回答", description: "競合比較と引用元監査が同時に使われることが多い" },
              { title: "競合比較", meta: "24回答", description: "AI検索可視性と同じ回答で使われることが多いトピック" }
            ]
          }
        ]
      }
    },
    {
      label: "価値として語られる点",
      phrases: ["根拠確認", "レポート", "観測結果の整理"],
      detail: {
        kicker: "BRAND LANGUAGE",
        title: "価値として語られる点",
        value: "根拠確認",
        summary: "AIがRecoraの価値として語る表現と、その表現に伴う感情を確認します。",
        sections: [
          {
            title: "表現別の回答数と感情",
            table: {
              columns: ["表現", "回答", "ポジティブ"],
              rows: [["根拠確認", "58件", "72%"], ["レポート", "49件", "68%"], ["観測結果の整理", "42件", "65%"]]
            }
          },
          {
            title: "多い条件",
            items: [
              { title: "導入担当", meta: "26回答", description: "観測結果の整理が価値として語られやすい" },
              { title: "引用元", meta: "21回答", description: "根拠確認と同時に語られることが多いトピック" }
            ]
          }
        ]
      }
    },
    {
      label: "説明が薄い点",
      phrases: ["料金情報", "導入事例", "第三者評価"],
      detail: {
        kicker: "BRAND LANGUAGE",
        title: "説明が薄い点",
        value: "料金情報",
        summary: "ブランド質問の回答で触れられる割合が低い情報と、偏りが大きい条件を確認します。",
        sections: [
          {
            title: "言及がある回答",
            table: {
              columns: ["情報", "回答", "前期間差"],
              rows: [["料金情報", "18件", "-3件"], ["導入事例", "14件", "+1件"], ["第三者評価", "11件", "-2件"]]
            }
          },
          {
            title: "言及が少ない条件",
            items: [
              { title: "決裁者", meta: "料金情報 4回答", description: "他のペルソナより料金情報への言及が少ない" },
              { title: "ブランド印象", meta: "第三者評価 3回答", description: "第三者評価と同時に語られる回答が少ないトピック" }
            ]
          }
        ]
      }
    }
  ];
  return (
    <DashboardFrame
      context={context}
      eyebrow="ブランド認識・感情"
      title="ブランド認識・感情"
      description="単なる感情分析ではなく、AI上のブランド認識監査ページとして扱います。"
    >
      <BrandQuestionSentimentBreakdown summary={sentimentSummary} />
      <BrandSentimentAxisPanel axis="persona" summary={sentimentSummary} />
      <BrandSentimentAxisPanel axis="topic" summary={sentimentSummary} />
      <div className="space-y-3">
        <DataRichPanel
          title="ブランドの語られ方"
          description="AI回答で使われる言葉を、頻出・価値・説明が薄い情報に分けて比較します。"
          bodyClassName="p-0"
          variant="comparison"
        >
          <div className="divide-y divide-[#E5EAE8]">
            {narrativeGroups.map((group) => {
              const isThin = group.label === "説明が薄い点";
              return (
                <ReportDetailButton
                  key={group.label}
                  detail={group.detail}
                  label={group.label + "を詳しく見る"}
                  className="!flex w-full items-center justify-between rounded-none px-5 py-4 hover:bg-[#F8FAF9] focus-visible:ring-inset focus-visible:ring-offset-0 sm:px-6"
                >
                  <span className="grid min-w-0 flex-1 gap-2.5 text-left sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-5">
                    <span className={cn("text-[12px] font-bold", isThin ? "text-[#A44838]" : "text-[#344054]")}>{group.label}</span>
                    <span className="flex min-w-0 flex-wrap gap-2">
                      {group.phrases.map((phrase) => (
                        <span
                          key={phrase}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                            isThin ? "border-[#E7C8C0] bg-[#FFF8F5] text-[#8A3E31]" : "border-[#D7E4DE] bg-[#F7FAF8] text-[#225B4D]"
                          )}
                        >
                          {phrase}
                        </span>
                      ))}
                    </span>
                  </span>
                </ReportDetailButton>
              );
            })}
          </div>
        </DataRichPanel>
      </div>
      <div className="space-y-3">
        <DataRichPanel title="注意書き・誤認・リスク" description="重大度・種類・継続日数・該当回答を比較し、主張ごとの分析へ直接進みます。" bodyClassName="p-0">
          <ClaimRiskTable reportBase={context.reportBase} />
        <DataRichPanel title="主張推移" description="注意書き・誤認として継続して現れた主張の回答数を、主張ごとに比較します。">
          <div className="mb-4 flex justify-end">
            {(["7日", "30日", "90日"] as const).map((range) => <button key={range} type="button" aria-pressed={claimTrendRange === range} onClick={() => setClaimTrendRange(range)} className={cn("min-h-9 border-y border-r px-3 text-[11px] font-bold first:rounded-l-md first:border-l last:rounded-r-md", claimTrendRange === range ? "border-[#0B382D] bg-[#0B382D] text-white" : "border-[#C7D2CC] bg-white text-[#667085] hover:bg-[#F1F8F5]")}>{range}</button>)}
          </div>
          <MetricLineChart
            labels={claimTrendLabels}
            unit="回答"
            deltaUnit="回答"
            observations={claimTrendRange + "のブランド質問"}
            detailType="claim"
            series={[
              { name: "料金説明が古い", values: claimTrendSeries[0], color: "#B54708" },
              { name: "対応範囲が曖昧", values: claimTrendSeries[1], color: "#667085" },
              { name: "導入期間の誤認", values: claimTrendSeries[2], color: "#075E44" }
            ]}
          />
        </DataRichPanel>
        </DataRichPanel>
        <DataRichPanel title="感情推移" description={sentimentTrendRange + "のブランド質問の有効回答" + sentimentTrendSummary.branded.valid.toLocaleString("ja-JP") + "件を母集団にした、ポジティブ / 中立 / ネガティブの日次推移。"}>
          <div className="mb-4 flex justify-end">
            {(["7日", "30日", "90日"] as const).map((range) => <button key={range} type="button" aria-pressed={sentimentTrendRange === range} onClick={() => setSentimentTrendRange(range)} className={cn("min-h-9 border-y border-r px-3 text-[11px] font-bold first:rounded-l-md first:border-l last:rounded-r-md", sentimentTrendRange === range ? "border-[#0B382D] bg-[#0B382D] text-white" : "border-[#C7D2CC] bg-white text-[#667085] hover:bg-[#F1F8F5]")}>{range}</button>)}
          </div>
          <MetricLineChart
            labels={sentimentTrendLabels}
            unit="%"
            deltaUnit="pt"
            observations={sentimentTrendRange + "のブランド質問の有効回答 " + sentimentTrendSummary.branded.valid.toLocaleString("ja-JP") + "件"}
            detailType="sentiment"
            series={[
              { name: "ポジティブ", values: sentimentSeries.positive, color: "#075E44" },
              { name: "中立", values: sentimentSeries.neutral, color: "#667085" },
              { name: "ネガティブ", values: sentimentSeries.negative, color: "#B54708" }
            ]}
          />
        </DataRichPanel>
      </div>
    </DashboardFrame>
  );
}

function RecommendationsPage({ context }: { context: PageContext }) {
  const highPriorityCount = improvementRows.filter((row) => row.priority === "高").length;
  const existingPageCount = improvementRows.filter((row) => row.category === "既存ページ改善").length;
  const newPageCount = improvementRows.filter((row) => row.category === "新規ページ作成").length;

  return (
    <DashboardFrame
      context={context}
      eyebrow="改善提案・施策"
      title="改善提案・施策"
      description="契約プランに改善提案が含まれる場合だけ、観測根拠に基づく候補をこのページ内で確認します。"
      activeNote="契約プランの対象機能・公開中の提案のみを表示"
      sectionIndexSticky
    >
      <DataRichKpiStrip layout="rows"
        columns="xl:grid-cols-4"
        items={[
          { label: "改善アクション数", value: `${improvementRows.length}件`, helper: "公開中の候補", detail: buildCustomerPageKpiDetail("recommendation-total", context.reportBase) },
          { label: "高優先度アクション数", value: `${highPriorityCount}件`, helper: "優先度 高", tone: "amber", detail: buildCustomerPageKpiDetail("recommendation-priority", context.reportBase) },
          { label: "ページ改善提案数", value: `${existingPageCount}件`, helper: "既存ページ改善", detail: buildCustomerPageKpiDetail("recommendation-existing", context.reportBase) },
          { label: "新規ページ提案数", value: `${newPageCount}件`, helper: "新規ページ作成", detail: buildCustomerPageKpiDetail("recommendation-new", context.reportBase) }
        ]}
      />
      <DataRichPanel id="recommendation-actions" title="改善アクション一覧" description="優先度、改善アクション、対象、対象指標、観測根拠、影響範囲を表示します。" bodyClassName="p-0">
        <ImprovementTable reportBase={context.reportBase} />
      </DataRichPanel>
      <DataRichPanel title="AIモデル別の候補根拠" description="各AIモデルで、改善候補の根拠になった固定質問数と引用ギャップ観測数を比較します。同じ候補が複数モデルに現れるため、各行の合計は改善アクション数とは一致しません。" bodyClassName="p-0">
        <ModelMetricComparisonTable
          detailType="recommendation-evidence"
          highlightedProvider={context.provider}
          primaryLabel="根拠になった質問"
          secondaryLabel="引用ギャップ観測"
          detailLabel="根拠が集中する領域"
          layout="compareRows"
          showValueBars
          rows={activeModels.map((model, index) => ({
            model: model.name,
            primary: `${[7, 11, 6, 5][index]}件`,
            secondary: `${[4, 6, 3, 2][index]}件`,
            detail: ["比較軸", "自社説明", "第三者根拠", "料金・比較"][index]
          }))}
        />
      </DataRichPanel>
      <div className="space-y-3">
        <DataRichPanel id="content-gaps" title="コンテンツギャップ" description="質問需要に対して、自社の情報・根拠・受け皿が不足している領域を、観測範囲と現在のページ状態で比較します。" bodyClassName="p-0">
          <ContentGapAnalysis reportBase={context.reportBase} />
        </DataRichPanel>
        <DataRichPanel id="page-improvement-proposals" title="ページ別改善提案" description="同じページを対象にする改善候補をまとめ、ページ単位で施策数・優先度・観測根拠を比較します。" bodyClassName="p-0">
          <PageImprovementPortfolio reportBase={context.reportBase} />
        </DataRichPanel>
        <DataRichPanel id="trust-evidence-actions" title="信頼材料・引用獲得施策" description="上のコンテンツギャップと同じ観測を、AI回答に必要な信頼材料・現在の状態・実施経路の観点で組み替えます。詳細では関係者区分と必要な材料まで確認できます。" bodyClassName="p-0">
          <TrustEvidenceActionPortfolio reportBase={context.reportBase} />
        </DataRichPanel>
      </div>
      <RecommendationAdvancedPanels reportBase={context.reportBase} models={activeModels.map((model) => model.name)} />
      <DataRichPanel id="published-recommendation-changes" title="提案公開後に観測された変化" description="改善の因果を断定せず、公開前7日と公開後7日・14日・30日の観測値を並べます。" bodyClassName="p-0">
        <PublishedRecommendationChangeTable reportBase={context.reportBase} />
      </DataRichPanel>
    </DashboardFrame>
  );
}

function SettingsPage({ context }: { context: PageContext }) {
  return (
    <DashboardFrame
      context={context}
      eyebrow="設定・連携"
      title="設定・連携"
      description="顧客が確認・出力・プラン確認・ガイド閲覧・問い合わせを行う画面です。"
      scopeMode="none"
    >
      <div className="space-y-3">
        <DataRichPanel title="プロジェクト・ブランド" description="現在の計測対象と、自社として照合する正式情報を確認します。">
          <FieldGrid
            rows={[
              ["プロジェクト名", context.projectName],
              ["自社正式名", "Recora"],
              ["略称・別名", "レコラ / Recora AI Visibility"],
              ["製品名・旧称", "Recora Customer Report / 旧称なし"],
              ["公式ドメイン", "recora.jp"],
              ["地域・言語", "日本 / 日本語"],
              ["計測タイムゾーン", "Asia/Tokyo（JST）"],
              ["実行頻度", "毎日1回"]
            ]}
          />
        </DataRichPanel>
        <DataRichPanel title="対象AIサービス" description="契約プランの上限内で計測するサービスと、変更申請の状態を確認します。">
          <FieldGrid rows={[
            ["現在の対象", activeModels.map((model) => model.name).join(" / ")],
            ["契約上限", "最大4サービス"],
            ["変更の反映", "管理者承認後、翌日の日次計測から"],
            ["顧客に表示する状態", "承認待ちのみ"],
            ["現在の申請", "申請なし"]
          ]} />
          <div className="mt-4 border-t border-[#E5EAE8] pt-4">
            <ReportDetailButton detail={{
              kicker: "SERVICE CHANGE",
              title: "対象AIサービスの変更申請",
              summary: "現在の対象、契約上限、承認後の反映タイミングを確認してから申請内容を作成します。",
              sections: [
                { title: "現在の契約条件", facts: [{ label: "現在の対象", value: activeModels.map((model) => model.name).join(" / ") }, { label: "契約上限", value: "最大4サービス" }, { label: "現在の申請", value: "申請なし" }] },
                { title: "申請後の流れ", items: [{ title: "1. 顧客が変更を申請", meta: "この画面から対象候補を提出" }, { title: "2. 管理者が承認", meta: "承認待ちの間だけ状態を表示" }, { title: "3. 日次計測へ反映", meta: "承認後、翌日の計測から" }] }
              ]
            }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#9AB8AA] bg-white px-4 text-sm font-bold text-[#075E44] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              変更申請の内容を確認
            </ReportDetailButton>
          </div>
        </DataRichPanel>
        <DataRichPanel title="正解情報マスター" description="AI回答の主張と照合する、顧客が登録した公式事実を確認します。">
          <FieldGrid rows={[
            ["登録済み", "24件"],
            ["最終更新", "2026/07/04 15:20"],
            ["確認対象", "料金 / 機能 / 導入期間 / 提供条件"],
            ["照合状態", "有効"]
          ]} />
          <div className="mt-4 border-t border-[#E5EAE8] pt-4">
            <ReportDetailButton detail={{
              kicker: "OFFICIAL FACTS",
              title: "正解情報マスター",
              value: "24件登録済み",
              summary: "AI回答と照合する公式事実を、情報種別と更新状態に分けて確認します。",
              sections: [
                { title: "登録状況", facts: [{ label: "登録済み", value: "24件" }, { label: "最終更新", value: "2026/07/04 15:20" }, { label: "照合状態", value: "有効", tone: "green" }] },
                { title: "情報種別", table: { columns: ["種別", "登録件数", "最終確認"], rows: [["料金", "6件", "2026/07/04"], ["機能", "9件", "2026/07/04"], ["導入期間", "4件", "2026/07/03"], ["提供条件", "5件", "2026/07/02"]] } }
              ]
            }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#9AB8AA] bg-white px-4 text-sm font-bold text-[#075E44] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              登録内容を確認
            </ReportDetailButton>
          </div>
        </DataRichPanel>
        <DataRichPanel title="計測・取得状況" description="日次計測と、自社サイトへのAIクローラー到達・実訪問を分けて表示します。">
          <FieldGrid rows={[
            ["AIサービス取得状況", `正常 ${activeModels.length} / 欠測 0`],
            ["最終日次計測", "2026/07/06 06:00 完了"],
            ["AIクローラー到達性", "確認済み"],
            ["AIクローラー実訪問", "直近30日で検出あり"],
            ["次回計測", "2026/07/07 06:00"]
          ]} />
        </DataRichPanel>
        <DataRichPanel title="アクセス解析連携" description="引用後の実訪問とサイト上の行動を確認するための連携状態です。">
          <FieldGrid rows={[
            ["GA4", "連携済み"],
            ["対象プロパティ", "Recora Web"],
            ["最終同期", "2026/07/06 07:10"],
            ["参照元の突合", "有効"]
          ]} />
          <div className="mt-4 border-t border-[#E5EAE8] pt-4">
            <ReportDetailButton detail={{
              kicker: "ANALYTICS CONNECTION",
              title: "GA4連携状態",
              value: "連携済み",
              summary: "接続中のプロパティ、同期時刻、参照元の突合状態を確認します。",
              sections: [
                { title: "現在の接続", facts: [{ label: "対象プロパティ", value: "Recora Web" }, { label: "最終同期", value: "2026/07/06 07:10" }, { label: "参照元の突合", value: "有効", tone: "green" }] },
                { title: "連携で確認する内容", items: [{ title: "AI引用後の実訪問", meta: "参照元とランディングページ" }, { title: "サイト上の行動", meta: "主要な閲覧・遷移" }] }
              ]
            }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#9AB8AA] bg-white px-4 text-sm font-bold text-[#075E44] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              GA4連携を確認
            </ReportDetailButton>
          </div>
        </DataRichPanel>
        <DataRichPanel title="レポート出力・保存" description="PDF・CSVの出力と、過去に保存したレポートを確認します。">
          <SimpleList items={["PDF出力: 最新の顧客レポート", "CSV出力: 各一覧の表示項目", "保存済みレポート: 直近5件", "初期表示: 直近7日 / 履歴は全保持"]} />
        </DataRichPanel>
        <DataRichPanel title="プラン・アップグレード" description="現在のプランと利用上限を確認します。">
          <FieldGrid rows={[
            ["現在のプラン", dashboardScope.plan],
            ["質問上限", "プロンプト200件まで"],
            ["対象AIサービス上限", "最大4サービス"],
            ["レポート履歴", "全期間を保持"],
            ["契約相談", "問い合わせフォームから"]
          ]} />
        </DataRichPanel>
        <DataRichPanel title="ガイド・サポート" description="使い方、指標の定義、FAQ、問い合わせをまとめています。">
          <SimpleList items={["レコラの使い方", "指標の意味", "画面の見方", "FAQ", "サポートへ問い合わせ"]} />
          <div className="mt-4 border-t border-[#E5EAE8] pt-4">
            <ReportDetailButton detail={{
              kicker: "SUPPORT",
              title: "サポートへの問い合わせ",
              summary: "問い合わせはメールで受け付けます。送信前に、対象プロジェクトと確認したい画面を整理します。",
              sections: [{ title: "問い合わせに含める内容", items: [{ title: "対象プロジェクト", meta: context.projectName }, { title: "確認したい画面・指標", meta: "ページ名と表示値" }, { title: "希望する回答", meta: "使い方 / 指標定義 / 計測状態" }] }]
            }} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#0B382D] px-4 text-sm font-bold text-white hover:bg-[#075E44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
              問い合わせ方法を確認
            </ReportDetailButton>
          </div>
        </DataRichPanel>
      </div>
    </DashboardFrame>
  );
}

const identityMarks: Record<string, { mark: string; surface: string; text: string }> = {
  Recora: { mark: "R", surface: "bg-[#0B382D]", text: "text-white" },
  Trailbase: { mark: "T", surface: "bg-[#344054]", text: "text-white" },
  SignalNest: { mark: "S", surface: "bg-[#EEF1F0]", text: "text-[#475467]" },
  MentionMap: { mark: "M", surface: "bg-[#F2F4F3]", text: "text-[#5D6B66]" },
  RankLens: { mark: "R", surface: "bg-[#E6EAE8]", text: "text-[#344054]" },
  GPT: { mark: "◎", surface: "bg-[#E8F3EE]", text: "text-[#075E44]" },
  Gemini: { mark: "✦", surface: "bg-[#EEF2FF]", text: "text-[#3451B2]" },
  Perplexity: { mark: "P", surface: "bg-[#E6F7F7]", text: "text-[#0F6B6D]" },
  "Google AI Mode": { mark: "G", surface: "bg-[#F7F8FA]", text: "text-[#375A8C]" }
};

function brandBarClass(name: string) {
  if (name === "Recora") return "bg-[#0B6B57]";
  if (name === "Trailbase") return "bg-[#344054]";
  if (name === "SignalNest") return "bg-[#98A2B3]";
  return "bg-[#C7CECA]";
}

function EntityIdentity({
  name,
  logoUrl,
  kind = "brand",
  compact = false,
  iconOnly = false
}: {
  name: string;
  logoUrl?: string | null;
  kind?: "brand" | "model";
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const imageFailed = Boolean(logoUrl && failedLogoUrl === logoUrl);
  const identity = identityMarks[name] ?? {
    mark: name.trim().slice(0, 1).toUpperCase() || "?",
    surface: "bg-[#F2F4F7]",
    text: "text-[#475467]"
  };
  const sizeClass = compact ? "h-7 w-7 rounded-md text-[11px]" : "h-8 w-8 rounded-lg text-[12px]";

  return (
    <span className="inline-flex min-w-0 items-center gap-2.5" title={iconOnly ? name : undefined}>
      <span
        className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border border-black/5 font-bold shadow-[0_1px_2px_rgba(16,24,40,0.08)]", sizeClass, identity.surface, identity.text)}
        aria-label={`${name}の${kind === "model" ? "AIモデル" : "ブランド"}ロゴ`}
      >
        {logoUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" onError={() => setFailedLogoUrl(logoUrl)} />
        ) : (
          <span aria-hidden="true">{identity.mark}</span>
        )}
      </span>
      <span className={cn("min-w-0 break-words font-bold leading-5 text-[#0F172A] [word-break:normal]", iconOnly && "sr-only")}>{name}</span>
    </span>
  );
}

function ModelIdentity({ name, compact = false, iconOnly = false }: { name: string; compact?: boolean; iconOnly?: boolean }) {
  const model = activeModels.find((item) => item.name === name);
  return <EntityIdentity name={name} logoUrl={model?.logoUrl} kind="model" compact={compact} iconOnly={iconOnly} />;
}

function brandRankingDetail(row: (typeof competitors)[number], reportBase: string): ReportDetailPayload {
  const leader = competitors.find((item) => item.rank === 1) ?? competitors[1];
  const self = competitors[0];
  const comparisonBase = row.isPrimary ? leader : self;
  const aiGap = row.aiPresence - comparisonBase.aiPresence;
  const sovGap = row.sov - comparisonBase.sov;
  return {
    kicker: row.isPrimary ? "OWN BRAND" : "BRAND DETAIL",
    title: row.name,
    value: `AI表示率 ${row.aiPresence}%`,
    summary: row.isPrimary
      ? `市場内${row.rank}位。首位${leader.name}との差を、モデル・ペルソナ・トピックへ分解します。`
      : `Recoraとの差をその場で確認し、全質問の比較が必要な場合だけ競合分析へ進みます。`,
    sections: [
      {
        title: "現在の位置",
        facts: [
          { label: "ランキング", value: `${row.rank}位` },
          { label: "AI表示率", value: `${row.aiPresence}%` },
          { label: "AI内シェア", value: `${row.sov}%` },
          { label: "平均掲載位置", value: `${row.averagePosition}位` },
          { label: "公式サイト引用率", value: `${row.citationRate}%` },
          { label: "前日比", value: formatPt(row.delta), tone: row.delta < 0 ? "red" : "green" }
        ]
      },
      {
        title: `${comparisonBase.name}との比較`,
        facts: [
          { label: "AI表示率差", value: `${aiGap > 0 ? "+" : ""}${aiGap}pt`, tone: aiGap < 0 ? "amber" : "green" },
          { label: "AI内シェア差", value: `${sovGap > 0 ? "+" : ""}${sovGap}pt`, tone: sovGap < 0 ? "amber" : "green" },
          { label: "掲載位置差", value: `${(row.averagePosition - comparisonBase.averagePosition).toFixed(1)}位` }
        ]
      },
      {
        title: "AIモデル別",
        table: {
          columns: ["AIモデル", "AI表示率", "AI内シェア", "平均掲載位置"],
          rows: activeModels.map((model, index) => [
            model.name,
            `${Math.max(0, Math.min(100, row.aiPresence + [5, -3, 2, 7][index]))}%`,
            `${Math.max(0, Math.min(100, row.sov + [3, -2, 1, 4][index]))}%`,
            `${Math.max(1, row.averagePosition + [0, 0.4, 0.2, -0.3][index]).toFixed(1)}位`
          ])
        }
      },
      {
        title: "差が大きいトピック",
        table: {
          columns: ["トピック", `${row.name}のAI表示率`, "Recora", "差"],
          rows: [
            ["競合比較", `${Math.min(92, row.aiPresence + 4)}%`, "57%", `${row.aiPresence + 4 - 57 > 0 ? "+" : ""}${row.aiPresence + 4 - 57}pt`],
            ["料金", `${Math.max(18, row.aiPresence - 7)}%`, "52%", `${row.aiPresence - 7 - 52 > 0 ? "+" : ""}${row.aiPresence - 7 - 52}pt`],
            ["第三者評価", `${Math.min(88, row.aiPresence + 2)}%`, "43%", `${row.aiPresence + 2 - 43 > 0 ? "+" : ""}${row.aiPresence + 2 - 43}pt`]
          ]
        }
      },
      {
        title: "ペルソナごとの強弱",
        items: [
          { title: "マーケ責任者", meta: row.aiPresence >= 60 ? "自社より先行" : "自社と接戦", description: "比較検討と導入効果の質問" },
          { title: "決裁者", meta: row.citationRate >= 30 ? "引用を伴う掲載が多い" : "掲載はあるが引用が弱い", description: "料金・契約・信頼材料の質問" },
          { title: "導入担当", meta: row.averagePosition <= 2.5 ? "上位掲載が多い" : "2〜3位が中心", description: "導入・運用の質問" }
        ]
      }
    ],
    detailHref: row.isPrimary ? undefined : `${reportBase}/leaderboard/${row.id}`,
    detailLabel: row.isPrimary ? undefined : `${row.name}との全比較を確認`
  };
}

type BrandComparisonMetricKind = "aiPresence" | "sov" | "averagePosition" | "citationRate";

function buildBrandComparisonMetricDetail({
  brand,
  metric,
  reportBase,
  returnHref
}: {
  brand: (typeof competitors)[number];
  metric: BrandComparisonMetricKind;
  reportBase: string;
  returnHref: string;
}): ReportDetailPayload {
  const self = competitors[0];
  const definitions: Record<BrandComparisonMetricKind, { label: string; value: number; selfValue: number; suffix: string; lowerIsBetter?: boolean }> = {
    aiPresence: { label: "AI表示率", value: brand.aiPresence, selfValue: self.aiPresence, suffix: "%" },
    sov: { label: "AI内シェア", value: brand.sov, selfValue: self.sov, suffix: "%" },
    averagePosition: { label: "平均掲載位置", value: brand.averagePosition, selfValue: self.averagePosition, suffix: "位", lowerIsBetter: true },
    citationRate: { label: "公式サイト引用率", value: brand.citationRate, selfValue: self.citationRate, suffix: "%" }
  };
  const definition = definitions[metric];
  const decimals = metric === "averagePosition" ? 1 : 0;
  const gap = definition.value - definition.selfValue;
  const formattedValue = definition.value.toFixed(decimals);
  const formattedGap = `${gap > 0 ? "+" : ""}${gap.toFixed(decimals)}${metric === "averagePosition" ? "位" : "pt"}`;
  const modelOffsets = [4, -3, 1, 6];
  const modelRows = activeModels.map((model, index) => {
    const brandValue = metric === "averagePosition"
      ? Math.max(1, brand.averagePosition + [0, 0.4, 0.2, -0.3][index])
      : Math.max(0, Math.min(100, definition.value + modelOffsets[index]));
    const selfValue = metric === "averagePosition"
      ? Math.max(1, self.averagePosition + [0, 0.4, 0.2, -0.3][index])
      : Math.max(0, Math.min(100, definition.selfValue + modelOffsets[index]));
    const modelGap = brandValue - selfValue;
    return [
      model.name,
      `${brandValue.toFixed(decimals)}${definition.suffix}`,
      `${selfValue.toFixed(decimals)}${definition.suffix}`,
      `${modelGap > 0 ? "+" : ""}${modelGap.toFixed(decimals)}${metric === "averagePosition" ? "位" : "pt"}`
    ];
  });
  const commonSections: ReportDetailPayload["sections"] = [
    {
      title: "自社との現在差",
      facts: [
        { label: brand.name, value: `${formattedValue}${definition.suffix}` },
        { label: "Recora", value: `${definition.selfValue.toFixed(decimals)}${definition.suffix}` },
        { label: "差", value: formattedGap, tone: (definition.lowerIsBetter ? gap > 0 : gap < 0) ? "amber" : "green" }
      ]
    },
    {
      title: "AIモデル別",
      table: { columns: ["AIモデル", brand.name, "Recora", "差"], rows: modelRows }
    }
  ];

  if (metric === "aiPresence") {
    commonSections.push(
      { title: "差が大きい質問群", table: { columns: ["質問群", brand.name, "Recora", "差"], rows: [["競合比較", `${Math.min(94, brand.aiPresence + 5)}%`, "57%", `${brand.aiPresence + 5 - 57 > 0 ? "+" : ""}${brand.aiPresence + 5 - 57}pt`], ["料金", `${Math.max(14, brand.aiPresence - 8)}%`, "52%", `${brand.aiPresence - 8 - 52 > 0 ? "+" : ""}${brand.aiPresence - 8 - 52}pt`], ["第三者評価", `${Math.min(91, brand.aiPresence + 2)}%`, "43%", `${brand.aiPresence + 2 - 43 > 0 ? "+" : ""}${brand.aiPresence + 2 - 43}pt`]] } },
      { title: "集計条件", facts: [{ label: "分母", value: "同じNon-brand有効回答" }, { label: "欠測", value: "分母から除外" }, { label: "未掲載", value: "有効回答として分母に含む" }] }
    );
  } else if (metric === "sov") {
    commonSections.push(
      { title: "存在感を構成する掲載", table: { columns: ["状態", brand.name, "Recora"], rows: [["第一推薦", `${Math.max(7, brand.sov - 3)}%`, "21%"], ["比較候補", `${Math.min(48, brand.sov + 8)}%`, "32%"], ["単純言及", `${Math.max(4, brand.sov - 8)}%`, "18%"]] } },
      { title: "集計条件", facts: [{ label: "分母", value: "同じ観測群に出た比較対象ブランドの掲載回数" }, { label: "回答文の長さ", value: "算出に使用しない" }, { label: "ブランド掲載", value: "正規化したブランド単位で1回" }] }
    );
  } else if (metric === "averagePosition") {
    commonSections.push(
      { title: "掲載位置の分布", table: { columns: ["掲載位置", brand.name, "Recora"], rows: [["1位", "38回答", "29回答"], ["2位", "31回答", "34回答"], ["3位以下", "22回答", "28回答"], ["未掲載", "37回答", "55回答"]] } },
      { title: "集計条件", facts: [{ label: "対象", value: "順位を判定できた掲載回答のみ" }, { label: "未掲載", value: "平均値から除外し、分布には別表示" }, { label: "読み方", value: "数値が小さいほど上位" }] }
    );
  } else {
    commonSections.push(
      { title: "引用元の内訳", table: { columns: ["引用元区分", brand.name, "Recora"], rows: [["公式サイト", `${brand.citationRate}%`, "31%"], ["第三者メディア", "28%", "24%"], ["レビュー・比較", "17%", "11%"], ["引用なし", `${Math.max(0, 100 - brand.citationRate - 31)}%`, "34%"]] } },
      { title: "集計条件", facts: [{ label: "分母", value: "有効回答" }, { label: "対象URL", value: `${brand.name}の公式ドメイン` }, { label: "ブランド掲載", value: "引用判定とは別集計" }] }
    );
  }

  return {
    kicker: "COMPETITOR METRIC",
    title: `${brand.name}の${definition.label}`,
    value: `${formattedValue}${definition.suffix}`,
    summary: `${brand.name}の${definition.label}を、Recoraとの差・AIモデル・この指標固有の内訳に分けて確認します。`,
    sections: commonSections,
    detailHref: brand.isPrimary ? undefined : `${reportBase}/leaderboard/${brand.id}?return=${encodeURIComponent(returnHref)}`,
    detailLabel: brand.isPrimary ? undefined : `${brand.name}の全分析を確認`
  };
}

function BrandComparisonMetric({
  value,
  selfValue,
  unit,
  lowerIsBetter = false,
  decimals = 0,
  detail
}: {
  value: number;
  selfValue: number;
  unit: "%" | "pt" | "位";
  lowerIsBetter?: boolean;
  decimals?: number;
  detail?: ReportDetailPayload;
}) {
  const gap = value - selfValue;
  const isSelf = Math.abs(gap) < 0.001;
  const competitorAhead = lowerIsBetter ? gap < 0 : gap > 0;
  const displayValue = decimals > 0 ? value.toFixed(decimals) : String(value);
  const displayGap = decimals > 0 ? Math.abs(gap).toFixed(decimals) : String(Math.abs(gap));

  const content = (
    <span className="block min-w-0">
      <span className="block text-[16px] font-semibold tabular-nums text-[#101828]">{displayValue}{unit === "pt" ? "%" : unit}</span>
      <span className={cn(
        "mt-0.5 block text-[10px] font-bold tabular-nums",
        isSelf ? "text-[#667085]" : competitorAhead ? "text-[#A15C00]" : "text-[#067647]"
      )}>
        {isSelf ? "自社基準" : `自社比 ${gap > 0 ? "+" : "-"}${displayGap}${unit}`}
      </span>
    </span>
  );

  return detail ? (
    <ReportDetailButton detail={detail} className="w-full justify-start rounded-sm px-1 py-1 text-left hover:bg-[#F1F8F5]">
      {content}
    </ReportDetailButton>
  ) : content;
}

function BrandMarketLauncher({ reportBase, returnHref }: { reportBase: string; returnHref: string }) {
  const marketParams = new URLSearchParams();
  marketParams.set("return", returnHref);
  const marketHref = `${reportBase}/leaderboard/market?${marketParams.toString()}`;

  return (
    <DataRichPanel
      title="市場全体の位置を確認"
      description="ここでは自社と上位競合を要約し、20ブランドの分布・ランキング・AI内シェア（SOV）・置換分析は市場構造分析で確認します。"
      bodyClassName="p-0"
    >
      <div className="grid gap-px border-b border-[#DDE5E1] bg-[#DDE5E1] sm:grid-cols-3">
        {[
          { label: "観測ブランド", value: `${competitors.length}社`, note: "省略せず市場構造分析に表示" },
          { label: "自社順位", value: `${competitors[0].rank}位`, note: `首位まで ${competitors[1].aiPresence - competitors[0].aiPresence}pt` },
          { label: "上位の集中", value: `${competitors.slice(0, 3).reduce((sum, brand) => sum + brand.sov, 0)}%`, note: "上位3ブランドのAI内シェア合計" }
        ].map((item) => <div key={item.label} className="bg-[#F8FAF9] px-4 py-3 sm:px-5"><p className="text-[10px] font-bold text-[#667085]">{item.label}</p><p className="mt-1 text-[20px] font-bold tabular-nums text-[#101828]">{item.value}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-[#667085]">{item.note}</p></div>)}
      </div>
      <BrandRankingTable rows={competitors.slice(0, 5)} reportBase={reportBase} compact />
      <div className="flex justify-end border-t border-[#DDE5E1] bg-[#FBFCFB] px-4 py-4 sm:px-5">
        <DataRichPrimaryAction href={marketHref}>20ブランドの市場構造を分析</DataRichPrimaryAction>
      </div>
    </DataRichPanel>
  );
}

function BrandComparisonLauncher({
  reportBase,
  selectedBrands,
  selectedBrandIds,
  onToggleBrand,
  returnHref
}: {
  reportBase: string;
  selectedBrands: typeof competitors;
  selectedBrandIds: string[];
  onToggleBrand: (brandId: string) => void;
  returnHref: string;
}) {
  const [brandQuery, setBrandQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const brandSearchRef = useRef<HTMLInputElement>(null);
  const options = competitors.filter((item) => !item.isPrimary && !selectedBrandIds.includes(item.id));
  const visibleOptions = options.filter((brand) => brand.name.toLocaleLowerCase("ja-JP").includes(brandQuery.toLocaleLowerCase("ja-JP"))).slice(0, 6);
  const compareParams = new URLSearchParams();
  if (selectedBrandIds.length) compareParams.set("compare", selectedBrandIds.join(","));
  compareParams.set("return", returnHref);
  const compareHref = `${reportBase}/leaderboard/compare?${compareParams.toString()}`;

  return (
    <DataRichPanel title="競合を並べて比較" description="一覧で気になった競合を最大3社選び、期間・ペルソナ・トピック・AIモデルの比較分析へ進みます。" bodyClassName="p-0">
      <div className="grid min-w-0 gap-3 bg-[#F8FAF9] p-4 sm:p-5 lg:grid-cols-[auto_minmax(260px,1fr)_minmax(240px,.65fr)_auto] lg:items-center">
        <div className="flex items-center gap-2 lg:self-center">
          <p className="whitespace-nowrap text-[11px] font-bold text-[#667085]">比較対象</p>
          <DataRichBadge tone={selectedBrandIds.length ? "green" : "default"}>{selectedBrandIds.length} / 3社</DataRichBadge>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          {selectedBrands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => onToggleBrand(brand.id)}
              className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-md border border-[#0B6B57] bg-[#EAF6F0] px-2.5 text-[12px] font-bold text-[#075E44] transition-colors hover:bg-[#DDEFE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]"
              aria-label={brand.name + "を比較から外す"}
            >
              <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
              <span className="text-[11px] tabular-nums text-[#477064]">{brand.aiPresence}%</span>
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
          ))}
          {!selectedBrands.length ? <p className="self-center py-2 text-[12px] font-semibold text-[#8A4B00]">比較する競合を選択してください。</p> : null}
        </div>

        <div
          className="relative min-w-0"
          onFocusCapture={() => setIsSearchOpen(true)}
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              brandSearchRef.current?.focus();
              setIsSearchOpen(false);
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsSearchOpen(false);
          }}
        >
          <label className="relative block min-w-0">
            <span className="sr-only">競合を追加</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
            <input
              ref={brandSearchRef}
              value={brandQuery}
              onChange={(event) => {
                setBrandQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              placeholder={selectedBrandIds.length >= 3 ? "3社まで選択済み" : "競合名を検索・追加"}
              disabled={selectedBrandIds.length >= 3}
              aria-label="競合名を検索・追加"
              aria-controls="brand-comparison-options"
              className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] disabled:cursor-not-allowed disabled:bg-[#F2F4F3] disabled:text-[#98A2B3]"
            />
          </label>

          {isSearchOpen && selectedBrandIds.length < 3 ? (
            <div id="brand-comparison-options" aria-label="追加できる競合" className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-md border border-[#C7D2CC] bg-white p-1 shadow-[0_12px_28px_rgba(16,24,40,0.14)]">
              {visibleOptions.length ? visibleOptions.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => {
                    onToggleBrand(brand.id);
                    setBrandQuery("");
                    if (selectedBrandIds.length >= 2) setIsSearchOpen(false);
                    window.requestAnimationFrame(() => brandSearchRef.current?.focus());
                  }}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-sm px-3 text-left transition-colors hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B382D]"
                >
                  <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-[#667085]">AI表示率 {brand.aiPresence}%</span>
                </button>
              )) : (
                <p className="px-3 py-3 text-[12px] font-semibold text-[#667085]">一致する競合がありません。</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 [&>a]:w-full lg:justify-self-end lg:[&>a]:w-auto">
          {selectedBrandIds.length ? (
            <DataRichPrimaryAction href={compareHref}>比較分析へ</DataRichPrimaryAction>
          ) : (
            <span aria-disabled="true" className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#E5E7EB] px-4 text-sm font-bold text-[#98A2B3] lg:w-auto">比較分析へ</span>
          )}
        </div>
      </div>
    </DataRichPanel>
  );
}

function BrandComparisonWorkspace({
  reportBase,
  selectedBrands,
  selectedBrandIds,
  onToggleBrand,
  returnHref
}: {
  reportBase: string;
  selectedBrands: typeof competitors;
  selectedBrandIds: string[];
  onToggleBrand: (brandId: string) => void;
  returnHref: string;
}) {
  const [brandQuery, setBrandQuery] = useState("");
  const self = competitors.find((item) => item.isPrimary) ?? competitors[0];
  const options = competitors.filter((item) => !item.isPrimary);
  const visibleOptions = options.filter((brand) => brand.name.toLocaleLowerCase("ja-JP").includes(brandQuery.toLocaleLowerCase("ja-JP"))).slice(0, 8);
  const comparisonRows = [self, ...selectedBrands];

  return (
    <DataRichPanel
      title="比較ワークスペース"
      description="Recoraを固定基準にして、選択した競合の実値と自社差を同じ列で比較します。"
      bodyClassName="p-0"
    >
      <div className="border-b border-[#DDE5E1] bg-[#F8FAF9] px-4 py-3 sm:px-5">
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(260px,.8fr)_minmax(360px,1.2fr)] xl:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-bold text-[#344054]">比較する競合</p>
              <DataRichBadge tone={selectedBrandIds.length === 3 ? "green" : "default"}>{selectedBrandIds.length} / 3社</DataRichBadge>
            </div>
            <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">検索して最大3社を選択します。選択した競合は全モデル比較にも引き継がれます。</p>
            <div className="mt-2 flex min-w-0 flex-wrap gap-2">
              {selectedBrands.map((brand) => (
                <button key={brand.id} type="button" onClick={() => onToggleBrand(brand.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#0B6B57] bg-[#EAF6F0] px-3 text-[12px] font-bold text-[#075E44]" aria-label={`${brand.name}を比較から外す`}>
                  <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <label className="relative block min-w-0">
              <span className="sr-only">競合名を検索</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
              <input value={brandQuery} onChange={(event) => setBrandQuery(event.target.value)} placeholder="競合名を検索" className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none placeholder:font-medium placeholder:text-[#98A2B3] focus-visible:ring-2 focus-visible:ring-[#0B382D]" />
            </label>
            <div className="mt-2 flex min-w-0 flex-wrap gap-2" aria-label="検索結果から競合を選択">
            {visibleOptions.map((brand) => {
              const selected = selectedBrandIds.includes(brand.id);
              const disabled = !selected && selectedBrandIds.length >= 3;
              if (selected) return null;
              return (
                <button
                  key={brand.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => onToggleBrand(brand.id)}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
                    selected ? "border-[#0B6B57] bg-[#EAF6F0] text-[#075E44]" : "border-[#D7E0DC] bg-white text-[#475467] hover:border-[#9AB8AA]"
                  )}
                >
                  <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                </button>
              );
            })}
            {visibleOptions.filter((brand) => !selectedBrandIds.includes(brand.id)).length === 0 ? <p className="py-2 text-[12px] font-semibold text-[#667085]">一致する未選択の競合はありません。</p> : null}
            </div>
            {selectedBrandIds.length >= 3 ? <p className="mt-2 text-[12px] font-semibold text-[#8A4B00]">3社選択中です。入れ替える場合は選択済みの競合を外してください。</p> : null}
          </div>
        </div>
      </div>

      <div className="hidden lg:block" role="table" aria-label="選択競合と自社の主要指標比較">
        <div className="grid grid-cols-[minmax(190px,1.2fr)_repeat(4,minmax(130px,1fr))] border-b border-[#DDE5E1] bg-[#FBFCFB]" role="row">
          {[
            "ブランド",
            "AI表示率",
            "AI内シェア",
            "平均掲載位置",
            "公式サイト引用率"
          ].map((label) => <div key={label} className="border-r border-[#E5EAE8] px-4 py-3 text-[12px] font-bold text-[#667085] last:border-r-0" role="columnheader">{label}</div>)}
        </div>
        {comparisonRows.map((brand) => (
          <div key={brand.id} className={cn("grid grid-cols-[minmax(190px,1.2fr)_repeat(4,minmax(130px,1fr))] border-b border-[#E5EAE8] last:border-b-0", brand.isPrimary && "bg-[#F1F8F5]")} role="row">
            <div className="flex min-w-0 items-center border-r border-[#E5EAE8] px-4 py-3" role="rowheader">
              {brand.isPrimary ? (
                <span className="flex min-w-0 items-center gap-2"><EntityIdentity name={brand.name} logoUrl={brand.logoUrl} /><DataRichBadge tone="green">固定基準</DataRichBadge></span>
              ) : (
                <Link href={`${reportBase}/leaderboard/${brand.id}?return=${encodeURIComponent(returnHref)}`} className="rounded-sm hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                  <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} />
                </Link>
              )}
            </div>
            <div className="border-r border-[#E5EAE8] px-4 py-3" role="cell"><BrandComparisonMetric value={brand.aiPresence} selfValue={self.aiPresence} unit="pt" detail={buildBrandComparisonMetricDetail({ brand, metric: "aiPresence", reportBase, returnHref })} /></div>
            <div className="border-r border-[#E5EAE8] px-4 py-3" role="cell"><BrandComparisonMetric value={brand.sov} selfValue={self.sov} unit="pt" detail={buildBrandComparisonMetricDetail({ brand, metric: "sov", reportBase, returnHref })} /></div>
            <div className="border-r border-[#E5EAE8] px-4 py-3" role="cell"><BrandComparisonMetric value={brand.averagePosition} selfValue={self.averagePosition} unit="位" lowerIsBetter decimals={1} detail={buildBrandComparisonMetricDetail({ brand, metric: "averagePosition", reportBase, returnHref })} /></div>
            <div className="px-4 py-3" role="cell"><BrandComparisonMetric value={brand.citationRate} selfValue={self.citationRate} unit="pt" detail={buildBrandComparisonMetricDetail({ brand, metric: "citationRate", reportBase, returnHref })} /></div>
          </div>
        ))}
      </div>

      <div className="divide-y divide-[#DDE5E1] lg:hidden">
        {comparisonRows.map((brand) => (
          <section key={brand.id} className={cn("px-4 py-4", brand.isPrimary && "bg-[#F1F8F5]")}>
            <div className="flex min-w-0 items-center justify-between gap-2">
              {brand.isPrimary ? (
                <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
              ) : (
                <Link href={`${reportBase}/leaderboard/${brand.id}?return=${encodeURIComponent(returnHref)}`} className="rounded-sm hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                  <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                </Link>
              )}
              {brand.isPrimary ? <DataRichBadge tone="green">固定基準</DataRichBadge> : null}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><p className="text-[11px] font-bold text-[#667085]">AI表示率</p><BrandComparisonMetric value={brand.aiPresence} selfValue={self.aiPresence} unit="pt" detail={buildBrandComparisonMetricDetail({ brand, metric: "aiPresence", reportBase, returnHref })} /></div>
              <div><p className="text-[11px] font-bold text-[#667085]">AI内シェア</p><BrandComparisonMetric value={brand.sov} selfValue={self.sov} unit="pt" detail={buildBrandComparisonMetricDetail({ brand, metric: "sov", reportBase, returnHref })} /></div>
              <div><p className="text-[11px] font-bold text-[#667085]">平均掲載位置</p><BrandComparisonMetric value={brand.averagePosition} selfValue={self.averagePosition} unit="位" lowerIsBetter decimals={1} detail={buildBrandComparisonMetricDetail({ brand, metric: "averagePosition", reportBase, returnHref })} /></div>
              <div><p className="text-[11px] font-bold text-[#667085]">公式サイト引用率</p><BrandComparisonMetric value={brand.citationRate} selfValue={self.citationRate} unit="pt" detail={buildBrandComparisonMetricDetail({ brand, metric: "citationRate", reportBase, returnHref })} /></div>
            </div>
          </section>
        ))}
      </div>
    </DataRichPanel>
  );
}

const comparisonPeriods = ["7日", "30日", "90日", "180日", "365日"] as const;

function comparisonPeriodValues(brand: (typeof competitors)[number], periodIndex: number) {
  const self = competitors[0];
  const age = [-1, 0, 1, 2, 3][periodIndex] ?? 0;
  const brandDirection = (brand.rank % 3) - 1;
  const selfPresence = Math.max(0, self.aiPresence - Math.max(0, age) * 2 + (age < 0 ? 1 : 0));
  const brandPresence = Math.max(0, brand.aiPresence - Math.max(0, age) * (2 + brandDirection) + (age < 0 ? brandDirection + 1 : 0));
  const selfSov = Math.max(0, self.sov - Math.max(0, age));
  const brandSov = Math.max(0, brand.sov - Math.max(0, age) * Math.max(0, 1 + brandDirection) + (age < 0 ? Math.max(0, brandDirection) : 0));
  return {
    selfPresence,
    brandPresence,
    presenceGap: brandPresence - selfPresence,
    selfSov,
    brandSov,
    sovGap: brandSov - selfSov
  };
}

function BrandComparisonPeriodTable({
  selectedBrands,
  reportBase,
  returnHref
}: {
  selectedBrands: typeof competitors;
  reportBase: string;
  returnHref: string;
}) {
  return (
    <DataRichPanel title="期間ごとの競合差" description="同じ競合について、期間を変えたときも差が続いているかを確認します。値は競合からRecoraを引いた差です。" bodyClassName="p-0">
      {selectedBrands.length ? (
        <>
          <div className="hidden lg:block" role="table" aria-label="期間ごとの競合差">
            <div className="grid border-b border-[#DDE5E1] bg-[#F8FAF9]" style={{ gridTemplateColumns: "minmax(170px,1.25fr) repeat(5,minmax(0,1fr))" }} role="row">
              {["競合", ...comparisonPeriods].map((label) => <div key={label} className="border-r border-[#E5EAE8] px-4 py-3 text-[11px] font-bold text-[#667085] last:border-r-0" role="columnheader">{label}</div>)}
            </div>
            {selectedBrands.map((brand) => (
              <div key={brand.id} className="grid border-b border-[#E5EAE8] last:border-b-0" style={{ gridTemplateColumns: "minmax(170px,1.25fr) repeat(5,minmax(0,1fr))" }} role="row">
                <div className="flex items-center border-r border-[#E5EAE8] px-4 py-3" role="rowheader"><EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact /></div>
                {comparisonPeriods.map((period, periodIndex) => {
                  const values = comparisonPeriodValues(brand, periodIndex);
                  const detail: ReportDetailPayload = {
                    kicker: "PERIOD COMPARISON",
                    title: `${brand.name}との${period}比較`,
                    value: `AI表示率差 ${values.presenceGap > 0 ? "+" : ""}${values.presenceGap}pt`,
                    summary: `${period}に絞り、AI表示率とAI内シェアの自社差がどのモデルで生じているかを確認します。`,
                    sections: [
                      { title: "この期間の差", table: { columns: ["指標", brand.name, "Recora", "差"], rows: [["AI表示率", `${values.brandPresence}%`, `${values.selfPresence}%`, `${values.presenceGap > 0 ? "+" : ""}${values.presenceGap}pt`], ["AI内シェア", `${values.brandSov}%`, `${values.selfSov}%`, `${values.sovGap > 0 ? "+" : ""}${values.sovGap}pt`], ["平均掲載位置", `${Math.max(1, brand.averagePosition + periodIndex * 0.1).toFixed(1)}位`, `${Math.max(1, competitors[0].averagePosition + periodIndex * 0.1).toFixed(1)}位`, `${(brand.averagePosition - competitors[0].averagePosition).toFixed(1)}位`]] } },
                      { title: "AIモデル別のAI表示率差", table: { columns: ["AIモデル", brand.name, "Recora", "差"], rows: activeModels.map((model, modelIndex) => { const modelGap = values.presenceGap + [2, -3, 1, 4][modelIndex]; return [model.name, `${Math.max(0, values.brandPresence + [3, -2, 1, 5][modelIndex])}%`, `${Math.max(0, values.selfPresence + [1, 1, 0, 1][modelIndex])}%`, `${modelGap > 0 ? "+" : ""}${modelGap}pt`]; }) } },
                      { title: "前後期間との関係", facts: [{ label: "短期", value: "7日の日次変動を含む" }, { label: "基準", value: "30日" }, { label: "長期", value: "90日以上で継続性を確認" }] }
                    ],
                    detailHref: `${reportBase}/leaderboard/${brand.id}?return=${encodeURIComponent(returnHref)}`,
                    detailLabel: `${brand.name}の全分析を確認`
                  };
                  return (
                    <div key={period} className="border-r border-[#E5EAE8] px-2 py-2 last:border-r-0" role="cell">
                      <ReportDetailButton detail={detail} className="w-full justify-start rounded-sm px-2 py-1.5 text-left hover:bg-[#F1F8F5]">
                        <span><span className={cn("block text-[14px] font-bold tabular-nums", values.presenceGap > 0 ? "text-[#A15C00]" : "text-[#067647]")}>{values.presenceGap > 0 ? "+" : ""}{values.presenceGap}pt</span><span className="mt-1 block text-[10px] font-semibold tabular-nums text-[#667085]">AI内シェア {values.sovGap > 0 ? "+" : ""}{values.sovGap}pt</span></span>
                      </ReportDetailButton>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="divide-y divide-[#DDE5E1] lg:hidden">
            {selectedBrands.map((brand) => {
              const current = comparisonPeriodValues(brand, 1);
              const long = comparisonPeriodValues(brand, 2);
              return <section key={brand.id} className="px-4 py-4"><EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact /><dl className="mt-3 grid grid-cols-2 gap-3"><div><dt className="text-[10px] font-bold text-[#667085]">30日 AI表示率差</dt><dd className="mt-1 text-[15px] font-bold tabular-nums text-[#101828]">{current.presenceGap > 0 ? "+" : ""}{current.presenceGap}pt</dd></div><div><dt className="text-[10px] font-bold text-[#667085]">90日 AI表示率差</dt><dd className="mt-1 text-[15px] font-bold tabular-nums text-[#101828]">{long.presenceGap > 0 ? "+" : ""}{long.presenceGap}pt</dd></div></dl></section>;
            })}
          </div>
        </>
      ) : <FilterEmptyState title="比較する競合が選択されていません" description="上の検索から競合を1社以上選択してください。" />}
    </DataRichPanel>
  );
}

function brandAxisValue(brand: (typeof competitors)[number], rowIndex: number, axis: "persona" | "topic") {
  const selfValues = axis === "persona" ? [61, 56, 69, 47, 53] : [52, 57, 43, 61, 67, 48];
  const selfValue = selfValues[rowIndex] ?? 50;
  if (brand.isPrimary) return selfValue;
  const baseGap = brand.aiPresence - competitors[0].aiPresence;
  const variation = ((brand.rank + rowIndex * 2) % 7) - 3;
  return Math.max(5, Math.min(95, selfValue + baseGap + variation));
}

function BrandComparisonAxisTable({
  axis,
  title,
  description,
  labels,
  selectedBrands,
  reportBase,
  returnHref
}: {
  axis: "persona" | "topic";
  title: string;
  description: string;
  labels: string[];
  selectedBrands: typeof competitors;
  reportBase: string;
  returnHref: string;
}) {
  const self = competitors[0];
  const brands = [self, ...selectedBrands];
  const hrefForLabel = (label: string) => {
    const entries = axis === "persona" ? Object.entries(personaNameById) : Object.entries(topicNameById);
    const id = entries.find(([, name]) => name === label)?.[0];
    return id ? `${reportBase}/persona-topics/${axis === "persona" ? "personas" : "topics"}/${id}?return=${encodeURIComponent(returnHref)}` : `${reportBase}/persona-topics`;
  };
  const detailFor = (brand: (typeof competitors)[number], label: string, rowIndex: number): ReportDetailPayload => {
    const selfValue = brandAxisValue(self, rowIndex, axis);
    const brandValue = brandAxisValue(brand, rowIndex, axis);
    const gap = brandValue - selfValue;
    return {
      kicker: axis === "persona" ? "PERSONA COMPARISON" : "TOPIC COMPARISON",
      title: `${label}での${brand.name}比較`,
      value: `AI表示率 ${brandValue}%`,
      summary: `${label}に含まれる固定質問だけで、Recoraとの差とモデルごとの一致・不一致を確認します。`,
      sections: [
        { title: "この条件での現在差", facts: [{ label: brand.name, value: `${brandValue}%` }, { label: "Recora", value: `${selfValue}%` }, { label: "差", value: `${gap > 0 ? "+" : ""}${gap}pt`, tone: gap > 0 ? "amber" : "green" }, { label: "対象質問", value: `${18 + rowIndex * 3}件` }] },
        { title: "AIモデル別", table: { columns: ["AIモデル", brand.name, "Recora", "差"], rows: activeModels.map((model, modelIndex) => { const rival = Math.max(0, Math.min(100, brandValue + [4, -3, 1, 5][modelIndex])); const own = Math.max(0, Math.min(100, selfValue + [2, -1, 0, 3][modelIndex])); return [model.name, `${rival}%`, `${own}%`, `${rival - own > 0 ? "+" : ""}${rival - own}pt`]; }) } },
        { title: "差が出た質問群", table: { columns: ["固定質問", "モデル", brand.name, "Recora"], rows: [[`${label}で比較対象を選ぶ基準は？`, "GPT", "1位", "2位"], [`${label}で信頼できるサービスは？`, "Gemini", "掲載", "未掲載"], [`${label}で導入条件を比較して`, "Perplexity", "2位", "1位"]] } }
      ],
      detailHref: brand.isPrimary ? hrefForLabel(label) : `${reportBase}/leaderboard/${brand.id}?return=${encodeURIComponent(returnHref)}`,
      detailLabel: brand.isPrimary ? `${label}の全分析を確認` : `${brand.name}の全分析を確認`
    };
  };

  return (
    <DataRichPanel title={title} description={description} bodyClassName="p-0">
      {selectedBrands.length ? (
        <>
          <div className="hidden lg:block" role="table" aria-label={title}>
            <div className="grid border-b border-[#DDE5E1] bg-[#F8FAF9]" style={{ gridTemplateColumns: `minmax(180px,1.25fr) repeat(${brands.length},minmax(0,1fr))` }} role="row">
              <div className="border-r border-[#E5EAE8] px-4 py-3 text-[11px] font-bold text-[#667085]" role="columnheader">{axis === "persona" ? "ペルソナ" : "トピック"}</div>
              {brands.map((brand) => <div key={brand.id} className="border-r border-[#E5EAE8] px-4 py-3 last:border-r-0" role="columnheader"><EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact /></div>)}
            </div>
            {labels.map((label, rowIndex) => {
              const selfValue = brandAxisValue(self, rowIndex, axis);
              return (
                <div key={label} className="grid border-b border-[#E5EAE8] last:border-b-0" style={{ gridTemplateColumns: `minmax(180px,1.25fr) repeat(${brands.length},minmax(0,1fr))` }} role="row">
                  <div className="flex items-center border-r border-[#E5EAE8] px-4 py-3" role="rowheader"><Link href={hrefForLabel(label)} className="font-bold text-[#101828] hover:text-[#075E44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">{label}</Link></div>
                  {brands.map((brand) => { const value = brandAxisValue(brand, rowIndex, axis); const gap = value - selfValue; return <div key={brand.id} className="border-r border-[#E5EAE8] px-2 py-2 last:border-r-0" role="cell"><ReportDetailButton detail={detailFor(brand, label, rowIndex)} className="w-full justify-start rounded-sm px-2 py-1.5 text-left hover:bg-[#F1F8F5]"><span className="block w-full"><span className="flex items-baseline justify-between gap-2"><span className="text-[15px] font-bold tabular-nums text-[#101828]">{value}%</span><span className={cn("text-[10px] font-bold tabular-nums", brand.isPrimary ? "text-[#667085]" : gap > 0 ? "text-[#A15C00]" : "text-[#067647]")}>{brand.isPrimary ? "基準" : `${gap > 0 ? "+" : ""}${gap}pt`}</span></span><span className="mt-1 block"><DataRichInlineBar value={value} fillClassName={brandBarClass(brand.name)} /></span></span></ReportDetailButton></div>; })}
                </div>
              );
            })}
          </div>

          <div className="divide-y divide-[#DDE5E1] lg:hidden">
            {labels.map((label, rowIndex) => { const rival = selectedBrands[0]; const selfValue = brandAxisValue(self, rowIndex, axis); const rivalValue = brandAxisValue(rival, rowIndex, axis); return <section key={label} className="px-4 py-4"><Link href={hrefForLabel(label)} className="text-[13px] font-bold text-[#101828]">{label}</Link><dl className="mt-3 grid grid-cols-2 gap-3"><div><dt className="text-[10px] font-bold text-[#667085]">Recora</dt><dd className="mt-1 text-[15px] font-bold tabular-nums">{selfValue}%</dd></div><div><dt className="text-[10px] font-bold text-[#667085]">{rival.name}</dt><dd className="mt-1 text-[15px] font-bold tabular-nums">{rivalValue}%</dd></div></dl></section>; })}
          </div>
        </>
      ) : <FilterEmptyState title="比較する競合が選択されていません" description="上の検索から競合を1社以上選択してください。" />}
    </DataRichPanel>
  );
}

function BrandComparisonProfileLinks({
  selectedBrands,
  reportBase,
  returnHref
}: {
  selectedBrands: typeof competitors;
  reportBase: string;
  returnHref: string;
}) {
  return (
    <DataRichPanel title="競合ごとの全分析" description="1社に絞って、ペルソナ・トピック・モデル・引用元・ブランド印象まで確認します。" bodyClassName="p-0">
      {selectedBrands.length ? <div className="divide-y divide-[#DDE5E1]">{selectedBrands.map((brand) => <div key={brand.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><EntityIdentity name={brand.name} logoUrl={brand.logoUrl} /><p className="mt-2 text-[12px] font-semibold tabular-nums text-[#667085]">AI表示率 {brand.aiPresence}% ・ AI内シェア {brand.sov}% ・ 平均掲載位置 {brand.averagePosition}位 ・ 公式サイト引用率 {brand.citationRate}%</p></div><DataRichPrimaryAction href={`${reportBase}/leaderboard/${brand.id}?return=${encodeURIComponent(returnHref)}`} variant="secondary">{brand.name}だけを分析</DataRichPrimaryAction></div>)}</div> : <FilterEmptyState title="比較する競合が選択されていません" description="上の検索から競合を1社以上選択してください。" />}
    </DataRichPanel>
  );
}

function BrandRankingTable({
  rows,
  reportBase,
  compact = false,
  directLinks = false,
  returnHref
}: {
  rows: typeof competitors;
  reportBase: string;
  compact?: boolean;
  directLinks?: boolean;
  returnHref?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"順位" | "AI表示率" | "AI内シェア" | "公式サイト引用率">("順位");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20>(10);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("brq") ?? "");
    const querySort = params.get("brsort");
    if (["順位", "AI表示率", "AI内シェア", "公式サイト引用率"].includes(querySort ?? "")) setSort(querySort as typeof sort);
    if (Number(params.get("brsize")) === 20) setPageSize(20);
    const queryPage = Number(params.get("brpage"));
    if (queryPage > 0) setPage(Math.floor(queryPage));
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady || compact) return;
    replaceCurrentQuery({ brq: query || null, brsort: sort === "順位" ? null : sort, brsize: pageSize === 10 ? null : String(pageSize), brpage: page === 1 ? null : String(page) });
  }, [compact, page, pageSize, query, sort, urlReady]);

  const filteredRows = rows.filter((row) => row.name.toLocaleLowerCase("ja-JP").includes(query.toLocaleLowerCase("ja-JP")));
  const orderedRows = [...filteredRows].sort((a, b) => sort === "AI表示率" ? b.aiPresence - a.aiPresence : sort === "AI内シェア" ? b.sov - a.sov : sort === "公式サイト引用率" ? b.citationRate - a.citationRate : a.rank - b.rank);
  const totalPages = compact ? 1 : Math.max(1, Math.ceil(orderedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const displayRows = compact ? (directLinks ? [...rows].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.rank - b.rank) : rows) : orderedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rankingReturnHref = (() => {
    const base = returnHref ?? `${reportBase}/leaderboard`;
    const [path, queryString = ""] = base.split("?");
    const params = new URLSearchParams(queryString);
    if (query) params.set("brq", query); else params.delete("brq");
    if (sort !== "順位") params.set("brsort", sort); else params.delete("brsort");
    if (pageSize !== 10) params.set("brsize", String(pageSize)); else params.delete("brsize");
    if (safePage !== 1) params.set("brpage", String(safePage)); else params.delete("brpage");
    return `${path}${params.size ? `?${params.toString()}` : ""}`;
  })();
  const directBrandHref = (row: (typeof competitors)[number]) => row.isPrimary
    ? rankingReturnHref
    : `${reportBase}/leaderboard/${row.id}?return=${encodeURIComponent(rankingReturnHref)}`;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  return (
    <>
      {!compact ? (
        <div className="grid gap-3 border-b border-[#DDE5E1] bg-[#F8FAF9] p-4 md:grid-cols-[minmax(240px,1fr)_220px]">
          <label className="min-w-0"><span className="mb-1.5 block text-[12px] font-bold text-[#667085]">ブランド名を検索</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ブランド名を入力" className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none placeholder:font-medium placeholder:text-[#98A2B3] focus-visible:ring-2 focus-visible:ring-[#0B382D]" /></span></label>
          <label className="min-w-0"><span className="mb-1.5 block text-[12px] font-bold text-[#667085]">並び順</span><select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]"><option value="順位">総合順位</option><option value="AI表示率">AI表示率</option><option value="AI内シェア">AI内シェア</option><option value="公式サイト引用率">公式サイト引用率</option></select></label>
        </div>
      ) : null}
      {displayRows.length === 0 ? <FilterEmptyState title="条件に一致するブランドがありません" description="ブランド名の検索語を変更してください。" /> : null}
      <div className={cn("divide-y divide-[#E5E7EB] border border-[#E5E7EB] xl:hidden", displayRows.length === 0 && "hidden")}>
        {displayRows.map((row) => {
          const identity = (
            <span className="flex min-w-0 items-center gap-2">
              <EntityIdentity name={row.name} logoUrl={row.logoUrl} compact />
              {row.isPrimary ? <DataRichBadge tone="green">自社</DataRichBadge> : null}
            </span>
          );

          return (
            <div key={row.id} className={cn("min-w-0 px-3 py-3", row.isPrimary ? "bg-[#EAF6F0]/70" : "bg-white")}>
              <div className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2.5">
                <span className="text-center text-sm font-bold tabular-nums text-[#475467]">{row.rank}</span>
                {directLinks ? (
                  <Link href={directBrandHref(row)} className="flex min-w-0 items-center justify-start rounded-sm text-[#0F172A] hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                    {identity}
                  </Link>
                ) : (
                  <ReportDetailButton detail={brandRankingDetail(row, reportBase)} className="min-w-0 justify-start rounded-sm text-[#0F172A] hover:text-[#006B57]">
                    {identity}
                  </ReportDetailButton>
                )}
                <span className={cn("text-xs font-bold tabular-nums", row.delta < 0 ? "text-[#B42318]" : "text-[#006B57]")}>{formatPt(row.delta)}</span>
              </div>
              <div className="mt-2 pl-[40px]">
                <DataRichInlineBar value={row.aiPresence} label={`${row.aiPresence}%`} fillClassName={brandBarClass(row.name)} />
              </div>
              {!compact ? (
                <dl className="mt-3 grid grid-cols-3 gap-2 pl-[40px] text-[11px]">
                  <div><dt className="font-bold text-[#667085]">AI内シェア</dt><dd className="mt-1 font-semibold tabular-nums text-[#101828]">{row.sov}%</dd></div>
                  <div><dt className="font-bold text-[#667085]">平均掲載位置</dt><dd className="mt-1 font-semibold tabular-nums text-[#101828]">{row.averagePosition}位</dd></div>
                  <div><dt className="font-bold text-[#667085]">公式サイト引用率</dt><dd className="mt-1 font-semibold tabular-nums text-[#101828]">{row.citationRate}%</dd></div>
                </dl>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={displayRows.length ? "hidden xl:block" : "hidden"}>
        <DataRichTableWrap>
          <Table className="w-full table-fixed text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[58px]">順位</TableHead>
                <TableHead className="w-[210px]">ブランド</TableHead>
                <TableHead className="w-[160px]">AI表示率</TableHead>
                {!compact ? <TableHead className="w-[100px]">AI内シェア</TableHead> : null}
                {!compact ? <TableHead className="w-[120px]">平均掲載位置</TableHead> : null}
                {!compact ? <TableHead className="w-[120px]">公式サイト引用率</TableHead> : null}
                <TableHead className="w-[96px]">前日比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row) => {
                const content = (
                  <div className="flex min-w-0 items-center gap-2">
                    <EntityIdentity name={row.name} logoUrl={row.logoUrl} compact />
                    {row.isPrimary ? <DataRichBadge tone="green">自社</DataRichBadge> : null}
                  </div>
                );
                return (
                  <TableRow key={row.id} className={row.isPrimary ? "bg-[#EAF6F0]/70" : undefined}>
                    <TableCell data-rich-label="順位" className="font-bold tabular-nums">{row.rank}</TableCell>
                    <TableCell data-rich-label="ブランド">
                      {directLinks ? (
                        <Link href={directBrandHref(row)} className="flex w-full items-center justify-start rounded-sm text-[#0F172A] hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                          {content}
                        </Link>
                      ) : (
                        <ReportDetailButton detail={brandRankingDetail(row, reportBase)} className="w-full justify-start rounded-sm text-[#0F172A] hover:text-[#006B57]">
                          {content}
                        </ReportDetailButton>
                      )}
                    </TableCell>
                    <TableCell data-rich-label="AI表示率"><DataRichInlineBar value={row.aiPresence} label={`${row.aiPresence}%`} fillClassName={brandBarClass(row.name)} /></TableCell>
                    {!compact ? <TableCell data-rich-label="AI内シェア" className="font-semibold tabular-nums">{row.sov}%</TableCell> : null}
                    {!compact ? <TableCell data-rich-label="平均掲載位置" className="font-semibold tabular-nums">{row.averagePosition}位</TableCell> : null}
                    {!compact ? <TableCell data-rich-label="公式サイト引用率" className="font-semibold tabular-nums">{row.citationRate}%</TableCell> : null}
                    <TableCell data-rich-label="前日比" className={cn("font-bold tabular-nums", row.delta < 0 ? "text-[#B42318]" : "text-[#006B57]")}>{formatPt(row.delta)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataRichTableWrap>
      </div>
      {!compact ? <ResultPagination page={safePage} totalPages={totalPages} pageSize={pageSize} pageSizes={[10, 20]} shown={displayRows.length} matched={filteredRows.length} total={rows.length} unit="ブランド" onPage={setPage} onPageSize={(size) => { setPageSize(size === 20 ? 20 : 10); setPage(1); }} /> : null}
    </>
  );
}

function modelObservationCode(model: string) {
  if (model === "Gemini") return "GEM";
  if (model === "Perplexity") return "PPX";
  if (model === "Google AI Mode") return "GAI";
  return "GPT";
}

type PromptRow = (typeof promptRows)[number];

function promptMatchesView(row: PromptRow, view: PromptView) {
  if (view === "すべて") return true;
  const observations = getPromptLatestObservations(row);
  if (view === "自社掲載あり") return observations.some((observation) => observation.selfListing === "掲載あり");
  if (view === "自社未掲載") return observations.some((observation) => observation.selfListing === "未掲載");
  if (view === "競合先行") return row.reason.includes("競合");
  return row.citationRate > 0 || observations.some((observation) => observation.officialCitation === "あり");
}

function getPromptModelResults(row: PromptRow, range: ReportRange = "30日") {
  const expectedObservations = Number.parseInt(range, 10);
  const rangeOffset: Record<ReportRange, number> = {
    "7日": -4,
    "30日": 0,
    "90日": 2,
    "180日": 4,
    "365日": 6
  };
  const offset = rangeOffset[range];
  const bounded = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  const baseResults = [
    { model: "GPT", aiPresence: row.aiPresence, sov: row.sov, position: row.averagePosition, citation: row.citationRate, result: row.sentiment, missing: 0, periodDelta: 3 },
    { model: "Gemini", aiPresence: Math.max(0, row.aiPresence - 8), sov: Math.max(0, row.sov - 4), position: row.type === "Non-brand" ? "3.1位" : "対象外", citation: Math.max(0, row.citationRate - 6), result: row.sentiment === "注意" ? "要確認" : row.sentiment, missing: row.id === "p02" ? 2 : 1, periodDelta: -2 },
    { model: "Perplexity", aiPresence: Math.min(100, row.aiPresence + 5), sov: Math.min(100, row.sov + 3), position: row.type === "Non-brand" ? "2.2位" : "対象外", citation: Math.min(100, row.citationRate + 7), result: "引用一致", missing: row.id === "p04" ? 2 : 0, periodDelta: 1 },
    { model: "Google AI Mode", aiPresence: Math.min(100, row.aiPresence + 8), sov: Math.min(100, row.sov + 5), position: row.type === "Non-brand" ? "2.1位" : "対象外", citation: Math.min(100, row.citationRate + 10), result: "引用一致", missing: 1, periodDelta: 4 }
  ];
  return baseResults
    .filter((item) => activeModels.some((model) => model.name === item.model))
    .map((item) => {
      const missingObservations = Math.min(expectedObservations, Math.round(item.missing * expectedObservations / 30));
      const position = Number.parseFloat(item.position);
      return {
        ...item,
        aiPresence: bounded(item.aiPresence + offset),
        sov: bounded(item.sov + Math.round(offset / 2)),
        citation: bounded(item.citation + offset),
        position: row.type === "Non-brand" && Number.isFinite(position) ? `${Math.max(1, position - offset * 0.04).toFixed(1)}位` : "対象外",
        periodDelta: item.periodDelta + Math.sign(offset),
        expectedObservations,
        missingObservations,
        validObservations: Math.max(0, expectedObservations - missingObservations)
      };
    });
}

function getPromptLatestObservations(row: PromptRow) {
  const defaults: Record<string, {
    observedAt: string;
    position: string;
    role: string;
    competitorAhead: string;
    citations: number;
    citationUrl: string;
  }> = {
    GPT: { observedAt: "2026/07/06 06:04", position: "2位", role: "推薦候補", competitorAhead: "Trailbase", citations: 3, citationUrl: "https://recora.jp/products/ai-visibility-monitor" },
    Gemini: { observedAt: "2026/07/06 06:11", position: "3位", role: "比較対象", competitorAhead: "SignalNest", citations: 1, citationUrl: "https://marketing-ai.jp/research/ai-search-2026" },
    Perplexity: { observedAt: "2026/07/06 06:18", position: "3位", role: "比較対象", competitorAhead: "Trailbase", citations: 2, citationUrl: "https://recora.jp/guide" },
    "Google AI Mode": { observedAt: "2026/07/06 06:25", position: "1位", role: "第一推薦", competitorAhead: "なし", citations: 4, citationUrl: "https://recora.jp/products/ai-visibility-monitor" }
  };

  return activeModels.map((activeModel, index) => {
    const fallback = { observedAt: `2026/07/06 06:${String(4 + index * 7).padStart(2, "0")}`, position: "本文言及", role: "言及", competitorAhead: "なし", citations: 0, citationUrl: "引用なし" };
    const model = activeModel.name;
    const preset = defaults[model] ?? fallback;
    const failed = row.id === "p04" && model === "Perplexity";
    const unlisted = row.id === "p02" && model === "Gemini";
    const listed = !failed && !unlisted;
    const position = failed || unlisted ? "—" : row.type === "Branded" ? "本文言及" : preset.position;
    const role = failed || unlisted ? "—" : row.type === "Branded" ? "説明対象" : preset.role;
    const verification = failed ? "再計測待ち" : unlisted ? "競合回答を確認" : model === "GPT" && row.sentiment === "注意" ? "主張の整合を要確認" : "確認済み";
    const answerExcerpt = failed
      ? "回答を取得できませんでした。未掲載とは分けて再計測対象として扱います。"
      : unlisted
        ? `${preset.competitorAhead}を候補として紹介し、Recoraへの言及はありません。`
        : `Recoraを${role}として紹介し、${row.topic}の判断材料を説明しています。`;

    return {
      observationId: `OBS-20260706-${modelObservationCode(model)}-${row.id.toUpperCase()}-01`,
      observedAt: preset.observedAt,
      model,
      retrievalStatus: failed ? "計測失敗" : "取得済み",
      selfListing: failed ? "判定不可" : listed ? "掲載あり" : "未掲載",
      position,
      role,
      competitorAhead: failed ? "判定不可" : preset.competitorAhead,
      citations: failed ? 0 : preset.citations,
      officialCitation: failed ? "判定不可" : listed && preset.citationUrl.includes("recora.jp") ? "あり" : "なし",
      verification,
      citationUrl: failed ? "回答未取得" : preset.citationUrl,
      answerExcerpt
    };
  });
}

function PromptModelResultTable({ row, range, highlightedProvider }: { row: PromptRow; range: ReportRange; highlightedProvider: ReportProvider }) {
  const rows = getPromptModelResults(row, range);
  const observations = getPromptLatestObservations(row);
  const eligible = row.type === "Non-brand";

  return (
    <div className="overflow-hidden bg-white">
      <div className="hidden grid-cols-[minmax(170px,1.2fr)_repeat(4,minmax(110px,.8fr))_minmax(150px,1fr)] border-b border-[#D8E1DD] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid">
        {["AIモデル", "AI表示率", "AI内シェア", "平均掲載位置", "公式サイト引用率", "有効観測"].map((label) => (
          <div key={label} className="flex min-h-11 items-center px-3">{label}</div>
        ))}
      </div>
      <ul role="list" className="divide-y divide-[#D8E1DD]">
        {rows.map((item) => {
          const latest = observations.find((observation) => observation.model === item.model);
          const successRate = Math.round(item.validObservations / Math.max(1, item.expectedObservations) * 100);
          const listedResponses = Math.round(item.validObservations * item.aiPresence / 100);
          const citedResponses = Math.round(item.validObservations * item.citation / 100);
          const totalBrandMentions = Math.max(1, item.validObservations * 2);
          const ownedBrandMentions = Math.round(totalBrandMentions * item.sov / 100);
          const verificationStatus = latest?.retrievalStatus === "計測失敗"
            ? "再計測待ち"
            : latest?.verification ?? (item.missingObservations > 0 ? "一部欠測" : "確認済み");
          const verificationTone: "green" | "amber" | "red" = verificationStatus === "再計測待ち"
            ? "red"
            : verificationStatus === "確認済み" || verificationStatus === "引用一致" || verificationStatus === "主張確認済み"
              ? "green"
              : "amber";
          const selectedBackground = highlightedProvider === item.model ? " bg-[#F1F8F5]" : " bg-white";
          const comparison = rows.map((modelRow) => [
            modelRow.model,
            eligible ? modelRow.aiPresence + "%" : "対象外",
            eligible ? modelRow.sov + "%" : "対象外",
            modelRow.position,
            modelRow.citation + "%",
            modelRow.validObservations + "/" + modelRow.expectedObservations
          ]);
          const detail = (metric: "summary" | "presence" | "sov" | "position" | "citation" | "coverage" | "verification"): ReportDetailPayload => {
            if (metric === "summary") return {
              kicker: "MODEL SUMMARY",
              title: item.model + "の期間集計",
              value: eligible ? "AI表示率 " + item.aiPresence + "%" : "ブランド質問",
              summary: row.prompt,
              sections: [
                { title: "このモデル", facts: [
                  { label: "期間", value: range },
                  { label: "AI表示率", value: eligible ? item.aiPresence + "%" : "主要KPI対象外" },
                  { label: "AI内シェア", value: eligible ? item.sov + "%" : "主要KPI対象外" },
                  { label: "平均掲載位置", value: item.position },
                  { label: "公式サイト引用率", value: item.citation + "%" },
                  { label: "有効 / 予定 / 欠測", value: item.validObservations + " / " + item.expectedObservations + " / " + item.missingObservations }
                ] },
                { title: "契約モデル比較", table: { columns: ["モデル", "AI表示率", "AI内シェア", "平均位置", "公式サイト引用率", "有効/予定"], rows: comparison } }
              ]
            };
            if (metric === "presence" || metric === "sov") {
              const isPresence = metric === "presence";
              const label = isPresence ? "AI表示率" : "AI内シェア";
              const value = isPresence ? item.aiPresence : item.sov;
              const fraction = isPresence
                ? listedResponses + " / " + item.validObservations + "回答"
                : ownedBrandMentions + " / " + totalBrandMentions + "言及";
              return {
                kicker: isPresence ? "AI VISIBILITY" : "SHARE OF VOICE",
                title: item.model + "の" + label,
                value: eligible ? value + "%" : "対象外",
                summary: eligible
                  ? (isPresence ? "有効回答のうち自社が掲載された割合です。" : "回答内の全ブランド言及に占める自社の言及シェアです。")
                  : "ブランド質問は主要可視性KPIの分母に含めません。",
                sections: [
                  { title: "この値の内訳", facts: eligible ? [
                    { label: label, value: value + "%" },
                    { label: isPresence ? "自社掲載回答 / 有効回答" : "自社言及 / 全ブランド言及", value: fraction },
                    { label: "前期間差", value: (item.periodDelta > 0 ? "+" : "") + item.periodDelta + "pt", tone: item.periodDelta < 0 ? "amber" : "green" },
                    { label: "欠測", value: item.missingObservations + "件" }
                  ] : [{ label: "質問種別", value: row.type }, { label: "集計方針", value: "主要KPI対象外" }] },
                  { title: "モデル比較", table: {
                    columns: ["モデル", label, "分子 / 分母"],
                    rows: rows.map((modelRow) => {
                      const modelTotalMentions = Math.max(1, modelRow.validObservations * 2);
                      const modelFraction = isPresence
                        ? Math.round(modelRow.validObservations * modelRow.aiPresence / 100) + " / " + modelRow.validObservations + "回答"
                        : Math.round(modelTotalMentions * modelRow.sov / 100) + " / " + modelTotalMentions + "言及";
                      return [modelRow.model, eligible ? (isPresence ? modelRow.aiPresence : modelRow.sov) + "%" : "対象外", eligible ? modelFraction : "—"];
                    })
                  } }
                ]
              };
            }
            if (metric === "position") return {
              kicker: "AVERAGE POSITION",
              title: item.model + "の平均掲載位置",
              value: item.position,
              summary: "自社が掲載された回答だけの期間平均です。数値が小さいほど上位です。",
              sections: [
                { title: "期間平均と最新日", facts: [
                  { label: "期間", value: range },
                  { label: "期間平均", value: item.position },
                  { label: "最新日の位置", value: latest?.position ?? "観測なし" },
                  { label: "最新日の自社掲載", value: latest?.selfListing ?? "観測なし" }
                ] },
                { title: "モデル比較", table: {
                  columns: ["モデル", "期間平均", "最新日"],
                  rows: rows.map((modelRow) => [modelRow.model, modelRow.position, observations.find((observation) => observation.model === modelRow.model)?.position ?? "観測なし"])
                } }
              ]
            };
            if (metric === "citation") return {
              kicker: "OWNED CITATION",
              title: item.model + "の公式サイト引用率",
              value: item.citation + "%",
              summary: "有効回答のうち、自社公式URLが引用された回答の割合です。",
              sections: [
                { title: "このモデル", facts: [
                  { label: "公式サイト引用率", value: item.citation + "%" },
                  { label: "公式URL引用回答 / 有効回答", value: citedResponses + " / " + item.validObservations + "回答" },
                  { label: "最新日の公式引用", value: latest?.officialCitation ?? "観測なし" },
                  { label: "最新日の代表URL", value: latest?.citationUrl ?? "観測なし" }
                ] },
                { title: "モデル比較", table: {
                  columns: ["モデル", "公式サイト引用率", "公式引用回答 / 有効回答"],
                  rows: rows.map((modelRow) => [modelRow.model, modelRow.citation + "%", Math.round(modelRow.validObservations * modelRow.citation / 100) + " / " + modelRow.validObservations + "回答"])
                } }
              ]
            };
            if (metric === "coverage") return {
              kicker: "OBSERVATION COVERAGE",
              title: item.model + "の観測状況",
              value: successRate + "%",
              summary: "予定した日次観測に対して、有効観測と欠測を分けて確認します。",
              sections: [
                { title: "このモデル", facts: [
                  { label: "有効観測", value: item.validObservations + "件" },
                  { label: "予定観測", value: item.expectedObservations + "件" },
                  { label: "欠測", value: item.missingObservations + "件", tone: item.missingObservations > 0 ? "amber" : "green" },
                  { label: "成功率", value: successRate + "%" }
                ] },
                { title: "モデル比較", table: {
                  columns: ["モデル", "有効", "予定", "欠測", "成功率"],
                  rows: rows.map((modelRow) => [modelRow.model, modelRow.validObservations + "件", modelRow.expectedObservations + "件", modelRow.missingObservations + "件", Math.round(modelRow.validObservations / Math.max(1, modelRow.expectedObservations) * 100) + "%"])
                } }
              ]
            };
            return {
              kicker: "VERIFICATION",
              title: item.model + "の検証状態",
              value: verificationStatus,
              summary: "最新日の回答取得と主張検証を、期間の欠測とは分けて確認します。",
              sections: [
                { title: "判定内容", facts: [
                  { label: "検証状態", value: verificationStatus, tone: verificationTone },
                  { label: "最新日の取得", value: latest?.retrievalStatus ?? "観測なし", tone: latest?.retrievalStatus === "計測失敗" ? "red" : "green" },
                  { label: "最新日の検証", value: latest?.verification ?? "観測なし" },
                  { label: "欠測", value: item.missingObservations + "件" }
                ] },
                { title: "モデル別状態", table: {
                  columns: ["モデル", "検証状態", "最新日の取得", "最新日の検証"],
                  rows: rows.map((modelRow) => {
                    const observation = observations.find((candidate) => candidate.model === modelRow.model);
                    const status = observation?.retrievalStatus === "計測失敗"
                      ? "再計測待ち"
                      : observation?.verification ?? (modelRow.missingObservations > 0 ? "一部欠測" : "確認済み");
                    return [modelRow.model, status, observation?.retrievalStatus ?? "観測なし", observation?.verification ?? "観測なし"];
                  })
                } }
              ]
            };
          };
          const metricClass = "min-w-0 px-3 py-3 text-left transition hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 lg:min-h-[104px]";

          return (
            <li key={item.model} className="grid min-w-0 grid-cols-2 gap-px bg-[#DDE5E1] lg:grid-cols-[minmax(170px,1.2fr)_repeat(4,minmax(110px,.8fr))_minmax(150px,1fr)]">
              <ReportDetailButton detail={detail("summary")} showIcon={false} label={item.model + "の期間集計を詳しく見る"} className={"col-span-2 col-start-1 row-start-1 !flex min-h-[76px] w-full items-center justify-start rounded-none px-3 py-3 text-left focus-visible:ring-inset focus-visible:ring-offset-0 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:min-h-[104px]" + selectedBackground}>
                <div className="min-w-0">
                  <ModelIdentity name={item.model} compact />
                  {highlightedProvider === item.model ? <span className="mt-1.5 inline-flex rounded-sm bg-[#DCEFE6] px-2 py-0.5 text-[10px] font-bold text-[#075E44]">選択中</span> : null}
                </div>
              </ReportDetailButton>
              {([
                ["presence", "AI表示率", eligible ? item.aiPresence + "%" : "対象外", item.aiPresence, "col-start-1 row-start-2 lg:col-start-2 lg:row-start-1"],
                ["sov", "AI内シェア", eligible ? item.sov + "%" : "対象外", item.sov, "col-start-2 row-start-2 lg:col-start-3 lg:row-start-1"],
                ["position", "平均掲載位置", item.position, null, "col-start-1 row-start-3 lg:col-start-4 lg:row-start-1"],
                ["citation", "公式サイト引用率", item.citation + "%", item.citation, "col-start-2 row-start-3 lg:col-start-5 lg:row-start-1"]
              ] as const).map(([metric, label, value, bar, placement]) => (
                <ReportDetailButton key={metric} detail={detail(metric)} showIcon={false} label={item.model + "の" + label + "を詳しく見る"} className={metricClass + " " + placement + selectedBackground}>
                  <span className="block w-full">
                    <span className="block text-[10px] font-bold text-[#667085] lg:hidden">{label}</span>
                    <span className="mt-1 block text-lg font-semibold tabular-nums text-[#101828]">{value}</span>
                    {bar !== null && (metric === "citation" || eligible) ? <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#E7EEEB]"><span className="block h-full rounded-full bg-[#0B6B57]" style={{ width: bar + "%" }} /></span> : null}
                    {metric === "position" ? <span className="mt-1 block text-[10px] font-medium text-[#667085]">低いほど上位</span> : null}
                  </span>
                </ReportDetailButton>
              ))}
              <ReportDetailButton detail={detail("coverage")} showIcon={false} label={item.model + "の有効観測と欠測を詳しく見る"} className={"col-span-2 col-start-1 row-start-4 !flex min-h-0 w-full items-center justify-between rounded-none px-3 py-3 text-left focus-visible:ring-inset focus-visible:ring-offset-0 lg:col-span-1 lg:col-start-6 lg:row-start-1 lg:min-h-[104px]" + selectedBackground}>
                <span><span className="block text-[10px] font-bold text-[#667085]">有効 / 予定</span><span className="mt-1 block text-base font-semibold tabular-nums text-[#101828]">{item.validObservations}/{item.expectedObservations}</span></span>
                <span className="text-right"><span className="block text-[10px] font-bold text-[#667085]">欠測</span><span className={"mt-1 block text-sm font-semibold tabular-nums " + (item.missingObservations > 0 ? "text-[#9A5B13]" : "text-[#075E44]")}>{item.missingObservations}件</span></span>
              </ReportDetailButton>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PromptLatestObservationTable({ row, range, reportBase }: { row: PromptRow; range: ReportRange; reportBase: string }) {
  const observations = getPromptLatestObservations(row);
  const promptAnalysisHref = `${reportBase}/prompts/${row.id}?range=${encodeURIComponent(range)}`;

  return (
    <div className="divide-y divide-[#DDE5E1] bg-white">
      {observations.map((observation) => {
        const answerRow = answerRows.find((item) => item.promptId === row.id && item.model === observation.model);
        const answerHref = answerRow
          ? `${reportBase}/conversations/${answerRow.id}?return=${encodeURIComponent(promptAnalysisHref)}`
          : undefined;
        let citationLabel = observation.citationUrl;
        try {
          const citation = new URL(observation.citationUrl);
          citationLabel = `${citation.hostname}${citation.pathname}`;
        } catch {
          citationLabel = observation.citationUrl;
        }
        const observationDetail: ReportDetailPayload = {
                    kicker: "LATEST OBSERVATION",
                    title: `${observation.model}の最新観測`,
                    value: `${observation.retrievalStatus}・${observation.selfListing}`,
                    summary: row.prompt,
                    sections: [
                      { title: "最新日の単一観測", facts: [{ label: "観測ID", value: observation.observationId }, { label: "観測日時", value: observation.observedAt }, { label: "取得状態", value: observation.retrievalStatus, tone: observation.retrievalStatus === "計測失敗" ? "red" : "green" }, { label: "自社掲載", value: observation.selfListing, tone: observation.selfListing === "未掲載" ? "amber" : "default" }, { label: "当日掲載位置", value: observation.position }, { label: "役割", value: observation.role }, { label: "先行競合", value: observation.competitorAhead }, { label: "引用数", value: `${observation.citations}件` }, { label: "自社公式URL引用", value: observation.officialCitation }, { label: "検証状態", value: observation.verification }] },
                      { title: "回答と引用", facts: [{ label: "回答要点", value: observation.answerExcerpt }, { label: "代表引用URL", value: observation.citationUrl }] },
                    ],
                    detailHref: answerHref,
                    detailLabel: "回答本文・引用・判定を開く"
        };

        return (
          <article key={observation.model} className="px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <ReportDetailButton detail={observationDetail} className="w-fit max-w-full justify-start rounded-sm">
                  <ModelIdentity name={observation.model} />
                </ReportDetailButton>
                <p className="mt-1 text-[11px] font-semibold tabular-nums text-[#667085]">{observation.observedAt}<span className="hidden sm:inline">・{observation.observationId}</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DataRichBadge tone={observation.retrievalStatus === "計測失敗" ? "red" : "green"}>{observation.retrievalStatus}</DataRichBadge>
                <DataRichBadge tone={observation.selfListing === "掲載あり" ? "green" : observation.selfListing === "未掲載" ? "amber" : "default"}>{observation.selfListing}</DataRichBadge>
                <DataRichBadge tone={observation.verification.includes("要確認") || observation.selfListing === "未掲載" ? "amber" : observation.verification === "再計測待ち" ? "red" : "green"}>{observation.verification}</DataRichBadge>
                {answerHref ? (
                  <Link href={answerHref} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[#9AB8AA] bg-white px-3 text-[12px] font-bold text-[#075E44] transition hover:border-[#0B6B57] hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                    回答本文・判定を開く
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center text-[11px] font-semibold text-[#667085]">対応する回答データなし</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,.9fr)]">
              <div className="min-w-0 rounded-md border border-[#E3EAE6] bg-[#F8FAF9] p-4">
                <p className="text-[11px] font-bold text-[#667085]">回答要点</p>
                <p className="mt-1.5 text-[13px] font-medium leading-6 text-[#344054]">{observation.answerExcerpt}</p>
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E3EAE6] pt-3 text-[11px] font-semibold text-[#667085]">
                  <span>引用 {observation.citations}件</span>
                  {/^https?:\/\//.test(observation.citationUrl) ? (
                    <a href={observation.citationUrl} target="_blank" rel="noopener noreferrer" title={observation.citationUrl} className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-bold text-[#075E44] underline decoration-[#9AB8AA] underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                      <span className="truncate">{citationLabel}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  ) : <span>{citationLabel}</span>}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#DCE5E1] bg-[#DCE5E1]">
                {[
                  ["当日位置", observation.position],
                  ["役割", observation.role],
                  ["先行競合", observation.competitorAhead],
                  ["自社公式引用", observation.officialCitation]
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 bg-white px-3 py-3">
                    <dt className="text-[10px] font-bold text-[#667085]">{label}</dt>
                    <dd className="mt-1 break-words text-[13px] font-semibold leading-5 text-[#101828]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

          </article>
        );
      })}
    </div>
  );
}

type PromptMetricKind = "coverage" | "presence" | "sov" | "position" | "citation" | "sentiment" | "recognition" | "recommendation" | "competition" | "verification";

type PromptListMetric = {
  kind: PromptMetricKind;
  label: string;
  value: string;
  note?: string;
};

function buildPromptMetricDetail({
  row,
  range,
  metric,
  modelResults,
  observations,
  reportBase,
  returnHref
}: {
  row: PromptRow;
  range: ReportRange;
  metric: PromptListMetric;
  modelResults: ReturnType<typeof getPromptModelResults>;
  observations: ReturnType<typeof getPromptLatestObservations>;
  reportBase: string;
  returnHref: string;
}): ReportDetailPayload {
  const periodDifference = (value: number) => `${value > 0 ? "+" : ""}${value}pt`;
  const modelObservationRows = observations.map((observation) => [
    observation.model,
    observation.retrievalStatus,
    observation.selfListing,
    observation.position,
    observation.role,
    observation.competitorAhead,
    observation.verification
  ]);
  const latestCompetitors = Array.from(new Set(observations.map((item) => item.competitorAhead).filter((name) => name !== "なし" && name !== "判定不可")));
  const competitorRows = latestCompetitors.map((name) => {
    const matches = observations.filter((item) => item.competitorAhead === name);
    return [name, `${matches.length}モデル`, Array.from(new Set(matches.map((item) => item.position))).join(" / ") || "—"];
  });
  const competitorItems = latestCompetitors.length > 0
    ? latestCompetitors.map((name) => {
        const matches = observations.filter((item) => item.competitorAhead === name);
        return { title: name, meta: `${matches.length}モデルで先行`, description: matches.map((item) => `${item.model} ${item.position}`).join(" / ") };
      })
    : [{ title: "先行競合なし", meta: "最新日の観測", description: "契約モデル内で自社より先に掲載された競合はありません。" }];
  const verificationItems = observations.filter((item) => item.retrievalStatus === "計測失敗" || item.verification !== "確認済み").map((item) => ({
    title: item.model,
    meta: item.retrievalStatus === "計測失敗" ? "回答取得失敗" : item.verification,
    description: item.retrievalStatus === "計測失敗" ? "失敗したモデルだけを再計測対象にします。" : `${item.role} / ${item.citationUrl}`
  }));
  const roleItems = observations.map((item) => ({ title: item.role, meta: item.model, description: `${item.selfListing} / ${item.verification}` }));
  const periodDays = Number.parseInt(range, 10) || 30;
  const promptSeed = Number.parseInt(row.id.replace(/\D/g, ""), 10) || 1;
  const averageCitationRate = Math.round(modelResults.reduce((sum, item) => sum + item.citation, 0) / Math.max(1, modelResults.length));
  const competitorCitationRate = Math.min(38, Math.max(0, 100 - averageCitationRate));
  const thirdPartyCitationRate = Math.max(0, 100 - averageCitationRate - competitorCitationRate);
  const averageSov = Math.round(modelResults.reduce((sum, item) => sum + item.sov, 0) / Math.max(1, modelResults.length));
  const sovWeights = [42, 27, 16, 9, 6];
  let summary = metric.note ?? `${range}の${metric.label}を詳しく確認します。`;
  let sections: ReportDetailPayload["sections"];

  if (metric.kind === "coverage") {
    summary = "この質問を予定どおり観測できたかを、モデル別に確認します。欠測は未掲載として数えません。";
    sections = [
      {
        title: "モデル別の観測状況",
        table: {
          columns: ["AIモデル", "有効", "予定", "欠測", "成功率"],
          rows: modelResults.map((item) => [
            item.model,
            `${item.validObservations}件`,
            `${item.expectedObservations}件`,
            `${item.missingObservations}件`,
            `${Math.round((item.validObservations / Math.max(1, item.expectedObservations)) * 100)}%`
          ])
        }
      },
      {
        title: "欠測が集計に与える影響",
        facts: [
          { label: "AI表示率・AI内シェア", value: "欠測を分母から除外して算出" },
          { label: "最新日の状態", value: observations.some((item) => item.retrievalStatus === "計測失敗") ? "計測失敗のモデルあり" : "全モデル取得済み", tone: observations.some((item) => item.retrievalStatus === "計測失敗") ? "amber" : "green" },
          { label: "再計測対象", value: observations.filter((item) => item.retrievalStatus === "計測失敗").map((item) => item.model).join(" / ") || "なし" }
        ]
      }
    ];
  } else if (metric.kind === "presence") {
    summary = "自社が掲載された割合と、未掲載時にどの競合が先行したかを確認します。";
    sections = [
      {
        title: "モデル別のAI表示率",
        table: {
          columns: ["AIモデル", "AI表示率", "前期間差", "有効観測"],
          rows: modelResults.map((item) => [item.model, `${item.aiPresence}%`, periodDifference(item.periodDelta), `${item.validObservations}/${item.expectedObservations}`])
        }
      },
      {
        title: `${range}の未掲載時・先行競合ランキング`,
        variant: "ranking",
        table: {
          columns: ["順位", "競合", "先行回答", "前期間差"],
          rows: competitors.filter((competitor) => !competitor.isPrimary).slice(0, 5).map((competitor, index) => {
            const current = Math.max(1, Math.round((18 - index * 2 + (promptSeed % 3)) * periodDays / 30));
            const delta = ((index + promptSeed) % 3) - 1;
            return [`${index + 1}位`, competitor.name, `${current}回答`, `${delta > 0 ? "+" : ""}${delta}回答`];
          })
        }
      },
      {
        title: "最新日に自社が出なかったモデル",
        table: {
          columns: ["AIモデル", "状態", "先行競合", "回答内の役割"],
          rows: observations.filter((item) => item.retrievalStatus === "取得済み" && item.selfListing === "未掲載").map((item) => [item.model, "有効・未掲載", item.competitorAhead, item.role])
        }
      },
      {
        title: "掲載時の位置",
        table: {
          columns: ["AIモデル", "最新日の掲載位置", "期間平均"],
          rows: modelResults.map((item) => {
            const observation = observations.find((candidate) => candidate.model === item.model);
            return [item.model, observation?.position ?? "—", item.position];
          })
        }
      }
    ];
  } else if (metric.kind === "sov") {
    summary = "この質問の回答内で、自社と競合がどの程度存在感を持ったかを比較します。";
    sections = [
      {
        title: "モデル別のAI内シェア",
        table: {
          columns: ["AIモデル", "AI内シェア", "前期間差", "先行競合"],
          rows: modelResults.map((item) => {
            const observation = observations.find((candidate) => candidate.model === item.model);
            return [item.model, `${item.sov}%`, periodDifference(item.periodDelta), observation?.competitorAhead ?? "—"];
          })
        }
      },
      {
        title: `${range}のブランド別AI内シェア構成`,
        variant: "comparison",
        table: {
          columns: ["ブランド", "AI内シェア", "前期間差"],
          rows: [
            ["Recora", `${averageSov}%`, "+3pt"],
            ...competitors.filter((competitor) => !competitor.isPrimary).slice(0, 5).map((competitor, index) => {
              const share = Math.round(Math.max(0, 100 - averageSov) * sovWeights[index] / 100);
              const delta = ((index + promptSeed) % 3) - 1;
              return [competitor.name, `${share}%`, `${delta > 0 ? "+" : ""}${delta}pt`];
            })
          ]
        }
      },
      {
        title: "この質問でのブランド構成",
        table: {
          columns: ["ブランド", "掲載モデル", "主な掲載位置"],
          rows: [
            ["Recora", `${observations.filter((item) => item.selfListing === "掲載あり").length}モデル`, observations.find((item) => item.selfListing === "掲載あり")?.position ?? "未掲載"],
            ...competitorRows
          ]
        }
      }
    ];
  } else if (metric.kind === "position") {
    summary = "自社が掲載された回答だけを対象に、モデルごとの平均位置と最新日の位置を比較します。";
    sections = [
      {
        title: "モデル別の掲載位置",
        table: {
          columns: ["AIモデル", "期間平均", "最新日", "自社掲載"],
          rows: modelResults.map((item) => {
            const observation = observations.find((candidate) => candidate.model === item.model);
            return [item.model, item.position, observation?.position ?? "—", observation?.selfListing ?? "—"];
          })
        }
      },
      {
        title: "順位の読み方",
        facts: [
          { label: "分母", value: "順位を判定できた自社掲載回答のみ" },
          { label: "本文言及", value: "順位なしとして平均掲載位置から除外" },
          { label: "未掲載・欠測", value: "順位0として扱わず、別状態で表示" }
        ]
      }
    ];
  } else if (metric.kind === "citation") {
    summary = "自社URLが引用された割合と、モデルごとにどのURLが選ばれたかを確認します。";
    sections = [
      {
        title: "モデル別の公式サイト引用率",
        table: {
          columns: ["AIモデル", "公式サイト引用率", "最新日の自社引用", "有効観測"],
          rows: modelResults.map((item) => {
            const observation = observations.find((candidate) => candidate.model === item.model);
            return [item.model, `${item.citation}%`, observation?.officialCitation ?? "—", `${item.validObservations}/${item.expectedObservations}`];
          })
        }
      },
      {
        title: `${range}の引用元構成`,
        variant: "comparison",
        table: {
          columns: ["所有区分", "引用回答", "構成比", "前期間差"],
          rows: [
            ["自社公式", `${Math.round(modelResults.reduce((sum, item) => sum + item.validObservations, 0) * averageCitationRate / 100)}回答`, `${averageCitationRate}%`, "+4pt"],
            ["競合公式", `${Math.round(modelResults.reduce((sum, item) => sum + item.validObservations, 0) * competitorCitationRate / 100)}回答`, `${competitorCitationRate}%`, "-1pt"],
            ["第三者", `${Math.round(modelResults.reduce((sum, item) => sum + item.validObservations, 0) * thirdPartyCitationRate / 100)}回答`, `${thirdPartyCitationRate}%`, "-3pt"]
          ]
        }
      },
      {
        title: "最新日に使われた引用元",
        table: {
          columns: ["AIモデル", "引用URL", "所有区分"],
          rows: observations.map((item) => [
            item.model,
            item.citationUrl,
            item.citationUrl.includes("recora.jp") ? "自社公式" : item.citationUrl === "回答未取得" ? "判定不可" : "第三者・競合"
          ])
        }
      }
    ];
  } else if (metric.kind === "sentiment") {
    summary = "感情ラベルだけでなく、各モデルが自社をどの役割・表現で語ったかを確認します。";
    sections = [
      {
        title: "モデルごとの語られ方",
        table: {
          columns: ["AIモデル", "自社掲載", "語られた役割", "検証状態"],
          rows: observations.map((item) => [item.model, item.selfListing, item.role, item.verification])
        }
      },
      {
        title: `${range}の感情構成`,
        variant: "comparison",
        table: {
          columns: ["感情区分", "構成比", "前期間差"],
          rows: [
            ["ポジティブ", "68%", "+4pt"],
            ["中立", "24%", "-3pt"],
            ["注意・ネガティブ", "8%", "-1pt"]
          ]
        }
      },
      {
        title: "感情判定に影響した表現",
        items: roleItems
      }
    ];
  } else if (metric.kind === "recommendation") {
    summary = "どのモデルで何番目に推薦され、先にどの競合が推薦されたかを確認します。";
    sections = [
      {
        title: "モデル別の推薦順",
        table: {
          columns: ["AIモデル", "自社掲載", "推薦位置", "先行競合"],
          rows: observations.map((item) => [item.model, item.selfListing, item.position, item.competitorAhead])
        }
      },
      {
        title: "第一推薦を取れていない理由",
        items: competitorItems
      }
    ];
  } else if (metric.kind === "competition") {
    summary = "自社より先に出た競合を、モデルと掲載位置ごとに確認します。";
    sections = [
      {
        title: "モデル別の先行競合",
        table: {
          columns: ["AIモデル", "先行競合", "自社の位置", "取得状態"],
          rows: observations.map((item) => [item.model, item.competitorAhead, item.position, item.retrievalStatus])
        }
      },
      {
        title: `${range}の先行競合ランキング`,
        variant: "ranking",
        table: {
          columns: ["順位", "競合", "先行回答", "観測内比率", "前期間差"],
          rows: competitors.filter((competitor) => !competitor.isPrimary).slice(0, 8).map((competitor, index) => {
            const current = Math.max(1, Math.round((18 - index * 1.65 + (promptSeed % 3)) * periodDays / 30));
            const delta = ((index + promptSeed) % 3) - 1;
            return [`${index + 1}位`, competitor.name, `${current}回答`, `${Math.round(current / Math.max(1, modelResults.reduce((sum, item) => sum + item.expectedObservations, 0)) * 100)}%`, `${delta > 0 ? "+" : ""}${delta}回答`];
          })
        }
      },
      {
        title: "ほかに確認したい競合",
        items: competitorItems
      }
    ];
  } else if (metric.kind === "verification") {
    summary = "要確認になったモデルと、確認が必要な主張・引用の種類を分けて表示します。";
    sections = [
      {
        title: "モデル別の検証状態",
        table: {
          columns: ["AIモデル", "取得状態", "検証状態", "代表引用URL"],
          rows: observations.map((item) => [item.model, item.retrievalStatus, item.verification, item.citationUrl])
        }
      },
      {
        title: "確認が必要な内容",
        items: verificationItems.length > 0 ? verificationItems : [{ title: "要確認なし", meta: "最新日の観測", description: "取得済み回答に追加確認が必要な状態はありません。" }]
      }
    ];
  } else {
    summary = "モデルごとの掲載状態と、自社がどの役割で語られたかを確認します。";
    sections = [
      {
        title: metric.label === "語られた役割" ? "モデルごとの役割" : "モデルごとの掲載状態",
        table: {
          columns: ["AIモデル", "取得状態", "自社掲載", "当日位置", "役割", "先行競合", "検証状態"],
          rows: modelObservationRows
        }
      },
      {
        title: "モデル間で共通する説明",
        items: roleItems
      }
    ];
  }

  return {
    kicker: "プロンプト内の選択データ",
    title: `${row.prompt} / ${metric.label}`,
    value: metric.value,
    summary,
    sections,
    detailHref: `${reportBase}/prompts/${row.id}?return=${encodeURIComponent(returnHref)}`,
    detailLabel: "この質問を全画面で分析"
  };
}

function PromptMetricValue({ metric, detail, compact = false }: { metric: PromptListMetric; detail: ReportDetailPayload; compact?: boolean }) {
  return (
    <ReportDetailButton
      detail={detail}
      label={`${metric.label} ${metric.value}の内訳を確認`}
      className={cn("mt-0.5 min-h-8 max-w-full justify-start gap-1 rounded-sm border-b border-dashed border-[#9AB8AA] font-semibold tabular-nums text-[#101828] transition hover:border-[#006B57] hover:text-[#006B57]", compact ? "text-[14px]" : "text-[16px]")}
    >
      <span className="break-words">{metric.value}</span>
    </ReportDetailButton>
  );
}

type PromptLatestObservation = ReturnType<typeof getPromptLatestObservations>[number];

function PromptLatestModelComparison({
  observations,
  modelResults,
  highlightedModel
}: {
  observations: PromptLatestObservation[];
  modelResults: ReturnType<typeof getPromptModelResults>;
  highlightedModel: string | null;
}) {
  const comparisonRows = [
    { label: "取得・掲載", value: (observation: PromptLatestObservation) => observation.retrievalStatus === "計測失敗" ? "計測失敗" : observation.selfListing },
    { label: "最新日の位置", value: (observation: PromptLatestObservation) => observation.position },
    { label: "自社公式引用", value: (observation: PromptLatestObservation) => observation.officialCitation },
    { label: "先行競合", value: (observation: PromptLatestObservation) => observation.competitorAhead },
    { label: "期間AI表示率", value: (observation: PromptLatestObservation) => `${modelResults.find((item) => item.model === observation.model)?.aiPresence ?? 0}%` },
    { label: "期間公式サイト引用率", value: (observation: PromptLatestObservation) => `${modelResults.find((item) => item.model === observation.model)?.citation ?? 0}%` }
  ];

  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-[#DDE5E1] bg-white" aria-label="最新日と選択期間のモデル別比較">
      <div className="hidden min-w-0 md:block" role="table">
        <div className="grid min-w-0 border-b border-[#DDE5E1] bg-[#F5F8F6]" style={{ gridTemplateColumns: `132px repeat(${observations.length},minmax(0,1fr))` }} role="row">
          <div className="px-3 py-3 text-[12px] font-bold text-[#475467]" role="columnheader">比較項目</div>
          {observations.map((observation) => (
            <div key={observation.model} className={cn("min-w-0 border-l border-[#DDE5E1] px-3 py-3", highlightedModel === observation.model && "bg-[#EAF6F0]")} role="columnheader">
              <ModelIdentity name={observation.model} compact />
            </div>
          ))}
        </div>
        {comparisonRows.map((row) => (
          <div key={row.label} className="grid min-w-0 border-b border-[#E5EAE8] last:border-b-0" style={{ gridTemplateColumns: `132px repeat(${observations.length},minmax(0,1fr))` }} role="row">
            <div className="flex min-h-12 items-center bg-[#FBFCFB] px-3 text-[12px] font-bold leading-5 text-[#5D6B66]" role="rowheader">{row.label}</div>
            {observations.map((observation) => (
              <div key={observation.model} className={cn("flex min-h-12 min-w-0 items-center border-l border-[#E5EAE8] px-3 text-[13px] font-semibold leading-5 tabular-nums text-[#101828]", highlightedModel === observation.model && "bg-[#F1F8F5]")} role="cell">
                <span className="min-w-0 break-words">{row.value(observation)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="divide-y divide-[#DDE5E1] md:hidden">
        {observations.map((observation, index) => (
          <details key={observation.model} className="group" open={highlightedModel ? highlightedModel === observation.model : index === 0}>
            <summary className={cn("flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden", highlightedModel === observation.model && "bg-[#F1F8F5]")}>
              <ModelIdentity name={observation.model} compact />
              <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#475467]">{comparisonRows[0].value(observation)}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" /></span>
            </summary>
            <dl className="grid grid-cols-2 gap-px border-t border-[#E5EAE8] bg-[#E5EAE8]">
              {comparisonRows.slice(1).map((row) => (
                <div key={row.label} className="min-w-0 bg-white px-3 py-2.5">
                  <dt className="text-[11px] font-bold leading-5 text-[#667085]">{row.label}</dt>
                  <dd className="mt-0.5 break-words text-[13px] font-semibold leading-5 tabular-nums text-[#101828]">{row.value(observation)}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </div>
  );
}

function PromptTable({ reportBase, returnHref, range, rows = promptRows }: { reportBase: string; returnHref: string; range: ReportRange; rows?: PromptRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-bold text-[#344054]">条件に一致するプロンプトはありません</p>
        <p className="mt-2 text-[12px] font-medium text-[#667085]">検索語または詳細条件を変更してください。</p>
      </div>
    );
  }

  const statusTone = (observation: PromptLatestObservation) => observation.retrievalStatus === "計測失敗"
    ? "border-[#E7B9B1] bg-[#FFF4F1] text-[#B42318]"
    : observation.selfListing === "未掲載"
      ? "border-[#E7CEA7] bg-[#FFF8EA] text-[#9A5B13]"
      : "border-[#B7D2C8] bg-[#EEF7F2] text-[#075E44]";

  return (
    <div role="list" className="divide-y divide-[#D7E0DC] bg-white">
      {rows.map((row) => {
        const promptDetailHref = reportBase + "/prompts/" + row.id + "?return=" + encodeURIComponent(returnHref);
        const modelResults = getPromptModelResults(row, range);
        const latestObservations = getPromptLatestObservations(row);
        const average = (key: "aiPresence" | "sov" | "citation") => modelResults.length === 0 ? 0 : Math.round(modelResults.reduce((sum, item) => sum + item[key], 0) / modelResults.length);
        const positions = modelResults.map((item) => Number.parseFloat(item.position)).filter((value) => Number.isFinite(value));
        const metrics = [
          { label: "AI表示率", value: average("aiPresence") + "%" },
          { label: "AI内シェア", value: average("sov") + "%" },
          { label: "平均掲載位置", value: positions.length === 0 ? "—" : (positions.reduce((sum, value) => sum + value, 0) / positions.length).toFixed(1) + "位" },
          { label: "公式サイト引用率", value: average("citation") + "%" }
        ];

        return (
          <article key={row.id} role="listitem" className="group px-4 py-3.5 transition-colors hover:bg-[#F7FAF8] focus-within:bg-[#F1F7F4] sm:px-5">
            <div className="hidden lg:block">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-5">
                <div className="min-w-0">
                  <Link href={promptDetailHref} aria-label={row.prompt + "を分析"} className="inline-flex max-w-full items-start gap-2 rounded-sm text-[15px] font-bold leading-6 text-[#0F172A] hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                    <span className="break-words">{row.prompt}</span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#0B6B57]" strokeWidth={1.9} aria-hidden="true" />
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-[#667085]">
                    <DataRichBadge tone={row.type === "Non-brand" ? "green" : "default"}>{row.type}</DataRichBadge>
                    <PriorityBadge value={row.importance} />
                    <span>ペルソナ: <strong className="text-[#344054]">{row.persona}</strong></span>
                    <span>トピック: <strong className="text-[#344054]">{row.topic}</strong></span>
                    <span>フェーズ: <strong className="text-[#344054]">{row.phase}</strong></span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-[12px] font-medium leading-5 text-[#5D6B66]">{row.reason}</p>
                </div>
                <Link href={promptDetailHref} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-[#AFC8BD] bg-white px-3 text-[12px] font-bold text-[#075E44] transition hover:border-[#0B6B57] hover:bg-[#EEF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                  分析を開く
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,.82fr)_minmax(540px,1.18fr)] gap-4 border-t border-[#E3EAE6] pt-3">
                <dl className="grid min-w-0 grid-cols-4 divide-x divide-[#E3EAE6]">
                  {metrics.map((item, index) => (
                    <div key={item.label} className={cn("min-w-0 px-3", index === 0 && "pl-0")}>
                      <dt className="text-[10px] font-bold text-[#667085]">{item.label}</dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums text-[#101828]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="min-w-0">
                  <p className="mb-1.5 text-[10px] font-bold text-[#667085]">最新日のAIモデル別状態</p>
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {latestObservations.map((observation) => {
                      const status = observation.retrievalStatus === "計測失敗" ? "取得失敗" : observation.selfListing === "掲載あり" ? "掲載" : observation.selfListing;
                      return (
                        <span key={observation.model} className={"inline-flex min-h-8 min-w-0 items-center gap-2 rounded-md border px-2 py-1 text-[10px] font-bold " + statusTone(observation)}>
                          <ModelIdentity name={observation.model} compact />
                          <span className="shrink-0">{status}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <DataRichBadge tone={row.type === "Non-brand" ? "green" : "default"}>{row.type}</DataRichBadge>
                <PriorityBadge value={row.importance} />
                <DataRichBadge tone="default">{row.topic}</DataRichBadge>
              </div>
              <Link href={promptDetailHref} aria-label={row.prompt + "を分析"} className="mt-2 flex min-h-11 w-full min-w-0 items-start justify-between gap-2 rounded-sm text-[15px] font-bold leading-6 text-[#0F172A] hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                <span className="min-w-0 break-words text-left">{row.prompt}</span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#0B6B57]" strokeWidth={1.9} aria-hidden="true" />
              </Link>
              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#E3EAE6] bg-[#E3EAE6]">
                {[metrics[0], metrics[3]].map((item) => (
                  <div key={item.label} className="min-w-0 bg-white px-3 py-2.5">
                    <dt className="text-[10px] font-bold text-[#667085]">{item.label}</dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums text-[#101828]">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[11px] font-semibold text-[#667085]">
                最新日: 掲載 {latestObservations.filter((item) => item.selfListing === "掲載あり").length}モデル
                {latestObservations.some((item) => item.selfListing === "未掲載") ? "・未掲載あり" : ""}
                {latestObservations.some((item) => item.retrievalStatus === "計測失敗") ? "・取得失敗あり" : ""}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type AnswerRow = (typeof answerRows)[number];

function AnswerTable({
  rows,
  reportBase,
  returnHref,
  highlightedProvider,
  observationDate
}: {
  rows: readonly AnswerRow[];
  reportBase: string;
  returnHref: string;
  highlightedProvider: ReportProvider;
  observationDate: string;
}) {
  const groupedRows = Array.from(rows.reduce((groups, row) => {
    const current = groups.get(row.promptId) ?? [];
    current.push(row);
    groups.set(row.promptId, current);
    return groups;
  }, new Map<string, AnswerRow[]>()).entries());

  const citationUrls = (row: AnswerRow) => {
    const topicIndex = Math.max(0, promptRows.findIndex((prompt) => prompt.id === row.promptId));
    return answerCitationUrls.map((_, index) => answerCitationUrls[(topicIndex + index) % answerCitationUrls.length]);
  };

  const answerDetail = (row: AnswerRow, group: AnswerRow[], focus: "overview" | "listing" | "recommendation" | "competition" | "citation" | "verification"): ReportDetailPayload => {
    const urls = citationUrls(row).slice(0, row.citations);
    const verificationUnavailable = row.verification === "判定不可";
    const focusCopy = {
      overview: { kicker: "AI ANSWER", value: row.listed, summary: "このAIモデルの回答状態と、同じ質問に対する他モデルの違いを確認します。" },
      listing: { kicker: "ANSWER PLACEMENT", value: `${row.listed}・${row.position}`, summary: "このモデルの掲載状態を、同じ質問に対する他モデルの結果と並べて確認します。" },
      recommendation: { kicker: "RECOMMENDATION ORDER", value: row.recommendationOrder, summary: "このモデルでの推薦順を、同じ質問の他モデルと先に推薦された競合まで含めて確認します。" },
      competition: { kicker: "COMPETITOR AHEAD", value: row.competitorAhead, summary: "自社より先に出た競合を、同じ質問のモデル別結果と競合別の出現数に分けて確認します。" },
      citation: { kicker: "ANSWER SOURCES", value: `${row.citations}件`, summary: "この回答で参照されたURLと、同じ質問で他モデルが引用した件数を確認します。" },
      verification: { kicker: "回答の主張確認", value: row.verification, summary: "回答内の主張と根拠の整合状態を、同じ質問のモデル差と分けて確認します。" }
    }[focus];

    return {
      kicker: focusCopy.kicker,
      title: `${row.model} / ${row.prompt}`,
      value: focusCopy.value,
      summary: focusCopy.summary,
      sections: [
        {
          title: "このモデルの回答",
          facts: [
            { label: "AIモデル", value: row.model },
            { label: "自社掲載", value: row.listed, tone: row.listed === "掲載あり" ? "green" : row.listed === "判定不可" ? "red" : "amber" },
            { label: "掲載位置", value: row.position },
            { label: "推薦順", value: row.recommendationOrder },
            { label: "先行競合", value: row.competitorAhead },
            { label: "引用数", value: `${row.citations}件` },
            { label: "主張・根拠の整合", value: row.verification, tone: row.verification === "要確認" ? "amber" : verificationUnavailable ? "red" : "green" }
          ]
        },
        {
          title: "同じ質問のモデル比較",
          table: {
            columns: ["AIモデル", "自社掲載", "位置", "先行競合", "引用", "整合確認"],
            rows: activeModels.map((model) => {
              const comparison = group.find((item) => item.model === model.name);
              return comparison
                ? [model.name, comparison.listed, comparison.position, comparison.competitorAhead, `${comparison.citations}件`, comparison.verification]
                : [model.name, "計測失敗", "—", "判定不可", "—", "確認不可"];
            })
          }
        },
        ...(focus === "recommendation" ? [{
          title: "推薦順のモデル比較",
          variant: "comparison" as const,
          table: {
            columns: ["AIモデル", "自社の推薦順", "先行競合", "掲載状態"],
            rows: activeModels.map((model) => {
              const comparison = group.find((item) => item.model === model.name);
              return comparison
                ? [model.name, comparison.recommendationOrder, comparison.competitorAhead, comparison.listed]
                : [model.name, "—", "判定不可", "計測失敗"];
            })
          }
        }] : []),
        ...(focus === "competition" ? [{
          title: "先行競合の内訳",
          variant: "ranking" as const,
          table: {
            columns: ["競合", "先行したモデル数", "該当AIモデル", "自社の位置"],
            rows: Array.from(new Set(group.map((item) => item.competitorAhead).filter((name) => name !== "なし" && name !== "判定不可"))).map((name) => {
              const matches = group.filter((item) => item.competitorAhead === name);
              return [
                name,
                `${matches.length}モデル`,
                matches.map((item) => item.model).join(" / "),
                matches.map((item) => item.position).join(" / ")
              ];
            })
          }
        }] : []),
        ...(focus === "citation" ? [urls.length ? {
          title: "この回答の引用URL",
          table: {
            columns: ["URL", "所有区分", "回答内で対応する内容"],
            rows: urls.map((url) => [
              url,
              url.includes("recora.jp") ? "自社公式" : url.includes("trailbase.io") ? "競合公式" : "第三者",
              url.includes("research") ? "調査・市場データ" : "製品定義・比較理由"
            ])
          }
        } : { title: "この回答の引用URL", items: [{ title: "該当なし", meta: "この回答に引用URLはありません" }] }] : []),
        ...(focus === "verification" ? [{
          title: "確認する主張",
          items: [
            { title: "製品カテゴリと機能範囲", meta: verificationUnavailable ? "回答未取得のため照合対象外" : row.verification === "要確認" ? "公式情報との照合が必要" : "重大な差分なし" },
            { title: "料金・導入期間", meta: verificationUnavailable ? "再計測後に確認" : row.verification === "要確認" ? "古い情報や断定を確認" : "確認済み" },
            { title: "引用に対応する説明", meta: verificationUnavailable ? "回答未取得" : `${row.citations}件の引用を確認` }
          ]
        }] : [])
      ],
      detailHref: `${reportBase}/conversations/${row.id}?date=${encodeURIComponent(observationDate)}&return=${encodeURIComponent(returnHref)}`,
      detailLabel: `${row.model}の回答本文を開く`
    };
  };

  const metricRows: { label: string; focus?: "listing" | "recommendation" | "competition" | "citation" | "verification"; render: (row: AnswerRow) => string }[] = [
    { label: "掲載・位置", focus: "listing", render: (row) => `${row.listed} / ${row.position}` },
    { label: "推薦順", focus: "recommendation", render: (row) => row.recommendationOrder },
    { label: "先行競合", focus: "competition", render: (row) => row.competitorAhead },
    { label: "引用数", focus: "citation", render: (row) => `${row.citations}件` },
    { label: "主張・根拠の整合", focus: "verification", render: (row) => row.verification }
  ];

  return (
    <div className="divide-y divide-[#DDE5E1] bg-white">
      {groupedRows.map(([promptId, group]) => (
        <article key={promptId} className="min-w-0 px-4 py-5 sm:px-5">
          <div className="mb-4 flex min-w-0 flex-col gap-2 border-l-2 border-[#0B6B57] pl-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.06em] text-[#075E44]">固定質問 {promptId.toUpperCase()}</p>
              <h3 className="mt-1 break-words text-[15px] font-semibold leading-6 text-[#101828]">{group[0]?.prompt}</h3>
            </div>
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[#667085]">取得成功 {group.filter((row) => row.retrievalStatus === "取得済み").length}モデル{group.some((row) => row.retrievalStatus !== "取得済み") ? "・取得失敗あり" : ""}</span>
          </div>
          <div className="hidden min-w-0 overflow-hidden rounded-md border border-[#DDE5E1] lg:block" role="table" aria-label={`${group[0]?.prompt}のモデル比較`}>
            <div className="grid min-w-0 border-b border-[#DDE5E1] bg-[#F5F8F6]" style={{ gridTemplateColumns: `156px repeat(${activeModels.length},minmax(0,1fr))` }} role="row">
              <div className="flex min-h-16 items-center px-3 text-[12px] font-bold text-[#475467]" role="columnheader">比較項目</div>
              {activeModels.map((model) => {
                const row = group.find((item) => item.model === model.name);
                return (
                  <div key={model.name} className={cn("min-w-0 border-l border-[#DDE5E1] px-3 py-3", highlightedProvider === model.name && "bg-[#EAF6F0]")} role="columnheader">
                    {row ? (
                      <ReportDetailButton detail={answerDetail(row, group, "overview")} className="w-full justify-between rounded-sm" label={`${row.model}の回答概要を開く`}>
                        <ModelIdentity name={model.name} compact />
                      </ReportDetailButton>
                    ) : <ModelIdentity name={model.name} compact />}
                  </div>
                );
              })}
            </div>
            {metricRows.map((metric) => (
              <div key={metric.label} className="grid min-w-0 border-b border-[#E5EAE8] last:border-b-0" style={{ gridTemplateColumns: `156px repeat(${activeModels.length},minmax(0,1fr))` }} role="row">
                <div className="flex min-h-14 items-center bg-[#FBFCFB] px-3 text-[12px] font-bold leading-5 text-[#5D6B66]" role="rowheader">{metric.label}</div>
                {activeModels.map((model) => {
                  const row = group.find((item) => item.model === model.name);
                  return (
                    <div key={model.name} className={cn("flex min-h-14 min-w-0 items-center border-l border-[#E5EAE8] px-3 text-[13px] font-semibold leading-5 tabular-nums text-[#101828]", highlightedProvider === model.name && "bg-[#F1F8F5]")} role="cell">
                      {!row ? <DataRichBadge tone="red">計測失敗</DataRichBadge> : metric.focus ? (
                        <ReportDetailButton detail={answerDetail(row, group, metric.focus)} showIcon={false} className="w-full justify-start rounded-sm border-b border-dashed border-[#9AB8AA] text-left hover:text-[#075E44]">
                          <span className="min-w-0 break-words">{metric.render(row)}</span>
                        </ReportDetailButton>
                      ) : <span className="min-w-0 break-words">{metric.render(row)}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="grid min-w-0" style={{ gridTemplateColumns: `156px repeat(${activeModels.length},minmax(0,1fr))` }} role="row">
              <div className="flex min-h-14 items-center bg-[#FBFCFB] px-3 text-[12px] font-bold leading-5 text-[#5D6B66]" role="rowheader">回答本文</div>
              {activeModels.map((model) => {
                const row = group.find((item) => item.model === model.name);
                return (
                  <div key={model.name} className={cn("flex min-h-14 min-w-0 items-center border-l border-[#E5EAE8] px-3", highlightedProvider === model.name && "bg-[#F1F8F5]")} role="cell">
                    {row ? (
                      <Link href={`${reportBase}/conversations/${row.id}?date=${encodeURIComponent(observationDate)}&return=${encodeURIComponent(returnHref)}`} className="inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-sm text-[12px] font-bold text-[#075E44] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                        全文を開く
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </Link>
                    ) : <span className="text-[12px] font-semibold text-[#98A2B3]">取得なし</span>}
                  </div>
                );
              })}
            </div>          </div>
          <div className="space-y-2 lg:hidden">
            {activeModels.map((model, index) => {
              const row = group.find((item) => item.model === model.name);
              if (!row) return (
                <div key={model.name} className="flex min-h-12 items-center justify-between border border-[#DDE5E1] bg-white px-3">
                  <ModelIdentity name={model.name} compact />
                  <DataRichBadge tone="red">計測失敗</DataRichBadge>
                </div>
              );
              return (
                <details key={model.name} className="group overflow-hidden border border-[#DDE5E1] bg-white" open={highlightedProvider === model.name || (highlightedProvider === "全モデル" && index === 0)}>
                  <summary className={cn("flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden", highlightedProvider === model.name && "bg-[#F1F8F5]")}>
                    <ModelIdentity name={model.name} compact />
                    <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#475467]">{row.listed}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" /></span>
                  </summary>
                  <div className="border-t border-[#E5EAE8] p-3">
                    <dl className="grid grid-cols-2 gap-2">
                      {metricRows.map((metric) => (
                        <div key={metric.label} className="min-w-0 border border-[#E5EAE8] bg-[#FAFCFB] px-3 py-2">
                          <dt className="text-[11px] font-bold leading-5 text-[#667085]">{metric.label}</dt>
                          <dd className="mt-0.5 break-words text-[13px] font-semibold leading-5 text-[#101828]">{metric.render(row)}</dd>
                        </div>
                      ))}
                    </dl>
                    <Link href={`${reportBase}/conversations/${row.id}?date=${encodeURIComponent(observationDate)}&return=${encodeURIComponent(returnHref)}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#9AB8AA] bg-white px-3 text-[12px] font-bold text-[#075E44]">
                      回答本文を開く
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </details>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}

function PublishedRecommendationChangeTable({ reportBase }: { reportBase: string }) {
  const metrics = [
    {
      id: "r01",
      label: "比較ページに選定基準表を追加",
      metric: "AI表示率",
      values: [42, 45, 48, 51],
      observations: 336,
      models: [[43, 46, 49, 52], [40, 43, 46, 49], [42, 45, 48, 51], [43, 46, 49, 52]]
    },
    {
      id: "r02",
      label: "調査データページを新規作成",
      metric: "公式サイト引用率",
      values: [24, 25, 29, 31],
      observations: 224,
      models: [[25, 26, 30, 32], [22, 23, 27, 29], [27, 28, 32, 35], [22, 23, 27, 28]]
    },
    {
      id: "r03",
      label: "料金・導入期間を最新化",
      metric: "公式事実一致率",
      values: [81, 86, 90, 92],
      observations: 168,
      models: [[80, 86, 90, 93], [82, 87, 90, 92], [79, 84, 89, 91], [83, 87, 91, 92]]
    }
  ];
  const timepointLabels = ["公開前7日", "公開後7日", "公開後14日", "公開後30日"];
  const returnHref = reportBase + "/recommendations#published-recommendation-changes";
  const formatDelta = (value: number) => (value > 0 ? "+" : "") + value + "pt";

  return (
    <div className="bg-white">
      <div className="border-b border-[#D8E1DD] bg-[#F5F8F6] px-5 py-3 text-[11px] font-bold tracking-[0.08em] text-[#667085]">公開済み提案</div>
      <div role="list" className="divide-y divide-[#D8E1DD]">
        {metrics.map((row) => {
          const baseline = row.values[0];
          const current = row.values[3];
          const totalDelta = current - baseline;
          const minValue = Math.min(...row.values) - 1;
          const maxValue = Math.max(...row.values) + 1;
          const range = Math.max(1, maxValue - minValue);
          const points = row.values.map((value, index) => ({
            x: 5 + index * 30,
            y: 52 - ((value - minValue) / range) * 38
          }));
          const detail = detailWithReturnHref({
            kicker: "公開後の観測変化",
            title: row.label,
            value: formatDelta(totalDelta) + " / 公開後30日",
            summary: row.metric + "は公開前7日の" + baseline + "%から公開後30日の" + current + "%へ変化しています。公開前後を同じ指標で並べた観測であり、提案による因果を断定するものではありません。",
            sections: [
              {
                title: "4時点の変化",
                description: "公開前7日を比較基準に、公開後の3時点がどこまで変化したかを確認します。",
                facts: row.values.map((value, index) => ({
                  label: timepointLabels[index],
                  value: value + "%・" + (index === 0 ? "比較基準" : formatDelta(value - baseline))
                }))
              },
              {
                title: activeModels.length > 1 ? "AIモデル別の変化" : activeModels[0].name + "の変化",
                description: activeModels.length > 1 ? "契約中のAIモデルごとに、公開前7日と公開後30日の差を並べます。" : "契約中のAIモデルについて、公開前7日と公開後30日の差を表示します。",
                facts: activeModels.map((model, index) => {
                  const series = row.models[index] ?? row.values;
                  return {
                    label: model.name,
                    value: series[0] + "% → " + series[3] + "%（" + formatDelta(series[3] - series[0]) + "）"
                  };
                })
              },
              {
                title: "変化の読み取り",
                items: [
                  { title: "最初に変化が見えた時点", meta: "公開後7日 " + row.values[1] + "%", description: "公開前との差は" + formatDelta(row.values[1] - baseline) + "です。" },
                  { title: "30日までの変化", meta: row.values[1] + "% → " + current + "%", description: "公開後7日から30日までにさらに" + formatDelta(current - row.values[1]) + "変化しています。" },
                  { title: "観測範囲", meta: row.observations + "件", description: "公開前後で同じ観測条件にそろえた回答を対象にしています。" }
                ]
              }
            ],
            detailHref: reportBase + "/recommendations/" + row.id,
            detailLabel: "施策の受入条件と観測を分析"
          }, returnHref);

          return (
            <article key={row.id} role="listitem" className="grid min-w-0 gap-4 bg-white px-4 py-5 sm:px-5 lg:grid-cols-[minmax(220px,1fr)_minmax(390px,1.8fr)_minmax(190px,.72fr)] lg:items-center lg:gap-5">
              <div className="min-w-0">
                <DataRichBadge>{row.metric}</DataRichBadge>
                <h3 className="mt-2 break-words text-[15px] font-bold leading-6 text-[#0F172A]">{row.label}</h3>
                <p className="mt-1 text-[11px] font-semibold text-[#667085]">公開前7日を基準に比較</p>
              </div>
              <ReportDetailButton detail={detail} showIcon={false} className="w-full rounded-md border border-[#DDE5E1] bg-[#FBFCFB] p-3 hover:border-[#9FBAB0] hover:bg-[#F4F8F6]">
                <span className="block w-full min-w-0">
                  <span className="flex items-center justify-between gap-3 text-[11px] font-bold text-[#667085]">
                    <span>公開前後の変化</span>
                    <span className="inline-flex items-center gap-1 text-[#075E44]">内訳を見る<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                  </span>
                  <svg viewBox="0 0 100 64" preserveAspectRatio="none" className="mt-2 h-16 w-full" role="img" aria-label={row.metric + "は" + baseline + "%から" + current + "%へ変化"}>
                    <line x1="5" y1={points[0].y} x2="95" y2={points[0].y} stroke="#C7D2CC" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                    <polyline points={points.map((point) => point.x + "," + point.y).join(" ")} fill="none" stroke="#08705A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    {points.map((point, index) => <circle key={timepointLabels[index]} cx={point.x} cy={point.y} r="2.6" fill="white" stroke="#08705A" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
                  </svg>
                  <span className="mt-2 grid grid-cols-4 gap-1">
                    {row.values.map((value, index) => (
                      <span key={timepointLabels[index]} className="min-w-0 text-center">
                        <span className="block text-[9px] font-semibold leading-4 text-[#667085]">{timepointLabels[index].replace("公開", "")}</span>
                        <span className="block text-[13px] font-bold tabular-nums text-[#101828]">{value}%</span>
                      </span>
                    ))}
                  </span>
                </span>
              </ReportDetailButton>
              <dl className="grid min-w-0 grid-cols-3 divide-x divide-[#DDE5E1] rounded-md border border-[#DDE5E1] bg-white lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
                <div className="min-w-0 px-3 py-2.5"><dt className="text-[9px] font-bold text-[#667085]">公開後30日</dt><dd className="mt-1 text-[18px] font-bold tabular-nums text-[#101828]">{current}%</dd></div>
                <div className="min-w-0 px-3 py-2.5"><dt className="text-[9px] font-bold text-[#667085]">公開前との差</dt><dd className="mt-1 text-[18px] font-bold tabular-nums text-[#067647]">{formatDelta(totalDelta)}</dd></div>
                <div className="min-w-0 px-3 py-2.5"><dt className="text-[9px] font-bold text-[#667085]">観測数</dt><dd className="mt-1 text-[18px] font-bold tabular-nums text-[#101828]">{row.observations}<span className="ml-0.5 text-[11px]">件</span></dd></div>
              </dl>
            </article>
          );
        })}
      </div>
      <p className="border-t border-[#D8E1DD] bg-[#F8FAF9] px-4 py-3 text-[11px] font-semibold leading-5 text-[#667085]">公開前後の観測値を並べたもので、提案による因果や効果を保証するものではありません。</p>
    </div>
  );
}
function ContentGapAnalysis({ reportBase }: { reportBase: string }) {
  const gaps = [
    {
      id: "gap-compare",
      actionId: "r01",
      category: "比較情報",
      title: "選定基準の比較表が不足",
      summary: "比較検討の質問需要に対して、自社ページに判断軸を横並びで確認できる情報が足りません。",
      observations: 42,
      questions: 18,
      models: 3,
      days: 14,
      page: "/compare/geo-tools",
      pageState: "既存ページに情報不足",
      questionExamples: [
        { title: "GEOツールを比較するときの選定基準は？", meta: "マーケ責任者・競合比較", description: "比較項目は回答に出る一方、自社ページが根拠として使われていません。" },
        { title: "AI検索可視化ツールで見るべき指標は？", meta: "導入担当・機能比較", description: "上位競合の比較説明が先に掲載されています。" },
        { title: "導入前に比較すべき条件は？", meta: "決裁者・導入条件", description: "料金・計測範囲・運用条件を同じ粒度で確認できません。" }
      ],
      differences: [
        { title: "上位競合2社", meta: "選定基準を表で提示", description: "機能・対象AI・導入条件を同じ画面で比較できる状態です。" },
        { title: "Recoraの現在ページ", meta: "機能説明が中心", description: "比較質問への回答に必要な判断軸が分散しています。" }
      ]
    },
    {
      id: "gap-research",
      actionId: "r02",
      category: "一次データ",
      title: "引用されやすい調査データが不足",
      summary: "数値や調査方法を求める質問に対して、自社が一次情報として引用される受け皿がありません。",
      observations: 28,
      questions: 12,
      models: 2,
      days: 11,
      page: "該当ページなし",
      pageState: "新規の受け皿が必要",
      questionExamples: [
        { title: "日本企業のAI検索利用率は？", meta: "経営者・市場動向", description: "第三者の調査記事だけが引用されています。" },
        { title: "AI表示率の業界平均は？", meta: "マーケ責任者・ベンチマーク", description: "自社独自データの定義と更新日を示すページがありません。" },
        { title: "GEO施策の効果はどう測る？", meta: "導入担当・効果測定", description: "測定方法の根拠が外部ソースへ流れています。" }
      ],
      differences: [
        { title: "上位引用元4ドメイン", meta: "調査方法・母数・更新日を明記", description: "AI回答が検証できる一次データとして扱っています。" },
        { title: "Recoraの現在ページ", meta: "独立した調査ページなし", description: "プロダクト説明と調査根拠を分けて参照できません。" }
      ]
    },
    {
      id: "gap-third-party",
      actionId: "r16",
      category: "第三者根拠",
      title: "導入事例の第三者評価が不足",
      summary: "導入実績を確認する質問に対して、自社説明だけでなく第三者が評価した根拠が足りません。",
      observations: 24,
      questions: 9,
      models: 3,
      days: 9,
      page: "/cases",
      pageState: "第三者の裏付けが不足",
      questionExamples: [
        { title: "実際に導入した企業の評価は？", meta: "決裁者・信頼性", description: "自社事例はあるものの、第三者の評価が回答に出ていません。" },
        { title: "同規模企業での導入実績は？", meta: "導入担当・適合性", description: "業種・規模の条件が不足し、競合事例が先に掲載されます。" },
        { title: "導入後の運用負荷は？", meta: "現場責任者・運用", description: "利用者視点のレビューや継続利用の根拠が不足しています。" }
      ],
      differences: [
        { title: "上位競合3社", meta: "第三者記事とレビューが併記", description: "自社事例以外の評価経路が回答に現れています。" },
        { title: "Recoraの現在ページ", meta: "自社事例が中心", description: "評価者・業種・利用期間を第三者情報と照合できません。" }
      ]
    }
  ];
  const maxObservations = Math.max(...gaps.map((gap) => gap.observations));
  const returnHref = reportBase + "/recommendations#content-gaps";

  return (
    <div className="bg-white">
      <div className="hidden grid-cols-[minmax(260px,1.25fr)_minmax(260px,1fr)_minmax(230px,.9fr)_minmax(190px,.75fr)] border-b border-[#D8E1DD] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid">
        {["不足している領域", "不足が観測された量", "影響範囲", "現在の受け皿"].map((label) => <div key={label} className="flex min-h-11 items-center px-4">{label}</div>)}
      </div>
      <div role="list" className="divide-y divide-[#D8E1DD]">
        {gaps.map((gap, index) => {
          const modelCount = Math.min(gap.models, activeModels.length);
          const detail = detailWithReturnHref({
            kicker: "コンテンツギャップ",
            title: gap.title,
            value: gap.observations + "観測",
            summary: gap.summary,
            sections: [
              {
                title: "不足の範囲",
                description: "不足が繰り返し確認された質問・AIモデル・継続日数と、現在の受け皿をまとめます。",
                facts: [
                  { label: "不足の種類", value: gap.category },
                  { label: "対象質問", value: gap.questions + "質問" },
                  { label: "AIモデル", value: modelCount + "モデル" },
                  { label: "継続", value: gap.days + "日" },
                  { label: "現在のページ", value: gap.page },
                  { label: "ページの状態", value: gap.pageState }
                ]
              },
              {
                title: `代表質問 ${gap.questionExamples.length}件`,
                description: `対象${gap.questions}質問のうち、代表的な${gap.questionExamples.length}件を表示しています。`,
                items: gap.questionExamples.map((item) => ({ ...item, meta: scopeModelCountText(item.meta) }))
              },
              {
                title: "ほかの質問を探す",
                items: [
                  {
                    title: "プロンプト一覧を検索",
                    description: "質問文を検索し、ペルソナ・トピック・モデル別の観測状況で絞り込めます。",
                    href: reportBase + "/prompts#prompt-search",
                    linkLabel: "検索欄を開く"
                  }
                ]
              },
              {
                title: "現在の情報との差",
                items: gap.differences
              }
            ],
            detailHref: reportBase + "/recommendations/" + gap.actionId,
            detailLabel: "関連する改善候補を分析"
          }, returnHref);

          return (
            <article key={gap.id} role="listitem">
              <ReportDetailButton detail={detail} showIcon={false} className="w-full rounded-none px-4 py-4 hover:bg-[#F4F8F6] sm:px-5">
                <span className="grid w-full min-w-0 gap-4 text-left lg:grid-cols-[minmax(260px,1.25fr)_minmax(260px,1fr)_minmax(230px,.9fr)_minmax(190px,.75fr)] lg:items-center">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#BCD0C8] bg-[#F0F7F4] text-[11px] font-bold tabular-nums text-[#075E44]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <DataRichBadge>{gap.category}</DataRichBadge>
                      <span className="mt-2 block break-words text-[14px] font-bold leading-6 text-[#0F172A]">{gap.title}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#075E44]">内訳を見る<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-end justify-between gap-3">
                      <span className="text-[11px] font-bold text-[#667085] lg:hidden">不足が観測された量</span>
                      <span className="text-[18px] font-bold tabular-nums text-[#101828]">{gap.observations}<span className="ml-0.5 text-[11px]">観測</span></span>
                    </span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#E7EEEA]" role="progressbar" aria-label={gap.title + "の観測量"} aria-valuenow={gap.observations} aria-valuemin={0} aria-valuemax={maxObservations}>
                      <span className="block h-full rounded-full bg-[#08705A]" style={{ width: (gap.observations / maxObservations * 100) + "%" }} />
                    </span>
                  </span>
                  <span className="grid grid-cols-3 divide-x divide-[#DDE5E1] rounded-md border border-[#DDE5E1] bg-[#FBFCFB]">
                    <span className="min-w-0 px-2.5 py-2"><span className="block text-[9px] font-bold text-[#667085]">質問</span><span className="mt-1 block text-[13px] font-bold tabular-nums text-[#101828]">{gap.questions}</span></span>
                    <span className="min-w-0 px-2.5 py-2"><span className="block text-[9px] font-bold text-[#667085]">AIモデル</span><span className="mt-1 block text-[13px] font-bold tabular-nums text-[#101828]">{modelCount}</span></span>
                    <span className="min-w-0 px-2.5 py-2"><span className="block text-[9px] font-bold text-[#667085]">継続</span><span className="mt-1 block text-[13px] font-bold tabular-nums text-[#101828]">{gap.days}日</span></span>
                  </span>
                  <span className="min-w-0">
                    <span className={"inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-bold " + (gap.page === "該当ページなし" ? "border-[#E8C88C] bg-[#FFF8E7] text-[#8A4B08]" : "border-[#BCD0C8] bg-[#F0F7F4] text-[#075E44]")}>{gap.pageState}</span>
                    <span className="mt-2 block break-all font-mono text-[11px] font-semibold text-[#475467]">{gap.page}</span>
                  </span>
                </span>
              </ReportDetailButton>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function PageImprovementPortfolio({ reportBase }: { reportBase: string }) {
  const pages = [
    {
      path: "/compare",
      type: "既存ページ改善",
      title: "比較軸と導入条件を追加",
      metric: "AI表示率・平均掲載位置",
      observations: 68,
      questions: 28,
      models: 3,
      actionCount: 3,
      highPriorityCount: 2,
      primaryActionId: "r01",
      actions: [
        { actionId: "r01", title: "選定基準表を追加", meta: "優先度 高", description: "機能・対象AI・導入条件を同じ粒度で比較できる表を追加します。" },
        { actionId: "r04", title: "導入条件の一覧を追加", meta: "優先度 高", description: "料金・計測範囲・開始条件を一画面で確認できるようにします。" },
        { actionId: "r08", title: "判断軸別FAQを追加", meta: "優先度 中", description: "比較検討で繰り返される質問に、判断軸ごとの回答を用意します。" }
      ],
      evidence: [
        { title: "比較検討で競合が先行", meta: "42観測・3モデル", description: "自社が掲載されても、選定理由の説明は競合が先に出ています。" },
        { title: "導入条件の説明不足", meta: "18質問", description: "料金・計測対象・運用条件を同じ回答内で確認できません。" }
      ]
    },
    {
      path: "/research",
      type: "新規ページ作成",
      title: "AI検索調査を独立ページ化",
      metric: "公式サイト引用率",
      observations: 45,
      questions: 16,
      models: 2,
      actionCount: 2,
      highPriorityCount: 1,
      primaryActionId: "r02",
      actions: [
        { actionId: "r02", title: "調査データページを新規作成", meta: "優先度 高", description: "調査結果・母数・更新日を独立したURLで提示します。" },
        { actionId: "r09", title: "調査方法ページを整備", meta: "優先度 中", description: "集計条件と指標定義を、結果ページから参照できるようにします。" }
      ],
      evidence: [
        { title: "自社未引用の調査需要", meta: "28観測・2モデル", description: "数値を求める質問で第三者調査だけが引用されています。" },
        { title: "調査方法の参照先がない", meta: "12質問", description: "母数・期間・指標定義を検証できる自社ページがありません。" }
      ]
    },
    {
      path: "/pricing",
      type: "既存ページ改善",
      title: "最新プラン・適用条件を更新",
      metric: "公式事実一致率",
      observations: 30,
      questions: 10,
      models: 2,
      actionCount: 2,
      highPriorityCount: 1,
      primaryActionId: "r06",
      actions: [
        { actionId: "r06", title: "更新日と適用条件を明記", meta: "優先度 高", description: "いつの条件か、どの契約へ適用されるかを明確にします。" },
        { actionId: "r03", title: "料金と導入期間の説明を最新化", meta: "優先度 中", description: "現在のプラン内容と導入期間へ説明を更新します。" }
      ],
      evidence: [
        { title: "古い料金説明が残る", meta: "6回答・2モデル", description: "Branded回答で現在と異なる料金条件が確認されています。" },
        { title: "適用条件の欠落", meta: "10質問", description: "プラン差と適用範囲が回答だけでは判別できません。" }
      ]
    }
  ];
  const maxObservations = Math.max(...pages.map((page) => page.observations));
  const returnHref = reportBase + "/recommendations#page-improvement-proposals";

  return (
    <div className="bg-white">
      <div className="hidden grid-cols-[minmax(0,.9fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,.72fr)] border-b border-[#D8E1DD] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid">
        {["対象ページ", "主な改善内容", "観測根拠", "施策数・優先度"].map((label) => <div key={label} className="flex min-h-11 items-center px-4">{label}</div>)}
      </div>
      <div role="list" className="divide-y divide-[#D8E1DD]">
        {pages.map((page) => {
          const modelCount = Math.min(page.models, activeModels.length);
          const detail = detailWithReturnHref({
            kicker: "ページ別改善提案",
            title: page.path + " の改善内容",
            value: page.actionCount + "施策",
            summary: page.title + "。同じページを対象にする改善候補をまとめ、ページ単位で優先度と観測根拠を確認します。",
            sections: [
              {
                title: "ページ単位の整理",
                facts: [
                  { label: "対象ページ", value: page.path },
                  { label: "ページ区分", value: page.type },
                  { label: "主な対象指標", value: page.metric },
                  { label: "関連する観測", value: page.observations + "件" },
                  { label: "対象質問", value: page.questions + "質問" },
                  { label: "AIモデル", value: modelCount + "モデル" },
                  { label: "優先度 高", value: page.highPriorityCount + "施策" }
                ]
              },
              {
                title: "このページで行う施策",
                items: page.actions.map(({ actionId, ...action }) => ({
                  ...action,
                  href: reportBase + "/recommendations/" + actionId + "?return=" + encodeURIComponent(returnHref),
                  linkLabel: "この施策を分析"
                }))
              },
              {
                title: "根拠になった観測",
                items: page.evidence.map((item) => ({ ...item, meta: scopeModelCountText(item.meta) }))
              }
            ],
            detailHref: reportBase + "/recommendations/" + page.primaryActionId,
            detailLabel: "最優先施策「" + page.actions[0].title + "」を分析"
          }, returnHref);

          return (
            <article key={page.path} role="listitem">
              <ReportDetailButton detail={detail} showIcon={false} className="w-full rounded-none px-4 py-4 hover:bg-[#F4F8F6] sm:px-5">
                <span className="grid w-full min-w-0 gap-4 text-left lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,.72fr)] lg:items-center">
                  <span className="min-w-0">
                    <DataRichBadge>{page.type}</DataRichBadge>
                    <span className="mt-2 block break-all font-mono text-[14px] font-bold text-[#075E44]">{page.path}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#075E44]">内訳を見る<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold text-[#667085] lg:hidden">主な改善内容</span>
                    <span className="mt-1 block break-words text-[14px] font-bold leading-6 text-[#0F172A] lg:mt-0">{page.title}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-[#667085]">{page.metric}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-end justify-between gap-3">
                      <span className="text-[11px] font-bold text-[#667085] lg:hidden">関連する観測</span>
                      <span className="text-[18px] font-bold tabular-nums text-[#101828]">{page.observations}<span className="ml-0.5 text-[11px]">件</span></span>
                    </span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#E7EEEA]" role="progressbar" aria-label={page.path + "に関連する観測数"} aria-valuenow={page.observations} aria-valuemin={0} aria-valuemax={maxObservations}>
                      <span className="block h-full rounded-full bg-[#08705A]" style={{ width: (page.observations / maxObservations * 100) + "%" }} />
                    </span>
                    <span className="mt-2 block text-[10px] font-semibold text-[#667085]">{page.questions}質問・{modelCount}モデル</span>
                  </span>
                  <span className="grid grid-cols-2 divide-x divide-[#DDE5E1] rounded-md border border-[#DDE5E1] bg-[#FBFCFB]">
                    <span className="min-w-0 px-3 py-2.5"><span className="block text-[9px] font-bold text-[#667085]">施策数</span><span className="mt-1 block text-[18px] font-bold tabular-nums text-[#101828]">{page.actionCount}</span></span>
                    <span className="min-w-0 px-3 py-2.5"><span className="block text-[9px] font-bold text-[#667085]">優先度 高</span><span className="mt-1 block text-[18px] font-bold tabular-nums text-[#9A6700]">{page.highPriorityCount}</span></span>
                  </span>
                </span>
              </ReportDetailButton>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function TrustEvidenceActionPortfolio({ reportBase }: { reportBase: string }) {
  const materials = [
    {
      id: "comparison",
      name: "比較記事",
      role: "競合比較の判断材料",
      observations: 42,
      questions: 18,
      models: 3,
      currentState: "上位4記事で自社説明が不足",
      missing: "選定基準・導入条件",
      route: "第三者獲得",
      primaryActionId: "r15",
      questionExamples: [
        { title: "GEOツールの比較基準は？", meta: "比較検討・18質問", description: "第三者の比較記事が回答の判断材料として使われています。" },
        { title: "Recoraと競合の違いは？", meta: "決裁者・3モデル", description: "自社の選定理由と導入条件が十分に引用されていません。" }
      ],
      currentPaths: [
        { title: "現在の経路", meta: "第三者の比較記事4件", description: "競合の説明はある一方、Recoraの比較軸が薄い状態です。" },
        { title: "補う内容", meta: "選定基準・導入条件", description: "第三者が検証できる一次資料と比較材料を提供します。" }
      ]
    },
    {
      id: "research",
      name: "調査データ",
      role: "数値・市場動向の一次根拠",
      observations: 28,
      questions: 12,
      models: 2,
      currentState: "独立した調査ページなし",
      missing: "母数・調査方法・更新日",
      route: "自社制作",
      primaryActionId: "r02",
      questionExamples: [
        { title: "日本企業のAI検索利用率は？", meta: "市場動向・12質問", description: "外部調査だけが回答の根拠として引用されています。" },
        { title: "AI表示率の業界平均は？", meta: "ベンチマーク・2モデル", description: "自社データの定義と更新日を参照できません。" }
      ],
      currentPaths: [
        { title: "現在の経路", meta: "第三者調査4ドメイン", description: "AI回答は調査方法を確認できる外部ページを引用しています。" },
        { title: "補う内容", meta: "結果ページと方法ページ", description: "数値・母数・期間・更新日を独立したURLで公開します。" }
      ]
    },
    {
      id: "case-study",
      name: "導入事例",
      role: "導入実績と適合性の証明",
      observations: 24,
      questions: 9,
      models: 3,
      currentState: "自社事例2件",
      missing: "業種・規模・利用期間",
      route: "自社制作",
      primaryActionId: "r10",
      questionExamples: [
        { title: "同規模企業での導入実績は？", meta: "適合性・9質問", description: "業種と規模を判断できる条件が回答に不足しています。" },
        { title: "導入後の運用負荷は？", meta: "現場責任者・3モデル", description: "利用期間と運用体制を確認できる事例が足りません。" }
      ],
      currentPaths: [
        { title: "現在の経路", meta: "自社事例2件", description: "導入した事実は示せますが、比較できる条件が不足しています。" },
        { title: "補う内容", meta: "業種・規模・期間・成果", description: "自社説明と第三者評価を分けて確認できる構成にします。" }
      ]
    },
    {
      id: "third-party",
      name: "第三者掲載",
      role: "中立な評価経路",
      observations: 22,
      questions: 8,
      models: 3,
      currentState: "関連3ドメイン",
      missing: "選定理由・導入評価",
      route: "第三者獲得",
      primaryActionId: "r14",
      questionExamples: [
        { title: "専門家が評価するGEOツールは？", meta: "信頼性・8質問", description: "第三者の選定記事でRecoraの評価理由が不足しています。" },
        { title: "導入候補として信頼できる？", meta: "決裁者・3モデル", description: "自社以外の根拠へ到達できる経路が限られています。" }
      ],
      currentPaths: [
        { title: "現在の経路", meta: "関連3ドメイン", description: "ブランド名は出るものの、具体的な評価内容が薄い状態です。" },
        { title: "補う内容", meta: "評価用の一次資料", description: "第三者が確認できる事実・導入条件・事例情報を整えます。" }
      ]
    },
    {
      id: "review",
      name: "レビュー",
      role: "利用者視点の評価",
      observations: 19,
      questions: 7,
      models: 2,
      currentState: "確認できたレビュー6件",
      missing: "運用負荷・継続理由",
      route: "顧客協力",
      primaryActionId: "r16",
      questionExamples: [
        { title: "実際の利用者の評価は？", meta: "利用評価・7質問", description: "導入理由は見える一方、継続利用の理由が不足しています。" },
        { title: "運用は難しくない？", meta: "現場担当・2モデル", description: "日常運用とサポート体験の評価が回答に出ていません。" }
      ],
      currentPaths: [
        { title: "現在の経路", meta: "レビュー6件", description: "評価は点在し、利用条件と評価時点をまとめて確認できません。" },
        { title: "補う内容", meta: "役割・利用期間・運用体験", description: "顧客の同意を得た評価を、条件付きで整理します。" }
      ]
    }
  ];
  const maxObservations = Math.max(...materials.map((material) => material.observations));
  const returnHref = reportBase + "/recommendations#trust-evidence-actions";

  return (
    <div className="bg-white">
      <div className="hidden grid-cols-[minmax(0,.72fr)_minmax(0,1.08fr)_minmax(0,.95fr)_minmax(0,1fr)_minmax(0,.6fr)] border-b border-[#D8E1DD] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid">
        {["信頼材料", "AI回答での役割", "不足が観測された量", "現在の状態", "実施経路"].map((label) => <div key={label} className="flex min-h-11 items-center px-4">{label}</div>)}
      </div>
      <div role="list" className="divide-y divide-[#D8E1DD]">
        {materials.map((material, index) => {
          const modelCount = Math.min(material.models, activeModels.length);
          const participantType = material.route === "自社制作" ? "自社" : material.route === "第三者獲得" ? "第三者" : "顧客";
          const relatedAction = improvementRows.find((row) => row.id === material.primaryActionId);
          const detail = detailWithReturnHref({
            kicker: "信頼材料・引用獲得施策",
            title: material.name,
            value: material.observations + "観測",
            summary: material.role + "として不足している領域です。現在の経路と、必要な材料をどの関係者区分で整えるかを確認します。",
            sections: [
              {
                title: "実施の整理",
                description: "この信頼材料を、どの経路で、どの関係者と用意するかを整理します。",
                facts: [
                  { label: "実施経路", value: material.route },
                  { label: "関係者区分", value: participantType },
                  { label: "必要な材料", value: material.missing },
                  { label: "現在の経路", value: material.currentPaths[0].meta },
                  { label: "整備する内容", value: material.currentPaths[1].meta }
                ]
              },
              {
                title: "影響範囲",
                description: "不足が確認された質問・AIモデル・現在の状態を確認します。",
                facts: [
                  { label: "AI回答での役割", value: material.role },
                  { label: "不足の観測", value: material.observations + "件" },
                  { label: "対象質問", value: material.questions + "質問" },
                  { label: "AIモデル", value: modelCount + "モデル" },
                  { label: "現在の状態", value: material.currentState }
                ]
              },
              {
                title: "影響する質問",
                items: material.questionExamples.map((item) => ({ ...item, meta: scopeModelCountText(item.meta) }))
              },
              {
                title: "現在の根拠経路と補う内容",
                items: material.currentPaths
              }
            ],
            detailHref: reportBase + "/recommendations/" + material.primaryActionId,
            detailLabel: relatedAction ? "関連候補「" + relatedAction.action + "」を確認" : "関連する改善候補を確認"
          }, returnHref);

          return (
            <article key={material.id} role="listitem">
              <ReportDetailButton detail={detail} showIcon={false} className="w-full rounded-none px-4 py-4 hover:bg-[#F4F8F6] sm:px-5">
                <span className="grid w-full min-w-0 gap-4 text-left lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.08fr)_minmax(0,.95fr)_minmax(0,1fr)_minmax(0,.6fr)] lg:items-center">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#BCD0C8] bg-[#F0F7F4] text-[11px] font-bold tabular-nums text-[#075E44]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0"><span className="block text-[14px] font-bold text-[#0F172A]">{material.name}</span><span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#075E44]">内訳を見る<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span></span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold text-[#667085] lg:hidden">AI回答での役割</span>
                    <span className="mt-1 block break-words text-[13px] font-bold leading-6 text-[#344054] lg:mt-0">{material.role}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-[#667085]">不足：{material.missing}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-end justify-between gap-3"><span className="text-[11px] font-bold text-[#667085] lg:hidden">不足が観測された量</span><span className="text-[18px] font-bold tabular-nums text-[#101828]">{material.observations}<span className="ml-0.5 text-[11px]">観測</span></span></span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#E7EEEA]" role="progressbar" aria-label={material.name + "の不足観測数"} aria-valuenow={material.observations} aria-valuemin={0} aria-valuemax={maxObservations}>
                      <span className="block h-full rounded-full bg-[#08705A]" style={{ width: (material.observations / maxObservations * 100) + "%" }} />
                    </span>
                    <span className="mt-2 block text-[10px] font-semibold text-[#667085]">{material.questions}質問・{modelCount}モデル</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold text-[#667085] lg:hidden">現在の状態</span>
                    <span className="mt-1 block break-words text-[12px] font-semibold leading-5 text-[#344054] lg:mt-0">{material.currentState}</span>
                  </span>
                  <span className="min-w-0">
                    <span className={"inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold " + (material.route === "自社制作" ? "border-[#BCD0C8] bg-[#F0F7F4] text-[#075E44]" : "border-[#D7DCE5] bg-[#F7F8FA] text-[#475467]")}>{material.route}</span>
                  </span>
                </span>
              </ReportDetailButton>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function ImprovementTable({ reportBase }: { reportBase: string }) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("すべて");
  const [category, setCategory] = useState("すべて");
  const [sort, setSort] = useState<"優先度順" | "継続日数順" | "対象モデル数順">("優先度順");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<6 | 18>(6);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("rq") ?? "");
    setPriority(params.get("rpriority") ?? "すべて");
    setCategory(params.get("rcategory") ?? "すべて");
    const querySort = params.get("rsort");
    if (querySort === "継続日数順" || querySort === "対象モデル数順") setSort(querySort);
    const queryPage = Number(params.get("rpage"));
    const querySize = Number(params.get("rsize"));
    if (queryPage > 0) setPage(Math.floor(queryPage));
    if (querySize === 18) setPageSize(18);
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    replaceCurrentQuery({
      rq: query || null,
      rpriority: priority === "すべて" ? null : priority,
      rcategory: category === "すべて" ? null : category,
      rsort: sort === "優先度順" ? null : sort,
      rpage: page === 1 ? null : String(page),
      rsize: pageSize === 6 ? null : String(pageSize)
    });
  }, [category, page, pageSize, priority, query, sort, urlReady]);

  const filteredRows = improvementRows.filter((row) => {
    if (priority !== "すべて" && row.priority !== priority) return false;
    if (category !== "すべて" && row.category !== category) return false;
    return [row.action, row.target, row.metric, row.evidence, row.category].join(" ").toLocaleLowerCase("ja-JP").includes(query.toLocaleLowerCase("ja-JP"));
  });
  const priorityWeight: Record<string, number> = { "高": 3, "中": 2, "低": 1 };
  const sortedRows = [...filteredRows].sort((left, right) => {
    const leftImpact = improvementImpactParts(left.impact);
    const rightImpact = improvementImpactParts(right.impact);
    if (sort === "継続日数順") {
      return rightImpact.days - leftImpact.days
        || priorityWeight[right.priority] - priorityWeight[left.priority]
        || rightImpact.modelCount - leftImpact.modelCount;
    }
    if (sort === "対象モデル数順") {
      return rightImpact.modelCount - leftImpact.modelCount
        || priorityWeight[right.priority] - priorityWeight[left.priority]
        || rightImpact.days - leftImpact.days;
    }
    return priorityWeight[right.priority] - priorityWeight[left.priority]
      || rightImpact.days - leftImpact.days
      || rightImpact.modelCount - leftImpact.modelCount;
  });
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const returnParams = new URLSearchParams();
  if (query) returnParams.set("rq", query);
  if (priority !== "すべて") returnParams.set("rpriority", priority);
  if (category !== "すべて") returnParams.set("rcategory", category);
  if (sort !== "優先度順") returnParams.set("rsort", sort);
  if (safePage !== 1) returnParams.set("rpage", String(safePage));
  if (pageSize !== 6) returnParams.set("rsize", String(pageSize));
  const recommendationReturnHref = `${reportBase}/recommendations${returnParams.size ? `?${returnParams.toString()}` : ""}#recommendation-actions`;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-w-0">
      <div className="grid gap-3 border-b border-[#DDE5E1] bg-[#F8FAF9] p-4 lg:grid-cols-[minmax(260px,1fr)_150px_210px_180px]">
        <label className="min-w-0"><span className="mb-1.5 block text-[12px] font-bold text-[#667085]">提案・対象・指標を検索</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="提案内容を検索" className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]" /></span></label>
        <label className="min-w-0"><span className="mb-1.5 block text-[12px] font-bold text-[#667085]">優先度</span><select value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]"><option value="すべて">すべて</option><option value="高">高</option><option value="中">中</option><option value="低">低</option></select></label>
        <label className="min-w-0"><span className="mb-1.5 block text-[12px] font-bold text-[#667085]">施策カテゴリ</span><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]"><option value="すべて">すべて</option><option value="既存ページ改善">既存ページ改善</option><option value="新規ページ作成">新規ページ作成</option><option value="第三者掲載・引用獲得">第三者掲載・引用獲得</option><option value="計測条件・定義確認">計測条件・定義確認</option></select></label>
        <label className="min-w-0"><span className="mb-1.5 block text-[12px] font-bold text-[#667085]">並び順</span><select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]"><option value="優先度順">優先度順</option><option value="継続日数順">継続日数順</option><option value="対象モデル数順">対象モデル数順</option></select></label>
      </div>
      <div role="list" className="divide-y divide-[#DDE5E1] bg-white">
      {visibleRows.length === 0 ? <div className="px-5 py-12 text-center"><p className="text-sm font-bold text-[#344054]">条件に一致する改善提案がありません</p><p className="mt-1 text-xs text-[#667085]">検索語・優先度・施策カテゴリを変更してください。</p></div> : null}
      {visibleRows.map((row) => {
        const actionDetail = detailWithReturnHref(buildImprovementActionDetail(row, reportBase), recommendationReturnHref);
        const evidenceDetail = detailWithReturnHref(buildImprovementEvidenceDetail(row, reportBase), recommendationReturnHref);
        const impactDetail = detailWithReturnHref(buildImprovementImpactDetail(row, reportBase), recommendationReturnHref);
        return (
          <article key={row.action} role="listitem" className="min-w-0 px-4 py-4 sm:px-5">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[auto_minmax(320px,1fr)_minmax(220px,.65fr)] lg:items-center">
              <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-start"><PriorityBadge value={row.priority} /><DataRichBadge>{row.category}</DataRichBadge></div>
              <ReportDetailButton detail={actionDetail} openInPage className="min-h-11 w-full min-w-0 justify-start rounded-sm text-left font-bold leading-6 text-[#0F172A] hover:text-[#075E44]">
                <span className="break-words">{row.action}</span>
              </ReportDetailButton>
              <dl className="grid min-w-0 grid-cols-2 gap-3 rounded-md border border-[#E3EAE6] bg-[#F8FAF9] px-3 py-2.5">
                <div className="min-w-0"><dt className="text-[10px] font-bold text-[#667085]">対象</dt><dd className="mt-0.5 break-all font-mono text-[11px] font-semibold text-[#006B57]">{row.target}</dd></div>
                <div className="min-w-0"><dt className="text-[10px] font-bold text-[#667085]">対象指標</dt><dd className="mt-0.5 break-words text-[11px] font-semibold text-[#344054]">{row.metric}</dd></div>
              </dl>
            </div>
            <div className="mt-3 grid min-w-0 gap-3 border-t border-[#E5EAE8] pt-3 md:grid-cols-[minmax(0,1.35fr)_minmax(200px,.65fr)]">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#667085]">観測根拠</p>
                <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-[#475569]">{row.evidence}</p>
                <EvidenceLink label="根拠の内訳" detail={evidenceDetail} />
              </div>
              <ReportDetailButton
                detail={impactDetail}
                showIcon={false}
                label={`${row.action}の影響範囲を詳しく見る`}
                className="min-h-0 w-full items-center justify-between gap-3 rounded-md bg-[#F8FAF9] px-3 py-2.5 text-left transition hover:bg-[#EDF6F2]"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-[#667085]">影響範囲</span>
                  <span className="mt-1 block break-words text-[12px] font-semibold leading-5 tabular-nums text-[#101828]">{row.impact}</span>
                </span>
                <span className="shrink-0 text-[11px] font-bold text-[#075E44]">内訳を見る</span>
              </ReportDetailButton>
            </div>
          </article>
        );
      })}
      </div>
      <ResultPagination page={safePage} totalPages={totalPages} pageSize={pageSize} pageSizes={[6, 18]} shown={visibleRows.length} matched={filteredRows.length} total={improvementRows.length} unit="提案" onPage={setPage} onPageSize={(size) => { setPageSize(size === 18 ? 18 : 6); setPage(1); }} />
    </div>
  );
}

function CitationGapTable({
  rows = orderedActiveCitationGapRows,
  stickyHeader = false
}: {
  rows?: CitationGapRow[];
  stickyHeader?: boolean;
}) {
  return (
    <div className="bg-white">
      <div className={cn(
        "hidden grid-cols-[minmax(260px,1.25fr)_140px_140px_minmax(280px,1.4fr)_100px_90px] border-b border-[#D8E1DD] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] xl:grid",
        stickyHeader && "xl:sticky xl:top-16 xl:z-20 xl:shadow-[0_8px_16px_rgba(15,23,42,0.06)]"
      )}>
        {["質問", "AIモデル", "先行競合", "競合だけが引用したURL", "影響回答", "継続"].map((label) => (
          <div key={label} className="flex min-h-11 items-center px-3">{label}</div>
        ))}
      </div>
      <div role="list" className="divide-y divide-[#D8E1DD]">
        {rows.map((row) => {
          const competitor = competitors.find((item) => item.name === row.competitor);
          const detail: ReportDetailPayload = {
            kicker: "引用ギャップ",
            title: row.prompt,
            value: row.competitor + "のみ引用・" + row.days + "日継続",
            summary: "自社が出ない原因を断定せず、競合が選ばれた回答・引用元・質問群の共通点を確認します。",
            sections: [
              { title: "このギャップの範囲", facts: [
                { label: "AIモデル", value: row.model },
                { label: "先行競合", value: row.competitor },
                { label: "影響回答", value: row.affected + "回答" },
                { label: "継続", value: row.days + "日", tone: row.days >= 10 ? "amber" : "default" },
                { label: "ペルソナ", value: row.persona },
                { label: "トピック", value: row.topic },
                { label: "競合だけが引用したURL", value: row.url }
              ] },
              { title: "競合引用元が使われた回答", items: [
                { title: "回答内で対応する内容", meta: row.topic, description: row.topic === "競合比較" ? "比較軸と選定基準を表形式で説明" : row.topic === "第三者評価" ? "複数製品の評価を第三者視点で掲載" : "調査時点と母集団を明示" },
                { title: "自社側の引用状況", meta: "同じ質問では自社URL引用なし", description: "他モデル・近接質問では自社公式が引用されているかを分けて確認" }
              ] },
              { title: "期間内の変化", table: { columns: ["期間", "競合のみ引用", "自社引用", "主なモデル"], rows: [
                ["直近7日", Math.ceil(row.affected * 0.6) + "回答", "0回答", row.model],
                ["その前7日", Math.floor(row.affected * 0.4) + "回答", row.days > 10 ? "1回答" : "0回答", row.model]
              ] } }
            ]
          };
          return (
            <article key={row.id} role="listitem" className="grid min-w-0 grid-cols-2 gap-px bg-[#D8E1DD] md:grid-cols-[minmax(0,1fr)_120px_100px] xl:grid-cols-[minmax(260px,1.25fr)_140px_140px_minmax(280px,1.4fr)_100px_90px]">
              <ReportDetailButton detail={detail} showIcon={false} label={row.prompt + "の引用ギャップを詳しく見る"} className="col-span-2 row-start-1 !flex min-h-[76px] min-w-0 w-full items-center justify-between rounded-none bg-white px-4 py-3 text-left font-bold leading-6 text-[#0F172A] hover:bg-[#F4F8F6] focus-visible:ring-inset focus-visible:ring-offset-0 md:col-span-1 md:col-start-1 md:row-start-1 xl:col-start-1 xl:min-h-[76px]">
                <span className="min-w-0">
                  <span className="block break-words">{row.prompt}</span>
                  <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 md:hidden">
                    <ModelIdentity name={row.model} compact />
                    <EntityIdentity name={row.competitor} logoUrl={competitor?.logoUrl} compact />
                    <span className="rounded-md bg-[#EEF5F2] px-2 py-1 text-[11px] font-bold tabular-nums text-[#075E44]">影響 {row.affected}件</span>
                    <span className={cn("rounded-md px-2 py-1 text-[11px] font-bold tabular-nums", row.days >= 10 ? "bg-[#FFF4E5] text-[#8A4B00]" : "bg-[#F2F4F7] text-[#475467]")}>継続 {row.days}日</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#667085]" aria-hidden="true" />
              </ReportDetailButton>
              <div className="hidden md:block col-start-1 row-start-2 min-w-0 bg-white px-3 py-3 md:col-start-1 md:row-start-2 xl:col-start-2 xl:row-start-1 xl:flex xl:min-h-[76px] xl:items-center">
                <span>
                  <span className="mb-1 block text-[10px] font-bold text-[#667085] xl:hidden">AIモデル</span>
                  <ModelIdentity name={row.model} compact />
                </span>
              </div>
              <div className="hidden md:block col-start-2 row-start-2 min-w-0 bg-white px-3 py-3 md:col-span-2 md:col-start-2 md:row-start-2 xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:flex xl:min-h-[76px] xl:items-center">
                <span>
                  <span className="mb-1 block text-[10px] font-bold text-[#667085] xl:hidden">先行競合</span>
                  <EntityIdentity name={row.competitor} logoUrl={competitor?.logoUrl} compact />
                </span>
              </div>
              <div className="hidden md:block col-start-1 row-start-3 min-w-0 bg-white px-3 py-3 md:col-start-2 md:row-start-1 xl:col-start-5 xl:row-start-1 xl:flex xl:min-h-[76px] xl:items-center">
                <span>
                  <span className="block text-[10px] font-bold text-[#667085] xl:hidden">影響回答</span>
                  <span className="mt-1 block text-[16px] font-semibold tabular-nums text-[#101828] xl:mt-0">{row.affected}件</span>
                </span>
              </div>
              <div className="hidden md:block col-start-2 row-start-3 min-w-0 bg-white px-3 py-3 md:col-start-3 md:row-start-1 xl:col-start-6 xl:row-start-1 xl:flex xl:min-h-[76px] xl:items-center">
                <span>
                  <span className="block text-[10px] font-bold text-[#667085] xl:hidden">継続</span>
                  <span className={cn("mt-1 block text-[16px] font-semibold tabular-nums xl:mt-0", row.days >= 10 ? "text-[#8A4B00]" : "text-[#101828]")}>{row.days}日</span>
                </span>
              </div>
              <div className="hidden md:block col-span-2 row-start-4 min-w-0 bg-white px-4 py-3 md:col-span-3 md:col-start-1 md:row-start-3 xl:col-span-1 xl:col-start-4 xl:row-start-1 xl:flex xl:min-h-[76px] xl:items-center xl:px-3">
                <span className="min-w-0">
                  <span className="mb-1 block text-[10px] font-bold text-[#667085] xl:hidden">競合だけが引用したURL</span>
                  <a href={row.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 max-w-full items-start gap-1.5 break-all font-mono text-[11px] font-semibold leading-5 text-[#075E44] underline decoration-[#9AB8AA] underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
                    <span className="break-all">{row.url}</span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ClaimRiskTable({ reportBase }: { reportBase: string }) {
  const orderedRows = [...claimRiskRows].sort((left, right) => {
    const severityGap = (right.severity === "高" ? 1 : 0) - (left.severity === "高" ? 1 : 0);
    return severityGap || right.days - left.days || right.answers - left.answers;
  });

  return (
    <div className="bg-white">
      <div className="hidden grid-cols-[minmax(330px,1.55fr)_90px_130px_90px_minmax(220px,1fr)_100px] border-b border-[#D8E1DD] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] xl:grid">
        {["確認対象の主張", "重大度", "種類", "継続", "該当AIモデル", "該当回答"].map((label) => (
          <div key={label} className="flex min-h-11 items-center px-3">{label}</div>
        ))}
      </div>
      <div role="list" className="divide-y divide-[#D8E1DD]">
        {orderedRows.map((row) => {
          const modelNames = row.models === "対象外" ? [] : row.models.split(" / ");
          const claimPrompt = promptRows.find((prompt) => prompt.id === row.promptId);
          const detailHref = reportBase + "/brand-perception/claims/" + row.id;
          const detail: ReportDetailPayload = {
            kicker: "CLAIM REVIEW",
            title: row.claim,
            value: "重大度 " + row.severity,
            summary: row.type + "として" + row.days + "日継続して観測されている主張です。",
            sections: [
              {
                title: "現在の状態",
                facts: [
                  { label: "重大度", value: row.severity, tone: row.severity === "高" ? "red" : "amber" },
                  { label: "種類", value: row.type },
                  { label: "継続", value: row.days + "日" },
                  { label: "該当回答", value: row.answers + "件", tone: "amber" }
                ]
              },
              ...(modelNames.length > 0
                ? [{
                    title: "該当AIモデル",
                    items: modelNames.map((modelName) => ({ title: modelName, description: "この主張を含む回答を観測" }))
                  }]
                : []),
              {
                title: "代表観測",
                items: [
                  {
                    title: claimPrompt?.prompt ?? row.claim,
                    meta: modelNames.join("・"),
                    description: "同じ質問で観測された回答を主張専用ページで比較できます。"
                  }
                ]
              }
            ],
            detailHref,
            detailLabel: "この主張を詳しく分析"
          };
          return (
            <article key={row.id} role="listitem" className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-px bg-[#D8E1DD] md:grid-cols-[minmax(0,1fr)_110px_minmax(180px,.9fr)_100px] xl:grid-cols-[minmax(330px,1.55fr)_90px_130px_90px_minmax(220px,1fr)_100px]">
              <div className="col-start-1 row-start-1 flex min-h-[96px] min-w-0 flex-col justify-center bg-white px-4 py-3 md:col-span-3 md:col-start-1 md:row-start-1 xl:col-span-1 xl:col-start-1 xl:min-h-[104px]">
                <ReportDetailButton
                  detail={detail}
                  label={row.claim + "の内訳を見る"}
                  className="!flex min-h-11 w-full justify-between rounded-none font-bold leading-6 text-[#0F172A] hover:text-[#075E44] focus-visible:ring-inset focus-visible:ring-offset-0"
                >
                  <span className="break-words">{row.claim}</span>
                </ReportDetailButton>
                <Link
                  href={detailHref}
                  className="mt-1 inline-flex min-h-8 w-fit items-center gap-1 text-[11px] font-bold text-[#075E44] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]"
                >
                  詳しく分析
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              <div className="col-start-2 row-start-1 flex min-h-[76px] items-center justify-center bg-white px-3 py-3 md:col-start-4 md:row-start-1 xl:col-start-2 xl:min-h-[104px] xl:justify-start">
                <span>
                  <span className="mb-1 block text-center text-[10px] font-bold text-[#667085] xl:hidden">重大度</span>
                  <DataRichBadge tone={row.severity === "高" ? "red" : "amber"}>{row.severity}</DataRichBadge>
                </span>
              </div>
              <div className="col-start-1 row-start-2 min-w-0 bg-white px-3 py-3 md:col-start-1 md:row-start-2 xl:col-start-3 xl:row-start-1 xl:flex xl:min-h-[104px] xl:items-center">
                <span>
                  <span className="block text-[10px] font-bold text-[#667085] xl:hidden">種類</span>
                  <span className="mt-1 block break-words text-[13px] font-semibold text-[#101828] xl:mt-0">{row.type}</span>
                </span>
              </div>
              <div className="col-start-2 row-start-2 min-w-0 bg-white px-3 py-3 md:col-start-2 md:row-start-2 xl:col-start-4 xl:row-start-1 xl:flex xl:min-h-[104px] xl:items-center">
                <span>
                  <span className="block text-[10px] font-bold text-[#667085] xl:hidden">継続</span>
                  <span className="mt-1 block text-[15px] font-semibold tabular-nums text-[#101828] xl:mt-0">{row.days}日</span>
                </span>
              </div>
              <div className="col-start-1 row-start-3 min-w-0 bg-white px-3 py-3 md:col-start-3 md:row-start-2 xl:col-start-5 xl:row-start-1 xl:flex xl:min-h-[104px] xl:items-center">
                <span className="min-w-0">
                  <span className="mb-1.5 block text-[10px] font-bold text-[#667085] xl:hidden">該当AIモデル</span>
                  {modelNames.length > 0 ? (
                    <span className="flex min-w-0 flex-wrap gap-2">
                      {modelNames.map((modelName) => (
                        <span key={modelName} className="inline-flex min-w-0 rounded-md border border-[#D8E1DD] bg-[#F8FAF9] px-2 py-1.5">
                          <ModelIdentity name={modelName} compact />
                        </span>
                      ))}
                    </span>
                  ) : <span className="text-[12px] font-semibold text-[#667085]">対象外</span>}
                </span>
              </div>
              <div className="col-start-2 row-start-3 min-w-0 bg-white px-3 py-3 md:col-start-4 md:row-start-2 xl:col-start-6 xl:row-start-1 xl:flex xl:min-h-[104px] xl:items-center">
                <span>
                  <span className="block text-[10px] font-bold text-[#667085] xl:hidden">該当回答</span>
                  <span className="mt-1 block text-[16px] font-semibold tabular-nums text-[#8A4B00] xl:mt-0">{row.answers}件</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SourceDomainTable({ reportBase }: { reportBase: string }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"引用回答数" | "引用回数" | "構成比" | "ドメイン名">("引用回答数");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20>(20);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("sdq") ?? "");
    const querySort = params.get("sdsort");
    if (querySort === "引用数") setSort("引用回数");
    else if (["引用回答数", "引用回数", "構成比", "ドメイン名"].includes(querySort ?? "")) setSort(querySort as typeof sort);
    if (Number(params.get("sdsize")) === 10) setPageSize(10);
    const queryPage = Number(params.get("sdpage"));
    if (queryPage > 0) setPage(Math.floor(queryPage));
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    replaceCurrentQuery({
      sdq: query || null,
      sdsort: sort === "引用回答数" ? null : sort,
      sdsize: pageSize === 20 ? null : String(pageSize),
      sdpage: page === 1 ? null : String(page)
    });
  }, [page, pageSize, query, sort, urlReady]);

  const rows = sourceDomains.map((row, index) => ({
    ...row,
    citedAnswers: Math.max(1, Math.min(row.citations, Math.round(row.citations * (0.72 + (index % 3) * 0.04))))
  }));
  const filtered = rows.filter((row) => [row.domain, row.type, row.topic].join(" ").toLocaleLowerCase("ja-JP").includes(query.toLocaleLowerCase("ja-JP")));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "ドメイン名") return a.domain.localeCompare(b.domain);
    if (sort === "構成比") return b.share - a.share;
    if (sort === "引用回数") return b.citations - a.citations;
    return b.citedAnswers - a.citedAnswers || b.citations - a.citations;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const returnParams = new URLSearchParams();
  if (query) returnParams.set("sdq", query);
  if (sort !== "引用回答数") returnParams.set("sdsort", sort);
  if (pageSize !== 20) returnParams.set("sdsize", String(pageSize));
  if (safePage !== 1) returnParams.set("sdpage", String(safePage));
  const returnHref = `${reportBase}/sources${returnParams.size ? `?${returnParams.toString()}` : ""}`;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-w-0">
      <div className="grid gap-3 border-b border-[#DDE5E1] bg-[#F8FAF9] p-4 md:grid-cols-[minmax(240px,1fr)_210px]">
        <label className="min-w-0">
          <span className="mb-1.5 block text-[12px] font-bold text-[#667085]">ドメイン・種別・トピックを検索</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="例：recora.jp / 第三者メディア" className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none placeholder:font-medium placeholder:text-[#98A2B3] focus-visible:ring-2 focus-visible:ring-[#0B382D]" />
          </span>
        </label>
        <label className="min-w-0">
          <span className="mb-1.5 block text-[12px] font-bold text-[#667085]">並び順</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">
            <option value="引用回答数">引用回答数が多い順</option>
            <option value="引用回数">引用回数が多い順</option>
            <option value="構成比">構成比が高い順</option>
            <option value="ドメイン名">ドメイン名順</option>
          </select>
        </label>
      </div>
      <div className="hidden grid-cols-[56px_minmax(190px,1.35fr)_94px_86px_76px_126px_116px_112px] border-b border-[#D7E0DC] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid" role="row">
        {[
          "順位",
          "参照元ドメイン",
          "引用回答数",
          "引用回数",
          "構成比",
          "所有区分",
          "主なトピック",
          "分析"
        ].map((label) => <div key={label} className="flex min-h-11 items-center border-l border-[#E3EAE6] px-3 first:border-l-0">{label}</div>)}
      </div>
      <div className="divide-y divide-[#DDE5E1] bg-white" role="list">
        {visibleRows.length === 0 ? <FilterEmptyState title="条件に一致する引用元ドメインがありません" description="検索語か並び順を変更してください。" /> : null}
        {visibleRows.map((row) => {
          const rank = sorted.findIndex((item) => item.id === row.id) + 1;
          const representativeUrls = row.domain === "recora.jp"
            ? ["https://recora.jp/products/ai-visibility-monitor", "https://recora.jp/guide"]
            : [`https://${row.domain}/insights/overview`, `https://${row.domain}/insights/${row.topic.toLowerCase()}`];
          const detailHref = `${reportBase}/sources/domains/${row.id}?return=${encodeURIComponent(returnHref)}`;
          const detail: ReportDetailPayload = {
            kicker: "SOURCE DOMAIN",
            title: row.domain,
            value: `${row.citedAnswers}回答で引用`,
            summary: `${row.type}として引用された回答数と引用回数を分け、使用された質問・モデルまで確認します。`,
            sections: [
              { title: "ランキング内訳", facts: [{ label: "順位", value: `${rank}位` }, { label: "引用回答数", value: `${row.citedAnswers}回答` }, { label: "引用回数", value: `${row.citations}回` }, { label: "構成比", value: formatSourceShare(row.share) }, { label: "所有区分", value: row.type }, { label: "主なトピック", value: row.topic }] },
              { title: "代表的な引用URL", table: { columns: ["URL", "主な質問群", "確認内容"], rows: representativeUrls.map((url, index) => [url, index === 0 ? row.topic : "近接トピック", index === 0 ? "回答で引用された説明" : "他モデルでの使用状況"]) } },
              { title: "モデル別の引用回答", table: { columns: ["AIモデル", "引用回答数", "主なトピック"], rows: activeModels.map((model, index) => [model.name, `${distributeCount(row.citedAnswers, index, activeModels.length)}回答`, topics[(index + rank) % topics.length]]) } }
            ],
            detailHref,
            detailLabel: "URL一覧と日次変化を分析"
          };
          return (
            <article key={row.id} role="listitem" className="min-w-0">
              <div className="hidden min-h-[72px] grid-cols-[56px_minmax(190px,1.35fr)_94px_86px_76px_126px_116px_112px] lg:grid">
                <div className="flex items-center justify-center px-2 text-[13px] font-bold tabular-nums text-[#075E44]">{rank}</div>
                <div className="flex min-w-0 items-center gap-2 border-l border-[#E3EAE6] px-3">
                  <ReportDetailButton detail={detail} showIcon={false} className="min-w-0 flex-1 justify-start rounded-sm text-[13px] font-bold text-[#075E44] hover:underline">
                    <span className="min-w-0 [overflow-wrap:anywhere]">{row.domain}</span>
                  </ReportDetailButton>
                  <a href={`https://${row.domain}`} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#667085] hover:bg-[#EEF4F1] hover:text-[#075E44]" aria-label={`${row.domain}を新しいタブで開く`}><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                </div>
                <div className="flex items-center border-l border-[#E3EAE6] px-3 text-[15px] font-semibold tabular-nums text-[#075E44]">{row.citedAnswers}回答</div>
                <div className="flex items-center border-l border-[#E3EAE6] px-3 text-[13px] font-semibold tabular-nums text-[#101828]">{row.citations}回</div>
                <div className="flex items-center border-l border-[#E3EAE6] px-3 text-[13px] font-semibold tabular-nums text-[#101828]">{formatSourceShare(row.share)}</div>
                <div className="flex min-w-0 items-center border-l border-[#E3EAE6] px-3 text-[12px] font-semibold leading-5 text-[#344054]">{row.type}</div>
                <div className="flex min-w-0 items-center border-l border-[#E3EAE6] px-3 text-[12px] font-semibold leading-5 text-[#344054]">{row.topic}</div>
                <div className="flex items-center border-l border-[#E3EAE6] px-2">
                  <Link href={detailHref} className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-md border border-[#C7D2CC] bg-white px-2 text-[11px] font-bold text-[#075E44] hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">詳しく分析<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                </div>
              </div>
              <div className="px-4 py-4 lg:hidden">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-[#EEF4F1] px-2 text-[12px] font-bold tabular-nums text-[#075E44]">{rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <ReportDetailButton detail={detail} showIcon={false} className="min-w-0 flex-1 justify-start rounded-sm text-[13px] font-bold text-[#075E44]"><span className="[overflow-wrap:anywhere]">{row.domain}</span></ReportDetailButton>
                      <a href={`https://${row.domain}`} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D7E0DC] text-[#075E44]" aria-label={`${row.domain}を新しいタブで開く`}><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-[#667085]">{row.type}・{row.topic}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#E1E7E4] bg-[#E1E7E4]">
                  {[["引用回答数", `${row.citedAnswers}回答`], ["引用回数", `${row.citations}回`], ["所有区分", row.type], ["主なトピック", row.topic]].map(([label, value]) => <div key={label} className="min-w-0 bg-[#FAFCFB] px-3 py-2.5"><dt className="text-[10px] font-bold text-[#667085]">{label}</dt><dd className="mt-1 break-words text-[13px] font-semibold text-[#101828]">{value}</dd></div>)}
                </dl>
                <Link href={detailHref} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md border border-[#9AB8AA] bg-white px-3 text-[12px] font-bold text-[#075E44]">詳しく分析<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </div>
            </article>
          );
        })}
      </div>
      <ResultPagination page={safePage} totalPages={totalPages} pageSize={pageSize} pageSizes={[10, 20]} shown={visibleRows.length} matched={filtered.length} total={sourceDomains.length} unit="ドメイン" onPage={setPage} onPageSize={(size) => { setPageSize(size === 10 ? 10 : 20); setPage(1); }} />
    </div>
  );
}
function SourcePageTable({ reportBase }: { reportBase: string }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"引用回答数" | "引用回数" | "URL">("引用回答数");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20>(20);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("spq") ?? "");
    const querySort = params.get("spsort");
    if (querySort === "引用数") setSort("引用回数");
    else if (["引用回答数", "引用回数", "URL"].includes(querySort ?? "")) setSort(querySort as typeof sort);
    if (Number(params.get("spsize")) === 10) setPageSize(10);
    const queryPage = Number(params.get("sppage"));
    if (queryPage > 0) setPage(Math.floor(queryPage));
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    replaceCurrentQuery({
      spq: query || null,
      spsort: sort === "引用回答数" ? null : sort,
      spsize: pageSize === 20 ? null : String(pageSize),
      sppage: page === 1 ? null : String(page)
    });
  }, [page, pageSize, query, sort, urlReady]);

  const activeModelNames = new Set(activeModels.map((model) => model.name));
  const rows = sourcePages.map((row, index) => ({
    ...row,
    citedAnswers: Math.max(1, Math.min(row.citations, Math.round(row.citations * (0.68 + (index % 4) * 0.05)))),
    visibleModels: row.models.split(" / ").filter((model) => activeModelNames.has(model))
  }));
  const filtered = rows.filter((row) => [row.url, row.domain, row.type, row.topic, row.visibleModels.join(" "), row.insight].join(" ").toLocaleLowerCase("ja-JP").includes(query.toLocaleLowerCase("ja-JP")));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "URL") return `${a.domain}${a.url}`.localeCompare(`${b.domain}${b.url}`);
    if (sort === "引用回数") return b.citations - a.citations;
    return b.citedAnswers - a.citedAnswers || b.citations - a.citations;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const returnParams = new URLSearchParams();
  if (query) returnParams.set("spq", query);
  if (sort !== "引用回答数") returnParams.set("spsort", sort);
  if (pageSize !== 20) returnParams.set("spsize", String(pageSize));
  if (safePage !== 1) returnParams.set("sppage", String(safePage));
  const returnHref = `${reportBase}/sources${returnParams.size ? `?${returnParams.toString()}` : ""}`;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-w-0">
      <div className="grid gap-3 border-b border-[#DDE5E1] bg-[#F8FAF9] p-4 md:grid-cols-[minmax(240px,1fr)_210px]">
        <label className="min-w-0">
          <span className="mb-1.5 block text-[12px] font-bold text-[#667085]">URL・ドメイン・トピックを検索</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" aria-hidden="true" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="例：compare / 競合比較" className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none placeholder:font-medium placeholder:text-[#98A2B3] focus-visible:ring-2 focus-visible:ring-[#0B382D]" />
          </span>
        </label>
        <label className="min-w-0">
          <span className="mb-1.5 block text-[12px] font-bold text-[#667085]">並び順</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">
            <option value="引用回答数">引用回答数が多い順</option>
            <option value="引用回数">引用回数が多い順</option>
            <option value="URL">URL順</option>
          </select>
        </label>
      </div>
      <div className="hidden grid-cols-[52px_minmax(250px,1.65fr)_90px_80px_116px_104px_minmax(150px,1fr)_108px] border-b border-[#D7E0DC] bg-[#F5F8F6] text-[11px] font-bold text-[#667085] lg:grid" role="row">
        {["順位", "参照元ページ", "引用回答数", "引用回数", "所有区分", "トピック", "出現AI", "分析"].map((label) => <div key={label} className="flex min-h-11 items-center border-l border-[#E3EAE6] px-3 first:border-l-0">{label}</div>)}
      </div>
      <div className="divide-y divide-[#DDE5E1] bg-white" role="list">
        {visibleRows.length === 0 ? <FilterEmptyState title="条件に一致する引用ページがありません" description="URL・ドメイン・トピックの検索語を変更してください。" /> : null}
        {visibleRows.map((row) => {
          const rank = sorted.findIndex((item) => item.id === row.id) + 1;
          const sourceHref = row.url.startsWith("http") ? row.url : `https://${row.domain}${row.url}`;
          const detailHref = `${reportBase}/sources/pages/${row.id}?return=${encodeURIComponent(returnHref)}`;
          const detail: ReportDetailPayload = {
            kicker: "SOURCE PAGE",
            title: `${row.domain}${row.url}`,
            value: `${row.citedAnswers}回答で引用`,
            summary: row.insight,
            sections: [
              { title: "引用ページ情報", facts: [{ label: "順位", value: `${rank}位` }, { label: "引用回答数", value: `${row.citedAnswers}回答` }, { label: "引用回数", value: `${row.citations}回` }, { label: "ドメイン", value: row.domain }, { label: "所有区分", value: row.type }, { label: "関連トピック", value: row.topic }, { label: "出現AI", value: row.visibleModels.join(" / ") || "なし" }] },
              { title: "このページが使われた回答", table: { columns: ["AIモデル", "固定質問", "回答内で対応する内容"], rows: row.visibleModels.map((model, index) => [model, `${row.topic}で参考になる情報源は？`, index === 0 ? row.insight : "同じURLを別の説明で参照"]) } },
              { title: "期間内の引用変化", table: { columns: ["期間", "引用回答数", "主なAIモデル"], rows: [["直近7日", `${Math.max(1, Math.ceil(row.citedAnswers * .35))}回答`, row.visibleModels[0] ?? "なし"], ["直近30日", `${row.citedAnswers}回答`, row.visibleModels.join(" / ") || "なし"]] } }
            ],
            detailHref,
            detailLabel: "引用回答と根拠箇所を分析"
          };
          return (
            <article key={row.id} role="listitem" className="min-w-0">
              <div className="hidden min-h-[72px] grid-cols-[52px_minmax(250px,1.65fr)_90px_80px_116px_104px_minmax(150px,1fr)_108px] lg:grid">
                <div className="flex items-center justify-center px-2 text-[13px] font-bold tabular-nums text-[#075E44]">{rank}</div>
                <div className="flex min-w-0 items-center gap-2 border-l border-[#E3EAE6] px-3 py-2">
                  <ReportDetailButton detail={detail} showIcon={false} className="min-w-0 flex-1 justify-start rounded-sm text-left font-mono text-[11px] font-semibold leading-5 text-[#075E44] hover:underline"><span className="min-w-0 [overflow-wrap:anywhere]">{row.domain}{row.url}</span></ReportDetailButton>
                  <a href={sourceHref} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#667085] hover:bg-[#EEF4F1] hover:text-[#075E44]" aria-label={`${row.url}を新しいタブで開く`}><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                </div>
                <div className="flex items-center border-l border-[#E3EAE6] px-3 text-[15px] font-semibold tabular-nums text-[#075E44]">{row.citedAnswers}回答</div>
                <div className="flex items-center border-l border-[#E3EAE6] px-3 text-[13px] font-semibold tabular-nums text-[#101828]">{row.citations}回</div>
                <div className="flex min-w-0 items-center border-l border-[#E3EAE6] px-3 text-[12px] font-semibold leading-5 text-[#344054]">{row.type}</div>
                <div className="flex min-w-0 items-center border-l border-[#E3EAE6] px-3 text-[12px] font-semibold leading-5 text-[#344054]">{row.topic}</div>
                <div className="flex min-w-0 items-center gap-1.5 border-l border-[#E3EAE6] px-2 py-2">
                  {row.visibleModels.length ? row.visibleModels.map((model) => <span key={model} className="inline-flex rounded-md border border-[#D8E1DD] bg-[#F8FAF9] p-1" title={model}><ModelIdentity name={model} compact iconOnly /></span>) : <span className="text-[11px] font-semibold text-[#667085]">該当なし</span>}
                </div>
                <div className="flex items-center border-l border-[#E3EAE6] px-2"><Link href={detailHref} className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-md border border-[#C7D2CC] bg-white px-2 text-[11px] font-bold text-[#075E44] hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">詳しく分析<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
              </div>
              <div className="px-4 py-4 lg:hidden">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-[#EEF4F1] px-2 text-[12px] font-bold tabular-nums text-[#075E44]">{rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start gap-2">
                      <ReportDetailButton detail={detail} showIcon={false} className="min-w-0 flex-1 justify-start rounded-sm text-left font-mono text-[11px] font-semibold leading-5 text-[#075E44]"><span className="[overflow-wrap:anywhere]">{row.domain}{row.url}</span></ReportDetailButton>
                      <a href={sourceHref} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D7E0DC] text-[#075E44]" aria-label={`${row.url}を新しいタブで開く`}><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-[#667085]">{row.type}・{row.topic}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#E1E7E4] bg-[#E1E7E4]">
                  {[["引用回答数", `${row.citedAnswers}回答`], ["引用回数", `${row.citations}回`]].map(([label, value]) => <div key={label} className="min-w-0 bg-[#FAFCFB] px-3 py-2.5"><dt className="text-[10px] font-bold text-[#667085]">{label}</dt><dd className="mt-1 break-words text-[13px] font-semibold text-[#101828]">{value}</dd></div>)}
                </dl>
                <div className="mt-3 flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-[10px] font-bold text-[#667085]">出現AI</span>
                  <div className="flex min-w-0 flex-wrap gap-1.5">{row.visibleModels.length ? row.visibleModels.map((model) => <span key={model} className="inline-flex rounded-md border border-[#D8E1DD] bg-[#F8FAF9] p-1" title={model}><ModelIdentity name={model} compact iconOnly /></span>) : <span className="text-[11px] font-semibold text-[#667085]">該当なし</span>}</div>
                </div>
                <Link href={detailHref} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md border border-[#9AB8AA] bg-white px-3 text-[12px] font-bold text-[#075E44]">詳しく分析<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </div>
            </article>
          );
        })}
      </div>
      <ResultPagination page={safePage} totalPages={totalPages} pageSize={pageSize} pageSizes={[10, 20]} shown={visibleRows.length} matched={filtered.length} total={sourcePages.length} unit="URL" onPage={setPage} onPageSize={(size) => { setPageSize(size === 10 ? 10 : 20); setPage(1); }} />
    </div>
  );
}
type ComparisonRow = {
  label: string;
  self: number;
  rival: number;
  sovSelf: number;
  sovRival: number;
  position: string;
  rivalPosition: string;
};

function comparisonVerdict(row: ComparisonRow) {
  const selfPosition = Number.parseFloat(row.position) || 0;
  const rivalPosition = Number.parseFloat(row.rivalPosition) || 0;
  const selfWins = Number(row.self > row.rival) + Number(row.sovSelf > row.sovRival) + Number(selfPosition < rivalPosition);
  const rivalWins = Number(row.self < row.rival) + Number(row.sovSelf < row.sovRival) + Number(selfPosition > rivalPosition);
  return selfWins === rivalWins ? "引き分け" : selfWins > rivalWins ? "勝ち" : "競合先行";
}

function ComparisonTable({
  comparisonType,
  reportBase,
  rivalName,
  rows
}: {
  comparisonType: "persona" | "topic";
  reportBase: string;
  rivalName: string;
  rows: ComparisonRow[];
}) {
  const comparisonLabel = comparisonType === "persona" ? "ペルソナ" : "トピック";
  const selfBrand = competitors[0];
  const rivalBrand = competitors.find((brand) => brand.name === rivalName);
  const positionValues = (row: (typeof rows)[number]) => {
    const self = Number.parseFloat(row.position) || 0;
    const rival = Number.parseFloat(row.rivalPosition) || 0;
    return { self, rival };
  };
  const rateGap = (self: number, rival: number) => self === rival ? "同率" : self > rival ? "自社 +" + (self - rival) + "pt" : rivalName + " +" + (rival - self) + "pt";
  const positionGap = (self: number, rival: number) => self === rival ? "同順位" : self < rival ? "自社が" + Math.abs(self - rival).toFixed(1) + "位上" : rivalName + "が" + Math.abs(self - rival).toFixed(1) + "位上";

  return (
    <div className="overflow-hidden border-y border-[#DDE5E1] bg-white">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#DDE5E1] bg-[#FBFCFB] px-4 py-3 text-[11px] font-bold text-[#667085]">
        <span>比較対象</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#075E44]" aria-hidden="true" /><EntityIdentity name={selfBrand.name} logoUrl={selfBrand.logoUrl} compact /></span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#536878]" aria-hidden="true" /><EntityIdentity name={rivalName} logoUrl={rivalBrand?.logoUrl} compact /></span>
      </div>
      <div aria-hidden="true" className="hidden grid-cols-[minmax(170px,0.9fr)_minmax(230px,1.2fr)_minmax(210px,1.05fr)_minmax(145px,0.7fr)_96px] border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] lg:grid">
        <span className="px-4 py-2.5">{comparisonLabel}</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5">AI表示率</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5">AI内シェア</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5">平均掲載位置</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-center">判定</span>
      </div>

      <ol className="divide-y divide-[#E5EAE8]">
        {rows.map((row, index) => {
          const firstModel = activeModels[index % activeModels.length].name;
          const secondModel = activeModels[(index + 1) % activeModels.length].name;
          const code = comparisonType === "persona" ? "PER" : "TOP";
          const firstQuestion = comparisonType === "persona"
            ? row.label + "がGEO対策ツールを比較するときに重視すべき点は？"
            : row.label + "についてRecoraと" + rivalName + "を比較して";
          const secondQuestion = comparisonType === "persona"
            ? row.label + "向けのAI検索可視性ツールのおすすめは？"
            : row.label + "でおすすめのGEO対策ツールは？";
          const detailHref = comparisonType === "persona"
            ? reportBase + "/persona-topics/personas/" + encodeURIComponent(row.label)
            : reportBase + "/persona-topics/topics/" + encodeURIComponent(row.label);
          const positions = positionValues(row);
          const verdict = comparisonVerdict(row);
          const observations = [
            ["OBS-20260706-" + code + "-" + String(index + 1).padStart(2, "0") + "-01", "2026/07/06 06:04", row.label, firstModel, firstQuestion, verdict === "勝ち" ? "1位" : row.position, verdict === "勝ち" ? "2位" : "1位"],
            ["OBS-20260706-" + code + "-" + String(index + 1).padStart(2, "0") + "-02", "2026/07/06 06:15", row.label, secondModel, secondQuestion, verdict === "勝ち" ? "掲載あり・1位" : "掲載あり・3位", verdict === "勝ち" ? "掲載あり・2位" : "掲載あり・1位"]
          ];
          const rowDetail: ReportDetailPayload = {
            kicker: "COMPARISON",
            title: comparisonLabel + "：" + row.label,
            value: verdict,
            summary: "この" + comparisonLabel + "に属する固定質問で、Recoraと" + rivalName + "を同じ日・同じAIモデルで比較した結果です。",
            sections: [
              {
                title: "主要指標",
                table: {
                  columns: ["指標", "自社", rivalName, "差"],
                  rows: [
                    ["AI表示率", row.self + "%", row.rival + "%", rateGap(row.self, row.rival)],
                    ["AI内シェア", row.sovSelf + "%", row.sovRival + "%", rateGap(row.sovSelf, row.sovRival)],
                    ["平均掲載位置", positions.self.toFixed(1) + "位", positions.rival.toFixed(1) + "位", positionGap(positions.self, positions.rival)]
                  ]
                }
              },
              { title: row.label + "の代表比較観測", table: { columns: ["観測ID", "観測日時", comparisonLabel, "AIモデル", "固定質問", "Recora結果", rivalName + "結果"], rows: observations } }
            ],
            detailHref,
            detailLabel: row.label + "の全観測を確認"
          };
          const verdictDetail: ReportDetailPayload = {
            kicker: "COMPARISON VERDICT",
            title: row.label + " / " + verdict,
            value: verdict,
            summary: "AI表示率・AI内シェア・平均掲載位置を同じ固定質問で比較し、この軸の判定を構成した差を確認します。",
            sections: [
              {
                title: "判定を構成した指標",
                table: {
                  columns: ["指標", "自社", rivalName, "優位"],
                  rows: [
                    ["AI表示率", row.self + "%", row.rival + "%", row.self >= row.rival ? "自社" : rivalName],
                    ["AI内シェア", row.sovSelf + "%", row.sovRival + "%", row.sovSelf >= row.sovRival ? "自社" : rivalName],
                    ["平均掲載位置", positions.self.toFixed(1) + "位", positions.rival.toFixed(1) + "位", positions.self <= positions.rival ? "自社" : rivalName]
                  ]
                }
              },
              {
                title: "全" + comparisonLabel + "の判定",
                table: {
                  columns: [comparisonLabel, "判定", "AI表示率差", "AI内シェア差"],
                  rows: rows.map((item) => [item.label, comparisonVerdict(item), (item.self - item.rival) + "pt", (item.sovSelf - item.sovRival) + "pt"])
                }
              },
              { title: "代表比較観測", table: { columns: ["観測ID", "AIモデル", "固定質問", "自社", rivalName], rows: observations.map((item) => [item[0], item[3], item[4], item[5], item[6]]) } }
            ],
            detailHref,
            detailLabel: row.label + "の全観測を確認"
          };
          const metricDetail = (
            metricLabel: string,
            selfValue: number,
            rivalValue: number,
            position = false
          ): ReportDetailPayload => {
            const display = (value: number) => position ? value.toFixed(1) + "位" : value + "%";
            const gap = position ? positionGap(selfValue, rivalValue) : rateGap(selfValue, rivalValue);
            return {
              kicker: "COMPARISON METRIC",
              title: row.label + " / " + metricLabel,
              value: gap,
              summary: row.label + "の" + metricLabel + "を、同じ固定質問・期間で自社と" + rivalName + "に分けて比較します。",
              sections: [
                {
                  title: "この軸での比較",
                  facts: [
                    { label: "自社", value: display(selfValue) },
                    { label: rivalName, value: display(rivalValue) },
                    { label: "差", value: gap, tone: position ? (selfValue <= rivalValue ? "green" : "amber") : (selfValue >= rivalValue ? "green" : "amber") }
                  ]
                },
                {
                  title: metricLabel + "の全" + comparisonLabel + "比較",
                  table: {
                    columns: [comparisonLabel, "自社", rivalName, "差"],
                    rows: rows.map((item) => {
                      if (metricLabel === "AI表示率") return [item.label, item.self + "%", item.rival + "%", rateGap(item.self, item.rival)];
                      if (metricLabel === "AI内シェア") return [item.label, item.sovSelf + "%", item.sovRival + "%", rateGap(item.sovSelf, item.sovRival)];
                      const itemPositions = positionValues(item);
                      return [item.label, itemPositions.self.toFixed(1) + "位", itemPositions.rival.toFixed(1) + "位", positionGap(itemPositions.self, itemPositions.rival)];
                    })
                  }
                },
                { title: "代表比較観測", table: { columns: ["観測ID", "AIモデル", "固定質問", "自社", rivalName], rows: observations.map((item) => [item[0], item[3], item[4], item[5], item[6]]) } }
              ],
              detailHref,
              detailLabel: row.label + "の全観測を確認"
            };
          };

          return (
            <li className="grid min-w-0 grid-cols-2 lg:grid-cols-[minmax(170px,0.9fr)_minmax(230px,1.2fr)_minmax(210px,1.05fr)_minmax(145px,0.7fr)_96px]" key={row.label}>
              <ReportDetailButton
                      detail={rowDetail}
                showIcon={false}
                label={row.label + "の競合比較全体を詳しく見る"}
                className="group/axis col-span-2 !flex min-h-0 w-full items-center justify-between rounded-none px-4 py-3.5 text-left hover:bg-[#F5F9F7] focus-visible:ring-inset focus-visible:ring-offset-0 lg:col-span-1 lg:min-h-[108px]"
              >
                <span className="text-[14px] font-bold text-[#101828]">{row.label}</span>
                <ChevronRight className="h-4 w-4 text-[#8A9893] transition-transform group-hover/axis:translate-x-0.5" aria-hidden="true" />
              </ReportDetailButton>

              {[
                { label: "AI表示率", self: row.self, rival: row.rival },
                { label: "AI内シェア", self: row.sovSelf, rival: row.sovRival }
              ].map((metric, metricIndex) => (
                <ReportDetailButton
                  key={metric.label}
                  detail={metricDetail(metric.label, metric.self, metric.rival)}
                  showIcon={false}
                  label={row.label + "の" + metric.label + "を詳しく見る"}
                  className={cn("!block min-h-0 w-full rounded-none border-t border-[#E5EAE8] px-4 py-3 text-left hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 lg:min-h-[108px] lg:border-l lg:border-t-0", metricIndex === 1 && "border-l")}
                >
                  <span className="block text-[10px] font-bold text-[#667085] lg:hidden">{metric.label}</span>
                  <span className="mt-1 grid grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-2 text-[10px] font-semibold text-[#667085]">
                    <span>自社</span><span className="h-1.5 overflow-hidden rounded-full bg-[#E5ECE9]"><span className="block h-full rounded-full bg-[#075E44]" style={{ width: metric.self + "%" }} /></span><strong className="text-right text-[12px] tabular-nums text-[#101828]">{metric.self}%</strong>
                  </span>
                  <span className="mt-1.5 grid grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-2 text-[10px] font-semibold text-[#667085]">
                    <span>競合</span><span className="h-1.5 overflow-hidden rounded-full bg-[#E5ECE9]"><span className="block h-full rounded-full bg-[#536878]" style={{ width: metric.rival + "%" }} /></span><strong className="text-right text-[12px] tabular-nums text-[#101828]">{metric.rival}%</strong>
                  </span>
                  <span className={cn("mt-2 block text-right text-[10px] font-bold", metric.self >= metric.rival ? "text-[#075E44]" : "text-[#A15C00]")}>{rateGap(metric.self, metric.rival)}</span>
                </ReportDetailButton>
              ))}

              <ReportDetailButton
                detail={metricDetail("平均掲載位置", positions.self, positions.rival, true)}
                showIcon={false}
                label={row.label + "の平均掲載位置を詳しく見る"}
                className="!block min-h-0 w-full rounded-none border-t border-[#E5EAE8] px-4 py-3 text-left hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 lg:min-h-[108px] lg:border-l lg:border-t-0"
              >
                <span className="block text-[10px] font-bold text-[#667085]">平均掲載位置</span>
                <span className="mt-1 grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#667085]">
                  <span>自社 <strong className="ml-1 text-[14px] tabular-nums text-[#101828]">{positions.self.toFixed(1)}位</strong></span>
                  <span className="text-right">競合 <strong className="ml-1 text-[14px] tabular-nums text-[#101828]">{positions.rival.toFixed(1)}位</strong></span>
                </span>
                <span className={cn("mt-2 block text-right text-[10px] font-bold", positions.self <= positions.rival ? "text-[#075E44]" : "text-[#A15C00]")}>{positionGap(positions.self, positions.rival)}</span>
              </ReportDetailButton>

              <ReportDetailButton
                      detail={verdictDetail}
                showIcon={false}
                label={row.label + "の判定 " + verdict + "を詳しく見る"}
                className="!flex min-h-0 w-full items-center justify-center rounded-none border-l border-t border-[#E5EAE8] px-3 py-3 hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 lg:min-h-[108px] lg:border-t-0"
              >
                <DataRichBadge tone={verdict === "勝ち" ? "green" : verdict === "引き分け" ? "default" : "amber"}>{verdict}</DataRichBadge>
              </ReportDetailButton>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SampleResultFooter({ shown, total, unit }: { shown: number; total: number; unit: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-t border-[#E5E7EB] bg-[#FBFCFB] px-4 py-3 text-[11px] font-semibold leading-5 text-[#667085] sm:flex-row sm:items-center sm:justify-between">
      <span>先頭{shown}{unit}を表示</span>
      <span className="tabular-nums">全{total}{unit}</span>
    </div>
  );
}

const promptViewOptions: PromptView[] = ["すべて", "自社掲載あり", "自社未掲載", "競合先行", "公式サイト引用あり"];
const promptSortOptions: PromptSort[] = ["質問順", "AI表示率が低い", "悪化幅が大きい", "欠測率が高い"];

function FilterAndViewBar({
  activeView,
  onViewChange,
  visibleCount,
  searchQuery,
  onSearchQuery,
  filters,
  onFilterChange,
  sort,
  onSortChange,
  onReset
}: {
  activeView: PromptView;
  onViewChange: (view: PromptView) => void;
  visibleCount: number;
  searchQuery: string;
  onSearchQuery: (value: string) => void;
  filters: PromptFilters;
  onFilterChange: (key: PromptFilterKey, value: string) => void;
  sort: PromptSort;
  onSortChange: (value: PromptSort) => void;
  onReset: () => void;
}) {
  const filterDefinitions: { key: PromptFilterKey; label: string; options: string[] }[] = [
    { key: "type", label: "プロンプト種別", options: Array.from(new Set(promptRows.map((row) => row.type))) },
    { key: "importance", label: "重要度", options: Array.from(new Set(promptRows.map((row) => row.importance))) },
    { key: "persona", label: "ペルソナ", options: Array.from(new Set(promptRows.map((row) => row.persona))) },
    { key: "topic", label: "トピック", options: Array.from(new Set(promptRows.map((row) => row.topic))) },
    { key: "phase", label: "フェーズ", options: Array.from(new Set(promptRows.map((row) => row.phase))) },
    { key: "model", label: "強調するAIモデル", options: activeModels.map((model) => model.name) }
  ];
  const appliedFilters = filterDefinitions.filter(({ key }) => filters[key] !== "すべて");
  const hasCustomState = activeView !== "すべて" || Boolean(searchQuery.trim()) || appliedFilters.length > 0 || sort !== "質問順";
  const renderFilterControls = (idPrefix: string) => filterDefinitions.map(({ key, label, options }) => (
    <label key={idPrefix + "-" + key} htmlFor={idPrefix + "-" + key} className="min-w-0">
      <span className="mb-1 block text-[11px] font-bold text-[#667085]">{label}</span>
      <span className="relative block">
        <select
          id={idPrefix + "-" + key}
          value={filters[key]}
          onChange={(event) => onFilterChange(key, event.target.value)}
          className="min-h-11 w-full appearance-none rounded-md border border-[#D7E0DC] bg-white px-3 pr-9 text-[12px] font-bold text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-1"
        >
          <option value="すべて">すべて</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" strokeWidth={1.8} aria-hidden="true" />
      </span>
    </label>
  ));

  return (
    <section className="border-y border-[#D5E1DB] bg-[#F8FAF9] px-1 py-5 sm:px-4">
      <div className="mb-4 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#101828]">プロンプトを探す</h2>
          <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">状態・検索・属性の絞り込みは、下のモデル集計と一覧に連動します。</p>
        </div>
        <DataRichBadge tone="default">30日集計</DataRichBadge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {promptViewOptions.map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={activeView === view}
            onClick={() => onViewChange(view)}
            className={cn("min-h-10 rounded-md border px-3 text-[12px] font-bold", activeView === view ? "border-[#006B57] bg-[#EAF6F0] text-[#006B57]" : "border-[#DFE6E2] bg-white text-[#475569]")}
          >
            {view}
          </button>
        ))}
        <span className="ml-auto text-[12px] font-semibold tabular-nums text-[#667085]">{visibleCount}件</span>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(320px,1fr)_230px_auto]">
        <label htmlFor="prompt-search" className="relative block min-w-0">
          <span className="sr-only">質問文を検索</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" strokeWidth={1.8} aria-hidden="true" />
          <input
            id="prompt-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQuery(event.target.value)}
            placeholder="質問文・状況・ペルソナ・トピックを検索"
            className="min-h-11 w-full rounded-md border border-[#D7E0DC] bg-white pl-10 pr-3 text-[13px] font-medium text-[#101828] placeholder:text-[#98A2B3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-1"
          />
        </label>
        <label htmlFor="prompt-sort" className="relative block min-w-0">
          <span className="sr-only">並び替え</span>
          <select
            id="prompt-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as PromptSort)}
            className="min-h-11 w-full appearance-none rounded-md border border-[#D7E0DC] bg-white px-3 pr-9 text-[12px] font-bold text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-1"
          >
            {promptSortOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" strokeWidth={1.8} aria-hidden="true" />
        </label>
        <button
          type="button"
          disabled={!hasCustomState}
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#D7E0DC] bg-white px-3 text-[12px] font-bold text-[#475467] transition hover:border-[#9AB8AA] hover:bg-[#F4F8F6] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <X className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          条件をクリア
        </button>
      </div>

      <div className="mt-3 hidden grid-cols-3 gap-2 lg:grid xl:grid-cols-6">{renderFilterControls("prompt-filter-desktop")}</div>
      <details className="mt-3 rounded-md border border-[#DFE6E2] bg-white lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[12px] font-bold text-[#344054] [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2"><Filter className="h-4 w-4 text-[#006B57]" strokeWidth={1.8} aria-hidden="true" />詳細条件</span>
          <span className="text-[#667085]">{appliedFilters.length > 0 ? appliedFilters.length + "件適用中" : "すべて"}</span>
        </summary>
        <div className="grid gap-3 border-t border-[#DFE6E2] p-3 sm:grid-cols-2">{renderFilterControls("prompt-filter-mobile")}</div>
      </details>

      {appliedFilters.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="適用中の詳細条件">
          {appliedFilters.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => onFilterChange(key, "すべて")} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#B7D2C8] bg-[#EEF7F2] px-2.5 text-[11px] font-bold text-[#075E44]">
              {label}: {filters[key]} <X className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PromptPagination({
  page,
  totalPages,
  pageSize,
  shown,
  matched,
  contractTotal,
  onPage,
  onPageSize
}: {
  page: number;
  totalPages: number;
  pageSize: 25 | 50;
  shown: number;
  matched: number;
  contractTotal: number;
  onPage: (page: number) => void;
  onPageSize: (size: 25 | 50) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-t border-[#E5E7EB] bg-[#FBFCFB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] font-semibold leading-5 text-[#667085]">
        表示 {shown}件・条件一致 {matched}件 <span className="ml-1 text-[#475467]">/ 対象 {contractTotal}件</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="prompt-page-size" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#667085]">
          1ページ
          <select id="prompt-page-size" value={pageSize} onChange={(event) => onPageSize(Number(event.target.value) === 50 ? 50 : 25)} className="min-h-9 rounded-md border border-[#D7E0DC] bg-white px-2 font-bold text-[#344054]">
            <option value={25}>25件</option>
            <option value={50}>50件</option>
          </select>
        </label>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="前のページ" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D7E0DC] bg-white text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /></button>
        <span className="min-w-14 text-center text-[11px] font-bold tabular-nums text-[#344054]">{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="次のページ" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D7E0DC] bg-white text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function FilterEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white px-5 py-12 text-center" role="status">
      <p className="text-sm font-bold text-[#344054]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#667085]">{description}</p>
    </div>
  );
}

function ResultPagination({
  page,
  totalPages,
  pageSize,
  pageSizes,
  shown,
  matched,
  total,
  unit,
  onPage,
  onPageSize
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizes: readonly number[];
  shown: number;
  matched: number;
  total: number;
  unit: string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const selectId = `result-page-size-${unit}`;
  return (
    <div className="flex min-w-0 flex-col gap-3 border-t border-[#E5E7EB] bg-[#FBFCFB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] font-semibold leading-5 tabular-nums text-[#667085]">
        表示 {shown}{unit}・条件一致 {matched}{unit} <span className="ml-1 text-[#475467]">/ 全{total}{unit}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="inline-flex min-h-11 items-center gap-2 text-[12px] font-bold text-[#667085]">
          1ページ
          <select id={selectId} value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))} className="min-h-10 rounded-md border border-[#D7E0DC] bg-white px-2 font-bold text-[#344054]">
            {pageSizes.map((size) => <option key={size} value={size}>{size}件</option>)}
          </select>
        </label>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="前のページ" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#D7E0DC] bg-white text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /></button>
        <span className="min-w-16 text-center text-[12px] font-bold tabular-nums text-[#344054]">{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="次のページ" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#D7E0DC] bg-white text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function Heatmap({ reportBase, range }: { reportBase: string; range: ReportRange }) {
  const [comparisonBrandId, setComparisonBrandId] = useState("trailbase");
  const [urlReady, setUrlReady] = useState(false);
  const comparisonBrand = competitors.find((item) => item.id === comparisonBrandId) ?? competitors[1];
  const comparisonOptions = competitors.filter((item) => !item.isPrimary);

  useEffect(() => {
    const queryBrand = new URLSearchParams(window.location.search).get("heatmapCompare");
    if (competitors.some((item) => !item.isPrimary && item.id === queryBrand)) setComparisonBrandId(queryBrand ?? "trailbase");
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (urlReady) replaceCurrentQuery({ heatmapCompare: comparisonBrandId === "trailbase" ? null : comparisonBrandId });
  }, [comparisonBrandId, urlReady]);
  const rivalValueFor = (value: number, rowIndex: number, colIndex: number) => {
    const selfBrand = competitors.find((item) => item.isPrimary) ?? competitors[0];
    const brandIndex = Math.max(0, comparisonOptions.findIndex((item) => item.id === comparisonBrand.id));
    const marketStrength = Math.round((comparisonBrand.aiPresence - selfBrand.aiPresence) * 0.45 + (comparisonBrand.sov - selfBrand.sov) * 0.2);
    const topicVariation = (((brandIndex + 1) * (colIndex + 3) + colIndex * 5) % 9) - 4;
    const rowAdjustment = [1, -2, 2, -1, 0][rowIndex] ?? 0;
    return Math.max(8, Math.min(92, value + marketStrength + topicVariation + rowAdjustment));
  };

  const openCellDetail = (persona: string, topic: string, rowIndex: number, colIndex: number) => {
    const value = heatmapValues[rowIndex][colIndex];
    const observations = scaledHeatmapObservationCount(rowIndex, colIndex, range);
    const rivalValue = rivalValueFor(value, rowIndex, colIndex);
    const gap = value - rivalValue;
    const personaId = Object.entries(personaNameById).find(([, name]) => name === persona)?.[0] ?? "implementation";

    openReportDetail({
      kicker: "PERSONA × TOPIC",
      title: `${persona} × ${topic}`,
      value: `Recora ${value}%` ,
      summary: `${comparisonBrand.name}との差と、その差がどのAIモデル・引用状況で生まれているかを確認します。`,
      sections: [
        {
          title: `${comparisonBrand.name}との現在差`,
          facts: [
            { label: "Recora", value: `${value}%`, tone: value >= rivalValue ? "green" : "default" },
            { label: comparisonBrand.name, value: `${rivalValue}%` },
            { label: "差", value: `${gap > 0 ? "+" : ""}${gap}pt`, tone: gap < 0 ? "amber" : "green" },
            { label: "有効観測", value: `${observations}件` },
          ]
        },
        {
          title: "AIモデル別の差",
          table: {
            columns: ["AIモデル", "Recora", comparisonBrand.name, "差"],
            rows: activeModels.map((model, modelIndex) => {
              const selfByModel = Math.max(0, Math.min(100, value + activeModelVisibilityOffsets[modelIndex]));
              const rivalByModel = Math.max(0, Math.min(100, rivalValue + activeRivalVisibilityOffsets[modelIndex]));
              const modelGap = selfByModel - rivalByModel;
              return [model.name, `${selfByModel}%`, `${rivalByModel}%`, `${modelGap > 0 ? "+" : ""}${modelGap}pt`];
            })
          }
        },
        {
          title: "差を構成している情報",
          facts: [
            { label: "最多の先行競合", value: value >= 60 ? "Trailbase" : "SignalNest" },
            { label: "最多引用元", value: topic === "引用元" ? "marketing-ai.jp" : topic === "競合比較" ? "trailbase.io" : "recora.jp" },
            { label: "公式サイト引用率", value: `${Math.max(12, Math.min(68, value - 18))}%` },
            { label: "モデル間の最大差", value: `${Math.abs(gap) + 6}pt` }
          ]
        }
      ],
      detailHref: `${reportBase}/persona-topics/personas/${personaId}`,
      detailLabel: `${persona}の全トピックを分析`
    });
  };

  const renderCell = (persona: string, topic: string, rowIndex: number, colIndex: number, mobile = false) => {
    const value = heatmapValues[rowIndex][colIndex];
    const observations = scaledHeatmapObservationCount(rowIndex, colIndex, range);
    const rivalValue = rivalValueFor(value, rowIndex, colIndex);
    const gap = value - rivalValue;
    return (
      <button
        key={persona + "-" + topic}
        type="button"
        onClick={() => openCellDetail(persona, topic, rowIndex, colIndex)}
        aria-label={`${persona}・${topic}の${comparisonBrand.name}比較を開く`}
        className={cn(
          "min-w-0 text-left transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006B57]",
          mobile ? "rounded-md border border-[#DDE5E1] px-3 py-3" : "min-h-[112px] border-l border-[#E5EAE8] px-3 py-3"
        )}
        style={{ backgroundColor: heatmapColor(value) }}
      >
        {mobile ? <span className="block break-words text-[11px] font-bold leading-4 text-[#475467]">{topic}</span> : null}
        <span className={cn("block font-semibold tabular-nums text-[#0F172A]", mobile ? "mt-1 text-lg" : "text-xl")}>{value}%</span>
        <span className="mt-1 block text-[12px] font-semibold tabular-nums text-[#5D6B66]">{comparisonBrand.name} {rivalValue}%</span>
        <span className={cn("mt-1 block text-[12px] font-bold tabular-nums", gap < 0 ? "text-[#A15C00]" : "text-[#067647]")}>差 {gap > 0 ? "+" : ""}{gap}pt</span>
        <span className="mt-1.5 block text-[12px] font-semibold text-[#667085]">{observations}観測</span>
      </button>
    );
  };

  return (
    <div className="min-w-0">
      <div className="border-b border-[#DDE5E1] bg-[#F8FAF9] px-4 py-3">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#344054]">セル内の比較基準</p>
            <p className="mt-0.5 text-[11px] font-medium leading-5 text-[#667085]">RecoraのAI表示率、選択競合、差、有効観測を同じ位置に表示します。</p>
          </div>
          <label className="min-w-0 sm:w-[260px]">
            <span className="sr-only">ヒートマップの比較競合</span>
            <select value={comparisonBrandId} onChange={(event) => setComparisonBrandId(event.target.value)} className="h-11 w-full rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D]">
              {comparisonOptions.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#DDE5E1] pt-3 text-[12px] font-semibold text-[#5D6B66]" aria-label="ヒートマップの凡例">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-6 border border-[#C8DED5] bg-[#D8EFE5]" aria-hidden="true" />色が濃いほどRecoraのAI表示率が高い</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#067647]" aria-hidden="true" />緑の差はRecoraが先行</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#A15C00]" aria-hidden="true" />橙の差は競合が先行</span>
        </div>
      </div>

      <div className="hidden min-w-0 lg:block" role="table" aria-label={`ペルソナとトピック別のAI表示率。${comparisonBrand.name}と比較`}>
        <div className="grid bg-[#F5F8F6]" style={{ gridTemplateColumns: "170px repeat(6,minmax(112px,1fr))" }} role="row">
          <div className="flex min-h-14 items-center px-4 text-[11px] font-bold text-[#667085]" role="columnheader">ペルソナ</div>
          {topics.map((topic) => <div key={topic} className="flex min-h-14 items-center border-l border-[#DDE5E1] px-3 text-[11px] font-bold leading-4 text-[#475467]" role="columnheader">{topic}</div>)}
        </div>
        {personas.map((persona, rowIndex) => (
          <div key={persona} className="grid border-t border-[#DDE5E1]" style={{ gridTemplateColumns: "170px repeat(6,minmax(112px,1fr))" }} role="row">
            <div className="flex min-h-[112px] items-center bg-white px-4" role="rowheader">
              <span className="text-[12px] font-bold leading-5 text-[#101828]">{persona}</span>
            </div>
            {topics.map((topic, colIndex) => renderCell(persona, topic, rowIndex, colIndex))}
          </div>
        ))}
      </div>

      <div className="space-y-2 p-3 lg:hidden">
        {personas.map((persona, rowIndex) => (
          <details key={persona} className="group overflow-hidden rounded-md border border-[#DDE5E1] bg-white" open={rowIndex === 0}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[12px] font-bold text-[#101828] [&::-webkit-details-marker]:hidden">
              <span>{persona}</span>
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold tabular-nums text-[#667085]">
                {Math.min(...heatmapValues[rowIndex])}% - {Math.max(...heatmapValues[rowIndex])}%
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </summary>
            <div className="grid grid-cols-2 gap-2 border-t border-[#DDE5E1] p-3">
              {topics.map((topic, colIndex) => renderCell(persona, topic, rowIndex, colIndex, true))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function buildBrandBarDetail({
  row,
  rows,
  metric,
  selfValue
}: {
  row: { label: string; value: number; helper: string };
  rows: { label: string; value: number; helper: string }[];
  metric: "AI表示率" | "AI内シェア";
  selfValue: number;
}): ReportDetailPayload {
  const difference = row.value - selfValue;
  const differenceFact = {
    label: "Recoraとの差",
    value: `${difference > 0 ? "+" : ""}${difference}pt`,
    tone: row.label === "Recora" ? "green" as const : difference > 0 ? "amber" as const : "green" as const
  };

  if (metric === "AI表示率") {
    const validObservations = 14976;
    const listedObservations = Math.round((validObservations * row.value) / 100);
    return {
      kicker: "AI VISIBILITY",
      title: row.label,
      value: row.helper,
      summary: "このブランドがAI回答内に掲載された有効観測の割合です。掲載されなかった観測を含む分母から確認します。",
      sections: [
        {
          title: "掲載・未掲載の内訳",
          facts: [
            { label: "掲載観測", value: `${listedObservations.toLocaleString("ja-JP")}件` },
            { label: "未掲載観測", value: `${(validObservations - listedObservations).toLocaleString("ja-JP")}件` },
            { label: "有効観測", value: `${validObservations.toLocaleString("ja-JP")}件` },
            differenceFact
          ]
        },
        {
          title: "同じ条件のブランド比較",
          table: {
            columns: ["ブランド", "AI表示率", "Recoraとの差"],
            rows: rows.map((item) => [item.label, item.helper, `${item.value - selfValue > 0 ? "+" : ""}${item.value - selfValue}pt`])
          }
        },
        {
          title: "モデルごとの掲載差",
          table: {
            columns: ["AIモデル", "AI表示率", "Recoraとの差", "強い質問群"],
            rows: activeModels.map((model, index) => {
              const modelValue = Math.max(0, Math.min(100, row.value + [5, -4, 2, 7][index]));
              const selfModelValue = Math.max(0, Math.min(100, selfValue + [4, -3, 1, 6][index]));
              const gap = modelValue - selfModelValue;
              return [model.name, `${modelValue}%`, `${gap > 0 ? "+" : ""}${gap}pt`, ["競合比較", "料金", "第三者評価", "導入・運用"][index]];
            })
          }
        },
        {
          title: "質問群による違い",
          items: [
            { title: "競合比較", meta: row.value >= selfValue ? "自社より先行" : "自社が優位", description: "選定基準や推薦理由を求める質問" },
            { title: "料金・導入条件", meta: row.value >= 60 ? "掲載が安定" : "未掲載が残る", description: "プランと導入期間を比べる質問" },
            { title: "第三者評価", meta: row.label === "Recora" ? "相対的に弱い" : "競合優位になりやすい", description: "レビュー・導入事例を求める質問" }
          ]
        }
      ]
    };
  }

  const totalBrandMentions = 8640;
  const brandMentions = Math.round((totalBrandMentions * row.value) / 100);
  return {
    kicker: "SHARE OF VOICE",
    title: row.label,
    value: row.helper,
    summary: "全ブランド掲載回数のうち、このブランドが占める割合です。回答への掲載有無ではなく、ブランド掲載の構成比を示します。",
    sections: [
      {
        title: "ブランド掲載の構成",
        facts: [
          { label: "このブランドの掲載回数", value: `${brandMentions.toLocaleString("ja-JP")}回` },
          { label: "全ブランド掲載回数", value: `${totalBrandMentions.toLocaleString("ja-JP")}回` },
          { label: "AI内シェア", value: row.helper },
          differenceFact
        ]
      },
      {
        title: "AI内シェア構成比",
        table: {
          columns: ["ブランド", "AI内シェア", "構成上の順位"],
          rows: [...rows].sort((a, b) => b.value - a.value).map((item, index) => [item.label, item.helper, `${index + 1}位`])
        }
      },
        {
          title: "モデルごとのAI内シェア",
          table: {
            columns: ["AIモデル", "AI内シェア", "主な同時掲載ブランド", "主な推薦位置"],
            rows: activeModels.map((model, index) => [
              model.name,
              `${Math.max(0, Math.min(100, row.value + [3, -2, 1, 4][index]))}%`,
              ["Trailbase", "SignalNest", "Trailbase / SignalNest", "MentionMap"][index],
              row.value >= selfValue ? ["1〜2位", "2位", "1〜2位", "1位"][index] : ["2〜3位", "3位", "2位", "2〜3位"][index]
            ])
          }
        }
    ]
  };
}

function HorizontalBars({ rows, metric = "AI表示率" }: { rows: { label: string; value: number; helper: string }[]; metric?: "AI表示率" | "AI内シェア" }) {
  const selfValue = metric === "AI内シェア" ? competitors[0].sov : competitors[0].aiPresence;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <ReportDetailButton
          key={row.label}
          detail={buildBrandBarDetail({ row, rows, metric, selfValue })}
          className="grid w-full gap-2 rounded-sm px-1 py-1 hover:bg-[#F4F8F6] sm:grid-cols-[160px_minmax(0,1fr)_58px] sm:items-center"
        >
          <EntityIdentity name={row.label} compact />
          <DataRichInlineBar value={row.value} fillClassName={brandBarClass(row.label)} />
          <span className="text-right text-[13px] font-bold tabular-nums text-[#0F172A]">{row.helper}</span>
        </ReportDetailButton>
      ))}
    </div>
  );
}

function OverviewModelSummaryTable() {
  const best = {
    aiPresence: Math.max(...activeModels.map((model) => model.aiPresence)),
    sov: Math.max(...activeModels.map((model) => model.sov)),
    citationRate: Math.max(...activeModels.map((model) => model.citationRate)),
    averagePosition: Math.min(...activeModels.map((model) => model.averagePosition))
  };
  const valueClass = (isBest: boolean) => cn(
    "mt-1 text-[18px] font-semibold tabular-nums md:mt-0 md:text-[17px]",
    isBest ? "font-bold text-[#075E44]" : "text-[#101828]"
  );

  return (
    <div className="min-w-0 overflow-hidden border-y border-[#DDE5E1] bg-white">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(210px,1.25fr)_repeat(4,minmax(110px,0.72fr))] border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] md:grid"
      >
        <span className="px-5 py-3">AIモデル</span>
        <span className="border-l border-[#DDE5E1] px-4 py-3 text-right">AI表示率</span>
        <span className="border-l border-[#DDE5E1] px-4 py-3 text-right">AI内シェア（SOV）</span>
        <span className="border-l border-[#DDE5E1] px-4 py-3 text-right">公式サイト引用率</span>
        <span className="border-l border-[#DDE5E1] px-4 py-3 text-right">平均掲載位置</span>
      </div>

      <div className="divide-y divide-[#E5EAE8]">
        {activeModels.map((model) => (
          <section
            key={model.name}
            aria-label={model.name + "の指標"}
            className="min-w-0 px-4 py-4 sm:px-5 md:grid md:min-h-[76px] md:grid-cols-[minmax(210px,1.25fr)_repeat(4,minmax(110px,0.72fr))] md:items-stretch md:p-0"
          >
            <div className="flex min-w-0 items-center md:px-5">
              <ModelIdentity name={model.name} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 md:contents">
              <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                <dt className="text-[10px] font-bold text-[#667085] md:sr-only">AI表示率</dt>
                <dd className={valueClass(model.aiPresence === best.aiPresence)}>{model.aiPresence}%</dd>
              </div>
              <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                <dt className="text-[10px] font-bold text-[#667085] md:sr-only">AI内シェア（SOV）</dt>
                <dd className={valueClass(model.sov === best.sov)}>{model.sov}%</dd>
              </div>
              <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                <dt className="text-[10px] font-bold text-[#667085] md:sr-only">公式サイト引用率</dt>
                <dd className={valueClass(model.citationRate === best.citationRate)}>{model.citationRate}%</dd>
              </div>
              <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                <dt className="text-[10px] font-bold text-[#667085] md:sr-only">平均掲載位置</dt>
                <dd className={valueClass(model.averagePosition === best.averagePosition)}>{model.averagePosition}位</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}

function ModelSummaryTable({ highlightedProvider = "全モデル" }: { highlightedProvider?: ReportProvider }) {
  return (
    <div className="overflow-hidden border-y border-[#DDE5E1] bg-white">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(190px,1.1fr)_repeat(4,minmax(100px,0.7fr))_82px] border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] md:grid"
      >
        <span className="px-4 py-2.5">AIモデル</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">AI表示率</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">AI内シェア</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">公式サイト引用率</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">平均掲載位置</span>
        <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-center">判定</span>
      </div>

      <div className="divide-y divide-[#E5EAE8]">
        {activeModels.map((model) => {
          const highlighted = highlightedProvider === model.name;

          return (
            <section
              key={model.name}
              aria-label={model.name + "のプラットフォーム別サマリー"}
              className={cn(
                "min-w-0 px-4 py-4 md:grid md:min-h-[70px] md:grid-cols-[minmax(190px,1.1fr)_repeat(4,minmax(100px,0.7fr))_82px] md:items-stretch md:p-0",
                highlighted && "bg-[#F1F8F5]"
              )}
            >
              <div className="flex min-w-0 items-center justify-between gap-3 md:px-4">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <ModelIdentity name={model.name} compact />
                  {highlighted ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
                </span>
                <span className="md:hidden">
                  <DataRichBadge tone={model.verdict === "強い" ? "green" : "amber"}>{model.verdict}</DataRichBadge>
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 md:contents">
                <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                  <dt className="text-[10px] font-bold text-[#667085] md:sr-only">AI表示率</dt>
                  <dd className="mt-1 text-[17px] font-semibold tabular-nums text-[#101828] md:mt-0 md:text-[16px]">{model.aiPresence}%</dd>
                </div>
                <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                  <dt className="text-[10px] font-bold text-[#667085] md:sr-only">AI内シェア</dt>
                  <dd className="mt-1 text-[17px] font-semibold tabular-nums text-[#101828] md:mt-0 md:text-[16px]">{model.sov}%</dd>
                </div>
                <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                  <dt className="text-[10px] font-bold text-[#667085] md:sr-only">公式サイト引用率</dt>
                  <dd className="mt-1 text-[17px] font-semibold tabular-nums text-[#101828] md:mt-0 md:text-[16px]">{model.citationRate}%</dd>
                </div>
                <div className="min-w-0 md:flex md:items-center md:justify-end md:border-l md:border-[#E5EAE8] md:px-4">
                  <dt className="text-[10px] font-bold text-[#667085] md:sr-only">平均掲載位置</dt>
                  <dd className="mt-1 text-[17px] font-semibold tabular-nums text-[#101828] md:mt-0 md:text-[16px]">{model.averagePosition}位</dd>
                </div>
              </dl>

              <div className="hidden items-center justify-center border-l border-[#E5EAE8] md:flex">
                <DataRichBadge tone={model.verdict === "強い" ? "green" : "amber"}>{model.verdict}</DataRichBadge>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function RivalModelComparisonTable({
  rival,
  highlightedProvider = "全モデル"
}: {
  rival: (typeof competitors)[number];
  highlightedProvider?: ReportProvider;
}) {
  const self = competitors[0];
  const rows = activeModels.map((model, modelIndex) => ({
    model,
    aiPresence: {
      self: model.aiPresence,
      rival: Math.max(0, Math.min(100, rival.aiPresence + [4, -3, 1, 6][modelIndex]))
    },
    sov: {
      self: model.sov,
      rival: Math.max(0, Math.min(100, rival.sov + [2, -2, 1, 3][modelIndex]))
    },
    citationRate: {
      self: model.citationRate,
      rival: Math.max(0, Math.min(100, rival.citationRate + [3, -4, 2, 4][modelIndex]))
    },
    averagePosition: {
      self: model.averagePosition,
      rival: Math.max(1, rival.averagePosition + [0, 0.3, 0.1, -0.2][modelIndex])
    }
  }));
  const metrics = [
    { label: "AI表示率", position: false, read: (row: (typeof rows)[number]) => row.aiPresence },
    { label: "AI内シェア", position: false, read: (row: (typeof rows)[number]) => row.sov },
    { label: "公式サイト引用率", position: false, read: (row: (typeof rows)[number]) => row.citationRate },
    { label: "平均掲載位置", position: true, read: (row: (typeof rows)[number]) => row.averagePosition }
  ];
  const formatValue = (value: number, position: boolean) => position ? value.toFixed(1) + "位" : value + "%";
  const formatGap = (selfValue: number, rivalValue: number, position: boolean) => {
    if (selfValue === rivalValue) return position ? "同順位" : "同率";
    if (position) {
      const difference = Math.abs(selfValue - rivalValue).toFixed(1);
      return selfValue < rivalValue ? "自社が" + difference + "位上" : rival.name + "が" + difference + "位上";
    }
    const difference = Math.abs(selfValue - rivalValue);
    return selfValue > rivalValue ? "自社 +" + difference + "pt" : rival.name + " +" + difference + "pt";
  };
  const selfLeads = (selfValue: number, rivalValue: number, position: boolean) => position ? selfValue < rivalValue : selfValue > rivalValue;

  return (
    <div className="overflow-hidden border-y border-[#DDE5E1] bg-white">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#DDE5E1] bg-[#FBFCFB] px-4 py-3 text-[11px] font-bold text-[#667085]">
        <span>比較対象</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#075E44]" aria-hidden="true" /><EntityIdentity name={self.name} logoUrl={self.logoUrl} compact /></span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#536878]" aria-hidden="true" /><EntityIdentity name={rival.name} logoUrl={rival.logoUrl} compact /></span>
      </div>

      <div aria-hidden="true" className="hidden grid-cols-[minmax(176px,0.9fr)_repeat(4,minmax(135px,0.75fr))] border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] lg:grid">
        <span className="px-4 py-2.5">AIモデル</span>
        {metrics.map((metric) => <span key={metric.label} className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">{metric.label}</span>)}
      </div>

      <ol className="divide-y divide-[#E5EAE8]">
        {rows.map((row) => {
          const highlighted = highlightedProvider === row.model.name;
          const modelDetail: ReportDetailPayload = {
            kicker: "MODEL × COMPETITOR",
            title: row.model.name,
            value: self.name + " vs " + rival.name,
            summary: row.model.name + "の同じ固定質問集合で、4指標の自社・競合差を確認します。",
            sections: [{
              title: "このモデルの全指標",
              table: {
                columns: ["指標", self.name, rival.name, "差"],
                rows: metrics.map((metric) => {
                  const values = metric.read(row);
                  return [metric.label, formatValue(values.self, metric.position), formatValue(values.rival, metric.position), formatGap(values.self, values.rival, metric.position)];
                })
              }
            }]
          };

          return (
            <li
              key={row.model.name}
              className={cn(
                "grid min-w-0 grid-cols-2 lg:grid-cols-[minmax(176px,0.9fr)_repeat(4,minmax(135px,0.75fr))]",
                highlighted && "bg-[#F1F8F5]"
              )}
            >
              <ReportDetailButton
                detail={modelDetail}
                showIcon={false}
                label={row.model.name + "の競合比較を詳しく見る"}
                className="group/model col-span-2 !flex min-h-0 w-full items-center justify-between rounded-none px-4 py-3.5 text-left hover:bg-[#EAF4F0] focus-visible:ring-inset focus-visible:ring-offset-0 lg:col-span-1 lg:min-h-[92px]"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <ModelIdentity name={row.model.name} compact />
                  {highlighted ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#8A9893] transition-transform group-hover/model:translate-x-0.5" aria-hidden="true" />
              </ReportDetailButton>

              {metrics.map((metric, metricIndex) => {
                const values = metric.read(row);
                const gap = formatGap(values.self, values.rival, metric.position);
                const favorable = selfLeads(values.self, values.rival, metric.position);
                const detail: ReportDetailPayload = {
                  kicker: "MODEL METRIC × COMPETITOR",
                  title: row.model.name + " / " + metric.label,
                  value: gap,
                  summary: row.model.name + "の" + metric.label + "を、同じ質問集合・同じ期間で自社と" + rival.name + "に分けて比較します。",
                  sections: [
                    {
                      title: "このモデルでの比較",
                      facts: [
                        { label: self.name, value: formatValue(values.self, metric.position) },
                        { label: rival.name, value: formatValue(values.rival, metric.position) },
                        { label: "差", value: gap, tone: favorable ? "green" : "amber" }
                      ]
                    },
                    {
                      title: metric.label + "のモデル横断比較",
                      table: {
                        columns: ["AIモデル", self.name, rival.name, "差"],
                        rows: rows.map((item) => {
                          const itemValues = metric.read(item);
                          return [item.model.name, formatValue(itemValues.self, metric.position), formatValue(itemValues.rival, metric.position), formatGap(itemValues.self, itemValues.rival, metric.position)];
                        })
                      }
                    }
                  ]
                };

                return (
                  <ReportDetailButton
                    key={metric.label}
                    detail={detail}
                    showIcon={false}
                    label={row.model.name + "の" + metric.label + "を詳しく見る"}
                    className={cn(
                      "min-h-0 w-full rounded-none border-t border-[#E5EAE8] px-4 py-3 text-left hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 lg:min-h-[92px] lg:border-l lg:border-t-0",
                      metricIndex % 2 === 1 && "border-l"
                    )}
                  >
                    <span className="block text-[10px] font-bold text-[#667085] lg:hidden">{metric.label}</span>
                    <span className="mt-1 grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#667085]">
                      <span>自社 <strong className="ml-1 text-[15px] tabular-nums text-[#101828]">{formatValue(values.self, metric.position)}</strong></span>
                      <span className="text-right">競合 <strong className="ml-1 text-[15px] tabular-nums text-[#101828]">{formatValue(values.rival, metric.position)}</strong></span>
                    </span>
                    <span className={cn("mt-1.5 block text-right text-[11px] font-bold", favorable ? "text-[#075E44]" : "text-[#A15C00]")}>{gap}</span>
                  </ReportDetailButton>
                );
              })}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ModelCards({
  showRival = false,
  highlightedProvider = "全モデル",
  interactive = true,
  rival = competitors[1]
}: {
  showRival?: boolean;
  highlightedProvider?: ReportProvider;
  interactive?: boolean;
  rival?: (typeof competitors)[number];
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {activeModels.map((model, modelIndex) => {
        const highlighted = highlightedProvider === model.name;
        const rivalPresence = Math.max(0, Math.min(100, rival.aiPresence + [4, -3, 1, 6][modelIndex]));
        const rivalSov = Math.max(0, Math.min(100, rival.sov + [2, -2, 1, 3][modelIndex]));
        const rivalCitation = Math.max(0, Math.min(100, rival.citationRate + [3, -4, 2, 4][modelIndex]));
        const detail: ReportDetailPayload = showRival ? {
          kicker: "モデル内の競合比較",
          title: `${model.name}：Recora vs ${rival.name}`,
          value: `AI表示率差 ${model.aiPresence - rivalPresence > 0 ? "+" : ""}${model.aiPresence - rivalPresence}pt`,
          summary: `${model.name}だけに絞り、Recoraと${rival.name}の表示・存在感・引用の差を比較します。`,
          sections: [
            {
              title: "このモデルでの比較",
              table: {
                columns: ["ブランド", "AI表示率", "AI内シェア", "公式サイト引用率", "平均掲載位置"],
                rows: [
                  ["Recora", `${model.aiPresence}%`, `${model.sov}%`, `${model.citationRate}%`, `${model.averagePosition}位`],
                  [rival.name, `${rivalPresence}%`, `${rivalSov}%`, `${rivalCitation}%`, `${Math.max(1, rival.averagePosition + [0, .3, .1, -.2][modelIndex]).toFixed(1)}位`]
                ]
              }
            },
            {
              title: "差が大きいトピック",
              table: {
                columns: ["トピック", "Recora", rival.name, "差"],
                rows: [
                  ["競合比較", `${Math.max(20, model.aiPresence - 5)}%`, `${Math.min(92, rivalPresence + 4)}%`, `-${Math.max(4, rivalPresence - model.aiPresence + 9)}pt`],
                  ["料金", `${Math.max(18, model.aiPresence - 9)}%`, `${Math.max(24, rivalPresence - 7)}%`, `-${Math.max(2, rivalPresence - model.aiPresence + 2)}pt`],
                  ["導入・運用", `${Math.min(91, model.aiPresence + 6)}%`, `${Math.min(89, rivalPresence + 1)}%`, `${model.aiPresence + 5 - rivalPresence > 0 ? "+" : ""}${model.aiPresence + 5 - rivalPresence}pt`]
                ]
              }
            },
            {
              title: "他モデルでも同じ差か",
              table: {
                columns: ["AIモデル", "Recora", rival.name, "差"],
                rows: activeModels.map((item, itemIndex) => {
                  const competitorValue = Math.max(0, Math.min(100, rival.aiPresence + [4, -3, 1, 6][itemIndex]));
                  const gap = item.aiPresence - competitorValue;
                  return [item.name, `${item.aiPresence}%`, `${competitorValue}%`, `${gap > 0 ? "+" : ""}${gap}pt`];
                })
              }
            }
          ]
        } : {
          title: `${model.name}の観測内訳`,
          value: `AI表示率 ${model.aiPresence}%`,
          summary: "このAIモデルで観測したRecoraの表示・存在感・引用を確認します。",
          sections: [
            { title: "主要指標", facts: [{ label: "AI表示率", value: `${model.aiPresence}%` }, { label: "AI内シェア", value: `${model.sov}%` }, { label: "公式サイト引用率", value: `${model.citationRate}%` }, { label: "平均掲載位置", value: `${model.averagePosition}位` }] }
          ]
        };
        const className = cn(
          "flex w-full items-stretch rounded-md border p-3 transition-colors",
          highlighted ? "border-[#0B382D] bg-[#F1F8F5] ring-1 ring-[#0B382D]/15" : "border-[#E5EAE8] bg-[#FAFCFB]"
        );
        const content = (
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span>
                <ModelIdentity name={model.name} />
                <span className="mt-1 block text-[12px] font-semibold text-[#64748B]">
                  {highlighted ? "選択中" : showRival ? `Recora / ${rival.name}` : model.verdict}
                </span>
              </span>
              <DataRichBadge tone={model.verdict === "強い" ? "green" : "amber"}>{model.verdict}</DataRichBadge>
            </span>
            <span className="mt-3 grid grid-cols-3 gap-2">
              <MiniMetric label={showRival ? "AI表示率 自社 / 競合" : "AI表示率"} value={showRival ? `${model.aiPresence}% / ${rivalPresence}%` : `${model.aiPresence}%`} />
              <MiniMetric label={showRival ? "AI内シェア 自社 / 競合" : "AI内シェア"} value={showRival ? `${model.sov}% / ${rivalSov}%` : `${model.sov}%`} />
              <MiniMetric label={showRival ? "引用率 自社 / 競合" : "公式サイト引用率"} value={showRival ? `${model.citationRate}% / ${rivalCitation}%` : `${model.citationRate}%`} />
            </span>
          </span>
        );

        return interactive ? (
          <ReportDetailButton key={model.name} detail={detail} className={className}>{content}</ReportDetailButton>
        ) : (
          <div key={model.name} className={className}>{content}</div>
        );
      })}
    </div>
  );
}

function ModelRankingTable({
  selectedBrands,
  highlightedProvider = "全モデル"
}: {
  selectedBrands: typeof competitors;
  highlightedProvider?: ReportProvider;
}) {
  const self = competitors.find((item) => item.isPrimary) ?? competitors[0];
  const comparisonBrands = [self, ...selectedBrands];
  const modelValue = (brand: (typeof competitors)[number], modelIndex: number) => ({
    aiPresence: Math.max(0, Math.min(100, brand.aiPresence + [4, -3, 1, 6][modelIndex])),
    sov: Math.max(0, Math.min(100, brand.sov + [2, -2, 1, 3][modelIndex]))
  });
  const desktopColumns = "150px repeat(" + comparisonBrands.length + ", minmax(0, 1fr)) 160px";

  return (
    <div className="bg-white">
      <div className="hidden xl:block">
        <div className="grid border-b border-[#D8E1DD] bg-[#F5F8F6]" style={{ gridTemplateColumns: desktopColumns }}>
          <div className="flex min-h-16 items-center px-4 text-[11px] font-bold text-[#667085]">AIモデル</div>
          {comparisonBrands.map((brand) => (
            <div key={brand.id} className="flex min-h-16 min-w-0 items-center border-l border-[#D8E1DD] px-3">
              <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
            </div>
          ))}
          <div className="flex min-h-16 items-center border-l border-[#D8E1DD] px-3 text-[11px] font-bold text-[#667085]">モデル内首位</div>
        </div>
        <div className="divide-y divide-[#D8E1DD]">
          {activeModels.map((model, modelIndex) => {
            const ranked = [...competitors].sort((a, b) => modelValue(b, modelIndex).aiPresence - modelValue(a, modelIndex).aiPresence);
            const leader = ranked[0];
            const selected = highlightedProvider === model.name;
            return (
              <div key={model.name} className="grid min-w-0" style={{ gridTemplateColumns: desktopColumns }}>
                <div className={cn("flex min-h-[116px] min-w-0 items-center px-4", selected ? "bg-[#F1F8F5]" : "bg-white")}>
                  <span>
                    <ModelIdentity name={model.name} compact />
                    {selected ? <span className="mt-1.5 inline-flex rounded-sm bg-[#DCEFE6] px-2 py-0.5 text-[10px] font-bold text-[#075E44]">選択中</span> : null}
                  </span>
                </div>
                {comparisonBrands.map((brand) => {
                  const values = modelValue(brand, modelIndex);
                  const selfValues = modelValue(self, modelIndex);
                  const gap = values.aiPresence - selfValues.aiPresence;
                  const detail: ReportDetailPayload = {
                    kicker: "MODEL × BRAND",
                    title: model.name + " / " + brand.name,
                    value: "AI表示率 " + values.aiPresence + "%",
                    summary: model.name + "の同じ固定質問集合で、選択ブランドのAI表示率とAI内シェアを比較します。",
                    sections: [
                      { title: "この交差条件", facts: [
                        { label: "AIモデル", value: model.name },
                        { label: "ブランド", value: brand.name },
                        { label: "AI表示率", value: values.aiPresence + "%" },
                        { label: "AI内シェア", value: values.sov + "%" },
                        { label: "Recoraとの差", value: (gap > 0 ? "+" : "") + gap + "pt", tone: gap > 0 ? "amber" : "green" }
                      ] },
                      { title: "同じモデルでブランド比較", table: {
                        columns: ["ブランド", "AI表示率", "AI内シェア", "Recoraとの差"],
                        rows: comparisonBrands.map((candidate) => {
                          const candidateValue = modelValue(candidate, modelIndex);
                          const candidateGap = candidateValue.aiPresence - selfValues.aiPresence;
                          return [candidate.name, candidateValue.aiPresence + "%", candidateValue.sov + "%", (candidateGap > 0 ? "+" : "") + candidateGap + "pt"];
                        })
                      } },
                      { title: "他モデルでも同じ差か", table: {
                        columns: ["AIモデル", brand.name, "Recora", "差"],
                        rows: activeModels.map((candidateModel, candidateIndex) => {
                          const brandValue = modelValue(brand, candidateIndex).aiPresence;
                          const recoraValue = modelValue(self, candidateIndex).aiPresence;
                          const modelGap = brandValue - recoraValue;
                          return [candidateModel.name, brandValue + "%", recoraValue + "%", (modelGap > 0 ? "+" : "") + modelGap + "pt"];
                        })
                      } }
                    ]
                  };
                  return (
                    <ReportDetailButton
                      key={brand.id}
                      detail={detail}
                      showIcon={false}
                      label={model.name + "における" + brand.name + "の比較を詳しく見る"}
                      className={cn("!flex min-h-[116px] min-w-0 w-full items-center justify-start rounded-none border-l border-[#D8E1DD] px-3 py-3 text-left hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0", selected ? "bg-[#F1F8F5]" : "bg-white")}
                    >
                      <span className="block min-w-0">
                        <span className="block text-[18px] font-semibold tabular-nums text-[#101828]">{values.aiPresence}%</span>
                        <span className="mt-1 block text-[12px] font-semibold tabular-nums text-[#667085]">AI内シェア {values.sov}%</span>
                        {!brand.isPrimary ? <span className={cn("mt-1 block text-[12px] font-bold tabular-nums", gap > 0 ? "text-[#8A4B00]" : "text-[#067647]")}>自社比 {gap > 0 ? "+" : ""}{gap}pt</span> : <span className="mt-1 block text-[12px] font-bold text-[#075E44]">基準</span>}
                      </span>
                    </ReportDetailButton>
                  );
                })}
                <div className={cn("flex min-h-[116px] min-w-0 items-center border-l border-[#D8E1DD] px-3", selected ? "bg-[#F1F8F5]" : "bg-white")}>
                  <EntityIdentity name={leader.name} logoUrl={leader.logoUrl} compact />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-[#D8E1DD] xl:hidden">
        {activeModels.map((model, modelIndex) => {
          const ranked = [...competitors].sort((a, b) => modelValue(b, modelIndex).aiPresence - modelValue(a, modelIndex).aiPresence);
          const leader = ranked[0];
          const selected = highlightedProvider === model.name;
          const selfValues = modelValue(self, modelIndex);
          return (
            <article key={model.name} className={selected ? "bg-[#F1F8F5]" : "bg-white"}>
              <header className="flex min-w-0 items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <ModelIdentity name={model.name} />
                  {selected ? <span className="mt-1.5 inline-flex rounded-sm bg-[#DCEFE6] px-2 py-0.5 text-[10px] font-bold text-[#075E44]">選択中</span> : null}
                </div>
                <div className="min-w-0 text-right">
                  <span className="mb-1 block text-[10px] font-bold text-[#667085]">モデル内首位</span>
                  <EntityIdentity name={leader.name} logoUrl={leader.logoUrl} compact />
                </div>
              </header>
              <div className={cn("grid gap-px bg-[#D8E1DD]", comparisonBrands.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
                {comparisonBrands.map((brand) => {
                  const values = modelValue(brand, modelIndex);
                  const gap = values.aiPresence - selfValues.aiPresence;
                  const detail: ReportDetailPayload = {
                    kicker: "MODEL × BRAND",
                    title: model.name + " / " + brand.name,
                    value: "AI表示率 " + values.aiPresence + "%",
                    summary: model.name + "の同じ固定質問集合で、選択ブランドのAI表示率とAI内シェアを比較します。",
                    sections: [
                      { title: "この交差条件", facts: [
                        { label: "AIモデル", value: model.name },
                        { label: "ブランド", value: brand.name },
                        { label: "AI表示率", value: values.aiPresence + "%" },
                        { label: "AI内シェア", value: values.sov + "%" },
                        { label: "Recoraとの差", value: (gap > 0 ? "+" : "") + gap + "pt", tone: gap > 0 ? "amber" : "green" }
                      ] },
                      { title: "同じモデルでブランド比較", table: {
                        columns: ["ブランド", "AI表示率", "AI内シェア", "Recoraとの差"],
                        rows: comparisonBrands.map((candidate) => {
                          const candidateValue = modelValue(candidate, modelIndex);
                          const candidateGap = candidateValue.aiPresence - selfValues.aiPresence;
                          return [candidate.name, candidateValue.aiPresence + "%", candidateValue.sov + "%", (candidateGap > 0 ? "+" : "") + candidateGap + "pt"];
                        })
                      } },
                      { title: "他モデルでも同じ差か", table: {
                        columns: ["AIモデル", brand.name, "Recora", "差"],
                        rows: activeModels.map((candidateModel, candidateIndex) => {
                          const brandValue = modelValue(brand, candidateIndex).aiPresence;
                          const recoraValue = modelValue(self, candidateIndex).aiPresence;
                          const modelGap = brandValue - recoraValue;
                          return [candidateModel.name, brandValue + "%", recoraValue + "%", (modelGap > 0 ? "+" : "") + modelGap + "pt"];
                        })
                      } }
                    ]
                  };
                  return (
                    <ReportDetailButton key={brand.id} detail={detail} showIcon={false} label={model.name + "における" + brand.name + "の比較を詳しく見る"} className="!block min-w-0 w-full rounded-none bg-white px-4 py-4 text-left hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0">
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <EntityIdentity name={brand.name} logoUrl={brand.logoUrl} compact />
                        <span className="shrink-0 text-right">
                          <span className="block text-[18px] font-semibold tabular-nums text-[#101828]">{values.aiPresence}%</span>
                          <span className="block text-[11px] font-semibold tabular-nums text-[#667085]">AI内シェア {values.sov}%</span>
                        </span>
                      </span>
                      <span className={cn("mt-2 block text-[12px] font-bold tabular-nums", brand.isPrimary ? "text-[#075E44]" : gap > 0 ? "text-[#8A4B00]" : "text-[#067647]")}>{brand.isPrimary ? "Recora基準" : "自社比 " + (gap > 0 ? "+" : "") + gap + "pt"}</span>
                    </ReportDetailButton>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type ModelMetricDetailType = "persona-topic" | "prompt-coverage" | "citation-footprint" | "brand-message" | "recommendation-evidence";

function buildModelMetricDetail({
  detailType,
  row,
  rows,
  primaryLabel,
  secondaryLabel
}: {
  detailType: ModelMetricDetailType;
  row: { model: string; primary: string; secondary: string; detail: string };
  rows: { model: string; primary: string; secondary: string; detail: string }[];
  primaryLabel: string;
  secondaryLabel: string;
}): ReportDetailPayload {
  const copy = {
    "persona-topic": {
      kicker: "PERSONA × TOPIC",
      summary: "このモデルが、どのペルソナとトピックでRecoraを表示したかを分けて確認します。",
      currentTitle: "このモデルの対象別成績",
      focusLabel: "最も表示されるペルソナ",
      comparisonTitle: "同じペルソナ・トピック条件で比較"
    },
    "prompt-coverage": {
      kicker: "PROMPT COVERAGE",
      summary: "このモデルで自社が掲載された質問と、掲載後に自社URLまで引用された質問を分けて確認します。",
      currentTitle: "このモデルの質問カバレッジ",
      focusLabel: "掲載が多い質問群",
      comparisonTitle: "同じ質問集合でモデル比較"
    },
    "citation-footprint": {
      kicker: "CITATION FOOTPRINT",
      summary: "このモデルの公式サイト引用率と、参照されたユニークドメインの広がりを確認します。",
      currentTitle: "このモデルの引用構成",
      focusLabel: "最多の引用元区分",
      comparisonTitle: "同じ期間の引用をモデル比較"
    },
    "brand-message": {
      kicker: "BRAND MESSAGE",
      summary: "登録した重要メッセージが、このモデルの回答でどのように表現され、公式事実と一致しているかを確認します。",
      currentTitle: "このモデルのメッセージ反映",
      focusLabel: "最も反映されたメッセージ",
      comparisonTitle: "同じ重要メッセージをモデル比較"
    },
    "recommendation-evidence": {
      kicker: "候補根拠の分布",
      summary: "このモデルで、改善候補の根拠になった固定質問と引用ギャップ観測が何件あるかを示します。施策効果の予測ではありません。",
      currentTitle: "このモデルで確認された根拠",
      focusLabel: "根拠が集中する領域",
      comparisonTitle: "同じ期間の候補根拠をモデル比較"
    }
  }[detailType];

  const modelCode = modelObservationCode(row.model);
  let traceSection: ReportDetailPayload["sections"][number];

  if (detailType === "persona-topic") {
    traceSection = {
      title: "このペルソナ・トピックの代表観測",
      description: "選択モデルで、対象ペルソナがどのトピックの固定質問にどう掲載されたかを確認します。",
      table: {
        columns: ["観測ID", "観測日時", "AIモデル", "ペルソナ", "トピック", "固定質問", "掲載結果"],
        rows: [
          [`OBS-20260706-${modelCode}-PT-01`, "2026/07/06 06:04", row.model, row.detail, "競合比較", "GEO対策ツールのおすすめは？", row.model === "Gemini" ? "有効・自社未掲載" : "自社掲載・2位"],
          [`OBS-20260706-${modelCode}-PT-02`, "2026/07/06 06:11", row.model, row.detail, "引用元", "AI検索で自社が引用されるには何を整備すべき？", row.model === "Perplexity" ? "自社掲載・1位" : "自社掲載・3位"]
        ]
      }
    };
  } else if (detailType === "prompt-coverage") {
    traceSection = {
      title: "掲載・引用判定まで遡る質問",
      description: "質問カバレッジを、固定質問ごとの自社掲載と自社引用に分けて確認します。",
      table: {
        columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "自社掲載", "自社引用", "引用URL"],
        rows: [
          [`OBS-20260706-${modelCode}-PC-01`, "2026/07/06 06:04", row.model, "GEO対策ツールのおすすめは？", "掲載あり・2位", "あり", "https://recora.jp/products/ai-visibility-monitor"],
          [`OBS-20260706-${modelCode}-PC-02`, "2026/07/06 06:11", row.model, "AI検索で自社が引用されるには何を整備すべき？", row.model === "Gemini" ? "未掲載" : "掲載あり・3位", "なし", "—"]
        ]
      }
    };
  } else if (detailType === "citation-footprint") {
    const citationUrls = row.model === "Gemini"
      ? ["https://marketing-ai.jp/research/ai-search-2026", "https://saas-review.example/ai-search"]
      : row.model === "Perplexity"
        ? ["https://recora.jp/guide", "https://marketing-ai.jp/research/ai-search-2026"]
        : ["https://recora.jp/products/ai-visibility-monitor", "https://trailbase.io/compare/geo-tools"];
    traceSection = {
      title: "このモデルの引用観測",
      description: "引用集計から、完全URLと回答内の対応箇所まで遡ります。引用は主張を支持したという判定ではありません。",
      table: {
        columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "引用URL", "所有区分", "対応する回答箇所"],
        rows: [
          [`OBS-20260706-${modelCode}-CF-01`, "2026/07/06 06:08", row.model, "GEO対策ツールのおすすめは？", citationUrls[0], citationUrls[0].includes("recora.jp") ? "自社公式" : "第三者", "選定基準を列挙した段落"],
          [`OBS-20260706-${modelCode}-CF-02`, "2026/07/06 06:19", row.model, "AI検索で自社が引用されるには何を整備すべき？", citationUrls[1], citationUrls[1].includes("trailbase.io") ? "競合公式" : "第三者", "引用元整備を説明した段落"]
        ]
      }
    };
  } else if (detailType === "brand-message") {
    traceSection = {
      title: "反映された重要メッセージ",
      description: "完全一致だけでなく、同じ意味で言い換えられた回答も分けて表示します。",
      table: {
        columns: ["重要メッセージ", "回答内の表現", "判定", "該当回答", "確認対象"],
        rows: [
          ["AI検索可視性を日次で観測", "固定質問を毎日追跡する", "意味一致", `${Math.max(12, Number.parseInt(row.primary, 10) / 4).toFixed(0)}回答`, row.model],
          ["競合差と引用元を根拠付きで確認", row.detail, Number.parseInt(row.secondary, 10) >= 90 ? "一致" : "一部反映", `${Math.max(8, Number.parseInt(row.secondary, 10) / 6).toFixed(0)}回答`, row.model]
        ]
      }
    };
  } else {
    traceSection = {
      title: "改善候補に紐づく根拠観測",
      description: "候補の根拠になった観測を示します。施策実施後の効果を予測・保証するものではありません。",
      table: {
        columns: ["候補ID", "観測ID", "観測日時", "AIモデル", "固定質問", "根拠の種類", "関連URL"],
        rows: [
          ["REC-R01", `OBS-20260706-${modelCode}-RE-01`, "2026/07/06 06:04", row.model, "GEO対策ツールのおすすめは？", "競合先行・自社2位", "—"],
          ["REC-R02", `OBS-20260706-${modelCode}-RE-02`, "2026/07/06 06:11", row.model, "AI検索で自社が引用されるには何を整備すべき？", "自社引用なし・第三者URL使用", "https://marketing-ai.jp/research/ai-search-2026"]
        ]
      }
    };
  }

  return {
    kicker: copy.kicker,
    title: row.model,
    value: `${primaryLabel} ${row.primary}`,
    summary: copy.summary,
    sections: [
      {
        title: copy.currentTitle,
        facts: [
          { label: "AIモデル", value: row.model },
          { label: primaryLabel, value: row.primary },
          { label: secondaryLabel, value: row.secondary },
          ...(detailType === "prompt-coverage" ? [{ label: "未掲載質問", value: `${Math.max(0, dashboardScope.questionCount - Number.parseInt(row.primary, 10))}件` }] : []),
          { label: copy.focusLabel, value: row.detail }
        ]
      },
      ...(detailType === "prompt-coverage" ? [] : [{
        title: copy.comparisonTitle,
        table: {
          columns: ["AIモデル", primaryLabel, secondaryLabel, copy.focusLabel],
          rows: rows.map((item) => [item.model, item.primary, item.secondary, item.detail])
        }
      }]),
      traceSection
    ]
  };
}

function buildModelMetricValueDetail({
  detailType,
  row,
  rows,
  metricLabel,
  metricValue,
  primaryLabel,
  secondaryLabel,
  detailLabel
}: {
  detailType: ModelMetricDetailType;
  row: { model: string; primary: string; secondary: string; detail: string };
  rows: { model: string; primary: string; secondary: string; detail: string }[];
  metricLabel: string;
  metricValue: string;
  primaryLabel: string;
  secondaryLabel: string;
  detailLabel: string;
}): ReportDetailPayload {
  const valueOf = (item: (typeof rows)[number]) => {
    const rawValue = metricLabel === primaryLabel ? item.primary : item.secondary;
    const parenthesizedRate = rawValue.match(/\((-?\d+(?:\.\d+)?)%\)/);
    if (parenthesizedRate) return Number.parseFloat(parenthesizedRate[1]) || 0;
    const firstNumber = rawValue.match(/-?\d+(?:\.\d+)?/);
    return firstNumber ? Number.parseFloat(firstNumber[0]) || 0 : 0;
  };
  const rankedRows = [...rows].sort((a, b) => valueOf(b) - valueOf(a));
  const rank = rankedRows.findIndex((item) => item.model === row.model) + 1;
  const leader = rankedRows[0];
  const baseDetail = buildModelMetricDetail({ detailType, row, rows, primaryLabel, secondaryLabel });

  return {
    kicker: detailType === "recommendation-evidence" ? "候補根拠の比較" : "MODEL METRIC",
    title: row.model + "・" + metricLabel,
    value: metricValue,
    summary: row.model + "における" + metricLabel + "を、同じ質問集合で観測した他モデルと比較します。",
    sections: [
      {
        title: "この値の位置",
        facts: [
          { label: "AIモデル", value: row.model },
          { label: metricLabel, value: metricValue },
          { label: "モデル内順位", value: rank + "位 / " + rankedRows.length + "モデル", tone: rank === 1 ? "green" : undefined },
          { label: "首位モデル", value: leader ? leader.model + " " + (metricLabel === primaryLabel ? leader.primary : leader.secondary) : "—" }
        ]
      },
      {
        title: metricLabel + "のモデル比較",
        table: {
          columns: ["AIモデル", metricLabel, detailLabel],
          rows: rankedRows.map((item) => [
            item.model,
            metricLabel === primaryLabel ? item.primary : item.secondary,
            item.detail
          ])
        }
      },
      {
        title: "関連する観測軸",
        facts: [
          { label: detailLabel, value: row.detail },
          { label: "比較条件", value: "同じ質問集合・同じ集計期間" }
        ]
      },
      ...baseDetail.sections.slice(-1)
    ]
  };
}

function buildModelDetailCategoryDetail({
  detailType,
  row,
  rows,
  primaryLabel,
  secondaryLabel,
  detailLabel
}: {
  detailType: ModelMetricDetailType;
  row: { model: string; primary: string; secondary: string; detail: string };
  rows: { model: string; primary: string; secondary: string; detail: string }[];
  primaryLabel: string;
  secondaryLabel: string;
  detailLabel: string;
}): ReportDetailPayload {
  const baseDetail = buildModelMetricDetail({ detailType, row, rows, primaryLabel, secondaryLabel });
  const matchedPrompts = detailType === "prompt-coverage"
    ? promptRows.filter((prompt) => {
        if (row.detail.includes("料金") && row.detail.includes("比較")) return prompt.topic === "料金" || prompt.phase === "比較検討" || prompt.topic === "競合比較";
        if (row.detail.includes("比較")) return prompt.phase === "比較検討" || prompt.topic === "競合比較";
        if (row.detail.includes("引用")) return prompt.topic === "引用元" || prompt.citationRate === 0;
        if (row.detail.includes("ブランド")) return prompt.type === "Branded";
        if (row.detail.includes("料金")) return prompt.topic === "料金";
        return true;
      }).slice(0, 5)
    : [];

  return {
    kicker: detailType === "recommendation-evidence" ? "根拠領域" : "MODEL SEGMENT",
    title: row.detail,
    value: row.model,
    summary: row.model + "で" + detailLabel + "となった区分を、同モデルの集計値と他モデルの区分に分けて確認します。",
    sections: [
      {
        title: detailLabel + "の内訳",
        facts: [
          { label: "AIモデル", value: row.model },
          { label: detailLabel, value: row.detail },
          { label: primaryLabel, value: row.primary },
          { label: secondaryLabel, value: row.secondary }
        ]
      },
      {
        title: "モデル別の" + detailLabel,
        table: {
          columns: ["AIモデル", detailLabel, primaryLabel, secondaryLabel],
          rows: rows.map((item) => [item.model, item.detail, item.primary, item.secondary])
        }
      },
      ...(matchedPrompts.length ? [{
        title: "この質問群に含まれる固定質問",
        description: "代表5件を表示します。質問をさらに分析する場合はプロンプト一覧から検索できます。",
        table: {
          columns: ["固定質問", "ペルソナ", "トピック", "フェーズ"],
          rows: matchedPrompts.map((prompt) => [prompt.prompt, prompt.persona, prompt.topic, prompt.phase])
        }
      }] : []),
      ...baseDetail.sections.slice(-1)
    ]
  };
}

function ModelMetricComparisonTable({
  detailType,
  highlightedProvider,
  primaryLabel,
  secondaryLabel,
  detailLabel = "強い領域",
  layout = "rows",
  showValueBars = false,
  rows
}: {
  detailType: ModelMetricDetailType;
  highlightedProvider: ReportProvider;
  primaryLabel: string;
  secondaryLabel: string;
  detailLabel?: string;
  layout?: "rows" | "matrix" | "compareRows";
  showValueBars?: boolean;
  rows: { model: string; primary: string; secondary: string; detail: string }[];
}) {
  if (layout === "compareRows") {
    const metricNumber = (value: string) => {
      const match = value.match(/-?\d+(?:\.\d+)?/);
      return match ? Number.parseFloat(match[0]) || 0 : 0;
    };
    const primaryMax = Math.max(1, ...rows.map((row) => metricNumber(row.primary)));
    const secondaryMax = Math.max(1, ...rows.map((row) => metricNumber(row.secondary)));
    return (
      <div className="overflow-hidden border-y border-[#DDE5E1] bg-white">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(190px,0.95fr)_minmax(150px,0.72fr)_minmax(150px,0.72fr)_minmax(180px,1fr)] items-center border-b border-[#DDE5E1] bg-[#F6F9F7] text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] md:grid"
        >
          <span className="px-4 py-2.5">AIモデル</span>
          <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">{primaryLabel}</span>
          <span className="border-l border-[#DDE5E1] px-4 py-2.5 text-right">{secondaryLabel}</span>
          <span className="border-l border-[#DDE5E1] px-4 py-2.5">{detailLabel}</span>
        </div>

        <ol className="divide-y divide-[#E5EAE8]">
          {rows.map((row) => {
            const selected = highlightedProvider === row.model;

            return (
              <li
                key={row.model}
                className={cn(
                  "grid min-w-0 grid-cols-2 transition-colors hover:bg-[#F8FAF9] md:grid-cols-[minmax(190px,0.95fr)_minmax(150px,0.72fr)_minmax(150px,0.72fr)_minmax(180px,1fr)]",
                  selected && "bg-[#F1F8F5]"
                )}
              >
                <ReportDetailButton
                  detail={buildModelMetricDetail({ detailType, row, rows, primaryLabel, secondaryLabel })}
                  showIcon={false}
                  label={row.model + "のモデル別内訳を確認"}
                  className="group/model col-span-2 !flex min-h-0 w-full items-center justify-between gap-3 rounded-none px-4 py-3.5 text-left transition-colors hover:bg-[#EAF4F0] focus-visible:ring-inset focus-visible:ring-offset-0 md:col-span-1 md:min-h-[72px]"
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <ModelIdentity name={row.model} compact />
                    {selected ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[#8A9893] transition-transform group-hover/model:translate-x-0.5 group-hover/model:text-[#075E44]"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </ReportDetailButton>

                <ReportDetailButton
                  detail={buildModelMetricValueDetail({
                    detailType,
                    row,
                    rows,
                    metricLabel: primaryLabel,
                    metricValue: row.primary,
                    primaryLabel,
                    secondaryLabel,
                    detailLabel
                  })}
                  showIcon={false}
                  label={row.model + "の" + primaryLabel + " " + row.primary + "を詳しく見る"}
                  className="!block min-h-0 w-full rounded-none border-t border-[#E5EAE8] px-4 py-3 text-left transition-colors hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 md:min-h-[72px] md:border-l md:border-t-0 md:text-right"
                >
                  <span className="block text-[10px] font-bold text-[#667085] md:hidden">{primaryLabel}</span>
                                    {showValueBars && rows.length > 1 ? (
                    <span className="relative mt-1 block overflow-hidden rounded-sm bg-[#F2F4F7] md:mt-0">
                      <span className="absolute inset-y-0 left-0 bg-[#CFE5DA]" style={{ width: `${(metricNumber(row.primary) / primaryMax) * 100}%` }} aria-hidden="true" />
                      <span className="relative block px-2 py-1 text-[16px] font-bold tabular-nums text-[#0B382D]">{row.primary}</span>
                    </span>
                  ) : <span className="mt-1 block text-[17px] font-semibold tabular-nums text-[#101828] md:mt-0 md:text-[16px]">{row.primary}</span>}
                </ReportDetailButton>

                <ReportDetailButton
                  detail={buildModelMetricValueDetail({
                    detailType,
                    row,
                    rows,
                    metricLabel: secondaryLabel,
                    metricValue: row.secondary,
                    primaryLabel,
                    secondaryLabel,
                    detailLabel
                  })}
                  showIcon={false}
                  label={row.model + "の" + secondaryLabel + " " + row.secondary + "を詳しく見る"}
                  className="!block min-h-0 w-full rounded-none border-l border-t border-[#E5EAE8] px-4 py-3 text-left transition-colors hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 md:min-h-[72px] md:text-right"
                >
                  <span className="block text-[10px] font-bold text-[#667085] md:hidden">{secondaryLabel}</span>
                                    {showValueBars && rows.length > 1 ? (
                    <span className="relative mt-1 block overflow-hidden rounded-sm bg-[#F2F4F7] md:mt-0">
                      <span className="absolute inset-y-0 left-0 bg-[#DCE5E1]" style={{ width: `${(metricNumber(row.secondary) / secondaryMax) * 100}%` }} aria-hidden="true" />
                      <span className="relative block px-2 py-1 text-[16px] font-bold tabular-nums text-[#344054]">{row.secondary}</span>
                    </span>
                  ) : <span className="mt-1 block text-[17px] font-semibold tabular-nums text-[#101828] md:mt-0 md:text-[16px]">{row.secondary}</span>}
                </ReportDetailButton>

                <ReportDetailButton
                  detail={buildModelDetailCategoryDetail({ detailType, row, rows, primaryLabel, secondaryLabel, detailLabel })}
                  showIcon={false}
                  label={row.model + "の" + detailLabel + " " + row.detail + "を詳しく見る"}
                  className="col-span-2 !block min-h-0 w-full rounded-none border-t border-[#E5EAE8] px-4 py-3 text-left transition-colors hover:bg-[#EDF6F2] focus-visible:ring-inset focus-visible:ring-offset-0 md:col-span-1 md:min-h-[72px] md:border-l md:border-t-0"
                >
                  <span className="block text-[10px] font-bold text-[#667085] md:hidden">{detailLabel}</span>
                  <span className="mt-1 block break-words text-[13px] font-semibold leading-5 text-[#344054] md:mt-0">{row.detail}</span>
                </ReportDetailButton>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  if (layout === "matrix") {
    const gridTemplateColumns = `minmax(150px,.85fr) repeat(${rows.length},minmax(0,1fr))`;
    const metrics = [
      { label: primaryLabel, value: (row: (typeof rows)[number]) => row.primary, strong: true },
      { label: secondaryLabel, value: (row: (typeof rows)[number]) => row.secondary, strong: true },
      { label: "強い領域", value: (row: (typeof rows)[number]) => row.detail, strong: false }
    ];

    return (
      <div className="min-w-0 bg-white" role="table" aria-label="AIモデル別プロンプト比較">
        <div className="hidden min-w-0 md:block">
          <div className="grid min-w-0 border-b border-[#DDE5E1] bg-[#F5F8F6]" style={{ gridTemplateColumns }} role="row">
            <div className="flex min-h-20 items-center px-4 text-[11px] font-bold text-[#667085]" role="columnheader">比較指標</div>
            {rows.map((row) => (
              <div key={row.model} className="min-w-0 border-l border-[#DDE5E1] px-3 py-3" role="columnheader">
                <ReportDetailButton
                  detail={buildModelMetricDetail({ detailType, row, rows, primaryLabel, secondaryLabel })}
                  className="w-full justify-start rounded-sm"
                  label={`${row.model}の質問カバレッジを確認`}
                >
                  <span className="flex min-w-0 flex-col items-start gap-1.5">
                    <ModelIdentity name={row.model} compact />
                    {highlightedProvider === row.model ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
                  </span>
                </ReportDetailButton>
              </div>
            ))}
          </div>
          {metrics.map((metric) => (
            <div key={metric.label} className="grid min-w-0 border-b border-[#E5EAE8] last:border-b-0" style={{ gridTemplateColumns }} role="row">
              <div className="flex min-h-16 items-center bg-[#FBFCFB] px-4 text-[12px] font-bold text-[#475467]" role="rowheader">{metric.label}</div>
              {rows.map((row) => (
                <div key={`${metric.label}-${row.model}`} className="flex min-w-0 items-center border-l border-[#E5EAE8] px-4 py-3" role="cell">
                  <span className={cn("break-words text-[13px] text-[#344054]", metric.strong && "text-lg font-semibold tabular-nums text-[#101828]")}>{metric.value(row)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="grid min-w-0 gap-px bg-[#DDE5E1] sm:grid-cols-2 md:hidden">
          {rows.map((row) => (
            <section key={row.model} className="min-w-0 bg-white p-4">
              <ReportDetailButton
                detail={buildModelMetricDetail({ detailType, row, rows, primaryLabel, secondaryLabel })}
                className="w-full justify-start rounded-sm"
                label={`${row.model}の質問カバレッジを確認`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ModelIdentity name={row.model} compact />
                  {highlightedProvider === row.model ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
                </span>
              </ReportDetailButton>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div className="min-w-0"><dt className="text-[10px] font-bold text-[#667085]">{primaryLabel}</dt><dd className="mt-1 text-[17px] font-semibold tabular-nums text-[#101828]">{row.primary}</dd></div>
                <div className="min-w-0"><dt className="text-[10px] font-bold text-[#667085]">{secondaryLabel}</dt><dd className="mt-1 text-[17px] font-semibold tabular-nums text-[#101828]">{row.secondary}</dd></div>
                <div className="col-span-2 min-w-0"><dt className="text-[10px] font-bold text-[#667085]">強い領域</dt><dd className="mt-1 break-words text-[12px] font-semibold text-[#344054]">{row.detail}</dd></div>
              </dl>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DataRichTableWrap>
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">AIモデル</TableHead>
            <TableHead className="w-[190px]">{primaryLabel}</TableHead>
            <TableHead className="w-[190px]">{secondaryLabel}</TableHead>
            <TableHead>強い領域</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.model} className={highlightedProvider === row.model ? "bg-[#F1F8F5]" : undefined}>
              <TableCell data-rich-label="AIモデル" className="font-bold">
                <ReportDetailButton detail={buildModelMetricDetail({ detailType, row, rows, primaryLabel, secondaryLabel })} className="w-full justify-start rounded-sm font-bold">
                  <span className="inline-flex items-center gap-2">
                  <ModelIdentity name={row.model} compact />
                  {highlightedProvider === row.model ? <DataRichBadge tone="green">選択中</DataRichBadge> : null}
                  </span>
                </ReportDetailButton>
              </TableCell>
              <TableCell data-rich-label={primaryLabel} className="font-semibold tabular-nums">{row.primary}</TableCell>
              <TableCell data-rich-label={secondaryLabel} className="font-semibold tabular-nums">{row.secondary}</TableCell>
              <TableCell data-rich-label="強い領域">{row.detail}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

type RankDetailType = "persona" | "topic";
type RankedAxisRow = {
  label: string;
  value: number;
  delta: number;
  observations: number;
  reference?: boolean;
};

function buildRankDetail({
  rankType,
  row,
  index,
  rows,
  reportBase
}: {
  rankType: RankDetailType;
  row: RankedAxisRow;
  index: number;
  rows: RankedAxisRow[];
  reportBase: string;
}): ReportDetailPayload {
  const isPersona = rankType === "persona";
  const noun = isPersona ? "ペルソナ" : "トピック";
  const detailId = Object.entries(isPersona ? personaNameById : topicNameById).find(([, label]) => label === row.label)?.[0] ?? encodeURIComponent(row.label);
  const personaIndex = personas.indexOf(row.label);
  const topicIndex = topics.indexOf(row.label);
  const axisBreakdown = (isPersona
    ? topics.map((label, itemIndex) => ({ label, value: heatmapValues[personaIndex]?.[itemIndex] ?? 0 }))
    : personas.map((label, itemIndex) => ({ label, value: heatmapValues[itemIndex]?.[topicIndex] ?? 0 }))
  ).sort((a, b) => b.value - a.value);
  const rank = rows.findIndex((item) => item.value === row.value) + 1;

  return {
    kicker: isPersona ? "PERSONA RANKING" : "TOPIC RANKING",
    title: row.label,
    value: `${rank}位・${row.value}%`,
    summary: isPersona
      ? "このペルソナでRecoraが表示された割合を、他ペルソナと同じNon-brand質問条件で比較します。"
      : "このトピックでRecoraが表示された割合を、他トピックと同じNon-brand質問条件で比較します。",
    sections: [
      {
        title: isPersona ? "このペルソナの掲載状況" : "このトピックの掲載状況",
        facts: [
          { label: `${noun}順位`, value: `${rank}位 / ${rows.length}` },
          { label: "AI表示率", value: `${row.value}%` },
          { label: "集計母集団", value: isPersona ? "全トピックのNon-brand有効回答" : "全ペルソナのNon-brand有効回答" },
          { label: "有効観測", value: row.observations.toLocaleString("ja-JP") + "件" },
          { label: "前日比", value: formatPt(row.delta), tone: row.delta < 0 ? "amber" : "green" }
        ]
      },
      {
        title: isPersona ? "全ペルソナ比較" : "全トピック比較",
        table: {
          columns: ["順位", noun, "AI表示率", "有効観測", "前日比"],
          rows: rows.map((item) => [
            `${rows.findIndex((candidate) => candidate.value === item.value) + 1}位`,
            item.label,
            `${item.value}%`,
            item.observations.toLocaleString("ja-JP") + "件",
            formatPt(item.delta)
          ])
        }
      },
      {
        title: "AIモデルごとの差",
        table: {
          columns: ["AIモデル", "AI表示率", "公式サイト引用率", "先行競合"],
          rows: activeModels.map((model, modelIndex) => [
            model.name,
            `${Math.max(0, Math.min(100, row.value + activeModelVisibilityOffsets[modelIndex]))}%`,
            `${Math.max(0, Math.min(100, model.citationRate + (isPersona ? index : -index)))}%`,
            ["Trailbase", "SignalNest", "Trailbase", "MentionMap"][modelIndex]
          ])
        }
      },
      {
        title: isPersona ? "このペルソナで強いトピック" : "このトピックで強いペルソナ",
        items: axisBreakdown.slice(0, 4).map((item, itemIndex) => ({
          title: item.label,
          meta: "AI表示率 " + item.value + "%",
          description: itemIndex === 0 ? "この軸で最も掲載が多い組み合わせ" : "同じ質問集合で比較"
        }))
      }
    ],
    detailHref: `${reportBase}/persona-topics/${isPersona ? "personas" : "topics"}/${detailId}`,
    detailLabel: `${row.label}を全画面で分析`
  };
}

function RankRows({ rankType, rows, reportBase }: { rankType: RankDetailType; rows: RankedAxisRow[]; reportBase: string }) {
  const sortedRows = [...rows].sort((a, b) => b.value - a.value || b.observations - a.observations || a.label.localeCompare(b.label, "ja"));
  const noun = rankType === "persona" ? "ペルソナ" : "トピック";

  return (
    <div className="overflow-hidden border-y border-[#DDE5E1] bg-white">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[48px_minmax(180px,0.78fr)_minmax(260px,1.35fr)_88px_20px] items-center gap-4 border-b border-[#DDE5E1] bg-[#F6F9F7] px-4 py-2.5 text-[11px] font-bold tracking-[0.04em] text-[#5D6B66] md:grid"
      >
        <span className="text-center">順位</span>
        <span>{noun}</span>
        <span>AI表示率</span>
        <span className="text-right">前日比</span>
        <span />
      </div>

      <ol className="divide-y divide-[#E5EAE8]">
        {sortedRows.map((row, index) => {
          const rank = sortedRows.findIndex((item) => item.value === row.value) + 1;
          const deltaClassName = row.delta < 0
            ? "text-[#A15C00]"
            : row.delta > 0
              ? "text-[#006B57]"
              : "text-[#667085]";

          return (
            <li key={row.label}>
              <ReportDetailButton
                detail={buildRankDetail({ rankType, row, index, rows: sortedRows, reportBase })}
                showIcon={false}
                className="group/rank !block min-h-0 w-full rounded-none px-4 py-3.5 text-left transition-colors hover:bg-[#F5F9F7] focus-visible:ring-inset focus-visible:ring-offset-0"
              >
                <span className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[48px_minmax(180px,0.78fr)_minmax(260px,1.35fr)_88px_20px] md:gap-4">
                  <span className="col-start-1 row-start-1 text-center text-[13px] font-bold tabular-nums text-[#667085]">
                    {String(rank).padStart(2, "0")}
                  </span>

                  <span className="col-start-2 row-start-1 min-w-0 text-[14px] font-bold leading-5 text-[#101828] [overflow-wrap:anywhere] md:text-[15px]">
                    <span className="block">{row.label}</span>
                    <span className="mt-0.5 block text-[10px] font-semibold tabular-nums text-[#667085]">
                      有効観測 {row.observations.toLocaleString("ja-JP")}件
                    </span>
                  </span>

                  <span className="col-span-2 col-start-2 row-start-2 grid min-w-0 grid-cols-[minmax(0,1fr)_48px] items-center gap-3 md:col-span-1 md:col-start-3 md:row-start-1">
                    <span className="h-2 overflow-hidden rounded-full bg-[#E8EFEC]" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-[#075E44]"
                        style={{ width: Math.max(0, Math.min(100, row.value)) + "%" }}
                      />
                    </span>
                    <span className="text-right text-[14px] font-bold tabular-nums text-[#101828]">{row.value}%</span>
                  </span>

                  <span className={cn("col-start-3 row-start-1 text-right text-[12px] font-bold tabular-nums md:col-start-4 md:text-[13px]", deltaClassName)}>
                    <span className="md:hidden">前日比 </span>{formatPt(row.delta)}
                  </span>

                  <ChevronRight
                    className="col-start-5 row-start-1 hidden h-4 w-4 text-[#8A9893] transition-transform group-hover/rank:translate-x-0.5 group-hover/rank:text-[#075E44] md:block"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
              </ReportDetailButton>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const personaSentimentAllocationWeights: Record<SentimentCategory, readonly number[]> = {
  positive: [19, 16, 26, 15, 14, 10],
  neutral: [18, 20, 22, 16, 12, 12],
  negative: [15, 23, 15, 18, 14, 15]
};

const topicSentimentAllocationWeights: Record<SentimentCategory, readonly number[]> = {
  positive: [15, 22, 13, 18, 16, 16],
  neutral: [16, 18, 17, 17, 18, 14],
  negative: [18, 20, 14, 19, 17, 12]
};

function buildSentimentAxisRows(axis: "persona" | "topic", summary: CustomerSentimentSummary) {
  const labels = axis === "persona" ? [...personas, "未指定"] : topics;
  const weights = axis === "persona" ? personaSentimentAllocationWeights : topicSentimentAllocationWeights;
  const positiveCounts = allocateIntegerByWeights(summary.all.positive, weights.positive);
  const neutralCounts = allocateIntegerByWeights(summary.all.neutral, weights.neutral);
  const negativeCounts = allocateIntegerByWeights(summary.all.negative, weights.negative);

  return labels.map((label, index) => {
    const counts: CustomerSentimentCounts = {
      positive: positiveCounts[index] ?? 0,
      neutral: neutralCounts[index] ?? 0,
      negative: negativeCounts[index] ?? 0,
      valid: (positiveCounts[index] ?? 0) + (neutralCounts[index] ?? 0) + (negativeCounts[index] ?? 0)
    };
    const rates = sentimentPercentages(counts);
    return {
      label,
      positive: rates.positive,
      neutral: rates.neutral,
      negative: rates.negative,
      positiveCount: counts.positive,
      neutralCount: counts.neutral,
      negativeCount: counts.negative,
      observations: counts.valid,
      reference: counts.valid < 30
    };
  });
}

function AxisAnalysis({ axis, range }: { axis: "persona" | "topic"; range: ReportRange }) {
  const isPersona = axis === "persona";
  const noun = isPersona ? "ペルソナ" : "トピック";
  const categoryLabels = isPersona ? personas : topics;
  const categoryAggregate = (index: number) => {
    const values = isPersona ? heatmapValues[index] : heatmapValues.map((row) => row[index]);
    const counts = isPersona
      ? topics.map((_, topicIndex) => scaledHeatmapObservationCount(index, topicIndex, range))
      : personas.map((_, personaIndex) => scaledHeatmapObservationCount(personaIndex, index, range));
    const observations = counts.reduce((sum, count) => sum + count, 0);
    const weightedTotal = values.reduce((sum, value, valueIndex) => sum + value * (counts[valueIndex] ?? 0), 0);
    return {
      value: observations ? Math.round(weightedTotal / observations) : 0,
      observations
    };
  };
  const categoryAggregates = categoryLabels.map((_, index) => categoryAggregate(index));
  const modelRows = categoryLabels.map((label, categoryIndex) => ({
    label,
    values: activeModels.map((model, modelIndex) => {
      const aggregate = categoryAggregates[categoryIndex];
      const modelCount = Math.max(1, activeModels.length);
      const observations = Math.floor(aggregate.observations / modelCount) + (modelIndex < aggregate.observations % modelCount ? 1 : 0);
      return {
        model,
        value: Math.max(0, Math.min(100, aggregate.value + activeModelVisibilityOffsets[modelIndex])),
        observations,
        reference: observations < 30
      };
    })
  }));
  const sentimentSummary = buildSentimentSummary(activeModels.map((model) => model.name), range);
  const sentimentRows = buildSentimentAxisRows(axis, sentimentSummary);
  const phaseLabels = ["情報収集", "比較検討", "導入判断"];
  const phaseRows = categoryLabels.map((label, categoryIndex) => {
    const aggregate = categoryAggregates[categoryIndex];
    const phaseObservations = [
      Math.round(aggregate.observations * 0.38),
      Math.round(aggregate.observations * 0.37),
      0
    ];
    phaseObservations[2] = Math.max(0, aggregate.observations - phaseObservations[0] - phaseObservations[1]);
    const rawPhaseOffsets = [-6, 4, 1];
    const weightedOffset = aggregate.observations
      ? rawPhaseOffsets.reduce((sum, offset, index) => sum + offset * phaseObservations[index], 0) / aggregate.observations
      : 0;
    return {
      label,
      values: phaseLabels.map((phase, phaseIndex) => {
        const observations = phaseObservations[phaseIndex];
        return {
          phase,
          value: Math.max(0, Math.min(100, aggregate.value + rawPhaseOffsets[phaseIndex] - weightedOffset)),
          observations,
          reference: observations < 30
        };
      })
    };
  });
  const modelGridColumns = "minmax(150px,1fr) repeat(" + activeModels.length + ",minmax(92px,0.72fr))";
  const phaseGridColumns = "minmax(150px,1fr) repeat(3,minmax(110px,0.8fr))";
  const heatStyle = (value: number) => ({ backgroundColor: "rgba(7,94,68," + (0.04 + value / 100 * 0.16).toFixed(3) + ")" });
  const formatAxisRate = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1)) + "%";

  const modelCellDetail = (
    row: (typeof modelRows)[number],
    cell: (typeof modelRows)[number]["values"][number]
  ): ReportDetailPayload => ({
    kicker: noun.toUpperCase() + " × MODEL",
    title: row.label + " / " + cell.model.name,
    value: "AI表示率 " + formatAxisRate(cell.value),
    summary: row.label + "のNon-brand有効回答を" + cell.model.name + "だけに絞ったAI表示率です。",
    sections: [
      {
        title: "この組み合わせ",
        facts: [
          { label: noun, value: row.label },
          { label: "AIモデル", value: cell.model.name },
          { label: "AI表示率", value: formatAxisRate(cell.value) },
          { label: "有効観測", value: cell.observations.toLocaleString("ja-JP") + "件" },
        ]
      },
      {
        title: row.label + "のモデル比較",
        table: {
          columns: ["AIモデル", "AI表示率", "有効観測"],
          rows: row.values.map((item) => [item.model.name, item.value + "%", item.observations.toLocaleString("ja-JP") + "件"])
        }
      },
      {
        title: cell.model.name + "の" + noun + "比較",
        table: {
          columns: [noun, "AI表示率"],
          rows: modelRows.map((item) => {
            const sameModel = item.values.find((value) => value.model.name === cell.model.name);
            return [item.label, (sameModel?.value ?? 0) + "%"];
          })
        }
      }
    ]
  });

  const sentimentDetail = (row: (typeof sentimentRows)[number]): ReportDetailPayload => ({
    kicker: noun.toUpperCase() + " × SENTIMENT",
    title: row.label + "の感情構成",
    value: "ポジティブ " + row.positive + "%",
    summary: row.label + "に配分された全有効回答を、ポジティブ・中立・ネガティブの構成比に分けます。",
    sections: [
      {
        title: "感情内訳",
        facts: [
          { label: "ポジティブ", value: row.positive + "%（" + row.positiveCount.toLocaleString("ja-JP") + "件）", tone: "green" },
          { label: "中立", value: row.neutral + "%（" + row.neutralCount.toLocaleString("ja-JP") + "件）" },
          { label: "ネガティブ", value: row.negative + "%（" + row.negativeCount.toLocaleString("ja-JP") + "件）", tone: "amber" },
          { label: "有効観測", value: row.observations.toLocaleString("ja-JP") + "件" },
          { label: "軸全体", value: sentimentSummary.all.valid.toLocaleString("ja-JP") + "件" },
        ]
      },
      {
        title: "全" + noun + "の感情構成",
        table: {
          columns: [noun, "ポジティブ", "中立", "ネガティブ", "有効観測"],
          rows: sentimentRows.map((item) => [item.label, item.positive + "%", item.neutral + "%", item.negative + "%", item.observations.toLocaleString("ja-JP") + "件"])
        }
      }
    ]
  });

  const phaseCellDetail = (
    row: (typeof phaseRows)[number],
    cell: (typeof phaseRows)[number]["values"][number]
  ): ReportDetailPayload => ({
    kicker: noun.toUpperCase() + " × PHASE",
    title: row.label + " / " + cell.phase,
    value: "AI表示率 " + formatAxisRate(cell.value),
    summary: row.label + "の質問を" + cell.phase + "フェーズに絞ったAI表示率です。",
    sections: [
      {
        title: "この組み合わせ",
        facts: [
          { label: noun, value: row.label },
          { label: "フェーズ", value: cell.phase },
          { label: "AI表示率", value: formatAxisRate(cell.value) },
          { label: "有効観測", value: cell.observations.toLocaleString("ja-JP") + "件" },
        ]
      },
      {
        title: row.label + "のフェーズ比較",
        table: {
          columns: ["フェーズ", "AI表示率", "有効観測"],
          rows: row.values.map((item) => [item.phase, formatAxisRate(item.value), item.observations.toLocaleString("ja-JP") + "件"])
        }
      },
      {
        title: cell.phase + "の" + noun + "比較",
        table: {
          columns: [noun, "AI表示率"],
          rows: phaseRows.map((item) => {
            const samePhase = item.values.find((value) => value.phase === cell.phase);
            return [item.label, formatAxisRate(samePhase?.value ?? 0)];
          })
        }
      }
    ]
  });

  return (
    <DataRichPanel
      title={noun + "軸分析"}
      description="AIモデルはAI表示率、感情は回答構成比、フェーズはAI表示率として、単位の異なる3軸を目的別のUIで表示します。"
      bodyClassName="p-0"
    >
      <div className="divide-y divide-[#DDE5E1]">
        <section>
          <header className="px-4 py-4 sm:px-5">
            <h4 className="text-[14px] font-semibold text-[#101828]">{noun} × AIモデル</h4>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[#667085]">同じ{noun}のAI表示率をモデル別に比較。モデル数は契約プランの1〜4モデルに追従します。</p>
          </header>
          <div className="hidden border-t border-[#DDE5E1] md:block">
            <div className="grid bg-[#F6F9F7]" style={{ gridTemplateColumns: modelGridColumns }}>
              <span className="px-4 py-3 text-[11px] font-bold text-[#667085]">{noun}</span>
              {activeModels.map((model) => <span key={model.name} className="border-l border-[#DDE5E1] px-3 py-3"><ModelIdentity name={model.name} compact /></span>)}
            </div>
            {modelRows.map((row) => (
              <div key={row.label} className="grid border-t border-[#E5EAE8]" style={{ gridTemplateColumns: modelGridColumns }}>
                <div className="flex items-center px-4 py-3 text-[12px] font-bold text-[#344054]">{row.label}</div>
                {row.values.map((cell) => (
                  <ReportDetailButton
                    key={cell.model.name}
                    detail={modelCellDetail(row, cell)}
                    showIcon={false}
                    label={row.label + "と" + cell.model.name + "のAI表示率を詳しく見る"}
                    style={heatStyle(cell.value)}
                    className="!flex min-h-16 w-full flex-col items-end justify-center rounded-none border-l border-[#DDE5E1] px-3 py-2 hover:ring-1 hover:ring-inset hover:ring-[#2C7A68] focus-visible:ring-inset focus-visible:ring-offset-0"
                  >
                    <span className="text-[16px] font-bold tabular-nums text-[#103F35]">{formatAxisRate(cell.value)}</span>
                    <span className="mt-0.5 text-[9px] font-semibold tabular-nums text-[#667085]">{cell.observations.toLocaleString("ja-JP")}件</span>
                  </ReportDetailButton>
                ))}
              </div>
            ))}
          </div>
          <div className="divide-y divide-[#E5EAE8] border-t border-[#DDE5E1] md:hidden">
            {modelRows.map((row) => (
              <section key={row.label} className="p-4">
                <h5 className="text-[12px] font-bold text-[#344054]">{row.label}</h5>
                <div className={cn("mt-2 grid overflow-hidden rounded-sm border border-[#DDE5E1]", activeModels.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                  {row.values.map((cell, index) => (
                    <ReportDetailButton
                      key={cell.model.name}
                      detail={modelCellDetail(row, cell)}
                      showIcon={false}
                      label={row.label + "と" + cell.model.name + "のAI表示率を詳しく見る"}
                      style={heatStyle(cell.value)}
                      className={cn(
                        "!block min-h-16 w-full rounded-none p-3",
                        activeModels.length > 1 && index % 2 === 1 && "border-l border-[#DDE5E1]",
                        index >= 2 && "border-t border-[#DDE5E1]",
                        activeModels.length > 1 && activeModels.length % 2 === 1 && index === activeModels.length - 1 && "col-span-2"
                      )}
                    >
                      <ModelIdentity name={cell.model.name} compact />
                      <span className="mt-2 block text-right text-[16px] font-bold tabular-nums text-[#103F35]">{cell.value}%</span>
                    </ReportDetailButton>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section>
          <header className="px-4 py-4 sm:px-5">
            <h4 className="text-[14px] font-semibold text-[#101828]">{noun} × 感情</h4>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[#667085]">
              {range}の全有効回答{sentimentSummary.all.valid.toLocaleString("ja-JP")}件を{noun}別に配分し、各行を100%として感情構成を比較します。
              {isPersona ? " ペルソナを割り当てられない回答は「未指定」に含めます。" : ""}
            </p>
          </header>
          <div className="divide-y divide-[#E5EAE8] border-t border-[#DDE5E1]">
            {sentimentRows.map((row) => (
              <ReportDetailButton
                key={row.label}
                detail={sentimentDetail(row)}
                showIcon={false}
                label={row.label + "の感情構成、ポジティブ" + row.positive + "%、中立" + row.neutral + "%、ネガティブ" + row.negative + "%を詳しく見る"}
                className="!block w-full rounded-none px-4 py-3 text-left hover:bg-[#F8FAF9] focus-visible:ring-inset focus-visible:ring-offset-0 sm:px-5"
              >
                <span className="grid min-w-0 gap-2 md:grid-cols-[150px_minmax(0,1fr)_210px] md:items-center md:gap-4">
                  <span>
                    <span className="block text-[12px] font-bold text-[#344054]">{row.label}</span>
                    <span className="mt-0.5 block text-[9px] font-semibold tabular-nums text-[#667085]">{row.observations.toLocaleString("ja-JP")}件</span>
                  </span>
                  <span className="flex h-3 min-w-0 overflow-hidden rounded-full bg-[#EEF1F0]" aria-hidden="true">
                    <span className="bg-[#15735C]" style={{ width: row.positive + "%" }} />
                    <span className="bg-[#98A2B3]" style={{ width: row.neutral + "%" }} />
                    <span className="bg-[#B7791F]" style={{ width: row.negative + "%" }} />
                  </span>
                  <span className="flex flex-wrap justify-between gap-2 text-[10px] font-bold tabular-nums text-[#667085]">
                    <span className="text-[#075E44]">ポジ {row.positive}%</span>
                    <span>中立 {row.neutral}%</span>
                    <span className="text-[#8A4B00]">ネガ {row.negative}%</span>
                  </span>
                </span>
              </ReportDetailButton>
            ))}
          </div>
        </section>

        <section>
          <header className="px-4 py-4 sm:px-5">
            <h4 className="text-[14px] font-semibold text-[#101828]">{noun} × フェーズ</h4>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[#667085]">情報収集・比較検討・導入判断の各フェーズでAI表示率を比較します。</p>
          </header>
          <div className="hidden border-t border-[#DDE5E1] md:block">
            <div className="grid bg-[#F6F9F7]" style={{ gridTemplateColumns: phaseGridColumns }}>
              <span className="px-4 py-3 text-[11px] font-bold text-[#667085]">{noun}</span>
              {phaseLabels.map((phase) => <span key={phase} className="border-l border-[#DDE5E1] px-3 py-3 text-center text-[11px] font-bold text-[#667085]">{phase}</span>)}
            </div>
            {phaseRows.map((row) => (
              <div key={row.label} className="grid border-t border-[#E5EAE8]" style={{ gridTemplateColumns: phaseGridColumns }}>
                <div className="flex items-center px-4 py-3 text-[12px] font-bold text-[#344054]">{row.label}</div>
                {row.values.map((cell) => (
                  <ReportDetailButton
                    key={cell.phase}
                    detail={phaseCellDetail(row, cell)}
                    showIcon={false}
                    label={row.label + "と" + cell.phase + "のAI表示率を詳しく見る"}
                    style={heatStyle(cell.value)}
                    className="!flex min-h-16 w-full flex-col items-end justify-center rounded-none border-l border-[#DDE5E1] px-3 py-2 hover:ring-1 hover:ring-inset hover:ring-[#2C7A68] focus-visible:ring-inset focus-visible:ring-offset-0"
                  >
                    <span className="text-[16px] font-bold tabular-nums text-[#103F35]">{formatAxisRate(cell.value)}</span>
                    <span className="mt-0.5 text-[9px] font-semibold tabular-nums text-[#667085]">{cell.observations.toLocaleString("ja-JP")}件</span>
                  </ReportDetailButton>
                ))}
              </div>
            ))}
          </div>
          <div className="divide-y divide-[#E5EAE8] border-t border-[#DDE5E1] md:hidden">
            {phaseRows.map((row) => (
              <section key={row.label} className="p-4">
                <h5 className="text-[12px] font-bold text-[#344054]">{row.label}</h5>
                <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-sm border border-[#DDE5E1]">
                  {row.values.map((cell, index) => (
                    <ReportDetailButton
                      key={cell.phase}
                      detail={phaseCellDetail(row, cell)}
                      showIcon={false}
                      label={row.label + "と" + cell.phase + "のAI表示率を詳しく見る"}
                      style={heatStyle(cell.value)}
                      className={cn("!block min-h-16 w-full rounded-none p-2 text-center", index > 0 && "border-l border-[#DDE5E1]")}
                    >
                      <span className="block text-[9px] font-bold text-[#667085]">{cell.phase}</span>
                      <span className="mt-1 block text-[15px] font-bold tabular-nums text-[#103F35]">{formatAxisRate(cell.value)}</span>
                    </ReportDetailButton>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </DataRichPanel>
  );
}

function ChangeLog({ reportBase }: { reportBase: string }) {
  const rows: { kind: string; label: string; delta: string; detail: ReportDetailPayload }[] = [
    { kind: "上昇", label: "マーケ責任者×競合比較", delta: "+5pt", detail: {
      title: "マーケ責任者 × 競合比較の上昇", value: "+5pt", summary: "前日と比較可能な同一条件でAI表示率が上昇しました。",
      sections: [{ title: "変化の内訳", facts: [{ label: "比較可能観測", value: `${activeModels.length * 24}件` }, { label: "対象モデル", value: `${activeModels.length}モデル` }, { label: "観測状態の差", value: "自社掲載 +8件 / 競合のみ -3件", tone: "green" }] }, { title: "差に寄与した観測", table: { columns: ["観測ID", "観測日時", "AIモデル", "プロンプトID", "前日→当日"], rows: [["OBS-20260706-GPT-042", "2026/07/06 06:04", "GPT", "P-042", "未掲載 → 自社2位"], ["OBS-20260706-GAI-096", "2026/07/06 06:18", "Google AI Mode", "P-096", "自社3位 → 1位"]] } }],
      detailHref: `${reportBase}/persona-topics/personas/marketing-lead`, detailLabel: "ペルソナの全データを確認"
    } },
    { kind: "低下", label: "引用元トピック", delta: "-4pt", detail: {
      title: "引用元トピックの低下", value: "-4pt", summary: "自社公式の引用が減り、第三者メディアへの置き換わりが増えています。",
      sections: [{ title: "変化の内訳", facts: [{ label: "自社引用", value: "-11回答", tone: "red" }, { label: "新規第三者引用", value: "+7回答" }, { label: "比較可能観測", value: "84件" }] }, { title: "引用元が変わった観測", table: { columns: ["観測ID", "AIモデル", "プロンプトID", "前日URL", "当日URL"], rows: [["OBS-20260706-GEM-077", "Gemini", "P-077", "recora.jp/guide", "marketing-ai.jp/research"], ["OBS-20260706-GPT-018", "GPT", "P-018", "recora.jp/features", "trailbase.io/compare"]] } }],
      detailHref: `${reportBase}/sources`, detailLabel: "引用元の全データを確認"
    } },
    { kind: "注意", label: "Geminiで未掲載回答が増加", delta: "-3pt", detail: {
      title: "Geminiの未掲載回答増加", value: "-3pt", summary: "回答取得には成功していますが、Recoraが掲載されない回答が増えました。計測失敗ではありません。",
      sections: [{ title: "状態の区別", facts: [{ label: "有効・未掲載", value: "+9回答", tone: "amber" }, { label: "計測失敗", value: "+1件" }, { label: "主なトピック", value: "引用元 / 料金" }] }, { title: "未掲載になった観測", table: { columns: ["観測ID", "観測日時", "プロンプトID", "回答状態", "先行ブランド"], rows: [["OBS-20260706-GEM-077", "2026/07/06 06:11", "P-077", "有効・自社未掲載", "SignalNest"], ["OBS-20260706-GEM-053", "2026/07/06 06:08", "P-053", "有効・自社未掲載", "Trailbase"]] } }],
      detailHref: `${reportBase}/prompts`, detailLabel: "該当プロンプトを全件で確認"
    } }
  ];
  return (
    <div className="divide-y divide-[#DDE5E1] border-y border-[#DDE5E1]">
      {rows.map(({ kind, label, delta }) => (
        <div key={label} className="grid min-w-0 gap-3 py-4 sm:grid-cols-[80px_minmax(0,1fr)_90px_auto] sm:items-center">
          <DataRichBadge tone={kind === "上昇" ? "green" : kind === "低下" ? "red" : "amber"}>{kind}</DataRichBadge>
          <p className="text-[14px] font-semibold leading-6 text-[#0F172A]">{label}</p>
          <span className="text-lg font-semibold tabular-nums text-[#0F172A] sm:text-right">{delta}</span>
          <Link href={`${reportBase}/trends`} className="inline-flex min-h-10 items-center justify-center border border-[#D7E0DC] bg-white px-3 text-[12px] font-bold text-[#075E44] transition hover:border-[#8EB4A7] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
            変化の内訳
          </Link>
        </div>
      ))}
    </div>
  );
}

function WeaknessCards({ reportBase }: { reportBase: string }) {
  const rows: { title: string; body: string; detail: ReportDetailPayload }[] = [
    { title: "競合が強い領域", body: "比較検討・料金・第三者評価でTrailbaseが先行しています。", detail: { title: "競合が強い領域", summary: "同じ日・固定質問・AIモデルでTrailbaseがRecoraより先に掲載された観測を、領域別に集約しています。", sections: [{ title: "敗北の内訳", table: { columns: ["領域", "競合勝ち", "自社勝ち", "差"], rows: [["比較検討", "58件", "32件", "-26件"], ["料金", "41件", "27件", "-14件"], ["第三者評価", "36件", "19件", "-17件"]] } }, { title: "代表観測まで遡る", table: { columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "観測結果"], rows: [["OBS-20260706-WC-001", "2026-07-06 08:05", "GPT", "Q-034", "Trailbase 1位 / Recora 3位"], ["OBS-20260705-WC-014", "2026-07-05 08:07", "Gemini", "Q-071", "Trailbase掲載 / Recora未掲載"]] } }], detailHref: `${reportBase}/leaderboard/trailbase`, detailLabel: "Trailbaseとの全比較を確認" } },
    { title: "自社が弱い領域", body: "引用元トピックとレビューサイトで自社公式の引用が不足しています。", detail: { title: "自社が弱い領域", summary: "競合掲載・自社不在の回答で使用された引用元を確認します。引用先本文の照合前は、主張を支持したとは判定しません。", sections: [{ title: "引用ギャップ", facts: [{ label: "競合のみ引用", value: "21URL", tone: "amber" }, { label: "対象回答", value: "57回答" }, { label: "主なモデル", value: "GPT / Gemini" }, { label: "比較単位", value: "回答 × 正規化URL" }] }, { title: "引用観測まで遡る", table: { columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "引用URL"], rows: [["OBS-20260706-WC-021", "2026-07-06 08:11", "GPT", "Q-034", "trailbase.io/compare/geo-tools"], ["OBS-20260705-WC-026", "2026-07-05 08:09", "Gemini", "Q-071", "saas-review.example/ai-search"]] } }], detailHref: `${reportBase}/sources`, detailLabel: "引用ギャップを全件で確認" } },
    { title: "観測された情報不足", body: "選定基準、調査データ、最新の料金説明が回答内で不足しています。", detail: { title: "観測された情報不足", summary: "回答に出ない情報と、公式事実より古く説明された情報を別状態として集約しています。", sections: [{ title: "不足の内訳", table: { columns: ["情報", "該当回答", "状態"], rows: [["選定基準", "28回答", "欠落"], ["調査データ", "21回答", "第三者のみ"], ["最新料金", "6回答", "古い"]] } }, { title: "代表観測まで遡る", table: { columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "確認状態"], rows: [["OBS-20260706-WC-041", "2026-07-06 08:03", "Perplexity", "Q-088", "自社調査データなし"], ["OBS-20260706-WC-046", "2026-07-06 08:02", "GPT", "Q-012", "旧料金を回答 / 公式事実と差分"]] } }], detailHref: `${reportBase}/brand-perception`, detailLabel: "主張と事実差分を確認" } }
  ];
  return (
    <div className="divide-y divide-[#DDE5E1] border-y border-[#DDE5E1]">
      {rows.map(({ title, body, detail }) => (
        <div key={title} className="grid min-w-0 gap-2 py-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
          <p className="text-[15px] font-semibold text-[#0F172A]">{title}</p>
          <p className="text-[13px] leading-6 text-[#475569]">{body}</p>
          <EvidenceLink label="内訳を見る" detail={detail} />
        </div>
      ))}
    </div>
  );
}

function FieldGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] px-3 py-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
          <p className="text-[12px] font-bold text-[#64748B]">{label}</p>
          <p className="min-w-0 break-words text-[13px] font-bold text-[#0F172A]">{value}</p>
        </div>
      ))}
    </div>
  );
}

type SimpleListDetailType = "answer-check" | "claim-risk";

type SimpleListDetailContext = {
  observationId?: string;
  prompt?: string;
  model?: string;
  listed?: string;
  position?: string;
  competitorAhead?: string;
  verification?: string;
  observedAt?: string;
  citationUrls?: string[];
};

function buildSimpleListDetail(item: string, detailType: SimpleListDetailType, context?: SimpleListDetailContext): ReportDetailPayload {
  if (detailType === "answer-check") {
    return {
      kicker: "ANSWER CHECK",
      title: item,
      summary: "この注意点を、対象回答の掲載状態・推薦順・引用URL・主張と根拠の整合に分けて確認します。",
      sections: [
        {
          title: "この判定の対象",
          facts: [
            { label: "観測ID", value: context?.observationId ?? "OBS-20260706-GPT-042" },
            { label: "プロンプト", value: context?.prompt ?? "選択中のプロンプト" },
            { label: "AIモデル", value: context?.model ?? "選択中のモデル" },
            { label: "観測日時", value: context?.observedAt ?? "2026/07/06 06:00" },
            { label: "確認中の注意点", value: item }
          ]
        },
        {
          title: "同じ回答内の判定値",
          table: {
            columns: ["判定項目", "観測値", "確認対象"],
            rows: [
              ["自社掲載", context?.listed ?? "掲載あり", "回答本文内のブランド名"],
              ["掲載位置", context?.position ?? "2位", "推薦・列挙された順序"],
              ["競合先行", context?.competitorAhead ?? "Trailbase", "自社より前に出たブランド"],
              ["主張と根拠の整合", context?.verification ?? "要確認", "回答内の主張と公式情報"]
            ]
          }
        },
        {
          title: "観測まで遡る",
          items: [
            { title: `${context?.observationId ?? "OBS-20260706-GPT-042"} のAI回答全文`, meta: `${context?.model ?? "対象モデル"}の原文` },
            { title: "引用URL", meta: context?.citationUrls?.join(" / ") ?? "回答に付いた参照元を確認" },
            { title: "同じ質問の他モデル回答", meta: "判定が一致するか横断確認" }
          ]
        }
      ]
    };
  }

  const claimTraceByItem: Record<string, {
    code: string;
    question: string;
    officialTarget: string;
    officialFact: string;
    status: string;
    tone: "red" | "amber";
    models?: string[];
    citationUrls: string[];
  }> = {
    "料金が旧プランで説明される": {
      code: "PRICE",
      question: "レコラの料金プランと契約条件は？",
      officialTarget: "現行の料金ページ・プラン条件",
      officialFact: "旧金額が残り、現行プラン名と一致しない",
      status: "古い・公式事実と照合済み",
      tone: "red",
      models: ["GPT", "Gemini"],
      citationUrls: ["https://recora.jp/pricing", "https://trailbase.io/pricing"]
    },
    "機能範囲が過剰に説明される": {
      code: "SCOPE",
      question: "レコラで利用できる機能と提供範囲は？",
      officialTarget: "現行の機能一覧・提供範囲",
      officialFact: "公式事実との照合待ち",
      status: "未照合・要確認",
      tone: "amber",
      citationUrls: ["https://recora.jp/products/ai-visibility-monitor", "https://marketing-ai.jp/guide/geo", "—", "https://recora.jp/guide"]
    },
    "一般的なSEOツールと混同される": {
      code: "CATEGORY",
      question: "レコラはどのカテゴリのツールですか？",
      officialTarget: "公式の製品カテゴリ・サービス説明",
      officialFact: "公式事実との照合待ち",
      status: "未照合・要確認",
      tone: "amber",
      citationUrls: ["—", "https://marketing-ai.jp/guide/geo", "—", "https://recora.jp/"]
    }
  };
  const claimTrace = claimTraceByItem[item as keyof typeof claimTraceByItem];
  const officialTarget = claimTrace.officialTarget;
  const claimModels = activeModels.filter((model) => !claimTrace.models || claimTrace.models.includes(model.name));

  return {
    kicker: "主張リスク",
    title: item,
    summary: "AIが語った内容と公式情報を分け、どのモデル・回答で同じ表現が出たかを確認します。",
    sections: [
      {
        title: "AIが語った内容",
        facts: [
          { label: "検出した表現", value: item },
          { label: "公式情報との状態", value: claimTrace.status, tone: claimTrace.tone },
          { label: "照合結果", value: claimTrace.officialFact, tone: claimTrace.tone },
          { label: "照合する公式情報", value: officialTarget },
          { label: "対象期間", value: "2026/06/07〜2026/07/06" }
        ]
      },
      {
        title: "モデル別の出現回答",
        table: {
          columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "観測された主張", "引用URL"],
          rows: claimModels.map((model, index) => [
            `OBS-20260706-${claimTrace.code}-${modelObservationCode(model.name)}-${String(index + 1).padStart(2, "0")}`,
            `2026/07/06 06:${String(4 + index * 7).padStart(2, "0")}`,
            model.name,
            claimTrace.question,
            index === 1 ? `${item}・複数回答で出現` : `${item}・回答内で出現`,
            claimTrace.citationUrls[index]
          ])
        }
      },
      {
        title: "照合対象",
        items: [
          { title: officialTarget, meta: "公式の正解情報" },
          { title: "該当するAI回答全文", meta: "表現の前後と条件を確認" },
          { title: "回答に付いた引用URL", meta: "どの情報を参照したか確認" }
        ]
      }
    ]
  };
}

function SimpleList({
  items,
  detailType,
  detailContext
}: {
  items: string[];
  detailType?: SimpleListDetailType;
  detailContext?: SimpleListDetailContext;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-md border border-[#E5EAE8] bg-[#FAFCFB] px-3 py-2">
          <p className="text-[13px] font-semibold leading-5 text-[#0F172A]">{item}</p>
          {detailType ? (
            <EvidenceLink
              label={detailType === "answer-check" ? "回答内訳を見る" : "照合内容を見る"}
              detail={buildSimpleListDetail(item, detailType, detailContext)}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StatTile({ label, value, helper, tone = "green", detail }: { label: string; value: string; helper: string; tone?: "green" | "amber"; detail?: ReportDetailPayload }) {
  return (
    <div className="min-w-0 border-l border-[#D5E1DB] px-4 first:border-l-0 first:pl-0 last:pr-0">
      <p className="text-[12px] font-bold text-[#5D6B66]">{label}</p>
      {detail ? (
        <ReportDetailButton detail={detail} className="mt-1 w-fit max-w-full justify-start">
          <span className={cn("text-[28px] font-semibold leading-tight tabular-nums", tone === "amber" ? "text-[#9A5B00]" : "text-[#075E44]")}>{value}</span>
        </ReportDetailButton>
      ) : (
        <p className={cn("mt-1 text-[28px] font-semibold leading-tight tabular-nums", tone === "amber" ? "text-[#9A5B00]" : "text-[#075E44]")}>{value}</p>
      )}
      <p className="mt-2 text-[13px] font-medium leading-5 text-[#5D6B66]">{helper}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[#E5EAE8] bg-white px-2 py-1.5">
      <p className="text-[11px] font-bold text-[#64748B]">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold tabular-nums text-[#0F172A]">{value}</p>
    </div>
  );
}

function PriorityBadge({ value }: { value: string }) {
  return <DataRichBadge tone={value === "高" ? "red" : value === "中" ? "amber" : "default"}>{value}</DataRichBadge>;
}

function EvidenceLink({ detail, label = "内訳を見る" }: { detail: ReportDetailPayload; label?: string }) {
  return (
    <ReportDetailButton detail={detail} className="mt-2 border border-[#D7E0DC] bg-white px-3 text-[11px] font-bold text-[#075E44] transition hover:border-[#8EB4A7] hover:bg-[#F4F8F6]">
      <span>{label}</span>
    </ReportDetailButton>
  );
}

function heatmapColor(value: number) {
  if (value >= 60) return "rgba(0, 107, 87, 0.24)";
  if (value >= 45) return "rgba(42, 174, 155, 0.18)";
  return "rgba(183, 121, 31, 0.18)";
}

function formatPt(value: number) {
  return `${value > 0 ? "+" : ""}${value}pt`;
}
