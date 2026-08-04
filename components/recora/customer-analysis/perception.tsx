"use client";
import Link from "next/link";
import Image from "next/image";
import {
  DataRichBadge,
  DataRichKpiStrip,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  PanelNote,
  ReportDataTable,
  ResponsiveMatrix,
  SourceLink
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";
import { ReportDetailButton, type ReportDetailPayload } from "@/components/recora/report-ui/report-detail-drawer";

const perceptionModelLogoUrls: Record<string, string> = {
  GPT: "/recora/model-logos/openai-blossom.svg",
  Gemini: "/recora/model-logos/gemini.svg",
  Perplexity: "/recora/model-logos/perplexity.svg",
  "Google AI Mode": "/recora/model-logos/google-ai-mode.webp"
};

function PerceptionModelIdentity({ name, iconOnly = false }: { name: string; iconOnly?: boolean }) {
  const logoUrl = perceptionModelLogoUrls[name] ?? perceptionModelLogoUrls.GPT;
  return (
    <span className="inline-flex min-w-0 items-center gap-2" aria-label={name + "のAIモデルロゴ"}>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D8E1DD] bg-white">
        <Image src={logoUrl} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      </span>
      {iconOnly ? null : <span className="min-w-0 text-[12px] font-bold leading-4 text-[#172B25]">{name}</span>}
    </span>
  );
}

type ClaimTone = "red" | "amber" | "green";

type ClaimDetailSeed = {
  name: string;
  verdict: string;
  tone: ClaimTone;
  severity: string;
  answerCount: number;
  modelCount: number;
  continuationDays: number;
  personaCount: number;
  topicCount: number;
  confidence: string;
  aiStatement: string;
  officialFact: string;
  difference: string;
  factKey: string;
  officialUrl: string;
  prompt: string;
  topic: string;
  sources: readonly [string, string];
};

type ClaimAuditSummary = {
  id: string;
  name: string;
  verdict: string;
  severity: string;
  answers: number;
  models: string;
  days: number;
  evidenceAnswers?: ClaimEvidenceAnswer[];
};

type ClaimEvidenceAnswer = {
  id: string;
  promptId: string;
  prompt: string;
  model: string;
  retrievalStatus: string;
  listed: string;
  verification: string;
  citations: number;
  citationUrls: string[];
  persona: string;
  topic: string;
  observedAt: string;
};

const claimDetailSeeds: Record<string, ClaimDetailSeed> = {
  "pricing-old": {
    name: "料金が旧プランの金額で説明されている",
    verdict: "古い",
    tone: "red",
    severity: "高",
    answerCount: 6,
    modelCount: 2,
    continuationDays: 14,
    personaCount: 3,
    topicCount: 4,
    confidence: "高",
    aiStatement: "月額料金は旧プランの金額から利用できる",
    officialFact: "現行プランの料金は公式料金ページを参照",
    difference: "旧金額が残り、現行プラン名と一致しない",
    factKey: "PRICING",
    officialUrl: "https://recora.jp/pricing",
    prompt: "Recoraの料金と利用条件を教えてください。",
    topic: "料金",
    sources: ["saas-review.example/geo", "old-media.example/pricing"]
  },
  "onboarding-missing": {
    name: "導入期間の説明が欠落している",
    verdict: "欠落",
    tone: "amber",
    severity: "中",
    answerCount: 11,
    modelCount: 3,
    continuationDays: 9,
    personaCount: 4,
    topicCount: 3,
    confidence: "中",
    aiStatement: "申込み後の導入期間や初回計測までの手順に触れていない",
    officialFact: "初回設定と質問集合の確定後に計測を開始する",
    difference: "導入判断に必要な開始条件と所要工程が回答から欠落している",
    factKey: "ONBOARDING",
    officialUrl: "https://recora.jp/product",
    prompt: "Recoraは申込みからどのように利用を開始しますか？",
    topic: "導入・運用",
    sources: ["recora.jp/product", "industry-report.example/guides/geo-setup"]
  },
  "competitor-confusion": {
    name: "競合機能がRecoraの機能として説明されている",
    verdict: "競合混同",
    tone: "red",
    severity: "高",
    answerCount: 3,
    modelCount: 1,
    continuationDays: 4,
    personaCount: 2,
    topicCount: 2,
    confidence: "高",
    aiStatement: "Recoraには競合サービス独自の自動施策実行機能がある",
    officialFact: "Recoraは観測・分析結果を提供し、競合独自機能は提供しない",
    difference: "Trailbaseの機能説明がRecoraの機能として結び付けられている",
    factKey: "COMPETITOR",
    officialUrl: "https://recora.jp/features",
    prompt: "RecoraとTrailbaseの機能の違いを教えてください。",
    topic: "競合比較",
    sources: ["trailbase.io/features/automation", "saas-review.example/geo"]
  },
  "model-count": {
    name: "提供モデル数の説明が現在の契約条件と異なる",
    verdict: "条件差分",
    tone: "amber",
    severity: "中",
    answerCount: 2,
    modelCount: 1,
    continuationDays: 3,
    personaCount: 2,
    topicCount: 2,
    confidence: "中",
    aiStatement: "Recoraはすべてのプランで4つのAIサービスを計測する",
    officialFact: "計測対象数は契約プランにより1〜4サービスで決まる",
    difference: "契約プランごとの対象数の違いがAI回答に反映されていない",
    factKey: "MODEL-COUNT",
    officialUrl: "https://recora.jp/pricing",
    prompt: "RecoraではいくつのAIサービスを計測できますか？",
    topic: "導入・運用",
    sources: ["recora.jp/pricing", "recora.jp/features"]
  }
};

function resolveClaimDetailSeed(claimId?: string, claimName?: string): ClaimDetailSeed {
  const known = claimId ? claimDetailSeeds[claimId] : undefined;
  if (known) return known;

  const name = claimName || claimId || "確認対象の主張";
  return {
    name,
    verdict: "要確認",
    tone: "amber",
    severity: "中",
    answerCount: 1,
    modelCount: 1,
    continuationDays: 1,
    personaCount: 1,
    topicCount: 1,
    confidence: "中",
    aiStatement: name,
    officialFact: `${name}に対応する登録済みの公式事実`,
    difference: `${name}と公式事実の表現差を確認`,
    factKey: (claimId || "CUSTOM").toUpperCase(),
    officialUrl: "https://recora.jp/",
    prompt: `${name}について教えてください。`,
    topic: "ブランド認識",
    sources: ["recora.jp", "third-party.example"]
  };
}

export function BrandPerceptionAdvancedPanels({
  reportBase,
  models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"]
}: {
  reportBase: string;
  models?: string[];
}) {
  const vocabularyRows = [
    ["根拠透明性","64回答","31回答","72%","24%","4%","+9回答"],
    ["導入容易性","39回答","58回答","61%","34%","5%","+2回答"],
    ["価格","44回答","67回答","43%","41%","16%","-3回答"],
    ["運用支援","57回答","48回答","68%","29%","3%","+7回答"]
  ];
  const vocabularyContexts = [
    { persona: "マーケ責任者", personaMeta: "28回答", topic: "競合比較", topicMeta: "24回答", example: "根拠となる引用元まで確認できる分析サービスとして説明されています。" },
    { persona: "導入担当", personaMeta: "21回答", topic: "導入・運用", topicMeta: "18回答", example: "初期設定から観測結果の確認まで進めやすいサービスとして説明されています。" },
    { persona: "決裁者", personaMeta: "19回答", topic: "料金", topicMeta: "22回答", example: "価格情報は比較候補として触れられる一方、具体条件の説明には差があります。" },
    { persona: "代理店担当", personaMeta: "24回答", topic: "改善施策", topicMeta: "17回答", example: "継続観測とレポート整理を支えるサービスとして説明されています。" }
  ];
  const vocabularyDetails = vocabularyRows.map((row, rowIndex): ReportDetailPayload => {
    const selfCount = Number.parseInt(row[1], 10);
    const rivalCount = Number.parseInt(row[2], 10);
    const positiveRate = Number.parseInt(row[3], 10);
    const context = vocabularyContexts[rowIndex];
    const modelCount = Math.max(1, models.length);
    const difference = selfCount - rivalCount;
    return {
      kicker: "BRAND LANGUAGE",
      title: "「" + row[0] + "」の語られ方",
      value: "自社 " + row[1],
      summary: "この語彙が自社と競合でどれだけ使われ、どの条件で目立つかを確認します。",
      sections: [
        {
          title: "自社と競合",
          facts: [
            { label: "自社出現", value: row[1], tone: "green" },
            { label: "競合出現", value: row[2] },
            { label: "出現差", value: (difference > 0 ? "+" : "") + difference + "回答", tone: difference >= 0 ? "green" : "amber" },
            { label: "前期間差", value: row[6], tone: row[6].startsWith("-") ? "amber" : "green" }
          ]
        },
        {
          title: "AIモデル別",
          table: {
            columns: ["AIモデル", "自社出現", "肯定"],
            rows: models.map((model, modelIndex) => {
              const count = Math.floor(selfCount / modelCount) + (modelIndex < selfCount % modelCount ? 1 : 0);
              const rateOffset = models.length === 1 ? 0 : [3, -5, 4, -2][modelIndex % 4];
              return [model, count + "回答", Math.max(0, Math.min(100, positiveRate + rateOffset)) + "%"];
            })
          }
        },
        {
          title: "多い条件",
          items: [
            { title: context.persona, meta: context.personaMeta + "・ペルソナ", description: "この語彙が多く現れる顧客像" },
            { title: context.topic, meta: context.topicMeta + "・トピック", description: "この語彙が多く現れる質問領域" }
          ]
        },
        {
          title: "回答での使われ方",
          items: [{ title: row[0], meta: "回答例", description: context.example }]
        }
      ]
    };
  });
  const modelNarratives: Record<string, { category: string; value: string; thin: string }> = {
    GPT: { category: "実務的な監査ツール", value: "根拠確認・観測整理", thin: "料金" },
    Gemini: { category: "SEO分析ツール", value: "導入容易性", thin: "引用元監査" },
    Perplexity: { category: "引用元監査ツール", value: "出典・根拠確認", thin: "料金" },
    "Google AI Mode": { category: "競合比較ツール", value: "比較レポート", thin: "導入事例" }
  };
  const agreementMatrix = [
    [100, 62, 78, 70],
    [62, 100, 58, 64],
    [78, 58, 100, 74],
    [70, 64, 74, 100]
  ];
  const agreementAxes = [
    { label: "市場カテゴリー", value: 75 },
    { label: "主な価値", value: 68 },
    { label: "料金", value: 44 },
    { label: "引用元", value: 82 }
  ];
  const buildPairDetail = (left: string, right: string, leftIndex: number, rightIndex: number): ReportDetailPayload => {
    const score = agreementMatrix[leftIndex][rightIndex];
    const leftNarrative = modelNarratives[left] ?? modelNarratives.GPT;
    const rightNarrative = modelNarratives[right] ?? modelNarratives.GPT;
    return {
      kicker: "MODEL AGREEMENT",
      title: left + " × " + right,
      value: "合意 " + score + "%",
      summary: "同じブランド質問に対する2つのAIの説明が、どこまで一致し、どこで分かれるかを確認します。",
      sections: [
        {
          title: "共通している認識",
          items: (score >= 75 ? ["AI検索可視性", "根拠確認"] : ["AI検索分析"]).map((item) => ({ title: item, description: "両方のAIで繰り返し現れる説明" }))
        },
        {
          title: "異なる認識",
          table: {
            columns: ["AIモデル", "市場カテゴリー", "主な価値", "説明が薄い情報"],
            rows: [
              [left, leftNarrative.category, leftNarrative.value, leftNarrative.thin],
              [right, rightNarrative.category, rightNarrative.value, rightNarrative.thin]
            ]
          }
        },
        {
          title: "差が大きい条件",
          items: [
            { title: "料金", meta: "トピック", description: "説明の具体性に差が出やすい質問領域" },
            { title: "決裁者", meta: "ペルソナ", description: "価値の説明が分かれやすい顧客像" }
          ]
        }
      ]
    };
  };
  const agreementPairs = models.flatMap((left, leftIndex) =>
    models.slice(leftIndex + 1).map((right, offset) => {
      const rightIndex = leftIndex + offset + 1;
      return { left, right, leftIndex, rightIndex, score: agreementMatrix[leftIndex][rightIndex] };
    })
  );
  const themeRows = ["Recora", "Trailbase", "SignalNest", "MentionMap", "RankLens", "AnswerGrid"];
  const themeColumns = ["根拠透明性", "価格", "導入容易性", "運用支援", "第三者評価"];
  const themeValues = [
    [76, 52, 61, 72, 43],
    [58, 64, 69, 63, 67],
    [62, 55, 66, 57, 61],
    [49, 59, 54, 51, 72],
    [55, 71, 48, 58, 65],
    [67, 46, 57, 60, 54]
  ];
  const themeRowLabels = themeRows.map((brand) => (
    <span key={brand} className="inline-flex min-w-0 items-center gap-2">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#D8E1DD] bg-[#F5F8F6] text-[10px] font-black text-[#173F34]">{brand.slice(0, 1)}</span>
      <span className="break-words">{brand}</span>
    </span>
  ));
  const themeCellDetails = (brand: string, rowIndex: number, axis: string, columnIndex: number, value: number): ReportDetailPayload => {
    const rankedBrands = themeRows.map((name, index) => ({ name, value: themeValues[index][columnIndex] })).sort((left, right) => right.value - left.value);
    const rank = rankedBrands.findIndex((item) => item.name === brand) + 1;
    const recoraValue = themeValues[0][columnIndex];
    const leader = rankedBrands[0];
    const comparisonDifference = brand === "Recora" ? value - leader.value : value - recoraValue;
    const personas = ["マーケ責任者", "決裁者", "導入担当", "代理店担当", "編集担当"];
    const topics = ["競合比較", "料金", "導入・運用", "改善施策", "ブランド印象"];
    return {
      kicker: "BRAND × THEME",
      title: brand + " × " + axis,
      value: value + "%",
      summary: "この判断軸がブランドとどれだけ強く結びつき、同じ軸で他ブランドとどう違うかを確認します。",
      sections: [
        {
          title: "市場内での位置",
          facts: [
            { label: "ブランド", value: brand },
            { label: "比較軸", value: axis },
            { label: "結びつき", value: value + "%", tone: value >= 65 ? "green" : "default" },
            { label: "市場内順位", value: rank + "位 / " + themeRows.length + "社" },
            { label: brand === "Recora" ? "首位との差" : "Recoraとの差", value: (comparisonDifference > 0 ? "+" : "") + comparisonDifference + "pt", tone: comparisonDifference >= 0 ? "green" : "amber" }
          ]
        },
        {
          title: "同じ比較軸のブランド順位",
          table: { columns: ["順位", "ブランド", "結びつき"], rows: rankedBrands.map((item, index) => [String(index + 1), item.name, item.value + "%"]) }
        },
        {
          title: "AIモデル別",
          table: {
            columns: ["AIモデル", "結びつき"],
            rows: models.map((model, modelIndex) => [model, Math.max(0, Math.min(100, value + [4, -3, 1, 6][modelIndex % 4])) + "%"])
          }
        },
        {
          title: "多い条件",
          items: [
            { title: personas[columnIndex], meta: "ペルソナ", description: "この結びつきが現れやすい顧客像" },
            { title: topics[columnIndex], meta: "トピック", description: "この結びつきが現れやすい質問領域" }
          ]
        },
        {
          title: "回答での語られ方",
          items: [{ title: axis, meta: brand, description: brand + "は「" + axis + "」の文脈で比較・説明されています。" }]
        }
      ]
    };
  };
  return (
    <>
      <DataRichPanel title="ブランド語彙・メッセージ差" description="自社出現は件数です。肯定・中立・否定は、その語彙が自社文脈で出現した有効回答を分母にした構成比です。">
        <div className="hidden md:block">
          <ReportDataTable
            columns={["語彙","自社出現","競合出現","肯定","中立","否定","前期間差"]}
            rows={vocabularyRows}
            rowDetails={vocabularyDetails}
          />
        </div>
        <div className="divide-y divide-[#E5EAE8] md:hidden">
          {vocabularyRows.map((row, rowIndex) => (
            <ReportDetailButton
              key={row[0]}
              detail={vocabularyDetails[rowIndex]}
              label={row[0] + "の内訳を開く"}
              className="!flex w-full justify-between rounded-none px-3 py-3 text-left hover:bg-[#F8FAF9] focus-visible:ring-inset focus-visible:ring-offset-0"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-bold text-[#1D2939]">{row[0]}</span>
                  <span className="text-[13px] font-black tabular-nums text-[#075E44]">{row[1]}</span>
                </span>
                <span className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-semibold text-[#667085]">
                  <span>競合 <strong className="block text-[12px] text-[#344054]">{row[2]}</strong></span>
                  <span>肯定 <strong className="block text-[12px] text-[#344054]">{row[3]}</strong></span>
                  <span>前期間差 <strong className="block text-[12px] text-[#344054]">{row[6]}</strong></span>
                </span>
              </span>
            </ReportDetailButton>
          ))}
        </div>
      </DataRichPanel>
      {models.length > 1 ? (
        <DataRichPanel
          title="モデル間のナラティブ合意"
          description="同じブランド質問に対するAI同士の説明一致度を、モデルペアと認識軸で比較します。"
          bodyClassName="p-0"
          variant="comparison"
        >
          <div className="hidden md:block">
            <div
              className="grid items-stretch border-b border-[#D8E1DD] bg-[#F5F8F6]"
              style={{ gridTemplateColumns: "200px repeat(" + models.length + ", minmax(0, 1fr))" }}
            >
              <div className="flex min-h-[66px] items-center px-5 text-[11px] font-bold text-[#667085]">比較するAI</div>
              {models.map((model) => (
                <div key={model} className="flex min-h-[66px] items-center border-l border-[#D8E1DD] px-3">
                  <PerceptionModelIdentity name={model} />
                </div>
              ))}
            </div>
            {models.map((left, leftIndex) => (
              <div
                key={left}
                className="grid border-b border-[#E5EAE8] last:border-b-0"
                style={{ gridTemplateColumns: "200px repeat(" + models.length + ", minmax(0, 1fr))" }}
              >
                <div className="flex min-h-[72px] items-center px-5"><PerceptionModelIdentity name={left} /></div>
                {models.map((right, rightIndex) => {
                  const score = agreementMatrix[leftIndex][rightIndex];
                  const background = score >= 80 ? "#DDF2E8" : score >= 65 ? "#EAF4EF" : score >= 50 ? "#F5EEE2" : "#FBE7E1";
                  if (leftIndex === rightIndex) {
                    return <div key={right} className="flex min-h-[72px] flex-col items-center justify-center border-l border-[#D8E1DD] bg-[#F8FAF9]"><strong className="text-[16px] text-[#475467]">100%</strong><span className="text-[9px] font-bold text-[#98A2B3]">同一AI</span></div>;
                  }
                  return (
                    <ReportDetailButton
                      key={right}
                      detail={buildPairDetail(left, right, leftIndex, rightIndex)}
                      showIcon={false}
                      label={left + "と" + right + "の合意を詳しく見る"}
                      className="!flex min-h-[72px] w-full justify-center rounded-none border-l border-[#D8E1DD] hover:brightness-[0.98] focus-visible:ring-inset focus-visible:ring-offset-0"
                      style={{ backgroundColor: background }}
                    >
                      <span className="text-[18px] font-black tabular-nums text-[#173F34]">{score}%</span>
                    </ReportDetailButton>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="divide-y divide-[#E5EAE8] md:hidden">
            {agreementPairs.map((pair) => (
              <ReportDetailButton
                key={pair.left + "-" + pair.right}
                detail={buildPairDetail(pair.left, pair.right, pair.leftIndex, pair.rightIndex)}
                label={pair.left + "と" + pair.right + "の合意を詳しく見る"}
                className="!flex w-full justify-between rounded-none px-4 py-3 hover:bg-[#F8FAF9] focus-visible:ring-inset focus-visible:ring-offset-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PerceptionModelIdentity name={pair.left} iconOnly />
                  <span className="text-[12px] font-bold text-[#344054]">×</span>
                  <PerceptionModelIdentity name={pair.right} iconOnly />
                  <span className="min-w-0 text-[11px] font-semibold leading-4 text-[#667085]">{pair.left}<br />{pair.right}</span>
                </span>
                <strong className="text-[17px] font-black tabular-nums text-[#075E44]">{pair.score}%</strong>
              </ReportDetailButton>
            ))}
          </div>
          <div className="border-t border-[#D8E1DD] px-4 py-5 sm:px-5">
            <h3 className="text-[12px] font-bold text-[#1D2939]">認識軸別の合意</h3>
            <div className="mt-3 divide-y divide-[#E5EAE8]">
              {agreementAxes.map((axis) => (
                <div key={axis.label} className="grid grid-cols-[108px_minmax(0,1fr)_44px] items-center gap-3 py-2.5 sm:grid-cols-[160px_minmax(0,1fr)_52px]">
                  <span className="text-[11px] font-bold text-[#475467]">{axis.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#E8EEEB]"><span className="block h-full rounded-full bg-[#0B6B57]" style={{ width: axis.value + "%" }} /></span>
                  <strong className="text-right text-[12px] tabular-nums text-[#173F34]">{axis.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </DataRichPanel>
      ) : null}
      <DataRichPanel title="競合テーマ行列" description="Recoraと上位5社について、AIがブランドと結びつける判断軸を比較します。">
        <ResponsiveMatrix
          rows={themeRows}
          rowLabels={themeRowLabels}
          columns={themeColumns}
          values={themeValues}
          cellDetails={themeCellDetails}
          mobileCompact
        />
      </DataRichPanel>
    </>
  );
}

export function ClaimDetailContent({
  reportBase,
  models = ["GPT", "Gemini"],
  claimId,
  claimName,
  claimSummary
}: {
  reportBase: string;
  models?: string[];
  claimId?: string;
  claimName?: string;
  claimSummary?: ClaimAuditSummary;
}) {
  const seed = resolveClaimDetailSeed(claimId, claimName);
  const summaryModels = claimSummary?.models === "対象外" ? [] : claimSummary?.models.split(" / ") ?? [];
  const selectedModels = claimSummary
    ? summaryModels.filter((model) => models.includes(model))
    : models.slice(0, Math.min(seed.modelCount, models.length));
  const evidenceAnswers = claimSummary?.evidenceAnswers ?? [];
  const primaryEvidence = evidenceAnswers.find((answer) => answer.retrievalStatus === "取得済み");
  const primaryAnswerHref = primaryEvidence
    ? reportBase + "/conversations/" + primaryEvidence.id
    : undefined;
  const claim = claimSummary ? {
    ...seed,
    name: claimSummary.name,
    verdict: claimSummary.verdict,
    tone: claimSummary.severity === "高" ? "red" as const : "amber" as const,
    severity: claimSummary.severity,
    answerCount: claimSummary.answers,
    modelCount: selectedModels.length,
    continuationDays: claimSummary.days
  } : seed;
  return (
    <>
      <DataRichKpiStrip layout="rows" columns="xl:grid-cols-5" items={[
        { label: "主張", value: claim.name, helper: "AI回答内で繰り返された表現", tone: claim.tone },
        { label: "該当回答", value: `${claim.answerCount}件`, helper: "この主張が出現した有効回答" },
        { label: "該当モデル", value: `${Math.min(claim.modelCount, models.length)}モデル`, helper: selectedModels.join(" / ") || "該当なし" },
        { label: "影響範囲", value: `${claim.personaCount}ペルソナ`, helper: `${claim.topicCount}トピック` },
        { label: "継続", value: `${claim.continuationDays}日`, helper: "選択期間内の連続観測" }
      ]} />
      <DataRichPanel title="主張の出現概要" description="どの回答・AIモデル・ペルソナ・トピックで、この主張が繰り返されたかを確認します。">
        <ReportDataTable
          columns={["主張", "該当回答", "AIモデル", "主なペルソナ", "主なトピック", "回答"]}
          rows={[[
            claim.aiStatement,
            `${claim.answerCount}件`,
            selectedModels.join(" / ") || "該当なし",
            `${claim.personaCount}ペルソナ`,
            `${claim.topicCount}トピック`,
            primaryAnswerHref
              ? <Link key="answer" href={primaryAnswerHref} className="font-bold text-[#075E44] underline">最新の回答全文</Link>
              : <span key="answer" className="font-semibold text-[#667085]">該当観測なし</span>
          ]]}
          rowDetails={[{
            kicker: "CLAIM OCCURRENCE",
            title: `AI回答に出現した「${claim.name}」`,
            summary: `${claim.answerCount}件の回答で確認された主張を、回答・AIモデル・質問条件へ分けて表示します。`,
            sections: [{
              title: "最新の代表観測",
              facts: [
                { label: "回答ID", value: primaryEvidence?.id ?? "該当観測なし" },
                { label: "観測日時", value: primaryEvidence?.observedAt ?? "該当観測なし" },
                { label: "AIモデル", value: primaryEvidence?.model ?? "該当観測なし" },
                { label: "プロンプト", value: primaryEvidence?.prompt ?? "該当観測なし" },
                { label: "回答内の主張", value: claim.aiStatement }
              ]
            }],
            detailHref: primaryAnswerHref,
            detailLabel: primaryAnswerHref ? "回答全文を開く" : undefined
          }]}
        />
      </DataRichPanel>
      <DataRichPanel
        title="出現回答・引用元"
        description={`「${claim.name}」の該当回答${claim.answerCount}件から、各該当モデルの最新代表観測を表示します。`}
      >
        <div className="space-y-4">
          <PanelNote>一覧は該当回答総数ではなく、該当モデルごとに最新日の代表観測を1件ずつ表示しています。回答全文と引用元は同じ観測に紐づきます。</PanelNote>
          <ReportDataTable
            columns={["観測日", "モデル", "ペルソナ", "トピック", "引用元", "取得・検証・引用数", "回答"]}
            rowDetails={evidenceAnswers.map((answer) => ({
              kicker: "REPRESENTATIVE OBSERVATION",
              title: answer.model + "の代表観測",
              summary: answer.retrievalStatus === "取得済み"
                ? "この一覧行と同じ最新代表観測です。回答・プロンプト・モデル・引用元を同じ回答IDで確認します。"
                : "このモデルの最新計測は回答を取得できていません。取得状態と対象プロンプトを確認します。",
              sections: [
                {
                  title: "代表観測の回答と主張",
                  facts: [
                    { label: "回答ID", value: answer.id },
                    { label: "AIモデル", value: answer.model },
                    { label: "プロンプト", value: answer.prompt },
                    { label: "取得状態", value: answer.retrievalStatus },
                    { label: "観測日時", value: answer.observedAt },
                    { label: answer.retrievalStatus === "取得済み" ? "回答内の主張" : "判定対象の主張", value: claim.aiStatement }
                  ]
                },
                {
                  title: "この回答の引用元",
                  facts: answer.citationUrls.length > 0
                    ? answer.citationUrls.map((url, index) => ({ label: "引用" + (index + 1), value: url }))
                    : [{ label: "引用元", value: "引用なし" }]
                }
              ],
              detailHref: answer.retrievalStatus === "取得済み" ? reportBase + "/conversations/" + answer.id : undefined,
              detailLabel: answer.retrievalStatus === "取得済み" ? "この回答全文を開く" : undefined
            }))}
            rows={evidenceAnswers.length > 0 ? evidenceAnswers.map((answer) => [
              answer.observedAt.slice(5, 10).replace("-", "/"),
              answer.model,
              answer.persona,
              answer.topic,
              answer.citationUrls.length > 0
                ? <div key={answer.id + "-sources"} className="space-y-1">
                    {answer.citationUrls.map((url) => <SourceLink key={url} external href={url} label={url} />)}
                  </div>
                : "引用なし",
              answer.retrievalStatus + " / " + answer.verification + " / 引用" + answer.citations + "件",
              answer.retrievalStatus === "取得済み"
                ? <Link key={answer.id} href={reportBase + "/conversations/" + answer.id} className="font-bold text-[#075E44] underline">全文</Link>
                : <span key={answer.id} className="font-semibold text-[#667085]">該当観測なし</span>
            ]) : [["—", "該当観測なし", "—", "—", "—", "—", "—"]]}
          />
        </div>
      </DataRichPanel>
    </>
  );
}
