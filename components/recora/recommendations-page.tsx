import Link from "next/link";
import { Download, ExternalLink, RefreshCw, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataCard, MetricTile, PageHeader } from "@/components/recora/ui";
import { reportDetailTabs } from "@/lib/recora/nav-config";
import type { RecoraRecommendationRow, RecoraRecommendationsDbData } from "@/lib/recora/db";
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
  observationCount: number;
  citationUrlCount: number;
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
        description="AI検索での観測結果から、次に確認したい改善候補を整理します。承認済み施策や効果保証ではありません。"
        meta={<ReportFilters compact data={recommendationsData} />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.recommendations} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile label="改善候補数" value={String(view.items.length)} helper={view.sourceLabel} />
        <MetricTile label="高優先度" value={String(view.highPriorityCount)} helper="priority high" tone="amber" />
        <MetricTile label="観測数" value={String(view.observationCount)} helper={view.sourceLabel} />
        <MetricTile label="参照URL数" value={String(view.citationUrlCount)} helper="根拠確認済み数ではありません" tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <DataCard title="優先して確認したい改善候補" description="断定ではなく、AI検索での観測結果から表示する確認材料です。">
          <div className="space-y-4">
            {topItems.length > 0 ? topItems.map((item) => (
              <RecommendationActionCard key={item.id} item={item} />
            )) : (
              <EmptyStateBlock title="表示できる改善候補がありません" description="表示対象の改善候補が保存されると、ここに表示されます。" />
            )}
          </div>
        </DataCard>

        <DataCard title="確認状況" description="改善候補の状態を要約しています。完了は効果保証を意味しません。">
          <div className="space-y-4">
            <RecommendationStatusRow label="未着手" value={view.openCount} tone="rose" />
            <RecommendationStatusRow label="計画中" value={view.plannedCount} tone="amber" />
            <RecommendationStatusRow label="完了" value={view.doneCount} tone="green" />
            <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-xs leading-5 text-teal-800">
              {`${view.sourceLabel}由来かつdisplay_decision=showの項目だけを表示しています。承認済み施策ではありません。`}
            </div>
          </div>
        </DataCard>
      </div>

      <DataCard title="改善候補一覧" description={`${view.sourceLabel}由来の表示対象だけを、区分と観測根拠付きで表示します。`}>
        <div className="overflow-x-auto">
          <RecommendationsTable rows={view.items} />
        </div>
      </DataCard>
    </div>
  );
}

function createRecommendationsViewModel(data?: RecoraRecommendationsDbData | null): RecommendationsViewModel {
  const items = data?.project ? createDbRecommendationItems(data) : [];
  const highPriorityCount = items.filter((item) => item.priority === "High").length;
  const observationCount = Math.max(0, ...items.map((item) => item.evidenceMetrics.observationCount));
  const citationUrlCount = Math.max(0, ...items.map((item) => item.evidenceMetrics.citationCount));

  return {
    sourceLabel: data?.project ? getRecommendationSourceLabel(data.recommendations) : "表示できるデータがありません",
    items,
    highPriorityCount,
    observationCount,
    citationUrlCount,
    openCount: items.filter((item) => item.statusLabel === "未着手").length,
    plannedCount: items.filter((item) => item.statusLabel === "計画中").length,
    doneCount: items.filter((item) => item.statusLabel === "完了").length
  };
}

function getRecommendationSourceLabel(recommendations: RecoraRecommendationRow[]) {
  const metadata = getMetadataRecord(recommendations[0]?.metadata);
  const profileId = getMetadataString(metadata, "measurement_profile_id");

  if (profileId === "custom-openai-run") return "custom OpenAI実測run";
  if (profileId === "standard-v01") return "最新standard-v01";

  return "OpenAI実測run";
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
        customerFacingCaution: safeRecoraNotice(getMetadataString(metadata, "customer_facing_caution")),
        recoraMetricNotice: safeRecoraNotice(getMetadataString(metadata, "recora_metric_notice")),
        sampleSizeCaution: displayCategory === "サンプル不足"
          ? "サンプル数が少ないため、追加測定で傾向が変わる可能性があります。"
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

function HeaderActions() {
  return (
    <>
      <Button variant="outline">
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

function ReportFilters({ compact = false, data }: { compact?: boolean; data?: RecoraRecommendationsDbData | null }) {
  const latestRun = data?.latestRun;
  const projectName = data?.project?.name ?? "Recora";
  const dateScope = getRecommendationDateScope(latestRun?.period_start, latestRun?.period_end, data?.project?.default_period);
  const comparisonPeriod = latestRun?.comparison_start && latestRun.comparison_end ? latestRun.comparison_start + " - " + latestRun.comparison_end : "-";

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.035)] md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1.1fr_0.8fr_auto]">
      <FilterBox label="プロジェクト" value={projectName} />
      <FilterBox label={dateScope.label} value={dateScope.value} />
      {!compact ? <FilterBox label="比較期間" value={comparisonPeriod} /> : <FilterBox label="比較期間" value={comparisonPeriod} />}
      <FilterBox label="地域" value={"\u65e5\u672c\u8a9e\uff08\u65e5\u672c\uff09"} />
      <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        最終更新
      </div>
    </div>
  );
}

function getRecommendationDateScope(start?: string | null, end?: string | null, fallback?: string | null) {
  if (start && end && start === end) {
    return { label: "測定日", value: start };
  }

  if (start || end) {
    return { label: "測定期間", value: `${start ?? "-"} - ${end ?? "-"}` };
  }

  return { label: "測定日", value: fallback ?? "-" };
}

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
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
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-white text-slate-600">{item.statusLabel}</Badge>
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-950">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
        </div>
        <div className="grid min-w-[150px] gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-500">観測数</p>
            <p className="mt-1 text-lg font-bold text-teal-700">{item.evidenceMetrics.observationCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">対象プロンプト</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{item.evidenceMetrics.promptCount}</p>
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
        <RecommendationMeta label="推奨アクション" value={item.action} />
      </div>
      <RecommendationEvidenceMetrics item={item} />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RecommendationNote label="観測根拠の説明" value={item.evidenceDescription} />
        <RecommendationNote label="注意書き" value={item.customerFacingCaution} />
      </div>
      {item.sampleSizeCaution ? (
        <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-800">
          {item.sampleSizeCaution}
        </div>
      ) : null}
      <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
        {item.recoraMetricNotice}
      </div>
    </div>
  );
}

function RecommendationEvidenceMetrics({ item }: { item: RecommendationDisplayItem }) {
  const metrics = item.evidenceMetrics;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <RecommendationMetric label={metrics.focusedObservationLabel} value={metrics.focusedObservationCount} />
      <RecommendationMetric label="引用URL数" value={metrics.citationCount} />
      <RecommendationMetric label="unique domain数" value={metrics.uniqueDomainCount} />
      <RecommendationMetric label="matched_clues数" value={metrics.matchedClueCount} />
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
      <p className="mt-1 truncate text-sm font-semibold text-slate-700" title={value}>{value}</p>
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

function RecommendationsTable({ rows }: { rows: RecommendationDisplayItem[] }) {
  return (
    <Table className="min-w-[980px]">
      <TableHeader>
        <TableRow>
          <TableHead>タイトル</TableHead>
          <TableHead>優先度</TableHead>
          <TableHead>表示区分</TableHead>
          <TableHead>確からしさ</TableHead>
          <TableHead>観測根拠</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>関連項目</TableHead>
          <TableHead>アクション</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="min-w-[260px]">
              <div className="font-bold text-slate-950">{row.title}</div>
              <div className="mt-1 text-xs font-semibold text-slate-400">{row.createdAt}</div>
            </TableCell>
            <TableCell className="whitespace-nowrap"><RecommendationPriorityBadge item={row} /></TableCell>
            <TableCell className="whitespace-nowrap"><DisplayCategoryBadge item={row} /></TableCell>
            <TableCell className="whitespace-nowrap font-semibold text-slate-700">{row.confidenceLabel}</TableCell>
            <TableCell className="min-w-[170px] text-xs leading-5 text-slate-600">
              <div>観測数: <span className="font-bold text-slate-950">{row.evidenceMetrics.observationCount}</span></div>
              <div>{row.evidenceMetrics.focusedObservationLabel}: <span className="font-bold text-slate-950">{row.evidenceMetrics.focusedObservationCount}</span></div>
              <div>引用URL: <span className="font-bold text-slate-950">{row.evidenceMetrics.citationCount}</span></div>
            </TableCell>
            <TableCell className="whitespace-nowrap">{row.statusLabel}</TableCell>
            <TableCell className="min-w-[220px] text-sm leading-6 text-slate-600">
              <div className="font-semibold text-slate-800">{row.relatedTopic}</div>
              <div className="text-xs text-slate-500">{row.relatedBrand}</div>
            </TableCell>
            <TableCell className="min-w-[260px] text-sm leading-6 text-slate-600">
              {row.targetUrl ? (
                <Link href={row.targetUrl} className="inline-flex max-w-[240px] items-center gap-1 truncate font-semibold text-blue-700 hover:text-blue-800">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{row.action}</span>
                </Link>
              ) : row.action}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={8} className="text-sm text-slate-500">
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
      {item.priorityCode} / {item.priority === "High" ? "高" : item.priority === "Medium" ? "中" : "低"}
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
  if (displayCategory === "引用確認事項") return "web-search観測数";
  if (displayCategory === "サンプル不足") return "対象観測数";
  return "対象観測数";
}

function buildEvidenceDescription(displayCategory: string, metrics: EvidenceMetrics) {
  if (displayCategory === "改善候補") {
    return `今回の観測範囲では、${metrics.observationCount}件中${metrics.focusedObservationCount}件で対象ブランドの明示言及を確認できませんでした。`;
  }

  if (displayCategory === "引用確認事項") {
    return `web-search由来の引用URLを${metrics.citationCount}件、unique domainを${metrics.uniqueDomainCount}件確認しました。引用URLは確認されていますが、回答内容を支持しているかは確認が必要です。`;
  }

  if (displayCategory === "サンプル不足") {
    return `事例確認promptの回答から、確認不足の兆候を${metrics.matchedClueCount}件確認しました。追加確認する余地があります。`;
  }

  return "今回の観測範囲にもとづく確認材料です。";
}

function confidenceLabel(confidence: string) {
  if (confidence === "high") return "根拠強め";
  if (confidence === "medium") return "傾向あり";
  if (confidence === "low") return "要確認";
  return "要確認";
}

function safeRecoraNotice(value: string | undefined) {
  const fallback = "Recora独自の観測です。少数観測のため、強い結論として扱わず確認材料としてご利用ください。";
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
