import Link from "next/link";

import { MarketingShell } from "@/components/recora/marketing/marketing-shell";
import { createMarketingMetadata } from "@/lib/recora/marketing-site";
import { recoraPlans, type RecoraPlan } from "@/lib/recora/public-pricing";

export const metadata = createMarketingMetadata({ title: "料金｜Recora", description: "Recoraの料金プラン。AI質問数、選べるAIサービス数、1回診断・毎日計測、改善提案の有無を比較できます。すべて税込価格です。", pathname: "/pricing" });

const primaryControl = "min-h-11 rounded-lg bg-[#073d35] px-4 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-px hover:bg-[#052e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2";

export default function PricingPage() {
  return <MarketingShell><section className="mx-auto max-w-[1240px] px-5 pb-12 pt-14 sm:px-8 lg:pt-20"><p className="text-xs font-bold tracking-[0.12em] text-[#116a57]">料金</p><h1 className="mt-4 text-[clamp(2.4rem,5vw,4.6rem)] font-bold leading-[1.08] tracking-[-0.055em]">必要な確認の深さに、<br />合うプランを選ぶ。</h1><p className="mt-6 max-w-2xl text-base leading-8 text-[#526b65]">確認するAI質問数、選べるAIサービス数、1回診断または毎日計測にあわせて選べます。すべて税込価格です。</p></section><section className="border-y border-[#dbe7e3] bg-white"><div className="mx-auto grid max-w-[1240px] gap-4 px-5 py-12 sm:grid-cols-2 sm:px-8 xl:grid-cols-3">{recoraPlans.map((plan) => <PlanCard key={plan.id} plan={plan}/>)}</div></section><section className="mx-auto max-w-[1240px] px-5 py-7 text-xs leading-6 text-[#718681] sm:px-8"><p>AIモデル数は、選べるAIサービス数です。改善提案は、結果をもとに次に確認するページを整理する機能です。改善結果を保証するものではありません。</p></section><section className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8 lg:pb-24"><div className="flex flex-col gap-5 rounded-2xl border border-[#cfdeda] bg-[#eaf4f0] p-7 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold text-[#173a35]">どのプランから始めるか、相談する。</h2><p className="mt-2 text-sm text-[#667c76]">計測したい質問や継続利用について相談できます。</p></div><Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#8aaba3] bg-white px-5 text-sm font-bold text-[#173a35] transition hover:bg-[#f4f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2" href="/contact">お問い合わせ</Link></div></section></MarketingShell>;
}

function PlanCard({ plan }: { plan: RecoraPlan }) {
  return <article className="flex min-h-[330px] flex-col border border-[#cfdeda] bg-white p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-[#173a35]">{plan.name}</h2><strong className="text-lg tabular-nums text-[#102a25]">{plan.priceLabel}</strong></div><p className="mt-3 text-sm leading-6 text-[#667c76]">{plan.description}</p><dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e1ebe7] pt-4 text-sm"><Info label="支払い" value={plan.billing === "free" ? "無料" : plan.billing === "one_time" ? "1回払い" : "月額"}/><Info label="AI質問数" value={`${plan.questions}`}/><Info label="AIモデル数" value={`${plan.models}`}/><Info label="計測" value={plan.measurement}/><Info label="改善提案" value={plan.improvement ? "あり" : "なし"}/></dl><div className="mt-auto pt-6"><Link className={`inline-flex w-full items-center justify-center ${primaryControl}`} href={plan.billing === "free" ? "/signup" : "/contact"}>{plan.ctaLabel}</Link></div></article>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-[#718681]">{label}</dt><dd className="mt-1 font-bold text-[#315a52]">{value}</dd></div>;
}
