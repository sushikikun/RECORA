import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Gauge,
  Send,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  WalletCards
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";
import { cn } from "@/lib/utils";

export type AdminDomainSlug =
  | "customers"
  | "measurements"
  | "quality"
  | "publication"
  | "incidents"
  | "usage-cost"
  | "settings";

type DomainConfig = {
  label: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  decisions: string[];
  sources: string[];
  legacy?: { href: string; label: string };
};

const domains: Record<AdminDomainSlug, DomainConfig> = {
  customers: {
    label: "顧客管理",
    eyebrow: "Customer Operations",
    description: "顧客、Project、顧客ユーザー、問い合わせを一つの運用単位として確認します。",
    icon: Building2,
    decisions: ["顧客画面へアクセス可能か", "測定・公開が停止していないか", "ユーザー・問い合わせに対応が必要か"],
    sources: ["M04 顧客・Project・問い合わせ", "顧客・Project read model", "P4-B membership"],
    legacy: { href: "/internal/customer-ops", label: "既存の顧客運用一覧" }
  },
  measurements: {
    label: "測定管理",
    eyebrow: "Measurement Operations",
    description: "日次測定、run、失敗、再試行、安全停止を例外中心で確認します。",
    icon: Activity,
    decisions: ["予定した測定が完了したか", "失敗を再試行で回復できるか", "安全停止・障害対応が必要か"],
    sources: ["measurement run / run item", "日次自動処理control", "AIモデルhealth / control"],
    legacy: { href: "/internal/operations", label: "既存の実行管理" }
  },
  quality: {
    label: "品質・例外レビュー",
    eyebrow: "Quality Exceptions",
    description: "通常の自動品質判定は通過させ、例外になった対象だけを確認します。",
    icon: ShieldCheck,
    decisions: ["証拠・件数不足があるか", "再処理で解決できるか", "公開できない理由が残っているか"],
    sources: ["quality case read model", "report-ready blocking reason", "quality rule version"]
  },
  publication: {
    label: "公開管理",
    eyebrow: "Publication Operations",
    description: "公開候補、公開版、現在の公開先、公開処理、配信確認を分けて管理します。",
    icon: Send,
    decisions: ["最新候補が品質条件を満たすか", "公開・反映が成功したか", "旧公開版の維持・復元が必要か"],
    sources: ["publication candidate / version", "current publication pointer", "delivery verification"],
    legacy: { href: "/internal/projects", label: "既存のProject一覧" }
  },
  incidents: {
    label: "障害・監査",
    eyebrow: "Incident & Audit",
    description: "障害、復旧、システム状態、重要操作の監査証跡を追跡します。",
    icon: Siren,
    decisions: ["重大障害の影響範囲はどこか", "段階的復旧と検証が完了したか", "操作を追跡できるか"],
    sources: ["incident / recovery / clearance", "system component health", "append-only audit log"]
  },
  "usage-cost": {
    label: "利用量・コスト",
    eyebrow: "Usage & Cost",
    description: "AI利用量、内部変動原価、未算定、CSV出力を確認します。",
    icon: WalletCards,
    decisions: ["利用量は適正か", "単価不足・未算定がないか", "異常な増加がないか"],
    sources: ["usage record", "pricing definition", "cost calculation / export"]
  },
  settings: {
    label: "管理設定",
    eyebrow: "Platform Settings",
    description: "管理者、通知、日次処理、AIモデル、プラン、品質・公開ルールを安全に変更します。",
    icon: SlidersHorizontal,
    decisions: ["設定に不整合・適用失敗がないか", "暫定プラン・AI構成を変更するか", "予約変更を扱う必要があるか"],
    sources: ["M02 管理者・権限", "M03 通知category", "M05 settings core"],
    legacy: { href: "/internal/plans", label: "既存の料金プラン一覧" }
  }
};

export function isAdminDomainSlug(value: string): value is AdminDomainSlug {
  return Object.prototype.hasOwnProperty.call(domains, value);
}

export function AdminControlRoomHome({
  data,
  loadError
}: {
  data: RecoraAdminOperationsData;
  loadError?: string | null;
}) {
  const projectCount = data.projects.length;
  const projectsWithRuns = data.projects.filter((project) => project.completedMeasurementRuns.length > 0).length;
  const readyCount = data.projects.filter((project) => project.reportReadyStatus === "customer_ready").length;
  const attention = data.projects.filter((project) => project.currentRemainingIssues.length > 0);
  const blockerCount = attention.reduce((sum, project) => sum + project.currentRemainingIssues.length, 0);
  const runCount = data.projects.reduce((sum, project) => sum + project.completedMeasurementRuns.length, 0);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Recora Admin Control Room"
        title="運用ホーム"
        description="正常処理は自動で進め、管理者が見るべき例外・停止・未接続だけを集約します。"
        actions={
          <>
            <Pill label={blockerCount > 0 ? `要確認 ${blockerCount}件` : "重大な要確認なし"} tone={blockerCount > 0 ? "amber" : "green"} />
            <Pill label="Read only" tone="slate" />
          </>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-900">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="管理対象Project" value={`${projectCount}件`} note="現在参照できるProject" icon={Building2} />
        <Kpi label="完了済み測定run" value={`${runCount}件`} note={`${projectsWithRuns} Projectに観測あり`} icon={Activity} />
        <Kpi label="公開可能" value={`${readyCount}件`} note="既存report-ready判定" icon={Send} tone={readyCount > 0 ? "green" : "slate"} />
        <Kpi label="残課題" value={`${blockerCount}件`} note={`${attention.length} Projectで要確認`} icon={CircleAlert} tone={blockerCount > 0 ? "amber" : "green"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <DataCard title="今、対応が必要なもの" description="既存read modelのblocking reasonをProject単位で表示します。">
          {attention.length === 0 ? (
            <Empty positive title="現在のread model上、要確認はありません" text="新しい例外が発生した場合、この場所に表示します。" />
          ) : (
            <div className="divide-y divide-[#E2EAE8]">
              {attention.slice(0, 6).map((project) => (
                <Link
                  key={project.projectSlug}
                  href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}
                  className="group flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
                      <Pill label={`${project.currentRemainingIssues.length}件`} tone="amber" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#687A74]">
                      {project.currentRemainingIssues[0]?.message ?? "要確認理由を取得できません。"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#00796B] transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </DataCard>

        <DataCard title="自動運用の観測状態" description="接続済みのデータだけを表示します。">
          <div className="space-y-3">
            <StatusRow label="測定" value={`${projectsWithRuns}/${projectCount || 0} Project`} tone={projectCount > 0 && projectsWithRuns === projectCount ? "green" : "slate"} />
            <StatusRow label="品質例外" value={blockerCount > 0 ? `${blockerCount}件` : "要確認なし"} tone={blockerCount > 0 ? "amber" : "green"} />
            <StatusRow label="公開可能" value={`${readyCount}件`} tone={readyCount > 0 ? "green" : "slate"} />
            <StatusRow label="設定・障害・原価" value="read model未接続" tone="slate" />
          </div>
        </DataCard>
      </div>

      <DataCard title="管理画面の8領域" description="通常処理の承認画面ではなく、判断・例外対応・復旧の入口です。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Area href="/internal" label="運用ホーム" text="全体状態と要対応を確認" icon={Gauge} status="接続中" />
          {(Object.entries(domains) as [AdminDomainSlug, DomainConfig][]).map(([slug, domain]) => (
            <Area
              key={slug}
              href={`/internal/${slug}`}
              label={domain.label}
              text={domain.description}
              icon={domain.icon}
              status={isProjectDomain(slug) ? "一部接続" : "UI先行"}
            />
          ))}
        </div>
      </DataCard>

      <DataCard
        title="Projectの現在地"
        description="測定・集計・公開準備状態を横スクロールなしで要約します。"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/internal/projects">全Projectを見る<ArrowRight className="h-4 w-4" /></Link>
          </Button>
        }
      >
        {data.projects.length === 0 ? (
          <Empty title="表示できるProjectがありません" text="Supabase read設定またはProject read権限を確認してください。" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.projects.slice(0, 6).map((project) => (
              <Link key={project.projectSlug} href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`} className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4 hover:border-[#A9CDC3] hover:bg-[#F5FBF9]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{project.projectSlug}</p>
                  </div>
                  <Pill label={project.reportReadyStatusLabel} tone={project.reportReadyStatus === "customer_ready" ? "green" : "slate"} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Mini label="測定" value={project.measurementStatus} />
                  <Mini label="集計" value={project.aggregateStatus} />
                  <Mini label="残課題" value={`${project.currentRemainingIssues.length}件`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </DataCard>
    </div>
  );
}

export function AdminDomainPage({
  domain,
  data,
  loadError
}: {
  domain: AdminDomainSlug;
  data: RecoraAdminOperationsData | null;
  loadError?: string | null;
}) {
  const config = domains[domain];
  const Icon = config.icon;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.label}
        description={config.description}
        actions={<><Pill label="P0 UI" tone="green" /><Pill label="段階接続" tone="slate" /></>}
      />

      <div className="rounded-2xl border border-[#CFE2DD] bg-[#EDF7F4] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm"><Icon className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-black text-[#163C34]">UIは実装済み、データは段階接続です</p>
              <p className="mt-1 text-sm leading-6 text-[#4C6B63]">架空の件数・状態・履歴は表示しません。</p>
            </div>
          </div>
          {config.legacy ? (
            <Button asChild variant="outline" className="border-[#B8D4CD] bg-white">
              <Link href={config.legacy.href}>{config.legacy.label}<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DataCard title="この画面で判断すること" description="P0で管理者が確認する項目です。">
          <div className="space-y-3">
            {config.decisions.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#008F72]" />
                <p className="text-sm font-semibold leading-6 text-[#334A44]">{item}</p>
              </div>
            ))}
          </div>
        </DataCard>
        <DataCard title="正式なデータ接続先" description="最終的に参照するwrite/read modelです。">
          <div className="space-y-3">
            {config.sources.map((source, index) => (
              <div key={source} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3"><Database className="h-4 w-4 shrink-0 text-[#70847E]" /><p className="truncate text-sm font-bold text-[#334A44]">{source}</p></div>
                <Pill label={index === 0 && isProjectDomain(domain) ? "一部接続" : "後続"} tone={index === 0 && isProjectDomain(domain) ? "green" : "slate"} />
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      {loadError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">{loadError}</div> : null}

      {data && isProjectDomain(domain) ? (
        <ProjectPanel domain={domain} data={data} />
      ) : (
        <DataCard title="運用データ" description="専用read modelが接続されるまで、架空データは表示しません。">
          <Empty title="正式データは未接続です" text="write model → read model → command serviceの順で接続します。" />
        </DataCard>
      )}

      <DataCard title="操作" description="正式command serviceと権限再検査が接続されるまで変更操作は有効化しません。">
        <div className="flex flex-wrap gap-2"><Button disabled>新規作成</Button><Button disabled variant="outline">状態を変更</Button><Button disabled variant="outline">履歴を確認</Button></div>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#7A8D87]">DBへ直接書き込む仮ボタンは実装していません。</p>
      </DataCard>
    </div>
  );
}

function ProjectPanel({ domain, data }: { domain: AdminDomainSlug; data: RecoraAdminOperationsData }) {
  return (
    <DataCard title="接続済みProjectデータ" description="現在取得できるread modelをこの領域の入口として表示します。" action={<Pill label={`${data.projects.length} Project`} tone="slate" />}>
      {data.projects.length === 0 ? <Empty title="表示対象がありません" text="現在のread権限で参照できるProjectがありません。" /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.projects.map((project) => {
            const value = domain === "customers" ? project.brandName
              : domain === "measurements" ? `${project.completedMeasurementRuns.length} run`
              : domain === "quality" ? `${project.currentRemainingIssues.length}件`
              : project.reportReadyStatusLabel;
            const tone = domain === "quality" && project.currentRemainingIssues.length > 0 ? "amber"
              : domain === "publication" && project.reportReadyStatus === "customer_ready" ? "green"
              : "slate";
            return (
              <Link key={project.projectSlug} href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`} className="rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4 hover:border-[#A9CDC3] hover:bg-[#F5FBF9]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p><p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{project.projectSlug}</p></div>
                  <Pill label={value} tone={tone} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2"><Pill label={`測定: ${project.measurementStatus}`} tone="slate" /><Pill label={`集計: ${project.aggregateStatus}`} tone="slate" /></div>
              </Link>
            );
          })}
        </div>
      )}
    </DataCard>
  );
}

function Kpi({ label, value, note, icon: Icon, tone = "slate" }: { label: string; value: string; note: string; icon: LucideIcon; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-[#697B75]">{label}</p><span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-[#EDF4F2] text-[#527068]")}><Icon className="h-[18px] w-[18px]" /></span></div>
      <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#84938F]">{note}</p>
    </div>
  );
}

function Area({ href, label, text, icon: Icon, status }: { href: string; label: string; text: string; icon: LucideIcon; status: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-[#E0E9E6] bg-[#FCFEFD] p-4 transition-all hover:-translate-y-0.5 hover:border-[#A9CDC3] hover:shadow-[0_10px_24px_rgba(15,23,42,.06)]">
      <div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#00796B] shadow-sm"><Icon className="h-5 w-5" /></span><Pill label={status} tone={status === "接続中" ? "green" : "slate"} /></div>
      <p className="mt-4 text-sm font-black text-[#10231F]">{label}</p><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#748680]">{text}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#00796B]">開く<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

type Tone = "green" | "amber" | "slate";

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant="outline" className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600")}>{label}</Badge>;
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3"><div><p className="text-xs font-bold text-[#7A8D87]">{label}</p><p className="mt-1 text-sm font-black text-[#243832]">{value}</p></div><Pill label={tone === "green" ? "観測済み" : tone === "amber" ? "要確認" : "確認中"} tone={tone} /></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#F1F6F4] px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-[#899995]">{label}</p><p className="mt-1 truncate text-xs font-black text-[#334A44]">{value}</p></div>;
}

function Empty({ title, text, positive = false }: { title: string; text: string; positive?: boolean }) {
  const Icon = positive ? CheckCircle2 : Clock3;
  return <div className={cn("flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center", positive ? "border-emerald-200 bg-emerald-50/60" : "border-[#CBD9D5] bg-[#F7FAF9]")}><Icon className={cn("h-7 w-7", positive ? "text-emerald-600" : "text-[#70847E]")} /><p className={cn("mt-3 text-sm font-black", positive ? "text-emerald-900" : "text-[#334A44]")}>{title}</p><p className={cn("mt-1 max-w-md text-xs font-semibold leading-5", positive ? "text-emerald-700" : "text-[#7A8D87]")}>{text}</p></div>;
}

function isProjectDomain(domain: AdminDomainSlug) {
  return domain === "customers" || domain === "measurements" || domain === "quality" || domain === "publication";
}
