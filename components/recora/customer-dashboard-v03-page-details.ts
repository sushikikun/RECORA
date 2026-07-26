import type { ReportDetailPayload } from "@/components/recora/report-ui/report-detail-drawer";

export type CustomerPageKpiDetailKey =
  | "prompt-total"
  | "prompt-review"
  | "prompt-sentiment"
  | "answer-expected"
  | "answer-listed"
  | "answer-unlisted"
  | "answer-missing"
  | "answer-verification"
  | "citation-total"
  | "citation-owned"
  | "citation-third-party"
  | "citation-domains"
  | "perception-positive"
  | "perception-neutral"
  | "perception-negative"
  | "perception-risk"
  | "recommendation-total"
  | "recommendation-priority"
  | "recommendation-existing"
  | "recommendation-new";

export type CustomerAnswerModelBreakdown = {
  modelName: string;
  listed: number;
  firstPosition: number;
  secondToThirdPosition: number;
  bodyMention: number;
  unlisted: number;
  missing: number;
  verificationAttention: number;
  unlistedTopic?: string;
  leadingCompetitor?: string;
  missingReason?: string;
  verificationReason?: string;
};

export type CustomerSentimentCounts = {
  valid: number;
  positive: number;
  neutral: number;
  negative: number;
};

export type CustomerSentimentModelBreakdown = {
  modelName: string;
  all: CustomerSentimentCounts;
  branded: CustomerSentimentCounts;
};

export type CustomerSentimentSummary = {
  days: number;
  all: CustomerSentimentCounts;
  branded: CustomerSentimentCounts;
  byModel: readonly CustomerSentimentModelBreakdown[];
};

export type CustomerPageKpiDetailScope = {
  questionCount?: number;
  modelNames?: readonly string[];
  answerModelBreakdown?: readonly CustomerAnswerModelBreakdown[];
  sentimentSummary?: CustomerSentimentSummary;
};

const defaultAnswerModelBreakdown: readonly CustomerAnswerModelBreakdown[] = [
  { modelName: "GPT", listed: 54, firstPosition: 19, secondToThirdPosition: 35, bodyMention: 0, unlisted: 71, missing: 3, verificationAttention: 4, unlistedTopic: "料金", leadingCompetitor: "Trailbase", missingReason: "応答タイムアウト", verificationReason: "古い料金説明" },
  { modelName: "Gemini", listed: 55, firstPosition: 20, secondToThirdPosition: 35, bodyMention: 0, unlisted: 70, missing: 3, verificationAttention: 4, unlistedTopic: "引用元", leadingCompetitor: "SignalNest", missingReason: "回答取得失敗", verificationReason: "製品カテゴリの混同" },
  { modelName: "Perplexity", listed: 55, firstPosition: 18, secondToThirdPosition: 37, bodyMention: 0, unlisted: 70, missing: 3, verificationAttention: 4, unlistedTopic: "第三者評価", leadingCompetitor: "Trailbase", missingReason: "一時的な取得失敗", verificationReason: "引用と主張の対応" },
  { modelName: "Google AI Mode", listed: 55, firstPosition: 17, secondToThirdPosition: 38, bodyMention: 0, unlisted: 69, missing: 4, verificationAttention: 5, unlistedTopic: "競合比較", leadingCompetitor: "MentionMap", missingReason: "回答取得失敗", verificationReason: "引用URLなし" }
];

const defaultSentimentSummary: CustomerSentimentSummary = {
  days: 30,
  all: { valid: 14_976, positive: 9_286, neutral: 4_642, negative: 1_048 },
  branded: { valid: 2_340, positive: 1_358, neutral: 749, negative: 233 },
  byModel: [
    {
      modelName: "GPT",
      all: { valid: 3_744, positive: 2_434, neutral: 973, negative: 337 },
      branded: { valid: 592, positive: 361, neutral: 178, negative: 53 }
    },
    {
      modelName: "Gemini",
      all: { valid: 3_744, positive: 2_059, neutral: 1_273, negative: 412 },
      branded: { valid: 580, positive: 290, neutral: 203, negative: 87 }
    },
    {
      modelName: "Perplexity",
      all: { valid: 3_744, positive: 2_546, neutral: 1_011, negative: 187 },
      branded: { valid: 588, positive: 376, neutral: 171, negative: 41 }
    },
    {
      modelName: "Google AI Mode",
      all: { valid: 3_744, positive: 2_247, neutral: 1_385, negative: 112 },
      branded: { valid: 580, positive: 331, neutral: 197, negative: 52 }
    }
  ]
};

function roundedSentimentPercentages(counts: CustomerSentimentCounts) {
  if (counts.valid === 0) return { positive: 0, neutral: 0, negative: 0 };
  const values = [counts.positive, counts.neutral, counts.negative];
  const raw = values.map((value) => value / counts.valid * 100);
  const rounded = raw.map((value) => Math.floor(value));
  let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  for (let index = 0; index < remainder; index += 1) rounded[order[index % order.length].index] += 1;
  return { positive: rounded[0], neutral: rounded[1], negative: rounded[2] };
}

function formatPointDifference(value: number) {
  if (value > 0) return "+" + value + "pt";
  if (value < 0) return value + "pt";
  return "±0pt";
}

export function buildCustomerPageKpiDetail(
  key: CustomerPageKpiDetailKey,
  reportBase: string,
  scope?: CustomerPageKpiDetailScope
): ReportDetailPayload {
  const questionCount = scope?.questionCount ?? 128;
  const modelNames = scope?.modelNames ?? scope?.answerModelBreakdown?.map((row) => row.modelName) ?? defaultAnswerModelBreakdown.map((row) => row.modelName);
  const expectedAnswerCount = questionCount * modelNames.length;
  const providedBreakdown = new Map(scope?.answerModelBreakdown?.map((row) => [row.modelName, row]));
  const defaultBreakdown = new Map(defaultAnswerModelBreakdown.map((row) => [row.modelName, row]));
  const answerModelBreakdown: CustomerAnswerModelBreakdown[] = modelNames.map((modelName) => providedBreakdown.get(modelName) ?? defaultBreakdown.get(modelName) ?? {
    modelName,
    listed: 0,
    firstPosition: 0,
    secondToThirdPosition: 0,
    bodyMention: 0,
    unlisted: 0,
    missing: 0,
    verificationAttention: 0
  });
  const sumAnswerMetric = (metric: "listed" | "unlisted" | "missing" | "verificationAttention") => answerModelBreakdown.reduce((sum, row) => sum + row[metric], 0);
  const listedAnswerCount = sumAnswerMetric("listed");
  const unlistedAnswerCount = sumAnswerMetric("unlisted");
  const missingAnswerCount = sumAnswerMetric("missing");
  const verificationAttentionCount = sumAnswerMetric("verificationAttention");
  const sentimentSummary = scope?.sentimentSummary ?? defaultSentimentSummary;
  const allSentimentRates = roundedSentimentPercentages(sentimentSummary.all);
  const brandedSentimentRates = roundedSentimentPercentages(sentimentSummary.branded);
  const sentimentModelRows = sentimentSummary.byModel.filter((row) => modelNames.includes(row.modelName));
  const sentimentScopeLabel =
    sentimentSummary.days +
    "日・" +
    sentimentModelRows.length +
    "モデル・全有効回答" +
    sentimentSummary.all.valid.toLocaleString("ja-JP") +
    "件";
  const details: Record<CustomerPageKpiDetailKey, ReportDetailPayload> = {
    "prompt-total": {
      kicker: "質問集合",
      title: "固定プロンプト128件",
      value: "128件",
      summary: "現在の質問集合が、どの種別・ペルソナ・トピックをどれだけカバーしているかを確認します。",
      sections: [
        {
          title: "プロンプト種別",
          table: {
            columns: ["種別", "件数", "主な用途"],
            rows: [
              ["Non-brand", "96件", "AI表示率・SOV・平均掲載位置"],
              ["Branded", "20件", "自社の説明・感情・事実確認"],
              ["Named comparison", "12件", "指名競合との比較・推薦順"]
            ]
          }
        },
        {
          title: "質問集合のカバレッジ",
          facts: [
            { label: "ペルソナ", value: "5種類" },
            { label: "トピック", value: "6種類" },
            { label: "購買フェーズ", value: "情報収集 / 比較検討 / 導入判断" },
            { label: "プラン上限", value: "128 / 200件" }
          ]
        }
      ]
    },
    "prompt-review": {
      kicker: "要確認プロンプト",
      title: "確認が必要な24件",
      value: "24件",
      summary: "要確認になった理由を分けて表示します。複数理由に該当する質問があるため、内訳の合計は24件を超える場合があります。",
      sections: [
        {
          title: "要確認になった理由",
          table: {
            columns: ["理由", "該当", "主なトピック"],
            rows: [
              ["競合が先行", "11件", "競合比較 / 料金"],
              ["自社URLの引用なし", "9件", "引用元 / 改善施策"],
              ["感情・事実確認", "6件", "ブランド印象"],
              ["計測失敗を含む", "1件", "複数トピック"]
            ]
          }
        },
        {
          title: "優先して確認したい質問",
          items: [
            { title: "GEO対策ツールのおすすめは？", meta: "競合先行・重要度 高", description: "Trailbaseが先に推薦されるモデルがあります。" },
            { title: "AI検索で自社が引用されるには何を整備すべき？", meta: "自社引用なし・重要度 高", description: "第三者調査が使われ、自社公式URLが引用されていません。" },
            { title: "レコラとTrailbaseの違いは？", meta: "事実確認", description: "料金説明に確認が必要なモデルがあります。" }
          ]
        }
      ]
    },
    "prompt-sentiment": {
      kicker: "感情・表現リスク",
      title: "感情リスクに該当する6件",
      value: "6件",
      summary: "単なるネガティブ判定ではなく、古い情報・カテゴリ混同・根拠のない断定を含む質問をまとめています。",
      sections: [
        {
          title: "リスクの種類",
          table: {
            columns: ["確認内容", "該当", "主な質問種別"],
            rows: [
              ["古い料金・契約条件", "3件", "Branded / Named comparison"],
              ["機能範囲の過剰説明", "2件", "Branded"],
              ["一般的なSEOツールとの混同", "1件", "Branded"]
            ]
          }
        },
        {
          title: "モデルごとの差",
          table: {
            columns: ["AIモデル", "該当質問", "主な確認内容"],
            rows: [
              ["GPT", "3件", "料金・導入期間"],
              ["Gemini", "2件", "カテゴリ混同"],
              ["Perplexity", "1件", "引用元と主張の整合"],
              ["Google AI Mode", "0件", "重大な該当なし"]
            ].filter((row) => modelNames.includes(row[0]))
          }
        }
      ],
      detailHref: `${reportBase}/brand-perception`,
      detailLabel: "ブランドの語られ方を確認"
    },
    "answer-expected": {
      kicker: "最新日の実行状況",
      title: `予定回答${expectedAnswerCount.toLocaleString("ja-JP")}件`,
      value: `${expectedAnswerCount.toLocaleString("ja-JP")}件`,
      summary: `${questionCount}個の固定質問を契約中の${modelNames.length}モデルで毎日1回実行するため、最新日の予定回答は${expectedAnswerCount.toLocaleString("ja-JP")}件です。`,
      sections: [
        {
          title: "モデル別の実行数",
          table: {
            columns: ["AIモデル", "予定", "取得成功", "失敗・欠測"],
            rows: answerModelBreakdown.map((row) => [row.modelName, `${questionCount}件`, `${questionCount - row.missing}件`, `${row.missing}件`])
          }
        },
        {
          title: "状態の区別",
          facts: [
            { label: "掲載あり", value: "取得成功した回答で自社を確認" },
            { label: "有効・未掲載", value: "回答は取得できたが自社名なし" },
            { label: "失敗・欠測", value: "回答を取得できず、表示率の分母から除外" }
          ]
        }
      ]
    },
    "answer-listed": {
      kicker: "自社掲載回答",
      title: `自社が掲載された${listedAnswerCount}件`,
      value: `${listedAnswerCount}件`,
      summary: "掲載された回答を、モデル・掲載位置・質問種別に分けて確認します。",
      sections: [
        {
          title: "モデル別の掲載回答",
          table: {
            columns: ["AIモデル", "掲載", "1位", "2〜3位", "本文言及"],
            rows: answerModelBreakdown.map((row) => [row.modelName, `${row.listed}件`, `${row.firstPosition}件`, `${row.secondToThirdPosition}件`, `${row.bodyMention}件`])
          }
        },
        {
          title: "掲載が多い質問群",
          items: [
            { title: "マーケ責任者 × 競合比較", meta: "掲載率69%", description: "比較検討フェーズで最も掲載が多い組み合わせ" },
            { title: "導入担当 × 改善施策", meta: "掲載率67%", description: "実装・運用を尋ねる回答で掲載が安定" },
            { title: "編集担当 × 引用元", meta: "掲載率60%", description: "引用元を尋ねる回答では掲載位置に差" }
          ]
        }
      ]
    },
    "answer-unlisted": {
      kicker: "有効・未掲載",
      title: "回答は取得できたが自社未掲載",
      value: `${unlistedAnswerCount}件`,
      summary: "計測失敗ではありません。自社が出なかった回答で、どの競合が先行したかを確認します。",
      sections: [
        {
          title: "モデル別の未掲載",
          table: {
            columns: ["AIモデル", "未掲載", "最多トピック", "最多の先行競合"],
            rows: answerModelBreakdown.map((row) => [row.modelName, `${row.unlisted}件`, row.unlistedTopic ?? "—", row.leadingCompetitor ?? "—"])
          }
        },
        {
          title: "未掲載が多い質問群",
          items: [
            { title: "決裁者 × 引用元", meta: "未掲載72%", description: "第三者評価を求める回答で競合が先行" },
            { title: "代理店担当 × 料金", meta: "未掲載66%", description: "プラン比較で自社説明が不足" },
            { title: "編集担当 × ブランド印象", meta: "未掲載57%", description: "一般カテゴリの説明に自社が含まれない" }
          ]
        }
      ]
    },
    "answer-missing": {
      kicker: "失敗・欠測",
      title: `取得できなかった${missingAnswerCount}件`,
      value: `${missingAnswerCount}件`,
      summary: "失敗したモデルだけを再計測対象として扱います。自社未掲載とは別の状態です。",
      sections: [
        {
          title: "モデル別の失敗",
          table: {
            columns: ["AIモデル", "失敗", "主な状態", "扱い"],
            rows: answerModelBreakdown.map((row) => [row.modelName, `${row.missing}件`, row.missingReason ?? "回答取得失敗", row.missing > 0 ? "再計測対象" : "対象なし"])
          }
        },
        {
          title: "集計への影響",
          facts: [
            { label: "AI表示率", value: "欠測を分母から除外" },
            { label: "最新日の回答一覧", value: "失敗として残し、未掲載に混ぜない" },
            { label: "顧客表示", value: "「失敗しました。確認中です。」" }
          ]
        }
      ]
    },
    "answer-verification": {
      kicker: "回答検証",
      title: `確認が必要な${verificationAttentionCount}件`,
      value: `${verificationAttentionCount}件`,
      summary: "回答本文に含まれる主張と引用URLを確認し、確認理由ごとに分けています。",
      sections: [
        {
          title: "確認理由",
          table: {
            columns: ["理由", "回答", "主な対象"],
            rows: answerModelBreakdown.filter((row) => row.verificationAttention > 0).map((row) => [row.verificationReason ?? "主張と根拠の整合", `${row.verificationAttention}件`, row.modelName])
          }
        },
        {
          title: "確認が多いモデル",
          table: {
            columns: ["AIモデル", "要確認", "主な理由"],
            rows: answerModelBreakdown.map((row) => [row.modelName, `${row.verificationAttention}件`, row.verificationReason ?? "主張と根拠の整合"])
          }
        }
      ]
    },
    "citation-total": {
      kicker: "引用全体",
      title: "AI回答内の引用136件",
      value: "136件",
      summary: "引用されたURLを所有元とAIモデルに分け、どの種類の情報が参照されているかを確認します。",
      sections: [
        {
          title: "所有元別の内訳",
          table: {
            columns: ["所有元", "引用", "構成比"],
            rows: [
              ["自社公式", "42件", "31%"],
              ["競合公式", "31件", "23%"],
              ["第三者メディア", "30件", "22%"],
              ["レビュー・SNS・その他", "33件", "24%"]
            ]
          }
        },
        {
          title: "モデル別の引用数",
          table: {
            columns: ["AIモデル", "引用", "最多の所有元"],
            rows: [
              ["GPT", "34件", "自社公式"],
              ["Gemini", "27件", "競合公式"],
              ["Perplexity", "39件", "第三者メディア"],
              ["Google AI Mode", "36件", "自社公式"]
            ].filter((row) => modelNames.includes(row[0]))
          }
        }
      ]
    },
    "citation-owned": {
      kicker: "自社引用",
      title: "自社URLが引用された割合",
      value: "31%",
      summary: "自社が掲載されたかどうかとは別に、自社公式URLが参照された回答を確認します。",
      sections: [
        {
          title: "モデル別の自社引用率",
          table: {
            columns: ["AIモデル", "自社引用率", "最多の自社ページ"],
            rows: [
              ["GPT", "35%", "/products/ai-visibility-monitor"],
              ["Gemini", "28%", "/guide"],
              ["Perplexity", "39%", "/guide"],
              ["Google AI Mode", "42%", "/products/ai-visibility-monitor"]
            ].filter((row) => modelNames.includes(row[0]))
          }
        },
        {
          title: "よく引用される自社ページ",
          items: [
            { title: "/products/ai-visibility-monitor", meta: "18件", description: "製品定義・機能説明" },
            { title: "/guide", meta: "13件", description: "導入・運用の説明" },
            { title: "/pricing", meta: "7件", description: "料金・契約条件" },
            { title: "/about", meta: "4件", description: "会社・サービスの説明" }
          ]
        }
      ]
    },
    "citation-third-party": {
      kicker: "第三者引用",
      title: "第三者ソースが引用された割合",
      value: "46%",
      summary: "第三者メディア・レビュー・コミュニティ・その他を分け、どの話題で信頼材料として使われているかを確認します。",
      sections: [
        {
          title: "第三者ソースの内訳",
          table: {
            columns: ["種別", "引用", "主なトピック"],
            rows: [
              ["専門メディア", "30件", "改善施策 / 市場動向"],
              ["レビューサイト", "21件", "競合比較 / ブランド印象"],
              ["SNS・コミュニティ", "6件", "評判 / 導入体験"],
              ["その他", "6件", "複数トピック"]
            ]
          }
        },
        {
          title: "引用が多い第三者ドメイン",
          items: [
            { title: "marketing-ai.jp", meta: "24件", description: "調査・ガイドがPerplexityで多い" },
            { title: "saas-review.example", meta: "15件", description: "比較・評価の回答で使用" },
            { title: "community.example", meta: "1件", description: "導入体験・評判で使用" }
          ]
        }
      ]
    },
    "citation-domains": {
      kicker: "引用元の広がり",
      title: "引用された28ドメイン",
      value: "28件",
      summary: "ユニークドメイン数だけでなく、新規・継続・消失した引用元を分けて確認します。",
      sections: [
        {
          title: "前期間からの変化",
          facts: [
            { label: "継続ドメイン", value: "21件" },
            { label: "新規ドメイン", value: "7件", tone: "green" },
            { label: "引用が消えたドメイン", value: "3件", tone: "amber" },
            { label: "自社公式ドメイン", value: "1件" }
          ]
        },
        {
          title: "所有元別のドメイン数",
          table: {
            columns: ["所有元", "ドメイン", "引用"],
            rows: [
              ["自社公式", "1件", "42件"],
              ["競合公式", "1件", "31件"],
              ["第三者メディア", "7件", "30件"],
              ["レビュー・SNS・その他", "19件", "33件"]
            ]
          }
        }
      ]
    },
    "perception-positive": {
      kicker: "ポジティブな認識",
      title: "ポジティブと判定された回答",
      value: allSentimentRates.positive + "%",
      summary: sentimentScopeLabel + "を分母にしています。肯定語の数ではなく、自社の強み・用途・選定理由として語られた内容を確認します。",
      sections: [
        {
          title: "よく語られる強み",
          items: [
            { title: "観測結果を根拠まで確認できる", meta: "42回答", description: "AI回答・引用URL・判定を同じ画面で確認できる点" },
            { title: "競合との差を比較できる", meta: "37回答", description: "ブランド・トピック・モデル別の比較" },
            { title: "レポートが実務向け", meta: "29回答", description: "日次運用と説明に使いやすいという表現" }
          ]
        },
        {
          title: "モデル別ポジティブ率（各モデルの全有効回答）",
          table: {
            columns: ["AIモデル", "ポジティブ", "主な表現"],
            rows: sentimentModelRows.map((row) => [
              row.modelName,
              roundedSentimentPercentages(row.all).positive + "%（" + row.all.positive.toLocaleString("ja-JP") + "件）",
              row.modelName === "GPT" ? "実務向け" : row.modelName === "Gemini" ? "SEO分析寄り" : row.modelName === "Perplexity" ? "根拠確認" : "競合比較"
            ])
          }
        },
        {
          title: "ブランド質問だけで見ると",
          facts: [
            { label: "対象", value: "20質問 / 有効回答" + sentimentSummary.branded.valid.toLocaleString("ja-JP") + "件" },
            { label: "ポジティブ率", value: brandedSentimentRates.positive + "%", tone: "green" },
            { label: "全回答との差", value: formatPointDifference(brandedSentimentRates.positive - allSentimentRates.positive) }
          ]
        }
      ]
    },
    "perception-neutral": {
      kicker: "中立的な認識",
      title: "説明中心の回答",
      value: allSentimentRates.neutral + "%",
      summary: sentimentScopeLabel + "を分母にしています。肯定・否定を伴わず、製品カテゴリや機能だけを説明した回答の内訳です。",
      sections: [
        {
          title: "中立回答の種類",
          table: {
            columns: ["説明内容", "回答", "確認点"],
            rows: [
              ["製品カテゴリの説明", "21件", "AI検索可視性ツールとして説明"],
              ["機能の列挙", "18件", "機能範囲が正確か"],
              ["比較候補として言及", "13件", "推薦理由は未記載"],
              ["会社・サービス概要", "9件", "最新情報か"]
            ]
          }
        },
        {
          title: "中立でも確認したい表現",
          items: [
            { title: "SEOツールとして説明", meta: "カテゴリが狭い", description: "AI検索可視性・引用監査の説明が欠ける" },
            { title: "ダッシュボード機能だけを列挙", meta: "価値説明が弱い", description: "何を判断できるかが伝わらない" }
          ]
        },
        {
          title: "ブランド質問だけで見ると",
          facts: [
            { label: "対象", value: "20質問 / 有効回答" + sentimentSummary.branded.valid.toLocaleString("ja-JP") + "件" },
            { label: "中立率", value: brandedSentimentRates.neutral + "%" },
            { label: "全回答との差", value: formatPointDifference(brandedSentimentRates.neutral - allSentimentRates.neutral) }
          ]
        }
      ]
    },
    "perception-negative": {
      kicker: "ネガティブ・注意表現",
      title: "注意が必要な回答",
      value: allSentimentRates.negative + "%",
      summary: sentimentScopeLabel + "を分母にしています。否定的な評価だけでなく、古い情報・不足情報・根拠のない注意書きを含めて確認します。",
      sections: [
        {
          title: "ネガティブ要因",
          table: {
            columns: ["要因", "回答", "状態"],
            rows: [
              ["料金情報が古い", "6件", "公式事実と差分"],
              ["導入期間が不明", "4件", "情報不足"],
              ["第三者評価が少ない", "3件", "外部根拠不足"],
              ["一般SEOツールと混同", "2件", "カテゴリ認識差"]
            ]
          }
        },
        {
          title: "モデル別ネガティブ率（各モデルの全有効回答）",
          table: {
            columns: ["AIモデル", "割合", "最多要因"],
            rows: sentimentModelRows.map((row) => [
              row.modelName,
              roundedSentimentPercentages(row.all).negative + "%（" + row.all.negative.toLocaleString("ja-JP") + "件）",
              row.modelName === "GPT" ? "料金情報" : row.modelName === "Gemini" ? "カテゴリ混同" : row.modelName === "Perplexity" ? "第三者評価" : "導入情報"
            ])
          }
        },
        {
          title: "ブランド質問だけで見ると",
          facts: [
            { label: "対象", value: "20質問 / 有効回答" + sentimentSummary.branded.valid.toLocaleString("ja-JP") + "件" },
            { label: "ネガティブ率", value: brandedSentimentRates.negative + "%", tone: "amber" },
            { label: "全回答との差", value: formatPointDifference(brandedSentimentRates.negative - allSentimentRates.negative), tone: "amber" }
          ]
        }
      ]
    },
    "perception-risk": {
      kicker: "ブランド認識リスク",
      title: "継続して確認する6件",
      value: "6件",
      summary: "公式事実との差や競合との混同が続いている主張を、重大度と影響範囲で確認します。",
      sections: [
        {
          title: "リスクの内訳",
          table: {
            columns: ["主張", "影響回答", "モデル", "継続"],
            rows: [
              ["料金が旧プランで説明される", "3件", "GPT / Gemini", "14日"],
              ["機能範囲が過剰に説明される", "2件", "Gemini / Perplexity", "9日"],
              ["一般的なSEOツールと混同される", "1件", "Gemini", "7日"]
            ]
          }
        },
        {
          title: "優先度の判断",
          facts: [
            { label: "高", value: "公式事実と不一致・複数日継続", tone: "red" },
            { label: "中", value: "根拠未確認・説明不足", tone: "amber" },
            { label: "低", value: "単発・影響範囲が限定的" }
          ]
        }
      ],
      detailHref: `${reportBase}/brand-perception/claims/pricing-old`,
      detailLabel: "最優先の料金差分を分析"
    },
    "recommendation-total": {
      kicker: "改善候補",
      title: "自動抽出された18件",
      value: "18件",
      summary: "候補を優先度・対象・根拠の種類に分けて確認します。候補数は効果を保証する数ではありません。",
      sections: [
        {
          title: "優先度別",
          table: {
            columns: ["優先度", "候補", "主な条件"],
            rows: [
              ["高", "6件", "複数モデル・複数日で継続"],
              ["中", "7件", "影響範囲が限定的"],
              ["低", "5件", "追加観測が必要"]
            ]
          }
        },
        {
          title: "候補の種類",
          table: {
            columns: ["種類", "候補", "主な対象"],
            rows: [
              ["既存ページ改善", "9件", "比較 / 料金 / 製品"],
              ["新規ページ", "4件", "調査 / 第三者評価"],
              ["第三者掲載・引用獲得", "3件", "事例 / データ / レビュー"],
              ["計測条件・定義確認", "2件", "集計条件 / 判定定義"]
            ]
          }
        }
      ]
    },
    "recommendation-priority": {
      kicker: "高優先度候補",
      title: "優先して確認する6件",
      value: "6件",
      summary: "影響範囲・継続日数・モデル横断性が大きい候補を高優先度としています。",
      sections: [
        {
          title: "上位候補",
          items: [
            { title: "競合比較ページに選定基準表を追加", meta: "42観測 / 3モデル / 14日", description: "競合先行が継続する比較検討質問" },
            { title: "引用されやすい調査データページを作成", meta: "28観測 / 2モデル / 11日", description: "第三者調査のみが引用される質問" },
            { title: "料金と導入期間の説明を最新化", meta: "6回答 / 2モデル / 14日", description: "公式事実との差が継続" }
          ]
        },
        {
          title: "高優先度の条件",
          facts: [
            { label: "影響範囲", value: "複数の固定質問・モデルにまたがる" },
            { label: "継続", value: "複数日にわたり同じ傾向" },
            { label: "根拠", value: "回答・引用・公式事実のいずれかで確認可能" }
          ]
        }
      ]
    },
    "recommendation-existing": {
      kicker: "既存ページ改善",
      title: "既存URLを対象とする9件",
      value: "9件",
      summary: "既存ページで不足している比較軸・公式事実・引用されやすい情報を整理します。",
      sections: [
        {
          title: "対象ページ別",
          table: {
            columns: ["対象", "候補", "主な不足"],
            rows: [
              ["/compare", "3件", "選定基準・比較表"],
              ["/pricing", "2件", "現行料金・導入期間"],
              ["/products", "2件", "機能範囲・対象者"],
              ["/guide", "2件", "運用例・更新日"]
            ]
          }
        },
        {
          title: "実施後に確認する指標",
          facts: [
            { label: "比較ページ", value: "AI表示率 / 平均掲載位置" },
            { label: "料金ページ", value: "公式事実との差分" },
            { label: "製品・ガイド", value: "自社引用率 / 引用URL" }
          ]
        }
      ]
    },
    "recommendation-new": {
      kicker: "新規ページ候補",
      title: "不足情報を補う4件",
      value: "4件",
      summary: "既存ページと役割が重複せず、観測された情報需要を受け止められる場合だけ新規ページ候補にします。",
      sections: [
        {
          title: "候補テーマ",
          table: {
            columns: ["テーマ", "候補", "観測された不足"],
            rows: [
              ["AI検索の調査データ", "1件", "自社の一次データが引用されない"],
              ["第三者評価・導入事例", "1件", "レビュー根拠が不足"],
              ["選定基準ガイド", "1件", "比較軸で競合が先行"],
              ["運用ベンチマーク", "1件", "導入後の判断材料が不足"]
            ]
          }
        },
        {
          title: "新規ページにする前の確認",
          facts: [
            { label: "既存URLとの重複", value: "同じ検索意図を持つページがないか" },
            { label: "一次情報", value: "独自データ・方法・更新日を示せるか" },
            { label: "継続運用", value: "公開後に更新できる責任者と頻度" }
          ]
        }
      ]
    }
  };

  return details[key];
}
