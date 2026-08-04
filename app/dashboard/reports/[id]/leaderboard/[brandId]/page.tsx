import { RecoraCustomerDashboardV03Page } from "@/components/recora/customer-dashboard-v03";
import {
  normalizeReportSlug,
  renderCustomerReadyReportRoute,
  type ReportSlugPageProps
} from "../../../report-route-guard";

type ReportBrandDetailPageProps = ReportSlugPageProps & {
  params: ReportSlugPageProps["params"] & {
    brandId: string;
  };
};

const competitorNameById: Record<string, string> = {
  trailbase: "Trailbase",
  signalnest: "SignalNest",
  mentionmap: "MentionMap",
  ranklens: "RankLens",
  answergrid: "AnswerGrid",
  queryscope: "QueryScope",
  sourcepilot: "SourcePilot",
  promptatlas: "PromptAtlas",
  visiblenote: "VisibleNote",
  modelwatch: "ModelWatch",
  citemeter: "CiteMeter",
  answerpath: "AnswerPath",
  searchsignal: "SearchSignal",
  referencelab: "ReferenceLab",
  generank: "GeneRank",
  aipresence: "AI Presence",
  mentiontrail: "MentionTrail",
  answerindex: "AnswerIndex",
  citationmap: "CitationMap"
};

export const dynamic = "force-dynamic";

export default async function ReportBrandDetailPage({ params, searchParams }: ReportBrandDetailPageProps) {
  const projectSlug = normalizeReportSlug(params.id);
  const competitorName = competitorNameById[params.brandId] ?? params.brandId;

  return renderCustomerReadyReportRoute(
    projectSlug,
    () => (
      <RecoraCustomerDashboardV03Page
        page="brandCompetitorDetail"
        projectSlug={projectSlug}
        projectName="Recora"
        competitorName={competitorName}
      />
    ),
    { searchParams }
  );
}
