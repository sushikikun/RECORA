import Link from "next/link";
import { ExternalLink, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataCard, MetricTile, PageHeader } from "@/components/recora/ui";
import { ReportHelpTooltip } from "@/components/recora/report-ui/report-help-tooltip";
import { reportDetailTabs } from "@/lib/recora/nav-config";
import type { RecoraRecommendationRow, RecoraRecommendationsDbData } from "@/lib/recora/db";
import { getRecommendationPublicationState } from "@/lib/recora/report-eligibility";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type DashboardPriority = "High" | "Medium" | "Low";

type RecommendationDisplayItem = {
  id: string;
  title: string;
  priority: DashboardPriority;
  priorityCode: string;
  typeLabel: string;
  displayCategory: string;
  statusLabel: string;
  reason: string;
  expectedImpact: string;
  effortLabel: string;
  effortScore: number;
  impactScore: number;
  confidence: string;
  confidenceLabel: string;
  qualityGateLabel: string;
  qualityGateNote: string;
  customerFacingCaution: string;
  recoraMetricNotice: string;
  sampleSizeCaution: string | null;
  evidenceDescription: string;
  evidenceMetrics: EvidenceMetrics;
  relatedBrand: string;
  relatedTopic: string;
  relatedPrompt: string;
  action: string;
  targetUrl: string | null;
  createdAt: string;
};

type RecommendationsViewModel = {
  sourceLabel: string;
  items: RecommendationDisplayItem[];
  highPriorityCount: number;
  evidenceBackedCount: number;
  observationCount: number;
  citationUrlCount: number;
  preQualityGateCandidateCount: number | null;
  openCount: number;
  plannedCount: number;
  doneCount: number;
};

type EvidenceMetrics = {
  observationCount: number;
  promptCount: number;
  focusedObservationCount: number;
  focusedObservationLabel: string;
  citationCount: number;
  uniqueDomainCount: number;
  matchedClueCount: number;
};

export function RecommendationsDbPage({ recommendationsData = null }: { recommendationsData?: RecoraRecommendationsDbData | null }) {
  const view = createRecommendationsViewModel(recommendationsData);
  const topItems = view.items.slice(0, 3);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="レポート詳細"
        title="改善候補"
        description="AI検索での観測結果から、優先して確認する改善候補を整理します。"
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.recommendations} />

      <div data-recora-current-only>
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricTile label="改善候補数" value={String(view.items.length)} helper={view.sourceLabel} />
          <MetricTile label="高重要度" value={String(view.highPriorityCount)} helper="次に判断したい候補" tone="amber" />
          <MetricTile label="根拠あり候補数" value={String(view.evidenceBackedCount)} helper="観測根拠を確認できる候補" tone="green" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <DataCard title="優先して確認したい改善候補" description="観測結果から表示する確認材料です。">
            <div className="space-y-4">
              {topItems.length > 0 ? topItems.map((item) => (
                <RecommendationActionCard key={item.id} item={item} />
              )) : (
                <EmptyStateBlock title="表示できる改善候補がありません" description="表示対象の改善候補が保存されると、ここに表示されます。" />
              )}
            </div>
          </DataCard>

          <DataCard title="確認状況" description="改善候補の確認状態を要約しています。">
            <div className="space-y-4">
              <RecommendationStatusRow label="未着手" value={view.openCount} tone="rose" />
              <RecommendationStatusRow label="計画中" value={view.plannedCount} tone="amber" />
              <RecommendationStatusRow label="完了" value={view.doneCount} tone="green" />
              <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3">
                <p className="text-xs font-bold text-teal-900">表示前の確認</p>
                <p className="mt-1 text-2xl font-bold tracking-normal text-teal-950">
                  {view.preQualityGateCandidateCount === null ? "-" : view.preQualityGateCandidateCount}
                </p>
                <p className="mt-1 text-xs leading-5 text-teal-800">
                  確認待ち候補です。公開前の品質確認を通過したものだけを表示します。
                </p>
              </div>
            </div>
          </DataCard>
        </div>

        <DataCard title="改善候補一覧" description={`${view.sourceLabel}由来の表示対象だけを、区分と観測根拠付きで表示します。`}>
          <RecommendationListCards rows={view.items} />
        </DataCard>
      </div>

      <div data-recora-data-rich-only>
        <DataRichRecommendationsView view={view} />
      </div>
    </div>
  );
}

function DataRichRecommendationsView({ view }: { view: RecommendationsViewModel }) {
  return (
    <div className="min-w-0 space-y-3">
      <section className="overflow-hidden rounded-lg border border-[#E1E8E5] bg-white" data-recora-kpi-strip>
        <div className="grid min-w-0 md:grid-cols-3">
          <DataRichRecommendationKpi label="改善候補数" value={`${view.items.length}件`} helper={view.sourceLabel} />
          <DataRichRecommendationKpi label="高優先度" value={`${view.highPriorityCount}件`} helper="次に判断したい候補" tone="amber" />
          <DataRichRecommendationKpi label="根拠あり" value={`${view.evidenceBackedCount}件`} helper="観測根拠を確認できる候補" />
        </div>
      </section>

      <section className="recora-data-rich-split">
        <div className="min-w-0">
          <div className="border-b border-[#E1E8E5] px-4 py-3">
            <h2 className="text-base font-bold text-[#0F172A]">改善候補一覧</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              優先度、観測根拠、影響範囲、次に確認することを同じ行で確認します。
            </p>
          </div>
          <RecommendationsTable rows={view.items} />
        </div>
        <aside className="min-w-0 bg-[#FAFCFB] p-4">
          <h3 className="text-sm font-bold text-[#0F172A]">確認状況</h3>
          <div className="mt-3 divide-y divide-[#E1E8E5] rounded-md border border-[#E1E8E5] bg-white">
            <DataRichStatusLine label="未着手" value={view.openCount} tone="rose" />
            <DataRichStatusLine label="計画中" value={view.plannedCount} tone="amber" />
            <DataRichStatusLine label="完了" value={view.doneCount} tone="green" />
          </div>
          <div className="mt-4 rounded-md border border-[#E1E8E5] bg-white px-3 py-3">
            <p className="text-xs font-bold text-[#64748B]">凡例</p>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              表示候補は公開前の品質確認を通過したものだけです。効果予測や担当者・期限はこの顧客画面では表示しません。
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function DataRichRecommendationKpi({
  label,
  value,
  helper,
  tone = "green"
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "green" | "amber";
}) {
  return (
    <div className="min-w-0 border-b border-[#E1E8E5] px-4 py-4 md:border-r md:last:border-r-0 xl:border-b-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-xs font-bold text-[#64748B]" title={label}>{label}</p>
        <ReportHelpTooltip text={helper} label={`${label}の定義`} />
      </div>
      <p className={cn("mt-2 text-[30px] font-bold leading-none tracking-normal", tone === "amber" ? "text-amber-700" : "text-[#005C50]")}>
        {value}
      </p>
    </div>
  );
}

function DataRichStatusLine({ label, value, tone }: { label: string; value: number; tone: "rose" | "amber" | "green" }) {
  const toneClass = tone === "rose" ? "bg-rose-400" : tone === "amber" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#0F172A]">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", toneClass)} />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-bold tabular-nums text-[#0F172A]">{value}</span>
    </div>
  );
}

function createRecommendationsViewModel(data?: RecoraRecommendationsDbData | null): RecommendationsViewModel {
  const items = data?.project ? createDbRecommendationItems(data) : [];
  const highPriorityCount = items.filter((item) => item.priority === "High").length;
  const evidenceBackedCount = items.filter((item) =>
    item.evidenceMetrics.focusedObservationCount > 0 ||
    item.evidenceMetrics.citationCount > 0 ||
    item.evidenceMetrics.matchedClueCount > 0
  ).length;
  const observationCount = Math.max(0, ...items.map((item) => item.evidenceMetrics.observationCount));
  const citationUrlCount = Math.max(0, ...items.map((item) => item.evidenceMetrics.citationCount));

  return {
    sourceLabel: data?.project ? getRecommendationSourceLabel(data.recommendations) : "表示できるデータがありません",
    items,
    highPriorityCount,
    evidenceBackedCount,
    observationCount,
    citationUrlCount,
    preQualityGateCandidateCount: data?.preQualityGateCandidateCount ?? null,
    openCount: items.filter((item) => item.statusLabel === "未着手").length,
    plannedCount: items.filter((item) => item.statusLabel === "計画中").length,
    doneCount: items.filter((item) => item.statusLabel === "完了").length
  };
}

function getRecommendationSourceLabel(recommendations: RecoraRecommendationRow[]) {
  const metadata = getMetadataRecord(recommendations[0]?.metadata);
  const profileId = getMetadataString(metadata, "measurement_profile_id");

  if (profileId === "custom-openai-run") return "カスタム測定";
  if (profileId === "standard-v01") return "標準測定";

  return "観測データ";
}

function createDbRecommendationItems(data: RecoraRecommendationsDbData): RecommendationDisplayItem[] {
  const topicById = new Map(data.topics.map((topic) => [topic.id, topic]));
  const promptById = new Map(data.prompts.map((prompt) => [prompt.id, prompt]));
  const primaryBrand = data.brands.find((item) => item.brand_type === "primary") ?? data.brands[0];

  return [...data.recommendations]
    .sort(sortRecommendations)
    .map((item) => {
      const metadata = getMetadataRecord(item.metadata);
      const evidence = getMetadataRecord(metadata.evidence);
      const prompt = item.related_prompt_id ? promptById.get(item.related_prompt_id) : undefined;
      const topic = item.related_topic_id ? topicById.get(item.related_topic_id) : prompt ? topicById.get(prompt.topic_id) : undefined;
      const expectedImpact = getMetadataString(metadata, "expected_impact") ?? "+" + Math.round(item.impact_score) + "pt";
      const effortScore = item.effort_score === null ? 0 : Math.round(item.effort_score);
      const relatedBrand = getMetadataString(metadata, "related_brand") ?? getMetadataString(metadata, "brand") ?? primaryBrand?.name ?? "未設定";
      const displayCategory = normalizeRecommendationDisplayCategory(
        getMetadataString(metadata, "display_category") ?? recommendationTypeLabel(item.type)
      );
      const confidence = getMetadataString(metadata, "confidence") ?? "unknown";
      const qualityGate = getRecommendationQualityGate(metadata, item.status);
      const evidenceMetrics = buildEvidenceMetrics(evidence, displayCategory);

      return {
        id: item.id,
        title: item.title,
        priority: toDashboardPriority(item.priority),
        priorityCode: recommendationPriorityCode(item.priority),
        typeLabel: recommendationTypeLabel(item.type),
        displayCategory,
        statusLabel: recommendationStateLabel(item.status),
        reason: item.reason ?? "理由は未設定です。",
        expectedImpact,
        effortLabel: item.effort_score === null ? "未設定" : effortScore + " / 100",
        effortScore,
        impactScore: Math.round(item.impact_score),
        confidence,
        confidenceLabel: getMetadataString(metadata, "confidence_label") ?? confidenceLabel(confidence),
        qualityGateLabel: qualityGate.label,
        qualityGateNote: qualityGate.note,
        customerFacingCaution: safeRecoraNotice(getMetadataString(metadata, "customer_facing_caution")),
        recoraMetricNotice: safeRecoraNotice(getMetadataString(metadata, "recora_metric_notice")),
        sampleSizeCaution: displayCategory === "サンプル不足"
          ? "サンプル不足です。"
          : null,
        evidenceDescription: buildEvidenceDescription(displayCategory, evidenceMetrics),
        evidenceMetrics,
        relatedBrand,
        relatedTopic: topic?.name ?? prompt?.intent ?? "未設定",
        relatedPrompt: prompt?.text ?? "未設定",
        action: getMetadataString(metadata, "suggested_next_action") ?? getMetadataString(metadata, "recommended_action") ?? item.target_url ?? "詳細を確認",
        targetUrl: item.target_url,
        createdAt: formatDateTime(item.created_at)
      };
    });
}

function DetailTabs(_props: { items: readonly string[]; active?: number }) {
  return null;
}

function HeaderActions() {
  return (
    <>
      <Button>
        <Share2 className="h-4 w-4" />
        レポート共有
      </Button>
    </>
  );
}

function RecommendationActionCard({ item }: { item: RecommendationDisplayItem }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <RecommendationPriorityBadge item={item} />
            <DisplayCategoryBadge item={item} />
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-white text-slate-600">{item.confidenceLabel}</Badge>
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-teal-200 bg-teal-50 text-teal-700">{item.qualityGateLabel}</Badge>
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-white text-slate-600">{item.statusLabel}</Badge>
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-950">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
        </div>
        <div className="grid min-w-[150px] gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-500">影響する質問</p>
            <p className="mt-1 text-lg font-bold text-teal-700">{item.evidenceMetrics.promptCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">参照URL</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{item.evidenceMetrics.citationCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">確からしさ</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{item.confidenceLabel}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <RecommendationMeta label="関連ブランド" value={item.relatedBrand} />
        <RecommendationMeta label="関連トピック" value={item.relatedTopic} />
        <RecommendationMeta label="次の判断" value={item.action} />
      </div>
      <RecommendationEvidenceMetrics item={item} />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RecommendationNote label="観測根拠の説明" value={item.evidenceDescription} />
        <RecommendationNote label="表示前の確認" value={item.qualityGateNote} />
      </div>
      {item.sampleSizeCaution ? (
        <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-800">
          {item.sampleSizeCaution}
        </div>
      ) : null}
      <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
        {item.customerFacingCaution}
      </div>
    </div>
  );
}

function RecommendationEvidenceMetrics({ item }: { item: RecommendationDisplayItem }) {
  const metrics = item.evidenceMetrics;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <RecommendationMetric label="影響する質問" value={metrics.promptCount} />
      <RecommendationMetric label="参照URL数" value={metrics.citationCount} />
      <RecommendationMetric label="根拠の手がかり" value={metrics.matchedClueCount} />
    </div>
  );
}

function RecommendationMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function RecommendationMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function RecommendationNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function EmptyStateBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function RecommendationStatusRow({ label, value, tone }: { label: string; value: number; tone: "rose" | "amber" | "green" }) {
  const toneClass = tone === "rose" ? "bg-rose-500" : tone === "amber" ? "bg-orange-500" : "bg-emerald-500";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", toneClass)} />
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-lg font-bold text-slate-950">{value}</span>
    </div>
  );
}

function RecommendationListCards({ rows }: { rows: RecommendationDisplayItem[] }) {
  if (rows.length === 0) {
    return <EmptyStateBlock title="表示できる改善候補がありません" description="表示できる候補が保存されると、ここに一覧表示されます。" />;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map((item) => (
        <article key={item.id} className="min-w-0 rounded-lg border border-[#D8E0E3] bg-white p-4 shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                <RecommendationPriorityBadge item={item} />
                <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-700">
                  {item.displayCategory}
                </Badge>
                <Badge variant="outline" className="rounded-sm border-teal-200 bg-teal-50 text-teal-800">
                  {item.qualityGateLabel}
                </Badge>
              </div>
              <h3 className="mt-3 break-words text-base font-bold leading-6 text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
            </div>
            <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-bold text-slate-500">状態</p>
              <p className="mt-1 whitespace-nowrap text-sm font-bold text-slate-900">{item.statusLabel}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <SmallEvidenceMetric label="影響する質問" value={`${item.evidenceMetrics.promptCount}件`} />
            <SmallEvidenceMetric label="参照URL" value={`${item.evidenceMetrics.citationCount}件`} />
            <SmallEvidenceMetric label="確からしさ" value={item.confidenceLabel} />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold text-slate-500">次の判断</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{item.action}</p>
            {item.targetUrl ? (
              <Link href={item.targetUrl} className="mt-2 inline-flex min-w-0 items-center gap-1 text-xs font-bold text-[#00796B] hover:text-[#005C50]">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="min-w-0 break-all">{item.targetUrl}</span>
              </Link>
            ) : null}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">{item.customerFacingCaution}</p>
        </article>
      ))}
    </div>
  );
}

function SmallEvidenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function RecommendationsTable({ rows }: { rows: RecommendationDisplayItem[] }) {
  return (
    <Table className="w-full table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[86px]">優先度</TableHead>
          <TableHead>課題</TableHead>
          <TableHead className="w-[170px]">観測根拠</TableHead>
          <TableHead className="w-[118px]">影響する質問</TableHead>
          <TableHead className="w-[110px]">影響AIモデル</TableHead>
          <TableHead>次に確認すること</TableHead>
          <TableHead className="w-[92px]">状態</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap"><RecommendationPriorityBadge item={row} /></TableCell>
            <TableCell>
              <div className="line-clamp-2 font-bold text-slate-950">{row.title}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <DisplayCategoryBadge item={row} />
                <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-slate-50 text-slate-600">
                  {row.confidenceLabel}
                </Badge>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-400">{row.createdAt}</div>
            </TableCell>
            <TableCell className="text-xs leading-5 text-slate-600">
              <div>{row.evidenceMetrics.focusedObservationLabel}: <span className="font-bold text-slate-950">{row.evidenceMetrics.focusedObservationCount}</span></div>
              <div>参照URL: <span className="font-bold text-slate-950">{row.evidenceMetrics.citationCount}</span></div>
              <div>手がかり: <span className="font-bold text-slate-950">{row.evidenceMetrics.matchedClueCount}</span></div>
            </TableCell>
            <TableCell className="font-semibold tabular-nums text-slate-800">
              {row.evidenceMetrics.promptCount}件
            </TableCell>
            <TableCell className="text-sm font-semibold text-slate-600">要確認</TableCell>
            <TableCell className="text-sm leading-6 text-slate-600">
              <div className="font-semibold text-slate-800">{row.relatedTopic}</div>
              <div className="text-xs text-slate-500">{row.relatedBrand}</div>
              {row.targetUrl ? (
                <Link href={row.targetUrl} className="mt-1 inline-flex max-w-full items-center gap-1 truncate font-semibold text-[#00796B] hover:text-[#005C50]">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{row.action}</span>
                </Link>
              ) : row.action}
            </TableCell>
            <TableCell className="whitespace-nowrap font-semibold text-slate-700">{row.statusLabel}</TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={7} className="text-sm text-slate-500">
              表示できる改善候補がありません。表示対象が保存されるとここに表示されます。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function RecommendationPriorityBadge({ item }: { item: RecommendationDisplayItem }) {
  const className = item.priority === "High"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : item.priority === "Medium"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      重要度: {item.priority === "High" ? "高" : item.priority === "Medium" ? "中" : "低"}
    </Badge>
  );
}

function DisplayCategoryBadge({ item }: { item: RecommendationDisplayItem }) {
  const className = item.displayCategory === "改善候補"
    ? "border-teal-200 bg-teal-50 text-teal-700"
    : item.displayCategory === "引用確認事項"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-orange-200 bg-orange-50 text-orange-700";
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      {item.displayCategory}
    </Badge>
  );
}

function sortRecommendations(a: RecoraRecommendationRow, b: RecoraRecommendationRow) {
  const priority = priorityWeight(a.priority) - priorityWeight(b.priority);
  if (priority !== 0) return priority;
  const impact = Number(b.impact_score) - Number(a.impact_score);
  if (impact !== 0) return impact;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function priorityWeight(priority: RecoraRecommendationRow["priority"]) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function recommendationPriorityCode(priority: RecoraRecommendationRow["priority"]) {
  if (priority === "high") return "P0";
  if (priority === "medium") return "P1";
  return "P2";
}

function toDashboardPriority(priority: RecoraRecommendationRow["priority"]): DashboardPriority {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

function recommendationTypeLabel(type: RecoraRecommendationRow["type"]) {
  const labels: Record<RecoraRecommendationRow["type"], string> = {
    content: "コンテンツ",
    source: "参照元",
    technical: "サイト技術診断",
    prompt: "プロンプト",
    risk: "リスク",
    competitive: "競合"
  };
  return labels[type];
}

function normalizeRecommendationDisplayCategory(value: string) {
  if (value === "改善提案" || value === "インサイト") return "改善候補";
  return value;
}

function recommendationStateLabel(status: RecoraRecommendationRow["status"]) {
  const labels: Record<RecoraRecommendationRow["status"], string> = {
    open: "未着手",
    planned: "計画中",
    done: "完了",
    dismissed: "保留"
  };
  return labels[status];
}

function getMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getMetadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getMetadataArrayLength(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Array.isArray(value) ? value.length : undefined;
}

function buildEvidenceMetrics(evidence: Record<string, unknown>, displayCategory: string): EvidenceMetrics {
  const observationCount =
    getMetadataNumber(evidence, "observation_count") ??
    getMetadataArrayLength(evidence, "all_conversation_ids") ??
    getMetadataArrayLength(evidence, "conversation_ids") ??
    0;
  const promptCount =
    getMetadataNumber(evidence, "prompt_count") ??
    getMetadataArrayLength(evidence, "selected_prompt_ids") ??
    getMetadataArrayLength(evidence, "prompt_texts") ??
    0;
  const focusedObservationCount =
    getMetadataNumber(evidence, "focused_observation_count") ??
    getMetadataArrayLength(evidence, "observation_rows") ??
    0;
  const citationCount =
    getMetadataNumber(evidence, "citation_count") ??
    getMetadataArrayLength(evidence, "citation_rows") ??
    getMetadataArrayLength(evidence, "citation_urls") ??
    0;
  const uniqueDomainCount =
    getMetadataNumber(evidence, "unique_domain_count") ??
    getMetadataArrayLength(evidence, "citation_domains") ??
    0;
  const matchedClueCount =
    getMetadataNumber(evidence, "matched_clue_count") ??
    getMetadataArrayLength(evidence, "matched_clues") ??
    0;

  return {
    observationCount,
    promptCount,
    focusedObservationCount,
    focusedObservationLabel: focusedObservationLabel(displayCategory),
    citationCount,
    uniqueDomainCount,
    matchedClueCount
  };
}

function focusedObservationLabel(displayCategory: string) {
  if (displayCategory === "改善候補") return "未表示観測数";
  if (displayCategory === "引用確認事項") return "Web検索あり回答数";
  if (displayCategory === "サンプル不足") return "対象観測数";
  return "対象観測数";
}

function buildEvidenceDescription(displayCategory: string, metrics: EvidenceMetrics) {
  if (displayCategory === "改善候補") {
    return `今回の観測範囲では、${metrics.observationCount}件中${metrics.focusedObservationCount}件で対象ブランドの明示言及を確認できませんでした。`;
  }

  if (displayCategory === "引用確認事項") {
    return `Web検索ありの回答で引用URLを${metrics.citationCount}件、参照ドメインを${metrics.uniqueDomainCount}件確認しました。引用URLは確認されていますが、回答内容を支持しているかは確認が必要です。`;
  }

  if (displayCategory === "サンプル不足") {
    return `事例確認質問の回答から、確認不足の兆候を${metrics.matchedClueCount}件確認しました。追加確認する余地があります。`;
  }

  return "今回の観測範囲にもとづく確認材料です。";
}

function confidenceLabel(confidence: string) {
  if (confidence === "high") return "根拠強め";
  if (confidence === "medium") return "傾向あり";
  if (confidence === "low") return "要確認";
  return "要確認";
}

function getRecommendationQualityGate(metadata: Record<string, unknown>, status: string | null | undefined) {
  const publicationState = getRecommendationPublicationState({ status, metadata });

  if (publicationState === "hidden_internal") {
    return { label: "非表示", note: "顧客向けには表示しない候補です。" };
  }

  if (publicationState === "customer_visible") {
    return { label: "表示対象", note: "顧客向けに表示可能な確認材料です。" };
  }

  if (publicationState === "review_required") {
    return { label: "確認待ち", note: "根拠や表現の確認が必要な候補です。顧客向け成果物としては扱いません。" };
  }

  if (publicationState === "candidate_only") {
    return { label: "候補のみ", note: "管理者確認用の候補です。顧客向け表示には使いません。" };
  }

  return { label: "確認前", note: "表示前確認中の候補です。顧客向け成果物としては扱いません。" };
}

function safeRecoraNotice(value: string | undefined) {
  const fallback = "Recoraの観測範囲に基づく確認材料です。AI各社の公式な評価ではありません。";
  if (!value) return fallback;
  return value
    .replace("Recora独自の観測であり、AIプラットフォーム公式評価ではありません。", "Recora独自の観測です。AI各社の公式な評価ではありません。")
    .replace("20観測の結果を強い結論として扱わず、", "少数観測のため、強い結論として扱わず");
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
