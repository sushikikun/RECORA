import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Database,
  FileCheck2,
  History,
  KeyRound,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminCustomerSourceState } from "@/lib/recora/admin-customer-management";
import type {
  AdminCustomerDetailProjectItem,
  AdminCustomerDetailSnapshot,
  AdminCustomerDetailSourceKey,
  AdminCustomerDetailSourceStatus
} from "@/lib/recora/admin-customer-detail";
import { cn } from "@/lib/utils";

const detailSections = [
  { id: "overview", label: "概要" },
  { id: "projects", label: "Projects" },
  { id: "users-access", label: "顧客ユーザー・アクセス" },
  { id: "contract", label: "契約" },
  { id: "inquiries", label: "問い合わせ" },
  { id: "audit", label: "監査履歴" }
] as const;

export function AdminCustomerDetailPage({
  snapshot,
  loadError
}: {
  snapshot: AdminCustomerDetailSnapshot;
  loadError?: string | null;
}) {
  const customerProfileSource = getSource(snapshot, "customerProfile");
  const projectSource = getSource(snapshot, "projects");
  const membershipSource = getSource(snapshot, "memberships");
  const projectAccessSource = getSource(snapshot, "projectAccess");
  const contractSource = getSource(snapshot, "contracts");
  const inquirySource = getSource(snapshot, "inquiries");
  const auditSource = getSource(snapshot, "audit");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Customer Operations"
        title="顧客詳細"
        description="1社の概要、Projects、ユーザー・アクセス、契約、問い合わせ、監査履歴を一つの運用台帳として確認します。"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/internal/customers">
                <ArrowLeft className="h-4 w-4" />
                顧客管理へ
              </Link>
            </Button>
            <Pill label="Read only" tone="green" />
            <Pill label="段階接続" tone="slate" />
          </>
        }
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm">
              <UsersRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#163C34]">
                {snapshot.customer.name ?? "顧客名read未接続"}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#60766F]">Organization ID</p>
              <p className="mt-0.5 break-all font-mono text-xs font-bold text-[#31564D]">
                {snapshot.organizationId || "識別子なし"}
              </p>
            </div>
          </div>
          <div className="max-w-xl rounded-xl border border-[#C7DED8] bg-white/80 px-4 py-3 text-xs font-semibold leading-5 text-[#4F6B64]">
            Organization IDはread scopeの識別子であり、ログインcredentialではありません。顧客名・状態は正式read接続前にProject名から推測しません。
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-900">
          {loadError}
        </div>
      ) : null}

      <nav
        aria-label="顧客詳細のページ内ナビゲーション"
        className="flex flex-wrap gap-2 rounded-2xl border border-[#DDE7E4] bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,.03)]"
      >
        {detailSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-xl px-3 py-2 text-xs font-black text-[#5D716B] transition-colors hover:bg-[#EDF7F4] hover:text-[#006C5F]"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section id="overview" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow="01"
          title="概要"
          description="顧客全体の現在地です。正式readがない値はダッシュや未接続として表示します。"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            label="Project"
            value={formatCount(snapshot.projectCount)}
            note={metricSourceNote(projectSource)}
            icon={Building2}
            state={projectSource.state}
          />
          <SummaryMetric
            label="顧客ユーザー"
            value={formatCount(snapshot.customerUserCount)}
            note={metricSourceNote(membershipSource)}
            icon={UserRound}
            state={membershipSource.state}
          />
          <SummaryMetric
            label="契約状態"
            value={snapshot.contractStatus ?? "—"}
            note={metricSourceNote(contractSource)}
            icon={FileCheck2}
            state={contractSource.state}
          />
          <SummaryMetric
            label="未対応問い合わせ"
            value={formatCount(snapshot.openInquiryCount)}
            note={metricSourceNote(inquirySource)}
            icon={MessageSquareText}
            state={inquirySource.state}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <DataCard
            title="顧客情報"
            description="M04 customer profile / M22 read modelへ接続する領域です。"
            action={<SourcePill source={customerProfileSource} />}
          >
            <DefinitionRows
              rows={[
                { label: "顧客名", value: snapshot.customer.name },
                { label: "顧客状態", value: snapshot.customer.status },
                { label: "主担当者", value: snapshot.customer.primaryContact }
              ]}
            />
            <p className="mt-4 text-xs font-semibold leading-5 text-[#7A8D87]">
              Project名やブランド名を顧客情報の代用品にはしません。
            </p>
          </DataCard>

          <DataCard
            title="データ接続状況"
            description="この顧客詳細が何を実データとして読めるかを明示します。"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {snapshot.sources.map((source) => (
                <SourceStatus key={source.key} source={source} />
              ))}
            </div>
          </DataCard>
        </div>
      </section>

      <section id="projects" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow="02"
          title="Projects"
          description="このorganization IDに一致するProjectだけを、既存compatibility readから表示します。"
        />
        <DataCard
          title="Project運用一覧"
          description="測定・公開準備と、顧客アクセス・契約を別責任として表示します。"
          action={<SourcePill source={projectSource} />}
        >
          {snapshot.projectCount === null ? (
            <BoundaryState
              icon={Building2}
              title="Project readを読み取れません"
              text="接続復旧まで、Project件数や状態を0件として扱いません。"
            />
          ) : snapshot.projects.length === 0 ? (
            <BoundaryState
              icon={Building2}
              title="compatibility read上のProjectは0件です"
              text="顧客profileが未接続のため、この結果だけで顧客自体が存在しないとは判断しません。"
              positive
            />
          ) : (
            <ProjectTable
              projects={snapshot.projects}
              projectAccessState={projectAccessSource.state}
              contractState={contractSource.state}
            />
          )}
        </DataCard>
      </section>

      <section id="users-access" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow="03"
          title="顧客ユーザー・アクセス"
          description="会社への所属と、各Projectを閲覧できる権限を別々に管理します。"
        />
        <div className="grid gap-5 xl:grid-cols-2">
          <DataCard
            title="Organization membership"
            description="顧客ユーザーがこの会社へ所属しているかを確認する領域です。"
            action={<SourcePill source={membershipSource} />}
          >
            <BoundaryState
              icon={UserRound}
              title="顧客ユーザーreadは未接続です"
              text="P4-B / M22接続後に、招待中・有効・停止・失効を正式状態として表示します。"
            />
            <div className="mt-4">
              <Button disabled size="sm" variant="outline">顧客ユーザーを管理</Button>
            </div>
          </DataCard>

          <DataCard
            title="Project access"
            description="所属とは別に、どのProjectを閲覧できるかを確認する領域です。"
            action={<SourcePill source={projectAccessSource} />}
          >
            <BoundaryState
              icon={KeyRound}
              title="Project access readは未接続です"
              text="M05 / M22接続後に、ユーザーごとの明示grantとrevoke履歴を表示します。membershipだけで全Projectアクセスを推測しません。"
            />
            <div className="mt-4">
              <Button disabled size="sm">Projectアクセスを管理</Button>
            </div>
          </DataCard>
        </div>
      </section>

      <section id="contract" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow="04"
          title="契約"
          description="契約そのものとProjectごとのサービス期間・利用権限を分けて確認します。"
        />
        <DataCard
          title="契約・Project利用権限"
          description="M06 / M22の正式readへ接続する領域です。"
          action={<SourcePill source={contractSource} />}
        >
          <BoundaryState
            icon={FileCheck2}
            title="契約read modelは未接続です"
            text="契約状態、Project entitlement、service start/end、契約終了後6か月のpublished-report-only accessは接続後に表示します。"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FutureField label="契約" value="未接続" />
            <FutureField label="Project entitlement" value="未接続" />
            <FutureField label="サービス期間" value="未接続" />
            <FutureField label="終了後アクセス" value="未接続" />
          </div>
          <div className="mt-4">
            <Button disabled size="sm" variant="outline">契約・利用権限を管理</Button>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
            商品プラン名、価格、請求周期、返金条件などの未決事項をこの画面で固定しません。
          </p>
        </DataCard>
      </section>

      <section id="inquiries" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow="05"
          title="問い合わせ"
          description="顧客からの問い合わせと内部対応履歴を、Projectの測定状態とは分けて扱います。"
        />
        <DataCard
          title="問い合わせ一覧"
          description="未対応・対応中・解決済みをM04 / M22の正式readから表示する領域です。"
          action={<SourcePill source={inquirySource} />}
        >
          <BoundaryState
            icon={MessageSquareText}
            title="問い合わせread modelは未接続です"
            text="未接続を『問い合わせ0件』や『問題なし』とは表示しません。"
          />
          <div className="mt-4">
            <Button disabled size="sm" variant="outline">問い合わせを確認・対応</Button>
          </div>
        </DataCard>
      </section>

      <section id="audit" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow="06"
          title="監査履歴"
          description="誰が、いつ、何を、どの顧客・Project scopeへ行ったかを追跡する領域です。"
        />
        <DataCard
          title="顧客scopeの操作履歴"
          description="M02 / M22のappend-only audit readへ接続します。"
          action={<SourcePill source={auditSource} />}
        >
          <BoundaryState
            icon={History}
            title="監査read modelは未接続です"
            text="アクセス付与・取消、契約変更、問い合わせ対応、Project状態変更などの正式な操作証跡は接続後に表示します。"
          />
          <div className="mt-4">
            <Button disabled size="sm" variant="outline">監査履歴を開く</Button>
          </div>
        </DataCard>
      </section>

      <DataCard
        title="変更操作"
        description="正式command serviceと権限再検査が接続されるまで、この顧客詳細から状態変更は行いません。"
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled>顧客情報</Button>
          <Button disabled variant="outline">ユーザー管理</Button>
          <Button disabled variant="outline">アクセス管理</Button>
          <Button disabled variant="outline">契約管理</Button>
          <Button disabled variant="outline">問い合わせ対応</Button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">
          UIからprivate tableへ直接writeする経路は作りません。
        </p>
      </DataCard>
    </div>
  );
}

function ProjectTable({
  projects,
  projectAccessState,
  contractState
}: {
  projects: AdminCustomerDetailProjectItem[];
  projectAccessState: AdminCustomerSourceState;
  contractState: AdminCustomerSourceState;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0E9E6] bg-white">
      <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_110px_120px_110px_110px_90px] gap-3 border-b border-[#E6EEEC] bg-[#F8FBFA] px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#7A8D87] lg:grid">
        <span>Project</span>
        <span>ブランド / URL</span>
        <span>測定</span>
        <span>公開準備</span>
        <span>顧客アクセス</span>
        <span>契約</span>
        <span>操作</span>
      </div>
      <div className="divide-y divide-[#E6EEEC]">
        {projects.map((project) => (
          <div
            key={project.projectSlug}
            className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_110px_120px_110px_110px_90px] lg:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{project.projectSlug}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#334A44]">{project.brandName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#82928D]">{project.targetUrl}</p>
            </div>
            <ResponsiveValue label="測定">
              <Pill label={project.measurementStatus} tone="slate" />
            </ResponsiveValue>
            <ResponsiveValue label="公開準備">
              <Pill
                label={project.reportReadyStatusLabel}
                tone={project.reportReadyStatus === "customer_ready" ? "green" : "slate"}
              />
            </ResponsiveValue>
            <ResponsiveValue label="顧客アクセス">
              <Pill
                label={boundaryValue(project.customerAccessLabel, projectAccessState)}
                tone={boundaryTone(project.customerAccessLabel, projectAccessState)}
              />
            </ResponsiveValue>
            <ResponsiveValue label="契約">
              <Pill
                label={boundaryValue(project.contractAccessLabel, contractState)}
                tone={boundaryTone(project.contractAccessLabel, contractState)}
              />
            </ResponsiveValue>
            <Button asChild size="sm" variant="outline" className="w-full lg:w-auto">
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

function ResponsiveValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 lg:block">
      <span className="text-xs font-bold text-[#7A8D87] lg:hidden">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#E7F4F0] px-2 text-xs font-black text-[#00796B]">
        {eyebrow}
      </span>
      <div>
        <h2 className="text-lg font-black tracking-[-0.02em] text-[#10231F]">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#70827C]">{description}</p>
      </div>
    </div>
  );
}

function DefinitionRows({ rows }: { rows: { label: string; value: string | null }[] }) {
  return (
    <div className="divide-y divide-[#E6EEEC] rounded-xl border border-[#E1E9E7] bg-[#FCFEFD]">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-center">
          <p className="text-xs font-black text-[#7A8D87]">{row.label}</p>
          <p className="text-sm font-black text-[#334A44]">{row.value ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}

function FutureField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#CDD8D5] bg-[#F8FAF9] px-4 py-3">
      <p className="text-xs font-black text-[#7A8D87]">{label}</p>
      <p className="mt-2 text-sm font-black text-[#5F726C]">{value}</p>
    </div>
  );
}

function SourceStatus({ source }: { source: AdminCustomerDetailSourceStatus }) {
  return (
    <div className="rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#223A34]">{source.label}</p>
          <p className="mt-1 text-xs font-semibold text-[#83928D]">{source.authority}</p>
        </div>
        <SourcePill source={source} />
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#71837D]">{source.note}</p>
    </div>
  );
}

function SourcePill({ source }: { source: AdminCustomerDetailSourceStatus }) {
  return <Pill label={sourceStateLabel(source.state)} tone={sourceTone(source.state)} />;
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
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            state === "connected"
              ? "bg-emerald-50 text-emerald-700"
              : state === "compatibility"
                ? "bg-[#EDF4F2] text-[#527068]"
                : "bg-[#F1F4F3] text-[#788983]"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">{note}</p>
    </div>
  );
}

function BoundaryState({
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
    <div
      className={cn(
        "rounded-2xl border px-5 py-5",
        positive ? "border-emerald-100 bg-emerald-50/50" : "border-[#E1E9E7] bg-[#FAFCFB]"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            positive ? "bg-white text-emerald-700" : "bg-white text-[#70847E]"
          )}
        >
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

function getSource(
  snapshot: AdminCustomerDetailSnapshot,
  key: AdminCustomerDetailSourceKey
): AdminCustomerDetailSourceStatus {
  const source = snapshot.sources.find((item) => item.key === key);
  if (!source) {
    throw new Error(`Missing customer detail source: ${key}`);
  }
  return source;
}

function sourceStateLabel(state: AdminCustomerSourceState) {
  if (state === "connected") return "正式read";
  if (state === "compatibility") return "互換read";
  return "未接続";
}

function sourceTone(state: AdminCustomerSourceState): PillTone {
  if (state === "connected") return "green";
  if (state === "compatibility") return "slate";
  return "muted";
}

function metricSourceNote(source: AdminCustomerDetailSourceStatus) {
  if (source.state === "connected") return `${source.authority} 接続済み`;
  if (source.state === "compatibility") return `${source.authority} 互換接続`;
  return `${source.authority} 未接続`;
}

function boundaryValue(value: string | null, state: AdminCustomerSourceState) {
  return state === "not_connected" ? "未接続" : value ?? "—";
}

function boundaryTone(value: string | null, state: AdminCustomerSourceState): PillTone {
  if (state === "not_connected") return "muted";
  if (value === "有効" || value === "利用中" || value === "閲覧可能") return "green";
  return "slate";
}

function formatCount(value: number | null) {
  return value === null ? "—" : `${value}件`;
}
