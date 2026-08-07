import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Database,
  FileWarning,
  History,
  Layers3,
  PauseCircle,
  RefreshCw,
  Send,
  ShieldCheck
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminQualityExceptionSnapshot,
  AdminQualityProjectItem,
  AdminQualityReasonSummary,
  AdminQualityReviewItem,
  AdminQualitySourceKey,
  AdminQualitySourceState,
  AdminQualitySourceStatus
} from "@/lib/recora/admin-quality-exception-review";
import type { RecoraPhase1AdminStatus } from "@/lib/recora/phase1-admin-plan";
import { cn } from "@/lib/utils";

export function AdminQualityExceptionReviewPage({
  snapshot,
  loadError
}: {
  snapshot: AdminQualityExceptionSnapshot;
  loadError?: string | null;
}) {
  const projectSource = getSource(snapshot, "projects");
  const reportReadySource = getSource(snapshot, "reportReady");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Quality & Exception Review"
        title="品質・例外レビュー"
        description="正式quality caseを捏造せず、現在取得できる公開準備ブロッカーと診断ノートを、管理者が確認しやすい形に整理します。"
        actions={
          <>
            <Pill label="Read only" tone="green" />
            <Pill label="report-ready互換" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">正式quality case接続前の互換レビュー画面です</p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              report-ready blockerは公開準備を妨げている理由であり、正式quality case、重大障害、severityではありません。診断ノートもblockerと分けて表示します。
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
          label="公開準備ブロック中"
          value={formatCount(snapshot.blockedProjectCount)}
          note="blockerを1件以上持つ参照中Project"
          icon={FileWarning}
          state={reportReadySource.state}
          tone={
            snapshot.blockedProjectCount !== null &&
            snapshot.blockedProjectCount > 0
              ? "amber"
              : "green"
          }
        />
        <SummaryMetric
          label="公開準備ブロッカー"
          value={formatCount(snapshot.blockerCount)}
          note="formal quality case件数ではありません"
          icon={CircleAlert}
          state={reportReadySource.state}
          tone={
            snapshot.blockerCount !== null && snapshot.blockerCount > 0
              ? "amber"
              : "green"
          }
        />
        <SummaryMetric
          label="診断ノート"
          value={formatCount(snapshot.diagnosticNoteCount)}
          note="blockerとは別の補助診断"
          icon={ClipboardList}
          state={reportReadySource.state}
        />
      </div>

      <DataCard
        title="今、確認する公開準備ブロッカー"
        description="blockerありProjectだけを、件数順に表示します。severity・担当者・SLAは生成しません。"
        action={
          snapshot.blockedProjectCount === null ? (
            <Pill label="read unavailable" tone="slate" />
          ) : (
            <Pill
              label={`${snapshot.reviewQueue.length} Project`}
              tone={snapshot.reviewQueue.length > 0 ? "amber" : "green"}
            />
          )
        }
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="公開準備情報を読み取れません"
            text="取得失敗を0件や問題なしとして扱いません。"
          />
        ) : snapshot.projectCount === 0 ? (
          <BoundaryState
            icon={Layers3}
            title="参照中Projectは0件です"
            text="既存Project readの最新50件枠で取得できる対象がありません。"
            positive
          />
        ) : snapshot.reviewQueue.length === 0 ? (
          <BoundaryState
            icon={CheckCircle2}
            title="参照中のreport-ready blockerはありません"
            text="formal quality case、evidence ledger、rule versionは未接続のため、品質基盤全体が正常とは断定しません。"
            positive
          />
        ) : (
          <ReviewQueue items={snapshot.reviewQueue} />
        )}
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <DataCard
          title="理由別サマリー"
          description="blocker codeをそのまま集計し、独自severityへ変換しません。"
          action={<SourcePill source={reportReadySource} />}
        >
          {snapshot.projectCount === null ? (
            <BoundaryState
              icon={Database}
              title="理由別集計を作成できません"
              text="report-ready readが復旧するまで集計しません。"
            />
          ) : snapshot.reasonSummary.length === 0 ? (
            <BoundaryState
              icon={CheckCircle2}
              title="集計対象のblocker codeはありません"
              text="参照中Projectの互換read結果です。"
              positive
            />
          ) : (
            <ReasonSummary items={snapshot.reasonSummary} />
          )}
        </DataCard>

        <DataCard
          title="読み方"
          description="V1で判断できる範囲を固定します。"
        >
          <div className="space-y-3">
            <Guidance
              icon={CircleAlert}
              title="Blocker"
              text="現在の公開準備を妨げている既存gate理由です。正式quality caseやseverityではありません。"
            />
            <Guidance
              icon={ClipboardList}
              title="Diagnostic note"
              text="管理者向けの補助診断です。blocker件数へ合算しません。"
            />
            <Guidance
              icon={ShieldCheck}
              title="Formal quality case"
              text="case ID、lifecycle、rule version、担当、期限を含む正式readは未接続です。"
            />
          </div>
        </DataCard>
      </div>

      <DataCard
        title="Project別 品質・公開準備状況"
        description="measurement、aggregate、report-ready、blocker、診断、観測値を別々に表示します。"
        action={<Pill label="最新50 Project枠" tone="slate" />}
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="Project別状況を読み取れません"
            text="read unavailableを0件へ変換しません。"
          />
        ) : snapshot.projects.length === 0 ? (
          <BoundaryState
            icon={Layers3}
            title="表示対象のProjectは0件です"
            text="現在のProject compatibility readの結果です。"
            positive
          />
        ) : (
          <ProjectQualityGrid projects={snapshot.projects} />
        )}
      </DataCard>

      <DataCard
        title="品質基盤の接続状況"
        description="現在の互換readと、後続で正式接続する領域を分けます。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.sources.map((source) => (
            <SourceStatusCard key={source.key} source={source} />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="品質・例外操作"
        description="正式command serviceと権限・対象・最新状態の再検査が接続されるまで、品質状態や公開可否は変更しません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <RefreshCw className="h-4 w-4" />
            再処理
          </Button>
          <Button disabled variant="outline">
            <CircleAlert className="h-4 w-4" />
            例外を却下
          </Button>
          <Button disabled variant="outline">
            <Send className="h-4 w-4" />
            公開を許可
          </Button>
          <Button disabled variant="outline">
            <PauseCircle className="h-4 w-4" />
            保留
          </Button>
          <Button disabled variant="outline">
            <History className="h-4 w-4" />
            正式case履歴
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからDBへ直接writeする経路は作っていません。Project詳細へのread導線だけを有効にしています。
        </p>
      </DataCard>
    </div>
  );
}

function ReviewQueue({ items }: { items: AdminQualityReviewItem[] }) {
  return (
    <div className="divide-y divide-[#E2EAE8]">
      {items.map((item) => (
        <div
          key={item.projectSlug}
          className="grid gap-4 py-5 first:pt-0 last:pb-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,.85fr)_auto] xl:items-start"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black text-[#10231F]">
                {item.projectName}
              </p>
              <Pill
                label={`${item.blockerCount} blocker`}
                tone="amber"
              />
              <Pill
                label={item.reportReadyStatusLabel}
                tone={
                  item.reportReadyStatus === "customer_ready"
                    ? "green"
                    : "slate"
                }
              />
            </div>
            <p className="mt-1 truncate text-xs font-bold text-[#60736D]">
              {item.brandName} / {item.targetUrl}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Mini label="測定" value={item.measurementStatus} />
              <Mini label="集計" value={item.aggregateStatus} />
              <Mini
                label="Metric snapshots"
                value={`${item.metricSnapshotCount}`}
              />
              <Mini
                label="Valid observations"
                value={`${item.validObservationCount}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            {item.blockers.slice(0, 3).map((blocker, index) => (
              <div
                key={`${item.projectSlug}:${blocker.code}:${index}`}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
              >
                <p className="break-all font-mono text-[10px] font-bold text-amber-700">
                  {blocker.code || "unknown"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-amber-950">
                  {blocker.message}
                </p>
              </div>
            ))}
            {item.blockerCount > 3 ? (
              <p className="text-xs font-bold text-[#7A8D87]">
                ほか {item.blockerCount - 3}件
              </p>
            ) : null}
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

function ReasonSummary({ items }: { items: AdminQualityReasonSummary[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.code}
          className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] px-4 py-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-all font-mono text-[11px] font-black text-[#44625A]">
                {item.code}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#334A44]">
                {item.message}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Pill label={`${item.projectCount} Project`} tone="slate" />
              <Pill label={`${item.occurrenceCount}件`} tone="amber" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectQualityGrid({
  projects
}: {
  projects: AdminQualityProjectItem[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {projects.map((project) => (
        <div
          key={project.projectSlug}
          className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">
                {project.projectName}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-[#60736D]">
                {project.brandName}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-[#8A9995]">
                {project.targetUrl}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}>
                詳細
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <StateMini
              label="測定"
              value={project.measurementStatus}
              tone={statusTone(project.measurementStatus)}
            />
            <StateMini
              label="集計"
              value={project.aggregateStatus}
              tone={statusTone(project.aggregateStatus)}
            />
            <StateMini
              label="公開準備"
              value={project.reportReadyStatusLabel}
              tone={
                project.reportReadyStatus === "customer_ready"
                  ? "green"
                  : "slate"
              }
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="Blocker" value={`${project.blockerCount}件`} />
            <Mini
              label="診断ノート"
              value={`${project.diagnosticNoteCount}件`}
            />
            <Mini
              label="Metric snapshots"
              value={`${project.metricSnapshotCount}`}
            />
            <Mini
              label="Valid observations"
              value={`${project.validObservationCount}`}
            />
          </div>

          <div className="mt-3 rounded-xl bg-[#F1F6F4] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">
              顧客表示可能な改善提案
            </p>
            <p className="mt-1 text-xs font-black text-[#334A44]">
              {project.customerVisibleRecommendationCount === null
                ? "— / 未確認"
                : `${project.customerVisibleRecommendationCount}件`}
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7A8D87]">
              改善提案はplan-optionalであり、quality成立条件として扱いません。
            </p>
          </div>
        </div>
      ))}
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
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#00796B]" />
      <div>
        <p className="text-sm font-black text-[#243832]">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#71837D]">
          {text}
        </p>
      </div>
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
  state: AdminQualitySourceState;
  tone?: Tone;
}) {
  const effectiveTone = state === "not_connected" ? "slate" : tone;

  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#697B75]">{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            effectiveTone === "green"
              ? "bg-emerald-50 text-emerald-700"
              : effectiveTone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-[#EDF4F2] text-[#527068]"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">
        {note}
      </p>
    </div>
  );
}

function SourceStatusCard({ source }: { source: AdminQualitySourceStatus }) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <Database className="h-4 w-4 shrink-0 text-[#6B817A]" />
        <SourcePill source={source} />
      </div>
      <p className="mt-3 text-sm font-black text-[#243832]">{source.label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#7A8D87]">
        {source.note}
      </p>
    </div>
  );
}

function SourcePill({ source }: { source: AdminQualitySourceStatus }) {
  const label =
    source.state === "connected"
      ? "接続済み"
      : source.state === "compatibility"
        ? "互換read"
        : "未接続";

  return (
    <Pill
      label={label}
      tone={source.state === "connected" ? "green" : "slate"}
    />
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
      <Icon
        className={cn(
          "h-7 w-7",
          positive ? "text-emerald-600" : "text-[#70847E]"
        )}
      />
      <p
        className={cn(
          "mt-3 text-sm font-black",
          positive ? "text-emerald-900" : "text-[#334A44]"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-1 max-w-xl text-xs font-semibold leading-5",
          positive ? "text-emerald-700" : "text-[#7A8D87]"
        )}
      >
        {text}
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F1F6F4] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-[#334A44]">
        {value}
      </p>
    </div>
  );
}

function StateMini({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-[#E2EAE8] bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">
        {label}
      </p>
      <div className="mt-1.5">
        <Pill label={value} tone={tone} />
      </div>
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

function statusTone(status: RecoraPhase1AdminStatus): Tone {
  if (status === "失敗") return "amber";
  if (status === "設定済み" || status === "公開可能") return "green";
  return "slate";
}

function getSource(
  snapshot: AdminQualityExceptionSnapshot,
  key: AdminQualitySourceKey
) {
  return (
    snapshot.sources.find((source) => source.key === key) ?? {
      key,
      label: key,
      state: "not_connected" as const,
      note: "source未定義"
    }
  );
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}

function metricSourceNote(source: AdminQualitySourceStatus) {
  if (source.state === "not_connected") return "read model未接続";
  return source.note;
}
