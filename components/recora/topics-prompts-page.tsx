"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Edit3,
  FileText,
  Layers3,
  Search,
  SlidersHorizontal,
  Users
} from "lucide-react";

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
import { DashboardCard, PageHeader } from "@/components/recora/ui";
import { cn } from "@/lib/utils";
import type {
  RecoraPersonaRow,
  RecoraPriority,
  RecoraPromptRow,
  RecoraTopicRow,
  RecoraTopicsPromptsDbData
} from "@/lib/recora/db";

type TopicsPromptsDbPageProps = {
  topicsPromptsData: RecoraTopicsPromptsDbData | null;
  loadError?: boolean;
};

type PromptStatusFilter = "all" | "active" | "inactive";

type TopicSummary = {
  topic: RecoraTopicRow;
  promptCount: number;
  activePromptCount: number;
  personaNames: string[];
  intentLabels: string[];
  latestUpdatedAt: string | null;
};

type PromptDisplayRow = {
  prompt: RecoraPromptRow;
  topic: RecoraTopicRow | null;
  persona: RecoraPersonaRow | null;
};

const EMPTY_TOPICS: RecoraTopicRow[] = [];
const EMPTY_PROMPTS: RecoraPromptRow[] = [];
const EMPTY_PERSONAS: RecoraPersonaRow[] = [];

export function TopicsPromptsDbPage({
  topicsPromptsData,
  loadError = false
}: TopicsPromptsDbPageProps) {
  const project = topicsPromptsData?.project ?? null;
  const topics = topicsPromptsData?.topics ?? EMPTY_TOPICS;
  const prompts = topicsPromptsData?.prompts ?? EMPTY_PROMPTS;
  const personas = topicsPromptsData?.personas ?? EMPTY_PERSONAS;
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PromptStatusFilter>("all");
  const [keyword, setKeyword] = useState("");

  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);
  const personaById = useMemo(() => new Map(personas.map((persona) => [persona.id, persona])), [personas]);
  const topicSummaries = useMemo(
    () => buildTopicSummaries(topics, prompts, personas),
    [topics, prompts, personas]
  );
  const promptRows = useMemo<PromptDisplayRow[]>(
    () =>
      prompts.map((prompt) => ({
        prompt,
        topic: topicById.get(prompt.topic_id) ?? null,
        persona: prompt.persona_id ? personaById.get(prompt.persona_id) ?? null : null
      })),
    [personaById, prompts, topicById]
  );
  const filteredPromptRows = useMemo(
    () => filterPromptRows(promptRows, selectedTopicId, statusFilter, keyword),
    [keyword, promptRows, selectedTopicId, statusFilter]
  );

  const activePromptCount = prompts.filter((prompt) => prompt.is_active).length;
  const selectedSummary =
    selectedTopicId === "all"
      ? null
      : topicSummaries.find((summary) => summary.topic.id === selectedTopicId) ?? null;
  const visibleTopicCount = selectedTopicId === "all" ? topics.length : selectedSummary ? 1 : 0;
  const hasData = Boolean(project) && (topics.length > 0 || prompts.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="設定"
        title="トピック・プロンプト"
        description="AI検索測定で利用する質問群を管理します。測定対象のトピック、プロンプト、ペルソナ、意図、購買段階をDB由来で確認できます。"
        actions={
          <Button variant="outline" disabled title="次フェーズで編集対応">
            <Edit3 className="h-4 w-4" />
            編集は次フェーズで対応
          </Button>
        }
      />

      {loadError ? (
        <div className="mb-5 rounded-[18px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          表示できるデータがありません。DB接続またはプロジェクト設定を確認してください。
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Layers3 className="h-5 w-5" />}
          label="トピック数"
          value={String(topics.length)}
          helper={project ? project.name : "プロジェクト未確認"}
        />
        <KpiCard
          icon={<FileText className="h-5 w-5" />}
          label="プロンプト数"
          value={String(prompts.length)}
          helper="測定対象の質問数"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="有効プロンプト数"
          value={String(activePromptCount)}
          helper={`${prompts.length - activePromptCount}件はinactive`}
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="ペルソナ数"
          value={String(personas.length)}
          helper="promptに紐づく対象者"
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <DashboardCard
          title="トピック一覧"
          description="各トピックのプロンプト数、有効数、優先度、意図、関連ペルソナを確認します。"
        >
          <div className="space-y-3">
            <TopicFilterButton
              active={selectedTopicId === "all"}
              title="すべてのトピック"
              subtitle={`${prompts.length}件のプロンプト`}
              badge={`${activePromptCount}件有効`}
              onClick={() => setSelectedTopicId("all")}
            />
            {topics.length > 0 ? (
              topicSummaries.map((summary) => (
                <TopicCard
                  key={summary.topic.id}
                  summary={summary}
                  active={selectedTopicId === summary.topic.id}
                  onClick={() => setSelectedTopicId(summary.topic.id)}
                />
              ))
            ) : (
              <EmptyStateBlock
                title="まだトピックがありません"
                description="トピックを追加すると、測定プロンプトを分類して確認できます。"
              />
            )}
          </div>
        </DashboardCard>

        <DashboardCard
          title={selectedSummary ? "選択中トピックの概要" : "プロンプト管理"}
          description="トピック別フィルタ、状態フィルタ、キーワード検索で測定対象を絞り込みます。"
        >
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0 rounded-2xl border border-[#DDE8E5] bg-[#F6FAF9] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00796B]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="プロンプト、意図、ペルソナで検索"
                    className="h-11 w-full rounded-xl border border-[#DDE8E5] bg-white pl-9 pr-3 text-sm font-medium text-[#0F172A] outline-none transition focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15"
                  />
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as PromptStatusFilter)}
                  className="h-11 rounded-xl border border-[#DDE8E5] bg-white px-3 text-sm font-bold text-[#0F172A] outline-none transition focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15"
                >
                  <option value="all">すべての状態</option>
                  <option value="active">activeのみ</option>
                  <option value="inactive">inactiveのみ</option>
                </select>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-[#DDE8E5] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                表示中
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#0F172A]">
                {filteredPromptRows.length}
                <span className="ml-1 text-sm font-semibold text-[#64748B]">件</span>
              </p>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                {visibleTopicCount}トピックを対象にしています。
              </p>
            </div>
          </div>

          <TopicOverview summary={selectedSummary} topics={topics} prompts={prompts} personas={personas} />
        </DashboardCard>
      </div>

      <DashboardCard
        className="mt-5"
        title="プロンプト一覧"
        description="OpenAI測定で利用するプロンプト本文と、トピック・ペルソナ・意図・購買段階・状態を確認します。"
      >
        {hasData ? (
          <PromptsTable rows={filteredPromptRows} />
        ) : (
          <EmptyStateBlock
            title="まだ測定プロンプトがありません"
            description="プロンプトを追加すると、測定実行時に利用できます。"
          />
        )}
      </DashboardCard>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  helper
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#64748B]">{label}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-[#0F172A]">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F4F1] text-[#00796B]">
          {icon}
        </span>
      </div>
      <p className="mt-3 truncate text-xs font-semibold text-[#64748B]">{helper}</p>
    </div>
  );
}

function TopicCard({
  summary,
  active,
  onClick
}: {
  summary: TopicSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition",
        active
          ? "border-[#00796B]/30 bg-[#E6F4F1] shadow-[inset_3px_0_0_#00796B]"
          : "border-[#DDE8E5] bg-[#F6FAF9] hover:border-[#00796B]/25 hover:bg-[#E6F4F1]/60"
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0F172A]">{summary.topic.name}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B]">
            {summary.topic.intent ?? "意図は未設定です"}
          </p>
        </div>
        <PriorityBadge value={summary.topic.priority} />
      </div>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <SmallStat label="プロンプト" value={`${summary.promptCount}件`} />
        <SmallStat label="active" value={`${summary.activePromptCount}件`} />
        <SmallStat label="persona" value={`${summary.personaNames.length}件`} />
      </div>
    </button>
  );
}

function TopicFilterButton({
  active,
  title,
  subtitle,
  badge,
  onClick
}: {
  active: boolean;
  title: string;
  subtitle: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
        active
          ? "border-[#00796B]/30 bg-[#E6F4F1] shadow-[inset_3px_0_0_#00796B]"
          : "border-[#DDE8E5] bg-white hover:border-[#00796B]/25 hover:bg-[#E6F4F1]/60"
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#0F172A]">{title}</span>
        <span className="mt-1 block text-xs font-semibold text-[#64748B]">{subtitle}</span>
      </span>
      <Badge variant="outline" className="shrink-0 rounded-full border-[#DDE8E5] bg-white text-[#00796B]">
        {badge}
      </Badge>
    </button>
  );
}

function TopicOverview({
  summary,
  topics,
  prompts,
  personas
}: {
  summary: TopicSummary | null;
  topics: RecoraTopicRow[];
  prompts: RecoraPromptRow[];
  personas: RecoraPersonaRow[];
}) {
  const activePromptCount = prompts.filter((prompt) => prompt.is_active).length;
  const personaNames = summary?.personaNames ?? personas.map((persona) => persona.name);
  const intentLabels = summary?.intentLabels ?? uniqueStrings(prompts.map((prompt) => prompt.intent));
  const title = summary?.topic.name ?? "全トピック";

  return (
    <div className="mt-4 rounded-2xl border border-[#DDE8E5] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#00796B]">Current scope</p>
          <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-[#0F172A]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            {summary?.topic.intent ?? "トピック全体のプロンプトを一覧で確認しています。"}
          </p>
        </div>
        {summary ? <PriorityBadge value={summary.topic.priority} /> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SmallStat label="対象トピック" value={`${summary ? 1 : topics.length}件`} />
        <SmallStat label="プロンプト" value={`${summary?.promptCount ?? prompts.length}件`} />
        <SmallStat label="active" value={`${summary?.activePromptCount ?? activePromptCount}件`} />
        <SmallStat label="最終更新" value={formatDateTime(summary?.latestUpdatedAt ?? latestDate(prompts))} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <LabelGroup label="関連persona" values={personaNames} emptyLabel="関連personaは未設定です" />
        <LabelGroup label="intent" values={intentLabels} emptyLabel="intentは未設定です" />
      </div>
    </div>
  );
}

function PromptsTable({ rows }: { rows: PromptDisplayRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyStateBlock
        title="表示できるプロンプトがありません"
        description="フィルタ条件を変更するか、プロンプトの登録状況を確認してください。"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[320px]">プロンプト</TableHead>
          <TableHead className="min-w-[180px]">トピック</TableHead>
          <TableHead className="min-w-[150px]">ペルソナ</TableHead>
          <TableHead className="min-w-[130px]">意図</TableHead>
          <TableHead className="min-w-[130px]">購買段階</TableHead>
          <TableHead className="min-w-[110px]">優先度</TableHead>
          <TableHead className="min-w-[100px]">状態</TableHead>
          <TableHead className="min-w-[150px]">最終更新</TableHead>
          <TableHead className="min-w-[110px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ prompt, topic, persona }) => (
          <TableRow key={prompt.id}>
            <TableCell>
              <p className="max-w-[520px] whitespace-pre-wrap break-words font-semibold leading-6 text-[#0F172A]">
                {prompt.text}
              </p>
            </TableCell>
            <TableCell>
              <p className="font-bold text-[#0F172A]">{topic?.name ?? "未設定"}</p>
              <p className="mt-1 text-xs text-[#64748B]">{topic?.intent ?? "topic intentなし"}</p>
            </TableCell>
            <TableCell>{persona?.name ?? "未設定"}</TableCell>
            <TableCell>{prompt.intent ?? "未設定"}</TableCell>
            <TableCell>{prompt.buyer_stage ?? "未設定"}</TableCell>
            <TableCell>
              <PriorityBadge value={prompt.priority} />
            </TableCell>
            <TableCell>
              <StatusBadge active={prompt.is_active} />
            </TableCell>
            <TableCell>{formatDateTime(prompt.updated_at)}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" disabled title="次フェーズで編集対応">
                <Edit3 className="h-3.5 w-3.5" />
                編集
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#DDE8E5] bg-white px-3 py-2">
      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#0F172A]">{value}</p>
    </div>
  );
}

function LabelGroup({
  label,
  values,
  emptyLabel
}: {
  label: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#DDE8E5] bg-[#F6FAF9] p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.slice(0, 8).map((value) => (
            <Badge key={value} variant="outline" className="rounded-full border-[#DDE8E5] bg-white text-[#005C50]">
              {value}
            </Badge>
          ))}
          {values.length > 8 ? (
            <Badge variant="outline" className="rounded-full border-[#DDE8E5] bg-white text-[#64748B]">
              +{values.length - 8}
            </Badge>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[#64748B]">{emptyLabel}</p>
      )}
    </div>
  );
}

function PriorityBadge({ value }: { value: RecoraPriority }) {
  const label = value === "high" ? "高" : value === "medium" ? "中" : "低";
  const className =
    value === "high"
      ? "border-rose-200 bg-rose-50 text-[#C2415B]"
      : value === "medium"
        ? "border-amber-200 bg-amber-50 text-[#B7791F]"
        : "border-[#DDE8E5] bg-slate-50 text-[#64748B]";

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-full", className)}>
      優先度: {label}
    </Badge>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="gap-1 rounded-full border-emerald-200 bg-emerald-50 text-[#008F72]">
      <CheckCircle2 className="h-3.5 w-3.5" />
      active
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 rounded-full border-slate-200 bg-slate-50 text-[#64748B]">
      <CircleDashed className="h-3.5 w-3.5" />
      inactive
    </Badge>
  );
}

function EmptyStateBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DDE8E5] bg-[#F6FAF9] px-5 py-10 text-center">
      <p className="text-sm font-bold text-[#0F172A]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
  );
}

function buildTopicSummaries(
  topics: RecoraTopicRow[],
  prompts: RecoraPromptRow[],
  personas: RecoraPersonaRow[]
) {
  const personaById = new Map(personas.map((persona) => [persona.id, persona]));
  const promptsByTopic = groupBy(prompts, (prompt) => prompt.topic_id);

  return topics.map((topic) => {
    const topicPrompts = promptsByTopic.get(topic.id) ?? [];
    const personaNames = uniqueStrings(
      topicPrompts.map((prompt) => (prompt.persona_id ? personaById.get(prompt.persona_id)?.name : null))
    );
    const intentLabels = uniqueStrings([
      topic.intent,
      ...topicPrompts.map((prompt) => prompt.intent)
    ]);

    return {
      topic,
      promptCount: topicPrompts.length,
      activePromptCount: topicPrompts.filter((prompt) => prompt.is_active).length,
      personaNames,
      intentLabels,
      latestUpdatedAt: latestDate([topic, ...topicPrompts])
    } satisfies TopicSummary;
  });
}

function filterPromptRows(
  rows: PromptDisplayRow[],
  selectedTopicId: string,
  statusFilter: PromptStatusFilter,
  keyword: string
) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return rows.filter((row) => {
    if (selectedTopicId !== "all" && row.prompt.topic_id !== selectedTopicId) {
      return false;
    }
    if (statusFilter === "active" && !row.prompt.is_active) {
      return false;
    }
    if (statusFilter === "inactive" && row.prompt.is_active) {
      return false;
    }
    if (!normalizedKeyword) {
      return true;
    }

    return [
      row.prompt.text,
      row.prompt.intent,
      row.prompt.buyer_stage,
      row.prompt.priority,
      row.topic?.name,
      row.topic?.intent,
      row.persona?.name,
      row.persona?.segment
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}

function latestDate(items: Array<{ updated_at: string }>) {
  const timestamps = items
    .map((item) => Date.parse(item.updated_at))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;

  return new Date(Math.max(...timestamps)).toISOString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
