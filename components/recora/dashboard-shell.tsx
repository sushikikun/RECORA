"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PanelTop, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecoraNavGroup, RecoraNavItem, RecoraNavSection } from "@/lib/recora/nav-config";
import { buildRecoraNavGroups } from "@/lib/recora/nav-config";

const alwaysVisibleSections: RecoraNavSection[] = ["ホーム", "レポート"];
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
      .map((group) => [group.label, group.label === activeSection])
  ) as Partial<Record<RecoraNavSection, boolean>>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reportId = getSelectedReportId(pathname);
  const showReportContextItems = Boolean(reportId) || isReportContextSettingPath(pathname);
  const currentReportHref = reportId ? `/dashboard/reports/${reportId}` : "/dashboard/reports";
  const navGroups = useMemo(
    () => buildRecoraNavGroups(reportId, { showReportContextItems }),
    [reportId, showReportContextItems]
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

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-[#0B4E44]/20 bg-[#003A32] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="flex h-full flex-col bg-[linear-gradient(180deg,#003F36_0%,#00372F_48%,#002C26_100%)]">
            <div className="px-2.5 py-2.5">
              <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE1C3]/80">
                <LogoMark />
                <span>
                  <span className="block text-base font-bold tracking-normal text-white">Recora</span>
                  <span className="block text-xs font-medium text-[#A8DAD2]">レコラ</span>
                </span>
              </Link>

              <div className="mt-2 rounded-md border border-white/10 bg-white/[0.04] p-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9ECFC7]">
                  <PanelTop className="h-3.5 w-3.5 text-[#6FE1C3]" strokeWidth={1.8} />
                  現在のプロジェクト
                </div>
                <Link
                  href={currentReportHref}
                  className="mt-1.5 block rounded-md text-[13px] font-bold leading-5 text-white transition hover:text-[#6FE1C3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE1C3]/80"
                >
                  Recora
                </Link>
                <div className="mt-1.5 text-[11px] font-semibold text-[#9ECFC7]">
                  {reportId ? "現在のレポート" : "レポート一覧から選択"}
                </div>
              </div>
            </div>

            <nav className="relative flex-1 space-y-1 overflow-y-auto px-2.5 pb-3">
              {navGroups.map((group) => (
                <NavGroup
                  key={group.label}
                  group={group}
                  pathname={pathname}
                  activeSection={activeSection}
                  expanded={expandedSections[group.label] ?? false}
                  onToggle={toggleSection}
                />
              ))}
              <div className="pointer-events-none sticky bottom-0 h-6 bg-gradient-to-t from-[#002C26] to-transparent" />
            </nav>

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
          </div>
        </aside>

        <main className="min-w-0 bg-transparent">
          <div className="mx-auto w-full max-w-[1504px] px-4 py-5 sm:px-5 lg:px-6 xl:px-7">
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
  onToggle
}: {
  group: RecoraNavGroup;
  pathname: string;
  activeSection?: RecoraNavSection;
  expanded: boolean;
  onToggle: (section: RecoraNavSection) => void;
}) {
  const isAlwaysVisible = isAlwaysVisibleSection(group.label);
  const isActiveSection = group.label === activeSection;
  const visibleItems =
    isAlwaysVisible || expanded
      ? group.items
      : group.items.filter((item) => isNavItemActive(item, pathname));

  if (isAlwaysVisible) {
    return (
      <div>
        <div className="mt-1 space-y-1">
          {group.items.map((item, index) => (
            <NavLink
              key={`${item.label}-${item.href}`}
              item={item}
              pathname={pathname}
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
          "flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-[10px] font-bold uppercase tracking-wider text-[#9ECFC7] transition-colors hover:bg-white/8 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6FE1C3]/80",
          isActiveSection && "bg-white/10 text-white"
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
          <NavLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} nested />
        ))}
      </div>
    </div>
  );
}

function NavLink({ item, pathname, nested = false }: { item: RecoraNavItem; pathname: string; nested?: boolean }) {
  const Icon = item.icon;
  const isActive = isNavItemActive(item, pathname);

  return (
    <Link
      href={item.href}
      title={item.description ?? item.label}
      className={cn(
        "group flex min-h-8 items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-1.5 text-[13px] font-bold text-[#B8DAD4] transition-colors hover:bg-white/8 hover:text-white",
        nested && "ml-1.5 pl-2",
        isActive && "border-[#6FE1C3] bg-[#E6F4F1] text-[#003F36]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-current" strokeWidth={1.85} />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.status === "preparing" ? (
          <span
            className={cn(
              "mt-0.5 inline-flex rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[#9ECFC7]",
              isActive && "bg-[#E6F4F1] text-[#00796B]"
            )}
          >
            準備中
          </span>
        ) : null}
      </span>
    </Link>
  );
}
