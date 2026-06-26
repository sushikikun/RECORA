import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { DataCard, PageHeader } from "@/components/recora/ui";
import {
  canUseRecoraDesignCheck,
  getRecoraDesignPreviewLabel,
  isRecoraDesignCheckSlug
} from "@/lib/recora/dev-preview/design-preview-access";

export const CURRENT_REPORT_SLUG = "mieruca-seo-demo";
export const LEGACY_REPORT_SLUG = "recora-growth-q2";

export type ReportSlugPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    visual?: string;
  };
};

export function getDefaultReportSlug() {
  return process.env.RECORA_DEFAULT_PROJECT_SLUG?.trim() ?? "";
}

export function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}

export function isDesignCheckReportSlug(projectSlug: string) {
  return isRecoraDesignCheckSlug(projectSlug);
}

export function canUseDesignCheckReport(projectSlug: string) {
  return canUseRecoraDesignCheck(projectSlug);
}

export function assertPublicReportRouteAllowed(projectSlug: string) {
  if (isDesignCheckReportSlug(projectSlug) && !canUseDesignCheckReport(projectSlug)) {
    notFound();
  }
}

export async function renderCustomerReadyReportRoute(
  projectSlug: string,
  renderReadyRoute: () => ReactNode | Promise<ReactNode>
) {
  const normalizedSlug = normalizeReportSlug(projectSlug);

  if (canUseDesignCheckReport(normalizedSlug)) {
    return (
      <>
        <DesignCheckPreviewNotice />
        {await renderReadyRoute()}
      </>
    );
  }

  assertPublicReportRouteAllowed(normalizedSlug);

  if (!(await isCustomerReadyReport(normalizedSlug))) {
    return <ReportPreparationPage />;
  }

  return renderReadyRoute();
}

export async function isCustomerReadyReport(projectSlug: string) {
  const normalizedSlug = normalizeReportSlug(projectSlug);

  if (canUseDesignCheckReport(normalizedSlug)) return true;

  assertPublicReportRouteAllowed(normalizedSlug);

  const dashboardData = await getReportRouteDashboardDataOrNull(normalizedSlug);
  return dashboardData?.reportReadyGate.status === "customer_ready";
}

export async function getReportRouteDashboardDataOrNull(projectSlug: string) {
  const normalizedSlug = normalizeReportSlug(projectSlug.trim());
  if (!normalizedSlug) return null;

  if (canUseDesignCheckReport(normalizedSlug)) {
    const { getDesignCheckDashboardData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");
    return getDesignCheckDashboardData();
  }

  assertPublicReportRouteAllowed(normalizedSlug);

  try {
    const { getRecoraDashboardData } = await import("@/lib/recora/db");
    const dashboardData = await getRecoraDashboardData(normalizedSlug);
    return dashboardData.project ? dashboardData : null;
  } catch (error) {
    console.warn("Failed to load Recora report readiness data.", getSafeReportRouteError(error));
    return null;
  }
}

export function ReportPreparationPage() {
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="レポート準備中"
        title="このレポートは公開準備中です"
        description="計測データ、集計結果、参照元、改善候補の確認が完了すると、このURLでレポートを閲覧できます。準備が整うまで、サンプル値や内部確認用の情報は表示しません。"
      />

      <DataCard
        title="現在表示できるレポートはありません"
        description="公開前の確認が残っているため、顧客向け画面では安全な準備中表示に切り替えています。"
      >
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-slate-700">準備が完了するとレポートを表示します</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            管理者が実測データと公開可否を確認したあと、AI回答、ブランド比較、参照元、改善候補を確認できます。
          </p>
        </div>
      </DataCard>
    </div>
  );
}

export function DesignCheckPreviewNotice() {
  const label = getRecoraDesignPreviewLabel();

  if (!label) return null;

  return (
    <div className="mb-2 flex min-h-7 flex-wrap items-center gap-2 text-xs text-[#005C50]">
      <span className="inline-flex h-6 items-center rounded-sm border border-[#BFDAD4] bg-[#E6F4F1] px-2 font-bold">
        {label}
      </span>
      <span className="font-semibold text-[#0F766E]">本物の顧客データではありません</span>
    </div>
  );
}

function getSafeReportRouteError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      message: typeof record.message === "string" ? record.message : undefined,
      details: typeof record.details === "string" ? record.details : undefined
    };
  }

  return { message: String(error) };
}
