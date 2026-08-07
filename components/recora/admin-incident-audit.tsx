import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  FileClock,
  FileWarning,
  History,
  KeyRound,
  ListChecks,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRound,
  Wrench
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminIncidentAuditSnapshot,
  AdminIncidentAuditSourceKey,
  AdminIncidentAuditSourceState,
  AdminIncidentAuditSourceStatus,
  AdminSystemComponentPlaceholder
} from "@/lib/recora/admin-incident-audit";
import { cn } from "@/lib/utils";

export function AdminIncidentAuditPage({
  snapshot
}: {
  snapshot: AdminIncidentAuditSnapshot;
}) {
  const incidentSource = getSource(snapshot, "incidents");
  const recoverySource = getSource(snapshot, "recovery");
  const auditSource = getSource(snapshot, "audit");
  const healthSource = getSource(snapshot, "systemHealth");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Incident & Audit Operations"
        title="障害・監査"
        description="incident、system health、復旧・解除、管理操作の監査証跡を別責任として確認します。"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/internal/operations">
                実行管理
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Pill label="Read only" tone="green" />
            <Pill label="formal read未接続" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">障害の保存構造と、管理画面readは別です</p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              M02にはappend-only監査の保存契約がありますが、管理画面向けの安全なincident・audit readは未接続です。未接続を「incident 0件」「正常」「監査eventなし」とは表示しません。
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Active incident"
          value={formatCount(snapshot.activeIncidentCount)}
          note="incident lifecycle read未接続"
          icon={Siren}
          state={incidentSource.state}
        />
        <SummaryMetric
          label="影響scope"
          value={formatCount(snapshot.affectedScopeCount)}
          note="organization / Project / component"
          icon={CircleAlert}
          state={incidentSource.state}
        />
        <SummaryMetric
          label="復旧進行中"
          value={formatCount(snapshot.recoveryInProgressCount)}
          note="recovery / verification read未接続"
          icon={Wrench}
          state={recoverySource.state}
        />
        <SummaryMetric
          label="直近監査event"
          value={formatCount(snapshot.recentAuditEventCount)}
          note="append-only audit read未接続"
          icon={History}
          state={auditSource.state}
        />
      </div>

      <DataCard
        title="Active incident queue"
        description="正式incident readへ接続する領域です。測定失敗、品質blocker、公開not_readyからincidentを自動生成しません。"
        action={<SourcePill source={incidentSource} />}
      >
        <BoundaryState
          icon={Siren}
          title="Incident readは未接続です"
          text="active incident、severity、lifecycle、影響範囲、検知・確認・解決・解除時刻、担当者、次の検証を取得できません。空配列をincident 0件とは表示していません。"
        />
      </DataCard>

      <DataCard
        title="System component health"
        description="監視対象componentの設計上の区分だけを表示します。health状態は正式read接続前に推測しません。"
        action={<SourcePill source={healthSource} />}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.components.map((component) => (
            <SystemComponentCard key={component.key} component={component} />
          ))}
        </div>
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]">
        <DataCard
          title="Recovery / clearance"
          description="incidentの存在、復旧作業、検証、解除・再開を別状態として扱います。"
          action={<SourcePill source={recoverySource} />}
        >
          <div className="space-y-3">
            <ProcessStep
              number="01"
              title="Acknowledge"
              text="誰がincidentを確認したか。incident read未接続のため状態は生成しません。"
            />
            <ProcessStep
              number="02"
              title="Recovery plan / execution"
              text="復旧step、変更内容、実行結果。正式recovery read接続後に表示します。"
            />
            <ProcessStep
              number="03"
              title="Verification"
              text="再測定、read確認、配信確認などの検証証跡。完了を推測しません。"
            />
            <ProcessStep
              number="04"
              title="Clearance / reopen"
              text="障害解除と再発時のreopen。resolvedだけでclearance済みとは扱いません。"
            />
          </div>
        </DataCard>

        <DataCard
          title="障害として扱わないもの"
          description="他画面の状態をincidentへ誤変換しないための境界です。"
        >
          <div className="space-y-3">
            <Guidance
              icon={Activity}
              title="Measurement failure"
              text="測定失敗は確認対象ですが、incident宣言されたとは限りません。"
            />
            <Guidance
              icon={ShieldCheck}
              title="Quality blocker"
              text="公開準備を妨げる理由であり、品質事故・重大障害とは限りません。"
            />
            <Guidance
              icon={FileWarning}
              title="Publication not_ready"
              text="公開準備中の状態です。配信障害や公開失敗へ変換しません。"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/internal/measurements">測定管理</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/internal/quality">品質・例外レビュー</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/internal/publication">公開管理</Link>
            </Button>
          </div>
        </DataCard>
      </div>

      <DataCard
        title="Audit timeline"
        description="M02 append-only auditとM22 read modelへ接続する領域です。event本文やsecretを直接表示しません。"
        action={<SourcePill source={auditSource} />}
      >
        <BoundaryState
          icon={History}
          title="監査timeline readは未接続です"
          text="occurred_at、actor、capability、scope、risk class、outcome、correction chainを安全なprojectionから取得できるまで、event 0件とは表示しません。"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FutureField icon={Clock3} label="Occurred at" value="未接続" />
          <FutureField icon={UserRound} label="Actor / capability" value="未接続" />
          <FutureField icon={KeyRound} label="Scope / risk / outcome" value="未接続" />
          <FutureField icon={RotateCcw} label="Correction chain" value="未接続" />
        </div>

        <div className="mt-4 rounded-xl border border-[#DDE7E4] bg-[#F7FAF9] px-4 py-3">
          <p className="text-xs font-black text-[#334A44]">Append-only rule</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#748680]">
            監査eventは編集しません。誤りの訂正は元eventを上書きせず、将来のcorrection eventとして参照関係を残します。raw payload、secret、token、env、DB URLは表示対象外です。
          </p>
        </div>
      </DataCard>

      <DataCard
        title="障害・監査基盤の接続状況"
        description="DB保存構造の存在と、管理画面で利用できるreadを分けて表示します。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.sources.map((source) => (
            <SourceStatusCard key={source.key} source={source} />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="障害・監査操作"
        description="正式command serviceと権限・対象・最新状態の再検査が接続されるまで、incident・recovery・auditを変更しません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <Siren className="h-4 w-4" />
            Incidentを宣言
          </Button>
          <Button disabled variant="outline">
            <CheckCircle2 className="h-4 w-4" />
            Acknowledge
          </Button>
          <Button disabled variant="outline">
            <Wrench className="h-4 w-4" />
            復旧を開始
          </Button>
          <Button disabled variant="outline">
            <ListChecks className="h-4 w-4" />
            Clearance
          </Button>
          <Button disabled variant="outline">
            <RefreshCw className="h-4 w-4" />
            Reopen
          </Button>
          <Button disabled variant="outline">
            <RotateCcw className="h-4 w-4" />
            Correction event
          </Button>
          <Button disabled variant="outline">
            <FileClock className="h-4 w-4" />
            監査CSV
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからprivate audit tableやincident storageへ直接writeする経路は作っていません。
        </p>
      </DataCard>
    </div>
  );
}

function SystemComponentCard({
  component
}: {
  component: AdminSystemComponentPlaceholder;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#647872] shadow-sm">
          <Database className="h-4 w-4" />
        </span>
        <Pill label="状態未接続" tone="slate" />
      </div>
      <p className="mt-4 text-sm font-black text-[#243832]">{component.label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#748680]">{component.description}</p>
      <p className="mt-3 text-[11px] font-bold text-[#899792]">接続予定: {component.expectedSource}</p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  text
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF4F2] text-[11px] font-black text-[#527068]">
        {number}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black text-[#243832]">{title}</p>
          <Pill label="未接続" tone="slate" />
        </div>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#748680]">{text}</p>
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

function FutureField({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
      <div className="flex items-center gap-2 text-[#70847E]">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-black uppercase tracking-[0.07em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-black text-[#334A44]">{value}</p>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF4F2] text-[#527068]">
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

function SourceStatusCard({ source }: { source: AdminIncidentAuditSourceStatus }) {
  return (
    <div className="rounded-xl border border-[#E0E9E6] bg-[#FCFEFD] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#243832]">{source.label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#7A8D87]">{source.note}</p>
        </div>
        <Pill label={sourceStateLabel(source.state)} tone={source.state === "connected" ? "green" : "slate"} />
      </div>
    </div>
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
      <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[#7A8D87]">{text}</p>
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

function SourcePill({ source }: { source: AdminIncidentAuditSourceStatus }) {
  return <Pill label={sourceStateLabel(source.state)} tone={source.state === "connected" ? "green" : "slate"} />;
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
      note: "source statusを取得できません"
    }
  );
}

function sourceStateLabel(state: AdminIncidentAuditSourceState) {
  if (state === "connected") return "接続済み";
  if (state === "compatibility") return "互換read";
  return "未接続";
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}
