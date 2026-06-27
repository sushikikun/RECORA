export type LandingQuestion = {
  id: string;
  theme: string;
  persona: string;
  question: string;
  self_status: "candidate" | "absent";
  competitors: string[];
  result: "self_candidate" | "competitor_only" | "neither_candidate";
  displayed_sources: string[];
};

export type RecoraLandingData = {
  schema_version: "2.0";
  company: {
    name: string;
    industry: string;
    website: string;
  };
  measurement: {
    provider_label: string;
    measured_at: string;
  };
  questions: LandingQuestion[];
  next_review_candidates: string[];
};

export const recoraLandingData = {
  schema_version: "2.0",
  company: {
    name: "令和テック株式会社",
    industry: "採用支援",
    website: "https://reiwatech.example"
  },
  measurement: {
    provider_label: "OpenAIモデル",
    measured_at: "2026-05-20T10:30:00+09:00"
  },
  questions: [
    {
      id: "q1",
      theme: "選び方",
      persona: "初めて依頼する経営者",
      question: "初めて採用支援会社を選ぶポイントは？",
      self_status: "candidate",
      competitors: ["競合B"],
      result: "self_candidate",
      displayed_sources: ["自社｜会社選びガイド"]
    },
    {
      id: "q2",
      theme: "導入方法",
      persona: "進め方を知りたい担当者",
      question: "採用支援を依頼すると、どのように進む？",
      self_status: "candidate",
      competitors: ["競合A"],
      result: "self_candidate",
      displayed_sources: ["競合A｜導入案内"]
    },
    {
      id: "q3",
      theme: "費用",
      persona: "費用を比べる担当者",
      question: "採用支援を依頼すると費用はいくら？",
      self_status: "absent",
      competitors: ["競合A", "競合B"],
      result: "competitor_only",
      displayed_sources: ["競合A｜料金ページ", "業界比較メディア"]
    },
    {
      id: "q4",
      theme: "費用",
      persona: "費用を比べる担当者",
      question: "中小企業向けで費用対効果の高い採用支援は？",
      self_status: "absent",
      competitors: ["競合A"],
      result: "competitor_only",
      displayed_sources: ["競合A｜料金ページ"]
    },
    {
      id: "q5",
      theme: "比較",
      persona: "他社と比較している担当者",
      question: "伴走型の採用支援会社を比較したい",
      self_status: "absent",
      competitors: ["競合A", "競合C"],
      result: "competitor_only",
      displayed_sources: ["業界比較メディア", "競合B｜導入事例"]
    },
    {
      id: "q6",
      theme: "比較",
      persona: "他社と比較している担当者",
      question: "採用代行と採用コンサルは、どちらが向いている？",
      self_status: "absent",
      competitors: [],
      result: "neither_candidate",
      displayed_sources: []
    }
  ],
  next_review_candidates: ["料金目安と費用内訳", "同規模企業の導入事例", "他社との違いをまとめたページ"]
} satisfies RecoraLandingData;

export const recoraLandingFaqs = [
  {
    question: "無料診断では何がわかりますか？",
    answer:
      "主要な質問について、御社が候補に入ったか、競合だけが挙がったか、回答内にどの参照元が表示されたか、次に見直す情報は何かを確認できます。"
  },
  {
    question: "診断には何が必要ですか？",
    answer: "無料登録後、会社名、ホームページURL、主なサービスなどを入力します。SEOやAI検索の専門知識は必要ありません。"
  },
  {
    question: "なぜ無料登録が必要ですか？",
    answer: "診断結果を御社専用ページに保存し、あとから確認できるようにするためです。クレジットカードの登録は必要ありません。"
  },
  {
    question: "競合企業がわからなくても診断できますか？",
    answer: "競合が明確でない場合も診断を始められます。まずは分かる範囲の会社情報を入力してください。"
  },
  {
    question: "どのような質問を調べますか？",
    answer: "おすすめの会社、費用、他社との違い、選び方、導入方法など、見込み客が比較・検討時にAIへ尋ねる可能性が高い質問を扱います。"
  },
  {
    question: "一般的なSEO診断とは何が違いますか？",
    answer:
      "一般的なSEO診断は検索順位や技術項目を中心に確認します。Recoraは、見込み客がAIに聞きそうな質問を実際に調べ、自社と競合が回答内でどう扱われるかを質問ごとに確認します。"
  },
  {
    question: "どのAIを対象にしていますか？",
    answer: "現在はOpenAIモデルを対象にしています。対象モデルと計測日時は診断結果に表示します。"
  },
  {
    question: "AI検索からの流入増加を保証しますか？",
    answer:
      "流入やAI回答への掲載を保証するものではありません。現在の回答傾向と競合との差を把握し、ホームページの改善判断に役立てる診断です。"
  },
  {
    question: "診断結果は公開されますか？",
    answer: "診断結果は登録した利用者の専用ページで確認します。公開ページとして自動掲載されるものではありません。"
  }
] as const;

export function getRecoraLandingSummary(data: RecoraLandingData) {
  const questions = data.questions;

  return {
    questionCount: questions.length,
    selfCandidateQuestionCount: questions.filter((item) => item.result === "self_candidate").length,
    competitorOnlyQuestionCount: questions.filter((item) => item.result === "competitor_only").length,
    neitherCandidateQuestionCount: questions.filter((item) => item.result === "neither_candidate").length,
    selfPageReferenceQuestionCount: questions.filter((item) =>
      item.displayed_sources.some((source) => source.startsWith("自社"))
    ).length
  };
}
