import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileText,
  Gauge,
  LineChart,
  ListChecks,
  MessageSquareText,
  Search,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CUSTOMER_REPORT_DESIGN_LAB_TABS,
  brandPerceptionItems,
  brandPerceptionKpis,
  categoryMatrix,
  categoryRows,
  competitorRows,
  conversationSummary,
  executiveSummary,
  homeFocusItems,
  labMetaItems,
  modelAnswerRows,
  narrativeDrivers,
  promptRows,
  quickAccessItems,
  recommendationRows,
  recentChanges,
  reportRows,
  sourceDomains,
  sourceSummary,
  sourceTypes,
  topKpis,
  trendSeries,
  type CustomerReportDesignLabTab
} from "@/lib/recora/customer-report-design-lab/fixture";

type Tone = "default" | "green" | "amber" | "red" | "slate";

const tabIconMap: Record<CustomerReportDesignLabTab, typeof Gauge> = {
  home: Gauge,
  reports: FileText,
  overview: ClipboardList,
  trends: LineChart,
  leaderboard: BarChart3,
  prompts: Search,
  conversations: MessageSquareText,
  sources: BookOpen,
  "brand-perception": Sparkles,
  recommendations: ListChecks
};

export function CustomerReportDesignLab({ activeTab }: { activeTab: CustomerReportDesignLabTab }) {
  const tab = CUSTOMER_REPORT_DESIGN_LAB_TABS.find((item) => item.id === activeTab) ?? CUSTOMER_REPORT_DESIGN_LAB_TABS[0];

  return (
    <div className="min-w-0 overflow-x-hidden text-[#0F172A]" data-recora-customer-report-design-lab>
      <LabHeader eyebrow={tab.eyebrow} title={tab.title} />
      <div className="mt-5">
        <MetaStrip />
      </div>
      <div className="mt-4">
        <TabNav activeTab={activeTab} />
      </div>
      <div className="mt-5 min-w-0">{renderTab(activeTab)}</div>
    </div>
  );
}

function renderTab(activeTab: CustomerReportDesignLabTab) {
  switch (activeTab) {
    case "reports":
      return <ReportsTab />;
    case "overview":
      return <OverviewTab />;
    case "trends":
      return <TrendsTab />;
    case "leaderboard":
      return <LeaderboardTab />;
    case "prompts":
      return <PromptsTab />;
    case "conversations":
      return <ConversationsTab />;
    case "sources":
      return <SourcesTab />;
    case "brand-perception":
      return <BrandPerceptionTab />;
    case "recommendations":
      return <RecommendationsTab />;
    case "home":
    default:
      return <HomeTab />;
  }
}

function LabHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="min-w-0">
      <div className="min-w-0">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold tracking-normal text-[#006B57]">{eyebrow}</span>
            <Badge tone="green">内部デザインラボ</Badge>
            <Badge tone="amber">参考表示</Badge>
          </div>
          <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-normal text-[#0F172A]">{title}</h2>
          <p className="mt-1 max-w-4xl text-[13px] leading-6 text-[#64748B]">
            本番顧客画面を置き換えない、PC実寸確認用の静的モックです。表示値はサンプルで、DBや外部APIは使用していません。
          </p>
        </div>
      </div>
    </header>
  );
}

function MetaStrip() {
  return (
    <section className="grid min-w-0 overflow-hidden rounded-lg border border-[#DDE8E5] bg-white md:grid-cols-4 xl:grid-cols-8">
      {labMetaItems.map((item) => (
        <div
          key={item.label}
          className="min-w-0 border-b border-[#E5EAE8] px-3 py-2.5 md:border-r md:[&:nth-child(4n)]:border-r-0 xl:border-r xl:border-b-0 xl:last:border-r-0 xl:[&:nth-child(4n)]:border-r"
        >
          <p className="truncate text-[11px] font-bold leading-4 text-[#64748B]" title={item.label}>
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 truncate text-[13px] font-bold leading-5 text-[#0F172A]",
              item.tone === "amber" && "text-[#9A5B00]"
            )}
            title={item.value}
          >
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}

function TabNav({ activeTab }: { activeTab: CustomerReportDesignLabTab }) {
  return (
    <nav className="min-w-0 rounded-lg border border-[#DDE8E5] bg-white p-2" aria-label="customer report design lab tabs">
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {CUSTOMER_REPORT_DESIGN_LAB_TABS.map((tab) => {
          const Icon = tabIconMap[tab.id];
          const isActive = tab.id === activeTab;

          return (
            <Link
              key={tab.id}
              href={`/internal/customer-report-design-lab?tab=${tab.id}`}
              className={cn(
                "flex min-h-10 min-w-0 items-center gap-2 rounded-md px-3 py-2 text-[13px] font-bold leading-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B57]",
                isActive
                  ? "bg-[#E6F4F1] text-[#005C50] shadow-[inset_3px_0_0_#00796B]"
                  : "text-[#64748B] hover:bg-[#F4FAF8] hover:text-[#005C50]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeTab() {
  return (
    <div className="space-y-5">
      <MetricStrip items={topKpis.slice(0, 5)} columns="xl:grid-cols-5" />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="今見るべき3つ" description="営業デモで先に見せる判断材料だけを並べています。">
          <div className="grid min-w-0 gap-3">
            {homeFocusItems.map((item) => (
              <FocusRow key={item.title} item={item} />
            ))}
          </div>
        </Panel>

        <Panel title="クイックアクセス" description="各タブへ直接移動できます。">
          <div className="grid min-w-0 gap-2">
            {quickAccessItems.map((item) => (
              <Link
                key={item.tab}
                href={`/internal/customer-report-design-lab?tab=${item.tab}`}
                className="group flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] px-3 py-2.5 hover:border-[#B8DCD2] hover:bg-[#F4FAF8]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-[#0F172A]">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#64748B]">{item.description}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#006B57]" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="最近のレポート" description="履歴は主要列だけに絞り、質問数と回答数は詳細側へ逃がします。">
          <ReportsMiniTable />
        </Panel>
        <Panel title="最近の変化" description="増減の理由が読み取れる粒度に留めます。">
          <div className="space-y-3">
            {recentChanges.map((item) => (
              <ChangeItem key={item.label} item={item} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-5">
      <Panel title="レポート履歴" description="横幅に収まる主表にし、質問数・回答数・改善候補は右側の選択詳細で確認します。">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <ReportHistoryTable />
          <DetailRail title="選択中レポート" eyebrow="2026/06/22">
            <DetailList
              items={[
                ["質問数", reportRows[0].questions],
                ["回答数", reportRows[0].answers],
                ["改善候補", `${reportRows[0].recommendations}件`],
                ["品質", reportRows[0].quality],
                ["状態", reportRows[0].status]
              ]}
            />
            <div className="mt-4 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-3">
              <p className="text-[12px] font-bold leading-5 text-[#64748B]">次に見る場所</p>
              <p className="mt-1 text-[13px] font-bold leading-6 text-[#0F172A]">概要、質問別分析、参照元を続けて確認</p>
            </div>
          </DetailRail>
        </div>
      </Panel>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-5">
      <Panel title="Executive Summary" description="最初に結論と次アクションが読めるよう、上部は詰め込みすぎない構成にします。">
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {executiveSummary.map((item) => (
            <SummaryBlock key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </Panel>

      <MetricStrip items={topKpis} columns="xl:grid-cols-6" />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="直近推移" description="小さなsparklineで方向だけを示し、詳細な時系列は推移タブに逃がします。">
          <MiniTrendBoard />
        </Panel>
        <Panel title="上位改善候補" description="概要では3件だけ表示します。">
          <div className="space-y-3">
            {recommendationRows.map((item) => (
              <RecommendationCompact key={item.issue} item={item} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="強いカテゴリ / 弱いカテゴリ" description="評価は「強い / 要改善 / 弱い」で統一します。">
          <CategoryTable />
        </Panel>
        <Panel title="4社比較 compact ranking" description="6列構成で横スクロールを避けます。">
          <CompetitorCompactTable />
        </Panel>
      </div>
    </div>
  );
}

function TrendsTab() {
  return (
    <div className="space-y-5">
      <FilterStrip items={["7日", "30日", "90日", "全期間", "日次", "週次"]} active="30日" />
      <Panel title="主要指標推移" description="折れ線は5指標までに抑え、読み取りは右側のイベントに分けます。">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <TrendChart />
          <DetailRail title="変化イベント" eyebrow="直近30日">
            <TimelineList
              items={[
                ["急上昇", "AI検索最適化カテゴリでAI表示率が+6pt"],
                ["急落", "社内稟議質問で自社未表示が継続"],
                ["新規参照元", "業界メディア2件が回答に出現"],
                ["競合上昇", "競合Aが比較ガイドで引用増"]
              ]}
            />
          </DetailRail>
        </div>
      </Panel>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="競合推移" description="自社と競合3社のSOV変化をコンパクトに比較します。">
          <CompetitorTrendBars />
        </Panel>
        <Panel title="カテゴリ推移" description="小型heatmapで悪化箇所だけ拾えるようにします。">
          <CategoryHeatmap />
        </Panel>
      </div>

      <Panel title="AIモデル別推移" description="モデル別の差分は表にし、グラフの詰め込みを避けます。">
        <ModelTrendTable />
      </Panel>
    </div>
  );
}

function LeaderboardTab() {
  return (
    <div className="space-y-5">
      <MetricStrip
        items={[
          { label: "自社順位", value: "2位", progress: 62 },
          { label: "AI表示率順位", value: "2位", progress: 62 },
          { label: "SOV順位", value: "2位", progress: 24 },
          { label: "引用率順位", value: "2位", progress: 18 },
          { label: "Sentiment順位", value: "2位", progress: 58 },
          { label: "Position順位", value: "2位", progress: 46 }
        ]}
        columns="xl:grid-cols-6"
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="4社ランキング" description="ランキングバーではなく、6列テーブルでPC幅に収めます。">
          <CompetitorFullTable />
        </Panel>
        <Panel title="モデル別差分" description="モデルごとの見え方は詳細パネルで確認します。">
          <DetailList
            items={[
              ["ChatGPT", "自社2位 / 中立+"],
              ["Perplexity", "自社2位 / 引用弱め"],
              ["Gemini", "自社未表示"],
              ["Claude", "自社3位 / 運用負荷を重視"]
            ]}
          />
        </Panel>
      </div>

      <Panel title="カテゴリ別勝敗マトリクス" description="4社比較でも横スクロールなしで収まる列数に固定します。">
        <CategoryMatrixTable />
      </Panel>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="競合に取られている質問">
          <CompactList
            items={[
              ["比較・選定", "AI検索ツールの選び方で競合Aが先に推薦"],
              ["社内稟議", "ROIとリスク説明で中立メディアが優先"],
              ["引用元獲得", "用語説明を外部ドメインが補完"]
            ]}
          />
        </Panel>
        <Panel title="競合に取られている参照元">
          <CompactList
            items={[
              ["example-media.jp", "競合Aの比較記事を引用"],
              ["seo-guide.example", "比較ガイドで自社説明が不足"],
              ["procurement.example", "稟議文脈で競合Aが強い"]
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

function PromptsTab() {
  const selected = promptRows[0];

  return (
    <div className="space-y-5">
      <FilterStrip items={["強い", "要改善", "弱い", "競合に負け", "自社未表示", "引用なし", "高優先度"]} active="要改善" />
      <Panel title="質問別分析" description="主表は8列に絞り、prompt_typeや引用元は右詳細パネルへ逃がします。">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <PromptTable />
          <DetailRail title="質問詳細" eyebrow={selected.category}>
            <p className="text-[13px] font-bold leading-6 text-[#0F172A]">{selected.prompt}</p>
            <div className="mt-4">
              <DetailList
                items={[
                  ["prompt_type", selected.promptType],
                  ["intent", selected.intent],
                  ["自社サイト引用", selected.ownCitation],
                  ["競合mention", selected.competitorMention],
                  ["優先度", selected.priority]
                ]}
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-[12px] font-bold leading-5 text-[#64748B]">上位引用元</p>
              <div className="flex flex-wrap gap-2">
                {selected.topSources.map((source) => (
                  <Badge key={source}>{source}</Badge>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-3">
              <p className="text-[12px] font-bold leading-5 text-[#64748B]">改善アクション</p>
              <p className="mt-1 text-[13px] font-semibold leading-6 text-[#0F172A]">{selected.action}</p>
            </div>
          </DetailRail>
        </div>
      </Panel>

      <Panel title="ペルソナ別評価" description="詳細パネルに出す想定情報の下段確認です。">
        <PersonaTable />
      </Panel>
    </div>
  );
}

function ConversationsTab() {
  return (
    <div className="space-y-5">
      <Panel title="選択した質問" description="モデル横断の判断材料として読む画面です。">
        <div className="rounded-md border border-[#DDE8E5] bg-[#FAFCFB] p-4">
          <p className="text-[14px] font-bold leading-6 text-[#0F172A]">{conversationSummary.question}</p>
        </div>
      </Panel>

      <Panel title="モデル横断の要点まとめ" description="各モデル回答の短縮ではなく、意思決定に必要な差分だけをまとめます。">
        <div className="grid min-w-0 gap-3 lg:grid-cols-2 xl:grid-cols-5">
          <SummaryBlock title="共通結論" body={conversationSummary.commonConclusion} />
          <SummaryBlock title="モデル差分" body={conversationSummary.modelDifference} />
          <SummaryBlock title="自社に有利" body={conversationSummary.favorable} />
          <SummaryBlock title="自社に不利" body={conversationSummary.unfavorable} />
          <SummaryBlock title="次アクション" body={conversationSummary.nextAction} />
        </div>
      </Panel>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="モデル別回答" description="provider UIを模倣せず、回答観測として抽象化します。">
          <ModelAnswerCards />
        </Panel>
        <Panel title="重要ポイント" description="サンプル回答の一部から判断軸を抜き出します。">
          <CompactList
            items={[
              ["比較軸", "可視化、競合差分、引用元確認が共通論点"],
              ["引用", "中立メディアと比較ガイドが強い"],
              ["不足", "セキュリティと社内稟議の根拠が薄い"],
              ["施策", "比較ページと用語集を分けて作る"]
            ]}
          />
        </Panel>
      </div>

      <Panel title="モデル比較表">
        <ModelComparisonTable />
      </Panel>
    </div>
  );
}

function SourcesTab() {
  return (
    <div className="space-y-5">
      <MetricStrip items={sourceSummary.map((item) => ({ ...item, progress: 46 }))} columns="xl:grid-cols-6" />

      <FilterStrip items={["ドメイン", "URL", "ソース種別", "競合に取られている参照元", "自社サイト引用", "新規出現"]} active="ドメイン" />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="ドメインランキング" description="URL詳細は下段や詳細パネルに逃がし、主表は6列にします。">
          <SourceDomainTable />
        </Panel>
        <Panel title="Source Type別集計">
          <SourceTypeBars />
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="競合は引用されているが自社は引用されていない参照元">
          <CompactList
            items={[
              ["example-media.jp", "比較質問で競合Aを引用。自社説明がない"],
              ["seo-guide.example", "AI検索ツール比較で中立ソースとして出現"],
              ["procurement.example", "社内稟議の論点で競合Aが先行"]
            ]}
          />
        </Panel>
        <Panel title="推奨アクション">
          <CompactList
            items={[
              ["用語集", "AI検索最適化と引用元の定義を自社サイトで整備"],
              ["比較ガイド", "導入判断の比較軸を1ページに集約"],
              ["外部露出", "中立メディアに引用される根拠ページを用意"]
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

function BrandPerceptionTab() {
  return (
    <div className="space-y-5">
      <Panel title="ブランド認知サマリー" description="AIがどう語っているかを商談文脈で確認します。">
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {brandPerceptionItems.map((item) => (
            <SummaryBlock key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </Panel>

      <MetricStrip items={brandPerceptionKpis} columns="xl:grid-cols-6" />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Narrative Drivers" description="認知を動かしている表現をカテゴリ化します。">
          <NarrativeTable />
        </Panel>
        <Panel title="Positive / Negative Signals">
          <CompactList
            items={[
              ["Positive", "AI検索の見え方を可視化できるサービスとして扱われる"],
              ["Positive", "改善候補までつながる点は評価される"],
              ["Negative", "社内承認やセキュリティ説明の根拠が薄い"],
              ["Negative", "比較時に競合Aの資料が先に出る"]
            ]}
          />
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="競合との印象差分">
          <CategoryMatrixTable />
        </Panel>
        <Panel title="認知の変化トレンド">
          <MiniTrendBoard />
        </Panel>
      </div>
    </div>
  );
}

function RecommendationsTab() {
  const selected = recommendationRows[0];

  return (
    <div className="space-y-5">
      <MetricStrip
        items={[
          { label: "高優先度", value: "2", progress: 66, tone: "red" as const },
          { label: "中優先度", value: "1", progress: 33, tone: "amber" as const },
          { label: "低優先度", value: "0", progress: 0 },
          { label: "未対応", value: "2", progress: 66 },
          { label: "対応中", value: "1", progress: 33 },
          { label: "解消済み", value: "0", progress: 0 }
        ]}
        columns="xl:grid-cols-6"
      />

      <Panel title="改善候補" description="主表は8列に絞り、根拠の詳細は右パネルで確認します。">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <RecommendationsTable />
          <DetailRail title="改善候補詳細" eyebrow={`優先度: ${selected.priority}`}>
            <p className="text-[13px] font-bold leading-6 text-[#0F172A]">{selected.issue}</p>
            <div className="mt-4">
              <DetailList
                items={[
                  ["なぜ出たか", selected.why],
                  ["根拠AI回答", selected.aiEvidence],
                  ["根拠引用元", selected.sourceEvidence],
                  ["競合が持つもの", "比較記事と中立ソース露出"],
                  ["自社に足りないもの", "導入判断の根拠ページ"]
                ]}
              />
            </div>
            <div className="mt-4 rounded-md border border-[#DDE8E5] bg-[#FAFCFB] p-3">
              <p className="text-[12px] font-bold leading-5 text-[#64748B]">改善アクション</p>
              <p className="mt-1 text-[13px] font-semibold leading-6 text-[#0F172A]">{selected.action}</p>
            </div>
          </DetailRail>
        </div>
      </Panel>

      <Panel title="対象質問 / 関連参照元 / 期待効果">
        <div className="grid min-w-0 gap-3 xl:grid-cols-3">
          <SummaryBlock title="対象質問" body="AI検索最適化ツールを比較するとき、BtoB企業は何を重視すべきですか？" />
          <SummaryBlock title="関連参照元" body="example-media.jp、seo-guide.example、procurement.example を優先確認。" />
          <SummaryBlock title="期待効果" body="比較検討と社内稟議の回答で、自社サイト引用と自社説明の増加を狙います。" />
        </div>
      </Panel>
    </div>
  );
}

function FocusRow({ item }: { item: (typeof homeFocusItems)[number] }) {
  return (
    <div className="grid min-w-0 gap-3 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-3 lg:grid-cols-[160px_minmax(0,1fr)_88px] lg:items-center">
      <p className="text-[12px] font-bold leading-5 text-[#64748B]">{item.label}</p>
      <div className="min-w-0">
        <p className="text-[14px] font-bold leading-6 text-[#0F172A]">{item.title}</p>
        <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">{item.description}</p>
      </div>
      <StatusBadge value={item.status} tone={item.tone} />
    </div>
  );
}

function ReportsMiniTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[34%]">レポート名</Th>
            <Th className="w-[13%]">測定日</Th>
            <Th className="w-[14%]">AI表示率</Th>
            <Th className="w-[12%]">SOV</Th>
            <Th className="w-[15%]">引用率</Th>
            <Th className="w-[12%]">品質</Th>
          </tr>
        </thead>
        <tbody>
          {reportRows.map((row) => (
            <tr key={row.name}>
              <Td strong>{row.name}</Td>
              <Td>{row.date}</Td>
              <Td>{row.visibility}</Td>
              <Td>{row.sov}</Td>
              <Td>{row.citation}</Td>
              <Td>
                <Badge tone={row.quality === "サンプル不足" ? "amber" : "slate"}>{row.quality}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function ReportHistoryTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[25%]">レポート名</Th>
            <Th className="w-[11%]">測定日</Th>
            <Th className="w-[12%]">フォーカス</Th>
            <Th className="w-[11%]">有効観測</Th>
            <Th className="w-[10%]">AI表示</Th>
            <Th className="w-[9%]">SOV</Th>
            <Th className="w-[10%]">引用率</Th>
            <Th className="w-[12%]">状態</Th>
          </tr>
        </thead>
        <tbody>
          {reportRows.map((row) => (
            <tr key={row.name}>
              <Td strong>{row.name}</Td>
              <Td>{row.date}</Td>
              <Td>{row.focus}</Td>
              <Td>{row.observations}</Td>
              <Td>{row.visibility}</Td>
              <Td>{row.sov}</Td>
              <Td>{row.citation}</Td>
              <Td>
                <Badge tone={row.status === "確認中" ? "amber" : "green"}>{row.status}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function SummaryBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-4">
      <p className="text-[13px] font-bold leading-5 text-[#006B57]">{title}</p>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[#334155]">{body}</p>
    </div>
  );
}

function MiniTrendBoard() {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-3">
      <MiniTrend label="AI表示率" values={trendSeries.map((item) => item.visibility)} value="62%" />
      <MiniTrend label="SOV" values={trendSeries.map((item) => item.sov)} value="24%" />
      <MiniTrend label="引用率" values={trendSeries.map((item) => item.citation)} value="18%" tone="amber" />
    </div>
  );
}

function MiniTrend({ label, value, values, tone = "green" }: { label: string; value: string; values: number[]; tone?: "green" | "amber" }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5EAE8] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[12px] font-bold text-[#64748B]">{label}</p>
        <p className="shrink-0 text-[16px] font-bold tabular-nums text-[#0F172A]">{value}</p>
      </div>
      <Sparkline values={values} tone={tone} />
    </div>
  );
}

function CategoryTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[26%]">カテゴリ</Th>
            <Th className="w-[16%]">評価</Th>
            <Th className="w-[20%]">AI表示率</Th>
            <Th className="w-[15%]">SOV</Th>
            <Th className="w-[23%]">メモ</Th>
          </tr>
        </thead>
        <tbody>
          {categoryRows.map((row) => (
            <tr key={row.category}>
              <Td strong>{row.category}</Td>
              <Td>
                <StatusBadge value={row.status} />
              </Td>
              <Td>
                <InlineBar value={row.visibility} label={`${row.visibility}%`} />
              </Td>
              <Td>{row.sov}%</Td>
              <Td>{row.note}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function CompetitorCompactTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[24%]">ブランド</Th>
            <Th className="w-[14%]">AI表示</Th>
            <Th className="w-[13%]">SOV</Th>
            <Th className="w-[15%]">引用率</Th>
            <Th className="w-[16%]">Position</Th>
            <Th className="w-[18%]">Sentiment</Th>
          </tr>
        </thead>
        <tbody>
          {competitorRows.map((row) => (
            <tr key={row.brand}>
              <Td strong>{row.brand}</Td>
              <Td>{row.visibility}%</Td>
              <Td>{row.sov}%</Td>
              <Td>{row.citation}%</Td>
              <Td>{row.position}</Td>
              <Td>{row.sentiment}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function TrendChart() {
  const visibility = buildLinePoints(trendSeries.map((item) => item.visibility));
  const sov = buildLinePoints(trendSeries.map((item) => item.sov));
  const citation = buildLinePoints(trendSeries.map((item) => item.citation));

  return (
    <div className="min-w-0 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone="green">AI表示率</Badge>
        <Badge>SOV</Badge>
        <Badge tone="amber">自社サイト引用率</Badge>
      </div>
      <svg viewBox="0 0 680 240" className="h-[240px] w-full" role="img" aria-label="主要指標推移の表示例">
        {[40, 80, 120, 160, 200].map((y) => (
          <line key={y} x1="34" y1={y} x2="650" y2={y} stroke="#E5EAE8" strokeWidth="1" />
        ))}
        <polyline points={visibility} fill="none" stroke="#006B57" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={sov} fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={citation} fill="none" stroke="#B7791F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {trendSeries.map((item, index) => (
          <text key={item.date} x={34 + index * 154} y="226" textAnchor="middle" className="fill-[#64748B] text-[12px] font-bold">
            {item.date}
          </text>
        ))}
      </svg>
    </div>
  );
}

function CompetitorTrendBars() {
  return (
    <div className="space-y-3">
      {competitorRows.map((row) => (
        <div key={row.brand} className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)_52px] items-center gap-3">
          <p className="truncate text-[13px] font-bold text-[#0F172A]">{row.brand}</p>
          <InlineBar value={row.sov} />
          <p className="text-right text-[13px] font-bold tabular-nums text-[#0F172A]">{row.sov}%</p>
        </div>
      ))}
    </div>
  );
}

function CategoryHeatmap() {
  return (
    <div className="grid min-w-0 grid-cols-[130px_repeat(5,minmax(0,1fr))] overflow-hidden rounded-md border border-[#E5EAE8] text-[12px] font-bold">
      <HeatHead>カテゴリ</HeatHead>
      {trendSeries.map((item) => (
        <HeatHead key={item.date}>{item.date}</HeatHead>
      ))}
      {categoryRows.map((row, rowIndex) => (
        <RowCells key={row.category} label={row.category} values={trendSeries.map((item, index) => Math.max(18, row.visibility - 6 + rowIndex * 2 + index * 3))} />
      ))}
    </div>
  );
}

function RowCells({ label, values }: { label: string; values: number[] }) {
  return (
    <>
      <div className="min-w-0 border-r border-t border-[#E5EAE8] bg-white px-3 py-2.5 text-[#0F172A]">
        <span className="block truncate">{label}</span>
      </div>
      {values.map((value, index) => (
        <div
          key={`${label}-${index}`}
          className="border-r border-t border-[#E5EAE8] px-2 py-2.5 text-center tabular-nums text-[#0F172A] last:border-r-0"
          style={{ backgroundColor: `rgba(0, 107, 87, ${0.08 + value / 180})` }}
        >
          {value}%
        </div>
      ))}
    </>
  );
}

function ModelTrendTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[20%]">モデル</Th>
            <Th className="w-[18%]">mention</Th>
            <Th className="w-[18%]">position</Th>
            <Th className="w-[20%]">引用ドメイン</Th>
            <Th className="w-[24%]">次の確認</Th>
          </tr>
        </thead>
        <tbody>
          {modelAnswerRows.map((row) => (
            <tr key={row.model}>
              <Td strong>{row.model}</Td>
              <Td>{row.mention}</Td>
              <Td>{row.position}</Td>
              <Td>{row.domains}</Td>
              <Td>{row.summary}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function CompetitorFullTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[18%]">ブランド</Th>
            <Th className="w-[14%]">AI表示率</Th>
            <Th className="w-[11%]">SOV</Th>
            <Th className="w-[13%]">引用率</Th>
            <Th className="w-[17%]">Average Position</Th>
            <Th className="w-[15%]">Sentiment</Th>
            <Th className="w-[12%]">前回比</Th>
          </tr>
        </thead>
        <tbody>
          {competitorRows.map((row) => (
            <tr key={row.brand}>
              <Td strong>
                <span className="block truncate">{row.brand}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-[#64748B]">{row.type}</span>
              </Td>
              <Td>{row.visibility}%</Td>
              <Td>{row.sov}%</Td>
              <Td>{row.citation}%</Td>
              <Td>{row.position}</Td>
              <Td>{row.sentiment}</Td>
              <Td>{row.delta}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function CategoryMatrixTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[28%]">カテゴリ</Th>
            <Th className="w-[18%]">Recora</Th>
            <Th className="w-[18%]">競合A</Th>
            <Th className="w-[18%]">競合B</Th>
            <Th className="w-[18%]">競合C</Th>
          </tr>
        </thead>
        <tbody>
          {categoryMatrix.map((row) => (
            <tr key={row.category}>
              <Td strong>{row.category}</Td>
              <Td>
                <StatusBadge value={row.recora} />
              </Td>
              <Td>
                <StatusBadge value={row.competitorA} />
              </Td>
              <Td>
                <StatusBadge value={row.competitorB} />
              </Td>
              <Td>
                <StatusBadge value={row.competitorC} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function PromptTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[32%]">質問</Th>
            <Th className="w-[14%]">カテゴリ</Th>
            <Th className="w-[14%]">ペルソナ</Th>
            <Th className="w-[12%]">AI表示</Th>
            <Th className="w-[9%]">SOV</Th>
            <Th className="w-[9%]">Position</Th>
            <Th className="w-[10%]">評価</Th>
          </tr>
        </thead>
        <tbody>
          {promptRows.map((row) => (
            <tr key={row.prompt}>
              <Td strong>{row.prompt}</Td>
              <Td>{row.category}</Td>
              <Td>{row.persona}</Td>
              <Td>{row.visibility}</Td>
              <Td>{row.sov}</Td>
              <Td>{row.position}</Td>
              <Td>
                <StatusBadge value={row.evaluation} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function PersonaTable() {
  const rows = [
    ["マーケ責任者", "競合比較と導入効果", "ROIの根拠", "比較ガイドを追加"],
    ["SEO担当", "引用される情報設計", "用語定義の不足", "用語集と内部リンク"],
    ["事業責任者", "社内承認とリスク", "セキュリティ説明", "稟議FAQを追加"]
  ];

  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[20%]">ペルソナ名</Th>
            <Th className="w-[28%]">判断軸</Th>
            <Th className="w-[24%]">不足情報</Th>
            <Th className="w-[28%]">次アクション</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <Td key={cell} strong={index === 0}>
                  {cell}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function ModelAnswerCards() {
  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-2">
      {modelAnswerRows.map((row) => (
        <div key={row.model} className="min-w-0 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-bold leading-5 text-[#0F172A]">{row.model}</p>
              <p className="mt-1 text-[12px] font-bold leading-5 text-[#64748B]">
                mention: {row.mention} / position: {row.position} / sentiment: {row.sentiment}
              </p>
            </div>
            <Badge tone={row.mention === "あり" ? "green" : "slate"}>{row.mention}</Badge>
          </div>
          <p className="mt-3 text-[13px] font-semibold leading-6 text-[#334155]">{row.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>cited domains: {row.domains}</Badge>
            <Badge tone="amber">回答の一部</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModelComparisonTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[17%]">モデル</Th>
            <Th className="w-[13%]">mention</Th>
            <Th className="w-[12%]">position</Th>
            <Th className="w-[15%]">sentiment</Th>
            <Th className="w-[15%]">cited domains</Th>
            <Th className="w-[28%]">回答サマリー</Th>
          </tr>
        </thead>
        <tbody>
          {modelAnswerRows.map((row) => (
            <tr key={row.model}>
              <Td strong>{row.model}</Td>
              <Td>{row.mention}</Td>
              <Td>{row.position}</Td>
              <Td>{row.sentiment}</Td>
              <Td>{row.domains}</Td>
              <Td>{row.summary}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function SourceDomainTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[25%]">ドメイン</Th>
            <Th className="w-[18%]">ソース種別</Th>
            <Th className="w-[13%]">引用数</Th>
            <Th className="w-[15%]">自社引用</Th>
            <Th className="w-[17%]">競合</Th>
            <Th className="w-[12%]">状態</Th>
          </tr>
        </thead>
        <tbody>
          {sourceDomains.map((row) => (
            <tr key={row.domain}>
              <Td strong>{row.domain}</Td>
              <Td>{row.type}</Td>
              <Td>{row.citations}</Td>
              <Td>{row.own}</Td>
              <Td>{row.competitor}</Td>
              <Td>
                <Badge tone={row.status === "取りに行く" ? "amber" : "green"}>{row.status}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function SourceTypeBars() {
  return (
    <div className="space-y-3">
      {sourceTypes.map((item) => (
        <div key={item.label} className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)_48px] items-center gap-3">
          <p className="truncate text-[13px] font-bold text-[#0F172A]">{item.label}</p>
          <InlineBar value={item.value} tone={item.label === "自社サイト" ? "green" : "slate"} />
          <p className="text-right text-[13px] font-bold tabular-nums text-[#0F172A]">{item.value}%</p>
        </div>
      ))}
    </div>
  );
}

function NarrativeTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[30%]">Driver</Th>
            <Th className="w-[18%]">評価</Th>
            <Th className="w-[52%]">説明</Th>
          </tr>
        </thead>
        <tbody>
          {narrativeDrivers.map((row) => (
            <tr key={row.label}>
              <Td strong>{row.label}</Td>
              <Td>
                <StatusBadge value={row.value} />
              </Td>
              <Td>{row.description}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function RecommendationsTable() {
  return (
    <TableWrap>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Th className="w-[10%]">優先度</Th>
            <Th className="w-[25%]">課題</Th>
            <Th className="w-[14%]">施策タイプ</Th>
            <Th className="w-[25%]">根拠要約</Th>
            <Th className="w-[8%]">Impact</Th>
            <Th className="w-[8%]">Diff.</Th>
            <Th className="w-[10%]">状態</Th>
          </tr>
        </thead>
        <tbody>
          {recommendationRows.map((row) => (
            <tr key={row.issue}>
              <Td>
                <Badge tone={row.priority === "高" ? "red" : "amber"}>{row.priority}</Badge>
              </Td>
              <Td strong>{row.issue}</Td>
              <Td>{row.type}</Td>
              <Td>{row.evidence}</Td>
              <Td>{row.impact}</Td>
              <Td>{row.difficulty}</Td>
              <Td>
                <Badge tone={row.status === "未対応" ? "amber" : "green"}>{row.status}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function MetricStrip({
  items,
  columns
}: {
  items: { label: string; value: string; helper?: string; progress?: number; tone?: Tone }[];
  columns: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#DDE8E5] bg-white">
      <div className={cn("grid min-w-0 md:grid-cols-2", columns)}>
        {items.map((item) => (
          <div key={item.label} className="min-w-0 border-b border-[#E5EAE8] px-4 py-3.5 md:border-r xl:border-b-0 xl:last:border-r-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[12px] font-bold leading-5 text-[#64748B]" title={item.label}>
                {item.label}
              </p>
              {item.tone ? <span className={cn("h-2 w-2 shrink-0 rounded-full", toneDotClass(item.tone))} /> : null}
            </div>
            <p className="mt-1 truncate text-[24px] font-bold leading-none tracking-normal tabular-nums text-[#0F172A]" title={item.value}>
              {item.value}
            </p>
            {typeof item.progress === "number" ? <InlineBar className="mt-3" value={item.progress} tone={item.tone === "amber" ? "amber" : "green"} /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function Panel({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#DDE8E5] bg-white">
      <div className="border-b border-[#E5EAE8] px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <CircleDot className="h-4 w-4 shrink-0 text-[#006B57]" aria-hidden="true" />
          <h3 className="min-w-0 truncate text-[16px] font-bold leading-6 text-[#0F172A]">{title}</h3>
        </div>
        {description ? <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">{description}</p> : null}
      </div>
      <div className="min-w-0 p-4">{children}</div>
    </section>
  );
}

function DetailRail({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <aside className="min-w-0 rounded-lg border border-[#DDE8E5] bg-[#FAFCFB] p-4">
      {eyebrow ? <Badge tone="green">{eyebrow}</Badge> : null}
      <h4 className="mt-3 text-[15px] font-bold leading-6 text-[#0F172A]">{title}</h4>
      <div className="mt-4">{children}</div>
    </aside>
  );
}

function DetailList({ items }: { items: [string, string][] }) {
  return (
    <dl className="space-y-2">
      {items.map(([label, value]) => (
        <div key={`${label}-${value}`} className="grid min-w-0 gap-1 rounded-md border border-[#E5EAE8] bg-white px-3 py-2.5">
          <dt className="text-[11px] font-bold leading-4 text-[#64748B]">{label}</dt>
          <dd className="break-words text-[13px] font-bold leading-6 text-[#0F172A]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TimelineList({ items }: { items: [string, string][] }) {
  return (
    <div className="space-y-3">
      {items.map(([label, value]) => (
        <div key={label} className="flex gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E6F4F1] text-[#006B57]">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-5 text-[#0F172A]">{label}</p>
            <p className="mt-1 text-[13px] font-semibold leading-6 text-[#64748B]">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterStrip({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2 rounded-lg border border-[#DDE8E5] bg-white p-2">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "inline-flex min-h-9 items-center rounded-md border px-3 text-[13px] font-bold",
            item === active ? "border-[#B8DCD2] bg-[#E6F4F1] text-[#005C50]" : "border-[#E5EAE8] bg-[#FAFCFB] text-[#64748B]"
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompactList({ items }: { items: [string, string][] }) {
  return (
    <div className="space-y-2">
      {items.map(([label, value]) => (
        <div key={`${label}-${value}`} className="grid min-w-0 gap-2 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-3 md:grid-cols-[150px_minmax(0,1fr)]">
          <p className="truncate text-[13px] font-bold leading-6 text-[#0F172A]">{label}</p>
          <p className="text-[13px] font-semibold leading-6 text-[#64748B]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendationCompact({ item }: { item: (typeof recommendationRows)[number] }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-[13px] font-bold leading-6 text-[#0F172A]">{item.issue}</p>
        <Badge tone={item.priority === "高" ? "red" : "amber"}>{item.priority}</Badge>
      </div>
      <p className="mt-1 text-[12px] font-semibold leading-5 text-[#64748B]">{item.evidence}</p>
    </div>
  );
}

function ChangeItem({ item }: { item: (typeof recentChanges)[number] }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E5EAE8] bg-[#FAFCFB] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold text-[#0F172A]">{item.label}</p>
        <Badge tone={item.tone}>{item.value}</Badge>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[#64748B]">{item.description}</p>
    </div>
  );
}

function TableWrap({ children }: { children: ReactNode }) {
  return <div className="min-w-0 overflow-hidden rounded-md border border-[#E5EAE8] bg-white">{children}</div>;
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
    <td className="border-b border-[#E5EAE8] px-3 py-3 align-middle text-[13px] leading-6 text-[#334155]">
      <div className={cn("min-w-0 break-words", strong && "font-bold text-[#0F172A]")}>{children}</div>
    </td>
  );
}

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full items-center rounded-sm border px-2 py-0.5 text-[11px] font-bold leading-5",
        tone === "default" && "border-[#DDE8E5] bg-[#FAFCFB] text-[#64748B]",
        tone === "green" && "border-[#B8DCD2] bg-[#E6F4F1] text-[#006B57]",
        tone === "amber" && "border-[#F3D6A2] bg-[#FFF7E8] text-[#9A5B00]",
        tone === "red" && "border-[#F3B8B8] bg-[#FFF1F0] text-[#B42318]",
        tone === "slate" && "border-[#DDE8E5] bg-[#F1F5F9] text-[#475569]"
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function StatusBadge({ value, tone }: { value: string; tone?: Tone }) {
  return <Badge tone={tone ?? statusTone(value)}>{value}</Badge>;
}

function InlineBar({
  value,
  label,
  tone = "green",
  className
}: {
  value: number;
  label?: string;
  tone?: "green" | "amber" | "slate";
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-[#EDF2F0]">
          <div
            className={cn("h-full rounded-sm", tone === "green" && "bg-[#006B57]", tone === "amber" && "bg-[#B7791F]", tone === "slate" && "bg-[#64748B]")}
            style={{ width: `${width}%` }}
          />
        </div>
        {label ? <span className="shrink-0 text-[12px] font-bold tabular-nums text-[#0F172A]">{label}</span> : null}
      </div>
    </div>
  );
}

function Sparkline({ values, tone }: { values: number[]; tone: "green" | "amber" }) {
  return (
    <svg viewBox="0 0 160 54" className="mt-3 h-[54px] w-full" aria-hidden="true">
      <polyline
        fill="none"
        points={buildSparklinePoints(values)}
        stroke={tone === "green" ? "#006B57" : "#B7791F"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}

function HeatHead({ children }: { children: ReactNode }) {
  return <div className="border-r border-[#DDE8E5] bg-[#F8FAF9] px-3 py-2.5 text-[#475569] last:border-r-0">{children}</div>;
}

function buildLinePoints(values: number[]) {
  const max = Math.max(...values, 80);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = 34 + index * 154;
      const y = 204 - ((value - min) / range) * 166;
      return `${x},${y}`;
    })
    .join(" ");
}

function buildSparklinePoints(values: number[]) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = 8 + index * (144 / Math.max(1, values.length - 1));
      const y = 46 - ((value - min) / range) * 36;
      return `${x},${y}`;
    })
    .join(" ");
}

function statusTone(value: string): Tone {
  if (["強い", "好意的", "維持", "共有済み", "完了", "対応中"].includes(value)) return "green";
  if (["要改善", "確認中", "取りに行く", "中", "中立", "中立+"].includes(value)) return "amber";
  if (["弱い", "高", "未対応"].includes(value)) return "red";
  return "default";
}

function toneDotClass(tone: Tone) {
  if (tone === "green") return "bg-[#006B57]";
  if (tone === "amber") return "bg-[#B7791F]";
  if (tone === "red") return "bg-[#B42318]";
  return "bg-[#64748B]";
}
