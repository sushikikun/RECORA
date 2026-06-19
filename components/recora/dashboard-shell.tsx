"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PanelTop, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecoraNavGroup, RecoraNavItem, RecoraNavSection } from "@/lib/recora/nav-config";
import { buildRecoraNavGroups } from "@/lib/recora/nav-config";

const alwaysVisibleSection: RecoraNavSection = "ホーム";

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

function getActiveSection(navGroups: RecoraNavGroup[], pathname: string) {
  return navGroups.find((group) => group.items.some((item) => isNavItemActive(item, pathname)))?.label;
}

function buildInitialExpandedSections(navGroups: RecoraNavGroup[], pathname: string) {
  const activeSection = getActiveSection(navGroups, pathname);

  return Object.fromEntries(
    navGroups
      .filter((group) => group.label !== alwaysVisibleSection)
      .map((group) => [group.label, group.label === activeSection])
  ) as Partial<Record<RecoraNavSection, boolean>>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reportId = getSelectedReportId(pathname);
  const currentReportHref = reportId ? `/dashboard/reports/${reportId}` : "/dashboard/reports";
  const navGroups = useMemo(() => buildRecoraNavGroups(reportId), [reportId]);
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
    <div className="min-h-screen bg-[#F6FAF9] text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="border-b border-[#DDE8E5] bg-white text-[#0F172A] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col bg-white">
            <div className="px-5 py-6">
              <Link href="/dashboard" className="flex items-center gap-3 px-1">
                <LogoMark />
                <span>
                  <span className="block text-xl font-bold tracking-tight">Recora</span>
                  <span className="block text-xs font-medium text-[#64748B]">レコラ</span>
                </span>
              </Link>

              <div className="mt-6 rounded-[18px] border border-[#DDE8E5] bg-[#F6FAF9] p-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                  <PanelTop className="h-3.5 w-3.5 text-[#00796B]" />
                  現在のプロジェクト
                </div>
                <Link
                  href={currentReportHref}
                  className="mt-2 block text-sm font-bold leading-5 text-[#0F172A] hover:text-[#00796B]"
                >
                  Recora
                </Link>
                <div className="mt-3 text-xs font-semibold text-[#64748B]">
                  {reportId ? "現在のレポート" : "レポート一覧から選択"}
                </div>
              </div>
            </div>

            <nav className="relative flex-1 space-y-3 overflow-y-auto px-4 pb-7">
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
              <div className="pointer-events-none sticky bottom-0 h-7 bg-gradient-to-t from-white to-transparent" />
            </nav>

            <div className="border-t border-[#DDE8E5] p-4">
              <div className="rounded-[18px] border border-[#DDE8E5] bg-[#F6FAF9] p-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.06)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E6F4F1] text-[#00796B]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#0F172A]">Recora Workspace</p>
                    <p className="truncate text-xs text-[#64748B]">プロダクト管理</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[#F6FAF9]">
          <div className="mx-auto w-full max-w-[1480px] px-4 py-7 sm:px-5 lg:px-7 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#00796B] text-sm font-black text-white shadow-[0_12px_28px_rgba(0,121,107,0.22)]">
      <span className="absolute bottom-2 left-2 flex items-end gap-0.5" aria-hidden="true">
        <span className="h-2 w-1 rounded-sm bg-white/80" />
        <span className="h-3 w-1 rounded-sm bg-white/80" />
        <span className="h-4 w-1 rounded-sm bg-white/80" />
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
  const isAlwaysVisible = group.label === alwaysVisibleSection;
  const isActiveSection = group.label === activeSection;
  const visibleItems =
    isAlwaysVisible || expanded
      ? group.items
      : group.items.filter((item) => isNavItemActive(item, pathname));

  if (isAlwaysVisible) {
    return (
      <div>
        <div className="mt-1 space-y-1">
          {group.items.map((item) => (
            <NavLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} />
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
          "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#64748B] transition-colors hover:bg-[#E6F4F1] hover:text-[#005C50] focus:outline-none focus:ring-2 focus:ring-[#00796B]/70",
          isActiveSection && "bg-[#E6F4F1] text-[#005C50]"
        )}
      >
        <span>{group.label}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
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
        "group flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-[#64748B] transition-colors hover:bg-[#E6F4F1] hover:text-[#005C50]",
        nested && "ml-2 border-l border-[#DDE8E5] pl-3",
        isActive && "bg-[#E6F4F1] text-[#005C50] shadow-[inset_3px_0_0_#00796B]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.status === "preparing" ? (
          <span
            className={cn(
              "mt-0.5 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]",
              isActive && "bg-white text-[#00796B]"
            )}
          >
            準備中
          </span>
        ) : null}
      </span>
    </Link>
  );
}
