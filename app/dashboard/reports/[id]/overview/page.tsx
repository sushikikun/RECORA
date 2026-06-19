import { OverviewPage } from "@/components/recora/report-pages";

const CURRENT_REPORT_SLUG = "recora-kenzai-q2";
const LEGACY_REPORT_SLUG = "recora-growth-q2";

type ReportOverviewPageProps = {
  params: {
    id: string;
  };
};

export default function ReportOverviewPage({ params }: ReportOverviewPageProps) {
  return <OverviewPage projectSlug={normalizeReportSlug(params.id)} />;
}

function normalizeReportSlug(reportSlug: string) {
  return reportSlug === LEGACY_REPORT_SLUG ? CURRENT_REPORT_SLUG : reportSlug;
}
