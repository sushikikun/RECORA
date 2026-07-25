import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";

const links = [["/product", "プロダクト"], ["/sample", "表示例"], ["/pricing", "料金"], ["/contact", "お問い合わせ"]] as const;
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#073d35] px-5 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#052e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfdeda] bg-white px-5 text-sm font-bold text-[#173a35] transition hover:bg-[#f4f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2";
const navLink = "rounded-md text-sm font-semibold text-[#526b65] transition-colors hover:text-[#073d35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-4";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6faf9] text-[#102a25]">
      <a className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-[#073d35] px-4 py-3 text-sm font-bold text-white focus-visible:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2" href="#main-content">本文へ移動</a>
      <header className="border-b border-[#dbe7e3] bg-[#f6faf9]/95">
        <div className="mx-auto flex min-h-[72px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <Brand />
          <nav className="hidden gap-6 lg:flex" aria-label="主要ナビゲーション">{links.map(([href, label]) => <Link key={href} className={navLink} href={href}>{label}</Link>)}</nav>
          <div className="hidden items-center gap-4 sm:flex"><Link className="rounded-md text-sm font-bold text-[#315a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-4" href="/login">ログイン</Link><Link className={`${primary} min-h-10 px-4`} href="/signup">無料で始める <ArrowRight aria-hidden size={15} /></Link></div>
          <details className="relative sm:hidden"><summary className="flex min-h-10 list-none items-center gap-1 rounded-lg border border-[#cfdeda] bg-white px-3 text-sm font-bold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2">メニュー <ChevronDown aria-hidden size={16} /></summary><nav className="absolute right-0 z-20 mt-2 grid w-52 gap-1 rounded-xl border border-[#cfdeda] bg-white p-2 shadow-xl">{links.map(([href, label]) => <Link key={href} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#315a52] hover:bg-[#eef5f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B]" href={href}>{label}</Link>)}<Link className={`${primary} mt-1`} href="/signup">無料で始める</Link></nav></details>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-[#dbe7e3] bg-white"><div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4"><Brand /><p className="text-sm text-[#667c76]">AI検索での見え方を、毎日計測する。</p></div><nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="フッターナビゲーション">{links.map(([href, label]) => <Link key={href} className={navLink} href={href}>{label}</Link>)}</nav></div></footer>
    </div>
  );
}

function Brand() {
  return <Link className="inline-flex items-center gap-2.5 rounded-md font-bold tracking-[-0.02em] text-[#102a25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-4" href="/"><span className="grid size-8 place-items-center rounded-md bg-[#073d35] text-xs text-white">R</span><span>Recora</span></Link>;
}

export function PrimaryLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return <Link className={twMerge(primary, "whitespace-nowrap", className)} href={href}>{children}<ArrowRight aria-hidden size={17} /></Link>;
}

export function SecondaryLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return <Link className={twMerge(secondary, "whitespace-nowrap", className)} href={href}>{children}<ArrowRight aria-hidden size={17} /></Link>;
}
