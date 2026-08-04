"use client";

import Link from "next/link";
import {
  DataRichBadge,
  DataRichKpiStrip,
  DataRichPanel
} from "@/components/recora/data-rich/data-rich-primitives";
import {
  MetricLineChart,
  RadarComparison,
  ReportDataTable,
  ResponsiveMatrix,
} from "@/components/recora/customer-dashboard-v03-analysis-visuals";

const topicLabels = ["料金", "競合比較", "引用元", "導入・運用", "改善施策", "ブランド印象"];
const personaLabels = ["導入担当", "決裁者", "マーケ責任者", "編集担当", "代理店担当"];
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

const representativeQuestions: Record<string, string> = {
  "料金": "GEO対策ツールの料金と契約条件を比較したい",
  "競合比較": "自社に合うGEO対策ツールを比較したい",
  "引用元": "AI検索で引用される情報源を増やすには？",
  "導入・運用": "GEO対策ツールの導入手順と運用負荷は？",
  "改善施策": "AI表示率を改善する施策の優先順位は？",
  "ブランド印象": "AIはこのブランドをどのように説明している？"
};

type TopicSource = {
  domain: string;
  id: string;
  cover: number;
  selfWins: number;
  competitorWins: number;
  modelCount: number;
};

type TopicProfile = {
  focus: string;
  sampleQuestion: string;
  aiPresence: number;
  sov: number;
  averagePosition: number;
  brandRank: number;
  citationRate: number;
  observations: number;
  competitorPresence: number;
  competitors: string[];
  sources: TopicSource[];
  claim: {
    slug: string;
    title: string;
    summary: string;
    verdict: string;
  };
};

const competitorComparisonProfile: TopicProfile = {
  focus: "候補サービスの違い、選定基準、推奨順位",
  sampleQuestion: representativeQuestions["競合比較"],
  aiPresence: 57,
  sov: 22,
  averagePosition: 2.9,
  brandRank: 3,
  citationRate: 28,
  observations: 2112,
  competitorPresence: 78,
  competitors: ["Trailbase", "SignalNest", "MentionMap", "RankLens"],
  sources: [
    { domain: "marketing-ai.jp", id: "marketing-ai-jp", cover: 76, selfWins: 24, competitorWins: 52, modelCount: 4 },
    { domain: "trailbase.io", id: "trailbase-io", cover: 61, selfWins: 4, competitorWins: 57, modelCount: 3 },
    { domain: "recora.jp", id: "recora-jp", cover: 48, selfWins: 41, competitorWins: 7, modelCount: 4 }
  ],
  claim: {
    slug: "competitor-position",
    title: "主張：比較回答で競合が上位候補として説明される",
    summary: "8回答・3モデル・11日継続。比較軸と公式情報との差分を確認",
    verdict: "自社の比較根拠が不足"
  }
};

const topicProfiles: Record<string, TopicProfile> = {
  "料金": {
    focus: "料金体系、契約条件、費用対効果",
    sampleQuestion: representativeQuestions["料金"],
    aiPresence: 52,
    sov: 20,
    averagePosition: 3.2,
    brandRank: 4,
    citationRate: 24,
    observations: 1968,
    competitorPresence: 64,
    competitors: ["SignalNest", "Trailbase", "RankLens", "MentionMap"],
    sources: [
      { domain: "saas-review.example", id: "saas-review", cover: 73, selfWins: 18, competitorWins: 55, modelCount: 4 },
      { domain: "industry-report.example", id: "industry-report", cover: 58, selfWins: 15, competitorWins: 43, modelCount: 3 },
      { domain: "recora.jp", id: "recora-jp", cover: 44, selfWins: 38, competitorWins: 6, modelCount: 4 }
    ],
    claim: {
      slug: "pricing-old",
      title: "主張：料金情報が旧プランで説明される",
      summary: "6回答・2モデル・14日継続。公式料金との差分を確認",
      verdict: "公式料金と不一致"
    }
  },
  "競合比較": competitorComparisonProfile,
  "引用元": {
    focus: "引用されるドメイン、ページ、情報源タイプ",
    sampleQuestion: representativeQuestions["引用元"],
    aiPresence: 42,
    sov: 18,
    averagePosition: 3.5,
    brandRank: 5,
    citationRate: 39,
    observations: 1840,
    competitorPresence: 64,
    competitors: ["MentionMap", "SignalNest", "Trailbase", "RankLens"],
    sources: [
      { domain: "marketing-ai.jp", id: "marketing-ai-jp", cover: 88, selfWins: 31, competitorWins: 57, modelCount: 4 },
      { domain: "community.example", id: "community", cover: 67, selfWins: 20, competitorWins: 47, modelCount: 3 },
      { domain: "recora.jp", id: "recora-jp", cover: 56, selfWins: 49, competitorWins: 7, modelCount: 4 }
    ],
    claim: {
      slug: "unsupported-source",
      title: "主張：第三者情報だけで自社機能が説明される",
      summary: "9回答・3モデル・8日継続。引用元と公式ページの差分を確認",
      verdict: "自社一次情報の引用不足"
    }
  },
  "導入・運用": {
    focus: "導入期間、初期設定、日次の運用負荷",
    sampleQuestion: representativeQuestions["導入・運用"],
    aiPresence: 61,
    sov: 25,
    averagePosition: 2.6,
    brandRank: 3,
    citationRate: 32,
    observations: 2056,
    competitorPresence: 66,
    competitors: ["Trailbase", "DeployScope", "SignalNest", "RankLens"],
    sources: [
      { domain: "docs.trailbase.io", id: "trailbase-io", cover: 81, selfWins: 21, competitorWins: 60, modelCount: 4 },
      { domain: "community.example", id: "community", cover: 62, selfWins: 27, competitorWins: 35, modelCount: 3 },
      { domain: "recora.jp", id: "recora-jp", cover: 59, selfWins: 51, competitorWins: 8, modelCount: 4 }
    ],
    claim: {
      slug: "onboarding-time",
      title: "主張：導入には一か月以上必要と説明される",
      summary: "7回答・2モデル・10日継続。実際の導入条件との差分を確認",
      verdict: "標準導入期間と不一致"
    }
  },
  "改善施策": {
    focus: "改善候補、優先順位、期待できる変化",
    sampleQuestion: representativeQuestions["改善施策"],
    aiPresence: 67,
    sov: 27,
    averagePosition: 2.3,
    brandRank: 2,
    citationRate: 36,
    observations: 2184,
    competitorPresence: 64,
    competitors: ["SignalNest", "MentionMap", "Trailbase", "RankLens"],
    sources: [
      { domain: "marketing-ai.jp", id: "marketing-ai-jp", cover: 83, selfWins: 36, competitorWins: 47, modelCount: 4 },
      { domain: "content-strategy.example", id: "content-strategy", cover: 65, selfWins: 29, competitorWins: 36, modelCount: 4 },
      { domain: "recora.jp", id: "recora-jp", cover: 61, selfWins: 54, competitorWins: 7, modelCount: 4 }
    ],
    claim: {
      slug: "improvement-effect",
      title: "主張：単一施策だけでAI表示率が改善すると説明される",
      summary: "5回答・2モデル・7日継続。観測根拠と施策条件を確認",
      verdict: "改善効果の根拠不足"
    }
  },
  "ブランド印象": {
    focus: "ブランドの特徴、評価、誤認されている事実",
    sampleQuestion: representativeQuestions["ブランド印象"],
    aiPresence: 59,
    sov: 23,
    averagePosition: 2.8,
    brandRank: 3,
    citationRate: 31,
    observations: 1920,
    competitorPresence: 71,
    competitors: ["MentionMap", "RankLens", "SignalNest", "Trailbase"],
    sources: [
      { domain: "saas-review.example", id: "saas-review", cover: 79, selfWins: 25, competitorWins: 54, modelCount: 4 },
      { domain: "community.example", id: "community", cover: 64, selfWins: 22, competitorWins: 42, modelCount: 3 },
      { domain: "recora.jp", id: "recora-jp", cover: 52, selfWins: 45, competitorWins: 7, modelCount: 4 }
    ],
    claim: {
      slug: "brand-message",
      title: "主張：ブランドの対象顧客が限定的に説明される",
      summary: "6回答・3モデル・12日継続。公式メッセージとの差分を確認",
      verdict: "公式ブランド定義と不一致"
    }
  }
};

function getTopicProfile(topicName: string): TopicProfile {
  return topicProfiles[topicName] ?? {
    ...competitorComparisonProfile,
    focus: `${topicName}に関する比較・判断材料`,
    sampleQuestion: `${topicName}について比較するときの判断基準は？`,
    claim: {
      ...competitorComparisonProfile.claim,
      title: `主張：${topicName}の説明に公式情報との差がある`,
      summary: `${topicName}に関する回答と公式情報の差分を確認`
    }
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getOrderedTopics(topicName: string) {
  if (topicLabels.includes(topicName)) {
    return [topicName, ...topicLabels.filter((topic) => topic !== topicName)];
  }
  return [topicName, ...topicLabels.slice(0, 5)];
}

function TopicCompetitiveViews({
  reportBase,
  topicName,
  profile
}: {
  reportBase: string;
  topicName: string;
  profile: TopicProfile;
}) {
  const topics = getOrderedTopics(topicName);
  const baseScores: Record<string, number> = {
    "料金": 52,
    "競合比較": 57,
    "引用元": 42,
    "導入・運用": 61,
    "改善施策": 67,
    "ブランド印象": 59,
    [topicName]: profile.aiPresence
  };
  const selfScores = topics.map((topic) => baseScores[topic] ?? profile.aiPresence);
  const rivalAdjustments = [
    [profile.competitorPresence - profile.aiPresence, 12, 17, 5, -3, 12],
    [8, 5, 22, -6, -9, -2],
    [-4, -8, 11, -17, -15, 3],
    [-8, -13, 9, -14, -18, -5]
  ];
  const rivalScores = profile.competitors.map((_, rivalIndex) =>
    selfScores.map((score, topicIndex) => clampScore(score + rivalAdjustments[rivalIndex][topicIndex]))
  );
  const observationCounts = [384, 376, 365, 358];

  return (
    <>
      <DataRichPanel
        title={`${topicName}と関連トピックの比較`}
        description={`${topicName}を起点に、関連トピックの値・差・勝敗・代表質問・観測数を省略せず表示します。`}
      >
        <ReportDataTable
          detailType="topic-competitive-performance"
          columns={["トピック", "代表質問", "自社AI表示率", `${profile.competitors[0]} AI表示率`, "差", "勝敗", "有効比較", "根拠"]}
          rows={topics.map((topic, index) => {
            const difference = selfScores[index] - rivalScores[0][index];
            return [
              topic,
              topic === topicName
                ? profile.sampleQuestion
                : representativeQuestions[topic] ?? `${topic}について知りたい`,
              `${selfScores[index]}%`,
              `${rivalScores[0][index]}%`,
              `${difference > 0 ? "+" : ""}${difference}pt`,
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
        title={`${topicName}の競合別レーダー`}
        description={`${topicName}で比較される主要競合を縦にすべて表示し、関連トピックまで含めて差を確認します。`}
      >
        <div className="space-y-5">
          {profile.competitors.slice(0, 3).map((competitor, index) => (
            <RadarComparison
              key={competitor}
              title={`${topicName}：対 ${competitor}`}
              labels={topics}
              selfValues={selfScores}
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
        title={`${topicName}の全競合ヒートマップ`}
        description={`${topicName}と関連トピックについて、多数の競合を一画面で俯瞰します。`}
      >
        <ResponsiveMatrix
          detailType="topic-brand"
          rows={topics}
          columns={["Recora", ...profile.competitors]}
          values={topics.map((_, topicIndex) => [
            selfScores[topicIndex],
            ...rivalScores.map((scores) => scores[topicIndex])
          ])}
        />
      </DataRichPanel>
      <DataRichPanel
        title={`${topicName}の競合マッチアップ勝敗`}
        description={`${topicName}に分類された質問だけで、競合別の勝敗と比較不能数を確認します。`}
      >
        <ReportDataTable
          detailType="brand-matchup"
          columns={["競合", "勝率", "自社勝ち", "競合勝ち", "引分", "比較不能", "観測数"]}
          rows={profile.competitors.map((competitor, index) => [
            competitor,
            `${[31, 43, 51, 58][index]}%`,
            `${[32, 41, 47, 52][index]}件`,
            `${[58, 45, 38, 31][index]}件`,
            `${[9, 11, 8, 12][index]}件`,
            `${[3, 2, 4, 2][index]}件`,
            `${observationCounts[index]}件`
          ])}
        />
      </DataRichPanel>
    </>
  );
}

export type TopicDetailContentProps = {
  reportBase: string;
  topicName: string;
  models?: string[];
};

export function TopicDetailContent({
  reportBase,
  topicName,
  models = ["GPT", "Gemini", "Perplexity", "Google AI Mode"]
}: TopicDetailContentProps) {
  const profile = getTopicProfile(topicName);
  const personaByModel = [
    [62, 54, 59, 68],
    [55, 48, 52, 63],
    [71, 61, 67, 75],
    [49, 44, 58, 57],
    [58, 50, 55, 64]
  ].map((row) => row.slice(0, models.length));
  const modelByPersona = models.map((_, modelIndex) =>
    personaByModel.map((row) => row[modelIndex] ?? profile.aiPresence)
  );

  return (
    <>
      <DataRichKpiStrip
        layout="rows"
        columns="xl:grid-cols-5"
        items={[
          {
            label: "AI表示率",
            value: profile.aiPresence + "%",
            helper: topicName + "の回答",
            note: "前期間 +3pt",
            tone: "green"
          },
          { label: "AI内シェア（SOV）", value: profile.sov + "%", helper: topicName + "内", note: "前期間 +2pt" },
          {
            label: "平均掲載位置",
            value: profile.averagePosition + "位",
            helper: topicName + "での掲載回答",
            note: "前期間 0.2位改善"
          },
          {
            label: "ブランド順位",
            value: profile.brandRank + "位",
            helper: topicName + "のAI表示率順位"
          },
          {
            label: "公式サイト引用率",
            value: profile.citationRate + "%",
            helper: topicName + "の回答",
            note: "前期間 +4pt"
          }
        ]}
      />

      <DataRichPanel
        title={topicName + "のAI表示率推移"}
        description={topicName + "でのRecoraと先行競合のAI表示率を比較します。"}
      >
        <MetricLineChart
          detailType="topic-performance"
          series={[
            { name: "Recora", color: "#0B6B57", values: [48, 50, 49, 52, 53, 55, 56, profile.aiPresence] },
            { name: profile.competitors[0], color: "#6E7F78", values: [69, 70, 72, 71, 74, 76, 77, profile.competitorPresence] }
          ]}
          unit="%"
          deltaUnit="pt"
        />
      </DataRichPanel>

      <DataRichPanel
        title={topicName + "のAIモデル×ペルソナ"}
        description={topicName + "でも、AIモデルとペルソナの組み合わせによる差を確認します。"}
      >
        <ReportDataTable
          detailType="persona-model-performance"
          columns={["AIモデル", ...personaLabels]}
          rows={models.map((model, modelIndex) => [
            <AnalysisModelIdentity key={model} name={model} />,
            ...modelByPersona[modelIndex].map((value) => value + "%")
          ])}
        />
      </DataRichPanel>

      <TopicCompetitiveViews reportBase={reportBase} topicName={topicName} profile={profile} />
    </>
  );
}
