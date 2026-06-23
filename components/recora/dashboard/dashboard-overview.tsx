import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleGauge,
  ExternalLink,
  FileText,
  Layers3,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  RecoraCumulativeSourceDomainRank,
  RecoraDashboardDbData,
  RecoraHomeDataCautionFlag,
  RecoraHomeReadModelDbData,
  RecoraMetricSnapshotRow,
  RecoraPriority,
  RecoraRecommendationRow,
  RecoraSourceType
} from "@/lib/recora/db";

type DashboardKpi = {
  label: string;
  value: string;
  helper: string;
  tone: "green" | "mint" | "slate" | "amber";
  icon: LucideIcon;
};

type SnapshotRow = {
  id: string;
  label: string;
  visibility: number;
  visibilityLabel: string;
  averagePositionLabel: string;
  observationLabel: string;
  deltaLabel: string;
  qualityLabel: string;
};

type CompetitorRow = {
  id: string;
  name: string;
  visibility: number;
  visibilityLabel: string;
  averagePositionLabel: string;
  shareOfVoiceLabel: string;
  gapLabel: string;
  isPrimary: boolean;
};

type SourceCompositionRow = {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  share: number;
  color: string;
};

type SourceDomainRow = {
  domain: string;
  sourceTypeLabel: string;
  occurrenceCount: number;
  occurrenceLabel: string;
  urlLabel: string;
  share: number;
};

type IssueRow = {
  id: string;
  priority: RecoraPriority;
  typeLabel: string;
  title: string;
  reason: string;
};

type DashboardOverviewView = {
  projectName: string;
  reportBase: string;
  periodLabel: string;
  periodValue: string;
  periodHelper: string;
  lastUpdated: string;
  primaryBrandName: string;
  isReportReady: boolean;
  hasLatestMetrics: boolean;
  aiVisibilityValue: string;
  aiVisibilityNumber: number;
  previousComparisonLabel: string;
  auditSummary: string;
  scopeNote: string;
  kpis: DashboardKpi[];
  topicRows: SnapshotRow[];
  modelRows: SnapshotRow[];
  competitorRows: CompetitorRow[];
  sourceComposition: SourceCompositionRow[];
  sourceDomains: SourceDomainRow[];
  sourceDomainMax: number;
  issueRows: IssueRow[];
  cautionMessages: string[];
  preparationMessage: string;
};

export function DashboardOverview({
  dashboardData = null,
  homeReadModelData = null
}: {
  dashboardData?: RecoraDashboardDbData | null;
  homeReadModelData?: RecoraHomeReadModelDbData | null;
}) {
  const view = createDashboardOverviewView(dashboardData, homeReadModelData);

  if (!view.isReportReady) {
    return (
      <div className="min-w-0 space-y-5">
        <DashboardHeader view={view} />
        <DashboardPreparationPanel view={view} />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <DashboardHeader view={view} />

      <VisibilitySummary view={view} />

      <KpiStrip kpis={view.kpis} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <PromptCategoryPanel rows={view.topicRows} />
        <ModelVisibilityPanel rows={view.modelRows} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
        <CompetitorAuditPanel rows={view.competitorRows} />
        <SourceAuditPanel
          composition={view.sourceComposition}
          domains={view.sourceDomains}
          domainMax={view.sourceDomainMax}
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <BrandImpressionPanel />
        <IssuesPanel rows={view.issueRows} />
      </div>

      <DashboardCautionPanel messages={view.cautionMessages} />
    </div>
  );
}

function DashboardHeader({ view }: { view: DashboardOverviewView }) {
  return (
    <header className="min-w-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#00796B]">有料版ダッシュボード</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#0F172A] sm:text-3xl">
            ダッシュボード
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#475569]">
            <ScopePill label="対象project" value={view.projectName} />
            <ScopePill label={view.periodLabel} value={view.periodValue} />
            <ScopePill label="最終更新" value={view.lastUpdated} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={view.reportBase}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DDE8E5] bg-white px-3 text-sm font-bold text-[#005C50] shadow-sm transition hover:border-[#00796B]/35 hover:bg-[#E6F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
          >
            最新レポートへ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ScopePill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[#DDE8E5] bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="shrink-0 text-xs font-bold text-[#64748B]">{label}</span>
      <span className="min-w-0 truncate text-xs font-bold text-[#0F172A]" title={value}>
        {value}
      </span>
    </span>
  );
}

function DashboardPreparationPanel({ view }: { view: DashboardOverviewView }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="grid min-w-0 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="border-b border-amber-200 bg-amber-50 p-5 lg:border-b-0 lg:border-r sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-[#0F172A]">レポート準備中</h2>
          <p className="mt-2 text-sm leading-6 text-[#475569]">
            report ready gate が完了するまで、顧客向けの数値や内部確認用の情報は表示しません。
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm font-bold text-[#0F172A]">現在表示できるダッシュボードはありません</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475569]">{view.preparationMessage}</p>
          <div className="mt-5 rounded-xl border border-dashed border-[#DDE8E5] bg-[#F6FAF9] px-4 py-6 text-center">
            <p className="text-sm font-bold text-[#0F172A]">準備が完了すると、AI表示率と監査カードを表示します</p>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              実測データ、metric snapshots、有効観測、データ由来の確認が揃ったあとに表示されます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisibilitySummary({ view }: { view: DashboardOverviewView }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DDE8E5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_58px_rgba(15,23,42,0.07)]">
      <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.72fr)]">
        <div className="min-w-0 p-5 sm:p-6 lg:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00796B]/15 bg-[#E6F4F1] px-3 py-1.5 text-sm font-bold text-[#005C50]">
            <ShieldCheck className="h-4 w-4" />
            AI検索 visibility audit
          </div>
          <h2 className="mt-5 max-w-2xl text-xl font-bold leading-snug tracking-normal text-[#0F172A] sm:text-2xl">
            {view.primaryBrandName} のAI検索における表示状況
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#475569]">{view.auditSummary}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <SummaryFact label="測定範囲" value={view.periodValue} helper={view.periodHelper} />
            <SummaryFact label="対象ブランド" value={view.primaryBrandName} helper="primary brand" />
            <SummaryFact label="表示ルール" value="non-branded中心" helper={view.scopeNote} />
          </div>
        </div>

        <div className="min-w-0 border-t border-[#DDE8E5] bg-[radial-gradient(circle_at_20%_20%,rgba(111,225,195,0.18),transparent_30%),linear-gradient(135deg,#F8FCFB,#FFFFFF)] p-5 xl:border-l xl:border-t-0 sm:p-6 lg:p-7">
          <div className="rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-[0_12px_38px_rgba(0,63,54,0.08)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-[#0F172A]">AI表示率</p>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">最新レポートの観測値</p>
              </div>
              <span className="rounded-full border border-[#00796B]/15 bg-[#E6F4F1] px-3 py-1 text-sm font-bold text-[#005C50]">
                visibility
              </span>
            </div>

            <div className="mt-6 flex min-w-0 items-end gap-3">
              <p className="text-7xl font-bold leading-none tracking-normal text-[#003F36] sm:text-8xl">
                {view.aiVisibilityValue}
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-[#DDE8E5] bg-[#F6FAF9] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#64748B]">前回比</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold text-[#475569]">
                  {view.previousComparisonLabel}
                </span>
              </div>
            </div>

            {view.hasLatestMetrics ? (
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#E8EFED]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6FE1C3] to-[#00796B]"
                  style={{ width: `${view.aiVisibilityNumber}%` }}
                />
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState message="AI表示率のmetric snapshotを取得後に表示します。" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryFact({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#DDE8E5] bg-[#F6FAF9] px-4 py-3">
      <p className="text-sm font-bold text-[#64748B]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#0F172A]" title={value}>
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#64748B]">{helper}</p>
    </div>
  );
}

function KpiStrip({ kpis }: { kpis: DashboardKpi[] }) {
  return (
    <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiTile key={kpi.label} kpi={kpi} />
      ))}
    </section>
  );
}

function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  const Icon = kpi.icon;

  return (
    <article className="min-w-0 rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#64748B]" title={kpi.label}>
            {kpi.label}
          </p>
          <p className="mt-2 truncate text-3xl font-bold tracking-normal text-[#0F172A]" title={kpi.value}>
            {kpi.value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            kpi.tone === "green" && "bg-[#E6F4F1] text-[#00796B]",
            kpi.tone === "mint" && "bg-emerald-50 text-emerald-700",
            kpi.tone === "slate" && "bg-slate-100 text-slate-600",
            kpi.tone === "amber" && "bg-amber-50 text-amber-700"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#64748B]">{kpi.helper}</p>
    </article>
  );
}

function PromptCategoryPanel({ rows }: { rows: SnapshotRow[] }) {
  return (
    <SectionFrame
      icon={Layers3}
      eyebrow="prompt categories"
      title="プロンプトカテゴリ別の表示状況"
      description="カテゴリ名を安全に解決できるread modelがある場合だけ表示します。名称が不明な値は実データのように見せません。"
    >
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#DDE8E5]">
          <div className="grid grid-cols-[minmax(150px,1.2fr)_minmax(170px,1fr)_120px_120px] gap-0 bg-[#F6FAF9] px-4 py-3 text-sm font-bold text-[#64748B] max-lg:hidden">
            <span>カテゴリ</span>
            <span>AI表示率</span>
            <span>平均順位</span>
            <span>比較</span>
          </div>
          <div className="divide-y divide-[#DDE8E5]">
            {rows.map((row) => (
              <SnapshotTableRow key={row.id} row={row} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message="カテゴリ名を安全に解決できないため、現在のread modelでは表示を省略しています。" />
      )}
    </SectionFrame>
  );
}

function SnapshotTableRow({ row }: { row: SnapshotRow }) {
  return (
    <div className="grid min-w-0 gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(150px,1.2fr)_minmax(170px,1fr)_120px_120px] lg:items-center">
      <div className="min-w-0">
        <p className="truncate font-bold text-[#0F172A]" title={row.label}>
          {row.label}
        </p>
        <p className="mt-1 text-sm text-[#64748B]">{row.qualityLabel}</p>
      </div>
      <InlineBar value={row.visibility} label={row.visibilityLabel} />
      <p className="font-bold tabular-nums text-[#0F172A]">{row.averagePositionLabel}</p>
      <p className="font-bold text-[#64748B]">{row.deltaLabel}</p>
    </div>
  );
}

function ModelVisibilityPanel({ rows }: { rows: SnapshotRow[] }) {
  return (
    <SectionFrame
      icon={BarChart3}
      eyebrow="AI models"
      title="AIモデル別の表示状況"
      description="モデル別のAI表示率スナップショットが存在する場合のみ、横棒で比較します。"
    >
      {rows.length > 0 ? (
        <div className="grid gap-3">
          {rows.map((row) => (
            <div key={row.id} className="min-w-0 rounded-xl border border-[#DDE8E5] bg-[#FAFBFB] px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-[#0F172A]" title={row.label}>
                  {row.label}
                </p>
                <p className="shrink-0 text-sm font-bold tabular-nums text-[#0F172A]">{row.visibilityLabel}</p>
              </div>
              <InlineBar value={row.visibility} label={row.averagePositionLabel} hideValue />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="モデル名を安全に解決できないため、現在のread modelではモデル比較を表示していません。" />
      )}
    </SectionFrame>
  );
}

function CompetitorAuditPanel({ rows }: { rows: CompetitorRow[] }) {
  const maxVisibility = Math.max(1, ...rows.map((row) => row.visibility));

  return (
    <SectionFrame
      icon={SearchCheck}
      eyebrow="competitive audit"
      title="競合とのAI表示率比較"
      description="最新レポート内のブランド別metric snapshotを中程度の深さで表示します。公式順位ではありません。"
      actionHref="/dashboard/reports"
      actionLabel="詳細へ"
    >
      {rows.length > 0 ? (
        <div className="grid gap-3">
          {rows.slice(0, 4).map((row) => (
            <div
              key={row.id}
              className={cn(
                "min-w-0 rounded-xl border px-4 py-3",
                row.isPrimary ? "border-[#00796B]/25 bg-[#E6F4F1]" : "border-[#DDE8E5] bg-[#FAFBFB]"
              )}
            >
              <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(170px,1fr)_90px_120px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-[#0F172A]" title={row.name}>
                      {row.name}
                    </p>
                    <span className="rounded-full border border-white bg-white px-2.5 py-1 text-xs font-bold text-[#005C50]">
                      {row.isPrimary ? "自社" : "競合"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B]">平均順位 {row.averagePositionLabel}</p>
                </div>
                <InlineBar value={(row.visibility / maxVisibility) * 100} label={row.visibilityLabel} />
                <p className="text-sm font-bold tabular-nums text-[#0F172A]">{row.shareOfVoiceLabel}</p>
                <p className="text-sm font-bold text-[#64748B]">{row.gapLabel}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="ブランド別metric snapshotがないため、競合比較はまだ表示できません。" />
      )}
    </SectionFrame>
  );
}

function SourceAuditPanel({
  composition,
  domains,
  domainMax
}: {
  composition: SourceCompositionRow[];
  domains: SourceDomainRow[];
  domainMax: number;
}) {
  return (
    <SectionFrame
      icon={ExternalLink}
      eyebrow="source audit"
      title="引用元・ソース監査"
      description="通算read modelにある表示可能な参照ドメインを、構成比と上位ドメインで確認します。"
    >
      {composition.length > 0 ? (
        <div className="space-y-5">
          <div>
            <div className="flex h-10 overflow-hidden rounded-lg border border-[#DDE8E5] bg-[#F6FAF9]">
              {composition.map((item) => (
                <span
                  key={item.key}
                  className="flex min-w-8 items-center justify-center text-sm font-bold text-white"
                  style={{ width: `${Math.max(4, item.share)}%`, backgroundColor: item.color }}
                  title={`${item.label}: ${item.valueLabel}`}
                >
                  {item.share >= 12 ? `${item.share}%` : ""}
                </span>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {composition.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-bold text-[#475569]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-bold tabular-nums text-[#0F172A]">{item.valueLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {domains.slice(0, 5).map((domain, index) => (
              <SourceDomainListRow
                key={domain.domain}
                row={domain}
                rank={index + 1}
                max={domainMax}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message="引用元ドメインが蓄積された後に、構成比と上位ドメインを表示します。" />
      )}
    </SectionFrame>
  );
}

function SourceDomainListRow({ row, rank, max }: { row: SourceDomainRow; rank: number; max: number }) {
  const width = Math.max(6, Math.min(100, (row.occurrenceCount / Math.max(1, max)) * 100));

  return (
    <div className="min-w-0 rounded-xl border border-[#DDE8E5] bg-[#FAFBFB] px-4 py-3">
      <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3">
        <span className="text-sm font-bold tabular-nums text-[#64748B]">{rank}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0F172A]" title={row.domain}>
            {row.domain}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            {row.sourceTypeLabel} / URL {row.urlLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums text-[#0F172A]">{row.occurrenceLabel}</p>
          <p className="text-xs font-bold text-[#64748B]">参照出現</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#00796B]" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-[#64748B]">通算参照出現のうち約{row.share}%</p>
    </div>
  );
}

function BrandImpressionPanel() {
  return (
    <SectionFrame
      icon={CircleGauge}
      eyebrow="brand impression"
      title="ブランド印象サマリー"
      description="ブランド印象はbranded prompt側の用途です。現在のホームread modelに感情集計がない場合は、数値を作らず省略します。"
    >
      <EmptyState message="ブランド印象のpositive / neutral / negative集計は、現在の /dashboard read model では取得していません。" />
    </SectionFrame>
  );
}

function IssuesPanel({ rows }: { rows: IssueRow[] }) {
  return (
    <SectionFrame
      icon={ListChecks}
      eyebrow="audit issues"
      title="確認すべき課題"
      description="改善提案を主役にせず、監査結果として確認が必要な候補だけをコンパクトに表示します。"
    >
      {rows.length > 0 ? (
        <div className="grid gap-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-[#DDE8E5] bg-[#FAFBFB] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={row.priority} />
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#64748B]">
                  {row.typeLabel}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-[#0F172A]">{row.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#64748B]">{row.reason}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="現在、顧客向けに表示できる確認課題はありません。" />
      )}
    </SectionFrame>
  );
}

function DashboardCautionPanel({ messages }: { messages: string[] }) {
  const visibleMessages = messages.length > 0
    ? messages.slice(0, 4)
    : ["表示値はRecoraの観測範囲に基づく参考値です。"];

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">表示の前提</p>
            <p className="mt-1 text-sm font-semibold text-amber-700">保証表現は使いません</p>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-2">
          {visibleMessages.map((message) => (
            <p key={message} className="rounded-xl border border-amber-200/70 bg-white px-3 py-2 text-sm leading-6 text-[#475569]">
              {message}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionFrame({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  actionHref,
  actionLabel
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#DDE8E5] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00796B]/15 bg-[#E6F4F1] px-3 py-1 text-sm font-bold text-[#005C50]">
            <Icon className="h-4 w-4" />
            {eyebrow}
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-normal text-[#0F172A]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-[#DDE8E5] bg-white px-3 text-sm font-bold text-[#005C50] transition hover:bg-[#F6FAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

function InlineBar({
  value,
  label,
  hideValue = false
}: {
  value: number;
  label: string;
  hideValue?: boolean;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        {!hideValue ? <span className="text-sm font-bold tabular-nums text-[#0F172A]">{label}</span> : null}
        {hideValue ? <span className="text-sm font-semibold text-[#64748B]">{label}</span> : null}
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E8EFED]">
        <div className="h-full rounded-full bg-[#00796B]" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#DDE8E5] bg-[#F6FAF9] px-4 py-5 text-sm leading-6 text-[#64748B]">
      {message}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: RecoraPriority }) {
  const labels: Record<RecoraPriority, string> = {
    high: "高",
    medium: "中",
    low: "低"
  };

  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-bold",
        priority === "high" && "border-rose-200 bg-rose-50 text-rose-700",
        priority === "medium" && "border-amber-200 bg-amber-50 text-amber-700",
        priority === "low" && "border-slate-200 bg-white text-[#64748B]"
      )}
    >
      優先度: {labels[priority]}
    </span>
  );
}

function createDashboardOverviewView(
  data?: RecoraDashboardDbData | null,
  homeData?: RecoraHomeReadModelDbData | null
): DashboardOverviewView {
  const primaryBrand = data?.brands.find((brand) => brand.brand_type === "primary") ?? null;
  const brandById = new Map((data?.brands ?? []).map((brand) => [brand.id, brand]));
  const brandSnapshots = (data?.metricSnapshots ?? []).filter(
    (snapshot) => snapshot.scope_type === "brand" && snapshot.brand_id
  );
  const projectSnapshot =
    (data?.metricSnapshots ?? []).find((snapshot) => snapshot.scope_type === "project") ??
    brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ??
    null;
  const primarySnapshot =
    brandSnapshots.find((snapshot) => snapshot.brand_id === primaryBrand?.id) ??
    projectSnapshot;
  const latestVisibility = getRoundedNumber(primarySnapshot?.ai_visibility ?? projectSnapshot?.ai_visibility);
  const hasLatestMetrics = latestVisibility !== null;
  const isReportReady = data?.reportReadyGate.status === "customer_ready";
  const dateScope = getDateScope(data?.latestRun?.period_start, data?.latestRun?.period_end, data?.project?.default_period);
  const reportBase = data?.project?.slug ? `/dashboard/reports/${data.project.slug}` : "/dashboard/reports";
  const homeSummary = homeData?.cumulativeHomeSummary ?? null;
  const sourceComposition = createSourceCompositionRows(homeSummary?.sourceDomainRanking ?? [], homeSummary?.citationOccurrenceCount ?? 0);
  const sourceDomains = createSourceDomainRows(homeSummary?.sourceDomainRanking ?? [], homeSummary?.citationOccurrenceCount ?? 0);
  const competitorRows = createCompetitorRows(brandSnapshots, brandById, primaryBrand?.id ?? null);
  const topicRows: SnapshotRow[] = [];
  const modelRows: SnapshotRow[] = [];

  return {
    projectName: data?.project?.name ?? "Recora",
    reportBase,
    periodLabel: dateScope.label,
    periodValue: dateScope.value,
    periodHelper: dateScope.helper,
    lastUpdated: formatDateTime(data?.latestRun?.completed_at ?? data?.project?.updated_at),
    primaryBrandName: primaryBrand?.name ?? "対象ブランド",
    isReportReady,
    hasLatestMetrics,
    aiVisibilityValue: hasLatestMetrics ? formatPercent(latestVisibility) : "-",
    aiVisibilityNumber: latestVisibility ?? 0,
    previousComparisonLabel: "比較データなし",
    auditSummary: createAuditSummary({
      hasLatestMetrics,
      primaryBrandName: primaryBrand?.name ?? "対象ブランド",
      aiVisibilityValue: hasLatestMetrics ? formatPercent(latestVisibility) : "-",
      competitorRows
    }),
    scopeNote: "AI表示率は既存の分離ルールに従い、branded promptの印象指標とは混ぜません。",
    kpis: createKpis(data, homeData, primarySnapshot ?? projectSnapshot, isReportReady),
    topicRows,
    modelRows,
    competitorRows,
    sourceComposition,
    sourceDomains,
    sourceDomainMax: Math.max(1, ...sourceDomains.map((row) => row.occurrenceCount)),
    issueRows: createIssueRows(data?.recommendations ?? []),
    cautionMessages: createCautionMessages([
      ...(homeData?.latestAggregateSummary?.dataCautionFlags ?? []),
      ...(homeData?.cumulativeHomeSummary?.dataCautionFlags ?? []),
      ...(homeData?.trendHomeSummary?.dataCautionFlags ?? [])
    ]),
    preparationMessage: createPreparationMessage(data)
  };
}

function createKpis(
  data: RecoraDashboardDbData | null | undefined,
  homeData: RecoraHomeReadModelDbData | null | undefined,
  snapshot: RecoraMetricSnapshotRow | null | undefined,
  isReportReady: boolean
): DashboardKpi[] {
  const validObservations = data?.counts.validObservations;
  const cumulative = homeData?.cumulativeHomeSummary ?? null;
  const reportStatus = isReportReady ? "正常" : "準備中";

  return [
    {
      label: "有効観測数",
      value: formatCount(validObservations),
      helper: "最新レポート内で有効と扱える観測数",
      tone: "green",
      icon: CheckCircle2
    },
    {
      label: "平均掲載順位",
      value: formatAveragePosition(snapshot?.average_position),
      helper: "表示時の平均順位。条件付きの参考値です",
      tone: "mint",
      icon: BarChart3
    },
    {
      label: "Share of Voice",
      value: formatPercentOrDash(snapshot?.share_of_voice),
      helper: "metric snapshotに保存されたブランド言及比率",
      tone: "slate",
      icon: CircleGauge
    },
    {
      label: "レポート状態",
      value: reportStatus,
      helper: cumulative ? `通算集計期間: ${formatPeriod(cumulative.aggregationPeriod.start, cumulative.aggregationPeriod.end)}` : "report ready gateの状態",
      tone: isReportReady ? "green" : "amber",
      icon: FileText
    }
  ];
}

function createCompetitorRows(
  snapshots: RecoraMetricSnapshotRow[],
  brandById: Map<string, { name: string; brand_type: string }>,
  primaryBrandId: string | null
): CompetitorRow[] {
  const rows = snapshots.map((snapshot) => {
    const brand = snapshot.brand_id ? brandById.get(snapshot.brand_id) : null;
    const isPrimary = snapshot.brand_id === primaryBrandId || brand?.brand_type === "primary";

    return {
      id: snapshot.id,
      name: brand?.name ?? "Unknown",
      visibility: Math.round(snapshot.ai_visibility),
      visibilityLabel: formatPercent(Math.round(snapshot.ai_visibility)),
      averagePositionLabel: formatAveragePosition(snapshot.average_position),
      shareOfVoiceLabel: formatPercentOrDash(snapshot.share_of_voice),
      gapLabel: typeof snapshot.competitive_gap === "number" ? formatSignedPt(snapshot.competitive_gap) : "比較データなし",
      isPrimary
    };
  });

  return rows.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.visibility - a.visibility);
}

function createSourceCompositionRows(
  rows: RecoraCumulativeSourceDomainRank[],
  totalOccurrences: number
): SourceCompositionRow[] {
  if (rows.length === 0 || totalOccurrences <= 0) return [];

  const grouped = new Map<RecoraSourceType, number>();
  for (const row of rows) {
    grouped.set(row.sourceType, (grouped.get(row.sourceType) ?? 0) + row.occurrenceCount);
  }

  const visibleRows = Array.from(grouped.entries()).map(([sourceType, value]) =>
    createSourceCompositionRow(sourceType, value, totalOccurrences)
  );
  const visibleTotal = visibleRows.reduce((total, row) => total + row.value, 0);
  const rest = Math.max(0, totalOccurrences - visibleTotal);

  if (rest > 0) {
    visibleRows.push({
      key: "other",
      label: "その他",
      value: rest,
      valueLabel: formatCount(rest),
      share: Math.round((rest / totalOccurrences) * 100),
      color: "#CBD5E1"
    });
  }

  return visibleRows
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function createSourceCompositionRow(
  sourceType: RecoraSourceType,
  value: number,
  totalOccurrences: number
): SourceCompositionRow {
  const styles: Record<RecoraSourceType, { label: string; color: string }> = {
    owned: { label: "自社サイト", color: "#00796B" },
    competitor: { label: "競合サイト", color: "#475569" },
    media: { label: "第三者メディア", color: "#2AAE9B" },
    review: { label: "レビュー", color: "#B7791F" },
    technical: { label: "技術・資料", color: "#64748B" },
    unknown: { label: "不明", color: "#94A3B8" }
  };
  const style = styles[sourceType];

  return {
    key: sourceType,
    label: style.label,
    value,
    valueLabel: formatCount(value),
    share: Math.round((value / totalOccurrences) * 100),
    color: style.color
  };
}

function createSourceDomainRows(
  rows: RecoraCumulativeSourceDomainRank[],
  totalOccurrences: number
): SourceDomainRow[] {
  return rows.map((row) => ({
    domain: row.domain,
    sourceTypeLabel: getSourceTypeLabel(row.sourceType),
    occurrenceCount: row.occurrenceCount,
    occurrenceLabel: formatCount(row.occurrenceCount),
    urlLabel: formatCount(row.citationUrlCount),
    share: totalOccurrences > 0 ? Math.round((row.occurrenceCount / totalOccurrences) * 100) : 0
  }));
}

function createIssueRows(recommendations: RecoraRecommendationRow[]): IssueRow[] {
  return recommendations.slice(0, 3).map((recommendation) => ({
    id: recommendation.id,
    priority: recommendation.priority,
    typeLabel: getRecommendationTypeLabel(recommendation.type),
    title: recommendation.title,
    reason: recommendation.reason ?? "確認理由は追加データ取得後に表示します。"
  }));
}

function createAuditSummary({
  hasLatestMetrics,
  primaryBrandName,
  aiVisibilityValue,
  competitorRows
}: {
  hasLatestMetrics: boolean;
  primaryBrandName: string;
  aiVisibilityValue: string;
  competitorRows: CompetitorRow[];
}) {
  if (!hasLatestMetrics) {
    return "最新レポートのAI表示率を取得後に、ここへ監査サマリーを表示します。データがない状態で改善提案や評価文は生成しません。";
  }

  const primaryRow = competitorRows.find((row) => row.isPrimary);
  const strongestCompetitor = competitorRows.find((row) => !row.isPrimary);
  const competitorNote = primaryRow && strongestCompetitor
    ? `${strongestCompetitor.name} との比較は下部の競合比較カードで確認できます。`
    : "競合比較は、ブランド別metric snapshotが揃った後に確認できます。";

  return `${primaryBrandName} のAI表示率は ${aiVisibilityValue} です。前回比較は現在のread modelから安全に算出できないため、メインカードでは比較データなしとして表示します。${competitorNote}`;
}

function createPreparationMessage(data?: RecoraDashboardDbData | null) {
  if (!data?.project) {
    return "対象projectが取得できないため、顧客向けダッシュボードを表示していません。";
  }

  return "公開前の確認が残っているため、顧客向け画面では安全な準備中表示に切り替えています。";
}

function createCautionMessages(flags: RecoraHomeDataCautionFlag[]) {
  const messages = flags.map((flag) => {
    const known: Record<string, string> = {
      latest_aggregate_not_cumulative: "最新集計は通算値ではありません。",
      citation_count_not_source_to_claim_support: "参照として出現した数です。根拠確認済み件数ではありません。",
      recommendation_count_not_approved_actions: "改善候補数です。実行確定済みの施策数ではありません。",
      seed_measurements_excluded: "seedを含む測定は organic discovery の証拠として扱いません。",
      aggregate_runs_excluded_from_cumulative: "aggregate run は通算ホームのcountから除外しています。",
      unsafe_run_items_excluded: "失敗・partial・error の可能性がある観測はcountから除外しています。",
      small_sample_caution: "少数観測のため、追加測定で傾向が変わる可能性があります。",
      trend_comparability_needs_verification: "推移はcount系のみです。測定条件の完全一致は追加確認が必要です。",
      no_ai_visibility_or_competitive_gap_trend_p0: "AI可視性や競合差分の推移はP0では表示していません。"
    };

    if (known[flag.code]) return known[flag.code];
    if (flag.severity === "warning") return "集計値は注意付きで確認してください。";
    if (flag.severity === "needs_verification") return "一部の集計条件は追加確認が必要です。";
    return "表示値はRecoraの観測範囲に基づく参考値です。";
  });

  return Array.from(new Set(messages));
}

function getDateScope(start?: string | null, end?: string | null, fallback?: string | null) {
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo"
  }).format(date);
}

function formatCount(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toLocaleString("ja-JP")}件` : "-";
}

function formatPercent(value: number) {
  return `${value}%`;
}

function formatPercentOrDash(value: number | null | undefined) {
  return typeof value === "number" ? formatPercent(Math.round(value)) : "-";
}

function formatAveragePosition(value: number | null | undefined) {
  return typeof value === "number" ? `${round1(value)}位` : "-";
}

function formatSignedPt(value: number | null | undefined) {
  if (typeof value !== "number") return "比較データなし";
  const rounded = round1(value);
  return `${rounded > 0 ? "+" : ""}${rounded}pt`;
}

function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return "-";
  return `${start ?? "-"} - ${end ?? "-"}`;
}

function getRoundedNumber(value: number | null | undefined) {
  return typeof value === "number" ? Math.round(value) : null;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getSourceTypeLabel(sourceType: RecoraSourceType) {
  const labels: Record<RecoraSourceType, string> = {
    owned: "自社サイト",
    competitor: "競合サイト",
    media: "第三者メディア",
    review: "レビュー",
    technical: "技術・資料",
    unknown: "不明"
  };

  return labels[sourceType];
}

function getRecommendationTypeLabel(type: RecoraRecommendationRow["type"]) {
  const labels: Record<RecoraRecommendationRow["type"], string> = {
    content: "コンテンツ",
    source: "参照元",
    technical: "技術診断",
    prompt: "プロンプト",
    risk: "リスク",
    competitive: "競合"
  };

  return labels[type];
}
