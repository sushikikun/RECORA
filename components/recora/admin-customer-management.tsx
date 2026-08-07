import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  Database,
  FileCheck2,
  KeyRound,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminCustomerManagementSnapshot,
  AdminCustomerProjectCompatibilityItem,
  AdminCustomerSourceState,
  AdminCustomerSourceStatus
} from "@/lib/recora/admin-customer-management";
import { cn } from "@/lib/utils";

export function AdminCustomerManagementPage({
  snapshot,
  loadError
}: {
  snapshot: AdminCustomerManagementSnapshot;
  loadError?: string | null;
}) {
  const projectSource = snapshot.sources.find((source) => source.key === "projects");
  const projectReadAvailable = projectSource?.state === "compatibility";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Customer Operations"
        title="顧客管理"
        description="顧客、Project、顧客ユーザー、アクセス、契約、問い合わせを責任ごとに分けて確認します。"
        actions={
          <>
            <Pill label="Read only" tone="green" />
            <Pill label="段階接続" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
            <Database className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163C34]">顧客管理専用のread境界へ移行中です</p>
            <p className="mt-1 text-sm leading-6 text-[#4C6B63]">
              現在は既存Project readだけを互換表示に使用します。顧客数、ユーザー数、アクセス、契約、問い合わせは正式readが接続されるまで推測しません。
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
          label="Project"
          value={formatCount(snapshot.projectCount)}
          note={projectReadAvailable ? "既存compatibility read" : "Project read未接続"}
          icon={Building2}
          state={projectReadAvailable ? "compatibility" : "not_connected"}
        />
        <SummaryMetric
          label="顧客"
          value="—"
          note="M04 / M22 read model未接続"
          icon={UsersRound}
          state="not_connected"
        />
        <SummaryMetric
          label="顧客ユーザー"
          value="—"
          note="P4-B / M22 read model未接続"
          icon={UserRound}
          state="not_connected"
        />
        <SummaryMetric
          label="未対応問い合わせ"
          value="—"
          note="M04 / M22 read model未接続"
          icon={MessageSquareText}
          state="not_connected"
        />
      </div>

      <DataCard
        title="顧客・Project運用一覧"
        description="現時点ではProjectの実データだけを表示します。アクセス・契約状態は別authorityとして扱います。"
        action={<Pill label={projectReadAvailable ? "Project read: 互換接続" : "Project read: 未接続"} tone={projectReadAvailable ? "green" : "slate"} />}
      >
        {snapshot.projectCount === null ? (
          <UnavailableState
            title="Project readを読み取れません"
            text="接続復旧まで、Project件数や状態を0件として扱いません。"
          />
        ) : snapshot.projects.length === 0 ? (
          <UnavailableState
            title="参照できるProjectがありません"
            text="現在のcompatibility readで取得できるProjectは0件です。"
            positive
          />
        ) : (
          <ProjectOperationsTable projects={snapshot.projects} />
        )}
      </DataCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <DataCard
          title="顧客ユーザー・Projectアクセス"
          description="organization membershipとProject accessを別authorityとして扱います。"
          action={<Pill label="M05 / M22" tone="slate" />}
        >
          <UnavailableState
            icon={KeyRound}
            title="正式read modelは未接続です"
            text="membershipだけでProject accessを推測しません。M05の明示grantがread modelへ接続された後に表示します。"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled size="sm">Projectアクセス管理</Button>
            <Button disabled size="sm" variant="outline">顧客ユーザー管理</Button>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
            `customer.access.manage` / `customer_user.manage` の正式command接続後に有効化します。
          </p>
        </DataCard>

        <DataCard
          title="契約・Project利用権限"
          description="契約とProjectごとのservice/access windowを分離して表示する領域です。"
          action={<Pill label="M06 / M22" tone="slate" />}
        >
          <UnavailableState
            icon={FileCheck2}
            title="契約read modelは未接続です"
            text="契約状態、Project entitlement、service start/end、契約終了後6か月のpublished-report-only accessはM06接続後に表示します。"
          />
          <div className="mt-4">
            <Button disabled size="sm" variant="outline">契約・利用権限を管理</Button>
          </div>
        </DataCard>
      </div>

      <DataCard
        title="問い合わせ"
        description="顧客からの問い合わせと内部対応履歴を、Project運用状態とは分けて扱います。"
        action={<Pill label="M04 / M22" tone="slate" />}
      >
        <UnavailableState
          icon={MessageSquareText}
          title="問い合わせread modelは未接続です"
          text="未接続を『問い合わせ0件』とは表示しません。正式read model接続後に未対応・対応中・解決済みを表示します。"
        />
      </DataCard>

      <DataCard
        title="read境界"
        description="この画面が何を実データとして読めるかを明示します。"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.sources.map((source) => (
            <SourceStatus key={source.key} source={source} />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="変更操作"
        description="正式command serviceと権限再検査が接続されるまで、顧客管理から状態変更は行いません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>顧客情報</Button>
          <Button disabled variant="outline">アクセス管理</Button>
          <Button disabled variant="outline">ユーザー管理</Button>
          <Button disabled variant="outline">契約管理</Button>
          <Button disabled variant="outline">Project管理</Button>
          <Button disabled variant="outline">問い合わせ対応</Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからprivate tableへ直接writeする経路は作りません。
        </p>
      </DataCard>
    </div>
  );
}

function ProjectOperationsTable({ projects }: { projects: AdminCustomerProjectCompatibilityItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0E9E6] bg-white">
      <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_110px_120px_110px_110px_28px] gap-3 border-b border-[#E6EEEC] bg-[#F8FBFA] px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#7A8D87] lg:grid">
        <span>Project</span>
        <span>ブランド / URL</span>
        <span>測定</span>
        <span>公開準備</span>
        <span>顧客アクセス</span>
        <span>契約</span>
        <span />
      </div>
      <div className="divide-y divide-[#E6EEEC]">
        {projects.map((project) => (
          <Link
            key={project.projectSlug}
            href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}
            className="group block px-4 py-4 transition-colors hover:bg-[#F7FBFA]"
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_110px_120px_110px_110px_28px] lg:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{project.projectSlug}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#334A44]">{project.brandName}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#82928D]">{project.targetUrl}</p>
              </div>
              <LabeledMobileValue label="測定">
                <Pill label={project.measurementStatus} tone="slate" />
              </LabeledMobileValue>
              <LabeledMobileValue label="公開準備">
                <Pill
                  label={project.reportReadyStatusLabel}
                  tone={project.reportReadyStatus === "customer_ready" ? "green" : "slate"}
                />
              </LabeledMobileValue>
              <LabeledMobileValue label="顧客アクセス">
                <Pill label="未接続" tone="muted" />
              </LabeledMobileValue>
              <LabeledMobileValue label="契約">
                <Pill label="未接続" tone="muted" />
              </LabeledMobileValue>
              <ArrowRight className="hidden h-4 w-4 text-[#00796B] transition-transform group-hover:translate-x-0.5 lg:block" />
            </div>
            <div className="mt-3 flex items-center justify-between lg:hidden">
              <span className="text-xs font-bold text-[#00796B]">Project詳細を開く</span>
              <ArrowRight className="h-4 w-4 text-[#00796B]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LabeledMobileValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 lg:block">
      <span className="text-xs font-bold text-[#7A8D87] lg:hidden">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SourceStatus({ source }: { source: AdminCustomerSourceStatus }) {
  return (
    <div className="rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#223A34]">{source.label}</p>
          <p className="mt-1 text-xs font-semibold text-[#83928D]">{source.authority}</p>
        </div>
        <Pill
          label={source.state === "compatibility" ? "互換read" : "未接続"}
          tone={source.state === "compatibility" ? "green" : "muted"}
        />
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#71837D]">{source.note}</p>
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
  state: AdminCustomerSourceState;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#697B75]">{label}</p>
        <span className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          state === "compatibility" ? "bg-emerald-50 text-emerald-700" : "bg-[#F1F4F3] text-[#788983]"
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">{note}</p>
    </div>
  );
}

function UnavailableState({
  title,
  text,
  icon: Icon = ShieldCheck,
  positive = false
}: {
  title: string;
  text: string;
  icon?: LucideIcon;
  positive?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border px-5 py-5",
      positive ? "border-emerald-100 bg-emerald-50/50" : "border-[#E1E9E7] bg-[#FAFCFB]"
    )}>
      <div className="flex items-start gap-3">
        <span className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          positive ? "bg-white text-emerald-700" : "bg-white text-[#70847E]"
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-sm font-black text-[#223A34]">{title}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#71837D]">{text}</p>
        </div>
      </div>
    </div>
  );
}

type PillTone = "green" | "slate" | "muted";

function Pill({ label, tone }: { label: string; tone: PillTone }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black",
        tone === "green"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : tone === "muted"
            ? "border-dashed border-[#CDD8D5] bg-[#F8FAF9] text-[#7B8B86]"
            : "border-[#D6E0DD] bg-white text-[#62756F]"
      )}
    >
      {label}
    </Badge>
  );
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}
