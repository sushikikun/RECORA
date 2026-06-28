export const CUSTOMER_REPORT_DESIGN_LAB_TABS = [
  { id: "home", label: "ホーム", title: "ホーム", eyebrow: "Customer report design lab" },
  { id: "reports", label: "レポート一覧", title: "レポート一覧", eyebrow: "Report history" },
  { id: "overview", label: "概要", title: "概要", eyebrow: "Executive overview" },
  { id: "trends", label: "推移", title: "推移", eyebrow: "Trend analysis" },
  { id: "leaderboard", label: "ブランド比較", title: "ブランド比較", eyebrow: "Brand leaderboard" },
  { id: "prompts", label: "質問別分析", title: "質問別分析", eyebrow: "Prompt analysis" },
  { id: "conversations", label: "AI回答", title: "AI回答", eyebrow: "AI answer review" },
  { id: "sources", label: "参照元", title: "参照元", eyebrow: "Source intelligence" },
  { id: "brand-perception", label: "ブランド認知", title: "ブランド認知", eyebrow: "Brand perception" },
  { id: "recommendations", label: "改善候補", title: "改善候補", eyebrow: "Recommendation candidates" }
] as const;

export type CustomerReportDesignLabTab = (typeof CUSTOMER_REPORT_DESIGN_LAB_TABS)[number]["id"];

export const LAB_TAB_IDS = CUSTOMER_REPORT_DESIGN_LAB_TABS.map((tab) => tab.id);

export function getCustomerReportDesignLabTab(rawTab: string | undefined): CustomerReportDesignLabTab {
  const tab = rawTab?.trim();
  if (tab && LAB_TAB_IDS.includes(tab as CustomerReportDesignLabTab)) {
    return tab as CustomerReportDesignLabTab;
  }

  return "home";
}

export const labMetaItems = [
  { label: "プロジェクト", value: "ミエルカSEO AI検索分析デモ" },
  { label: "レポート日", value: "2026/06/22" },
  { label: "フォーカス", value: "非ブランド" },
  { label: "比較", value: "4社" },
  { label: "質問", value: "2件" },
  { label: "回答", value: "4件" },
  { label: "モデル", value: "4モデル" },
  { label: "品質", value: "サンプル不足", tone: "amber" as const }
];

export const topKpis = [
  { label: "AI表示率", value: "62%", helper: "対象質問で自社がAI回答に出た割合", progress: 62, tone: "green" as const },
  { label: "Share of Voice", value: "24%", helper: "4社比較での自社言及シェア", progress: 24 },
  { label: "自社サイト引用率", value: "18%", helper: "自社ドメインが参照元になった割合", progress: 18, tone: "amber" as const },
  { label: "Average Position", value: "2.4", helper: "自社が出たときの平均表示位置", progress: 46 },
  { label: "Sentiment", value: "中立+", helper: "回答文脈での印象", progress: 58, tone: "green" as const },
  { label: "有効観測数", value: "4", helper: "表示例のため少数サンプル", progress: 38, tone: "amber" as const }
];

export const homeFocusItems = [
  {
    label: "弱いカテゴリ",
    title: "導入前比較・社内稟議の文脈",
    description: "ROI、運用負荷、セキュリティ説明の具体ページが弱く、競合の比較記事に流れやすい状態です。",
    status: "弱い",
    tone: "red" as const
  },
  {
    label: "競合に負けている質問",
    title: "AI検索ツールの選び方",
    description: "自社は候補名として出る一方、比較軸の説明では競合Aが先に引用されています。",
    status: "要改善",
    tone: "amber" as const
  },
  {
    label: "取りに行くべき参照元",
    title: "業界用語集・比較ガイド",
    description: "AI回答で引用される中立ドメインに、自社の説明や根拠ページがまだ入り込めていません。",
    status: "要改善",
    tone: "amber" as const
  }
];

export const quickAccessItems = [
  { tab: "overview" as const, label: "結論を見る", description: "Executive SummaryとKPIを確認" },
  { tab: "prompts" as const, label: "質問を掘る", description: "負けている質問と詳細パネル" },
  { tab: "sources" as const, label: "参照元を見る", description: "引用・不足ソースを確認" },
  { tab: "recommendations" as const, label: "次の施策へ", description: "改善候補と根拠を確認" }
];

export const reportRows = [
  {
    name: "非ブランド検索・日次レポート",
    date: "2026/06/22",
    focus: "非ブランド",
    observations: "4",
    visibility: "62%",
    sov: "24%",
    citation: "18%",
    sentiment: "中立+",
    quality: "サンプル不足",
    status: "確認中",
    questions: "2",
    answers: "4",
    recommendations: "5"
  },
  {
    name: "導入前比較クエリ・軽量チェック",
    date: "2026/06/18",
    focus: "比較・検討",
    observations: "8",
    visibility: "58%",
    sov: "21%",
    citation: "16%",
    sentiment: "中立",
    quality: "参考表示",
    status: "共有済み",
    questions: "4",
    answers: "8",
    recommendations: "4"
  },
  {
    name: "カテゴリ認知・初回ベースライン",
    date: "2026/06/12",
    focus: "カテゴリ",
    observations: "12",
    visibility: "54%",
    sov: "19%",
    citation: "12%",
    sentiment: "中立",
    quality: "参考表示",
    status: "完了",
    questions: "6",
    answers: "12",
    recommendations: "6"
  }
];

export const recentChanges = [
  { label: "AI表示率", value: "+4pt", description: "カテゴリ定義ページの反映が見え始めています。", tone: "green" as const },
  { label: "引用率", value: "-2pt", description: "競合比較記事の参照が増え、自社ドメイン引用が薄くなりました。", tone: "amber" as const },
  { label: "新規参照元", value: "2件", description: "用語集系ドメインが回答に入りました。", tone: "default" as const }
];

export const executiveSummary = [
  {
    title: "今回の結論",
    body: "自社はAI回答に一定表示されるものの、比較軸と根拠URLでは競合Aに先行されています。営業デモでは参照元改善と質問別の弱点を先に見せる構成が自然です。"
  },
  {
    title: "勝っている領域",
    body: "AI検索最適化というカテゴリ認知では自社名が出やすく、好意的な説明も混ざっています。"
  },
  {
    title: "弱い領域",
    body: "導入前比較、ROI、社内稟議、セキュリティの説明材料が不足し、競合や中立メディアに補完されています。"
  },
  {
    title: "すぐやるべきこと",
    body: "比較ガイド、引用されやすい用語集、社内稟議向けFAQを優先して整備します。"
  }
];

export const categoryRows = [
  { category: "AI検索最適化", status: "強い", visibility: 78, sov: 31, note: "カテゴリ名と用途が回答に出やすい" },
  { category: "比較・選定", status: "要改善", visibility: 55, sov: 20, note: "競合Aの比較記事が先に引用される" },
  { category: "社内稟議", status: "弱い", visibility: 38, sov: 11, note: "ROIとセキュリティ説明の根拠が不足" },
  { category: "参照元獲得", status: "要改善", visibility: 44, sov: 18, note: "中立ドメインで自社説明が薄い" }
];

export const trendSeries = [
  { date: "6/12", visibility: 54, sov: 19, citation: 12, position: 2.8, sentiment: 50 },
  { date: "6/15", visibility: 56, sov: 20, citation: 15, position: 2.7, sentiment: 52 },
  { date: "6/18", visibility: 58, sov: 21, citation: 16, position: 2.6, sentiment: 54 },
  { date: "6/20", visibility: 60, sov: 23, citation: 20, position: 2.5, sentiment: 55 },
  { date: "6/22", visibility: 62, sov: 24, citation: 18, position: 2.4, sentiment: 58 }
];

export const competitorRows = [
  { brand: "Recora", type: "自社", visibility: 62, sov: 24, citation: 18, position: "2.4", sentiment: "中立+", delta: "+4pt", rank: "2位" },
  { brand: "競合A", type: "直接競合", visibility: 74, sov: 33, citation: 29, position: "1.8", sentiment: "好意的", delta: "+2pt", rank: "1位" },
  { brand: "競合B", type: "隣接", visibility: 49, sov: 18, citation: 14, position: "2.9", sentiment: "中立", delta: "-1pt", rank: "3位" },
  { brand: "競合C", type: "代替", visibility: 36, sov: 12, citation: 9, position: "3.2", sentiment: "中立", delta: "±0", rank: "4位" }
];

export const categoryMatrix = [
  { category: "AI検索最適化", recora: "強い", competitorA: "強い", competitorB: "要改善", competitorC: "弱い" },
  { category: "比較・選定", recora: "要改善", competitorA: "強い", competitorB: "要改善", competitorC: "弱い" },
  { category: "社内稟議", recora: "弱い", competitorA: "要改善", competitorB: "弱い", competitorC: "弱い" },
  { category: "参照元獲得", recora: "要改善", competitorA: "強い", competitorB: "要改善", competitorC: "弱い" }
];

export const promptRows = [
  {
    prompt: "AI検索最適化ツールを比較するとき、BtoB企業は何を重視すべきですか？",
    category: "比較・選定",
    persona: "マーケ責任者",
    visibility: "表示あり",
    sov: "22%",
    position: "2位",
    evaluation: "要改善",
    priority: "高",
    promptType: "non_branded_comparison",
    intent: "比較検討",
    ownCitation: "なし",
    competitorMention: "競合Aが先行",
    topSources: ["example-media.jp", "seo-guide.example", "competitor-a.example"],
    action: "比較軸ページと社内説明用FAQを追加する"
  },
  {
    prompt: "生成AIの回答で自社サービスが引用されるには、どんな情報設計が必要ですか？",
    category: "参照元獲得",
    persona: "SEO担当",
    visibility: "表示あり",
    sov: "27%",
    position: "2位",
    evaluation: "強い",
    priority: "中",
    promptType: "non_branded_howto",
    intent: "実装調査",
    ownCitation: "あり",
    competitorMention: "競合Bが一部表示",
    topSources: ["recora.example", "search-lab.example", "docs.example"],
    action: "用語集と実装手順ページを相互リンクする"
  },
  {
    prompt: "AI検索分析サービスを社内稟議に通すために確認すべきリスクは？",
    category: "社内稟議",
    persona: "事業責任者",
    visibility: "未表示",
    sov: "8%",
    position: "-",
    evaluation: "弱い",
    priority: "高",
    promptType: "non_branded_risk",
    intent: "社内承認",
    ownCitation: "なし",
    competitorMention: "競合Aと中立メディア",
    topSources: ["procurement.example", "security-check.example"],
    action: "セキュリティ、費用対効果、運用体制の説明ページを追加する"
  }
];

export const conversationSummary = {
  question: "AI検索最適化ツールを比較するとき、BtoB企業は何を重視すべきですか？",
  commonConclusion: "各モデルは、導入前比較では計測範囲、引用元確認、競合比較、社内説明のしやすさを重視しています。",
  modelDifference: "ChatGPTとGeminiは比較軸を広く整理し、Perplexityは引用元の透明性、Claudeは運用負荷を強めに扱います。",
  favorable: "RecoraはAI検索可視化と改善候補の文脈で自然に言及されます。",
  unfavorable: "社内承認・セキュリティの根拠ページでは競合Aや中立メディアが先に引用されます。",
  nextAction: "比較軸、導入判断FAQ、引用されやすい根拠ページを分けて整備します。"
};

export const modelAnswerRows = [
  { model: "ChatGPT", mention: "あり", position: "2位", sentiment: "中立+", domains: "3", summary: "比較軸にAI可視化、競合差分、改善候補を含めるべきと回答。" },
  { model: "Perplexity", mention: "あり", position: "2位", sentiment: "中立", domains: "5", summary: "引用元の透明性と根拠URLの確認を重視。競合Aの比較記事を引用。" },
  { model: "Gemini", mention: "なし", position: "-", sentiment: "中立", domains: "2", summary: "カテゴリ説明はあるが、自社名は出ず一般論中心。" },
  { model: "Claude", mention: "あり", position: "3位", sentiment: "中立+", domains: "1", summary: "運用負荷、社内稟議、改善ワークフローを重視。" }
];

export const sourceSummary = [
  { label: "ユニーク参照ドメイン", value: "9" },
  { label: "総引用数", value: "14" },
  { label: "自社サイト引用", value: "3" },
  { label: "Citation Share", value: "18%" },
  { label: "Retrieval Rate", value: "42%" },
  { label: "Missing Sources", value: "4" }
];

export const sourceDomains = [
  { domain: "example-media.jp", type: "業界メディア", citations: 4, own: "なし", competitor: "競合A", status: "取りに行く" },
  { domain: "recora.example", type: "自社サイト", citations: 3, own: "あり", competitor: "-", status: "維持" },
  { domain: "seo-guide.example", type: "比較ガイド", citations: 3, own: "なし", competitor: "競合A", status: "要改善" },
  { domain: "docs.example", type: "ドキュメント", citations: 2, own: "あり", competitor: "競合B", status: "維持" },
  { domain: "procurement.example", type: "稟議/調達", citations: 2, own: "なし", competitor: "競合A", status: "取りに行く" }
];

export const sourceTypes = [
  { label: "業界メディア", value: 36 },
  { label: "比較ガイド", value: 26 },
  { label: "自社サイト", value: 18 },
  { label: "ドキュメント", value: 12 },
  { label: "調達/稟議", value: 8 }
];

export const brandPerceptionItems = [
  { title: "AIが自社をどう説明しているか", body: "AI検索でのブランド表示、競合比較、引用元確認を支援する分析サービスとして説明されています。" },
  { title: "有利な印象", body: "AI回答での見え方を改善候補まで落とす点は好意的に扱われています。" },
  { title: "不利な印象", body: "継続運用や社内承認の材料が薄く、導入判断では競合Aの情報が補完されています。" },
  { title: "変えるべき認知", body: "単なる可視化ツールではなく、参照元と改善施策まで扱う運用支援として見せる必要があります。" }
];

export const brandPerceptionKpis = [
  { label: "Brand Mention Rate", value: "62%", progress: 62 },
  { label: "Share of Voice", value: "24%", progress: 24 },
  { label: "Sentiment", value: "中立+", progress: 58 },
  { label: "Positive / Neutral / Negative", value: "25 / 65 / 10", progress: 65 },
  { label: "First Mention Rate", value: "18%", progress: 18 },
  { label: "Average Position", value: "2.4", progress: 46 }
];

export const narrativeDrivers = [
  { label: "AI検索の可視化", value: "強い", description: "カテゴリ説明で自然に出る" },
  { label: "競合比較", value: "要改善", description: "比較軸で競合Aが先行" },
  { label: "引用元改善", value: "要改善", description: "自社ドメイン引用が薄い" },
  { label: "社内稟議", value: "弱い", description: "承認材料が不足" }
];

export const recommendationRows = [
  {
    priority: "高",
    issue: "比較ガイドを社内稟議向けに再設計",
    type: "ページ改善",
    evidence: "比較質問で競合Aの比較記事が先に引用",
    impact: "高",
    difficulty: "中",
    confidence: "中",
    status: "未対応",
    why: "比較・選定の質問で自社は表示されるが、根拠URLでは競合Aと中立メディアが先行しています。",
    aiEvidence: "PerplexityとChatGPTが比較軸として引用元の透明性を重視。",
    sourceEvidence: "example-media.jp / seo-guide.example",
    action: "比較軸、導入判断、社内説明の3ブロックに分けたページを作る。"
  },
  {
    priority: "高",
    issue: "自社引用される用語集とFAQを追加",
    type: "参照元獲得",
    evidence: "Missing Sourcesが4件あり、用語説明を外部に依存",
    impact: "中",
    difficulty: "中",
    confidence: "中",
    status: "未対応",
    why: "AI回答がカテゴリ説明を外部ドメインから補完しており、自社サイトの説明が参照されにくい状態です。",
    aiEvidence: "Geminiでは自社名が出ず、一般論中心。",
    sourceEvidence: "search-lab.example / procurement.example",
    action: "AI検索最適化、引用、Share of Voiceの用語ページを作り、比較ページから内部リンクする。"
  },
  {
    priority: "中",
    issue: "セキュリティ・運用体制の説明を分離",
    type: "信頼補強",
    evidence: "社内稟議質問で自社未表示",
    impact: "中",
    difficulty: "低",
    confidence: "低",
    status: "対応中",
    why: "導入承認の文脈では、製品価値より先にリスク確認の情報が求められています。",
    aiEvidence: "Claudeが運用負荷と承認プロセスを強調。",
    sourceEvidence: "security-check.example",
    action: "データ取り扱い、運用頻度、導入前チェックリストを1ページにまとめる。"
  }
];
