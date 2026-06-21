import Link from "next/link";
import { RecommendationsDbPage } from "@/components/recora/recommendations-page";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Crown,
  Download,
  ExternalLink,
  FileText,
  Filter,
  ListChecks,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  brand,
  buyerCriteria,
  citations,
  competitors,
  contentOpportunities,
  conversations,
  getModelName,
  getPersonaName,
  getTopicName,
  models,
  personas,
  prompts,
  sampleProject,
  sources,
  technicalAudit,
  topics,
  visibilityMetrics,
  weeklyTrends
} from "@/lib/recora/sample-data";
import { createTemporaryReportViewModel, type TemporaryReportViewModel } from "@/lib/recora/report-view-model";
import { recoraMetricDefinitions } from "@/lib/recora/metric-definitions";
import { placeholderRouteSummaries, reportDetailTabs } from "@/lib/recora/nav-config";
import {
  getRecoraDashboardData,
  getRecoraLeaderboardData,
  type RecoraBrandRow,
  type RecoraConversationsDbData,
  type RecoraCumulativeSourceDomainRank,
  type RecoraDashboardDbData,
  type RecoraHomeDataCautionFlag,
  type RecoraHomeReadModelDbData,
  type RecoraLeaderboardDbData,
  type RecoraRecommendationRow,
  type RecoraRecommendationsDbData,
  type RecoraSourcesDbData,
  type RecoraTopicsPromptsDbData,
  type RecoraTrendHomePoint
} from "@/lib/recora/db";
import {
  AlertBanner,
  DashboardCard,
  DataCard,
  DeltaBadge,
  DonutChart,
  HeatmapCell,
  MetricCard,
  MetricTile,
  PageHeader,
  PriorityPill,
  PrioritySuggestionCard,
  ProgressBar,
  RoadmapCard,
  SentimentPill,
  StatusPill,
  TinyBarChart,
  formatPercent
} from "@/components/recora/ui";

const currentReportSlug = "mieruca-seo-demo";
const reportBase = `/dashboard/reports/${currentReportSlug}`;

function DetailTabs({ items, active = 0 }: { items: readonly string[]; active?: number }) {
  return (
    <div className="mb-5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <div className="flex min-w-max gap-1">
        {items.map((item, index) => (
          <span
            key={item}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-bold text-slate-500",
              index === active ? "bg-[#00796B] text-white shadow-sm" : "hover:bg-[#E6F4F1] hover:text-[#005C50]"
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const reportLandingKpiCards = [
  {
    label: "AI表示率",
    value: formatPercent(visibilityMetrics.overall.brandVisibility),
    helper: "サンプルレポートの全体表示率",
    delta: visibilityMetrics.overall.movement,
    deltaLabel: formatSignedPt(visibilityMetrics.overall.movement),
    tone: "green" as const,
    sparkline: visibilityMetrics.byTopic.map((item) => item.visibility)
  },
  {
    label: "AI言及数",
    value: String(sampleProject.conversationCount),
    helper: "サンプル回答ログの件数",
    delta: sampleProject.conversationCount,
    deltaLabel: String(sampleProject.conversationCount),
    tone: "blue" as const,
    sparkline: buildSparkline(sampleProject.conversationCount)
  },
  {
    label: "参照回数",
    value: String(sampleProject.citationCount),
    helper: "サンプル参照元の集計",
    delta: sampleProject.citationCount,
    deltaLabel: String(sampleProject.citationCount),
    tone: "blue" as const,
    sparkline: buildSparkline(sampleProject.citationCount)
  },
  {
    label: "参照カバレッジ",
    value: formatPercent(visibilityMetrics.overall.citationCoverage),
    helper: "サンプル参照率",
    delta: visibilityMetrics.overall.citationCoverage,
    deltaLabel: formatPercent(visibilityMetrics.overall.citationCoverage),
    tone: "amber" as const,
    chartType: "bars" as const,
    sparkline: visibilityMetrics.byModel.map((item) => item.citationRate)
  },
  {
    label: "平均掲載順位",
    value: visibilityMetrics.overall.averageRank.toFixed(1),
    helper: "表示時の平均順位",
    delta: visibilityMetrics.overall.averageRank,
    deltaLabel: visibilityMetrics.overall.averageRank.toFixed(1),
    tone: "purple" as const,
    sparkline: visibilityMetrics.byModel.map((item) => item.rank)
  }
];

const brandDonutItems = [
  { label: brand.name, value: 24, color: "#00796B" },
  { label: "Trailbase", value: 36, color: "#B7791F" },
  { label: "SignalNest", value: 18, color: "#64748B" },
  { label: "MentionMap", value: 12, color: "#008F72" },
  { label: "RankLens", value: 10, color: "#C2415B" }
];

const sourceDonutItems = [
  { label: "公式サイト", value: 34, color: "#00796B" },
  { label: "ニュース・メディア", value: 23, color: "#008F72" },
  { label: "レビュー・ブログ", value: 18, color: "#64748B" },
  { label: "Q&A・フォーラム", value: 12, color: "#B7791F" },
  { label: "PDF・資料", value: 8, color: "#64748b" },
  { label: "その他", value: 5, color: "#cbd5e1" }
];

const topReferencedPages = [
  { page: "/products/ai-visibility-monitor", citations: 18, delta: 3 },
  { page: "/compare/brand-monitoring", citations: 12, delta: 2 },
  { page: "/resources/prompt-analysis", citations: 9, delta: 1 },
  { page: "/case-studies/b2b-saas", citations: 7, delta: 1 },
  { page: "/security/source-traceability", citations: 6, delta: 0 }
];

const roadmapSteps = [
  {
    step: 1,
    title: "基盤を整える",
    description: "AIが読み取りやすい事業説明、カテゴリ定義、比較軸、参照されるページ構造を整備します。",
    effect: "推定効果: +1.5pt"
  },
  {
    step: 2,
    title: "コンテンツを強化する",
    description: "選定基準、比較プロンプト、サイト技術診断、参照元の根拠を補強し、AIに参照される候補を増やします。",
    effect: "推定効果: +2.0pt"
  },
  {
    step: 3,
    title: "存在感を拡大する",
    description: "競合が強いトピックに対して、第三者の参照元と自社ページの両方でAI表示率を伸ばします。",
    effect: "推定効果: +1.2pt"
  }
];

const dashboardAlerts = [
  {
    title: "AI表示率の低下",
    description: "前週比 -2.1pt。比較・価格系プロンプトでAI表示率が下がっています。",
    tone: "rose" as const,
    href: `${reportBase}/recommendations`,
    action: "改善候補へ"
  },
  {
    title: "競合の表示増加",
    description: "Trailbase Cloud がAI回答内の比較文脈で増えています。",
    tone: "amber" as const,
    href: `${reportBase}/leaderboard`,
    action: "競合を見る"
  },
  {
    title: "誤情報リスク",
    description: "料金と導入期間に関する古い記述が一部回答に残っています。",
    tone: "blue" as const,
    href: `${reportBase}/misinformation-risks`,
    action: "リスク確認"
  }
];

const dashboardQuickLinks = [
  {
    title: "AI回答ログ",
    description: "実際の回答、言及位置、参照文脈を確認",
    href: `${reportBase}/conversations`
  },
  {
    title: "参照元分析",
    description: "参照されたドメインとページの変化を見る",
    href: `${reportBase}/sources`
  },
  {
    title: "コンテンツ改善案",
    description: "不足しているトピックとページ改善案を確認",
    href: `${reportBase}/content-opportunities`
  }
];


type DashboardPriority = "High" | "Medium" | "Low";
type DashboardKpiTone = "blue" | "green" | "amber" | "rose" | "slate" | "purple";
type DashboardKpiCardData = {
  label: string;
  value: string;
  helper?: string;
  delta?: number;
  deltaLabel?: string;
  sparkline?: number[];
  tone?: DashboardKpiTone;
  chartType?: "line" | "bars";
};
type DashboardTask = {
  priority: DashboardPriority;
  task: string;
  impact: string;
  category: string;
  action: string;
  reason: string;
  expectedImpact: string;
  due: string;
};
type DashboardHomeCountMetric = {
  label: string;
  value: string;
  helper?: string;
};
type DashboardLatestReportStat = {
  label: string;
  value: string;
  helper?: string;
};
type DashboardHomeTrendRow = {
  label: string;
  value: string;
};
type DashboardSourceDomainRankRow = {
  domain: string;
  sourceTypeLabel: string;
  occurrenceCount: number;
  occurrenceValue: string;
  citationUrlValue: string;
  citationRowValue: string;
  share: number;
};
type DashboardHomeReadModelView = {
  hasHomeReadModel: boolean;
  aggregationPeriod: string;
  completedMeasurementCount: string;
  validObservationCount: string;
  aiConversationCount: string;
  brandDisplayObservationCount: string;
  citationOccurrenceCount: string;
  citationUrlCount: string;
  sourceDomainCount: string;
  recommendationCandidateCount: string;
  countMetrics: DashboardHomeCountMetric[];
  cautionMessages: string[];
  trendBars: number[];
  trendRows: DashboardHomeTrendRow[];
  trendMax: number;
  sourceDomainRanking: DashboardSourceDomainRankRow[];
  sourceDomainRankingMax: number;
};
type DashboardRankingRow = {
  brandId: string;
  name: string;
  visibility: number;
  citationShare: number;
  sentiment: number;
  winRate: number;
  isPrimary: boolean;
  brandTypeLabel?: string;
  displayAnswerCount?: number;
  aiMentionCount?: number;
  recommendationCount?: number;
  citationCount?: number;
  averagePosition?: number | null;
  competitiveGap?: number | null;
  strongTopic?: string;
  representativePrompt?: string;
  mentionContext?: string;
  coMentionedCompetitors?: string[];
  newAppearanceLabel?: string;
  newAppearanceNeedsVerification?: boolean;
};
type DashboardHomeViewModel = {
  hasDbData: boolean;
  hasLatestReportMetrics: boolean;
  hasLeaderboardData: boolean;
  projectSlug: string;
  reportBase: string;
  projectName: string;
  period: string;
  periodLabel: string;
  periodHelper: string;
  comparisonPeriod: string;
  lastUpdated: string;
  primaryBrandName: string;
  competitorCount: number;
  aiConversationCount: number;
  brandVisibilityValue: string;
  brandVisibilityNumber: number;
  aiMentionCount: number;
  citationCount: number;
  competitiveGapDelta: number;
  temporaryReportView: TemporaryReportViewModel;
  homeReadModel: DashboardHomeReadModelView;
  kpiCards: DashboardKpiCardData[];
  rankingRows: DashboardRankingRow[];
  latestReportStats: DashboardLatestReportStat[];
  priorityTasks: DashboardTask[];
};

function createDashboardHomeViewModel(
  data?: RecoraDashboardDbData | null,
  homeReadModelData?: RecoraHomeReadModelDbData | null
): DashboardHomeViewModel {
  const homeReadModel = createHomeReadModelView(homeReadModelData);

  if (!data?.project) {
    return createEmptyDashboardHomeViewModel(homeReadModel);
  }

  const primaryBrand = data.brands.find((item) => item.brand_type === "primary");
  const competitorCount = data.brands.filter((item) => item.brand_type === "competitor").length;
  const brandById = new Map(data.brands.map((item) => [item.id, item]));
  const brandSnapshots = data.metricSnapshots.filter((snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id);
  const projectSnapshot = data.metricSnapshots.find((snapshot) => snapshot.scope_type === "project") ?? brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ?? null;
  const primarySnapshot = brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ?? projectSnapshot;
  const hasLatestReportMetrics = Boolean(projectSnapshot || primarySnapshot);
  const latestAiVisibility = primarySnapshot?.ai_visibility ?? projectSnapshot?.ai_visibility ?? null;
  const latestMentionCount = projectSnapshot?.ai_mention_count ?? primarySnapshot?.ai_mention_count ?? null;
  const latestCitationCount = projectSnapshot?.citation_count ?? primarySnapshot?.citation_count ?? null;
  const sortedBrandSnapshots = [...brandSnapshots].sort((a, b) => b.ai_visibility - a.ai_visibility);
  const topCompetitorSnapshot = sortedBrandSnapshots.find((snapshot) => snapshot.brand_id !== primaryBrand?.id);
  const brandVisibilityNumber = typeof latestAiVisibility === "number" ? Math.round(latestAiVisibility) : 0;
  const competitiveGap = projectSnapshot?.competitive_gap ?? primarySnapshot?.competitive_gap ?? null;
  const absoluteGap = Math.abs(Math.round(competitiveGap ?? Math.max(0, (topCompetitorSnapshot?.ai_visibility ?? 0) - brandVisibilityNumber)));
  const latestRun = data.latestRun;
  const mentionCount = typeof latestMentionCount === "number" ? latestMentionCount : data.counts.aiConversations;
  const citationCount = Math.round(Number(latestCitationCount ?? data.counts.citations ?? 0));
  const displayCompetitiveGap = competitiveGap ?? -absoluteGap;
  const temporaryReportView = createTemporaryReportViewModel({
    run: latestRun
      ? {
          id: latestRun.id,
          status: latestRun.status,
          metadata: getJsonRecord(latestRun.metadata),
          started_at: latestRun.started_at,
          completed_at: latestRun.completed_at
        }
      : null,
    observations: [],
    metrics: {
      aiVisibility: primarySnapshot?.ai_visibility ?? projectSnapshot?.ai_visibility ?? null,
      mentionCount: projectSnapshot?.ai_mention_count ?? primarySnapshot?.ai_mention_count ?? null,
      citationCount: projectSnapshot?.citation_count ?? primarySnapshot?.citation_count ?? null,
      sourceDomainCount: null,
      shareOfVoice: projectSnapshot?.share_of_voice ?? primarySnapshot?.share_of_voice ?? null,
      competitiveGap
    },
    candidates: data.recommendations.map(toTemporaryReportCandidateInput),
    sources: []
  });

  const kpiCards: DashboardKpiCardData[] = createHomeReadModelKpiCards(homeReadModel);
  const latestReportDateScope = getReportDateScope(latestRun?.period_start, latestRun?.period_end);
  const latestReportStats: DashboardLatestReportStat[] = [
    { label: "AI回答数", value: formatNullableCount(data.counts.aiConversations), helper: "最新レポート内の回答数" },
    { label: "ブランド言及数", value: formatNullableCount(latestMentionCount), helper: "AI回答内での言及回数" },
    { label: "参照出現数", value: formatNullableCount(latestCitationCount ?? data.counts.citations), helper: "根拠確認済み数ではありません" },
    { label: "改善候補数", value: formatNullableCount(data.recommendations.length), helper: "実行確定済みの施策数ではありません" },
    { label: "比較ブランド数", value: formatNullableCount(competitorCount), helper: "最新レポートの比較対象" },
    { label: latestReportDateScope.label, value: latestReportDateScope.value, helper: latestReportDateScope.helper }
  ];

  const leaderVisibility = Math.round(sortedBrandSnapshots[0]?.ai_visibility ?? brandVisibilityNumber);
  const rankingRows = sortedBrandSnapshots.map((snapshot) => {
    const snapshotBrand = snapshot.brand_id ? brandById.get(snapshot.brand_id) : undefined;
    const position = snapshot.average_position ?? 4;
    const isPrimary = snapshotBrand?.brand_type === "primary";
    return {
      brandId: snapshot.brand_id ?? snapshot.id,
      name: snapshotBrand?.name ?? "Unknown",
      visibility: Math.round(snapshot.ai_visibility),
      citationShare: Math.round(snapshot.share_of_voice),
      sentiment: Math.round(Math.min(100, Math.max(0, snapshot.ai_visibility + 8))),
      winRate: Math.round(Math.min(100, Math.max(0, 100 - position * 14))),
      competitiveGap: isPrimary ? displayCompetitiveGap : round1(snapshot.ai_visibility - leaderVisibility),
      isPrimary
    };
  });

  const tasksFromDb = data.recommendations.slice(0, 3).map((item) => toDashboardTask(item));

  return {
    projectSlug: data.project.slug,
    reportBase: `/dashboard/reports/${data.project.slug}`,
    projectName: data.project.name,
    hasDbData: true,
    hasLatestReportMetrics,
    hasLeaderboardData: brandSnapshots.length > 0,
    period: latestReportDateScope.value,
    periodLabel: latestReportDateScope.label,
    periodHelper: latestReportDateScope.helper,
    comparisonPeriod: latestRun?.comparison_start && latestRun.comparison_end ? latestRun.comparison_start + " - " + latestRun.comparison_end : "-",
    lastUpdated: formatDateTime(latestRun?.completed_at ?? data.project.updated_at),
    primaryBrandName: primaryBrand?.name ?? "対象ブランド",
    competitorCount,
    aiConversationCount: data.counts.aiConversations,
    brandVisibilityValue: hasLatestReportMetrics ? formatPercent(brandVisibilityNumber) : "-",
    brandVisibilityNumber,
    aiMentionCount: mentionCount,
    citationCount,
    competitiveGapDelta: displayCompetitiveGap,
    temporaryReportView,
    homeReadModel,
    kpiCards,
    rankingRows,
    latestReportStats,
    priorityTasks: tasksFromDb
  };
}

function createEmptyDashboardHomeViewModel(
  homeReadModel: DashboardHomeReadModelView = createHomeReadModelView(null)
): DashboardHomeViewModel {
  return {
    hasDbData: false,
    hasLatestReportMetrics: false,
    hasLeaderboardData: false,
    projectSlug: currentReportSlug,
    reportBase,
    projectName: "Recora",
    period: "-",
    periodLabel: "測定日",
    periodHelper: "最新レポート取得後に表示",
    comparisonPeriod: "-",
    lastUpdated: "-",
    primaryBrandName: "Recora",
    competitorCount: 0,
    aiConversationCount: 0,
    brandVisibilityValue: "-",
    brandVisibilityNumber: 0,
    aiMentionCount: 0,
    citationCount: 0,
    competitiveGapDelta: 0,
    temporaryReportView: createTemporaryReportViewModel({
      run: null,
      observations: [],
      metrics: null,
      candidates: [],
      sources: []
    }),
    homeReadModel,
    kpiCards: createHomeReadModelKpiCards(homeReadModel),
    rankingRows: [],
    latestReportStats: [
      { label: "AI回答数", value: "-", helper: "最新レポート取得後に表示" },
      { label: "ブランド表示数", value: "-", helper: "最新レポート取得後に表示" },
      { label: "参照出現数", value: "-", helper: "根拠確認済み数ではありません" },
      { label: "改善候補数", value: "-", helper: "実行確定済みの施策数ではありません" },
      { label: "比較ブランド数", value: "-", helper: "最新レポート取得後に表示" },
      { label: "測定日", value: "-", helper: "最新レポート取得後に表示" }
    ],
    priorityTasks: []
  };
}

function createHomeReadModelView(data?: RecoraHomeReadModelDbData | null): DashboardHomeReadModelView {
  const cumulative = data?.cumulativeHomeSummary ?? null;
  const trend = data?.trendHomeSummary ?? null;
  const trendBars = trend?.points.map((point) => point.validObservationCount) ?? [];
  const trendMax = trendBars.length > 0 ? Math.max(1, ...trendBars) : 1;
  const cautionMessages = createHomeCautionMessages([
    ...(data?.latestAggregateSummary?.dataCautionFlags ?? []),
    ...(cumulative?.dataCautionFlags ?? []),
    ...(trend?.dataCautionFlags ?? [])
  ]);

  if (!cumulative) {
    return {
      hasHomeReadModel: false,
      aggregationPeriod: "-",
      completedMeasurementCount: "-",
      validObservationCount: "-",
      aiConversationCount: "-",
      brandDisplayObservationCount: "-",
      citationOccurrenceCount: "-",
      citationUrlCount: "-",
      sourceDomainCount: "-",
      recommendationCandidateCount: "-",
      countMetrics: [],
      cautionMessages,
      trendBars,
      trendRows: [],
      trendMax,
      sourceDomainRanking: [],
      sourceDomainRankingMax: 1
    };
  }

  const latestPoint = trend && trend.points.length > 0 ? trend.points[trend.points.length - 1] : null;
  const sourceDomainRanking = createSourceDomainRankingRows(
    cumulative.sourceDomainRanking,
    cumulative.citationOccurrenceCount
  );

  return {
    hasHomeReadModel: true,
    aggregationPeriod: formatHomePeriod(cumulative.aggregationPeriod.start, cumulative.aggregationPeriod.end),
    completedMeasurementCount: formatHomeCount(cumulative.completedMeasurementCount),
    validObservationCount: formatHomeCount(cumulative.validObservationCount),
    aiConversationCount: formatHomeCount(cumulative.aiConversationCount),
    brandDisplayObservationCount: formatHomeCount(cumulative.brandDisplayObservationCount),
    citationOccurrenceCount: formatHomeCount(cumulative.citationOccurrenceCount),
    citationUrlCount: formatHomeCount(cumulative.citationUrlCount),
    sourceDomainCount: formatHomeCount(cumulative.sourceDomainCount),
    recommendationCandidateCount: formatHomeCount(cumulative.recommendationCandidateCount),
    countMetrics: [
      {
        label: "完了済み測定数",
        value: formatHomeCount(cumulative.completedMeasurementCount),
        helper: "集計対象期間内の completed measurement"
      },
      {
        label: "有効観測数",
        value: formatHomeCount(cumulative.validObservationCount),
        helper: "失敗・partial・error を可能な範囲で除外"
      },
      {
        label: "AI回答観測数",
        value: formatHomeCount(cumulative.aiConversationCount),
        helper: "有効観測に紐づくAI回答"
      },
      {
        label: "ブランド表示観測数",
        value: formatHomeCount(cumulative.brandDisplayObservationCount),
        helper: "organic discovery の証明ではありません"
      },
      {
        label: "参照出現数",
        value: formatHomeCount(cumulative.citationOccurrenceCount),
        helper: "根拠確認済み件数ではありません"
      },
      {
        label: "参照URL数",
        value: formatHomeCount(cumulative.citationUrlCount),
        helper: "重複を除いたURL数"
      },
      {
        label: "参照ドメイン数",
        value: formatHomeCount(cumulative.sourceDomainCount),
        helper: "表示可能な参照ドメイン"
      },
      {
        label: "改善候補数",
        value: formatHomeCount(cumulative.recommendationCandidateCount),
        helper: "実行確定済みの施策数ではありません"
      }
    ],
    cautionMessages,
    trendBars,
    trendRows: latestPoint ? createHomeTrendRows(latestPoint) : [],
    trendMax,
    sourceDomainRanking,
    sourceDomainRankingMax: Math.max(1, ...sourceDomainRanking.map((row) => row.occurrenceCount))
  };
}

function createSourceDomainRankingRows(
  rows: RecoraCumulativeSourceDomainRank[],
  totalOccurrences: number
): DashboardSourceDomainRankRow[] {
  return rows.map((row) => ({
    domain: row.domain,
    sourceTypeLabel: getSourceTypeLabel(row.sourceType),
    occurrenceCount: row.occurrenceCount,
    occurrenceValue: formatNullableCount(row.occurrenceCount),
    citationUrlValue: formatNullableCount(row.citationUrlCount),
    citationRowValue: formatNullableCount(row.citationRowCount),
    share: totalOccurrences > 0 ? Math.round((row.occurrenceCount / totalOccurrences) * 100) : 0
  }));
}

function createHomeReadModelKpiCards(view: DashboardHomeReadModelView): DashboardKpiCardData[] {
  return [
    {
      label: "完了済み測定数",
      value: view.completedMeasurementCount,
      helper: "集計対象期間内の測定数",
      tone: "blue"
    },
    {
      label: "有効観測数",
      value: view.validObservationCount,
      helper: "失敗・partial・errorを可能な範囲で除外",
      tone: "green",
      sparkline: view.trendBars
    },
    {
      label: "AI回答観測数",
      value: view.aiConversationCount,
      helper: "有効観測に紐づくAI回答",
      tone: "blue"
    },
    {
      label: "参照出現数",
      value: view.citationOccurrenceCount,
      helper: "根拠確認済み件数ではありません",
      tone: "amber"
    },
    {
      label: "改善候補数",
      value: view.recommendationCandidateCount,
      helper: "実行確定済みの施策数ではありません",
      tone: "slate"
    }
  ];
}

function createHomeTrendRows(point: RecoraTrendHomePoint): DashboardHomeTrendRow[] {
  return [
    { label: "完了済み測定数", value: formatHomeCount(point.completedMeasurementCount) },
    { label: "有効観測数", value: formatHomeCount(point.validObservationCount) },
    { label: "ブランド表示観測数", value: formatHomeCount(point.brandDisplayObservationCount) },
    { label: "参照出現数", value: formatHomeCount(point.citationOccurrenceCount) },
    { label: "参照URL数", value: formatHomeCount(point.citationUrlCount) },
    { label: "参照ドメイン数", value: formatHomeCount(point.sourceDomainCount) }
  ];
}

function createHomeCautionMessages(flags: RecoraHomeDataCautionFlag[]) {
  const messages = flags.map(formatHomeCautionFlag);
  return Array.from(new Set(messages));
}

function formatHomeCautionFlag(flag: RecoraHomeDataCautionFlag) {
  const messages: Record<string, string> = {
    latest_aggregate_not_cumulative: "最新集計は通算値ではありません。",
    citation_count_not_source_to_claim_support: "参照として出現した数です。根拠確認済み件数ではありません。",
    recommendation_count_not_approved_actions: "改善候補数です。実行確定済みの施策数ではありません。",
    parse_status_needs_verification: "parse error の専用判定列は追加確認が必要です。",
    provider_error_needs_verification: "provider error は現行DBで確認できる範囲に限定して除外しています。",
    seed_measurements_excluded: "seedを含む測定は organic discovery の証拠として扱いません。",
    aggregate_runs_excluded_from_cumulative: "aggregate run は通算ホームのcountから除外しています。",
    non_measurement_run_kind_excluded: "measurement run_kind が確認できないrunは除外しています。",
    unsafe_run_items_excluded: "失敗・partial・error の可能性がある観測はcountから除外しています。",
    citation_status_not_evidence_quality: "citation status は証拠品質ではありません。",
    primary_brand_missing: "対象ブランドの表示観測数は追加確認が必要です。",
    small_sample_caution: "少数観測のため、追加測定で傾向が変わる可能性があります。",
    trend_comparability_needs_verification: "推移はcount系のみです。測定条件の完全一致は追加確認が必要です。",
    no_ai_visibility_or_competitive_gap_trend_p0: "AI可視性や競合差分の推移はP0では表示していません。"
  };

  if (messages[flag.code]) return messages[flag.code];
  if (flag.severity === "needs_verification") return "一部の集計条件は追加確認が必要です。";
  if (flag.severity === "warning") return "集計値は注意付きで確認してください。";
  return "表示値はRecoraの観測範囲に基づく参考値です。";
}

function formatHomePeriod(start: string | null, end: string | null) {
  if (!start && !end) return "-";
  return `${start ?? "-"} - ${end ?? "-"}`;
}

function formatHomeCount(value: number | null | undefined) {
  return typeof value === "number" ? `${value}件` : "-";
}

function formatNullableCount(value: number | null | undefined) {
  return typeof value === "number" ? `${value}件` : "-";
}

function createZeroRankingRowsFromBrands(brands: RecoraDashboardDbData["brands"], primaryBrandId?: string): DashboardRankingRow[] {
  return brands.map((brandItem) => ({
    brandId: brandItem.id,
    name: brandItem.name,
    visibility: 0,
    citationShare: 0,
    sentiment: 0,
    winRate: 0,
    isPrimary: brandItem.id === primaryBrandId || brandItem.brand_type === "primary",
    brandTypeLabel: brandItem.brand_type === "primary" ? "自社" : "競合",
    aiMentionCount: 0,
    recommendationCount: 0,
    citationCount: 0,
    averagePosition: null,
    competitiveGap: 0
  }));
}

function toTemporaryReportCandidateInput(item: RecoraRecommendationRow) {
  const metadata = getJsonRecord(item.metadata);

  return {
    id: item.id,
    title: item.title,
    status: item.status,
    displayDecision: getRecordString(metadata, "display_decision"),
    priority: item.priority,
    confidence: getRecordString(metadata, "confidence_label") ?? getRecordString(metadata, "confidence"),
    caution: getRecordString(metadata, "client_caution") ?? getRecordString(metadata, "caution")
  };
}

function getJsonRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function getRecordString(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

type LeaderboardCompetitorCard = {
  id: string;
  name: string;
  position: string;
  note: string;
  movement: number;
};

type LeaderboardModelRow = {
  id: string;
  name: string;
  visibility: number;
  citationRate: number;
  averagePosition: number | null;
};

type LeaderboardViewModel = {
  primaryBrandName: string;
  primaryVisibility: string;
  competitiveGapValue: string;
  competitiveGapDelta: number;
  primaryCitationShare: string;
  rankingRows: DashboardRankingRow[];
  competitorCards: LeaderboardCompetitorCard[];
  modelRows: LeaderboardModelRow[];
};

type BrandMentionAggregate = {
  mentionCount: number;
  recommendationCount: number;
  scoreTotal: number;
  scoreCount: number;
  positions: number[];
  displayConversationIds: Set<string>;
  topicCounts: Map<string, number>;
  promptCounts: Map<string, number>;
};

function createLeaderboardViewModel(data?: RecoraLeaderboardDbData | null): LeaderboardViewModel {
  if (!data?.project || data.brands.length === 0) {
    return createEmptyLeaderboardViewModel();
  }

  const primaryBrand = data.brands.find((item) => item.brand_type === "primary") ?? data.brands[0];
  const brandSnapshots = data.metricSnapshots.filter((snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id);
  const modelRows = createLeaderboardModelRows(data);

  if (brandSnapshots.length === 0) {
    return createEmptyLeaderboardViewModel(primaryBrand?.name, modelRows);
  }

  const snapshotByBrandId = new Map(brandSnapshots.map((snapshot) => [snapshot.brand_id, snapshot]));
  const conversationById = new Map(data.conversations.map((item) => [item.id, item]));
  const runItemById = new Map(data.runItems.map((item) => [item.id, item]));
  const promptById = new Map(data.prompts.map((item) => [item.id, item]));
  const topicById = new Map(data.topics.map((item) => [item.id, item]));
  const mentionStats = new Map<string, BrandMentionAggregate>();

  for (const mention of data.brandMentions) {
    if (!mention.mentioned) continue;

    const stat = getBrandMentionAggregate(mentionStats, mention.brand_id);
    stat.mentionCount += getMentionCount(mention);
    stat.displayConversationIds.add(mention.conversation_id);
    stat.scoreTotal += Number(mention.answer_score ?? 0);
    stat.scoreCount += 1;
    if (isRecommendedStatus(mention.recommendation_status)) {
      stat.recommendationCount += 1;
    }
    if (typeof mention.position === "number") {
      stat.positions.push(mention.position);
    }

    const conversation = conversationById.get(mention.conversation_id);
    const runItem = conversation ? runItemById.get(conversation.run_item_id) : undefined;
    const prompt = runItem ? promptById.get(runItem.prompt_id) : undefined;
    const topic = prompt ? topicById.get(prompt.topic_id) : undefined;
    if (topic?.name) {
      incrementMap(stat.topicCounts, topic.name);
    }
    if (prompt?.text) {
      incrementMap(stat.promptCounts, prompt.text);
    }
  }

  const citationCounts = new Map<string, number>();
  for (const citation of data.citations) {
    if (!citation.brand_id) continue;
    citationCounts.set(
      citation.brand_id,
      (citationCounts.get(citation.brand_id) ?? 0) + Number(citation.occurrence_count ?? 1)
    );
  }

  const primarySnapshot = primaryBrand ? snapshotByBrandId.get(primaryBrand.id) : undefined;
  const primaryStat = primaryBrand ? mentionStats.get(primaryBrand.id) : undefined;
  const primaryDisplayAnswerCount = primaryStat?.displayConversationIds.size ?? 0;
  const primaryVisibility = Math.round(primarySnapshot?.ai_visibility ?? calculateVisibility(primaryDisplayAnswerCount, data.conversations.length));
  const topCompetitorVisibility = Math.max(
    0,
    ...data.brands
      .filter((item) => item.id !== primaryBrand?.id)
      .map((item) => Math.round(snapshotByBrandId.get(item.id)?.ai_visibility ?? calculateVisibility(mentionStats.get(item.id)?.displayConversationIds.size ?? 0, data.conversations.length)))
  );
  const primaryGap = Math.round(primarySnapshot?.competitive_gap ?? primaryVisibility - topCompetitorVisibility);
  const totalBrandMentions = Math.max(
    1,
    data.brandMentions
      .filter((item) => item.mentioned)
      .reduce((sum, mention) => sum + getMentionCount(mention), 0)
  );
  const coMentionedCompetitorsByBrandId = createCoMentionedCompetitorsByBrandId(data);

  const rankingRows = brandSnapshots
    .flatMap((snapshot) => {
      const brandItem = snapshot.brand_id ? data.brands.find((item) => item.id === snapshot.brand_id) : undefined;
      if (!brandItem) return [];
      const stat = mentionStats.get(brandItem.id);
      const displayAnswerCount = stat?.displayConversationIds.size ?? 0;
      const mentionCount = Math.round(snapshot?.ai_mention_count ?? stat?.mentionCount ?? 0);
      const citationCountFromRows = citationCounts.get(brandItem.id) ?? 0;
      const citationCount = Math.round(citationCountFromRows || snapshot?.citation_count || 0);
      const averagePosition = snapshot?.average_position ?? average(stat?.positions ?? []);
      const visibility = Math.round(snapshot?.ai_visibility ?? calculateVisibility(displayAnswerCount, data.conversations.length));
      const shareOfVoice = Math.round(snapshot?.share_of_voice ?? ((stat?.mentionCount ?? 0) / totalBrandMentions) * 100);
      const scoreAverage = stat?.scoreCount ? stat.scoreTotal / stat.scoreCount : null;
      const recommendationCount = stat?.recommendationCount ?? 0;
      const winRate = mentionCount > 0 ? Math.round((recommendationCount / mentionCount) * 100) : 0;
      const strongTopic = getTopMapKey(stat?.topicCounts) ?? brandItem.category ?? "-";
      const representativePrompt = truncateText(getTopMapKey(stat?.promptCounts) ?? "", 44);
      const coMentionedCompetitors = coMentionedCompetitorsByBrandId.get(brandItem.id) ?? [];

      return [{
        brandId: brandItem.id,
        name: brandItem.name,
        visibility,
        citationShare: shareOfVoice,
        sentiment: scoreAverage === null ? Math.round(Math.min(100, Math.max(0, visibility + 8))) : Math.round((scoreAverage / 5) * 100),
        winRate,
        isPrimary: brandItem.brand_type === "primary",
        brandTypeLabel: brandItem.brand_type === "primary" ? "自社" : "競合",
        displayAnswerCount,
        aiMentionCount: mentionCount,
        recommendationCount,
        citationCount,
        averagePosition,
        competitiveGap: brandItem.id === primaryBrand?.id ? primaryGap : Math.round(visibility - primaryVisibility),
        strongTopic,
        representativePrompt,
        mentionContext: createMentionContext(strongTopic, representativePrompt),
        coMentionedCompetitors,
        newAppearanceLabel: "NEEDS_VERIFICATION",
        newAppearanceNeedsVerification: true
      } satisfies DashboardRankingRow];
    })
    .sort((a, b) => b.visibility - a.visibility || (b.citationCount ?? 0) - (a.citationCount ?? 0));

  const primaryRow = rankingRows.find((row) => row.isPrimary);
  const competitorCards = rankingRows
    .filter((row) => !row.isPrimary)
    .slice(0, 4)
    .map((row, index) => ({
      id: row.brandId,
      name: row.name,
      position: String(index + 1) + "位 / AI表示率 " + row.visibility + "%",
      movement: row.competitiveGap ?? 0,
      note: (row.strongTopic ?? "主要トピック") + "で表示。推薦数 " + (row.recommendationCount ?? 0) + "件、参照回数 " + (row.citationCount ?? 0) + "件。"
    }));

  return {
    primaryBrandName: primaryBrand?.name ?? "対象ブランド",
    primaryVisibility: formatPercent(primaryRow?.visibility ?? primaryVisibility),
    competitiveGapValue: formatSignedPt(primaryGap),
    competitiveGapDelta: primaryGap,
    primaryCitationShare: formatPercent(primaryRow?.citationShare ?? Math.round(primarySnapshot?.share_of_voice ?? 0)),
    rankingRows,
    competitorCards,
    modelRows
  };
}

function createEmptyLeaderboardViewModel(primaryBrandName = "Recora", modelRows: LeaderboardModelRow[] = []): LeaderboardViewModel {
  return {
    primaryBrandName,
    primaryVisibility: formatPercent(0),
    competitiveGapValue: formatSignedPt(0),
    competitiveGapDelta: 0,
    primaryCitationShare: formatPercent(0),
    rankingRows: [],
    competitorCards: [],
    modelRows
  };
}

function createLeaderboardModelRows(data: RecoraLeaderboardDbData): LeaderboardModelRow[] {
  return data.metricSnapshots
    .filter((snapshot) => snapshot.scope_type === "model")
    .map((snapshot) => ({
      id: snapshot.scope_id ?? snapshot.id,
      name: snapshot.scope_id ? `AIモデル ${snapshot.scope_id}` : "AIモデル",
      visibility: Math.round(snapshot.ai_visibility),
      citationRate: Math.round(snapshot.share_of_voice),
      averagePosition: snapshot.average_position
    }))
    .sort((a, b) => b.visibility - a.visibility);
}

function createCoMentionedCompetitorsByBrandId(data: RecoraLeaderboardDbData) {
  const brandById = new Map(data.brands.map((item) => [item.id, item]));
  const mentionedByConversationId = groupBy(
    data.brandMentions.filter((item) => item.mentioned),
    (item) => item.conversation_id
  );
  const result = new Map<string, string[]>();

  for (const brandItem of data.brands) {
    const counts = new Map<string, number>();

    for (const mentions of Array.from(mentionedByConversationId.values())) {
      if (!mentions.some((mention) => mention.brand_id === brandItem.id)) continue;

      for (const mention of mentions) {
        if (mention.brand_id === brandItem.id) continue;
        const coMentionedBrand = brandById.get(mention.brand_id);
        if (!coMentionedBrand || coMentionedBrand.brand_type !== "competitor") continue;
        incrementMap(counts, coMentionedBrand.name);
      }
    }

    result.set(
      brandItem.id,
      Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([name]) => name)
    );
  }

  return result;
}

function createMentionContext(strongTopic?: string, representativePrompt?: string) {
  const topic = strongTopic && strongTopic !== "-" ? strongTopic : null;
  const prompt = representativePrompt ? representativePrompt : null;

  if (topic && prompt) return `${topic} / ${prompt}`;
  if (topic) return topic;
  if (prompt) return prompt;
  return "文脈は追加確認";
}

function getBrandMentionAggregate(stats: Map<string, BrandMentionAggregate>, brandId: string) {
  const current = stats.get(brandId);
  if (current) return current;

  const next: BrandMentionAggregate = {
    mentionCount: 0,
    recommendationCount: 0,
    scoreTotal: 0,
    scoreCount: 0,
    positions: [],
    displayConversationIds: new Set<string>(),
    topicCounts: new Map(),
    promptCounts: new Map()
  };
  stats.set(brandId, next);
  return next;
}

function incrementMap(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function getTopMapKey(map?: Map<string, number>) {
  if (!map || map.size === 0) return null;
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function isRecommendedStatus(value: string) {
  return value === "strongly_recommended" || value === "recommended";
}

function getMentionCount(mention: { mention_count?: number | null; mentioned: boolean }) {
  if (typeof mention.mention_count === "number" && Number.isFinite(mention.mention_count)) {
    return Math.max(0, mention.mention_count);
  }

  return mention.mentioned ? 1 : 0;
}

function calculateVisibility(mentionCount: number, totalConversations: number) {
  if (totalConversations <= 0) return 0;
  return (mentionCount / totalConversations) * 100;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatSignedPt(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  const rounded = round1(value);
  return (rounded > 0 ? "+" : "") + rounded + "pt";
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "...";
}

function toDashboardTask(item: RecoraRecommendationRow): DashboardTask {
  return {
    priority: toDashboardPriority(item.priority),
    task: item.title,
    impact: "表示候補",
    category: recommendationTypeLabel(item.type),
    action: item.reason ?? item.target_url ?? "改善候補の内容を確認してください。",
    reason: item.reason ?? "観測データから表示された改善候補です。根拠確認が必要です。",
    expectedImpact: "承認済み施策や効果保証ではありません",
    due: "-"
  };
}

function toDashboardPriority(value: RecoraRecommendationRow["priority"]): DashboardPriority {
  if (value === "high") return "High";
  if (value === "low") return "Low";
  return "Medium";
}

function recommendationTypeLabel(value: RecoraRecommendationRow["type"]) {
  const labels: Record<RecoraRecommendationRow["type"], string> = { content: "コンテンツ", source: "参照元", technical: "技術診断", prompt: "プロンプト", risk: "リスク", competitive: "競合" };
  return labels[value];
}

function buildSparkline(value: number) {
  if (value <= 0) return [0, 0, 0, 0, 0, 0];
  const safeValue = Math.round(value);
  return [safeValue * 0.62, safeValue * 0.72, safeValue * 0.68, safeValue * 0.82, safeValue * 0.9, safeValue].map(Math.round);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(date);
}
export function DashboardHomePage({
  dashboardData = null,
  homeReadModelData = null
}: {
  dashboardData?: RecoraDashboardDbData | null;
  homeReadModelData?: RecoraHomeReadModelDbData | null;
}) {
  const dashboardView = createDashboardHomeViewModel(dashboardData, homeReadModelData);

  return (
    <div className="min-w-0 space-y-6">
      <HomeLatestReportHero dashboardView={dashboardView} />

      <HomeObservationSafetyStrip view={dashboardView.homeReadModel} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <HomeLatestLeaderboardPanel dashboardView={dashboardView} />
        <HomeCumulativeSourcesPanel view={dashboardView.homeReadModel} />
      </div>
    </div>
  );
}

function HomeLatestReportHero({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#DDE8E5] bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#00796B] px-3.5 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,121,107,0.20)]">
          <Activity className="h-4 w-4" />
          ホーム
        </div>
        <Link
          href={dashboardView.reportBase}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-[#DDE8E5] bg-white px-3 text-xs font-bold text-[#005C50] transition hover:border-[#00796B]/30 hover:bg-[#E6F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
        >
          最新レポートへ
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-[#DDE8E5] bg-[radial-gradient(circle_at_8%_100%,rgba(230,244,241,0.88),rgba(255,255,255,0)_38%),linear-gradient(135deg,#FFFFFF_0%,#FFFFFF_56%,#F7FCFB_100%)] p-5 shadow-inner sm:p-7">
        <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(260px,320px)_minmax(380px,0.9fr)] xl:items-center">
          <div className="min-w-0">
            <div className="inline-flex rounded-full bg-[#E6F4F1] px-4 py-2 text-xs font-bold text-[#005C50]">
              最新レポートの観測値
            </div>
            <p className="mt-7 text-sm font-semibold text-[#00796B]">AI検索でどれだけ候補に入れているか</p>
            <h1 className="mt-2 max-w-xl text-3xl font-bold leading-tight tracking-normal text-[#073F39] sm:text-4xl">
              最新レポートのAI表示率
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#475569]">
              最新レポートで観測したAI回答内のブランド存在感です。公式評価や成果保証ではなく、Recoraの観測範囲に基づく表示です。
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <HomeHeroFact icon={CalendarDays} label="測定日" value={dashboardView.lastUpdated} />
              <HomeHeroFact icon={FileText} label={dashboardView.periodLabel} value={dashboardView.period} />
            </div>
          </div>

          <HomeVisibilityGauge dashboardView={dashboardView} />

          <div className="min-w-0">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">latest report numbers</p>
              <h2 className="mt-2 text-xl font-bold tracking-normal text-[#0F172A]">主要数字</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboardView.latestReportStats.map((stat) => (
                <HomeLatestStatTile key={stat.label} stat={stat} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeHeroFact({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE8E5] bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6F4F1] text-[#00796B]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#64748B]">{label}</p>
          <p className="mt-1 truncate text-sm font-bold text-[#0F172A]" title={value}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function HomeVisibilityGauge({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  const value = Math.max(0, Math.min(100, dashboardView.brandVisibilityNumber));

  if (!dashboardView.hasLatestReportMetrics) {
    return (
      <div className="flex h-64 min-w-0 items-center justify-center rounded-[24px] border border-[#DDE8E5] bg-white/80 p-4">
        <EmptyDashboardState message="最新レポートのAI表示率を取得後に表示します。" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[320px] flex-col items-center">
      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full p-4 sm:h-72 sm:w-72"
        style={{ background: `conic-gradient(#00796B ${value * 3.6}deg, #EEF3F1 0deg)` }}
        aria-label={`AI表示率 ${dashboardView.brandVisibilityValue}`}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[#DDE8E5] bg-white text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_45px_rgba(15,23,42,0.08)]">
          <span className="text-xs font-bold text-[#64748B]">AI表示率</span>
          <span className="mt-1 text-6xl font-bold tracking-normal text-[#073F39] sm:text-7xl">{dashboardView.brandVisibilityValue}</span>
          <span className="mt-2 text-[11px] font-semibold text-[#00796B]">最新レポート</span>
        </div>
      </div>
      <div className="mt-3 w-full max-w-[260px] rounded-2xl border border-[#DDE8E5] bg-white/85 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#64748B]">
          <span>AI回答内でのブランド存在感</span>
          <span>{dashboardView.brandVisibilityValue}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8EFED]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#6FE1C3] to-[#00796B]" style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

function HomeLatestStatTile({ stat }: { stat: DashboardLatestReportStat }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[#E3ECE9] bg-white/90 px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <p className="truncate text-xs font-bold text-[#00796B]" title={stat.label}>{stat.label}</p>
      <p className="mt-1 truncate text-2xl font-bold tracking-normal text-[#0F172A]" title={stat.value}>{stat.value}</p>
      {stat.helper ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B]">{stat.helper}</p>
      ) : null}
    </div>
  );
}

function HomeObservationSafetyStrip({ view }: { view: DashboardHomeReadModelView }) {
  const cautions = view.cautionMessages.length > 0
    ? view.cautionMessages.slice(0, 3)
    : ["最新レポートの値はRecoraの観測範囲に基づく参考値です。"];

  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7E6] text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-950">表示の前提</p>
            <p className="mt-1 text-xs font-semibold text-amber-700">観測値として表示し、保証表現は使いません</p>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
          {cautions.map((caution) => (
            <div key={caution} className="rounded-xl border border-amber-200/70 bg-amber-50/55 px-3 py-2 text-xs font-semibold leading-5 text-slate-700">
              {caution}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeLatestLeaderboardPanel({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  const rows = dashboardView.rankingRows.slice(0, 5);
  const maxVisibility = Math.max(1, ...rows.map((row) => row.visibility));

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00796B]/15 bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#005C50]">
            <Crown className="h-3.5 w-3.5" />
            業界リーダーボード
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-normal text-slate-950">AI回答内ブランドランキング 上位5位</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            最新レポート内の観測順位です。外部ランキングや成果評価ではありません。
          </p>
        </div>
        <Link
          href={`${dashboardView.reportBase}/leaderboard`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
        >
          ブランド比較へ
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {dashboardView.hasLeaderboardData && rows.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {rows.map((row, index) => (
            <HomeLeaderboardRow key={row.brandId} row={row} rank={index + 1} maxVisibility={maxVisibility} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyDashboardState message="最新レポートのブランド比較データを取得後に表示します。" />
        </div>
      )}
    </section>
  );
}

function HomeLeaderboardRow({
  row,
  rank,
  maxVisibility
}: {
  row: DashboardRankingRow;
  rank: number;
  maxVisibility: number;
}) {
  const barWidth = Math.max(6, Math.min(100, (row.visibility / Math.max(1, maxVisibility)) * 100));

  return (
    <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 bg-[#FAFBFB] px-4 py-3">
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold",
        row.isPrimary ? "bg-[#00796B] text-white" : "bg-slate-100 text-slate-700"
      )}>
        {rank}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-950" title={row.name}>{row.name}</p>
          <span className={cn(
            "rounded-full border px-2 py-0.5 text-[11px] font-bold",
            row.isPrimary ? "border-emerald-200 bg-emerald-50 text-[#00796B]" : "border-slate-200 bg-white text-slate-600"
          )}>
            {row.isPrimary ? "自社ブランド" : "比較ブランド"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={cn("h-full rounded-full", row.isPrimary ? "bg-[#00796B]" : "bg-slate-400")} style={{ width: `${barWidth}%` }} />
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums text-slate-950">{formatPercent(row.visibility)}</p>
        <p className="text-[11px] font-semibold text-slate-500">AI表示率</p>
      </div>
    </div>
  );
}

function HomeCumulativeSourcesPanel({ view }: { view: DashboardHomeReadModelView }) {
  const rows = view.sourceDomainRanking;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <ExternalLink className="h-3.5 w-3.5 text-[#00796B]" />
            通算引用元
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-normal text-slate-950">よく参照されている情報源</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            通算で参照として出現したドメイン順位です。回答内容を支持する確認済み件数ではありません。
          </p>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {rows.map((row, index) => (
            <HomeSourceRankRow
              key={row.domain}
              row={row}
              rank={index + 1}
              maxOccurrences={view.sourceDomainRankingMax}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyDashboardState message="通算引用元ランキングは、表示可能な参照ドメインが蓄積された後に表示します。" />
        </div>
      )}
    </section>
  );
}

function HomeSourceRankRow({
  row,
  rank,
  maxOccurrences
}: {
  row: DashboardSourceDomainRankRow;
  rank: number;
  maxOccurrences: number;
}) {
  const barWidth = Math.max(6, Math.min(100, (row.occurrenceCount / Math.max(1, maxOccurrences)) * 100));

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-[#FAFBFB] px-4 py-3">
      <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3">
        <span className="text-sm font-bold tabular-nums text-slate-500">{rank}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950" title={row.domain}>{row.domain}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
            <span>{row.sourceTypeLabel}</span>
            <span>URL {row.citationUrlValue}</span>
            <span>行 {row.citationRowValue}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold tabular-nums text-slate-950">{row.occurrenceValue}</p>
          <p className="text-[11px] font-semibold text-slate-500">参照出現</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#00796B]" style={{ width: `${barWidth}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-500">通算参照出現のうち約{row.share}%</p>
    </div>
  );
}

function HomeCommandHeader({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  const view = dashboardView.homeReadModel;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#003F36]/20 bg-[#003F36] p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:p-6 lg:p-7">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-[#DDF7EF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              ホーム
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/75">
              通算状態 + count系推移
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-normal text-white sm:text-4xl lg:text-5xl">
            Recora全体の観測量を、安全な範囲で確認する
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/74 sm:text-base">
            このホームは選択レポートの詳細ではなく、完了済み測定から足し上げても意味が壊れにくいcount系項目と、比較注意付きの推移を見る場所です。
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/78">AI表示率は通算化しません</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/78">競合差分は詳細側で確認</span>
            <span className="rounded-full border border-amber-200/35 bg-amber-100/10 px-3 py-1 text-amber-100">注意文を先に表示</span>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-white/12 bg-white/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white/62">
            <Activity className="h-4 w-4 text-[#9CE2D0]" />
            現在のホーム集計
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <HomeHeaderStat label="集計対象期間" value={view.aggregationPeriod} />
            <HomeHeaderStat label="有効観測数" value={view.validObservationCount} />
            <HomeHeaderStat label="完了済み測定数" value={view.completedMeasurementCount} />
            <HomeHeaderStat label="改善候補数" value={view.recommendationCandidateCount} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/reports"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-[#003F36] shadow-sm transition hover:bg-[#E6F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#003F36]"
            >
              レポート一覧
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={reportBase}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#003F36]"
            >
              最新レポート詳細
              <FileText className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeHeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
      <p className="text-[11px] font-semibold text-white/56">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white" title={value}>{value}</p>
    </div>
  );
}

function HomeCumulativeLedger({ view }: { view: DashboardHomeReadModelView }) {
  const metrics = view.countMetrics;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-[#F6FAF9] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00796B]/15 bg-white px-3 py-1 text-xs font-bold text-[#005C50]">
              <ListChecks className="h-3.5 w-3.5" />
              通算台帳
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">足し上げても意味が壊れにくいcount系項目</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              最新スナップショットのAI表示率や競合差分ではなく、ホーム用の通算集計から件数だけを表示します。
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-slate-500">集計対象期間</p>
            <p className="mt-1 font-bold text-slate-950">{view.aggregationPeriod}</p>
          </div>
        </div>
      </div>

      {metrics.length > 0 ? (
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
          <div className="border-b border-slate-200 bg-slate-950 p-5 text-white lg:border-b-0 lg:border-r lg:border-slate-200 sm:p-6">
            <p className="text-xs font-bold uppercase text-emerald-100/70">primary count</p>
            <p className="mt-3 text-sm font-semibold text-white/66">有効観測数</p>
            <p className="mt-2 text-5xl font-bold tracking-normal text-white">{view.validObservationCount}</p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              失敗・partial・error の可能性がある観測を可能な範囲で除外した、ホーム通算の中心値です。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HomeDarkStat label="完了済み測定数" value={view.completedMeasurementCount} />
              <HomeDarkStat label="AI回答観測数" value={view.aiConversationCount} />
            </div>
          </div>

          <div className="grid min-w-0 gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <HomeLedgerMetric key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <EmptyDashboardState message="追加測定後に、集計対象期間内のcount系項目を表示します。" />
        </div>
      )}
    </section>
  );
}

function HomeDarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
      <p className="text-[11px] font-semibold text-white/50">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function HomeLedgerMetric({ metric }: { metric: DashboardHomeCountMetric }) {
  return (
    <div className="min-w-0 bg-white p-4 sm:p-5">
      <p className="text-xs font-bold text-slate-500">{metric.label}</p>
      <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{metric.value}</p>
      {metric.helper ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{metric.helper}</p>
      ) : null}
    </div>
  );
}

function HomeTrendPanel({ view }: { view: DashboardHomeReadModelView }) {
  const hasTrendData = view.trendBars.length > 0;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <BarChart3 className="h-3.5 w-3.5 text-[#00796B]" />
            count系推移
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-normal text-slate-950">有効観測数の推移</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            比較条件の完全一致は追加確認が必要です。AI可視性や競合差分の推移はP0では表示していません。
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          comparison caution
        </span>
      </div>

      {hasTrendData ? (
        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-[#F6FAF9] p-4">
            <div className="flex h-56 items-end gap-2 rounded-lg bg-white p-3">
              {view.trendBars.map((value, index) => (
                <HomeTrendBar key={`${value}-${index}`} value={value} max={view.trendMax} index={index} />
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              棒は各期間の有効観測数です。値が少ない期間は傾向の解釈に注意が必要です。
            </p>
          </div>

          <div className="grid content-start gap-2">
            <HomeTrendSummaryRow label="集計対象期間" value={view.aggregationPeriod} />
            {view.trendRows.map((row) => (
              <HomeTrendSummaryRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyDashboardState message="追加測定後にcount系推移を表示します。グラフは既存データがある範囲だけで表示します。" />
        </div>
      )}
    </section>
  );
}

function HomeTrendBar({ value, max, index }: { value: number; max: number; index: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="flex h-40 w-full items-end rounded-md bg-slate-100">
        <div
          className="w-full rounded-md bg-[#00796B]"
          style={{ height: value > 0 ? `${Math.max(8, Math.min((value / Math.max(1, max)) * 100, 100))}%` : "0%" }}
        />
      </div>
      <span className="text-xs font-bold text-slate-500">{index + 1}</span>
    </div>
  );
}

function HomeTrendSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function HomeRoutePanel({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  return (
    <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#00796B]/15 bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#005C50]">
        <FileText className="h-3.5 w-3.5" />
        補助導線
      </div>
      <h2 className="mt-3 text-lg font-bold tracking-normal text-slate-950">詳細はレポート側で確認</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        ホームは全体の観測量を見る場所です。AI回答、ブランド比較、参照元の詳細はレポートを選択して確認します。
      </p>

      <div className="mt-5 grid gap-2">
        <HomeActionLink href="/dashboard/reports" title="レポート一覧" description="過去レポートから1件を選択" />
        <HomeActionLink href={reportBase} title="最新レポート詳細" description={`最終更新: ${dashboardView.lastUpdated}`} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase text-slate-400">homeでは強調しない指標</p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
          <li>AI表示率・平均順位は通算値にしません。</li>
          <li>競合差分は条件が揃うまでP0推移にしません。</li>
          <li>参照出現数は根拠確認済み数ではありません。</li>
        </ul>
      </div>
    </aside>
  );
}

function HomeActionLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[#00796B]/30 hover:bg-[#F6FAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#00796B] transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function HomeRecommendationPanel({ tasks = [] }: { tasks?: DashboardTask[] }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <ListChecks className="h-3.5 w-3.5 text-[#00796B]" />
            改善候補
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-normal text-slate-950">確認が必要な候補</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">承認済み施策や効果保証ではありません。</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
          {tasks.length}件
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {tasks.length > 0 ? (
          tasks.slice(0, 3).map((task) => (
            <div key={task.task} className="rounded-xl border border-slate-200 bg-[#F6FAF9] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityPill value={task.priority} />
                <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-[#00796B]">
                  {task.impact}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-950">{task.task}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{task.reason}</p>
            </div>
          ))
        ) : (
          <EmptyDashboardState message="現在表示できる改善候補はありません。" />
        )}
      </div>
    </section>
  );
}

function HomeLatestSnapshotPanel({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#FAFBFB] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#00796B]" />
        レポート詳細に残すもの
      </div>
      <h2 className="mt-3 text-lg font-bold tracking-normal text-slate-950">最新状態は参考導線として扱う</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        AI表示率、ブランド比較、競合差分、平均順位は、選択した1レポートに閉じた詳細として確認します。ホームでは通算値として扱いません。
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <HomeDetailBoundaryItem label="AI回答" />
        <HomeDetailBoundaryItem label="ブランド比較" />
        <HomeDetailBoundaryItem label="参照元詳細" />
        <HomeDetailBoundaryItem label="改善候補の理由" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={reportBase}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00796B] px-4 text-xs font-bold text-white transition hover:bg-[#005C50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
        >
          レポート詳細へ
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <span className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500">
          最終更新: {dashboardView.lastUpdated}
        </span>
      </div>
    </section>
  );
}

function HomeDetailBoundaryItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00796B]" />
      {label}
    </div>
  );
}

function TemporaryReportStatusCard({ view }: { view: TemporaryReportViewModel }) {
  const isBlocked = view.clientDisplayReadiness.status === "blocked";

  return (
    <section className={cn(
      "mt-5 rounded-lg border bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)]",
      isBlocked ? "border-amber-200" : "border-teal-200"
    )}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-950">暫定report viewの表示状態</h2>
            <Badge
              variant="outline"
              className={cn(
                "rounded-sm text-xs",
                isBlocked ? "border-amber-200 bg-amber-50 text-amber-700" : "border-teal-200 bg-teal-50 text-teal-700"
              )}
            >
              {view.clientDisplayReadiness.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{view.clientDisplayReadiness.label}</p>
          {isBlocked ? (
            <p className="mt-2 text-sm leading-6 text-amber-700">
              {"この状態ではKPIを正式な評価や承認済みレポートとして扱いません。"}
            </p>
          ) : null}
        </div>
        <div className="grid min-w-[260px] gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
          <TemporaryReportStatusValue
            label="暫定report view必要条件"
            value={view.runPrerequisitesMet ? "満たしています" : "未達"}
            isMuted={isBlocked}
          />
          <TemporaryReportStatusValue label="有効観測" value={String(view.validObservationCount)} isMuted={isBlocked} />
          <TemporaryReportStatusValue label="除外観測" value={String(view.invalidObservationCount)} isMuted={false} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">blocking reasons</p>
          {view.clientDisplayReadiness.blockingReasons.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
              {view.clientDisplayReadiness.blockingReasons.map((reason) => (
                <li key={reason}>{"- "}{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {"重大なblocking reasonはありません。ただし正式なreport entityではなく注意付きの暫定表示です。"}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">cautions</p>
          <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-slate-600 md:grid-cols-2">
            {view.cautions.map((caution) => (
              <li key={caution}>{"- "}{caution}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TemporaryReportStatusValue({ label, value, isMuted }: { label: string; value: string; isMuted: boolean }) {
  return (
    <div className={cn("rounded-md border px-3 py-2", isMuted ? "border-amber-100 bg-amber-50/60" : "border-slate-200 bg-slate-50")}>
      <p className="truncate text-[11px] text-slate-500" title={label}>{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950" title={value}>{value}</p>
    </div>
  );
}

function HomeReadModelStatusCard({ view }: { view: DashboardHomeReadModelView }) {
  const cautions = view.cautionMessages.length > 0
    ? view.cautionMessages
    : ["追加測定後にホーム集計の注意事項を表示します。"];

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="grid min-w-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="border-b border-amber-200 bg-white p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">先に確認する注意</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">dataCautionFlags</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            ホームの数値は、正式評価・保証・承認済み施策ではなく、Recoraの観測範囲に基づく注意付きの集計です。
          </p>
        </div>

        <div className="p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <HomeCautionFact label="集計対象期間" value={view.aggregationPeriod} />
            <HomeCautionFact label="表示範囲" value="count系のみ" />
            <HomeCautionFact label="状態" value={view.hasHomeReadModel ? "read model接続済み" : "追加測定後に表示"} />
          </div>

          <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 md:grid-cols-2">
            {cautions.map((caution) => (
              <li key={caution} className="flex gap-2 rounded-lg border border-amber-200/70 bg-white/80 px-3 py-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{caution}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HomeCautionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-200/70 bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function DashboardSnapshotHero({ dashboardView }: { dashboardView: DashboardHomeViewModel }) {
  return (
    <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="min-w-0 overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-[#005C50] p-6 text-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,1fr)] lg:items-end">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-[#E6F4F1]">
              {dashboardView.hasDbData ? "最新aggregate snapshot" : "表示できるデータがありません"}
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <p className="text-6xl font-bold tracking-tight sm:text-7xl">{dashboardView.brandVisibilityValue}</p>
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#00796B]">
                競合差分 {formatSignedPt(dashboardView.competitiveGapDelta)}
              </span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/78">
              {dashboardView.hasDbData
                ? "最新の集計スナップショットから、AI表示率・AI言及数・参照回数・競合差分を表示しています。数値は保存済みの測定結果に基づきます。"
                : "測定を実行すると、ここにAI表示率・AI言及数・参照回数・競合差分が表示されます。"}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroStat label="AI言及数" value={String(dashboardView.aiMentionCount)} />
              <HeroStat label="参照回数" value={String(dashboardView.citationCount)} />
              <HeroStat label="競合数" value={String(dashboardView.competitorCount)} />
            </div>
          </div>

          <div className="min-w-0 rounded-[18px] border border-white/12 bg-white/10 p-5">
            <p className="text-sm font-bold text-white">KPI内訳</p>
            <p className="mt-1 text-xs leading-5 text-white/65">
              {dashboardView.hasDbData ? "現在の測定結果のみを表示" : "測定結果がありません"}
            </p>
            <div className="mt-5 grid gap-3">
              <HeroBreakdownRow label="AI表示率" value={dashboardView.brandVisibilityValue} />
              <HeroBreakdownRow label="AI言及数" value={String(dashboardView.aiMentionCount)} />
              <HeroBreakdownRow label="参照回数" value={String(dashboardView.citationCount)} />
              <HeroBreakdownRow label="競合差分" value={formatSignedPt(dashboardView.competitiveGapDelta)} />
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-tight text-[#0F172A]">改善候補</p>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">確認が必要な表示候補</p>
          </div>
          <span className="rounded-full bg-[#E6F4F1] px-2.5 py-1 text-xs font-bold text-[#00796B]">
            {dashboardView.priorityTasks.length}件
          </span>
        </div>
        {dashboardView.priorityTasks[0] ? (
          <ActionSummaryCard task={dashboardView.priorityTasks[0]} />
        ) : (
          <EmptyDashboardState message="現在表示できる改善候補はありません。" />
        )}
        <Link
          href={`${reportBase}/action-plan`}
          className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#00796B] hover:text-[#005C50]"
        >
          改善候補を確認する
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/12 bg-white/10 px-4 py-3">
      <p className="text-xs font-medium text-white/62">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

function HeroBreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2">
      <p className="text-xs font-semibold text-white/65">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function ActionSummaryCard({ task }: { task: DashboardTask }) {
  return (
    <div className="mt-5 rounded-[16px] border border-[#DDE8E5] bg-[#F6FAF9] p-4">
      <p className="font-bold leading-5 text-[#0F172A]">{task.task}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{task.reason}</p>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <TaskFact label="表示上の注意" value={task.expectedImpact} />
        <TaskFact label="確認する内容" value={task.action} />
      </div>
    </div>
  );
}

function EmptyDashboardState({ message }: { message: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#DDE8E5] bg-[#F6FAF9] p-5 text-sm leading-6 text-[#64748B]">
      {message}
    </div>
  );
}

function EmptyStateBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#DDE8E5] bg-[#F6FAF9] p-6 text-center">
      <p className="text-sm font-bold text-[#0F172A]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
  );
}

function DashboardAlertStrip() {
  return (
    <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-3">
      {dashboardAlerts.map((alert) => (
        <Link
          key={alert.title}
          href={alert.href}
          className={cn(
            "group min-w-0 rounded-[18px] border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2",
            alert.tone === "rose" && "border-rose-200 bg-rose-50/60",
            alert.tone === "amber" && "border-amber-200 bg-amber-50/70",
            alert.tone === "blue" && "border-[#DDE8E5] bg-[#E6F4F1]/80"
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  alert.tone === "rose" && "text-rose-900",
                  alert.tone === "amber" && "text-amber-900",
                  alert.tone === "blue" && "text-[#005C50]"
                )}
              >
                {alert.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{alert.description}</p>
            </div>
            <ArrowRight
              aria-hidden="true"
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5",
                alert.tone === "rose" && "text-rose-600",
                alert.tone === "amber" && "text-amber-600",
                alert.tone === "blue" && "text-[#00796B]"
              )}
            />
          </div>
          <span
            className={cn(
              "mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
              alert.tone === "rose" && "bg-white text-rose-700",
              alert.tone === "amber" && "bg-white text-amber-700",
              alert.tone === "blue" && "bg-white text-[#00796B]"
            )}
          >
            {alert.action}
          </span>
        </Link>
      ))}
    </div>
  );
}

function DashboardKpiGrid({ cards }: { cards: DashboardKpiCardData[] }) {
  return (
    <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          helper={card.helper}
          delta={card.delta}
          deltaLabel={card.deltaLabel}
          tone={card.tone}
          sparkline={card.sparkline}
        />
      ))}
    </div>
  );
}

function VisibilityTrendCard({ dashboardView }: { dashboardView?: DashboardHomeViewModel }) {
  const view = dashboardView ?? createEmptyDashboardHomeViewModel();
  const homeView = view.homeReadModel;
  const hasTrendData = homeView.trendBars.length > 0;

  return (
    <DataCard
      title="観測量の推移"
      description={hasTrendData ? "有効観測数などのcount系推移です。比較条件は注意付きで確認します。" : "追加測定後にcount系推移を表示します。"}
      action={
        <Link href={`${reportBase}/trends`} className="text-xs font-semibold text-[#00796B]">
          詳細
        </Link>
      }
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0 rounded-[18px] border border-[#DDE8E5] bg-[#F6FAF9] p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#64748B]">有効観測数の推移</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-[#0F172A]">{homeView.validObservationCount}</p>
            </div>
            <Badge variant="outline" className="w-fit whitespace-nowrap rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-[#B7791F]">
              count系のみ
            </Badge>
          </div>
          {hasTrendData ? (
            <CurrentValueBars values={homeView.trendBars} max={homeView.trendMax} />
          ) : (
            <div className="mt-5">
              <EmptyDashboardState message="追加測定後にcount系推移を表示します。" />
            </div>
          )}
          <p className="mt-4 text-sm leading-6 text-[#64748B]">
            AI可視性や競合差分の推移はP0では表示していません。
          </p>
        </div>
        <div className="grid min-w-0 gap-3 content-start">
          <DashboardScopeRow label="集計対象期間" value={homeView.aggregationPeriod} tone="slate" />
          <DashboardScopeRow label="完了済み測定数" value={homeView.completedMeasurementCount} tone="blue" />
          <DashboardScopeRow label="参照出現数" value={homeView.citationOccurrenceCount} tone="green" />
          {homeView.trendRows.map((row) => (
            <DashboardScopeRow key={row.label} label={row.label} value={row.value} tone="slate" />
          ))}
        </div>
      </div>
    </DataCard>
  );
}

function CurrentValueBars({ values, max }: { values: number[]; max: number }) {
  return (
    <div className="mt-5 flex h-44 items-end gap-2 rounded-[16px] border border-[#DDE8E5] bg-white p-4">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-lg bg-[#E6F4F1]">
            <div
              className="w-full rounded-lg bg-[#00796B]"
              style={{ height: value > 0 ? `${Math.max(6, Math.min((value / Math.max(1, max)) * 100, 100))}%` : "0%" }}
            />
          </div>
          <span className="text-[10px] font-semibold text-[#64748B]">{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function NextActionsCard({ tasks = [] }: { tasks?: DashboardTask[] }) {
  return (
    <DataCard
      title="確認する改善候補"
      description="表示候補です。承認済み施策や効果保証ではありません。"
      action={
        <Link href={`${reportBase}/action-plan`} className="text-xs font-semibold text-[#00796B]">
          改善候補へ
        </Link>
      }
    >
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.slice(0, 3).map((task, index) => (
            <div key={task.task} className="rounded-[16px] border border-[#DDE8E5] bg-[#F6FAF9] p-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00796B] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">{task.task}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748B]">{task.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <PriorityPill value={task.priority} />
                    <Badge variant="outline" className="whitespace-nowrap rounded-full border-emerald-200 bg-emerald-50 text-[#008F72]">
                      {task.expectedImpact}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyDashboardState message="現在表示できる改善候補はありません。" />
        )}
      </div>
    </DataCard>
  );
}

function QuickLinksCard() {
  return (
    <DataCard title="関連画面への導線" description="原因調査と改善実行に進む">
      <div className="space-y-2">
        {dashboardQuickLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group flex min-w-0 items-center justify-between gap-3 rounded-[16px] border border-[#DDE8E5] bg-white px-4 py-3 transition hover:border-[#00796B]/25 hover:bg-[#E6F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">{link.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{link.description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#00796B] transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </DataCard>
  );
}

function RecentConversationsCard() {
  return (
    <DataCard
      title="最近のAI回答ログ"
      description="直近で分析した回答とブランド表示状況"
      action={
        <Link href={`${reportBase}/conversations`} className="text-xs font-semibold text-[#00796B]">
          すべて見る
        </Link>
      }
    >
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>トピック</TableHead>
            <TableHead>AIモデル</TableHead>
            <TableHead>表示状況</TableHead>
            <TableHead>参照元</TableHead>
            <TableHead>要約</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.slice(0, 4).map((conversation) => (
            <TableRow key={conversation.id}>
              <TableCell className="whitespace-nowrap font-medium">{getTopicName(conversation.topicId)}</TableCell>
              <TableCell className="whitespace-nowrap">{getModelName(conversation.modelId)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "whitespace-nowrap rounded-sm",
                    conversation.recoraMentioned
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                >
                  {conversation.recoraMentioned ? `表示 ${conversation.recoraRank ?? "-"}位` : "未表示"}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-slate-600">{conversation.citedDomains.length}件</TableCell>
              <TableCell className="max-w-[280px] truncate text-slate-600">{conversation.answerSummary}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataCard>
  );
}

function RecentSourceChangesCard() {
  return (
    <DataCard
      title="最近の参照元の変化"
      description="AI回答で参照されたドメインの動き"
      action={
        <Link href={`${reportBase}/sources`} className="text-xs font-semibold text-[#00796B]">
          参照元分析へ
        </Link>
      }
    >
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>ドメイン</TableHead>
            <TableHead>種別</TableHead>
            <TableHead className="text-right">出現数</TableHead>
            <TableHead className="text-right">参照シェア</TableHead>
            <TableHead>推奨アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.slice(0, 5).map((source) => (
            <TableRow key={source.domain}>
              <TableCell className="whitespace-nowrap font-medium">{source.domain}</TableCell>
              <TableCell className="whitespace-nowrap text-slate-600">{source.type}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold">{source.appearances}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold text-[#00796B]">
                {source.citationShare}%
              </TableCell>
              <TableCell className="max-w-[260px] truncate text-slate-600">{source.recommendedAction}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataCard>
  );
}

function DashboardScopeRow({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "slate" }) {
  return (
    <div className="rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <p className="text-xs font-semibold text-[#64748B]">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight",
          tone === "blue" && "text-[#00796B]",
          tone === "green" && "text-[#008F72]",
          tone === "slate" && "text-[#0F172A]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReportsIndexPage({ dashboardData = null }: { dashboardData?: RecoraDashboardDbData | null }) {
  const dashboardView = createDashboardHomeViewModel(dashboardData, null);
  const projectSlug = dashboardData?.project?.slug ?? currentReportSlug;
  const reportHref = `/dashboard/reports/${projectSlug}`;
  const hasReport = Boolean(dashboardData?.project);
  const reportRows = hasReport
    ? [{
        id: projectSlug,
        name: dashboardView.projectName,
        period: dashboardView.period,
        lastUpdated: dashboardView.lastUpdated,
        aiVisibility: dashboardView.brandVisibilityValue,
        aiAnswers: formatNullableCount(dashboardView.aiConversationCount),
        recommendations: formatNullableCount(dashboardData?.recommendations.length),
        href: reportHref
      }]
    : [];

  return (
    <div className="min-w-0 space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F4F1] px-4 py-2 text-xs font-bold text-[#005C50]">
              <FileText className="h-3.5 w-3.5" />
              レポート一覧
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-normal text-[#073F39] sm:text-4xl">
              最新レポートから詳細確認へ進む
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#475569]">
              ホームで見た最新状況を、選択した1レポートのAI回答・ブランド比較・参照元・改善候補へつなげます。
            </p>
          </div>
          <div className="rounded-[22px] border border-[#DDE8E5] bg-[#F6FAF9] p-4">
            <p className="text-xs font-bold text-[#64748B]">表示中プロジェクト</p>
            <p className="mt-2 text-2xl font-bold tracking-normal text-[#0F172A]">{dashboardView.projectName}</p>
            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              レポート詳細タブは、ここでレポートを選択した後に表示されます。
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="AI表示率" value={dashboardView.brandVisibilityValue} helper="最新レポートの観測値" />
        <MetricTile label="AI回答数" value={formatNullableCount(dashboardData?.counts.aiConversations)} helper="最新レポート内" />
        <MetricTile label="比較ブランド数" value={formatNullableCount(dashboardData?.brands.filter((item) => item.brand_type === "competitor").length)} helper="DBに登録された比較対象" tone="slate" />
        <MetricTile label="改善候補数" value={formatNullableCount(dashboardData?.recommendations.length)} helper="承認済み施策ではありません" tone="amber" />
      </div>

      <DataCard
        title="レポート"
        description="既存DBから取得できるレポートを表示します。測定がない場合は追加測定後に表示されます。"
      >
        {reportRows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">レポート</TableHead>
                  <TableHead>対象期間</TableHead>
                  <TableHead>AI表示率</TableHead>
                  <TableHead>AI回答数</TableHead>
                  <TableHead>改善候補</TableHead>
                  <TableHead>最終更新</TableHead>
                  <TableHead className="text-right">詳細</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-[220px]">
                      <div className="font-bold text-slate-950">{row.name}</div>
                      <div className="mt-1 text-xs text-slate-500">最新レポート</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{row.period}</TableCell>
                    <TableCell className="whitespace-nowrap font-bold text-[#00796B]">{row.aiVisibility}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.aiAnswers}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.recommendations}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={row.href}>
                          レポート概要へ
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyStateBlock
            title="表示できるレポートがありません"
            description="測定が完了すると、ここから選択レポートの詳細へ進めます。"
          />
        )}
      </DataCard>
    </div>
  );
}

type ReportOverviewDataBundle = {
  dashboardData: RecoraDashboardDbData | null;
  leaderboardData: RecoraLeaderboardDbData | null;
};

type ReportOverviewStat = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

type ReportOverviewSourceRow = {
  domain: string;
  sourceTypeLabel: string;
  occurrenceCount: number;
  occurrenceValue: string;
  share: number;
};

type ReportOverviewSourceSummary = {
  citationOccurrenceValue: string;
  citationUrlValue: string;
  sourceDomainValue: string;
  ownedShareValue: string;
  needsReviewValue: string;
};

type ReportOverviewNextLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type ReportOverviewAudienceRow = {
  id: string;
  name: string;
  displayAnswerCount: number;
  totalAnswerCount: number;
  displayRate: number;
  displayAnswerValue: string;
  totalAnswerValue: string;
};

type ReportOverviewInsight = {
  title: string;
  value: string;
  description: string;
  href: string;
  tone: "green" | "amber" | "slate";
};

type ReportOverviewViewModel = {
  hasReportData: boolean;
  reportBase: string;
  projectName: string;
  period: string;
  periodLabel: string;
  periodHelper: string;
  comparisonPeriod: string;
  lastUpdated: string;
  primaryBrandName: string;
  aiVisibilityValue: string;
  aiVisibilityNumber: number | null;
  summaryStats: ReportOverviewStat[];
  positionSummary: {
    rankValue: string;
    competitorGapValue: string;
    shareOfVoiceValue: string;
    averagePositionValue: string;
    topCompetitorName: string;
    topCompetitorVisibilityValue: string;
  };
  leaderboardRows: DashboardRankingRow[];
  sourceRows: ReportOverviewSourceRow[];
  sourceSummary: ReportOverviewSourceSummary;
  personaRows: ReportOverviewAudienceRow[];
  topicRows: ReportOverviewAudienceRow[];
  strongestPersonaRows: ReportOverviewAudienceRow[];
  weakestPersonaRows: ReportOverviewAudienceRow[];
  strongestTopicRows: ReportOverviewAudienceRow[];
  weakestTopicRows: ReportOverviewAudienceRow[];
  insightLinks: ReportOverviewInsight[];
  detailLinks: ReportOverviewNextLink[];
};

export async function ReportLandingPage({ projectSlug = currentReportSlug }: { projectSlug?: string } = {}) {
  const overviewData = await getReportOverviewData(projectSlug);

  return <ReportOverviewTab data={overviewData} projectSlug={projectSlug} />;
}

export async function OverviewPage({ projectSlug = currentReportSlug }: { projectSlug?: string } = {}) {
  const overviewData = await getReportOverviewData(projectSlug);

  return <ReportOverviewTab data={overviewData} projectSlug={projectSlug} />;
}

async function getReportOverviewData(projectSlug = currentReportSlug): Promise<ReportOverviewDataBundle> {
  const [dashboardData, leaderboardData] = await Promise.all([
    safelyLoadReportData("dashboard", () => getRecoraDashboardData(projectSlug)),
    safelyLoadReportData("leaderboard", () => getRecoraLeaderboardData(projectSlug))
  ]);

  return {
    dashboardData,
    leaderboardData
  };
}

async function safelyLoadReportData<T extends { project: unknown | null }>(
  label: string,
  loader: () => Promise<T>
): Promise<T | null> {
  try {
    const data = await loader();
    return data.project ? data : null;
  } catch (error) {
    console.warn(`Failed to load Recora report overview ${label} data.`, getSafeReportDataError(error));
    return null;
  }
}

function getSafeReportDataError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      message: typeof record.message === "string" ? record.message : undefined,
      details: typeof record.details === "string" ? record.details : undefined
    };
  }

  return { message: String(error) };
}

function createReportOverviewViewModel(data: ReportOverviewDataBundle, projectSlug = currentReportSlug): ReportOverviewViewModel {
  const dashboardData = data.dashboardData;
  const leaderboardData = data.leaderboardData;
  const leaderboardView = createLeaderboardViewModel(leaderboardData);
  const dashboardProject = dashboardData?.project ?? null;
  const leaderboardProject = leaderboardData?.project ?? null;
  const project = dashboardProject ?? leaderboardProject;
  const latestRun = dashboardData?.latestRun ?? leaderboardData?.latestRun ?? null;
  const brands = dashboardData?.brands.length ? dashboardData.brands : leaderboardData?.brands ?? [];
  const primaryBrand = brands.find((item) => item.brand_type === "primary") ?? brands[0] ?? null;
  const dashboardSnapshots = dashboardData?.metricSnapshots ?? [];
  const leaderboardSnapshots = leaderboardData?.metricSnapshots ?? [];
  const brandSnapshots = dashboardSnapshots.length > 0
    ? dashboardSnapshots.filter((snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id)
    : leaderboardSnapshots.filter((snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id);
  const projectSnapshot = dashboardSnapshots.find((snapshot) => snapshot.scope_type === "project") ?? null;
  const primarySnapshot = brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ?? null;
  const primaryRankingRow = leaderboardView.rankingRows.find((row) => row.isPrimary) ?? null;
  const aiVisibilityNumber = getRoundedNumber(primarySnapshot?.ai_visibility ?? projectSnapshot?.ai_visibility)
    ?? (typeof primaryRankingRow?.visibility === "number" ? primaryRankingRow.visibility : null);
  const competitorCount = brands.length > 0 ? brands.filter((item) => item.brand_type === "competitor").length : null;
  const aiAnswerCount = leaderboardData?.conversations.length ?? dashboardData?.counts.aiConversations ?? null;
  const brandDisplayedAnswerCount = getPrimaryBrandDisplayedAnswerCount(leaderboardData, primaryBrand?.id);
  const brandMentionCount = getRoundedNumber(primarySnapshot?.ai_mention_count ?? projectSnapshot?.ai_mention_count) ?? primaryRankingRow?.aiMentionCount ?? null;
  const citationOccurrenceCount = getReportCitationOccurrenceCount(leaderboardData);
  const citationUrlCount = getReportCitationUrlCount(leaderboardData);
  const sourceDomainCount = getReportSourceDomainCount(leaderboardData);
  const sourceToClaimNeedsReviewCount = getReportSourceToClaimNeedsReviewCount(leaderboardData);
  const ownedCitationShare = getReportOwnedCitationShare(leaderboardData);
  const sourceRows = createReportOverviewSourceRows(leaderboardData);
  const personaRows = createReportOverviewAudienceRows(leaderboardData, primaryBrand?.id, "persona");
  const topicRows = createReportOverviewAudienceRows(leaderboardData, primaryBrand?.id, "topic");
  const currentReportBase = `/dashboard/reports/${projectSlug}`;
  const reportDateScope = getReportDateScope(latestRun?.period_start, latestRun?.period_end, project?.default_period);
  const primaryRankIndex = leaderboardView.rankingRows.findIndex((row) => row.isPrimary);
  const topCompetitorRow = leaderboardView.rankingRows.find((row) => !row.isPrimary) ?? null;
  const strongestPersonaRows = getStrongestAudienceRows(personaRows);
  const weakestPersonaRows = getWeakestAudienceRows(personaRows);
  const strongestTopicRows = getStrongestAudienceRows(topicRows);
  const weakestTopicRows = getWeakestAudienceRows(topicRows);
  const positionSummary = {
    rankValue: primaryRankIndex >= 0 ? `${primaryRankIndex + 1}位` : "-",
    competitorGapValue: primaryRankingRow ? formatSignedPt(primaryRankingRow.competitiveGap) : "-",
    shareOfVoiceValue: primaryRankingRow ? formatReportOverviewPercent(primaryRankingRow.citationShare) : "-",
    averagePositionValue: typeof primaryRankingRow?.averagePosition === "number" ? primaryRankingRow.averagePosition.toFixed(1) : "-",
    topCompetitorName: topCompetitorRow?.name ?? "比較ブランドなし",
    topCompetitorVisibilityValue: topCompetitorRow ? formatReportOverviewPercent(topCompetitorRow.visibility) : "-"
  };
  const sourceSummary = {
    citationOccurrenceValue: formatReportOverviewCount(citationOccurrenceCount),
    citationUrlValue: formatReportOverviewCount(citationUrlCount),
    sourceDomainValue: formatReportOverviewCount(sourceDomainCount),
    ownedShareValue: formatReportOverviewPercent(ownedCitationShare),
    needsReviewValue: formatReportOverviewCount(sourceToClaimNeedsReviewCount)
  };

  return {
    hasReportData: Boolean(project),
    reportBase: currentReportBase,
    projectName: project?.name ?? "Recora",
    period: reportDateScope.value,
    periodLabel: reportDateScope.label,
    periodHelper: reportDateScope.helper,
    comparisonPeriod: formatReportPeriod(latestRun?.comparison_start, latestRun?.comparison_end),
    lastUpdated: formatDateTime(latestRun?.completed_at ?? project?.updated_at),
    primaryBrandName: primaryBrand?.name ?? leaderboardView.primaryBrandName,
    aiVisibilityValue: formatReportOverviewPercent(aiVisibilityNumber),
    aiVisibilityNumber,
    summaryStats: [
      { label: "AI回答数", value: formatReportOverviewCount(aiAnswerCount), helper: "取得できたAI回答", icon: Search },
      { label: "ブランド表示回答数", value: formatReportOverviewCount(brandDisplayedAnswerCount), helper: "ブランドが表示された回答", icon: ShieldCheck },
      { label: "ブランド言及数", value: formatReportOverviewCount(brandMentionCount), helper: "AI回答内での言及回数", icon: Activity },
      { label: "参照出現数", value: formatReportOverviewCount(citationOccurrenceCount), helper: "AI回答で参照として出現", icon: ExternalLink },
      { label: "参照URL数", value: formatReportOverviewCount(citationUrlCount), helper: "ユニークURL数", icon: FileText },
      { label: "参照ドメイン数", value: formatReportOverviewCount(sourceDomainCount), helper: "ユニークドメイン数", icon: BarChart3 }
    ],
    positionSummary,
    leaderboardRows: leaderboardView.rankingRows.slice(0, 5),
    sourceRows,
    sourceSummary,
    personaRows,
    topicRows,
    strongestPersonaRows,
    weakestPersonaRows,
    strongestTopicRows,
    weakestTopicRows,
    insightLinks: createReportOverviewInsights({
      reportBase: currentReportBase,
      weakestPersonaRows,
      weakestTopicRows,
      sourceToClaimNeedsReviewCount,
      positionSummary,
      competitorCount
    }),
    detailLinks: [
      {
        title: "AI回答",
        description: "実際の回答内でブランドがどう扱われたかを見る",
        href: `/dashboard/reports/${projectSlug}/conversations`,
        icon: Search
      },
      {
        title: "ブランド比較",
        description: "比較ブランド内での見え方を確認する",
        href: `/dashboard/reports/${projectSlug}/leaderboard`,
        icon: BarChart3
      },
      {
        title: "参照元",
        description: "AI回答が参照した情報源を確認する",
        href: `/dashboard/reports/${projectSlug}/sources`,
        icon: ExternalLink
      },
      {
        title: "改善候補",
        description: "観測結果から次に確認すべき候補を見る",
        href: `/dashboard/reports/${projectSlug}/recommendations`,
        icon: ListChecks
      }
    ]
  };
}

function getStrongestAudienceRows(rows: ReportOverviewAudienceRow[]) {
  return rows.slice(0, 3);
}

function getWeakestAudienceRows(rows: ReportOverviewAudienceRow[]) {
  return [...rows]
    .filter((row) => row.totalAnswerCount > 0)
    .sort((a, b) => a.displayRate - b.displayRate || a.displayAnswerCount - b.displayAnswerCount || a.name.localeCompare(b.name))
    .slice(0, 3);
}

function createReportOverviewInsights({
  reportBase,
  weakestPersonaRows,
  weakestTopicRows,
  sourceToClaimNeedsReviewCount,
  positionSummary,
  competitorCount
}: {
  reportBase: string;
  weakestPersonaRows: ReportOverviewAudienceRow[];
  weakestTopicRows: ReportOverviewAudienceRow[];
  sourceToClaimNeedsReviewCount: number | null;
  positionSummary: ReportOverviewViewModel["positionSummary"];
  competitorCount: number | null;
}): ReportOverviewInsight[] {
  const weakestTopic = weakestTopicRows[0];
  const weakestPersona = weakestPersonaRows[0];

  return [
    {
      title: "AI回答を確認",
      value: weakestTopic ? `${weakestTopic.name} ${formatReportOverviewPercent(weakestTopic.displayRate)}` : "回答ログ",
      description: weakestTopic
        ? "表示率が低いトピックの回答本文と、未表示の文脈を確認します。"
        : "回答本文と参照状態を回答単位で確認します。",
      href: `${reportBase}/conversations`,
      tone: weakestTopic && weakestTopic.displayRate < 50 ? "amber" : "slate"
    },
    {
      title: "ブランド差を確認",
      value: competitorCount && competitorCount > 0 ? positionSummary.competitorGapValue : "比較対象なし",
      description: competitorCount && competitorCount > 0
        ? `${positionSummary.topCompetitorName} との表示率差、平均順位、同時出現を見ます。`
        : "比較ブランドが登録されると、回答内の相対的な位置が確認できます。",
      href: `${reportBase}/leaderboard`,
      tone: competitorCount && competitorCount > 0 ? "green" : "slate"
    },
    {
      title: "参照元を確認",
      value: sourceToClaimNeedsReviewCount === null ? "-" : `${sourceToClaimNeedsReviewCount}件`,
      description: "参照URLが回答内の主張を支えているか、source-to-claim状態を確認します。",
      href: `${reportBase}/sources`,
      tone: sourceToClaimNeedsReviewCount && sourceToClaimNeedsReviewCount > 0 ? "amber" : "green"
    },
    {
      title: "改善候補を判断",
      value: weakestPersona ? weakestPersona.name : "候補一覧",
      description: "候補の重要度、根拠、確認状態を見て、次に検証する施策を選びます。",
      href: `${reportBase}/recommendations`,
      tone: "slate"
    }
  ];
}

function ReportOverviewTab({ data, projectSlug = currentReportSlug }: { data: ReportOverviewDataBundle; projectSlug?: string }) {
  const view = createReportOverviewViewModel(data, projectSlug);

  return (
    <div className="min-w-0 space-y-5">
      <ReportOverviewHero view={view} />

      <ReportOverviewDecisionStrip insights={view.insightLinks} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <ReportOverviewPositionPanel view={view} />
        <ReportOverviewSourceHealth view={view} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <ReportOverviewAudienceStrengthGrid view={view} />
        <ReportOverviewLeaderboard view={view} />
      </div>

      <ReportOverviewSources view={view} />

      <ReportOverviewMetricDictionary />

      <ReportOverviewNextSteps links={view.detailLinks} />
    </div>
  );
}

function ReportOverviewDecisionStrip({ insights }: { insights: ReportOverviewInsight[] }) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-4 shadow-[0_14px_42px_rgba(15,23,42,0.07)] sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#00796B]">next checks</p>
          <h2 className="mt-1 text-lg font-bold text-[#0F172A]">概要から詳しく見る場所</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[#64748B]">
          AI回答、競合差、参照元、改善候補を分けて確認します。同じ数字を違う意味で使わないため、各画面の役割を固定しています。
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <Link
            key={insight.title}
            href={insight.href}
            className={cn(
              "group rounded-[18px] border p-4 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2",
              insight.tone === "green" && "border-[#BFE4DC] bg-[#E6F4F1]/75",
              insight.tone === "amber" && "border-amber-200 bg-amber-50/80",
              insight.tone === "slate" && "border-slate-200 bg-slate-50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#64748B]">{insight.title}</p>
                <p className="mt-2 truncate text-xl font-bold tracking-normal text-[#0F172A]" title={insight.value}>{insight.value}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#00796B] transition group-hover:translate-x-0.5" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#475569]">{insight.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ReportOverviewPositionPanel({ view }: { view: ReportOverviewViewModel }) {
  const rows = [
    { label: "ブランド順位", value: view.positionSummary.rankValue, helper: "このレポート内の観測順位" },
    { label: "競合差", value: view.positionSummary.competitorGapValue, helper: `${view.positionSummary.topCompetitorName} とのAI表示率差` },
    { label: "Share of Voice", value: view.positionSummary.shareOfVoiceValue, helper: "ブランド言及に占める比率" },
    { label: "平均順位", value: view.positionSummary.averagePositionValue, helper: "表示された回答内の平均位置" }
  ];

  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-bold text-[#00796B]">ブランド比較</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F172A]">競合との位置関係</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          表示率、Share of Voice、平均順位を分けて見ます。市場シェアや外部ランキングではありません。
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-[18px] border border-[#E3ECE9] bg-[#F6FAF9] px-4 py-4">
            <p className="text-xs font-bold text-[#64748B]">{row.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-normal text-[#0F172A]">{row.value}</p>
            <p className="mt-1 text-xs leading-5 text-[#64748B]">{row.helper}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        最も近い比較対象: <span className="font-bold text-slate-950">{view.positionSummary.topCompetitorName}</span>
        <span className="ml-2 text-slate-500">AI表示率 {view.positionSummary.topCompetitorVisibilityValue}</span>
      </div>
    </section>
  );
}

function ReportOverviewSourceHealth({ view }: { view: ReportOverviewViewModel }) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-bold text-[#00796B]">参照元</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F172A]">情報源としての状態</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          出現回数、URL数、ドメイン数、source-to-claimの確認状態を分けて確認します。
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SourceHealthMetric label="参照出現数" value={view.sourceSummary.citationOccurrenceValue} helper="occurrence_count合計" />
        <SourceHealthMetric label="参照URL数" value={view.sourceSummary.citationUrlValue} helper="canonical/urlのユニーク数" />
        <SourceHealthMetric label="参照ドメイン数" value={view.sourceSummary.sourceDomainValue} helper="domainのユニーク数" />
        <SourceHealthMetric label="自社参照シェア" value={view.sourceSummary.ownedShareValue} helper="自社/対象ブランド関連の比率" />
      </div>
      <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50/75 px-4 py-3">
        <p className="text-sm font-bold text-amber-900">source-to-claim 要確認: {view.sourceSummary.needsReviewValue}</p>
        <p className="mt-1 text-sm leading-6 text-amber-900/75">
          URLが出ていることと、回答内の主張を支えていることは別です。顧客向けに使う前に確認します。
        </p>
      </div>
    </section>
  );
}

function SourceHealthMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[18px] border border-[#E3ECE9] bg-[#F6FAF9] px-4 py-4">
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-normal text-[#0F172A]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">{helper}</p>
    </div>
  );
}

function ReportOverviewAudienceStrengthGrid({ view }: { view: ReportOverviewViewModel }) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-bold text-[#00796B]">ペルソナ・トピック</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F172A]">強い領域と弱い領域</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          表示回答数を分母つきで見ます。サンプル数が少ない領域は、改善候補ではなく確認対象として扱います。
        </p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AudienceStrengthColumn title="強いペルソナ" rows={view.strongestPersonaRows} tone="green" />
        <AudienceStrengthColumn title="要確認ペルソナ" rows={view.weakestPersonaRows} tone="amber" />
        <AudienceStrengthColumn title="強いトピック" rows={view.strongestTopicRows} tone="green" />
        <AudienceStrengthColumn title="要確認トピック" rows={view.weakestTopicRows} tone="amber" />
      </div>
    </section>
  );
}

function AudienceStrengthColumn({
  title,
  rows,
  tone
}: {
  title: string;
  rows: ReportOverviewAudienceRow[];
  tone: "green" | "amber";
}) {
  return (
    <div className={cn("rounded-[18px] border p-4", tone === "green" ? "border-[#BFE4DC] bg-[#F6FAF9]" : "border-amber-200 bg-amber-50/65")}>
      <p className={cn("text-xs font-bold", tone === "green" ? "text-[#00796B]" : "text-amber-800")}>{title}</p>
      <div className="mt-3 space-y-3">
        {rows.length > 0 ? rows.map((row) => (
          <div key={`${title}-${row.id}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0F172A]" title={row.name}>{row.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                  表示回答 {row.displayAnswerValue} / AI回答 {row.totalAnswerValue}
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold tracking-normal text-[#0F172A]">{formatReportOverviewPercent(row.displayRate)}</p>
            </div>
            <ProgressBar value={row.displayRate} className="mt-2" tone={tone === "green" ? "green" : "amber"} />
          </div>
        )) : (
          <p className="text-sm leading-6 text-[#64748B]">表示できる測定データがありません。</p>
        )}
      </div>
    </div>
  );
}

function ReportOverviewMetricDictionary() {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-bold text-[#00796B]">metric contract</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F172A]">このレポートで使う指標定義</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          画面上の数字は、取得元と数え方を分けて表示します。metric snapshot、回答ログ、citation row、occurrence countを混同しません。
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {recoraMetricDefinitions.map((metric) => (
          <div key={metric.key} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <p className="font-bold text-[#0F172A]">{metric.label}</p>
              <span className="w-fit rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#64748B]">{metric.source}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#475569]">{metric.definition}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportOverviewHero({ view }: { view: ReportOverviewViewModel }) {
  const heroStats: ReportOverviewStat[] = [
    { label: view.periodLabel, value: view.period, helper: view.periodHelper, icon: FileText },
    { label: "最終更新", value: view.lastUpdated, helper: "測定データの更新時刻", icon: RefreshCw },
    ...view.summaryStats
  ];

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#DDE8E5] bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,0.10)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#00796B] px-3.5 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,121,107,0.20)]">
          <ShieldCheck className="h-4 w-4" />
          レポート概要
        </div>
        <div className="flex flex-wrap gap-2">
          <HeaderActions />
        </div>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-[#DDE8E5] bg-[radial-gradient(circle_at_8%_100%,rgba(230,244,241,0.86),rgba(255,255,255,0)_38%),linear-gradient(135deg,#FFFFFF_0%,#FFFFFF_56%,#F7FCFB_100%)] p-5 shadow-inner sm:p-7">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(260px,320px)_minmax(380px,0.9fr)] xl:items-center">
          <div className="min-w-0">
            <div className="inline-flex rounded-full bg-[#E6F4F1] px-4 py-2 text-xs font-bold text-[#005C50]">
              このレポート内の観測値
            </div>
            <h1 className="mt-7 max-w-xl text-2xl font-bold leading-tight tracking-normal text-[#073F39] sm:text-3xl">
              AI回答内でのブランド存在感
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#475569]">
              公式スコアや市場シェアではなく、選択中レポートのAI回答内で観測された表示率です。
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#DDE8E5] bg-white/75 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-bold text-[#64748B]">プロジェクト</p>
                <p className="mt-1 truncate text-sm font-bold text-[#0F172A]">{view.projectName}</p>
              </div>
              <div className="rounded-2xl border border-[#DDE8E5] bg-white/75 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-bold text-[#64748B]">対象ブランド</p>
                <p className="mt-1 truncate text-sm font-bold text-[#0F172A]">{view.primaryBrandName}</p>
              </div>
            </div>
          </div>

          <ReportOverviewGauge value={view.aiVisibilityNumber} label={view.aiVisibilityValue} />

          <div className="grid gap-3 sm:grid-cols-2">
            {heroStats.map((stat) => (
              <ReportOverviewHeroMetric key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
        {!view.hasReportData ? (
          <div className="mt-5 rounded-[16px] border border-[#DDE8E5] bg-white/80 p-4 text-sm leading-6 text-[#64748B]">
            レポートデータを取得できませんでした。測定完了後に、このレポートの要点が表示されます。
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReportOverviewGauge({ value, label }: { value: number | null; label: string }) {
  const normalizedValue = value === null ? 0 : Math.max(0, Math.min(value, 100));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="mx-auto flex w-full max-w-[320px] flex-col items-center">
      <div className="relative h-64 w-64 sm:h-72 sm:w-72">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="report-overview-gauge" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#5ED6B2" />
              <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#EEF3F1"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#report-overview-gauge)"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-6xl font-bold tracking-normal text-[#073F39] sm:text-7xl">{label}</p>
          <p className="mt-2 text-sm font-semibold text-[#64748B]">AI表示率</p>
        </div>
      </div>
      <div className="mt-2 flex w-full max-w-[260px] items-center gap-3">
        <span className="text-xs font-bold text-[#64748B]">低</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EFED]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6FE1C3] to-[#00796B]"
            style={{ width: `${normalizedValue}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[#64748B]">高</span>
      </div>
      {value === null ? (
        <p className="mt-3 text-center text-xs leading-5 text-[#64748B]">測定データが揃うと表示されます。</p>
      ) : null}
    </div>
  );
}

function ReportOverviewHeroMetric({ stat }: { stat: ReportOverviewStat }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-[18px] border border-[#E3ECE9] bg-white/90 px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6F4F1] text-[#00796B]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#00796B]">{stat.label}</p>
          <p className="mt-1 text-xl font-bold tracking-normal text-[#0F172A]">{stat.value}</p>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">{stat.helper}</p>
        </div>
      </div>
    </div>
  );
}

function ReportOverviewAudienceRanking({
  title,
  description,
  rows,
  emptyTitle,
  emptyDescription
}: {
  title: string;
  description: string;
  rows: ReportOverviewAudienceRow[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-bold text-[#00796B]">表示ランキング</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F172A]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length > 0 ? rows.map((row, index) => (
          <div key={row.id} className="rounded-[18px] border border-[#E3ECE9] bg-[#F6FAF9] px-4 py-3">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", index === 0 ? "bg-[#005C50] text-white" : "bg-white text-[#64748B]")}>{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0F172A]">{row.name}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">表示回答 {row.displayAnswerValue} / AI回答 {row.totalAnswerValue}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold tracking-normal text-[#0F172A]">{formatReportOverviewPercent(row.displayRate)}</p>
                <p className="text-xs font-semibold text-[#64748B]">表示率</p>
              </div>
            </div>
            <ProgressBar value={row.displayRate} className="mt-3" tone={index === 0 ? "blue" : "green"} />
          </div>
        )) : (
          <EmptyStateBlock title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </section>
  );
}

function ReportOverviewLeaderboard({ view }: { view: ReportOverviewViewModel }) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold text-[#00796B]">ブランド比較</p>
          <h2 className="mt-1 text-lg font-bold text-[#0F172A]">比較ブランド内でのポジション</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            このレポート内の観測順位です。公式順位や市場シェアではありません。
          </p>
        </div>
        <Link href={`${view.reportBase}/leaderboard`} className="inline-flex items-center gap-1 text-sm font-bold text-[#00796B] hover:text-[#005C50]">
          ブランド比較へ
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {view.leaderboardRows.length > 0 ? view.leaderboardRows.map((row, index) => (
          <div
            key={row.brandId}
            className={cn(
              "rounded-[18px] border border-transparent bg-white px-4 py-3",
              row.isPrimary && "border-[#BFE4DC] bg-[#E6F4F1]/75"
            )}
          >
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", index === 0 ? "bg-[#005C50] text-white" : "bg-white text-[#64748B]")}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate font-bold text-[#0F172A]">{row.name}</p>
                    {row.isPrimary ? <Badge className="bg-[#00796B] text-white">自社</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#64748B]">
                    表示回答 {formatReportOverviewCount(row.displayAnswerCount)} / ブランド言及 {formatReportOverviewCount(row.aiMentionCount)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold tracking-normal text-[#0F172A]">{formatReportOverviewPercent(row.visibility)}</p>
                <p className="text-xs font-semibold text-[#64748B]">AI表示率</p>
              </div>
            </div>
            <ProgressBar value={row.visibility} className="mt-3" tone={row.isPrimary ? "blue" : "slate"} />
          </div>
        )) : (
          <EmptyStateBlock title="まだブランドランキングを表示できません" description="測定データが揃うと、このレポート内の上位ブランドが表示されます。" />
        )}
      </div>
    </section>
  );
}

function ReportOverviewSources({ view }: { view: ReportOverviewViewModel }) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold text-[#00796B]">参照元</p>
          <h2 className="mt-1 text-lg font-bold text-[#0F172A]">よく参照されている情報源</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            このレポートのAI回答でよく出ている参照元ドメインです。
          </p>
        </div>
        <Link href={`${view.reportBase}/sources`} className="inline-flex items-center gap-1 text-sm font-bold text-[#00796B] hover:text-[#005C50]">
          参照元へ
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 space-y-4">
        {view.sourceRows.length > 0 ? view.sourceRows.map((source) => (
          <div key={source.domain} className="min-w-0">
            <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0F172A]">{source.domain}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">{source.sourceTypeLabel}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-[#0F172A]">{source.occurrenceValue}</p>
                <p className="text-xs font-semibold text-[#64748B]">参照出現</p>
              </div>
            </div>
            <ProgressBar value={source.share} tone="green" />
          </div>
        )) : (
          <EmptyStateBlock title="まだ参照元を表示できません" description="参照データが取得できると、よく出ているドメインがここに表示されます。" />
        )}
      </div>
    </section>
  );
}

function ReportOverviewNextSteps({ links }: { links: ReportOverviewNextLink[] }) {
  return (
    <section className="rounded-[24px] border border-[#DDE8E5] bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-6">
      <div>
        <p className="text-xs font-bold text-[#00796B]">次に見る詳細</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F172A]">要点から、根拠の確認へ進む</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          概要で気になった数字を、回答・比較・参照元の各タブで掘り下げます。
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-[18px] border border-[#DDE8E5] bg-[#F6FAF9] p-4 transition hover:-translate-y-0.5 hover:border-[#00796B]/30 hover:bg-[#E6F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#00796B] shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#0F172A]">{item.title}</p>
                    <ArrowRight className="h-4 w-4 text-[#00796B] transition group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getPrimaryBrandDisplayedAnswerCount(data: RecoraLeaderboardDbData | null, primaryBrandId?: string | null) {
  if (!data?.project || !primaryBrandId) return null;
  return getPrimaryBrandDisplayedConversationIds(data, primaryBrandId).size;
}

function createReportOverviewAudienceRows(
  data: RecoraLeaderboardDbData | null,
  primaryBrandId: string | null | undefined,
  scope: "persona" | "topic"
): ReportOverviewAudienceRow[] {
  if (!data?.project || !primaryBrandId || data.conversations.length === 0) return [];

  const displayedConversationIds = getPrimaryBrandDisplayedConversationIds(data, primaryBrandId);
  const runItemById = new Map(data.runItems.map((item) => [item.id, item]));
  const promptById = new Map(data.prompts.map((item) => [item.id, item]));
  const personaById = new Map(data.personas.map((item) => [item.id, item]));
  const topicById = new Map(data.topics.map((item) => [item.id, item]));
  const rows = new Map<string, { id: string; name: string; displayAnswerCount: number; totalAnswerCount: number }>();

  for (const conversation of data.conversations) {
    const runItem = runItemById.get(conversation.run_item_id);
    const prompt = runItem ? promptById.get(runItem.prompt_id) : undefined;
    const key = scope === "persona" ? runItem?.persona_id ?? prompt?.persona_id : prompt?.topic_id;
    const name = scope === "persona"
      ? key ? personaById.get(key)?.name ?? "未分類ペルソナ" : "未分類ペルソナ"
      : key ? topicById.get(key)?.name ?? "未分類トピック" : "未分類トピック";
    const id = key ?? `${scope}-unknown`;
    const row = rows.get(id) ?? { id, name, displayAnswerCount: 0, totalAnswerCount: 0 };

    row.totalAnswerCount += 1;
    if (displayedConversationIds.has(conversation.id)) {
      row.displayAnswerCount += 1;
    }
    rows.set(id, row);
  }

  return Array.from(rows.values())
    .filter((row) => row.totalAnswerCount > 0)
    .map((row) => ({
      ...row,
      displayRate: Math.round((row.displayAnswerCount / row.totalAnswerCount) * 100),
      displayAnswerValue: formatReportOverviewCount(row.displayAnswerCount),
      totalAnswerValue: formatReportOverviewCount(row.totalAnswerCount)
    }))
    .sort((a, b) => b.displayRate - a.displayRate || b.displayAnswerCount - a.displayAnswerCount || a.name.localeCompare(b.name))
    .slice(0, 5);
}

function getPrimaryBrandDisplayedConversationIds(data: RecoraLeaderboardDbData, primaryBrandId: string) {
  return new Set(
    data.brandMentions
      .filter((mention) => mention.brand_id === primaryBrandId && mention.mentioned)
      .map((mention) => mention.conversation_id)
  );
}

function createReportOverviewSourceRows(data?: RecoraLeaderboardDbData | null): ReportOverviewSourceRow[] {
  if (!data?.project || data.citations.length === 0) return [];

  const groupedSources = new Map<string, { domain: string; sourceTypeLabel: string; occurrenceCount: number }>();
  let totalOccurrences = 0;

  for (const citation of data.citations) {
    const domain = citation.domain || getCitationDomain(citation.url);
    if (!domain) continue;

    const occurrenceCount = Number(citation.occurrence_count ?? 1);
    const sourceRow = groupedSources.get(domain) ?? {
      domain,
      sourceTypeLabel: getSourceTypeLabel(citation.source_type),
      occurrenceCount: 0
    };

    sourceRow.occurrenceCount += occurrenceCount;
    totalOccurrences += occurrenceCount;
    groupedSources.set(domain, sourceRow);
  }

  return Array.from(groupedSources.values())
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, 5)
    .map((source) => ({
      ...source,
      occurrenceValue: formatReportOverviewCount(source.occurrenceCount),
      share: totalOccurrences > 0 ? Math.round((source.occurrenceCount / totalOccurrences) * 100) : 0
    }));
}

function getReportCitationOccurrenceCount(data?: RecoraLeaderboardDbData | null) {
  if (!data?.project) return null;
  return data.citations.reduce((sum, citation) => sum + Number(citation.occurrence_count ?? 1), 0);
}

function getReportCitationUrlCount(data?: RecoraLeaderboardDbData | null) {
  if (!data?.project) return null;
  return uniqueStrings(data.citations.map(getCitationUrlKey).filter((value): value is string => Boolean(value))).length;
}

function getReportSourceDomainCount(data?: RecoraLeaderboardDbData | null) {
  if (!data?.project) return null;
  return uniqueStrings(data.citations.map((citation) => citation.domain).filter(Boolean)).length;
}

function getReportSourceToClaimNeedsReviewCount(data?: RecoraLeaderboardDbData | null) {
  if (!data?.project) return null;
  return data.citations.reduce((sum, citation) => {
    const status = getSourceToClaimStatusLabel(citation).status;
    const occurrenceCount = Number(citation.occurrence_count ?? 1);
    return status === "supported" || status === "partially_supported" ? sum : sum + occurrenceCount;
  }, 0);
}

function getReportOwnedCitationShare(data?: RecoraLeaderboardDbData | null) {
  if (!data?.project) return null;
  const total = data.citations.reduce((sum, citation) => sum + Number(citation.occurrence_count ?? 1), 0);
  const owned = data.citations
    .filter((citation) => citation.source_type === "owned" || citation.brand_related === "target_brand")
    .reduce((sum, citation) => sum + Number(citation.occurrence_count ?? 1), 0);

  return total > 0 ? Math.round((owned / total) * 100) : 0;
}

function getCitationUrlKey(citation: { canonical_url?: string | null; url?: string | null }) {
  return citation.canonical_url || citation.url;
}

function getCitationDomain(url: string | null) {
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function getRoundedNumber(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value) : null;
}

function formatReportOverviewPercent(value: number | null | undefined) {
  return typeof value === "number" ? formatPercent(value) : "-";
}

function formatReportOverviewCount(value: number | null | undefined) {
  return typeof value === "number" ? `${value}件` : "-";
}

function getReportDateScope(start?: string | null, end?: string | null, fallback?: string | null) {
  if (start && end && start === end) {
    return {
      label: "測定日",
      value: start,
      helper: "単発測定の日付"
    };
  }

  if (start || end) {
    return {
      label: "測定期間",
      value: `${start ?? "-"} - ${end ?? "-"}`,
      helper: "このレポートの対象期間"
    };
  }

  return {
    label: "測定日",
    value: fallback ?? "-",
    helper: "測定日が取得できない場合は既定値を表示"
  };
}

function formatReportPeriod(start?: string | null, end?: string | null, fallback?: string | null) {
  if (start || end) return `${start ?? "-"} - ${end ?? "-"}`;
  return fallback ?? "-";
}

export function LeaderboardPage({ leaderboardData = null }: { leaderboardData?: RecoraLeaderboardDbData | null }) {
  const leaderboardView = createLeaderboardViewModel(leaderboardData);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="レポート詳細"
        title="ブランド比較"
        description="選択レポート内で、対象ブランドと比較ブランドがAI回答にどう表示されたかを確認します。公式順位や市場シェアではありません。"
        meta={<ReportFilters compact {...createReportFilterProps(leaderboardData)} />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.leaderboard} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label={leaderboardView.primaryBrandName + "のAI表示率"} value={leaderboardView.primaryVisibility} helper="このレポート内の観測値" />
        <MetricTile label="比較ブランドとの差分" value={leaderboardView.competitiveGapValue} helper="同一レポート内の参考差分" tone="amber" />
        <MetricTile label="Share of Voice" value={leaderboardView.primaryCitationShare} helper="ブランド言及に占める比率" />
      </div>

      <DataCard
        title="AI回答内でどう語られたか"
        description="表示回答数、言及数、平均順位、言及文脈、同時に出た競合をまとめます。新規出現ブランドは過去比較が必要なため、現時点では追加確認として扱います。"
      >
        <LeaderboardNarrativeTable rows={leaderboardView.rankingRows} />
      </DataCard>

      <DataCard title="AI回答内ブランドランキング" description="最新レポート内の観測順位です。勝敗や公式順位ではなく、詳細確認の入口として扱います。">
        <RankingTable rows={leaderboardView.rankingRows} />
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <DataCard title="比較ブランドの見え方" description="AI回答内で比較ブランドが出やすい領域を短く確認します。">
          <div className="space-y-3">
            {leaderboardView.competitorCards.length > 0 ? leaderboardView.competitorCards.map((competitor) => (
              <div key={competitor.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{competitor.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{competitor.position}</p>
                  </div>
                  <DeltaBadge value={competitor.movement} label={formatSignedPt(competitor.movement)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{competitor.note}</p>
              </div>
            )) : (
              <EmptyStateBlock title="まだランキングデータがありません" description="測定を実行すると、競合ごとの表示状況がここに表示されます。" />
            )}
          </div>
        </DataCard>
        <DataCard title="AIモデル別の見え方" description="AIモデル別スナップショットがある場合のみ表示します。平均順位は条件付きの参考値です。">
          <ModelVisibilityTable rows={leaderboardView.modelRows} />
        </DataCard>
      </div>
    </div>
  );
}

type ObservationKind = "openai" | "unknown";

type ConversationDisplayRow = {
  id: string;
  topicName: string;
  personaName: string;
  promptText: string;
  modelName: string;
  date: string;
  recoraMentioned: boolean;
  recoraRank: number | null;
  sentiment: "positive" | "neutral" | "negative";
  mentionedBrands: string[];
  citedDomains: string[];
  answerSummary: string;
  observationKind: ObservationKind;
  observationLabel: string;
  providerLabel: string;
  modelReturnedLabel: string;
  citationStatusLabel: string;
  webSearchLabel: string;
  measuredAtLabel: string;
};

function createConversationDisplayRows(data?: RecoraConversationsDbData | null): ConversationDisplayRow[] {
  if (!data?.project || data.conversations.length === 0) {
    return [];
  }

  const primaryBrand = data.brands.find((item) => item.brand_type === "primary");
  const brandById = new Map(data.brands.map((item) => [item.id, item.name]));
  const runItemById = new Map(data.runItems.map((item) => [item.id, item]));
  const promptById = new Map(data.prompts.map((item) => [item.id, item]));
  const personaById = new Map(data.personas.map((item) => [item.id, item]));
  const topicById = new Map(data.topics.map((item) => [item.id, item]));
  const modelById = new Map(data.aiModels.map((item) => [item.id, item]));
  const mentionsByConversationId = groupBy(data.brandMentions, (item) => item.conversation_id);
  const citationsByConversationId = groupBy(data.citations, (item) => item.conversation_id);

  return data.conversations.map((conversation) => {
    const observationKind = getConversationObservationKind(conversation);
    const runItem = runItemById.get(conversation.run_item_id);
    const prompt = runItem ? promptById.get(runItem.prompt_id) : undefined;
    const persona = runItem ? personaById.get(runItem.persona_id) : undefined;
    const topic = prompt ? topicById.get(prompt.topic_id) : undefined;
    const model = runItem ? modelById.get(runItem.model_id) : undefined;
    const mentions = [...(mentionsByConversationId.get(conversation.id) ?? [])].sort(
      (a, b) => (a.position ?? 999) - (b.position ?? 999)
    );
    const primaryMention = mentions.find((item) => item.brand_id === primaryBrand?.id);
    const domains = uniqueStrings((citationsByConversationId.get(conversation.id) ?? []).map((item) => item.domain));
    const mentionedBrands = mentions
      .filter((item) => item.mentioned)
      .map((item) => brandById.get(item.brand_id) ?? "不明")
      .filter((name, index, list) => list.indexOf(name) === index);

    return {
      id: conversation.id,
      topicName: topic?.name ?? prompt?.intent ?? "トピック未設定",
      personaName: persona?.name ?? "ペルソナ未設定",
      promptText: prompt?.text ?? conversation.prompt_text_snapshot,
      modelName: model?.display_name ?? conversation.model_returned ?? conversation.model_snapshot,
      date: formatConversationDate(conversation.captured_at),
      recoraMentioned: Boolean(primaryMention?.mentioned),
      recoraRank: primaryMention?.position ?? null,
      sentiment: normalizeConversationSentiment(primaryMention?.sentiment ?? mentions[0]?.sentiment),
      mentionedBrands,
      citedDomains: domains,
      answerSummary: conversation.answer_summary ?? conversation.raw_answer.slice(0, 180),
      observationKind,
      observationLabel: getObservationLabel(observationKind),
      providerLabel: formatProviderLabel(conversation.provider),
      modelReturnedLabel: conversation.model_returned ?? conversation.model_snapshot ?? "\u4e0d\u660e",
      citationStatusLabel: formatCitationStatus(conversation.citation_status),
      webSearchLabel: observationKind === "openai" ? formatWebSearchLabel(conversation.web_search_enabled) : "\u4e0d\u660e",
      measuredAtLabel: formatDateTime(conversation.measured_at ?? conversation.captured_at)
    };
  });
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const values = map.get(key) ?? [];
    values.push(item);
    map.set(key, values);
  }
  return map;
}

function uniqueStrings(values: string[]) {
  return values.filter((value, index, list) => list.indexOf(value) === index);
}

function getConversationObservationKind(conversation: { provider: string | null; response_id: string | null }): ObservationKind {
  return conversation.provider === "openai" || Boolean(conversation.response_id) ? "openai" : "unknown";
}

function getObservationLabel(kind: ObservationKind) {
  return kind === "openai" ? "OpenAI実測" : "実測";
}

function formatProviderLabel(value: string | null | undefined) {
  if (!value) return "不明";
  return value === "openai" ? "OpenAI" : value;
}

function formatCitationStatus(value: string | null | undefined) {
  const labels: Record<string, string> = {
    unknown: "不明",
    not_requested: "引用取得なし",
    unavailable: "引用なし",
    available: "引用あり",
    partial: "一部引用あり",
    error: "引用取得エラー"
  };
  return value ? labels[value] ?? value : "不明";
}

function formatWebSearchLabel(value: boolean | null | undefined) {
  if (value === true) return "Web検索あり";
  if (value === false) return "Web検索なし";
  return "不明";
}

function formatBrandRelatedness(value: string | null | undefined) {
  const labels: Record<string, string> = {
    unknown: "不明",
    target_brand: "自社関連",
    competitor: "競合関連",
    unknown_competitor: "新規競合候補",
    category: "カテゴリ関連",
    general: "一般参照",
    unrelated: "関連なし"
  };
  return value ? labels[value] ?? value : "不明";
}

function ObservationKindBadge({ kind, label }: { kind: ObservationKind; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-sm text-xs",
        kind === "openai"
          ? "border-[#00796B]/25 bg-[#E6F4F1] text-[#00796B]"
          : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {label}
    </Badge>
  );
}

function normalizeConversationSentiment(value: string | null | undefined): "positive" | "neutral" | "negative" {
  if (value === "positive" || value === "negative") return value;
  return "neutral";
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(date);
}

export function ConversationsPage({ conversationsData = null }: { conversationsData?: RecoraConversationsDbData | null }) {
  const conversationRows = createConversationDisplayRows(conversationsData);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow={"レポート詳細"}
        title={"AI回答"}
        description={"実際のAI回答内で、ブランドがどう扱われたかを回答単位で確認します。raw responseではなく、表示用に整理した要約です。"}
        meta={<ReportFilters compact {...createReportFilterProps(conversationsData)} />}
        actions={
          <>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              {"絞り込み"}
            </Button>
            <HeaderActions />
          </>
        }
      />
      <DetailTabs items={reportDetailTabs.conversations} />

      <DataCard
        title={"AI回答の観測ログ"}
        description={String(conversationRows.length) + "件のAI回答について、ブランド言及、参照元、回答要約を一覧化しています。"}
      >
        {conversationRows.length > 0 ? (
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[300px]">{"プロンプト"}</TableHead>
                <TableHead className="min-w-[140px]">{"AIモデル"}</TableHead>
                <TableHead className="min-w-[190px]">{"ブランド言及"}</TableHead>
                <TableHead className="min-w-[110px]">{"評価"}</TableHead>
                <TableHead className="min-w-[190px]">{"参照元"}</TableHead>
                <TableHead className="min-w-[320px]">{"回答要約"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversationRows.map((conversation) => (
                <TableRow key={conversation.id}>
                  <TableCell className="min-w-[300px]">
                    <div className="font-bold text-slate-950">{conversation.topicName}</div>
                    <div className="mt-1 text-xs text-slate-500">{conversation.personaName}</div>
                    <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{conversation.promptText}</div>
                    <div className="mt-2 text-xs font-semibold text-slate-400">{conversation.date}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <ObservationKindBadge kind={conversation.observationKind} label={conversation.observationLabel} />
                      <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm text-xs", conversation.webSearchLabel === "Web検索あり" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                        {conversation.webSearchLabel}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <div className="whitespace-nowrap font-semibold text-slate-950">{conversation.modelName}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{conversation.providerLabel}</div>
                    <div className="text-xs leading-5 text-slate-500">{conversation.modelReturnedLabel}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {conversation.recoraMentioned ? (
                        <Badge className="bg-[#00796B] text-white">{"順位 "}{conversation.recoraRank ?? "-"}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                          {"未表示"}
                        </Badge>
                      )}
                      {conversation.mentionedBrands.length > 0 ? (
                        <div className="text-xs leading-5 text-slate-500">
                          {"言及: "}{conversation.mentionedBrands.join(" / ")}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SentimentPill value={conversation.sentiment} />
                  </TableCell>
                  <TableCell className="min-w-[190px]">
                    <div className="flex flex-wrap gap-1.5">
                      {conversation.citedDomains.map((domain) => (
                        <Badge key={domain} variant="muted" className="font-medium">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[320px] text-sm leading-6 text-slate-600">
                    {conversation.answerSummary}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="muted" className="font-medium">{conversation.citationStatusLabel}</Badge>
                      <span className="font-semibold text-slate-400">実測: {conversation.measuredAtLabel}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyStateBlock title="まだAI回答ログがありません" description="測定を実行すると、取得したAI回答がここに表示されます。" />
        )}
      </DataCard>
    </div>
  );
}

export function SourcesPage({ sourcesData = null }: { sourcesData?: RecoraSourcesDbData | null }) {
  const sourceDisplay = createSourcesDisplayData(sourcesData);
  const hasSourceData = Boolean(sourcesData?.project);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow={"レポート詳細"}
        title={"参照元"}
        description={"AI回答で参照として出現したドメインとURLを確認します。参照数は根拠確認済み件数ではありません。"}
        meta={<ReportFilters compact {...createReportFilterProps(sourcesData)} />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.sources} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile
          label={"参照ドメイン数"}
          value={hasSourceData ? String(sourceDisplay.uniqueDomainCount) : "-"}
          helper={hasSourceData ? String(sourceDisplay.totalCitationRows) + "件のcitation row" : "追加測定後に表示"}
        />
        <MetricTile
          label={"自社参照シェア"}
          value={hasSourceData ? sourceDisplay.ownedCitationShare + "%" : "-"}
          helper={"自社ドメインが参照された比率"}
        />
        <MetricTile
          label={"競合参照シェア"}
          value={hasSourceData ? sourceDisplay.competitorCitationShare + "%" : "-"}
          helper={"競合ドメインが参照された比率"}
          tone="amber"
        />
        <MetricTile
          label={"第三者参照ドメイン"}
          value={hasSourceData ? String(sourceDisplay.thirdPartyDomainCount) : "-"}
          helper={"メディア・レビュー系のドメイン"}
          tone="slate"
        />
      </div>

      <SourceEvidenceReadinessPanel sourceDisplay={sourceDisplay} />

      <DataCard
        title={"参照元ドメイン"}
        description={"ドメイン別の参照出現数、参照シェア、カテゴリ、主なURLをまとめています。"}
      >
        <SourcesTable rows={sourceDisplay.sourceRows} />
      </DataCard>

      <DataCard
        title={"参照されたURL"}
        description={"AI回答で参照として出現したURLを一覧化しています。source-to-claim supportとは分けて確認します。"}
      >
        <CitationsTable rows={sourceDisplay.citationRows} />
      </DataCard>
    </div>
  );
}

function SourceEvidenceReadinessPanel({ sourceDisplay }: { sourceDisplay: SourcesDisplayData }) {
  return (
    <DataCard
      title="参照されたが、根拠として使えるか"
      description="参照出現数と source-to-claim 状態を分けて確認します。参照回数は根拠確認済み数ではありません。"
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[18px] border border-[#DDE8E5] bg-[#F6FAF9] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-[#00796B]">source-to-claim</p>
            <Badge variant="outline" className="rounded-sm border-[#00796B]/25 bg-white text-[#00796B]">
              抽出状態
            </Badge>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-normal text-[#073F39]">
            {sourceDisplay.supportingCitationCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            source-to-claim上、支持または部分支持として記録された参照出現です。最終的な人手承認ではありません。
          </p>
        </div>
        <div className="rounded-[18px] border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-amber-700">要確認 / 未検証</p>
            <Badge variant="outline" className="rounded-sm border-amber-200 bg-white text-amber-700">
              review
            </Badge>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-normal text-amber-900">
            {sourceDisplay.needsClaimReviewCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900/75">
            未確認、無関係、矛盾、未レビューを含みます。顧客向け根拠として使う前に確認します。
          </p>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-600">source freshness</p>
            <Badge variant="outline" className="rounded-sm border-slate-200 bg-white text-slate-600">
              NEEDS_VERIFICATION
            </Badge>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-normal text-slate-900">
            未取得
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            対象 {sourceDisplay.freshnessNeedsVerificationCount} 出現
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            公開日・更新日が取得できたものだけ状態を表示します。not_checked / unknown は未確認として扱います。
          </p>
        </div>
      </div>
    </DataCard>
  );
}

type SourceDisplayRow = {
  domain: string;
  category: string;
  sourceType: string;
  appearances: number;
  citationShare: number;
  trustScore: number;
  trustLabel: string;
  supportingCitationCount: number;
  needsClaimReviewCount: number;
  sourceToClaimSummary: string;
  freshnessSummary: string;
  urls: string[];
  recommendedAction: string;
  observationLabels: string[];
};

type SourceToClaimStatus =
  | "supported"
  | "partially_supported"
  | "needs_review"
  | "contradicted"
  | "unrelated"
  | "unknown"
  | "not_reviewed";

type CitationDisplayRow = {
  id: string;
  title: string;
  url: string;
  domain: string;
  sourceType: string;
  occurrences: number;
  supportsClaimLabel: string;
  sourceToClaimStatus: SourceToClaimStatus;
  sourceToClaimTone: "green" | "amber" | "rose" | "slate";
  sourceFreshnessLabel: string;
  sourceFreshnessNote: string;
  citedFor: string;
  claimText: string | null;
  observationKind: ObservationKind;
  observationLabel: string;
  providerLabel: string;
  citationStatusLabel: string;
  webSearchLabel: string;
  brandRelatedLabel: string;
};

type SourcesDisplayData = {
  sourceRows: SourceDisplayRow[];
  citationRows: CitationDisplayRow[];
  totalCitationRows: number;
  uniqueDomainCount: number;
  ownedCitationShare: number;
  competitorCitationShare: number;
  thirdPartyDomainCount: number;
  supportingCitationCount: number;
  needsClaimReviewCount: number;
  freshnessNeedsVerificationCount: number;
};

function createSourcesDisplayData(data?: RecoraSourcesDbData | null): SourcesDisplayData {
  if (!data?.project) {
    return createEmptySourcesDisplayData();
  }

  const sourceDomainById = new Map(data.sourceDomains.map((item) => [item.id, item]));
  const sourceDomainByDomain = new Map(data.sourceDomains.map((item) => [item.domain, item]));
  const conversationById = new Map(data.conversations.map((item) => [item.id, item]));
  const groupedSources = new Map<string, SourceDisplayRow & { supportedCount: number; citationRows: number }>();
  let totalAppearances = 0;
  let ownedAppearances = 0;
  let competitorAppearances = 0;

  const citationRows = data.citations.map((citation) => {
    const sourceDomain = citation.source_domain_id
      ? sourceDomainById.get(citation.source_domain_id)
      : sourceDomainByDomain.get(citation.domain);
    const sourceType = sourceDomain?.source_type ?? citation.source_type;
    const domain = sourceDomain?.domain ?? citation.domain;
    const conversation = conversationById.get(citation.conversation_id);
    const observationKind = getConversationObservationKind(conversation ?? { provider: null, response_id: null });
    const observationLabel = getObservationLabel(observationKind);
    const appearances = Math.max(1, citation.occurrence_count ?? 1);
    const sourceToClaim = getSourceToClaimStatusLabel(citation);
    const sourceFreshness = getSourceFreshnessLabel(citation);
    totalAppearances += appearances;

    if (sourceType === "owned") ownedAppearances += appearances;
    if (sourceType === "competitor") competitorAppearances += appearances;

    const sourceRow = groupedSources.get(domain) ?? {
      domain,
      category: getSourceTypeLabel(sourceType),
      sourceType,
      appearances: 0,
      citationShare: 0,
      trustScore: 0,
      trustLabel: sourceDomain?.trust_label ?? getSourceTypeLabel(sourceType),
      supportingCitationCount: 0,
      needsClaimReviewCount: 0,
      sourceToClaimSummary: "",
      freshnessSummary: "",
      urls: [],
      recommendedAction: getSourceRecommendedAction(sourceType),
      observationLabels: [],
      supportedCount: 0,
      citationRows: 0
    };

    sourceRow.appearances += appearances;
    sourceRow.citationRows += 1;
    if (sourceToClaim.isSupported) sourceRow.supportedCount += appearances;
    if (!sourceRow.observationLabels.includes(observationLabel)) sourceRow.observationLabels.push(observationLabel);
    if (citation.url && !sourceRow.urls.includes(citation.url)) sourceRow.urls.push(citation.url);
    groupedSources.set(domain, sourceRow);

    return {
      id: citation.id,
      title: citation.title ?? getCitationTitle(citation.url, domain),
      url: citation.url ?? domain,
      domain,
      sourceType: getSourceTypeLabel(sourceType),
      occurrences: appearances,
      supportsClaimLabel: sourceToClaim.label,
      sourceToClaimStatus: sourceToClaim.status,
      sourceToClaimTone: sourceToClaim.tone,
      sourceFreshnessLabel: sourceFreshness.label,
      sourceFreshnessNote: sourceFreshness.note,
      citedFor: getCitationContext(sourceToClaim.status),
      claimText: citation.claim_text ?? citation.cited_text ?? null,
      observationKind,
      observationLabel,
      providerLabel: formatProviderLabel(conversation?.provider),
      citationStatusLabel: formatCitationStatus(conversation?.citation_status),
      webSearchLabel: observationKind === "openai" ? formatWebSearchLabel(conversation?.web_search_enabled) : "\u4e0d\u660e",
      brandRelatedLabel: formatBrandRelatedness(citation.brand_related)
    };
  });

  const sourceRows = Array.from(groupedSources.values())
    .map((source) => {
      const supportRate = source.appearances === 0 ? 0 : source.supportedCount / source.appearances;
      return {
        ...source,
        citationShare: totalAppearances === 0 ? 0 : Math.round((source.appearances / totalAppearances) * 100),
        trustScore: getSourceTrustScore(source.sourceType, supportRate),
        supportingCitationCount: source.supportedCount,
        needsClaimReviewCount: Math.max(0, source.appearances - source.supportedCount),
        sourceToClaimSummary: `支持 ${source.supportedCount} / 要確認 ${Math.max(0, source.appearances - source.supportedCount)}`,
        freshnessSummary: "取得済みの鮮度状態はURL単位で確認"
      };
    })
    .sort((a, b) => b.appearances - a.appearances);

  const thirdPartyDomainCount = sourceRows.filter((source) =>
    ["media", "review", "technical", "unknown"].includes(source.sourceType)
  ).length;

  const supportingCitationCount = citationRows.reduce(
    (sum, citation) => isSupportedSourceToClaimStatus(citation.sourceToClaimStatus) ? sum + citation.occurrences : sum,
    0
  );
  const needsClaimReviewCount = Math.max(0, totalAppearances - supportingCitationCount);

  return {
    sourceRows,
    citationRows,
    totalCitationRows: data.citations.length,
    uniqueDomainCount: sourceRows.length,
    ownedCitationShare: totalAppearances === 0 ? 0 : Math.round((ownedAppearances / totalAppearances) * 100),
    competitorCitationShare: totalAppearances === 0 ? 0 : Math.round((competitorAppearances / totalAppearances) * 100),
    thirdPartyDomainCount,
    supportingCitationCount,
    needsClaimReviewCount,
    freshnessNeedsVerificationCount: totalAppearances
  };
}

function createEmptySourcesDisplayData(): SourcesDisplayData {
  return {
    sourceRows: [],
    citationRows: [],
    totalCitationRows: 0,
    uniqueDomainCount: 0,
    ownedCitationShare: 0,
    competitorCitationShare: 0,
    thirdPartyDomainCount: 0,
    supportingCitationCount: 0,
    needsClaimReviewCount: 0,
    freshnessNeedsVerificationCount: 0
  };
}

function getSourceTypeLabel(sourceType: string) {
  const labels: Record<string, string> = {
    owned: "自社",
    competitor: "競合",
    media: "業界メディア",
    review: "レビュー",
    technical: "技術参照",
    unknown: "未分類"
  };

  return labels[sourceType] ?? "未分類";
}

function getSourceRecommendedAction(sourceType: string) {
  const actions: Record<string, string> = {
    owned: "自社ページの内容、更新日、構造化データを確認し、引用されやすい根拠を増やします。",
    competitor: "競合が参照される理由を確認し、比較ページや導入事例で補強します。",
    media: "第三者記事での紹介内容と自社の説明に差がないか確認します。",
    review: "レビュー系参照元の評価軸に合わせて、比較情報を補います。",
    technical: "技術情報やFAQの構造を整え、AIが根拠として扱いやすくします。",
    unknown: "参照元の所有者と用途を確認し、カテゴリを分類します。"
  };

  return actions[sourceType] ?? actions.unknown;
}

function getSourceTrustScore(sourceType: string, supportRate: number) {
  const baseScores: Record<string, number> = {
    owned: 78,
    competitor: 72,
    media: 70,
    review: 74,
    technical: 76,
    unknown: 60
  };
  const baseScore = baseScores[sourceType] ?? baseScores.unknown;
  return Math.max(40, Math.min(95, baseScore + Math.round((supportRate - 0.5) * 12)));
}

function getCitationTitle(url: string | null, domain: string) {
  if (!url) return domain;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname === "/" ? parsedUrl.hostname : parsedUrl.pathname;
  } catch {
    return url;
  }
}

function getSourceToClaimStatusLabel(citation: {
  supports_claim?: boolean | null;
  source_to_claim_status?: string | null;
}): {
  label: string;
  status: SourceToClaimStatus;
  tone: "green" | "amber" | "rose" | "slate";
  isSupported: boolean;
} {
  const status = normalizeSourceToClaimStatus(citation.source_to_claim_status, citation.supports_claim);

  if (status === "supported") {
    return { label: "支持あり", status, tone: "green", isSupported: true };
  }
  if (status === "partially_supported") {
    return { label: "部分支持", status, tone: "green", isSupported: true };
  }
  if (status === "contradicted") {
    return { label: "矛盾の可能性", status, tone: "rose", isSupported: false };
  }
  if (status === "unrelated") {
    return { label: "主張と不一致", status, tone: "amber", isSupported: false };
  }
  if (status === "not_reviewed") {
    return { label: "未レビュー", status, tone: "slate", isSupported: false };
  }
  return { label: "要確認", status, tone: "amber", isSupported: false };
}

function normalizeSourceToClaimStatus(value: string | null | undefined, supportsClaim: boolean | null | undefined): SourceToClaimStatus {
  if (
    value === "supported" ||
    value === "partially_supported" ||
    value === "contradicted" ||
    value === "unrelated" ||
    value === "unknown" ||
    value === "not_reviewed"
  ) {
    return value;
  }

  if (supportsClaim === true) return "supported";
  if (supportsClaim === false) return "unknown";
  return "not_reviewed";
}

function isSupportedSourceToClaimStatus(value: SourceToClaimStatus) {
  return value === "supported" || value === "partially_supported";
}

function getSourceFreshnessLabel(citation: {
  source_freshness_status?: string | null;
  source_published_at?: string | null;
  source_last_modified_at?: string | null;
  source_retrieved_at?: string | null;
  source_freshness_days?: number | null;
}) {
  const status = citation.source_freshness_status ?? "not_checked";
  const date = citation.source_last_modified_at ?? citation.source_published_at ?? citation.source_retrieved_at;
  const age = typeof citation.source_freshness_days === "number" ? `${citation.source_freshness_days}日` : null;

  if (status === "fresh") return { label: "fresh", note: age ?? formatDateTime(date) };
  if (status === "recent") return { label: "recent", note: age ?? formatDateTime(date) };
  if (status === "stale") return { label: "stale", note: age ?? formatDateTime(date) };
  if (status === "unknown") return { label: "未確認", note: "公開日・更新日の確認が必要" };
  return { label: "未取得", note: "現行データでは鮮度未取得" };
}

function getCitationContext(status: SourceToClaimStatus) {
  if (status === "supported") return "回答内の主張を支える参照として記録されています。必要に応じて人手で確認してください。";
  if (status === "partially_supported") return "一部の主張を支える参照として記録されています。顧客向け利用前に範囲を確認してください。";
  if (status === "contradicted") return "回答内の主張と矛盾する可能性があります。改善候補ではなく確認事項として扱います。";
  if (status === "unrelated") return "参照URLと回答内の主張が一致していない可能性があります。";
  if (status === "not_reviewed") return "URLは取得済みですが、主張を支持するかは未レビューです。";
  return "参照はありますが、主張との一致確認が必要です。";
}

export function TrendsPage() {
  const labels = weeklyTrends.map((week) => week.week);

  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="推移"
        description="週次のAI表示率、参照カバレッジ、競合差分の推移を確認します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="6週のAI表示率上昇" value="+16 pt" helper="RecoraのAI表示率" delta={16} />
        <MetricTile label="参照カバレッジ上昇" value="+10 pt" helper="自社サイトの参照率" delta={10} />
        <MetricTile label="首位との差分改善" value="-10 pt" helper="Trailbaseとの差が縮小" delta={10} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <DataCard title="RecoraのAI表示率の推移" description="週次のAI表示率です。">
          <TinyBarChart values={weeklyTrends.map((week) => week.recora)} labels={labels} />
        </DataCard>
        <DataCard title="参照カバレッジの推移" description="自社サイトが参照された割合です。">
          <TinyBarChart values={weeklyTrends.map((week) => week.citations)} labels={labels} max={60} />
        </DataCard>
      </div>

      <DataCard className="mt-5" title="週次推移テーブル" description="主要ブランドのAI表示率の推移です。">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>週</TableHead>
              <TableHead>Recora</TableHead>
              <TableHead>Trailbase</TableHead>
              <TableHead>SignalNest</TableHead>
              <TableHead>MentionMap</TableHead>
              <TableHead>RankLens</TableHead>
              <TableHead>自社参照</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyTrends.map((week) => (
              <TableRow key={week.week}>
                <TableCell className="font-bold">{week.week}</TableCell>
                <TableCell><MetricWithBar value={week.recora} /></TableCell>
                <TableCell><MetricWithBar value={week.trailbase} /></TableCell>
                <TableCell><MetricWithBar value={week.signalnest} /></TableCell>
                <TableCell><MetricWithBar value={week.mentionmap} /></TableCell>
                <TableCell><MetricWithBar value={week.ranklens} /></TableCell>
                <TableCell><MetricWithBar value={week.citations} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>
    </>
  );
}

export function BuyerCriteriaPage() {
  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="選定基準分析"
        description="選定基準ごとに、Recoraが勝っている点、負けている点、次に補強すべき根拠を整理します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={["選定基準", "比較要因", "補強すべき根拠"]} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile label="強い項目" value="2 / 7" helper="参照元追跡、改善候補" tone="green" />
        <MetricTile label="僅差負け" value="2" helper="カバレッジ、使いやすさ" tone="amber" />
        <MetricTile label="最大差分" value="25 pt" helper="サイト技術診断" tone="amber" />
        <MetricTile label="加重スコア" value="71" helper="サンプル加重平均" delta={4} />
      </div>

      <DataCard className="mt-5" title="選定基準スコアカード" description="AI回答が選定時に重視した基準をスコア化しています。">
        <BuyerCriteriaTable />
      </DataCard>
    </>
  );
}

export function BrandPerceptionPage() {
  const themes = [
    {
      label: "好意的な認識",
      value: "根拠を追えるAI検索分析",
      score: 78,
      notes: "Recoraはペルソナ、プロンプト、AIモデル、参照元単位で根拠を追える点が評価されています。"
    },
    {
      label: "中立的な認識",
      value: "成長中のカテゴリプレイヤー",
      score: 61,
      notes: "一部の回答では、導入実績、チーム利用、権限管理などの公開情報を確認すべきとされています。"
    },
    {
      label: "リスク認識",
      value: "技術的な根拠ページが不足",
      score: 44,
      notes: "サイト技術診断や参照されやすいページ構造の説明では、競合や一般的な技術資料に流れています。"
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="ブランド認識"
        description="AI回答がRecoraをどのような言葉で位置づけているかを、好意・中立・リスクに分けます。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.brandPerception} />

      <div className="grid gap-5 lg:grid-cols-3">
        {themes.map((theme) => (
          <DataCard key={theme.label} title={theme.label}>
            <div className="space-y-3">
              <p className="text-lg font-bold text-slate-950">{theme.value}</p>
              <MetricWithBar value={theme.score} />
              <p className="text-sm leading-6 text-slate-600">{theme.notes}</p>
            </div>
          </DataCard>
        ))}
      </div>

      <DataCard className="mt-5" title="繰り返し出る表現" description="回答中で繰り返し出る表現です。">
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            "ペルソナ別・プロンプト別のAI表示率",
            "AI回答の参照元を追跡できる",
            "競合言及から不足コンテンツを見つけられる",
            "ガバナンス説明は今後の補強余地",
            "代理店や成長チームに向いている",
            "大手向け競合より公開事例が少ない"
          ].map((phrase) => (
            <div key={phrase} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
              <span className="text-sm font-semibold text-slate-700">{phrase}</span>
            </div>
          ))}
        </div>
      </DataCard>
    </>
  );
}

export function TechnicalAuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="改善"
        title="サイト技術診断"
        description="AI回答で参照されやすい構造になっているか、自社ページの読み取りやすさを確認します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.technicalAudit} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="診断スコア" value="63" helper="チェック平均" tone="amber" />
        <MetricTile label="要改善" value="2" helper="比較根拠、選定基準" tone="amber" />
        <MetricTile label="良好" value="2" helper="エンティティ説明、改善候補" tone="green" />
      </div>

      <DataCard className="mt-5" title="サイト技術診断チェック" description="完全自動実行ではなく、サンプル診断結果として表示しています。">
        <TechnicalAuditTable />
      </DataCard>
    </>
  );
}

export function ContentOpportunitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="改善"
        title="コンテンツ改善案"
        description="RecoraがAI回答で負けているトピックを見つけ、補強すべきページや根拠を優先度順に並べます。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.contentOpportunities} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="高優先トピック" value="3" helper="スコア80以上" tone="amber" />
        <MetricTile label="影響プロンプト" value="30" helper="5つの改善グループ" />
        <MetricTile label="最大競合差分" value="35 pt" helper="選定基準" tone="amber" />
      </div>

      <DataCard className="mt-5" title="改善案バックログ" description="トピックごとの改善ページ、影響プロンプト、次の一手です。">
        <ContentOpportunitiesTable />
      </DataCard>
    </>
  );
}

type PlaceholderRouteKey = keyof typeof placeholderRouteSummaries;

type PlaceholderRelatedLink = {
  label: string;
  href: string;
  helper: string;
};

type PlaceholderPageDetail = {
  outcome: string;
  canCheck: string[];
  planned: string[];
  requiredData: string[];
  links: PlaceholderRelatedLink[];
};

const placeholderPageDetails: Record<PlaceholderRouteKey, PlaceholderPageDetail> = {
  reportHistory: {
    outcome: "レポートの変化を時系列で追い、どの期間にAI表示率や参照元が動いたかを振り返るための画面です。",
    canCheck: [
      "作成済みレポートの期間、対象ブランド、主要KPIのスナップショット",
      "測定状態、更新日、共有済みレポートの有無",
      "前回レポートとの差分を確認するための履歴一覧"
    ],
    planned: [
      "レポート間比較と主要KPIの増減ハイライト",
      "再測定、複製、共有リンク管理",
      "レポート作成メモと社内レビュー状態"
    ],
    requiredData: [
      "プロジェクト、レポート、測定回の基本情報",
      "AI表示率の履歴スナップショット",
      "共有リンクとエクスポート履歴"
    ],
    links: [
      { label: "レポート概要", href: "/dashboard/reports", helper: "現在のレポート一覧を見る" },
      { label: "概要", href: `${reportBase}/overview`, helper: "最新レポートの全体像を見る" },
      { label: "推移", href: `${reportBase}/trends`, helper: "時系列の変化を確認する" }
    ]
  },
  runResults: {
    outcome: "ペルソナ、トピック、プロンプト、AIモデルごとの取得結果を、測定単位で確認するための画面です。",
    canCheck: [
      "各測定回の対象プロンプト数、成功数、未取得数",
      "AIモデル別の回答取得状況と参照データの有無",
      "AI回答ログに入る前の測定サマリー"
    ],
    planned: [
      "測定ごとの失敗理由、再測定、差分比較",
      "AIモデル別の取得時間と調査カバレッジ確認",
      "プロンプト単位の取得ステータス一覧"
    ],
    requiredData: [
      "ペルソナ、トピック、プロンプト、AIモデル",
      "AI回答ログ、AI言及数、参照回数",
      "測定ログと取得ステータス"
    ],
    links: [
      { label: "AI回答ログ", href: `${reportBase}/conversations`, helper: "取得済み回答を確認する" },
      { label: "プロンプト分析", href: `${reportBase}/prompts`, helper: "取得対象の分類を見る" },
      { label: "概要", href: `${reportBase}/overview`, helper: "測定結果の集計を見る" }
    ]
  },
  export: {
    outcome: "分析結果を社内共有、顧客報告、改善タスク化に使える形へ出力するための画面です。",
    canCheck: [
      "出力対象に含めるKPI、AI回答ログ、参照元、改善候補",
      "CSV、共有用レポート、タスク一覧の出力イメージ",
      "期間、地域、AIモデルで絞り込んだ出力範囲"
    ],
    planned: [
      "CSV / PDF / 共有リンクの出力",
      "チーム向け、経営向け、制作向けのテンプレート切り替え",
      "出力履歴と再ダウンロード"
    ],
    requiredData: [
      "AI表示率、AI回答ログ",
      "参照回数、参照元、選定基準",
      "改善候補と確認タスク"
    ],
    links: [
      { label: "参照元分析", href: `${reportBase}/sources`, helper: "出力対象の参照データを見る" },
      { label: "選定基準分析", href: `${reportBase}/buyer-criteria`, helper: "比較要因を確認する" },
      { label: "改善候補", href: `${reportBase}/recommendations`, helper: "出力する候補を見る" }
    ]
  },
  prompts: {
    outcome: "AI回答でRecoraがどの質問意図に強いか、どのプロンプトで競合に負けているかを整理する画面です。",
    canCheck: [
      "プロンプトカテゴリ、意図、優先度、現在のAI表示率",
      "ペルソナ別・トピック別の調査カバレッジ",
      "AIモデルごとの差が出やすい質問パターン"
    ],
    planned: [
      "プロンプト分類と意図別の比較要因集計",
      "AIモデル別の違いと未取得プロンプトの検出",
      "改善に使うプロンプトギャップスコア"
    ],
    requiredData: [
      "ペルソナ、トピック、プロンプト",
      "AIモデル、AI回答ログ",
      "AI言及数と表示順位"
    ],
    links: [
      { label: "トピック・プロンプト", href: "/dashboard/config/topics-prompts", helper: "監視対象を確認する" },
      { label: "AI回答ログ", href: `${reportBase}/conversations`, helper: "実際の回答を読む" },
      { label: "概要", href: `${reportBase}/overview`, helper: "集計結果を見る" }
    ]
  },
  recommendations: {
    outcome: "AI表示率の低下や競合差分の要因を分解し、優先度順に改善施策へつなげる画面です。",
    canCheck: [
      "改善インパクト、緊急度、影響プロンプトの整理",
      "コンテンツ、参照元、サイト技術診断のどこを直すべきか",
      "スコア内訳に基づく次の一手"
    ],
    planned: [
      "スコア内訳と推定改善幅の表示",
      "改善候補から確認プランへの変換",
      "担当者、期限、完了状態の紐づけ"
    ],
    requiredData: [
      "AI表示率と推移",
      "コンテンツ改善案とサイト技術診断",
      "参照元、選定基準、リスク検知"
    ],
    links: [
      { label: "コンテンツ改善案", href: `${reportBase}/content-opportunities`, helper: "改善すべきトピックを見る" },
      { label: "サイト技術診断", href: `${reportBase}/technical-audit`, helper: "参照されやすさを確認する" },
      { label: "改善プラン", href: `${reportBase}/action-plan`, helper: "実行計画へ進む" }
    ]
  },
  misinformationRisks: {
    outcome: "AI回答内の古い情報、誤認、競合との混同を検出し、ブランドリスクを管理する画面です。",
    canCheck: [
      "誤った料金、導入期間、機能説明などのリスク候補",
      "競合名との混同や文脈上の弱い表現",
      "どのAIモデル、プロンプト、参照元で発生しているか"
    ],
    planned: [
      "リスク深刻度、発生頻度、証拠回答の一覧",
      "修正すべき自社ページと外部参照元の候補",
      "ブランドファクトとの照合と監視リスト"
    ],
    requiredData: [
      "AI回答ログと回答要約",
      "参照回数と参照ドメイン",
      "ブランド情報と競合の別名"
    ],
    links: [
      { label: "ブランド認識", href: `${reportBase}/brand-perception`, helper: "認識の強み弱みを見る" },
      { label: "AI回答ログ", href: `${reportBase}/conversations`, helper: "該当回答を確認する" },
      { label: "参照元分析", href: `${reportBase}/sources`, helper: "誤情報の参照元を見る" }
    ]
  },
  actionPlan: {
    outcome: "改善候補を30/60/90日の確認計画に落とし込み、チームで進捗を管理する画面です。",
    canCheck: [
      "優先タスク、推定効果、関連カテゴリ、期限",
      "短期で直す基盤、中期で強化するコンテンツ、長期で広げる存在感",
      "改善候補と確認タスクの接続"
    ],
    planned: [
      "30/60/90日プランとタスク管理",
      "担当者、期限、ステータス、依存関係",
      "完了タスクがAI表示率に与えた影響の記録"
    ],
    requiredData: [
      "改善候補とコンテンツ改善案",
      "サイト技術診断と参照元",
      "チームメンバーとタスク状況"
    ],
    links: [
      { label: "改善候補", href: `${reportBase}/recommendations`, helper: "確認候補を見る" },
      { label: "コンテンツ改善案", href: `${reportBase}/content-opportunities`, helper: "作るべきページを見る" },
      { label: "サイト技術診断", href: `${reportBase}/technical-audit`, helper: "技術タスクを見る" }
    ]
  },
  team: {
    outcome: "AI検索改善を進めるメンバー、担当領域、確認権限を管理するための設定画面です。",
    canCheck: [
      "プロジェクト参加者と役割の一覧",
      "担当するブランド、トピック、改善タスク",
      "共有レポートや承認フローに関わる権限"
    ],
    planned: [
      "ロール別権限と招待管理",
      "タスク担当者、通知先、レビュー担当の設定",
      "レポート共有範囲と閲覧権限"
    ],
    requiredData: [
      "メンバー、役割、プロジェクト権限",
      "タスク担当者",
      "通知設定"
    ],
    links: [
      { label: "プロジェクト設定", href: "/dashboard/config/project", helper: "基本設定を見る" },
      { label: "ペルソナ", href: "/dashboard/config/personas", helper: "担当する購買層を見る" },
      { label: "改善プラン", href: `${reportBase}/action-plan`, helper: "担当タスクの流れを見る" }
    ]
  },
  apiIntegrations: {
    outcome: "外部ツールとRecoraのデータ連携を管理し、将来の自動取得や共有に備える画面です。",
    canCheck: [
      "連携予定のデータ取得元と出力先",
      "レポート共有、エクスポート、通知に関わる接続方針",
      "外部連携を入れないサンプル状態での設計範囲"
    ],
    planned: [
      "APIキー、Webhook、通知先の管理",
      "定期実行、外部BI、タスク管理ツール連携",
      "連携ログと失敗時の再試行"
    ],
    requiredData: [
      "連携先、認証情報",
      "測定スケジュール、出力先",
      "Webhookイベントと配信状態"
    ],
    links: [
      { label: "プロジェクト設定", href: "/dashboard/config/project", helper: "連携スコープを見る" },
      { label: "エクスポート", href: `${reportBase}/export`, helper: "出力先の想定を見る" },
      { label: "測定結果", href: `${reportBase}/runs`, helper: "将来の測定ログを見る" }
    ]
  }
};

function PlaceholderPageShell({
  summaryKey,
  eyebrow,
  tabs
}: {
  summaryKey: PlaceholderRouteKey;
  eyebrow: string;
  tabs?: readonly string[];
}) {
  const summary = placeholderRouteSummaries[summaryKey];
  const detail = placeholderPageDetails[summaryKey];

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={summary.title}
        description={summary.description}
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      {tabs ? <DetailTabs items={tabs} /> : null}

      <DataCard
        title="この画面の位置づけ"
        description="現在はサンプルデータで画面の役割を示しています。分析ロジック、外部連携、自動実行は追加していません。"
      >
        <div className="flex flex-col gap-3 rounded-[16px] border border-[#DDE8E5] bg-[#E6F4F1]/60 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="border-[#00796B]/25 bg-white text-[#00796B]">
              設計済み
            </Badge>
            <p className="mt-3 text-sm leading-6 text-slate-700">{detail.outcome}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
            Recora roadmap
          </span>
        </div>
      </DataCard>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <PlaceholderInfoCard
          label="確認"
          title="この画面で確認できること"
          items={detail.canCheck}
        />
        <PlaceholderInfoCard
          label="今後"
          title="今後追加される分析・機能"
          items={detail.planned}
          tone="amber"
        />
        <PlaceholderInfoCard
          label="データ"
          title="必要になるデータ"
          items={detail.requiredData}
          tone="green"
        />
        <DataCard title="関連する既存画面" description="今ある分析画面から、近い情報を確認できます。">
          <div className="space-y-3">
            {detail.links.map((link) => (
              <PlaceholderLink key={link.href} href={link.href} label={link.label} helper={link.helper} />
            ))}
          </div>
        </DataCard>
      </div>
    </>
  );
}

function PlaceholderInfoCard({
  label,
  title,
  items,
  tone = "blue"
}: {
  label: string;
  title: string;
  items: string[];
  tone?: "blue" | "amber" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-[#00796B]/25 bg-[#E6F4F1] text-[#00796B]";

  return (
    <DataCard
      title={title}
      action={
        <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", toneClass)}>
          {label}
        </Badge>
      }
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <span
              className={cn(
                "mt-2 h-2 w-2 shrink-0 rounded-full",
                tone === "amber" && "bg-orange-500",
                tone === "green" && "bg-emerald-500",
                tone === "blue" && "bg-teal-600"
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </DataCard>
  );
}

function PlaceholderLink({ href, label, helper }: { href: string; label: string; helper: string }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-[16px] border border-[#DDE8E5] bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-[#00796B]/25 hover:bg-[#E6F4F1] hover:text-[#005C50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500 group-hover:text-[#00796B]">
          {helper}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export function ReportHistoryPage() {
  return <PlaceholderPageShell summaryKey="reportHistory" eyebrow="レポート" />;
}

export function RunResultsPage() {
  return <PlaceholderPageShell summaryKey="runResults" eyebrow="レポート" />;
}

export function ReportExportPage() {
  return <PlaceholderPageShell summaryKey="export" eyebrow="レポート" />;
}

export function PromptsAnalysisPage() {
  return <PlaceholderPageShell summaryKey="prompts" eyebrow="モニタリング" tabs={reportDetailTabs.prompts} />;
}

export function RecommendationsPage({ recommendationsData = null }: { recommendationsData?: RecoraRecommendationsDbData | null }) {
  return <RecommendationsDbPage recommendationsData={recommendationsData} />;
}

export function MisinformationRisksPage() {
  return <PlaceholderPageShell summaryKey="misinformationRisks" eyebrow="改善" />;
}

export function ActionPlanPage() {
  return <PlaceholderPageShell summaryKey="actionPlan" eyebrow="改善" tabs={reportDetailTabs.actionPlan} />;
}

export function TeamConfigPage() {
  return <PlaceholderPageShell summaryKey="team" eyebrow="設定" />;
}

export function ApiIntegrationsConfigPage() {
  return <PlaceholderPageShell summaryKey="apiIntegrations" eyebrow="設定" />;
}

export function PersonasConfigPage({ topicsPromptsData = null }: { topicsPromptsData?: RecoraTopicsPromptsDbData | null }) {
  const project = topicsPromptsData?.project ?? null;
  const dbPersonas = topicsPromptsData?.personas ?? [];
  const dbPrompts = topicsPromptsData?.prompts ?? [];
  const activePromptCount = dbPrompts.filter((prompt) => prompt.is_active).length;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="レポート設定"
        title="ペルソナ"
        description="AI検索測定で使う購買ペルソナを確認します。ここでは測定対象の前提を見せ、成果保証やorganic discoveryの証明には使いません。"
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="ペルソナ数" value={project ? formatNullableCount(dbPersonas.length) : "-"} helper={project?.name ?? "プロジェクト未確認"} />
        <MetricTile label="プロンプト数" value={project ? formatNullableCount(dbPrompts.length) : "-"} helper="紐づく測定質問" />
        <MetricTile label="有効プロンプト数" value={project ? formatNullableCount(activePromptCount) : "-"} helper="測定対象として有効" tone="slate" />
      </div>

      <DataCard title="ペルソナ一覧" description="DBに登録された購買層と、関連プロンプト数を確認します。">
        {dbPersonas.length > 0 ? (
          <DbPersonasTable personas={dbPersonas} prompts={dbPrompts} />
        ) : (
          <EmptyStateBlock title="まだペルソナがありません" description="ペルソナが登録されると、ここで測定対象の前提を確認できます。" />
        )}
      </DataCard>
    </div>
  );
}

export function TopicsPromptsConfigPage() {
  return (
    <>
      <PageHeader
        eyebrow="設定"
        title="トピック・プロンプト"
        description="AI回答を観測するトピックとプロンプトです。サンプルでは主要8プロンプトを表示しています。"
        meta={<ReportFilters compact />}
        actions={
          <>
            <Button variant="outline">
              <Search className="h-4 w-4" />
              プロンプト検索
            </Button>
            <HeaderActions />
          </>
        }
      />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[0.8fr_1.2fr]">
        <DataCard title="トピック">
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.id} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{topic.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{topic.intent}</p>
                  </div>
                  <PriorityPill value={topic.priority} />
                </div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <ScopeRow label="プロンプト" value={String(topic.promptCount)} />
                  <ScopeRow label="AI表示率" value={formatPercent(topic.visibility)} />
                  <ScopeRow label="ギャップ" value={`${topic.gap} pt`} />
                </div>
              </div>
            ))}
          </div>
        </DataCard>
        <DataCard title="プロンプト">
          <PromptCoverageTable compact />
        </DataCard>
      </div>
    </>
  );
}

export function CompetitorsConfigPage({ dashboardData = null }: { dashboardData?: RecoraDashboardDbData | null }) {
  const brands = dashboardData?.brands ?? [];
  const primaryBrand = brands.find((item) => item.brand_type === "primary") ?? null;
  const competitorBrands = brands.filter((item) => item.brand_type === "competitor");

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="レポート設定"
        title="比較ブランド"
        description="選択レポートで比較対象として扱うブランドを確認します。seedされた比較対象はorganic discoveryの証明として扱いません。"
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="対象ブランド" value={primaryBrand?.name ?? "-"} helper={primaryBrand?.domain ?? "未設定"} />
        <MetricTile label="比較ブランド数" value={dashboardData?.project ? formatNullableCount(competitorBrands.length) : "-"} helper="DBに登録された比較対象" />
        <MetricTile label="プロジェクト" value={dashboardData?.project?.name ?? "-"} helper="現在の設定範囲" tone="slate" />
      </div>

      <DataCard title="比較ブランド一覧" description="比較対象として登録されているブランドです。AI上の自然発見を保証するものではありません。">
        {brands.length > 0 ? (
          <DbBrandsTable brands={brands} />
        ) : (
          <EmptyStateBlock title="比較ブランドを表示できません" description="ブランド設定が登録されると、ここに対象ブランドと比較ブランドが表示されます。" />
        )}
      </DataCard>
    </div>
  );
}

export function ModelsConfigPage({ conversationsData = null }: { conversationsData?: RecoraConversationsDbData | null }) {
  const modelRows = createModelsConfigRows(conversationsData);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="レポート設定"
        title="AIモデル"
        description="このレポートで観測されたAIモデルを確認します。モデル別の表示率は、条件が揃う場合のみ参考値として扱います。"
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="観測モデル数" value={conversationsData?.project ? formatNullableCount(modelRows.length) : "-"} helper="回答ログに紐づくモデル" />
        <MetricTile label="AI回答数" value={formatNullableCount(conversationsData?.conversations.length)} helper="取得済み回答" />
        <MetricTile label="参照出現行数" value={formatNullableCount(conversationsData?.citations.length)} helper="根拠確認済み数ではありません" tone="slate" />
      </div>

      <DataCard title="AIモデル一覧" description="測定で使われたモデルと、取得済み回答・ブランド表示・参照出現を確認します。">
        {modelRows.length > 0 ? (
          <DbModelsTable rows={modelRows} />
        ) : (
          <EmptyStateBlock title="AIモデルを表示できません" description="測定が完了すると、回答ログに紐づくAIモデルがここに表示されます。" />
        )}
      </DataCard>
    </div>
  );
}

type ModelsConfigRow = {
  id: string;
  name: string;
  provider: string;
  aiAnswerCount: number;
  brandMentionCount: number;
  citationOccurrenceCount: number;
  lastMeasuredAt: string;
};

function DbPersonasTable({
  personas,
  prompts
}: {
  personas: RecoraTopicsPromptsDbData["personas"];
  prompts: RecoraTopicsPromptsDbData["prompts"];
}) {
  return (
    <Table className="min-w-[920px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[220px]">ペルソナ</TableHead>
          <TableHead>セグメント</TableHead>
          <TableHead>重み</TableHead>
          <TableHead>関連プロンプト</TableHead>
          <TableHead className="min-w-[260px]">主なジョブ</TableHead>
          <TableHead className="min-w-[260px]">確認したい課題</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personas.map((persona) => {
          const personaPrompts = prompts.filter((prompt) => prompt.persona_id === persona.id);
          const jobs = jsonToStringList(persona.jobs);
          const painPoints = jsonToStringList(persona.pain_points);

          return (
            <TableRow key={persona.id}>
              <TableCell className="min-w-[220px]">
                <div className="font-bold text-slate-950">{persona.name}</div>
                <div className="mt-1 text-xs text-slate-500">{persona.is_active ? "active" : "inactive"}</div>
              </TableCell>
              <TableCell>{persona.segment ?? "-"}</TableCell>
              <TableCell className="whitespace-nowrap">{persona.weight}</TableCell>
              <TableCell className="whitespace-nowrap font-semibold">{personaPrompts.length}件</TableCell>
              <TableCell className="min-w-[260px]">
                <TagList values={jobs} emptyLabel="未設定" />
              </TableCell>
              <TableCell className="min-w-[260px]">
                <TagList values={painPoints} emptyLabel="未設定" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DbBrandsTable({ brands }: { brands: RecoraBrandRow[] }) {
  return (
    <Table className="min-w-[860px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[220px]">ブランド</TableHead>
          <TableHead>種別</TableHead>
          <TableHead>ドメイン</TableHead>
          <TableHead>カテゴリ</TableHead>
          <TableHead>状態</TableHead>
          <TableHead className="min-w-[280px]">説明</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {brands.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="min-w-[220px]">
              <div className="font-bold text-slate-950">{item.name}</div>
              <div className="mt-1 text-xs text-slate-500">{item.reading ?? "-"}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={cn("rounded-sm", item.brand_type === "primary" ? "border-[#00796B]/25 bg-[#E6F4F1] text-[#00796B]" : "border-slate-200 bg-slate-50 text-slate-600")}>
                {item.brand_type === "primary" ? "対象ブランド" : "比較ブランド"}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{item.domain ?? "-"}</TableCell>
            <TableCell>{item.category ?? "-"}</TableCell>
            <TableCell>{item.is_active ? "active" : "inactive"}</TableCell>
            <TableCell className="min-w-[280px] text-sm leading-6 text-slate-600">
              {item.description ?? "説明は未設定です。"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function createModelsConfigRows(data?: RecoraConversationsDbData | null): ModelsConfigRow[] {
  if (!data?.project) return [];

  const modelById = new Map(data.aiModels.map((model) => [model.id, model]));
  const runItemsByModelId = groupBy(data.runItems, (item) => item.model_id);
  const runItemById = new Map(data.runItems.map((item) => [item.id, item]));
  const mentionsByConversationId = groupBy(data.brandMentions, (item) => item.conversation_id);
  const citationsByConversationId = groupBy(data.citations, (item) => item.conversation_id);

  return Array.from(modelById.values())
    .map((model) => {
      const modelRunItemIds = new Set((runItemsByModelId.get(model.id) ?? []).map((item) => item.id));
      const conversationsForModel = data.conversations.filter((conversation) => modelRunItemIds.has(conversation.run_item_id));
      const brandMentionCount = conversationsForModel.reduce((sum, conversation) => (
        sum + (mentionsByConversationId.get(conversation.id) ?? []).filter((mention) => mention.mentioned).length
      ), 0);
      const citationOccurrenceCount = conversationsForModel.reduce((sum, conversation) => (
        sum + (citationsByConversationId.get(conversation.id) ?? []).reduce((citationSum, citation) => citationSum + Number(citation.occurrence_count ?? 1), 0)
      ), 0);
      const latestMeasuredAt = conversationsForModel
        .map((conversation) => conversation.measured_at ?? conversation.captured_at)
        .sort()
        .at(-1);

      return {
        id: model.id,
        name: model.display_name,
        provider: model.provider,
        aiAnswerCount: conversationsForModel.length,
        brandMentionCount,
        citationOccurrenceCount,
        lastMeasuredAt: formatDateTime(latestMeasuredAt)
      };
    })
    .sort((a, b) => b.aiAnswerCount - a.aiAnswerCount || a.name.localeCompare(b.name));
}

function DbModelsTable({ rows }: { rows: ModelsConfigRow[] }) {
  return (
    <Table className="min-w-[840px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[220px]">AIモデル</TableHead>
          <TableHead>提供元</TableHead>
          <TableHead>AI回答数</TableHead>
          <TableHead>ブランド表示観測</TableHead>
          <TableHead>参照出現</TableHead>
          <TableHead>最終観測</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="min-w-[220px] font-bold text-slate-950">{row.name}</TableCell>
            <TableCell>{row.provider}</TableCell>
            <TableCell className="font-semibold">{row.aiAnswerCount}件</TableCell>
            <TableCell className="font-semibold">{row.brandMentionCount}件</TableCell>
            <TableCell className="font-semibold">{row.citationOccurrenceCount}件</TableCell>
            <TableCell>{row.lastMeasuredAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TagList({ values, emptyLabel }: { values: string[]; emptyLabel: string }) {
  const displayValues = values.slice(0, 4);
  if (displayValues.length === 0) {
    return <span className="text-sm text-slate-500">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayValues.map((value) => (
        <Badge key={value} variant="muted" className="font-medium">
          {value}
        </Badge>
      ))}
      {values.length > displayValues.length ? (
        <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-600">
          +{values.length - displayValues.length}
        </Badge>
      ) : null}
    </div>
  );
}

function jsonToStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => typeof item === "string" ? [item] : []);
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

export function SettingsConfigPage() {
  return (
    <>
      <PageHeader
        eyebrow="設定"
        title="プロジェクト設定"
        description="現在はプロダクト本体のサンプル状態です。外部連携、自動実行、課金設定は入れていません。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <DataCard title="プロジェクト">
          <div className="space-y-3 text-sm">
            <ScopeRow label="ワークスペース" value={sampleProject.workspace} />
            <ScopeRow label="期間" value={sampleProject.period} />
            <ScopeRow label="実行頻度" value={sampleProject.runCadence} />
            <ScopeRow label="状態" value={sampleProject.status} />
          </div>
        </DataCard>
        <DataCard title="ブランド">
          <div className="space-y-3 text-sm">
            <ScopeRow label="名前" value={brand.name} />
            <ScopeRow label="読み" value={brand.reading} />
            <ScopeRow label="ドメイン" value={brand.domain} />
            <ScopeRow label="カテゴリ" value={brand.category} />
          </div>
        </DataCard>
        <DataCard title="スコープ">
          <div className="space-y-3 text-sm">
            <ScopeRow label="ペルソナ" value={String(personas.length)} />
            <ScopeRow label="トピック" value={String(topics.length)} />
            <ScopeRow label="プロンプト" value={String(prompts.length)} />
            <ScopeRow label="AIモデル" value={String(models.length)} />
          </div>
        </DataCard>
      </div>
    </>
  );
}

function HeaderActions() {
  return (
    <>
      <Button variant="outline" className="bg-white">
        <Download className="h-4 w-4" />
        エクスポート
      </Button>
      <Button>
        <Share2 className="h-4 w-4" />
        レポート共有
      </Button>
    </>
  );
}

type ReportFilterSource = {
  project?: { name: string; default_period: string | null; updated_at: string } | null;
  latestRun?: {
    period_start: string;
    period_end: string;
    comparison_start: string | null;
    comparison_end: string | null;
    completed_at: string | null;
  } | null;
};

function createReportFilterProps(data?: ReportFilterSource | null) {
  const latestRun = data?.latestRun;
  const dateScope = getReportDateScope(latestRun?.period_start, latestRun?.period_end, data?.project?.default_period);

  return {
    projectName: data?.project?.name ?? "Recora",
    period: dateScope.value,
    periodLabel: dateScope.label,
    comparisonPeriod: latestRun?.comparison_start && latestRun.comparison_end ? latestRun.comparison_start + " - " + latestRun.comparison_end : "-",
    lastUpdated: formatDateTime(latestRun?.completed_at ?? data?.project?.updated_at)
  };
}

function ReportFilters({
  compact = false,
  dashboardView,
  projectName,
  period,
  periodLabel,
  comparisonPeriod,
  lastUpdated
}: {
  compact?: boolean;
  dashboardView?: DashboardHomeViewModel;
  projectName?: string;
  period?: string;
  periodLabel?: string;
  comparisonPeriod?: string;
  lastUpdated?: string;
}) {
  const displayProjectName = dashboardView?.projectName ?? projectName ?? "Recora";
  const displayPeriod = dashboardView?.period ?? period ?? "-";
  const displayPeriodLabel = dashboardView?.periodLabel ?? periodLabel ?? "測定日";
  const displayComparisonPeriod = dashboardView?.comparisonPeriod ?? comparisonPeriod ?? "-";
  const displayLastUpdated = dashboardView?.lastUpdated ?? lastUpdated ?? "-";

  return (
    <div className="grid gap-3 rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)] md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_0.7fr_auto]">
      <FilterBox label="プロジェクト" value={displayProjectName} />
      <FilterBox label={displayPeriodLabel} value={displayPeriod} />
      <FilterBox label="比較期間" value={displayComparisonPeriod} />
      <FilterBox label="地域" value="日本語（日本）" />
      <div className="flex items-center gap-2 rounded-[14px] bg-[#F6FAF9] px-3 py-2 text-xs font-semibold text-[#64748B]">
        <RefreshCw className="h-3.5 w-3.5 text-[#00796B]" />
        <span className="whitespace-nowrap">
          {compact ? "最終更新" : `最終更新: ${displayLastUpdated}`}
        </span>
      </div>
    </div>
  );
}

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[14px] border border-[#DDE8E5] bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-[#64748B]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#0F172A]">{value}</p>
    </div>
  );
}

function KpiGrid() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {reportLandingKpiCards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function MetricGrid() {
  const { overall } = visibilityMetrics;

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <MetricTile
        label="AI表示率"
        value={formatPercent(overall.brandVisibility)}
        helper="AI回答にRecoraが表示"
        delta={overall.movement}
      />
      <MetricTile
        label="トピック別AI表示率"
        value={formatPercent(overall.topicVisibility)}
        helper="トピック優先度で加重"
      />
      <MetricTile
        label="AIモデル別表示率"
        value={formatPercent(overall.modelVisibility)}
        helper="4つのAIモデル平均"
      />
      <MetricTile
        label="参照カバレッジ"
        value={formatPercent(overall.citationCoverage)}
        helper="自社サイト参照率"
      />
      <MetricTile
        label="平均順位"
        value={overall.averageRank.toFixed(1)}
        helper="Recora表示時の平均"
        tone="slate"
      />
    </div>
  );
}

function BrandVisibilityCard() {
  return (
    <DashboardCard
      title="AI表示率"
      description="AI回答内でのブランド別シェアです。"
      action={<Link href={`${reportBase}/overview`} className="text-xs font-bold text-[#00796B]">詳細を見る</Link>}
    >
      <DonutChart items={brandDonutItems} centerLabel="あなたのブランド" centerValue="-" />
    </DashboardCard>
  );
}

function CompetitiveRankingCard({ rows }: { rows?: DashboardRankingRow[] }) {
  const rankingRows = rows ?? [];

  return (
    <DashboardCard
      title="ブランド比較（AI表示率）"
      description="Recoraと競合のAI表示率を比較します。"
      action={<Link href={`${reportBase}/leaderboard`} className="text-xs font-bold text-[#00796B]">競合比較へ</Link>}
    >
      <div className="space-y-3">
        {rankingRows.length > 0 ? rankingRows.slice(0, 5).map((row, index) => (
          <div
            key={row.brandId}
            className={cn(
              "rounded-[16px] border border-[#DDE8E5] bg-[#F6FAF9] p-4",
              row.isPrimary && "border-[#00796B]/25 bg-[#E6F4F1]"
            )}
          >
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    index === 0 ? "bg-[#005C50] text-white" : "bg-white text-[#64748B]"
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-bold text-[#0F172A]">{row.name}</p>
                    {row.isPrimary ? <Badge className="bg-[#00796B] text-white">自社</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#64748B]">AI内シェア {row.citationShare}%</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold tracking-tight text-[#0F172A]">{row.visibility}%</p>
                <DeltaBadge value={row.competitiveGap ?? 0} label={formatSignedPt(row.competitiveGap)} />
              </div>
            </div>
            <ProgressBar value={row.visibility} className="mt-3" tone={row.isPrimary ? "blue" : "amber"} />
          </div>
        )) : (
          <EmptyStateBlock title="まだランキングデータがありません" description="測定を実行すると、競合のAI表示率がここに表示されます。" />
        )}
      </div>
    </DashboardCard>
  );
}

function PromptCategoryCard() {
  return (
    <DashboardCard
      title="プロンプトカテゴリ分析"
      description="トピック別のAI表示率、前週比、AI言及数です。"
      action={<Link href="/dashboard/config/topics-prompts" className="text-xs font-bold text-[#00796B]">カテゴリ詳細へ</Link>}
    >
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow>
            <TableHead>カテゴリ</TableHead>
            <TableHead>AI表示率</TableHead>
            <TableHead>前週比</TableHead>
            <TableHead>プロンプト数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibilityMetrics.byTopic.slice(0, 5).map((topicMetric) => {
            const topic = topics.find((item) => item.id === topicMetric.topicId);
            return (
              <TableRow key={topicMetric.topicId}>
                <TableCell className="min-w-36 font-semibold">{topic?.name}</TableCell>
                <TableCell>{topicMetric.visibility}%</TableCell>
                <TableCell><DeltaBadge value={topicMetric.movement} /></TableCell>
                <TableCell>{topic?.promptCount}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DashboardCard>
  );
}

function ModelPerformanceCard() {
  return (
    <DashboardCard
      title="AIモデル別パフォーマンス"
      description="AIモデルごとのAI表示率・参照率です。"
      action={<Link href="/dashboard/config/models" className="text-xs font-bold text-[#00796B]">すべてのAIモデル</Link>}
    >
      <ModelVisibilityTable compact />
    </DashboardCard>
  );
}

function SourceCitationCard() {
  return (
    <DashboardCard
      title="参照元分析"
      description="AI回答が参照している参照元の内訳です。"
      action={<Link href={`${reportBase}/sources`} className="text-xs font-bold text-[#00796B]">詳細を見る</Link>}
    >
      <DonutChart items={sourceDonutItems} centerLabel="参照元内訳" centerValue="100%" />
    </DashboardCard>
  );
}

function TopReferencedPagesCard() {
  return (
    <DashboardCard
      title="参照されているページ TOP5"
      description="AI回答で参照されたRecora関連ページです。"
      action={<Link href={`${reportBase}/sources`} className="text-xs font-bold text-[#00796B]">すべて見る</Link>}
    >
      <Table className="min-w-[540px]">
        <TableHeader>
          <TableRow>
            <TableHead>ページ</TableHead>
            <TableHead>参照回数</TableHead>
            <TableHead>前週比</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topReferencedPages.map((page) => (
            <TableRow key={page.page}>
            <TableCell className="min-w-[260px] font-mono text-xs font-semibold text-slate-700">{page.page}</TableCell>
              <TableCell className="font-bold">{page.citations}</TableCell>
              <TableCell><DeltaBadge value={page.delta} label={page.delta === 0 ? "-" : `+${page.delta}`} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardCard>
  );
}

function ImprovementPanel({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <aside className="min-w-0 rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-[#0F172A]">改善候補</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">承認済み施策ではなく、確認が必要な表示候補です。</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {tasks.length > 0 ? (
          tasks.slice(0, 3).map((task) => (
            <PrioritySuggestionCard
              key={task.task}
              priority={task.priority}
              title={task.task}
              description={task.action}
              reason={task.reason}
              impact={task.expectedImpact}
              href={`${reportBase}/content-opportunities`}
            />
          ))
        ) : (
          <EmptyDashboardState message="現在表示できる改善候補はありません。" />
        )}
      </div>
      <Link
        href={`${reportBase}/content-opportunities`}
        className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#00796B]"
      >
        改善候補を確認する
        <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

function PriorityTasksCard({ tasks = [] }: { tasks?: DashboardTask[] }) {
  return (
    <DashboardCard title="改善候補（確認中）" description="承認済み施策や効果保証ではありません。">
      {tasks.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {tasks.map((task) => (
          <div key={task.task} className="rounded-[16px] border border-[#DDE8E5] bg-[#F6FAF9] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityPill value={task.priority} />
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-[#008F72]">
                {task.impact}
              </Badge>
            </div>
            <p className="mt-4 text-base font-bold leading-6 text-[#0F172A]">{task.task}</p>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">{task.reason}</p>
            <div className="mt-4 space-y-2 text-sm">
              <TaskFact label="候補内容" value={task.action} />
              <TaskFact label="注意" value={task.expectedImpact} />
              <TaskFact label="関連カテゴリ" value={task.category} />
            </div>
          </div>
          ))}
        </div>
      ) : (
        <EmptyDashboardState message="現在表示できる改善候補はありません。" />
      )}
      <Link
        href={`${reportBase}/content-opportunities`}
        className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#00796B]"
      >
        改善候補を確認する
        <ArrowRight className="h-4 w-4" />
      </Link>
    </DashboardCard>
  );
}

function TaskFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-[#64748B]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#0F172A]">{value}</p>
    </div>
  );
}

function RoadmapSection() {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
      <div>
        <h2 className="text-sm font-bold text-slate-950">改善ロードマップ</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">AI検索での存在感を戻すための3ステップです。</p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {roadmapSteps.map((step) => (
          <RoadmapCard key={step.step} {...step} />
        ))}
      </div>
      <Link
        href={`${reportBase}/content-opportunities`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#00796B]"
      >
        ロードマップの詳細を見る
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function OverviewHeatmap() {
  return (
    <DataCard
      title="ペルソナ x トピック別AI表示率"
      description="どの購買ペルソナとトピックでRecoraがAI回答に出やすいかを可視化します。"
    >
      <div className="overflow-x-auto">
        <div className="min-w-[780px]">
          <div className="grid grid-cols-[168px_repeat(6,minmax(84px,1fr))] gap-1">
            <div />
            {topics.map((topic) => (
              <div key={topic.id} className="px-2 py-2 text-xs font-bold text-slate-500">
                {topic.name}
              </div>
            ))}
            {personas.map((persona) => (
              <MatrixRow key={persona.id} personaId={persona.id} personaName={persona.name} />
            ))}
          </div>
        </div>
      </div>
    </DataCard>
  );
}

function MatrixRow({ personaId, personaName }: { personaId: (typeof personas)[number]["id"]; personaName: string }) {
  return (
    <>
      <div className="flex h-11 items-center rounded-md bg-slate-50 px-2 text-xs font-bold text-slate-700">
        {personaName}
      </div>
      {topics.map((topic) => {
        const cell = visibilityMetrics.heatmap.find(
          (item) => item.personaId === personaId && item.topicId === topic.id
        );
        return <HeatmapCell key={`${personaId}-${topic.id}`} value={cell?.value ?? 0} />;
      })}
    </>
  );
}

function TopicVisibilityTable() {
  return (
    <DataCard title="トピック別AI表示率" description="トピックごとのAI表示率、参照率、改善ギャップです。">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[260px]">トピック</TableHead>
            <TableHead className="min-w-[130px]">AI表示率</TableHead>
            <TableHead className="min-w-[130px]">参照率</TableHead>
            <TableHead className="whitespace-nowrap">ギャップ</TableHead>
            <TableHead className="whitespace-nowrap">優先度</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell className="min-w-[260px]">
                <div className="font-bold text-slate-950">{topic.name}</div>
                <div className="mt-1 text-xs text-slate-500">{topic.intent}</div>
              </TableCell>
              <TableCell><MetricWithBar value={topic.visibility} /></TableCell>
              <TableCell><MetricWithBar value={topic.citationShare} /></TableCell>
              <TableCell className="whitespace-nowrap">{topic.gap} pt</TableCell>
              <TableCell><PriorityPill value={topic.priority} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataCard>
  );
}

function ModelVisibilityPanel() {
  return (
    <DataCard title="AIモデル別表示率" description="AIモデルごとのRecoraのAI表示率です。">
      <div className="space-y-4">
        {models.map((model) => (
          <div key={model.id}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-bold text-slate-950">{model.name}</p>
                <p className="text-xs text-slate-500">{model.provider}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-950">{model.visibility}%</p>
                <p className="text-xs text-slate-500">rank {model.averageRank.toFixed(1)}</p>
              </div>
            </div>
            <ProgressBar value={model.visibility} />
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function SourceSharePanel() {
  return (
    <DataCard title="上位参照元" description="AI回答が参照した主なドメインです。">
      <div className="space-y-4">
        {sources.slice(0, 6).map((source) => (
          <div key={source.domain}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-bold text-slate-950">{source.domain}</p>
                <p className="text-xs text-slate-500">{source.type}</p>
              </div>
              <span className="font-bold text-slate-950">{source.citationShare}%</span>
            </div>
            <ProgressBar value={source.citationShare} />
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function LeaderboardNarrativeTable({ rows }: { rows: DashboardRankingRow[] }) {
  return (
    <Table className="min-w-[1180px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[190px]">ブランド</TableHead>
          <TableHead className="whitespace-nowrap">表示率</TableHead>
          <TableHead className="whitespace-nowrap">表示回答</TableHead>
          <TableHead className="whitespace-nowrap">平均順位</TableHead>
          <TableHead className="min-w-[260px]">言及文脈</TableHead>
          <TableHead className="min-w-[220px]">同時に出た競合</TableHead>
          <TableHead className="min-w-[180px]">新規出現ブランド</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? rows.map((row) => (
          <TableRow key={row.brandId} className={row.isPrimary ? "bg-[#E6F4F1]/55" : undefined}>
            <TableCell className="min-w-[190px]">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-bold text-slate-950">{row.name}</span>
              {row.isPrimary ? <Badge className="bg-[#00796B] text-white">自社</Badge> : null}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                ブランド言及 {row.aiMentionCount ?? "-"}件
              </div>
            </TableCell>
            <TableCell><MetricWithBar value={row.visibility} /></TableCell>
            <TableCell className="whitespace-nowrap font-semibold text-slate-700">
              {row.displayAnswerCount ?? "-"}件
            </TableCell>
            <TableCell className="whitespace-nowrap font-semibold text-slate-700">
              {typeof row.averagePosition === "number" ? row.averagePosition.toFixed(1) : "-"}
            </TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">
              {row.mentionContext ?? "文脈は追加確認"}
            </TableCell>
            <TableCell className="min-w-[220px]">
              {row.coMentionedCompetitors && row.coMentionedCompetitors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {row.coMentionedCompetitors.map((competitor) => (
                    <Badge key={competitor} variant="muted" className="font-medium">
                      {competitor}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-500">同時出現なし</span>
              )}
            </TableCell>
            <TableCell className="min-w-[180px]">
              {row.newAppearanceNeedsVerification ? (
                <Badge variant="outline" className="whitespace-nowrap rounded-sm border-amber-200 bg-amber-50 text-amber-700">
                  {row.newAppearanceLabel ?? "NEEDS_VERIFICATION"}
                </Badge>
              ) : (
                <span className="text-sm font-semibold text-slate-700">{row.newAppearanceLabel ?? "-"}</span>
              )}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={7} className="text-sm text-slate-500">
              まだブランドの語られ方を表示できるデータがありません。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function RankingTable({ compact = false, rows }: { compact?: boolean; rows?: DashboardRankingRow[] }) {
  const rankingRows = rows ?? [];
  return (
    <Table className={compact ? undefined : "min-w-[1180px]"}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 whitespace-nowrap">順位</TableHead>
          <TableHead className="min-w-[180px]">ブランド</TableHead>
          {!compact ? <TableHead className="whitespace-nowrap">種別</TableHead> : null}
          <TableHead className="whitespace-nowrap">AI表示率</TableHead>
          {!compact ? <TableHead className="whitespace-nowrap">表示回答数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">ブランド言及数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">推薦数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">参照出現数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">Share of Voice</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">平均順位</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">競合差分</TableHead> : null}
          {!compact ? <TableHead className="min-w-[220px]">強いトピック</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankingRows.length > 0 ? rankingRows.map((row, index) => (
          <TableRow key={row.brandId} className={row.isPrimary ? "bg-[#E6F4F1]/55" : undefined}>
            <TableCell className="font-bold">
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                {index < 3 ? <Crown className="h-3.5 w-3.5 text-orange-500" /> : null}
                {index + 1}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-bold text-slate-950">{row.name}</span>
                {row.isPrimary ? <Badge className="bg-[#00796B] text-white">自社</Badge> : null}
              </div>
              {!compact && row.representativePrompt ? (
                <p className="mt-1 max-w-[320px] truncate text-xs text-slate-500">{row.representativePrompt}</p>
              ) : null}
            </TableCell>
            {!compact ? (
              <TableCell className="whitespace-nowrap">
                <Badge variant="outline" className={cn("rounded-sm", row.isPrimary ? "border-[#00796B]/25 bg-[#E6F4F1] text-[#00796B]" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  {row.brandTypeLabel ?? (row.isPrimary ? "自社" : "競合")}
                </Badge>
              </TableCell>
            ) : null}
            <TableCell><MetricWithBar value={row.visibility} /></TableCell>
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.displayAnswerCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.aiMentionCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.recommendationCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.citationCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell><MetricWithBar value={row.citationShare} /></TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.averagePosition ? row.averagePosition.toFixed(1) : "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap"><DeltaBadge value={row.competitiveGap ?? 0} label={formatSignedPt(row.competitiveGap)} /></TableCell> : null}
            {!compact ? <TableCell className="text-sm text-slate-600">{row.strongTopic ?? "-"}</TableCell> : null}
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={compact ? 3 : 12} className="text-sm text-slate-500">
              まだランキングデータがありません。測定を実行するとここに結果が表示されます。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function ModelVisibilityTable({ compact = false, rows = [] }: { compact?: boolean; rows?: LeaderboardModelRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>AIモデル</TableHead>
          <TableHead>AI表示率</TableHead>
          <TableHead>参照率</TableHead>
          {!compact ? <TableHead>平均順位</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? rows.map((model) => (
          <TableRow key={model.id}>
            <TableCell className="font-bold">{model.name}</TableCell>
            <TableCell><MetricWithBar value={model.visibility} /></TableCell>
            <TableCell><MetricWithBar value={model.citationRate} /></TableCell>
            {!compact ? <TableCell>{model.averagePosition === null ? "-" : model.averagePosition.toFixed(1)}</TableCell> : null}
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={compact ? 3 : 4} className="text-sm text-slate-500">
              表示できるデータがありません。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function SourcesTable({ rows = [] }: { rows?: SourceDisplayRow[] }) {
  return (
    <Table className="min-w-[1040px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[190px]">{"ドメイン"}</TableHead>
          <TableHead className="whitespace-nowrap">{"カテゴリ"}</TableHead>
          <TableHead className="whitespace-nowrap">{"参照出現数"}</TableHead>
          <TableHead className="whitespace-nowrap">{"参照シェア"}</TableHead>
          <TableHead className="whitespace-nowrap">{"信頼ラベル"}</TableHead>
          <TableHead className="min-w-[170px]">{"source-to-claim"}</TableHead>
          <TableHead className="min-w-[260px]">{"主なURL"}</TableHead>
          <TableHead className="min-w-[280px]">{"確認ポイント"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? rows.map((source) => (
          <TableRow key={source.domain}>
            <TableCell className="font-bold text-slate-950">
              <div>{source.domain}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {source.observationLabels.map((label) => (
                  <ObservationKindBadge key={label} kind={label === "OpenAI実測" ? "openai" : "unknown"} label={label} />
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {source.category}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap font-semibold">{source.appearances}</TableCell>
            <TableCell><MetricWithBar value={source.citationShare} /></TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-700">{source.trustLabel}</div>
                <MetricWithBar value={source.trustScore} />
              </div>
            </TableCell>
            <TableCell className="min-w-[170px]">
              <div className="flex flex-col gap-1.5 text-xs">
                <Badge variant="outline" className="w-fit rounded-sm border-[#00796B]/25 bg-[#E6F4F1] text-[#00796B]">
                  支持あり {source.supportingCitationCount}
                </Badge>
                <Badge variant="outline" className="w-fit rounded-sm border-amber-200 bg-amber-50 text-amber-700">
                  要確認 {source.needsClaimReviewCount}
                </Badge>
                <span className="font-semibold text-slate-400">{source.freshnessSummary}</span>
              </div>
            </TableCell>
            <TableCell className="min-w-[260px]">
              <div className="space-y-1.5">
                {(source.urls.length > 0 ? source.urls : [source.domain]).slice(0, 3).map((url) => (
                  <div key={url} className="flex min-w-0 items-center gap-1 text-xs text-slate-500" title={url}>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{url}</span>
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell className="min-w-[280px] text-sm leading-6 text-slate-600">
              {source.recommendedAction}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={8} className="text-sm text-slate-500">
              {"まだ参照元データがありません。測定を実行するとここに結果が表示されます。"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function CitationsTable({ rows = [] }: { rows?: CitationDisplayRow[] }) {
  return (
    <Table className="min-w-[1120px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[320px]">{"タイトル・URL"}</TableHead>
          <TableHead className="min-w-[180px]">{"ドメイン"}</TableHead>
          <TableHead className="whitespace-nowrap">{"カテゴリ"}</TableHead>
          <TableHead className="whitespace-nowrap">{"参照出現数"}</TableHead>
          <TableHead className="whitespace-nowrap">{"source freshness"}</TableHead>
          <TableHead className="min-w-[280px]">{"source-to-claim状態"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? rows.map((citation) => (
          <TableRow key={citation.id}>
            <TableCell className="min-w-[320px]">
              <div className="font-bold text-slate-950">{citation.title}</div>
              <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-500" title={citation.url}>
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{citation.url}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ObservationKindBadge kind={citation.observationKind} label={citation.observationLabel} />
                <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm text-xs", citation.webSearchLabel === "Web検索あり" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  {citation.webSearchLabel}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="font-semibold text-slate-700">{citation.domain}</TableCell>
            <TableCell>{citation.sourceType}</TableCell>
            <TableCell className="font-semibold">{citation.occurrences}</TableCell>
            <TableCell>
              <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-slate-50 text-slate-600">
                {citation.sourceFreshnessLabel}
              </Badge>
              <div className="mt-1 text-xs leading-5 text-slate-500">{citation.sourceFreshnessNote}</div>
            </TableCell>
            <TableCell className="text-sm leading-6 text-slate-600">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium",
                    citation.sourceToClaimTone === "green" && "border-[#00796B]/25 bg-[#E6F4F1] text-[#00796B]",
                    citation.sourceToClaimTone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
                    citation.sourceToClaimTone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
                    citation.sourceToClaimTone === "slate" && "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                >
                  {citation.supportsClaimLabel}
                </Badge>
                <Badge variant="muted" className="font-medium">
                  {citation.citationStatusLabel}
                </Badge>
                <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-slate-50 text-slate-600">
                  {citation.brandRelatedLabel}
                </Badge>
              </div>
              <div className="text-xs font-semibold text-slate-400">{citation.providerLabel}</div>
              {citation.claimText ? (
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{citation.claimText}</div>
              ) : null}
              {citation.citedFor}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={6} className="text-sm text-slate-500">
              {"まだ参照元データがありません。測定を実行すると参照URLが表示されます。"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function BuyerCriteriaTable() {
  return (
    <Table className="min-w-[1040px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[180px]">判断軸</TableHead>
          <TableHead className="whitespace-nowrap">重み</TableHead>
          <TableHead>Recora</TableHead>
          <TableHead>首位</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>根拠</TableHead>
          <TableHead>アクション</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {buyerCriteria.map((criteria) => (
          <TableRow key={criteria.name}>
            <TableCell className="min-w-[180px] font-bold text-slate-950">{criteria.name}</TableCell>
            <TableCell className="whitespace-nowrap">{criteria.weight}%</TableCell>
            <TableCell><MetricWithBar value={criteria.recoraScore} /></TableCell>
            <TableCell>
              <div className="font-semibold">{criteria.bestCompetitor}</div>
              <div className="mt-1 text-xs text-slate-500">{criteria.bestScore}</div>
            </TableCell>
            <TableCell><StatusPill value={criteria.status} /></TableCell>
            <TableCell className="min-w-[280px] text-sm leading-6 text-slate-600">
              {criteria.evidence}
            </TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">
              {criteria.action}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TechnicalAuditTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>チェック項目</TableHead>
          <TableHead>領域</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>スコア</TableHead>
          <TableHead>詳細</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {technicalAudit.map((item) => (
          <TableRow key={item.item}>
            <TableCell className="font-bold text-slate-950">{item.item}</TableCell>
            <TableCell>{item.area}</TableCell>
            <TableCell><StatusPill value={item.status} /></TableCell>
            <TableCell><MetricWithBar value={item.score} /></TableCell>
            <TableCell className="min-w-[340px] text-sm leading-6 text-slate-600">{item.detail}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ContentOpportunitiesTable() {
  return (
    <Table className="min-w-[1120px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[240px]">トピック</TableHead>
          <TableHead>スコア</TableHead>
          <TableHead className="whitespace-nowrap">現在</TableHead>
          <TableHead className="whitespace-nowrap">競合</TableHead>
          <TableHead className="min-w-[180px]">不足している参照元</TableHead>
          <TableHead className="whitespace-nowrap">影響プロンプト</TableHead>
          <TableHead className="min-w-[220px]">推奨ページ</TableHead>
          <TableHead>次の一手</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contentOpportunities.map((item) => (
          <TableRow key={item.topic}>
            <TableCell className="min-w-[240px] font-bold text-slate-950">{item.topic}</TableCell>
            <TableCell><MetricWithBar value={item.opportunityScore} /></TableCell>
            <TableCell className="whitespace-nowrap">{formatPercent(item.currentVisibility)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatPercent(item.competitorVisibility)}</TableCell>
            <TableCell className="min-w-[180px]">{item.missingSource}</TableCell>
            <TableCell className="whitespace-nowrap">{item.affectedPrompts}</TableCell>
            <TableCell className="min-w-[220px] font-mono text-xs text-[#00796B]">{item.recommendedPage}</TableCell>
            <TableCell className="min-w-[280px] text-sm leading-6 text-slate-600">{item.nextStep}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PersonasTable() {
  return (
    <Table className="min-w-[940px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[220px]">ペルソナ</TableHead>
          <TableHead className="min-w-[180px]">セグメント</TableHead>
          <TableHead className="whitespace-nowrap">重み</TableHead>
          <TableHead>現在のAI表示率</TableHead>
          <TableHead>ジョブ</TableHead>
          <TableHead>改善機会</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personas.map((persona) => (
          <TableRow key={persona.id}>
            <TableCell className="min-w-[220px]">
              <div className="font-bold text-slate-950">{persona.name}</div>
              <div className="mt-1 text-xs text-slate-500">{persona.pain}</div>
            </TableCell>
            <TableCell className="min-w-[180px]">{persona.segment}</TableCell>
            <TableCell className="whitespace-nowrap">{persona.weight}%</TableCell>
            <TableCell><MetricWithBar value={persona.visibility} /></TableCell>
            <TableCell className="min-w-[260px]">
              <div className="flex flex-wrap gap-1.5">
                {persona.jobs.map((job) => (
                  <Badge key={job} variant="muted" className="font-medium">{job}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">{persona.opportunity}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PromptCoverageTable({ compact = false }: { compact?: boolean }) {
  return (
    <Table className={compact ? "min-w-[760px]" : "min-w-[1080px]"}>
      <TableHeader>
        <TableRow>
          <TableHead className={compact ? "min-w-[380px]" : "min-w-[360px]"}>プロンプト</TableHead>
          {!compact ? <TableHead className="min-w-[150px]">ペルソナ</TableHead> : null}
          {!compact ? <TableHead className="min-w-[170px]">トピック</TableHead> : null}
          <TableHead className="min-w-[130px]">意図</TableHead>
          <TableHead className="whitespace-nowrap">優先度</TableHead>
          <TableHead>AI表示率</TableHead>
          {!compact ? <TableHead>ギャップ</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {prompts.map((prompt) => (
          <TableRow key={prompt.id}>
            <TableCell className={cn("font-semibold leading-6 text-slate-950", compact ? "min-w-[380px]" : "min-w-[360px]")}>
              {prompt.text}
            </TableCell>
            {!compact ? <TableCell className="min-w-[150px]">{getPersonaName(prompt.personaId)}</TableCell> : null}
            {!compact ? <TableCell className="min-w-[170px]">{getTopicName(prompt.topicId)}</TableCell> : null}
            <TableCell className="min-w-[130px] whitespace-nowrap">{prompt.intent}</TableCell>
            <TableCell><PriorityPill value={prompt.priority} /></TableCell>
            <TableCell><MetricWithBar value={prompt.visibility} /></TableCell>
            {!compact ? <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">{prompt.gap}</TableCell> : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CompetitorsTable() {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[190px]">競合</TableHead>
          <TableHead className="min-w-[180px]">カテゴリ</TableHead>
          <TableHead>AI表示率</TableHead>
          <TableHead>参照シェア</TableHead>
          <TableHead>評価</TableHead>
          <TableHead>ポジショニングメモ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {competitors.map((competitor) => (
          <TableRow key={competitor.id}>
            <TableCell className="min-w-[190px]">
              <div className="font-bold text-slate-950">{competitor.name}</div>
              <div className="mt-1 text-xs text-slate-500">{competitor.domain}</div>
            </TableCell>
            <TableCell className="min-w-[180px]">{competitor.category}</TableCell>
            <TableCell><MetricWithBar value={competitor.visibility} /></TableCell>
            <TableCell><MetricWithBar value={competitor.citationShare} /></TableCell>
            <TableCell><MetricWithBar value={competitor.sentiment} /></TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">{competitor.note}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ModelsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>AIモデル</TableHead>
          <TableHead>提供元</TableHead>
          <TableHead>AI回答数</TableHead>
          <TableHead>AI表示率</TableHead>
          <TableHead>参照率</TableHead>
          <TableHead>平均順位</TableHead>
          <TableHead>メモ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {models.map((model) => (
          <TableRow key={model.id}>
            <TableCell className="font-bold text-slate-950">{model.name}</TableCell>
            <TableCell>{model.provider}</TableCell>
            <TableCell>{model.conversations}</TableCell>
            <TableCell><MetricWithBar value={model.visibility} /></TableCell>
            <TableCell><MetricWithBar value={model.citationRate} /></TableCell>
            <TableCell>{model.averageRank.toFixed(1)}</TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">{model.note}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReportSummaryBlock({ dashboardView }: { dashboardView?: DashboardHomeViewModel }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <ScopeRow label="ブランド" value={brand.name} />
        <ScopeRow label="競合" value={String(dashboardView?.competitorCount ?? competitors.length)} />
        <ScopeRow label="ペルソナ" value={String(personas.length)} />
        <ScopeRow label="AIモデル" value={String(models.length)} />
      </div>
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">監視領域</TableHead>
            <TableHead className="min-w-[180px]">現在の状態</TableHead>
            <TableHead className="min-w-[220px]">主なリスク</TableHead>
            <TableHead className="whitespace-nowrap">次に見る画面</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ["概要", "AI表示率は一部で改善中", "サイト技術診断領域が弱い", `${reportBase}/overview`],
            ["ブランド比較", "観測順位と比較差分を確認", "上位ブランドとの差を確認", `${reportBase}/leaderboard`],
            ["参照元分析", "自社参照は31%", "競合参照元がまだ強い", `${reportBase}/sources`],
            ["選定基準分析", "2項目で勝ち", "レポート品質と技術根拠が不足", `${reportBase}/buyer-criteria`]
          ].map(([area, state, risk, href]) => (
            <TableRow key={area}>
              <TableCell className="font-bold text-slate-950">{area}</TableCell>
              <TableCell className="min-w-[180px]">{state}</TableCell>
              <TableCell className="min-w-[220px]">{risk}</TableCell>
              <TableCell>
                <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-[#00796B] hover:text-[#005C50]">
                  開く
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MetricWithBar({ value }: { value: number }) {
  return (
    <div className="min-w-28">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-950">{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function ScopeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
