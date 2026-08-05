"use client";

import { useMemo, useState } from "react";
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

const SUBJECTS = [
  "企業",
  "ブランド",
  "サービス",
  "商品",
  "店舗・施設・拠点",
  "専門家・個人"
] as const;

const DOMAINS = [
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

const MODELS = [
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

const ACTIONS = [
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

type Form = {
  subjectType: string;
  subject: string;
  company: string;
  same: boolean;
  url: string;
  aliases: string[];
  audience: "b2b" | "b2c" | "both";
  priority: "b2b" | "b2c" | "balanced";
  domain: string;
  model: string;
  summary: string;
  action: string;
  subActions: string[];
  delivery: "online" | "in_person" | "hybrid";
  areas: string[];
  locations: string[];
  facilities: string[];
};

type Persona = {
  id: number;
  name: string;
  audience: string;
  role: string;
  issue: string;
  emphasis: string;
  action: string;
  adopted: boolean;
};

type Topic = {
  id: number;
  name: string;
  personaIds: number[];
  summary: string;
  example: string;
  priority: "高" | "中" | "低";
  adopted: boolean;
};

type Question = {
  id: string;
  text: string;
  personaId: number;
  topicId: number;
  reason: string;
  important: boolean;
};

type Inspection =
  | { status: "idle" | "loading" }
  | { status: "success"; result: SiteInspectionResult }
  | { status: "failed"; message: string };

const INITIAL: Form = {
  subjectType: "サービス",
  subject: "",
  company: "",
  same: false,
  url: "",
  aliases: [],
  audience: "b2b",
  priority: "b2b",
  domain: "IT・ソフトウェア",
  model: "SaaS・ソフトウェア",
  summary: "",
  action: "問い合わせ",
  subActions: [],
  delivery: "online",
  areas: [],
  locations: [],
  facilities: []
};

function personasFor(form: Form): Persona[] {
  const b2c =
    form.audience === "b2c" ||
    (form.audience === "both" && form.priority === "b2c");
  const action = form.action || "問い合わせ";
  const rows = b2c
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
          "複数候補を比較する利用者",
          "料金以外の違いが分からない",
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
          form.audience === "both"
            ? "法人利用を検討する担当者"
            : "継続・乗り換えを考える人",
          form.audience === "both" ? "BtoB" : "BtoC",
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
          "総費用を説明したい",
          "料金、期間、解約条件",
          "契約"
        ],
        [
          form.audience === "both"
            ? "個人として利用する人"
            : "信頼性を確認する担当者",
          form.audience === "both" ? "BtoC" : "BtoB",
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
    action: row[5],
    adopted: true
  }));
}

function topicsFor(form: Form): Topic[] {
  const subject = form.subject || "このサービス";
  const local =
    form.subjectType === "店舗・施設・拠点" ||
    form.delivery !== "online" ||
    ["予約", "来店・来院"].includes(form.action);
  const rows = [
    [
      `${subject}が選択肢に入る場面`,
      [1, 2],
      "課題や目的から候補を探す場面を確認します。",
      `${form.domain}でおすすめの選択肢を選ぶとき、何を比較すべきですか？`,
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
      form.model === "商品"
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
      `${form.action}前の料金や手続きを確認します。`,
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
      local
        ? "地域・アクセス・利用しやすさ"
        : "利用開始後の運用・継続",
      [1, 3],
      local
        ? "地域、アクセス、予約、初回利用を確認します。"
        : "運用負荷、サポート、継続性を確認します。",
      local
        ? `${form.areas[0] || "対象地域"}で${subject}を利用するときの確認点は？`
        : `${subject}の導入後に確認すべき運用やサポートは？`,
      "中"
    ]
  ];

  return rows.map((row, index) => ({
    id: index + 1,
    name: row[0] as string,
    personaIds: row[1] as number[],
    summary: row[2] as string,
    example: row[3] as string,
    priority: row[4] as Topic["priority"],
    adopted: true
  }));
}

function questionsFor(personas: Persona[], topics: Topic[]): Question[] {
  return topics.flatMap((topic, index) => [
    {
      id: `${topic.id}-a`,
      text: topic.example,
      personaId: topic.personaIds[0],
      topicId: topic.id,
      reason: `${personas[topic.personaIds[0] - 1]?.name}の判断場面を確認するためです。`,
      important: index < 3
    },
    {
      id: `${topic.id}-b`,
      text: `${topic.name}について、選ぶ前に確認すべきポイントを教えてください。`,
      personaId: topic.personaIds[1],
      topicId: topic.id,
      reason: "同じテーマを別の顧客視点でも確認するためです。",
      important: index === 3
    }
  ]);
}

export function ProjectSetupWizardV2() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [inspection, setInspection] = useState<Inspection>({ status: "idle" });
  const [evidence, setEvidence] = useState(false);
  const [personas, setPersonas] = useState(() => personasFor(INITIAL));
  const [topics, setTopics] = useState(() => topicsFor(INITIAL));
  const [questions, setQuestions] = useState(() =>
    questionsFor(personasFor(INITIAL), topicsFor(INITIAL))
  );
  const [deleted, setDeleted] = useState<Question[]>([]);
  const [filter, setFilter] = useState(0);
  const [newQuestion, setNewQuestion] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const region = useMemo(
    () =>
      form.subjectType === "店舗・施設・拠点" ||
      form.delivery !== "online" ||
      ["予約", "来店・来院"].includes(form.action) ||
      ([
        "医療・ヘルスケア",
        "教育",
        "不動産",
        "旅行・宿泊",
        "飲食・美容・生活サービス",
        "建設・住宅サービス"
      ].includes(form.domain) && form.model === "店舗・施設サービス"),
    [form]
  );

  const important = questions.filter((question) => question.important).slice(0, 6);
  const visibleQuestions = (
    filter ? questions.filter((question) => question.topicId === filter) : questions
  ).slice(0, showAll ? undefined : 8);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "subject" && current.same
        ? { company: String(value) }
        : {})
    }));
    setError("");
  };

  const add = (
    key: "aliases" | "areas" | "locations" | "facilities",
    value: string
  ) => {
    const normalized = value.trim();
    if (normalized && !form[key].includes(normalized)) {
      update(key, [...form[key], normalized]);
    }
  };

  async function inspectSite() {
    if (!form.url.trim()) {
      setError("公式サイトURLを入力してください。");
      return;
    }

    setInspection({ status: "loading" });
    try {
      const response = await fetch("/api/recora/site-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          brandName: form.subject || undefined,
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

      setInspection({ status: "success", result: data.result });
      setForm((current) => ({
        ...current,
        subject:
          current.subject || data.result.siteName || data.result.title || "",
        company: current.company || data.result.siteName || "",
        summary:
          data.result.suggestedServiceDescription ||
          data.result.description ||
          current.summary
      }));
    } catch {
      setInspection({
        status: "failed",
        message: "読み取りに失敗しました。手動入力でも続けられます。"
      });
    }
  }

  function validateStep() {
    if (
      step === 0 &&
      (!form.subject.trim() || !form.company.trim() || !form.url.trim())
    ) {
      return "分析対象名、運営会社名、公式サイトURLを確認してください。";
    }
    if (step === 1 && !form.summary.trim()) {
      return "事業概要を確認してください。";
    }
    if (step === 1 && region && !form.areas.length && !form.locations.length) {
      return "対応地域または所在地を入力してください。";
    }
    if (step === 2 && !personas.some((persona) => persona.adopted)) {
      return "少なくとも1件のペルソナを採用してください。";
    }
    if (step === 3 && !topics.some((topic) => topic.adopted)) {
      return "少なくとも1件のトピックを採用してください。";
    }
    if (step === 4 && !questions.length) {
      return "質問を1件以上残してください。";
    }
    return "";
  }

  function next() {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }

    if (step === 1) {
      const nextPersonas = personasFor(form);
      const nextTopics = topicsFor(form);
      setPersonas(nextPersonas);
      setTopics(nextTopics);
      setQuestions(questionsFor(nextPersonas, nextTopics));
    }
    if (step === 2) {
      const nextTopics = topicsFor(form);
      setTopics(nextTopics);
      setQuestions(questionsFor(personas, nextTopics));
    }
    if (step === 3) {
      setQuestions(questionsFor(personas, topics));
    }

    setDeleted([]);
    setStep((current) => Math.min(current + 1, 5));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newQuestion.trim()) return;

    setQuestions((current) => [
      ...current,
      {
        id: `c-${Date.now()}`,
        text: newQuestion.trim(),
        personaId: 1,
        topicId: 1,
        reason: "顧客が追加した確認事項を測定するためです。",
        important: true
      }
    ]);
    setNewQuestion("");
  }

  const go = (nextStep: number) => {
    setStep(nextStep);
    setComplete(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              <p className="text-sm font-semibold text-[#173d2c]">Recora 初期設定</p>
              <p className="hidden text-xs text-[#65766c] sm:block">
                分析対象から測定質問まで順番に確認します
              </p>
            </div>
          </div>
          <Badge className="bg-[#edf6f0] text-[#245b40]">
            Step {step + 1} / 6
          </Badge>
        </div>
        <div className="h-1 bg-[#e4ebe6]">
          <div
            className="h-full bg-[#2f7652]"
            style={{ width: `${((step + 1) / 6) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <ol
          aria-label="初期設定ステップ"
          className="mb-6 hidden grid-cols-6 gap-2 lg:grid"
        >
          {STEPS.map(([title, StepIcon], index) => (
            <li key={title}>
              <button
                type="button"
                aria-current={step === index ? "step" : undefined}
                onClick={() => index <= step && go(index)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl border px-3 py-3 text-left",
                  step === index
                    ? "border-[#2f7652] bg-[#eef7f1]"
                    : index < step
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
                  {index < step ? (
                    <Check className="size-4" />
                  ) : (
                    <StepIcon className="size-4" />
                  )}
                </span>
                <span className="truncate text-sm font-semibold">{title}</span>
              </button>
            </li>
          ))}
        </ol>

        <section className="rounded-[28px] border border-[#d9e2dc] bg-white shadow-[0_18px_45px_rgba(33,72,51,0.08)]">
          <div className="border-b border-[#e1e8e3] px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex gap-4">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e6f2ea] text-[#245b40]">
                <CurrentIcon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4e755f]">
                  Step {step + 1}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[#163d2b] sm:text-3xl">
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
              <Complete onBack={() => setComplete(false)} />
            ) : (
              <>
                {step === 0 && (
                  <SubjectStep
                    form={form}
                    inspection={inspection}
                    evidence={evidence}
                    update={update}
                    add={add}
                    inspectSite={inspectSite}
                    setEvidence={setEvidence}
                  />
                )}
                {step === 1 && (
                  <BusinessStep
                    form={form}
                    region={region}
                    update={update}
                    add={add}
                  />
                )}
                {step === 2 && (
                  <PersonaStep personas={personas} setPersonas={setPersonas} />
                )}
                {step === 3 && (
                  <TopicStep
                    topics={topics}
                    personas={personas}
                    setTopics={setTopics}
                  />
                )}
                {step === 4 && (
                  <QuestionStep
                    questions={questions}
                    setQuestions={setQuestions}
                    personas={personas}
                    topics={topics}
                    important={important}
                    visible={visibleQuestions}
                    filter={filter}
                    setFilter={setFilter}
                    newQuestion={newQuestion}
                    setNewQuestion={setNewQuestion}
                    addQuestion={addQuestion}
                    deleted={deleted}
                    setDeleted={setDeleted}
                    showAll={showAll}
                    setShowAll={setShowAll}
                  />
                )}
                {step === 5 && (
                  <ReviewStep
                    form={form}
                    region={region}
                    personas={personas}
                    topics={topics}
                    questions={questions}
                    important={important}
                    go={go}
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
            <div className="flex flex-col-reverse gap-3 border-t border-[#e1e8e3] px-5 py-5 sm:flex-row sm:justify-between sm:px-8 lg:px-10">
              <Button
                variant="outline"
                disabled={!step}
                onClick={() => go(Math.max(0, step - 1))}
                className="h-11 rounded-xl"
              >
                <ArrowLeft className="mr-2 size-4" />
                戻る
              </Button>
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
                    const message = validateStep();
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

function Choice({
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
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-2xl border p-4 text-left",
        selected
          ? "border-[#3d805c] bg-[#edf6f0]"
          : "border-[#d5dfd8]"
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
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-[#284637]">
      {label}
      <input
        value={value}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        className="mt-2 h-11 w-full rounded-xl border border-[#cbd7cf] px-4 text-sm font-normal outline-none focus:border-[#3d805c] disabled:bg-[#f0f3f1]"
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
        className="mt-2 h-11 w-full rounded-xl border border-[#cbd7cf] bg-white px-4 text-sm font-normal"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Chips({
  title,
  values,
  add,
  remove
}: {
  title: string;
  values: string[];
  add: (value: string) => void;
  remove: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div>
      <p className="text-sm font-semibold text-[#284637]">{title}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setValue(event.target.value)
          }
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#cbd7cf] px-4 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            add(value);
            setValue("");
          }}
          aria-label={`${title}を追加`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-[#edf6f0] px-3 py-1.5 text-xs text-[#355d47]"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              aria-label={`${item}を削除`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function SubjectStep({
  form,
  inspection,
  evidence,
  update,
  add,
  inspectSite,
  setEvidence
}: {
  form: Form;
  inspection: Inspection;
  evidence: boolean;
  update: <K extends keyof Form>(key: K, value: Form[K]) => void;
  add: (
    key: "aliases" | "areas" | "locations" | "facilities",
    value: string
  ) => void;
  inspectSite: () => void;
  setEvidence: (value: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      <Section title="分析する対象">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SUBJECTS.map((subject) => (
            <Choice
              key={subject}
              selected={form.subjectType === subject}
              title={subject}
              onClick={() => update("subjectType", subject)}
            />
          ))}
        </div>
      </Section>

      <Section title="名称と公式サイト">
        <div className="grid gap-5 lg:grid-cols-2">
          <TextInput
            label="分析対象名"
            value={form.subject}
            onChange={(value) => update("subject", value)}
          />
          <div>
            <TextInput
              label="運営会社名"
              value={form.company}
              disabled={form.same}
              onChange={(value) => update("company", value)}
            />
            <label className="mt-3 flex gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.same}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  update("same", event.target.checked);
                  if (event.target.checked) update("company", form.subject);
                }}
              />
              運営会社名は分析対象名と同じ
            </label>
          </div>
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold">公式サイトURL</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                value={form.url}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  update("url", event.target.value)
                }
                placeholder="https://example.com"
                className="h-11 min-w-0 flex-1 rounded-xl border border-[#cbd7cf] px-4 text-sm"
              />
              <Button
                type="button"
                onClick={inspectSite}
                disabled={inspection.status === "loading"}
                className="h-11 bg-[#e4f0e8] text-[#245b40]"
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

      <Chips
        title="別名・略称（任意）"
        values={form.aliases}
        add={(value) => add("aliases", value)}
        remove={(value) =>
          update(
            "aliases",
            form.aliases.filter((item) => item !== value)
          )
        }
      />

      {inspection.status === "idle" && (
        <div className="rounded-2xl border border-dashed border-[#cbd8cf] bg-[#f8faf8] p-5 text-sm text-[#64746b]">
          サイトを読み取れない場合も手動入力で続けられます。
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
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-semibold text-[#245b40]">サイトを読み取りました</p>
              <p className="text-sm text-[#5e7065]">内容は修正できます。</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEvidence(!evidence)}
            >
              読み取り根拠
            </Button>
          </div>
          {evidence && (
            <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2">
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
  );
}

function BusinessStep({
  form,
  region,
  update,
  add
}: {
  form: Form;
  region: boolean;
  update: <K extends keyof Form>(key: K, value: Form[K]) => void;
  add: (
    key: "aliases" | "areas" | "locations" | "facilities",
    value: string
  ) => void;
}) {
  const toggleSecondaryAction = (value: string) => {
    if (form.subActions.includes(value)) {
      update(
        "subActions",
        form.subActions.filter((item) => item !== value)
      );
    } else if (form.subActions.length < 2 && value !== form.action) {
      update("subActions", [...form.subActions, value]);
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
            <Choice
              key={value}
              selected={form.audience === value}
              title={label}
              onClick={() => update("audience", value as Form["audience"])}
            />
          ))}
        </div>
        {form.audience === "both" && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["b2b", "法人向けを中心"],
              ["b2c", "個人向けを中心"],
              ["balanced", "両方を同じ程度"]
            ].map(([value, label]) => (
              <Choice
                key={value}
                selected={form.priority === value}
                title={label}
                onClick={() =>
                  update("priority", value as Form["priority"])
                }
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Recoraの推定" description="この内容で合っていますか？">
        <div className="grid gap-5 lg:grid-cols-2">
          <SelectInput
            label="事業領域"
            value={form.domain}
            options={DOMAINS}
            onChange={(value) => update("domain", value)}
          />
          <SelectInput
            label="提供しているもの・サービスの形"
            value={form.model}
            options={MODELS}
            onChange={(value) => update("model", value)}
          />
          <label className="text-sm font-semibold lg:col-span-2">
            Recoraが分析した事業概要
            <textarea
              value={form.summary}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                update("summary", event.target.value)
              }
              rows={5}
              className="mt-2 w-full rounded-xl border border-[#cbd7cf] px-4 py-3 text-sm font-normal"
            />
          </label>
        </div>
      </Section>

      <Section title="顧客の最終行動">
        <div className="grid gap-5 lg:grid-cols-2">
          <SelectInput
            label="主な最終行動"
            value={form.action}
            options={ACTIONS}
            onChange={(value) => {
              update("action", value);
              update(
                "subActions",
                form.subActions.filter((item) => item !== value)
              );
            }}
          />
          <div>
            <p className="text-sm font-semibold">補助行動（最大2件）</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTIONS.filter((action) => action !== form.action).map(
                (action) => (
                  <button
                    type="button"
                    key={action}
                    disabled={
                      !form.subActions.includes(action) &&
                      form.subActions.length >= 2
                    }
                    onClick={() => toggleSecondaryAction(action)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs",
                      form.subActions.includes(action)
                        ? "border-[#3d805c] bg-[#eaf4ed]"
                        : "border-[#d3ddd6] disabled:opacity-40"
                    )}
                  >
                    {action}
                  </button>
                )
              )}
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
            <Choice
              key={value}
              selected={form.delivery === value}
              title={label}
              onClick={() =>
                update("delivery", value as Form["delivery"])
              }
            />
          ))}
        </div>
      </Section>

      {region && (
        <Section
          title="地域・店舗情報"
          description="地域性のある事業だけに表示しています。"
        >
          <div className="mb-4 flex gap-2 rounded-xl bg-[#f8faf8] p-4 text-sm">
            <MapPin className="size-4 shrink-0" />
            地域を使った質問の配分はRecora側で調整します。
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Chips
              title="対応地域"
              values={form.areas}
              add={(value) => add("areas", value)}
              remove={(value) =>
                update(
                  "areas",
                  form.areas.filter((item) => item !== value)
                )
              }
            />
            <Chips
              title="店舗・施設所在地"
              values={form.locations}
              add={(value) => add("locations", value)}
              remove={(value) =>
                update(
                  "locations",
                  form.locations.filter((item) => item !== value)
                )
              }
            />
            <Chips
              title="分析対象とする店舗・施設"
              values={form.facilities}
              add={(value) => add("facilities", value)}
              remove={(value) =>
                update(
                  "facilities",
                  form.facilities.filter((item) => item !== value)
                )
              }
            />
          </div>
        </Section>
      )}
    </div>
  );
}

function PersonaStep({
  personas,
  setPersonas
}: {
  personas: Persona[];
  setPersonas: (
    value: Persona[] | ((current: Persona[]) => Persona[])
  ) => void;
}) {
  const patch = (
    id: number,
    key: keyof Persona,
    value: Persona[keyof Persona]
  ) => {
    setPersonas((current) =>
      current.map((persona) =>
        persona.id === id ? { ...persona, [key]: value } : persona
      )
    );
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-[#68786f]">
          測定に使う顧客の視点を5件だけ確認します。
        </p>
        <Badge>5件</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {personas.map((persona, index) => (
          <article
            key={persona.id}
            className={cn(
              "rounded-2xl border p-5",
              !persona.adopted && "bg-[#f7f8f7] opacity-70"
            )}
          >
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[#6c7a72]">PERSONA {index + 1}</p>
                <input
                  value={persona.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    patch(persona.id, "name", event.target.value)
                  }
                  className="mt-1 w-full bg-transparent text-lg font-semibold outline-none"
                />
                <Badge variant="outline">{persona.audience}</Badge>
              </div>
              <button
                type="button"
                onClick={() =>
                  patch(persona.id, "adopted", !persona.adopted)
                }
                className="h-fit shrink-0 rounded-full bg-[#edf6f0] px-3 py-1.5 text-xs"
              >
                {persona.adopted ? "採用中" : "除外中"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 border-t pt-4">
              <EditableField
                label="立場・役割"
                value={persona.role}
                onChange={(value) => patch(persona.id, "role", value)}
              />
              <EditableField
                label="主な課題"
                value={persona.issue}
                onChange={(value) => patch(persona.id, "issue", value)}
              />
              <EditableField
                label="比較時に重視すること"
                value={persona.emphasis}
                onChange={(value) => patch(persona.id, "emphasis", value)}
              />
              <EditableField
                label="最終行動"
                value={persona.action}
                onChange={(value) => patch(persona.id, "action", value)}
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
  setTopics
}: {
  topics: Topic[];
  personas: Persona[];
  setTopics: (value: Topic[] | ((current: Topic[]) => Topic[])) => void;
}) {
  const patch = (
    id: number,
    key: keyof Topic,
    value: Topic[keyof Topic]
  ) => {
    setTopics((current) =>
      current.map((topic) =>
        topic.id === id ? { ...topic, [key]: value } : topic
      )
    );
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-[#68786f]">
          測定するテーマを6件だけ確認します。
        </p>
        <Badge>6件</Badge>
      </div>
      <div className="space-y-4">
        {topics.map((topic, index) => (
          <article
            key={topic.id}
            className={cn(
              "rounded-2xl border p-5",
              !topic.adopted && "bg-[#f7f8f7] opacity-70"
            )}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-[#6c7a72]">TOPIC {index + 1}</p>
                <input
                  value={topic.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    patch(topic.id, "name", event.target.value)
                  }
                  className="w-full bg-transparent text-lg font-semibold outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {topic.personaIds.map((personaId) => (
                    <Badge key={personaId} variant="outline">
                      {personas.find((persona) => persona.id === personaId)?.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={topic.priority}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    patch(
                      topic.id,
                      "priority",
                      event.target.value as Topic["priority"]
                    )
                  }
                  className="h-9 rounded-xl border px-3 text-xs"
                  aria-label={`${topic.name}の優先度`}
                >
                  <option>高</option>
                  <option>中</option>
                  <option>低</option>
                </select>
                <button
                  type="button"
                  onClick={() => patch(topic.id, "adopted", !topic.adopted)}
                  className="h-9 rounded-full bg-[#edf6f0] px-3 text-xs"
                >
                  {topic.adopted ? "採用中" : "除外中"}
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 border-t pt-4 lg:grid-cols-2">
              <EditableField
                label="何を確認するテーマか"
                value={topic.summary}
                onChange={(value) => patch(topic.id, "summary", value)}
              />
              <EditableField
                label="質問例"
                value={topic.example}
                onChange={(value) => patch(topic.id, "example", value)}
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
    <label className="text-xs font-semibold">
      {label}
      <textarea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        rows={2}
        className="mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm font-normal"
      />
    </label>
  );
}

function QuestionStep({
  questions,
  setQuestions,
  personas,
  topics,
  important,
  visible,
  filter,
  setFilter,
  newQuestion,
  setNewQuestion,
  addQuestion,
  deleted,
  setDeleted,
  showAll,
  setShowAll
}: {
  questions: Question[];
  setQuestions: (
    value: Question[] | ((current: Question[]) => Question[])
  ) => void;
  personas: Persona[];
  topics: Topic[];
  important: Question[];
  visible: Question[];
  filter: number;
  setFilter: (value: number) => void;
  newQuestion: string;
  setNewQuestion: (value: string) => void;
  addQuestion: (event: FormEvent<HTMLFormElement>) => void;
  deleted: Question[];
  setDeleted: (
    value: Question[] | ((current: Question[]) => Question[])
  ) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
}) {
  const patch = (id: string, text: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, text } : question
      )
    );
  };
  const remove = (question: Question) => {
    setQuestions((current) =>
      current.filter((item) => item.id !== question.id)
    );
    setDeleted((current) => [question, ...current]);
  };
  const undo = () => {
    const [question, ...rest] = deleted;
    if (question) {
      setQuestions((current) => [...current, question]);
      setDeleted(rest);
    }
  };

  return (
    <div className="space-y-8">
      <Section title="重要な質問">
        <div className="grid gap-3 lg:grid-cols-2">
          {important.map((question, index) => (
            <div
              key={question.id}
              className="rounded-2xl bg-[#f2f8f4] p-5"
            >
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#2f7652] text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{question.text}</p>
                  <p className="mt-2 text-xs">{question.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="質問を追加">
        <form onSubmit={addQuestion} className="flex gap-3">
          <input
            value={newQuestion}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewQuestion(event.target.value)
            }
            className="h-11 min-w-0 flex-1 rounded-xl border px-4"
            aria-label="追加する質問"
          />
          <Button type="submit">
            <Plus className="mr-2 size-4" />
            追加
          </Button>
        </form>
      </Section>

      <Section
        title="全質問を確認"
        description={`${questions.length}件をトピック別に確認できます。`}
      >
        <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
          <FilterButton active={!filter} onClick={() => setFilter(0)}>
            すべて
          </FilterButton>
          {topics.map((topic) => (
            <FilterButton
              key={topic.id}
              active={filter === topic.id}
              onClick={() => setFilter(topic.id)}
            >
              {topic.name}
            </FilterButton>
          ))}
          {!!deleted.length && (
            <Button
              type="button"
              variant="outline"
              onClick={undo}
              className="ml-auto"
            >
              <RotateCcw className="mr-2 size-4" />
              削除を取り消す
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {visible.map((question) => (
            <article key={question.id} className="rounded-2xl border p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                {question.important && <Badge>重要</Badge>}
                <Badge variant="outline">
                  {personas.find((persona) => persona.id === question.personaId)
                    ?.name}
                </Badge>
                <Badge variant="outline">
                  {topics.find((topic) => topic.id === question.topicId)?.name}
                </Badge>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={question.text}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    patch(question.id, event.target.value)
                  }
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-xl border px-3 py-2 text-sm font-semibold"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => remove(question)}
                  aria-label="質問を削除"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-sm">
                この質問を測る理由：{question.reason}
              </p>
            </article>
          ))}
        </div>

        {(filter
          ? questions.filter((question) => question.topicId === filter).length
          : questions.length) > 8 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full"
          >
            {showAll ? "表示を戻す" : "さらに表示"}
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
      onClick={onClick}
      className={cn(
        "max-w-full truncate rounded-full border px-3 py-2 text-xs",
        active && "border-[#3d805c] bg-[#eaf4ed]"
      )}
    >
      {children}
    </button>
  );
}

function ReviewStep({
  form,
  region,
  personas,
  topics,
  questions,
  important,
  go
}: {
  form: Form;
  region: boolean;
  personas: Persona[];
  topics: Topic[];
  questions: Question[];
  important: Question[];
  go: (step: number) => void;
}) {
  return (
    <div className="space-y-5">
      <ReviewCard title="分析対象" step={0} go={go}>
        <ReviewRow label="種類" value={form.subjectType} />
        <ReviewRow label="分析対象名" value={form.subject} />
        <ReviewRow label="運営会社" value={form.company} />
        <ReviewRow label="公式サイト" value={form.url} />
      </ReviewCard>

      <ReviewCard title="事業内容" step={1} go={go}>
        <ReviewRow
          label="顧客層"
          value={
            form.audience === "b2b"
              ? "BtoB"
              : form.audience === "b2c"
                ? "BtoC"
                : "両方"
          }
        />
        {form.audience === "both" && (
          <ReviewRow
            label="主に測定する顧客"
            value={
              form.priority === "b2b"
                ? "法人向けを中心"
                : form.priority === "b2c"
                  ? "個人向けを中心"
                  : "両方を同じ程度"
            }
          />
        )}
        <ReviewRow label="事業領域" value={form.domain} />
        <ReviewRow label="サービスの形" value={form.model} />
        <ReviewRow label="主な最終行動" value={form.action} />
        <ReviewRow
          label="提供方法"
          value={
            form.delivery === "online"
              ? "オンライン"
              : form.delivery === "in_person"
                ? "対面・現地"
                : "両方"
          }
        />
        <ReviewRow label="事業概要" value={form.summary} />
        {region && (
          <ReviewRow
            label="地域・店舗"
            value={
              [...form.areas, ...form.locations, ...form.facilities].join("、") ||
              "未入力"
            }
          />
        )}
      </ReviewCard>

      <ReviewCard
        title={`ペルソナ 5件（採用 ${personas.filter((persona) => persona.adopted).length}件）`}
        step={2}
        go={go}
      >
        <ReviewGrid
          items={personas.map((persona) => [
            persona.name,
            persona.adopted ? "採用" : "除外"
          ])}
        />
      </ReviewCard>

      <ReviewCard
        title={`トピック 6件（採用 ${topics.filter((topic) => topic.adopted).length}件）`}
        step={3}
        go={go}
      >
        <ReviewGrid
          items={topics.map((topic) => [
            topic.name,
            `優先度 ${topic.priority}・${topic.adopted ? "採用" : "除外"}`
          ])}
        />
      </ReviewCard>

      <ReviewCard
        title={`測定に使う質問 ${questions.length}件`}
        step={4}
        go={go}
      >
        {important.map((question, index) => (
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
  go,
  children
}: {
  title: string;
  step: number;
  go: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" variant="ghost" onClick={() => go(step)}>
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
    <div className="grid gap-1 border-b py-3 last:border-0 sm:grid-cols-[180px_1fr]">
      <p className="text-sm text-[#6b796f]">{label}</p>
      <p className="text-sm">{value || "未入力"}</p>
    </div>
  );
}

function ReviewGrid({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map(([title, description]) => (
        <div key={title} className="rounded-xl bg-[#f8faf8] p-3">
          <p className="font-semibold">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
      ))}
    </div>
  );
}

function Complete({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-14 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#e3f1e7]">
        <CheckCircle2 className="size-8" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold">
        設定内容の確認が完了しました
      </h2>
      <p className="mt-3 text-sm">
        この画面ではまだ測定は開始されていません。
      </p>
      <Button type="button" variant="outline" onClick={onBack} className="mt-6">
        内容をもう一度確認する
      </Button>
    </div>
  );
}
