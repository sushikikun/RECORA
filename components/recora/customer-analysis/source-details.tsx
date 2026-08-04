"use client";

import Link from "next/link";
import {
  DataRichKpiStrip,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  MetricLineChart,
  ReportDataTable,
  ResponsiveMatrix,
  SourceLink
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

type SourceDomainSeed = {
  name: string;
  paths: readonly [string, string, string];
  topics: readonly [string, string, string];
  topPersona: string;
};

type SourcePageSeed = {
  url: string;
  ownership: string;
  pageType: string;
  topic: string;
  prompt: string;
  candidatePath: string;
  missingInformation: string;
};

export type SourceDomainDetailMetrics = {
  answerCoverage?: number;
  citationOccurrences?: number;
  urlCount?: number;
};

export type SourcePageDetailMetrics = {
  answerCoverage?: number;
  citationOccurrences?: number;
};

const sourceDomainSeeds: Record<string, SourceDomainSeed> = {
  "industry-report": {
    name: "industry-report.example",
    paths: ["/reports/ai-search-market", "/data/geo-adoption", "/guides/ai-visibility"],
    topics: ["市場調査", "導入・運用", "改善施策"],
    topPersona: "決裁者"
  },
  "marketing-ai-jp": {
    name: "marketing-ai.jp",
    paths: ["/research/ai-search-2026", "/compare/geo-tools", "/guide/llmo"],
    topics: ["引用元", "競合比較", "改善施策"],
    topPersona: "マーケ責任者"
  },
  "recora-jp": {
    name: "recora.jp",
    paths: ["/features", "/compare/geo-tools", "/pricing"],
    topics: ["導入・運用", "競合比較", "料金"],
    topPersona: "導入担当"
  },
  "saas-review": {
    name: "saas-review.example",
    paths: ["/geo", "/reviews/recora", "/categories/ai-search"],
    topics: ["ブランド印象", "第三者評価", "競合比較"],
    topPersona: "決裁者"
  },
  "trailbase-io": {
    name: "trailbase.io",
    paths: ["/compare/geo-tools", "/features/ai-visibility", "/resources/geo-guide"],
    topics: ["競合比較", "導入・運用", "改善施策"],
    topPersona: "マーケ責任者"
  },
  community: {
    name: "community.example",
    paths: ["/topics/geo-tools", "/posts/ai-search-citations", "/reviews/recora"],
    topics: ["第三者評価", "引用元", "ブランド印象"],
    topPersona: "編集担当"
  },
  "old-media": {
    name: "old-media.example",
    paths: ["/pricing/geo-tools", "/articles/recora-plan", "/compare/ai-search"],
    topics: ["料金", "ブランド印象", "競合比較"],
    topPersona: "決裁者"
  }
};

const sourcePageSeeds: Record<string, SourcePageSeed> = {
  "marketing-ai-research": {
    url: "marketing-ai.jp/research/ai-search-2026",
    ownership: "第三者メディア",
    pageType: "調査レポート",
    topic: "引用元",
    prompt: "AI検索で引用される情報源は？",
    candidatePath: "/research",
    missingInformation: "調査方法・母数・更新日"
  },
  "marketing-ai-compare": {
    url: "marketing-ai.jp/compare/geo-tools",
    ownership: "第三者メディア",
    pageType: "比較記事",
    topic: "競合比較",
    prompt: "GEOツールの選定基準は？",
    candidatePath: "/compare",
    missingInformation: "選定基準と第三者根拠"
  },
  "marketing-ai-guide": {
    url: "marketing-ai.jp/guide/llmo",
    ownership: "第三者メディア",
    pageType: "実践ガイド",
    topic: "改善施策",
    prompt: "LLMOで最初に整備することは？",
    candidatePath: "/guide",
    missingInformation: "実装手順と検証方法"
  },
  "recora-features": {
    url: "recora.jp/features",
    ownership: "自社公式",
    pageType: "製品ページ",
    topic: "導入・運用",
    prompt: "Recoraで確認できる指標は？",
    candidatePath: "/features",
    missingInformation: "機能ごとの利用場面と根拠"
  },
  "saas-review-geo": {
    url: "saas-review.example/geo",
    ownership: "レビューサイト",
    pageType: "カテゴリ比較",
    topic: "ブランド印象",
    prompt: "GEOツールの評判を比較して",
    candidatePath: "/customers",
    missingInformation: "第三者評価・導入事例・評価条件"
  }
};

function normaliseSubjectName(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function resolveDomainSeed(domainId?: string, domainName?: string): SourceDomainSeed {
  const known = domainId ? sourceDomainSeeds[domainId] : undefined;
  if (known) return known;

  const name = normaliseSubjectName(domainName || domainId || "marketing-ai.jp");
  return {
    name,
    paths: ["/overview", "/resources", "/guide"],
    topics: ["引用元", "競合比較", "改善施策"],
    topPersona: "マーケ責任者"
  };
}

function parseSourcePageRouteId(sourcePageId?: string) {
  if (!sourcePageId?.startsWith("source-url-")) return undefined;
  const payload = sourcePageId.slice("source-url-".length);
  const [encodedUrl, coverageText] = payload.split("--coverage-");
  try {
    return {
      url: decodeURIComponent(encodedUrl.replaceAll("~", "%")),
      answerCoverage: coverageText ? Number.parseInt(coverageText, 10) : undefined
    };
  } catch {
    return undefined;
  }
}

function resolveSourcePageSeed(sourcePageId?: string, sourcePageName?: string): SourcePageSeed {
  const known = sourcePageId ? sourcePageSeeds[sourcePageId] : undefined;
  if (known) return known;

  const routeSeed = parseSourcePageRouteId(sourcePageId);
  const url = normaliseSubjectName(sourcePageName || routeSeed?.url || sourcePageId || "marketing-ai.jp/research/ai-search-2026");
  const pathStart = url.indexOf("/");
  return {
    url,
    ownership: url.startsWith("recora.jp/") ? "自社公式" : "第三者サイト",
    pageType: "参照ページ",
    topic: "引用元",
    prompt: `${url}が参考になる場面は？`,
    candidatePath: pathStart >= 0 ? url.slice(pathStart) : "/resources",
    missingInformation: "判断基準・根拠・更新日"
  };
}

export function resolveSourceDomainDisplayName(domainId?: string, domainName?: string) {
  return resolveDomainSeed(domainId, domainName).name;
}

export function resolveSourcePageDisplayName(sourcePageId?: string, sourcePageName?: string) {
  return resolveSourcePageSeed(sourcePageId, sourcePageName).url;
}

function sourcePageRouteId(url: string, answerCoverage?: number) {
  const encodedUrl = encodeURIComponent(normaliseSubjectName(url)).replaceAll("%", "~");
  return `source-url-${encodedUrl}${typeof answerCoverage === "number" ? `--coverage-${answerCoverage}` : ""}`;
}

export function SourceDomainDetailContent({
  reportBase,
  models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"],
  domainId,
  domainName,
  metrics
}: {
  reportBase: string;
  models?: string[];
  domainId?: string;
  domainName?: string;
  metrics?: SourceDomainDetailMetrics;
}) {
  const domain = resolveDomainSeed(domainId, domainName);
  const domainIndex = Math.max(0, Object.keys(sourceDomainSeeds).indexOf(domainId || ""));
  const answerCoverage = metrics?.answerCoverage ?? 52 + domainIndex * 4;
  const citationOccurrences = metrics?.citationOccurrences ?? answerCoverage + 24 + domainIndex * 3;
  const urlCount = metrics?.urlCount ?? 6 + (domainIndex % 4);
  const pageRows = domain.paths.map((path, index) => [
    <SourceLink key={`${path}-url`} external href={`https://${domain.name}${path}`} label={path} />,
    `${Math.max(8, Math.round(answerCoverage * (0.44 - index * 0.11)))}回答`,
    domain.topics[index],
    `${Math.max(3, 17 - index * 4 + (domainIndex % 3))}回答`,
    `${Math.max(2, 10 + index * 5 - (domainIndex % 2))}回答`,
    ["判断背景", "選定基準", "実装・利用条件"][index],
    <SourceLink
      key={path}
      href={`${reportBase}/sources/pages/${sourcePageRouteId(`${domain.name}${path}`, Math.max(8, Math.round(answerCoverage * (0.44 - index * 0.11))))}?return=${encodeURIComponent(`${reportBase}/sources/domains/${domainId ?? "source"}`)}`}
      label="URL詳細"
    />
  ]);

  return (
    <>
      <DataRichKpiStrip layout="rows" columns="xl:grid-cols-5" items={[
        { label: "回答カバー", value: `${answerCoverage}回答`, helper: `${domain.name}を引用した回答`, note: `前期間 +${9 + domainIndex * 2}回答`, tone: "green" },
        { label: "引用出現", value: `${citationOccurrences}回`, helper: `${domain.name}の全引用`, note: `URL ${urlCount}件` },
        { label: "モデル横断", value: `${models.length}モデル`, helper: "契約モデル", note: `${Math.max(1, models.length - (domainIndex % 2))}モデルで出現` },
        { label: "ペルソナ横断", value: `${4 + (domainIndex % 2)}人`, helper: "対象ペルソナ", note: `${domain.topPersona}で最多` },
        { label: "Top1依存", value: `${14 + domainIndex * 2}%`, helper: `${domain.name}内の最多URL`, note: domainIndex > 4 ? "集中度は高" : "集中度は中" }
      ]} />
      <DataRichPanel title={`${domain.name}の引用推移`} description={`選択期間の有効回答のうち、${domain.name}が1回以上引用された回答数と、初回・最終観測日の変化を表示します。`}>
        <MetricLineChart
          detailType="source-coverage"
          series={[{ name: domain.name, color: "#0B6B57", values: [4, 6, 5, 7, 8, 9, 12, 14].map((value) => value + domainIndex) }]}
          unit="回答"
          deltaUnit="回答"
        />
        <ReportDataTable detailType="source-lifecycle" columns={["初回観測", "最終観測", "継続日数", "獲得", "消失"]} rows={[["2026-06-09", "2026-07-06", "28日", `${18 + domainIndex}回答`, `${1 + (domainIndex % 3)}回答`]]} />
      </DataRichPanel>
      <DataRichPanel title="モデル・ペルソナ内訳" description={`各モデル・ペルソナの有効回答を分母に、${domain.name}が1回以上引用された回答の割合を比較します。`}>
        <ResponsiveMatrix detailType="source-coverage" rows={models} columns={["決裁者", "マーケ責任者", "編集担当", "代理店担当"]} values={[
          [42, 71, 56, 38], [37, 65, 61, 43], [51, 74, 69, 46], [48, 77, 58, 41]
        ].slice(0, models.length).map((row) => row.map((value) => Math.max(0, value - domainIndex * 2)))} />
      </DataRichPanel>
      <DataRichPanel title={`${domain.name}内の引用ページ`} description={`${domain.name}のURLごとに、1回以上引用された回答数と対応箇所を確認できます。`}>
        <ReportDataTable detailType="source-page-ranking" columns={["URL", "回答カバー", "トピック", "自社掲載回答", "競合掲載回答", "対応する回答箇所", "詳細"]} rows={pageRows} />
      </DataRichPanel>
    </>
  );
}

export function SourcePageDetailContent({
  reportBase,
  sourcePageId,
  sourcePageName,
  metrics
}: {
  reportBase: string;
  sourcePageId?: string;
  sourcePageName?: string;
  metrics?: SourcePageDetailMetrics;
}) {
  const page = resolveSourcePageSeed(sourcePageId, sourcePageName);
  const pageIndex = Math.max(0, Object.keys(sourcePageSeeds).indexOf(sourcePageId || ""));
  const routeSeed = parseSourcePageRouteId(sourcePageId);
  const answerCoverage = metrics?.answerCoverage ?? routeSeed?.answerCoverage ?? 24 + pageIndex * 3;
  const citationOccurrences = metrics?.citationOccurrences ?? answerCoverage + 12 + pageIndex;
  const isOwned = page.ownership === "自社公式";
  const sourcePageReturnHref = `${reportBase}/sources/pages/${sourcePageId ?? sourcePageRouteId(page.url, answerCoverage)}`;
  const answerHref = (answerId: string) => `${reportBase}/conversations/${answerId}?return=${encodeURIComponent(sourcePageReturnHref)}`;

  return (
    <>
      <DataRichKpiStrip layout="rows" columns="xl:grid-cols-5" items={[
        { label: "回答カバー", value: `${answerCoverage}回答`, helper: `${page.url}を引用`, note: `前期間 +${6 + pageIndex}回答`, tone: "green" },
        { label: "引用出現", value: `${citationOccurrences}回`, helper: "同一回答内の重複を含む引用回数", note: `${2 + (pageIndex % 3)}モデル` },
        { label: "自社掲載あり", value: `${Math.max(8, answerCoverage - 13)}回答`, helper: "引用された回答内", note: `${44 + pageIndex * 3}%` },
        { label: isOwned ? "競合も掲載" : "引用のみ", value: `${4 + pageIndex}回答`, helper: isOwned ? "同じ回答に競合も掲載" : "自社名は回答に出ない", note: "重要ギャップ", tone: "amber" },
        { label: "鮮度", value: `2026-0${Math.min(7, 4 + pageIndex)}`, helper: `${page.url}の更新月` }
      ]} />
      <DataRichPanel title="完全URL・所有区分" description="選択したURLを省略せず、所有区分と観測期間を表示します。">
        <ReportDataTable detailType="source-page-metadata" columns={["完全URL", "所有区分", "ページ種別", "初回観測", "最終観測"]} rows={[[
          <SourceLink key={page.url} external href={`https://${page.url}`} label={`https://${page.url}`} />,
          page.ownership, page.pageType, "2026-06-09", "2026-07-06"
        ]]} />
      </DataRichPanel>
      <DataRichPanel title="引用された回答・プロンプト" description={`選択期間の有効回答のうち、${page.url}が1回以上引用された回答をモデル・ペルソナ・質問と一緒に確認します。`}>
        <ReportDataTable detailType="source-page-observation" columns={["モデル", "ペルソナ", "プロンプト", "自社掲載", "対応する回答箇所", "回答"]} rows={[
          ["Perplexity", "マーケ責任者", page.prompt, "あり", `${page.topic}の根拠`, <Link key="1" href={answerHref("a03")} className="font-bold text-[#075E44] underline">全文</Link>],
          ["GPT", "決裁者", `${page.topic}で重視する判断基準は？`, isOwned ? "あり" : "なし", `${page.pageType}の比較箇所`, <Link key="2" href={answerHref("a01")} className="font-bold text-[#075E44] underline">全文</Link>]
        ]} />
      </DataRichPanel>
    </>
  );
}
