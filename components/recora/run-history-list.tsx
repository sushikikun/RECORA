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
      description="このレポートに紐づく測定と集計の状態を確認できます。"
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
          <p className="mt-2 text-sm leading-6 text-slate-500">小規模測定を実行すると、ここに測定履歴が表示されます。</p>
        </div>
      ) : (
        <>
        <RunStatusSummary runs={runs} />
        <div className="mt-5 min-w-0">
        <Table className="w-full table-fixed text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">測定ID</TableHead>
              <TableHead className="w-[140px]">状態</TableHead>
              <TableHead className="w-[170px]">実行日時</TableHead>
              <TableHead className="w-[190px]">取得条件</TableHead>
              <TableHead className="w-[220px]">件数</TableHead>
              <TableHead>確認URL</TableHead>
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
                    <div className="text-xs font-semibold text-slate-500">元測定</div>
                    <div className="font-mono text-xs font-bold text-slate-800" title={run.sourceRunId ?? ""}>
                      {run.sourceRunId ? shortId(run.sourceRunId) : "-"}
                    </div>
                    <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-600">
                      {formatSearchMode(run.searchMode)}
                    </Badge>
                    <div className="pt-1">
                      <div className="text-xs font-semibold text-slate-500">測定条件</div>
                      <Badge variant="outline" className="rounded-sm border-teal-100 bg-teal-50/70 text-teal-700">
                        {formatProfileLabel(run)}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <CountLine label="プロンプト" value={run.promptCount} />
                  <CountLine label="観測単位" value={run.runItemCount} />
                  <CountLine label="AI回答" value={run.aiConversationCount} />
                  <CountLine label="ブランド言及" value={run.brandMentionCount} />
                  <CountLine label="引用" value={run.citationCount} />
                  <CountLine label="集計値" value={run.metricSnapshotCount} />
                </TableCell>
                <TableCell>
                  <RunLinks projectSlug={projectSlug} run={run} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </>
      )}
    </DataCard>
  );
}

function RunStatusSummary({ runs }: { runs: RecoraRunHistoryItem[] }) {
  const statuses = [
    { key: "completed", label: "完了", className: "bg-emerald-600", count: runs.filter((run) => run.status === "completed").length },
    { key: "running", label: "実行中", className: "bg-teal-500", count: runs.filter((run) => run.status === "running").length },
    { key: "failed", label: "失敗", className: "bg-rose-500", count: runs.filter((run) => run.status === "failed").length },
    { key: "draft", label: "下書き", className: "bg-slate-300", count: runs.filter((run) => run.status === "draft").length }
  ];
  const total = Math.max(1, runs.length);

  return (
    <div className="rounded-lg border border-[#D8E0E3] bg-[#F7FAF9] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-950">状態の内訳</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">このレポートに紐づく測定の完了・失敗・実行中を確認します。</p>
        </div>
        <p className="text-sm font-bold text-slate-600">合計 {runs.length}件</p>
      </div>
      <div className="mt-4 overflow-hidden rounded-full border border-slate-200 bg-white">
        <div className="flex h-3">
          {statuses.map((status) => (
            <div
              key={status.key}
              className={cn("h-full", status.className)}
              style={{ width: `${Math.max(status.count > 0 ? 5 : 0, Math.round((status.count / total) * 100))}%` }}
              title={`${status.label}: ${status.count}件`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <span key={status.key} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
            <span className={cn("h-2 w-2 rounded-full", status.className)} />
            {status.label} {status.count}件
          </span>
        ))}
      </div>
    </div>
  );
}

function RunKindBadge({ kind }: { kind: RecoraRunHistoryKind }) {
  const label = {
    measurement: "計測済み",
    aggregate: "集計",
    sample: "初期データ",
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
  const homeHref = projectSlug === "design-check" ? "/dashboard?design-check=1" : "/dashboard";
  const detailLink = { label: "詳細", href: `/dashboard/reports/${projectSlug}/runs/${run.id}` };
  const links = run.kind === "aggregate"
    ? [
        detailLink,
        { label: "ホーム", href: homeHref },
        { label: "ブランド比較", href: `/dashboard/reports/${projectSlug}/leaderboard` }
      ]
    : [
        detailLink,
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
  if (!value) return "取得条件なし";
  if (value === "no-search") return "検索なし";
  if (value === "web-search") return "Web検索";
  if (value === "combined") return "検索併用";
  if (value === "both") return "検索併用";
  return value;
}

function formatProfileLabel(run: RecoraRunHistoryItem) {
  if (run.measurementProfileId === "design-check-local") return "表示確認用";
  if (run.measurementProfileLabel === "LOCAL DESIGN PREVIEW") return "表示確認用";
  if (run.measurementProfileLabel) return run.measurementProfileLabel;
  if (run.kind === "measurement") return "個別測定";
  if (run.kind === "aggregate") return "集計";
  if (run.kind === "sample") return "初期データ";
  return "-";
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
