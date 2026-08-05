"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
  WandSparkles,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SiteInspectionApiResponse,
  SiteInspectionResult
} from "@/lib/recora/site-inspection-types";
import { cn } from "@/lib/utils";

const STEPS = [
  ["分析対象", Building2],
  ["事業内容", WandSparkles],
  ["ペルソナ", UsersRound],
  ["トピック", Target],
  ["測定に使う質問", MessageSquareText],
  ["最終確認", ClipboardCheck]
] as const;

const SUBJECT_TYPES = [
  "企業",
  "ブランド",
  "サービス",
  "商品",
  "店舗・施設・拠点",
  "専門家・個人"
] as const;

const BUSINESS_DOMAINS = [
  "IT・ソフトウェア",
  "マーケティング・広告",
  "法律・会計・士業",
  "小売・商品販売",
  "医療・ヘルスケア",
  "教育",
  "採用・人材",
  "不動産",
  "金融・保険",
  "旅行・宿泊",
  "飲食・美容・生活サービス",
  "建設・住宅サービス",
  "製造・産業",
  "メディア・コンテンツ",
  "その他"
] as const;

const OFFERING_MODELS = [
  "SaaS・ソフトウェア",
  "代行・受託サービス",
  "専門相談",
  "一般消費者向けサービス",
  "商品",
  "店舗・施設サービス",
  "プラットフォーム",
  "メディア・コンテンツ",
  "その他"
] as const;

const CUSTOMER_ACTIONS = [
  "購入",
  "定期購入・会員登録",
  "予約",
  "来店・来院",
  "問い合わせ",
  "見積もり・資料請求",
  "相談",
  "申込み",
  "デモ・無料体験",
  "契約",
  "応募",
  "閲覧・購読"
] as const;

const LOCALITY_DOMAINS = new Set([
  "医療・ヘルスケア",
  "教育",
  "不動産",
  "旅行・宿泊",
  "飲食・美容・生活サービス",
  "建設・住宅サービス"
]);

type AudienceScope = "b2b" | "b2c" | "both";
type AudiencePriority = "b2b" | "b2c" | "balanced";
type DeliveryMode = "online" | "in_person" | "hybrid";
type TopicPriority = "高" | "中" | "低";

type OnboardingForm = {
  subjectType: string;
  subjectName: string;
  operatorCompanyName: string;
  operatorSameAsSubject: boolean;
  officialUrl: string;
  aliases: string[];
  audienceScope: AudienceScope;
  audiencePriority: AudiencePriority;
  businessDomain: string;
  offeringModel: string;
  businessSummary: string;
  primaryAction: string;
  secondaryActions: string[];
  deliveryMode: DeliveryMode;
  serviceAreas: string[];
  locationAddresses: string[];
  targetFacilities: string[];
};

type PersonaCard = {
  id: number;
  name: string;
  audience: "BtoB" | "BtoC";
  role: string;
  issue: string;
  emphasis: string;
  finalAction: string;
  adopted: boolean;
};

type TopicCard = {
  id: number;
  name: string;
  personaIds: number[];
  summary: string;
  questionExample: string;
  priority: TopicPriority;
  adopted: boolean;
};

type MeasurementQuestion = {
  id: string;
  text: string;
  personaId: number;
  topicId: number;
  reason: string;
  important: boolean;
  customerAdded: boolean;
};

type SiteInspectionState =
  | { status: "idle" | "loading" }
  | { status: "success"; result: SiteInspectionResult }
  | { status: "failed"; message: string };

const INITIAL_FORM: OnboardingForm = {
  subjectType: "サービス",
  subjectName: "",
  operatorCompanyName: "",
  operatorSameAsSubject: false,
  officialUrl: "",
  aliases: [],
  audienceScope: "b2b",
  audiencePriority: "b2b",
  businessDomain: "IT・ソフトウェア",
  offeringModel: "SaaS・ソフトウェア",
  businessSummary: "",
  primaryAction: "問い合わせ",
  secondaryActions: [],
  deliveryMode: "online",
  serviceAreas: [],
  locationAddresses: [],
  targetFacilities: []
};

function buildPersonas(form: OnboardingForm): PersonaCard[] {
  const prioritizeB2c =
    form.audienceScope === "b2c" ||
    (form.audienceScope === "both" && form.audiencePriority === "b2c");
  const action = form.primaryAction || "問い合わせ";

  const rows: Array<
    [string, "BtoB" | "BtoC", string, string, string, string]
  > = prioritizeB2c
    ? [
        [
          "初めて選ぶ人",
          "BtoC",
          "初めて検討する本人",
          "何を比べるべきか分からない",
          "安心感、自分に合うか",
          action
        ],
        [
          "候補を比較する人",
          "BtoC",
          "複数の候補を比較する利用者",
          "料金以外の違いを整理しにくい",
          "料金、品質、口コミ",
          action
        ],
        [
          "申込前に確認する人",
          "BtoC",
          "購入・予約直前の利用者",
          "手続きや利用開始後が不安",
          "条件、手続き、サポート",
          action
        ],
        [
          "信頼性を確認する人",
          "BtoC",
          "失敗を避けたい利用者",
          "広告と実際の評価を見分けたい",
          "実績、資格、公式情報",
          "相談"
        ],
        [
          form.audienceScope === "both"
            ? "法人利用を検討する担当者"
            : "継続・乗り換えを考える人",
          form.audienceScope === "both" ? "BtoB" : "BtoC",
          "別の利用方法を検討する人",
          "変更する価値を判断したい",
          "費用、使いやすさ、継続条件",
          action
        ]
      ]
    : [
        [
          "導入判断者",
          "BtoB",
          "導入可否を決める責任者",
          "効果と費用を判断したい",
          "費用対効果、実績、リスク",
          action
        ],
        [
          "比較評価担当者",
          "BtoB",
          "複数サービスを調査する担当者",
          "各社の違いを整理しにくい",
          "機能、料金、対応範囲",
          "デモ・無料体験"
        ],
        [
          "実務利用者",
          "BtoB",
          "導入後に利用する担当者",
          "運用負荷が分からない",
          "操作性、サポート、定着",
          "問い合わせ"
        ],
        [
          "費用・契約確認者",
          "BtoB",
          "予算と契約を確認する担当者",
          "総費用を社内で説明したい",
          "料金、期間、解約条件",
          "契約"
        ],
        [
          form.audienceScope === "both"
            ? "個人として利用する人"
            : "信頼性を確認する担当者",
          form.audienceScope === "both" ? "BtoC" : "BtoB",
          "根拠を確認する人",
          "信頼できるか判断したい",
          "実績、公式情報、支援体制",
          "問い合わせ"
        ]
      ];

  return rows.map((row, index) => ({
    id: index + 1,
    name: row[0],
    audience: row[1],
    role: row[2],
    issue: row[3],
    emphasis: row[4],
    finalAction: row[5],
    adopted: true
  }));
}

function buildTopics(form: OnboardingForm): TopicCard[] {
  const subject = form.subjectName || "このサービス";
  const localityRelevant = isLocalityRelevant(form);
  const rows: Array<
    [string, number[], string, string, TopicPriority]
  > = [
    [
      `${subject}が選択肢に入る場面`,
      [1, 2],
      "課題や目的から候補を探す場面を確認します。",
      `${form.businessDomain}でおすすめの選択肢を選ぶとき、何を比較すべきですか？`,
      "高"
    ],
    [
      "比較される条件と違い",
      [2, 4],
      "料金、機能、品質、対応範囲を確認します。",
      `${subject}を比較するとき、料金以外で確認すべき点は何ですか？`,
      "高"
    ],
    [
      form.offeringModel === "商品"
        ? "品質・仕様と目的への適合"
        : "利用・導入前の不安",
      [3, 5],
      "利用前に確認される条件や不安を測定します。",
      `${subject}を利用する前に確認すべき条件は何ですか？`,
      "高"
    ],
    [
      "料金・契約・申込条件",
      [1, 4],
      `${form.primaryAction}前の料金や手続きを確認します。`,
      `${subject}の料金や契約条件で見落としやすい点はありますか？`,
      "中"
    ],
    [
      "信頼性・実績・評判",
      [4, 5],
      "実績、口コミ、専門性、公式情報を確認します。",
      `${subject}が信頼できるか判断するには何を確認すべきですか？`,
      "中"
    ],
    [
      localityRelevant
        ? "地域・アクセス・利用しやすさ"
        : "利用開始後の運用・継続",
      [1, 3],
      localityRelevant
        ? "地域、アクセス、予約、初回利用を確認します。"
        : "運用負荷、サポート、継続性を確認します。",
      localityRelevant
        ? `${form.serviceAreas[0] || "対象地域"}で${subject}を利用するときの確認点は？`
        : `${subject}の利用開始後に確認すべき運用やサポートは？`,
      "中"
    ]
  ];

  return rows.map((row, index) => ({
    id: index + 1,
    name: row[0],
    personaIds: row[1],
    summary: row[2],
    questionExample: row[3],
    priority: row[4],
    adopted: true
  }));
}

function buildQuestions(
  personas: PersonaCard[],
  topics: TopicCard[]
): MeasurementQuestion[] {
  return topics.flatMap((topic, index) => {
    const firstPersonaId = topic.personaIds[0] ?? 1;
    const secondPersonaId = topic.personaIds[1] ?? firstPersonaId;
    const firstPersona = personas.find(
      (persona) => persona.id === firstPersonaId
    );

    return [
      {
        id: `${topic.id}-a`,
        text: topic.questionExample,
        personaId: firstPersonaId,
        topicId: topic.id,
        reason: `${firstPersona?.name || "顧客"}の判断場面を確認するためです。`,
        important: index < 3,
        customerAdded: false
      },
      {
        id: `${topic.id}-b`,
        text: `${topic.name}について、選ぶ前に確認すべきポイントを教えてください。`,
        personaId: secondPersonaId,
        topicId: topic.id,
        reason: "同じテーマを別の顧客視点でも確認するためです。",
        important: index === 3,
        customerAdded: false
      }
    ];
  });
}

function isLocalityRelevant(form: OnboardingForm) {
  if (form.subjectType === "店舗・施設・拠点") return true;
  if (["予約", "来店・来院"].includes(form.primaryAction)) return true;
  if (form.offeringModel === "店舗・施設サービス") return true;
  return (
    form.deliveryMode !== "online" &&
    LOCALITY_DOMAINS.has(form.businessDomain)
  );
}

function inferBusinessClassification(result: SiteInspectionResult) {
  const source = [
    result.suggestedCategory,
    result.title,
    result.description,
    result.h1
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/クリニック|医療|歯科|病院|health/.test(source)) {
    return {
      businessDomain: "医療・ヘルスケア",
      offeringModel: "店舗・施設サービス"
    };
  }
  if (/学校|スクール|教育|塾|講座|school|education/.test(source)) {
    return {
      businessDomain: "教育",
      offeringModel: /オンライン/.test(source)
        ? "一般消費者向けサービス"
        : "店舗・施設サービス"
    };
  }
  if (/不動産|物件|賃貸|売買/.test(source)) {
    return {
      businessDomain: "不動産",
      offeringModel: "専門相談"
    };
  }
  if (/採用|人材|求人|hr/.test(source)) {
    return {
      businessDomain: "採用・人材",
      offeringModel: /saas|システム|ソフト/.test(source)
        ? "SaaS・ソフトウェア"
        : "代行・受託サービス"
    };
  }
  if (/ec|通販|オンラインショップ|商品|d2c/.test(source)) {
    return {
      businessDomain: "小売・商品販売",
      offeringModel: "商品"
    };
  }
  if (/法律|弁護士|税理士|会計|社労士|司法書士/.test(source)) {
    return {
      businessDomain: "法律・会計・士業",
      offeringModel: "専門相談"
    };
  }
  if (/マーケティング|広告|seo|広報/.test(source)) {
    return {
      businessDomain: "マーケティング・広告",
      offeringModel: /saas|ツール|ソフト/.test(source)
        ? "SaaS・ソフトウェア"
        : "代行・受託サービス"
    };
  }
  if (/saas|ソフトウェア|システム|アプリ|it/.test(source)) {
    return {
      businessDomain: "IT・ソフトウェア",
      offeringModel: "SaaS・ソフトウェア"
    };
  }
  return null;
}

export function ProjectSetupWizardV2() {
  const [step, setStep] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [form, setForm] = useState<OnboardingForm>(INITIAL_FORM);
  const [inspection, setInspection] = useState<SiteInspectionState>({
    status: "idle"
  });
  const [showEvidence, setShowEvidence] = useState(false);
  const [personas, setPersonas] = useState(() => buildPersonas(INITIAL_FORM));
  const [topics, setTopics] = useState(() => buildTopics(INITIAL_FORM));
  const [questions, setQuestions] = useState(() =>
    buildQuestions(buildPersonas(INITIAL_FORM), buildTopics(INITIAL_FORM))
  );
  const [suggestionsInitialized, setSuggestionsInitialized] = useState(false);
  const [suggestionsStale, setSuggestionsStale] = useState(false);
  const [deletedQuestions, setDeletedQuestions] = useState<
    MeasurementQuestion[]
  >([]);
  const [topicFilter, setTopicFilter] = useState(0);
  const [newQuestion, setNewQuestion] = useState("");
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const localityRelevant = useMemo(() => isLocalityRelevant(form), [form]);
  const adoptedPersonaIds = useMemo(
    () => new Set(personas.filter((persona) => persona.adopted).map((p) => p.id)),
    [personas]
  );
  const adoptedTopicIds = useMemo(
    () => new Set(topics.filter((topic) => topic.adopted).map((t) => t.id)),
    [topics]
  );
  const activeQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          adoptedPersonaIds.has(question.personaId) &&
          adoptedTopicIds.has(question.topicId)
      ),
    [adoptedPersonaIds, adoptedTopicIds, questions]
  );
  const importantQuestions = activeQuestions
    .filter((question) => question.important)
    .slice(0, 6);
  const filteredQuestions = topicFilter
    ? activeQuestions.filter((question) => question.topicId === topicFilter)
    : activeQuestions;
  const visibleQuestions = filteredQuestions.slice(
    0,
    showAllQuestions ? undefined : 8
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, complete]);

  const updateForm = <K extends keyof OnboardingForm>(
    key: K,
    value: OnboardingForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "subjectName" && current.operatorSameAsSubject
        ? { operatorCompanyName: String(value) }
        : {})
    }));
    if (suggestionsInitialized) setSuggestionsStale(true);
    setError("");
  };

  const addChip = (
    key:
      | "aliases"
      | "serviceAreas"
      | "locationAddresses"
      | "targetFacilities",
    value: string
  ) => {
    const normalized = value.trim();
    if (!normalized || form[key].includes(normalized)) return;
    updateForm(key, [...form[key], normalized]);
  };

  const refreshSuggestions = () => {
    const nextPersonas = buildPersonas(form);
    const nextTopics = buildTopics(form);
    setPersonas(nextPersonas);
    setTopics(nextTopics);
    setQuestions(buildQuestions(nextPersonas, nextTopics));
    setDeletedQuestions([]);
    setSuggestionsInitialized(true);
    setSuggestionsStale(false);
    setTopicFilter(0);
    setShowAllQuestions(false);
  };

  async function inspectSite() {
    if (!form.officialUrl.trim()) {
      setError("公式サイトURLを入力してください。");
      return;
    }

    setInspection({ status: "loading" });
    setError("");
    try {
      const response = await fetch("/api/recora/site-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.officialUrl,
          brandName: form.subjectName || undefined,
          aliases: form.aliases
        })
      });
      const data = (await response.json()) as SiteInspectionApiResponse;

      if (!response.ok || !data.ok) {
        setInspection({
          status: "failed",
          message: data.ok ? "読み取れませんでした。" : data.error
        });
        return;
      }

      const inferred = inferBusinessClassification(data.result);
      setInspection({ status: "success", result: data.result });
      setForm((current) => ({
        ...current,
        subjectName:
          current.subjectName ||
          data.result.siteName ||
          data.result.title ||
          "",
        operatorCompanyName:
          current.operatorCompanyName || data.result.siteName || "",
        businessSummary:
          data.result.suggestedServiceDescription ||
          data.result.description ||
          current.businessSummary,
        ...(inferred ?? {})
      }));
      if (suggestionsInitialized) setSuggestionsStale(true);
    } catch {
      setInspection({
        status: "failed",
        message: "読み取りに失敗しました。手動入力でも続けられます。"
      });
    }
  }

  function validateCurrentStep() {
    if (
      step === 0 &&
      (!form.subjectName.trim() ||
        !form.operatorCompanyName.trim() ||
        !form.officialUrl.trim())
    ) {
      return "分析対象名、運営会社名、公式サイトURLを確認してください。";
    }
    if (step === 1 && !form.businessSummary.trim()) {
      return "事業概要を確認してください。";
    }
    if (
      step === 1 &&
      localityRelevant &&
      !form.serviceAreas.length &&
      !form.locationAddresses.length &&
      !form.targetFacilities.length
    ) {
      return "対応地域、所在地、または分析対象の店舗・施設を入力してください。";
    }
    if (step === 2 && !personas.some((persona) => persona.adopted)) {
      return "少なくとも1件のペルソナを採用してください。";
    }
    if (step === 3 && !topics.some((topic) => topic.adopted)) {
      return "少なくとも1件のトピックを採用してください。";
    }
    if (step === 4 && !activeQuestions.length) {
      return "測定に使う質問を1件以上残してください。";
    }
    if (step === 5 && suggestionsStale) {
      return "事業内容の変更に合わせて、ペルソナ・トピック・質問の提案を更新してください。";
    }
    return "";
  }

  const goToStep = (nextStep: number, fromReview = false) => {
    setStep(nextStep);
    setMaxVisitedStep((current) => Math.max(current, nextStep));
    setReturnToReview(fromReview || (returnToReview && nextStep < 5));
    setComplete(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }

    if (step === 1 && !suggestionsInitialized) refreshSuggestions();
    goToStep(Math.min(step + 1, 5));
  };

  const backToReview = () => {
    setReturnToReview(false);
    goToStep(5);
  };

  const addQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = newQuestion.trim();
    const firstPersona = personas.find((persona) => persona.adopted);
    const firstTopic = topics.find((topic) => topic.adopted);
    if (!text || !firstPersona || !firstTopic) return;

    setQuestions((current) => [
      ...current,
      {
        id: `customer-${Date.now()}`,
        text,
        personaId: firstPersona.id,
        topicId: firstTopic.id,
        reason: "顧客が追加した確認事項を測定するためです。",
        important: true,
        customerAdded: true
      }
    ]);
    setNewQuestion("");
  };

  const CurrentIcon = STEPS[step][1];

  return (
    <main className="min-h-screen bg-[#f3f6f3] text-[#17231d]">
      <header className="sticky top-0 z-40 border-b border-[#d9e2dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#174f36] font-bold text-white">
              R
            </span>
            <div>
              <p className="text-sm font-semibold text-[#173d2c]">
                Recora 初期設定
              </p>
              <p className="hidden text-xs text-[#65766c] sm:block">
                分析対象から測定質問まで順番に確認します
              </p>
            </div>
          </div>
          <Badge className="bg-[#edf6f0] text-[#245b40]">
            Step {step + 1} / 6
          </Badge>
        </div>
        <div className="h-1 bg-[#e4ebe6]" aria-hidden="true">
          <div
            className="h-full bg-[#2f7652] transition-[width]"
            style={{ width: `${((step + 1) / 6) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <ol
          aria-label="初期設定ステップ"
          className="mb-6 hidden grid-cols-6 gap-2 lg:grid"
        >
          {STEPS.map(([title, StepIcon], index) => {
            const available = index <= maxVisitedStep;
            return (
              <li key={title}>
                <button
                  type="button"
                  aria-current={step === index ? "step" : undefined}
                  aria-disabled={!available}
                  onClick={() => available && goToStep(index)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-2xl border px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
                    step === index
                      ? "border-[#2f7652] bg-[#eef7f1]"
                      : available
                        ? "border-[#cfe0d5] bg-white"
                        : "cursor-default border-[#dde5df] bg-[#f8faf8] text-[#89958d]"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-xl",
                      step === index
                        ? "bg-[#2f7652] text-white"
                        : "bg-[#e7eee9] text-[#547060]"
                    )}
                  >
                    {index < maxVisitedStep ? (
                      <Check className="size-4" />
                    ) : (
                      <StepIcon className="size-4" />
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold">{title}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <section className="rounded-[28px] border border-[#d9e2dc] bg-white shadow-[0_18px_45px_rgba(33,72,51,0.08)]">
          <div className="border-b border-[#e1e8e3] px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f2ea] text-[#245b40]">
                <CurrentIcon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4e755f]">
                  Step {step + 1}
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 text-2xl font-semibold text-[#163d2b] outline-none sm:text-3xl"
                >
                  {STEPS[step][0]}
                </h1>
                <p className="mt-2 text-sm text-[#66766d]">
                  {
                    [
                      "公式サイトと主要な分析対象を確認します。",
                      "事業の特徴と顧客の最終行動を確認します。",
                      "顧客の視点を5件だけ確認します。",
                      "測定テーマを6件だけ確認します。",
                      "重要な質問から順に確認します。",
                      "ここまでの内容をまとめて確認します。"
                    ][step]
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            {complete ? (
              <CompleteState onBack={() => setComplete(false)} />
            ) : (
              <>
                {step === 0 && (
                  <SubjectStep
                    form={form}
                    inspection={inspection}
                    showEvidence={showEvidence}
                    updateForm={updateForm}
                    addChip={addChip}
                    inspectSite={inspectSite}
                    setShowEvidence={setShowEvidence}
                  />
                )}
                {step === 1 && (
                  <BusinessStep
                    form={form}
                    inspection={inspection}
                    localityRelevant={localityRelevant}
                    updateForm={updateForm}
                    addChip={addChip}
                  />
                )}
                {step === 2 && (
                  <PersonaStep
                    personas={personas}
                    setPersonas={setPersonas}
                    suggestionsStale={suggestionsStale}
                    refreshSuggestions={refreshSuggestions}
                  />
                )}
                {step === 3 && (
                  <TopicStep
                    topics={topics}
                    personas={personas}
                    setTopics={setTopics}
                    suggestionsStale={suggestionsStale}
                    refreshSuggestions={refreshSuggestions}
                  />
                )}
                {step === 4 && (
                  <QuestionStep
                    questions={activeQuestions}
                    setQuestions={setQuestions}
                    personas={personas}
                    topics={topics}
                    importantQuestions={importantQuestions}
                    visibleQuestions={visibleQuestions}
                    filteredQuestionCount={filteredQuestions.length}
                    topicFilter={topicFilter}
                    setTopicFilter={setTopicFilter}
                    newQuestion={newQuestion}
                    setNewQuestion={setNewQuestion}
                    addQuestion={addQuestion}
                    deletedQuestions={deletedQuestions}
                    setDeletedQuestions={setDeletedQuestions}
                    showAllQuestions={showAllQuestions}
                    setShowAllQuestions={setShowAllQuestions}
                  />
                )}
                {step === 5 && (
                  <ReviewStep
                    form={form}
                    localityRelevant={localityRelevant}
                    personas={personas}
                    topics={topics}
                    questions={activeQuestions}
                    importantQuestions={importantQuestions}
                    suggestionsStale={suggestionsStale}
                    refreshSuggestions={refreshSuggestions}
                    goToEdit={(editStep) => goToStep(editStep, true)}
                  />
                )}

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-[#e6c8c2] bg-[#fff7f5] px-4 py-3 text-sm text-[#8c3f33]"
                  >
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {!complete && (
            <div className="flex flex-col-reverse gap-3 border-t border-[#e1e8e3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
              <Button
                variant="outline"
                disabled={!step}
                onClick={() => goToStep(Math.max(0, step - 1))}
                className="h-11 rounded-xl"
              >
                <ArrowLeft className="mr-2 size-4" />
                戻る
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row">
                {returnToReview && step < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={backToReview}
                    className="h-11 rounded-xl"
                  >
                    最終確認に戻る
                  </Button>
                )}
                {step < 5 ? (
                  <Button
                    onClick={next}
                    className="h-11 rounded-xl bg-[#1f6745] px-6 text-white"
                  >
                    次へ
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const message = validateCurrentStep();
                      if (message) setError(message);
                      else setComplete(true);
                    }}
                    className="h-11 rounded-xl bg-[#174f36] px-6 text-white"
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    設定を完了する
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#244735]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[#6a7a70]">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  title,
  onClick
}: {
  selected: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
        selected
          ? "border-[#3d805c] bg-[#edf6f0]"
          : "border-[#d5dfd8] bg-white"
      )}
    >
      <span className="font-semibold text-[#314c3d]">{title}</span>
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border",
          selected
            ? "border-[#2f7652] bg-[#2f7652] text-white"
            : "border-[#c6d1c9]"
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#284637]">
      {label}
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        className="mt-2 h-11 w-full rounded-xl border border-[#cbd7cf] px-4 text-sm font-normal outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf] disabled:bg-[#f0f3f1]"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[#284637]">
      {label}
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value)
        }
        className="mt-2 h-11 w-full rounded-xl border border-[#cbd7cf] bg-white px-4 text-sm font-normal outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ChipInput({
  title,
  values,
  onAdd,
  onRemove,
  placeholder
}: {
  title: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <div>
      <p className="text-sm font-semibold text-[#284637]">{title}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setValue(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd(value);
              setValue("");
            }
          }}
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#cbd7cf] px-4 text-sm outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onAdd(value);
            setValue("");
          }}
          aria-label={`${title}を追加`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {!!values.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-[#edf6f0] px-3 py-1.5 text-xs text-[#355d47]"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`${item}を削除`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652]"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectStep({
  form,
  inspection,
  showEvidence,
  updateForm,
  addChip,
  inspectSite,
  setShowEvidence
}: {
  form: OnboardingForm;
  inspection: SiteInspectionState;
  showEvidence: boolean;
  updateForm: <K extends keyof OnboardingForm>(
    key: K,
    value: OnboardingForm[K]
  ) => void;
  addChip: (
    key:
      | "aliases"
      | "serviceAreas"
      | "locationAddresses"
      | "targetFacilities",
    value: string
  ) => void;
  inspectSite: () => void;
  setShowEvidence: (value: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      <Section title="分析する対象">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SUBJECT_TYPES.map((subjectType) => (
            <ChoiceButton
              key={subjectType}
              selected={form.subjectType === subjectType}
              title={subjectType}
              onClick={() => updateForm("subjectType", subjectType)}
            />
          ))}
        </div>
      </Section>

      <Section title="名称と公式サイト">
        <div className="grid gap-5 lg:grid-cols-2">
          <TextInput
            label="分析対象名"
            value={form.subjectName}
            placeholder="例：Recora"
            onChange={(value) => updateForm("subjectName", value)}
          />
          <div>
            <TextInput
              label="運営会社名"
              value={form.operatorCompanyName}
              disabled={form.operatorSameAsSubject}
              placeholder="例：株式会社〇〇"
              onChange={(value) => updateForm("operatorCompanyName", value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.operatorSameAsSubject}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const checked = event.target.checked;
                  updateForm("operatorSameAsSubject", checked);
                  if (checked) {
                    updateForm("operatorCompanyName", form.subjectName);
                  }
                }}
              />
              運営会社名は分析対象名と同じ
            </label>
          </div>

          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-[#284637]">
              公式サイトURL
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                value={form.officialUrl}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateForm("officialUrl", event.target.value)
                }
                placeholder="https://example.com"
                inputMode="url"
                className="h-11 min-w-0 flex-1 rounded-xl border border-[#cbd7cf] px-4 text-sm outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
              />
              <Button
                type="button"
                onClick={inspectSite}
                disabled={inspection.status === "loading"}
                className="h-11 bg-[#e4f0e8] text-[#245b40] hover:bg-[#d9eade]"
              >
                {inspection.status === "loading" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                サイトを読み取る
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <ChipInput
        title="別名・略称（任意）"
        values={form.aliases}
        placeholder="例：レコラ"
        onAdd={(value) => addChip("aliases", value)}
        onRemove={(value) =>
          updateForm(
            "aliases",
            form.aliases.filter((item) => item !== value)
          )
        }
      />

      <div aria-live="polite">
        {inspection.status === "idle" && (
          <div className="rounded-2xl border border-dashed border-[#cbd8cf] bg-[#f8faf8] p-5 text-sm text-[#64746b]">
            サイトを読み取れない場合も手動入力で続けられます。
          </div>
        )}
        {inspection.status === "loading" && (
          <div className="rounded-2xl border border-[#cfe0d5] bg-[#f2f8f4] p-5 text-sm text-[#4c6d59]">
            公式サイトを読み取っています。
          </div>
        )}
        {inspection.status === "failed" && (
          <div className="rounded-2xl border border-[#e5d3c8] bg-[#fff9f4] p-5">
            <p className="font-semibold">読み取れませんでした</p>
            <p className="mt-1 text-sm">{inspection.message}</p>
            <Button
              type="button"
              variant="outline"
              onClick={inspectSite}
              className="mt-3"
            >
              再試行
            </Button>
          </div>
        )}
        {inspection.status === "success" && (
          <div className="rounded-2xl border border-[#cfe0d5] bg-[#f2f8f4] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-[#245b40]">
                  サイトを読み取りました
                </p>
                <p className="text-sm text-[#5e7065]">
                  読み取った内容は次のステップで修正できます。
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-expanded={showEvidence}
                onClick={() => setShowEvidence(!showEvidence)}
              >
                読み取り根拠
              </Button>
            </div>
            {showEvidence && (
              <div className="mt-4 grid gap-3 border-t border-[#d7e5dc] pt-4 md:grid-cols-2">
                {[
                  ["ページタイトル", inspection.result.title],
                  ["サイト名", inspection.result.siteName],
                  ["主要見出し", inspection.result.h1],
                  ["説明文", inspection.result.description]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white p-3">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="mt-1 text-sm">
                      {value || "取得できませんでした"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessStep({
  form,
  inspection,
  localityRelevant,
  updateForm,
  addChip
}: {
  form: OnboardingForm;
  inspection: SiteInspectionState;
  localityRelevant: boolean;
  updateForm: <K extends keyof OnboardingForm>(
    key: K,
    value: OnboardingForm[K]
  ) => void;
  addChip: (
    key:
      | "aliases"
      | "serviceAreas"
      | "locationAddresses"
      | "targetFacilities",
    value: string
  ) => void;
}) {
  const toggleSecondaryAction = (value: string) => {
    if (form.secondaryActions.includes(value)) {
      updateForm(
        "secondaryActions",
        form.secondaryActions.filter((item) => item !== value)
      );
      return;
    }
    if (form.secondaryActions.length < 2 && value !== form.primaryAction) {
      updateForm("secondaryActions", [...form.secondaryActions, value]);
    }
  };

  return (
    <div className="space-y-8">
      <Section title="顧客層">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["b2b", "BtoB"],
            ["b2c", "BtoC"],
            ["both", "両方"]
          ].map(([value, label]) => (
            <ChoiceButton
              key={value}
              selected={form.audienceScope === value}
              title={label}
              onClick={() =>
                updateForm("audienceScope", value as AudienceScope)
              }
            />
          ))}
        </div>

        {form.audienceScope === "both" && (
          <div className="mt-5 rounded-2xl border border-[#d9e3dc] bg-[#f8faf8] p-4">
            <p className="mb-3 text-sm font-semibold text-[#284637]">
              主に測定したい顧客
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["b2b", "法人向けを中心"],
                ["b2c", "個人向けを中心"],
                ["balanced", "両方を同じ程度"]
              ].map(([value, label]) => (
                <ChoiceButton
                  key={value}
                  selected={form.audiencePriority === value}
                  title={label}
                  onClick={() =>
                    updateForm(
                      "audiencePriority",
                      value as AudiencePriority
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section
        title={
          inspection.status === "success"
            ? "サイトからの推定"
            : "事業内容の初期候補"
        }
        description={
          inspection.status === "success"
            ? "Recoraが公式サイトから読み取った内容です。合っているか確認してください。"
            : "サイト読み取り前の初期候補です。実際の内容に合わせて修正してください。"
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <SelectInput
            label="事業領域"
            value={form.businessDomain}
            options={BUSINESS_DOMAINS}
            onChange={(value) => updateForm("businessDomain", value)}
          />
          <SelectInput
            label="提供しているもの・サービスの形"
            value={form.offeringModel}
            options={OFFERING_MODELS}
            onChange={(value) => updateForm("offeringModel", value)}
          />
          <label className="text-sm font-semibold text-[#284637] lg:col-span-2">
            Recoraが分析した事業概要
            <textarea
              value={form.businessSummary}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                updateForm("businessSummary", event.target.value)
              }
              rows={5}
              placeholder="何を提供し、誰のどのような課題を解決する事業かを確認します。"
              className="mt-2 w-full rounded-xl border border-[#cbd7cf] px-4 py-3 text-sm font-normal outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
            />
          </label>
        </div>
      </Section>

      <Section title="顧客の最終行動">
        <div className="grid gap-5 lg:grid-cols-2">
          <SelectInput
            label="主な最終行動"
            value={form.primaryAction}
            options={CUSTOMER_ACTIONS}
            onChange={(value) => {
              updateForm("primaryAction", value);
              updateForm(
                "secondaryActions",
                form.secondaryActions.filter((item) => item !== value)
              );
            }}
          />
          <div>
            <p className="text-sm font-semibold text-[#284637]">
              補助行動（最大2件）
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CUSTOMER_ACTIONS.filter(
                (action) => action !== form.primaryAction
              ).map((action) => {
                const selected = form.secondaryActions.includes(action);
                const disabled =
                  !selected && form.secondaryActions.length >= 2;
                return (
                  <button
                    type="button"
                    key={action}
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => toggleSecondaryAction(action)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
                      selected
                        ? "border-[#3d805c] bg-[#eaf4ed]"
                        : "border-[#d3ddd6] bg-white disabled:opacity-40"
                    )}
                  >
                    {action}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section title="提供方法">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["online", "オンライン"],
            ["in_person", "対面・現地"],
            ["hybrid", "両方"]
          ].map(([value, label]) => (
            <ChoiceButton
              key={value}
              selected={form.deliveryMode === value}
              title={label}
              onClick={() =>
                updateForm("deliveryMode", value as DeliveryMode)
              }
            />
          ))}
        </div>
      </Section>

      {localityRelevant && (
        <Section
          title="地域・店舗情報"
          description="地域性のある事業にだけ表示しています。"
        >
          <div className="mb-5 flex gap-2 rounded-xl bg-[#f8faf8] p-4 text-sm text-[#50675a]">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>
              対応地域や店舗情報だけを確認します。地域を使った質問の配分はRecora側で調整します。
            </span>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <ChipInput
              title="対応地域"
              values={form.serviceAreas}
              placeholder="例：東京都、関西"
              onAdd={(value) => addChip("serviceAreas", value)}
              onRemove={(value) =>
                updateForm(
                  "serviceAreas",
                  form.serviceAreas.filter((item) => item !== value)
                )
              }
            />
            <ChipInput
              title="店舗・施設所在地"
              values={form.locationAddresses}
              placeholder="例：東京都渋谷区"
              onAdd={(value) => addChip("locationAddresses", value)}
              onRemove={(value) =>
                updateForm(
                  "locationAddresses",
                  form.locationAddresses.filter((item) => item !== value)
                )
              }
            />
            <ChipInput
              title="分析対象とする店舗・施設"
              values={form.targetFacilities}
              placeholder="例：渋谷院"
              onAdd={(value) => addChip("targetFacilities", value)}
              onRemove={(value) =>
                updateForm(
                  "targetFacilities",
                  form.targetFacilities.filter((item) => item !== value)
                )
              }
            />
          </div>
        </Section>
      )}
    </div>
  );
}

function SuggestionRefreshBanner({
  refreshSuggestions
}: {
  refreshSuggestions: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#dfd6b9] bg-[#fffaf0] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-[#705d24]">事業内容が変更されています</p>
        <p className="mt-1 text-sm text-[#796b42]">
          現在の編集内容は保持しています。「提案を更新」を押すと、編集したペルソナ・トピック・質問を新しい内容で作り直します。
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={refreshSuggestions}
        className="shrink-0"
      >
        <RefreshCw className="mr-2 size-4" />
        提案を更新
      </Button>
    </div>
  );
}

function PersonaStep({
  personas,
  setPersonas,
  suggestionsStale,
  refreshSuggestions
}: {
  personas: PersonaCard[];
  setPersonas: (
    value: PersonaCard[] | ((current: PersonaCard[]) => PersonaCard[])
  ) => void;
  suggestionsStale: boolean;
  refreshSuggestions: () => void;
}) {
  const patchPersona = <K extends keyof PersonaCard>(
    id: number,
    key: K,
    value: PersonaCard[K]
  ) => {
    setPersonas((current) =>
      current.map((persona) =>
        persona.id === id ? { ...persona, [key]: value } : persona
      )
    );
  };

  return (
    <div>
      {suggestionsStale && (
        <SuggestionRefreshBanner refreshSuggestions={refreshSuggestions} />
      )}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-[#68786f]">
          測定に使う顧客の視点を5件だけ確認します。
        </p>
        <Badge className="bg-[#edf6f0] text-[#245b40]">5件</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {personas.map((persona, index) => (
          <article
            key={persona.id}
            className={cn(
              "rounded-2xl border p-5",
              persona.adopted
                ? "border-[#d4dfd7] bg-white"
                : "border-[#e0e5e1] bg-[#f7f8f7] opacity-70"
            )}
          >
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.12em] text-[#6c7a72]">
                  PERSONA {index + 1}
                </p>
                <input
                  value={persona.name}
                  aria-label={`ペルソナ${index + 1}の名前`}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    patchPersona(persona.id, "name", event.target.value)
                  }
                  className="mt-1 w-full bg-transparent text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#d8eadf]"
                />
                <Badge variant="outline" className="mt-2">
                  {persona.audience}
                </Badge>
              </div>
              <button
                type="button"
                aria-pressed={persona.adopted}
                onClick={() =>
                  patchPersona(persona.id, "adopted", !persona.adopted)
                }
                className={cn(
                  "h-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
                  persona.adopted
                    ? "bg-[#e7f3eb] text-[#245b40]"
                    : "bg-[#ecefed] text-[#68756e]"
                )}
              >
                {persona.adopted ? "採用中" : "除外中"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 border-t border-[#e1e7e3] pt-4">
              <EditableField
                label="立場・役割"
                value={persona.role}
                onChange={(value) => patchPersona(persona.id, "role", value)}
              />
              <EditableField
                label="主な課題"
                value={persona.issue}
                onChange={(value) => patchPersona(persona.id, "issue", value)}
              />
              <EditableField
                label="比較時に重視すること"
                value={persona.emphasis}
                onChange={(value) =>
                  patchPersona(persona.id, "emphasis", value)
                }
              />
              <EditableField
                label="最終行動"
                value={persona.finalAction}
                onChange={(value) =>
                  patchPersona(persona.id, "finalAction", value)
                }
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TopicStep({
  topics,
  personas,
  setTopics,
  suggestionsStale,
  refreshSuggestions
}: {
  topics: TopicCard[];
  personas: PersonaCard[];
  setTopics: (
    value: TopicCard[] | ((current: TopicCard[]) => TopicCard[])
  ) => void;
  suggestionsStale: boolean;
  refreshSuggestions: () => void;
}) {
  const patchTopic = <K extends keyof TopicCard>(
    id: number,
    key: K,
    value: TopicCard[K]
  ) => {
    setTopics((current) =>
      current.map((topic) =>
        topic.id === id ? { ...topic, [key]: value } : topic
      )
    );
  };

  return (
    <div>
      {suggestionsStale && (
        <SuggestionRefreshBanner refreshSuggestions={refreshSuggestions} />
      )}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-[#68786f]">
          測定するテーマを6件だけ確認します。
        </p>
        <Badge className="bg-[#edf6f0] text-[#245b40]">6件</Badge>
      </div>
      <div className="space-y-4">
        {topics.map((topic, index) => (
          <article
            key={topic.id}
            className={cn(
              "rounded-2xl border p-5",
              topic.adopted
                ? "border-[#d4dfd7] bg-white"
                : "border-[#e0e5e1] bg-[#f7f8f7] opacity-70"
            )}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.12em] text-[#6c7a72]">
                  TOPIC {index + 1}
                </p>
                <input
                  value={topic.name}
                  aria-label={`トピック${index + 1}の名前`}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    patchTopic(topic.id, "name", event.target.value)
                  }
                  className="mt-1 w-full bg-transparent text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#d8eadf]"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {topic.personaIds.map((personaId) => {
                    const persona = personas.find(
                      (candidate) => candidate.id === personaId
                    );
                    return (
                      <Badge
                        key={personaId}
                        variant="outline"
                        className={cn(!persona?.adopted && "opacity-50")}
                      >
                        {persona?.name || "未設定のペルソナ"}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor={`topic-priority-${topic.id}`}>
                  {topic.name}の優先度
                </label>
                <select
                  id={`topic-priority-${topic.id}`}
                  value={topic.priority}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    patchTopic(
                      topic.id,
                      "priority",
                      event.target.value as TopicPriority
                    )
                  }
                  className="h-9 rounded-xl border border-[#cfd9d2] bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#d8eadf]"
                >
                  <option>高</option>
                  <option>中</option>
                  <option>低</option>
                </select>
                <button
                  type="button"
                  aria-pressed={topic.adopted}
                  onClick={() =>
                    patchTopic(topic.id, "adopted", !topic.adopted)
                  }
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
                    topic.adopted
                      ? "bg-[#e7f3eb] text-[#245b40]"
                      : "bg-[#ecefed] text-[#68756e]"
                  )}
                >
                  {topic.adopted ? "採用中" : "除外中"}
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 border-t border-[#e1e7e3] pt-4 lg:grid-cols-2">
              <EditableField
                label="何を確認するテーマか"
                value={topic.summary}
                onChange={(value) => patchTopic(topic.id, "summary", value)}
              />
              <EditableField
                label="質問例"
                value={topic.questionExample}
                onChange={(value) =>
                  patchTopic(topic.id, "questionExample", value)
                }
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold text-[#3f594a]">
      {label}
      <textarea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        rows={2}
        className="mt-1 w-full resize-none rounded-xl border border-[#d2ddd5] px-3 py-2 text-sm font-normal outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
      />
    </label>
  );
}

function QuestionStep({
  questions,
  setQuestions,
  personas,
  topics,
  importantQuestions,
  visibleQuestions,
  filteredQuestionCount,
  topicFilter,
  setTopicFilter,
  newQuestion,
  setNewQuestion,
  addQuestion,
  deletedQuestions,
  setDeletedQuestions,
  showAllQuestions,
  setShowAllQuestions
}: {
  questions: MeasurementQuestion[];
  setQuestions: (
    value:
      | MeasurementQuestion[]
      | ((current: MeasurementQuestion[]) => MeasurementQuestion[])
  ) => void;
  personas: PersonaCard[];
  topics: TopicCard[];
  importantQuestions: MeasurementQuestion[];
  visibleQuestions: MeasurementQuestion[];
  filteredQuestionCount: number;
  topicFilter: number;
  setTopicFilter: (value: number) => void;
  newQuestion: string;
  setNewQuestion: (value: string) => void;
  addQuestion: (event: FormEvent<HTMLFormElement>) => void;
  deletedQuestions: MeasurementQuestion[];
  setDeletedQuestions: (
    value:
      | MeasurementQuestion[]
      | ((current: MeasurementQuestion[]) => MeasurementQuestion[])
  ) => void;
  showAllQuestions: boolean;
  setShowAllQuestions: (value: boolean) => void;
}) {
  const patchQuestion = (id: string, text: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, text } : question
      )
    );
  };

  const removeQuestion = (question: MeasurementQuestion) => {
    setQuestions((current) =>
      current.filter((item) => item.id !== question.id)
    );
    setDeletedQuestions((current) => [question, ...current]);
  };

  const undoDelete = () => {
    const [question, ...rest] = deletedQuestions;
    if (!question) return;
    setQuestions((current) => [...current, question]);
    setDeletedQuestions(rest);
  };

  const adoptedTopics = topics.filter((topic) => topic.adopted);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#d7e2da] bg-[#f8faf8] p-4 text-sm text-[#52675a]">
        測定に使う質問を確認します。実際の質問数は契約プランから自動決定され、この画面で件数を選ぶ必要はありません。
      </div>

      <Section title="重要な質問">
        <div className="grid gap-3 lg:grid-cols-2">
          {importantQuestions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-2xl bg-[#f2f8f4] p-5"
            >
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#2f7652] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{question.text}</p>
                  <p className="mt-2 text-xs text-[#637369]">
                    {question.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="質問を追加">
        <form onSubmit={addQuestion} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newQuestion}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewQuestion(event.target.value)
            }
            placeholder="追加したい質問を入力"
            className="h-11 min-w-0 flex-1 rounded-xl border border-[#cbd7cf] px-4 outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
            aria-label="追加する質問"
          />
          <Button type="submit" className="h-11">
            <Plus className="mr-2 size-4" />
            追加
          </Button>
        </form>
      </Section>

      <Section
        title="全質問を確認"
        description={`${questions.length}件の質問プレビューをトピック別に確認できます。`}
      >
        <div className="mb-4 flex flex-wrap gap-2 border-b border-[#e1e7e3] pb-4">
          <FilterButton
            active={!topicFilter}
            onClick={() => {
              setTopicFilter(0);
              setShowAllQuestions(false);
            }}
          >
            すべて
          </FilterButton>
          {adoptedTopics.map((topic) => (
            <FilterButton
              key={topic.id}
              active={topicFilter === topic.id}
              onClick={() => {
                setTopicFilter(topic.id);
                setShowAllQuestions(false);
              }}
            >
              {topic.name}
            </FilterButton>
          ))}
          {!!deletedQuestions.length && (
            <Button
              type="button"
              variant="outline"
              onClick={undoDelete}
              className="sm:ml-auto"
            >
              <RotateCcw className="mr-2 size-4" />
              削除を取り消す
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {visibleQuestions.map((question) => (
            <article key={question.id} className="rounded-2xl border p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                {question.important && <Badge>重要</Badge>}
                {question.customerAdded && (
                  <Badge variant="outline">追加した質問</Badge>
                )}
                <Badge variant="outline">
                  {personas.find(
                    (persona) => persona.id === question.personaId
                  )?.name || "ペルソナ未設定"}
                </Badge>
                <Badge variant="outline">
                  {topics.find((topic) => topic.id === question.topicId)?.name ||
                    "トピック未設定"}
                </Badge>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={question.text}
                  aria-label="測定に使う質問"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    patchQuestion(question.id, event.target.value)
                  }
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-xl border border-[#d2ddd5] px-3 py-2 text-sm font-semibold outline-none focus:border-[#3d805c] focus:ring-2 focus:ring-[#d8eadf]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeQuestion(question)}
                  aria-label="質問を削除"
                  className="shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-sm text-[#627269]">
                この質問を測る理由：{question.reason}
              </p>
            </article>
          ))}
        </div>

        {filteredQuestionCount > 8 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAllQuestions(!showAllQuestions)}
            className="mt-4 w-full"
          >
            {showAllQuestions ? "表示を戻す" : "さらに表示"}
          </Button>
        )}
      </Section>
    </div>
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
        "max-w-full truncate rounded-full border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
        active
          ? "border-[#3d805c] bg-[#eaf4ed]"
          : "border-[#d3ddd6] bg-white"
      )}
    >
      {children}
    </button>
  );
}

function ReviewStep({
  form,
  localityRelevant,
  personas,
  topics,
  questions,
  importantQuestions,
  suggestionsStale,
  refreshSuggestions,
  goToEdit
}: {
  form: OnboardingForm;
  localityRelevant: boolean;
  personas: PersonaCard[];
  topics: TopicCard[];
  questions: MeasurementQuestion[];
  importantQuestions: MeasurementQuestion[];
  suggestionsStale: boolean;
  refreshSuggestions: () => void;
  goToEdit: (step: number) => void;
}) {
  const adoptedPersonas = personas.filter((persona) => persona.adopted);
  const adoptedTopics = topics.filter((topic) => topic.adopted);

  return (
    <div className="space-y-5">
      {suggestionsStale && (
        <SuggestionRefreshBanner refreshSuggestions={refreshSuggestions} />
      )}
      <ReviewCard title="分析対象" step={0} goToEdit={goToEdit}>
        <ReviewRow label="種類" value={form.subjectType} />
        <ReviewRow label="分析対象名" value={form.subjectName} />
        <ReviewRow label="運営会社" value={form.operatorCompanyName} />
        <ReviewRow label="公式サイト" value={form.officialUrl} />
      </ReviewCard>

      <ReviewCard title="事業内容" step={1} goToEdit={goToEdit}>
        <ReviewRow
          label="顧客層"
          value={
            form.audienceScope === "b2b"
              ? "BtoB"
              : form.audienceScope === "b2c"
                ? "BtoC"
                : "両方"
          }
        />
        {form.audienceScope === "both" && (
          <ReviewRow
            label="主に測定する顧客"
            value={
              form.audiencePriority === "b2b"
                ? "法人向けを中心"
                : form.audiencePriority === "b2c"
                  ? "個人向けを中心"
                  : "両方を同じ程度"
            }
          />
        )}
        <ReviewRow label="事業領域" value={form.businessDomain} />
        <ReviewRow label="サービスの形" value={form.offeringModel} />
        <ReviewRow label="主な最終行動" value={form.primaryAction} />
        <ReviewRow
          label="補助行動"
          value={form.secondaryActions.join("、") || "なし"}
        />
        <ReviewRow
          label="提供方法"
          value={
            form.deliveryMode === "online"
              ? "オンライン"
              : form.deliveryMode === "in_person"
                ? "対面・現地"
                : "両方"
          }
        />
        <ReviewRow label="事業概要" value={form.businessSummary} />
        {localityRelevant && (
          <ReviewRow
            label="地域・店舗"
            value={
              [
                ...form.serviceAreas,
                ...form.locationAddresses,
                ...form.targetFacilities
              ].join("、") || "未入力"
            }
          />
        )}
      </ReviewCard>

      <ReviewCard
        title={`ペルソナ 5件（採用 ${adoptedPersonas.length}件）`}
        step={2}
        goToEdit={goToEdit}
      >
        <ReviewGrid
          items={personas.map((persona) => [
            persona.name,
            persona.adopted ? "採用" : "除外"
          ])}
        />
      </ReviewCard>

      <ReviewCard
        title={`トピック 6件（採用 ${adoptedTopics.length}件）`}
        step={3}
        goToEdit={goToEdit}
      >
        <ReviewGrid
          items={topics.map((topic) => [
            topic.name,
            `優先度 ${topic.priority}・${topic.adopted ? "採用" : "除外"}`
          ])}
        />
      </ReviewCard>

      <ReviewCard
        title={`画面で確認する質問 ${questions.length}件`}
        step={4}
        goToEdit={goToEdit}
      >
        <p className="mb-4 rounded-xl bg-[#f8faf8] p-3 text-sm text-[#5d6f64]">
          実際の質問数は契約プランから自動決定します。
        </p>
        {importantQuestions.map((question, index) => (
          <div
            key={question.id}
            className="mb-2 flex gap-3 rounded-xl bg-[#f8faf8] p-3"
          >
            <b>{index + 1}</b>
            <p className="text-sm">{question.text}</p>
          </div>
        ))}
      </ReviewCard>
    </div>
  );
}

function ReviewCard({
  title,
  step,
  goToEdit,
  children
}: {
  title: string;
  step: number;
  goToEdit: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#d8e1da] p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e1e7e3] pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" variant="ghost" onClick={() => goToEdit(step)}>
          <Pencil className="mr-2 size-4" />
          変更
        </Button>
      </div>
      {children}
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[#edf0ee] py-3 last:border-0 sm:grid-cols-[180px_1fr]">
      <p className="text-sm text-[#6b796f]">{label}</p>
      <p className="break-words text-sm">{value || "未入力"}</p>
    </div>
  );
}

function ReviewGrid({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map(([title, description], index) => (
        <div key={`${title}-${index}`} className="rounded-xl bg-[#f8faf8] p-3">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-[#65756b]">{description}</p>
        </div>
      ))}
    </div>
  );
}

function CompleteState({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-14 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#e3f1e7] text-[#245b40]">
        <CheckCircle2 className="size-8" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold text-[#173d2c]">
        設定内容の確認が完了しました
      </h2>
      <p className="mt-3 text-sm text-[#627269]">
        現在は設定内容の確認まで完了しています。測定はまだ開始されていません。
      </p>
      <Button type="button" variant="outline" onClick={onBack} className="mt-6">
        内容をもう一度確認する
      </Button>
    </div>
  );
}
