export type RecoraMetricDefinition = {
  key: string;
  label: string;
  source: string;
  definition: string;
};

export const recoraMetricDefinitions: RecoraMetricDefinition[] = [
  {
    key: "comparison_scope",
    label: "比較スコープ",
    source: "prompts.text + primary brand aliases",
    definition: "ブランド比較では、対象ブランド名やaliasをprompt本文に含まない観測をnon-branded promptとして使います。安全に分離できない場合はranking系の比較スコープには混ぜません。"
  },
  {
    key: "ai_visibility",
    label: "AI表示率",
    source: "metric_snapshots.ai_visibility / brand_mentions.mentioned + conversation_id distinct",
    definition: "観測AI回答のうち、対象ブランドが表示された回答の割合です。ブランド比較画面ではnon-branded promptスコープで再計算します。"
  },
  {
    key: "ai_answer_count",
    label: "AI回答数",
    source: "ai_conversations",
    definition: "measurement runで保存された実測AI回答数です。prompt数ではなく回答ログ数です。"
  },
  {
    key: "brand_displayed_answer_count",
    label: "ブランド表示回答数",
    source: "brand_mentions.mentioned + conversation_id distinct",
    definition: "対象ブランドが1回以上表示されたAI回答数です。1回答内の複数言及は1回答として数えます。"
  },
  {
    key: "brand_mention_count",
    label: "ブランド言及数",
    source: "metric_snapshots.ai_mention_count / brand_mentions.mention_count",
    definition: "AI回答内でブランド名またはaliasが言及された回数です。1回答内の複数言及を含みます。"
  },
  {
    key: "citation_occurrence_count",
    label: "参照出現数",
    source: "citations.occurrence_count",
    definition: "AI回答内で参照として出現した回数です。根拠として正しいことやsource-to-claim確認済みであることは意味しません。"
  },
  {
    key: "citation_url_count",
    label: "参照URL数",
    source: "citations.url / citations.canonical_url distinct",
    definition: "参照として取得できたURLのユニーク数です。citation row数やoccurrence countとは分けて扱います。"
  },
  {
    key: "source_domain_count",
    label: "参照ドメイン数",
    source: "citations.domain distinct",
    definition: "参照URLのドメインをユニーク化した数です。ドメインの信頼性や主張支持の確認結果ではありません。"
  },
  {
    key: "share_of_voice",
    label: "Share of Voice",
    source: "metric_snapshots.share_of_voice / brand_mentions.mention_count",
    definition: "同じ観測スコープ内のブランド言及全体に占める対象ブランドの比率です。市場シェアや検索ボリュームではありません。"
  },
  {
    key: "average_position",
    label: "平均順位",
    source: "metric_snapshots.average_position / brand_mentions.position",
    definition: "ブランドが表示された回答内での平均位置です。表示されなかった回答は順位計算に含めません。"
  },
  {
    key: "competitive_gap",
    label: "競合差",
    source: "metric_snapshots.competitive_gap / computed visibility gap",
    definition: "対象ブランドと比較ブランドのAI表示率または代表指標の差分です。ブランド比較画面ではnon-branded promptスコープで再計算します。"
  },
  {
    key: "brand_sentiment",
    label: "ブランド印象",
    source: "brand_mentions.sentiment",
    definition: "branded prompt内で対象ブランドがどう扱われたかを、positive / neutral / negative / unclearで要約します。判定根拠が弱い場合は要確認または未判定として扱います。"
  }
];
