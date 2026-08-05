"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, LockKeyhole, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RecoraInternalAdminAccess } from "@/lib/recora/internal-admin-access";
import {
  buildRecoraInternalNavItems,
  getRecoraInternalNavItem,
  type RecoraInternalNavItem
} from "@/lib/recora/internal-console-nav";
import { cn } from "@/lib/utils";

export function InternalConsoleShell({
  children,
  access
}: {
  children: React.ReactNode;
  access: RecoraInternalAdminAccess;
}) {
  const pathname = usePathname();
  const navItems = buildRecoraInternalNavItems(access);
  const currentItem = getRecoraInternalNavItem(pathname);

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-b border-[#DDE8E5] bg-[#FCFEFD] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="px-5 pb-4 pt-6">
              <Link href="/internal" className="flex items-center gap-3 rounded-xl px-1 py-1">
                <LogoMark />
                <span className="min-w-0">
                  <span className="block text-xl font-black tracking-[-0.02em] text-[#10231F]">Recora</span>
                  <span className="block text-xs font-bold tracking-wide text-[#667872]">ADMIN CONTROL ROOM</span>
                </span>
              </Link>
            </div>

            <div className="px-5 pb-2">
              <p className="px-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#91A09B]">Operations</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-5" aria-label="管理画面">
              {navItems.map((item) => (
                <InternalNavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>

            <div className="border-t border-[#E4ECEA] px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl bg-[#F1F6F4] px-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#527068] shadow-sm">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#243832]">{access.actor.label}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[#7A8D87]">全P0領域を確認可能</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[#E0E9E6] bg-white px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#91A09B]">Development environment</p>
                <div className="mt-2 space-y-2">
                  <EnvironmentRow icon={<LockKeyhole className="h-3.5 w-3.5" />} label={access.routeStatusLabel} tone="amber" />
                  <EnvironmentRow icon={<Database className="h-3.5 w-3.5" />} label={`Read DB: ${access.supabaseReadConfigLabel}`} tone={access.supabaseReadConfigLabel === "設定済み" ? "green" : "slate"} />
                  <EnvironmentRow label={`認証: ${access.authStatusLabel}`} tone="slate" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#DDE8E5] bg-white/95 backdrop-blur">
            <div className="mx-auto flex min-h-[76px] w-full max-w-[1540px] flex-col gap-3 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#00796B]">Recora Admin</p>
                <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="truncate text-lg font-black tracking-[-0.02em] text-[#10231F]">
                    {currentItem?.label ?? "管理画面"}
                  </h1>
                  {currentItem?.description ? (
                    <p className="hidden max-w-2xl truncate text-xs font-semibold text-[#7A8D87] 2xl:block">{currentItem.description}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-[#CFE0DB] bg-[#F5FAF8] px-3 py-1 text-[11px] font-bold text-[#526D65]">
                  対象: 全体
                </Badge>
                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  運用画面
                </Badge>
              </div>
            </div>
          </header>

          <main className="min-w-0">
            <div className="mx-auto w-full max-w-[1540px] px-4 py-7 sm:px-6 xl:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function InternalNavLink({ item, pathname }: { item: RecoraInternalNavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive = getRecoraInternalNavItem(pathname)?.href === item.href;

  return (
    <Link
      href={item.href}
      title={item.description}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#64756F] transition-colors hover:bg-[#EDF6F3] hover:text-[#005C50]",
        isActive && "bg-[#E3F1ED] text-[#005C50] shadow-[inset_3px_0_0_#00796B]"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

function EnvironmentRow({
  icon,
  label,
  tone
}: {
  icon?: React.ReactNode;
  label: string;
  tone: "green" | "amber" | "slate";
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold text-[#60736C]">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          tone === "green" && "bg-emerald-50 text-emerald-700",
          tone === "amber" && "bg-amber-50 text-amber-700",
          tone === "slate" && "bg-slate-100 text-slate-500"
        )}
      >
        {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function LogoMark() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00796B] text-lg font-black text-white shadow-[0_12px_26px_rgba(0,121,107,0.22)]">
      R
    </span>
  );
}
