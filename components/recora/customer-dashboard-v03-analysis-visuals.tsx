"use client";

import Link from "next/link";
import {
  isValidElement,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from "react";

import {
  DataRichBadge,
  DataRichInlineBar,
  DataRichPanel,
  DataRichTableWrap
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  ReportDetailButton,
  openReportDetail,
  reportScopeFacts,
  useReportDetailScope,
  type ReportDetailSection,
  type ReportDetailPayload
} from "@/components/recora/report-ui/report-detail-drawer";
import { cn } from "@/lib/utils";

export type ChartSeries = {
  name: string;
  color: string;
  values: number[];
  dashed?: boolean;
  dashPattern?: string;
  emphasized?: boolean;
};

export type ChartAnnotation = {
  index: number;
  label: string;
  detail?: ReportDetailPayload;
};

export type ReportTableDetailType =
  | "brand-matchup"
  | "brand-replacement"
  | "brand-language-performance"
  | "persona-model-performance"
  | "ranking-period-snapshot"
  | "topic-competitive-performance"
  | "buyer-axis-matchup"
  | "persona-source-ranking"
  | "source-domain-ranking"
  | "source-page-ranking"
  | "topic-source-ranking"
  | "competitor-loss-source-ranking"
  | "source-change"
  | "source-overlap"
  | "source-replacement"
  | "owned-page-gap"
  | "prompt-question-result"
  | "prompt-model-result"
  | "prompt-source-usage"
  | "claim-audit"
  | "claim-fact-comparison"
  | "model-narrative"
  | "source-lifecycle"
  | "source-page-metadata"
  | "source-page-observation"
  | "claim-occurrence"
  | "stability"
  | "change-contribution"
  | "timeline";

export type ReportMatrixDetailType =
  | "brand-source"
  | "topic-source"
  | "persona-brand"
  | "topic-brand"
  | "model-brand"
  | "persona-stage"
  | "brand-theme"
  | "recommendation-opportunity"
  | "source-coverage"
  | "persona-model";

export type ReportTrendDetailType =
  | "ai-visibility"
  | "model-visibility"
  | "sov"
  | "average-position"
  | "ranking"
  | "ranking-gap"
  | "citation"
  | "citation-source-retention"
  | "observation-quality"
  | "source-coverage"
  | "persona-performance"
  | "topic-performance"
  | "prompt-performance"
  | "sentiment"
  | "claim";

export type ReportSegmentDetailType = "source-concentration";

export type ReportMetricGridDetailType =
  | "answer-role"
  | "observation-status"
  | "stability";

function formatChartValue(value: number, unit = "", decimals = 0) {
  return `${value.toFixed(decimals)}${unit}`;
}

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).filter(Boolean).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return "";
}

function nodeHref(node: ReactNode): string | undefined {
  if (Array.isArray(node)) {
    return node.map(nodeHref).find((value): value is string => Boolean(value));
  }
  if (!isValidElement<{ href?: unknown; children?: ReactNode }>(node)) return undefined;
  if (typeof node.props.href === "string") return node.props.href;
  return nodeHref(node.props.children);
}

type TableDetailContext = {
  facts: { label: string; value: string }[];
  comparison: { columns: string[]; rows: string[][] };
  first: string;
  second: string;
  columns: string[];
  values: string[];
  rowIndex: number;
  detailHref?: string;
  observationRule: { label: string; value: string }[];
};

function createTableDetailContext(columns: string[], rows: ReactNode[][], rowIndex: number): TableDetailContext {
  const values = (rows[rowIndex] ?? []).map(nodeText);
  const includedColumns = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => !["詳細", "根拠", "回答", "回答全文"].includes(column));
  const visibleColumns = includedColumns.slice(0, 6);

  return {
    facts: includedColumns.map(({ column, index }) => ({ label: column, value: values[index] || "—" })),
    comparison: {
      columns: visibleColumns.map(({ column }) => column),
      rows: rows.slice(0, 8).map((row) => visibleColumns.map(({ index }) => nodeText(row[index]) || "—"))
    },
    first: values[0] || `${rowIndex + 1}行目`,
    second: values[1] || values[0] || `${rowIndex + 1}行目`,
    columns,
    values,
    rowIndex,
    detailHref: (rows[rowIndex] ?? []).map(nodeHref).find((value): value is string => Boolean(value)),
    observationRule: [
      { label: "照合条件", value: "同一日 × 同一AIモデル × 同一プロンプト" },
      { label: "欠測", value: "未掲載や不一致と混ぜず、別状態として保持" }
    ]
  };
}

function buildTableRowDetail(
  detailType: ReportTableDetailType,
  columns: string[],
  rows: ReactNode[][],
  rowIndex: number
): ReportDetailPayload | null {
  const context = createTableDetailContext(columns, rows, rowIndex);
  const detail = buildSemanticComparisonDetail(detailType, context)
    ?? buildMarketTableDetail(detailType, context)
    ?? buildEvidenceTableDetail(detailType, context)
    ?? buildOperationalTableDetail(detailType, context);
  if (!detail) return null;
  const trace = buildTableTraceSection(detailType, context);
  if (!trace) return null;
  return {
    ...detail,
    sections: [...detail.sections, { ...trace, variant: "trace", collapsed: true }],
    detailHref: context.detailHref?.startsWith("/") ? context.detailHref : detail.detailHref,
    detailLabel: context.detailHref?.startsWith("/") ? "該当データの詳細を開く" : detail.detailLabel
  };
}

function columnValue(context: TableDetailContext, columnName: string) {
  const index = context.columns.indexOf(columnName);
  return index >= 0 ? context.values[index] : "";
}

function traceHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

function traceToken(value: string) {
  const readable = value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
  const hash = traceHash(value);
  return readable ? `${readable}-${hash}` : `K${hash}`;
}

function deterministicTraceId(
  prefix: "OBS" | "PAIR" | "AGG" | "EVT" | "PRM" | "OBSSET" | "SERIES",
  scope: string,
  parts: string[],
  ordinal = 1,
  date = "20260706"
) {
  return [
    prefix,
    date,
    traceToken(scope),
    ...parts.map(traceToken),
    String(ordinal).padStart(2, "0")
  ].join("-");
}

function sourceUrl(value: string) {
  const candidate = value.trim().split(/\s+/)[0]?.replace(/[),.;]+$/, "") ?? "";
  if (/^https?:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(candidate)) return candidate;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?$/i.test(candidate)) return `https://${candidate}`;
  return undefined;
}

function buildTableTraceSection(
  detailType: ReportTableDetailType,
  context: TableDetailContext
): ReportDetailSection | null {
  const modelNames = ["GPT", "Gemini", "Perplexity", "Google AI Mode"];
  const explicitModel = columnValue(context, "モデル") || columnValue(context, "主なモデル");
  const model = detailType === "persona-model-performance"
    || detailType === "prompt-model-result"
    || detailType === "model-narrative"
    || detailType === "stability"
    ? context.first
    : detailType === "source-overlap"
      ? context.first
    : explicitModel || modelNames[context.rowIndex % modelNames.length];
  const traceParts = [context.first, context.second, explicitModel || model, context.values.join("|")];
  const observationId = deterministicTraceId("OBS", `TABLE-${detailType}`, traceParts);
  const observedAt = `2026-07-06 06:${String(8 + context.rowIndex * 7).padStart(2, "0")} JST`;

  if (detailType === "source-overlap") {
    return {
      title: "同一質問のモデル照合へ遡る",
      description: "一致度は回答ではなく、同じ質問に対する二つのモデルの正規化済み引用URL集合を照合した結果です。",
      facts: [
        { label: "照合ID", value: deterministicTraceId("PAIR", "SOURCE-OVERLAP", [context.first, context.second, context.values.join("|")]) },
        { label: "照合日時", value: observedAt },
        { label: "モデル組み合わせ", value: context.first },
        { label: "プロンプトID", value: deterministicTraceId("PRM", "SOURCE-OVERLAP", [context.first, "引用元比較"]) },
        { label: "質問", value: "AI検索対策サービスの比較に使える情報源を挙げてください。" },
        { label: "共通ドメイン", value: columnValue(context, "共通ドメイン") },
        { label: "片方だけ", value: columnValue(context, "片方だけ") }
      ]
    };
  }

  if (detailType === "change-contribution") {
    return {
      title: "同じ条件で比較できた回答へ遡る",
      description: "単一回答の因果ではなく、前期間と今期間で同じ条件で比較できたAI回答の構成差です。",
      facts: [
        { label: "集計ID", value: deterministicTraceId("AGG", "CHANGE-CONTRIBUTION", [context.first, context.second]) },
        { label: "比較期間", value: "2026-06-07〜07-05 vs 2026-06-08〜07-06" },
        { label: "寄与軸", value: context.first },
        { label: "対象", value: context.second },
        { label: "寄与", value: columnValue(context, "寄与") },
        { label: "比較可能観測", value: columnValue(context, "比較可能観測") },
        { label: "代表観測ID", value: deterministicTraceId("OBS", "CHANGE-CONTRIBUTION", [context.first, context.second, columnValue(context, "寄与")]) }
      ]
    };
  }

  if (detailType === "timeline") {
    return {
      title: "変化イベントの観測へ遡る",
      description: "イベント日は関連する観測への入口です。表示した変化と外部施策の因果は判定していません。",
      facts: [
        { label: "イベントID", value: deterministicTraceId("EVT", "TIMELINE", [context.first, context.second], 1, "202607") },
        { label: "観測日", value: context.first },
        { label: "観測された変化", value: context.second },
        { label: "対象観測", value: columnValue(context, "観測") },
        { label: "代表観測ID", value: deterministicTraceId("OBS", "TIMELINE", [context.first, context.second, columnValue(context, "観測")]) },
        { label: "遡り先", value: columnValue(context, "関連詳細") || "関連データ" }
      ]
    };
  }

  if (detailType === "stability") {
    return {
      title: "日次判定ペアへ遡る",
      description: "安定性は同じモデル・同じ質問の隣接日ペアを照合した結果です。欠測ペアは不一致へ含めません。",
      facts: [
        { label: "判定ペアID", value: deterministicTraceId("PAIR", "STABILITY", [context.first, context.second, context.values.join("|")]) },
        { label: "比較日", value: "2026-07-05 → 2026-07-06" },
        { label: "AIモデル", value: context.first },
        { label: "プロンプトID", value: deterministicTraceId("PRM", "STABILITY", [context.first, "日次状態比較"]) },
        { label: "前日状態", value: "掲載あり・2位" },
        { label: "当日状態", value: context.rowIndex === 1 ? "未掲載" : "掲載あり・2位" },
        { label: "照合結果", value: context.rowIndex === 1 ? "掲載判断が変化" : "状態維持" }
      ]
    };
  }

  let prompt: string | undefined;
  let answerExcerpt: string | undefined;
  let citationUrl: string | undefined;

  if (detailType === "brand-matchup") {
    prompt = `${context.first}とRecoraを、機能・根拠の確認方法・運用負荷で比較してください。`;
    answerExcerpt = `この回答ではRecoraと${context.first}が併記され、${columnValue(context, "自社勝ち") || columnValue(context, "勝率")}という集計に含まれました。`;
  } else if (detailType === "brand-replacement") {
    prompt = `${columnValue(context, "強いペルソナ") || "導入担当"}向けに、${columnValue(context, "強いトピック") || "競合比較"}のサービス候補を挙げてください。`;
    answerExcerpt = `Recoraは掲載されず、${context.first}が候補として掲載された回答です。`;
  } else if (detailType === "model-narrative") {
    prompt = "Recoraが提供するサービスと、導入判断で確認すべき点を説明してください。";
    answerExcerpt = `${context.first}はRecoraを「${columnValue(context, "主な説明")}」と説明し、「${columnValue(context, "強調点")}」を強調しました。`;
  } else if (detailType === "brand-language-performance") {
    prompt = `AI検索対策サービスの「${context.first}」を比較してください。`;
    answerExcerpt = `Recoraは「${context.first}」の説明で言及され、評価理由もあわせて示されました。`;
  } else if (detailType === "persona-model-performance") {
    prompt = "マーケティング責任者がGEOツールを選ぶ基準は？";
    answerExcerpt = `${context.first}の回答では、${columnValue(context, "強いトピック") || "改善施策"}が強く、${columnValue(context, "弱いトピック") || "料金"}が弱い結果でした。`;
  } else if (detailType === "ranking-period-snapshot") {
    prompt = "企業向けGEOツールの候補を比較してください。";
    answerExcerpt = `${context.first}の回答群でRecoraの順位と首位差が変化しました。`;
  } else if (detailType === "topic-competitive-performance" || detailType === "buyer-axis-matchup") {
    prompt = `「${context.first}」を条件にGEOツールを比較してください。`;
    answerExcerpt = `「${context.first}」の回答でRecoraと主要競合が比較されました。`;
  } else if (["persona-source-ranking", "source-domain-ranking", "source-page-ranking", "topic-source-ranking", "competitor-loss-source-ranking"].includes(detailType)) {
    const source = detailType === "source-page-ranking" ? context.first : context.second;
    prompt = detailType === "persona-source-ranking"
      ? `${context.first}がGEOツールを選ぶ際に参照すべき情報源は？`
      : "AI検索対策サービスの比較に使える根拠を挙げてください。";
    answerExcerpt = `この回答では${source}が引用元として使われました。`;
    citationUrl = sourceUrl(source);
  } else if (detailType === "prompt-source-usage") {
    prompt = "GEO対策ツールの選定基準は？";
    answerExcerpt = `${context.first}が引用され、${columnValue(context, "対応する回答箇所") || "比較の判断材料"}に対応しました。`;
    citationUrl = sourceUrl(context.first);
  } else if (detailType === "source-page-metadata") {
    prompt = "AI検索で引用される情報源を教えてください。";
    answerExcerpt = `${context.first}が引用された回答を、初回観測日と最終観測日で確認できます。`;
    citationUrl = sourceUrl(context.first);
  } else if (detailType === "owned-page-gap") {
    prompt = "GEOツールの比較根拠と導入判断に必要な情報を教えてください。";
    answerExcerpt = `自社候補${context.first}では${context.second}が不足し、第三者ページが引用されました。`;
  } else if (detailType === "claim-audit" || detailType === "claim-fact-comparison") {
    prompt = "Recoraの料金と導入条件を教えてください。";
    answerExcerpt = detailType === "claim-audit"
      ? context.first
      : "月額料金が旧プランの金額で説明され、現行の公式情報と一致しませんでした。";
    citationUrl = sourceUrl(columnValue(context, "引用元"));
  } else if (detailType === "source-change" || detailType === "source-replacement" || detailType === "source-lifecycle") {
    const source = detailType === "source-change" || detailType === "source-replacement" ? context.second : context.first;
    prompt = "GEOツールの選定に使える最新の情報源を教えてください。";
    answerExcerpt = `${source}の引用状態がこの観測で確認されました。`;
    citationUrl = detailType === "source-lifecycle" ? undefined : sourceUrl(source);
  } else if (detailType === "source-page-observation") {
    prompt = columnValue(context, "プロンプト");
    answerExcerpt = `${columnValue(context, "対応する回答箇所")}に対応する引用として、このページが使用されました。`;
  } else if (detailType === "claim-occurrence") {
    prompt = `${columnValue(context, "トピック") || "料金"}についてRecoraの情報を説明してください。`;
    answerExcerpt = `「月額料金は旧プランの金額から利用できる」という主張が、${columnValue(context, "根拠箇所") || "回答内"}に出現しました。`;
    citationUrl = sourceUrl(columnValue(context, "引用元"));
  } else if (detailType === "prompt-question-result") {
    prompt = context.first;
    answerExcerpt = `${columnValue(context, "結果") || context.second}。先行競合は${columnValue(context, "先行競合") || "該当なし"}でした。`;
  } else if (detailType === "prompt-model-result") {
    prompt = "GEO対策ツールの選定基準は？";
    answerExcerpt = `${context.first}の回答は${columnValue(context, "観測状態")}で、自社掲載は${columnValue(context, "自社掲載")}、役割は${columnValue(context, "役割")}でした。`;
  }

  if (!prompt || !answerExcerpt) return null;

  const facts = [
    { label: "観測ID", value: observationId },
    { label: "観測日時", value: observedAt },
    { label: "AIモデル", value: model },
    { label: "プロンプト", value: prompt },
    { label: "回答抜粋", value: answerExcerpt }
  ];
  if (citationUrl) facts.push({ label: "引用URL", value: citationUrl });

  return {
    title: "該当観測へ遡る",
    description: "選択した行に対応する観測識別子と回答根拠です。",
    facts
  };
}

function buildSemanticComparisonDetail(
  detailType: ReportTableDetailType,
  context: TableDetailContext
): ReportDetailPayload | null {
  const { facts, comparison, first, observationRule } = context;

  if (detailType === "brand-language-performance") {
    return {
      kicker: "BRAND LANGUAGE",
      title: `「${first}」の語られ方`,
      summary: "この語彙が自社・競合の回答で現れた回数と、肯定・中立・否定の構成を分けて確認します。",
      sections: [
        { title: "語彙の出現と感情構成", facts },
        { title: "自社・競合・前期間の比較", table: comparison },
        { title: "集計定義", facts: [...observationRule, { label: "出現単位", value: "同一回答内は1件として重複排除" }] }
      ]
    };
  }
  if (detailType === "persona-model-performance") {
    return {
      kicker: "PERSONA MODEL PERFORMANCE",
      title: `${first}：マーケ責任者の成績`,
      summary: "選択モデルにおけるペルソナ固定質問のAI表示率・AI内シェア・平均掲載位置・公式サイト引用率です。",
      sections: [
        { title: "このモデルの5指標", facts },
        { title: "契約モデル間の比較", table: comparison },
        { title: "比較条件", facts: [...observationRule, { label: "質問集合", value: "マーケ責任者に紐づく固定質問" }] }
      ]
    };
  }
  if (detailType === "ranking-period-snapshot") {
    return {
      kicker: "RANKING PERIOD SNAPSHOT",
      title: `${first}のブランド順位`,
      summary: "選択期間の自社順位・首位ブランド・AI表示率差を、同じ質問とモデルが揃う観測だけで比較します。",
      sections: [
        { title: "期間スナップショット", facts },
        { title: "期間ごとの同条件比較", table: comparison },
        { title: "順位定義", facts: [...observationRule, { label: "並び順", value: "比較対象ブランドのAI表示率" }] }
      ]
    };
  }
  if (detailType === "topic-competitive-performance") {
    return {
      kicker: "TOPIC COMPETITION",
      title: `${first}の自社・競合差`,
      summary: "このトピックに属する固定質問だけで、自社と競合のAI表示率・差・勝敗を確認します。",
      sections: [
        { title: "トピックの競合成績", facts },
        { title: "全トピックとの比較", table: comparison },
        { title: "集計範囲", facts: [...observationRule, { label: "質問集合", value: `「${first}」に分類された固定質問` }] }
      ]
    };
  }
  if (detailType === "buyer-axis-matchup") {
    return {
      kicker: "BUYER AXIS MATCHUP",
      title: `${first}の直接比較`,
      summary: "買い手判断軸ごとに自社と表示中の比較対象のAI表示率を比較したレーダーの1軸です。",
      sections: [
        { title: "この判断軸の自社・競合値", facts },
        { title: "全判断軸の比較", table: comparison },
        { title: "レーダーの分母", facts: [...observationRule, { label: "対象回答", value: `「${first}」に対応する比較可能回答` }] }
      ]
    };
  }
  return null;
}

function buildOperationalTableDetail(
  detailType: ReportTableDetailType,
  context: TableDetailContext
): ReportDetailPayload | null {
  const { facts, comparison, first, second, observationRule } = context;

  if (detailType === "source-lifecycle") {
    return {
      kicker: "SOURCE LIFECYCLE",
      title: first,
      summary: "引用元の初回観測・最終観測・継続日数と、獲得・消失した回答を分けます。",
      sections: [
        { title: "観測期間と継続", facts },
        { title: "獲得・消失の比較", table: comparison },
        { title: "日次回答の照合条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "source-page-observation") {
    return {
      kicker: "SOURCE PAGE OBSERVATION",
      title: `${first}での引用ページ観測`,
      summary: "選択中の引用ページが使用された回答について、質問、AIモデル、ブランド掲載、対応する回答箇所を確認します。",
      sections: [
        { title: "このページが使用された回答", facts },
        { title: "同じ引用ページの観測", table: comparison },
        { title: "引用の確認範囲", facts: [
          { label: "観測単位", value: "観測日 × AIモデル × プロンプト × 引用URL" },
          { label: "判定", value: "引用先本文を未確認なら回答箇所との一致は判定しない" }
        ] }
      ]
    };
  }
  if (detailType === "claim-occurrence") {
    return {
      kicker: "CLAIM OCCURRENCE",
      title: `${first}の主張出現`,
      summary: "監査対象の主張が出現した回答を、観測日、AIモデル、ペルソナ、トピック、併記された引用元とともに確認します。",
      sections: [
        { title: "主張が出現した観測", facts },
        { title: "同じ主張の出現回答", table: comparison },
        { title: "引用元の扱い", facts: [
          { label: "表示内容", value: "同じ回答に付与された引用URL" },
          { label: "判定", value: "引用先本文との照合前は主張との一致を判定しない" }
        ] }
      ]
    };
  }
  if (detailType === "stability") {
    return {
      kicker: "MODEL STABILITY",
      title: first,
      summary: "このAIモデルの掲載判断・掲載位置・前期間差を比較し、欠測を不一致と分けて確認します。",
      sections: [
        { title: "このモデルの安定性", facts },
        { title: "モデル間の判定差", table: comparison },
        { title: "比較対象不足の扱い", facts: [
          { label: "欠測", value: "不安定とは数えず比較対象不足に分離" },
          { label: "比較単位", value: "同一日 × 同一プロンプト" }
        ] }
      ]
    };
  }
  if (detailType === "change-contribution") {
    return {
      kicker: "CHANGE CONTRIBUTION",
      title: `${first}：${second}`,
      summary: "前期間差に寄与した観測グループです。相関する構成差であり、原因や施策効果とは断定しません。",
      sections: [
        { title: "差に寄与したAI回答", facts },
        { title: "ほかの寄与軸", table: comparison },
        { title: "同条件比較の条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "timeline") {
    return {
      kicker: "OBSERVED CHANGE",
      title: `${first}の変化`,
      summary: "その日に観測された変化と対象件数です。関連データへ戻れますが、発生日だけで因果は判定しません。",
      sections: [
        { title: "この日の観測", facts },
        { title: "期間内の重要変化", table: comparison },
        { title: "解釈上の注意", facts: [
          { label: "観測", value: "変化日と該当回答を対応づける" },
          { label: "因果", value: "外部要因や施策との因果は別途検証" }
        ] }
      ]
    };
  }
  return null;
}

function buildEvidenceTableDetail(
  detailType: ReportTableDetailType,
  context: TableDetailContext
): ReportDetailPayload | null {
  const { facts, comparison, first, second, observationRule } = context;

  if (detailType === "persona-source-ranking") {
    return {
      kicker: "PERSONA SOURCE RANKING",
      title: `${first}の引用元上位3件`,
      summary: "選択ペルソナの回答で使われた引用元を、回答カバーで順位付けした結果です。",
      sections: [
        { title: "Top3・依存率・回答カバー", facts },
        { title: "ペルソナ間の引用元比較", table: comparison },
        { title: "集計条件", facts: [...observationRule, { label: "順位指標", value: "回答単位で重複排除した引用元カバー" }] }
      ]
    };
  }
  if (detailType === "source-domain-ranking") {
    return {
      kicker: "SOURCE DOMAIN RANKING",
      title: second,
      summary: "このドメインの回答カバー・引用出現・URL数・モデル横断数を、同じ集計内のドメインと比較します。",
      sections: [
        { title: "ドメインの引用範囲", facts },
        { title: "ドメイン順位の比較", table: comparison },
        { title: "集計条件", facts: [...observationRule, { label: "回答カバー", value: "同一回答内の複数引用は1回答として重複排除" }] }
      ]
    };
  }
  if (detailType === "source-page-ranking") {
    return {
      kicker: "SOURCE PAGE RANKING",
      title: first,
      summary: "同一ドメイン内の引用ページごとに、回答カバーと自社・競合の主張に対応した観測を分けます。",
      sections: [
        { title: "URLの回答カバーと主張", facts },
        { title: "同一ドメイン内ページ比較", table: comparison },
        { title: "集計条件", facts: [...observationRule, { label: "引用単位", value: "正規化済み完全URL" }] }
      ]
    };
  }
  if (detailType === "topic-source-ranking") {
    return {
      kicker: "TOPIC SOURCE RANKING",
      title: `${second}の引用元順位`,
      summary: "このトピックに属する固定質問だけで、引用元の回答カバーと自社・競合勝敗時の出現を比較します。",
      sections: [
        { title: "トピック内の引用範囲", facts },
        { title: "同トピック内の引用元比較", table: comparison },
        { title: "集計条件", facts: [...observationRule, { label: "質問集合", value: "このページで選択中のトピックに分類された固定質問" }] }
      ]
    };
  }
  if (detailType === "competitor-loss-source-ranking") {
    return {
      kicker: "LOSS SOURCE RANKING",
      title: `${second}が使われた敗北回答`,
      summary: "自社未掲載・競合掲載の回答だけに絞り、競合先行時に使われた引用元を順位付けします。",
      sections: [
        { title: "敗北回答での引用範囲", facts },
        { title: "敗北回答内の引用元比較", table: comparison },
        { title: "対象条件", facts: [...observationRule, { label: "対象回答", value: "自社未掲載かつ比較対象競合が掲載" }] }
      ]
    };
  }
  if (detailType === "source-change") {
    return {
      kicker: "SOURCE CHANGE",
      title: `${second}の変化`,
      summary: "同じ質問とAIモデルを揃え、前期間からの獲得・上昇・下降・消失を分けた結果です。",
      sections: [
        { title: "前期間からの変化", facts },
        { title: "ほかの引用元変化", table: comparison },
        { title: "期間比較の照合条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "source-overlap") {
    return {
      kicker: "SOURCE OVERLAP",
      title: `${first}の引用元一致度`,
      summary: "同じ質問に対して、二つのAIモデルが共通して使った引用元と片方だけの引用元を分けます。",
      sections: [
        { title: "共通・固有の引用元", facts },
        { title: "モデル組み合わせ別比較", table: comparison },
        { title: "同一質問での比較条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "source-replacement") {
    return {
      kicker: "SOURCE REPLACEMENT",
      title: `${first} → ${second}`,
      summary: "同じ質問とAIモデルで、前期間の引用元が今期間に別の引用元へ変わった観測です。",
      sections: [
        { title: "引用元の置換経路", facts },
        { title: "ほかの置換パターン", table: comparison },
        { title: "置換が起きた回答", facts: observationRule }
      ]
    };
  }
  if (detailType === "prompt-source-usage") {
    return {
      kicker: "PROMPT SOURCE USAGE",
      title: `${first}の引用状況`,
      summary: "選択プロンプトの回答でこの引用元を使ったAIモデル、自社掲載、引用先の自社名、対応する回答箇所を確認します。",
      sections: [
        { title: "引用元・モデル・ブランド掲載・主張", facts },
        { title: "同じプロンプト内の引用元比較", table: comparison },
        { title: "集計条件", facts: [
          ...observationRule,
          { label: "対象質問", value: "選択中の1プロンプト" },
          { label: "引用判定", value: "回答に付与された正規化済み引用URL" }
        ] }
      ]
    };
  }
  if (detailType === "claim-audit") {
    return {
      kicker: "FACT CHECK",
      title: first,
      summary: "AIの説明を登録済みの公式事実と照合し、一致・欠落・古い・矛盾・競合混同・確認不能を分けます。",
      sections: [
        { title: "AIの主張と判定", facts },
        { title: "同じ監査内の主張", table: comparison },
        { title: "出現した回答の照合条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "claim-fact-comparison") {
    return {
      kicker: "CLAIM FACT COMPARISON",
      title: "AIの主張と公式事実の差分",
      summary: "一つの監査対象について、AIの主張・登録された公式事実・判定差分を役割別に対照します。",
      sections: [
        { title: `${first}の内容`, facts },
        { title: "主張・公式事実・差分の対照", table: comparison },
        { title: "照合条件", facts: [
          ...observationRule,
          { label: "公式情報", value: "登録済み公式URLと取得日時を固定して照合" }
        ] }
      ]
    };
  }
  if (detailType === "source-page-metadata") {
    return {
      kicker: "SOURCE PAGE METADATA",
      title: first,
      summary: "引用ページの完全URL・所有区分・ページ種別と、初回・最終観測日を確認します。",
      sections: [
        { title: "URL属性と観測期間", facts },
        { title: "同一ドメイン内URLとの比較", table: comparison },
        { title: "履歴の単位", facts: [
          ...observationRule,
          { label: "URL識別", value: "正規化後の完全URL" }
        ] }
      ]
    };
  }
  if (detailType === "owned-page-gap") {
    return {
      kicker: "OWNED PAGE GAP",
      title: `${first}に不足している情報`,
      summary: "自社候補ページが引用されず第三者ページが選ばれた回答で、候補ページに不足していた情報を観測ベースで整理します。",
      sections: [
        { title: "候補ページ・不足情報・回答数", facts },
        { title: "自社候補ページ間の比較", table: comparison },
        { title: "判定上の注意", facts: [
          ...observationRule,
          { label: "因果", value: "不足情報と非引用の因果は断定せず、同時に観測された差として表示" }
        ] }
      ]
    };
  }
  return null;
}

function buildMarketTableDetail(
  detailType: ReportTableDetailType,
  context: TableDetailContext
): ReportDetailPayload | null {
  const { facts, comparison, first, second, observationRule } = context;

  if (detailType === "brand-matchup") {
    return {
      kicker: "DIRECT MATCHUP",
      title: `${first}との直接対決`,
      summary: "同じ回答内で自社と競合がどう並んだかを、勝敗・不在・比較不能に分けた結果です。",
      sections: [
        { title: "直接対決の判定内訳", facts },
        { title: "競合別の勝敗構成", table: comparison },
        { title: "判定に使った回答", facts: observationRule }
      ]
    };
  }
  if (detailType === "brand-replacement") {
    return {
      kicker: "BRAND REPLACEMENT",
      title: `${first}への置き換わり`,
      summary: "自社が掲載されなかった同一条件の回答で、代わりに掲載されたブランドを示します。",
      sections: [
        { title: "自社未掲載時の掲載ブランド", facts },
        { title: "ほかの置き換え先", table: comparison },
        { title: "置換判定の条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "prompt-question-result") {
    return {
      kicker: "QUESTION RESULT",
      title: `${first}の質問結果`,
      summary: "質問行を起点に、指定モデルの勝敗、先行競合、取得状態と回答全文を確認します。",
      sections: [
        { title: "この質問の回答結果", facts },
        { title: "同じペルソナ内の質問比較", table: comparison },
        { title: "回答全文へ遡る条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "prompt-model-result") {
    return {
      kicker: "MODEL ANSWER RESULT",
      title: `${first}の回答結果`,
      summary: "選択中の一つの質問に対して、このAIモデルが返した観測状態、ブランド掲載、掲載位置、役割、引用を確認します。",
      sections: [
        { title: "このモデルの回答結果", facts },
        { title: "同じ質問のモデル間比較", table: comparison },
        { title: "回答全文へ遡る条件", facts: observationRule }
      ]
    };
  }
  if (detailType === "model-narrative") {
    return {
      kicker: "MODEL NARRATIVE",
      title: `${first}の語り方`,
      summary: "このAIモデルがブランドをどう説明し、何を強調し、何を欠落させたかを他モデルと比較します。",
      sections: [
        { title: "説明・強調点・不足", facts },
        { title: "他モデルとの語り方の差", table: comparison },
        { title: "判定対象の回答", facts: observationRule }
      ]
    };
  }
  return null;
}

export function ReportDataTable({
  columns,
  rows,
  rowKey,
  highlightedRow,
  rowDetails,
  detailType
}: {
  columns: string[];
  rows: ReactNode[][];
  rowKey?: (row: ReactNode[], index: number) => string;
  highlightedRow?: (row: ReactNode[], index: number) => boolean;
  rowDetails?: ReportDetailPayload[] | ((row: ReactNode[], index: number) => ReportDetailPayload | null);
  detailType?: ReportTableDetailType;
}) {
  const scope = useReportDetailScope();

  const resolveDetail = (row: ReactNode[], rowIndex: number) => {
    const hasExplicitRowDetails = rowDetails !== undefined;
    const supplied = typeof rowDetails === "function" ? rowDetails(row, rowIndex) : rowDetails?.[rowIndex];
    const detail = hasExplicitRowDetails
      ? supplied ?? null
      : detailType
        ? buildTableRowDetail(detailType, columns, rows, rowIndex)
        : null;
    if (!detail) return null;
    return detail.scope?.length ? detail : { ...detail, scope: reportScopeFacts(scope) };
  };

  const isInteractiveTarget = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("a, button, input, select, textarea, [role='button']"));

  return (
    <DataRichTableWrap>
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow>
            {columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => {
            const detail = resolveDetail(row, rowIndex);
            const open = () => {
              if (detail) openReportDetail(detail);
            };
            const onRowClick = (event: ReactMouseEvent<HTMLTableRowElement>) => {
              if (detail && !isInteractiveTarget(event.target)) open();
            };
            const onRowKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>) => {
              if (!detail) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              if (isInteractiveTarget(event.target)) return;
              event.preventDefault();
              open();
            };

            return <TableRow
              key={rowKey ? rowKey(row, rowIndex) : String(rowIndex)}
              tabIndex={detail ? 0 : undefined}
              aria-label={detail ? `${nodeText(row[0]) || `${rowIndex + 1}行目`}の内訳を開く` : undefined}
              aria-haspopup={detail ? "dialog" : undefined}
              onClick={detail ? onRowClick : undefined}
              onKeyDown={detail ? onRowKeyDown : undefined}
              className={cn(
                detail && "cursor-pointer transition-colors hover:bg-[#F4F8F6] focus-visible:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B382D]",
                highlightedRow?.(row, rowIndex) && "bg-[#EAF6F0]/80 ring-1 ring-inset ring-[#8EB4A7]"
              )}
            >
              {row.map((cell, cellIndex) => (
                <TableCell key={String(cellIndex)} data-rich-label={columns[cellIndex]} className="break-words align-top leading-5">
                  {cell}
                </TableCell>
              ))}
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </DataRichTableWrap>
  );
}

function MetricLineChartSvg({
  series,
  labels,
  lowerIsBetter,
  unit,
  decimals,
  annotations,
  width,
  height,
  compact = false,
  className
}: {
  series: ChartSeries[];
  labels: string[];
  lowerIsBetter: boolean;
  unit: string;
  decimals: number;
  annotations: ChartAnnotation[];
  width: number;
  height: number;
  compact?: boolean;
  className: string;
}) {
  const left = compact ? 44 : 46;
  const right = compact ? 64 : 142;
  const top = 20;
  const bottom = compact ? 46 : 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const allValues = series.flatMap((item) => item.values);
  const rawMinimum = allValues.length ? Math.min(...allValues) : 0;
  const rawMaximum = allValues.length ? Math.max(...allValues) : 1;
  const rawSpread = Math.max(1, rawMaximum - rawMinimum);
  const domainPadding = Math.max(rawSpread * 0.12, unit === "%" || unit === "pt" ? 2 : decimals > 0 ? 0.2 : 1);
  const minimum = rawMinimum - domainPadding;
  const maximum = rawMaximum + domainPadding;
  const spread = maximum - minimum;
  const pointCount = Math.max(2, ...series.map((item) => item.values.length));
  const toX = (index: number, count = pointCount) => left + (index / Math.max(1, count - 1)) * plotWidth;
  const toY = (value: number) => {
    const normalized = lowerIsBetter
      ? (value - minimum) / spread
      : (maximum - value) / spread;
    return top + normalized * plotHeight;
  };
  const toPoints = (values: number[]) => values.map((value, index) => {
    const x = toX(index, values.length);
    const y = toY(value);
    return [x.toFixed(1), y.toFixed(1)].join(",");
  }).join(" ");

  const hasEmphasizedSeries = series.some((item) => item.emphasized);
  const endpointLabels = (() => {
    const spaced = series
      .map((item) => ({
        name: item.name,
        color: item.color,
        value: item.values[item.values.length - 1] ?? 0,
        x: toX(Math.max(0, item.values.length - 1), item.values.length),
        actualY: toY(item.values[item.values.length - 1] ?? 0),
        opacity: hasEmphasizedSeries && !item.emphasized ? 0.68 : 1,
        labelY: 0
      }))
      .sort((a, b) => a.actualY - b.actualY);
    spaced.forEach((item, index) => {
      const previous = spaced[index - 1];
      item.labelY = Math.max(item.actualY, previous ? previous.labelY + 17 : top + 4);
    });
    const last = spaced[spaced.length - 1];
    const overflow = last ? Math.max(0, last.labelY - (top + plotHeight - 2)) : 0;
    return spaced.map((item) => ({ ...item, labelY: Math.max(top + 4, item.labelY - overflow) }));
  })();

  return (
      <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={`期間内の指標推移${lowerIsBetter ? "。値が小さいほど良い指標" : ""}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = top + ratio * plotHeight;
          const value = lowerIsBetter
            ? minimum + spread * ratio
            : maximum - spread * ratio;
          return (
            <g key={String(ratio)}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#E6EBE8" strokeWidth="1" />
              <text x={left - 8} y={y + 4} textAnchor="end" fontSize="12" fill="#5D6B66">
                {formatChartValue(value, unit, decimals > 0 || spread < 5 ? 1 : 0)}
              </text>
            </g>
          );
        })}
        {series.map((item) => (
          <polyline
            key={item.name}
            points={toPoints(item.values)}
            fill="none"
            stroke={item.color}
            strokeWidth={item.emphasized ? "3.75" : "2.35"}
            opacity={hasEmphasizedSeries && !item.emphasized ? 0.68 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={item.dashPattern ?? (item.dashed ? "7 6" : undefined)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {annotations.map((annotation) => {
          const index = Math.max(0, Math.min(pointCount - 1, annotation.index));
          const x = toX(index);
          const interactive = Boolean(annotation.detail);
          return (
            <g key={`${annotation.index}-${annotation.label}`}>
              {interactive ? (
                <rect
                  x={x - 14}
                  y={top}
                  width="28"
                  height={plotHeight}
                  rx="4"
                  fill="#EAF6F0"
                  role="button"
                  tabIndex={0}
                  aria-label={`${annotation.label}の内訳を開く`}
                  onClick={() => openReportDetail(annotation.detail!)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    openReportDetail(annotation.detail!);
                  }}
                  className="cursor-pointer opacity-[0.001] outline-none transition-opacity hover:opacity-45 focus:opacity-70"
                />
              ) : null}
              <line pointerEvents={interactive ? "none" : undefined} x1={x} x2={x} y1={top} y2={top + plotHeight} stroke="#9A5B00" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
              <text
                x={x + (x > width * 0.68 ? -5 : 5)}
                y={top + 11}
                textAnchor={x > width * 0.68 ? "end" : "start"}
                fontSize={compact ? "11" : "12"}
                fontWeight="700"
                fill="#8A4B00"
                paintOrder="stroke"
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
                pointerEvents={interactive ? "none" : undefined}
              >
                {annotation.label}
              </text>
            </g>
          );
        })}
        {endpointLabels.map((item) => (
          <g key={`endpoint-${item.name}`} opacity={item.opacity}>
            <line x1={item.x} x2={item.x + 10} y1={item.actualY} y2={item.labelY} stroke={item.color} strokeWidth="1.5" />
            <circle cx={item.x} cy={item.actualY} r="4" fill="white" stroke={item.color} strokeWidth="2.25" />
            <text x={item.x + 13} y={item.labelY + 4} fontSize={compact ? "11" : "12"} fontWeight="700" fill={item.color}>
              {compact ? formatChartValue(item.value, unit, decimals) : `${item.name}  ${formatChartValue(item.value, unit, decimals)}`}
            </text>
          </g>
        ))}
        {labels.map((label, index) => (
          <text
            key={label}
            x={left + (index / Math.max(1, labels.length - 1)) * plotWidth}
            y={height - (compact ? 12 : 8)}
            textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
            fontSize="12"
            fill="#5D6B66"
          >
            {label}
          </text>
        ))}
      </svg>
  );
}

function trendTraceFacts(detailType: ReportTrendDetailType, item: ChartSeries, seriesIndex: number) {
  const model = detailType === "model-visibility"
    ? item.name
    : "全契約モデル集計";
  let prompt = "企業向けGEOツールの候補を比較してください。";
  let answerExcerpt = `RecoraはAI検索での掲載状況と引用元を日次で確認できるサービスとして、${item.name}の対象回答に掲載されました。`;
  let citationUrl: string | undefined;

  if (detailType === "source-coverage" || detailType === "citation-source-retention" || detailType === "citation") {
    prompt = "AI検索対策サービスの比較に使える信頼できる情報源を挙げてください。";
    answerExcerpt = `${item.name}の最新観測に含まれた引用状態を、この系列の集計へ反映しました。`;
  } else if (detailType === "persona-performance") {
    prompt = "マーケティング責任者がGEOツールを選ぶ基準は？";
    answerExcerpt = `マーケ責任者に紐づく固定質問群から、${item.name}の最新日集計へ含まれた代表観測です。`;
  } else if (detailType === "topic-performance") {
    prompt = "競合比較の観点でGEOツールを比較してください。";
    answerExcerpt = `競合比較トピックの固定質問群で、${item.name}の掲載状態が最新日集計へ反映されました。`;
  } else if (detailType === "prompt-performance") {
    prompt = "GEO対策ツールの選定基準は？";
    answerExcerpt = `選択中の同一プロンプトに対する回答で、${item.name}の掲載状態が最新日集計へ反映されました。`;
  } else if (detailType === "sentiment") {
    prompt = "Recoraはどのようなサービスですか？";
    answerExcerpt = `選択期間の有効回答を${item.name}に分類した代表観測です。`;
  } else if (detailType === "claim") {
    prompt = "Recoraの特徴と利用条件を教えてください。";
    answerExcerpt = `${item.name}に該当する表現が確認された代表回答です。`;
  } else if (detailType === "sov") {
    answerExcerpt = `${item.name}は比較候補として掲載され、同一回答内のブランド掲載量に反映されました。`;
  } else if (detailType === "average-position" || detailType === "ranking" || detailType === "ranking-gap") {
    answerExcerpt = `${item.name}は比較回答内で掲載され、この観測の掲載位置と順位へ反映されました。`;
  }

  const facts = [
    { label: "代表観測ID", value: deterministicTraceId("OBS", `TREND-${detailType}`, [item.name, model]) },
    { label: "観測日時", value: `2026-07-06 06:${String(12 + seriesIndex * 9).padStart(2, "0")} JST` },
    { label: "AIモデル", value: model },
    { label: "プロンプト", value: prompt },
    { label: "回答抜粋", value: answerExcerpt }
  ];
  if (citationUrl) facts.push({ label: "引用URL", value: citationUrl });
  return facts;
}

function buildTrendSeriesDetail({
  detailType,
  item,
  series,
  unit,
  deltaUnit,
  decimals,
  observations,
  lowerIsBetter
}: {
  detailType: ReportTrendDetailType;
  item: ChartSeries;
  series: ChartSeries[];
  unit: string;
  deltaUnit?: string;
  decimals: number;
  observations?: string;
  lowerIsBetter: boolean;
}): ReportDetailPayload {
  const start = item.values[0] ?? 0;
  const latest = item.values[item.values.length - 1] ?? 0;
  const delta = latest - start;
  const value = formatChartValue(latest, unit, decimals);
  const seriesIndex = Math.max(0, series.indexOf(item));
  const improved = delta !== 0 && (lowerIsBetter ? delta < 0 : delta > 0);
  const worsened = delta !== 0 && (lowerIsBetter ? delta > 0 : delta < 0);
  const changeFacts = [
    { label: "期間開始", value: formatChartValue(start, unit, decimals) },
    { label: "最新", value },
    { label: "期間差", value: `${delta > 0 ? "+" : ""}${formatChartValue(delta, deltaUnit ?? unit, decimals)}`, tone: worsened ? "amber" as const : improved ? "green" as const : undefined },
    { label: "グラフ全体の有効観測", value: observations ?? "ページ条件に準拠" },
    ...trendTraceFacts(detailType, item, seriesIndex)
  ];
  const comparison = {
    columns: ["系列", "期間開始", "最新", "期間差"],
    rows: series.map((seriesItem) => {
      const seriesStart = seriesItem.values[0] ?? 0;
      const seriesLatest = seriesItem.values[seriesItem.values.length - 1] ?? 0;
      const seriesDelta = seriesLatest - seriesStart;
      return [
        seriesItem.name,
        formatChartValue(seriesStart, unit, decimals),
        formatChartValue(seriesLatest, unit, decimals),
        `${seriesDelta > 0 ? "+" : ""}${formatChartValue(seriesDelta, deltaUnit ?? unit, decimals)}`
      ];
    })
  };

  if (detailType === "ai-visibility") {
    return {
      kicker: "VISIBILITY TREND",
      title: `${item.name}のAI表示率`,
      value,
      summary: "有効回答のうちブランドが掲載された割合の変化です。未掲載と欠測は別状態として扱います。",
      sections: [
        { title: "掲載率の変化", facts: changeFacts },
        { title: "ブランド別の推移比較", table: comparison },
        { title: "状態が変わった観測", facts: [{ label: "確認対象", value: "掲載になった質問 / 掲載されなくなった質問" }, { label: "最小単位", value: "観測日 × AIモデル × プロンプト" }] }
      ]
    };
  }
  if (detailType === "model-visibility") {
    return {
      kicker: "MODEL VISIBILITY TREND",
      title: `${item.name}の掲載判断`,
      value,
      summary: "このAIモデルだけの掲載・未掲載を、同じ質問に対する他モデルの判断と比較します。",
      sections: [
        { title: "このモデルのAI表示率", facts: changeFacts },
        { title: "モデル間の掲載率比較", table: comparison },
        { title: "モデル間で割れた質問", facts: [{ label: "確認対象", value: "このモデルだけ掲載 / このモデルだけ未掲載" }, { label: "欠測", value: "判断不一致とは分けて表示" }] }
      ]
    };
  }
  if (detailType === "sov") {
    return {
      kicker: "AI SHARE TREND",
      title: `${item.name}のAI内シェア`,
      value,
      summary: "同じ回答群に掲載された比較対象ブランド全体に占める、このブランドの存在感の変化です。",
      sections: [
        { title: "AI内シェアの変化", facts: changeFacts },
        { title: "ブランド別AI内シェア", table: comparison },
        { title: "シェアを獲得・喪失した観測", facts: [{ label: "確認対象", value: "ブランド掲載量が増減した同条件の質問" }, { label: "複数ブランド", value: "併記回答は定義済みの掲載量で集計" }] }
      ]
    };
  }
  if (detailType === "average-position") {
    return {
      kicker: "PLACEMENT TREND",
      title: `${item.name}の平均掲載位置`,
      value,
      summary: "順位が付いた掲載回答だけの平均です。未掲載と欠測を平均へ混ぜません。",
      sections: [
        { title: "掲載位置の変化", facts: changeFacts },
        { title: "ブランド別の位置比較", table: comparison },
        { title: "順位分布と除外", facts: [{ label: "確認する分布", value: "1位 / 2位 / 3位 / 4位以下" }, { label: "除外", value: "未掲載・計測失敗・位置抽出不能" }] }
      ]
    };
  }
  if (detailType === "ranking" || detailType === "ranking-gap") {
    const isGap = detailType === "ranking-gap";
    return {
      kicker: isGap ? "LEADER GAP TREND" : "RANKING TREND",
      title: isGap ? "首位とのAI表示率差" : `${item.name}のブランド順位`,
      value,
      summary: isGap ? "各時点の首位ブランドと自社AI表示率の差です。" : "同じブランド集合をAI表示率で並べた順位の変化です。",
      sections: [
        { title: isGap ? "首位差の変化" : "順位の変化", facts: changeFacts },
        { title: isGap ? "比較系列" : "直上・直下を含む順位比較", table: comparison },
        { title: "順位が動いた観測", facts: [{ label: "確認対象", value: "順位が入れ替わった日と同条件の質問" }, { label: "注意", value: "欠測による構成差は実変化と分離" }] }
      ]
    };
  }
  if (detailType === "citation-source-retention") {
    const isRetention = item.name.includes("維持");
    return {
      kicker: isRetention ? "SOURCE RETENTION TREND" : "OWN CITATION TREND",
      title: item.name,
      value,
      summary: isRetention ? "前期間に使われた引用元が今期間にも残った割合です。" : "有効回答のうち自社URLが引用された回答の割合です。",
      sections: [
        { title: isRetention ? "引用元の維持状況" : "自社引用回答の変化", facts: changeFacts },
        { title: isRetention ? "継続・新規・消失ソース" : "引用率系列の比較", table: comparison },
        { title: "引用観測へ遡る", facts: [{ label: "確認対象", value: isRetention ? "継続 / 新規 / 消失したドメイン・URL" : "自社引用が付いた / 外れた回答" }, { label: "観測単位", value: "観測日 × AIモデル × プロンプト × 引用URL" }] }
      ]
    };
  }
  if (detailType === "source-coverage") {
    return {
      kicker: "SOURCE COVERAGE TREND",
      title: `${item.name}の回答カバー`,
      value,
      summary: "この引用元が参照された重複なし回答数の推移です。引用出現回数とは分けます。",
      sections: [
        { title: "回答カバーの変化", facts: changeFacts },
        { title: "同じグラフ内の比較", table: comparison },
        { title: "獲得・消失した回答", facts: [{ label: "確認対象", value: "新たに引用された回答 / 引用されなくなった回答" }, { label: "追加内訳", value: "URL・AIモデル・ペルソナ・トピック" }] }
      ]
    };
  }
  if (detailType === "citation") {
    return {
      kicker: "CITATION ANSWER TREND",
      title: `${item.name}の引用回答数`,
      value,
      summary: "この引用元区分が1件以上引用された、重複なし回答数の変化です。引用出現回数とは分けて表示します。",
      sections: [
        { title: "引用回答数の変化", facts: changeFacts },
        { title: "引用元区分の比較", table: comparison },
        { title: "引用が増減した回答", facts: [{ label: "確認対象", value: "新たに引用された回答 / 引用されなくなった回答" }, { label: "内訳", value: "URL・AIモデル・ペルソナ・トピック" }] }
      ]
    };
  }
  if (detailType === "claim") {
    return {
      kicker: "CLAIM OCCURRENCE TREND",
      title: `${item.name}の出現回答数`,
      value,
      summary: "この主張に該当する表現が確認された、重複なし回答数の変化です。",
      sections: [
        { title: "出現回答数の変化", facts: changeFacts },
        { title: "主張別の推移比較", table: comparison },
        { title: "出現・消失した回答", facts: [{ label: "確認対象", value: "新たに出現した回答 / 出現しなくなった回答" }, { label: "内訳", value: "AIモデル・ペルソナ・トピック・引用元" }] }
      ]
    };
  }
  if (detailType === "sentiment") {
    return {
      kicker: "SENTIMENT TREND",
      title: `${item.name}の感情構成推移`,
      value,
      summary: "選択期間の有効回答を肯定・中立・否定に分類した構成比の変化です。3区分を同じ分母で比較します。",
      sections: [
        { title: `${item.name}の構成比変化`, facts: changeFacts },
        { title: "肯定・中立・否定の比較", table: comparison },
        { title: "分類が変わった回答", facts: [{ label: "確認対象", value: "前日から感情分類が変わった回答" }, { label: "比較単位", value: "同一日 × 同一AIモデル × 同一プロンプト" }] }
      ]
    };
  }

  const scopeLabel = detailType === "persona-performance" ? "ペルソナ" : detailType === "topic-performance" ? "トピック" : "プロンプト";
  return {
    kicker: `${scopeLabel.toUpperCase()} TREND`,
    title: `${item.name}の${scopeLabel}内推移`,
    value,
    summary: `この${scopeLabel}に含まれる固定質問だけで集計した系列です。`,
    sections: [
      { title: `${scopeLabel}内の変化`, facts: changeFacts },
      { title: "同じ条件の系列比較", table: comparison },
      { title: "変化した質問と回答", facts: [{ label: "確認対象", value: "掲載・順位・引用状態が変わった質問" }, { label: "比較単位", value: "同一日 × 同一AIモデル × 同一プロンプト" }] }
    ]
  };
}

export function MetricLineChart({
  series,
  labels = ["期間開始", "中間", "最新"],
  pointLabels,
  lowerIsBetter = false,
  unit = "",
  deltaUnit,
  decimals = 0,
  observations,
  annotations = [],
  detailType
}: {
  series: ChartSeries[];
  labels?: string[];
  pointLabels?: string[];
  lowerIsBetter?: boolean;
  unit?: string;
  deltaUnit?: string;
  decimals?: number;
  observations?: string;
  annotations?: ChartAnnotation[];
  detailType?: ReportTrendDetailType;
}) {
  const hasEmphasizedSeries = series.some((item) => item.emphasized);
  const pointCount = Math.max(0, ...series.map((item) => item.values.length));
  const exactPointLabels = pointLabels?.length === pointCount
    ? pointLabels
    : labels.length === pointCount
      ? labels
      : null;

  const detailForSeries = (item: ChartSeries): ReportDetailPayload | null => {
    if (!detailType) return null;
    return buildTrendSeriesDetail({ detailType, item, series, unit, deltaUnit, decimals, observations, lowerIsBetter });
  };

  return (
    <div className="min-w-0">
      <div className="mb-5 grid border-y border-[#DCE5E1] sm:grid-cols-2 xl:grid-cols-4">
        {series.map((item) => {
          const detail = detailForSeries(item);
          const start = item.values[0] ?? 0;
          const latest = item.values[item.values.length - 1] ?? 0;
          const delta = latest - start;
          const improved = delta !== 0 && (lowerIsBetter ? delta < 0 : delta > 0);
          const worsened = delta !== 0 && (lowerIsBetter ? delta > 0 : delta < 0);
          const content = <>
            <span className="inline-flex min-w-0 items-center gap-2">
              <svg viewBox="0 0 24 6" className="h-2 w-6 shrink-0 overflow-visible" aria-hidden="true">
                <line x1="0" x2="24" y1="3" y2="3" stroke={item.color} strokeWidth={item.emphasized ? "3" : "2"} strokeDasharray={item.dashPattern ?? (item.dashed ? "7 6" : undefined)} />
              </svg>
              <span className="min-w-0 break-words text-[13px] font-semibold text-[#344054]">{item.name}</span>
              {item.emphasized ? <span className="text-[12px] font-bold text-[#075E44]">選択中</span> : null}
            </span>
            <span className="ml-auto text-right">
              <span className="block text-[15px] font-bold tabular-nums text-[#101828]">{formatChartValue(latest, unit, decimals)}</span>
              <span className={cn("block text-[12px] font-bold tabular-nums", improved && "text-[#075E44]", worsened && "text-[#8A4B00]", !improved && !worsened && "text-[#667085]")}>{delta > 0 ? "+" : ""}{formatChartValue(delta, deltaUnit ?? unit, decimals)}</span>
            </span>
          </>;
          const className = "min-h-14 w-full items-center gap-3 border-b border-[#E5EAE8] px-3 py-2 text-left transition-colors sm:border-r xl:border-b-0";
          return detail ? (
            <ReportDetailButton key={item.name} detail={detail} className={cn(className, "hover:bg-[#F4F8F6] hover:text-[#075E44]")} style={{ opacity: hasEmphasizedSeries && !item.emphasized ? 0.68 : 1 }}>
              {content}
            </ReportDetailButton>
          ) : (
            <span key={item.name} className={cn("inline-flex", className)} style={{ opacity: hasEmphasizedSeries && !item.emphasized ? 0.68 : 1 }}>
              {content}
            </span>
          );
        })}
      </div>
      <MetricLineChartSvg
        series={series}
        labels={labels}
        lowerIsBetter={lowerIsBetter}
        unit={unit}
        decimals={decimals}
        annotations={annotations}
        width={320}
        height={250}
        compact
        className="h-auto w-full sm:hidden"
      />
      <MetricLineChartSvg
        series={series}
        labels={labels}
        lowerIsBetter={lowerIsBetter}
        unit={unit}
        decimals={decimals}
        annotations={annotations}
        width={600}
        height={300}
        compact
        className="mx-auto hidden h-auto w-full max-w-[680px] sm:block lg:hidden"
      />
      <MetricLineChartSvg
        series={series}
        labels={labels}
        lowerIsBetter={lowerIsBetter}
        unit={unit}
        decimals={decimals}
        annotations={annotations}
        width={920}
        height={320}
        className="hidden h-auto w-full lg:block"
      />
      {annotations.length ? (
        <section className="mt-5 border-y border-[#DCE5E1] bg-[#F8FAF9]" aria-label="グラフ内の注釈">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EAE8] px-3 py-2.5 sm:px-4">
            <p className="text-[12px] font-bold text-[#344054]">このグラフで確認した変化</p>
            <p className="text-[11px] font-semibold text-[#667085]">因果ではなく、同じ観測期間内の変化です</p>
          </div>
          <div className={cn("grid gap-px bg-[#E5EAE8]", annotations.length > 1 && "sm:grid-cols-2")}>
            {annotations.map((annotation) => {
              const dateLabel = exactPointLabels?.[annotation.index]
                ?? labels[Math.round((annotation.index / Math.max(1, pointCount - 1)) * Math.max(0, labels.length - 1))]
                ?? `時点 ${annotation.index + 1}`;
              const content = <>
                  <span className="shrink-0 rounded-sm bg-[#EAF6F0] px-2 py-1 text-[11px] font-bold tabular-nums text-[#075E44]">{dateLabel}</span>
                  <span className="min-w-0 break-words text-[12px] font-semibold leading-5 text-[#344054]">{annotation.label}</span>
                </>;
              return annotation.detail ? (
                <ReportDetailButton
                  key={`${annotation.index}-${annotation.label}`}
                  detail={annotation.detail}
                  showIcon={false}
                  className="min-h-0 w-full items-start rounded-none bg-white px-3 py-3 hover:bg-[#F4F8F6] sm:px-4"
                >
                  {content}
                </ReportDetailButton>
              ) : (
                <div key={`${annotation.index}-${annotation.label}`} className="flex min-w-0 items-start gap-3 bg-white px-3 py-3 sm:px-4">
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {observations ? (
        <div className="mt-5 overflow-hidden border-y border-[#DCE5E1] bg-white" role="table" aria-label="推移の開始値・最新値・期間差">
          <div className="grid grid-cols-[minmax(88px,1.25fr)_repeat(3,minmax(54px,0.7fr))] border-b border-[#DCE5E1] bg-[#F8FAF9] text-[12px] font-bold leading-5 text-[#667085]" role="row">
            <span className="bg-[#F8FAF9] px-2 py-2" role="columnheader">系列</span>
            <span className="bg-[#F8FAF9] px-2 py-2 text-right" role="columnheader">期間開始</span>
            <span className="bg-[#F8FAF9] px-2 py-2 text-right" role="columnheader">最新</span>
            <span className="bg-[#F8FAF9] px-2 py-2 text-right" role="columnheader">期間差</span>
          </div>
          {series.map((item) => {
            const start = item.values[0] ?? 0;
            const latest = item.values[item.values.length - 1] ?? 0;
            const delta = latest - start;
            const improved = delta !== 0 && (lowerIsBetter ? delta < 0 : delta > 0);
            const worsened = delta !== 0 && (lowerIsBetter ? delta > 0 : delta < 0);
            const detail = detailForSeries(item);
            const cells = <>
                <span className="min-w-0 break-words bg-white px-2 py-2 font-bold text-[#344054]" role="cell">{item.name}</span>
                <span className="bg-white px-2 py-2 text-right font-semibold tabular-nums text-[#475467]" role="cell">{formatChartValue(start, unit, decimals)}</span>
                <span className="bg-white px-2 py-2 text-right font-bold tabular-nums text-[#101828]" role="cell">{formatChartValue(latest, unit, decimals)}</span>
                <span className={cn(
                  "bg-white px-2 py-2 text-right font-bold tabular-nums",
                  improved && "text-[#075E44]",
                  worsened && "text-[#8A4B00]",
                  !improved && !worsened && "text-[#475467]"
                )} role="cell">{delta > 0 ? "+" : ""}{formatChartValue(delta, deltaUnit ?? unit, decimals)}</span>
              </>;
            const rowClass = "!grid min-h-0 w-full grid-cols-[minmax(88px,1.25fr)_repeat(3,minmax(54px,0.7fr))] gap-0 rounded-none border-b border-[#E5EAE8] text-[12px] leading-5 last:border-b-0";
            return detail ? (
              <ReportDetailButton key={`summary-${item.name}`} detail={detail} showIcon={false} className={cn(rowClass, "hover:bg-[#F4F8F6]")} role="row">{cells}</ReportDetailButton>
            ) : (
              <div key={`summary-${item.name}`} className={rowClass} role="row">{cells}</div>
            );
          })}
          <p className="border-t border-[#DCE5E1] bg-[#F8FAF9] px-3 py-2.5 text-[12px] font-bold leading-5 text-[#667085]">有効観測 {observations}</p>
        </div>
      ) : null}
      {exactPointLabels ? (
        <details className="group mt-4 overflow-hidden border-y border-[#DCE5E1] bg-white">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-3 py-2.5 text-left marker:content-none hover:bg-[#F8FAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B382D] sm:px-4">
            <span>
              <span className="block text-[12px] font-bold text-[#344054]">正確な日次値を表示</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#667085]">{series.length}系列 × {pointCount}日分</span>
            </span>
            <span className="text-[16px] font-bold text-[#075E44] transition-transform duration-150 group-open:rotate-45" aria-hidden="true">＋</span>
          </summary>
          <div className="max-h-[620px] overflow-auto border-t border-[#DCE5E1]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[12px]">
              <thead className="sticky top-0 z-10 bg-[#F8FAF9] text-[#667085]">
                <tr>
                  <th scope="col" className="sticky left-0 z-20 border-b border-r border-[#DCE5E1] bg-[#F8FAF9] px-3 py-2.5 font-bold">日付</th>
                  {series.map((item) => <th key={item.name} scope="col" className="border-b border-[#DCE5E1] px-3 py-2.5 text-right font-bold">{item.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {exactPointLabels.map((label, index) => (
                  <tr key={`${label}-${index}`} className="border-b border-[#EDF1EF] last:border-b-0 hover:bg-[#FAFCFB]">
                    <th scope="row" className="sticky left-0 border-r border-[#E5EAE8] bg-white px-3 py-2 font-semibold tabular-nums text-[#475467]">{label}</th>
                    {series.map((item) => (
                      <td key={item.name} className="px-3 py-2 text-right font-semibold tabular-nums text-[#101828]">
                        {typeof item.values[index] === "number" ? formatChartValue(item.values[index], unit, decimals) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      <p className="mt-2 text-[12px] leading-5 text-[#667085]">
        重要な値はグラフだけに隠さず、下の表と観測数でも確認できます。
      </p>
    </div>
  );
}

const matrixDetailCopy: Record<ReportMatrixDetailType, {
  kicker: string;
  valueLabel: string;
  title: (row: string, column: string) => string;
  summary: string;
  comparisonTitle: string;
  observation: string;
}> = {
  "brand-source": {
    kicker: "BRAND × SOURCE",
    valueLabel: "共起・共引用",
    title: (row, column) => `${row} × ${column}`,
    summary: "このブランドと情報源が同じ回答で現れた関係です。共起と引用支持は同じ意味ではありません。",
    comparisonTitle: "同ブランド内の情報源比較",
    observation: "該当回答・引用URL・対応する回答箇所"
  },
  "topic-source": {
    kicker: "TOPIC × SOURCE",
    valueLabel: "回答カバー",
    title: (row, column) => `${row}で使われた${column}`,
    summary: "このトピックの回答で引用元が使われた範囲です。",
    comparisonTitle: "同トピックの引用元比較",
    observation: "引用回答・上位URL・対応する回答箇所・AIモデル"
  },
  "persona-brand": {
    kicker: "PERSONA × BRAND",
    valueLabel: "AI表示率",
    title: (row, column) => `${row}での${column}`,
    summary: "このペルソナ向け質問でブランドが掲載された割合です。",
    comparisonTitle: "同ペルソナのブランド比較",
    observation: "掲載・未掲載質問、強いトピック、先行競合"
  },
  "topic-brand": {
    kicker: "TOPIC × BRAND",
    valueLabel: "AI表示率",
    title: (row, column) => `${row}での${column}`,
    summary: "このトピックに含まれる固定質問でブランドが掲載された割合です。",
    comparisonTitle: "同トピックのブランド比較",
    observation: "該当質問・直接対決・AIモデル・引用元"
  },
  "model-brand": {
    kicker: "MODEL × BRAND",
    valueLabel: "AI表示率",
    title: (row, column) => `${row}での${column}`,
    summary: "このAIモデルだけで集計したブランド掲載率です。",
    comparisonTitle: "同モデル内のブランド比較",
    observation: "モデル固有の掲載・未掲載回答と欠測"
  },
  "persona-stage": {
    kicker: "PROMPT COVERAGE",
    valueLabel: "質問数",
    title: (row, column) => `${row} × ${column}の質問`,
    summary: "このペルソナと購買段階を測る固定質問のカバレッジです。",
    comparisonTitle: "同ペルソナの購買段階カバレッジ",
    observation: "該当プロンプト一覧、対象モデル、0〜1件の不足警告"
  },
  "brand-theme": {
    kicker: "BRAND PERCEPTION",
    valueLabel: "結びつき",
    title: (row, column) => `${row}と「${column}」`,
    summary: "AI回答内でブランドと判断軸が結びついて語られた強さです。",
    comparisonTitle: "同ブランド内の判断軸比較",
    observation: "該当表現・回答抜粋・感情・AIモデル"
  },
  "recommendation-opportunity": {
    kicker: "OPPORTUNITY SCORE",
    valueLabel: "評価",
    title: (row, column) => `${row}：${column}`,
    summary: "改善候補の一評価軸です。効果予測ではなく、観測根拠に基づく優先度判断材料です。",
    comparisonTitle: "この候補の評価軸",
    observation: "採点根拠・影響観測・継続性・非保証事項"
  },
  "source-coverage": {
    kicker: "SOURCE COVERAGE",
    valueLabel: "引用カバー",
    title: (row, column) => `${row} × ${column}`,
    summary: "このAIモデルとペルソナの組み合わせで、対象引用元が使われた範囲です。",
    comparisonTitle: "同モデル内のペルソナ比較",
    observation: "引用URL・回答・プロンプト・対応する回答箇所"
  },
  "persona-model": {
    kicker: "PERSONA × MODEL",
    valueLabel: "AI表示率",
    title: (row, column) => `${row} × ${column}`,
    summary: "このペルソナの固定質問を、選択AIモデルだけで集計した掲載率です。",
    comparisonTitle: "同ペルソナのモデル比較",
    observation: "掲載・未掲載数、質問、競合差、欠測"
  }
};

function matrixTraceFacts(
  detailType: ReportMatrixDetailType,
  row: string,
  column: string,
  rowIndex: number,
  columnIndex: number
) {
  if (detailType === "recommendation-opportunity") {
    const shared = [
      { label: "評価ID", value: deterministicTraceId("AGG", "RECOMMENDATION-OPPORTUNITY", [row, column]) },
      { label: "評価日", value: "2026-07-06" },
      { label: "改善候補", value: row }
    ];
    const axisFacts: Record<string, { label: string; value: string }[]> = {
      "影響範囲": [
        { label: "算定対象", value: "候補に紐づく有効観測" },
        { label: "確認単位", value: "固定質問 × AIモデル × 観測日" },
        { label: "元データ", value: deterministicTraceId("OBSSET", "RECOMMENDATION-IMPACT", [row, column]) }
      ],
      "根拠強度": [
        { label: "算定対象", value: "独立した観測タイプと継続日数" },
        { label: "確認単位", value: "回答・引用URL・公式事実差分" },
        { label: "元データ", value: deterministicTraceId("OBSSET", "RECOMMENDATION-EVIDENCE", [row, column]) }
      ],
      "継続性": [
        { label: "算定対象", value: "同じ判定が連続した日次観測" },
        { label: "確認単位", value: "固定質問 × AIモデル" },
        { label: "元データ", value: deterministicTraceId("SERIES", "RECOMMENDATION-DAILY", [row, column]) }
      ],
      "実行容易性": [
        { label: "算定対象", value: "対象URL・必要素材・実装範囲" },
        { label: "確認単位", value: "候補仕様の入力項目" },
        { label: "注意", value: "観測結果ではなく運用上の評価" }
      ]
    };
    return [...shared, ...(axisFacts[column] ?? [])];
  }

  if (detailType === "persona-stage") {
    return [
      { label: "質問集合ID", value: deterministicTraceId("OBSSET", "PERSONA-STAGE", [row, column], 1, "202607") },
      { label: "ペルソナ", value: row },
      { label: "購買段階", value: column },
      { label: "集計単位", value: "固定質問数（AIモデル横断で重複除外）" },
      { label: "代表質問ID", value: deterministicTraceId("PRM", "PERSONA-STAGE", [row, column]) },
      { label: "確認対象", value: "質問文・対象ペルソナ・購買段階・有効期間" }
    ];
  }

  const models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"];
  const model = detailType === "source-coverage" || detailType === "model-brand"
    ? row
    : detailType === "persona-model"
      ? column
      : models[(rowIndex + columnIndex) % models.length];
  let prompt = `「${row}」について「${column}」の観点で比較してください。`;
  let answerExcerpt = `${row}と${column}が同じ回答内で観測され、この交点の値へ反映されました。`;
  let citationUrl: string | undefined;

  if (detailType === "brand-source" || detailType === "topic-source") {
    prompt = detailType === "brand-source"
      ? `${row}の評価根拠となる情報源を挙げてください。`
      : `${row}について信頼できる情報源を挙げてください。`;
    answerExcerpt = `${row}を説明した回答で${column}が引用されました。`;
    citationUrl = sourceUrl(column);
  } else if (detailType === "persona-brand") {
    prompt = `${row}がGEOツールを選ぶ場合、比較候補と判断基準を教えてください。`;
    answerExcerpt = `${row}向けの比較回答で${column}が候補として掲載されました。`;
  } else if (detailType === "topic-brand") {
    prompt = `${row}を基準にGEOツールを比較してください。`;
    answerExcerpt = `${row}の比較回答で${column}が候補として掲載されました。`;
  } else if (detailType === "model-brand") {
    prompt = "GEOツールを比較し、候補と選定基準を教えてください。";
    answerExcerpt = `${row}の回答で${column}が比較候補として掲載されました。`;
  } else if (detailType === "brand-theme") {
    prompt = `${column}を重視してGEOツールを比較してください。`;
    answerExcerpt = `${row}は「${column}」の文脈で説明されました。`;
  } else if (detailType === "source-coverage") {
    prompt = `${column}がGEOツールを選ぶ際に参照すべき情報源は？`;
    answerExcerpt = `${row}の回答で対象ドメインが引用されました。`;
  } else if (detailType === "persona-model") {
    prompt = `${row}がGEOツールを選ぶ基準は？`;
    answerExcerpt = `${column}の回答でRecoraが比較候補として掲載されました。`;
  }

  const facts = [
    { label: "観測ID", value: deterministicTraceId("OBS", `MATRIX-${detailType}`, [row, column, model]) },
    { label: "観測日時", value: `2026-07-06 06:${String(5 + ((rowIndex * 7 + columnIndex * 3) % 50)).padStart(2, "0")} JST` },
    { label: "AIモデル", value: model },
    { label: "プロンプト", value: prompt },
    { label: "回答抜粋", value: answerExcerpt }
  ];
  if (citationUrl) facts.push({ label: "引用URL", value: citationUrl });
  return facts;
}

function buildMatrixCellDetail(
  detailType: ReportMatrixDetailType,
  row: string,
  column: string,
  value: number,
  suffix: string,
  rowValues: { column: string; value: number }[],
  rowIndex: number,
  columnIndex: number
): ReportDetailPayload {
  const copy = matrixDetailCopy[detailType];
  const rank = [...rowValues].sort((a, b) => b.value - a.value).findIndex((item) => item.column === column) + 1;
  return {
    kicker: copy.kicker,
    title: copy.title(row, column),
    value: `${value}${suffix}`,
    summary: copy.summary,
    sections: [
      { title: copy.valueLabel, facts: [{ label: "対象", value: row }, { label: "比較軸", value: column }, { label: copy.valueLabel, value: `${value}${suffix}`, tone: "green" }, { label: "同じ行での位置", value: `${rank}位 / ${rowValues.length}` }] },
      { title: copy.comparisonTitle, table: { columns: ["比較対象", copy.valueLabel], rows: rowValues.map((item) => [item.column, `${item.value}${suffix}`]) } },
      { title: "この交点から確認するデータ", description: copy.observation, facts: matrixTraceFacts(detailType, row, column, rowIndex, columnIndex) }
    ]
  };
}

export function ResponsiveMatrix({
  rows,
  rowLabels,
  columns,
  values,
  suffix = "%",
  detailType,
  cellDetails,
  mobileCompact = false
}: {
  rows: string[];
  rowLabels?: ReactNode[];
  columns: string[];
  values: number[][];
  suffix?: string;
  detailType?: ReportMatrixDetailType;
  cellDetails?: (row: string, rowIndex: number, column: string, columnIndex: number, value: number) => ReportDetailPayload | null;
  mobileCompact?: boolean;
}) {
  const gridTemplateColumns = "minmax(150px,1.35fr) repeat(" + columns.length + ",minmax(86px,1fr))";
  const detailForCell = (row: string, rowIndex: number, column: string, columnIndex: number): ReportDetailPayload | null => {
    const value = values[rowIndex]?.[columnIndex] ?? 0;
    const rowValues = columns.map((columnLabel, index) => ({ column: columnLabel, value: values[rowIndex]?.[index] ?? 0 }));
    if (cellDetails) return cellDetails(row, rowIndex, column, columnIndex, value);
    if (!detailType) return null;
    return buildMatrixCellDetail(detailType, row, column, value, suffix, rowValues, rowIndex, columnIndex);
  };

  return (
    <div className="min-w-0">
      <div className="hidden min-w-0 gap-px overflow-hidden border border-[#DDE5E1] bg-[#DDE5E1] md:grid" style={{ gridTemplateColumns }}>
        <div className="bg-[#F8FAF9] px-3 py-3 text-xs font-bold text-[#667085]">比較軸</div>
        {columns.map((column) => (
          <div key={column} className="break-words bg-[#F8FAF9] px-2 py-3 text-center text-xs font-bold leading-5 text-[#475467]">
            {column}
          </div>
        ))}
        {rows.map((row, rowIndex) => (
          <div key={row} className="contents">
            <div className="break-words bg-white px-3 py-3 text-xs font-bold leading-5 text-[#344054]">{rowLabels?.[rowIndex] ?? row}</div>
            {columns.map((column, columnIndex) => {
              const value = values[rowIndex]?.[columnIndex] ?? 0;
              const detail = detailForCell(row, rowIndex, column, columnIndex);
              const rowMaximum = Math.max(...(values[rowIndex] ?? [0]));
              const className = cn("!flex min-h-12 w-full items-center justify-center rounded-none px-2 py-3 text-[13px] font-bold tabular-nums", detail && "transition hover:ring-2 hover:ring-inset hover:ring-[#0B382D]", value === rowMaximum && "ring-2 ring-inset ring-[#0B382D]", matrixTone(value));
              const content = <>{value}{suffix}{value === rowMaximum ? <span className="sr-only">・行内最高</span> : null}</>;
              return detail ? (
                <ReportDetailButton
                  key={row + column}
                  detail={detail}
                  showIcon={false}
                  className={className}
                  label={`${row}、${column}、${value}${suffix}の内訳を開く`}
                >
                  {content}
                </ReportDetailButton>
              ) : (
                <div key={row + column} className={className}>{content}</div>
              );
            })}
          </div>
        ))}
      </div>
      <div className={cn("md:hidden", mobileCompact ? "space-y-2" : "space-y-3")}>
        {rows.map((row, rowIndex) => (
          <section key={row} className="border border-[#DFE6E2] bg-white p-3">
            <h3 className="text-sm font-bold text-[#101828]">{rowLabels?.[rowIndex] ?? row}</h3>
            <div className={cn("mt-3 grid gap-2", mobileCompact ? "grid-cols-3" : "grid-cols-1")}>
              {columns.map((column, columnIndex) => {
                const value = values[rowIndex]?.[columnIndex] ?? 0;
                const detail = detailForCell(row, rowIndex, column, columnIndex);
                const className = cn("!block min-h-0 w-full min-w-0 rounded-md px-3 py-2.5", detail && "transition hover:ring-2 hover:ring-inset hover:ring-[#0B382D]", matrixTone(value));
                const content = <><p className="break-words text-[12px] font-semibold leading-5">{column}</p><p className="mt-1 text-sm font-bold tabular-nums">{value}{suffix}</p></>;
                return detail ? (
                  <ReportDetailButton key={column} detail={detail} showIcon={false} className={className} label={`${row}、${column}、${value}${suffix}の内訳を開く`}>
                    {content}
                  </ReportDetailButton>
                ) : (
                  <div key={column} className={className}>{content}</div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-semibold text-[#667085]" aria-label="色の範囲">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-[#EDF7F3]" />0–24</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-[#D8EEE5]" />25–44</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-[#BFE2D5]" />45–64</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-[#0B6B57]" />65以上</span>
      </div>
    </div>
  );
}

export function RadarComparison({
  title,
  selfValues,
  rivalValues,
  labels,
  selfName = "Recora",
  rivalName,
  observations,
  axisLabel,
  detailType
}: {
  title: string;
  selfValues: number[];
  rivalValues: number[];
  labels: string[];
  selfName?: string;
  rivalName: string;
  observations: number;
  axisLabel: string;
  detailType: "topic-competitive-performance" | "buyer-axis-matchup";
}) {
  const width = 520;
  const height = 400;
  const centerX = 260;
  const centerY = 190;
  const radius = 125;
  const count = labels.length;
  const pointFor = (index: number, value: number, extra = 0) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const distance = radius * (value / 100) + extra;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance
    };
  };
  const polygon = (values: number[]) => values.map((value, index) => {
    const point = pointFor(index, value);
    return [point.x.toFixed(1), point.y.toFixed(1)].join(",");
  }).join(" ");
  const mobileCenterX = 160;
  const mobileCenterY = 130;
  const mobileRadius = 92;
  const mobilePointFor = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const distance = mobileRadius * (value / 100);
    return {
      x: mobileCenterX + Math.cos(angle) * distance,
      y: mobileCenterY + Math.sin(angle) * distance
    };
  };
  const mobilePolygon = (values: number[]) => values.map((value, index) => {
    const point = mobilePointFor(index, value);
    return [point.x.toFixed(1), point.y.toFixed(1)].join(",");
  }).join(" ");
  const differences = labels.map((label, index) => ({ label, value: (selfValues[index] ?? 0) - (rivalValues[index] ?? 0) }));
  const selfWins = differences.filter((item) => item.value > 0).length;
  const rivalWins = differences.filter((item) => item.value < 0).length;
  const widestGap = [...differences].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  return (
    <section className="border-y border-[#D5E1DB] bg-white px-1 py-5 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#101828]">{title}</h3>
          <p className="mt-1 text-[13px] leading-6 text-[#667085]">有効比較 {observations}件・同一質問と同一モデルの回答のみ</p>
          <p className="mt-2 text-[13px] font-semibold leading-6 text-[#344054]">
            {selfName}優位 {selfWins}軸 / {rivalName}優位 {rivalWins}軸{widestGap ? ` / 最大差 ${Math.abs(widestGap.value)}pt（${widestGap.label}）` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#475467]">
          <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[#0B6B57]" />{selfName}</span>
          <span className="inline-flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed border-[#344054]" />{rivalName}</span>
        </div>
      </div>
      <svg viewBox="0 0 320 270" className="hidden" role="img" aria-label={`${selfName}と${rivalName}の${axisLabel}別AI表示率比較。軸名と数値は直後の表に掲載`}>
        {[25, 50, 75, 100].map((level) => (
          <polygon key={String(level)} points={mobilePolygon(Array(count).fill(level))} fill="none" stroke="#D6DEDA" strokeWidth="1" />
        ))}
        {labels.map((label, index) => {
          const axis = mobilePointFor(index, 100);
          return <line key={label} x1={mobileCenterX} y1={mobileCenterY} x2={axis.x} y2={axis.y} stroke="#D6DEDA" strokeWidth="1" />;
        })}
        <polygon points={mobilePolygon(rivalValues)} fill="rgba(224,122,95,0.18)" stroke="#D7664C" strokeWidth="2.5" />
        <polygon points={mobilePolygon(selfValues)} fill="rgba(11,107,87,0.20)" stroke="#0B6B57" strokeWidth="2.5" />
      </svg>
      <p className="mb-3 text-[11px] leading-5 text-[#667085] sm:hidden">軸名・各値・差分は、下の比較表ですべて確認できます。</p>
      <svg viewBox={"0 0 " + width + " " + height} className="mx-auto mt-2 hidden h-auto w-full max-w-[560px] sm:block" role="img" aria-label={`${selfName}と${rivalName}の${axisLabel}別AI表示率比較`}>
        {[25, 50, 75, 100].map((level) => (
          <polygon
            key={String(level)}
            points={polygon(Array(count).fill(level))}
            fill="none"
            stroke="#D6DEDA"
            strokeWidth="1"
          />
        ))}
        {labels.map((label, index) => {
          const axis = pointFor(index, 100);
          const text = pointFor(index, 100, 42);
          return (
            <g key={label}>
              <line x1={centerX} y1={centerY} x2={axis.x} y2={axis.y} stroke="#D6DEDA" strokeWidth="1" />
              <text x={text.x} y={text.y} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="600" fill="#475467">
                {label}
              </text>
            </g>
          );
        })}
        <polygon points={polygon(rivalValues)} fill="rgba(52,64,84,0.08)" stroke="#344054" strokeWidth="2.25" strokeDasharray="7 5" />
        <polygon points={polygon(selfValues)} fill="rgba(11,107,87,0.10)" stroke="#0B6B57" strokeWidth="2.75" />
        {rivalValues.map((value, index) => { const point = pointFor(index, value); return <circle key={`rival-${labels[index]}`} cx={point.x} cy={point.y} r="3" fill="white" stroke="#344054" strokeWidth="1.75" />; })}
        {selfValues.map((value, index) => { const point = pointFor(index, value); return <circle key={`self-${labels[index]}`} cx={point.x} cy={point.y} r="3.5" fill="white" stroke="#0B6B57" strokeWidth="2" />; })}
      </svg>
      <ReportDataTable
        detailType={detailType}
        columns={[axisLabel, selfName, rivalName, "差"]}
        rows={labels.map((label, index) => {
          const self = selfValues[index] ?? 0;
          const rival = rivalValues[index] ?? 0;
          const difference = self - rival;
          return [
            <span key="label" className="font-bold">{label}</span>,
            <span key="self" className="font-bold tabular-nums text-[#075E44]">{self}%</span>,
            <span key="rival" className="font-bold tabular-nums">{rival}%</span>,
            <DataRichBadge key="diff" tone={difference >= 0 ? "green" : "amber"}>{difference > 0 ? "+" : ""}{difference}pt</DataRichBadge>
          ];
        })}
      />
    </section>
  );
}

function buildOutcomeFunnelTrace(
  title: string,
  stage: { label: string; value: number; total: number; note?: string },
  index: number
): ReportDetailSection {
  const citationFlow = title.includes("情報");
  const models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"];
  const rows = [0, 1].map((offset) => {
    const model = models[(index + offset) % models.length];
    const observationDate = `2026070${6 - offset}`;
    const observationId = deterministicTraceId(
      "OBS",
      "OUTCOME-FUNNEL",
      [title, stage.label, stage.note ?? "", model],
      offset + 1,
      observationDate
    );
    const observedAt = `2026-07-0${6 - offset} 08:${String(4 + index * 3 + offset * 5).padStart(2, "0")}`;
    const promptId = deterministicTraceId("PRM", "OUTCOME-FUNNEL", [title, stage.label, model], offset + 1);
    const state = citationFlow
      ? stage.label === "有効回答"
        ? "回答取得成功"
        : stage.label === "自社ページ取得"
          ? "自社ページを取得"
          : stage.label === "自社ページ引用"
            ? "自社URLを引用"
            : "引用先本文に自社名あり"
      : stage.label === "有効回答"
        ? "回答取得成功"
        : stage.label === "自社掲載"
          ? "Recora掲載あり"
          : stage.label === "上位3位以内"
            ? "Recora 2位"
            : "Recora先頭掲載";
    return citationFlow
      ? [observationId, observedAt, model, promptId, state, stage.label === "有効回答" ? "—" : offset === 0 ? "https://recora.jp/guide/geo" : "https://recora.jp/products/ai-visibility"]
      : [observationId, observedAt, model, promptId, state];
  });
  return {
    title: "代表観測まで遡る",
    description: "この段階に含まれる回答の例です。集計値は同じ判定条件を満たす全観測から算出します。",
    table: {
      columns: citationFlow
        ? ["観測ID", "観測日時", "AIモデル", "固定質問", "判定", "引用URL"]
        : ["観測ID", "観測日時", "AIモデル", "固定質問", "判定"],
      rows
    }
  };
}

export function OutcomeFunnel({
  title,
  stages,
  interactive = true
}: {
  title: string;
  stages: { label: string; value: number; total: number; note?: string }[];
  interactive?: boolean;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-lg font-semibold text-[#101828]">{title}</h3>
      <div className="mt-4 space-y-3">
        {stages.map((stage, index) => {
          const rate = Math.round((stage.value / Math.max(1, stage.total)) * 100);
          const previous = stages[index - 1];
          const continuationRate = previous ? Math.round((stage.value / Math.max(1, previous.value)) * 100) : null;
          const changeFromPrevious = previous ? stage.value - previous.value : null;
          const content = (
            <div className="min-w-0 flex-1">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[13px] font-semibold leading-5 text-[#475467]">{stage.label}</p>
                <p className="shrink-0 text-sm font-bold tabular-nums text-[#101828]">{stage.value.toLocaleString()}件 <span className="ml-1 text-[12px] text-[#667085]">{rate}%</span></p>
              </div>
              <div className="mt-1.5 h-7 overflow-hidden bg-[#EEF2F0]">
                <div
                  className="h-full bg-[#0B6B57]"
                  style={{ width: rate + "%" }}
                />
              </div>
              {previous ? <p className="mt-1 text-[12px] font-semibold leading-5 tabular-nums text-[#5D6B66]">前段から {changeFromPrevious && changeFromPrevious > 0 ? "+" : ""}{changeFromPrevious?.toLocaleString()}件 / 継続率 {continuationRate}%</p> : null}
              {stage.note ? <p className="mt-1 text-[12px] leading-5 text-[#667085]">{stage.note}</p> : null}
            </div>
          );

          if (!interactive) {
            return <div key={stage.label} className="w-full rounded-md px-2 py-2">{content}</div>;
          }

          return <ReportDetailButton key={stage.label} detail={{
            kicker: "FUNNEL DETAIL",
            title: stage.label,
            value: `${stage.value.toLocaleString()}件`,
            summary: stage.note ?? `${rate}%の回答がこの状態に該当します。`,
            sections: [
              { title: "この段階の値", facts: [{ label: "件数", value: `${stage.value.toLocaleString()}件` }, { label: "基準件数", value: `${stage.total.toLocaleString()}件` }, { label: "割合", value: `${rate}%`, tone: "green" }, ...(previous ? [{ label: "前段階からの差", value: `${(stage.value - previous.value).toLocaleString()}件`, tone: "amber" as const }] : [])] },
              { title: "ファネル全体", table: { columns: ["段階", "件数", "割合"], rows: stages.map((item) => [item.label, `${item.value.toLocaleString()}件`, `${Math.round((item.value / Math.max(1, item.total)) * 100)}%`]) } },
              buildOutcomeFunnelTrace(title, stage, index)
            ]
          }} className="w-full rounded-md px-2 py-2 transition hover:bg-[#F4F8F6]">{content}</ReportDetailButton>;
        })}
      </div>
    </section>
  );
}

export function MentionCitationQuadrant({
  interactive = true,
  models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"]
}: {
  interactive?: boolean;
  models?: string[];
} = {}) {
  const cells = [
    { label: "ブランド掲載＋自社引用", value: "26%", tone: "bg-[#0B6B57] text-white" },
    { label: "ブランド掲載のみ", value: "31%", tone: "bg-[#BFE2D5] text-[#0B4B3E]" },
    { label: "自社引用のみ", value: "5%", tone: "bg-[#FFF0D5] text-[#8A4B08]" },
    { label: "どちらもなし", value: "38%", tone: "bg-[#F2F4F7] text-[#475467]" }
  ];
  const modelShares = [
    [29, 24, 28, 23],
    [31, 35, 29, 32],
    [6, 4, 7, 5],
    [34, 37, 36, 40]
  ];
  const audienceRows = [
    [["導入担当", "導入・運用", "34%"], ["決裁者", "競合比較", "28%"], ["マーケ責任者", "引用元", "25%"]],
    [["決裁者", "競合比較", "36%"], ["導入担当", "料金", "32%"], ["編集担当", "ブランド印象", "27%"]],
    [["マーケ責任者", "引用元", "9%"], ["編集担当", "導入・運用", "6%"], ["代理店担当", "競合比較", "4%"]],
    [["代理店担当", "料金", "44%"], ["編集担当", "ブランド印象", "41%"], ["決裁者", "競合比較", "35%"]]
  ];
  const questionRows = [
    [["導入時に比較すべきAI検索可視化ツールは？", "導入担当", "導入・運用"], ["AI検索で自社が引用されるには何が必要？", "マーケ責任者", "引用元"], ["経営会議で確認すべきAI検索指標は？", "決裁者", "競合比較"]],
    [["AI検索対策ツールを比較する際の判断基準は？", "決裁者", "競合比較"], ["AI検索可視化サービスの費用相場は？", "導入担当", "料金"], ["AI検索で評価されるブランドの特徴は？", "編集担当", "ブランド印象"]],
    [["AI回答が参照する信頼性の高い情報源は？", "マーケ責任者", "引用元"], ["AI検索向けコンテンツの設計方法は？", "編集担当", "導入・運用"], ["競合のAI検索対策事例は？", "代理店担当", "競合比較"]],
    [["AI検索可視化ツールの費用対効果は？", "代理店担当", "料金"], ["AIに認識されやすい企業の共通点は？", "編集担当", "ブランド印象"], ["AI検索対策の優先順位は？", "決裁者", "競合比較"]]
  ];

  const renderCell = (cell: (typeof cells)[number], index: number) => {
    const content = (
      <>
        <p className="text-[30px] font-semibold leading-none tabular-nums">{cell.value}</p>
        <p className="mt-2 break-words text-[12px] font-bold leading-5">{cell.label}</p>
      </>
    );
    const className = cn("!block min-h-0 w-full min-w-0 rounded-none px-3 py-4", cell.tone);
    const baseShare = Number.parseInt(cell.value, 10);

    if (!interactive) return <div key={cell.label} className={className}>{content}</div>;

    return <ReportDetailButton key={cell.label} detail={{
      kicker: "CROSS DETAIL",
      title: cell.label,
      value: cell.value,
      summary: "この区分が、どのAIモデル・ペルソナ・トピック・質問で多いかを確認します。",
      sections: [
        { title: "この区分", facts: [{ label: "構成比", value: cell.value, tone: cell.label === "どちらもなし" ? "amber" : "green" }, { label: "推計回答数", value: Math.round(14976 * baseShare / 100).toLocaleString() + "件" }, { label: "掲載判定", value: cell.label.includes("ブランド掲載") ? "あり" : "なし" }, { label: "自社引用判定", value: cell.label.includes("自社引用") ? "あり" : "なし" }] },
        {
          title: "AIモデル別の内訳",
          description: "各AIモデルの回答内で、この区分が占める割合です。",
          facts: models.map((model, modelIndex) => {
            const share = modelShares[index][modelIndex % modelShares[index].length];
            const difference = share - baseShare;
            return { label: model, value: share + "%（平均差 " + (difference > 0 ? "+" : "") + difference + "pt）" };
          })
        },
        {
          title: "多いペルソナ・トピック",
          description: "この区分が多い組み合わせを上位から確認します。",
          facts: audienceRows[index].map((row) => ({ label: row[0] + " × " + row[1], value: row[2] }))
        },
        {
          title: "該当する質問",
          description: "この区分に該当した質問の例です。質問単位の全期間分析はプロンプトページで確認します。",
          facts: questionRows[index].map((row, rowIndex) => ({
            label: row[0],
            value: [models[rowIndex % Math.max(1, models.length)] ?? "—", row[1], row[2]].join("・")
          }))
        },
        { title: "4区分の比較", facts: cells.map((item) => ({ label: item.label, value: item.value })) }
      ]
    }} showIcon={false} className={cn(className, "transition hover:ring-2 hover:ring-inset hover:ring-[#0B382D]")}>{content}</ReportDetailButton>;
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-[#101828]">ブランド掲載 × 自社引用</h3>
      <p className="mt-1 text-[13px] leading-6 text-[#667085]">引用はブランド掲載の下位工程とは限らないため、2×2で分けます。</p>
      <div className="mt-4 grid grid-cols-[96px_repeat(2,minmax(0,1fr))] gap-1" role="table" aria-label="ブランド掲載と自社引用の交差集計">
        <span aria-hidden="true" />
        <span className="px-2 py-2 text-center text-[12px] font-bold text-[#475467]" role="columnheader">公式サイト引用あり</span>
        <span className="px-2 py-2 text-center text-[12px] font-bold text-[#475467]" role="columnheader">公式サイト引用なし</span>
        <span className="flex items-center text-[12px] font-bold leading-5 text-[#475467]" role="rowheader">ブランド掲載あり</span>
        {renderCell(cells[0], 0)}
        {renderCell(cells[1], 1)}
        <span className="flex items-center text-[12px] font-bold leading-5 text-[#475467]" role="rowheader">ブランド掲載なし</span>
        {renderCell(cells[2], 2)}
        {renderCell(cells[3], 3)}
      </div>
    </section>
  );
}
function buildSourceConcentrationDetail(
  row: { label: string; value: number; helper: string; tone?: "green" | "amber" | "red" },
  rows: { label: string; value: number; helper: string; tone?: "green" | "amber" | "red" }[]
): ReportDetailPayload {
  const comparison = { columns: ["集中指標", "値", "意味"], rows: rows.map((item) => [item.label, `${item.value}%`, item.helper]) };
  const trace: ReportDetailSection = row.label === "Top1シェア"
    ? {
        title: "最大引用元の集計根拠",
        description: "この指標データには引用元名・URLが含まれないため、特定ドメインを推測せず集計レコードへ遡ります。",
        table: {
          columns: ["集計レコードID", "基準日", "指標", "対象", "値"],
          rows: [
            [deterministicTraceId("AGG", "SOURCE-CONCENTRATION", [row.label, "TOP1-SHARE"]), "2026-07-06", row.label, "引用元ランキング1位（現在の表示条件）", `${row.value}%`],
            [deterministicTraceId("OBSSET", "SOURCE-CONCENTRATION", [row.label, "COVERED-ANSWERS"]), "表示期間全体", "回答カバー", "1位ドメインに該当した回答集合", row.helper]
          ]
        }
      }
    : row.label === "Top3シェア"
      ? {
          title: "上位3引用元の集計根拠",
          description: "この指標データにないドメイン名やURLは補完せず、順位別の集計レコードを表示します。",
          table: {
            columns: ["集計レコードID", "順位", "対象", "確認先"],
            rows: [1, 2, 3].map((rank) => [
              deterministicTraceId("OBSSET", "SOURCE-CONCENTRATION", [row.label, `RANK-${rank}`]),
              `${rank}位`,
              `引用元ランキング${rank}位（現在の表示条件）`,
              "引用元ランキングのドメイン・URL内訳"
            ])
          }
        }
      : {
          title: row.label.includes("モデル") ? "モデル依存の集計根拠" : "ペルソナ依存の集計根拠",
          description: "依存先の名称や引用URLを固定せず、この指標に対応する集計集合へ遡ります。",
          table: {
            columns: ["集計レコードID", "指標", "該当比率", "確認する内訳"],
            rows: [
              [
                deterministicTraceId("AGG", "SOURCE-CONCENTRATION", [row.label, "DEPENDENCY"]),
                row.label,
                `${row.value}%`,
                row.label.includes("モデル") ? "依存ドメインとAIモデル別回答数" : "依存ドメインとペルソナ別回答数"
              ],
              [
                deterministicTraceId("OBSSET", "SOURCE-CONCENTRATION", [row.label, "SOURCE-SET"]),
                "対象引用元集合",
                row.helper,
                "引用元ランキングのドメイン・URL内訳"
              ]
            ]
          }
        };
  if (row.label === "Top1シェア") {
    return {
      kicker: "SOURCE CONCENTRATION",
      title: "最大引用元への集中",
      value: `${row.value}%`,
      summary: row.helper,
      sections: [
        { title: "最大ドメインの占有", facts: [{ label: "構成比", value: `${row.value}%`, tone: row.tone }, { label: "確認する差", value: "最大ドメイン名・2位との差・回答カバー" }] },
        { title: "集中指標の比較", table: comparison },
        trace
      ]
    };
  }
  if (row.label === "Top3シェア") {
    return {
      kicker: "SOURCE CONCENTRATION",
      title: "上位3引用元への集中",
      value: `${row.value}%`,
      summary: row.helper,
      sections: [
        { title: "上位3ドメインの合計", facts: [{ label: "構成比", value: `${row.value}%`, tone: row.tone }, { label: "必要な内訳", value: "1位・2位・3位それぞれの回答カバー" }] },
        { title: "集中指標の比較", table: comparison },
        trace
      ]
    };
  }
  const modelDependency = row.label.includes("モデル");
  return {
    kicker: modelDependency ? "MODEL DEPENDENCY" : "PERSONA DEPENDENCY",
    title: row.label,
    value: `${row.value}%`,
    summary: row.helper,
    sections: [
      { title: modelDependency ? "特定AIモデルだけの引用元" : "特定ペルソナに偏る引用元", facts: [{ label: "該当比率", value: `${row.value}%`, tone: row.tone }, { label: "確認する内訳", value: modelDependency ? "依存ドメインとAIモデル別回答数" : "依存ドメインとペルソナ別回答数" }] },
      { title: "集中指標の比較", table: comparison },
      trace
    ]
  };
}

export function MetricSegments({
  rows,
  detailType
}: {
  rows: { label: string; value: number; helper: string; tone?: "green" | "amber" | "red" }[];
  detailType?: ReportSegmentDetailType;
}) {
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const detail = detailType === "source-concentration" ? buildSourceConcentrationDetail(row, rows) : null;
        const content = <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-[#344054]">{row.label}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#667085]">{row.helper}</p>
            </div>
            <DataRichBadge tone={row.tone ?? "default"}>{row.value}%</DataRichBadge>
          </div>
          <div className="mt-2">
            <DataRichInlineBar value={row.value} label={row.value + "%"} className={row.tone === "amber" ? "[&_div_div]:bg-[#B7791F]" : row.tone === "red" ? "[&_div_div]:bg-[#B42318]" : undefined} />
          </div>
        </div>;
        return detail ? (
          <ReportDetailButton key={row.label} detail={detail} className="w-full rounded-md px-2 py-2 transition hover:bg-[#F4F8F6]">{content}</ReportDetailButton>
        ) : (
          <div key={row.label} className="w-full px-2 py-2">{content}</div>
        );
      })}
    </div>
  );
}

export function DetailLink({
  href,
  title,
  description,
  preview
}: {
  href: string;
  title: string;
  description: string;
  preview?: {
    kicker?: string;
    facts: [string, string][];
    note?: string;
  };
}) {
  const content = <>
    <span className="min-w-0 flex-1 text-left">
      <span className="block break-words text-sm font-bold text-[#101828]">{title}</span>
      <span className="mt-1 block break-words text-xs leading-5 text-[#667085]">{description}</span>
    </span>
  </>;
  const className = "group flex min-h-[86px] w-full min-w-0 items-center justify-between gap-4 rounded-none border border-[#DFE6E2] bg-[#FBFCFB] px-4 py-3 transition hover:border-[#8EB4A7] hover:bg-white";

  if (!preview) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <ReportDetailButton
      detail={{
        kicker: preview.kicker ?? "ANALYSIS PREVIEW",
        title,
        summary: description,
        sections: [
          {
            title: "この分析で確認できる内容",
            facts: preview.facts.map(([label, value]) => ({ label, value }))
          },
          ...(preview.note ? [{ title: "詳細ページを使う理由", facts: [{ label: "全画面で確認", value: preview.note }] }] : [])
        ],
        detailHref: href,
        detailLabel: "全項目を詳細ページで確認"
      }}
      className={className}
      label={`${title}の概要を右パネルで開く`}
    >
      {content}
    </ReportDetailButton>
  );
}

export function SourceLink({
  href,
  label,
  external = false
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#075E44] underline underline-offset-2 [overflow-wrap:anywhere] [word-break:normal]">
        {label}
      </a>
    );
  }

  return <Link href={href} className="font-semibold text-[#075E44] underline underline-offset-2 [overflow-wrap:anywhere] [word-break:normal]">{label}</Link>;
}

export function PanelNote({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-[#0B6B57] bg-[#F4F8F6] px-4 py-3 text-xs font-semibold leading-6 text-[#475467]">
      {children}
    </div>
  );
}

function matrixTone(value: number) {
  if (value >= 65) return "bg-[#0B6B57] text-white";
  if (value >= 45) return "bg-[#BFE2D5] text-[#0B4B3E]";
  if (value >= 25) return "bg-[#EDF7F3] text-[#475467]";
  return "bg-[#F5F6F7] text-[#667085]";
}

function buildMetricGridDetail(
  detailType: ReportMetricGridDetailType,
  item: { label: string; value: string; note: string; tone?: "green" | "amber" | "red" },
  items: { label: string; value: string; note: string; tone?: "green" | "amber" | "red" }[]
): ReportDetailPayload {
  const comparison = { columns: ["区分", "値", "補足"], rows: items.map((candidate) => [candidate.label, candidate.value, candidate.note]) };
  if (detailType === "answer-role") {
    return {
      kicker: "BRAND ROLE IN ANSWER",
      title: item.label,
      value: item.value,
      summary: item.note,
      sections: [
        { title: "回答内でのブランド役割", facts: [{ label: "ブランド", value: item.label }, { label: "判定", value: item.value, tone: item.tone }, { label: "回答内の位置づけ", value: item.note }] },
        { title: "同じ回答内のブランド比較", table: comparison },
        { title: "判定した回答まで遡る", table: { columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "役割 / 位置"], rows: [
          [deterministicTraceId("OBS", "METRIC-GRID-ANSWER-ROLE", [item.label, item.value, "GPT"], 1, "20260706"), "2026-07-06 08:06", "GPT", deterministicTraceId("PRM", "ANSWER-ROLE", [item.label, "GPT"]), `${item.value} / ${item.note}`],
          [deterministicTraceId("OBS", "METRIC-GRID-ANSWER-ROLE", [item.label, item.value, "Gemini"], 2, "20260705"), "2026-07-05 08:09", "Gemini", deterministicTraceId("PRM", "ANSWER-ROLE", [item.label, "Gemini"]), `${item.value} / ${item.note}`]
        ] } }
      ]
    };
  }
  if (detailType === "observation-status") {
    const missing = item.label.includes("失敗") || item.label.includes("欠測");
    return {
      kicker: "OBSERVATION STATUS",
      title: item.label,
      value: item.value,
      summary: item.note,
      sections: [
        { title: "この観測状態", facts: [{ label: "件数", value: item.value, tone: item.tone }, { label: "状態", value: item.note }, { label: "指標の分母", value: missing ? "除外し、欠測として併記" : "有効観測として採用" }] },
        { title: "全観測状態の構成", table: comparison },
        { title: "対象レコードまで遡る", table: { columns: ["観測ID", "観測日時", "AIモデル", "固定質問", "状態詳細"], rows: [
          [deterministicTraceId("OBS", "METRIC-GRID-OBSERVATION-STATUS", [item.label, item.value, missing ? "Gemini" : "GPT"], 1, "20260706"), "2026-07-06 08:04", missing ? "Gemini" : "GPT", deterministicTraceId("PRM", "OBSERVATION-STATUS", [item.label, "PRIMARY"]), missing ? "回答取得失敗 / タイムアウト" : item.note],
          [deterministicTraceId("OBS", "METRIC-GRID-OBSERVATION-STATUS", [item.label, item.value, missing ? "Perplexity" : "Google AI Mode"], 2, "20260705"), "2026-07-05 08:12", missing ? "Perplexity" : "Google AI Mode", deterministicTraceId("PRM", "OBSERVATION-STATUS", [item.label, "SECONDARY"]), missing ? "応答形式不正 / 再計測対象" : item.note]
        ] } }
      ]
    };
  }
  const insufficient = item.label.includes("不足");
  const disagreement = item.label.includes("分かれ");
  return {
    kicker: "STABILITY DETAIL",
    title: item.label,
    value: item.value,
    summary: item.note,
    sections: [
      { title: insufficient ? "比較対象不足" : disagreement ? "モデル間の判定不一致" : "一致・維持した観測", facts: [{ label: "構成比", value: item.value, tone: item.tone }, { label: "判定", value: item.note }] },
      { title: "安定性指標の構成", table: comparison },
      { title: "状態遷移へ遡る", description: "欠測は判定不一致に含めず、比較可能な観測または日次ペアだけを表示します。", table: { columns: ["照合ID", "比較日", "AIモデル", "固定質問", "照合結果"], rows: [
        [deterministicTraceId("PAIR", "METRIC-GRID-STABILITY", [item.label, item.value, "GPT-GEMINI"]), "2026-07-05 → 07-06", insufficient ? "比較対象不足" : "GPT / Gemini", deterministicTraceId("PRM", "STABILITY-GRID", [item.label, "PRIMARY"]), insufficient ? "Gemini欠測" : disagreement ? "GPT掲載 / Gemini未掲載" : "掲載状態を維持"],
        [deterministicTraceId("PAIR", "METRIC-GRID-STABILITY", [item.label, item.value, "PERPLEXITY-GOOGLE-AI-MODE"], 2), "2026-07-05 → 07-06", insufficient ? "1モデルのみ有効" : "Perplexity / Google AI Mode", deterministicTraceId("PRM", "STABILITY-GRID", [item.label, "SECONDARY"]), insufficient ? "比較対象外" : disagreement ? "掲載位置が不一致" : "引用状態を維持"]
      ] } }
    ]
  };
}

export function LabeledMetricGrid({
  items,
  detailType,
  details
}: {
  items: { label: string; value: string; note: string; tone?: "green" | "amber" | "red" }[];
  detailType?: ReportMetricGridDetailType;
  details?: (ReportDetailPayload | null)[];
}) {
  return (
    <div className="grid gap-px overflow-hidden border border-[#DFE6E2] bg-[#DFE6E2] 2xl:grid-cols-4">
      {items.map((item, index) => {
        const detail = details ? (details[index] ?? null) : detailType ? buildMetricGridDetail(detailType, item, items) : null;
        const content = <span className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[#667085]">{item.label}</p>
          <p className={cn(
            "mt-2 break-words text-2xl font-semibold tabular-nums text-[#101828]",
            item.tone === "green" && "text-[#075E44]",
            item.tone === "amber" && "text-[#B7791F]",
            item.tone === "red" && "text-[#B42318]"
          )}>{item.value}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#667085]">{item.note}</p>
        </span>;
        return detail ? (
          <ReportDetailButton key={item.label} detail={detail} className="min-h-0 w-full min-w-0 items-start rounded-none bg-white px-4 py-4 transition hover:bg-[#F4F8F6]">{content}</ReportDetailButton>
        ) : (
          <div key={item.label} className="min-h-0 w-full min-w-0 bg-white px-4 py-4">{content}</div>
        );
      })}
    </div>
  );
}
