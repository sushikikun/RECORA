"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Info,
  ListPlus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X
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
  { title: "ブランド確認", short: "ブランド" },
  { title: "サービス理解・市場・顧客層", short: "市場" },
  { title: "競合・除外", short: "競合" },
  { title: "見たいこと・避けたいこと", short: "観点" },
  { title: "Recoraの測定設計", short: "設計" }
] as const;

type AudienceType = "b2b" | "b2c" | "both_or_confirm";
type CompetitorMode = "known_competitors_confirmed" | "competitor_discovery_needed";
type ReportGoal = "visibility" | "competitor" | "citation" | "brand" | "improvement" | "other";
type QuestionGroup = "candidate" | "brand" | "citation" | "review";
type CopyState = "idle" | "copied" | "failed";
type ConfirmationStatus = "idle" | "done";

type MeasurementWizardState = {
  brandName: string;
  brandAliases: string[];
  brandAliasInput: string;
  officialUrl: string;
  serviceDescription: string;
  serviceCategory: string;
  audienceType: AudienceType;
  audienceTargets: string[];
  audienceTargetInput: string;
  regions: string[];
  regionInput: string;
  language: "ja" | "en";
  competitorMode: CompetitorMode;
  competitors: string[];
  competitorInput: string;
  exclusions: string[];
  exclusionInput: string;
  commonExclusions: string[];
  watchTopics: string[];
  watchTopicInput: string;
  avoidTopics: string[];
  avoidTopicInput: string;
  reportGoals: ReportGoal[];
  reportGoalInput: string;
  requiredQuestions: string[];
  requiredQuestionInput: string;
  excludedQuestions: string[];
  excludedQuestionInput: string;
};

type EditableCard = {
  id: string;
  label: string;
  description: string;
};

type EditableQuestion = {
  id: string;
  text: string;
  group: QuestionGroup;
};

type MeasurementDesign = {
  seedKey: string;
  result: ProjectSetupDraftGenerationResult;
  viewers: EditableCard[];
  questionAreas: EditableCard[];
  questionExamples: EditableQuestion[];
  notices: string[];
};

type CustomerChecklistItem = {
  label: string;
  status: "確認済み" | "確認したい" | "未入力";
  detail: string;
};

type UpdateForm = <K extends keyof MeasurementWizardState>(
  field: K,
  value: MeasurementWizardState[K]
) => void;

const initialFormState: MeasurementWizardState = {
  brandName: "",
  brandAliases: [],
  brandAliasInput: "",
  officialUrl: "",
  serviceDescription: "",
  serviceCategory: "",
  audienceType: "b2b",
  audienceTargets: [],
  audienceTargetInput: "",
  regions: ["日本"],
  regionInput: "",
  language: "ja",
  competitorMode: "competitor_discovery_needed",
  competitors: [],
  competitorInput: "",
  exclusions: [],
  exclusionInput: "",
  commonExclusions: [],
  watchTopics: [],
  watchTopicInput: "",
  avoidTopics: [],
  avoidTopicInput: "",
  reportGoals: ["visibility"],
  reportGoalInput: "",
  requiredQuestions: [],
  requiredQuestionInput: "",
  excludedQuestions: [],
  excludedQuestionInput: ""
};

const audienceOptions = [
  {
    value: "b2b",
    label: "BtoB",
    description: "企業や組織の導入判断を中心に見ます。"
  },
  {
    value: "b2c",
    label: "BtoC",
    description: "個人の比較検討や購入判断を中心に見ます。"
  },
  {
    value: "both_or_confirm",
    label: "両方 / 確認したい",
    description: "どちらに寄せるかも測定設計で確認します。"
  }
] as const;

const languageOptions = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "英語" }
] as const;

const audienceSuggestionsByType: Record<AudienceType, string[]> = {
  b2b: ["導入担当者", "比較評価担当者", "決裁者", "現場利用者", "技術・運用確認者"],
  b2c: ["初めて検討する人", "口コミを重視する人", "価格を比較する人", "家族や同僚に相談する人"],
  both_or_confirm: ["導入担当者", "個人の比較検討者", "利用者", "紹介・推薦する人"]
};

const regionSuggestions = ["日本", "首都圏", "関西", "全国", "英語圏", "北米", "アジア"];

const commonExclusionOptions = [
  "採用・求人",
  "IR・株価",
  "広告媒体",
  "ニュース記事",
  "個人ブログ",
  "SNS投稿",
  "古いサービス名"
];

const watchTopicOptions = [
  "AI検索で候補に入るか",
  "競合と比較された時の見え方",
  "自社サイトや第三者情報が引用されるか",
  "ブランド名で聞かれた時の説明",
  "導入前の不安への答え方"
];

const avoidTopicOptions = [
  "実名競合を前提にした比較",
  "専門判断を伴う断定",
  "価格だけで優劣を決める質問",
  "根拠のない評判確認",
  "今回対象外の事業や商品"
];

const reportGoalOptions = [
  { value: "visibility", label: "AI検索で選択肢に入るか知りたい" },
  { value: "competitor", label: "比較された時の強み・弱みを見たい" },
  { value: "citation", label: "引用される情報の不足を見たい" },
  { value: "brand", label: "ブランド名で聞かれた時の説明を見たい" },
  { value: "improvement", label: "改善すべきページや情報を知りたい" },
  { value: "other", label: "その他" }
] as const;

const seedImpactFields = new Set<keyof MeasurementWizardState>([
  "brandName",
  "brandAliases",
  "officialUrl",
  "serviceDescription",
  "serviceCategory",
  "audienceType",
  "audienceTargets",
  "regions",
  "language",
  "competitorMode",
  "competitors",
  "exclusions",
  "commonExclusions",
  "watchTopics",
  "avoidTopics",
  "reportGoals",
  "reportGoalInput"
]);

export function ProjectSetupWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<MeasurementWizardState>(initialFormState);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [design, setDesign] = useState<MeasurementDesign | null>(null);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [confirmationStatus, setConfirmationStatus] = useState<ConfirmationStatus>("idle");

  const seedInput = useMemo(() => buildSeedInput(formState), [formState]);
  const seedKey = useMemo(() => stableSeedKey(seedInput), [seedInput]);
  const seedBlockers = useMemo(() => validateProjectSetupSeedInput(seedInput), [seedInput]);
  const currentStepBlockers = getStepBlockers(stepIndex, formState);
  const showCurrentBlockers = attemptedSteps[stepIndex] && currentStepBlockers.length > 0;
  const checklist = useMemo(() => buildCustomerChecklist(formState), [formState]);

  const updateForm: UpdateForm = (field, value) => {
    setCopyState("idle");
    setConfirmationStatus("idle");
    setFormState((current) => ({ ...current, [field]: value }));
    if (seedImpactFields.has(field) && stepIndex < steps.length - 1) {
      setDesign(null);
    }
  };

  function goNext() {
    setCopyState("idle");
    setConfirmationStatus("idle");
    const blockers = getStepBlockers(stepIndex, formState);
    setAttemptedSteps((current) => ({ ...current, [stepIndex]: true }));
    if (blockers.length > 0) return;

    if (stepIndex === 0) {
      setFormState((current) => applyServiceSuggestions(current));
      setStepIndex(1);
      return;
    }

    if (stepIndex === 3) {
      const nextDesign = buildMeasurementDesign(seedInput, formState, seedKey);
      setDesign(nextDesign);
      setShowAllQuestions(false);
      setStepIndex(4);
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setCopyState("idle");
    setConfirmationStatus("idle");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function regenerateDesign() {
    setCopyState("idle");
    setConfirmationStatus("idle");
    setDesign(buildMeasurementDesign(seedInput, formState, seedKey));
    setShowAllQuestions(false);
  }

  function updateDesign(updater: (current: MeasurementDesign) => MeasurementDesign) {
    setCopyState("idle");
    setConfirmationStatus("idle");
    setDesign((current) => (current ? updater(current) : current));
  }

  async function copyConfirmationText() {
    if (!design) return;
    setCopyState("idle");
    try {
      await navigator.clipboard.writeText(
        buildConfirmationText({
          formState,
          design,
          checklist
        })
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#F6FAF9] text-slate-950">
      <section className="border-b border-[#DDE8E5] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#00796B]">無料診断後のAPI前確認</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-normal text-[#0F172A] sm:text-4xl">
              Recoraが測定設計に入る前の確認
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#64748B]">
              顧客が細かな設計作業をするのではなく、Recoraが測定に使う前提を確認するための画面です。
              入力内容はこの画面内で扱い、保存・承認・計測反映はここでは行いません。
            </p>
          </div>
          <div className="rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] px-4 py-3 text-sm leading-6 text-[#475569]">
            <strong className="block text-[#0F172A]">この画面で行うこと</strong>
            ブランド、顧客層、競合、見たい観点を確認し、Recoraの測定設計案を確認します。
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StepRail stepIndex={stepIndex} />
        </aside>

        <section className="min-w-0">
          {stepIndex === 0 ? <BrandStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 1 ? <ServiceMarketStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 2 ? <CompetitorStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 3 ? <AnglesStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 4 ? (
            <MeasurementDesignStep
              formState={formState}
              updateForm={updateForm}
              design={design}
              checklist={checklist}
              seedBlockers={seedBlockers}
              showAllQuestions={showAllQuestions}
              copyState={copyState}
              confirmationStatus={confirmationStatus}
              onCopy={copyConfirmationText}
              onRegenerate={regenerateDesign}
              onShowAllQuestionsChange={setShowAllQuestions}
              onConfirm={() => setConfirmationStatus("done")}
              onUpdateDesign={updateDesign}
            />
          ) : null}

          {showCurrentBlockers ? (
            <MessageBox tone="error" title="次に進む前に確認してください">
              <ul className="space-y-1">
                {currentStepBlockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </MessageBox>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-[#DDE8E5] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button type="button" onClick={goNext}>
                {stepIndex === 3 ? "測定設計を確認する" : "次へ進む"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={regenerateDesign}>
                <RefreshCw className="h-4 w-4" />
                入力内容から設計を再確認
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <WizardPanel
      eyebrow="Step 1"
      title="ブランド確認"
      description="測定対象として扱うブランド名、表記ゆれ、公式URLだけを確認します。サイト取得やクロールは行いません。"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <TextInput
          label="正式なブランド名 / サービス名"
          value={formState.brandName}
          onChange={(value) => updateForm("brandName", value)}
          required
          placeholder="例: Recora"
        />
        <TextInput
          label="公式URL"
          value={formState.officialUrl}
          onChange={(value) => updateForm("officialUrl", value)}
          required
          placeholder="https://example.com"
        />
      </div>
      <div className="mt-5">
        <ChipInput
          label="表記ゆれ・別名"
          description="大文字小文字、略称、サービス名の別表記があれば追加してください。"
          items={formState.brandAliases}
          inputValue={formState.brandAliasInput}
          onInputChange={(value) => updateForm("brandAliasInput", value)}
          onAdd={(value) => updateForm("brandAliases", addUnique(formState.brandAliases, value))}
          onRemove={(value) => updateForm("brandAliases", removeValue(formState.brandAliases, value))}
          placeholder="例: RECORA"
        />
      </div>
    </WizardPanel>
  );
}

function ServiceMarketStep({
  formState,
  updateForm
}: {
  formState: MeasurementWizardState;
  updateForm: UpdateForm;
}) {
  const audienceSuggestions = audienceSuggestionsByType[formState.audienceType];

  return (
    <WizardPanel
      eyebrow="Step 2"
      title="サービス理解・市場・顧客層"
      description="Recoraが測定前提を読み違えないよう、サービス説明、対象市場、主な顧客層を確認します。"
    >
      <TextareaInput
        label="どんなサービスですか？"
        value={formState.serviceDescription}
        onChange={(value) => updateForm("serviceDescription", value)}
        required
        rows={4}
        placeholder="例: AI検索で自社サービスがどのように候補に出るかを診断するBtoB向けサービス"
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TextInput
          label="サービスカテゴリ"
          value={formState.serviceCategory}
          onChange={(value) => updateForm("serviceCategory", value)}
          required
          placeholder="例: AI検索・GEO診断サービス"
        />
        <SegmentedControl
          label="測定する言語"
          value={formState.language}
          options={languageOptions}
          onChange={(value) => updateForm("language", value)}
        />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {audienceOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "rounded-lg border bg-white p-4 text-left transition hover:border-[#00796B]/60",
              formState.audienceType === option.value
                ? "border-[#00796B] ring-2 ring-[#00796B]/15"
                : "border-[#DDE8E5]"
            )}
            onClick={() => updateForm("audienceType", option.value)}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-[#0F172A]">{option.label}</span>
              {formState.audienceType === option.value ? <CheckCircle2 className="h-4 w-4 text-[#00796B]" /> : null}
            </span>
            <span className="mt-2 block text-sm leading-6 text-[#64748B]">{option.description}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ChipInput
          label="主に見る顧客層"
          description="複数選べます。必要なら自由入力で追加してください。"
          items={formState.audienceTargets}
          inputValue={formState.audienceTargetInput}
          onInputChange={(value) => updateForm("audienceTargetInput", value)}
          onAdd={(value) => updateForm("audienceTargets", addUnique(formState.audienceTargets, value))}
          onRemove={(value) => updateForm("audienceTargets", removeValue(formState.audienceTargets, value))}
          placeholder="例: 比較評価担当者"
          suggestions={audienceSuggestions}
        />
        <ChipInput
          label="対象市場・地域"
          description="測定時に想定する地域や市場を確認します。"
          items={formState.regions}
          inputValue={formState.regionInput}
          onInputChange={(value) => updateForm("regionInput", value)}
          onAdd={(value) => updateForm("regions", addUnique(formState.regions, value))}
          onRemove={(value) => updateForm("regions", removeValue(formState.regions, value))}
          placeholder="例: 日本"
          suggestions={regionSuggestions}
        />
      </div>
    </WizardPanel>
  );
}

function CompetitorStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <WizardPanel
      eyebrow="Step 3"
      title="競合・除外"
      description="比較したい競合がある場合は指定できます。未定の場合は、Recoraが候補抽出する前提として扱います。"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChoiceCard
          selected={formState.competitorMode === "competitor_discovery_needed"}
          title="競合はまだ分からないのでRecoraで候補抽出する"
          description="実名競合を前提にせず、カテゴリ内で候補になりそうな会社やサービスを確認する流れにします。"
          onClick={() => updateForm("competitorMode", "competitor_discovery_needed")}
        />
        <ChoiceCard
          selected={formState.competitorMode === "known_competitors_confirmed"}
          title="比較したい競合を入力する"
          description="既に比較対象がある場合は、下の入力欄から追加してください。"
          onClick={() => updateForm("competitorMode", "known_competitors_confirmed")}
        />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ChipInput
          label="比較したい競合"
          description={
            formState.competitorMode === "competitor_discovery_needed"
              ? "未定のまま進められます。入力した場合は比較対象として扱います。"
              : "会社名、サービス名、ブランド名を1件ずつ追加してください。"
          }
          items={formState.competitors}
          inputValue={formState.competitorInput}
          onInputChange={(value) => updateForm("competitorInput", value)}
          onAdd={(value) => {
            updateForm("competitors", addUnique(formState.competitors, value));
            updateForm("competitorMode", "known_competitors_confirmed");
          }}
          onRemove={(value) => updateForm("competitors", removeValue(formState.competitors, value))}
          placeholder="例: Similar Service"
        />
        <ChipInput
          label="除外したい会社・媒体・カテゴリ"
          description="測定対象から外したい名称やカテゴリを追加してください。"
          items={formState.exclusions}
          inputValue={formState.exclusionInput}
          onInputChange={(value) => updateForm("exclusionInput", value)}
          onAdd={(value) => updateForm("exclusions", addUnique(formState.exclusions, value))}
          onRemove={(value) => updateForm("exclusions", removeValue(formState.exclusions, value))}
          placeholder="例: 採用媒体"
        />
      </div>
      <div className="mt-6 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#00796B]" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0F172A]">よく除外されるもの</h3>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              今回の診断対象に含めたくないものがあれば選んでください。
            </p>
            <CheckboxChipGroup
              className="mt-3"
              values={formState.commonExclusions}
              options={commonExclusionOptions}
              onChange={(values) => updateForm("commonExclusions", values)}
            />
          </div>
        </div>
      </div>
    </WizardPanel>
  );
}

function AnglesStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <WizardPanel
      eyebrow="Step 4"
      title="見たいこと・避けたいこと"
      description="Recoraが質問領域を組む時に重視する観点と、扱わない方がよい話題を確認します。"
    >
      <div className="grid gap-5">
        <ChipInput
          label="特に見たいこと"
          description="AI検索上で確認したい観点を選ぶか、自由入力で追加してください。"
          items={formState.watchTopics}
          inputValue={formState.watchTopicInput}
          onInputChange={(value) => updateForm("watchTopicInput", value)}
          onAdd={(value) => updateForm("watchTopics", addUnique(formState.watchTopics, value))}
          onRemove={(value) => updateForm("watchTopics", removeValue(formState.watchTopics, value))}
          placeholder="例: 比較された時の説明"
          suggestions={watchTopicOptions}
        />
        <ChipInput
          label="測ってほしくない話題"
          description="今回の測定から外したい話題や質問の方向性を追加してください。"
          items={formState.avoidTopics}
          inputValue={formState.avoidTopicInput}
          onInputChange={(value) => updateForm("avoidTopicInput", value)}
          onAdd={(value) => updateForm("avoidTopics", addUnique(formState.avoidTopics, value))}
          onRemove={(value) => updateForm("avoidTopics", removeValue(formState.avoidTopics, value))}
          placeholder="例: 価格だけで優劣を決める質問"
          suggestions={avoidTopicOptions}
        />
        <div className="rounded-lg border border-[#DDE8E5] bg-white p-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">今回知りたいこと</h3>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              最終確認の観点として残します。複数選べます。
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {reportGoalOptions.map((option) => {
              const selected = formState.reportGoals.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
                    selected
                      ? "border-[#00796B] bg-[#E6F4F1] text-[#005C50]"
                      : "border-[#DDE8E5] bg-white text-[#475569] hover:border-[#00796B]/60"
                  )}
                  onClick={() => updateForm("reportGoals", toggleValue(formState.reportGoals, option.value))}
                >
                  {selected ? <Check className="h-4 w-4" /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>
          {formState.reportGoals.includes("other") ? (
            <div className="mt-4">
              <TextInput
                label="その他の内容"
                value={formState.reportGoalInput}
                onChange={(value) => updateForm("reportGoalInput", value)}
                placeholder="例: 新規事業として見た時の説明のされ方"
              />
            </div>
          ) : null}
        </div>
      </div>
    </WizardPanel>
  );
}

function MeasurementDesignStep({
  formState,
  updateForm,
  design,
  checklist,
  seedBlockers,
  showAllQuestions,
  copyState,
  confirmationStatus,
  onCopy,
  onRegenerate,
  onShowAllQuestionsChange,
  onConfirm,
  onUpdateDesign
}: {
  formState: MeasurementWizardState;
  updateForm: UpdateForm;
  design: MeasurementDesign | null;
  checklist: CustomerChecklistItem[];
  seedBlockers: string[];
  showAllQuestions: boolean;
  copyState: CopyState;
  confirmationStatus: ConfirmationStatus;
  onCopy: () => void;
  onRegenerate: () => void;
  onShowAllQuestionsChange: (value: boolean) => void;
  onConfirm: () => void;
  onUpdateDesign: (updater: (current: MeasurementDesign) => MeasurementDesign) => void;
}) {
  if (!design) {
    return (
      <WizardPanel
        eyebrow="Step 5"
        title="Recoraの測定設計"
        description="入力内容からRecoraの測定設計を確認します。"
      >
        <MessageBox tone="info" title="測定設計を確認します">
          <p>前のステップの内容をもとに、Recoraの測定設計案を画面内で作成します。</p>
        </MessageBox>
        <Button type="button" className="mt-5" onClick={onRegenerate}>
          <Eye className="h-4 w-4" />
          測定設計を表示
        </Button>
      </WizardPanel>
    );
  }

  const visibleQuestions = showAllQuestions ? design.questionExamples : design.questionExamples.slice(0, 4);
  const hasMoreQuestions = design.questionExamples.length > visibleQuestions.length;

  return (
    <WizardPanel
      eyebrow="Step 5"
      title="Recoraの測定設計"
      description="顧客が細かな設計を作る画面ではなく、Recoraが測定前に確認する内容を編集できる形で表示します。"
    >
      <MessageBox tone="info" title="ここでは内容確認だけを行います">
        <p>保存・承認・計測反映はここでは行いません。Recora側で確認してから次の準備に進む前提です。</p>
      </MessageBox>

      {seedBlockers.length > 0 ? (
        <MessageBox tone="error" title="確認が必要な入力があります">
          <ul className="space-y-1">
            {seedBlockers.map((blocker) => (
              <li key={blocker}>{translateSeedBlocker(blocker)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}

      <div className="mt-6 space-y-6">
        <MeasurementTargetSection formState={formState} updateForm={updateForm} />

        <EditableCardList
          title="見る相手"
          description="AI検索で誰の視点として質問するかを確認します。必要に応じて追加・修正できます。"
          items={design.viewers}
          addLabel="相手を追加"
          labelPlaceholder="例: 導入担当者"
          descriptionPlaceholder="例: 導入前に候補比較と根拠を確認する人"
          onItemsChange={(items) => onUpdateDesign((current) => ({ ...current, viewers: items }))}
        />

        <EditableCardList
          title="質問領域"
          description="Recoraが見る質問の方向性です。細かな質問文を作り込む必要はありません。"
          items={design.questionAreas}
          addLabel="質問領域を追加"
          labelPlaceholder="例: 候補比較"
          descriptionPlaceholder="例: どの選択肢が候補になるか、比較軸が自然に出るかを見ます"
          onItemsChange={(items) => onUpdateDesign((current) => ({ ...current, questionAreas: items }))}
        />

        <section className="rounded-lg border border-[#DDE8E5] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">質問例を確認する</h3>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                測定時に使う質問の方向性を確認するための例です。追加・修正・削除できます。
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onShowAllQuestionsChange(!showAllQuestions)}>
              {showAllQuestions ? "もう一度畳む" : "質問例をもっと見る"}
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {visibleQuestions.map((question) => (
              <EditableQuestionRow
                key={question.id}
                question={question}
                onChange={(nextQuestion) =>
                  onUpdateDesign((current) => ({
                    ...current,
                    questionExamples: current.questionExamples.map((item) =>
                      item.id === question.id ? nextQuestion : item
                    )
                  }))
                }
                onRemove={() =>
                  onUpdateDesign((current) => ({
                    ...current,
                    questionExamples: current.questionExamples.filter((item) => item.id !== question.id)
                  }))
                }
              />
            ))}
            {hasMoreQuestions ? (
              <p className="text-xs font-semibold text-[#64748B]">
                さらに {design.questionExamples.length - visibleQuestions.length} 件の質問例があります。
              </p>
            ) : null}
          </div>

          <AddQuestionForm
            onAdd={(text) =>
              onUpdateDesign((current) => ({
                ...current,
                questionExamples: [
                  ...current.questionExamples,
                  {
                    id: `question-custom-${Date.now()}`,
                    text,
                    group: classifyQuestionText(text, formState)
                  }
                ]
              }))
            }
          />

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ChipInput
              label="必ず入れたい質問がある場合"
              items={formState.requiredQuestions}
              inputValue={formState.requiredQuestionInput}
              onInputChange={(value) => updateForm("requiredQuestionInput", value)}
              onAdd={(value) => updateForm("requiredQuestions", addUnique(formState.requiredQuestions, value))}
              onRemove={(value) => updateForm("requiredQuestions", removeValue(formState.requiredQuestions, value))}
              placeholder="例: 導入前に確認すべき不安を整理してほしい"
            />
            <ChipInput
              label="測ってほしくない質問がある場合"
              items={formState.excludedQuestions}
              inputValue={formState.excludedQuestionInput}
              onInputChange={(value) => updateForm("excludedQuestionInput", value)}
              onAdd={(value) => updateForm("excludedQuestions", addUnique(formState.excludedQuestions, value))}
              onRemove={(value) => updateForm("excludedQuestions", removeValue(formState.excludedQuestions, value))}
              placeholder="例: 個別企業名を断定比較する質問"
            />
          </div>
        </section>

        <section className="rounded-lg border border-[#DDE8E5] bg-white p-4">
          <h3 className="text-base font-bold text-[#0F172A]">注意点</h3>
          <div className="mt-3 grid gap-3">
            {design.notices.map((notice) => (
              <div key={notice} className="flex gap-2 rounded-md bg-[#F8FBFA] px-3 py-2 text-sm leading-6 text-[#475569]">
                <Info className="mt-1 h-4 w-4 shrink-0 text-[#00796B]" />
                <span>{notice}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#00796B]/25 bg-[#F8FBFA] p-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#00796B]" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-[#0F172A]">最終確認</h3>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                下の内容でRecora側の測定設計確認に回してよいかを確認します。
              </p>
              <CustomerChecklist items={checklist} />
              <ConfirmationSummary formState={formState} design={design} />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="button" onClick={onConfirm}>
                  <CheckCircle2 className="h-4 w-4" />
                  この内容で確認を完了
                </Button>
                <Button type="button" variant="outline" onClick={onCopy}>
                  <ClipboardCheck className="h-4 w-4" />
                  確認内容をコピー
                </Button>
                {confirmationStatus === "done" ? (
                  <span className="text-sm font-semibold text-[#00796B]">
                    画面上で確認完了としてマークしました。
                  </span>
                ) : null}
                {copyState === "copied" ? <span className="text-sm font-semibold text-[#00796B]">コピーしました。</span> : null}
                {copyState === "failed" ? <span className="text-sm font-semibold text-rose-700">コピーできませんでした。</span> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </WizardPanel>
  );
}

function MeasurementTargetSection({
  formState,
  updateForm
}: {
  formState: MeasurementWizardState;
  updateForm: UpdateForm;
}) {
  return (
    <section className="rounded-lg border border-[#DDE8E5] bg-white p-4">
      <h3 className="text-base font-bold text-[#0F172A]">測定対象</h3>
      <p className="mt-1 text-sm leading-6 text-[#64748B]">
        測定対象として扱うブランド、カテゴリ、地域と言語を確認します。
      </p>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <TextInput
          label="正式なブランド名 / サービス名"
          value={formState.brandName}
          onChange={(value) => updateForm("brandName", value)}
          required
        />
        <TextInput
          label="公式URL"
          value={formState.officialUrl}
          onChange={(value) => updateForm("officialUrl", value)}
          required
        />
        <TextInput
          label="サービスカテゴリ"
          value={formState.serviceCategory}
          onChange={(value) => updateForm("serviceCategory", value)}
          required
        />
        <SegmentedControl
          label="測定する言語"
          value={formState.language}
          options={languageOptions}
          onChange={(value) => updateForm("language", value)}
        />
      </div>
      <div className="mt-5">
        <TextareaInput
          label="どんなサービスですか？"
          value={formState.serviceDescription}
          onChange={(value) => updateForm("serviceDescription", value)}
          rows={3}
          required
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChipInput
          label="表記ゆれ・別名"
          items={formState.brandAliases}
          inputValue={formState.brandAliasInput}
          onInputChange={(value) => updateForm("brandAliasInput", value)}
          onAdd={(value) => updateForm("brandAliases", addUnique(formState.brandAliases, value))}
          onRemove={(value) => updateForm("brandAliases", removeValue(formState.brandAliases, value))}
          placeholder="例: RECORA"
        />
        <ChipInput
          label="対象市場・地域"
          items={formState.regions}
          inputValue={formState.regionInput}
          onInputChange={(value) => updateForm("regionInput", value)}
          onAdd={(value) => updateForm("regions", addUnique(formState.regions, value))}
          onRemove={(value) => updateForm("regions", removeValue(formState.regions, value))}
          placeholder="例: 日本"
          suggestions={regionSuggestions}
        />
      </div>
    </section>
  );
}

function StepRail({ stepIndex }: { stepIndex: number }) {
  return (
    <nav className="rounded-lg border border-[#DDE8E5] bg-white p-4" aria-label="初期設定ステップ">
      <ol className="space-y-2">
        {steps.map((step, index) => {
          const isCurrent = index === stepIndex;
          const isDone = index < stepIndex;
          return (
            <li key={step.title}>
              <div
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-md px-3 py-3 text-sm transition",
                  isCurrent ? "bg-[#E6F4F1] text-[#005C50]" : "text-[#64748B]",
                  isDone ? "text-[#00796B]" : null
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                    isCurrent
                      ? "border-[#00796B] bg-white text-[#00796B]"
                      : isDone
                        ? "border-[#00796B] bg-[#00796B] text-white"
                        : "border-[#DDE8E5] bg-white text-[#64748B]"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{step.short}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-current opacity-80">{step.title}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function WizardPanel({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-normal text-[#00796B]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight tracking-normal text-[#0F172A]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#64748B]">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold text-[#334155]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[#DDE8E5] bg-white px-3 text-sm text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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
  rows = 4
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold text-[#334155]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      <textarea
        className="mt-2 w-full resize-y rounded-md border border-[#DDE8E5] bg-white px-3 py-3 text-sm leading-6 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-[#334155]">{label}</p>
      <div className="mt-2 grid grid-cols-2 rounded-md border border-[#DDE8E5] bg-[#F8FBFA] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "min-h-9 rounded px-3 text-sm font-bold transition",
              value === option.value ? "bg-white text-[#00796B] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  description,
  onClick
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border bg-white p-4 text-left transition hover:border-[#00796B]/60",
        selected ? "border-[#00796B] ring-2 ring-[#00796B]/15" : "border-[#DDE8E5]"
      )}
      onClick={onClick}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#0F172A]">{title}</span>
        {selected ? <CheckCircle2 className="h-4 w-4 text-[#00796B]" /> : null}
      </span>
      <span className="mt-2 block text-sm leading-6 text-[#64748B]">{description}</span>
    </button>
  );
}

function ChipInput({
  label,
  description,
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  suggestions = []
}: {
  label: string;
  description?: string;
  items: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  suggestions?: readonly string[];
}) {
  function submitValue(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    onAdd(normalized);
    onInputChange("");
  }

  return (
    <div className="min-w-0 rounded-lg border border-[#DDE8E5] bg-white p-4">
      <h3 className="text-sm font-bold text-[#0F172A]">{label}</h3>
      {description ? <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border border-[#DDE8E5] bg-[#F8FBFA] px-3 py-1 text-sm font-semibold text-[#334155]"
            >
              <span className="min-w-0 break-words">{item}</span>
              <button
                type="button"
                className="rounded p-0.5 text-[#64748B] hover:bg-white hover:text-rose-600"
                onClick={() => onRemove(item)}
                aria-label={`${item}を削除`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-sm text-[#94A3B8]">必要に応じて追加できます。</span>
        )}
      </div>
      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => {
            const selected = items.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold transition",
                  selected
                    ? "border-[#00796B] bg-[#E6F4F1] text-[#005C50]"
                    : "border-[#DDE8E5] bg-white text-[#475569] hover:border-[#00796B]/60"
                )}
                onClick={() => (selected ? onRemove(suggestion) : submitValue(suggestion))}
              >
                {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {suggestion}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-[#DDE8E5] bg-white px-3 text-sm text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/15"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitValue(inputValue);
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={() => submitValue(inputValue)}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>
    </div>
  );
}

function CheckboxChipGroup({
  values,
  options,
  onChange,
  className
}: {
  values: string[];
  options: readonly string[];
  onChange: (values: string[]) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold transition",
              selected
                ? "border-[#00796B] bg-[#E6F4F1] text-[#005C50]"
                : "border-[#DDE8E5] bg-white text-[#475569] hover:border-[#00796B]/60"
            )}
            onClick={() => onChange(toggleValue(values, option))}
          >
            {selected ? <Check className="h-3.5 w-3.5" /> : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}

function EditableCardList({
  title,
  description,
  items,
  addLabel,
  labelPlaceholder,
  descriptionPlaceholder,
  onItemsChange
}: {
  title: string;
  description: string;
  items: EditableCard[];
  addLabel: string;
  labelPlaceholder: string;
  descriptionPlaceholder: string;
  onItemsChange: (items: EditableCard[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");

  function addItem() {
    const label = newLabel.trim();
    const itemDescription = newDescription.trim();
    if (!label) return;
    onItemsChange([
      ...items,
      {
        id: `editable-${Date.now()}`,
        label,
        description: itemDescription || "確認したい観点として追加します。"
      }
    ]);
    setNewLabel("");
    setNewDescription("");
  }

  return (
    <section className="rounded-lg border border-[#DDE8E5] bg-white p-4">
      <h3 className="text-base font-bold text-[#0F172A]">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-[#DDE8E5] bg-[#F8FBFA] p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] lg:items-start">
              <TextInput
                label="名称"
                value={item.label}
                onChange={(value) =>
                  onItemsChange(items.map((current) => (current.id === item.id ? { ...current, label: value } : current)))
                }
              />
              <TextareaInput
                label="説明"
                value={item.description}
                rows={2}
                onChange={(value) =>
                  onItemsChange(
                    items.map((current) => (current.id === item.id ? { ...current, description: value } : current))
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="lg:mt-7"
                onClick={() => onItemsChange(items.filter((current) => current.id !== item.id))}
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-dashed border-[#B8CCC7] bg-white p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] lg:items-start">
          <TextInput label={addLabel} value={newLabel} onChange={setNewLabel} placeholder={labelPlaceholder} />
          <TextareaInput
            label="追加する説明"
            value={newDescription}
            onChange={setNewDescription}
            rows={2}
            placeholder={descriptionPlaceholder}
          />
          <Button type="button" variant="outline" className="lg:mt-7" onClick={addItem}>
            <ListPlus className="h-4 w-4" />
            追加
          </Button>
        </div>
      </div>
    </section>
  );
}

function EditableQuestionRow({
  question,
  onChange,
  onRemove
}: {
  question: EditableQuestion;
  onChange: (question: EditableQuestion) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-[#DDE8E5] bg-[#F8FBFA] p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#B8CCC7] bg-white text-[#475569]">
              {formatQuestionGroup(question.group)}
            </Badge>
          </div>
          <TextareaInput
            label="質問例"
            value={question.text}
            rows={2}
            onChange={(value) => onChange({ ...question, text: value })}
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="lg:mt-8" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
          削除
        </Button>
      </div>
    </div>
  );
}

function AddQuestionForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    setValue("");
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-[#B8CCC7] bg-white p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <TextareaInput
          label="質問例を追加"
          value={value}
          onChange={setValue}
          rows={2}
          placeholder="例: 導入前に確認すべき不安や注意点を整理してください。"
        />
        <Button type="button" variant="outline" className="lg:mt-7" onClick={submit}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>
    </div>
  );
}

function CustomerChecklist({ items }: { items: CustomerChecklistItem[] }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-[#DDE8E5] bg-white px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#64748B]">{item.label}</span>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 break-words text-sm leading-6 text-[#0F172A]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ConfirmationSummary({ formState, design }: { formState: MeasurementWizardState; design: MeasurementDesign }) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <SummaryGroup
        title="測定対象"
        values={[
          formState.brandName || "未入力",
          formState.serviceCategory || "未入力",
          formatLanguage(formState.language),
          formatList(formState.regions)
        ]}
      />
      <SummaryGroup
        title="競合・除外"
        values={[
          formState.competitorMode === "competitor_discovery_needed"
            ? "競合候補をRecoraで抽出"
            : formatList(formState.competitors),
          formState.exclusions.length || formState.commonExclusions.length
            ? formatList([...formState.exclusions, ...formState.commonExclusions])
            : "除外指定なし"
        ]}
      />
      <SummaryGroup title="見る相手" values={design.viewers.map((item) => item.label)} />
      <SummaryGroup title="質問領域" values={design.questionAreas.map((item) => item.label)} />
      <SummaryGroup
        title="今回知りたいこと"
        values={formatReportGoalLabels(formState)}
      />
      <SummaryGroup
        title="質問例"
        values={design.questionExamples.map((question) => question.text)}
      />
      <SummaryGroup
        title="質問の扱い"
        values={[
          formState.requiredQuestions.length ? `必ず入れたい質問: ${formatList(formState.requiredQuestions)}` : "必ず入れたい質問の指定なし",
          formState.excludedQuestions.length ? `外したい質問: ${formatList(formState.excludedQuestions)}` : "外したい質問の指定なし"
        ]}
      />
    </div>
  );
}

function SummaryGroup({ title, values }: { title: string; values: readonly string[] }) {
  return (
    <div className="rounded-md border border-[#DDE8E5] bg-white px-3 py-3">
      <h4 className="text-xs font-bold text-[#64748B]">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-[#0F172A]">
        {values.filter(Boolean).map((value) => (
          <li key={value} className="break-words">
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: CustomerChecklistItem["status"] }) {
  const className =
    status === "確認済み"
      ? "border-[#00796B]/30 bg-[#E6F4F1] text-[#005C50]"
      : status === "確認したい"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <span className={cn("inline-flex shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold", className)}>
      {status}
    </span>
  );
}

function MessageBox({
  tone,
  title,
  children
}: {
  tone: "info" | "error";
  title: string;
  children: ReactNode;
}) {
  const isError = tone === "error";
  const Icon = isError ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "mt-5 rounded-lg border px-4 py-3 text-sm leading-6",
        isError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#B8CCC7] bg-[#F8FBFA] text-[#475569]"
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", isError ? "text-rose-600" : "text-[#00796B]")} />
        <div className="min-w-0">
          <strong className={cn("block", isError ? "text-rose-800" : "text-[#0F172A]")}>{title}</strong>
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function applyServiceSuggestions(state: MeasurementWizardState): MeasurementWizardState {
  const brandName = state.brandName.trim() || "対象サービス";
  const serviceCategory = state.serviceCategory.trim() || inferInterimCategory(state);
  const serviceDescription =
    state.serviceDescription.trim() ||
    `AI検索で、${brandName}がどのように候補として出るかを確認するためのサービス。`;
  const audienceTargets =
    state.audienceTargets.length > 0
      ? state.audienceTargets
      : audienceSuggestionsByType[state.audienceType].slice(0, 3);

  return {
    ...state,
    serviceCategory,
    serviceDescription,
    audienceTargets
  };
}

function buildSeedInput(formState: MeasurementWizardState): ProjectSetupSeedInput {
  const officialSiteUrl = normalizeTargetUrlForSeed(formState.officialUrl);
  const serviceDescription = [
    formState.serviceDescription.trim(),
    formState.watchTopics.length ? `見たいこと: ${formState.watchTopics.join("、")}` : "",
    formatReportGoalLabels(formState).length ? `知りたいこと: ${formatReportGoalLabels(formState).join("、")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return {
    companyName: formState.brandName.trim(),
    brandName: formState.brandName.trim(),
    officialSiteUrl,
    productOrServiceDescription: serviceDescription,
    industryCategory: formState.serviceCategory.trim(),
    targetCustomers: [
      formatAudienceType(formState.audienceType),
      formState.audienceTargets.length ? formState.audienceTargets.join("、") : ""
    ]
      .filter(Boolean)
      .join(" / "),
    regions: formState.regions,
    language: formState.language,
    serviceName: formState.brandName.trim() || undefined,
    brandAliases: formState.brandAliases,
    knownCompetitors:
      formState.competitorMode === "known_competitors_confirmed" ? formState.competitors : [],
    avoidCompetitors: uniqueStrings([...formState.exclusions, ...formState.commonExclusions]),
    strengths: [],
    knownRisks: formState.avoidTopics,
    diagnosisGoals: mapReportGoalsToPromptIntents(formState.reportGoals)
  };
}

function buildMeasurementDesign(
  seedInput: ProjectSetupSeedInput,
  formState: MeasurementWizardState,
  seedKey: string
): MeasurementDesign {
  const result = generateProjectSetupDraft(seedInput);
  const brandIdentity = buildBrandIdentity(seedInput);
  const viewers = buildViewerCards(formState, result.draft.personas);
  const questionAreas = buildQuestionAreaCards(formState, result.draft.topics);
  const questionExamples = buildQuestionExamples(formState, result.draft.prompts, brandIdentity);
  const notices = buildDesignNotices(formState, result);

  return {
    seedKey,
    result,
    viewers,
    questionAreas,
    questionExamples,
    notices
  };
}

function buildViewerCards(formState: MeasurementWizardState, personas: readonly PersonaDraft[]) {
  const fromInput = formState.audienceTargets.map((target, index) => ({
    id: `viewer-input-${index}`,
    label: target,
    description: `${target}の視点で、候補比較や不安への答え方を確認します。`
  }));
  const fromDraft = personas.map((persona) => ({
    id: persona.personaId,
    label: persona.displayName,
    description: `${formatPersonaRole(persona.roleType)}の観点。${persona.promptAngle || "導入前の確認に使います。"}`
  }));

  return uniqueCards([...fromInput, ...fromDraft]).slice(0, 6);
}

function buildQuestionAreaCards(formState: MeasurementWizardState, topics: readonly TopicDraft[]) {
  const fromInput = formState.watchTopics.map((topic, index) => ({
    id: `area-input-${index}`,
    label: topic,
    description: `${topic}について、AI検索上の説明や候補への入り方を確認します。`
  }));
  const fromDraft = topics.map((topic) => ({
    id: topic.topicId,
    label: topic.topicName,
    description: topic.expectedSignal || topic.diagnosisGoal || "測定時に確認したい質問領域です。"
  }));
  const fallback = [
    {
      id: "area-fallback-candidate",
      label: "候補に出るか",
      description: "カテゴリ内で候補として自然に紹介されるかを見ます。"
    },
    {
      id: "area-fallback-comparison",
      label: "比較された時にどう見えるか",
      description: "他の選択肢と並んだ時の説明、強み、不安点を確認します。"
    },
    {
      id: "area-fallback-citation",
      label: "引用される情報があるか",
      description: "AI回答が根拠として参照しやすい情報の有無を確認します。"
    }
  ];

  return uniqueCards([...fromInput, ...fromDraft, ...fallback]).slice(0, 7);
}

function buildQuestionExamples(
  formState: MeasurementWizardState,
  prompts: readonly PromptDraft[],
  brandIdentity: BrandIdentityForDraft
) {
  const fromDraft = prompts.map((prompt) => ({
    id: prompt.promptId,
    text: prompt.text,
    group: classifyPromptGroup(prompt, derivePromptMetricEligibility(prompt, brandIdentity))
  }));
  const fromRequired = formState.requiredQuestions.map((text, index) => ({
    id: `required-question-${index}`,
    text,
    group: classifyQuestionText(text, formState)
  }));
  const fallbackCategory = formState.serviceCategory || "このカテゴリのサービス";
  const fallback = [
    {
      id: "question-fallback-candidate",
      text: `${fallbackCategory}を検討するとき、候補になるサービスや会社を自然に比較してください。`,
      group: "candidate" as const
    },
    {
      id: "question-fallback-selection",
      text: `${fallbackCategory}を選ぶ前に確認すべき比較軸や注意点を整理してください。`,
      group: "candidate" as const
    },
    {
      id: "question-fallback-citation",
      text: `${formState.brandName || "このサービス"}について、根拠として参照できる情報を確認してください。`,
      group: "citation" as const
    },
    {
      id: "question-fallback-brand",
      text: `${formState.brandName || "このブランド"}はどんなサービスとして説明されていますか。`,
      group: "brand" as const
    }
  ];

  return uniqueQuestions([...fromRequired, ...fromDraft, ...fallback]).slice(0, 10);
}

function buildDesignNotices(formState: MeasurementWizardState, result: ProjectSetupDraftGenerationResult) {
  const notices = [
    formState.competitorMode === "competitor_discovery_needed"
      ? "競合未定のため、実名競合の比較ではなく、カテゴリ内の候補抽出として扱います。"
      : "",
    "質問例はRecora側で確認してから測定に使う前提です。",
    ...result.warnings.map(translateDesignWarning),
    ...result.blockers.map(translateSeedBlocker)
  ].filter(Boolean);

  return uniqueStrings(notices).slice(0, 8);
}

function buildCustomerChecklist(formState: MeasurementWizardState): CustomerChecklistItem[] {
  return [
    checklistItem("ブランド", Boolean(formState.brandName.trim()), formState.brandName || "未入力"),
    checklistItem("公式URL", Boolean(formState.officialUrl.trim()), formState.officialUrl || "未入力"),
    checklistItem("サービス説明", Boolean(formState.serviceDescription.trim()), formState.serviceDescription || "未入力"),
    checklistItem("市場・言語", formState.regions.length > 0, `${formatList(formState.regions)} / ${formatLanguage(formState.language)}`),
    checklistItem("顧客層", formState.audienceTargets.length > 0, `${formatAudienceType(formState.audienceType)} / ${formatList(formState.audienceTargets)}`),
    {
      label: "競合設定",
      status:
        formState.competitorMode === "known_competitors_confirmed" && formState.competitors.length === 0
          ? "未入力"
          : formState.competitorMode === "competitor_discovery_needed"
            ? "確認したい"
            : "確認済み",
      detail:
        formState.competitorMode === "competitor_discovery_needed"
          ? "競合候補をRecoraで抽出"
          : formatList(formState.competitors)
    },
    {
      label: "除外",
      status: "確認済み",
      detail:
        formState.exclusions.length || formState.commonExclusions.length
          ? formatList([...formState.exclusions, ...formState.commonExclusions])
          : "除外指定なし"
    },
    checklistItem("見たいこと", formState.watchTopics.length > 0, formatList(formState.watchTopics))
  ];
}

function checklistItem(label: string, ok: boolean, detail: string): CustomerChecklistItem {
  return {
    label,
    status: ok ? "確認済み" : "未入力",
    detail
  };
}

function getStepBlockers(stepIndex: number, formState: MeasurementWizardState) {
  const blockers: string[] = [];

  if (stepIndex === 0) {
    if (!formState.brandName.trim()) blockers.push("正式なブランド名 / サービス名を入力してください。");
    if (!formState.officialUrl.trim()) blockers.push("公式URLを入力してください。");
    const normalizedUrl = normalizeTargetUrlForSeed(formState.officialUrl);
    if (normalizedUrl && !isLikelyHttpUrl(normalizedUrl)) blockers.push("公式URLはURLとして扱える形式で入力してください。");
  }

  if (stepIndex === 1) {
    if (!formState.serviceDescription.trim()) blockers.push("どんなサービスかを確認してください。");
    if (!formState.serviceCategory.trim()) blockers.push("サービスカテゴリを入力してください。");
    if (formState.regions.length === 0) blockers.push("対象市場・地域を1件以上追加してください。");
    if (formState.audienceTargets.length === 0) blockers.push("主に見る顧客層を1件以上追加してください。");
  }

  if (
    stepIndex === 2 &&
    formState.competitorMode === "known_competitors_confirmed" &&
    formState.competitors.length === 0
  ) {
    blockers.push("比較したい競合を入力する場合は、競合を1件以上追加してください。");
  }

  if (stepIndex === 3) {
    if (formState.watchTopics.length === 0) blockers.push("特に見たいことを1件以上追加してください。");
    if (formState.reportGoals.length === 0) blockers.push("今回知りたいことを1件以上選んでください。");
    if (formState.reportGoals.includes("other") && !formState.reportGoalInput.trim()) {
      blockers.push("その他の内容を入力してください。");
    }
  }

  return blockers;
}

function buildConfirmationText(input: {
  formState: MeasurementWizardState;
  design: MeasurementDesign;
  checklist: CustomerChecklistItem[];
}) {
  const { formState, design, checklist } = input;
  return [
    "Recora 測定設計の確認内容",
    "",
    "この画面では保存・承認・計測反映は行っていません。",
    "",
    `ブランド: ${formState.brandName || "未入力"}`,
    `表記ゆれ・別名: ${formatList(formState.brandAliases, "指定なし")}`,
    `公式URL: ${formState.officialUrl || "未入力"}`,
    `サービス説明: ${formState.serviceDescription || "未入力"}`,
    `サービスカテゴリ: ${formState.serviceCategory || "未入力"}`,
    `対象市場・地域: ${formatList(formState.regions)}`,
    `測定する言語: ${formatLanguage(formState.language)}`,
    `顧客層: ${formatAudienceType(formState.audienceType)} / ${formatList(formState.audienceTargets)}`,
    "",
    `競合設定: ${
      formState.competitorMode === "competitor_discovery_needed"
        ? "競合候補をRecoraで抽出"
        : formatList(formState.competitors)
    }`,
    `除外: ${formatList([...formState.exclusions, ...formState.commonExclusions], "指定なし")}`,
    "",
    `特に見たいこと: ${formatList(formState.watchTopics)}`,
    `測ってほしくない話題: ${formatList(formState.avoidTopics, "指定なし")}`,
    `今回知りたいこと: ${formatList(formatReportGoalLabels(formState))}`,
    "",
    "見る相手:",
    ...design.viewers.map((viewer) => `- ${viewer.label}: ${viewer.description}`),
    "",
    "質問領域:",
    ...design.questionAreas.map((area) => `- ${area.label}: ${area.description}`),
    "",
    "質問例:",
    ...design.questionExamples.map((question) => `- ${question.text}（${formatQuestionGroup(question.group)}）`),
    "",
    `必ず入れたい質問: ${formatList(formState.requiredQuestions, "指定なし")}`,
    `測ってほしくない質問: ${formatList(formState.excludedQuestions, "指定なし")}`,
    "",
    "注意点:",
    ...design.notices.map((notice) => `- ${notice}`),
    "",
    "確認状態:",
    ...checklist.map((item) => `- ${item.label}: ${item.status}（${item.detail}）`)
  ].join("\n");
}

function inferInterimCategory(formState: MeasurementWizardState) {
  const text = `${formState.brandName} ${formState.officialUrl}`.toLowerCase();
  if (text.includes("recora") || text.includes("seo") || text.includes("geo") || text.includes("ai")) {
    return "AI検索・GEO診断サービス";
  }
  if (text.includes("clinic") || text.includes("medical")) return "医療・クリニック関連サービス";
  if (text.includes("school") || text.includes("edu")) return "教育・スクール関連サービス";
  if (text.includes("ecommerce") || text.includes("shop") || text.includes("store")) return "EC・商品販売サービス";
  return "対象サービス領域";
}

function normalizeTargetUrlForSeed(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isLikelyHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

function extractHostname(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function mapReportGoalsToPromptIntents(goals: readonly ReportGoal[]): PromptIntent[] {
  const mapped = goals.flatMap((goal): PromptIntent[] => {
    if (goal === "visibility") return ["non_branded"];
    if (goal === "competitor") return ["comparison", "buyer_intent"];
    if (goal === "citation") return ["citation_check"];
    if (goal === "brand") return ["branded", "brand_perception", "sentiment"];
    if (goal === "improvement") return ["problem_aware", "solution_aware"];
    return ["non_branded"];
  });
  return uniqueStrings(mapped);
}

function classifyPromptGroup(prompt: PromptDraft, eligibility: PromptMetricEligibility): QuestionGroup {
  if (prompt.intent === "citation_check" || eligibility.citationCheck === "eligible") return "citation";
  if (eligibility.sentiment === "eligible" || eligibility.brandPerception === "eligible" || eligibility.brandingMode === "branded") {
    return "brand";
  }
  if (
    eligibility.visibilityRate === "eligible" ||
    eligibility.ranking === "eligible" ||
    eligibility.shareOfVoice === "eligible"
  ) {
    return "candidate";
  }
  return "review";
}

function classifyQuestionText(text: string, formState: MeasurementWizardState): QuestionGroup {
  const normalized = normalizeText(text);
  const brandSignals = [formState.brandName, ...formState.brandAliases].map(normalizeText).filter(Boolean);
  if (brandSignals.some((signal) => signal && normalized.includes(signal))) return "brand";
  if (normalized.includes("引用") || normalized.includes("根拠") || normalized.includes("参照")) return "citation";
  if (normalized.includes("候補") || normalized.includes("比較") || normalized.includes("おすすめ")) return "candidate";
  return "review";
}

function formatQuestionGroup(group: QuestionGroup) {
  if (group === "candidate") return "候補・比較";
  if (group === "brand") return "ブランド確認";
  if (group === "citation") return "引用・根拠";
  return "確認用";
}

function formatAudienceType(value: AudienceType) {
  if (value === "b2b") return "BtoB";
  if (value === "b2c") return "BtoC";
  return "両方 / 確認したい";
}

function formatLanguage(value: "ja" | "en") {
  return value === "ja" ? "日本語" : "英語";
}

function formatPersonaRole(value: PersonaDraft["roleType"]) {
  const labels: Record<PersonaDraft["roleType"], string> = {
    decision_maker: "導入判断者",
    economic_buyer: "予算・稟議確認者",
    end_user: "実務利用者",
    evaluator: "比較評価担当者",
    technical_reviewer: "技術・運用確認者",
    blocker: "導入時の懸念を確認する人",
    influencer: "推薦・紹介に関わる人",
    purchaser: "購入判断者",
    user: "利用者",
    comparator: "比較検討者",
    recommender_influencer: "推薦する人",
    repeat_user: "継続利用を判断する人",
    agency_or_consultant: "代理店・支援会社"
  };
  return labels[value] ?? "確認したい相手";
}

function formatReportGoalLabels(formState: MeasurementWizardState) {
  return formState.reportGoals.map((goal) => {
    if (goal === "other") return formState.reportGoalInput.trim() || "その他";
    return reportGoalOptions.find((option) => option.value === goal)?.label ?? goal;
  });
}

function translateSeedBlocker(value: string) {
  const map: Record<string, string> = {
    "seedInput.companyName is required": "ブランド名を確認してください。",
    "seedInput.brandName is required": "ブランド名を確認してください。",
    "seedInput.officialSiteUrl is required": "公式URLを確認してください。",
    "seedInput.productOrServiceDescription is required": "サービス説明を確認してください。",
    "seedInput.industryCategory is required": "サービスカテゴリを確認してください。",
    "seedInput.targetCustomers is required": "主に見る顧客層を確認してください。",
    "seedInput.regions must include at least one region": "対象市場・地域を確認してください。",
    "seedInput.language is required": "測定する言語を確認してください。",
    "seedInput.officialSiteUrl must be an http or https URL": "公式URLの形式を確認してください。"
  };
  return map[value] ?? "Recora側で確認が必要な項目があります。";
}

function translateDesignWarning(value: string) {
  const map: Record<string, string> = {
    generated_draft_requires_internal_review: "測定に使う前にRecora側で内容を確認します。",
    generated_prompts_are_not_measurement_ready_until_approved: "質問例はそのまま計測へ反映せず、Recora側で確認してから扱います。",
    known_competitors_missing_use_unknown_competitor_discovery: "競合未定のため、候補抽出モードとして扱います。",
    strengths_missing_use_general_proof_needs: "強みの詳細は未入力のため、一般的な確認観点から始めます。",
    known_risks_missing_internal_review_required: "避けたい話題が少ない場合も、Recora側で扱いを確認します。",
    business_model_inference_needs_confirmation: "サービス分類は入力内容からの仮置きとして確認します。",
    industry_adapter_generic_prompt_angles_need_review: "業種別の細かな観点はRecora側で確認します。",
    target_customers_broad_personas_need_confirmation: "顧客層が広い場合は、測定前に見る相手を絞り込みます。",
    service_description_thin_prompt_angles_need_review: "サービス説明が短い場合は、質問領域をRecora側で確認します。",
    category_label_fallback_used: "カテゴリは仮置きのため、必要に応じて修正してください。",
    regulated_or_high_trust_context_requires_conservative_review: "信頼性が重要な領域として、慎重に確認します。"
  };
  return map[value] ?? "Recora側で確認が必要な注意点があります。";
}

function addUnique(values: readonly string[], value: string) {
  const normalized = value.trim();
  if (!normalized) return [...values];
  return uniqueStrings([...values, normalized]);
}

function removeValue(values: readonly string[], value: string) {
  return values.filter((item) => item !== value);
}

function toggleValue<T extends string>(values: readonly T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function uniqueCards(cards: readonly EditableCard[]) {
  const seen = new Set<string>();
  const result: EditableCard[] = [];
  for (const card of cards) {
    const key = normalizeText(card.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(card);
  }
  return result;
}

function uniqueQuestions(questions: readonly EditableQuestion[]) {
  const seen = new Set<string>();
  const result: EditableQuestion[] = [];
  for (const question of questions) {
    const key = normalizeText(question.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(question);
  }
  return result;
}

function uniqueStrings<T extends string>(values: readonly T[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean) as T[]));
}

function formatList(values: readonly string[], emptyText = "未入力") {
  return values.length ? values.join("、") : emptyText;
}

function normalizeText(value: string) {
  return value.normalize("NFKC").trim().toLowerCase();
}

function stableSeedKey(seedInput: ProjectSetupSeedInput) {
  return JSON.stringify({
    companyName: seedInput.companyName,
    brandName: seedInput.brandName,
    officialSiteUrl: seedInput.officialSiteUrl,
    productOrServiceDescription: seedInput.productOrServiceDescription,
    industryCategory: seedInput.industryCategory,
    targetCustomers: seedInput.targetCustomers,
    regions: seedInput.regions,
    language: seedInput.language,
    brandAliases: seedInput.brandAliases,
    knownCompetitors: seedInput.knownCompetitors,
    avoidCompetitors: seedInput.avoidCompetitors,
    knownRisks: seedInput.knownRisks,
    diagnosisGoals: seedInput.diagnosisGoals
  });
}
