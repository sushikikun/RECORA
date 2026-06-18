"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Terminal
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataCard, PageHeader } from "@/components/recora/ui";
import { cn } from "@/lib/utils";

type RunMode = "dry-run" | "execute";
type JsonRecord = Record<string, unknown>;

type ApiResponse = {
  ok: boolean;
  smallScaleExecution?: boolean;
  command?: string[];
  result?: JsonRecord;
  error?: string;
};

const DEFAULT_PROJECT_SLUG = "recora-kenzai-q2";
const DEFAULT_PROMPT_LIMIT = 1;
const DEFAULT_SEARCH_MODE = "both";

export function RunCyclePanel({ projectSlug = DEFAULT_PROJECT_SLUG }: { projectSlug?: string }) {
  const normalizedProjectSlug = projectSlug || DEFAULT_PROJECT_SLUG;
  const [isRunning, setIsRunning] = useState(false);
  const [activeMode, setActiveMode] = useState<RunMode | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const summary = useMemo(() => buildSummary(response?.result), [response]);
  const dashboardUrls = useMemo(() => buildDashboardUrls(normalizedProjectSlug, response?.result), [normalizedProjectSlug, response]);

  async function runCycle(mode: RunMode) {
    setIsRunning(true);
    setActiveMode(mode);
    setResponse(null);

    try {
      const result = await fetch("/api/recora/run-cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectSlug: normalizedProjectSlug,
          promptLimit: DEFAULT_PROMPT_LIMIT,
          searchMode: DEFAULT_SEARCH_MODE,
          mode
        })
      });
      const payload = await result.json() as ApiResponse;
      setResponse(payload);
    } catch (error) {
      setResponse({
        ok: false,
        error: error instanceof Error ? error.message : "測定実行リクエストに失敗しました。"
      });
    } finally {
      setIsRunning(false);
      setActiveMode(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="測定"
        title="測定実行"
        description="OpenAI測定を実行し、AI回答ログ・参照元分析・ダッシュボードKPIへ反映します。"
        actions={
          <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">
            ローカル開発用
          </Badge>
        }
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <DataCard
          title="実行設定"
          description="v0.1では小規模な測定だけを画面から実行します。"
          action={
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
              prompt-limit 1
            </Badge>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <SettingTile label="Project" value={normalizedProjectSlug} />
            <SettingTile label="Prompt limit" value={String(DEFAULT_PROMPT_LIMIT)} />
            <SettingTile label="Search mode" value={DEFAULT_SEARCH_MODE} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 justify-center"
              disabled={isRunning}
              onClick={() => void runCycle("dry-run")}
            >
              {isRunning && activeMode === "dry-run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              dry-run確認
            </Button>
            <Button
              type="button"
              className="h-12 justify-center"
              disabled={isRunning}
              onClick={() => void runCycle("execute")}
            >
              {isRunning && activeMode === "execute" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              小規模測定を実行
            </Button>
          </div>

          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
            <NoticeRow icon={<ShieldCheck className="h-4 w-4" />} text="Recora独自の観測であり、AIプラットフォーム公式評価ではありません。" />
            <NoticeRow icon={<AlertTriangle className="h-4 w-4" />} text="小規模測定では強い結論にしないでください。" />
            <NoticeRow icon={<Terminal className="h-4 w-4" />} text="実行にはOpenAI APIを使用します。dry-runではAPIを呼びません。" />
          </div>
        </DataCard>

        <DataCard title="確認URL" description="実行後に確認する画面です。">
          <div className="space-y-3">
            {dashboardUrls.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <span className="min-w-0">
                  <span className="block">{item.label}</span>
                  <span className="mt-1 block truncate text-xs font-semibold text-slate-500 group-hover:text-teal-700">
                    {item.href}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </Link>
            ))}
          </div>
        </DataCard>
      </div>

      <div className="mt-5">
        <DataCard
          title="実行結果"
          description="dry-runまたは小規模測定の結果をここに表示します。"
          action={response ? <ResultBadge ok={response.ok} /> : null}
        >
          {!response ? (
            <EmptyResult />
          ) : response.ok ? (
            <ResultSummary summary={summary} command={response.command} result={response.result} />
          ) : (
            <ErrorResult message={response.error ?? "測定実行に失敗しました。"} />
          )}
        </DataCard>
      </div>
    </>
  );
}

function SettingTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function NoticeRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex gap-2 rounded-lg border border-teal-100 bg-teal-50/70 px-3 py-2 text-teal-950">
      <span className="mt-1 shrink-0 text-teal-700">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ResultBadge({ ok }: { ok: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-slate-200 bg-slate-50",
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
      )}
    >
      {ok ? "成功" : "失敗"}
    </Badge>
  );
}

function EmptyResult() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-bold text-slate-700">まだ実行結果はありません。</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">まずはdry-run確認で、実行予定と安全ガードを確認できます。</p>
    </div>
  );
}

function ErrorResult({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
      {message}
    </div>
  );
}

function ResultSummary({
  summary,
  command,
  result
}: {
  summary: ReturnType<typeof buildSummary>;
  command?: string[];
  result?: JsonRecord;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="measurementRunId" value={summary.measurementRunId ?? "-"} />
        <SummaryTile label="runItems" value={summary.runItems} />
        <SummaryTile label="AI回答" value={summary.aiConversations} />
        <SummaryTile label="引用" value={summary.citations} />
        <SummaryTile label="ブランド言及" value={summary.brandMentions} />
        <SummaryTile label="参照ドメイン" value={summary.sourceDomains} />
        <SummaryTile label="aggregateRunId" value={summary.aggregateRunId ?? "-"} />
        <SummaryTile label="metric snapshots" value={summary.metricSnapshots} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SummaryLine label="recommendations before / after" value={summary.recommendations} />
        <SummaryLine label="metric_snapshots before / after" value={summary.metricSnapshotCounts} />
      </div>

      {command?.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-950 px-4 py-3 text-xs font-semibold leading-6 text-slate-100">
          <span className="text-slate-400">command</span>
          <p className="mt-1 break-words">{command.join(" ")}</p>
        </div>
      ) : null}

      {result ? (
        <details className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-700">JSON詳細</summary>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="truncate text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold text-slate-950" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <span className="font-bold text-slate-600">{label}</span>
      <span className="font-bold text-slate-950">{value}</span>
    </div>
  );
}

function buildSummary(result?: JsonRecord) {
  const measurement = getRecord(result?.measurement);
  const aggregate = getRecord(result?.aggregate);
  const insertedCounts = getRecord(measurement.insertedCounts);

  return {
    measurementRunId: getString(result?.measurementRunId),
    runItems: formatNullableNumber(insertedCounts.runItemsCreated),
    aiConversations: formatNullableNumber(insertedCounts.aiConversationsInserted),
    brandMentions: formatNullableNumber(insertedCounts.brandMentionsInserted),
    citations: formatNullableNumber(insertedCounts.citationsInserted),
    sourceDomains: formatNullableNumber(insertedCounts.sourceDomainsUpserted),
    aggregateRunId: getString(aggregate.aggregateRunId),
    metricSnapshots: `${formatNullableNumber(aggregate.insertedSnapshotCount)} inserted / ${formatNullableNumber(aggregate.updatedSnapshotCount)} updated`,
    recommendations: `${formatNullableNumber(result?.recommendationsBefore)} -> ${formatNullableNumber(result?.recommendationsAfter)}`,
    metricSnapshotCounts: `${formatNullableNumber(result?.metricSnapshotsBefore)} -> ${formatNullableNumber(result?.metricSnapshotsAfter)}`
  };
}

function buildDashboardUrls(projectSlug: string, result?: JsonRecord) {
  const fromResult = getRecord(result?.dashboardUrls);
  return [
    { label: "Dashboard", href: getString(fromResult.dashboard) ?? "/dashboard" },
    { label: "AI回答ログ", href: getString(fromResult.conversations) ?? `/dashboard/reports/${projectSlug}/conversations` },
    { label: "参照元分析", href: getString(fromResult.sources) ?? `/dashboard/reports/${projectSlug}/sources` },
    { label: "競合ランキング", href: getString(fromResult.leaderboard) ?? `/dashboard/reports/${projectSlug}/leaderboard` }
  ];
}

function getRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
}

function getString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function formatNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}
