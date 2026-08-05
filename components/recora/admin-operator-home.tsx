import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Send
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  RecoraAdminOperationProjectSummary,
  RecoraAdminOperationsData
} from "@/lib/recora/db/admin-operations";
import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "rose" | "slate";
type Severity = "high" | "medium" | "low";
type Domain = "測定" | "品質" | "公開";

type QueueItem = {
  id: string;
  severity: Severity;
  domain: Domain;
  project: RecoraAdminOperationProjectSummary;
  message: string;
  observedAt: string | null;
};

export function AdminOperatorHome({
  data,
  loadError
}: {
  data: RecoraAdminOperationsData;
  loadError?: string | null;
}) {
  const projectCount = data.projects.length;
  const projectsWithRuns = data.projects.filter((project) => project.completedMeasurementRuns.length > 0).length;
  const failedMeasurements = data.projects.filter((project) => project.measurementStatus === "失敗");
  const publicationPending = data.projects.filter((project) => project.reportReadyStatus !== "customer_ready");
  const readyCount = projectCount - publicationPending.length;
  const queue = buildQueue(data);
  const affectedProjects = new Set(queue.map((item) => item.project.projectSlug)).size;
  const latestObservation = latestObservationAt(data);
  const hasAttention = queue.length > 0;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Recora Admin Control Room"
        title="運用ホーム"
        description="対応が必要な例外を、優先度の高い順に処理するための画面です。"
        actions={<><Pill label="対象: 全体" tone="slate" /><Pill label="Read only" tone="slate" /></>}
      />

      <section className={cn(
        "rounded-[20px] border px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,.03),0_14px_32px_rgba(15,23,42,.05)] sm:px-6",
        loadError ? "border-rose-200 bg-rose-50" : hasAttention ? "border-amber-200 bg-[#FFF9EE]" : "border-emerald-200 bg-[#F1FBF7]"
      )}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              loadError ? "bg-rose-100 text-rose-700" : hasAttention ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
            )}>
              {loadError ? <AlertTriangle className="h-6 w-6" /> : hasAttention ? <CircleAlert className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#667872]">現在の運用判断</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10231F] sm:text-[28px]">
                {loadError
                  ? "運用データを読み取れません"
                  : hasAttention
                    ? `${affectedProjects} Projectで${queue.length}件の対応が必要です`
                    : "現在、対応が必要な例外はありません"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#61736D]">
                {loadError
                  ? loadError
                  : hasAttention
                    ? "重大度の高い項目から確認してください。通常処理は自動で継続します。"
                    : "接続済みread modelの範囲では、測定・品質・公開に対応待ちはありません。"}
              </p>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <Fact label="対象Project" value={`${projectCount}件`} />
            <Fact label="最終観測" value={formatDateTime(latestObservation)} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="測定失敗" value={`${failedMeasurements.length}件`} helper={`${projectsWithRuns}/${projectCount || 0} Projectに完了run`} icon={<Activity className="h-[18px] w-[18px]" />} tone={failedMeasurements.length > 0 ? "rose" : "green"} />
        <Metric label="公開未完了" value={`${publicationPending.length}件`} helper={`${readyCount}件が公開可能`} icon={<Send className="h-[18px] w-[18px]" />} tone={publicationPending.length > 0 ? "amber" : "green"} />
        <Metric label="未解決の例外" value={`${queue.length}件`} helper={`${affectedProjects} Projectが対象`} icon={<CircleAlert className="h-[18px] w-[18px]" />} tone={queue.length > 0 ? "amber" : "green"} />
        <Metric label="最終観測" value={formatDate(latestObservation)} helper={formatTime(latestObservation)} icon={<CalendarClock className="h-[18px] w-[18px]" />} tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <DataCard
          title="要対応キュー"
          description="問題1件単位で、優先度・領域・Project・最終観測を表示します。"
          action={<Pill label={`${queue.length}件`} tone={queue.length > 0 ? "amber" : "green" />}
        >
          {queue.length === 0 ? (
            <Empty title="対応待ちの例外はありません" text="新しい測定失敗・品質例外・公開未完了が発生した場合、このキューに表示します。" />
          ) : (
            <div className="divide-y divide-[#E2EAE8]">
              <div className="hidden grid-cols-[88px_minmax(120px,.75fr)_minmax(260px,1.65fr)_120px_40px] gap-3 px-1 pb-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#84938F] md:grid">
                <span>優先度</span><span>Project</span><span>問題</span><span>最終観測</span><span />
              </div>
              {queue.slice(0, 12).map((item) => (
                <Link
                  key={item.id}
                  href={`/internal/projects/${encodeURIComponent(item.project.projectSlug)}`}
                  className="group grid gap-3 py-4 first:pt-1 md:grid-cols-[88px_minmax(120px,.75fr)_minmax(260px,1.65fr)_120px_40px] md:items-center"
                >
                  <Pill label={`優先度 ${item.severity === "high" ? "高" : item.severity === "medium" ? "中" : "低"}`} tone={item.severity === "high" ? "rose" : item.severity === "medium" ? "amber" : "slate"} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#10231F]">{item.project.projectName}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{item.project.brandName}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={item.domain} tone={item.domain === "測定" ? "rose" : item.domain === "品質" ? "amber" : "slate"} />
                      <span className="text-xs font-bold text-[#7A8D87]">{statusLabel(item)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[#334A44]">{item.message}</p>
                  </div>
                  <p className="text-xs font-bold text-[#687A74]">{formatDateTime(item.observedAt)}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8E4E1] bg-white text-[#00796B] group-hover:border-[#8CBDB1] group-hover:bg-[#EAF6F2]">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </DataCard>

        <div className="space-y-5">
          <DataCard title="運用状態" description="接続済みデータから判断できる状態です。" dense>
            <div className="space-y-3">
              <Status label="測定" value={failedMeasurements.length > 0 ? `${failedMeasurements.length}件失敗` : "失敗なし"} note={`${projectsWithRuns}/${projectCount || 0} Projectに完了run`} tone={failedMeasurements.length > 0 ? "rose" : "green"} />
              <Status label="品質" value={queue.filter((item) => item.domain === "品質").length > 0 ? `${queue.filter((item) => item.domain === "品質").length}件要確認` : "要確認なし"} note="report-ready blocking reason" tone={queue.some((item) => item.domain === "品質") ? "amber" : "green"} />
              <Status label="公開" value={`${readyCount}/${projectCount || 0} Project公開可能`} note={publicationPending.length > 0 ? `${publicationPending.length}件が未完了` : "未完了なし"} tone={publicationPending.length > 0 ? "amber" : "green"} />
            </div>
          </DataCard>

          <DataCard title="データ接続状況" description="業務状態とは分離して表示します。" dense>
            <div className="space-y-2.5">
              <Connection label="顧客・測定・品質・公開" status={loadError ? "取得失敗" : "接続中"} tone={loadError ? "rose" : "green"} />
              <Connection label="障害・監査" status="read model未接続" tone="slate" />
              <Connection label="利用量・コスト" status="read model未接続" tone="slate" />
              <Connection label="管理設定" status="M05接続前" tone="slate" />
            </div>
          </DataCard>
        </div>
      </div>

      <DataCard
        title="Project進行状況"
        description="全Projectの測定・集計・公開準備を、運用確認用の一覧で表示します。"
        action={<Button asChild variant="outline" size="sm"><Link href="/internal/projects">全Projectを見る<ArrowRight className="h-4 w-4" /></Link></Button>}
      >
        {data.projects.length === 0 ? (
          <Empty title="表示できるProjectがありません" text="Supabase read設定またはProject read権限を確認してください。" neutral />
        ) : (
          <div className="divide-y divide-[#E2EAE8]">
            <div className="hidden grid-cols-[minmax(180px,1.2fr)_110px_110px_120px_90px_40px] gap-3 px-1 pb-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#84938F] lg:grid">
              <span>Project</span><span>測定</span><span>集計</span><span>公開</span><span>残課題</span><span />
            </div>
            {data.projects.slice(0, 10).map((project) => (
              <Link
                key={project.projectSlug}
                href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`}
                className="group grid gap-3 py-4 lg:grid-cols-[minmax(180px,1.2fr)_110px_110px_120px_90px_40px] lg:items-center"
              >
                <div className="min-w-0"><p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p><p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{project.projectSlug}</p></div>
                <Pill label={project.measurementStatus} tone={project.measurementStatus === "失敗" ? "rose" : "slate"} />
                <Pill label={project.aggregateStatus} tone={project.aggregateStatus === "失敗" ? "rose" : "slate"} />
                <Pill label={project.reportReadyStatusLabel} tone={project.reportReadyStatus === "customer_ready" ? "green" : "slate"} />
                <Pill label={`${project.currentRemainingIssues.length}件`} tone={project.currentRemainingIssues.length > 0 ? "amber" : "green"} />
                <ArrowRight className="h-4 w-4 text-[#00796B] transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </DataCard>
    </div>
  );
}

function buildQueue(data: RecoraAdminOperationsData): QueueItem[] {
  const queue: QueueItem[] = [];
  for (const project of data.projects) {
    project.currentRemainingIssues.forEach((issue, index) => {
      const message = issue.message?.trim() || "要確認理由を取得できません。";
      const domain = classifyDomain(message, project);
      queue.push({ id: `${project.projectSlug}-${index}-${message}`, severity: classifySeverity(message, project, domain), domain, project, message, observedAt: project.latestMeasurementAt });
    });
    if (project.measurementStatus === "失敗" && !queue.some((item) => item.project.projectSlug === project.projectSlug && item.domain === "測定")) {
      queue.push({ id: `${project.projectSlug}-measurement-failed`, severity: "high", domain: "測定", project, message: "最新の測定runが失敗しています。", observedAt: project.latestMeasurementAt });
    }
    if (project.reportReadyStatus !== "customer_ready" && project.currentRemainingIssues.length === 0) {
      queue.push({ id: `${project.projectSlug}-publication-pending`, severity: "medium", domain: "公開", project, message: "顧客公開の準備が完了していません。", observedAt: project.latestMeasurementAt });
    }
  }
  return queue.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || timeValue(b.observedAt) - timeValue(a.observedAt));
}

function classifyDomain(message: string, project: RecoraAdminOperationProjectSummary): Domain {
  const value = message.toLowerCase();
  if (project.measurementStatus === "失敗" || /測定|measurement|run|回答/.test(value)) return "測定";
  if (/公開|publication|report-ready|配信/.test(value)) return "公開";
  return "品質";
}

function classifySeverity(message: string, project: RecoraAdminOperationProjectSummary, domain: Domain): Severity {
  if (project.measurementStatus === "失敗" || /失敗|停止|不足|欠落|無効/.test(message)) return "high";
  if (domain === "公開" || project.reportReadyStatus !== "customer_ready") return "medium";
  return "low";
}

function latestObservationAt(data: RecoraAdminOperationsData) {
  return data.projects.reduce<string | null>((latest, project) => {
    if (!project.latestMeasurementAt) return latest;
    if (!latest) return project.latestMeasurementAt;
    return timeValue(project.latestMeasurementAt) > timeValue(latest) ? project.latestMeasurementAt : latest;
  }, null);
}

function statusLabel(item: QueueItem) {
  if (item.domain === "測定") return item.project.measurementStatus;
  if (item.domain === "公開") return item.project.reportReadyStatusLabel;
  return "レビュー待ち";
}

function severityRank(value: Severity) { return value === "high" ? 0 : value === "medium" ? 1 : 2; }
function timeValue(value: string | null) { const time = value ? new Date(value).getTime() : 0; return Number.isNaN(time) ? 0 : time; }

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-[132px] rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#80908B]">{label}</p><p className="mt-1 text-sm font-black text-[#243832]">{value}</p></div>;
}

function Metric({ label, value, helper, icon, tone }: { label: string; value: string; helper: string; icon: React.ReactNode; tone: Tone }) {
  return <div className="rounded-2xl border border-[#DDE7E4] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]"><div className="flex items-center gap-3"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconTone(tone))}>{icon}</span><div className="min-w-0"><p className="truncate text-xs font-bold text-[#71837D]">{label}</p><p className="mt-0.5 text-xl font-black tracking-[-0.03em] text-[#10231F]">{value}</p></div></div><p className="mt-3 truncate text-xs font-semibold text-[#879691]">{helper}</p></div>;
}

function Status({ label, value, note, tone }: { label: string; value: string; note: string; tone: Tone }) {
  return <div className="rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-[#7A8D87]">{label}</p><p className="mt-1 text-sm font-black text-[#243832]">{value}</p><p className="mt-1 truncate text-[11px] font-semibold text-[#879691]">{note}</p></div><span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", dotTone(tone))} /></div></div>;
}

function Connection({ label, status, tone }: { label: string; status: string; tone: Tone }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F7FAF9] px-3 py-2.5"><div className="flex min-w-0 items-center gap-2.5"><span className={cn("h-2 w-2 shrink-0 rounded-full", dotTone(tone))} /><p className="truncate text-xs font-bold text-[#435953]">{label}</p></div><p className="shrink-0 text-[11px] font-bold text-[#7A8D87]">{status}</p></div>;
}

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant="outline" className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700", tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800", tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700", tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600")}>{label}</Badge>;
}

function Empty({ title, text, neutral = false }: { title: string; text: string; neutral?: boolean }) {
  return <div className={cn("flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center", neutral ? "border-[#CBD9D5] bg-[#F7FAF9]" : "border-emerald-200 bg-emerald-50/60")}><CheckCircle2 className={cn("h-7 w-7", neutral ? "text-[#70847E]" : "text-emerald-600")} /><p className={cn("mt-3 text-sm font-black", neutral ? "text-[#334A44]" : "text-emerald-900")}>{title}</p><p className={cn("mt-1 max-w-md text-xs font-semibold leading-5", neutral ? "text-[#7A8D87]" : "text-emerald-700")}>{text}</p></div>;
}

function iconTone(tone: Tone) { if (tone === "green") return "bg-emerald-50 text-emerald-700"; if (tone === "amber") return "bg-amber-50 text-amber-700"; if (tone === "rose") return "bg-rose-50 text-rose-700"; return "bg-[#EDF4F2] text-[#527068]"; }
function dotTone(tone: Tone) { if (tone === "green") return "bg-emerald-500"; if (tone === "amber") return "bg-amber-500"; if (tone === "rose") return "bg-rose-500"; return "bg-slate-400"; }

function formatDateTime(value: string | null) {
  if (!value) return "未観測";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(date);
}

function formatDate(value: string | null) {
  if (!value) return "未観測";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "観測日時なし";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(date)} 時点`;
}
