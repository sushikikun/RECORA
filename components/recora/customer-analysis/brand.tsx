"use client";
import Link from "next/link";
import {
  DataRichPanel,
  DataRichStackedBar
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  RadarComparison,
  ReportDataTable,
  ResponsiveMatrix
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

const rivals=["Trailbase","SignalNest","MentionMap","RankLens"];

export function BrandAdvancedPanels({ reportBase }: { reportBase: string }) {
  return (
    <>
      <DataRichPanel title="掲載位置分布" description="選択期間に自社掲載を確認できた有効回答を分母に、1位・2〜3位・4位以下・本文言及の構成比を表示します。">
        <DataRichStackedBar segments={[
          {key:"first",label:"1位",value:24,className:"bg-[#0B6B57]"},
          {key:"top3",label:"2〜3位",value:38,className:"bg-[#53A58F]"},
          {key:"lower",label:"4位以下",value:21,className:"bg-[#A9D1C5]"},
          {key:"mention",label:"本文言及",value:17,className:"bg-[#D9E9E4]"}
        ]} />
      </DataRichPanel>
      <DataRichPanel title="買い手判断軸の自社・競合比較" description="同一質問・同一モデルで比較できた384件を対象に、買い手が重視する判断軸ごとの差をレーダーと数値で確認します。">
        <RadarComparison
          title="Recora vs Trailbase"
          labels={["価格説明","信頼性","導入容易性","根拠透明性","運用支援","比較明瞭性"]}
          selfValues={[52,68,61,76,72,49]}
          rivalValues={[64,72,69,58,63,78]}
          rivalName="Trailbase"
          observations={384}
          axisLabel="買い手判断軸"
          detailType="buyer-axis-matchup"
        />
      </DataRichPanel>
      <DataRichPanel title="プロンプト直接対決" description="選択期間の同一質問・同一日・同一モデルの回答を比較し、自社勝ち・競合勝ち・引分・両方不在・比較不能に分類します。">
        <ReportDataTable detailType="brand-matchup" columns={["競合","自社勝ち","競合勝ち","引分","両方不在","比較不能","詳細"]} rows={rivals.map((rival,index)=>[
          rival,[32,41,47,52][index]+"件",[58,45,38,31][index]+"件",[9,11,8,12][index]+"件",[14,12,16,13][index]+"件",[3,2,4,2][index]+"件",
          <Link key={rival} href={reportBase+"/leaderboard/"+rival.toLowerCase()} className="font-bold text-[#075E44] underline">根拠を見る</Link>
        ])} />
      </DataRichPanel>
      <DataRichPanel title="競合置換マップ" description="選択期間に自社が掲載されなかった有効回答を対象に、代わりに掲載されたブランドをペルソナ・トピック・モデル別に確認します。">
        <ReportDataTable detailType="brand-replacement" columns={["置換先","自社不在・競合掲載","強いペルソナ","強いトピック","主なモデル","比較条件"]} rows={[
          ["Trailbase","58件","決裁者","競合比較","GPT / Gemini","同一質問・同一日"],
          ["SignalNest","45件","編集担当","引用元","Gemini","同一質問・同一日"],
          ["MentionMap","38件","マーケ責任者","改善施策","Perplexity","同一質問・同一日"]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="共起・共引用の関係" description="選択期間の有効回答を対象に、各ブランドがどの情報源と同じ回答内に現れたかを比較します。">
        <ResponsiveMatrix detailType="brand-source" rows={["Recora","Trailbase","SignalNest","MentionMap"]} columns={["recora.jp","marketing-ai.jp","レビュー","コミュニティ"]} values={[
          [74,48,33,21],[31,65,58,36],[22,54,62,43],[18,41,49,57]
        ]} />
      </DataRichPanel>
    </>
  );
}
