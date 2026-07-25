import { Check, ChevronRight, FileSearch, Link2, MessageSquareText } from "lucide-react";

const providers = ["GPT", "Gemini", "Perplexity", "Google AI Mode"];

type PreviewVariant = "hero" | "report";

export function ReportPreview({ variant = "hero" }: { variant?: PreviewVariant }) {
  const isReport = variant === "report";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#cfdfda] bg-white shadow-[0_24px_70px_rgba(15,53,45,0.10)]" aria-label="Recora診断結果の表示例">
      <div className="flex items-center justify-between gap-3 border-b border-[#dbe7e3] px-4 py-3 text-xs sm:px-5">
        <div className="min-w-0"><b className="text-[#173a35]">Recora 比較診断</b><span className="ml-2 text-[#718681]">比較質問の確認結果</span></div>
        <span className="shrink-0 rounded-full border border-[#d4e6df] bg-[#eff7f4] px-2.5 py-1 font-bold text-[#116a57]">表示例</span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-4 border-b border-[#dbe7e3] pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div><p className="text-xs font-bold tracking-[0.08em] text-[#116a57]">比較質問 / 03</p><h2 className="mt-2 max-w-[28rem] text-lg font-bold leading-7 text-[#102a25]">「導入を検討する人は、何を比べているか」</h2><p className="mt-1 text-xs leading-5 text-[#667c76]">同じ質問で、候補、説明、AIが参照した情報の変化を確認します。</p></div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-[#667c76] sm:text-right"><div><dt className="inline">確認条件：</dt><dd className="inline font-bold text-[#315a52]">表示例</dd></div><div><dt className="inline">確認回：</dt><dd className="inline font-bold text-[#315a52]">前回・今回</dd></div></dl>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="overflow-hidden rounded-xl border border-[#dbe7e3] bg-white"><div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-[#dbe7e3] px-4 py-3 text-xs"><b className="text-[#173a35]">候補と説明</b><span className="text-[#718681]">同じ条件で確認</span></div><CandidateRow name="自社" explanation="AI検索での見え方を確認" own /><CandidateRow name="競合A" explanation="比較しやすさを説明" /><CandidateRow name="競合B" explanation="料金の分かりやすさを説明" added /></div>
          <div className="rounded-xl border border-[#dbe7e3] bg-[#fbfdfc] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#173a35]"><MessageSquareText aria-hidden size={15} className="text-[#116a57]" /><span>今回、説明で増えた条件</span></div><p className="mt-3 text-sm font-bold leading-6 text-[#315a52]">比較のしやすさと、料金の分かりやすさ</p><p className="mt-3 text-xs leading-5 text-[#667c76]">候補に出たかだけでなく、AIが何を違いとして説明したかを残します。</p></div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-xl border border-[#dbe7e3] bg-[#fbfdfc] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-bold text-[#173a35]"><Link2 aria-hidden size={15} className="text-[#116a57]" /><span>AIが参照した情報</span></div><span className="text-xs text-[#718681]">情報の種類</span></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><SourceChip label="公式サイト" detail="料金" /><SourceChip label="比較記事" detail="導入時の比較" /><SourceChip label="導入事例" detail="活用例" /></div></div>
          <div className="rounded-xl border border-[#9dcfc1] bg-[#edf8f4] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#173a35]"><FileSearch aria-hidden size={15} className="text-[#116a57]" /><span>次に確認するページ</span></div><div className="mt-3 space-y-2 text-xs font-semibold text-[#315a52]"><NextPage label="比較ページ" priority="優先" /><NextPage label="料金ページ" priority="確認" /></div></div>
        </div>

        {isReport && <div className="mt-4 grid gap-4 border-t border-[#dbe7e3] pt-4 sm:grid-cols-2"><div className="rounded-xl border border-[#dbe7e3] bg-white p-4"><p className="text-xs font-bold text-[#526b65]">対象AIサービス</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{providers.map((provider) => <div className="flex items-center justify-between rounded-lg border border-[#e1ebe7] px-3 py-2 text-xs" key={provider}><b className="text-[#315a52]">{provider}</b><span className="text-[#116a57]">確認対象</span></div>)}</div></div><div className="rounded-xl border border-[#dbe7e3] bg-[#fbfdfc] p-4"><p className="text-xs font-bold text-[#526b65]">共有するときに残すこと</p><p className="mt-3 text-sm font-bold leading-6 text-[#315a52]">比較質問、候補と説明の違い、参照情報、次に確認するページ</p><p className="mt-3 text-xs leading-5 text-[#667c76]">社内で、何から確認するかを話すための診断結果です。</p></div></div>}

        <div className="mt-4 flex gap-3 border-t border-[#dbe7e3] pt-4 text-xs leading-5 text-[#667c76]"><Check aria-hidden size={16} className="mt-0.5 shrink-0 text-[#116a57]" /><p>これは表示例です。実際の結果は、確認する質問、AIサービス、確認時点によって変わります。</p></div>
      </div>
    </section>
  );
}

function CandidateRow({ name, explanation, own = false, added = false }: { name: string; explanation: string; own?: boolean; added?: boolean }) {
  return <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#e4eeeb] px-4 py-3 text-xs last:border-b-0"><b className={own ? "text-[#116a57]" : "text-[#315a52]"}>{name}</b><span className="min-w-0 text-[#667c76]">{explanation}</span><span className={`rounded-full px-2 py-1 font-bold ${added ? "bg-[#edf8f4] text-[#116a57]" : own ? "bg-[#eaf4f0] text-[#116a57]" : "bg-[#f0f4f2] text-[#526b65]"}`}>{added ? "今回追加" : "候補"}</span></div>;
}

function SourceChip({ label, detail }: { label: string; detail: string }) {
  return <div className="rounded-lg border border-[#d4e6df] bg-white px-3 py-2 text-xs"><b className="block text-[#315a52]">{label}</b><span className="mt-1 block text-[#718681]">{detail}</span></div>;
}

function NextPage({ label, priority }: { label: string; priority: string }) {
  return <div className="flex items-center justify-between gap-3"><span>{label}</span><span className="rounded-full bg-white px-2 py-1 text-[#116a57]">{priority}<ChevronRight aria-hidden className="ml-1 inline" size={12} /></span></div>;
}
