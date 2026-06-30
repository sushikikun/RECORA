import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Database,
  FileText,
  Lightbulb,
  MessageSquareText,
  Radar,
  Swords,
  type LucideIcon
} from "lucide-react";

import {
  DataRichBadge,
  DataRichEmpty,
  DataRichInlineBar,
  DataRichKpiStrip,
  DataRichPanel,
  DataRichTableWrap
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type RecoraVisualVariant,
  withRecoraVisualVariantSearchParam
} from "@/lib/recora/dev-preview/design-visual-variant";
import { withRecoraRealDbPreviewSearchParam } from "@/lib/recora/dev-preview/real-db-preview-url";
import {
  getRecoraMeasurementPurposeLabel,
  getRecoraPromptTypeLabel
} from "@/lib/recora/prompt-scope";
import type {
  RecoraReportViewModel,
  ReportCitationDomainRow,
  ReportCitationUrlRow,
  ReportDataAvailability,
  ReportDataStatus,
  ReportMetricValue,
  ReportMeasurementPurpose,
  ReportPromptScopeFilterOption,
  ReportPromptType,
  ReportRecommendationRow,
  ReportSegmentPerformanceRow,
  ReportTabId,
  ReportUnavailableOr
} from "@/lib/recora/report-tabs-view-model";

export const RECORA_REPORT_TAB_SEARCH_PARAM = "reportTab";

const reportTabIds: ReportTabId[] = [
  "overview",
  "brand_competitors",
  "persona_topics",
  "prompts",
  "answers",
  "citations",
  "recommendations"
];

const reportTabIcons: Record<ReportTabId, LucideIcon> = {
  overview: Radar,
  brand_competitors: Swords,
  persona_topics: BarChart3,
  prompts: FileText,
  answers: MessageSquareText,
  citations: Database,
  recommendations: Lightbulb
};

export function normalizeRecoraReportTabId(value: unknown): ReportTabId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && reportTabIds.includes(candidate as ReportTabId)
    ? candidate as ReportTabId
    : "overview";
}

export function RecoraReportTabs({
  model,
  activeTab,
  reportBase,
  visualVariant,
  readOnlyRealDbPreviewEnabled = false,
  overview
}: {
  model: RecoraReportViewModel;
  activeTab: ReportTabId;
  reportBase: string;
  visualVariant: RecoraVisualVariant;
  readOnlyRealDbPreviewEnabled?: boolean;
  overview: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <ReportTabsNavigation
        model={model}
        activeTab={activeTab}
        reportBase={reportBase}
        visualVariant={visualVariant}
        readOnlyRealDbPreviewEnabled={readOnlyRealDbPreviewEnabled}
      />
      <ReportTabPanel model={model} activeTab={activeTab} overview={overview} />
    </div>
  );
}

function ReportTabsNavigation({
  model,
  activeTab,
  reportBase,
  visualVariant,
  readOnlyRealDbPreviewEnabled
}: {
  model: RecoraReportViewModel;
  activeTab: ReportTabId;
  reportBase: string;
  visualVariant: RecoraVisualVariant;
  readOnlyRealDbPreviewEnabled: boolean;
}) {
  return (
    <nav
      aria-label="Report sections"
      role="tablist"
      className="grid min-w-0 gap-2 rounded-lg border border-[#DFE6E2] bg-white p-2 md:grid-cols-2 xl:grid-cols-7"
    >
      {model.tabs.order.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = reportTabIcons[tab.id];

        return (
          <Link
            key={tab.id}
            href={getReportTabHref(reportBase, tab.id, visualVariant, readOnlyRealDbPreviewEnabled)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex min-h-16 min-w-0 flex-col justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57] focus-visible:ring-offset-2",
              isActive
                ? "border-[#006B57]/35 bg-[#EAF6F0] text-[#005548]"
                : "border-[#DFE6E2] bg-[#FAFCFB] text-[#334155] hover:border-[#006B57]/25"
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span className="line-clamp-2 text-[12px] font-bold leading-4 tracking-normal">{tab.label}</span>
            </span>
            <StatusBadge status={tab.availability.status} />
          </Link>
        );
      })}
    </nav>
  );
}

function getReportTabHref(
  reportBase: string,
  tabId: ReportTabId,
  visualVariant: RecoraVisualVariant,
  readOnlyRealDbPreviewEnabled: boolean
) {
  const href = tabId === "overview"
    ? reportBase
    : `${reportBase}?${RECORA_REPORT_TAB_SEARCH_PARAM}=${tabId}`;
  const visualHref = withRecoraVisualVariantSearchParam(href, visualVariant);
  return withRecoraRealDbPreviewSearchParam(visualHref, readOnlyRealDbPreviewEnabled);
}

function ReportTabPanel({
  model,
  activeTab,
  overview
}: {
  model: RecoraReportViewModel;
  activeTab: ReportTabId;
  overview: ReactNode;
}) {
  if (activeTab === "overview") return <>{overview}</>;
  if (activeTab === "brand_competitors") return <BrandCompetitorsTab model={model} />;
  if (activeTab === "persona_topics") return <PersonaTopicsTab model={model} />;
  if (activeTab === "prompts") return <PromptsTab model={model} />;
  if (activeTab === "answers") return <AnswersTab model={model} />;
  if (activeTab === "citations") return <CitationsTab model={model} />;
  return <RecommendationsTab model={model} />;
}

function BrandCompetitorsTab({ model }: { model: RecoraReportViewModel }) {
  const tab = model.tabs.brandCompetitors;

  return (
    <div className="min-w-0 space-y-3">
      <TabHeader
        title="Brand and competitors"
        question="Where does the target brand win or lose against competitors?"
        availability={tab.availability}
      />
      <DataRichPanel
        title="Brand ranking"
        description="Ranking rows use observed metric snapshots or eligible prompt observations."
        bodyClassName="p-0"
      >
        {tab.rankingRows.length > 0 ? (
          <DataRichTableWrap>
            <Table className="w-full table-fixed text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]">Rank</TableHead>
                  <TableHead className="w-[220px]">Brand</TableHead>
                  <TableHead className="w-[180px]">AI presence</TableHead>
                  <TableHead className="w-[130px]">SOV</TableHead>
                  <TableHead className="w-[130px]">Avg. position</TableHead>
                  <TableHead className="w-[120px]">Basis</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tab.rankingRows.slice(0, 8).map((row) => (
                  <TableRow key={row.brand.brandId} className={row.brand.isPrimary ? "bg-[#EAF6F0]/60" : undefined}>
                    <TableCell className="font-bold tabular-nums text-[#0F172A]">{row.rank}</TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="min-w-0 truncate font-bold text-[#0F172A]" title={row.brand.name}>{row.brand.name}</span>
                        {row.brand.isPrimary ? <DataRichBadge tone="green">Primary</DataRichBadge> : null}
                      </div>
                    </TableCell>
                    <TableCell><MetricInline metric={row.aiPresenceRate} /></TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.shareOfVoice)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.averagePosition)}</TableCell>
                    <TableCell className="text-[12px] font-semibold text-[#64748B]">{row.basis}</TableCell>
                    <TableCell><StatusBadge status={row.availability.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataRichTableWrap>
        ) : (
          <TabEmptyState availability={tab.availability} fallback="Brand ranking rows are not available." />
        )}
      </DataRichPanel>
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <DataRichPanel title="Competitor gaps" description="Primary brand deltas are kept separate from answer-text evidence." bodyClassName="p-0">
          {tab.comparisonRows.length > 0 ? (
            <CompactComparisonTable rows={tab.comparisonRows.slice(0, 6)} />
          ) : (
            <TabEmptyState availability={tab.availability} fallback="Competitor comparison rows are not available." />
          )}
        </DataRichPanel>
        <DataRichPanel title="Narrative and sentiment readiness" description="Narrative and sentiment are shown only when extracted labels exist.">
          <div className="grid min-w-0 gap-2">
            <AvailabilityLine label="Narrative comparison" availability={tab.narrativeComparison.availability} />
            <AvailabilityLine label="Sentiment comparison" availability={tab.sentimentComparison.availability} />
          </div>
        </DataRichPanel>
      </div>
    </div>
  );
}

function PersonaTopicsTab({ model }: { model: RecoraReportViewModel }) {
  const tab = model.tabs.personaTopics;

  return (
    <div className="min-w-0 space-y-3">
      <TabHeader
        title="Personas, use cases, and topics"
        question="Which personas, use cases, funnel stages, and topics are weak?"
        availability={tab.availability}
      />
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <SegmentPanel title="Persona performance" rows={tab.personaRows} />
        <SegmentPanel title="Use-case performance" rows={tab.useCaseRows} />
        <SegmentPanel title="Funnel-stage performance" rows={tab.funnelStageRows} />
        <SegmentPanel title="Topic coverage" rows={tab.topicRows} />
      </div>
      <DataRichPanel
        title="Category trend"
        description="Category stays secondary to persona, use case, funnel stage, and topic."
        bodyClassName="p-0"
      >
        {tab.categoryRows.value && tab.categoryRows.value.length > 0 ? (
          <SegmentTable rows={tab.categoryRows.value.slice(0, 6)} />
        ) : (
          <TabEmptyState availability={tab.categoryRows.availability} fallback="Category rows are not available." />
        )}
      </DataRichPanel>
      <DataRichPanel title="Persona x topic heatmap" description="Displayed when prompt metadata supports the cross-tab view.">
        <AvailabilityLine label="Heatmap readiness" availability={tab.personaTopicHeatmap.availability} />
      </DataRichPanel>
    </div>
  );
}

function PromptsTab({ model }: { model: RecoraReportViewModel }) {
  const tab = model.tabs.prompts;

  return (
    <div className="min-w-0 space-y-3">
      <TabHeader
        title="Prompts"
        question="Which prompts create the visibility or ranking gaps?"
        availability={tab.availability}
      />
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <DataRichPanel
          title="Prompt scope metadata"
          description="Formal prompt_type metadata keeps non-branded visibility/ranking/SOV separate from branded sentiment and citation-check prompts."
        >
          <AvailabilityLine label="prompt_type" availability={tab.promptTypeAvailability} />
          <PromptScopeFilterPills options={tab.promptTypeFilters} />
        </DataRichPanel>
        <DataRichPanel
          title="Measurement purpose metadata"
          description="Formal measurement_purpose metadata prevents visibility/ranking/SOV, sentiment, brand perception, and citation validation from being mixed."
        >
          <AvailabilityLine label="measurement_purpose" availability={tab.measurementPurposeAvailability} />
          <PromptScopeFilterPills options={tab.measurementPurposeFilters} />
        </DataRichPanel>
      </div>
      <DataRichPanel
        title="Prompt rows"
        description="Rows keep inferred, missing, or unknown scope out of official metric eligibility until explicit metadata exists."
        bodyClassName="p-0"
      >
        {tab.promptRows.length > 0 ? (
          <DataRichTableWrap>
            <Table className="w-full table-fixed text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[310px]">Prompt</TableHead>
                  <TableHead className="w-[130px]">Type</TableHead>
                  <TableHead className="w-[150px]">Purpose</TableHead>
                  <TableHead className="w-[170px]">Persona / topic</TableHead>
                  <TableHead className="w-[130px]">AI presence</TableHead>
                  <TableHead className="w-[100px]">SOV</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tab.promptRows.slice(0, 10).map((row) => (
                  <TableRow key={row.promptId}>
                    <TableCell>
                      <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#0F172A]" title={row.promptText}>{row.promptText}</p>
                    </TableCell>
                    <TableCell><PromptScopeValueText item={row.promptType} getLabel={getRecoraPromptTypeLabel} /></TableCell>
                    <TableCell><PromptScopeValueText item={row.measurementPurpose} getLabel={getRecoraMeasurementPurposeLabel} /></TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-[12px] font-semibold leading-5 text-[#475569]">
                        {row.personaName ?? "No persona"} / {row.topicName ?? "No topic"}
                      </p>
                    </TableCell>
                    <TableCell><MetricInline metric={row.aiPresenceRate} /></TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.shareOfVoice)}</TableCell>
                    <TableCell><StatusBadge status={row.availability.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataRichTableWrap>
        ) : (
          <TabEmptyState availability={tab.availability} fallback="Prompt rows are not available." />
        )}
      </DataRichPanel>
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <DataRichPanel title="Competitor-only prompts" description="Shown only when prompt scope can be verified.">
          <AvailabilityLine label="Rows" availability={tab.competitorOnlyPrompts.availability} />
        </DataRichPanel>
        <DataRichPanel title="Weak own-brand prompts" description="Position extraction is required before ranking weakness labels appear.">
          <AvailabilityLine label="Rows" availability={tab.weakOwnBrandPrompts.availability} />
        </DataRichPanel>
      </div>
    </div>
  );
}

function PromptScopeFilterPills<TValue extends ReportPromptType | ReportMeasurementPurpose>({
  options
}: {
  options: Array<ReportPromptScopeFilterOption<TValue>>;
}) {
  return (
    <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
      {options.map((option) => (
        <span
          key={option.value}
          className="inline-flex max-w-full items-center gap-1 rounded-sm border border-[#DFE6E2] bg-white px-2 py-1 text-[11px] font-bold leading-4 text-[#334155]"
          title={option.value}
        >
          <span className="truncate">{option.label}</span>
          <span className="tabular-nums text-[#64748B]">{option.promptCount}</span>
        </span>
      ))}
    </div>
  );
}

function AnswersTab({ model }: { model: RecoraReportViewModel }) {
  const tab = model.tabs.answers;

  return (
    <div className="min-w-0 space-y-3">
      <TabHeader
        title="AI answers and ranking"
        question="What did AI actually answer and how was the brand treated?"
        availability={tab.availability}
      />
      <div className="grid min-w-0 gap-3 xl:grid-cols-4">
        <StatusPanel title="Sentiment labels" availability={tab.sentimentSummary.availability} />
        <StatusPanel title="Narrative labels" availability={tab.narrativeSummary.availability} />
        <StatusPanel title="Caveat labels" availability={tab.caveatSummary.availability} />
        <StatusPanel title="Position labels" availability={tab.positionSummary.availability} />
      </div>
      <DataRichPanel title="Answer rows" description="Answer labels remain needs_extraction until evidence-backed fields exist." bodyClassName="p-0">
        {tab.answerRows.length > 0 ? (
          <DataRichTableWrap>
            <Table className="w-full table-fixed text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Prompt</TableHead>
                  <TableHead className="w-[130px]">Model</TableHead>
                  <TableHead className="w-[130px]">Brand</TableHead>
                  <TableHead className="w-[120px]">Position</TableHead>
                  <TableHead className="w-[130px]">Sentiment</TableHead>
                  <TableHead className="w-[100px]">Citations</TableHead>
                  <TableHead className="w-[320px]">Answer excerpt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tab.answerRows.slice(0, 10).map((row) => (
                  <TableRow key={row.conversationId}>
                    <TableCell className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#0F172A]">
                      {row.promptText ?? "Prompt unavailable"}
                    </TableCell>
                    <TableCell className="text-[12px] font-semibold text-[#475569]">{row.modelLabel ?? "-"}</TableCell>
                    <TableCell>{row.targetBrandMentioned ? <DataRichBadge tone="green">mentioned</DataRichBadge> : <DataRichBadge>missing</DataRichBadge>}</TableCell>
                    <TableCell><UnavailableOrText item={row.targetBrandPosition} /></TableCell>
                    <TableCell><UnavailableOrText item={row.targetBrandSentiment} /></TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatNumber(row.citationOccurrenceCount)}</TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-[12px] leading-5 text-[#475569]" title={row.answerExcerpt ?? undefined}>
                        {row.answerExcerpt ?? "Answer text unavailable"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataRichTableWrap>
        ) : (
          <TabEmptyState availability={tab.availability} fallback="AI answer rows are not available." />
        )}
      </DataRichPanel>
    </div>
  );
}

function CitationsTab({ model }: { model: RecoraReportViewModel }) {
  const tab = model.tabs.citations;

  return (
    <div className="min-w-0 space-y-3">
      <TabHeader
        title="Sources and citations"
        question="Which URLs and domains are used as evidence?"
        availability={tab.availability}
      />
      <DataRichKpiStrip
        columns="xl:grid-cols-3"
        items={[
          {
            label: "Owned domain citation rate",
            value: formatMetricValue(tab.ownedDomainCitationRate),
            helper: tab.ownedDomainCitationRate.caution,
            tone: tab.ownedDomainCitationRate.availability.status === "available" ? "green" : "amber"
          },
          {
            label: "Owner type",
            value: tab.ownerTypeAvailability.status,
            helper: tab.ownerTypeAvailability.message
          },
          {
            label: "Source freshness",
            value: tab.sourceFreshnessAvailability.status,
            helper: tab.sourceFreshnessAvailability.message
          }
        ]}
      />
      <DataRichPanel title="Source domains" description="Owner type is not inferred beyond explicit or partial metadata." bodyClassName="p-0">
        {tab.domainRows.length > 0 ? (
          <DomainTable rows={tab.domainRows.slice(0, 8)} />
        ) : (
          <TabEmptyState availability={tab.availability} fallback="Citation domain rows are not available." />
        )}
      </DataRichPanel>
      <DataRichPanel title="Citation URLs" description="URL rows are observed citations, not source-to-claim validation." bodyClassName="p-0">
        {tab.urlRows.length > 0 ? (
          <UrlTable rows={tab.urlRows.slice(0, 10)} />
        ) : (
          <TabEmptyState availability={tab.availability} fallback="Citation URL rows are not available." />
        )}
      </DataRichPanel>
      <DataRichPanel title="Crawler accessibility" description="AI crawler and page accessibility checks remain a future integration.">
        <AvailabilityLine label="Blocked AI crawlers" availability={tab.crawlerAccessibility.availability} />
      </DataRichPanel>
    </div>
  );
}

function RecommendationsTab({ model }: { model: RecoraReportViewModel }) {
  const tab = model.tabs.recommendations;

  return (
    <div className="min-w-0 space-y-3">
      <TabHeader
        title="Recommendations and actions"
        question="What should be improved, created, or reviewed next?"
        availability={tab.availability}
      />
      <DataRichPanel title="Recommendation candidates" description="Existing recommendations are displayed; new page briefs or action plans are not generated here." bodyClassName="p-0">
        {tab.recommendationRows.length > 0 ? (
          <RecommendationTable rows={tab.recommendationRows.slice(0, 10)} />
        ) : (
          <TabEmptyState availability={tab.availability} fallback="Recommendation rows are not available." />
        )}
      </DataRichPanel>
      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        <StatusPanel title="Review queue" availability={tab.reviewQueue.availability} />
        <StatusPanel title="Page Brief" availability={tab.pageBriefs.availability} />
        <StatusPanel title="Action Plan" availability={tab.actionPlan.availability} />
      </div>
    </div>
  );
}

function TabHeader({
  title,
  question,
  availability
}: {
  title: string;
  question: string;
  availability: ReportDataAvailability;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-[#DFE6E2] bg-[#FAFCFB] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-[12px] font-bold text-[#006B57]">{title}</p>
          <StatusBadge status={availability.status} />
        </div>
        <p className="mt-1 text-[13px] font-semibold leading-5 text-[#334155]">{question}</p>
      </div>
      <p className="min-w-0 text-[12px] font-semibold leading-5 text-[#64748B] md:max-w-lg">{availability.message}</p>
    </section>
  );
}

function SegmentPanel({
  title,
  rows
}: {
  title: string;
  rows: ReportUnavailableOr<ReportSegmentPerformanceRow[]>;
}) {
  return (
    <DataRichPanel title={title} description={rows.availability.message} bodyClassName="p-0">
      {rows.value && rows.value.length > 0 ? (
        <SegmentTable rows={rows.value.slice(0, 6)} />
      ) : (
        <TabEmptyState availability={rows.availability} fallback={`${title} rows are not available.`} />
      )}
    </DataRichPanel>
  );
}

function SegmentTable({ rows }: { rows: ReportSegmentPerformanceRow[] }) {
  return (
    <DataRichTableWrap>
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[210px]">Segment</TableHead>
            <TableHead className="w-[110px]">Prompts</TableHead>
            <TableHead className="w-[150px]">AI presence</TableHead>
            <TableHead className="w-[100px]">SOV</TableHead>
            <TableHead className="w-[150px]">Top competitor</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.kind}-${row.id}`}>
              <TableCell>
                <p className="line-clamp-2 font-bold leading-5 text-[#0F172A]" title={row.label}>{row.label}</p>
                <p className="text-[11px] font-semibold uppercase text-[#64748B]">{row.kind}</p>
              </TableCell>
              <TableCell className="font-semibold tabular-nums">{formatNumber(row.promptCount)}</TableCell>
              <TableCell><MetricInline metric={row.aiPresenceRate} /></TableCell>
              <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.shareOfVoice)}</TableCell>
              <TableCell className="text-[12px] font-semibold text-[#475569]">{row.topCompetitorName ?? "-"}</TableCell>
              <TableCell><StatusBadge status={row.availability.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

function CompactComparisonTable({
  rows
}: {
  rows: Array<{ brand: { brandId: string; name: string }; aiPresenceGap: ReportMetricValue; sovGap: ReportMetricValue; averagePositionGap: ReportMetricValue; availability: ReportDataAvailability }>;
}) {
  return (
    <DataRichTableWrap>
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Competitor</TableHead>
            <TableHead className="w-[140px]">AI presence gap</TableHead>
            <TableHead className="w-[100px]">SOV gap</TableHead>
            <TableHead className="w-[130px]">Position gap</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.brand.brandId}>
              <TableCell className="font-bold text-[#0F172A]">{row.brand.name}</TableCell>
              <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.aiPresenceGap)}</TableCell>
              <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.sovGap)}</TableCell>
              <TableCell className="font-semibold tabular-nums">{formatMetricValue(row.averagePositionGap)}</TableCell>
              <TableCell><StatusBadge status={row.availability.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

function DomainTable({ rows }: { rows: ReportCitationDomainRow[] }) {
  return (
    <DataRichTableWrap>
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[230px]">Domain</TableHead>
            <TableHead className="w-[130px]">Owner type</TableHead>
            <TableHead className="w-[130px]">Freshness</TableHead>
            <TableHead className="w-[120px]">Occurrences</TableHead>
            <TableHead className="w-[100px]">URLs</TableHead>
            <TableHead className="w-[140px]">Share</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.domain}>
              <TableCell>
                <p className="truncate font-bold text-[#0F172A]" title={row.domain}>{row.domain}</p>
                <p className="text-[11px] font-semibold text-[#64748B]">{row.sourceType}</p>
              </TableCell>
              <TableCell><UnavailableOrText item={row.ownerType} /></TableCell>
              <TableCell><UnavailableOrText item={row.sourceFreshness} /></TableCell>
              <TableCell className="font-semibold tabular-nums">{formatNumber(row.occurrenceCount)}</TableCell>
              <TableCell className="font-semibold tabular-nums">{formatNumber(row.urlCount)}</TableCell>
              <TableCell><MetricInline metric={row.citationShare} /></TableCell>
              <TableCell><StatusBadge status={row.availability.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

function UrlTable({ rows }: { rows: ReportCitationUrlRow[] }) {
  return (
    <DataRichTableWrap>
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">URL</TableHead>
            <TableHead className="w-[170px]">Domain</TableHead>
            <TableHead className="w-[130px]">Owner type</TableHead>
            <TableHead className="w-[130px]">Freshness</TableHead>
            <TableHead className="w-[140px]">Source-to-claim</TableHead>
            <TableHead className="w-[100px]">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.citationId}>
              <TableCell>
                <p className="line-clamp-2 break-all text-[12px] font-semibold leading-5 text-[#0F172A]" title={row.canonicalUrl ?? row.url ?? undefined}>
                  {row.canonicalUrl ?? row.url ?? "URL unavailable"}
                </p>
              </TableCell>
              <TableCell className="truncate font-semibold text-[#475569]" title={row.domain}>{row.domain}</TableCell>
              <TableCell><UnavailableOrText item={row.ownerType} /></TableCell>
              <TableCell><UnavailableOrText item={mapUnavailableOr(row.sourceFreshness, (value) => value.status)} /></TableCell>
              <TableCell><UnavailableOrText item={mapUnavailableOr(row.sourceToClaim, (value) => value.status)} /></TableCell>
              <TableCell className="font-semibold tabular-nums">{formatNumber(row.occurrenceCount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

function RecommendationTable({ rows }: { rows: ReportRecommendationRow[] }) {
  return (
    <DataRichTableWrap>
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[320px]">Recommendation</TableHead>
            <TableHead className="w-[110px]">Priority</TableHead>
            <TableHead className="w-[100px]">Impact</TableHead>
            <TableHead className="w-[100px]">Effort</TableHead>
            <TableHead className="w-[160px]">Quality gate</TableHead>
            <TableHead className="w-[210px]">Target</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.recommendationId}>
              <TableCell>
                <p className="line-clamp-2 font-bold leading-5 text-[#0F172A]" title={row.title}>{row.title}</p>
                <p className="text-[11px] font-semibold text-[#64748B]">{row.type}</p>
              </TableCell>
              <TableCell><PriorityBadge priority={row.priority} /></TableCell>
              <TableCell className="font-semibold tabular-nums">{formatNullableNumber(row.impactScore)}</TableCell>
              <TableCell className="font-semibold tabular-nums">{formatNullableNumber(row.effortScore)}</TableCell>
              <TableCell>
                <p className="text-[12px] font-semibold leading-5 text-[#475569]">
                  {row.qualityGateDecision ?? row.qualityGateStage ?? "-"}
                </p>
              </TableCell>
              <TableCell>
                <p className="line-clamp-2 break-all text-[12px] font-semibold leading-5 text-[#475569]" title={row.targetUrl ?? undefined}>
                  {row.targetUrl ?? row.relatedTopicId ?? row.relatedPromptId ?? "-"}
                </p>
              </TableCell>
              <TableCell><StatusBadge status={row.availability.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

function StatusPanel({
  title,
  availability
}: {
  title: string;
  availability: ReportDataAvailability;
}) {
  return (
    <DataRichPanel title={title} description={availability.message}>
      <AvailabilityLine label="State" availability={availability} />
    </DataRichPanel>
  );
}

function AvailabilityLine({
  label,
  availability
}: {
  label: string;
  availability: ReportDataAvailability;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-[#DFE6E2] bg-[#FAFCFB] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-[#0F172A]">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-[#64748B]">{availability.message}</p>
      </div>
      <StatusBadge status={availability.status} />
    </div>
  );
}

function TabEmptyState({
  availability,
  fallback
}: {
  availability: ReportDataAvailability;
  fallback: string;
}) {
  return (
    <div className="p-4">
      <DataRichEmpty message={`${fallback} Status: ${availability.status}. ${availability.message}`} />
    </div>
  );
}

function MetricInline({ metric }: { metric: ReportMetricValue }) {
  const value = toNumber(metric.value);
  if (value === null || metric.availability.status !== "available" && metric.availability.status !== "partial") {
    return <StatusBadge status={metric.availability.status} />;
  }

  if (metric.unit === "percent") {
    return <DataRichInlineBar value={value} label={formatMetricValue(metric)} />;
  }

  return <span className="font-semibold tabular-nums text-[#0F172A]">{formatMetricValue(metric)}</span>;
}

function UnavailableOrText<T>({
  item
}: {
  item: ReportUnavailableOr<T>;
}) {
  if (item.availability.status !== "available" && item.availability.status !== "partial") {
    return <StatusBadge status={item.availability.status} />;
  }

  return <span className="text-[12px] font-semibold text-[#0F172A]">{formatPrimitiveValue(item.value)}</span>;
}

function PromptScopeValueText<T extends ReportPromptType | ReportMeasurementPurpose>({
  item,
  getLabel
}: {
  item: ReportUnavailableOr<T>;
  getLabel: (value: T) => string;
}) {
  if (item.availability.status === "available" && item.value) {
    return (
      <span className="text-[12px] font-semibold text-[#0F172A]" title={item.value}>
        {getLabel(item.value)}
      </span>
    );
  }

  if (item.availability.status === "partial") {
    return (
      <div className="min-w-0 space-y-1">
        <StatusBadge status={item.availability.status} />
        <p className="text-[11px] font-semibold leading-4 text-[#64748B]">inferred or unknown</p>
      </div>
    );
  }

  if (item.availability.status === "needs_metadata") {
    return (
      <div className="min-w-0 space-y-1">
        <StatusBadge status={item.availability.status} />
        <p className="text-[11px] font-semibold leading-4 text-[#64748B]">formal metadata required</p>
      </div>
    );
  }

  return <StatusBadge status={item.availability.status} />;
}

function StatusBadge({ status }: { status: ReportDataStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-bold tracking-normal",
        status === "available" && "border-[#006B57]/20 bg-[#EAF6F0] text-[#006B57]",
        status === "partial" && "border-[#BFDAD4] bg-[#F0FAF6] text-[#0F766E]",
        status === "unavailable" && "border-[#DFE6E2] bg-white text-[#64748B]",
        status === "needs_metadata" && "border-[#F3D6A2] bg-[#FFF7E8] text-[#9A5B00]",
        status === "needs_extraction" && "border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]",
        status === "future" && "border-[#DFE6E2] bg-[#F8FAFC] text-[#475569]"
      )}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ReportRecommendationRow["priority"] }) {
  const tone = priority === "high" ? "red" : priority === "medium" ? "amber" : "default";
  return <DataRichBadge tone={tone}>{priority}</DataRichBadge>;
}

function mapUnavailableOr<T, U>(item: ReportUnavailableOr<T>, mapper: (value: T) => U): ReportUnavailableOr<U> {
  return {
    availability: item.availability,
    value: item.value === null ? null : mapper(item.value)
  };
}

function formatMetricValue(metric: ReportMetricValue) {
  if (metric.value === null) return "-";
  if (metric.unit === "percent" && typeof metric.value === "number") return `${formatNullableNumber(metric.value)}%`;
  if (metric.unit === "rank" && typeof metric.value === "number") return `#${formatNullableNumber(metric.value)}`;
  return formatPrimitiveValue(metric.value);
}

function formatPrimitiveValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return formatNullableNumber(value);
  if (typeof value === "string") return value;
  return String(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatNullableNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function toNumber(value: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
