"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  PanelNote,
  ResponsiveMatrix
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

const personas=["導入担当","決裁者","マーケ責任者","編集担当","代理店担当"];
const topics=["料金","競合比較","引用元","導入・運用","改善施策","ブランド印象"];

export function PersonaTopicAdvancedPanels({
  reportBase,
  models=["GPT","Gemini","Perplexity","Google AI Mode"]
}: {
  reportBase:string;
  models?:string[];
}) {
  return (
    <>
      <DataRichPanel title="ペルソナ × 競合" description="誰に対して、どの競合が多く掲載されるか。">
        <ResponsiveMatrix detailType="persona-brand" rows={personas} columns={["Recora","Trailbase","SignalNest","MentionMap"]} values={[
          [62,71,58,46],[57,76,61,43],[69,70,66,54],[50,64,59,48],[61,68,57,52]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="トピック × 競合" description="どの話題をどのブランドが占有しているか。">
        <ResponsiveMatrix detailType="topic-brand" rows={topics} columns={["Recora","Trailbase","SignalNest","MentionMap"]} values={[
          [52,68,54,41],[57,78,62,49],[42,59,64,53],[61,66,55,44],[67,64,58,52],[59,71,57,62]
        ]} />
      </DataRichPanel>
      <DataRichPanel title="モデル × 競合" description="契約モデル数1〜4に応じて行を増減します。">
        <ResponsiveMatrix detailType="model-brand" rows={models} columns={["Recora","Trailbase","SignalNest","MentionMap"]} values={[
          [62,74,63,48],[54,71,66,51],[59,69,58,55],[66,78,61,49]
        ].slice(0,models.length)} />
      </DataRichPanel>
      <DataRichPanel title="個別に分析する" description="情報量が多いペルソナ・トピックは、対象名から全画面の分析へ進みます。">
        <div className="grid gap-3 lg:grid-cols-2">
          <Link href={reportBase+"/persona-topics/personas/marketing-lead"} className="group flex min-h-28 min-w-0 items-start justify-between gap-4 border border-[#D6DFDB] bg-[#F8FAF9] p-4 transition hover:border-[#8EB4A7] hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-[#667085]">ペルソナ</span>
              <span className="mt-1 block text-base font-semibold text-[#101828]">マーケ責任者</span>
              <span className="mt-2 block text-xs leading-5 text-[#5D6B66]">全トピック、競合、モデル、引用元、期間変化をまとめて分析</span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#075E44] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <Link href={reportBase+"/persona-topics/topics/competitor-comparison"} className="group flex min-h-28 min-w-0 items-start justify-between gap-4 border border-[#D6DFDB] bg-[#F8FAF9] p-4 transition hover:border-[#8EB4A7] hover:bg-[#F1F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B382D] focus-visible:ring-offset-2">
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-[#667085]">トピック</span>
              <span className="mt-1 block text-base font-semibold text-[#101828]">競合比較</span>
              <span className="mt-2 block text-xs leading-5 text-[#5D6B66]">全ペルソナ、ブランド勝敗、モデル差、引用元、期間変化をまとめて分析</span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#075E44] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </DataRichPanel>
      <DataRichPanel title="固定質問集合のカバレッジ監査" description="質問集合は固定のまま、ペルソナ×購買段階の偏りを確認します。">
        <ResponsiveMatrix detailType="persona-stage" rows={["導入担当","決裁者","マーケ責任者","編集担当"]} columns={["認知","情報収集","比較検討","選定"]} values={[
          [6,8,7,4],[3,5,8,6],[7,9,10,5],[5,8,6,2]
        ]} suffix="問" />
        <PanelNote>質問0件・1件のセルと、特定モデルで継続欠測するセルを測定品質として表示します。</PanelNote>
      </DataRichPanel>
    </>
  );
}
