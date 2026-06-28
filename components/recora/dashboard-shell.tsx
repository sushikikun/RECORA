"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PanelTop, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecoraNavGroup, RecoraNavItem, RecoraNavSection } from "@/lib/recora/nav-config";
import { buildRecoraNavGroups } from "@/lib/recora/nav-config";
import {
  resolveRecoraVisualVariant,
  withRecoraVisualVariantSearchParam,
  type RecoraVisualVariant
} from "@/lib/recora/dev-preview/design-visual-variant-core";
import {
  RECORA_REAL_DB_PREVIEW_SEARCH_PARAM,
  RECORA_REAL_DB_PREVIEW_SEARCH_VALUE,
  getRecoraRealDbPreviewProjectDisplayName,
  withRecoraRealDbPreviewSearchParam
} from "@/lib/recora/dev-preview/real-db-preview-url";
import {
  CUSTOMER_REPORT_DESIGN_LAB_PROJECT_NAME,
  CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG,
  CUSTOMER_REPORT_DESIGN_LAB_SEARCH_PARAM,
  CUSTOMER_REPORT_DESIGN_LAB_SEARCH_VALUE,
  withCustomerReportDesignLabSearchParam
} from "@/lib/recora/customer-report-design-lab/url";

const alwaysVisibleSections: RecoraNavSection[] = ["ホーム", "レポート", "プロジェクト管理", "ワークスペース"];
const reportContextSettingPaths = [
  "/dashboard/config/personas",
  "/dashboard/config/topics-prompts",
  "/dashboard/config/competitors",
  "/dashboard/config/models"
];

function getSelectedReportId(pathname: string) {
  const match = pathname.match(/^\/dashboard\/reports\/([^/]+)(?:\/.*)?$/);
  const segment = match?.[1];

  if (!segment || segment === "history") {
    return undefined;
  }

  return segment;
}

function isNavItemActive(item: RecoraNavItem, pathname: string) {
  if (item.href === "/dashboard" || item.href === "/dashboard/reports") {
    return pathname === item.href;
  }

  if (/^\/dashboard\/reports\/[^/]+$/.test(item.href)) {
    return pathname === item.href;
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );
}

function isAlwaysVisibleSection(section: RecoraNavSection) {
  return alwaysVisibleSections.includes(section);
}

function isReportContextSettingPath(pathname: string) {
  return reportContextSettingPaths.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

function getActiveSection(navGroups: RecoraNavGroup[], pathname: string) {
  return navGroups.find((group) => group.items.some((item) => isNavItemActive(item, pathname)))?.label;
}

function buildInitialExpandedSections(navGroups: RecoraNavGroup[], pathname: string) {
  const activeSection = getActiveSection(navGroups, pathname);

  return Object.fromEntries(
    navGroups
      .filter((group) => !isAlwaysVisibleSection(group.label))
      .map((group) => [
        group.label,
        group.label === activeSection || group.label === "プロジェクト管理" || group.label === "ワークスペース"
      ])
  ) as Partial<Record<RecoraNavSection, boolean>>;
}

export function DashboardShell({
  children,
  designPreviewEnabled = false
}: {
  children: React.ReactNode;
  designPreviewEnabled?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visualVariant = resolveRecoraVisualVariant(searchParams.get("visual"), designPreviewEnabled);
  const realDbPreviewActive =
    searchParams.get(RECORA_REAL_DB_PREVIEW_SEARCH_PARAM) === RECORA_REAL_DB_PREVIEW_SEARCH_VALUE;
  const customerReportDesignLabActive =
    searchParams.get(CUSTOMER_REPORT_DESIGN_LAB_SEARCH_PARAM) === CUSTOMER_REPORT_DESIGN_LAB_SEARCH_VALUE;
  const routeReportId = getSelectedReportId(pathname);
  const reportId = customerReportDesignLabActive ? CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG : routeReportId;
  const isDataRichFinal = visualVariant === "data-rich-final" && !customerReportDesignLabActive;
  const projectCardLabel = customerReportDesignLabActive
    ? CUSTOMER_REPORT_DESIGN_LAB_PROJECT_NAME
    : realDbPreviewActive
      ? getRecoraRealDbPreviewProjectDisplayName(routeReportId)
      : "Recora";
  const showReportContextItems = customerReportDesignLabActive || Boolean(routeReportId) || isReportContextSettingPath(pathname);
  const withPreviewHref = (href: string) => {
    const previewHref = withRecoraRealDbPreviewSearchParam(
      withRecoraVisualVariantSearchParam(href, visualVariant),
      realDbPreviewActive
    );
    return customerReportDesignLabActive ? withCustomerReportDesignLabSearchParam(previewHref) : previewHref;
  };
  const currentReportHref = withPreviewHref(reportId ? `/dashboard/reports/${reportId}` : "/dashboard/reports");
  const navGroups = useMemo(
    () => buildRecoraNavGroups(reportId, { showReportContextItems, showCustomerWorkspaceItems: customerReportDesignLabActive }),
    [reportId, showReportContextItems, customerReportDesignLabActive]
  );
  const activeSection = getActiveSection(navGroups, pathname);
  const [expandedSections, setExpandedSections] = useState<Partial<Record<RecoraNavSection, boolean>>>(() =>
    buildInitialExpandedSections(navGroups, pathname)
  );

  useEffect(() => {
    setExpandedSections(buildInitialExpandedSections(navGroups, pathname));
  }, [navGroups, pathname]);

  function toggleSection(section: RecoraNavSection) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section]
    }));
  }

  if (isDataRichFinal) {
    return (
      <div className="min-h-screen bg-[#F6F8F7] text-[#0F172A]" data-recora-visual={visualVariant}>
        <div className="grid min-h-screen lg:grid-cols-[204px_minmax(0,1fr)]">
          <aside className="border-b border-[#DFE6E2] bg-white text-[#0F172A] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col bg-white">
              <div className="px-3 py-3">
                <Link href={withPreviewHref("/dashboard")} className="flex items-center gap-2 rounded-md px-1 py-1 transition hover:bg-[#F6F8F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/80">
                  <LogoMark />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold tracking-normal text-[#0F172A]">Recora</span>
                    <span className="block truncate text-[11px] font-semibold text-[#64748B]">レポート管理</span>
                  </span>
                </Link>

                <div className="mt-3 rounded-md border border-[#DFE6E2] bg-[#FAFCFB] p-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                    <PanelTop className="h-3.5 w-3.5 text-[#006B57]" strokeWidth={1.8} />
                    プロジェクト
                  </div>
                  <Link
                    href={currentReportHref}
                    title={projectCardLabel}
                    className="mt-1.5 block rounded-sm text-[13px] font-bold leading-5 text-[#0F172A] transition hover:text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/80"
                  >
                    <span className="line-clamp-2 break-words">{projectCardLabel}</span>
                  </Link>
                  <div className="mt-1 truncate text-[11px] font-semibold text-[#64748B]">
                    {reportId ? "選択中のレポート" : "レポート一覧から選択"}
                  </div>
                </div>
              </div>

              <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                {navGroups.map((group) => (
                  <NavGroup
                    key={group.label}
                    group={group}
                    pathname={pathname}
                    activeSection={activeSection}
                    expanded={expandedSections[group.label] ?? false}
                    onToggle={toggleSection}
                    withVisualHref={withPreviewHref}
                    variant="data-rich-final"
                  />
                ))}
              </nav>

              <div className="border-t border-[#DFE6E2] p-3">
                <div className="rounded-md border border-[#DFE6E2] bg-[#FAFCFB] p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#DFE6E2] bg-white text-[#006B57]">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold text-[#0F172A]">Recora ワークスペース</p>
                      <p className="truncate text-[11px] text-[#64748B]">プロダクト管理</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 bg-[#F6F8F7]">
            <div className="mx-auto w-full max-w-[1504px] px-4 py-4 sm:px-5 lg:px-6 xl:px-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen text-[#0F172A]", customerReportDesignLabActive ? "bg-white" : "bg-[#F7F9FA]")} data-recora-visual={visualVariant}>
      <div className={cn("grid min-h-screen", customerReportDesignLabActive ? "lg:grid-cols-[240px_minmax(0,1fr)]" : "lg:grid-cols-[220px_minmax(0,1fr)]")}>
        <aside className="border-b border-[#0B4E44]/20 bg-[#081720] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10">
          <div className={cn("flex h-full flex-col", customerReportDesignLabActive ? "bg-[linear-gradient(180deg,#0B1B28_0%,#081923_42%,#06131B_100%)]" : "bg-[linear-gradient(180deg,#003F36_0%,#00372F_48%,#002C26_100%)]")}>
            <div className={cn(customerReportDesignLabActive ? "px-3 py-5" : "px-2.5 py-2.5")}>
              <Link href={withPreviewHref("/dashboard")} className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE1C3]/80">
                <LogoMark />
                <span>
                  <span className={cn("block font-bold tracking-normal text-white", customerReportDesignLabActive ? "text-[22px] leading-7" : "text-base")}>Recora</span>
                  {customerReportDesignLabActive ? null : <span className="block text-xs font-medium text-[#A8DAD2]">レコラ</span>}
                </span>
              </Link>

              <div className={cn("rounded-md border border-white/10 bg-white/[0.04]", customerReportDesignLabActive ? "mt-5 p-3" : "mt-2 p-2")}>
                <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#D7E7E4]">
                  <span className="flex items-center gap-1.5">
                    <PanelTop className="h-3.5 w-3.5 text-[#6FE1C3]" strokeWidth={1.8} />
                    {customerReportDesignLabActive ? "プロジェクト" : "現在のプロジェクト"}
                  </span>
                  {customerReportDesignLabActive ? <ChevronDown className="h-4 w-4 text-[#D7E7E4]" aria-hidden="true" strokeWidth={1.8} /> : null}
                </div>
                <Link
                  href={currentReportHref}
                  title={projectCardLabel}
                  className="mt-2 block rounded-md text-[13px] font-bold leading-6 text-white transition hover:text-[#6FE1C3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE1C3]/80"
                >
                  <span className="line-clamp-2 break-words">{projectCardLabel}</span>
                </Link>
                {customerReportDesignLabActive ? null : (
                  <div className="mt-1.5 text-[11px] font-semibold text-[#9ECFC7]">
                    {routeReportId ? "現在のレポート" : "レポート一覧から選択"}
                  </div>
                )}
              </div>
            </div>

            <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-3">
              {navGroups.map((group) => (
                <NavGroup
                  key={group.label}
                  group={group}
                  pathname={pathname}
                  activeSection={activeSection}
                  expanded={expandedSections[group.label] ?? false}
                  onToggle={toggleSection}
                  withVisualHref={withPreviewHref}
                />
              ))}
              <div className="pointer-events-none sticky bottom-0 h-6 bg-gradient-to-t from-[#06131B] to-transparent" />
            </nav>

            {customerReportDesignLabActive ? null : (
              <div className="border-t border-white/10 p-2">
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#6FE1C3]/12 text-[#6FE1C3]">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-white">Recora ワークスペース</p>
                      <p className="truncate text-[11px] text-[#9ECFC7]">プロダクト管理</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className={cn("min-w-0", customerReportDesignLabActive ? "bg-white" : "bg-transparent")}>
          <div className={cn("mx-auto w-full", customerReportDesignLabActive ? "max-w-none px-4 py-4 sm:px-5 lg:px-5 xl:px-5" : "max-w-[1504px] px-4 py-5 sm:px-5 lg:px-6 xl:px-7")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
function LogoMark() {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#E6F4F1] text-[13px] font-black text-[#003F36] ring-1 ring-white/20">
      <span className="absolute bottom-1.5 left-1.5 flex items-end gap-0.5" aria-hidden="true">
        <span className="h-2 w-1 rounded-sm bg-[#00796B]/75" />
        <span className="h-3 w-1 rounded-sm bg-[#00796B]/75" />
        <span className="h-4 w-1 rounded-sm bg-[#00796B]/75" />
      </span>
      <span className="relative ml-2">R</span>
    </span>
  );
}

function NavGroup({
  group,
  pathname,
  activeSection,
  expanded,
  onToggle,
  withVisualHref,
  variant = "legacy-current"
}: {
  group: RecoraNavGroup;
  pathname: string;
  activeSection?: RecoraNavSection;
  expanded: boolean;
  onToggle: (section: RecoraNavSection) => void;
  withVisualHref: (href: string) => string;
  variant?: RecoraVisualVariant;
}) {
  const isAlwaysVisible = isAlwaysVisibleSection(group.label);
  const isActiveSection = group.label === activeSection;
  const isDataRichFinal = variant === "data-rich-final";
  const visibleItems =
    isAlwaysVisible || expanded
      ? group.items
      : group.items.filter((item) => isNavItemActive(item, pathname));

  if (isAlwaysVisible) {
    return (
      <div className={cn(group.label === "プロジェクト管理" && "mt-5 border-t border-white/15 pt-5")}>
        <div className="mt-1 space-y-1">
          {group.items.map((item, index) => (
            <NavLink
              key={`${item.label}-${item.href}`}
              item={item}
              pathname={pathname}
              withVisualHref={withVisualHref}
              variant={variant}
              nested={group.label === "レポート" && index > 0}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`recora-sidebar-${group.label}`}
        onClick={() => onToggle(group.label)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2",
          isDataRichFinal
            ? "text-[#64748B] hover:bg-[#F6F9F8] hover:text-[#1E293B] focus:ring-[#006B57]/80"
            : "text-[#9ECFC7] hover:bg-white/8 hover:text-white focus:ring-[#6FE1C3]/80",
          isActiveSection && (isDataRichFinal ? "bg-[#EAF6F0] text-[#005548]" : "bg-white/10 text-white")
        )}
      >
        <span>{group.label}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.8} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.8} />
        )}
      </button>
      <div id={`recora-sidebar-${group.label}`} className="mt-1 space-y-1">
        {visibleItems.map((item) => (
          <NavLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} nested withVisualHref={withVisualHref} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  nested = false,
  withVisualHref,
  variant = "legacy-current"
}: {
  item: RecoraNavItem;
  pathname: string;
  nested?: boolean;
  withVisualHref: (href: string) => string;
  variant?: RecoraVisualVariant;
}) {
  const Icon = item.icon;
  const isActive = isNavItemActive(item, pathname);
  const isDataRichFinal = variant === "data-rich-final";

  return (
    <Link
      href={withVisualHref(item.href)}
      title={item.description ?? item.label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex min-h-10 items-center gap-2.5 rounded-md border-l-[3px] border-transparent px-3 py-2 text-[14px] font-bold transition-colors",
        isDataRichFinal
          ? "text-[#475569] hover:bg-[#F6F9F8] hover:text-[#1E293B]"
          : "text-[#B8DAD4] hover:bg-white/8 hover:text-white",
        nested && "ml-1.5 pl-2",
        isActive && (isDataRichFinal ? "border-[#006B57] bg-[#EAF6F0] text-[#005548]" : "border-transparent bg-[#064C3F] text-white")
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-current" strokeWidth={1.85} />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.status === "preparing" ? (
          <span
            className={cn(
              "mt-0.5 inline-flex rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[#9ECFC7]",
              isDataRichFinal && "bg-[#FAFCFB] text-[#64748B]",
              isActive && (isDataRichFinal ? "bg-white text-[#006B57]" : "bg-[#E6F4F1] text-[#00796B]")
            )}
          >
            準備中
          </span>
        ) : null}
      </span>
    </Link>
  );
}
