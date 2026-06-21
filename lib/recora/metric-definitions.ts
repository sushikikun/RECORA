export type RecoraMetricDefinition = {
  key: string;
  label: string;
  source: string;
  definition: string;
};

export const recoraMetricDefinitions: RecoraMetricDefinition[] = [
  {
    key: "ai_visibility",
    label: "AI表示率",
    source: "metric_snapshots.ai_visibility",
    definition: "対象ブランドが表示されたAI回答数を、同じ測定範囲のAI回答数で割った観測率です。"
  },
  {
    key: "ai_answer_count",
    label: "AI回答数",
    source: "ai_conversations",
    definition: "OpenAI実測で取得できた回答ログの件数です。"
  },
  {
    key: "brand_displayed_answer_count",
    label: "ブランド表示回答数",
    source: "brand_mentions.mentioned + conversation_id distinct",
    definition: "対象ブランドが1回以上表示されたAI回答の件数です。ブランド言及回数とは分けます。"
  },
  {
    key: "brand_mention_count",
    label: "ブランド言及数",
    source: "metric_snapshots.ai_mention_count / brand_mentions.mention_count",
    definition: "AI回答内で対象ブランド名または別名が言及された回数です。1回答内で複数回出る場合があります。"
  },
  {
    key: "citation_occurrence_count",
    label: "参照出現数",
    source: "citations.occurrence_count",
    definition: "AI回答内で参照として出現した回数です。根拠確認済み数ではありません。"
  },
  {
    key: "citation_url_count",
    label: "参照URL数",
    source: "citations.url / citations.canonical_url distinct",
    definition: "参照として取得できたURLのユニーク数です。citation row数とは分けます。"
  },
  {
    key: "source_domain_count",
    label: "参照ドメイン数",
    source: "citations.domain distinct",
    definition: "参照URLのドメインをユニーク化した数です。"
  },
  {
    key: "share_of_voice",
    label: "Share of Voice",
    source: "metric_snapshots.share_of_voice",
    definition: "同一測定範囲内のブランド言及に占める対象ブランドの比率です。市場シェアではありません。"
  },
  {
    key: "average_position",
    label: "平均順位",
    source: "metric_snapshots.average_position / brand_mentions.position",
    definition: "対象ブランドが表示された回答内での平均表示順位です。未表示回答は順位計算に含めません。"
  },
  {
    key: "competitive_gap",
    label: "競合差",
    source: "metric_snapshots.competitive_gap",
    definition: "対象ブランドのAI表示率と、比較対象ブランドの代表値との差分です。正なら対象ブランドが上回っています。"
  }
];

