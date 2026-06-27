"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Clipboard,
  Copy,
  Eye,
  FileJson,
  FileText,
  Filter,
  Layers3,
  LockKeyhole,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users
} from "lucide-react";

import { DataCard, PageHeader } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildProjectSetupSeedInput,
  createDefaultProjectSetupFormState,
  createImportantUrlInput,
  createKnownCompetitorInput,
  getFilledImportantUrls,
  getFilledKnownCompetitors,
  getImportantUrlKindLabel,
  getProjectSetupBusinessTypeLabel,
  joinLooseList,
  projectSetupBusinessTypeOptions,
  projectSetupImportantUrlKindOptions,
  splitLooseList,
  type ProjectSetupBusinessType,
  type ProjectSetupFormState,
  type ProjectSetupImportantUrlInput,
  type ProjectSetupImportantUrlKind,
  type ProjectSetupKnownCompetitorInput
} from "@/lib/recora/project-setup-form-schema";
import {
  derivePromptMetricEligibility,
  getBrandIdentityFromDraft,
  getPromptMeasurementReadiness,
  type DraftReviewStatus,
  type PersonaDraft,
  type ProjectSetupDraft,
  type PromptDraft,
  type PromptIntentType,
  type PromptMetricEligibility,
  type PromptMeasurementReadiness,
  type TopicDraft
} from "@/lib/recora/project-setup-draft";
import {
  generateProjectSetupDraft,
  type ProjectSetupDraftGenerationResult
} from "@/lib/recora/project-setup-draft-generator";
import { cn } from "@/lib/utils";

type CopyStatus = "idle" | "copied" | "failed";
type PromptVisibilityFilter = "all" | "market" | "non_branded" | "branded" | "citation";
type PromptMetricRow = {
  prompt: PromptDraft;
  topic: TopicDraft | null;
  persona: PersonaDraft | null;
  metricEligibility: PromptMetricEligibility;
  readiness: PromptMeasurementReadiness;
};

const editableReviewStatusOptions = ["needs_review", "needs_revision", "rejected"] satisfies DraftReviewStatus[];
const promptVisibilityFilters = [
  { value: "all", label: "すべて" },
  { value: "market", label: "可視性・ranking候補" },
  { value: "non_branded", label: "non-branded" },
  { value: "branded", label: "branded" },
  { value: "citation", label: "citation" }
] satisfies { value: PromptVisibilityFilter; label: string }[];

export function ProjectSetupDraftReviewPage() {
  const [form, setForm] = useState<ProjectSetupFormState>(() => createDefaultProjectSetupFormState());
  const [result, setResult] = useState<ProjectSetupDraftGenerationResult | null>(null);
  const [draft, setDraft] = useState<ProjectSetupDraft | null>(null);
  const [showPromptReview, setShowPromptReview] = useState(false);
  const [selectedPromptTopicId, setSelectedPromptTopicId] = useState("all");
  const [promptFilter, setPromptFilter] = useState<PromptVisibilityFilter>("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [promptSearch, setPromptSearch] = useState("");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const promptRows = useMemo(() => (draft ? buildPromptMetricRows(draft) : []), [draft]);
  const visiblePromptRows = useMemo(
    () => filterPromptRows(promptRows, selectedPromptTopicId, promptFilter, intentFilter, promptSearch),
    [intentFilter, promptFilter, promptRows, promptSearch, selectedPromptTopicId]
  );
  const promptIntents = useMemo(
    () => Array.from(new Set(promptRows.map((row) => row.prompt.intentType))).sort(),
    [promptRows]
  );
  const draftJson = useMemo(
    () => buildReviewJson(form, result, draft),
    [draft, form, result]
  );
  const summary = useMemo(() => (draft ? buildDraftSummary(draft, promptRows, result) : null), [draft, promptRows, result]);

  function updateForm<K extends keyof ProjectSetupFormState>(field: K, value: ProjectSetupFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateImportantUrl(id: string, patch: Partial<ProjectSetupImportantUrlInput>) {
    setForm((current) => ({
      ...current,
      importantUrls: current.importantUrls.map((item) => item.id === id ? { ...item, ...patch } : item)
    }));
  }

  function updateCompetitor(id: string, patch: Partial<ProjectSetupKnownCompetitorInput>) {
    setForm((current) => ({
      ...current,
      knownCompetitors: current.knownCompetitors.map((item) => item.id === id ? { ...item, ...patch } : item)
    }));
  }

  function removeImportantUrl(id: string) {
    setForm((current) => ({
      ...current,
      importantUrls: current.importantUrls.filter((item) => item.id !== id)
    }));
  }

  function removeCompetitor(id: string) {
    setForm((current) => ({
      ...current,
      knownCompetitors: current.knownCompetitors.filter((item) => item.id !== id)
    }));
  }

  function generateDraft() {
    const nextResult = generateProjectSetupDraft(buildProjectSetupSeedInput(form));
    setResult(nextResult);
    setDraft(nextResult.draft);
    setShowPromptReview(false);
    setSelectedPromptTopicId(nextResult.draft.topics[0]?.topicId ?? "all");
    setPromptFilter("all");
    setIntentFilter("all");
    setPromptSearch("");
    setCopyStatus("idle");
    setShowJsonPreview(false);
  }

  function updatePersona(personaId: string, update: (persona: PersonaDraft) => PersonaDraft) {
    setDraft((current) => current ? {
      ...current,
      personas: current.personas.map((persona) => persona.personaId === personaId ? update(persona) : persona)
    } : current);
  }

  function updateTopic(topicId: string, update: (topic: TopicDraft) => TopicDraft) {
    setDraft((current) => current ? {
      ...current,
      topics: current.topics.map((topic) => topic.topicId === topicId ? update(topic) : topic)
    } : current);
  }

  function updatePrompt(promptId: string, update: (prompt: PromptDraft) => PromptDraft) {
    setDraft((current) => current ? {
      ...current,
      prompts: current.prompts.map((prompt) => prompt.promptId === promptId ? update(prompt) : prompt)
    } : current);
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(draftJson);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        eyebrow="Recora内部運用"
        title="案件設定下書き"
        description="最小入力からペルソナ・トピック・プロンプトの未承認下書きを作り、内部レビュー用に確認します。"
        actions={
          <>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
              <LockKeyhole className="mr-1 h-3.5 w-3.5" />
              内部限定
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
              DB保存なし
            </Badge>
          </>
        }
      />

      <SafetyStrip />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <DataCard
          title="最小入力フォーマット"
          description="顧客がpersona/topic/promptを直接入力しなくても、下書き生成に必要な情報だけを受け取ります。"
          action={
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
              local state
            </Badge>
          }
        >
          <ProjectSetupInputForm
            form={form}
            onFieldChange={updateForm}
            onImportantUrlChange={updateImportantUrl}
            onImportantUrlRemove={removeImportantUrl}
            onImportantUrlAdd={(kind) => updateForm("importantUrls", [...form.importantUrls, createImportantUrlInput(kind)])}
            onCompetitorChange={updateCompetitor}
            onCompetitorRemove={removeCompetitor}
            onCompetitorAdd={() => updateForm("knownCompetitors", [...form.knownCompetitors, createKnownCompetitorInput()])}
            onGenerate={generateDraft}
          />
        </DataCard>

        <DataCard
          title="生成サマリー"
          description="生成結果は未承認の仮説です。計測利用には内部レビューと次PRの保存・承認処理が必要です。"
          action={
            summary ? (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-sm",
                  summary.blockerCount > 0
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                )}
              >
                {summary.blockerCount > 0 ? "blockerあり" : "下書き生成済み"}
              </Badge>
            ) : null
          }
        >
          {summary ? (
            <DraftSummaryPanel summary={summary} result={result} />
          ) : (
            <EmptyBlock
              icon={<Sparkles className="h-5 w-5" />}
              title="まだ下書きは生成されていません"
              description="左の入力から deterministic generator を呼び出すと、ここに件数と分類が表示されます。"
            />
          )}
        </DataCard>
      </div>

      {draft ? (
        <>
          <DraftReviewWorkspace
            draft={draft}
            promptRows={promptRows}
            visiblePromptRows={visiblePromptRows}
            showPromptReview={showPromptReview}
            selectedPromptTopicId={selectedPromptTopicId}
            promptFilter={promptFilter}
            intentFilter={intentFilter}
            promptSearch={promptSearch}
            promptIntents={promptIntents}
            onShowPromptReview={() => setShowPromptReview(true)}
            onSelectedPromptTopicIdChange={setSelectedPromptTopicId}
            onPromptFilterChange={setPromptFilter}
            onIntentFilterChange={setIntentFilter}
            onPromptSearchChange={setPromptSearch}
            onPersonaChange={updatePersona}
            onTopicChange={updateTopic}
            onPromptChange={updatePrompt}
          />

          <JsonPreviewPanel
            draftJson={draftJson}
            copyStatus={copyStatus}
            showPreview={showJsonPreview}
            onTogglePreview={() => setShowJsonPreview((current) => !current)}
            onCopy={copyJson}
          />
        </>
      ) : null}
    </div>
  );
}

function ProjectSetupInputForm({
  form,
  onFieldChange,
  onImportantUrlChange,
  onImportantUrlRemove,
  onImportantUrlAdd,
  onCompetitorChange,
  onCompetitorRemove,
  onCompetitorAdd,
  onGenerate
}: {
  form: ProjectSetupFormState;
  onFieldChange: <K extends keyof ProjectSetupFormState>(field: K, value: ProjectSetupFormState[K]) => void;
  onImportantUrlChange: (id: string, patch: Partial<ProjectSetupImportantUrlInput>) => void;
  onImportantUrlRemove: (id: string) => void;
  onImportantUrlAdd: (kind: ProjectSetupImportantUrlKind) => void;
  onCompetitorChange: (id: string, patch: Partial<ProjectSetupKnownCompetitorInput>) => void;
  onCompetitorRemove: (id: string) => void;
  onCompetitorAdd: () => void;
  onGenerate: () => void;
}) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="ブランド名"
          value={form.brandName}
          onChange={(value) => onFieldChange("brandName", value)}
          placeholder="Recora"
          required
        />
        <TextInput
          label="会社名・組織名"
          value={form.companyName}
          onChange={(value) => onFieldChange("companyName", value)}
          placeholder="未入力ならブランド名を使います"
        />
      </div>

      <TextAreaInput
        label="ブランド別名 / alias"
        value={form.brandAliasesText}
        onChange={(value) => onFieldChange("brandAliasesText", value)}
        placeholder="1行に1つ、またはカンマ区切り"
        rows={3}
      />

      <TextInput
        label="公式サイトURL"
        value={form.officialSiteUrl}
        onChange={(value) => onFieldChange("officialSiteUrl", value)}
        placeholder="https://example.com"
        required
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">重要URL</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">トップ、サービス、料金、事例、FAQなどを任意で残します。</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onImportantUrlAdd("service")}>
            <Plus className="h-4 w-4" />
            URLを追加
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {form.importantUrls.length === 0 ? (
            <EmptyMini text="重要URLは未入力です。" />
          ) : form.importantUrls.map((item) => (
            <ImportantUrlRow
              key={item.id}
              item={item}
              onChange={(patch) => onImportantUrlChange(item.id, patch)}
              onRemove={() => onImportantUrlRemove(item.id)}
            />
          ))}
        </div>
      </div>

      <TextAreaInput
        label="事業説明"
        value={form.businessDescription}
        onChange={(value) => onFieldChange("businessDescription", value)}
        placeholder="何を、誰に、どのように提供しているか"
        rows={4}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="業界"
          value={form.industry}
          onChange={(value) => onFieldChange("industry", value)}
          placeholder="BtoB SaaS / 地域サービス / EC など"
          required
        />
        <TextInput
          label="対象地域"
          value={form.targetRegionsText}
          onChange={(value) => onFieldChange("targetRegionsText", value)}
          placeholder="Japan / 東京都 / 全国 など"
          required
        />
      </div>

      <SegmentedBusinessType
        value={form.businessType}
        onChange={(value) => onFieldChange("businessType", value)}
      />

      <TextAreaInput
        label="主な顧客層"
        value={form.primaryCustomers}
        onChange={(value) => onFieldChange("primaryCustomers", value)}
        placeholder="例: BtoB SaaSのマーケ責任者、SEO担当者"
        rows={3}
        required
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">既知競合</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">今回の画面では競合比較promptの新規生成には使いません。</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onCompetitorAdd}>
            <Plus className="h-4 w-4" />
            競合を追加
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {form.knownCompetitors.length === 0 ? (
            <EmptyMini text="既知競合は未入力です。" />
          ) : form.knownCompetitors.map((item) => (
            <CompetitorRow
              key={item.id}
              item={item}
              onChange={(patch) => onCompetitorChange(item.id, patch)}
              onRemove={() => onCompetitorRemove(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaInput
          label="主な強み"
          value={form.strengthsText}
          onChange={(value) => onFieldChange("strengthsText", value)}
          placeholder="1行に1つ"
          rows={3}
        />
        <TextAreaInput
          label="既知リスク・誤解されやすい点"
          value={form.knownRisksText}
          onChange={(value) => onFieldChange("knownRisksText", value)}
          placeholder="1行に1つ"
          rows={3}
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <div className="flex gap-2">
          <ShieldAlert className="mt-1 h-4 w-4 shrink-0" />
          <p>個人情報、秘密情報、APIキー、未公開の顧客データは入力しないでください。</p>
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        <Sparkles className="h-4 w-4" />
        下書きを生成
      </Button>
    </form>
  );
}

function DraftSummaryPanel({
  summary,
  result
}: {
  summary: ReturnType<typeof buildDraftSummary>;
  result: ProjectSetupDraftGenerationResult | null;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryMetric icon={<Users className="h-4 w-4" />} label="persona" value={`${summary.personaCount}件`} />
        <SummaryMetric icon={<Layers3 className="h-4 w-4" />} label="topic" value={`${summary.topicCount}件`} />
        <SummaryMetric icon={<FileText className="h-4 w-4" />} label="prompt" value={`${summary.promptCount}件`} />
        <SummaryMetric label="non-branded" value={`${summary.nonBrandedPromptCount}件`} />
        <SummaryMetric label="branded" value={`${summary.brandedPromptCount}件`} />
        <SummaryMetric label="visibility / ranking / SOV候補" value={`${summary.marketMetricCandidateCount}件`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <StatusList
          title="blocker"
          tone="warning"
          items={result?.blockers ?? []}
          emptyText="blockerはありません。"
        />
        <StatusList
          title="warning"
          tone="neutral"
          items={result?.warnings ?? []}
          emptyText="warningはありません。"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        <div className="flex gap-2">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            market metric対象候補はあくまで分類候補です。すべての生成itemは未承認で、現時点ではmeasurement readyではありません。
          </p>
        </div>
      </div>
    </div>
  );
}

function DraftReviewWorkspace({
  draft,
  promptRows,
  visiblePromptRows,
  showPromptReview,
  selectedPromptTopicId,
  promptFilter,
  intentFilter,
  promptSearch,
  promptIntents,
  onShowPromptReview,
  onSelectedPromptTopicIdChange,
  onPromptFilterChange,
  onIntentFilterChange,
  onPromptSearchChange,
  onPersonaChange,
  onTopicChange,
  onPromptChange
}: {
  draft: ProjectSetupDraft;
  promptRows: PromptMetricRow[];
  visiblePromptRows: PromptMetricRow[];
  showPromptReview: boolean;
  selectedPromptTopicId: string;
  promptFilter: PromptVisibilityFilter;
  intentFilter: string;
  promptSearch: string;
  promptIntents: PromptIntentType[];
  onShowPromptReview: () => void;
  onSelectedPromptTopicIdChange: (value: string) => void;
  onPromptFilterChange: (value: PromptVisibilityFilter) => void;
  onIntentFilterChange: (value: string) => void;
  onPromptSearchChange: (value: string) => void;
  onPersonaChange: (personaId: string, update: (persona: PersonaDraft) => PersonaDraft) => void;
  onTopicChange: (topicId: string, update: (topic: TopicDraft) => TopicDraft) => void;
  onPromptChange: (promptId: string, update: (prompt: PromptDraft) => PromptDraft) => void;
}) {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <DataCard
        title="ペルソナ一覧"
        description="顧客セグメントの確定値ではなく、prompt設計用の仮説として確認します。"
        action={<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{draft.personas.length}件</Badge>}
      >
        {draft.personas.length > 0 ? (
          <div className="space-y-4">
            {draft.personas.map((persona) => (
              <PersonaEditor
                key={persona.personaId}
                persona={persona}
                onChange={(update) => onPersonaChange(persona.personaId, update)}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock
            icon={<Users className="h-5 w-5" />}
            title="ペルソナ下書きはありません"
            description="入力不足のblockerがある場合、generatorは無理にpersonaを作りません。"
          />
        )}
      </DataCard>

      <DataCard
        title="トピック一覧"
        description="topic firstの前提で、診断目的・metric target・紐づくpersonaを確認します。"
        action={<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{draft.topics.length}件</Badge>}
      >
        {draft.topics.length > 0 ? (
          <div className="space-y-4">
            {draft.topics.map((topic) => (
              <TopicEditor
                key={topic.topicId}
                topic={topic}
                personas={draft.personas}
                onChange={(update) => onTopicChange(topic.topicId, update)}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock
            icon={<Layers3 className="h-5 w-5" />}
            title="トピック下書きはありません"
            description="入力不足のblockerがある場合、generatorは無理にtopicを作りません。"
          />
        )}
      </DataCard>

      <DataCard
        className="xl:col-span-2"
        title="プロンプトサマリー"
        description="詳細一覧は初期状態では展開しません。件数と分類を確認してから、必要な時だけ詳細を開きます。"
        action={
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {draft.prompts.length}件
          </Badge>
        }
      >
        <PromptSummaryStrip rows={promptRows} />
        {showPromptReview ? (
          <PromptReviewPanel
            draft={draft}
            rows={visiblePromptRows}
            selectedPromptTopicId={selectedPromptTopicId}
            promptFilter={promptFilter}
            intentFilter={intentFilter}
            promptSearch={promptSearch}
            promptIntents={promptIntents}
            onSelectedPromptTopicIdChange={onSelectedPromptTopicIdChange}
            onPromptFilterChange={onPromptFilterChange}
            onIntentFilterChange={onIntentFilterChange}
            onPromptSearchChange={onPromptSearchChange}
            onPromptChange={onPromptChange}
          />
        ) : (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">詳細は未展開です</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                promptが多い前提で、topic・intent・metric用途で絞り込んでから確認します。
              </p>
            </div>
            <Button type="button" onClick={onShowPromptReview}>
              <Eye className="h-4 w-4" />
              プロンプトを確認・変更する
            </Button>
          </div>
        )}
      </DataCard>
    </div>
  );
}

function PromptReviewPanel({
  draft,
  rows,
  selectedPromptTopicId,
  promptFilter,
  intentFilter,
  promptSearch,
  promptIntents,
  onSelectedPromptTopicIdChange,
  onPromptFilterChange,
  onIntentFilterChange,
  onPromptSearchChange,
  onPromptChange
}: {
  draft: ProjectSetupDraft;
  rows: PromptMetricRow[];
  selectedPromptTopicId: string;
  promptFilter: PromptVisibilityFilter;
  intentFilter: string;
  promptSearch: string;
  promptIntents: PromptIntentType[];
  onSelectedPromptTopicIdChange: (value: string) => void;
  onPromptFilterChange: (value: PromptVisibilityFilter) => void;
  onIntentFilterChange: (value: string) => void;
  onPromptSearchChange: (value: string) => void;
  onPromptChange: (promptId: string, update: (prompt: PromptDraft) => PromptDraft) => void;
}) {
  const promptsByTopic = groupRowsByTopic(rows);

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-teal-700">
          <Filter className="h-3.5 w-3.5" />
          Prompt filter
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterButton active={selectedPromptTopicId === "all"} onClick={() => onSelectedPromptTopicIdChange("all")}>
            全topic
          </FilterButton>
          {draft.topics.map((topic) => (
            <FilterButton
              key={topic.topicId}
              active={selectedPromptTopicId === topic.topicId}
              onClick={() => onSelectedPromptTopicIdChange(topic.topicId)}
            >
              {topic.topicName}
            </FilterButton>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={promptSearch}
              onChange={(event) => onPromptSearchChange(event.target.value)}
              placeholder="prompt、topic、personaで検索"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            />
          </label>
          <select
            value={promptFilter}
            onChange={(event) => onPromptFilterChange(event.target.value as PromptVisibilityFilter)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
          >
            {promptVisibilityFilters.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            value={intentFilter}
            onChange={(event) => onIntentFilterChange(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
          >
            <option value="all">すべてのintent</option>
            {promptIntents.map((intent) => (
              <option key={intent} value={intent}>{labelFromSnake(intent)}</option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyBlock
          icon={<FileText className="h-5 w-5" />}
          title="条件に一致するプロンプトがありません"
          description="topic、分類、intent、検索語を変更してください。"
        />
      ) : (
        Array.from(promptsByTopic.entries()).map(([topicId, topicRows]) => {
          const topic = topicRows[0]?.topic;
          return (
            <section key={topicId} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950">{topic?.topicName ?? "未設定topic"}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{topic?.diagnosisGoal ?? "diagnosis goalなし"}</p>
                </div>
                <Badge variant="outline" className="w-fit shrink-0 rounded-full border-slate-200 bg-slate-50 text-slate-700">
                  {topicRows.length}件
                </Badge>
              </div>
              <div className="mt-4 space-y-4">
                {topicRows.map((row) => (
                  <PromptEditor
                    key={row.prompt.promptId}
                    row={row}
                    onChange={(update) => onPromptChange(row.prompt.promptId, update)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function PersonaEditor({
  persona,
  onChange
}: {
  persona: PersonaDraft;
  onChange: (update: (persona: PersonaDraft) => PersonaDraft) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <TextInput
            label="名前 / ラベル"
            value={persona.displayName}
            onChange={(value) => onChange((current) => ({ ...current, displayName: value }))}
          />
        </div>
        <ReviewStatusSelect
          value={persona.reviewStatus}
          onChange={(value) => onChange((current) => ({ ...current, reviewStatus: value }))}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ReadOnlyFact label="役割" value={`${labelFromSnake(persona.roleType)} / ${persona.detailedDecisionRole}`} />
        <ReadOnlyFact label="confidence" value={`${persona.confidenceScore}`} />
        <TextAreaInput
          label="目的"
          value={joinLooseList(persona.jobs)}
          onChange={(value) => onChange((current) => ({ ...current, jobs: splitLooseList(value) }))}
          rows={3}
        />
        <TextAreaInput
          label="課題"
          value={joinLooseList(persona.painPoints)}
          onChange={(value) => onChange((current) => ({ ...current, painPoints: splitLooseList(value) }))}
          rows={3}
        />
        <TextAreaInput
          label="選定軸"
          value={joinLooseList(persona.comparisonAxis)}
          onChange={(value) => onChange((current) => ({ ...current, comparisonAxis: splitLooseList(value) }))}
          rows={3}
        />
        <TextAreaInput
          label="生成理由"
          value={persona.promptAngle}
          onChange={(value) => onChange((current) => ({ ...current, promptAngle: value }))}
          rows={3}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusChip value={persona.promptReadiness} />
        <StatusChip value={persona.sourceStatus} />
        {persona.needsVerification ? <WarningChip label="確認待ち" /> : null}
      </div>
    </section>
  );
}

function TopicEditor({
  topic,
  personas,
  onChange
}: {
  topic: TopicDraft;
  personas: readonly PersonaDraft[];
  onChange: (update: (topic: TopicDraft) => TopicDraft) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <TextInput
            label="ラベル"
            value={topic.topicName}
            onChange={(value) => onChange((current) => ({ ...current, topicName: value }))}
          />
        </div>
        <ReviewStatusSelect
          value={topic.reviewStatus}
          onChange={(value) => onChange((current) => ({ ...current, reviewStatus: value }))}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ReadOnlyFact label="intent / category" value={labelFromSnake(topic.topicType)} />
        <label className="block min-w-0">
          <span className="block text-xs font-bold text-slate-600">紐づくpersona</span>
          <select
            value={topic.targetPersonaId ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, targetPersonaId: event.target.value || null }))}
            className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
          >
            <option value="">未設定</option>
            {personas.map((persona) => (
              <option key={persona.personaId} value={persona.personaId}>{persona.displayName}</option>
            ))}
          </select>
        </label>
        <TextAreaInput
          label="生成理由"
          value={topic.diagnosisGoal}
          onChange={(value) => onChange((current) => ({ ...current, diagnosisGoal: value }))}
          rows={3}
        />
        <TextAreaInput
          label="expected signal"
          value={topic.expectedSignal}
          onChange={(value) => onChange((current) => ({ ...current, expectedSignal: value }))}
          rows={3}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusChip value={topic.brandMentionPolicy} />
        <StatusChip value={topic.topicQualityDecision} />
        <StatusChip value={topic.coverageStatus} />
      </div>
    </section>
  );
}

function PromptEditor({
  row,
  onChange
}: {
  row: PromptMetricRow;
  onChange: (update: (prompt: PromptDraft) => PromptDraft) => void;
}) {
  const prompt = row.prompt;

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <TextAreaInput
          label="prompt text"
          value={prompt.text}
          onChange={(value) => onChange((current) => ({ ...current, text: value }))}
          rows={4}
        />
        <div className="space-y-3">
          <ReviewStatusSelect
            value={prompt.reviewStatus}
            onChange={(value) => onChange((current) => ({ ...current, reviewStatus: value }))}
          />
          <ReadOnlyFact label="persona" value={row.persona?.displayName ?? "未設定"} />
          <ReadOnlyFact label="topic" value={row.topic?.topicName ?? "未設定"} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PromptFact label="branded / non-branded" value={metricBrandingLabel(row.metricEligibility)} />
        <PromptFact label="intent" value={`${labelFromSnake(prompt.intent)} / ${labelFromSnake(prompt.intentType)}`} />
        <PromptFact label="category" value={labelFromSnake(prompt.category)} />
        <PromptFact label="language" value={labelFromSnake(prompt.languageMode)} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-3">
        <p className="text-xs font-bold uppercase tracking-normal text-slate-500">metric eligibility</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <MetricStateChip label="visibility" value={row.metricEligibility.visibilityRate} />
          <MetricStateChip label="ranking" value={row.metricEligibility.ranking} />
          <MetricStateChip label="SOV" value={row.metricEligibility.shareOfVoice} />
          <MetricStateChip label="sentiment" value={row.metricEligibility.sentiment} />
          <MetricStateChip label="brand perception" value={row.metricEligibility.brandPerception} />
          <MetricStateChip label="citation" value={row.metricEligibility.citationCheck} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TextAreaInput
          label="raw user intent"
          value={prompt.rawUserIntent ?? ""}
          onChange={(value) => onChange((current) => ({ ...current, rawUserIntent: value }))}
          rows={2}
        />
        <TextAreaInput
          label="measurement readyではない理由"
          value={row.readiness.blockers.length > 0 ? row.readiness.blockers.join("\n") : "blockerなし"}
          onChange={() => undefined}
          rows={2}
          readOnly
        />
      </div>
    </article>
  );
}

function JsonPreviewPanel({
  draftJson,
  copyStatus,
  showPreview,
  onTogglePreview,
  onCopy
}: {
  draftJson: string;
  copyStatus: CopyStatus;
  showPreview: boolean;
  onTogglePreview: () => void;
  onCopy: () => void;
}) {
  return (
    <DataCard
      title="下書きJSON"
      description="この画面ではDB書き込みを行いません。保存・承認は次PRで実装します。"
      action={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onTogglePreview}>
            <FileJson className="h-4 w-4" />
            {showPreview ? "JSONを閉じる" : "下書きJSONを表示"}
          </Button>
          <Button type="button" variant="outline" onClick={onCopy}>
            <Copy className="h-4 w-4" />
            JSONをコピー
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
          <FileJson className="mr-1 h-3.5 w-3.5" />
          review export
        </Badge>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
          保存・承認は次PR
        </Badge>
        {copyStatus === "copied" ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            コピー済み
          </Badge>
        ) : null}
        {copyStatus === "failed" ? (
          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
            コピーに失敗
          </Badge>
        ) : null}
      </div>
      {showPreview ? (
        <textarea
          readOnly
          value={draftJson}
          className="h-[360px] w-full resize-y rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-600">
          JSON本文は未表示です。prompt本文を含むため、必要な時だけ開いて確認します。
        </div>
      )}
    </DataCard>
  );
}

function SafetyStrip() {
  const items = [
    { icon: <LockKeyhole className="h-4 w-4" />, title: "内部運用者専用", text: "現在はローカル限定です。" },
    { icon: <Clipboard className="h-4 w-4" />, title: "DB保存なし", text: "保存ボタンはありません。" },
    { icon: <ShieldAlert className="h-4 w-4" />, title: "OpenAI API実行なし", text: "外部AIやWebクロールは呼びません。" },
    { icon: <AlertTriangle className="h-4 w-4" />, title: "未承認の仮説", text: "顧客表示・計測利用には内部レビューが必要です。" }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="flex gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
            {item.icon}
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-950">{item.title}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">{item.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function ImportantUrlRow({
  item,
  onChange,
  onRemove
}: {
  item: ProjectSetupImportantUrlInput;
  onChange: (patch: Partial<ProjectSetupImportantUrlInput>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,0.8fr)_44px]">
      <select
        value={item.kind}
        onChange={(event) => onChange({ kind: event.target.value as ProjectSetupImportantUrlKind })}
        aria-label="URL種別"
        className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      >
        {projectSetupImportantUrlKindOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <input
        value={item.url}
        onChange={(event) => onChange({ url: event.target.value })}
        placeholder="https://example.com/pricing"
        className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
      <input
        value={item.note}
        onChange={(event) => onChange({ note: event.target.value })}
        placeholder="メモ"
        className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
      <IconButton label={`${getImportantUrlKindLabel(item.kind)}を削除`} onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

function CompetitorRow({
  item,
  onChange,
  onRemove
}: {
  item: ProjectSetupKnownCompetitorInput;
  onChange: (patch: Partial<ProjectSetupKnownCompetitorInput>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_44px]">
      <input
        value={item.name}
        onChange={(event) => onChange({ name: event.target.value })}
        placeholder="競合名"
        className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
      <input
        value={item.url}
        onChange={(event) => onChange({ url: event.target.value })}
        placeholder="競合URL 任意"
        className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
      <input
        value={item.note}
        onChange={(event) => onChange({ note: event.target.value })}
        placeholder="メモ 任意"
        className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
      <IconButton label="競合行を削除" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

function PromptSummaryStrip({ rows }: { rows: PromptMetricRow[] }) {
  const market = rows.filter((row) => hasMarketMetricCandidate(row.metricEligibility)).length;
  const branded = rows.filter((row) => row.metricEligibility.brandingMode === "branded").length;
  const citation = rows.filter((row) => row.metricEligibility.citationCheck === "eligible").length;
  const notReady = rows.filter((row) => !row.readiness.measurementReady).length;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryMetric label="可視性/ranking候補" value={`${market}件`} helper="non-brandedのみ" />
      <SummaryMetric label="brand perception" value={`${branded}件`} helper="sentiment用途" />
      <SummaryMetric label="citation check" value={`${citation}件`} helper="ranking evidenceではない" />
      <SummaryMetric label="measurement ready" value={`${rows.length - notReady}件`} helper={`${notReady}件は未承認`} />
    </div>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  helper
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-normal text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</p>
          {helper ? <p className="mt-1 truncate text-xs font-semibold text-slate-500">{helper}</p> : null}
        </div>
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StatusList({
  title,
  items,
  emptyText,
  tone
}: {
  title: string;
  items: readonly string[];
  emptyText: string;
  tone: "warning" | "neutral";
}) {
  const hasItems = items.length > 0;
  return (
    <div className={cn(
      "rounded-xl border px-4 py-3",
      hasItems && tone === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
    )}>
      <p className={cn(
        "text-sm font-bold",
        hasItems && tone === "warning" ? "text-amber-900" : "text-slate-800"
      )}>
        {title}
      </p>
      {hasItems ? (
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "warning" ? "bg-amber-500" : "bg-slate-400")} />
              <span>{labelFromSnake(item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-600">{emptyText}</p>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-bold text-slate-600">
        {label}{required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  readOnly = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-bold text-slate-600">
        {label}{required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        readOnly={readOnly}
        className={cn(
          "mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15",
          readOnly && "bg-slate-50 text-slate-600"
        )}
      />
    </label>
  );
}

function SegmentedBusinessType({
  value,
  onChange
}: {
  value: ProjectSetupBusinessType;
  onChange: (value: ProjectSetupBusinessType) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-bold text-slate-600">BtoB / BtoC / mixed</legend>
      <div className="mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {projectSetupBusinessTypeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 rounded-md px-4 text-sm font-bold transition",
              value === option.value
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-950"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewStatusSelect({
  value,
  onChange
}: {
  value: DraftReviewStatus;
  onChange: (value: DraftReviewStatus) => void;
}) {
  return (
    <label className="block min-w-[180px]">
      <span className="block text-xs font-bold text-slate-600">review status</span>
      <select
        value={isEditableReviewStatus(value) ? value : "needs_review"}
        onChange={(event) => onChange(event.target.value as DraftReviewStatus)}
        className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      >
        {editableReviewStatusOptions.map((status) => (
          <option key={status} value={status}>{labelFromSnake(status)}</option>
        ))}
      </select>
    </label>
  );
}

function ReadOnlyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function PromptFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="truncate text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function StatusChip({ value }: { value: string }) {
  return (
    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">
      {labelFromSnake(value)}
    </Badge>
  );
}

function WarningChip({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-800">
      {label}
    </Badge>
  );
}

function MetricStateChip({ label, value }: { label: string; value: "eligible" | "excluded" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full",
        value === "eligible"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {label}: {value === "eligible" ? "eligible" : "excluded"}
    </Badge>
  );
}

function FilterButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 max-w-[260px] shrink-0 truncate rounded-md px-3 text-sm font-bold transition",
        active
          ? "bg-white text-teal-800 shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-slate-950"
      )}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
    >
      {children}
    </button>
  );
}

function EmptyBlock({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-500">
      {text}
    </p>
  );
}

function buildPromptMetricRows(draft: ProjectSetupDraft): PromptMetricRow[] {
  const brandIdentity = getBrandIdentityFromDraft(draft);
  const topicById = new Map(draft.topics.map((topic) => [topic.topicId, topic]));
  const personaById = new Map(draft.personas.map((persona) => [persona.personaId, persona]));

  return draft.prompts.map((prompt) => ({
    prompt,
    topic: topicById.get(prompt.topicId) ?? null,
    persona: prompt.personaId ? personaById.get(prompt.personaId) ?? null : null,
    metricEligibility: derivePromptMetricEligibility(prompt, brandIdentity),
    readiness: getPromptMeasurementReadiness(prompt, brandIdentity)
  }));
}

function buildDraftSummary(
  draft: ProjectSetupDraft,
  promptRows: readonly PromptMetricRow[],
  result: ProjectSetupDraftGenerationResult | null
) {
  return {
    personaCount: draft.personas.length,
    topicCount: draft.topics.length,
    promptCount: draft.prompts.length,
    nonBrandedPromptCount: promptRows.filter((row) => row.metricEligibility.brandingMode === "non_branded").length,
    brandedPromptCount: promptRows.filter((row) => row.metricEligibility.brandingMode === "branded").length,
    marketMetricCandidateCount: promptRows.filter((row) => hasMarketMetricCandidate(row.metricEligibility)).length,
    blockerCount: result?.blockers.length ?? 0,
    warningCount: result?.warnings.length ?? 0
  };
}

function filterPromptRows(
  rows: readonly PromptMetricRow[],
  topicId: string,
  filter: PromptVisibilityFilter,
  intent: string,
  search: string
) {
  const normalizedSearch = search.trim().toLowerCase();

  return rows.filter((row) => {
    if (topicId !== "all" && row.prompt.topicId !== topicId) return false;
    if (intent !== "all" && row.prompt.intentType !== intent) return false;
    if (filter === "market" && !hasMarketMetricCandidate(row.metricEligibility)) return false;
    if (filter === "non_branded" && row.metricEligibility.brandingMode !== "non_branded") return false;
    if (filter === "branded" && row.metricEligibility.brandingMode !== "branded") return false;
    if (filter === "citation" && row.metricEligibility.citationCheck !== "eligible") return false;
    if (!normalizedSearch) return true;

    return [
      row.prompt.text,
      row.prompt.rawUserIntent,
      row.prompt.intent,
      row.prompt.intentType,
      row.prompt.category,
      row.topic?.topicName,
      row.persona?.displayName
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
}

function groupRowsByTopic(rows: readonly PromptMetricRow[]) {
  const grouped = new Map<string, PromptMetricRow[]>();

  for (const row of rows) {
    const key = row.topic?.topicId ?? "unknown-topic";
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return grouped;
}

function buildReviewJson(
  form: ProjectSetupFormState,
  result: ProjectSetupDraftGenerationResult | null,
  draft: ProjectSetupDraft | null
) {
  return JSON.stringify({
    screen: "internal_project_setup_draft_review_v1",
    safety: {
      internalOnly: true,
      localOnly: true,
      dbWrite: false,
      openAiApiCall: false,
      externalAiApiCall: false,
      webCrawl: false,
      generatedItemsAreApproved: false,
      generatedItemsAreMeasurementReady: false
    },
    intake: {
      brandName: form.brandName.trim(),
      companyName: form.companyName.trim(),
      brandAliases: splitLooseList(form.brandAliasesText),
      officialSiteUrl: form.officialSiteUrl.trim(),
      importantUrls: getFilledImportantUrls(form),
      businessDescription: form.businessDescription.trim(),
      industry: form.industry.trim(),
      businessType: getProjectSetupBusinessTypeLabel(form.businessType),
      targetRegions: splitLooseList(form.targetRegionsText),
      primaryCustomers: form.primaryCustomers.trim(),
      knownCompetitors: getFilledKnownCompetitors(form),
      strengths: splitLooseList(form.strengthsText),
      knownRisks: splitLooseList(form.knownRisksText)
    },
    generation: result ? {
      generatorVersion: result.generatorVersion,
      generatedAt: result.generatedAt,
      blockers: result.blockers,
      warnings: result.warnings,
      summary: result.generationSummary
    } : null,
    draft
  }, null, 2);
}

function hasMarketMetricCandidate(metricEligibility: PromptMetricEligibility) {
  return metricEligibility.visibilityRate === "eligible" ||
    metricEligibility.ranking === "eligible" ||
    metricEligibility.shareOfVoice === "eligible";
}

function metricBrandingLabel(metricEligibility: PromptMetricEligibility) {
  if (metricEligibility.brandingMode === "branded") return "branded / sentiment・brand perception用";
  if (metricEligibility.brandingMode === "brand_optional") return "brand optional / 分割前";
  if (metricEligibility.brandingMode === "competitor_only") return "competitor only";
  return "non-branded / visibility・ranking候補";
}

function labelFromSnake(value: string) {
  const knownLabels: Partial<Record<string, string>> = {
    needs_review: "レビュー待ち",
    needs_revision: "要修正",
    rejected: "却下",
    approved: "承認済み",
    draft: "draft",
    inferred: "推定",
    provided: "提供情報",
    missing: "不足",
    needs_confirmation: "確認待ち",
    brand_excluded: "brand excluded",
    brand_included: "brand included",
    brand_optional: "brand optional",
    ready_for_prompt_design: "prompt設計可",
    usable_with_caution: "注意付きで利用可",
    needs_more_evidence: "追加根拠が必要",
    do_not_handoff: "handoff不可",
    topic_ready: "topic ready",
    revise_before_measurement: "測定前修正",
    internal_only: "internal only",
    ready_for_measurement: "measurement ready"
  };

  return knownLabels[value] ?? value.replace(/_/g, " ");
}

function isEditableReviewStatus(value: DraftReviewStatus): value is typeof editableReviewStatusOptions[number] {
  return (editableReviewStatusOptions as readonly DraftReviewStatus[]).includes(value);
}
