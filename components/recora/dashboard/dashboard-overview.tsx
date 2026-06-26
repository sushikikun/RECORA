import type { ReactNode } from "react";
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
import { ReportHelpTooltip } from "@/components/recora/report-ui/report-help-tooltip";
import {
  formatRecoraAveragePosition,
  formatRecoraCount,
  recoraDisplayMetricHelpers,
  recoraDisplayMetricLabels
} from "@/lib/recora/metric-definitions";
import {
  type RecoraVisualVariant,
  withRecoraVisualVariantSearchParam
} from "@/lib/recora/dev-preview/design-visual-variant";
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

type DataRichDashboardSection = {
  key: string;
  title: string;
  description: string;
  content: ReactNode;
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
  lastUpdated: string;
  isReportReady: boolean;
  hasLatestMetrics: boolean;
  aiVisibilityValue: string;
  aiVisibilityNumber: number;
  previousComparisonLabel: string;
  visibilityComment: string;
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

const LINE_ICON_STROKE = 1.8;

export function DashboardOverview({
  dashboardData = null,
  homeReadModelData = null,
  previewModeLabel = null,
  visualVariant = "data-rich-final"
}: {
  dashboardData?: RecoraDashboardDbData | null;
  homeReadModelData?: RecoraHomeReadModelDbData | null;
  previewModeLabel?: string | null;
  visualVariant?: RecoraVisualVariant;
}) {
  const view = createDashboardOverviewView(dashboardData, homeReadModelData);

  if (!view.isReportReady) {
    return (
      <div className="min-w-0 space-y-4">
        <DashboardHeader view={view} previewModeLabel={previewModeLabel} visualVariant={visualVariant} />
        <DashboardPreparationPanel view={view} />
        <TrendUnavailablePanel />
      </div>
    );
  }

  if (visualVariant === "data-rich-final") {
    return (
      <DataRichDashboardOverview
        view={view}
        previewModeLabel={previewModeLabel}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <DashboardHeader view={view} previewModeLabel={previewModeLabel} visualVariant={visualVariant} />

      <VisibilitySummary view={view} visualVariant={visualVariant} />

      <TrendUnavailablePanel />

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <PromptCategoryPanel rows={view.topicRows} />
        <ModelVisibilityPanel rows={view.modelRows} />
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
        <CompetitorAuditPanel rows={view.competitorRows} />
        <SourceAuditPanel
          composition={view.sourceComposition}
          domains={view.sourceDomains}
          domainMax={view.sourceDomainMax}
        />
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <BrandImpressionPanel />
        <IssuesPanel rows={view.issueRows} />
      </div>

      <DashboardCautionPanel messages={view.cautionMessages} />
    </div>
  );
}

function DataRichDashboardOverview({
  view,
  previewModeLabel
}: {
  view: DashboardOverviewView;
  previewModeLabel?: string | null;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <DashboardHeader view={view} previewModeLabel={previewModeLabel} visualVariant="data-rich-final" />
      <DataRichDashboardKpiStrip view={view} />
      <DataRichDashboardAnalysisPanel view={view} />
      <DataRichDashboardEvidencePanel view={view} />
      <DashboardCautionPanel messages={view.cautionMessages} />
    </div>
  );
}

function DashboardHeader({
  view,
  previewModeLabel,
  visualVariant
}: {
  view: DashboardOverviewView;
  previewModeLabel?: string | null;
  visualVariant: RecoraVisualVariant;
}) {
  return (
    <header className="min-w-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          {previewModeLabel ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit items-center rounded-md border border-[#BFDAD4] bg-[#E6F4F1] px-2.5 py-1 text-xs font-bold text-[#005C50]">
                {previewModeLabel}
              </span>
              <span className="text-xs font-semibold text-[#64748B]">本物の顧客データではありません</span>
            </div>
          ) : null}
          <h1 className="text-2xl font-bold tracking-normal text-[#0F172A] sm:text-3xl">
            ダッシュボード
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#475569]">
            <ScopePill label="対象プロジェクト" value={view.projectName} />
            <ScopePill label={view.periodLabel} value={view.periodValue} />
            <ScopePill label="最終更新" value={view.lastUpdated} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={withRecoraVisualVariantSearchParam(view.reportBase, visualVariant)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D8E0E3] bg-white px-3 text-sm font-bold text-[#005C50] transition hover:border-[#00796B]/35 hover:bg-[#F7FAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
          >
            最新レポートへ
            <ArrowRight className="h-4 w-4" strokeWidth={LINE_ICON_STROKE} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function TrendUnavailablePanel() {
  return (
    <section id="trends" className="rounded-lg border border-[#D8E0E3] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#D8E0E3] bg-[#FBFCFC] px-2.5 py-1 text-xs font-bold text-[#005C50]">
            <BarChart3 className="h-4 w-4" strokeWidth={LINE_ICON_STROKE} />
            推移
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-normal text-[#0F172A]">比較データなし</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            比較可能な測定が2回以上ある場合に表示します。
          </p>
        </div>
        <span className="w-fit rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
          NEEDS_READ_MODEL
        </span>
      </div>
    </section>
  );
}

function ScopePill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-[#D8E0E3] bg-white px-2.5 py-1.5">
      <span className="shrink-0 text-xs font-bold text-[#64748B]">{label}</span>
      <span className="min-w-0 truncate text-xs font-bold text-[#0F172A]" title={value}>
        {value}
      </span>
    </span>
  );
}

function DashboardPreparationPanel({ view }: { view: DashboardOverviewView }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#D8E0E3] bg-white">
      <div className="grid min-w-0 lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,0.58fr)]">
        <div className="border-b border-[#D8E0E3] bg-[#FBFCFC] p-5 lg:border-b-0 lg:border-r sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-700">
            <AlertTriangle className="h-5 w-5" strokeWidth={LINE_ICON_STROKE} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-[#0F172A]">ダッシュボード準備中</h2>
          <p className="mt-2 text-sm leading-6 text-[#475569]">
            公開前確認が完了するまで、顧客向けの数値や内部確認用の情報は表示しません。
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm font-bold text-[#0F172A]">現在表示できるダッシュボードはありません</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475569]">{view.preparationMessage}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
              <p className="text-sm font-bold text-[#64748B]">AI表示率</p>
              <p className="mt-2 text-2xl font-bold tracking-normal text-[#0F172A]">準備中</p>
            </div>
            <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
              <p className="text-sm font-bold text-[#64748B]">有効観測数</p>
              <p className="mt-2 text-2xl font-bold tracking-normal text-[#0F172A]">準備中</p>
            </div>
            <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
              <p className="text-sm font-bold text-[#64748B]">引用元監査</p>
              <p className="mt-2 text-2xl font-bold tracking-normal text-[#0F172A]">準備中</p>
            </div>
            <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
              <p className="text-sm font-bold text-[#64748B]">レポート状態</p>
              <p className="mt-2 text-2xl font-bold tracking-normal text-[#0F172A]">確認中</p>
            </div>
          </div>
          <div className="mt-5 rounded-md border border-dashed border-[#BFDAD4] bg-[#FBFCFC] px-4 py-4">
            <p className="text-sm font-bold text-[#0F172A]">準備が完了すると、AI表示率と監査カードを表示します</p>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              観測データ、有効観測、表示できる確認結果が揃ったあとに表示されます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DataRichDashboardKpiStrip({ view }: { view: DashboardOverviewView }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E1E8E5] bg-white" data-recora-kpi-strip>
      <div className="grid min-w-0 md:grid-cols-2 xl:grid-cols-[1.36fr_repeat(4,minmax(0,1fr))]">
        <DataRichAiVisibilityCell view={view} />
        {view.kpis.map((kpi) => (
          <DataRichKpiCell key={kpi.label} label={kpi.label} value={kpi.value} helper={kpi.helper} />
        ))}
      </div>
    </section>
  );
}

function DataRichAiVisibilityCell({ view }: { view: DashboardOverviewView }) {
  const safeValue = Math.max(0, Math.min(100, view.aiVisibilityNumber));
  const displayLabel = view.hasLatestMetrics ? view.aiVisibilityValue : "-";

  return (
    <div className="min-w-0 border-b border-[#E1E8E5] px-4 py-4 md:border-r xl:border-b-0">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#64748B]">AI表示率</p>
          <p className="mt-1 text-[44px] font-bold leading-none tracking-normal text-[#005C50]">{displayLabel}</p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#006B57]" strokeWidth={LINE_ICON_STROKE} aria-hidden="true" />
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-sm bg-[#EEF2F0]">
        {view.hasLatestMetrics ? <div className="h-full rounded-sm bg-[#006B57]" style={{ width: `${safeValue}%` }} /> : null}
      </div>
      <p className="mt-2 truncate text-xs font-semibold text-[#64748B]" title={view.previousComparisonLabel}>
        {view.previousComparisonLabel}
      </p>
    </div>
  );
}

function DataRichKpiCell({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="min-w-0 border-b border-[#E1E8E5] px-4 py-4 md:border-r xl:border-b-0 xl:last:border-r-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-xs font-bold text-[#64748B]" title={label}>{label}</p>
        <ReportHelpTooltip text={helper} label={`${label}の定義`} />
      </div>
      <p className="mt-2 truncate text-[28px] font-bold leading-none tracking-normal text-[#0F172A]" title={value}>{value}</p>
    </div>
  );
}

function DataRichDashboardAnalysisPanel({ view }: { view: DashboardOverviewView }) {
  const sectionCandidates: Array<DataRichDashboardSection | null> = [
    view.topicRows.length > 0
      ? {
        key: "topic",
        title: "カテゴリ別",
        description: "カテゴリ名を確認できる場合だけ表示します。",
        content: <DataRichSnapshotRows rows={view.topicRows} empty="カテゴリ別の内訳は、名称を確認できるデータが揃った後に表示します。" />
      }
      : null,
    view.modelRows.length > 0
      ? {
        key: "model",
        title: "AIモデル別",
        description: "AIモデル別の表示率が確認できる場合だけ比較します。",
        content: <DataRichSnapshotRows rows={view.modelRows} empty="AIモデル別の比較は、モデル名を確認できるデータが揃った後に表示します。" />
      }
      : null,
    {
      key: "competitors",
      title: "競合比較",
      description: "最新レポート内のブランド別の表示状況を比較します。",
      content: <DataRichCompetitorRows rows={view.competitorRows} />
    }
  ];
  const sections = sectionCandidates.filter((section): section is DataRichDashboardSection => section !== null);
  const gridClass =
    sections.length === 1 ? "xl:grid-cols-1" :
    sections.length === 2 ? "xl:grid-cols-2" :
    "xl:grid-cols-3";

  return (
    <section className="overflow-hidden rounded-lg border border-[#E1E8E5] bg-white" data-recora-analysis-panel>
      <div className="flex flex-col gap-2 border-b border-[#E1E8E5] px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#006B57]">分析</p>
          <h2 className="mt-1 text-lg font-bold tracking-normal text-[#0F172A]">表示状況の内訳</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[#64748B]">
          取得済みの内訳だけを表示し、空の比較パネルは折りたたみます。
        </p>
      </div>
      <div className={cn("grid min-w-0 xl:divide-x xl:divide-[#E1E8E5]", gridClass)}>
        {sections.map((section) => (
          <DataRichAnalysisColumn key={section.key} title={section.title} description={section.description}>
            {section.content}
          </DataRichAnalysisColumn>
        ))}
      </div>
    </section>
  );
}

function DataRichAnalysisColumn({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-[#E1E8E5] p-4 last:border-b-0 xl:border-b-0">
      <div className="min-h-[58px]">
        <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B]">{description}</p>
      </div>
      <div className="mt-3 min-w-0">{children}</div>
    </div>
  );
}

function DataRichSnapshotRows({ rows, empty }: { rows: SnapshotRow[]; empty: string }) {
  if (rows.length === 0) {
    return <EmptyState message={empty} />;
  }

  return (
    <div className="divide-y divide-[#E5EAE8] overflow-hidden rounded-md border border-[#E5EAE8]">
      {rows.slice(0, 5).map((row) => (
        <div key={row.id} className="grid min-w-0 gap-3 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
          <div className="min-w-0">
            <p className="truncate font-bold text-[#0F172A]" title={row.label}>{row.label}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#64748B]">{row.qualityLabel}</p>
          </div>
          <InlineBar value={row.visibility} label={row.visibilityLabel} />
        </div>
      ))}
    </div>
  );
}

function DataRichCompetitorRows({ rows }: { rows: CompetitorRow[] }) {
  if (rows.length === 0) {
    return <EmptyState message="ブランド別の比較データが揃った後に表示します。" />;
  }

  const maxVisibility = Math.max(1, ...rows.map((row) => row.visibility));

  return (
    <div className="divide-y divide-[#E5EAE8] overflow-hidden rounded-md border border-[#E5EAE8]">
      {rows.slice(0, 5).map((row, index) => (
        <div key={row.id} className={cn("grid min-w-0 gap-3 px-3 py-2.5 text-sm sm:grid-cols-[32px_minmax(0,1fr)_128px] sm:items-center", row.isPrimary && "bg-[#EAF6F0]")}>
          <span className="font-bold tabular-nums text-[#64748B]">{index + 1}</span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate font-bold text-[#0F172A]" title={row.name}>{row.name}</p>
              {row.isPrimary ? <span className="rounded-sm border border-[#006B57]/25 bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#006B57]">自社</span> : null}
            </div>
            <p className="mt-0.5 text-xs font-semibold text-[#64748B]">平均表示位置 {row.averagePositionLabel}</p>
          </div>
          <InlineBar value={(row.visibility / maxVisibility) * 100} label={row.visibilityLabel} />
        </div>
      ))}
    </div>
  );
}

function DataRichDashboardEvidencePanel({ view }: { view: DashboardOverviewView }) {
  const sectionCandidates: Array<DataRichDashboardSection | null> = [
    view.sourceDomains.length > 0
      ? {
        key: "sources",
        title: "引用元・ソース監査",
        description: "参照されているドメインを、構成比と上位ドメインで確認します。",
        content: <DataRichSourceRows rows={view.sourceDomains} max={view.sourceDomainMax} />
      }
      : null,
    view.issueRows.length > 0
      ? {
        key: "issues",
        title: "確認すべき課題",
        description: "改善提案を主役にせず、監査結果として確認が必要な候補だけを表示します。",
        content: <DataRichIssueRows rows={view.issueRows} />
      }
      : null,
    {
      key: "trend",
      title: "推移",
      description: "比較可能な測定が2回以上ある場合に表示します。",
      content: (
        <div className="rounded-md border border-dashed border-[#E1E8E5] bg-[#FAFCFB] px-3 py-3">
          <p className="text-sm font-bold text-[#0F172A]">比較データなし</p>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">{view.previousComparisonLabel}</p>
        </div>
      )
    }
  ];
  const sections = sectionCandidates.filter((section): section is DataRichDashboardSection => section !== null);
  const gridClass =
    sections.length === 1 ? "xl:grid-cols-1" :
    sections.length === 2 ? "xl:grid-cols-2" :
    "xl:grid-cols-[1.05fr_1fr_0.7fr]";

  return (
    <section className="overflow-hidden rounded-lg border border-[#E1E8E5] bg-white" data-recora-analysis-panel>
      <div className={cn("grid min-w-0 xl:divide-x xl:divide-[#E1E8E5]", gridClass)}>
        {sections.map((section) => (
          <DataRichAnalysisColumn key={section.key} title={section.title} description={section.description}>
            {section.content}
          </DataRichAnalysisColumn>
        ))}
      </div>
    </section>
  );
}

function DataRichSourceRows({ rows, max }: { rows: SourceDomainRow[]; max: number }) {
  if (rows.length === 0) {
    return <EmptyState message="引用元ドメインが蓄積された後に、構成比と上位ドメインを表示します。" />;
  }

  return (
    <div className="divide-y divide-[#E5EAE8] overflow-hidden rounded-md border border-[#E5EAE8]">
      {rows.slice(0, 5).map((row, index) => {
        const width = Math.max(6, Math.min(100, (row.occurrenceCount / Math.max(1, max)) * 100));

        return (
          <div key={row.domain} className="grid min-w-0 gap-3 px-3 py-2.5 text-sm sm:grid-cols-[32px_minmax(0,1fr)_126px] sm:items-center">
            <span className="font-bold tabular-nums text-[#64748B]">{index + 1}</span>
            <div className="min-w-0">
              <p className="truncate font-bold text-[#0F172A]" title={row.domain}>{row.domain}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#64748B]">{row.sourceTypeLabel} / URL {row.urlLabel}</p>
            </div>
            <div className="min-w-0">
              <p className="text-right text-xs font-bold tabular-nums text-[#0F172A]">{row.occurrenceLabel}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-[#EEF2F0]">
                <div className="h-full rounded-sm bg-[#006B57]" style={{ width: `${width}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataRichIssueRows({ rows }: { rows: IssueRow[] }) {
  if (rows.length === 0) {
    return <EmptyState message="現在、顧客向けに表示できる確認課題はありません。" />;
  }

  return (
    <div className="divide-y divide-[#E5EAE8] overflow-hidden rounded-md border border-[#E5EAE8]">
      {rows.map((row) => (
        <div key={row.id} className="grid min-w-0 gap-2 px-3 py-2.5 text-sm sm:grid-cols-[88px_minmax(0,1fr)]">
          <PriorityBadge priority={row.priority} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-bold text-[#0F172A]">{row.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#64748B]">{row.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisibilitySummary({ view, visualVariant }: { view: DashboardOverviewView; visualVariant: RecoraVisualVariant }) {
  return (
    <section className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(398px,0.96fr)]">
      <article className="min-w-0 rounded-lg border border-[#D8E0E3] bg-white p-5 sm:p-6">
        <div className="flex h-full min-w-0 flex-col">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#D8E0E3] bg-[#FBFCFC] px-2.5 py-1 text-sm font-bold text-[#005C50]">
            <ShieldCheck className="h-4 w-4" strokeWidth={LINE_ICON_STROKE} />
            AI検索の可視性
          </div>

          <div className="mt-6 grid min-w-0 flex-1 gap-6 lg:grid-cols-[minmax(220px,0.9fr)_minmax(230px,1fr)] lg:items-center">
            <div className="min-w-0">
              <h2 className="text-4xl font-bold leading-none tracking-normal text-[#0F172A] sm:text-5xl">
                AI表示率
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#475569]">{view.visibilityComment}</p>
            </div>

            <div className="min-w-0">
              <AiVisibilityGauge
                value={view.aiVisibilityNumber}
                label={view.aiVisibilityValue}
                hasLatestMetrics={view.hasLatestMetrics}
                visualVariant={visualVariant}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-[#D8E0E3] pt-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <span className="text-sm font-bold text-[#64748B]">前回比</span>
              <span className="text-lg font-bold leading-none text-[#64748B]">—</span>
              <span className="text-sm font-bold text-[#0F172A]">{view.previousComparisonLabel}</span>
            </div>
          </div>
        </div>
      </article>

      <KpiGrid kpis={view.kpis} />
    </section>
  );
}

function AiVisibilityGauge({
  value,
  label,
  hasLatestMetrics,
  visualVariant
}: {
  value: number;
  label: string;
  hasLatestMetrics: boolean;
  visualVariant: RecoraVisualVariant;
}) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const safeValue = Math.max(0, Math.min(100, normalizedValue));
  const center = 132;
  const radius = 102;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (safeValue / 100) * circumference;
  const displayLabel = hasLatestMetrics ? label : "-";
  const valueTextSize = displayLabel.length >= 4 ? "text-[64px]" : "text-[78px]";
  const ariaLabel = hasLatestMetrics ? `AI表示率 ${displayLabel}` : "AI表示率 データなし";

  if (visualVariant === "data-rich-final") {
    return (
      <div className="rounded-lg border border-[#D8E0E3] bg-[#F7FAF9] p-4" role="img" aria-label={ariaLabel}>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#64748B]">AI表示率</p>
            <p className="mt-1 text-[48px] font-bold leading-none tracking-normal text-[#003F36]">{displayLabel}</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-sm bg-[#E2E9E7]">
          {hasLatestMetrics ? (
            <div className="h-full rounded-sm bg-[#005C50]" style={{ width: `${safeValue}%` }} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:justify-end">
      <div
        className="relative h-[264px] w-[264px] shrink-0"
        role="img"
        aria-label={ariaLabel}
      >
        <svg className="h-[264px] w-[264px]" viewBox="0 0 264 264" aria-hidden="true">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E2E9E7"
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          {hasLatestMetrics ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#005C50"
              strokeLinecap="round"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform={`rotate(-90 ${center} ${center})`}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(valueTextSize, "font-bold leading-none tracking-normal text-[#003F36]")}>{displayLabel}</span>
          <span className="mt-1 text-xs font-bold text-[#64748B]">AI表示率</span>
        </div>
      </div>
    </div>
  );
}

function KpiGrid({ kpis }: { kpis: DashboardKpi[] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {kpis.map((kpi) => (
        <KpiTile key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  const Icon = kpi.icon;

  return (
    <article className="min-w-0 rounded-lg border border-[#D8E0E3] bg-white p-4 sm:p-5">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
          kpi.tone === "green" && "border-[#BFDAD4] bg-white text-[#00796B]",
          kpi.tone === "mint" && "border-emerald-200 bg-white text-emerald-700",
          kpi.tone === "slate" && "border-slate-200 bg-white text-slate-600",
          kpi.tone === "amber" && "border-amber-200 bg-white text-amber-700"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={LINE_ICON_STROKE} />
      </span>
      <p className="mt-4 truncate text-sm font-bold text-[#0F172A]" title={kpi.label}>
        {kpi.label}
      </p>
      <p className="mt-2 truncate text-4xl font-bold leading-none tracking-normal text-[#005C50]" title={kpi.value}>
        {kpi.value}
      </p>
      <div className="mt-4 border-t border-[#D8E0E3] pt-3">
        <p className="line-clamp-2 text-sm leading-6 text-[#64748B]">{kpi.helper}</p>
      </div>
    </article>
  );
}

function PromptCategoryPanel({ rows }: { rows: SnapshotRow[] }) {
  return (
    <SectionFrame
      icon={Layers3}
      eyebrow="カテゴリ別"
      title="プロンプトカテゴリ別の表示状況"
      description="カテゴリ名を確認できる場合だけ表示します。名称が不明な項目は表示しません。"
    >
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#D8E0E3]">
          <div className="grid grid-cols-[minmax(150px,1.2fr)_minmax(170px,1fr)_120px_120px] gap-0 bg-[#FBFCFC] px-4 py-3 text-sm font-bold text-[#64748B] max-lg:hidden">
            <span>カテゴリ</span>
            <span>AI表示率</span>
            <span>平均表示位置</span>
            <span>比較</span>
          </div>
          <div className="divide-y divide-[#D8E0E3]">
            {rows.map((row) => (
              <SnapshotTableRow key={row.id} row={row} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message="カテゴリ別の内訳は、名称を確認できるデータが揃った後に表示します。" />
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
      eyebrow="AIモデル別"
      title="AIモデル別の表示状況"
      description="AIモデル別の表示率が確認できる場合だけ比較します。"
    >
      {rows.length > 0 ? (
        <div className="grid gap-3">
          {rows.map((row) => (
            <div key={row.id} className="min-w-0 rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
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
        <EmptyState message="AIモデル別の比較は、モデル名を確認できるデータが揃った後に表示します。" />
      )}
    </SectionFrame>
  );
}

function CompetitorAuditPanel({ rows }: { rows: CompetitorRow[] }) {
  const maxVisibility = Math.max(1, ...rows.map((row) => row.visibility));

  return (
    <SectionFrame
      icon={SearchCheck}
      eyebrow="競合比較"
      title="競合とのAI表示率比較"
      description="最新レポート内のブランド別の表示状況を比較します。公式順位ではありません。"
      actionHref="/dashboard/reports"
      actionLabel="詳細へ"
    >
      {rows.length > 0 ? (
        <div className="grid gap-3">
          {rows.slice(0, 4).map((row) => (
            <div
              key={row.id}
              className={cn(
                "min-w-0 rounded-md border px-4 py-3",
                row.isPrimary ? "border-[#9BCDC4] bg-[#FCFEFD]" : "border-[#D8E0E3] bg-white"
              )}
            >
              <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(160px,1fr)_minmax(180px,1.1fr)] 2xl:grid-cols-[minmax(180px,1fr)_minmax(200px,1.2fr)_96px_110px] 2xl:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-[#0F172A]" title={row.name}>
                      {row.name}
                    </p>
                    <span className="rounded-md border border-[#D8E0E3] bg-white px-2 py-0.5 text-xs font-bold text-[#005C50]">
                      {row.isPrimary ? "自社" : "競合"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B]">平均表示位置 {row.averagePositionLabel}</p>
                </div>
                <InlineBar value={(row.visibility / maxVisibility) * 100} label={row.visibilityLabel} />
                <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-[#FBFCFC] px-3 py-2 2xl:border-0 2xl:bg-transparent 2xl:px-0 2xl:py-0">
                  <p className="text-[11px] font-bold text-[#64748B] 2xl:hidden">言及シェア</p>
                  <p className="whitespace-nowrap text-sm font-bold tabular-nums text-[#0F172A]">{row.shareOfVoiceLabel}</p>
                </div>
                <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-[#FBFCFC] px-3 py-2 2xl:border-0 2xl:bg-transparent 2xl:px-0 2xl:py-0">
                  <p className="text-[11px] font-bold text-[#64748B] 2xl:hidden">差分</p>
                  <p className="whitespace-nowrap text-sm font-bold text-[#64748B]">{row.gapLabel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="ブランド別の比較データが揃った後に表示します。" />
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
      eyebrow="引用元監査"
      title="引用元・ソース監査"
      description="参照されているドメインを、構成比と上位ドメインで確認します。"
    >
      {composition.length > 0 ? (
        <div className="space-y-5">
          <div>
            <div className="flex h-10 overflow-hidden rounded-md border border-[#D8E0E3] bg-[#EEF2F3]">
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
    <div className="min-w-0 rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
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
      <div className="mt-3 h-2 overflow-hidden rounded-sm bg-[#E8EFED]">
        <div className="h-full rounded-sm bg-[#00796B]" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-[#64748B]">通算参照出現のうち約{row.share}%</p>
    </div>
  );
}

function BrandImpressionPanel() {
  return (
    <SectionFrame
      icon={CircleGauge}
      eyebrow="ブランド印象"
      title="ブランド印象サマリー"
      description="ブランド印象の集計は、確認できるデータが揃った場合だけ表示します。"
    >
      <EmptyState message="ブランド印象の内訳は、確認できるデータが揃った後に表示します。" />
    </SectionFrame>
  );
}

function IssuesPanel({ rows }: { rows: IssueRow[] }) {
  return (
    <SectionFrame
      icon={ListChecks}
      eyebrow="確認課題"
      title="確認すべき課題"
      description="改善提案を主役にせず、監査結果として確認が必要な候補だけをコンパクトに表示します。"
    >
      {rows.length > 0 ? (
        <div className="grid gap-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-md border border-[#D8E0E3] bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={row.priority} />
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-[#64748B]">
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
    : ["表示値はRecoraの観測範囲に基づく確認材料です。"];

  return (
    <section className="rounded-lg border border-amber-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-700">
            <AlertTriangle className="h-5 w-5" strokeWidth={LINE_ICON_STROKE} />
          </span>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">表示の前提</p>
            <p className="mt-1 text-sm font-semibold text-amber-700">保証表現は使いません</p>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-2">
          {visibleMessages.map((message) => (
            <p key={message} className="rounded-md border border-amber-200/70 bg-[#FFFDF8] px-3 py-2 text-sm leading-6 text-[#475569]">
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
    <section className="min-w-0 rounded-lg border border-[#D8E0E3] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#D8E0E3] bg-[#FBFCFC] px-2.5 py-1 text-xs font-bold text-[#005C50]">
            <Icon className="h-4 w-4" strokeWidth={LINE_ICON_STROKE} />
            {eyebrow}
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-normal text-[#0F172A]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#D8E0E3] bg-white px-3 text-sm font-bold text-[#005C50] transition hover:bg-[#F7FAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={LINE_ICON_STROKE} />
          </Link>
        ) : null}
      </div>
      <div className="mt-4 min-w-0">{children}</div>
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
      <div className="mt-2 h-2 overflow-hidden rounded-sm bg-[#E8EFED]">
        <div className="h-full rounded-sm bg-[#00796B]" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#D8E0E3] bg-[#FBFCFC] px-4 py-3 text-sm leading-6 text-[#64748B]">
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
        "rounded-md border px-2 py-0.5 text-xs font-bold",
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
    lastUpdated: formatDateTime(data?.latestRun?.completed_at ?? data?.project?.updated_at),
    isReportReady,
    hasLatestMetrics,
    aiVisibilityValue: hasLatestMetrics ? formatPercent(latestVisibility) : "-",
    aiVisibilityNumber: latestVisibility ?? 0,
    previousComparisonLabel: "比較データなし",
    visibilityComment: createVisibilityComment({ hasLatestMetrics }),
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
  const latestPeriod = formatPeriod(data?.latestRun?.period_start ?? null, data?.latestRun?.period_end ?? null);
  const reportPeriod = latestPeriod !== "-"
    ? latestPeriod
    : cumulative
      ? formatPeriod(cumulative.aggregationPeriod.start, cumulative.aggregationPeriod.end)
      : "確認中";

  return [
    {
      label: recoraDisplayMetricLabels.validObservations,
      value: formatCount(validObservations),
      helper: recoraDisplayMetricHelpers.validObservations,
      tone: "green",
      icon: CheckCircle2
    },
    {
      label: recoraDisplayMetricLabels.averagePosition,
      value: formatAveragePosition(snapshot?.average_position),
      helper: recoraDisplayMetricHelpers.averagePosition,
      tone: "mint",
      icon: BarChart3
    },
    {
      label: recoraDisplayMetricLabels.shareOfVoice,
      value: formatPercentOrDash(snapshot?.share_of_voice),
      helper: recoraDisplayMetricHelpers.shareOfVoice,
      tone: "slate",
      icon: CircleGauge
    },
    {
      label: "レポート状態",
      value: reportStatus,
      helper: reportPeriod,
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

  return rows.sort((a, b) => b.visibility - a.visibility || Number(b.isPrimary) - Number(a.isPrimary));
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

function createVisibilityComment({ hasLatestMetrics }: { hasLatestMetrics: boolean }) {
  if (!hasLatestMetrics) {
    return "観測データが揃うまで、AI検索での表示状況は準備中として扱います。";
  }

  return "AI検索での露出は確認できています。カテゴリや競合比較の差分は各詳細で確認します。";
}

function createPreparationMessage(data?: RecoraDashboardDbData | null) {
  if (!data?.project) {
    return "対象プロジェクトが取得できないため、顧客向けダッシュボードを表示していません。";
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
      small_sample_caution: "サンプル不足です。",
      trend_comparability_needs_verification: "推移はcount系のみです。測定条件の完全一致は追加確認が必要です。",
      no_ai_visibility_or_competitive_gap_trend_p0: "AI可視性や競合差分の推移はP0では表示していません。"
    };

    if (known[flag.code]) return known[flag.code];
    if (flag.severity === "warning") return "集計値は注意付きで確認してください。";
    if (flag.severity === "needs_verification") return "一部の集計条件は追加確認が必要です。";
    return "表示値はRecoraの観測範囲に基づく確認材料です。";
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
  return formatRecoraCount(value);
}

function formatPercent(value: number) {
  return `${value}%`;
}

function formatPercentOrDash(value: number | null | undefined) {
  return typeof value === "number" ? formatPercent(Math.round(value)) : "-";
}

function formatAveragePosition(value: number | null | undefined) {
  return formatRecoraAveragePosition(value);
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
