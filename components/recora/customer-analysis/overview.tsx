"use client";
import {
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  DetailLink,
  MentionCitationQuadrant,
  OutcomeFunnel
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

export function OverviewAdvancedPanels({ reportBase }: { reportBase: string }) {
  const trendItems = [
    "AI表示率",
    "SOV",
    "平均掲載位置",
    "ランキング",
    "公式サイト引用率",
    "安定性",
    "変化寄与"
  ];

  return (
    <>
      <DataRichPanel title="推移・変化" description="概要では前日差を確認し、期間推移は専用ページで同じ条件のまま詳しく確認します。">
        <ul className="grid grid-cols-2 gap-px overflow-hidden border border-[#DDE5E1] bg-[#DDE5E1] sm:grid-cols-4" aria-label="推移ページで確認できる項目">
          {trendItems.map((item, index) => (
            <li key={item} className="flex min-h-12 min-w-0 items-center gap-2 bg-[#FAFCFB] px-3 py-2.5 last:col-span-2">
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-[#7A8983]">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 break-words text-[12px] font-bold leading-5 text-[#24332E]">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <DetailLink
            href={reportBase + "/trends"}
            title="推移・変化を開く"
            description="7項目のグラフ、モデル比較、観測数、安定性、重要変化を縦にすべて表示"
          />
        </div>
      </DataRichPanel>
      <DataRichPanel title="回答結果と情報源の分岐" description="ブランド掲載と自社引用は包含関係ではないため、二つの経路と2×2で確認します。">
        <div className="space-y-8">
          <OutcomeFunnel
            title="回答内でのブランド掲載"
            interactive={false}
            stages={[
              { label: "有効回答", value: 14976, total: 14976 },
              { label: "自社掲載", value: 8536, total: 14976 },
              { label: "上位3位以内", value: 5242, total: 14976 },
              { label: "先頭掲載", value: 2038, total: 14976 }
            ]}
          />
          <div className="border-t border-[#E5E7EB] pt-8">
            <OutcomeFunnel
              title="自社情報が参照された回答"
              interactive={false}
              stages={[
                { label: "有効回答", value: 14976, total: 14976 },
                { label: "自社ページ取得", value: 6012, total: 14976 },
                { label: "自社ページ引用", value: 4643, total: 14976 },
                { label: "引用先ページに自社名あり", value: 3894, total: 14976 }
              ]}
            />
          </div>
        </div>
        <div className="mt-8 border-t border-[#E5E7EB] pt-7"><MentionCitationQuadrant interactive={false} /></div>
      </DataRichPanel>
    </>
  );
}
