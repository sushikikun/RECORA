import Link from "next/link";
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
              index === active ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-50"
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
    label: "ブランド可視性",
    value: "8.7%",
    helper: "AI検索での表示率",
    delta: -2.1,
    deltaLabel: "前週比 -2.1pt",
    tone: "rose" as const,
    sparkline: [11, 10, 9, 10, 8, 9, 8.7, 8.7]
  },
  {
    label: "AI検索での言及数",
    value: "156",
    helper: "回答内のブランド言及",
    delta: 18,
    deltaLabel: "前週比 +18",
    tone: "blue" as const,
    sparkline: [92, 108, 121, 116, 132, 141, 148, 156]
  },
  {
    label: "引用・参照数",
    value: "87",
    helper: "Recora関連の引用",
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
    description: "AIが読み取りやすい事業説明、カテゴリ定義、比較軸、引用されるページ構造を整備します。",
    effect: "推定効果: +1.5pt"
  },
  {
    step: 2,
    title: "コンテンツを強化する",
    description: "購買判断軸、比較プロンプト、技術監査、ソース根拠を補強し、引用候補を増やします。",
    effect: "推定効果: +2.0pt"
  },
  {
    step: 3,
    title: "存在感を拡大する",
    description: "競合が強いトピックに対して、第三者ソースと自社ページの両方で可視性を伸ばします。",
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
    task: "購買判断軸の根拠ページを作成",
    impact: "+1.8pt",
    category: "Buyer Criteria",
    action: "評価軸、重み、証拠を1ページ化",
    due: "2026/06/24"
  },
  {
    priority: "Medium" as const,
    task: "引用されやすい外部ソースとの接点を増やす",
    impact: "+0.9pt",
    category: "Sources",
    action: "第三者レビュー・寄稿候補を整理",
    due: "2026/06/28"
  }
];

const dashboardKpiCards = [
  {
    label: "ブランド表示率",
    value: "8.7%",
    helper: "AI回答でRecoraが表示された割合",
    delta: -2.1,
    deltaLabel: "前週比 -2.1pt",
    tone: "rose" as const,
    sparkline: weeklyTrends.map((week) => week.recora)
  },
  {
    label: "AI回答での言及数",
    value: "156",
    helper: "対象プロンプト内のブランド言及",
    delta: 18,
    deltaLabel: "前週比 +18",
    tone: "blue" as const,
    sparkline: [92, 108, 121, 116, 132, 141, 148, 156]
  },
  {
    label: "引用・参照数",
    value: "87",
    helper: "AI回答に引用・参照された回数",
    delta: 11,
    deltaLabel: "前週比 +11",
    tone: "blue" as const,
    sparkline: [48, 54, 61, 58, 69, 72, 78, 87]
  },
  {
    label: "競合との差",
    value: "14pt",
    helper: "首位ブランドとの可視性ギャップ",
    delta: -1.4,
    deltaLabel: "前週比 +1.4pt悪化",
    tone: "amber" as const,
    sparkline: [18, 17, 16, 16, 15, 14, 14]
  },
  {
    label: "改善余地",
    value: "+5.3pt",
    helper: "優先タスク完了時の推定改善幅",
    delta: 2.1,
    deltaLabel: "前週比 +2.1pt",
    tone: "green" as const,
    sparkline: [2.2, 2.8, 3.1, 3.7, 4.4, 4.9, 5.3]
  }
];

const dashboardAlerts = [
  {
    title: "ブランド可視性の低下",
    description: "前週比 -2.1pt。比較・価格系プロンプトで表示率が下がっています。",
    tone: "rose" as const,
    href: `${reportBase}/recommendations`,
    action: "改善提案へ"
  },
  {
    title: "競合急上昇",
    description: "Trailbase Cloud がAI回答内の比較文脈で増加しています。",
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
    description: "実際の回答、言及位置、引用文脈を確認",
    href: `${reportBase}/conversations`
  },
  {
    title: "引用元・ソース",
    description: "引用されたドメインとページの変化を見る",
    href: `${reportBase}/sources`
  },
  {
    title: "コンテンツ改善機会",
    description: "不足しているトピックとPage Briefsを確認",
    href: `${reportBase}/content-opportunities`
  }
];

export function DashboardHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Recora dashboard"
        title="ダッシュボード"
        description="AI検索での現状、競合との差、次に取るべき改善アクションをひと目で確認します。"
        meta={<ReportFilters />}
        actions={<HeaderActions />}
      />

      <DashboardAlertStrip />

      <DashboardKpiGrid />

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <VisibilityTrendCard />
            <CompetitiveRankingCard />
          </div>
          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <ModelPerformanceCard />
            <SourceCitationCard />
          </div>
        </div>
        <div className="grid min-w-0 gap-5 content-start">
          <NextActionsCard />
          <QuickLinksCard />
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <RecentConversationsCard />
        <RecentSourceChangesCard />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <ImprovementPanel />
        <PriorityTasksCard />
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
          description="ブランド、ペルソナ、トピック、モデルの分析対象"
        >
          <ReportSummaryBlock />
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
            "group min-w-0 rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            alert.tone === "rose" && "border-rose-200 bg-rose-50/60",
            alert.tone === "amber" && "border-amber-200 bg-amber-50/70",
            alert.tone === "blue" && "border-blue-200 bg-blue-50/60"
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  alert.tone === "rose" && "text-rose-900",
                  alert.tone === "amber" && "text-amber-900",
                  alert.tone === "blue" && "text-blue-900"
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
                alert.tone === "blue" && "text-blue-600"
              )}
            />
          </div>
          <span
            className={cn(
              "mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
              alert.tone === "rose" && "bg-white text-rose-700",
              alert.tone === "amber" && "bg-white text-amber-700",
              alert.tone === "blue" && "bg-white text-blue-700"
            )}
          >
            {alert.action}
          </span>
        </Link>
      ))}
    </div>
  );
}

function DashboardKpiGrid() {
  return (
    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {dashboardKpiCards.map((card) => (
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

function VisibilityTrendCard() {
  return (
    <DataCard
      title="可視性推移"
      description="ブランド表示率、首位競合、検索需要の直近トレンド"
      action={
        <Link href={`${reportBase}/trends`} className="text-xs font-semibold text-blue-700">
          詳細
        </Link>
      }
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Recora visibility</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">8.7%</p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-rose-200 bg-rose-50 text-rose-700">
              -2.1pt
            </Badge>
          </div>
          <div className="mt-4">
            <TinyBarChart
              values={weeklyTrends.map((week) => week.recora)}
              labels={weeklyTrends.map((week) => week.week)}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            価格比較と導入期間の質問で競合への言及が増えています。引用元の鮮度と比較ページの強化が優先です。
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

function NextActionsCard() {
  return (
    <DataCard
      title="次にやる3つ"
      description="可視性回復に直結する優先アクション"
      action={
        <Link href={`${reportBase}/action-plan`} className="text-xs font-semibold text-blue-700">
          計画へ
        </Link>
      }
    >
      <div className="space-y-3">
        {priorityTasks.slice(0, 3).map((task, index) => (
          <div key={task.task} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
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
            className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">{link.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{link.description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-blue-600 transition group-hover:translate-x-0.5" />
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
        <Link href={`${reportBase}/conversations`} className="text-xs font-semibold text-blue-700">
          すべて見る
        </Link>
      }
    >
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>トピック</TableHead>
            <TableHead>モデル</TableHead>
            <TableHead>表示状況</TableHead>
            <TableHead>引用</TableHead>
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
      title="最近の引用元変化"
      description="引用・参照されたドメインの動き"
      action={
        <Link href={`${reportBase}/sources`} className="text-xs font-semibold text-blue-700">
          ソース分析へ
        </Link>
      }
    >
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>ドメイン</TableHead>
            <TableHead>種別</TableHead>
            <TableHead className="text-right">出現数</TableHead>
            <TableHead className="text-right">引用シェア</TableHead>
            <TableHead>推奨アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.slice(0, 5).map((source) => (
            <TableRow key={source.domain}>
              <TableCell className="whitespace-nowrap font-medium">{source.domain}</TableCell>
              <TableCell className="whitespace-nowrap text-slate-600">{source.type}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold">{source.appearances}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold text-blue-700">
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
          tone === "blue" && "text-blue-700",
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
        eyebrow="Reports"
        title="レポートホーム"
        description="ブランド、競合、ペルソナ、トピック、プロンプト、モデルを束ねた監視レポート一覧です。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="プロジェクト" value="1" helper="サンプルワークスペース" tone="slate" />
        <MetricTile label="プロンプト数" value={String(sampleProject.promptCount)} helper="6トピックで監視" />
        <MetricTile label="AI回答ログ" value={String(sampleProject.conversationCount)} helper="4モデル x ペルソナ" />
        <MetricTile label="引用数" value={String(sampleProject.citationCount)} helper="ドメイン単位で集計" />
      </div>

      <DataCard className="mt-5" title="レポート一覧" description="現在はサンプルデータのみです。API連携や自動実行は含めていません。">
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
                  {sampleProject.promptCount}プロンプト / {sampleProject.modelCount}モデル
                </div>
              </TableCell>
              <TableCell>{sampleProject.lastRunAt}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
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
        eyebrow="Report"
        title={sampleProject.name}
        description="このレポートはRecoraのAI visibility / brand monitoring dashboard用サンプルです。"
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
            <ScopeRow label="モデル" value={models.map((model) => model.name).join(", ")} />
          </div>
        </DataCard>
        <DataCard title="次の推奨アクション" description="最も大きい改善余地です。">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-950">{contentOpportunities[0].topic}</p>
                <span className="font-bold text-blue-700">{contentOpportunities[0].opportunityScore}</span>
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
        title="AI検索モニタリング"
        description="Brand visibility、Topic visibility、Model visibility、Sourcesを1つの画面で確認します。"
        meta={<ReportFilters />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.overview} />
      <AlertBanner
        title="AI検索での表示率に注意が必要です"
        description="一部の購買プロンプトでRecoraの表示率が低下しています。技術監査とコンテンツ改善機会を確認してください。"
        actionLabel="改善機会を見る"
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

export function LeaderboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="競合"
        title="競合ランキング"
        description="AI回答内での表示率、引用シェア、好意的な語られ方、購買判断での勝率を比較します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.leaderboard} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="Recora表示率" value="58%" helper="5ブランド中3位" delta={7} />
        <MetricTile label="首位との差分" value="14 pt" helper="Trailbaseとの差分" tone="amber" />
        <MetricTile label="自社引用シェア" value="31%" helper="recora.aiの参照" delta={5} />
      </div>

      <DataCard className="mt-5" title="ブランド別リーダーボード" description="表示率はAI回答内でブランドが出現した割合です。">
        <RankingTable />
      </DataCard>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DataCard title="競合メモ" description="AI回答で競合が勝っている主な理由です。">
          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{competitor.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{competitor.position}</p>
                  </div>
                  <DeltaBadge value={competitor.movement} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{competitor.note}</p>
              </div>
            ))}
          </div>
        </DataCard>
        <DataCard title="モデル別リーダーボード" description="モデルごとにRecoraの表示率が変わります。">
          <ModelVisibilityTable />
        </DataCard>
      </div>
    </>
  );
}

export function ConversationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="プロンプト分析 / AI回答ログ"
        description="ペルソナ、トピック、プロンプト、モデルの組み合わせごとにAI回答を確認します。"
        meta={<ReportFilters compact />}
        actions={
          <>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              絞り込み
            </Button>
            <HeaderActions />
          </>
        }
      />
      <DetailTabs items={reportDetailTabs.conversations} />

      <DataCard title="AI回答ログ" description="回答サマリー、Recora表示有無、順位、引用ドメインを一覧化しています。">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>プロンプト文脈</TableHead>
              <TableHead>モデル</TableHead>
              <TableHead>Recora</TableHead>
              <TableHead>評価</TableHead>
              <TableHead>引用ドメイン</TableHead>
              <TableHead>回答サマリー</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell className="min-w-[220px]">
                  <div className="font-bold text-slate-950">{getTopicName(conversation.topicId)}</div>
                  <div className="mt-1 text-xs text-slate-500">{getPersonaName(conversation.personaId)}</div>
                  <div className="mt-2 text-xs font-semibold text-slate-400">{conversation.date}</div>
                </TableCell>
                <TableCell className="font-semibold">{getModelName(conversation.modelId)}</TableCell>
                <TableCell>
                  {conversation.recoraMentioned ? (
                    <Badge className="bg-blue-600 text-white">順位 {conversation.recoraRank}</Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                      未表示
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <SentimentPill value={conversation.sentiment} />
                </TableCell>
                <TableCell className="min-w-[180px]">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>

      <DataCard className="mt-5" title="プロンプトカバレッジ" description="サンプルプロンプトの分析対象と現在の可視性です。">
        <PromptCoverageTable />
      </DataCard>
    </>
  );
}

export function SourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="ソース分析 / 引用分析"
        description="AI回答で引用・参照されたドメインを集計し、所有メディア、競合、第三者ソースに分けて見ます。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.sources} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile label="参照ドメイン" value={String(sources.length)} helper="ドメイン単位で集計" />
        <MetricTile label="自社引用シェア" value="31%" helper="recora.ai" delta={5} />
        <MetricTile label="競合ソースシェア" value="51%" helper="競合ドメイン合計" tone="amber" />
        <MetricTile label="第三者ソース" value="3" helper="レビュー / 業界 / 参照" tone="slate" />
      </div>

      <DataCard className="mt-5" title="ソースドメイン" description="引用シェア、出現数、信頼スコア、改善アクションをまとめています。">
        <SourcesTable />
      </DataCard>

      <DataCard className="mt-5" title="引用例" description="回答から抽出された引用候補のサンプルです。">
        <CitationsTable />
      </DataCard>
    </>
  );
}

export function TrendsPage() {
  const labels = weeklyTrends.map((week) => week.week);

  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="トレンド"
        description="週次のブランド表示率、引用カバレッジ、競合差分の推移を確認します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="6週の表示率上昇" value="+16 pt" helper="Recora brand visibility" delta={16} />
        <MetricTile label="引用カバレッジ上昇" value="+10 pt" helper="Owned citation coverage" delta={10} />
        <MetricTile label="首位との差分改善" value="-10 pt" helper="Trailbaseとの差が縮小" delta={10} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <DataCard title="Recora表示率の推移" description="週次の表示率です。">
          <TinyBarChart values={weeklyTrends.map((week) => week.recora)} labels={labels} />
        </DataCard>
        <DataCard title="引用カバレッジの推移" description="Owned sourceが引用された割合です。">
          <TinyBarChart values={weeklyTrends.map((week) => week.citations)} labels={labels} max={60} />
        </DataCard>
      </div>

      <DataCard className="mt-5" title="週次トレンドテーブル" description="主要ブランドの可視性推移です。">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>週</TableHead>
              <TableHead>Recora</TableHead>
              <TableHead>Trailbase</TableHead>
              <TableHead>SignalNest</TableHead>
              <TableHead>MentionMap</TableHead>
              <TableHead>RankLens</TableHead>
              <TableHead>自社引用</TableHead>
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
        title="購買判断軸分析"
        description="購買判断軸ごとに、Recoraが勝っている点、負けている点、次に補強すべき根拠を整理します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={["購買判断軸", "勝ち負け要因", "補強すべき根拠"]} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile label="勝ち項目" value="2 / 7" helper="引用追跡、改善提案" tone="green" />
        <MetricTile label="僅差負け" value="2" helper="カバレッジ、使いやすさ" tone="amber" />
        <MetricTile label="最大ギャップ" value="25 pt" helper="技術監査" tone="amber" />
        <MetricTile label="加重スコア" value="71" helper="サンプル加重平均" delta={4} />
      </div>

      <DataCard className="mt-5" title="判断軸スコアカード" description="AI回答が購買判断時に重視した軸をスコア化しています。">
        <BuyerCriteriaTable />
      </DataCard>
    </>
  );
}

export function BrandPerceptionPage() {
  const themes = [
    {
      label: "好意的な認識",
      value: "根拠を追えるAI検索モニタリング",
      score: 78,
      notes: "Recoraはペルソナ、プロンプト、モデル、ソース単位で証拠を追える点が評価されています。"
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
      notes: "技術監査や引用されやすい構造の説明では、競合や一般的な技術資料に流れています。"
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="分析"
        title="AIブランド認識"
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
            "ペルソナ別・プロンプト別の可視性",
            "AI回答の引用元を追跡できる",
            "競合言及からコンテンツギャップを見つけられる",
            "ガバナンス説明は今後の補強余地",
            "代理店や成長チームに向いている",
            "大手向け競合より公開事例が少ない"
          ].map((phrase) => (
            <div key={phrase} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
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
        title="技術監査"
        description="AI回答で引用されやすい構造になっているか、所有ページの読み取りやすさを確認します。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.technicalAudit} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="監査スコア" value="63" helper="チェック平均" tone="amber" />
        <MetricTile label="要改善" value="2" helper="比較根拠、購買判断軸" tone="amber" />
        <MetricTile label="良好" value="2" helper="エンティティ説明、改善提案" tone="green" />
      </div>

      <DataCard className="mt-5" title="技術監査チェック" description="完全自動実行ではなく、サンプル監査結果として表示しています。">
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
        title="コンテンツ改善機会"
        description="RecoraがAI回答で負けているトピックを見つけ、補強すべきページや根拠を優先度順に並べます。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.contentOpportunities} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="高優先トピック" value="3" helper="スコア80以上" tone="amber" />
        <MetricTile label="影響プロンプト" value="30" helper="5つの改善グループ" />
        <MetricTile label="最大競合ギャップ" value="35 pt" helper="購買判断軸" tone="amber" />
      </div>

      <DataCard className="mt-5" title="改善機会バックログ" description="トピックごとの改善ページ、影響プロンプト、次の一手です。">
        <ContentOpportunitiesTable />
      </DataCard>
    </>
  );
}

type PlaceholderRouteKey = keyof typeof placeholderRouteSummaries;

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
        title="準備中"
        description="画面構成とナビゲーションを先に用意しています。分析ロジック、API連携、自動実行はまだ追加していません。"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <PlaceholderStep
            title="表示構成"
            description="サイドバー上の位置づけと、詳細項目を置くタブ構成を確認できます。"
          />
          <PlaceholderStep
            title="既存データを維持"
            description="Recoraの既存サンプルデータと分析画面は削除せず、リンク切れだけ防いでいます。"
          />
          <PlaceholderStep
            title="次の実装余地"
            description="必要になった段階でテーブル、スコア、実行ログなどを追加できる状態です。"
          />
        </div>
      </DataCard>

      <DataCard className="mt-5" title="関連する既存画面" description="現在の分析項目は既存画面で確認できます。">
        <div className="grid gap-3 lg:grid-cols-3">
          <PlaceholderLink href={`${reportBase}/overview`} label="概要" />
          <PlaceholderLink href={`${reportBase}/conversations`} label="AI回答ログ" />
          <PlaceholderLink href={`${reportBase}/sources`} label="引用元・ソース" />
        </div>
      </DataCard>
    </>
  );
}

function PlaceholderStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        準備中
      </Badge>
      <p className="mt-3 font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function PlaceholderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
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

export function RecommendationsPage() {
  return <PlaceholderPageShell summaryKey="recommendations" eyebrow="改善" tabs={reportDetailTabs.recommendations} />;
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
        description="AI回答を取得する購買ペルソナです。各ペルソナの重みがVisibility集計に反映されます。"
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
                  <ScopeRow label="表示率" value={formatPercent(topic.visibility)} />
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
        title="モデル"
        description="AI回答を取得・比較するモデルセットです。ここではサンプル評価値を表示しています。"
        meta={<ReportFilters compact />}
        actions={<HeaderActions />}
      />
      <DataCard title="モデル設定">
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
        description="現在はプロダクト本体のサンプル状態です。API連携、自動実行、課金設定は入れていません。"
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
            <ScopeRow label="モデル" value={String(models.length)} />
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

function ReportFilters({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)] md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_0.7fr_auto]">
      <FilterBox label="プロジェクト" value={sampleProject.name} />
      <FilterBox label="期間" value="2026/06/10 - 2026/06/16" />
      <FilterBox label="比較期間" value="2026/06/03 - 2026/06/09" />
      <FilterBox label="地域" value="日本語（日本）" />
      <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
        <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
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
        label="ブランド可視性"
        value={formatPercent(overall.brandVisibility)}
        helper="AI回答にRecoraが表示"
        delta={overall.movement}
      />
      <MetricTile
        label="トピック可視性"
        value={formatPercent(overall.topicVisibility)}
        helper="トピック優先度で加重"
      />
      <MetricTile
        label="モデル可視性"
        value={formatPercent(overall.modelVisibility)}
        helper="4モデル平均"
      />
      <MetricTile
        label="引用カバレッジ"
        value={formatPercent(overall.citationCoverage)}
        helper="自社ソース引用率"
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
      title="ブランド可視性"
      description="AI回答内でのブランド別シェアです。"
      action={<Link href={`${reportBase}/overview`} className="text-xs font-bold text-blue-700">詳細を見る</Link>}
    >
      <DonutChart items={brandDonutItems} centerLabel="あなたのブランド" centerValue="8.7%" />
    </DashboardCard>
  );
}

function CompetitiveRankingCard() {
  return (
    <DashboardCard
      title="競合ランキング（可視性）"
      description="Recoraと競合のAI表示率を比較します。"
      action={<Link href={`${reportBase}/leaderboard`} className="text-xs font-bold text-blue-700">競合比較へ</Link>}
    >
      <RankingTable compact />
    </DashboardCard>
  );
}

function PromptCategoryCard() {
  return (
    <DashboardCard
      title="プロンプトカテゴリ分析"
      description="トピック別の可視性、前週比、メンション数です。"
      action={<Link href="/dashboard/config/topics-prompts" className="text-xs font-bold text-blue-700">カテゴリ詳細へ</Link>}
    >
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow>
            <TableHead>カテゴリ</TableHead>
            <TableHead>可視性</TableHead>
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
      title="モデル別パフォーマンス"
      description="AIモデルごとの表示率・引用率です。"
      action={<Link href="/dashboard/config/models" className="text-xs font-bold text-blue-700">すべてのモデル</Link>}
    >
      <ModelVisibilityTable compact />
    </DashboardCard>
  );
}

function SourceCitationCard() {
  return (
    <DashboardCard
      title="ソース・引用分析"
      description="AI回答が参照している引用元の内訳です。"
      action={<Link href={`${reportBase}/sources`} className="text-xs font-bold text-blue-700">詳細を見る</Link>}
    >
      <DonutChart items={sourceDonutItems} centerLabel="引用元内訳" centerValue="100%" />
    </DashboardCard>
  );
}

function TopReferencedPagesCard() {
  return (
    <DashboardCard
      title="引用されているページ TOP5"
      description="AI回答で参照されたRecora関連ページです。"
      action={<Link href={`${reportBase}/sources`} className="text-xs font-bold text-blue-700">すべて見る</Link>}
    >
      <Table className="min-w-[540px]">
        <TableHeader>
          <TableRow>
            <TableHead>ページ</TableHead>
            <TableHead>引用数</TableHead>
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
          <p className="mt-1 text-xs leading-5 text-slate-500">可視性低下の要因に近い順で並べています。</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <PrioritySuggestionCard
          priority="High"
          title="製品・サービスカテゴリの強化"
          description="カテゴリ説明の可視性が低く、競合に奪われています。"
          href={`${reportBase}/content-opportunities`}
        />
        <PrioritySuggestionCard
          priority="Medium"
          title="AI引用コンテンツの最適化"
          description="引用される根拠ページを補強すると、可視性向上が期待できます。"
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
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700"
      >
        すべての提案を見る
        <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

function PriorityTasksCard() {
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
          {priorityTasks.map((task) => (
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
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700"
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
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700"
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
      title="ペルソナ x トピック可視性"
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
    <DataCard title="トピック可視性" description="トピックごとの表示率、引用率、改善ギャップです。">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[260px]">トピック</TableHead>
            <TableHead className="min-w-[130px]">表示率</TableHead>
            <TableHead className="min-w-[130px]">引用率</TableHead>
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
    <DataCard title="モデル別可視性" description="モデルごとのRecora表示率です。">
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
    <DataCard title="上位ソース" description="AI回答が参照した主なドメインです。">
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

function RankingTable({ compact = false }: { compact?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">順位</TableHead>
          <TableHead>ブランド</TableHead>
          <TableHead>可視性</TableHead>
          {!compact ? <TableHead>引用シェア</TableHead> : null}
          {!compact ? <TableHead>評価</TableHead> : null}
          {!compact ? <TableHead>購買勝率</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibilityMetrics.byBrand.map((row, index) => (
          <TableRow key={row.brandId} className={row.brandId === "recora" ? "bg-blue-50/55" : undefined}>
            <TableCell className="font-bold">
              <span className="inline-flex items-center gap-1">
                {index < 3 ? <Crown className="h-3.5 w-3.5 text-orange-500" /> : null}
                {index + 1}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-950">{row.name}</span>
                {row.brandId === "recora" ? <Badge className="bg-blue-600 text-white">自社</Badge> : null}
              </div>
            </TableCell>
            <TableCell><MetricWithBar value={row.visibility} /></TableCell>
            {!compact ? <TableCell><MetricWithBar value={row.citationShare} /></TableCell> : null}
            {!compact ? <TableCell><MetricWithBar value={row.sentiment} /></TableCell> : null}
            {!compact ? <TableCell><MetricWithBar value={row.winRate} /></TableCell> : null}
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
          <TableHead>モデル</TableHead>
          <TableHead>表示率</TableHead>
          <TableHead>引用率</TableHead>
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

function SourcesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ドメイン</TableHead>
          <TableHead>種別</TableHead>
          <TableHead>出現数</TableHead>
          <TableHead>引用シェア</TableHead>
          <TableHead>信頼度</TableHead>
          <TableHead>引用トピック</TableHead>
          <TableHead>推奨アクション</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={source.domain}>
            <TableCell className="font-bold text-slate-950">{source.domain}</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {source.type}
              </Badge>
            </TableCell>
            <TableCell>{source.appearances}</TableCell>
            <TableCell><MetricWithBar value={source.citationShare} /></TableCell>
            <TableCell><MetricWithBar value={source.trustScore} /></TableCell>
            <TableCell className="min-w-[220px]">
              <div className="flex flex-wrap gap-1.5">
                {source.citedTopics.map((topic) => (
                  <Badge key={topic} variant="muted" className="font-medium">
                    {topic}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">
              {source.recommendedAction}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CitationsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>タイトル</TableHead>
          <TableHead>ドメイン</TableHead>
          <TableHead>種別</TableHead>
          <TableHead>出現数</TableHead>
          <TableHead>引用理由</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {citations.map((citation) => (
          <TableRow key={citation.id}>
            <TableCell className="min-w-[280px]">
              <div className="font-bold text-slate-950">{citation.title}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <ExternalLink className="h-3 w-3" />
                {citation.url}
              </div>
            </TableCell>
            <TableCell>{citation.domain}</TableCell>
            <TableCell>{citation.sourceType}</TableCell>
            <TableCell>{citation.occurrences}</TableCell>
            <TableCell className="text-sm leading-6 text-slate-600">{citation.citedFor}</TableCell>
          </TableRow>
        ))}
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
          <TableHead className="min-w-[180px]">不足ソース</TableHead>
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
            <TableCell className="min-w-[220px] font-mono text-xs text-blue-700">{item.recommendedPage}</TableCell>
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
          <TableHead>現在の表示率</TableHead>
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
          <TableHead>表示率</TableHead>
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
          <TableHead>表示率</TableHead>
          <TableHead>引用シェア</TableHead>
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
          <TableHead>モデル</TableHead>
          <TableHead>提供元</TableHead>
          <TableHead>AI回答数</TableHead>
          <TableHead>表示率</TableHead>
          <TableHead>引用率</TableHead>
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

function ReportSummaryBlock() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <ScopeRow label="ブランド" value={brand.name} />
        <ScopeRow label="競合" value={String(competitors.length)} />
        <ScopeRow label="ペルソナ" value={String(personas.length)} />
        <ScopeRow label="モデル" value={String(models.length)} />
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
            ["Overview", "表示率は一部で改善中", "技術監査領域が弱い", `${reportBase}/overview`],
            ["Leaderboard", "Recoraは3位", "首位との差が14pt", `${reportBase}/leaderboard`],
            ["Sources", "自社引用は31%", "競合ソースがまだ強い", `${reportBase}/sources`],
            ["Buyer criteria", "2項目で勝ち", "レポート品質と技術根拠が不足", `${reportBase}/buyer-criteria`]
          ].map(([area, state, risk, href]) => (
            <TableRow key={area}>
              <TableCell className="font-bold text-slate-950">{area}</TableCell>
              <TableCell className="min-w-[180px]">{state}</TableCell>
              <TableCell className="min-w-[220px]">{risk}</TableCell>
              <TableCell>
                <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900">
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
