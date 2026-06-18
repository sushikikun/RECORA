import Link from "next/link";
import { CheckCircle2, Clock3, ExternalLink, ListChecks, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { DataCard } from "@/components/recora/ui";
import { cn } from "@/lib/utils";
import type { RecoraRunHistoryItem, RecoraRunHistoryKind, RecoraRunsDbData } from "@/lib/recora/db";

type RunHistoryListProps = {
  projectSlug: string;
  runsData: RecoraRunsDbData | null;
  loadError?: boolean;
};

export function RunHistoryList({ projectSlug, runsData, loadError = false }: RunHistoryListProps) {
  const runs = runsData?.runs ?? [];

  return (
    <DataCard
      className="mt-5"
      title="測定履歴"
      description="過去の測定run、集計run、サンプルrunを確認できます。"
      action={
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
          {loadError ? "取得失敗" : `${runs.length}件`}
        </Badge>
      }
    >
      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
          測定履歴を取得できませんでした。測定実行UIはこのまま利用できます。
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-slate-700">測定履歴はまだありません。</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">小規模測定を実行すると、ここにrun履歴が表示されます。</p>
        </div>
      ) : (
        <Table className="min-w-[1320px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[230px]">run id</TableHead>
              <TableHead className="min-w-[160px]">種別・状態</TableHead>
              <TableHead className="min-w-[220px]">実行日時</TableHead>
              <TableHead className="min-w-[220px]">source / search</TableHead>
              <TableHead className="min-w-[180px]">測定数</TableHead>
              <TableHead className="min-w-[180px]">観測データ</TableHead>
              <TableHead className="min-w-[170px]">集計</TableHead>
              <TableHead className="min-w-[230px]">確認URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <div className="font-mono text-xs font-bold text-slate-950" title={run.id}>
                    {shortId(run.id)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{formatDateTime(run.createdAt)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <RunKindBadge kind={run.kind} />
                    <RunStatusBadge status={run.status} />
                  </div>
                </TableCell>
                <TableCell>
                  <RunDateLine label="開始" value={run.startedAt} />
                  <RunDateLine label="完了" value={run.completedAt} />
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-500">source</div>
                    <div className="font-mono text-xs font-bold text-slate-800" title={run.sourceRunId ?? ""}>
                      {run.sourceRunId ? shortId(run.sourceRunId) : "-"}
                    </div>
                    <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-600">
                      {formatSearchMode(run.searchMode)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <CountLine label="prompt" value={run.promptCount} />
                  <CountLine label="run_items" value={run.runItemCount} />
                </TableCell>
                <TableCell>
                  <CountLine label="AI回答" value={run.aiConversationCount} />
                  <CountLine label="ブランド言及" value={run.brandMentionCount} />
                  <CountLine label="引用" value={run.citationCount} />
                </TableCell>
                <TableCell>
                  <div className="mb-2">
                    <AggregationBadge run={run} />
                  </div>
                  <CountLine label="snapshots" value={run.metricSnapshotCount} />
                  {run.aggregateSnapshotCount > 0 ? <CountLine label="aggregate snapshots" value={run.aggregateSnapshotCount} /> : null}
                </TableCell>
                <TableCell>
                  <RunLinks projectSlug={projectSlug} run={run} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataCard>
  );
}

function RunKindBadge({ kind }: { kind: RecoraRunHistoryKind }) {
  const label = {
    measurement: "OpenAI測定",
    aggregate: "集計run",
    sample: "サンプル",
    unknown: "不明"
  }[kind];
  const className = {
    measurement: "border-teal-200 bg-teal-50 text-teal-700",
    aggregate: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sample: "border-slate-200 bg-slate-50 text-slate-600",
    unknown: "border-orange-200 bg-orange-50 text-orange-700"
  }[kind];

  return (
    <Badge variant="outline" className={cn("rounded-sm", className)}>
      {label}
    </Badge>
  );
}

function RunStatusBadge({ status }: { status: RecoraRunHistoryItem["status"] }) {
  const statusMap = {
    completed: { label: "完了", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
    failed: { label: "失敗", className: "border-rose-200 bg-rose-50 text-rose-700", icon: XCircle },
    running: { label: "実行中", className: "border-teal-200 bg-teal-50 text-teal-700", icon: Clock3 },
    draft: { label: "下書き", className: "border-slate-200 bg-slate-50 text-slate-600", icon: ListChecks }
  } satisfies Record<RecoraRunHistoryItem["status"], { label: string; className: string; icon: typeof CheckCircle2 }>;
  const item = statusMap[status];
  const Icon = item.icon;

  return (
    <Badge variant="outline" className={cn("rounded-sm", item.className)}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {item.label}
    </Badge>
  );
}

function AggregationBadge({ run }: { run: RecoraRunHistoryItem }) {
  if (run.kind === "aggregate") {
    return (
      <Badge variant="outline" className="rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700">
        集計run
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm",
        run.isAggregated ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {run.isAggregated ? "集計済み" : "未集計"}
    </Badge>
  );
}

function RunDateLine({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 justify-between gap-3 text-xs leading-5">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="truncate font-bold text-slate-800" title={value ?? ""}>{formatDateTime(value)}</span>
    </div>
  );
}

function CountLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-0 justify-between gap-3 text-xs leading-6">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-slate-950">{value}</span>
    </div>
  );
}

function RunLinks({ projectSlug, run }: { projectSlug: string; run: RecoraRunHistoryItem }) {
  const links = run.kind === "aggregate"
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Leaderboard", href: `/dashboard/reports/${projectSlug}/leaderboard` }
      ]
    : [
        { label: "AI回答", href: `/dashboard/reports/${projectSlug}/conversations` },
        { label: "参照元", href: `/dashboard/reports/${projectSlug}/sources` }
      ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-teal-700 transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {link.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ))}
    </div>
  );
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function formatSearchMode(value: string | null) {
  if (!value) return "search: -";
  if (value === "no-search") return "no-search";
  if (value === "web-search") return "web-search";
  if (value === "combined") return "combined";
  if (value === "both") return "both";
  return value;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
