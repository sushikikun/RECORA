"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, ArrowUpRight, BarChart3, Brain, Building2, ChevronRight, CircleGauge, Compass, Database, Filter, Gauge, GitCompare, Layers3, LineChart, ListChecks, Search, Target, Trophy, Users } from "lucide-react";
import styles from "./customer-report-production-design.module.css";

export type CustomerReportDesignVariant = "executive" | "analyst" | "action";
type TabId = "t01" | "t02" | "t03" | "t04" | "t05" | "t06" | "t07";
type Tone = "blue" | "green" | "amber" | "red" | "slate" | "violet";
type Column = { key: string; label: string; align?: "left" | "right" | "center" };
type Row = { id: string; cells: Record<string, ReactNode>; highlight?: boolean };
type Bar = { label: string; value: number; suffix?: string; meta?: string; tone?: Tone };

export function normalizeCustomerReportDesignVariant(value: string | string[] | undefined): CustomerReportDesignVariant {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "executive" || raw === "analyst" || raw === "action" ? raw : "action";
}

const meta = {
  projectName: "ミエルカSEO",
  targetDomain: "mieru-ca.com",
  period: "2026年6月2日〜2026年7月1日",
  updatedAt: "2026年7月1日 18:30",
  targetBrand: "ミエルカSEO",
  models: ["ChatGPT", "Gemini", "Perplexity", "Claude"],
  competitors: ["Ahrefs", "Keywordmap", "SEARCH WRITE", "SEMrush", "EmmaTools", "Gyro-n SEO", "TACT SEO", "Similarweb"]
};

const tabs: Array<{ id: TabId; code: string; label: string; summary: string; icon: LucideIcon }> = [
  { id: "t01", code: "T01", label: "レポート概要", summary: "全体状態と主要KPI", icon: CircleGauge },
  { id: "t02", code: "T02", label: "ブランド・競合", summary: "競合差分と勝ち筋", icon: Trophy },
  { id: "t03", code: "T03", label: "ペルソナ・用途・トピック", summary: "検討者別の強弱", icon: Users },
  { id: "t04", code: "T04", label: "プロンプト・質問", summary: "質問別の露出差分", icon: Search },
  { id: "t05", code: "T05", label: "AI回答・ランキング", summary: "掲載位置と推薦順", icon: Brain },
  { id: "t06", code: "T06", label: "参照元・引用", summary: "引用元と所有者分類", icon: Database },
  { id: "t07", code: "T07", label: "改善候補・施策", summary: "優先施策と実行候補", icon: ListChecks }
];

const variants: Record<CustomerReportDesignVariant, { label: string; title: string; desc: string; stance: string; icon: LucideIcon }> = {
  executive: { label: "Executive", title: "経営判断ビュー", desc: "全体スコア、競合差、優先論点を先に置き、会議での意思決定に必要な情報を短い導線で確認できます。", stance: "要点先行", icon: Gauge },
  analyst: { label: "Analyst", title: "分析探索ビュー", desc: "ヒートマップ、詳細表、比較バーを高密度に並べ、指標の分解と原因探索をしやすくします。", stance: "分析深掘り", icon: BarChart3 },
  action: { label: "Action", title: "施策実行ビュー", desc: "改善候補、影響範囲、参照タブを近くに置き、レポート確認から実行計画へ移りやすくします。", stance: "実行接続", icon: Target }
};

const scoreTrend = [{ label: "6/25", value: 61 }, { label: "6/26", value: 63 }, { label: "6/27", value: 64 }, { label: "6/28", value: 66 }, { label: "6/29", value: 65 }, { label: "6/30", value: 67 }, { label: "7/1", value: 68 }];
const kpis = [
  { label: "AI表示率・出現率", value: "54.8%", delta: "+3.2pt", helper: "対象質問のうち、自社ブランドがAI回答に表示された割合", tone: "blue" as Tone },
  { label: "Share of Voice", value: "31.6%", delta: "+1.8pt", helper: "ブランド露出全体のうち、自社が占めた割合", tone: "green" as Tone },
  { label: "自社ドメイン引用率", value: "22.4%", delta: "+0.9pt", helper: "AI回答で自社ドメインが引用元として使われた割合", tone: "violet" as Tone },
  { label: "平均掲載位置", value: "2.7位", delta: "-0.2位", helper: "AI回答内で自社ブランドが平均して出る位置", tone: "amber" as Tone },
  { label: "ブランド印象スコア", value: "72", delta: "+4", helper: "AI回答内で自社ブランドがどの印象で語られるかの補助指標", tone: "slate" as Tone }
];
const brandTop = [
  { rank: 1, brand: "Ahrefs", sov: "34.2%", visibility: "62.5%", position: "2.1", citation: "30.8%" },
  { rank: 2, brand: "ミエルカSEO", sov: "31.6%", visibility: "54.8%", position: "2.7", citation: "22.4%", own: true },
  { rank: 3, brand: "Keywordmap", sov: "18.9%", visibility: "42.1%", position: "3.2", citation: "16.2%" },
  { rank: 4, brand: "SEARCH WRITE", sov: "9.4%", visibility: "25.6%", position: "4.1", citation: "8.5%" },
  { rank: 5, brand: "SEMrush", sov: "5.9%", visibility: "18.3%", position: "4.6", citation: "11.8%" }
];
const brandRanking = [...brandTop, { rank: 6, brand: "EmmaTools", sov: "4.7%", visibility: "15.8%", position: "5.0", citation: "7.4%" }, { rank: 7, brand: "Gyro-n SEO", sov: "3.8%", visibility: "12.5%", position: "5.4", citation: "6.9%" }, { rank: 8, brand: "TACT SEO", sov: "2.9%", visibility: "9.8%", position: "5.8", citation: "5.6%" }, { rank: 9, brand: "Similarweb", sov: "2.1%", visibility: "7.2%", position: "6.1", citation: "4.8%" }, { rank: 10, brand: "Dockpit", sov: "1.4%", visibility: "5.1%", position: "6.6", citation: "3.2%" }];
const rankingDetail = ["Ahrefs / 今回順位 1 / 30日平均順位 1.7 / SOV 34.2% / AI表示率 62.5% / 前回比 +1.2pt", "ミエルカSEO / 今回順位 2 / 30日平均順位 2.3 / SOV 31.6% / AI表示率 54.8% / 前回比 +0.4pt", "Keywordmap / 今回順位 3 / 30日平均順位 3.1 / SOV 18.9% / AI表示率 42.1% / 前回比 -0.6pt", "SEARCH WRITE / 今回順位 4 / 30日平均順位 4.4 / SOV 9.4% / AI表示率 25.6% / 前回比 +0.2pt", "SEMrush / 今回順位 5 / 30日平均順位 4.8 / SOV 5.9% / AI表示率 18.3% / 前回比 -0.3pt", "EmmaTools / 今回順位 6 / 30日平均順位 5.2 / SOV 4.7% / AI表示率 15.8% / 前回比 +0.1pt", "Gyro-n SEO / 今回順位 7 / 30日平均順位 5.7 / SOV 3.8% / AI表示率 12.5% / 前回比 -0.4pt", "TACT SEO / 今回順位 8 / 30日平均順位 6.2 / SOV 2.9% / AI表示率 9.8% / 前回比 +0.5pt", "Similarweb / 今回順位 9 / 30日平均順位 8.8 / SOV 2.1% / AI表示率 7.2% / 前回比 +0.7pt", "Dockpit / 今回順位 10 / 30日平均順位 9.6 / SOV 1.4% / AI表示率 5.1% / 前回比 -0.1pt"];
const personas = [
  { persona: "SEO責任者", visibility: "61.4%", sov: "35.2%", citation: "25.8%", position: "2.4", strong: "SEO分析・改善管理", weak: "外部比較・海外ツール比較", summary: "SEO分析・改善管理で露出が強い" },
  { persona: "コンテンツ担当者", visibility: "58.7%", sov: "32.1%", citation: "23.5%", position: "2.6", strong: "記事改善・順位改善", weak: "生成AI活用", summary: "記事改善・順位改善で上位に出やすい" },
  { persona: "マーケ責任者", visibility: "46.3%", sov: "27.4%", citation: "19.2%", position: "3.1", strong: "投資対効果・運用管理", weak: "競合比較", summary: "投資対効果の説明で競合差が出る" },
  { persona: "経営層", visibility: "38.9%", sov: "21.8%", citation: "15.6%", position: "3.6", strong: "導入判断", weak: "費用対効果", summary: "導入判断・費用対効果で掲載位置が下がる" }
];
const models = [
  { model: "ChatGPT", visibility: "58.0%", sov: "33.4%", citation: "24.1%", position: "2.5", sentiment: "74", recommendation: "49.2%", strong: "SEO分析", weak: "被リンク分析" },
  { model: "Gemini", visibility: "51.5%", sov: "29.7%", citation: "20.6%", position: "2.9", sentiment: "69", recommendation: "42.8%", strong: "コンテンツ改善", weak: "競合比較" },
  { model: "Perplexity", visibility: "62.2%", sov: "35.8%", citation: "28.5%", position: "2.3", sentiment: "76", recommendation: "52.1%", strong: "参照元引用", weak: "費用対効果" },
  { model: "Claude", visibility: "47.6%", sov: "27.5%", citation: "16.4%", position: "3.1", sentiment: "68", recommendation: "38.4%", strong: "社内運用", weak: "海外ツール比較" }
];
const sentiment = [{ label: "良い", value: 41, tone: "green" as Tone }, { label: "中立", value: 48, tone: "blue" as Tone }, { label: "注意", value: 11, tone: "amber" as Tone }];
const sources = [
  { rank: 1, domain: "ahrefs.com", owner: "競合", count: 34, share: "16.7%", topic: "被リンク分析・海外SEOツール比較" },
  { rank: 2, domain: "mieru-ca.com", owner: "自社", count: 29, share: "14.2%", topic: "コンテンツ改善・SEO分析", own: true },
  { rank: 3, domain: "semrush.com", owner: "競合", count: 24, share: "11.8%", topic: "競合調査・海外SEOツール比較" },
  { rank: 4, domain: "keywordmap.jp", owner: "競合", count: 19, share: "9.3%", topic: "キーワード調査・SEO戦略" },
  { rank: 5, domain: "ferret-plus.com", owner: "第三者", count: 16, share: "7.8%", topic: "SEOツール比較" },
  { rank: 6, domain: "webtan.impress.co.jp", owner: "第三者", count: 14, share: "6.9%", topic: "デジタルマーケティング" },
  { rank: 7, domain: "searchwrite.jp", owner: "競合", count: 12, share: "5.9%", topic: "記事改善" },
  { rank: 8, domain: "seolaboratory.jp", owner: "第三者", count: 10, share: "4.9%", topic: "SEO基礎" },
  { rank: 9, domain: "similarweb.com", owner: "競合", count: 8, share: "3.9%", topic: "競合分析" },
  { rank: 10, domain: "liskul.com", owner: "第三者", count: 7, share: "3.4%", topic: "ツール比較" }
];
const insights = ["最大競合との差はSOVで -2.6pt。比較・選定系の質問で差が出ている", "自社ドメイン引用率は22.4%。第三者ドメイン経由の引用が多い", "コンテンツ改善系では強いが、海外SEOツール比較では掲載位置が下がる"];
const sovBars: Bar[] = [{ label: "Ahrefs", value: 34.2, suffix: "%", meta: "最大競合", tone: "amber" }, { label: "ミエルカSEO", value: 31.6, suffix: "%", meta: "自社", tone: "green" }, { label: "Keywordmap", value: 18.9, suffix: "%", tone: "blue" }, { label: "SEARCH WRITE", value: 9.4, suffix: "%", tone: "violet" }, { label: "SEMrush", value: 5.9, suffix: "%", tone: "slate" }];
const headToHead = ["SOV: ミエルカSEO 31.6% / Ahrefs 34.2% / 差分 -2.6pt", "AI表示率: ミエルカSEO 54.8% / Ahrefs 62.5% / 差分 -7.7pt", "平均掲載位置: ミエルカSEO 2.7位 / Ahrefs 2.1位", "引用シェア: ミエルカSEO 22.4% / Ahrefs 30.8%", "30日平均順位: ミエルカSEO 2.3位 / Ahrefs 1.7位", "前回比: ミエルカSEO +0.4pt / Ahrefs +1.2pt", "競合が強いカテゴリ: 海外SEOツール比較、被リンク分析、キーワード調査", "競合が強い質問: SEOツールを比較するとき何を見るべき？ / Ahrefsと国産SEOツールの違いは？ / 被リンク分析に強いSEOツールは？", "競合が引用されるURL: ahrefs.com/blog / ahrefs.com/keywords-explorer / ahrefs.com/site-explorer"];
const changes = [{ title: "新規出現", items: ["Similarweb / SOV 2.1% / 主な出現文脈 競合分析", "TACT SEO / SOV 2.9% / 主な出現文脈 コンテンツSEO"] }, { title: "露出増", items: ["Ahrefs / +1.2pt / 海外SEOツール比較", "SEARCH WRITE / +0.8pt / 記事制作・改善", "TACT SEO / +0.5pt / SEO施策管理"] }, { title: "露出減", items: ["Keywordmap / -0.6pt / キーワード調査", "SEMrush / -0.3pt / 競合調査"] }];
const competitiveInsights = ["Ahrefs: 海外SEOツール比較、被リンク分析、キーワード調査で先行", "Keywordmap: キーワード戦略、競合調査の文脈で出やすい", "SEARCH WRITE: コンテンツ制作・記事改善の文脈で比較対象に出る", "自社: コンテンツ改善、国産SEOツール、社内運用の文脈で強い", "自社: 海外ツール比較、被リンク分析、費用対効果説明の文脈で掲載位置が下がる"];
const heatTopics = ["SEO分析", "コンテンツ改善", "競合比較", "費用対効果", "社内運用", "生成AI活用", "被リンク分析", "導入判断"];
const heatRows = [
  { persona: "SEO責任者", scores: [82, 76, 58, 54, 71, 49, 38, 64] },
  { persona: "コンテンツ担当者", scores: [68, 84, 52, 48, 66, 44, 35, 59] },
  { persona: "マーケ責任者", scores: [61, 64, 46, 43, 70, 51, 31, 57] },
  { persona: "経営層", scores: [48, 52, 40, 39, 55, 42, 28, 62] }
];
const useCases = [
  { useCase: "情報収集", visibility: "63.5%", sov: "36.1%", position: "2.3", question: "SEOツールでできることは？" },
  { useCase: "比較検討", visibility: "44.8%", sov: "25.5%", position: "3.4", question: "SEOツールを比較するとき何を見るべき？" },
  { useCase: "導入判断", visibility: "41.2%", sov: "23.8%", position: "3.5", question: "BtoB向けのSEO分析ツールでおすすめは？" },
  { useCase: "社内承認", visibility: "36.7%", sov: "20.9%", position: "3.8", question: "SEOツールの費用対効果を説明するには？" },
  { useCase: "運用改善", visibility: "68.8%", sov: "39.4%", position: "2.0", question: "SEOの社内運用を効率化する方法は？" }
];
const funnels = [{ stage: "認知", visibility: "64.2%", sov: "37.0%", citation: "24.2%" }, { stage: "情報収集", visibility: "59.8%", sov: "33.5%", citation: "23.4%" }, { stage: "比較検討", visibility: "44.8%", sov: "25.5%", citation: "18.6%" }, { stage: "導入判断", visibility: "41.2%", sov: "23.8%", citation: "17.4%" }, { stage: "社内承認", visibility: "36.7%", sov: "20.9%", citation: "14.8%" }];
const topicCoverage: Bar[] = [{ label: "SEO分析", value: 82, suffix: "%", tone: "green" }, { label: "コンテンツ改善", value: 86, suffix: "%", tone: "green" }, { label: "社内運用", value: 74, suffix: "%", tone: "blue" }, { label: "導入判断", value: 68, suffix: "%", tone: "blue" }, { label: "競合比較", value: 52, suffix: "%", tone: "amber" }, { label: "費用対効果", value: 48, suffix: "%", tone: "amber" }, { label: "生成AI活用", value: 44, suffix: "%", tone: "violet" }, { label: "被リンク分析", value: 36, suffix: "%", tone: "red" }];
const topicGaps = [{ topic: "海外SEOツール比較", priority: "高", own: 40, competitor: 78, gap: -38 }, { topic: "被リンク分析", priority: "中", own: 36, competitor: 82, gap: -46 }, { topic: "費用対効果", priority: "高", own: 48, competitor: 63, gap: -15 }, { topic: "生成AI活用", priority: "中", own: 44, competitor: 59, gap: -15 }];
const topicVisibility = [{ topic: "SEO分析", visibility: "66.2%", sov: "38.5%", competitor: "Ahrefs 36.4%" }, { topic: "コンテンツ改善", visibility: "72.4%", sov: "42.3%", competitor: "SEARCH WRITE 28.5%" }, { topic: "競合比較", visibility: "39.6%", sov: "21.8%", competitor: "Ahrefs 44.2%" }, { topic: "費用対効果", visibility: "35.8%", sov: "20.1%", competitor: "Keywordmap 29.4%" }, { topic: "社内運用", visibility: "68.8%", sov: "39.4%", competitor: "Keywordmap 24.0%" }, { topic: "被リンク分析", visibility: "24.1%", sov: "12.6%", competitor: "Ahrefs 61.8%" }];
const topicTrends = ["SEO分析: 76, 77, 78, 80, 81, 82, 82", "コンテンツ改善: 80, 81, 83, 84, 84, 85, 86", "競合比較: 48, 49, 50, 51, 51, 52, 52", "費用対効果: 45, 46, 47, 47, 48, 48, 48"];
const prompts = [
  { question: "SEOツールを比較するとき何を見るべき？", type: "comparison", useCase: "比較検討", status: "自社は出るが弱い", visibility: "50.0%", sov: "24.8%", rank: "3.1", citation: "18.6%", competitor: "Ahrefs", gap: "-8.4pt", action: "比較軸を明確にした選定ガイドを強化" },
  { question: "BtoB向けのSEO分析ツールでおすすめは？", type: "non-branded", useCase: "導入判断", status: "競合先行", visibility: "37.5%", sov: "18.6%", rank: "4.2", citation: "14.3%", competitor: "Ahrefs", gap: "-14.2pt", action: "BtoB導入判断向けページを強化" },
  { question: "コンテンツ改善に強いSEOツールは？", type: "non-branded", useCase: "情報収集", status: "強い", visibility: "75.0%", sov: "42.3%", rank: "1.8", citation: "28.4%", competitor: "SEARCH WRITE", gap: "+6.1pt", action: "強みを維持" },
  { question: "SEOの社内運用を効率化する方法は？", type: "non-branded", useCase: "運用改善", status: "強い", visibility: "68.8%", sov: "39.4%", rank: "2.0", citation: "26.1%", competitor: "Keywordmap", gap: "+4.5pt", action: "運用テンプレートの訴求を追加" },
  { question: "Ahrefsと国産SEOツールの違いは？", type: "competitor-named", useCase: "比較検討", status: "競合優位", visibility: "25.0%", sov: "12.2%", rank: "5.3", citation: "8.7%", competitor: "Ahrefs", gap: "-21.6pt", action: "海外ツール比較コンテンツを強化" },
  { question: "SEOツールの費用対効果をどう説明する？", type: "non-branded", useCase: "社内承認", status: "自社は出るが弱い", visibility: "34.4%", sov: "19.3%", rank: "4.6", citation: "12.1%", competitor: "Keywordmap", gap: "-11.5pt", action: "費用対効果と導入成果の説明を強化" },
  { question: "SEO記事のリライトに使えるツールは？", type: "non-branded", useCase: "情報収集", status: "強い", visibility: "71.9%", sov: "40.8%", rank: "1.9", citation: "25.9%", competitor: "SEARCH WRITE", gap: "+5.4pt", action: "記事改善事例を追加" },
  { question: "被リンク分析に強いSEOツールは？", type: "non-branded", useCase: "比較検討", status: "競合は出るが自社が出ない", visibility: "12.5%", sov: "6.4%", rank: "6.8", citation: "4.2%", competitor: "Ahrefs", gap: "-32.5pt", action: "被リンク分析の扱いを明確化" }
];
const promptFilters = { types: ["non-branded", "branded", "comparison", "competitor-named", "citation_check"], useCases: ["情報収集", "比較検討", "導入判断", "社内承認", "運用改善"], statuses: ["強い", "自社は出るが弱い", "競合先行", "競合優位", "競合は出るが自社が出ない"] };
const missingQuestions = [{ question: "被リンク分析に強いSEOツールは？", competitor: "Ahrefs", competitorSov: "38.9%", ownSov: "6.4%" }, { question: "海外SEOツールでおすすめは？", competitor: "Ahrefs", competitorSov: "41.2%", ownSov: "5.8%" }, { question: "SEO競合分析に強いツールは？", competitor: "SEMrush", competitorSov: "29.8%", ownSov: "11.2%" }];
const weakQuestions = [{ question: "SEOツールを比較するとき何を見るべき？", rank: "3.1", gap: "-8.4pt" }, { question: "SEOツールの費用対効果をどう説明する？", rank: "4.6", gap: "-11.5pt" }, { question: "BtoB向けのSEO分析ツールでおすすめは？", rank: "4.2", gap: "-14.2pt" }];
const highIntent = [{ question: "BtoB向けのSEO分析ツールでおすすめは？", score: 92, status: "競合先行" }, { question: "SEOツールの費用対効果をどう説明する？", score: 89, status: "自社は出るが弱い" }, { question: "SEOツールを比較するとき何を見るべき？", score: 86, status: "自社は出るが弱い" }, { question: "Ahrefsと国産SEOツールの違いは？", score: 84, status: "競合優位" }];
const promptGaps = [{ area: "海外SEOツール比較", count: 8, avg: "10.4%", competitor: "Ahrefs", gap: "-24.8pt" }, { area: "被リンク分析", count: 5, avg: "8.2%", competitor: "Ahrefs", gap: "-31.6pt" }, { area: "費用対効果", count: 6, avg: "19.3%", competitor: "Keywordmap", gap: "-11.5pt" }];
const promptHistory = [{ date: "2026-06-25", model: "ChatGPT", listed: "あり", rank: "3", sov: "23.1%" }, { date: "2026-06-26", model: "Gemini", listed: "あり", rank: "4", sov: "20.8%" }, { date: "2026-06-27", model: "Perplexity", listed: "あり", rank: "2", sov: "28.4%" }, { date: "2026-06-28", model: "Claude", listed: "なし", rank: "-", sov: "0%" }, { date: "2026-06-29", model: "ChatGPT", listed: "あり", rank: "3", sov: "24.5%" }, { date: "2026-06-30", model: "Perplexity", listed: "あり", rank: "2", sov: "29.1%" }, { date: "2026-07-01", model: "Gemini", listed: "あり", rank: "3", sov: "25.7%" }];
const positions = [{ question: "コンテンツ改善に強いSEOツールは？", own: "1.8", competitor: "SEARCH WRITE 2.6", gap: "+0.8" }, { question: "SEOの社内運用を効率化する方法は？", own: "2.0", competitor: "Keywordmap 2.8", gap: "+0.8" }, { question: "SEOツールで見るべき指標は？", own: "2.4", competitor: "Ahrefs 2.2", gap: "-0.2" }, { question: "SEOツールを比較するとき何を見るべき？", own: "3.1", competitor: "Ahrefs 2.1", gap: "-1.0" }, { question: "BtoB向けのSEO分析ツールでおすすめは？", own: "4.2", competitor: "Ahrefs 2.3", gap: "-1.9" }, { question: "Ahrefsと国産SEOツールの違いは？", own: "5.3", competitor: "Ahrefs 1.4", gap: "-3.9" }, { question: "被リンク分析に強いSEOツールは？", own: "6.8", competitor: "Ahrefs 1.3", gap: "-5.5" }];
const positionSegments = [{ label: "1位掲載", value: 18.6, tone: "green" as Tone }, { label: "2位掲載", value: 24.7, tone: "blue" as Tone }, { label: "3位掲載", value: 20.8, tone: "violet" as Tone }, { label: "4位以下", value: 35.9, tone: "amber" as Tone }];
const recRanking = [{ brand: "ミエルカSEO", order: "2.4位", rate: "46.9%", own: true }, { brand: "Ahrefs", order: "1.8位", rate: "58.2%" }, { brand: "Keywordmap", order: "3.0位", rate: "35.4%" }, { brand: "SEARCH WRITE", order: "3.8位", rate: "21.7%" }, { brand: "SEMrush", order: "4.1位", rate: "18.8%" }];
const weakDescriptions = [{ type: "抽象的", text: "「SEO運用を支援する国産ツール」と抽象的に説明されることが多い", impact: "比較検討・導入判断", action: "機能差、導入効果、運用支援の説明を具体化する" }, { type: "比較で弱い", text: "海外SEOツールとの違いが十分に説明されていない", impact: "競合比較", action: "海外ツールとの比較軸を明確にする" }, { type: "料金文脈", text: "費用対効果の説明が競合より少ない", impact: "社内承認", action: "導入成果、削減工数、運用負荷の説明を追加する" }, { type: "導入判断", text: "社内承認に必要な根拠が薄く見える", impact: "導入判断", action: "導入事例、比較表、FAQを強化する" }];
const answers = [{ question: "SEOツールを比較するとき何を見るべき？", model: "ChatGPT", listed: "あり", first: "3", order: "3", sentiment: "中立", summary: "比較軸の一つとして紹介されるが、海外ツールが先に説明される" }, { question: "コンテンツ改善に強いSEOツールは？", model: "Perplexity", listed: "あり", first: "1", order: "1", sentiment: "良い", summary: "記事改善とSEO運用の支援ツールとして上位に紹介される" }, { question: "被リンク分析に強いSEOツールは？", model: "Gemini", listed: "なし", first: "-", order: "-", sentiment: "中立", summary: "AhrefsとSEMrushが中心に紹介される" }];
const ownerShare = [{ label: "自社", value: 22.4, tone: "green" as Tone }, { label: "競合", value: 28.7, tone: "amber" as Tone }, { label: "第三者", value: 43.1, tone: "blue" as Tone }, { label: "不明", value: 5.8, tone: "slate" as Tone }];
const competitorUrls = [{ url: "ahrefs.com/blog/seo-tools", competitor: "Ahrefs", count: 12, question: "SEOツールを比較するとき何を見るべき？" }, { url: "ahrefs.com/site-explorer", competitor: "Ahrefs", count: 9, question: "被リンク分析に強いSEOツールは？" }, { url: "semrush.com/features/competitive-research", competitor: "SEMrush", count: 8, question: "SEO競合分析に強いツールは？" }, { url: "keywordmap.jp/service", competitor: "Keywordmap", count: 7, question: "キーワード調査に強いSEOツールは？" }, { url: "searchwrite.jp/contents", competitor: "SEARCH WRITE", count: 6, question: "SEO記事のリライトに使えるツールは？" }];
const sourceChanges = [{ title: "新規出現", items: ["similarweb.com / 引用数 8 / 主な文脈 競合分析", "tact-seo.com / 引用数 5 / 主な文脈 SEO施策管理", "liskul.com / 引用数 7 / 主な文脈 ツール比較"] }, { title: "継続", items: ["mieru-ca.com / 引用数 29 / 主な文脈 コンテンツ改善", "ahrefs.com / 引用数 34 / 主な文脈 被リンク分析", "keywordmap.jp / 引用数 19 / 主な文脈 キーワード調査"] }, { title: "消失", items: ["old-seo-blog.example.com / 前回引用数 4 / 主な文脈 SEO基礎", "legacy-marketing.example.jp / 前回引用数 3 / 主な文脈 ツール比較"] }];
const ownerTrend = ["2026-06-25 / 自社 20.8% / 競合 30.1% / 第三者 43.0% / 不明 6.1%", "2026-06-26 / 自社 21.1% / 競合 29.9% / 第三者 43.2% / 不明 5.8%", "2026-06-27 / 自社 21.5% / 競合 29.4% / 第三者 43.3% / 不明 5.8%", "2026-06-28 / 自社 21.9% / 競合 29.0% / 第三者 43.1% / 不明 6.0%", "2026-06-29 / 自社 22.0% / 競合 28.9% / 第三者 43.1% / 不明 6.0%", "2026-06-30 / 自社 22.2% / 競合 28.8% / 第三者 43.1% / 不明 5.9%", "2026-07-01 / 自社 22.4% / 競合 28.7% / 第三者 43.1% / 不明 5.8%"];
const missingPages = [{ page: "海外SEOツール比較ページ", url: "ahrefs.com/blog/seo-tools", questions: 6, priority: "高" }, { page: "被リンク分析の機能解説ページ", url: "ahrefs.com/site-explorer", questions: 5, priority: "中" }, { page: "SEOツール費用対効果ページ", url: "keywordmap.jp/service", questions: 4, priority: "高" }, { page: "競合分析テンプレートページ", url: "semrush.com/features/competitive-research", questions: 4, priority: "中" }];
const recs = [{ title: "競合比較ページの強化", priority: "高", impact: "+8.5pt", target: "T02/T04", status: "未着手", effort: "M", owner: "コンテンツ" }, { title: "SEOツール選定ガイドの作成", priority: "高", impact: "+7.2pt", target: "T04/T07", status: "未着手", effort: "M", owner: "コンテンツ" }, { title: "導入判断向けFAQの追加", priority: "中", impact: "+4.8pt", target: "T03/T04", status: "確認中", effort: "S", owner: "マーケ" }, { title: "第三者引用を獲得しやすい調査コンテンツ", priority: "中", impact: "+4.1pt", target: "T06/T07", status: "未着手", effort: "L", owner: "マーケ" }, { title: "既存記事のAI引用向け見出し改善", priority: "中", impact: "+3.6pt", target: "T06/T07", status: "確認中", effort: "S", owner: "SEO" }];
const actions = ["海外SEOツール比較のページを作成し、Ahrefsとの違いを整理する", "被リンク分析の扱いを機能説明ページに明記する", "BtoB導入判断向けの比較軸をFAQに追加する", "費用対効果を説明するための数値・事例を追加する", "AIに引用されやすい要約ブロックを既存記事に追加する"];
const contentGaps = [{ area: "海外SEOツール比較", questions: 8, competitor: "Ahrefs", priority: "高" }, { area: "被リンク分析", questions: 5, competitor: "Ahrefs", priority: "中" }, { area: "費用対効果", questions: 6, competitor: "Keywordmap", priority: "高" }, { area: "社内承認", questions: 4, competitor: "Keywordmap", priority: "中" }, { area: "生成AI活用", questions: 4, competitor: "SEARCH WRITE", priority: "中" }];
const contentRecs = ["SEOツール比較完全ガイド", "Ahrefsと国産SEOツールの違い", "SEOツール導入の費用対効果", "BtoB企業向けSEO運用テンプレート", "AI時代のコンテンツ改善チェックリスト"];
const pageTypes = [{ type: "比較ページ", count: 4, impact: "高" }, { type: "FAQページ", count: 5, impact: "中" }, { type: "導入事例ページ", count: 3, impact: "中" }, { type: "調査コンテンツ", count: 2, impact: "中" }, { type: "既存記事", count: 8, impact: "中" }];
const existingPages = [{ url: "mieru-ca.com/blog/seo-tool", action: "比較軸を追加", impact: "+3.1pt" }, { url: "mieru-ca.com/blog/content-seo", action: "AI引用向け要約を追加", impact: "+2.4pt" }, { url: "mieru-ca.com/service", action: "導入判断FAQを追加", impact: "+4.8pt" }, { url: "mieru-ca.com/case", action: "費用対効果の説明を追加", impact: "+3.7pt" }];
const newPages = [{ path: "/comparison/ahrefs", theme: "Ahrefsと国産SEOツールの違い", priority: "高" }, { path: "/guide/seo-tool-selection", theme: "SEOツール選定ガイド", priority: "高" }, { path: "/guide/seo-roi", theme: "SEOツールの費用対効果", priority: "高" }, { path: "/guide/internal-approval", theme: "SEOツール導入の社内承認ガイド", priority: "中" }, { path: "/research/seo-tool-survey", theme: "SEO運用に関する独自調査", priority: "中" }];

export function CustomerReportProductionDesignPage({ projectSlug, design }: { projectSlug: string; design: CustomerReportDesignVariant }) {
  const [activeTab, setActiveTab] = useState<TabId>("t01");
  const [activeUseCase, setActiveUseCase] = useState("すべて");
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const variant = variants[design];
  const VariantIcon = variant.icon;
  const filteredPrompts = useMemo(() => activeUseCase === "すべて" ? prompts : prompts.filter((item) => item.useCase === activeUseCase), [activeUseCase]);
  return (
    <main className={`${styles.page} ${styles[design]}`} data-design={design}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrowRow}><span className={styles.reportBadge}>顧客レポート</span><span>{meta.period}</span><span>最終更新 {meta.updatedAt}</span></div>
          <h1>{meta.projectName} AI可視性レポート</h1>
          <p>{variant.desc}</p>
          <div className={styles.metaGrid}><MetaPill label="対象ドメイン" value={meta.targetDomain} /><MetaPill label="対象ブランド" value={meta.targetBrand} /><MetaPill label="測定AIモデル" value={meta.models.join(" / ")} /></div>
        </div>
        <div className={styles.heroScoreCard}>
          <div className={styles.variantMark}><VariantIcon aria-hidden="true" size={20} /><div><span>{variant.label}</span><strong>{variant.title}</strong></div></div>
          <ScoreRing value={68} label="総合AI可視性スコア" />
          <p className={styles.scoreFormula}>40% AI表示率 + 30% SOV + 20% 掲載位置スコア + 10% 自社ドメイン引用率</p>
        </div>
      </header>
      <section className={styles.controlBand} aria-label="表示切り替えとレポート範囲">
        <div className={styles.designSwitch}>{(Object.keys(variants) as CustomerReportDesignVariant[]).map((key) => <a key={key} className={key === design ? styles.activeDesign : undefined} href={`/dashboard/reports/${projectSlug}?design=${key}`} aria-current={key === design ? "page" : undefined}>{variants[key].label}</a>)}</div>
        <div className={styles.competitorTicker} aria-label="主要競合">{meta.competitors.map((competitor) => <span key={competitor}>{competitor}</span>)}</div>
      </section>
      <section className={styles.tabShell} aria-label="7タブレポート">
        <nav className={styles.tabs} aria-label="レポートタブ">{tabs.map((tab) => { const Icon = tab.icon; const on = tab.id === activeTab; return <button key={tab.id} type="button" className={on ? styles.activeTab : undefined} onClick={() => setActiveTab(tab.id)} aria-pressed={on}><span className={styles.tabCode}>{tab.code}</span><Icon aria-hidden="true" size={17} /><span className={styles.tabLabel}>{tab.label}</span><small>{tab.summary}</small></button>; })}</nav>
        <div className={styles.workspace}>
          <aside className={styles.contextRail}><div className={styles.contextCard}><span className={styles.railLabel}>{variant.stance}</span><h2>{active.code} {active.label}</h2><p>{active.summary}を、{variant.label}向けの情報密度で確認します。</p></div><div className={styles.contextCard}><span className={styles.railLabel}>主要KPI</span><CompactMetric label="総合スコア" value="68" /><CompactMetric label="AI表示率" value="54.8%" /><CompactMetric label="SOV" value="31.6%" /><CompactMetric label="引用率" value="22.4%" /></div><div className={styles.contextCard}><span className={styles.railLabel}>確認モデル</span><div className={styles.modelList}>{meta.models.map((model) => <span key={model}>{model}</span>)}</div></div></aside>
          <div className={styles.mainPanel}>{renderTab(activeTab, design, filteredPrompts, activeUseCase, setActiveUseCase)}</div>
        </div>
      </section>
    </main>
  );
}

function renderTab(activeTab: TabId, design: CustomerReportDesignVariant, filteredPrompts: typeof prompts, activeUseCase: string, setActiveUseCase: (value: string) => void) {
  if (activeTab === "t01") return <OverviewTab design={design} />;
  if (activeTab === "t02") return <BrandTab />;
  if (activeTab === "t03") return <PersonaTab />;
  if (activeTab === "t04") return <PromptTab rows={filteredPrompts} activeUseCase={activeUseCase} setActiveUseCase={setActiveUseCase} />;
  if (activeTab === "t05") return <AnswerTab />;
  if (activeTab === "t06") return <SourceTab />;
  return <ActionTab design={design} />;
}
function OverviewTab({ design }: { design: CustomerReportDesignVariant }) {
  return <div className={styles.tabContent}><HeroInsightStrip design={design} /><div className={styles.kpiGrid}>{kpis.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><div className={styles.contentGrid}><Section title="直近7日の総合AI可視性スコア推移" description="KPIカード内ではなく、独立した折れ線グラフとして確認します。" icon={LineChart} wide><LineTrend data={scoreTrend} /></Section><Section title="ブランドランキング TOP5" icon={Trophy}><Table columns={brandCols} rows={brandTop.map(brandRow)} compact /></Section><Section title="ペルソナ別サマリー" icon={Users}><Table columns={personaSummaryCols} rows={personas.map((x) => row(x.persona, { persona: x.persona, visibility: x.visibility, sov: x.sov, position: x.position, summary: x.summary }))} compact /></Section><Section title="AIモデル別評価グラフ" icon={Brain}><ModelComparison /></Section><Section title="感情内訳" icon={Activity}><SegmentedBar segments={sentiment} /></Section><Section title="参照元ドメインランキング TOP5" icon={Database}><Table columns={sourceCols(false)} rows={sources.slice(0, 5).map(sourceRow)} compact /></Section><Section title="重要インサイト・結論 TOP3" icon={Compass} wide><InsightList items={insights} /></Section></div></div>;
}

function BrandTab() {
  return <div className={styles.tabContent}><div className={styles.contentGrid}><Section title="競合SOV比較" description="自社と競合のブランド露出シェアを横棒で比較します。" icon={GitCompare}><HorizontalBars data={sovBars} max={40} /></Section><Section title="ブランドランキング" description="自社行をハイライトし、SOVとAI表示率を並べます。" icon={Trophy} wide><Table columns={brandCols} rows={brandRanking.map(brandRow)} /></Section><Section title="Head-to-head比較" description="初期選択: ミエルカSEO vs Ahrefs" icon={GitCompare}><InsightList items={headToHead} /></Section><Section title="新規競合・競合変化" icon={Activity}><ChangeColumns groups={changes} /></Section><Section title="競合優位・自社弱点" icon={Target} wide><InsightList items={competitiveInsights} /></Section><Section title="詳細ビュー" description="全ブランドランキング、今回順位、30日平均順位、前回比、AI表示率ランキング、競合可視性比較、新規競合・競合変化の詳細を確認します。" icon={Layers3} wide><InsightList items={rankingDetail} /></Section></div></div>;
}

function PersonaTab() {
  return <div className={styles.tabContent}><div className={styles.contentGrid}><Section title="ペルソナ x トピックヒートマップ" description="検討者別に強い領域と弱い領域を一目で確認します。" icon={Users} wide><Heatmap /></Section><Section title="ペルソナ別強弱" icon={Users} wide><Table columns={personaCols} rows={personas.map((x) => row(x.persona, { persona: x.persona, visibility: x.visibility, sov: x.sov, citation: x.citation, position: x.position, strong: x.strong, weak: x.weak }))} /></Section><Section title="用途別強弱" icon={Compass}><Table columns={useCaseCols} rows={useCases.map((x) => row(x.useCase, { useCase: x.useCase, visibility: x.visibility, sov: x.sov, position: x.position, question: x.question }))} compact /></Section><Section title="検討フェーズ別強弱" icon={Filter}><Table columns={funnelCols} rows={funnels.map((x) => row(x.stage, { stage: x.stage, visibility: x.visibility, sov: x.sov, citation: x.citation }))} compact /></Section><Section title="トピックカバレッジ" icon={BarChart3}><HorizontalBars data={topicCoverage} max={100} /></Section><Section title="トピックギャップ" icon={Target}><Table columns={topicGapCols} rows={topicGaps.map((x) => row(x.topic, { topic: x.topic, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge>, own: x.own, competitor: x.competitor, gap: x.gap }))} compact /></Section><Section title="トピック別可視性" icon={Activity} wide><Table columns={topicVisCols} rows={topicVisibility.map((x) => row(x.topic, { topic: x.topic, visibility: x.visibility, sov: x.sov, competitor: x.competitor }))} compact /></Section><Section title="モデル・LLM別強弱" icon={Brain}><Table columns={modelStrengthCols} rows={models.map((x) => row(x.model, { model: x.model, strong: x.strong, weak: x.weak, visibility: x.visibility, sov: x.sov }))} compact /></Section><Section title="詳細ビュー" description="ヒートマップセル詳細、ペルソナ詳細、用途別詳細、ファネル別詳細、トピック詳細、トピック推移を確認します。" icon={Layers3} wide><DetailList items={["セル: SEO責任者 x SEO分析", "スコア: 82", "関連質問: SEOツールで見るべき指標は？ / SEO改善の優先順位はどう決める？ / BtoBサイトのSEO分析で必要な機能は？", "関連参照元: mieru-ca.com/blog/seo-analysis / ferret-plus.com/seo-tools / ahrefs.com/blog/seo-metrics", "改善候補: SEO分析の判断軸を比較表として整理 / 導入後の運用フローを追記 / 競合比較文脈で引用されやすいFAQを追加", ...topicTrends]} /></Section></div></div>;
}

function PromptTab({ rows, activeUseCase, setActiveUseCase }: { rows: typeof prompts; activeUseCase: string; setActiveUseCase: (value: string) => void }) {
  const options = ["すべて", ...promptFilters.useCases];
  return <div className={styles.tabContent}><div className={styles.filterBar}><span><Filter aria-hidden="true" size={16} />質問フィルタ</span>{options.map((option) => <button key={option} type="button" className={option === activeUseCase ? styles.activeFilter : undefined} onClick={() => setActiveUseCase(option)}>{option}</button>)}</div><div className={styles.contentGrid}><Section title="質問別統計テーブル" description="AI表示率、SOV、順位、引用率、競合差分、改善候補を質問ごとに確認します。" icon={Search} wide><Table columns={promptCols} rows={rows.map(promptRow)} /></Section><Section title="質問フィルタ候補" icon={Filter}><FilterGroups /></Section><Section title="競合は出るが自社が出ない質問" icon={Target}><Table columns={missingQuestionCols} rows={missingQuestions.map((x) => row(x.question, { question: x.question, competitor: x.competitor, competitorSov: x.competitorSov, ownSov: x.ownSov }))} compact /></Section><Section title="自社は出るが弱い質問" icon={Activity}><Table columns={weakQuestionCols} rows={weakQuestions.map((x) => row(x.question, { question: x.question, rank: x.rank, gap: x.gap }))} compact /></Section><Section title="高意図質問" icon={ArrowUpRight}><Table columns={highIntentCols} rows={highIntent.map((x) => row(x.question, { question: x.question, score: x.score, status: <Badge tone={x.status === "競合先行" ? "amber" : "blue"}>{x.status}</Badge> }))} compact /></Section><Section title="購買・比較質問" icon={GitCompare}><InsightList items={["SEOツールを比較するとき何を見るべき？", "BtoB向けのSEO分析ツールでおすすめは？", "Ahrefsと国産SEOツールの違いは？", "SEOツールの費用対効果をどう説明する？", "SEOツール導入時に社内承認を取るには？"]} /></Section><Section title="プロンプトギャップ" icon={Target}><Table columns={promptGapCols} rows={promptGaps.map((x) => row(x.area, { area: x.area, count: x.count, avg: x.avg, competitor: x.competitor, gap: x.gap }))} compact /></Section><Section title="プロンプトライブラリ" icon={Layers3}><StatTiles stats={["総質問数 48", "non-branded 30", "branded 6", "comparison 6", "competitor-named 4", "citation_check 2"]} /></Section><Section title="詳細ビュー" description="質問行詳細、プロンプト別引用、プロンプト別感情、実行履歴、関連トピックを確認します。" icon={Layers3} wide><DetailList items={["質問: SEOツールを比較するとき何を見るべき？", "AI表示率: 50.0%", "SOV: 24.8%", "自社順位: 3.1", "引用率: 18.6%", "最大競合: Ahrefs", "競合差分: -8.4pt", "関連トピック: 競合比較、導入判断、費用対効果", "関連参照元: ahrefs.com/blog / mieru-ca.com/blog/seo-tool / ferret-plus.com/seo-tools", "改善候補: 比較軸を整理した選定ガイドを強化 / 国産ツールの導入メリットをFAQに追加 / 費用対効果・運用負荷・社内承認の説明を追加"]} /><Table columns={promptHistoryCols} rows={promptHistory.map((x) => row(`${x.date}-${x.model}`, { date: x.date, model: x.model, listed: x.listed, rank: x.rank, sov: x.sov }))} compact /></Section></div></div>;
}

function AnswerTab() {
  return <div className={styles.tabContent}><div className={styles.contentGrid}><Section title="平均掲載位置" icon={Gauge}><MetricCard metric={{ label: "平均掲載位置", value: "2.7位", delta: "上位3位掲載率 64.1%", helper: "1位掲載 18.6% / 2位掲載 24.7% / 3位掲載 20.8% / 4位以下 35.9%", tone: "amber" }} /><SegmentedBar segments={positionSegments} /></Section><Section title="掲載位置ランキング TOP20" icon={Trophy} wide><Table columns={positionCols} rows={positions.map((x) => row(x.question, { question: x.question, own: x.own, competitor: x.competitor, gap: x.gap }))} /></Section><Section title="推薦率" icon={ArrowUpRight}><MetricCard metric={{ label: "推薦率", value: "46.9%", delta: "+2.7pt", helper: "自社が候補・推奨・比較対象として扱われた割合", tone: "green" }} /></Section><Section title="推薦順・推薦ランキング" icon={ListChecks}><Table columns={recRankingCols} rows={recRanking.map((x) => row(x.brand, { brand: x.brand, order: x.order, rate: x.rate }, Boolean(x.own)))} compact /></Section><Section title="競合先行推薦" icon={GitCompare}><StatTiles stats={["競合先行回答数 18件", "主な競合 Ahrefs 11件", "主な競合 Keywordmap 4件", "主な競合 SEMrush 3件"]} /><InsightList items={["SEOツールを比較するとき何を見るべき？", "BtoB向けのSEO分析ツールでおすすめは？", "Ahrefsと国産SEOツールの違いは？", "被リンク分析に強いSEOツールは？"]} /></Section><Section title="感情スコア" icon={Activity}><MetricCard metric={{ label: "感情スコア", value: "72", delta: "+4", helper: "AI回答内で自社ブランドがどの印象で語られるかを数値化", tone: "blue" }} /><SegmentedBar segments={sentiment} /><MetricCard metric={{ label: "ネット感情スコア", value: "+30", helper: "良い表現と注意表現の差分", tone: "green" }} /></Section><Section title="感情推移" icon={LineChart}><DetailList items={["2026-06-25 / 良い 37% / 中立 51% / 注意 12%", "2026-06-26 / 良い 38% / 中立 50% / 注意 12%", "2026-06-27 / 良い 39% / 中立 49% / 注意 12%", "2026-06-28 / 良い 40% / 中立 49% / 注意 11%", "2026-06-29 / 良い 40% / 中立 48% / 注意 12%", "2026-06-30 / 良い 41% / 中立 48% / 注意 11%", "2026-07-01 / 良い 41% / 中立 48% / 注意 11%"]} /></Section><Section title="モデル別" icon={Brain}><Table columns={modelAnswerCols} rows={models.map((x) => row(x.model, { model: x.model, sov: x.sov, position: x.position, sentiment: x.sentiment, recommendation: x.recommendation }))} compact /></Section><Section title="自社に弱い説明" icon={Target} wide><Table columns={weakDescriptionCols} rows={weakDescriptions.map((x) => row(x.type, { type: x.type, text: x.text, impact: x.impact, action: x.action }))} /></Section><Section title="詳細ビュー" description="AI回答一覧、初出位置・上位掲載、未掲載・欠落、競合先行推薦 詳細、正確性・事実性、注意書き・制約、トピック連想を確認します。" icon={Layers3} wide><Table columns={answerCols} rows={answers.map((x) => row(`${x.model}-${x.question}`, { question: x.question, model: x.model, listed: x.listed, first: x.first, order: x.order, sentiment: x.sentiment, summary: x.summary }))} /></Section></div></div>;
}
function SourceTab() {
  return <div className={styles.tabContent}><div className={styles.contentGrid}><Section title="自社ドメイン引用率 / 所有者タイプ分類" icon={Database}><DonutBreakdown segments={ownerShare} /></Section><Section title="参照元ドメインランキング" icon={Trophy} wide><Table columns={sourceCols(true)} rows={sources.map(sourceRow)} /></Section><Section title="競合だけ引用されるURL" icon={GitCompare} wide><Table columns={competitorUrlCols} rows={competitorUrls.map((x) => row(x.url, { url: x.url, competitor: x.competitor, count: x.count, question: x.question }))} /></Section><Section title="新規出現 / 継続 / 消失" icon={Activity}><ChangeColumns groups={sourceChanges} /></Section><Section title="詳細ビュー" description="参照元ドメインランキング完全版、URL / ドメイン別グルーピング、第三者・その他引用、引用トピック、引用一貫性、引用関係、ソース影響度、所有者別引用・時系列、競合が引用されるURL、自社にないページ、新規出現 / 継続 / 消失 詳細を確認します。" icon={Layers3} wide><DetailList items={ownerTrend} /><Table columns={missingPageCols} rows={missingPages.map((x) => row(x.page, { page: x.page, url: x.url, questions: x.questions, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge> }))} compact /></Section></div></div>;
}

function ActionTab({ design }: { design: CustomerReportDesignVariant }) {
  return <div className={styles.tabContent}>{design === "action" ? <section className={styles.actionFocus}><div><span>実行優先</span><strong>競合比較ページの強化</strong><p>期待効果 +8.5pt。T02の競合差分とT04の高意図質問から優先度が高い施策です。</p></div><div><span>次点</span><strong>SEOツール選定ガイドの作成</strong><p>期待効果 +7.2pt。比較検討と社内承認の質問で露出改善を狙います。</p></div><div><span>確認中</span><strong>導入判断向けFAQの追加</strong><p>期待効果 +4.8pt。T03/T04の導入判断領域に接続します。</p></div></section> : null}<div className={styles.contentGrid}><Section title="改善提案一覧" icon={ListChecks} wide><Table columns={recCols} rows={recs.map(recRow)} /></Section><Section title="優先度付きアクション" icon={Target} wide><Table columns={actionCols} rows={recs.map((x, i) => row(x.title, { order: i + 1, title: x.title, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge>, impact: x.impact, effort: x.effort, basis: x.target.replace("/", "・") }))} /></Section><Section title="掲載獲得アクション" icon={ArrowUpRight}><InsightList items={actions} /></Section><Section title="コンテンツギャップ" icon={GitCompare}><Table columns={contentGapCols} rows={contentGaps.map((x) => row(x.area, { area: x.area, questions: x.questions, competitor: x.competitor, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge> }))} compact /></Section><Section title="コンテンツ推奨" icon={Layers3}><InsightList items={contentRecs} /></Section><Section title="ページ種別別施策" icon={Compass}><Table columns={pageTypeCols} rows={pageTypes.map((x) => row(x.type, { type: x.type, count: x.count, impact: x.impact }))} compact /></Section><Section title="既存ページ改善" icon={Activity}><Table columns={existingPageCols} rows={existingPages.map((x) => row(x.url, { url: x.url, action: x.action, impact: x.impact }))} compact /></Section><Section title="新規ページ作成" icon={Building2}><Table columns={newPageCols} rows={newPages.map((x) => row(x.path, { path: x.path, theme: x.theme, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge> }))} compact /></Section><Section title="詳細ビュー" description="実行バックログ、掲載ターゲット、AI引用向けブリーフ、施策レビュー状態、オリジナル調査・信頼材料、技術修正提案、ワークフロー・エージェントを確認します。" icon={Layers3} wide><Table columns={backlogCols} rows={recs.map((x) => row(x.title, { title: x.title, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge>, owner: x.owner, status: x.status, impact: x.impact }))} compact /><DetailList items={["掲載ターゲット: SEOツールを比較するとき何を見るべき？ / BtoB向けのSEO分析ツールでおすすめは？ / Ahrefsと国産SEOツールの違いは？ / SEOツールの費用対効果をどう説明する？ / 被リンク分析に強いSEOツールは？", "AI引用向けブリーフ: ページ案 SEOツール比較完全ガイド / 狙う質問 SEOツールを比較するとき何を見るべき？ / 入れるべき要素 比較軸、対象企業、導入判断、費用対効果、運用負荷、国産ツールの強み / 引用されやすい構造 冒頭要約、比較表、FAQ、導入チェックリスト"]} /></Section></div></div>;
}

function HeroInsightStrip({ design }: { design: CustomerReportDesignVariant }) {
  const copy = { executive: "SOV差 -2.6pt と自社ドメイン引用率 22.4% が、経営会議で最初に確認すべき論点です。", analyst: "直近7日で総合スコアは61から68へ上昇。比較・被リンク・費用対効果の弱点が指標に残っています。", action: "優先施策は競合比較ページ、選定ガイド、導入判断FAQ。T02/T04/T06の根拠に接続します。" } satisfies Record<CustomerReportDesignVariant, string>;
  return <section className={styles.heroInsight}><div><span>重点論点</span><strong>{copy[design]}</strong></div><ChevronRight aria-hidden="true" size={22} /></section>;
}
function MetaPill({ label, value }: { label: string; value: string }) { return <div className={styles.metaPill}><span>{label}</span><strong>{value}</strong></div>; }
function CompactMetric({ label, value }: { label: string; value: string }) { return <div className={styles.compactMetric}><span>{label}</span><strong>{value}</strong></div>; }
function ScoreRing({ value, label }: { value: number; label: string }) { return <div className={styles.scoreRingWrap}><div className={styles.scoreRing} style={{ "--score": value } as CSSProperties}><span>{value}</span></div><p>{label}</p></div>; }
function MetricCard({ metric }: { metric: { label: string; value: string; delta?: string; helper?: string; tone?: Tone } }) { return <article className={`${styles.metricCard} ${metric.tone ? styles[`tone${cap(metric.tone)}`] : ""}`}><span>{metric.label}</span><strong>{metric.value}</strong>{metric.delta ? <small>{metric.delta}</small> : null}{metric.helper ? <p>{metric.helper}</p> : null}</article>; }
function Section({ title, description, icon: Icon, wide, children }: { title: string; description?: string; icon: LucideIcon; wide?: boolean; children: ReactNode }) { return <section className={`${styles.section} ${wide ? styles.wide : ""}`}><header><div className={styles.sectionTitle}><Icon aria-hidden="true" size={18} /><h2>{title}</h2></div>{description ? <p>{description}</p> : null}</header><div className={styles.sectionBody}>{children}</div></section>; }
function Table({ columns, rows, compact }: { columns: Column[]; rows: Row[]; compact?: boolean }) { return <div className={styles.tableWrap}><table className={compact ? styles.compactTable : undefined}><thead><tr>{columns.map((c) => <th key={c.key} className={align(c.align)}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.id} className={r.highlight ? styles.highlightRow : undefined}>{columns.map((c) => <td key={c.key} className={align(c.align)}>{r.cells[c.key]}</td>)}</tr>)}</tbody></table></div>; }
function HorizontalBars({ data, max }: { data: Bar[]; max: number }) { return <div className={styles.barStack}>{data.map((x) => <div key={x.label} className={styles.barRow}><div className={styles.barMeta}><strong>{x.label}</strong><span>{x.value}{x.suffix ?? ""}{x.meta ? ` / ${x.meta}` : ""}</span></div><div className={styles.barTrack} aria-hidden="true"><span className={x.tone ? styles[`tone${cap(x.tone)}`] : undefined} style={{ width: `${Math.min(100, (x.value / max) * 100)}%` }} /></div></div>)}</div>; }
function LineTrend({ data }: { data: Array<{ label: string; value: number }> }) { const min = Math.min(...data.map((x) => x.value)) - 2; const max = Math.max(...data.map((x) => x.value)) + 2; const pts = data.map((x, i) => ({ x: 8 + (i * 84) / Math.max(1, data.length - 1), y: 76 - ((x.value - min) / (max - min)) * 58, ...x })); return <div className={styles.lineChart}><svg viewBox="0 0 100 86" role="img" aria-label="直近7日の総合AI可視性スコア推移"><path className={styles.chartGrid} d="M8 18H92M8 47H92M8 76H92" /><polyline className={styles.chartLine} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />{pts.map((p) => <circle key={p.label} cx={p.x} cy={p.y} r="1.8" className={styles.chartPoint} />)}</svg><div className={styles.axisLabels}>{pts.map((p) => <span key={p.label}>{p.label}<strong>{p.value}</strong></span>)}</div></div>; }
function SegmentedBar({ segments }: { segments: Array<{ label: string; value: number; tone: Tone }> }) { return <div className={styles.segmentedBlock}><div className={styles.segmentedBar}>{segments.map((s) => <span key={s.label} className={styles[`tone${cap(s.tone)}`]} style={{ width: `${s.value}%` }} />)}</div><div className={styles.segmentLegend}>{segments.map((s) => <span key={s.label}><i className={styles[`tone${cap(s.tone)}`]} />{s.label} {s.value}%</span>)}</div></div>; }
function ModelComparison() { return <div className={styles.modelBars}>{models.map((m) => <article key={m.model}><div><strong>{m.model}</strong><span>平均掲載位置 {m.position}</span></div><HorizontalBars data={[{ label: "AI表示率", value: parseFloat(m.visibility), suffix: "%", tone: "blue" }, { label: "SOV", value: parseFloat(m.sov), suffix: "%", tone: "green" }, { label: "引用率", value: parseFloat(m.citation), suffix: "%", tone: "violet" }]} max={70} /></article>)}</div>; }
function InsightList({ items }: { items: string[] }) { return <ol className={styles.insightList}>{items.map((x, i) => <li key={`${i}-${x}`}><span>{i + 1}</span>{x}</li>)}</ol>; }
function ChangeColumns({ groups }: { groups: Array<{ title: string; items: string[] }> }) { return <div className={styles.changeColumns}>{groups.map((g) => <div key={g.title}><strong>{g.title}</strong><ul>{g.items.map((x) => <li key={x}>{x}</li>)}</ul></div>)}</div>; }
function Heatmap() { return <div className={styles.heatmap}><div className={styles.heatmapHeader}><span />{heatTopics.map((t) => <span key={t}>{t}</span>)}</div>{heatRows.map((r) => <div key={r.persona} className={styles.heatmapRow}><strong>{r.persona}</strong>{r.scores.map((s, i) => <span key={`${r.persona}-${heatTopics[i]}`} style={{ "--heat": s } as CSSProperties}>{s}</span>)}</div>)}</div>; }
function FilterGroups() { return <div className={styles.filterGroups}><div><strong>種類</strong>{promptFilters.types.map((x) => <span key={x}>{x}</span>)}</div><div><strong>用途</strong>{promptFilters.useCases.map((x) => <span key={x}>{x}</span>)}</div><div><strong>状態</strong>{promptFilters.statuses.map((x) => <span key={x}>{x}</span>)}</div></div>; }
function StatTiles({ stats }: { stats: string[] }) { return <div className={styles.statTiles}>{stats.map((s) => { const [label, ...rest] = s.split(" "); return <div key={s}><span>{label}</span><strong>{rest.join(" ")}</strong></div>; })}</div>; }
function DonutBreakdown({ segments }: { segments: Array<{ label: string; value: number; tone: Tone }> }) { return <div className={styles.donutBreakdown}><div className={styles.multiDonut} aria-hidden="true" /><SegmentedBar segments={segments} /></div>; }
function DetailList({ items }: { items: string[] }) { return <ul className={styles.detailList}>{items.map((x) => <li key={x}>{x}</li>)}</ul>; }
function Badge({ tone, children }: { tone: Tone; children: ReactNode }) { return <span className={`${styles.badge} ${styles[`tone${cap(tone)}`]}`}>{children}</span>; }
function row(id: string, cells: Record<string, ReactNode>, highlight = false): Row { return { id, cells, highlight }; }
function brandRow(x: (typeof brandRanking)[number]): Row { return row(x.brand, { rank: x.rank, brand: x.brand, sov: x.sov, visibility: x.visibility, position: x.position, citation: x.citation }, Boolean("own" in x && x.own)); }
function sourceRow(x: (typeof sources)[number]): Row { return row(x.domain, { rank: x.rank, domain: x.domain, owner: x.owner, count: x.count, share: x.share, topic: x.topic }, Boolean("own" in x && x.own)); }
function promptRow(x: (typeof prompts)[number]): Row { return row(x.question, { question: x.question, type: x.type, useCase: x.useCase, status: <Badge tone={x.status === "強い" ? "green" : x.status === "競合は出るが自社が出ない" ? "red" : "amber"}>{x.status}</Badge>, visibility: x.visibility, sov: x.sov, rank: x.rank, citation: x.citation, competitor: x.competitor, gap: x.gap, action: x.action }); }
function recRow(x: (typeof recs)[number]): Row { return row(x.title, { title: x.title, priority: <Badge tone={x.priority === "高" ? "amber" : "blue"}>{x.priority}</Badge>, impact: x.impact, target: x.target, status: x.status }); }
function sourceCols(topic: boolean): Column[] { const cols = [{ key: "rank", label: "順位", align: "right" as const }, { key: "domain", label: "ドメイン" }, { key: "owner", label: "所有者タイプ" }, { key: "count", label: "引用数", align: "right" as const }, { key: "share", label: "引用率", align: "right" as const }]; return topic ? [...cols, { key: "topic", label: "主なトピック" }] : cols; }
const brandCols: Column[] = [{ key: "rank", label: "順位", align: "right" }, { key: "brand", label: "ブランド" }, { key: "sov", label: "SOV", align: "right" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "position", label: "平均掲載位置", align: "right" }, { key: "citation", label: "引用率", align: "right" }];
const personaSummaryCols: Column[] = [{ key: "persona", label: "検討者" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "sov", label: "SOV", align: "right" }, { key: "position", label: "平均掲載位置", align: "right" }, { key: "summary", label: "要約" }];
const personaCols: Column[] = [{ key: "persona", label: "検討者" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "sov", label: "SOV", align: "right" }, { key: "citation", label: "引用率", align: "right" }, { key: "position", label: "平均掲載位置", align: "right" }, { key: "strong", label: "強いトピック" }, { key: "weak", label: "弱いトピック" }];
const useCaseCols: Column[] = [{ key: "useCase", label: "用途" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "sov", label: "SOV", align: "right" }, { key: "position", label: "平均掲載位置", align: "right" }, { key: "question", label: "代表質問" }];
const funnelCols: Column[] = [{ key: "stage", label: "フェーズ" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "sov", label: "SOV", align: "right" }, { key: "citation", label: "引用率", align: "right" }];
const topicGapCols: Column[] = [{ key: "topic", label: "トピック" }, { key: "priority", label: "重要度" }, { key: "own", label: "自社スコア", align: "right" }, { key: "competitor", label: "競合スコア", align: "right" }, { key: "gap", label: "差分", align: "right" }];
const topicVisCols: Column[] = [{ key: "topic", label: "トピック" }, { key: "visibility", label: "自社AI表示率", align: "right" }, { key: "sov", label: "自社SOV", align: "right" }, { key: "competitor", label: "最大競合" }];
const modelStrengthCols: Column[] = [{ key: "model", label: "AIモデル" }, { key: "strong", label: "強い" }, { key: "weak", label: "弱い" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "sov", label: "SOV", align: "right" }];
const promptCols: Column[] = [{ key: "question", label: "質問" }, { key: "type", label: "種類" }, { key: "useCase", label: "用途" }, { key: "status", label: "状態" }, { key: "visibility", label: "AI表示率", align: "right" }, { key: "sov", label: "SOV", align: "right" }, { key: "rank", label: "自社順位", align: "right" }, { key: "citation", label: "引用率", align: "right" }, { key: "competitor", label: "最大競合" }, { key: "gap", label: "競合差分", align: "right" }, { key: "action", label: "改善候補" }];
const missingQuestionCols: Column[] = [{ key: "question", label: "質問" }, { key: "competitor", label: "最大競合" }, { key: "competitorSov", label: "競合SOV", align: "right" }, { key: "ownSov", label: "自社SOV", align: "right" }];
const weakQuestionCols: Column[] = [{ key: "question", label: "質問" }, { key: "rank", label: "自社順位", align: "right" }, { key: "gap", label: "差分", align: "right" }];
const highIntentCols: Column[] = [{ key: "question", label: "質問" }, { key: "score", label: "意図スコア", align: "right" }, { key: "status", label: "状態" }];
const promptGapCols: Column[] = [{ key: "area", label: "領域" }, { key: "count", label: "質問数", align: "right" }, { key: "avg", label: "平均SOV", align: "right" }, { key: "competitor", label: "最大競合" }, { key: "gap", label: "差分", align: "right" }];
const promptHistoryCols: Column[] = [{ key: "date", label: "日付" }, { key: "model", label: "モデル" }, { key: "listed", label: "自社掲載" }, { key: "rank", label: "順位", align: "right" }, { key: "sov", label: "SOV", align: "right" }];
const positionCols: Column[] = [{ key: "question", label: "質問" }, { key: "own", label: "自社順位", align: "right" }, { key: "competitor", label: "最大競合" }, { key: "gap", label: "差分", align: "right" }];
const recRankingCols: Column[] = [{ key: "brand", label: "ブランド" }, { key: "order", label: "平均推薦順", align: "right" }, { key: "rate", label: "推薦率", align: "right" }];
const modelAnswerCols: Column[] = [{ key: "model", label: "AIモデル" }, { key: "sov", label: "SOV", align: "right" }, { key: "position", label: "平均掲載位置", align: "right" }, { key: "sentiment", label: "感情スコア", align: "right" }, { key: "recommendation", label: "推薦率", align: "right" }];
const weakDescriptionCols: Column[] = [{ key: "type", label: "種類" }, { key: "text", label: "表示文言" }, { key: "impact", label: "影響範囲" }, { key: "action", label: "改善方向" }];
const answerCols: Column[] = [{ key: "question", label: "質問" }, { key: "model", label: "モデル" }, { key: "listed", label: "自社掲載" }, { key: "first", label: "初出位置", align: "right" }, { key: "order", label: "推薦順", align: "right" }, { key: "sentiment", label: "感情" }, { key: "summary", label: "要約" }];
const competitorUrlCols: Column[] = [{ key: "url", label: "URL" }, { key: "competitor", label: "競合" }, { key: "count", label: "引用数", align: "right" }, { key: "question", label: "関連質問" }];
const missingPageCols: Column[] = [{ key: "page", label: "自社にないページ" }, { key: "url", label: "競合URL" }, { key: "questions", label: "関連質問", align: "right" }, { key: "priority", label: "優先度" }];
const recCols: Column[] = [{ key: "title", label: "改善提案" }, { key: "priority", label: "優先度" }, { key: "impact", label: "期待効果", align: "right" }, { key: "target", label: "対象" }, { key: "status", label: "状態" }];
const actionCols: Column[] = [{ key: "order", label: "順", align: "right" }, { key: "title", label: "アクション" }, { key: "priority", label: "優先度" }, { key: "impact", label: "期待効果", align: "right" }, { key: "effort", label: "工数" }, { key: "basis", label: "根拠" }];
const contentGapCols: Column[] = [{ key: "area", label: "領域" }, { key: "questions", label: "関連質問", align: "right" }, { key: "competitor", label: "最大競合" }, { key: "priority", label: "優先度" }];
const pageTypeCols: Column[] = [{ key: "type", label: "ページ種別" }, { key: "count", label: "施策数", align: "right" }, { key: "impact", label: "期待効果" }];
const existingPageCols: Column[] = [{ key: "url", label: "既存ページ" }, { key: "action", label: "改善" }, { key: "impact", label: "期待効果", align: "right" }];
const newPageCols: Column[] = [{ key: "path", label: "ページ候補" }, { key: "theme", label: "テーマ" }, { key: "priority", label: "優先度" }];
const backlogCols: Column[] = [{ key: "title", label: "実行バックログ" }, { key: "priority", label: "優先度" }, { key: "owner", label: "担当" }, { key: "status", label: "ステータス" }, { key: "impact", label: "期待効果", align: "right" }];
function align(a?: "left" | "right" | "center") { return a === "right" ? styles.alignRight : a === "center" ? styles.alignCenter : undefined; }
function cap(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
