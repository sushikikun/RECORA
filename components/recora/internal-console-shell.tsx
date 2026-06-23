"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RecoraInternalAdminAccess } from "@/lib/recora/internal-admin-access";
import { buildRecoraInternalNavItems, type RecoraInternalNavItem } from "@/lib/recora/internal-console-nav";
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

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-[#DDE8E5] bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="px-5 py-6">
              <Link href="/internal" className="flex items-center gap-3 px-1">
                <LogoMark />
                <span>
                  <span className="block text-xl font-bold tracking-normal">Recora</span>
                  <span className="block text-xs font-bold text-[#64748B]">Internal Console</span>
                </span>
              </Link>

              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
                ローカル内部運用専用。公開環境では表示しません。
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
              {navItems.map((item) => (
                <InternalNavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#DDE8E5] bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 px-4 py-4 sm:px-5 lg:px-7 xl:flex-row xl:items-center xl:justify-between xl:px-8">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[#00796B]">内部運用</p>
                <h1 className="mt-1 text-lg font-bold tracking-normal text-[#0F172A]">ローカル限定コンソール</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-sm border-amber-200 bg-amber-50 text-amber-800">
                  <LockKeyhole className="mr-1 h-3.5 w-3.5" />
                  {access.routeStatusLabel}
                </Badge>
                <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-700">
                  内部認証: {access.authStatusLabel}
                </Badge>
                <Badge variant="outline" className="rounded-sm border-slate-200 bg-slate-50 text-slate-700">
                  Supabase read: {access.supabaseReadConfigLabel}
                </Badge>
              </div>
            </div>
          </header>

          <main className="min-w-0">
            <div className="mx-auto w-full max-w-[1480px] px-4 py-7 sm:px-5 lg:px-7 xl:px-8">
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
  const isActive = item.href === "/internal"
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      title={item.description}
      className={cn(
        "group flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-bold text-[#64748B] transition-colors hover:bg-[#E6F4F1] hover:text-[#005C50]",
        isActive && "bg-[#E6F4F1] text-[#005C50] shadow-[inset_3px_0_0_#00796B]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

function LogoMark() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#00796B] text-sm font-black text-white shadow-[0_12px_28px_rgba(0,121,107,0.22)]">
      <ShieldCheck className="h-5 w-5" />
    </span>
  );
}
