import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Send
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import type {
  RecoraAdminOperationProjectSummary,
  RecoraAdminOperationsData
} from "@/lib/recora/db/admin-operations";
import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "rose" | "slate";
type QueueItem = {
  id: string;
  project: RecoraAdminOperationProjectSummary;
  area: "測定" | "品質" | "公開";
  priority: "高" | "中" | "低";
  message: string;
};

export function AdminOperatorHome({
  data,
  loadError
}: {
  data: RecoraAdminOperationsData;
  loadError?: string | null;
}) {
  const queue = buildQueue(data);
  const affectedProjects = new Set(queue.map((item) => item.project.projectSlug)).size;
  const failedMeasurements = data.projects.filter((project) => project.measurementStatus === "失敗").length;
  const publicationPending = data.projects.filter((project) => project.reportReadyStatus !== "customer_ready").length;
  const readyCount = data.projects.length - publicationPending;
  const latestObservation = latestObservationAt(data);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Recora Admin Control Room"
        title="運用ホーム"
        description="例外・停止・未完了を、優先度の高い順に確認します。"
        actions={<Pill label="対象: 全体" tone="slate" />}
      />

      <section
        className={cn(
          "rounded-[20px] border px-6 py-5",
          loadError
            ? "border-rose-200 bg-rose-50"
            : queue.length > 0
              ? "border-amber-200 bg-[#FFF9EE]"
              : "border-emerald-200 bg-[#F1FBF7]"
        )}
      >
        <div className="flex items-start gap-4">
          <span className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            loadError
              ? "bg-rose-100 text-rose-700"
              : queue.length > 0
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-700"
          )}>
            {loadError ? <AlertTriangle className="h-5 w-5" /> : queue.length > 0 ? <CircleAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#667872]">現在の運用判断</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10231F]">
              {loadError
                ? "運用データを読み取れません"
                : queue.length > 0
                  ? `${affectedProjects} Projectで${queue.length}件の対応が必要です`
                  : "現在、対応が必要な例外はありません"}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#61736D]">
              {loadError ?? (queue.length > 0 ? "優先度の高い項目から確認してください。通常処理は自動で継続します。" : "接続済みデータの範囲では、測定・品質・公開に対応待ちはありません。")}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="測定失敗" value={`${failedMeasurements}件`} note="最新の測定状態" tone={failedMeasurements > 0 ? "rose" : "green"} />
        <Summary label="公開未完了" value={`${publicationPending}件`} note={`${readyCount}件が公開可能`} tone={publicationPending > 0 ? "amber" : "green"} />
        <Summary label="未解決の例外" value={`${queue.length}件`} note={`${affectedProjects} Projectが対象`} tone={queue.length > 0 ? "amber" : "green"} />
        <Summary label="最終観測" value={formatDateTime(latestObservation)} note="接続済み測定データ" tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <DataCard
          title="要対応キュー"
          description="問題1件単位で、優先度・領域・Projectを表示します。"
          action={<Pill label={`${queue.length}件`} tone={queue.length > 0 ? "amber" : "green"} />}
        >
          {queue.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-[#E2EAE8]">
              {queue.slice(0, 12).map((item) => (
                <Link
                  key={item.id}
                  href={`/internal/projects/${encodeURIComponent(item.project.projectSlug)}`}
                  className="group grid gap-3 py-4 md:grid-cols-[80px_minmax(140px,.8fr)_minmax(260px,1.7fr)_40px] md:items-center"
                >
                  <Pill label={`優先度 ${item.priority}`} tone={item.priority === "高" ? "rose" : item.priority === "中" ? "amber" : "slate"} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#10231F]">{item.project.projectName}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{item.project.brandName}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><Pill label={item.area} tone={item.area === "測定" ? "rose" : item.area === "品質" ? "amber" : "slate"} /></div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[#334A44]">{item.message}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#00796B] transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </DataCard>

        <div className="space-y-5">
          <DataCard title="運用状態" description="接続済みデータから判断します。" dense>
            <div className="space-y-3">
              <Status icon={<Activity className="h-4 w-4" />} label="測定" value={failedMeasurements > 0 ? `${failedMeasurements}件失敗` : "失敗なし"} tone={failedMeasurements > 0 ? "rose" : "green"} />
              <Status icon={<CircleAlert className="h-4 w-4" />} label="品質" value={`${queue.filter((item) => item.area === "品質").length}件要確認`} tone={queue.some((item) => item.area === "品質") ? "amber" : "green"} />
              <Status icon={<Send className="h-4 w-4" />} label="公開" value={`${readyCount}/${data.projects.length || 0} Project公開可能`} tone={publicationPending > 0 ? "amber" : "green"} />
            </div>
          </DataCard>
          <DataCard title="データ接続状況" description="業務状態とは分離しています。" dense>
            <Connection label="顧客・測定・品質・公開" value={loadError ? "取得失敗" : "接続中"} tone={loadError ? "rose" : "green"} />
            <Connection label="障害・監査" value="未接続" tone="slate" />
            <Connection label="利用量・コスト" value="未接続" tone="slate" />
            <Connection label="管理設定" value="M05接続前" tone="slate" />
          </DataCard>
        </div>
      </div>

      <DataCard title="Project進行状況" description="測定・集計・公開準備を一覧で確認します。">
        {data.projects.length === 0 ? (
          <p className="py-10 text-center text-sm font-semibold text-[#7A8D87]">表示できるProjectがありません。</p>
        ) : (
          <div className="divide-y divide-[#E2EAE8]">
            {data.projects.slice(0, 10).map((project) => (
              <Link key={project.projectSlug} href={`/internal/projects/${encodeURIComponent(project.projectSlug)}`} className="group grid gap-3 py-4 lg:grid-cols-[minmax(180px,1.2fr)_110px_110px_130px_90px_32px] lg:items-center">
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
  const items: QueueItem[] = [];
  for (const project of data.projects) {
    project.currentRemainingIssues.forEach((issue, index) => {
      const message = issue.message?.trim() || "要確認理由を取得できません。";
      const area = classifyArea(message, project);
      items.push({ id: `${project.projectSlug}-${index}`, project, area, priority: classifyPriority(message, project, area), message });
    });
    if (project.measurementStatus === "失敗" && !items.some((item) => item.project.projectSlug === project.projectSlug && item.area === "測定")) {
      items.push({ id: `${project.projectSlug}-measurement`, project, area: "測定", priority: "高", message: "最新の測定runが失敗しています。" });
    }
    if (project.reportReadyStatus !== "customer_ready" && project.currentRemainingIssues.length === 0) {
      items.push({ id: `${project.projectSlug}-publication`, project, area: "公開", priority: "中", message: "顧客公開の準備が完了していません。" });
    }
  }
  return items.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

function classifyArea(message: string, project: RecoraAdminOperationProjectSummary): QueueItem["area"] {
  if (project.measurementStatus === "失敗" || /測定|measurement|run|回答/i.test(message)) return "測定";
  if (/公開|publication|report-ready|配信/i.test(message)) return "公開";
  return "品質";
}
function classifyPriority(message: string, project: RecoraAdminOperationProjectSummary, area: QueueItem["area"]): QueueItem["priority"] {
  if (project.measurementStatus === "失敗" || /失敗|停止|不足|欠落|無効/.test(message)) return "高";
  return area === "公開" ? "中" : "低";
}
function priorityRank(value: QueueItem["priority"]) { return value === "高" ? 0 : value === "中" ? 1 : 2; }
function latestObservationAt(data: RecoraAdminOperationsData) { return data.projects.map((project) => project.latestMeasurementAt).filter((value): value is string => Boolean(value)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null; }
function formatDateTime(value: string | null) { if (!value) return "未観測"; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }).format(date); }

function Summary({ label, value, note, tone }: { label: string; value: string; note: string; tone: Tone }) { return <div className="rounded-2xl border border-[#DDE7E4] bg-white px-4 py-4"><p className="text-xs font-bold text-[#71837D]">{label}</p><p className="mt-1 text-xl font-black text-[#10231F]">{value}</p><p className="mt-2 text-xs font-semibold text-[#879691]">{note}</p><span className={cn("mt-3 block h-1 rounded-full", barTone(tone))} /></div>; }
function Status({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: Tone }) { return <div className="flex items-center justify-between rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-3 py-3"><div className="flex items-center gap-2 text-[#60736C]">{icon}<span className="text-xs font-bold">{label}</span></div><Pill label={value} tone={tone} /></div>; }
function Connection({ label, value, tone }: { label: string; value: string; tone: Tone }) { return <div className="mt-2 flex items-center justify-between rounded-xl bg-[#F7FAF9] px-3 py-2.5"><p className="text-xs font-bold text-[#435953]">{label}</p><Pill label={value} tone={tone} /></div>; }
function Pill({ label, tone }: { label: string; tone: Tone }) { return <Badge variant="outline" className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700", tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800", tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700", tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600")}>{label}</Badge>; }
function Empty() { return <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-5 text-center"><CheckCircle2 className="h-7 w-7 text-emerald-600" /><p className="mt-3 text-sm font-black text-emerald-900">対応待ちの例外はありません</p><p className="mt-1 text-xs font-semibold text-emerald-700">新しい問題が発生した場合、このキューに表示します。</p></div>; }
function barTone(tone: Tone) { if (tone === "green") return "bg-emerald-500"; if (tone === "amber") return "bg-amber-500"; if (tone === "rose") return "bg-rose-500"; return "bg-slate-400"; }
