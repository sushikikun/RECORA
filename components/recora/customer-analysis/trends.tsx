"use client";
import Image from "next/image";
import { useState } from "react";
import {
  DataRichBadge,
  DataRichPanel,
  DataRichPrimaryAction
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  MetricLineChart,
  ReportDataTable,
  type ChartAnnotation,
  type ChartSeries,
  type ReportTrendDetailType
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";
import {
  ReportDetailButton,
  ReportDetailScopeProvider,
  type ReportDetailPayload
} from "@/components/recora/report-ui/report-detail-drawer";

type TrendRange = "7日" | "30日" | "90日" | "180日" | "365日";

const trendMetrics: Record<TrendRange, {
  aiPresence: number;
  aiDelta: number;
  sov: number;
  sovDelta: number;
  position: number;
  positionDelta: number;
  rank: number;
  citation: number;
  citationDelta: number;
  valid: string;
  previousValid: string;
}> = {
  "7日": { aiPresence: 58, aiDelta: 1, sov: 25, sovDelta: 1, position: 2.7, positionDelta: 0.1, rank: 3, citation: 32, citationDelta: 1, valid: "3,494件", previousValid: "3,472件" },
  "30日": { aiPresence: 57, aiDelta: 3, sov: 24, sovDelta: 2, position: 2.8, positionDelta: 0.2, rank: 3, citation: 31, citationDelta: 4, valid: "14,976件", previousValid: "14,592件" },
  "90日": { aiPresence: 55, aiDelta: 5, sov: 23, sovDelta: 3, position: 3.0, positionDelta: 0.3, rank: 4, citation: 29, citationDelta: 6, valid: "44,928件", previousValid: "43,804件" },
  "180日": { aiPresence: 52, aiDelta: 8, sov: 21, sovDelta: 5, position: 3.2, positionDelta: 0.5, rank: 4, citation: 27, citationDelta: 8, valid: "89,856件", previousValid: "87,404件" },
  "365日": { aiPresence: 48, aiDelta: 12, sov: 19, sovDelta: 7, position: 3.5, positionDelta: 0.7, rank: 5, citation: 23, citationDelta: 10, valid: "182,080件", previousValid: "177,304件" }
};

const trendSpan: Record<TrendRange, number> = {
  "7日": 2,
  "30日": 6,
  "90日": 9,
  "180日": 12,
  "365日": 18
};

const modelProfiles: Record<string, { aiPresence: number; sov: number; position: number; citation: number; delta: number; missing: number; color: string }> = {
  GPT: { aiPresence: 62, sov: 27, position: 2.4, citation: 35, delta: 4, missing: 2, color: "#2563EB" },
  Gemini: { aiPresence: 54, sov: 21, position: 3.1, citation: 28, delta: -1, missing: 6, color: "#D97706" },
  Perplexity: { aiPresence: 59, sov: 25, position: 2.7, citation: 39, delta: 2, missing: 3, color: "#64748B" },
  "Google AI Mode": { aiPresence: 66, sov: 29, position: 2.1, citation: 42, delta: 5, missing: 2, color: "#0B6B57" }
};

const trendModelLogos: Record<string, { src: string; background: string }> = {
  GPT: { src: "/recora/model-logos/openai-blossom.svg", background: "#E8F3EE" },
  Gemini: { src: "/recora/model-logos/gemini.svg", background: "#EEF2FF" },
  Perplexity: { src: "/recora/model-logos/perplexity.svg", background: "#E6F7F7" },
  "Google AI Mode": { src: "/recora/model-logos/google-ai-mode.webp", background: "#F7F8FA" }
};

function TrendModelIdentity({ name, color }: { name: string; color?: string }) {
  const logo = trendModelLogos[name];
  return (
    <span className="inline-flex min-w-0 items-center gap-2 font-bold text-inherit">
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/5 text-[10px] font-bold text-[#075E44]"
        style={{ backgroundColor: logo?.background ?? "#F2F4F7" }}
        aria-label={`${name}のAIモデルロゴ`}
      >
        {logo ? <Image src={logo.src} alt="" width={22} height={22} className="h-full w-full object-contain p-1" /> : name.slice(0, 1)}
      </span>
      <span className="min-w-0 break-words">{name}</span>
      {color ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" /> : null}
    </span>
  );
}

const missingScale: Record<TrendRange, number> = { "7日": 0.25, "30日": 1, "90日": 3, "180日": 6, "365日": 12 };
const rangeDays: Record<TrendRange, number> = { "7日": 7, "30日": 30, "90日": 90, "180日": 180, "365日": 365 };
const trendEndDate = new Date(Date.UTC(2026, 6, 6));

function dateAtOffset(date: Date, offsetDays: number) {
  return new Date(date.getTime() + offsetDays * 86_400_000);
}

function formatTrendDate(date: Date, includeYear = false) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return includeYear ? `${date.getUTCFullYear()}/${month}/${day}` : `${month}/${day}`;
}

function trendDateLabels(range: TrendRange) {
  const days = rangeDays[range];
  const start = dateAtOffset(trendEndDate, -(days - 1));
  const middle = dateAtOffset(start, Math.floor((days - 1) / 2));
  const includeYear = start.getUTCFullYear() !== trendEndDate.getUTCFullYear();
  return [formatTrendDate(start, includeYear), formatTrendDate(middle, includeYear), formatTrendDate(trendEndDate, includeYear)];
}

function trendPointLabels(range: TrendRange) {
  const days = rangeDays[range];
  const start = dateAtOffset(trendEndDate, -(days - 1));
  const includeYear = start.getUTCFullYear() !== trendEndDate.getUTCFullYear();
  return Array.from({ length: days }, (_, index) => formatTrendDate(dateAtOffset(start, index), includeYear));
}


function trendPeriodLabel(range: TrendRange) {
  const start = dateAtOffset(trendEndDate, -(rangeDays[range] - 1));
  const includeYear = start.getUTCFullYear() !== trendEndDate.getUTCFullYear();
  return `${formatTrendDate(start, includeYear)}〜${formatTrendDate(trendEndDate, includeYear)}`;
}

function annotationIndex(range: TrendRange, date: string, pointCount: number) {
  const start = dateAtOffset(trendEndDate, -(rangeDays[range] - 1));
  const target = new Date(`${date}T00:00:00Z`);
  const elapsed = Math.max(0, Math.min(rangeDays[range] - 1, Math.round((target.getTime() - start.getTime()) / 86_400_000)));
  return Math.round((elapsed / Math.max(1, rangeDays[range] - 1)) * Math.max(1, pointCount - 1));
}

function trendValues(finalValue: number, range: TrendRange, scale = 1, decimals = 0) {
  const factor = 10 ** decimals;
  const days = rangeDays[range];
  return Array.from({ length: days }, (_, index) => {
    if (index === days - 1) return Math.round(Math.max(0, finalValue) * factor) / factor;
    const progress = index / Math.max(1, days - 1);
    const difference = -trendSpan[range] * (1 - progress);
    const wave = Math.sin(index * 0.79) * 0.42 + Math.sin(index * 0.21 + 0.8) * 0.24;
    const value = Math.max(0, finalValue + (difference + wave) * scale);
    return Math.round(value * factor) / factor;
  });
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

const trendRangeOptions: TrendRange[] = ["7日", "30日", "90日"];
const defaultTrendRange: TrendRange = "30日";

const trendChartIds = [
  "ai-presence",
  "model-presence",
  "sov",
  "average-position",
  "ranking-position",
  "ranking-gap",
  "citation-retention",
  "observation-success",
  "missing-observations"
] as const;

type TrendChartId = (typeof trendChartIds)[number];

function createDefaultChartRanges(): Record<TrendChartId, TrendRange> {
  return Object.fromEntries(
    trendChartIds.map((chartId) => [chartId, defaultTrendRange])
  ) as Record<TrendChartId, TrendRange>;
}

type TrendCompetitor = {
  name: string;
  color: string;
  aiPresenceOffset: number;
  sovOffset: number;
  averagePosition: number;
  citationRate: number;
  scale: number;
};

const trendCompetitors: TrendCompetitor[] = [
  { name: "Trailbase", color: "#344054", aiPresenceOffset: 17, sovOffset: 10, averagePosition: 1.7, citationRate: 45, scale: 0.65 },
  { name: "SignalNest", color: "#667A73", aiPresenceOffset: 6, sovOffset: 3, averagePosition: 2.2, citationRate: 36, scale: 0.8 },
  { name: "MentionMap", color: "#8A6237", aiPresenceOffset: -9, sovOffset: -6, averagePosition: 3.4, citationRate: 22, scale: 0.72 },
  { name: "RankLens", color: "#655F8F", aiPresenceOffset: -3, sovOffset: -3, averagePosition: 3.1, citationRate: 27, scale: 0.58 },
  { name: "AnswerGrid", color: "#9A4E5B", aiPresenceOffset: 2, sovOffset: 1, averagePosition: 2.9, citationRate: 31, scale: 0.7 }
];

const trendBrandDomains: Record<string, string> = {
  Recora: "recora.jp",
  Trailbase: "trailbase.io",
  SignalNest: "signalnest.ai",
  MentionMap: "mentionmap.com",
  RankLens: "ranklens.io",
  AnswerGrid: "answergrid.ai"
};

function selectedTrendCompetitor(name: string) {
  return trendCompetitors.find((competitor) => competitor.name === name) ?? trendCompetitors[0];
}

function visibilitySeries(range: TrendRange, competitorName: string): ChartSeries[] {
  const metrics = trendMetrics[range];
  const competitor = selectedTrendCompetitor(competitorName);
  return [
    { name: "Recora", color: "#0B6B57", values: trendValues(metrics.aiPresence, range) },
    {
      name: competitor.name,
      color: competitor.color,
      values: trendValues(Math.max(9, Math.min(88, metrics.aiPresence + competitor.aiPresenceOffset)), range, competitor.scale),
      dashed: true
    }
  ];
}

function buildAiVisibilityChangeDetail(range: TrendRange, competitorName: string, series: ChartSeries[], pointIndex: number): ReportDetailPayload {
  const self = series[0];
  const competitor = series[1];
  const selfValue = self?.values[pointIndex] ?? 0;
  const competitorValue = competitor?.values[pointIndex] ?? 0;
  const gap = selfValue - competitorValue;

  return {
    kicker: "AI表示率の日次変化",
    title: "07/02に掲載状態が変わった質問",
    value: `${selfValue}%`,
    summary: `${competitorName}との比較中に、Recoraの掲載状態が前日から変わった質問を、モデル・ペルソナ・トピック別に確認します。`,
    sections: [
      { title: "07/02の比較", facts: [
        { label: "Recora", value: `${selfValue}%`, tone: "green" },
        { label: competitorName, value: `${competitorValue}%` },
        { label: "競合との差", value: `${gap > 0 ? "+" : ""}${gap}pt`, tone: gap < 0 ? "amber" : "green" },
        { label: "当日の掲載変化", value: "掲載へ 8質問 / 未掲載へ 3質問", tone: "green" },
        { label: "グラフ期間", value: trendPeriodLabel(range) }
      ] },
      { title: "掲載変化の内訳", table: {
        columns: ["比較軸", "掲載へ変化", "未掲載へ変化", "差"],
        rows: [
          ["AIモデル", "GPT 6質問", "Gemini 2質問", "+4質問"],
          ["ペルソナ", "マーケ責任者 7質問", "編集担当 2質問", "+5質問"],
          ["トピック", "競合比較 8質問", "料金 3質問", "+5質問"]
        ]
      } },
      { title: "掲載状態が変わった代表質問", table: {
        columns: ["質問", "AIモデル", "07/01", "07/02"],
        rows: [
          ["GEO対策ツールを比較する基準は？", "GPT", "未掲載", "2位で掲載"],
          ["AI検索の競合分析サービスは？", "Perplexity", "未掲載", "3位で掲載"],
          ["導入前に比較する項目を教えて", "Gemini", "2位で掲載", "未掲載"]
        ]
      } }
    ]
  };
}

function buildSovChangeDetail(range: TrendRange, competitorName: string, series: ChartSeries[], pointIndex: number): ReportDetailPayload {
  const selfValue = series[0]?.values[pointIndex] ?? 0;
  const competitorValue = series[1]?.values[pointIndex] ?? 0;
  const gap = selfValue - competitorValue;
  return {
    kicker: "AI内シェアの日次変化",
    title: "07/03に掲載量が入れ替わった質問",
    value: `${selfValue}%`,
    summary: `${competitorName}とのAI内シェア差が変わった日の質問を、AIモデル・ペルソナ・トピック別に確認します。`,
    sections: [
      { title: "07/03のAI内シェア", facts: [
        { label: "Recora", value: `${selfValue}%`, tone: "green" },
        { label: competitorName, value: `${competitorValue}%` },
        { label: "競合との差", value: `${gap > 0 ? "+" : ""}${gap}pt`, tone: gap < 0 ? "amber" : "green" },
        { label: "グラフ期間", value: trendPeriodLabel(range) }
      ] },
      { title: "シェア差が大きい内訳", table: {
        columns: ["内訳", "Recora", competitorName, "差"],
        rows: [
          ["AIモデル・GPT", "27%", "33%", "-6pt"],
          ["ペルソナ・マーケ責任者", "31%", "38%", "-7pt"],
          ["トピック・競合比較", "29%", "42%", "-13pt"]
        ]
      } },
      { title: "掲載量が入れ替わった代表質問", table: {
        columns: ["質問", "AIモデル", "Recora", competitorName],
        rows: [
          ["GEO対策ツールの候補は？", "GPT", "2位で掲載", "1位で掲載"],
          ["AI検索の競合分析サービスは？", "Perplexity", "掲載へ変化", "未掲載へ変化"],
          ["導入前に比較する項目を教えて", "Gemini", "未掲載", "2位で掲載"]
        ]
      } }
    ]
  };
}

function sovSeries(range: TrendRange, competitorName: string): ChartSeries[] {
  const metrics = trendMetrics[range];
  const competitor = selectedTrendCompetitor(competitorName);
  return [
    { name: "Recora", color: "#0B6B57", values: trendValues(metrics.sov, range, 0.42) },
    {
      name: competitor.name,
      color: competitor.color,
      values: trendValues(Math.max(5, Math.min(55, metrics.sov + competitor.sovOffset)), range, 0.28),
      dashed: true
    }
  ];
}

function buildAveragePositionChangeDetail(range: TrendRange, competitorName: string, series: ChartSeries[], pointIndex: number): ReportDetailPayload {
  const selfValue = series[0]?.values[pointIndex] ?? 0;
  const competitorValue = series[1]?.values[pointIndex] ?? 0;
  const gap = selfValue - competitorValue;
  return {
    kicker: "平均掲載位置の日次変化",
    title: "07/01に掲載順位が変わった質問",
    value: `${selfValue.toFixed(1)}位`,
    summary: `${competitorName}との掲載位置差が変わった質問を、1位への流入・1位からの離脱・未掲載を分けて確認します。`,
    sections: [
      { title: "07/01の掲載位置", facts: [
        { label: "Recora", value: `${selfValue.toFixed(1)}位`, tone: gap < 0 ? "green" : "amber" },
        { label: competitorName, value: `${competitorValue.toFixed(1)}位` },
        { label: "順位差", value: `${gap > 0 ? "+" : ""}${gap.toFixed(1)}位`, tone: gap < 0 ? "green" : "amber" },
        { label: "見方", value: "値が小さいほど上位" },
        { label: "グラフ期間", value: trendPeriodLabel(range) }
      ] },
      { title: "掲載位置の構成", table: {
        columns: ["位置", "Recora", competitorName, "差"],
        rows: [
          ["1位", "38回答", "51回答", "-13回答"],
          ["2位", "44回答", "39回答", "+5回答"],
          ["3位以下", "27回答", "19回答", "+8回答"]
        ]
      } },
      { title: "位置が変わった代表質問", table: {
        columns: ["質問", "AIモデル", "前日", "07/01"],
        rows: [
          ["GEO対策ツールの候補は？", "GPT", "3位", "1位"],
          ["AI検索サービスを比較して", "Perplexity", "未掲載", "2位"],
          ["導入費用を比較する基準は？", "Gemini", "1位", "3位"]
        ]
      } }
    ]
  };
}

function averagePositionSeries(range: TrendRange, competitorName: string): ChartSeries[] {
  const competitor = selectedTrendCompetitor(competitorName);
  const rangeAdjustment = (trendMetrics[range].position - trendMetrics["30日"].position) * 0.4;
  return [
    { name: "Recora", color: "#0B6B57", values: trendValues(trendMetrics[range].position, range, -0.11, 1) },
    {
      name: competitor.name,
      color: competitor.color,
      values: trendValues(Math.max(1, competitor.averagePosition + rangeAdjustment), range, -0.035, 1),
      dashed: true
    }
  ];
}

function buildRankingDayDetail(range: TrendRange, series: ChartSeries[], pointIndex: number): ReportDetailPayload {
  const rank = Math.round(series[0]?.values[pointIndex] ?? 0);
  return {
    kicker: "ブランド順位の日次変化",
    title: "07/02にSignalNestを抜いて3位へ上昇",
    value: `${rank}位`,
    summary: "順位が入れ替わった日の掲載変化を、相手ブランド・AIモデル・ペルソナ・トピック別に確認します。",
    sections: [
      { title: "順位の入れ替わり", facts: [
        { label: "前日", value: "Recora 4位 / SignalNest 3位" },
        { label: "07/02", value: "Recora 3位 / SignalNest 4位", tone: "green" },
        { label: "入れ替わったブランド", value: "SignalNest" },
        { label: "グラフ期間", value: trendPeriodLabel(range) }
      ] },
      { title: "順位上昇が大きい内訳", table: {
        columns: ["内訳", "Recora", "SignalNest", "差"],
        rows: [
          ["AIモデル・GPT", "64%", "58%", "+6pt"],
          ["ペルソナ・マーケ責任者", "69%", "61%", "+8pt"],
          ["トピック・競合比較", "66%", "57%", "+9pt"]
        ]
      } },
      { title: "順位へ影響した代表質問", table: {
        columns: ["質問", "AIモデル", "Recora", "SignalNest"],
        rows: [
          ["GEO対策ツールの候補は？", "GPT", "2位で掲載", "未掲載"],
          ["AI検索の競合分析サービスは？", "Perplexity", "1位で掲載", "3位で掲載"],
          ["導入前の比較項目を教えて", "Gemini", "3位で掲載", "2位で掲載"]
        ]
      } }
    ]
  };
}

function buildRankingGapDayDetail(range: TrendRange, series: ChartSeries[], pointIndex: number): ReportDetailPayload {
  const gap = series[0]?.values[pointIndex] ?? 0;
  return {
    kicker: "首位とのAI表示率差",
    title: "07/04に首位との差が縮小",
    value: `${gap > 0 ? "+" : ""}${gap}pt`,
    summary: "首位Trailbaseとの差が動いた日の掲載変化を、AIモデル・ペルソナ・トピック別に確認します。",
    sections: [
      { title: "07/04の首位差", facts: [
        { label: "Recora", value: "57%" },
        { label: "Trailbase", value: "74%" },
        { label: "首位との差", value: `${gap > 0 ? "+" : ""}${gap}pt`, tone: "amber" },
        { label: "前日", value: "-20pt" },
        { label: "グラフ期間", value: trendPeriodLabel(range) }
      ] },
      { title: "差が縮小した内訳", table: {
        columns: ["内訳", "Recora", "Trailbase", "差"],
        rows: [
          ["AIモデル・Perplexity", "63%", "71%", "-8pt"],
          ["ペルソナ・導入担当", "61%", "68%", "-7pt"],
          ["トピック・測定方法", "65%", "70%", "-5pt"]
        ]
      } },
      { title: "差が変わった代表質問", table: {
        columns: ["質問", "AIモデル", "Recora", "Trailbase"],
        rows: [
          ["AI検索の測定方法は？", "Perplexity", "1位で掲載", "2位で掲載"],
          ["GEOの導入手順を教えて", "GPT", "掲載へ変化", "掲載継続"],
          ["比較に必要な指標は？", "Gemini", "3位で掲載", "1位で掲載"]
        ]
      } }
    ]
  };
}

function buildCitationChangeDetail(
  range: TrendRange,
  competitorName: string,
  series: ChartSeries[],
  pointIndex: number
): ReportDetailPayload {
  const selfValue = series[0]?.values[pointIndex] ?? 0;
  const competitorValue = series[1]?.values[pointIndex] ?? 0;
  const gap = selfValue - competitorValue;
  const competitorDomain = trendBrandDomains[competitorName] ?? competitorName.toLowerCase();

  return {
    kicker: "公式サイト引用率の日次変化",
    title: "07/04に公式サイト引用が増えた回答",
    value: `${selfValue}%`,
    summary: `${competitorName}との引用差が動いた日に、どの公式ページがどの回答で引用されたかを確認します。`,
    sections: [
      { title: "07/04の比較", facts: [
        { label: "Recora", value: `${selfValue}%`, tone: gap >= 0 ? "green" : "amber" },
        { label: competitorName, value: `${competitorValue}%` },
        { label: "競合との差", value: `${gap > 0 ? "+" : ""}${gap}pt`, tone: gap >= 0 ? "green" : "amber" },
        { label: "グラフ期間", value: trendPeriodLabel(range) }
      ] },
      { title: "この日に引用された公式ページ", table: {
        columns: ["ブランド", "公式URL", "引用回答", "主なトピック"],
        rows: [
          ["Recora", "recora.jp/guide/geo-measurement", "12回答", "測定方法"],
          ["Recora", "recora.jp/compare/ai-search", "8回答", "競合比較"],
          [competitorName, `${competitorDomain}/pricing`, "6回答", "料金・導入"]
        ]
      } },
      { title: "引用率差が大きい内訳", table: {
        columns: ["内訳", "Recora", competitorName, "差"],
        rows: [
          ["AIモデル・Perplexity", "39%", "46%", "-7pt"],
          ["ペルソナ・マーケ責任者", "37%", "41%", "-4pt"],
          ["トピック・測定方法", "44%", "38%", "+6pt"]
        ]
      } }
    ]
  };
}

function citationSeries(range: TrendRange, competitorName: string): ChartSeries[] {
  const competitor = selectedTrendCompetitor(competitorName);
  const rangeAdjustment = trendMetrics[range].citation - trendMetrics["30日"].citation;
  return [
    { name: "Recora", color: "#0B6B57", values: trendValues(trendMetrics[range].citation, range, 0.5) },
    {
      name: competitor.name,
      color: competitor.color,
      values: trendValues(Math.max(5, Math.min(72, competitor.citationRate + rangeAdjustment)), range, 0.42),
      dashed: true
    }
  ];
}

type ObservationQualityKind = "success" | "missing";

function observationQualitySeries(range: TrendRange, models: string[], kind: ObservationQualityKind): ChartSeries[] {
  const missingTotal = models.reduce((sum, model, index) => sum + (modelProfiles[model]?.missing ?? Math.max(1, index + 1)), 0);
  if (kind === "success") {
    return [{ name: "観測成功率", color: "#0B6B57", values: trendValues(97.5, range, 0.08, 1) }];
  }
  return [{ name: "欠測数", color: "#B7791F", values: trendValues(missingTotal, range, 0.5) }];
}

function buildObservationQualityDetail(
  item: ChartSeries,
  range: TrendRange,
  models: string[],
  pointIndex?: number
): ReportDetailPayload {
  const isMissing = item.name === "欠測数";
  const selectedIndex = pointIndex ?? Math.max(0, item.values.length - 1);
  const selectedValue = item.values[selectedIndex] ?? 0;
  const dateLabel = pointIndex === undefined ? "最新日" : (trendPointLabels(range)[selectedIndex] ?? "選択日");
  const modelRows = models.map((model, index) => {
    const missing = modelProfiles[model]?.missing ?? Math.max(1, index + 1);
    const successRate = Math.max(90, 99.4 - missing * 0.45).toFixed(1);
    const cause = ["タイムアウト", "空回答", "応答形式不一致", "接続失敗"][index % 4];
    return [model, `${successRate}%`, `${missing}件`, cause];
  });

  return {
    kicker: isMissing ? "欠測数の内訳" : "観測成功率の内訳",
    title: `${dateLabel}の${item.name}`,
    value: isMissing ? `${selectedValue}件` : `${selectedValue.toFixed(1)}%`,
    summary: isMissing
      ? "欠測がどのAIモデルと質問で発生したかを分けて確認します。"
      : "観測できた割合と、成功率を下げた欠測の内訳を確認します。",
    sections: [
      { title: "選択日の観測状態", facts: [
        { label: "日付", value: dateLabel },
        { label: item.name, value: isMissing ? `${selectedValue}件` : `${selectedValue.toFixed(1)}%`, tone: isMissing ? "amber" : "green" },
        { label: "グラフ期間", value: trendPeriodLabel(range) },
        { label: "契約モデル", value: models.join(" / ") }
      ] },
      { title: "AIモデル別の観測状態", table: {
        columns: ["AIモデル", "観測成功率", "欠測", "主な状態"],
        rows: modelRows
      } },
      { title: isMissing ? "欠測が発生した代表質問" : "成功率に影響した代表質問", table: {
        columns: ["固定質問", "AIモデル", "状態", "観測日"],
        rows: [
          ["GEO対策ツールの料金を比較して", models[1] ?? models[0] ?? "対象モデル", "タイムアウト", dateLabel],
          ["AI検索の引用を測定する方法は？", models[0] ?? "対象モデル", "再取得で成功", dateLabel]
        ]
      } }
    ]
  };
}

function modelVisibilitySeries(range: TrendRange, models: string[], highlightedModel: string | null): ChartSeries[] {
  const metrics = trendMetrics[range];
  return models.map((model, index) => {
    const profile = modelProfiles[model] ?? { aiPresence: 52 + index * 3, sov: 20 + index * 2, position: 3, citation: 24 + index * 3, delta: 0, missing: 0, color: ["#2563EB", "#D97706", "#64748B", "#0B6B57"][index] ?? "#475569" };
    return {
      name: model,
      color: profile.color,
      values: trendValues(profile.aiPresence + (metrics.aiPresence - trendMetrics["30日"].aiPresence), range, 0.55),
      dashPattern: [undefined, "8 5", "2 4", "12 4 2 4"][index],
      emphasized: highlightedModel === model
    };
  });
}

type LocalTrendChartData = {
  series: ChartSeries[];
  annotations?: ChartAnnotation[];
};

function formatTrendValue(value: number, unit: string, decimals: number) {
  return `${value.toFixed(decimals)}${unit}`;
}

function trendSeriesComparison(
  series: ChartSeries[],
  unit: string,
  decimals: number,
  deltaUnit = unit
) {
  return {
    columns: ["系列", "期間開始", "最新", "期間差"],
    rows: series.map((seriesItem) => {
      const start = seriesItem.values[0] ?? 0;
      const latest = seriesItem.values[seriesItem.values.length - 1] ?? 0;
      const delta = latest - start;
      return [
        seriesItem.name,
        formatTrendValue(start, unit, decimals),
        formatTrendValue(latest, unit, decimals),
        `${delta > 0 ? "+" : ""}${formatTrendValue(delta, deltaUnit, decimals)}`
      ];
    })
  };
}

function buildLocalTrendDetail({
  detailType,
  item,
  series,
  range,
  unit,
  deltaUnit,
  decimals,
  lowerIsBetter,
  models
}: {
  detailType: ReportTrendDetailType;
  item: ChartSeries;
  series: ChartSeries[];
  range: TrendRange;
  unit: string;
  deltaUnit?: string;
  decimals: number;
  lowerIsBetter: boolean;
  models: string[];
}): ReportDetailPayload {
  const start = item.values[0] ?? 0;
  const latest = item.values[item.values.length - 1] ?? 0;
  const delta = latest - start;
  const formattedLatest = formatTrendValue(latest, unit, decimals);
  const formattedDelta = `${delta > 0 ? "+" : ""}${formatTrendValue(delta, deltaUnit ?? unit, decimals)}`;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const comparison = trendSeriesComparison(series, unit, decimals, deltaUnit);
  const rangeSummary = [
    { label: "表示期間", value: trendPeriodLabel(range) },
    { label: "期間開始", value: formatTrendValue(start, unit, decimals) },
    { label: "最新", value: formattedLatest },
    { label: "期間差", value: formattedDelta, tone: improved ? "green" as const : delta === 0 ? undefined : "amber" as const }
  ];

  if (detailType === "observation-quality") {
    return buildObservationQualityDetail(item, range, models);
  }

  if (detailType === "ai-visibility") {
    return {
      kicker: "AI表示率の変化",
      title: `${item.name}の増減要因`,
      value: formattedLatest,
      summary: `${range}で掲載状態が変わった質問と、その変化へ寄与したトピック・AIモデルを確認します。`,
      sections: [
        { title: "この期間に何が変わったか", facts: [
          ...rangeSummary,
          { label: "掲載へ変わった質問", value: item.name === "Recora" ? "18件" : "11件", tone: "green" },
          { label: "未掲載へ変わった質問", value: item.name === "Recora" ? "7件" : "9件", tone: "amber" }
        ] },
        { title: "変化へ寄与した内訳", table: {
          columns: ["軸", "上昇寄与", "低下寄与"],
          rows: [
            ["トピック", "競合比較 +4.1pt", "導入費用 -0.8pt"],
            ["ペルソナ", "マーケ責任者 +2.3pt", "編集担当 -0.6pt"],
            ["AIモデル", "契約モデル差 +2.0pt", "Gemini -0.4pt"]
          ]
        } },
        { title: "同じグラフの系列比較", table: comparison }
      ]
    };
  }

  if (detailType === "model-visibility") {
    if (series.length === 1) {
      return {
        kicker: "AIモデルの変化",
        title: `${item.name}で掲載状態が変わった質問`,
        value: formattedLatest,
        summary: `${item.name}の中で、期間開始から最新日までに自社の掲載状態が変わった質問を確認します。`,
        sections: [
          { title: "このモデルの期間差", facts: rangeSummary },
          { title: "掲載状態が変わった質問", table: {
            columns: ["質問", "期間開始", "最新", "変化した箇所"],
            rows: [
              ["GEOツールを比較する基準は？", "未掲載", "2位で掲載", "比較候補の列挙"],
              ["AI検索で引用を増やすには？", "3位で掲載", "未掲載", "自社情報源の引用"],
              ["導入後の運用負荷を比較して", "2位で掲載", "1位で掲載", "運用機能の説明"]
            ]
          } }
        ]
      };
    }
    return {
      kicker: "AIモデル別の変化",
      title: `${item.name}で判断が割れた質問`,
      value: formattedLatest,
      summary: `${item.name}と他モデルで掲載有無・位置が異なる質問を、モデル名を省略せず確認します。`,
      sections: [
        { title: "このモデルの期間差", facts: rangeSummary },
        { title: "モデルごとに結果が分かれた質問", table: {
          columns: ["質問", ...series.map((seriesItem) => seriesItem.name), "差が出た箇所"],
          rows: [
            ["GEOツールを比較する基準は？", ...series.map((seriesItem) => seriesItem.name === item.name ? "掲載・2位" : "未掲載"), "比較候補の列挙"],
            ["AI検索で引用を増やすには？", ...series.map((seriesItem, index) => seriesItem.name === item.name ? "未掲載" : `掲載・${Math.min(4, index + 1)}位`), "自社情報源の引用"],
            ["導入後の運用負荷を比較して", ...series.map((seriesItem, index) => seriesItem.name === item.name ? "掲載・1位" : index % 2 === 0 ? "掲載・3位" : "未掲載"), "運用機能の説明"]
          ]
        } },
        { title: "モデル別AI表示率", table: comparison }
      ]
    };
  }

  if (detailType === "sov") {
    return {
      kicker: "AI内シェアの変化",
      title: `${item.name}のAI内シェアが変わった内訳`,
      value: formattedLatest,
      summary: `${item.name}の掲載量が増減した質問を、AIモデル・ペルソナ・トピックとブランドの入れ替わりで確認します。`,
      sections: [
        { title: "この期間のAI内シェア", facts: rangeSummary },
        { title: "変化が大きい内訳", table: {
          columns: ["比較軸", "対象", "期間開始", "最新", "差"],
          rows: [
            ["AIモデル", "GPT", "24%", "27%", "+3pt"],
            ["ペルソナ", "マーケ責任者", "27%", "31%", "+4pt"],
            ["トピック", "競合比較", "23%", "29%", "+6pt"]
          ]
        } },
        { title: "ブランド掲載量の入れ替わり", table: {
          columns: ["比較ブランド", `${item.name}が増えた質問`, `${item.name}が減った質問`, "純増減"],
          rows: series.filter((seriesItem) => seriesItem.name !== item.name).map((seriesItem) => [seriesItem.name, "14質問", "6質問", "+8質問"])
        } },
        { title: "同じグラフのAI内シェア", table: comparison }
      ]
    };
  }

  if (detailType === "average-position") {
    return {
      kicker: "平均掲載位置の変化",
      title: `${item.name}の1位流入・離脱`,
      value: formattedLatest,
      summary: "平均値だけでは見えない、1位へ上がった質問と1位から外れた質問を確認します。",
      sections: [
        { title: "掲載位置の期間差", facts: rangeSummary },
        { title: "1位へ入った・1位から外れた質問", table: {
          columns: ["変化", "質問群", "件数", "主な移動"],
          rows: [
            ["1位へ流入", "競合比較", "9件", "2位 → 1位"],
            ["1位へ流入", "選定基準", "5件", "3位 → 1位"],
            ["1位から離脱", "料金・導入", "4件", "1位 → 2位"],
            ["1位から離脱", "運用支援", "2件", "1位 → 3位"]
          ]
        } },
        { title: "ブランド別の平均掲載位置", table: comparison }
      ]
    };
  }

  if (detailType === "ranking" || detailType === "ranking-gap") {
    const isGap = detailType === "ranking-gap";
    return {
      kicker: isGap ? "首位差の変化" : "ブランド順位の変化",
      title: isGap ? "首位との差が動いた日" : `${item.name}の順位が入れ替わった日`,
      value: formattedLatest,
      summary: isGap
        ? "首位ブランドとの表示率差が拡大・縮小した日と、その前後の順位を確認します。"
        : "順位が変わった日を起点に、入れ替わったブランドと前後順位を確認します。",
      sections: [
        { title: "表示期間の変化", facts: rangeSummary },
        { title: "順位の入れ替わり", table: {
          columns: ["日付", "入れ替わったブランド", "前日", "当日", "主な要因"],
          rows: [
            ["07/02", "SignalNest", "Recora 4位 / SignalNest 3位", "Recora 3位 / SignalNest 4位", "競合比較で掲載増"],
            ["06/24", "MetricFlow", "Recora 5位 / MetricFlow 4位", "Recora 4位 / MetricFlow 5位", "GPTで未掲載減"],
            ["06/15", "Trailbase", "差 -22pt", "差 -17pt", "選定基準の質問群"]
          ]
        } },
        { title: "同じグラフの系列比較", table: comparison }
      ]
    };
  }

  const brandDomain = trendBrandDomains[item.name] ?? item.name.toLowerCase();
  return {
    kicker: "公式サイト引用率の変化",
    title: `${item.name}の公式サイトが引用された回答`,
    value: formattedLatest,
    summary: `${item.name}の公式ドメインが引用された回答を、引用ページと質問群に分けて確認します。`,
    sections: [
      { title: "この期間の引用変化", facts: rangeSummary },
      { title: "引用された公式ページ", table: {
        columns: ["公式URL", "引用回答", "主なAIモデル", "主なトピック"],
        rows: [
          [`${brandDomain}/guide/measurement`, "12回答", "Perplexity", "測定方法"],
          [`${brandDomain}/compare/ai-search`, "8回答", "GPT", "競合比較"],
          [`${brandDomain}/pricing`, "5回答", "Gemini", "料金・導入"]
        ]
      } },
      { title: "同じグラフのブランド比較", table: comparison }
    ]
  };
}

type TrendComparisonControl = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function LocalTrendChart({
  range,
  onRangeChange,
  models,
  build,
  detailType,
  unit = "",
  deltaUnit,
  decimals = 0,
  lowerIsBetter = false,
  invertScale = lowerIsBetter,
  comparisonControl,
  showLatestComparison = false,
  showLatestSnapshot = false
}: {
  range: TrendRange;
  onRangeChange: (range: TrendRange) => void;
  models: string[];
  build: (range: TrendRange) => LocalTrendChartData;
  detailType: ReportTrendDetailType;
  unit?: string;
  deltaUnit?: string;
  decimals?: number;
  lowerIsBetter?: boolean;
  invertScale?: boolean;
  comparisonControl?: TrendComparisonControl;
  showLatestComparison?: boolean;
  showLatestSnapshot?: boolean;
}) {
  const data = build(range);
  const metrics = trendMetrics[range];
  const missing = Math.max(1, Math.round(384 * missingScale[range]));
  const detailForSeries = (item: ChartSeries) => buildLocalTrendDetail({
    detailType,
    item,
    series: data.series,
    range,
    unit,
    deltaUnit,
    decimals,
    lowerIsBetter,
    models
  });
  const selfSeries = data.series[0];
  const rivalSeries = data.series[1];
  const selfLatest = selfSeries?.values[selfSeries.values.length - 1] ?? 0;
  const rivalLatest = rivalSeries?.values[rivalSeries.values.length - 1] ?? 0;
  const latestGap = selfLatest - rivalLatest;
  const latestGapFavorsSelf = latestGap !== 0 && (lowerIsBetter ? latestGap < 0 : latestGap > 0);
  const selfStart = selfSeries?.values[0] ?? selfLatest;
  const selfDelta = selfLatest - selfStart;
  const selfDeltaImproved = selfDelta !== 0 && (lowerIsBetter ? selfDelta < 0 : selfDelta > 0);

  return (
    <ReportDetailScopeProvider value={{
      periodLabel: "グラフ期間",
      period: range,
      modelCount: `${models.length}モデル`,
      validObservations: metrics.valid,
      missingObservations: `${missing}件`
    }}>
      <div className="mb-4 border-b border-[#E5EAE8] pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-[#667085]">このグラフの期間</span>
          <div
            className="hidden items-center rounded-md border border-[#C7D2CC] bg-[#F7FAF8] p-1 md:inline-flex"
            role="group"
            aria-label="このグラフの表示期間"
          >
            {trendRangeOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => onRangeChange(option)}
                className={`min-h-9 rounded px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2 ${
                  range === option
                    ? "bg-[#0B382D] text-white shadow-sm"
                    : "text-[#475569] hover:bg-white hover:text-[#0B382D]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <label className="flex flex-1 items-center justify-end gap-2 text-[11px] font-bold text-[#667085] md:hidden">
            <span className="sr-only">このグラフの表示期間</span>
            <select
              value={range}
              onChange={(event) => onRangeChange(event.target.value as TrendRange)}
              className="h-11 w-full max-w-44 rounded-md border border-[#C7D2CC] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2"
              aria-label="このグラフの表示期間"
            >
              {trendRangeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5">
          <span className="inline-flex rounded-full bg-[#EAF6F0] px-2 py-0.5 font-bold text-[#075E44]">
            {trendPeriodLabel(range)}
          </span>
          <p className="font-semibold text-[#667085]" aria-live="polite">
            {rangeDays[range]}日分の日次推移
          </p>
        </div>
        {comparisonControl ? (
          <label className="mt-3 flex min-w-0 flex-col gap-1.5 border-t border-[#E5EAE8] pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] font-bold text-[#667085]">{comparisonControl.label}</span>
            <select
              value={comparisonControl.value}
              onChange={(event) => comparisonControl.onChange(event.target.value)}
              className="h-10 w-full rounded-md border border-[#B9C8C1] bg-white px-3 text-[13px] font-bold text-[#243B33] outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2 sm:w-56"
              aria-label={comparisonControl.label}
            >
              {comparisonControl.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      {showLatestComparison && selfSeries && rivalSeries ? (
        <div className="mb-4 grid overflow-hidden border-y border-[#DCE5E1] bg-[#F8FAF9] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" aria-label="最新日の比較">
          <ReportDetailButton detail={detailForSeries(selfSeries)} className="min-h-0 w-full items-center justify-between rounded-none bg-white px-4 py-3 hover:bg-[#F4F8F6]" showIcon={false}>
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-2 text-[12px] font-bold text-[#475467]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selfSeries.color }} />{selfSeries.name}</span>
              <span className="mt-1 block text-[22px] font-bold tabular-nums text-[#0B382D]">{formatTrendValue(selfLatest, unit, decimals)}</span>
            </span>
            <span className="text-[11px] font-bold text-[#667085]">内訳</span>
          </ReportDetailButton>
          <div className="grid min-w-28 place-items-center border-y border-[#DCE5E1] px-4 py-3 text-center sm:border-x sm:border-y-0">
            <span className="text-[10px] font-bold text-[#667085]">最新差</span>
            <strong className={`mt-1 text-[17px] font-bold tabular-nums ${latestGap === 0 ? "text-[#475467]" : latestGapFavorsSelf ? "text-[#075E44]" : "text-[#8A4B00]"}`}>
              {latestGap > 0 ? "+" : ""}{formatTrendValue(latestGap, deltaUnit ?? unit, decimals)}
            </strong>
            <span className="mt-0.5 text-[10px] font-bold text-[#667085]">{latestGap === 0 ? "同水準" : latestGapFavorsSelf ? "自社が優位" : "競合が優位"}</span>
          </div>
          <ReportDetailButton detail={detailForSeries(rivalSeries)} className="min-h-0 w-full items-center justify-between rounded-none bg-white px-4 py-3 hover:bg-[#F4F8F6]" showIcon={false}>
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-2 text-[12px] font-bold text-[#475467]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: rivalSeries.color }} />{rivalSeries.name}</span>
              <span className="mt-1 block text-[22px] font-bold tabular-nums text-[#101828]">{formatTrendValue(rivalLatest, unit, decimals)}</span>
            </span>
            <span className="text-[11px] font-bold text-[#667085]">内訳</span>
          </ReportDetailButton>
        </div>
      ) : showLatestSnapshot && selfSeries ? (
        <ReportDetailButton
          detail={detailForSeries(selfSeries)}
          showIcon={false}
          className="mb-4 grid min-h-0 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-none border-y border-[#DCE5E1] bg-white px-4 py-3 hover:bg-[#F4F8F6]"
        >
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2 text-[12px] font-bold text-[#475467]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selfSeries.color }} />{selfSeries.name}</span>
            <span className="mt-1 block text-[22px] font-bold tabular-nums text-[#101828]">{formatTrendValue(selfLatest, unit, decimals)}</span>
          </span>
          <span className="text-right">
            <span className="block text-[10px] font-bold text-[#667085]">期間差</span>
            <strong className={`mt-1 block text-[15px] font-bold tabular-nums ${selfDelta === 0 ? "text-[#475467]" : selfDeltaImproved ? "text-[#075E44]" : "text-[#8A4B00]"}`}>{selfDelta > 0 ? "+" : ""}{formatTrendValue(selfDelta, deltaUnit ?? unit, decimals)}</strong>
            <span className="mt-0.5 block text-[10px] font-bold text-[#667085]">内訳</span>
          </span>
        </ReportDetailButton>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2" aria-label="系列を選んで内訳を表示">
          {data.series.map((item) => (
            <ReportDetailButton
              key={item.name}
              detail={detailForSeries(item)}
              className="min-h-10 gap-2 rounded-md border border-[#DCE5E1] bg-white px-3 text-xs font-bold text-[#344054] hover:border-[#8FA99F] hover:bg-[#F4F8F6] hover:text-[#075E44]"
            >
              {detailType === "model-visibility" ? (
                <TrendModelIdentity name={item.name} color={item.color} />
              ) : (
                <>
                  <svg viewBox="0 0 24 6" className="h-2 w-6 shrink-0 overflow-visible" aria-hidden="true">
                    <line x1="0" x2="24" y1="3" y2="3" stroke={item.color} strokeWidth="2" strokeDasharray={item.dashPattern ?? (item.dashed ? "7 6" : undefined)} />
                  </svg>
                  {item.name}
                </>
              )}
              <span className="font-semibold text-[#667085]">内訳</span>
            </ReportDetailButton>
          ))}
        </div>
      )}
      <div className="[&>div>div:first-child]:hidden">
        <MetricLineChart
          series={data.series}
          labels={trendDateLabels(range)}
          pointLabels={trendPointLabels(range)}
          unit={unit}
          deltaUnit={deltaUnit}
          decimals={decimals}
          lowerIsBetter={invertScale}
          observations={metrics.valid}
          annotations={data.annotations}
        />
      </div>
    </ReportDetailScopeProvider>
  );
}

function ModelTrendFocusControl({
  models,
  value,
  onChange
}: {
  models: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  if (!models.length) return null;
  if (models.length === 1) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-[#DCE5E1] bg-[#F8FAF9] px-3 py-3 sm:px-4">
        <span className="text-[11px] font-bold text-[#667085]">AIモデル</span>
        <TrendModelIdentity name={models[0]} color={modelProfiles[models[0]]?.color} />
      </div>
    );
  }
  return (
    <div className="mb-4 flex flex-col gap-3 border-y border-[#DCE5E1] bg-[#F8FAF9] px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
      <span className="text-[11px] font-bold text-[#667085]">グラフで強調</span>
      <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="強調するAIモデル">
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
          className={`min-h-9 rounded-md border px-3 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2 ${value === null ? "border-[#0B382D] bg-[#0B382D] text-white" : "border-[#C7D2CC] bg-white text-[#475467] hover:border-[#8FA99F] hover:text-[#075E44]"}`}
        >
          すべて
        </button>
        {models.map((model) => {
          const selected = value === model;
          return (
            <button
              key={model}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(model)}
              className={`min-h-9 rounded-md border px-2.5 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2 ${selected ? "border-[#0B382D] bg-[#0B382D] text-white" : "border-[#C7D2CC] bg-white text-[#344054] hover:border-[#8FA99F] hover:text-[#075E44]"}`}
            >
              <TrendModelIdentity name={model} color={modelProfiles[model]?.color} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildStabilityDetails(models: string[]): ReportDetailPayload[] {
  const modelColumns = models.length ? models : ["比較対象なし"];
  const allListed = models.map(() => "掲載あり");
  const allUnlisted = models.map(() => "未掲載");
  const splitResults = models.map((_, index) => index === 1 ? "未掲載" : "掲載あり");

  return [
    {
      kicker: "MODEL AGREEMENT",
      title: "全モデル掲載一致",
      value: "41%",
      summary: "同じ観測日・同じ固定質問で、有効だった全契約モデルの掲載判断が一致した割合です。",
      sections: [
        { title: "判定条件", facts: [
          { label: "比較単位", value: "同一観測日 × 同一固定質問" },
          { label: "必要条件", value: `${models.length}/${models.length}モデルが有効` },
          { label: "欠測", value: "一致・不一致の分母から除外", tone: "amber" }
        ] },
        { title: "全モデル一致の代表照合", table: {
          columns: ["照合ID", "観測日", "固定質問", ...modelColumns, "判定"],
          rows: [["MATCH-20260706-P01", "2026-07-06", "GEO対策ツールのおすすめは？", ...allListed, `${models.length}/${models.length}で掲載一致`]]
        } }
      ]
    },
    {
      kicker: "MODEL DISAGREEMENT",
      title: "掲載判断が分かれた",
      value: "37%",
      summary: "同じ観測日・同じ固定質問で、契約モデル間の掲載有無が一致しなかった割合です。",
      sections: [
        { title: "判定条件", facts: [
          { label: "比較単位", value: "同一観測日 × 同一固定質問" },
          { label: "比較モデル", value: models.join(" / ") || "比較対象不足" },
          { label: "欠測", value: "判断不一致とは分離", tone: "amber" }
        ] },
        { title: "判断が分かれた代表照合", table: {
          columns: ["照合ID", "観測日", "固定質問", ...modelColumns, "判定"],
          rows: [["MATCH-20260706-P02", "2026-07-06", "AI検索で自社が引用されるには何を整備すべき？", ...splitResults, "掲載有無が不一致"]]
        } }
      ]
    },
    {
      kicker: "DAILY STABILITY",
      title: "日次状態維持",
      value: "72%",
      summary: "同じAIモデル・同じ固定質問を隣接日で照合し、掲載状態が維持された割合です。",
      sections: [
        { title: "判定条件", facts: [
          { label: "比較単位", value: "同一AIモデル × 同一固定質問 × 隣接日" },
          { label: "比較可能条件", value: "両日とも有効回答" },
          { label: "欠測", value: "維持・変化の分母から除外", tone: "amber" }
        ] },
        { title: "日次状態を維持した代表照合", table: {
          columns: ["照合ID", "AIモデル", "固定質問", "2026-07-05", "2026-07-06", "判定"],
          rows: [
            ["PAIR-20260705-06-P01", models[0] ?? "比較対象不足", "GEO対策ツールのおすすめは？", "掲載あり", "掲載あり", "状態維持"],
            ["PAIR-20260705-06-P02", models[1] ?? models[0] ?? "比較対象不足", "AI検索で自社が引用されるには何を整備すべき？", "未掲載", "未掲載", "状態維持"]
          ]
        } }
      ]
    },
    {
      kicker: "INSUFFICIENT COMPARISON",
      title: "比較対象不足",
      value: "4%",
      summary: "欠測または有効モデル不足により、モデル合意度や日次安定性を判定できなかった割合です。",
      sections: [
        { title: "除外条件", facts: [
          { label: "モデル合意度", value: "同じ質問で有効モデルが1件以下" },
          { label: "日次安定性", value: "隣接日のどちらかが欠測" },
          { label: "指標の扱い", value: "不一致や状態変化には数えない", tone: "amber" }
        ] },
        { title: "比較できなかった代表照合", table: {
          columns: ["照合ID", "AIモデル", "固定質問", "前日", "当日", "判定"],
          rows: [["PAIR-20260705-06-P03", models[2] ?? models[0] ?? "比較対象不足", "GEO対策ツールの料金を比較して", "有効・掲載あり", "欠測", "比較対象外"]]
        } }
      ]
    },
    {
      kicker: "MODEL AGREEMENT",
      title: "全モデルで未掲載",
      value: "18%",
      summary: "同じ観測日・同じ固定質問で、有効だった全契約モデルが自社を掲載しなかった割合です。",
      sections: [
        { title: "判定条件", facts: [
          { label: "比較単位", value: "同一観測日 × 同一固定質問" },
          { label: "比較モデル", value: models.join(" / ") },
          { label: "判定", value: "全モデルで掲載なし" }
        ] },
        { title: "全モデルで未掲載だった代表照合", table: {
          columns: ["照合ID", "観測日", "固定質問", ...modelColumns, "判定"],
          rows: [["MATCH-20260706-P04", "2026-07-06", "AI検索の効果測定サービスは？", ...allUnlisted, "全モデルで未掲載"]]
        } }
      ]
    },
    {
      kicker: "DAILY CHANGE",
      title: "日次で掲載状態が変化",
      value: "24%",
      summary: "同じAIモデル・同じ固定質問を隣接日で照合し、掲載あり／なしが変わった割合です。",
      sections: [
        { title: "判定条件", facts: [
          { label: "比較単位", value: "同一AIモデル × 同一固定質問 × 隣接日" },
          { label: "比較可能条件", value: "両日とも有効回答" },
          { label: "欠測", value: "状態変化には数えない", tone: "amber" }
        ] },
        { title: "掲載状態が変わった代表照合", table: {
          columns: ["照合ID", "AIモデル", "固定質問", "前日", "当日", "変化"],
          rows: [
            ["PAIR-20260705-06-P05", models[0] ?? "対象モデル", "AI検索の競合分析サービスは？", "未掲載", "掲載あり", "掲載へ変化"],
            ["PAIR-20260705-06-P06", models[1] ?? models[0] ?? "対象モデル", "GEO対策の費用相場は？", "掲載あり", "未掲載", "未掲載へ変化"]
          ]
        } }
      ]
    }
  ];
}

type StabilitySegment = {
  label: string;
  value: number;
  note: string;
  color: string;
  detail: ReportDetailPayload;
};

function StabilityDistribution({
  label,
  segments
}: {
  label: string;
  segments: StabilitySegment[];
}) {
  const gridColumns = segments.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <div className="mt-4">
      <div className="flex h-3 overflow-hidden rounded-sm bg-[#EEF2F0]" aria-label={label} role="img">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="h-full border-r border-white/80 last:border-r-0"
            style={{ width: `${segment.value}%`, backgroundColor: segment.color }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className={`mt-3 grid overflow-hidden border-y border-[#DCE5E1] sm:grid-cols-2 ${gridColumns}`}>
        {segments.map((segment) => (
          <ReportDetailButton
            key={segment.label}
            detail={segment.detail}
            showIcon={false}
            className="min-h-[92px] w-full items-start justify-between gap-3 rounded-none border-b border-[#E5EAE8] bg-white px-4 py-3 text-left hover:bg-[#F4F8F6] sm:border-r lg:border-b-0"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[12px] font-bold text-[#344054]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} aria-hidden="true" />
                {segment.label}
              </span>
              <span className="mt-2 block text-[25px] font-bold tabular-nums text-[#101828]">{segment.value}%</span>
              <span className="mt-1 block text-[11px] leading-4 text-[#667085]">{segment.note}</span>
            </span>
          </ReportDetailButton>
        ))}
      </div>
    </div>
  );
}

type ChangeMetric = {
  key: string;
  label: string;
  changeSuffix: string;
  valueSuffix: string;
  lowerIsBetter?: boolean;
};

type ChangeRow = {
  axis: "AIモデル" | "ペルソナ" | "トピック" | "競合差";
  target: string;
  values: number[];
  previous: number[];
};

const changeMetrics: ChangeMetric[] = [
  { key: "ai-presence", label: "AI表示率", changeSuffix: "pt", valueSuffix: "%" },
  { key: "sov", label: "AI内シェア", changeSuffix: "pt", valueSuffix: "%" },
  { key: "position", label: "平均掲載位置", changeSuffix: "位", valueSuffix: "位", lowerIsBetter: true },
  { key: "citation", label: "公式サイト引用率", changeSuffix: "pt", valueSuffix: "%" }
];

const changeRows: ChangeRow[] = [
  { axis: "AIモデル", target: "GPT", values: [5, 3, -0.4, 4], previous: [57, 24, 2.8, 31] },
  { axis: "AIモデル", target: "Gemini", values: [-2, -1, 0.3, -3], previous: [56, 22, 2.8, 31] },
  { axis: "AIモデル", target: "Perplexity", values: [3, 2, -0.2, 5], previous: [56, 23, 2.9, 34] },
  { axis: "AIモデル", target: "Google AI Mode", values: [6, 4, -0.5, 4], previous: [60, 25, 2.6, 38] },
  { axis: "ペルソナ", target: "マーケ責任者", values: [4, 2, -0.2, 3], previous: [55, 23, 3.0, 30] },
  { axis: "ペルソナ", target: "導入担当", values: [-3, -2, 0.4, -2], previous: [58, 25, 2.7, 32] },
  { axis: "ペルソナ", target: "経営者", values: [2, 1, -0.1, 2], previous: [52, 20, 3.2, 27] },
  { axis: "トピック", target: "競合比較", values: [8, 5, -0.5, 6], previous: [58, 26, 2.7, 32] },
  { axis: "トピック", target: "測定方法", values: [5, 3, -0.3, 7], previous: [54, 21, 3.1, 29] },
  { axis: "トピック", target: "料金・導入", values: [-4, -3, 0.5, -2], previous: [55, 23, 2.8, 30] },
  { axis: "競合差", target: "Trailbaseとの差", values: [3, 2, -0.3, 4], previous: [-17, -12, 1.2, -14] },
  { axis: "競合差", target: "SignalNestとの差", values: [2, 1, -0.2, 3], previous: [-8, -5, 0.8, -7] }
];

function signedChange(value: number, suffix: string) {
  if (value === 0) return `±0${suffix}`;
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function changeToneClass(value: number, metric: ChangeMetric) {
  const direction = metric.lowerIsBetter ? -value : value;
  const strength = Math.abs(value);
  if (direction > 0 && strength >= 4) return "bg-[#0B6B57] text-white";
  if (direction > 0) return "bg-[#D8EEE5] text-[#075E44]";
  if (direction < 0 && strength >= 4) return "bg-[#9E3D32] text-white";
  if (direction < 0) return "bg-[#F7E7D4] text-[#8A4B00]";
  return "bg-[#F2F4F7] text-[#475467]";
}

function buildChangeCellDetail(
  row: ChangeRow,
  metric: ChangeMetric,
  columnIndex: number,
  models: string[],
  detailHref?: string
): ReportDetailPayload {
  const change = row.values[columnIndex] ?? 0;
  const previous = row.previous[columnIndex] ?? 0;
  const current = previous + change;
  const valueSuffix = row.axis === "競合差" ? metric.changeSuffix : metric.valueSuffix;
  const improved = (metric.lowerIsBetter ? -change : change) > 0;
  const modelA = models[0] ?? "対象モデル";
  const modelB = models[1] ?? modelA;

  return {
    kicker: `${row.axis}別の変化`,
    title: `${row.target}の${metric.label}変化`,
    value: signedChange(change, metric.changeSuffix),
    summary: "前期間と今期間で同じ条件を比較した変化量です。原因や施策効果を断定するものではありません。",
    sections: [
      { title: "前期間との比較", facts: [
        { label: "対象", value: row.target },
        { label: "比較指標", value: metric.label },
        { label: "前期間", value: `${previous}${valueSuffix}` },
        { label: "今期間", value: `${current}${valueSuffix}` },
        { label: "変化", value: signedChange(change, metric.changeSuffix), tone: improved ? "green" : change === 0 ? undefined : "amber" }
      ] },
      { title: "変化が大きかった内訳", table: {
        columns: ["比較軸", "対象", "前期間", "今期間", "差"],
        rows: [
          ["AIモデル", modelA, "54%", "61%", "+7pt"],
          ["ペルソナ", "マーケ責任者", "55%", "59%", "+4pt"],
          ["トピック", "競合比較", "58%", "66%", "+8pt"]
        ]
      } },
      { title: "掲載状態が変わった代表質問", table: {
        columns: ["固定質問", "AIモデル", "前期間", "今期間"],
        rows: [
          ["GEO対策ツールを比較して", modelA, "未掲載", "2位で掲載"],
          ["AI検索の測定方法は？", modelB, "4位で掲載", "1位で掲載"]
        ]
      } }
    ],
    detailHref,
    detailLabel: detailHref ? "変化一覧でほかの対象も比較" : undefined
  };
}

function ChangeHeatmap({
  rows,
  models,
  detailHref
}: {
  rows: ChangeRow[];
  models: string[];
  detailHref?: string;
}) {
  const gridTemplateColumns = `minmax(210px,1.45fr) repeat(${changeMetrics.length},minmax(108px,1fr))`;
  return (
    <div className="min-w-0">
      <div className="hidden gap-px overflow-hidden border border-[#DDE5E1] bg-[#DDE5E1] md:grid" style={{ gridTemplateColumns }} role="table" aria-label="変化が大きかった対象">
        <div className="bg-[#F8FAF9] px-4 py-3 text-[12px] font-bold text-[#667085]" role="columnheader">対象</div>
        {changeMetrics.map((metric) => <div key={metric.key} className="bg-[#F8FAF9] px-3 py-3 text-center text-[12px] font-bold leading-5 text-[#475467]" role="columnheader">{metric.label}</div>)}
        {rows.map((row) => {
          const largestMagnitude = Math.max(...row.values.map((value) => Math.abs(value)));
          return (
            <div key={`${row.axis}-${row.target}`} className="contents" role="row">
              <div className="bg-white px-4 py-3" role="rowheader">
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">{row.axis}</span>
                <span className="mt-1 block break-words text-[13px] font-bold text-[#101828]">{row.target}</span>
              </div>
              {changeMetrics.map((metric, columnIndex) => {
                const value = row.values[columnIndex] ?? 0;
                const strongest = Math.abs(value) === largestMagnitude;
                return (
                  <ReportDetailButton
                    key={metric.key}
                    detail={buildChangeCellDetail(row, metric, columnIndex, models, detailHref)}
                    showIcon={false}
                    className={`min-h-14 w-full items-center justify-center rounded-none px-3 py-3 text-center text-[14px] font-bold tabular-nums transition hover:ring-2 hover:ring-inset hover:ring-[#0B382D] ${strongest ? "ring-2 ring-inset ring-[#0B382D]" : ""} ${changeToneClass(value, metric)}`}
                    label={`${row.target}、${metric.label}、${signedChange(value, metric.changeSuffix)}の内訳を開く`}
                  >
                    {signedChange(value, metric.changeSuffix)}
                  </ReportDetailButton>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <section key={`${row.axis}-${row.target}`} className="border border-[#DFE6E2] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">{row.axis}</p>
            <h3 className="mt-1 text-sm font-bold text-[#101828]">{row.target}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {changeMetrics.map((metric, columnIndex) => {
                const value = row.values[columnIndex] ?? 0;
                return (
                  <ReportDetailButton
                    key={metric.key}
                    detail={buildChangeCellDetail(row, metric, columnIndex, models, detailHref)}
                    showIcon={false}
                    className={`min-h-20 w-full rounded-md px-3 py-2.5 text-left ${changeToneClass(value, metric)}`}
                    label={`${row.target}、${metric.label}、${signedChange(value, metric.changeSuffix)}の内訳を開く`}
                  >
                    <span><span className="block text-[11px] font-semibold leading-4">{metric.label}</span><strong className="mt-1 block text-sm tabular-nums">{signedChange(value, metric.changeSuffix)}</strong></span>
                  </ReportDetailButton>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#667085]" aria-label="ヒートマップの色">
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 bg-[#0B6B57]" />改善が大きい</span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 bg-[#D8EEE5]" />改善</span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 bg-[#F2F4F7]" />変化なし</span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 bg-[#F7E7D4]" />悪化</span>
        <span className="w-full text-[#667085] sm:w-auto">平均掲載位置は数値が下がる変化を改善として表示</span>
      </div>
    </div>
  );
}

export function TrendAnalysisContent({
  reportBase,
  provider = "全モデル",
  models = ["GPT","Gemini","Perplexity","Google AI Mode"]
}: {
  reportBase: string;
  range?: string;
  provider?: string;
  models?: string[];
}) {
  const [chartRanges, setChartRanges] = useState<Record<TrendChartId, TrendRange>>(createDefaultChartRanges);
  const [visibilityCompetitor, setVisibilityCompetitor] = useState(trendCompetitors[0].name);
  const [sovCompetitor, setSovCompetitor] = useState(trendCompetitors[0].name);
  const [positionCompetitor, setPositionCompetitor] = useState(trendCompetitors[0].name);
  const [citationCompetitor, setCitationCompetitor] = useState(trendCompetitors[0].name);
  const [modelFocus, setModelFocus] = useState<string | null>(() => models.includes(provider) ? provider : null);
  const metrics = trendMetrics[defaultTrendRange];
  const highlightedModel = modelFocus && models.includes(modelFocus) ? modelFocus : null;
  const stabilityDetails = buildStabilityDetails(models);
  const activeChangeRows = changeRows.filter((row) => row.axis !== "AIモデル" || models.includes(row.target));
  const leadingModelChange = activeChangeRows
    .filter((row) => row.axis === "AIモデル")
    .sort((left, right) => Math.max(...right.values.map(Math.abs)) - Math.max(...left.values.map(Math.abs)))[0];
  const parentChangeRows = [
    leadingModelChange,
    activeChangeRows.find((row) => row.target === "マーケ責任者"),
    activeChangeRows.find((row) => row.target === "競合比較"),
    activeChangeRows.find((row) => row.target === "Trailbaseとの差")
  ].filter((row): row is ChangeRow => Boolean(row));
  const changeDetailHref = `${reportBase}/trends/changes?return=${encodeURIComponent(`${reportBase}/trends#trend-contribution`)}`;
  const updateChartRange = (chartId: TrendChartId, chartRange: TrendRange) => {
    setChartRanges((current) => current[chartId] === chartRange ? current : { ...current, [chartId]: chartRange });
  };
  const modelRows = models.map((model, index) => {
    const profile = modelProfiles[model] ?? { aiPresence: 52 + index * 3, sov: 20 + index * 2, position: 3, citation: 24 + index * 3, delta: 0, missing: 0, color: "#475569" };
    const presence = profile.aiPresence + (metrics.aiPresence - trendMetrics["30日"].aiPresence);
    const position = Math.max(1, profile.position + (metrics.position - trendMetrics["30日"].position));
    return [
      <span key={`${model}-label`} className="inline-flex flex-wrap items-center gap-2 font-bold"><TrendModelIdentity name={model} color={profile.color} />{highlightedModel === model ? <DataRichBadge tone="green">強調中</DataRichBadge> : null}</span>,
      `${presence}%`,
      `${signed(profile.delta)}pt`,
      `${position.toFixed(1)}位`,
      `${Math.max(1, Math.round(profile.missing * missingScale[defaultTrendRange]))}件`
    ];
  });
  const rankingPositionRange = chartRanges["ranking-position"];
  const rankingGapRange = chartRanges["ranking-gap"];
  const rankingPositionMetrics = trendMetrics[rankingPositionRange];
  const rankingGapMetrics = trendMetrics[rankingGapRange];
  const rankSeriesValues = trendValues(rankingPositionMetrics.rank, rankingPositionRange, -0.14);
  const gapSeriesValues = trendValues(Math.max(8, 20 - rankingGapMetrics.aiDelta), rankingGapRange, -0.3).map((value) => -value);
  return (
    <>
      <DataRichPanel id="trend-ai-presence" title="AI表示率推移" description="自社と選択した競合を、同じ質問・同じAIモデル・同じ観測日で比較します。期間と競合はこのグラフだけに反映されます。">
        <LocalTrendChart
          detailType="ai-visibility"
          range={chartRanges["ai-presence"]}
          onRangeChange={(chartRange) => updateChartRange("ai-presence", chartRange)}
          models={models}
          unit="%"
          deltaUnit="pt"
          comparisonControl={{
            label: "比較する競合",
            value: visibilityCompetitor,
            options: trendCompetitors.map((competitor) => competitor.name),
            onChange: setVisibilityCompetitor
          }}
          showLatestComparison
          build={(chartRange) => {
            const series = visibilitySeries(chartRange, visibilityCompetitor);
            const index = annotationIndex(chartRange, "2026-07-02", series[0]?.values.length ?? 2);
            return {
              series,
              annotations: [{
                index,
                label: "競合比較トピックで掲載状態が変化",
                detail: buildAiVisibilityChangeDetail(chartRange, visibilityCompetitor, series, index)
              }]
            };
          }}
        />
      </DataRichPanel>
      <DataRichPanel
        id="trend-models"
        title="AIモデル別 AI表示率推移"
        description={models.length === 1 ? `${models[0]}のAI表示率を日次で確認します。` : `契約中の${models.length}モデルを、同じ質問集合と観測日で比較します。`}
      >
        <ModelTrendFocusControl models={models} value={highlightedModel} onChange={setModelFocus} />
        <LocalTrendChart detailType="model-visibility" range={chartRanges["model-presence"]} onRangeChange={(chartRange) => updateChartRange("model-presence", chartRange)} models={models} unit="%" deltaUnit="pt" build={(chartRange) => ({ series: modelVisibilitySeries(chartRange, models, highlightedModel) })} />
      </DataRichPanel>
      <DataRichPanel id="trend-sov" title="AI内シェア（SOV）推移" description="全ブランドの掲載量に占める割合を、自社と選択した競合で比較します。期間と競合はこのグラフだけに反映されます。">
        <LocalTrendChart
          detailType="sov"
          range={chartRanges.sov}
          onRangeChange={(chartRange) => updateChartRange("sov", chartRange)}
          models={models}
          unit="%"
          deltaUnit="pt"
          comparisonControl={{
            label: "比較する競合",
            value: sovCompetitor,
            options: trendCompetitors.map((competitor) => competitor.name),
            onChange: setSovCompetitor
          }}
          showLatestComparison
          build={(chartRange) => {
            const series = sovSeries(chartRange, sovCompetitor);
            const index = annotationIndex(chartRange, "2026-07-03", series[0]?.values.length ?? 2);
            return {
              series,
              annotations: [{
                index,
                label: "比較検討の質問でAI内シェアが変化",
                detail: buildSovChangeDetail(chartRange, sovCompetitor, series, index)
              }]
            };
          }}
        />
      </DataRichPanel>
      <DataRichPanel id="trend-position" title="平均掲載位置推移" description="掲載された回答だけの平均順位です。値が小さいほど上位で、未掲載と欠測は平均へ混ぜません。">
        <LocalTrendChart
          detailType="average-position"
          range={chartRanges["average-position"]}
          onRangeChange={(chartRange) => updateChartRange("average-position", chartRange)}
          models={models}
          lowerIsBetter
          unit="位"
          decimals={1}
          comparisonControl={{
            label: "比較する競合",
            value: positionCompetitor,
            options: trendCompetitors.map((competitor) => competitor.name),
            onChange: setPositionCompetitor
          }}
          showLatestComparison
          build={(chartRange) => {
            const series = averagePositionSeries(chartRange, positionCompetitor);
            const index = annotationIndex(chartRange, "2026-07-01", series[0]?.values.length ?? 2);
            return {
              series,
              annotations: [{
                index,
                label: "1位掲載が増えた質問を確認",
                detail: buildAveragePositionChangeDetail(chartRange, positionCompetitor, series, index)
              }]
            };
          }}
        />
      </DataRichPanel>
      <DataRichPanel id="trend-ranking" title="ブランドランキング推移" description="単位の異なる順位（位）と首位差（pt）を別グラフで表示します。">
        <section aria-labelledby="ranking-position-heading">
          <h3 id="ranking-position-heading" className="text-[13px] font-bold text-[#344054]">自社順位（位）</h3>
          <div className="mt-3">
            <LocalTrendChart detailType="ranking" range={rankingPositionRange} onRangeChange={(chartRange) => updateChartRange("ranking-position", chartRange)} models={models} lowerIsBetter unit="位" showLatestSnapshot build={(chartRange) => {
              const series = [{ name:"Recora順位", color:"#0B6B57", values:trendValues(trendMetrics[chartRange].rank, chartRange, -0.14) }];
              const index = annotationIndex(chartRange, "2026-07-02", series[0].values.length);
              return { series, annotations: [{ index, label: "SignalNestを抜いて3位へ", detail: buildRankingDayDetail(chartRange, series, index) }] };
            }} />
          </div>
        </section>
        <section className="mt-7 border-t border-[#DCE5E1] pt-6" aria-labelledby="ranking-gap-heading">
          <h3 id="ranking-gap-heading" className="text-[13px] font-bold text-[#344054]">首位とのAI表示率差（pt）</h3>
          <div className="mt-3">
            <LocalTrendChart detailType="ranking-gap" range={rankingGapRange} onRangeChange={(chartRange) => updateChartRange("ranking-gap", chartRange)} models={models} unit="pt" showLatestSnapshot build={(chartRange) => {
              const series = [{ name:"首位との差", color:"#B7791F", values:trendValues(Math.max(8, 20 - trendMetrics[chartRange].aiDelta), chartRange, -0.3).map((value) => -value), dashed:true }];
              const index = annotationIndex(chartRange, "2026-07-04", series[0].values.length);
              return { series, annotations: [{ index, label: "首位との差が縮小", detail: buildRankingGapDayDetail(chartRange, series, index) }] };
            }} />
          </div>
        </section>
        <ReportDataTable detailType="ranking-period-snapshot" columns={["対象","グラフ期間","前期間","今期間","首位","有効比較"]} rows={[
          ["自社順位",rankingPositionRange,`${rankSeriesValues[0]}位`,`${rankSeriesValues[rankSeriesValues.length - 1]}位`,"Trailbase",rankingPositionMetrics.valid],
          ["AI表示率差",rankingGapRange,`${gapSeriesValues[0]}pt`,`${gapSeriesValues[gapSeriesValues.length - 1]}pt`,"Trailbase",rankingGapMetrics.valid]
        ]} />
      </DataRichPanel>
      <DataRichPanel id="trend-citation" title="公式サイト引用率推移" description="自社と選択競合の公式ドメインが回答内で引用された割合を比較します。引用元の継続・消失は「引用・参照元」で確認します。">
        <LocalTrendChart
          detailType="citation-source-retention"
          range={chartRanges["citation-retention"]}
          onRangeChange={(chartRange) => updateChartRange("citation-retention", chartRange)}
          models={models}
          unit="%"
          deltaUnit="pt"
          comparisonControl={{
            label: "比較する競合",
            value: citationCompetitor,
            options: trendCompetitors.map((competitor) => competitor.name),
            onChange: setCitationCompetitor
          }}
          showLatestComparison
          build={(chartRange) => {
            const series = citationSeries(chartRange, citationCompetitor);
            const index = annotationIndex(chartRange, "2026-07-04", series[0]?.values.length ?? 2);
            return {
              series,
              annotations: [{ index, label: "公式サイト引用が増えた回答を確認", detail: buildCitationChangeDetail(chartRange, citationCompetitor, series, index) }]
            };
          }}
        />
      </DataRichPanel>
      <DataRichPanel
        id="trend-stability"
        title={models.length > 1 ? "モデル間の一致・日次安定性" : "日次安定性"}
        description={models.length > 1
          ? "同じ質問への掲載判断がAIモデル間でどれだけ揃うかと、前日から掲載状態がどれだけ変わらないかを分けて確認します。"
          : "同じAIモデル・同じ質問の掲載状態が、前日からどれだけ変わらないかを確認します。"}
      >
        {models.length > 1 ? (
          <section aria-labelledby="model-agreement-heading">
            <h3 id="model-agreement-heading" className="text-[14px] font-bold text-[#101828]">AIモデル間の掲載判断</h3>
            <p className="mt-1 text-[12px] leading-5 text-[#667085]">同じ日・同じ質問で、有効だった契約モデルの掲載有無を照合した構成です。</p>
            <StabilityDistribution
              label="AIモデル間の掲載判断の構成"
              segments={[
                { label: "全モデルで掲載", value: 41, note: `${models.length}/${models.length}モデルで掲載`, color: "#075E44", detail: stabilityDetails[0] },
                { label: "掲載判断が分かれた", value: 37, note: "モデル間で掲載有無が不一致", color: "#B7791F", detail: stabilityDetails[1] },
                { label: "全モデルで未掲載", value: 18, note: `${models.length}/${models.length}モデルで未掲載`, color: "#667085", detail: stabilityDetails[4] },
                { label: "比較できない", value: 4, note: "欠測または有効モデル不足", color: "#C7D2CC", detail: stabilityDetails[3] }
              ]}
            />
          </section>
        ) : null}
        <section className={models.length > 1 ? "mt-7 border-t border-[#DCE5E1] pt-6" : ""} aria-labelledby="daily-stability-heading">
          <h3 id="daily-stability-heading" className="text-[14px] font-bold text-[#101828]">前日からの掲載状態</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#667085]">同じAIモデル・同じ質問を隣接日で照合した構成です。</p>
          <StabilityDistribution
            label="前日からの掲載状態の構成"
            segments={[
              { label: "掲載状態を維持", value: 72, note: "掲載あり／なしが前日と同じ", color: "#075E44", detail: stabilityDetails[2] },
              { label: "掲載状態が変化", value: 24, note: "掲載あり／なしが前日から変化", color: "#B7791F", detail: stabilityDetails[5] },
              { label: "比較できない", value: 4, note: "どちらかの日が欠測", color: "#C7D2CC", detail: stabilityDetails[3] }
            ]}
          />
        </section>
        <section className="mt-7 border-t border-[#DCE5E1] pt-6" aria-labelledby="model-observation-heading">
          <h3 id="model-observation-heading" className="text-[14px] font-bold text-[#101828]">AIモデル別の観測状況</h3>
          <p className="mb-3 mt-1 text-[12px] leading-5 text-[#667085]">契約中のAIモデルだけを表示します。</p>
          <ReportDataTable
            detailType="stability"
            columns={["モデル","AI表示率","前期間差","掲載位置中央値","最新測定日の欠測"]}
            rows={modelRows}
            highlightedRow={(_, index) => highlightedModel === models[index]}
          />
        </section>
        <section className="mt-7 border-t border-[#DCE5E1] pt-6" aria-labelledby="observation-quality-heading">
          <h3 id="observation-quality-heading" className="text-[14px] font-bold text-[#101828]">観測品質の推移</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#667085]">観測できた割合と欠測数は単位が異なるため、別々のグラフで確認します。</p>
          <section className="mt-5" aria-labelledby="observation-success-heading">
            <h4 id="observation-success-heading" className="text-[13px] font-bold text-[#344054]">観測成功率</h4>
            <div className="mt-3">
              <LocalTrendChart
                detailType="observation-quality"
                range={chartRanges["observation-success"]}
                onRangeChange={(chartRange) => updateChartRange("observation-success", chartRange)}
                models={models}
                unit="%"
                deltaUnit="pt"
                decimals={1}
                showLatestSnapshot
                build={(chartRange) => {
                  const series = observationQualitySeries(chartRange, models, "success");
                  const index = annotationIndex(chartRange, "2026-07-03", series[0]?.values.length ?? 2);
                  return {
                    series,
                    annotations: [{ index, label: "成功率が戻った日", detail: buildObservationQualityDetail(series[0], chartRange, models, index) }]
                  };
                }}
              />
            </div>
          </section>
          <section className="mt-7 border-t border-[#E5EAE8] pt-6" aria-labelledby="missing-observations-heading">
            <h4 id="missing-observations-heading" className="text-[13px] font-bold text-[#344054]">欠測数 <span className="ml-1 text-[11px] font-semibold text-[#667085]">少ないほど安定</span></h4>
            <div className="mt-3">
              <LocalTrendChart
                detailType="observation-quality"
                range={chartRanges["missing-observations"]}
                onRangeChange={(chartRange) => updateChartRange("missing-observations", chartRange)}
                models={models}
                unit="件"
                lowerIsBetter
                invertScale={false}
                showLatestSnapshot
                build={(chartRange) => {
                  const series = observationQualitySeries(chartRange, models, "missing");
                  const index = annotationIndex(chartRange, "2026-07-04", series[0]?.values.length ?? 2);
                  return {
                    series,
                    annotations: [{ index, label: "欠測が増えた日", detail: buildObservationQualityDetail(series[0], chartRange, models, index) }]
                  };
                }}
              />
            </div>
          </section>
        </section>
      </DataRichPanel>
      <DataRichPanel id="trend-contribution" title="変化が大きかった対象" description="前期間からの変化量を、モデル・ペルソナ・トピック・競合差と主要指標の交点で比較します。原因や施策効果を示すものではありません。">
        <ChangeHeatmap rows={parentChangeRows} models={models} detailHref={changeDetailHref} />
        <div className="mt-6 flex flex-col gap-3 border-t border-[#DCE5E1] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-5 text-[#667085]">ここでは各軸で変化量が大きい対象だけを表示しています。</p>
          <DataRichPrimaryAction href={changeDetailHref} variant="secondary">変化した対象をすべて見る</DataRichPrimaryAction>
        </div>
      </DataRichPanel>
    </>
  );
}


export function TrendChangesDetailContent({
  models
}: {
  models: string[];
}) {
  const rows = changeRows.filter((row) => row.axis !== "AIモデル" || models.includes(row.target));
  const rankedCells = rows
    .flatMap((row) => changeMetrics.map((metric, columnIndex) => ({ row, metric, columnIndex, value: row.values[columnIndex] ?? 0 })))
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 12);

  return (
    <>
      <DataRichPanel title="変化量の大きい順" description="指標をまたいで変化量の絶対値が大きい順に表示します。平均掲載位置は位、それ以外はptで比較します。">
        <div className="overflow-hidden border-y border-[#DCE5E1]">
          {rankedCells.map((item, index) => {
            const previous = item.row.previous[item.columnIndex] ?? 0;
            const current = previous + item.value;
            const valueSuffix = item.row.axis === "競合差" ? item.metric.changeSuffix : item.metric.valueSuffix;
            return (
              <ReportDetailButton
                key={`${item.row.axis}-${item.row.target}-${item.metric.key}`}
                detail={buildChangeCellDetail(item.row, item.metric, item.columnIndex, models)}
                showIcon={false}
                className="grid min-h-16 w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-none border-b border-[#E5EAE8] bg-white px-3 py-3 text-left last:border-b-0 hover:bg-[#F4F8F6] sm:grid-cols-[44px_minmax(180px,1.2fr)_minmax(140px,0.8fr)_minmax(170px,1fr)_90px]"
                label={`${item.row.target}の${item.metric.label}変化を開く`}
              >
                <span className="text-[12px] font-bold tabular-nums text-[#667085]">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">{item.row.axis}</span>
                  <span className="mt-0.5 block break-words text-[13px] font-bold text-[#101828]">{item.row.target}</span>
                </span>
                <span className="hidden text-[12px] font-bold text-[#344054] sm:block">{item.metric.label}</span>
                <span className="hidden text-[12px] tabular-nums text-[#667085] sm:block">{previous}{valueSuffix} → {current}{valueSuffix}</span>
                <strong className={`text-right text-[14px] font-bold tabular-nums ${(item.metric.lowerIsBetter ? -item.value : item.value) >= 0 ? "text-[#075E44]" : "text-[#8A4B00]"}`}>{signedChange(item.value, item.metric.changeSuffix)}</strong>
              </ReportDetailButton>
            );
          })}
        </div>
      </DataRichPanel>
      <DataRichPanel title="全対象の変化ヒートマップ" description="契約中のAIモデルと、ペルソナ・トピック・競合差を同じ主要指標で比較します。">
        <ChangeHeatmap rows={rows} models={models} />
      </DataRichPanel>
    </>
  );
}
