import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  Cpu,
  Database,
  Download,
  FileText,
  Gauge,
  History,
  Home,
  Layers3,
  Lightbulb,
  LineChart,
  Link2,
  MessageSquareText,
  Radar,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Swords,
  Users,
  Workflow
} from "lucide-react";

export type RecoraNavStatus = "ready" | "preparing";

export type RecoraNavSection =
  | "ダッシュボード"
  | "レポート"
  | "モニタリング"
  | "改善"
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
  "ダッシュボード",
  "レポート",
  "モニタリング",
  "改善",
  "設定"
];

export function buildRecoraNavItems(reportId: string): RecoraNavItem[] {
  const reportBase = `/dashboard/reports/${reportId}`;

  return [
    {
      label: "ダッシュボード",
      href: "/dashboard",
      section: "ダッシュボード",
      status: "ready",
      icon: Gauge
    },
    {
      label: "レポート概要",
      href: "/dashboard/reports",
      section: "レポート",
      status: "ready",
      icon: Home
    },
    {
      label: "レポート履歴",
      href: "/dashboard/reports/history",
      section: "レポート",
      status: "preparing",
      icon: History
    },
    {
      label: "測定結果",
      href: `${reportBase}/runs`,
      section: "レポート",
      status: "preparing",
      icon: ClipboardList
    },
    {
      label: "エクスポート",
      href: `${reportBase}/export`,
      section: "レポート",
      status: "preparing",
      icon: Download
    },
    {
      label: "概要",
      href: `${reportBase}/overview`,
      section: "モニタリング",
      status: "ready",
      icon: Radar
    },
    {
      label: "AI回答ログ",
      href: `${reportBase}/conversations`,
      section: "モニタリング",
      status: "ready",
      icon: MessageSquareText
    },
    {
      label: "プロンプト分析",
      href: `${reportBase}/prompts`,
      section: "モニタリング",
      status: "preparing",
      icon: Search
    },
    {
      label: "競合ランキング",
      href: `${reportBase}/leaderboard`,
      section: "モニタリング",
      status: "ready",
      icon: Swords
    },
    {
      label: "参照元分析",
      href: `${reportBase}/sources`,
      section: "モニタリング",
      status: "ready",
      icon: Database
    },
    {
      label: "推移",
      href: `${reportBase}/trends`,
      section: "モニタリング",
      status: "ready",
      icon: LineChart
    },
    {
      label: "選定基準分析",
      href: `${reportBase}/buyer-criteria`,
      section: "モニタリング",
      status: "ready",
      icon: Scale
    },
    {
      label: "ブランド認識",
      href: `${reportBase}/brand-perception`,
      section: "モニタリング",
      status: "ready",
      icon: BrainCircuit
    },
    {
      label: "改善提案",
      href: `${reportBase}/recommendations`,
      section: "改善",
      status: "preparing",
      icon: Lightbulb
    },
    {
      label: "コンテンツ改善案",
      href: `${reportBase}/content-opportunities`,
      section: "改善",
      status: "ready",
      icon: FileText
    },
    {
      label: "サイト技術診断",
      href: `${reportBase}/technical-audit`,
      section: "改善",
      status: "ready",
      icon: ShieldCheck
    },
    {
      label: "誤情報リスク",
      href: `${reportBase}/misinformation-risks`,
      section: "改善",
      status: "preparing",
      icon: AlertTriangle
    },
    {
      label: "改善プラン",
      href: `${reportBase}/action-plan`,
      section: "改善",
      status: "preparing",
      icon: Workflow
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
      label: "競合",
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
  overview: ["概要", "AIモデル別の違い"],
  conversations: ["AI回答ログ", "AIモデル別の違い"],
  prompts: ["プロンプト分析", "プロンプト分類"],
  leaderboard: ["競合ランキング", "AI内シェア", "新規競合候補"],
  sources: ["参照元分析", "参照ページ", "ドメイン分析", "参照元の差分", "参照分析"],
  brandPerception: ["ブランド認識", "強み・弱み分析", "文脈・感情分析"],
  recommendations: ["改善提案", "スコア内訳"],
  contentOpportunities: ["コンテンツ改善案", "ページ改善案", "改善マップ", "コンテンツ不足"],
  technicalAudit: ["サイト技術診断", "FAQ・構造化データ提案"],
  actionPlan: ["改善プラン", "30/60/90日プラン", "タスク管理"]
} as const;

export const placeholderRouteSummaries = {
  reportHistory: {
    title: "レポート履歴",
    description: "過去に作成したAI検索レポートを、期間・プロジェクト・測定状態で確認する画面です。"
  },
  runResults: {
    title: "測定結果",
    description: "ペルソナ、トピック、プロンプト、AIモデルごとの取得結果を測定単位で確認する画面です。"
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
    title: "改善提案",
    description: "AI表示率の低下や競合差分の要因を分解し、優先度順に改善提案を確認する画面です。"
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
