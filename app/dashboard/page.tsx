import { notFound } from "next/navigation";

import { DashboardOverview } from "@/components/recora/dashboard/dashboard-overview";
import {
  getRecoraDesignPreviewLabel,
  isRecoraDesignPreviewEnabled
} from "@/lib/recora/dev-preview/design-preview-access";
import { getRecoraVisualVariant } from "@/lib/recora/dev-preview/design-visual-variant";
import {
  getRecoraRealDbPreviewLabel,
  isRecoraRealDbPreviewEnabled,
  RECORA_REAL_DB_PREVIEW_PROJECT_SLUG
} from "@/lib/recora/dev-preview/real-db-preview-access";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: {
    "design-check"?: string;
    data?: string | string[];
    visual?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  if (searchParams?.["design-check"] === "1" && isRecoraRealDbPreviewEnabled(searchParams)) {
    notFound();
  }

  if (searchParams?.["design-check"] === "1") {
    if (!isRecoraDesignPreviewEnabled()) {
      notFound();
    }

    const { getDesignCheckDashboardData } = await import("@/lib/recora/dev-preview/design-check-report-fixture");

    return (
      <DashboardOverview
        dashboardData={getDesignCheckDashboardData()}
        homeReadModelData={null}
        previewModeLabel={getRecoraDesignPreviewLabel()}
        visualVariant={getRecoraVisualVariant(searchParams)}
      />
    );
  }

  if (isRecoraRealDbPreviewEnabled(searchParams)) {
    const [dashboardData, homeReadModelData] = await Promise.all([
      getDashboardDataOrNull(RECORA_REAL_DB_PREVIEW_PROJECT_SLUG),
      getHomeReadModelDataOrNull(RECORA_REAL_DB_PREVIEW_PROJECT_SLUG)
    ]);

    return (
      <DashboardOverview
        dashboardData={dashboardData}
        homeReadModelData={homeReadModelData}
        previewModeLabel={getRecoraRealDbPreviewLabel(searchParams)}
        previewModeDescription="本番Supabaseの実測データを読み取り専用で表示しています"
        visualVariant={getRecoraVisualVariant(searchParams)}
        readOnlyRealDbPreviewEnabled
      />
    );
  }

  const [dashboardData, homeReadModelData] = await Promise.all([
    getDashboardDataOrNull(),
    getHomeReadModelDataOrNull()
  ]);

  return <DashboardOverview dashboardData={dashboardData} homeReadModelData={homeReadModelData} />;
}

async function getDashboardDataOrNull(projectSlugOverride?: string) {
  try {
    const { getDefaultRecoraProjectSlug, getRecoraDashboardData } = await import("@/lib/recora/db");
    const projectSlug = projectSlugOverride ?? getDefaultRecoraProjectSlug();
    if (!projectSlug) return null;

    const data = await getRecoraDashboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora dashboard data.", error);
    return null;
  }
}

async function getHomeReadModelDataOrNull(projectSlugOverride?: string) {
  try {
    const { getDefaultRecoraProjectSlug, getRecoraHomeReadModelData } = await import("@/lib/recora/db");
    const projectSlug = projectSlugOverride ?? getDefaultRecoraProjectSlug();
    if (!projectSlug) return null;

    const data = await getRecoraHomeReadModelData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora home read model data.", error);
    return null;
  }
}
