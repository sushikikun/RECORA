import { ArrowRight } from "lucide-react";

export function GeoEducationSections() {
  return (
    <>
      <section className="border-y border-[#dbe7e3] bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="text-sm font-bold text-[#116a57]">AI時代に増えた、新しい観測点</p>
              <h2 className="mt-4 max-w-[13ch] text-3xl font-bold leading-[1.2] tracking-normal text-[#102a25] sm:text-4xl">
                検索結果を見る前に、AIの回答で比較が進む。
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#526b65]">
                見込み客が自然な文章で質問すると、AIが候補、違い、判断材料を一つの回答にまとめて示すことがあります。企業が確認すべき対象は、検索順位だけでなく「回答の中でどう扱われたか」まで広がっています。
              </p>
            </div>
            <SearchJourney />
          </div>
        </div>
      </section>

      <section className="bg-[#0b352f] text-white">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-24">
          <div>
            <p className="text-sm font-bold text-[#9fd3c5]">GEO / LLMOとは</p>
            <h2 className="mt-4 max-w-[15ch] text-3xl font-bold leading-[1.2] tracking-normal sm:text-4xl">
              AIにどう答えられているかを、観測して整える。
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#d5e7e2]">
              GEOやLLMOは、AIの回答で自社がどう理解され、誰と比較され、どの情報が参照されているかを確認し、その根拠になる情報を整えていく取り組みです。
            </p>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#aac7c0]">
              呼び方や定義には幅があります。Recoraでは専門用語の違いより、実際の質問、回答、競合、参照情報を継続して確認することを重視します。
            </p>
          </div>
          <div className="border-y border-white/20">
            <PrincipleRow number="01" title="質問を決める" copy="買い手が比較するときの言葉から始める。" />
            <PrincipleRow number="02" title="回答を観測する" copy="候補、説明、競合、参照情報を同じ条件で残す。" />
            <PrincipleRow number="03" title="情報を整える" copy="不足している説明と、次に確認するページを決める。" />
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 text-sm text-[#c2d8d2] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-bold text-white">AIに選ばれることを保証する施策ではありません。</p>
            <p>観測できる状態をつくり、改善判断の根拠を増やす取り組みです。</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f6faf9]">
        <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold leading-[1.2] tracking-normal text-[#102a25] sm:text-4xl">
              SEOをやめる話ではない。見る場所が一つ増える。
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#526b65]">
              検索結果とAI回答は、同じウェブ上の情報を扱いながらも、利用者に見える形が異なります。SEOの取り組みに加えて、AI回答の中での見え方も確認します。
            </p>
          </div>
          <SeoAndGeoComparison />
        </div>
      </section>

    </>
  );
}

function SearchJourney() {
  const rows = [
    {
      label: "従来の検索",
      accent: false,
      steps: ["キーワード", "検索結果", "ページを読む", "比較する"],
    },
    {
      label: "AIでの情報収集",
      accent: true,
      steps: ["自然な質問", "AIの回答", "候補・違い・参照情報", "比較する"],
    },
  ];

  return (
    <div className="border-y border-[#cfdeda]">
      {rows.map((row) => (
        <div className="grid gap-4 border-b border-[#dbe7e3] py-6 last:border-b-0 lg:grid-cols-[150px_minmax(0,1fr)] lg:items-center" key={row.label}>
          <p className={`text-sm font-bold ${row.accent ? "text-[#116a57]" : "text-[#526b65]"}`}>{row.label}</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1.25fr_auto_1fr] sm:items-center">
            {row.steps.map((step, index) => (
              <div className="contents" key={step}>
                <div className={`min-w-0 border-l-2 px-3 py-2 text-sm font-bold ${row.accent ? "border-[#66ad9a] bg-[#edf8f4] text-[#173a35]" : "border-[#cfdeda] bg-[#f7f9f8] text-[#526b65]"}`}>
                  {step}
                </div>
                {index < row.steps.length - 1 && <ArrowRight aria-hidden className="hidden text-[#8aa29c] sm:block" size={15} />}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="pb-5 pt-1 text-xs leading-6 text-[#718681]">
        検索結果の順位と、AI回答内の候補・説明・参照情報は、分けて確認します。
      </p>
    </div>
  );
}

function PrincipleRow({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className="grid gap-3 border-b border-white/15 py-6 last:border-b-0 sm:grid-cols-[48px_160px_minmax(0,1fr)] sm:items-start sm:gap-5">
      <span className="font-mono text-xs font-bold text-[#80bdad]">{number}</span>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="text-sm leading-7 text-[#c2d8d2]">{copy}</p>
    </div>
  );
}

function SeoAndGeoComparison() {
  return (
    <div className="mt-10 overflow-hidden border-y border-[#cfdeda] bg-white">
      <div className="grid border-b border-[#dbe7e3] sm:grid-cols-[180px_1fr_1fr]">
        <div className="hidden bg-[#f2f6f4] p-5 sm:block" />
        <div className="border-b border-[#dbe7e3] p-5 sm:border-b-0 sm:border-l">
          <p className="text-xs font-bold text-[#718681]">これまでの主な観測</p>
          <h3 className="mt-2 text-lg font-bold text-[#173a35]">SEO</h3>
        </div>
        <div className="p-5 sm:border-l">
          <p className="text-xs font-bold text-[#116a57]">追加する観測</p>
          <h3 className="mt-2 text-lg font-bold text-[#173a35]">GEO・LLMO / Recora</h3>
        </div>
      </div>
      <ComparisonLine label="見る場所" seo="検索結果とウェブページ" geo="AIが生成した回答" />
      <ComparisonLine label="主に見るもの" seo="順位、表示、流入、ページ" geo="候補、説明、比較、参照情報" />
      <ComparisonLine label="問い" seo="どのページが見つかったか" geo="誰が挙がり、どう説明されたか" />
      <div className="grid bg-[#edf5f2] p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-5">
        <p className="text-sm font-bold text-[#173a35]">共通する土台</p>
        <p className="mt-2 text-sm leading-7 text-[#526b65] sm:mt-0">
          分かりやすいサービス説明、料金、比較情報、導入事例、FAQ、信頼できる第三者情報。Recoraは、そのどこから確認するかを整理します。
        </p>
      </div>
    </div>
  );
}

function ComparisonLine({ label, seo, geo }: { label: string; seo: string; geo: string }) {
  return (
    <div className="grid border-b border-[#dbe7e3] sm:grid-cols-[180px_1fr_1fr]">
      <p className="bg-[#f7f9f8] p-4 text-xs font-bold text-[#667c76] sm:p-5">{label}</p>
      <p className="border-t border-[#e4eeeb] p-4 text-sm font-semibold leading-6 text-[#526b65] sm:border-l sm:border-t-0 sm:p-5">{seo}</p>
      <p className="border-l-2 border-[#8fc9b9] bg-[#fbfdfc] p-4 text-sm font-bold leading-6 text-[#315a52] sm:border-l sm:p-5">{geo}</p>
    </div>
  );
}
