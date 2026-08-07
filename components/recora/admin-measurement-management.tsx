import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Gauge,
  History,
  PlayCircle,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminMeasurementAttentionItem,
  AdminMeasurementManagementSnapshot,
  AdminMeasurementProjectItem,
  AdminMeasurementRecentRun,
  AdminMeasurementSourceKey,
  AdminMeasurementSourceState,
  AdminMeasurementSourceStatus
} from "@/lib/recora/admin-measurement-management";
import { cn } from "@/lib/utils";

export function AdminMeasurementManagementPage({
  snapshot,
  loadError
}: {
  snapshot: AdminMeasurementManagementSnapshot;
  loadError?: string | null;
}) {
  const projectSource = getSource(snapshot, "projects");
  const runSource = getSource(snapshot, "measurementRuns");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Measurement Operations"
        title="測定管理"
        description="日次測定、measurement run、失敗、進行中、初回完了待ちを分け、管理者が確認すべき対象を整理します。"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/internal/operations">
                既存の実行管理
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Pill label="Read only" tone="green" />
            <Pill label="既存run接続" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">例外中心の測定運用画面です</p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              失敗、進行中、初回完了待ちを別状態として扱います。既存run historyは各Project最大50件です。日次対象判定、run item進捗、AIモデルhealth、再試行commandは正式接続まで推測しません。
            </p>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-900">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="管理対象Project"
          value={formatCount(snapshot.projectCount)}
          note={metricSourceNote(projectSource)}
          icon={Gauge}
          state={projectSource.state}
        />
        <SummaryMetric
          label="参照中の完了measurement run"
          value={formatCount(snapshot.completedRunCount)}
          note={
            snapshot.projectsWithCompletedRuns === null
              ? "run historyを読み取れません"
              : `${snapshot.projectsWithCompletedRuns} Project / 各Project最大50件`
          }
          icon={CheckCircle2}
          state={runSource.state}
          tone={
            snapshot.completedRunCount !== null && snapshot.completedRunCount > 0
              ? "green"
              : "slate"
          }
        />
        <SummaryMetric
          label="計測中Project"
          value={formatCount(snapshot.runningProjectCount)}
          note="進行中であり、失敗とは扱いません"
          icon={PlayCircle}
          state={runSource.state}
          tone={
            snapshot.runningProjectCount !== null && snapshot.runningProjectCount > 0
              ? "amber"
              : "slate"
          }
        />
        <SummaryMetric
          label="失敗Project"
          value={formatCount(snapshot.failedProjectCount)}
          note="最新measurement状態が失敗"
          icon={CircleAlert}
          state={runSource.state}
          tone={
            snapshot.failedProjectCount !== null && snapshot.failedProjectCount > 0
              ? "red"
              : "green"
          }
        />
      </div>

      <DataCard
        title="今、確認する測定"
        description="失敗を最優先にし、進行中と初回完了待ちは障害と混同せず表示します。"
        action={
          snapshot.projectCount === null ? (
            <Pill label="read unavailable" tone="slate" />
          ) : (
            <Pill label={`${snapshot.attentionQueue.length}件`} tone={attentionSummaryTone(snapshot)} />
          )
        }
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="測定readを読み取れません"
            text="取得失敗を0件や正常として扱いません。"
          />
        ) : snapshot.projectCount === 0 ? (
          <BoundaryState
            icon={Activity}
            title="参照できるProjectは0件です"
            text="現在のProject readで取得できる対象がありません。"
            positive
          />
        ) : snapshot.attentionQueue.length === 0 ? (
          <BoundaryState
            icon={CheckCircle2}
            title="既存run read上の確認対象はありません"
            text="日次対象判定、provider health、安全停止は未接続のため、この結果だけで測定基盤全体が正常とは断定しません。"
            positive
          />
        ) : (
          <AttentionQueue items={snapshot.attentionQueue} />
        )}
      </DataCard>

      <DataCard
        title="Project別測定状況"
        description="measurementとaggregateを別状態として表示し、既存history内の最新完了runをProject単位で確認します。"
        action={<SourcePill source={runSource} />}
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="Project別測定状況を読み取れません"
            text="read接続が復旧するまで件数や状態を生成しません。"
          />
        ) : snapshot.projects.length === 0 ? (
          <BoundaryState
            icon={Activity}
            title="表示対象のProjectは0件です"
            text="現在のProject compatibility readの結果です。"
            positive
          />
        ) : (
          <ProjectMeasurementTable projects={snapshot.projects} />
        )}
      </DataCard>

      <DataCard
        title="直近の完了measurement run"
        description="各Project最大50件の既存historyから、完了日時順で最大8件表示します。"
        action={<Pill label={formatCount(snapshot.completedRunCount)} tone="slate" />}
      >
        {snapshot.completedRunCount === null ? (
          <BoundaryState
            icon={History}
            title="完了run履歴を読み取れません"
            text="read unavailableを履歴0件へ変換しません。"
          />
        ) : snapshot.recentRuns.length === 0 ? (
          <BoundaryState
            icon={Clock3}
            title="参照中の完了measurement runは0件です"
            text="初回測定待ち、日次対象外、設定不備、障害のどれかは推測しません。"
          />
        ) : (
          <RecentRuns runs={snapshot.recentRuns} />
        )}
      </DataCard>

      <DataCard
        title="測定基盤の接続状況"
        description="この画面で実際に確認できる情報と、後続接続が必要な情報を分けます。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.sources.map((source) => (
            <SourceStatusCard key={source.key} source={source} />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="測定操作"
        description="正式command serviceと権限・対象・最新状態の再検査が接続されるまで、測定状態は変更しません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <PlayCircle className="h-4 w-4" />
            手動測定
          </Button>
          <Button disabled variant="outline">
            <RefreshCw className="h-4 w-4" />
            失敗runを再試行
          </Button>
          <Button disabled variant="outline">
            <ShieldCheck className="h-4 w-4" />
            安全停止
          </Button>
          <Button disabled variant="outline">
            <History className="h-4 w-4" />
            正式な実行履歴
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからDBやworkerへ直接writeする経路は作っていません。Project詳細へのread導線だけを有効にしています。
        </p>
      </DataCard>
    </div>
  );
}

function AttentionQueue({ items }: { items: AdminMeasurementAttentionItem[] }) {
  return (
    <div className="divide-y divide-[#E2EAE8]">
      {items.map((item) => (
        <Link
          key={item.projectSlug}
          href={`/internal/projects/${encodeURIComponent(item.projectSlug)}`}
          className="group flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black text-[#10231F]">{item.projectName}</p>
              <Pill label={item.label} tone={attentionTone(item.kind)} />
              <Pill label={item.measurementStatus} tone={measurementTone(item.measurementStatus)} />
            </div>
            <p className="mt-1 text-xs font-semibold text-[#7A8D87]">{item.brandName}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E716B]">{item.reason}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-[#00796B]">
            Project詳細
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function ProjectMeasurementTable({
  projects
}: {
  projects: AdminMeasurementProjectItem[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0E9E6] bg-white">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_110px_128px_82px_minmax(150px,1fr)_100px_90px] gap-3 border-b border-[#E6EEEC] bg-[#F8FBFA] px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#7A8D87] xl:grid">
        <span>Project</span>
        <span>測定</span>
        <span>最新完了</span>
        <span>参照Run</span>
        <span>最新run内容</span>
        <span>集計</span>
        <span>操作</span>
      </div>
      <div className="divide-y divide-[#E6EEEC]">
        {projects.map((project) => (
          <div
            key={project.projectSlug}
            className="grid gap-3 px-4 py-4 xl:grid-cols-[minmax(0,1.4fr)_110px_128px_82px_minmax(150px,1fr)_100px_90px] xl:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
              <p className="mt-1 truncate text-xs font-bold text-[#516962]">{project.brandName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#899792]">{project.targetUrl}</p>
            </div>
            <ResponsiveValue label="測定">
              <Pill
                label={project.measurementStatus}
                tone={measurementTone(project.measurementStatus)}
              />
            </ResponsiveValue>
            <ResponsiveValue label="最新完了">
              <span className="text-xs font-bold leading-5 text-[#4E625C]">
                {formatDateTime(project.latestCompletedAt)}
              </span>
            </ResponsiveValue>
            <ResponsiveValue label="参照run">
              <span className="text-sm font-black text-[#243832]">{project.completedRunCount}件</span>
            </ResponsiveValue>
            <ResponsiveValue label="最新run内容">
              {project.latestCompletedRun ? (
                <div className="text-xs font-semibold leading-5 text-[#5E716B]">
                  <p>{project.latestCompletedRun.promptCount} prompts / {project.latestCompletedRun.aiConversationCount} answers</p>
                  <p className="truncate text-[#899792]">{project.latestCompletedRun.searchMode ?? "search mode未設定"}</p>
                </div>
              ) : (
                <span className="text-xs font-bold text-[#899792]">完了runなし</span>
              )}
            </ResponsiveValue>
            <ResponsiveValue label="集計">
              <Pill label={project.aggregateStatus} tone={aggregateTone(project.aggregateStatus)} />
            </ResponsiveValue>
            <Button asChild size="sm" variant="outline" className="w-full xl:w-auto">
              <Link href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}>
                詳細
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentRuns({ runs }: { runs: AdminMeasurementRecentRun[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {runs.map((run) => (
        <Link
          key={`${run.projectSlug}:${run.runId}`}
          href={`/internal/projects/${encodeURIComponent(run.projectSlug)}`}
          className="group rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4 transition-all hover:-translate-y-0.5 hover:border-[#A9CDC3] hover:bg-[#F5FBF9] hover:shadow-[0_10px_24px_rgba(15,23,42,.06)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">{run.projectName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#748680]">{run.brandName}</p>
            </div>
            <Pill label={formatDateTime(run.completedAt)} tone="green" />
          </div>
          <p className="mt-4 break-all font-mono text-[11px] font-bold leading-5 text-[#71827D]">
            {run.runId}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Mini label="Prompts" value={String(run.promptCount)} />
            <Mini label="Answers" value={String(run.aiConversationCount)} />
            <Mini label="Search" value={run.searchMode ?? "—"} />
            <Mini label="Profile" value={shortId(run.measurementProfileId)} />
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[#00796B]">
            Project詳細
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function SourceStatusCard({ source }: { source: AdminMeasurementSourceStatus }) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#58736B] shadow-sm">
          <Database className="h-4 w-4" />
        </span>
        <Pill
          label={sourceStateLabel(source.state)}
          tone={source.state === "connected" ? "green" : "slate"}
        />
      </div>
      <p className="mt-4 text-sm font-black text-[#243832]">{source.label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#7A8D87]">{source.note}</p>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  note,
  icon: Icon,
  state,
  tone = "slate"
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  state: AdminMeasurementSourceState;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#697B75]">{label}</p>
        <span className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          tone === "green"
            ? "bg-emerald-50 text-emerald-700"
            : tone === "amber"
              ? "bg-amber-50 text-amber-700"
              : tone === "red"
                ? "bg-red-50 text-red-700"
                : "bg-[#EDF4F2] text-[#527068]"
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">{note}</p>
      <div className="mt-3">
        <Pill
          label={sourceStateLabel(state)}
          tone={state === "connected" ? "green" : "slate"}
        />
      </div>
    </div>
  );
}

function BoundaryState({
  icon: Icon,
  title,
  text,
  positive = false
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  positive?: boolean;
}) {
  return (
    <div className={cn(
      "flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center",
      positive
        ? "border-emerald-200 bg-emerald-50/60"
        : "border-[#CBD9D5] bg-[#F7FAF9]"
    )}>
      <Icon className={cn("h-7 w-7", positive ? "text-emerald-600" : "text-[#70847E]")} />
      <p className={cn("mt-3 text-sm font-black", positive ? "text-emerald-900" : "text-[#334A44]")}>
        {title}
      </p>
      <p className={cn(
        "mt-1 max-w-2xl text-xs font-semibold leading-5",
        positive ? "text-emerald-700" : "text-[#7A8D87]"
      )}>
        {text}
      </p>
    </div>
  );
}

function ResponsiveValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 xl:block">
      <span className="text-xs font-bold text-[#7A8D87] xl:hidden">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F1F6F4] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[#334A44]">{value}</p>
    </div>
  );
}

type Tone = "green" | "amber" | "red" | "slate";

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        tone === "green"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : tone === "red"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {label}
    </Badge>
  );
}

function SourcePill({ source }: { source: AdminMeasurementSourceStatus }) {
  return (
    <Pill
      label={sourceStateLabel(source.state)}
      tone={source.state === "connected" ? "green" : "slate"}
    />
  );
}

function getSource(
  snapshot: AdminMeasurementManagementSnapshot,
  key: AdminMeasurementSourceKey
) {
  return snapshot.sources.find((source) => source.key === key) ?? {
    key,
    label: key,
    state: "not_connected" as const,
    note: "source定義を確認できません"
  };
}

function sourceStateLabel(state: AdminMeasurementSourceState) {
  if (state === "connected") return "接続済み";
  if (state === "compatibility") return "互換read";
  return "未接続";
}

function metricSourceNote(source: AdminMeasurementSourceStatus) {
  return source.state === "not_connected" ? "readを取得できません" : source.note;
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}

function formatDateTime(value: string | null) {
  if (!value) return "日時未設定";
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

function shortId(value: string | null) {
  if (!value) return "—";
  return value.length > 16 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
}

function attentionSummaryTone(snapshot: AdminMeasurementManagementSnapshot): Tone {
  if ((snapshot.failedProjectCount ?? 0) > 0) return "red";
  if ((snapshot.runningProjectCount ?? 0) > 0) return "amber";
  return snapshot.attentionQueue.length > 0 ? "slate" : "green";
}

function attentionTone(kind: AdminMeasurementAttentionItem["kind"]): Tone {
  if (kind === "failed") return "red";
  if (kind === "running") return "amber";
  return "slate";
}

function measurementTone(status: string): Tone {
  if (status === "失敗") return "red";
  if (status === "計測中") return "amber";
  if (status === "設定済み") return "green";
  return "slate";
}

function aggregateTone(status: string): Tone {
  if (status === "失敗") return "red";
  if (status === "設定済み") return "green";
  if (status === "集計待ち" || status === "レポート準備中") return "amber";
  return "slate";
}
