import { MarketingShell } from "@/components/recora/marketing/marketing-shell";
import { createMarketingMetadata } from "@/lib/recora/marketing-site";

export const metadata = createMarketingMetadata({
  title: "お問い合わせ｜Recora",
  description: "Recoraの導入、プラン、計測する質問についてのご相談はこちらから。",
  pathname: "/contact"
});

const control = "rounded-lg border border-[#cfdeda] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2";

export default function ContactPage({ searchParams }: { searchParams?: { status?: string } }) {
  const status = searchParams?.status;
  const message = status === "sent" ? "お問い合わせを受け付けました。" : status === "invalid" ? "入力内容を確認して、もう一度お試しください。" : status === "unavailable" ? "現在、フォーム送信の準備中です。時間をおいて再度お試しください。" : status === "failed" ? "送信できませんでした。時間をおいて再度お試しください。" : undefined;

  return <MarketingShell><section className="mx-auto grid max-w-[1120px] gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:pb-24 lg:pt-20"><div><p className="text-xs font-bold tracking-[0.12em] text-[#116a57]">お問い合わせ</p><h1 className="mt-4 text-[clamp(2.4rem,5vw,4.6rem)] font-bold leading-[1.08] tracking-[-0.055em]">導入について、<br />相談する。</h1><p className="mt-6 max-w-md text-base leading-8 text-[#526b65]">プラン選びや、計測したい質問、組織での使い方についてご相談ください。</p></div><div className="border border-[#cfdeda] bg-white p-5 shadow-[0_18px_55px_rgba(15,53,45,0.08)] sm:p-8">{message && <p className="mb-6 rounded-lg border border-[#d4e6df] bg-[#eff7f4] px-4 py-3 text-sm font-semibold text-[#116a57]">{message}</p>}<form action="/api/contact" method="post" className="grid gap-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="お名前" name="name"/><Field label="会社名" name="company"/></div><Field label="メールアドレス" name="email" type="email"/><label className="grid gap-2 text-sm font-bold text-[#315a52]"><span>ご相談の種類</span><select name="topic" className={`${control} min-h-11 px-3`}><option>導入・プランについて</option><option>計測したい質問について</option><option>継続利用について</option><option>その他</option></select></label><label className="grid gap-2 text-sm font-bold text-[#315a52]"><span>ご相談内容</span><textarea name="message" required minLength={20} maxLength={5000} rows={7} className={`${control} resize-y px-3 py-3 leading-7`} placeholder="現在の状況や、確認したいことをご記入ください…"/></label><input className="hidden" name="website" tabIndex={-1} autoComplete="off"/><button className="min-h-12 rounded-lg bg-[#073d35] px-5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-px hover:bg-[#052e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2" type="submit">お問い合わせを送信する</button><p className="text-xs leading-6 text-[#718681]">送信内容はお問い合わせへの対応にのみ利用します。</p></form></div></section></MarketingShell>;
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  const autoComplete = name === "name" ? "name" : name === "company" ? "organization" : name === "email" ? "email" : undefined;
  return <label className="grid gap-2 text-sm font-bold text-[#315a52]"><span>{label}</span><input className={`${control} min-h-11 px-3`} name={name} type={type} required maxLength={160} autoComplete={autoComplete}/></label>;
}
