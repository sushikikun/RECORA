import { notFound } from "next/navigation";

import { DashboardOverview } from "@/components/recora/dashboard/dashboard-overview";
import {
  getRecoraDesignPreviewLabel,
  isRecoraDesignPreviewEnabled
} from "@/lib/recora/dev-preview/design-preview-access";
import { getRecoraVisualVariant } from "@/lib/recora/dev-preview/design-visual-variant";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: {
    "design-check"?: string;
    visual?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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

  const [dashboardData, homeReadModelData] = await Promise.all([
    getDashboardDataOrNull(),
    getHomeReadModelDataOrNull()
  ]);

  return <DashboardOverview dashboardData={dashboardData} homeReadModelData={homeReadModelData} />;
}

async function getDashboardDataOrNull() {
  try {
    const { getDefaultRecoraProjectSlug, getRecoraDashboardData } = await import("@/lib/recora/db");
    const projectSlug = getDefaultRecoraProjectSlug();
    if (!projectSlug) return null;

    const data = await getRecoraDashboardData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora dashboard data.", error);
    return null;
  }
}

async function getHomeReadModelDataOrNull() {
  try {
    const { getDefaultRecoraProjectSlug, getRecoraHomeReadModelData } = await import("@/lib/recora/db");
    const projectSlug = getDefaultRecoraProjectSlug();
    if (!projectSlug) return null;

    const data = await getRecoraHomeReadModelData(projectSlug);
    return data.project ? data : null;
  } catch (error) {
    console.warn("Failed to load Recora home read model data.", error);
    return null;
  }
}
