import { CheckCircle2, Eye, LockKeyhole, MinusCircle } from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  RecoraAdminCustomerOpsData,
  RecoraAdminCustomerOpsItem
} from "@/lib/recora/internal-customer-ops";
import { cn } from "@/lib/utils";

export function AdminCustomerOpsPage({ data }: { data: RecoraAdminCustomerOpsData }) {
  const activeSubscriptions = data.customers.filter((customer) => customer.subscriptionStatus === "active").length;
  const scheduledCustomers = data.customers.filter((customer) => customer.scheduleId).length;
  const pendingReports = data.customers.filter((customer) =>
    ["pending_review", "needs_fix"].includes(customer.latestReportReviewStatus ?? "")
  ).length;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="顧客運用一覧"
        description="顧客ごとの契約プラン、計測予定、計測待ち、レポート公開確認をまとめて確認します。編集や実行は行いません。"
        actions={<ReadOnlyBadge />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="顧客" value={`${data.customers.length}件`} />
        <SummaryTile label="有効契約" value={`${activeSubscriptions}件`} tone="green" />
        <SummaryTile label="計測予定あり" value={`${scheduledCustomers}件`} tone="teal" />
        <SummaryTile label="公開確認待ち" value={`${pendingReports}件`} tone={pendingReports > 0 ? "amber" : "slate"} />
      </div>

      <DataCard
        title="顧客ごとの契約・運用状態"
        description="管理用DBの必要な状態だけを、サーバー側の読み取り口から表示しています。"
        action={
          <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-700">
            customer ops
          </Badge>
        }
      >
        {data.customers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1660px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[230px]">顧客</TableHead>
                  <TableHead className="min-w-[210px]">プロジェクト</TableHead>
                  <TableHead>顧客状態</TableHead>
                  <TableHead>優先度</TableHead>
                  <TableHead className="min-w-[190px]">契約プラン</TableHead>
                  <TableHead>契約状態</TableHead>
                  <TableHead className="min-w-[170px]">支払い</TableHead>
                  <TableHead>期間開始</TableHead>
                  <TableHead>期間終了</TableHead>
                  <TableHead>AI質問</TableHead>
                  <TableHead>モデル</TableHead>
                  <TableHead>計測</TableHead>
                  <TableHead>改善提案</TableHead>
                  <TableHead>計測予定</TableHead>
                  <TableHead>次回計測</TableHead>
                  <TableHead>最終計測</TableHead>
                  <TableHead>最新batch</TableHead>
                  <TableHead>公開確認</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customers.map((customer) => (
                  <TableRow key={`${customer.organizationId}-${customer.projectId ?? "organization"}`}>
                    <TableCell>
                      <p className="font-bold text-slate-950">{customer.organizationName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        担当: {customer.internalOwner || "未設定"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-800">{customer.projectName || "代表project未設定"}</p>
                      <p className="mt-1 font-mono text-xs font-bold text-slate-500">
                        {shortId(customer.projectId)}
                      </p>
                    </TableCell>
                    <TableCell><LifecycleBadge status={customer.customerLifecycleStatus} /></TableCell>
                    <TableCell><PriorityBadge priority={customer.priority} /></TableCell>
                    <TableCell>
                      {customer.planDisplayName ? (
                        <>
                          <p className="font-bold text-slate-950">{customer.planDisplayName}</p>
                          <p className="mt-1 font-mono text-xs font-bold text-slate-500">{customer.planCode}</p>
                        </>
                      ) : (
                        <MissingPlan />
                      )}
                    </TableCell>
                    <TableCell><SubscriptionBadge status={customer.subscriptionStatus} /></TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-800">{formatBillingMode(customer.billingMode)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatPlanPrice(customer.priceJpy, customer.billingType)}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(customer.currentPeriodStart)}</TableCell>
                    <TableCell>{formatDate(customer.currentPeriodEnd)}</TableCell>
                    <TableCell>{formatNumberWithUnit(customer.questionLimit, "問")}</TableCell>
                    <TableCell>{formatNumberWithUnit(customer.modelLimit, "モデル")}</TableCell>
                    <TableCell>{formatRunMode(customer)}</TableCell>
                    <TableCell><RecommendationBadge visible={customer.customerRecommendationsVisible} /></TableCell>
                    <TableCell>
                      <ScheduleBadge status={customer.scheduleStatus} />
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatScheduleType(customer.scheduleType)}
                      </p>
                    </TableCell>
                    <TableCell>{formatDateTime(customer.nextRunAt)}</TableCell>
                    <TableCell>{formatDateTime(customer.lastRunAt)}</TableCell>
                    <TableCell>
                      <BatchBadge status={customer.latestBatchStatus} />
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(customer.latestBatchQueuedAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ReportReviewBadge status={customer.latestReportReviewStatus} />
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(customer.latestReportReviewUpdatedAt)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataCard>

      <DataCard title="安全境界" description="この画面は顧客運用の確認だけに絞っています。">
        <div className="grid gap-3 md:grid-cols-3">
          <SafetyFact title="見るだけ" description="契約作成、プラン割り当て、計測開始、公開承認はできません。" />
          <SafetyFact title="内部限定" description="顧客用dashboardにはこの画面へのリンクを出しません。" />
          <SafetyFact title="秘密情報なし" description="鍵、DB URL、AI回答本文、内部メモ本文は表示しません。" />
        </div>
      </DataCard>
    </div>
  );
}

export function AdminCustomerOpsUnavailablePage({ message }: { message: string }) {
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="顧客運用一覧"
        description="顧客ごとの契約・運用状態を読み取れませんでした。秘密情報は表示していません。"
        actions={<ReadOnlyBadge />}
      />

      <DataCard title="読み取りに失敗しました" description="サーバー側の読み取り設定を確認してください。">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {message}
        </div>
      </DataCard>
    </div>
  );
}

function ReadOnlyBadge() {
  return (
    <Badge variant="outline" className="rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700">
      <Eye className="mr-1 h-3.5 w-3.5" />
      read-only
    </Badge>
  );
}

function SummaryTile({
  label,
  value,
  tone = "slate"
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "teal" | "amber";
}) {
  const toneClass = {
    slate: "text-slate-950",
    green: "text-emerald-700",
    teal: "text-teal-700",
    amber: "text-amber-700"
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="truncate text-xs font-bold text-slate-500">{label}</p>
      <p className={cn("mt-2 truncate text-xl font-bold", toneClass)}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-bold text-slate-700">表示できる顧客契約情報がありません</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        顧客プロフィールが登録されると、契約プラン、計測予定、レポート公開確認がここに表示されます。
      </p>
    </div>
  );
}

function MissingPlan() {
  return (
    <div>
      <p className="font-bold text-slate-950">契約なし</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">プラン未設定</p>
    </div>
  );
}

function SafetyFact({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
      <span>
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
    </div>
  );
}

function LifecycleBadge({ status }: { status: string | null }) {
  return <SimpleBadge label={formatLifecycleStatus(status)} tone={status === "paid" ? "green" : "slate"} />;
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const tone = priority === "urgent" || priority === "high" ? "amber" : "slate";
  return <SimpleBadge label={formatPriority(priority)} tone={tone} />;
}

function SubscriptionBadge({ status }: { status: string | null }) {
  if (!status) return <SimpleBadge label="契約なし" tone="slate" />;
  const tone = status === "active" || status === "trialing" ? "green" : status === "past_due" ? "amber" : "slate";
  return <SimpleBadge label={formatSubscriptionStatus(status)} tone={tone} />;
}

function ScheduleBadge({ status }: { status: string | null }) {
  if (!status) return <SimpleBadge label="予定なし" tone="slate" />;
  return <SimpleBadge label={formatScheduleStatus(status)} tone={status === "active" ? "green" : "slate"} />;
}

function BatchBadge({ status }: { status: string | null }) {
  if (!status) return <SimpleBadge label="計測待ちなし" tone="slate" />;
  const tone = status === "queued" ? "amber" : status === "running" ? "teal" : status === "failed" ? "rose" : "green";
  return <SimpleBadge label={formatBatchStatus(status)} tone={tone} />;
}

function ReportReviewBadge({ status }: { status: string | null }) {
  if (!status) return <SimpleBadge label="確認なし" tone="slate" />;
  const tone = status === "published" || status === "approved" ? "green" : status === "needs_fix" ? "amber" : "slate";
  return <SimpleBadge label={formatReportReviewStatus(status)} tone={tone} />;
}

function RecommendationBadge({ visible }: { visible: boolean | null }) {
  const enabled = visible === true;
  const Icon = enabled ? CheckCircle2 : MinusCircle;

  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-sm",
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      <Icon className="mr-1 h-3.5 w-3.5" />
      {enabled ? "あり" : visible === false ? "なし" : "未設定"}
    </Badge>
  );
}

function SimpleBadge({
  label,
  tone
}: {
  label: string;
  tone: "slate" | "green" | "teal" | "amber" | "rose";
}) {
  const className = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700"
  }[tone];

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      {label}
    </Badge>
  );
}

function formatLifecycleStatus(value: string | null) {
  const labels: Record<string, string> = {
    lead: "リード",
    free_diagnostic: "無料診断",
    trial: "トライアル",
    paid: "有料",
    paused: "停止中",
    churned: "解約済み",
    rejected: "対象外"
  };
  return value ? labels[value] ?? value : "未設定";
}

function formatPriority(value: string | null) {
  const labels: Record<string, string> = {
    low: "低",
    normal: "通常",
    high: "高",
    urgent: "緊急"
  };
  return value ? labels[value] ?? value : "未設定";
}

function formatSubscriptionStatus(value: string) {
  const labels: Record<string, string> = {
    free_diagnostic: "無料診断",
    trialing: "トライアル",
    active: "有効",
    past_due: "支払い確認",
    paused: "停止中",
    canceled: "キャンセル",
    suspended: "停止",
    ended: "終了"
  };
  return labels[value] ?? value;
}

function formatBillingType(value: string | null) {
  if (value === "free") return "無料";
  if (value === "one_time") return "1回払い";
  if (value === "monthly") return "月額";
  return value ?? "未設定";
}

function formatBillingMode(value: string | null) {
  if (value === "manual") return "手動管理";
  if (value === "stripe") return "Stripe";
  if (value === "invoice") return "請求書";
  return value ?? "支払い未設定";
}

function formatPrice(value: number | null) {
  if (value === null) return "価格未設定";
  return `${new Intl.NumberFormat("ja-JP").format(value)}円`;
}

function formatPlanPrice(priceJpy: number | null, billingType: string | null) {
  return `${formatPrice(priceJpy)} / ${formatBillingType(billingType)}`;
}

function formatNumberWithUnit(value: number | null, unit: string) {
  if (value === null) return "未設定";
  return `${new Intl.NumberFormat("ja-JP").format(value)}${unit}`;
}

function formatRunMode(customer: RecoraAdminCustomerOpsItem) {
  if (customer.runMode === "one_time" || customer.cadence === "once") return "1回診断";
  if (customer.runMode === "daily_all_questions" || customer.cadence === "daily") return "毎日計測";
  return customer.runMode ?? customer.cadence ?? "未設定";
}

function formatScheduleType(value: string | null) {
  const labels: Record<string, string> = {
    manual: "手動",
    free_diagnostic_once: "無料診断",
    weekly_1: "週1回",
    weekly_2: "週2回",
    custom: "カスタム"
  };
  return value ? labels[value] ?? value : "予定未設定";
}

function formatScheduleStatus(value: string) {
  const labels: Record<string, string> = {
    active: "有効",
    paused: "停止中",
    canceled: "キャンセル",
    ended: "終了"
  };
  return labels[value] ?? value;
}

function formatBatchStatus(value: string) {
  const labels: Record<string, string> = {
    queued: "計測待ち",
    running: "計測中",
    completed: "完了",
    completed_with_errors: "一部失敗",
    failed: "失敗",
    retryable: "再試行待ち",
    skipped: "スキップ",
    canceled: "キャンセル"
  };
  return labels[value] ?? value;
}

function formatReportReviewStatus(value: string) {
  const labels: Record<string, string> = {
    pending_review: "確認待ち",
    approved: "承認済み",
    published: "公開済み",
    needs_fix: "修正待ち",
    rejected: "却下",
    unpublished: "非公開"
  };
  return labels[value] ?? value;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo"
  }).format(date);
}

function shortId(value: string | null) {
  if (!value) return "-";
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
