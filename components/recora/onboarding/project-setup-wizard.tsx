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
  GripVertical,
  Info,
  Loader2,
  MessageSquareText,
  Plus,
  SearchCheck,
  Sparkles,
  Target,
  Trash2,
  Wand2,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { derivePromptMetricEligibility, validateProjectSetupSeedInput } from "@/lib/recora/project-setup-draft";
import type {
  BrandIdentityForDraft,
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

type SiteInspectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SiteInspectionResult }
  | { status: "failed"; message: string; code?: string; warnings?: SiteInspectionWarning[] };

type ConfirmationRow = {
  label: string;
  value: ReactNode;
};

type UpdateForm = <K extends keyof WizardState>(field: K, value: WizardState[K]) => void;

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

const audienceSuggestionsByType: Record<AudienceType, string[]> = {
  b2b: ["マーケティング担当者", "Web担当者", "経営者", "比較評価担当者", "現場利用者"],
  b2c: ["初めて検討する人", "口コミを重視する人", "価格を比較する人", "家族や同僚に相談する人"],
  both_or_confirm: ["マーケティング担当者", "個人の比較検討者", "利用者", "紹介・推薦する人"]
};

const regionSuggestions = ["日本", "首都圏", "関西", "全国", "英語圏", "北米", "アジア"];

const watchTopicOptions = [
  "AI検索での露出・存在感",
  "競合との比較（強み・弱み）",
  "公式サイトの引用状況",
  "ユーザーの関心（検索テーマ）",
  "ブランドの認知・想起",
  "市場トレンド・話題の変化",
  "コンテンツの評価・改善点"
];

const reportGoalOptions = [
  { value: "visibility", label: "AI検索で自社が候補に選ばれるための改善点を知りたい" },
  { value: "competitor", label: "競合と比べたときの強み・弱みを把握したい" },
  { value: "citation", label: "公式サイトが引用されやすいページを知りたい" },
  { value: "brand", label: "ブランドの認知・想起の状況を確認したい" },
  { value: "improvement", label: "ユーザーがどんなテーマを知りたがっているか知りたい" },
  { value: "other", label: "その他" }
] as const;

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

  const seedInput = useMemo(() => buildSeedInput(formState), [formState]);
  const seedKey = useMemo(() => stableSeedKey(seedInput), [seedInput]);
  const currentStepBlockers = getStepBlockers(stepIndex, formState);
  const showCurrentBlockers = attemptedSteps[stepIndex] && currentStepBlockers.length > 0;
  const seedBlockers = useMemo(() => validateProjectSetupSeedInput(seedInput), [seedInput]);
  const isInspectingSite = siteInspection.status === "loading";

  const updateForm: UpdateForm = (field, value) => {
    setConfirmationDone(false);
    setFormState((current) => ({ ...current, [field]: value }));
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
      setSiteInspection(inspection);
      setFormState((current) => applyServiceSuggestions(current, inspection.status === "success" ? inspection.result : null));
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
  const audienceSuggestions = audienceSuggestionsByType[formState.audienceType];

  return (
    <WizardCard
      size="wide"
      icon={<Wand2 />}
      title="サービス理解・市場・顧客層・競合"
      description="サービスの内容や市場・競合について教えてください。"
    >
      <SiteInspectionPanel formState={formState} siteInspection={siteInspection} />

      <div className="mt-4 rounded-xl border border-[#CFE2DA] bg-[#F2FAF6] p-4">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#1B8B65]" />
          <div>
            <h3 className="text-sm font-bold text-[#075E44]">Recoraからの提案</h3>
            <p className="mt-1 text-sm leading-6 text-[#506158]">
              公式URLのページ情報と入力内容をもとに、以下の候補を入れています。必要なら編集してください。
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <TextareaInput
          label="どんなサービスですか？"
          value={formState.serviceDescription}
          onChange={(value) => updateForm("serviceDescription", value)}
          required
          rows={4}
          placeholder="サービスの目的、提供価値、主な機能や特徴を入力してください。"
        />
        <SelectLikeInput
          label="サービスカテゴリ"
          value={formState.serviceCategory}
          onChange={(value) => updateForm("serviceCategory", value)}
          required
          placeholder="例 SEO / AI検索対策"
          suggestions={["SEO / AI検索対策", "マーケティング / SEO", "SaaS / 分析ツール", "地域サービス", "クリニック / スクール", "その他"]}
        />
        <div>
          <p className="text-sm font-bold text-[#334155]">提供形態</p>
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
        <div className="grid gap-5 sm:grid-cols-2">
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
          label="主に見たい相手"
          items={formState.audienceTargets}
          inputValue={formState.audienceTargetInput}
          onInputChange={(value) => updateForm("audienceTargetInput", value)}
          onAdd={(value) => updateForm("audienceTargets", addUnique(formState.audienceTargets, value))}
          onRemove={(value) => updateForm("audienceTargets", removeValue(formState.audienceTargets, value))}
          placeholder="例 マーケティング担当者"
          suggestions={audienceSuggestions}
        />
        <section className="rounded-xl border border-[#E1E8E5] bg-white p-4">
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
    <div className="rounded-xl border border-[#CFE2DA] bg-white p-4 text-sm leading-6 text-[#20352C]">
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

          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
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
  return (
    <WizardCard
      icon={<Target className="h-9 w-9" />}
      title="見たいこと"
      description="特に知りたいテーマを選択してください。上位3つ程度を目安にすると、確認しやすくなります。"
      footer="選択内容をもとに、次のステップでプロンプト例をご提案します。"
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#0B1F17]">特に見たいこと</h3>
            <Badge variant="outline" className="border-[#D6E2DD] bg-white text-[#64736C]">
              上位3つまで
            </Badge>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-3 space-y-2">
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
  return (
    <WizardCard
      icon={<MessageSquareText className="h-9 w-9" />}
      title="プロンプト例"
      description="入力内容をもとに、診断で確認する領域と質問例を整理しました。"
      footer="ここでは診断で使う質問文の方向性だけを確認します。"
    >
      {draftPreview ? <DraftPreviewSummary draftPreview={draftPreview} /> : null}

      <div className="space-y-3">
        {prompts.length > 0 ? (
          prompts.map((prompt, index) => (
            <PromptCard
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
          <div className="rounded-xl border border-dashed border-[#C8D8D2] bg-[#F8FBFA] p-5 text-sm leading-6 text-[#64736C]">
            追加したいプロンプトを下の欄から入力してください。
          </div>
        )}
      </div>
      <div className="mt-5 rounded-xl border border-[#E1E8E5] bg-white p-4">
        <TextareaInput
          label="追加したいプロンプトがあれば入力してください"
          value={newPromptText}
          onChange={setNewPromptText}
          rows={3}
          placeholder="例 海外市場での評判や評価はどうですか？"
        />
        <Button type="button" variant="outline" className="mt-3 w-full border-[#C9D8D2] text-[#075E44]" onClick={onAddPrompt}>
          <Plus className="h-4 w-4" />
          プロンプトを追加
        </Button>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-[#7A8982]">
        追加・編集した内容は最終確認に反映されます。
      </p>
    </WizardCard>
  );
}

function DraftPreviewSummary({ draftPreview }: { draftPreview: CustomerFacingDraftPreview }) {
  return (
    <div className="mb-5 grid gap-3">
      <PreviewSection title="サービスカテゴリ" values={draftPreview.serviceCategories} emptyText="未入力" />
      <PreviewSection title="主に見たい相手" values={draftPreview.audienceTargets} emptyText="未入力" />
      <PreviewSection title="質問領域" values={draftPreview.questionAreas} emptyText="未入力" />
    </div>
  );
}

function PreviewSection({ title, values, emptyText }: { title: string; values: readonly string[]; emptyText: string }) {
  return (
    <section className="rounded-xl border border-[#E1E8E5] bg-[#F8FBFA] p-4">
      <h3 className="text-sm font-bold text-[#0B1F17]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span key={value} className="rounded-full bg-white px-3 py-1 text-xs font-semibold leading-5 text-[#506158] ring-1 ring-[#DDE8E5]">
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
  const rows = buildConfirmationRows(formState, draftPreview, prompts);

  return (
    <WizardCard
      icon={<ClipboardCheck className="h-9 w-9" />}
      title="最終確認"
      description="入力内容のサマリーです。この内容でよろしければ完了してください。"
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
      <div className="overflow-hidden rounded-xl border border-[#E1E8E5] bg-white">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2 border-b border-[#EAF0ED] p-4 last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="text-sm font-bold text-[#506158]">{row.label}</div>
            <div className="min-w-0 text-sm leading-6 text-[#0B1F17]">{row.value}</div>
          </div>
        ))}
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
        この画面では保存・承認・計測反映は行いません。
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
        "mx-auto rounded-xl border border-[#E1E8E5] bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.07)] sm:p-5",
        size === "wide" ? "max-w-3xl" : "max-w-xl"
      )}
    >
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F6F3] text-[#075E44] [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-normal text-[#0B1F17]">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-[#64736C]">{description}</p>
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
        "rounded-xl border px-4 py-3 text-left transition",
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
        "flex min-h-[78px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold leading-6 transition",
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

function PromptCard({
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
    <div className="rounded-xl border border-[#E1E8E5] bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#075E44] text-sm font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#D6E2DD] bg-[#F8FBFA] text-[#64736C]">
              {formatPromptGroup(prompt.group)}
            </Badge>
          </div>
          <textarea
            className="w-full resize-y rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] px-3 py-3 text-sm leading-6 text-[#0B1F17] outline-none focus:border-[#1B8B65] focus:ring-2 focus:ring-[#1B8B65]/15"
            rows={2}
            value={prompt.text}
            onChange={(event) => onChange({ ...prompt, text: event.target.value })}
            aria-label={`プロンプト例 ${index + 1}`}
          />
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <span className="rounded-lg p-2 text-[#A3AEA8]" aria-hidden="true">
            <GripVertical className="h-4 w-4" />
          </span>
          <button
            type="button"
            className="rounded-lg border border-[#E1E8E5] p-2 text-[#7A8982] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            onClick={onRemove}
            aria-label={`プロンプト例 ${index + 1}を削除`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
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

function applyServiceSuggestions(state: WizardState, inspection: SiteInspectionResult | null = null): WizardState {
  const brandName = state.brandName.trim() || "対象サービス";
  const inspectedDescription = inspection?.suggestedServiceDescription?.trim() ?? "";
  const inspectedCategory = inspection?.suggestedCategory?.trim() ?? "";
  const serviceDescription =
    state.serviceDescription.trim() ||
    inspectedDescription ||
    `AI検索で、${brandName}がどのように候補として表示されるかを確認するためのサービス。`;
  const serviceCategory = state.serviceCategory.trim() || inspectedCategory || inferInterimCategory(state);
  const audienceTargets =
    state.audienceTargets.length > 0 ? state.audienceTargets : audienceSuggestionsByType[state.audienceType].slice(0, 3);

  return {
    ...state,
    serviceDescription,
    serviceCategory,
    audienceTargets
  };
}

function buildCustomerFacingDraftPreview(seedInput: ProjectSetupSeedInput, formState: WizardState): CustomerFacingDraftPreview {
  const result = generateProjectSetupDraft(seedInput);
  const brandIdentity = buildBrandIdentity(seedInput);
  const generated = result.draft.prompts.slice(0, 5).map((prompt) => ({
    id: prompt.promptId,
    text: prompt.text,
    group: classifyGeneratedPrompt(prompt, derivePromptMetricEligibility(prompt, brandIdentity))
  }));
  const fallback = buildFallbackPrompts(formState);
  const prompts = uniquePrompts([...generated, ...fallback]).slice(0, 5);
  const serviceCategories = uniqueStrings([seedInput.industryCategory, formState.serviceCategory]).slice(0, 3);
  const audienceTargets = uniqueStrings([
    ...result.draft.personas.map((persona) => persona.displayName),
    ...formState.audienceTargets
  ]).slice(0, 5);
  const questionAreas = uniqueStrings(
    result.draft.topics.map((topic) => buildCustomerFacingQuestionArea(topic.topicName, topic.diagnosisGoal))
  ).slice(0, 6);

  return {
    serviceCategories,
    audienceTargets,
    questionAreas,
    prompts
  };
}

function buildFallbackPrompts(formState: WizardState): EditablePrompt[] {
  const category = formState.serviceCategory || "このカテゴリのサービス";
  const brand = formState.brandName || "このサービス";
  return [
    {
      id: "fallback-candidate",
      text: `${category}を検討するとき、候補になるサービスや会社を比較してください。`,
      group: "candidate"
    },
    {
      id: "fallback-competitor",
      text: `${category}で選ばれるサービスの違いと、比較時に見られるポイントを整理してください。`,
      group: "candidate"
    },
    {
      id: "fallback-citation",
      text: `${brand}について、公式サイトで引用されやすい情報はどれですか？`,
      group: "citation"
    },
    {
      id: "fallback-brand",
      text: `${brand}はどんなサービスとして説明されていますか？`,
      group: "brand"
    }
  ];
}

function buildCustomerFacingQuestionArea(topicName: string, diagnosisGoal: string) {
  const name = topicName.trim();
  const goal = diagnosisGoal.trim();
  if (!name) return goal;
  if (!goal || normalizeText(name) === normalizeText(goal)) return name;
  return `${name}: ${goal}`;
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
    targetCustomers: [formatAudienceType(formState.audienceType), formState.audienceTargets.join("、")]
      .filter(Boolean)
      .join(" / "),
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

function buildConfirmationRows(
  formState: WizardState,
  draftPreview: CustomerFacingDraftPreview | null,
  prompts: EditablePrompt[]
): ConfirmationRow[] {
  return [
    {
      label: "ブランド情報",
      value: (
        <StackedValues
          values={[
            formState.brandName || "未入力",
            formState.officialUrl || "未入力",
            formState.brandAliases.length ? `別名: ${formatList(formState.brandAliases)}` : "別名なし"
          ]}
        />
      )
    },
    {
      label: "サービス理解",
      value: (
        <StackedValues
          values={[
            formState.serviceDescription || "未入力",
            formatList(draftPreview?.serviceCategories ?? [formState.serviceCategory].filter(Boolean))
          ]}
        />
      )
    },
    {
      label: "市場・言語",
      value: <StackedValues values={[formatList(formState.regions), formatLanguage(formState.language)]} />
    },
    {
      label: "顧客層 / 主に見たい相手",
      value: (
        <StackedValues
          values={[
            formatAudienceType(formState.audienceType),
            formatList(draftPreview?.audienceTargets ?? formState.audienceTargets)
          ]}
        />
      )
    },
    {
      label: "競合",
      value:
        formState.competitorMode === "competitor_discovery_needed" ? (
          "Recoraで候補抽出"
        ) : (
          <ChipList values={formState.competitors} emptyText="未入力" />
        )
    },
    {
      label: "見たいこと / 質問領域",
      value: (
        <StackedValues
          values={[
            formatList(formState.watchTopics),
            formatList(formatReportGoalLabels(formState)),
            draftPreview ? `質問領域: ${formatList(draftPreview.questionAreas)}` : ""
          ].filter(Boolean)}
        />
      )
    },
    {
      label: "プロンプト例",
      value: <NumberedValues values={prompts.map((prompt) => prompt.text)} emptyText="未入力" />
    }
  ];
}

function StackedValues({ values }: { values: readonly string[] }) {
  return (
    <div className="space-y-1">
      {values.map((value) => (
        <p key={value} className="break-words">
          {value}
        </p>
      ))}
    </div>
  );
}

function ChipList({ values, emptyText }: { values: readonly string[]; emptyText: string }) {
  if (values.length === 0) return <span>{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-full bg-[#F1F5F3] px-3 py-1 text-xs font-semibold text-[#506158]">
          {value}
        </span>
      ))}
    </div>
  );
}

function NumberedValues({ values, emptyText }: { values: readonly string[]; emptyText: string }) {
  if (values.length === 0) return <span>{emptyText}</span>;
  return (
    <ol className="space-y-2">
      {values.map((value, index) => (
        <li key={`${index}-${value}`} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#075E44] text-xs font-bold text-white">{index + 1}</span>
          <span className="break-words">{value}</span>
        </li>
      ))}
    </ol>
  );
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
    if (formState.audienceTargets.length === 0) blockers.push("主に見たい相手を1件以上入力してください。");
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

function inferInterimCategory(formState: WizardState) {
  const text = `${formState.brandName} ${formState.officialUrl}`.toLowerCase();
  if (text.includes("recora") || text.includes("seo") || text.includes("geo") || text.includes("ai")) {
    return "SEO / AI検索対策";
  }
  if (text.includes("clinic") || text.includes("medical")) return "クリニック / スクール";
  if (text.includes("school") || text.includes("edu")) return "クリニック / スクール";
  if (text.includes("ecommerce") || text.includes("shop") || text.includes("store")) return "その他";
  return "SaaS / 分析ツール";
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
    "seedInput.targetCustomers is required": "主に見たい相手を確認してください。",
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
