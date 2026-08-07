import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  FileCheck2,
  History,
  Layers3,
  RefreshCw,
  Send,
  ShieldCheck
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminPublicationManagementSnapshot,
  AdminPublicationProjectItem,
  AdminPublicationReadinessItem,
  AdminPublicationSourceKey,
  AdminPublicationSourceState,
  AdminPublicationSourceStatus
} from "@/lib/recora/admin-publication-management";
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
  const candidateSource = getSource(snapshot, "candidates");
  const versionSource = getSource(snapshot, "versions");
  const pointerSource = getSource(snapshot, "currentPointer");
  const deliverySource = getSource(snapshot, "delivery");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Publication Operations"
        title="公開管理"
        description="公開準備、公開候補、公開版、現在公開中のpointer、配信確認を別責任として管理します。"
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
            <Send className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">公開準備と公開済みを混同しない運用画面です</p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              `customer_ready`は候補生成の前提を満たすことだけを意味します。候補生成済み、公開済み、配信確認済みは正式readが接続されるまで推測しません。
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
          label="公開準備完了"
          value={formatCount(snapshot.readyProjectCount)}
          note="候補生成済み・公開済みを意味しません"
          icon={CheckCircle2}
          state={reportReadySource.state}
          tone={
            snapshot.readyProjectCount !== null && snapshot.readyProjectCount > 0
              ? "green"
              : "slate"
          }
        />
        <SummaryMetric
          label="公開準備未完了"
          value={formatCount(snapshot.notReadyProjectCount)}
          note="公開失敗・品質事故とは扱いません"
          icon={Clock3}
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
          note="publication failure件数ではありません"
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
        title="公開フローの境界"
        description="前段が確認できても、後段の候補生成・公開・配信完了を推測しません。"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FlowStage
            number="01"
            title="Source / Aggregate"
            text="測定元と集計状態を確認"
            state={projectSource.state}
            icon={Activity}
          />
          <FlowStage
            number="02"
            title="Report-ready"
            text="候補生成前提の判定"
            state={reportReadySource.state}
            icon={ShieldCheck}
          />
          <FlowStage
            number="03"
            title="Candidate"
            text="候補ID・lifecycle"
            state={candidateSource.state}
            icon={FileCheck2}
          />
          <FlowStage
            number="04"
            title="Version / Pointer"
            text="公開版と現在公開中"
            state={combineStates(versionSource.state, pointerSource.state)}
            icon={History}
          />
          <FlowStage
            number="05"
            title="Delivery"
            text="配信状態と表示確認"
            state={deliverySource.state}
            icon={Send}
          />
        </div>
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <DataCard
          title="候補生成の前提を満たすProject"
          description="`customer_ready`のProjectです。候補生成済み・公開済みではありません。"
          action={
            snapshot.readyProjectCount === null ? (
              <Pill label="read unavailable" tone="slate" />
            ) : (
              <Pill label={`${snapshot.readyProjects.length} Project`} tone="green" />
            )
          }
        >
          {snapshot.projectCount === null ? (
            <BoundaryState
              icon={Database}
              title="公開準備判定を読み取れません"
              text="取得失敗を0件や未公開として扱いません。"
            />
          ) : snapshot.readyProjects.length === 0 ? (
            <BoundaryState
              icon={Clock3}
              title="参照中Projectにcustomer_readyはありません"
              text="候補・公開版readは未接続のため、公開対象が0件とは断定しません。"
            />
          ) : (
            <ReadyProjects items={snapshot.readyProjects} />
          )}
        </DataCard>

        <DataCard
          title="上流確認が必要なProject"
          description="`not_ready`を公開失敗と呼ばず、既存blockerをそのまま表示します。"
          action={
            snapshot.notReadyProjectCount === null ? (
              <Pill label="read unavailable" tone="slate" />
            ) : (
              <Pill
                label={`${snapshot.blockedProjects.length} Project`}
                tone={snapshot.blockedProjects.length > 0 ? "amber" : "green"}
              />
            )
          }
        >
          {snapshot.projectCount === null ? (
            <BoundaryState
              icon={Database}
              title="上流確認対象を読み取れません"
              text="read unavailableを問題なしへ変換しません。"
            />
          ) : snapshot.blockedProjects.length === 0 ? (
            <BoundaryState
              icon={CheckCircle2}
              title="参照中Projectにnot_readyはありません"
              text="candidate、current publication、deliveryは未接続のため、公開基盤全体が正常とは断定しません。"
              positive
            />
          ) : (
            <BlockedProjects items={snapshot.blockedProjects} />
          )}
        </DataCard>
      </div>

      <DataCard
        title="Project別 公開状態"
        description="measurement、aggregate、report-readyと、未接続のcandidate・current publication・deliveryを別々に表示します。"
        action={<Pill label="最新50 Project枠" tone="slate" />}
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="Project別公開状況を読み取れません"
            text="取得失敗を0件へ変換しません。"
          />
        ) : snapshot.projects.length === 0 ? (
          <BoundaryState
            icon={Layers3}
            title="参照中Projectは0件です"
            text="既存Project compatibility readの結果です。"
            positive
          />
        ) : (
          <ProjectPublicationGrid projects={snapshot.projects} />
        )}
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-3">
        <DataCard
          title="公開候補"
          description="M12/M13のcandidate read接続先です。"
          action={<SourcePill source={candidateSource} />}
        >
          <BoundaryState
            icon={FileCheck2}
            title="Publication candidate readは未接続です"
            text="候補0件、候補生成待ち、品質判定待ちのいずれかを推測しません。"
          />
        </DataCard>

        <DataCard
          title="現在公開中"
          description="M14のversion / current pointer read接続先です。"
          action={<SourcePill source={pointerSource} />}
        >
          <BoundaryState
            icon={History}
            title="Current publication pointerは未接続です"
            text="既存report URLを正式な公開版や現在公開中pointerの証拠として扱いません。"
          />
        </DataCard>

        <DataCard
          title="配信確認"
          description="M14/M15のdelivery verification read接続先です。"
          action={<SourcePill source={deliverySource} />}
        >
          <BoundaryState
            icon={Send}
            title="Delivery verificationは未接続です"
            text="配信先、配信成功、顧客表示確認を生成しません。"
          />
        </DataCard>
      </div>

      <DataCard
        title="公開基盤の接続状況"
        description="現在の互換readと、後続で正式接続する公開責任を分けます。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {snapshot.sources.map((source) => (
            <SourceStatusCard key={source.key} source={source} />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="公開操作"
        description="正式command serviceと権限・対象・最新状態の再検査が接続されるまで、公開状態は変更しません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <FileCheck2 className="h-4 w-4" />
            公開候補を生成
          </Button>
          <Button disabled variant="outline">
            <Send className="h-4 w-4" />
            公開
          </Button>
          <Button disabled variant="outline">
            <RefreshCw className="h-4 w-4" />
            Rollback
          </Button>
          <Button disabled variant="outline">
            <Activity className="h-4 w-4" />
            再配信
          </Button>
          <Button disabled variant="outline">
            <ShieldCheck className="h-4 w-4" />
            配信を検証
          </Button>
          <Button disabled variant="outline">
            <History className="h-4 w-4" />
            公開履歴
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからDBや配信先へ直接writeする経路は作っていません。Project詳細と品質・例外レビューへのread導線だけを有効にしています。
        </p>
      </DataCard>
    </div>
  );
}

function ReadyProjects({ items }: { items: AdminPublicationReadinessItem[] }) {
  return (
    <div className="divide-y divide-[#E2EAE8]">
      {items.map((item) => (
        <div key={item.projectSlug} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-black text-[#10231F]">{item.projectName}</p>
                <Pill label="候補生成前提のみ" tone="green" />
              </div>
              <p className="mt-1 truncate text-xs font-bold text-[#5B716A]">{item.brandName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#8A9894]">{item.targetUrl}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href={`/internal/projects/${encodeURIComponent(item.projectSlug)}`}>
                Project詳細
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Mini label="測定" value={item.measurementStatus} />
            <Mini label="集計" value={item.aggregateStatus} />
            <Mini label="Metric snapshots" value={`${item.metricSnapshotCount}件`} />
            <Mini label="Valid observations" value={`${item.validObservationCount}件`} />
          </div>
          <p className="mt-3 text-xs font-semibold text-[#7A8D87]">Publication candidate: 未接続</p>
        </div>
      ))}
    </div>
  );
}

function BlockedProjects({ items }: { items: AdminPublicationReadinessItem[] }) {
  return (
    <div className="divide-y divide-[#E2EAE8]">
      {items.map((item) => (
        <div key={item.projectSlug} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-black text-[#10231F]">{item.projectName}</p>
                <Pill
                  label={item.blockerCount > 0 ? `${item.blockerCount} blocker` : "not_ready / blockerなし"}
                  tone={item.blockerCount > 0 ? "amber" : "slate"}
                />
              </div>
              <p className="mt-1 truncate text-xs font-bold text-[#5B716A]">{item.brandName}</p>
              <p className="mt-1 text-xs font-semibold text-[#8A9894]">診断ノート {item.diagnosticNoteCount}件</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/internal/quality">品質レビュー</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/internal/projects/${encodeURIComponent(item.projectSlug)}`}>
                  Project詳細
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          {item.blockers.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {item.blockers.slice(0, 3).map((blocker, index) => (
                <li key={`${item.projectSlug}:${blocker.code}:${index}`} className="flex gap-2 text-xs font-semibold leading-5 text-[#687A74]">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>{blocker.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
              `not_ready`ですが、現在の互換readにblocker理由はありません。理由を推測しません。
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectPublicationGrid({ projects }: { projects: AdminPublicationProjectItem[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {projects.map((project) => (
        <div key={project.projectSlug} className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
              <p className="mt-1 truncate text-xs font-bold text-[#566E67]">{project.brandName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#8A9894]">{project.targetUrl}</p>
            </div>
            <Pill
              label={project.reportReadyStatus === "customer_ready" ? "公開準備完了" : "公開準備未完了"}
              tone={project.reportReadyStatus === "customer_ready" ? "green" : "amber"}
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <Mini label="測定" value={project.measurementStatus} />
            <Mini label="集計" value={project.aggregateStatus} />
            <Mini label="Blocker" value={`${project.blockerCount}件`} />
            <Mini label="Candidate" value="未接続" />
            <Mini label="Current publication" value="未接続" />
            <Mini label="Delivery" value="未接続" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}>
                詳細
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowStage({
  number,
  title,
  text,
  state,
  icon: Icon
}: {
  number: string;
  title: string;
  text: string;
  state: AdminPublicationSourceState;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-black tracking-[0.12em] text-[#8A9995]">{number}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", state === "compatibility" ? "bg-emerald-50 text-emerald-700" : state === "connected" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-sm font-black text-[#20352F]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#758680]">{text}</p>
      <div className="mt-3">
        <Pill label={sourceStateLabel(state)} tone={state === "not_connected" ? "slate" : "green"} />
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
  state: AdminPublicationSourceState;
  tone?: Tone;
}) {
  const effectiveTone = state === "not_connected" ? "slate" : tone;
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#697B75]">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconTone(effectiveTone))}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">{note}</p>
    </div>
  );
}

function SourceStatusCard({ source }: { source: AdminPublicationSourceStatus }) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-[#243832]">{source.label}</p>
        <Pill label={sourceStateLabel(source.state)} tone={source.state === "not_connected" ? "slate" : "green"} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#7A8D87]">{source.note}</p>
    </div>
  );
}

function SourcePill({ source }: { source: AdminPublicationSourceStatus }) {
  return <Pill label={sourceStateLabel(source.state)} tone={source.state === "not_connected" ? "slate" : "green"} />;
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
    <div className={cn("flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center", positive ? "border-emerald-200 bg-emerald-50/60" : "border-[#CBD9D5] bg-[#F7FAF9]")}>
      <Icon className={cn("h-7 w-7", positive ? "text-emerald-600" : "text-[#70847E]")} />
      <p className={cn("mt-3 text-sm font-black", positive ? "text-emerald-900" : "text-[#334A44]")}>{title}</p>
      <p className={cn("mt-1 max-w-md text-xs font-semibold leading-5", positive ? "text-emerald-700" : "text-[#7A8D87]")}>{text}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F1F6F4] px-3 py-2">
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

function getSource(
  snapshot: AdminPublicationManagementSnapshot,
  key: AdminPublicationSourceKey
) {
  return (
    snapshot.sources.find((source) => source.key === key) ?? {
      key,
      label: key,
      state: "not_connected" as const,
      note: "source stateを取得できません"
    }
  );
}

function metricSourceNote(source: AdminPublicationSourceStatus) {
  return source.state === "not_connected" ? "read model未接続" : source.note;
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}

function sourceStateLabel(state: AdminPublicationSourceState) {
  if (state === "connected") return "接続済み";
  if (state === "compatibility") return "互換read";
  return "未接続";
}

function combineStates(
  left: AdminPublicationSourceState,
  right: AdminPublicationSourceState
): AdminPublicationSourceState {
  if (left === "not_connected" || right === "not_connected") return "not_connected";
  if (left === "compatibility" || right === "compatibility") return "compatibility";
  return "connected";
}

function iconTone(tone: Tone) {
  if (tone === "green") return "bg-emerald-50 text-emerald-700";
  if (tone === "amber") return "bg-amber-50 text-amber-700";
  if (tone === "red") return "bg-red-50 text-red-700";
  return "bg-[#EDF4F2] text-[#527068]";
}
