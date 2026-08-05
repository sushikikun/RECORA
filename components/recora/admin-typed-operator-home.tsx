import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, CircleAlert, Database } from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import type {
  AdminAttentionLevel,
  AdminAttentionWorkItem,
  AdminOperationalSignal,
  AdminOperationsHomeSnapshot
} from "@/lib/recora/admin-operations-home";
import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "rose" | "slate";

export function AdminTypedOperatorHome({ snapshot }: { snapshot: AdminOperationsHomeSnapshot }) {
  const verdict = snapshot.operationalVerdict;
  const attention = snapshot.humanAttention.items;
  const signals = snapshot.operationalSignals;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Recora Admin Control Room"
        title="運用ホーム"
        description="reason codeと明示状態だけを使い、人の対応と自動処理シグナルを分けて表示します。"
      />

      <section className={cn("rounded-[18px] border px-6 py-5", verdictSurface(verdict.state))}>
        <div className="flex items-start gap-4">
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", verdictIcon(verdict.state))}>
            {verdict.state === "unavailable" ? <AlertTriangle className="h-5 w-5" /> : verdict.state === "normal" ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#667872]">現在の運用判断</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10231F]">{verdictTitle(snapshot)}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#61736D]">{verdictDescription(snapshot)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="人の対応" value={`${verdict.humanAttentionCount}件`} note={`${snapshot.humanAttention.byDomain.quality}品質 / ${snapshot.humanAttention.byDomain.publication}公開`} tone={verdict.humanAttentionCount > 0 ? "amber" : "green"} />
        <Metric label="測定失敗" value={`${snapshot.measurementStatus.failedProjectCount}件`} note={`${snapshot.measurementStatus.projectsWithCompletedRuns}/${snapshot.measurementStatus.totalProjectCount || 0} Projectに完了run`} tone={snapshot.measurementStatus.failedProjectCount > 0 ? "rose" : "green"} />
        <Metric label="公開可能" value={`${snapshot.publicationStatus.customerReadyProjectCount}件`} note={`準備中 ${snapshot.publicationStatus.notReadyProjectCount}件は自動的に人対応へ入れない`} tone="slate" />
        <Metric label="未分類reason" value={`${verdict.unclassifiedReasonCount}件`} note="本文から推測せず警告へ分離" tone={verdict.unclassifiedReasonCount > 0 ? "amber" : "green"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,.55fr)]">
        <DataCard title="人の対応キュー" description="既知reason codeで人対応と明示できる項目だけを表示します。" action={<Pill label={`${attention.length}件`} tone={attention.length > 0 ? "amber" : "green"} />}>
          {attention.length === 0 ? (
            <Empty icon={<CheckCircle2 className="h-7 w-7" />} title="明示された人対応項目はありません" text="測定失敗などは自動処理シグナルへ分離しています。" positive />
          ) : (
            <div className="divide-y divide-[#E2EAE8]">
              {attention.slice(0, 10).map((item) => <AttentionRow key={item.workItemId} item={item} />)}
            </div>
          )}
        </DataCard>

        <div className="space-y-5">
          <DataCard title="自動処理シグナル" description="人のdecision件数には含めません。" dense>
            {signals.length === 0 ? (
              <Empty icon={<Activity className="h-7 w-7" />} title="シグナルはありません" text="接続済み範囲では失敗・処理不足を検出していません。" compact positive />
            ) : (
              <div className="space-y-2.5">{signals.slice(0, 6).map((signal) => <SignalRow key={signal.signalId} signal={signal} />)}</div>
            )}
          </DataCard>

          <DataCard title="adapter整合性" description="正式AttentionWorkItem接続までの安全境界です。" dense>
            <StateRow icon={<Database className="h-4 w-4" />} label="正式AttentionWorkItem" value="未接続" tone="slate" />
            <StateRow icon={<CheckCircle2 className="h-4 w-4" />} label="code-based adapter" value={snapshot.pageContext.adapterKind === "phase1_compatibility" ? "有効" : "取得失敗"} tone={snapshot.pageContext.adapterKind === "phase1_compatibility" ? "green" : "rose"} />
            <StateRow icon={<AlertTriangle className="h-4 w-4" />} label="未分類reason" value={`${snapshot.adapterWarnings.unclassifiedReasons.length}件`} tone={snapshot.adapterWarnings.unclassifiedReasons.length > 0 ? "amber" : "green"} />
            {snapshot.adapterWarnings.ignoredReasonCount > 0 ? <p className="mt-3 text-xs font-semibold leading-5 text-[#71837D]">プラン依存の改善提案理由を共通キューから{snapshot.adapterWarnings.ignoredReasonCount}件除外しました。</p> : null}
          </DataCard>
        </div>
      </div>

      <DataCard title="要確認Project" description="正常Projectの全件一覧は置かず、人対応またはシグナルがあるProjectだけを表示します。">
        {snapshot.affectedProjects.length === 0 ? (
          <Empty icon={<CheckCircle2 className="h-7 w-7" />} title="要確認Projectはありません" text="通常の全件確認は顧客管理・測定管理から行います。" positive />
        ) : (
          <div className="divide-y divide-[#E2EAE8]">
            {snapshot.affectedProjects.map((project) => (
              <Link key={project.projectSlug} href={project.relatedRoute} className="group grid gap-3 py-4 md:grid-cols-[minmax(220px,1.4fr)_120px_120px_44px] md:items-center">
                <div className="min-w-0"><p className="truncate text-sm font-black text-[#10231F]">{project.projectName}</p><p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{project.brandName}</p></div>
                <Pill label={`人対応 ${project.attentionCount}件`} tone={project.attentionCount > 0 ? "amber" : "green"} />
                <Pill label={`シグナル ${project.signalCount}件`} tone={project.signalCount > 0 ? "slate" : "green"} />
                <ArrowRight className="h-4 w-4 text-[#00796B] transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </DataCard>
    </div>
  );
}

function AttentionRow({ item }: { item: AdminAttentionWorkItem }) {
  return (
    <Link href={item.relatedRoute} className="group grid gap-3 py-4 md:grid-cols-[92px_minmax(150px,.8fr)_minmax(280px,1.7fr)_44px] md:items-center">
      <Pill label={levelLabel(item.attentionLevel)} tone={attentionTone(item.attentionLevel)} />
      <div className="min-w-0"><p className="truncate text-sm font-black text-[#10231F]">{item.projectName}</p><p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">{item.brandName}</p></div>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Pill label={item.navigationDomain === "quality" ? "品質" : "公開"} tone={item.navigationDomain === "quality" ? "amber" : "slate"} /><span className="font-mono text-[10px] font-bold text-[#7A8D87]">{item.reasonCode}</span></div><p className="mt-1 text-sm font-black text-[#243832]">{item.title}</p><p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[#61736D]">{item.summary}</p></div>
      <ArrowRight className="h-4 w-4 text-[#00796B] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SignalRow({ signal }: { signal: AdminOperationalSignal }) {
  return (
    <Link href={signal.relatedRoute} className="block rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-3 py-3 hover:border-[#A9CDC3] hover:bg-[#F5FBF9]">
      <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-black text-[#243832]">{signal.projectName}</p><Pill label={signal.level === "high" ? "高" : signal.level === "medium" ? "中" : "低"} tone={signal.level === "high" ? "rose" : signal.level === "medium" ? "amber" : "slate"} /></div>
      <p className="mt-2 text-sm font-black text-[#334A44]">{signal.title}</p><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#71837D]">{signal.summary}</p>
    </Link>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: Tone }) {
  return <div className="rounded-2xl border border-[#DDE7E4] bg-white px-4 py-4"><p className="text-xs font-bold text-[#71837D]">{label}</p><p className="mt-1 text-xl font-black text-[#10231F]">{value}</p><p className="mt-2 text-xs font-semibold leading-5 text-[#879691]">{note}</p><span className={cn("mt-3 block h-1 rounded-full", tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "rose" ? "bg-rose-500" : "bg-slate-300")} /></div>;
}

function StateRow({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: Tone }) {
  return <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-[#F7FAF9] px-3 py-2.5"><div className="flex items-center gap-2 text-[#60736C]">{icon}<p className="text-xs font-bold text-[#435953]">{label}</p></div><Pill label={value} tone={tone} /></div>;
}

function Empty({ icon, title, text, positive = false, compact = false }: { icon: ReactNode; title: string; text: string; positive?: boolean; compact?: boolean }) {
  return <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center", compact ? "min-h-32" : "min-h-40", positive ? "border-emerald-200 bg-emerald-50/60 text-emerald-700" : "border-[#CBD9D5] bg-[#F7FAF9] text-[#70847E]")}>{icon}<p className={cn("mt-3 text-sm font-black", positive ? "text-emerald-900" : "text-[#334A44]")}>{title}</p><p className={cn("mt-1 max-w-md text-xs font-semibold leading-5", positive ? "text-emerald-700" : "text-[#7A8D87]")}>{text}</p></div>;
}

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant="outline" className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700", tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800", tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700", tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600")}>{label}</Badge>;
}

function verdictTitle(snapshot: AdminOperationsHomeSnapshot) {
  const verdict = snapshot.operationalVerdict;
  if (verdict.state === "unavailable") return "運用データを読み取れません";
  if (verdict.humanAttentionCount > 0) return `${verdict.affectedProjectCount} Projectで${verdict.humanAttentionCount}件の人対応が必要です`;
  if (verdict.operationalSignalCount > 0 || verdict.unclassifiedReasonCount > 0) return "人対応は未確定ですが、確認すべき運用シグナルがあります";
  return "明示された人対応項目はありません";
}

function verdictDescription(snapshot: AdminOperationsHomeSnapshot) {
  if (snapshot.loadError) return snapshot.loadError;
  if (snapshot.operationalVerdict.humanAttentionCount > 0) return "本文の表現ではなくreason codeで重要度と専門領域を決定しています。";
  if (snapshot.operationalVerdict.unclassifiedReasonCount > 0) return "未知のreason codeを推測分類せず、adapter警告として停止しています。";
  if (snapshot.operationalVerdict.operationalSignalCount > 0) return "測定・集計の状態を確認してください。人のdecision件数には自動計上していません。";
  return "code-based adapterで確認できる範囲では、品質・公開の人対応はありません。";
}

function verdictSurface(state: AdminOperationsHomeSnapshot["operationalVerdict"]["state"]) { return state === "unavailable" ? "border-rose-200 bg-rose-50" : state === "attention_required" ? "border-amber-200 bg-[#FFF9EE]" : state === "signal_detected" ? "border-slate-200 bg-slate-50" : "border-emerald-200 bg-[#F1FBF7]"; }
function verdictIcon(state: AdminOperationsHomeSnapshot["operationalVerdict"]["state"]) { return state === "unavailable" ? "bg-rose-100 text-rose-700" : state === "attention_required" ? "bg-amber-100 text-amber-800" : state === "signal_detected" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"; }
function levelLabel(level: AdminAttentionLevel) { return level === "critical" ? "Critical" : level === "high" ? "High" : level === "medium" ? "Medium" : "Low"; }
function attentionTone(level: AdminAttentionLevel): Tone { return level === "critical" || level === "high" ? "rose" : level === "medium" ? "amber" : "slate"; }
