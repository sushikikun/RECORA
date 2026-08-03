"use client";

import { Children, cloneElement, isValidElement, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Cpu, ListTree, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportHelpTooltip } from "@/components/recora/report-ui/report-help-tooltip";
import {
  ReportDetailButton,
  type ReportDetailPayload
} from "@/components/recora/report-ui/report-detail-drawer";

type ToolbarItem = {
  label: string;
  value: string;
  helper?: string;
};

type KpiItem = {
  label: string;
  value: string;
  helper?: string;
  note?: string;
  tone?: "default" | "green" | "amber" | "red";
  progress?: number | null;
  detail?: ReportDetailPayload;
};

type ScopeItem = {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "amber";
};

export function DataRichScopeStrip({
  items,
  ariaLabel = "表示条件",
  className
}: {
  items: ScopeItem[];
  ariaLabel?: string;
  className?: string;
}) {
  const icons = [CalendarDays, Cpu, ShieldCheck, TriangleAlert];

  return (
    <section
      className={cn("grid min-w-0 grid-cols-2 border-y border-[#D9E2DE] bg-[#F8FAF9] lg:grid-cols-4", className)}
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const Icon = icons[index % icons.length];
        return (
          <div
            key={item.key}
            className="flex min-w-0 items-center gap-2.5 border-b border-[#E2E8E5] px-3 py-3.5 odd:border-r lg:border-b-0 lg:border-r lg:px-4 lg:last:border-r-0"
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", item.tone === "amber" ? "text-[#9A5B00]" : "text-[#075E44]")}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-4 text-[#667085]">{item.label}</p>
              <p className={cn(
                "mt-0.5 break-words text-[13px] font-bold leading-5 tabular-nums text-[#26352F] sm:text-sm",
                item.tone === "amber" && "text-[#8A4B00]"
              )}>
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function DataRichSectionIndex({
  items,
  label = "このページの項目"
}: {
  items: { id: string; label: string }[];
  label?: string;
}) {
  const itemIdSignature = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const ids = itemIdSignature.split("|").filter(Boolean);
    if (!ids.length) {
      setActiveId("");
      return;
    }

    const activateFromHash = () => {
      const hash = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "";
      if (hash && ids.includes(hash)) setActiveId(hash);
      else setActiveId((current) => current && ids.includes(current) ? current : ids[0]);
    };
    activateFromHash();

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if (visible?.target.id) setActiveId(visible.target.id);
    }, {
      rootMargin: "-18% 0px -70% 0px",
      threshold: [0.01, 0.25, 0.5]
    });

    elements.forEach((element) => observer.observe(element));
    window.addEventListener("hashchange", activateFromHash);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", activateFromHash);
    };
  }, [itemIdSignature]);

  if (items.length < 4) return null;

  return (
    <nav className="min-w-0 max-w-full overflow-hidden border-y border-[#D8E1DD] bg-[#FBFCFB]/95 backdrop-blur" aria-label={label}>
      <div className="flex min-h-10 items-center gap-3 border-b border-[#E2E8E5] px-3 py-2">
        <ListTree className="h-4 w-4 shrink-0 text-[#075E44]" strokeWidth={1.8} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[12px] font-bold text-[#26352F]">{label}</span>
        <span className="text-[11px] font-bold tabular-nums text-[#667085]">{items.length}項目</span>
      </div>
      <div className="flex min-w-0 max-w-full gap-1 overflow-x-auto overflow-y-hidden px-2 py-2 [scrollbar-width:thin]">
        {items.map((item, index) => {
          const active = activeId === item.id || (!activeId && index === 0);
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "inline-flex min-h-10 min-w-max items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-[12px] font-semibold leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2",
                active
                  ? "border-[#0B6B57] bg-[#EAF6F0] text-[#075E44]"
                  : "border-transparent text-[#475467] hover:border-[#CFE1D9] hover:bg-[#F4F8F6] hover:text-[#075E44]"
              )}
            >
              <span className={cn("shrink-0 text-[10px] tabular-nums", active ? "text-[#075E44]" : "text-[#667085]")} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 whitespace-nowrap">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function DataRichPageSummary({
  eyebrow = "今回の要点",
  title,
  description,
  facts = []
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  facts?: { label: string; value: string; tone?: "default" | "green" | "amber" }[];
}) {
  return (
    <section className={cn(
      "min-w-0 border-y border-[#BFD2C9] bg-[#F6FAF8] px-5 sm:px-6",
      facts.length ? "py-6" : "py-5"
    )}>
      <div className={cn(
        "min-w-0",
        facts.length && "grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,1fr)] xl:items-end"
      )}>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#075E44]">{eyebrow}</p>
          <p className="mt-2 break-words text-xl font-semibold leading-8 text-[#101828] sm:text-[22px]">{title}</p>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475467]">{description}</p> : null}
        </div>
        {facts.length ? (
          <dl className="grid min-w-0 grid-cols-3 divide-x divide-[#D5E1DB] border-y border-[#D5E1DB] xl:grid-cols-1 xl:divide-x-0 xl:divide-y 2xl:grid-cols-3 2xl:divide-x 2xl:divide-y-0">
            {facts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className="min-w-0 px-3 py-3">
                <dt className="text-[11px] font-bold leading-4 text-[#667085]">{fact.label}</dt>
                <dd className={cn(
                  "mt-1 break-words text-sm font-bold leading-5 tabular-nums text-[#26352F]",
                  fact.tone === "green" && "text-[#075E44]",
                  fact.tone === "amber" && "text-[#8A4B00]"
                )}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function DataRichPageHeader({
  eyebrow,
  title,
  description,
  badge,
  badgeTone = "default",
  action,
  scopeItems = []
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: "default" | "amber";
  action?: ReactNode;
  scopeItems?: ScopeItem[];
}) {
  return (
    <header className="min-w-0 border-b border-[#DCE5E1] pb-7">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {eyebrow ? <p className="text-[11px] font-bold tracking-[0.08em] text-[#075E44]">{eyebrow}</p> : null}
            {badge ? (
              <span
                className={cn(
                  "block min-h-5 min-w-0 w-full max-w-full basis-full whitespace-normal break-words rounded-sm border px-2 py-0.5 text-[10px] font-bold leading-4 tracking-normal sm:inline-flex sm:w-auto sm:basis-auto sm:items-center",
                  badgeTone === "amber"
                    ? "border-[#F3D6A2] bg-[#FFF7E8] text-[#9A5B00]"
                    : "border-[#DFE6E2] bg-[#FAFCFB] text-[#64748B]"
                )}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-[30px] font-semibold leading-[1.18] tracking-[-0.025em] text-[#101828] sm:text-[36px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-4xl text-[15px] leading-7 text-[#475467]">
              {description}
            </p>
          ) : null}
        </div>
        {scopeItems.length || action ? (
          <div className="flex min-w-0 shrink-0 flex-col gap-3 xl:items-end">
            {scopeItems.length ? (
              <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-3 border-y border-[#E1E7E4] py-3 sm:grid-cols-4 xl:border-y-0 xl:py-0" aria-label="現在の集計条件">
                {scopeItems.map((item) => (
                  <div key={item.key} className="min-w-0 xl:border-l xl:border-[#DCE5E1] xl:pl-4">
                    <dt className="text-[11px] font-bold leading-4 text-[#667085]">{item.label}</dt>
                    <dd className={cn(
                      "mt-0.5 break-words text-[13px] font-bold leading-5 tabular-nums text-[#26352F] sm:text-sm",
                      item.tone === "amber" && "text-[#8A4B00]"
                    )}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function DataRichPrimaryAction({
  href,
  children,
  variant = "primary"
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2",
    variant === "primary"
      ? "bg-[#0B382D] text-white hover:bg-[#0D493A]"
      : "border border-[#D3DDD8] bg-white text-[#344054] hover:border-[#9AB8AA] hover:bg-[#F4F8F6]"
  );

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {variant === "secondary" ? <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> : null}
      {children}
      {variant === "primary" ? <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> : null}
    </Link>
  );
}

export function DataRichToolbar({ items, compact = false }: { items: ToolbarItem[]; compact?: boolean }) {
  const visibleItems = items.filter((item) => {
    const value = item.value.trim();
    return value !== "" && value !== "-";
  });
  const mobileSummary = visibleItems
    .filter((item) => ["期間", "測定日", "AIサービス", "有効観測・成功率"].includes(item.label))
    .slice(0, 3)
    .map((item) => item.value.split(" / ")[0])
    .join(" ・ ");

  if (compact) {
    return (
      <>
        <details className="group min-w-0 overflow-hidden border-y border-[#DFE5EE] bg-[#FBFCFE] md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3.5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B382D] [&::-webkit-details-marker]:hidden">
            <span className="shrink-0 text-xs font-bold text-[#344054]">固定の計測条件</span>
            <span className="min-w-0 flex-1 break-words text-[11px] font-semibold leading-5 tabular-nums text-[#667085]">全{visibleItems.length}項目</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#667085] transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid grid-cols-2 border-t border-[#E5E7EB]">
            {visibleItems.map((item) => <DataRichToolbarCell key={`${item.label}-${item.value}`} item={item} compact />)}
          </div>
        </details>
        <section className="hidden min-w-0 overflow-hidden border-y border-[#DFE5EE] bg-[#FBFCFE] md:block" aria-label="固定の計測条件">
          <div className="grid min-w-0 md:grid-cols-3 2xl:grid-cols-6">
            {visibleItems.map((item) => <DataRichToolbarCell key={`${item.label}-${item.value}`} item={item} compact />)}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <details className="group min-w-0 overflow-hidden border-y border-[#DFE5EE] bg-[#FBFCFE] md:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3.5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B382D] [&::-webkit-details-marker]:hidden">
          <span className="shrink-0 text-xs font-bold text-[#344054]">測定条件・全{visibleItems.length}項目</span>
          <span className="min-w-0 flex-1 break-words text-[11px] font-semibold leading-5 tabular-nums text-[#667085]">{mobileSummary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#667085] transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="grid grid-cols-1 border-t border-[#E5E7EB]">
          {visibleItems.map((item) => <DataRichToolbarCell key={`${item.label}-${item.value}`} item={item} />)}
        </div>
      </details>
      <section className="hidden min-w-0 overflow-hidden border border-[#DFE5EE] bg-[#FBFCFE] md:block">
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 py-3">
          <div>
            <p className="text-[12px] font-bold text-[#101828]">測定条件</p>
            <p className="mt-0.5 text-[11px] leading-5 text-[#667085]">この概要ページで使用している固定条件です。</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#DDE7E2] bg-[#F1F8F5] px-2.5 py-1 text-[11px] font-bold text-[#075E44]">概要の基準</span>
        </div>
        <div className="grid min-w-0 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map((item) => <DataRichToolbarCell key={`${item.label}-${item.value}`} item={item} />)}
        </div>
      </section>
    </>
  );
}

function DataRichToolbarCell({ item, compact = false }: { item: ToolbarItem; compact?: boolean }) {
  return (
    <div className={cn("min-w-0 border-b border-[#E5E7EB] md:border-b-0 md:border-l md:first:border-l-0", compact ? "px-3 py-2.5" : "px-4 py-3.5")}>
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="break-words text-[12px] font-bold leading-5 text-[#667085]">{item.label}</p>
        {item.helper ? <ReportHelpTooltip text={item.helper} label={`${item.label}の補足`} /> : null}
      </div>
      <p className={cn("mt-1 break-words font-semibold tabular-nums text-[#344054] [overflow-wrap:anywhere] [word-break:normal]", compact ? "text-[12px] leading-5" : "text-[14px] leading-6")}>{item.value}</p>
    </div>
  );
}

export function DataRichKpiStrip({
  items,
  columns = "xl:grid-cols-6",
  layout = "grid"
}: {
  items: KpiItem[];
  columns?: string;
  layout?: "grid" | "rows";
}) {
  if (layout === "rows") {
    return (
      <section className="border-y border-[#DCE5E1] bg-white" data-recora-kpi-strip aria-label="主要指標">
        <div className="divide-y divide-[#E5E7EB]">
          {items.map((item) => <DataRichKpiRow key={`${item.label}-${item.value}`} item={item} />)}
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-[#DCE5E1] bg-white" data-recora-kpi-strip aria-label="主要指標">
      <div className={cn("grid min-w-0 [&>*:last-child]:border-b-0", columns)}>
        {items.map((item) => (
          <DataRichKpi key={`${item.label}-${item.value}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function DataRichKpiRow({ item }: { item: KpiItem }) {
  const progress = typeof item.progress === "number" ? Math.max(0, Math.min(100, item.progress)) : null;
  const valueClass = cn(
    "break-words text-[30px] font-semibold leading-tight tracking-[-0.03em] tabular-nums [word-break:keep-all]",
    item.tone === "green" ? "text-[#075E44]" : "text-[#101828]",
    item.tone === "amber" && "text-[#8A4B00]",
    item.tone === "red" && "text-[#B42318]"
  );

  return (
    <div className="grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[minmax(180px,0.9fr)_minmax(110px,0.38fr)_minmax(260px,1.25fr)] sm:items-center sm:px-5">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="break-words text-[13px] font-bold leading-5 text-[#5D6B66]">{item.label}</p>
        {item.helper ? <ReportHelpTooltip text={item.helper} label={`${item.label}の定義`} /> : null}
      </div>
      {item.detail ? (
        <ReportDetailButton detail={item.detail} className="w-fit max-w-full justify-start" label={`${item.label}の内訳を開く`}>
          <span className={valueClass} title={item.value}>{item.value}</span>
        </ReportDetailButton>
      ) : <span className={valueClass} title={item.value}>{item.value}</span>}
      <div className="min-w-0">
        {item.note || item.helper ? (
          <p className="text-[13px] font-medium leading-6 text-[#5D6B66]">{item.note ?? item.helper}</p>
        ) : null}
        {progress !== null ? (
          <div className="mt-2 h-1.5 max-w-[320px] overflow-hidden rounded-full bg-[#EDF2F0]" role="progressbar" aria-label={`${item.label} ${item.value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="h-full rounded-full bg-[#075E44]" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DataRichKpi({ item }: { item: KpiItem }) {
  const progress = typeof item.progress === "number" ? Math.max(0, Math.min(100, item.progress)) : null;
  const valueClass = cn(
    "break-words text-[30px] font-semibold leading-tight tracking-[-0.03em] tabular-nums [word-break:keep-all]",
    item.tone === "green" ? "text-[#075E44]" : "text-[#101828]",
    item.tone === "amber" && "text-[#B7791F]",
    item.tone === "red" && "text-[#B42318]"
  );

  return (
    <div className="min-w-0 border-b border-[#E5E7EB] px-4 py-4 md:border-r xl:border-b-0 xl:last:border-r-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="break-words text-[12px] font-bold leading-5 text-[#667085]">{item.label}</p>
        {item.helper ? <ReportHelpTooltip text={item.helper} label={`${item.label}の定義`} /> : null}
      </div>
      {item.detail ? (
        <ReportDetailButton detail={item.detail} className="mt-2 w-fit max-w-full justify-start" label={`${item.label}の内訳を開く`}>
          <span className={valueClass} title={item.value}>{item.value}</span>
        </ReportDetailButton>
      ) : <span className={cn(valueClass, "mt-2 block")} title={item.value}>{item.value}</span>}
      {item.note ? <p className="mt-2 text-[12px] font-semibold leading-5 text-[#667085]">{item.note}</p> : null}
      {progress !== null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF2F0]" role="progressbar" aria-label={`${item.label} ${item.value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-[#075E44]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function DataRichPanel({
  id,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  variant
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: "summary" | "analysis" | "evidence" | "comparison" | "trend";
}) {
  const resolvedVariant = variant ?? (bodyClassName?.includes("p-0") ? "evidence" : "analysis");
  return (
    <section
      id={id}
      data-recora-panel
      data-panel-role={resolvedVariant}
      className={cn(
        "min-w-0 scroll-mt-40 bg-white",
        resolvedVariant === "summary" && "border-y border-[#BFD2C9] bg-[#F4FAF7]",
        resolvedVariant === "analysis" && "bg-transparent",
        resolvedVariant === "evidence" && "border border-[#D6DFDB]",
        resolvedVariant === "comparison" && "border-y border-[#BFD2C9] bg-white",
        resolvedVariant === "trend" && "border-y border-[#D5E1DB] bg-white",
        className
      )}
    >
      <div className={cn(
        "flex min-h-12 min-w-0 flex-col gap-2 border-b border-[#E5E7EB] px-5 py-4 md:flex-row md:items-start md:justify-between",
        resolvedVariant === "analysis" && "border-b border-[#DCE5E1] px-0 pb-4 pt-2",
        resolvedVariant === "evidence" && "bg-[#F8FAF9]",
        resolvedVariant === "summary" && "border-[#D5E1DB]",
        resolvedVariant === "comparison" && "border-[#D5E1DB] bg-[#F7FAF8]",
        resolvedVariant === "trend" && "border-[#DCE5E1] px-0 pb-4"
      )}>
        <div className="min-w-0">
          <h2 className={cn("font-semibold text-[#101828]", resolvedVariant === "evidence" ? "text-[17px] leading-6" : "text-xl leading-7")}>{title}</h2>
          {description ? <p className="mt-1.5 max-w-4xl text-[13px] leading-6 text-[#5D6B66]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(
        "min-w-0 p-5",
        resolvedVariant === "analysis" && "px-0 pb-7 pt-5",
        resolvedVariant === "trend" && "px-0 pb-6 pt-5",
        bodyClassName
      )}>{children}</div>
    </section>
  );
}

export function DataRichSplit({ main, aside, className }: { main: ReactNode; aside: ReactNode; className?: string }) {
  return (
    <section className={cn("grid min-w-0 overflow-hidden border border-[#DFE5EE] bg-white xl:grid-cols-[minmax(0,1fr)_minmax(270px,28%)]", className)}>
      <div className="min-w-0">{main}</div>
      <aside className="min-w-0 border-t border-[#E5E7EB] bg-[#FBFCFE] xl:border-l xl:border-t-0">{aside}</aside>
    </section>
  );
}

export function DataRichInlineBar({
  value,
  label,
  className,
  fillClassName,
  trackClassName
}: {
  value: number;
  label?: string;
  className?: string;
  fillClassName?: string;
  trackClassName?: string;
}) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <div className={cn("h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EDF2F0]", trackClassName)}>
          <div className={cn("h-full rounded-full bg-[#075E44]", fillClassName)} style={{ width: `${width}%` }} />
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
      <div className="h-4 overflow-hidden rounded-full border border-[#DFE5EE] bg-[#EDF2F0]">
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
      <div className="grid min-w-0 gap-0 overflow-hidden border border-[#DFE5EE] bg-white md:grid-cols-5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex min-w-0 items-center gap-2 border-b border-[#E5EAE8] px-3 py-2 md:border-b-0 md:border-r md:last:border-r-0">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", segment.className ?? "bg-[#006B57]")} />
            <span className="min-w-0 flex-1 break-words text-[12px] font-bold leading-5 text-[#475569]">{segment.label}</span>
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
        tone === "green" && "border-[#075E44]/20 bg-[#E8F3EE] text-[#075E44]",
        tone === "amber" && "border-[#9A5B08]/30 bg-[#FFF7E8] text-[#8A4B00]",
        tone === "red" && "border-[#B42318]/25 bg-[#FFF1F0] text-[#B42318]"
      )}
    >
      {children}
    </span>
  );
}

export function DataRichEmpty({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-[#DFE5EE] bg-[#FBFCFE] px-3 py-3 text-[13px] font-semibold leading-6 text-[#667085]">
      {message}
    </div>
  );
}

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!isValidElement(node)) return "";

  return Children.toArray(node.props.children as ReactNode).map(textFromNode).join("").trim();
}

function componentName(element: ReactElement): string | undefined {
  const type = element.type as { displayName?: string; name?: string };
  return type.displayName ?? type.name;
}

function isNamedTableElement(node: ReactNode, name: string): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement(node) && componentName(node) === name;
}

const numericColumnPattern = /(率|順位|位置|件数|引用数|観測|差|スコア|割合|SOV|pt|回数|カバー|維持|一致|日数|モデル数)/i;

function labelTableCells(row: ReactElement<{ children?: ReactNode }>, labels: string[]) {
  return cloneElement(
    row,
    undefined,
    Children.map(row.props.children as ReactNode, (cell, index) => {
      if (!isValidElement(cell)) return cell;
      const label = labels[index] ?? "項目";
      const value = textFromNode(cell.props.children as ReactNode);
      const numeric = numericColumnPattern.test(label);

      return cloneElement(cell, {
        "data-rich-label": label,
        "data-rich-numeric": numeric ? "true" : undefined,
        "aria-label": value ? `${label}: ${value}` : label
      });
    })
  );
}

function annotateResponsiveTable(children: ReactNode): ReactNode {
  const table = Children.toArray(children).find(isValidElement) as ReactElement<{ children?: ReactNode }> | undefined;
  if (!table) return children;

  const tableChildren = Children.toArray(table.props.children as ReactNode);
  const header = tableChildren.find((child) => isNamedTableElement(child, "TableHeader"));
  const labels = header
    ? Children.toArray(header.props.children as ReactNode)
        .find(isValidElement)
        ? Children.toArray(
            (Children.toArray(header.props.children as ReactNode).find(isValidElement) as ReactElement<{ children?: ReactNode }>).props.children
          ).map(textFromNode)
        : []
    : [];

  return cloneElement(
    table,
    undefined,
    tableChildren.map((child) => {
      if (!isNamedTableElement(child, "TableBody")) return child;

      const body = child;

      return cloneElement(
        body,
        undefined,
        Children.map(body.props.children, (row) => {
          if (!isNamedTableElement(row, "TableRow")) return row;
          return labelTableCells(row, labels);
        })
      );
    })
  );
}

export function DataRichTableWrap({
  children,
  compactAt1280 = false
}: {
  children: ReactNode;
  compactAt1280?: boolean;
}) {
  return (
    <div className={cn(
      "min-w-0 border border-[#E5E7EB] [&>div]:overflow-x-clip [&_table]:!w-full [&_th]:!w-auto [&_th[data-rich-numeric=true]]:text-right [&_td[data-rich-numeric=true]]:text-right [&_td[data-rich-numeric=true]]:tabular-nums [&_td_a]:inline-flex [&_td_a]:min-h-11 [&_td_a]:items-center [&_td_a]:rounded-sm [&_td_a]:focus-visible:outline-none [&_td_a]:focus-visible:ring-2 [&_td_a]:focus-visible:ring-[#0B382D] [&_td_a]:focus-visible:ring-offset-2 [&_td_button]:min-h-11",
      compactAt1280
        ? "min-[1360px]:[&>div]:overflow-visible min-[1360px]:[&_th]:sticky min-[1360px]:[&_th]:top-16 min-[1360px]:[&_th]:z-20 min-[1360px]:[&_th]:border-b min-[1360px]:[&_th]:border-[#D9E2DE] min-[1360px]:[&_th]:bg-[#F6F9F7] min-[1360px]:[&_tbody_tr]:transition-colors min-[1360px]:[&_tbody_tr:hover]:bg-[#F3F8F5] min-[1360px]:[&_tbody_tr:focus-within]:bg-[#EEF7F2] max-[1359px]:[&_table]:block max-[1359px]:[&_thead]:hidden max-[1359px]:[&_tbody]:block max-[1359px]:[&_tbody_tr]:my-3 max-[1359px]:[&_tbody_tr]:block max-[1359px]:[&_tbody_tr]:border max-[1359px]:[&_tbody_tr]:border-[#DDE5E1] max-[1359px]:[&_tbody_tr]:bg-white max-[1359px]:[&_tbody_tr:first-child]:mt-0 max-[1359px]:[&_tbody_tr:last-child]:mb-0 max-[1359px]:[&_td]:!w-full max-[1359px]:[&_td]:grid max-[1359px]:[&_td]:grid-cols-1 max-[1359px]:[&_td]:gap-1 max-[1359px]:[&_td]:border-0 max-[1359px]:[&_td]:border-b max-[1359px]:[&_td]:border-[#EEF1F0] max-[1359px]:[&_td]:px-4 max-[1359px]:[&_td]:py-2.5 max-[1359px]:[&_td]:text-left max-[1359px]:[&_td]:align-top max-[1359px]:[&_td:last-child]:border-b-0 max-[1359px]:[&_td]:before:content-[attr(data-rich-label)] max-[1359px]:[&_td]:before:text-[11px] max-[1359px]:[&_td]:before:font-bold max-[1359px]:[&_td]:before:leading-5 max-[1359px]:[&_td]:before:text-[#5D6B66] max-[1359px]:[&_td]:before:[word-break:normal] sm:max-[1359px]:[&_td]:grid-cols-[minmax(170px,30%)_minmax(0,1fr)] sm:max-[1359px]:[&_td]:gap-4 max-[1359px]:[&_td[data-rich-numeric=true]]:text-right"
        : "xl:[&>div]:overflow-visible xl:[&_th]:sticky xl:[&_th]:top-16 xl:[&_th]:z-20 xl:[&_th]:border-b xl:[&_th]:border-[#D9E2DE] xl:[&_th]:bg-[#F6F9F7] xl:[&_tbody_tr]:transition-colors xl:[&_tbody_tr:hover]:bg-[#F3F8F5] xl:[&_tbody_tr:focus-within]:bg-[#EEF7F2] max-xl:[&_table]:block max-xl:[&_thead]:hidden max-xl:[&_tbody]:block max-xl:[&_tbody_tr]:my-3 max-xl:[&_tbody_tr]:block max-xl:[&_tbody_tr]:border max-xl:[&_tbody_tr]:border-[#DDE5E1] max-xl:[&_tbody_tr]:bg-white max-xl:[&_tbody_tr:first-child]:mt-0 max-xl:[&_tbody_tr:last-child]:mb-0 max-xl:[&_td]:!w-full max-xl:[&_td]:grid max-xl:[&_td]:grid-cols-1 max-xl:[&_td]:gap-1 max-xl:[&_td]:border-0 max-xl:[&_td]:border-b max-xl:[&_td]:border-[#EEF1F0] max-xl:[&_td]:px-4 max-xl:[&_td]:py-2.5 max-xl:[&_td]:text-left max-xl:[&_td]:align-top max-xl:[&_td:last-child]:border-b-0 max-xl:[&_td]:before:content-[attr(data-rich-label)] max-xl:[&_td]:before:text-[11px] max-xl:[&_td]:before:font-bold max-xl:[&_td]:before:leading-5 max-xl:[&_td]:before:text-[#5D6B66] max-xl:[&_td]:before:[word-break:normal] sm:max-xl:[&_td]:grid-cols-[minmax(170px,30%)_minmax(0,1fr)] sm:max-xl:[&_td]:gap-4 max-xl:[&_td[data-rich-numeric=true]]:text-right"
    )}>
      {annotateResponsiveTable(children)}
    </div>
  );
}
