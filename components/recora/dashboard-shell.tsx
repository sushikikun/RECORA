"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PanelTop, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecoraNavGroup, RecoraNavItem, RecoraNavSection } from "@/lib/recora/nav-config";
import { buildRecoraNavGroups } from "@/lib/recora/nav-config";
import { sampleProject } from "@/lib/recora/sample-data";

const defaultReportId = sampleProject.id;
const alwaysVisibleSection: RecoraNavSection = "ダッシュボード";

function getReportId(pathname: string) {
  const match = pathname.match(/^\/dashboard\/reports\/([^/]+)/);
  const segment = match?.[1];

  if (!segment || segment === "history") {
    return defaultReportId;
  }

  return segment;
}

function isNavItemActive(item: RecoraNavItem, pathname: string) {
  if (item.href === "/dashboard" || item.href === "/dashboard/reports") {
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
  const reportId = getReportId(pathname);
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-b border-slate-900 bg-[#061936] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
          <div className="flex h-full flex-col bg-[linear-gradient(160deg,#061936_0%,#071f46_48%,#020816_100%)]">
            <div className="px-4 py-5">
              <Link href="/dashboard" className="flex items-center gap-3 px-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)]">
                  R
                </span>
                <span>
                  <span className="block text-xl font-bold tracking-normal">Recora</span>
                  <span className="block text-xs font-medium text-blue-100/75">レコラ</span>
                </span>
              </Link>

              <div className="mt-5 rounded-lg border border-white/10 bg-white/7 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-100/80">
                  <PanelTop className="h-3.5 w-3.5 text-blue-300" />
                  現在のプロジェクト
                </div>
                <Link
                  href={`/dashboard/reports/${reportId}/overview`}
                  className="mt-2 block text-sm font-bold leading-5 text-white hover:text-blue-100"
                >
                  {sampleProject.name}
                </Link>
                <div className="mt-3 flex items-center justify-between text-xs text-blue-100/70">
                  <span>{sampleProject.period}</span>
                  <span className="rounded-sm bg-blue-500/20 px-2 py-0.5 font-semibold text-blue-100">
                    サンプル
                  </span>
                </div>
              </div>
            </div>

            <nav className="relative flex-1 space-y-3 overflow-y-auto px-3 pb-7">
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
              <div className="pointer-events-none sticky bottom-0 h-7 bg-gradient-to-t from-[#020816] to-transparent" />
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-lg border border-white/10 bg-white/7 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">山田 太郎</p>
                    <p className="truncate text-xs text-blue-100/65">sample@recora.ai</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)]">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-5 lg:px-6 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
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
          "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-blue-100/50 transition-colors hover:bg-white/7 hover:text-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400/70",
          isActiveSection && "bg-white/8 text-blue-50"
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
        "group flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-bold text-blue-50/78 transition-colors hover:bg-white/10 hover:text-white",
        nested && "ml-2 border-l border-white/8 pl-3",
        isActive && "bg-blue-600 text-white shadow-[0_12px_26px_rgba(37,99,235,0.35)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.status === "preparing" ? (
          <span
            className={cn(
              "mt-0.5 inline-flex rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-100/60",
              isActive && "bg-white/18 text-blue-50"
            )}
          >
            準備中
          </span>
        ) : null}
      </span>
    </Link>
  );
}
