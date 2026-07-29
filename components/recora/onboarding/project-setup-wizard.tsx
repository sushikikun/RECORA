"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Package,
  Plus,
  SearchCheck,
  Sparkles,
  Store,
  Tag,
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
import {
  analysisTargetTypes,
  buildAnalysisTargetDraft,
  getAnalysisTargetLabel,
  getAnalysisTargetUiContract,
  toLegacyProjectSetupTargetSeed,
  validateAnalysisTargetInput
} from "@/lib/recora/onboarding-analysis-target";
import type {
  AnalysisTargetDraft,
  AnalysisTargetFormInput,
  AnalysisTargetType,
  ProductTargetScope
} from "@/lib/recora/onboarding-analysis-target";
import type {
  SiteInspectionApiResponse,
  SiteInspectionResult,
  SiteInspectionWarning
} from "@/lib/recora/site-inspection-types";
import { cn } from "@/lib/utils";

const steps = [
  { title: "分析対象", short: "分析対象", icon: BadgeCheck },
  { title: "計測設定", short: "計測設定", icon: Wand2 },
  { title: "確認したいこと", short: "確認したいこと", icon: Target },
  { title: "質問", short: "質問", icon: MessageSquareText },
  { title: "確認", short: "確認", icon: ClipboardCheck }
] as const;

type AudienceType = "b2b" | "b2c" | "both_or_confirm";
type ReportGoal = "visibility" | "citation" | "brand" | "improvement" | "other";
type PromptGroup = "candidate" | "brand" | "citation" | "review";
type AiModel = "chatgpt" | "gemini" | "perplexity" | "claude";
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
  targetType: AnalysisTargetType | null;
  targetName: string;
  targetAliases: string[];
  targetAliasInput: string;
  officialUrl: string;
  mainBusiness: string;
  organizationName: string;
  productScope: ProductTargetScope;
  deliveryFormat: string;
  storeLocation: string;
  targetDescription: string;
  targetCategory: string;
  audienceType: AudienceType;
  audienceTargets: string[];
  regions: string[];
  regionInput: string;
  language: "ja" | "en";
  aiModels: AiModel[];
  watchTopics: string[];
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
  audiencePersonas: CustomerPersona[];
  questionAreas: string[];
  prompts: EditablePrompt[];
};

type OnboardingCategoryProfile =
  | "b2b_saas_or_seo"
  | "b2b_professional_service"
  | "b2c_school_education"
  | "healthcare_clinic"
  | "local_service"
  | "ecommerce_product"
  | "generic_b2c"
  | "generic_b2b";

type OnboardingPersonaDecisionRole =
  | "decision_owner"
  | "evaluator"
  | "practical_user"
  | "first_time_buyer"
  | "price_checker"
  | "review_checker"
  | "quality_checker"
  | "risk_checker";

type CustomerPersonaSource = "service_insight" | "selected" | "generator" | "profile_fallback";

type OnboardingServiceInsight = {
  brandName: string;
  serviceName: string;
  serviceSummary: string;
  categoryHypothesis: string;
  audienceType: AudienceType;
  market: string[];
  language: "ja" | "en";
  valueProposition: string[];
  primaryUseCases: string[];
  buyerContext: string[];
  decisionComplexity: "low" | "medium" | "high";
  trustRequirements: string[];
  likelyObjections: string[];
  evidenceSignals: string[];
  sourceEvidence: {
    fromUrlTitle?: string;
    fromUrlDescription?: string;
    fromH1?: string;
    fromUserServiceDescription?: string;
    fromSelectedFocus?: string[];
  };
  uncertaintyFlags: string[];
};

type OnboardingPersonaFrame = {
  id: string;
  label: string;
  description: string;
  audienceType: AudienceType;
  categoryProfile: OnboardingCategoryProfile;
  decisionRole: OnboardingPersonaDecisionRole;
  buyerStage: string;
  triggerSituation: string;
  evaluationCriteria: string[];
  proofNeeded: string[];
  riskConcern: string[];
  promptAngle: string;
  serviceEvidenceReason: string;
  source: CustomerPersonaSource;
};

type CustomerPersona = OnboardingPersonaFrame;

type SiteInspectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SiteInspectionResult }
  | { status: "failed"; message: string; code?: string; warnings?: SiteInspectionWarning[] };

type AutoSuggestionSources = {
  targetDescription: string | null;
  targetCategory: string | null;
  audienceTargets: string | null;
};

type UpdateForm = <K extends keyof WizardState>(field: K, value: WizardState[K]) => void;

const initialAutoSuggestionSources: AutoSuggestionSources = {
  targetDescription: null,
  targetCategory: null,
  audienceTargets: null
};

const initialFormState: WizardState = {
  targetType: null,
  targetName: "",
  targetAliases: [],
  targetAliasInput: "",
  officialUrl: "",
  mainBusiness: "",
  organizationName: "",
  productScope: "single_product",
  deliveryFormat: "",
  storeLocation: "",
  targetDescription: "",
  targetCategory: "",
  audienceType: "b2b",
  audienceTargets: [],
  regions: ["日本"],
  regionInput: "",
  language: "ja",
  aiModels: ["chatgpt"],
  watchTopics: [
    "AI検索に表示されるか",
    "候補として選ばれるか",
    "自社サイトが引用されるか",
    "どのような特徴で紹介されるか",
    "改善すべき点は何か"
  ],
  reportGoals: ["visibility", "citation", "brand", "improvement"],
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

const aiModelOptions: readonly { value: AiModel; label: string }[] = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
  { value: "claude", label: "Claude" }
];

const focusOptions: readonly {
  value: string;
  label: string;
  goal: Exclude<ReportGoal, "other">;
}[] = [
  { value: "AI検索に表示されるか", label: "AI検索に表示されるか", goal: "visibility" },
  { value: "候補として選ばれるか", label: "候補として選ばれるか", goal: "visibility" },
  { value: "自社サイトが引用されるか", label: "自社サイトが引用されるか", goal: "citation" },
  { value: "どのような特徴で紹介されるか", label: "どのような特徴で紹介されるか", goal: "brand" },
  { value: "改善すべき点は何か", label: "改善すべき点は何か", goal: "improvement" },
  { value: "評判や印象に問題がないか", label: "評判や印象に問題がないか", goal: "brand" }
];

const recommendedFocusValues = focusOptions.slice(0, 5).map((option) => option.value);

const regionSuggestions = ["日本", "首都圏", "関西", "全国", "英語圏", "北米", "アジア"];

const defaultReportGoalOptions: ReportGoalOption[] = [
  { value: "visibility", label: "AI検索で候補に出るか知りたい" },
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
    watchTopics: ["AI検索での露出", "候補として選ばれる条件", "公式サイトの引用状況", "料金", "機能", "導入事例", "費用対効果", "導入負荷"],
    reportGoalOptions: [
      { value: "visibility", label: "AI検索で自社が候補に出るか知りたい" },
      { value: "citation", label: "参照元を増やしたい" },
      { value: "improvement", label: "改善候補を出したい" },
      { value: "other", label: "その他" }
    ],
    promptFallbacks: [
      { text: "AI検索対策ツールを比較するとき、どの指標を見るべきですか？", group: "candidate" },
      { text: "生成AIで公式サイトが引用されやすくなるには、何を整えるべきですか？", group: "citation" },
      { text: "SEO支援ツールを導入する前に、費用対効果はどう確認すべきですか？", group: "candidate" }
    ],
    questionAreaFallbacks: ["AI検索での露出", "候補として選ばれる条件", "公式サイトの引用状況"]
  },
  b2bProfessionalService: {
    key: "b2bProfessionalService",
    serviceCategories: ["専門サービス", "コンサルティング", "BtoBサービス"],
    audienceTargets: ["相談前に比較する人", "専門性を重視する人", "料金を確認したい人", "依頼を判断する責任者"],
    watchTopics: ["実績", "専門性", "料金", "相談前の確認点", "対応範囲", "信頼性"],
    reportGoalOptions: [
      { value: "visibility", label: "専門サービスとして候補に出るか知りたい" },
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
    audienceTargets: ["近くで探している人", "予約しやすさを重視する人", "口コミを重視する人"],
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
  "targetType",
  "targetName",
  "targetAliases",
  "officialUrl",
  "mainBusiness",
  "organizationName",
  "productScope",
  "deliveryFormat",
  "storeLocation",
  "targetDescription",
  "targetCategory",
  "audienceType",
  "audienceTargets",
  "regions",
  "language",
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
  const [promptNotice, setPromptNotice] = useState<string | null>(null);
  const [lastRemovedPrompt, setLastRemovedPrompt] = useState<{ prompt: EditablePrompt; index: number } | null>(null);
  const [confirmationDone, setConfirmationDone] = useState(false);
  const [siteInspection, setSiteInspection] = useState<SiteInspectionState>({ status: "idle" });
  const [inspectedTargetKey, setInspectedTargetKey] = useState<string | null>(null);
  const [autoSuggestionSources, setAutoSuggestionSources] = useState<AutoSuggestionSources>(initialAutoSuggestionSources);

  const seedInput = useMemo(() => buildSeedInput(formState), [formState]);
  const seedKey = useMemo(() => stableSeedKey(seedInput), [seedInput]);
  const currentStepBlockers = getStepBlockers(stepIndex, formState);
  const showCurrentBlockers = attemptedSteps[stepIndex] && currentStepBlockers.length > 0;
  const seedBlockers = useMemo(
    () => [
      ...validateAnalysisTargetInput(buildAnalysisTargetFormInput(formState)),
      ...validateProjectSetupSeedInput(seedInput)
    ],
    [formState, seedInput]
  );
  const isInspectingSite = siteInspection.status === "loading";

  const updateForm: UpdateForm = (field, value) => {
    setConfirmationDone(false);
    setFormState((current) => {
      const next = { ...current, [field]: value };
      if (field === "targetType") {
        return {
          ...next,
          mainBusiness: "",
          organizationName: "",
          productScope: "single_product",
          deliveryFormat: "",
          storeLocation: ""
        };
      }
      if (field === "targetDescription" || field === "targetCategory" || field === "audienceType") {
        return {
          ...next,
          audienceTargets: reconcileAudienceTargetsForProfile(next, current.audienceTargets.length > 0)
        };
      }
      return next;
    });
    if (field === "targetDescription" || field === "targetCategory" || field === "audienceTargets") {
      setAutoSuggestionSources((current) => ({ ...current, [field]: null }));
    }
    if (field === "audienceType") {
      setAutoSuggestionSources((current) => ({ ...current, audienceTargets: null }));
    }
    if (field === "targetType" || field === "targetName" || field === "targetAliases" || field === "officialUrl") {
      setSiteInspection({ status: "idle" });
      setInspectedTargetKey(null);
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
      const sourceKey = stableStep1SourceKey(formState);
      if (inspectedTargetKey === sourceKey && siteInspection.status !== "idle") {
        setStepIndex(1);
        return;
      }
      await inspectAndApplySiteSuggestions(true);
      return;
    }

    if (stepIndex === 2) {
      if (draftPreview === null || promptExamples === null || promptSeedKey !== seedKey) {
        const preview = buildCustomerFacingDraftPreview(
          seedInput,
          formState,
          siteInspection.status === "success" ? siteInspection.result : null
        );
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

  async function inspectAndApplySiteSuggestions(advanceAfterInspection = false) {
    if (isInspectingSite) return;
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
    setInspectedTargetKey(sourceKey);
    setFormState(nextSuggestions.state);
    setAutoSuggestionSources(nextSuggestions.sources);
    if (advanceAfterInspection) setStepIndex(1);
  }

  const currentPrompts = promptExamples ?? [];

  function addPrompt() {
    const text = newPromptText.trim();
    if (!text) return;
    if (currentPrompts.some((prompt) => normalizeText(prompt.text) === normalizeText(text))) {
      setPromptNotice("同じ内容の質問がすでにあります。");
      return;
    }
    setPromptExamples((current) => [
      ...(current ?? []),
      {
        id: `prompt-custom-${Date.now()}`,
        text,
        group: classifyPromptText(text, formState)
      }
    ]);
    setNewPromptText("");
    setPromptNotice("質問を一覧の先頭に追加しました。");
    setLastRemovedPrompt(null);
    setConfirmationDone(false);
  }

  function removePrompt(promptId: string) {
    const index = currentPrompts.findIndex((prompt) => prompt.id === promptId);
    if (index < 0) return;
    setLastRemovedPrompt({ prompt: currentPrompts[index], index });
    setPromptNotice(null);
    setPromptExamples(currentPrompts.filter((prompt) => prompt.id !== promptId));
    setConfirmationDone(false);
  }

  function undoRemovePrompt() {
    if (!lastRemovedPrompt) return;
    setPromptExamples((current) => {
      const prompts = [...(current ?? [])];
      prompts.splice(Math.min(lastRemovedPrompt.index, prompts.length), 0, lastRemovedPrompt.prompt);
      return prompts;
    });
    setLastRemovedPrompt(null);
    setPromptNotice("削除した質問を元に戻しました。");
  }

  function goToStep(nextStepIndex: number) {
    setConfirmationDone(false);
    setStepIndex(nextStepIndex);
  }

  return (
    <main className="min-h-screen bg-[#F7FAF8] pb-28 text-[#0B1F17]">
      <section className="sticky top-0 z-20 border-b border-[#E2E8E5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#075E44] text-base font-bold text-white">
              R
            </div>
            <h1 className="text-xl font-bold leading-tight tracking-normal text-[#0B1F17] sm:text-2xl">
              Recora プロジェクト設定
            </h1>
          </div>
          <StepProgress stepIndex={stepIndex} onStepSelect={goToStep} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {stepIndex === 0 ? (
          <TargetStep
            formState={formState}
            updateForm={updateForm}
            siteInspection={siteInspection}
            onInspectSite={() => void inspectAndApplySiteSuggestions(false)}
          />
        ) : null}
        {stepIndex === 1 ? (
          <ServiceStep
            formState={formState}
            updateForm={updateForm}
            siteInspection={siteInspection}
            autoSuggestionSources={autoSuggestionSources}
          />
        ) : null}
        {stepIndex === 2 ? <FocusStep formState={formState} updateForm={updateForm} /> : null}
        {stepIndex === 3 ? (
          <PromptStep
            prompts={currentPrompts}
            newPromptText={newPromptText}
            setNewPromptText={setNewPromptText}
            onAddPrompt={addPrompt}
            promptNotice={promptNotice}
            lastRemovedPrompt={lastRemovedPrompt}
            onUndoRemove={undoRemovePrompt}
            onRemovePrompt={removePrompt}
            onChangePrompts={(prompts) => {
              setPromptExamples(prompts);
              setPromptNotice(null);
              setConfirmationDone(false);
            }}
          />
        ) : null}
        {stepIndex === 4 ? (
          <ConfirmationStep
            formState={formState}
            prompts={currentPrompts}
            seedBlockers={seedBlockers}
            confirmationDone={confirmationDone}
            onConfirm={() => setConfirmationDone(true)}
            onEditStep={goToStep}
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

      </section>

      <section className="fixed inset-x-0 bottom-0 z-20 border-t border-[#DDE8E5] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
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
                  {stepIndex === 2 ? "質問を確認" : "次へ"}
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

function StepProgress({
  stepIndex,
  onStepSelect
}: {
  stepIndex: number;
  onStepSelect: (stepIndex: number) => void;
}) {
  return (
    <nav aria-label="初期設定ステップ" className="-mx-1 overflow-x-auto px-1">
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index === stepIndex;
          const done = index < stepIndex;
          return (
            <li key={step.title} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!done}
                onClick={() => onStepSelect(index)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B8B65] focus-visible:ring-offset-2",
                  active
                    ? "border-[#075E44] bg-[#075E44] text-white"
                    : done
                      ? "border-[#A9C6BA] bg-[#F2FAF6] text-[#075E44] hover:border-[#075E44]"
                      : "border-[#D8E2DE] bg-white text-[#64736C]"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span>Step {index + 1}</span>
                <span className="hidden sm:inline">{step.short}</span>
              </button>
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

const targetTypeIcons: Record<AnalysisTargetType, typeof Building2> = {
  company: Building2,
  brand: Tag,
  product: Package,
  service: BriefcaseBusiness,
  store: Store
};

function TargetStep({
  formState,
  updateForm,
  siteInspection,
  onInspectSite
}: {
  formState: WizardState;
  updateForm: UpdateForm;
  siteInspection: SiteInspectionState;
  onInspectSite: () => void;
}) {
  const contract = formState.targetType ? getAnalysisTargetUiContract(formState.targetType) : null;

  return (
    <WizardCard
      size="wide"
      icon={<BadgeCheck />}
      title="分析対象を設定"
      description="計測したい対象の種類を選び、基本情報を入力してください。"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {analysisTargetTypes.map((targetType) => {
          const option = getAnalysisTargetUiContract(targetType);
          const Icon = targetTypeIcons[targetType];
          const selected = formState.targetType === targetType;
          return (
            <button
              key={targetType}
              type="button"
              aria-pressed={selected}
              onClick={() => updateForm("targetType", targetType)}
              className={cn(
                "group relative min-h-[108px] rounded-xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#1B8B65] focus-visible:ring-offset-2",
                selected
                  ? "border-[#075E44] bg-[#F2FAF6] shadow-[0_1px_2px_rgba(7,94,68,0.08)]"
                  : "border-[#DDE8E5] bg-white hover:border-[#A9C6BA] hover:bg-[#FBFDFC]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    selected ? "bg-[#075E44] text-white" : "bg-[#F1F5F3] text-[#506158]"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {selected ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#075E44] text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </div>
              <div className="mt-3 text-sm font-bold text-[#0B1F17]">{option.label}</div>
              <div className="mt-1 text-xs leading-5 text-[#64736C]">{option.shortDescription}</div>
            </button>
          );
        })}
      </div>

      {contract && formState.targetType ? (
        <section className="mt-5 overflow-hidden rounded-xl border border-[#DDE8E5] bg-white">
          <div className="border-b border-[#E8EFEC] bg-[#FBFDFC] px-4 py-3 sm:px-5">
            <h3 className="text-base font-bold text-[#0B1F17]">{contract.identificationTitle}</h3>
            <p className="mt-1 text-sm leading-6 text-[#64736C]">{contract.identificationDescription}</p>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <TextInput
                label={contract.nameLabel}
                value={formState.targetName}
                onChange={(value) => updateForm("targetName", value)}
                required
                placeholder={contract.namePlaceholder}
              />
              <TargetSpecificFields formState={formState} updateForm={updateForm} />
            </div>

            <ChipInput
              label={contract.aliasesLabel}
              optional
              items={formState.targetAliases}
              inputValue={formState.targetAliasInput}
              onInputChange={(value) => updateForm("targetAliasInput", value)}
              onAdd={(value) => updateForm("targetAliases", addUnique(formState.targetAliases, value))}
              onRemove={(value) => updateForm("targetAliases", removeValue(formState.targetAliases, value))}
              placeholder={contract.aliasesPlaceholder}
              emptyText="別名がなければ空のままで進めます。"
            />

            <div>
              <TextInput
                label={contract.urlLabel}
                value={formState.officialUrl}
                onChange={(value) => updateForm("officialUrl", value)}
                required
                placeholder={contract.urlPlaceholder}
              />
              <p className="mt-2 text-xs leading-5 text-[#64736C]">{contract.urlHelp}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onInspectSite}
                  disabled={siteInspection.status === "loading" || !formState.targetName.trim() || !formState.officialUrl.trim()}
                  className="border-[#C9D8D2] text-[#075E44]"
                >
                  {siteInspection.status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchCheck className="h-4 w-4" />
                  )}
                  サイトから入力
                </Button>
                {siteInspection.status === "success" ? (
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      siteInspection.result.brandNameFound ? "text-[#075E44]" : "text-amber-700"
                    )}
                  >
                    {siteInspection.result.brandNameFound
                      ? "サイト情報を入力欄へ反映しました"
                      : "ページ内で分析対象名を確認できませんでした"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[#C9D8D2] bg-white px-4 py-8 text-center">
          <BadgeCheck className="mx-auto h-6 w-6 text-[#8B9A93]" />
          <p className="mt-2 text-sm font-bold text-[#506158]">上から分析対象の種類を1つ選んでください</p>
        </div>
      )}

      {siteInspection.status === "failed" ? (
        <div className="mt-4">
          <SiteInspectionPanel formState={formState} siteInspection={siteInspection} />
        </div>
      ) : null}
    </WizardCard>
  );
}

function TargetSpecificFields({
  formState,
  updateForm
}: {
  formState: WizardState;
  updateForm: UpdateForm;
}) {
  if (formState.targetType === "company") {
    return (
      <TextInput
        label="主な事業"
        value={formState.mainBusiness}
        onChange={(value) => updateForm("mainBusiness", value)}
        required
        placeholder="例 AI検索分析SaaSの開発・提供"
      />
    );
  }

  if (formState.targetType === "brand") {
    return (
      <TextInput
        label="運営会社"
        value={formState.organizationName}
        onChange={(value) => updateForm("organizationName", value)}
        required
        placeholder="例 株式会社サンプル"
      />
    );
  }

  if (formState.targetType === "product") {
    return (
      <div className="space-y-4">
        <TextInput
          label="ブランド・メーカー名"
          value={formState.organizationName}
          onChange={(value) => updateForm("organizationName", value)}
          required
          placeholder="例 Sample Brand"
        />
        <SegmentedControl
          label="計測する範囲"
          value={formState.productScope}
          options={[
            { value: "single_product", label: "単一商品" },
            { value: "product_series", label: "商品シリーズ" }
          ]}
          onChange={(value) => updateForm("productScope", value)}
        />
      </div>
    );
  }

  if (formState.targetType === "service") {
    return (
      <div className="space-y-4">
        <TextInput
          label="提供会社・ブランド名"
          value={formState.organizationName}
          onChange={(value) => updateForm("organizationName", value)}
          required
          placeholder="例 株式会社サンプル"
        />
        <SelectLikeInput
          label="提供形式"
          value={formState.deliveryFormat}
          onChange={(value) => updateForm("deliveryFormat", value)}
          required
          placeholder="例 Webサービス"
          suggestions={["Webサービス", "対面・店舗", "訪問型", "オンラインと対面"]}
        />
      </div>
    );
  }

  if (formState.targetType === "store") {
    return (
      <div className="space-y-4">
        <TextInput
          label="店舗所在地"
          value={formState.storeLocation}
          onChange={(value) => updateForm("storeLocation", value)}
          required
          placeholder="例 東京都渋谷区"
        />
        <TextInput
          label="所属チェーン・ブランド"
          value={formState.organizationName}
          onChange={(value) => updateForm("organizationName", value)}
          optional
          placeholder="独立店舗の場合は空欄で進められます"
        />
        <p className="text-xs leading-5 text-[#64736C]">
          チェーン全体を計測したい場合は、分析対象として「ブランド」を選んでください。
        </p>
      </div>
    );
  }

  return null;
}

function ServiceStep({
  formState,
  updateForm,
  siteInspection,
  autoSuggestionSources
}: {
  formState: WizardState;
  updateForm: UpdateForm;
  siteInspection: SiteInspectionState;
  autoSuggestionSources: AutoSuggestionSources;
}) {
  const suggestionProfile = deriveOnboardingSuggestionProfile(formState);
  const categorySuggestions = suggestionProfile.serviceCategories;
  const siteAutoFilled = siteInspection.status === "success";

  return (
    <WizardCard
      size="wide"
      icon={<Wand2 />}
      title="計測設定"
      description="対象の内容と、計測する地域・言語・AIモデルを設定します。"
    >
      <SiteInspectionPanel formState={formState} siteInspection={siteInspection} />

      <div className="mt-4 space-y-4">
        <section className="rounded-xl border border-[#DDE8E5] bg-white p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-[#0B1F17]">対象情報</h3>
            <p className="mt-1 text-sm leading-6 text-[#64736C]">AI検索で対象を判断するための基本情報です。</p>
          </div>
          <div className="space-y-5">
            <div>
              <TextareaInput
                label="分析対象の概要"
                value={formState.targetDescription}
                onChange={(value) => updateForm("targetDescription", value)}
                required
                rows={4}
                placeholder="何を提供している対象か、主な特徴や用途を入力してください。"
              />
              {siteAutoFilled && autoSuggestionSources.targetDescription ? <AutoFilledNote /> : null}
            </div>
            <div>
              <SelectLikeInput
                label="カテゴリ"
                value={formState.targetCategory}
                onChange={(value) => updateForm("targetCategory", value)}
                required
                placeholder="例 SEO / AI検索対策"
                suggestions={categorySuggestions}
              />
              {siteAutoFilled && autoSuggestionSources.targetCategory ? <AutoFilledNote /> : null}
            </div>
            <div>
              <p className="text-sm font-bold text-[#334155]">主な顧客タイプ</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
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
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE8E5] bg-[#FBFDFC] p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-[#0B1F17]">計測範囲</h3>
            <p className="mt-1 text-sm leading-6 text-[#64736C]">日本・日本語を初期設定にしています。必要に応じて変更できます。</p>
          </div>
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
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

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#334155]">対象AIモデル</h3>
                <RequiredBadge />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {aiModelOptions.map((model) => (
                  <CheckCard
                    key={model.value}
                    selected={formState.aiModels.includes(model.value)}
                    label={model.label}
                    onClick={() => updateForm("aiModels", toggleValue(formState.aiModels, model.value))}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#64736C]">
                実際の計測対象は、利用可能なモデルを確認したうえで確定します。
              </p>
            </div>
          </div>
        </section>
      </div>
    </WizardCard>
  );
}

function AutoFilledNote() {
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#075E44]">
      <Sparkles className="h-3.5 w-3.5" />
      サイト情報から入力済み
    </p>
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

  return null;
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
  const isRecommended =
    formState.watchTopics.length === recommendedFocusValues.length &&
    recommendedFocusValues.every((value) => formState.watchTopics.includes(value));

  function setFocusValues(values: string[]) {
    const goals = uniqueStrings(
      focusOptions.filter((option) => values.includes(option.value)).map((option) => option.goal)
    );
    updateForm("watchTopics", values);
    updateForm("reportGoals", goals);
  }

  return (
    <WizardCard
      icon={<Target className="h-9 w-9" />}
      title="確認したいこと"
      description="AI検索で特に確認したい内容を選んでください。"
    >
      <button
        type="button"
        onClick={() => setFocusValues([...recommendedFocusValues])}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B8B65] focus-visible:ring-offset-2",
          isRecommended
            ? "border-[#1B8B65] bg-[#F2FAF6]"
            : "border-[#DDE8E5] bg-[#FBFDFC] hover:border-[#A9C6BA]"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            isRecommended ? "border-[#075E44] bg-[#075E44] text-white" : "border-[#C9D8D2] bg-white text-transparent"
          )}
        >
          <Check className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-bold text-[#0B1F17]">おすすめ設定</span>
          <span className="mt-1 block text-xs leading-5 text-[#64736C]">
            表示・候補選定・引用・紹介され方・改善点をまとめて確認します。
          </span>
        </span>
      </button>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {focusOptions.map((option) => (
          <CheckCard
            key={option.value}
            selected={formState.watchTopics.includes(option.value)}
            label={option.label}
            onClick={() => setFocusValues(toggleValue(formState.watchTopics, option.value))}
          />
        ))}
      </div>

      <div className="mt-5">
        <TextareaInput
          label="ほかに確認したいこと（任意）"
          value={formState.reportGoalInput}
          onChange={(value) => updateForm("reportGoalInput", value)}
          rows={3}
          placeholder="例 新しいサービス名が正しく理解されているか確認したい"
        />
      </div>
    </WizardCard>
  );
}

function PromptStep({
  prompts,
  newPromptText,
  setNewPromptText,
  onAddPrompt,
  promptNotice,
  lastRemovedPrompt,
  onUndoRemove,
  onRemovePrompt,
  onChangePrompts
}: {
  prompts: EditablePrompt[];
  newPromptText: string;
  setNewPromptText: (value: string) => void;
  onAddPrompt: () => void;
  promptNotice: string | null;
  lastRemovedPrompt: { prompt: EditablePrompt; index: number } | null;
  onUndoRemove: () => void;
  onRemovePrompt: (promptId: string) => void;
  onChangePrompts: (prompts: EditablePrompt[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePromptCount, setVisiblePromptCount] = useState(10);
  const generatedPrompts = prompts.filter((prompt) => !isCustomPrompt(prompt));
  const customPrompts = prompts.filter(isCustomPrompt);
  const orderedPrompts = [...customPrompts, ...generatedPrompts].filter((prompt) => prompt.text.trim());
  const normalizedQuery = normalizeText(searchQuery);
  const filteredPrompts = normalizedQuery
    ? orderedPrompts.filter((prompt) => normalizeText(prompt.text).includes(normalizedQuery))
    : orderedPrompts;
  const visiblePrompts = filteredPrompts.slice(0, visiblePromptCount);
  const remainingCount = Math.max(filteredPrompts.length - visiblePrompts.length, 0);

  return (
    <WizardCard
      icon={<MessageSquareText className="h-9 w-9" />}
      title="質問"
      description="計測に使う質問を確認し、必要に応じて追加・編集してください。"
      size="wide"
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-[#CFE2DA] bg-[#F8FBFA] p-4 sm:p-5">
          <h3 className="text-base font-bold text-[#0B1F17]">質問を追加</h3>
          <p className="mt-1 text-sm leading-6 text-[#64736C]">確認したい質問を、そのまま一覧へ追加できます。</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <textarea
              className="min-h-20 min-w-0 flex-1 resize-y rounded-lg border border-[#DDE8E5] bg-white px-4 py-3 text-base leading-6 text-[#0B1F17] outline-none transition placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15 sm:text-sm"
              rows={2}
              value={newPromptText}
              onChange={(event) => setNewPromptText(event.target.value)}
              placeholder="確認したい質問を入力してください"
            />
            <Button
              type="button"
              className="h-11 self-end bg-[#075E44] px-5 hover:bg-[#064D39]"
              onClick={onAddPrompt}
              disabled={!newPromptText.trim()}
            >
              <Plus className="h-4 w-4" />
              追加する
            </Button>
          </div>
          {promptNotice ? (
            <p className={cn("mt-2 text-xs font-semibold", promptNotice.startsWith("同じ") ? "text-rose-600" : "text-[#075E44]")}>
              {promptNotice}
            </p>
          ) : null}
        </section>

        {lastRemovedPrompt ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[#DDE8E5] bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 truncate text-[#506158]">質問を削除しました</span>
            <Button type="button" variant="outline" size="sm" onClick={onUndoRemove} className="border-[#C9D8D2] text-[#075E44]">
              元に戻す
            </Button>
          </div>
        ) : null}

        <section className="min-w-0 rounded-xl border border-[#DDE8E5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0B1F17]">質問一覧</h3>
              <p className="mt-1 text-sm leading-6 text-[#64736C]">
                {filteredPrompts.length}件中{visiblePrompts.length}件を表示
              </p>
            </div>
            <label className="relative block w-full lg:max-w-sm">
              <SearchCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8982]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setVisiblePromptCount(10);
                }}
                className="h-11 w-full rounded-lg border border-[#DDE8E5] bg-white pl-10 pr-4 text-sm text-[#0B1F17] outline-none placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
                placeholder="質問を検索"
              />
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#E1E8E5] bg-[#FBFDFC]">
            {visiblePrompts.length > 0 ? (
              visiblePrompts.map((prompt, index) => (
                <PromptListItem
                  key={prompt.id}
                  index={index}
                  prompt={prompt}
                  added={isCustomPrompt(prompt)}
                  onChange={(nextPrompt) =>
                    onChangePrompts(prompts.map((item) => (item.id === prompt.id ? nextPrompt : item)))
                  }
                  onRemove={() => onRemovePrompt(prompt.id)}
                />
              ))
            ) : (
              <EmptyPromptState hasSearchQuery={Boolean(searchQuery.trim())} />
            )}
          </div>

          {remainingCount > 0 ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="border-[#C9D8D2] bg-white text-[#075E44]"
                onClick={() => setVisiblePromptCount((current) => current + 10)}
              >
                さらに10件表示
                <span className="text-xs text-[#64736C]">（残り{remainingCount}件）</span>
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </WizardCard>
  );
}

function ConfirmationStep({
  formState,
  prompts,
  seedBlockers,
  confirmationDone,
  onConfirm,
  onEditStep
}: {
  formState: WizardState;
  prompts: EditablePrompt[];
  seedBlockers: string[];
  confirmationDone: boolean;
  onConfirm: () => void;
  onEditStep: (stepIndex: number) => void;
}) {
  const sections = buildConfirmationSections(formState);

  return (
    <WizardCard
      icon={<ClipboardCheck className="h-9 w-9" />}
      title="確認"
      description="設定内容を確認し、必要な項目だけ戻って編集できます。"
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

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <ConfirmationSection
            key={section.title}
            title={section.title}
            items={section.items}
            onEdit={() => onEditStep(section.stepIndex)}
          />
        ))}
        <PromptSummaryList prompts={prompts} onEdit={() => onEditStep(3)} />
      </div>

      <Button
        type="button"
        className="mt-6 h-12 w-full bg-[#075E44] text-base hover:bg-[#064D39]"
        onClick={onConfirm}
        disabled={seedBlockers.length > 0}
      >
        プロジェクトを作成
        <CheckCircle2 className="h-5 w-5" />
      </Button>
      {confirmationDone ? (
        <p className="mt-3 text-center text-sm font-semibold text-[#075E44]">
          プロジェクト作成の準備ができました。
        </p>
      ) : null}
    </WizardCard>
  );
}

function WizardCard({
  icon,
  title,
  description,
  children,
  size = "default"
}: {
  icon: ReactNode;
  title: string;
  description: string;
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
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F6F3] text-[#075E44] [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-normal text-[#0B1F17] sm:text-xl">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64736C]">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  optional = false,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold text-[#334155]">
        {label}
        {required ? <RequiredBadge /> : optional ? <OptionalBadge /> : null}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-[#DDE8E5] bg-white px-4 text-base text-[#0B1F17] outline-none transition placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15 sm:text-sm"
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
        className="mt-2 w-full resize-y rounded-lg border border-[#DDE8E5] bg-white px-4 py-3 text-base leading-6 text-[#0B1F17] outline-none transition placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15 sm:text-sm"
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
  const [isComposing, setIsComposing] = useState(false);

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <input
        className="h-11 min-w-0 flex-1 rounded-lg border border-[#DDE8E5] bg-white px-4 text-sm text-[#0B1F17] outline-none placeholder:text-[#A3AEA8] focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !isComposing) {
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
  added,
  onChange,
  onRemove
}: {
  index: number;
  prompt: EditablePrompt;
  added: boolean;
  onChange: (prompt: EditablePrompt) => void;
  onRemove: () => void;
}) {
  return (
    <div className={cn("border-b border-[#E8EFEC] p-4 last:border-b-0", added && "bg-[#F2FAF6]")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#075E44] text-xs font-bold text-white">
            {index + 1}
          </span>
          <label className="min-w-0 flex-1">
            {added ? <span className="mb-2 block text-xs font-bold text-[#075E44]">追加した質問</span> : null}
            <textarea
              className="min-h-16 w-full resize-y rounded-lg border border-[#E1E8E5] bg-white px-3 py-3 text-sm leading-6 text-[#0B1F17] outline-none transition focus:min-h-28 focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
              rows={2}
              value={prompt.text}
              onChange={(event) => onChange({ ...prompt, text: event.target.value })}
              aria-label={"質問 " + (index + 1)}
            />
          </label>
        </div>
        <button
          type="button"
          className="w-full shrink-0 rounded-lg border border-[#E1E8E5] bg-white px-3 py-2 text-xs font-bold text-[#7A8982] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:w-auto"
          onClick={onRemove}
          aria-label={"質問 " + (index + 1) + "を削除"}
        >
          削除
        </button>
      </div>
    </div>
  );
}

function EmptyPromptState({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  return (
    <div className="p-5 text-sm leading-6 text-[#64736C]">
      {hasSearchQuery ? "検索条件に一致する質問はありません。" : "表示できる質問がありません。上の入力欄から追加できます。"}
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
  return <span className="ml-1 text-xs font-semibold text-[#64736C]">（必須）</span>;
}

function OptionalBadge() {
  return <span className="ml-1 text-xs font-semibold text-[#7A8982]">（任意）</span>;
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
        brandName: state.targetName,
        aliases: state.targetAliases
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

  const shouldReplaceServiceDescription = !state.targetDescription.trim() || sources.targetDescription !== null;
  const shouldReplaceServiceCategory = !state.targetCategory.trim() || sources.targetCategory !== null;
  const shouldReplaceAudienceTargets = state.audienceTargets.length === 0 || sources.audienceTargets !== null;

  return {
    state: {
      ...state,
      targetDescription: shouldReplaceServiceDescription ? proposedServiceDescription : state.targetDescription,
      targetCategory: shouldReplaceServiceCategory ? proposedServiceCategory : state.targetCategory,
      audienceTargets: shouldReplaceAudienceTargets ? proposedAudienceTargets : state.audienceTargets
    },
    sources: {
      targetDescription: shouldReplaceServiceDescription ? sourceKey : sources.targetDescription,
      targetCategory: shouldReplaceServiceCategory ? sourceKey : sources.targetCategory,
      audienceTargets: shouldReplaceAudienceTargets ? sourceKey : sources.audienceTargets
    }
  };
}

function buildCustomerFacingDraftPreview(
  seedInput: ProjectSetupSeedInput,
  formState: WizardState,
  inspection: SiteInspectionResult | null = null
): CustomerFacingDraftPreview {
  const result = generateProjectSetupDraft(seedInput);
  const brandIdentity = buildBrandIdentity(seedInput);
  const profile = deriveOnboardingSuggestionProfile(formState);
  const serviceInsight = buildOnboardingServiceInsight(formState, inspection);
  const generated = result.draft.prompts.slice(0, 30).map((prompt) => ({
    id: prompt.promptId,
    text: normalizeCustomerPromptExampleText(prompt.text),
    group: classifyGeneratedPrompt(prompt, derivePromptMetricEligibility(prompt, brandIdentity))
  }));
  const customerReadyGenerated = filterPromptsForSuggestionProfile(generated, profile);
  const fallback = buildFallbackPrompts(formState);
  const prompts = uniquePrompts(customerReadyGenerated.length > 0 ? customerReadyGenerated : fallback).slice(0, 30);
  const serviceCategories = uniqueStrings([seedInput.industryCategory, formState.targetCategory, ...profile.serviceCategories]).slice(0, 3);
  const audiencePersonas = buildCustomerPersonas(formState, result.draft.personas, profile, serviceInsight);
  const audienceTargets = audiencePersonas.map((persona) => persona.label);
  const generatedQuestionAreas = result.draft.topics
    .map((topic) => buildCustomerFacingQuestionArea(topic.topicName, topic.diagnosisGoal))
    .filter((area) => !isRemovedCompetitionArea(area));
  const questionAreas = uniqueStrings([
    ...generatedQuestionAreas,
    ...profile.questionAreaFallbacks
  ]).slice(0, 6);

  return {
    serviceCategories,
    audienceTargets,
    audiencePersonas,
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
  const competitionFreePrompts = prompts.filter((prompt) => !isRemovedCompetitionArea(prompt.text));
  if (!isConsumerSuggestionProfile(profile.key)) return competitionFreePrompts;

  return competitionFreePrompts.filter((prompt) => !containsBusinessAdoptionLanguage(prompt.text));
}

function isRemovedCompetitionArea(value: string) {
  return matchesAnyText(value, ["競合", "他社", "他ブランド", "competitor"]);
}

function isConsumerSuggestionProfile(profileKey: OnboardingSuggestionProfileKey) {
  return ["b2cSchoolEducation", "healthcareClinic", "localService", "ecommerceProduct", "genericB2C"].includes(profileKey);
}

function reconcileAudienceTargetsForProfile(state: WizardState, preserveCompatibleExisting: boolean) {
  const profile = deriveOnboardingSuggestionProfile(state);
  const serviceInsight = buildOnboardingServiceInsight(state);
  const serviceBasedTargets = proposePersonaLabelsFromServiceInsight(serviceInsight, profile);
  const existing = preserveCompatibleExisting
    ? state.audienceTargets
        .map((label) => normalizeCustomerPersonaLabel(label, profile))
        .filter((label) => isCustomerPersonaCompatibleWithServiceInsight(label, profile, serviceInsight))
    : [];
  return uniqueStrings([...existing, ...serviceBasedTargets, ...profile.audienceTargets]).slice(0, existing.length > 0 ? 5 : 3);
}

function buildOnboardingServiceInsight(
  formState: WizardState,
  inspection: SiteInspectionResult | null = null
): OnboardingServiceInsight {
  const profile = deriveOnboardingSuggestionProfile(formState);
  const serviceSummary = formState.targetDescription.trim() || buildSuggestedServiceDescriptionForStep(formState, inspection);
  const sourceEvidence = {
    fromUrlTitle: inspection?.title || undefined,
    fromUrlDescription: inspection?.description || undefined,
    fromH1: inspection?.h1 || undefined,
    fromUserServiceDescription: formState.targetDescription.trim() || undefined,
    fromSelectedFocus: uniqueStrings([...formState.watchTopics, ...formatReportGoalLabels(formState)])
  };
  const evidenceSignals = uniqueStrings([
    formState.targetCategory,
    serviceSummary,
    ...formState.audienceTargets,
    ...formState.watchTopics,
    ...formatReportGoalLabels(formState),
    inspection?.title ?? "",
    inspection?.description ?? "",
    inspection?.h1 ?? ""
  ]).slice(0, 10);
  const uncertaintyFlags = [
    !formState.targetDescription.trim() ? "service_description_missing" : "",
    !inspection ? "url_metadata_unavailable" : "",
    formState.audienceTargets.length === 0 ? "selected_persona_missing" : ""
  ].filter(Boolean);

  return {
    brandName: formState.targetName.trim(),
    serviceName: formState.targetName.trim(),
    serviceSummary,
    categoryHypothesis: formState.targetCategory.trim() || profile.serviceCategories[0] || "サービス",
    audienceType: formState.audienceType,
    market: formState.regions,
    language: formState.language,
    valueProposition: deriveServiceInsightValueProposition(formState, serviceSummary),
    primaryUseCases: deriveServiceInsightUseCases(formState, serviceSummary),
    buyerContext: uniqueStrings([...formState.audienceTargets, ...formState.watchTopics, ...formatReportGoalLabels(formState)]).slice(0, 8),
    decisionComplexity: deriveServiceInsightDecisionComplexity(formState, serviceSummary),
    trustRequirements: deriveServiceInsightTrustRequirements(formState, serviceSummary),
    likelyObjections: deriveServiceInsightLikelyObjections(formState, serviceSummary),
    evidenceSignals,
    sourceEvidence,
    uncertaintyFlags
  };
}

function buildCustomerPersonas(
  formState: WizardState,
  generatedPersonas: readonly PersonaDraft[],
  profile: OnboardingSuggestionProfile,
  serviceInsight = buildOnboardingServiceInsight(formState)
): CustomerPersona[] {
  return renderCustomerPersonas(
    validateOnboardingPersonaFrames(proposeServiceBasedPersonaFrames(formState, generatedPersonas, profile, serviceInsight), profile, serviceInsight)
  );
}

function proposeServiceBasedPersonaFrames(
  formState: WizardState,
  generatedPersonas: readonly PersonaDraft[],
  profile: OnboardingSuggestionProfile,
  serviceInsight: OnboardingServiceInsight
): OnboardingPersonaFrame[] {
  const sourceKey = buildCustomerPersonaSourceKey(formState);
  const serviceBased = proposePersonaLabelsFromServiceInsight(serviceInsight, profile)
    .map((label, index) =>
      buildCustomerPersonaFrame(label, formState, profile, "service_insight", sourceKey + "-insight-" + index, undefined, serviceInsight)
    )
    .filter((persona): persona is OnboardingPersonaFrame => persona !== null);
  const selected = formState.audienceTargets
    .map((label, index) => buildCustomerPersonaFrame(label, formState, profile, "selected", sourceKey + "-selected-" + index, undefined, serviceInsight))
    .filter((persona): persona is OnboardingPersonaFrame => persona !== null);
  const generated = generatedPersonas
    .map((persona, index) =>
      buildCustomerPersonaFrame(
        buildCustomerPersonaLabel(persona, profile),
        formState,
        profile,
        "generator",
        sourceKey + "-generated-" + index,
        persona,
        serviceInsight
      )
    )
    .filter((persona): persona is OnboardingPersonaFrame => persona !== null);
  const fallback = profile.audienceTargets
    .map((label, index) =>
      buildCustomerPersonaFrame(label, formState, profile, "profile_fallback", sourceKey + "-fallback-" + index, undefined, serviceInsight)
    )
    .filter((persona): persona is OnboardingPersonaFrame => persona !== null);

  return [...serviceBased, ...selected, ...generated, ...fallback];
}

function validateOnboardingPersonaFrames(
  frames: readonly OnboardingPersonaFrame[],
  profile: OnboardingSuggestionProfile,
  serviceInsight: OnboardingServiceInsight
): OnboardingPersonaFrame[] {
  const personas: OnboardingPersonaFrame[] = [];
  for (const persona of frames) {
    if (!isCustomerPersonaCompatibleWithServiceInsight(persona.label, profile, serviceInsight)) continue;
    if (personas.some((current) => normalizeText(current.label) === normalizeText(persona.label))) continue;
    personas.push(persona);
  }
  return personas.slice(0, 4);
}

function renderCustomerPersonas(frames: readonly OnboardingPersonaFrame[]): CustomerPersona[] {
  return frames.map((frame) => ({
    ...frame,
    label: frame.label.trim(),
    description: frame.description.trim()
  }));
}

function deriveServiceInsightValueProposition(formState: WizardState, serviceSummary: string) {
  const text = buildServiceInsightText(formState, serviceSummary);
  if (matchesAnyText(text, ["初心者", "初めて", "社会人", "英会話"])) return ["初めてでも始めやすい", "料金や通いやすさを比較できる"];
  if (matchesAnyText(text, ["子ども", "こども", "キッズ", "保護者"])) return ["子どもに合う学習環境を選べる", "講師や安全性を確認できる"];
  if (matchesAnyText(text, ["マットレス", "睡眠", "寝具"])) return ["睡眠悩みに合う商品を比較できる", "返品条件や素材を確認できる"];
  if (matchesAnyText(text, ["化粧品", "コスメ", "スキンケア", "肌"])) return ["肌に合うか確認できる", "成分や口コミを比較できる"];
  if (matchesAnyText(text, ["採用", "求人", "面接", "候補者", "ATS"])) return ["採用業務を整理できる", "人事と現場の判断材料をそろえられる"];
  if (matchesAnyText(text, ["SEO", "AI検索", "LLMO", "GEO"])) return ["AI検索での見え方を確認できる", "改善施策の判断材料をそろえられる"];
  return uniqueStrings([formState.targetCategory, ...formState.watchTopics, ...formatReportGoalLabels(formState)]).slice(0, 3);
}

function deriveServiceInsightUseCases(formState: WizardState, serviceSummary: string) {
  const text = buildServiceInsightText(formState, serviceSummary);
  if (matchesAnyText(text, ["子ども", "こども", "キッズ", "保護者"])) return ["教室選び", "体験前の確認", "通いやすさの比較"];
  if (matchesAnyText(text, ["初心者", "初めて", "社会人", "英会話"])) return ["初回申込み前の比較", "料金比較", "口コミ確認"];
  if (matchesAnyText(text, ["マットレス", "睡眠", "寝具"])) return ["寝心地の比較", "返品条件の確認", "素材の確認"];
  if (matchesAnyText(text, ["化粧品", "コスメ", "スキンケア", "肌"])) return ["肌との相性確認", "成分確認", "定期購入条件の確認"];
  if (matchesAnyText(text, ["採用", "求人", "面接", "候補者", "ATS"])) return ["採用管理の比較", "面接連携の確認", "費用対効果の説明"];
  if (matchesAnyText(text, ["SEO", "AI検索", "LLMO", "GEO"])) return ["AI検索露出の確認", "候補選定の確認", "公式サイト引用の確認"];
  return uniqueStrings([...formState.watchTopics, ...formatReportGoalLabels(formState)]).slice(0, 3);
}

function deriveServiceInsightDecisionComplexity(formState: WizardState, serviceSummary: string): OnboardingServiceInsight["decisionComplexity"] {
  const text = buildServiceInsightText(formState, serviceSummary);
  if (formState.audienceType === "b2b" || matchesAnyText(text, ["稟議", "承認", "セキュリティ", "採用", "SaaS", "導入"])) return "high";
  if (matchesAnyText(text, ["医療", "クリニック", "美容", "資格", "リスク", "子ども", "返品", "定期購入"])) return "medium";
  return "low";
}

function deriveServiceInsightTrustRequirements(formState: WizardState, serviceSummary: string) {
  const text = buildServiceInsightText(formState, serviceSummary);
  if (matchesAnyText(text, ["医療", "クリニック", "美容", "資格", "リスク"])) return ["資格・専門性", "リスク説明", "口コミ"];
  if (matchesAnyText(text, ["子ども", "保護者", "キッズ"])) return ["講師の質", "安全性", "通いやすさ"];
  if (matchesAnyText(text, ["化粧品", "コスメ", "肌"])) return ["成分", "口コミ", "返品・定期購入条件"];
  if (matchesAnyText(text, ["マットレス", "睡眠", "寝具"])) return ["素材", "返品条件", "口コミ"];
  if (matchesAnyText(text, ["採用", "SaaS", "導入"])) return ["実績", "費用対効果", "現場連携"];
  return uniqueStrings([...formState.watchTopics, "口コミ", "料金説明"]).slice(0, 4);
}

function deriveServiceInsightLikelyObjections(formState: WizardState, serviceSummary: string) {
  const text = buildServiceInsightText(formState, serviceSummary);
  if (matchesAnyText(text, ["採用", "SaaS", "導入"])) return ["運用に乗るか分からない", "費用対効果を説明しにくい", "現場連携が不安"];
  if (matchesAnyText(text, ["子ども", "保護者", "キッズ"])) return ["子どもに合うか分からない", "通い続けられるか不安", "講師の質が見えにくい"];
  if (matchesAnyText(text, ["初心者", "英会話"])) return ["続けられるか分からない", "料金差が分かりにくい", "自分に合うか不安"];
  if (matchesAnyText(text, ["化粧品", "コスメ", "肌"])) return ["肌に合うか不安", "成分が分かりにくい", "定期購入条件が不安"];
  if (matchesAnyText(text, ["マットレス", "睡眠", "寝具"])) return ["寝心地が合うか不安", "返品できるか不安", "素材の違いが分かりにくい"];
  return ["比較軸が分かりにくい", "料金や口コミだけでは判断しにくい"];
}

function proposePersonaLabelsFromServiceInsight(
  serviceInsight: OnboardingServiceInsight,
  profile: OnboardingSuggestionProfile
): string[] {
  const text = buildServiceDefinitionTextFromInsight(serviceInsight);
  if (matchesAnyText(text, ["採用", "求人", "面接", "候補者", "ATS"])) {
    return ["人事担当者", "採用責任者", "経営者・役員", "現場面接担当者"];
  }
  if (matchesAnyText(text, ["SEO", "AI検索", "LLMO", "GEO"])) {
    return ["SEO担当者", "マーケティング責任者", "導入を判断する責任者"];
  }
  if (matchesAnyText(text, ["子ども", "こども", "キッズ", "保護者"])) {
    return ["子どもに合う教室を探す保護者", "講師やカリキュラムを確認したい保護者", "通いやすさや安全性を重視する人"];
  }
  if (matchesAnyText(text, ["初心者", "初めて", "社会人", "英会話"])) {
    return ["初めて英会話を始める社会人", "料金を比較する人", "口コミを重視する人", "通いやすさを重視する人"];
  }
  if (matchesAnyText(text, ["マットレス", "睡眠", "寝具"])) {
    return ["睡眠悩みを解決したい人", "価格と口コミを比較する人", "返品条件を確認したい人", "品質や素材を確認したい人"];
  }
  if (matchesAnyText(text, ["化粧品", "コスメ", "スキンケア", "肌"])) {
    return ["肌に合うか確認したい人", "成分や口コミを重視する人", "価格と定期購入条件を確認したい人"];
  }
  return profile.audienceTargets;
}

function buildServiceEvidenceReason(label: string, serviceInsight: OnboardingServiceInsight) {
  const evidence = [
    serviceInsight.sourceEvidence.fromUserServiceDescription ? "サービス説明" : "",
    serviceInsight.sourceEvidence.fromUrlTitle ? "公式URLタイトル" : "",
    serviceInsight.sourceEvidence.fromUrlDescription ? "公式URL説明文" : "",
    serviceInsight.sourceEvidence.fromSelectedFocus?.length ? "選択した見たいこと" : ""
  ].filter(Boolean);
  const source = evidence.length > 0 ? evidence.slice(0, 2).join("・") : "入力内容";
  return source + "から、" + label + "が確認しそうな判断材料を推定しています。";
}

function buildServiceInsightText(formState: WizardState, serviceSummary: string) {
  return [
    formState.targetName,
    formState.targetAliases.join(" "),
    formState.officialUrl,
    serviceSummary,
    formState.targetCategory,
    formState.audienceType,
    formState.audienceTargets.join(" "),
    formState.regions.join(" "),
    formState.watchTopics.join(" "),
    formatReportGoalLabels(formState).join(" ")
  ]
    .filter(Boolean)
    .join(" ");
}

function buildServiceInsightTextFromInsight(serviceInsight: OnboardingServiceInsight) {
  return [
    serviceInsight.brandName,
    serviceInsight.serviceName,
    serviceInsight.serviceSummary,
    serviceInsight.categoryHypothesis,
    serviceInsight.audienceType,
    serviceInsight.market.join(" "),
    serviceInsight.valueProposition.join(" "),
    serviceInsight.primaryUseCases.join(" "),
    serviceInsight.buyerContext.join(" "),
    serviceInsight.trustRequirements.join(" "),
    serviceInsight.likelyObjections.join(" "),
    serviceInsight.evidenceSignals.join(" "),
    serviceInsight.sourceEvidence.fromUrlTitle,
    serviceInsight.sourceEvidence.fromUrlDescription,
    serviceInsight.sourceEvidence.fromH1
  ]
    .filter(Boolean)
    .join(" ");
}

function buildServiceDefinitionTextFromInsight(serviceInsight: OnboardingServiceInsight) {
  return [
    serviceInsight.brandName,
    serviceInsight.serviceName,
    serviceInsight.serviceSummary,
    serviceInsight.categoryHypothesis,
    serviceInsight.audienceType,
    serviceInsight.market.join(" "),
    serviceInsight.valueProposition.join(" "),
    serviceInsight.primaryUseCases.join(" "),
    serviceInsight.trustRequirements.join(" "),
    serviceInsight.likelyObjections.join(" "),
    serviceInsight.sourceEvidence.fromUrlTitle,
    serviceInsight.sourceEvidence.fromUrlDescription,
    serviceInsight.sourceEvidence.fromH1,
    serviceInsight.sourceEvidence.fromUserServiceDescription
  ]
    .filter(Boolean)
    .join(" ");
}

function buildCustomerPersonaFrame(
  label: string,
  formState: WizardState,
  profile: OnboardingSuggestionProfile,
  source: CustomerPersonaSource,
  id: string,
  persona?: PersonaDraft,
  serviceInsight = buildOnboardingServiceInsight(formState)
): OnboardingPersonaFrame | null {
  const normalized = normalizeCustomerPersonaLabel(label, profile);
  if (!isCustomerPersonaCompatibleWithServiceInsight(normalized, profile, serviceInsight)) return null;
  const personaText = persona
    ? [
        persona.displayName,
        persona.promptAngle,
        persona.buyerStage,
        ...persona.painPoints,
        ...persona.proofNeeded,
        ...persona.comparisonAxis
      ].join(" ")
    : [normalized, serviceInsight.serviceSummary, ...serviceInsight.valueProposition, ...serviceInsight.buyerContext].join(" ");
  const decisionRole = derivePersonaDecisionRole(normalized, profile, personaText);
  return {
    id,
    label: normalized,
    description: buildCustomerPersonaDescription(normalized, profile, decisionRole, serviceInsight),
    audienceType: formState.audienceType,
    categoryProfile: mapSuggestionProfileToCategoryProfile(profile.key),
    decisionRole,
    buyerStage: derivePersonaBuyerStage(decisionRole, profile),
    triggerSituation: derivePersonaTriggerSituation(normalized, profile, personaText),
    evaluationCriteria: derivePersonaEvaluationCriteria(normalized, profile, personaText),
    proofNeeded: derivePersonaProofNeeded(normalized, profile, personaText),
    riskConcern: derivePersonaRiskConcern(normalized, profile, personaText),
    promptAngle: derivePersonaPromptAngle(normalized, profile, decisionRole, persona?.promptAngle, serviceInsight),
    serviceEvidenceReason: buildServiceEvidenceReason(normalized, serviceInsight),
    source
  };
}

function buildCustomerPersonaDescription(
  label: string,
  profile: OnboardingSuggestionProfile,
  decisionRole: OnboardingPersonaDecisionRole,
  serviceInsight: OnboardingServiceInsight
) {
  const criteria = derivePersonaEvaluationCriteria(label, profile, serviceInsight.serviceSummary).slice(0, 2).join("・");
  const service = serviceInsight.categoryHypothesis || "このサービス";
  if (decisionRole === "decision_owner") return label + "が" + service + "を判断する前に確認したい" + criteria + "を見ます。";
  return label + "が" + service + "を選ぶ時に重視しやすい" + criteria + "を見ます。";
}

function mapSuggestionProfileToCategoryProfile(profileKey: OnboardingSuggestionProfileKey): OnboardingCategoryProfile {
  const map: Record<OnboardingSuggestionProfileKey, OnboardingCategoryProfile> = {
    b2bSaasOrSeo: "b2b_saas_or_seo",
    b2bProfessionalService: "b2b_professional_service",
    b2cSchoolEducation: "b2c_school_education",
    healthcareClinic: "healthcare_clinic",
    localService: "local_service",
    ecommerceProduct: "ecommerce_product",
    genericB2C: "generic_b2c",
    genericB2B: "generic_b2b"
  };
  return map[profileKey];
}

function derivePersonaDecisionRole(
  label: string,
  profile: OnboardingSuggestionProfile,
  sourceText: string
): OnboardingPersonaDecisionRole {
  const text = normalizeText(label + " " + sourceText);
  if (profile.key === "ecommerceProduct") {
    if (matchesAnyText(text, ["返品", "リスク"])) return "risk_checker";
    if (matchesAnyText(text, ["品質", "素材", "スペック"])) return "quality_checker";
    if (matchesAnyText(text, ["口コミ", "評判", "レビュー"])) return "review_checker";
    if (matchesAnyText(text, ["価格", "料金", "費用"])) return "price_checker";
    return "first_time_buyer";
  }
  if (profile.key === "healthcareClinic") {
    if (matchesAnyText(text, ["リスク", "安全", "説明"])) return "risk_checker";
    if (matchesAnyText(text, ["資格", "専門", "医師"])) return "quality_checker";
    if (matchesAnyText(text, ["口コミ", "評判", "レビュー"])) return "review_checker";
    if (matchesAnyText(text, ["料金", "費用", "価格"])) return "price_checker";
    return "first_time_buyer";
  }
  if (profile.key === "b2cSchoolEducation" || profile.key === "localService" || profile.key === "genericB2C") {
    if (matchesAnyText(text, ["口コミ", "評判", "レビュー"])) return "review_checker";
    if (matchesAnyText(text, ["料金", "費用", "価格"])) return "price_checker";
    if (matchesAnyText(text, ["品質", "専門", "実績"])) return "quality_checker";
    return "first_time_buyer";
  }
  if (matchesAnyText(text, ["導入", "判断", "責任", "経営", "役員", "decision"])) return "decision_owner";
  if (matchesAnyText(text, ["利用", "運用", "現場", "user"])) return "practical_user";
  return "evaluator";
}

function derivePersonaBuyerStage(decisionRole: OnboardingPersonaDecisionRole, profile: OnboardingSuggestionProfile) {
  if (decisionRole === "decision_owner") return "導入前の最終判断";
  if (decisionRole === "practical_user") return "実利用前の確認";
  if (profile.key === "healthcareClinic") return "初回相談前の比較";
  if (profile.key === "ecommerceProduct") return "購入前の比較";
  if (profile.key === "b2cSchoolEducation") return "申し込み前の比較";
  return "候補比較中";
}

function derivePersonaTriggerSituation(label: string, profile: OnboardingSuggestionProfile, sourceText: string) {
  if (profile.key === "b2bSaasOrSeo") return "AI検索やSEO施策の候補を比較し、社内で説明できる根拠を探している。";
  if (profile.key === "b2bProfessionalService") return "相談先を絞る前に、実績や専門性を確認している。";
  if (profile.key === "b2cSchoolEducation") return "初めて選ぶ前に、料金・口コミ・通いやすさを比べている。";
  if (profile.key === "healthcareClinic") return "初回相談前に、料金・口コミ・資格・リスク説明を確認している。";
  if (profile.key === "localService") return "近くで予約や来店を検討し、口コミや対応範囲を確認している。";
  if (profile.key === "ecommerceProduct") return "購入前に、価格・口コミ・品質・返品条件を比べている。";
  return sourceText.includes(label) ? "候補を比較する前に確認点を整理している。" : "サービス選定前に確認点を整理している。";
}

function derivePersonaEvaluationCriteria(label: string, profile: OnboardingSuggestionProfile, sourceText: string) {
  const text = normalizeText(label + " " + sourceText);
  if (profile.key === "b2bSaasOrSeo") return uniqueStrings(["効果指標", "改善余地", "公式サイト引用", "候補選定", "運用負荷"]);
  if (profile.key === "b2bProfessionalService") return uniqueStrings(["実績", "専門性", "料金", "相談前の確認点", "信頼性"]);
  if (profile.key === "b2cSchoolEducation") return uniqueStrings(["料金", "口コミ", "初心者向けか", "通いやすさ", "体験しやすさ"]);
  if (profile.key === "healthcareClinic") return uniqueStrings(["料金", "口コミ", "資格・専門性", "リスク説明", "初回相談のしやすさ"]);
  if (profile.key === "localService") return uniqueStrings(["近さ", "予約しやすさ", "料金", "口コミ", "対応エリア"]);
  if (profile.key === "ecommerceProduct") return uniqueStrings(["価格", "口コミ", "品質", "返品条件", "自分に合うか"]);
  if (matchesAnyText(text, ["価格", "料金", "費用"])) return ["料金", "比較しやすさ", "納得感"];
  return ["比較軸", "信頼材料", "不安点"];
}

function derivePersonaProofNeeded(label: string, profile: OnboardingSuggestionProfile, sourceText: string) {
  if (profile.key === "b2bSaasOrSeo") return ["公式サイトの根拠", "比較理由", "導入前に説明できる材料"];
  if (profile.key === "healthcareClinic") return ["資格・専門性", "説明の分かりやすさ", "口コミの傾向"];
  if (profile.key === "ecommerceProduct") return ["レビュー", "品質説明", "返品条件"];
  if (profile.key === "b2cSchoolEducation") return ["口コミ", "料金説明", "体験・相談のしやすさ"];
  if (profile.key === "localService") return ["口コミ", "対応エリア", "予約条件"];
  return ["実績", "料金説明", "信頼材料"];
}

function derivePersonaRiskConcern(label: string, profile: OnboardingSuggestionProfile, sourceText: string) {
  if (profile.key === "b2bSaasOrSeo") return ["費用対効果が説明しにくい", "運用負荷が見えにくい", "既存施策との差分が曖昧"];
  if (profile.key === "healthcareClinic") return ["料金が分かりにくい", "リスク説明が足りない", "専門性を判断しにくい"];
  if (profile.key === "ecommerceProduct") return ["期待と違う", "品質が判断しにくい", "返品条件が分かりにくい"];
  if (profile.key === "b2cSchoolEducation") return ["続けられるか分からない", "料金差が分かりにくい", "自分に合うか不安"];
  if (profile.key === "localService") return ["予約しにくい", "対応範囲が分かりにくい", "口コミだけでは判断しにくい"];
  return ["比較軸が曖昧", "信頼材料が足りない"];
}

function derivePersonaPromptAngle(
  label: string,
  profile: OnboardingSuggestionProfile,
  decisionRole: OnboardingPersonaDecisionRole,
  generatedPromptAngle?: string,
  serviceInsight?: OnboardingServiceInsight
) {
  const generated = generatedPromptAngle?.trim();
  if (generated && !containsRawPersonaLanguage(generated)) return generated;
  if (serviceInsight) {
    const criteria = serviceInsight.trustRequirements.length > 0 ? serviceInsight.trustRequirements.slice(0, 3).join("、") : derivePersonaEvaluationCriteria(label, profile, serviceInsight.serviceSummary).slice(0, 3).join("、");
    return label + "が" + serviceInsight.categoryHypothesis + "を選ぶ前に確認したい" + criteria + "の論点。";
  }
  if (profile.key === "b2bSaasOrSeo") return label + "がAI検索・SEOの検討前に確認したい効果指標、候補選定、公式サイト引用の論点。";
  if (profile.key === "healthcareClinic") return label + "が初回相談前に確認したい料金、口コミ、資格、リスク説明の論点。";
  if (profile.key === "ecommerceProduct") return label + "が購入前に確認したい価格、口コミ、品質、返品条件の論点。";
  if (profile.key === "b2cSchoolEducation") return label + "が申し込み前に確認したい料金、口コミ、通いやすさ、自分に合うかの論点。";
  if (profile.key === "localService") return label + "が予約・来店前に確認したい近さ、口コミ、料金、対応範囲の論点。";
  if (decisionRole === "decision_owner") return label + "が判断前に確認したい費用、比較理由、信頼材料の論点。";
  return label + "が比較前に確認したい評価軸と不安点。";
}

function buildCustomerPersonaSourceKey(formState: WizardState) {
  return JSON.stringify({
    brandName: formState.targetName,
    targetDescription: formState.targetDescription,
    targetCategory: formState.targetCategory,
    audienceType: formState.audienceType,
    audienceTargets: formState.audienceTargets,
    regions: formState.regions,
    language: formState.language,
    watchTopics: formState.watchTopics,
    reportGoals: formState.reportGoals
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

function isCustomerPersonaCompatibleWithServiceInsight(
  label: string,
  profile: OnboardingSuggestionProfile,
  serviceInsight: OnboardingServiceInsight
) {
  const normalized = normalizeCustomerPersonaLabel(label, profile);
  const serviceDefinitionText = buildServiceDefinitionTextFromInsight(serviceInsight);
  if (!isNaturalCustomerPersonaLabel(normalized, profile)) return false;
  if (containsRawPersonaLanguage(normalized)) return false;
  if (isConsumerSuggestionProfile(profile.key) && containsB2BPersonaLanguage(normalized)) return false;
  if (serviceInsight.audienceType === "b2c" && containsB2BPersonaLanguage(normalized)) return false;
  if (serviceInsight.audienceType === "b2b" && containsConsumerPersonaLanguage(normalized) && !matchesAnyText(normalized, ["担当者", "責任者", "経営者", "役員"])) {
    return false;
  }
  if (profile.key === "ecommerceProduct" && matchesAnyText(serviceDefinitionText, ["マットレス", "睡眠", "寝具"])) {
    return !matchesAnyText(normalized, ["肌", "成分", "化粧品"]);
  }
  if (profile.key === "ecommerceProduct" && matchesAnyText(serviceDefinitionText, ["化粧品", "コスメ", "スキンケア", "肌"])) {
    return !matchesAnyText(normalized, ["睡眠", "寝具", "マットレス"]);
  }
  if (profile.key === "b2cSchoolEducation" && matchesAnyText(serviceDefinitionText, ["子ども", "こども", "キッズ", "保護者"])) {
    return !matchesAnyText(normalized, ["社会人"]);
  }
  return isCustomerPersonaCompatibleWithProfile(normalized, profile);
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
    "社内承認",
    "稟議",
    "導入",
    "費用対効果",
    "運用負荷",
    "既存ツール",
    "システム連携",
    "セキュリティ",
    "ベンダー選定",
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
    .replace(/^BtoB \/ .+?の導入判断者の立場で、/, "導入を判断する立場で、")
    .replace(/^BtoB \/ .+?の比較評価担当者の立場で、/, "比較検討する立場で、")
    .replace(/^BtoB \/ .+?の現場利用者の立場で、/, "実際に利用する立場で、")
    .replace(/^BtoC(?: \/ EC)?。主な検討者: [^。]+。の[^。、]+の立場で、/, "利用者の立場で、")
    .replace(/^BtoC \/ [^。]+。の[^。、]+の立場で、/, "利用者の立場で、")
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
  const serviceInsight = buildOnboardingServiceInsight(formState);
  const personas = buildCustomerPersonas(formState, [], profile, serviceInsight).map((persona) => persona.label).slice(0, 4);
  const personaText = personas.length > 0 ? personas.join("、") : "確認したい顧客層";
  const category = serviceInsight.categoryHypothesis || formState.targetCategory.trim() || profile.serviceCategories[0] || "サービス";
  const context = serviceInsight.primaryUseCases.length > 0 ? ` 主な確認場面: ${serviceInsight.primaryUseCases.slice(0, 3).join("、")}。` : "";

  if (formState.audienceType === "b2c") {
    return `BtoC / ${category}。主な検討者: ${personaText}。${context}`;
  }
  if (formState.audienceType === "both_or_confirm") {
    return `${category}の主な検討者: ${personaText}。BtoB/BtoCは確認中。${context}`;
  }
  return `BtoB / ${category}。主な検討者: ${personaText}。${context}`;
}

function buildAnalysisTargetFormInput(formState: WizardState): AnalysisTargetFormInput {
  return {
    targetType: formState.targetType,
    targetName: formState.targetName,
    targetAliases: formState.targetAliases,
    officialUrl: formState.officialUrl,
    mainBusiness: formState.mainBusiness,
    organizationName: formState.organizationName,
    productScope: formState.productScope,
    deliveryFormat: formState.deliveryFormat,
    storeLocation: formState.storeLocation
  };
}

function buildTargetIdentificationSummaryItems(target: AnalysisTargetDraft | null) {
  if (!target) return [];
  if (target.targetType === "company") return [{ label: "主な事業", value: target.mainBusiness }];
  if (target.targetType === "brand") return [{ label: "運営会社", value: target.operatorName }];
  if (target.targetType === "product") {
    return [
      { label: "ブランド・メーカー", value: target.organizationName },
      { label: "対象範囲", value: target.productScope === "single_product" ? "単一商品" : "商品シリーズ" }
    ];
  }
  if (target.targetType === "service") {
    return [
      { label: "提供会社・ブランド", value: target.organizationName },
      { label: "提供形式", value: target.deliveryFormat }
    ];
  }
  return [
    { label: "店舗所在地", value: target.location },
    { label: "所属チェーン・ブランド", value: target.organizationName || "独立店舗 / 未入力" }
  ];
}

function buildSeedInput(formState: WizardState): ProjectSetupSeedInput {
  const target = buildAnalysisTargetDraft(buildAnalysisTargetFormInput(formState));
  const legacyTarget = target
    ? toLegacyProjectSetupTargetSeed(target)
    : {
        companyName: formState.targetName.trim(),
        brandName: formState.targetName.trim(),
        serviceName: formState.targetName.trim(),
        brandAliases: formState.targetAliases,
        officialSiteUrl: normalizeTargetUrlForSeed(formState.officialUrl),
        identificationContext: ""
      };

  return {
    companyName: legacyTarget.companyName,
    brandName: legacyTarget.brandName,
    officialSiteUrl: legacyTarget.officialSiteUrl,
    productOrServiceDescription: [
      legacyTarget.identificationContext,
      formState.targetDescription.trim(),
      formState.watchTopics.length ? `見たいこと: ${formState.watchTopics.join("、")}` : "",
      formatReportGoalLabels(formState).length ? `今回知りたいこと: ${formatReportGoalLabels(formState).join("、")}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    industryCategory: formState.targetCategory.trim(),
    targetCustomers: buildNaturalTargetCustomers(formState),
    regions: formState.regions,
    language: formState.language,
    serviceName: legacyTarget.serviceName || undefined,
    brandAliases: legacyTarget.brandAliases,
    knownCompetitors: [],
    strengths: [],
    knownRisks: [],
    diagnosisGoals: mapReportGoalsToPromptIntents(formState.reportGoals)
  };
}

function buildConfirmationSections(formState: WizardState) {
  const target = buildAnalysisTargetDraft(buildAnalysisTargetFormInput(formState));
  const contract = formState.targetType ? getAnalysisTargetUiContract(formState.targetType) : null;
  return [
    {
      title: "分析対象",
      stepIndex: 0,
      items: [
        { label: "対象種別", value: getAnalysisTargetLabel(formState.targetType) },
        { label: contract?.nameLabel ?? "分析対象名", value: formState.targetName || "未入力" },
        { label: contract?.urlLabel ?? "公式URL", value: formState.officialUrl || "未入力" },
        { label: contract?.aliasesLabel ?? "別名・表記ゆれ", value: formState.targetAliases.length ? formatList(formState.targetAliases) : "別名なし" },
        ...buildTargetIdentificationSummaryItems(target)
      ]
    },
    {
      title: "計測設定",
      stepIndex: 1,
      items: [
        { label: "分析対象の概要", value: formState.targetDescription || "未入力" },
        { label: "カテゴリ", value: formState.targetCategory || "未入力" },
        { label: "顧客タイプ", value: formatAudienceType(formState.audienceType) },
        { label: "地域", value: formatList(formState.regions) },
        { label: "言語", value: formatLanguage(formState.language) },
        { label: "AIモデル", value: formatAiModelLabels(formState.aiModels) }
      ]
    },
    {
      title: "確認したいこと",
      stepIndex: 2,
      items: [
        { label: "確認項目", value: formatList(formState.watchTopics) },
        { label: "その他", value: formState.reportGoalInput.trim() || "なし" }
      ]
    }
  ];
}

function ConfirmationSection({
  title,
  items,
  onEdit
}: {
  title: string;
  items: { label: string; value: string }[];
  onEdit: () => void;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-[#E1E8E5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#0B1F17]">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-[#075E44] hover:underline">
          編集
        </button>
      </div>
      <dl className="mt-3 space-y-3">
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

function PromptSummaryList({ prompts, onEdit }: { prompts: EditablePrompt[]; onEdit: () => void }) {
  const allPrompts = prompts.filter((prompt) => prompt.text.trim());
  const orderedPrompts = [
    ...allPrompts.filter(isCustomPrompt),
    ...allPrompts.filter((prompt) => !isCustomPrompt(prompt))
  ];
  const visiblePrompts = orderedPrompts.slice(0, 3);

  return (
    <section className="min-w-0 rounded-xl border border-[#E1E8E5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0B1F17]">質問</h3>
          <p className="mt-1 text-xs leading-5 text-[#64736C]">{allPrompts.length}件</p>
        </div>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-[#075E44] hover:underline">
          すべて確認
        </button>
      </div>
      {visiblePrompts.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {visiblePrompts.map((prompt, index) => (
            <li key={prompt.id} className="flex gap-2 rounded-lg bg-[#F8FBFA] px-3 py-2 text-sm leading-6 text-[#0B1F17]">
              <span className="shrink-0 font-bold text-[#075E44]">{index + 1}.</span>
              <span className="min-w-0 break-words">{prompt.text}</span>
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
  return prompt.id.startsWith("custom-") || prompt.id.startsWith("prompt-custom-");
}

function getStepBlockers(stepIndex: number, formState: WizardState) {
  const blockers: string[] = [];
  if (stepIndex === 0) {
    blockers.push(...validateAnalysisTargetInput(buildAnalysisTargetFormInput(formState)));
  }

  if (stepIndex === 1) {
    if (!formState.targetDescription.trim()) blockers.push("分析対象の概要を入力してください。");
    if (!formState.targetCategory.trim()) blockers.push("カテゴリを入力してください。");
    if (formState.regions.length === 0) blockers.push("対象市場・地域を1件以上入力してください。");
    if (formState.aiModels.length === 0) blockers.push("対象AIモデルを1件以上選んでください。");
  }

  if (stepIndex === 2) {
    if (formState.watchTopics.length === 0) blockers.push("確認したいことを1件以上選んでください。");
  }

  return blockers;
}

function buildSuggestedServiceDescriptionForStep(state: WizardState, inspection: SiteInspectionResult | null) {
  const inspectedDescription = inspection?.suggestedServiceDescription?.trim();
  if (inspectedDescription) return inspectedDescription;
  const metadataDescription = inspection ? [inspection.description, inspection.h1, inspection.title].find((value) => value?.trim()) : null;
  if (metadataDescription) return metadataDescription.trim();

  const targetName = state.targetName.trim() || "分析対象";
  const targetTypeLabel = getAnalysisTargetLabel(state.targetType);
  const hostname = extractHostname(normalizeTargetUrlForSeed(state.officialUrl));
  return hostname
    ? `${targetTypeLabel}「${targetName}」（${hostname}）の内容をもとに、AI検索での見え方を確認する対象です。`
    : `${targetTypeLabel}「${targetName}」の内容をもとに、AI検索での見え方を確認する対象です。`;
}

function buildSuggestedServiceCategoryForStep(
  state: WizardState,
  inspection: SiteInspectionResult | null,
  targetDescription: string
) {
  const inspectedCategory = inspection?.suggestedCategory?.trim();
  if (inspectedCategory && inspectedCategory !== "その他") return inspectedCategory;
  return inferInterimCategory(state, inspection, targetDescription);
}

function inferAudienceTargetsForStep(state: WizardState, targetCategory: string) {
  const nextState = { ...state, targetCategory };
  const profile = deriveOnboardingSuggestionProfile(nextState);
  const serviceInsight = buildOnboardingServiceInsight(nextState);
  return uniqueStrings([...proposePersonaLabelsFromServiceInsight(serviceInsight, profile), ...profile.audienceTargets]).slice(0, 3);
}

function inferInterimCategory(
  formState: WizardState,
  inspection: SiteInspectionResult | null = null,
  targetDescription = formState.targetDescription
) {
  const text = normalizeText(
    [
      formState.targetName,
      formState.targetAliases.join(" "),
      formState.officialUrl,
      targetDescription,
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
  if (matchesAnyText(text, ["AI検索", "LLMO", "GEO", "AIO", "AI search", "SEO", "Mieruca", "ミエルカ"])) {
    return "SEO / AI検索対策";
  }
  if (matchesEcommerceText(text)) return "EC / 商品";
  if (matchesAnyText(text, ["マーケティング", "広告", "コンテンツ", "集客"])) return "マーケティング / SEO";
  if (matchesAnyText(text, ["採用", "HR", "人事", "recruit", "求人"])) return "採用 / HR";
  if (matchesAnyText(text, ["英会話", "スクール", "学校", "教育", "講座", "school", "lesson", "english"])) {
    return "スクール / 教育";
  }
  if (matchesAnyText(text, ["clinic", "クリニック", "医療", "病院"])) return "クリニック / 医療";
  if (matchesEcommerceText(text)) return "EC / 商品";
  if (matchesAnyText(text, ["地域", "店舗", "予約", "来店", "local", "エリア"])) return "地域サービス";
  if (matchesAnyText(text, ["SaaS", "分析", "analytics", "dashboard", "ツール", "platform"])) return "SaaS / 分析ツール";
  return "その他";
}

function deriveOnboardingSuggestionProfile(
  state: Pick<
    WizardState,
    "targetType" | "targetName" | "targetAliases" | "officialUrl" | "targetDescription" | "targetCategory" | "audienceType" | "audienceTargets"
  >
): OnboardingSuggestionProfile {
  const text = normalizeText(
    [state.targetType ?? "", state.targetName, state.targetAliases.join(" "), state.targetDescription, state.targetCategory, state.audienceType]
      .filter(Boolean)
      .join(" ")
  );

  if (state.targetType === "store") return suggestionProfiles.localService;
  if (state.targetType === "product" && matchesEcommerceText(text)) return suggestionProfiles.ecommerceProduct;
  if (matchesAnyText(text, ["英会話", "スクール", "教育", "学校", "講座", "school", "lesson", "english"])) return suggestionProfiles.b2cSchoolEducation;
  if (matchesAnyText(text, ["クリニック", "医療", "美容", "病院", "clinic", "medical"])) return suggestionProfiles.healthcareClinic;
  if (matchesAnyText(text, ["地域", "店舗", "予約", "来店", "local", "エリア", "近く"])) return suggestionProfiles.localService;
  if (matchesEcommerceText(text)) return suggestionProfiles.ecommerceProduct;
  if (matchesAnyText(text, ["士業", "法律", "会計", "コンサル", "専門サービス", "相談", "professional"])) return suggestionProfiles.b2bProfessionalService;
  if (matchesAnyText(text, ["採用", "HR", "人事", "求人", "候補者", "面接", "ATS", "recruit"])) return suggestionProfiles.genericB2B;
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
  const brandSignals = [formState.targetName, ...formState.targetAliases].map(normalizeText).filter(Boolean);
  if (brandSignals.some((signal) => normalized.includes(signal))) return "brand";
  if (normalized.includes("引用") || normalized.includes("根拠") || normalized.includes("参照")) return "citation";
  if (normalized.includes("候補") || normalized.includes("比較") || normalized.includes("おすすめ")) return "candidate";
  return "review";
}

function mapReportGoalsToPromptIntents(goals: readonly ReportGoal[]): PromptIntent[] {
  const mapped = goals.flatMap((goal): PromptIntent[] => {
    if (goal === "visibility") return ["non_branded"];
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

function formatAiModelLabels(values: readonly AiModel[]) {
  return formatList(
    values.map((value) => aiModelOptions.find((option) => option.value === value)?.label ?? value)
  );
}

function formatReportGoalLabels(formState: WizardState) {
  const options = deriveOnboardingSuggestionProfile(formState).reportGoalOptions;
  const labels = formState.reportGoals.map((goal) => {
    if (goal === "other") return "";
    return options.find((option) => option.value === goal)?.label ?? defaultReportGoalOptions.find((option) => option.value === goal)?.label ?? goal;
  });
  if (formState.reportGoalInput.trim()) labels.push(formState.reportGoalInput.trim());
  return uniqueStrings(labels);
}

function translateSeedBlocker(value: string) {
  const map: Record<string, string> = {
    "seedInput.companyName is required": "分析対象名を確認してください。",
    "seedInput.brandName is required": "分析対象名を確認してください。",
    "seedInput.officialSiteUrl is required": "分析対象のURLを確認してください。",
    "seedInput.productOrServiceDescription is required": "分析対象の概要を確認してください。",
    "seedInput.industryCategory is required": "カテゴリを確認してください。",
    "seedInput.targetCustomers is required": "対象顧客の設定を確認してください。",
    "seedInput.regions must include at least one region": "対象市場・地域を確認してください。",
    "seedInput.language is required": "言語を確認してください。",
    "seedInput.officialSiteUrl must be an http or https URL": "分析対象のURL形式を確認してください。"
  };
  return map[value] ?? (value.endsWith("。") ? value : "Recora側で確認が必要な項目があります。");
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
    targetType: formState.targetType,
    targetName: normalizeText(formState.targetName),
    targetAliases: formState.targetAliases.map(normalizeText),
    officialUrl: normalizeTargetUrlForSeed(formState.officialUrl)
  });
}

function matchesAnyText(text: string, candidates: readonly string[]) {
  const normalizedText = normalizeText(text);
  return candidates.some((candidate) => normalizedText.includes(normalizeText(candidate)));
}

function matchesEcommerceText(text: string) {
  const normalizedText = normalizeText(text);
  return /(^|[^a-z0-9])ec([^a-z0-9]|$)/i.test(normalizedText) || matchesAnyText(normalizedText, ["D2C", "通販", "商品", "shop", "store", "ecommerce", "e-commerce", "返品"]);
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
