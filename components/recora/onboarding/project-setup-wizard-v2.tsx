"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  KeyboardEvent,
  ReactNode,
  SetStateAction
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
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

type PersonaCandidate = {
  candidateKey: string;
  name: string;
  audience: "BtoB" | "BtoC";
  role: string;
  issue: string;
  emphasis: string;
  finalAction: string;
};

type PersonaSelection = PersonaCandidate & {
  slotId: number;
};

type TopicCandidate = {
  candidateKey: string;
  name: string;
  personaSlots: number[];
  summary: string;
  questionExample: string;
  priority: TopicPriority;
};

type TopicSelection = TopicCandidate & {
  slotId: number;
};

type MeasurementQuestion = {
  id: string;
  text: string;
  personaSlotId: number;
  topicSlotId: number;
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

function buildPersonaPool(form: OnboardingForm): PersonaCandidate[] {
  const action = form.primaryAction || "問い合わせ";

  const b2b: PersonaCandidate[] = [
    {
      candidateKey: "b2b-decision-owner",
      name: "導入判断者",
      audience: "BtoB",
      role: "導入可否を決める責任者",
      issue: "効果と費用を判断したい",
      emphasis: "費用対効果、実績、リスク",
      finalAction: action
    },
    {
      candidateKey: "b2b-evaluator",
      name: "比較評価担当者",
      audience: "BtoB",
      role: "複数サービスを調査する担当者",
      issue: "各社の違いを整理しにくい",
      emphasis: "機能、料金、対応範囲",
      finalAction: "デモ・無料体験"
    },
    {
      candidateKey: "b2b-practical-user",
      name: "実務利用者",
      audience: "BtoB",
      role: "導入後に利用する担当者",
      issue: "運用負荷や使い勝手が分からない",
      emphasis: "操作性、サポート、定着",
      finalAction: "問い合わせ"
    },
    {
      candidateKey: "b2b-economic-buyer",
      name: "費用・契約確認者",
      audience: "BtoB",
      role: "予算と契約条件を確認する担当者",
      issue: "総費用を社内で説明したい",
      emphasis: "料金、契約期間、解約条件",
      finalAction: "契約"
    },
    {
      candidateKey: "b2b-trust-checker",
      name: "信頼性を確認する担当者",
      audience: "BtoB",
      role: "実績や支援体制を確認する人",
      issue: "安心して任せられるか判断したい",
      emphasis: "導入実績、公式情報、支援体制",
      finalAction: "問い合わせ"
    },
    {
      candidateKey: "b2b-technical-reviewer",
      name: "技術・セキュリティ確認者",
      audience: "BtoB",
      role: "システム要件や安全性を確認する担当者",
      issue: "既存環境へ安全に導入できるか分からない",
      emphasis: "セキュリティ、連携、データ管理",
      finalAction: "デモ・無料体験"
    },
    {
      candidateKey: "b2b-procurement",
      name: "調達・購買担当者",
      audience: "BtoB",
      role: "契約手続きと取引条件を確認する担当者",
      issue: "社内基準を満たすか確認したい",
      emphasis: "見積もり、契約条件、取引実績",
      finalAction: "契約"
    },
    {
      candidateKey: "b2b-internal-advocate",
      name: "社内提案を進める担当者",
      audience: "BtoB",
      role: "導入メリットを社内へ説明する人",
      issue: "稟議に必要な根拠をまとめたい",
      emphasis: "効果、導入事例、比較根拠",
      finalAction: "見積もり・資料請求"
    }
  ];

  const b2c: PersonaCandidate[] = [
    {
      candidateKey: "b2c-first-time",
      name: "初めて選ぶ人",
      audience: "BtoC",
      role: "初めて検討する本人",
      issue: "何を比べるべきか分からない",
      emphasis: "安心感、自分に合うか",
      finalAction: action
    },
    {
      candidateKey: "b2c-comparer",
      name: "候補を比較する人",
      audience: "BtoC",
      role: "複数の候補を比較する利用者",
      issue: "料金以外の違いを整理しにくい",
      emphasis: "料金、品質、口コミ",
      finalAction: action
    },
    {
      candidateKey: "b2c-ready-to-act",
      name: "申込前に確認する人",
      audience: "BtoC",
      role: "購入・予約直前の利用者",
      issue: "手続きや利用開始後が不安",
      emphasis: "条件、手続き、サポート",
      finalAction: action
    },
    {
      candidateKey: "b2c-trust-checker",
      name: "信頼性を確認する人",
      audience: "BtoC",
      role: "失敗を避けたい利用者",
      issue: "広告と実際の評価を見分けたい",
      emphasis: "実績、資格、公式情報",
      finalAction: "相談"
    },
    {
      candidateKey: "b2c-repeat-switch",
      name: "継続・乗り換えを考える人",
      audience: "BtoC",
      role: "継続利用や別サービスを検討する人",
      issue: "変更する価値を判断したい",
      emphasis: "費用、使いやすさ、継続条件",
      finalAction: action
    },
    {
      candidateKey: "b2c-price-checker",
      name: "料金を重視する人",
      audience: "BtoC",
      role: "予算内で選びたい利用者",
      issue: "追加料金や総額が分かりにくい",
      emphasis: "総額、追加費用、解約条件",
      finalAction: action
    },
    {
      candidateKey: "b2c-family",
      name: "家族・保護者として確認する人",
      audience: "BtoC",
      role: "本人に代わって安全性や条件を確認する人",
      issue: "本人に適した選択か判断したい",
      emphasis: "安全性、説明、継続しやすさ",
      finalAction: "相談"
    },
    {
      candidateKey: "b2c-local-searcher",
      name: "近くで利用先を探す人",
      audience: "BtoC",
      role: "通いやすい候補を探す利用者",
      issue: "場所と利用条件をまとめて比較したい",
      emphasis: "地域、アクセス、営業時間",
      finalAction: ["予約", "来店・来院"].includes(action) ? action : "予約"
    }
  ];

  if (form.audienceScope === "b2b") return b2b;
  if (form.audienceScope === "b2c") return b2c;

  if (form.audiencePriority === "b2b") {
    return [
      b2b[0],
      b2b[1],
      b2b[2],
      b2b[3],
      b2c[0],
      ...b2b.slice(4),
      ...b2c.slice(1)
    ];
  }
  if (form.audiencePriority === "b2c") {
    return [
      b2c[0],
      b2c[1],
      b2c[2],
      b2c[3],
      b2b[0],
      ...b2c.slice(4),
      ...b2b.slice(1)
    ];
  }

  return [
    b2b[0],
    b2c[0],
    b2b[1],
    b2c[1],
    b2b[2],
    b2c[2],
    ...b2b.slice(3),
    ...b2c.slice(3)
  ];
}

function buildDefaultPersonas(form: OnboardingForm): PersonaSelection[] {
  return buildPersonaPool(form)
    .slice(0, 5)
    .map((candidate, index) => ({ ...candidate, slotId: index + 1 }));
}

function buildTopicPool(form: OnboardingForm): TopicCandidate[] {
  const subject = form.subjectName || "このサービス";
  const localityRelevant = isLocalityRelevant(form);
  const topics: TopicCandidate[] = [
    {
      candidateKey: "candidate-entry",
      name: `${subject}が選択肢に入る場面`,
      personaSlots: [1, 2],
      summary: "課題や目的から候補を探す場面を確認します。",
      questionExample: `${form.businessDomain}でおすすめの選択肢を選ぶとき、何を比較すべきですか？`,
      priority: "高"
    },
    {
      candidateKey: "comparison-differences",
      name: "比較される条件と違い",
      personaSlots: [2, 4],
      summary: "料金、機能、品質、対応範囲の違いを確認します。",
      questionExample: `${subject}を比較するとき、料金以外で確認すべき点は何ですか？`,
      priority: "高"
    },
    {
      candidateKey: "pre-use-concerns",
      name:
        form.offeringModel === "商品"
          ? "品質・仕様と目的への適合"
          : "利用・導入前の不安",
      personaSlots: [3, 5],
      summary: "利用前に確認される条件や不安を測定します。",
      questionExample: `${subject}を利用する前に確認すべき条件は何ですか？`,
      priority: "高"
    },
    {
      candidateKey: "price-contract",
      name: "料金・契約・申込条件",
      personaSlots: [1, 4],
      summary: `${form.primaryAction}前の料金や手続きを確認します。`,
      questionExample: `${subject}の料金や契約条件で見落としやすい点はありますか？`,
      priority: "高"
    },
    {
      candidateKey: "trust-reputation",
      name: "信頼性・実績・評判",
      personaSlots: [4, 5],
      summary: "実績、口コミ、専門性、公式情報を確認します。",
      questionExample: `${subject}が信頼できるか判断するには何を確認すべきですか？`,
      priority: "中"
    },
    {
      candidateKey: localityRelevant ? "local-access" : "operation-continuity",
      name: localityRelevant
        ? "地域・アクセス・利用しやすさ"
        : "利用開始後の運用・継続",
      personaSlots: [1, 3],
      summary: localityRelevant
        ? "地域、アクセス、予約、初回利用を確認します。"
        : "運用負荷、サポート、継続性を確認します。",
      questionExample: localityRelevant
        ? `${form.serviceAreas[0] || "対象地域"}で${subject}を利用するときの確認点は？`
        : `${subject}の利用開始後に確認すべき運用やサポートは？`,
      priority: "中"
    },
    {
      candidateKey: "alternatives",
      name: "代替手段・別の選択肢",
      personaSlots: [1, 2],
      summary: "別カテゴリや別の解決方法と比較される場面を確認します。",
      questionExample: `${subject}以外には、どのような選択肢がありますか？`,
      priority: "中"
    },
    {
      candidateKey: "support-aftercare",
      name: "サポート・利用後の対応",
      personaSlots: [3, 5],
      summary: "導入後や購入後の支援、問い合わせ対応を確認します。",
      questionExample: `${subject}の利用後に受けられるサポートは何を確認すべきですか？`,
      priority: "中"
    },
    {
      candidateKey: "proof-evidence",
      name: "公式情報・根拠の確認",
      personaSlots: [4, 5],
      summary: "説明の根拠や公式情報の分かりやすさを確認します。",
      questionExample: `${subject}の特徴や実績を確認できる公式な根拠はありますか？`,
      priority: "中"
    },
    {
      candidateKey: "first-step",
      name: "初回利用・導入の進め方",
      personaSlots: [1, 3],
      summary: "最初の相談、体験、申込みまでの流れを確認します。",
      questionExample: `${subject}を初めて利用するとき、どのように進めればよいですか？`,
      priority: "中"
    },
    {
      candidateKey: "fit-not-fit",
      name: "向いている人・向いていない人",
      personaSlots: [1, 2],
      summary: "利用目的や条件との相性を確認します。",
      questionExample: `${subject}はどのような人や企業に向いていますか？`,
      priority: "低"
    },
    {
      candidateKey: "risk-cautions",
      name: "注意点・リスク・失敗しやすい点",
      personaSlots: [4, 5],
      summary: "選択前に確認すべき注意点やリスクを確認します。",
      questionExample: `${subject}を選ぶ前に注意すべき点はありますか？`,
      priority: "中"
    }
  ];

  if (form.offeringModel === "SaaS・ソフトウェア") {
    topics.push(
      {
        candidateKey: "integration-migration",
        name: "連携・移行・導入負荷",
        personaSlots: [2, 3],
        summary: "既存システム連携やデータ移行の負荷を確認します。",
        questionExample: `${subject}の導入時に、連携やデータ移行で確認すべき点は何ですか？`,
        priority: "中"
      },
      {
        candidateKey: "security-data",
        name: "セキュリティ・データ管理",
        personaSlots: [4, 5],
        summary: "安全性、権限、データの取り扱いを確認します。",
        questionExample: `${subject}のセキュリティやデータ管理で確認すべき点は何ですか？`,
        priority: "高"
      }
    );
  }

  if (form.offeringModel === "商品") {
    topics.push(
      {
        candidateKey: "delivery-return",
        name: "配送・返品・交換",
        personaSlots: [2, 3],
        summary: "購入後の配送条件と返品・交換条件を確認します。",
        questionExample: `${subject}の配送や返品条件で確認すべき点は何ですか？`,
        priority: "中"
      },
      {
        candidateKey: "materials-spec",
        name: "素材・成分・仕様",
        personaSlots: [2, 4],
        summary: "商品を選ぶ際の素材、成分、仕様を確認します。",
        questionExample: `${subject}の素材や仕様は、どのように比較すればよいですか？`,
        priority: "高"
      }
    );
  }

  return topics;
}

function buildDefaultTopics(form: OnboardingForm): TopicSelection[] {
  return buildTopicPool(form)
    .slice(0, 6)
    .map((candidate, index) => ({ ...candidate, slotId: index + 1 }));
}

function buildGeneratedQuestions(
  personas: PersonaSelection[],
  topics: TopicSelection[]
): MeasurementQuestion[] {
  return topics.flatMap((topic, index) => {
    const firstPersonaSlot = topic.personaSlots[0] ?? 1;
    const secondPersonaSlot = topic.personaSlots[1] ?? firstPersonaSlot;
    const firstPersona = personas.find(
      (persona) => persona.slotId === firstPersonaSlot
    );

    return [
      {
        id: `generated-${topic.slotId}-a`,
        text: topic.questionExample,
        personaSlotId: firstPersonaSlot,
        topicSlotId: topic.slotId,
        reason: `${firstPersona?.name || "顧客"}の判断場面を確認するためです。`,
        important: index < 3,
        customerAdded: false
      },
      {
        id: `generated-${topic.slotId}-b`,
        text: `${topic.name}について、選ぶ前に確認すべきポイントを教えてください。`,
        personaSlotId: secondPersonaSlot,
        topicSlotId: topic.slotId,
        reason: "同じテーマを別の顧客視点でも確認するためです。",
        important: index === 3,
        customerAdded: false
      }
    ];
  });
}

function preserveCustomerQuestions(
  current: MeasurementQuestion[],
  generated: MeasurementQuestion[]
) {
  return [...generated, ...current.filter((question) => question.customerAdded)];
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
    return { businessDomain: "不動産", offeringModel: "専門相談" };
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
    return { businessDomain: "小売・商品販売", offeringModel: "商品" };
  }
  if (/法律|弁護士|税理士|会計|社労士|司法書士/.test(source)) {
    return { businessDomain: "法律・会計・士業", offeringModel: "専門相談" };
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
  const [personas, setPersonas] = useState<PersonaSelection[]>(() =>
    buildDefaultPersonas(INITIAL_FORM)
  );
  const [topics, setTopics] = useState<TopicSelection[]>(() =>
    buildDefaultTopics(INITIAL_FORM)
  );
  const [questions, setQuestions] = useState<MeasurementQuestion[]>(() =>
    buildGeneratedQuestions(
      buildDefaultPersonas(INITIAL_FORM),
      buildDefaultTopics(INITIAL_FORM)
    )
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
  const personaPool = useMemo(() => buildPersonaPool(form), [form]);
  const topicPool = useMemo(() => buildTopicPool(form), [form]);
  const importantQuestions = questions
    .filter((question) => question.important)
    .slice(0, 6);
  const filteredQuestions = topicFilter
    ? questions.filter((question) => question.topicSlotId === topicFilter)
    : questions;
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
    const nextPersonas = buildDefaultPersonas(form);
    const nextTopics = buildDefaultTopics(form);
    setPersonas(nextPersonas);
    setTopics(nextTopics);
    setQuestions((current) =>
      preserveCustomerQuestions(
        current,
        buildGeneratedQuestions(nextPersonas, nextTopics)
      )
    );
    setDeletedQuestions([]);
    setSuggestionsInitialized(true);
    setSuggestionsStale(false);
    setTopicFilter(0);
    setShowAllQuestions(false);
  };

  const replacePersona = (slotId: number, candidateKey: string) => {
    const candidate = personaPool.find(
      (item) => item.candidateKey === candidateKey
    );
    if (!candidate) return;
    const nextPersonas = personas.map((persona) =>
      persona.slotId === slotId ? { ...candidate, slotId } : persona
    );
    setPersonas(nextPersonas);
    setQuestions((current) =>
      preserveCustomerQuestions(
        current,
        buildGeneratedQuestions(nextPersonas, topics)
      )
    );
    setDeletedQuestions([]);
  };

  const replaceTopic = (slotId: number, candidateKey: string) => {
    const candidate = topicPool.find(
      (item) => item.candidateKey === candidateKey
    );
    if (!candidate) return;
    const nextTopics = topics.map((topic) =>
      topic.slotId === slotId ? { ...candidate, slotId } : topic
    );
    setTopics(nextTopics);
    setQuestions((current) =>
      preserveCustomerQuestions(
        current,
        buildGeneratedQuestions(personas, nextTopics)
      )
    );
    setDeletedQuestions([]);
    if (topicFilter === slotId) setTopicFilter(0);
  };

  const changeTopicPriority = (slotId: number, priority: TopicPriority) => {
    setTopics((current) =>
      current.map((topic) =>
        topic.slotId === slotId ? { ...topic, priority } : topic
      )
    );
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
    if (step === 2 && personas.length !== 5) {
      return "ペルソナを5件選択してください。";
    }
    if (step === 3 && topics.length !== 6) {
      return "トピックを6件選択してください。";
    }
    if (step === 4 && !questions.length) {
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
    const firstPersona = personas[0];
    const firstTopic = topics[0];
    if (!text || !firstPersona || !firstTopic) return;

    setQuestions((current) => [
      ...current,
      {
        id: `customer-${Date.now()}`,
        text,
        personaSlotId: firstPersona.slotId,
        topicSlotId: firstTopic.slotId,
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
                      "候補から顧客の視点を5件選びます。",
                      "候補から測定テーマを6件選びます。",
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
                    candidatePool={personaPool}
                    replacePersona={replacePersona}
                    suggestionsStale={suggestionsStale}
                    refreshSuggestions={refreshSuggestions}
                  />
                )}
                {step === 3 && (
                  <TopicStep
                    topics={topics}
                    personas={personas}
                    candidatePool={topicPool}
                    replaceTopic={replaceTopic}
                    changePriority={changeTopicPriority}
                    suggestionsStale={suggestionsStale}
                    refreshSuggestions={refreshSuggestions}
                  />
                )}
                {step === 4 && (
                  <QuestionStep
                    questions={questions}
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
                    questions={questions}
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
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
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
                  if (checked) updateForm("operatorCompanyName", form.subjectName);
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
            <Button type="button" variant="outline" onClick={inspectSite} className="mt-3">
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
          「提案を更新」を押すと、現在の事業内容に合うペルソナ5件・トピック6件へ戻します。顧客が追加した質問は保持します。
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
  candidatePool,
  replacePersona,
  suggestionsStale,
  refreshSuggestions
}: {
  personas: PersonaSelection[];
  candidatePool: PersonaCandidate[];
  replacePersona: (slotId: number, candidateKey: string) => void;
  suggestionsStale: boolean;
  refreshSuggestions: () => void;
}) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const selectedKeys = new Set(personas.map((persona) => persona.candidateKey));

  return (
    <div>
      {suggestionsStale && (
        <SuggestionRefreshBanner refreshSuggestions={refreshSuggestions} />
      )}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#68786f]">
            選択済みの5件を確認します。内容を直接編集せず、必要な枠だけ別の候補へ変更できます。
          </p>
          <p className="mt-1 text-xs text-[#7b8980]">
            他の候補は「候補を変更」を押したときだけ表示されます。
          </p>
        </div>
        <Badge className="w-fit bg-[#edf6f0] text-[#245b40]">5件</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {personas.map((persona, index) => {
          const expanded = openSlot === persona.slotId;
          return (
            <article
              key={persona.slotId}
              className="rounded-2xl border border-[#d4dfd7] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#6c7a72]">
                    PERSONA {index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[#203d2e]">
                    {persona.name}
                  </h2>
                  <Badge variant="outline" className="mt-2">
                    {persona.audience}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={expanded}
                  onClick={() => setOpenSlot(expanded ? null : persona.slotId)}
                  className="shrink-0"
                >
                  候補を変更
                  <ChevronDown
                    className={cn(
                      "ml-2 size-4 transition-transform",
                      expanded && "rotate-180"
                    )}
                  />
                </Button>
              </div>

              <dl className="mt-4 grid gap-3 border-t border-[#e1e7e3] pt-4">
                <ReadonlyDetail label="立場・役割" value={persona.role} />
                <ReadonlyDetail label="主な課題" value={persona.issue} />
                <ReadonlyDetail
                  label="比較時に重視すること"
                  value={persona.emphasis}
                />
                <ReadonlyDetail label="最終行動" value={persona.finalAction} />
              </dl>

              {expanded && (
                <CandidatePanel title="この枠に入れる別のペルソナ候補">
                  {candidatePool.map((candidate) => {
                    const current = candidate.candidateKey === persona.candidateKey;
                    const usedElsewhere =
                      selectedKeys.has(candidate.candidateKey) && !current;
                    return (
                      <CandidateOption
                        key={candidate.candidateKey}
                        selected={current}
                        disabled={usedElsewhere}
                        title={candidate.name}
                        meta={`${candidate.audience}・${candidate.role}`}
                        description={candidate.issue}
                        onClick={() => {
                          replacePersona(persona.slotId, candidate.candidateKey);
                          setOpenSlot(null);
                        }}
                      />
                    );
                  })}
                </CandidatePanel>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TopicStep({
  topics,
  personas,
  candidatePool,
  replaceTopic,
  changePriority,
  suggestionsStale,
  refreshSuggestions
}: {
  topics: TopicSelection[];
  personas: PersonaSelection[];
  candidatePool: TopicCandidate[];
  replaceTopic: (slotId: number, candidateKey: string) => void;
  changePriority: (slotId: number, priority: TopicPriority) => void;
  suggestionsStale: boolean;
  refreshSuggestions: () => void;
}) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const selectedKeys = new Set(topics.map((topic) => topic.candidateKey));

  return (
    <div>
      {suggestionsStale && (
        <SuggestionRefreshBanner refreshSuggestions={refreshSuggestions} />
      )}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#68786f]">
            選択済みの6件を確認します。テーマ文を直接編集せず、必要な枠だけ別の候補へ変更できます。
          </p>
          <p className="mt-1 text-xs text-[#7b8980]">
            候補を変更すると、そのトピックに紐づく自動生成質問も更新されます。
          </p>
        </div>
        <Badge className="w-fit bg-[#edf6f0] text-[#245b40]">6件</Badge>
      </div>

      <div className="space-y-4">
        {topics.map((topic, index) => {
          const expanded = openSlot === topic.slotId;
          return (
            <article
              key={topic.slotId}
              className="rounded-2xl border border-[#d4dfd7] bg-white p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#6c7a72]">
                    TOPIC {index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[#203d2e]">
                    {topic.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topic.personaSlots.map((personaSlot) => (
                      <Badge key={personaSlot} variant="outline">
                        {personas.find((persona) => persona.slotId === personaSlot)
                          ?.name || "ペルソナ未設定"}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="sr-only" htmlFor={`topic-priority-${topic.slotId}`}>
                    {topic.name}の優先度
                  </label>
                  <select
                    id={`topic-priority-${topic.slotId}`}
                    value={topic.priority}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      changePriority(
                        topic.slotId,
                        event.target.value as TopicPriority
                      )
                    }
                    className="h-10 rounded-xl border border-[#cfd9d2] bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#d8eadf]"
                  >
                    <option>高</option>
                    <option>中</option>
                    <option>低</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    aria-expanded={expanded}
                    onClick={() => setOpenSlot(expanded ? null : topic.slotId)}
                  >
                    候補を変更
                    <ChevronDown
                      className={cn(
                        "ml-2 size-4 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </Button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 border-t border-[#e1e7e3] pt-4 lg:grid-cols-2">
                <ReadonlyDetail
                  label="何を確認するテーマか"
                  value={topic.summary}
                />
                <ReadonlyDetail label="質問例" value={topic.questionExample} />
              </dl>

              {expanded && (
                <CandidatePanel title="この枠に入れる別のトピック候補">
                  {candidatePool.map((candidate) => {
                    const current = candidate.candidateKey === topic.candidateKey;
                    const usedElsewhere =
                      selectedKeys.has(candidate.candidateKey) && !current;
                    return (
                      <CandidateOption
                        key={candidate.candidateKey}
                        selected={current}
                        disabled={usedElsewhere}
                        title={candidate.name}
                        meta={`優先度 ${candidate.priority}`}
                        description={candidate.summary}
                        onClick={() => {
                          replaceTopic(topic.slotId, candidate.candidateKey);
                          setOpenSlot(null);
                        }}
                      />
                    );
                  })}
                </CandidatePanel>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CandidatePanel({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-[#cddbd1] bg-[#f7faf8] p-4">
      <p className="mb-3 text-sm font-semibold text-[#294b39]">{title}</p>
      <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function CandidateOption({
  selected,
  disabled,
  title,
  meta,
  description,
  onClick
}: {
  selected: boolean;
  disabled: boolean;
  title: string;
  meta: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || selected}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7652] focus-visible:ring-offset-2",
        selected
          ? "border-[#3d805c] bg-[#e8f3ec]"
          : disabled
            ? "cursor-not-allowed border-[#e0e5e1] bg-[#f1f3f2] opacity-55"
            : "border-[#d6e0d9] bg-white hover:border-[#7aa18a] hover:bg-[#f1f7f3]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-[#294636]">{title}</span>
        {selected && <Check className="size-4 shrink-0 text-[#2f7652]" />}
      </div>
      <p className="mt-1 text-xs font-semibold text-[#6a7b70]">{meta}</p>
      <p className="mt-2 text-xs leading-5 text-[#627269]">{description}</p>
      {disabled && !selected && (
        <p className="mt-2 text-xs font-semibold text-[#7b8980]">
          別の枠で選択中
        </p>
      )}
    </button>
  );
}

function ReadonlyDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[#52685b]">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-[#304a3b]">{value}</dd>
    </div>
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
  setQuestions: Dispatch<SetStateAction<MeasurementQuestion[]>>;
  personas: PersonaSelection[];
  topics: TopicSelection[];
  importantQuestions: MeasurementQuestion[];
  visibleQuestions: MeasurementQuestion[];
  filteredQuestionCount: number;
  topicFilter: number;
  setTopicFilter: (value: number) => void;
  newQuestion: string;
  setNewQuestion: (value: string) => void;
  addQuestion: (event: FormEvent<HTMLFormElement>) => void;
  deletedQuestions: MeasurementQuestion[];
  setDeletedQuestions: Dispatch<SetStateAction<MeasurementQuestion[]>>;
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

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#d7e2da] bg-[#f8faf8] p-4 text-sm text-[#52675a]">
        測定に使う質問を確認します。実際の質問数は契約プランから自動決定され、この画面で件数を選ぶ必要はありません。
      </div>

      <Section title="重要な質問">
        <div className="grid gap-3 lg:grid-cols-2">
          {importantQuestions.map((question, index) => (
            <div key={question.id} className="rounded-2xl bg-[#f2f8f4] p-5">
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#2f7652] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{question.text}</p>
                  <p className="mt-2 text-xs text-[#637369]">{question.reason}</p>
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
          {topics.map((topic) => (
            <FilterButton
              key={topic.slotId}
              active={topicFilter === topic.slotId}
              onClick={() => {
                setTopicFilter(topic.slotId);
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
                    (persona) => persona.slotId === question.personaSlotId
                  )?.name || "ペルソナ未設定"}
                </Badge>
                <Badge variant="outline">
                  {topics.find(
                    (topic) => topic.slotId === question.topicSlotId
                  )?.name || "トピック未設定"}
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
  personas: PersonaSelection[];
  topics: TopicSelection[];
  questions: MeasurementQuestion[];
  importantQuestions: MeasurementQuestion[];
  suggestionsStale: boolean;
  refreshSuggestions: () => void;
  goToEdit: (step: number) => void;
}) {
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

      <ReviewCard title="ペルソナ 5件" step={2} goToEdit={goToEdit}>
        <ReviewGrid
          items={personas.map((persona) => [
            persona.name,
            `${persona.audience}・${persona.role}`
          ])}
        />
      </ReviewCard>

      <ReviewCard title="トピック 6件" step={3} goToEdit={goToEdit}>
        <ReviewGrid
          items={topics.map((topic) => [
            topic.name,
            `優先度 ${topic.priority}`
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
