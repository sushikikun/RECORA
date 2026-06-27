import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportHelpTooltip } from "@/components/recora/report-ui/report-help-tooltip";

type ToolbarItem = {
  label: string;
  value: string;
  helper?: string;
};

type KpiItem = {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "green" | "amber" | "red";
  progress?: number | null;
};

export function DataRichPageHeader({
  eyebrow,
  title,
  description,
  badge,
  badgeTone = "default",
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: "default" | "amber";
  action?: ReactNode;
}) {
  return (
    <header className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {eyebrow ? <p className="text-[12px] font-bold text-[#006B57]">{eyebrow}</p> : null}
            {badge ? (
              <span
                className={cn(
                  "inline-flex h-5 items-center rounded-sm border px-2 text-[10px] font-bold tracking-normal",
                  badgeTone === "amber"
                    ? "border-[#F3D6A2] bg-[#FFF7E8] text-[#9A5B00]"
                    : "border-[#DFE6E2] bg-[#FAFCFB] text-[#64748B]"
                )}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-normal text-[#0F172A]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-4xl text-[13px] leading-6 text-[#64748B]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function DataRichPrimaryAction({ href, children }: { href?: string; children: ReactNode }) {
  const className =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#006B57] px-3 text-[13px] font-bold text-white transition hover:bg-[#005548] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57] focus-visible:ring-offset-2";

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {children}
      <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
    </Link>
  );
}

export function DataRichToolbar({ items }: { items: ToolbarItem[] }) {
  const visibleItems = items.filter((item) => {
    const value = item.value.trim();
    return value !== "" && value !== "-";
  });
  const gridClass =
    visibleItems.length <= 1 ? "xl:grid-cols-1" :
    visibleItems.length === 2 ? "xl:grid-cols-2" :
    visibleItems.length === 3 ? "xl:grid-cols-3" :
    visibleItems.length === 4 ? "xl:grid-cols-4" :
    visibleItems.length === 5 ? "xl:grid-cols-5" :
    "xl:grid-cols-6";

  return (
    <section className={cn("grid min-w-0 overflow-hidden rounded-lg border border-[#DFE6E2] bg-white md:grid-cols-2", gridClass)}>
      {visibleItems.map((item) => (
        <div key={`${item.label}-${item.value}`} className="min-w-0 border-b border-[#E5EAE8] px-3 py-2.5 md:border-r xl:border-b-0 xl:last:border-r-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[11px] font-bold text-[#64748B]" title={item.label}>{item.label}</p>
            {item.helper ? <ReportHelpTooltip text={item.helper} label={`${item.label}の補足`} /> : null}
          </div>
          <p className="mt-1 line-clamp-2 break-words text-[13px] font-bold leading-5 tabular-nums text-[#0F172A] [word-break:keep-all]" title={item.value}>{item.value}</p>
        </div>
      ))}
    </section>
  );
}

export function DataRichKpiStrip({ items, columns = "xl:grid-cols-6" }: { items: KpiItem[]; columns?: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#DFE6E2] bg-white" data-recora-kpi-strip>
      <div className={cn("grid min-w-0 md:grid-cols-2", columns)}>
        {items.map((item) => (
          <DataRichKpi key={`${item.label}-${item.value}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function DataRichKpi({ item }: { item: KpiItem }) {
  const progress = typeof item.progress === "number" ? Math.max(0, Math.min(100, item.progress)) : null;
  const valueClass = cn(
    "mt-1 truncate text-[28px] font-bold leading-none tracking-normal tabular-nums",
    item.tone === "green" ? "text-[#006B57]" : "text-[#0F172A]",
    item.tone === "amber" && "text-[#B7791F]",
    item.tone === "red" && "text-[#B42318]"
  );

  return (
    <div className="min-w-0 border-b border-[#E5EAE8] px-4 py-3.5 md:border-r xl:border-b-0 xl:last:border-r-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-[12px] font-bold text-[#64748B]" title={item.label}>{item.label}</p>
        {item.helper ? <ReportHelpTooltip text={item.helper} label={`${item.label}の定義`} /> : null}
      </div>
      <p className={valueClass} title={item.value}>{item.value}</p>
      {progress !== null ? (
        <div className="mt-2 h-2 overflow-hidden rounded-sm bg-[#EDF2F0]">
          <div className="h-full rounded-sm bg-[#006B57]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function DataRichPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-lg border border-[#DFE6E2] bg-white", className)}>
      <div className="flex min-h-12 min-w-0 flex-col gap-2 border-b border-[#E5EAE8] px-4 py-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-5 text-[#0F172A]">{title}</h2>
          {description ? <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#64748B]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("min-w-0 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function DataRichSplit({ main, aside, className }: { main: ReactNode; aside: ReactNode; className?: string }) {
  return (
    <section className={cn("grid min-w-0 overflow-hidden rounded-lg border border-[#DFE6E2] bg-white xl:grid-cols-[minmax(0,1fr)_minmax(270px,28%)]", className)}>
      <div className="min-w-0">{main}</div>
      <aside className="min-w-0 border-t border-[#E5EAE8] bg-[#FAFCFB] xl:border-l xl:border-t-0">{aside}</aside>
    </section>
  );
}

export function DataRichInlineBar({
  value,
  label,
  className
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-[#EDF2F0]">
          <div className="h-full rounded-sm bg-[#006B57]" style={{ width: `${width}%` }} />
        </div>
        {label ? <span className="shrink-0 text-[12px] font-bold tabular-nums text-[#0F172A]">{label}</span> : null}
      </div>
    </div>
  );
}

export function DataRichStackedBar({
  segments
}: {
  segments: { key: string; label: string; value: number; className?: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="h-5 overflow-hidden rounded-sm border border-[#DFE6E2] bg-[#EDF2F0]">
        <div className="flex h-full w-full">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={cn("h-full", segment.className ?? "bg-[#006B57]")}
              style={{ width: `${Math.max(segment.value, segment.value > 0 ? 4 : 0)}%` }}
              title={`${segment.label}: ${segment.value}%`}
            />
          ))}
        </div>
      </div>
      <div className="grid min-w-0 gap-0 overflow-hidden rounded-md border border-[#DFE6E2] bg-white md:grid-cols-5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex min-w-0 items-center gap-2 border-b border-[#E5EAE8] px-3 py-2 md:border-b-0 md:border-r md:last:border-r-0">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", segment.className ?? "bg-[#006B57]")} />
            <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#475569]" title={segment.label}>{segment.label}</span>
            <span className="shrink-0 text-[12px] font-bold tabular-nums text-[#0F172A]">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataRichBadge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "amber" | "red" }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px] font-bold",
        tone === "default" && "border-[#DFE6E2] bg-[#FAFCFB] text-[#64748B]",
        tone === "green" && "border-[#006B57]/20 bg-[#EAF6F0] text-[#006B57]",
        tone === "amber" && "border-[#B7791F]/25 bg-[#FFF7E8] text-[#B7791F]",
        tone === "red" && "border-[#B42318]/25 bg-[#FFF1F0] text-[#B42318]"
      )}
    >
      {children}
    </span>
  );
}

export function DataRichEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#DFE6E2] bg-[#FAFCFB] px-3 py-3 text-[13px] font-semibold leading-6 text-[#64748B]">
      {message}
    </div>
  );
}

export function DataRichTableWrap({ children }: { children: ReactNode }) {
  return <div className="min-w-0 overflow-hidden rounded-md border border-[#E5EAE8]">{children}</div>;
}
