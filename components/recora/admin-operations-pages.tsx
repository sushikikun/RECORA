import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  Settings2,
  ShieldAlert
} from "lucide-react";

import { AdminOperationPlanClient } from "@/components/recora/admin-operation-plan-client";
import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  RecoraAdminOperationDetail,
  RecoraAdminOperationsData
} from "@/lib/recora/db/admin-operations";
import type { RecoraPhase1AdminStatus } from "@/lib/recora/phase1-admin-plan";
import { cn } from "@/lib/utils";

export function AdminOperationsIndexPage({
  data,
  variant = "projects"
}: {
  data: RecoraAdminOperationsData;
  variant?: "projects" | "operations";
}) {
  const copy = variant === "operations"
    ? {
        title: "実行管理",
        description: "既存の完了済みOpenAI measurement runを使った実行計画の入口です。新規計測やDB書き込みは行いません。",
        cardTitle: "実行管理対象案件",
        cardDescription: "Supabase read model、run history、report-ready判定を読み取り専用で確認し、案件ごとの実行計画へ進みます。"
      }
    : {
        title: "案件",
        description: "案件ごとの状態確認と、既存の完了済みOpenAI measurement runを使った計画確認だけを行います。",
        cardTitle: "内部運用案件一覧",
        cardDescription: "既存のSupabase read model、run history、report-ready判定を読み取り専用で表示します。"
      };

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title={copy.title}
        description={copy.description}
        actions={<InternalOnlyBadge />}
      />

      <DataCard
        title={copy.cardTitle}
        description={copy.cardDescription}
        action={
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
            {data.projects.length}件
          </Badge>
        }
      >
        {data.projects.length === 0 ? (
          <EmptyState
            title="表示できる案件がありません"
            description="現在のread権限で参照できるprojectがありません。内部認証とRLSの接続が残課題です。"
          />
        ) : (
          <Table className="min-w-[1320px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">案件名</TableHead>
                <TableHead className="min-w-[160px]">project slug</TableHead>
                <TableHead className="min-w-[170px]">ブランド名</TableHead>
                <TableHead className="min-w-[220px]">対象URL</TableHead>
                <TableHead className="min-w-[100px]">データ区分</TableHead>
                <TableHead className="min-w-[180px]">最新計測日時</TableHead>
                <TableHead className="min-w-[180px]">latest run ID</TableHead>
                <TableHead>計測</TableHead>
                <TableHead>集計</TableHead>
                <TableHead>改善案</TableHead>
                <TableHead>report-ready</TableHead>
                <TableHead className="min-w-[260px]">現在の残課題</TableHead>
                <TableHead className="min-w-[140px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.projects.map((project) => (
                <TableRow key={project.projectSlug}>
                  <TableCell>
                    <p className="font-bold text-slate-950">{project.projectName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{project.reportUrl}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-800">{project.projectSlug}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{project.brandName}</TableCell>
                  <TableCell>
                    <SafeUrl value={project.targetUrl} />
                  </TableCell>
                  <TableCell>
                    <DataBoundaryBadge value={project.dataBoundaryLabel} />
                  </TableCell>
                  <TableCell>{formatDateTime(project.latestMeasurementAt)}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-800">
                    {project.latestMeasurementRunId ? shortId(project.latestMeasurementRunId) : "-"}
                  </TableCell>
                  <TableCell><StatusBadge status={project.measurementStatus} /></TableCell>
                  <TableCell><StatusBadge status={project.aggregateStatus} /></TableCell>
                  <TableCell><StatusBadge status={project.recommendationStatus} /></TableCell>
                  <TableCell><StatusBadge status={project.reportReadyStatusLabel} /></TableCell>
                  <TableCell>
                    <IssueList issues={project.currentRemainingIssues.map((item) => item.message)} />
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}>
                        <Settings2 className="h-4 w-4" />
                        計画確認
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </div>
  );
}

export function AdminOperationsOverviewPage({ data }: { data: RecoraAdminOperationsData }) {
  const projectCount = data.projects.length;
  const reportReadyCount = data.projects.filter((project) => project.reportReadyStatus === "customer_ready").length;
  const projectsWithRuns = data.projects.filter((project) => project.completedMeasurementRuns.length > 0).length;
  const blockerCount = data.projects.reduce((total, project) => total + project.currentRemainingIssues.length, 0);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="運用概要"
        description="顧客向けdashboardから分離した、ローカル限定の内部運用コンソールです。現在は読み取りと計画確認だけを扱います。"
        actions={<InternalOnlyBadge />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="案件" value={`${projectCount}件`} />
        <SummaryTile label="完了済みrunあり" value={`${projectsWithRuns}件`} />
        <SummaryTile label="report-ready" value={`${reportReadyCount}件`} tone={reportReadyCount > 0 ? "green" : "slate"} />
        <SummaryTile label="残課題" value={`${blockerCount}件`} tone={blockerCount > 0 ? "amber" : "green"} />
      </div>

      <DataCard
        title="内部コンソールの入口"
        description="未実装の導線は出さず、現在使える内部運用画面だけを表示します。"
      >
        <div className="divide-y divide-slate-200">
          <OverviewLink
            href="/internal/projects"
            title="案件"
            description="案件一覧、report-ready状態、完了済みmeasurement runの有無を確認します。"
          />
          <OverviewLink
            href="/internal/operations"
            title="実行管理"
            description="既存measurement runを使った実行計画の確認へ進みます。実処理は起動しません。"
          />
        </div>
      </DataCard>

      <DataCard
        title="安全境界"
        description="今回の内部コンソールはローカル検証用で、正式な内部認証や権限管理はまだ接続していません。"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <SafetyFact icon="check" title="読み取り中心" description="既存read modelとPhase 1計画ロジックだけを使います。" />
          <SafetyFact icon="alert" title="実行なし" description="OpenAI API、子プロセス、DB書き込みは起動しません。" />
          <SafetyFact icon="check" title="公開環境は404" description="明示フラグ、localhost、非production、非Vercelを満たす場合だけ表示します。" />
        </div>
      </DataCard>
    </div>
  );
}

export function AdminOperationsUnavailablePage({
  message
}: {
  message: string;
}) {
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="内部運用コンソール"
        description="内部運用画面は表示できますが、read modelを読み取る設定が完了していません。"
        actions={<InternalOnlyBadge />}
      />

      <DataCard title="案件一覧を読み取れません" description="この画面は代替データを表示しません。Supabase read設定を確認してください。">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {message}
        </div>
      </DataCard>
    </div>
  );
}

export function AdminOperationDetailPage({
  detail
}: {
  detail: RecoraAdminOperationDetail;
}) {
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title={`${detail.projectName} の実行計画`}
        description="この画面では計画だけを作成します。実計測、DB書き込み、改善案保存、remote migration適用は起動しません。"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/internal/projects">
                <ArrowLeft className="h-4 w-4" />
                一覧へ
              </Link>
            </Button>
            <InternalOnlyBadge />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryTile label="project slug" value={detail.projectSlug} />
        <SummaryTile label="ブランド名" value={detail.brandName} />
        <SummaryTile label="データ区分" value={detail.dataBoundaryLabel} />
        <SummaryTile label="report-ready" value={detail.reportReadyStatusLabel} tone={detail.reportReadyStatusLabel === "公開可能" ? "green" : "amber"} />
        <SummaryTile label="最新measurement run" value={detail.latestMeasurementRunId ? shortId(detail.latestMeasurementRunId) : "-"} helper={formatDateTime(detail.latestMeasurementAt)} />
        <SummaryTile label="aggregate run" value={detail.currentAggregateRunId ? shortId(detail.currentAggregateRunId) : "-"} helper={`${detail.currentMetricSnapshotCount} snapshots`} />
        <SummaryTile label="有効観測" value={String(detail.currentValidObservationCount)} />
        <SummaryTile label="顧客表示改善案" value={detail.customerVisibleRecommendationCount === null ? "未確認" : String(detail.customerVisibleRecommendationCount)} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <AdminOperationPlanClient detail={detail} />

        <DataCard
          title="現在の残課題"
          description="report-ready gateの既存判定結果を日本語表示しています。"
        >
          <IssueList
            issues={
              detail.currentRemainingIssues.length > 0
                ? detail.currentRemainingIssues.map((item) => item.message)
                : ["残課題はありません。"]
            }
          />
          {detail.reportReadyDiagnosticNotes.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-bold text-amber-900">診断メモ</p>
              <IssueList issues={detail.reportReadyDiagnosticNotes.map((item) => item.message)} className="mt-2" />
            </div>
          ) : null}
        </DataCard>
      </div>

      <DataCard
        title="既存の完了済みOpenAI measurement run"
        description="この一覧から計画対象のrunを選択します。新規OpenAI計測は今回の対象外です。"
        action={
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
            {detail.completedMeasurementRuns.length}件
          </Badge>
        }
      >
        {detail.completedMeasurementRuns.length === 0 ? (
          <EmptyState
            title="完了済みOpenAI measurement runがありません"
            description="まずCLIで計測runを確認してください。この画面から新規計測は実行しません。"
          />
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>run ID</TableHead>
                <TableHead>完了日時</TableHead>
                <TableHead>AI回答</TableHead>
                <TableHead>prompt</TableHead>
                <TableHead>search mode</TableHead>
                <TableHead>profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.completedMeasurementRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-xs font-bold text-slate-800">{run.id}</TableCell>
                  <TableCell>{formatDateTime(run.completedAt)}</TableCell>
                  <TableCell className="font-bold text-slate-950">{run.aiConversationCount}</TableCell>
                  <TableCell>{run.promptCount}</TableCell>
                  <TableCell>{run.searchMode ?? "-"}</TableCell>
                  <TableCell>{run.measurementProfileId ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </div>
  );
}

function InternalOnlyBadge() {
  return (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
      <LockKeyhole className="mr-1 h-3.5 w-3.5" />
      内部運用
    </Badge>
  );
}

function SummaryTile({
  label,
  value,
  helper,
  tone = "slate"
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "slate" | "green" | "amber";
}) {
  const toneClass = {
    slate: "text-slate-950",
    green: "text-emerald-700",
    amber: "text-amber-700"
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="truncate text-xs font-bold text-slate-500">{label}</p>
      <p className={cn("mt-2 truncate text-xl font-bold", toneClass)} title={value}>
        {value}
      </p>
      {helper ? <p className="mt-1 truncate text-xs font-semibold text-slate-500">{helper}</p> : null}
    </div>
  );
}

function OverviewLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 py-4 text-left transition-colors hover:text-teal-700">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-teal-700" />
    </Link>
  );
}

function SafetyFact({
  icon,
  title,
  description
}: {
  icon: "check" | "alert";
  title: string;
  description: string;
}) {
  const Icon = icon === "check" ? CheckCircle2 : ShieldAlert;
  const iconClass = icon === "check" ? "text-emerald-700" : "text-amber-700";

  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
      <span>
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
    </div>
  );
}

function DataBoundaryBadge({ value }: { value: "demo" | "customer" | "未設定" }) {
  const className = value === "customer"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : value === "demo"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={cn("rounded-sm", className)}>
      {value}
    </Badge>
  );
}

function StatusBadge({ status }: { status: RecoraPhase1AdminStatus }) {
  const className = {
    未設定: "border-slate-200 bg-slate-50 text-slate-600",
    設定済み: "border-emerald-200 bg-emerald-50 text-emerald-700",
    計測待ち: "border-amber-200 bg-amber-50 text-amber-700",
    計測中: "border-teal-200 bg-teal-50 text-teal-700",
    集計待ち: "border-amber-200 bg-amber-50 text-amber-700",
    改善案確認待ち: "border-indigo-200 bg-indigo-50 text-indigo-700",
    レポート準備中: "border-amber-200 bg-amber-50 text-amber-700",
    公開可能: "border-emerald-200 bg-emerald-50 text-emerald-700",
    失敗: "border-rose-200 bg-rose-50 text-rose-700"
  }[status];

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      {status}
    </Badge>
  );
}

function IssueList({ issues, className }: { issues: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5 text-sm leading-6 text-slate-700", className)}>
      {issues.length > 0 ? issues.map((issue) => (
        <li key={issue} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span>{issue}</span>
        </li>
      )) : (
        <li>なし</li>
      )}
    </ul>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function SafeUrl({ value }: { value: string }) {
  if (value === "未設定") return <span>{value}</span>;

  return (
    <Link href={value} className="inline-flex max-w-[220px] items-center gap-1 truncate font-semibold text-teal-700">
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </Link>
  );
}

function formatDateTime(value: string | null) {
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

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
