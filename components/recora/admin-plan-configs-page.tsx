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
  RecoraAdminPlanConfig,
  RecoraAdminPlanConfigsData
} from "@/lib/recora/internal-plan-configs";
import { cn } from "@/lib/utils";

export function AdminPlanConfigsPage({ data }: { data: RecoraAdminPlanConfigsData }) {
  const activeCount = data.plans.filter((plan) => plan.status === "active").length;
  const recommendationPlanCount = data.plans.filter((plan) => plan.customerRecommendationsVisible === true).length;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="料金プラン一覧"
        description="本番側DBの管理用プラン定義を、見るだけで確認します。編集、顧客割り当て、課金処理はここでは行いません。"
        actions={<ReadOnlyBadge />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile label="登録プラン" value={`${data.plans.length}件`} />
        <SummaryTile label="有効プラン" value={`${activeCount}件`} tone="green" />
        <SummaryTile label="改善提案を表示" value={`${recommendationPlanCount}件`} tone="teal" />
      </div>

      <DataCard
        title="現在のプラン定義"
        description="価格や質問数など、あとで変わる値はDBの固定項目ではなくconfigから表示しています。"
        action={
          <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-700">
            recora_admin.plan_configs
          </Badge>
        }
      >
        {data.plans.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm font-bold text-slate-700">表示できるプランがありません</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              本番側DBに料金プランが登録されているか確認してください。
            </p>
          </div>
        ) : (
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[210px]">プラン</TableHead>
                <TableHead className="min-w-[180px]">plan_code</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>価格</TableHead>
                <TableHead>支払い</TableHead>
                <TableHead>AI質問</TableHead>
                <TableHead>モデル</TableHead>
                <TableHead>計測</TableHead>
                <TableHead>改善提案</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.plans.map((plan) => (
                <TableRow key={plan.planCode}>
                  <TableCell>
                    <p className="font-bold text-slate-950">{plan.displayName || "名称未設定"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatPlanFamily(plan)}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-800">{plan.planCode}</TableCell>
                  <TableCell>
                    <StatusBadge status={plan.status} />
                  </TableCell>
                  <TableCell className="font-bold text-slate-950">{formatPrice(plan.priceJpy)}</TableCell>
                  <TableCell>{formatBillingType(plan.billingType)}</TableCell>
                  <TableCell>{formatNumberWithUnit(plan.questionLimit, "問")}</TableCell>
                  <TableCell>{formatNumberWithUnit(plan.modelLimit, "モデル")}</TableCell>
                  <TableCell>{formatRunMode(plan)}</TableCell>
                  <TableCell>
                    <RecommendationBadge visible={plan.customerRecommendationsVisible} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <DataCard
        title="この画面でしないこと"
        description="安全のため、内部運用の確認だけに絞っています。"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <SafetyFact title="編集しない" description="プラン名、価格、質問数はこの画面から変更できません。" />
          <SafetyFact title="割り当てない" description="顧客にどのプランを使わせるかは別の作業で扱います。" />
          <SafetyFact title="課金しない" description="Stripe連携や請求処理はこの画面には含めていません。" />
        </div>
      </DataCard>
    </div>
  );
}

export function AdminPlanConfigsUnavailablePage({ message }: { message: string }) {
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="料金プラン一覧"
        description="管理用プラン定義を読み取れませんでした。秘密情報は表示していません。"
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
  tone?: "slate" | "green" | "teal";
}) {
  const toneClass = {
    slate: "text-slate-950",
    green: "text-emerald-700",
    teal: "text-teal-700"
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="truncate text-xs font-bold text-slate-500">{label}</p>
      <p className={cn("mt-2 truncate text-xl font-bold", toneClass)}>{value}</p>
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

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-sm",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {isActive ? "有効" : status || "未設定"}
    </Badge>
  );
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

function formatPlanFamily(plan: RecoraAdminPlanConfig) {
  if (plan.runMode === "daily_all_questions") return "継続モニタリング";
  if (plan.billingType === "one_time") return "単発診断";
  if (plan.billingType === "free") return "無料プレビュー";
  return "種別未設定";
}

function formatPrice(value: number | null) {
  if (value === null) return "未設定";
  return `${new Intl.NumberFormat("ja-JP").format(value)}円`;
}

function formatBillingType(value: RecoraAdminPlanConfig["billingType"]) {
  if (value === "free") return "無料";
  if (value === "one_time") return "1回払い";
  if (value === "monthly") return "月額";
  return value ?? "未設定";
}

function formatNumberWithUnit(value: number | null, unit: string) {
  if (value === null) return "未設定";
  return `${new Intl.NumberFormat("ja-JP").format(value)}${unit}`;
}

function formatRunMode(plan: RecoraAdminPlanConfig) {
  if (plan.runMode === "one_time" || plan.cadence === "once") return "1回診断";
  if (plan.runMode === "daily_all_questions" || plan.cadence === "daily") return "毎日計測";
  return plan.runMode ?? plan.cadence ?? "未設定";
}
