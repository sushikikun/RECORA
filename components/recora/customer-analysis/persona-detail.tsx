"use client";

import Link from "next/link";
import {
  DataRichBadge,
  DataRichKpiStrip,
  DataRichPanel,
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  MetricLineChart,
  RadarComparison,
  ReportDataTable,
  ResponsiveMatrix,
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

const topicLabels = ["料金", "競合比較", "引用元", "導入・運用", "改善施策", "ブランド印象"];
const analysisModelLogoUrls: Record<string, string> = {
  GPT: "/recora/model-logos/openai-blossom.svg",
  Gemini: "/recora/model-logos/gemini.svg",
  Perplexity: "/recora/model-logos/perplexity.svg",
  "Google AI Mode": "/recora/model-logos/google-ai-mode.webp"
};

function AnalysisModelIdentity({ name }: { name: string }) {
  const logoUrl = analysisModelLogoUrls[name];
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.08)]" aria-label={name + "のAIモデルロゴ"}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-[10px] font-bold text-[#475467]" aria-hidden="true">{name.slice(0, 1)}</span>
        )}
      </span>
      <span className="font-bold text-[#101828]">{name}</span>
    </span>
  );
}

type PersonaSource = {
  domain: string;
  id: string;
  cover: number;
  mentions: number;
  urls: number;
  modelCount: number;
  delta: number;
};

type PersonaProfile = {
  focus: string;
  aiPresence: number;
  sov: number;
  averagePosition: number;
  citationRate: number;
  agreement: number;
  observations: number;
  topicScores: number[];
  competitors: string[];
  sources: PersonaSource[];
  sampleQuestions: string[];
  strongTopics: string[];
  weakTopics: string[];
};

const marketingLeadProfile: PersonaProfile = {
  focus: "集客施策とAI検索でのブランド露出",
  aiPresence: 69,
  sov: 28,
  averagePosition: 2.4,
  citationRate: 37,
  agreement: 74,
  observations: 2984,
  topicScores: [52, 57, 42, 61, 67, 59],
  competitors: ["Trailbase", "SignalNest", "MentionMap", "RankLens"],
  sources: [
    { domain: "marketing-ai.jp", id: "marketing-ai-jp", cover: 84, mentions: 112, urls: 7, modelCount: 4, delta: 13 },
    { domain: "recora.jp", id: "recora-jp", cover: 72, mentions: 96, urls: 9, modelCount: 4, delta: 8 },
    { domain: "saas-review.example", id: "saas-review", cover: 53, mentions: 67, urls: 4, modelCount: 3, delta: -2 },
    { domain: "community.example", id: "community", cover: 39, mentions: 51, urls: 11, modelCount: 2, delta: 6 }
  ],
  sampleQuestions: [
    "GEO対策ツールの選定基準は？",
    "AI検索の引用元を増やすには？",
    "短期間でAI表示率を改善する方法は？"
  ],
  strongTopics: ["改善施策", "競合比較", "引用元", "ブランド印象"],
  weakTopics: ["料金", "引用元", "料金", "ブランド印象"]
};

const personaProfiles: Record<string, PersonaProfile> = {
  "導入担当": {
    focus: "導入手順、連携要件、運用負荷",
    aiPresence: 64,
    sov: 24,
    averagePosition: 2.8,
    citationRate: 33,
    agreement: 71,
    observations: 2716,
    topicScores: [48, 53, 46, 72, 61, 50],
    competitors: ["Trailbase", "DeployScope", "SignalNest", "RankLens"],
    sources: [
      { domain: "docs.trailbase.io", id: "trailbase-io", cover: 79, mentions: 104, urls: 12, modelCount: 4, delta: 11 },
      { domain: "recora.jp", id: "recora-jp", cover: 68, mentions: 88, urls: 10, modelCount: 4, delta: 7 },
      { domain: "saas-review.example", id: "saas-review", cover: 57, mentions: 73, urls: 6, modelCount: 3, delta: 4 },
      { domain: "community.example", id: "community", cover: 43, mentions: 58, urls: 14, modelCount: 3, delta: -1 }
    ],
    sampleQuestions: [
      "GEO対策ツールを最短で導入する手順は？",
      "既存の分析基盤と連携できるサービスは？",
      "日次運用に必要な作業時間を比較したい"
    ],
    strongTopics: ["導入・運用", "改善施策", "引用元", "導入・運用"],
    weakTopics: ["料金", "ブランド印象", "競合比較", "料金"]
  },
  "決裁者": {
    focus: "費用対効果、導入判断、事業リスク",
    aiPresence: 58,
    sov: 21,
    averagePosition: 3.1,
    citationRate: 29,
    agreement: 68,
    observations: 2468,
    topicScores: [68, 61, 39, 55, 58, 64],
    competitors: ["SignalNest", "Trailbase", "RankLens", "MentionMap"],
    sources: [
      { domain: "saas-review.example", id: "saas-review", cover: 81, mentions: 109, urls: 8, modelCount: 4, delta: 9 },
      { domain: "industry-report.example", id: "industry-report", cover: 70, mentions: 91, urls: 5, modelCount: 4, delta: 12 },
      { domain: "trailbase.io", id: "trailbase-io", cover: 54, mentions: 72, urls: 7, modelCount: 3, delta: -3 },
      { domain: "recora.jp", id: "recora-jp", cover: 49, mentions: 64, urls: 6, modelCount: 4, delta: 5 }
    ],
    sampleQuestions: [
      "GEO対策ツールの費用対効果を比較したい",
      "導入効果を経営会議で説明する指標は？",
      "契約前に確認すべき事業リスクは？"
    ],
    strongTopics: ["料金", "競合比較", "ブランド印象", "料金"],
    weakTopics: ["引用元", "導入・運用", "引用元", "改善施策"]
  },
  "マーケ責任者": marketingLeadProfile,
  "編集担当": {
    focus: "記事制作、情報の正確性、引用獲得",
    aiPresence: 66,
    sov: 25,
    averagePosition: 2.6,
    citationRate: 42,
    agreement: 76,
    observations: 2632,
    topicScores: [44, 51, 73, 58, 69, 63],
    competitors: ["MentionMap", "ContentPilot", "SignalNest", "Trailbase"],
    sources: [
      { domain: "content-strategy.example", id: "content-strategy", cover: 87, mentions: 118, urls: 15, modelCount: 4, delta: 16 },
      { domain: "marketing-ai.jp", id: "marketing-ai-jp", cover: 73, mentions: 98, urls: 9, modelCount: 4, delta: 6 },
      { domain: "recora.jp", id: "recora-jp", cover: 65, mentions: 85, urls: 12, modelCount: 4, delta: 10 },
      { domain: "community.example", id: "community", cover: 46, mentions: 61, urls: 18, modelCount: 3, delta: 2 }
    ],
    sampleQuestions: [
      "AIに引用されやすい記事構成は？",
      "既存記事の情報不足を見つける方法は？",
      "誤ったブランド情報を修正するには？"
    ],
    strongTopics: ["引用元", "改善施策", "ブランド印象", "引用元"],
    weakTopics: ["料金", "競合比較", "導入・運用", "料金"]
  },
  "代理店担当": {
    focus: "複数顧客の比較、報告、運用効率",
    aiPresence: 62,
    sov: 23,
    averagePosition: 2.9,
    citationRate: 35,
    agreement: 70,
    observations: 2512,
    topicScores: [55, 65, 51, 67, 63, 54],
    competitors: ["RankLens", "Trailbase", "SignalNest", "MentionMap"],
    sources: [
      { domain: "agency-growth.example", id: "agency-growth", cover: 82, mentions: 108, urls: 13, modelCount: 4, delta: 14 },
      { domain: "marketing-ai.jp", id: "marketing-ai-jp", cover: 69, mentions: 92, urls: 8, modelCount: 4, delta: 5 },
      { domain: "saas-review.example", id: "saas-review", cover: 58, mentions: 76, urls: 6, modelCount: 3, delta: 3 },
      { domain: "recora.jp", id: "recora-jp", cover: 51, mentions: 69, urls: 11, modelCount: 4, delta: 9 }
    ],
    sampleQuestions: [
      "複数顧客のAI表示率を効率よく管理するには？",
      "顧客向けGEOレポートで示すべき指標は？",
      "競合差を短期間で説明できるサービスは？"
    ],
    strongTopics: ["競合比較", "導入・運用", "改善施策", "競合比較"],
    weakTopics: ["引用元", "料金", "ブランド印象", "引用元"]
  }
};

function getPersonaProfile(personaName: string): PersonaProfile {
  return personaProfiles[personaName] ?? {
    ...marketingLeadProfile,
    focus: `${personaName}の意思決定と情報ニーズ`,
    sampleQuestions: [
      `${personaName}がサービスを選ぶ基準は？`,
      `${personaName}が導入前に確認すべき情報は？`,
      `${personaName}が競合と比較するときの論点は？`
    ]
  };
}

function formatDelta(value: number, suffix: string) {
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function PersonaTopicViews({
  reportBase,
  personaName,
  profile
}: {
  reportBase: string;
  personaName: string;
  profile: PersonaProfile;
}) {
  const rivalAdjustments = [
    [12, 21, 17, 5, -3, 12],
    [2, 8, 22, -6, -9, -2],
    [-11, -8, 11, -17, -15, 3],
    [-15, -13, 9, -14, -18, -5]
  ];
  const rivalScores = profile.competitors.map((_, rivalIndex) =>
    profile.topicScores.map((score, topicIndex) =>
      clampScore(score + rivalAdjustments[rivalIndex][topicIndex])
    )
  );
  const observationCounts = [384, 376, 365, 358];

  return (
    <>
      <DataRichPanel
        title={`${personaName}のトピック一覧`}
        description={`${personaName}の質問をトピック別に分け、正確な値・差・勝敗・観測数を省略せず表示します。`}
      >
        <ReportDataTable
          detailType="topic-competitive-performance"
          columns={["トピック", "自社AI表示率", `${profile.competitors[0]} AI表示率`, "差", "勝敗", "有効比較", "根拠"]}
          rows={topicLabels.map((topic, index) => {
            const self = profile.topicScores[index];
            const rival = rivalScores[0][index];
            const difference = self - rival;
            return [
              topic,
              `${self}%`,
              `${rival}%`,
              formatDelta(difference, "pt"),
              <DataRichBadge key="result" tone={difference >= 0 ? "green" : "amber"}>
                {difference >= 0 ? "自社勝ち" : "競合勝ち"}
              </DataRichBadge>,
              `${[312, 384, 296, 328, 341, 305][index]}件`,
              <Link
                key="link"
                href={`${reportBase}/prompts/p0${(index % 4) + 1}`}
                className="font-bold text-[#075E44] underline"
              >
                該当質問
              </Link>
            ];
          })}
        />
      </DataRichPanel>
      <DataRichPanel
        title={`${personaName}の競合別レーダー`}
        description={`${personaName}の主要競合を切り替えず縦に表示し、トピックごとの勝敗を比較します。`}
      >
        <div className="space-y-5">
          {profile.competitors.slice(0, 3).map((competitor, index) => (
            <RadarComparison
              key={competitor}
              title={`対 ${competitor}`}
              labels={topicLabels}
              selfValues={profile.topicScores}
              rivalValues={rivalScores[index]}
              rivalName={competitor}
              observations={observationCounts[index]}
              axisLabel="トピック"
              detailType="topic-competitive-performance"
            />
          ))}
        </div>
      </DataRichPanel>
      <DataRichPanel
        title={`${personaName}の全競合ヒートマップ`}
        description={`${personaName}の競合が増えても、トピックごとの優劣を一画面で俯瞰できます。`}
      >
        <ResponsiveMatrix
          detailType="topic-brand"
          rows={topicLabels}
          columns={["Recora", ...profile.competitors]}
          values={topicLabels.map((_, topicIndex) => [
            profile.topicScores[topicIndex],
            ...rivalScores.map((scores) => scores[topicIndex])
          ])}
        />
      </DataRichPanel>
      <DataRichPanel
        title={`${personaName}の競合マッチアップ勝敗`}
        description={`${personaName}の質問に限った競合別の勝敗と比較不能数です。`}
      >
        <ReportDataTable
          detailType="brand-matchup"
          columns={["競合", "勝率", "自社勝ち", "競合勝ち", "引分", "比較不能", "観測数"]}
          rows={profile.competitors.map((competitor, index) => {
            const winRate = [31, 43, 51, 58][index];
            return [
              competitor,
              `${winRate}%`,
              `${[32, 41, 47, 52][index]}件`,
              `${[58, 45, 38, 31][index]}件`,
              `${[9, 11, 8, 12][index]}件`,
              `${[3, 2, 4, 2][index]}件`,
              `${observationCounts[index]}件`
            ];
          })}
        />
      </DataRichPanel>
    </>
  );
}

export type PersonaDetailContentProps = {
  reportBase: string;
  personaName: string;
  models?: string[];
};

export function PersonaDetailContent({
  reportBase,
  personaName,
  models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"]
}: PersonaDetailContentProps) {
  const profile = getPersonaProfile(personaName);

  return (
    <>
      <DataRichKpiStrip
        layout="rows"
        columns={models.length > 1 ? "xl:grid-cols-5" : "xl:grid-cols-4"}
        items={[
          {
            label: "AI表示率",
            value: profile.aiPresence + "%",
            helper: personaName + "の回答",
            note: "前期間 +4pt",
            tone: "green"
          },
          { label: "AI内シェア（SOV）", value: profile.sov + "%", helper: personaName + "内", note: "前期間 +3pt" },
          {
            label: "平均掲載位置",
            value: profile.averagePosition + "位",
            helper: personaName + "での掲載回答",
            note: "前期間 0.3位改善"
          },
          {
            label: "公式サイト引用率",
            value: profile.citationRate + "%",
            helper: personaName + "の回答",
            note: "前期間 +5pt"
          },
          ...(models.length > 1 ? [{
            label: "モデル合意度",
            value: profile.agreement + "%",
            helper: personaName + "への掲載判断",
            note: models.length + "モデル"
          }] : [])
        ]}
      />

      <DataRichPanel
        title={personaName + "のAI表示率推移"}
        description={personaName + "に対するAI表示率の変化を確認します。"}
      >
        <MetricLineChart
          detailType="persona-performance"
          series={[
            { name: personaName, color: "#0B6B57", values: [57, 58, 60, 61, 63, 62, 66, profile.aiPresence] }
          ]}
          unit="%"
          deltaUnit="pt"
        />
      </DataRichPanel>

      <PersonaTopicViews reportBase={reportBase} personaName={personaName} profile={profile} />

      <DataRichPanel
        title={personaName + "のAIモデル別比較"}
        description={personaName + "への表示を、契約中のAIモデルごとに比較します。"}
      >
        <ReportDataTable
          detailType="persona-model-performance"
          columns={["AIモデル", "AI表示率", "AI内シェア（SOV）", "平均掲載位置", "公式サイト引用率", "AI表示率が高いトピック", "AI表示率が低いトピック"]}
          rows={models.map((model, index) => [
            <AnalysisModelIdentity key={model} name={model} />,
            ([72, 61, 68, 75][index] ?? profile.aiPresence) + "%",
            ([30, 23, 27, 32][index] ?? profile.sov) + "%",
            ([2.1, 3.1, 2.5, 1.9][index] ?? profile.averagePosition) + "位",
            ([39, 28, 41, 44][index] ?? profile.citationRate) + "%",
            profile.strongTopics[index] ?? profile.strongTopics[0],
            profile.weakTopics[index] ?? profile.weakTopics[0]
          ])}
        />
      </DataRichPanel>

      <DataRichPanel
        title={personaName + "で掲載差がある質問・回答"}
        description={personaName + "の代表質問を、競合先行・自社未掲載・比較不能に分けて確認します。"}
      >
        <ReportDataTable
          detailType="prompt-question-result"
          columns={["質問", "結果", "先行競合", "AIモデル", "状態", "回答"]}
          rows={[
            [
              profile.sampleQuestions[0],
              "競合勝ち",
              profile.competitors[0],
              models[0] ? <AnalysisModelIdentity key="answer-model-1" name={models[0]} /> : "—",
              <DataRichBadge key="status-1" tone="amber">有効回答</DataRichBadge>,
              <Link key="answer-1" href={reportBase + "/conversations/a01"} className="font-bold text-[#075E44] underline">回答全文</Link>
            ],
            [
              profile.sampleQuestions[1],
              "自社未掲載",
              profile.competitors[1],
              models[1] ?? models[0] ? <AnalysisModelIdentity key="answer-model-2" name={models[1] ?? models[0]} /> : "—",
              <DataRichBadge key="status-2" tone="amber">有効回答</DataRichBadge>,
              <Link key="answer-2" href={reportBase + "/conversations/a02"} className="font-bold text-[#075E44] underline">回答全文</Link>
            ],
            [
              profile.sampleQuestions[2],
              "比較不能",
              "—",
              models[2] ?? models[0] ? <AnalysisModelIdentity key="answer-model-3" name={models[2] ?? models[0]} /> : "—",
              <DataRichBadge key="status-3" tone="red">計測失敗</DataRichBadge>,
              "回答なし"
            ]
          ]}
        />
      </DataRichPanel>
    </>
  );
}
