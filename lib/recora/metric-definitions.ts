export type RecoraMetricDefinition = {
  key: string;
  label: string;
  source: string;
  definition: string;
};

export const recoraDisplayMetricLabels = {
  aiVisibility: "AI表示率",
  validObservations: "有効観測数",
  averagePosition: "平均表示位置",
  shareOfVoice: "言及シェア",
  competitorRank: "競合内順位",
  competitorBrandCount: "競合ブランド数",
  citationShare: "引用シェア",
  ownedCitationRate: "自社サイト引用率",
  citedAnswerCount: "引用あり回答数",
  displayCount: "表示範囲",
  questionCount: "質問数",
  targetAiModelCount: "対象AIモデル数",
  sourceDomainCount: "参照ドメイン数"
} as const;

export const recoraDisplayMetricHelpers = {
  aiVisibility: "対象ブランド表示回答数 / 有効観測数",
  validObservations: "集計対象として扱えるAI回答または観測の件数",
  averagePosition: "対象ブランドが表示された回答における最初のブランド言及位置の平均",
  shareOfVoice: "ブランド言及全体に占める対象ブランドの構成比",
  competitorRank: "追跡対象ブランド内でのAI表示率順位",
  citationShare: "参照元全体に占める引用出現の構成比",
  ownedCitationRate: "自社ドメインの引用構成比",
  sourceDomainCount: "ユニークな参照元ドメイン"
} as const;

export type RecoraDisplayQualityState = "sufficient" | "limited" | "insufficient" | "unavailable" | "incomparable";

export const recoraDisplayQualityLabels = {
  sufficient: "",
  limited: "サンプル不足です",
  insufficient: "サンプル不足です",
  unavailable: "未計測",
  incomparable: "比較データなし"
} as const satisfies Record<RecoraDisplayQualityState, string>;

export function getRecoraDisplayQualityLabel(state: RecoraDisplayQualityState) {
  return recoraDisplayQualityLabels[state];
}

export function formatRecoraDisplayRange(displayedCount: number, totalCount: number | null = null) {
  const safeDisplayedCount = Math.max(0, displayedCount);

  if (typeof totalCount === "number" && totalCount > 0 && safeDisplayedCount > 0) {
    return `全${totalCount.toLocaleString("ja-JP")}件中 1-${safeDisplayedCount.toLocaleString("ja-JP")}件を表示`;
  }

  if (safeDisplayedCount === 0) return "0件を表示";

  return `${safeDisplayedCount.toLocaleString("ja-JP")}件を表示`;
}

export function formatRecoraCount(value: number | null | undefined, unit = "件", emptyValue = "-") {
  return typeof value === "number" ? `${value.toLocaleString("ja-JP")}${unit}` : emptyValue;
}

export function formatRecoraAveragePosition(value: number | null | undefined, emptyValue = "-") {
  return typeof value === "number" ? `${roundRecoraOneDecimal(value)}位` : emptyValue;
}

export function formatRecoraRank(value: number | null | undefined, emptyValue = "-") {
  return typeof value === "number" ? `${value.toLocaleString("ja-JP")}位` : emptyValue;
}

export function formatRecoraModelCount(value: number | null | undefined, emptyValue = "-") {
  return formatRecoraCount(value, "モデル", emptyValue);
}

export function formatRecoraCompanyCount(value: number | null | undefined, emptyValue = "-") {
  return formatRecoraCount(value, "社", emptyValue);
}

function roundRecoraOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export const recoraMetricDefinitions: RecoraMetricDefinition[] = [
  {
    key: "comparison_scope",
    label: "比較スコープ",
    source: "質問文と対象ブランド名",
    definition: "ブランド比較では、対象ブランド名を含まない質問を中心に集計します。安全に分離できない観測は比較用の順位集計には混ぜません。"
  },
  {
    key: "ai_visibility",
    label: recoraDisplayMetricLabels.aiVisibility,
    source: "AI回答とブランド表示",
    definition: "観測AI回答のうち、対象ブランドが表示された回答の割合です。ブランド比較画面では対象ブランド名を含まない質問を中心に再計算します。"
  },
  {
    key: "ai_answer_count",
    label: "AI回答数",
    source: "保存されたAI回答",
    definition: "測定で保存されたAI回答数です。質問数ではなく、取得できた回答ログ数として扱います。"
  },
  {
    key: "brand_displayed_answer_count",
    label: "ブランド表示回答数",
    source: "ブランド表示の記録",
    definition: "対象ブランドが1回以上表示されたAI回答数です。1回答内の複数言及は1回答として数えます。"
  },
  {
    key: "brand_mention_count",
    label: "ブランド言及数",
    source: "ブランド言及の記録",
    definition: "AI回答内でブランド名またはaliasが言及された回数です。1回答内の複数言及を含みます。"
  },
  {
    key: "citation_occurrence_count",
    label: "参照出現数",
    source: "参照元の出現記録",
    definition: "AI回答内で参照として出現した回数です。根拠として正しいことや確認済みであることは意味しません。"
  },
  {
    key: "citation_url_count",
    label: "参照URL数",
    source: "参照URL",
    definition: "参照として取得できたURLのユニーク数です。参照出現数とは分けて扱います。"
  },
  {
    key: "source_domain_count",
    label: recoraDisplayMetricLabels.sourceDomainCount,
    source: "参照ドメイン",
    definition: "参照URLのドメインをユニーク化した数です。ドメインの信頼性や主張支持の確認結果ではありません。"
  },
  {
    key: "share_of_voice",
    label: recoraDisplayMetricLabels.shareOfVoice,
    source: "ブランド言及の集計",
    definition: "同じ観測スコープ内のブランド言及全体に占める対象ブランドの比率です。市場シェアや検索ボリュームではありません。"
  },
  {
    key: "average_position",
    label: recoraDisplayMetricLabels.averagePosition,
    source: "回答内の表示位置",
    definition: "ブランドが表示された回答内での平均位置です。表示されなかった回答は順位計算に含めません。"
  },
  {
    key: "competitive_gap",
    label: "競合差",
    source: "比較ブランドとの差分",
    definition: "対象ブランドと比較ブランドのAI表示率または代表指標の差分です。ブランド比較画面では対象ブランド名を含まない質問を中心に再計算します。"
  },
  {
    key: "brand_sentiment",
    label: "ブランド印象",
    source: "ブランドへの言及内容",
    definition: "対象ブランドがどう扱われたかを、ポジティブ、ニュートラル、ネガティブで要約します。判定根拠が弱い場合は要確認または未判定として扱います。"
  }
];
