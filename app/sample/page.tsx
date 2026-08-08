import { FileSearch, MessageSquareText, Share2 } from "lucide-react";

import { MarketingShell, PrimaryLink } from "@/components/recora/marketing/marketing-shell";
import { ReportPreview } from "@/components/recora/marketing/report-preview";
import { createMarketingMetadata } from "@/lib/recora/marketing-site";

export const metadata = createMarketingMetadata({
  title: "表示例｜Recora",
  description: "Recoraの診断結果の表示例。比較質問に対する候補と説明、AIが参照した情報、次に確認するページを一つにまとめます。",
  pathname: "/sample"
});

const readingPoints = [
  ["何が変わったか", "候補、説明、AIが参照した情報のどこに変化があったかを確認します。", MessageSquareText],
  ["何を見直すか", "比較ページ、料金ページ、導入事例など、次に確認するページを決めます。", FileSearch],
  ["誰と共有するか", "質問と確認結果をまとめ、会議やページ確認に持ち込める形にします。", Share2]
] as const;

export default function SamplePage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-[1120px] px-5 pb-12 pt-14 sm:px-8 lg:pt-20">
        <p className="text-xs font-bold tracking-[0.12em] text-[#116a57]">表示例</p>
        <h1 className="mt-4 max-w-[13ch] text-[clamp(2.35rem,4.5vw,4.25rem)] font-bold leading-[1.12] tracking-[-0.045em] text-[#102a25] [overflow-wrap:anywhere]">比較質問から、<br />次に見るページまで。</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#526b65]">一つの比較質問について、候補と説明の違い、AIが参照した情報、次に確認するページを、同じ診断結果にまとめます。</p>
        <div className="mt-10 sm:mt-12"><ReportPreview variant="report" /></div>
      </section>

      <section className="border-y border-[#dbe7e3] bg-[#eaf4f0]">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:py-20">
          <div><h2 className="max-w-[10ch] text-3xl font-bold leading-[1.18] tracking-[-0.04em] text-[#102a25] sm:text-4xl">診断結果を、次の判断に使う。</h2><p className="mt-5 max-w-md text-base leading-8 text-[#526b65]">「出た・出ない」で終わらず、社内で何を確認するかを決めるための材料として残します。</p></div>
          <div className="divide-y divide-[#cfdeda] border-y border-[#cfdeda]">{readingPoints.map(([title, copy, Icon]) => <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-6" key={title}><Icon aria-hidden size={19} className="mt-1 text-[#116a57]" /><div><h3 className="text-lg font-bold text-[#173a35]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-7 text-[#667c76]">{copy}</p></div></article>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-2xl bg-[#073d35] px-6 py-12 text-white sm:px-10 sm:py-16">
          <div className="absolute -right-12 -top-16 grid w-[28rem] gap-3 opacity-15" aria-hidden="true"><div className="h-14 rounded-xl border border-white/70" /><div className="ml-12 h-20 rounded-xl border border-white/70" /><div className="h-14 rounded-xl border border-white/70" /></div>
          <div className="relative max-w-2xl"><h2 className="text-3xl font-bold leading-[1.18] tracking-[-0.04em] sm:text-4xl">御社で確認する質問を、決める。</h2><p className="mt-4 max-w-xl text-base leading-8 text-[#d4e8e1]">無料登録後に、サービスの特徴と見込み客が重視する条件をもとに、確認する質問を整理します。</p><div className="mt-8"><PrimaryLink className="bg-white text-[#073d35] hover:bg-[#edf6f2]" href="/signup">無料登録で、質問を整理する</PrimaryLink></div></div>
        </div>
      </section>
    </MarketingShell>
  );
}
