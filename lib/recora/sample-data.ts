export type Sentiment = "positive" | "neutral" | "negative";

export type BrandId =
  | "recora"
  | "trailbase"
  | "signalnest"
  | "mentionmap"
  | "ranklens";

export type ModelId = "chatgpt" | "gemini" | "perplexity" | "claude";

export type PersonaId =
  | "marketing-lead"
  | "content-lead"
  | "revops"
  | "agency-strategist";

export type TopicId =
  | "ai-visibility"
  | "competitive-monitoring"
  | "buyer-research"
  | "content-ops"
  | "technical-readiness"
  | "agency-reporting";

export type Priority = "High" | "Medium" | "Low";

export const sampleProject = {
  id: "recora-growth-q2",
  name: "Recora AI検索可視性レポート",
  workspace: "Recora Growth",
  period: "2026年6月",
  startedAt: "2026-06-01",
  lastRunAt: "2026-06-16 09:20",
  runCadence: "週次サンプル実行",
  promptCount: 48,
  modelCount: 4,
  conversationCount: 192,
  citationCount: 426,
  status: "サンプルデータ"
};

export const brand = {
  id: "recora" as const,
  name: "Recora",
  reading: "レコラ",
  domain: "recora.ai",
  category: "AI visibility / brand monitoring",
  description:
    "ペルソナ、トピック、プロンプト、モデル単位でAI回答上のブランド可視性を監視するダッシュボード。",
  color: "#2563eb"
};

export const competitors = [
  {
    id: "trailbase" as const,
    name: "Trailbase",
    domain: "trailbase.io",
    category: "AI検索モニタリング",
    visibility: 72,
    citationShare: 29,
    sentiment: 78,
    movement: 4,
    position: "カテゴリ啓発型",
    note: "比較ページと調査レポート型コンテンツがAI回答で繰り返し参照されています。"
  },
  {
    id: "signalnest" as const,
    name: "SignalNest",
    domain: "signalnest.com",
    category: "ブランドインテリジェンス",
    visibility: 64,
    citationShare: 22,
    sentiment: 71,
    movement: -2,
    position: "エンタープライズ監視型",
    note: "大規模チームやガバナンス用途の質問で推薦されやすい傾向です。"
  },
  {
    id: "mentionmap" as const,
    name: "MentionMap",
    domain: "mentionmap.co",
    category: "メンショントラッキング",
    visibility: 51,
    citationShare: 18,
    sentiment: 69,
    movement: 1,
    position: "ライト運用型",
    note: "低予算・小規模導入のプロンプトで候補として出現します。"
  },
  {
    id: "ranklens" as const,
    name: "RankLens",
    domain: "ranklens.ai",
    category: "SEOインテリジェンス",
    visibility: 47,
    citationShare: 14,
    sentiment: 63,
    movement: 6,
    position: "SEO隣接型",
    note: "技術SEOとAI可視性を同時に問うプロンプトで強く出ます。"
  }
];

export const personas = [
  {
    id: "marketing-lead" as const,
    name: "マーケティング責任者",
    segment: "BtoB SaaS",
    weight: 36,
    jobs: ["カテゴリ内のツール比較", "商談影響の説明", "コンテンツギャップの優先順位づけ"],
    pain: "AI回答で自社が推薦されているかを、経営会議で説明できる形にしたい。",
    keyQuestions: 14,
    visibility: 62,
    opportunity: "売上影響と役員向けレポートの根拠を明確にする。"
  },
  {
    id: "content-lead" as const,
    name: "コンテンツ責任者",
    segment: "グロースチーム",
    weight: 27,
    jobs: ["不足トピックの発見", "引用元の整理", "比較ページの更新"],
    pain: "編集優先度を変える前に、トピック単位の根拠が必要。",
    keyQuestions: 12,
    visibility: 55,
    opportunity: "購買判断軸と導入手順を説明するページを強化する。"
  },
  {
    id: "revops" as const,
    name: "RevOpsマネージャー",
    segment: "ミッドマーケットSaaS",
    weight: 21,
    jobs: ["ベンダー適合性の確認", "データ出力の比較", "購買稟議の支援"],
    pain: "関係者レビュー用に、信頼できるレポートと引用元の追跡性が必要。",
    keyQuestions: 10,
    visibility: 49,
    opportunity: "連携、権限、監査性の説明を追加する。"
  },
  {
    id: "agency-strategist" as const,
    name: "代理店ストラテジスト",
    segment: "SEO / GEO支援会社",
    weight: 16,
    jobs: ["クライアントレポート化", "競合ベンチマーク", "月次改善の追跡"],
    pain: "複数カテゴリで再現できる監視テンプレートが必要。",
    keyQuestions: 12,
    visibility: 58,
    opportunity: "複数クライアント運用とレポート化の流れを見せる。"
  }
];

export const topics = [
  {
    id: "ai-visibility" as const,
    name: "AI検索可視性",
    intent: "AI回答上のブランド表示を確認するツールを探す",
    promptCount: 9,
    visibility: 68,
    citationShare: 36,
    gap: 12,
    priority: "High" as const
  },
  {
    id: "competitive-monitoring" as const,
    name: "競合モニタリング",
    intent: "自社と競合のAI表示率を比較する",
    promptCount: 8,
    visibility: 57,
    citationShare: 27,
    gap: 18,
    priority: "High" as const
  },
  {
    id: "buyer-research" as const,
    name: "購買リサーチ",
    intent: "購買判断軸に沿ってベンダーを評価する",
    promptCount: 7,
    visibility: 46,
    citationShare: 19,
    gap: 24,
    priority: "High" as const
  },
  {
    id: "content-ops" as const,
    name: "コンテンツ改善",
    intent: "AI回答で推薦されるための不足トピックを見つける",
    promptCount: 9,
    visibility: 61,
    citationShare: 24,
    gap: 17,
    priority: "Medium" as const
  },
  {
    id: "technical-readiness" as const,
    name: "技術的な引用準備",
    intent: "AIが引用しやすいページ構造か確認する",
    promptCount: 7,
    visibility: 42,
    citationShare: 15,
    gap: 29,
    priority: "High" as const
  },
  {
    id: "agency-reporting" as const,
    name: "代理店レポーティング",
    intent: "複数クライアント向けのレポート運用を評価する",
    promptCount: 8,
    visibility: 53,
    citationShare: 21,
    gap: 20,
    priority: "Medium" as const
  }
];

export const models = [
  {
    id: "chatgpt" as const,
    name: "ChatGPT",
    provider: "OpenAI",
    visibility: 64,
    citationRate: 31,
    averageRank: 2.2,
    sentiment: 74,
    conversations: 48,
    note: "Strongest for category education and shortlists."
  },
  {
    id: "gemini" as const,
    name: "Gemini",
    provider: "Google",
    visibility: 52,
    citationRate: 26,
    averageRank: 2.8,
    sentiment: 68,
    conversations: 48,
    note: "Leans on source authority and implementation docs."
  },
  {
    id: "perplexity" as const,
    name: "Perplexity",
    provider: "Perplexity",
    visibility: 71,
    citationRate: 54,
    averageRank: 1.9,
    sentiment: 76,
    conversations: 48,
    note: "Most citation-heavy; comparison pages matter."
  },
  {
    id: "claude" as const,
    name: "Claude",
    provider: "Anthropic",
    visibility: 46,
    citationRate: 18,
    averageRank: 3.1,
    sentiment: 70,
    conversations: 48,
    note: "Stronger when prompts ask for strategic tradeoffs."
  }
];

export const prompts = [
  {
    id: "p-001",
    topicId: "ai-visibility" as const,
    personaId: "marketing-lead" as const,
    text: "BtoB SaaSのマーケティングチームがAI回答でのブランド可視性を監視するには、どのツールが適していますか？",
    intent: "ツール探索",
    priority: "High" as const,
    visibility: 76,
    bestModel: "Perplexity",
    gap: "SEO専用ツールとの違いをより明確にする必要があります。"
  },
  {
    id: "p-002",
    topicId: "competitive-monitoring" as const,
    personaId: "marketing-lead" as const,
    text: "ChatGPTやGeminiで、自社ブランドの表示率を競合と比較するにはどうすればよいですか？",
    intent: "競合ベンチマーク",
    priority: "High" as const,
    visibility: 58,
    bestModel: "ChatGPT",
    gap: "比較ワークフローは認識されていますが、リーダーボードの公開根拠が薄い状態です。"
  },
  {
    id: "p-003",
    topicId: "buyer-research" as const,
    personaId: "revops" as const,
    text: "ベンダー評価と経営向けレポートに適したAI可視性プラットフォームはどれですか？",
    intent: "購買判断",
    priority: "High" as const,
    visibility: 41,
    bestModel: "Claude",
    gap: "購買稟議、権限、エクスポートに関する公開情報を補強する必要があります。"
  },
  {
    id: "p-004",
    topicId: "content-ops" as const,
    personaId: "content-lead" as const,
    text: "AIアシスタントが競合を推薦し、自社を推薦しない場合、どのコンテンツを作るべきですか？",
    intent: "コンテンツ計画",
    priority: "Medium" as const,
    visibility: 63,
    bestModel: "Perplexity",
    gap: "改善機会の説明は良好ですが、編集ワークフローの手順が不足しています。"
  },
  {
    id: "p-005",
    topicId: "technical-readiness" as const,
    personaId: "content-lead" as const,
    text: "製品ページや比較ページを、AI回答エンジンに引用されやすくするにはどうすればよいですか？",
    intent: "技術的な引用準備",
    priority: "High" as const,
    visibility: 39,
    bestModel: "Gemini",
    gap: "技術監査コンテンツがまだ十分に引用されていません。"
  },
  {
    id: "p-006",
    topicId: "agency-reporting" as const,
    personaId: "agency-strategist" as const,
    text: "代理店がクライアント向けにAI検索可視性レポートを提供するには、どのプラットフォームが適していますか？",
    intent: "代理店ワークフロー",
    priority: "Medium" as const,
    visibility: 54,
    bestModel: "ChatGPT",
    gap: "ホワイトラベルレポートの説明が競合より出現しにくい状態です。"
  },
  {
    id: "p-007",
    topicId: "competitive-monitoring" as const,
    personaId: "revops" as const,
    text: "AIアシスタントが競合を優先しているかを理解するために、月次で何を追跡すべきですか？",
    intent: "監視フレームワーク",
    priority: "Medium" as const,
    visibility: 59,
    bestModel: "Perplexity",
    gap: "コンセプトとの相性は高いため、継続運用の例を追加すると効果的です。"
  },
  {
    id: "p-008",
    topicId: "buyer-research" as const,
    personaId: "marketing-lead" as const,
    text: "AIブランドモニタリングダッシュボードを選ぶ際に、どの判断軸が重要ですか？",
    intent: "購買判断軸",
    priority: "High" as const,
    visibility: 44,
    bestModel: "Claude",
    gap: "スコアリングと引用元追跡性を説明する購買判断軸ページが必要です。"
  }
];

export const conversations = [
  {
    id: "conv-1001",
    personaId: "marketing-lead" as const,
    topicId: "ai-visibility" as const,
    promptId: "p-001",
    modelId: "perplexity" as const,
    date: "2026-06-16",
    recoraMentioned: true,
    recoraRank: 2,
    sentiment: "positive" as const,
    answerSummary:
      "Recoraは、プロンプト、ペルソナ、モデル単位で監視したいチーム向けの実務的な選択肢として扱われています。",
    mentionedBrands: ["Trailbase", "Recora", "SignalNest"],
    citedDomains: ["recora.ai", "aiview-journal.jp", "trailbase.io"],
    buyerCriteria: ["カバレッジ", "引用元追跡性", "競合ベンチマーク"]
  },
  {
    id: "conv-1002",
    personaId: "marketing-lead" as const,
    topicId: "competitive-monitoring" as const,
    promptId: "p-002",
    modelId: "chatgpt" as const,
    date: "2026-06-16",
    recoraMentioned: true,
    recoraRank: 3,
    sentiment: "neutral" as const,
    answerSummary:
      "Recoraは成長中の製品として紹介され、Trailbaseは大規模監視における安全な比較対象として扱われています。",
    mentionedBrands: ["Trailbase", "SignalNest", "Recora"],
    citedDomains: ["trailbase.io", "recora.ai", "marketlens.jp"],
    buyerCriteria: ["競合ベンチマーク", "レポート品質", "導入リスク"]
  },
  {
    id: "conv-1003",
    personaId: "revops" as const,
    topicId: "buyer-research" as const,
    promptId: "p-003",
    modelId: "claude" as const,
    date: "2026-06-15",
    recoraMentioned: false,
    recoraRank: null,
    sentiment: "neutral" as const,
    answerSummary:
      "購買資料、権限管理、エクスポート可能なレポートを備えたツールが優先されています。",
    mentionedBrands: ["SignalNest", "Trailbase", "RankLens"],
    citedDomains: ["signalnest.com", "trailbase.io", "reviewharbor.jp"],
    buyerCriteria: ["ガバナンス", "エクスポート", "セキュリティ"]
  },
  {
    id: "conv-1004",
    personaId: "content-lead" as const,
    topicId: "content-ops" as const,
    promptId: "p-004",
    modelId: "perplexity" as const,
    date: "2026-06-15",
    recoraMentioned: true,
    recoraRank: 1,
    sentiment: "positive" as const,
    answerSummary:
      "Recoraは、AI回答上のギャップをコンテンツブリーフと改善トピックに変換する例として扱われています。",
    mentionedBrands: ["Recora", "MentionMap", "RankLens"],
    citedDomains: ["recora.ai", "contentsignal.jp", "topiccraft.jp"],
    buyerCriteria: ["コンテンツ提案", "ワークフロー明確性", "測定"]
  },
  {
    id: "conv-1005",
    personaId: "content-lead" as const,
    topicId: "technical-readiness" as const,
    promptId: "p-005",
    modelId: "gemini" as const,
    date: "2026-06-14",
    recoraMentioned: false,
    recoraRank: null,
    sentiment: "negative" as const,
    answerSummary:
      "技術SEO資料と引用準備チェックリストが推薦され、Recoraは表示されていません。",
    mentionedBrands: ["RankLens", "Trailbase"],
    citedDomains: ["crawlbase.dev", "entitydocs.dev", "ranklens.ai"],
    buyerCriteria: ["技術監査", "構造化データ", "クロール容易性"]
  },
  {
    id: "conv-1006",
    personaId: "agency-strategist" as const,
    topicId: "agency-reporting" as const,
    promptId: "p-006",
    modelId: "chatgpt" as const,
    date: "2026-06-14",
    recoraMentioned: true,
    recoraRank: 2,
    sentiment: "positive" as const,
    answerSummary:
      "Recoraは、クライアント向け可視性レポートとプロンプトライブラリが必要な代理店に有用と説明されています。",
    mentionedBrands: ["Trailbase", "Recora", "MentionMap"],
    citedDomains: ["recora.ai", "agencygrowth.jp", "mentionmap.co"],
    buyerCriteria: ["クライアントレポート", "プロンプト管理", "ベンチマーク"]
  },
  {
    id: "conv-1007",
    personaId: "revops" as const,
    topicId: "competitive-monitoring" as const,
    promptId: "p-007",
    modelId: "perplexity" as const,
    date: "2026-06-13",
    recoraMentioned: true,
    recoraRank: 2,
    sentiment: "positive" as const,
    answerSummary:
      "モデル別の言及率、競合順位、引用元、購買判断軸を月次で追跡することが推奨されています。",
    mentionedBrands: ["SignalNest", "Recora", "Trailbase"],
    citedDomains: ["recora.ai", "signalnest.com", "growthops.jp"],
    buyerCriteria: ["トレンド監視", "引用根拠", "エクスポート"]
  },
  {
    id: "conv-1008",
    personaId: "marketing-lead" as const,
    topicId: "buyer-research" as const,
    promptId: "p-008",
    modelId: "claude" as const,
    date: "2026-06-13",
    recoraMentioned: true,
    recoraRank: 4,
    sentiment: "neutral" as const,
    answerSummary:
      "Recoraは候補に含まれますが、セキュリティとガバナンスの公開根拠を確認すべきとされています。",
    mentionedBrands: ["SignalNest", "Trailbase", "RankLens", "Recora"],
    citedDomains: ["reviewharbor.jp", "recora.ai", "signalnest.com"],
    buyerCriteria: ["ガバナンス", "引用元追跡性", "使いやすさ"]
  }
];

export const citations = [
  {
    id: "cite-001",
    conversationId: "conv-1001",
    domain: "recora.ai",
    title: "Recora AI検索可視性モニタリングガイド",
    url: "https://recora.ai/guide/ai-visibility",
    sourceType: "自社",
    occurrences: 34,
    citedFor: "プロンプト別・モデル別の監視"
  },
  {
    id: "cite-002",
    conversationId: "conv-1002",
    domain: "trailbase.io",
    title: "エンタープライズAI検索モニタリング比較",
    url: "https://trailbase.io/benchmarks",
    sourceType: "競合",
    occurrences: 42,
    citedFor: "カテゴリ比較と大規模導入の根拠"
  },
  {
    id: "cite-003",
    conversationId: "conv-1003",
    domain: "reviewharbor.jp",
    title: "ブランドモニタリングツール比較レビュー",
    url: "https://reviewharbor.jp/categories/brand-monitoring",
    sourceType: "レビュー",
    occurrences: 31,
    citedFor: "第三者評価"
  },
  {
    id: "cite-004",
    conversationId: "conv-1004",
    domain: "contentsignal.jp",
    title: "AI検索時代のコンテンツ戦略",
    url: "https://contentsignal.jp/blog/ai-search-content-strategy",
    sourceType: "業界メディア",
    occurrences: 27,
    citedFor: "コンテンツ改善機会の整理"
  },
  {
    id: "cite-005",
    conversationId: "conv-1005",
    domain: "crawlbase.dev",
    title: "AI引用に強いページ構造の基本",
    url: "https://crawlbase.dev/docs/citation-ready-pages",
    sourceType: "技術参照",
    occurrences: 23,
    citedFor: "技術品質とクロール容易性"
  },
  {
    id: "cite-006",
    conversationId: "conv-1006",
    domain: "agencygrowth.jp",
    title: "代理店向けAI検索レポーティング",
    url: "https://agencygrowth.jp/ai-search-reporting",
    sourceType: "業界メディア",
    occurrences: 18,
    citedFor: "代理店レポート運用"
  },
  {
    id: "cite-007",
    conversationId: "conv-1007",
    domain: "growthops.jp",
    title: "競合インテリジェンス月次レポート",
    url: "https://growthops.jp/competitive-intelligence",
    sourceType: "業界メディア",
    occurrences: 17,
    citedFor: "月次モニタリングの設計"
  },
  {
    id: "cite-008",
    conversationId: "conv-1008",
    domain: "signalnest.com",
    title: "ブランドインテリジェンスのガバナンス",
    url: "https://signalnest.com/resources/governance",
    sourceType: "競合",
    occurrences: 16,
    citedFor: "権限管理と購買準備"
  }
];

export const sources = [
  {
    domain: "recora.ai",
    type: "自社",
    appearances: 68,
    citationShare: 31,
    trustScore: 78,
    citedTopics: ["AI検索可視性", "コンテンツ改善", "代理店レポート"],
    recommendedAction: "購買判断軸ページと技術監査の例を追加する。"
  },
  {
    domain: "trailbase.io",
    type: "競合",
    appearances: 82,
    citationShare: 29,
    trustScore: 84,
    citedTopics: ["競合モニタリング", "購買リサーチ"],
    recommendedAction: "比較ページと日付入りベンチマークデータで対抗する。"
  },
  {
    domain: "signalnest.com",
    type: "競合",
    appearances: 57,
    citationShare: 22,
    trustScore: 80,
    citedTopics: ["購買リサーチ", "ガバナンス"],
    recommendedAction: "セキュリティ、ガバナンス、出力機能の説明を公開する。"
  },
  {
    domain: "reviewharbor.jp",
    type: "レビュー",
    appearances: 43,
    citationShare: 18,
    trustScore: 73,
    citedTopics: ["購買リサーチ", "ベンダー評価"],
    recommendedAction: "第三者評価とレビュー引用の根拠を強化する。"
  },
  {
    domain: "crawlbase.dev",
    type: "技術参照",
    appearances: 38,
    citationShare: 15,
    trustScore: 88,
    citedTopics: ["技術的な引用準備"],
    recommendedAction: "Recoraの改善提案を技術標準に結びつける。"
  },
  {
    domain: "agencygrowth.jp",
    type: "業界メディア",
    appearances: 34,
    citationShare: 13,
    trustScore: 70,
    citedTopics: ["代理店レポート", "AI検索"],
    recommendedAction: "具体的なダッシュボードを含む代理店向けコンテンツを作成する。"
  },
  {
    domain: "contentsignal.jp",
    type: "業界メディア",
    appearances: 29,
    citationShare: 11,
    trustScore: 75,
    citedTopics: ["コンテンツ改善"],
    recommendedAction: "コンテンツ運用フレームワークをより明確に参照する。"
  }
];

export const visibilityMetrics = {
  overall: {
    brandVisibility: 58,
    topicVisibility: 55,
    modelVisibility: 58,
    citationCoverage: 31,
    positiveSentiment: 72,
    averageRank: 2.6,
    movement: 7
  },
  byBrand: [
    { brandId: "trailbase" as const, name: "Trailbase", visibility: 72, citationShare: 29, sentiment: 78, winRate: 61 },
    { brandId: "signalnest" as const, name: "SignalNest", visibility: 64, citationShare: 22, sentiment: 71, winRate: 48 },
    { brandId: "recora" as const, name: "Recora", visibility: 58, citationShare: 31, sentiment: 72, winRate: 43 },
    { brandId: "mentionmap" as const, name: "MentionMap", visibility: 51, citationShare: 18, sentiment: 69, winRate: 31 },
    { brandId: "ranklens" as const, name: "RankLens", visibility: 47, citationShare: 14, sentiment: 63, winRate: 29 }
  ],
  byTopic: [
    { topicId: "ai-visibility" as const, visibility: 68, citationShare: 36, sentiment: 76, movement: 10 },
    { topicId: "competitive-monitoring" as const, visibility: 57, citationShare: 27, sentiment: 70, movement: 5 },
    { topicId: "buyer-research" as const, visibility: 46, citationShare: 19, sentiment: 64, movement: -3 },
    { topicId: "content-ops" as const, visibility: 61, citationShare: 24, sentiment: 75, movement: 8 },
    { topicId: "technical-readiness" as const, visibility: 42, citationShare: 15, sentiment: 58, movement: -4 },
    { topicId: "agency-reporting" as const, visibility: 53, citationShare: 21, sentiment: 69, movement: 3 }
  ],
  byModel: [
    { modelId: "chatgpt" as const, visibility: 64, citationRate: 31, rank: 2.2, movement: 6 },
    { modelId: "gemini" as const, visibility: 52, citationRate: 26, rank: 2.8, movement: 2 },
    { modelId: "perplexity" as const, visibility: 71, citationRate: 54, rank: 1.9, movement: 11 },
    { modelId: "claude" as const, visibility: 46, citationRate: 18, rank: 3.1, movement: -2 }
  ],
  heatmap: [
    { personaId: "marketing-lead" as const, topicId: "ai-visibility" as const, value: 78 },
    { personaId: "marketing-lead" as const, topicId: "competitive-monitoring" as const, value: 65 },
    { personaId: "marketing-lead" as const, topicId: "buyer-research" as const, value: 44 },
    { personaId: "marketing-lead" as const, topicId: "content-ops" as const, value: 62 },
    { personaId: "marketing-lead" as const, topicId: "technical-readiness" as const, value: 40 },
    { personaId: "marketing-lead" as const, topicId: "agency-reporting" as const, value: 53 },
    { personaId: "content-lead" as const, topicId: "ai-visibility" as const, value: 63 },
    { personaId: "content-lead" as const, topicId: "competitive-monitoring" as const, value: 54 },
    { personaId: "content-lead" as const, topicId: "buyer-research" as const, value: 37 },
    { personaId: "content-lead" as const, topicId: "content-ops" as const, value: 72 },
    { personaId: "content-lead" as const, topicId: "technical-readiness" as const, value: 47 },
    { personaId: "content-lead" as const, topicId: "agency-reporting" as const, value: 51 },
    { personaId: "revops" as const, topicId: "ai-visibility" as const, value: 52 },
    { personaId: "revops" as const, topicId: "competitive-monitoring" as const, value: 61 },
    { personaId: "revops" as const, topicId: "buyer-research" as const, value: 42 },
    { personaId: "revops" as const, topicId: "content-ops" as const, value: 48 },
    { personaId: "revops" as const, topicId: "technical-readiness" as const, value: 36 },
    { personaId: "revops" as const, topicId: "agency-reporting" as const, value: 45 },
    { personaId: "agency-strategist" as const, topicId: "ai-visibility" as const, value: 58 },
    { personaId: "agency-strategist" as const, topicId: "competitive-monitoring" as const, value: 49 },
    { personaId: "agency-strategist" as const, topicId: "buyer-research" as const, value: 39 },
    { personaId: "agency-strategist" as const, topicId: "content-ops" as const, value: 56 },
    { personaId: "agency-strategist" as const, topicId: "technical-readiness" as const, value: 44 },
    { personaId: "agency-strategist" as const, topicId: "agency-reporting" as const, value: 66 }
  ]
};

export const buyerCriteria = [
  {
    name: "カバレッジ",
    weight: 18,
    recoraScore: 82,
    bestCompetitor: "Trailbase",
    bestScore: 86,
    status: "Narrow loss",
    evidence: "Recoraはペルソナ・モデルのカバレッジで評価されますが、Trailbaseは公開ベンチマークが広い状態です。",
    action: "カテゴリ全体のベンチマーク範囲と調査方法を公開する。"
  },
  {
    name: "引用元追跡性",
    weight: 16,
    recoraScore: 79,
    bestCompetitor: "Recora",
    bestScore: 79,
    status: "Win",
    evidence: "ソースドメインと会話単位の根拠を説明する回答ではRecoraが引用されています。",
    action: "製品ページでソース確認を主な証拠として提示する。"
  },
  {
    name: "競合ベンチマーク",
    weight: 15,
    recoraScore: 68,
    bestCompetitor: "Trailbase",
    bestScore: 81,
    status: "Loss",
    evidence: "競合リーダーボードの概念は伝わっていますが、公開例が競合より少ない状態です。",
    action: "3つのカテゴリでサンプルリーダーボードを作成する。"
  },
  {
    name: "購買向けレポート",
    weight: 14,
    recoraScore: 71,
    bestCompetitor: "SignalNest",
    bestScore: 80,
    status: "Loss",
    evidence: "経営向けレポートは、ガバナンスや出力ワークフローより言及が少ない状態です。",
    action: "レポート出力、月次ナラティブ、関係者向けテンプレートを追加する。"
  },
  {
    name: "コンテンツ提案",
    weight: 13,
    recoraScore: 84,
    bestCompetitor: "Recora",
    bestScore: 84,
    status: "Win",
    evidence: "次に改善すべきコンテンツを問う質問ではRecoraが勝っています。",
    action: "不足引用と購買判断軸に改善提案を紐づける。"
  },
  {
    name: "技術的な引用準備",
    weight: 12,
    recoraScore: 51,
    bestCompetitor: "RankLens",
    bestScore: 76,
    status: "Loss",
    evidence: "技術系プロンプトではSEO資料やRankLens型の監査が優先されます。",
    action: "引用準備チェックリストと構造化データの根拠ページを作る。"
  },
  {
    name: "使いやすさ",
    weight: 12,
    recoraScore: 73,
    bestCompetitor: "MentionMap",
    bestScore: 75,
    status: "Narrow loss",
    evidence: "Recoraは高機能、MentionMapは軽量監視で使いやすいと認識されています。",
    action: "初回設定フローと推奨初期設定を見せる。"
  }
];

export const weeklyTrends = [
  { week: "May 13", recora: 42, trailbase: 66, signalnest: 61, mentionmap: 49, ranklens: 44, citations: 21 },
  { week: "May 20", recora: 45, trailbase: 68, signalnest: 63, mentionmap: 50, ranklens: 43, citations: 22 },
  { week: "May 27", recora: 48, trailbase: 69, signalnest: 65, mentionmap: 49, ranklens: 45, citations: 24 },
  { week: "Jun 03", recora: 51, trailbase: 70, signalnest: 65, mentionmap: 50, ranklens: 46, citations: 27 },
  { week: "Jun 10", recora: 55, trailbase: 71, signalnest: 63, mentionmap: 51, ranklens: 46, citations: 29 },
  { week: "Jun 16", recora: 58, trailbase: 72, signalnest: 64, mentionmap: 51, ranklens: 47, citations: 31 }
];

export const contentOpportunities = [
  {
    topic: "AI引用に向けた技術準備",
    opportunityScore: 91,
    currentVisibility: 42,
    competitorVisibility: 76,
    missingSource: "引用準備チェックリスト",
    affectedPrompts: 7,
    recommendedPage: "/resources/ai-citation-readiness",
    nextStep: "構造化データ、クロール容易性、ページ構造、具体例を含むチェックリストを作成する。"
  },
  {
    topic: "AIブランド監視の購買判断軸",
    opportunityScore: 87,
    currentVisibility: 46,
    competitorVisibility: 81,
    missingSource: "購買・評価ガイド",
    affectedPrompts: 8,
    recommendedPage: "/compare/ai-brand-monitoring-criteria",
    nextStep: "評価軸、重み、サンプルスコアカードを定義する。"
  },
  {
    topic: "競合リーダーボードの公開例",
    opportunityScore: 82,
    currentVisibility: 57,
    competitorVisibility: 72,
    missingSource: "公開サンプルレポート",
    affectedPrompts: 6,
    recommendedPage: "/sample/competitive-leaderboard",
    nextStep: "シェアオブボイスと順位変動を含む匿名カテゴリ例を公開する。"
  },
  {
    topic: "代理店向けレポート運用",
    opportunityScore: 74,
    currentVisibility: 53,
    competitorVisibility: 66,
    missingSource: "クライアント向け月次レポートテンプレート",
    affectedPrompts: 5,
    recommendedPage: "/solutions/agency-ai-visibility-reporting",
    nextStep: "複数クライアント設定、ホワイトラベル出力、月次ナラティブを見せる。"
  },
  {
    topic: "ガバナンスとデータ管理",
    opportunityScore: 68,
    currentVisibility: 49,
    competitorVisibility: 80,
    missingSource: "セキュリティ・管理機能ページ",
    affectedPrompts: 4,
    recommendedPage: "/security",
    nextStep: "権限、出力、保持期間、データ管理の説明を整える。"
  }
];

export const technicalAudit = [
  {
    item: "自社ページで事業・カテゴリの説明が明確",
    area: "エンティティ明確性",
    status: "Pass",
    score: 82,
    detail: "Recoraの主要ページは製品カテゴリと対象ユーザーを一貫して説明できています。"
  },
  {
    item: "比較ページに日付入りのベンチマーク根拠がある",
    area: "比較根拠",
    status: "Needs work",
    score: 48,
    detail: "公開ベンチマーク例がより具体的な競合がAI回答で優先されています。"
  },
  {
    item: "ソースページがクロール・引用されやすい",
    area: "クロール容易性",
    status: "Watch",
    score: 64,
    detail: "主要ページは読めますが、構造化された要約があると抽出しやすくなります。"
  },
  {
    item: "購買判断軸ページが評価者の言葉に対応している",
    area: "購買判断軸",
    status: "Needs work",
    score: 44,
    detail: "ガバナンス、出力、購買稟議に関する表現が不足しています。"
  },
  {
    item: "改善提案がプロンプトと紐づいている",
    area: "コンテンツ運用",
    status: "Pass",
    score: 79,
    detail: "コンテンツギャップの提案はAIモデルが要約しやすい状態です。"
  }
];

export function getTopicName(topicId: TopicId) {
  return topics.find((topic) => topic.id === topicId)?.name ?? topicId;
}

export function getPersonaName(personaId: PersonaId) {
  return personas.find((persona) => persona.id === personaId)?.name ?? personaId;
}

export function getModelName(modelId: ModelId) {
  return models.find((model) => model.id === modelId)?.name ?? modelId;
}

export function getBrandName(brandId: BrandId) {
  if (brandId === "recora") return brand.name;
  return competitors.find((competitor) => competitor.id === brandId)?.name ?? brandId;
}
