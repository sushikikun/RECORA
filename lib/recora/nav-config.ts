import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Cpu,
  Database,
  Gauge,
  Home,
  Layers3,
  Lightbulb,
  Link2,
  MessageSquareText,
  Radar,
  Settings,
  Swords,
  Users
} from "lucide-react";

export type RecoraNavStatus = "ready" | "preparing";

export type RecoraNavSection =
  | "ホーム"
  | "レポート"
  | "測定管理"
  | "設定";

export type RecoraNavItem = {
  label: string;
  href: string;
  section: RecoraNavSection;
  status: RecoraNavStatus;
  icon: LucideIcon;
  description?: string;
};

export type RecoraNavGroup = {
  label: RecoraNavSection;
  items: RecoraNavItem[];
};

const sectionOrder: RecoraNavSection[] = [
  "ホーム",
  "レポート",
  "測定管理",
  "設定"
];

// P1/Pending:
// - 「測定条件」「根拠確認」はレポート配下の専用route作成後に追加する。
// - 「新しい測定」「測定プロファイル」は今回のnavには出さない。
// - 現行runs画面は「実行履歴」として残す。
export function buildRecoraNavItems(reportId: string): RecoraNavItem[] {
  const reportBase = `/dashboard/reports/${reportId}`;

  return [
    {
      label: "ホーム",
      href: "/dashboard",
      section: "ホーム",
      status: "ready",
      icon: Gauge,
      description: "レポート横断の数字、推移、全体傾向を確認します。"
    },
    {
      label: "レポート一覧",
      href: "/dashboard/reports",
      section: "レポート",
      status: "ready",
      icon: Home
    },
    {
      label: "レポート概要",
      href: reportBase,
      section: "レポート",
      status: "ready",
      icon: Radar
    },
    {
      label: "AI回答",
      href: `${reportBase}/conversations`,
      section: "レポート",
      status: "ready",
      icon: MessageSquareText
    },
    {
      label: "ブランド比較",
      href: `${reportBase}/leaderboard`,
      section: "レポート",
      status: "ready",
      icon: Swords
    },
    {
      label: "参照元",
      href: `${reportBase}/sources`,
      section: "レポート",
      status: "ready",
      icon: Database
    },
    {
      label: "改善候補",
      href: `${reportBase}/recommendations`,
      section: "レポート",
      status: "ready",
      icon: Lightbulb
    },
    {
      label: "実行履歴",
      href: `${reportBase}/runs`,
      section: "測定管理",
      status: "ready",
      icon: ClipboardList,
      description: "現行画面では新しい測定と実行履歴が同居しているため、実行履歴として表示します。"
    },
    {
      label: "プロジェクト設定",
      href: "/dashboard/config/project",
      section: "設定",
      status: "ready",
      icon: Settings
    },
    {
      label: "ペルソナ",
      href: "/dashboard/config/personas",
      section: "設定",
      status: "ready",
      icon: Users
    },
    {
      label: "トピック・プロンプト",
      href: "/dashboard/config/topics-prompts",
      section: "設定",
      status: "ready",
      icon: Layers3
    },
    {
      label: "比較ブランド",
      href: "/dashboard/config/competitors",
      section: "設定",
      status: "ready",
      icon: Swords
    },
    {
      label: "AIモデル",
      href: "/dashboard/config/models",
      section: "設定",
      status: "ready",
      icon: Cpu
    },
    {
      label: "チーム",
      href: "/dashboard/config/team",
      section: "設定",
      status: "preparing",
      icon: Users
    },
    {
      label: "外部連携",
      href: "/dashboard/config/api-integrations",
      section: "設定",
      status: "preparing",
      icon: Link2
    }
  ];
}

export function buildRecoraNavGroups(reportId: string): RecoraNavGroup[] {
  const items = buildRecoraNavItems(reportId);

  return sectionOrder.map((section) => ({
    label: section,
    items: items.filter((item) => item.section === section)
  }));
}

export const reportDetailTabs = {
  overview: ["レポート概要"],
  conversations: ["AI回答"],
  prompts: ["プロンプト分析", "プロンプト分類"],
  leaderboard: ["ブランド比較", "AI内シェア", "比較ブランド候補"],
  sources: ["参照元", "参照ページ", "ドメイン分析", "参照元の差分"],
  brandPerception: ["ブランド認識", "強み・弱み分析", "文脈・感情分析"],
  recommendations: ["改善候補", "根拠サマリー"],
  contentOpportunities: ["コンテンツ改善候補", "ページ改善候補", "改善マップ", "コンテンツ不足"],
  technicalAudit: ["サイト技術診断", "FAQ・構造化データ提案"],
  actionPlan: ["改善プラン", "30/60/90日プラン", "タスク管理"]
} as const;

export const placeholderRouteSummaries = {
  reportHistory: {
    title: "レポート履歴",
    description: "過去に作成したAI検索レポートを、期間・プロジェクト・測定状態で確認する画面です。"
  },
  runResults: {
    title: "実行履歴",
    description: "測定runの状態、開始・完了時刻、除外された観測を実行単位で確認する画面です。"
  },
  export: {
    title: "エクスポート",
    description: "レポート、表、参照元データ、改善タスクをCSVや共有用資料として出力する画面です。"
  },
  prompts: {
    title: "プロンプト分析",
    description: "プロンプト分類、意図、AI表示率、競合差分を整理し、AI回答での露出改善に使う画面です。"
  },
  recommendations: {
    title: "改善候補",
    description: "観測結果から抽出された改善候補を、優先度や根拠とともに確認する画面です。根拠確認が必要な項目は未確定の候補として扱います。"
  },
  misinformationRisks: {
    title: "誤情報リスク",
    description: "AI回答内の誤認、古い情報、競合との混同、参照元の弱さを確認するRecora独自の監視画面です。"
  },
  actionPlan: {
    title: "改善プラン",
    description: "30/60/90日プランとタスク管理をまとめ、改善施策を実行に移すための画面です。"
  },
  team: {
    title: "チーム",
    description: "メンバー、権限、担当領域を管理する設定画面です。"
  },
  apiIntegrations: {
    title: "外部連携",
    description: "外部ツールとの連携状態を確認する設定画面です。"
  }
} as const;
