import Link from "next/link";
import { RecommendationsDbPage } from "@/components/recora/recommendations-page";
import {
  ArrowRight,
  Crown,
  Download,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Share2
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
import { placeholderRouteSummaries, reportDetailTabs } from "@/lib/recora/nav-config";
import type { RecoraConversationsDbData, RecoraDashboardDbData, RecoraLeaderboardDbData, RecoraRecommendationRow, RecoraRecommendationsDbData, RecoraSourcesDbData } from "@/lib/recora/db";
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

const reportBase = `/dashboard/reports/${sampleProject.id}`;

function DetailTabs({ items, active = 0 }: { items: readonly string[]; active?: number }) {
  return (
    <div className="mb-5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <div className="flex min-w-max gap-1">
        {items.map((item, index) => (
          <span
            key={item}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-bold text-slate-500",
              index === active ? "bg-teal-700 text-white shadow-sm" : "hover:bg-teal-50 hover:text-teal-800"
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const kpiCards = [
  {
    label: "AI表示率",
    value: "8.7%",
    helper: "AI検索での表示率",
    delta: -2.1,
    deltaLabel: "前週比 -2.1pt",
    tone: "rose" as const,
    sparkline: [11, 10, 9, 10, 8, 9, 8.7, 8.7]
  },
  {
    label: "AI言及数",
    value: "156",
    helper: "回答内のブランド言及",
    delta: 18,
    deltaLabel: "前週比 +18",
    tone: "blue" as const,
    sparkline: [92, 108, 121, 116, 132, 141, 148, 156]
  },
  {
    label: "参照回数",
    value: "87",
    helper: "Recora関連の参照",
    delta: 11,
    deltaLabel: "前週比 +11",
    tone: "blue" as const,
    sparkline: [48, 54, 61, 58, 69, 72, 78, 87]
  },
  {
    label: "推定トラフィック影響",
    value: "3.2K",
    helper: "AI回答経由の推定影響",
    delta: -8.7,
    deltaLabel: "前週比 -8.7%",
    tone: "rose" as const,
    chartType: "bars" as const,
    sparkline: [18, 28, 24, 31, 26, 38, 30, 34, 22, 29]
  },
  {
    label: "平均掲載順位",
    value: "6.4 /10",
    helper: "表示時の平均順位",
    delta: 0.8,
    deltaLabel: "前週比 +0.8",
    tone: "purple" as const,
    sparkline: [4.8, 5.1, 5.6, 5.4, 6.1, 6, 6.4, 6.4]
  }
];

const brandDonutItems = [
  { label: brand.name, value: 9, color: "#2563eb" },
  { label: "Trailbase", value: 22, color: "#22c55e" },
  { label: "SignalNest", value: 19, color: "#7c3aed" },
  { label: "MentionMap", value: 15, color: "#f97316" },
  { label: "RankLens", value: 11, color: "#14b8a6" },
  { label: "その他", value: 24, color: "#cbd5e1" }
];

const sourceDonutItems = [
  { label: "公式サイト", value: 34, color: "#2563eb" },
  { label: "ニュース・メディア", value: 23, color: "#22c55e" },
  { label: "レビュー・ブログ", value: 18, color: "#14b8a6" },
  { label: "Q&A・フォーラム", value: 12, color: "#7c3aed" },
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

const priorityTasks = [
  {
    priority: "High" as const,
    task: "製品・サービスカテゴリの説明を強化",
    impact: "+2.1pt",
    category: "製品比較・カテゴリ",
    action: "製品ページにFAQと比較表を追加",
    due: "2026/06/21"
  },
  {
    priority: "High" as const,
    task: "選定基準の根拠ページを作成",
    impact: "+1.8pt",
    category: "選定基準",
    action: "評価軸、重み、証拠を1ページ化",
    due: "2026/06/24"
  },
  {
    priority: "Medium" as const,
    task: "参照されやすい外部メディアとの接点を増やす",
    impact: "+0.9pt",
    category: "参照元",
    action: "第三者レビュー・寄稿候補を整理",
    due: "2026/06/28"
  }
];

const dashboardKpiCards = [
  {
    label: "AI表示率",
    value: "8.7%",
    helper: "AI回答でRecoraが表示された割合",
    delta: -2.1,
    deltaLabel: "前週比 -2.1pt",
    tone: "rose" as const,
    sparkline: weeklyTrends.map((week) => week.recora)
  },
  {
    label: "AI言及数",
    value: "156",
    helper: "対象プロンプト内のブランド言及",
    delta: 18,
    deltaLabel: "前週比 +18",
    tone: "blue" as const,
    sparkline: [92, 108, 121, 116, 132, 141, 148, 156]
  },
  {
    label: "参照回数",
    value: "87",
    helper: "AI回答に参照された回数",
    delta: 11,
    deltaLabel: "前週比 +11",
    tone: "blue" as const,
    sparkline: [48, 54, 61, 58, 69, 72, 78, 87]
  },
  {
    label: "競合差分",
    value: "14pt",
    helper: "首位ブランドとのAI表示率の差",
    delta: -1.4,
    deltaLabel: "前週比 +1.4pt悪化",
    tone: "amber" as const,
    sparkline: [18, 17, 16, 16, 15, 14, 14]
  },
  {
    label: "改善優先度",
    value: "+5.3pt",
    helper: "優先タスク完了時の想定改善幅",
    delta: 2.1,
    deltaLabel: "前週比 +2.1pt",
    tone: "green" as const,
    sparkline: [2.2, 2.8, 3.1, 3.7, 4.4, 4.9, 5.3]
  }
];

const dashboardAlerts = [
  {
    title: "AI表示率の低下",
    description: "前週比 -2.1pt。比較・価格系プロンプトでAI表示率が下がっています。",
    tone: "rose" as const,
    href: `${reportBase}/recommendations`,
    action: "改善提案へ"
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
type DashboardKpiCardData = (typeof dashboardKpiCards)[number];
type DashboardTask = {
  priority: DashboardPriority;
  task: string;
  impact: string;
  category: string;
  action: string;
  due: string;
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
  aiMentionCount?: number;
  recommendationCount?: number;
  citationCount?: number;
  averagePosition?: number | null;
  competitiveGap?: number | null;
  strongTopic?: string;
  representativePrompt?: string;
};
type DashboardHomeViewModel = {
  projectName: string;
  period: string;
  comparisonPeriod: string;
  lastUpdated: string;
  primaryBrandName: string;
  competitorCount: number;
  aiConversationCount: number;
  brandVisibilityValue: string;
  competitiveGapDelta: number;
  kpiCards: DashboardKpiCardData[];
  rankingRows: DashboardRankingRow[];
  priorityTasks: DashboardTask[];
};

function createDashboardHomeViewModel(data?: RecoraDashboardDbData | null): DashboardHomeViewModel {
  if (!data?.project) {
    return createSampleDashboardHomeViewModel();
  }

  const primaryBrand = data.brands.find((item) => item.brand_type === "primary");
  const competitorCount = data.brands.filter((item) => item.brand_type === "competitor").length;
  const brandById = new Map(data.brands.map((item) => [item.id, item]));
  const brandSnapshots = data.metricSnapshots.filter((snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id);
  const projectSnapshot = data.metricSnapshots.find((snapshot) => snapshot.scope_type === "project") ?? brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ?? null;
  const primarySnapshot = brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ?? projectSnapshot;
  const sortedBrandSnapshots = [...brandSnapshots].sort((a, b) => b.ai_visibility - a.ai_visibility);
  const topCompetitorSnapshot = sortedBrandSnapshots.find((snapshot) => snapshot.brand_id !== primaryBrand?.id);
  const brandVisibilityNumber = Math.round(primarySnapshot?.ai_visibility ?? projectSnapshot?.ai_visibility ?? 0);
  const competitiveGap = projectSnapshot?.competitive_gap ?? primarySnapshot?.competitive_gap ?? null;
  const absoluteGap = Math.abs(Math.round(competitiveGap ?? Math.max(0, (topCompetitorSnapshot?.ai_visibility ?? 0) - brandVisibilityNumber)));
  const topRecommendationImpact = Math.round(data.recommendations[0]?.impact_score ?? 0);
  const latestRun = data.latestRun;
  const mentionCount = projectSnapshot?.ai_mention_count ?? primarySnapshot?.ai_mention_count ?? data.counts.aiConversations;
  const citationCount = Math.round(Number(projectSnapshot?.citation_count ?? data.counts.citations ?? 0));

  const kpiCards: DashboardKpiCardData[] = dashboardKpiCards.map((card, index) => {
    if (index === 0) {
      return { ...card, value: formatPercent(brandVisibilityNumber), helper: (primaryBrand?.name ?? brand.name) + "のAI表示率", delta: competitiveGap ?? card.delta, deltaLabel: competitiveGap === null ? card.deltaLabel : (competitiveGap > 0 ? "+" : "") + Math.round(competitiveGap) + "pt", sparkline: buildSparkline(brandVisibilityNumber) };
    }
    if (index === 1) {
      return { ...card, value: String(mentionCount), helper: "AI回答ログから集計", delta: mentionCount, deltaLabel: String(mentionCount), sparkline: buildSparkline(mentionCount) };
    }
    if (index === 2) {
      return { ...card, value: String(citationCount), helper: "集計済み指標から表示", delta: citationCount, deltaLabel: String(citationCount), sparkline: buildSparkline(citationCount) };
    }
    if (index === 3) {
      return { ...card, value: absoluteGap + "pt", helper: "首位ブランドとの差分", delta: competitiveGap ?? -absoluteGap, deltaLabel: competitiveGap === null ? absoluteGap + "pt" : (competitiveGap > 0 ? "+" : "") + Math.round(competitiveGap) + "pt", sparkline: buildSparkline(absoluteGap) };
    }
    return { ...card, value: topRecommendationImpact > 0 ? String(topRecommendationImpact) : String(data.recommendations.length), helper: "優先提案から算出", delta: data.recommendations.length, deltaLabel: String(data.recommendations.length), sparkline: buildSparkline(topRecommendationImpact || data.recommendations.length) };
  });

  const rankingRows = sortedBrandSnapshots.map((snapshot) => {
    const snapshotBrand = snapshot.brand_id ? brandById.get(snapshot.brand_id) : undefined;
    const position = snapshot.average_position ?? 4;
    return {
      brandId: snapshot.brand_id ?? snapshot.id,
      name: snapshotBrand?.name ?? "Unknown",
      visibility: Math.round(snapshot.ai_visibility),
      citationShare: Math.round(snapshot.share_of_voice),
      sentiment: Math.round(Math.min(100, Math.max(0, snapshot.ai_visibility + 8))),
      winRate: Math.round(Math.min(100, Math.max(0, 100 - position * 14))),
      isPrimary: snapshotBrand?.brand_type === "primary"
    };
  });

  const tasksFromDb = data.recommendations.slice(0, 3).map((item, index) => toDashboardTask(item, index));

  return {
    projectName: data.project.name,
    period: latestRun ? latestRun.period_start + " - " + latestRun.period_end : data.project.default_period ?? sampleProject.period,
    comparisonPeriod: latestRun?.comparison_start && latestRun.comparison_end ? latestRun.comparison_start + " - " + latestRun.comparison_end : "-",
    lastUpdated: formatDateTime(latestRun?.completed_at ?? data.project.updated_at),
    primaryBrandName: primaryBrand?.name ?? brand.name,
    competitorCount,
    aiConversationCount: data.counts.aiConversations,
    brandVisibilityValue: formatPercent(brandVisibilityNumber),
    competitiveGapDelta: competitiveGap ?? -absoluteGap,
    kpiCards,
    rankingRows: rankingRows.length > 0 ? rankingRows : createSampleRankingRows(),
    priorityTasks: tasksFromDb.length > 0 ? tasksFromDb : priorityTasks
  };
}

function createSampleDashboardHomeViewModel(): DashboardHomeViewModel {
  return {
    projectName: sampleProject.name,
    period: "2026/06/10 - 2026/06/16",
    comparisonPeriod: "2026/06/03 - 2026/06/09",
    lastUpdated: sampleProject.lastRunAt,
    primaryBrandName: brand.name,
    competitorCount: competitors.length,
    aiConversationCount: conversations.length,
    brandVisibilityValue: "8.7%",
    competitiveGapDelta: -2.1,
    kpiCards: dashboardKpiCards,
    rankingRows: createSampleRankingRows(),
    priorityTasks
  };
}

function createSampleRankingRows(): DashboardRankingRow[] {
  return visibilityMetrics.byBrand.map((row) => ({ brandId: row.brandId, name: row.name, visibility: row.visibility, citationShare: row.citationShare, sentiment: row.sentiment, winRate: row.winRate, isPrimary: row.brandId === "recora" }));
}

type LeaderboardCompetitorCard = {
  id: string;
  name: string;
  position: string;
  note: string;
  movement: number;
};

type LeaderboardViewModel = {
  primaryBrandName: string;
  primaryVisibility: string;
  competitiveGapValue: string;
  competitiveGapDelta: number;
  primaryCitationShare: string;
  rankingRows: DashboardRankingRow[];
  competitorCards: LeaderboardCompetitorCard[];
};

type BrandMentionAggregate = {
  mentionCount: number;
  recommendationCount: number;
  scoreTotal: number;
  scoreCount: number;
  positions: number[];
  topicCounts: Map<string, number>;
  promptCounts: Map<string, number>;
};

function createLeaderboardViewModel(data?: RecoraLeaderboardDbData | null): LeaderboardViewModel {
  if (!data?.project || data.brands.length === 0) {
    return createSampleLeaderboardViewModel();
  }

  const primaryBrand = data.brands.find((item) => item.brand_type === "primary") ?? data.brands[0];
  const brandSnapshots = data.metricSnapshots.filter((snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id);
  const snapshotByBrandId = new Map(brandSnapshots.map((snapshot) => [snapshot.brand_id, snapshot]));
  const conversationById = new Map(data.conversations.map((item) => [item.id, item]));
  const runItemById = new Map(data.runItems.map((item) => [item.id, item]));
  const promptById = new Map(data.prompts.map((item) => [item.id, item]));
  const topicById = new Map(data.topics.map((item) => [item.id, item]));
  const mentionStats = new Map<string, BrandMentionAggregate>();

  for (const mention of data.brandMentions) {
    if (!mention.mentioned) continue;

    const stat = getBrandMentionAggregate(mentionStats, mention.brand_id);
    stat.mentionCount += 1;
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
  const primaryVisibility = Math.round(primarySnapshot?.ai_visibility ?? calculateVisibility(primaryStat?.mentionCount ?? 0, data.conversations.length));
  const topCompetitorVisibility = Math.max(
    0,
    ...data.brands
      .filter((item) => item.id !== primaryBrand?.id)
      .map((item) => Math.round(snapshotByBrandId.get(item.id)?.ai_visibility ?? calculateVisibility(mentionStats.get(item.id)?.mentionCount ?? 0, data.conversations.length)))
  );
  const primaryGap = Math.round(primarySnapshot?.competitive_gap ?? primaryVisibility - topCompetitorVisibility);
  const totalMentionRows = Math.max(1, data.brandMentions.filter((item) => item.mentioned).length);

  const rankingRows = data.brands
    .map((brandItem) => {
      const snapshot = snapshotByBrandId.get(brandItem.id);
      const stat = mentionStats.get(brandItem.id);
      const mentionCount = Math.round(snapshot?.ai_mention_count ?? stat?.mentionCount ?? 0);
      const citationCountFromRows = citationCounts.get(brandItem.id) ?? 0;
      const citationCount = Math.round(citationCountFromRows || snapshot?.citation_count || 0);
      const averagePosition = snapshot?.average_position ?? average(stat?.positions ?? []);
      const visibility = Math.round(snapshot?.ai_visibility ?? calculateVisibility(mentionCount, data.conversations.length));
      const shareOfVoice = Math.round(snapshot?.share_of_voice ?? ((stat?.mentionCount ?? 0) / totalMentionRows) * 100);
      const scoreAverage = stat?.scoreCount ? stat.scoreTotal / stat.scoreCount : null;
      const recommendationCount = stat?.recommendationCount ?? 0;
      const winRate = mentionCount > 0 ? Math.round((recommendationCount / mentionCount) * 100) : 0;
      const strongTopic = getTopMapKey(stat?.topicCounts) ?? brandItem.category ?? "-";
      const representativePrompt = truncateText(getTopMapKey(stat?.promptCounts) ?? "", 44);

      return {
        brandId: brandItem.id,
        name: brandItem.name,
        visibility,
        citationShare: shareOfVoice,
        sentiment: scoreAverage === null ? Math.round(Math.min(100, Math.max(0, visibility + 8))) : Math.round((scoreAverage / 5) * 100),
        winRate,
        isPrimary: brandItem.brand_type === "primary",
        brandTypeLabel: brandItem.brand_type === "primary" ? "自社" : "競合",
        aiMentionCount: mentionCount,
        recommendationCount,
        citationCount,
        averagePosition,
        competitiveGap: brandItem.id === primaryBrand?.id ? primaryGap : Math.round(visibility - primaryVisibility),
        strongTopic,
        representativePrompt
      } satisfies DashboardRankingRow;
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
    primaryBrandName: primaryBrand?.name ?? brand.name,
    primaryVisibility: formatPercent(primaryRow?.visibility ?? primaryVisibility),
    competitiveGapValue: formatSignedPt(primaryGap),
    competitiveGapDelta: primaryGap,
    primaryCitationShare: formatPercent(primaryRow?.citationShare ?? Math.round(primarySnapshot?.share_of_voice ?? 0)),
    rankingRows,
    competitorCards
  };
}

function createSampleLeaderboardViewModel(): LeaderboardViewModel {
  const rankingRows = createSampleRankingRows();
  const primaryRow = rankingRows.find((row) => row.isPrimary) ?? rankingRows[0];
  const topCompetitor = rankingRows.find((row) => !row.isPrimary);
  const gap = Math.round((primaryRow?.visibility ?? 0) - (topCompetitor?.visibility ?? 0));

  return {
    primaryBrandName: brand.name,
    primaryVisibility: formatPercent(primaryRow?.visibility ?? 58),
    competitiveGapValue: formatSignedPt(gap),
    competitiveGapDelta: gap,
    primaryCitationShare: formatPercent(primaryRow?.citationShare ?? 31),
    rankingRows,
    competitorCards: competitors.map((competitor) => ({
      id: competitor.id,
      name: competitor.name,
      position: competitor.position,
      note: competitor.note,
      movement: competitor.movement
    }))
  };
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
  const rounded = Math.round(value);
  return (rounded > 0 ? "+" : "") + rounded + "pt";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "...";
}

function toDashboardTask(item: RecoraRecommendationRow, index: number): DashboardTask {
  return {
    priority: toDashboardPriority(item.priority),
    task: item.title,
    impact: Math.round(item.impact_score) + "pt",
    category: recommendationTypeLabel(item.type),
    action: item.reason ?? item.target_url ?? "???????",
    due: priorityTasks[index]?.due ?? "-"
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
  const safeValue = Math.max(1, Math.round(value));
  return [safeValue * 0.62, safeValue * 0.72, safeValue * 0.68, safeValue * 0.82, safeValue * 0.9, safeValue].map(Math.round);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return sampleProject.lastRunAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(date);
}
export function DashboardHomePage({ dashboardData = null }: { dashboardData?: RecoraDashboardDbData | null }) {
  const dashboardView = createDashboardHomeViewModel(dashboardData);

  return (
    <>
      <PageHeader
        eyebrow="Recora ダッシュボード"
        title="ダッシュボード"
        description="AI検索での現状、競合との差、次に取るべき改善アクションをひと目で確認します。"
        meta={<ReportFilters dashboardView={dashboardView} />}
        actions={<HeaderActions />}
      />

      <DashboardAlertStrip />

      <DashboardKpiGrid cards={dashboardView.kpiCards} />

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <VisibilityTrendCard dashboardView={dashboardView} />
            <CompetitiveRankingCard rows={dashboardView.rankingRows} />
          </div>
          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <ModelPerformanceCard />
            <SourceCitationCard />
          </div>
        </div>
        <div className="grid min-w-0 gap-5 content-start">
          <NextActionsCard tasks={dashboardView.priorityTasks} />
          <QuickLinksCard />
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <RecentConversationsCard />
        <RecentSourceChangesCard />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <ImprovementPanel />
        <PriorityTasksCard tasks={dashboardView.priorityTasks} />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-3">
        <PromptCategoryCard />
        <TopReferencedPagesCard />
        <BrandVisibilityCard />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <RoadmapSection />
        <DataCard
          title="レポートサマリー"
          description="ブランド、ペルソナ、トピック、AIモデルの分析対象"
        >
          <ReportSummaryBlock dashboardView={dashboardView} />
        </DataCard>
      </div>

      <div className="mt-5">
        <OverviewHeatmap />
      </div>
    </>
  );
}

function DashboardAlertStrip() {
  return (
    <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-3">
      {dashboardAlerts.map((alert) => (
        <Link
          key={alert.title}
          href={alert.href}
          className={cn(
            "group min-w-0 rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
            alert.tone === "rose" && "border-rose-200 bg-rose-50/60",
            alert.tone === "amber" && "border-amber-200 bg-amber-50/70",
            alert.tone === "blue" && "border-teal-200 bg-teal-50/70"
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  alert.tone === "rose" && "text-rose-900",
                  alert.tone === "amber" && "text-amber-900",
                  alert.tone === "blue" && "text-teal-950"
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
                alert.tone === "blue" && "text-teal-600"
              )}
            />
          </div>
          <span
            className={cn(
              "mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
              alert.tone === "rose" && "bg-white text-rose-700",
              alert.tone === "amber" && "bg-white text-amber-700",
              alert.tone === "blue" && "bg-white text-teal-700"
            )}
          >
            {alert.action}
          </span>
        </Link>
      ))}
    </div>
  );
}

function DashboardKpiGrid({ cards = dashboardKpiCards }: { cards?: DashboardKpiCardData[] }) {
  return (
    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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
  return (
    <DataCard
      title="AI表示率の推移"
      description="自社のAI表示率、首位競合、検索需要の直近推移"
      action={
        <Link href={`${reportBase}/trends`} className="text-xs font-semibold text-teal-700">
          詳細
        </Link>
      }
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">RecoraのAI表示率</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{dashboardView?.brandVisibilityValue ?? "8.7%"}</p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-rose-200 bg-rose-50 text-rose-700">
              {dashboardView ? (dashboardView.competitiveGapDelta > 0 ? "+" : "") + Math.round(dashboardView.competitiveGapDelta) + "pt" : "-2.1pt"}
            </Badge>
          </div>
          <div className="mt-4">
            <TinyBarChart
              values={weeklyTrends.map((week) => week.recora)}
              labels={weeklyTrends.map((week) => week.week)}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            価格比較と導入期間の質問で競合への言及が増えています。参照元の鮮度と比較ページの強化が優先です。
          </p>
        </div>
        <div className="grid min-w-0 gap-3">
          <DashboardScopeRow label="推定トラフィック影響" value="3.2K" tone="blue" />
          <DashboardScopeRow label="平均掲載順位" value="6.4 / 10" tone="slate" />
          <DashboardScopeRow label="分析済みAI回答" value={`${conversations.length}件`} tone="green" />
        </div>
      </div>
    </DataCard>
  );
}

function NextActionsCard({ tasks = priorityTasks }: { tasks?: DashboardTask[] }) {
  return (
    <DataCard
      title="次にやる3つ"
      description="AI表示率の回復に直結する優先アクション"
      action={
        <Link href={`${reportBase}/action-plan`} className="text-xs font-semibold text-teal-700">
          改善プランへ
        </Link>
      }
    >
      <div className="space-y-3">
        {tasks.slice(0, 3).map((task, index) => (
          <div key={task.task} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">{task.task}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{task.action}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <PriorityPill value={task.priority} />
                  <Badge variant="outline" className="whitespace-nowrap rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700">
                    {task.impact}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
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
            className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">{link.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{link.description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-teal-600 transition group-hover:translate-x-0.5" />
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
        <Link href={`${reportBase}/conversations`} className="text-xs font-semibold text-teal-700">
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
        <Link href={`${reportBase}/sources`} className="text-xs font-semibold text-teal-700">
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
              <TableCell className="whitespace-nowrap text-right font-semibold text-teal-700">
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
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          tone === "blue" && "text-teal-700",
          tone === "green" && "text-emerald-700",
          tone === "slate" && "text-slate-950"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReportsIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="レポート"
        title="レポート概要"
        description="ブランド、競合、ペルソナ、トピック、プロンプト、AIモデルを束ねた監視レポート一覧です。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="プロジェクト" value="1" helper="サンプルワークスペース" tone="slate" />
        <MetricTile label="プロンプト数" value={String(sampleProject.promptCount)} helper="6トピックで監視" />
        <MetricTile label="AI回答ログ" value={String(sampleProject.conversationCount)} helper="4つのAIモデル x ペルソナ" />
        <MetricTile label="参照回数" value={String(sampleProject.citationCount)} helper="ドメイン単位で集計" />
      </div>

      <DataCard className="mt-5" title="レポート一覧" description="現在はサンプルデータのみです。外部連携や自動実行は含めていません。">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>レポート</TableHead>
              <TableHead>ブランド</TableHead>
              <TableHead>カバレッジ</TableHead>
              <TableHead>最終更新</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <div className="font-bold text-slate-950">{sampleProject.name}</div>
                <div className="mt-1 text-xs text-slate-500">{sampleProject.workspace}</div>
              </TableCell>
              <TableCell>
                <div className="font-semibold">{brand.name}</div>
                <div className="text-xs text-slate-500">{brand.domain}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-semibold">{sampleProject.conversationCount}件のAI回答</div>
                <div className="mt-1 text-xs text-slate-500">
                  {sampleProject.promptCount}プロンプト / {sampleProject.modelCount}AIモデル
                </div>
              </TableCell>
              <TableCell>{sampleProject.lastRunAt}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">
                  {sampleProject.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm">
                  <Link href={`${reportBase}/overview`}>
                    開く
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DataCard>
    </>
  );
}

export function ReportLandingPage() {
  return (
    <>
      <PageHeader
        eyebrow="レポート"
        title={sampleProject.name}
        description="このレポートは、AI検索での自社表示とブランド評価を確認するためのRecoraサンプルです。"
        meta={<ReportFilters />}
        actions={<HeaderActions />}
      />
      <KpiGrid />
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <DataCard title="ブランド" description="監視対象のブランドです。">
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-slate-950">{brand.name}</p>
              <p className="text-sm font-medium text-slate-500">{brand.reading}</p>
            </div>
            <p className="text-sm leading-6 text-slate-600">{brand.description}</p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold">
              {brand.domain}
            </div>
          </div>
        </DataCard>
        <DataCard title="設定済みスコープ" description="分析対象の軸です。">
          <div className="grid gap-3 text-sm">
            <ScopeRow label="ペルソナ" value={`${personas.length}件`} />
            <ScopeRow label="トピック" value={`${topics.length}件`} />
            <ScopeRow label="プロンプト" value={`${prompts.length}件`} />
            <ScopeRow label="AIモデル" value={models.map((model) => model.name).join(", ")} />
          </div>
        </DataCard>
        <DataCard title="次の推奨アクション" description="改善インパクトが最も大きい項目です。">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-950">{contentOpportunities[0].topic}</p>
                <span className="font-bold text-teal-700">{contentOpportunities[0].opportunityScore}</span>
              </div>
              <ProgressBar value={contentOpportunities[0].opportunityScore} className="mt-3" />
            </div>
            <p className="text-sm leading-6 text-slate-600">{contentOpportunities[0].nextStep}</p>
          </div>
        </DataCard>
      </div>
    </>
  );
}

export function OverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="概要"
        description="AI表示率、トピック別の表示状況、AIモデル別の違い、参照元を1つの画面で確認します。"
        meta={<ReportFilters />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.overview} />
      <AlertBanner
        title="AI検索での表示率に注意が必要です"
        description="一部の購買プロンプトでRecoraのAI表示率が低下しています。サイト技術診断とコンテンツ改善案を確認してください。"
        actionLabel="改善案を見る"
      />
      <MetricGrid />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <OverviewHeatmap />
        <ModelVisibilityPanel />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <TopicVisibilityTable />
        <SourceSharePanel />
      </div>
    </>
  );
}

export function LeaderboardPage({ leaderboardData = null }: { leaderboardData?: RecoraLeaderboardDbData | null }) {
  const leaderboardView = createLeaderboardViewModel(leaderboardData);

  return (
    <>
      <PageHeader
        eyebrow="競合"
        title="競合ランキング"
        description="AI回答内での自社と競合の表示状況を、AI表示率・AI言及数・参照回数・平均順位で比較します。数値はRecora独自の測定指標です。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.leaderboard} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label={leaderboardView.primaryBrandName + "のAI表示率"} value={leaderboardView.primaryVisibility} helper="ブランド別測定データから集計" delta={leaderboardView.competitiveGapDelta} />
        <MetricTile label="競合差分" value={leaderboardView.competitiveGapValue} helper="最上位競合とのAI表示率差" tone="amber" />
        <MetricTile label="自社のAI内シェア" value={leaderboardView.primaryCitationShare} helper="ブランド別スナップショットから集計" delta={leaderboardView.competitiveGapDelta} />
      </div>

      <DataCard className="mt-5" title="ブランド別リーダーボード" description="1回の観測だけで結論づけず、測定ごとの傾向確認に使う比較表です。">
        <RankingTable rows={leaderboardView.rankingRows} />
      </DataCard>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DataCard title="競合メモ" description="AI回答内で競合が強く出ている領域と、推薦・参照の状況です。">
          <div className="space-y-3">
            {leaderboardView.competitorCards.map((competitor) => (
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
            ))}
          </div>
        </DataCard>
        <DataCard title="AIモデル別リーダーボード" description="AIモデルごとにRecoraのAI表示率が変わります。">
          <ModelVisibilityTable />
        </DataCard>
      </div>
    </>
  );
}

type ObservationKind = "sample" | "openai";

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
    return createSampleConversationDisplayRows();
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

function createSampleConversationDisplayRows(): ConversationDisplayRow[] {
  return conversations.map((conversation) => {
    const prompt = prompts.find((item) => item.id === conversation.promptId);
    return {
      id: conversation.id,
      topicName: getTopicName(conversation.topicId),
      personaName: getPersonaName(conversation.personaId),
      promptText: prompt?.text ?? conversation.promptId,
      modelName: getModelName(conversation.modelId),
      date: conversation.date,
      recoraMentioned: conversation.recoraMentioned,
      recoraRank: conversation.recoraRank,
      sentiment: conversation.sentiment,
      mentionedBrands: conversation.mentionedBrands,
      citedDomains: conversation.citedDomains,
      answerSummary: conversation.answerSummary,
      observationKind: "sample" as const,
      observationLabel: "サンプル",
      providerLabel: "不明",
      modelReturnedLabel: getModelName(conversation.modelId),
      citationStatusLabel: "不明",
      webSearchLabel: "不明",
      measuredAtLabel: conversation.date
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
  return conversation.provider === "openai" || Boolean(conversation.response_id) ? "openai" : "sample";
}

function getObservationLabel(kind: ObservationKind) {
  return kind === "openai" ? "OpenAI実測" : "サンプル";
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
          ? "border-teal-200 bg-teal-50 text-teal-700"
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
    <>
      <PageHeader
        eyebrow={"モニタリング"}
        title={"AI回答ログ"}
        description={"ペルソナ、トピック、プロンプト、AIモデルごとに取得したAI回答を確認します。"}
        meta={<ReportFilters compact />}
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
        title={"AI回答ログ"}
        description={String(conversationRows.length) + "件のAI回答について、ブランド言及、言及されたブランド、参照元を一覧化しています。"}
      >
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
                      <Badge className="bg-teal-700 text-white">{"順位 "}{conversation.recoraRank ?? "-"}</Badge>
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
      </DataCard>

      <DataCard className="mt-5" title={"調査カバレッジ"} description={"サンプルプロンプトの調査対象と現在のAI表示率です。"}>
        <PromptCoverageTable />
      </DataCard>
    </>
  );
}

export function SourcesPage({ sourcesData = null }: { sourcesData?: RecoraSourcesDbData | null }) {
  const sourceDisplay = createSourcesDisplayData(sourcesData);

  return (
    <>
      <PageHeader
        eyebrow={"モニタリング"}
        title={"参照元分析"}
        description={"AI回答で参照されたドメインとURLを、自社・競合・第三者参照元に分けて確認します。"}
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.sources} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile
          label={"参照元ドメイン"}
          value={String(sourceDisplay.uniqueDomainCount)}
          helper={String(sourceDisplay.totalCitationRows) + "件の参照URL"}
        />
        <MetricTile
          label={"自社参照シェア"}
          value={sourceDisplay.ownedCitationShare + "%"}
          helper={"自社ドメインが参照された比率"}
        />
        <MetricTile
          label={"競合参照シェア"}
          value={sourceDisplay.competitorCitationShare + "%"}
          helper={"競合ドメインが参照された比率"}
          tone="amber"
        />
        <MetricTile
          label={"第三者参照元"}
          value={String(sourceDisplay.thirdPartyDomainCount)}
          helper={"メディア・レビュー系のドメイン"}
          tone="slate"
        />
      </div>

      <DataCard
        className="mt-5"
        title={"参照元ドメイン"}
        description={"ドメイン別の参照回数、参照シェア、カテゴリ、主なURLをまとめています。"}
      >
        <SourcesTable rows={sourceDisplay.sourceRows} />
      </DataCard>

      <DataCard
        className="mt-5"
        title={"参照されたURL"}
        description={"AI回答で参照されたURLを一覧化しています。OpenAI web_search由来のURLも同じ形で扱える構成です。"}
      >
        <CitationsTable rows={sourceDisplay.citationRows} />
      </DataCard>
    </>
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
  urls: string[];
  recommendedAction: string;
  observationLabels: string[];
};

type CitationDisplayRow = {
  id: string;
  title: string;
  url: string;
  domain: string;
  sourceType: string;
  occurrences: number;
  supportsClaimLabel: string;
  citedFor: string;
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
};

function createSourcesDisplayData(data?: RecoraSourcesDbData | null): SourcesDisplayData {
  if (!data?.project) {
    return createSampleSourcesDisplayData();
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
      urls: [],
      recommendedAction: getSourceRecommendedAction(sourceType),
      observationLabels: [],
      supportedCount: 0,
      citationRows: 0
    };

    sourceRow.appearances += appearances;
    sourceRow.citationRows += 1;
    if (citation.supports_claim === true) sourceRow.supportedCount += 1;
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
      supportsClaimLabel: getSupportsClaimLabel(citation.supports_claim),
      citedFor: getCitationContext(citation.supports_claim),
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
      const supportRate = source.citationRows === 0 ? 0 : source.supportedCount / source.citationRows;
      return {
        ...source,
        citationShare: totalAppearances === 0 ? 0 : Math.round((source.appearances / totalAppearances) * 100),
        trustScore: getSourceTrustScore(source.sourceType, supportRate)
      };
    })
    .sort((a, b) => b.appearances - a.appearances);

  const thirdPartyDomainCount = sourceRows.filter((source) =>
    ["media", "review", "technical", "unknown"].includes(source.sourceType)
  ).length;

  return {
    sourceRows,
    citationRows,
    totalCitationRows: data.citations.length,
    uniqueDomainCount: sourceRows.length,
    ownedCitationShare: totalAppearances === 0 ? 0 : Math.round((ownedAppearances / totalAppearances) * 100),
    competitorCitationShare: totalAppearances === 0 ? 0 : Math.round((competitorAppearances / totalAppearances) * 100),
    thirdPartyDomainCount
  };
}

function createSampleSourcesDisplayData(): SourcesDisplayData {
  const citationRows = citations.map((citation) => ({
    id: citation.id,
    title: citation.title,
    url: citation.url,
    domain: citation.domain,
    sourceType: citation.sourceType,
    occurrences: citation.occurrences,
    supportsClaimLabel: "サンプル",
    citedFor: citation.citedFor,
    observationKind: "sample" as const,
    observationLabel: "サンプル",
    providerLabel: "不明",
    citationStatusLabel: "不明",
    webSearchLabel: "不明",
    brandRelatedLabel: "不明"
  }));

  const sourceRows = sources.map((source) => ({
    domain: source.domain,
    category: source.type,
    sourceType: source.type,
    appearances: source.appearances,
    citationShare: source.citationShare,
    trustScore: source.trustScore,
    trustLabel: "スコア " + source.trustScore,
    urls: citationRows.filter((citation) => citation.domain === source.domain).map((citation) => citation.url),
    recommendedAction: source.recommendedAction,
    observationLabels: ["サンプル"]
  }));

  return {
    sourceRows,
    citationRows,
    totalCitationRows: citationRows.length,
    uniqueDomainCount: sourceRows.length,
    ownedCitationShare: 31,
    competitorCitationShare: 51,
    thirdPartyDomainCount: 3
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

function getSupportsClaimLabel(value: boolean | null) {
  if (value === true) return "確認済み";
  if (value === false) return "要確認";
  return "未検証";
}

function getCitationContext(value: boolean | null) {
  if (value === true) return "AI回答の根拠として参照されています。";
  if (value === false) return "参照はありますが、主張との一致確認が必要です。";
  return "URLは取得済みですが、主張の支持は未検証です。";
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
      <DetailTabs items={["選定基準", "勝ち負け要因", "補強すべき根拠"]} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile label="勝ち項目" value="2 / 7" helper="参照元追跡、改善提案" tone="green" />
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
        <MetricTile label="良好" value="2" helper="エンティティ説明、改善提案" tone="green" />
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
      "出力対象に含めるKPI、AI回答ログ、参照元、改善提案",
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
      "改善提案と改善タスク"
    ],
    links: [
      { label: "参照元分析", href: `${reportBase}/sources`, helper: "出力対象の参照データを見る" },
      { label: "選定基準分析", href: `${reportBase}/buyer-criteria`, helper: "報告に使う勝ち負けを確認する" },
      { label: "改善提案", href: `${reportBase}/recommendations`, helper: "出力する施策候補を見る" }
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
      "プロンプト分類と意図別の勝ち負け集計",
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
      "改善提案から改善プランへの変換",
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
    outcome: "改善提案を30/60/90日の実行計画に落とし込み、チームで進捗を管理する画面です。",
    canCheck: [
      "優先タスク、推定効果、関連カテゴリ、期限",
      "短期で直す基盤、中期で強化するコンテンツ、長期で広げる存在感",
      "改善提案と実行タスクの接続"
    ],
    planned: [
      "30/60/90日プランとタスク管理",
      "担当者、期限、ステータス、依存関係",
      "完了タスクがAI表示率に与えた影響の記録"
    ],
    requiredData: [
      "改善提案とコンテンツ改善案",
      "サイト技術診断と参照元",
      "チームメンバーとタスク状況"
    ],
    links: [
      { label: "改善提案", href: `${reportBase}/recommendations`, helper: "施策候補を見る" },
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
        <div className="flex flex-col gap-3 rounded-lg border border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="border-teal-200 bg-white text-teal-700">
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
        : "border-teal-200 bg-teal-50 text-teal-700";

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
      className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500 group-hover:text-teal-700">
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

export function PersonasConfigPage() {
  return (
    <>
      <PageHeader
        eyebrow="設定"
        title="ペルソナ"
        description="AI回答を取得する購買ペルソナです。各ペルソナの重みがAI表示率の集計に反映されます。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DataCard title="ペルソナ設定">
        <PersonasTable />
      </DataCard>
    </>
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

export function CompetitorsConfigPage() {
  return (
    <>
      <PageHeader
        eyebrow="設定"
        title="競合"
        description="AI回答内でRecoraと比較される競合ブランドです。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DataCard title="競合セット">
        <CompetitorsTable />
      </DataCard>
    </>
  );
}

export function ModelsConfigPage() {
  return (
    <>
      <PageHeader
        eyebrow="設定"
        title="AIモデル"
        description="AI回答を取得・比較するAIモデルセットです。ここではサンプル評価値を表示しています。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DataCard title="AIモデル設定">
        <ModelsTable />
      </DataCard>
    </>
  );
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

function ReportFilters({ compact = false, dashboardView }: { compact?: boolean; dashboardView?: DashboardHomeViewModel }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)] md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_0.7fr_auto]">
      <FilterBox label="プロジェクト" value={dashboardView?.projectName ?? sampleProject.name} />
      <FilterBox label="期間" value={dashboardView?.period ?? "2026/06/10 - 2026/06/16"} />
      <FilterBox label="比較期間" value={dashboardView?.comparisonPeriod ?? "2026/06/03 - 2026/06/09"} />
      <FilterBox label="地域" value="日本語（日本）" />
      <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
        <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
        <span className="whitespace-nowrap">
          {compact ? "最終更新" : `最終更新: ${sampleProject.lastRunAt}`}
        </span>
      </div>
    </div>
  );
}

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function KpiGrid() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {kpiCards.map((card) => (
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
      action={<Link href={`${reportBase}/overview`} className="text-xs font-bold text-teal-700">詳細を見る</Link>}
    >
      <DonutChart items={brandDonutItems} centerLabel="あなたのブランド" centerValue="8.7%" />
    </DashboardCard>
  );
}

function CompetitiveRankingCard({ rows }: { rows?: DashboardRankingRow[] }) {
  return (
    <DashboardCard
      title="競合ランキング（AI表示率）"
      description="Recoraと競合のAI表示率を比較します。"
      action={<Link href={`${reportBase}/leaderboard`} className="text-xs font-bold text-teal-700">競合比較へ</Link>}
    >
      <RankingTable compact rows={rows} />
    </DashboardCard>
  );
}

function PromptCategoryCard() {
  return (
    <DashboardCard
      title="プロンプトカテゴリ分析"
      description="トピック別のAI表示率、前週比、AI言及数です。"
      action={<Link href="/dashboard/config/topics-prompts" className="text-xs font-bold text-teal-700">カテゴリ詳細へ</Link>}
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
      action={<Link href="/dashboard/config/models" className="text-xs font-bold text-teal-700">すべてのAIモデル</Link>}
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
      action={<Link href={`${reportBase}/sources`} className="text-xs font-bold text-teal-700">詳細を見る</Link>}
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
      action={<Link href={`${reportBase}/sources`} className="text-xs font-bold text-teal-700">すべて見る</Link>}
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

function ImprovementPanel() {
  return (
    <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-950">改善提案（優先度順）</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">AI表示率低下の要因に近い順で並べています。</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <PrioritySuggestionCard
          priority="High"
          title="製品・サービスカテゴリの強化"
          description="カテゴリ説明のAI表示率が低く、競合に奪われています。"
          href={`${reportBase}/content-opportunities`}
        />
        <PrioritySuggestionCard
          priority="Medium"
          title="AI参照コンテンツの最適化"
          description="参照される根拠ページを補強すると、AI表示率向上が期待できます。"
          href={`${reportBase}/sources`}
        />
        <PrioritySuggestionCard
          priority="Medium"
          title="比較プロンプトでの存在感向上"
          description="比較・選定系プロンプトでRecoraの順位が下がっています。"
          href={`${reportBase}/leaderboard`}
        />
      </div>
      <Link
        href={`${reportBase}/content-opportunities`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700"
      >
        すべての提案を見る
        <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

function PriorityTasksCard({ tasks = priorityTasks }: { tasks?: DashboardTask[] }) {
  return (
    <DashboardCard title="改善提案（優先タスク）" description="すぐに着手すべき改善タスクです。">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead>優先度</TableHead>
            <TableHead>改善タスク</TableHead>
            <TableHead>影響度</TableHead>
            <TableHead>関連カテゴリ</TableHead>
            <TableHead>推奨アクション</TableHead>
            <TableHead>期限</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.task}>
              <TableCell><PriorityPill value={task.priority} /></TableCell>
              <TableCell className="min-w-[240px] font-bold text-slate-950">{task.task}</TableCell>
              <TableCell className="whitespace-nowrap font-bold text-emerald-700">{task.impact}</TableCell>
              <TableCell className="min-w-36 whitespace-nowrap">{task.category}</TableCell>
              <TableCell className="min-w-[240px] text-sm leading-6 text-slate-600">{task.action}</TableCell>
              <TableCell>{task.due}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Link
        href={`${reportBase}/content-opportunities`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700"
      >
        すべての改善タスクを見る
        <ArrowRight className="h-4 w-4" />
      </Link>
    </DashboardCard>
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
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700"
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

function RankingTable({ compact = false, rows }: { compact?: boolean; rows?: DashboardRankingRow[] }) {
  const rankingRows = rows ?? createSampleRankingRows();
  return (
    <Table className={compact ? undefined : "min-w-[1180px]"}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 whitespace-nowrap">順位</TableHead>
          <TableHead className="min-w-[180px]">ブランド</TableHead>
          {!compact ? <TableHead className="whitespace-nowrap">種別</TableHead> : null}
          <TableHead className="whitespace-nowrap">AI表示率</TableHead>
          {!compact ? <TableHead className="whitespace-nowrap">AI言及数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">推薦数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">参照回数</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">AI内シェア</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">平均順位</TableHead> : null}
          {!compact ? <TableHead className="whitespace-nowrap">競合差分</TableHead> : null}
          {!compact ? <TableHead className="min-w-[220px]">強いトピック</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankingRows.map((row, index) => (
          <TableRow key={row.brandId} className={row.isPrimary ? "bg-teal-50/55" : undefined}>
            <TableCell className="font-bold">
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                {index < 3 ? <Crown className="h-3.5 w-3.5 text-orange-500" /> : null}
                {index + 1}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-bold text-slate-950">{row.name}</span>
                {row.isPrimary ? <Badge className="bg-teal-700 text-white">自社</Badge> : null}
              </div>
              {!compact && row.representativePrompt ? (
                <p className="mt-1 max-w-[320px] truncate text-xs text-slate-500">{row.representativePrompt}</p>
              ) : null}
            </TableCell>
            {!compact ? (
              <TableCell className="whitespace-nowrap">
                <Badge variant="outline" className={cn("rounded-sm", row.isPrimary ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  {row.brandTypeLabel ?? (row.isPrimary ? "自社" : "競合")}
                </Badge>
              </TableCell>
            ) : null}
            <TableCell><MetricWithBar value={row.visibility} /></TableCell>
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.aiMentionCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.recommendationCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.citationCount ?? "-"}</TableCell> : null}
            {!compact ? <TableCell><MetricWithBar value={row.citationShare} /></TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap font-semibold">{row.averagePosition ? row.averagePosition.toFixed(1) : "-"}</TableCell> : null}
            {!compact ? <TableCell className="whitespace-nowrap"><DeltaBadge value={row.competitiveGap ?? 0} label={formatSignedPt(row.competitiveGap)} /></TableCell> : null}
            {!compact ? <TableCell className="text-sm text-slate-600">{row.strongTopic ?? "-"}</TableCell> : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ModelVisibilityTable({ compact = false }: { compact?: boolean }) {
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
        {visibilityMetrics.byModel.map((model) => (
          <TableRow key={model.modelId}>
            <TableCell className="font-bold">{getModelName(model.modelId)}</TableCell>
            <TableCell><MetricWithBar value={model.visibility} /></TableCell>
            <TableCell><MetricWithBar value={model.citationRate} /></TableCell>
            {!compact ? <TableCell>{model.rank.toFixed(1)}</TableCell> : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SourcesTable({ rows = createSampleSourcesDisplayData().sourceRows }: { rows?: SourceDisplayRow[] }) {
  return (
    <Table className="min-w-[1040px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[190px]">{"ドメイン"}</TableHead>
          <TableHead className="whitespace-nowrap">{"カテゴリ"}</TableHead>
          <TableHead className="whitespace-nowrap">{"参照回数"}</TableHead>
          <TableHead className="whitespace-nowrap">{"参照シェア"}</TableHead>
          <TableHead className="whitespace-nowrap">{"信頼ラベル"}</TableHead>
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
                  <ObservationKindBadge key={label} kind={label === "OpenAI実測" ? "openai" : "sample"} label={label} />
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
            <TableCell colSpan={7} className="text-sm text-slate-500">
              {"参照元データはまだありません。"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function CitationsTable({ rows = createSampleSourcesDisplayData().citationRows }: { rows?: CitationDisplayRow[] }) {
  return (
    <Table className="min-w-[940px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[320px]">{"タイトル・URL"}</TableHead>
          <TableHead className="min-w-[180px]">{"ドメイン"}</TableHead>
          <TableHead className="whitespace-nowrap">{"カテゴリ"}</TableHead>
          <TableHead className="whitespace-nowrap">{"参照回数"}</TableHead>
          <TableHead className="min-w-[260px]">{"根拠確認"}</TableHead>
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
            <TableCell className="text-sm leading-6 text-slate-600">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge variant="muted" className="font-medium">
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
              {citation.citedFor}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={5} className="text-sm text-slate-500">
              {"参照URLはまだありません。"}
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
            <TableCell className="min-w-[220px] font-mono text-xs text-teal-700">{item.recommendedPage}</TableCell>
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
            ["競合ランキング", "Recoraは3位", "首位との差が14pt", `${reportBase}/leaderboard`],
            ["参照元分析", "自社参照は31%", "競合参照元がまだ強い", `${reportBase}/sources`],
            ["選定基準分析", "2項目で勝ち", "レポート品質と技術根拠が不足", `${reportBase}/buyer-criteria`]
          ].map(([area, state, risk, href]) => (
            <TableRow key={area}>
              <TableCell className="font-bold text-slate-950">{area}</TableCell>
              <TableCell className="min-w-[180px]">{state}</TableCell>
              <TableCell className="min-w-[220px]">{risk}</TableCell>
              <TableCell>
                <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-900">
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
