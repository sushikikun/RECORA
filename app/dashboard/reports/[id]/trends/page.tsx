import { redirect } from "next/navigation";
import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { canUseCustomerReportDesignLabReport } from "@/lib/recora/customer-report-design-lab/access";
import {
  assertPublicReportRouteAllowed,
  canUseDesignCheckReport,
  normalizeReportSlug,
  type ReportSlugPageProps
} from "../../report-route-guard";

export const dynamic = "force-dynamic";

export default async function ReportTrendsPage({ params, searchParams }: ReportSlugPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  if (canUseCustomerReportDesignLabReport(projectSlug, searchParams)) {
    return <CustomerReportDesignLab activePage="trends" />;
  }

  assertPublicReportRouteAllowed(projectSlug);

  if (canUseDesignCheckReport(projectSlug)) {
    redirect("/dashboard?design-check=1#trends");
  }

  redirect("/dashboard#trends");
}
