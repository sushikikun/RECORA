"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck
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
  { title: "対象ブランド・URL", short: "ブランド" },
  { title: "測定範囲・市場", short: "市場" },
  { title: "競合・除外条件", short: "競合" },
  { title: "重点論点・目的", short: "目的" },
  { title: "頻度・コスト許可", short: "条件" },
  { title: "Recora生成下書き", short: "下書き" },
  { title: "最終確認", short: "確認" }
] as const;

type AudienceType = "b2b" | "b2c" | "both_or_confirm";
type CompetitorMode = "known_competitors_confirmed" | "competitor_discovery_needed";
type ReportPurpose = "visibility" | "competitor" | "citation" | "brand" | "improvement" | "other";
type MeasurementFrequency = "once" | "weekly" | "daily" | "unknown";
type ModelCountPreference = "one" | "two_three" | "four_plus" | "unknown";
type CostPreference = "low" | "standard" | "quality" | "unknown";
type CopyState = "idle" | "copied" | "failed";
type ChecklistStatus = "ready" | "needs_confirmation" | "blocked";
type PromptGroup = "non_branded" | "branded" | "citation_check" | "excluded";

type MeasurementWizardState = {
  brandName: string;
  brandAliasesText: string;
  targetUrlsText: string;
  measurementScope: string;
  regionsText: string;
  language: string;
  audienceType: AudienceType;
  primaryAudience: string;
  decisionRolesText: string;
  competitorMode: CompetitorMode;
  knownCompetitorsText: string;
  avoidCompetitorsText: string;
  adjacentSourcesText: string;
  focusAnglesText: string;
  ngAreasText: string;
  reportPurposes: ReportPurpose[];
  reportPurposeOther: string;
  diagnosisGoalText: string;
  measurementFrequency: MeasurementFrequency;
  modelCountPreference: ModelCountPreference;
  maxPromptCount: string;
  costPreference: CostPreference;
  priorityQuestionsText: string;
  categoryNote: string;
  personaNote: string;
  topicNote: string;
  promptNote: string;
  competitorNote: string;
};

type DraftGenerationState = {
  status: "idle" | "generating" | "ready" | "error";
  result: ProjectSetupDraftGenerationResult | null;
  error: string | null;
};

type MeasurementChecklistItem = {
  label: string;
  status: ChecklistStatus;
  detail: string;
};

type PromptSummary = {
  prompt: PromptDraft;
  eligibility: PromptMetricEligibility;
  group: PromptGroup;
};

type PriorityQuestionCandidate = {
  id: string;
  text: string;
  group: PromptGroup;
  label: string;
  reason: string;
};

type UpdateForm = <K extends keyof MeasurementWizardState>(
  field: K,
  value: MeasurementWizardState[K]
) => void;

const initialFormState: MeasurementWizardState = {
  brandName: "",
  brandAliasesText: "",
  targetUrlsText: "",
  measurementScope: "",
  regionsText: "日本",
  language: "ja",
  audienceType: "b2b",
  primaryAudience: "",
  decisionRolesText: "",
  competitorMode: "competitor_discovery_needed",
  knownCompetitorsText: "",
  avoidCompetitorsText: "",
  adjacentSourcesText: "",
  focusAnglesText: "",
  ngAreasText: "",
  reportPurposes: ["visibility"],
  reportPurposeOther: "",
  diagnosisGoalText: "",
  measurementFrequency: "once",
  modelCountPreference: "two_three",
  maxPromptCount: "20",
  costPreference: "standard",
  priorityQuestionsText: "",
  categoryNote: "",
  personaNote: "",
  topicNote: "",
  promptNote: "",
  competitorNote: ""
};

const audienceOptions = [
  { value: "b2b", label: "BtoB", description: "法人の検討・導入判断を中心に扱います。" },
  { value: "b2c", label: "BtoC", description: "個人の比較・購入・利用判断を中心に扱います。" },
  { value: "both_or_confirm", label: "両方 / 要確認", description: "BtoB/BtoCの切り分けを下書きで確認します。" }
] as const;

const competitorModeOptions = [
  {
    value: "competitor_discovery_needed",
    label: "未定 / Recoraで候補抽出",
    description: "正式な比較対象は未承認の候補として扱います。"
  },
  {
    value: "known_competitors_confirmed",
    label: "比較したい競合がある",
    description: "入力した3から5社を確認対象として扱います。"
  }
] as const;

const reportPurposeOptions = [
  { value: "visibility", label: "AI検索で自社が出ているか" },
  { value: "competitor", label: "競合と比べたい" },
  { value: "citation", label: "参照元を増やしたい" },
  { value: "brand", label: "ブランド認知を見たい" },
  { value: "improvement", label: "改善候補を出したい" },
  { value: "other", label: "その他" }
] as const;

const frequencyOptions = [
  { value: "once", label: "単発", description: "まず一度だけ測定する前提で確認します。" },
  { value: "weekly", label: "週次", description: "変化を定期的に見たい場合の想定です。" },
  { value: "daily", label: "日次", description: "高頻度監視の必要性を確認します。" },
  { value: "unknown", label: "未定", description: "最終確認では要確認として表示します。" }
] as const;

const modelCountOptions = [
  { value: "one", label: "1", description: "低コストで始める想定です。" },
  { value: "two_three", label: "2-3", description: "標準的な比較幅として扱います。" },
  { value: "four_plus", label: "4+", description: "広めに確認したい場合の想定です。" },
  { value: "unknown", label: "未定", description: "最終確認では要確認として表示します。" }
] as const;

const maxPromptCountOptions = [
  { value: "10", label: "10", description: "小さく確認します。" },
  { value: "20", label: "20", description: "標準的な初期診断の目安です。" },
  { value: "30", label: "30", description: "広めの初期診断です。" },
  { value: "50", label: "50", description: "詳細確認が必要な場合の上限候補です。" }
] as const;

const costPreferenceOptions = [
  { value: "low", label: "低コスト優先", description: "測定量を抑える方向で確認します。" },
  { value: "standard", label: "標準", description: "精度とコストのバランスを取ります。" },
  { value: "quality", label: "多めでも精度優先", description: "必要なら測定幅を広げる前提です。" },
  { value: "unknown", label: "未定", description: "最終確認では要確認として表示します。" }
] as const;

const generationResetFields = new Set<keyof MeasurementWizardState>([
  "brandName",
  "brandAliasesText",
  "targetUrlsText",
  "measurementScope",
  "regionsText",
  "language",
  "audienceType",
  "primaryAudience",
  "decisionRolesText",
  "competitorMode",
  "knownCompetitorsText",
  "avoidCompetitorsText",
  "adjacentSourcesText",
  "focusAnglesText",
  "reportPurposes",
  "reportPurposeOther"
]);

export function ProjectSetupWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<MeasurementWizardState>(initialFormState);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [generationState, setGenerationState] = useState<DraftGenerationState>({
    status: "idle",
    result: null,
    error: null
  });
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const seedInput = useMemo(() => buildSeedInput(formState), [formState]);
  const seedBlockers = useMemo(() => validateProjectSetupSeedInput(seedInput), [seedInput]);
  const draft = generationState.result?.draft ?? null;
  const brandIdentity = useMemo(() => buildBrandIdentity(seedInput), [seedInput]);
  const priorityQuestionCandidates = useMemo(
    () => buildPriorityQuestionCandidates(formState, brandIdentity, seedInput),
    [brandIdentity, formState, seedInput]
  );
  const promptSummaries = useMemo(
    () => (draft?.prompts ?? []).map((prompt) => summarizePrompt(prompt, brandIdentity)),
    [brandIdentity, draft]
  );
  const promptBreakdown = useMemo(
    () => getPromptBreakdown(promptSummaries, priorityQuestionCandidates),
    [priorityQuestionCandidates, promptSummaries]
  );
  const checklist = useMemo(() => buildMeasurementChecklist(formState), [formState]);
  const currentStepBlockers = getStepBlockers(stepIndex, formState);
  const showCurrentBlockers = attemptedSteps[stepIndex] && currentStepBlockers.length > 0;

  const updateForm: UpdateForm = (field, value) => {
    setCopyState("idle");
    setFormState((current) => {
      const next = { ...current, [field]: value };
      if (field === "knownCompetitorsText" && typeof value === "string" && value.trim()) {
        next.competitorMode = "known_competitors_confirmed";
      }
      return next;
    });
    if (generationResetFields.has(field)) {
      setGenerationState({ status: "idle", result: null, error: null });
    }
  };

  function toggleReportPurpose(purpose: ReportPurpose) {
    const exists = formState.reportPurposes.includes(purpose);
    const nextPurposes = exists
      ? formState.reportPurposes.filter((item) => item !== purpose)
      : [...formState.reportPurposes, purpose];
    updateForm("reportPurposes", nextPurposes);
  }

  function runGenerator() {
    setGenerationState({ status: "generating", result: null, error: null });
    window.setTimeout(() => {
      try {
        const result = generateProjectSetupDraft(seedInput);
        setGenerationState({ status: "ready", result, error: null });
      } catch {
        setGenerationState({
          status: "error",
          result: null,
          error: "下書き生成中に予期しないエラーが発生しました。入力内容を確認してください。"
        });
      }
    }, 0);
  }

  function goNext() {
    setCopyState("idle");
    const blockers = getStepBlockers(stepIndex, formState);
    setAttemptedSteps((current) => ({ ...current, [stepIndex]: true }));
    if (blockers.length > 0) return;

    if (stepIndex === 4) {
      setStepIndex(5);
      runGenerator();
      return;
    }

    if (stepIndex === 5 && generationState.status !== "ready") {
      runGenerator();
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setCopyState("idle");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function restartWizard() {
    setFormState(initialFormState);
    setAttemptedSteps({});
    setGenerationState({ status: "idle", result: null, error: null });
    setShowPromptDetails(false);
    setCopyState("idle");
    setStepIndex(0);
  }

  async function copyConfirmationText() {
    setCopyState("idle");
    const text = buildConfirmationText({
      formState,
      seedInput,
      draft,
      promptBreakdown,
      priorityQuestionCandidates,
      checklist,
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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#00796B]">無料診断後のAPI前確認</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-normal text-[#0F172A] sm:text-4xl">
              測定条件を確認し、Recoraの下書きを見る
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#64748B]">
              顧客には詳細なpersona / topic / promptを作ってもらわず、測定に必要な前提だけを確認します。
            </p>
          </div>
          <div className="rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] px-4 py-3 text-sm leading-6 text-[#475569]">
            <strong className="block text-[#0F172A]">この画面で行わないこと</strong>
            DB write / 外部API / Fetch / 検索 / AI計測 / 保存・承認・materialize
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StepRail stepIndex={stepIndex} />
        </aside>

        <section className="min-w-0">
          {stepIndex === 0 ? <BrandStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 1 ? <MarketStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 2 ? <CompetitorStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 3 ? (
            <PurposeStep
              formState={formState}
              updateForm={updateForm}
              toggleReportPurpose={toggleReportPurpose}
            />
          ) : null}
          {stepIndex === 4 ? <CostStep formState={formState} updateForm={updateForm} /> : null}
          {stepIndex === 5 ? (
            <GeneratedDraftStep
              formState={formState}
              updateForm={updateForm}
              seedInput={seedInput}
              generationState={generationState}
              promptSummaries={promptSummaries}
              promptBreakdown={promptBreakdown}
              priorityQuestionCandidates={priorityQuestionCandidates}
              checklist={checklist}
              showPromptDetails={showPromptDetails}
              setShowPromptDetails={setShowPromptDetails}
              onRegenerate={runGenerator}
            />
          ) : null}
          {stepIndex === 6 ? (
            <FinalConfirmationStep
              formState={formState}
              seedInput={seedInput}
              generationState={generationState}
              promptBreakdown={promptBreakdown}
              priorityQuestionCandidates={priorityQuestionCandidates}
              checklist={checklist}
              copyState={copyState}
              onCopy={copyConfirmationText}
              onRegenerate={runGenerator}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-xs font-semibold leading-5 text-[#64748B]">
                入力値はReact stateのみで保持します。ページを再読み込みすると消えます。
              </p>
              {stepIndex < steps.length - 1 ? (
                <Button type="button" onClick={goNext} disabled={generationState.status === "generating"}>
                  {stepIndex === 4 ? "下書きを生成する" : "次へ進む"}
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

function BrandStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <WizardPanel
      eyebrow="Step 1"
      title="対象ブランド・URL"
      description="対象ブランドと、測定対象に含める公式ドメイン / URLを確認します。URLは入力値として扱うだけで、サイト取得やcrawlは行いません。"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <TextInput
          label="正式な対象ブランド名"
          value={formState.brandName}
          onChange={(value) => updateForm("brandName", value)}
          required
          placeholder="例: Recora"
        />
        <TextareaInput
          label="別名・表記ゆれ"
          value={formState.brandAliasesText}
          onChange={(value) => updateForm("brandAliasesText", value)}
          placeholder="1行1件で入力。例: RECORA"
          rows={4}
        />
      </div>
      <div className="mt-5 grid gap-5">
        <TextareaInput
          label="公式ドメイン / 対象URL"
          value={formState.targetUrlsText}
          onChange={(value) => updateForm("targetUrlsText", value)}
          required
          rows={4}
          placeholder={"https://example.com\nexample.jp/service"}
        />
        <TextareaInput
          label="今回測りたい商品・サービス範囲"
          value={formState.measurementScope}
          onChange={(value) => updateForm("measurementScope", value)}
          required
          rows={4}
          placeholder="例: AI検索でのBtoB SaaS比較・引用状況を測りたい"
        />
      </div>
      <InfoCallout>
        別名・表記ゆれはAI回答の表現確認に使う想定です。http/httpsがないURLは下書き生成用にhttps://を補いますが、Fetch / サイト調査 / 検索は実行しません。
      </InfoCallout>
    </WizardPanel>
  );
}

function MarketStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <WizardPanel
      eyebrow="Step 2"
      title="測定範囲・市場・顧客層"
      description="Recoraが詳細ペルソナを下書きするため、顧客には意思決定の文脈だけを確認します。年齢・趣味・架空プロフィールは求めません。"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <TextInput
          label="対象市場・地域"
          value={formState.regionsText}
          onChange={(value) => updateForm("regionsText", value)}
          required
          placeholder="例: 日本、関東、東京都"
        />
        <TextInput
          label="言語"
          value={formState.language}
          onChange={(value) => updateForm("language", value)}
          required
          placeholder="ja"
        />
      </div>
      <div className="mt-5">
        <ChoiceGroup
          label="BtoB / BtoC"
          value={formState.audienceType}
          onChange={(value) => updateForm("audienceType", value)}
          options={audienceOptions}
          required
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TextareaInput
          label="主な顧客層"
          value={formState.primaryAudience}
          onChange={(value) => updateForm("primaryAudience", value)}
          required
          rows={4}
          placeholder="例: AI検索で比較されるBtoB SaaSの導入責任者"
        />
        <TextareaInput
          label="主な検討者・利用者・決裁者"
          value={formState.decisionRolesText}
          onChange={(value) => updateForm("decisionRolesText", value)}
          required
          rows={4}
          placeholder="例: 事業責任者、マーケ責任者、実務担当者"
        />
      </div>
      <InfoCallout>
        industryCategoryは顧客に細かく入力してもらわず、商品・サービス範囲からRecoraが暫定カテゴリを決めます。
      </InfoCallout>
    </WizardPanel>
  );
}

function CompetitorStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  const knownCompetitors = splitList(formState.knownCompetitorsText);

  return (
    <WizardPanel
      eyebrow="Step 3"
      title="競合・除外条件"
      description="競合が未定でも診断準備は進められます。正式な競合比較は後続の承認対象として分けます。"
    >
      <ChoiceGroup
        label="競合の扱い"
        value={formState.competitorMode}
        onChange={(value) => updateForm("competitorMode", value)}
        options={competitorModeOptions}
        required
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TextareaInput
          label="比較したい競合"
          value={formState.knownCompetitorsText}
          onChange={(value) => updateForm("knownCompetitorsText", value)}
          rows={4}
          placeholder="1行1件。3から5社までを目安に入力"
        />
        <TextareaInput
          label="除外したい会社・媒体・カテゴリ"
          value={formState.avoidCompetitorsText}
          onChange={(value) => updateForm("avoidCompetitorsText", value)}
          rows={4}
          placeholder="例: 採用媒体、求人広告、特定の比較サイト"
        />
      </div>
      <div className="mt-5">
        <TextareaInput
          label="競合ではないがAI/検索に出そうな媒体・カテゴリ"
          value={formState.adjacentSourcesText}
          onChange={(value) => updateForm("adjacentSourcesText", value)}
          rows={3}
          placeholder="例: 大手メディア、口コミサイト、業界団体"
        />
      </div>
      {knownCompetitors.length > 5 ? (
        <MessageBox tone="warning" title="競合数の目安">
          比較したい競合は最初の5件までをgenerator入力に使います。残りは確認メモとして扱ってください。
        </MessageBox>
      ) : null}
      {formState.competitorMode === "competitor_discovery_needed" ? <CompetitorDiscoveryNotice /> : null}
    </WizardPanel>
  );
}

function PurposeStep({
  formState,
  updateForm,
  toggleReportPurpose
}: {
  formState: MeasurementWizardState;
  updateForm: UpdateForm;
  toggleReportPurpose: (purpose: ReportPurpose) => void;
}) {
  return (
    <WizardPanel
      eyebrow="Step 4"
      title="重点論点・NG領域・レポート目的"
      description="強みや既知リスクの入力欄は作らず、測定で見たい論点と避けたい領域として確認します。"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <TextareaInput
          label="重点的に見たい論点"
          value={formState.focusAnglesText}
          onChange={(value) => updateForm("focusAnglesText", value)}
          required
          rows={4}
          placeholder="例: AI回答で候補に挙がるか、比較時にどんな評価軸で語られるか"
        />
        <TextareaInput
          label="測定してほしくないNG領域"
          value={formState.ngAreasText}
          onChange={(value) => updateForm("ngAreasText", value)}
          rows={4}
          placeholder="空欄の場合は、NG領域なしとして確認済みにします"
        />
      </div>
      <div className="mt-5">
        <CheckboxGroup
          label="レポート目的"
          values={formState.reportPurposes}
          onToggle={toggleReportPurpose}
          options={reportPurposeOptions}
          required
        />
      </div>
      {formState.reportPurposes.includes("other") ? (
        <div className="mt-5">
          <TextInput
            label="その他のレポート目的"
            value={formState.reportPurposeOther}
            onChange={(value) => updateForm("reportPurposeOther", value)}
            placeholder="短く入力してください"
          />
        </div>
      ) : null}
      <div className="mt-5">
        <TextareaInput
          label="診断したい目的（確認用メモ）"
          value={formState.diagnosisGoalText}
          onChange={(value) => updateForm("diagnosisGoalText", value)}
          rows={3}
          placeholder="generatorには効かない、顧客確認用の補足メモです"
        />
      </div>
      <InfoCallout>
        確認用メモとNG領域はProjectSetupSeedInputに反映しません。generatorには、レポート目的から安全に対応できるdiagnosisGoalsだけを渡します。
      </InfoCallout>
    </WizardPanel>
  );
}

function CostStep({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <WizardPanel
      eyebrow="Step 5"
      title="計測頻度・モデル数・コスト許可"
      description="この確認はAPI実行前の準備情報です。課金、決済、OpenAI API呼び出し、AI計測は行いません。"
    >
      <div className="grid gap-5">
        <ChoiceGroup
          label="計測頻度"
          value={formState.measurementFrequency}
          onChange={(value) => updateForm("measurementFrequency", value)}
          options={frequencyOptions}
          required
        />
        <ChoiceGroup
          label="AIモデル数"
          value={formState.modelCountPreference}
          onChange={(value) => updateForm("modelCountPreference", value)}
          options={modelCountOptions}
          required
        />
        <ChoiceGroup
          label="最大プロンプト数目安"
          value={formState.maxPromptCount}
          onChange={(value) => updateForm("maxPromptCount", value)}
          options={maxPromptCountOptions}
          required
        />
        <ChoiceGroup
          label="コスト感"
          value={formState.costPreference}
          onChange={(value) => updateForm("costPreference", value)}
          options={costPreferenceOptions}
          required
        />
      </div>
      <InfoCallout>
        コスト許可は「どの程度の測定幅を許容できるか」の確認です。この画面では請求、決済、外部API、モデル呼び出しは発生しません。
      </InfoCallout>
    </WizardPanel>
  );
}

function GeneratedDraftStep({
  formState,
  updateForm,
  seedInput,
  generationState,
  promptSummaries,
  promptBreakdown,
  priorityQuestionCandidates,
  checklist,
  showPromptDetails,
  setShowPromptDetails,
  onRegenerate
}: {
  formState: MeasurementWizardState;
  updateForm: UpdateForm;
  seedInput: ProjectSetupSeedInput;
  generationState: DraftGenerationState;
  promptSummaries: PromptSummary[];
  promptBreakdown: Record<PromptGroup, number>;
  priorityQuestionCandidates: PriorityQuestionCandidate[];
  checklist: MeasurementChecklistItem[];
  showPromptDetails: boolean;
  setShowPromptDetails: (value: boolean) => void;
  onRegenerate: () => void;
}) {
  const draft = generationState.result?.draft ?? null;
  const businessModel = getInputCompletionValue(draft, "businessModel");
  const industryAdapter = getInputCompletionValue(draft, "industryAdapter");

  if (generationState.status === "idle" || generationState.status === "generating") {
    return <GenerationProgress onRegenerate={onRegenerate} isIdle={generationState.status === "idle"} />;
  }

  if (generationState.status === "error") {
    return (
      <WizardPanel eyebrow="Step 6" title="Recora生成下書き" description="外部APIや計測は行わず、画面内で下書き生成を試行しました。">
        <MessageBox tone="error" title="下書きを生成できませんでした">
          {generationState.error}
        </MessageBox>
        <div className="mt-5">
          <Button type="button" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4" />
            もう一度生成する
          </Button>
        </div>
      </WizardPanel>
    );
  }

  return (
    <WizardPanel
      eyebrow="Step 6"
      title="Recora生成下書きの確認"
      description="ここで表示するcategory / persona / topic / promptは未承認の下書きです。顧客が詳細設計を作る画面ではありません。"
    >
      <div className="flex flex-col gap-3 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#0F172A]">Recoraが測定条件を整理しました</p>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            カテゴリ、ペルソナ、トピック、プロンプト方針を下書きしています。外部API、Fetch、計測実行は行っていません。
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4" />
          再生成
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <SummaryTile label="暫定カテゴリ" value={seedInput.industryCategory} />
        <SummaryTile label="persona" value={`${draft?.personas.length ?? 0}件`} />
        <SummaryTile label="topic" value={`${draft?.topics.length ?? 0}件`} />
        <SummaryTile label="prompt" value={`${draft?.prompts.length ?? 0}件`} />
      </div>

      <GeneratedCategoryCard
        industryCategory={seedInput.industryCategory}
        businessModel={businessModel}
        industryAdapter={industryAdapter}
      />
      <PersonaSummary personas={draft?.personas ?? []} />
      <TopicSummary topics={draft?.topics ?? []} />
      <PromptSummarySection
        promptSummaries={promptSummaries}
        promptBreakdown={promptBreakdown}
        showPromptDetails={showPromptDetails}
        setShowPromptDetails={setShowPromptDetails}
      />

      <div className="mt-6">
        <TextareaInput
          label="必ず測りたい質問（任意）"
          value={formState.priorityQuestionsText}
          onChange={(value) => updateForm("priorityQuestionsText", value)}
          rows={4}
          placeholder="ここに入れた質問は優先候補として最終確認に表示します。brand / alias / domain / 競合名入りの質問はvisibility / ranking / SOV候補から外す前提です。"
        />
      </div>
      <PriorityQuestionList candidates={priorityQuestionCandidates} />

      {formState.competitorMode === "competitor_discovery_needed" ? <CompetitorDiscoveryNotice /> : null}
      <GenerationMessages result={generationState.result} />
      <MeasurementChecklist items={checklist} />
      <ReviewNotes formState={formState} updateForm={updateForm} />
    </WizardPanel>
  );
}

function FinalConfirmationStep({
  formState,
  seedInput,
  generationState,
  promptBreakdown,
  priorityQuestionCandidates,
  checklist,
  copyState,
  onCopy,
  onRegenerate
}: {
  formState: MeasurementWizardState;
  seedInput: ProjectSetupSeedInput;
  generationState: DraftGenerationState;
  promptBreakdown: Record<PromptGroup, number>;
  priorityQuestionCandidates: PriorityQuestionCandidate[];
  checklist: MeasurementChecklistItem[];
  copyState: CopyState;
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  const draft = generationState.result?.draft ?? null;

  return (
    <WizardPanel
      eyebrow="Step 7"
      title="最終確認"
      description="この内容はAPI前確認の下書きです。保存・承認・計測反映はまだ行いません。"
    >
      {generationState.status !== "ready" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-bold">Recora生成下書きが未生成です</p>
          <p className="mt-1">最終確認の前に、画面内の同期生成を実行してください。</p>
          <Button type="button" className="mt-3" variant="outline" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4" />
            下書きを生成する
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ReviewCard title="対象ブランド">
          <ReviewRow label="正式名" value={formState.brandName} />
          <ReviewRow label="別名・表記ゆれ" value={formatList(splitList(formState.brandAliasesText), "なしとして確認済み")} />
          <ReviewRow label="公式ドメイン / URL" value={formatList(splitList(formState.targetUrlsText))} />
          <ReviewRow label="測定範囲" value={formState.measurementScope} />
        </ReviewCard>
        <ReviewCard title="市場・顧客">
          <ReviewRow label="地域 / 言語" value={`${formatList(splitList(formState.regionsText))} / ${formState.language || "未入力"}`} />
          <ReviewRow label="BtoB / BtoC" value={formatAudienceType(formState.audienceType)} />
          <ReviewRow label="顧客層" value={formState.primaryAudience} />
          <ReviewRow label="検討者・利用者・決裁者" value={formState.decisionRolesText} />
        </ReviewCard>
        <ReviewCard title="競合・除外">
          <ReviewRow label="競合モード" value={formatCompetitorMode(formState.competitorMode)} />
          <ReviewRow label="比較したい競合" value={formatList(getKnownCompetitorsForSeed(formState), "Recoraで候補抽出")} />
          <ReviewRow label="除外条件" value={formatList(getAvoidCompetitorsForSeed(formState), "なしとして確認済み")} />
          {formState.competitorMode === "competitor_discovery_needed" ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
              SOV / ブランド比較は自動検出候補扱いです。正式な比較には後続の承認が必要です。
            </p>
          ) : null}
        </ReviewCard>
        <ReviewCard title="目的・頻度">
          <ReviewRow label="重点論点" value={formatList(splitList(formState.focusAnglesText))} />
          <ReviewRow label="NG領域" value={formatList(splitList(formState.ngAreasText), "なしとして確認済み")} />
          <ReviewRow label="レポート目的" value={formatList(formatReportPurposeLabels(formState))} />
          <ReviewRow label="確認用メモ" value={formState.diagnosisGoalText.trim() || "なし"} />
          <ReviewRow label="頻度 / モデル / プロンプト / コスト" value={`${formatFrequency(formState.measurementFrequency)} / ${formatModelCount(formState.modelCountPreference)} / ${formState.maxPromptCount}件 / ${formatCostPreference(formState.costPreference)}`} />
        </ReviewCard>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <SummaryTile label="暫定カテゴリ" value={seedInput.industryCategory} />
        <SummaryTile label="persona" value={`${draft?.personas.length ?? 0}件`} />
        <SummaryTile label="topic" value={`${draft?.topics.length ?? 0}件`} />
        <SummaryTile label="prompt" value={`${draft?.prompts.length ?? 0}件`} />
      </div>

      <PromptBreakdownCards breakdown={promptBreakdown} />
      <PriorityQuestionList candidates={priorityQuestionCandidates} />
      <MeasurementChecklist items={checklist} />

      <div className="mt-6 rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-4 text-sm leading-6 text-[#475569]">
        <p className="font-bold text-[#0F172A]">この内容はAPI前確認の下書きです</p>
        <ul className="mt-2 space-y-1">
          <li>保存・承認・計測反映はまだ行いません。</li>
          <li>Fetch / サイト調査 / 検索 / AI計測はこの画面では実行しません。</li>
          <li>この画面の確認用メモ、計測頻度、モデル数、コスト許可はDBには保存しません。</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" onClick={onCopy} disabled={generationState.status !== "ready"}>
          <Clipboard className="h-4 w-4" />
          確認テキストをコピー
        </Button>
        {copyState === "copied" ? <p className="text-sm font-bold text-[#00796B]">コピーしました。</p> : null}
        {copyState === "failed" ? <p className="text-sm font-bold text-rose-700">コピーできませんでした。</p> : null}
      </div>
    </WizardPanel>
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
                <span className="min-w-0 truncate">{step.short}</span>
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
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6">
      <p className="text-sm font-bold text-[#00796B]">{eyebrow}</p>
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
      <span className="text-sm font-bold text-[#0F172A]">
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
    <label className={cn("block min-w-0", className)}>
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

function ChoiceGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  required = false
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; description: string }[];
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-[#0F172A]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </legend>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-w-0 gap-3 rounded-lg border bg-white p-3 text-sm transition",
                checked ? "border-[#00796B] bg-[#E6F4F1]" : "border-[#DDE8E5]"
              )}
            >
              <input
                className="mt-1 h-4 w-4 shrink-0 accent-[#00796B]"
                type="radio"
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <span className="min-w-0">
                <span className="block font-bold text-[#0F172A]">{option.label}</span>
                <span className="mt-1 block leading-5 text-[#64748B]">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckboxGroup<T extends string>({
  label,
  values,
  onToggle,
  options,
  required = false
}: {
  label: string;
  values: readonly T[];
  onToggle: (value: T) => void;
  options: readonly { value: T; label: string }[];
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-[#0F172A]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </legend>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className="flex min-w-0 gap-3 rounded-lg border border-[#DDE8E5] bg-white p-3 text-sm">
            <input
              className="mt-1 h-4 w-4 shrink-0 accent-[#00796B]"
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span className="font-bold text-[#0F172A]">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex gap-3 rounded-lg border border-[#B8D9D3] bg-[#F8FBFA] p-4 text-sm leading-6 text-[#475569]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00796B]" />
      <div>{children}</div>
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
  children: ReactNode;
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

function GenerationProgress({ onRegenerate, isIdle }: { onRegenerate: () => void; isIdle: boolean }) {
  return (
    <WizardPanel
      eyebrow="Step 6"
      title="Recora生成下書き"
      description="画面内の入力から、API前確認用の下書きを同期生成します。"
    >
      <div className="rounded-lg border border-[#DDE8E5] bg-[#F8FBFA] p-5">
        <div className="flex items-start gap-3">
          {isIdle ? (
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#00796B]" />
          ) : (
            <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-[#00796B]" />
          )}
          <div>
            <p className="text-base font-bold text-[#0F172A]">Recoraが測定条件を整理しています</p>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              カテゴリ、ペルソナ、トピック、プロンプト方針を下書きしています。外部API、Fetch、計測実行は行っていません。
            </p>
          </div>
        </div>
        {isIdle ? (
          <Button type="button" className="mt-4" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4" />
            下書きを生成する
          </Button>
        ) : null}
      </div>
    </WizardPanel>
  );
}

function GeneratedCategoryCard({
  industryCategory,
  businessModel,
  industryAdapter
}: {
  industryCategory: string;
  businessModel: string;
  industryAdapter: string;
}) {
  return (
    <ReviewCard title="カテゴリ下書き">
      <ReviewRow label="暫定カテゴリ" value={industryCategory} />
      <ReviewRow label="business model" value={businessModel || "要確認"} />
      <ReviewRow label="industry adapter" value={industryAdapter || "要確認"} />
    </ReviewCard>
  );
}

function PersonaSummary({ personas }: { personas: readonly PersonaDraft[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-bold text-[#0F172A]">persona summary</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {personas.length ? (
          personas.map((persona) => (
            <div key={persona.personaId} className="rounded-lg border border-[#DDE8E5] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-[#0F172A]">{persona.displayName}</h4>
                <Badge variant="outline" className="rounded-full border-[#DDE8E5] text-[#64748B]">
                  {persona.roleType}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{persona.detailedDecisionRole}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                判断軸: {persona.comparisonAxis.slice(0, 3).join(" / ") || persona.promptAngle}
              </p>
            </div>
          ))
        ) : (
          <EmptyDraftState label="persona下書きはありません。blockerを確認してください。" />
        )}
      </div>
    </section>
  );
}

function TopicSummary({ topics }: { topics: readonly TopicDraft[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-bold text-[#0F172A]">topic summary</h3>
      <div className="mt-3 grid gap-3">
        {topics.length ? (
          topics.map((topic) => (
            <div key={topic.topicId} className="rounded-lg border border-[#DDE8E5] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-[#0F172A]">{topic.topicName}</h4>
                <Badge variant="outline" className="rounded-full border-[#DDE8E5] text-[#64748B]">
                  {topic.topicType}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{topic.expectedSignal}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#00796B]">
                metric target: {formatTopicMetricTargets(topic)}
              </p>
            </div>
          ))
        ) : (
          <EmptyDraftState label="topic下書きはありません。blockerを確認してください。" />
        )}
      </div>
    </section>
  );
}

function PromptSummarySection({
  promptSummaries,
  promptBreakdown,
  showPromptDetails,
  setShowPromptDetails
}: {
  promptSummaries: PromptSummary[];
  promptBreakdown: Record<PromptGroup, number>;
  showPromptDetails: boolean;
  setShowPromptDetails: (value: boolean) => void;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">prompt summary</h3>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            詳細は初期状態で畳んでいます。brand / alias / domain / 実名競合入りはmarket metric候補から分けます。
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setShowPromptDetails(!showPromptDetails)}>
          <ChevronDown className={cn("h-4 w-4 transition", showPromptDetails && "rotate-180")} />
          プロンプトを確認する
        </Button>
      </div>
      <PromptBreakdownCards breakdown={promptBreakdown} />
      {showPromptDetails ? (
        <div className="mt-4 grid gap-3">
          {promptSummaries.length ? (
            promptSummaries.map(({ prompt, eligibility, group }) => (
              <div key={prompt.promptId} className="rounded-lg border border-[#DDE8E5] bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <PromptGroupBadge group={group} />
                  <Badge variant="outline" className="rounded-full border-[#DDE8E5] text-[#64748B]">
                    {prompt.intent}
                  </Badge>
                </div>
                <p className="mt-3 break-words text-sm font-bold leading-6 text-[#0F172A]">{prompt.text}</p>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  metric: {formatMetricEligibility(eligibility)}
                </p>
              </div>
            ))
          ) : (
            <EmptyDraftState label="prompt下書きはありません。blockerを確認してください。" />
          )}
        </div>
      ) : null}
    </section>
  );
}

function PromptBreakdownCards({ breakdown }: { breakdown: Record<PromptGroup, number> }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <SummaryTile label="non-branded" value={`${breakdown.non_branded}件`} />
      <SummaryTile label="branded" value={`${breakdown.branded}件`} />
      <SummaryTile label="citation_check" value={`${breakdown.citation_check}件`} />
      <SummaryTile label="excluded" value={`${breakdown.excluded}件`} />
    </div>
  );
}

function PriorityQuestionList({ candidates }: { candidates: PriorityQuestionCandidate[] }) {
  return (
    <section className="mt-5">
      <h3 className="text-base font-bold text-[#0F172A]">必ず測りたい質問の優先候補</h3>
      {candidates.length ? (
        <div className="mt-3 grid gap-3">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-lg border border-[#DDE8E5] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <PromptGroupBadge group={candidate.group} />
                <Badge variant="outline" className="rounded-full border-[#DDE8E5] text-[#64748B]">
                  {candidate.label}
                </Badge>
              </div>
              <p className="mt-3 break-words text-sm font-bold leading-6 text-[#0F172A]">{candidate.text}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">{candidate.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyDraftState label="任意項目です。未入力の場合は優先候補なしとして確認します。" />
      )}
    </section>
  );
}

function PromptGroupBadge({ group }: { group: PromptGroup }) {
  const config = {
    non_branded: {
      label: "指標候補 non-branded",
      className: "border-[#00796B]/25 bg-[#E6F4F1] text-[#005C50]"
    },
    branded: {
      label: "ブランド認知 branded",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700"
    },
    citation_check: {
      label: "引用確認 citation_check",
      className: "border-sky-200 bg-sky-50 text-sky-700"
    },
    excluded: {
      label: "対象外 / 要確認",
      className: "border-amber-200 bg-amber-50 text-amber-800"
    }
  }[group];

  return (
    <Badge variant="outline" className={cn("w-fit rounded-full", config.className)}>
      {config.label}
    </Badge>
  );
}

function CompetitorDiscoveryNotice() {
  const rows = [
    ["AI表示率", "出せる"],
    ["自社サイト引用率", "出せる"],
    ["AI回答", "出せる"],
    ["参照元", "出せる"],
    ["ブランド認知", "出せる"],
    ["Share of Voice", "制限付き"],
    ["ブランド比較", "自動検出候補扱い"],
    ["競合に取られている質問", "候補扱い"],
    ["競合に取られている参照元", "候補扱い"]
  ];

  return (
    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div>
          <p className="text-sm font-bold text-amber-950">競合未定時の扱い</p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            SOV、ブランド比較、競合に取られている質問や参照元は自動検出候補です。正式な比較には後続の承認が必要です。
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white px-3 py-2 text-sm leading-6">
            <span className="font-bold text-[#0F172A]">{label}: </span>
            <span className="text-[#475569]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerationMessages({ result }: { result: ProjectSetupDraftGenerationResult | null }) {
  if (!result) return null;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <StatusList title="blocker" items={result.blockers.map(translateBlocker)} tone="error" emptyText="blockerはありません。" />
      <StatusList title="warning" items={result.warnings.map(translateWarning)} tone="warning" emptyText="warningはありません。" />
    </div>
  );
}

function StatusList({
  title,
  items,
  tone,
  emptyText
}: {
  title: string;
  items: string[];
  tone: "error" | "warning";
  emptyText: string;
}) {
  const isError = tone === "error";
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm leading-6",
        isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      <p className="font-bold">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">{emptyText}</p>
      )}
    </div>
  );
}

function MeasurementChecklist({ items }: { items: MeasurementChecklistItem[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-bold text-[#0F172A]">measurement ready checklist</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-2 rounded-lg border border-[#DDE8E5] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F172A]">{item.label}</p>
              <p className="mt-1 break-words text-sm leading-6 text-[#64748B]">{item.detail}</p>
            </div>
            <ChecklistStatusBadge status={item.status} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#64748B]">
        checklistはUI上の確認表示です。measurement_readyのDB writeは行いません。
      </p>
    </section>
  );
}

function ChecklistStatusBadge({ status }: { status: ChecklistStatus }) {
  const config = {
    ready: "border-[#00796B]/25 bg-[#E6F4F1] text-[#005C50]",
    needs_confirmation: "border-amber-200 bg-amber-50 text-amber-800",
    blocked: "border-rose-200 bg-rose-50 text-rose-700"
  }[status];

  return (
    <Badge variant="outline" className={cn("w-fit shrink-0 rounded-full", config)}>
      {status === "needs_confirmation" ? "needs confirmation" : status}
    </Badge>
  );
}

function ReviewNotes({ formState, updateForm }: { formState: MeasurementWizardState; updateForm: UpdateForm }) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-bold text-[#0F172A]">確認メモ</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <TextareaInput label="カテゴリ確認メモ" value={formState.categoryNote} onChange={(value) => updateForm("categoryNote", value)} />
        <TextareaInput label="persona確認メモ" value={formState.personaNote} onChange={(value) => updateForm("personaNote", value)} />
        <TextareaInput label="topic確認メモ" value={formState.topicNote} onChange={(value) => updateForm("topicNote", value)} />
        <TextareaInput label="prompt確認メモ" value={formState.promptNote} onChange={(value) => updateForm("promptNote", value)} />
        <TextareaInput label="競合確認メモ" value={formState.competitorNote} onChange={(value) => updateForm("competitorNote", value)} className="lg:col-span-2" />
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#64748B]">
        メモは画面内だけの確認情報です。保存、承認、materializeは行いません。
      </p>
    </section>
  );
}

function ReviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#DDE8E5] bg-white p-4">
      <h3 className="text-base font-bold text-[#0F172A]">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#0F172A]">{value || "未入力"}</p>
    </div>
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

function EmptyDraftState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#B8D9D3] bg-[#F8FBFA] px-4 py-5 text-sm font-semibold leading-6 text-[#64748B]">
      {label}
    </div>
  );
}

function buildSeedInput(formState: MeasurementWizardState): ProjectSetupSeedInput {
  const brandName = formState.brandName.trim();
  const measurementScope = formState.measurementScope.trim();
  const reportPurposeLabels = formatReportPurposeLabels(formState);
  const focusAngles = splitList(formState.focusAnglesText);

  return {
    companyName: brandName,
    brandName,
    officialSiteUrl: normalizeTargetUrlForSeed(splitList(formState.targetUrlsText)[0] ?? ""),
    productOrServiceDescription: buildProductOrServiceDescription({
      measurementScope,
      reportPurposeLabels,
      focusAngles
    }),
    industryCategory: inferInterimCategory(measurementScope, formState.focusAnglesText, formState.primaryAudience),
    targetCustomers: buildTargetCustomers(formState),
    regions: splitList(formState.regionsText),
    language: formState.language.trim() || "ja",
    serviceName: measurementScope || brandName,
    brandAliases: splitList(formState.brandAliasesText),
    knownCompetitors: getKnownCompetitorsForSeed(formState),
    avoidCompetitors: getAvoidCompetitorsForSeed(formState),
    strengths: [],
    knownRisks: [],
    diagnosisGoals: mapReportPurposesToPromptIntents(formState.reportPurposes)
  };
}

function buildProductOrServiceDescription(input: {
  measurementScope: string;
  reportPurposeLabels: string[];
  focusAngles: string[];
}) {
  return [
    input.measurementScope,
    input.reportPurposeLabels.length ? `レポート目的: ${input.reportPurposeLabels.join(" / ")}` : "",
    input.focusAngles.length ? `重点論点: ${input.focusAngles.join(" / ")}` : ""
  ]
    .filter(Boolean)
    .join("。");
}

function buildTargetCustomers(formState: MeasurementWizardState) {
  return [
    formatAudienceType(formState.audienceType),
    formState.primaryAudience.trim(),
    formState.decisionRolesText.trim() ? `検討者・利用者・決裁者: ${formState.decisionRolesText.trim()}` : ""
  ]
    .filter(Boolean)
    .join(" / ");
}

function getKnownCompetitorsForSeed(formState: MeasurementWizardState) {
  if (formState.competitorMode !== "known_competitors_confirmed") return [];
  return splitList(formState.knownCompetitorsText).slice(0, 5);
}

function getAvoidCompetitorsForSeed(formState: MeasurementWizardState) {
  return uniqueStrings([...splitList(formState.avoidCompetitorsText), ...splitList(formState.adjacentSourcesText)]);
}

function mapReportPurposesToPromptIntents(reportPurposes: readonly ReportPurpose[]): PromptIntent[] {
  const intents = new Set<PromptIntent>();
  for (const purpose of reportPurposes) {
    if (purpose === "visibility") intents.add("non_branded");
    if (purpose === "competitor") intents.add("buyer_intent");
    if (purpose === "citation") intents.add("citation_check");
    if (purpose === "brand") intents.add("brand_perception");
    if (purpose === "improvement") intents.add("problem_aware");
    if (purpose === "other") intents.add("non_branded");
  }
  return Array.from(intents);
}

function inferInterimCategory(measurementScope: string, focusAnglesText: string, primaryAudience: string) {
  const text = `${measurementScope} ${focusAnglesText} ${primaryAudience}`.normalize("NFKC").toLowerCase();
  if (/(saas|software|ソフトウェア|crm|ツール|システム)/i.test(text)) return "BtoB SaaS / ソフトウェア";
  if (/(採用|人事|hr|求人)/i.test(text)) return "採用・人事支援";
  if (/(ec|通販|商品|購入|返品|素材)/i.test(text)) return "EC / 商品比較";
  if (/(クリニック|医療|病院|歯科|美容医療)/i.test(text)) return "医療・クリニック";
  if (/(不動産|住宅|マンション|賃貸)/i.test(text)) return "不動産";
  if (/(税理士|弁護士|士業|コンサル|専門家)/i.test(text)) return "専門サービス";
  if (/(教育|スクール|講座|塾|研修)/i.test(text)) return "教育・スクール";
  if (/(店舗|地域|近く|予約|来店)/i.test(text)) return "地域サービス";
  return "サービスカテゴリ（暫定）";
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

function summarizePrompt(prompt: PromptDraft, brandIdentity: BrandIdentityForDraft): PromptSummary {
  const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
  return {
    prompt,
    eligibility,
    group: getPromptGroup(prompt, eligibility)
  };
}

function buildPriorityQuestionCandidates(
  formState: MeasurementWizardState,
  brandIdentity: BrandIdentityForDraft,
  seedInput: ProjectSetupSeedInput
): PriorityQuestionCandidate[] {
  const brandSignals = getBrandSignals(brandIdentity);
  const competitorSignals = [...(seedInput.knownCompetitors ?? []), ...(seedInput.avoidCompetitors ?? [])]
    .map(normalizeSignal)
    .filter((value) => value.length >= 2);

  return splitList(formState.priorityQuestionsText).map((text, index) => {
    const normalized = normalizeSignal(text);
    const hasCompetitorSignal = competitorSignals.some((signal) => normalized.includes(signal));
    const hasBrandSignal = brandSignals.some((signal) => normalized.includes(signal));

    if (hasCompetitorSignal) {
      return {
        id: `priority-question-${index}`,
        text,
        group: "excluded",
        label: "実名競合入り",
        reason: "実名競合または除外対象を含むため、visibility / ranking / SOV候補から外します。"
      };
    }

    if (hasBrandSignal) {
      return {
        id: `priority-question-${index}`,
        text,
        group: "branded",
        label: "ブランド認知用",
        reason: "brand / alias / domainを含むため、brand perception / sentiment確認用として扱います。"
      };
    }

    return {
      id: `priority-question-${index}`,
      text,
      group: "non_branded",
      label: "指標候補",
      reason: "brand / alias / domain / 実名競合を含まないため、AI表示率 / ranking / SOV候補として扱えます。"
    };
  });
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

function getPromptBreakdown(
  summaries: readonly PromptSummary[],
  priorityQuestions: readonly PriorityQuestionCandidate[]
): Record<PromptGroup, number> {
  const initial: Record<PromptGroup, number> = {
    non_branded: 0,
    branded: 0,
    citation_check: 0,
    excluded: 0
  };
  for (const summary of summaries) {
    initial[summary.group] += 1;
  }
  for (const question of priorityQuestions) {
    initial[question.group] += 1;
  }
  return initial;
}

function buildMeasurementChecklist(formState: MeasurementWizardState): MeasurementChecklistItem[] {
  const targetUrls = splitList(formState.targetUrlsText);
  const aliases = splitList(formState.brandAliasesText);
  const knownCompetitors = getKnownCompetitorsForSeed(formState);
  const exclusions = getAvoidCompetitorsForSeed(formState);
  const focusAngles = splitList(formState.focusAnglesText);
  const ngAreas = splitList(formState.ngAreasText);

  return [
    checklistItem("target brand input", Boolean(formState.brandName.trim()), formState.brandName || "未入力"),
    {
      label: "brand aliases confirmed",
      status: "ready",
      detail: aliases.length ? aliases.join(", ") : "空欄。別名なしとして確認済み"
    },
    checklistItem("owned domains / target URLs input", targetUrls.length > 0, targetUrls.join(", ") || "未入力"),
    checklistItem("measurement scope input", Boolean(formState.measurementScope.trim()), formState.measurementScope || "未入力"),
    checklistItem("language/region input", Boolean(formState.language.trim() && formState.regionsText.trim()), `${formState.language || "未入力"} / ${formState.regionsText || "未入力"}`),
    {
      label: "BtoB/BtoC confirmed",
      status: formState.audienceType === "both_or_confirm" ? "needs_confirmation" : "ready",
      detail: formatAudienceType(formState.audienceType)
    },
    checklistItem("primary audience input", Boolean(formState.primaryAudience.trim()), formState.primaryAudience || "未入力"),
    {
      label: "known competitors or competitor discovery mode",
      status: formState.competitorMode === "known_competitors_confirmed" && knownCompetitors.length === 0 ? "blocked" : formState.competitorMode === "competitor_discovery_needed" ? "needs_confirmation" : "ready",
      detail: formState.competitorMode === "competitor_discovery_needed" ? "競合未定。Recoraで候補抽出" : formatList(knownCompetitors)
    },
    {
      label: "excluded competitors/sources confirmed",
      status: "ready",
      detail: exclusions.length ? exclusions.join(", ") : "空欄。除外なしとして確認済み"
    },
    checklistItem("prompt generation scope/focus angles confirmed", focusAngles.length > 0, focusAngles.join(", ") || "未入力"),
    {
      label: "NG areas confirmed",
      status: "ready",
      detail: ngAreas.length ? ngAreas.join(", ") : "空欄。NG領域なしとして確認済み"
    },
    checklistItem("report purpose input", formState.reportPurposes.length > 0, formatReportPurposeLabels(formState).join(", ") || "未入力"),
    {
      label: "AI models/frequency/cost permission confirmed",
      status:
        formState.measurementFrequency === "unknown" ||
        formState.modelCountPreference === "unknown" ||
        formState.costPreference === "unknown"
          ? "needs_confirmation"
          : "ready",
      detail: `${formatFrequency(formState.measurementFrequency)} / ${formatModelCount(formState.modelCountPreference)} / ${formatCostPreference(formState.costPreference)}`
    }
  ];
}

function checklistItem(label: string, ok: boolean, detail: string): MeasurementChecklistItem {
  return {
    label,
    status: ok ? "ready" : "blocked",
    detail
  };
}

function getStepBlockers(stepIndex: number, formState: MeasurementWizardState) {
  const blockers: string[] = [];

  if (stepIndex === 0) {
    if (!formState.brandName.trim()) blockers.push("正式な対象ブランド名を入力してください。");
    if (splitList(formState.targetUrlsText).length === 0) blockers.push("公式ドメイン / 対象URLを1件以上入力してください。");
    if (!formState.measurementScope.trim()) blockers.push("今回測りたい商品・サービス範囲を入力してください。");
    const firstUrl = normalizeTargetUrlForSeed(splitList(formState.targetUrlsText)[0] ?? "");
    if (firstUrl && !isLikelyHttpUrl(firstUrl)) blockers.push("公式ドメイン / 対象URLはURLとして扱える形式で入力してください。");
  }

  if (stepIndex === 1) {
    if (!formState.regionsText.trim()) blockers.push("対象市場・地域を入力してください。");
    if (!formState.language.trim()) blockers.push("言語を入力してください。");
    if (!formState.primaryAudience.trim()) blockers.push("主な顧客層を入力してください。");
    if (!formState.decisionRolesText.trim()) blockers.push("主な検討者・利用者・決裁者を入力してください。");
  }

  if (stepIndex === 2 && formState.competitorMode === "known_competitors_confirmed" && getKnownCompetitorsForSeed(formState).length === 0) {
    blockers.push("競合ありを選ぶ場合は、比較したい競合を1件以上入力してください。");
  }

  if (stepIndex === 3) {
    if (!formState.focusAnglesText.trim()) blockers.push("重点的に見たい論点を入力してください。");
    if (formState.reportPurposes.length === 0) blockers.push("レポート目的を1件以上選択してください。");
    if (formState.reportPurposes.includes("other") && !formState.reportPurposeOther.trim()) {
      blockers.push("その他のレポート目的を入力してください。");
    }
  }

  if (stepIndex === 4 && !formState.maxPromptCount.trim()) {
    blockers.push("最大プロンプト数目安を選択してください。");
  }

  return blockers;
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function uniqueStrings(values: readonly string[]) {
  return values.filter((value, index, array) => array.indexOf(value) === index);
}

function formatList(values: readonly string[], emptyText = "未入力") {
  return values.length ? values.join(", ") : emptyText;
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

function formatReportPurposeLabels(formState: MeasurementWizardState) {
  return formState.reportPurposes.map((purpose) => {
    if (purpose === "other") return formState.reportPurposeOther.trim() || "その他";
    return reportPurposeOptions.find((option) => option.value === purpose)?.label ?? purpose;
  });
}

function formatAudienceType(value: AudienceType) {
  if (value === "b2b") return "BtoB";
  if (value === "b2c") return "BtoC";
  return "両方 / 要確認";
}

function formatCompetitorMode(value: CompetitorMode) {
  if (value === "known_competitors_confirmed") return "比較したい競合がある";
  return "未定 / Recoraで候補抽出";
}

function formatFrequency(value: MeasurementFrequency) {
  return frequencyOptions.find((option) => option.value === value)?.label ?? value;
}

function formatModelCount(value: ModelCountPreference) {
  return modelCountOptions.find((option) => option.value === value)?.label ?? value;
}

function formatCostPreference(value: CostPreference) {
  return costPreferenceOptions.find((option) => option.value === value)?.label ?? value;
}

function formatTopicMetricTargets(topic: TopicDraft) {
  const values = [
    topic.metricTarget.visibilityRate === "eligible" ? "AI表示率" : null,
    topic.metricTarget.ranking === "eligible" ? "ranking" : null,
    topic.metricTarget.sentiment === "eligible" ? "sentiment" : null,
    topic.metricTarget.citationCheck === "eligible" ? "citation" : null,
    topic.metricTarget.riskCheck === "eligible" ? "risk" : null
  ].filter(Boolean);
  return values.length ? values.join(" / ") : "対象外 / 要確認";
}

function formatMetricEligibility(eligibility: PromptMetricEligibility) {
  const values = [
    eligibility.visibilityRate === "eligible" ? "AI表示率" : null,
    eligibility.ranking === "eligible" ? "ranking" : null,
    eligibility.shareOfVoice === "eligible" ? "SOV" : null,
    eligibility.sentiment === "eligible" ? "sentiment" : null,
    eligibility.brandPerception === "eligible" ? "brand perception" : null,
    eligibility.citationCheck === "eligible" ? "citation check" : null
  ].filter(Boolean);
  return values.length ? values.join(" / ") : "対象外 / 要確認";
}

function translateBlocker(value: string) {
  const map: Record<string, string> = {
    "seedInput.companyName is required": "正式な対象ブランド名を入力してください。",
    "seedInput.brandName is required": "正式な対象ブランド名を入力してください。",
    "seedInput.officialSiteUrl is required": "公式ドメイン / 対象URLを入力してください。",
    "seedInput.productOrServiceDescription is required": "今回測りたい商品・サービス範囲を入力してください。",
    "seedInput.industryCategory is required": "暫定カテゴリを確認してください。",
    "seedInput.targetCustomers is required": "主な顧客層を入力してください。",
    "seedInput.regions must include at least one region": "対象市場・地域を1件以上入力してください。",
    "seedInput.language is required": "言語を入力してください。",
    "seedInput.officialSiteUrl must be an http or https URL": "公式ドメイン / 対象URLはURLとして扱える形式で入力してください。"
  };
  return map[value] ?? value;
}

function translateWarning(value: string) {
  const map: Record<string, string> = {
    known_competitors_missing_use_unknown_competitor_discovery: "競合未定のため、実名競合ではなく候補抽出モードとして扱います。",
    strengths_missing_use_general_proof_needs: "強みは入力欄化せず、一般的な確認軸で下書きしています。",
    known_risks_missing_internal_review_required: "既知リスクは入力欄化せず、NG領域は確認用メモとして扱います。",
    business_model_inference_needs_confirmation: "business modelの推定に確認が必要です。",
    industry_adapter_generic_prompt_angles_need_review: "業種別の角度が汎用寄りです。下書きの確認が必要です。",
    target_customers_broad_personas_need_confirmation: "主な顧客層が広いため、persona summaryの確認が必要です。",
    service_description_thin_prompt_angles_need_review: "測定範囲の説明が短いため、prompt角度の確認が必要です。"
  };
  return map[value] ?? value;
}

function buildConfirmationText(input: {
  formState: MeasurementWizardState;
  seedInput: ProjectSetupSeedInput;
  draft: ProjectSetupDraftGenerationResult["draft"] | null;
  promptBreakdown: Record<PromptGroup, number>;
  priorityQuestionCandidates: PriorityQuestionCandidate[];
  checklist: MeasurementChecklistItem[];
  blockers: string[];
  warnings: string[];
}) {
  const { formState, seedInput, draft } = input;
  return [
    "Recora API前確認 下書き",
    "",
    "この内容はAPI前確認の下書きです",
    "保存・承認・計測反映はまだ行いません",
    "Fetch / サイト調査 / 検索 / AI計測はこの画面では実行しません",
    "",
    `対象ブランド: ${formState.brandName}`,
    `別名・表記ゆれ: ${formatList(splitList(formState.brandAliasesText), "なしとして確認済み")}`,
    `公式ドメイン / URL: ${formatList(splitList(formState.targetUrlsText))}`,
    `測定範囲: ${formState.measurementScope}`,
    `暫定カテゴリ: ${seedInput.industryCategory}`,
    "",
    `対象市場・地域: ${formatList(splitList(formState.regionsText))}`,
    `言語: ${formState.language}`,
    `BtoB/BtoC: ${formatAudienceType(formState.audienceType)}`,
    `主な顧客層: ${formState.primaryAudience}`,
    `検討者・利用者・決裁者: ${formState.decisionRolesText}`,
    "",
    `競合モード: ${formatCompetitorMode(formState.competitorMode)}`,
    `比較したい競合: ${formatList(getKnownCompetitorsForSeed(formState), "Recoraで候補抽出")}`,
    `除外条件: ${formatList(getAvoidCompetitorsForSeed(formState), "なしとして確認済み")}`,
    formState.competitorMode === "competitor_discovery_needed"
      ? "競合未定のため、SOV/ブランド比較は候補扱いです。正式な比較には後続の承認が必要です。"
      : "",
    "",
    `重点論点: ${formatList(splitList(formState.focusAnglesText))}`,
    `NG領域: ${formatList(splitList(formState.ngAreasText), "なしとして確認済み")}`,
    `レポート目的: ${formatList(formatReportPurposeLabels(formState))}`,
    `診断したい目的（確認用メモ）: ${formState.diagnosisGoalText.trim() || "なし"}`,
    "確認用メモはProjectSetupSeedInputには含めず、generatorの下書き生成条件には使っていません。",
    "",
    `計測頻度: ${formatFrequency(formState.measurementFrequency)}`,
    `AIモデル数: ${formatModelCount(formState.modelCountPreference)}`,
    `最大プロンプト数目安: ${formState.maxPromptCount}`,
    `コスト感: ${formatCostPreference(formState.costPreference)}`,
    "",
    `persona summary: ${draft?.personas.length ?? 0}件`,
    `topic summary: ${draft?.topics.length ?? 0}件`,
    `prompt summary: ${draft?.prompts.length ?? 0}件`,
    `prompt breakdown: non-branded ${input.promptBreakdown.non_branded}件 / branded ${input.promptBreakdown.branded}件 / citation_check ${input.promptBreakdown.citation_check}件 / excluded ${input.promptBreakdown.excluded}件`,
    "必ず測りたい質問の優先候補:",
    ...(input.priorityQuestionCandidates.length
      ? input.priorityQuestionCandidates.map((question) => `- ${question.text} / ${question.label} / ${question.reason}`)
      : ["- なし"]),
    "",
    "measurement ready checklist:",
    ...input.checklist.map((item) => `- ${item.label}: ${item.status} (${item.detail})`),
    "",
    `blocker: ${input.blockers.length ? input.blockers.map(translateBlocker).join(", ") : "なし"}`,
    `warning: ${input.warnings.length ? input.warnings.map(translateWarning).join(", ") : "なし"}`,
    "",
    `カテゴリ確認メモ: ${formState.categoryNote.trim() || "なし"}`,
    `persona確認メモ: ${formState.personaNote.trim() || "なし"}`,
    `topic確認メモ: ${formState.topicNote.trim() || "なし"}`,
    `prompt確認メモ: ${formState.promptNote.trim() || "なし"}`,
    `競合確認メモ: ${formState.competitorNote.trim() || "なし"}`
  ]
    .filter((line) => line !== "")
    .join("\n");
}
