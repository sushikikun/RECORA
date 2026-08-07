import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Database,
  Eye,
  FileCheck2,
  History,
  Layers3,
  RefreshCw,
  RotateCcw,
  Send,
  Truck,
  XCircle
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminPublicationManagementSnapshot,
  AdminPublicationProjectItem,
  AdminPublicationSourceKey,
  AdminPublicationSourceState,
  AdminPublicationSourceStatus
} from "@/lib/recora/admin-publication-management";
import type { RecoraPhase1AdminStatus } from "@/lib/recora/phase1-admin-plan";
import { cn } from "@/lib/utils";

export function AdminPublicationManagementPage({
  snapshot,
  loadError
}: {
  snapshot: AdminPublicationManagementSnapshot;
  loadError?: string | null;
}) {
  const projectSource = getSource(snapshot, "projects");
  const reportReadySource = getSource(snapshot, "reportReady");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Publication Operations"
        title="公開管理"
        description="公開gate通過、正式な公開版、現在の公開先、配信確認を分け、運営者が公開前後の状態を誤認しないように整理します。"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/internal/projects">
                全Projectを見る
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Pill label="Read only" tone="green" />
            <Pill label="report-ready互換" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
            <Send className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">公開可能と公開済みを分けて扱います</p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              `customer_ready`は顧客表示gateを通過した状態です。正式publication version、現在公開中の版、配信成功、顧客閲覧確認を意味しません。
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
          label="参照中Project"
          value={formatCount(snapshot.projectCount)}
          note={metricSourceNote(projectSource)}
          icon={Layers3}
          state={projectSource.state}
        />
        <SummaryMetric
          label="公開gate通過"
          value={formatCount(snapshot.readyProjectCount)}
          note="公開済み件数ではありません"
          icon={CheckCircle2}
          state={reportReadySource.state}
          tone={
            snapshot.readyProjectCount !== null && snapshot.readyProjectCount > 0
              ? "green"
              : "slate"
          }
        />
        <SummaryMetric
          label="公開準備中"
          value={formatCount(snapshot.notReadyProjectCount)}
          note="参照中Projectのnot_ready"
          icon={FileCheck2}
          state={reportReadySource.state}
          tone={
            snapshot.notReadyProjectCount !== null && snapshot.notReadyProjectCount > 0
              ? "amber"
              : "green"
          }
        />
        <SummaryMetric
          label="公開準備ブロッカー"
          value={formatCount(snapshot.blockerCount)}
          note="diagnostic noteは含めません"
          icon={CircleAlert}
          state={reportReadySource.state}
          tone={
            snapshot.blockerCount !== null && snapshot.blockerCount > 0
              ? "amber"
              : "green"
          }
        />
      </div>

      <DataCard
        title="公開候補の確認"
        description="顧客表示gateを通過したProjectです。正式candidate・version・公開状態はまだ未接続です。"
        action={
          snapshot.readyProjectCount === null ? (
            <Pill label="read unavailable" tone="slate" />
          ) : (
            <Pill
              label={`${snapshot.readyQueue.length} Project`}
              tone={snapshot.readyQueue.length > 0 ? "green" : "slate"}
            />
          )
        }
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="公開準備情報を読み取れません"
            text="取得失敗を候補0件や未公開として扱いません。"
          />
        ) : snapshot.projectCount === 0 ? (
          <BoundaryState
            icon={Layers3}
            title="参照中Projectは0件です"
            text="既存Project readの最新50件枠で取得できる対象がありません。"
            positive
          />
        ) : snapshot.readyQueue.length === 0 ? (
          <BoundaryState
            icon={FileCheck2}
            title="参照中Projectに公開gate通過はありません"
            text="正式publication candidate readは未接続のため、候補が存在しないとは断定しません。"
          />
        ) : (
          <ReadyQueue items={snapshot.readyQueue} />
        )}
      </DataCard>

      <DataCard
        title="公開準備中"
        description="report-ready blockerを持つProjectです。診断ノートはblockerへ合算しません。"
        action={
          snapshot.notReadyProjectCount === null ? (
            <Pill label="read unavailable" tone="slate" />
          ) : (
            <Pill
              label={`${snapshot.blockedQueue.length} Project`}
              tone={snapshot.blockedQueue.length > 0 ? "amber" : "green"}
            />
          )
        }
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="公開準備中の対象を読み取れません"
            text="read unavailableを0件や問題なしへ変換しません。"
          />
        ) : snapshot.blockedQueue.length === 0 ? (
          <BoundaryState
            icon={CheckCircle2}
            title="参照中の公開準備ブロッカーはありません"
            text="formal publication、delivery、customer access verificationは未接続のため、公開運用全体が正常とは断定しません。"
            positive
          />
        ) : (
          <BlockedQueue items={snapshot.blockedQueue} />
        )}
      </DataCard>

      <DataCard
        title="Project別 公開準備状況"
        description="gate、根拠run、観測値、blocker、diagnostic、正式公開状態、配信状態を別々に表示します。"
        action={<Pill label="最新50 Project枠" tone="slate" />}
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="Project別公開準備状況を読み取れません"
            text="read接続が復旧するまで件数や状態を生成しません。"
          />
        ) : snapshot.projects.length === 0 ? (
          <BoundaryState
            icon={Layers3}
            title="表示対象のProjectは0件です"
            text="現在のProject compatibility readの結果です。"
            positive
          />
        ) : (
          <ProjectPublicationGrid projects={snapshot.projects} />
        )}
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <DataCard
          title="公開基盤の接続状況"
          description="現在の互換readと、後続で正式接続するpublication情報を分けます。"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.sources.map((source) => (
              <SourceStatusCard key={source.key} source={source} />
            ))}
          </div>
        </DataCard>

        <DataCard
          title="状態の読み方"
          description="運営者が誤って公開済みと判断しないための境界です。"
        >
          <div className="space-y-3">
            <Guidance
              icon={CheckCircle2}
              title="公開gate通過"
              text="顧客表示条件を通過しています。正式versionの作成・公開・配信確認は別工程です。"
            />
            <Guidance
              icon={History}
              title="Current publication"
              text="現在公開中の版を示すpointerです。V1では未接続です。"
            />
            <Guidance
              icon={Truck}
              title="Delivery verification"
              text="公開先への反映や顧客閲覧を確認する状態です。V1では未接続です。"
            />
          </div>
        </DataCard>
      </div>

      <DataCard
        title="公開操作"
        description="正式command serviceと権限・candidate・current pointer・最新状態の再検査が接続されるまで、公開状態を変更しません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <Send className="h-4 w-4" />
            公開
          </Button>
          <Button disabled variant="outline">
            <RefreshCw className="h-4 w-4" />
            再公開
          </Button>
          <Button disabled variant="outline">
            <XCircle className="h-4 w-4" />
            公開取消
          </Button>
          <Button disabled variant="outline">
            <RotateCcw className="h-4 w-4" />
            以前の版へ復元
          </Button>
          <Button disabled variant="outline">
            <Truck className="h-4 w-4" />
            配信再確認
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからDBや配信先へ直接writeする経路は作っていません。既存reportとProject詳細へのread導線だけを有効にしています。
        </p>
      </DataCard>
    </div>
  );
}

function ReadyQueue({ items }: { items: AdminPublicationProjectItem[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.projectSlug}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">{item.projectName}</p>
              <p className="mt-1 truncate text-xs font-bold text-[#527068]">{item.brandName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#899792]">{item.targetUrl}</p>
            </div>
            <Pill label="公開gate通過" tone="green" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Mini label="Aggregate run" value={formatIdentifier(item.currentAggregateRunId)} />
            <Mini label="Source measurement" value={formatIdentifier(item.currentSourceMeasurementRunId)} />
            <Mini label="Metric snapshots" value={`${item.metricSnapshotCount}件`} />
            <Mini label="Valid observations" value={`${item.validObservationCount}件`} />
            <Mini label="Formal publication" value="未接続" muted />
            <Mini label="Delivery" value="未接続" muted />
          </div>

          {item.diagnosticNoteCount > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold leading-5 text-[#647872]">
              診断ノート {item.diagnosticNoteCount}件。公開gate blockerには含まれていません。
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={item.reportUrl}>
                <Eye className="h-4 w-4" />
                レポート確認
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/internal/projects/${encodeURIComponent(item.projectSlug)}`}>
                Project詳細
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockedQueue({ items }: { items: AdminPublicationProjectItem[] }) {
  return (
    <div className="divide-y divide-[#E2EAE8]">
      {items.map((item) => (
        <div
          key={item.projectSlug}
          className="grid gap-4 py-5 first:pt-0 last:pb-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,.95fr)_auto] xl:items-start"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black text-[#10231F]">{item.projectName}</p>
              <Pill label={`${item.blockerCount} blocker`} tone="amber" />
              <Pill label="公開準備中" tone="slate" />
            </div>
            <p className="mt-1 truncate text-xs font-bold text-[#527068]">{item.brandName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill label={`測定: ${item.measurementStatus}`} tone={statusTone(item.measurementStatus)} />
              <Pill label={`集計: ${item.aggregateStatus}`} tone={statusTone(item.aggregateStatus)} />
              <Pill label={`診断: ${item.diagnosticNoteCount}件`} tone="slate" />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-black text-amber-900">先頭のblocker</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900/80">
              {item.blockers[0]?.message ?? "blocker理由を取得できません。"}
            </p>
          </div>

          <Button asChild size="sm" variant="outline">
            <Link href={`/internal/projects/${encodeURIComponent(item.projectSlug)}`}>
              Project詳細
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

function ProjectPublicationGrid({
  projects
}: {
  projects: AdminPublicationProjectItem[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {projects.map((project) => (
        <div
          key={project.projectSlug}
          className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
              <p className="mt-1 truncate text-xs font-bold text-[#527068]">{project.brandName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#899792]">{project.projectSlug}</p>
            </div>
            <Pill
              label={project.reportReadyStatus === "customer_ready" ? "公開gate通過" : "公開準備中"}
              tone={project.reportReadyStatus === "customer_ready" ? "green" : "amber"}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Mini label="Measurement" value={project.measurementStatus} />
            <Mini label="Aggregate" value={project.aggregateStatus} />
            <Mini label="Aggregate run" value={formatIdentifier(project.currentAggregateRunId)} />
            <Mini label="Source measurement" value={formatIdentifier(project.currentSourceMeasurementRunId)} />
            <Mini label="Metric snapshots" value={`${project.metricSnapshotCount}件`} />
            <Mini label="Valid observations" value={`${project.validObservationCount}件`} />
            <Mini label="Blocker / diagnostic" value={`${project.blockerCount} / ${project.diagnosticNoteCount}`} />
            <Mini label="Formal publication / delivery" value="未接続 / 未接続" muted />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={project.reportUrl}>
                <Eye className="h-4 w-4" />
                レポート確認
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}>
                Project詳細
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
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
  state: AdminPublicationSourceState;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#697B75]">{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            tone === "green"
              ? "bg-emerald-50 text-emerald-700"
              : tone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-[#EDF4F2] text-[#527068]"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">{note}</p>
      <div className="mt-3">
        <Pill label={sourceStateLabel(state)} tone={state === "connected" ? "green" : "slate"} />
      </div>
    </div>
  );
}

function SourceStatusCard({ source }: { source: AdminPublicationSourceStatus }) {
  return (
    <div className="rounded-xl border border-[#E0E9E6] bg-[#FCFEFD] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#243832]">{source.label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#7A8D87]">{source.note}</p>
        </div>
        <Pill
          label={sourceStateLabel(source.state)}
          tone={source.state === "connected" ? "green" : "slate"}
        />
      </div>
    </div>
  );
}

function Guidance({
  icon: Icon,
  title,
  text
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-black text-[#243832]">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#748680]">{text}</p>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  muted = false
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-xl px-3 py-2", muted ? "bg-slate-100" : "bg-[#F1F6F4]")}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">{label}</p>
      <p className={cn("mt-1 truncate text-xs font-black", muted ? "text-slate-500" : "text-[#334A44]")}>
        {value}
      </p>
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
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center",
        positive
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-[#CBD9D5] bg-[#F7FAF9]"
      )}
    >
      <Icon className={cn("h-7 w-7", positive ? "text-emerald-600" : "text-[#70847E]")} />
      <p className={cn("mt-3 text-sm font-black", positive ? "text-emerald-900" : "text-[#334A44]")}>
        {title}
      </p>
      <p className={cn("mt-1 max-w-xl text-xs font-semibold leading-5", positive ? "text-emerald-700" : "text-[#7A8D87]")}>
        {text}
      </p>
    </div>
  );
}

type Tone = "green" | "amber" | "slate";

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
            : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {label}
    </Badge>
  );
}

function getSource(
  snapshot: AdminPublicationManagementSnapshot,
  key: AdminPublicationSourceKey
) {
  return (
    snapshot.sources.find((source) => source.key === key) ?? {
      key,
      label: key,
      state: "not_connected" as const,
      note: "source statusを取得できません"
    }
  );
}

function sourceStateLabel(state: AdminPublicationSourceState) {
  if (state === "connected") return "接続済み";
  if (state === "compatibility") return "互換read";
  return "未接続";
}

function metricSourceNote(source: AdminPublicationSourceStatus) {
  return source.state === "not_connected" ? "read model未接続" : source.note;
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}

function formatIdentifier(value: string | null) {
  if (!value) return "取得なし";
  return value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function statusTone(status: RecoraPhase1AdminStatus): Tone {
  if (status === "失敗") return "amber";
  if (status === "設定済み" || status === "公開可能") return "green";
  return "slate";
}
