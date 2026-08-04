"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Database,
  ExternalLink,
  FileSearch,
  GitCompareArrows,
  Link2,
  ListOrdered,
  ListTree,
  PanelRightOpen,
  X
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type AriaRole,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode
} from "react";

import { cn } from "@/lib/utils";

export type ReportDetailTone = "default" | "green" | "amber" | "red";

export type ReportDetailFact = {
  label: string;
  value: string;
  note?: string;
  tone?: ReportDetailTone;
};

export type ReportDetailListItem = {
  title: string;
  meta?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export type ReportDetailSectionVariant =
  | "facts"
  | "comparison"
  | "ranking"
  | "source"
  | "observation"
  | "trace";

export type ReportDetailSection = {
  title: string;
  description?: string;
  variant?: ReportDetailSectionVariant;
  collapsed?: boolean;
  facts?: ReportDetailFact[];
  items?: ReportDetailListItem[];
  table?: {
    columns: string[];
    rows: string[][];
  };
};

export type ReportDetailPayload = {
  kicker?: string;
  title: string;
  value?: string;
  summary?: string;
  scope?: ReportDetailFact[];
  sections: ReportDetailSection[];
  detailHref?: string;
  detailLabel?: string;
};

export type ReportDetailScope = {
  periodLabel: string;
  period: string;
  modelCount: string;
  validObservations: string;
  missingObservations: string;
};

const reportDetailEvent = "recora:open-report-detail";

export function ReportDetailScopeProvider({
  value: _value,
  children
}: {
  value: ReportDetailScope;
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useReportDetailScope() {
  return null;
}

export function reportScopeFacts(_scope: ReportDetailScope | null): ReportDetailFact[] {
  return [];
}

export function openReportDetail(detail: ReportDetailPayload) {
  window.dispatchEvent(new CustomEvent<ReportDetailPayload>(reportDetailEvent, { detail }));
}

export function useReportDetailController() {
  const [detail, setDetail] = useState<ReportDetailPayload | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setDetail(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const open = (event: Event) => {
      if (!(event instanceof CustomEvent) || !event.detail?.title || !Array.isArray(event.detail?.sections)) return;
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setDetail(event.detail as ReportDetailPayload);
    };
    window.addEventListener(reportDetailEvent, open);
    return () => window.removeEventListener(reportDetailEvent, open);
  }, []);

  return { detail, close };
}

export function ReportDetailButton({
  detail,
  children,
  className,
  label,
  showIcon = true,
  openInPage = false,
  role,
  style
}: {
  detail: ReportDetailPayload;
  children: ReactNode;
  className?: string;
  label?: string;
  showIcon?: boolean;
  openInPage?: boolean;
  role?: AriaRole;
  style?: CSSProperties;
}) {
  const defaultLabel = detail.title.endsWith("内訳") ? `${detail.title}を開く` : `${detail.title}の内訳を開く`;
  const interactiveClassName = cn(
    "group inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2",
    className
  );

  if (openInPage && detail.detailHref) {
    return (
      <Link
        href={detail.detailHref}
        aria-label={label ?? detail.detailLabel ?? `${detail.title}を分析する`}
        role={role}
        style={style}
        className={interactiveClassName}
      >
        {children}
        {showIcon ? <ArrowRight className="h-4 w-4 shrink-0 text-[#6A7A74] transition group-hover:translate-x-0.5 group-hover:text-[#075E44]" strokeWidth={1.8} aria-hidden="true" /> : null}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openReportDetail(detail)}
      aria-label={label ?? defaultLabel}
      aria-haspopup="dialog"
      role={role}
      style={style}
      className={interactiveClassName}
    >
      {children}
      {showIcon ? <PanelRightOpen className="h-4 w-4 shrink-0 text-[#6A7A74] transition group-hover:translate-x-0.5 group-hover:text-[#075E44]" strokeWidth={1.8} aria-hidden="true" /> : null}
    </button>
  );
}

function factTone(tone: ReportDetailTone | undefined) {
  if (tone === "green") return "text-[#075E44]";
  if (tone === "amber") return "text-[#8A4B00]";
  if (tone === "red") return "text-[#B42318]";
  return "text-[#101828]";
}

function parseExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { href: url.toString(), label: `${url.hostname}${url.pathname}${url.search}${url.hash}` };
  } catch {
    return null;
  }
}

function ExternalUrlValue({ value, className }: { value: string; className?: string }) {
  const externalUrl = parseExternalUrl(value);
  if (!externalUrl) return <span className={className}>{value}</span>;
  return (
    <a
      href={externalUrl.href}
      target="_blank"
      rel="noopener noreferrer"
      title={value}
      aria-label={`${value}を外部サイトで開く`}
      className={cn("inline-flex min-w-0 max-w-full items-start gap-1.5 font-semibold text-[#075E44] underline decoration-[#9AB8AA] underline-offset-2 transition hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2", className)}
    >
      <span className="min-w-0 break-all [overflow-wrap:anywhere]">{externalUrl.label}</span>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}

type ReportDetailTable = NonNullable<ReportDetailSection["table"]>;
type ResolvedReportDetailSectionVariant = ReportDetailSectionVariant | "default";

function resolveSectionVariant(section: ReportDetailSection): ResolvedReportDetailSectionVariant {
  return section.variant ?? "default";
}

function DetailSectionIcon({
  section,
  sectionIndex
}: {
  section: ReportDetailSection;
  sectionIndex: number;
}) {
  const variant = resolveSectionVariant(section);
  const Icon = variant === "comparison"
    ? GitCompareArrows
    : variant === "ranking"
      ? ListOrdered
      : variant === "source"
        ? Link2
        : variant === "observation"
          ? FileSearch
          : variant === "trace"
            ? Database
            : section.table
              ? Database
              : section.items
                ? ListTree
                : sectionIndex === 0
                  ? GitCompareArrows
                  : Database;

  return (
    <span className={cn(
      "mt-0.5 inline-grid h-8 w-8 shrink-0 place-items-center rounded-md",
      variant === "trace" ? "bg-[#F0F3F2] text-[#667085]" : "bg-[#EDF6F2] text-[#075E44]"
    )}>
      <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

function DetailSectionHeading({
  section,
  sectionIndex,
  collapsible = false
}: {
  section: ReportDetailSection;
  sectionIndex: number;
  collapsible?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <DetailSectionIcon section={section} sectionIndex={sectionIndex} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[17px] font-semibold leading-6 text-[#101828]">{section.title}</h3>
        {section.description ? <p className="mt-1 text-[13px] font-medium leading-6 text-[#667085]">{section.description}</p> : null}
      </div>
      {collapsible ? (
        <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#667085] transition-transform group-open:rotate-180 motion-reduce:transition-none" strokeWidth={1.8} aria-hidden="true" />
      ) : null}
    </div>
  );
}

function DetailFacts({
  facts,
  variant
}: {
  facts: ReportDetailFact[];
  variant: ResolvedReportDetailSectionVariant;
}) {
  if (variant === "observation") {
    return (
      <dl className="mt-4 grid gap-px overflow-hidden border border-[#DCE5E1] bg-[#DCE5E1] sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={`${fact.label}-${fact.value}`} className="min-w-0 bg-white px-3.5 py-3.5">
            <dt className="text-[11px] font-bold leading-5 text-[#667085]">{fact.label}</dt>
            <dd className="mt-1 min-w-0">
              <ExternalUrlValue value={fact.value} className={cn("break-words text-sm font-semibold leading-6 tabular-nums", factTone(fact.tone))} />
              {fact.note ? <p className="mt-0.5 text-[12px] font-medium leading-5 text-[#667085]">{fact.note}</p> : null}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn(
      "mt-4 divide-y divide-[#E8ECEA] border-y border-[#E0E6E3]",
      variant === "source" && "border-l-2 border-l-[#9AB8AA] pl-3",
      variant === "trace" && "bg-[#FAFBFB] px-3"
    )}>
      {facts.map((fact) => (
        <div key={`${fact.label}-${fact.value}`} className="grid min-w-0 grid-cols-[minmax(105px,0.42fr)_minmax(0,1fr)] gap-4 py-3.5">
          <dt className="text-xs font-bold leading-5 text-[#667085]">{fact.label}</dt>
          <dd className="min-w-0">
            <ExternalUrlValue value={fact.value} className={cn("break-words text-sm font-semibold leading-6 tabular-nums", factTone(fact.tone))} />
            {fact.note ? <p className="mt-0.5 text-[12px] font-medium leading-5 text-[#667085]">{fact.note}</p> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailItems({
  items,
  variant
}: {
  items: ReportDetailListItem[];
  variant: ResolvedReportDetailSectionVariant;
}) {
  return (
    <ol className={cn(
      "mt-4 divide-y divide-[#E8ECEA] border-y border-[#E0E6E3]",
      variant === "source" && "border-l-2 border-l-[#9AB8AA] pl-3",
      variant === "trace" && "bg-[#FAFBFB] px-3"
    )}>
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] gap-3 py-3.5">
          <span className={cn(
            "pt-0.5 text-[12px] font-bold tabular-nums text-[#667085]",
            variant === "ranking" && "text-[#075E44]"
          )} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            {variant === "source" ? (
              <ExternalUrlValue value={item.title} className="break-words text-sm font-semibold leading-6 text-[#101828]" />
            ) : (
              <p className="break-words text-sm font-semibold leading-6 text-[#101828]">{item.title}</p>
            )}
            {item.meta ? <p className="mt-0.5 text-[12px] font-bold leading-5 text-[#075E44]">{item.meta}</p> : null}
            {item.description ? <p className="mt-1 text-[13px] font-medium leading-6 text-[#667085]">{item.description}</p> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-md text-[12px] font-bold text-[#075E44] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2"
              >
                {item.linkLabel ?? "詳しく見る"}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function LegacyRecordTable({ table }: { table: ReportDetailTable }) {
  return (
    <div className="mt-4 divide-y divide-[#DCE5E1] border-y border-[#DCE5E1]">
      {table.rows.map((row, rowIndex) => (
        <dl key={String(rowIndex)} className="divide-y divide-[#E8ECEA] bg-white py-1">
          {table.columns.map((column, columnIndex) => (
            <div key={`${column}-${columnIndex}`} className="grid min-w-0 grid-cols-[minmax(120px,0.38fr)_minmax(0,1fr)] gap-4 px-1 py-3">
              <dt className="text-[12px] font-bold leading-5 text-[#667085]">{column}</dt>
              <dd className="min-w-0 break-words text-[13px] font-semibold leading-6 text-[#101828]"><ExternalUrlValue value={row[columnIndex] ?? "?"} /></dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}

function SemanticRecordTable({
  table,
  variant
}: {
  table: ReportDetailTable;
  variant: Exclude<ResolvedReportDetailSectionVariant, "default" | "facts">;
}) {
  const [primaryColumn = "??", ...secondaryColumns] = table.columns;

  return (
    <div className={cn(
      "mt-4 divide-y divide-[#DCE5E1] border-y border-[#DCE5E1]",
      variant === "source" && "border-l-2 border-l-[#9AB8AA]",
      variant === "trace" && "bg-[#FAFBFB]"
    )}>
      {table.rows.map((row, rowIndex) => (
        <article key={String(rowIndex)} className={cn("min-w-0 py-4", variant === "source" && "pl-3", variant === "trace" && "px-3")}>
          <div className="flex min-w-0 items-start gap-3">
            {variant === "ranking" ? <span className="pt-0.5 text-[12px] font-bold tabular-nums text-[#075E44]">{String(rowIndex + 1).padStart(2, "0")}</span> : null}
            {variant === "source" ? <Link2 className="mt-1 h-4 w-4 shrink-0 text-[#075E44]" strokeWidth={1.8} aria-hidden="true" /> : null}
            {variant === "observation" ? <FileSearch className="mt-1 h-4 w-4 shrink-0 text-[#075E44]" strokeWidth={1.8} aria-hidden="true" /> : null}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold leading-5 text-[#667085]">{primaryColumn}</p>
              <ExternalUrlValue value={row[0] ?? "?"} className="mt-0.5 break-words text-sm font-semibold leading-6 text-[#101828]" />
            </div>
          </div>
          {secondaryColumns.length ? (
            <dl className="mt-3 divide-y divide-[#E8ECEA] border-t border-[#E8ECEA]">
              {secondaryColumns.map((column, columnIndex) => (
                <div key={`${column}-${columnIndex}`} className="grid min-w-0 grid-cols-[minmax(105px,0.38fr)_minmax(0,1fr)] gap-3 py-2.5">
                  <dt className="text-[11px] font-bold leading-5 text-[#667085]">{column}</dt>
                  <dd className="min-w-0 break-words text-[13px] font-semibold leading-5 text-[#101828]"><ExternalUrlValue value={row[columnIndex + 1] ?? "?"} /></dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function CompactComparisonTable({ table }: { table: ReportDetailTable }) {
  return (
    <>
      <div className="mt-4 hidden overflow-hidden border border-[#DCE5E1] md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-[#F5F8F6]">
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col" className="border-b border-r border-[#DCE5E1] px-3 py-3 text-[11px] font-bold leading-5 text-[#667085] last:border-r-0">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAE8] bg-white">
            {table.rows.map((row, rowIndex) => (
              <tr key={String(rowIndex)}>
                {table.columns.map((column, columnIndex) => (
                  <td key={`${column}-${columnIndex}`} className="border-r border-[#E5EAE8] px-3 py-3 align-top text-[12px] font-semibold leading-5 text-[#101828] last:border-r-0 [overflow-wrap:anywhere]">
                    <ExternalUrlValue value={row[columnIndex] ?? "?"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden">
        <SemanticRecordTable table={table} variant="comparison" />
      </div>
    </>
  );
}

function DetailTable({
  table,
  variant
}: {
  table: ReportDetailTable;
  variant: ResolvedReportDetailSectionVariant;
}) {
  if (variant === "comparison" && table.columns.length <= 4) return <CompactComparisonTable table={table} />;
  if (["comparison", "ranking", "source", "observation", "trace"].includes(variant)) {
    return <SemanticRecordTable table={table} variant={variant as "comparison" | "ranking" | "source" | "observation" | "trace"} />;
  }
  return <LegacyRecordTable table={table} />;
}

function DetailSectionBody({ section }: { section: ReportDetailSection }) {
  const variant = resolveSectionVariant(section);
  return (
    <>
      {section.facts?.length ? <DetailFacts facts={section.facts} variant={variant} /> : null}
      {section.items?.length ? <DetailItems items={section.items} variant={variant} /> : null}
      {section.table ? <DetailTable table={section.table} variant={variant} /> : null}
    </>
  );
}

function DetailSectionBlock({
  section,
  sectionIndex
}: {
  section: ReportDetailSection;
  sectionIndex: number;
}) {
  const variant = resolveSectionVariant(section);
  const className = cn(
    "border-b border-[#E5EAE8] last:border-b-0",
    variant === "trace" && "text-[#475467]"
  );

  if (section.collapsed) {
    return (
      <details className={cn("group", className)}>
        <summary className="cursor-pointer list-none py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B382D] [&::-webkit-details-marker]:hidden">
          <DetailSectionHeading section={section} sectionIndex={sectionIndex} collapsible />
        </summary>
        <div className="-mt-1 pb-6">
          <DetailSectionBody section={section} />
        </div>
      </details>
    );
  }

  return (
    <section className={cn("py-6", className)}>
      <DetailSectionHeading section={section} sectionIndex={sectionIndex} />
      <DetailSectionBody section={section} />
    </section>
  );
}

export function ReportDetailDrawer({
  detail,
  onClose
}: {
  detail: ReportDetailPayload;
  onClose: () => void;
}) {
  const titleId = useId();
  const summaryId = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, []);

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="データ詳細を閉じる"
        className="absolute inset-0 h-full w-full bg-[#0F172A]/20"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={detail.summary ? summaryId : undefined}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto overscroll-contain border-l border-[#D7E0DC] bg-white shadow-[-24px_0_72px_rgba(15,23,42,0.16)] sm:max-w-[680px]"
      >
        <header className="sticky top-0 z-20 border-b border-[#DCE5E1] bg-white/96 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#075E44]">{detail.kicker ?? "選択したデータ"}</p>
              <h2 id={titleId} className="mt-1.5 break-words text-xl font-semibold leading-7 text-[#101828] sm:text-[26px] sm:leading-8">{detail.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#D7E0DC] bg-white text-[#475467] transition hover:border-[#9AB8AA] hover:bg-[#F4F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        {detail.value || detail.summary ? (
          <section className="border-b border-[#DCE5E1] bg-[#F6FAF8] px-5 py-5 sm:px-7 sm:py-6" aria-label="選択データの要約">
            {detail.value ? <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[#0B382D] sm:text-[44px]">{detail.value}</p> : null}
            {detail.summary ? <p id={summaryId} className="mt-3 max-w-xl text-[14px] font-medium leading-7 text-[#344054]">{detail.summary}</p> : null}
          </section>
        ) : null}

        <div className="flex-1 px-5 py-2 sm:px-7">
          {detail.sections.map((section, sectionIndex) => (
            <DetailSectionBlock key={`${section.title}-${sectionIndex}`} section={section} sectionIndex={sectionIndex} />
          ))}
        </div>

        {detail.detailHref ? (
          <footer className="sticky bottom-0 z-20 border-t border-[#DCE5E1] bg-white/96 px-5 py-4 backdrop-blur sm:px-6">
            <Link
              href={detail.detailHref}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0B382D] px-4 text-sm font-bold text-white transition hover:bg-[#075E44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2"
            >
              {detail.detailLabel ?? "詳しい分析を開く"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </footer>
        ) : null}

      </aside>
    </div>
  );
}
