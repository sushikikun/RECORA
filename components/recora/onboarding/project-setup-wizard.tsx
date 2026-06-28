"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Info,
  Plus,
  RotateCcw,
  Trash2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  derivePromptMetricEligibility,
  validateProjectSetupSeedInput
} from "@/lib/recora/project-setup-draft";
import type {
  BrandIdentityForDraft,
  PersonaDraft,
  ProjectSetupSeedInput,
  PromptDraft,
  PromptIntent,
  PromptMetricEligibility,
  TopicDraft
} from "@/lib/recora/project-setup-draft";
import { generateProjectSetupDraft } from "@/lib/recora/project-setup-draft-generator";
import type { ProjectSetupDraftGenerationResult } from "@/lib/recora/project-setup-draft-generator";
import { cn } from "@/lib/utils";

const steps = [
  { title: "会社情報を入力", short: "入力" },
  { title: "カテゴリ判定", short: "判定" },
  { title: "ペルソナ下書き", short: "ペルソナ" },
  { title: "トピック下書き", short: "トピック" },
  { title: "プロンプト下書き", short: "プロンプト" },
  { title: "最終確認", short: "確認" }
] as const;

const promptIntentOptions: { value: PromptIntent; label: string; description: string }[] = [
  { value: "non_branded", label: "AI表示率 / ranking / SOV", description: "ブランド名を含めない発見・比較用" },
  { value: "buyer_intent", label: "購買検討", description: "候補選定や導入前確認" },
  { value: "citation_check", label: "引用確認", description: "参照元や根拠の確認用" },
  { value: "brand_perception", label: "ブランド認知", description: "sentiment / brand perception 用" }
];

const promptFilters = [
  { id: "all", label: "すべて" },
  { id: "non_branded", label: "指標候補" },
  { id: "branded", label: "ブランド認知" },
  { id: "citation_check", label: "引用確認" },
  { id: "excluded", label: "対象外 / 要確認" }
] as const;

type PromptFilter = (typeof promptFilters)[number]["id"];
type AudienceOverride = "auto" | "b2b" | "b2c";
type CopyState = "idle" | "copied" | "failed";

type SeedFormState = {
  companyName: string;
  brandName: string;
  serviceName: string;
  officialSiteUrl: string;
  productOrServiceDescription: string;
  industryCategory: string;
  targetCustomers: string;
  regionsText: string;
  language: string;
  strengthsText: string;
  knownRisksText: string;
  diagnosisGoalText: string;
  brandAliasesText: string;
  knownCompetitorsText: string;
  avoidCompetitorsText: string;
  priorityPromptsText: string;
  diagnosisGoals: PromptIntent[];
};

type GenerationState =
  | { result: ProjectSetupDraftGenerationResult; error: null }
  | { result: null; error: string };

type PromptGroup = "non_branded" | "branded" | "citation_check" | "excluded";

type PriorityPromptCandidate = {
  id: string;
  text: string;
  group: PromptGroup;
  label: string;
  reasons: string[];
};

const initialFormState: SeedFormState = {
  companyName: "",
  brandName: "",
  serviceName: "",
  officialSiteUrl: "",
  productOrServiceDescription: "",
  industryCategory: "",
  targetCustomers: "",
  regionsText: "日本",
  language: "ja",
  strengthsText: "",
  knownRisksText: "",
  diagnosisGoalText: "",
  brandAliasesText: "",
  knownCompetitorsText: "",
  avoidCompetitorsText: "",
  priorityPromptsText: "",
  diagnosisGoals: ["non_branded", "buyer_intent", "citation_check", "brand_perception"]
};

export function ProjectSetupWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<SeedFormState>(initialFormState);
  const [audienceOverride, setAudienceOverride] = useState<AudienceOverride>("auto");
  const [showSeedErrors, setShowSeedErrors] = useState(false);
  const [personas, setPersonas] = useState<PersonaDraft[] | null>(null);
  const [topics, setTopics] = useState<TopicDraft[] | null>(null);
  const [prompts, setPrompts] = useState<PromptDraft[] | null>(null);
  const [extraPriorityPromptsText, setExtraPriorityPromptsText] = useState("");
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [promptFilter, setPromptFilter] = useState<PromptFilter>("all");
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const seedInput = useMemo(
    () => buildSeedInput(formState, audienceOverride),
    [formState, audienceOverride]
  );
  const seedBlockers = useMemo(() => validateProjectSetupSeedInput(seedInput), [seedInput]);
  const generationState = useMemo(() => safelyGenerateDraft(seedInput), [seedInput]);
  const generatedDraft = generationState.result?.draft ?? null;
  const brandIdentity = useMemo(() => buildBrandIdentity(seedInput), [seedInput]);

  const visiblePersonas = useMemo<PersonaDraft[]>(
    () => personas ?? [...(generatedDraft?.personas ?? [])],
    [generatedDraft, personas]
  );
  const visibleTopics = useMemo<TopicDraft[]>(
    () => topics ?? [...(generatedDraft?.topics ?? [])],
    [generatedDraft, topics]
  );
  const visiblePrompts = useMemo<PromptDraft[]>(
    () => prompts ?? [...(generatedDraft?.prompts ?? [])],
    [generatedDraft, prompts]
  );

  const priorityPrompts = useMemo(
    () => buildPriorityPromptCandidates(formState, extraPriorityPromptsText, brandIdentity, seedInput),
    [formState, extraPriorityPromptsText, brandIdentity, seedInput]
  );
  const promptSummaries = useMemo(
    () => visiblePrompts.map((prompt) => {
      const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
      return {
        prompt,
        eligibility,
        group: getPromptGroup(prompt, eligibility)
      };
    }),
    [visiblePrompts, brandIdentity]
  );
  const filteredPromptSummaries = promptSummaries.filter((summary) =>
    promptFilter === "all" ? true : summary.group === promptFilter
  );
  const promptBreakdown = getPromptBreakdown(promptSummaries, priorityPrompts);
  const businessModel = getInputCompletionValue(generatedDraft, "businessModel");
  const industryAdapter = getInputCompletionValue(generatedDraft, "industryAdapter");
  const inferredAudience = audienceOverride === "auto"
    ? inferAudienceFromBusinessModel(businessModel)
    : audienceOverride;

  const canAdvanceFromInput = seedBlockers.length === 0 && generationState.result !== null;

  function updateField(field: keyof SeedFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function toggleDiagnosisGoal(goal: PromptIntent) {
    setFormState((current) => {
      const exists = current.diagnosisGoals.includes(goal);
      const diagnosisGoals = exists
        ? current.diagnosisGoals.filter((item) => item !== goal)
        : [...current.diagnosisGoals, goal];
      return { ...current, diagnosisGoals };
    });
  }

  function ensureDraftStateInitialized() {
    if (!generationState.result) return false;
    const { draft } = generationState.result;
    setPersonas((current) => current ?? draft.personas.map((item) => ({ ...item })));
    setTopics((current) => current ?? draft.topics.map((item) => ({ ...item })));
    setPrompts((current) => current ?? draft.prompts.map((item) => ({ ...item })));
    return true;
  }

  function goNext() {
    setCopyState("idle");
    if (stepIndex === 0) {
      setShowSeedErrors(true);
      if (!canAdvanceFromInput) return;
    }
    if (stepIndex === 1 && (!generationState.result || !ensureDraftStateInitialized())) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setCopyState("idle");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function restartWizard() {
    setFormState(initialFormState);
    setAudienceOverride("auto");
    setShowSeedErrors(false);
    setPersonas(null);
    setTopics(null);
    setPrompts(null);
    setExtraPriorityPromptsText("");
    setShowPromptDetails(false);
    setPromptFilter("all");
    setCopyState("idle");
    setStepIndex(0);
  }

  async function copyConfirmationText() {
    setCopyState("idle");
    const text = buildConfirmationText({
      seedInput,
      businessModel,
      audience: inferredAudience,
      personas: visiblePersonas,
      topics: visibleTopics,
      prompts: visiblePrompts,
      priorityPrompts,
      diagnosisGoalMemo: formState.diagnosisGoalText,
      blockers: generationState.result?.blockers ?? seedBlockers,
      warnings: generationState.result?.warnings ?? []
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#F6FAF9] text-slate-950">
      <section className="border-b border-[#DDE8E5] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#00796B]">無料診断の初期設定</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-normal text-[#0F172A] sm:text-4xl">
              会社情報から、persona / topic / prompt の下書きまで確認する
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#64748B]">
              このウィザードは新規登録後の下書き確認 UI です。保存・承認・計測反映はまだ行いません。
            </p>
          </div>
          <div className="rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] px-4 py-3 text-sm leading-6 text-[#475569]">
            <strong className="block text-[#0F172A]">今回の範囲</strong>
            DB writeなし / 外部APIなし / 計測実行なし
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StepRail stepIndex={stepIndex} />
        </aside>

        <section className="min-w-0">
          {stepIndex === 0 ? (
            <InputStep
              formState={formState}
              updateField={updateField}
              toggleDiagnosisGoal={toggleDiagnosisGoal}
              showSeedErrors={showSeedErrors}
              seedBlockers={seedBlockers}
              generationState={generationState}
            />
          ) : null}
          {stepIndex === 1 ? (
            <ClassificationStep
              formState={formState}
              updateField={updateField}
              audienceOverride={audienceOverride}
              setAudienceOverride={setAudienceOverride}
              generatedDraft={generatedDraft}
              businessModel={businessModel}
              industryAdapter={industryAdapter}
              inferredAudience={inferredAudience}
              generationState={generationState}
            />
          ) : null}
          {stepIndex === 2 ? (
            <PersonaStep personas={visiblePersonas} setPersonas={setPersonas} seedInput={seedInput} />
          ) : null}
          {stepIndex === 3 ? (
            <TopicStep topics={visibleTopics} setTopics={setTopics} personas={visiblePersonas} seedInput={seedInput} />
          ) : null}
          {stepIndex === 4 ? (
            <PromptStep
              prompts={visiblePrompts}
              setPrompts={setPrompts}
              topics={visibleTopics}
              personas={visiblePersonas}
              seedInput={seedInput}
              priorityPrompts={priorityPrompts}
              extraPriorityPromptsText={extraPriorityPromptsText}
              setExtraPriorityPromptsText={setExtraPriorityPromptsText}
              promptFilter={promptFilter}
              setPromptFilter={setPromptFilter}
              promptSummaries={filteredPromptSummaries}
              promptBreakdown={promptBreakdown}
              showPromptDetails={showPromptDetails}
              setShowPromptDetails={setShowPromptDetails}
            />
          ) : null}
          {stepIndex === 5 ? (
            <ConfirmStep
              seedInput={seedInput}
              businessModel={businessModel}
              inferredAudience={inferredAudience}
              personas={visiblePersonas}
              topics={visibleTopics}
              prompts={visiblePrompts}
              priorityPrompts={priorityPrompts}
              diagnosisGoalMemo={formState.diagnosisGoalText}
              promptBreakdown={promptBreakdown}
              blockers={generationState.result?.blockers ?? seedBlockers}
              warnings={generationState.result?.warnings ?? []}
              copyState={copyState}
              onCopy={copyConfirmationText}
              onRestart={restartWizard}
            />
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-[#DDE8E5] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-xs font-semibold leading-5 text-[#64748B]">
                この画面内の編集は保存されません。ページを再読み込みすると消えます。
              </p>
              {stepIndex < steps.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  次へ進む
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={restartWizard}>
                  <RotateCcw className="h-4 w-4" />
                  最初からやり直す
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StepRail({ stepIndex }: { stepIndex: number }) {
  return (
    <nav className="rounded-lg border border-[#DDE8E5] bg-white p-4" aria-label="初期設定ステップ">
      <ol className="space-y-2">
        {steps.map((step, index) => {
          const isActive = index === stepIndex;
          const isDone = index < stepIndex;
          return (
            <li key={step.title}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold",
                  isActive && "bg-[#E6F4F1] text-[#005C50]",
                  isDone && "text-[#00796B]",
                  !isActive && !isDone && "text-[#64748B]"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                    isActive && "border-[#00796B] bg-white",
                    isDone && "border-[#00796B] bg-[#00796B] text-white",
                    !isActive && !isDone && "border-[#DDE8E5] bg-white"
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span>{step.short}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function InputStep({
  formState,
  updateField,
  toggleDiagnosisGoal,
  showSeedErrors,
  seedBlockers,
  generationState
}: {
  formState: SeedFormState;
  updateField: (field: keyof SeedFormState, value: string) => void;
  toggleDiagnosisGoal: (goal: PromptIntent) => void;
  showSeedErrors: boolean;
  seedBlockers: string[];
  generationState: GenerationState;
}) {
  return (
    <WizardPanel
      eyebrow="Step 1"
      title="会社情報を入力"
      description="URLは入力値として扱うだけで、fetch / crawl は行いません。配列項目は1行1件またはカンマ区切りで入力できます。"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <TextInput label="会社名" value={formState.companyName} onChange={(value) => updateField("companyName", value)} required />
        <TextInput label="ブランド名 / サービス名" value={formState.brandName} onChange={(value) => updateField("brandName", value)} required />
        <TextInput label="サービス名（任意）" value={formState.serviceName} onChange={(value) => updateField("serviceName", value)} />
        <TextInput label="公式URL" value={formState.officialSiteUrl} onChange={(value) => updateField("officialSiteUrl", value)} required placeholder="https://example.com" />
        <TextInput label="業種カテゴリ" value={formState.industryCategory} onChange={(value) => updateField("industryCategory", value)} required placeholder="例: BtoB SaaS、採用支援、地域サービス" />
        <TextInput label="主な顧客層" value={formState.targetCustomers} onChange={(value) => updateField("targetCustomers", value)} required placeholder="例: 中小企業の経営者、人事責任者" />
        <TextInput label="対象地域" value={formState.regionsText} onChange={(value) => updateField("regionsText", value)} required />
        <TextInput label="言語" value={formState.language} onChange={(value) => updateField("language", value)} required />
      </div>

      <div className="mt-5 grid gap-5">
        <TextareaInput
          label="サービス概要"
          value={formState.productOrServiceDescription}
          onChange={(value) => updateField("productOrServiceDescription", value)}
          required
          rows={4}
          placeholder="何を、誰に、どのような価値として提供しているかを短く入力してください。"
        />
        <TextareaInput label="強み" value={formState.strengthsText} onChange={(value) => updateField("strengthsText", value)} placeholder="例: 導入支援が手厚い、比較資料が豊富" />
        <TextareaInput label="既知のリスク / 注意点" value={formState.knownRisksText} onChange={(value) => updateField("knownRisksText", value)} placeholder="例: 料金体系が分かりにくい、導入まで時間がかかる" />
        <TextareaInput label="診断したい目的（確認用メモ）" value={formState.diagnosisGoalText} onChange={(value) => updateField("diagnosisGoalText", value)} placeholder="例: 競合だけが候補になる質問を見つけたい" />
        <p className="text-xs font-semibold leading-5 text-[#64748B]">
          このメモは画面と最終確認用です。ProjectSetupSeedInput には含めず、generator の下書き生成条件には使いません。
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4">
        <h3 className="text-sm font-bold text-[#0F172A]">診断目的の候補</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {promptIntentOptions.map((option) => (
            <label key={option.value} className="flex gap-3 rounded-md border border-[#DDE8E5] bg-white p-3 text-sm">
              <input
                className="mt-1 h-4 w-4 accent-[#00796B]"
                type="checkbox"
                checked={formState.diagnosisGoals.includes(option.value)}
                onChange={() => toggleDiagnosisGoal(option.value)}
              />
              <span>
                <span className="block font-bold text-[#0F172A]">{option.label}</span>
                <span className="mt-1 block leading-5 text-[#64748B]">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <TextareaInput label="brand aliases（任意）" value={formState.brandAliasesText} onChange={(value) => updateField("brandAliasesText", value)} />
        <TextareaInput label="knownCompetitors（任意）" value={formState.knownCompetitorsText} onChange={(value) => updateField("knownCompetitorsText", value)} />
        <TextareaInput label="avoidCompetitors（任意）" value={formState.avoidCompetitorsText} onChange={(value) => updateField("avoidCompetitorsText", value)} />
        <TextareaInput
          label="入れてほしいプロンプト（任意）"
          value={formState.priorityPromptsText}
          onChange={(value) => updateField("priorityPromptsText", value)}
          placeholder="1行1promptで入力してください。"
        />
      </div>

      {showSeedErrors && seedBlockers.length > 0 ? (
        <MessageBox tone="error" title="必須入力不足">
          <ul className="list-inside list-disc space-y-1">
            {seedBlockers.map((blocker) => (
              <li key={blocker}>{translateBlocker(blocker)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}

      {generationState.error ? (
        <MessageBox tone="error" title="unexpected error">
          下書き生成中に予期しないエラーが発生しました。入力内容を見直してください。
        </MessageBox>
      ) : null}
    </WizardPanel>
  );
}

function ClassificationStep({
  formState,
  updateField,
  audienceOverride,
  setAudienceOverride,
  generatedDraft,
  businessModel,
  industryAdapter,
  inferredAudience,
  generationState
}: {
  formState: SeedFormState;
  updateField: (field: keyof SeedFormState, value: string) => void;
  audienceOverride: AudienceOverride;
  setAudienceOverride: (value: AudienceOverride) => void;
  generatedDraft: ProjectSetupDraftGenerationResult["draft"] | null;
  businessModel: string;
  industryAdapter: string;
  inferredAudience: AudienceOverride;
  generationState: GenerationState;
}) {
  return (
    <WizardPanel
      eyebrow="Step 2"
      title="カテゴリ / BtoB・BtoC 判定"
      description="既存の deterministic generator から推定した分類です。必要に応じて画面内だけで補正できます。"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile label="推定カテゴリ" value={formState.industryCategory || "未入力"} />
        <SummaryTile label="business model" value={businessModel || "未判定"} />
        <SummaryTile label="BtoB / BtoC 判定" value={formatAudience(inferredAudience)} />
      </div>

      <div className="mt-5 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00796B]" />
          <div className="text-sm leading-6 text-[#475569]">
            <p className="font-bold text-[#0F172A]">判定理由</p>
            <p>
              業種カテゴリ、サービス概要、主な顧客層、対象地域から deterministic に推定しています。
              industry adapter は <span className="font-bold text-[#0F172A]">{industryAdapter || "未判定"}</span> です。
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <TextInput label="業種カテゴリを変更" value={formState.industryCategory} onChange={(value) => updateField("industryCategory", value)} />
        <TextInput label="主な顧客層を変更" value={formState.targetCustomers} onChange={(value) => updateField("targetCustomers", value)} />
        <TextInput label="対象地域を変更" value={formState.regionsText} onChange={(value) => updateField("regionsText", value)} />
        <TextInput label="確認用メモを変更" value={formState.diagnosisGoalText} onChange={(value) => updateField("diagnosisGoalText", value)} />
      </div>
      <DraftNotice label="確認用メモは generator の入力ではありません。下書き生成条件には使わず、最終確認で見返すためだけに表示します。" />

      <div className="mt-6">
        <label className="text-sm font-bold text-[#0F172A]">BtoB / BtoC 判定を変更</label>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { value: "auto", label: "自動判定", note: "入力内容から推定" },
            { value: "b2b", label: "BtoB", note: "法人向け意図を下書きへ反映" },
            { value: "b2c", label: "BtoC", note: "一般消費者向け意図を下書きへ反映" }
          ].map((option) => (
            <button
              key={option.value}
              className={cn(
                "rounded-md border p-3 text-left text-sm transition",
                audienceOverride === option.value
                  ? "border-[#00796B] bg-[#E6F4F1] text-[#005C50]"
                  : "border-[#DDE8E5] bg-white text-[#64748B] hover:border-[#00796B]/40"
              )}
              type="button"
              onClick={() => setAudienceOverride(option.value as AudienceOverride)}
            >
              <span className="block font-bold">{option.label}</span>
              <span className="mt-1 block leading-5">{option.note}</span>
            </button>
          ))}
        </div>
      </div>

      {generationState.result?.blockers.length ? (
        <MessageBox tone="error" title="generator validation blocker">
          <ul className="list-inside list-disc space-y-1">
            {generationState.result.blockers.map((blocker) => (
              <li key={blocker}>{translateBlocker(blocker)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}

      {generationState.result?.warnings.length ? (
        <MessageBox tone="warning" title="generator validation warning">
          <ul className="list-inside list-disc space-y-1">
            {generationState.result.warnings.map((warning) => (
              <li key={warning}>{translateWarning(warning)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}

      {generatedDraft ? (
        <p className="mt-5 text-xs font-semibold leading-5 text-[#64748B]">
          生成された draft は reviewStatus: {generatedDraft.reviewStatus} です。measurement ready ではありません。
        </p>
      ) : null}
    </WizardPanel>
  );
}

function PersonaStep({
  personas,
  setPersonas,
  seedInput
}: {
  personas: PersonaDraft[];
  setPersonas: (items: PersonaDraft[]) => void;
  seedInput: ProjectSetupSeedInput;
}) {
  return (
    <WizardPanel
      eyebrow="Step 3"
      title="ペルソナ下書き"
      description="生成された persona は仮説です。保存・承認・計測反映はまだ行いません。"
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => setPersonas([...personas, createManualPersona(seedInput, personas.length)])}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      }
    >
      <div className="space-y-4">
        {personas.map((persona, index) => (
          <EditablePersonaCard
            key={persona.personaId}
            persona={persona}
            index={index}
            onChange={(updated) => setPersonas(replaceAt(personas, index, updated))}
            onRemove={() => setPersonas(personas.filter((_, itemIndex) => itemIndex !== index))}
          />
        ))}
        {personas.length === 0 ? <EmptyDraftState label="ペルソナは0件です。削除した状態を保持しています。" /> : null}
      </div>
      <DraftNotice label="このペルソナは下書きです。保存・承認・計測反映はまだ行いません。" />
    </WizardPanel>
  );
}

function TopicStep({
  topics,
  setTopics,
  personas,
  seedInput
}: {
  topics: TopicDraft[];
  setTopics: (items: TopicDraft[]) => void;
  personas: PersonaDraft[];
  seedInput: ProjectSetupSeedInput;
}) {
  return (
    <WizardPanel
      eyebrow="Step 4"
      title="トピック下書き"
      description="topic は prompt より先に確認する観測テーマです。編集は画面内 state だけで保持します。"
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => setTopics([...topics, createManualTopic(seedInput, personas, topics.length)])}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      }
    >
      <div className="space-y-4">
        {topics.map((topic, index) => (
          <EditableTopicCard
            key={topic.topicId}
            topic={topic}
            personas={personas}
            index={index}
            onChange={(updated) => setTopics(replaceAt(topics, index, updated))}
            onRemove={() => setTopics(topics.filter((_, itemIndex) => itemIndex !== index))}
          />
        ))}
        {topics.length === 0 ? <EmptyDraftState label="トピックは0件です。削除した状態を保持しています。" /> : null}
      </div>
      <DraftNotice label="このトピックは下書きです。保存・承認・計測反映はまだ行いません。" />
    </WizardPanel>
  );
}

function PromptStep({
  prompts,
  setPrompts,
  topics,
  personas,
  seedInput,
  priorityPrompts,
  extraPriorityPromptsText,
  setExtraPriorityPromptsText,
  promptFilter,
  setPromptFilter,
  promptSummaries,
  promptBreakdown,
  showPromptDetails,
  setShowPromptDetails
}: {
  prompts: PromptDraft[];
  setPrompts: (items: PromptDraft[]) => void;
  topics: TopicDraft[];
  personas: PersonaDraft[];
  seedInput: ProjectSetupSeedInput;
  priorityPrompts: PriorityPromptCandidate[];
  extraPriorityPromptsText: string;
  setExtraPriorityPromptsText: (value: string) => void;
  promptFilter: PromptFilter;
  setPromptFilter: (value: PromptFilter) => void;
  promptSummaries: { prompt: PromptDraft; eligibility: PromptMetricEligibility; group: PromptGroup }[];
  promptBreakdown: Record<PromptGroup, number>;
  showPromptDetails: boolean;
  setShowPromptDetails: (value: boolean) => void;
}) {
  return (
    <WizardPanel
      eyebrow="Step 5"
      title="プロンプト下書き"
      description="詳細は初期状態で畳んでいます。優先採用候補は画面上の優先表示であり、正式採用・計測反映は別PRです。"
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => setPrompts([...prompts, createManualPrompt(seedInput, topics, personas, prompts.length)])}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryTile label="指標候補" value={`${promptBreakdown.non_branded}件`} />
        <SummaryTile label="ブランド認知" value={`${promptBreakdown.branded}件`} />
        <SummaryTile label="引用確認" value={`${promptBreakdown.citation_check}件`} />
        <SummaryTile label="対象外 / 要確認" value={`${promptBreakdown.excluded}件`} />
      </div>

      <div className="mt-6 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">優先採用候補</h3>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              brand / alias / domain / competitor を含む prompt は visibility / ranking / SOV 対象外候補として表示します。
            </p>
          </div>
          <TextareaInput
            className="lg:w-[360px]"
            label="このステップで追加"
            value={extraPriorityPromptsText}
            onChange={setExtraPriorityPromptsText}
            placeholder="1行1prompt"
            rows={3}
          />
        </div>
        <div className="mt-4 space-y-2">
          {priorityPrompts.length > 0 ? priorityPrompts.map((candidate) => (
            <div key={candidate.id} className="rounded-md border border-[#DDE8E5] bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm font-bold leading-6 text-[#0F172A]">{candidate.text}</p>
                <PromptGroupBadge group={candidate.group} label={candidate.label} />
              </div>
              {candidate.reasons.length ? (
                <p className="mt-2 text-xs font-semibold leading-5 text-[#64748B]">{candidate.reasons.join(" / ")}</p>
              ) : null}
            </div>
          )) : (
            <p className="text-sm leading-6 text-[#64748B]">優先採用候補はまだ入力されていません。</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {promptFilters.map((filter) => (
            <button
              key={filter.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                promptFilter === filter.id
                  ? "border-[#00796B] bg-[#00796B] text-white"
                  : "border-[#DDE8E5] bg-white text-[#64748B] hover:border-[#00796B]/40"
              )}
              type="button"
              onClick={() => setPromptFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={() => setShowPromptDetails(!showPromptDetails)}>
          {showPromptDetails ? "プロンプト詳細を畳む" : "プロンプトを確認・変更する"}
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {promptSummaries.map(({ prompt, eligibility, group }) => (
          <EditablePromptCard
            key={prompt.promptId}
            prompt={prompt}
            topics={topics}
            personas={personas}
            eligibility={eligibility}
            group={group}
            expanded={showPromptDetails}
            onChange={(updated) => setPrompts(prompts.map((item) => item.promptId === prompt.promptId ? updated : item))}
            onRemove={() => setPrompts(prompts.filter((item) => item.promptId !== prompt.promptId))}
            onMove={(direction) => setPrompts(moveById(prompts, prompt.promptId, direction))}
          />
        ))}
        {prompts.length === 0 ? <EmptyDraftState label="プロンプトは0件です。削除した状態を保持しています。" /> : null}
      </div>
      <DraftNotice label="未承認promptは measurement ready ではありません。branded / citation_check / 実名競合入りpromptは visibility / ranking / SOV から分離します。" />
    </WizardPanel>
  );
}

function ConfirmStep({
  seedInput,
  businessModel,
  inferredAudience,
  personas,
  topics,
  prompts,
  priorityPrompts,
  diagnosisGoalMemo,
  promptBreakdown,
  blockers,
  warnings,
  copyState,
  onCopy,
  onRestart
}: {
  seedInput: ProjectSetupSeedInput;
  businessModel: string;
  inferredAudience: AudienceOverride;
  personas: PersonaDraft[];
  topics: TopicDraft[];
  prompts: PromptDraft[];
  priorityPrompts: PriorityPromptCandidate[];
  diagnosisGoalMemo: string;
  promptBreakdown: Record<PromptGroup, number>;
  blockers: string[];
  warnings: string[];
  copyState: CopyState;
  onCopy: () => void;
  onRestart: () => void;
}) {
  return (
    <WizardPanel
      eyebrow="Step 6"
      title="最終確認"
      description="ここまでの入力・判定・下書きを一覧で確認します。保存・承認・計測反映はまだ行いません。"
      action={
        <Button type="button" variant="outline" size="sm" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" />
          最初からやり直す
        </Button>
      }
    >
      <MessageBox tone="warning" title="この下書きは未承認です">
        保存・承認・計測反映はまだ行いません。non-branded prompt はAI表示率 / ranking / SOV の候補です。branded prompt は sentiment / brand perception 用です。citation_check は引用確認用です。
      </MessageBox>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile label="会社 / ブランド" value={`${seedInput.companyName || "未入力"} / ${seedInput.brandName || "未入力"}`} />
        <SummaryTile label="カテゴリ / 判定" value={`${seedInput.industryCategory || "未入力"} / ${formatAudience(inferredAudience)}`} />
        <SummaryTile label="business model" value={businessModel || "未判定"} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryTile label="ペルソナ下書き" value={`${personas.length}件`} />
        <SummaryTile label="トピック下書き" value={`${topics.length}件`} />
        <SummaryTile label="プロンプト下書き" value={`${prompts.length}件`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <SummaryTile label="non-branded" value={`${promptBreakdown.non_branded}件`} />
        <SummaryTile label="branded" value={`${promptBreakdown.branded}件`} />
        <SummaryTile label="citation_check" value={`${promptBreakdown.citation_check}件`} />
        <SummaryTile label="対象外" value={`${promptBreakdown.excluded}件`} />
      </div>

      <ReviewList title="ペルソナ一覧" items={personas.map((persona) => `${persona.displayName} / ${persona.roleType} / ${persona.reviewStatus}`)} />
      <ReviewList title="トピック一覧" items={topics.map((topic) => `${topic.topicName} / ${topic.topicType} / ${topic.reviewStatus}`)} />
      <ReviewList title="優先採用候補prompt" items={priorityPrompts.map((candidate) => `${candidate.text} / ${candidate.label}`)} emptyText="優先採用候補はありません。" />
      <ReviewList
        title="診断したい目的（確認用メモ）"
        items={diagnosisGoalMemo.trim() ? [diagnosisGoalMemo.trim()] : []}
        emptyText="確認用メモはありません。"
      />
      <DraftNotice label="確認用メモは下書き生成条件には使っていません。保存・承認・計測反映もまだ行いません。" />

      {blockers.length ? (
        <MessageBox tone="error" title="validation blocker">
          <ul className="list-inside list-disc space-y-1">
            {blockers.map((blocker) => (
              <li key={blocker}>{translateBlocker(blocker)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}
      {warnings.length ? (
        <MessageBox tone="warning" title="validation warning">
          <ul className="list-inside list-disc space-y-1">
            {warnings.map((warning) => (
              <li key={warning}>{translateWarning(warning)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}

      <div className="mt-6">
        <Button type="button" onClick={onCopy}>
          <Clipboard className="h-4 w-4" />
          確認用テキストをコピー
        </Button>
        {copyState === "copied" ? <p className="mt-2 text-sm font-bold text-[#00796B]">コピーしました。</p> : null}
        {copyState === "failed" ? <p className="mt-2 text-sm font-bold text-rose-700">ブラウザの権限によりコピーできませんでした。</p> : null}
      </div>
    </WizardPanel>
  );
}

function EditablePersonaCard({
  persona,
  index,
  onChange,
  onRemove
}: {
  persona: PersonaDraft;
  index: number;
  onChange: (persona: PersonaDraft) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-4">
      <EditableHeader title={`ペルソナ ${index + 1}`} status={persona.reviewStatus} onRemove={onRemove} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TextInput label="ペルソナ名" value={persona.displayName} onChange={(value) => onChange({ ...persona, displayName: value })} />
        <TextInput label="segment" value={persona.segment} onChange={(value) => onChange({ ...persona, segment: value })} />
        <TextInput label="buyer journey / intent" value={persona.buyerStage} onChange={(value) => onChange({ ...persona, buyerStage: value as PersonaDraft["buyerStage"] })} />
        <TextInput label="review status" value={persona.reviewStatus} onChange={(value) => onChange({ ...persona, reviewStatus: value as PersonaDraft["reviewStatus"] })} />
      </div>
      <TextareaInput className="mt-4" label="説明 / prompt angle" value={persona.promptAngle} onChange={(value) => onChange({ ...persona, promptAngle: value })} />
      <TextareaInput className="mt-4" label="想定課題" value={persona.painPoints.join("\n")} onChange={(value) => onChange({ ...persona, painPoints: splitList(value) })} />
    </div>
  );
}

function EditableTopicCard({
  topic,
  personas,
  index,
  onChange,
  onRemove
}: {
  topic: TopicDraft;
  personas: PersonaDraft[];
  index: number;
  onChange: (topic: TopicDraft) => void;
  onRemove: () => void;
}) {
  const personaName = personas.find((persona) => persona.personaId === topic.targetPersonaId)?.displayName ?? "未設定";
  return (
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-4">
      <EditableHeader title={`トピック ${index + 1}`} status={topic.reviewStatus} onRemove={onRemove} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TextInput label="topic名" value={topic.topicName} onChange={(value) => onChange({ ...topic, topicName: value })} />
        <TextInput label="topic type" value={topic.topicType} onChange={(value) => onChange({ ...topic, topicType: value as TopicDraft["topicType"] })} />
        <TextInput label="紐づく persona" value={personaName} onChange={() => undefined} disabled />
        <TextInput label="review status" value={topic.reviewStatus} onChange={(value) => onChange({ ...topic, reviewStatus: value as TopicDraft["reviewStatus"] })} />
      </div>
      <TextareaInput className="mt-4" label="説明 / diagnosis goal" value={topic.diagnosisGoal} onChange={(value) => onChange({ ...topic, diagnosisGoal: value })} />
      <TextareaInput className="mt-4" label="expected signal / metric target" value={topic.expectedSignal} onChange={(value) => onChange({ ...topic, expectedSignal: value })} />
    </div>
  );
}

function EditablePromptCard({
  prompt,
  topics,
  personas,
  eligibility,
  group,
  expanded,
  onChange,
  onRemove,
  onMove
}: {
  prompt: PromptDraft;
  topics: TopicDraft[];
  personas: PersonaDraft[];
  eligibility: PromptMetricEligibility;
  group: PromptGroup;
  expanded: boolean;
  onChange: (prompt: PromptDraft) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const topicName = topics.find((topic) => topic.topicId === prompt.topicId)?.topicName ?? "未設定";
  const personaName = personas.find((persona) => persona.personaId === prompt.personaId)?.displayName ?? "未設定";

  return (
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <PromptGroupBadge group={group} label={getPromptGroupLabel(group)} />
            <Badge variant="outline" className="rounded-full border-[#DDE8E5] text-[#64748B]">
              {prompt.reviewStatus}
            </Badge>
          </div>
          <p className="mt-3 break-words text-sm font-bold leading-6 text-[#0F172A]">{prompt.text}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-[#64748B]">
            topic: {topicName} / persona: {personaName}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onMove(-1)}>上へ</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onMove(1)}>下へ</Button>
          <Button type="button" variant="ghost" size="icon" aria-label="削除" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-4">
          <TextareaInput label="prompt text" value={prompt.text} onChange={(value) => onChange({ ...prompt, text: value })} rows={3} />
          <div className="grid gap-4 lg:grid-cols-3">
            <TextInput label="prompt intent" value={prompt.intent} onChange={(value) => onChange({ ...prompt, intent: value as PromptDraft["intent"] })} />
            <TextInput label="branding mode" value={prompt.brandingMode} onChange={(value) => onChange({ ...prompt, brandingMode: value as PromptDraft["brandingMode"] })} />
            <TextInput label="brandMentionRule" value={prompt.brandMentionRule} onChange={(value) => onChange({ ...prompt, brandMentionRule: value as PromptDraft["brandMentionRule"] })} />
          </div>
          <div className="rounded-md border border-[#DDE8E5] bg-[#F8FBFA] p-3 text-xs font-semibold leading-5 text-[#64748B]">
            metric eligibility: {formatMetricEligibility(eligibility)}
            {eligibility.reasons.length ? <span className="block pt-1">{eligibility.reasons.join(" / ")}</span> : null}
          </div>
          <TextareaInput label="expected signal" value={prompt.expectedSignal} onChange={(value) => onChange({ ...prompt, expectedSignal: value })} />
        </div>
      ) : null}
    </div>
  );
}

function WizardPanel({
  eyebrow,
  title,
  description,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[#DDE8E5] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-[#00796B]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight tracking-normal text-[#0F172A]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="pt-5">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#0F172A]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[#DDE8E5] bg-white px-3 text-sm text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15 disabled:bg-slate-50 disabled:text-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 3,
  className
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-bold text-[#0F172A]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <textarea
        className="mt-2 w-full resize-y rounded-md border border-[#DDE8E5] bg-white px-3 py-2 text-sm leading-6 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4">
      <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
      <p className="mt-2 break-words text-base font-bold leading-6 text-[#0F172A]">{value}</p>
    </div>
  );
}

function MessageBox({
  tone,
  title,
  children
}: {
  tone: "error" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  const isError = tone === "error";
  return (
    <div
      className={cn(
        "mt-5 rounded-lg border px-4 py-3 text-sm leading-6",
        isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      <p className="font-bold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function DraftNotice({ label }: { label: string }) {
  return (
    <div className="mt-5 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] px-4 py-3 text-sm font-semibold leading-6 text-[#475569]">
      {label}
    </div>
  );
}

function EmptyDraftState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#B8D9D3] bg-[#F8FBFA] px-4 py-5 text-sm font-semibold leading-6 text-[#64748B]">
      {label}
    </div>
  );
}

function EditableHeader({ title, status, onRemove }: { title: string; status: string; onRemove: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold text-[#0F172A]">{title}</h3>
        <Badge variant="outline" className="rounded-full border-[#DDE8E5] text-[#64748B]">
          {status}
        </Badge>
        <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
          measurement ready ではない
        </Badge>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label="削除" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PromptGroupBadge({ group, label }: { group: PromptGroup; label: string }) {
  const className = {
    non_branded: "border-[#00796B]/25 bg-[#E6F4F1] text-[#005C50]",
    branded: "border-indigo-200 bg-indigo-50 text-indigo-700",
    citation_check: "border-sky-200 bg-sky-50 text-sky-700",
    excluded: "border-amber-200 bg-amber-50 text-amber-800"
  }[group];
  return (
    <Badge variant="outline" className={cn("w-fit rounded-full", className)}>
      {label}
    </Badge>
  );
}

function ReviewList({ title, items, emptyText = "下書きはありません。" }: { title: string; items: string[]; emptyText?: string }) {
  return (
    <div className="mt-6 rounded-lg border border-[#DDE8E5] bg-white p-4">
      <h3 className="text-base font-bold text-[#0F172A]">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#475569]">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-[#F8FBFA] px-3 py-2">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#64748B]">{emptyText}</p>
      )}
    </div>
  );
}

function buildSeedInput(formState: SeedFormState, audienceOverride: AudienceOverride): ProjectSetupSeedInput {
  const targetCustomers = appendAudienceHint(formState.targetCustomers, audienceOverride);
  return {
    companyName: formState.companyName,
    brandName: formState.brandName,
    officialSiteUrl: formState.officialSiteUrl,
    productOrServiceDescription: formState.productOrServiceDescription,
    industryCategory: formState.industryCategory,
    targetCustomers,
    regions: splitList(formState.regionsText),
    language: formState.language || "ja",
    serviceName: formState.serviceName || undefined,
    brandAliases: splitList(formState.brandAliasesText),
    knownCompetitors: splitList(formState.knownCompetitorsText),
    avoidCompetitors: splitList(formState.avoidCompetitorsText),
    strengths: splitList(formState.strengthsText),
    knownRisks: splitList(formState.knownRisksText),
    diagnosisGoals: formState.diagnosisGoals.length > 0 ? formState.diagnosisGoals : undefined
  };
}

function appendAudienceHint(targetCustomers: string, audienceOverride: AudienceOverride) {
  if (audienceOverride === "auto") return targetCustomers;
  const hint = audienceOverride === "b2b" ? "法人向け / BtoB" : "一般消費者向け / BtoC";
  if (targetCustomers.includes(hint)) return targetCustomers;
  return [targetCustomers, hint].filter(Boolean).join(" / ");
}

function safelyGenerateDraft(seedInput: ProjectSetupSeedInput): GenerationState {
  try {
    return { result: generateProjectSetupDraft(seedInput), error: null };
  } catch {
    return { result: null, error: "unexpected_error" };
  }
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function buildBrandIdentity(seedInput: ProjectSetupSeedInput): BrandIdentityForDraft {
  return {
    brandName: seedInput.brandName,
    serviceName: seedInput.serviceName,
    aliases: seedInput.brandAliases,
    officialSiteUrl: seedInput.officialSiteUrl,
    domain: extractHostname(seedInput.officialSiteUrl)
  };
}

function buildPriorityPromptCandidates(
  formState: SeedFormState,
  extraPriorityPromptsText: string,
  brandIdentity: BrandIdentityForDraft,
  seedInput: ProjectSetupSeedInput
): PriorityPromptCandidate[] {
  const prompts = splitList([formState.priorityPromptsText, extraPriorityPromptsText].filter(Boolean).join("\n"));
  const brandSignals = getBrandSignals(brandIdentity);
  const competitorSignals = [...(seedInput.knownCompetitors ?? []), ...(seedInput.avoidCompetitors ?? [])]
    .map(normalizeSignal)
    .filter((value) => value.length >= 2);

  return prompts.map((text, index) => {
    const normalized = normalizeSignal(text);
    const hasBrand = brandSignals.some((signal) => normalized.includes(signal));
    const hasCompetitor = competitorSignals.some((signal) => normalized.includes(signal));
    if (hasCompetitor) {
      return {
        id: `priority-${index}-${normalized}`,
        text,
        group: "excluded",
        label: "対象外 / 実名競合入り",
        reasons: ["実名競合を含むため visibility / ranking / SOV 対象外候補"]
      };
    }
    if (hasBrand) {
      return {
        id: `priority-${index}-${normalized}`,
        text,
        group: "branded",
        label: "ブランド認知",
        reasons: ["brand / alias / domain を含むため sentiment / brand perception 用"]
      };
    }
    return {
      id: `priority-${index}-${normalized}`,
      text,
      group: "non_branded",
      label: "指標候補 non-branded",
      reasons: ["ブランド名・実名競合を含まないため AI表示率 / ranking / SOV 候補"]
    };
  });
}

function getBrandSignals(brandIdentity: BrandIdentityForDraft) {
  return [
    brandIdentity.brandName,
    brandIdentity.serviceName,
    brandIdentity.officialSiteUrl,
    brandIdentity.domain,
    ...(brandIdentity.aliases ?? [])
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeSignal)
    .filter((value) => value.length >= 2);
}

function normalizeSignal(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
}

function extractHostname(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function getInputCompletionValue(draft: ProjectSetupDraftGenerationResult["draft"] | null, field: string) {
  const value = draft?.inputCompletion.find((item) => item.field === field)?.value;
  if (Array.isArray(value)) return value.join(", ");
  return typeof value === "string" ? value : "";
}

function inferAudienceFromBusinessModel(businessModel: string): AudienceOverride {
  if (businessModel.startsWith("b2b") || businessModel === "professional_service" || businessModel === "recruiting_hr") return "b2b";
  if (businessModel.startsWith("b2c") || businessModel === "local_service" || businessModel === "ecommerce") return "b2c";
  return "auto";
}

function formatAudience(value: AudienceOverride) {
  if (value === "b2b") return "BtoB";
  if (value === "b2c") return "BtoC";
  return "自動判定";
}

function getPromptGroup(prompt: PromptDraft, eligibility: PromptMetricEligibility): PromptGroup {
  if (prompt.intent === "citation_check" || prompt.category === "citation_check" || eligibility.citationCheck === "eligible") {
    return "citation_check";
  }
  if (eligibility.sentiment === "eligible" || eligibility.brandPerception === "eligible" || eligibility.brandingMode === "branded") {
    return "branded";
  }
  if (
    eligibility.visibilityRate === "eligible" ||
    eligibility.ranking === "eligible" ||
    eligibility.shareOfVoice === "eligible"
  ) {
    return "non_branded";
  }
  return "excluded";
}

function getPromptGroupLabel(group: PromptGroup) {
  if (group === "non_branded") return "指標候補 non-branded";
  if (group === "branded") return "ブランド認知 branded";
  if (group === "citation_check") return "引用確認 citation_check";
  return "対象外 / 要確認";
}

function getPromptBreakdown(
  summaries: { group: PromptGroup }[],
  priorityPrompts: PriorityPromptCandidate[]
): Record<PromptGroup, number> {
  const initial: Record<PromptGroup, number> = {
    non_branded: 0,
    branded: 0,
    citation_check: 0,
    excluded: 0
  };
  for (const item of summaries) initial[item.group] += 1;
  for (const item of priorityPrompts) initial[item.group] += 1;
  return initial;
}

function formatMetricEligibility(eligibility: PromptMetricEligibility) {
  const eligible = [
    eligibility.visibilityRate === "eligible" ? "AI表示率" : null,
    eligibility.ranking === "eligible" ? "ranking" : null,
    eligibility.shareOfVoice === "eligible" ? "SOV" : null,
    eligibility.sentiment === "eligible" ? "sentiment" : null,
    eligibility.brandPerception === "eligible" ? "brand perception" : null,
    eligibility.citationCheck === "eligible" ? "citation check" : null
  ].filter(Boolean);
  return eligible.length > 0 ? eligible.join(" / ") : "対象外 / 要確認";
}

function createManualPersona(seedInput: ProjectSetupSeedInput, index: number): PersonaDraft {
  return {
    personaId: `wizard-persona-${index + 1}`,
    displayName: "新しいペルソナ",
    segment: seedInput.targetCustomers || "対象顧客",
    businessType: seedInput.industryCategory || "未分類",
    industryCategory: seedInput.industryCategory || "未分類",
    roleType: "evaluator",
    detailedDecisionRole: "evaluator",
    roleMappingReason: "画面上で追加した下書きです。",
    buyerStage: "exploration",
    jobs: [],
    painPoints: [],
    triggerEvents: [],
    switchingForces: [],
    alternativesConsidered: [],
    comparisonAxis: [],
    proofNeeded: [],
    trustRequirement: "要確認",
    promptAngle: "このペルソナに合わせた質問角度を確認してください。",
    promptReadiness: "usable_with_caution",
    researchSufficiency: "minimum_input",
    confidenceScore: 50,
    needsVerification: true,
    riskFlags: ["wizard_added_draft"],
    sourceStatus: "inferred",
    reviewStatus: "needs_review"
  };
}

function createManualTopic(seedInput: ProjectSetupSeedInput, personas: PersonaDraft[], index: number): TopicDraft {
  const persona = personas[0] ?? null;
  return {
    topicId: `wizard-topic-${index + 1}`,
    topicName: "新しいトピック",
    topicType: "category_discovery_topic",
    diagnosisGoal: seedInput.diagnosisGoals?.[0] ?? "non_branded",
    targetPersonaId: persona?.personaId ?? null,
    buyerStage: "exploration",
    metricTarget: {
      visibilityRate: "eligible",
      ranking: "eligible",
      sentiment: "excluded",
      citationCheck: "excluded",
      riskCheck: "excluded"
    },
    brandMentionPolicy: "brand_excluded",
    expectedSignal: "候補として自然に挙がるかを確認する下書きです。",
    minimumPromptCount: 1,
    riskOrBias: null,
    handoffSkill: "recora-prompt-topic-designer",
    topicQualityDecision: "topic_needs_more_prompts",
    coverageStatus: "undercovered",
    confidenceScore: 50,
    reviewStatus: "needs_review"
  };
}

function createManualPrompt(seedInput: ProjectSetupSeedInput, topics: TopicDraft[], personas: PersonaDraft[], index: number): PromptDraft {
  const topic = topics[0] ?? null;
  const persona = personas[0] ?? null;
  return {
    promptId: `wizard-prompt-${index + 1}`,
    topicId: topic?.topicId ?? "wizard-topic-required",
    personaId: persona?.personaId ?? null,
    text: `${seedInput.industryCategory || "このカテゴリ"}を検討するとき、候補になりやすいサービスを比較してください。`,
    rawUserIntent: "wizard_added_prompt",
    languageMode: "natural_conversation",
    category: "non_branded",
    intent: "non_branded",
    intentType: "commercial_investigation",
    buyerStage: "exploration",
    brandingMode: "non_branded",
    brandMentionRule: "brand_excluded",
    competitorMentionRule: "no_competitor",
    responseShape: "candidate_list",
    candidateMentionOpportunity: "likely",
    rankingOpportunity: "comparable_set",
    expectedSignal: "候補群に含まれるかを確認します。",
    qualityScore: 60,
    gateDecision: "revise_before_measurement",
    gateReason: "画面上で追加した未承認下書きです。",
    sourceStatus: "inferred",
    seedTerms: [],
    seedContaminationRisk: "low",
    needsVerification: true,
    confidenceScore: 50,
    reviewStatus: "needs_review",
    riskFlags: ["wizard_added_draft"]
  };
}

function replaceAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => itemIndex === index ? value : item);
}

function moveById(items: PromptDraft[], promptId: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.promptId === promptId);
  if (index < 0) return items;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const currentItem = next[index];
  const targetItem = next[nextIndex];
  next[index] = targetItem;
  next[nextIndex] = currentItem;
  return next;
}

function translateBlocker(value: string) {
  const map: Record<string, string> = {
    "seedInput.companyName is required": "会社名を入力してください。",
    "seedInput.brandName is required": "ブランド名 / サービス名を入力してください。",
    "seedInput.officialSiteUrl is required": "公式URLを入力してください。",
    "seedInput.productOrServiceDescription is required": "サービス概要を入力してください。",
    "seedInput.industryCategory is required": "業種カテゴリを入力してください。",
    "seedInput.targetCustomers is required": "主な顧客層を入力してください。",
    "seedInput.regions must include at least one region": "対象地域を1件以上入力してください。",
    "seedInput.language is required": "言語を入力してください。",
    "seedInput.officialSiteUrl must be an http or https URL": "公式URLは http または https で始まるURLにしてください。"
  };
  return map[value] ?? value;
}

function translateWarning(value: string) {
  const map: Record<string, string> = {
    known_competitors_missing_use_unknown_competitor_discovery: "競合未入力のため、実名競合ではなくカテゴリ上の候補発見として扱います。",
    strengths_missing_use_general_proof_needs: "強みが未入力のため、一般的な確認軸で下書きします。",
    known_risks_missing_internal_review_required: "既知のリスクが未入力のため、内部レビューで確認が必要です。",
    business_model_inference_needs_confirmation: "business model の推定に確認が必要です。",
    industry_adapter_generic_prompt_angles_need_review: "業種別の角度が汎用寄りです。下書きの確認が必要です。",
    target_customers_broad_personas_need_confirmation: "主な顧客層が広いため、ペルソナ確認が必要です。",
    service_description_thin_prompt_angles_need_review: "サービス概要が短いため、prompt角度の確認が必要です。"
  };
  return map[value] ?? value;
}

function buildConfirmationText(input: {
  seedInput: ProjectSetupSeedInput;
  businessModel: string;
  audience: AudienceOverride;
  personas: PersonaDraft[];
  topics: TopicDraft[];
  prompts: PromptDraft[];
  priorityPrompts: PriorityPromptCandidate[];
  diagnosisGoalMemo: string;
  blockers: string[];
  warnings: string[];
}) {
  return [
    "Recora 無料診断 初期設定下書き",
    "",
    `会社名: ${input.seedInput.companyName}`,
    `ブランド名: ${input.seedInput.brandName}`,
    `公式URL: ${input.seedInput.officialSiteUrl}`,
    `カテゴリ: ${input.seedInput.industryCategory}`,
    `BtoB/BtoC: ${formatAudience(input.audience)}`,
    `business model: ${input.businessModel || "未判定"}`,
    `診断したい目的（確認用メモ）: ${input.diagnosisGoalMemo.trim() || "なし"}`,
    "確認用メモは ProjectSetupSeedInput には含めず、generator の下書き生成条件には使っていません。",
    "",
    `ペルソナ下書き: ${input.personas.length}件`,
    ...input.personas.map((persona) => `- ${persona.displayName} / ${persona.roleType}`),
    "",
    `トピック下書き: ${input.topics.length}件`,
    ...input.topics.map((topic) => `- ${topic.topicName} / ${topic.topicType}`),
    "",
    `プロンプト下書き: ${input.prompts.length}件`,
    `優先採用候補: ${input.priorityPrompts.length}件`,
    ...input.priorityPrompts.map((prompt) => `- ${prompt.text} / ${prompt.label}`),
    "",
    "この下書きは未承認です。",
    "保存・承認・計測反映はまだ行いません。",
    "non-branded prompt はAI表示率 / ranking / SOV の候補です。",
    "branded prompt は sentiment / brand perception 用です。",
    "citation_check は引用確認用です。",
    "実名競合を含むpromptは visibility / ranking / SOV 対象外です。",
    "",
    `blocker: ${input.blockers.length ? input.blockers.join(", ") : "なし"}`,
    `warning: ${input.warnings.length ? input.warnings.join(", ") : "なし"}`
  ].join("\n");
}
