import {
  CUSTOMER_REPORT_DESIGN_LAB_PROJECT_NAME,
  CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG,
  withCustomerReportDesignLabSearchParam
} from "./url";

export const customerReportDesignLabPages = [
  { id: "home", label: "ホーム", title: "ホーム", href: "/dashboard", eyebrow: "Customer dashboard" },
  { id: "reports", label: "レポート一覧", title: "レポート一覧", href: "/dashboard/reports", eyebrow: "Reports" },
  { id: "overview", label: "概要", title: "概要", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}`, eyebrow: "Executive overview" },
  { id: "trends", label: "推移", title: "推移", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/trends`, eyebrow: "Trends" },
  { id: "leaderboard", label: "ブランド比較", title: "ブランド比較", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/leaderboard`, eyebrow: "Leaderboard" },
  { id: "prompts", label: "質問別分析", title: "質問別分析", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/prompts`, eyebrow: "Prompt analysis" },
  { id: "conversations", label: "AI回答", title: "AI回答", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/conversations`, eyebrow: "AI answers" },
  { id: "sources", label: "参照元", title: "参照元", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/sources`, eyebrow: "Sources" },
  { id: "brand-perception", label: "ブランド認知", title: "ブランド認知", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/brand-perception`, eyebrow: "Brand perception" },
  { id: "recommendations", label: "改善候補", title: "改善候補", href: `/dashboard/reports/${CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG}/recommendations`, eyebrow: "Recommendations" }
] as const;

export type CustomerReportDesignLabPageId = (typeof customerReportDesignLabPages)[number]["id"];

export const customerReportDesignLabPageIds = customerReportDesignLabPages.map((page) => page.id);

export function getCustomerReportDesignLabHref(pageId: CustomerReportDesignLabPageId) {
  const page = customerReportDesignLabPages.find((item) => item.id === pageId) ?? customerReportDesignLabPages[0];
  return withCustomerReportDesignLabSearchParam(page.href);
}

export const labScope = {
  projectName: CUSTOMER_REPORT_DESIGN_LAB_PROJECT_NAME,
  reportName: "週次サマリーレポート 2025/05/12〜05/18",
  updatedAt: "2025/05/20 10:30",
  targetPeriod: "2025/05/12〜2025/05/18",
  comparisonPeriod: "前週 2025/05/05〜2025/05/11",
  engines: "Google AI Overview, ChatGPT, Perplexity, Gemini, Claude",
  region: "日本",
  dataQuality: "高"
};

export const scopeItems = [
  { label: "プロジェクト", value: labScope.projectName },
  { label: "対象期間", value: labScope.targetPeriod },
  { label: "比較期間", value: labScope.comparisonPeriod },
  { label: "対象AI", value: "5モデル" },
  { label: "地域", value: labScope.region },
  { label: "データ更新", value: labScope.updatedAt },
  { label: "品質", value: labScope.dataQuality }
];

export const homeKpis = [
  { label: "AI表示率", value: "42.7%", delta: "+4.3pt", tone: "green" as const, series: [31, 34, 33, 37, 36, 40, 41, 43] },
  { label: "Share of Voice", value: "27.6%", delta: "+3.1pt", tone: "green" as const, series: [20, 23, 22, 24, 23, 25, 26, 28] },
  { label: "自社サイト引用率", value: "18.9%", delta: "+2.7pt", tone: "green" as const, series: [13, 15, 14, 15, 16, 18, 17, 19] },
  { label: "Sentiment", value: "0.28", delta: "+0.05", tone: "green" as const, series: [0.12, 0.16, 0.15, 0.2, 0.24, 0.22, 0.26, 0.28] },
  { label: "高優先度改善候補", value: "12", delta: "-3", tone: "red" as const, series: [10, 12, 14, 13, 16, 12, 11, 15] }
];

export const reportKpis = [
  { label: "AI表示率", value: "42.7%", delta: "+4.3pt", series: [29, 33, 32, 36, 35, 39, 38, 43] },
  { label: "Share of Voice", value: "27.6%", delta: "+3.1pt", series: [18, 20, 19, 22, 24, 23, 26, 28] },
  { label: "自社サイト引用率", value: "18.9%", delta: "+2.7pt", series: [11, 12, 14, 13, 16, 15, 18, 19] },
  { label: "Average Position", value: "3.6", delta: "-0.4", series: [4.4, 4.1, 4.0, 3.8, 4.0, 3.7, 3.8, 3.6] },
  { label: "Sentiment", value: "0.28", delta: "+0.05", series: [0.12, 0.18, 0.16, 0.22, 0.20, 0.25, 0.23, 0.28] },
  { label: "有効観測数", value: "1,248", delta: "+132", series: [980, 1030, 1088, 1120, 1154, 1180, 1216, 1248] }
];

export const homeFocusItems = [
  {
    label: "弱いカテゴリ",
    title: "料金・導入条件",
    metric: "競合表示が先行、価格比較と導入条件の説明不足",
    action: "料金比較ページとFAQを補強",
    tone: "red" as const
  },
  {
    label: "競合に負けている質問",
    title: "ミエルカSEOの料金はいくらですか？",
    metric: "競合表示 68%・自社 18%",
    action: "回答に価格レンジと導入条件を追加",
    tone: "amber" as const
  },
  {
    label: "取りに行くべき参照元",
    title: "note.com",
    metric: "引用されやすく関連性の高い参照元です",
    action: "比較・導入事例から内部リンク",
    tone: "green" as const
  }
];

export const recentReports = [
  { name: "週次サマリーレポート（2025/05/12〜05/18）", type: "週次レポート", date: "2025/05/19" },
  { name: "質問分析レポート：料金・費用カテゴリ", type: "質問分析", date: "2025/05/18" },
  { name: "競合比較レポート：主要SEOツール", type: "競合比較", date: "2025/05/17" },
  { name: "参照元分析レポート", type: "参照元分析", date: "2025/05/16" },
  { name: "月次レポート（2025年4月）", type: "月次レポート", date: "2025/05/02" }
];

export const recentChanges = [
  { label: "AI表示率が上昇", value: "28.4%（+3.6pt）", time: "2時間前", tone: "green" as const },
  { label: "「AI検索とは」のAI表示率が上昇", value: "45.2%（+8.7pt）", time: "5時間前", tone: "green" as const },
  { label: "競合サイトのShare of Voiceが上昇", value: "A社 21.3%（+2.4pt）", time: "1日前", tone: "red" as const },
  { label: "新しい参照元を検出", value: "note.com（ミエルカSEO活用事例）", time: "2日前", tone: "green" as const }
];

export const quickAccessItems = [
  { label: "概要", description: "結論と優先論点", page: "overview" as const },
  { label: "質問別分析", description: "弱い質問と優先度", page: "prompts" as const },
  { label: "参照元", description: "引用元と不足ソース", page: "sources" as const },
  { label: "改善候補", description: "根拠つき施策候補", page: "recommendations" as const }
];

export const reportRows = [
  {
    name: "日次レポート 2025/05/29",
    date: "2025/05/29",
    focus: "ミエルカSEO",
    observations: "182",
    questions: "200",
    answers: "186",
    visibility: "38.7%",
    sov: "12.4%",
    citation: "24.2%",
    sentiment: "ポジティブ",
    quality: "A",
    status: "完了",
    action: "開く"
  },
  {
    name: "日次レポート 2025/05/28",
    date: "2025/05/28",
    focus: "ミエルカSEO",
    observations: "180",
    questions: "200",
    answers: "184",
    visibility: "36.6%",
    sov: "11.1%",
    citation: "22.1%",
    sentiment: "ポジティブ",
    quality: "A",
    status: "完了",
    action: "開く"
  },
  {
    name: "日次レポート 2025/05/27",
    date: "2025/05/27",
    focus: "料金・費用",
    observations: "176",
    questions: "200",
    answers: "181",
    visibility: "33.2%",
    sov: "10.5%",
    citation: "20.3%",
    sentiment: "ニュートラル",
    quality: "B",
    status: "確認中",
    action: "確認"
  },
  {
    name: "週次レポート 2025/05/12〜05/18",
    date: "2025/05/19",
    focus: "非ブランド検索",
    observations: "1,248",
    questions: "200",
    answers: "1,186",
    visibility: "42.7%",
    sov: "27.6%",
    citation: "18.9%",
    sentiment: "ポジティブ",
    quality: "A",
    status: "完了",
    action: "開く"
  }
];

export const reportDetailSummary = [
  { label: "質問数", value: "200" },
  { label: "回答数", value: "1,186" },
  { label: "有効観測数", value: "1,248" },
  { label: "改善候補数", value: "112" },
  { label: "品質内訳", value: "A: 72% / B: 24% / 要確認: 4%" },
  { label: "主な注意", value: "料金カテゴリで競合優位の回答が集中" }
];

export const executiveSummary = [
  {
    title: "今回の結論",
    body: "AI検索での可視性は着実に向上しています。SEOツール、キーワード調査、コンテンツSEOでは存在感が強まりました。"
  },
  {
    title: "勝っている領域",
    body: "機能比較、SEOツール、キーワード調査では自社が上位表示され、回答内で具体的な用途として扱われています。"
  },
  {
    title: "弱い領域",
    body: "料金、導入条件、セキュリティ説明では競合や中立メディアが先に引用され、意思決定前の不安に十分答えられていません。"
  },
  {
    title: "すぐやるべきこと",
    body: "料金比較、社内稟議向けFAQ、引用されやすい用語集を優先して整備し、既存ブログから導線を張ります。"
  }
];

export const categoryStrengthRows = [
  { category: "SEOツール", visibility: "68.4%", status: "強い" },
  { category: "キーワード調査", visibility: "56.2%", status: "強い" },
  { category: "コンテンツSEO", visibility: "48.7%", status: "強い" },
  { category: "ローカルSEO", visibility: "18.7%", status: "弱い" },
  { category: "技術的SEO", visibility: "19.3%", status: "弱い" }
];

export const competitorLostQuestions = [
  { question: "ミエルカSEOの料金はいくらですか？", own: "18%", competitor: "68%", reason: "価格比較記事が先に引用" },
  { question: "SEOツールを社内稟議に通す判断材料は？", own: "12%", competitor: "54%", reason: "ROI・セキュリティ説明が薄い" },
  { question: "AI検索に強いSEOツールはどれ？", own: "24%", competitor: "61%", reason: "中立比較の引用が不足" },
  { question: "導入後どのくらいで成果が見えますか？", own: "21%", competitor: "48%", reason: "導入事例の要点が引用されない" }
];

export const missingSources = [
  { source: "Moz", appearances: "86", suggestedAsset: "/blog/seo-tool-comparison", impact: "高" },
  { source: "Search Engine Land", appearances: "71", suggestedAsset: "/blog/keyword-research-guide", impact: "高" },
  { source: "Ahrefs", appearances: "64", suggestedAsset: "/blog/technical-seo-checklist", impact: "中" },
  { source: "SEMrush", appearances: "58", suggestedAsset: "/blog/local-seo-basics", impact: "中" },
  { source: "Google Search Console ヘルプ", appearances: "43", suggestedAsset: "/blog/content-seo-basics", impact: "中" }
];

export const competitorRankingRows = [
  { rank: "1", brand: "AIO株式会社", visibility: "45.2%", sov: "31.2%", citation: "28.1%", position: "2.1", sentiment: "0.36" },
  { rank: "2", brand: "ミエルカSEO（自社）", visibility: "42.7%", sov: "27.6%", citation: "18.9%", position: "3.6", sentiment: "0.28" },
  { rank: "3", brand: "Bサーチ株式会社", visibility: "28.6%", sov: "18.7%", citation: "9.8%", position: "4.8", sentiment: "-0.03" },
  { rank: "4", brand: "Cデジタルマーケティング", visibility: "21.3%", sov: "14.0%", citation: "7.1%", position: "5.6", sentiment: "-0.15" }
];

export const topRecommendations = [
  { priority: "高", issue: "料金比較で競合を先に推奨", action: "料金・導入条件ページを新設", impact: "9", difficulty: "6", confidence: "85%" },
  { priority: "高", issue: "自社サイト引用率が低い", action: "用語集・FAQを構造化", impact: "8", difficulty: "5", confidence: "80%" },
  { priority: "中", issue: "社内稟議で不利な印象", action: "セキュリティ・運用体制を明文化", impact: "6", difficulty: "4", confidence: "70%" }
];

export const trendMetricCards = [
  { label: "AI表示率", value: "28.6%", delta: "+6.3pt", series: [24, 26, 28, 31, 35, 34, 38, 36, 39, 37] },
  { label: "Share of Voice", value: "18.7%", delta: "+4.1pt", series: [14, 15, 16, 17, 21, 23, 22, 24, 21, 23] },
  { label: "自社サイト引用率", value: "32.4%", delta: "+5.8pt", series: [22, 24, 26, 28, 32, 35, 33, 36, 34, 38] },
  { label: "Average Position", value: "2.8", delta: "-0.6", series: [4.1, 3.8, 3.6, 3.4, 3.2, 3.0, 3.1, 2.9, 2.8, 2.8] },
  { label: "Sentiment（ポジティブ率）", value: "72.1%", delta: "+3.2pt", series: [64, 66, 67, 68, 70, 69, 71, 70, 72, 73] }
];

export const competitorTrendRows = [
  { brand: "自社（ミエルカ）", current: "18.7%", delta: "+4.1pt", note: "SEOツールカテゴリで伸長" },
  { brand: "AIO株式会社", current: "15.2%", delta: "+2.0pt", note: "料金比較で優位" },
  { brand: "Bサーチ株式会社", current: "11.3%", delta: "-0.7pt", note: "一部モデルで低下" },
  { brand: "Cデジタルマーケティング", current: "9.1%", delta: "+0.6pt", note: "導入事例で小幅増" }
];

export const categoryTrendRows = [
  { category: "SEOツール・サービス", values: ["32.1%", "34.8%", "36.0%", "38.2%", "40.1%", "41.3%", "43.7%"] },
  { category: "SEO対策ノウハウ", values: ["27.4%", "29.1%", "29.8%", "30.6%", "31.4%", "32.2%", "33.6%"] },
  { category: "コンテンツSEO", values: ["24.6%", "25.7%", "27.9%", "27.9%", "28.3%", "29.4%", "30.1%"] },
  { category: "料金・プラン", values: ["12.4%", "13.2%", "13.8%", "14.1%", "13.6%", "14.0%", "15.2%"] }
];

export const modelTrendRows = [
  { model: "ChatGPT", visibility: "34.2%", delta: "+7.1pt", note: "比較軸が明確な回答で上昇" },
  { model: "Perplexity", visibility: "26.8%", delta: "+6.0pt", note: "参照元の増加が寄与" },
  { model: "Gemini", visibility: "22.1%", delta: "+4.2pt", note: "一般解説では未表示が残る" },
  { model: "Claude", visibility: "18.7%", delta: "+3.1pt", note: "稟議・運用観点で言及" },
  { model: "Bing Copilot", visibility: "15.3%", delta: "+2.8pt", note: "中立記事中心" }
];

export const trendEvents = [
  { type: "急上昇した質問", detail: "「SEO 効果測定の指標は何を見るべき？」のAI表示率が急上昇", date: "2025/06/14" },
  { type: "新規参照元", detail: "note.com（SEOカテゴリ）が新たに検出", date: "2025/06/13" },
  { type: "競合上昇", detail: "AIO株式会社のShare of Voiceが過去7日で+3.2pt上昇", date: "2025/06/12" },
  { type: "急上昇した質問", detail: "「AIによるSEOライティングの注意点は？」のAI表示率が上昇", date: "2025/06/11" }
];

export const rankSummary = [
  { label: "自社順位（平均）", value: "2位 / 4社", delta: "前回 2位" },
  { label: "AI表示率順位", value: "2位 / 4社", delta: "前回 2位" },
  { label: "SOV順位", value: "2位 / 4社", delta: "前回 2位" },
  { label: "引用率順位", value: "2位 / 4社", delta: "前回 1位" },
  { label: "Sentiment順位", value: "1位 / 4社", delta: "前回 1位" }
];

export const categoryMatrixRows = [
  { category: "SEOツール・分析", own: "要改善", a: "強い", b: "弱い", c: "弱い" },
  { category: "キーワード調査", own: "強い", a: "要改善", b: "弱い", c: "弱い" },
  { category: "コンテンツSEO", own: "強い", a: "強い", b: "要改善", c: "弱い" },
  { category: "料金・プラン", own: "弱い", a: "強い", b: "要改善", c: "弱い" },
  { category: "導入事例・実績", own: "要改善", a: "強い", b: "要改善", c: "弱い" },
  { category: "使いやすさ・UI", own: "強い", a: "要改善", b: "要改善", c: "弱い" }
];

export const stolenSources = [
  { source: "ferret-plus.com", citedBy: "AIO株式会社", all: "63", gap: "-38", topModel: "GPT-4o" },
  { source: "ainow.ai", citedBy: "AIO株式会社", all: "52", gap: "-31", topModel: "Claude" },
  { source: "sem-rush.com", citedBy: "Bサーチ株式会社", all: "41", gap: "-21", topModel: "Perplexity" },
  { source: "note.com", citedBy: "AIO株式会社", all: "38", gap: "-17", topModel: "Gemini" }
];

export const modelDeltas = [
  { model: "ChatGPT", rank: "2位", delta: "+1", weak: "料金比較" },
  { model: "Perplexity", rank: "2位", delta: "±0", weak: "中立参照元" },
  { model: "Gemini", rank: "3位", delta: "-1", weak: "自社未表示" },
  { model: "Claude", rank: "2位", delta: "+1", weak: "稟議説明" }
];

export const promptRows = [
  {
    question: "AI検索最適化（AIO）とは何ですか？",
    promptType: "定義・解説",
    category: "AI検索最適化",
    persona: "マーケター",
    intent: "Know",
    visibility: "92%",
    sov: "18%",
    position: "5.2",
    ownedCitation: "1",
    competitorMention: "3",
    evaluation: "要改善",
    priority: "高",
    categoryEvaluation: "要改善",
    personaEvaluation: "細部性・最新性が不足",
    topSources: ["ahrefs.com", "searchenginejournal.com", "backlinko.com", "mieruka-seo.jp"],
    action: "AIOの定義を図解で分かりやすく解説し、導入前の判断軸を追加"
  },
  {
    question: "AI Overviewに表示される仕組みは？",
    promptType: "仕組み",
    category: "AI検索最適化",
    persona: "SEO担当",
    intent: "Know",
    visibility: "78%",
    sov: "12%",
    position: "6.8",
    ownedCitation: "0",
    competitorMention: "4",
    evaluation: "弱い",
    priority: "高",
    categoryEvaluation: "弱い",
    personaEvaluation: "計測方法の説明が不足",
    topSources: ["developers.google.com", "moz.com", "semrush.com"],
    action: "Google公式資料を踏まえた解説と計測方法を追加"
  },
  {
    question: "SEOツールの料金比較で何を見るべき？",
    promptType: "比較・検討",
    category: "料金・プラン",
    persona: "経営層",
    intent: "Compare",
    visibility: "58%",
    sov: "5%",
    position: "8.2",
    ownedCitation: "0",
    competitorMention: "5",
    evaluation: "弱い",
    priority: "高",
    categoryEvaluation: "弱い",
    personaEvaluation: "ROI・導入効果が不足",
    topSources: ["pricing-guide.example", "competitor-a.example", "itreview.example"],
    action: "料金ページに比較軸、利用規模、期待効果を追加"
  },
  {
    question: "AI検索に強いコンテンツの作り方は？",
    promptType: "ハウツー",
    category: "コンテンツ制作",
    persona: "コンテンツ担当",
    intent: "Know",
    visibility: "71%",
    sov: "15%",
    position: "6.3",
    ownedCitation: "1",
    competitorMention: "5",
    evaluation: "要改善",
    priority: "中",
    categoryEvaluation: "要改善",
    personaEvaluation: "テンプレート例が不足",
    topSources: ["contentmarketinginstitute.com", "hubspot.com", "mieruka-seo.jp"],
    action: "構成テンプレートと実例を追加"
  }
];

export const selectedPrompt = promptRows[0];

export const personaEvaluationRows = [
  { persona: "マーケター", axis: "網羅性・最新性", missing: "事例・具体的手順", next: "コンテンツ追加" },
  { persona: "SEO担当", axis: "技術的正確性", missing: "計測方法の詳細", next: "技術情報を強化" },
  { persona: "コンテンツ担当", axis: "読みやすさ・構成", missing: "テンプレート・型", next: "構成を最適化" },
  { persona: "経営層", axis: "ビジネスインパクト", missing: "ROI・導入効果", next: "事例・数値を追加" }
];

export const conversationSummary = {
  question: "SEOに強い記事を書くにはどうすればいいですか？",
  tag: "情報収集",
  commonConclusion: "各モデルは、検索意図の理解、E-E-A-T、見出し構成、内部リンク、独自情報を重要視しています。",
  modelDifference: "ChatGPTとClaudeは構造・戦略を重視し、Perplexityは実践手順、GeminiはGoogle基準と最新動向を強調します。",
  favorable: "ミエルカSEOはコンテンツ設計と競合分析の文脈で自然に言及されています。",
  unfavorable: "ChatGPTでは言及なし。Geminiでは他ツールと補足的に評価されます。",
  nextAction: "ChatGPT向けに記事設計・内部リンク・独自データの説明を強化します。"
};

export const modelAnswerRows = [
  {
    model: "ChatGPT (GPT-4o)",
    mention: "なし",
    position: "-",
    sentiment: "-",
    domains: "なし",
    urls: "一般知識に基づく回答",
    summary: "SEOに強い記事作成の基本原則を網羅的に解説。E-E-A-Tや内部リンクの重要性を強調。",
    keyPoints: ["検索意図の理解", "見出し構成", "内部リンク"],
    excerpt: "検索意図を満たし、独自情報を含めることが重要です。"
  },
  {
    model: "Perplexity",
    mention: "あり",
    position: "3位",
    sentiment: "ポジティブ",
    domains: "3件",
    urls: "note.com / mieruka-seo.jp / searchenginejournal.com",
    summary: "手順ベースで実践的に解説。キーワード調査から改善サイクルまで具体的。",
    keyPoints: ["キーワード調査", "競合分析", "改善手順"],
    excerpt: "ミエルカSEOは日本語コンテンツの分析に強いツールとして紹介されています。"
  },
  {
    model: "Gemini 1.5 Pro",
    mention: "あり",
    position: "5位",
    sentiment: "ニュートラル",
    domains: "2件",
    urls: "developers.google.com / mieruka-seo.jp",
    summary: "Googleの公式ガイドラインやE-E-A-Tを重視。比較表でミエルカSEOに軽く言及。",
    keyPoints: ["Google基準", "信頼性", "比較表"],
    excerpt: "経験と信頼性を示す情報設計が重要です。"
  },
  {
    model: "Claude 3 Opus",
    mention: "あり",
    position: "2位",
    sentiment: "ポジティブ",
    domains: "4件",
    urls: "mieruka-seo.jp / ahrefs.com / semrush.com / note.com",
    summary: "戦略的なコンテンツ設計を重視。ミエルカSEOを分析ツールとして高く評価。",
    keyPoints: ["戦略設計", "独自性", "継続改善"],
    excerpt: "上位表示ページの構造分析と改善サイクルが有効です。"
  }
];

export const sourceSummary = [
  { label: "ユニーク参照ドメイン数", value: "512", delta: "+18.4%" },
  { label: "総引用数", value: "2,842", delta: "+22.7%" },
  { label: "自社サイト引用数", value: "432", delta: "+15.3%" },
  { label: "Citation Share", value: "15.2%", delta: "-2.1pt" },
  { label: "Retrieval Rate", value: "38.7%", delta: "+4.3pt" },
  { label: "Missing Sources", value: "186", delta: "+12.0%" }
];

export const sourceDomains = [
  { domain: "note.com", citations: "256", owned: "48", share: "18.8%", retrieval: "52.1%" },
  { domain: "prtimes.jp", citations: "198", owned: "32", share: "16.2%", retrieval: "47.3%" },
  { domain: "github.com", citations: "162", owned: "0", share: "0.0%", retrieval: "31.8%" },
  { domain: "zenn.dev", citations: "141", owned: "12", share: "8.5%", retrieval: "41.2%" },
  { domain: "searchengineland.com", citations: "123", owned: "0", share: "0.0%", retrieval: "28.9%" }
];

export const sourceUrls = [
  { url: "https://note.com/mieruka/n/f7a8b3...", citations: "96", domain: "note.com" },
  { url: "https://prtimes.jp/main/html/rd/p/00...", citations: "74", domain: "prtimes.jp" },
  { url: "https://zenn.dev/mieruka/articles/ai-s...", citations: "58", domain: "zenn.dev" },
  { url: "https://developers.google.com/search...", citations: "45", domain: "developers.google.com" },
  { url: "https://github.com/mieruka/seo-llm...", citations: "38", domain: "github.com" }
];

export const sourceTypes = [
  { type: "ブログ / 記事", citations: "1,432", share: "50.4%", owned: "198" },
  { type: "プレスリリース", citations: "642", share: "22.6%", owned: "96" },
  { type: "ドキュメント / ナレッジ", citations: "386", share: "13.6%", owned: "54" },
  { type: "Q&A / フォーラム", citations: "198", share: "7.0%", owned: "28" },
  { type: "動画", citations: "102", share: "3.6%", owned: "12" }
];

export const sourceGaps = [
  { domain: "medium.com", citations: "64", competitors: "A社 28 / B社 36", retrieval: "31.7%", topic: "SEO戦略、AI検索の基礎", score: "89" },
  { domain: "moz.com", citations: "48", competitors: "A社 21 / B社 18", retrieval: "26.2%", topic: "SEO、ドメイン評価", score: "87" },
  { domain: "reddit.com", citations: "45", competitors: "A社 19 / B社 22", retrieval: "29.1%", topic: "AI検索、ユーザー意見", score: "85" },
  { domain: "quora.com", citations: "38", competitors: "A社 14 / B社 16", retrieval: "24.8%", topic: "AI検索の活用事例", score: "83" }
];

export const sourceActions = [
  { action: "高影響のメディアへコンテンツ提供", impact: "高インパクト" },
  { action: "ドキュメント・ナレッジの強化", impact: "中インパクト" },
  { action: "競合ギャップの解消", impact: "高インパクト" },
  { action: "新規出現ソースの活用", impact: "低〜中インパクト" }
];

export const brandCards = [
  { title: "AIが自社をどう説明しているか", body: "SEO分析・改善のクラウドツールとして、データに基づくサイト改善やコンテンツ最適化を支援するサービスとして説明されています。" },
  { title: "有利な印象", body: "データの正確さ、機能の豊富さ、使いやすさ、サポートの手厚さが高く評価されています。" },
  { title: "不利な印象", body: "価格がやや高めであること、機能が多く使いこなすのが難しいという声が一部で見られます。" },
  { title: "変えるべき認知", body: "高機能で難しいツールという印象を、誰でも使いこなせる身近なSEOパートナーへ転換します。" }
];

export const brandKpis = [
  { label: "Brand Mention Rate", value: "18.7%", delta: "+2.4pt", series: [12, 13, 15, 14, 16, 17, 16, 19] },
  { label: "Share of Voice", value: "22.3%", delta: "+3.1pt", series: [17, 18, 19, 18, 20, 19, 21, 22] },
  { label: "Sentiment", value: "0.42", delta: "+0.08", series: [0.22, 0.25, 0.31, 0.28, 0.34, 0.39, 0.37, 0.42] },
  { label: "Positive / Neutral / Negative", value: "52 / 29 / 19", delta: "+6pt", series: [44, 46, 48, 47, 50, 51, 51, 52] },
  { label: "First Mention Rate", value: "31.5%", delta: "+4.2pt", series: [21, 24, 23, 27, 26, 29, 30, 32] },
  { label: "Average Position", value: "2.8", delta: "-0.3", series: [3.5, 3.4, 3.2, 3.1, 3.0, 3.2, 2.9, 2.8] }
];

export const narrativeDrivers = [
  { word: "SEO分析ツール", weight: "text-[30px]", tone: "green" as const },
  { word: "サイト改善", weight: "text-[24px]", tone: "green" as const },
  { word: "キーワード調査", weight: "text-[20px]", tone: "green" as const },
  { word: "データ分析", weight: "text-[18px]", tone: "slate" as const },
  { word: "競合分析", weight: "text-[17px]", tone: "slate" as const },
  { word: "検索難易度", weight: "text-[16px]", tone: "slate" as const },
  { word: "価格が高い", weight: "text-[15px]", tone: "red" as const },
  { word: "使いやすい", weight: "text-[15px]", tone: "green" as const }
];

export const featureSentimentRows = [
  { category: "データの正確さ", positive: "68%", neutral: "21%", negative: "11%", score: "0.57" },
  { category: "機能の豊富さ", positive: "62%", neutral: "26%", negative: "12%", score: "0.50" },
  { category: "使いやすさ", positive: "55%", neutral: "30%", negative: "15%", score: "0.40" },
  { category: "サポート体制", positive: "58%", neutral: "27%", negative: "15%", score: "0.43" },
  { category: "価格", positive: "24%", neutral: "31%", negative: "45%", score: "-0.21" },
  { category: "データ更新頻度", positive: "28%", neutral: "37%", negative: "35%", score: "-0.07" }
];

export const positiveSignals = [
  { label: "データの正確さ・信頼性が高い", rate: "38%" },
  { label: "機能が豊富で分析の幅が広い", rate: "34%" },
  { label: "レポートがわかりやすい", rate: "29%" },
  { label: "サポートが丁寧で安心できる", rate: "27%" }
];

export const negativeSignals = [
  { label: "価格が高い", rate: "41%" },
  { label: "機能が多すぎて難しい", rate: "33%" },
  { label: "データ更新が遅い時がある", rate: "22%" },
  { label: "操作に慣れるまで時間がかかる", rate: "18%" }
];

export const brandCompetitorDiff = [
  { brand: "ミエルカSEO", score: "0.42" },
  { brand: "A社（競合）", score: "0.15" },
  { brand: "B社（競合）", score: "-0.05" },
  { brand: "C社（競合）", score: "-0.18" }
];

export const modelPerceptionRows = [
  { model: "ChatGPT (GPT-4o)", sentiment: "0.48", mention: "20.1%", tendency: "機能・使いやすさを評価" },
  { model: "Claude 3.5 Sonnet", sentiment: "0.41", mention: "17.3%", tendency: "データ精度・サポートを評価" },
  { model: "Gemini 1.5 Pro", sentiment: "0.36", mention: "16.0%", tendency: "コンテンツ最適化の文脈で言及" },
  { model: "Perplexity", sentiment: "0.31", mention: "14.2%", tendency: "競合比較の中で中立的に言及" }
];

export const recommendationRows = [
  {
    priority: "高",
    issue: "AIが料金比較で競合を推奨",
    actionType: "コンテンツ追加",
    evidence: "複数モデルで料金比較の質問に対し競合サービスを先に引用",
    impact: "9",
    difficulty: "6",
    confidence: "85%",
    status: "未対応",
    why: "料金比較の質問では、競合の価格説明・比較表・導入条件が先に引用されています。",
    aiEvidence: "GPT-4oとPerplexityで競合Aの料金ページが自社より先に登場。",
    sourceEvidence: "example.com/compare/seo-tools, blog.example.com/seo-tool-ranking",
    competitorAssets: "料金比較ページ、詳細な料金表、プラン別機能比較",
    missingAssets: "料金比較コンテンツ、プラン別ページの網羅性、掲載の訴求不足",
    target: "SEOツール 料金比較 / 料金・プラン / SEO担当者",
    relatedSources: "itreview.jp, note.com, competitor-a.example",
    competitorExample: "A社は月額目安、対象企業規模、運用体制を同一ページで説明",
    action: "料金比較ページを新設し、プラン別の向き不向き、導入条件、稟議用FAQを追加",
    expectedImpact: "指名流入 +15〜25%、CVR +0.5〜1.2pt、高優先候補を月8〜15件削減"
  },
  {
    priority: "高",
    issue: "機能の網羅性で訴求不足",
    actionType: "コンテンツ改善",
    evidence: "機能一覧の情報が不足し、競合の比較記事に補完されている",
    impact: "8",
    difficulty: "5",
    confidence: "80%",
    status: "対応中",
    why: "AI回答がミエルカSEOの機能を抽象的に扱い、具体的な運用シーンを拾えていません。",
    aiEvidence: "Claudeで機能名は出るが、使い分けや導入場面が説明されない。",
    sourceEvidence: "semrush.com, searchenginejournal.com",
    competitorAssets: "機能別LP、使い方ガイド、比較表",
    missingAssets: "機能詳細ページ、利用シーン別の説明",
    target: "SEOツール 機能比較 / 機能・特徴 / マーケ責任者",
    relatedSources: "search-lab.example, ahrefs.com",
    competitorExample: "競合は機能別にスクリーンショットと成果指標を配置",
    action: "機能ページの情報設計を再編し、利用シーン別の見出しとFAQを追加",
    expectedImpact: "機能比較質問のAI表示率 +8〜12pt、自社サイト引用率 +4pt"
  },
  {
    priority: "中",
    issue: "導入事例の引用が少ない",
    actionType: "コンテンツ追加",
    evidence: "導入実績を問う回答で中立メディアや競合事例が先に引用される",
    impact: "8",
    difficulty: "6",
    confidence: "75%",
    status: "未対応",
    why: "事例ページの要約性と構造化が弱く、AI回答で抜き出しやすい導入成果が不足しています。",
    aiEvidence: "Geminiで導入事例が一般論として処理され、自社ページが引用されない。",
    sourceEvidence: "case-study.example, note.com",
    competitorAssets: "業界別事例、課題別導入効果",
    missingAssets: "業界別事例一覧、Before/After、導入背景",
    target: "導入事例 / 導入事例 / 経営層",
    relatedSources: "prtimes.jp, customer-story.example",
    competitorExample: "B社は業界別に課題、施策、成果を短く構造化",
    action: "導入事例ページを業界別に再構成し、AIが引用しやすい要点表を追加",
    expectedImpact: "導入事例質問の引用数 +20%、比較検討下部の離脱低下"
  }
];

export const selectedRecommendation = recommendationRows[0];
