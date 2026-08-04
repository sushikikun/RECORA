"use client";
import Link from "next/link";
import {
  DataRichBadge,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  RadarComparison,
  ReportDataTable,
  ResponsiveMatrix
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

const topics=["料金","競合比較","引用元","導入・運用","改善施策","ブランド印象"];
const self=[52,57,42,61,67,59];

export function TopicAnalysisViews({ reportBase }: { reportBase:string }) {
  return (
    <>
      <DataRichPanel title="トピック一覧" description="正確な値・差・勝敗・観測数を省略せず表示します。">
        <ReportDataTable detailType="topic-competitive-performance" columns={["トピック","自社AI表示率","競合AI表示率","差","勝敗","有効比較","根拠"]} rows={topics.map((topic,index)=>{
          const rival=[64,78,59,66,64,71][index];
          return [
            topic,self[index]+"%",rival+"%",(self[index]-rival>0?"+":"")+(self[index]-rival)+"pt",
            <DataRichBadge key="result" tone={self[index]>=rival?"green":"amber"}>{self[index]>=rival?"自社勝ち":"競合勝ち"}</DataRichBadge>,
            [312,384,296,328,341,305][index]+"件",
            <Link key="link" href={reportBase+"/prompts/p0"+((index%4)+1)} className="font-bold text-[#075E44] underline">該当質問</Link>
          ];
        })} />
      </DataRichPanel>
      <DataRichPanel title="競合別レーダー" description="切り替えず、主要競合を縦にすべて表示します。各レーダーの下に正確な表があります。">
        <div className="space-y-5">
          <RadarComparison title="対 Trailbase" labels={topics} selfValues={self} rivalValues={[64,78,59,66,64,71]} rivalName="Trailbase" observations={384} axisLabel="トピック" detailType="topic-competitive-performance" />
          <RadarComparison title="対 SignalNest" labels={topics} selfValues={self} rivalValues={[54,62,64,55,58,57]} rivalName="SignalNest" observations={376} axisLabel="トピック" detailType="topic-competitive-performance" />
          <RadarComparison title="対 MentionMap" labels={topics} selfValues={self} rivalValues={[41,49,53,44,52,62]} rivalName="MentionMap" observations={365} axisLabel="トピック" detailType="topic-competitive-performance" />
        </div>
      </DataRichPanel>
      <DataRichPanel title="全競合ヒートマップ" description="多数比較はヒートマップで俯瞰し、下の勝敗リストで正確な値を確認します。">
        <ResponsiveMatrix detailType="topic-brand" rows={topics} columns={["Recora","Trailbase","SignalNest","MentionMap","RankLens"]} values={[
          [52,64,54,41,39],[57,78,62,49,44],[42,59,64,53,51],
          [61,66,55,44,47],[67,64,58,52,49],[59,71,57,62,54]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="競合マッチアップ勝敗" description="競合数が増えても検索・並べ替え・ページングで全件到達する前提です。">
        <ReportDataTable detailType="brand-matchup" columns={["競合","勝率","自社勝ち","競合勝ち","引分","比較不能","観測数"]} rows={[
          ["Trailbase","31%","32件","58件","9件","3件","384件"],
          ["SignalNest","43%","41件","45件","11件","2件","376件"],
          ["MentionMap","51%","47件","38件","8件","4件","365件"],
          ["RankLens","58%","52件","31件","12件","2件","358件"]
        ]} />
      </DataRichPanel>
    </>
  );
}
