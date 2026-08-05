import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Database,
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
  kind: "measurement_failure" | "blocking_reason";
  label: "測定失敗" | "要確認";
  message: string;
  href: string;
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
  const failedMeasurements = queue.filter((item) => item.kind === "measurement_failure").length;
  const blockingReasonCount = queue.filter((item) => item.kind === "blocking_reason").length;
  const readyCount = data.projects.filter((project) => project.reportReadyStatus === "customer_ready").length;
  const latestObservation = latestObservationAt(data);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Recora Admin Control Room"
        title="運用ホーム"
        description="明示的に確認できる測定失敗と既存blocking reasonだけを表示します。"
      />

      <section
        className={cn(
          "rounded-[18px] border px-6 py-5",
          loadError
            ? "border-rose-200 bg-rose-50"
            : queue.length > 0
              ? "border-amber-200 bg-[#FFF9EE]"
              : "border-emerald-200 bg-[#F1FBF7]"
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              loadError
                ? "bg-rose-100 text-rose-700"
                : queue.length > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-700"
            )}
          >
            {loadError ? (
              <AlertTriangle className="h-5 w-5" />
            ) : queue.length > 0 ? (
              <CircleAlert className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#667872]">
              現在の運用判断
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10231F]">
              {loadError
                ? "運用データを読み取れません"
                : queue.length > 0
                  ? `${affectedProjects} Projectに${queue.length}件の確認項目があります`
                  : "現在、明示的な確認項目はありません"}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#61736D]">
              {loadError ??
                (queue.length > 0
                  ? "正式な優先度・担当・SLAはまだ接続していません。各専門画面で内容を確認してください。"
                  : "接続済みデータの範囲では、測定失敗とblocking reasonはありません。")}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary
          label="測定失敗"
          value={`${failedMeasurements}件`}
          note="明示的なmeasurement status"
          tone={failedMeasurements > 0 ? "rose" : "green"}
        />
        <Summary
          label="既存blocking reason"
          value={`${blockingReasonCount}件`}
          note="領域・優先度は未分類"
          tone={blockingReasonCount > 0 ? "amber" : "green"}
        />
        <Summary
          label="公開可能"
          value={`${readyCount}件`}
          note="異常件数ではなく参考値"
          tone="slate"
        />
        <Summary
          label="最終観測"
          value={formatDateTime(latestObservation)}
          note="接続済み測定データ"
          tone="slate"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <DataCard
          title="確認キュー"
          description="推測した優先度は付けず、取得できる事実だけを表示します。"
          action={<Pill label={`${queue.length}件`} tone={queue.length > 0 ? "amber" : "green"} />}
        >
          {queue.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-[#E2EAE8]">
              <div className="hidden grid-cols-[110px_minmax(150px,.8fr)_minmax(260px,1.7fr)_110px] gap-3 px-1 pb-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#84938F] md:grid">
                <span>種別</span>
                <span>Project</span>
                <span>確認内容</span>
                <span>確認先</span>
              </div>
              {queue.slice(0, 12).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group grid gap-3 py-4 md:grid-cols-[110px_minmax(150px,.8fr)_minmax(260px,1.7fr)_110px] md:items-center"
                >
                  <Pill
                    label={item.label}
                    tone={item.kind === "measurement_failure" ? "rose" : "amber"}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#10231F]">
                      {item.project.projectName}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#7A8D87]">
                      {item.project.brandName}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#334A44]">
                    {item.message}
                  </p>
                  <span className="inline-flex items-center justify-end gap-1 text-xs font-black text-[#00796B]">
                    {item.kind === "measurement_failure" ? "測定管理" : "品質レビュー"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </DataCard>

        <div className="space-y-5">
          <DataCard title="運用状態" description="明示的に取得できる状態です。" dense>
            <div className="space-y-3">
              <Status
                icon={<Activity className="h-4 w-4" />}
                label="測定"
                value={failedMeasurements > 0 ? `${failedMeasurements}件失敗` : "失敗なし"}
                tone={failedMeasurements > 0 ? "rose" : "green"}
              />
              <Status
                icon={<CircleAlert className="h-4 w-4" />}
                label="確認項目"
                value={`${blockingReasonCount}件`}
                tone={blockingReasonCount > 0 ? "amber" : "green"}
              />
              <Status
                icon={<Send className="h-4 w-4" />}
                label="公開可能"
                value={`${readyCount}/${data.projects.length || 0} Project`}
                tone="slate"
              />
            </div>
          </DataCard>

          <DataCard title="正式read model" description="誤判定防止のため未接続情報を明示します。" dense>
            <Connection label="AttentionWorkItem" value="未接続" tone="amber" />
            <Connection label="日次運用snapshot" value="未接続" tone="slate" />
            <Connection label="担当・SLA・経過時間" value="未接続" tone="slate" />
            <Connection label="現行Project read" value={loadError ? "取得失敗" : "接続中"} tone={loadError ? "rose" : "green"} />
          </DataCard>
        </div>
      </div>

      <DataCard
        title="次に接続する正式データ"
        description="正常Projectの全件一覧は置かず、運用ホームの正式化に必要な接続だけを示します。"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <NextConnection title="本日の自動処理" text="対象判定、cycle作成、実行中、完了、遅延を同一snapshotで表示します。" />
          <NextConnection title="人の対応" text="domain、severity、担当、SLA、経過時間、専門routeをread modelから受け取ります。" />
          <NextConnection title="公開・システム状態" text="顧客表示の安全状態、scope影響、重要履歴を正式データから表示します。" />
        </div>
      </DataCard>
    </div>
  );
}

function buildQueue(data: RecoraAdminOperationsData): QueueItem[] {
  const items: QueueItem[] = [];

  for (const project of data.projects) {
    if (project.measurementStatus === "失敗") {
      items.push({
        id: `${project.projectSlug}-measurement-failure`,
        project,
        kind: "measurement_failure",
        label: "測定失敗",
        message: "最新の測定runが失敗しています。",
        href: "/internal/measurements"
      });
    }

    project.currentRemainingIssues.forEach((issue, index) => {
      items.push({
        id: `${project.projectSlug}-blocking-${index}`,
        project,
        kind: "blocking_reason",
        label: "要確認",
        message: issue.message?.trim() || "要確認理由を取得できません。",
        href: "/internal/quality"
      });
    });
  }

  return items;
}

function latestObservationAt(data: RecoraAdminOperationsData) {
  return data.projects
    .map((project) => project.latestMeasurementAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function formatDateTime(value: string | null) {
  if (!value) return "未観測";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo"
  }).format(date);
}

function Summary({
  label,
  value,
  note,
  tone
}: {
  label: string;
  value: string;
  note: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE7E4] bg-white px-4 py-4">
      <p className="text-xs font-bold text-[#71837D]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#10231F]">{value}</p>
      <p className="mt-2 text-xs font-semibold text-[#879691]">{note}</p>
      <span className={cn("mt-3 block h-1 rounded-full", barTone(tone))} />
    </div>
  );
}

function Status({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-3 py-3">
      <div className="flex items-center gap-2 text-[#60736C]">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <Pill label={value} tone={tone} />
    </div>
  );
}

function Connection({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="mt-2 flex items-center justify-between rounded-xl bg-[#F7FAF9] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Database className="h-3.5 w-3.5 text-[#71837D]" />
        <p className="text-xs font-bold text-[#435953]">{label}</p>
      </div>
      <Pill label={value} tone={tone} />
    </div>
  );
}

function NextConnection({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#E2EAE8] bg-[#FCFEFD] px-4 py-4">
      <p className="text-sm font-black text-[#10231F]">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#70827C]">{text}</p>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {label}
    </Badge>
  );
}

function Empty() {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-5 text-center">
      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
      <p className="mt-3 text-sm font-black text-emerald-900">明示的な確認項目はありません</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
        正式AttentionWorkItem接続後に、担当・SLAを含む本来のキューへ置き換えます。
      </p>
    </div>
  );
}

function barTone(tone: Tone) {
  if (tone === "green") return "bg-emerald-500";
  if (tone === "amber") return "bg-amber-500";
  if (tone === "rose") return "bg-rose-500";
  return "bg-slate-300";
}
