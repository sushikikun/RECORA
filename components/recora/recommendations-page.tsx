import Link from "next/link";
import { ArrowRight, Download, ExternalLink, RefreshCw, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataCard, MetricTile, PageHeader, ProgressBar } from "@/components/recora/ui";
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
  statusLabel: string;
  reason: string;
  expectedImpact: string;
  effortLabel: string;
  effortScore: number;
  impactScore: number;
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
  averageImpact: number;
  averageEffort: number;
  openCount: number;
  plannedCount: number;
  doneCount: number;
};

const reportBase = "/dashboard/reports/recora-kenzai-q2";

export function RecommendationsDbPage({ recommendationsData = null }: { recommendationsData?: RecoraRecommendationsDbData | null }) {
  const view = createRecommendationsViewModel(recommendationsData);
  const topItems = view.items.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="改善"
        title="改善提案"
        description="AI表示率と競合差分から、優先して直す施策を整理します。数値はRecora独自の測定結果にもとづく参考指標です。"
        meta={<ReportFilters compact data={recommendationsData} />}
        actions={<HeaderActions />}
      />
      <DetailTabs items={reportDetailTabs.recommendations} />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricTile label="改善提案" value={String(view.items.length)} helper={view.sourceLabel} />
        <MetricTile label="高優先度" value={String(view.highPriorityCount)} helper="P0相当の提案" tone="amber" />
        <MetricTile label="平均インパクト" value={String(view.averageImpact)} helper="impact_score平均" />
        <MetricTile label="平均負荷" value={String(view.averageEffort)} helper="effort_score平均" tone="slate" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <DataCard title="優先度順の改善提案" description="断定ではなく、AI検索での観測結果から優先度を付けた施策候補です。">
          <div className="space-y-4">
            {topItems.length > 0 ? topItems.map((item) => (
              <RecommendationActionCard key={item.id} item={item} />
            )) : (
              <EmptyStateBlock title="表示できるrecommendationsがありません" description="測定結果から改善提案が保存されると、ここに優先度順で表示されます。" />
            )}
          </div>
        </DataCard>

        <DataCard title="対応状況" description="今の改善提案の状態を要約しています。">
          <div className="space-y-4">
            <RecommendationStatusRow label="未着手" value={view.openCount} tone="rose" />
            <RecommendationStatusRow label="計画中" value={view.plannedCount} tone="amber" />
            <RecommendationStatusRow label="完了" value={view.doneCount} tone="green" />
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-800">
              {"表示対象として保存済みの改善提案だけを表示しています。"}
            </div>
            <div className="grid gap-2">
              <PlaceholderLink href={reportBase + "/action-plan"} label="改善プラン" helper="30/60/90日の実行計画に落とし込む" />
              <PlaceholderLink href={reportBase + "/content-opportunities"} label="コンテンツ改善案" helper="作るべきページを確認する" />
            </div>
          </div>
        </DataCard>
      </div>

      <DataCard className="mt-5" title="改善提案一覧" description="保存済みの改善提案を、関連トピック・ブランドとあわせて表示します。">
        <div className="overflow-x-auto">
          <RecommendationsTable rows={view.items} />
        </div>
      </DataCard>
    </>
  );
}

function createRecommendationsViewModel(data?: RecoraRecommendationsDbData | null): RecommendationsViewModel {
  const items = data?.project ? createDbRecommendationItems(data) : [];
  const highPriorityCount = items.filter((item) => item.priority === "High").length;
  const averageImpact = Math.round(average(items.map((item) => item.impactScore)));
  const effortValues = items.map((item) => item.effortScore).filter((value) => value > 0);
  const averageEffort = Math.round(average(effortValues));

  return {
    sourceLabel: data?.project ? "保存済み提案" : "表示できるデータがありません",
    items,
    highPriorityCount,
    averageImpact,
    averageEffort,
    openCount: items.filter((item) => item.statusLabel === "未着手").length,
    plannedCount: items.filter((item) => item.statusLabel === "計画中").length,
    doneCount: items.filter((item) => item.statusLabel === "完了").length
  };
}

function createDbRecommendationItems(data: RecoraRecommendationsDbData): RecommendationDisplayItem[] {
  const topicById = new Map(data.topics.map((topic) => [topic.id, topic]));
  const promptById = new Map(data.prompts.map((prompt) => [prompt.id, prompt]));
  const primaryBrand = data.brands.find((item) => item.brand_type === "primary") ?? data.brands[0];

  return [...data.recommendations]
    .sort(sortRecommendations)
    .map((item) => {
      const metadata = getMetadataRecord(item.metadata);
      const prompt = item.related_prompt_id ? promptById.get(item.related_prompt_id) : undefined;
      const topic = item.related_topic_id ? topicById.get(item.related_topic_id) : prompt ? topicById.get(prompt.topic_id) : undefined;
      const expectedImpact = getMetadataString(metadata, "expected_impact") ?? "+" + Math.round(item.impact_score) + "pt";
      const effortScore = item.effort_score === null ? 0 : Math.round(item.effort_score);
      const relatedBrand = getMetadataString(metadata, "related_brand") ?? getMetadataString(metadata, "brand") ?? primaryBrand?.name ?? "未設定";

      return {
        id: item.id,
        title: item.title,
        priority: toDashboardPriority(item.priority),
        priorityCode: recommendationPriorityCode(item.priority),
        typeLabel: recommendationTypeLabel(item.type),
        statusLabel: recommendationStateLabel(item.status),
        reason: item.reason ?? "理由は未設定です。",
        expectedImpact,
        effortLabel: item.effort_score === null ? "未設定" : effortScore + " / 100",
        effortScore,
        impactScore: Math.round(item.impact_score),
        relatedBrand,
        relatedTopic: topic?.name ?? prompt?.intent ?? "未設定",
        relatedPrompt: prompt?.text ?? "未設定",
        action: getMetadataString(metadata, "recommended_action") ?? item.target_url ?? "詳細を確認",
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
  const period = latestRun ? latestRun.period_start + " - " + latestRun.period_end : data?.project?.default_period ?? "-";
  const comparisonPeriod = latestRun?.comparison_start && latestRun.comparison_end ? latestRun.comparison_start + " - " + latestRun.comparison_end : "-";

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.035)] md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1.1fr_0.8fr_auto]">
      <FilterBox label="プロジェクト" value={projectName} />
      <FilterBox label="期間" value={period} />
      {!compact ? <FilterBox label="比較期間" value={comparisonPeriod} /> : <FilterBox label="比較期間" value={comparisonPeriod} />}
      <FilterBox label="地域" value={"\u65e5\u672c\u8a9e\uff08\u65e5\u672c\uff09"} />
      <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        最終更新
      </div>
    </div>
  );
}

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function PlaceholderLink({ href, label, helper }: { href: string; label: string; helper: string }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500 group-hover:text-blue-600">{helper}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function RecommendationActionCard({ item }: { item: RecommendationDisplayItem }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <RecommendationPriorityBadge item={item} />
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-blue-200 bg-blue-50 text-blue-700">{item.typeLabel}</Badge>
            <Badge variant="outline" className="whitespace-nowrap rounded-sm border-slate-200 bg-white text-slate-600">{item.statusLabel}</Badge>
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-950">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
        </div>
        <div className="grid min-w-[150px] gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-500">期待効果</p>
            <p className="mt-1 text-lg font-bold text-blue-700">{item.expectedImpact}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">実装負荷</p>
            <ProgressBar value={item.effortScore} tone="slate" className="mt-2" />
            <p className="mt-1 text-xs font-semibold text-slate-500">{item.effortLabel}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <RecommendationMeta label="関連ブランド" value={item.relatedBrand} />
        <RecommendationMeta label="関連トピック" value={item.relatedTopic} />
        <RecommendationMeta label="推奨アクション" value={item.action} />
      </div>
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
    <Table className="min-w-[1080px]">
      <TableHeader>
        <TableRow>
          <TableHead>タイトル</TableHead>
          <TableHead>優先度</TableHead>
          <TableHead>改善タイプ</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>期待効果</TableHead>
          <TableHead>実装負荷</TableHead>
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
            <TableCell className="whitespace-nowrap font-semibold text-slate-700">{row.typeLabel}</TableCell>
            <TableCell className="whitespace-nowrap">{row.statusLabel}</TableCell>
            <TableCell className="whitespace-nowrap font-bold text-blue-700">{row.expectedImpact}</TableCell>
            <TableCell className="min-w-[120px]">
              <ProgressBar value={row.effortScore} tone="slate" />
              <span className="mt-1 block text-xs font-semibold text-slate-500">{row.effortLabel}</span>
            </TableCell>
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
              表示できるrecommendationsがありません。測定結果から改善提案が保存されるとここに表示されます。
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

function recommendationStateLabel(status: RecoraRecommendationRow["status"]) {
  const labels: Record<RecoraRecommendationRow["status"], string> = {
    open: "未着手",
    planned: "計画中",
    done: "完了",
    dismissed: "保留"
  };
  return labels[status];
}

function getMetadataRecord(value: RecoraRecommendationRow["metadata"]): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
