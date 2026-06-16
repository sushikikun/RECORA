import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Minus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "amber" | "rose" | "slate" | "purple";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
  purple: "bg-indigo-50 text-indigo-700"
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-[28px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-5">{meta}</div> : null}
    </section>
  );
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  action,
  dense = false
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  dense?: boolean;
}) {
  return (
    <Card
      className={cn(
        "min-w-0 max-w-full rounded-lg border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)]",
        className
      )}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-bold text-slate-950">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("min-w-0", dense ? "p-3.5" : "p-4")}>{children}</div>
    </Card>
  );
}

export const DataCard = DashboardCard;

export function MetricCard({
  label,
  value,
  helper,
  delta,
  deltaLabel,
  sparkline,
  tone = "blue",
  chartType = "line"
}: {
  label: string;
  value: string;
  helper?: string;
  delta?: number;
  deltaLabel?: string;
  sparkline?: number[];
  tone?: Tone;
  chartType?: "line" | "bars";
}) {
  return (
    <Card
      title={helper ? `${label}: ${helper}` : label}
      className="min-w-0 rounded-lg border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
    >
      <div className="flex min-h-[104px] min-w-0 flex-col justify-between gap-3">
        <p className="truncate whitespace-nowrap text-[13px] font-bold leading-5 text-slate-500">
          {label}
        </p>
        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-2xl font-bold tracking-normal text-slate-950">
              {value}
            </p>
            <div className="mt-2 flex min-h-5 items-center gap-2">
            {delta !== undefined ? <DeltaBadge value={delta} label={deltaLabel} /> : null}
            </div>
          </div>
          {sparkline ? (
            <div className="w-20 shrink-0 sm:w-24 lg:w-20 2xl:w-24">
              <MiniSparkline values={sparkline} tone={tone} type={chartType} />
            </div>
          ) : (
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", toneClasses[tone])} />
          )}
        </div>
      </div>
    </Card>
  );
}

export function MetricTile({
  label,
  value,
  helper,
  delta,
  tone = "blue"
}: {
  label: string;
  value: string;
  helper?: string;
  delta?: number;
  tone?: "blue" | "slate" | "green" | "amber";
}) {
  return (
    <MetricCard
      label={label}
      value={value}
      helper={helper}
      delta={delta}
      tone={tone === "amber" ? "amber" : tone}
      sparkline={[34, 42, 38, 52, 49, 58, 55, 61]}
    />
  );
}

export function AlertBanner({
  title,
  description,
  actionLabel
}: {
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/90 px-4 py-3.5 shadow-[0_8px_24px_rgba(249,115,22,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-orange-800">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{description}</p>
          </div>
        </div>
        <button className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-orange-200 bg-white px-3 text-sm font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function MiniSparkline({
  values,
  tone = "blue",
  type = "line"
}: {
  values: number[];
  tone?: Tone;
  type?: "line" | "bars";
}) {
  const color = {
    blue: "#2563eb",
    green: "#059669",
    amber: "#f97316",
    rose: "#ef4444",
    slate: "#475569",
    purple: "#7c3aed"
  }[tone];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  if (type === "bars") {
    return (
      <div className="flex h-11 items-end gap-1">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="w-full rounded-t-sm"
            style={{
              height: `${Math.max(18, ((value - min) / range) * 100)}%`,
              backgroundColor: color,
              opacity: 0.42 + index / values.length / 2
            }}
          />
        ))}
      </div>
    );
  }

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 42 - ((value - min) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 46" className="h-11 w-full overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        points={points}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "blue"
}: {
  value: number;
  className?: string;
  tone?: "blue" | "green" | "amber" | "rose" | "slate";
}) {
  const toneClass = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    amber: "bg-orange-500",
    rose: "bg-rose-500",
    slate: "bg-slate-600"
  }[tone];

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full", toneClass)}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

export function DeltaBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-bold",
        isPositive && "bg-emerald-50 text-emerald-700",
        isNegative && "bg-rose-50 text-rose-700",
        !isPositive && !isNegative && "bg-slate-100 text-slate-600"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label ?? `${isPositive ? "+" : ""}${value}%`}
    </span>
  );
}

export function StatusPill({ value }: { value: string }) {
  const labelMap: Record<string, string> = {
    Win: "勝ち",
    Loss: "負け",
    "Narrow loss": "僅差負け",
    Pass: "良好",
    "Needs work": "要改善",
    Watch: "要観察"
  };
  const label = labelMap[value] ?? value;
  const className =
    value === "Win" || value === "Pass"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "Loss" || value === "Needs work"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-orange-200 bg-orange-50 text-orange-700";

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      {label}
    </Badge>
  );
}

export function PriorityPill({ value }: { value: "High" | "Medium" | "Low" }) {
  const label = value === "High" ? "高" : value === "Medium" ? "中" : "低";
  const className =
    value === "High"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : value === "Medium"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      優先度: {label}
    </Badge>
  );
}

export function SentimentPill({ value }: { value: "positive" | "neutral" | "negative" }) {
  const label =
    value === "positive" ? "好意的" : value === "negative" ? "否定的" : "中立";
  const className =
    value === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "negative"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-sm", className)}>
      {label}
    </Badge>
  );
}

export function HeatmapCell({ value }: { value: number }) {
  const alpha = 0.08 + (Math.max(0, Math.min(value, 100)) / 100) * 0.62;
  const color = value >= 65 ? "37, 99, 235" : value >= 45 ? "14, 165, 233" : "249, 115, 22";

  return (
    <div
      className="flex h-11 min-w-16 items-center justify-center rounded-md border border-white text-xs font-bold text-slate-950"
      style={{ backgroundColor: `rgba(${color}, ${alpha})` }}
    >
      {value}%
    </div>
  );
}

export function DonutChart({
  items,
  centerLabel,
  centerValue
}: {
  items: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  let acc = 0;
  const gradient = items
    .map((item) => {
      const start = acc;
      acc += item.value;
      return `${item.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
      <div
        className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <span className="text-2xl font-bold text-slate-950">{centerValue}</span>
          <span className="mt-1 text-[11px] font-bold text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-bold text-slate-950">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrioritySuggestionCard({
  priority,
  title,
  description,
  href = "#"
}: {
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  href?: string;
}) {
  const priorityClass =
    priority === "High"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : priority === "Medium"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-blue-200 bg-blue-50 text-blue-700";
  const label = priority === "High" ? "高" : priority === "Medium" ? "中" : "低";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className={cn("inline-flex rounded-sm border px-2 py-0.5 text-xs font-bold", priorityClass)}>
        優先度: {label}
      </span>
      <p className="mt-3 font-bold leading-5 text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
        詳細を確認
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function RoadmapCard({
  step,
  title,
  description,
  effect
}: {
  step: number;
  title: string;
  description: string;
  effect: string;
}) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {step}
      </span>
      <p className="mt-3 font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-4 inline-flex rounded-sm bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
        {effect}
      </span>
    </div>
  );
}

export function TinyBarChart({
  values,
  labels,
  max = 100
}: {
  values: number[];
  labels?: string[];
  max?: number;
}) {
  return (
    <div className="flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-20 w-full items-end rounded-md bg-slate-100">
            <div
              className="w-full rounded-md bg-blue-600"
              style={{ height: `${Math.max(8, Math.min((value / max) * 100, 100))}%` }}
            />
          </div>
          {labels ? (
            <span className="max-w-14 truncate text-[10px] font-semibold text-slate-500">
              {labels[index]}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function formatPercent(value: number) {
  return `${value}%`;
}
