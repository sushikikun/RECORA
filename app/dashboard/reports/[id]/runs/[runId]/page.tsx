import { redirect } from "next/navigation";
import {
  normalizeReportSlug
} from "../../../report-route-guard";

type ReportRunDetailPageProps = {
  params: {
    id: string;
    runId: string;
  };
};

export const dynamic = "force-dynamic";

export default function ReportRunDetailPage({ params }: ReportRunDetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);

  redirect(`/dashboard/reports/${projectSlug}`);
}
