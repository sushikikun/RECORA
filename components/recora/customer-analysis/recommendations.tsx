"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  DataRichBadge,
  DataRichKpiStrip,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  ReportDataTable
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";
import {
  ReportDetailButton,
  type ReportDetailPayload
} from "@/components/recora/report-ui/report-detail-drawer";

type RecommendationDataKind =
  | "page-improvement"
  | "new-page"
  | "citation-acquisition"
  | "measurement-settings"
  | "observation-type"
  | "model-scope"
  | "persona-scope"
  | "topic-scope"
  | "implementation-spec"
  | "metric-definition";

const recommendationKindCopy: Record<RecommendationDataKind, {
  kicker: string;
  definition: string;
  comparisonTitle: string;
  traceTitle: string;
}> = {
  "page-improvement": {
    kicker: "PAGE IMPROVEMENT CANDIDATE",
    definition: "既存URLの内容・構造を直す候補です。新規ページ作成とは分けて判定します。",
    comparisonTitle: "現在のページと改善後に比べるもの",
    traceTitle: "候補に紐づく質問・回答へ遡る"
  },
  "new-page": {
    kicker: "NEW PAGE CANDIDATE",
    definition: "既存ページでは受け止められない検索意図に対して、新しいURLを検討する候補です。",
    comparisonTitle: "既存ページでの充足状況と新規ページ案",
    traceTitle: "不足を示したトピック・質問へ遡る"
  },
  "citation-acquisition": {
    kicker: "CITATION ACQUISITION",
    definition: "ブランド掲載ではなく、自社または第三者の情報源URLが回答内で引用として表示された状態を扱います。",
    comparisonTitle: "自社が引用された回答と競合引用回答の比較",
    traceTitle: "引用URL・回答・対応する回答箇所へ遡る"
  },
  "measurement-settings": {
    kicker: "MEASUREMENT SETTINGS",
    definition: "コンテンツ施策ではなく、固定質問・対象モデル・集計条件を確認するための設定データです。",
    comparisonTitle: "変更前後で固定する条件",
    traceTitle: "観測日・モデル・質問・実行状態へ遡る"
  },
  "observation-type": {
    kicker: "OBSERVATION TYPE",
    definition: "改善領域の判断に使った観測データを、種類ごとにまとめた全体値です。個別施策の内容や効果予測ではありません。",
    comparisonTitle: "観測タイプの内訳",
    traceTitle: "この観測タイプに含まれる代表回答へ遡る"
  },
  "model-scope": {
    kicker: "MODEL SCOPE",
    definition: "この候補の集計対象に含めたAIモデルと観測の対応です。モデルごとの回答を混ぜずに確認します。",
    comparisonTitle: "モデルごとの対象と観測例",
    traceTitle: "各モデルの該当観測へ遡る"
  },
  "persona-scope": {
    kicker: "PERSONA SCOPE",
    definition: "固定質問に設定したペルソナ区分ごとの影響範囲です。回答文から推定した人物像ではありません。",
    comparisonTitle: "ペルソナ別の対象質問",
    traceTitle: "ペルソナタグを持つ固定質問へ遡る"
  },
  "topic-scope": {
    kicker: "TOPIC SCOPE",
    definition: "固定質問に設定したトピック区分ごとの影響範囲です。同じ回答を複数トピックへ重複計上しません。",
    comparisonTitle: "トピック別の対象質問と観測",
    traceTitle: "トピックに属する質問・回答へ遡る"
  },
  "implementation-spec": {
    kicker: "IMPLEMENTATION SPEC",
    definition: "提案を実施するときの表示仕様と受入条件です。観測結果や効果予測とは分けて扱います。",
    comparisonTitle: "現在の状態と受入条件",
    traceTitle: "実装時に確認する項目"
  },
  "metric-definition": {
    kicker: "METRIC DEFINITION",
    definition: "実施前後を同じ条件で比較するための指標定義です。未掲載と欠測は指標値へ混ぜません。",
    comparisonTitle: "算出条件と比較方法",
    traceTitle: "算出対象の観測へ遡る"
  }
};

type RecommendationObservation = {
  id: string;
  observedAt: string;
  model: string;
  promptId: string;
  question: string;
  result: string;
  citationUrl?: string;
  officialUrl?: string;
};

type RecommendationDetailFact = {
  label: string;
  value: string;
  tone?: "default" | "green" | "amber" | "red";
};

const recommendationObservations = {
  matchupStart: {
    id: "OBS-20260623-MU-001",
    observedAt: "2026-06-23 08:05 JST",
    model: "GPT",
    promptId: "Q-034",
    question: "GEO対策ツールを比較し、選定基準を教えてください。",
    result: "Trailbase 1位、Recora 3位。"
  },
  matchupGpt: {
    id: "OBS-20260706-MU-001",
    observedAt: "2026-07-06 08:05 JST",
    model: "GPT",
    promptId: "Q-034",
    question: "GEO対策ツールを比較し、選定基準を教えてください。",
    result: "Trailbase 1位、Recora 3位。"
  },
  matchupGemini: {
    id: "OBS-20260705-MU-014",
    observedAt: "2026-07-05 08:07 JST",
    model: "Gemini",
    promptId: "Q-034",
    question: "GEO対策ツールを比較し、選定基準を教えてください。",
    result: "Trailbase掲載、Recora未掲載。"
  },
  matchupPerplexity: {
    id: "OBS-20260704-R01-027",
    observedAt: "2026-07-04 08:11 JST",
    model: "Perplexity",
    promptId: "Q-071",
    question: "GEOツールの選定基準と導入判断の根拠を教えてください。",
    result: "選定基準の説明でTrailbaseの競合URLを参照。",
    citationUrl: "https://trailbase.io/compare/geo-tools"
  },
  citationResearch: {
    id: "OBS-20260706-CG-003",
    observedAt: "2026-07-06 08:18 JST",
    model: "Perplexity",
    promptId: "Q-088",
    question: "AI検索対策の判断に使える調査データを教えてください。",
    result: "第三者調査ページを引用し、自社調査URLは引用されなかった。",
    citationUrl: "https://marketing-ai.jp/research/ai-search-2026"
  },
  citationTrailbase: {
    id: "OBS-20260705-CG-011",
    observedAt: "2026-07-05 08:11 JST",
    model: "GPT",
    promptId: "Q-034",
    question: "GEO対策ツールを比較し、選定基準を教えてください。",
    result: "競合比較URLを引用し、自社URLの引用はなかった。",
    citationUrl: "https://trailbase.io/compare/geo-tools"
  },
  citationTrailbaseGemini: {
    id: "OBS-20260704-CG-010",
    observedAt: "2026-07-04 08:09 JST",
    model: "Gemini",
    promptId: "Q-034",
    question: "GEO対策ツールを比較し、導入判断の根拠を示してください。",
    result: "競合の選定基準ページを引用し、Recoraは掲載されなかった。",
    citationUrl: "https://trailbase.io/compare/geo-tools"
  },
  factPricing: {
    id: "OBS-20260706-FD-002",
    observedAt: "2026-07-06 08:22 JST",
    model: "GPT",
    promptId: "Q-012",
    question: "Recoraの料金プランを教えてください。",
    result: "旧料金プランの説明を確認。",
    citationUrl: "https://saas-review.example/geo",
    officialUrl: "https://recora.jp/pricing"
  },
  factImplementation: {
    id: "OBS-20260704-FD-004",
    observedAt: "2026-07-04 08:16 JST",
    model: "Gemini",
    promptId: "Q-013",
    question: "Recoraの導入期間と開始手順を教えてください。",
    result: "公式情報で確認できない導入期間を断定。",
    citationUrl: "https://saas-review.example/geo-tools",
    officialUrl: "https://recora.jp/guide/implementation"
  },
  ownCitation: {
    id: "OBS-20260706-OC-002",
    observedAt: "2026-07-06 08:26 JST",
    model: "Perplexity",
    promptId: "Q-088",
    question: "AI検索対策の判断に使える調査データを教えてください。",
    result: "Recoraの調査ページを引用。",
    citationUrl: "https://recora.jp/research/ai-search-2026"
  },
  caseStudyGpt: {
    id: "OBS-20260706-CS-001",
    observedAt: "2026-07-06 08:31 JST",
    model: "GPT",
    promptId: "Q-062",
    question: "GEOツールの導入事例と導入前後の変化を教えてください。",
    result: "競合事例を紹介し、Recoraの事例は掲載されなかった。",
    citationUrl: "https://trailbase.io/customers/enterprise"
  },
  caseStudyGemini: {
    id: "OBS-20260705-CS-002",
    observedAt: "2026-07-05 08:29 JST",
    model: "Gemini",
    promptId: "Q-062",
    question: "GEOツールの導入事例を業種別に比較してください。",
    result: "第三者記事の競合事例だけを掲載。",
    citationUrl: "https://marketing-ai.jp/cases/geo-tools"
  },
  thirdPartyGpt: {
    id: "OBS-20260705-TP-002",
    observedAt: "2026-07-05 08:34 JST",
    model: "GPT",
    promptId: "Q-071",
    question: "第三者評価を確認できるGEOツールを比較してください。",
    result: "比較サイトを引用し、Recoraの第三者掲載は確認できなかった。",
    citationUrl: "https://saas-review.example/ai-search"
  }
} satisfies Record<string, RecommendationObservation>;

function recommendationObservationTrace(
  observations: readonly RecommendationObservation[],
  options: { includeCitation?: boolean; includeOfficial?: boolean; resultLabel?: string } = {}
) {
  return observations.map((observation) => ({
    title: observation.question,
    meta: `${observation.model} / ${observation.observedAt} / ${observation.promptId}`,
    description: [
      `${options.resultLabel ?? "観測結果"}: ${observation.result}`,
      `観測ID: ${observation.id}`,
      options.includeCitation ? `引用URL: ${observation.citationUrl ?? "—"}` : null,
      options.includeOfficial ? `公式URL: ${observation.officialUrl ?? "—"}` : null
    ].filter((value): value is string => Boolean(value)).join(" / ")
  }));
}

function recommendationPromptModelSourceFacts(
  observation: RecommendationObservation,
  options: { includeCitation?: boolean; includeOfficial?: boolean } = {}
): RecommendationDetailFact[] {
  return [
    { label: "対象質問", value: observation.question },
    { label: "AIモデル・観測日時", value: `${observation.model} / ${observation.observedAt}` },
    { label: "プロンプトID", value: observation.promptId },
    { label: "観測結果", value: observation.result },
    options.includeCitation && observation.citationUrl
      ? { label: "回答が参照したURL", value: observation.citationUrl }
      : null,
    options.includeOfficial && observation.officialUrl
      ? { label: "照合した公式URL", value: observation.officialUrl }
      : null
  ].filter((fact): fact is RecommendationDetailFact => Boolean(fact));
}

type OpportunityAxisKey = "impact" | "evidence" | "continuity" | "execution";

type RecommendationOpportunity = {
  id: string;
  label: string;
  target: string;
  values: readonly [number, number, number, number];
  impactValue: string;
  impactUnit: string;
  impactSummary: string;
  evidenceSummary: string;
  continuityValue: string;
  continuitySummary: string;
  executionSummary: string;
  requiredInput: string;
  acceptance: string;
  observations: readonly RecommendationObservation[];
};

const opportunityAxes: readonly { key: OpportunityAxisKey; label: string }[] = [
  { key: "impact", label: "影響範囲" },
  { key: "evidence", label: "根拠強度" },
  { key: "continuity", label: "継続性" },
  { key: "execution", label: "実行容易性" }
];

const recommendationOpportunities: readonly RecommendationOpportunity[] = [
  {
    id: "compare-page",
    label: "比較ページ",
    target: "/compare",
    values: [82, 86, 78, 64],
    impactValue: "42観測",
    impactUnit: "固定質問 × AIモデル × 観測日",
    impactSummary: "比較検討の固定質問で、競合先行または自社不在が確認された観測範囲です。",
    evidenceSummary: "掲載位置差と競合比較URLの引用が、同じ質問条件で別々に観測されています。",
    continuityValue: "14日",
    continuitySummary: "Q-034で競合先行の判定が日次観測に連続しました。",
    executionSummary: "既存URLの比較表を更新する作業量を、必要素材と表示変更から評価します。",
    requiredInput: "読者別選定基準・公式比較根拠・料金と導入条件",
    acceptance: "比較項目ごとに対象読者と根拠URLを表示",
    observations: [recommendationObservations.matchupGpt, recommendationObservations.matchupGemini, recommendationObservations.matchupPerplexity]
  },
  {
    id: "research-page",
    label: "調査データ",
    target: "/research",
    values: [68, 72, 74, 48],
    impactValue: "28観測",
    impactUnit: "固定質問 × AIモデル × 観測日",
    impactSummary: "調査方法や一次データを求める質問で、自社調査URLが引用されなかった観測です。",
    evidenceSummary: "第三者調査ページの引用と自社情報不足を、URL単位で確認しています。",
    continuityValue: "11日",
    continuitySummary: "Q-088で自社調査URLが引用されない状態が期間内で繰り返されました。",
    executionSummary: "新規調査ページの作成に必要な調査設計・集計・更新運用を評価します。",
    requiredInput: "調査方法・母数・集計定義・更新日・一次データ",
    acceptance: "調査方法と数値の根拠をページ内で再確認できる",
    observations: [recommendationObservations.citationResearch, recommendationObservations.thirdPartyGpt]
  },
  {
    id: "pricing-page",
    label: "料金ページ",
    target: "/pricing",
    values: [41, 89, 81, 88],
    impactValue: "6回答",
    impactUnit: "AI回答",
    impactSummary: "料金または導入期間について、回答と公式事実台帳に差があった回答です。",
    evidenceSummary: "回答内の主張と公式URLを項目単位で照合した差分を使います。",
    continuityValue: "14日",
    continuitySummary: "旧料金または確認不能な導入期間の記述が期間内で繰り返されました。",
    executionSummary: "既存ページの事実・URL・更新日を揃える限定的な改修として評価します。",
    requiredInput: "現行料金・導入期間・公式URL・最終確認日",
    acceptance: "公式事実台帳との項目差分がない",
    observations: [recommendationObservations.factPricing, recommendationObservations.factImplementation]
  },
  {
    id: "case-study-page",
    label: "導入事例",
    target: "/cases",
    values: [57, 63, 66, 52],
    impactValue: "19観測",
    impactUnit: "固定質問 × AIモデル × 観測日",
    impactSummary: "導入事例を求める固定質問で、競合事例だけが掲載された観測範囲です。",
    evidenceSummary: "事例質問の回答本文と引用された競合・第三者事例URLを確認しています。",
    continuityValue: "9日",
    continuitySummary: "Q-062で自社事例が掲載されない回答が期間内で繰り返されました。",
    executionSummary: "顧客許諾、事例素材、業種別整理が必要な新規コンテンツとして評価します。",
    requiredInput: "顧客許諾・導入前後の事実・業種・利用範囲",
    acceptance: "事例ごとに確認可能な事実と公開範囲を明記",
    observations: [recommendationObservations.caseStudyGpt, recommendationObservations.caseStudyGemini]
  },
  {
    id: "third-party-coverage",
    label: "第三者掲載",
    target: "第三者メディア / 比較サイト",
    values: [74, 58, 61, 39],
    impactValue: "21URL",
    impactUnit: "完全URL",
    impactSummary: "競合掲載・自社不在の回答で使用された第三者または競合URLの差分です。",
    evidenceSummary: "回答に付与された完全URLを所有区分別に集計し、出現回答へ遡ります。",
    continuityValue: "10日",
    continuitySummary: "第三者URLが使われ自社URLが使われない状態が複数質問で継続しました。",
    executionSummary: "第三者編集権限を持たないため、直接変更ではなく掲載候補と確認手順を評価します。",
    requiredInput: "候補媒体・編集方針・連絡可否・掲載内容の事実確認",
    acceptance: "第三者掲載を保証せず、確認可能な候補と対応履歴を保持",
    observations: [recommendationObservations.thirdPartyGpt, recommendationObservations.citationResearch]
  }
];

function recommendationOpportunityForModels(
  candidate: RecommendationOpportunity,
  activeModelSet: ReadonlySet<string>
): RecommendationOpportunity {
  return {
    ...candidate,
    observations: candidate.observations.filter((observation) => activeModelSet.has(observation.model))
  };
}

function opportunityDetailWithResponseSearch(
  detail: ReportDetailPayload,
  candidate: RecommendationOpportunity,
  reportBase: string
): ReportDetailPayload {
  const sourceObservation = candidate.observations.find((observation) => observation.citationUrl || observation.officialUrl)
    ?? candidate.observations[0];

  return {
    ...detail,
    sections: sourceObservation
      ? [
          ...detail.sections,
          {
            title: "代表回答と参照元を確認",
            description: "この候補を判断する代表回答です。質問・モデル・結果と、回答が参照した外部URLを確認できます。",
            facts: recommendationPromptModelSourceFacts(sourceObservation, {
              includeCitation: true,
              includeOfficial: true
            })
          }
        ]
      : detail.sections,
    detailHref: `${reportBase}/conversations`,
    detailLabel: "AI回答を検索"
  };
}

function opportunityCellDetail(
  candidate: RecommendationOpportunity,
  axis: OpportunityAxisKey,
  value: number,
  reportBase: string
): ReportDetailPayload | null {
  if (axis !== "execution" && candidate.observations.length < 2) return null;

  if (axis === "impact") {
    return opportunityDetailWithResponseSearch({
      kicker: `OPPORTUNITY IMPACT / ${candidate.id}`,
      title: `${candidate.label}の影響範囲`,
      value: `${value}点`,
      summary: candidate.impactSummary,
      sections: [
        {
          title: `${candidate.label}で数えた対象`,
          facts: [
            { label: "対象", value: candidate.target },
            { label: "根拠の対象", value: candidate.impactValue, tone: "amber" },
            { label: "集計単位", value: candidate.impactUnit },
            { label: "効果予測", value: "含まない" }
          ]
        },
        {
          title: `${candidate.label}の影響範囲へ含めた代表観測`,
          items: recommendationObservationTrace(candidate.observations.slice(0, 2), { includeCitation: true })
        },
        {
          title: "この点数の読み方",
          facts: [
            { label: "示すもの", value: "観測された対象範囲の相対評価" },
            { label: "示さないもの", value: "実施後の掲載率・引用率の改善幅" }
          ]
        }
      ]
    }, candidate, reportBase);
  }

  if (axis === "evidence") {
    return opportunityDetailWithResponseSearch({
      kicker: `OPPORTUNITY EVIDENCE / ${candidate.id}`,
      title: `${candidate.label}の根拠強度`,
      value: `${value}点`,
      summary: candidate.evidenceSummary,
      sections: [
        {
          title: `${candidate.label}で照合した根拠`,
          facts: [
            { label: "対象", value: candidate.target },
            { label: "観測上の根拠", value: candidate.evidenceSummary },
            { label: "確認方法", value: "回答本文・掲載位置・引用URL・公式事実を個別照合" },
            { label: "因果判定", value: "しない" }
          ]
        },
        {
          title: `${candidate.label}の根拠を構成する回答`,
          items: recommendationObservationTrace(candidate.observations.slice(0, 3), {
            includeCitation: true,
            includeOfficial: candidate.id === "pricing-page"
          })
        },
        {
          title: "根拠強度の境界",
          facts: [
            { label: "強度", value: "観測の種類・反復・照合可能性を評価" },
            { label: "非保証", value: "施策実行による効果を保証する点数ではない" }
          ]
        }
      ]
    }, candidate, reportBase);
  }

  if (axis === "continuity") {
    return opportunityDetailWithResponseSearch({
      kicker: `OPPORTUNITY CONTINUITY / ${candidate.id}`,
      title: `${candidate.label}の継続性`,
      value: `${value}点`,
      summary: candidate.continuitySummary,
      sections: [
        {
          title: `${candidate.label}で継続した判定`,
          facts: [
            { label: "対象", value: candidate.target },
            { label: "継続", value: candidate.continuityValue, tone: "green" },
            { label: "実行頻度", value: "毎日1回" },
            { label: "照合条件", value: "同じ固定質問 × 同じAIモデル" }
          ]
        },
        {
          title: `${candidate.label}の継続期間で確認する代表観測`,
          items: recommendationObservationTrace(candidate.observations.slice(0, 2), { includeCitation: true })
        },
        {
          title: "継続判定の注意",
          facts: [
            { label: "欠測", value: "継続・不継続のどちらにも含めない" },
            { label: "意味", value: "同じ状態の反復であり、原因の特定ではない" }
          ]
        }
      ]
    }, candidate, reportBase);
  }

  return opportunityDetailWithResponseSearch({
    kicker: `IMPLEMENTATION INPUT / ${candidate.id}`,
    title: `${candidate.label}の実行容易性`,
    value: `${value}点`,
    summary: candidate.executionSummary,
    sections: [
      {
        title: `${candidate.label}で必要な実装入力`,
        facts: [
          { label: "対象", value: candidate.target },
          { label: "必要素材", value: candidate.requiredInput },
          { label: "受入条件", value: candidate.acceptance },
          { label: "評価区分", value: "着手条件（観測値ではありません）" }
        ]
      },
      {
        title: `${candidate.label}の着手前確認`,
        items: [
          { title: "必要素材", meta: candidate.requiredInput, description: "着手前に用意する素材と確認方法を整理します。" },
          { title: "完了条件", meta: candidate.acceptance, description: "施策が意図どおり実施されたかを確認する条件です。" }
        ]
      },
      {
        title: "観測データとの境界",
        facts: [
          { label: "この点数", value: "対象URL・素材・実装範囲から評価" },
          { label: "含めないもの", value: "AI表示率・順位・引用率の効果予測" }
        ]
      }
    ]
  }, candidate, reportBase);
}

function opportunityCellTone(value: number) {
  if (value >= 80) return "border-[#0B6B57] bg-[#0B6B57] text-white";
  if (value >= 65) return "border-[#9BC8B8] bg-[#DDF0E9] text-[#0B4B3E]";
  if (value >= 50) return "border-[#D5E2DD] bg-[#F1F7F4] text-[#344054]";
  return "border-[#E4E7EC] bg-[#F8FAF9] text-[#475467]";
}

function opportunityPointTone(value: number) {
  if (value >= 80) return "border-[#064E3B] bg-[#0B6B57] text-white shadow-[0_0_0_4px_rgba(11,107,87,0.12)]";
  if (value >= 65) return "border-[#0B6B57] bg-[#5DA58F] text-white shadow-[0_0_0_4px_rgba(93,165,143,0.13)]";
  if (value >= 50) return "border-[#73A998] bg-[#B8D8CE] text-[#123D33] shadow-[0_0_0_4px_rgba(184,216,206,0.18)]";
  return "border-[#AFCBC2] bg-[#E5F0EC] text-[#344054] shadow-[0_0_0_4px_rgba(229,240,236,0.25)]";
}

function opportunityPointPlacement(candidateId: string) {
  if (candidateId === "third-party-coverage" || candidateId === "pricing-page") {
    return {
      connector: "right-full top-1/2 w-2",
      label: "right-[calc(100%+9px)] top-1/2 -translate-y-1/2"
    };
  }

  return {
    connector: "left-full top-1/2 w-2",
    label: "left-[calc(100%+9px)] top-1/2 -translate-y-1/2"
  };
}

function opportunityCandidateDetail(
  candidate: RecommendationOpportunity,
  reportBase: string
): ReportDetailPayload {
  const [impact, evidence, continuity, execution] = candidate.values;

  return opportunityDetailWithResponseSearch({
    kicker: `OPPORTUNITY POSITION / ${candidate.id}`,
    title: `${candidate.label}の機会ポジション`,
    value: `影響 ${impact}点 / 実行 ${execution}点`,
    summary: "位置図では影響範囲と実行容易性の組み合わせを示します。根拠強度と継続性を含む4指標は、同じ候補の判断材料として分けて確認します。",
    sections: [
      {
        title: "4つの比較軸",
        description: "点数は候補間で位置と判断材料を比べるための相対評価です。実施後の改善幅を予測するものではありません。",
        variant: "comparison",
        table: {
          columns: ["比較軸", "点数", "観測上の判断材料"],
          rows: [
            ["影響範囲", `${impact}点`, candidate.impactSummary],
            ["根拠強度", `${evidence}点`, candidate.evidenceSummary],
            ["継続性", `${continuity}点`, candidate.continuitySummary],
            ["実行容易性", `${execution}点`, candidate.executionSummary]
          ]
        }
      },
      {
        title: "着手前に確認すること",
        facts: [
          { label: "対象", value: candidate.target },
          { label: "必要素材", value: candidate.requiredInput },
          { label: "受入条件", value: candidate.acceptance }
        ]
      }
    ]
  }, candidate, reportBase);
}

function RecommendationOpportunityMatrix({ reportBase, models }: { reportBase: string; models: readonly string[] }) {
  const activeModelSet = new Set(models);
  const modelScopedOpportunities = recommendationOpportunities.map((candidate) => recommendationOpportunityForModels(candidate, activeModelSet));

  return (
    <div className="space-y-5">
      <section className="hidden min-w-0 border border-[#DCE5E1] bg-[#FBFCFC] px-5 pb-5 pt-4 md:block" aria-labelledby="opportunity-position-title">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div>
            <h3 id="opportunity-position-title" className="text-base font-bold text-[#101828]">改善領域の位置</h3>
            <p className="mt-1 text-[13px] leading-6 text-[#667085]">上ほど影響範囲が広く、右ほど実行しやすい改善領域です。マーカーを押すと4指標をまとめて確認できます。</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#53665F]" aria-label="根拠強度の色凡例">
            <span>マーカー内の数値・濃淡＝根拠強度</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#0B6B57]" />80–100</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#5DA58F]" />65–79</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#B8D8CE]" />50–64</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#E5F0EC] ring-1 ring-[#AFCBC2]" />0–49</span>
          </div>
        </div>

        <div className="relative mb-7 ml-12 mr-24 mt-9 h-[340px]" role="group" aria-label="横軸が実行容易性、縦軸が影響範囲の改善領域位置図。いずれも0点から100点です。">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden border border-[#BFCFC9] bg-white">
            <div className="border-b border-r border-dashed border-[#C9D7D2] bg-[#F7FAF9]" />
            <div className="border-b border-dashed border-[#C9D7D2] bg-[#F1F7F4]" />
            <div className="border-r border-dashed border-[#C9D7D2] bg-white" />
            <div className="bg-[#FAFCFB]" />
          </div>
          <span className="pointer-events-none absolute left-3 top-3 z-10 bg-white/85 px-2 py-1 text-[10px] font-bold text-[#53665F]">影響大・準備が必要</span>
          <span className="pointer-events-none absolute right-3 top-3 z-10 bg-white/85 px-2 py-1 text-[10px] font-bold text-[#075E44]">影響大・実行しやすい</span>
          <span className="pointer-events-none absolute bottom-3 left-3 z-10 bg-white/85 px-2 py-1 text-[10px] font-bold text-[#667085]">影響限定・準備が必要</span>
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 bg-white/85 px-2 py-1 text-[10px] font-bold text-[#53665F]">影響限定・実行しやすい</span>
          <span className="absolute -left-12 -top-2 text-[11px] font-bold text-[#52645E]">高 100</span>
          <span className="absolute -left-12 -bottom-2 text-[11px] font-bold text-[#7A8A84]">低 0</span>
          <span className="absolute -left-12 top-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] font-bold text-[#344054]">影響範囲</span>
          <span className="absolute -bottom-7 left-0 text-[11px] font-bold text-[#7A8A84]">低 0</span>
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-bold text-[#344054]">実行容易性</span>
          <span className="absolute -bottom-7 right-0 text-[11px] font-bold text-[#52645E]">100 高</span>

          {modelScopedOpportunities.map((candidate) => {
            const [impact, evidence, , execution] = candidate.values;
            const placement = opportunityPointPlacement(candidate.id);
            return (
              <ReportDetailButton
                key={candidate.id}
                detail={opportunityCandidateDetail(candidate, reportBase)}
                showIcon={false}
                className={`absolute z-20 !h-12 !min-h-0 !w-12 -translate-x-1/2 -translate-y-1/2 justify-center rounded-full border text-[13px] font-extrabold tabular-nums transition hover:scale-105 hover:ring-2 hover:ring-[#0B382D] hover:ring-offset-2 ${opportunityPointTone(evidence)}`}
                style={{ left: `${execution}%`, top: `${100 - impact}%` }}
                label={`${candidate.label}の改善領域の位置を開く`}
              >
                <span aria-hidden="true" className={`absolute h-px bg-[#6F847C] ${placement.connector}`} />
                <span className={`absolute z-30 whitespace-nowrap border border-[#CAD8D3] bg-white px-2 py-1 text-[12px] font-bold text-[#1D2939] shadow-sm ${placement.label}`}>{candidate.label}</span>
                <span>{evidence}</span>
              </ReportDetailButton>
            );
          })}
        </div>
      </section>

      <section className="hidden overflow-hidden border border-[#DCE5E1] bg-white md:block" aria-labelledby="opportunity-score-title">
        <div className="border-b border-[#DCE5E1] bg-[#F7F9F8] px-5 py-3">
          <h3 id="opportunity-score-title" className="text-sm font-bold text-[#101828]">4指標を並べて比較</h3>
          <p className="mt-1 text-[12px] text-[#667085]">改善領域名で全体、各点数でその指標の判断材料を確認できます。</p>
        </div>
        <div className="grid grid-cols-[minmax(180px,1.25fr)_repeat(4,minmax(96px,.72fr))] border-b border-[#DCE5E1] bg-white text-[11px] font-bold text-[#667085]">
          <div className="px-4 py-2.5">改善領域</div>
          {opportunityAxes.map((axis) => <div key={axis.key} className="border-l border-[#E5EAE8] px-3 py-2.5 text-center">{axis.label}</div>)}
        </div>
        {modelScopedOpportunities.map((candidate) => (
          <div key={candidate.id} className="grid grid-cols-[minmax(180px,1.25fr)_repeat(4,minmax(96px,.72fr))] border-b border-[#E5EAE8] last:border-b-0">
            <ReportDetailButton
              detail={opportunityCandidateDetail(candidate, reportBase)}
              showIcon={false}
              className="!flex min-h-[70px] w-full !rounded-none px-4 py-3 hover:bg-[#F4F8F6] hover:ring-2 hover:ring-inset hover:ring-[#0B382D]"
              label={`${candidate.label}領域の4指標をまとめて開く`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#101828]">{candidate.label}</span>
                <span className="mt-1 block break-all text-[11px] font-semibold text-[#667085]">{candidate.target}</span>
              </span>
            </ReportDetailButton>
            {opportunityAxes.map((axis, axisIndex) => {
              const value = candidate.values[axisIndex] ?? 0;
              const detail = opportunityCellDetail(candidate, axis.key, value, reportBase);
              const content = (
                <span className="text-center">
                  <span className="block text-lg font-extrabold tabular-nums">{value}</span>
                  <span className="mt-0.5 block text-[10px] font-bold opacity-80">{axis.key === "impact" ? candidate.impactValue : "内訳"}</span>
                </span>
              );
              return detail ? (
                <ReportDetailButton
                  key={axis.key}
                  detail={detail}
                  showIcon={false}
                  className={`!flex min-h-[70px] w-full justify-center !rounded-none border-l border-[#E5EAE8] px-2 py-2 hover:ring-2 hover:ring-inset hover:ring-[#0B382D] ${opportunityCellTone(value)}`}
                  label={`${candidate.label}の${axis.label}の内訳を開く`}
                >
                  {content}
                </ReportDetailButton>
              ) : <div key={axis.key} className={`flex min-h-[70px] items-center justify-center border-l border-[#E5EAE8] ${opportunityCellTone(value)}`}>{content}</div>;
            })}
          </div>
        ))}
      </section>

      <div className="space-y-3 md:hidden">
        {modelScopedOpportunities.map((candidate) => (
          <section key={candidate.id} className="min-w-0 overflow-hidden border border-[#DCE5E1] bg-white">
            <ReportDetailButton
              detail={opportunityCandidateDetail(candidate, reportBase)}
              showIcon={false}
              className="!flex w-full !rounded-none border-b border-[#DCE5E1] px-4 py-3 hover:bg-[#F4F8F6]"
              label={`${candidate.label}領域の4指標をまとめて開く`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#101828]">{candidate.label}</span>
                <span className="mt-1 block break-all text-[11px] font-semibold text-[#667085]">{candidate.target}</span>
              </span>
            </ReportDetailButton>
            <div className="grid grid-cols-2">
              {opportunityAxes.map((axis, axisIndex) => {
                const value = candidate.values[axisIndex] ?? 0;
                const detail = opportunityCellDetail(candidate, axis.key, value, reportBase);
                const content = <span><span className="block text-[11px] font-bold">{axis.label}</span><span className="mt-1 block text-lg font-extrabold tabular-nums">{value}点</span>{axis.key === "impact" && <span className="mt-0.5 block text-[10px] font-bold opacity-80">{candidate.impactValue}</span>}</span>;
                return detail ? (
                  <ReportDetailButton
                    key={axis.key}
                    detail={detail}
                    showIcon={false}
                    className={`!flex min-h-[76px] w-full justify-center !rounded-none border-b border-r border-[#E5EAE8] px-2 py-2 text-center hover:ring-2 hover:ring-inset hover:ring-[#0B382D] ${opportunityCellTone(value)}`}
                    label={`${candidate.label}の${axis.label}の内訳を開く`}
                  >
                    {content}
                  </ReportDetailButton>
                ) : <div key={axis.key} className={`flex min-h-[76px] items-center justify-center border-b border-r border-[#E5EAE8] text-center ${opportunityCellTone(value)}`}>{content}</div>;
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
type RecommendationEvidenceType = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: "green" | "amber" | "red";
  description: string;
  candidateIds: readonly string[];
};

const recommendationEvidenceTypes: readonly RecommendationEvidenceType[] = [
  {
    id: "direct-matchup",
    label: "競合直接対決",
    value: "58観測",
    note: "Trailbase先行",
    tone: "amber",
    description: "同じ固定質問・同じAIモデルで、競合がRecoraより先に掲載された観測です。",
    candidateIds: ["compare-page", "case-study-page"]
  },
  {
    id: "citation-gap",
    label: "引用ギャップ",
    value: "21URL",
    note: "競合掲載・自社不在",
    tone: "amber",
    description: "競合回答では使われ、自社が掲載された回答では使われていない引用URLの差分です。",
    candidateIds: ["compare-page", "research-page", "case-study-page", "third-party-coverage"]
  },
  {
    id: "fact-difference",
    label: "公式事実差分",
    value: "6回答",
    note: "料金・導入期間",
    tone: "red",
    description: "AI回答の記述と公式事実を項目単位で照合し、不一致がある回答です。",
    candidateIds: ["pricing-page"]
  },
  {
    id: "continuity",
    label: "最長継続",
    value: "14日",
    note: "一時変動と分離",
    tone: "green",
    description: "同じ固定質問・同じAIモデルで、同じ判定が連続した観測です。",
    candidateIds: ["compare-page", "research-page", "pricing-page", "case-study-page", "third-party-coverage"]
  }
];

function recommendationEvidenceTypeTone(tone: RecommendationEvidenceType["tone"]) {
  if (tone === "green") return "text-[#075E44]";
  if (tone === "red") return "text-[#B42318]";
  return "text-[#A15C00]";
}

function recommendationEvidenceRelationDetail(
  candidate: RecommendationOpportunity,
  evidenceType: RecommendationEvidenceType,
  reportBase: string,
  models: readonly string[]
): ReportDetailPayload {
  const activeModelSet = new Set(models);
  const modelScopedObservations = candidate.observations.filter((observation) => activeModelSet.has(observation.model));
  const filteredObservations = evidenceType.id === "citation-gap"
    ? modelScopedObservations.filter((observation) => Boolean(observation.citationUrl))
    : evidenceType.id === "fact-difference"
      ? modelScopedObservations.filter((observation) => Boolean(observation.officialUrl))
      : modelScopedObservations;
  const representativeObservations = filteredObservations.slice(0, 2);

  return {
    kicker: `OBSERVATION LINK / ${evidenceType.id}`,
    title: `${candidate.label} × ${evidenceType.label}`,
    value: "関連あり",
    summary: `${evidenceType.description}この観測タイプを「${candidate.label}」改善領域の判断材料に含めています。`,
    sections: [
      {
        title: "この改善領域との関係",
        facts: [
          { label: "改善領域", value: candidate.label },
          { label: "対象", value: candidate.target },
          { label: "観測タイプ", value: evidenceType.label },
          { label: "このセルが示すもの", value: "判断材料として使用（件数ではない）" },
          ...(evidenceType.id === "continuity" ? [{ label: "この改善領域の最長継続", value: candidate.continuityValue }] : []),
          { label: "全改善領域での全体値", value: `${evidenceType.value}・${evidenceType.note}` }
        ]
      },
      {
        title: "改善領域に紐づく代表観測",
        description: "この改善領域と観測タイプの関係を確認する代表例です。全件はAI回答から検索できます。",
        variant: "trace",
        items: recommendationObservationTrace(representativeObservations, {
          includeCitation: evidenceType.id === "citation-gap",
          includeOfficial: evidenceType.id === "fact-difference"
        })
      }
    ],
    detailHref: `${reportBase}/conversations`,
    detailLabel: "AI回答を検索"
  };
}

function RecommendationEvidenceTypeMatrix({
  details,
  reportBase,
  models
}: {
  details: readonly ReportDetailPayload[];
  reportBase: string;
  models: readonly string[];
}) {
  const activeModelSet = new Set(models);
  const modelScopedOpportunities = recommendationOpportunities.map((candidate) => recommendationOpportunityForModels(candidate, activeModelSet));

  return (
    <div className="space-y-5">
      <section aria-labelledby="evidence-type-summary-title">
        <div className="mb-3">
          <h3 id="evidence-type-summary-title" className="text-sm font-bold text-[#101828]">観測タイプ全体</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#667085]">選択期間で確認された観測タイプの全体値です。各項目から内訳を確認できます。</p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#DCE5E1] bg-[#DCE5E1] xl:grid-cols-4">
          {recommendationEvidenceTypes.map((evidenceType, index) => {
            const detail = details[index];
            const content = (
              <span className="min-w-0">
                <span className="block text-[11px] font-bold text-[#667085]">{evidenceType.label}</span>
                <span className={`mt-1.5 block text-xl font-extrabold tabular-nums ${recommendationEvidenceTypeTone(evidenceType.tone)}`}>{evidenceType.value}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-[#53665F]">{evidenceType.note}</span>
              </span>
            );
            return detail ? (
              <ReportDetailButton
                key={evidenceType.id}
                detail={detail}
                className="!flex min-h-[96px] w-full !rounded-none bg-white px-4 py-3 transition hover:bg-[#F3F8F6] hover:ring-2 hover:ring-inset hover:ring-[#0B382D]"
                label={`${evidenceType.label}の全体内訳を開く`}
              >
                {content}
              </ReportDetailButton>
            ) : <div key={evidenceType.id} className="min-h-[96px] bg-white px-4 py-3">{content}</div>;
          })}
        </div>
      </section>

      <section aria-labelledby="candidate-evidence-link-title">
        <div className="mb-3">
          <h3 id="candidate-evidence-link-title" className="text-sm font-bold text-[#101828]">改善領域ごとに使った観測タイプ</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#667085]">「関連」は、その観測タイプを改善領域の判断材料に使ったことを示し、件数ではありません。「—」はデータなしではなく、その領域の判断には使っていないことを示します。最長継続は、他の観測タイプに重ねて見る時間方向の補助軸です。</p>
        </div>

        <div className="hidden overflow-hidden border border-[#DCE5E1] bg-white md:block">
          <div className="grid grid-cols-[minmax(180px,1.35fr)_repeat(4,minmax(110px,1fr))] border-b border-[#DCE5E1] bg-[#F7F9F8] text-[11px] font-bold text-[#667085]">
            <div className="px-4 py-3">改善領域</div>
            {recommendationEvidenceTypes.map((evidenceType) => (
              <div key={evidenceType.id} className="border-l border-[#DCE5E1] px-3 py-3 text-center">{evidenceType.label}</div>
            ))}
          </div>
          {modelScopedOpportunities.map((candidate) => (
            <div key={candidate.id} className="grid grid-cols-[minmax(180px,1.35fr)_repeat(4,minmax(110px,1fr))] border-b border-[#E5EAE8] last:border-b-0">
              <ReportDetailButton
                detail={opportunityCandidateDetail(candidate, reportBase)}
                showIcon={false}
                className="!flex min-h-[64px] w-full !rounded-none px-4 py-2.5 hover:bg-[#F4F8F6] hover:ring-2 hover:ring-inset hover:ring-[#0B382D]"
                label={`${candidate.label}領域の全体を開く`}
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[#101828]">{candidate.label}</span>
                  <span className="mt-0.5 block break-all text-[10px] font-semibold text-[#667085]">{candidate.target}</span>
                </span>
              </ReportDetailButton>
              {recommendationEvidenceTypes.map((evidenceType) => {
                const related = evidenceType.candidateIds.includes(candidate.id);
                return related ? (
                  <ReportDetailButton
                    key={evidenceType.id}
                    detail={recommendationEvidenceRelationDetail(candidate, evidenceType, reportBase, models)}
                    showIcon={false}
                    className="!flex min-h-[64px] w-full justify-center !rounded-none border-l border-[#D4E6DF] bg-[#EDF7F3] px-2 py-2 text-center text-[#075E44] hover:bg-[#DDF0E9] hover:ring-2 hover:ring-inset hover:ring-[#0B382D]"
                    label={`${candidate.label}と${evidenceType.label}の紐づきを開く`}
                  >
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold"><span className="h-2 w-2 rounded-full bg-[#0B6B57]" aria-hidden="true" />関連</span>
                  </ReportDetailButton>
                ) : (
                  <div key={evidenceType.id} className="flex min-h-[64px] items-center justify-center border-l border-[#E5EAE8] bg-[#FBFCFC] text-sm font-semibold text-[#98A2B3]" aria-label={`${candidate.label}と${evidenceType.label}は関連なし`}>—</div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="space-y-3 md:hidden">
          {modelScopedOpportunities.map((candidate) => {
            const relatedTypes = recommendationEvidenceTypes.filter((evidenceType) => evidenceType.candidateIds.includes(candidate.id));
            return (
              <article key={candidate.id} className="overflow-hidden border border-[#DCE5E1] bg-white">
                <ReportDetailButton
                  detail={opportunityCandidateDetail(candidate, reportBase)}
                  showIcon={false}
                  className="!flex w-full !rounded-none border-b border-[#DCE5E1] px-4 py-3 hover:bg-[#F4F8F6]"
                  label={`${candidate.label}領域の全体を開く`}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-[#101828]">{candidate.label}</span>
                    <span className="mt-0.5 block break-all text-[10px] font-semibold text-[#667085]">{candidate.target}</span>
                  </span>
                </ReportDetailButton>
                <div className="flex flex-wrap gap-2 p-3">
                  {relatedTypes.map((evidenceType) => (
                    <ReportDetailButton
                      key={evidenceType.id}
                      detail={recommendationEvidenceRelationDetail(candidate, evidenceType, reportBase, models)}
                      showIcon={false}
                      className="!flex min-h-10 rounded-full border border-[#B9D9CD] bg-[#EDF7F3] px-3 py-2 text-[11px] font-bold text-[#075E44] hover:bg-[#DDF0E9]"
                      label={`${candidate.label}と${evidenceType.label}の紐づきを開く`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#0B6B57]" aria-hidden="true" />
                      {evidenceType.label}
                    </ReportDetailButton>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
function recommendationRowDetail({
  kind,
  title,
  summary,
  facts,
  comparison,
  trace,
  detailHref
}: {
  kind: RecommendationDataKind;
  title: string;
  summary: string;
  facts: { label: string; value: string; tone?: "default" | "green" | "amber" | "red" }[];
  comparison: { columns: string[]; rows: string[][] };
  trace: { title: string; meta?: string; description?: string }[];
  detailHref?: string;
}): ReportDetailPayload {
  const copy = recommendationKindCopy[kind];
  return {
    kicker: copy.kicker,
    title,
    summary,
    sections: [
      {
        title: "このデータの定義",
        description: copy.definition,
        facts
      },
      {
        title: copy.comparisonTitle,
        variant: "comparison",
        table: comparison
      },
      {
        title: copy.traceTitle,
        variant: "trace",
        items: trace
      }
    ],
    detailHref,
    detailLabel: detailHref ? "観測と受入条件を詳細ページで確認" : undefined
  };
}

function recommendationEvidenceDetail(
  detail: ReportDetailPayload,
  observation: RecommendationObservation | undefined,
  reportBase: string
): ReportDetailPayload {
  return {
    ...detail,
    sections: observation ? [
      ...detail.sections,
      {
        title: "代表回答と引用元を確認",
        description: "上の観測から代表1件を開き、質問・AIモデル・結果・参照URLを確認します。",
        facts: recommendationPromptModelSourceFacts(observation, {
          includeCitation: true,
          includeOfficial: true
        })
      }
    ] : detail.sections,
    detailHref: `${reportBase}/conversations`,
    detailLabel: "質問・AIモデルから回答を検索"
  };
}

function recommendationTableRowDetails(details: readonly (ReportDetailPayload | null)[]) {
  return (_row: ReactNode[], rowIndex: number) => details[rowIndex] ?? null;
}

export function RecommendationAdvancedPanels({ reportBase, models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"] }: { reportBase:string; models?: readonly string[] }) {
  const matchupModelSeeds = [
    { ahead: "18", recora: "10", tied: "4" },
    { ahead: "15", recora: "9", tied: "3" },
    { ahead: "13", recora: "8", tied: "2" },
    { ahead: "12", recora: "6", tied: "2" }
  ] as const;
  const activeMatchupModelRows = models.slice(0, 4).map((model, index) => {
    const seed = matchupModelSeeds[index] ?? matchupModelSeeds[matchupModelSeeds.length - 1];
    return [model, seed.ahead, seed.recora, seed.tied];
  });
  const activeModelSet = new Set(models);
  const activeObservations = (observations: readonly RecommendationObservation[]) => observations.filter((observation) => activeModelSet.has(observation.model));
  const activeRepresentative = (observations: readonly RecommendationObservation[]) => activeObservations(observations)[0];
  const continuityComparisonRows = [
    { model: "GPT", row: ["競合先行", "Q-034 × GPT", "14日"] },
    { model: "Perplexity", row: ["自社未引用", "Q-088 × Perplexity", "11日"] },
    { model: "GPT", row: ["公式事実差分", "Q-012 × GPT", "14日"] }
  ].filter((item) => activeModelSet.has(item.model)).map((item) => item.row);
  const activeModelCountLabel = (candidateModels: readonly string[]) => `${candidateModels.filter((model) => activeModelSet.has(model)).length}モデル`;
  const candidateDetails: ReportDetailPayload[] = [
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "page-improvement",
      title: "競合比較ページに選定基準表を追加",
      summary: "既存の /compare/geo-tools を改善する候補です。競合先行の観測と引用元の差を、同じ質問条件で確認します。",
      facts: [
        { label: "対象URL", value: "/compare/geo-tools" },
        { label: "候補区分", value: "既存ページ改善" },
        { label: "優先度", value: "高（実施順）", tone: "red" },
        { label: "根拠強度", value: "高", tone: "green" },
        { label: "根拠の対象", value: "42観測" },
        { label: "集計単位", value: "固定質問 × AIモデル × 観測日" }
      ],
      comparison: {
        columns: ["比較軸", "現在", "実施後に確認"],
        rows: [
          ["選定基準", "競合ページのみで明示", "自社ページで読者別に明示"],
          ["平均掲載位置", "同一質問で競合が先行", "同一質問×同一モデルで前後比較"],
          ["引用元", "trailbase.io が先行", "自社URLの引用回答を別集計"]
        ]
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.matchupGpt,
        recommendationObservations.matchupGemini,
        recommendationObservations.matchupPerplexity
      ]), { includeCitation: true })
    }), activeRepresentative([
      recommendationObservations.matchupGpt,
      recommendationObservations.matchupGemini,
      recommendationObservations.matchupPerplexity
    ]), reportBase),
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "new-page",
      title: "引用されやすい調査データページを新規作成",
      summary: "既存ページで不足している一次データ需要を、新しいURLで受け止める候補です。",
      facts: [
        { label: "候補URL", value: "/research" },
        { label: "候補区分", value: "新規ページ" },
        { label: "優先度", value: "高（実施順）", tone: "red" },
        { label: "根拠強度", value: "中", tone: "amber" },
        { label: "根拠の対象", value: "28観測" },
        { label: "集計単位", value: "固定質問 × AIモデル × 観測日" }
      ],
      comparison: {
        columns: ["確認軸", "既存ページ", "新規ページ案"],
        rows: [
          ["検索意図", "製品説明が中心", "AI検索の調査データ"],
          ["自社引用", "引用できる一次情報が不足", "調査方法・数値・更新日を明示"],
          ["競合との重複", "—", "既存ページとの役割重複を公開前に確認"]
        ]
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.citationResearch,
        recommendationObservations.thirdPartyGpt
      ]), { includeCitation: true })
    }), activeRepresentative([
      recommendationObservations.citationResearch,
      recommendationObservations.thirdPartyGpt
    ]), reportBase),
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "page-improvement",
      title: "料金と導入期間の説明を最新化",
      summary: "既存の料金情報を公式事実に合わせる候補です。古い説明が残った回答だけに遡ります。",
      facts: [
        { label: "対象URL", value: "/pricing" },
        { label: "候補区分", value: "既存ページ改善" },
        { label: "優先度", value: "中（実施順）", tone: "amber" },
        { label: "根拠強度", value: "高", tone: "green" },
        { label: "根拠の対象", value: "6回答", tone: "red" },
        { label: "集計単位", value: "AI回答" }
      ],
      comparison: {
        columns: ["比較軸", "観測された説明", "公式事実"],
        rows: [
          ["料金", "旧プランの説明", "現行プランと更新日"],
          ["導入期間", "確認できない断定を含む", "公式に確認できる範囲だけ表示"],
          ["確認方法", "回答本文", "引用元と公式事実台帳を照合"]
        ]
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.factPricing,
        recommendationObservations.factImplementation
      ]), { includeCitation: true, includeOfficial: true, resultLabel: "公式事実との差" })
    }), activeRepresentative([
      recommendationObservations.factPricing,
      recommendationObservations.factImplementation
    ]), reportBase)
  ];
  const evidenceTypeDetails: ReportDetailPayload[] = [
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "observation-type",
      title: "競合直接対決での先行",
      summary: "同じ固定質問・同じAIモデルで、競合がRecoraより先に掲載された観測です。",
      facts: [
        { label: "データ種別", value: "競合直接対決" },
        { label: "競合先行", value: "58観測", tone: "amber" },
        { label: "主な競合", value: "Trailbase" },
        { label: "比較単位", value: "観測日 × 固定質問 × AIモデル" }
      ],
      comparison: {
        columns: ["AIモデル", "競合先行", "Recora先行", "同順位"],
        rows: activeMatchupModelRows
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.matchupGpt,
        recommendationObservations.matchupGemini
      ]))
    }), activeRepresentative([recommendationObservations.matchupGpt, recommendationObservations.matchupGemini]), reportBase),
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "observation-type",
      title: "競合掲載・自社不在の引用URL",
      summary: "競合回答では使われ、自社が掲載された回答では使われていない引用URLの差分です。",
      facts: [
        { label: "データ種別", value: "引用URLギャップ" },
        { label: "対象URL", value: "21URL", tone: "amber" },
        { label: "所有区分", value: "競合公式 / 第三者" },
        { label: "比較単位", value: "回答 × 正規化URL" }
      ],
      comparison: {
        columns: ["所有区分", "競合回答で引用", "自社回答で引用", "差分"],
        rows: [["競合公式", "12URL", "0URL", "12"], ["第三者メディア", "16URL", "7URL", "9"]]
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.citationResearch,
        recommendationObservations.citationTrailbase,
        recommendationObservations.thirdPartyGpt
      ]), { includeCitation: true })
    }), activeRepresentative([recommendationObservations.citationResearch, recommendationObservations.thirdPartyGpt]), reportBase),
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "observation-type",
      title: "料金・導入期間の公式事実差分",
      summary: "AI回答の記述と公式事実台帳を項目単位で照合し、不一致がある回答を数えています。",
      facts: [
        { label: "データ種別", value: "回答と公式事実の照合" },
        { label: "不一致", value: "6回答", tone: "red" },
        { label: "対象項目", value: "料金 / 導入期間" },
        { label: "照合単位", value: "回答内の主張 × 公式事実項目" }
      ],
      comparison: {
        columns: ["差分区分", "回答", "確認元"],
        rows: [["旧料金プラン", "3件", "公式料金ページ"], ["導入期間の断定", "2件", "公式導入案内"], ["更新前URL", "1件", "公式事実台帳"]]
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.factPricing,
        recommendationObservations.factImplementation
      ]), { includeCitation: true, includeOfficial: true, resultLabel: "公式事実との差" })
    }), activeRepresentative([recommendationObservations.factPricing, recommendationObservations.factImplementation]), reportBase),
    recommendationEvidenceDetail(recommendationRowDetail({
      kind: "observation-type",
      title: "同じ判定が続いた観測日数",
      summary: "一時的な変化と分けるため、同じ固定質問・同じAIモデルで判定が連続した日数を示します。",
      facts: [
        { label: "データ種別", value: "日次判定の継続性" },
        { label: "最長継続", value: "14日", tone: "green" },
        { label: "実行頻度", value: "毎日1回" },
        { label: "比較単位", value: "固定質問 × AIモデル" }
      ],
      comparison: {
        columns: ["判定", "組み合わせ", "最長継続"],
        rows: continuityComparisonRows
      },
      trace: recommendationObservationTrace(activeObservations([
        recommendationObservations.matchupStart,
        recommendationObservations.matchupGpt
      ]), { resultLabel: "日次判定" })
    }), activeRepresentative([recommendationObservations.matchupStart, recommendationObservations.matchupGpt]), reportBase)
  ];

  const classifiedActions = [
    { id: "r01", category: "既存ページ改善", priority: "高", title: "競合比較ページに選定基準表を追加", target: "/compare/geo-tools", evidence: "比較検討プロンプトでTrailbaseが先行" },
    { id: "r02", category: "新規ページ作成", priority: "高", title: "引用されやすい調査データページを新規作成", target: "新規ページ", evidence: "自社未引用の高重要度プロンプトが残る" },
    { id: "r03", category: "既存ページ改善", priority: "中", title: "料金と導入期間の説明を最新化", target: "/pricing", evidence: "Branded回答で古い説明が出る" },
    { id: "r04", category: "既存ページ改善", priority: "高", title: "比較ページに導入条件の一覧を追加", target: "/compare", evidence: "導入条件を求める質問で競合が先行" },
    { id: "r05", category: "既存ページ改善", priority: "高", title: "機能ページに対象ユーザー別の利用例を追加", target: "/features", evidence: "利用場面の説明が第三者記事に置き換わる" },
    { id: "r06", category: "既存ページ改善", priority: "高", title: "料金ページに更新日と適用条件を明記", target: "/pricing", evidence: "料金条件の回答差分が継続" },
    { id: "r07", category: "既存ページ改善", priority: "高", title: "導入ガイドに初期設定の手順を追加", target: "/guide", evidence: "導入手順で自社ページが引用されない" },
    { id: "r08", category: "既存ページ改善", priority: "中", title: "競合比較ページに判断軸別FAQを追加", target: "/compare/geo-tools", evidence: "比較質問で選定理由が不足" },
    { id: "r09", category: "既存ページ改善", priority: "中", title: "調査方法を説明するページを整備", target: "/research/methodology", evidence: "調査条件を第三者ソースへ依存" },
    { id: "r10", category: "既存ページ改善", priority: "中", title: "事例ページに業種・規模の条件を追加", target: "/cases", evidence: "導入事例の具体性で競合が先行" },
    { id: "r11", category: "新規ページ作成", priority: "中", title: "製品概要のカテゴリ定義を統一", target: "/product", evidence: "モデル間で製品カテゴリの説明が揺れる" },
    { id: "r12", category: "新規ページ作成", priority: "中", title: "サポート範囲と対応時間を明記", target: "/support", evidence: "サポート条件の説明が欠落" },
    { id: "r13", category: "新規ページ作成", priority: "中", title: "セキュリティ情報の一次資料を追加", target: "/security", evidence: "信頼性質問で第三者ページのみ引用" },
    { id: "r14", category: "第三者掲載・引用獲得", priority: "低", title: "業界メディアに専門家コメントの掲載を依頼", target: "業界メディア", evidence: "専門家評価を求める回答で自社への言及がない" },
    { id: "r15", category: "第三者掲載・引用獲得", priority: "低", title: "比較・レビューサイトの製品情報を最新化", target: "第三者比較サイト", evidence: "第三者比較記事で旧情報が引用される" },
    { id: "r16", category: "第三者掲載・引用獲得", priority: "低", title: "顧客レビュー・パートナー導入事例の掲載を依頼", target: "顧客・連携パートナー", evidence: "利用実績の回答で第三者評価が不足" },
    { id: "r17", category: "計測条件・定義確認", priority: "低", title: "自社・製品名の照合語を確認", target: "計測設定", evidence: "別表記の回答で自社掲載判定が揺れる" },
    { id: "r18", category: "計測条件・定義確認", priority: "低", title: "固定質問の分類と重要度を確認", target: "質問集合", evidence: "ペルソナ・トピック分類に確認事項が残る" }
  ] as const;
  const classificationPriorityOrder = { "高": 0, "中": 1, "低": 2 } as const;

  const actionClassifications = [
    {
      label: "既存ページ改善",
      count: 9,
      high: 5,
      medium: 4,
      low: 0,
      purpose: "現在あるURLの内容・構造を改善する",
      segmentClass: "bg-[#075E44]",
      criteria: [
        { title: "分類条件", meta: "既存URLを変更", description: "現在公開されているページの情報・構造・更新内容を直す候補です。" },
        { title: "顧客が確認すること", meta: "対象ページと対象指標", description: "どのURLを直し、同じ観測条件で何を比較するかを確認します。" }
      ]
    },
    {
      label: "新規ページ作成",
      count: 4,
      high: 1,
      medium: 3,
      low: 0,
      purpose: "既存ページで受け止められない需要へ対応する",
      segmentClass: "bg-[#3F8F7A]",
      criteria: [
        { title: "分類条件", meta: "新しいURLを作成", description: "既存ページでは質問需要を受け止められない場合の候補です。" },
        { title: "顧客が確認すること", meta: "需要の重なりと受け皿", description: "既存ページとの重複と、新しいページで扱う範囲を確認します。" }
      ]
    },
    {
      label: "第三者掲載・引用獲得",
      count: 3,
      high: 0,
      medium: 0,
      low: 3,
      purpose: "自社以外の評価・引用経路を増やす",
      segmentClass: "bg-[#B7862B]",
      criteria: [
        { title: "分類条件", meta: "第三者の掲載・評価経路", description: "自社ページの改修ではなく、外部での掲載や引用獲得を扱う候補です。" },
        { title: "顧客が確認すること", meta: "参照元と引用回答", description: "どの第三者経路が不足し、引用回答数がどう変わるかを確認します。" }
      ]
    },
    {
      label: "計測条件・定義確認",
      count: 2,
      high: 0,
      medium: 0,
      low: 2,
      purpose: "指標・判定・公式事実の前提を確認する",
      segmentClass: "bg-[#69786F]",
      criteria: [
        { title: "分類条件", meta: "計測や判定の前提", description: "施策実行ではなく、指標定義・判定条件・公式事実を確認する候補です。" },
        { title: "顧客が確認すること", meta: "条件と変更履歴", description: "表示値の前提と、定義を変更した場合の影響範囲を確認します。" }
      ]
    }
  ].map((item) => ({
    ...item,
    actions: classifiedActions
      .filter((action) => action.category === item.label)
      .sort((left, right) => classificationPriorityOrder[left.priority] - classificationPriorityOrder[right.priority] || left.id.localeCompare(right.id))
  }));
  const classificationTotal = actionClassifications.reduce((sum, item) => sum + item.count, 0);
  return (
    <>
      <DataRichPanel
        id="recommendation-classification"
        title="改善アクション18件の分類"
        description="18件を重複しない主分類で整理し、構成比と優先度の偏りを比較します。"
        bodyClassName="p-0"
      >
        <div className="border-b border-[#DDE5E1] bg-[#FBFCFB] px-4 py-5 sm:px-5">
          <div className="flex h-5 w-full overflow-hidden rounded-full bg-[#E7EEEA]" role="img" aria-label="既存ページ改善9件、新規ページ作成4件、第三者掲載・引用獲得3件、計測条件・定義確認2件">
            {actionClassifications.map((item) => (
              <span key={item.label} className={item.segmentClass} style={{ width: (item.count / classificationTotal * 100) + "%" }} title={item.label + " " + item.count + "件"} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {actionClassifications.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#475467]">
                <span className={"h-2.5 w-2.5 rounded-full " + item.segmentClass} aria-hidden="true" />
                <span>{item.label}</span>
                <span className="font-bold tabular-nums text-[#101828]">{item.count}件</span>
              </span>
            ))}
          </div>
        </div>
        <div role="list" className="divide-y divide-[#DDE5E1] bg-white">
          {actionClassifications.map((item) => {
            const share = Math.round(item.count / classificationTotal * 100);
            const priorities = [
              { label: "高", value: item.high, tone: "border-[#F3B4AE] bg-[#FFF1F0] text-[#B42318]" },
              { label: "中", value: item.medium, tone: "border-[#E8C88C] bg-[#FFF8E7] text-[#8A4B08]" },
              { label: "低", value: item.low, tone: "border-[#D7DCE5] bg-[#F7F8FA] text-[#475467]" }
            ].filter((priority) => priority.value > 0);
            const detail: ReportDetailPayload = {
              kicker: "改善アクションの主分類",
              title: item.label,
              value: item.count + "件・全体の" + share + "%",
              summary: item.purpose + "分類です。1つの改善候補はこの主分類のいずれか1つだけに計上します。",
              sections: [
                {
                  title: "該当する改善アクション " + item.actions.length + "件",
                  description: "優先度の高い順に、施策名・対象・観測根拠を確認できます。",
                  variant: "trace",
                  items: item.actions.map((action) => ({
                    title: action.title,
                    meta: "優先度 " + action.priority + " ・ 対象 " + action.target,
                    description: "観測根拠：" + action.evidence,
                    href: reportBase + "/recommendations/" + action.id + "?return=" + encodeURIComponent(reportBase + "/recommendations#recommendation-classification"),
                    linkLabel: "施策の分析を見る"
                  }))
                },
                {
                  title: "分類サマリー",
                  facts: [
                    { label: "改善アクション", value: item.count + "件" },
                    { label: "全18件に占める割合", value: share + "%" },
                    ...(item.high > 0 ? [{ label: "優先度 高", value: item.high + "件" }] : []),
                    ...(item.medium > 0 ? [{ label: "優先度 中", value: item.medium + "件" }] : []),
                    ...(item.low > 0 ? [{ label: "優先度 低", value: item.low + "件" }] : [])
                  ]
                },
                {
                  title: "この分類で見ること",
                  items: item.criteria
                }
              ]
            };

            return (
              <article key={item.label} role="listitem">
                <ReportDetailButton detail={detail} showIcon={false} className="w-full rounded-none px-4 py-4 hover:bg-[#F4F8F6] sm:px-5">
                  <span className="grid w-full min-w-0 gap-4 text-left lg:grid-cols-[minmax(240px,1fr)_minmax(140px,.5fr)_minmax(260px,.9fr)_minmax(280px,1.1fr)] lg:items-center">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={"h-3 w-3 shrink-0 rounded-full " + item.segmentClass} aria-hidden="true" />
                      <span className="min-w-0"><span className="block text-[14px] font-bold text-[#0F172A]">{item.label}</span><span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#075E44]">内訳を見る</span></span>
                    </span>
                    <span className="min-w-0"><span className="block text-[24px] font-bold tabular-nums text-[#0B382D]">{item.count}<span className="ml-1 text-[11px]">件</span></span><span className="block text-[10px] font-semibold text-[#667085]">全体の {share}%</span></span>
                    <span className="flex flex-wrap gap-2">
                      {priorities.map((priority) => <span key={priority.label} className={"inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold " + priority.tone}>優先度 {priority.label} {priority.value}件</span>)}
                    </span>
                    <span className="min-w-0 text-[12px] font-semibold leading-5 text-[#475467]">{item.purpose}</span>
                  </span>
                </ReportDetailButton>
              </article>
            );
          })}
        </div>
        <p className="border-t border-[#DDE5E1] bg-[#F8FAF9] px-4 py-3 text-[11px] font-semibold leading-5 text-[#667085] sm:px-5">合計18件。ここでは1候補を1分類だけに計上します。コンテンツギャップなどの横断分析では、同じ候補が複数箇所に現れます。</p>
      </DataRichPanel>
      <div id="recommendation-evidence-verification" className="scroll-mt-28">
        <DataRichPanel title="上位3施策の根拠確認" description="優先度は実施順、根拠強度は観測の確からしさです。根拠の対象は観測と回答で単位が異なるため、件数の大小を直接比較しません。">
          <div className="max-w-full overflow-hidden border border-[#DDE5E1] bg-white">
            <div className="hidden border-b border-[#DDE5E1] bg-[#F5F8F6] px-5 py-3 text-[11px] font-bold tracking-[0.04em] text-[#667085] xl:grid xl:grid-cols-[68px_minmax(180px,1.1fr)_108px_148px_minmax(170px,.9fr)_180px] xl:items-center xl:gap-4">
              <span>優先度</span>
              <span>改善アクション</span>
              <span>根拠強度</span>
              <span>根拠の対象</span>
              <span>実施後の確認方法</span>
              <span>操作</span>
            </div>
            {[
              { priority: "高", priorityTone: "red" as const, title: "競合比較ページに選定基準表を追加", target: "/compare/geo-tools", strength: "高", observations: "42観測", models: activeModelCountLabel(["GPT", "Gemini", "Perplexity"]), continuation: "14日", basis: "質問×モデル×日", method: "同一質問の掲載位置・引用元を比較", id: "r01" },
              { priority: "高", priorityTone: "red" as const, title: "引用されやすい調査データページを新規作成", target: "/research", strength: "中", observations: "28観測", models: activeModelCountLabel(["GPT", "Perplexity"]), continuation: "11日", basis: "質問×モデル×日", method: "自社引用と引用置換を比較", id: "r02" },
              { priority: "中", priorityTone: "amber" as const, title: "料金と導入期間の説明を最新化", target: "/pricing", strength: "高", observations: "6回答", models: activeModelCountLabel(["GPT", "Gemini"]), continuation: "14日", basis: "AI回答", method: "公式事実差分を確認", id: "r03" }
            ].map((item, index) => (
              <article key={item.id} className="border-b border-[#DDE5E1] last:border-b-0">
                <div className="grid min-w-0 gap-4 px-4 py-5 sm:grid-cols-2 sm:items-start sm:px-5 xl:grid-cols-[68px_minmax(180px,1.1fr)_108px_148px_minmax(170px,.9fr)_180px] xl:items-center">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold text-[#667085] xl:hidden">優先度</span>
                    <DataRichBadge tone={item.priorityTone}>{item.priority}</DataRichBadge>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-[14px] font-bold leading-6 text-[#101828]">{item.title}</p>
                    <p className="mt-0.5 break-all text-[12px] font-semibold leading-5 text-[#667085]">対象 {item.target}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#667085] xl:hidden">根拠強度</p>
                    <div className="mt-1 flex items-center gap-2" aria-label={"根拠強度 " + item.strength}>
                      <span className="text-[13px] font-bold text-[#0B382D]">{item.strength}</span>
                      <span className="flex gap-1" aria-hidden="true">
                        {[0, 1, 2].map((step) => (
                          <span key={step} className={"h-1.5 w-4 rounded-full " + (step < (item.strength === "高" ? 3 : item.strength === "中" ? 2 : 1) ? "bg-[#0B6B53]" : "bg-[#DDE5E1]")} />
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#667085] xl:hidden">根拠の対象</p>
                    <p className="mt-1 text-[13px] font-bold tabular-nums text-[#101828]">{item.observations}</p>
                    <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#667085]">{item.models} ・ {item.continuation}継続</p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#667085]">集計単位 {item.basis}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#667085] xl:hidden">実施後の確認方法</p>
                    <p className="mt-1 break-words text-[13px] font-semibold leading-5 text-[#344054]">{item.method}</p>
                  </div>
                  <div className="flex flex-nowrap items-center gap-2 sm:justify-end xl:justify-end">
                    <ReportDetailButton detail={candidateDetails[index]} className="min-h-10 rounded-md bg-[#0B382D] px-3 text-[12px] font-bold text-white transition hover:bg-[#075E44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">根拠を見る</ReportDetailButton>
                    <Link href={reportBase + "/recommendations/" + item.id + "?return=" + encodeURIComponent(reportBase + "/recommendations#recommendation-evidence-verification")} className="inline-flex min-h-10 items-center justify-center rounded-md px-2 text-[12px] font-bold text-[#075E44] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">施策詳細</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </DataRichPanel>
      </div>
      <div id="opportunity-matrix-analysis" className="scroll-mt-28">
        <DataRichPanel title="改善領域の機会マトリクス" description="個別施策ではなく、改善対象の5領域を比較します。点数は領域間の相対評価であり、施策の実施順や改善幅の予測ではありません。">
          <RecommendationOpportunityMatrix reportBase={reportBase} models={models} />
        </DataRichPanel>
      </div>
      <DataRichPanel id="recommendation-evidence-type-matrix" title="改善領域を支える観測タイプ" description="どの改善領域が、競合先行・引用不足・公式情報との差・継続性のどの観測に基づくかを確認します。上段は全体量、下段は領域との関係です。">
        <RecommendationEvidenceTypeMatrix details={evidenceTypeDetails} reportBase={reportBase} models={models} />
      </DataRichPanel>
    </>
  );
}

type RecommendationDetailSeed = {
  id: string;
  name: string;
  priority: string;
  target: string;
  targetKind: string;
  modelCount: number;
  observationCount: number;
  continuationDays: number;
  reason: string;
  metrics: readonly [string, string, string];
  questionId: string;
  comparator: string;
  comparatorUrl: string;
  citationCount: number;
  citationOwnership: string;
  personas: string;
  personaObservationCount: number;
  topics: string;
  topicObservationCount: number;
  primaryChange: string;
  beforeState: string;
  acceptanceState: string;
  implementationItems: readonly [
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string]
  ];
};

export type RecommendationDetailMetadata = {
  priority?: string;
  target?: string;
  metric?: string | readonly string[];
  evidence?: string;
  impact?: string;
  category?: string;
};

const recommendationDetailSeeds: Record<string, RecommendationDetailSeed> = {
  r01: {
    id: "r01",
    name: "競合比較ページに選定基準表を追加",
    priority: "高",
    target: "/compare/geo-tools",
    targetKind: "既存ページ改善",
    modelCount: 3,
    observationCount: 42,
    continuationDays: 14,
    reason: "比較検討プロンプトでTrailbaseが先行し、競合ページだけが選定基準として引用されている",
    metrics: ["AI表示率", "平均掲載位置", "公式サイト引用率"],
    questionId: "Q-034",
    comparator: "Trailbase",
    comparatorUrl: "trailbase.io/compare/geo-tools",
    citationCount: 21,
    citationOwnership: "競合公式",
    personas: "決裁者 / マーケ責任者",
    personaObservationCount: 31,
    topics: "競合比較 / 料金",
    topicObservationCount: 36,
    primaryChange: "対象読者別の選定基準・機能差・根拠URLを追加",
    beforeState: "選定基準を競合側だけで確認",
    acceptanceState: "読者別の判断軸と一次根拠を同じ表に表示",
    implementationItems: [
      ["読者別の選定基準を追加", "決裁者・運用担当・編集担当の違いを説明"],
      ["比較根拠を明示", "各項目に公式URLまたは一次根拠を紐付け"],
      ["料金・導入期間を更新", "公式事実台帳と同じ表現・更新日を表示"],
      ["AIが抜き出せる要約を追加", "見出し・表・短い回答で内容が一致"]
    ]
  },
  r02: {
    id: "r02",
    name: "引用されやすい調査データページを新規作成",
    priority: "高",
    target: "新規調査ページ",
    targetKind: "新規ページ作成",
    modelCount: 2,
    observationCount: 28,
    continuationDays: 11,
    reason: "自社未引用の高重要度プロンプトで、第三者調査ページだけが根拠として引用されている",
    metrics: ["公式サイト引用率", "AI表示率", "引用元シェア"],
    questionId: "Q-088",
    comparator: "marketing-ai.jp",
    comparatorUrl: "marketing-ai.jp/research/ai-search-2026",
    citationCount: 12,
    citationOwnership: "第三者メディア",
    personas: "編集担当 / マーケ責任者",
    personaObservationCount: 22,
    topics: "引用元 / 改善施策",
    topicObservationCount: 24,
    primaryChange: "調査方法・母数・更新日・一次データを備えた調査ページを新規作成",
    beforeState: "自社に引用可能な調査データページがない",
    acceptanceState: "調査条件・数値定義・更新日・根拠URLを同じページに表示",
    implementationItems: [
      ["調査テーマと対象範囲を定義", "対象市場・期間・質問集合を明示"],
      ["調査方法と数値定義を掲載", "母数・分母・除外条件を指標ごとに表示"],
      ["一次データ表を公開", "要約値から根拠データを確認できる"],
      ["引用可能な要約と更新情報を追加", "見出し・要約・更新日・一次根拠が一致"]
    ]
  },
  r03: {
    id: "r03",
    name: "料金と導入期間の説明を最新化",
    priority: "中",
    target: "/pricing",
    targetKind: "既存ページ改善",
    modelCount: 2,
    observationCount: 6,
    continuationDays: 14,
    reason: "Branded回答で旧プランの料金と確認不能な導入期間が継続して説明されている",
    metrics: ["公式事実差分", "ブランド認識", "回答正確性"],
    questionId: "Q-012",
    comparator: "旧情報参照元",
    comparatorUrl: "old-media.example/pricing",
    citationCount: 5,
    citationOwnership: "第三者メディア",
    personas: "決裁者 / 導入担当",
    personaObservationCount: 6,
    topics: "料金 / 導入・運用",
    topicObservationCount: 6,
    primaryChange: "現行プランの料金条件・導入工程・最終確認日を公式事実と同じ表現に更新",
    beforeState: "旧料金表現と確認不能な導入期間が残る",
    acceptanceState: "料金・導入期間・更新日が公式事実台帳と一致",
    implementationItems: [
      ["現行プラン名と料金条件を明示", "旧プラン名・旧金額が残っていない"],
      ["導入開始までの工程を整理", "確定している工程と個別条件を分けて表示"],
      ["公式事実台帳と同期", "料金・導入期間・URLの不一致がない"],
      ["最終確認日と要約を追加", "見出し・料金表・短い回答で内容が一致"]
    ]
  }
};

function resolveRecommendationDetailSeed(recommendationId?: string, recommendationName?: string): RecommendationDetailSeed | null {
  const known = recommendationId ? recommendationDetailSeeds[recommendationId] : undefined;
  if (known) return recommendationName ? { ...known, name: recommendationName } : known;
  return null;
}

type GeneratedRecommendationDetail = {
  name: string;
  priority: string;
  target: string;
  metric: string;
  evidence: string;
  impact: string;
  category: string;
  impactParts: readonly string[];
  implementationItems: readonly (readonly [string, string])[];
  completionConditions: readonly (readonly [string, string])[];
};

function normalizeRecommendationMetadata(
  recommendationId: string | undefined,
  recommendationName: string | undefined,
  metadata: RecommendationDetailMetadata | undefined
): GeneratedRecommendationDetail {
  const name = recommendationName?.trim() || `改善候補 ${recommendationId ?? ""}`.trim();
  const target = metadata?.target?.trim() || "関連する自社コンテンツ";
  const metricValue = metadata?.metric;
  const metric = typeof metricValue === "string"
    ? metricValue.trim()
    : metricValue?.filter(Boolean).join(" / ") || "AI検索での回答品質";
  const evidence = metadata?.evidence?.trim()
    || `${name}に関係する回答・引用元の差が、レポート内の観測で確認されています。`;
  const impact = metadata?.impact?.trim() || "関連する固定質問の観測範囲";
  const inferredCategory = /新規|公開|作成/.test(name) && !/^\//.test(target)
    ? "新規ページ作成"
    : /^\//.test(target)
      ? "既存ページ改善"
      : "コンテンツ改善";
  const category = metadata?.category?.trim() || inferredCategory;
  const isNewPage = /新規|作成/.test(category);
  const impactParts = impact.split("/").map((part) => part.trim()).filter(Boolean);
  const implementationItems = [
    [
      "対象と不足情報を整理",
      `${target}について、提案の根拠となった「${evidence}」と現在の掲載内容を照合する`
    ],
    [
      isNewPage ? "ページの役割と構成を設計" : "対象コンテンツを更新",
      `${name}を実施し、${metric}の判断に必要な情報を見出し・本文・表で一貫して示す`
    ],
    [
      "根拠と更新情報を明示",
      "主張ごとに公式情報または一次資料を紐付け、参照先と最終更新日を同じページで確認できるようにする"
    ],
    [
      "公開内容の整合性を確認",
      "見出し・本文・表・要約の説明を揃え、同じ対象について異なる条件や表現を残さない"
    ]
  ] as const;
  const completionConditions = [
    ["対象", `${target}に「${name}」の内容が反映されている`],
    ["判断材料", `${metric}に関係する条件・比較軸・対象範囲がページ内で確認できる`],
    ["根拠", "掲載した主張を公式情報または一次資料まで辿って確認できる"],
    ["再観測", "公開後も同じ固定質問・同じAIモデルで変化を比較できる"]
  ] as const;

  return {
    name,
    priority: metadata?.priority?.trim() || "中",
    target,
    metric,
    evidence,
    impact,
    category,
    impactParts,
    implementationItems,
    completionConditions
  };
}

function GeneratedRecommendationDetailContent({
  recommendationId,
  recommendationName,
  metadata
}: {
  recommendationId?: string;
  recommendationName?: string;
  metadata?: RecommendationDetailMetadata;
}) {
  const recommendation = normalizeRecommendationMetadata(recommendationId, recommendationName, metadata);
  const observationImpact = recommendation.impactParts.find((part) => /観測|回答/.test(part)) || recommendation.impact;
  const modelImpact = recommendation.impactParts.find((part) => /モデル/.test(part)) || "契約モデル内";
  const continuityImpact = recommendation.impactParts.find((part) => /日|期間/.test(part)) || "選択期間内";

  return (
    <>
      <DataRichKpiStrip layout="rows" columns="xl:grid-cols-5" items={[
        { label: "優先度", value: recommendation.priority, helper: "影響・根拠・継続性から整理", note: "レポート掲載中", tone: recommendation.priority === "高" ? "red" : "amber" },
        { label: "提案区分", value: recommendation.category, helper: "実施対象の区分", note: recommendation.target },
        { label: "影響範囲", value: observationImpact, helper: "提案根拠に含まれる範囲", note: recommendation.impact },
        { label: "対象モデル", value: modelImpact, helper: "影響が確認されたモデル", note: "モデル別に再確認" },
        { label: "継続", value: continuityImpact, helper: "同じ状態が続いた期間", note: "欠測を除外" }
      ]} />
      <DataRichPanel title="対象・根拠・影響" description="この提案が何を対象にし、どの観測を理由に掲載されたかをまとめています。">
        <ReportDataTable columns={["項目", "内容"]} rows={[
          ["改善内容", recommendation.name],
          ["対象", recommendation.target],
          ["提案区分", recommendation.category],
          ["根拠", recommendation.evidence],
          ["影響範囲", recommendation.impact],
          ["確認指標", recommendation.metric]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="実施内容" description={`${recommendation.target}で行う作業を、実装時に確認できる単位へ分けています。`}>
        <ReportDataTable columns={["番号", "実施項目", "実施する内容"]} rows={recommendation.implementationItems.map((item, index) => [
          String(index + 1),
          item[0],
          item[1]
        ])} />
      </DataRichPanel>
      <DataRichPanel title="完了条件" description="施策の効果ではなく、実装が完了したと判断する条件です。">
        <ReportDataTable columns={["確認項目", "完了とする状態"]} rows={recommendation.completionConditions.map((item) => [item[0], item[1]])} />
      </DataRichPanel>
      <DataRichPanel title="実施後の確認方法" description="公開前後を同じ観測条件で比較し、施策による変化と断定せずに確認します。">
        <ReportDataTable columns={["確認対象", "比較方法", "見る内容", "注意"]} rows={[
          [recommendation.metric, "同じ固定質問 × 同じAIモデル", "実施前後の値とモデル別内訳", "失敗・欠測を分母に含めない"],
          ["回答内容", "対象質問の回答本文を前後比較", "掲載内容・説明順・事実差分", "回答全文と判定根拠を確認する"],
          ["引用元", "回答内の正規化URLを前後比較", "自社・競合・第三者の参照先", "掲載と引用を別々に扱う"],
          ["継続性", "公開後の日次観測で確認", "一時変動か継続変化か", "改善幅や因果を保証しない"]
        ]} />
      </DataRichPanel>
    </>
  );
}

export function RecommendationDetailContent({
  reportBase,
  models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"],
  recommendationId,
  recommendationName,
  recommendation: recommendationMetadata
}: {
  reportBase: string;
  models?: string[];
  recommendationId?: string;
  recommendationName?: string;
  recommendation?: RecommendationDetailMetadata;
}) {
  const recommendation = resolveRecommendationDetailSeed(recommendationId, recommendationName);
  if (!recommendation) {
    return (
      <GeneratedRecommendationDetailContent
        recommendationId={recommendationId}
        recommendationName={recommendationName}
        metadata={recommendationMetadata}
      />
    );
  }
  const implementationItem = (index: 0 | 1 | 2 | 3) => recommendation.implementationItems[index];
  const candidateSubjectObservations: readonly RecommendationObservation[] = recommendation.id === "r02"
    ? [recommendationObservations.citationResearch, recommendationObservations.thirdPartyGpt, recommendationObservations.ownCitation]
    : recommendation.id === "r03"
      ? [recommendationObservations.factPricing, recommendationObservations.factImplementation, recommendationObservations.citationResearch]
      : [recommendationObservations.matchupGpt, recommendationObservations.matchupGemini, recommendationObservations.matchupPerplexity];
  const candidateModelNames = Array.from(new Set(candidateSubjectObservations.map((observation) => observation.model))).slice(0, recommendation.modelCount);
  const candidateModelSet = new Set(candidateModelNames);
  const selectedModels = models.filter((model) => candidateModelSet.has(model));
  const selectedModelSet = new Set(selectedModels);
  const subjectObservations = candidateSubjectObservations.filter((observation) => selectedModelSet.has(observation.model));
  const scopedModelCount = selectedModels.length;

  const pageImprovementDetails = recommendationTableRowDetails([
    recommendationRowDetail({
      kind: "implementation-spec",
      title: `改善内容：${recommendation.name}`,
      summary: `${recommendation.target}で実施する内容と、実装完了を判定する条件を確認します。`,
      facts: [
        { label: "対象", value: recommendation.target },
        { label: "追加・更新するもの", value: recommendation.primaryChange },
        { label: "ページ区分", value: recommendation.targetKind },
        { label: "効果保証", value: "なし" }
      ],
      comparison: {
        columns: ["確認項目", "現在", "受入条件"],
        rows: [
          ["主な課題", recommendation.beforeState, recommendation.acceptanceState],
          ["根拠", "回答・引用元に分散", "判断項目ごとに一次根拠を表示"],
          ["対象", recommendation.target, recommendation.targetKind === "新規ページ作成" ? "公開URLを確定して新規作成" : "URLを変えずに更新"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations.slice(0, 2), { includeCitation: true, includeOfficial: recommendation.id === "r03" })
    }),
    recommendationRowDetail({
      kind: "page-improvement",
      title: `必要な理由：${recommendation.reason}`,
      summary: `${recommendation.questionId}を含む固定質問で観測された回答・引用URL・公式事実の差だけを、この候補の根拠として扱います。`,
      facts: [
        { label: "影響観測", value: `${recommendation.observationCount}観測`, tone: "amber" },
        { label: "継続", value: `${recommendation.continuationDays}日` },
        { label: "対象質問", value: recommendation.questionId },
        { label: "主な参照URL", value: recommendation.comparatorUrl }
      ],
      comparison: {
        columns: ["観測", "Recora", recommendation.comparator],
        rows: [
          ["対象情報", recommendation.beforeState, "回答・引用元で確認"],
          ["判断材料", "不足または古い", recommendation.comparatorUrl],
          ["受入後", recommendation.acceptanceState, "同じ条件で再観測"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations, { includeCitation: true, includeOfficial: recommendation.id === "r03" })
    }),
    recommendationRowDetail({
      kind: "metric-definition",
      title: "対象指標：3指標を別々に追う",
      summary: "AI表示率・平均掲載位置・公式サイト引用率は分母と判定が異なるため、合算せず個別に比較します。",
      facts: [
        { label: recommendation.metrics[0], value: "同じ固定質問・同じモデルで前後比較" },
        { label: recommendation.metrics[1], value: "対象回答内の変化を個別集計" },
        { label: recommendation.metrics[2], value: "回答・引用・事実差分を分離して確認" },
        { label: "除外", value: "失敗・欠測" }
      ],
      comparison: {
        columns: ["指標", "実施前後で固定", "別扱いにするもの"],
        rows: [
          [recommendation.metrics[0], "質問集合・AIモデル", "欠測・失敗"],
          [recommendation.metrics[1], "対象と判定定義", "別指標の変化"],
          [recommendation.metrics[2], "URL・公式事実・有効回答", "因果推定"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations, { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: "指標へ反映した観測" })
    }),
    null
  ]);
  const citationScopeDetails = recommendationTableRowDetails([
    recommendationRowDetail({
      kind: "model-scope",
      title: `対象モデル：契約内${scopedModelCount}モデル`,
      summary: `${recommendation.observationCount}観測をAIモデル別に分け、同じ固定質問の回答だけを比較対象にしています。`,
      facts: [
        { label: "対象モデル", value: selectedModels.join(" / ") },
        { label: "対象観測", value: `${recommendation.observationCount}観測` },
        { label: "比較単位", value: "AIモデル × 固定質問 × 観測日" },
        { label: "モデル横断平均", value: "使用しない" }
      ],
      comparison: {
        columns: ["AIモデル", "対象", "観測例"],
        rows: selectedModels.map((model) => [model, "対象", subjectObservations.find((observation) => observation.model === model)?.id || recommendation.questionId])
      },
      trace: recommendationObservationTrace(subjectObservations, { includeCitation: true, includeOfficial: recommendation.id === "r03" })
    }),
    recommendationRowDetail({
      kind: "persona-scope",
      title: `対象ペルソナ：${recommendation.personas}`,
      summary: `固定質問に登録されたペルソナタグで${recommendation.personaObservationCount}観測を分類した内訳です。`,
      facts: [
        { label: "対象ペルソナ", value: recommendation.personas },
        { label: "対象観測", value: `${recommendation.personaObservationCount}観測` },
        { label: "分類元", value: "固定質問メタデータ" },
        { label: "回答からの推定", value: "なし" }
      ],
      comparison: {
        columns: ["ペルソナ", "対象質問", "確認する内容"],
        rows: recommendation.personas.split(" / ").map((persona, index) => [persona, index === 0 ? recommendation.questionId : subjectObservations[1]?.promptId || recommendation.questionId, recommendation.topics])
      },
      trace: recommendationObservationTrace(subjectObservations, { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: "ペルソナ範囲へ含めた観測" })
    }),
    recommendationRowDetail({
      kind: "topic-scope",
      title: `対象トピック：${recommendation.topics}`,
      summary: `${recommendation.topics}に分類された${recommendation.topicObservationCount}観測について、質問と回答をトピック別に確認します。`,
      facts: [
        { label: "対象トピック", value: recommendation.topics },
        { label: "対象観測", value: `${recommendation.topicObservationCount}観測` },
        { label: "分類元", value: "固定質問メタデータ" },
        { label: "重複計上", value: "なし" }
      ],
      comparison: {
        columns: ["トピック", "固定質問", "観測例"],
        rows: recommendation.topics.split(" / ").map((topic, index) => [topic, subjectObservations[index]?.promptId || recommendation.questionId, subjectObservations[index]?.id || subjectObservations[0]?.id || recommendation.questionId])
      },
      trace: recommendationObservationTrace(subjectObservations, { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: "トピック範囲へ含めた観測" })
    }),
    recommendationRowDetail({
      kind: "citation-acquisition",
      title: `参照元：${recommendation.comparatorUrl}`,
      summary: `正規化した同一URLが回答内で使われた${recommendation.citationCount}件と、対応する回答箇所を確認します。`,
      facts: [
        { label: "正規化URL", value: recommendation.comparatorUrl },
        { label: "引用回答", value: `${recommendation.citationCount}回答` },
        { label: "所有区分", value: recommendation.citationOwnership },
        { label: "比較対象", value: "同一質問の自社掲載回答" }
      ],
      comparison: {
        columns: ["確認対象", recommendation.comparator, "自社掲載回答"],
        rows: [
          ["対象URL", "引用あり", "引用なし"],
          ["回答箇所", `${recommendation.topics}の記述に対応`, "対応する自社URLなし"],
          ["確認単位", "回答 × 正規化URL", "回答 × 正規化URL"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations.filter((item) => "citationUrl" in item && Boolean(item.citationUrl)).slice(0, 2), { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: "この参照元が使われた回答" })
    })
  ]);
  const implementationDetails = recommendationTableRowDetails([
    recommendationRowDetail({
      kind: "implementation-spec",
      title: `実施項目1：${implementationItem(0)[0]}`,
      summary: `${recommendation.target}で「${implementationItem(0)[1]}」を満たす状態を受入条件にします。`,
      facts: [
        { label: "データ区分", value: "表示仕様（観測値・効果予測ではない）" },
        { label: "対象", value: recommendation.target },
        { label: "実施項目", value: implementationItem(0)[0] },
        { label: "必要な状態", value: recommendation.acceptanceState },
        { label: "受入判定", value: implementationItem(0)[1] }
      ],
      comparison: {
        columns: ["項目", "現在", "受入条件"],
        rows: [
          ["対象", recommendation.target, recommendation.targetKind],
          ["現状", recommendation.beforeState, recommendation.acceptanceState],
          ["実施項目", implementationItem(0)[0], implementationItem(0)[1]]
        ]
      },
      trace: [
        { title: "対象確認", meta: recommendation.target },
        { title: "実装確認", meta: implementationItem(0)[0] },
        { title: "受入確認", meta: implementationItem(0)[1] }
      ]
    }),
    recommendationRowDetail({
      kind: "implementation-spec",
      title: `実施項目2：${implementationItem(1)[0]}`,
      summary: `${implementationItem(1)[0]}を実施し、「${implementationItem(1)[1]}」を確認します。`,
      facts: [
        { label: "データ区分", value: "根拠表示仕様（観測値・効果予測ではない）" },
        { label: "対象", value: recommendation.target },
        { label: "実施項目", value: implementationItem(1)[0] },
        { label: "許容する根拠", value: "公式URL / 一次資料 / 固定した観測" },
        { label: "受入判定", value: implementationItem(1)[1] }
      ],
      comparison: {
        columns: ["確認", "現在", "受入条件"],
        rows: [
          ["対象", recommendation.target, recommendation.targetKind],
          ["現状", recommendation.beforeState, recommendation.acceptanceState],
          ["実施項目", implementationItem(1)[0], implementationItem(1)[1]]
        ]
      },
      trace: [
        { title: "対象確認", meta: recommendation.target },
        { title: "実装確認", meta: implementationItem(1)[0] },
        { title: "受入確認", meta: implementationItem(1)[1] }
      ]
    }),
    recommendationRowDetail({
      kind: "implementation-spec",
      title: `実施項目3：${implementationItem(2)[0]}`,
      summary: `${implementationItem(2)[0]}を実施し、「${implementationItem(2)[1]}」を確認します。`,
      facts: [
        { label: "データ区分", value: "事実同期仕様（観測値・効果予測ではない）" },
        { label: "対象", value: recommendation.target },
        { label: "実施項目", value: implementationItem(2)[0] },
        { label: "確認元", value: recommendation.id === "r03" ? "公式事実台帳" : "一次根拠・観測条件" },
        { label: "受入判定", value: implementationItem(2)[1] }
      ],
      comparison: {
        columns: ["項目", "現在", "受入条件"],
        rows: [
          ["対象", recommendation.target, recommendation.targetKind],
          ["現状", recommendation.beforeState, recommendation.acceptanceState],
          ["実施項目", implementationItem(2)[0], implementationItem(2)[1]]
        ]
      },
      trace: [
        { title: "対象確認", meta: recommendation.target },
        { title: "実装確認", meta: implementationItem(2)[0] },
        { title: "受入確認", meta: implementationItem(2)[1] }
      ]
    }),
    recommendationRowDetail({
      kind: "implementation-spec",
      title: `実施項目4：${implementationItem(3)[0]}`,
      summary: `${implementationItem(3)[0]}を実施し、「${implementationItem(3)[1]}」を確認します。`,
      facts: [
        { label: "データ区分", value: "ページ構造仕様（観測値・効果予測ではない）" },
        { label: "対象", value: recommendation.target },
        { label: "実施項目", value: implementationItem(3)[0] },
        { label: "表示範囲", value: recommendation.acceptanceState },
        { label: "受入判定", value: implementationItem(3)[1] }
      ],
      comparison: {
        columns: ["表示", "役割", "受入条件"],
        rows: [
          ["対象", recommendation.target, recommendation.targetKind],
          ["現状", recommendation.beforeState, recommendation.acceptanceState],
          ["実施項目", implementationItem(3)[0], implementationItem(3)[1]]
        ]
      },
      trace: [
        { title: "対象確認", meta: recommendation.target },
        { title: "実装確認", meta: implementationItem(3)[0] },
        { title: "受入確認", meta: implementationItem(3)[1] }
      ]
    })
  ]);
  const measurementDetails = recommendationTableRowDetails([
    recommendationRowDetail({
      kind: "metric-definition",
      title: recommendation.metrics[0],
      summary: `${recommendation.metrics[0]}を、同一質問・同一AIモデル・同じ判定定義で実施前後に比較します。`,
      facts: [
        { label: "対象", value: `${recommendation.questionId}を含む固定質問` },
        { label: "集計", value: recommendation.metrics[0] },
        { label: "対象モデル", value: selectedModels.join(" / ") },
        { label: "欠測", value: "除外" }
      ],
      comparison: {
        columns: ["固定条件", "実施前", "実施後"],
        rows: [
          ["質問", recommendation.questionId, recommendation.questionId],
          ["AIモデル", "同一モデル", "同一モデル"],
          ["確認", recommendation.beforeState, recommendation.acceptanceState]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations.slice(0, 2), { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: `${recommendation.metrics[0]}へ反映した観測` })
    }),
    recommendationRowDetail({
      kind: "metric-definition",
      title: recommendation.metrics[1],
      summary: `${recommendation.metrics[1]}を有効回答単位で集計し、他の指標と合算せずに比較します。`,
      facts: [
        { label: "対象", value: recommendation.topics },
        { label: "集計", value: recommendation.metrics[1] },
        { label: "比較単位", value: "固定質問 × AIモデル × 観測日" },
        { label: "別指標", value: recommendation.metrics[0] }
      ],
      comparison: {
        columns: ["確認", "実施前", "実施後"],
        rows: [
          ["質問・AIモデル", "固定", "同じ条件"],
          ["対象", recommendation.beforeState, recommendation.acceptanceState],
          ["欠測", "分母から除外", "分母から除外"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations.slice(0, 2), { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: `${recommendation.metrics[1]}へ反映した観測` })
    }),
    recommendationRowDetail({
      kind: "metric-definition",
      title: recommendation.metrics[2],
      summary: `${recommendation.metrics[2]}を同一回答内で比較し、変化した観測と変化しなかった観測を分けます。`,
      facts: [
        { label: "比較単位", value: "同一質問・同一モデルの回答" },
        { label: "判定", value: recommendation.metrics[2] },
        { label: "比較対象", value: recommendation.comparator },
        { label: "因果判定", value: "しない" }
      ],
      comparison: {
        columns: ["遷移", "実施前", "実施後に確認"],
        rows: [
          ["対象", recommendation.target, recommendation.target],
          ["状態", recommendation.beforeState, recommendation.acceptanceState],
          ["集計", recommendation.metrics[2], "同じ定義で再集計"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations.slice(0, 2), { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: `${recommendation.metrics[2]}の判定` })
    }),
    recommendationRowDetail({
      kind: "metric-definition",
      title: "根拠・事実差分",
      summary: `${recommendation.name}の根拠となった回答・引用URL・公式事実を、実施後も同じ条件で照合します。`,
      facts: [
        { label: "照合単位", value: "回答 × 引用URL × 登録済み事実" },
        { label: "対象", value: recommendation.target },
        { label: "判定", value: "一致 / 欠落 / 古い / 矛盾 / 確認不能" },
        { label: "確認元", value: recommendation.id === "r03" ? "公式事実台帳" : "一次根拠と保存済み回答" }
      ],
      comparison: {
        columns: ["項目", "観測された回答", "公式事実"],
        rows: [
          ["対象", recommendation.beforeState, recommendation.acceptanceState],
          ["参照元", recommendation.comparatorUrl, "一次根拠を固定"],
          ["更新日", "観測日時を保持", "実施後の確認日を保持"]
        ]
      },
      trace: recommendationObservationTrace(subjectObservations.slice(0, 2), { includeCitation: true, includeOfficial: recommendation.id === "r03", resultLabel: "根拠・事実との差" })
    })
  ]);

  return (
    <>
      <DataRichKpiStrip layout="rows" columns="xl:grid-cols-5" items={[
        { label: "優先度", value: recommendation.priority, helper: "影響×根拠×継続", note: "レポート掲載中", tone: recommendation.priority === "高" ? "red" : "amber" },
        { label: "根拠強度", value: recommendation.observationCount >= 20 ? "高" : "中", helper: "複数観測で一致", note: `${recommendation.observationCount}観測` },
        { label: "対象モデル", value: `${scopedModelCount}モデル`, helper: "契約モデル内", note: selectedModels.join(" / ") },
        { label: "継続", value: `${recommendation.continuationDays}日`, helper: "同じ状態が継続", note: "欠測を除外" },
        { label: "対象ページ", value: recommendation.target, helper: recommendation.targetKind, note: recommendation.targetKind === "新規ページ作成" ? "公開URLは実装時に確定" : "既存URLを維持" }
      ]} />
      <DataRichPanel title="何を直すか・なぜ今必要か" description={`${recommendation.name}の提案本文と観測根拠を分離して表示します。`}>
        <ReportDataTable rowDetails={pageImprovementDetails} columns={["項目","内容"]} rows={[
          ["改善内容", recommendation.primaryChange],
          ["必要な理由", recommendation.reason],
          ["対象指標", recommendation.metrics.join(" / ")],
          ["断定しないこと","実施による改善幅や因果は事前に保証しない"]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="影響範囲" description="対象モデル・ペルソナ・トピック・質問・引用元を省略せず表示します。">
        <ReportDataTable rowDetails={citationScopeDetails} columns={["軸","対象","観測数","根拠"]} rows={[
          ["モデル", selectedModels.join(" / "), `${recommendation.observationCount}観測`, `${scopedModelCount}モデルの内訳`],
          ["ペルソナ", recommendation.personas, `${recommendation.personaObservationCount}観測`, "ペルソナ別内訳"],
          ["トピック", recommendation.topics, `${recommendation.topicObservationCount}観測`, "トピック別内訳"],
          ["参照元", recommendation.comparatorUrl, `${recommendation.citationCount}回答`, "URL・回答内訳"]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="実施内容" description={`${recommendation.targetKind}の受入条件を明確にします。`}>
        <ReportDataTable rowDetails={implementationDetails} columns={["番号","実施項目","受入条件"]} rows={[
          ["1", implementationItem(0)[0], implementationItem(0)[1]],
          ["2", implementationItem(1)[0], implementationItem(1)[1]],
          ["3", implementationItem(2)[0], implementationItem(2)[1]],
          ["4", implementationItem(3)[0], implementationItem(3)[1]]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="実施後の確認方法" description="同じ固定質問と契約モデルで前後比較し、構成差と欠測を分離します。">
        <ReportDataTable rowDetails={measurementDetails} columns={["確認項目","比較方法","成功の見方","注意"]} rows={[
          [recommendation.metrics[0], "同一質問×同一モデル", "同じ定義での前後差", "欠測を混ぜない"],
          [recommendation.metrics[1], "同一回答群", recommendation.acceptanceState, `他の${recommendation.metrics[0]}と別に確認`],
          [recommendation.metrics[2], `Recora・${recommendation.comparator}の同一回答`, "不利な観測の減少", "因果と断定しない"],
          ["根拠・事実差分", "同じ質問・参照元", "欠落・古い・矛盾の解消", "回答全文と引用元を確認"]
        ]} />
      </DataRichPanel>
    </>
  );
}
