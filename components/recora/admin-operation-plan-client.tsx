"use client";

import { useMemo, useState } from "react";
import { ClipboardList, FileCheck2, ShieldAlert } from "lucide-react";

import { DataCard } from "@/components/recora/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecoraAdminOperationDetail } from "@/lib/recora/db/admin-operations";
import {
  createRecoraPhase1AdminExecutionPlan,
  type RecoraPhase1AdminPlan,
  type RecoraPhase1AdminPlanSelection
} from "@/lib/recora/phase1-admin-plan";
import { cn } from "@/lib/utils";

export function AdminOperationPlanClient({ detail }: { detail: RecoraAdminOperationDetail }) {
  const initialMeasurementRunId = detail.selectedMeasurementRunId ?? detail.completedMeasurementRuns[0]?.id ?? "";
  const [selectedMeasurementRunId, setSelectedMeasurementRunId] = useState(initialMeasurementRunId);
  const [applyAggregate, setApplyAggregate] = useState(false);
  const [generateRecommendations, setGenerateRecommendations] = useState(false);
  const [applyRecommendations, setApplyRecommendations] = useState(false);
  const [checkReportReady, setCheckReportReady] = useState(true);
  const [plan, setPlan] = useState<RecoraPhase1AdminPlan | null>(null);

  const selection = useMemo<RecoraPhase1AdminPlanSelection>(() => ({
    selectedMeasurementRunId: selectedMeasurementRunId || null,
    applyAggregate,
    generateRecommendations,
    applyRecommendations,
    checkReportReady
  }), [applyAggregate, applyRecommendations, checkReportReady, generateRecommendations, selectedMeasurementRunId]);

  function confirmPlan() {
    setPlan(createRecoraPhase1AdminExecutionPlan(detail, selection));
  }

  return (
    <DataCard
      title="実行計画を確認"
      description="ここでは工程の組み合わせと阻害条件だけを確認します。実処理、DB書き込み、OpenAI API実行は起動しません。"
      action={
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
          plan only
        </Badge>
      }
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="measurement-run" className="text-sm font-bold text-slate-700">
            既存の完了済みOpenAI measurement run
          </label>
          <select
            id="measurement-run"
            value={selectedMeasurementRunId}
            onChange={(event) => setSelectedMeasurementRunId(event.target.value)}
            disabled={detail.completedMeasurementRuns.length === 0}
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {detail.completedMeasurementRuns.length === 0 ? (
              <option value="">選択できるrunがありません</option>
            ) : detail.completedMeasurementRuns.map((run) => (
              <option key={run.id} value={run.id}>{run.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <PlanToggle
            checked={applyAggregate}
            onChange={setApplyAggregate}
            title="集計を行う"
            description="既存measurement runを元にaggregateとmetric snapshotsを扱う計画にします。"
          />
          <PlanToggle
            checked={generateRecommendations}
            onChange={setGenerateRecommendations}
            title="改善案候補を生成する"
            description="候補生成を計画に含めます。候補は承認済み施策ではありません。"
          />
          <PlanToggle
            checked={applyRecommendations}
            onChange={setApplyRecommendations}
            title="改善案を保存対象にする"
            description="保存が必要な工程として扱います。この画面から保存はしません。"
          />
          <PlanToggle
            checked={checkReportReady}
            onChange={setCheckReportReady}
            title="report-ready確認を行う"
            description="既存gateの現在状態と残課題を計画に含めます。"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          <div className="flex gap-2">
            <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              新規OpenAI計測、子プロセス実行、DB書き込み、改善案保存、remote migration適用は、この画面からは行いません。
            </p>
          </div>
        </div>

        <Button type="button" className="w-full sm:w-fit" onClick={confirmPlan}>
          <ClipboardList className="h-4 w-4" />
          実行計画を確認
        </Button>

        {plan ? <PlanPreview plan={plan} /> : null}
      </div>
    </DataCard>
  );
}

function PlanToggle({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className={cn(
      "flex min-h-[118px] cursor-pointer gap-3 rounded-lg border bg-white p-4 transition",
      checked ? "border-teal-300 bg-teal-50/60" : "border-slate-200 hover:border-teal-200 hover:bg-teal-50/30"
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
    </label>
  );
}

function PlanPreview({ plan }: { plan: RecoraPhase1AdminPlan }) {
  return (
    <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-teal-700">確認済み実行計画</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{plan.targetProject}</p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "w-fit rounded-sm",
            plan.requiresWrite ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {plan.modeLabel}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PlanFact label="対象measurement run" value={plan.targetMeasurementRunId ?? "未選択"} mono />
        <PlanFact label="外部AI計測" value={plan.externalAiMeasurement} />
        <PlanFact label="report-ready現在状態" value={plan.reportReadyCurrentStatus} />
        <PlanFact label="DB/ファイル書き込み" value={plan.requiresWrite ? "別承認が必要" : "不要"} />
      </div>

      <PlanList title="実行予定の工程" items={plan.plannedStages} />
      <PlanList title="実行しない工程" items={plan.skippedStages} muted />
      <PlanList
        title="実行を妨げている条件"
        items={plan.blockingConditions.length > 0 ? plan.blockingConditions : ["なし"]}
        tone={plan.blockingConditions.length > 0 ? "warning" : "normal"}
      />
      <PlanList title="内部運用者が次に行うべきこと" items={plan.nextActions} />

      <div>
        <div className="mb-2 flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-teal-700" />
          <p className="text-sm font-bold text-slate-800">対応する既存CLIコマンド案</p>
        </div>
        <div className="space-y-2">
          {plan.cliCommandSuggestions.map((command) => (
            <code
              key={command}
              className="block whitespace-pre-wrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold leading-6 text-slate-100"
            >
              {command}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-bold text-slate-900", mono && "font-mono text-xs")} title={value}>
        {value}
      </p>
    </div>
  );
}

function PlanList({
  title,
  items,
  muted = false,
  tone = "normal"
}: {
  title: string;
  items: string[];
  muted?: boolean;
  tone?: "normal" | "warning";
}) {
  return (
    <div className={cn("rounded-lg border px-4 py-3", muted ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white")}>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-6">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "warning" ? "bg-amber-500" : "bg-teal-600")} />
            <span className={muted ? "text-slate-500" : "text-slate-700"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
