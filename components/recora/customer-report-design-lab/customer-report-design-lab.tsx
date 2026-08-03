import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  CircleHelp,
  FileText,
  Gauge,
  Info,
  Layers3,
  LineChart,
  Link2,
  ListChecks,
  MessageSquareText,
  Search,
  Sparkles,
  Tag
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  brandCards,
  brandCompetitorDiff,
  brandKpis,
  categoryMatrixRows,
  categoryStrengthRows,
  categoryTrendRows,
  competitorLostQuestions,
  competitorRankingRows,
  competitorTrendRows,
  conversationSummary,
  customerReportDesignLabPages,
  executiveSummary,
  featureSentimentRows,
  getCustomerReportDesignLabHref,
  homeFocusItems,
  homeKpis,
  labScope,
  missingSources,
  modelAnswerRows,
  modelDeltas,
  modelPerceptionRows,
  modelTrendRows,
  narrativeDrivers,
  negativeSignals,
  personaEvaluationRows,
  positiveSignals,
  promptRows,
  quickAccessItems,
  rankSummary,
  recentChanges,
  recommendationRows,
  reportDetailSummary,
  reportKpis,
  reportRows,
  scopeItems,
  selectedPrompt,
  selectedRecommendation,
  sourceActions,
  sourceDomains,
  sourceGaps,
  sourceSummary,
  sourceTypes,
  sourceUrls,
  stolenSources,
  topRecommendations,
  trendEvents,
  trendMetricCards,
  type CustomerReportDesignLabPageId
} from "@/lib/recora/customer-report-design-lab/fixture";

type Tone = "default" | "green" | "amber" | "red" | "slate";

const pageIconMap: Record<CustomerReportDesignLabPageId, typeof Gauge> = {
  home: Gauge,
  reports: FileText,
  overview: Gauge,
  trends: LineChart,
  leaderboard: BarChart3,
  prompts: Search,
  conversations: MessageSquareText,
  sources: BookOpen,
  "brand-perception": Sparkles,
  recommendations: ListChecks
};

export function CustomerReportDesignLab({ activePage }: { activePage: CustomerReportDesignLabPageId }) {
  const page = customerReportDesignLabPages.find((item) => item.id === activePage) ?? customerReportDesignLabPages[0];

  return (
    <div className="min-w-0 overflow-x-hidden text-[#0F172A]" data-recora-customer-report-design-lab>
      <PageHeading eyebrow={page.eyebrow} title={page.title} />
      <div className="mt-4">
        <ScopeStrip />
      </div>
      <div className="mt-4 min-w-0">{renderPage(activePage)}</div>
    </div>
  );
}

function renderPage(activePage: CustomerReportDesignLabPageId) {
  switch (activePage) {
    case "reports":
      return <ReportsPage />;
    case "overview":
      return <OverviewPage />;
    case "trends":
      return <TrendsPage />;
    case "leaderboard":
      return <LeaderboardPage />;
    case "prompts":
      return <PromptsPage />;
    case "conversations":
      return <ConversationsPage />;
    case "sources":
      return <SourcesPage />;
    case "brand-perception":
      return <BrandPerceptionPage />;
    case "recommendations":
      return <RecommendationsPage />;
    case "home":
    default:
      return <HomePage />;
  }
}

function PageHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold leading-5 text-[#006B57]">{eyebrow}</span>
            <Badge tone="green">ローカル表示サンプル</Badge>
            <Badge>DB/API未接続</Badge>
          </div>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-normal text-[#0F172A] sm:text-[30px]">{title}</h1>
        </div>
        <div className="min-w-0 rounded-lg border border-[#DDE8E5] bg-white px-3 py-2 text-right">
          <p className="text-[12px] font-bold leading-5 text-[#64748B]">データ更新</p>
          <p className="text-[13px] font-bold leading-5 text-[#0F172A]">{labScope.updatedAt}</p>
        </div>
      </div>
    </header>
  );
}

function ScopeStrip() {
  return (
    <section className="overflow-hidden rounded-lg border border-[#DCE4E1] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="grid min-w-0 md:grid-cols-2 xl:grid-cols-[1.45fr_1.25fr_1.7fr_0.7fr_0.65fr_1.2fr_0.55fr]">
        {scopeItems.map((item) => (
          <div key={item.label} className="min-w-0 border-b border-[#E5EAE8] px-4 py-3 md:border-r xl:border-b-0 xl:last:border-r-0">
            <p className="whitespace-nowrap text-[12px] font-bold leading-5 text-[#667085]" title={item.label}>
              {item.label}
            </p>
            <p className="mt-1 whitespace-nowrap text-[13px] font-bold leading-5 text-[#101828]" title={item.value}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <div className="space-y-4">
      <HomeKpiGrid />

      <HomeSection title="今見るべき3つ">
        <div className="grid min-w-0 gap-4 p-4 lg:grid-cols-3">
          {homeFocusItems.map((item, index) => (
            <PriorityInsightCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </HomeSection>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)]">
        <HomeSection title="クイックアクセス">
          <div className="grid min-w-0 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
            {quickAccessItems.map((item) => (
              <QuickAccessCard key={item.label} item={item} />
            ))}
          </div>
        </HomeSection>

        <HomeSection title="最近の変化">
          <Timeline items={recentChanges.map((item) => [item.label, item.value, item.time, item.tone] as const)} />
        </HomeSection>
      </div>
    </div>
  );
}

function HomeKpiGrid() {
  return (
    <section className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="Home KPI">
      {homeKpis.map((item) => (
        <HomeKpiCard key={item.label} item={item} />
      ))}
    </section>
  );
}

function HomeKpiCard({ item }: { item: { label: string; value: string; delta?: string; tone?: Tone; series?: number[] } }) {
  const positive = !item.delta?.startsWith("-");
  const showBars = item.label === "高優先度改善候補";

  return (
    <article className="min-h-[148px] min-w-0 rounded-lg border border-[#DCE4E1] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="truncate text-[14px] font-bold leading-5 text-[#101828]" title={item.label}>
          {item.label}
        </p>
        <Info className="h-4 w-4 shrink-0 text-[#667085]" aria-hidden="true" strokeWidth={1.8} />
      </div>
      <div className="mt-4 flex min-w-0 items-end justify-between gap-2">
        <div className="shrink-0">
          <p className="whitespace-nowrap text-[32px] font-bold leading-none tracking-normal tabular-nums text-[#101828]" title={item.value}>
            {item.value}
          </p>
          {item.delta ? <MetricDelta delta={item.delta} positive={positive} /> : null}
        </div>
        {item.series ? <MiniTrend values={item.series} tone={positive ? "green" : "red"} bars={showBars} /> : null}
      </div>
    </article>
  );
}

function MetricDelta({ delta, positive }: { delta: string; positive: boolean }) {
  return (
    <span className={cn("mt-4 inline-flex items-center gap-1 text-[14px] font-bold tabular-nums", positive ? "text-[#1D8B5A]" : "text-[#C1121F]")}>
      <span aria-hidden="true">{positive ? "▲" : "▼"}</span>
      {delta}
    </span>
  );
}

function MiniTrend({ values, tone, bars = false }: { values: number[]; tone: "green" | "red"; bars?: boolean }) {
  const stroke = tone === "green" ? "#007A5A" : "#C1121F";
  const fill = tone === "green" ? "#8BC9A4" : "#E77979";

  if (bars) {
    const max = Math.max(...values, 1);

    return (
      <div className="flex h-11 w-16 shrink-0 items-end justify-end gap-1" aria-hidden="true">
        {values.slice(-7).map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="w-2 rounded-sm bg-[#74B98B]"
            style={{ height: `${Math.max(10, (value / max) * 40)}px` }}
          />
        ))}
      </div>
    );
  }

  return (
    <svg viewBox="0 0 96 44" className="h-11 w-16 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`mini-trend-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.22" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" points={buildMiniTrendPoints(values)} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function buildMiniTrendPoints(values: number[]) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.1, max - min);

  return values
    .map((value, index) => {
      const x = 6 + index * (84 / Math.max(1, values.length - 1));
      const y = 36 - ((value - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(" ");
}

function PriorityInsightCard({ item, index }: { item: (typeof homeFocusItems)[number]; index: number }) {
  const Icon = index === 0 ? Tag : index === 1 ? CircleHelp : Link2;

  return (
    <article className="relative flex min-h-[236px] min-w-0 flex-col rounded-lg border border-[#DCE4E1] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm bg-[#006B3F] text-[18px] font-bold leading-none text-white shadow-sm">
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-4 pt-3">
        <span className="mt-11 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8F5EC] text-[#006B57]">
          <Icon className="h-7 w-7" aria-hidden="true" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 pl-2">
          <p className="text-[14px] font-bold leading-5 text-[#344054]">{item.label}</p>
          <p className="mt-5 text-[18px] font-bold leading-7 text-[#101828]">{item.title}</p>
          <p className="mt-3 text-[14px] font-semibold leading-7 text-[#344054]">{item.metric}</p>
        </div>
      </div>
      <Link
        href={getCustomerReportDesignLabHref(item.label === "弱いカテゴリ" ? "recommendations" : item.label === "競合に負けている質問" ? "prompts" : "sources")}
        className="mt-5 flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#AFCDBF] px-4 py-3 text-[14px] font-bold leading-5 text-[#005C45] transition hover:border-[#007A5A] hover:bg-[#F2FAF5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B57]"
      >
        <span className="min-w-0 break-words">{item.action}</span>
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      </Link>
    </article>
  );
}

function QuickAccessCard({ item }: { item: (typeof quickAccessItems)[number] }) {
  const Icon = pageIconMap[item.page];

  return (
    <Link
      href={getCustomerReportDesignLabHref(item.page)}
      className="group flex min-h-[190px] min-w-0 flex-col items-center justify-between rounded-lg border border-[#DCE4E1] bg-white px-4 py-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-[#AFCDBF] hover:bg-[#FAFCFB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B57]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5EC] text-[#006B57]">
        <Icon className="h-7 w-7" aria-hidden="true" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] font-bold leading-6 text-[#101828]">{item.label}</span>
        <span className="mt-2 block text-[13px] font-semibold leading-6 text-[#475467]">{item.description}</span>
      </span>
      <ArrowUpRight className="h-5 w-5 text-[#101828] transition group-hover:text-[#006B57]" aria-hidden="true" />
    </Link>
  );
}

function HomeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#DCE4E1] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="px-5 py-4">
        <h2 className="text-[22px] font-bold leading-7 tracking-normal text-[#101828]">{title}</h2>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ReportsPage() {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Section title="レポート一覧" description="日次・週次レポートを、品質と主要指標の変化が一目で分かる密度で並べます。">
        <ReportRowsTable />
      </Section>
      <Section title="選択中レポート" description="品質・件数・次に見る場所を右側に固定して確認します。">
        <DefinitionList items={reportDetailSummary} />
        <div className="mt-4 border-t border-[#E5EAE8] pt-4">
          <p className="text-[13px] font-bold leading-6 text-[#0F172A]">次に見るべき場所</p>
          <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">概要、質問別分析、参照元、改善候補を順に確認してください。</p>
          <Link href={getCustomerReportDesignLabHref("overview")} className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#B8DCD2] px-3 py-2 text-[13px] font-bold text-[#006B57]">
            概要を開く
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>
    </div>
  );
}

function OverviewPage() {
  return (
    <div className="space-y-4">
      <Section id="overview-top" title="Executive Summary">
        <div className="grid min-w-0 gap-0 lg:grid-cols-4">
          {executiveSummary.map((item, index) => (
            <SummaryCell key={item.title} title={item.title} body={item.body} bordered={index > 0} />
          ))}
        </div>
      </Section>

      <MetricStrip items={reportKpis} columns="xl:grid-cols-6" withSparkline />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Section id="overview-middle" title="強いカテゴリ / 弱いカテゴリ">
          <CategoryStrengthTable />
        </Section>
        <Section title="上位改善候補">
          <RecommendationCompactList />
        </Section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section title="競合に負けている質問">
          <CompetitorLostTable />
        </Section>
        <Section title="欠けている参照元">
          <MissingSourcesTable />
        </Section>
      </div>

      <Section id="overview-ranking" title="競合比較ランキング（4社比較）">
        <CompetitorRankingTable />
      </Section>
    </div>
  );
}

function TrendsPage() {
  return (
    <div className="space-y-4">
      <FilterStrip left={["7日", "30日", "90日", "全期間"]} right={["日次", "週次"]} activeLeft="30日" activeRight="日次" />
      <Section title="主要指標の推移" description="AI表示率、SOV、自社サイト引用率、Average Position、Sentimentを同じ行で読み比べます。">
        <div className="grid min-w-0 gap-0 lg:grid-cols-5">
          {trendMetricCards.map((item, index) => (
            <div key={item.label} className={cn("min-w-0 px-4 py-4", index > 0 && "border-t border-[#E5EAE8] lg:border-l lg:border-t-0")}>
              <KpiCard item={item} withSparkline />
            </div>
          ))}
        </div>
      </Section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Section title="競合推移（Share of Voice）">
          <CompetitorTrendTable />
        </Section>
        <Section title="変化イベント">
          <EventTable />
        </Section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section title="カテゴリ推移（AI表示率）">
          <CategoryTrendHeatmap />
        </Section>
        <Section title="AIモデル別推移">
          <ModelTrendTable />
        </Section>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  return (
    <div className="space-y-4">
      <MetricStrip items={rankSummary.map((item) => ({ label: item.label, value: item.value, delta: item.delta, tone: "green" as const }))} columns="xl:grid-cols-5" />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Section id="leaderboard-top" title="ブランドランキング">
          <CompetitorRankingTable highlightOwn />
        </Section>
        <Section title="モデル別差分">
          <ModelDeltasTable />
        </Section>
      </div>

      <Section id="leaderboard-matrix" title="カテゴリ別 勝敗マトリクス">
        <CategoryMatrixTable />
      </Section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section id="leaderboard-gaps" title="競合に取られている質問">
          <CompetitorLostTable />
        </Section>
        <Section title="競合に取られている参照元">
          <StolenSourcesTable />
        </Section>
      </div>
    </div>
  );
}

function PromptsPage() {
  return (
    <div className="space-y-4">
      <FilterStrip left={["強い", "要改善", "弱い", "競合に負け", "自社未表示", "引用なし", "高優先度"]} right={["すべてのカテゴリ", "すべてのペルソナ"]} activeLeft="要改善" activeRight="すべてのカテゴリ" />
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Section id="prompts-table" title="質問別分析">
          <PromptTable />
        </Section>
        <Section id="prompts-detail" title="選択中の質問">
          <p className="text-[14px] font-bold leading-6 text-[#0F172A]">{selectedPrompt.question}</p>
          <div className="mt-4">
            <DefinitionList
              items={[
                { label: "prompt_type", value: selectedPrompt.promptType },
                { label: "intent", value: selectedPrompt.intent },
                { label: "自社サイト引用", value: selectedPrompt.ownedCitation },
                { label: "競合mention", value: selectedPrompt.competitorMention },
                { label: "カテゴリ評価", value: selectedPrompt.categoryEvaluation },
                { label: "ペルソナ評価", value: selectedPrompt.personaEvaluation },
                { label: "優先度", value: selectedPrompt.priority }
              ]}
            />
          </div>
          <div className="mt-4 border-t border-[#E5EAE8] pt-4">
            <p className="text-[12px] font-bold leading-5 text-[#64748B]">上位引用元</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedPrompt.topSources.map((source) => (
                <Badge key={source}>{source}</Badge>
              ))}
            </div>
            <p className="mt-4 text-[12px] font-bold leading-5 text-[#64748B]">改善アクション</p>
            <p className="mt-1 text-[13px] font-semibold leading-6 text-[#0F172A]">{selectedPrompt.action}</p>
          </div>
        </Section>
      </div>

      <Section title="ペルソナ別評価">
        <PersonaEvaluationTable />
      </Section>
    </div>
  );
}

function ConversationsPage() {
  return (
    <div className="space-y-4">
      <Section title="選択した質問">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold leading-5 text-[#64748B]">選択した質問（クエリ）</p>
            <p className="mt-1 text-[16px] font-bold leading-7 text-[#0F172A]">{conversationSummary.question}</p>
          </div>
          <Badge tone="green">{conversationSummary.tag}</Badge>
        </div>
      </Section>

      <Section id="conversations-summary" title="モデル横断の要点まとめ">
        <div className="grid min-w-0 gap-0 lg:grid-cols-5">
          <SummaryCell title="共通結論" body={conversationSummary.commonConclusion} />
          <SummaryCell title="モデル差分" body={conversationSummary.modelDifference} bordered />
          <SummaryCell title="自社に有利" body={conversationSummary.favorable} bordered />
          <SummaryCell title="自社に不利" body={conversationSummary.unfavorable} bordered />
          <SummaryCell title="次アクション" body={conversationSummary.nextAction} bordered />
        </div>
      </Section>

      <Section id="conversations-model-compare" title="モデル別回答">
        <ModelAnswerCards />
      </Section>

      <Section title="フル回答の比較">
        <ModelComparisonTable />
      </Section>
    </div>
  );
}

function SourcesPage() {
  return (
    <div className="space-y-4">
      <MetricStrip items={sourceSummary.map((item) => ({ label: item.label, value: item.value, delta: item.delta, tone: item.delta.startsWith("-") ? "red" as const : "green" as const }))} columns="xl:grid-cols-6" />
      <FilterStrip left={["ドメイン", "URL", "ソース種別", "競合に取られている参照元", "自社サイト引用", "新規出現"]} activeLeft="ドメイン" />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
        <Section id="sources-summary" title="ドメインランキング">
          <SourceDomainTable />
        </Section>
        <Section title="URLランキング">
          <SourceUrlTable />
        </Section>
        <Section title="Source Type別 集計">
          <SourceTypeTable />
        </Section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Section id="sources-gap" title="競合は引用されているが自社は引用されていない参照元">
          <SourceGapTable />
        </Section>
        <Section title="推奨アクション">
          <ActionList rows={sourceActions} />
        </Section>
      </div>
    </div>
  );
}

function BrandPerceptionPage() {
  return (
    <div className="space-y-4">
      <Section title="ブランド認知サマリー">
        <div className="grid min-w-0 gap-0 lg:grid-cols-4">
          {brandCards.map((item, index) => (
            <SummaryCell key={item.title} title={item.title} body={item.body} bordered={index > 0} />
          ))}
        </div>
      </Section>

      <MetricStrip items={brandKpis} columns="xl:grid-cols-6" withSparkline />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
        <Section title="Narrative Drivers">
          <div className="flex min-h-[220px] flex-wrap content-center items-center justify-center gap-3 px-4 py-6 text-center">
            {narrativeDrivers.map((driver) => (
              <span key={driver.word} className={cn("font-bold leading-tight", driver.weight, toneText(driver.tone))}>
                {driver.word}
              </span>
            ))}
          </div>
        </Section>
        <Section title="Feature Category Sentiment">
          <FeatureSentimentTable />
        </Section>
        <Section title="Positive Signals">
          <SignalList items={positiveSignals} tone="green" />
        </Section>
        <Section title="Negative Signals">
          <SignalList items={negativeSignals} tone="red" />
        </Section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)_420px]">
        <Section title="競合との印象差分">
          <BrandDiffBars />
        </Section>
        <Section title="モデル別認知比較">
          <ModelPerceptionTable />
        </Section>
        <Section title="認知の変化トレンド">
          <PerceptionTrend />
        </Section>
      </div>
    </div>
  );
}

function RecommendationsPage() {
  return (
    <div className="space-y-4">
      <MetricStrip
        items={[
          { label: "高優先度", value: "28", delta: "+5", tone: "red" as const },
          { label: "中優先度", value: "46", delta: "+3", tone: "amber" as const },
          { label: "低優先度", value: "35", delta: "-2", tone: "green" as const },
          { label: "未対応", value: "60", delta: "+4", tone: "slate" as const },
          { label: "対応中", value: "31", delta: "+6", tone: "green" as const },
          { label: "解消済み", value: "19", delta: "-2", tone: "green" as const }
        ]}
        columns="xl:grid-cols-6"
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Section id="recommendations-table" title="Action Center">
          <RecommendationsTable />
        </Section>
        <Section id="recommendations-detail" title="改善候補の詳細">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge tone="red">{selectedRecommendation.priority}</Badge>
              <p className="mt-3 text-[15px] font-bold leading-6 text-[#0F172A]">{selectedRecommendation.issue}</p>
              <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">
                対象質問: {selectedRecommendation.target}
              </p>
            </div>
            <Badge tone="amber">{selectedRecommendation.status}</Badge>
          </div>

          <DetailBlocks
            rows={[
              ["なぜこの候補が出たか", selectedRecommendation.why],
              ["根拠となるAI回答", selectedRecommendation.aiEvidence],
              ["根拠となる引用元", selectedRecommendation.sourceEvidence],
              ["競合が持っているもの", selectedRecommendation.competitorAssets],
              ["自社に足りないもの", selectedRecommendation.missingAssets],
              ["関連ソース", selectedRecommendation.relatedSources],
              ["競合例", selectedRecommendation.competitorExample],
              ["具体アクション", selectedRecommendation.action],
              ["期待効果", selectedRecommendation.expectedImpact]
            ]}
          />

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-[#DDE8E5]">
            <Score label="Impact" value={selectedRecommendation.impact} tone="green" />
            <Score label="Difficulty" value={selectedRecommendation.difficulty} tone="amber" />
            <Score label="Confidence" value={selectedRecommendation.confidence} tone="green" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function MetricStrip({
  items,
  columns,
  withSparkline = false
}: {
  items: { label: string; value: string; delta?: string; tone?: Tone; series?: number[] }[];
  columns: string;
  withSparkline?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#DDE8E5] bg-white">
      <div className={cn("grid min-w-0 md:grid-cols-2", columns)}>
        {items.map((item, index) => (
          <div key={item.label} className={cn("min-w-0 px-4 py-3.5", index > 0 && "border-t border-[#E5EAE8] md:border-l md:border-t-0")}>
            <KpiCard item={item} withSparkline={withSparkline} />
          </div>
        ))}
      </div>
    </section>
  );
}

function KpiCard({
  item,
  withSparkline = false
}: {
  item: { label: string; value: string; delta?: string; tone?: Tone; series?: number[] };
  withSparkline?: boolean;
}) {
  const positive = !item.delta?.startsWith("-");

  return (
    <div className="min-w-0">
      <p className="truncate text-[12px] font-bold leading-5 text-[#64748B]" title={item.label}>
        {item.label}
      </p>
      <div className="mt-1 flex min-w-0 items-baseline gap-2">
        <p className="truncate text-[24px] font-bold leading-none tracking-normal tabular-nums text-[#0F172A]" title={item.value}>
          {item.value}
        </p>
        {item.delta ? (
          <span className={cn("shrink-0 text-[12px] font-bold tabular-nums", positive ? "text-[#00796B]" : "text-[#B42318]")}>
            {item.delta}
          </span>
        ) : null}
      </div>
      {withSparkline && item.series ? <Sparkline values={item.series} tone={positive ? "green" : "red"} /> : null}
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-4 overflow-hidden rounded-lg border border-[#DDE8E5] bg-white">
      <div className="border-b border-[#E5EAE8] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <CircleDot className="h-4 w-4 shrink-0 text-[#006B57]" aria-hidden="true" strokeWidth={1.9} />
          <h2 className="min-w-0 truncate text-[16px] font-bold leading-6 text-[#0F172A]">{title}</h2>
        </div>
        {description ? <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function SummaryCell({ title, body, bordered = false }: { title: string; body: string; bordered?: boolean }) {
  return (
    <div className={cn("min-w-0 px-4 py-4", bordered && "border-t border-[#E5EAE8] lg:border-l lg:border-t-0")}>
      <div className="flex min-w-0 items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00796B]" aria-hidden="true" />
        <p className="text-[14px] font-bold leading-6 text-[#0F172A]">{title}</p>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[#334155]">{body}</p>
    </div>
  );
}

function ReportRowsTable() {
  return (
    <SimpleTable
      columns={[
        { label: "レポート名", width: "w-[19%]" },
        { label: "日付", width: "w-[9%]" },
        { label: "フォーカス", width: "w-[10%]" },
        { label: "有効観測", width: "w-[8%]" },
        { label: "AI表示率", width: "w-[8%]" },
        { label: "SOV", width: "w-[7%]" },
        { label: "自社引用率", width: "w-[8%]" },
        { label: "Sentiment", width: "w-[10%]" },
        { label: "品質", width: "w-[6%]" },
        { label: "状態", width: "w-[7%]" },
        { label: "操作", width: "w-[8%]" }
      ]}
    >
      {reportRows.map((row) => (
        <tr key={row.name}>
          <Td strong>{row.name}</Td>
          <Td>{row.date}</Td>
          <Td>{row.focus}</Td>
          <Td>{row.observations}</Td>
          <Td>{row.visibility}</Td>
          <Td>{row.sov}</Td>
          <Td>{row.citation}</Td>
          <Td>{row.sentiment}</Td>
          <Td>
            <Badge tone={row.quality === "A" ? "green" : "amber"}>{row.quality}</Badge>
          </Td>
          <Td>
            <Badge tone={row.status === "完了" ? "green" : "amber"}>{row.status}</Badge>
          </Td>
          <Td>
            <Link href={getCustomerReportDesignLabHref("overview")} className="font-bold text-[#006B57]">
              {row.action}
            </Link>
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function CategoryStrengthTable() {
  return (
    <SimpleTable
      columns={[
        { label: "カテゴリ", width: "w-[42%]" },
        { label: "AI表示率", width: "w-[22%]" },
        { label: "評価", width: "w-[18%]" },
        { label: "確認", width: "w-[18%]" }
      ]}
    >
      {categoryStrengthRows.map((row) => (
        <tr key={row.category}>
          <Td strong>{row.category}</Td>
          <Td>{row.visibility}</Td>
          <Td>
            <StatusBadge value={row.status} />
          </Td>
          <Td>
            <Link href={getCustomerReportDesignLabHref("prompts")} className="font-bold text-[#006B57]">
              詳細
            </Link>
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function RecommendationCompactList() {
  return (
    <div className="divide-y divide-[#E5EAE8]">
      {topRecommendations.map((item) => (
        <div key={item.issue} className="px-4 py-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 text-[13px] font-bold leading-6 text-[#0F172A]">{item.issue}</p>
            <Badge tone={item.priority === "高" ? "red" : "amber"}>{item.priority}</Badge>
          </div>
          <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">{item.action}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>Impact {item.impact}</Badge>
            <Badge>Difficulty {item.difficulty}</Badge>
            <Badge tone="green">Confidence {item.confidence}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompetitorLostTable() {
  return (
    <SimpleTable
      columns={[
        { label: "質問", width: "w-[42%]" },
        { label: "自社", width: "w-[12%]" },
        { label: "競合", width: "w-[12%]" },
        { label: "理由", width: "w-[34%]" }
      ]}
    >
      {competitorLostQuestions.map((row) => (
        <tr key={row.question}>
          <Td strong>{row.question}</Td>
          <Td>{row.own}</Td>
          <Td>{row.competitor}</Td>
          <Td>{row.reason}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function MissingSourcesTable() {
  return (
    <SimpleTable
      columns={[
        { label: "参照元", width: "w-[28%]" },
        { label: "出現", width: "w-[14%]" },
        { label: "推奨ページ", width: "w-[42%]" },
        { label: "影響", width: "w-[16%]" }
      ]}
    >
      {missingSources.map((row) => (
        <tr key={row.source}>
          <Td strong>{row.source}</Td>
          <Td>{row.appearances}</Td>
          <Td>{row.suggestedAsset}</Td>
          <Td>
            <Badge tone={row.impact === "高" ? "red" : "amber"}>{row.impact}</Badge>
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function CompetitorRankingTable({ highlightOwn = false }: { highlightOwn?: boolean }) {
  return (
    <SimpleTable
      columns={[
        { label: "順位", width: "w-[7%]" },
        { label: "ブランド", width: "w-[25%]" },
        { label: "AI表示率", width: "w-[13%]" },
        { label: "Share of Voice", width: "w-[15%]" },
        { label: "自社引用率", width: "w-[14%]" },
        { label: "Average Position", width: "w-[14%]" },
        { label: "Sentiment", width: "w-[12%]" }
      ]}
    >
      {competitorRankingRows.map((row) => (
        <tr key={row.brand} className={cn(highlightOwn && row.brand.includes("自社") && "bg-[#F2FAF6]")}>
          <Td strong>{row.rank}</Td>
          <Td strong>{row.brand}</Td>
          <Td>{row.visibility}</Td>
          <Td>{row.sov}</Td>
          <Td>{row.citation}</Td>
          <Td>{row.position}</Td>
          <Td>{row.sentiment}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function CompetitorTrendTable() {
  return (
    <SimpleTable
      columns={[
        { label: "ブランド", width: "w-[34%]" },
        { label: "直近値", width: "w-[18%]" },
        { label: "変化", width: "w-[16%]" },
        { label: "読み取り", width: "w-[32%]" }
      ]}
    >
      {competitorTrendRows.map((row) => (
        <tr key={row.brand}>
          <Td strong>{row.brand}</Td>
          <Td>{row.current}</Td>
          <Td>
            <span className="font-bold text-[#00796B]">{row.delta}</span>
          </Td>
          <Td>{row.note}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function CategoryTrendHeatmap() {
  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[160px_repeat(7,minmax(0,1fr))] border-b border-[#E5EAE8] bg-[#F8FAF9] text-[12px] font-bold text-[#475569]">
        <div className="border-r border-[#E5EAE8] px-3 py-2">カテゴリ</div>
        {["5/16", "5/21", "5/26", "5/31", "6/5", "6/10", "6/14"].map((date) => (
          <div key={date} className="border-r border-[#E5EAE8] px-2 py-2 text-center last:border-r-0">
            {date}
          </div>
        ))}
      </div>
      {categoryTrendRows.map((row) => (
        <div key={row.category} className="grid grid-cols-[160px_repeat(7,minmax(0,1fr))] border-b border-[#E5EAE8] last:border-b-0">
          <div className="border-r border-[#E5EAE8] px-3 py-2.5 text-[13px] font-bold leading-5 text-[#0F172A]">{row.category}</div>
          {row.values.map((value, index) => (
            <div key={`${row.category}-${value}-${index}`} className={cn("border-r border-white px-2 py-2.5 text-center text-[12px] font-bold tabular-nums last:border-r-0", heatClass(index))}>
              {value}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ModelTrendTable() {
  return (
    <SimpleTable
      columns={[
        { label: "モデル", width: "w-[26%]" },
        { label: "AI表示率", width: "w-[18%]" },
        { label: "変化", width: "w-[16%]" },
        { label: "読み取り", width: "w-[40%]" }
      ]}
    >
      {modelTrendRows.map((row) => (
        <tr key={row.model}>
          <Td strong>{row.model}</Td>
          <Td>{row.visibility}</Td>
          <Td>
            <span className="font-bold text-[#00796B]">{row.delta}</span>
          </Td>
          <Td>{row.note}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function EventTable() {
  return (
    <SimpleTable
      columns={[
        { label: "種別", width: "w-[28%]" },
        { label: "内容", width: "w-[52%]" },
        { label: "日付", width: "w-[20%]" }
      ]}
    >
      {trendEvents.map((row) => (
        <tr key={`${row.type}-${row.date}`}>
          <Td>
            <Badge tone={row.type === "競合上昇" ? "amber" : "green"}>{row.type}</Badge>
          </Td>
          <Td strong>{row.detail}</Td>
          <Td>{row.date}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function CategoryMatrixTable() {
  return (
    <SimpleTable
      columns={[
        { label: "カテゴリ", width: "w-[28%]" },
        { label: "自社", width: "w-[18%]" },
        { label: "AIO株式会社", width: "w-[18%]" },
        { label: "Bサーチ株式会社", width: "w-[18%]" },
        { label: "Cデジタルマーケティング", width: "w-[18%]" }
      ]}
    >
      {categoryMatrixRows.map((row) => (
        <tr key={row.category}>
          <Td strong>{row.category}</Td>
          <Td>
            <StatusBadge value={row.own} />
          </Td>
          <Td>
            <StatusBadge value={row.a} />
          </Td>
          <Td>
            <StatusBadge value={row.b} />
          </Td>
          <Td>
            <StatusBadge value={row.c} />
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function StolenSourcesTable() {
  return (
    <SimpleTable
      columns={[
        { label: "参照元", width: "w-[34%]" },
        { label: "主に引用されるブランド", width: "w-[26%]" },
        { label: "全体", width: "w-[14%]" },
        { label: "差分", width: "w-[12%]" },
        { label: "強いモデル", width: "w-[14%]" }
      ]}
    >
      {stolenSources.map((row) => (
        <tr key={row.source}>
          <Td strong>{row.source}</Td>
          <Td>{row.citedBy}</Td>
          <Td>{row.all}</Td>
          <Td>{row.gap}</Td>
          <Td>{row.topModel}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function ModelDeltasTable() {
  return (
    <SimpleTable
      columns={[
        { label: "モデル", width: "w-[34%]" },
        { label: "順位", width: "w-[18%]" },
        { label: "前回差", width: "w-[18%]" },
        { label: "弱い論点", width: "w-[30%]" }
      ]}
    >
      {modelDeltas.map((row) => (
        <tr key={row.model}>
          <Td strong>{row.model}</Td>
          <Td>{row.rank}</Td>
          <Td>{row.delta}</Td>
          <Td>{row.weak}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function PromptTable() {
  return (
    <SimpleTable
      columns={[
        { label: "質問", width: "w-[25%]" },
        { label: "カテゴリ", width: "w-[12%]" },
        { label: "ペルソナ", width: "w-[11%]" },
        { label: "AI表示率", width: "w-[9%]" },
        { label: "SOV", width: "w-[7%]" },
        { label: "Position", width: "w-[8%]" },
        { label: "評価", width: "w-[13%]" },
        { label: "優先度", width: "w-[10%]" }
      ]}
    >
      {promptRows.map((row) => (
        <tr key={row.question}>
          <Td strong>{row.question}</Td>
          <Td>{row.category}</Td>
          <Td>{row.persona}</Td>
          <Td>{row.visibility}</Td>
          <Td>{row.sov}</Td>
          <Td>{row.position}</Td>
          <Td>
            <StatusBadge value={row.evaluation} />
          </Td>
          <Td>
            <Badge tone={row.priority === "高" ? "red" : "amber"}>{row.priority}</Badge>
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function PersonaEvaluationTable() {
  return (
    <SimpleTable
      columns={[
        { label: "ペルソナ", width: "w-[18%]" },
        { label: "判断軸", width: "w-[28%]" },
        { label: "不足情報", width: "w-[26%]" },
        { label: "次アクション", width: "w-[28%]" }
      ]}
    >
      {personaEvaluationRows.map((row) => (
        <tr key={row.persona}>
          <Td strong>{row.persona}</Td>
          <Td>{row.axis}</Td>
          <Td>{row.missing}</Td>
          <Td>
            <Badge tone="green">{row.next}</Badge>
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function ModelAnswerCards() {
  return (
    <div className="grid min-w-0 gap-0 lg:grid-cols-2 xl:grid-cols-4">
      {modelAnswerRows.map((row, index) => (
        <div key={row.model} className={cn("min-w-0 px-4 py-4", index > 0 && "border-t border-[#E5EAE8] lg:border-l lg:border-t-0")}>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-bold leading-6 text-[#0F172A]">{row.model}</p>
              <p className="mt-1 text-[12px] font-bold leading-5 text-[#64748B]">
                Position {row.position} / Sentiment {row.sentiment}
              </p>
            </div>
            <Badge tone={row.mention === "あり" ? "green" : "slate"}>{row.mention}</Badge>
          </div>
          <p className="mt-3 text-[13px] font-semibold leading-6 text-[#334155]">{row.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {row.keyPoints.map((point) => (
              <Badge key={point}>{point}</Badge>
            ))}
          </div>
          <p className="mt-3 text-[12px] font-bold leading-5 text-[#64748B]">参照URL</p>
          <p className="mt-1 break-words text-[13px] font-semibold leading-6 text-[#0F172A]">{row.urls}</p>
          <p className="mt-3 rounded-md border border-[#DDE8E5] bg-[#FAFCFB] px-3 py-2 text-[13px] font-semibold leading-6 text-[#334155]">{row.excerpt}</p>
        </div>
      ))}
    </div>
  );
}

function ModelComparisonTable() {
  return (
    <SimpleTable
      columns={[
        { label: "項目", width: "w-[16%]" },
        { label: "ChatGPT", width: "w-[21%]" },
        { label: "Perplexity", width: "w-[21%]" },
        { label: "Gemini", width: "w-[21%]" },
        { label: "Claude", width: "w-[21%]" }
      ]}
    >
      {[
        ["Mention 有無", "なし", "あり", "あり", "あり"],
        ["Position", "-", "3位", "5位", "2位"],
        ["Sentiment", "-", "ポジティブ", "ニュートラル", "ポジティブ"],
        ["引用元数", "0", "3", "2", "4"],
        ["回答特徴", "理論的", "実践的", "Google観点", "戦略的"]
      ].map((row) => (
        <tr key={row[0]}>
          {row.map((cell, index) => (
            <Td key={`${row[0]}-${cell}`} strong={index === 0}>
              {cell}
            </Td>
          ))}
        </tr>
      ))}
    </SimpleTable>
  );
}

function SourceDomainTable() {
  return (
    <SimpleTable
      columns={[
        { label: "ドメイン", width: "w-[30%]" },
        { label: "引用数", width: "w-[18%]" },
        { label: "自社引用", width: "w-[18%]" },
        { label: "Citation", width: "w-[18%]" },
        { label: "Retrieval", width: "w-[16%]" }
      ]}
    >
      {sourceDomains.map((row) => (
        <tr key={row.domain}>
          <Td strong>{row.domain}</Td>
          <Td>{row.citations}</Td>
          <Td>{row.owned}</Td>
          <Td>{row.share}</Td>
          <Td>{row.retrieval}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function SourceUrlTable() {
  return (
    <SimpleTable
      columns={[
        { label: "URL", width: "w-[54%]" },
        { label: "引用数", width: "w-[18%]" },
        { label: "ドメイン", width: "w-[28%]" }
      ]}
    >
      {sourceUrls.map((row) => (
        <tr key={row.url}>
          <Td strong>{row.url}</Td>
          <Td>{row.citations}</Td>
          <Td>{row.domain}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function SourceTypeTable() {
  return (
    <SimpleTable
      columns={[
        { label: "種別", width: "w-[38%]" },
        { label: "引用数", width: "w-[22%]" },
        { label: "シェア", width: "w-[20%]" },
        { label: "自社", width: "w-[20%]" }
      ]}
    >
      {sourceTypes.map((row) => (
        <tr key={row.type}>
          <Td strong>{row.type}</Td>
          <Td>{row.citations}</Td>
          <Td>{row.share}</Td>
          <Td>{row.owned}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function SourceGapTable() {
  return (
    <SimpleTable
      columns={[
        { label: "ドメイン", width: "w-[22%]" },
        { label: "引用数", width: "w-[12%]" },
        { label: "競合引用", width: "w-[25%]" },
        { label: "Retrieval", width: "w-[14%]" },
        { label: "推定トピック", width: "w-[19%]" },
        { label: "スコア", width: "w-[8%]" }
      ]}
    >
      {sourceGaps.map((row) => (
        <tr key={row.domain}>
          <Td strong>{row.domain}</Td>
          <Td>{row.citations}</Td>
          <Td>{row.competitors}</Td>
          <Td>{row.retrieval}</Td>
          <Td>{row.topic}</Td>
          <Td>{row.score}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function ActionList({ rows }: { rows: { action: string; impact: string }[] }) {
  return (
    <div className="divide-y divide-[#E5EAE8]">
      {rows.map((row) => (
        <div key={row.action} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 text-[13px] font-bold leading-6 text-[#0F172A]">{row.action}</p>
          <Badge tone={row.impact.startsWith("高") ? "green" : "amber"}>{row.impact}</Badge>
        </div>
      ))}
    </div>
  );
}

function FeatureSentimentTable() {
  return (
    <SimpleTable
      columns={[
        { label: "カテゴリ", width: "w-[36%]" },
        { label: "ポジ", width: "w-[16%]" },
        { label: "中立", width: "w-[16%]" },
        { label: "ネガ", width: "w-[16%]" },
        { label: "スコア", width: "w-[16%]" }
      ]}
    >
      {featureSentimentRows.map((row) => (
        <tr key={row.category}>
          <Td strong>{row.category}</Td>
          <Td>{row.positive}</Td>
          <Td>{row.neutral}</Td>
          <Td>{row.negative}</Td>
          <Td>{row.score}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function SignalList({ items, tone }: { items: { label: string; rate: string }[]; tone: Tone }) {
  return (
    <div className="divide-y divide-[#E5EAE8]">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 text-[13px] font-semibold leading-6 text-[#0F172A]">{item.label}</p>
          <span className={cn("shrink-0 text-[13px] font-bold tabular-nums", toneText(tone))}>{item.rate}</span>
        </div>
      ))}
    </div>
  );
}

function BrandDiffBars() {
  const values = brandCompetitorDiff.map((item) => Number(item.score));
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);

  return (
    <div className="space-y-3 px-4 py-4">
      {brandCompetitorDiff.map((item) => {
        const value = Number(item.score);
        const width = Math.max(6, (Math.abs(value) / max) * 48);

        return (
          <div key={item.brand} className="grid grid-cols-[120px_minmax(0,1fr)_48px] items-center gap-3">
            <p className="truncate text-[13px] font-bold text-[#0F172A]">{item.brand}</p>
            <div className="relative h-7 rounded-sm bg-[#F1F5F4]">
              <div className="absolute left-1/2 top-0 h-full w-px bg-[#DDE8E5]" />
              <div
                className={cn("absolute top-1 h-5 rounded-sm", value >= 0 ? "left-1/2 bg-[#69B985]" : "right-1/2 bg-[#F26B4F]")}
                style={{ width: `${width}%` }}
              />
            </div>
            <p className={cn("text-right text-[13px] font-bold tabular-nums", value >= 0 ? "text-[#00796B]" : "text-[#B42318]")}>{item.score}</p>
          </div>
        );
      })}
    </div>
  );
}

function ModelPerceptionTable() {
  return (
    <SimpleTable
      columns={[
        { label: "モデル", width: "w-[28%]" },
        { label: "Sentiment", width: "w-[16%]" },
        { label: "言及率", width: "w-[16%]" },
        { label: "典型的な傾向", width: "w-[40%]" }
      ]}
    >
      {modelPerceptionRows.map((row) => (
        <tr key={row.model}>
          <Td strong>{row.model}</Td>
          <Td>{row.sentiment}</Td>
          <Td>{row.mention}</Td>
          <Td>{row.tendency}</Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function PerceptionTrend() {
  return (
    <div className="px-4 py-4">
      <Sparkline values={[0.08, 0.12, 0.21, 0.27, 0.34, 0.29, 0.35, 0.32, 0.38, 0.42]} tone="green" large />
      <p className="mt-3 text-[13px] font-semibold leading-6 text-[#64748B]">
        5/18以降、機能説明と使いやすさに関するポジティブ言及が増え、Sentimentスコアは0.42まで上昇しています。
      </p>
    </div>
  );
}

function RecommendationsTable() {
  return (
    <SimpleTable
      columns={[
        { label: "優先度", width: "w-[8%]" },
        { label: "課題", width: "w-[20%]" },
        { label: "施策タイプ", width: "w-[12%]" },
        { label: "根拠サマリー", width: "w-[22%]" },
        { label: "Impact", width: "w-[8%]" },
        { label: "Difficulty", width: "w-[9%]" },
        { label: "Confidence", width: "w-[10%]" },
        { label: "状態", width: "w-[11%]" }
      ]}
    >
      {recommendationRows.map((row) => (
        <tr key={row.issue}>
          <Td>
            <Badge tone={row.priority === "高" ? "red" : "amber"}>{row.priority}</Badge>
          </Td>
          <Td strong>{row.issue}</Td>
          <Td>{row.actionType}</Td>
          <Td>{row.evidence}</Td>
          <Td>{row.impact}</Td>
          <Td>{row.difficulty}</Td>
          <Td>{row.confidence}</Td>
          <Td>
            <Badge tone={row.status === "対応中" ? "green" : "amber"}>{row.status}</Badge>
          </Td>
        </tr>
      ))}
    </SimpleTable>
  );
}

function DefinitionList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-[#E5EAE8]">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="grid min-w-0 gap-1 px-4 py-3">
          <dt className="text-[12px] font-bold leading-5 text-[#64748B]">{item.label}</dt>
          <dd className="break-words text-[13px] font-bold leading-6 text-[#0F172A]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailBlocks({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-4 divide-y divide-[#E5EAE8] border-t border-[#E5EAE8]">
      {rows.map(([label, value]) => (
        <div key={label} className="py-3">
          <p className="text-[12px] font-bold leading-5 text-[#64748B]">{label}</p>
          <p className="mt-1 text-[13px] font-semibold leading-6 text-[#0F172A]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Score({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="border-r border-[#E5EAE8] px-3 py-3 last:border-r-0">
      <p className="text-[12px] font-bold leading-5 text-[#64748B]">{label}</p>
      <p className={cn("mt-1 text-[18px] font-bold tabular-nums", toneText(tone))}>{value}</p>
    </div>
  );
}

function Timeline({ items }: { items: readonly (readonly [string, string, string, Tone])[] }) {
  return (
    <div className="divide-y divide-[#E5EAE8]">
      {items.map(([label, value, time, tone]) => (
        <div key={`${label}-${time}`} className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_72px] gap-3 px-4 py-3">
          <span className={cn("mt-1 flex h-6 w-6 items-center justify-center rounded-full", toneSoftBg(tone))}>
            <CircleDot className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-5 text-[#0F172A]">{label}</p>
            <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">{value}</p>
          </div>
          <p className="text-right text-[12px] font-bold leading-5 text-[#64748B]">{time}</p>
        </div>
      ))}
    </div>
  );
}

function FilterStrip({
  left,
  right = [],
  activeLeft,
  activeRight
}: {
  left: string[];
  right?: string[];
  activeLeft?: string;
  activeRight?: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DDE8E5] bg-white p-2">
      <div className="flex min-w-0 flex-wrap gap-2">
        {left.map((item) => (
          <Badge key={item} tone={item === activeLeft ? "green" : "default"}>
            {item}
          </Badge>
        ))}
      </div>
      {right.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-2">
          {right.map((item) => (
            <Badge key={item} tone={item === activeRight ? "green" : "default"}>
              {item}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SimpleTable({
  columns,
  children
}: {
  columns: { label: string; width: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <Th key={column.label} className={column.width}>
                {column.label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-[#DDE8E5] bg-[#F8FAF9] px-3 py-2 text-left text-[12px] font-bold leading-5 text-[#475569]", className)}>
      {children}
    </th>
  );
}

function Td({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <td className="border-b border-[#E5EAE8] px-3 py-3 align-top text-[12px] leading-5 text-[#334155]">
      <div className={cn("min-w-0 break-words", strong && "font-bold text-[#0F172A]")}>{children}</div>
    </td>
  );
}

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full items-center rounded-sm border px-2 py-0.5 text-[12px] font-bold leading-5",
        tone === "default" && "border-[#DDE8E5] bg-[#FAFCFB] text-[#64748B]",
        tone === "green" && "border-[#B8DCD2] bg-[#E6F4F1] text-[#006B57]",
        tone === "amber" && "border-[#F3D6A2] bg-[#FFF7E8] text-[#9A5B00]",
        tone === "red" && "border-[#F3B8B8] bg-[#FFF1F0] text-[#B42318]",
        tone === "slate" && "border-[#DDE8E5] bg-[#F1F5F9] text-[#475569]"
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <Badge tone={statusTone(value)}>{value}</Badge>;
}

function Sparkline({
  values,
  tone,
  large = false
}: {
  values: number[];
  tone: "green" | "red";
  large?: boolean;
}) {
  const points = buildSparklinePoints(values);
  const stroke = tone === "green" ? "#00796B" : "#F26B4F";

  return (
    <svg viewBox="0 0 160 56" className={cn("mt-3 w-full", large ? "h-[120px]" : "h-[42px]")} aria-hidden="true">
      <polyline fill="none" points={points} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {large ? <polyline fill="none" points="8,48 152,48" stroke="#DDE8E5" strokeDasharray="4 4" strokeWidth="1" /> : null}
    </svg>
  );
}

function buildSparklinePoints(values: number[]) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.1, max - min);

  return values
    .map((value, index) => {
      const x = 8 + index * (144 / Math.max(1, values.length - 1));
      const y = 48 - ((value - min) / range) * 38;
      return `${x},${y}`;
    })
    .join(" ");
}

function statusTone(value: string): Tone {
  if (["強い", "ポジティブ", "完了", "対応中"].includes(value)) return "green";
  if (["要改善", "確認中", "中", "ニュートラル"].includes(value)) return "amber";
  if (["弱い", "高", "未対応"].includes(value)) return "red";
  return "default";
}

function toneText(tone: Tone) {
  if (tone === "green") return "text-[#00796B]";
  if (tone === "amber") return "text-[#9A5B00]";
  if (tone === "red") return "text-[#B42318]";
  return "text-[#475569]";
}

function toneSoftBg(tone: Tone) {
  if (tone === "green") return "bg-[#E6F4F1] text-[#006B57]";
  if (tone === "amber") return "bg-[#FFF7E8] text-[#9A5B00]";
  if (tone === "red") return "bg-[#FFF1F0] text-[#B42318]";
  return "bg-[#F1F5F9] text-[#475569]";
}

function heatClass(index: number) {
  const classes = [
    "bg-[#EEF8F1] text-[#22543D]",
    "bg-[#DDF2E3] text-[#22543D]",
    "bg-[#CDEBDA] text-[#22543D]",
    "bg-[#BCE5D0] text-[#1F5137]",
    "bg-[#A7DDBE] text-[#17462F]",
    "bg-[#90D5AE] text-[#153E2D]",
    "bg-[#79C99E] text-[#0F3326]"
  ];

  return classes[index] ?? classes[0];
}
