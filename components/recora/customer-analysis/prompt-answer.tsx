"use client";

import {
  DataRichBadge,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  LabeledMetricGrid,
  MetricLineChart,
  PanelNote,
  ReportDataTable,
  SourceLink
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

export type PromptAnalysisTarget = {
  id: string;
  prompt: string;
  type: string;
  importance: string;
  persona: string;
  topic: string;
  phase: string;
  aiPresence: number;
  sov: number;
  averagePosition: string;
  citationRate: number;
  sentiment: string;
  reason: string;
};

export type AnswerAnalysisTarget = {
  id: string;
  prompt: string;
  model: string;
  listed: string;
  position: string;
  recommendationOrder: string;
  competitorAhead: string;
  citations: number;
  verification: string;
  observedAt?: string;
};

export type AnswerPromptContext = Pick<
  PromptAnalysisTarget,
  "type" | "importance" | "persona" | "topic" | "phase"
>;

type PromptProfile = {
  competitor: string;
  selfTrend: number[];
  competitorTrend: number[];
  modelOffsets: [number, number, number, number];
  missingModels: string[];
  sources: Array<{
    id: string;
    label: string;
    models: string;
    owner: string;
    role: string;
    claim: string;
  }>;
  claims: Array<{
    claim: string;
    models: string;
    source: string;
    judgment: "一致" | "要確認" | "根拠不足";
  }>;
  expansions: Array<{
    query: string;
    models: string;
    status: string;
    result: string;
  }>;
};

const promptProfiles: Record<string, PromptProfile> = {
  p01: {
    competitor: "Trailbase",
    selfTrend: [38, 41, 40, 44, 48, 51, 55, 58],
    competitorTrend: [62, 64, 63, 66, 68, 70, 69, 71],
    modelOffsets: [3, -6, 8, -5],
    missingModels: [],
    sources: [
      { id: "recora-product", label: "recora.jp/products/ai-visibility-monitor", models: "GPT / Perplexity / Google AI Mode", owner: "自社公式", role: "機能の裏付け", claim: "日次観測とモデル比較" },
      { id: "trailbase-compare", label: "trailbase.io/compare/geo-tools", models: "GPT / Gemini", owner: "競合公式", role: "選定基準", claim: "競合比較と対応範囲" },
      { id: "marketing-ai-research", label: "marketing-ai.jp/research/ai-search-2026", models: "Perplexity", owner: "第三者メディア", role: "市場背景", claim: "AI検索の利用拡大" }
    ],
    claims: [
      { claim: "Recoraは複数AIサービスを日次で観測する", models: "GPT / Perplexity / Google AI Mode", source: "recora.jp", judgment: "一致" },
      { claim: "Trailbaseは分析対象が広い", models: "GPT / Gemini", source: "trailbase.io", judgment: "要確認" },
      { claim: "導入後すぐに成果が出る", models: "Gemini", source: "明確な引用なし", judgment: "根拠不足" }
    ],
    expansions: [
      { query: "GEO ツール 比較", models: "4モデル", status: "取得済み", result: "Trailbaseが先行、Recoraは2位群" },
      { query: "AI検索 可視化 サービス", models: "4モデル", status: "取得済み", result: "Recoraは3モデルで掲載" },
      { query: "LLMO 効果測定 ツール", models: "3モデル", status: "1モデル欠測", result: "Perplexityで公式サイト引用あり" }
    ]
  },
  p02: {
    competitor: "SignalNest",
    selfTrend: [27, 30, 29, 32, 34, 37, 39, 42],
    competitorTrend: [46, 49, 51, 53, 54, 55, 57, 59],
    modelOffsets: [-2, -8, 6, 4],
    missingModels: ["Gemini"],
    sources: [
      { id: "recora-product", label: "recora.jp/products/ai-visibility-monitor", models: "GPT / Google AI Mode", owner: "自社公式", role: "製品定義", claim: "引用元と掲載状況の可視化" },
      { id: "marketing-ai-research", label: "marketing-ai.jp/research/ai-search-2026", models: "Perplexity", owner: "第三者メディア", role: "実装手順", claim: "構造化された一次情報の重要性" },
      { id: "saas-review-geo", label: "saas-review.example/geo", models: "Gemini", owner: "レビュー", role: "比較評価", claim: "機能差と運用負荷" }
    ],
    claims: [
      { claim: "一次情報を明示すると引用候補になりやすい", models: "GPT / Perplexity", source: "marketing-ai.jp", judgment: "一致" },
      { claim: "構造化データだけで引用率が上がる", models: "Gemini", source: "明確な引用なし", judgment: "根拠不足" },
      { claim: "調査ページは引用されやすい", models: "Google AI Mode", source: "複数の第三者記事", judgment: "要確認" }
    ],
    expansions: [
      { query: "AI検索 引用される 方法", models: "4モデル", status: "取得済み", result: "一次情報・調査データが共通論点" },
      { query: "生成AI 引用元 対策", models: "3モデル", status: "Gemini欠測", result: "自社名は2モデルで未掲載" },
      { query: "GEO コンテンツ 作り方", models: "4モデル", status: "取得済み", result: "SignalNestが3モデルで先行" }
    ]
  },
  p03: {
    competitor: "MentionMap",
    selfTrend: [66, 68, 70, 71, 73, 74, 76, 78],
    competitorTrend: [21, 22, 24, 25, 24, 26, 27, 28],
    modelOffsets: [9, -4, 6, -3],
    missingModels: [],
    sources: [
      { id: "recora-product", label: "recora.jp/products/ai-visibility-monitor", models: "4モデル", owner: "自社公式", role: "製品説明", claim: "AI検索可視性の観測" },
      { id: "marketing-ai-research", label: "marketing-ai.jp/research/ai-search-2026", models: "Perplexity", owner: "第三者メディア", role: "第三者評価", claim: "代表的なGEO観測サービス" },
      { id: "saas-review-geo", label: "saas-review.example/geo", models: "Gemini", owner: "レビュー", role: "利用評価", claim: "分析画面の分かりやすさ" }
    ],
    claims: [
      { claim: "RecoraはAI検索でのブランド可視性を測定する", models: "4モデル", source: "recora.jp", judgment: "一致" },
      { claim: "対応モデルは3種類である", models: "Gemini", source: "古いレビュー", judgment: "要確認" },
      { claim: "無料プランを提供している", models: "GPT", source: "引用なし", judgment: "根拠不足" }
    ],
    expansions: [
      { query: "Recora 評判", models: "4モデル", status: "取得済み", result: "肯定的3・中立1" },
      { query: "Recora 機能", models: "4モデル", status: "取得済み", result: "全モデルで掲載" },
      { query: "Recora 料金", models: "4モデル", status: "取得済み", result: "2モデルで古い説明" }
    ]
  },
  p04: {
    competitor: "Trailbase",
    selfTrend: [44, 45, 47, 46, 49, 50, 52, 54],
    competitorTrend: [56, 57, 58, 60, 61, 62, 64, 65],
    modelOffsets: [5, -5, 3, -3],
    missingModels: [],
    sources: [
      { id: "recora-product", label: "recora.jp/products/ai-visibility-monitor", models: "GPT / Perplexity / Google AI Mode", owner: "自社公式", role: "自社機能", claim: "日次観測・引用分析" },
      { id: "trailbase-compare", label: "trailbase.io/compare/geo-tools", models: "4モデル", owner: "競合公式", role: "競合機能", claim: "多地域・多言語対応" },
      { id: "saas-review-geo", label: "saas-review.example/geo", models: "Gemini / Perplexity", owner: "レビュー", role: "比較評価", claim: "価格と運用負荷" }
    ],
    claims: [
      { claim: "Recoraは日本向けの運用に強い", models: "GPT / Google AI Mode", source: "recora.jp", judgment: "一致" },
      { claim: "Trailbaseは多地域で利用できる", models: "4モデル", source: "trailbase.io", judgment: "一致" },
      { claim: "Recoraの月額は旧プランの金額である", models: "Gemini", source: "古い比較記事", judgment: "要確認" }
    ],
    expansions: [
      { query: "Recora Trailbase 比較", models: "4モデル", status: "取得済み", result: "Trailbase先行2・Recora先行1・並列1" },
      { query: "Recora と Trailbase 違い", models: "4モデル", status: "取得済み", result: "運用地域と分析粒度が主な比較軸" },
      { query: "GEO ツール 日本向け", models: "4モデル", status: "取得済み", result: "Recoraが3モデルで候補入り" }
    ]
  }
};

const models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"] as const;

function stableOffset(id: string, index: number) {
  const seed = Array.from(id).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return ((seed + index * 7) % 13) - 6;
}

function fallbackPromptProfile(prompt: PromptAnalysisTarget): PromptProfile {
  const offsets = models.map((_, index) => stableOffset(prompt.id, index)) as [number, number, number, number];
  return {
    competitor: "主要競合",
    selfTrend: [-14, -11, -9, -8, -6, -4, -2, 0].map((delta) => Math.max(0, prompt.aiPresence + delta)),
    competitorTrend: [-8, -6, -5, -4, -3, -1, 0, 2].map((delta) => Math.max(0, prompt.aiPresence + 12 + delta)),
    modelOffsets: offsets,
    missingModels: [],
    sources: [
      { id: "recora-product", label: "recora.jp/products/ai-visibility-monitor", models: "複数モデル", owner: "自社公式", role: "製品定義", claim: prompt.topic },
      { id: "marketing-ai-research", label: "marketing-ai.jp/research/ai-search-2026", models: "複数モデル", owner: "第三者メディア", role: "市場背景", claim: prompt.reason }
    ],
    claims: [
      { claim: prompt.reason, models: "複数モデル", source: "観測された回答と引用元", judgment: "要確認" }
    ],
    expansions: [
      { query: prompt.prompt, models: "対象モデル", status: "取得済み", result: prompt.reason }
    ]
  };
}

function judgmentBadge(judgment: PromptProfile["claims"][number]["judgment"]) {
  const tone = judgment === "一致" ? "green" : judgment === "要確認" ? "amber" : "red";
  return <DataRichBadge tone={tone}>{judgment}</DataRichBadge>;
}

function sourceReference(source: string) {
  const label = source.trim() || "該当なし";
  if (label === "該当なし") return label;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(label)) return label;
  return <SourceLink external href={`https://${label}`} label={label} />;
}

export function PromptDetailAdvancedPanels({
  reportBase,
  prompt,
  activeModelNames,
  section = "all",
  range = "30日"
}: {
  reportBase: string;
  prompt: PromptAnalysisTarget;
  activeModelNames: readonly string[];
  section?: "all" | "trend" | "evidence";
  range?: string;
}) {
  const profile = promptProfiles[prompt.id] ?? fallbackPromptProfile(prompt);
  const modelLabel = (label: string) => {
    if (label === "4モデル") return activeModelNames.length + "モデル";
    const entries = label.split(" / ");
    if (!entries.some((entry) => models.includes(entry as (typeof models)[number]))) return label;
    const available = entries.filter((entry) => activeModelNames.includes(entry));
    return available.join(" / ") || "対象外";
  };
  const trendCount = range === "7日" ? 4 : 8;
  const selfTrend = profile.selfTrend.slice(-trendCount);
  const competitorTrend = profile.competitorTrend.slice(-trendCount);
  const trendLabels = range === "7日"
    ? ["7日前", "5日前", "3日前", "最新"]
    : range === "90日"
      ? ["90日前", "75日前", "60日前", "45日前", "30日前", "20日前", "10日前", "最新"]
      : ["30日前", "25日前", "20日前", "15日前", "10日前", "5日前", "3日前", "最新"];

  return (
    <>
      {section !== "evidence" ? (
        <DataRichPanel
          title={range + "のAI表示率推移"}
          description={"この質問について、Recoraと" + profile.competitor + "が回答内に現れた割合を同じ時間軸で比較します。"}
          variant="trend"
        >
          <MetricLineChart
            series={[
              { name: "Recora", color: "#0B6B57", values: selfTrend, emphasized: true },
              { name: profile.competitor, color: "#D7664C", values: competitorTrend }
            ]}
            labels={trendLabels}
            unit="%"
            deltaUnit="pt"
            detailType="prompt-performance"
          />
          <PanelNote>{prompt.reason}</PanelNote>
        </DataRichPanel>
      ) : null}

      {section !== "trend" ? (
        <>
          <DataRichPanel
            title="この質問で確認した引用URL"
            description="この質問の回答で確認したURLとAIモデルだけを表示します。引用元全体の分析は「引用・参照元」で確認します。"
            bodyClassName="p-0"
          >
            <ReportDataTable
              columns={["引用URL", "確認したAIモデル"]}
              rows={profile.sources.map((source) => [
                <SourceLink key={source.id} href={reportBase + "/sources/pages/" + source.id} label={source.label} />,
                modelLabel(source.models)
              ])}
            />
            <div className="border-t border-[#DDE5E1] bg-[#F8FAF9] px-4 py-3 sm:px-5">
              <SourceLink href={reportBase + "/sources"} label="引用・参照元で詳しく見る" />
            </div>
          </DataRichPanel>

          <DataRichPanel
            title="関連検索と観測状態"
            description="同じ質問から展開された関連検索を、取得できたAIモデルと回答の違いが分かる形で確認します。"
            bodyClassName="p-0"
          >
            <ReportDataTable
              columns={["展開された検索", "対象AIモデル", "取得状態", "回答で分かったこと"]}
              rows={profile.expansions.map((expansion) => [
                expansion.query,
                modelLabel(expansion.models),
                expansion.status,
                expansion.result
              ])}
            />
          </DataRichPanel>
        </>
      ) : null}
    </>
  );
}

type AnswerProfile = {
  fullAnswer: string[];
  roles: Array<{ label: string; value: string; note: string; tone?: "green" | "amber" | "red" }>;
  claims: Array<{
    claim: string;
    brand: string;
    sourceId?: string;
    sourceLabel: string;
    support: string;
    judgment: "一致" | "要確認" | "根拠不足";
  }>;
  caveats: Array<{
    wording: string;
    subject: string;
    effect: string;
    tone: "肯定" | "中立" | "注意";
  }>;
  retrieval: string;
  comparison: string;
};

const answerProfiles: Record<string, AnswerProfile> = {
  a01: {
    fullAnswer: [
      "GEO対策ツールを比較する際は、AI回答でのブランド掲載率だけでなく、引用元、競合との掲載順位、質問ごとの変化を継続して確認できるかが重要です。",
      "候補としてはTrailbaseとRecoraがあります。Trailbaseは比較機能の広さが強みです。Recoraは日本語の固定質問を日次で観測し、モデル別の掲載・引用・競合差を追いたい場合に適しています。導入前には対象モデル数と料金条件を公式情報で確認してください。"
    ],
    roles: [
      { label: "Trailbase", value: "第一候補", note: "最初に推奨し、比較軸を説明", tone: "amber" },
      { label: "Recora", value: "第二候補", note: "日本語運用と日次観測で紹介", tone: "green" },
      { label: "SignalNest", value: "比較対象", note: "引用分析の選択肢として言及" },
      { label: "MentionMap", value: "未掲載", note: "回答本文にブランド名なし" }
    ],
    claims: [
      { claim: "固定質問を日次で観測できる", brand: "Recora", sourceId: "recora-product", sourceLabel: "recora.jp/products/ai-visibility-monitor", support: "機能説明に一致", judgment: "一致" },
      { claim: "競合比較機能の範囲が広い", brand: "Trailbase", sourceId: "trailbase-compare", sourceLabel: "trailbase.io/compare/geo-tools", support: "公式比較ページの記載", judgment: "一致" },
      { claim: "料金条件は導入前に確認が必要", brand: "Recora", sourceLabel: "明確な引用なし", support: "回答の但し書き", judgment: "要確認" }
    ],
    caveats: [
      { wording: "料金条件を公式情報で確認してください", subject: "Recora", effect: "推奨を弱める但し書き", tone: "注意" },
      { wording: "日本語の固定質問を日次で観測", subject: "Recora", effect: "運用適合性を肯定", tone: "肯定" },
      { wording: "比較機能の広さが強み", subject: "Trailbase", effect: "競合の優位点を明示", tone: "肯定" }
    ],
    retrieval: "回答本文・引用3件を取得済み",
    comparison: "3ブランドの役割と順序を抽出済み"
  },
  a02: {
    fullAnswer: [
      "AI検索で引用されるには、独自調査、明確な著者情報、更新日、一次データ、引用可能な要約を同じページに揃えることが有効です。",
      "SignalNestは引用分析と参照ドメインの把握に利用できます。加えて、検索展開を確認しながら関連質問ごとの情報不足を埋める運用が必要です。この回答ではRecoraを確認できませんでした。"
    ],
    roles: [
      { label: "SignalNest", value: "第一候補", note: "引用分析の代表例として推奨", tone: "amber" },
      { label: "Recora", value: "未掲載", note: "回答本文・引用元ともに名称なし", tone: "red" },
      { label: "Trailbase", value: "補足候補", note: "運用比較の文脈で言及" },
      { label: "MentionMap", value: "未掲載", note: "回答本文にブランド名なし" }
    ],
    claims: [
      { claim: "独自調査と一次データは引用候補になりやすい", brand: "一般論", sourceId: "marketing-ai-research", sourceLabel: "marketing-ai.jp/research/ai-search-2026", support: "調査結果と方向性が一致", judgment: "一致" },
      { claim: "SignalNestは引用分析に利用できる", brand: "SignalNest", sourceLabel: "saas-review.example/geo", support: "第三者レビューのみ", judgment: "要確認" },
      { claim: "検索展開の確認が必須である", brand: "一般論", sourceLabel: "明確な引用なし", support: "断定を支える根拠なし", judgment: "根拠不足" }
    ],
    caveats: [
      { wording: "有効です", subject: "一般的なGEO施策", effect: "有効性を肯定", tone: "肯定" },
      { wording: "運用が必要です", subject: "継続観測", effect: "実施負荷を示す", tone: "注意" },
      { wording: "Recoraを確認できませんでした", subject: "Recora", effect: "選択肢から除外", tone: "注意" }
    ],
    retrieval: "回答本文・引用1件を取得済み",
    comparison: "Recora未掲載、SignalNest先行を抽出済み"
  },
  a03: {
    fullAnswer: [
      "Recoraは、GPT、Gemini、PerplexityなどのAIサービス上で、自社ブランドがどの質問に掲載され、どの情報源が引用されたかを継続的に確認するためのサービスです。",
      "利用者からは、モデル別の差を同じレポートで確認しやすい点が評価されています。一方、料金や利用開始までの期間については公開情報が限られるため、最新条件を公式窓口で確認する必要があります。"
    ],
    roles: [
      { label: "Recora", value: "説明対象", note: "主語として機能と評価を説明", tone: "green" },
      { label: "Trailbase", value: "未掲載", note: "比較文脈なし" },
      { label: "SignalNest", value: "未掲載", note: "比較文脈なし" },
      { label: "MentionMap", value: "未掲載", note: "比較文脈なし" }
    ],
    claims: [
      { claim: "複数AIサービス上の掲載と引用を確認できる", brand: "Recora", sourceId: "recora-product", sourceLabel: "recora.jp/products/ai-visibility-monitor", support: "公式機能説明に一致", judgment: "一致" },
      { claim: "モデル別の差を確認しやすい", brand: "Recora", sourceId: "saas-review-geo", sourceLabel: "saas-review.example/geo", support: "レビュー本文と概ね一致", judgment: "一致" },
      { claim: "料金の公開情報が限られる", brand: "Recora", sourceLabel: "明確な引用なし", support: "確認対象の範囲が不明", judgment: "要確認" }
    ],
    caveats: [
      { wording: "確認しやすい点が評価されています", subject: "Recora", effect: "使いやすさを肯定", tone: "肯定" },
      { wording: "公開情報が限られる", subject: "料金・導入期間", effect: "検討時の不安を追加", tone: "注意" },
      { wording: "公式窓口で確認する必要があります", subject: "契約条件", effect: "回答だけでは意思決定できない", tone: "中立" }
    ],
    retrieval: "回答本文・引用2件を取得済み",
    comparison: "ブランド単独の説明として抽出済み"
  },
  a04: {
    fullAnswer: [
      "RecoraとTrailbaseはいずれもAI検索上の可視性を確認するサービスですが、重視する運用が異なります。",
      "Recoraは日本語の固定質問を日次で観測し、掲載・引用・競合差を顧客レポートで確認する用途に向いています。Trailbaseは多地域・多言語での比較や幅広い分析を重視する場合の候補です。日本国内で定点観測を始めるならRecora、海外を含めて横断的に比較するならTrailbaseが選択肢になります。"
    ],
    roles: [
      { label: "Recora", value: "第一候補", note: "日本国内・定点観測の条件で推奨", tone: "green" },
      { label: "Trailbase", value: "条件別候補", note: "海外・多言語の条件で推奨", tone: "amber" },
      { label: "SignalNest", value: "未掲載", note: "比較対象外" },
      { label: "MentionMap", value: "未掲載", note: "比較対象外" }
    ],
    claims: [
      { claim: "Recoraは日本語の固定質問を日次観測する", brand: "Recora", sourceId: "recora-product", sourceLabel: "recora.jp/products/ai-visibility-monitor", support: "公式機能説明に一致", judgment: "一致" },
      { claim: "Trailbaseは多地域・多言語比較に対応する", brand: "Trailbase", sourceId: "trailbase-compare", sourceLabel: "trailbase.io/compare/geo-tools", support: "公式説明に一致", judgment: "一致" },
      { claim: "国内ならRecoraが最適である", brand: "Recora", sourceLabel: "複数情報からの推論", support: "選定条件によって変わる", judgment: "要確認" }
    ],
    caveats: [
      { wording: "重視する運用が異なります", subject: "両ブランド", effect: "単純な優劣ではないと補足", tone: "中立" },
      { wording: "日本国内で定点観測を始めるならRecora", subject: "Recora", effect: "条件付きで第一候補", tone: "肯定" },
      { wording: "海外を含めるならTrailbase", subject: "Trailbase", effect: "競合の適合条件を明示", tone: "肯定" }
    ],
    retrieval: "回答本文・引用4件を取得済み",
    comparison: "2ブランドの条件別推奨を抽出済み"
  }
};

function fallbackAnswerProfile(answer: AnswerAnalysisTarget): AnswerProfile {
  const listed = answer.listed.includes("あり") || answer.position !== "—";
  const hasLeadingCompetitor = Boolean(answer.competitorAhead && answer.competitorAhead !== "なし" && answer.competitorAhead !== "判定不可");
  const isMissing = answer.listed === "判定不可" || answer.verification === "判定不可";
  return {
    fullAnswer: [
      isMissing
        ? `「${answer.prompt}」に対する${answer.model}の回答取得に失敗しました。未掲載とは分けて扱います。`
        : `「${answer.prompt}」に対して、${answer.model}は複数の選択肢と判断材料を説明しました。`,
      isMissing
        ? "回答本文・掲載位置・引用URLは取得できていません。再計測後に確認できます。"
        : listed
        ? `Recoraは${answer.position}で掲載され、${answer.citations}件の引用を伴って紹介されています。引用元と主張の対応は個別に確認が必要です。`
        : "この回答ではRecoraの掲載を確認できませんでした。先行する競合と引用元を確認し、不足している説明を特定する必要があります。"
    ],
    roles: [
      { label: "Recora", value: answer.listed, note: `掲載位置: ${answer.position}`, tone: listed ? "green" : "red" },
      { label: hasLeadingCompetitor ? answer.competitorAhead : "競合", value: hasLeadingCompetitor ? "先行" : "先行なし", note: `推奨順: ${answer.recommendationOrder}`, tone: hasLeadingCompetitor ? "amber" : undefined }
    ],
    claims: [
      { claim: "回答内の製品・サービス説明", brand: listed ? "Recora" : answer.competitorAhead || "主要競合", sourceLabel: `${answer.citations}件の引用元`, support: answer.verification, judgment: answer.verification.includes("一致") ? "一致" : "要確認" }
    ],
    caveats: [
      { wording: answer.verification, subject: "回答内の主張", effect: "検証結果を確認", tone: answer.verification.includes("一致") ? "肯定" : "注意" }
    ],
    retrieval: isMissing ? "回答取得失敗・再計測待ち" : `回答本文・引用${answer.citations}件を取得`,
    comparison: hasLeadingCompetitor ? `${answer.competitorAhead}の先行を抽出` : "競合先行なし"
  };
}

export function getAnswerPreviewText(answer: AnswerAnalysisTarget) {
  const profile = answerProfiles[answer.id] ?? fallbackAnswerProfile(answer);
  return profile.fullAnswer[0] ?? "";
}
function caveatBadge(tone: AnswerProfile["caveats"][number]["tone"]) {
  const badgeTone = tone === "肯定" ? "green" : tone === "注意" ? "red" : "default";
  return <DataRichBadge tone={badgeTone}>{tone}</DataRichBadge>;
}

export function AnswerDetailAdvancedPanels({
  reportBase,
  answer,
  promptContext,
  citationUrls = []
}: {
  reportBase: string;
  answer: AnswerAnalysisTarget;
  promptContext?: AnswerPromptContext;
  citationUrls?: readonly string[];
}) {
  const profile = answerProfiles[answer.id] ?? fallbackAnswerProfile(answer);
  const isMissing = answer.listed === "判定不可" || profile.retrieval.includes("失敗") || profile.retrieval.includes("欠測");

  return (
    <>
      <DataRichPanel
        title="AI回答全文"
        description={`${answer.model}が「${answer.prompt}」に返した、保存済みの回答本文です。`}
      >
        <article className="space-y-4 text-[15px] leading-8 text-[#344054]">
          {profile.fullAnswer.map((paragraph, index) => <p key={`${answer.id}-paragraph-${index}`}>{paragraph}</p>)}
        </article>
      </DataRichPanel>

      <DataRichPanel
        title="回答内でのブランドの役割"
        description="同じ回答に登場したブランドを、推奨順・比較対象・単純言及・未掲載に分けます。"
      >
        <LabeledMetricGrid items={profile.roles} />
      </DataRichPanel>

      <DataRichPanel
        title="引用URLと対応する主張"
        description="この回答から取得した全引用URLを取得順で並べ、対応を確認できた主張だけ併記します。"
        bodyClassName={citationUrls.length ? "p-0" : undefined}
      >
        {citationUrls.length ? (
          <ReportDataTable
            columns={["引用URL", "取得順", "対応する主張", "照合状態"]}
            rows={citationUrls.map((url, index) => {
              const claim = profile.claims[index];
              return [
                <SourceLink key={`${answer.id}-citation-${index}`} external href={url} label={url.replace(/^https?:\/\//, "")} />,
                `${index + 1}件目`,
                claim?.claim ?? "対応主張は未特定",
                claim ? judgmentBadge(claim.judgment) : <DataRichBadge key="url-only">URL取得のみ</DataRichBadge>
              ];
            })}
          />
        ) : (
          <p className="text-sm font-semibold text-[#667085]">この回答に引用URLはありません。</p>
        )}
      </DataRichPanel>

      <DataRichPanel
        title="主張と引用元の対応"
        description="この1回の回答でAIが述べた内容ごとに、どの引用元が支えているかと検証結果を確認します。"
        bodyClassName="p-0"
      >
        <ReportDataTable
          columns={["AIの主張", "対象", "引用元", "根拠との対応", "判定"]}
          rows={profile.claims.map((claim) => [
            claim.claim,
            claim.brand,
            claim.sourceId
              ? <SourceLink key={claim.sourceId} href={`${reportBase}/sources/pages/${claim.sourceId}`} label={claim.sourceLabel} />
              : sourceReference(claim.sourceLabel),
            claim.support,
            judgmentBadge(claim.judgment)
          ])}
        />
      </DataRichPanel>

      <DataRichPanel
        title="但し書きと感情表現"
        description="ブランド評価を強めたり弱めたりする文言を、対象と意思決定への影響が分かる形で抜き出します。"
        bodyClassName="p-0"
      >
        <ReportDataTable
          columns={["回答内の表現", "対象", "読み手への影響", "方向"]}
          rows={profile.caveats.map((item) => [
            item.wording,
            item.subject,
            item.effect,
            caveatBadge(item.tone)
          ])}
        />
      </DataRichPanel>

      <DataRichPanel
        title="この回答の取得・判定状態"
        description="未掲載と計測失敗を混同しないため、本文取得、ブランド抽出、引用検証、欠測を別々に示します。"
      >
        <LabeledMetricGrid
          items={[
            { label: "回答取得", value: isMissing ? "失敗" : "成功", note: profile.retrieval, tone: isMissing ? "red" : "green" },
            { label: "ブランド抽出", value: answer.listed, note: profile.comparison, tone: answer.position === "—" ? "amber" : "green" },
            { label: "主張・引用検証", value: answer.verification, note: `${profile.claims.length}主張を確認`, tone: answer.verification.includes("一致") ? "green" : "amber" },
            { label: "欠測", value: isMissing ? "あり" : "なし", note: isMissing ? "集計から除外" : "有効観測として集計", tone: isMissing ? "red" : "green" }
          ]}
        />
        {promptContext ? (
          <PanelNote>
            分類: {promptContext.type} ／ ペルソナ: {promptContext.persona} ／ トピック: {promptContext.topic} ／ フェーズ: {promptContext.phase}
          </PanelNote>
        ) : null}
      </DataRichPanel>
    </>
  );
}
