"use client";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  DataRichBadge,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  DetailLink,
  MentionCitationQuadrant,
  MetricSegments,
  MetricLineChart,
  ReportDataTable,
  ResponsiveMatrix,
  SourceLink
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

const citationModelLogos: Record<string, { src: string; background: string }> = {
  GPT: { src: "/recora/model-logos/openai-blossom.svg", background: "#E8F3EE" },
  Gemini: { src: "/recora/model-logos/gemini.svg", background: "#EEF2FF" },
  Perplexity: { src: "/recora/model-logos/perplexity.svg", background: "#E6F7F7" },
  "Google AI Mode": { src: "/recora/model-logos/google-ai-mode.webp", background: "#F7F8FA" }
};

function CitationModelIdentity({ name }: { name: string }) {
  const logo = citationModelLogos[name];
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-[#101828]">
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/5 text-[10px] font-bold text-[#075E44]"
        style={{ backgroundColor: logo?.background ?? "#F2F4F7" }}
        aria-label={name + "のAIモデルロゴ"}
      >
        {logo ? <Image src={logo.src} alt="" width={20} height={20} className="h-full w-full object-contain p-1" /> : name.slice(0, 1)}
      </span>
      <span className="min-w-0">{name}</span>
    </span>
  );
}

function CitationModelPair({ left, right }: { left: string; right: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2" aria-label={left + "と" + right}>
      <CitationModelIdentity name={left} />
      <span className="text-[#98A2B3]" aria-hidden="true">×</span>
      <CitationModelIdentity name={right} />
    </span>
  );
}
const personas=["導入担当","決裁者","マーケ責任者","編集担当","代理店担当"];
const sources=["recora.jp","marketing-ai.jp","saas-review.example","trailbase.io","community.example"];

const sourceAccessStates = [
  { label: "取得可能", count: 21, color: "#0B6B57" },
  { label: "リダイレクト", count: 3, color: "#4F7B6E" },
  { label: "ログイン必須", count: 1, color: "#B7791F" },
  { label: "ペイウォール", count: 1, color: "#D09A45" },
  { label: "ブロック", count: 1, color: "#B65F4A" },
  { label: "リンク切れ", count: 1, color: "#9F3A38" },
  { label: "未確認", count: 2, color: "#98A2B3" }
];

const sourceStateRows = [
  { access: "リダイレクト", tone: "amber" as const, url: "https://recora.jp/old/ai-visibility", finalUrl: "https://recora.jp/products/ai-visibility-monitor", sourceText: "確認済み", freshness: "更新確認", affectedAnswers: 8, topic: "導入・運用", modelIndexes: [0, 2] },
  { access: "リダイレクト", tone: "amber" as const, url: "https://trailbase.io/geo/legacy", finalUrl: "https://trailbase.io/compare/geo-tools", sourceText: "確認済み", freshness: "更新確認", affectedAnswers: 6, topic: "競合比較", modelIndexes: [0, 1] },
  { access: "リダイレクト", tone: "amber" as const, url: "https://marketing-ai.jp/research/2025", finalUrl: "https://marketing-ai.jp/research/ai-search-2026", sourceText: "確認済み", freshness: "更新確認", affectedAnswers: 5, topic: "市場動向", modelIndexes: [2, 3] },
  { access: "ログイン必須", tone: "amber" as const, url: "https://saas-review.example/member/geo-tools", finalUrl: null, sourceText: "本文取得不可", freshness: "日付不明", affectedAnswers: 4, topic: "第三者評価", modelIndexes: [1, 2] },
  { access: "ペイウォール", tone: "amber" as const, url: "https://analyst-note.example/report/ai-search", finalUrl: null, sourceText: "一部確認", freshness: "2026年更新", affectedAnswers: 3, topic: "市場動向", modelIndexes: [0, 3] },
  { access: "ブロック", tone: "red" as const, url: "https://community.example/thread/ai-visibility", finalUrl: null, sourceText: "本文取得不可", freshness: "日付不明", affectedAnswers: 3, topic: "評判・口コミ", modelIndexes: [1, 2] },
  { access: "リンク切れ", tone: "red" as const, url: "https://old-media.example/report/geo-2024", finalUrl: null, sourceText: "取得不可", freshness: "古い可能性", affectedAnswers: 2, topic: "市場動向", modelIndexes: [0] },
  { access: "未確認", tone: "default" as const, url: "https://vendor-catalog.example/listing/recora", finalUrl: null, sourceText: "未確認", freshness: "日付不明", affectedAnswers: 2, topic: "ブランド印象", modelIndexes: [1, 3] },
  { access: "未確認", tone: "default" as const, url: "https://public-data.example/ai-search-index", finalUrl: null, sourceText: "未確認", freshness: "日付不明", affectedAnswers: 1, topic: "引用元", modelIndexes: [2] }
];

function SourceStatePanel({ models }: { models: string[] }) {
  const totalSources = sourceAccessStates.reduce((sum, state) => sum + state.count, 0);
  const modelNamesFor = (indexes: number[]) => models.length
    ? Array.from(new Set(indexes.map((index) => models[index % models.length])))
    : [];

  return (
    <DataRichPanel
      title="参照元の状態"
      description="引用量の増減とは分けて、引用URLのアクセス可否・本文確認・鮮度を確認します。"
      bodyClassName="p-0"
    >
      <div className="border-b border-[#DDE5E1] bg-[#FAFCFB] px-5 py-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#E8EEEB]" role="img" aria-label="引用URLのアクセス状態構成">
          {sourceAccessStates.map((state) => (
            <span
              key={state.label}
              style={{ width: (state.count / totalSources * 100) + "%", backgroundColor: state.color }}
              aria-label={state.label + " " + state.count + "URL"}
            />
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {sourceAccessStates.map((state) => (
            <li key={state.label} className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#475467]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: state.color }} aria-hidden="true" />
              <span>{state.label}</span>
              <strong className="tabular-nums text-[#101828]">{state.count}URL</strong>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] leading-5 text-[#667085]">下表は「取得可能」以外の9URLです。状態を押すと、そのURLが使われた回答とAIモデルまで確認できます。</p>
      </div>
      <div className="max-md:[&_tr]:!grid max-md:[&_tr]:!grid-cols-[minmax(0,1fr)_auto] max-md:[&_td]:!border-0 max-md:[&_td]:!px-4 max-md:[&_td]:!py-2.5 max-md:[&_td]:before:!hidden max-md:[&_td:nth-child(2)]:!col-span-2 max-md:[&_td:nth-child(2)]:!pt-0 max-md:[&_td:nth-child(3)]:hidden max-md:[&_td:nth-child(4)]:hidden">
      <ReportDataTable
        columns={["状態", "参照元URL", "本文確認", "鮮度", "引用回答数"]}
        rows={sourceStateRows.map((row) => {
          const displayUrl = row.url.replace(/^https?:\/\//, "");
          return [
            <DataRichBadge key={row.url + "-status"} tone={row.tone}>{row.access}</DataRichBadge>,
            <a key={row.url} href={row.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-start gap-1.5 font-semibold text-[#075E44] underline underline-offset-2">
              <span className="[overflow-wrap:anywhere]">{displayUrl}</span>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">を新しいタブで開く</span>
            </a>,
            row.sourceText,
            row.freshness,
            row.affectedAnswers + "回答"
          ];
        })}
        rowDetails={sourceStateRows.map((row) => {
          const modelNames = modelNamesFor(row.modelIndexes);
          return {
            kicker: "SOURCE STATUS",
            title: row.url.replace(/^https?:\/\//, ""),
            value: row.access,
            summary: "この参照元のアクセス可否・本文確認・鮮度と、引用回答への影響を分けて確認します。",
            sections: [
              {
                title: "現在の状態",
                facts: [
                  { label: "アクセス状態", value: row.access, tone: row.tone },
                  { label: "引用URL", value: row.url },
                  { label: "最終URL", value: row.finalUrl ?? "変更なし" },
                  { label: "本文確認", value: row.sourceText },
                  { label: "鮮度", value: row.freshness },
                  { label: "最終確認日", value: "2026/07/06" }
                ]
              },
              {
                title: "引用回答への影響",
                facts: [
                  { label: "引用された回答", value: row.affectedAnswers + "回答" },
                  { label: "出現AIモデル", value: modelNames.join(" / ") || "—" },
                  { label: "主なトピック", value: row.topic }
                ]
              },
              {
                title: "このURLが使われた質問",
                items: [
                  { title: row.topic + "で参考になる情報源は？", meta: modelNames[0] ?? models[0] ?? "—", description: row.affectedAnswers + "回答のうち、このURLを含む回答を確認" },
                  { title: row.topic + "の判断基準を教えて", meta: modelNames[1] ?? modelNames[0] ?? models[0] ?? "—", description: "同じURLが別の説明で使われた回答" }
                ]
              }
            ]
          };
        })}
      />
      </div>
    </DataRichPanel>
  );
}

type CitationAdvancedSection = "branch" | "audience" | "dynamics" | "competition" | "state";

export function CitationAdvancedPanels({
  reportBase,
  models=["GPT","Gemini","Perplexity","Google AI Mode"],
  section
}: {
  reportBase:string;
  models?:string[];
  section:CitationAdvancedSection;
}) {
  const [citationTrendRange, setCitationTrendRange] = useState<"7日" | "30日" | "90日">("30日");
  const citationTrend = citationTrendRange === "7日"
    ? { labels: ["6/30", "7/1", "7/2", "7/3", "7/4", "7/5", "7/6"], official: [104, 108, 106, 112, 116, 119, 124], thirdParty: [88, 90, 91, 89, 94, 96, 98], competitor: [76, 74, 79, 81, 80, 78, 77] }
    : citationTrendRange === "90日"
      ? { labels: ["4/8", "4/20", "5/2", "5/14", "5/26", "6/7", "6/19", "7/6"], official: [71, 76, 82, 89, 94, 103, 112, 124], thirdParty: [79, 82, 84, 87, 90, 92, 95, 98], competitor: [91, 89, 87, 84, 83, 81, 79, 77] }
      : { labels: ["6/7", "6/11", "6/15", "6/19", "6/23", "6/27", "7/1", "7/6"], official: [92, 96, 99, 101, 108, 113, 118, 124], thirdParty: [87, 88, 90, 92, 91, 94, 96, 98], competitor: [84, 83, 82, 81, 80, 79, 78, 77] };
  const citationRangeControl = (
    <div className="inline-flex rounded-md border border-[#C7D2CC] bg-white p-1" role="group" aria-label="引用回答数の表示期間">
      {(["7日", "30日", "90日"] as const).map((range) => (
        <button key={range} type="button" aria-pressed={citationTrendRange === range} onClick={() => setCitationTrendRange(range)} className={citationTrendRange === range ? "min-h-8 rounded px-3 text-[11px] font-bold bg-[#0B382D] text-white" : "min-h-8 rounded px-3 text-[11px] font-bold text-[#667085] hover:bg-[#F1F8F5]"}>{range}</button>
      ))}
    </div>
  );
  const modelComparisonPairs = models.flatMap((model, index) =>
    models.slice(index + 1).map((comparisonModel) => [model, comparisonModel] as const)
  );
  const modelComparisonMetrics = [
    { agreement: 42, common: 12, exclusive: 17, answers: 118 },
    { agreement: 51, common: 16, exclusive: 15, answers: 121 },
    { agreement: 47, common: 14, exclusive: 16, answers: 116 },
    { agreement: 45, common: 13, exclusive: 16, answers: 119 },
    { agreement: 54, common: 17, exclusive: 14, answers: 122 },
    { agreement: 49, common: 15, exclusive: 15, answers: 117 }
  ];
  return (
    <>
      {section === "branch" ? (
        <DataRichPanel title="回答結果と情報源の分岐" description="ブランド掲載と自社引用を別々に判定し、4つの状態で比較します。">
          <MentionCitationQuadrant models={models} />
        </DataRichPanel>
      ) : null}
      {section === "audience" ? (
        <>
      <DataRichPanel title="ペルソナ別引用元ランキング" description="ペルソナごとにAIが最も参照したドメインを比較します。">
        <ReportDataTable detailType="persona-source-ranking" columns={["ペルソナ","1位","2位","3位","Top1依存","回答カバー","詳細"]} rows={personas.map((persona,index)=>[
          persona,sources[index%sources.length],sources[(index+1)%sources.length],sources[(index+2)%sources.length],
          [26,31,24,29,34][index]+"%",[312,284,358,276,251][index]+"回答",
          <Link key={persona} href={reportBase+"/persona-topics/personas/"+["implementation","decision-maker","marketing-lead","editor","agency"][index]} className="font-bold text-[#075E44] underline">ペルソナ詳細</Link>
        ])} />
      </DataRichPanel>
      <DataRichPanel title="トピック × 引用元" description="各トピックの回答で、どの情報源が使用されたか。">
        <ResponsiveMatrix detailType="topic-source" rows={["料金","競合比較","引用元","導入・運用","改善施策","ブランド印象"]} columns={sources.slice(0,4)} values={[
          [44,28,52,61],[38,66,57,72],[59,74,41,53],[71,43,32,45],[62,68,47,51],[55,39,69,58]
        ]} />
      </DataRichPanel>
        </>
      ) : null}
      {section === "dynamics" ? (
        <>
      <DataRichPanel title="引用回答数の推移" description="自社公式・第三者・競合公式が引用された回答数を、グラフ内の期間だけ切り替えて比較します。">
        <div className="mb-4 flex justify-end">{citationRangeControl}</div>
        <MetricLineChart
          labels={citationTrend.labels}
          unit="回答"
          deltaUnit="回答"
          observations={citationTrendRange + "の引用回答"}
          detailType="citation"
          series={[
            { name: "自社公式", values: citationTrend.official, color: "#075E44" },
            { name: "第三者", values: citationTrend.thirdParty, color: "#667085" },
            { name: "競合公式", values: citationTrend.competitor, color: "#B54708" }
          ]}
        />
      </DataRichPanel>
      <DataRichPanel title="引用元の獲得・消失・上昇・下降" description="前期間と同じ質問・モデルを比較し、新規と消失を分離します。">
        <ReportDataTable detailType="source-change" columns={["状態","引用元","前期間","今期間","変化","主なトピック","詳細"]} rows={[
          [<DataRichBadge key="1" tone="green">新規</DataRichBadge>,"industry-report.example","0回答","18回答","+18","引用元",<SourceLink key="2" href={reportBase+"/sources/domains/industry-report"} label="詳細" />],
          [<DataRichBadge key="3" tone="green">上昇</DataRichBadge>,"marketing-ai.jp","54回答","76回答","+22","競合比較",<SourceLink key="4" href={reportBase+"/sources/domains/marketing-ai-jp"} label="詳細" />],
          [<DataRichBadge key="5" tone="amber">下降</DataRichBadge>,"saas-review.example","61回答","48回答","-13","ブランド印象",<SourceLink key="6" href={reportBase+"/sources/domains/saas-review"} label="詳細" />],
          [<DataRichBadge key="7" tone="red">消失</DataRichBadge>,"old-media.example","15回答","0回答","-15","料金",<SourceLink key="8" href={reportBase+"/sources/domains/old-media"} label="詳細" />]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="参照元集中度" description="引用数が多くても、一部ドメインやモデルへ集中していないかを確認します。">
        <MetricSegments detailType="source-concentration" rows={[
          {label:"Top1シェア",value:31,helper:"最大ドメインの回答カバー比率",tone:"amber"},
          {label:"Top3シェア",value:68,helper:"上位3ドメインの回答カバー比率",tone:"amber"},
          {label:"特定モデル依存",value:24,helper:"1モデルだけが使う引用元",tone:"green"},
          {label:"特定ペルソナ依存",value:29,helper:"1ペルソナに偏る引用元",tone:"green"}
        ]} />
      </DataRichPanel>
      {modelComparisonPairs.length > 0 ? (
        <DataRichPanel title="モデル間の引用元一致・排他性" description="同じ質問で各モデルが使ったドメイン集合の一致度と、特定モデルだけの情報源です。">
          <div className="max-md:[&_tr]:!grid max-md:[&_tr]:!grid-cols-[minmax(0,1fr)_auto] max-md:[&_td]:!border-0 max-md:[&_td]:!px-4 max-md:[&_td]:!py-2.5 max-md:[&_td]:before:!hidden max-md:[&_td:nth-child(3)]:hidden max-md:[&_td:nth-child(4)]:hidden max-md:[&_td:nth-child(5)]:hidden">
          <ReportDataTable
            detailType="source-overlap"
            columns={["モデル組み合わせ","引用元一致度","共通ドメイン","片方だけ","比較回答"]}
            rows={modelComparisonPairs.map(([model, comparisonModel], index) => {
              const metric = modelComparisonMetrics[index % modelComparisonMetrics.length];
              return [
                <CitationModelPair key={model + "-" + comparisonModel} left={model} right={comparisonModel} />,
                metric.agreement + "%",
                metric.common + "件",
                metric.exclusive + "件",
                metric.answers + "回答"
              ];
            })}
          />
          </div>
        </DataRichPanel>
      ) : null}
        </>
      ) : null}
      {section === "state" ? <SourceStatePanel models={models} /> : null}
      {section === "competition" ? (
        <>
      <DataRichPanel title="競合敗北時の引用元ランキング" description="自社未掲載・競合掲載の回答だけに絞り、その回答で使われた情報源を確認します。">
        <ReportDataTable detailType="competitor-loss-source-ranking" columns={["順位","引用元","敗北回答カバー","先行競合","ペルソナ横断","トピック横断","詳細"]} rows={[
          ["1","trailbase.io","57回答","Trailbase","4ペルソナ","5トピック",<SourceLink key="1" href={reportBase+"/sources/domains/trailbase-io"} label="詳細" />],
          ["2","saas-review.example","43回答","Trailbase / SignalNest","5ペルソナ","4トピック",<SourceLink key="2" href={reportBase+"/sources/domains/saas-review"} label="詳細" />],
          ["3","community.example","31回答","MentionMap","3ペルソナ","3トピック",<SourceLink key="3" href={reportBase+"/sources/domains/community"} label="詳細" />]
        ]} />
      </DataRichPanel>
        </>
      ) : null}
      {section === "dynamics" ? (
        <>
      <DataRichPanel title="引用置き換わり" description="同じ質問・モデルで、前期間から別の引用元へ置き換わった組み合わせです。">
        <ReportDataTable detailType="source-replacement" columns={["置き換え前","置き換え後","回答数","主なモデル","主なトピック","ブランド掲載への影響"]} rows={[
          ["recora.jp/guide","trailbase.io/compare","14回答","GPT","競合比較","自社掲載 -8件"],
          ["old-media.example/report","marketing-ai.jp/research","11回答","Perplexity","引用元","自社掲載 +5件"],
          ["saas-review.example/old","community.example/thread","8回答","Gemini","ブランド印象","変化なし"]
        ]} />
      </DataRichPanel>
        </>
      ) : null}
      {section === "competition" ? (
        <>
      <DataRichPanel title="引用元詳細へ" description="ドメインとURLから、回答・主張・引用箇所へ掘り下げます。">
        <div className="space-y-3">
          <DetailLink
            href={reportBase+"/sources/domains/marketing-ai-jp"}
            title="ドメイン詳細：marketing-ai.jp"
            description="推移、モデル・ペルソナ・トピック内訳、引用ページ、対応する回答箇所、集中度"
            preview={{
              kicker: "SOURCE PREVIEW",
              facts: [["回答カバー", "76回答"], ["引用ページ", "8URL"], ["モデル横断", `${models.length}モデル`]],
              note: "ドメインの全URL、回答、主張は全画面の詳細で確認します。"
            }}
          />
          <DetailLink href={reportBase+"/sources/pages/marketing-ai-research"} title="引用URL詳細：/research/ai-search-2026" description="完全URL、引用された回答と箇所、ブランド掲載、AIモデル・ペルソナ内訳" />
        </div>
      </DataRichPanel>
        </>
      ) : null}
    </>
  );
}
