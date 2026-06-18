import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { DataCard, PageHeader } from "@/components/recora/ui";
import type {
  RecoraAiConversationRow,
  RecoraRunDetailBrandMentionRow,
  RecoraRunDetailDbData,
  RecoraRunItemRow
} from "@/lib/recora/db";
import { cn } from "@/lib/utils";

type RunDetailPageProps = {
  data: RecoraRunDetailDbData | null;
  projectSlug: string;
  runId: string;
};

export function RunDetailPage({ data, projectSlug, runId }: RunDetailPageProps) {
  const reportBase = `/dashboard/reports/${projectSlug}`;

  if (!data?.project || !data.run) {
    return (
      <>
        <PageHeader
          eyebrow="測定履歴"
          title="測定run詳細"
          description="指定されたrunを表示できませんでした。対象projectのrunか確認してください。"
          actions={<BackButton href={`${reportBase}/runs`} />}
        />
        <DataCard title="表示できるデータがありません">
          <EmptyState
            title="runが見つかりません"
            description="測定履歴に戻って、表示したいrunを選択してください。"
          />
        </DataCard>
      </>
    );
  }

  const indexes = buildIndexes(data);
  const kindLabel = runKindLabel(data.kind);
  const profileLabel = data.measurementProfileLabel ?? profileFallbackLabel(data.kind);

  return (
    <>
      <PageHeader
        eyebrow="測定履歴"
        title="測定run詳細"
        description={`run ID: ${data.run.id}`}
        actions={<BackButton href={`${reportBase}/runs`} />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="run type" value={kindLabel} helper={data.kind === "unknown" ? "旧形式/不明" : data.kind} />
        <SummaryTile label="status" value={statusLabel(data.run.status)} helper={formatDateTime(data.run.completed_at)} tone="green" />
        <SummaryTile label="profile" value={profileLabel} helper={data.measurementProfileId ?? "個別測定"} />
        <SummaryTile label="search mode" value={formatSearchMode(data.searchMode)} helper={data.run.language + " / " + data.run.region} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="prompt count" value={String(data.measurementProfilePromptCount ?? data.summary.promptCount)} helper={`selected ${data.selectedPromptIds.length}`} />
        <SummaryTile label="expected run_items" value={formatNullableNumber(data.summary.expectedRunItems)} helper="profile metadata" />
        <SummaryTile label="実run_items" value={String(data.summary.runItemCount)} helper={`failed ${data.summary.failedItemCount}`} />
        <SummaryTile label="AI回答" value={String(data.summary.aiConversationCount)} helper="ai_conversations" tone="green" />
        <SummaryTile label="ブランド言及" value={String(data.summary.brandMentionCount)} helper="brand_mentions" />
        <SummaryTile label="引用" value={String(data.summary.citationCount)} helper=".example除外後" />
        <SummaryTile label="source domains" value={String(data.summary.sourceDomainCount)} helper="引用元ドメイン" />
        <SummaryTile label="snapshots" value={String(data.summary.metricSnapshotCount)} helper="metric_snapshots" tone="green" />
      </div>

      <DataCard className="mt-5" title="run概要" description="測定プロファイル、時刻、関連runを確認します。">
        <div className="grid gap-3 lg:grid-cols-3">
          <InfoBox label="run ID" value={data.run.id} mono />
          <InfoBox label="created_at" value={formatDateTime(data.run.created_at)} />
          <InfoBox label="started_at / completed_at" value={`${formatDateTime(data.run.started_at)} / ${formatDateTime(data.run.completed_at)}`} />
          <InfoBox label="source measurement run" value={data.sourceRunId ?? "-"} href={data.sourceRunId ? `${reportBase}/runs/${data.sourceRunId}` : undefined} mono />
          <InfoBox label="aggregate run" value={data.relatedAggregateRuns[0]?.id ?? "-"} href={data.relatedAggregateRuns[0] ? `${reportBase}/runs/${data.relatedAggregateRuns[0].id}` : undefined} mono />
          <InfoBox label="period" value={`${data.run.period_start} - ${data.run.period_end}`} />
        </div>
        {data.selectedPromptIds.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500">selected_prompt_ids</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.selectedPromptIds.map((promptId) => (
                <span key={promptId} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
                  {promptId}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </DataCard>

      {data.runItems.length > 0 ? <RunItemsSection data={data} indexes={indexes} /> : null}
      {data.conversations.length > 0 ? <ConversationsSection data={data} indexes={indexes} /> : null}
      {data.brandMentions.length > 0 ? <BrandMentionsSection data={data} indexes={indexes} /> : null}
      {data.citations.length > 0 ? <CitationsSection data={data} indexes={indexes} /> : null}
      {data.metricSnapshots.length > 0 ? <MetricSnapshotsSection data={data} indexes={indexes} /> : null}

      {data.runItems.length === 0 && data.metricSnapshots.length === 0 ? (
        <DataCard className="mt-5" title="詳細データ">
          <EmptyState title="表示できる詳細データがありません" description="旧形式のrun、または集計前のrunの可能性があります。" />
        </DataCard>
      ) : null}
    </>
  );
}

function BackButton({ href }: { href: string }) {
  return (
    <Button variant="outline" asChild>
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        測定履歴へ戻る
      </Link>
    </Button>
  );
}

function RunItemsSection({ data, indexes }: { data: RecoraRunDetailDbData; indexes: RunDetailIndexes }) {
  return (
    <DataCard className="mt-5" title="run_items" description="測定対象になったprompt、persona、model、search modeを確認します。">
      <div className="overflow-x-auto">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead>prompt</TableHead>
              <TableHead>topic / persona</TableHead>
              <TableHead>model</TableHead>
              <TableHead>search mode</TableHead>
              <TableHead>status</TableHead>
              <TableHead>error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.runItems.map((item) => {
              const prompt = indexes.promptById.get(item.prompt_id);
              const topic = prompt ? indexes.topicById.get(prompt.topic_id) : undefined;
              const persona = indexes.personaById.get(item.persona_id);
              const model = indexes.aiModelById.get(item.model_id);
              const conversation = indexes.conversationByRunItemId.get(item.id);

              return (
                <TableRow key={item.id}>
                  <TableCell className="min-w-[320px] text-sm leading-6 text-slate-700">{prompt?.text ?? conversation?.prompt_text_snapshot ?? item.prompt_id}</TableCell>
                  <TableCell className="min-w-[190px] text-sm leading-6">
                    <div className="font-bold text-slate-800">{topic?.name ?? "-"}</div>
                    <div className="text-xs text-slate-500">{persona?.name ?? "-"}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-700">{model?.display_name ?? model?.model_name ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap"><SearchModeBadge value={conversation ? conversationSearchMode(conversation) : data.searchMode} /></TableCell>
                  <TableCell className="whitespace-nowrap"><RunItemStatusBadge status={item.status} /></TableCell>
                  <TableCell className="min-w-[180px] text-sm text-rose-700">{item.error_message ?? "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </DataCard>
  );
}

function ConversationsSection({ data, indexes }: { data: RecoraRunDetailDbData; indexes: RunDetailIndexes }) {
  return (
    <DataCard className="mt-5" title="AI回答ログ" description="このrunで保存されたOpenAI実測回答です。">
      <div className="overflow-x-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow>
              <TableHead>prompt</TableHead>
              <TableHead>search</TableHead>
              <TableHead>provider / model</TableHead>
              <TableHead>citation_status</TableHead>
              <TableHead>response excerpt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.conversations.map((conversation) => {
              const runItem = indexes.runItemById.get(conversation.run_item_id);
              const prompt = runItem ? indexes.promptById.get(runItem.prompt_id) : undefined;

              return (
                <TableRow key={conversation.id}>
                  <TableCell className="min-w-[300px] text-sm leading-6 text-slate-700">{prompt?.text ?? conversation.prompt_text_snapshot}</TableCell>
                  <TableCell className="whitespace-nowrap"><SearchModeBadge value={conversationSearchMode(conversation)} /></TableCell>
                  <TableCell className="min-w-[190px] text-sm leading-6">
                    <div className="font-bold text-slate-800">{conversation.provider ?? "-"}</div>
                    <div className="text-xs text-slate-500">{conversation.model_returned ?? conversation.model_snapshot}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{conversation.citation_status}</TableCell>
                  <TableCell className="min-w-[320px] text-sm leading-6 text-slate-600">{excerpt(conversation.raw_answer, 220)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </DataCard>
  );
}

function BrandMentionsSection({ data, indexes }: { data: RecoraRunDetailDbData; indexes: RunDetailIndexes }) {
  const summaries = buildBrandMentionSummaries(data.brandMentions, indexes);

  return (
    <DataCard className="mt-5" title="ブランド言及概要" description="brand_mentionsをブランド別に集計します。">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {summaries.map((summary) => (
          <div key={summary.brandId} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <p className="truncate text-sm font-bold text-slate-950">{summary.brandName}</p>
            <div className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
              <CountPair label="rows" value={summary.rowCount} />
              <CountPair label="mentioned" value={summary.mentionedRows} />
              <CountPair label="mention_count" value={summary.mentionCount} />
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function CitationsSection({ data, indexes }: { data: RecoraRunDetailDbData; indexes: RunDetailIndexes }) {
  return (
    <DataCard className="mt-5" title="引用元" description=".exampleを除外した、このrunの引用URLです。">
      <div className="overflow-x-auto">
        <Table className="min-w-[1040px]">
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>domain</TableHead>
              <TableHead>title</TableHead>
              <TableHead>citation_status</TableHead>
              <TableHead>supports_claim</TableHead>
              <TableHead>brand_related</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.citations.map((citation) => {
              const conversation = indexes.conversationById.get(citation.conversation_id);

              return (
                <TableRow key={citation.id}>
                  <TableCell className="min-w-[280px]">
                    {citation.url ? (
                      <Link href={citation.url} className="inline-flex max-w-[270px] items-center gap-1 truncate text-sm font-bold text-teal-700 hover:text-teal-800">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{citation.url}</span>
                      </Link>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-semibold text-slate-800">{citation.domain}</TableCell>
                  <TableCell className="min-w-[240px] text-sm text-slate-600">{citation.title ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{conversation?.citation_status ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatBooleanUnknown(citation.supports_claim)}</TableCell>
                  <TableCell className="whitespace-nowrap">{citation.brand_related}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </DataCard>
  );
}

function MetricSnapshotsSection({ data, indexes }: { data: RecoraRunDetailDbData; indexes: RunDetailIndexes }) {
  return (
    <DataCard className="mt-5" title="metric_snapshots" description="aggregate runの場合は、dashboard / leaderboardに反映される集計値です。">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>scope</TableHead>
              <TableHead>brand</TableHead>
              <TableHead>AI表示率</TableHead>
              <TableHead>AI言及数</TableHead>
              <TableHead>引用数</TableHead>
              <TableHead>競合差分</TableHead>
              <TableHead>反映先</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.metricSnapshots.map((snapshot) => (
              <TableRow key={snapshot.id}>
                <TableCell className="whitespace-nowrap font-bold text-slate-800">{snapshot.scope_type}</TableCell>
                <TableCell className="whitespace-nowrap">{snapshot.brand_id ? indexes.brandById.get(snapshot.brand_id)?.name ?? "-" : "-"}</TableCell>
                <TableCell className="whitespace-nowrap font-bold text-teal-700">{formatPercent(snapshot.ai_visibility)}</TableCell>
                <TableCell className="whitespace-nowrap">{Math.round(snapshot.ai_mention_count)}</TableCell>
                <TableCell className="whitespace-nowrap">{Math.round(snapshot.citation_count)}</TableCell>
                <TableCell className="whitespace-nowrap">{snapshot.competitive_gap === null ? "-" : formatSigned(snapshot.competitive_gap) + "pt"}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-slate-600">
                  {snapshot.scope_type === "project" ? "dashboard" : snapshot.scope_type === "brand" ? "leaderboard" : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DataCard>
  );
}

type RunDetailIndexes = ReturnType<typeof buildIndexes>;

function buildIndexes(data: RecoraRunDetailDbData) {
  return {
    brandById: new Map(data.brands.map((brand) => [brand.id, brand])),
    runItemById: new Map(data.runItems.map((item) => [item.id, item])),
    promptById: new Map(data.prompts.map((prompt) => [prompt.id, prompt])),
    topicById: new Map(data.topics.map((topic) => [topic.id, topic])),
    personaById: new Map(data.personas.map((persona) => [persona.id, persona])),
    aiModelById: new Map(data.aiModels.map((model) => [model.id, model])),
    conversationById: new Map(data.conversations.map((conversation) => [conversation.id, conversation])),
    conversationByRunItemId: new Map(data.conversations.map((conversation) => [conversation.run_item_id, conversation]))
  };
}

function buildBrandMentionSummaries(mentions: RecoraRunDetailBrandMentionRow[], indexes: RunDetailIndexes) {
  const grouped = new Map<string, RecoraRunDetailBrandMentionRow[]>();

  for (const mention of mentions) {
    const existing = grouped.get(mention.brand_id);
    if (existing) existing.push(mention);
    else grouped.set(mention.brand_id, [mention]);
  }

  return Array.from(grouped.entries()).map(([brandId, rows]) => ({
    brandId,
    brandName: indexes.brandById.get(brandId)?.name ?? brandId,
    rowCount: rows.length,
    mentionedRows: rows.filter((row) => row.mentioned).length,
    mentionCount: rows.reduce((sum, row) => sum + Math.max(0, row.mention_count ?? 0), 0)
  }));
}

function SummaryTile({ label, value, helper, tone = "blue" }: { label: string; value: string; helper?: string; tone?: "blue" | "green" }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 truncate text-2xl font-bold tracking-tight", tone === "green" ? "text-teal-700" : "text-slate-950")} title={value}>{value}</p>
      {helper ? <p className="mt-2 truncate text-xs font-semibold text-slate-400" title={helper}>{helper}</p> : null}
    </div>
  );
}

function InfoBox({ label, value, href, mono = false }: { label: string; value: string; href?: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      {href ? (
        <Link href={href} className={cn("mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm font-bold text-teal-700 hover:text-teal-800", mono && "font-mono text-xs")}>
          <span className="truncate">{value}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </Link>
      ) : (
        <p className={cn("mt-1 truncate text-sm font-bold text-slate-800", mono && "font-mono text-xs")} title={value}>{value}</p>
      )}
    </div>
  );
}

function CountPair({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="font-bold text-slate-950">{value}</span>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function RunItemStatusBadge({ status }: { status: RecoraRunItemRow["status"] }) {
  const className = status === "completed"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "failed"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={cn("rounded-sm", className)}>
      {status}
    </Badge>
  );
}

function SearchModeBadge({ value }: { value: string | null }) {
  return (
    <Badge variant="outline" className="rounded-sm border-teal-100 bg-teal-50/70 text-teal-700">
      {formatSearchMode(value)}
    </Badge>
  );
}

function runKindLabel(kind: RecoraRunDetailDbData["kind"]) {
  if (kind === "measurement") return "measurement";
  if (kind === "aggregate") return "aggregate";
  if (kind === "sample") return "旧形式/初期データ";
  return "旧形式/不明";
}

function profileFallbackLabel(kind: RecoraRunDetailDbData["kind"]) {
  if (kind === "measurement") return "個別測定";
  if (kind === "aggregate") return "集計run";
  return "旧形式/不明";
}

function statusLabel(status: string) {
  if (status === "completed") return "完了";
  if (status === "failed") return "失敗";
  if (status === "running") return "実行中";
  return status;
}

function conversationSearchMode(conversation: Pick<RecoraAiConversationRow, "web_search_enabled">) {
  return conversation.web_search_enabled ? "web-search" : "no-search";
}

function formatSearchMode(value: string | null) {
  if (!value) return "-";
  return value;
}

function formatNullableNumber(value: number | null) {
  return value === null ? "-" : String(value);
}

function formatBooleanUnknown(value: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${Math.round(value * 10) / 10}`;
}

function formatDateTime(value: string | null | undefined) {
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

function excerpt(value: string, length: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
