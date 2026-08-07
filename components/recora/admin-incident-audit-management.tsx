import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  CircleAlert,
  Clock3,
  Database,
  FileCheck2,
  History,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Siren
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminIncidentAuditSnapshot,
  AdminIncidentAuditSourceKey,
  AdminIncidentAuditSourceState,
  AdminIncidentAuditSourceStatus,
  AdminIncidentProjectScopeItem
} from "@/lib/recora/admin-incident-audit-management";
import { cn } from "@/lib/utils";

export function AdminIncidentAuditManagementPage({
  snapshot,
  loadError
}: {
  snapshot: AdminIncidentAuditSnapshot;
  loadError?: string | null;
}) {
  const projectSource = getSource(snapshot, "projects");
  const eventSource = getSource(snapshot, "systemEvents");
  const incidentSource = getSource(snapshot, "incidents");
  const healthSource = getSource(snapshot, "componentHealth");
  const recoverySource = getSource(snapshot, "recoveryClearance");
  const auditSource = getSource(snapshot, "auditLog");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Incident & Audit Operations"
        title="障害・監査"
        description="system event、incident、復旧、解除、component health、append-only監査証跡を別々の責任として確認します。"
        actions={
          <>
            <Pill label="Read only" tone="green" />
            <Pill label="formal read未接続" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
            <Siren className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">
              Projectの運用状態はincident判定ではありません
            </p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              measurement失敗、quality blocker、report-ready未完了を自動的に障害へ変換しません。正式incident・recovery・audit readが接続されるまで、件数・severity・担当・原因・日時は生成しません。
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
          label="未解除incident"
          value={formatCount(snapshot.openIncidentCount)}
          note="formal incident read未接続"
          icon={Siren}
          state={incidentSource.state}
        />
        <SummaryMetric
          label="復旧確認待ち"
          value={formatCount(snapshot.recoveryPendingCount)}
          note="recovery / clearance read未接続"
          icon={RefreshCw}
          state={recoverySource.state}
        />
        <SummaryMetric
          label="監査イベント"
          value={formatCount(snapshot.auditEventCount)}
          note="append-only audit read未接続"
          icon={History}
          state={auditSource.state}
        />
      </div>

      <DataCard
        title="障害対応フローの境界"
        description="event検知、incident宣言、復旧、解除、監査証跡を分離し、前段から後段完了を推測しません。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FlowStage
            number="01"
            title="System event"
            text="component・event lifecycle・検知根拠"
            state={eventSource.state}
            icon={Activity}
          />
          <FlowStage
            number="02"
            title="Incident"
            text="宣言・評価・severity・impact scope"
            state={incidentSource.state}
            icon={Siren}
          />
          <FlowStage
            number="03"
            title="Recovery"
            text="復旧step・実行結果・verification"
            state={recoverySource.state}
            icon={RefreshCw}
          />
          <FlowStage
            number="04"
            title="Clearance"
            text="解除decision・actor・cleared at"
            state={recoverySource.state}
            icon={FileCheck2}
          />
          <FlowStage
            number="05"
            title="Audit evidence"
            text="actor・command・target・receipt・時刻"
            state={auditSource.state}
            icon={History}
          />
        </div>
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <DataCard
          title="未解除incident・影響scope"
          description="M09 / M15 / M22のformal incident read接続先です。"
          action={<SourcePill source={incidentSource} />}
        >
          <BoundaryState
            icon={Siren}
            title="Incident readは未接続です"
            text="incident ID、status、severity、customer / Project impact、owner、opened atを生成しません。未解除incident 0件とは表示しません。"
          />
        </DataCard>

        <DataCard
          title="Component health"
          description="system componentと依存先のhealth read接続先です。"
          action={<SourcePill source={healthSource} />}
        >
          <BoundaryState
            icon={Activity}
            title="Component health readは未接続です"
            text="未接続をhealthy、degraded 0件、問題なしとして扱いません。"
          />
        </DataCard>
      </div>

      <DataCard
        title="復旧・解除"
        description="復旧作業と、運用へ戻してよいというclearance decisionを別責任として扱います。"
        action={<SourcePill source={recoverySource} />}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FutureState
            title="Recovery実行中"
            text="step・実行actor・進捗は未接続"
            icon={RefreshCw}
          />
          <FutureState
            title="Verification待ち"
            text="検証項目・結果・証拠は未接続"
            icon={ShieldCheck}
          />
          <FutureState
            title="Clearance待ち"
            text="解除条件・decision actorは未接続"
            icon={Clock3}
          />
          <FutureState
            title="Cleared"
            text="解除時刻・successor stateは未接続"
            icon={FileCheck2}
          />
        </div>
      </DataCard>

      <DataCard
        title="Project impact scope reference"
        description="最新50 Projectを影響scopeの参照先として表示します。各運用状態をincidentへ変換しません。"
        action={<Pill label="scope lookupのみ" tone="slate" />}
      >
        {snapshot.projectCount === null ? (
          <BoundaryState
            icon={Database}
            title="Project scopeを読み取れません"
            text="取得失敗をProject 0件や影響scopeなしへ変換しません。"
          />
        ) : snapshot.projectScopes.length === 0 ? (
          <BoundaryState
            icon={Layers3}
            title="参照中Projectは0件です"
            text="既存Project compatibility readの結果であり、incident影響なしを意味しません。"
          />
        ) : (
          <ProjectScopeGrid items={snapshot.projectScopes} />
        )}
      </DataCard>

      <DataCard
        title="監査履歴"
        description="M02 / M22のappend-only audit readへ接続する領域です。"
        action={<SourcePill source={auditSource} />}
      >
        <BoundaryState
          icon={History}
          title="Append-only audit readは未接続です"
          text="application logや画面表示履歴から、actor・command・target・occurred at・command receiptを再構成しません。監査イベント0件や問題なしとは表示しません。"
        />
      </DataCard>

      <DataCard
        title="障害・監査基盤の接続状況"
        description="現在のscope参照と、後続で正式接続するsystem event・incident・recovery・audit責任を分けます。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {snapshot.sources.map((source) => (
            <SourceStatusCard key={source.key} source={source} />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="障害・監査操作"
        description="正式command serviceと権限・対象・最新状態の再検査が接続されるまで、障害・復旧・監査状態は変更しません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <Siren className="h-4 w-4" />
            Incidentを宣言
          </Button>
          <Button disabled variant="outline">
            <CircleAlert className="h-4 w-4" />
            Acknowledge
          </Button>
          <Button disabled variant="outline">
            <RefreshCw className="h-4 w-4" />
            復旧を開始
          </Button>
          <Button disabled variant="outline">
            <FileCheck2 className="h-4 w-4" />
            Clearanceを確定
          </Button>
          <Button disabled variant="outline">
            <History className="h-4 w-4" />
            監査noteを追加
          </Button>
          <Button disabled variant="outline">
            <Database className="h-4 w-4" />
            Audit export
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからDB、worker、監査logへ直接writeする経路は作っていません。Project詳細へのread導線だけを有効にしています。
        </p>
      </DataCard>
    </div>
  );
}

function ProjectScopeGrid({
  items
}: {
  items: AdminIncidentProjectScopeItem[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.projectSlug}
          className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">
                {item.projectName}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-[#566E67]">
                {item.brandName}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-[#8A9894]">
                {item.targetUrl}
              </p>
            </div>
            <Pill label="incident未接続" tone="slate" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <Mini label="Measurement" value={item.measurementStatus} />
            <Mini label="Aggregate" value={item.aggregateStatus} />
            <Mini label="Report-ready" value={item.reportReadyStatusLabel} />
            <Mini label="Incident" value="未接続" />
            <Mini label="Audit" value="未接続" />
            <Mini
              label="Organization"
              value={item.organizationId ?? "未設定"}
              mono
            />
          </div>

          <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
            上記のmeasurement・aggregate・report-readyは運用contextであり、incident判定ではありません。
          </p>

          <div className="mt-4 flex justify-end">
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

function FutureState({
  title,
  text,
  icon: Icon
}: {
  title: string;
  text: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
        <Pill label="未接続" tone="slate" />
      </div>
      <p className="mt-4 text-sm font-black text-[#243832]">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#7A8D87]">
        {text}
      </p>
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
  state: AdminIncidentAuditSourceState;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-black tracking-[0.12em] text-[#8A9995]">
          {number}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            state === "not_connected"
              ? "bg-slate-100 text-slate-500"
              : "bg-emerald-50 text-emerald-700"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-sm font-black text-[#20352F]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#758680]">
        {text}
      </p>
      <div className="mt-3">
        <Pill
          label={sourceStateLabel(state)}
          tone={state === "not_connected" ? "slate" : "green"}
        />
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  note,
  icon: Icon,
  state
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  state: AdminIncidentAuditSourceState;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#697B75]">{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            state === "not_connected"
              ? "bg-slate-100 text-slate-500"
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
      <div className="mt-3">
        <Pill
          label={sourceStateLabel(state)}
          tone={state === "not_connected" ? "slate" : "green"}
        />
      </div>
    </div>
  );
}

function SourceStatusCard({
  source
}: {
  source: AdminIncidentAuditSourceStatus;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-[#243832]">{source.label}</p>
        <Pill
          label={sourceStateLabel(source.state)}
          tone={source.state === "not_connected" ? "slate" : "green"}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#7A8D87]">
        {source.note}
      </p>
    </div>
  );
}

function SourcePill({
  source
}: {
  source: AdminIncidentAuditSourceStatus;
}) {
  return (
    <Pill
      label={sourceStateLabel(source.state)}
      tone={source.state === "not_connected" ? "slate" : "green"}
    />
  );
}

function BoundaryState({
  icon: Icon,
  title,
  text
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD9D5] bg-[#F7FAF9] px-5 text-center">
      <Icon className="h-7 w-7 text-[#70847E]" />
      <p className="mt-3 text-sm font-black text-[#334A44]">{title}</p>
      <p className="mt-1 max-w-md text-xs font-semibold leading-5 text-[#7A8D87]">
        {text}
      </p>
    </div>
  );
}

function Mini({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F1F6F4] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-xs font-black text-[#334A44]",
          mono && "font-mono"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function getSource(
  snapshot: AdminIncidentAuditSnapshot,
  key: AdminIncidentAuditSourceKey
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

function metricSourceNote(source: AdminIncidentAuditSourceStatus) {
  return source.state === "not_connected"
    ? "read model未接続"
    : source.note;
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}

function sourceStateLabel(state: AdminIncidentAuditSourceState) {
  if (state === "connected") return "接続済み";
  if (state === "compatibility") return "互換read";
  return "未接続";
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
