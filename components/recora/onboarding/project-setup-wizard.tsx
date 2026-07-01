"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Info,
  Loader2,
  MessageSquareText,
  Plus,
  SearchCheck,
  Sparkles,
  Target,
  Wand2,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { derivePromptMetricEligibility, validateProjectSetupSeedInput } from "@/lib/recora/project-setup-draft";
import type {
  BrandIdentityForDraft,
  PersonaDraft,
  ProjectSetupSeedInput,
  PromptDraft,
  PromptIntent,
  PromptMetricEligibility
} from "@/lib/recora/project-setup-draft";
import { generateProjectSetupDraft } from "@/lib/recora/project-setup-draft-generator";
import type {
  SiteInspectionApiResponse,
  SiteInspectionResult,
  SiteInspectionWarning
} from "@/lib/recora/site-inspection-types";
import { cn } from "@/lib/utils";

const steps = [
  { title: "ブランド確認", short: "ブランド", icon: Building2 },
  { title: "サービス理解・市場・顧客層・競合", short: "サービス", icon: Wand2 },
  { title: "見たいこと", short: "見たいこと", icon: Target },
  { title: "プロンプト例", short: "プロンプト", icon: MessageSquareText },
  { title: "最終確認", short: "確認", icon: ClipboardCheck }
] as const;

type AudienceType = "b2b" | "b2c" | "both_or_confirm";
type CompetitorMode = "known_competitors_confirmed" | "competitor_discovery_needed";
type ReportGoal = "visibility" | "competitor" | "citation" | "brand" | "improvement" | "other";
type PromptGroup = "candidate" | "brand" | "citation" | "review";
type OnboardingSuggestionProfileKey =
  | "b2bSaasOrSeo"
  | "b2bProfessionalService"
  | "b2cSchoolEducation"
  | "healthcareClinic"
  | "localService"
  | "ecommerceProduct"
  | "genericB2C"
  | "genericB2B";

type ReportGoalOption = { value: ReportGoal; label: string };

type OnboardingSuggestionProfile = {
  key: OnboardingSuggestionProfileKey;
  serviceCategories: string[];
  audienceTargets: string[];
  watchTopics: string[];
  reportGoalOptions: ReportGoalOption[];
  promptFallbacks: { text: string; group: PromptGroup }[];
  questionAreaFallbacks: string[];
};

type WizardState = {
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
  watchTopics: string[];
  watchTopicInput: string;
  reportGoals: ReportGoal[];
  reportGoalInput: string;
};

type EditablePrompt = {
  id: string;
  text: string;
  group: PromptGroup;
};

type CustomerFacingDraftPreview = {
  serviceCategories: string[];
  audienceTargets: string[];
  questionAreas: string[];
  prompts: EditablePrompt[];
};

type CustomerPersonaSource = "selected" | "generated" | "fallback";

type CustomerPersona = {
  id: string;
  label: string;
  description: string;
  source: CustomerPersonaSource;
};

type SiteInspectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SiteInspectionResult }
  | { status: "failed"; message: string; code?: string; warnings?: SiteInspectionWarning[] };

type AutoSuggestionSources = {
  serviceDescription: string | null;
  serviceCategory: string | null;
  audienceTargets: string | null;
};

type UpdateForm = <K extends keyof WizardState>(field: K, value: WizardState[K]) => void;

const initialAutoSuggestionSources: AutoSuggestionSources = {
  serviceDescription: null,
  serviceCategory: null,
  audienceTargets: null
};

const initialFormState: WizardState = {
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
  watchTopics: [],
  watchTopicInput: "",
  reportGoals: ["visibility"],
  reportGoalInput: ""
};

const audienceOptions = [
  { value: "b2b", label: "BtoB", description: "企業や組織の導入判断を中心に見ます。" },
  { value: "b2c", label: "BtoC", description: "個人の比較検討や購入判断を中心に見ます。" },
  { value: "both_or_confirm", label: "両方 / 確認したい", description: "両方の可能性を残して確認します。" }
] as const;

const languageOptions = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "英語" }
] as const;

const regionSuggestions = ["日本", "首都圏", "関西", "全国", "英語圏", "北米", "アジア"];

const defaultReportGoalOptions: ReportGoalOption[] = [
  { value: "visibility", label: "AI検索で候補に出るか知りたい" },
  { value: "competitor", label: "競合と比べたい" },
  { value: "citation", label: "公式サイトの引用を確認したい" },
  { value: "brand", label: "評判や認知を確認したい" },
  { value: "improvement", label: "改善候補を出したい" },
  { value: "other", label: "その他" }
];

const suggestionProfiles: Record<OnboardingSuggestionProfileKey, OnboardingSuggestionProfile> = {
  b2bSaasOrSeo: {
    key: "b2bSaasOrSeo",
    serviceCategories: ["SEO / AI検索対策", "マーケティング / SEO", "SaaS / 分析ツール"],
    audienceTargets: ["SEO担当者", "マーケティング責任者", "導入を判断する責任者", "比較検討する担当者", "実際に利用する担当者"],
    watchTopics: ["AI検索での露出", "競合との比較", "公式サイトの引用状況", "料金", "機能", "導入事例", "費用対効果", "導入負荷"],
    reportGoalOptions: [
      { value: "visibility", label: "AI検索で自社が候補に出るか知りたい" },
      { value: "competitor", label: "競合と比べたい" },
      { value: "citation", label: "参照元を増やしたい" },
      { value: "improvement", label: "改善候補を出したい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "AI検索対策ツールを比較するとき、どの指標を見るべきですか？", group: "candidate" },
      { text: "生成AIで公式サイトが引用されやすくなるには、何を整えるべきですか？", group: "citation" },
      { text: "SEO支援ツールを導入する前に、費用対効果はどう確認すべきですか？", group: "candidate" }
    ],
    questionAreaFallbacks: ["AI検索での露出", "競合比較", "公式サイトの引用状況"]
  },
  b2bProfessionalService: {
    key: "b2bProfessionalService",
    serviceCategories: ["専門サービス", "コンサルティング", "BtoBサービス"],
    audienceTargets: ["相談前に比較する人", "専門性を重視する人", "料金を確認したい人", "依頼を判断する責任者"],
    watchTopics: ["実績", "専門性", "料金", "相談前の確認点", "対応範囲", "信頼性"],
    reportGoalOptions: [
      { value: "visibility", label: "専門サービスとして候補に出るか知りたい" },
      { value: "competitor", label: "他の依頼先と比べたい" },
      { value: "brand", label: "信頼材料や評判を確認したい" },
      { value: "improvement", label: "相談前の不安を知りたい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "専門サービスを依頼する前に、実績や相談前の確認点は何を見るべきですか？", group: "candidate" },
      { text: "料金と専門性を比較する時、どんな点を確認すべきですか？", group: "candidate" }
    ],
    questionAreaFallbacks: ["実績", "専門性", "相談前の確認点"]
  },
  b2cSchoolEducation: {
    key: "b2cSchoolEducation",
    serviceCategories: ["スクール / 教育", "習い事", "語学スクール"],
    audienceTargets: ["初めて選ぶ人", "料金を比較する人", "口コミを重視する人", "通いやすさを重視する人"],
    watchTopics: ["初めて選ぶ時の不安", "料金", "口コミ・評判", "通いやすさ", "自分に合うか", "体験や相談のしやすさ", "家族に合うか"],
    reportGoalOptions: [
      { value: "visibility", label: "AI検索で候補に出るか知りたい" },
      { value: "brand", label: "口コミ・評判を確認したい" },
      { value: "competitor", label: "他のスクールと比べたい" },
      { value: "improvement", label: "初めて選ぶ人の不安を知りたい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "初めて英会話スクールを選ぶ時、何を確認すれば失敗しにくいですか？", group: "candidate" },
      { text: "英会話スクールの口コミを見る時、どこに注意すべきですか？", group: "brand" },
      { text: "料金が安い英会話スクールを選ぶ時、確認した方がいい点はありますか？", group: "candidate" }
    ],
    questionAreaFallbacks: ["初めて選ぶ時の不安", "料金", "口コミ・評判", "通いやすさ"]
  },
  healthcareClinic: {
    key: "healthcareClinic",
    serviceCategories: ["クリニック / 医療", "美容クリニック", "医療サービス"],
    audienceTargets: ["初めて相談する人", "料金を確認したい人", "口コミを重視する人", "資格や専門性を確認したい人"],
    watchTopics: ["料金", "口コミ・評判", "資格・専門性", "リスク説明", "初回相談のしやすさ", "通いやすさ"],
    reportGoalOptions: [
      { value: "visibility", label: "AI検索で候補に出るか知りたい" },
      { value: "brand", label: "口コミ・評判を確認したい" },
      { value: "improvement", label: "相談前の不安を知りたい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "初めてクリニックを選ぶ時、料金や説明で確認すべき点は何ですか？", group: "candidate" },
      { text: "口コミだけでクリニックを選んでも大丈夫ですか？", group: "brand" },
      { text: "施術や相談前に、資格やリスク説明で何を見るべきですか？", group: "review" }
    ],
    questionAreaFallbacks: ["料金", "口コミ・評判", "資格・専門性", "リスク説明"]
  },
  localService: {
    key: "localService",
    serviceCategories: ["地域サービス", "店舗サービス", "予約サービス"],
    audienceTargets: ["近くで探す人", "予約しやすさを重視する人", "口コミを重視する人"],
    watchTopics: ["近さ", "予約しやすさ", "料金", "口コミ", "対応エリア", "相談しやすさ"],
    reportGoalOptions: [
      { value: "visibility", label: "近くの候補に出るか知りたい" },
      { value: "brand", label: "口コミを確認したい" },
      { value: "improvement", label: "予約前の不安を知りたい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "近くでサービスを探す時、口コミ以外に何を確認すべきですか？", group: "candidate" },
      { text: "予約しやすい地域サービスを選ぶ時、どんな点を見るべきですか？", group: "candidate" }
    ],
    questionAreaFallbacks: ["近さ", "予約しやすさ", "口コミ", "対応エリア"]
  },
  ecommerceProduct: {
    key: "ecommerceProduct",
    serviceCategories: ["EC / 商品", "通販", "商品比較"],
    audienceTargets: ["価格を比較する人", "口コミを重視する人", "品質を確認したい人", "返品条件を確認したい人"],
    watchTopics: ["価格", "口コミ", "返品条件", "品質", "自分に合うか", "比較時の注意点"],
    reportGoalOptions: [
      { value: "visibility", label: "商品候補に出るか知りたい" },
      { value: "competitor", label: "他の商品と比べたい" },
      { value: "brand", label: "口コミ・評判を確認したい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "商品を比較する時、価格や口コミ以外に何を見るべきですか？", group: "candidate" },
      { text: "返品条件や品質を確認する時、注意すべき点はありますか？", group: "review" }
    ],
    questionAreaFallbacks: ["価格", "口コミ", "返品条件", "品質"]
  },
  genericB2C: {
    key: "genericB2C",
    serviceCategories: ["BtoCサービス", "比較サービス", "その他"],
    audienceTargets: ["初めて選ぶ人", "料金を比較する人", "口コミを重視する人"],
    watchTopics: ["料金", "口コミ・評判", "自分に合うか", "比較時の注意点", "相談しやすさ"],
    reportGoalOptions: defaultReportGoalOptions,
    promptFallbacks: [
      { text: "初めてサービスを選ぶ時、何を確認すれば失敗しにくいですか？", group: "candidate" },
      { text: "口コミや料金を見る時、どこに注意すべきですか？", group: "brand" }
    ],
    questionAreaFallbacks: ["料金", "口コミ・評判", "比較時の注意点"]
  },
  genericB2B: {
    key: "genericB2B",
    serviceCategories: ["BtoBサービス", "専門サービス", "その他"],
    audienceTargets: ["導入を判断する責任者", "比較検討する担当者", "実際に利用する担当者"],
    watchTopics: ["候補比較", "料金", "導入負荷", "実績", "信頼性", "公式サイトの引用状況"],
    reportGoalOptions: defaultReportGoalOptions,
    promptFallbacks: [
      { text: "サービスを比較検討するとき、候補を絞る前に何を確認すべきですか？", group: "candidate" },
      { text: "導入前に、料金や運用負荷はどう確認すべきですか？", group: "review" }
    ],
    questionAreaFallbacks: ["候補比較", "料金", "導入負荷", "信頼性"]
  }
};

const promptSeedFields = new Set<keyof WizardState>([
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
  "watchTopics",
  "reportGoals",
  "reportGoalInput"
]);

export function ProjectSetupWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<WizardState>(initialFormState);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [promptExamples, setPromptExamples] = useState<EditablePrompt[] | null>(null);
  const [draftPreview, setDraftPreview] = useState<CustomerFacingDraftPreview | null>(null);
  const [promptSeedKey, setPromptSeedKey] = useState<string | null>(null);
  const [newPromptText, setNewPromptText] = useState("");
  const [confirmationDone, setConfirmationDone] = useState(false);
  const [siteInspection, setSiteInspection] = useState<SiteInspectionState>({ status: "idle" });
  const [autoSuggestionSources, setAutoSuggestionSources] = useState<AutoSuggestionSources>(initialAutoSuggestionSources);

  const seedInput = useMemo(() => buildSeedInput(formState), [formState]);
  const seedKey = useMemo(() => stableSeedKey(seedInput), [seedInput]);
  const currentStepBlockers = getStepBlockers(stepIndex, formState);
  const showCurrentBlockers = attemptedSteps[stepIndex] && currentStepBlockers.length > 0;
  const seedBlockers = useMemo(() => validateProjectSetupSeedInput(seedInput), [seedInput]);
  const isInspectingSite = siteInspection.status === "loading";

  const updateForm: UpdateForm = (field, value) => {
    setConfirmationDone(false);
    setFormState((current) => {
      const next = { ...current, [field]: value };
      if (field === "serviceDescription" || field === "serviceCategory" || field === "audienceType") {
        return {
          ...next,
          audienceTargets: reconcileAudienceTargetsForProfile(next, current.audienceTargets.length > 0)
        };
      }
      return next;
    });
    if (field === "serviceDescription" || field === "serviceCategory" || field === "audienceTargets") {
      setAutoSuggestionSources((current) => ({ ...current, [field]: null }));
    }
    if (field === "audienceType") {
      setAutoSuggestionSources((current) => ({ ...current, audienceTargets: null }));
    }
    if (field === "brandName" || field === "brandAliases" || field === "officialUrl") {
      setSiteInspection({ status: "idle" });
    }
    if (promptSeedFields.has(field)) {
      setPromptExamples(null);
      setDraftPreview(null);
      setPromptSeedKey(null);
    }
  };

  async function goNext() {
    if (isInspectingSite) return;
    const blockers = getStepBlockers(stepIndex, formState);
    setAttemptedSteps((current) => ({ ...current, [stepIndex]: true }));
    if (blockers.length > 0) return;

    if (stepIndex === 0) {
      setSiteInspection({ status: "loading" });
      const inspection = await inspectOfficialUrlForStep(formState);
      const sourceKey = stableStep1SourceKey(formState);
      const nextSuggestions = applyServiceSuggestions(
        formState,
        autoSuggestionSources,
        sourceKey,
        inspection.status === "success" ? inspection.result : null
      );
      setSiteInspection(inspection);
      setFormState(nextSuggestions.state);
      setAutoSuggestionSources(nextSuggestions.sources);
      setStepIndex(1);
      return;
    }

    if (stepIndex === 2) {
      if (draftPreview === null || promptExamples === null || promptSeedKey !== seedKey) {
        const preview = buildCustomerFacingDraftPreview(seedInput, formState);
        setDraftPreview(preview);
        setPromptExamples(preview.prompts);
        setPromptSeedKey(seedKey);
      }
      setStepIndex(3);
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setConfirmationDone(false);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function addPrompt() {
    const text = newPromptText.trim();
    if (!text) return;
    setPromptExamples((current) => [
      ...(current ?? []),
      {
        id: `prompt-custom-${Date.now()}`,
        text,
        group: classifyPromptText(text, formState)
      }
    ]);
    setNewPromptText("");
    setConfirmationDone(false);
  }

  const currentPrompts = promptExamples ?? [];

  return (
    <main className="min-h-screen bg-[#F7FAF8] text-[#0B1F17]">
      <section className="sticky top-0 z-20 border-b border-[#E2E8E5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#075E44] text-base font-bold text-white">
                R
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64736C]">無料診断後の測定条件確認フロー</p>
                <h1 className="mt-0.5 text-xl font-bold leading-tight tracking-normal text-[#0B1F17] sm:text-2xl">
                  Recora 初期設定ウィザード
                </h1>
              </div>
            </div>
            <p className="hidden text-xs font-semibold leading-5 text-[#64736C] lg:block">
              保存・承認・計測反映はここでは行いません。
            </p>
          </div>
          <StepProgress stepIndex={stepIndex} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {stepIndex === 0 ? <BrandStep formState={formState} updateForm={updateForm} siteInspection={siteInspection} /> : null}
        {stepIndex === 1 ? <ServiceStep formState={formState} updateForm={updateForm} siteInspection={siteInspection} /> : null}
        {stepIndex === 2 ? <FocusStep formState={formState} updateForm={updateForm} /> : null}
        {stepIndex === 3 ? (
          <PromptStep
            draftPreview={draftPreview}
            prompts={currentPrompts}
            newPromptText={newPromptText}
            setNewPromptText={setNewPromptText}
            onAddPrompt={addPrompt}
            onChangePrompts={(prompts) => {
              setPromptExamples(prompts);
              setConfirmationDone(false);
            }}
          />
        ) : null}
        {stepIndex === 4 ? (
          <ConfirmationStep
            formState={formState}
            draftPreview={draftPreview}
            prompts={currentPrompts}
            seedBlockers={seedBlockers}
            confirmationDone={confirmationDone}
            onConfirm={() => setConfirmationDone(true)}
          />
        ) : null}

        {showCurrentBlockers ? (
          <MessageBox title="次に進む前に確認してください" tone="error">
            <ul className="space-y-1">
              {currentStepBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </MessageBox>
        ) : null}

        <div className="mx-auto mt-4 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0 || isInspectingSite}>
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={isInspectingSite} className="bg-[#075E44] hover:bg-[#064D39]">
              {isInspectingSite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  公式URLを確認中
                </>
              ) : (
                <>
                  {stepIndex === 2 ? "プロンプト例へ進む" : "次へ"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function StepProgress({ stepIndex }: { stepIndex: number }) {
  return (
    <nav aria-label="初期設定ステップ" className="-mx-1 overflow-x-auto px-1">
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index === stepIndex;
          const done = index < stepIndex;
          return (
            <li key={step.title} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold transition",
                  active || done ? "border-[#075E44] bg-[#075E44] text-white" : "border-[#D8E2DE] bg-white text-[#64736C]"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span>Step {index + 1}</span>
                <span className="hidden sm:inline">{step.short}</span>
              </span>
              {index < steps.length - 1 ? (
                <span className="h-px w-6 bg-[#D8E2DE]" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BrandStep({
  formState,
  updateForm,
  siteInspection
}: {
  formState: WizardState;
  updateForm: UpdateForm;
  siteInspection: SiteInspectionState;
}) {
  return (
    <WizardCard
      icon={<Building2 />}
      title="ブランド確認"
      description="公式サイトまたはサービスサイトのURLを入力してください。"
    >
      <div className="space-y-4">
        <TextInput
          label="正式なブランド名 / サービス名"
          value={formState.brandName}
          onChange={(value) => updateForm("brandName", value)}
          required
          placeholder="例 Recora"
        />
        <ChipInput
          label="表記ゆれ・別名"
          optional
          items={formState.brandAliases}
          inputValue={formState.brandAliasInput}
          onInputChange={(value) => updateForm("brandAliasInput", value)}
          onAdd={(value) => updateForm("brandAliases", addUnique(formState.brandAliases, value))}
          onRemove={(value) => updateForm("brandAliases", removeValue(formState.brandAliases, value))}
          placeholder="例 レコラ、Recora Inc."
          emptyText="別名がなければ空のままで進めます。"
        />
        <TextInput
          label="公式URL"
          value={formState.officialUrl}
          onChange={(value) => updateForm("officialUrl", value)}
          required
          placeholder="例 https://recora.jp"
        />
        <p className="text-xs leading-5 text-[#64736C]">
          次へ進むと、このURLの1ページだけを確認し、ページタイトルなどを次の入力候補に使います。
        </p>
        {siteInspection.status === "loading" ? (
          <div className="rounded-xl border border-[#CFE2DA] bg-[#F2FAF6] p-4 text-sm leading-6 text-[#506158]">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#1B8B65]" />
              <div>
                <p className="font-bold text-[#075E44]">公式URLを確認しています</p>
                <p className="mt-1">ページタイトル、説明文、見出しを確認してサービス情報の候補を作っています。</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </WizardCard>
  );
}

function ServiceStep({
  formState,
  updateForm,
  siteInspection
}: {
  formState: WizardState;
  updateForm: UpdateForm;
  siteInspection: SiteInspectionState;
}) {
  const suggestionProfile = deriveOnboardingSuggestionProfile(formState);
  const audienceSuggestions = suggestionProfile.audienceTargets;
  const categorySuggestions = suggestionProfile.serviceCategories;

  return (
    <WizardCard
      size="wide"
      icon={<Wand2 />}
      title="サービス理解・市場・顧客層・競合"
      description="サービスの内容や市場・競合について教えてください。"
    >
      <SiteInspectionPanel formState={formState} siteInspection={siteInspection} />

      <div className="mt-3 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] px-3 py-2.5">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1B8B65]" />
          <div>
            <h3 className="text-sm font-bold text-[#075E44]">Recoraからの提案</h3>
            <p className="mt-0.5 text-xs leading-5 text-[#64736C]">
              公式URLのページ情報と入力内容をもとに、以下の候補を入れています。必要なら編集してください。
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)]">
        <div className="space-y-4">
          <TextareaInput
            label="どんなサービスですか？"
            value={formState.serviceDescription}
            onChange={(value) => updateForm("serviceDescription", value)}
            required
            rows={3}
            placeholder="サービスの目的、提供価値、主な特徴を入力してください。"
          />
          <SelectLikeInput
          label="サービスカテゴリ"
          value={formState.serviceCategory}
          onChange={(value) => updateForm("serviceCategory", value)}
          required
          placeholder="例 SEO / AI検索対策"
          suggestions={categorySuggestions}
          />
        </div>
        <div className="space-y-4">
        <div>
          <p className="text-sm font-bold text-[#334155]">提供形態</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {audienceOptions.map((option) => (
              <ChoicePill
                key={option.value}
                selected={formState.audienceType === option.value}
                label={option.label}
                description={option.description}
                onClick={() => updateForm("audienceType", option.value)}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipInput
            label="対象市場・地域"
            items={formState.regions}
            inputValue={formState.regionInput}
            onInputChange={(value) => updateForm("regionInput", value)}
            onAdd={(value) => updateForm("regions", addUnique(formState.regions, value))}
            onRemove={(value) => updateForm("regions", removeValue(formState.regions, value))}
            placeholder="例 日本"
            suggestions={regionSuggestions}
          />
          <SegmentedControl
            label="言語"
            value={formState.language}
            options={languageOptions}
            onChange={(value) => updateForm("language", value)}
          />
        </div>
        <ChipInput
          label="ペルソナ"
          items={formState.audienceTargets}
          inputValue={formState.audienceTargetInput}
          onInputChange={(value) => updateForm("audienceTargetInput", value)}
          onAdd={(value) => updateForm("audienceTargets", addUnique(formState.audienceTargets, value))}
          onRemove={(value) => updateForm("audienceTargets", removeValue(formState.audienceTargets, value))}
          placeholder="例 マーケティング担当者"
          suggestions={audienceSuggestions}
        />
        <section className="rounded-xl border border-[#E1E8E5] bg-white p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0B1F17]">競合</h3>
              <p className="mt-1 text-sm leading-6 text-[#64736C]">
                比較したい競合があれば入力してください。未定の場合はRecoraで候補抽出する前提で進めます。
              </p>
            </div>
            <div className="grid min-w-[240px] gap-2 sm:grid-cols-2">
              <MiniToggle
                selected={formState.competitorMode === "known_competitors_confirmed"}
                label="競合を入力する"
                onClick={() => updateForm("competitorMode", "known_competitors_confirmed")}
              />
              <MiniToggle
                selected={formState.competitorMode === "competitor_discovery_needed"}
                label="候補を抽出してもらう"
                onClick={() => updateForm("competitorMode", "competitor_discovery_needed")}
              />
            </div>
          </div>
          <div className="mt-4">
            <ChipInput
              label="競合（最大5つまで）"
              optional
              items={formState.competitors}
              inputValue={formState.competitorInput}
              onInputChange={(value) => updateForm("competitorInput", value)}
              onAdd={(value) => {
                updateForm("competitors", addUnique(formState.competitors, value).slice(0, 5));
                updateForm("competitorMode", "known_competitors_confirmed");
              }}
              onRemove={(value) => updateForm("competitors", removeValue(formState.competitors, value))}
              placeholder="例 Brandwatch"
              emptyText="未入力でも進められます。"
            />
          </div>
        </section>
        </div>
      </div>
    </WizardCard>
  );
}

function SiteInspectionPanel({
  formState,
  siteInspection
}: {
  formState: WizardState;
  siteInspection: SiteInspectionState;
}) {
  if (siteInspection.status === "idle") return null;

  if (siteInspection.status === "loading") {
    return (
      <div className="rounded-xl border border-[#CFE2DA] bg-[#F2FAF6] p-4 text-sm leading-6 text-[#506158]">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#1B8B65]" />
          <div>
            <h3 className="font-bold text-[#075E44]">公式URLを確認しています</h3>
            <p className="mt-1">ページタイトル、説明文、見出しを確認しています。</p>
          </div>
        </div>
      </div>
    );
  }

  if (siteInspection.status === "failed") {
    const targetUrl = normalizeTargetUrlForSeed(formState.officialUrl);
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold">ページ情報は確認できませんでした</h3>
            <p className="mt-1">{siteInspection.message} 手入力でこのまま進められます。</p>
            {isLikelyHttpUrl(targetUrl) ? (
              <InspectionLink href={targetUrl} className="mt-3 text-amber-900" />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const result = siteInspection.result;
  return (
    <div className="rounded-xl border border-[#CFE2DA] bg-white p-3.5 text-sm leading-6 text-[#20352C] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start gap-3">
        <SearchCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1B8B65]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-[#075E44]">公式URLのページ情報</h3>
              <p className="mt-1 text-[#64736C]">1ページだけ確認し、サービス情報の候補に使いました。</p>
            </div>
            <InspectionLink href={result.normalizedUrl} />
          </div>

          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <InspectionDatum label="ページタイトル" value={result.title} />
            <InspectionDatum label="説明文" value={result.description} />
            <InspectionDatum label="ブランド確認" value={result.brandNameFound ? "確認できました" : "確認できませんでした"} />
            <InspectionDatum label="ホスト名" value={result.hostname} />
          </dl>

          {!result.brandNameFound ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              入力したブランド名がページ情報からは確認できませんでした。公式URLまたはブランド名が合っているか確認してください。
            </div>
          ) : null}

          {result.warnings.includes("response_truncated") ? (
            <p className="mt-3 text-xs leading-5 text-[#64736C]">ページが大きいため、先頭部分だけを確認しました。</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InspectionDatum({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#EAF0ED] bg-[#F8FBFA] px-3 py-2">
      <dt className="text-xs font-bold text-[#64736C]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#0B1F17]">{value || "未取得"}</dd>
    </div>
  );
}

function InspectionLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("inline-flex items-center gap-1 text-xs font-bold text-[#075E44] underline-offset-4 hover:underline", className)}
    >
      公式URLを開いて確認
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function FocusStep({ formState, updateForm }: { formState: WizardState; updateForm: UpdateForm }) {
  const suggestionProfile = deriveOnboardingSuggestionProfile(formState);
  const watchTopicOptions = suggestionProfile.watchTopics;
  const reportGoalOptions = suggestionProfile.reportGoalOptions;

  return (
    <WizardCard
      icon={<Target className="h-9 w-9" />}
      title="見たいこと"
      description="特に知りたいテーマを選択してください。上位3つ程度を目安にすると、確認しやすくなります。"
      footer="選択内容をもとに、次のステップでプロンプト例をご提案します。"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#0B1F17]">特に見たいこと</h3>
            <Badge variant="outline" className="border-[#D6E2DD] bg-white text-[#64736C]">
              上位3つまで
            </Badge>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {watchTopicOptions.map((topic) => (
              <CheckCard
                key={topic}
                selected={formState.watchTopics.includes(topic)}
                label={topic}
                onClick={() => updateForm("watchTopics", toggleValue(formState.watchTopics, topic).slice(0, 3))}
              />
            ))}
          </div>
          <div className="mt-3">
            <InlineAddInput
              value={formState.watchTopicInput}
              onChange={(value) => updateForm("watchTopicInput", value)}
              onAdd={(value) => updateForm("watchTopics", addUnique(formState.watchTopics, value).slice(0, 3))}
              placeholder="具体的に見たいテーマを入力"
              buttonLabel="テーマを追加"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#0B1F17]">今回知りたいこと</h3>
            <Badge variant="outline" className="border-[#D6E2DD] bg-white text-[#64736C]">
              上位3つまで
            </Badge>
          </div>
          <div className="mt-3 grid gap-2">
            {reportGoalOptions.map((goal) => {
              const selected = formState.reportGoals.includes(goal.value);
              return (
                <label
                  key={goal.value}
                  className={cn(
                    "flex min-h-11 items-start gap-3 rounded-lg border px-3 py-3 text-sm transition",
                    selected ? "border-[#1B8B65] bg-[#F2FAF6]" : "border-[#E1E8E5] bg-white hover:border-[#A9C6BA]"
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[#C9D8D2] text-[#075E44] focus:ring-[#075E44]"
                    checked={selected}
                    onChange={() => updateForm("reportGoals", toggleValue(formState.reportGoals, goal.value).slice(0, 3))}
                  />
                  <span className="leading-6 text-[#20352C]">{goal.label}</span>
                </label>
              );
            })}
          </div>
          {formState.reportGoals.includes("other") ? (
            <div className="mt-3">
              <TextInput
                label="その他の内容"
                value={formState.reportGoalInput}
                onChange={(value) => updateForm("reportGoalInput", value)}
                placeholder="具体的にご入力ください"
              />
            </div>
          ) : null}
        </div>
      </div>
    </WizardCard>
  );
}

function PromptStep({
  draftPreview,
  prompts,
  newPromptText,
  setNewPromptText,
  onAddPrompt,
  onChangePrompts
}: {
  draftPreview: CustomerFacingDraftPreview | null;
  prompts: EditablePrompt[];
  newPromptText: string;
  setNewPromptText: (value: string) => void;
  onAddPrompt: () => void;
  onChangePrompts: (prompts: EditablePrompt[]) => void;
}) {
  const generatedPrompts = prompts.filter((prompt) => !isCustomPrompt(prompt));
  const customPrompts = prompts.filter(isCustomPrompt);

  return (
    <WizardCard
      icon={<MessageSquareText className="h-9 w-9" />}
      title="プロンプト例"
      description="入力内容をもとに、診断で使う質問例を確認しやすい形に整理しました。"
      footer="この画面では質問文の方向性だけを確認します。保存・承認・計測反映は行いません。"
      size="wide"
    >
      {draftPreview ? <DraftPreviewSummary draftPreview={draftPreview} /> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 rounded-xl border border-[#DDE8E5] bg-[#FBFDFC] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0B1F17]">Recoraからの提案</h3>
              <p className="mt-1 text-sm leading-6 text-[#64736C]">
                Step1〜Step3の入力から作成した下書きです。必要に応じて文章だけ調整できます。
              </p>
            </div>
            <Badge variant="outline" className="border-[#CFE2DA] bg-white text-[#075E44]">
              {generatedPrompts.length}件
            </Badge>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#E1E8E5] bg-white">
            {generatedPrompts.length > 0 ? (
              generatedPrompts.map((prompt, index) => (
                <PromptListItem
                  key={prompt.id}
                  index={index}
                  prompt={prompt}
                  onChange={(nextPrompt) =>
                    onChangePrompts(prompts.map((item) => (item.id === prompt.id ? nextPrompt : item)))
                  }
                  onRemove={() => onChangePrompts(prompts.filter((item) => item.id !== prompt.id))}
                />
              ))
            ) : (
              <EmptyPromptState />
            )}
          </div>

          {customPrompts.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#0B1F17]">追加したプロンプト</h3>
                <span className="text-xs font-semibold text-[#64736C]">{customPrompts.length}件</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#E1E8E5] bg-white">
                {customPrompts.map((prompt, index) => (
                  <PromptListItem
                    key={prompt.id}
                    index={generatedPrompts.length + index}
                    prompt={prompt}
                    onChange={(nextPrompt) =>
                      onChangePrompts(prompts.map((item) => (item.id === prompt.id ? nextPrompt : item)))
                    }
                    onRemove={() => onChangePrompts(prompts.filter((item) => item.id !== prompt.id))}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-xl border border-[#DDE8E5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <TextareaInput
            label="追加したいプロンプト"
            value={newPromptText}
            onChange={setNewPromptText}
            rows={4}
            placeholder="例 海外市場での評判や評価はどうですか？"
          />
          <Button type="button" variant="outline" className="mt-3 w-full border-[#C9D8D2] text-[#075E44]" onClick={onAddPrompt}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
          <p className="mt-3 text-xs leading-5 text-[#7A8982]">
            追加・編集・削除した内容は、次の最終確認に反映されます。
          </p>
        </aside>
      </div>
    </WizardCard>
  );
}

function DraftPreviewSummary({ draftPreview }: { draftPreview: CustomerFacingDraftPreview }) {
  const summaryItems = [
    { title: "サービスカテゴリ", values: draftPreview.serviceCategories, emptyText: "未入力" },
    { title: "ペルソナ", values: draftPreview.audienceTargets, emptyText: "未入力" },
    { title: "質問領域", values: draftPreview.questionAreas, emptyText: "未入力" }
  ];

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      {summaryItems.map((item) => (
        <PreviewSection key={item.title} title={item.title} values={item.values} emptyText={item.emptyText} />
      ))}
    </div>
  );
}

function PreviewSection({ title, values, emptyText }: { title: string; values: readonly string[]; emptyText: string }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#E1E8E5] bg-[#F8FBFA] p-3">
      <h3 className="text-xs font-bold uppercase tracking-normal text-[#64736C]">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((value) => (
            <span key={value} className="max-w-full rounded-full bg-white px-2.5 py-1 text-xs font-semibold leading-5 text-[#506158] ring-1 ring-[#DDE8E5]">
              {value}
            </span>
          ))
        ) : (
          <span className="text-sm text-[#8B9A93]">{emptyText}</span>
        )}
      </div>
    </section>
  );
}

function ConfirmationStep({
  formState,
  draftPreview,
  prompts,
  seedBlockers,
  confirmationDone,
  onConfirm
}: {
  formState: WizardState;
  draftPreview: CustomerFacingDraftPreview | null;
  prompts: EditablePrompt[];
  seedBlockers: string[];
  confirmationDone: boolean;
  onConfirm: () => void;
}) {
  const sections = buildConfirmationSections(formState, draftPreview);
  const promptCount = prompts.filter((prompt) => prompt.text.trim()).length;

  return (
    <WizardCard
      icon={<ClipboardCheck className="h-9 w-9" />}
      title="最終確認"
      description="確認内容をまとめました。この内容でよろしければ完了してください。"
      size="wide"
    >
      {seedBlockers.length > 0 ? (
        <MessageBox title="確認が必要な項目があります" tone="error">
          <ul className="space-y-1">
            {seedBlockers.map((blocker) => (
              <li key={blocker}>{translateSeedBlocker(blocker)}</li>
            ))}
          </ul>
        </MessageBox>
      ) : null}
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryStat label="測定対象" value={formState.brandName || "未入力"} />
        <SummaryStat label="市場" value={formatList(formState.regions)} />
        <SummaryStat label="顧客層" value={formatAudienceType(formState.audienceType)} />
        <SummaryStat label="プロンプト例" value={`${promptCount}件`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-3">
          {sections.map((section) => (
            <ConfirmationSection key={section.title} title={section.title} items={section.items} />
          ))}
        </div>
        <PromptSummaryList prompts={prompts} />
      </div>

      <Button type="button" className="mt-6 h-12 w-full bg-[#075E44] text-base hover:bg-[#064D39]" onClick={onConfirm}>
        この内容で確認を完了
        <CheckCircle2 className="h-5 w-5" />
      </Button>
      {confirmationDone ? (
        <p className="mt-3 text-center text-sm font-semibold text-[#075E44]">
          確認完了として画面上に反映しました。
        </p>
      ) : null}
      <p className="mt-3 text-center text-xs leading-5 text-[#7A8982]">
        この画面では保存・承認・計測反映は行いません。診断は次のステップで実行されます。
      </p>
    </WizardCard>
  );
}

function WizardCard({
  icon,
  title,
  description,
  footer,
  children,
  size = "default"
}: {
  icon: ReactNode;
  title: string;
  description: string;
  footer?: string;
  children: ReactNode;
  size?: "default" | "wide";
}) {
  return (
    <section
      className={cn(
        "mx-auto rounded-xl border border-[#E1E8E5] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5",
        size === "wide" ? "max-w-5xl" : "max-w-2xl"
      )}
    >
      <div className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F6F3] text-[#075E44] [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <h2 className="mt-2 text-lg font-bold tracking-normal text-[#0B1F17] sm:text-xl">{title}</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-[#64736C]">{description}</p>
      </div>
      <div className="mt-4">{children}</div>
      {footer ? (
        <div className="mt-4 rounded-xl border border-[#DDE8E5] bg-[#F8FBFA] px-4 py-3 text-sm leading-6 text-[#506158]">
          <div className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1B8B65]" />
            <p>{footer}</p>
          </div>
        </div>
      ) : null}
    </section>
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
        {required ? <RequiredBadge /> : null}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-[#DDE8E5] bg-white px-4 text-sm text-[#0B1F17] outline-none transition placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
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
        {required ? <RequiredBadge /> : null}
      </span>
      <textarea
        className="mt-2 w-full resize-y rounded-lg border border-[#DDE8E5] bg-white px-4 py-3 text-sm leading-6 text-[#0B1F17] outline-none transition placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectLikeInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  suggestions
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder: string;
  suggestions: readonly string[];
}) {
  return (
    <div>
      <TextInput label={label} value={value} onChange={onChange} required={required} placeholder={placeholder} />
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              value === suggestion
                ? "border-[#1B8B65] bg-[#F2FAF6] text-[#075E44]"
                : "border-[#DDE8E5] bg-white text-[#64736C] hover:border-[#A9C6BA]"
            )}
            onClick={() => onChange(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipInput({
  label,
  optional = false,
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  suggestions = [],
  emptyText = "未選択です。"
}: {
  label: string;
  optional?: boolean;
  items: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  suggestions?: readonly string[];
  emptyText?: string;
}) {
  function submitValue(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    onAdd(normalized);
    onInputChange("");
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-[#334155]">{label}</h3>
        {optional ? <span className="rounded-full bg-[#F1F5F3] px-2 py-0.5 text-xs font-semibold text-[#7A8982]">任意</span> : <RequiredBadge />}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full bg-[#F1F5F3] px-3 py-1 text-sm font-semibold text-[#334155]">
              <span className="min-w-0 break-words">{item}</span>
              <button
                type="button"
                className="rounded-full p-0.5 text-[#7A8982] hover:bg-white hover:text-rose-600"
                onClick={() => onRemove(item)}
                aria-label={`${item}を削除`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-sm text-[#8B9A93]">{emptyText}</span>
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
                  "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1 text-sm font-semibold transition",
                  selected
                    ? "border-[#1B8B65] bg-[#F2FAF6] text-[#075E44]"
                    : "border-[#DDE8E5] bg-white text-[#506158] hover:border-[#A9C6BA]"
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
      <InlineAddInput
        className="mt-3"
        value={inputValue}
        onChange={onInputChange}
        onAdd={submitValue}
        placeholder={placeholder}
        buttonLabel="追加"
      />
    </div>
  );
}

function InlineAddInput({
  value,
  onChange,
  onAdd,
  placeholder,
  buttonLabel,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: (value: string) => void;
  placeholder?: string;
  buttonLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <input
        className="h-11 min-w-0 flex-1 rounded-lg border border-[#DDE8E5] bg-white px-4 text-sm text-[#0B1F17] outline-none placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onAdd(value);
            onChange("");
          }
        }}
        placeholder={placeholder}
      />
      <Button
        type="button"
        variant="outline"
        className="border-[#C9D8D2] text-[#075E44]"
        onClick={() => {
          onAdd(value);
          onChange("");
        }}
      >
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
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
      <p className="text-sm font-bold text-[#334155]">
        {label}
        <RequiredBadge />
      </p>
      <div className="mt-2 grid grid-cols-2 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "min-h-10 rounded-md px-3 text-sm font-bold transition",
              value === option.value ? "bg-[#075E44] text-white shadow-sm" : "text-[#506158] hover:bg-white"
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

function ChoicePill({
  selected,
  label,
  description,
  onClick
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border px-3 py-2.5 text-left transition",
        selected ? "border-[#1B8B65] bg-[#F2FAF6] text-[#075E44]" : "border-[#DDE8E5] bg-white text-[#506158] hover:border-[#A9C6BA]"
      )}
      onClick={onClick}
    >
      <span className="block text-sm font-bold">{label}</span>
      <span className="mt-1 block text-xs leading-5">{description}</span>
    </button>
  );
}

function MiniToggle({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-10 rounded-lg border px-3 text-sm font-bold transition",
        selected ? "border-[#1B8B65] bg-[#075E44] text-white" : "border-[#DDE8E5] bg-white text-[#506158] hover:border-[#A9C6BA]"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function CheckCard({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm font-bold leading-6 transition",
        selected ? "border-[#1B8B65] bg-[#F2FAF6] text-[#075E44]" : "border-[#E1E8E5] bg-white text-[#20352C] hover:border-[#A9C6BA]"
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-[#075E44] bg-[#075E44] text-white" : "border-[#C9D8D2] bg-white text-transparent"
        )}
      >
        <Check className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </button>
  );
}

function PromptListItem({
  index,
  prompt,
  onChange,
  onRemove
}: {
  index: number;
  prompt: EditablePrompt;
  onChange: (prompt: EditablePrompt) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border-b border-[#E8EFEC] p-3.5 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#075E44] text-xs font-bold text-white">
            {index + 1}
          </span>
          <label className="min-w-0 flex-1">
            <span className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-[#D6E2DD] bg-[#F8FBFA] text-[#64736C]">
                {getPromptGroupLabel(prompt.group)}
              </Badge>
              <span className="text-xs font-semibold text-[#7A8982]">直接編集できます</span>
            </span>
            <textarea
              className="min-h-24 w-full resize-y rounded-lg border border-transparent bg-[#F8FBFA] px-3 py-3 text-sm leading-6 text-[#0B1F17] outline-none transition focus:border-[#1B8B65] focus:bg-white focus:ring-2 focus:ring-[#1B8B65]/15"
              rows={3}
              value={prompt.text}
              onChange={(event) => onChange({ ...prompt, text: event.target.value })}
              aria-label={`プロンプト例 ${index + 1}`}
            />
          </label>
        </div>
        <button
          type="button"
          className="w-full shrink-0 rounded-lg border border-[#E1E8E5] px-3 py-2 text-xs font-bold text-[#7A8982] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:w-auto"
          onClick={onRemove}
          aria-label={`プロンプト例 ${index + 1}を削除`}
        >
          削除
        </button>
      </div>
    </div>
  );
}

function EmptyPromptState() {
  return (
    <div className="p-5 text-sm leading-6 text-[#64736C]">
      表示できるプロンプト例がありません。右側の欄から確認したい質問を追加できます。
    </div>
  );
}

function MessageBox({
  title,
  tone,
  children
}: {
  title: string;
  tone: "info" | "error";
  children: ReactNode;
}) {
  const isError = tone === "error";
  return (
    <div
      className={cn(
        "mx-auto mt-5 max-w-xl rounded-xl border px-4 py-3 text-sm leading-6",
        isError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#CFE2DA] bg-[#F2FAF6] text-[#506158]"
      )}
    >
      <strong className={cn("block", isError ? "text-rose-800" : "text-[#075E44]")}>{title}</strong>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function RequiredBadge() {
  return <span className="ml-2 rounded-full bg-[#F1F5F3] px-2 py-0.5 text-xs font-semibold text-[#64736C]">必須</span>;
}

async function inspectOfficialUrlForStep(state: WizardState): Promise<SiteInspectionState> {
  try {
    const response = await fetch("/api/recora/site-inspect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: state.officialUrl,
        brandName: state.brandName,
        aliases: state.brandAliases
      })
    });
    const data = (await response.json()) as SiteInspectionApiResponse;
    if (data.ok) {
      return { status: "success", result: data.result };
    }
    return {
      status: "failed",
      message: data.error,
      code: data.code,
      warnings: data.warnings
    };
  } catch {
    return {
      status: "failed",
      message: "公式URLのページ情報を確認できませんでした。",
      warnings: ["site_inspection_failed"]
    };
  }
}

function applyServiceSuggestions(
  state: WizardState,
  sources: AutoSuggestionSources,
  sourceKey: string,
  inspection: SiteInspectionResult | null = null
): { state: WizardState; sources: AutoSuggestionSources } {
  const proposedServiceDescription = buildSuggestedServiceDescriptionForStep(state, inspection);
  const proposedServiceCategory = buildSuggestedServiceCategoryForStep(state, inspection, proposedServiceDescription);
  const proposedAudienceTargets = inferAudienceTargetsForStep(state, proposedServiceCategory);

  const shouldReplaceServiceDescription = !state.serviceDescription.trim() || sources.serviceDescription !== null;
  const shouldReplaceServiceCategory = !state.serviceCategory.trim() || sources.serviceCategory !== null;
  const shouldReplaceAudienceTargets = state.audienceTargets.length === 0 || sources.audienceTargets !== null;

  return {
    state: {
      ...state,
      serviceDescription: shouldReplaceServiceDescription ? proposedServiceDescription : state.serviceDescription,
      serviceCategory: shouldReplaceServiceCategory ? proposedServiceCategory : state.serviceCategory,
      audienceTargets: shouldReplaceAudienceTargets ? proposedAudienceTargets : state.audienceTargets
    },
    sources: {
      serviceDescription: shouldReplaceServiceDescription ? sourceKey : sources.serviceDescription,
      serviceCategory: shouldReplaceServiceCategory ? sourceKey : sources.serviceCategory,
      audienceTargets: shouldReplaceAudienceTargets ? sourceKey : sources.audienceTargets
    }
  };
}

function buildCustomerFacingDraftPreview(seedInput: ProjectSetupSeedInput, formState: WizardState): CustomerFacingDraftPreview {
  const result = generateProjectSetupDraft(seedInput);
  const brandIdentity = buildBrandIdentity(seedInput);
  const profile = deriveOnboardingSuggestionProfile(formState);
  const generated = result.draft.prompts.slice(0, 5).map((prompt) => ({
    id: prompt.promptId,
    text: normalizeCustomerPromptExampleText(prompt.text),
    group: classifyGeneratedPrompt(prompt, derivePromptMetricEligibility(prompt, brandIdentity))
  }));
  const customerReadyGenerated = filterPromptsForSuggestionProfile(generated, profile);
  const fallback = buildFallbackPrompts(formState);
  const prompts = uniquePrompts(customerReadyGenerated.length > 0 ? customerReadyGenerated : fallback).slice(0, 5);
  const serviceCategories = uniqueStrings([seedInput.industryCategory, formState.serviceCategory, ...profile.serviceCategories]).slice(0, 3);
  const audienceTargets = buildCustomerPersonas(formState, result.draft.personas, profile).map((persona) => persona.label);
  const generatedQuestionAreas = result.draft.topics.map((topic) => buildCustomerFacingQuestionArea(topic.topicName, topic.diagnosisGoal));
  const questionAreas = uniqueStrings([
    ...generatedQuestionAreas,
    ...profile.questionAreaFallbacks
  ]).slice(0, 6);

  return {
    serviceCategories,
    audienceTargets,
    questionAreas,
    prompts
  };
}

function buildFallbackPrompts(formState: WizardState): EditablePrompt[] {
  const profile = deriveOnboardingSuggestionProfile(formState);
  return profile.promptFallbacks.map((prompt, index) => ({
    id: "fallback-" + profile.key + "-" + index,
    text: prompt.text,
    group: prompt.group
  }));
}

function filterPromptsForSuggestionProfile(prompts: EditablePrompt[], profile: OnboardingSuggestionProfile): EditablePrompt[] {
  if (!isConsumerSuggestionProfile(profile.key)) return prompts;

  return prompts.filter((prompt) => !containsBusinessAdoptionLanguage(prompt.text));
}

function isConsumerSuggestionProfile(profileKey: OnboardingSuggestionProfileKey) {
  return ["b2cSchoolEducation", "healthcareClinic", "localService", "ecommerceProduct", "genericB2C"].includes(profileKey);
}

function reconcileAudienceTargetsForProfile(state: WizardState, preserveCompatibleExisting: boolean) {
  const profile = deriveOnboardingSuggestionProfile(state);
  const existing = preserveCompatibleExisting
    ? state.audienceTargets
        .map((label) => normalizeCustomerPersonaLabel(label, profile))
        .filter((label) => isCustomerPersonaCompatibleWithProfile(label, profile))
    : [];
  return uniqueStrings([...existing, ...profile.audienceTargets]).slice(0, existing.length > 0 ? 5 : 3);
}

function buildCustomerPersonas(
  formState: WizardState,
  generatedPersonas: readonly PersonaDraft[],
  profile: OnboardingSuggestionProfile
): CustomerPersona[] {
  const sourceKey = buildCustomerPersonaSourceKey(formState);
  const selected = formState.audienceTargets
    .map((label, index) => buildCustomerPersona(label, profile, "selected", `${sourceKey}-selected-${index}`))
    .filter((persona): persona is CustomerPersona => persona !== null);
  const generated = generatedPersonas
    .map((persona, index) => buildCustomerPersona(buildCustomerPersonaLabel(persona, profile), profile, "generated", `${sourceKey}-generated-${index}`))
    .filter((persona): persona is CustomerPersona => persona !== null);
  const fallback = profile.audienceTargets
    .map((label, index) => buildCustomerPersona(label, profile, "fallback", `${sourceKey}-fallback-${index}`))
    .filter((persona): persona is CustomerPersona => persona !== null);

  const personas: CustomerPersona[] = [];
  for (const persona of [...selected, ...generated, ...fallback]) {
    if (personas.some((current) => normalizeText(current.label) === normalizeText(persona.label))) continue;
    personas.push(persona);
  }
  return personas.slice(0, 5);
}

function buildCustomerPersona(
  label: string,
  profile: OnboardingSuggestionProfile,
  source: CustomerPersonaSource,
  id: string
): CustomerPersona | null {
  const normalized = normalizeCustomerPersonaLabel(label, profile);
  if (!isCustomerPersonaCompatibleWithProfile(normalized, profile)) return null;
  return {
    id,
    label: normalized,
    description: buildCustomerPersonaDescription(normalized, profile),
    source
  };
}

function buildCustomerPersonaDescription(label: string, profile: OnboardingSuggestionProfile) {
  if (profile.key === "b2bSaasOrSeo") return `${label}の比較・導入判断で見られやすい論点を確認します。`;
  if (profile.key === "b2bProfessionalService") return `${label}が相談前に確認しやすい論点を確認します。`;
  if (profile.key === "ecommerceProduct") return `${label}が購入前に確認しやすい論点を確認します。`;
  if (profile.key === "healthcareClinic") return `${label}が相談前に確認しやすい論点を確認します。`;
  if (profile.key === "b2cSchoolEducation") return `${label}が申し込み前に確認しやすい論点を確認します。`;
  if (profile.key === "localService") return `${label}が来店・予約前に確認しやすい論点を確認します。`;
  return `${label}が比較前に確認しやすい論点を確認します。`;
}

function buildCustomerPersonaSourceKey(formState: WizardState) {
  return JSON.stringify({
    brandName: formState.brandName,
    serviceDescription: formState.serviceDescription,
    serviceCategory: formState.serviceCategory,
    audienceType: formState.audienceType,
    audienceTargets: formState.audienceTargets,
    regions: formState.regions,
    language: formState.language,
    watchTopics: formState.watchTopics,
    reportGoals: formState.reportGoals,
    competitorMode: formState.competitorMode,
    competitors: formState.competitors
  });
}

function isCustomerPersonaCompatibleWithProfile(label: string, profile: OnboardingSuggestionProfile) {
  const normalized = normalizeCustomerPersonaLabel(label, profile);
  if (!isNaturalCustomerPersonaLabel(normalized, profile)) return false;
  if (profile.audienceTargets.some((target) => normalizeText(target) === normalizeText(normalized))) return true;

  if (isConsumerSuggestionProfile(profile.key)) return !containsB2BPersonaLanguage(normalized);
  if (profile.key === "b2bSaasOrSeo" || profile.key === "b2bProfessionalService" || profile.key === "genericB2B") {
    return !containsConsumerPersonaLanguage(normalized);
  }
  return true;
}

function containsB2BPersonaLanguage(value: string) {
  return matchesAnyText(value, [
    "BtoB",
    "SaaS",
    "SEO担当者",
    "マーケティング責任者",
    "導入を判断する責任者",
    "比較検討する担当者",
    "実際に利用する担当者",
    "Web担当者",
    "事業責任者",
    "経営者",
    "役員",
    "社内承認",
    "稟議",
    "セキュリティ",
    "運用負荷",
    "既存ツール",
    "システム連携"
  ]);
}

function containsConsumerPersonaLanguage(value: string) {
  return matchesAnyText(value, [
    "初めて選ぶ人",
    "初めて相談する人",
    "料金を比較する人",
    "料金を確認したい人",
    "価格を比較する人",
    "口コミを重視する人",
    "品質を確認したい人",
    "返品条件を確認したい人",
    "自分に合うか確認したい人",
    "通いやすさを重視する人",
    "家族に合うか確認したい人",
    "資格や専門性を確認したい人",
    "リスク説明を確認したい人"
  ]);
}

function containsBusinessAdoptionLanguage(value: string) {
  return matchesAnyText(value, [
    "SaaS",
    "??",
    "????",
    "??",
    "??????",
    "?????",
    "????",
    "?????",
    "??????",
    "????",
    "BtoB"
  ]);
}

function buildCustomerFacingQuestionArea(topicName: string, diagnosisGoal: string) {
  const name = topicName.trim();
  const goal = diagnosisGoal.trim();
  if (!name) return goal;
  if (!goal || normalizeText(name) === normalizeText(goal)) return name;
  return `${name}: ${goal}`;
}

function normalizeCustomerPromptExampleText(text: string) {
  return text
    .replace(/^BtoB。主な検討者: [^。]+。の導入判断者の立場で、/, "導入を判断する立場で、")
    .replace(/^BtoB。主な検討者: [^。]+。の比較評価担当者の立場で、/, "比較検討する立場で、")
    .replace(/^BtoB。主な検討者: [^。]+。の現場利用者の立場で、/, "実際に利用する立場で、")
    .replace(/^BtoC(?: \/ EC)?。主な検討者: [^。]+。の[^。、]+の立場で、/, "利用者の立場で、")
    .replace(/BtoB \/ ([^、。\n]+)の導入判断者/g, "$1を導入判断する人")
    .replace(/BtoB \/ ([^、。\n]+)の比較評価担当者/g, "$1を比較検討する人")
    .replace(/BtoB \/ ([^、。\n]+)の現場利用者/g, "$1を実際に利用する人");
}

function buildCustomerPersonaLabel(persona: PersonaDraft, profile: OnboardingSuggestionProfile) {
  const displayName = normalizeCustomerPersonaLabel(persona.displayName, profile);
  if (isNaturalCustomerPersonaLabel(displayName, profile)) return displayName;

  const sourceText = [
    persona.displayName,
    persona.segment,
    persona.detailedDecisionRole,
    persona.roleType,
    persona.buyerStage,
    persona.promptAngle,
    ...persona.jobs,
    ...persona.painPoints,
    ...persona.comparisonAxis
  ].join(" ");
  const selected = selectPersonaLabelFromCombinedText(sourceText, profile);
  return selected ?? profile.audienceTargets[0] ?? "比較検討する担当者";
}

function normalizeCustomerPersonaLabel(label: string, profile: OnboardingSuggestionProfile) {
  const normalized = label
    .trim()
    .replace(/^BtoB\s*\/\s*/i, "")
    .replace(/^BtoC\s*\/\s*/i, "")
    .replace(/の導入判断者$/, "")
    .replace(/の比較評価担当者$/, "")
    .replace(/の現場利用者$/, "")
    .replace(/の決裁者$/, "")
    .replace(/の購買担当者$/, "")
    .replace(/の利用者$/, "")
    .replace(/の検討者$/, "")
    .replace(/の相談者$/, "")
    .replace(/の購入者$/, "")
    .replace(/の継続・返品条件確認者$/, "")
    .trim();

  if (isNaturalCustomerPersonaLabel(normalized, profile)) return normalized;
  return selectPersonaLabelFromCombinedText(label, profile) ?? normalized;
}

function isNaturalCustomerPersonaLabel(label: string, profile: OnboardingSuggestionProfile) {
  if (!label) return false;
  if (containsRawPersonaLanguage(label)) return false;
  if (label.length > 26) return false;
  if (label.includes("、") || label.includes("\n")) return false;
  return profile.audienceTargets.includes(label) || !label.includes(" / ");
}

function containsRawPersonaLanguage(value: string) {
  return matchesAnyText(value, [
    "BtoB /",
    "BtoC /",
    "decision_maker",
    "evaluator",
    "end_user",
    "roleType",
    "personaId",
    "導入判断者",
    "比較評価担当者",
    "現場利用者"
  ]);
}

function selectPersonaLabelFromCombinedText(text: string, profile: OnboardingSuggestionProfile) {
  const normalized = normalizeText(text);
  const matched = profile.audienceTargets.find((target) => normalized.includes(normalizeText(target)));
  if (matched) return matched;

  if (isConsumerSuggestionProfile(profile.key)) return selectConsumerPersonaLabel(normalized, profile);
  if (matchesAnyText(normalized, ["seo"])) return "SEO担当者";
  if (matchesAnyText(normalized, ["marketing", "マーケティング"])) return "マーケティング責任者";
  if (matchesAnyText(normalized, ["導入", "決裁", "責任者", "decision"])) return "導入を判断する責任者";
  if (matchesAnyText(normalized, ["比較", "評価", "検討", "evaluator"])) return "比較検討する担当者";
  if (matchesAnyText(normalized, ["利用", "user"])) return "実際に利用する担当者";
  return profile.audienceTargets[0] ?? "比較検討する担当者";
}

function selectConsumerPersonaLabel(text: string, profile: OnboardingSuggestionProfile) {
  if (profile.key === "healthcareClinic") {
    if (matchesAnyText(text, ["資格", "専門性", "医師", "安全", "リスク"])) return "資格や専門性を確認したい人";
    if (matchesAnyText(text, ["料金", "費用", "価格"])) return "料金を確認したい人";
    if (matchesAnyText(text, ["口コミ", "評判", "レビュー"])) return "口コミを重視する人";
    return "初めて相談する人";
  }

  if (profile.key === "ecommerceProduct") {
    if (matchesAnyText(text, ["返品", "交換", "継続"])) return "返品条件を確認したい人";
    if (matchesAnyText(text, ["品質", "素材", "スペック"])) return "品質を確認したい人";
    if (matchesAnyText(text, ["口コミ", "評判", "レビュー"])) return "口コミを重視する人";
    if (matchesAnyText(text, ["料金", "費用", "価格"])) return "価格を比較する人";
    return "自分に合うか確認したい人";
  }

  if (matchesAnyText(text, ["口コミ", "評判", "レビュー"])) return "口コミを重視する人";
  if (matchesAnyText(text, ["料金", "費用", "価格"])) return "料金を比較する人";
  if (matchesAnyText(text, ["家族", "子ども", "親"])) return "家族に合うか確認したい人";
  return profile.audienceTargets[0] ?? "初めて選ぶ人";
}

function buildNaturalTargetCustomers(formState: WizardState) {
  const profile = deriveOnboardingSuggestionProfile(formState);
  const personas = buildCustomerPersonas(formState, [], profile).map((persona) => persona.label).slice(0, 4);
  const personaText = personas.length > 0 ? personas.join("、") : "確認したい顧客層";
  const category = formState.serviceCategory.trim() || profile.serviceCategories[0] || "サービス";

  if (formState.audienceType === "b2c") {
    if (profile.key === "ecommerceProduct") return `BtoC / EC。主な検討者: ${personaText}。`;
    return `BtoC。主な検討者: ${personaText}。`;
  }
  if (formState.audienceType === "both_or_confirm") {
    return `${category}の主な検討者: ${personaText}。BtoB/BtoCは確認中。`;
  }
  return `BtoB。主な検討者: ${personaText}。`;
}

function buildSeedInput(formState: WizardState): ProjectSetupSeedInput {
  return {
    companyName: formState.brandName.trim(),
    brandName: formState.brandName.trim(),
    officialSiteUrl: normalizeTargetUrlForSeed(formState.officialUrl),
    productOrServiceDescription: [
      formState.serviceDescription.trim(),
      formState.watchTopics.length ? `見たいこと: ${formState.watchTopics.join("、")}` : "",
      formatReportGoalLabels(formState).length ? `今回知りたいこと: ${formatReportGoalLabels(formState).join("、")}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    industryCategory: formState.serviceCategory.trim(),
    targetCustomers: buildNaturalTargetCustomers(formState),
    regions: formState.regions,
    language: formState.language,
    serviceName: formState.brandName.trim() || undefined,
    brandAliases: formState.brandAliases,
    knownCompetitors: formState.competitorMode === "known_competitors_confirmed" ? formState.competitors : [],
    strengths: [],
    knownRisks: [],
    diagnosisGoals: mapReportGoalsToPromptIntents(formState.reportGoals)
  };
}

function buildConfirmationSections(formState: WizardState, draftPreview: CustomerFacingDraftPreview | null) {
  return [
    {
      title: "ブランド確認",
      items: [
        { label: "ブランド名", value: formState.brandName || "未入力" },
        { label: "公式URL", value: formState.officialUrl || "未入力" },
        { label: "別名", value: formState.brandAliases.length ? formatList(formState.brandAliases) : "別名なし" }
      ]
    },
    {
      title: "サービスカテゴリ",
      items: [
        { label: "概要", value: formState.serviceDescription || "未入力" },
        { label: "カテゴリ", value: formatList(draftPreview?.serviceCategories ?? [formState.serviceCategory].filter(Boolean)) }
      ]
    },
    {
      title: "対象市場",
      items: [
        { label: "地域", value: formatList(formState.regions) },
        { label: "言語", value: formatLanguage(formState.language) },
        { label: "顧客層", value: formatAudienceType(formState.audienceType) }
      ]
    },
    {
      title: "ペルソナ",
      items: [{ label: "確認対象", value: formatList(draftPreview?.audienceTargets ?? formState.audienceTargets) }]
    },
    {
      title: "競合",
      items: [
        {
          label: "扱い",
          value:
            formState.competitorMode === "competitor_discovery_needed"
              ? "Recoraで候補抽出"
              : formatList(formState.competitors)
        }
      ]
    },
    {
      title: "質問領域",
      items: [
        { label: "重点論点", value: formatList(formState.watchTopics) },
        { label: "確認領域", value: formatList(draftPreview?.questionAreas ?? formState.watchTopics) },
        { label: "レポート目的", value: formatList(formatReportGoalLabels(formState)) }
      ]
    }
  ];
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#E1E8E5] bg-[#F8FBFA] p-3">
      <div className="text-xs font-bold uppercase tracking-normal text-[#64736C]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[#0B1F17]">{value}</div>
    </section>
  );
}

function ConfirmationSection({
  title,
  items
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-xl border border-[#E1E8E5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <h3 className="text-sm font-bold text-[#0B1F17]">{title}</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs font-bold text-[#64736C]">{item.label}</dt>
            <dd className="mt-1 break-words text-sm leading-6 text-[#0B1F17]">{item.value || "未入力"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PromptSummaryList({ prompts }: { prompts: EditablePrompt[] }) {
  const visiblePrompts = prompts.filter((prompt) => prompt.text.trim());

  return (
    <section className="h-fit rounded-xl border border-[#DDE8E5] bg-[#FBFDFC] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#0B1F17]">プロンプト例</h3>
        <span className="text-xs font-semibold text-[#64736C]">{visiblePrompts.length}件</span>
      </div>
      {visiblePrompts.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {visiblePrompts.map((prompt, index) => (
            <li key={`${prompt.id}-${index}`} className="rounded-lg border border-[#E1E8E5] bg-white p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#075E44] text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-[#64736C]">{getPromptGroupLabel(prompt.group)}</span>
              </div>
              <p className="break-words text-sm leading-6 text-[#0B1F17]">{prompt.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#64736C]">未入力</p>
      )}
    </section>
  );
}

function isCustomPrompt(prompt: EditablePrompt) {
  return prompt.id.startsWith("custom-");
}

function getPromptGroupLabel(group: PromptGroup) {
  return formatPromptGroup(group);
}

function getStepBlockers(stepIndex: number, formState: WizardState) {
  const blockers: string[] = [];
  if (stepIndex === 0) {
    if (!formState.brandName.trim()) blockers.push("正式なブランド名 / サービス名を入力してください。");
    if (!formState.officialUrl.trim()) blockers.push("公式URLを入力してください。");
    const normalizedUrl = normalizeTargetUrlForSeed(formState.officialUrl);
    if (normalizedUrl && !isLikelyHttpUrl(normalizedUrl)) blockers.push("公式URLはURLとして扱える形式で入力してください。");
  }

  if (stepIndex === 1) {
    if (!formState.serviceDescription.trim()) blockers.push("どんなサービスかを入力してください。");
    if (!formState.serviceCategory.trim()) blockers.push("サービスカテゴリを入力してください。");
    if (formState.regions.length === 0) blockers.push("対象市場・地域を1件以上入力してください。");
    if (formState.audienceTargets.length === 0) blockers.push("ペルソナを1件以上入力してください。");
    if (formState.competitorMode === "known_competitors_confirmed" && formState.competitors.length === 0) {
      blockers.push("競合を入力する場合は、競合を1件以上入力してください。");
    }
  }

  if (stepIndex === 2) {
    if (formState.watchTopics.length === 0) blockers.push("特に見たいことを1件以上選んでください。");
    if (formState.reportGoals.length === 0) blockers.push("今回知りたいことを1件以上選んでください。");
    if (formState.reportGoals.includes("other") && !formState.reportGoalInput.trim()) {
      blockers.push("その他の内容を入力してください。");
    }
  }

  return blockers;
}

function buildSuggestedServiceDescriptionForStep(state: WizardState, inspection: SiteInspectionResult | null) {
  const inspectedDescription = inspection?.suggestedServiceDescription?.trim();
  if (inspectedDescription) return inspectedDescription;
  const metadataDescription = inspection ? [inspection.description, inspection.h1, inspection.title].find((value) => value?.trim()) : null;
  if (metadataDescription) return metadataDescription.trim();

  const brandName = state.brandName.trim() || "対象サービス";
  const hostname = extractHostname(normalizeTargetUrlForSeed(state.officialUrl));
  return hostname
    ? `${brandName}（${hostname}）のサービス内容をもとに、AI検索での見え方を確認するための測定対象です。`
    : `${brandName}のサービス内容をもとに、AI検索での見え方を確認するための測定対象です。`;
}

function buildSuggestedServiceCategoryForStep(
  state: WizardState,
  inspection: SiteInspectionResult | null,
  serviceDescription: string
) {
  const inspectedCategory = inspection?.suggestedCategory?.trim();
  if (inspectedCategory && inspectedCategory !== "その他") return inspectedCategory;
  return inferInterimCategory(state, inspection, serviceDescription);
}

function inferAudienceTargetsForStep(state: WizardState, serviceCategory: string) {
  return deriveOnboardingSuggestionProfile({ ...state, serviceCategory }).audienceTargets.slice(0, 3);
}

function inferInterimCategory(
  formState: WizardState,
  inspection: SiteInspectionResult | null = null,
  serviceDescription = formState.serviceDescription
) {
  const text = normalizeText(
    [
      formState.brandName,
      formState.brandAliases.join(" "),
      formState.officialUrl,
      serviceDescription,
      inspection?.title,
      inspection?.description,
      inspection?.siteName,
      inspection?.h1,
      inspection?.hostname
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (matchesAnyText(text, ["英会話", "スクール", "学校", "教育", "講座", "school", "lesson", "english"])) return "スクール / 教育";
  if (matchesAnyText(text, ["clinic", "クリニック", "医療", "美容", "病院"])) return "クリニック / 医療";
  if (matchesAnyText(text, ["EC /", "D2C", "通販", "商品", "shop", "store", "ecommerce", "e-commerce", "返品"])) return "EC / 商品";
  if (matchesAnyText(text, ["AI検索", "LLMO", "GEO", "AIO", "AI search", "SEO", "Mieruca", "ミエルカ"])) {
    return "SEO / AI検索対策";
  }
  if (matchesAnyText(text, ["マーケティング", "広告", "コンテンツ", "集客"])) return "マーケティング / SEO";
  if (matchesAnyText(text, ["採用", "HR", "人事", "recruit", "求人"])) return "採用 / HR";
  if (matchesAnyText(text, ["英会話", "スクール", "学校", "教育", "講座", "school", "lesson", "english"])) {
    return "スクール / 教育";
  }
  if (matchesAnyText(text, ["clinic", "クリニック", "医療", "病院"])) return "クリニック / 医療";
  if (matchesAnyText(text, ["EC", "通販", "商品", "shop", "store", "ecommerce"])) return "EC / 商品";
  if (matchesAnyText(text, ["地域", "店舗", "予約", "来店", "local", "エリア"])) return "地域サービス";
  if (matchesAnyText(text, ["SaaS", "分析", "analytics", "dashboard", "ツール", "platform"])) return "SaaS / 分析ツール";
  return "その他";
}

function deriveOnboardingSuggestionProfile(state: Pick<WizardState, "brandName" | "brandAliases" | "officialUrl" | "serviceDescription" | "serviceCategory" | "audienceType" | "audienceTargets">): OnboardingSuggestionProfile {
  const text = normalizeText(
    [state.brandName, state.brandAliases.join(" "), state.serviceDescription, state.serviceCategory, state.audienceType]
      .filter(Boolean)
      .join(" ")
  );

  if (matchesAnyText(text, ["英会話", "スクール", "教育", "学校", "講座", "school", "lesson", "english"])) return suggestionProfiles.b2cSchoolEducation;
  if (matchesAnyText(text, ["クリニック", "医療", "美容", "病院", "clinic", "medical"])) return suggestionProfiles.healthcareClinic;
  if (matchesAnyText(text, ["地域", "店舗", "予約", "来店", "local", "エリア", "近く"])) return suggestionProfiles.localService;
  if (matchesAnyText(text, ["EC", "通販", "商品", "shop", "store", "ecommerce", "返品"])) return suggestionProfiles.ecommerceProduct;
  if (matchesAnyText(text, ["士業", "法律", "会計", "コンサル", "専門サービス", "相談", "professional"])) return suggestionProfiles.b2bProfessionalService;
  if (matchesAnyText(text, ["AI検索", "LLMO", "GEO", "AIO", "AI search", "SEO", "Mieruca", "ミエルカ", "マーケティング", "SaaS", "分析ツール"])) return suggestionProfiles.b2bSaasOrSeo;
  if (state.audienceType === "b2c") return suggestionProfiles.genericB2C;
  return suggestionProfiles.genericB2B;
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

function classifyGeneratedPrompt(prompt: PromptDraft, eligibility: PromptMetricEligibility): PromptGroup {
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

function classifyPromptText(text: string, formState: WizardState): PromptGroup {
  const normalized = normalizeText(text);
  const brandSignals = [formState.brandName, ...formState.brandAliases].map(normalizeText).filter(Boolean);
  if (brandSignals.some((signal) => normalized.includes(signal))) return "brand";
  if (normalized.includes("引用") || normalized.includes("根拠") || normalized.includes("参照")) return "citation";
  if (normalized.includes("候補") || normalized.includes("比較") || normalized.includes("おすすめ")) return "candidate";
  return "review";
}

function formatPromptGroup(group: PromptGroup) {
  if (group === "candidate") return "候補・比較";
  if (group === "brand") return "ブランド確認";
  if (group === "citation") return "引用状況";
  return "確認用";
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

function formatAudienceType(value: AudienceType) {
  if (value === "b2b") return "BtoB";
  if (value === "b2c") return "BtoC";
  return "両方 / 確認したい";
}

function formatLanguage(value: "ja" | "en") {
  return value === "ja" ? "日本語" : "英語";
}

function formatReportGoalLabels(formState: WizardState) {
  const options = deriveOnboardingSuggestionProfile(formState).reportGoalOptions;
  return formState.reportGoals.map((goal) => {
    if (goal === "other") return formState.reportGoalInput.trim() || "その他";
    return options.find((option) => option.value === goal)?.label ?? defaultReportGoalOptions.find((option) => option.value === goal)?.label ?? goal;
  });
}

function translateSeedBlocker(value: string) {
  const map: Record<string, string> = {
    "seedInput.companyName is required": "ブランド名を確認してください。",
    "seedInput.brandName is required": "ブランド名を確認してください。",
    "seedInput.officialSiteUrl is required": "公式URLを確認してください。",
    "seedInput.productOrServiceDescription is required": "サービス説明を確認してください。",
    "seedInput.industryCategory is required": "サービスカテゴリを確認してください。",
    "seedInput.targetCustomers is required": "ペルソナを確認してください。",
    "seedInput.regions must include at least one region": "対象市場・地域を確認してください。",
    "seedInput.language is required": "言語を確認してください。",
    "seedInput.officialSiteUrl must be an http or https URL": "公式URLの形式を確認してください。"
  };
  return map[value] ?? "Recora側で確認が必要な項目があります。";
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

function uniquePrompts(prompts: readonly EditablePrompt[]) {
  const seen = new Set<string>();
  const result: EditablePrompt[] = [];
  for (const prompt of prompts) {
    const key = normalizeText(prompt.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(prompt);
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

function stableStep1SourceKey(formState: WizardState) {
  return JSON.stringify({
    brandName: normalizeText(formState.brandName),
    brandAliases: formState.brandAliases.map(normalizeText),
    officialUrl: normalizeTargetUrlForSeed(formState.officialUrl)
  });
}

function matchesAnyText(text: string, candidates: readonly string[]) {
  return candidates.some((candidate) => text.includes(normalizeText(candidate)));
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
    diagnosisGoals: seedInput.diagnosisGoals
  });
}
